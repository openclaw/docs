---
read_when:
    - Diagnóstico de la rotación de perfiles de autenticación, los tiempos de espera o el comportamiento de fallback de modelos
    - Actualizando las reglas de conmutación por error para perfiles de autenticación o modelos
    - Comprender cómo interactúan las anulaciones del modelo de sesión con los reintentos de fallback
sidebarTitle: Model failover
summary: Cómo OpenClaw rota perfiles de autenticación y recurre a modelos alternativos
title: Conmutación por error de modelos
x-i18n:
    generated_at: "2026-07-04T15:07:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1521e27c53029ead305f29b7a29b627b519adbd28ed30688c01f32542625855f
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gestiona los fallos en dos etapas:

1. **Rotación de perfiles de autenticación** dentro del proveedor actual.
2. **Reserva de modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

Este documento explica las reglas de runtime y los datos que las respaldan.

## Flujo de runtime

Para una ejecución normal de texto, OpenClaw evalúa los candidatos en este orden:

<Steps>
  <Step title="Resolve session state">
    Resuelve el modelo de sesión activo y la preferencia de perfil de autenticación.
  </Step>
  <Step title="Build candidate chain">
    Construye la cadena de candidatos de modelo a partir de la selección de modelo actual y la política de reserva para esa fuente de selección. Los valores predeterminados configurados, los modelos primarios de trabajos cron y los modelos de reserva seleccionados automáticamente pueden usar reservas configuradas; las selecciones explícitas de sesión del usuario son estrictas.
  </Step>
  <Step title="Try the current provider">
    Prueba el proveedor actual con reglas de rotación/enfriamiento de perfiles de autenticación.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Si ese proveedor se agota con un error que justifica conmutación por error, pasa al siguiente candidato de modelo.
  </Step>
  <Step title="Persist fallback override">
    Persiste la anulación de reserva seleccionada antes de que empiece el reintento, para que otros lectores de la sesión vean el mismo proveedor/modelo que el ejecutor está a punto de usar. La anulación de modelo persistida se marca como `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Si el candidato de reserva falla, revierte solo los campos de anulación de sesión propiedad de la reserva cuando aún coinciden con ese candidato fallido.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Si todos los candidatos fallan, lanza un `FallbackSummaryError` con detalles por intento y el vencimiento de enfriamiento más próximo cuando se conozca.
  </Step>
</Steps>

Esto es intencionalmente más limitado que "guardar y restaurar toda la sesión". El ejecutor de respuestas solo persiste los campos de selección de modelo que posee para la reserva:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Eso evita que un reintento de reserva fallido sobrescriba mutaciones de sesión más recientes y no relacionadas, como cambios manuales de `/model` o actualizaciones de rotación de sesión que ocurrieron mientras el intento estaba en curso.

## Política de fuente de selección

OpenClaw separa el proveedor/modelo seleccionado del motivo por el que se seleccionó. Esa fuente controla si se permite la cadena de reserva:

- **Valor predeterminado configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Modelo primario del agente**: `agents.list[].model` es estricto salvo que ese objeto de modelo de agente incluya sus propios `fallbacks`. Usa `fallbacks: []` para hacer explícito el comportamiento estricto, o proporciona una lista no vacía para habilitar la reserva de modelo para ese agente.
- **Anulación automática de reserva**: una reserva de runtime escribe `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` y el modelo de origen seleccionado antes de reintentar. Esa anulación automática puede seguir recorriendo la cadena de reserva configurada sin probar el primario en cada mensaje, pero OpenClaw prueba periódicamente el origen configurado otra vez y borra la anulación automática cuando se recupera. `/new`, `/reset` y `sessions.reset` también borran las anulaciones con origen automático. Las ejecuciones de Heartbeat sin un `heartbeat.model` explícito borran las anulaciones automáticas directas cuando su origen ya no coincide con el valor predeterminado configurado actual.
- **Anulación de sesión del usuario**: `/model`, el selector de modelo, `session_status(model=...)` y `sessions.patch` escriben `modelOverrideSource: "user"`. Esa es una selección exacta de sesión. Si el proveedor/modelo seleccionado falla antes de producir una respuesta, OpenClaw informa el fallo en lugar de responder desde una reserva configurada no relacionada.
- **Anulación de sesión heredada**: las entradas de sesión antiguas pueden tener `modelOverride` sin `modelOverrideSource`. OpenClaw las trata como anulaciones de usuario para que una selección antigua explícita no se convierta silenciosamente en comportamiento de reserva.
- **Modelo de carga útil de Cron**: un trabajo cron `payload.model` / `--model` es un primario de trabajo, no una anulación de sesión del usuario. Usa reservas configuradas salvo que el trabajo proporcione `payload.fallbacks`; `payload.fallbacks: []` hace que la ejecución cron sea estricta.

El intervalo de prueba del primario para la reserva automática es de cinco minutos y no es configurable. OpenClaw recuerda las pruebas recientes por sesión y modelo primario para que un primario con fallos no se reintente en cada turno. OpenClaw envía un aviso visible cuando una sesión pasa a una reserva y otro aviso cuando vuelve al primario seleccionado; no repite el aviso en cada turno de reserva persistente.

## Caché de omisión por fallo de autenticación

De forma predeterminada, cada turno nuevo mantiene el comportamiento existente de reintento de reserva: OpenClaw
intentará de nuevo cada candidato de reserva configurado, incluidos los candidatos no primarios
que fallaron recientemente con `auth` o `auth_permanent`.

Los operadores que prefieren suprimir esos fallos de autenticación repetidos pueden habilitarlo con:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Cuando está habilitado, OpenClaw registra un marcador de omisión en memoria, con alcance de sesión, para un
candidato de reserva no primario después de un fallo de clase de autenticación. El marcador se indexa
por id de sesión, proveedor y modelo. Los candidatos primarios nunca se omiten, por lo que una
selección explícita de modelo de usuario aún expone el error de autenticación real. La caché es
local del proceso y se borra al reiniciar el Gateway.

El valor es un TTL en milisegundos. `0` o un valor sin definir deshabilita la caché.
Los valores positivos se limitan entre 1 segundo y 10 minutos.

## Avisos de reserva visibles para el usuario

Cuando una sesión pasa a una reserva seleccionada automáticamente, OpenClaw envía un aviso de estado en la misma superficie de respuesta:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Cuando una prueba posterior tiene éxito y la sesión vuelve al primario seleccionado, OpenClaw envía:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Estos avisos son mensajes operativos, no contenido del asistente. Se entregan una vez por cambio de estado, incluidos turnos solo con efectos secundarios cuando sea viable, pero los turnos de reserva persistente no los repiten. La entrega omite la supresión normal de respuesta de origen, el aviso no consume el primer espacio de respuesta del asistente para canales con hilos y se excluye de la conversión de texto a voz y de la extracción de compromisos.

## Almacenamiento de autenticación (claves + OAuth)

OpenClaw usa **perfiles de autenticación** tanto para claves de API como para tokens OAuth.

- Los secretos y el estado de enrutamiento de autenticación de runtime viven en `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configuración `auth.profiles` / `auth.order` es **solo metadatos + enrutamiento** (sin secretos).
- Archivo OAuth heredado solo de importación: `~/.openclaw/credentials/oauth.json` (importado al almacén de autenticación por agente en el primer uso).
- Los archivos heredados `auth-profiles.json`, `auth-state.json` y `auth.json` por agente se importan mediante `openclaw doctor --fix`.

