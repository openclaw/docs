---
read_when:
    - Programar trabajos en segundo plano o activaciones
    - Conectar disparadores externos (webhooks, Gmail) a OpenClaw
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Trabajos programados, webhooks y activadores de Gmail PubSub para el programador del Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-07-05T11:00:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aa2b15d205cfb9914b4dc25ba5c446ecc8460e322e99bb784495ef7802d94f1e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el programador integrado del Gateway. Conserva los trabajos, despierta al agente en el momento correcto y puede entregar la salida a un canal de chat, un Webhook o a ningún destino.

## Inicio rápido

<Steps>
  <Step title="Agregar un recordatorio de una sola ejecución">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Revisar tus trabajos">
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

- Cron se ejecuta **dentro del proceso del Gateway**, no dentro del modelo. El Gateway debe estar en ejecución para que los horarios se disparen.
- Las definiciones de trabajos, el estado en tiempo de ejecución y el historial de ejecuciones se conservan en la base de datos de estado SQLite compartida de OpenClaw, por lo que los reinicios no pierden horarios.
- Cada ejecución de cron crea un registro de [tarea en segundo plano](/es/automation/tasks).
- Los trabajos de una sola ejecución (`--at`) se eliminan automáticamente después de completarse correctamente de forma predeterminada; pasa `--keep-after-run` para conservarlos.
- Presupuesto de reloj de pared por ejecución: `--timeout-seconds` cuando se define. De lo contrario, los trabajos de turno de agente aislados/desacoplados están limitados por el watchdog propio de cron de 60 minutos antes de que pudiera aplicarse el tiempo de espera del turno de agente subyacente (`agents.defaults.timeoutSeconds`, predeterminado de 48 horas); los trabajos de comando tienen un valor predeterminado de 10 minutos.
- Al iniciar el Gateway, los trabajos atrasados de turno de agente aislado se reprograman en lugar de reproducirse inmediatamente, lo que mantiene el trabajo de arranque del modelo/herramientas fuera de la ventana de conexión del canal.
- Si ejecutas `openclaw agent` desde el cron del sistema u otro programador externo, envuélvelo con una escalada de finalización forzada aunque la CLI ya gestione `SIGTERM`/`SIGINT`. Las ejecuciones respaldadas por el Gateway piden al Gateway que aborte las ejecuciones aceptadas; las ejecuciones locales y de reserva integradas reciben la misma señal de aborto. Para GNU `timeout`, prefiere `timeout -k 60 600 openclaw agent ...` en lugar de `timeout 600 ...`: el valor `-k` es el respaldo si el proceso no puede drenar a tiempo. Para unidades systemd, usa una señal de detención `SIGTERM` con una ventana de gracia (`TimeoutStopSec`) antes de la finalización definitiva. Reutilizar un `--run-id` mientras la ejecución original del Gateway sigue activa informa el duplicado como en curso en lugar de iniciar una segunda ejecución.

