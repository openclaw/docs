---
read_when:
    - Programación de trabajos en segundo plano o despertares
    - Conectar disparadores externos (webhooks, Gmail) a OpenClaw
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Tareas programadas, webhooks y activadores de Gmail PubSub para el programador de Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-07-01T02:57:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el programador integrado de Gateway. Persiste trabajos, despierta al agente en el momento adecuado y puede entregar la salida de vuelta a un canal de chat o endpoint de webhook.

## Inicio rápido

<Steps>
  <Step title="Agregar un recordatorio de una sola ejecución">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Comprobar tus trabajos">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Ver el historial de ejecuciones">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cómo funciona cron

- Cron se ejecuta **dentro del proceso de Gateway** (no dentro del modelo).
- Las definiciones de trabajos, el estado de ejecución y el historial de ejecuciones persisten en la base de datos de estado SQLite compartida de OpenClaw, por lo que los reinicios no pierden programaciones.
- Al actualizar, ejecuta `openclaw doctor --fix` para importar los archivos heredados `~/.openclaw/cron/jobs.json`, `jobs-state.json` y `runs/*.jsonl` en SQLite y cambiarles el nombre con un sufijo `.migrated`. Las filas de trabajos mal formadas se omiten en tiempo de ejecución y se copian a `jobs-quarantine.json` para reparación o revisión posterior.
- `cron.store` sigue nombrando la clave lógica del almacén cron y la ruta de importación de doctor. Después de la importación, editar ese archivo JSON ya no cambia los trabajos cron activos; usa `openclaw cron add|edit|remove` o los métodos RPC de cron de Gateway.
- Todas las ejecuciones de cron crean registros de [tarea en segundo plano](/es/automation/tasks).
- Al iniciar Gateway, los trabajos de turno de agente aislado vencidos se reprograman fuera de la ventana de conexión del canal en lugar de reproducirse inmediatamente, para que el inicio de Discord/Telegram y la configuración de comandos nativos sigan respondiendo tras los reinicios.
- Los trabajos de una sola ejecución (`--at`) se eliminan automáticamente después de completarse correctamente de forma predeterminada.
- Las ejecuciones cron aisladas hacen un cierre de mejor esfuerzo de las pestañas/procesos del navegador rastreados para su sesión `cron:<jobId>` cuando se completa la ejecución, de modo que la automatización de navegador separada no deje procesos huérfanos.
- Las ejecuciones cron aisladas que reciben la concesión limitada de autolimpieza de cron aún pueden leer el estado del programador, una lista autofiltrada de su trabajo actual y el historial de ejecuciones de ese trabajo, de modo que las comprobaciones de estado/Heartbeat puedan inspeccionar su propia programación sin obtener un acceso más amplio de mutación de cron.
- Las ejecuciones cron aisladas también protegen contra respuestas de acuse de recibo obsoletas. Si el primer resultado es solo una actualización de estado provisional (`on it`, `pulling everything together` y pistas similares) y ninguna ejecución de subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de la entrega.
- Las ejecuciones cron aisladas usan metadatos estructurados de denegación de ejecución de la ejecución integrada, incluidos envoltorios `UNAVAILABLE` de host de nodo cuyo mensaje de error anidado comienza con `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`, de modo que un comando bloqueado no se notifique como una ejecución correcta mientras la prosa ordinaria del asistente no se trata como una denegación.
- Las ejecuciones cron aisladas también tratan los fallos de agente a nivel de ejecución como errores de trabajo incluso cuando no se produce una carga útil de respuesta, de modo que los fallos de modelo/proveedor incrementen los contadores de errores y activen notificaciones de fallo en lugar de marcar el trabajo como correcto.
- Cuando un trabajo de turno de agente aislado alcanza `timeoutSeconds`, cron aborta la ejecución de agente subyacente y le da una breve ventana de limpieza. Si la ejecución no se vacía, la limpieza propiedad de Gateway borra por la fuerza la propiedad de sesión de esa ejecución antes de que cron registre el tiempo de espera, de modo que el trabajo de chat en cola no quede detrás de una sesión de procesamiento obsoleta.
- Si un turno de agente aislado se bloquea antes de que se inicie el ejecutor o antes de la primera llamada al modelo, cron registra un tiempo de espera específico de fase, como `setup timed out before runner start` o `stalled before first model call (last phase: context-engine)`. Estos watchdogs cubren proveedores integrados y proveedores respaldados por CLI antes de que su proceso CLI externo se inicie realmente, y están limitados independientemente de valores largos de `timeoutSeconds` para que los fallos de arranque en frío/autenticación/contexto aparezcan rápidamente en lugar de esperar todo el presupuesto del trabajo.
- Si usas el cron del sistema u otro programador externo para ejecutar `openclaw agent`, envuélvelo con una escalada de terminación forzada aunque la CLI maneje `SIGTERM`/`SIGINT`. Las ejecuciones respaldadas por Gateway piden a Gateway que aborte las ejecuciones aceptadas; las ejecuciones locales y de respaldo integradas reciben la misma señal de aborto. Para GNU `timeout`, prefiere `timeout -k 60 600 openclaw agent ...` en lugar de `timeout 600 ...`; el valor `-k` es el respaldo del supervisor si el proceso no puede vaciarse. Para unidades systemd, mantén la misma forma usando una señal de parada `SIGTERM` más una ventana de gracia como `TimeoutStopSec` antes de cualquier terminación final. Si un reintento reutiliza un `--run-id` mientras la ejecución original de Gateway sigue activa, el duplicado se informa como en curso en lugar de iniciar una segunda ejecución.

