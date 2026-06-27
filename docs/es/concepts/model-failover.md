---
read_when:
    - Diagnóstico de rotación de perfiles de autenticación, periodos de espera o comportamiento de fallback de modelos
    - Actualización de las reglas de conmutación por error para perfiles de autenticación o modelos
    - Comprender cómo interactúan las anulaciones del modelo de sesión con los reintentos de respaldo
sidebarTitle: Model failover
summary: Cómo OpenClaw rota los perfiles de autenticación y recurre a modelos alternativos
title: Conmutación por error del modelo
x-i18n:
    generated_at: "2026-06-27T11:14:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7be9b2ee7c2c6de42d454248a51219c1917ce9a3a93630dad0af6f67ec030de3
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gestiona los fallos en dos etapas:

1. **Rotación del perfil de autenticación** dentro del proveedor actual.
2. **Fallback del modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

Este documento explica las reglas de ejecución y los datos que las respaldan.

## Flujo de ejecución

Para una ejecución de texto normal, OpenClaw evalúa los candidatos en este orden:

<Steps>
  <Step title="Resolver el estado de la sesión">
    Resuelve el modelo de sesión activo y la preferencia de perfil de autenticación.
  </Step>
  <Step title="Construir la cadena de candidatos">
    Construye la cadena de modelos candidatos a partir de la selección de modelo actual y la política de fallback para esa fuente de selección. Los valores predeterminados configurados, los modelos principales de trabajos cron y los modelos fallback seleccionados automáticamente pueden usar fallbacks configurados; las selecciones explícitas de sesión del usuario son estrictas.
  </Step>
  <Step title="Probar el proveedor actual">
    Prueba el proveedor actual con reglas de rotación/enfriamiento de perfiles de autenticación.
  </Step>
  <Step title="Avanzar ante errores que justifican conmutación por error">
    Si ese proveedor se agota con un error que justifica conmutación por error, pasa al siguiente modelo candidato.
  </Step>
  <Step title="Persistir la anulación de fallback">
    Persiste la anulación de fallback seleccionada antes de que comience el reintento para que otros lectores de la sesión vean el mismo proveedor/modelo que el runner está a punto de usar. La anulación de modelo persistida se marca como `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Revertir de forma limitada en caso de fallo">
    Si el candidato fallback falla, revierte solo los campos de anulación de sesión propiedad del fallback cuando aún coinciden con ese candidato fallido.
  </Step>
  <Step title="Lanzar FallbackSummaryError si se agota">
    Si todos los candidatos fallan, lanza un `FallbackSummaryError` con detalles por intento y el vencimiento de enfriamiento más próximo cuando se conoce.
  </Step>
</Steps>

Esto es intencionalmente más limitado que "guardar y restaurar toda la sesión". El runner de respuestas solo persiste los campos de selección de modelo que posee para fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Eso evita que un reintento de fallback fallido sobrescriba mutaciones de sesión no relacionadas y más recientes, como cambios manuales de `/model` o actualizaciones de rotación de sesión que ocurrieron mientras el intento se estaba ejecutando.

## Política de fuente de selección

OpenClaw separa el proveedor/modelo seleccionado del motivo por el que se seleccionó. Esa fuente controla si la cadena de fallback está permitida:

- **Valor predeterminado configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Modelo principal del agente**: `agents.list[].model` es estricto salvo que ese objeto de modelo del agente incluya sus propios `fallbacks`. Usa `fallbacks: []` para hacer explícito el comportamiento estricto, o proporciona una lista no vacía para habilitar el fallback de modelo para ese agente.
- **Anulación automática de fallback**: un fallback en ejecución escribe `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` y el modelo de origen seleccionado antes de reintentar. Esa anulación automática puede seguir recorriendo la cadena de fallback configurada sin sondear el principal en cada mensaje, pero OpenClaw sondea periódicamente de nuevo el origen configurado y borra la anulación automática cuando se recupera. `/new`, `/reset` y `sessions.reset` también borran las anulaciones de origen automático. Las ejecuciones de Heartbeat sin un `heartbeat.model` explícito borran anulaciones automáticas directas cuando su origen ya no coincide con el valor predeterminado configurado actual.
- **Anulación de sesión del usuario**: `/model`, el selector de modelo, `session_status(model=...)` y `sessions.patch` escriben `modelOverrideSource: "user"`. Eso es una selección exacta de sesión. Si el proveedor/modelo seleccionado falla antes de producir una respuesta, OpenClaw informa del fallo en lugar de responder desde un fallback configurado no relacionado.
- **Anulación de sesión heredada**: las entradas de sesión antiguas pueden tener `modelOverride` sin `modelOverrideSource`. OpenClaw las trata como anulaciones de usuario para que una selección antigua explícita no se convierta silenciosamente en comportamiento de fallback.
- **Modelo de carga útil de Cron**: un trabajo cron `payload.model` / `--model` es un principal del trabajo, no una anulación de sesión del usuario. Usa fallbacks configurados salvo que el trabajo proporcione `payload.fallbacks`; `payload.fallbacks: []` hace que la ejecución cron sea estricta.

El intervalo de sondeo del principal de fallback automático es de cinco minutos y no es configurable. OpenClaw recuerda los sondeos recientes por sesión y modelo principal para que un principal fallido no se reintente en cada turno. OpenClaw envía un aviso visible cuando una sesión pasa a fallback y otro aviso cuando vuelve al principal seleccionado; no repite el aviso en cada turno de fallback persistente.

## Caché de omisión por fallo de autenticación

De forma predeterminada, cada turno nuevo conserva el comportamiento existente de reintento de fallback: OpenClaw
volverá a probar cada candidato fallback configurado, incluidos los candidatos no principales
que fallaron recientemente con `auth` o `auth_permanent`.

Los operadores que prefieran suprimir esos fallos de autenticación repetidos pueden habilitarlo con:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Cuando está habilitado, OpenClaw registra un marcador de omisión en memoria y con alcance de sesión para un
candidato fallback no principal después de un fallo de clase de autenticación. El marcador se indexa
por id de sesión, proveedor y modelo. Los candidatos principales nunca se omiten, por lo que una
selección explícita de modelo del usuario sigue mostrando el error de autenticación real. La caché es
local al proceso y se borra al reiniciar Gateway.

El valor es un TTL en milisegundos. `0` o un valor no definido deshabilita la caché.
Los valores positivos se limitan entre 1 segundo y 10 minutos.

## Avisos de fallback visibles para el usuario

Cuando una sesión pasa a un fallback seleccionado automáticamente, OpenClaw envía un aviso de estado en la misma superficie de respuesta:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Cuando un sondeo posterior tiene éxito y la sesión vuelve al principal seleccionado, OpenClaw envía:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Estos avisos son mensajes operativos, no contenido del asistente. Se entregan una vez por cambio de estado, incluidos los turnos solo con efectos secundarios cuando sea factible, pero los turnos de fallback persistente no los repiten. La entrega omite la supresión normal de respuesta de origen, el aviso no consume el primer espacio de respuesta del asistente para canales con hilos y se excluye de texto a voz y de la extracción de compromisos.

## Almacenamiento de autenticación (claves + OAuth)

OpenClaw usa **perfiles de autenticación** tanto para claves de API como para tokens OAuth.

- Los secretos y el estado de enrutamiento de autenticación en ejecución viven en `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configuración `auth.profiles` / `auth.order` es **solo metadatos + enrutamiento** (sin secretos).
- Archivo OAuth heredado solo de importación: `~/.openclaw/credentials/oauth.json` (se importa al almacén de autenticación por agente en el primer uso).
- Los archivos heredados `auth-profiles.json`, `auth-state.json` y los archivos por agente `auth.json` se importan mediante `openclaw doctor --fix`.

