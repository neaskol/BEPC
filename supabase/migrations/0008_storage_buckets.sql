-- Migration 0008 : Buckets Storage Supabase + RLS

-- Bucket sujets-pdf (privé, PDF seulement, max 50 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sujets-pdf',
  'sujets-pdf',
  false,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket avatars (public, images, max 5 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS : sujets-pdf
-- ============================================================

-- Admin peut uploader
CREATE POLICY "sujets_pdf_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'sujets-pdf'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Utilisateurs authentifiés peuvent lire
CREATE POLICY "sujets_pdf_select_authenticated" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'sujets-pdf'
    AND auth.role() = 'authenticated'
  );

-- Admin peut supprimer
CREATE POLICY "sujets_pdf_delete_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'sujets-pdf'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- RLS : avatars
-- ============================================================

-- Lecture publique
CREATE POLICY "avatars_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Chaque utilisateur peut uploader dans son dossier (avatars/<user_id>/...)
CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
