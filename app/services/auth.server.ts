import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/services/session.server";
import { GitHubStrategy } from "remix-auth-github";
import { GoogleStrategy } from "remix-auth-google";
import { FormStrategy } from "remix-auth-form";
import invariant from "tiny-invariant";
import { prisma } from "~/services/db.server";
import bcryptjs from "bcryptjs";
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';

// Define a user type
export type User = {
  id: string;
  email: string;
  name: string;
  needsVerification?: boolean;
};

// Create an instance of the authenticator
export const authenticator = new Authenticator<User>(sessionStorage);

// Base URL must be set
invariant(process.env.BASE_URL, "BASE_URL must be set");

// GitHub Strategy
invariant(process.env.GITHUB_CLIENT_ID, "GITHUB_CLIENT_ID must be set");
invariant(process.env.GITHUB_CLIENT_SECRET, "GITHUB_CLIENT_SECRET must be set");

authenticator.use(new GitHubStrategy(
  {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectURI: `${process.env.BASE_URL}/auth/github/callback`,
  },
  async ({ profile }) => {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName;

    invariant(email, "GitHub email must be available");

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email, name } });
    }

    await prisma.account.upsert({
      where: { 
        provider_providerAccountId: {
          provider: 'github',
          providerAccountId: profile.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'github',
        providerAccountId: profile.id,
      },
    });

    console.log("GitHub user created/updated:", user);
    return user;
  }
));

// Google Strategy
invariant(process.env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID must be set");
invariant(process.env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET must be set");

authenticator.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
    prompt: "select_account",
    accessType: "offline",
  },
  async ({ profile }) => {
    const email = profile.emails[0].value;
    const name = profile.displayName;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email, name } });
    }

    await prisma.account.upsert({
      where: { 
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: profile.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: profile.id,
      },
    });

    console.log("User created/updated:", user);
    return user;
  }
));

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Form Strategy for email/password
authenticator.use(
  new FormStrategy(async ({ form }) => {
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const action = form.get("action") as string;

    invariant(email, "email must be provided");
    invariant(password, "password must be provided");
    invariant(action, "action must be provided");

    let user = await prisma.user.findUnique({ where: { email } });

    if (action === "signup") {
      if (user) {
        throw new Error("User already exists");
      }

      user = await prisma.user.create({
        data: { 
          email, 
          name: email.split("@")[0],
        },
      });

      const verificationToken = uuidv4();

      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'credentials',
          provider: 'email',
          providerAccountId: email,
          password: await bcryptjs.hash(password, 10),
          verificationToken,
        },
      });

      await sendVerificationEmail(email, verificationToken);

      // Instead of throwing an error, return a special object
      return { id: user.id, email: user.email, name: user.name, needsVerification: true };
    } else if (action === "login") {
      if (!user) {
        throw new Error("Invalid login");
      }

      const account = await prisma.account.findFirst({
        where: { 
          userId: user.id, 
          provider: 'email' 
        },
      });

      if (!account || !account.password) {
        throw new Error("Invalid login");
      }

      if (!user.emailVerified) {
        throw new Error("Please verify your email before logging in");
      }

      const isValid = await bcryptjs.compare(password, account.password);
      if (!isValid) {
        throw new Error("Invalid login");
      }

      return user;
    } else {
      throw new Error("Invalid action");
    }
  })
);

invariant(process.env.EMAIL_FROM, "EMAIL_FROM must be set");  

async function sendVerificationEmail(email: string, token: string) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your email',
      html: `<p>Click <a href="${process.env.BASE_URL}/verify-email/${token}">here</a> to verify your email.</p>`
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
}

export const logout = async (request: Request) => {
  await authenticator.logout(request, { redirectTo: "/login" });
};
