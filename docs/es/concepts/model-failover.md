---
read_when:
    - Diagnóstico de la rotación de perfiles de autenticación, los períodos de espera o el comportamiento de reserva del modelo
    - Actualización de las reglas de conmutación por error para perfiles de autenticación o modelos
    - Comprender cómo interactúan las anulaciones del modelo de sesión con los reintentos de respaldo
sidebarTitle: Model failover
summary: Cómo OpenClaw rota los perfiles de autenticación y recurre a modelos alternativos
title: Conmutación por error del modelo
x-i18n:
    generated_at: "2026-07-20T00:47:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e520ed160969b57bd50c2ed647ff7c0e60ec19ab983db226241b6301dafb503d
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gestiona los fallos en dos etapas:

1. **Rotación de perfiles de autenticación** dentro del proveedor actual.
2. **Cambio al modelo de respaldo** al siguiente modelo en `agents.defaults.model.fallbacks`.

## Flujo de ejecución

<Steps>
  <Step title="Resolver el estado de la sesión">
    Resuelve el modelo activo de la sesión y la preferencia de perfil de autenticación.
  </Step>
  <Step title="Crear la cadena de candidatos">
    Crea la cadena de modelos candidatos a partir de la selección de modelo actual y la política de respaldo correspondiente al origen de esa selección. Los valores predeterminados configurados, los modelos principales de tareas cron y los modelos de respaldo seleccionados automáticamente pueden usar los respaldos configurados; las selecciones explícitas de la sesión del usuario son estrictas.
  </Step>
  <Step title="Probar el proveedor actual">
    Prueba el proveedor actual con las reglas de rotación y tiempo de espera de los perfiles de autenticación.
  </Step>
  <Step title="Avanzar ante errores que justifican la conmutación por error">
    Si se agota ese proveedor con un error que justifica la conmutación por error, pasa al siguiente modelo candidato.
  </Step>
  <Step title="Usar el respaldo para el turno actual">
    Ejecuta el candidato de respaldo que funcione sin cambiar el proveedor ni el modelo seleccionados para la sesión.
  </Step>
  <Step title="Reintentar el agotamiento por sobrecarga sin efectos secundarios">
    Si todos los candidatos fallan únicamente porque los proveedores están sobrecargados, vuelve a intentar la cadena local completa del turno hasta 10 veces con espera exponencial, siempre que no se haya iniciado ninguna ejecución de herramientas ni salida del asistente. Después de 30 segundos, envía un único aviso de estado para que el usuario no se quede esperando sin información.
  </Step>
  <Step title="Lanzar FallbackSummaryError si se agotan las opciones">
    Si todos los candidatos fallan, lanza un `FallbackSummaryError` con los detalles de cada intento y el vencimiento más próximo del tiempo de espera, si se conoce alguno.
  </Step>
</Steps>

La ejecución del respaldo es local al turno. El ejecutor de respuestas solo conserva el estado de los avisos de respaldo para que `/status` y los avisos de transición puedan distinguir el modelo seleccionado del modelo que respondió; no conserva el respaldo como selección de modelo para el siguiente turno.

## Política del origen de la selección

El origen de la selección determina si se permite la cadena de respaldo:

- **Valor predeterminado configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Modelo principal del agente**: `agents.list[].model` es estricto, salvo que el objeto de modelo de ese agente incluya su propio `fallbacks`. Usa `fallbacks: []` para hacer explícito el comportamiento estricto o una lista no vacía para permitir que ese agente use modelos de respaldo.
- **Respaldo en tiempo de ejecución**: el candidato de respaldo solo se aplica al turno actual. El turno siguiente vuelve a comenzar con el modelo principal seleccionado. OpenClaw sigue reconociendo las entradas `modelOverrideSource: "auto"` almacenadas anteriormente, comprueba su origen configurado cada 5 minutos y las elimina cuando el origen se recupera. `/new`, `/reset` y `sessions.reset` también eliminan esas entradas.
- **Anulación de la sesión por el usuario**: `/model`, el selector de modelos, `session_status(model=...)` y `sessions.patch` escriben `modelOverrideSource: "user"`. Esta es una selección de sesión exacta. Si el proveedor o modelo seleccionado falla antes de producir una respuesta, OpenClaw informa del fallo en lugar de responder desde un respaldo configurado que no esté relacionado.
- **Anulación de sesión heredada**: las entradas de sesión antiguas pueden tener `modelOverride` sin `modelOverrideSource`. OpenClaw las trata como anulaciones del usuario para que una selección antigua explícita no se convierta silenciosamente en un comportamiento de respaldo.
- **Modelo de la carga útil de Cron**: `payload.model` / `--model` de una tarea cron es el modelo principal de la tarea, no una anulación de la sesión por el usuario. Usa los respaldos configurados, salvo que la tarea proporcione `payload.fallbacks`; `payload.fallbacks: []` hace que la ejecución de cron sea estricta.

