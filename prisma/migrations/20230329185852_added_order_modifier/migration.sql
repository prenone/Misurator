-- DropIndex
DROP INDEX "Experiment_name_key";

-- AlterTable
ALTER TABLE "Measurement" ADD COLUMN     "orderModifier" DOUBLE PRECISION NOT NULL DEFAULT 0;