<a id="maintenance"></a>

<Note>
La reconciliación de tareas para cron es primero propiedad del tiempo de ejecución y, en segundo lugar, respaldada por historial duradero: una tarea cron activa permanece viva mientras el runtime de cron aún rastree ese trabajo como en ejecución, incluso si todavía existe una fila antigua de sesión hija. Una vez que el runtime deja de ser propietario del trabajo y vence la ventana de gracia de 5 minutos, las comprobaciones de mantenimiento revisan los registros de ejecución persistidos y el estado del trabajo para la ejecución coincidente `cron:<jobId>:<startedAt>`. Si ese historial duradero muestra un resultado terminal, el libro mayor de tareas se finaliza a partir de él; de lo contrario, el mantenimiento propiedad de Gateway puede marcar la tarea como `lost`. La auditoría CLI sin conexión puede recuperarse desde el historial duradero, pero no trata su propio conjunto vacío de trabajos activos en proceso como prueba de que una ejecución cron propiedad de Gateway haya desaparecido.
</Note>

## Tipos de programación

| Tipo    | Marca CLI  | Descripción                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Marca de tiempo de una sola ejecución (ISO 8601 o relativa como `20m`)    |
| `every` | `--every` | Intervalo fijo                                          |
| `cron`  | `--cron`  | Expresión cron de 5 o 6 campos con `--tz` opcional |

Las marcas de tiempo sin zona horaria se tratan como UTC. Agrega `--tz America/New_York` para la programación con hora local de reloj.

Las expresiones recurrentes de inicio de hora se escalonan automáticamente hasta 5 minutos para reducir picos de carga. Usa `--exact` para forzar una temporización precisa o `--stagger 30s` para una ventana explícita.

### El día del mes y el día de la semana usan lógica OR

