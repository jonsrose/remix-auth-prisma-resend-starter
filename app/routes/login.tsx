import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import type { ActionFunction, ActionFunctionArgs, LoaderFunction } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { useState } from "react";
import { json, redirect } from "@remix-run/node";
import { commitSession, getSession } from "~/services/session.server";
import { AuthorizationError } from "remix-auth";

// Add this type definition
type ActionData = {
  error?: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  return { request };
};

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  try {
    console.log("Login action started");
    const clonedRequest = request.clone(); // Clone the request
    const formData = await clonedRequest.formData();
    const action = formData.get("action");
    console.log("Form action:", action);

    if (action === "signup" || action === "login") {
      try {
        const user = await authenticator.authenticate("form", request, {
          throwOnError: true
        });
        console.log("Authentication result:", user);

        if (user.id) {
          console.log("User authenticated successfully, setting session");
          const session = await getSession(request.headers.get("Cookie"));
          session.set("userId", user.id);

          console.log("Redirecting to dashboard");
          return redirect("/dashboard", {
            headers: {
              "Set-Cookie": await commitSession(session),
            },
          });
        }
      } catch (error) {
        if (error instanceof AuthorizationError) {
          console.error("Authentication error:", error.message);
          return json({ error: error.message }, { status: 400 });
        }
        
        console.error("Unexpected error:", error);
        return json({ error: "An unexpected error occurred" }, { status: 500 });
      }
    }

    console.error("Invalid action:", action);
    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return json({ error: "An unknown error occurred" }, { status: 500 });
  }
};

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  useLoaderData<{ request: Request }>();

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
      <div>
        <a href="/auth/github">Login with GitHub</a>
        <br />
        <Form action="/auth/google" method="post">
          <button type="submit">Login with Google</button>
        </Form>
      </div>
      {actionData?.error && <p>{actionData.error}</p>}
    </div>
  );
}
