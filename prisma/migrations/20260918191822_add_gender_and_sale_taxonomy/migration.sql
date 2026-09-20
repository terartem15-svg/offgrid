-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MEN', 'WOMEN', 'KIDS');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "compareAtPrice" INTEGER,
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'MEN';

-- CreateIndex
CREATE INDEX "Product_gender_idx" ON "Product"("gender");
