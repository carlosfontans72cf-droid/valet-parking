-- ============================================
-- 🚗 DESACTIVAR RLS (Row Level Security)
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor
-- ============================================

ALTER TABLE public.perfiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_app DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cambios_ubicacion DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_retiro DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_completo DISABLE ROW LEVEL SECURITY;

-- Verificar que están desactivadas
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%' AND tablename NOT LIKE '_prisma%'
ORDER BY tablename;