Más detalle: [OAuth](/es/concepts/oauth)

Tipos de credenciales:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para algunos proveedores)

## ID de perfil

Los inicios de sesión OAuth crean perfiles distintos para que varias cuentas puedan coexistir.

- Predeterminado: `provider:default` cuando no hay correo electrónico disponible.
- OAuth con correo electrónico: `provider:<email>` (por ejemplo `google-antigravity:user@gmail.com`).

Los perfiles viven en el almacén de perfiles de autenticación `openclaw-agent.sqlite` por agente.

## Orden de rotación

Cuando un proveedor tiene varios perfiles, OpenClaw elige un orden como este:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (si está definido).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` filtrado por proveedor.
  </Step>
  <Step title="Stored profiles">
    Entradas de perfil de autenticación SQLite por agente para el proveedor.
  </Step>
</Steps>

Si no se configura un orden explícito, OpenClaw usa un orden round-robin:

- **Clave primaria:** tipo de perfil (**OAuth antes que claves de API**).
- **Clave secundaria:** `usageStats.lastUsed` (el más antiguo primero, dentro de cada tipo).
- **Perfiles en enfriamiento/deshabilitados** se mueven al final, ordenados por el vencimiento más próximo.

### Persistencia de sesión (compatible con caché)

OpenClaw **fija el perfil de autenticación elegido por sesión** para mantener calientes las cachés del proveedor. **No** rota en cada solicitud. El perfil fijado se reutiliza hasta que:

- la sesión se restablece (`/new` / `/reset`)
- se completa una compactación (aumenta el contador de compactación)
- el perfil está en enfriamiento/deshabilitado

La selección manual mediante `/model …@<profileId>` establece una **anulación de usuario** para esa sesión y no se rota automáticamente hasta que empieza una nueva sesión.

<Note>
Los perfiles fijados automáticamente (seleccionados por el enrutador de sesión) se tratan como una **preferencia**: se prueban primero, pero OpenClaw puede rotar a otro perfil en límites de tasa/tiempos de espera. Cuando el perfil original vuelve a estar disponible, las nuevas ejecuciones pueden volver a preferirlo sin cambiar el modelo seleccionado ni el runtime. Los perfiles fijados por el usuario permanecen bloqueados a ese perfil; si falla y hay reservas de modelo configuradas, OpenClaw pasa al siguiente modelo en lugar de cambiar de perfil.
</Note>

### Suscripción de OpenAI Codex más respaldo de clave de API

Para modelos de agente de OpenAI, la autenticación y el runtime están separados. `openai/gpt-*` permanece en
el arnés de Codex mientras la autenticación puede rotar entre un perfil de suscripción de Codex y
un respaldo de clave de API de OpenAI.

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

Usa `openai:*` tanto para perfiles OAuth de ChatGPT/Codex como para perfiles de
clave de API de OpenAI. Cuando la suscripción alcanza un límite de uso de Codex,
OpenClaw registra la hora exacta de restablecimiento cuando Codex proporciona una, prueba el siguiente
perfil de autenticación ordenado y mantiene la ejecución dentro del arnés de Codex. Una vez que pasa la hora de restablecimiento,
el perfil de suscripción vuelve a ser elegible y la siguiente selección automática
puede volver a él.

Usa un perfil fijado por el usuario solo cuando quieras forzar una cuenta/clave para esa
sesión. Los perfiles fijados por el usuario son intencionalmente estrictos y no saltan silenciosamente
a otro perfil.

## Enfriamientos

Cuando un perfil falla por errores de autenticación/límite de tasa (o un tiempo de espera que parece limitación de tasa), OpenClaw lo marca en enfriamiento y pasa al siguiente perfil.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Ese grupo de límite de tasa es más amplio que un simple `429`: también incluye mensajes de proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` y límites periódicos de ventanas de uso como `weekly/monthly limit reached`.

    Los errores de formato/solicitud inválida suelen ser terminales porque reintentar la misma carga útil fallaría del mismo modo, así que OpenClaw los muestra en lugar de rotar perfiles de autenticación. Las rutas conocidas de reparación por reintento pueden habilitarse explícitamente: por ejemplo, los fallos de validación de ID de llamada a herramienta de Cloud Code Assist se sanitizan y se reintentan una vez mediante la política `allowFormatRetry`. Los errores de motivo de parada compatibles con OpenAI, como `Unhandled stop reason: error`, `stop reason: error` y `reason: error`, se clasifican como señales de tiempo de espera/conmutación por error.

    El texto genérico de servidor también puede caer en ese grupo de tiempo de espera cuando la fuente coincide con un patrón transitorio conocido. Por ejemplo, el mensaje básico del envoltorio de flujo de runtime de modelo `An unknown error occurred` se trata como digno de conmutación por error para todos los proveedores porque el runtime de modelo compartido lo emite cuando los flujos de proveedor terminan con `stopReason: "aborted"` o `stopReason: "error"` sin detalles específicos. Las cargas útiles JSON `api_error` con texto transitorio de servidor como `internal server error`, `unknown error, 520`, `upstream error` o `backend error` también se tratan como tiempos de espera que justifican conmutación por error.

    El texto genérico upstream específico de OpenRouter, como el `Provider returned error` básico, se trata como tiempo de espera solo cuando el contexto del proveedor es realmente OpenRouter. El texto genérico interno de reserva, como `LLM request failed with an unknown error.`, permanece conservador y no activa la conmutación por error por sí solo.

  </Accordion>
  <Accordion title="Límites de retry-after del SDK">
    De lo contrario, algunos SDK de proveedores pueden esperar durante una ventana larga de `Retry-After` antes de devolver el control a OpenClaw. Para SDK basados en Stainless, como Anthropic y OpenAI, OpenClaw limita las esperas internas del SDK de `retry-after-ms` / `retry-after` a 60 segundos de forma predeterminada y expone de inmediato las respuestas reintentables más largas para que esta ruta de conmutación por error pueda ejecutarse. Ajusta o desactiva el límite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulta [Comportamiento de reintento](/es/concepts/retry).
  </Accordion>
  <Accordion title="Enfriamientos con ámbito de modelo">
    Los enfriamientos por límite de tasa también pueden tener ámbito de modelo:

    - OpenClaw registra `cooldownModel` para fallos de límite de tasa cuando se conoce el id del modelo que falla.
    - Todavía se puede intentar usar un modelo hermano del mismo proveedor cuando el enfriamiento está limitado a otro modelo.
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

