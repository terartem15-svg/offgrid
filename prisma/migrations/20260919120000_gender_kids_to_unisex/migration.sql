-- AlterEnum
BEGIN;
CREATE TYPE "Gender_new" AS ENUM ('MEN', 'WOMEN', 'UNISEX');
ALTER TABLE "public"."Product" ALTER COLUMN "gender" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "public"."Gender_old";
ALTER TABLE "Product" ALTER COLUMN "gender" SET DEFAULT 'MEN';
COMMIT;