Las expresiones cron se analizan con [croner](https://github.com/Hexagon/croner). Cuando los campos de día del mes y día de la semana no son comodines, croner coincide cuando **cualquiera** de los campos coincide, no ambos. Este es el comportamiento estándar de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se dispara unas 5–6 veces al mes en lugar de 0–1 veces al mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para exigir ambas condiciones, usa el modificador de día de la semana `+` de Croner (`0 9 15 * +1`) o programa sobre un campo y protege el otro en el prompt o comando de tu trabajo.

## Estilos de ejecución

| Estilo           | Valor de `--session`   | Se ejecuta en                  | Ideal para                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesión principal    | `main`              | Carril dedicado de activación de cron | Recordatorios, eventos del sistema        |
| Aislado        | `isolated`          | `cron:<jobId>` dedicado | Informes, tareas en segundo plano      |
| Sesión actual | `current`           | Vinculada en el momento de la creación   | Trabajo recurrente con contexto    |
| Sesión personalizada  | `session:custom-id` | Sesión persistente con nombre | Flujos de trabajo que se basan en el historial |

<AccordionGroup>
  <Accordion title="Sesión principal vs aislada vs personalizada">
    Los trabajos de **sesión principal** encolan un evento del sistema en un carril de ejecución propiedad de cron y, opcionalmente, despiertan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Pueden usar el último contexto de entrega de la sesión principal de destino para respuestas, pero no agregan turnos cron rutinarios al carril de chat humano ni extienden la frescura de restablecimiento diario/inactivo de la sesión de destino. Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) persisten contexto entre ejecuciones, lo que habilita flujos de trabajo como reuniones diarias que se basan en resúmenes anteriores.

    Los eventos cron de sesión principal son recordatorios de eventos del sistema autocontenidos. No
    incluyen automáticamente la instrucción "Read
    HEARTBEAT.md" del prompt predeterminado de Heartbeat. Si un recordatorio recurrente debe consultar
    `HEARTBEAT.md`, dilo explícitamente en el texto del evento cron o en las
    instrucciones propias del agente.

  </Accordion>
  <Accordion title="Qué significa 'sesión nueva' para trabajos aislados">
    Para trabajos aislados, "sesión nueva" significa un nuevo identificador de transcripción/sesión para cada ejecución. OpenClaw puede llevar preferencias seguras como ajustes de pensamiento/rápido/detallado, etiquetas y anulaciones explícitas de modelo/autenticación seleccionadas por el usuario, pero no hereda contexto de conversación ambiental de una fila cron anterior: enrutamiento de canal/grupo, política de envío o cola, elevación, origen o vinculación de runtime ACP. Usa `current` o `session:<id>` cuando un trabajo recurrente deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Limpieza del runtime">
    Para trabajos aislados, el desmontaje del runtime ahora incluye limpieza de navegador de mejor esfuerzo para esa sesión cron. Los fallos de limpieza se ignoran para que el resultado cron real siga teniendo prioridad.

    Las ejecuciones cron aisladas también eliminan cualquier instancia de runtime MCP agrupada creada para el trabajo mediante la ruta compartida de limpieza de runtime. Esto coincide con cómo se desmontan los clientes MCP de sesión principal y sesión personalizada, de modo que los trabajos cron aislados no filtren procesos hijos stdio ni conexiones MCP de larga vida entre ejecuciones.

  </Accordion>
  <Accordion title="Entrega de subagente y Discord">
    Cuando las ejecuciones cron aisladas orquestan subagentes, la entrega también prefiere la salida final descendiente frente al texto provisional obsoleto del padre. Si los descendientes siguen en ejecución, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

    Para destinos de anuncio de Discord solo de texto, OpenClaw envía una vez el texto canónico final del asistente en lugar de reproducir tanto las cargas útiles de texto transmitidas/intermedias como la respuesta final. Las cargas útiles multimedia y estructuradas de Discord aún se entregan como cargas útiles separadas para que los adjuntos y componentes no se descarten.

  </Accordion>
</AccordionGroup>

### Cargas útiles de comando

Usa cargas útiles de comando para scripts deterministas que deben ejecutarse dentro del programador de Gateway sin iniciar un turno de agente aislado respaldado por modelo. Los trabajos de comando se ejecutan en el host de Gateway, capturan stdout/stderr, registran la ejecución en el historial de cron y reutilizan los mismos modos de entrega `announce`, `webhook` y `none` que los trabajos aislados.