Más detalle: [OAuth](/es/concepts/oauth)

Tipos de credenciales:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para algunos proveedores)

## IDs de perfil

Los inicios de sesión OAuth crean perfiles distintos para que puedan coexistir varias cuentas.

- Predeterminado: `provider:default` cuando no hay correo electrónico disponible.
- OAuth con correo electrónico: `provider:<email>` (por ejemplo `google-antigravity:user@gmail.com`).

Los perfiles viven en el almacén de perfiles de autenticación por agente `openclaw-agent.sqlite`.

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
    Entradas de perfiles de autenticación SQLite por agente para el proveedor.
  </Step>
</Steps>

Si no se configura ningún orden explícito, OpenClaw usa un orden round-robin:

- **Clave principal:** tipo de perfil (**OAuth antes que claves de API**).
- **Clave secundaria:** `usageStats.lastUsed` (los más antiguos primero, dentro de cada tipo).
- Los **perfiles en enfriamiento/deshabilitados** se mueven al final, ordenados por el vencimiento más próximo.

### Afinidad de sesión (favorable para caché)

OpenClaw **fija el perfil de autenticación elegido por sesión** para mantener calientes las cachés del proveedor. **No** rota en cada solicitud. El perfil fijado se reutiliza hasta que:

- se restablece la sesión (`/new` / `/reset`)
- se completa una Compaction (el contador de Compaction aumenta)
- el perfil está en enfriamiento/deshabilitado

