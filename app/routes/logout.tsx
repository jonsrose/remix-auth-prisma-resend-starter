import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export const action: ActionFunction = async ({ request }) => {
  await authenticator.logout(request, { redirectTo: "/login" });
};

export const loader = () => redirect("/login");
