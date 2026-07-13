# 🚗 Valet Parking — Estructura Completa del Sistema (v2)

---

## 📋 Decisiones Confirmadas (Actualizado)

| Aspecto | Decisión |
|---------|----------|
| **Filosofía** | **App ágil — solo tocar botones.** Mínimo escritura, máximo impacto visual. |
| **Tickets** | Dos físicos: cliente + colgante auto (misma numeración) |
| **QR** | Opcional (futuro) |
| **Datos vehículo** | Patente, modelo, color + foto opcional + daños opcional |
| **Sectores** | 13 zonas con **colores distintos** para identificación visual rápida |
| **# Valet** | **Obligatorio** — cada operación registra qué valet la hizo |
| **Ubicación** | **Obligatoria** — lugar exacto donde se dejó |
| **Estado llave** | **Obligatorio** — colgada / cajón / con dueño |
| **Trazabilidad total** | Cada movimiento (entrada, salida, cambio) queda registrado con: **valet, fecha y hora** |
| **Eventos simultáneos** | Múltiples eventos activos al mismo tiempo. Cada uno con su propio conteo y control (ej: "Boda Carlos & Leli" + "Cena Ricardo") |
| **Configurable** | Dueño modifica: nombre app, sectores, capacidades, colores |
| **Dispositivos** | Cada valet tiene su propio celular |
| **Idioma** | Español |

---

## 💡 Ideas para mejorar (propuestas)

Además de lo que pediste, te tiro estas ideas:

| # | Idea | Descripción |
|---|------|-------------|
| 1️⃣ | **Nombre del cliente** | Asociar el vehículo al nombre del cliente (ej: "Señora María") para buscarlo rápido cuando no recuerda la patente |
| 2️⃣ | **Modo offline automático** | Si el valet pierde señal, la app sigue funcionando y sincroniza cuando vuelve |
| 3️⃣ | **Pantalla TV / Proyector** | Vista gigante optimizada para mostrar en una tele en el salón principal |
| 4️⃣ | **Asignación inteligente** | El sistema asigna automáticamente al valet con menos trabajo |
| 5️⃣ | **Tiempo estimado de espera** | Calculadora automática: "Faltan 4 min para tu auto" |
| 6️⃣ | **Búsqueda por nombre** | Buscar auto por nombre del cliente, no solo por ticket |
| 7️⃣ | **Resumen automático al cerrar evento** | Al cerrar "Boda Carlos", muestra: 32 autos, tiempo promedio 5min, valet más rápido... |
| 8️⃣ | **Modo oscuro** | Para que no encandile a los valets de noche |

> ¿Te interesa alguna? Las podemos incluir desde el inicio o dejarlas para después.

---

## 1. 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────┐
│                   CLIENTES                       │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │   PC     │  │ Android  │  │     iPhone     │ │
│  │ (Web)    │  │ (PWA)    │  │     (PWA)      │ │
│  │ Pantalla │  │          │  │                │ │
│  │ gigante  │  │          │  │                │ │
│  └────┬─────┘  └────┬─────┘  └───────┬────────┘ │
└───────┼──────────────┼────────────────┼──────────┘
        │              │                │
        ▼              ▼                ▼
┌─────────────────────────────────────────────────┐
│            NEXT.JS (App Router)                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Frontend (React + Tailwind CSS)        │    │
│  │  - Dashboard General (todos lo ven)     │    │
│  │  - Vista por Evento                     │    │
│  │  - Panel Dueño (config total)           │    │
│  │  - App Valet (botones grandes, táctil)  │    │
│  │  - PWA (service worker + manifest)      │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │  API Routes (Server Actions / REST)     │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              SUPABASE (Backend)                  │
│  ┌──────────────┐  ┌──────────┐  ┌───────────┐ │
│  │  PostgreSQL  │  │  Auth    │  │ Realtime  │ │
│  │  (Base de    │  │  (PIN +  │  │ (WebSockets│ │
│  │   datos)     │  │   sesión)│  │  en vivo)  │ │
│  └──────────────┘  └──────────┘  └───────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 2. 🧑‍💼 Roles y Permisos

