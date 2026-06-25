import { randomUUID } from 'crypto';
import { SquareClient, SquareEnvironment } from 'square';
import { env } from '../config/env.js';

const getSquareEnvironment = () => (env.squareEnvironment === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox);

const getSquareClient = () => {
  if (!env.squareAccessToken || !env.squareLocationId) {
    const error = new Error('Square payment settings are not configured');
    error.statusCode = 500;
    throw error;
  }

  return new SquareClient({
    token: env.squareAccessToken,
    environment: getSquareEnvironment(),
  });
};

const normalizeSquarePayment = (payment, amountCents) => ({
  squarePaymentId: payment?.id || '',
  status: payment?.status || '',
  receiptUrl: payment?.receiptUrl || '',
  amountCents,
  currency: env.squareCurrency,
});

const getSquareErrorMessage = (error) => {
  const firstError = error?.errors?.[0] || error?.body?.errors?.[0];
  if (firstError?.detail) return firstError.detail;
  if (firstError?.code) return firstError.code;
  return 'Square payment failed. Please check your card details and try again.';
};

export const createSquarePayment = async ({ sourceId, amountCents, idempotencyKey, note, referenceId }) => {
  const client = getSquareClient();
  const paymentIdempotencyKey = idempotencyKey || randomUUID();

  try {
    const response = await client.payments.create({
      sourceId,
      idempotencyKey: paymentIdempotencyKey,
      amountMoney: {
        amount: BigInt(amountCents),
        currency: env.squareCurrency,
      },
      locationId: env.squareLocationId,
      referenceId,
      note,
      autocomplete: true,
    });

    const payment = response.payment;
    const normalizedPayment = normalizeSquarePayment(payment, amountCents);

    if (normalizedPayment.status !== 'COMPLETED') {
      const error = new Error('Square payment was not completed. Please try again.');
      error.statusCode = 402;
      throw error;
    }

    return normalizedPayment;
  } catch (error) {
    console.error('Square payment failed:', error);
    if (error.statusCode) throw error;

    const paymentError = new Error(getSquareErrorMessage(error));
    paymentError.statusCode = error?.statusCode || 402;
    throw paymentError;
  }
};
