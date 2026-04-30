---
read_when:
    - Diagnóstico de la rotación de perfiles de autenticación, los períodos de espera o el comportamiento de reserva del modelo
    - Actualización de las reglas de conmutación por error para perfiles de autenticación o modelos
    - Comprender cómo interactúan las anulaciones del modelo de sesión con los reintentos de reserva
sidebarTitle: Model failover
summary: Cómo OpenClaw rota los perfiles de autenticación y recurre a modelos alternativos
title: Conmutación por error del modelo
x-i18n:
    generated_at: "2026-04-30T05:37:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gestiona los fallos en dos etapas:

1. **Rotación de perfiles de autenticación** dentro del proveedor actual.
2. **Respaldo de modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

Este documento explica las reglas de tiempo de ejecución y los datos que las respaldan.

## Flujo de tiempo de ejecución

Para una ejecución de texto normal, OpenClaw evalúa los candidatos en este orden:

<Steps>
  <Step title="Resolve session state">
    Resuelve el modelo de sesión activo y la preferencia de perfil de autenticación.
  </Step>
  <Step title="Build candidate chain">
    Construye la cadena de candidatos de modelo a partir de la selección de modelo actual y la política de respaldo para esa fuente de selección. Los valores predeterminados configurados, los modelos primarios de trabajos de Cron y los modelos de respaldo seleccionados automáticamente pueden usar respaldos configurados; las selecciones explícitas de sesión del usuario son estrictas.
  </Step>
  <Step title="Try the current provider">
    Prueba el proveedor actual con reglas de rotación/enfriamiento de perfiles de autenticación.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Si ese proveedor se agota con un error que justifica conmutación por error, pasa al siguiente candidato de modelo.
  </Step>
  <Step title="Persist fallback override">
    Persiste la anulación de respaldo seleccionada antes de que empiece el reintento, para que otros lectores de la sesión vean el mismo proveedor/modelo que el ejecutor está a punto de usar. La anulación de modelo persistida se marca como `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Si el candidato de respaldo falla, revierte solo los campos de anulación de sesión propiedad del respaldo cuando todavía coinciden con ese candidato fallido.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Si todos los candidatos fallan, lanza un `FallbackSummaryError` con detalles por intento y el vencimiento de enfriamiento más cercano cuando se conoce.
  </Step>
</Steps>

Esto es intencionadamente más acotado que "guardar y restaurar toda la sesión". El ejecutor de respuestas solo persiste los campos de selección de modelo que le pertenecen para el respaldo:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Eso evita que un reintento de respaldo fallido sobrescriba mutaciones de sesión no relacionadas más recientes, como cambios manuales de `/model` o actualizaciones de rotación de sesión que ocurrieron mientras el intento estaba en ejecución.

## Política de fuente de selección

OpenClaw separa el proveedor/modelo seleccionado de la razón por la que se seleccionó. Esa fuente controla si se permite la cadena de respaldo:

- **Valor predeterminado configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Modelo primario del agente**: `agents.list[].model` es estricto a menos que ese objeto de modelo del agente incluya sus propios `fallbacks`. Usa `fallbacks: []` para hacer explícito el comportamiento estricto, o proporciona una lista no vacía para habilitar el respaldo de modelo en ese agente.
- **Anulación de respaldo automática**: un respaldo en tiempo de ejecución escribe `providerOverride`, `modelOverride` y `modelOverrideSource: "auto"` antes de reintentar. Esa anulación automática puede seguir recorriendo la cadena de respaldo configurada y se borra con `/new`, `/reset` y `sessions.reset`.
- **Anulación de sesión del usuario**: `/model`, el selector de modelo, `session_status(model=...)` y `sessions.patch` escriben `modelOverrideSource: "user"`. Esa es una selección exacta de sesión. Si el proveedor/modelo seleccionado falla antes de producir una respuesta, OpenClaw informa el fallo en lugar de responder desde un respaldo configurado no relacionado.
- **Anulación de sesión heredada**: las entradas de sesión más antiguas pueden tener `modelOverride` sin `modelOverrideSource`. OpenClaw las trata como anulaciones de usuario para que una selección antigua explícita no se convierta silenciosamente en comportamiento de respaldo.
- **Modelo de carga útil de Cron**: un trabajo de Cron `payload.model` / `--model` es un primario de trabajo, no una anulación de sesión del usuario. Usa respaldos configurados a menos que el trabajo proporcione `payload.fallbacks`; `payload.fallbacks: []` hace que la ejecución de Cron sea estricta.

## Almacenamiento de autenticación (claves + OAuth)

OpenClaw usa **perfiles de autenticación** tanto para claves de API como para tokens OAuth.

- Los secretos viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (heredado: `~/.openclaw/agent/auth-profiles.json`).
- El estado de enrutamiento de autenticación en tiempo de ejecución vive en `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configuración `auth.profiles` / `auth.order` es **solo metadatos + enrutamiento** (sin secretos).
- Archivo OAuth heredado solo de importación: `~/.openclaw/credentials/oauth.json` (se importa a `auth-profiles.json` en el primer uso).