| Rol | Acceso | Permisos |
|-----|--------|----------|
| **👑 Dueño** | PC + Móvil | **TODO**: crear eventos, modificar app/sectores, CRUD usuarios, ver histórico completo, borrar histórico |
| **👁️ Supervisor** | PC + Móvil | Dashboard en vivo, asignar valets, ver reportes, gestionar incidencias |
| **🔑 Valet** | Móvil (PWA) | Registrar entrada/salida, cambios, ver solicitudes asignadas |

---

## 3. 🗄️ Modelo de Datos (Base de Datos)

### 🔥 CAMBIO CLAVE: Eventos simultáneos

Cada evento (boda, cena, cumpleaños) es independiente y puede estar activo al mismo tiempo que otros. Cada uno tiene su propio conteo de vehículos.

---

### Tabla: `eventos` (antes "turnos")
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| nombre | TEXT | **Nombre del evento** (ej: "Boda Carlos & Leli", "Cena Ricardo") |
| fecha_apertura | TIMESTAMP | Cuándo se abrió |
| fecha_cierre | TIMESTAMP | Cuándo se cerró (nullable) |
| abierto_por | UUID (FK → perfiles) | Quién lo abrió |
| cerrado_por | UUID (FK → perfiles) | Quién lo cerró |
| vehiculos_totales | INTEGER | Cuántos vehículos tuvo (se calcula al cerrar) |
| estado | ENUM('abierto','cerrado') | Estado actual |

> 💡 **Pueden haber múltiples eventos ABIERTOS al mismo tiempo.** Cada vehículo pertenece a UN evento.

### Tabla: `perfiles`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| numero_valet | INTEGER | Número único del valet (visible) |
| nombre | TEXT | Nombre completo |
| rol | ENUM('dueno','supervisor','valet') | Rol |
| pin | TEXT (hash) | PIN (valets) |
| email | TEXT | Email (dueño/supervisor) |
| activo | BOOLEAN | Habilitado |
| creado_en | TIMESTAMP | Fecha de creación |

### Tabla: `configuracion_app`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| nombre_app | TEXT | Nombre (modificable) |
| logo_url | TEXT | Logo |
| modificado_por | UUID (FK → perfiles) | Último en modificar |
| ultima_modificacion | TIMESTAMP | |

### Tabla: `sectores`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| nombre | TEXT | Nombre (modificable) |
| capacidad | INTEGER | Capacidad (modificable) |
| color_hex | TEXT | **Color en HEX** ej: #3498db (modificable) |
| activo | BOOLEAN | Si está en uso |
| orden | INTEGER | Orden de visualización |

#### Sectores Iniciales con Colores

| # | Sector | Capacidad | Color HEX | Visual |
|---|--------|:---------:|-----------|--------|
| 1 | 🚪 Puerta Principal | 35 | `#3498DB` | 🔵 Azul |
| 2 | 🏠 Calle Puerta Principal | 10 | `#2ECC71` | 🟢 Verde |
| 3 | 🌳 Tunas Adentro | 15 | `#F1C40F` | 🟡 Amarillo |
| 4 | 🛣️ Tunas Calle | 15 | `#E67E22` | 🟠 Naranja |
| 5 | 🧉 Matera | 30 | `#8B4513` | 🟤 Marrón |
| 6 | ⚽ Cancha | 50 | `#E74C3C` | 🔴 Rojo |
| 7 | 🐔 Gallinero | 25 | `#9B59B6` | 🟣 Púrpura |
| 8 | 🔄 Rotonda | 10 | `#95A5A6` | ⚪ Gris |
| 9 | 🏨 Huéspedes 1 | 10 | `#85C1E9` | 🔵 Celeste |
| 10 | 🏨 Huéspedes 2 | 25 | `#A3E4D7` | 🟢 Menta |
| 11 | 🌲 Pinos 1 | 30 | `#A0522D` | 🟤 Café |
| 12 | 🌲 Pinos 2 | 50 | `#D4A017` | 🟡 Mostaza |
| 13 | 🌾 Est. de Campo | 1000 | `#2C3E50` | ⚫ Negro |
| | **Total** | **1,305** | | |

