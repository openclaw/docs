---
read_when:
    - Diagnóstico de la rotación de perfiles de autenticación, los períodos de espera o el comportamiento de respaldo del modelo
    - Actualización de las reglas de conmutación por error para perfiles de autenticación o modelos
    - Comprender cómo interactúan las sustituciones del modelo de sesión con los reintentos de respaldo
sidebarTitle: Model failover
summary: Cómo OpenClaw rota los perfiles de autenticación y recurre a modelos alternativos
title: Conmutación por error de modelos
x-i18n:
    generated_at: "2026-07-11T22:59:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gestiona los fallos en dos etapas:

1. **Rotación de perfiles de autenticación** dentro del proveedor actual.
2. **Cambio de respaldo de modelo** al siguiente modelo de `agents.defaults.model.fallbacks`.

## Flujo de ejecución

<Steps>
  <Step title="Resolver el estado de la sesión">
    Resuelve el modelo de la sesión activa y la preferencia de perfil de autenticación.
  </Step>
  <Step title="Crear la cadena de candidatos">
    Crea la cadena de modelos candidatos a partir de la selección de modelo actual y la política de respaldo correspondiente al origen de esa selección. Los valores predeterminados configurados, los modelos principales de tareas Cron y los modelos de respaldo seleccionados automáticamente pueden usar los respaldos configurados; las selecciones explícitas de la sesión del usuario son estrictas.
  </Step>
  <Step title="Probar el proveedor actual">
    Prueba el proveedor actual con las reglas de rotación y tiempo de espera de los perfiles de autenticación.
  </Step>
  <Step title="Avanzar ante errores que justifican la conmutación por error">
    Si se agotan las opciones de ese proveedor debido a un error que justifica la conmutación por error, pasa al siguiente modelo candidato.
  </Step>
  <Step title="Persistir la sobrescritura de respaldo">
    Persiste la sobrescritura de respaldo seleccionada antes de que comience el reintento, para que otros lectores de la sesión vean el mismo proveedor y modelo que el ejecutor está a punto de usar. La sobrescritura de modelo persistida se marca como `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Revertir de forma limitada en caso de fallo">
    Si el candidato de respaldo falla, revierte únicamente los campos de sobrescritura de sesión pertenecientes al respaldo cuando aún coincidan con ese candidato fallido.
  </Step>
  <Step title="Lanzar FallbackSummaryError si se agotan los candidatos">
    Si todos los candidatos fallan, lanza un `FallbackSummaryError` con detalles de cada intento y la fecha de vencimiento más próxima del tiempo de espera, cuando se conozca.
  </Step>
</Steps>

Esto es intencionadamente más limitado que «guardar y restaurar toda la sesión». El ejecutor de respuestas solo persiste los campos de selección de modelo que controla para el respaldo: `providerOverride`, `modelOverride`, `modelOverrideSource`, `authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`. Esto evita que un reintento de respaldo fallido sobrescriba modificaciones posteriores y no relacionadas de la sesión, como un cambio manual con `/model` o una actualización de rotación de la sesión ocurrida mientras se ejecutaba el intento.

## Política del origen de selección

El origen de selección determina si se permite la cadena de respaldo:

- **Valor predeterminado configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Modelo principal del agente**: `agents.list[].model` es estricto, salvo que el objeto de modelo de ese agente incluya sus propios `fallbacks`. Usa `fallbacks: []` para hacer explícito el comportamiento estricto, o una lista no vacía para habilitar el respaldo de modelos para ese agente.
- **Sobrescritura de respaldo automática**: un respaldo en tiempo de ejecución escribe `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` y el modelo de origen seleccionado antes de reintentar. Esta sobrescritura continúa recorriendo la cadena de respaldo configurada sin sondear el modelo principal en cada mensaje, pero OpenClaw sondea el origen configurado cada 5 minutos (no configurable) y elimina la sobrescritura cuando se recupera. `/new`, `/reset` y `sessions.reset` también eliminan las sobrescrituras de origen automático. Las ejecuciones de Heartbeat sin un `heartbeat.model` explícito eliminan las sobrescrituras automáticas directas cuando su origen ya no coincide con el valor predeterminado configurado actualmente.
- **Sobrescritura de sesión del usuario**: `/model`, el selector de modelos, `session_status(model=...)` y `sessions.patch` escriben `modelOverrideSource: "user"`. Se trata de una selección exacta para la sesión. Si el proveedor o modelo seleccionado falla antes de producir una respuesta, OpenClaw informa del fallo en lugar de responder desde un respaldo configurado no relacionado.
- **Sobrescritura de sesión heredada**: las entradas de sesión antiguas pueden contener `modelOverride` sin `modelOverrideSource`. OpenClaw las trata como sobrescrituras del usuario para que una selección explícita antigua no se convierta silenciosamente en comportamiento de respaldo.
- **Modelo de la carga útil de Cron**: el `payload.model` / `--model` de una tarea Cron es el modelo principal de la tarea, no una sobrescritura de sesión del usuario. Usa los respaldos configurados salvo que la tarea proporcione `payload.fallbacks`; `payload.fallbacks: []` hace que la ejecución de Cron sea estricta.

OpenClaw recuerda los sondeos recientes del modelo principal por sesión y modelo principal, para no volver a intentar un modelo principal que falla en cada turno. Envía un aviso visible cuando una sesión pasa al respaldo y otro cuando vuelve al modelo principal seleccionado; no repite el aviso en cada turno que permanece en el respaldo.

## Caché de omisión de fallos de autenticación

De forma predeterminada, cada turno nuevo mantiene el comportamiento existente de reintentos de respaldo: OpenClaw vuelve a intentar cada candidato de respaldo configurado, incluidos los candidatos no principales que hayan fallado recientemente con `auth` o `auth_permanent`.

Para evitar fallos de autenticación repetidos, habilita:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Cuando está habilitada, OpenClaw registra en memoria un marcador de omisión asociado a la sesión para un candidato de respaldo no principal después de un fallo de la clase de autenticación, identificado por el id. de sesión, el proveedor y el modelo. Los candidatos principales nunca se omiten, por lo que una selección explícita de modelo del usuario sigue mostrando el error de autenticación real. La caché es local al proceso y se borra al reiniciar el Gateway.

El valor es un TTL en milisegundos. `0` o la ausencia de valor deshabilitan la caché. Los valores positivos se limitan a un intervalo de entre 1 segundo y 10 minutos.

## Avisos de respaldo visibles para el usuario

Cuando una sesión pasa a un respaldo seleccionado automáticamente, OpenClaw envía un aviso de estado en la misma superficie de respuesta:

```text
↪️ Respaldo de modelo: <fallback> (seleccionado <primary>; <reason>)
```

Cuando un sondeo posterior tiene éxito y la sesión vuelve al modelo principal seleccionado, OpenClaw envía:

```text
↪️ Respaldo de modelo eliminado: <primary> (antes <fallback>)
```

Estos avisos son mensajes operativos, no contenido del asistente. Se entregan una vez por cada cambio de estado, incluidos, cuando sea posible, los turnos que solo producen efectos secundarios, pero no se repiten en los turnos que permanecen en el respaldo. La entrega omite la supresión normal de respuestas al origen, no consume el primer espacio de respuesta del asistente en canales con conversaciones en hilos y se excluye de la conversión de texto a voz y de la extracción de compromisos.

## Almacenamiento de autenticación (claves + OAuth)

OpenClaw usa **perfiles de autenticación** tanto para las claves de API como para los tokens OAuth.

- Los secretos y el estado de enrutamiento de autenticación en tiempo de ejecución se almacenan en `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configuración `auth.profiles` / `auth.order` contiene **solo metadatos y enrutamiento** (sin secretos).
- Archivo OAuth heredado solo para importación: `~/.openclaw/credentials/oauth.json` (se importa al almacén de autenticación de cada agente en el primer uso).
- Los archivos heredados `auth-profiles.json`, `auth-state.json` y los archivos `auth.json` de cada agente se importan mediante `openclaw doctor --fix`.

