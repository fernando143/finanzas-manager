import { z } from "zod";

// MercadoPago API Configuration
const MP_BASE_URL = "https://api.mercadopago.com";
const MP_OAUTH_URL = `${MP_BASE_URL}/oauth/token`;
const MP_PAYMENTS_SEARCH_URL = `${MP_BASE_URL}/v1/payments/search`;

// Response schemas for validation
const MercadoPagoTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  scope: z.string(),
});

const MercadoPagoPaymentSchema = z.object({
  id: z.number(),
  description: z.string().nullable(),
  status: z.string(),
  status_detail: z.string(),
  operation_type: z.string(),
  date_created: z.string(),
  date_approved: z.string().nullable(),
  money_release_date: z.string().nullable(),
  transaction_amount: z.number(),
  currency_id: z.string(),
  transaction_details: z
    .object({
      net_received_amount: z.number().optional(),
      total_paid_amount: z.number().optional(),
      overpaid_amount: z.number().optional(),
      installment_amount: z.number().optional(),
    })
    .optional(),
  payer: z
    .object({
      id: z.string().optional(),
      email: z.string().optional(),
      identification: z
        .object({
          type: z.string(),
          number: z.string(),
        })
        .optional(),
    })
    .optional(),
  payment_method_id: z.string().optional(),
  payment_type_id: z.string().optional(),
  collector: z
    .object({
      id: z.number(),
      nickname: z.string().optional(),
    })
    .optional(),
});

const MercadoPagoSearchResponseSchema = z.object({
  results: z.array(MercadoPagoPaymentSchema),
  paging: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
});

export interface MercadoPagoToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface MercadoPagoPayment {
  id: number;
  description: string | null;
  status: string;
  status_detail: string;
  operation_type: string;
  date_created: string;
  date_approved: string | null;
  money_release_date: string | null;
  transaction_amount: number;
  currency_id: string;
  transaction_details?: {
    net_received_amount?: number;
    total_paid_amount?: number;
    overpaid_amount?: number;
    installment_amount?: number;
  };
  payer?: {
    id?: string;
    email?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  payment_method_id?: string;
  payment_type_id?: string;
  collector?: {
    id: number;
    nickname?: string;
  };
}

export interface MercadoPagoSearchResponse {
  results: MercadoPagoPayment[];
  paging: {
    total: number;
    limit: number;
    offset: number;
  };
}

export class MercadoPagoService {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string;
  private tokenCache: {
    token: string;
    expiresAt: Date;
  } | null = null;

  constructor() {
    this.clientId = process.env.CLIENT_ID!;
    this.clientSecret = process.env.CLIENT_SECRET!;
    this.accessToken = process.env.ACCESS_TOKEN!;

    if (!this.clientId || !this.clientSecret || !this.accessToken) {
      throw new Error("MercadoPago credentials are not configured properly");
    }
  }

