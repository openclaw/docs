---
read_when:
    - Diagnosticando la rotación de perfiles de autenticación, los periodos de enfriamiento o el comportamiento de reserva de modelos
    - Actualizando las reglas de conmutación por error para perfiles de autenticación o modelos
    - Comprendiendo cómo las anulaciones de modelo de sesión interactúan con los reintentos de reserva
summary: Cómo OpenClaw rota perfiles de autenticación y recurre a alternativas entre modelos
title: Conmutación por error de modelos
x-i18n:
    generated_at: "2026-04-24T05:25:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8921c9edd4699d8c623229cd3c82a92768d720fa9711862c270d6edb665841af
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw gestiona los fallos en dos etapas:

1. **Rotación de perfiles de autenticación** dentro del proveedor actual.
2. **Conmutación por error de modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

Este documento explica las reglas de tiempo de ejecución y los datos que las respaldan.

## Flujo de ejecución

Para una ejecución de texto normal, OpenClaw evalúa candidatos en este orden:

1. El modelo de sesión seleccionado actualmente.
2. Los `agents.defaults.model.fallbacks` configurados, en orden.
3. El modelo principal configurado al final cuando la ejecución comenzó desde una anulación.

Dentro de cada candidato, OpenClaw intenta la conmutación por error de perfil de autenticación antes de avanzar
al siguiente candidato de modelo.

Secuencia de alto nivel:

1. Resolver el modelo de sesión activo y la preferencia de perfil de autenticación.
2. Construir la cadena de candidatos de modelo.
3. Intentar el proveedor actual con reglas de rotación/periodo de enfriamiento de perfiles de autenticación.
4. Si ese proveedor se agota con un error que justifica conmutación por error, pasar al siguiente
   candidato de modelo.
5. Persistir la anulación de reserva seleccionada antes de que comience el reintento para que otros
   lectores de sesión vean el mismo proveedor/modelo que el ejecutor está a punto de usar.
6. Si el candidato de reserva falla, revertir solo los campos de anulación de sesión propiedad de la reserva cuando todavía coincidan con ese candidato fallido.
7. Si todos los candidatos fallan, lanzar un `FallbackSummaryError` con detalle por intento
   y el vencimiento de enfriamiento más próximo cuando se conozca.

Esto es intencionalmente más limitado que “guardar y restaurar toda la sesión”. El
ejecutor de respuestas solo persiste los campos de selección de modelo que posee para la reserva:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Eso evita que un reintento de reserva fallido sobrescriba mutaciones de sesión no relacionadas y más recientes,
como cambios manuales con `/model` o actualizaciones de rotación de sesión que
ocurrieron mientras el intento estaba en ejecución.

## Almacenamiento de autenticación (claves + OAuth)

OpenClaw usa **perfiles de autenticación** tanto para claves de API como para tokens OAuth.

- Los secretos viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (heredado: `~/.openclaw/agent/auth-profiles.json`).
- El estado de enrutamiento de autenticación en tiempo de ejecución vive en `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configuración `auth.profiles` / `auth.order` es **solo metadatos + enrutamiento** (sin secretos).
- Archivo heredado de OAuth solo para importación: `~/.openclaw/credentials/oauth.json` (importado a `auth-profiles.json` en el primer uso).

Más detalle: [/concepts/oauth](/es/concepts/oauth)

Tipos de credenciales:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para algunos proveedores)

## ID de perfil

Los inicios de sesión OAuth crean perfiles distintos para que varias cuentas puedan coexistir.

- Predeterminado: `provider:default` cuando no hay correo electrónico disponible.
- OAuth con correo electrónico: `provider:<email>` (por ejemplo `google-antigravity:user@gmail.com`).

Los perfiles viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` bajo `profiles`.

## Orden de rotación

Cuando un proveedor tiene varios perfiles, OpenClaw elige un orden así:

1. **Configuración explícita**: `auth.order[provider]` (si está configurado).
2. **Perfiles configurados**: `auth.profiles` filtrados por proveedor.
3. **Perfiles almacenados**: entradas en `auth-profiles.json` para el proveedor.

Si no hay un orden explícito configurado, OpenClaw usa un orden round‑robin:

- **Clave principal:** tipo de perfil (**OAuth antes que claves de API**).
- **Clave secundaria:** `usageStats.lastUsed` (más antiguo primero, dentro de cada tipo).
- Los **perfiles en enfriamiento/deshabilitados** se mueven al final, ordenados por el vencimiento más próximo.

### Persistencia por sesión (favorable para caché)

OpenClaw **fija el perfil de autenticación elegido por sesión** para mantener calientes las cachés del proveedor.
**No** rota en cada solicitud. El perfil fijado se reutiliza hasta que:

- la sesión se reinicia (`/new` / `/reset`)
- se completa una Compaction (se incrementa el contador de compacción)
- el perfil está en enfriamiento/deshabilitado

La selección manual mediante `/model …@<profileId>` establece una **anulación de usuario** para esa sesión
y no se rota automáticamente hasta que comienza una nueva sesión.

Los perfiles fijados automáticamente (seleccionados por el enrutador de sesión) se tratan como una **preferencia**:
se prueban primero, pero OpenClaw puede rotar a otro perfil ante límites de tasa/tiempos de espera.
Los perfiles fijados por el usuario permanecen bloqueados a ese perfil; si falla y hay reservas de modelo
configuradas, OpenClaw pasa al siguiente modelo en lugar de cambiar de perfil.

### Por qué OAuth puede “parecer perdido”

Si tienes tanto un perfil OAuth como un perfil de clave de API para el mismo proveedor, el round‑robin puede alternar entre ellos entre mensajes a menos que estén fijados. Para forzar un único perfil:

- Fíjalo con `auth.order[provider] = ["provider:profileId"]`, o
- Usa una anulación por sesión mediante `/model …` con una anulación de perfil (cuando tu superficie de UI/chat la admita).

## Periodos de enfriamiento

Cuando un perfil falla debido a errores de autenticación/límite de tasa (o a un tiempo de espera que
parece limitación de tasa), OpenClaw lo marca en enfriamiento y pasa al siguiente perfil.
Ese grupo de límites de tasa es más amplio que un simple `429`: también incluye mensajes del proveedor
como `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted`, y límites periódicos de ventana de uso como
`weekly/monthly limit reached`.
Los errores de formato/solicitud no válida (por ejemplo, fallos de validación de ID
de llamada a herramienta de Cloud Code Assist) se tratan como aptos para conmutación por error y usan los mismos periodos de enfriamiento.
Los errores de motivo de parada compatibles con OpenAI como `Unhandled stop reason: error`,
`stop reason: error`, y `reason: error` se clasifican como señales de tiempo de espera/conmutación por error.
El texto genérico de servidor con alcance de proveedor también puede caer en ese grupo de tiempo de espera cuando
la fuente coincide con un patrón transitorio conocido. Por ejemplo, en Anthropic un
`An unknown error occurred` simple y cargas JSON `api_error` con texto transitorio de servidor
como `internal server error`, `unknown error, 520`, `upstream error`,
o `backend error` se tratan como tiempos de espera aptos para conmutación por error. El texto genérico específico de OpenRouter
como `Provider returned error` simple también se trata como
tiempo de espera solo cuando el contexto del proveedor es realmente OpenRouter. El texto genérico de reserva interna
como `LLM request failed with an unknown error.` permanece
conservador y no activa por sí solo la conmutación por error.

Algunos SDK de proveedor podrían, de otro modo, dormir durante una larga ventana `Retry-After` antes de
devolver el control a OpenClaw. Para SDK basados en Stainless como Anthropic y
OpenAI, OpenClaw limita por defecto las esperas internas del SDK `retry-after-ms` / `retry-after` a 60
segundos y expone inmediatamente las respuestas reintentables más largas para que esta
ruta de conmutación por error pueda ejecutarse. Ajusta o desactiva el límite con
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulta [/concepts/retry](/es/concepts/retry).

Los periodos de enfriamiento por límite de tasa también pueden tener alcance por modelo:

- OpenClaw registra `cooldownModel` para fallos de límite de tasa cuando se conoce
  el ID del modelo que falló.
- Aún se puede intentar un modelo hermano en el mismo proveedor cuando el enfriamiento
  tiene alcance a un modelo distinto.
