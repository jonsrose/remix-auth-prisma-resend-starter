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
    // Here you would find or create a user in your database
    console.log('GitHubStrategy');
    return {
      id: profile.id,
      email: profile.emails?.[0].value ?? "",
      name: profile.displayName,
    };
  }
));

// Google Strategy
invariant(process.env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID must be set");
invariant(process.env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET must be set");

authenticator.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://www-dev.aiutils.site/auth/google/callback", // Make sure this URL is correct
  },
  async ({ profile }) => {
    const email = profile.emails[0].value;
    const name = profile.displayName;

    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name },
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

    if (action === "signup") {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new Error("User already exists");
      }

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email,
          password: await bcryptjs.hash(password, 10),
          name: email.split("@")[0], // Use part of email as name
        },
      });

      return newUser;
    } else if (action === "login") {
      // Find user by email
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new Error("User not found");
      }

      // Verify password
      const isValid = await bcryptjs.compare(password, user.password);
      if (!isValid) {
        throw new Error("Invalid password");
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
