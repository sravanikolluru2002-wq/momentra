type PaymentResult = {
  payment_id: string;
  payment_status: "paid";
};

type StartPaymentInput = {
  amount: number;
  customerName?: string;
  customerPhone?: string;
  description: string;
};

export async function startPayment(
  _input: StartPaymentInput
): Promise<PaymentResult> {
  // Expo Go-safe mock payment. TODO: Replace with react-native-razorpay only inside
  // an Expo development build with server-side order creation and signature verification.
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    payment_id: "test_payment_id",
    payment_status: "paid",
  };
}