Más detalles: [OAuth](/es/concepts/oauth)

Tipos de credenciales:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para algunos proveedores)

## IDs de perfil

Los inicios de sesión OAuth crean perfiles distintos para que puedan coexistir varias cuentas.

- Predeterminado: `provider:default` cuando no hay correo electrónico disponible.
- OAuth con correo electrónico: `provider:<email>` (por ejemplo `google-antigravity:user@gmail.com`).

Los perfiles viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` bajo `profiles`.

## Orden de rotación

Cuando un proveedor tiene varios perfiles, OpenClaw elige un orden así:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (si está definido).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` filtrado por proveedor.
  </Step>
  <Step title="Stored profiles">
    Entradas en `auth-profiles.json` para el proveedor.
  </Step>
</Steps>

Si no se configura un orden explícito, OpenClaw usa un orden round-robin:

- **Clave primaria:** tipo de perfil (**OAuth antes que claves de API**).
- **Clave secundaria:** `usageStats.lastUsed` (el más antiguo primero, dentro de cada tipo).
- Los **perfiles en enfriamiento/deshabilitados** se mueven al final, ordenados por el vencimiento más cercano.

### Fijación de sesión (compatible con caché)

OpenClaw **fija el perfil de autenticación elegido por sesión** para mantener calientes las cachés del proveedor. **No** rota en cada solicitud. El perfil fijado se reutiliza hasta que:

- la sesión se restablece (`/new` / `/reset`)
- se completa una Compaction (se incrementa el contador de Compaction)
- el perfil está en enfriamiento/deshabilitado

La selección manual mediante `/model …@<profileId>` define una **anulación de usuario** para esa sesión y no se rota automáticamente hasta que comienza una nueva sesión.

<Note>
Los perfiles fijados automáticamente (seleccionados por el enrutador de sesión) se tratan como una **preferencia**: se prueban primero, pero OpenClaw puede rotar a otro perfil ante límites de tasa/tiempos de espera. Los perfiles fijados por el usuario permanecen bloqueados en ese perfil; si falla y hay respaldos de modelo configurados, OpenClaw pasa al siguiente modelo en lugar de cambiar de perfil.
</Note>

### Por qué OAuth puede "parecer perdido"

Si tienes tanto un perfil OAuth como un perfil de clave de API para el mismo proveedor, round-robin puede alternar entre ellos en distintos mensajes a menos que estén fijados. Para forzar un solo perfil:

- Fija con `auth.order[provider] = ["provider:profileId"]`, o
- Usa una anulación por sesión mediante `/model …` con una anulación de perfil (cuando tu UI/superficie de chat lo admita).

## Enfriamientos

