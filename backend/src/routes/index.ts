import { Router } from "express";
import { healthCheck } from "../services";

// Import route modules
import authRoutes from "./auth.routes";
import incomeRoutes from "./income.routes";
import expenseRoutes from "./expense.routes";
import categoryRoutes from "./category.routes";
import mercadoPagoRoutes from "./mercadopago.routes";
import collectorRoutes from "./collector.routes";

const router = Router();

// Health check endpoint
router.get("/health", async (req, res) => {
  const health = await healthCheck();
  const status = health.status === "healthy" ? 200 : 503;

  res.status(status).json({
    success: health.status === "healthy",
    data: health,
  });
});

// API status endpoint
router.get("/status", (req, res) => {
  res.json({
    success: true,
    message: "Fianzas Manager API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use("/auth", authRoutes);
router.use("/incomes", incomeRoutes);
router.use("/expenses", expenseRoutes);
router.use("/categories", categoryRoutes);
router.use("/mercadopago", mercadoPagoRoutes);
router.use("/collectors", collectorRoutes);

export default router;
