import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Award, Truck, Heart } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useTranslatedFeaturedProducts } from "@/hooks/useTranslatedProducts";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const Index: React.FC = () => {
  const { t } = useLocale();
  const { data: featuredProducts = [] } = useTranslatedFeaturedProducts();

  const commitments = [
    { icon: Shield, key: "securePayment" },
    { icon: Award, key: "authenticCertificate" },
    { icon: Truck, key: "freeOver" },
    { icon: Heart, key: "responsiveService" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center bg-deep-black overflow-hiddenpt-24 md:pt-32">
        {/* Video Background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src="/videos/hero-background.mp4" type="video/mp4" />
          </video>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20 z-[1]">
          <div className="absolute top-20 left-20 w-64 h-64 bg-gold/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-lagoon/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10 -mt-32">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="font-tangerine italic font-bold text-5xl md:text-7xl lg:text-9xl text-gold mb-8 leading-tight drop-shadow-lg"
          >
            {t("heroTitle")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="font-tsukimi font-medium text-pearl/90 text-xl md:text-2xl max-w-2xl mx-auto mb-12 drop-shadow-md"
          >
            {t("heroSubtitle")}
          </motion.p>
        </div>
      </section>

      {/* Commitments Bar */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="bg-secondary py-4 sm:py-6 border-y border-border"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {commitments.map((item) => (
              <motion.div key={item.key} variants={fadeInUp} className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gold flex-shrink-0" />
                <span className="font-body text-xs sm:text-sm text-center leading-tight">{t(item.key)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Featured Products */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl mb-4">{t("bestSellers")}</h2>
            <div className="w-20 h-1 bg-gold mx-auto" />
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {featuredProducts.map((product) => (
              <motion.div key={product.id} variants={scaleIn}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mt-12"
          >
            <Link to="/shop">
              <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-deep-black">
                {t("viewAll")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Custom Creation CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="py-20 bg-deep-black text-pearl relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/30 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h2 variants={fadeInUp} className="font-display text-3xl md:text-5xl mb-6">
            {t("dreamJewelry")}
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-pearl/70 max-w-2xl mx-auto mb-8">
            {t("customCreationAvailable")}
          </motion.p>
          <motion.div variants={scaleIn}>
            <Link to="/contact">
              <Button size="lg" className="bg-gold hover:bg-gold-light text-deep-black font-semibold">
                {t("requestCustomization")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Index;
