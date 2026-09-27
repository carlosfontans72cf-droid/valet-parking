# Migración de Supabase a Firebase

Supabase pausó el proyecto (pasa por inactividad en el plan gratis). Se migró
toda la app para que use **Firebase (Firestore)** en vez de Supabase. La
interfaz y la lógica de cada pantalla no cambiaron — solo de dónde vienen
los datos.

## Qué se hizo

- Todas las pantallas ahora hablan con un solo endpoint: `/api/db`.
- Ese endpoint (`src/app/api/db/route.ts`) traduce las mismas consultas que
  ya usaba la app (`tabla?campo=eq.valor`, `order=`, `limit=`, etc.) a
  consultas de Firestore.
- Se armaron valores por defecto (fecha de creación, estado inicial, etc.)
  que antes ponía Postgres solo — Firestore no lo hace automático.

## Lo que falta para que funcione: tus datos de Firebase

1. Andá a [Firebase Console](https://console.firebase.google.com/) y abrí
   tu proyecto existente (el que no estás usando).
2. **Habilitá Firestore**: menú lateral → *Build → Firestore Database* →
   *Crear base de datos* → modo **de prueba** (test mode) para que arranque
   sin restricciones, igual que tenías Supabase con RLS desactivado.
3. **Registrá una app Web**: ⚙️ *Configuración del proyecto* → pestaña
   *Tus apps* → ícono `</>` (Web) → ponele un nombre → Registrar.
4. Copiá el objeto `firebaseConfig` que te muestra (apiKey, authDomain,
   projectId, etc.) y pegalo en `src/lib/firebaseConfig.ts`, reemplazando
   los valores de ejemplo.
5. Instalá la dependencia nueva y corré la app:
   ```bash
   npm install
   npm run dev
   ```
6. Desplegá de nuevo en Vercel (`npx vercel --prod`, o el flujo que ya usás)
   y actualizá las variables si tenías alguna configurada allá.

## Un aviso sobre los índices de Firestore

Firestore a veces necesita un "índice compuesto" para consultas que combinan
varios filtros (por ejemplo, vehículos activos de varios eventos + fecha).
La primera vez que eso pase vas a ver un error en la consola del navegador
(F12 → pestaña Network → `/api/db`) con un link que dice algo como
"crear índice" — hacé clic, esperá un minuto y volvé a probar. Es normal,
pasa una sola vez por cada tipo de consulta.

## Páginas que quedaron sin tocar (ya estaban rotas antes de esta migración)

- `/valet/solicitudes` y `/evento/[id]` usan un cliente de Supabase de
  mentira (`src/lib/supabase/client.ts`, `src/lib/db.ts`) que nunca llegó a
  conectarse a nada real — no es algo que rompió la pausa de Supabase, ya
  estaban así. Si las usás, avisame y las conecto también.
