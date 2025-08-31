import { Response } from "express";
import { z } from "zod";
import { expenseService } from "../services";
import { AuthenticatedRequest, asyncHandler } from "../middleware";
import { ExpenseWhereClause } from "../types";

// Helper function to validate GMT-3 noon dates (15:00 UTC)
const validateGMT3NoonDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  // Check if the time component is 15:00:00.000Z (12:00 GMT-3)
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();

  return hours === 15 && minutes === 0 && seconds === 0 && milliseconds === 0;
};

// Base schema compartido
const ExpenseBaseSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  categoryId: z.string(), // Simplified validation to debug CUID issue
  frequency: z.enum(["MONTHLY", "BIWEEKLY", "WEEKLY", "ANNUAL", "ONE_TIME"]),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .refine((dateString) => !dateString || validateGMT3NoonDate(dateString), {
      message: "Due date must be set to 12:00 noon GMT-3 (15:00 UTC)",
    }),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "PARTIAL"]).default("PENDING"),
  mercadoPagoPaymentId: z.string().optional(),
  dateApproved: z.string().datetime().optional(), // Date when the payment was approved by MercadoPago
  collectorId: z.string().optional(),
});

// Schema para crear individual (igual que antes)
const ExpenseCreateSchema = ExpenseBaseSchema;

// Schema para crear batch (agrega solo recurrenceCount)
const ExpenseBatchCreateSchema = ExpenseBaseSchema.extend({
  recurrenceCount: z.number().min(1).max(52).optional(),
});

const ExpenseUpdateSchema = ExpenseCreateSchema.partial();

const ExpenseQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
  category: z.string().optional(),
  frequency: z
    .enum(["MONTHLY", "BIWEEKLY", "WEEKLY", "ANNUAL", "ONE_TIME"])
    .optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "PARTIAL"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sort: z
    .enum(["dueDate", "amount", "description", "createdAt"])
    .optional()
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  includeMercadoPago: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  syncMercadoPago: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  // New filter parameters
  search: z.string().min(2).max(100).optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  dueFrom: z.string().datetime().optional(),
  dueTo: z.string().datetime().optional(),
  collectorId: z.string().optional(),
});

