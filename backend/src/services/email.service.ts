import nodemailer from 'nodemailer';

interface SaleNotificationInput {
  productName: string;
  quantity: number;
  totalPrice: number;
  unitPrice: number;
  originalPrice?: number; // Original product price before bargaining
  timestamp: string;
  paymentMethod?: string;
  size?: string;          // Size name
  color?: string;         // Color name
  mpesaData?: {
    mpesaReceiptNumber: string;
    phoneNumber: string;
    transactionDate: string;
  };
}

interface DailySummaryInput {
  date: string;
  totalSales: number;
  totalRevenue: number;
  products: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendSaleNotification(input: SaleNotificationInput) {
    const ownerEmail = process.env.OWNER_EMAIL;
    if (!ownerEmail) {
      console.warn('⚠️ OWNER_EMAIL not configured, skipping email notification');
      return;
    }

    console.log(`📧 Preparing sale notification email...`);
    console.log(`  → To: ${ownerEmail}`);
    console.log(`  → From: ${process.env.EMAIL_FROM}`);
    console.log(`  → Product: ${input.productName}`);
    console.log(`  → SMTP Host: ${process.env.SMTP_HOST}`);
    console.log(`  → SMTP User: ${process.env.SMTP_USER}`);

    const isMpesa = input.paymentMethod === 'mobile_money';
    const paymentIcon = isMpesa ? '📱' : '💵';
    const paymentTitle = isMpesa ? 'M-Pesa Payment' : 'Cash Payment';

    const mpesaSection = isMpesa && input.mpesaData ? `
      <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4caf50;">
        <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 16px;">📱 M-Pesa Transaction Details</h3>
        <p style="margin: 8px 0;"><strong>M-Pesa Receipt:</strong> ${input.mpesaData.mpesaReceiptNumber}</p>
        <p style="margin: 8px 0;"><strong>Customer Phone:</strong> ${input.mpesaData.phoneNumber}</p>
        <p style="margin: 8px 0;"><strong>Transaction Time:</strong> ${new Date(input.mpesaData.transactionDate).toLocaleString()}</p>
      </div>
    ` : '';

    const sizeColorInfo = input.size || input.color
      ? `
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">📏 Product Variant Details</h3>
            ${input.size ? `<p style="margin: 8px 0; font-size: 16px;"><strong>Size:</strong> <span style="background-color: #fff; padding: 4px 12px; border-radius: 4px; font-weight: bold; color: #92400e;">${input.size}</span></p>` : ''}
            ${input.color ? `<p style="margin: 8px 0; font-size: 16px;"><strong>Color:</strong> <span style="background-color: #fff; padding: 4px 12px; border-radius: 4px; font-weight: bold; color: #92400e;">${input.color}</span></p>` : ''}
            <p style="margin: 8px 0; color: #92400e; font-size: 14px; font-style: italic;">✓ Exact product variant sold and stock updated</p>
          </div>
        `
      : '';

    const priceDetails = input.originalPrice && input.originalPrice !== input.unitPrice
      ? `
          <p style="margin: 10px 0;"><strong>Original Price:</strong> Ksh ${input.originalPrice.toLocaleString('en-KE')}</p>
          <p style="margin: 10px 0;"><strong>Selling Price:</strong> Ksh ${input.unitPrice.toLocaleString('en-KE')} ${input.unitPrice < input.originalPrice ? '<span style="color: #16a34a; font-weight: bold;">(Bargained)</span>' : ''}</p>
          <p style="margin: 10px 0;"><strong>Quantity Sold:</strong> ${input.quantity}</p>
          <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #e94560;"><strong>Total Amount:</strong> Ksh ${input.totalPrice.toLocaleString('en-KE')}</p>
        `
      : `
          <p style="margin: 10px 0;"><strong>Price:</strong> Ksh ${input.unitPrice.toLocaleString('en-KE')}</p>
          <p style="margin: 10px 0;"><strong>Quantity Sold:</strong> ${input.quantity}</p>
          <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #e94560;"><strong>Total Amount:</strong> Ksh ${input.totalPrice.toLocaleString('en-KE')}</p>
        `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Lin Collection <noreply@lincollection.com>',
      to: ownerEmail,
      subject: `${paymentIcon} New Sale - ${input.size && input.color ? `${input.size}/${input.color} - ` : ''}${input.productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e94560;">${paymentIcon} New Sale Recorded</h2>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0; font-size: 18px;"><strong>Product:</strong> ${input.productName}</p>
            <p style="margin: 10px 0;"><strong>Payment Method:</strong> ${paymentTitle}</p>
            ${sizeColorInfo}
            ${priceDetails}
            <p style="margin: 10px 0;"><strong>Time of Sale:</strong> ${new Date(input.timestamp).toLocaleString()}</p>
          </div>

          ${mpesaSection}

          <p style="color: #6b7280; font-size: 14px;">This is an automated notification from your Boutique Management System.</p>
        </div>
      `,
    };

    try {
      console.log(`📤 Sending email to ${ownerEmail}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully!`);
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error: unknown) {
      console.error(`❌ Failed to send email:`);

      if (error instanceof Error) {
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${(error as any).code}`);
        console.error(`   Response: ${(error as any).response}`);
      } else {
        console.error(`   Error: ${String(error)}`);
      }

      console.error(`   Full error:`, error);
    }
  }

  async sendDailySummary(input: DailySummaryInput) {
    const ownerEmail = process.env.OWNER_EMAIL;
    if (!ownerEmail) {
      console.warn('OWNER_EMAIL not configured, skipping daily summary');
      return;
    }

    const productsList = input.products
      .map(
        (p) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${p.revenue.toFixed(2)}</td>
          </tr>
        `
      )
      .join('');

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@boutique.com',
      to: ownerEmail,
      subject: '📊 Daily Sales Summary',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Daily Sales Summary - ${input.date}</h2>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Total Sales:</strong> ${input.totalSales}</p>
            <p style="margin: 10px 0;"><strong>Total Revenue:</strong> $${input.totalRevenue.toFixed(2)}</p>
          </div>
          
          <h3 style="color: #374151;">Products Sold Today</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: center;">Quantity</th>
                <th style="padding: 10px; text-align: right;">Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${productsList}
            </tbody>
          </table>
          
          <p style="color: #6b7280; font-size: 14px;">This is an automated daily summary from your Boutique Management System.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendLowStockAlert(productName: string, currentStock: number) {
    const ownerEmail = process.env.OWNER_EMAIL;
    if (!ownerEmail) {
      console.warn('OWNER_EMAIL not configured, skipping low stock alert');
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@boutique.com',
      to: ownerEmail,
      subject: '⚠️ Low Stock Alert',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Low Stock Alert</h2>
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 10px 0;"><strong>Product:</strong> ${productName}</p>
            <p style="margin: 10px 0;"><strong>Current Stock:</strong> ${currentStock}</p>
            <p style="margin: 10px 0; color: #ef4444;">This product is running low and needs to be restocked.</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This is an automated alert from your Boutique Management System.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();
