# 🌿 Huerto Connect — API y Base de Datos (Corregido)

> Diseño del backend basado en el frontend Angular existente + la API OTP de `huerto-connect-api`. Corregido con buenas prácticas de diseño relacional: sin campos calculados redundantes, integridad referencial correcta, y normalización adecuada.

---

## 📋 Índice

1. [API OTP Existente](#1-api-otp-existente)
2. [Flujos de Trabajo](#2-flujos-de-trabajo)
3. [Base de Datos — 18 Tablas](#3-base-de-datos)
4. [Diagrama ER](#4-diagrama-er)
5. [Endpoints de la API](#5-endpoints-de-la-api)
6. [Modelos y Validaciones](#6-modelos-y-validaciones)
7. [Stack Técnico](#7-stack-técnico)

---

## 1. API OTP Existente (`huerto-connect-api`)

La API actual en `D:\huerto-connect-api` ya implementa autenticación con OTP:

### Stack actual
- **Express.js 5** con CommonJS
- **Nodemailer** para envío de correo (Gmail SMTP / modo consola)
- **Sharp** para procesamiento de imágenes
- **Crypto** nativo (scrypt para passwords, HMAC-SHA256 para OTP)

### Endpoints implementados

| Método | Ruta | Qué hace |
|--------|------|----------|
| `POST` | `/api/auth/send-otp` | Recibe email + password → valida credenciales → genera OTP 6 dígitos → envía email |
| `POST` | `/api/auth/verify-otp` | Recibe challengeId + otpCode → valida → crea sesión (token 8h) |
| `POST` | `/api/auth/resend-otp` | Recibe challengeId → regenera nuevo OTP (max 3 reenvíos) |
| `GET` | `/api/auth/session` | Header `Bearer token` → valida sesión activa |
| `POST` | `/api/auth/logout` | Recibe token → revoca sesión |
| `GET` | `/api/health` | Health check del servicio |

### Flujo OTP actual

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant A as API (Express)
    participant M as Mailer

    U->>F: Ingresa email + password
    F->>A: POST /api/auth/send-otp { email, password }
    A->>A: findUserByEmail() → verifyPassword() (scrypt + pepper)
    A->>A: createOtpChallenge() → genera código 6 dígitos
    A->>A: hashOtpCode() → HMAC-SHA256(challengeId:otpCode)
    A->>M: sendOtpEmail() → Nodemailer (SMTP / consola)
    A-->>F: 200 { challengeId, expiresAt, maskedEmail }

    U->>F: Ingresa código OTP
    F->>A: POST /api/auth/verify-otp { challengeId, otpCode }
    A->>A: Comparar HMAC con timingSafeEqual
    alt Código válido
        A->>A: createSession() → token aleatorio (8h TTL)
        A-->>F: 200 { session: { token, expiresAt }, user }
        F->>F: Guardar token → navegar a /admin
    else Código inválido
        A-->>F: 400 { remainingAttempts } (max 5 intentos)
    end
```

### Seguridad implementada
- **Password**: `scrypt` con pepper (`AUTH_PASSWORD_PEPPER`) + salt derivado del email
- **OTP hash**: `HMAC-SHA256` con secret (`OTP_HASH_SECRET`), bindeado al challengeId
- **Comparación**: `timingSafeEqual` (previene timing attacks)
- **Límites**: 5 intentos de verificación, 3 reenvíos máximo
- **Sesiones**: Token aleatorio de 32 bytes hex, TTL 8 horas
- **Cleanup**: Worker cada 60s borra challenges expirados (30min retención)

### Almacenamiento actual: In-Memory
Actualmente usa `Map()` en memoria para challenges y sesiones. **Para producción, se deben migrar a tablas en PostgreSQL** (ver sección 3).

### Usuarios demo actuales (`config/users.js`)

| ID | Nombre | Email | Password |
|----|--------|-------|----------|
| `usr-admin-01` | Administrador Huerto | admin@huertoconnect.com | Admin12345! |
| `usr-abiel-01` | Abiel | abielon25@gmail.com | Abiel12345! |
| `usr-productor-01` | Productor Demo | productor@huertoconnect.com | Productor123! |

---

## 2. Flujos de Trabajo

### 2.1 Registro completo con confirmación de email

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (/login toggle registro)
    participant A as API
    participant DB as PostgreSQL
    participant M as Mailer (Nodemailer)

    U->>F: Llena nombre + email + password
    F->>A: POST /api/auth/register { nombre, email, password }
    A->>DB: SELECT usuario WHERE email (verificar que no existe)
    alt Email ya registrado y verificado
        A-->>F: 409 { message: "Email ya registrado" }
    else Email no registrado
        A->>A: scrypt hash password con pepper + salt
        A->>DB: INSERT usuario (estado: Pendiente, email_verificado: false)
        A->>A: generateOtpCode() → 6 dígitos
        A->>A: hashOtpCode() → HMAC-SHA256(challengeId:otpCode)
        A->>DB: INSERT otp_challenges (tipo: registro, usuario_id)
        A->>M: sendOtpEmail({ to, recipientName, otpCode, expiresInMinutes: 5 })
        A-->>F: 201 { challengeId, expiresAt, maskedEmail }
    end

    U->>F: Ingresa código OTP de 6 dígitos
    F->>A: POST /api/auth/verify-otp { challengeId, otpCode }
    A->>DB: SELECT challenge WHERE id AND tipo = registro
    A->>A: Validar HMAC con timingSafeEqual
    alt Código válido
        A->>DB: UPDATE usuario SET estado = Activo, email_verificado = true
        A->>A: generateRandomId(32) → session token
        A->>DB: INSERT sesiones (token_hash, usuario_id, ip, user_agent, TTL 8h)
        A->>DB: DELETE otp_challenges WHERE id
        A->>DB: INSERT auditoria_logs (accion: REGISTRO, modulo: Auth)
        A-->>F: 200 { session: { token, expiresAt }, user: { id, name, email } }
        F->>F: Guardar token en localStorage
        F->>F: router.navigate(['/admin/dashboard'])
    else Código inválido
        A->>DB: UPDATE otp_challenges SET verify_attempts += 1
        A-->>F: 400 { remainingAttempts, allowResend }
    end
```

### 2.2 Login completo con OTP (como funciona hoy)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (/login)
    participant A as API
    participant DB as PostgreSQL
    participant M as Mailer

    U->>F: Escribe email + password
    F->>A: POST /api/auth/send-otp { email, password }
    A->>DB: SELECT usuario WHERE email AND deleted_at IS NULL
    alt Usuario no encontrado o password incorrecto
        A-->>F: 401 { message: "Credenciales invalidas" }
    else Usuario con estado Pendiente (no verificado)
        A-->>F: 403 { message: "Cuenta no verificada", needsVerification: true }
    else Credenciales válidas
        A->>A: scrypt verify password (timingSafeEqual)
        A->>A: generateOtpCode() → 6 dígitos
        A->>DB: INSERT otp_challenges (tipo: login, usuario_id)
        A->>M: sendOtpEmail()
        A-->>F: 200 { challengeId, expiresAt, maskedEmail }
    end

    U->>F: Ingresa código OTP
    F->>A: POST /api/auth/verify-otp { challengeId, otpCode }
    A->>DB: SELECT challenge WHERE id AND tipo = login
    A->>A: Validar HMAC con timingSafeEqual
    alt Código válido
        A->>DB: INSERT sesiones (token_hash, usuario_id, ip, user_agent)
        A->>DB: UPDATE usuario.ultima_actividad = NOW()
        A->>DB: DELETE otp_challenges WHERE id
        A->>DB: INSERT auditoria_logs (accion: LOGIN, modulo: Auth)
        A-->>F: 200 { session: { token, expiresAt }, user: { id, name, email, rol } }
        F->>F: Guardar token → router.navigate(['/admin'])
    else Código inválido
        A->>DB: UPDATE otp_challenges SET verify_attempts += 1
        A-->>F: 400 { remainingAttempts, allowResend }
    else Expirado o max intentos
        A-->>F: 429 { message, allowResend: true }
    end
```

### 2.3 Gestión de Sesiones

```mermaid
sequenceDiagram
    participant F as Frontend
    participant A as API
    participant DB as PostgreSQL

    Note over F: Validar sesión activa (cada request protegido)
    F->>A: GET /api/auth/session (Header: Bearer token)
    A->>DB: SELECT sesion WHERE token_hash AND expires_at > NOW() AND activa = true
    alt Sesión válida
        A->>DB: UPDATE sesion.ultima_actividad = NOW()
        A-->>F: 200 { session: { token, expiresAt }, user: { id, name, email, rol } }
    else Sesión expirada o inválida
        A-->>F: 401 { message: "Sesion invalida o expirada" }
        F->>F: Limpiar token → router.navigate(['/login'])
    end

    Note over F: Cerrar sesión actual (botón sidebar)
    F->>A: POST /api/auth/logout { token }
    A->>DB: UPDATE sesion SET activa = false WHERE token_hash
    A->>DB: INSERT auditoria_logs (accion: LOGOUT)
    A-->>F: 200 { message: "Sesion cerrada" }
    F->>F: Limpiar token → router.navigate(['/login'])

    Note over F: Ver sesiones activas (admin/configuracion)
    F->>A: GET /api/auth/sesiones
    A->>DB: SELECT sesiones WHERE usuario_id AND activa = true
    A-->>F: 200 [{ id, ip, user_agent, dispositivo, ultima_actividad }]

    Note over F: Cerrar otra sesión
    F->>A: DELETE /api/auth/sesiones/:id
    A->>DB: UPDATE sesion SET activa = false WHERE id
    A-->>F: 200

    Note over F: Cerrar todas las sesiones menos la actual
    F->>A: POST /api/auth/sesiones/revoke-all { currentToken }
    A->>DB: UPDATE sesiones SET activa = false WHERE usuario_id AND token_hash != current
    A-->>F: 200 { revocadas: N }
```

### 2.4 Reenvío de OTP

```mermaid
sequenceDiagram
    participant F as Frontend
    participant A as API
    participant DB as PostgreSQL
    participant M as Mailer

    F->>A: POST /api/auth/resend-otp { challengeId }
    A->>DB: SELECT challenge WHERE id
    alt No existe
        A-->>F: 404 { message: "Proceso OTP no encontrado" }
    else Límite de reenvíos alcanzado (max 3)
        A-->>F: 429 { message: "Limite de reenvios alcanzado" }
    else OK
        A->>A: generateOtpCode() nuevo
        A->>DB: UPDATE challenge SET otp_hash, expires_at, verify_attempts=0, resend_count+=1
        A->>M: sendOtpEmail() con nuevo código
        A-->>F: 200 { challengeId, expiresAt, maskedEmail }
    end
```

### 2.5 Recuperación de contraseña

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (/login)
    participant A as API
    participant DB as PostgreSQL
    participant M as Mailer

    U->>F: Click "¿Olvidaste tu contraseña?"
    F->>A: POST /api/auth/forgot-password { email }
    A->>DB: SELECT usuario WHERE email AND estado = Activo
    A->>A: generateRandomId(32) → reset token
    A->>DB: INSERT password_resets (token_hash, usuario_id, expires_at: 1h)
    A->>M: Enviar email con link de reset (FRONTEND_URL/reset?token=xxx)
    A-->>F: 200 { message: "Si el email existe, recibirás instrucciones" }

    U->>F: Abre link del email → ingresa nueva contraseña
    F->>A: POST /api/auth/reset-password { token, newPassword }
    A->>DB: SELECT password_reset WHERE token_hash AND usado = false AND expires_at > NOW()
    alt Token válido
        A->>A: scrypt hash nueva password
        A->>DB: UPDATE usuario SET password_hash, password_salt
        A->>DB: UPDATE password_reset SET usado = true
        A->>DB: UPDATE sesiones SET activa = false WHERE usuario_id (cierra todas)
        A->>DB: INSERT auditoria_logs (accion: PASSWORD_RESET)
        A-->>F: 200 { message: "Contraseña actualizada" }
    else Token inválido o expirado
        A-->>F: 400 { message: "Token inválido o expirado" }
    end
```

### 2.6 CRUD con filtros (Usuarios, Huertos, Regiones, Plagas)

```mermaid
sequenceDiagram
    participant F as Frontend
    participant A as API
    participant DB as PostgreSQL

    F->>A: GET /api/usuarios?busqueda=sofia&region=Veracruz&estado=Activo
    A->>DB: SELECT con WHERE dinámico + paginación
    A-->>F: { data: [...], meta: { total, page, totalPages } }

    F->>A: PUT /api/usuarios/:id { nombre, correo, region, rol, estado }
    A->>DB: UPDATE + INSERT auditoria
    A-->>F: 200 { usuario }

    F->>A: DELETE /api/usuarios/:id
    A->>DB: UPDATE deleted_at (soft delete) + INSERT auditoria
    A-->>F: 204
```

### 2.7 Dashboard KPIs (consultas agregadas, NO campos calculados)

```mermaid
flowchart LR
    A["COUNT usuarios<br/>WHERE estado = Activo"] --> K["GET /api/dashboard/kpis"]
    B["COUNT huertos"] --> K
    C["COUNT plaga_detecciones<br/>WHERE fecha = TODAY"] --> K
    D["COUNT alertas<br/>WHERE severidad = Critico"] --> K
    E["COUNT chat_conversaciones<br/>WHERE fecha = TODAY"] --> K
    F["COUNT regiones"] --> K
```

---

## 3. Base de Datos

### Correcciones aplicadas (sugerencias de Gemini)

| Problema | Corrección |
|----------|-----------|
| Campos calculados guardados (`usuarios_count`, `alertas_count`, `cultivos_activos`) | **Eliminados** → se obtienen con `COUNT()` en consultas o vistas |
| `PLANTIOS` desconectada | **Integrada** con FK a `huerto_cultivos` (donde realmente ocurre la siembra) |
| Strings repetidos en alertas/plagas (región, cultivo, ubicación) | **Normalizados** → FK a la tabla correspondiente |
| OTP y sesiones en memoria (`Map()`) | **Tablas DB** → `otp_challenges` y `sesiones` |

### 18 Tablas

#### 🔐 Auth y Sesiones (4 tablas)

| Tabla | Descripción | Viene de |
|-------|-------------|----------|
| `usuarios` | Usuarios con auth + `email_verificado` | Modelo `Usuario` + `config/users.js` |
| `otp_challenges` | Challenges OTP (login y registro) con campo `tipo` | `otp-auth.service.js` → `otpChallenges Map()` |
| `sesiones` | Sesiones activas con token, ip, user_agent, `activa`, `ultima_actividad` | `otp-auth.service.js` → `sessions Map()` |
| `password_resets` | Tokens de recuperación de contraseña | Link "¿Olvidaste tu contraseña?" en login.html |

#### 🌱 Agrícola (5 tablas)

| Tabla | Descripción | Viene de |
|-------|-------------|----------|
| `regiones` | Regiones geográficas | Modelo `Region` |
| `huertos` | Huertos de productores | Modelo `Huerto` |
| `cultivos` | Catálogo de cultivos | Modelo `Cultivo` |
| `huerto_cultivos` | Relación N:M huerto ↔ cultivo | Campo `cultivosActivos` en Huerto |
| `plantios` | Puntos geolocalizados en mapa | Modelo `Plantio` → ahora con FK a `huerto_cultivos` |

#### 🐛 Plagas y Alertas (2 tablas)

| Tabla | Descripción | Viene de |
|-------|-------------|----------|
| `plaga_detecciones` | Detecciones IA con imagen | Modelo `PlagaDeteccion` |
| `alertas` | Alertas del sistema | Modelo `Alerta` |

#### 🤖 Chatbot (3 tablas)

| Tabla | Descripción | Viene de |
|-------|-------------|----------|
| `chat_conversaciones` | Conversaciones | Mock `ChatConversation` |
| `chat_mensajes` | Mensajes individuales | Para historial del chatbot |
| `chat_metricas` | Métricas por tema | Mock `ChatMetric` |

#### 📊 Reportes y Sistema (4 tablas)

| Tabla | Descripción | Viene de |
|-------|-------------|----------|
| `reportes` | Reportes generados | Mock `ReporteItem` |
| `integraciones` | Servicios externos | Mock `IntegracionItem` |
| `auditoria_logs` | Logs de acciones | Modelo `AuditoriaLog` |
| `contacto_mensajes` | Formularios del landing | `DataService.sendContactForm()` |

---

## 4. Diagrama ER

```mermaid
erDiagram
    USUARIOS {
        uuid id PK
        varchar nombre "NOT NULL"
        varchar email UK "NOT NULL"
        varchar password_hash "scrypt + pepper"
        varchar password_salt "derivado del email"
        uuid region_id FK "nullable"
        enum rol "Admin - Productor - Tecnico"
        enum estado "Activo - Inactivo - Suspendido - Pendiente"
        boolean email_verificado "default false"
        timestamp ultima_actividad
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "soft delete"
    }

    OTP_CHALLENGES {
        uuid id PK "challengeId"
        uuid usuario_id FK
        varchar otp_hash "HMAC-SHA256"
        enum tipo "login - registro"
        varchar email "para registro antes de crear usuario"
        varchar nombre "para registro"
        int verify_attempts "max 5"
        int resend_count "max 3"
        timestamp expires_at "5 min TTL"
        timestamp created_at
        timestamp updated_at
    }

    SESIONES {
        uuid id PK
        uuid usuario_id FK
        varchar token_hash UK "32 bytes hex"
        varchar ip
        varchar user_agent
        varchar dispositivo "Chrome en Windows - Safari en iPhone"
        boolean activa "default true"
        timestamp ultima_actividad
        timestamp expires_at "8h TTL"
        timestamp created_at
    }

    PASSWORD_RESETS {
        uuid id PK
        uuid usuario_id FK
        varchar token_hash UK
        timestamp expires_at
        boolean usado "default false"
        timestamp created_at
    }

    REGIONES {
        uuid id PK
        varchar nombre UK
        enum actividad "Alta - Media - Baja"
        boolean priorizada "default false"
        timestamp created_at
        timestamp updated_at
    }

    HUERTOS {
        uuid id PK
        varchar nombre "NOT NULL"
        uuid usuario_id FK
        varchar municipio
        uuid region_id FK
        enum estado "Optimo - Atencion - Critico"
        int salud "0 a 100"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    CULTIVOS {
        uuid id PK
        varchar nombre "NOT NULL"
        varchar temporada
        enum dificultad "Baja - Media - Alta"
        varchar riego
        varchar fertilizacion
        boolean activo "default true"
        timestamp created_at
    }

    HUERTO_CULTIVOS {
        uuid id PK
        uuid huerto_id FK
        uuid cultivo_id FK
        date fecha_siembra
        enum estado "Activo - Cosechado - Perdido"
        timestamp created_at
    }

    PLANTIOS {
        uuid id PK
        varchar nombre
        uuid huerto_cultivo_id FK "vincula al huerto y cultivo"
        varchar municipio
        decimal lat
        decimal lng
        int salud "0 a 100"
        enum severidad "Baja - Media - Alta"
        timestamp created_at
    }

    PLAGA_DETECCIONES {
        uuid id PK
        varchar imagen_url
        varchar plaga "nombre identificado"
        decimal confianza "0 a 100"
        uuid huerto_id FK "la region se obtiene via huerto"
        uuid cultivo_id FK
        enum severidad "Baja - Media - Alta"
        enum estado "Pendiente - Confirmada - Descartada"
        timestamp fecha
        timestamp updated_at
    }

    ALERTAS {
        uuid id PK
        varchar titulo
        enum tipo "Plaga - Riego - Sensor - Sistema"
        enum severidad "Seguro - Advertencia - Critico"
        enum estado "Abierta - En_progreso - Resuelta"
        uuid huerto_id FK "la region se obtiene via huerto"
        uuid responsable_id FK "usuario asignado"
        timestamp fecha
        timestamp resuelta_en
    }

    CHAT_CONVERSACIONES {
        uuid id PK
        uuid usuario_id FK
        varchar tema "Riego - Plagas - Fertilizacion - Calendario"
        text ultimo_mensaje
        enum estado "Activa - Cerrada"
        timestamp fecha
        timestamp updated_at
    }

    CHAT_MENSAJES {
        uuid id PK
        uuid conversacion_id FK
        enum rol "user - assistant"
        text contenido
        timestamp fecha
    }

    CHAT_METRICAS {
        uuid id PK
        varchar tema UK
        int total
        decimal porcentaje
        timestamp updated_at
    }

    REPORTES {
        uuid id PK
        varchar nombre
        varchar tipo "Analitica - Sanidad - Conversacional"
        enum estado "Generado - En_proceso"
        varchar archivo_url
        uuid generado_por FK
        timestamp fecha
    }

    INTEGRACIONES {
        uuid id PK
        varchar nombre UK
        enum estado "Conectado - Degradado - Desconectado"
        timestamp ultima_revision
    }

    AUDITORIA_LOGS {
        uuid id PK
        uuid actor_id FK
        varchar accion
        varchar modulo
        varchar ip
        timestamp fecha
    }

    CONTACTO_MENSAJES {
        uuid id PK
        varchar nombre
        varchar email
        varchar telefono
        text mensaje
        boolean leido "default false"
        timestamp fecha
    }

    USUARIOS ||--o{ OTP_CHALLENGES : "tiene"
    USUARIOS ||--o{ SESIONES : "tiene"
    USUARIOS ||--o{ PASSWORD_RESETS : "tiene"
    USUARIOS ||--o{ HUERTOS : "posee"
    USUARIOS ||--o{ ALERTAS : "responsable"
    USUARIOS ||--o{ CHAT_CONVERSACIONES : "inicia"
    USUARIOS ||--o{ AUDITORIA_LOGS : "genera"
    USUARIOS ||--o{ REPORTES : "genera"
    REGIONES ||--o{ USUARIOS : "pertenece"
    REGIONES ||--o{ HUERTOS : "contiene"
    HUERTOS ||--o{ HUERTO_CULTIVOS : "siembra"
    HUERTOS ||--o{ PLAGA_DETECCIONES : "detectada_en"
    HUERTOS ||--o{ ALERTAS : "tiene"
    CULTIVOS ||--o{ HUERTO_CULTIVOS : "plantado_en"
    CULTIVOS ||--o{ PLAGA_DETECCIONES : "afectado"
    HUERTO_CULTIVOS ||--o{ PLANTIOS : "geolocaliza"
    CHAT_CONVERSACIONES ||--o{ CHAT_MENSAJES : "contiene"
```

### Campos calculados (obtenidos con COUNT, NO almacenados)

| Lo que muestra el frontend | Cómo se calcula en la API |
|---------------------------|---------------------------|
| `usuario.huertos` | `SELECT COUNT(*) FROM huertos WHERE usuario_id = ?` |
| `huerto.cultivosActivos` | `SELECT COUNT(*) FROM huerto_cultivos WHERE huerto_id = ? AND estado = 'Activo'` |
| `huerto.alertas` | `SELECT COUNT(*) FROM alertas WHERE huerto_id = ? AND estado != 'Resuelta'` |
| `region.usuarios` | `SELECT COUNT(*) FROM usuarios WHERE region_id = ?` |
| `region.huertos` | `SELECT COUNT(*) FROM huertos WHERE region_id = ?` |
| `region.detecciones` | `SELECT COUNT(*) FROM plaga_detecciones pd JOIN huertos h ON pd.huerto_id = h.id WHERE h.region_id = ?` |
| `plantio.alertas` | `SELECT COUNT(*) FROM alertas WHERE huerto_id = (SELECT huerto_id FROM huerto_cultivos WHERE id = plantio.huerto_cultivo_id)` |

### Ubicación normalizada (obtenida via JOINs)

| Lo que muestra el frontend | Cómo se obtiene |
|---------------------------|-----------------|
| `alerta.region` | `JOIN huertos h ON a.huerto_id = h.id JOIN regiones r ON h.region_id = r.id → r.nombre` |
| `plaga.ubicacion` | `JOIN huertos h ON pd.huerto_id = h.id → h.municipio` |
| `plaga.cultivo` | `JOIN cultivos c ON pd.cultivo_id = c.id → c.nombre` |
| `chatConversation.region` | `JOIN usuarios u ON cc.usuario_id = u.id JOIN regiones r ON u.region_id = r.id → r.nombre` |

---

## 5. Endpoints de la API

### 🔐 Auth (`/api/auth`) — Autenticación Completa

#### Login con OTP (ya implementados)

| Método | Ruta | Estado | Descripción |
|--------|------|--------|-------------|
| `POST` | `/send-otp` | ✅ Existe | Recibe email + password → valida credenciales → genera OTP → envía email |
| `POST` | `/verify-otp` | ✅ Existe | Recibe challengeId + otpCode → valida HMAC → crea sesión (8h) |
| `POST` | `/resend-otp` | ✅ Existe | Recibe challengeId → regenera OTP (max 3 reenvíos) |

#### Registro con confirmación de email (nuevos)

| Método | Ruta | Estado | Descripción |
|--------|------|--------|-------------|
| `POST` | `/register` | 🆕 Nuevo | nombre + email + password → hash password → INSERT usuario(Pendiente) → OTP por email |
| `POST` | `/verify-otp` | ✅ Existe | Mismo endpoint, pero con `tipo: registro` → activa cuenta + email_verificado=true |

#### Sesiones (existentes + nuevos)

| Método | Ruta | Estado | Descripción |
|--------|------|--------|-------------|
| `GET` | `/session` | ✅ Existe | Header Bearer token → valida sesión activa → devuelve user |
| `POST` | `/logout` | ✅ Existe | Recibe token → marca sesión como inactiva |
| `GET` | `/sesiones` | 🆕 Nuevo | Lista sesiones activas del usuario (para /admin/configuracion) |
| `DELETE` | `/sesiones/:id` | 🆕 Nuevo | Cerrar una sesión específica de otro dispositivo |
| `POST` | `/sesiones/revoke-all` | 🆕 Nuevo | Cerrar todas las sesiones menos la actual |

#### Recuperación de contraseña (nuevos)

| Método | Ruta | Estado | Descripción |
|--------|------|--------|-------------|
| `POST` | `/forgot-password` | 🆕 Nuevo | Recibe email → genera token → envía email con link de reset |
| `POST` | `/reset-password` | 🆕 Nuevo | Recibe token + newPassword → actualiza password → cierra todas las sesiones |

### 👥 Usuarios (`/api/usuarios`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Listado con filtros: `?busqueda=&region=&estado=&page=&limit=` |
| `GET` | `/:id` | Detalle (incluye COUNT de huertos) |
| `PUT` | `/:id` | Editar: nombre, correo, región, rol, estado |
| `PATCH` | `/:id/estado` | Cambiar estado |
| `DELETE` | `/:id` | Soft delete |

### 🌱 Huertos (`/api/huertos`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Listado (incluye COUNTs de cultivos y alertas) |
| `GET` | `/:id` | Detalle |
| `POST` | `/` | Crear |
| `PUT` | `/:id` | Editar: nombre, municipio, región, estado, salud |
| `PATCH` | `/:id/revision` | Marcar revisión → estado: Atencion |
| `DELETE` | `/:id` | Soft delete |

### 🌾 Cultivos (`/api/cultivos`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Catálogo |
| `POST` | `/` | Crear |
| `PUT` | `/:id` | Editar |
| `PATCH` | `/:id/toggle` | Activar/desactivar |
| `DELETE` | `/:id` | Eliminar |

### 🚨 Alertas (`/api/alertas`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Listado (JOIN para obtener región y responsable) |
| `POST` | `/` | Crear |
| `PATCH` | `/:id/estado` | Cambiar estado |
| `DELETE` | `/:id` | Eliminar |

### 🐛 Plagas (`/api/plagas`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Listado (JOIN para obtener cultivo y ubicación) |
| `GET` | `/:id` | Detalle para drawer con imagen |
| `POST` | `/` | Crear (multipart con imagen) |
| `PUT` | `/:id` | Editar |
| `PATCH` | `/:id/estado` | Confirmar/Descartar |
| `DELETE` | `/:id` | Eliminar |

### 🗺️ Regiones (`/api/regiones`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Listado (COUNTs de usuarios, huertos, detecciones) |
| `POST` | `/` | Crear |
| `PUT` | `/:id` | Editar |
| `PATCH` | `/:id/priorizar` | Priorizar → actividad: Alta |
| `DELETE` | `/:id` | Eliminar |
| `GET` | `/:id/plantios` | Plantíos para el mapa |

### 📍 Plantíos (`/api/plantios`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Todos los puntos para mapa |
| `POST` | `/` | Crear |
| `PUT` | `/:id` | Editar |
| `DELETE` | `/:id` | Eliminar |

### 🤖 Chatbot (`/api/chatbot`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/metricas` | Métricas por tema |
| `GET` | `/conversaciones` | Lista reciente |
| `GET` | `/conversaciones/:id` | Historial de mensajes |
| `POST` | `/conversaciones` | Iniciar conversación |
| `POST` | `/conversaciones/:id/mensaje` | Enviar mensaje → respuesta IA |

### 📊 Reportes e Integraciones (`/api/reportes`, `/api/integraciones`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/reportes` | Lista de reportes |
| `POST` | `/reportes` | Generar reporte |
| `GET` | `/reportes/:id/download` | Descargar |
| `DELETE` | `/reportes/:id` | Eliminar |
| `GET` | `/integraciones` | Estado de servicios externos |
| `POST` | `/integraciones/:id/test` | Probar conexión |

### 📝 Auditoría y Público

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/auditoria` | Logs con filtros |
| `GET` | `/dashboard/kpis` | KPIs agregados (6 COUNTs) |
| `GET` | `/dashboard/tendencias` | Series temporales 12 meses |
| `GET` | `/public/testimonios` | Landing |
| `GET` | `/public/faqs` | Landing |
| `POST` | `/public/contacto` | Formulario de contacto |

---

## 6. Modelos y Validaciones

### Campos de cada Edit Modal (exactos del frontend)

**Usuarios**: nombre (text, required), correo (email, required), región (text), rol (select: Admin/Productor/Tecnico), estado (select: Activo/Inactivo/Suspendido), huertos (number)

**Huertos**: nombre (text, required), usuario (text), municipio (text), región (text), cultivosActivos (number), estado (select: Optimo/Atencion/Critico), salud (number 0-100), alertas (number)

**Regiones**: nombre (text, required), usuarios (number), huertos (number), detecciones (number), actividad (select: Alta/Media/Baja)

**Plagas**: plaga (text, required), confianza (number), cultivo (text), ubicación (text), severidad (select: Baja/Media/Alta), estado (select: Pendiente/Confirmada/Descartada)

> **Nota**: Los campos `huertos` en Usuarios, `cultivosActivos`/`alertas` en Huertos, y `usuarios`/`huertos`/`detecciones` en Regiones son **calculados por la API con COUNT()** y se devuelven como campos de solo lectura. En el frontend el EditModal los muestra pero en la API real no se guardan directamente.

### Filtros implementados

| Módulo | Filtros | Servicio que los usa |
|--------|---------|---------------------|
| Usuarios | `busqueda` (ILIKE nombre/correo), `region` (exact), `estado` (exact) | `UsuariosService.getUsuarios()` |

---

## 7. Stack Técnico

### API actual vs lo que falta

| Componente | Estado | Tecnología |
|-----------|--------|-----------|
| Auth + OTP + Sesiones | ✅ Implementado | Express.js, scrypt, HMAC-SHA256 |
| Email OTP | ✅ Implementado | Nodemailer, Gmail SMTP |
| Template email | ✅ Implementado | HTML con SVGs embebidos (CID) |
| CRUD Usuarios | 🆕 Por hacer | Express.js / NestJS |
| CRUD Huertos/Cultivos | 🆕 Por hacer | Express.js / NestJS |
| CRUD Plagas/Alertas | 🆕 Por hacer | Express.js / NestJS |
| CRUD Regiones/Plantíos | 🆕 Por hacer | Express.js / NestJS |
| Chatbot IA | 🆕 Por hacer | OpenAI/Gemini API |
| Base de datos | 🆕 Por hacer | PostgreSQL + ORM |
| Storage imágenes | 🆕 Por hacer | Cloudinary / S3 |

### Migración de In-Memory a PostgreSQL

Lo que actualmente está en `Map()` y debe moverse a tablas:

| Map() actual | Tabla destino | Cambio necesario |
|-------------|---------------|-----------------|
| `otpChallenges` | `otp_challenges` | Reemplazar Map por queries SQL |
| `sessions` | `sesiones` | Reemplazar Map por queries SQL |
| `demoUsers` (hardcoded) | `usuarios` | Seed con INSERT + hash passwords |

### Variables de entorno (del `.env.example` existente)

```env
# Servidor
API_PORT=3000
FRONTEND_URL=http://localhost:4200
FRONTEND_ORIGIN=http://localhost:4200

# OTP (ya configurado)
OTP_DELIVERY_MODE=smtp          # console para desarrollo
OTP_EXPOSE_CODE_IN_RESPONSE=false # true solo en desarrollo

# Gmail SMTP (ya configurado)
OTP_EMAIL_HOST=smtp.gmail.com
OTP_EMAIL_PORT=465
OTP_EMAIL_SECURE=true
OTP_EMAIL_USER=huertoconnect@gmail.com
OTP_EMAIL_APP_PASSWORD=****

# Secrets (ya configurado)
OTP_HASH_SECRET=****
AUTH_PASSWORD_PEPPER=****

# Nuevas (por agregar)
DATABASE_URL=postgresql://user:pass@localhost:5432/huerto_connect
JWT_SECRET=****                  # si se migra a JWT
CLOUDINARY_URL=****              # para imágenes
```

---

## Mapeo: Frontend → DB → API → API Existente

| Servicio Frontend | Tabla DB | Endpoint | ¿Existe ya? |
|-------------------|----------|----------|-------------|
| `onLogin()` → navigate | `usuarios` + `otp_challenges` + `sesiones` | `POST /api/auth/send-otp` → `verify-otp` | ✅ Sí |
| `onRegister()` → console.log | `usuarios` + `otp_challenges` | `POST /api/auth/register` | 🆕 No |
| Sidebar "Cerrar sesión" | `sesiones` | `POST /api/auth/logout` | ✅ Sí |
| Sidebar perfil (avatar, nombre) | `usuarios` | `GET /api/auth/session` | ✅ Sí |
| `UsuariosService.getUsuarios()` | `usuarios` + COUNT(huertos) | `GET /api/usuarios` | 🆕 No |
| `HuertosService.getHuertos()` | `huertos` + COUNTs | `GET /api/huertos` | 🆕 No |
| `HuertosService.getCultivos()` | `cultivos` | `GET /api/cultivos` | 🆕 No |
| `AlertasService.getAlertas()` | `alertas` + JOINs | `GET /api/alertas` | 🆕 No |
| `PlagasService.getDetecciones()` | `plaga_detecciones` + JOINs | `GET /api/plagas` | 🆕 No |
| `RegionesService.getRegiones()` | `regiones` + COUNTs | `GET /api/regiones` | 🆕 No |
| `RegionesService.getPlantiosVeracruz()` | `plantios` + JOINs | `GET /api/regiones/:id/plantios` | 🆕 No |
| `ChatbotService.getMetricas()` | `chat_metricas` | `GET /api/chatbot/metricas` | 🆕 No |
| `ChatbotService.getConversaciones()` | `chat_conversaciones` + JOIN | `GET /api/chatbot/conversaciones` | 🆕 No |
| `ReportesService.getReportes()` | `reportes` | `GET /api/reportes` | 🆕 No |
| `ReportesService.getIntegraciones()` | `integraciones` | `GET /api/integraciones` | 🆕 No |
| `AuditoriaService.getLogs()` | `auditoria_logs` | `GET /api/auditoria` | 🆕 No |
| `DataService.sendContactForm()` | `contacto_mensajes` | `POST /api/public/contacto` | 🆕 No |
| Dashboard KPIs | 6x COUNT queries | `GET /api/dashboard/kpis` | 🆕 No |

---

> **18 tablas** · **~65 endpoints** (5 ya implementados + ~60 nuevos) · **Basado en código existente**
> Generado: 2026-03-06 · Frontend: rama `develop` · API: `huerto-connect-api`
