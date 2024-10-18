import type { LoaderFunction } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  console.log("Google auth callback loader started");
  try {
    return await authenticator.authenticate("google", request, {
      successRedirect: "/dashboard",
      failureRedirect: "/login",
    });
  } catch (error) {
    console.log("Google auth error:", error);
    if (error instanceof Response) return error;
    return new Response("Authentication failed", { status: 400 });
  }
};
