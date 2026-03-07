# 🌿 Huerto Connect — API y Base de Datos (Actualizado)

> Documento maestro para alinear **frontend (login + dashboard)**, **API actual (`D:\huerto-connect-api`)** y el diseño de **base de datos PostgreSQL**.

---

## 📋 Índice

1. [API actual implementada](#1-api-actual-implementada)
2. [Flujos de trabajo reales](#2-flujos-de-trabajo-reales)
3. [Base de datos — 18 tablas](#3-base-de-datos--18-tablas)
4. [Diagrama ER (núcleo)](#4-diagrama-er-nucleo)
5. [Endpoints (implementados y por construir)](#5-endpoints-implementados-y-por-construir)
6. [Modelos y validaciones (login + dashboard)](#6-modelos-y-validaciones-login--dashboard)
7. [Stack, migración y checklist de implementación](#7-stack-migracion-y-checklist-de-implementacion)
8. [Mapeo Frontend → DB → API](#8-mapeo-frontend--db--api)

---

## 1. API actual implementada

La API de autenticación que ya corre en `D:\huerto-connect-api` usa:

- **Express.js 5 (CommonJS)**
- **Crypto nativo**:
  - `scrypt` para contraseñas
  - `HMAC-SHA256` para OTP
  - comparación segura (`timingSafeEqual`)
- **Nodemailer + plantilla HTML CID** para email OTP
- **Almacenamiento en memoria (`Map`)** para usuarios/sesiones/challenges/tokens (temporal)

### 1.1 Endpoints reales hoy

| Método | Ruta | Estado | Qué hace |
|---|---|---|---|
| `POST` | `/api/auth/send-otp` | ✅ | Login fase 1: valida email+password y envía OTP |
| `POST` | `/api/auth/register` | ✅ | Registro fase 1: valida datos y envía OTP |
| `POST` | `/api/auth/verify-otp` | ✅ | Verifica OTP para 3 tipos: `login`, `registro`, `reset-password` |
| `POST` | `/api/auth/resend-otp` | ✅ | Reenvía OTP del challenge activo (máx 3) |
| `POST` | `/api/auth/forgot-password` | ✅ | Inicia recuperación por correo y genera challenge OTP de reset |
| `POST` | `/api/auth/reset-password` | ✅ | Cambia contraseña con `resetToken` (o `token` por compatibilidad) |
| `GET` | `/api/auth/session` | ✅ | Valida token de sesión |
| `POST` | `/api/auth/logout` | ✅ | Revoca sesión |
| `GET` | `/api/health` | ✅ | Health check |

### 1.2 Contratos importantes (alineados al frontend)

#### `POST /api/auth/verify-otp`
Puede responder de 3 formas según tipo:

1. **Login OTP válido**
- `200` `{ message, session, user }`

2. **Registro OTP válido**
- `201` `{ message, session, user }` (crea usuario y sesión)

3. **Reset OTP válido**
- `200` `{ message, resetToken }`

#### `POST /api/auth/reset-password`
- Request: `{ resetToken, newPassword }`
- Compatibilidad: también acepta `{ token, newPassword }`
- Response: `200 { message }`

#### `POST /api/auth/forgot-password`
- Request: `{ email }`
- Response normal: `{ message, challengeId, expiresAt, maskedEmail, devOtpCode? }`
- Si email no existe: **no revela existencia**; responde `200` con mensaje genérico.

---

## 2. Flujos de trabajo reales

### 2.1 Login con OTP (actual)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (/login)
    participant A as API Auth
    participant M as Mailer

    U->>F: email + password
    F->>A: POST /auth/send-otp
    A->>A: valida credenciales
    A->>A: crea challenge tipo login
    A->>M: envía OTP
    A-->>F: challengeId + expiresAt + maskedEmail

    U->>F: captura OTP (6 dígitos)
    F->>A: POST /auth/verify-otp
    A->>A: valida hash OTP + intentos + expiración
    A->>A: crea sesión (8h)
    A-->>F: session + user
    F->>F: guarda sesión y navega a /admin
```

### 2.2 Registro con OTP (actual)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (/login registro)
    participant A as API Auth
    participant M as Mailer

    U->>F: nombre + apellidos + email + password
    F->>A: POST /auth/register
    A->>A: valida datos / email duplicado
    A->>A: crea challenge tipo registro (pendingUser)
    A->>M: envía OTP
    A-->>F: challengeId + expiresAt

    U->>F: OTP
    F->>A: POST /auth/verify-otp
    A->>A: crea usuario definitivo
    A->>A: crea sesión
    A-->>F: session + user
```

### 2.3 Recuperación de contraseña (actual, OTP + resetToken)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (/login forgot)
    participant A as API Auth
    participant M as Mailer

    U->>F: email recuperación
    F->>A: POST /auth/forgot-password
    A->>A: busca usuario (respuesta anti-enumeración)
    A->>A: crea challenge tipo reset-password
    A->>M: envía OTP de recuperación
    A-->>F: challengeId + maskedEmail

    U->>F: OTP de recuperación
    F->>A: POST /auth/verify-otp
    A->>A: valida OTP
    A->>A: genera resetToken de un uso
    A-->>F: { resetToken }

    U->>F: nueva contraseña
    F->>A: POST /auth/reset-password
    A->>A: consume token y actualiza password
    A-->>F: mensaje éxito
```

### 2.4 Reenvío de OTP (actual)

- Endpoint único: `POST /api/auth/resend-otp`
- Funciona para challenges de:
  - login
  - registro
  - recuperación de contraseña
- Límite: `MAX_RESENDS = 3`

### 2.5 Sesión y logout (actual)

- `GET /api/auth/session` valida token Bearer y TTL.
- `POST /api/auth/logout` revoca token actual.

### 2.6 Flujo frontend de login (estado real)

El componente `login` maneja estos pasos:

- `credentials` → login fase 1
- `otp` → login fase 2
- `forgot-email` → solicitar recuperación
- `forgot-otp` → validar OTP recuperación
- `forgot-reset` → definir nueva contraseña
- `register` con su propio OTP (`form` / `otp`)

Notas de UX ya integradas:

- En recuperación, al enviar correo pasa directo a pantalla de OTP (estado pendiente).
- Maneja countdown y reenvío para OTP de recuperación.
- Si `verify-otp` devuelve `resetToken`, habilita paso de nueva contraseña.

### 2.7 Necesidades de dashboard para DB

El dashboard admin calcula KPIs con datos de:

- `usuarios` (activos)
- `huertos`
- `plaga_detecciones`
- `alertas` (críticas)
- `chat_conversaciones`
- `regiones`

Por lo tanto, la base debe soportar consultas agregadas eficientes (`COUNT`, filtros, joins).

---

## 3. Base de datos — 18 tablas

### 3.1 Núcleo mínimo para salir a producción (Auth + Dashboard)

Estas tablas son obligatorias para cubrir lo ya implementado en login/API y KPIs:

1. `usuarios`
2. `otp_challenges`
3. `password_resets`
4. `sesiones`
5. `huertos`
6. `regiones`
7. `plaga_detecciones`
8. `alertas`
9. `chat_conversaciones`
10. `auditoria_logs`

### 3.2 Modelo completo objetivo (18 tablas)

#### 🔐 Auth y seguridad

| Tabla | Propósito |
|---|---|
| `usuarios` | Cuenta, rol, estado, hash/salt, metadata |
| `otp_challenges` | OTP activo por flujo (`login`, `registro`, `reset-password`) |
| `password_resets` | Token de un uso generado después de OTP de recuperación |
| `sesiones` | Sesiones activas/inactivas por dispositivo |

#### 🌱 Dominio agrícola

| Tabla | Propósito |
|---|---|
| `regiones` | Catálogo de regiones |
| `huertos` | Huertos por usuario/región |
| `cultivos` | Catálogo de cultivos |
| `huerto_cultivos` | Relación huerto-cultivo (siembra real) |
| `plantios` | Puntos geográficos para mapa |

#### 🐛 Sanidad y alertamiento

| Tabla | Propósito |
|---|---|
| `plaga_detecciones` | Detecciones IA con severidad/estado |
| `alertas` | Alertas de sistema/operación |

#### 🤖 Conversacional

| Tabla | Propósito |
|---|---|
| `chat_conversaciones` | Hilo conversacional |
| `chat_mensajes` | Mensajes por conversación |
| `chat_metricas` | Métricas agregadas por tema/categoría |

#### 📊 Reportes y sistema

| Tabla | Propósito |
|---|---|
| `reportes` | Reportes generados |
| `integraciones` | Estado de proveedores externos |
| `auditoria_logs` | Bitácora de acciones críticas |
| `contacto_mensajes` | Mensajes de formulario landing |

### 3.3 Reglas de diseño para Auth (clave)

#### `usuarios`

- `email` único (case-insensitive)
- `password_hash` + `password_salt`
- `email_verificado` boolean
- `estado` (`Activo`, `Inactivo`, `Suspendido`, `Pendiente`)

#### `otp_challenges`

- `tipo` enum: `login`, `registro`, `reset-password`
- `otp_hash`, `expires_at`, `verify_attempts`, `resend_count`
- Para `registro` se requiere guardar contexto temporal (`pending_user_json` o columnas dedicadas)

#### `password_resets`

- `token_hash` (nunca guardar token plano)
- `usuario_id`
- `expires_at`
- `used_at` / `usado` para un solo uso

#### `sesiones`

- `token_hash`
- `usuario_id`
- `activa`, `expires_at`, `ultima_actividad`
- opcional: `ip`, `user_agent`, `dispositivo`

### 3.4 Índices recomendados (obligatorios)

- `usuarios(email)` unique
- `otp_challenges(id)` PK
- `otp_challenges(usuario_id, tipo)`
- `otp_challenges(expires_at)`
- `password_resets(token_hash)` unique
- `password_resets(usuario_id, expires_at)`
- `sesiones(token_hash)` unique
- `sesiones(usuario_id, activa)`
- `alertas(severidad, estado, fecha)`
- `plaga_detecciones(fecha, severidad, estado)`
- `huertos(region_id)`
- `chat_conversaciones(created_at)`

### 3.5 Política de campos calculados

No almacenar en tabla:

- `usuarios_count`
- `huertos_count`
- `alertas_count`
- `cultivos_activos`

Se obtienen por `COUNT()` y joins en endpoint.

---

## 4. Diagrama ER (núcleo)

```mermaid
erDiagram
    USUARIOS ||--o{ HUERTOS : posee
    REGIONES ||--o{ HUERTOS : contiene
    HUERTOS ||--o{ ALERTAS : genera
    HUERTOS ||--o{ PLAGA_DETECCIONES : registra

    USUARIOS ||--o{ OTP_CHALLENGES : inicia
    USUARIOS ||--o{ SESIONES : tiene
    USUARIOS ||--o{ PASSWORD_RESETS : usa

    CHAT_CONVERSACIONES ||--o{ CHAT_MENSAJES : contiene
    USUARIOS ||--o{ CHAT_CONVERSACIONES : participa

    HUERTOS ||--o{ HUERTO_CULTIVOS : relacion
    CULTIVOS ||--o{ HUERTO_CULTIVOS : relacion
    HUERTO_CULTIVOS ||--o{ PLANTIOS : geolocaliza
```

> El ER extendido conserva las 18 tablas listadas en sección 3.2.

---

## 5. Endpoints (implementados y por construir)

### 5.1 Auth (`/api/auth`) — estado real

| Método | Ruta | Estado |
|---|---|---|
| `POST` | `/send-otp` | ✅ |
| `POST` | `/register` | ✅ |
| `POST` | `/verify-otp` | ✅ |
| `POST` | `/resend-otp` | ✅ |
| `POST` | `/forgot-password` | ✅ |
| `POST` | `/reset-password` | ✅ |
| `GET` | `/session` | ✅ |
| `POST` | `/logout` | ✅ |

### 5.2 Auth por agregar (cuando exista DB)

| Método | Ruta | Estado | Motivo |
|---|---|---|---|
| `GET` | `/sesiones` | 🆕 | Vista de sesiones activas en configuración |
| `DELETE` | `/sesiones/:id` | 🆕 | Cerrar sesión específica |
| `POST` | `/sesiones/revoke-all` | 🆕 | Cerrar todas excepto actual |

### 5.3 Dashboard y módulos admin (por construir)

| Módulo | Rutas mínimas |
|---|---|
| Dashboard | `GET /dashboard/kpis`, `GET /dashboard/tendencias` |
| Usuarios | `GET/PUT/PATCH/DELETE /usuarios` |
| Huertos | `GET/POST/PUT/PATCH/DELETE /huertos` |
| Cultivos | `GET/POST/PUT/PATCH/DELETE /cultivos` |
| Regiones | `GET/POST/PUT/PATCH/DELETE /regiones`, `GET /regiones/:id/plantios` |
| Plagas | `GET/POST/PUT/PATCH/DELETE /plagas` |
| Alertas | `GET/POST/PATCH/DELETE /alertas` |
| Chatbot | `GET /chatbot/metricas`, `GET /chatbot/conversaciones`, `POST /chatbot/...` |
| Reportes | `GET/POST/DELETE /reportes`, `GET /reportes/:id/download` |
| Integraciones | `GET /integraciones`, `POST /integraciones/:id/test` |
| Auditoría | `GET /auditoria` |
| Público | `POST /public/contacto`, `GET /public/testimonios`, `GET /public/faqs` |

---

## 6. Modelos y validaciones (login + dashboard)

### 6.1 Payloads Auth (frontend actual)

#### Login
- Request: `{ email, password }`
- Validación mínima:
  - email válido
  - password >= 6

#### Registro
- Request: `{ nombre, apellidos, email, password }`
- Validación mínima:
  - nombre requerido
  - email válido y único
  - password >= 6

#### Verificar OTP
- Request: `{ challengeId, otpCode }`
- `otpCode`: numérico de 6 dígitos

#### Recuperación
- Request inicial: `{ email }`
- Verify OTP recovery: `POST /verify-otp`
- Cambio final: `{ resetToken, newPassword }`

### 6.2 Modelos dashboard (frontend actual)

Campos principales (según interfaces actuales):

- `Usuario`: nombre, correo, región, rol, estado, huertos, ultimaActividad
- `Huerto`: nombre, usuario, municipio, región, cultivosActivos, estado, salud, alertas
- `Region`: nombre, usuarios, huertos, detecciones, actividad
- `PlagaDeteccion`: imagenUrl, plaga, confianza, cultivo, ubicacion, fecha, severidad, estado
- `Alerta`: titulo, tipo, severidad, estado, region, fecha, responsable

### 6.3 Validaciones de negocio sugeridas para API con DB

- No permitir `verify-otp` si challenge expirado o superó intentos.
- En `reset-password`, invalidar token después de uso.
- Registrar auditoría en eventos críticos:
  - login
  - logout
  - register
  - reset password
  - cambios de estado en usuarios/alertas/plagas

---

## 7. Stack, migración y checklist de implementación

### 7.1 Estado actual vs objetivo

| Componente | Estado actual | Objetivo |
|---|---|---|
| Auth OTP + recuperación | ✅ en memoria | ✅ persistido en PostgreSQL |
| Plantilla email (login/registro/reset) | ✅ | ✅ |
| Dashboard admin | ✅ frontend mock | ✅ backend con DB |
| CRUD módulos admin | 🆕 | ✅ |

### 7.2 Migración recomendada (fases)

1. **Fase Auth DB**
- Crear tablas `usuarios`, `otp_challenges`, `password_resets`, `sesiones`, `auditoria_logs`
- Migrar `Map()` a repositorios SQL
- Mantener contrato API sin romper frontend

2. **Fase Dashboard DB**
- Crear `regiones`, `huertos`, `plaga_detecciones`, `alertas`, `chat_conversaciones`
- Implementar `GET /dashboard/kpis`

3. **Fase CRUD completo**
- Habilitar endpoints admin por módulo
- Paginación, filtros, soft-delete, auditoría

### 7.3 Checklist técnico para BD

- [ ] Definir migraciones SQL iniciales
- [ ] Seeds para usuarios demo con hashes reales
- [ ] Índices de auth y dashboard (sección 3.4)
- [ ] Transacciones en flujos críticos (`verify-otp`, `reset-password`)
- [ ] `token_hash` y `otp_hash` con comparación segura
- [ ] Cleanup job para expirados (`otp_challenges`, `password_resets`, `sesiones`)
- [ ] Auditoría de eventos críticos

### 7.4 Variables de entorno necesarias

```env
API_PORT=3000
FRONTEND_URL=http://localhost:4200
FRONTEND_ORIGIN=http://localhost:4200

OTP_DELIVERY_MODE=smtp
OTP_EXPOSE_CODE_IN_RESPONSE=false

OTP_EMAIL_HOST=smtp.gmail.com
OTP_EMAIL_PORT=465
OTP_EMAIL_SECURE=true
OTP_EMAIL_USER=huertoconnect@gmail.com
OTP_EMAIL_APP_PASSWORD=***

OTP_HASH_SECRET=***
AUTH_PASSWORD_PEPPER=***

DATABASE_URL=postgresql://user:pass@localhost:5432/huerto_connect
```

---

## 8. Mapeo Frontend → DB → API

| Frontend | DB principal | Endpoint |
|---|---|---|
| Login (`credentials` → `otp`) | `usuarios`, `otp_challenges`, `sesiones` | `POST /auth/send-otp`, `POST /auth/verify-otp` |
| Registro (`form` → `otp`) | `otp_challenges`, `usuarios`, `sesiones` | `POST /auth/register`, `POST /auth/verify-otp` |
| Recuperación (`forgot-email` → `forgot-otp` → `forgot-reset`) | `otp_challenges`, `password_resets`, `usuarios` | `POST /auth/forgot-password`, `POST /auth/verify-otp`, `POST /auth/reset-password` |
| Reenvío OTP | `otp_challenges` | `POST /auth/resend-otp` |
| Sesión activa en admin | `sesiones`, `usuarios` | `GET /auth/session` |
| Logout | `sesiones` | `POST /auth/logout` |
| KPI dashboard | `usuarios`, `huertos`, `plaga_detecciones`, `alertas`, `chat_conversaciones`, `regiones` | `GET /dashboard/kpis` |
| Usuarios admin | `usuarios` | `GET/PUT/PATCH/DELETE /usuarios` |
| Huertos/Cultivos | `huertos`, `cultivos`, `huerto_cultivos` | `GET/POST/PUT/...` |
| Regiones/Mapa | `regiones`, `plantios` | `GET /regiones`, `GET /regiones/:id/plantios` |
| Plagas/Alertas | `plaga_detecciones`, `alertas` | `GET/POST/PATCH/...` |
| Chatbot | `chat_conversaciones`, `chat_mensajes`, `chat_metricas` | `GET/POST /chatbot/...` |
| Reportes/Integraciones | `reportes`, `integraciones` | `GET/POST /reportes`, `GET/POST /integraciones` |
| Auditoría | `auditoria_logs` | `GET /auditoria` |
| Contacto landing | `contacto_mensajes` | `POST /public/contacto` |

---

> Actualizado al estado real de código (frontend + API) al **2026-03-07**.
> Este archivo ya refleja el flujo nuevo de login/recuperación y la base de datos necesaria para soportar dashboard y módulos admin.