Más detalles: [OAuth](/es/concepts/oauth)

Tipos de credenciales:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para algunos proveedores)
- `type: "token"` → token estático de tipo portador, con vencimiento opcional; OpenClaw no lo renueva (se usa para `aws-sdk` y otros modos de autenticación mediante cadenas de credenciales)

## Identificadores de perfiles

Los inicios de sesión OAuth crean perfiles distintos para que puedan coexistir varias cuentas.

- Valor predeterminado: `provider:default` cuando no hay ninguna dirección de correo electrónico disponible.
- OAuth con correo electrónico: `provider:<email>` (por ejemplo, `google-antigravity:user@gmail.com`).

Los perfiles se almacenan en el almacén de perfiles de autenticación de `openclaw-agent.sqlite` correspondiente a cada agente.

## Orden de rotación

Cuando un proveedor tiene varios perfiles, OpenClaw elige un orden como este:

<Steps>
  <Step title="Configuración explícita">
    `auth.order[provider]` (si está definido).
  </Step>
  <Step title="Perfiles configurados">
    `auth.profiles` filtrados por proveedor.
  </Step>
  <Step title="Perfiles almacenados">
    Entradas de perfiles de autenticación del proveedor en la base de datos SQLite de cada agente.
  </Step>
</Steps>

Si no se configura un orden explícito, OpenClaw usa un orden rotativo:

