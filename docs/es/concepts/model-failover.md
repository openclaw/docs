---
read_when:
    - Diagnóstico de la rotación de perfiles de autenticación, los periodos de espera o el comportamiento de respaldo del modelo
    - Actualizar las reglas de conmutación por error para perfiles de autenticación o modelos
    - Comprender cómo las anulaciones del modelo de sesión interactúan con los reintentos de respaldo
sidebarTitle: Model failover
summary: Cómo OpenClaw rota los perfiles de autenticación y recurre a alternativas entre modelos
title: Conmutación por error del modelo
x-i18n:
    generated_at: "2026-05-11T20:30:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gestiona los fallos en dos etapas:

1. **Rotación de perfiles de autenticación** dentro del proveedor actual.
2. **Respaldo de modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

Este documento explica las reglas de runtime y los datos que las respaldan.

## Flujo de runtime

Para una ejecución de texto normal, OpenClaw evalúa los candidatos en este orden:

<Steps>
  <Step title="Resolver el estado de la sesión">
    Resuelve el modelo de sesión activo y la preferencia de perfil de autenticación.
  </Step>
  <Step title="Construir la cadena de candidatos">
    Construye la cadena de modelos candidatos a partir de la selección de modelo actual y la política de respaldo para el origen de esa selección. Los valores predeterminados configurados, los modelos principales de tareas cron y los modelos de respaldo seleccionados automáticamente pueden usar respaldos configurados; las selecciones explícitas de sesión del usuario son estrictas.
  </Step>
  <Step title="Probar el proveedor actual">
    Prueba el proveedor actual con reglas de rotación/enfriamiento de perfiles de autenticación.
  </Step>
  <Step title="Avanzar ante errores que justifican conmutación por error">
    Si ese proveedor se agota con un error que justifica conmutación por error, pasa al siguiente modelo candidato.
  </Step>
  <Step title="Persistir la anulación de respaldo">
    Persiste la anulación de respaldo seleccionada antes de que empiece el reintento para que otros lectores de la sesión vean el mismo proveedor/modelo que el runner está a punto de usar. La anulación de modelo persistida se marca como `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Revertir de forma acotada ante fallo">
    Si el candidato de respaldo falla, revierte solo los campos de anulación de sesión propiedad del respaldo cuando todavía coinciden con ese candidato fallido.
  </Step>
  <Step title="Lanzar FallbackSummaryError si se agotan">
    Si todos los candidatos fallan, lanza un `FallbackSummaryError` con detalles por intento y el vencimiento de enfriamiento más próximo cuando se conoce.
  </Step>
</Steps>

Esto es intencionalmente más acotado que "guardar y restaurar toda la sesión". El runner de respuestas solo persiste los campos de selección de modelo que posee para el respaldo:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Eso evita que un reintento de respaldo fallido sobrescriba mutaciones de sesión nuevas y no relacionadas, como cambios manuales de `/model` o actualizaciones de rotación de sesión que ocurrieron mientras el intento estaba en ejecución.

## Política de origen de selección

OpenClaw separa el proveedor/modelo seleccionado del motivo por el que se seleccionó. Ese origen controla si se permite la cadena de respaldo:

- **Valor predeterminado configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Modelo principal del agente**: `agents.list[].model` es estricto a menos que ese objeto de modelo del agente incluya sus propios `fallbacks`. Usa `fallbacks: []` para explicitar el comportamiento estricto, o proporciona una lista no vacía para habilitar el respaldo de modelo en ese agente.
- **Anulación de respaldo automática**: un respaldo en runtime escribe `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` y el modelo de origen seleccionado antes de reintentar. Esa anulación automática puede seguir recorriendo la cadena de respaldo configurada y se borra con `/new`, `/reset` y `sessions.reset`. Las ejecuciones de Heartbeat sin un `heartbeat.model` explícito también borran una anulación automática directa cuando su origen ya no coincide con el valor predeterminado configurado actual.
- **Anulación de sesión del usuario**: `/model`, el selector de modelos, `session_status(model=...)` y `sessions.patch` escriben `modelOverrideSource: "user"`. Eso es una selección exacta de sesión. Si el proveedor/modelo seleccionado falla antes de producir una respuesta, OpenClaw informa el fallo en lugar de responder desde un respaldo configurado no relacionado.
- **Anulación de sesión heredada**: las entradas de sesión antiguas pueden tener `modelOverride` sin `modelOverrideSource`. OpenClaw las trata como anulaciones de usuario para que una selección antigua explícita no se convierta silenciosamente en comportamiento de respaldo.
- **Modelo de carga útil de Cron**: un trabajo cron `payload.model` / `--model` es un modelo principal del trabajo, no una anulación de sesión del usuario. Usa respaldos configurados a menos que el trabajo proporcione `payload.fallbacks`; `payload.fallbacks: []` hace que la ejecución cron sea estricta.

## Almacenamiento de autenticación (claves + OAuth)

OpenClaw usa **perfiles de autenticación** tanto para claves de API como para tokens OAuth.

- Los secretos viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (heredado: `~/.openclaw/agent/auth-profiles.json`).
- El estado de enrutamiento de autenticación en runtime vive en `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configuración `auth.profiles` / `auth.order` son **solo metadatos + enrutamiento** (sin secretos).
- Archivo OAuth heredado solo para importación: `~/.openclaw/credentials/oauth.json` (importado en `auth-profiles.json` en el primer uso).