### Tabla: `vehiculos`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| patente | TEXT | Placa (única) |
| modelo | TEXT | Marca y modelo |
| color | TEXT | Color |
| foto_url | TEXT | Foto (opcional) |
| tiene_danos | BOOLEAN | Daños registrados |
| danos_descripcion | TEXT | Descripción de daños |
| danos_foto_url | TEXT | Foto del daño |

### Tabla: `tickets`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador |
| numero_ticket | INTEGER | N° correlativo |
| id_evento | UUID (FK → eventos) | **Evento al que pertenece** (obligatorio) |
| id_vehiculo | UUID (FK → vehiculos) | Vehículo |
| id_sector | UUID (FK → sectores) | Sector donde se estacionó |
| ubicacion_exacta | TEXT | **Lugar exacto obligatorio** |
| estado_llave | ENUM('colgada','cajon','con_dueno') | **Obligatorio** |
| id_valet_entrada | UUID (FK → perfiles) | ✅ **Valet que lo estacionó** |
| id_valet_salida | UUID (FK → perfiles) | ✅ **Valet que lo entregó** (nullable) |
| estado | ENUM('activo','en_entrega','completado','cancelado') | Estado |
| hora_entrada | TIMESTAMP | ✅ **Fecha y hora de entrada** |
| hora_salida | TIMESTAMP | ✅ **Fecha y hora de salida** (nullable) |
| ticket_cliente_entregado | BOOLEAN | |
| ticket_auto_colocado | BOOLEAN | |
| tiempo_espera_seg | INTEGER | Tiempo de espera |
| sincronizado | BOOLEAN | Offline |

### Tabla: `cambios_ubicacion`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | |
| id_ticket | UUID (FK → tickets) | Vehículo movido |
| id_sector_anterior | UUID (FK → sectores) | Sector anterior |
| id_sector_nuevo | UUID (FK → sectores) | Sector nuevo |
| ubicacion_anterior | TEXT | Dónde estaba |
| ubicacion_nueva | TEXT | Dónde se movió |
| **id_valet** | UUID (FK → perfiles) | ✅ **Valet que lo movió** |
| **fecha_hora** | TIMESTAMP | ✅ **Cuándo lo movió** |
| motivo | TEXT | Motivo (opcional) |

### Tabla: `solicitudes_retiro`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | |
| id_ticket | UUID (FK → tickets) | |
| id_valet_asignado | UUID (FK → perfiles) | |
| estado | ENUM('pendiente','en_camino','recogiendo','completado') | |
| **solicitado_en** | TIMESTAMP | ✅ Fecha/hora |
| **asignado_en** | TIMESTAMP | ✅ |
| **en_camino_desde** | TIMESTAMP | ✅ |
| **recogido_en** | TIMESTAMP | ✅ |
| **completado_en** | TIMESTAMP | ✅ |

### Tabla: `historial_completo` (trazabilidad total)
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | |
| id_ticket | UUID (FK → tickets) | Ticket afectado |
| id_evento | UUID (FK → eventos) | Evento del ticket |
| **id_valet** | UUID (FK → perfiles) | ✅ **Valet responsable** |
| **tipo** | TEXT | 'entrada','salida','cambio_sector','cambio_ubicacion','retiro_en_camino','retiro_recogido','retiro_entregado','cambio_llave' |
| **detalles** | JSONB | Info extra de la acción |
| **creado_en** | TIMESTAMP | ✅ **Fecha y hora exacta** |

> 🔥 Con esta tabla, **cada movimiento tiene: QUIEN (valet), CUANDO (fecha+hora), QUE (acción), DONDE (sector)**. Si hay un problema con un vehículo, sabes EXACTAMENTE quién lo tocó y cuándo.

---

## 4. 🔄 Flujo de Trabajo

### 4.0 CREAR Y ABRIR EVENTO
```
Dueño/Supervisor abre la app
        │
        ▼
Presiona "➕ NUEVO EVENTO"
        │
        ▼
Ingresa nombre: "Boda Carlos & Leli"
        │
        ▼
¡LISTO! El evento se abre automáticamente
  └─ Contadores en 0
  └─ Se suma al dashboard como evento activo
        │
        ▼
Puede abrir OTRO al mismo tiempo:
  "Cena de Ricardo" → también activo
        │
        ▼
Cada uno tiene su PROPIO conteo de vehículos
```

### 4.1 CHECK-IN (Entrada)