Los fallos de facturación/crédito (por ejemplo, "insufficient credits" / "credit balance too low") se tratan como aptos para conmutación por error, pero normalmente no son transitorios. En lugar de un enfriamiento breve, OpenClaw marca el perfil como **deshabilitado** (con un retroceso más largo) y rota al siguiente perfil/proveedor.

<Note>
No todas las respuestas con forma de facturación son `402`, y no todos los HTTP `402` llegan aquí. OpenClaw mantiene el texto explícito de facturación en la vía de facturación incluso cuando un proveedor devuelve `401` o `403`, pero los comparadores específicos del proveedor permanecen limitados al proveedor que los posee (por ejemplo, OpenRouter `403 Key limit exceeded`).

Mientras tanto, los errores temporales `402` de ventana de uso y de límite de gasto de organización/espacio de trabajo se clasifican como `rate_limit` cuando el mensaje parece reintentable (por ejemplo, `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` u `organization spending limit exceeded`). Esos permanecen en la ruta breve de enfriamiento/conmutación por error en lugar de la ruta larga de deshabilitación por facturación.
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

- El retroceso de facturación empieza en **5 horas**, se duplica por cada fallo de facturación y tiene un límite de **24 horas**.
- Los contadores de retroceso se restablecen si el perfil no ha fallado durante **24 horas** (configurable).
- Los reintentos por sobrecarga permiten **1 rotación de perfil del mismo proveedor** antes de la reserva de modelo.
- Los reintentos por sobrecarga usan **0 ms de retroceso** de forma predeterminada.

