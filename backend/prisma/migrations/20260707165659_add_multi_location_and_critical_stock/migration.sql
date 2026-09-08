/*
  Warnings:

  - You are about to drop the column `stock_actual` on the `productos` table. All the data in the column will be lost.
  - You are about to drop the column `stock_minimo` on the `productos` table. All the data in the column will be lost.
  - Added the required column `edificio` to the `movimientos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "movimientos" ADD COLUMN     "edificio" VARCHAR(50) NOT NULL DEFAULT 'ADM1';

-- AlterTable
ALTER TABLE "productos" DROP COLUMN "stock_actual",
DROP COLUMN "stock_minimo";

-- CreateTable
CREATE TABLE "stock_edificio" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "edificio" VARCHAR(50) NOT NULL,
    "stock_actual" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "stock_minimo" DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "stock_edificio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_stock_critico" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "edificio" VARCHAR(50) NOT NULL,
    "stock_visto" DECIMAL(10,2) NOT NULL,
    "stock_min" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_stock_critico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_edificio_producto_id_edificio_key" ON "stock_edificio"("producto_id", "edificio");

-- AddForeignKey
ALTER TABLE "stock_edificio" ADD CONSTRAINT "stock_edificio_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_stock_critico" ADD CONSTRAINT "historial_stock_critico_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
