import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Package, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { resolveImagePath } from '@/lib/utils';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  created_at: string;
  shipping_address: {
    line1?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  order_items: OrderItem[];
}

interface OrderCardProps {
  order: Order;
  getStatusLabel: (status: string) => string;
  getStatusColor: (status: string) => string;
  getDateLocale: () => string;
  formatPrice: (price: number) => string;
  t: (key: string) => string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  getStatusLabel,
  getStatusColor,
  getDateLocale,
  formatPrice,
  t,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden transition-all hover:border-gold/30">
      {/* Header - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-gold" />
          </div>
          <div className="text-left">
            <p className="font-semibold">{order.order_number}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString(getDateLocale(), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-gold">{formatPrice(order.total)}</p>
            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              <Separator />

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">
                  {t('orderedItems') || 'Articles commandés'}
                </h4>
                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.product_image ? (
                          <img
                            src={resolveImagePath(item.product_image)}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × {formatPrice(item.unit_price)}
                        </p>
                      </div>
                      <p className="font-medium text-sm">{formatPrice(item.total_price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('subtotal') || 'Sous-total'}</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('shipping') || 'Livraison'}</span>
                  <span>{order.shipping_cost === 0 ? 'Gratuite' : formatPrice(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                  <span>{t('total') || 'Total'}</span>
                  <span className="text-gold">{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {t('shippingAddress') || 'Adresse de livraison'}
                    </h4>
                    <p className="text-sm">
                      {order.shipping_address.line1}
                      {order.shipping_address.city && `, ${order.shipping_address.postal_code} ${order.shipping_address.city}`}
                      {order.shipping_address.country && `, ${order.shipping_address.country}`}
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderCard;
