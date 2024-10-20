import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { sessionStorage } from "~/services/session.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("Google auth callback loader started");
  try {
    console.log("Attempting to authenticate user");
    const user = await authenticator.authenticate("google", request, {
      failureRedirect: "/login",
    });

    console.log("Authenticated user:", user);

    const session = await sessionStorage.getSession(
      request.headers.get("Cookie")
    );
    session.set("userId", user.id);

    console.log("Session after setting userId:", session.get("userId"));

    console.log("Redirecting to dashboard");
    return redirect("/dashboard", {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    console.log("Redirecting to login due to error");
    return redirect("/login");
  }
};
