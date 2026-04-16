// Redirect /badges → /profil/badges
import { redirect } from "next/navigation";

export default function BadgesRedirectPage() {
  redirect("/profil/badges");
}
