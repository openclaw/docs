---
read_when:
    - Diagnóstico de la rotación de perfiles de autenticación, los periodos de espera o el comportamiento de respaldo del modelo
    - Actualización de las reglas de conmutación por error para perfiles de autenticación o modelos
    - Entender cómo interactúan las anulaciones de modelo de sesión con los reintentos de respaldo
sidebarTitle: Model failover
summary: Cómo OpenClaw rota los perfiles de autenticación y recurre a modelos alternativos
title: Conmutación por error del modelo
x-i18n:
    generated_at: "2026-05-06T05:31:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a77ec2bd4a959db5a56e53b002b8bc5ea9a2efe3c914da61ac8d25de41d6c1
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gestiona los errores en dos etapas:

1. **Rotación de perfiles de autenticación** dentro del proveedor actual.
2. **Modelo de respaldo** al siguiente modelo en `agents.defaults.model.fallbacks`.

Este documento explica las reglas de runtime y los datos que las respaldan.

## Flujo de runtime

Para una ejecución de texto normal, OpenClaw evalúa los candidatos en este orden:

<Steps>
  <Step title="Resolver el estado de la sesión">
    Resuelve el modelo activo de la sesión y la preferencia de perfil de autenticación.
  </Step>
  <Step title="Crear la cadena de candidatos">
    Crea la cadena de modelos candidatos a partir de la selección de modelo actual y la política de respaldo para el origen de esa selección. Los valores predeterminados configurados, los modelos principales de trabajos cron y los modelos de respaldo seleccionados automáticamente pueden usar respaldos configurados; las selecciones explícitas de sesión del usuario son estrictas.
  </Step>
  <Step title="Probar el proveedor actual">
    Prueba el proveedor actual con las reglas de rotación/enfriamiento de perfiles de autenticación.
  </Step>
  <Step title="Avanzar ante errores que justifican conmutación por error">
    Si ese proveedor se agota con un error que justifica conmutación por error, pasa al siguiente modelo candidato.
  </Step>
  <Step title="Persistir la anulación de respaldo">
    Persiste la anulación de respaldo seleccionada antes de que comience el reintento, para que otros lectores de la sesión vean el mismo proveedor/modelo que el ejecutor está a punto de usar. La anulación de modelo persistida se marca como `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Revertir de forma limitada ante un fallo">
    Si el candidato de respaldo falla, revierte solo los campos de anulación de sesión propiedad del respaldo cuando todavía coinciden con ese candidato fallido.
  </Step>
  <Step title="Lanzar FallbackSummaryError si se agota">
    Si todos los candidatos fallan, lanza un `FallbackSummaryError` con detalles por intento y el vencimiento de enfriamiento más cercano cuando se conoce.
  </Step>
</Steps>

Esto es intencionalmente más limitado que "guardar y restaurar toda la sesión". El ejecutor de respuestas solo persiste los campos de selección de modelo que le pertenecen para el respaldo:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Eso evita que un reintento de respaldo fallido sobrescriba mutaciones de sesión más nuevas y no relacionadas, como cambios manuales de `/model` o actualizaciones de rotación de sesión que ocurrieron mientras el intento estaba en ejecución.

## Política de origen de selección

OpenClaw separa el proveedor/modelo seleccionado del motivo por el que fue seleccionado. Ese origen controla si la cadena de respaldo está permitida:

- **Valor predeterminado configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Modelo principal del agente**: `agents.list[].model` es estricto a menos que ese objeto de modelo de agente incluya sus propios `fallbacks`. Usa `fallbacks: []` para hacer explícito el comportamiento estricto, o proporciona una lista no vacía para habilitar el respaldo de modelo en ese agente.
- **Anulación automática de respaldo**: un respaldo de runtime escribe `providerOverride`, `modelOverride` y `modelOverrideSource: "auto"` antes de reintentar. Esa anulación automática puede seguir recorriendo la cadena de respaldo configurada y se borra con `/new`, `/reset` y `sessions.reset`.
- **Anulación de sesión del usuario**: `/model`, el selector de modelo, `session_status(model=...)` y `sessions.patch` escriben `modelOverrideSource: "user"`. Esa es una selección exacta de sesión. Si el proveedor/modelo seleccionado falla antes de producir una respuesta, OpenClaw informa el fallo en lugar de responder desde un respaldo configurado no relacionado.
- **Anulación de sesión heredada**: las entradas de sesión antiguas pueden tener `modelOverride` sin `modelOverrideSource`. OpenClaw las trata como anulaciones de usuario para que una selección antigua explícita no se convierta silenciosamente en comportamiento de respaldo.
- **Modelo de carga útil de Cron**: un trabajo cron `payload.model` / `--model` es un modelo principal de trabajo, no una anulación de sesión del usuario. Usa los respaldos configurados a menos que el trabajo proporcione `payload.fallbacks`; `payload.fallbacks: []` hace que la ejecución cron sea estricta.

## Almacenamiento de autenticación (claves + OAuth)

OpenClaw usa **perfiles de autenticación** tanto para claves de API como para tokens OAuth.

- Los secretos viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (heredado: `~/.openclaw/agent/auth-profiles.json`).
- El estado de enrutamiento de autenticación de runtime vive en `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configuración `auth.profiles` / `auth.order` es **solo metadatos + enrutamiento** (sin secretos).
- Archivo OAuth heredado solo para importación: `~/.openclaw/credentials/oauth.json` (se importa a `auth-profiles.json` en el primer uso).

