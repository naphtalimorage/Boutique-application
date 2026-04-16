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

  const handleCompleteSale = async (mpesaData?: { saleId: string; checkoutRequestID: string; mpesaReceiptNumber?: string }) => {
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
          priceOverride: item.customPrice !== undefined ? item.customPrice : undefined,
        })),
        paymentMethod,
        mpesaData: mpesaData || undefined,
      };

      const API_URL = import.meta.env.VITE_API_URL || 'https://boutique-application.onrender.com/api';
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete sale';
      showError(message);
      setSubmitting(false);
    }
  };

  const handleMpesaSuccess = (data: { saleId: string; checkoutRequestID: string; mpesaReceiptNumber?: string }) => {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/cart')} className="min-h-[44px] min-w-[44px]">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-wide">Checkout</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Complete your in-store purchase</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6 md:mb-8">
          <div className="flex items-center gap-2 md:gap-4">
            {[
              { num: 1, label: 'Payment Method' },
              { num: 2, label: 'Confirm Payment' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-colors ${
                    step > s.num
                      ? 'bg-success text-white'
                      : step === s.num
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-muted-foreground'
                  }`}
                >
                  {step > s.num ? <CheckCircle className="h-4 w-4 md:h-5 md:w-5" /> : s.num}
                </div>
                <span
                  className={`ml-1 md:ml-2 text-xs md:text-sm font-medium hidden sm:block ${
                    step >= s.num ? 'text-dark' : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>
                {i < 1 && (
                  <div
                    className={`w-12 sm:w-16 md:w-24 h-0.5 mx-1 md:mx-2 ${
                      step > s.num ? 'bg-success' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Payment Form */}
          <div>
            <div className="bg-card rounded-lg border p-4 md:p-6">
              {step === 1 && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-lg md:text-xl font-bold">Select Payment Method</h2>

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
                      className={`w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border-2 transition-all text-left min-h-[44px] ${
                        selectingMethod ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        paymentMethod === 'cash'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          paymentMethod === 'cash' ? 'bg-primary/10' : 'bg-muted'
                        }`}
                      >
                        {selectingMethod && paymentMethod === 'cash' ? (
                          <Loader2 className="h-5 w-5 md:h-6 md:w-6 text-primary animate-spin" />
                        ) : (
                          <Wallet
                            className={`h-5 w-5 md:h-6 md:w-6 ${
                              paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm md:text-base">Cash Payment</p>
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
                      className={`w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border-2 transition-all text-left min-h-[44px] ${
                        selectingMethod ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        paymentMethod === 'mobile_money'
                          ? 'border-[#4caf50] bg-green-50'
                          : 'border-border hover:border-border'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          paymentMethod === 'mobile_money' ? 'bg-green-100' : 'bg-muted'
                        }`}
                      >
                        {selectingMethod && paymentMethod === 'mobile_money' ? (
                          <Loader2 className="h-5 w-5 md:h-6 md:w-6 text-[#4caf50] animate-spin" />
                        ) : (
                          <Phone
                            className={`h-5 w-5 md:h-6 md:w-6 ${
                              paymentMethod === 'mobile_money' ? 'text-[#4caf50]' : 'text-muted-foreground'
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm md:text-base">M-Pesa (STK Push)</p>
                        <p className="text-xs text-muted-foreground">
                          Send STK push to customer's phone
                        </p>
                      </div>
                    </button>
                  </div>

                  {paymentMethod === 'mobile_money' && (
                    <div>
                      <label className="text-xs md:text-sm font-medium mb-1 block">Customer's M-Pesa Number</label>
                      <input
                        type="tel"
                        placeholder="e.g., 0712345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full h-10 md:h-11 px-3 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
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
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-lg md:text-xl font-bold">Confirm Cash Payment</h2>

                  {/* Payment Summary */}
                  <div className="bg-muted rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      <h3 className="font-semibold text-sm md:text-base">💵 Cash Payment</h3>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Confirm that you have received cash payment from the customer
                    </p>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    <h3 className="text-xs md:text-sm font-semibold text-muted-foreground">
                      ORDER ITEMS ({items.length})
                    </h3>
                    {items.map((item) => {
                    const unitPrice = item.customPrice !== undefined ? item.customPrice : item.product.price;
                    const subtotal = unitPrice * item.quantity;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-1 text-xs md:text-sm py-2 border-b border-border"
                      >
                        <div className="flex justify-between items-center">
                          <span className="truncate flex-1">
                            {item.product.name} × {item.quantity}
                          </span>
                          <span className="font-medium ml-2 md:ml-4">
                            {formatCurrency(subtotal)}
                          </span>
                        </div>
                        {item.customPrice !== undefined && item.customPrice !== item.product.price ? (
                          <div className="text-[11px] text-muted-foreground">
                            Sold at {formatCurrency(unitPrice)} each (original {formatCurrency(item.product.price)})
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      disabled={submitting}
                      className="flex-1 min-h-[44px]"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleCashPayment}
                      disabled={submitting}
                      className="flex-1 bg-success hover:bg-success/90 text-white min-h-[44px]"
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
                          <span className="truncate">Confirm Payment - {formatCurrency(total)}</span>
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
            <div className="bg-card rounded-lg border p-4 md:p-6">
              <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4">Order Summary</h2>

              <div className="space-y-2 md:space-y-3 max-h-48 overflow-y-auto mb-3 md:mb-4">
                {items.map((item) => {
                  const unitPrice = item.customPrice !== undefined ? item.customPrice : item.product.price;
                  const subtotal = unitPrice * item.quantity;

                  return (
                    <div key={item.id} className="flex flex-col gap-2 md:gap-3">
                      <div className="flex gap-2 md:gap-3 items-center">
                        <img
                          src={item.product.imageUrl || '/placeholder-product.svg'}
                          alt={item.product.name}
                          className="w-10 h-10 md:w-12 md:h-12 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-xs md:text-sm font-semibold flex-shrink-0">
                          {formatCurrency(subtotal)}
                        </p>
                      </div>
                      {item.customPrice !== undefined && item.customPrice !== item.product.price ? (
                        <div className="text-[11px] text-muted-foreground ml-12">
                          Sold at {formatCurrency(unitPrice)} each (original {formatCurrency(item.product.price)})
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-3 md:pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base md:text-lg font-bold">Total</span>
                  <span className="text-2xl md:text-3xl font-bold font-display tracking-wide text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="mt-4 md:mt-6 bg-green-50 rounded-lg p-2 md:p-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-success flex-shrink-0" />
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
