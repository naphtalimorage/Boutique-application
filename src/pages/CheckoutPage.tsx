import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import MpesaPaymentDialog from '@/components/MpesaPaymentDialog';
import { CheckCircle, Wallet, ArrowLeft, Phone, Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart } = useCart();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money'>('cash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showMpesaDialog, setShowMpesaDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectingMethod, setSelectingMethod] = useState(false);

  const total = getCartTotal();

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleCompleteSale = async (mpesaData?: any) => {
    // If not already submitting (called from M-Pesa), set it now
    if (!submitting) {
      setSubmitting(true);
    }

    try {
      const saleData = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          size: item.size || undefined,
          color: item.color || undefined,
        })),
        paymentMethod,
        mpesaData: mpesaData || undefined,
      };

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/sales/multi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete sale');
      }

      success('Sale completed successfully!');
      clearCart();
      
      // Small delay to ensure user sees success toast before navigation
      setTimeout(() => {
        navigate('/dashboard/sales', { replace: true });
      }, 500);
    } catch (err: any) {
      showError(err.message || 'Failed to complete sale');
      setSubmitting(false); // Only reset on error
    }
  };

  const handleMpesaSuccess = (data: any) => {
    setShowMpesaDialog(false);
    handleCompleteSale(data);
  };

  const handleMpesaError = (error: string) => {
    showError(error);
  };

  const handleCashPayment = () => {
    // Set submitting immediately to disable button and show loading
    setSubmitting(true);
    // Small delay to ensure UI updates before async call
    setTimeout(() => {
      handleCompleteSale();
    }, 50);
  };

  return (
    <div className="bg-muted min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/cart')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-display tracking-wide">Checkout</h1>
            <p className="text-sm text-muted-foreground">Complete your in-store purchase</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[
              { num: 1, label: 'Payment Method' },
              { num: 2, label: 'Confirm Payment' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step > s.num
                      ? 'bg-success text-white'
                      : step === s.num
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-muted-foreground'
                  }`}
                >
                  {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
                </div>
                <span
                  className={`ml-2 text-sm font-medium hidden sm:block ${
                    step >= s.num ? 'text-dark' : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>
                {i < 1 && (
                  <div
                    className={`w-16 sm:w-24 h-0.5 mx-2 ${
                      step > s.num ? 'bg-success' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Form */}
          <div>
            <div className="bg-card rounded-lg border p-6">
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Select Payment Method</h2>

                  <div className="space-y-3">
                    {/* Cash Payment */}
                    <button
                      type="button"
                      onClick={() => {
                        if (selectingMethod) return;
                        setSelectingMethod(true);
                        setPaymentMethod('cash');
                        setTimeout(() => {
                          setStep(2);
                          setSelectingMethod(false);
                        }, 100);
                      }}
                      disabled={selectingMethod}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                        selectingMethod ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        paymentMethod === 'cash'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          paymentMethod === 'cash' ? 'bg-primary/10' : 'bg-muted'
                        }`}
                      >
                        {selectingMethod && paymentMethod === 'cash' ? (
                          <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        ) : (
                          <Wallet
                            className={`h-6 w-6 ${
                              paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">Cash Payment</p>
                        <p className="text-xs text-muted-foreground">
                          Confirm when customer has paid at counter
                        </p>
                      </div>
                    </button>

                    {/* M-Pesa Payment */}
                    <button
                      type="button"
                      onClick={() => {
                        if (selectingMethod) return;
                        setSelectingMethod(true);
                        setPaymentMethod('mobile_money');
                        setTimeout(() => {
                          setSelectingMethod(false);
                        }, 100);
                      }}
                      disabled={selectingMethod}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                        selectingMethod ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        paymentMethod === 'mobile_money'
                          ? 'border-[#4caf50] bg-green-50'
                          : 'border-border hover:border-border'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          paymentMethod === 'mobile_money' ? 'bg-green-100' : 'bg-muted'
                        }`}
                      >
                        {selectingMethod && paymentMethod === 'mobile_money' ? (
                          <Loader2 className="h-6 w-6 text-[#4caf50] animate-spin" />
                        ) : (
                          <Phone
                            className={`h-6 w-6 ${
                              paymentMethod === 'mobile_money' ? 'text-[#4caf50]' : 'text-muted-foreground'
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">M-Pesa (STK Push)</p>
                        <p className="text-xs text-muted-foreground">
                          Send STK push to customer's phone
                        </p>
                      </div>
                    </button>
                  </div>

                  {paymentMethod === 'mobile_money' && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">Customer's M-Pesa Number</label>
                      <input
                        type="tel"
                        placeholder="e.g., 0712345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full h-10 px-3 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: 07XX XXX XXX or 2547XX XXX XXX
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'mobile_money' && (
                    <Button
                      onClick={() => {
                        if (!phoneNumber || phoneNumber.length < 9) {
                          showError('Please enter a valid phone number');
                          return;
                        }
                        setShowMpesaDialog(true);
                      }}
                      className="w-full bg-[#4caf50] hover:bg-[#45a049] text-white"
                      size="lg"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Initiate STK Push
                    </Button>
                  )}
                </div>
              )}

              {step === 2 && paymentMethod === 'cash' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Confirm Cash Payment</h2>

                  {/* Payment Summary */}
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">💵 Cash Payment</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Confirm that you have received cash payment from the customer
                    </p>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      ORDER ITEMS ({items.length})
                    </h3>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm py-2 border-b border-border"
                      >
                        <span className="truncate flex-1">
                          {item.product.name} × {item.quantity}
                        </span>
                        <span className="font-medium ml-4">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      disabled={submitting}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleCashPayment}
                      disabled={submitting}
                      className="flex-1 bg-success hover:bg-success/90 text-white"
                      size="lg"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirm Payment - {formatCurrency(total)}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-card rounded-lg border p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.product.imageUrl || '/placeholder-product.svg'}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-3xl font-bold font-display tracking-wide text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="mt-6 bg-green-50 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <div className="text-xs text-green-700">
                  <p className="font-medium">Secure Transaction</p>
                  <p>All prices include applicable taxes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* M-Pesa STK Push Dialog */}
      <MpesaPaymentDialog
        open={showMpesaDialog}
        onClose={() => setShowMpesaDialog(false)}
        amount={total}
        phoneNumber={phoneNumber}
        items={items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.customPrice || item.product.price,
          subtotal: (item.customPrice || item.product.price) * item.quantity,
          size: item.size,
          color: item.color,
        }))}
        onSuccess={handleMpesaSuccess}
        onError={handleMpesaError}
      />
    </div>
  );
}
