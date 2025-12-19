-- ============================================
-- SCHEMA SQL POUR LA TABLE PRODUCTS
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- Créer les types enum pour les catégories et badges
CREATE TYPE product_category AS ENUM ('pearls', 'bracelets', 'necklaces', 'rings', 'other');
CREATE TYPE product_badge AS ENUM ('new', 'bestseller');

-- Créer la table products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    category product_category NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    images TEXT[] NOT NULL DEFAULT '{}',
    badge product_badge,
    rating NUMERIC(2, 1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    reviews INTEGER NOT NULL DEFAULT 0 CHECK (reviews >= 0),
    variants JSONB,
    in_stock BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Créer un index sur la catégorie pour les requêtes fréquentes
CREATE INDEX idx_products_category ON public.products(category);

-- Créer un index sur le slug pour les recherches rapides
CREATE INDEX idx_products_slug ON public.products(slug);

-- Créer un index sur le badge pour les produits en vedette
CREATE INDEX idx_products_badge ON public.products(badge) WHERE badge IS NOT NULL;

-- Créer un index pour la recherche full-text
CREATE INDEX idx_products_search ON public.products USING GIN (
    to_tsvector('french', name || ' ' || description)
);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS (Row Level Security)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Politique pour lecture publique (tout le monde peut voir les produits)
CREATE POLICY "Products are publicly readable"
    ON public.products
    FOR SELECT
    USING (true);

-- Politique pour insertion/modification (optionnel - décommenter si vous avez des admins)
-- CREATE POLICY "Admins can insert products"
--     ON public.products
--     FOR INSERT
--     TO authenticated
--     WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CREATE POLICY "Admins can update products"
--     ON public.products
--     FOR UPDATE
--     TO authenticated
--     USING (public.has_role(auth.uid(), 'admin'))
--     WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CREATE POLICY "Admins can delete products"
--     ON public.products
--     FOR DELETE
--     TO authenticated
--     USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- DONNÉES DE DÉMONSTRATION
-- ============================================

INSERT INTO public.products (slug, category, name, description, price, images, badge, rating, reviews, variants, in_stock) VALUES
('perle-tahiti-ronde-aaa', 'pearls', 'Perle de Tahiti Ronde AAA', 'Magnifique perle de Tahiti parfaitement ronde, qualité AAA. Lustre exceptionnel avec des reflets verts et roses caractéristiques.', 350.00, ARRAY['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800'], 'bestseller', 4.9, 127, '{"qualities": ["AA", "AAA", "AAAA"], "diameters": ["8mm", "9mm", "10mm", "11mm", "12mm", "13mm"]}', true),

('perle-tahiti-baroque', 'pearls', 'Perle de Tahiti Baroque', 'Perle de Tahiti baroque aux formes uniques et reflets multicolores. Chaque pièce est unique.', 220.00, ARRAY['https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800'], NULL, 4.6, 78, '{"qualities": ["A", "AA", "AAA"], "diameters": ["10mm", "12mm", "14mm", "16mm"]}', true),

('lot-perles-tahiti-assorties', 'pearls', 'Lot de Perles de Tahiti Assorties', 'Ensemble de 3 perles de Tahiti aux nuances variées. Idéal pour créations personnalisées.', 590.00, ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800'], 'new', 4.8, 34, '{"qualities": ["AA", "AAA"], "diameters": ["9mm", "10mm", "11mm"]}', true),

('bracelet-or-perles-tahiti', 'bracelets', 'Bracelet Or & Perles de Tahiti', 'Bracelet élégant en or 18 carats orné de perles de Tahiti sélectionnées. Fermoir sécurisé.', 1250.00, ARRAY['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800'], 'new', 4.8, 45, '{"sizes": ["16cm", "17cm", "18cm", "19cm", "20cm"]}', true),

('bracelet-multi-perles', 'bracelets', 'Bracelet Multi-Perles de Tahiti', 'Bracelet spectaculaire composé de multiples perles de Tahiti aux nuances variées.', 1680.00, ARRAY['https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800'], NULL, 4.8, 62, '{"sizes": ["16cm", "17cm", "18cm", "19cm"]}', true),

('collier-perles-tahiti-or', 'necklaces', 'Collier Perles de Tahiti & Or', 'Somptueux collier composé de perles de Tahiti parfaitement assorties, monté sur or 18 carats.', 2850.00, ARRAY['https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800'], NULL, 5.0, 89, '{"sizes": ["42cm", "45cm", "50cm", "55cm"]}', true),

('sautoir-perles-tahiti', 'necklaces', 'Sautoir Perles de Tahiti', 'Long sautoir élégant composé de perles de Tahiti graduées. Pièce statement pour les grandes occasions.', 4200.00, ARRAY['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800'], 'bestseller', 5.0, 41, '{"sizes": ["80cm", "90cm", "100cm"]}', true),

('bague-perle-tahiti-diamants', 'rings', 'Bague Perle de Tahiti & Diamants', 'Bague sophistiquée en or blanc 18 carats, perle de Tahiti entourée de diamants.', 1890.00, ARRAY['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800'], 'bestseller', 4.9, 156, '{"sizes": ["48", "50", "52", "54", "56", "58", "60"]}', true),

('bague-solitaire-perle', 'rings', 'Bague Solitaire Perle de Tahiti', 'Bague solitaire classique en or jaune 18 carats avec perle de Tahiti. Design épuré.', 980.00, ARRAY['https://images.unsplash.com/photo-1603561596112-0a132b757442?w=800'], NULL, 4.8, 73, '{"sizes": ["48", "50", "52", "54", "56", "58"]}', true),

('pendentif-perle-tahiti', 'other', 'Pendentif Perle de Tahiti', 'Pendentif délicat en or jaune 18 carats avec une perle de Tahiti drop de qualité exceptionnelle.', 680.00, ARRAY['https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800'], 'new', 4.7, 34, '{"qualities": ["AA", "AAA"]}', true),

('boucles-oreilles-perles-tahiti', 'other', 'Boucles d''Oreilles Perles de Tahiti', 'Élégantes boucles d''oreilles pendantes en or 18 carats avec perles de Tahiti assorties.', 1250.00, ARRAY['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800'], 'bestseller', 4.9, 98, '{"qualities": ["AA", "AAA"]}', true);

-- Vérifier les données insérées
-- SELECT * FROM public.products ORDER BY created_at DESC;
