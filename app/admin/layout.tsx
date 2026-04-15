import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/auth/connexion");

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, prenom")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header admin */}
      <header className="bg-gray-900 text-white px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-semibold">
              ADMIN
            </span>
            <span className="font-semibold">BEPC Mada</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a
              href="/admin/upload"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Upload PDF
            </a>
            <a
              href="/admin/contenu"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Contenu
            </a>
            <a
              href="/dashboard"
              className="text-gray-400 hover:text-white transition-colors text-xs"
            >
              ← App
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