Más detalles: [OAuth](/es/concepts/oauth)

Tipos de credenciales:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para algunos proveedores)

## ID de perfiles

Los inicios de sesión OAuth crean perfiles distintos para que puedan coexistir varias cuentas.

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
    `auth.profiles` filtrados por proveedor.
  </Step>
  <Step title="Perfiles almacenados">
    Entradas en `auth-profiles.json` para el proveedor.
  </Step>
</Steps>

Si no se configura un orden explícito, OpenClaw usa un orden round-robin:

- **Clave principal:** tipo de perfil (**OAuth antes que claves de API**).
- **Clave secundaria:** `usageStats.lastUsed` (los más antiguos primero, dentro de cada tipo).
- Los **perfiles en enfriamiento/deshabilitados** se mueven al final, ordenados por vencimiento más cercano.

### Fijación de sesión (compatible con caché)

OpenClaw **fija el perfil de autenticación elegido por sesión** para mantener calientes las cachés del proveedor. **No** rota en cada solicitud. El perfil fijado se reutiliza hasta que:

- se restablece la sesión (`/new` / `/reset`)
- se completa una compactación (aumenta el recuento de compactación)
- el perfil está en enfriamiento/deshabilitado

La selección manual mediante `/model …@<profileId>` establece una **anulación de usuario** para esa sesión y no se rota automáticamente hasta que comienza una nueva sesión.

<Note>
Los perfiles fijados automáticamente (seleccionados por el enrutador de sesión) se tratan como una **preferencia**: se prueban primero, pero OpenClaw puede rotar a otro perfil ante límites de tasa/tiempos de espera. Los perfiles fijados por el usuario permanecen bloqueados en ese perfil; si falla y hay respaldos de modelo configurados, OpenClaw pasa al siguiente modelo en lugar de cambiar de perfil.
</Note>

### Por qué OAuth puede "parecer perdido"

Si tienes tanto un perfil OAuth como un perfil de clave de API para el mismo proveedor, round-robin puede alternar entre ellos en distintos mensajes a menos que esté fijado. Para forzar un solo perfil:

- Fíjalo con `auth.order[provider] = ["provider:profileId"]`, o
- Usa una anulación por sesión mediante `/model …` con una anulación de perfil (cuando tu superficie de UI/chat lo admita).

## Enfriamientos

Cuando un perfil falla por errores de autenticación/límite de tasa (o un tiempo de espera que parece un límite de tasa), OpenClaw lo marca en enfriamiento y pasa al siguiente perfil.

