-- AlterTable
ALTER TABLE "movimientos" ALTER COLUMN "fecha" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "password" VARCHAR(255);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "accion" VARCHAR(100) NOT NULL,
    "entidad" VARCHAR(50) NOT NULL,
    "entidad_id" INTEGER,
    "detalles" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
