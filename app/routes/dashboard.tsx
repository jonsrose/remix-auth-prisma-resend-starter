import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { authenticator } from "~/services/auth.server";
import { prisma } from "~/services/db.server";
import { getSession } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("Dashboard loader started");
  const session = await getSession(request.headers.get("Cookie"));
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

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    select: { provider: true },
  });

  return json({ user, connectedAccounts: accounts.map((a: { provider: string }) => a.provider) });
}

export default function Dashboard() {
  const { user, connectedAccounts } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Welcome, {user.name || user.email}!</h1>
      <h2>Connected Accounts:</h2>
      <ul>
        {connectedAccounts.map((provider: string) => (
          <li key={provider}>{provider}</li>
        ))}
      </ul>
      <Link to="/logout">Logout</Link>
    </div>
  );
}
