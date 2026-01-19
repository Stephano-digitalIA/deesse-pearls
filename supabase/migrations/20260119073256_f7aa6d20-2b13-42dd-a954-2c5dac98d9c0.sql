-- ============================================
-- COMPLETE DATABASE SCHEMA FOR DEESSE PEARLS E-COMMERCE
-- ============================================

-- 1. Create enum types
CREATE TYPE product_category AS ENUM ('pearls', 'bracelets', 'necklaces', 'rings', 'other');
CREATE TYPE product_badge AS ENUM ('new', 'bestseller');
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create products table
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

CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_badge ON public.products(badge) WHERE badge IS NOT NULL;
CREATE INDEX idx_products_search ON public.products USING GIN (to_tsvector('french', name || ' ' || description));

-- 3. Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    address JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- 5. Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    total NUMERIC(10, 2) NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    customer_email TEXT,
    customer_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- 6. Create order_items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    variant JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- 7. Create order_history table
CREATE TABLE public.order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_history_order_id ON public.order_history(order_id);

-- 8. Create reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX idx_reviews_is_approved ON public.reviews(is_approved);

-- 9. Create customization_requests table
CREATE TABLE public.customization_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    request_type TEXT NOT NULL,
    description TEXT NOT NULL,
    budget_range TEXT,
    images TEXT[],
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customization_requests_status ON public.customization_requests(status);

-- 10. Create product_translations table
CREATE TABLE public.product_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    locale TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, locale)
);

CREATE INDEX idx_product_translations_locale ON public.product_translations(locale);

-- 11. Create admin_access_logs table
CREATE TABLE public.admin_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    action TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_access_logs_user_id ON public.admin_access_logs(user_id);

-- 12. Create admin_access_blocks table
CREATE TABLE public.admin_access_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT UNIQUE NOT NULL,
    reason TEXT,
    blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 13. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Apply updated_at triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customization_requests_updated_at BEFORE UPDATE ON public.customization_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_translations_updated_at BEFORE UPDATE ON public.product_translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. Create has_role function
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

-- 16. Create public_reviews view
CREATE VIEW public.public_reviews AS
SELECT 
    r.id,
    r.product_id,
    r.user_name,
    r.rating,
    r.title,
    r.content,
    r.created_at,
    p.name as product_name,
    p.slug as product_slug
FROM public.reviews r
JOIN public.products p ON r.product_id = p.id
WHERE r.is_approved = true;

-- 17. Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customization_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_blocks ENABLE ROW LEVEL SECURITY;

-- 18. RLS Policies for products
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 19. RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 20. RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 21. RLS Policies for orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 22. RLS Policies for order_items
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 23. RLS Policies for order_history
CREATE POLICY "Users can view own order history" ON public.order_history FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_history.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins can manage order history" ON public.order_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 24. RLS Policies for reviews
CREATE POLICY "Approved reviews are publicly readable" ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can submit reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own reviews" ON public.reviews FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all reviews" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 25. RLS Policies for customization_requests
CREATE POLICY "Users can view own requests" ON public.customization_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can submit requests" ON public.customization_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all requests" ON public.customization_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can submit customization request" ON public.customization_requests FOR INSERT WITH CHECK (true);

-- 26. RLS Policies for product_translations
CREATE POLICY "Translations are publicly readable" ON public.product_translations FOR SELECT USING (true);
CREATE POLICY "Admins can manage translations" ON public.product_translations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 27. RLS Policies for admin_access_logs
CREATE POLICY "Admins can view access logs" ON public.admin_access_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert access logs" ON public.admin_access_logs FOR INSERT WITH CHECK (true);

-- 28. RLS Policies for admin_access_blocks
CREATE POLICY "Admins can manage access blocks" ON public.admin_access_blocks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 29. Create profile on user signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 30. Insert demo products
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