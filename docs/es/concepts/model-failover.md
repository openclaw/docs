---
read_when:
    - Diagnóstico de la rotación de perfiles de autenticación, los tiempos de espera o el comportamiento de repliegue del modelo
    - Actualizar reglas de conmutación por error para perfiles de autenticación o modelos
    - Comprender cómo las anulaciones del modelo de sesión interactúan con los reintentos de reserva
sidebarTitle: Model failover
summary: Cómo OpenClaw rota perfiles de autenticación y recurre a modelos alternativos
title: Conmutación por error del modelo
x-i18n:
    generated_at: "2026-07-05T11:13:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gestiona los fallos en dos etapas:

1. **Rotación de perfiles de autenticación** dentro del proveedor actual.
2. **Modelo de respaldo** al siguiente modelo en `agents.defaults.model.fallbacks`.

## Flujo de ejecución

<Steps>
  <Step title="Resolver el estado de la sesión">
    Resuelve el modelo de sesión activo y la preferencia de perfil de autenticación.
  </Step>
  <Step title="Construir la cadena de candidatos">
    Construye la cadena de modelos candidatos a partir de la selección de modelo actual y la política de respaldo para la fuente de esa selección. Los valores predeterminados configurados, los primarios de trabajos cron y los modelos de respaldo seleccionados automáticamente pueden usar respaldos configurados; las selecciones explícitas de sesión del usuario son estrictas.
  </Step>
  <Step title="Probar el proveedor actual">
    Prueba el proveedor actual con las reglas de rotación/enfriamiento de perfiles de autenticación.
  </Step>
  <Step title="Avanzar ante errores que justifican conmutación">
    Si ese proveedor se agota con un error que justifica la conmutación, pasa al siguiente modelo candidato.
  </Step>
  <Step title="Persistir la anulación de respaldo">
    Persiste la anulación de respaldo seleccionada antes de que empiece el reintento, para que otros lectores de la sesión vean el mismo proveedor/modelo que el ejecutor está a punto de usar. La anulación de modelo persistida se marca como `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Revertir de forma acotada ante fallo">
    Si el candidato de respaldo falla, revierte solo los campos de anulación de sesión propiedad del respaldo cuando todavía coincidan con ese candidato fallido.
  </Step>
  <Step title="Lanzar FallbackSummaryError si se agota">
    Si todos los candidatos fallan, lanza un `FallbackSummaryError` con detalles por intento y el vencimiento de enfriamiento más cercano cuando se conozca.
  </Step>
</Steps>

Esto es deliberadamente más acotado que "guardar y restaurar toda la sesión". El ejecutor de respuestas solo persiste los campos de selección de modelo que posee para el respaldo: `providerOverride`, `modelOverride`, `modelOverrideSource`, `authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`. Eso evita que un reintento de respaldo fallido sobrescriba mutaciones de sesión más recientes y no relacionadas, como un cambio manual de `/model` o una actualización de rotación de sesión que ocurrió mientras el intento estaba en ejecución.

## Política de fuente de selección

La fuente de selección controla si se permite la cadena de respaldo:

- **Valor predeterminado configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Primario del agente**: `agents.list[].model` es estricto salvo que el objeto de modelo de ese agente incluya sus propios `fallbacks`. Usa `fallbacks: []` para hacer explícito el comportamiento estricto, o una lista no vacía para incorporar ese agente al respaldo de modelo.
- **Anulación automática de respaldo**: un respaldo en tiempo de ejecución escribe `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` y el modelo de origen seleccionado antes de reintentar. Esta anulación sigue recorriendo la cadena de respaldos configurada sin sondear el primario en cada mensaje, pero OpenClaw sondea el origen configurado cada 5 minutos (no configurable) y borra la anulación cuando se recupera. `/new`, `/reset` y `sessions.reset` también borran las anulaciones con origen automático. Heartbeat ejecutado sin un `heartbeat.model` explícito borra las anulaciones automáticas directas cuando su origen ya no coincide con el valor predeterminado configurado actual.
- **Anulación de sesión del usuario**: `/model`, el selector de modelo, `session_status(model=...)` y `sessions.patch` escriben `modelOverrideSource: "user"`. Esta es una selección exacta de sesión. Si el proveedor/modelo seleccionado falla antes de producir una respuesta, OpenClaw informa del fallo en lugar de responder desde un respaldo configurado no relacionado.
- **Anulación de sesión heredada**: las entradas de sesión más antiguas pueden tener `modelOverride` sin `modelOverrideSource`. OpenClaw las trata como anulaciones de usuario para que una selección antigua explícita no se convierta silenciosamente en comportamiento de respaldo.
- **Modelo de carga útil de Cron**: un trabajo cron `payload.model` / `--model` es un primario de trabajo, no una anulación de sesión del usuario. Usa respaldos configurados salvo que el trabajo proporcione `payload.fallbacks`; `payload.fallbacks: []` hace que la ejecución de Cron sea estricta.

OpenClaw recuerda los sondeos primarios recientes por sesión y modelo primario para que un primario que falla no se reintente en cada turno. Envía un aviso visible cuando una sesión pasa al respaldo y otro aviso cuando vuelve al primario seleccionado; no repite el aviso en cada turno persistente de respaldo.

## Caché de omisión de fallos de autenticación

De forma predeterminada, cada turno nuevo mantiene el comportamiento existente de reintento de respaldo: OpenClaw vuelve a intentar cada candidato de respaldo configurado, incluidos los candidatos no primarios que fallaron recientemente con `auth` o `auth_permanent`.

Actívalo para suprimir fallos de autenticación repetidos con:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Cuando está activado, OpenClaw registra un marcador de omisión en memoria y con ámbito de sesión para un candidato de respaldo no primario después de un fallo de clase de autenticación, indexado por id de sesión, proveedor y modelo. Los candidatos primarios nunca se omiten, por lo que una selección explícita de modelo del usuario sigue mostrando el error real de autenticación. La caché es local al proceso y se borra al reiniciar el Gateway.

El valor es un TTL en milisegundos. `0` o sin definir desactiva la caché. Los valores positivos se limitan entre 1 segundo y 10 minutos.

## Avisos de respaldo visibles para el usuario

Cuando una sesión pasa a un respaldo seleccionado automáticamente, OpenClaw envía un aviso de estado en la misma superficie de respuesta:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Cuando un sondeo posterior se completa correctamente y la sesión vuelve al primario seleccionado, OpenClaw envía:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Estos avisos son mensajes operativos, no contenido del asistente. Se entregan una vez por cambio de estado, incluidos los turnos solo con efectos secundarios cuando sea viable, pero los turnos persistentes de respaldo no los repiten. La entrega evita la supresión normal de respuesta de origen, no consume el primer espacio de respuesta del asistente para canales con hilos y se excluye de la conversión de texto a voz y de la extracción de compromisos.

## Almacenamiento de autenticación (claves + OAuth)

OpenClaw usa **perfiles de autenticación** tanto para claves de API como para tokens de OAuth.

- Los secretos y el estado de enrutamiento de autenticación en tiempo de ejecución viven en `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configuración `auth.profiles` / `auth.order` es **solo metadatos + enrutamiento** (sin secretos).
- Archivo OAuth heredado solo para importación: `~/.openclaw/credentials/oauth.json` (importado al almacén de autenticación por agente en el primer uso).
- Los archivos heredados `auth-profiles.json`, `auth-state.json` y `auth.json` por agente son importados por `openclaw doctor --fix`.

