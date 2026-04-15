import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Rafraîchit la session — ne pas supprimer cet appel
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes protégées — redirection vers /auth/connexion si non connecté
  const protectedPaths = [
    "/dashboard",
    "/cours",
    "/entrainement",
    "/flashcards",
    "/examen-blanc",
    "/classement",
    "/defis",
    "/communaute",
    "/badges",
    "/profil",
    "/admin",
    "/parents",
  ];

  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/connexion";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
