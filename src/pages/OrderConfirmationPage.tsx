import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ShoppingBag, ArrowRight } from 'lucide-react';

export default function OrderConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, total } = location.state || {};

  if (!orderId) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-card rounded-lg border shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-success/10 p-8 text-center">
            <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-display tracking-wide text-dark">Order Placed Successfully!</h1>
            <p className="text-muted-foreground mt-2">Thank you for your purchase</p>
          </div>

          {/* Order Details */}
          <div className="p-6 space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono font-bold text-dark">{orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-bold text-primary">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="text-warning font-medium">Processing</span>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                What happens next?
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">1</div>
                  <p>We'll confirm your order and prepare it for shipment</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">2</div>
                  <p>You'll receive an email/SMS confirmation</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">3</div>
                  <p>Your order will be delivered within 2-5 business days</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button onClick={() => navigate('/')} className="w-full" size="lg">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard/sales')}>
                View Sales History
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