Más detalles: [OAuth](/es/concepts/oauth)

Tipos de credenciales:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para algunos proveedores)
- `type: "token"` → token estático de estilo bearer, con vencimiento opcional; OpenClaw no lo actualiza (usado para `aws-sdk` y otros modos de autenticación de cadena de credenciales)

## IDs de perfil

Los inicios de sesión OAuth crean perfiles distintos para que varias cuentas puedan coexistir.

- Predeterminado: `provider:default` cuando no hay correo electrónico disponible.
- OAuth con correo electrónico: `provider:<email>` (por ejemplo `google-antigravity:user@gmail.com`).

Los perfiles viven en el almacén de perfiles de autenticación `openclaw-agent.sqlite` por agente.

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
    Entradas de perfil de autenticación SQLite por agente para el proveedor.
  </Step>
</Steps>

Si no se configura un orden explícito, OpenClaw usa un orden round-robin:

- **Clave primaria:** tipo de perfil (**OAuth, luego token estático, luego clave de API**).
- **Clave secundaria:** `usageStats.lastUsed` (primero el más antiguo, dentro de cada tipo).
- Los **perfiles en enfriamiento/deshabilitados** se mueven al final, ordenados por el vencimiento más cercano.

### Persistencia de sesión (amigable con la caché)

OpenClaw **fija el perfil de autenticación elegido por sesión** para mantener calientes las cachés del proveedor. **No** rota en cada solicitud. El perfil fijado se reutiliza hasta que:

- la sesión se restablece (`/new` / `/reset`)
- se completa una Compaction (el contador de Compaction aumenta)
- el perfil está en enfriamiento/deshabilitado

La selección manual mediante `/model …@<profileId>` establece una **anulación de usuario** para esa sesión y no se rota automáticamente hasta que empieza una sesión nueva.

<Note>
Los perfiles fijados automáticamente (seleccionados por el enrutador de sesión) se tratan como una **preferencia**: se prueban primero, pero OpenClaw puede rotar a otro perfil ante límites de tasa/tiempos de espera. Cuando el perfil original vuelve a estar disponible, las nuevas ejecuciones pueden volver a preferirlo sin cambiar el modelo seleccionado ni el entorno de ejecución. Los perfiles fijados por el usuario permanecen bloqueados a ese perfil; si falla y hay respaldos de modelo configurados, OpenClaw pasa al siguiente modelo en lugar de cambiar de perfil.
</Note>

### Suscripción de OpenAI Codex más respaldo con clave de API

Para los modelos de agente de OpenAI, la autenticación y el entorno de ejecución son independientes. `openai/gpt-*` permanece en el arnés de Codex mientras la autenticación puede rotar entre un perfil de suscripción de Codex y un respaldo con clave de API de OpenAI.

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

Usa `openai:*` tanto para perfiles OAuth de ChatGPT/Codex como para perfiles con clave de API de OpenAI. Cuando la suscripción alcanza un límite de uso de Codex, OpenClaw registra la hora exacta de restablecimiento cuando Codex la proporciona, prueba el siguiente perfil de autenticación ordenado y mantiene la ejecución dentro del arnés de Codex. Una vez pasada la hora de restablecimiento, el perfil de suscripción vuelve a ser elegible y la siguiente selección automática puede volver a él.

Usa un perfil fijado por el usuario solo cuando quieras forzar una cuenta/clave para esa sesión. Los perfiles fijados por el usuario son intencionalmente estrictos y no saltan silenciosamente a otro perfil.

## Enfriamientos

Cuando un perfil falla debido a errores de autenticación/límite de tasa (o a un tiempo de espera que parece limitación de tasa), OpenClaw lo marca en enfriamiento y pasa al siguiente perfil.