OpenClaw envía un aviso visible cuando un turno pasa a usar un respaldo y otro cuando un turno posterior funciona correctamente con el modelo principal seleccionado. El estado de avisos conservado evita avisos repetidos cuando varios turnos consecutivos usan el mismo par seleccionado/activo, mientras que la propia selección del modelo permanece sin cambios.

## Caché de omisión de fallos de autenticación

De forma predeterminada, cada turno nuevo mantiene el comportamiento existente de reintento de respaldos: OpenClaw vuelve a intentar cada candidato de respaldo configurado, incluidos los candidatos no principales que hayan fallado recientemente con `auth` o `auth_permanent`.

Para evitar la repetición de fallos de autenticación, habilita:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Cuando está habilitada, OpenClaw registra en memoria un marcador de omisión limitado a la sesión para un candidato de respaldo no principal después de un fallo de la clase de autenticación, identificado por el ID de sesión, el proveedor y el modelo. Los candidatos principales nunca se omiten, por lo que una selección explícita de modelo por parte del usuario sigue mostrando el error de autenticación real. La caché es local al proceso y se borra al reiniciar el Gateway.

El valor es un TTL en milisegundos. `0` o la ausencia del valor deshabilitan la caché. Los valores positivos se limitan a un intervalo de entre 1 segundo y 10 minutos.

## Avisos de respaldo visibles para el usuario

Cuando una sesión pasa a un respaldo seleccionado automáticamente, OpenClaw envía un aviso de estado en la misma superficie de respuesta:

```text
↪️ Respaldo de modelo: <fallback> (seleccionado <primary>; <reason>)
```

Cuando una comprobación posterior funciona correctamente y la sesión vuelve al modelo principal seleccionado, OpenClaw envía:

```text
↪️ Respaldo de modelo desactivado: <primary> (era <fallback>)
```

Estos avisos son mensajes operativos, no contenido del asistente. Se entregan una vez por cada cambio de estado, incluidos, cuando sea posible, los turnos que solo produzcan efectos secundarios, pero las transiciones repetidas al respaldo local del turno no hacen que vuelvan a enviarse. La entrega elude la supresión normal de respuestas al origen, no consume el primer espacio de respuesta del asistente en los canales con hilos y se excluye de la conversión de texto a voz y de la extracción de compromisos.

## Almacenamiento de autenticación (claves + OAuth)

OpenClaw usa **perfiles de autenticación** tanto para claves de API como para tokens OAuth.

