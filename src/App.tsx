import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Favorites from "./pages/Favorites";
import About from "./pages/About";
import Contact from "./pages/Contact";

import Commitments from "./pages/Commitments";
import FAQ from "./pages/FAQ";
import LegalNotice from "./pages/LegalNotice";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfSale from "./pages/TermsOfSale";
import Delivery from "./pages/Delivery";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Account from "./pages/Account";
import ResetPassword from "./pages/ResetPassword";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LocaleProvider>
        <CartProvider>
          <FavoritesProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Admin routes - without header/footer - require secret URL extension */}
                <Route path="/admin/:secretKey/connexion" element={<AdminLogin />} />
                <Route path="/admin/:secretKey" element={<AdminDashboard />} />
                
                {/* Public routes - with header/footer */}
                <Route path="/*" element={
                  <div className="min-h-screen flex flex-col">
                    <Header />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/shop/:category" element={<Shop />} />
                        <Route path="/product/:slug" element={<ProductDetail />} />
                        <Route path="/favorites" element={<Favorites />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/account" element={<Account />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        
                        <Route path="/commitments" element={<Commitments />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/legal" element={<LegalNotice />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfSale />} />
                        <Route path="/delivery" element={<Delivery />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                    <CartDrawer />
                  </div>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </FavoritesProvider>
        </CartProvider>
      </LocaleProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
