import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, X, Loader2, Smartphone, Shield, CreditCard } from 'lucide-react';

interface MpesaPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  phoneNumber: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    subtotal?: number;
    size?: string;
    color?: string;
  }>;
  onSuccess: (data: {
    saleId: string;
    checkoutRequestID: string;
    mpesaReceiptNumber?: string;
  }) => void;
  onError: (error: string) => void;
}

export default function MpesaPaymentDialog({
  open,
  onClose,
  amount,
  phoneNumber,
  items,
  onSuccess,
  onError,
}: MpesaPaymentDialogProps) {
  const [step, setStep] = useState<'initiate' | 'pending' | 'success' | 'error'>('initiate');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(120);
  const [localPhone, setLocalPhone] = useState(phoneNumber);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Get auth token
  const getToken = () => {
    return localStorage.getItem('auth_token') || '';
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('initiate');
      setLoading(false);
      setErrorMessage('');
      setCountdown(120);
      setLocalPhone(phoneNumber);
    }
  }, [open, phoneNumber]);

  // Countdown timer
  useEffect(() => {
    if (step !== 'pending' || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStep('error');
          setErrorMessage('Payment session expired. Please try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, countdown]);

  // Poll for payment status via sale
  const pollPaymentStatus = useCallback(async (checkoutReqId: string) => {
    const maxAttempts = 40; // 120 seconds at 3s intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${API_URL}/mpesa/status/${checkoutReqId}`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
          },
        });

        const result = await response.json();
        attempts++;

        if (result.success && result.data) {
          const { status, sales } = result.data;

          if (status === 'completed' && sales?.payment_status === 'completed') {
            // Payment successful
            setStep('success');
            onSuccess({
              saleId: sales.id,
              checkoutRequestID: checkoutReqId,
              mpesaReceiptNumber: sales.mpesa_receipt_number,
            });
            return;
          } else if (status === 'failed' || sales?.payment_status === 'failed') {
            // Payment failed
            setStep('error');
            setErrorMessage(result.data.result_desc || 'Payment failed');
            return;
          }
        }

        // Still pending
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setStep('error');
          setErrorMessage('Payment timed out. Please check your M-Pesa messages.');
        }
      } catch {
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setStep('error');
          setErrorMessage('Unable to verify payment status');
        }
      }
    };

    // Start polling after 5 seconds (give user time to respond to STK)
    setTimeout(poll, 5000);
  }, [API_URL, onSuccess]);

  const handleInitiatePayment = async () => {
    const phoneToUse = localPhone || phoneNumber;
    if (!phoneToUse || phoneToUse.length < 9) {
      onError('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/mpesa/stkpush`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          phoneNumber: phoneToUse,
          amount: Math.round(amount),
          accountReference: 'Lin Collection',
          transactionDesc: `Payment for ${formatCurrency(amount)}`,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || 0,
            subtotal: item.subtotal || 0,
            size: item.size || null,
            color: item.color || null,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate STK Push');
      }

      if (data.success) {
        setStep('pending');
        pollPaymentStatus(data.checkoutRequestId);
      } else {
        throw new Error(data.message || 'Failed to initiate payment');
      }
    } catch (err: any) {
      setStep('error');
      setErrorMessage(err.message || 'Failed to initiate payment');
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md">
        {/* M-Pesa Dialog Container */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          {/* M-Pesa Header */}
          <div className="bg-gradient-to-r from-[#4caf50] to-[#45a049] p-6 text-white relative">
            <button
              onClick={onClose}
              disabled={step === 'pending'}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-[#4caf50] font-bold text-lg">M</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">M-Pesa Payment</h3>
                <p className="text-white/80 text-sm">Lipa Na M-Pesa</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 mt-3">
              <p className="text-white/80 text-xs">Amount to Pay</p>
              <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Initiate Payment */}
            {step === 'initiate' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">STK Push Payment</p>
                      <p className="text-xs text-green-700 mt-1">
                        Enter your M-Pesa number. You'll receive a prompt on your phone to complete payment.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
                  <input
                    id="mpesa-phone"
                    type="tel"
                    placeholder="e.g., 0712345678"
                    value={localPhone}
                    onChange={(e) => setLocalPhone(e.target.value)}
                    className="w-full h-10 px-3 border border-input rounded-md text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: 07XX XXX XXX or 2547XX XXX XXX
                  </p>
                </div>

                <Button
                  onClick={handleInitiatePayment}
                  disabled={loading}
                  className="w-full bg-[#4caf50] hover:bg-[#45a049] text-white"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initiating...
                    </>
                  ) : (
                    <>
                      <Smartphone className="mr-2 h-4 w-4" />
                      Send STK Push
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step 2: Pending - Waiting for user to complete on phone */}
            {step === 'pending' && (
              <div className="text-center space-y-6 py-4">
                {/* Animated Phone Icon */}
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75" />
                  <div className="relative w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-200">
                    <Smartphone className="h-10 w-10 text-green-600" />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-dark">Check Your Phone</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    An STK Push has been sent to <strong>{localPhone || phoneNumber}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your M-Pesa PIN to complete payment
                  </p>
                </div>

                {/* Countdown Timer */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                    <span>Waiting for payment...</span>
                    <span className="font-bold text-green-600">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Secure payment powered by M-Pesa</span>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <div className="text-center space-y-6 py-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>

                <div>
                  <h4 className="text-xl font-bold text-green-600">Payment Successful!</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your M-Pesa payment has been confirmed
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-bold">{formatCurrency(amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone Number</span>
                    <span className="font-mono">{phoneNumber}</span>
                  </div>
                </div>

                <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
                  Continue
                </Button>
              </div>
            )}

            {/* Step 4: Error */}
            {step === 'error' && (
              <div className="text-center space-y-6 py-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <X className="h-10 w-10 text-red-600" />
                </div>

                <div>
                  <h4 className="text-xl font-bold text-red-600">Payment Failed</h4>
                  <p className="text-sm text-muted-foreground mt-2">{errorMessage}</p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setStep('initiate');
                      setErrorMessage('');
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-600" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-green-600" />
                <span>M-Pesa</span>
              </div>
              <div className="flex items-center gap-1">
                <Smartphone className="h-3 w-3 text-green-600" />
                <span>STK Push</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
