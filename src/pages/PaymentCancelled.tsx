import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/LocaleContext";

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Commande annulée
          </h1>
          <p className="text-muted-foreground">
            Votre paiement a été annulé. Aucun montant n'a été débité de votre compte.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p>
            Vos articles sont toujours dans votre panier. Vous pouvez reprendre votre commande à tout moment.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate("/shop")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuer mes achats
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