La selección manual mediante `/model …@<profileId>` establece una **anulación de usuario** para esa sesión y no se rota automáticamente hasta que empieza una sesión nueva.

<Note>
Los perfiles fijados automáticamente (seleccionados por el enrutador de sesión) se tratan como una **preferencia**: se prueban primero, pero OpenClaw puede rotar a otro perfil ante límites de tasa/tiempos de espera. Cuando el perfil original vuelve a estar disponible, las nuevas ejecuciones pueden preferirlo de nuevo sin cambiar el modelo seleccionado ni el runtime. Los perfiles fijados por el usuario permanecen bloqueados a ese perfil; si falla y los fallbacks de modelo están configurados, OpenClaw pasa al siguiente modelo en lugar de cambiar de perfil.
</Note>

### Suscripción de OpenAI Codex más respaldo con clave de API

Para los modelos de agente de OpenAI, la autenticación y el runtime están separados. `openai/gpt-*` permanece en
el harness de Codex mientras la autenticación puede rotar entre un perfil de suscripción de Codex y
un respaldo con clave de API de OpenAI.

Usa `auth.order.openai` para el orden visible para el usuario:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Usa `openai:*` tanto para perfiles OAuth de ChatGPT/Codex como para perfiles con clave de API de OpenAI. Cuando la suscripción alcanza un límite de uso de Codex,
OpenClaw registra la hora exacta de restablecimiento cuando Codex proporciona una, prueba el siguiente
perfil de autenticación ordenado y mantiene la ejecución dentro del harness de Codex. Una vez que pasa la hora de restablecimiento,
el perfil de suscripción vuelve a ser elegible y la siguiente selección automática puede volver a él.

Usa un perfil fijado por el usuario solo cuando quieras forzar una cuenta/clave para esa
sesión. Los perfiles fijados por el usuario son intencionalmente estrictos y no saltan silenciosamente
a otro perfil.

## Enfriamientos

Cuando un perfil falla debido a errores de autenticación/límite de tasa (o un tiempo de espera que parece limitación de tasa), OpenClaw lo marca en enfriamiento y pasa al siguiente perfil.