<Note>
Command cron es una superficie de automatización de Gateway para administradores operadores, no una llamada de agente
`tools.exec`. Crear, actualizar, eliminar o ejecutar manualmente trabajos cron
requiere `operator.admin`; las ejecuciones de comando programadas posteriores se ejecutan dentro del
proceso de Gateway como esa automatización creada por el administrador. La política de exec de agente, como
`tools.exec.mode`, los prompts de aprobación y las listas de permitidos de herramientas por agente, rige las
herramientas exec visibles para el modelo, no las cargas útiles cron de comando.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` almacena `argv: ["sh", "-lc", <shell>]`. Usa `--command-argv '["node","scripts/report.mjs"]'` cuando quieras una ejecución argv exacta sin análisis de shell. Los campos opcionales `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` y `--output-max-bytes` controlan el entorno del proceso, stdin y los límites de salida.

Si stdout no está vacío, ese texto es el resultado entregado. Si stdout está vacío y stderr no está vacío, se entrega stderr. Si ambos flujos están presentes, cron entrega un pequeño bloque `stdout:` / `stderr:`. Un código de salida cero registra la ejecución como `ok`; una salida distinta de cero, una señal, un tiempo de espera o un tiempo de espera sin salida registra `error` y puede activar alertas de fallo. Un comando que imprime solo `NO_REPLY` usa la supresión normal del token silencioso de cron y no publica nada de vuelta en el chat.

### Opciones de payload para trabajos aislados

<ParamField path="--message" type="string" required>
  Texto del prompt (obligatorio para aislado).
</ParamField>
<ParamField path="--model" type="string">
  Anulación del modelo; usa el modelo permitido seleccionado para el trabajo.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos de fallback por trabajo, por ejemplo `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Pasa `--fallbacks ""` para una ejecución estricta sin fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  En `cron edit`, elimina la anulación de fallbacks por trabajo para que el trabajo siga la precedencia de fallbacks configurada. No se puede combinar con `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  En `cron edit`, elimina la anulación de modelo por trabajo para que el trabajo siga la precedencia normal de selección de modelo de cron (una anulación almacenada de sesión cron si está configurada; de lo contrario, el modelo del agente/predeterminado). No se puede combinar con `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Anulación del nivel de thinking.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  En `cron edit`, elimina la anulación de thinking por trabajo para que el trabajo siga la precedencia normal de thinking de cron. No se puede combinar con `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omite la inyección de archivos de bootstrap del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe qué herramientas puede usar el trabajo, por ejemplo `--tools exec,read`.
</ParamField>

`--model` usa el modelo permitido seleccionado como modelo principal de ese trabajo. No es lo mismo que una anulación de `/model` de sesión de chat: las cadenas de fallback configuradas siguen aplicándose cuando falla el modelo principal del trabajo. Si el modelo solicitado no está permitido o no se puede resolver, cron falla la ejecución con un error de validación explícito en lugar de recurrir silenciosamente a la selección de modelo del agente/predeterminado del trabajo.

Los trabajos Cron también pueden llevar `fallbacks` a nivel de payload. Cuando está presente, esa lista sustituye la cadena de fallback configurada para el trabajo. Usa `fallbacks: []` en el payload/API del trabajo cuando quieras una ejecución cron estricta que pruebe solo el modelo seleccionado. Si un trabajo tiene `--model` pero no tiene fallbacks ni en el payload ni configurados, OpenClaw pasa una anulación de fallback vacía explícita para que el modelo principal del agente no se añada como objetivo oculto adicional de reintento.

Las comprobaciones previas de proveedores locales recorren los fallbacks configurados antes de marcar una ejecución cron como `skipped`; `fallbacks: []` mantiene estricta esa ruta de comprobación previa.

La precedencia de selección de modelo para trabajos aislados es:

1. Anulación de modelo del hook de Gmail (cuando la ejecución vino de Gmail y esa anulación está permitida)
2. `model` del payload por trabajo
3. Anulación almacenada de modelo de sesión cron seleccionada por el usuario
4. Selección de modelo del agente/predeterminado

El modo rápido también sigue la selección en vivo resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, cron aislado lo usa de forma predeterminada. Una anulación almacenada de sesión `fastMode` sigue teniendo prioridad sobre la configuración en cualquier dirección. El modo automático usa el umbral `params.fastAutoOnSeconds` del modelo seleccionado cuando está presente, con 60 segundos como valor predeterminado.

Si una ejecución aislada llega a una transferencia de cambio de modelo en vivo, cron reintenta con el proveedor/modelo cambiado y conserva esa selección en vivo para la ejecución activa antes de reintentar. Cuando el cambio también lleva un nuevo perfil de autenticación, cron también conserva esa anulación de perfil de autenticación para la ejecución activa. Los reintentos están acotados: después del intento inicial más 2 reintentos de cambio, cron aborta en lugar de entrar en un bucle infinito.

Antes de que una ejecución cron aislada entre en el runner del agente, OpenClaw comprueba los endpoints de proveedores locales accesibles para proveedores configurados con `api: "ollama"` y `api: "openai-completions"` cuyo `baseUrl` sea loopback, de red privada o `.local`. Si ese endpoint está caído, la ejecución se registra como `skipped` con un error claro de proveedor/modelo en lugar de iniciar una llamada al modelo. El resultado del endpoint se almacena en caché durante 5 minutos, por lo que muchos trabajos vencidos que usan el mismo servidor local Ollama, vLLM, SGLang o LM Studio caído comparten una pequeña comprobación en lugar de crear una tormenta de solicitudes. Las ejecuciones omitidas por comprobación previa de proveedor no incrementan el backoff por error de ejecución; habilita `failureAlert.includeSkipped` cuando quieras notificaciones repetidas de omisión.

## Entrega y salida

| Modo       | Qué ocurre                                                          |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Entrega con fallback el texto final al destino si el agente no envió |
| `webhook`  | Envía por POST el payload del evento finalizado a una URL            |
| `none`     | Sin entrega de fallback del runner                                  |

Usa `--announce --channel telegram --to "-1001234567890"` para entrega en canal. Para temas de foro de Telegram, usa `-1001234567890:topic:123`; OpenClaw también acepta la abreviatura propia de Telegram `-1001234567890:123`. Los llamadores directos de RPC/config pueden pasar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`). Los ID de salas de Matrix distinguen entre mayúsculas y minúsculas; usa el ID exacto de sala o la forma `room:!room:server` de Matrix.

