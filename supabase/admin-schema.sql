-- ============================================
-- SCHEMA SQL POUR L'AUTHENTIFICATION ADMIN
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- 1. Créer le type enum pour les rôles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Créer la table user_roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- 3. Activer RLS sur user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Créer la fonction de vérification de rôle (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Politique RLS pour user_roles - les utilisateurs peuvent voir leurs propres rôles
CREATE POLICY "Users can view own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- 6. Politique RLS pour user_roles - seuls les admins peuvent modifier les rôles
CREATE POLICY "Admins can manage all roles"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Politiques RLS pour products (décommenter les politiques existantes)
-- Admins peuvent insérer des produits
CREATE POLICY "Admins can insert products"
    ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins peuvent modifier des produits
CREATE POLICY "Admins can update products"
    ON public.products
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins peuvent supprimer des produits
CREATE POLICY "Admins can delete products"
    ON public.products
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CRÉER UN UTILISATEUR ADMIN
-- Remplacez 'YOUR_USER_UUID' par l'UUID de l'utilisateur à promouvoir admin
-- ============================================
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('YOUR_USER_UUID', 'admin');

-- Pour obtenir l'UUID d'un utilisateur par email, exécutez:
-- SELECT id FROM auth.users WHERE email = 'votre-email@example.com';