## Reserva de modelo

Si todos los perfiles de un proveedor fallan, OpenClaw pasa al siguiente modelo en `agents.defaults.model.fallbacks`. Esto se aplica a fallos de autenticación, límites de tasa y tiempos de espera que agotaron la rotación de perfiles (otros errores no avanzan la reserva). Los errores de proveedor que no exponen suficiente detalle siguen etiquetándose con precisión en el estado de reserva: `empty_response` significa que el proveedor no devolvió ningún mensaje o estado utilizable, `no_error_details` significa que el proveedor devolvió explícitamente `Unknown error (no error details in response)`, y `unclassified` significa que OpenClaw conservó la vista previa sin procesar, pero ningún clasificador la ha reconocido todavía.

Los errores de sobrecarga y de límite de tasa se manejan de forma más agresiva que los enfriamientos de facturación. De forma predeterminada, OpenClaw permite un reintento de perfil de autenticación del mismo proveedor y luego cambia a la siguiente reserva de modelo configurada sin esperar. Señales de proveedor ocupado como `ModelNotReadyException` caen en ese grupo de sobrecarga. Ajusta esto con `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` y `auth.cooldowns.rateLimitedProfileRotations`.

Cuando una ejecución empieza desde el primario predeterminado configurado, el primario de un trabajo cron, un primario de agente con reservas explícitas o una anulación de reserva seleccionada automáticamente, OpenClaw puede recorrer la cadena de reservas configurada correspondiente. Los primarios de agente sin reservas explícitas y las selecciones explícitas del usuario (por ejemplo, `/model ollama/qwen3.5:27b`, el selector de modelo, `sessions.patch` o anulaciones puntuales de proveedor/modelo de la CLI) son estrictos: si ese proveedor/modelo no está disponible o falla antes de producir una respuesta, OpenClaw informa el fallo en lugar de responder desde una reserva no relacionada.

