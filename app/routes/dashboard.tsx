import { Form } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticator } from "~/services/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  return json({ user });
};

export default function Dashboard() {
  const { user } = useLoaderData<{ user: any }>();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name || user.email}!</p>
      
      {/* Logout Form */}
      <Form action="/logout" method="post">
        <button type="submit">Logout</button>
      </Form>
    </div>
  );
}
