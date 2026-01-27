-- CreateEnum
CREATE TYPE "Role" AS ENUM ('cliente', 'coach', 'admin');

-- CreateEnum
CREATE TYPE "TipoSuscripcion" AS ENUM ('REGULAR', 'SUSCRIPTO');

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_userId_fkey";

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "color" TEXT DEFAULT '#8FD9FB',
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "numeroCamilla" INTEGER,
ADD COLUMN     "tematica" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "creditosDisponibles" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "planNombre" TEXT,
ADD COLUMN     "suscripcionActiva" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipoCliente" "TipoSuscripcion" NOT NULL DEFAULT 'REGULAR',
ADD COLUMN     "vencimientoPlan" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
