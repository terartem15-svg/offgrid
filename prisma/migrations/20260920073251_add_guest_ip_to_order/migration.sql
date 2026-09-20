-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "guestIp" TEXT;

-- CreateIndex
CREATE INDEX "Order_guestIp_idx" ON "Order"("guestIp");