<AccordionGroup>
  <Accordion title="Qué cae en el grupo de límite de tasa / tiempo de espera">
    Ese grupo de límite de tasa es más amplio que un simple `429`: también incluye mensajes de proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` y límites periódicos de ventana de uso como `weekly/monthly limit reached`.

    Los errores de formato/solicitud inválida suelen ser terminales porque reintentar la misma carga útil fallaría de la misma manera, por lo que OpenClaw los muestra en lugar de rotar perfiles de autenticación. Las rutas conocidas de reparación de reintentos pueden habilitarse explícitamente: por ejemplo, los fallos de validación de ID de llamada a herramienta de Cloud Code Assist se sanea y reintenta una vez mediante la política `allowFormatRetry`. Los errores de motivo de parada compatibles con OpenAI, como `Unhandled stop reason: error`, `stop reason: error` y `reason: error`, se clasifican como señales de tiempo de espera/conmutación por error.

    El texto genérico del servidor también puede caer en ese grupo de tiempo de espera cuando la fuente coincide con un patrón transitorio conocido. Por ejemplo, el mensaje simple del contenedor de flujo del runtime de modelo `An unknown error occurred` se trata como digno de conmutación por error para todos los proveedores porque el runtime de modelo compartido lo emite cuando los flujos del proveedor terminan con `stopReason: "aborted"` o `stopReason: "error"` sin detalles específicos. Las cargas útiles JSON `api_error` con texto transitorio del servidor como `internal server error`, `unknown error, 520`, `upstream error` o `backend error` también se tratan como tiempos de espera que justifican conmutación por error.

    El texto genérico ascendente específico de OpenRouter, como el simple `Provider returned error`, se trata como tiempo de espera solo cuando el contexto del proveedor es realmente OpenRouter. El texto genérico interno de fallback, como `LLM request failed with an unknown error.`, permanece conservador y no activa la conmutación por error por sí solo.

  </Accordion>
  <Accordion title="Límites de retry-after del SDK">
    Algunos SDK de proveedores podrían esperar durante una ventana larga de `Retry-After` antes de devolver el control a OpenClaw. Para SDK basados en Stainless, como Anthropic y OpenAI, OpenClaw limita por defecto las esperas internas del SDK `retry-after-ms` / `retry-after` a 60 segundos y expone inmediatamente las respuestas reintentables más largas para que esta ruta de conmutación por error pueda ejecutarse. Ajusta o desactiva el límite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulta [Comportamiento de reintento](/es/concepts/retry).
  </Accordion>
  <Accordion title="Enfriamientos por modelo">
    Los enfriamientos por límite de tasa también pueden tener alcance por modelo:

    - OpenClaw registra `cooldownModel` para fallos de límite de tasa cuando se conoce el id del modelo que falla.
    - Todavía se puede probar un modelo hermano en el mismo proveedor cuando el enfriamiento tiene alcance sobre un modelo distinto.
    - Las ventanas de facturación/deshabilitación siguen bloqueando todo el perfil en todos los modelos.

  </Accordion>
</AccordionGroup>

Los enfriamientos usan retroceso exponencial:

- 1 minuto
- 5 minutos
- 25 minutos
- 1 hora (límite)

El estado se almacena en el estado de autenticación SQLite por agente bajo `usageStats`:

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

Los fallos de facturación/crédito (por ejemplo, "insufficient credits" / "credit balance too low") se tratan como aptos para conmutación por error, pero normalmente no son transitorios. En lugar de un enfriamiento corto, OpenClaw marca el perfil como **deshabilitado** (con un retroceso más largo) y rota al siguiente perfil/proveedor.

<Note>
No todas las respuestas con forma de facturación son `402`, y no todos los HTTP `402` llegan aquí. OpenClaw mantiene el texto explícito de facturación en la ruta de facturación incluso cuando un proveedor devuelve `401` o `403`, pero los comparadores específicos del proveedor permanecen limitados al proveedor que los posee (por ejemplo, OpenRouter `403 Key limit exceeded`).

Mientras tanto, los errores temporales `402` de ventana de uso y de límite de gasto de organización/espacio de trabajo se clasifican como `rate_limit` cuando el mensaje parece reintentable (por ejemplo, `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` u `organization spending limit exceeded`). Esos permanecen en la ruta de enfriamiento corto/conmutación por error en lugar de la ruta larga de deshabilitación por facturación.
</Note>

El estado se almacena en el estado de autenticación SQLite por agente:

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

- El retroceso por facturación comienza en **5 horas**, se duplica por cada fallo de facturación y tiene un límite de **24 horas**.
- Los contadores de retroceso se restablecen si el perfil no ha fallado durante **24 horas** (configurable).
- Los reintentos por sobrecarga permiten **1 rotación de perfil del mismo proveedor** antes del fallback de modelo.
- Los reintentos por sobrecarga usan **0 ms de retroceso** de forma predeterminada.

## Fallback de modelo

Si todos los perfiles de un proveedor fallan, OpenClaw pasa al siguiente modelo en `agents.defaults.model.fallbacks`. Esto se aplica a fallos de autenticación, límites de tasa y tiempos de espera que agotaron la rotación de perfiles (otros errores no avanzan el fallback). Los errores de proveedor que no exponen suficiente detalle siguen etiquetándose con precisión en el estado de fallback: `empty_response` significa que el proveedor no devolvió ningún mensaje o estado utilizable, `no_error_details` significa que el proveedor devolvió explícitamente `Unknown error (no error details in response)`, y `unclassified` significa que OpenClaw conservó la vista previa sin procesar, pero ningún clasificador coincidió todavía.

Los errores de sobrecarga y límite de tasa se manejan de forma más agresiva que los enfriamientos de facturación. De forma predeterminada, OpenClaw permite un reintento de perfil de autenticación del mismo proveedor y luego cambia al siguiente fallback de modelo configurado sin esperar. Señales de proveedor ocupado como `ModelNotReadyException` entran en ese grupo de sobrecarga. Ajusta esto con `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` y `auth.cooldowns.rateLimitedProfileRotations`.

Cuando una ejecución comienza desde el primario predeterminado configurado, un primario de trabajo de Cron, un primario de agente con fallbacks explícitos o una anulación de fallback seleccionada automáticamente, OpenClaw puede recorrer la cadena de fallback configurada correspondiente. Los primarios de agente sin fallbacks explícitos y las selecciones explícitas de usuario (por ejemplo, `/model ollama/qwen3.5:27b`, el selector de modelo, `sessions.patch` o anulaciones puntuales de proveedor/modelo de la CLI) son estrictos: si ese proveedor/modelo no está disponible o falla antes de producir una respuesta, OpenClaw informa el fallo en lugar de responder desde un fallback no relacionado.

### Reglas de la cadena de candidatos

OpenClaw construye la lista de candidatos a partir del `provider/model` solicitado actualmente más los fallbacks configurados.

<AccordionGroup>
  <Accordion title="Reglas">
    - El modelo solicitado siempre va primero.
    - Los fallbacks configurados explícitamente se desduplican, pero no se filtran por la lista de modelos permitidos. Se tratan como intención explícita del operador.
    - Si la ejecución actual ya está en un fallback configurado en la misma familia de proveedores, OpenClaw sigue usando la cadena configurada completa.
    - Cuando no se proporciona ninguna anulación de fallback explícita, los fallbacks configurados se prueban antes del primario configurado incluso si el modelo solicitado usa un proveedor diferente.
    - Cuando no se proporciona ninguna anulación de fallback explícita al ejecutor de fallback, el primario configurado se agrega al final para que la cadena pueda volver al valor predeterminado normal una vez que se agoten los candidatos anteriores.
    - Cuando un llamador proporciona `fallbacksOverride`, el ejecutor usa exactamente el modelo solicitado más esa lista de anulación. Una lista vacía deshabilita el fallback de modelo e impide que el primario configurado se agregue como objetivo de reintento oculto.

  </Accordion>
</AccordionGroup>

### Qué errores avanzan el fallback

<Tabs>
  <Tab title="Continúa con">
    - fallos de autenticación
    - límites de tasa y agotamiento de enfriamiento
    - errores de sobrecarga/proveedor ocupado
    - errores de conmutación por error con forma de tiempo de espera
    - deshabilitaciones por facturación
    - `LiveSessionModelSwitchError`, que se normaliza en una ruta de conmutación por error para que un modelo persistido obsoleto no cree un bucle de reintento externo
    - otros errores no reconocidos cuando todavía quedan candidatos

  </Tab>
  <Tab title="No continúa con">
    - cancelaciones explícitas que no tienen forma de tiempo de espera/conmutación por error
    - errores de desbordamiento de contexto que deben permanecer dentro de la lógica de Compaction/reintento (por ejemplo, `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` u `ollama error: context length exceeded`)
    - un error desconocido final cuando no quedan candidatos

  </Tab>
</Tabs>

### Comportamiento de omisión de enfriamiento frente a sondeo

Cuando todos los perfiles de autenticación de un proveedor ya están en enfriamiento, OpenClaw no omite automáticamente ese proveedor para siempre. Toma una decisión por candidato:

<AccordionGroup>
  <Accordion title="Decisiones por candidato">
    - Los fallos persistentes de autenticación omiten todo el proveedor inmediatamente.
    - Las deshabilitaciones por facturación normalmente se omiten, pero el candidato primario todavía puede sondearse con una limitación para que la recuperación sea posible sin reiniciar.
    - El candidato primario puede sondearse cerca del vencimiento del enfriamiento, con una limitación por proveedor.
    - Los hermanos de fallback del mismo proveedor pueden intentarse a pesar del enfriamiento cuando el fallo parece transitorio (`rate_limit`, `overloaded` o desconocido). Esto es especialmente relevante cuando un límite de tasa tiene alcance por modelo y un modelo hermano todavía puede recuperarse inmediatamente.
    - Los sondeos de enfriamiento transitorio se limitan a uno por proveedor por ejecución de fallback para que un solo proveedor no bloquee el fallback entre proveedores.

  </Accordion>
</AccordionGroup>

## Anulaciones de sesión y cambio de modelo en vivo

Los cambios de modelo de sesión son estado compartido. El ejecutor activo, el comando `/model`, las actualizaciones de Compaction/sesión y la reconciliación de sesión en vivo leen o escriben partes de la misma entrada de sesión.

Eso significa que los reintentos de fallback tienen que coordinarse con el cambio de modelo en vivo:

- Solo los cambios de modelo explícitos impulsados por el usuario marcan un cambio en vivo pendiente. Eso incluye `/model`, `session_status(model=...)` y `sessions.patch`.
- Los cambios de modelo impulsados por el sistema, como la rotación de fallback, las anulaciones de Heartbeat o Compaction, nunca marcan por sí mismos un cambio en vivo pendiente.
- Las anulaciones de modelo impulsadas por el usuario se tratan como selecciones exactas para la política de fallback, por lo que un proveedor seleccionado no disponible se expone como un fallo en lugar de quedar enmascarado por `agents.defaults.model.fallbacks`.
- Antes de que comience un reintento de fallback, el ejecutor de respuesta persiste los campos de anulación de fallback seleccionados en la entrada de sesión.
- Las anulaciones de fallback automático permanecen seleccionadas en turnos posteriores para que OpenClaw no sondee un primario conocido como defectuoso en cada mensaje. OpenClaw sondea periódicamente de nuevo el origen configurado y borra la anulación automática cuando se recupera; `/new`, `/reset` y `sessions.reset` borran inmediatamente las anulaciones de origen automático.
- Las respuestas de usuario anuncian las transiciones de fallback y la recuperación por borrado de fallback una vez por cambio de estado. Los turnos de fallback persistente no repiten el aviso.
- `/status` muestra el modelo seleccionado y, cuando el estado de fallback difiere, el modelo de fallback activo y el motivo.
- La reconciliación de sesión en vivo prefiere las anulaciones de sesión persistidas sobre campos de modelo de tiempo de ejecución obsoletos.
- Si un error de cambio en vivo apunta a un candidato posterior en la cadena de fallback activa, OpenClaw salta directamente a ese modelo seleccionado en lugar de recorrer primero candidatos no relacionados.
- Si el intento de fallback falla, el ejecutor revierte solo los campos de anulación que escribió, y solo si todavía coinciden con ese candidato fallido.

Esto evita la carrera clásica:

<Steps>
  <Step title="El primario falla">
    El modelo primario seleccionado falla.
  </Step>
  <Step title="Fallback elegido en memoria">
    El candidato de fallback se elige en memoria.
  </Step>
  <Step title="El almacén de sesión aún indica el primario anterior">
    El almacén de sesión todavía refleja el primario anterior.
  </Step>
  <Step title="La reconciliación en vivo lee estado obsoleto">
    La reconciliación de sesión en vivo lee el estado de sesión obsoleto.
  </Step>
  <Step title="El reintento vuelve atrás">
    El reintento vuelve al modelo anterior antes de que comience el intento de fallback.
  </Step>
</Steps>

La anulación de fallback persistida cierra esa ventana, y la reversión estrecha mantiene intactos los cambios de sesión manuales o de tiempo de ejecución más recientes.

## Observabilidad y resúmenes de fallo

`runWithModelFallback(...)` registra detalles por intento que alimentan los registros y la mensajería de enfriamiento visible para el usuario:

- proveedor/modelo intentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` y motivos similares de conmutación por error)
- estado/código opcional
- resumen de error legible por humanos

Los registros estructurados `model_fallback_decision` también incluyen campos planos `fallbackStep*` cuando un candidato falla, se omite o un fallback posterior tiene éxito. Estos campos hacen explícita la transición intentada (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) para que los exportadores de registros y diagnósticos puedan reconstruir el fallo primario incluso cuando el fallback terminal también falla.

Cuando todos los candidatos fallan, OpenClaw lanza `FallbackSummaryError`. El ejecutor de respuesta externo puede usarlo para construir un mensaje más específico, como "todos los modelos tienen límites de tasa temporales", e incluir el vencimiento de enfriamiento más cercano cuando se conoce alguno.

Ese resumen de enfriamiento tiene en cuenta el modelo:

- se ignoran los límites de tasa con alcance por modelo no relacionados para la cadena de proveedor/modelo intentada
- si el bloqueo restante es un límite de tasa con alcance por modelo coincidente, OpenClaw informa el último vencimiento coincidente que todavía bloquea ese modelo

## Configuración relacionada

Consulta [Configuración de Gateway](/es/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- enrutamiento de `agents.defaults.imageModel`

Consulta [Modelos](/es/concepts/models) para obtener una descripción general más amplia de la selección de modelos y la reserva.
