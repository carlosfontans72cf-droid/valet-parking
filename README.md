# 🚗 Valet Parking — App de Estacionamiento para Eventos

Sistema completo de valet parking con soporte para **múltiples eventos simultáneos**, trazabilidad total, y app PWA para valets.

## ✨ Características

- 🎯 **Eventos simultáneos**: Varios eventos activos al mismo tiempo (bodas, cenas, cumpleaños)
- 🔑 **App Valet**: Interfaz táctil con botones grandes, solo tocar
- 🅿️ **13 sectores** con colores distintivos y ocupación en vivo
- 🎫 **Dos tickets físicos**: uno para el cliente + colgante para el auto
- 🔄 **Trazabilidad total**: cada movimiento registra valet, fecha y hora
- 📊 **Dashboard público** en tiempo real
- 📺 **Vista TV/Proyector**: pantalla gigante para salones
- 👑 **Panel del dueño**: configurable (nombre, sectores, colores, capacidades)
- 📱 **PWA**: funciona como app instalable en Android e iPhone
- 🔌 **Sin cables**: Next.js + Supabase, $0/mes en costos

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|------------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS 4 |
| Base de datos | PostgreSQL (Supabase) |
| Tiempo real | Supabase Realtime (WebSockets) |
| Autenticación | Supabase Auth + PIN personalizado |
| Estado | Zustand |
| PWA | Manifest + Service Worker |
| Despliegue | Vercel + GitHub |

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/valet-parking.git
cd valet-parking
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com) (gratis)
2. Ir a **Project Settings → API**
3. Copiar `Project URL` y `anon public key`
4. Crear archivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ_tu_anon_key
```

### 4. Ejecutar migraciones SQL

1. En Supabase, ir a **SQL Editor**
2. Copiar y pegar el contenido de `supabase/migrations/001_schema.sql`
3. Ejecutar

### 5. Crear el primer usuario (Dueño)

1. Ir a **Authentication → Users → Add User**
2. Crear un usuario con email y contraseña
3. Luego en **SQL Editor**, ejecutar:
```sql
INSERT INTO perfiles (id, numero_valet, nombre, rol, email)
VALUES ('ID_DEL_USUARIO_CREADO', 1, 'Admin', 'dueno', 'email@ejemplo.com');
```

### 6. Ejecutar en local
```bash
npm run dev
```

### 7. Desplegar en Vercel
```bash
npx vercel
```

## 📱 Uso

### Valet
1. Entrar con su **número de valet** + **PIN**
2. **Registrar entrada**: patente, sector, ubicación, estado de llave, tickets
3. **Solicitudes**: ver retiros pendientes, marcar "En camino" → "Recogí" → "Entregado"
4. **Cambiar ubicación**: mover un vehículo de sector

### Supervisor
1. Dashboard con solicitudes pendientes
2. Asignar valets a cada solicitud
3. Monitorear eventos activos

### Dueño
1. Crear/cerrar eventos
2. Configurar nombre de la app, sectores, colores
3. Agregar/quitar valets
4. Ver histórico completo
5. Borrar histórico (con confirmación doble)

### Vista TV
- Abrir: `https://tu-app.vercel.app/dashboard/tv`
- Ideal para proyectar en una pantalla grande en el salón principal

## 🅿️ Sectores Configurados

| # | Sector | Capacidad | Color |
|---|--------|:---------:|-------|
| 1 | Puerta Principal | 35 | 🔵 |
| 2 | Calle Puerta Principal | 10 | 🟢 |
| 3 | Tunas Adentro | 15 | 🟡 |
| 4 | Tunas Calle | 15 | 🟠 |
| 5 | Matera | 30 | 🟤 |
| 6 | Cancha | 50 | 🔴 |
| 7 | Gallinero | 25 | 🟣 |
| 8 | Rotonda | 10 | ⚪ |
| 9 | Huéspedes 1 | 10 | 🔵 |
| 10 | Huéspedes 2 | 25 | 🟢 |
| 11 | Pinos 1 | 30 | 🟤 |
| 12 | Pinos 2 | 50 | 🟡 |
| 13 | Estacionamiento de Campo | 1000 | ⚫ |
| | **Total** | **1,305** | |

## 📄 Licencia

MIT
