import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface DarajaConfig {
  consumerKey: string;
  consumerSecret: string;
  businessShortCode: string;
  accountNumber: string;
  passkey: string;
  callbackUrl: string;
  environment: 'sandbox' | 'production';
}

interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface STKQueryResponse {
  ResponseCode: string;
  ResultCode: string;
  ResultDesc: string;
  CheckoutRequestID: string;
  CallbackMetadata?: {
    Item: Array<{ Name: string; Value: string | number }>;
  };
}

class DarajaService {
  private config: DarajaConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY || '',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
      businessShortCode: process.env.MPESA_BUSINESS_SHORTCODE || '880100',
      accountNumber: process.env.MPESA_ACCOUNT_NUMBER || '1009076503',
      passkey: process.env.MPESA_PASSKEY || '',
      callbackUrl: process.env.MPESA_CALLBACK_URL || '',
      environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };

    if (!this.config.passkey) {
      console.warn('⚠️ MPESA_PASSKEY is not configured. STK Push will fail.');
    }
  }

  /**
   * Get OAuth access token from Daraja with retry logic
   */
  async getAccessToken(retryCount = 0): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const baseUrl = this.config.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');

    try {
      const response = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        timeout: 10000, // 10 second timeout
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer

      return this.accessToken || '';
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // Retry on transient errors (5xx, network errors)
      if (retryCount < 2 && (
        axiosError.response?.status === 500 ||
        axiosError.response?.status === 502 ||
        axiosError.response?.status === 503 ||
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ECONNRESET'
      )) {
        console.warn(`⚠️ Token fetch failed, retrying (${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.getAccessToken(retryCount + 1);
      }

      throw new Error(`Failed to get M-Pesa access token: ${axiosError.message}`);
    }
  }

  /**
   * Generate password for STK Push
   */
  generatePassword(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, -3);

    const shortCode = this.config.businessShortCode;
    const passkey = this.config.passkey;

    return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
  }

  /**
   * Generate timestamp for STK Push
   */
  generateTimestamp(): string {
    return new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, -3);
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa Online)
   */
  async initiateSTKPush(request: STKPushRequest, retryCount = 0): Promise<STKPushResponse> {
    const token = await this.getAccessToken();
    const baseUrl = this.config.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    const password = this.generatePassword();
    const timestamp = this.generateTimestamp();

    // Format phone number (ensure it starts with 254)
    let formattedPhone = request.phoneNumber;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.substring(1)}`;
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }

    const payload = {
      BusinessShortCode: this.config.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(request.amount),
      PartyA: formattedPhone,
      PartyB: this.config.businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: this.config.callbackUrl,
      AccountReference: request.accountReference, // FIX: Use passed accountReference, not config
      TransactionDesc: request.transactionDesc,
    };

    // Log without sensitive data
    console.log(`📱 M-Pesa STK Push: ${formattedPhone} - Ksh ${payload.Amount}`);

    try {
      const response = await axios.post<STKPushResponse>(
        `${baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 second timeout
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // Retry on transient errors
      if (retryCount < 2 && (
        axiosError.response?.status === 500 ||
        axiosError.response?.status === 502 ||
        axiosError.response?.status === 503 ||
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ECONNRESET'
      )) {
        console.warn(`⚠️ STK Push failed, retrying (${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.initiateSTKPush(request, retryCount + 1);
      }

      // Provide meaningful error messages
      const responseData = axiosError.response?.data;
      if (responseData && typeof responseData === 'object' && responseData !== null) {
        const darajaError = responseData as Record<string, unknown>;
        const errorMessage = typeof darajaError.errorMessage === 'string'
          ? darajaError.errorMessage
          : typeof darajaError.ResponseDescription === 'string'
          ? darajaError.ResponseDescription
          : undefined;
        throw new Error(errorMessage || 'M-Pesa STK Push failed');
      }
      
      throw new Error(`M-Pesa STK Push failed: ${axiosError.message}`);
    }
  }

  /**
   * Query STK Push status
   */
  async querySTKStatus(checkoutRequestID: string): Promise<STKQueryResponse> {
    const token = await this.getAccessToken();
    const baseUrl = this.config.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    const password = this.generatePassword();
    const timestamp = this.generateTimestamp();

    const payload = {
      BusinessShortCode: this.config.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID,
    };

    const response = await axios.post<STKQueryResponse>(
      `${baseUrl}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return response.data;
  }

  /**
   * Parse callback metadata
   */
  parseCallbackMetadata(metadata: { Item: Array<{ Name: string; Value: string | number }> }) {
    const result: Record<string, string | number> = {};
    metadata.Item.forEach((item) => {
      result[item.Name] = item.Value;
    });
    return result;
  }

  /**
   * Handle STK Push callback
   */
  handleSTKCallback(callbackData: unknown) {
    if (typeof callbackData !== 'object' || callbackData === null || !('Body' in callbackData)) {
      throw new Error('Invalid STK callback payload');
    }

    const body = (callbackData as { Body?: unknown }).Body;
    if (typeof body !== 'object' || body === null || !('stkCallback' in body)) {
      throw new Error('Invalid STK callback body');
    }

    const stkCallback = (body as { stkCallback?: unknown }).stkCallback;
    if (typeof stkCallback !== 'object' || stkCallback === null) {
      throw new Error('Invalid STK callback content');
    }

    const result = {
      MerchantRequestID: String((stkCallback as Record<string, unknown>).MerchantRequestID || ''),
      CheckoutRequestID: String((stkCallback as Record<string, unknown>).CheckoutRequestID || ''),
      ResultCode: String((stkCallback as Record<string, unknown>).ResultCode || ''),
      ResultDesc: String((stkCallback as Record<string, unknown>).ResultDesc || ''),
      metadata: (stkCallback as Record<string, unknown>).CallbackMetadata
        ? this.parseCallbackMetadata((stkCallback as Record<string, unknown>).CallbackMetadata as { Item: Array<{ Name: string; Value: string | number }> })
        : null,
    };

    return result;
  }

  /**
   * Validate Safaricom IP address (for callback security)
   */
  isValidSafaricomIP(ip: string): boolean {
    // Safaricom API IP ranges (production and sandbox)
    const safaricomIPs = [
      '196.201.214.200',
      '196.201.214.206',
      '196.201.214.207',
      '196.201.213.114',
      '196.201.213.115',
      '196.201.213.116',
      '196.201.213.117',
      '196.201.213.118',
      '196.201.213.119',
      // Add more as needed
    ];
    
    // For development, allow all IPs if in sandbox
    if (this.config.environment === 'sandbox') {
      return true;
    }

    return safaricomIPs.includes(ip);
  }
}

export const darajaService = new DarajaService();
