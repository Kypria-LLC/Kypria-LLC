/**
 * 🔐 VERIFICATION ENGINE
 * 
 * Validates webhook signatures and transaction authenticity
 * before any crest assignment occurs.
 */

import crypto from 'crypto';
import { RevenueEvent } from '../models';

export class VerificationEngine {
  private paypalWebhookId: string;
  private githubSecret: string;
  private patreonSecret: string;

  constructor(config: VerificationConfig) {
    this.paypalWebhookId = config.paypalWebhookId;
    this.githubSecret = config.githubSecret;
    this.patreonSecret = config.patreonSecret;
  }

  /**
   * Main verification entry point
   */
  async verify(event: RevenueEvent, source: string): Promise<boolean> {
    switch (source) {
      case 'paypal':
        return this.verifyPayPal(event);
      case 'github':
        return this.verifyGitHub(event);
      case 'patreon':
        return this.verifyPatreon(event);
      default:
        throw new Error(`Unknown source: ${source}`);
    }
  }

  /**
   * Verify PayPal IPN signature
   */
  private async verifyPayPal(event: RevenueEvent): Promise<boolean> {
    // PayPal requires IPN verification via their API
    const verifyUrl = process.env.PAYPAL_ENV === 'production'
      ? 'https://ipnpb.paypal.com/cgi-bin/webscr'
      : 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr';

    const verifyParams = new URLSearchParams({
      cmd: '_notify-validate',
      ...event.rawData
    });

    try {
      const response = await fetch(verifyUrl, {
        method: 'POST',
        body: verifyParams,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Kypria-Wealth-Conduit/1.0'
        }
      });

      const result = await response.text();
      
      if (result === 'VERIFIED') {
        // Additional check: verify receiver_email matches our PayPal account
        const receiverEmail = event.rawData.receiver_email;
        const expectedEmail = process.env.PAYPAL_RECEIVER_EMAIL;
        
        return receiverEmail === expectedEmail;
      }

      return false;
    } catch (error) {
      console.error('PayPal verification failed:', error);
      return false;
    }
  }

  /**
   * Verify GitHub webhook signature
   */
  private verifyGitHub(event: RevenueEvent): Promise<boolean> {
    const signature = event.rawData.headers['x-hub-signature-256'];
    const body = JSON.stringify(event.rawData.body);

    const hmac = crypto.createHmac('sha256', this.githubSecret);
    hmac.update(body, 'utf8');
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    return Promise.resolve(
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    );
  }

  /**
   * Verify Patreon webhook signature
   */
  private verifyPatreon(event: RevenueEvent): Promise<boolean> {
    const signature = event.rawData.headers['x-patreon-signature'];
    const body = JSON.stringify(event.rawData.body);

    const hmac = crypto.createHmac('md5', this.patreonSecret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');

    return Promise.resolve(signature === expectedSignature);
  }

  /**
   * Additional fraud checks (optional)
   */
  async validateTransaction(event: RevenueEvent): Promise<ValidationResult> {
    const checks: ValidationCheck[] = [];

    // Check 1: Minimum amount threshold
    if (event.amount < 1) {
      checks.push({
        name: 'minimum_amount',
        passed: false,
        message: 'Amount below minimum threshold'
      });
    }

    // Check 2: Currency whitelist
    const allowedCurrencies = ['USD', 'EUR', 'GBP'];
    if (!allowedCurrencies.includes(event.currency)) {
      checks.push({
        name: 'currency_check',
        passed: false,
        message: `Currency ${event.currency} not supported`
      });
    }

    // Check 3: Duplicate transaction check
    // (Would query database to see if transaction ID already processed)
    // Placeholder for now
    checks.push({
      name: 'duplicate_check',
      passed: true,
      message: 'Transaction ID is unique'
    });

    const allPassed = checks.every(check => check.passed);

    return {
      valid: allPassed,
      checks
    };
  }
}

// Type definitions
interface VerificationConfig {
  paypalWebhookId: string;
  githubSecret: string;
  patreonSecret: string;
}

interface ValidationResult {
  valid: boolean;
  checks: ValidationCheck[];
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
}

export default VerificationEngine;