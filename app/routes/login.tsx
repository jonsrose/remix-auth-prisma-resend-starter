import { Form, useActionData, useNavigation } from "@remix-run/react";
import type { ActionFunction, ActionFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { useState } from "react";
import { json } from "@remix-run/node";

// Add this type definition
type ActionData = {
  error?: string;
};

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  try {
    return await authenticator.authenticate("form", request, {
      successRedirect: "/dashboard",
      throwOnError: true,
    });
  } catch (error) {
    // Handle errors
    if (error instanceof Error) {
      return json({ error: error.message });
    }
    return json({ error: "An unknown error occurred" });
  }
};

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();

  const toggleMode = () => setIsLogin(!isLogin);

  return (
    <div>
      <h1>{isLogin ? "Login" : "Sign Up"}</h1>
      <Form method="post">
        <input type="hidden" name="action" value={isLogin ? "login" : "signup"} />
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" required />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" required />
        </div>
        <button type="submit" disabled={navigation.state === "submitting"}>
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </Form>
      <button onClick={toggleMode}>
        {isLogin ? "Need an account? Sign up" : "Already have an account? Login"}
      </button>
      {actionData?.error && <p>{actionData.error}</p>}
    </div>
  );
}
