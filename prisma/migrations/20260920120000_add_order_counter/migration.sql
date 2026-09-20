-- CreateTable
CREATE TABLE "OrderCounter" (
    "year" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrderCounter_pkey" PRIMARY KEY ("year")
);

-- Carry over the numbers already handed out (OG-<year>-<sequence>) so the counter
-- continues from the highest existing sequence instead of restarting at 1.
INSERT INTO "OrderCounter" ("year", "value")
SELECT
    substring("number" from 4 for 4)::INTEGER,
    max(substring("number" from 9)::INTEGER)
FROM "Order"
WHERE "number" ~ '^OG-[0-9]{4}-[0-9]+$'
GROUP BY 1;
