import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { sessionStorage } from "~/services/session.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("Google auth callback loader started");
  try {
    const user = await authenticator.authenticate("google", request, {
      failureRedirect: "/login",
    });

    console.log("Authenticated user:", user);

    const session = await sessionStorage.getSession(
      request.headers.get("Cookie")
    );
    session.set("userId", user.id);

    console.log("Session after setting userId:", session.get("userId"));

    return redirect("/dashboard", {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return redirect("/login");
  }
};