Más detalle: [OAuth](/es/concepts/oauth)

Tipos de credenciales:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para algunos proveedores)

## ID de perfiles

Los inicios de sesión OAuth crean perfiles distintos para que varias cuentas puedan coexistir.

- Predeterminado: `provider:default` cuando no hay correo electrónico disponible.
- OAuth con correo electrónico: `provider:<email>` (por ejemplo `google-antigravity:user@gmail.com`).

Los perfiles viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` bajo `profiles`.

## Orden de rotación

Cuando un proveedor tiene varios perfiles, OpenClaw elige un orden así:

<Steps>
  <Step title="Configuración explícita">
    `auth.order[provider]` (si está definido).
  </Step>
  <Step title="Perfiles configurados">
    `auth.profiles` filtrado por proveedor.
  </Step>
  <Step title="Perfiles almacenados">
    Entradas en `auth-profiles.json` para el proveedor.
  </Step>
</Steps>

Si no se configura ningún orden explícito, OpenClaw usa un orden round-robin:

- **Clave principal:** tipo de perfil (**OAuth antes que claves de API**).
- **Clave secundaria:** `usageStats.lastUsed` (los más antiguos primero, dentro de cada tipo).
- **Perfiles en enfriamiento/deshabilitados** se mueven al final, ordenados por el vencimiento más próximo.

### Persistencia de sesión (compatible con caché)

OpenClaw **fija el perfil de autenticación elegido por sesión** para mantener calientes las cachés del proveedor. **No** rota en cada solicitud. El perfil fijado se reutiliza hasta que:

- se restablece la sesión (`/new` / `/reset`)
- se completa una compaction (el contador de compaction aumenta)
- el perfil está en enfriamiento/deshabilitado

La selección manual mediante `/model …@<profileId>` establece una **anulación de usuario** para esa sesión y no se rota automáticamente hasta que empieza una nueva sesión.

<Note>
Los perfiles fijados automáticamente (seleccionados por el router de sesión) se tratan como una **preferencia**: se prueban primero, pero OpenClaw puede rotar a otro perfil ante límites de tasa/tiempos de espera. Cuando el perfil original vuelve a estar disponible, las nuevas ejecuciones pueden volver a preferirlo sin cambiar el modelo seleccionado ni el runtime. Los perfiles fijados por el usuario permanecen bloqueados a ese perfil; si falla y hay respaldos de modelo configurados, OpenClaw pasa al siguiente modelo en lugar de cambiar de perfil.
</Note>

### Suscripción de OpenAI Codex más respaldo con clave de API

Para los modelos de agente de OpenAI, la autenticación y el runtime están separados. `openai/gpt-*` permanece en
el arnés de Codex mientras la autenticación puede rotar entre un perfil de suscripción de Codex y
un respaldo de clave de API de OpenAI.

Usa `auth.order.openai` para el orden visible para el usuario:

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Los perfiles de suscripción de Codex existentes todavía pueden usar el id de perfil heredado
`openai-codex:*`. El respaldo de clave de API ordenado puede ser un perfil de clave de API
`openai:*` normal. Cuando la suscripción alcanza un límite de uso de Codex,
OpenClaw registra la hora exacta de restablecimiento cuando Codex proporciona una, prueba el siguiente
perfil de autenticación ordenado y mantiene la ejecución dentro del arnés de Codex. Una vez que pasa la hora
de restablecimiento, el perfil de suscripción vuelve a ser elegible y la siguiente selección automática
puede volver a él.

Usa un perfil fijado por el usuario solo cuando quieras forzar una cuenta/clave para esa
sesión. Los perfiles fijados por el usuario son intencionalmente estrictos y no saltan silenciosamente
a otro perfil.

## Enfriamientos

Cuando un perfil falla por errores de autenticación/límite de tasa (o un tiempo de espera que parece limitación de tasa), OpenClaw lo marca en enfriamiento y pasa al siguiente perfil.

<AccordionGroup>
  <Accordion title="Qué entra en el grupo de límite de tasa / tiempo de espera">
    Ese grupo de límite de tasa es más amplio que un `429` simple: también incluye mensajes de proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` y límites periódicos de ventana de uso como `weekly/monthly limit reached`.

    Los errores de formato/solicitud inválida suelen ser terminales porque reintentar la misma carga útil fallaría de la misma manera, así que OpenClaw los muestra en lugar de rotar perfiles de autenticación. Las rutas conocidas de reparación por reintento pueden habilitarse explícitamente: por ejemplo, los fallos de validación de ID de llamada de herramienta de Cloud Code Assist se saneaban y se reintentaban una vez mediante la política `allowFormatRetry`. Los errores de motivo de detención compatibles con OpenAI, como `Unhandled stop reason: error`, `stop reason: error` y `reason: error`, se clasifican como señales de tiempo de espera/conmutación por error.

    El texto genérico del servidor también puede entrar en ese grupo de tiempo de espera cuando el origen coincide con un patrón transitorio conocido. Por ejemplo, el mensaje simple del envoltorio de streaming de pi-ai `An unknown error occurred` se trata como apto para conmutación por error para todos los proveedores porque pi-ai lo emite cuando los streams del proveedor terminan con `stopReason: "aborted"` o `stopReason: "error"` sin detalles específicos. Las cargas útiles JSON `api_error` con texto transitorio de servidor como `internal server error`, `unknown error, 520`, `upstream error` o `backend error` también se tratan como tiempos de espera aptos para conmutación por error.

    El texto genérico ascendente específico de OpenRouter, como `Provider returned error` sin más, se trata como tiempo de espera solo cuando el contexto del proveedor es realmente OpenRouter. El texto genérico interno de respaldo, como `LLM request failed with an unknown error.`, permanece conservador y no activa la conmutación por error por sí solo.

  </Accordion>
  <Accordion title="Topes de retry-after del SDK">
    Algunos SDK de proveedores podrían dormir durante una ventana larga de `Retry-After` antes de devolver el control a OpenClaw. Para SDK basados en Stainless, como Anthropic y OpenAI, OpenClaw limita por defecto las esperas internas del SDK `retry-after-ms` / `retry-after` a 60 segundos y muestra de inmediato respuestas reintentables más largas para que esta ruta de conmutación por error pueda ejecutarse. Ajusta o deshabilita el tope con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulta [Comportamiento de reintentos](/es/concepts/retry).
  </Accordion>
  <Accordion title="Enfriamientos por modelo">
    Los enfriamientos por límite de tasa también pueden estar acotados a un modelo:

    - OpenClaw registra `cooldownModel` para fallos de límite de tasa cuando se conoce el id del modelo que falla.
    - Un modelo hermano en el mismo proveedor todavía puede probarse cuando el enfriamiento está acotado a un modelo diferente.
    - Las ventanas de facturación/deshabilitación siguen bloqueando todo el perfil entre modelos.

  </Accordion>