Cuando la entrega de anuncio usa `channel: "last"` u omite `channel`, un destino con prefijo de proveedor como `telegram:123` puede seleccionar el canal antes de que cron recurra al historial de sesión o a un único canal configurado. Solo los prefijos anunciados por el plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo del destino debe nombrar el mismo proveedor; por ejemplo, `channel: "whatsapp"` con `to: "telegram:123"` se rechaza en lugar de dejar que WhatsApp interprete el ID de Telegram como un número de teléfono. Los prefijos de tipo de destino y servicio como `channel:<id>`, `user:<id>`, `imessage:<handle>` y `sms:<number>` siguen siendo sintaxis de destino propia del canal, no selectores de proveedor.

Para trabajos aislados, la entrega por chat es compartida. Si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso cuando el trabajo usa `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el anuncio de fallback. De lo contrario, `announce`, `webhook` y `none` solo controlan qué hace el runner con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino de entrega en vivo preservado para la ruta de anuncio de fallback. Las claves internas de sesión pueden estar en minúsculas; los destinos de entrega de proveedor no se reconstruyen desde esas claves cuando el contexto de chat actual está disponible.

La entrega implícita de anuncios usa listas de permitidos de canales configuradas para validar y redirigir destinos obsoletos. Las aprobaciones del almacén de emparejamiento de DM no son destinatarios de automatización de fallback; establece `delivery.to` o configura la entrada `allowFrom` del canal cuando un trabajo programado deba enviar proactivamente a un DM.

## Idioma de salida

Los trabajos Cron no infieren un idioma de respuesta a partir del canal, la configuración regional ni los mensajes anteriores. Pon la regla de idioma en el mensaje programado o la plantilla:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Para los archivos de plantilla, conserva la instrucción de idioma en el prompt renderizado y
verifica que los marcadores de posición como `{{language}}` se completen antes de ejecutar el trabajo. Si
la salida mezcla idiomas, haz que la regla sea explícita, por ejemplo: "Use Chinese
for narrative text and keep technical terms in English."

Las notificaciones de fallo siguen una ruta de destino separada:

- `cron.failureDestination` establece un valor global predeterminado para las notificaciones de fallo.
- `job.delivery.failureDestination` lo anula por trabajo.
- Si ninguno está configurado y el trabajo ya entrega mediante `announce`, las notificaciones de fallo ahora recurren a ese destino principal de anuncio.
- `delivery.failureDestination` solo se admite en trabajos `sessionTarget="isolated"`, salvo que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` incluye un trabajo o una política global de alertas de cron en alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador consecutivo de omisiones separado, por lo que no afectan al backoff por errores de ejecución.