export const ExpenseController = {
  // GET /api/expenses
  getAll: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log("Fetching expenses...");
    const userId = req.user!.userId;
    const query = ExpenseQuerySchema.parse(req.query);

    const {
      page,
      limit,
      category,
      frequency,
      status,
      dateFrom,
      dateTo,
      sort,
      order,
      search,
      createdFrom,
      createdTo,
      dueFrom,
      dueTo,
      collectorId,
    } = query;

    let mercadoPagoSync:
      | { created: number; skipped: number; errors: number }
      | undefined;

    // Sync MercadoPago payments if requested
    console.log("Syncing MercadoPago payments...");
    try {
      const { mercadoPagoService, categoryService } = await import(
        "../services"
      );

      // Get or create default MercadoPago category
      let defaultCategory;
      try {
        const categories = await categoryService.findMany(userId, {
          where: {
            name: "MercadoPago",
            type: "EXPENSE",
          },
        });
        defaultCategory = categories[0];

        if (!defaultCategory) {
          defaultCategory = await categoryService.create(userId, {
            name: "MercadoPago",
            type: "EXPENSE",
            color: "#009EE3",
          });
        }
      } catch (error) {
        // Fallback: get any expense category
        const expenseCategories = await categoryService.findMany(userId, {
          where: { type: "EXPENSE" },
        });
        if (expenseCategories.length === 0) {
          throw new Error("No expense categories available");
        }
        defaultCategory = expenseCategories[0];
      }

      // Get MercadoPago payments from the first day of current month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const mercadoPagoResult =
        await mercadoPagoService.getRecentExpensePayments(
          userId,
          defaultCategory.id,
          firstDayOfMonth,
        );

      // Create expenses from MercadoPago payments, avoiding duplicates
      const syncResult = await expenseService.createFromMercadoPagoPayments(
        userId,
        mercadoPagoResult.expenses,
      );

      mercadoPagoSync = {
        created: syncResult.created.length,
        skipped: syncResult.skipped.length,
        errors: syncResult.errors.length,
      };
    } catch (error) {
      console.error("Error syncing MercadoPago payments:", error);
      mercadoPagoSync = {
        created: 0,
        skipped: 0,
        errors: 1,
      };
    }

    // Build where clause
    const whereClause: ExpenseWhereClause = {};
    if (category) whereClause.categoryId = category;
    if (frequency) whereClause.frequency = frequency;
    if (status) whereClause.status = status;
    if (collectorId) whereClause.collectorId = collectorId;
    
    // Search filter
    if (search) {
      whereClause.description = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // Creation date filters
    if (createdFrom || createdTo) {
      whereClause.createdAt = {};
      if (createdFrom) whereClause.createdAt.gte = new Date(createdFrom);
      if (createdTo) whereClause.createdAt.lte = new Date(createdTo);
    }
    
    // Due date filters (supporting both old and new parameters)
    if (dateFrom || dateTo || dueFrom || dueTo) {
      whereClause.dueDate = {};
      if (dateFrom || dueFrom) whereClause.dueDate.gte = new Date(dateFrom || dueFrom!);
      if (dateTo || dueTo) whereClause.dueDate.lte = new Date(dateTo || dueTo!);
    }

    const expenses = await expenseService.findMany(userId, {
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      orderBy: { [sort]: order },
    });

    const total = await expenseService.count(userId, whereClause);

    const responseData: any = {
      expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Include MercadoPago sync results if sync was performed

    responseData.mercadoPagoSync = mercadoPagoSync;

    res.status(200).json({
      success: true,
      data: responseData,
    });
  }),

  // GET /api/expenses/:id
  getById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const expense = await expenseService.findById(userId, id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
        code: "EXPENSE_NOT_FOUND",
      });
    }

    res.status(200).json({
      success: true,
      data: { expense },
    });
  }),

  // POST /api/expenses
  create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    console.log('Request body:', req.body);
    const validatedData = ExpenseCreateSchema.parse(req.body);
    console.log('Validated data:', validatedData);

    const expense = await expenseService.create(userId, validatedData);

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: { expense },
    });
  }),

  // POST /api/expenses/batch
  createBatch: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    console.log('Batch request body:', req.body);
    const validatedData = ExpenseBatchCreateSchema.parse(req.body);
    console.log('Batch validated data:', validatedData);

    // Validación: Si frequency es ONE_TIME y recurrenceCount > 1, retornar error
    if (validatedData.frequency === "ONE_TIME" && validatedData.recurrenceCount && validatedData.recurrenceCount > 1) {
      return res.status(400).json({
        success: false,
        error: "Cannot create recurring expenses with ONE_TIME frequency",
        code: "INVALID_RECURRENCE",
      });
    }

    const result = await expenseService.createRecurring(userId, validatedData);

    res.status(201).json({
      success: true,
      message: `Successfully created ${result.summary.created} expenses`,
      data: result,
    });
  }),

  // PUT /api/expenses/:id
  update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const validatedData = ExpenseUpdateSchema.parse(req.body);

    const expense = await expenseService.update(userId, id, validatedData);

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: { expense },
    });
  }),

  // DELETE /api/expenses/:id
  delete: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await expenseService.delete(userId, id);

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  }),

  // GET /api/expenses/search
  search: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log("Searching expenses...");
    const userId = req.user!.userId;
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
        code: "MISSING_QUERY",
      });
    }

    const expenses = await expenseService.search(userId, q);

    res.status(200).json({
      success: true,
      data: { expenses },
    });
  }),

  // GET /api/expenses/upcoming
  getUpcoming: asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user!.userId;
      const { days } = req.query;

      const daysNum = days ? parseInt(days as string) : 7;
      const expenses = await expenseService.findUpcoming(userId, daysNum);

      res.status(200).json({
        success: true,
        data: { expenses },
      });
    },
  ),

  // GET /api/expenses/overdue
  getOverdue: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;

    const expenses = await expenseService.findOverdue(userId);

    res.status(200).json({
      success: true,
      data: { expenses },
    });
  }),

  // GET /api/expenses/aggregate
  getAggregate: asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user!.userId;
      const { category, frequency, status, dateFrom, dateTo } = req.query;

      // Build where clause
      const whereClause: ExpenseWhereClause = {};
      if (category) whereClause.categoryId = category as string;
      if (frequency)
        whereClause.frequency = frequency as
          | "MONTHLY"
          | "BIWEEKLY"
          | "WEEKLY"
          | "ANNUAL"
          | "ONE_TIME";
      if (status)
        whereClause.status = status as
          | "PENDING"
          | "PAID"
          | "OVERDUE"
          | "PARTIAL";
      if (dateFrom || dateTo) {
        whereClause.dueDate = {};
        if (dateFrom) whereClause.dueDate.gte = new Date(dateFrom as string);
        if (dateTo) whereClause.dueDate.lte = new Date(dateTo as string);
      }

      const aggregate = await expenseService.aggregate(userId, whereClause);

      res.status(200).json({
        success: true,
        data: {
          totalAmount: aggregate._sum.amount || 0,
          averageAmount: aggregate._avg.amount || 0,
          count: aggregate._count,
        },
      });
    },
  ),

  // GET /api/expenses/count
  getCount: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { category, frequency, status } = req.query;

    // Build where clause
    const whereClause: ExpenseWhereClause = {};
    if (category) whereClause.categoryId = category as string;
    if (frequency)
      whereClause.frequency = frequency as
        | "MONTHLY"
        | "BIWEEKLY"
        | "WEEKLY"
        | "ANNUAL"
        | "ONE_TIME";
    if (status)
      whereClause.status = status as "PENDING" | "PAID" | "OVERDUE" | "PARTIAL";

    const count = await expenseService.count(userId, whereClause);

    res.status(200).json({
      success: true,
      data: { count },
    });
  }),

  // GET /api/expenses/dashboard/current-month
  getDashboardCurrentMonth: asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user!.userId;

      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Set times for GMT-3 noon (15:00 UTC)
      startOfMonth.setUTCHours(15, 0, 0, 0);
      endOfMonth.setUTCHours(15, 0, 0, 0);

      const whereClause: ExpenseWhereClause = {
        dueDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      };

      const expenses = await expenseService.findMany(userId, {
        where: whereClause,
        orderBy: { dueDate: "asc" },
      });

      res.status(200).json({
        success: true,
        data: { expenses },
      });
    },
  ),
};
