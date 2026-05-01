-- Migration : ajout de la colonne civility à la table profiles
-- Pour pouvoir stocker la civilité (M., Mme, Mlle, Mx, ...) saisie au checkout

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS civility TEXT;
