import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/services/session.server";
import { GitHubStrategy } from "remix-auth-github";
import { GoogleStrategy } from "remix-auth-google";
import { FormStrategy } from "remix-auth-form";
import invariant from "tiny-invariant";
import { prisma } from "~/services/db.server";
import bcryptjs from "bcryptjs";

// Define a user type
type User = {
  id: string;
  email: string;
  name: string;
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

      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'credentials',
          provider: 'email',
          providerAccountId: email,
          password: await bcryptjs.hash(password, 10),
        },
      });

      return user;
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

export const logout = async (request: Request) => {
  await authenticator.logout(request, { redirectTo: "/login" });
};
