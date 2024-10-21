import { LoaderFunction, redirect } from "@remix-run/node";
import { prisma } from "~/services/db.server";
import { getSession, commitSession } from "~/services/session.server";

export const loader: LoaderFunction = async ({ params, request }) => {
  const { token } = params;

  if (!token) {
    return redirect("/login?error=Invalid verification link");
  }

  const account = await prisma.account.findFirst({
    where: { verificationToken: token },
    include: { user: true },
  });

  if (!account) {
    return redirect("/login?error=Invalid verification link");
  }

  await prisma.user.update({
    where: { id: account.userId },
    data: { emailVerified: new Date() },
  });

  await prisma.account.update({
    where: { id: account.id },
    data: { verificationToken: null },
  });

  // Create a new session for the user
  const session = await getSession(request.headers.get("Cookie"));
  session.set("userId", account.userId);

  // Redirect to the dashboard with the new session
  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

export default function VerifyEmail() {
  return null;
}
