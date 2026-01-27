/*
  Warnings:

  - You are about to drop the column `proximaClase` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Class` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "proximaClase",
ADD COLUMN     "contactoEmergencia" TEXT,
ADD COLUMN     "fechaNacimiento" TIMESTAMP(3),
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'CLIENTE';

-- DropTable
DROP TABLE "Class";

-- CreateTable
CREATE TABLE "ClaseDisponible" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "horario" TIMESTAMP(3) NOT NULL,
    "coach" TEXT,
    "capacidadMaxima" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "ClaseDisponible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "claseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_userId_claseId_key" ON "Reserva"("userId", "claseId");

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "ClaseDisponible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
