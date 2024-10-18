import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/services/session.server";
import { GitHubStrategy } from "remix-auth-github";
import { GoogleStrategy } from "remix-auth-google";
import { FormStrategy } from "remix-auth-form";
import invariant from "tiny-invariant";

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
    callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
  },
  async ({ profile }) => {
    // Here you would find or create a user in your database
    return {
      id: profile.id,
      email: profile.emails?.[0].value ?? "",
      name: profile.displayName,
    };
  }
));

// Form Strategy for email/password
authenticator.use(new FormStrategy(async ({ form }) => {
  const email = form.get("email") as string;
  const password = form.get("password") as string;

  invariant(email, "email must be provided");
  invariant(password, "password must be provided");

  // Here you would validate the user credentials
  // For this example, we'll just return a mock user
  return {
    id: "1",
    email,
    name: "Test User",
  };
}));

export const logout = async (request: Request) => {
  await authenticator.logout(request, { redirectTo: "/login" });
};