```
Valet abre la app → selecciona el evento activo
  └─ Ej: "Boda Carlos & Leli" (toque rápido)
        │
        ▼
Pantalla de registro (TODO CON BOTONES):
  ┌─────────────────────────────┐
  │ 🚗 ENTRADA - Boda Carlos   │
  │                             │
  │ Valet: [ #3 - Luis ]       │
  │                             │
  │ Patente: [ABC123          ] │
  │  (input grande, se escribe  │
  │   o se dicta por voz)       │
  │                             │
  │ 📸  🔧                      │
  │ Foto  Daños (opcional)      │
  │                             │
  │ 🔑 ¿DÓNDE ESTÁ LA LLAVE?   │
  │ ┌──────┐ ┌──────┐ ┌──────┐ │
  │ │🔑    │ │📁    │ │👤    │ │
  │ │COLG. │ │CAJÓN │ │DUEÑO │ │
  │ └──────┘ └──────┘ └──────┘ │
  │                             │
  │ 🅿️ SELECCIONAR SECTOR:     │
  │ ┌──────┐ ┌──────┐ ┌──────┐ │
  │ │🔵    │ │🟢    │ │🟡    │ │
  │ │PTA   │ │CALLE │ │TUNAS │ │
  │ │PPAL  │ │PPAL  │ │ADENT │ │
  │ │12/35 │ │ 3/10 │ │ 5/15 │ │
  │ └──────┘ └──────┘ └──────┘ │
  │ ┌──────┐ ┌──────┐ ┌──────┐ │
  │ │🟠    │ │🟤    │ │🔴    │ │
  │ │TUNAS │ │MATERA│ │CANCHA│ │
  │ │CALLE │ │      │ │      │ │
  │ │ 2/15 │ │10/30 │ │20/50 │ │
  │ └──────┘ └──────┘ └──────┘ │
  │ ... (más sectores)         │
  │                             │
  │ 📍 UBICACIÓN EXACTA:       │
  │ [Fila 3, Espacio 12      ] │
  │                             │
  │ ✅ REGISTRAR ENTRADA        │
  └─────────────────────────────┘
        │
        ▼
🚀 TODO QUEDA REGISTRADO:
  ├─ Valet: #3 Luis
  ├─ Fecha: 11/07/2026
  ├─ Hora: 10:32:15
  ├─ Evento: Boda Carlos
  ├─ Sector: Cancha
  └─ Acción: ENTRADA
```

### 4.2 CHECK-OUT

```
Cliente llega con ticket → #047
        │
        ▼
Supervisor toca "📋 BUSCAR TICKET"
  └─ Ingresa número: 047
        │
        ▼
APARECE TODO:
  ┌──────────────────────────────┐
  │  🎫 TICKET #047              │
  │  Evento: Boda Carlos         │
  │  🚘 Toyota Corolla Gris      │
  │  📍 Cancha - Fila 3, Esp 12 │
  │  🔑 Llave: 📁 Cajón          │
  │  ────────────────────────── │
  │  🕐 Entrada: 10:32hs         │
  │  👤 Estacionó: #3 Luis       │
  │  ────────────────────────── │
  │  📋 HISTORIAL DEL VEHÍCULO: │
  │  10:32 Entrada — #3 Luis   │
  │  11:15 Cambio sector       │
  │       Cancha→Pta Ppal      │
  │       — #7 María           │
  └──────────────────────────────┘
        │
        ▼
Supervisor asigna retiro a valet disponible
        │
        ▼
Valet recibe en su celular:

  ┌──────────────────────────────┐
  │  🚶 SOLICITUD #047           │
  │  Toyota Corolla - Cancha     │
  │  Fila 3, Esp 12              │
  │  Llave: 📁 Cajón             │
  │                              │
  │  ┌────────────────────────┐  │
  │  │ 🚶 EN CAMINO           │  │
  │  └────────────────────────┘  │
  │                              │
  │  ┌────────────────────────┐  │
  │  │ 🚗 RECOGÍ EL VEHÍCULO  │  │
  │  └────────────────────────┘  │
  │                              │
  │  ┌────────────────────────┐  │
  │  │ ✅ VEHÍCULO ENTREGADO  │  │
  │  └────────────────────────┘  │
  └──────────────────────────────┘

✅ CADA BOTÓN REGISTRA:
  ├─ Valet: #5 María
  ├─ Hora exacta
  └─ Acción
```

