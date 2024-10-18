import { Form, useActionData } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { useEffect } from "react";

// Add this type definition
type ActionData = {
  error?: string;
};

export const action: ActionFunction = async ({ request }) => {
  return await authenticator.authenticate("form", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
};

export default function Login() {
  const actionData = useActionData() as ActionData;
  // Remove the following line:
  // const navigate = useNavigate();

  useEffect(() => {
    console.log("Login component mounted");
  }, []);

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
      <Form action="/auth/google" method="post">
        <button type="submit">Login with Google</button>
      </Form>
      {actionData?.error && <p>{actionData.error}</p>}
    </div>
  );
}
