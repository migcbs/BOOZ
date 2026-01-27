-- CreateEnum
CREATE TYPE "TipoPaquete" AS ENUM ('LMV', 'MJ', 'SUELTA');

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paqueteRef" "TipoPaquete" NOT NULL DEFAULT 'SUELTA',
ALTER COLUMN "color" SET DEFAULT '#89CFF0';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "paqueteTipo" "TipoPaquete";

-- CreateIndex
CREATE INDEX "Class_fecha_idx" ON "Class"("fecha");