</AccordionGroup>

Los enfriamientos usan retroceso exponencial:

- 1 minuto
- 5 minutos
- 25 minutos
- 1 hora (tope)

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

Los fallos de facturación/crédito (por ejemplo "insufficient credits" / "credit balance too low") se tratan como aptos para conmutación por error, pero normalmente no son transitorios. En lugar de un enfriamiento corto, OpenClaw marca el perfil como **deshabilitado** (con un retroceso más largo) y rota al siguiente perfil/proveedor.

<Note>
No todas las respuestas con forma de facturación son `402`, y no todos los HTTP `402` llegan aquí. OpenClaw mantiene el texto explícito de facturación en la vía de facturación incluso cuando un proveedor devuelve `401` o `403` en su lugar, pero los comparadores específicos del proveedor permanecen acotados al proveedor que los posee (por ejemplo, OpenRouter `403 Key limit exceeded`).

Mientras tanto, los errores temporales `402` de ventana de uso y de límite de gasto de organización/espacio de trabajo se clasifican como `rate_limit` cuando el mensaje parece reintentable (por ejemplo, `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` u `organization spending limit exceeded`). Esos permanecen en la ruta breve de enfriamiento/conmutación por error en lugar de la ruta larga de desactivación por facturación.
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

- El backoff de facturación comienza en **5 horas**, se duplica con cada fallo de facturación y tiene un límite de **24 horas**.
- Los contadores de backoff se restablecen si el perfil no ha fallado durante **24 horas** (configurable).
- Los reintentos por sobrecarga permiten **1 rotación de perfil del mismo proveedor** antes del respaldo de modelo.
- Los reintentos por sobrecarga usan **0 ms de backoff** de forma predeterminada.

