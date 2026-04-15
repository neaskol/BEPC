-- Migration 0007 : Politique RLS INSERT sur profiles (nécessaire pour l'inscription)
-- Un utilisateur authentifié peut créer son propre profil (auth.uid() = id)

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
