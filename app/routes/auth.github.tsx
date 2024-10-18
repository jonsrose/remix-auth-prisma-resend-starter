import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export const loader: LoaderFunction = ({ request }) => {
  console.log('GitHub Auth Loader Function');
  return authenticator.authenticate("github", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
};

export const action: ActionFunction = ({ request }) => {
  console.log('GitHub Auth Action Function');
  return authenticator.authenticate("github", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
};