## Ejemplos de CLI

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Model and thinking override">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook output">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Command output">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhooks

Gateway puede exponer endpoints Webhook HTTP para disparadores externos. Actívalo en la configuración:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Autenticación

Cada solicitud debe incluir el token del hook mediante una cabecera:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Los tokens en la cadena de consulta se rechazan.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Encola un evento del sistema para la sesión principal:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Descripción del evento.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` o `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Ejecuta un turno aislado de agente:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Campos: `message` (obligatorio), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Los nombres de hook personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas arbitrarias en acciones `wake` o `agent` con plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantén los endpoints de hook detrás de loopback, tailnet o un proxy inverso de confianza.

- Usa un token de hook dedicado; no reutilices tokens de autenticación del gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Establece `hooks.allowedAgentIds` para limitar a qué agente efectivo puede dirigirse un hook, incluido el agente predeterminado cuando se omite `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` salvo que requieras sesiones seleccionadas por el llamador.
- Si habilitas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de las claves de sesión.
- Las cargas útiles de los hooks se envuelven con límites de seguridad de forma predeterminada.

</Warning>

## Integración de Gmail PubSub

Conecta los disparadores de la bandeja de entrada de Gmail a OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados, Tailscale para el endpoint HTTPS público.
</Note>

### Configuración con asistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el preajuste de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático del Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está establecido, el Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la vigilancia. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para optar por no usarlo.

### Configuración manual de una sola vez

<Steps>
  <Step title="Selecciona el proyecto de GCP">
    Selecciona el proyecto de GCP que posee el cliente OAuth usado por `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Crea el tema y concede acceso push de Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Inicia la vigilancia">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Sustitución del modelo de Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Gestión de trabajos

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` vuelve después de poner en cola la ejecución manual. Usa `--wait` para hooks de apagado, scripts de mantenimiento u otra automatización que deba bloquear hasta que termine la ejecución en cola. El modo de espera consulta el `runId` exacto devuelto; sale con `0` para el estado `ok` y con un valor distinto de cero para `error`, `skipped` o un tiempo de espera agotado.

La herramienta `cron` del agente devuelve resúmenes compactos de trabajos (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) desde `cron(action: "list")`; usa `cron(action: "get", jobId: "...")` para obtener una definición completa de un trabajo. Los llamadores directos del Gateway pueden pasar `compact: true` a `cron.list`; omitirlo conserva la respuesta completa existente con vistas previas de entrega.

`openclaw cron create` es un alias de `openclaw cron add`, y los trabajos nuevos pueden usar una programación posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` o una marca de tiempo ISO) seguida de un prompt posicional para el agente. Usa `--webhook <url>` en `cron add|create` o `cron edit` para enviar por POST la carga útil de la ejecución terminada a un endpoint HTTP. La entrega por Webhook no puede combinarse con flags de entrega por chat como `--announce`, `--channel`, `--to`, `--thread-id` o `--account`. En `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account` desestablecen esos campos de enrutamiento individualmente (cada uno se rechaza junto con su flag de establecimiento correspondiente), lo que es distinto de que `--no-deliver` deshabilite la entrega de respaldo del ejecutor.

<Note>
Nota sobre la sustitución del modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido o no puede resolverse, cron falla la ejecución con un error de validación explícito.
- Los parches de carga útil de la API `cron.update` pueden establecer `model: null` para borrar una sustitución de modelo almacenada en el trabajo.
- `openclaw cron edit <job-id> --clear-model` borra esa sustitución desde la CLI (el mismo efecto que el parche `model: null`) y no puede combinarse con `--model`.
- Las cadenas de respaldo configuradas siguen aplicándose porque `--model` de cron es un primario de trabajo, no una sustitución de `/model` de sesión.
- `openclaw cron add|edit --fallbacks ...` establece `fallbacks` en la carga útil y reemplaza los respaldos configurados para ese trabajo; `--fallbacks ""` deshabilita el respaldo y hace que la ejecución sea estricta. `openclaw cron edit <job-id> --clear-fallbacks` borra la sustitución por trabajo.
- Un `--model` simple sin una lista de respaldos explícita o configurada no pasa al primario del agente como destino adicional silencioso de reintento.

</Note>

## Configuración

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` limita tanto el despacho programado de cron como la ejecución aislada de turnos de agente, y su valor predeterminado es 8. Los turnos aislados de agente de cron usan internamente el carril de ejecución dedicado `cron-nested` de la cola, por lo que aumentar este valor permite que ejecuciones LLM de cron independientes avancen en paralelo en lugar de iniciar solo sus envoltorios externos de cron. El carril compartido no cron `nested` no se amplía con esta configuración.

