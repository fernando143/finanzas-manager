-- AlterTable
ALTER TABLE "public"."expenses" ADD COLUMN     "mercadoPagoPaymentId" TEXT;

-- CreateIndex
CREATE INDEX "expenses_mercadoPagoPaymentId_idx" ON "public"."expenses"("mercadoPagoPaymentId");