- Las ventanas de facturación/deshabilitación siguen bloqueando todo el perfil entre modelos.

Los periodos de enfriamiento usan retroceso exponencial:

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

Los fallos de facturación/crédito (por ejemplo “insufficient credits” / “credit balance too low”) se tratan como aptos para conmutación por error, pero normalmente no son transitorios. En lugar de un periodo corto de enfriamiento, OpenClaw marca el perfil como **deshabilitado** (con un retroceso más largo) y rota al siguiente perfil/proveedor.

No todas las respuestas con forma de facturación son `402`, y no todos los `402` HTTP acaban
aquí. OpenClaw mantiene texto explícito de facturación en la vía de facturación incluso cuando un
proveedor devuelve `401` o `403` en su lugar, pero los emparejadores específicos de proveedor siguen
limitados al proveedor que les corresponde (por ejemplo OpenRouter `403 Key limit
exceeded`). Mientras tanto, los errores temporales `402` de ventana de uso y
límite de gasto de organización/espacio de trabajo se clasifican como `rate_limit` cuando
el mensaje parece reintentable (por ejemplo `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow`, o `organization spending limit exceeded`).
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

- El retroceso por facturación comienza en **5 horas**, se duplica por cada fallo de facturación y alcanza un máximo de **24 horas**.
- Los contadores de retroceso se reinician si el perfil no ha fallado durante **24 horas** (configurable).
- Los reintentos por sobrecarga permiten **1 rotación de perfil del mismo proveedor** antes de la conmutación por error de modelo.
- Los reintentos por sobrecarga usan **0 ms de retroceso** de forma predeterminada.

## Conmutación por error de modelo

Si fallan todos los perfiles de un proveedor, OpenClaw pasa al siguiente modelo en
`agents.defaults.model.fallbacks`. Esto se aplica a fallos de autenticación, límites de tasa y
tiempos de espera que agotaron la rotación de perfiles (otros errores no hacen avanzar la reserva).

Los errores por sobrecarga y límite de tasa se gestionan de forma más agresiva que los periodos de
enfriamiento por facturación. De forma predeterminada, OpenClaw permite un reintento de perfil de autenticación del mismo proveedor,
y luego cambia al siguiente modelo de reserva configurado sin esperar.
Las señales de proveedor ocupado como `ModelNotReadyException` caen en ese grupo de sobrecarga. Ajusta esto con `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs`, y
`auth.cooldowns.rateLimitedProfileRotations`.

Cuando una ejecución comienza con una anulación de modelo (hooks o CLI), las reservas siguen terminando en
`agents.defaults.model.primary` después de probar cualquier reserva configurada.

### Reglas de la cadena de candidatos

OpenClaw construye la lista de candidatos a partir del `provider/model`
solicitado actualmente más las reservas configuradas.

Reglas:

- El modelo solicitado siempre va primero.
- Las reservas configuradas explícitas se desduplican, pero no se filtran por la lista de permitidos de modelos. Se tratan como intención explícita del operador.
- Si la ejecución actual ya está en una reserva configurada de la misma familia de proveedor,
  OpenClaw sigue usando la cadena configurada completa.
- Si la ejecución actual está en un proveedor distinto al de la configuración y ese modelo actual
  no forma ya parte de la cadena de reserva configurada, OpenClaw no
  añade reservas configuradas no relacionadas de otro proveedor.
- Cuando la ejecución comenzó desde una anulación, el modelo principal configurado se añade al
  final para que la cadena pueda volver al valor predeterminado normal una vez se agoten los
  candidatos anteriores.

### Qué errores hacen avanzar la reserva

La conmutación por error de modelo continúa con:

- fallos de autenticación
- límites de tasa y agotamiento del periodo de enfriamiento
- errores de sobrecarga/proveedor ocupado
- errores de conmutación por error con forma de tiempo de espera
- deshabilitaciones por facturación
- `LiveSessionModelSwitchError`, que se normaliza en una ruta de conmutación por error para que un
  modelo persistido obsoleto no cree un bucle externo de reintento
- otros errores no reconocidos cuando todavía quedan candidatos

La conmutación por error de modelo no continúa con:

- abortos explícitos que no tienen forma de tiempo de espera/conmutación por error
- errores de desbordamiento de contexto que deben permanecer dentro de la lógica de Compaction/reintento
  (por ejemplo `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model`, o `ollama error: context
length exceeded`)
- un error desconocido final cuando no quedan candidatos

### Comportamiento de omisión por enfriamiento frente a sondeo

Cuando todos los perfiles de autenticación de un proveedor ya están en enfriamiento, OpenClaw no
omite automáticamente ese proveedor para siempre. Toma una decisión por candidato:

- Los fallos persistentes de autenticación omiten inmediatamente todo el proveedor.
- Las deshabilitaciones por facturación normalmente se omiten, pero el candidato principal aún puede sondearse
  con limitación para que la recuperación sea posible sin reiniciar.
- El candidato principal puede sondearse cerca del vencimiento del enfriamiento, con una limitación por proveedor.
- Los modelos hermanos de reserva del mismo proveedor pueden intentarse a pesar del enfriamiento cuando el
  fallo parece transitorio (`rate_limit`, `overloaded` o desconocido). Esto es
  especialmente relevante cuando un límite de tasa tiene alcance por modelo y un modelo hermano aún puede
  recuperarse inmediatamente.
- Los sondeos transitorios de enfriamiento se limitan a uno por proveedor por ejecución de reserva para que
  un único proveedor no bloquee la reserva entre proveedores.

## Anulaciones de sesión y cambio de modelo en vivo

Los cambios de modelo de sesión son estado compartido. El ejecutor activo, el comando `/model`,
las actualizaciones de Compaction/sesión y la conciliación de sesión en vivo leen o escriben
partes de la misma entrada de sesión.

Eso significa que los reintentos de reserva tienen que coordinarse con el cambio de modelo en vivo:

- Solo los cambios de modelo explícitos impulsados por el usuario marcan un cambio en vivo pendiente. Eso
  incluye `/model`, `session_status(model=...)` y `sessions.patch`.
- Los cambios de modelo impulsados por el sistema, como la rotación de reserva, las anulaciones de Heartbeat
  o Compaction, nunca marcan por sí solos un cambio en vivo pendiente.
- Antes de que comience un reintento de reserva, el ejecutor de respuestas persiste los campos
  seleccionados de anulación de reserva en la entrada de sesión.
- La conciliación de sesión en vivo prefiere las anulaciones de sesión persistidas frente a campos de modelo de ejecución obsoletos.
- Si el intento de reserva falla, el ejecutor revierte solo los campos de anulación
  que escribió, y solo si todavía coinciden con ese candidato fallido.

Esto evita la condición de carrera clásica:

1. El principal falla.
2. Se elige en memoria un candidato de reserva.
3. El almacén de sesión todavía indica el principal antiguo.
4. La conciliación de sesión en vivo lee el estado obsoleto de la sesión.
5. El reintento vuelve al modelo antiguo antes de que comience el intento de reserva.

La anulación de reserva persistida cierra esa ventana, y la reversión limitada
mantiene intactos los cambios de sesión manuales o de ejecución más recientes.

## Observabilidad y resúmenes de fallos

`runWithModelFallback(...)` registra detalles por intento que alimentan registros y
mensajes visibles para el usuario sobre el enfriamiento:

- proveedor/modelo intentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, y
  motivos similares de conmutación por error)
- estado/código opcional
- resumen del error legible para humanos

Cuando todos los candidatos fallan, OpenClaw lanza `FallbackSummaryError`. El ejecutor
externo de respuestas puede usarlo para construir un mensaje más específico, como “todos los modelos
están temporalmente limitados por tasa”, e incluir el vencimiento de enfriamiento más próximo cuando se conozca.

Ese resumen de enfriamiento tiene en cuenta el modelo:

- los límites de tasa con alcance por modelo no relacionados se ignoran para la cadena
  proveedor/modelo intentada
- si el bloqueo restante es un límite de tasa con alcance por modelo coincidente, OpenClaw
  informa el último vencimiento coincidente que todavía bloquea ese modelo

## Configuración relacionada

Consulta [Configuración de Gateway](/es/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- enrutamiento de `agents.defaults.imageModel`

Consulta [Models](/es/concepts/models) para ver el resumen más amplio de selección de modelos y conmutación por error.