<AccordionGroup>
  <Accordion title="Qué entra en el grupo de límite de tasa / tiempo de espera">
    Ese grupo de límite de tasa es más amplio que un simple `429`: también incluye mensajes de proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` y límites periódicos de ventanas de uso como `weekly/monthly limit reached`.

    Los errores de formato/solicitud no válida (por ejemplo fallos de validación de ID de llamadas a herramientas de Cloud Code Assist) se tratan como aptos para conmutación por error y usan los mismos enfriamientos. Los errores de motivo de detención compatibles con OpenAI, como `Unhandled stop reason: error`, `stop reason: error` y `reason: error`, se clasifican como señales de tiempo de espera/conmutación por error.

    El texto genérico del servidor también puede entrar en ese grupo de tiempo de espera cuando el origen coincide con un patrón transitorio conocido. Por ejemplo, el mensaje sin más del envoltorio de streaming de pi-ai `An unknown error occurred` se trata como apto para conmutación por error para todos los proveedores porque pi-ai lo emite cuando los streams de proveedores terminan con `stopReason: "aborted"` o `stopReason: "error"` sin detalles específicos. Las cargas JSON `api_error` con texto transitorio del servidor como `internal server error`, `unknown error, 520`, `upstream error` o `backend error` también se tratan como tiempos de espera aptos para conmutación por error.

    El texto genérico ascendente específico de OpenRouter, como el simple `Provider returned error`, se trata como tiempo de espera solo cuando el contexto del proveedor es realmente OpenRouter. El texto genérico interno de respaldo, como `LLM request failed with an unknown error.`, permanece conservador y no activa la conmutación por error por sí solo.

  </Accordion>
  <Accordion title="Topes de retry-after del SDK">
    Algunos SDK de proveedores podrían esperar una ventana larga de `Retry-After` antes de devolver el control a OpenClaw. Para SDK basados en Stainless, como Anthropic y OpenAI, OpenClaw limita de forma predeterminada las esperas internas del SDK `retry-after-ms` / `retry-after` a 60 segundos y expone inmediatamente respuestas reintentables más largas para que pueda ejecutarse esta ruta de conmutación por error. Ajusta o deshabilita el tope con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulta [Comportamiento de reintento](/es/concepts/retry).
  </Accordion>
  <Accordion title="Enfriamientos con alcance de modelo">
    Los enfriamientos por límite de tasa también pueden tener alcance de modelo:

    - OpenClaw registra `cooldownModel` para fallos de límite de tasa cuando se conoce el id del modelo que falla.
    - Todavía se puede probar un modelo hermano del mismo proveedor cuando el enfriamiento está limitado a otro modelo.
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
No todas las respuestas con forma de facturación son `402`, y no todos los HTTP `402` llegan aquí. OpenClaw mantiene el texto explícito de facturación en la vía de facturación incluso cuando un proveedor devuelve `401` o `403` en su lugar, pero los comparadores específicos de proveedor permanecen limitados al proveedor que los posee (por ejemplo OpenRouter `403 Key limit exceeded`).

Mientras tanto, los errores temporales `402` de ventana de uso y límite de gasto de organización/espacio de trabajo se clasifican como `rate_limit` cuando el mensaje parece reintentable (por ejemplo `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` u `organization spending limit exceeded`). Esos permanecen en la ruta de enfriamiento corto/conmutación por error en lugar de la ruta larga de deshabilitación por facturación.
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

- El retroceso de facturación empieza en **5 horas**, se duplica por cada fallo de facturación y tiene un tope de **24 horas**.
- Los contadores de retroceso se restablecen si el perfil no ha fallado durante **24 horas** (configurable).
- Los reintentos por sobrecarga permiten **1 rotación de perfil en el mismo proveedor** antes del respaldo de modelo.
- Los reintentos por sobrecarga usan **0 ms de retroceso** de forma predeterminada.

## Respaldo de modelo

Si todos los perfiles de un proveedor fallan, OpenClaw pasa al siguiente modelo en `agents.defaults.model.fallbacks`. Esto se aplica a fallos de autenticación, límites de tasa y tiempos de espera que agotaron la rotación de perfiles (otros errores no hacen avanzar el respaldo). Los errores de proveedor que no exponen suficiente detalle siguen etiquetándose con precisión en el estado de respaldo: `empty_response` significa que el proveedor no devolvió ningún mensaje o estado utilizable, `no_error_details` significa que el proveedor devolvió explícitamente `Unknown error (no error details in response)`, y `unclassified` significa que OpenClaw conservó la vista previa sin procesar, pero ningún clasificador coincidió aún.

Los errores de sobrecarga y límite de tasa se gestionan de forma más agresiva que los periodos de espera de facturación. De forma predeterminada, OpenClaw permite un reintento de perfil de autenticación del mismo proveedor y luego cambia al siguiente respaldo de modelo configurado sin esperar. Las señales de proveedor ocupado, como `ModelNotReadyException`, entran en esa categoría de sobrecarga. Ajusta esto con `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` y `auth.cooldowns.rateLimitedProfileRotations`.

Cuando una ejecución comienza desde el principal predeterminado configurado, el principal de un trabajo cron, el principal de un agente con respaldos explícitos o una anulación de respaldo seleccionada automáticamente, OpenClaw puede recorrer la cadena de respaldos configurada correspondiente. Los principales de agente sin respaldos explícitos y las selecciones explícitas del usuario (por ejemplo, `/model ollama/qwen3.5:27b`, el selector de modelo, `sessions.patch` o anulaciones puntuales de proveedor/modelo de la CLI) son estrictos: si ese proveedor/modelo no está disponible o falla antes de producir una respuesta, OpenClaw informa del fallo en lugar de responder desde un respaldo no relacionado.

### Reglas de la cadena candidata

OpenClaw construye la lista de candidatos a partir del `provider/model` solicitado actualmente más los respaldos configurados.

<AccordionGroup>
  <Accordion title="Reglas">
    - El modelo solicitado siempre va primero.
    - Los respaldos configurados explícitos se deduplican, pero no se filtran por la lista de modelos permitidos. Se tratan como intención explícita del operador.
    - Si la ejecución actual ya está en un respaldo configurado dentro de la misma familia de proveedores, OpenClaw sigue usando la cadena configurada completa.
    - Si la ejecución actual usa un proveedor distinto del de la configuración y ese modelo actual no forma ya parte de la cadena de respaldos configurada, OpenClaw no añade respaldos configurados no relacionados de otro proveedor.
    - Cuando no se proporciona ninguna anulación de respaldo explícita al ejecutor de respaldos, el principal configurado se añade al final para que la cadena pueda volver al valor predeterminado normal una vez agotados los candidatos anteriores.
    - Cuando un llamador proporciona `fallbacksOverride`, el ejecutor usa exactamente el modelo solicitado más esa lista de anulaciones. Una lista vacía desactiva el respaldo de modelo e impide que el principal configurado se añada como destino de reintento oculto.

  </Accordion>
</AccordionGroup>

### Qué errores hacen avanzar el respaldo

<Tabs>
  <Tab title="Continúa en">
    - fallos de autenticación
    - límites de tasa y agotamiento de periodos de espera
    - errores de sobrecarga/proveedor ocupado
    - errores de conmutación por error con forma de tiempo de espera
    - desactivaciones de facturación
    - `LiveSessionModelSwitchError`, que se normaliza en una ruta de conmutación por error para que un modelo persistido obsoleto no cree un bucle de reintento externo
    - otros errores no reconocidos cuando todavía quedan candidatos

  </Tab>
  <Tab title="No continúa en">
    - abortos explícitos que no tienen forma de tiempo de espera/conmutación por error
    - errores de desbordamiento de contexto que deben permanecer dentro de la lógica de compaction/reintento (por ejemplo, `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` u `ollama error: context length exceeded`)
    - un error desconocido final cuando no quedan candidatos

  </Tab>
</Tabs>

### Omisión de periodo de espera frente a comportamiento de sondeo

Cuando todos los perfiles de autenticación de un proveedor ya están en periodo de espera, OpenClaw no omite automáticamente ese proveedor para siempre. Toma una decisión por candidato:

<AccordionGroup>
  <Accordion title="Decisiones por candidato">
    - Los fallos de autenticación persistentes omiten todo el proveedor inmediatamente.
    - Las desactivaciones de facturación suelen omitirse, pero el candidato principal todavía puede sondearse con una limitación para que la recuperación sea posible sin reiniciar.
    - El candidato principal puede sondearse cerca de la expiración del periodo de espera, con una limitación por proveedor.
    - Los respaldos hermanos del mismo proveedor pueden intentarse a pesar del periodo de espera cuando el fallo parece transitorio (`rate_limit`, `overloaded` o desconocido). Esto es especialmente relevante cuando un límite de tasa tiene alcance de modelo y un modelo hermano aún puede recuperarse inmediatamente.
    - Los sondeos de periodos de espera transitorios se limitan a uno por proveedor por ejecución de respaldo para que un solo proveedor no bloquee el respaldo entre proveedores.

  </Accordion>
</AccordionGroup>

## Anulaciones de sesión y cambio de modelo en vivo

Los cambios de modelo de sesión son estado compartido. El ejecutor activo, el comando `/model`, las actualizaciones de compaction/sesión y la reconciliación de sesión en vivo leen o escriben partes de la misma entrada de sesión.

Eso significa que los reintentos de respaldo tienen que coordinarse con el cambio de modelo en vivo:

- Solo los cambios de modelo explícitos impulsados por el usuario marcan un cambio en vivo pendiente. Eso incluye `/model`, `session_status(model=...)` y `sessions.patch`.
- Los cambios de modelo impulsados por el sistema, como la rotación de respaldo, las anulaciones de Heartbeat o compaction, nunca marcan por sí solos un cambio en vivo pendiente.
- Las anulaciones de modelo impulsadas por el usuario se tratan como selecciones exactas para la política de respaldo, por lo que un proveedor seleccionado que no esté disponible se muestra como fallo en lugar de quedar oculto por `agents.defaults.model.fallbacks`.
- Antes de que empiece un reintento de respaldo, el ejecutor de respuestas persiste los campos de anulación de respaldo seleccionados en la entrada de sesión.
- Las anulaciones de respaldo automáticas permanecen seleccionadas en turnos posteriores para que OpenClaw no sondee un principal conocido como defectuoso en cada mensaje. `/new`, `/reset` y `sessions.reset` borran las anulaciones de origen automático y devuelven la sesión al valor predeterminado configurado.
- `/status` muestra el modelo seleccionado y, cuando el estado de respaldo difiere, el modelo de respaldo activo y el motivo.
- La reconciliación de sesión en vivo prefiere las anulaciones de sesión persistidas frente a campos de modelo de ejecución obsoletos.
- Si un error de cambio en vivo apunta a un candidato posterior en la cadena de respaldos activa, OpenClaw salta directamente a ese modelo seleccionado en lugar de recorrer primero candidatos no relacionados.
- Si el intento de respaldo falla, el ejecutor revierte solo los campos de anulación que escribió, y solo si aún coinciden con ese candidato fallido.

Esto evita la carrera clásica:

<Steps>
  <Step title="Falla el principal">
    El modelo principal seleccionado falla.
  </Step>
  <Step title="Respaldo elegido en memoria">
    El candidato de respaldo se elige en memoria.
  </Step>
  <Step title="El almacén de sesiones sigue indicando el principal antiguo">
    El almacén de sesiones todavía refleja el principal antiguo.
  </Step>
  <Step title="La reconciliación en vivo lee estado obsoleto">
    La reconciliación de sesión en vivo lee el estado de sesión obsoleto.
  </Step>
  <Step title="Reintento devuelto atrás">
    El reintento se devuelve al modelo antiguo antes de que empiece el intento de respaldo.
  </Step>
</Steps>

La anulación de respaldo persistida cierra esa ventana, y la reversión acotada mantiene intactos los cambios de sesión manuales o de ejecución más recientes.

## Observabilidad y resúmenes de fallos

`runWithModelFallback(...)` registra detalles por intento que alimentan los registros y los mensajes de periodos de espera visibles para el usuario:

- proveedor/modelo intentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` y motivos de conmutación por error similares)
- estado/código opcional
- resumen de error legible para humanos

Los registros estructurados `model_fallback_decision` también incluyen campos planos `fallbackStep*` cuando un candidato falla, se omite o un respaldo posterior tiene éxito. Estos campos hacen explícita la transición intentada (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) para que los exportadores de registros y diagnósticos puedan reconstruir el fallo principal incluso cuando el respaldo terminal también falla.

Cuando todos los candidatos fallan, OpenClaw lanza `FallbackSummaryError`. El ejecutor de respuestas externo puede usarlo para crear un mensaje más específico, como "todos los modelos están limitados temporalmente por tasa", e incluir la expiración de periodo de espera más próxima cuando se conozca.

Ese resumen de periodo de espera tiene en cuenta el modelo:

- se ignoran los límites de tasa con alcance de modelo no relacionados para la cadena de proveedor/modelo intentada
- si el bloqueo restante es un límite de tasa con alcance de modelo coincidente, OpenClaw informa de la última expiración coincidente que todavía bloquea ese modelo

## Configuración relacionada

Consulta [Configuración de Gateway](/es/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- enrutamiento de `agents.defaults.imageModel`

Consulta [Modelos](/es/concepts/models) para una visión general más amplia de la selección de modelos y los respaldos.