- Los secretos y el estado de enrutamiento de autenticación en tiempo de ejecución se encuentran en `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Las opciones de configuración `auth.profiles` / `auth.order` contienen **solo metadatos y enrutamiento** (sin secretos).
- Archivo OAuth heredado solo para importación: `~/.openclaw/credentials/oauth.json` (se importa en el almacén de autenticación por agente al usarlo por primera vez).
- Los archivos heredados `auth-profiles.json`, `auth-state.json` y los archivos `auth.json` por agente se importan mediante `openclaw doctor --fix`.

Más información: [OAuth](/es/concepts/oauth)

Tipos de credenciales:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para algunos proveedores)
- `type: "token"` → token estático de tipo portador, con vencimiento opcional; OpenClaw no lo renueva (se usa para `aws-sdk` y otros modos de autenticación mediante cadenas de credenciales)

## ID de perfiles

Los inicios de sesión OAuth crean perfiles distintos para que puedan coexistir varias cuentas.

- Valor predeterminado: `provider:default` cuando no hay ninguna dirección de correo electrónico disponible.
- OAuth con correo electrónico: `provider:<email>` (por ejemplo, `google-antigravity:user@gmail.com`).

Los perfiles se encuentran en el almacén de perfiles de autenticación `openclaw-agent.sqlite` por agente.

## Orden de rotación

Cuando un proveedor tiene varios perfiles, OpenClaw elige un orden de la siguiente manera:

<Steps>
  <Step title="Configuración explícita">
    `auth.order[provider]` (si se ha establecido).
  </Step>
  <Step title="Perfiles configurados">
    `auth.profiles` filtrados por proveedor.
  </Step>
  <Step title="Perfiles almacenados">
    Entradas de perfiles de autenticación SQLite por agente para el proveedor.
  </Step>
</Steps>

Si no se configura un orden explícito, OpenClaw usa un orden circular:

- **Clave principal:** tipo de perfil (**OAuth, después token estático y, por último, clave de API**).
- **Clave secundaria para OAuth:** perfiles con un token de acceso utilizable actualmente antes que
  los perfiles cuyo token de acceso haya vencido. Los perfiles OAuth vencidos siguen siendo aptos para que
  el entorno de ejecución pueda renovarlos cuando no haya ningún perfil equivalente utilizable disponible.
- **Clave siguiente:** `usageStats.lastUsed` (los más antiguos primero, dentro de cada nivel de tipo/estado).
- Los **perfiles en tiempo de espera o deshabilitados** se desplazan al final, ordenados por el vencimiento más próximo.

### Persistencia en la sesión (favorable para la caché)

OpenClaw **fija el perfil de autenticación elegido para cada sesión** a fin de mantener activas las cachés del proveedor. **No** rota en cada solicitud. El perfil fijado se reutiliza hasta que:

- se restablece la sesión (`/new` / `/reset`)
- finaliza una Compaction (aumenta el contador de Compaction)
- el perfil entra en tiempo de espera o se deshabilita

La selección manual mediante `/model …@<profileId>` establece una **anulación del usuario** para esa sesión y no rota automáticamente hasta que comienza una nueva sesión.

<Note>
Los perfiles fijados automáticamente (seleccionados por el enrutador de sesiones) se tratan como una **preferencia**: se prueban primero, pero OpenClaw puede rotar a otro perfil debido a límites de solicitudes o tiempos de espera. Cuando el perfil original vuelve a estar disponible, las nuevas ejecuciones pueden volver a darle preferencia sin cambiar el modelo seleccionado ni el entorno de ejecución. Los perfiles fijados por el usuario permanecen bloqueados en ese perfil; si falla y hay modelos de respaldo configurados, OpenClaw pasa al siguiente modelo en lugar de cambiar de perfil.
</Note>

### Suscripción a OpenAI Codex con respaldo mediante clave de API

En los modelos de agentes de OpenAI, la autenticación y el entorno de ejecución son independientes. `openai/gpt-*` permanece en el entorno de Codex mientras la autenticación puede rotar entre un perfil de suscripción de Codex y un respaldo mediante clave de API de OpenAI.

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

Usa `openai:*` tanto para los perfiles OAuth de ChatGPT/Codex como para los perfiles de claves de API de OpenAI. Cuando la suscripción alcanza un límite de uso de Codex, OpenClaw registra la hora exacta de restablecimiento cuando Codex proporciona una, prueba el siguiente perfil de autenticación ordenado y mantiene la ejecución dentro del entorno de Codex. Una vez transcurrida la hora de restablecimiento, el perfil de suscripción vuelve a ser apto y la siguiente selección automática puede volver a él.

Usa un perfil fijado por el usuario solo cuando se quiera forzar una cuenta o clave para esa sesión. Los perfiles fijados por el usuario son intencionadamente estrictos y no pasan silenciosamente a otro perfil.

## Tiempos de espera

Cuando un perfil falla debido a errores de autenticación o de límite de solicitudes (o a un tiempo de espera que parece un límite de solicitudes), OpenClaw lo marca en tiempo de espera y pasa al perfil siguiente.

<AccordionGroup>
  <Accordion title="Qué se incluye en la categoría de límite de solicitudes o tiempo de espera">
    Esa categoría de límite de solicitudes es más amplia que un simple `429`: también incluye mensajes del proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` y límites periódicos de ventanas de uso como `weekly limit reached` o `monthly limit exhausted`.

    Los errores de formato o de solicitud no válida suelen ser terminales porque reintentar la misma carga útil produciría el mismo fallo, por lo que OpenClaw los muestra en lugar de rotar los perfiles de autenticación. Las rutas conocidas de reparación mediante reintento pueden habilitarse explícitamente: por ejemplo, los fallos de validación del ID de llamada a herramientas de Cloud Code Assist se depuran y se reintentan una vez mediante la política `allowFormatRetry`. Los errores de motivo de detención compatibles con OpenAI, como `Unhandled stop reason: error`, `stop reason: error` y `reason: error`, se clasifican como señales de tiempo de espera o conmutación por error.

    El texto genérico del servidor también puede incluirse en esa categoría de tiempo de espera cuando el origen coincide con un patrón transitorio conocido. Por ejemplo, el mensaje básico del contenedor de flujos del entorno de ejecución del modelo `An unknown error occurred` se considera motivo de conmutación por error para todos los proveedores porque el entorno de ejecución compartido del modelo lo emite cuando los flujos del proveedor terminan con `stopReason: "aborted"` o `stopReason: "error"` sin detalles específicos. Las cargas útiles JSON `api_error` con texto transitorio del servidor como `internal server error`, `unknown error, 520`, `upstream error` o `backend error` también se consideran tiempos de espera que justifican la conmutación por error.

    El texto genérico ascendente específico de OpenRouter, como `Provider returned error` sin más información, se considera un tiempo de espera únicamente cuando el contexto del proveedor es realmente OpenRouter. El texto genérico de respaldo interno como `LLM request failed with an unknown error.` mantiene un comportamiento conservador y no activa por sí solo la conmutación por error.

  </Accordion>
  <Accordion title="Límites de retry-after del SDK">
    De lo contrario, algunos SDK de proveedores pueden quedar en espera durante un intervalo largo de `Retry-After` antes de devolver el control a OpenClaw. Para los SDK basados en Stainless, como los de Anthropic y OpenAI, OpenClaw limita de forma predeterminada a 60 segundos las esperas internas del SDK de `retry-after-ms` / `retry-after` y expone inmediatamente las respuestas reintentables más largas para que pueda ejecutarse esta ruta de conmutación por error. Ajuste o desactive el límite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulte [Comportamiento de los reintentos](/es/concepts/retry).
  </Accordion>
  <Accordion title="Tiempos de espera por modelo">
    Los tiempos de espera por límite de velocidad también pueden aplicarse por modelo:

    - OpenClaw registra `cooldownModel` para los fallos por límite de velocidad cuando se conoce el identificador del modelo que falla.
    - Todavía se puede probar un modelo relacionado del mismo proveedor cuando el tiempo de espera se aplica a otro modelo.
    - Los intervalos de facturación/desactivación siguen bloqueando todo el perfil en todos los modelos.

  </Accordion>
