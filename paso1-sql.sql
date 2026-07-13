-- ============================================
-- 🚗 VALET PARKING - Esquema Completo
-- Pegar y EJECUTAR en Supabase SQL Editor
-- ============================================

-- Crear tablas
CREATE TABLE perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_valet INTEGER UNIQUE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('dueno', 'supervisor', 'valet')),
  pin TEXT,
  email TEXT UNIQUE,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE configuracion_app (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_app TEXT NOT NULL DEFAULT 'Valet Parking',
  logo_url TEXT,
  modificado_por UUID REFERENCES perfiles(id),
  ultima_modificacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_cierre TIMESTAMPTZ,
  abierto_por UUID NOT NULL REFERENCES perfiles(id),
  cerrado_por UUID REFERENCES perfiles(id),
  vehiculos_totales INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado'))
);

CREATE TABLE sectores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  capacidad INTEGER NOT NULL,
  color_hex TEXT NOT NULL DEFAULT '#3498DB',
  activo BOOLEAN NOT NULL DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE vehiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patente TEXT NOT NULL UNIQUE,
  modelo TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  foto_url TEXT,
  tiene_danos BOOLEAN NOT NULL DEFAULT false,
  danos_descripcion TEXT,
  danos_foto_url TEXT
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ticket INTEGER NOT NULL,
  codigo_qr TEXT,
  id_evento UUID NOT NULL REFERENCES eventos(id),
  id_vehiculo UUID NOT NULL REFERENCES vehiculos(id),
  id_sector UUID NOT NULL REFERENCES sectores(id),
  ubicacion_exacta TEXT NOT NULL,
  estado_llave TEXT NOT NULL CHECK (estado_llave IN ('colgada', 'cajon', 'con_dueno')),
  id_valet_entrada UUID NOT NULL REFERENCES perfiles(id),
  id_valet_salida UUID REFERENCES perfiles(id),
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'en_entrega', 'completado', 'cancelado')),
  hora_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  hora_salida TIMESTAMPTZ,
  ticket_cliente_entregado BOOLEAN NOT NULL DEFAULT false,
  ticket_auto_colocado BOOLEAN NOT NULL DEFAULT false,
  tiempo_espera_seg INTEGER,
  sincronizado BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE cambios_ubicacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_ticket UUID NOT NULL REFERENCES tickets(id),
  id_sector_anterior UUID NOT NULL REFERENCES sectores(id),
  id_sector_nuevo UUID NOT NULL REFERENCES sectores(id),
  ubicacion_anterior TEXT NOT NULL,
  ubicacion_nueva TEXT NOT NULL,
  id_valet UUID NOT NULL REFERENCES perfiles(id),
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  motivo TEXT
);

CREATE TABLE solicitudes_retiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_ticket UUID NOT NULL REFERENCES tickets(id),
  id_valet_asignado UUID REFERENCES perfiles(id),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_camino', 'recogiendo', 'completado')),
  solicitado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  asignado_en TIMESTAMPTZ,
  en_camino_desde TIMESTAMPTZ,
  recogido_en TIMESTAMPTZ,
  completado_en TIMESTAMPTZ
);

CREATE TABLE historial_completo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_ticket UUID NOT NULL REFERENCES tickets(id),
  id_evento UUID NOT NULL REFERENCES eventos(id),
  id_valet UUID NOT NULL REFERENCES perfiles(id),
  tipo TEXT NOT NULL,
  detalles JSONB,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_tickets_evento ON tickets(id_evento);
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_tickets_numero ON tickets(numero_ticket);
CREATE INDEX idx_historial_ticket ON historial_completo(id_ticket);
CREATE INDEX idx_historial_fecha ON historial_completo(creado_en DESC);
CREATE INDEX idx_solicitudes_estado ON solicitudes_retiro(estado);

-- 13 Sectores
INSERT INTO sectores (nombre, capacidad, color_hex, orden) VALUES
  ('Puerta Principal', 35, '#3498DB', 1),
  ('Calle Puerta Principal', 10, '#2ECC71', 2),
  ('Tunas Adentro', 15, '#F1C40F', 3),
  ('Tunas Calle', 15, '#E67E22', 4),
  ('Matera', 30, '#8B4513', 5),
  ('Cancha', 50, '#E74C3C', 6),
  ('Gallinero', 25, '#9B59B6', 7),
  ('Rotonda', 10, '#95A5A6', 8),
  ('Huéspedes 1', 10, '#85C1E9', 9),
  ('Huéspedes 2', 25, '#A3E4D7', 10),
  ('Pinos 1', 30, '#A0522D', 11),
  ('Pinos 2', 50, '#D4A017', 12),
  ('Estacionamiento de Campo', 1000, '#2C3E50', 13);

-- Config inicial
INSERT INTO configuracion_app (nombre_app) VALUES ('Valet Parking');

-- Funciones y Triggers
CREATE OR REPLACE FUNCTION next_ticket_number()
RETURNS INTEGER LANGUAGE SQL AS $$
  SELECT COALESCE(MAX(numero_ticket), 0) + 1 FROM tickets;
$$;

CREATE OR REPLACE FUNCTION registrar_historial()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO historial_completo (id_ticket, id_evento, id_valet, tipo, detalles)
  VALUES (NEW.id, NEW.id_evento, NEW.id_valet_entrada, 'entrada',
    jsonb_build_object('sector', (SELECT nombre FROM sectores WHERE id = NEW.id_sector),
      'ubicacion', NEW.ubicacion_exacta, 'llave', NEW.estado_llave));
  RETURN NEW;
END;
$$;
CREATE TRIGGER trigger_registrar_entrada AFTER INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION registrar_historial();

CREATE OR REPLACE FUNCTION actualizar_conteo_evento()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE eventos SET vehiculos_totales = vehiculos_totales + 1 WHERE id = NEW.id_evento;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trigger_actualizar_conteo AFTER INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION actualizar_conteo_evento();