### 4.3 CAMBIO DE UBICACIÓN

```
Valet mueve un vehículo
        │
        ▼
Abre la app → busca ticket por número
        │
        ▼
Toca "🔄 CAMBIAR UBICACIÓN"
        │
        ▼
BOTONES DE SECTOR (coloridos):
  ┌──────┐ ┌──────┐ ┌──────┐
  │🔵    │ │🟢    │ │🟡    │
  │PTA   │ │CALLE │ │TUNAS │
  │PPAL  │ │PPAL  │ │ADENT │
  └──────┘ └──────┘ └──────┘
  ...
        │
        ▼
Ingresa nueva ubicación exacta
        │
        ▼
✅ REGISTRADO:
  ├─ Valet: #3 Luis
  ├─ Fecha: 11/07/2026
  ├─ Hora: 11:15:22
  ├─ De: Cancha, Fila 3 Esp 12
  ├─ A: Puerta Principal, Fila 1 Esp 5
  └─ Queda en el historial del vehículo
```

---

## 5. 🖥️ Pantallas de la Aplicación

### 5.1 🏠 DASHBOARD GENERAL (lo ven TODOS)

```
┌──────────────────────────────────────────────────┐
│  🏪 [Valet Parking]           ─── 11 JUL 2026   │
├──────────────────────────────────────────────────┤
│                                                  │
│  ──── EVENTOS ACTIVOS ────                      │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ 💒 BODA CARLOS & LELI                    │   │
│  │  🚗 32 autos   ⏳ Abierto 09:30          │   │
│  │  📊 Ver detalle →                         │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ 🍽️ CENA DE RICARDO                      │   │
│  │  🚗 18 autos   ⏳ Abierto 10:00          │   │
│  │  📊 Ver detalle →                         │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ──── RESUMEN GLOBAL ────                       │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ 🚗 TOTAL     │  │ 🅿️  SECTORES  │            │
│  │   VEHÍCULOS  │  │   ACTIVOS    │            │
│  │     ╔═══╗    │  │     ╔═══╗   │            │
│  │     ║ 50║    │  │     ║ 8 ║   │            │
│  │     ╚═══╝    │  │     ╚═══╝   │            │
│  │  En todos    │  │  De 13      │            │
│  │  los eventos │  │             │            │
│  └──────────────┘  └──────────────┘            │
│                                                  │
│  ──── OCUPACIÓN POR SECTOR ────                 │
│  🚪 [████████░░] 12/35 Pta Principal  🔵       │
│  🌳 [██████░░░░]  9/15 Tunas Adentro 🟡        │
│  ⚽ [██████████] 30/50 Cancha        🔴         │
│  ...                                            │
│                                                  │
│  ──── ÚLTIMOS MOVIMIENTOS ────                  │
│  🕐 10:32 #047 Toyota — Boda Carlos            │
│     ➜ ENTRADA — Valet #3 Luis (Cancha)        │
│  🕐 10:28 #045 Ford — Cena Ricardo             │
│     ➜ ENTREGADO — Valet #5 María (4 min)      │
│  🕐 10:25 #042 VW — Boda Carlos               │
│     ➜ CAMBIO — Cancha→Pta Ppal — Valet #7     │
└──────────────────────────────────────────────────┘
```

### 5.2 📊 VISTA POR EVENTO

