import { Router } from 'express';
import { mpesaController } from '../controllers/mpesa.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Initiate STK Push
 * POST /api/mpesa/stkpush
 * Protected: Requires authentication
 */
router.post('/stkpush', authenticate, mpesaController.initiateSTKPush.bind(mpesaController));

/**
 * Get payment status by checkout request ID
 * GET /api/mpesa/status/:checkoutRequestId
 * Protected: Requires authentication
 */
router.get('/status/:checkoutRequestId', authenticate, mpesaController.getPaymentStatus.bind(mpesaController));

/**
 * Query STK Push status (fallback)
 * POST /api/mpesa/query
 * Protected: Requires authentication
 */
router.post('/query', authenticate, mpesaController.querySTKStatus.bind(mpesaController));

/**
 * STK Push Callback (Called by Safaricom)
 * POST /api/mpesa/callback
 * Public: No authentication required (Safaricom calls this)
 * But IP validation is performed in the controller
 */
router.post('/callback', mpesaController.handleCallback.bind(mpesaController));

/**
 * C2B Confirmation (Called by Safaricom)
 * POST /api/mpesa/c2b/confirmation
 * Public: No authentication required
 */
router.post('/c2b/confirmation', (req, res) => {
  console.log('C2B Confirmation:', JSON.stringify(req.body, null, 2));
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

/**
 * C2B Validation (Called by Safaricom)
 * POST /api/mpesa/c2b/validation
 * Public: No authentication required
 */
router.post('/c2b/validation', (req, res) => {
  console.log('C2B Validation:', JSON.stringify(req.body, null, 2));
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

export default router;
