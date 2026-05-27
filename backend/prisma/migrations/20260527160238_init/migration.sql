-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'ENCARGADO', 'SOLICITANTE');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "id_interno" VARCHAR(12) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "correo" VARCHAR(100),
    "departamento" VARCHAR(50) NOT NULL,
    "rol" "Rol" NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "categoria" VARCHAR(50) NOT NULL,
    "unidad_medida" VARCHAR(15) NOT NULL,
    "stock_actual" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "stock_minimo" DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embalajes" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "nombre_embalaje" VARCHAR(50) NOT NULL,
    "factor_conversion" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "embalajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "solicitante_id" INTEGER,
    "encargado_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_id_interno_key" ON "usuarios"("id_interno");

-- AddForeignKey
ALTER TABLE "embalajes" ADD CONSTRAINT "embalajes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_encargado_id_fkey" FOREIGN KEY ("encargado_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
