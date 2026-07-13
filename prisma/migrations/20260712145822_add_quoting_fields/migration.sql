-- AlterTable
ALTER TABLE "Requirement" ADD COLUMN     "estimatedCost" INTEGER,
ADD COLUMN     "estimatedTimelineDaysMax" INTEGER,
ADD COLUMN     "estimatedTimelineDaysMin" INTEGER,
ADD COLUMN     "platformType" TEXT,
ADD COLUMN     "pricingBreakdown" JSONB,
ADD COLUMN     "projectCategory" TEXT,
ADD COLUMN     "quoteMarkdown" TEXT,
ADD COLUMN     "requestedTimelineDays" INTEGER,
ADD COLUMN     "schoolRequirements" TEXT,
ADD COLUMN     "userRoles" JSONB;