`cron.store` es una clave lógica de almacenamiento y una ruta de importación heredada de doctor. Ejecuta `openclaw doctor --fix` para importar almacenes JSON existentes a SQLite y archivarlos; los cambios futuros de cron deben pasar por la CLI o la API del Gateway.

Deshabilitar cron: `cron.enabled: false` u `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamiento de reintentos">
    **Reintento único**: los errores transitorios (límite de tasa, sobrecarga, red, error del servidor) se reintentan hasta 3 veces con retroceso exponencial. Los errores permanentes se deshabilitan inmediatamente.

    **Reintento recurrente**: retroceso exponencial (30 s a 60 m) entre reintentos. El retroceso se restablece después de la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Mantenimiento">
    `cron.sessionRetention` (predeterminado `24h`) poda las entradas de sesión de ejecución aislada. `cron.runLog.keepLines` limita las filas de historial de ejecución de SQLite retenidas por trabajo; `maxBytes` se conserva por compatibilidad de configuración con registros de ejecución antiguos respaldados por archivos.
  </Accordion>
</AccordionGroup>

## Solución de problemas

### Escalera de comandos

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron no se dispara">
    - Comprueba `cron.enabled` y la variable de entorno `OPENCLAW_SKIP_CRON`.
    - Confirma que el Gateway se esté ejecutando continuamente.
    - Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
    - `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y el trabajo aún no vencía.

  </Accordion>
  <Accordion title="Cron se disparó pero no hay entrega">
    - El modo de entrega `none` significa que no se espera ningún envío de respaldo del ejecutor. El agente aún puede enviar directamente con la herramienta `message` cuando haya una ruta de chat disponible.
    - Falta el destino de entrega o no es válido (`channel`/`to`), por lo que se omitió la salida.
    - Para Matrix, los trabajos copiados o heredados con IDs de sala `delivery.to` en minúsculas pueden fallar porque los IDs de sala de Matrix distinguen entre mayúsculas y minúsculas. Edita el trabajo al valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que la entrega fue bloqueada por credenciales.
    - Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y también suprime la ruta de resumen en cola de respaldo, por lo que no se publica nada de vuelta al chat.
    - Si el agente debe enviar un mensaje al usuario por sí mismo, comprueba que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat anterior, o un canal/destino explícito).

  </Accordion>
  <Accordion title="Cron o Heartbeat parecen impedir el rollover de estilo /new">
    - La frescura de restablecimiento diario e inactivo no se basa en `updatedAt`; consulta [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Los despertares de cron, las ejecuciones de heartbeat, las notificaciones de exec y la contabilidad del gateway pueden actualizar la fila de sesión para enrutamiento/estado, pero no extienden `sessionStartedAt` ni `lastInteractionAt`.
    - Para filas heredadas creadas antes de que existieran esos campos, OpenClaw puede recuperar `sessionStartedAt` del encabezado de sesión del JSONL de transcripción cuando el archivo aún está disponible. Las filas inactivas heredadas sin `lastInteractionAt` usan esa hora de inicio recuperada como su línea base de inactividad.

  </Accordion>
  <Accordion title="Detalles de zona horaria">
    - Cron sin `--tz` usa la zona horaria del host del gateway.
    - Las programaciones `at` sin zona horaria se tratan como UTC.
    - `activeHours` de Heartbeat usa la resolución de zona horaria configurada.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Automatización](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para ejecuciones de cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de zona horaria
