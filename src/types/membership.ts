// TypeScript types for membership system

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  membership_status: "active" | "inactive";
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  cf_payment_id: string | null;
  email: string;
  amount: number;
  status: "SUCCESS" | "FAILED" | "PENDING";
  created_at: string;
}

export interface CreateOrderRequest {
  name: string;
  email: string;
  phone: string;
}

export interface CreateOrderResponse {
  success: boolean;
  paymentSessionId?: string;
  orderId?: string;
  error?: string;
}

export interface CashfreeWebhookPayload {
  type: string;
  data: {
    order: {
      order_id: string;
      order_amount: number;
    };
    payment: {
      cf_payment_id: string;
      payment_status: string;
      payment_amount: number;
    };
    customer_details: {
      customer_name: string;
      customer_email: string;
      customer_phone: string;
    };
  };
}