- **Clave principal:** tipo de perfil (**OAuth, luego token estático y, por último, clave de API**).
- **Clave secundaria:** `usageStats.lastUsed` (primero el más antiguo, dentro de cada tipo).
- Los **perfiles en tiempo de espera o deshabilitados** se mueven al final, ordenados por el vencimiento más próximo.

### Persistencia en la sesión (favorable para la caché)

OpenClaw **fija el perfil de autenticación elegido para cada sesión** con el fin de mantener activas las cachés del proveedor. **No** rota en cada solicitud. El perfil fijado se reutiliza hasta que:

- se restablece la sesión (`/new` / `/reset`)
- se completa una Compaction (aumenta el contador de compactaciones)
- el perfil entra en tiempo de espera o se deshabilita

La selección manual mediante `/model …@<profileId>` establece una **sobrescritura del usuario** para esa sesión y no se rota automáticamente hasta que comienza una sesión nueva.

<Note>
Los perfiles fijados automáticamente (seleccionados por el enrutador de sesiones) se tratan como una **preferencia**: se prueban primero, pero OpenClaw puede rotar a otro perfil en caso de límites de frecuencia o tiempos de espera agotados. Cuando el perfil original vuelve a estar disponible, las ejecuciones nuevas pueden volver a preferirlo sin cambiar el modelo seleccionado ni el entorno de ejecución. Los perfiles fijados por el usuario permanecen bloqueados en ese perfil; si falla y hay respaldos de modelos configurados, OpenClaw pasa al siguiente modelo en lugar de cambiar de perfil.
</Note>

### Suscripción a OpenAI Codex con respaldo mediante clave de API

Para los modelos de agente de OpenAI, la autenticación y el entorno de ejecución son independientes. `openai/gpt-*` permanece en el entorno de Codex mientras la autenticación puede rotar entre un perfil de suscripción a Codex y un respaldo mediante clave de API de OpenAI.

Usa `auth.order.openai` para definir el orden visible para el usuario:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Usa `openai:*` tanto para los perfiles OAuth de ChatGPT/Codex como para los perfiles con clave de API de OpenAI. Cuando la suscripción alcanza un límite de uso de Codex, OpenClaw registra la hora exacta de restablecimiento si Codex la proporciona, prueba el siguiente perfil de autenticación ordenado y mantiene la ejecución dentro del entorno de Codex. Una vez transcurrida la hora de restablecimiento, el perfil de suscripción vuelve a ser apto y la siguiente selección automática puede volver a usarlo.

Usa un perfil fijado por el usuario solo cuando quieras forzar una cuenta o clave concreta para esa sesión. Los perfiles fijados por el usuario son intencionadamente estrictos y no cambian silenciosamente a otro perfil.

## Tiempos de espera

Cuando un perfil falla debido a errores de autenticación o de límite de frecuencia (o a un tiempo de espera agotado que parece un límite de frecuencia), OpenClaw lo pone en tiempo de espera y pasa al siguiente perfil.

