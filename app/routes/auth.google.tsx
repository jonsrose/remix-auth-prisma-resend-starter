import type { ActionFunction, LoaderFunction, ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export const loader: LoaderFunction = async ({ request, params }) => {
  console.log("Google auth loader called");
  // Call the action with the full set of arguments
  return await action({ request, params } as ActionFunctionArgs);
};

export const action: ActionFunction = async ({ request }) => {
  console.log("Initiating Google auth action");
  try {
    return await authenticator.authenticate("google", request, {
      successRedirect: "/dashboard",
      failureRedirect: "/login",
    });
  } catch (error) {
    // If the error is a Response, it's likely the redirect we want
    if (error instanceof Response) return error;
    
    console.error("Error in Google auth action:", error);
    return redirect("/login");
  }
};