  /**
   * Get OAuth token using client credentials
   */
  async getOAuthToken(): Promise<MercadoPagoToken> {
    // Check if we have a cached token that's still valid
    if (this.tokenCache && this.tokenCache.expiresAt > new Date()) {
      return {
        access_token: this.tokenCache.token,
        token_type: "Bearer",
        expires_in: Math.floor(
          (this.tokenCache.expiresAt.getTime() - Date.now()) / 1000,
        ),
        scope: "read write",
      };
    }

    const requestBody = {
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
    };

    try {
      const response = await fetch(MP_OAUTH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `MercadoPago OAuth failed: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      const data = await response.json();
      const validatedData = MercadoPagoTokenResponseSchema.parse(data);

      // Cache the token
      const expirationTime = new Date(
        Date.now() + (validatedData.expires_in - 300) * 1000,
      ); // Subtract 5 minutes for safety
      this.tokenCache = {
        token: validatedData.access_token,
        expiresAt: expirationTime,
      };

      return validatedData;
    } catch (error) {
      console.error("Error getting MercadoPago OAuth token:", error);
      throw new Error(
        `Failed to obtain MercadoPago OAuth token: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Search payments using the provided token or OAuth token
   */
  async searchPayments(
    options: {
      token?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
      status?: string;
      operationType?: string;
    } = {},
  ): Promise<MercadoPagoSearchResponse> {
    let token = options.token;

    // If no token provided, get OAuth token
    if (!token) {
      const oauthResponse = await this.getOAuthToken();
      token = oauthResponse.access_token;
    }

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (options.dateFrom) {
      queryParams.append("begin_date", options.dateFrom.toISOString());
    }

    if (options.dateTo) {
      queryParams.append("end_date", options.dateTo.toISOString());
    }

    if (options.limit) {
      queryParams.append("limit", options.limit.toString());
    } else {
      queryParams.append("limit", "500"); // Default limit increased to capture more payments
    }

    if (options.offset) {
      queryParams.append("offset", options.offset.toString());
    }

    if (options.status) {
      queryParams.append("status", options.status);
    }

    if (options.operationType) {
      queryParams.append("operation_type", options.operationType);
    }

    // Set default date range (last 30 days) if no dates provided
    if (!options.dateFrom && !options.dateTo) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      queryParams.append("begin_date", thirtyDaysAgo.toISOString());
      queryParams.append("end_date", new Date().toISOString());
    }

    const url = `${MP_PAYMENTS_SEARCH_URL}?${queryParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `MercadoPago payments search failed: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      const data = await response.json();
      const validatedData = MercadoPagoSearchResponseSchema.parse(data);

      return validatedData;
    } catch (error) {
      console.error("Error searching MercadoPago payments:", error);
      throw new Error(
        `Failed to search MercadoPago payments: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Filter payments that represent actual expenses
   */
  filterExpensePayments(payments: MercadoPagoPayment[]): MercadoPagoPayment[] {
    return payments.filter((payment) => {
      // Only include approved/completed payments
      if (!["approved", "authorized"].includes(payment.status)) {
        return false;
      }

      // Only include money transfers and regular payments (actual expenses)
      const validOperationTypes = [
        "money_transfer",
        "regular_payment",
        "payment",
      ];
      if (!validOperationTypes.includes(payment.operation_type)) {
        return false;
      }

      // Exclude refunds and other non-expense operations
      if (
        payment.status_detail &&
        ["refunded", "cancelled", "rejected"].includes(payment.status_detail)
      ) {
        return false;
      }

      // Only include payments with positive amounts (outgoing money)
      if (payment.transaction_amount <= 0) {
        return false;
      }

      return true;
    });
  }

  /**
   * Convert MercadoPago payment to expense format
   */
  convertPaymentToExpense(
    payment: MercadoPagoPayment,
    userId: string,
    defaultCategoryId: string,
    collectorId?: string,
  ) {
    const amount = Math.abs(payment.transaction_amount); // Ensure positive amount for expenses

    // Create a description based on available data
    let description = payment.description || `Pago MP #${payment.id}`;
    if (payment.payment_method_id) {
      description += ` (${payment.payment_method_id})`;
    }

    // Use approved date if available, otherwise use created date
    const transactionDateString = payment.date_approved || payment.date_created;

    // Convert the date to GMT-3 noon (15:00 UTC) format expected by the expense controller
    const transactionDate = new Date(transactionDateString);
    // Set to noon in GMT-3 (which is 15:00 UTC)
    transactionDate.setUTCHours(15, 0, 0, 0);

    // Format as ISO string to match the expected format
    const formattedDueDate = transactionDate.toISOString();

    return {
      description,
      amount,
      categoryId: defaultCategoryId, // Will need to be mapped to a valid category
      frequency: "ONE_TIME" as const,
      dueDate: formattedDueDate,
      status: "PAID" as const,
      mercadoPagoPaymentId: payment.id.toString(),
      collectorId: collectorId || undefined,
    };
  }

  /**
   * Get recent payments and convert to expenses format
   * @param userId - User ID for expense creation
   * @param defaultCategoryId - Default category ID for expenses
   * @param dateFrom - Optional start date for fetching payments (defaults to 30 days ago)
   */
  async getRecentExpensePayments(
    userId: string,
    defaultCategoryId: string,
    dateFrom?: Date,
  ) {
    // If no dateFrom provided, default to 30 days ago
    if (!dateFrom) {
      dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);
    }

    try {
      // Search for recent payments
      const searchResponse = await this.searchPayments({
        dateFrom: dateFrom,
        dateTo: new Date(),
        limit: 500, // Get up to 500 recent payments
      });

      // Filter to only expense-type payments
      const expensePayments = this.filterExpensePayments(
        searchResponse.results,
      );

      // Import collector service
      const { collectorService } = await import('./index');

      // Convert to expense format with collectors
      const expenses = await Promise.all(
        expensePayments.map(async (payment) => {
          let collectorId: string | undefined;
          
          // Si el pago tiene collector, buscar o crear
          if (payment.collector?.id) {
            const collector = await collectorService.getOrCreate(
              userId,
              payment.collector.id.toString(),
              payment.collector.nickname || `Collector ${payment.collector.id}`
            );
            collectorId = collector.id;
          }
          
          return this.convertPaymentToExpense(
            payment, 
            userId, 
            defaultCategoryId,
            collectorId
          );
        })
      );

      return {
        expenses,
        totalFound: searchResponse.paging.total,
        processedCount: expenses.length,
      };
    } catch (error) {
      console.error("Error getting recent expense payments:", error);
      throw error;
    }
  }
}

export const mercadoPagoService = new MercadoPagoService();