```
┌──────────────────────────────────────────────┐
│  ← Volver                   💒 BODA CARLOS  │
├──────────────────────────────────────────────┤
│                                              │
│  🚗 Total: 32 autos    ⏳ Abierto 09:30     │
│                                              │
│  ──── VALETS ASIGNADOS ────                 │
│  #3 Luis 🟢   #5 María 🟢   #7 Carlos 🟡   │
│  (🟢 disponible  🟡 ocupado  🔴 ausente)   │
│                                              │
│  ──── SECTORES ────                          │
│  🔵 Pta Ppal  [████░░░░░░]  8/35            │
│  🟢 Calle Ppal [██░░░░░░░░]  2/10            │
│  🟡 Tunas Ad. [██████░░░░]  9/15            │
│  🔴 Cancha    [██████████] 30/50            │
│  ...                                         │
│                                              │
│  ──── VEHÍCULOS ACTIVOS ────                │
│  Buscar: [🔍 Ticket o nombre           ]    │
│                                              │
│  #047 Toyota Corolla — Cancha F3-E12        │
│     🔑 Cajón   ⏳ 10:32   👤 #3 Luis       │
│                                              │
│  #048 VW Gol — Pta Ppal F1-E8               │
│     🔑 Colgada ⏳ 10:35   👤 #5 María      │
│  ...                                         │
│                                              │
│  ┌──────────────────────────────────┐       │
│  │ 🔴 CERRAR EVENTO                 │       │
│  │ Al cerrar se guarda resumen      │       │
│  └──────────────────────────────────┘       │
└──────────────────────────────────────────────┘
```

### 5.3 App Valet (Mobile-First — Solo Botones)

```
┌───────────────────────────────┐
│  🔑 Valet #3 — Luis          │
│  💒 Boda Carlos (activo)     │
├───────────────────────────────┤
│                               │
│  ┌─────────────────────────┐  │
│  │  🚗                     │  │
│  │  REGISTRAR ENTRADA      │  │
│  │  Nuevo vehículo         │  │
│  └─────────────────────────┘  │
│                               │
│  ┌─────────────────────────┐  │
│  │  📋 MIS SOLICITUDES     │  │
│  │  (2 pendientes)         │  │
│  │  Toca para ver          │  │
│  └─────────────────────────┘  │
│                               │
│  ┌─────────────────────────┐  │
│  │  🔄 CAMBIAR UBICACIÓN   │  │
│  │  Mover un vehículo      │  │
│  └─────────────────────────┘  │
│                               │
│  ┌─────────────────────────┐  │
│  │  📊 VER DASHBOARD       │  │
│  │  Ocupación general      │  │
│  └─────────────────────────┘  │
│                               │
│  ┌─────────────────────────┐  │
│  │  🔄 CAMBIAR EVENTO      │  │
│  │  Ir a Cena Ricardo      │  │
│  └─────────────────────────┘  │
└───────────────────────────────┘
```

### 5.4 Panel del Dueño