</AccordionGroup>

Los tiempos de espera normales (no relacionados con facturación ni con autenticación permanente) aumentan según el número de errores recientes del perfil:

- 1.er fallo: 30 segundos
- 2.º fallo: 1 minuto
- 3.er fallo y posteriores: 5 minutos (límite)

Los contadores se restablecen una vez transcurrido el intervalo de fallos integrado del perfil.

El estado se almacena en el estado de autenticación SQLite de cada agente, en `usageStats`:

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

Los fallos de facturación/crédito (por ejemplo, "créditos insuficientes" / "saldo de crédito demasiado bajo") se consideran aptos para la conmutación por error, pero normalmente no son transitorios. En lugar de un tiempo de espera breve, OpenClaw marca el perfil como **desactivado** (con un retroceso más largo) y rota al siguiente perfil/proveedor.

<Note>
No todas las respuestas con apariencia de error de facturación son `402`, ni todos los errores HTTP `402` llegan aquí. OpenClaw mantiene el texto explícito de facturación en la categoría de facturación incluso cuando un proveedor devuelve `401` o `403` en su lugar, pero los patrones de coincidencia específicos de cada proveedor permanecen limitados al proveedor al que pertenecen (por ejemplo, `403 Key limit exceeded` de OpenRouter).

Mientras tanto, los errores temporales de ventana de uso de `402` y de límite de gasto de la organización/espacio de trabajo se clasifican como `rate_limit` cuando el mensaje parece reintentable (por ejemplo, `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` o `organization spending limit exceeded`). Estos permanecen en la ruta de tiempo de espera breve/conmutación por error, en lugar de seguir la ruta de desactivación prolongada por facturación.
</Note>