<AccordionGroup>
  <Accordion title="Qué se incluye en la categoría de límite de frecuencia o tiempo de espera agotado">
    Esa categoría de límite de frecuencia es más amplia que un simple `429`: también incluye mensajes de proveedores como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` y límites periódicos de ventanas de uso como `weekly limit reached` o `monthly limit exhausted`.

    Los errores de formato o de solicitud no válida suelen ser definitivos porque volver a intentar la misma carga útil produciría el mismo fallo; por eso OpenClaw los muestra en lugar de rotar los perfiles de autenticación. Las rutas conocidas de reparación mediante reintento pueden habilitarse explícitamente: por ejemplo, los fallos de validación del identificador de llamada a herramientas de Cloud Code Assist se depuran y se reintentan una vez mediante la política `allowFormatRetry`. Los errores de motivo de detención compatibles con OpenAI, como `Unhandled stop reason: error`, `stop reason: error` y `reason: error`, se clasifican como señales de tiempo de espera agotado o conmutación por error.

    El texto genérico del servidor también puede incluirse en esa categoría de tiempo de espera agotado cuando el origen coincide con un patrón transitorio conocido. Por ejemplo, el mensaje simple del contenedor de flujos del entorno de ejecución del modelo `An unknown error occurred` se considera motivo de conmutación por error para todos los proveedores porque el entorno de ejecución compartido del modelo lo emite cuando los flujos del proveedor terminan con `stopReason: "aborted"` o `stopReason: "error"` sin detalles específicos. Las cargas útiles JSON `api_error` con texto transitorio del servidor como `internal server error`, `unknown error, 520`, `upstream error` o `backend error` también se tratan como tiempos de espera agotados que justifican la conmutación por error.

    El texto genérico de un proveedor ascendente específico de OpenRouter, como `Provider returned error` sin más detalles, se trata como tiempo de espera agotado solo cuando el contexto del proveedor es realmente OpenRouter. El texto genérico interno de respaldo como `LLM request failed with an unknown error.` se trata de forma conservadora y no activa por sí solo la conmutación por error.

  </Accordion>
  <Accordion title="Límites de retry-after del SDK">
    De lo contrario, algunos SDK de proveedores pueden esperar durante un intervalo largo de `Retry-After` antes de devolver el control a OpenClaw. Para los SDK basados en Stainless, como los de Anthropic y OpenAI, OpenClaw limita de forma predeterminada a 60 segundos las esperas internas del SDK de `retry-after-ms` / `retry-after` y expone inmediatamente las respuestas reintentables con esperas más largas para que pueda ejecutarse esta ruta de conmutación por error. Ajuste o desactive el límite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulte [Comportamiento de los reintentos](/es/concepts/retry).
  </Accordion>
  <Accordion title="Tiempos de espera por modelo">
    Los tiempos de espera por límite de tasa también pueden aplicarse por modelo:

    - OpenClaw registra `cooldownModel` para los fallos por límite de tasa cuando se conoce el identificador del modelo que falla.
    - Se puede seguir intentando con otro modelo del mismo proveedor cuando el tiempo de espera se aplica a un modelo diferente.
    - Los periodos por facturación o desactivación siguen bloqueando todo el perfil en todos los modelos.

  </Accordion>
</AccordionGroup>

Los tiempos de espera normales (no relacionados con facturación ni con fallos permanentes de autenticación) aumentan según el recuento de errores recientes del perfil:

- 1.er fallo: 30 segundos
- 2.º fallo: 1 minuto
- 3.er fallo y posteriores: 5 minutos (límite)

Los contadores se restablecen una vez transcurrido el periodo de fallos del perfil (`auth.cooldowns.failureWindowHours`, 24 de forma predeterminada).

El estado se almacena en el estado de autenticación SQLite de cada agente, dentro de `usageStats`:

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

## Desactivaciones por facturación

Los fallos de facturación o crédito (por ejemplo, "créditos insuficientes" o "saldo de crédito demasiado bajo") se consideran motivo para conmutar por error, pero normalmente no son transitorios. En lugar de aplicar un tiempo de espera breve, OpenClaw marca el perfil como **desactivado** (con una espera de reintento más larga) y cambia al siguiente perfil o proveedor.

<Note>
No todas las respuestas que parecen relacionadas con la facturación son `402`, ni todos los errores HTTP `402` se clasifican aquí. OpenClaw mantiene el texto explícito de facturación en la categoría de facturación incluso cuando un proveedor devuelve `401` o `403`, pero los detectores específicos de cada proveedor permanecen limitados al proveedor al que pertenecen (por ejemplo, `403 Key limit exceeded` de OpenRouter).

Mientras tanto, los errores temporales `402` relacionados con periodos de uso y límites de gasto de la organización o del espacio de trabajo se clasifican como `rate_limit` cuando el mensaje parece indicar que se puede reintentar (por ejemplo, `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` u `organization spending limit exceeded`). Estos permanecen en la ruta breve de tiempo de espera y conmutación por error, en lugar de pasar a la ruta larga de desactivación por facturación.
</Note>

Los fallos permanentes de autenticación de alta confianza (claves revocadas o desactivadas, espacios de trabajo desactivados) siguen una categoría de desactivación similar, pero se recuperan mucho antes que los de facturación, ya que algunos proveedores muestran de forma transitoria cargas útiles que parecen errores de autenticación durante incidentes.

El estado se almacena en el estado de autenticación SQLite de cada agente:

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

Valores predeterminados (`auth.cooldowns.*`):

| Clave                         | Valor predeterminado | Finalidad                                                                                       |
| ----------------------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| `billingBackoffHours`         | 5                    | Espera de reintento base por facturación; se duplica con cada fallo de facturación              |
| `billingMaxHours`             | 24                   | Límite de la espera de reintento por facturación                                                |
| `authPermanentBackoffMinutes` | 10                   | Espera de reintento base para fallos permanentes de autenticación de alta confianza             |
| `authPermanentMaxMinutes`     | 60                   | Límite de esa espera de reintento                                                               |
| `failureWindowHours`          | 24                   | Los contadores de fallos se restablecen si no se producen fallos durante este periodo           |
| `overloadedProfileRotations`  | 1                    | Cambios de perfil permitidos en el mismo proveedor antes de recurrir a otro modelo por sobrecarga |
| `overloadedBackoffMs`         | 0                    | Retraso fijo antes de reintentar un cambio por sobrecarga                                       |
| `rateLimitedProfileRotations` | 1                    | Cambios de perfil permitidos en el mismo proveedor antes de recurrir a otro modelo por límite de tasa |

Los errores de sobrecarga y límite de tasa se gestionan de forma más agresiva que los tiempos de espera por facturación: de forma predeterminada, OpenClaw permite un reintento con otro perfil de autenticación del mismo proveedor y, después, cambia al siguiente modelo alternativo configurado sin esperar.

## Modelo alternativo

Si fallan todos los perfiles de un proveedor, OpenClaw pasa al siguiente modelo de `agents.defaults.model.fallbacks`. Esto se aplica a fallos de autenticación, límites de tasa y tiempos de espera agotados tras probar los distintos perfiles (otros errores no hacen avanzar la cadena de modelos alternativos). Los errores de proveedor que no exponen suficiente información se siguen etiquetando con precisión en el estado de conmutación por error: `empty_response` significa que el proveedor no devolvió ningún mensaje ni estado utilizable, `no_error_details` significa que el proveedor devolvió explícitamente `Unknown error (no error details in response)` y `unclassified` significa que OpenClaw conservó la vista previa sin procesar, pero ningún clasificador la reconoció todavía.

Las señales de proveedor ocupado, como `ModelNotReadyException`, se incluyen en la categoría de sobrecarga y siguen la misma política de un cambio de perfil y luego un modelo alternativo que los límites de tasa (consulte la tabla de valores predeterminados anterior).

Cuando una ejecución comienza desde el modelo principal predeterminado configurado, el modelo principal de una tarea Cron, el modelo principal de un agente con alternativas explícitas o una sustitución alternativa seleccionada automáticamente, OpenClaw puede recorrer la cadena alternativa configurada correspondiente. Los modelos principales de agentes sin alternativas explícitas y las selecciones explícitas del usuario (por ejemplo, `/model ollama/qwen3.5:27b`, el selector de modelos, `sessions.patch` o las sustituciones puntuales de proveedor o modelo mediante la CLI) son estrictos: si no se puede acceder a ese proveedor o modelo, o si falla antes de generar una respuesta, OpenClaw informa del fallo en lugar de responder mediante una alternativa no relacionada.

### Reglas de la cadena de candidatos

OpenClaw crea la lista de candidatos a partir del `provider/model` solicitado actualmente y de las alternativas configuradas.

<AccordionGroup>
  <Accordion title="Reglas">
    - El modelo solicitado siempre aparece primero.
    - Las alternativas configuradas explícitamente se deduplican, pero no se filtran mediante la lista de modelos permitidos. Se consideran una intención explícita del operador.
    - Si la ejecución actual ya utiliza una alternativa configurada de la misma familia de proveedores, OpenClaw continúa utilizando toda la cadena configurada.
    - Cuando no se proporciona una sustitución alternativa explícita, las alternativas configuradas se prueban antes que el modelo principal configurado, incluso si el modelo solicitado utiliza otro proveedor.
    - Cuando no se proporciona una sustitución alternativa explícita al ejecutor de alternativas, el modelo principal configurado se añade al final para que la cadena pueda volver al valor predeterminado habitual una vez agotados los candidatos anteriores.
    - Cuando un invocador proporciona `fallbacksOverride`, el ejecutor utiliza exactamente el modelo solicitado y esa lista de sustitución. Una lista vacía desactiva los modelos alternativos e impide que el modelo principal configurado se añada como destino de reintento oculto.

  </Accordion>
</AccordionGroup>

### Errores que hacen avanzar la cadena de alternativas

<Tabs>
  <Tab title="Continúa en caso de">
    - fallos de autenticación
    - límites de tasa y agotamiento de los tiempos de espera
    - errores por sobrecarga o proveedor ocupado
    - errores de conmutación por error con forma de tiempo de espera
    - desactivaciones por facturación
    - `LiveSessionModelSwitchError`, que se normaliza en una ruta de conmutación por error para que un modelo persistido obsoleto no cree un bucle externo de reintentos
    - otros errores no reconocidos cuando aún quedan candidatos

  </Tab>
  <Tab title="No continúa en caso de">
    - cancelaciones explícitas que no tienen forma de tiempo de espera o conmutación por error
    - errores de desbordamiento del contexto que deben permanecer dentro de la lógica de Compaction y reintentos (por ejemplo, `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` u `ollama error: context length exceeded`)
    - un error desconocido final cuando no quedan candidatos
    - rechazos de seguridad de Claude Fable 5; las solicitudes directas mediante clave de API los gestionan en el nivel del proveedor mediante la alternativa del servidor de Anthropic a `claude-opus-4-8` (consulte [Anthropic](/es/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Comportamiento de omisión frente a sondeo durante el tiempo de espera

Cuando todos los perfiles de autenticación de un proveedor ya están en tiempo de espera, OpenClaw no omite automáticamente ese proveedor para siempre. Toma una decisión para cada candidato:

<AccordionGroup>
  <Accordion title="Decisiones por candidato">
    - Los fallos persistentes de autenticación hacen que se omita inmediatamente todo el proveedor.
    - Las desactivaciones por facturación suelen provocar la omisión, pero el candidato principal aún puede sondearse con limitación de frecuencia para permitir la recuperación sin reiniciar.
    - El candidato principal puede sondearse cerca del vencimiento del tiempo de espera, con una limitación de frecuencia por proveedor.
    - Se pueden probar modelos alternativos del mismo proveedor a pesar del tiempo de espera cuando el fallo parece transitorio (`rate_limit`, `overloaded` o desconocido). Esto es especialmente relevante cuando un límite de tasa se aplica por modelo y otro modelo puede recuperarse inmediatamente.
    - Los sondeos durante tiempos de espera transitorios se limitan a uno por proveedor en cada ejecución de alternativas, para que un solo proveedor no bloquee la conmutación entre proveedores.

  </Accordion>
</AccordionGroup>

## Sustituciones de sesión y cambio de modelo en vivo

Los cambios de modelo de la sesión forman parte del estado compartido. El ejecutor activo, el comando `/model`, las actualizaciones de Compaction o de sesión y la conciliación de sesiones en vivo leen o escriben partes de la misma entrada de sesión.

Esto significa que los reintentos mediante alternativas deben coordinarse con el cambio de modelo en vivo:

- Solo los cambios de modelo explícitos iniciados por el usuario marcan un cambio en vivo pendiente. Esto incluye `/model`, `session_status(model=...)` y `sessions.patch`.
- Los cambios de modelo iniciados por el sistema, como el cambio a una alternativa, las sustituciones de Heartbeat o la Compaction, nunca marcan por sí mismos un cambio en vivo pendiente.
- Las sustituciones de modelo iniciadas por el usuario se tratan como selecciones exactas para la política de alternativas, por lo que un proveedor seleccionado que no esté disponible se muestra como un fallo en lugar de quedar oculto por `agents.defaults.model.fallbacks`.
- Antes de iniciar un reintento con una alternativa, el ejecutor de respuestas conserva los campos de sustitución de la alternativa seleccionada en la entrada de sesión.
- Las sustituciones alternativas automáticas permanecen seleccionadas en los turnos posteriores para que OpenClaw no sondee un modelo principal que se sabe que falla en cada mensaje. OpenClaw vuelve a sondear periódicamente el origen configurado y elimina la sustitución automática cuando se recupera; `/new`, `/reset` y `sessions.reset` eliminan inmediatamente las sustituciones de origen automático.
- Las respuestas al usuario anuncian las transiciones a alternativas y la recuperación tras dejar de usar una alternativa una vez por cada cambio de estado. Los turnos que mantienen la alternativa no repiten el aviso.
- `/status` muestra el modelo seleccionado y, cuando el estado de la alternativa es diferente, el modelo alternativo activo y el motivo.
- La conciliación de sesiones en vivo da preferencia a las sustituciones persistidas de la sesión frente a los campos obsoletos del modelo en tiempo de ejecución.
- Si un error de cambio en vivo apunta a un candidato posterior de la cadena alternativa activa, OpenClaw salta directamente a ese modelo seleccionado en lugar de recorrer primero candidatos no relacionados.
- Si falla el intento con la alternativa, el ejecutor revierte únicamente los campos de sustitución que escribió, y solo si todavía coinciden con ese candidato fallido.

Esto evita la condición de carrera clásica:

<Steps>
  <Step title="Falla el modelo principal">
    Falla el modelo principal seleccionado.
  </Step>
  <Step title="Alternativa elegida en memoria">
    Se elige en memoria el candidato alternativo.
  </Step>
  <Step title="El almacén de sesiones aún indica el modelo principal anterior">
    El almacén de sesiones todavía refleja el modelo principal anterior.
  </Step>
  <Step title="La conciliación en vivo lee un estado obsoleto">
    La conciliación de sesiones en vivo lee el estado obsoleto de la sesión.
  </Step>
  <Step title="El reintento vuelve al modelo anterior">
    El reintento vuelve bruscamente al modelo anterior antes de que comience el intento con la alternativa.
  </Step>
</Steps>

La sustitución alternativa persistida cierra ese intervalo, y la reversión limitada mantiene intactos los cambios manuales o de tiempo de ejecución más recientes de la sesión.

## Observabilidad y resúmenes de fallos

`runWithModelFallback(...)` registra los detalles de cada intento que alimentan los registros y los mensajes de tiempo de espera dirigidos al usuario:

- proveedor/modelo que se intentó
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` y motivos de conmutación por error similares)
- estado/código opcional
- resumen del error legible para humanos

