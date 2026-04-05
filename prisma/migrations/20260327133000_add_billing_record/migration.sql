CREATE TABLE "BillingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "invoiceNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BillingRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "BillingRecord_clientId_year_month_key" ON "BillingRecord"("clientId", "year", "month");
CREATE INDEX "BillingRecord_year_month_idx" ON "BillingRecord"("year", "month");
CREATE INDEX "BillingRecord_clientId_idx" ON "BillingRecord"("clientId");
