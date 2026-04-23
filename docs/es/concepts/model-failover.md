---
read_when:
    - Diagnóstico de la rotación de perfiles de autenticación, los períodos de enfriamiento o el comportamiento de conmutación por error del modelo
    - Actualización de las reglas de conmutación por error para perfiles de autenticación o modelos
    - Comprender cómo las anulaciones del modelo de sesión interactúan con los reintentos de conmutación por error
summary: Cómo OpenClaw rota los perfiles de autenticación y recurre a alternativas entre modelos
title: Conmutación por error del modelo
x-i18n:
    generated_at: "2026-04-23T05:14:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1f06d5371379cc59998e1cd6f52d250e8c4eba4e7dbfef776a090899b8d3c4
    source_path: concepts/model-failover.md
    workflow: 15
---

# Conmutación por error del modelo

OpenClaw maneja los fallos en dos etapas:

1. **Rotación de perfiles de autenticación** dentro del proveedor actual.
2. **Conmutación por error del modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

Este documento explica las reglas de tiempo de ejecución y los datos que las respaldan.

## Flujo en tiempo de ejecución

Para una ejecución de texto normal, OpenClaw evalúa los candidatos en este orden:

1. El modelo de sesión seleccionado actualmente.
2. `agents.defaults.model.fallbacks` configurados en orden.
3. El modelo primario configurado al final cuando la ejecución comenzó desde una anulación.

Dentro de cada candidato, OpenClaw intenta la conmutación por error del perfil de autenticación antes de avanzar al siguiente candidato de modelo.

Secuencia de alto nivel:

1. Resolver el modelo de sesión activo y la preferencia de perfil de autenticación.
2. Construir la cadena de candidatos de modelo.
3. Probar el proveedor actual con reglas de rotación/enfriamiento de perfiles de autenticación.
4. Si ese proveedor se agota con un error apto para conmutación por error, pasar al siguiente candidato de modelo.
5. Conservar la anulación de respaldo seleccionada antes de que comience el reintento para que otros lectores de la sesión vean el mismo proveedor/modelo que el ejecutor está a punto de usar.
6. Si falla el candidato de respaldo, revertir solo los campos de anulación de sesión que pertenecen al respaldo cuando todavía coinciden con ese candidato fallido.
7. Si todos los candidatos fallan, lanzar un `FallbackSummaryError` con detalles por intento y el vencimiento de enfriamiento más próximo cuando se conozca.

Esto es intencionalmente más limitado que "guardar y restaurar toda la sesión". El ejecutor de respuestas solo conserva los campos de selección de modelo que controla para el respaldo:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Eso evita que un reintento de respaldo fallido sobrescriba mutaciones más recientes y no relacionadas de la sesión, como cambios manuales de `/model` o actualizaciones de rotación de sesión que ocurrieron mientras el intento estaba en ejecución.

## Almacenamiento de autenticación (claves + OAuth)

OpenClaw usa **perfiles de autenticación** tanto para claves de API como para tokens OAuth.

- Los secretos viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (heredado: `~/.openclaw/agent/auth-profiles.json`).
- El estado de enrutamiento de autenticación en tiempo de ejecución vive en `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configuración `auth.profiles` / `auth.order` es **solo metadatos + enrutamiento** (sin secretos).
- Archivo OAuth heredado solo para importación: `~/.openclaw/credentials/oauth.json` (importado en `auth-profiles.json` en el primer uso).

Más detalles: [/concepts/oauth](/es/concepts/oauth)

Tipos de credenciales:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para algunos proveedores)

## ID de perfil

Los inicios de sesión OAuth crean perfiles distintos para que varias cuentas puedan coexistir.

- Predeterminado: `provider:default` cuando no hay correo electrónico disponible.
- OAuth con correo electrónico: `provider:<email>` (por ejemplo, `google-antigravity:user@gmail.com`).

Los perfiles viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` bajo `profiles`.

## Orden de rotación

Cuando un proveedor tiene varios perfiles, OpenClaw elige un orden así:

1. **Configuración explícita**: `auth.order[provider]` (si está establecida).
2. **Perfiles configurados**: `auth.profiles` filtrados por proveedor.
3. **Perfiles almacenados**: entradas en `auth-profiles.json` para el proveedor.

Si no hay un orden explícito configurado, OpenClaw usa un orden round robin:

- **Clave primaria:** tipo de perfil (**OAuth antes que las claves de API**).
- **Clave secundaria:** `usageStats.lastUsed` (el más antiguo primero, dentro de cada tipo).
- **Los perfiles en enfriamiento/deshabilitados** se mueven al final, ordenados por el vencimiento más próximo.

### Persistencia por sesión (optimizada para caché)

OpenClaw **fija el perfil de autenticación elegido por sesión** para mantener calientes las cachés del proveedor.
**No** rota en cada solicitud. El perfil fijado se reutiliza hasta que:

- la sesión se restablece (`/new` / `/reset`)
- se completa una Compaction (el contador de Compaction se incrementa)
- el perfil entra en enfriamiento/se deshabilita

La selección manual mediante `/model …@<profileId>` establece una **anulación del usuario** para esa sesión
y no rota automáticamente hasta que comienza una nueva sesión.

Los perfiles fijados automáticamente (seleccionados por el enrutador de sesión) se tratan como una **preferencia**:
se prueban primero, pero OpenClaw puede rotar a otro perfil ante límites de tasa/tiempos de espera.
Los perfiles fijados por el usuario permanecen bloqueados en ese perfil; si falla y hay respaldos de modelo configurados,
OpenClaw pasa al siguiente modelo en lugar de cambiar de perfil.

### Por qué OAuth puede "parecer perdido"

Si tiene tanto un perfil OAuth como un perfil con clave de API para el mismo proveedor, el round robin puede alternar entre ellos entre mensajes a menos que se fijen. Para forzar un solo perfil:

- Fíjelo con `auth.order[provider] = ["provider:profileId"]`, o
- Use una anulación por sesión mediante `/model …` con una anulación de perfil (cuando su interfaz/superficie de chat lo admita).

## Enfriamientos

Cuando un perfil falla debido a errores de autenticación/límite de tasa (o a un tiempo de espera que parece un límite de tasa), OpenClaw lo marca en enfriamiento y pasa al siguiente perfil.
Ese grupo de límites de tasa es más amplio que un simple `429`: también incluye mensajes del proveedor
como `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` y límites periódicos de ventana de uso como
`weekly/monthly limit reached`.
Los errores de formato/solicitud no válida (por ejemplo, fallos de validación de ID de llamada de herramienta de Cloud Code Assist) se tratan como aptos para conmutación por error y usan los mismos enfriamientos.
Los errores de motivo de detención compatibles con OpenAI, como `Unhandled stop reason: error`,
`stop reason: error` y `reason: error`, se clasifican como señales de tiempo de espera/conmutación por error.
El texto genérico de error del servidor con alcance de proveedor también puede caer en ese grupo de tiempo de espera cuando
la fuente coincide con un patrón transitorio conocido. Por ejemplo, en Anthropic,
`An unknown error occurred` sin más contexto y las cargas JSON `api_error` con texto transitorio del servidor
como `internal server error`, `unknown error, 520`, `upstream error`
o `backend error` se tratan como tiempos de espera aptos para conmutación por error. El texto genérico específico de OpenRouter
del upstream, como `Provider returned error` sin más contexto, también se trata como
tiempo de espera solo cuando el contexto del proveedor es realmente OpenRouter. El texto genérico interno
de respaldo, como `LLM request failed with an unknown error.`, permanece
conservador y no activa por sí solo la conmutación por error.

De otro modo, algunos SDK de proveedor pueden esperar una ventana larga de `Retry-After` antes
de devolver el control a OpenClaw. En los SDK basados en Stainless, como Anthropic y
OpenAI, OpenClaw limita por defecto las esperas internas del SDK `retry-after-ms` / `retry-after` a 60
segundos y muestra inmediatamente las respuestas reintentables más largas para que esta
ruta de conmutación por error pueda ejecutarse. Ajuste o desactive el límite con
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulte [/concepts/retry](/es/concepts/retry).

Los enfriamientos por límite de tasa también pueden tener alcance de modelo:

- OpenClaw registra `cooldownModel` para fallos de límite de tasa cuando se conoce
  el ID del modelo que falló.
- Todavía se puede probar un modelo hermano en el mismo proveedor cuando el enfriamiento
  está limitado a un modelo distinto.
- Las ventanas de facturación/deshabilitación siguen bloqueando todo el perfil en todos los modelos.

Los enfriamientos usan retroceso exponencial:

- 1 minuto
- 5 minutos
- 25 minutos
- 1 hora (límite)

El estado se almacena en `auth-state.json` bajo `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Deshabilitaciones por facturación

Los fallos de facturación/crédito (por ejemplo, “insufficient credits” / “credit balance too low”) se tratan como aptos para conmutación por error, pero normalmente no son transitorios. En lugar de un enfriamiento corto, OpenClaw marca el perfil como **deshabilitado** (con un retroceso más largo) y rota al siguiente perfil/proveedor.

No todas las respuestas con aspecto de facturación son `402`, ni todos los `402` HTTP terminan
aquí. OpenClaw mantiene el texto explícito de facturación en la vía de facturación incluso cuando un
proveedor devuelve `401` o `403` en su lugar, pero los comparadores específicos del proveedor permanecen
limitados al proveedor al que pertenecen (por ejemplo, OpenRouter `403 Key limit
exceeded`). Mientras tanto, las ventanas temporales de uso `402` y los errores de límite de gasto
de organización/espacio de trabajo se clasifican como `rate_limit` cuando
el mensaje parece reintentable (por ejemplo, `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` o `organization spending limit exceeded`).
Estos permanecen en la ruta de enfriamiento corto/conmutación por error en lugar de la ruta larga
de deshabilitación por facturación.

El estado se almacena en `auth-state.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Valores predeterminados:

- El retroceso por facturación comienza en **5 horas**, se duplica con cada fallo de facturación y tiene un límite de **24 horas**.
- Los contadores de retroceso se restablecen si el perfil no ha fallado durante **24 horas** (configurable).
- Los reintentos por sobrecarga permiten **1 rotación de perfil del mismo proveedor** antes de la conmutación por error del modelo.
- Los reintentos por sobrecarga usan **0 ms de retroceso** de forma predeterminada.

## Conmutación por error del modelo

Si todos los perfiles de un proveedor fallan, OpenClaw pasa al siguiente modelo en
`agents.defaults.model.fallbacks`. Esto se aplica a fallos de autenticación, límites de tasa y
tiempos de espera que agotaron la rotación de perfiles (otros errores no avanzan el respaldo).

Los errores por sobrecarga y límite de tasa se manejan de forma más agresiva que los enfriamientos por facturación. De forma predeterminada, OpenClaw permite un reintento de perfil de autenticación del mismo proveedor y luego cambia al siguiente modelo de respaldo configurado sin esperar.
Las señales de proveedor ocupado, como `ModelNotReadyException`, entran en ese grupo de sobrecarga. Ajuste esto con `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` y
`auth.cooldowns.rateLimitedProfileRotations`.

Cuando una ejecución comienza con una anulación de modelo (hooks o CLI), los respaldos siguen terminando en
`agents.defaults.model.primary` después de probar los respaldos configurados.

### Reglas de la cadena de candidatos

OpenClaw construye la lista de candidatos a partir del `provider/model` solicitado actualmente
más los respaldos configurados.

Reglas:

- El modelo solicitado siempre va primero.
- Los respaldos configurados explícitamente se desduplican, pero no se filtran por la lista permitida de modelos.
  Se tratan como intención explícita del operador.
- Si la ejecución actual ya está en un respaldo configurado de la misma familia de proveedor,
  OpenClaw sigue usando toda la cadena configurada.
- Si la ejecución actual está en un proveedor distinto del configurado y ese modelo actual
  no forma parte ya de la cadena de respaldo configurada, OpenClaw no
  agrega respaldos configurados no relacionados de otro proveedor.
- Cuando la ejecución comenzó desde una anulación, el modelo primario configurado se agrega al
  final para que la cadena pueda volver al valor predeterminado normal una vez agotados los
  candidatos anteriores.

### Qué errores hacen avanzar el respaldo

La conmutación por error del modelo continúa en:

- fallos de autenticación
- límites de tasa y agotamiento del enfriamiento
- errores de sobrecarga/proveedor ocupado
- errores de tiempo de espera aptos para conmutación por error
- deshabilitaciones por facturación
- `LiveSessionModelSwitchError`, que se normaliza en una ruta de conmutación por error para que un
  modelo conservado obsoleto no cree un bucle de reintento externo
- otros errores no reconocidos cuando todavía quedan candidatos

La conmutación por error del modelo no continúa en:

- abortos explícitos que no tienen forma de tiempo de espera/conmutación por error
- errores de desbordamiento de contexto que deben permanecer dentro de la lógica de Compaction/reintento
  (por ejemplo, `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` o `ollama error: context
length exceeded`)
- un error desconocido final cuando no quedan candidatos

### Comportamiento de omisión por enfriamiento frente a sondeo

Cuando todos los perfiles de autenticación de un proveedor ya están en enfriamiento, OpenClaw no
omite automáticamente ese proveedor para siempre. Toma una decisión por candidato:

- Los fallos de autenticación persistentes omiten todo el proveedor de inmediato.
- Las deshabilitaciones por facturación normalmente se omiten, pero el candidato primario aún puede sondearse
  con una limitación para que la recuperación sea posible sin reiniciar.
- El candidato primario puede sondearse cerca del vencimiento del enfriamiento, con una limitación
  por proveedor.
- Los modelos hermanos de respaldo dentro del mismo proveedor pueden intentarse a pesar del enfriamiento cuando
  el fallo parece transitorio (`rate_limit`, `overloaded` o desconocido). Esto es
  especialmente relevante cuando un límite de tasa tiene alcance de modelo y un modelo hermano puede
  seguir recuperándose de inmediato.
- Los sondeos transitorios durante el enfriamiento están limitados a uno por proveedor por ejecución de respaldo, para que
  un solo proveedor no bloquee la conmutación por error entre proveedores.

## Anulaciones de sesión y cambio de modelo en vivo

Los cambios de modelo de sesión son estado compartido. El ejecutor activo, el comando `/model`,
las actualizaciones de Compaction/sesión y la reconciliación de sesión en vivo leen o escriben
partes de la misma entrada de sesión.

Eso significa que los reintentos de respaldo deben coordinarse con el cambio de modelo en vivo:

- Solo los cambios de modelo explícitos impulsados por el usuario marcan un cambio en vivo pendiente. Eso
  incluye `/model`, `session_status(model=...)` y `sessions.patch`.
- Los cambios de modelo impulsados por el sistema, como la rotación de respaldo, las anulaciones de Heartbeat
  o Compaction, nunca marcan por sí solos un cambio en vivo pendiente.
- Antes de que comience un reintento de respaldo, el ejecutor de respuestas conserva los campos
  de anulación de respaldo seleccionados en la entrada de sesión.
- La reconciliación de sesión en vivo prefiere las anulaciones de sesión conservadas frente a campos
  de modelo de tiempo de ejecución obsoletos.
- Si falla el intento de respaldo, el ejecutor revierte solo los campos de anulación
  que escribió, y solo si todavía coinciden con ese candidato fallido.

Esto evita la condición de carrera clásica:

1. El primario falla.
2. Se elige en memoria un candidato de respaldo.
3. El almacén de sesiones sigue indicando el primario anterior.
4. La reconciliación de sesión en vivo lee el estado obsoleto de la sesión.
5. El reintento vuelve al modelo anterior antes de que comience el intento de respaldo.

La anulación de respaldo conservada cierra esa ventana, y la reversión limitada
mantiene intactos los cambios de sesión manuales o de tiempo de ejecución más recientes.

## Observabilidad y resúmenes de fallos

`runWithModelFallback(...)` registra detalles por intento que alimentan los registros y
los mensajes de enfriamiento orientados al usuario:

- proveedor/modelo intentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` y
  motivos de conmutación por error similares)
- estado/código opcional
- resumen del error legible para humanos

Cuando todos los candidatos fallan, OpenClaw lanza `FallbackSummaryError`. El ejecutor externo
de respuestas puede usarlo para construir un mensaje más específico, como "todos los modelos
están temporalmente limitados por tasa", e incluir el vencimiento de enfriamiento más próximo cuando
se conozca.

Ese resumen de enfriamiento reconoce el modelo:

- se ignoran los límites de tasa con alcance de modelo no relacionados para la cadena intentada
  de proveedor/modelo
- si el bloqueo restante es un límite de tasa con alcance de modelo que coincide, OpenClaw
  informa el último vencimiento coincidente que todavía bloquea ese modelo

## Configuración relacionada

Consulte [Configuración del Gateway](/es/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- enrutamiento de `agents.defaults.imageModel`

Consulte [Models](/es/concepts/models) para la descripción general más amplia de la selección de modelos y la conmutación por error.
