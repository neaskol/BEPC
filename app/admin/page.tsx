import { redirect } from "next/navigation";

// /admin → redirige vers /admin/contenu
export default function AdminRootPage() {
  redirect("/admin/contenu");
}