<AccordionGroup>
  <Accordion title="Endurecimiento de ejecuciones aisladas">
    - Las ejecuciones aisladas intentan cerrar, en la medida de lo posible, las pestañas/procesos de navegador rastreados para su sesión `cron:<jobId>` al completarse, y eliminan cualquier instancia de tiempo de ejecución MCP incluida creada para el trabajo mediante la misma ruta de desmontaje compartida que usan las ejecuciones de sesión principal y de sesión personalizada. Los fallos de limpieza se ignoran para que el resultado de cron siga teniendo prioridad.
    - Las ejecuciones aisladas con la concesión limitada de autolimpieza de cron pueden leer el estado del programador, una lista autofiltada que contiene solo su propio trabajo y el historial de ejecuciones de ese trabajo, y solo pueden eliminar su propio trabajo.
    - Las ejecuciones aisladas se protegen contra respuestas de acuse obsoletas: si el primer resultado es solo una actualización de estado provisional (`on it`, `pulling everything together` y pistas similares) y ningún subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de la entrega.
    - Los metadatos estructurados de denegación de ejecución (incluidas envolturas `UNAVAILABLE` de host de nodo cuyo error anidado empieza con `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`) se reconocen para que un comando bloqueado no se informe como una ejecución correcta, mientras que la prosa ordinaria del asistente no se confunde con una denegación.
    - Los fallos de agente a nivel de ejecución cuentan como errores de trabajo incluso sin carga útil de respuesta, por lo que los fallos de modelo/proveedor incrementan los contadores de errores y disparan notificaciones de fallo en lugar de marcar el trabajo como correcto.
    - Cuando un trabajo alcanza `timeoutSeconds`, cron aborta la ejecución y le da una ventana breve de limpieza. Si no drena, la limpieza propiedad del Gateway fuerza la liberación de la propiedad de sesión de esa ejecución antes de que cron registre el tiempo de espera, para que el trabajo de chat en cola no quede bloqueado detrás de una sesión de procesamiento obsoleta.
    - Los bloqueos de configuración/inicio reciben un tiempo de espera específico de fase (por ejemplo, `cron: isolated agent setup timed out before runner start` o `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Estos watchdogs cubren proveedores integrados y respaldados por CLI incluso antes de que se inicie su proceso de CLI externo, y se limitan independientemente de valores largos de `timeoutSeconds` para que los fallos de arranque en frío/autenticación/contexto afloren rápidamente.

  </Accordion>
  <Accordion title="Reconciliación de tareas">
    La reconciliación de tareas de cron pertenece primero al tiempo de ejecución y está respaldada por historial duradero en segundo lugar: una tarea cron activa sigue viva mientras el tiempo de ejecución de cron todavía rastrea ese trabajo como en ejecución, incluso si todavía existe una fila antigua de sesión secundaria. Una vez que el tiempo de ejecución deja de ser propietario del trabajo y expira una ventana de gracia de 5 minutos, el mantenimiento revisa los registros de ejecución persistidos y el estado del trabajo para la ejecución `cron:<jobId>:<startedAt>` correspondiente. Un resultado terminal allí finaliza el libro mayor de tareas; de lo contrario, el mantenimiento propiedad del Gateway puede marcar la tarea como `lost`. La auditoría de CLI sin conexión puede recuperarse a partir del historial duradero, pero su propio conjunto vacío de trabajos activos en proceso no prueba que una ejecución propiedad del Gateway haya desaparecido.
  </Accordion>
</AccordionGroup>

## Tipos de programación

| Tipo      | Marca de CLI | Descripción                                                                                              |
| --------- | ------------ | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`       | Marca de tiempo de una sola ejecución (ISO 8601 o relativa como `20m`)                                   |
| `every`   | `--every`    | Intervalo fijo (`10m`, `1h`, `1d`)                                                                       |
| `cron`    | `--cron`     | Expresión cron de 5 o 6 campos con `--tz` opcional                                                       |
| `on-exit` | `--on-exit`  | Se dispara una vez cuando sale un comando observado (disparador de evento; sobrevive al desmontaje del turno; `--on-exit-cwd` opcional) |

Las marcas de tiempo sin zona horaria se tratan como UTC. Agrega `--tz America/New_York` para interpretar una fecha y hora `--at` sin desplazamiento, o para evaluar una expresión cron, en esa zona horaria IANA. Las expresiones cron sin `--tz` usan la zona horaria del host del Gateway. `--tz` no es válido con `--every` ni con `--on-exit`.

Las expresiones recurrentes al inicio de la hora (minuto `0` con un campo de hora comodín) se escalonan automáticamente hasta 5 minutos para reducir picos de carga. Usa `--exact` para forzar una temporización precisa, o `--stagger 30s` para una ventana explícita (solo programaciones cron).

### El día del mes y el día de la semana usan lógica OR

Las expresiones cron se analizan con [croner](https://github.com/Hexagon/croner). Cuando los campos de día del mes y día de la semana no son comodines, croner coincide cuando **cualquiera** de los campos coincide, no ambos. Este es el comportamiento estándar de Vixie cron.

```bash
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se dispara aproximadamente 5-6 veces al mes en lugar de 0-1 veces al mes. Para exigir ambas condiciones, usa el modificador de día de la semana `+` de croner (`0 9 15 * +1`), o programa en un campo y protege el otro en el prompt o comando de tu trabajo.

## Cargas útiles

Cada trabajo lleva exactamente un tipo de carga útil, elegido por marca:

| Carga útil       | Marca                                          | Ejecuta                                                 |
| ---------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Evento del sistema | `--system-event <text>`                      | Encolado en la sesión principal, sin llamada al modelo por sí mismo |
| Mensaje de agente | `--message <text>`                            | Un turno de agente respaldado por modelo                |
| Comando          | `--command <shell>` o `--command-argv <json>`  | Un shell/proceso en el host del Gateway, sin llamada al modelo |

### Opciones de turno de agente

<ParamField path="--message" type="string" required>
  Texto del prompt (obligatorio para trabajos aislados/de sesión actual/de sesión personalizada).
</ParamField>
<ParamField path="--model" type="string">
  Sustitución del modelo; debe resolverse a un modelo permitido o la ejecución falla con un error de validación.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos de reserva por trabajo, por ejemplo `--fallbacks openai/gpt-5.5,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Pasa `--fallbacks ""` para una ejecución estricta sin reservas.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  En `cron edit`, elimina la sustitución de reservas por trabajo para que el trabajo siga la precedencia de reservas configurada. No se puede combinar con `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  En `cron edit`, elimina la sustitución de modelo por trabajo para que el trabajo siga la precedencia normal de modelo de cron (sustitución almacenada de sesión cron, o si no, modelo del agente/predeterminado). No se puede combinar con `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Sustitución del nivel de razonamiento (`off|minimal|low|medium|high|xhigh|adaptive|max`).
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  En `cron edit`, elimina la sustitución de razonamiento por trabajo. No se puede combinar con `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omite la inyección de archivos de arranque del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe qué herramientas puede usar el trabajo, por ejemplo `--tools exec,read`.
</ParamField>

`--model` establece el modelo principal del trabajo; no reemplaza una sustitución `/model` de sesión, por lo que las cadenas de reserva configuradas siguen aplicándose encima. Un modelo no resuelto o no permitido hace que la ejecución falle con un error de validación explícito en lugar de recurrir silenciosamente al valor predeterminado. Si un trabajo tiene `--model` pero no una lista de reservas explícita o configurada, OpenClaw pasa una sustitución de reservas vacía en lugar de anexar silenciosamente el modelo principal del agente como destino oculto de reintento.

Precedencia de selección de modelo para trabajos aislados, de mayor a menor:

1. `model` de la carga útil por trabajo (configuración explícita; un modelo no permitido hace fallar la ejecución)
2. Sustitución de modelo del hook de Gmail (solo cuando la ejecución provino de Gmail y esa sustitución está permitida)
3. Sustitución de modelo de sesión cron almacenada seleccionada por el usuario
4. Selección de modelo de agente/predeterminado

El modo rápido sigue la selección en vivo resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, cron aislado la usa de forma predeterminada; una sustitución `fastMode` de sesión almacenada (y luego un `fastModeDefault` de agente) sigue prevaleciendo sobre la configuración del modelo en cualquier dirección. El modo automático usa el límite `params.fastAutoOnSeconds` del modelo, con un valor predeterminado de 60 segundos.

Si una ejecución encuentra una transferencia de cambio de modelo en vivo, cron reintenta con el proveedor/modelo cambiado y conserva esa selección (y cualquier perfil de autenticación nuevo) para la ejecución activa. Los reintentos están limitados: después del intento inicial más 2 reintentos de cambio, cron aborta en lugar de entrar en bucle.

Antes de que comience una ejecución aislada, OpenClaw comprueba puntos de conexión locales alcanzables para proveedores configurados `api: "ollama"` y `api: "openai-completions"` cuyo `baseUrl` sea local loopback, de red privada o `.local`. Esta comprobación previa recorre la cadena de reservas configurada del trabajo y solo marca la ejecución como `skipped` una vez que todos los candidatos son inalcanzables; `--fallbacks ""` mantiene ese recorrido estricto solo al modelo principal. Un punto de conexión caído registra la ejecución como `skipped` con un error claro en lugar de iniciar una llamada al modelo. El resultado se almacena en caché durante 5 minutos por punto de conexión (no por trabajo ni modelo), por lo que muchos trabajos vencidos que comparten un servidor local Ollama/vLLM/SGLang/LM Studio inactivo cuestan una sola sonda en lugar de una tormenta de solicitudes. Las ejecuciones omitidas por comprobación previa no incrementan el retroceso por error de ejecución; define `failureAlert.includeSkipped` para optar por alertas repetidas de omisión.

### Cargas útiles de comando

Las cargas útiles de comando ejecutan scripts deterministas dentro del programador del Gateway sin iniciar un turno respaldado por modelo. Se ejecutan en el host del Gateway, capturan stdout/stderr, registran la ejecución en el historial de cron y reutilizan los mismos modos de entrega `announce`, `webhook` y `none` que los trabajos de turno de agente.

<Note>
Cron de comandos es una superficie de automatización del Gateway para administradores-operadores, no una llamada de agente a `tools.exec`. Crear, actualizar, eliminar o ejecutar manualmente trabajos Cron requiere `operator.admin`; las ejecuciones programadas de comandos se ejecutan más tarde dentro del proceso del Gateway como esa automatización creada por un administrador. La política de ejecución del agente (`tools.exec.mode`, solicitudes de aprobación, listas de herramientas permitidas por agente) rige las herramientas de ejecución visibles para el modelo, no las cargas útiles de Cron de comandos.
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

`--command <shell>` almacena `argv: ["sh", "-lc", <shell>]`. Usa `--command-argv '["node","scripts/report.mjs"]'` para una ejecución exacta de argv sin análisis del shell. Los elementos opcionales `--command-env KEY=VALUE` (repetible), `--command-input`, `--timeout-seconds` (valor predeterminado: 10 minutos), `--no-output-timeout-seconds` y `--output-max-bytes` controlan el entorno del proceso, stdin y los límites de salida.

El texto entregado se deriva de la salida del proceso: stdout no vacío tiene prioridad; si stdout está vacío y stderr no está vacío, se entrega stderr; si ambos están presentes, Cron envía un pequeño bloque `stdout:` / `stderr:`. El código de salida `0` registra la ejecución como `ok`; una salida distinta de cero, señal, tiempo de espera o tiempo de espera sin salida registra `error` y puede activar alertas de fallo. Un comando que imprime solo `NO_REPLY` usa la supresión normal por token silencioso de Cron y no publica nada de vuelta en el chat.

## Estilos de ejecución

| Estilo          | Valor de `--session` | Se ejecuta en                    | Ideal para                              |
| --------------- | -------------------- | -------------------------------- | --------------------------------------- |
| Sesión principal | `main`              | Carril dedicado de activación Cron | Recordatorios, eventos del sistema      |
| Aislado         | `isolated`           | `cron:<jobId>` dedicado          | Informes, tareas en segundo plano       |
| Sesión actual   | `current`            | Vinculada en el momento de creación | Trabajo recurrente consciente del contexto |
| Sesión personalizada | `session:custom-id` | Sesión nombrada persistente      | Flujos de trabajo que se basan en el historial |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Los trabajos de **sesión principal** ponen en cola un evento del sistema en un carril de ejecución propiedad de Cron y, opcionalmente, despiertan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Pueden usar el último contexto de entrega de la sesión principal de destino para las respuestas, pero no agregan turnos rutinarios de Cron al carril de chat humano ni amplían la frescura del restablecimiento diario/inactivo para la sesión de destino. Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) conservan el contexto entre ejecuciones, lo que permite flujos de trabajo como reuniones diarias que se basan en resúmenes anteriores.

    Los eventos Cron de sesión principal son recordatorios autónomos de eventos del sistema. No incluyen automáticamente la instrucción "Read HEARTBEAT.md" del prompt predeterminado de Heartbeat; indícalo explícitamente en el texto del evento Cron si un recordatorio debe consultar `HEARTBEAT.md`.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Un nuevo id de transcripción/sesión por ejecución. OpenClaw conserva preferencias seguras (ajustes de razonamiento/rápido/detallado, etiquetas, anulaciones explícitas de modelo/autenticación seleccionadas por el usuario), pero no hereda el contexto ambiental de conversación de una fila Cron anterior: enrutamiento de canal/grupo, política de envío o cola, elevación, origen o enlace de tiempo de ejecución ACP. Usa `current` o `session:<id>` cuando un trabajo recurrente deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Cuando las ejecuciones Cron aisladas orquestan subagentes, la entrega prefiere la salida final descendiente frente al texto provisional obsoleto del padre. Si los descendientes siguen ejecutándose, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

    Para destinos de anuncio de Discord solo de texto, OpenClaw envía el texto final canónico del asistente una vez, en lugar de reproducir tanto el texto transmitido/intermedio como la respuesta final. Los medios y las cargas útiles estructuradas de Discord se siguen entregando por separado para que no se pierdan adjuntos ni componentes.

  </Accordion>
</AccordionGroup>

## Entrega y salida

| Modo       | Qué ocurre                                                        |
| ---------- | ----------------------------------------------------------------- |
| `announce` | Entrega el texto final como respaldo al destino si el agente no lo envió |
| `webhook`  | Envía por POST la carga útil del evento finalizado a una URL      |
| `none`     | Sin entrega de respaldo del ejecutor                              |

Usa `--announce --channel telegram --to "-1001234567890"` para la entrega por canal. Para temas de foro de Telegram, usa `-1001234567890:topic:123`; OpenClaw también acepta la forma abreviada propiedad de Telegram `-1001234567890:123`. Los llamadores directos de RPC/configuración pueden pasar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost usan prefijos explícitos (`channel:<id>`, `user:<id>`). Los ID de salas de Matrix distinguen mayúsculas y minúsculas; usa el ID exacto de la sala o la forma `room:!room:server` de Matrix.

Cuando la entrega de anuncio usa `channel: "last"` u omite `channel`, un destino con prefijo de proveedor como `telegram:123` puede seleccionar el canal antes de que Cron recurra al historial de sesión o a un único canal configurado. Solo los prefijos anunciados por el Plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo de destino debe nombrar el mismo proveedor; `channel: "whatsapp"` con `to: "telegram:123"` se rechaza en lugar de dejar que WhatsApp interprete el ID de Telegram como un número de teléfono. Los prefijos de tipo de destino y de servicio (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) siguen siendo sintaxis de destino propiedad del canal, no selectores de proveedor.

Para trabajos aislados, la entrega de chat es compartida: si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso con `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el anuncio de respaldo. De lo contrario, `announce`, `webhook` y `none` solo controlan qué hace el ejecutor con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino de entrega en vivo preservado para la ruta de anuncio de respaldo. Las claves internas de sesión pueden estar en minúsculas; los destinos de entrega del proveedor no se reconstruyen a partir de esas claves cuando el contexto de chat actual está disponible.

La entrega de anuncio implícita usa las listas de canales permitidos configuradas para validar y redirigir destinos obsoletos. Las aprobaciones de almacén de emparejamiento de DM no son destinatarios de automatización de respaldo; define `delivery.to` o configura la entrada `allowFrom` del canal cuando un trabajo programado deba enviar proactivamente a un DM.

### Notificaciones de fallo

Las notificaciones de fallo siguen una ruta de destino separada:

- `cron.failureDestination` establece un valor predeterminado global para las notificaciones de fallo.
- `job.delivery.failureDestination` lo anula por trabajo.
- Si no se define ninguno y el trabajo ya entrega mediante `announce`, las notificaciones de fallo recurren a ese destino principal de anuncio.
- `delivery.failureDestination` solo se admite en trabajos `sessionTarget="isolated"` salvo que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` incluye un trabajo o una política global de alertas Cron en alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador consecutivo de omisiones separado, por lo que no afectan al retroceso por errores de ejecución.
- `openclaw cron edit` expone el ajuste de alertas por trabajo: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` y `--failure-alert-account-id`.

### Idioma de salida

Los trabajos Cron no infieren el idioma de respuesta a partir del canal, la configuración regional ni los mensajes anteriores. Coloca la regla de idioma en el mensaje o plantilla programados:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Para archivos de plantilla, conserva la instrucción de idioma en el prompt renderizado y verifica que los marcadores de posición como `{{language}}` se completen antes de que se ejecute el trabajo. Si la salida mezcla idiomas, haz explícita la regla, por ejemplo: "Use Chinese for narrative text and keep technical terms in English."

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

## Gestionar trabajos

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Enable/disable without deleting
openclaw cron enable <jobId>
openclaw cron disable <jobId>

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

`openclaw cron run <jobId>` devuelve el control después de poner en cola la ejecución manual. Usa `--wait` para hooks de apagado, scripts de mantenimiento u otra automatización que deba bloquear hasta que finalice la ejecución en cola; sondea el `runId` devuelto (tiempo de espera predeterminado `10m`, intervalo de sondeo `2s`) y sale con `0` para el estado `ok`, distinto de cero para `error`, `skipped` o un tiempo de espera agotado.

La herramienta de agente `cron` devuelve resúmenes compactos de trabajos (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) desde `cron(action: "list")`; usa `cron(action: "get", jobId: "...")` para una definición completa de un trabajo. Los llamadores directos del Gateway pueden pasar `compact: true` a `cron.list`; omitirlo conserva la respuesta completa con vistas previas de entrega.

`openclaw cron create` es un alias de `openclaw cron add`. Los trabajos nuevos pueden usar una programación posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` o una marca de tiempo ISO) seguida de un prompt de agente posicional. Usa `--webhook <url>` en `cron add|create` o `cron edit` para enviar mediante POST la carga útil de la ejecución finalizada a un endpoint HTTP; la entrega de webhook no puede combinarse con las marcas de entrega por chat (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`). En `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account` desasignan esos campos de enrutamiento individualmente (cada uno se rechaza junto con su marca de asignación correspondiente), a diferencia de `--no-deliver`, que solo desactiva la entrega de respaldo del ejecutor.

<Note>
Nota de anulación de modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido o no puede resolverse, cron hace fallar la ejecución con un error de validación explícito.
- Los parches de carga útil de la API `cron.update` pueden establecer `model: null` para borrar una anulación de modelo almacenada en el trabajo.
- `openclaw cron edit <job-id> --clear-model` borra esa anulación desde la CLI (el mismo efecto que el parche `model: null`) y no puede combinarse con `--model`.
- Las cadenas de respaldo configuradas siguen aplicándose porque `--model` de cron es un modelo principal del trabajo, no una anulación `/model` de sesión.
- `openclaw cron add|edit --fallbacks ...` establece `fallbacks` en la carga útil y reemplaza los respaldos configurados para ese trabajo; `--fallbacks ""` desactiva el respaldo y hace que la ejecución sea estricta. `openclaw cron edit <job-id> --clear-fallbacks` borra la anulación por trabajo.
- Un `--model` simple sin lista de respaldos explícita o configurada no recurre al modelo principal del agente como destino silencioso adicional de reintento.

</Note>

## Webhooks

Gateway puede exponer endpoints de Webhook HTTP para disparadores externos. Habilítalos en la configuración:

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

Cada solicitud debe incluir el token del hook mediante un encabezado:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Los tokens en la cadena de consulta se rechazan.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Encola un evento de sistema para la sesión principal:

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
    Ejecuta un turno de agente aislado:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.5"}'
    ```

    Campos: `message` (obligatorio), `name`, `agentId`, `sessionKey` (requiere `hooks.allowRequestSessionKey=true`), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hooks asignados (POST /hooks/<name>)">
    Los nombres de hook personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas útiles arbitrarias en acciones `wake` o `agent` con plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantén los endpoints de hook detrás de local loopback, tailnet o un proxy inverso de confianza.

- Usa un token de hook dedicado; no reutilices tokens de autenticación de Gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Establece `hooks.allowedAgentIds` para limitar qué agente efectivo puede tener como destino un hook, incluido el agente predeterminado cuando se omite `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` salvo que necesites sesiones seleccionadas por el llamador.
- Si habilitas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para restringir las formas de clave de sesión permitidas.
- Las cargas útiles de hook se envuelven con límites de seguridad de forma predeterminada.

</Warning>

## Integración con Gmail PubSub

Conecta los disparadores de la bandeja de entrada de Gmail con OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados, Tailscale para el endpoint HTTPS público.
</Note>

### Configuración con asistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el preajuste de Gmail y usa Tailscale Funnel de forma predeterminada para el endpoint push (`--tailscale funnel|serve|off`).

### Inicio automático de Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está establecido, Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la vigilancia. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desactivarlo.

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
  <Step title="Crea el tema y concede acceso push a Gmail">
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

### Anulación del modelo de Gmail

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

## Configuración

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Los valores de `retry` anteriores son los predeterminados: hasta 3 reintentos con espera de `30s/60s/5m`, reintentando las cinco categorías transitorias. `webhookToken` se envía como `Authorization: Bearer <token>` en los POST de webhook de cron.

`maxConcurrentRuns` limita tanto el despacho programado de cron como la ejecución aislada de turnos de agente, y su valor predeterminado es 8. Los turnos de agente aislados de cron usan internamente el carril de ejecución dedicado `cron-nested` de la cola, por lo que aumentar este valor permite que ejecuciones LLM de cron independientes avancen en paralelo en lugar de iniciar solo sus envoltorios externos de cron. El carril compartido no cron `nested` no se amplía con este ajuste.

`cron.store` es una clave de almacén lógica y una ruta de migración de doctor, no un archivo JSON activo para editar a mano. Los datos de trabajos viven en SQLite; usa la CLI o la API de Gateway para cambios.

Desactivar cron: `cron.enabled: false` u `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamiento de reintentos">
    **Reintento de una sola ejecución**: los errores transitorios (límite de tasa, sobrecarga, red, tiempo de espera, error de servidor) se reintentan hasta `retry.maxAttempts` veces (predeterminado 3) usando `retry.backoffMs` (predeterminado 30s, 60s, 5m). Los errores permanentes desactivan el trabajo inmediatamente.

    **Reintento recurrente**: los errores de ejecución consecutivos aplican espera con una programación extendida (30s, 60s, 5m, 15m, 60m). La espera se restablece tras la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Mantenimiento">
    `cron.sessionRetention` (predeterminado `24h`, `false` lo desactiva) purga las entradas de sesión de ejecución aislada. `cron.runLog.keepLines` limita las filas de historial de ejecución de SQLite retenidas por trabajo; `maxBytes` se conserva por compatibilidad de configuración con registros de ejecución antiguos respaldados por archivos.
  </Accordion>
  <Accordion title="Migración del almacén heredado">
    Al actualizar, ejecuta `openclaw doctor --fix` para importar los archivos heredados `~/.openclaw/cron/jobs.json`, `jobs-state.json` y `runs/*.jsonl` a SQLite y renombrarlos con un sufijo `.migrated`. Las filas de trabajos mal formadas se omiten del runtime y se copian a `jobs-quarantine.json` para reparación o revisión posterior.
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
    - Confirma que Gateway se ejecuta continuamente.
    - Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
    - `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y que el trabajo aún no vencía.

  </Accordion>
  <Accordion title="Cron se disparó pero no hubo entrega">
    - El modo de entrega `none` significa que no se espera envío de respaldo del ejecutor. El agente aún puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
    - Si falta el destino de entrega o no es válido (`channel`/`to`), la salida se omitió.
    - En Matrix, los trabajos copiados o heredados con IDs de sala `delivery.to` en minúsculas pueden fallar porque los IDs de sala de Matrix distinguen mayúsculas y minúsculas. Edita el trabajo con el valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación de canal (`unauthorized`, `Forbidden`) significan que la entrega fue bloqueada por las credenciales.
    - Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y la ruta de resumen en cola de respaldo, por lo que no se publica nada de vuelta en el chat.
    - Si el agente debe enviar un mensaje al usuario por sí mismo, comprueba que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat previo, o un canal/destino explícito).

  </Accordion>
  <Accordion title="Cron o Heartbeat parecen impedir la rotación /new-style">
    - La frescura de restablecimiento diario e inactivo no se basa en `updatedAt`; consulta [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Los despertares de cron, las ejecuciones de Heartbeat, las notificaciones de exec y la contabilidad de Gateway pueden actualizar la fila de sesión para enrutamiento/estado, pero no extienden `sessionStartedAt` ni `lastInteractionAt`.
    - Para filas heredadas creadas antes de que existieran esos campos, OpenClaw puede recuperar `sessionStartedAt` desde el encabezado de sesión JSONL de la transcripción cuando el archivo aún está disponible. Las filas inactivas heredadas sin `lastInteractionAt` usan esa hora de inicio recuperada como su referencia de inactividad.

  </Accordion>
  <Accordion title="Detalles importantes de zona horaria">
    - Cron sin `--tz` usa la zona horaria del host de Gateway.
    - Las programaciones `at` sin zona horaria se tratan como UTC.
    - `activeHours` de Heartbeat usa la resolución de zona horaria configurada.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Automatización](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — libro mayor de tareas para ejecuciones de cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de zona horaria
