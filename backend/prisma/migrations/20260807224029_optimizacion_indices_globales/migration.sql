-- AlterTable
ALTER TABLE "movimientos" ALTER COLUMN "edificio" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "auditoria_fecha_idx" ON "auditoria"("fecha" DESC);

-- CreateIndex
CREATE INDEX "auditoria_usuario_id_idx" ON "auditoria"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_entidad_idx" ON "auditoria"("entidad");

-- CreateIndex
CREATE INDEX "embalajes_producto_id_idx" ON "embalajes"("producto_id");

-- CreateIndex
CREATE INDEX "historial_stock_critico_fecha_idx" ON "historial_stock_critico"("fecha" DESC);

-- CreateIndex
CREATE INDEX "historial_stock_critico_edificio_idx" ON "historial_stock_critico"("edificio");

-- CreateIndex
CREATE INDEX "movimientos_fecha_idx" ON "movimientos"("fecha" DESC);

-- CreateIndex
CREATE INDEX "movimientos_edificio_idx" ON "movimientos"("edificio");

-- CreateIndex
CREATE INDEX "movimientos_tipo_idx" ON "movimientos"("tipo");

-- CreateIndex
CREATE INDEX "movimientos_producto_id_idx" ON "movimientos"("producto_id");

-- CreateIndex
CREATE INDEX "movimientos_solicitante_id_idx" ON "movimientos"("solicitante_id");

-- CreateIndex
CREATE INDEX "productos_nombre_idx" ON "productos"("nombre");

-- CreateIndex
CREATE INDEX "productos_categoria_idx" ON "productos"("categoria");

-- CreateIndex
CREATE INDEX "stock_edificio_edificio_idx" ON "stock_edificio"("edificio");

-- CreateIndex
CREATE INDEX "stock_edificio_producto_id_idx" ON "stock_edificio"("producto_id");

-- CreateIndex
CREATE INDEX "usuarios_nombre_idx" ON "usuarios"("nombre");

-- CreateIndex
CREATE INDEX "usuarios_correo_idx" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "usuarios_id_interno_idx" ON "usuarios"("id_interno");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");