Los fallos de autenticación permanentes con un alto grado de certeza (claves revocadas/desactivadas, espacios de trabajo desactivados) siguen una categoría de desactivación similar, pero se recuperan mucho antes que los de facturación, ya que algunos proveedores muestran de forma transitoria cargas útiles con apariencia de error de autenticación durante incidentes.

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

Los errores de sobrecarga y de límite de velocidad se gestionan de forma más agresiva que los tiempos de espera por facturación: de forma predeterminada, OpenClaw permite un reintento con un perfil de autenticación del mismo proveedor y, a continuación, cambia al siguiente modelo alternativo configurado sin esperar.

## Modelo alternativo

Si fallan todos los perfiles de un proveedor, OpenClaw pasa al siguiente modelo de `agents.defaults.model.fallbacks`. Esto se aplica a los fallos de autenticación, los límites de velocidad y los tiempos de espera agotados tras la rotación de perfiles (otros errores no hacen avanzar la conmutación por error). Los errores del proveedor que no exponen suficiente información se etiquetan aun así con precisión en el estado de conmutación por error: `empty_response` significa que el proveedor no devolvió ningún mensaje o estado utilizable; `no_error_details` significa que el proveedor devolvió explícitamente `Unknown error (no error details in response)`; y `unclassified` significa que OpenClaw conservó la vista previa sin procesar, pero todavía no coincidió con ningún clasificador.

Las señales de proveedor ocupado, como `ModelNotReadyException`, se incluyen en la categoría de sobrecarga y siguen la misma política de una rotación seguida de conmutación por error que los límites de velocidad (consulte la tabla de valores predeterminados anterior).

Si toda la cadena de candidatos se agota únicamente por fallos de sobrecarga, el ejecutor de respuestas reintenta la cadena hasta 10 veces en el mismo turno. El reintento del turno completo solo se permite antes de que comience la ejecución de herramientas o la salida del asistente, para evitar mutaciones o mensajes duplicados si se produce una sobrecarga después de un trabajo observable. El retroceso comienza en 2.5 segundos y se duplica hasta alcanzar un límite de 30 segundos. Cuando el turno lleva 30 segundos esperando, OpenClaw envía un único aviso de estado transitorio: `The AI service is temporarily overloaded. I’m still retrying; this may take a few minutes.` El reintento y cualquier candidato alternativo que resulte seleccionado permanecen limitados al turno; los errores transitorios normales del servidor conservan su política independiente de un solo reintento.

Cuando una ejecución comienza desde el modelo principal predeterminado configurado, el modelo principal de una tarea cron, el modelo principal de un agente con alternativas explícitas o una sustitución alternativa seleccionada automáticamente, OpenClaw puede recorrer la cadena de alternativas configurada correspondiente. Los modelos principales de agentes sin alternativas explícitas y las selecciones explícitas del usuario (por ejemplo, `/model ollama/qwen3.5:27b`, el selector de modelos, `sessions.patch` o las sustituciones puntuales de proveedor/modelo mediante la CLI) son estrictos: si no se puede acceder a ese proveedor/modelo o este falla antes de generar una respuesta, OpenClaw informa del fallo en lugar de responder mediante una alternativa no relacionada.

