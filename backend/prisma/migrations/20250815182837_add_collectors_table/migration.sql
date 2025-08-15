-- AlterTable
ALTER TABLE "public"."expenses" ADD COLUMN     "collectorId" TEXT;

-- CreateTable
CREATE TABLE "public"."collectors" (
    "id" TEXT NOT NULL,
    "collectorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collectors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collectors_collectorId_key" ON "public"."collectors"("collectorId");

-- CreateIndex
CREATE INDEX "collectors_userId_idx" ON "public"."collectors"("userId");

-- CreateIndex
CREATE INDEX "collectors_collectorId_idx" ON "public"."collectors"("collectorId");

-- AddForeignKey
ALTER TABLE "public"."collectors" ADD CONSTRAINT "collectors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "public"."collectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
