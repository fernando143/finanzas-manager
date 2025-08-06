-- CreateIndex
CREATE INDEX "budget_allocations_categoryId_idx" ON "public"."budget_allocations"("categoryId");

-- AddForeignKey
ALTER TABLE "public"."budget_allocations" ADD CONSTRAINT "budget_allocations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