Los registros estructurados `model_fallback_decision` también incluyen campos planos `fallbackStep*` cuando un candidato falla, se omite o una conmutación por error posterior tiene éxito. Estos campos hacen explícita la transición intentada (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), de modo que los exportadores de registros y diagnósticos puedan reconstruir el fallo principal incluso cuando la conmutación por error final también falla.

Cuando fallan todos los candidatos, OpenClaw lanza `FallbackSummaryError`. El ejecutor externo de respuestas puede usarlo para crear un mensaje más específico, como «todos los modelos están temporalmente limitados por tasa», e incluir el vencimiento más próximo del tiempo de espera cuando se conozca.

Ese resumen del tiempo de espera tiene en cuenta el modelo:

- se ignoran los límites de tasa con alcance de modelo no relacionados con la cadena de proveedor/modelo intentada
- si el bloqueo restante es un límite de tasa con alcance de modelo que coincide, OpenClaw informa del último vencimiento coincidente que aún bloquea ese modelo

## Configuración relacionada

Consulte [Configuración del Gateway](/es/gateway/configuration) para obtener información sobre:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- enrutamiento de `agents.defaults.imageModel`

Consulte [Modelos](/es/concepts/models) para obtener una descripción general más amplia de la selección de modelos y la conmutación por error.