## Respaldo de modelo

Si todos los perfiles de un proveedor fallan, OpenClaw pasa al siguiente modelo en `agents.defaults.model.fallbacks`. Esto se aplica a fallos de autenticación, límites de tasa y tiempos de espera que agotaron la rotación de perfiles (otros errores no avanzan el respaldo). Los errores de proveedor que no exponen suficiente detalle aún se etiquetan con precisión en el estado de respaldo: `empty_response` significa que el proveedor no devolvió ningún mensaje o estado utilizable, `no_error_details` significa que el proveedor devolvió explícitamente `Unknown error (no error details in response)`, y `unclassified` significa que OpenClaw conservó la vista previa sin procesar, pero ningún clasificador coincidió aún.

Los errores de sobrecarga y límite de tasa se manejan de forma más agresiva que los enfriamientos por facturación. De forma predeterminada, OpenClaw permite un reintento de perfil de autenticación del mismo proveedor y luego cambia al siguiente respaldo de modelo configurado sin esperar. Las señales de proveedor ocupado, como `ModelNotReadyException`, caen en ese grupo de sobrecarga. Ajusta esto con `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` y `auth.cooldowns.rateLimitedProfileRotations`.

Cuando una ejecución parte del primario predeterminado configurado, un primario de tarea cron, un primario de agente con respaldos explícitos o una anulación de respaldo seleccionada automáticamente, OpenClaw puede recorrer la cadena de respaldo configurada correspondiente. Los primarios de agente sin respaldos explícitos y las selecciones explícitas de usuario (por ejemplo, `/model ollama/qwen3.5:27b`, el selector de modelo, `sessions.patch` o anulaciones puntuales de proveedor/modelo de CLI) son estrictos: si ese proveedor/modelo no está disponible o falla antes de producir una respuesta, OpenClaw informa el fallo en lugar de responder desde un respaldo no relacionado.