```
┌──────────────────────────────────┐
│  ⚙️ CONFIGURACIÓN                │
├──────────────────────────────────┤
│                                  │
│  🏪 NOMBRE: [Valet Parking    ] │
│  📸 LOGO: [Seleccionar       ]  │
│                                  │
│  ──── EVENTOS ────               │
│  📋 HISTÓRICO DE EVENTOS         │
│  ┌────────────────────────────┐  │
│  │ 💒 Boda Carlos (11/07)    │  │
│  │   32 autos · 09:30-14:15  │  │
│  ├────────────────────────────┤  │
│  │ 🍽️ Cena Ricardo (11/07)  │  │
│  │   18 autos · 10:00-23:30  │  │
│  ├────────────────────────────┤  │
│  │ 🎂 Cumpleaños (10/07)    │  │
│  │   45 autos · 20:00-03:00  │  │
│  └────────────────────────────┘  │
│                                  │
│  ──── SECTORES EDITABLES ────    │
│  🔵 Puerta Principal             │
│     Capacidad: [35  ]  Color:    │
│     [Seleccionar color 🎨]      │
│  ┌──────────────────────────┐    │
│  │  💾 GUARDAR CAMBIOS      │    │
│  └──────────────────────────┘    │
│                                  │
│  ──── USUARIOS ────              │
│  👤 #1 Admin (Dueño)             │
│  👤 #2 Carlos (Supervisor)       │
│  👤 #3 Luis (Valet)    PIN: ****│
│  👤 #4 María (Valet)   PIN: ****│
│  ➕ AGREGAR VALET                │
│                                  │
│  ──── RIESGOS ────               │
│  ┌──────────────────────────┐    │
│  │  🗑️ BORRAR HISTÓRICO     │    │
│  │  ⚠️ Esta acción borra    │    │
│  │  todo el histórico       │    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

---

## 6. 📁 Estructura de Carpetas

```
valet-parking/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Login
│   │   ├── dashboard/            # 🖥️ Dashboard general (todos)
│   │   │   └── page.tsx
│   │   ├── evento/               # 📊 Vista por evento
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── dueno/                # 👑 Panel dueño
│   │   │   ├── page.tsx
│   │   │   ├── configuracion/
│   │   │   ├── sectores/
│   │   │   ├── usuarios/
│   │   │   └── historico/
│   │   ├── supervisor/
│   │   │   └── page.tsx
│   │   └── valet/                # 🔑 App valet
│   │       ├── page.tsx
│   │       ├── entrada/
│   │       ├── solicitudes/
│   │       └── cambio/
│   ├── components/
│   │   ├── ui/                   # Botones grandes, inputs táctiles
│   │   │   ├── BotonSector.tsx   # Botón de sector con color
│   │   │   ├── BotonLlave.tsx    # Botón de estado de llave
│   │   │   └── ...
│   │   ├── dashboard/
│   │   ├── valet/
│   │   └── dueno/
│   ├── lib/
│   │   └── supabase/
│   ├── hooks/
│   └── styles/
├── supabase/
│   └── migrations/
└── ...
```

---

## 7. 📦 Plan de Implementación (8 Fases)

### Fase 1 — ⚙️ Proyecto Base (Día 1)
- [ ] Inicializar Next.js + TypeScript + Tailwind
- [ ] Configurar Supabase
- [ ] Estructura de carpetas
- [ ] Deploy inicial a Vercel

### Fase 2 — 🔐 Autenticación (Día 2-3)
- [ ] Login con PIN + número de valet
- [ ] Login con email (dueño/supervisor)
- [ ] Protección de rutas por rol

### Fase 3 — 🎯 Eventos + Sectores (Día 4-5)
- [ ] CRUD de eventos (crear, abrir, cerrar)
- [ ] Múltiples eventos simultáneos
- [ ] Sectores con colores
- [ ] Dashboard general con ocupación global

### Fase 4 — 🚗 Check-In (Día 6-9)
- [ ] Formulario ágil con botones grandes
- [ ] Selector de evento
- [ ] Botones de sector coloreados
- [ ] Botones de estado de llave
- [ ] Foto + daños opcional
- [ ] Ubicación exacta obligatoria
- [ ] Tickets dobles

### Fase 5 — 📋 Check-Out (Día 10-13)
- [ ] Búsqueda de ticket
- [ ] Historial del vehículo visible
- [ ] Botón "En camino" / "Recogí" / "Entregado"
- [ ] Asignación a valet
- [ ] Trazabilidad total

### Fase 6 — 🔄 Cambios + Trazabilidad (Día 14-15)
- [ ] Botón cambio de ubicación
- [ ] Registro completo en historial
- [ ] Dashboard de ocupación por sector en vivo

### Fase 7 — 👑 Dueño + Reportes (Día 16-19)
- [ ] Configuración de app
- [ ] Editar sectores (nombre, color, capacidad)
- [ ] CRUD usuarios
- [ ] Histórico de eventos
- [ ] Reportes

### Fase 8 — 🚀 PWA + Pulido (Día 20-23)
- [ ] PWA instalable
- [ ] Modo offline
- [ ] Pruebas Android/iPhone
- [ ] Documentación

---

## 8. 💰 Costos

| Servicio | Plan | Costo |
|----------|------|-------|
| Supabase | Free | $0 |
| Vercel | Free | $0 |
| **Total** | | **$0/mes** |

---

## 📝 ¿Qué opinas de las ideas para mejorar?

| # | Idea | ¿Te interesa? |
|---|------|:-------------:|
| 1️⃣ | **Nombre del cliente** asociado al auto | ❓ |
| 2️⃣ | **Modo offline** automático | ❓ |
| 3️⃣ | **Pantalla TV/Proyector** para sala principal | ❓ |
| 4️⃣ | **Asignación inteligente** de valets | ❓ |
| 5️⃣ | **Tiempo estimado** de espera | ❓ |
| 6️⃣ | **Búsqueda por nombre** de cliente | ❓ |
| 7️⃣ | **Resumen automático** al cerrar evento | ❓ |
| 8️⃣ | **Modo oscuro** | ❓ |

---

*Documento v2 — 11 de julio de 2026*