<AccordionGroup>
  <Accordion title="Qué entra en el cubo de límite de tasa / tiempo de espera">
    Ese cubo de límite de tasa es más amplio que un simple `429`: también incluye mensajes del proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` y límites periódicos de ventana de uso como `weekly limit reached` o `monthly limit exhausted`.

    Los errores de formato/solicitud no válida suelen ser terminales porque reintentar la misma carga útil fallaría del mismo modo, así que OpenClaw los muestra en lugar de rotar perfiles de autenticación. Las rutas conocidas de reparación con reintento pueden activarse explícitamente: por ejemplo, los fallos de validación de ID de llamadas de herramientas de Cloud Code Assist se sanea y se reintenta una vez mediante la política `allowFormatRetry`. Los errores de motivo de detención compatibles con OpenAI, como `Unhandled stop reason: error`, `stop reason: error` y `reason: error`, se clasifican como señales de tiempo de espera/conmutación.

    El texto genérico del servidor también puede entrar en ese cubo de tiempo de espera cuando la fuente coincide con un patrón transitorio conocido. Por ejemplo, el mensaje básico del envoltorio de stream del runtime del modelo `An unknown error occurred` se trata como digno de conmutación para todos los proveedores porque el runtime compartido del modelo lo emite cuando los streams del proveedor terminan con `stopReason: "aborted"` o `stopReason: "error"` sin detalles específicos. Las cargas útiles JSON `api_error` con texto transitorio del servidor como `internal server error`, `unknown error, 520`, `upstream error` o `backend error` también se tratan como tiempos de espera que justifican conmutación.

    El texto ascendente genérico específico de OpenRouter, como un `Provider returned error` básico, se trata como tiempo de espera solo cuando el contexto del proveedor es realmente OpenRouter. El texto genérico de respaldo interno como `LLM request failed with an unknown error.` permanece conservador y no activa la conmutación por sí solo.

  </Accordion>
  <Accordion title="Límites de retry-after del SDK">
    De lo contrario, algunos SDK de proveedores pueden esperar durante una ventana larga de `Retry-After` antes de devolver el control a OpenClaw. Para SDK basados en Stainless, como Anthropic y OpenAI, OpenClaw limita de forma predeterminada las esperas internas del SDK `retry-after-ms` / `retry-after` a 60 segundos y expone de inmediato las respuestas reintentables más largas para que esta ruta de conmutación por error pueda ejecutarse. Ajusta o desactiva el límite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulta [Comportamiento de reintentos](/es/concepts/retry).
  </Accordion>
  <Accordion title="Enfriamientos con alcance de modelo">
    Los enfriamientos por límite de frecuencia también pueden tener alcance de modelo:

    - OpenClaw registra `cooldownModel` para fallos de límite de frecuencia cuando se conoce el id del modelo que falla.
    - Todavía se puede probar un modelo hermano en el mismo proveedor cuando el enfriamiento tiene alcance de un modelo distinto.
    - Las ventanas de facturación/desactivación siguen bloqueando todo el perfil en todos los modelos.

  </Accordion>
</AccordionGroup>

Los enfriamientos normales (no de facturación ni de autenticación permanente) escalan con el recuento reciente de errores del perfil:

- 1.er fallo: 30 segundos
- 2.º fallo: 1 minuto
- 3.er fallo en adelante: 5 minutos (límite)

Los contadores se restablecen una vez que ha pasado la ventana de fallos del perfil (`auth.cooldowns.failureWindowHours`, valor predeterminado 24).

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

## Desactivaciones por facturación

Los fallos de facturación/crédito (por ejemplo, "insufficient credits" / "credit balance too low") se tratan como aptos para conmutación por error, pero normalmente no son transitorios. En lugar de un enfriamiento corto, OpenClaw marca el perfil como **desactivado** (con una espera más larga) y rota al siguiente perfil/proveedor.

<Note>
No toda respuesta con forma de facturación es `402`, y no todo HTTP `402` llega aquí. OpenClaw mantiene el texto explícito de facturación en la vía de facturación incluso cuando un proveedor devuelve `401` o `403` en su lugar, pero los comparadores específicos de proveedor permanecen limitados al proveedor que los posee (por ejemplo, OpenRouter `403 Key limit exceeded`).

Mientras tanto, los errores temporales `402` de ventana de uso y límite de gasto de organización/espacio de trabajo se clasifican como `rate_limit` cuando el mensaje parece reintentable (por ejemplo, `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` u `organization spending limit exceeded`). Esos permanecen en la ruta de enfriamiento corto/conmutación por error en lugar de la ruta larga de desactivación por facturación.
</Note>

Los fallos de autenticación permanente de alta confianza (claves revocadas/desactivadas, espacios de trabajo desactivados) obtienen una vía de desactivación similar, pero se recuperan mucho antes que la facturación, ya que algunos proveedores exponen cargas con apariencia de autenticación de forma transitoria durante incidentes.

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

Valores predeterminados (`auth.cooldowns.*`):

| Clave                         | Predeterminado | Propósito                                                                   |
| ----------------------------- | -------------- | --------------------------------------------------------------------------- |
| `billingBackoffHours`         | 5              | Espera base de facturación, se duplica por cada fallo de facturación        |
| `billingMaxHours`             | 24             | Límite de espera de facturación                                             |
| `authPermanentBackoffMinutes` | 10             | Espera base para fallos de autenticación permanente de alta confianza       |
| `authPermanentMaxMinutes`     | 60             | Límite para esa espera                                                      |
| `failureWindowHours`          | 24             | Los contadores de fallos se restablecen si no ocurren fallos en esta ventana |
| `overloadedProfileRotations`  | 1              | Rotaciones de perfil del mismo proveedor permitidas antes del respaldo de modelo por sobrecarga |
| `overloadedBackoffMs`         | 0              | Demora fija antes de un reintento de rotación por sobrecarga                |
| `rateLimitedProfileRotations` | 1              | Rotaciones de perfil del mismo proveedor permitidas antes del respaldo de modelo por límite de frecuencia |

Los errores de sobrecarga y límite de frecuencia se manejan de forma más agresiva que los enfriamientos de facturación: de forma predeterminada, OpenClaw permite un reintento de perfil de autenticación del mismo proveedor y luego cambia al siguiente respaldo de modelo configurado sin esperar.

## Respaldo de modelos

Si todos los perfiles de un proveedor fallan, OpenClaw pasa al siguiente modelo en `agents.defaults.model.fallbacks`. Esto se aplica a fallos de autenticación, límites de frecuencia y tiempos de espera que agotaron la rotación de perfiles (otros errores no avanzan el respaldo). Los errores de proveedor que no exponen suficiente detalle siguen etiquetándose con precisión en el estado de respaldo: `empty_response` significa que el proveedor no devolvió ningún mensaje o estado utilizable, `no_error_details` significa que el proveedor devolvió explícitamente `Unknown error (no error details in response)`, y `unclassified` significa que OpenClaw preservó la vista previa sin procesar, pero ningún clasificador coincidió aún.

Las señales de proveedor ocupado, como `ModelNotReadyException`, aterrizan en el grupo de sobrecarga y siguen la misma política de una rotación y luego respaldo que los límites de frecuencia (consulta la tabla de valores predeterminados anterior).

Cuando una ejecución parte del primario predeterminado configurado, un primario de tarea cron, un primario de agente con respaldos explícitos o una anulación de respaldo seleccionada automáticamente, OpenClaw puede recorrer la cadena de respaldos configurada correspondiente. Los primarios de agente sin respaldos explícitos y las selecciones explícitas de usuario (por ejemplo, `/model ollama/qwen3.5:27b`, el selector de modelos, `sessions.patch` o anulaciones puntuales de proveedor/modelo de la CLI) son estrictos: si ese proveedor/modelo no está disponible o falla antes de producir una respuesta, OpenClaw informa el fallo en lugar de responder desde un respaldo no relacionado.

### Reglas de cadena de candidatos

OpenClaw construye la lista de candidatos a partir del `provider/model` solicitado actualmente más los respaldos configurados.

<AccordionGroup>
  <Accordion title="Reglas">
    - El modelo solicitado siempre va primero.
    - Los respaldos configurados explícitos se deduplican, pero no se filtran por la lista de modelos permitidos. Se tratan como intención explícita del operador.
    - Si la ejecución actual ya está en un respaldo configurado en la misma familia de proveedores, OpenClaw sigue usando la cadena configurada completa.
    - Cuando no se proporciona ninguna anulación de respaldo explícita, los respaldos configurados se prueban antes del primario configurado, incluso si el modelo solicitado usa un proveedor distinto.
    - Cuando no se proporciona ninguna anulación de respaldo explícita al ejecutor de respaldo, el primario configurado se agrega al final para que la cadena pueda volver al valor predeterminado normal una vez que se agoten los candidatos anteriores.
    - Cuando un llamador proporciona `fallbacksOverride`, el ejecutor usa exactamente el modelo solicitado más esa lista de anulación. Una lista vacía desactiva el respaldo de modelos e impide que el primario configurado se agregue como destino oculto de reintento.

  </Accordion>
</AccordionGroup>

### Qué errores avanzan el respaldo

<Tabs>
  <Tab title="Continúa con">
    - fallos de autenticación
    - límites de frecuencia y agotamiento de enfriamientos
    - errores de sobrecarga/proveedor ocupado
    - errores de conmutación por error con forma de tiempo de espera
    - desactivaciones por facturación
    - `LiveSessionModelSwitchError`, que se normaliza en una ruta de conmutación por error para que un modelo persistido obsoleto no cree un bucle de reintento externo
    - otros errores no reconocidos cuando todavía quedan candidatos restantes

  </Tab>
  <Tab title="No continúa con">
    - abortos explícitos que no tienen forma de tiempo de espera/conmutación por error
    - errores de desbordamiento de contexto que deben permanecer dentro de la lógica de Compaction/reintento (por ejemplo, `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` u `ollama error: context length exceeded`)
    - un error desconocido final cuando no quedan candidatos
    - rechazos de seguridad de Claude Fable 5; las solicitudes directas con clave de API los manejan a nivel de proveedor mediante el respaldo del lado del servidor de Anthropic a `claude-opus-4-8` en su lugar (consulta [Anthropic](/es/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Salto de enfriamiento frente a comportamiento de sondeo

Cuando todos los perfiles de autenticación de un proveedor ya están en enfriamiento, OpenClaw no omite automáticamente ese proveedor para siempre. Toma una decisión por candidato:

<AccordionGroup>
  <Accordion title="Decisiones por candidato">
    - Los fallos persistentes de autenticación omiten todo el proveedor de inmediato.
    - Las desactivaciones por facturación normalmente se omiten, pero el candidato primario aún puede sondearse con una limitación para que la recuperación sea posible sin reiniciar.
    - El candidato primario puede sondearse cerca de la expiración del enfriamiento, con una limitación por proveedor.
    - Los hermanos de respaldo del mismo proveedor pueden intentarse a pesar del enfriamiento cuando el fallo parece transitorio (`rate_limit`, `overloaded` o desconocido). Esto es especialmente relevante cuando un límite de frecuencia tiene alcance de modelo y un modelo hermano aún puede recuperarse de inmediato.
    - Los sondeos de enfriamiento transitorio se limitan a uno por proveedor por ejecución de respaldo para que un solo proveedor no bloquee el respaldo entre proveedores.

  </Accordion>
</AccordionGroup>

## Anulaciones de sesión y cambio de modelo en vivo

Los cambios de modelo de sesión son estado compartido. El ejecutor activo, el comando `/model`, las actualizaciones de Compaction/sesión y la reconciliación de sesión en vivo leen o escriben partes de la misma entrada de sesión.

Eso significa que los reintentos de respaldo tienen que coordinarse con el cambio de modelo en vivo:

- Solo los cambios de modelo explícitos impulsados por el usuario marcan un cambio en vivo pendiente. Eso incluye `/model`, `session_status(model=...)` y `sessions.patch`.
- Los cambios de modelo impulsados por el sistema, como la rotación de respaldo, las anulaciones de Heartbeat o Compaction, nunca marcan por sí solos un cambio en vivo pendiente.
- Las anulaciones de modelo impulsadas por el usuario se tratan como selecciones exactas para la política de respaldo, por lo que un proveedor seleccionado no disponible se expone como fallo en lugar de quedar oculto por `agents.defaults.model.fallbacks`.
- Antes de que comience un reintento de respaldo, el ejecutor de respuestas persiste los campos de anulación de respaldo seleccionados en la entrada de sesión.
- Las anulaciones de respaldo automáticas permanecen seleccionadas en turnos posteriores para que OpenClaw no sondee un primario conocido como defectuoso en cada mensaje. OpenClaw sondea periódicamente de nuevo el origen configurado y borra la anulación automática cuando se recupera; `/new`, `/reset` y `sessions.reset` borran de inmediato las anulaciones de origen automático.
- Las respuestas de usuario anuncian las transiciones de respaldo y la recuperación con respaldo borrado una vez por cambio de estado. Los turnos de respaldo persistente no repiten el aviso.
- `/status` muestra el modelo seleccionado y, cuando el estado de respaldo difiere, el modelo de respaldo activo y el motivo.
- La reconciliación de sesión en vivo prefiere las anulaciones de sesión persistidas sobre campos de modelo en tiempo de ejecución obsoletos.
- Si un error de cambio en vivo apunta a un candidato posterior en la cadena de respaldo activa, OpenClaw salta directamente a ese modelo seleccionado en lugar de recorrer primero candidatos no relacionados.
- Si el intento de respaldo falla, el ejecutor revierte solo los campos de anulación que escribió, y solo si aún coinciden con ese candidato fallido.

Esto evita la carrera clásica:

<Steps>
  <Step title="El primario falla">
    El modelo primario seleccionado falla.
  </Step>
  <Step title="Respaldo elegido en memoria">
    El candidato de respaldo se elige en memoria.
  </Step>
  <Step title="El almacén de sesiones aún indica el primario antiguo">
    El almacén de sesiones todavía refleja el primario antiguo.
  </Step>
  <Step title="La reconciliación en vivo lee estado obsoleto">
    La reconciliación de sesión en vivo lee el estado de sesión obsoleto.
  </Step>
  <Step title="Reintento devuelto al anterior">
    El reintento se devuelve al modelo antiguo antes de que comience el intento de respaldo.
  </Step>
</Steps>

La anulación de respaldo persistida cierra esa ventana, y la reversión estrecha mantiene intactos los cambios manuales o de sesión en tiempo de ejecución más recientes.

## Observabilidad y resúmenes de fallos

`runWithModelFallback(...)` registra detalles por intento que alimentan los registros y los mensajes de enfriamiento visibles para el usuario:

- proveedor/modelo intentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` y motivos de conmutación por error similares)
- estado/código opcional
- resumen del error legible por humanos

Los registros estructurados `model_fallback_decision` también incluyen campos planos `fallbackStep*` cuando un candidato falla, se omite o una conmutación por error posterior tiene éxito. Estos campos hacen explícita la transición intentada (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) para que los exportadores de registros y diagnósticos puedan reconstruir el fallo principal incluso cuando la conmutación por error terminal también falla.

Cuando todos los candidatos fallan, OpenClaw lanza `FallbackSummaryError`. El ejecutor externo de respuestas puede usarlo para crear un mensaje más específico, como "todos los modelos tienen límites de tasa temporales", e incluir el vencimiento del enfriamiento más próximo cuando se conozca.

Ese resumen de enfriamiento tiene en cuenta el modelo:

- los límites de tasa con ámbito de modelo no relacionados se ignoran para la cadena de proveedor/modelo intentada
- si el bloqueo restante es un límite de tasa con ámbito de modelo coincidente, OpenClaw informa el último vencimiento coincidente que todavía bloquea ese modelo

## Configuración relacionada

Consulta [Configuración de Gateway](/es/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- enrutamiento de `agents.defaults.imageModel`

Consulta [Modelos](/es/concepts/models) para obtener una descripción general más amplia de la selección de modelos y la conmutación por error.