### Reglas de la cadena de candidatos

OpenClaw construye la lista de candidatos a partir del `provider/model` solicitado actualmente más los respaldos configurados.

<AccordionGroup>
  <Accordion title="Rules">
    - El modelo solicitado siempre va primero.
    - Los respaldos configurados explícitos se deduplican, pero no se filtran por la lista de permitidos del modelo. Se tratan como intención explícita del operador.
    - Si la ejecución actual ya está en un respaldo configurado de la misma familia de proveedores, OpenClaw sigue usando la cadena configurada completa.
    - Cuando no se proporciona una anulación de respaldo explícita, los respaldos configurados se prueban antes del primario configurado, incluso si el modelo solicitado usa un proveedor diferente.
    - Cuando no se proporciona una anulación de respaldo explícita al ejecutor de respaldos, el primario configurado se agrega al final para que la cadena pueda volver al valor predeterminado normal una vez que se agoten los candidatos anteriores.
    - Cuando un llamador proporciona `fallbacksOverride`, el ejecutor usa exactamente el modelo solicitado más esa lista de anulaciones. Una lista vacía desactiva el respaldo de modelo e impide que el primario configurado se agregue como objetivo de reintento oculto.

  </Accordion>
</AccordionGroup>

### Qué errores avanzan el respaldo

<Tabs>
  <Tab title="Continues on">
    - fallos de autenticación
    - límites de tasa y agotamiento de enfriamientos
    - errores de sobrecarga/proveedor ocupado
    - errores de conmutación por error con forma de tiempo de espera
    - desactivaciones por facturación
    - `LiveSessionModelSwitchError`, que se normaliza en una ruta de conmutación por error para que un modelo persistido obsoleto no cree un bucle de reintentos externo
    - otros errores no reconocidos cuando aún quedan candidatos

  </Tab>
  <Tab title="Does not continue on">
    - cancelaciones explícitas que no tienen forma de tiempo de espera/conmutación por error
    - errores de desbordamiento de contexto que deben permanecer dentro de la lógica de Compaction/reintento (por ejemplo, `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` u `ollama error: context length exceeded`)
    - un error desconocido final cuando no quedan candidatos

  </Tab>
</Tabs>

### Omisión de enfriamiento frente a comportamiento de sondeo

Cuando todos los perfiles de autenticación de un proveedor ya están en enfriamiento, OpenClaw no omite automáticamente ese proveedor para siempre. Toma una decisión por candidato:

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - Los fallos de autenticación persistentes omiten todo el proveedor de inmediato.
    - Las desactivaciones por facturación normalmente se omiten, pero el candidato primario aún puede sondearse con limitación para que la recuperación sea posible sin reiniciar.
    - El candidato primario puede sondearse cerca del vencimiento del enfriamiento, con una limitación por proveedor.
    - Los respaldos hermanos del mismo proveedor pueden intentarse a pesar del enfriamiento cuando el fallo parece transitorio (`rate_limit`, `overloaded` o desconocido). Esto es especialmente relevante cuando un límite de tasa está acotado al modelo y un modelo hermano aún podría recuperarse de inmediato.
    - Los sondeos de enfriamiento transitorio se limitan a uno por proveedor por ejecución de respaldo para que un solo proveedor no bloquee el respaldo entre proveedores.

  </Accordion>
</AccordionGroup>

## Anulaciones de sesión y cambio de modelo en vivo

Los cambios de modelo de sesión son estado compartido. El ejecutor activo, el comando `/model`, las actualizaciones de Compaction/sesión y la reconciliación de sesión en vivo leen o escriben partes de la misma entrada de sesión.

Eso significa que los reintentos de respaldo deben coordinarse con el cambio de modelo en vivo:

- Solo los cambios de modelo explícitos impulsados por el usuario marcan un cambio en vivo pendiente. Esto incluye `/model`, `session_status(model=...)` y `sessions.patch`.
- Los cambios de modelo impulsados por el sistema, como la rotación de respaldo, las anulaciones de Heartbeat o Compaction, nunca marcan por sí solos un cambio en vivo pendiente.
- Las anulaciones de modelo impulsadas por el usuario se tratan como selecciones exactas para la política de respaldo, por lo que un proveedor seleccionado que no está disponible aparece como fallo en lugar de quedar oculto por `agents.defaults.model.fallbacks`.
- Antes de que comience un reintento de respaldo, el ejecutor de respuestas persiste los campos de anulación de respaldo seleccionados en la entrada de sesión.
- Las anulaciones de respaldo automáticas permanecen seleccionadas en turnos posteriores para que OpenClaw no sondee un primario conocido como defectuoso en cada mensaje. `/new`, `/reset` y `sessions.reset` borran las anulaciones de origen automático y devuelven la sesión al valor predeterminado configurado.
- `/status` muestra el modelo seleccionado y, cuando el estado de respaldo difiere, el modelo de respaldo activo y el motivo.
- La reconciliación de sesión en vivo prefiere las anulaciones de sesión persistidas frente a campos de modelo en tiempo de ejecución obsoletos.
- Si un error de cambio en vivo apunta a un candidato posterior en la cadena de respaldo activa, OpenClaw salta directamente a ese modelo seleccionado en lugar de recorrer primero candidatos no relacionados.
- Si el intento de respaldo falla, el ejecutor revierte solo los campos de anulación que escribió, y solo si aún coinciden con ese candidato fallido.

Esto evita la carrera clásica:

<Steps>
  <Step title="Primary fails">
    El modelo primario seleccionado falla.
  </Step>
  <Step title="Fallback chosen in memory">
    El candidato de respaldo se elige en memoria.
  </Step>
  <Step title="Session store still says old primary">
    El almacén de sesiones aún refleja el primario anterior.
  </Step>
  <Step title="Live reconciliation reads stale state">
    La reconciliación de sesión en vivo lee el estado de sesión obsoleto.
  </Step>
  <Step title="Retry snapped back">
    El reintento vuelve al modelo anterior antes de que comience el intento de respaldo.
  </Step>
</Steps>

La anulación de respaldo persistida cierra esa ventana, y la reversión estrecha mantiene intactos los cambios de sesión manuales o de tiempo de ejecución más recientes.

## Observabilidad y resúmenes de fallo

`runWithModelFallback(...)` registra detalles por intento que alimentan los registros y los mensajes de enfriamiento visibles para el usuario:

- proveedor/modelo intentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` y motivos de conmutación por error similares)
- estado/código opcional
- resumen de error legible para humanos

Los registros estructurados `model_fallback_decision` también incluyen campos planos `fallbackStep*` cuando un candidato falla, se omite o un respaldo posterior tiene éxito. Estos campos hacen explícita la transición intentada (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) para que los exportadores de registros y diagnósticos puedan reconstruir el fallo primario incluso cuando el respaldo terminal también falla.

Cuando todos los candidatos fallan, OpenClaw lanza `FallbackSummaryError`. El ejecutor de respuestas externo puede usarlo para construir un mensaje más específico, como "todos los modelos tienen límites de tasa temporales", e incluir el vencimiento de enfriamiento más próximo cuando se conoce.

Ese resumen de enfriamiento tiene en cuenta el modelo:

- los límites de tasa acotados a modelos no relacionados se ignoran para la cadena de proveedor/modelo intentada
- si el bloqueo restante es un límite de tasa acotado al modelo que coincide, OpenClaw informa el último vencimiento coincidente que aún bloquea ese modelo

## Configuración relacionada

Consulta [Configuración de Gateway](/es/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- enrutamiento de `agents.defaults.imageModel`

Consulta [Modelos](/es/concepts/models) para obtener la descripción general más amplia de la selección de modelos y el respaldo.
