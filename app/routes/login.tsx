import { Form, useActionData } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export let action: ActionFunction = async ({ request }) => {
  return await authenticator.authenticate("form", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
};

export default function Login() {
  const actionData = useActionData();

  return (
    <div>
      <h1>Login</h1>
      <Form method="post">
        <input type="email" name="email" required />
        <input type="password" name="password" required />
        <button type="submit">Log in</button>
      </Form>
      <hr />
      <a href="/auth/github">Login with GitHub</a>
      <br />
      <a href="/auth/google">Login with Google</a>
      {actionData?.error && <p>{actionData.error}</p>}
    </div>
  );
}