### Reglas de la cadena de candidatos

OpenClaw crea la lista de candidatos a partir del `provider/model` solicitado actualmente más las alternativas configuradas.

<AccordionGroup>
  <Accordion title="Reglas">
    - El modelo solicitado siempre aparece primero.
    - Las alternativas configuradas explícitamente se deduplican, pero no se filtran mediante la lista de modelos permitidos. Se consideran una intención explícita del operador.
    - Si la ejecución actual ya utiliza una alternativa configurada de la misma familia de proveedores, OpenClaw continúa usando toda la cadena configurada.
    - Cuando no se proporciona una sustitución alternativa explícita, se prueban las alternativas configuradas antes que el modelo principal configurado, incluso si el modelo solicitado utiliza un proveedor diferente.
    - Cuando no se proporciona una sustitución alternativa explícita al ejecutor de conmutación por error, el modelo principal configurado se añade al final para que la cadena pueda volver al valor predeterminado normal una vez agotados los candidatos anteriores.
    - Cuando un invocador proporciona `fallbacksOverride`, el ejecutor utiliza exactamente el modelo solicitado más esa lista de sustitución. Una lista vacía desactiva los modelos alternativos e impide que el modelo principal configurado se añada como destino de reintento oculto.

  </Accordion>
</AccordionGroup>

### Errores que hacen avanzar la conmutación por error