### Reglas de la cadena de candidatos

OpenClaw construye la lista de candidatos a partir del `provider/model` solicitado actualmente más las reservas configuradas.

<AccordionGroup>
  <Accordion title="Reglas">
    - El modelo solicitado siempre va primero.
    - Las reservas configuradas explícitas se deduplican, pero no se filtran por la lista de modelos permitidos. Se tratan como intención explícita del operador.
    - Si la ejecución actual ya está en una reserva configurada dentro de la misma familia de proveedores, OpenClaw sigue usando la cadena configurada completa.
    - Cuando no se proporciona ninguna anulación explícita de reserva, las reservas configuradas se intentan antes del primario configurado incluso si el modelo solicitado usa otro proveedor.
    - Cuando no se proporciona ninguna anulación explícita de reserva al ejecutor de reserva, el primario configurado se añade al final para que la cadena pueda volver al valor predeterminado normal una vez agotados los candidatos anteriores.
    - Cuando un llamador proporciona `fallbacksOverride`, el ejecutor usa exactamente el modelo solicitado más esa lista de anulación. Una lista vacía desactiva la reserva de modelo e impide que el primario configurado se añada como destino de reintento oculto.

  </Accordion>
</AccordionGroup>

### Qué errores avanzan la reserva

<Tabs>
  <Tab title="Continúa con">
    - fallos de autenticación
    - límites de tasa y agotamiento de enfriamiento
    - errores de sobrecarga/proveedor ocupado
    - errores de conmutación por error con forma de tiempo de espera
    - deshabilitaciones por facturación
    - `LiveSessionModelSwitchError`, que se normaliza en una ruta de conmutación por error para que un modelo persistido obsoleto no cree un bucle de reintento externo
    - otros errores no reconocidos cuando aún quedan candidatos restantes

  </Tab>
  <Tab title="No continúa con">
    - cancelaciones explícitas que no tienen forma de tiempo de espera/conmutación por error
    - errores de desbordamiento de contexto que deben permanecer dentro de la lógica de Compaction/reintento (por ejemplo, `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` u `ollama error: context length exceeded`)
    - un error desconocido final cuando no quedan candidatos
    - rechazos de seguridad de Claude Fable 5; las solicitudes directas con clave de API los manejan a nivel de proveedor mediante la reserva del lado del servidor de Anthropic a `claude-opus-4-8` en su lugar (consulta [Anthropic](/es/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Omisión por enfriamiento frente a comportamiento de sondeo

Cuando todos los perfiles de autenticación de un proveedor ya están en enfriamiento, OpenClaw no omite automáticamente ese proveedor para siempre. Toma una decisión por candidato:

<AccordionGroup>
  <Accordion title="Decisiones por candidato">
    - Los fallos de autenticación persistentes omiten todo el proveedor de inmediato.
    - Las deshabilitaciones por facturación suelen omitirse, pero el candidato primario todavía puede sondearse con limitación para que la recuperación sea posible sin reiniciar.
    - El candidato primario puede sondearse cerca de la expiración del enfriamiento, con una limitación por proveedor.
    - Los hermanos de reserva del mismo proveedor pueden intentarse pese al enfriamiento cuando el fallo parece transitorio (`rate_limit`, `overloaded` o desconocido). Esto es especialmente relevante cuando un límite de tasa tiene ámbito de modelo y un modelo hermano aún puede recuperarse de inmediato.
    - Los sondeos de enfriamiento transitorio se limitan a uno por proveedor por ejecución de reserva para que un solo proveedor no bloquee la reserva entre proveedores.

  </Accordion>
</AccordionGroup>

## Anulaciones de sesión y cambio de modelo en vivo

Los cambios de modelo de sesión son estado compartido. El ejecutor activo, el comando `/model`, las actualizaciones de Compaction/sesión y la reconciliación de sesión en vivo leen o escriben partes de la misma entrada de sesión.

Eso significa que los reintentos de reserva tienen que coordinarse con el cambio de modelo en vivo:

- Solo los cambios de modelo explícitos impulsados por el usuario marcan un cambio en vivo pendiente. Eso incluye `/model`, `session_status(model=...)` y `sessions.patch`.
- Los cambios de modelo impulsados por el sistema, como la rotación de reserva, anulaciones de Heartbeat o Compaction, nunca marcan por sí mismos un cambio en vivo pendiente.
- Las anulaciones de modelo impulsadas por el usuario se tratan como selecciones exactas para la política de reserva, por lo que un proveedor seleccionado inalcanzable se expone como fallo en lugar de quedar oculto por `agents.defaults.model.fallbacks`.
- Antes de que empiece un reintento de reserva, el ejecutor de respuestas persiste los campos de anulación de reserva seleccionados en la entrada de sesión.
- Las anulaciones de reserva automáticas permanecen seleccionadas en turnos posteriores para que OpenClaw no sondee un primario ya conocido como defectuoso en cada mensaje. OpenClaw sondea periódicamente de nuevo el origen configurado y borra la anulación automática cuando se recupera; `/new`, `/reset` y `sessions.reset` borran de inmediato las anulaciones de origen automático.
- Las respuestas al usuario anuncian transiciones de reserva y recuperación por limpieza de reserva una vez por cada cambio de estado. Los turnos con reserva persistente no repiten el aviso.
- `/status` muestra el modelo seleccionado y, cuando el estado de reserva difiere, el modelo de reserva activo y el motivo.
- La reconciliación de sesión en vivo prefiere las anulaciones de sesión persistidas frente a campos de modelo de ejecución obsoletos.
- Si un error de cambio en vivo apunta a un candidato posterior en la cadena de reserva activa, OpenClaw salta directamente a ese modelo seleccionado en lugar de recorrer primero candidatos no relacionados.
- Si el intento de reserva falla, el ejecutor revierte solo los campos de anulación que escribió, y solo si todavía coinciden con ese candidato fallido.

Esto evita la carrera clásica:

<Steps>
  <Step title="El primario falla">
    El modelo primario seleccionado falla.
  </Step>
  <Step title="Reserva elegida en memoria">
    El candidato de reserva se elige en memoria.
  </Step>
  <Step title="El almacén de sesión aún indica el primario anterior">
    El almacén de sesión aún refleja el primario anterior.
  </Step>
  <Step title="La reconciliación en vivo lee estado obsoleto">
    La reconciliación de sesión en vivo lee el estado de sesión obsoleto.
  </Step>
  <Step title="El reintento vuelve atrás">
    El reintento vuelve al modelo anterior antes de que empiece el intento de reserva.
  </Step>
</Steps>

La anulación de reserva persistida cierra esa ventana, y la reversión estrecha mantiene intactos los cambios de sesión manuales o de ejecución más recientes.

## Observabilidad y resúmenes de fallos

`runWithModelFallback(...)` registra detalles por intento que alimentan los registros y la mensajería de enfriamiento orientada al usuario:

- proveedor/modelo intentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` y motivos de conmutación por error similares)
- estado/código opcional
- resumen de error legible por humanos

Los registros estructurados `model_fallback_decision` también incluyen campos planos `fallbackStep*` cuando un candidato falla, se omite o una reserva posterior tiene éxito. Estos campos hacen explícita la transición intentada (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) para que los exportadores de registros y diagnósticos puedan reconstruir el fallo primario incluso cuando la reserva terminal también falla.

Cuando todos los candidatos fallan, OpenClaw lanza `FallbackSummaryError`. El ejecutor de respuestas externo puede usarlo para construir un mensaje más específico, como "todos los modelos están temporalmente limitados por tasa", e incluir la expiración de enfriamiento más cercana cuando se conoce.

Ese resumen de enfriamiento tiene en cuenta el modelo:

- se ignoran los límites de tasa con ámbito de modelo no relacionados para la cadena de proveedor/modelo intentada
- si el bloqueo restante es un límite de tasa con ámbito de modelo coincidente, OpenClaw informa la última expiración coincidente que aún bloquea ese modelo

## Configuración relacionada

Consulta [Configuración de Gateway](/es/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- Enrutamiento de `agents.defaults.imageModel`

Consulta [Modelos](/es/concepts/models) para obtener una visión general más amplia de la selección de modelos y la reserva.
