import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import Nav from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <Nav user={user} />
      <div className="mx-auto max-w-6xl px-5 py-6">{children}</div>
    </div>
  );
}