<Tabs>
  <Tab title="Continúa con">
    - fallos de autenticación
    - límites de velocidad y agotamiento del tiempo de espera
    - errores de sobrecarga/proveedor ocupado
    - errores de conmutación por error con apariencia de tiempo de espera agotado
    - desactivaciones por facturación
    - `LiveSessionModelSwitchError`, que se normaliza en una ruta de conmutación por error para que un modelo obsoleto conservado no genere un bucle de reintento externo
    - otros errores no reconocidos cuando aún quedan candidatos

  </Tab>
  <Tab title="No continúa con">
    - cancelaciones explícitas que no tienen apariencia de tiempo de espera agotado/conmutación por error
    - errores de desbordamiento de contexto que deben permanecer dentro de la lógica de Compaction/reintento (por ejemplo, `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` o `ollama error: context length exceeded`)
    - un error final desconocido cuando no quedan candidatos
    - rechazos de seguridad de Claude Fable 5; las solicitudes directas mediante clave de API los gestionan en el nivel del proveedor mediante la conmutación por error del servidor de Anthropic a `claude-opus-4-8` (consulte [Anthropic](/es/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Comportamiento al omitir un tiempo de espera frente a realizar una prueba

Cuando todos los perfiles de autenticación de un proveedor ya están en tiempo de espera, OpenClaw no omite automáticamente ese proveedor para siempre. Toma una decisión por candidato:

<AccordionGroup>
  <Accordion title="Decisiones por candidato">
    - Los fallos de autenticación persistentes hacen que se omita inmediatamente todo el proveedor.
    - Las desactivaciones por facturación normalmente hacen que se omita, pero el candidato principal aún puede probarse con una limitación de frecuencia para permitir la recuperación sin reiniciar.
    - El candidato principal puede probarse cerca del vencimiento del tiempo de espera, con una limitación por proveedor.
    - Se pueden probar alternativas relacionadas del mismo proveedor a pesar del tiempo de espera cuando el fallo parece transitorio (`rate_limit`, `overloaded` o desconocido). Esto es especialmente relevante cuando un límite de velocidad se aplica por modelo y otro modelo relacionado puede recuperarse inmediatamente.
    - Las pruebas durante tiempos de espera transitorios se limitan a una por proveedor en cada ejecución de conmutación por error, para que un solo proveedor no bloquee la conmutación entre proveedores.

  </Accordion>
</AccordionGroup>

## Sustituciones de sesión y cambio de modelo en vivo

Los cambios de modelo de la sesión son un estado compartido. El ejecutor activo, el comando `/model`, las actualizaciones de Compaction/sesión y la conciliación de sesiones en vivo leen o escriben partes de la misma entrada de sesión. La ejecución de la conmutación por error no escribe campos de selección de modelo, por lo que no puede sustituir una selección manual más reciente mientras realiza reintentos.

El cambio de modelo en vivo sigue estas reglas:

- Solo los cambios de modelo explícitos iniciados por el usuario marcan un cambio en vivo pendiente. Esto incluye `/model`, `session_status(model=...)` y `sessions.patch`.
- Los cambios de modelo iniciados por el sistema, como la rotación por conmutación por error, las sustituciones de Heartbeat o Compaction, nunca marcan por sí solos un cambio en vivo pendiente.
- Las sustituciones de modelo iniciadas por el usuario se consideran selecciones exactas para la política de conmutación por error, por lo que un proveedor seleccionado que no esté disponible se muestra como un fallo en lugar de quedar oculto por `agents.defaults.model.fallbacks`.
- Los candidatos alternativos del entorno de ejecución permanecen limitados al turno. El siguiente turno comienza con el modelo seleccionado actualmente, incluida cualquier selección manual que se haya producido durante la ejecución anterior.
- Las sustituciones alternativas automáticas almacenadas anteriormente siguen siendo compatibles: OpenClaw prueba periódicamente su origen configurado y elimina la sustitución cuando este se recupera; `/new`, `/reset` y `sessions.reset` eliminan de inmediato las sustituciones de origen automático.
- Las respuestas al usuario anuncian las transiciones a alternativas y la recuperación tras eliminarse la alternativa una vez por cada cambio de estado. Los turnos repetidos con el mismo par seleccionado/activo no repiten el aviso.
- `/status` muestra el modelo seleccionado y, cuando el estado de conmutación por error es diferente, el modelo alternativo activo y el motivo.
- La conciliación de sesiones en vivo prioriza las sustituciones de sesión conservadas frente a los campos obsoletos de modelo del entorno de ejecución.
- Si un error de cambio en vivo apunta a un candidato posterior de la cadena de alternativas activa, OpenClaw salta directamente a ese modelo seleccionado en lugar de recorrer primero candidatos no relacionados.

La ejecución activa transporta directamente el candidato elegido. La conciliación en vivo solo cambia ese candidato cuando existe un cambio explícito pendiente iniciado por el usuario, por lo que no se necesita ninguna sustitución alternativa temporal ni reversión.

## Observabilidad y resúmenes de fallos

`runWithModelFallback(...)` registra los detalles de cada intento que alimentan los registros y los mensajes de tiempo de espera dirigidos al usuario:

- proveedor/modelo que se intentó usar
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` y motivos similares de conmutación por error)
- estado/código opcional
- resumen del error legible para personas

Los registros estructurados de `model_fallback_decision` también incluyen campos planos de `fallbackStep*` cuando un candidato falla, se omite o una alternativa posterior tiene éxito. Estos campos hacen explícita la transición que se intentó (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) para que los exportadores de registros y diagnósticos puedan reconstruir el fallo principal incluso cuando la alternativa final también falle.

Cuando fallan todos los candidatos, OpenClaw genera `FallbackSummaryError`. El ejecutor externo de respuestas puede usarlo para crear un mensaje más específico, como "todos los modelos están limitados temporalmente por velocidad", e incluir el vencimiento más próximo del tiempo de espera cuando se conoce.

Ese resumen del tiempo de espera tiene en cuenta el modelo:

- se ignoran los límites de frecuencia no relacionados y específicos del modelo para la cadena de proveedor/modelo que se intentó
- si el bloqueo restante es un límite de frecuencia específico del modelo que coincide, OpenClaw informa del último vencimiento coincidente que aún bloquea ese modelo

## Configuración relacionada

Consulte [Configuración del Gateway](/es/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- enrutamiento de `agents.defaults.imageModel`

Consulte [Modelos](/es/concepts/models) para obtener una descripción general más amplia de la selección de modelos y las alternativas.