Cuando un perfil falla debido a errores de autenticación/límite de tasa (o un tiempo de espera que parece un límite de tasa), OpenClaw lo marca en enfriamiento y pasa al siguiente perfil.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Ese grupo de límite de tasa es más amplio que un simple `429`: también incluye mensajes de proveedores como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` y límites periódicos de ventanas de uso como `weekly/monthly limit reached`.

    Los errores de formato/solicitud inválida (por ejemplo, fallos de validación de ID de llamada a herramienta de Cloud Code Assist) se tratan como aptos para conmutación por error y usan los mismos enfriamientos. Los errores de motivo de parada compatibles con OpenAI, como `Unhandled stop reason: error`, `stop reason: error` y `reason: error`, se clasifican como señales de tiempo de espera/conmutación por error.

    El texto genérico del servidor también puede caer en ese grupo de tiempo de espera cuando la fuente coincide con un patrón transitorio conocido. Por ejemplo, el mensaje simple del envoltorio de flujo pi-ai `An unknown error occurred` se trata como apto para conmutación por error para todos los proveedores porque pi-ai lo emite cuando los flujos del proveedor terminan con `stopReason: "aborted"` o `stopReason: "error"` sin detalles específicos. Las cargas JSON `api_error` con texto transitorio del servidor como `internal server error`, `unknown error, 520`, `upstream error` o `backend error` también se tratan como tiempos de espera aptos para conmutación por error.

    El texto genérico de upstream específico de OpenRouter, como el simple `Provider returned error`, se trata como tiempo de espera solo cuando el contexto del proveedor es realmente OpenRouter. El texto genérico interno de respaldo, como `LLM request failed with an unknown error.`, se mantiene conservador y no activa la conmutación por error por sí solo.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    Algunos SDK de proveedores podrían dormir durante una ventana larga de `Retry-After` antes de devolver el control a OpenClaw. Para SDK basados en Stainless, como Anthropic y OpenAI, OpenClaw limita por defecto las esperas internas del SDK `retry-after-ms` / `retry-after` a 60 segundos y expone de inmediato las respuestas reintentables más largas para que esta ruta de conmutación por error pueda ejecutarse. Ajusta o deshabilita el límite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulta [Comportamiento de reintento](/es/concepts/retry).
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    Los enfriamientos de límite de tasa también pueden tener alcance de modelo:

    - OpenClaw registra `cooldownModel` para fallos de límite de tasa cuando se conoce el ID del modelo que falla.
    - Todavía se puede probar un modelo hermano del mismo proveedor cuando el enfriamiento está limitado a un modelo diferente.
    - Las ventanas de facturación/deshabilitación siguen bloqueando todo el perfil entre modelos.

  </Accordion>
</AccordionGroup>

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

Los fallos de facturación/crédito (por ejemplo, "insufficient credits" / "credit balance too low") se tratan como aptos para conmutación por error, pero normalmente no son transitorios. En lugar de un enfriamiento breve, OpenClaw marca el perfil como **deshabilitado** (con un retroceso más largo) y rota al siguiente perfil/proveedor.

<Note>
No todas las respuestas con forma de facturación son `402`, y no todos los HTTP `402` caen aquí. OpenClaw mantiene el texto explícito de facturación en la vía de facturación incluso cuando un proveedor devuelve `401` o `403` en su lugar, pero los comparadores específicos del proveedor se mantienen limitados al proveedor al que pertenecen (por ejemplo, OpenRouter `403 Key limit exceeded`).

Mientras tanto, los errores temporales `402` de ventana de uso y de límite de gasto de organización/espacio de trabajo se clasifican como `rate_limit` cuando el mensaje parece reintentable (por ejemplo, `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` u `organization spending limit exceeded`). Estos permanecen en la ruta de enfriamiento/conmutación por error breve en lugar de la ruta larga de deshabilitación por facturación.
</Note>

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

- El retroceso de facturación empieza en **5 horas**, se duplica por cada fallo de facturación y se limita a **24 horas**.
- Los contadores de retroceso se restablecen si el perfil no ha fallado durante **24 horas** (configurable).
- Los reintentos por sobrecarga permiten **1 rotación de perfil del mismo proveedor** antes del respaldo de modelo.
- Los reintentos por sobrecarga usan **0 ms de retroceso** por defecto.

## Respaldo de modelo

Si todos los perfiles de un proveedor fallan, OpenClaw pasa al siguiente modelo en `agents.defaults.model.fallbacks`. Esto se aplica a fallos de autenticación, límites de tasa y tiempos de espera que agotaron la rotación de perfiles (otros errores no avanzan el respaldo). Los errores de proveedor que no exponen suficiente detalle aún se etiquetan con precisión en el estado de respaldo: `empty_response` significa que el proveedor no devolvió ningún mensaje o estado utilizable, `no_error_details` significa que el proveedor devolvió explícitamente `Unknown error (no error details in response)`, y `unclassified` significa que OpenClaw conservó la vista previa sin procesar pero ningún clasificador la coincidió todavía.

Los errores de sobrecarga y límite de tasa se gestionan de forma más agresiva que los tiempos de espera de facturación. De forma predeterminada, OpenClaw permite un reintento de perfil de autenticación del mismo proveedor y luego cambia al siguiente respaldo de modelo configurado sin esperar. Las señales de proveedor ocupado, como `ModelNotReadyException`, caen en ese grupo de sobrecarga. Ajusta esto con `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` y `auth.cooldowns.rateLimitedProfileRotations`.

Cuando una ejecución comienza desde el primario predeterminado configurado, un primario de trabajo cron, un primario de agente con respaldos explícitos o una anulación de respaldo seleccionada automáticamente, OpenClaw puede recorrer la cadena de respaldos configurada correspondiente. Los primarios de agente sin respaldos explícitos y las selecciones explícitas del usuario (por ejemplo, `/model ollama/qwen3.5:27b`, el selector de modelo, `sessions.patch` o anulaciones puntuales de proveedor/modelo en la CLI) son estrictos: si ese proveedor/modelo no es accesible o falla antes de producir una respuesta, OpenClaw informa el fallo en lugar de responder desde un respaldo no relacionado.

### Reglas de la cadena de candidatos

OpenClaw construye la lista de candidatos a partir del `provider/model` solicitado actualmente más los respaldos configurados.

<AccordionGroup>
  <Accordion title="Reglas">
    - El modelo solicitado siempre va primero.
    - Los respaldos configurados explícitos se deduplican, pero no se filtran por la lista de modelos permitidos. Se tratan como intención explícita del operador.
    - Si la ejecución actual ya está en un respaldo configurado de la misma familia de proveedores, OpenClaw sigue usando la cadena configurada completa.
    - Si la ejecución actual está en un proveedor distinto al de la configuración y ese modelo actual todavía no forma parte de la cadena de respaldos configurada, OpenClaw no agrega respaldos configurados no relacionados de otro proveedor.
    - Cuando no se proporciona una anulación de respaldo explícita al ejecutor de respaldos, el primario configurado se agrega al final para que la cadena pueda volver al valor predeterminado normal una vez agotados los candidatos anteriores.
    - Cuando un llamador proporciona `fallbacksOverride`, el ejecutor usa exactamente el modelo solicitado más esa lista de anulaciones. Una lista vacía desactiva el respaldo de modelo e impide que el primario configurado se agregue como objetivo oculto de reintento.

  </Accordion>
</AccordionGroup>

### Qué errores hacen avanzar el respaldo

<Tabs>
  <Tab title="Continúa con">
    - fallos de autenticación
    - límites de tasa y agotamiento de tiempos de espera
    - errores de sobrecarga/proveedor ocupado
    - errores de conmutación por error con forma de tiempo de espera
    - desactivaciones por facturación
    - `LiveSessionModelSwitchError`, que se normaliza en una ruta de conmutación por error para que un modelo persistido obsoleto no cree un bucle de reintento externo
    - otros errores no reconocidos cuando todavía quedan candidatos

  </Tab>
  <Tab title="No continúa con">
    - cancelaciones explícitas que no tienen forma de tiempo de espera/conmutación por error
    - errores de desbordamiento de contexto que deben permanecer dentro de la lógica de Compaction/reintento (por ejemplo, `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` u `ollama error: context length exceeded`)
    - un error desconocido final cuando no quedan candidatos

  </Tab>
</Tabs>

### Comportamiento de omisión por tiempo de espera frente a sondeo

Cuando todos los perfiles de autenticación de un proveedor ya están en tiempo de espera, OpenClaw no omite automáticamente ese proveedor para siempre. Toma una decisión por candidato:

<AccordionGroup>
  <Accordion title="Decisiones por candidato">
    - Los fallos de autenticación persistentes omiten todo el proveedor inmediatamente.
    - Las desactivaciones por facturación suelen omitirse, pero el candidato primario todavía puede sondearse con una limitación para que la recuperación sea posible sin reiniciar.
    - El candidato primario puede sondearse cerca del vencimiento del tiempo de espera, con una limitación por proveedor.
    - Los respaldos hermanos del mismo proveedor pueden intentarse pese al tiempo de espera cuando el fallo parece transitorio (`rate_limit`, `overloaded` o desconocido). Esto es especialmente relevante cuando un límite de tasa tiene alcance de modelo y un modelo hermano todavía puede recuperarse inmediatamente.
    - Los sondeos de tiempos de espera transitorios se limitan a uno por proveedor por ejecución de respaldo para que un solo proveedor no bloquee el respaldo entre proveedores.

  </Accordion>
</AccordionGroup>

## Anulaciones de sesión y cambio de modelo en vivo

Los cambios de modelo de sesión son estado compartido. El ejecutor activo, el comando `/model`, las actualizaciones de Compaction/sesión y la reconciliación de sesión en vivo leen o escriben partes de la misma entrada de sesión.

Eso significa que los reintentos de respaldo deben coordinarse con el cambio de modelo en vivo:

- Solo los cambios de modelo impulsados explícitamente por el usuario marcan un cambio en vivo pendiente. Esto incluye `/model`, `session_status(model=...)` y `sessions.patch`.
- Los cambios de modelo impulsados por el sistema, como la rotación de respaldos, las anulaciones de Heartbeat o Compaction, nunca marcan por sí solos un cambio en vivo pendiente.
- Las anulaciones de modelo impulsadas por el usuario se tratan como selecciones exactas para la política de respaldo, por lo que un proveedor seleccionado inaccesible se muestra como fallo en lugar de quedar oculto por `agents.defaults.model.fallbacks`.
- Antes de que comience un reintento de respaldo, el ejecutor de respuestas persiste los campos de anulación de respaldo seleccionados en la entrada de sesión.
- Las anulaciones de respaldo automáticas permanecen seleccionadas en turnos posteriores para que OpenClaw no sondee un primario conocido como defectuoso en cada mensaje. `/new`, `/reset` y `sessions.reset` borran las anulaciones de origen automático y devuelven la sesión al valor predeterminado configurado.
- `/status` muestra el modelo seleccionado y, cuando el estado de respaldo difiere, el modelo de respaldo activo y el motivo.
- La reconciliación de sesión en vivo prefiere las anulaciones de sesión persistidas frente a campos de modelo de tiempo de ejecución obsoletos.
- Si un error de cambio en vivo apunta a un candidato posterior en la cadena de respaldos activa, OpenClaw salta directamente a ese modelo seleccionado en lugar de recorrer primero candidatos no relacionados.
- Si el intento de respaldo falla, el ejecutor revierte solo los campos de anulación que escribió, y solo si todavía coinciden con ese candidato fallido.

Esto evita la carrera clásica:

<Steps>
  <Step title="El primario falla">
    El modelo primario seleccionado falla.
  </Step>
  <Step title="Respaldo elegido en memoria">
    El candidato de respaldo se elige en memoria.
  </Step>
  <Step title="El almacén de sesión todavía indica el primario anterior">
    El almacén de sesión todavía refleja el primario anterior.
  </Step>
  <Step title="La reconciliación en vivo lee estado obsoleto">
    La reconciliación de sesión en vivo lee el estado de sesión obsoleto.
  </Step>
  <Step title="El reintento vuelve atrás">
    El reintento vuelve al modelo anterior antes de que comience el intento de respaldo.
  </Step>
</Steps>

La anulación de respaldo persistida cierra esa ventana, y la reversión limitada mantiene intactos los cambios manuales o de sesión en tiempo de ejecución más recientes.

## Observabilidad y resúmenes de fallos

`runWithModelFallback(...)` registra detalles por intento que alimentan los registros y los mensajes de tiempos de espera orientados al usuario:

- proveedor/modelo intentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` y motivos similares de conmutación por error)
- estado/código opcional
- resumen de error legible para humanos

Los registros estructurados `model_fallback_decision` también incluyen campos planos `fallbackStep*` cuando un candidato falla, se omite o un respaldo posterior tiene éxito. Estos campos hacen explícita la transición intentada (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) para que los exportadores de registros y diagnósticos puedan reconstruir el fallo primario incluso cuando el respaldo terminal también falla.

Cuando todos los candidatos fallan, OpenClaw lanza `FallbackSummaryError`. El ejecutor de respuestas externo puede usarlo para construir un mensaje más específico, como "todos los modelos están temporalmente limitados por tasa", e incluir el vencimiento de tiempo de espera más cercano cuando se conozca.

Ese resumen de tiempo de espera tiene en cuenta el modelo:

- se ignoran los límites de tasa con alcance de modelo no relacionados para la cadena de proveedor/modelo intentada
- si el bloqueo restante es un límite de tasa con alcance de modelo coincidente, OpenClaw informa el último vencimiento coincidente que todavía bloquea ese modelo

## Configuración relacionada

Consulta [Configuración de Gateway](/es/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- enrutamiento de `agents.defaults.imageModel`

Consulta [Modelos](/es/concepts/models) para obtener la descripción general más amplia de la selección de modelos y respaldos.
