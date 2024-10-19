import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { sessionStorage } from "~/services/session.server";
import { prisma } from "~/services/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("Dashboard loader started");
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const userId = session.get("userId");
  console.log("Session userId:", userId);

  if (!userId) {
    console.log("No userId in session, redirecting to login");
    return redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  console.log("User from database:", user);

  if (!user) {
    console.log("User not found in database, redirecting to login");
    return redirect("/login");
  }

  console.log("User authenticated, returning dashboard data");
  return json({ user });
}

export default function Dashboard() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      {/* Rest of your dashboard component */}
      <form action="/logout" method="post">
        <button type="submit">Logout</button>
      </form>
    </div>
  );
}
