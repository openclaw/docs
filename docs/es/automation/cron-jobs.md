---
read_when:
    - Programación de trabajos en segundo plano o activaciones
    - Conexión de activadores externos (webhooks, Gmail) con OpenClaw
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Trabajos programados, webhooks y activadores de PubSub de Gmail para el planificador del Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-07-12T14:17:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dc6ac442b03f892b916cf04695b770bc86ee6b00978b95ffaeb8e6480f5b8af6
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el programador integrado del Gateway. Conserva los trabajos, activa al agente en el momento adecuado y puede enviar la salida a un canal de chat, a un Webhook o a ninguna parte.

## Inicio rápido

<Steps>
  <Step title="Añadir un recordatorio único">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Comprobar los trabajos">
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

## Cómo funciona Cron

- Cron se ejecuta **dentro del proceso del Gateway**, no dentro del modelo. El Gateway debe estar en ejecución para que se activen las programaciones.
- Las definiciones de los trabajos, el estado de ejecución y el historial de ejecuciones se conservan en la base de datos de estado SQLite compartida de OpenClaw, por lo que los reinicios no eliminan las programaciones.
- Cada ejecución de Cron crea un registro de [tarea en segundo plano](/es/automation/tasks).
- Los trabajos únicos (`--at`) se eliminan automáticamente después de completarse correctamente de forma predeterminada; use `--keep-after-run` para conservarlos.
- Presupuesto de tiempo real por ejecución: `--timeout-seconds` cuando se establece. De lo contrario, los trabajos de turno del agente aislados o desacoplados están limitados por el supervisor propio de Cron de 60 minutos antes de que llegue a aplicarse el tiempo de espera subyacente del turno del agente (`agents.defaults.timeoutSeconds`, 48 horas de forma predeterminada); los trabajos de comandos tienen un valor predeterminado de 10 minutos.
- Al iniciarse el Gateway, los trabajos atrasados de turnos aislados del agente se reprograman en lugar de reproducirse inmediatamente, lo que mantiene las tareas de arranque del modelo y de las herramientas fuera del intervalo de conexión del canal.
- Si ejecuta `openclaw agent` mediante Cron del sistema u otro programador externo, aplique una finalización forzada progresiva aunque la CLI ya gestione `SIGTERM`/`SIGINT`. Las ejecuciones respaldadas por el Gateway solicitan al Gateway que cancele las ejecuciones aceptadas; las ejecuciones locales y de reserva integradas reciben la misma señal de cancelación. Para GNU `timeout`, prefiera `timeout -k 60 600 openclaw agent ...` en lugar de simplemente `timeout 600 ...`: el valor `-k` sirve como protección final si el proceso no puede concluir a tiempo. Para las unidades de systemd, use una señal de detención `SIGTERM` con un periodo de gracia (`TimeoutStopSec`) antes de la finalización definitiva. Si se reutiliza un `--run-id` mientras la ejecución original del Gateway sigue activa, el duplicado se notifica como en curso en lugar de iniciar una segunda ejecución.

<AccordionGroup>
  <Accordion title="Protección de ejecuciones aisladas">
    - Al completarse, las ejecuciones aisladas intentan cerrar las pestañas y los procesos del navegador registrados para su sesión `cron:<jobId>`, y descartan cualquier instancia integrada del entorno de ejecución MCP creada para el trabajo mediante la misma ruta compartida de desmontaje que usan las ejecuciones de la sesión principal y de sesiones personalizadas. Los fallos de limpieza se ignoran para que prevalezca el resultado de Cron.
    - Las ejecuciones aisladas con la concesión limitada de autolimpieza de Cron pueden leer el estado del programador, una lista filtrada que contiene únicamente su propio trabajo y el historial de ejecuciones de ese trabajo, y solo pueden eliminar su propio trabajo.
    - Las ejecuciones aisladas se protegen contra respuestas de confirmación obsoletas: si el primer resultado es únicamente una actualización provisional del estado (`on it`, `pulling everything together` e indicaciones similares) y ningún subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de entregarlo.
    - Se reconocen los metadatos estructurados de denegación de ejecución (incluidos los contenedores `UNAVAILABLE` del host de Node cuyo error anidado comienza por `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`) para evitar que un comando bloqueado se notifique como una ejecución correcta, sin confundir el texto normal del asistente con una denegación.
    - Los fallos del agente en el ámbito de la ejecución cuentan como errores del trabajo incluso sin contenido de respuesta, por lo que los fallos del modelo o proveedor incrementan los contadores de errores y activan las notificaciones de fallo en lugar de marcar el trabajo como completado correctamente.
    - Cuando un trabajo alcanza `timeoutSeconds`, Cron cancela la ejecución y le concede un breve intervalo de limpieza. Si no concluye, la limpieza controlada por el Gateway elimina por la fuerza la propiedad de la sesión de esa ejecución antes de que Cron registre el tiempo de espera, para que el trabajo de chat en cola no quede bloqueado tras una sesión de procesamiento obsoleta.
    - Los bloqueos durante la configuración o el inicio reciben un tiempo de espera específico de la fase (por ejemplo, `cron: isolated agent setup timed out before runner start` o `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Estos supervisores cubren proveedores integrados y respaldados por la CLI incluso antes de que se inicie su proceso externo de CLI, y sus límites se establecen independientemente de los valores prolongados de `timeoutSeconds` para que los fallos de arranque en frío, autenticación o contexto aparezcan rápidamente.

  </Accordion>
  <Accordion title="Conciliación de tareas">
    La conciliación de tareas de Cron se basa primero en la propiedad del entorno de ejecución y, en segundo lugar, en el historial persistente: una tarea activa de Cron permanece activa mientras el entorno de ejecución de Cron siga registrando ese trabajo como en ejecución, aunque aún exista una fila antigua de sesión secundaria. Una vez que el entorno de ejecución deja de ser propietario del trabajo y transcurre un periodo de gracia de 5 minutos, las comprobaciones de mantenimiento consultan los registros persistentes de ejecución y el estado del trabajo para la ejecución `cron:<jobId>:<startedAt>` correspondiente. Un resultado final allí finaliza el registro de tareas; de lo contrario, el mantenimiento controlado por el Gateway puede marcar la tarea como `lost`. La auditoría de la CLI sin conexión puede recuperarse mediante el historial persistente, pero el hecho de que su propio conjunto de trabajos activos en proceso esté vacío no demuestra que una ejecución controlada por el Gateway haya desaparecido.
  </Accordion>
</AccordionGroup>

## Tipos de programación

| Tipo      | Indicador de la CLI | Descripción                                                                                                      |
| --------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`              | Marca de tiempo única (ISO 8601 o relativa, como `20m`)                                                          |
| `every`   | `--every`           | Intervalo fijo (`10m`, `1h`, `1d`)                                                                               |
| `cron`    | `--cron`            | Expresión de Cron de 5 o 6 campos con `--tz` opcional                                                            |
| `on-exit` | `--on-exit`         | Se activa una vez cuando finaliza un comando supervisado (desencadenador de eventos; sobrevive al desmontaje del turno; `--on-exit-cwd` opcional) |

Las marcas de tiempo sin zona horaria se consideran UTC. Añada `--tz America/New_York` para interpretar una fecha y hora de `--at` sin desfase, o para evaluar una expresión de Cron, en esa zona horaria de IANA. Las expresiones de Cron sin `--tz` usan la zona horaria del host del Gateway. `--tz` no es válido con `--every` ni `--on-exit`.

Las expresiones recurrentes al inicio de la hora (minuto `0` con un campo de hora comodín) se escalonan automáticamente hasta 5 minutos para reducir los picos de carga. Use `--exact` para forzar una temporización precisa o `--stagger 30s` para establecer un intervalo explícito (solo para programaciones de Cron).

### El día del mes y el día de la semana usan lógica OR

Las expresiones de Cron las analiza [croner](https://github.com/Hexagon/croner). Cuando ni el campo del día del mes ni el del día de la semana son comodines, croner considera que hay una coincidencia cuando coincide **cualquiera** de los campos, no ambos. Este es el comportamiento estándar de Cron de Vixie.

```bash
# Objetivo: "A las 9:00 del día 15, solo si es lunes"
# Real:     "A las 9:00 de cada día 15 Y a las 9:00 de cada lunes"
0 9 15 * 1
```

Esto se activa aproximadamente 5-6 veces al mes en lugar de 0-1 veces al mes. Para exigir ambas condiciones, use el modificador de día de la semana `+` de croner (`0 9 15 * +1`) o programe según un campo y compruebe el otro en la instrucción o el comando del trabajo.

## Desencadenadores de eventos (supervisores de condiciones)

Un desencadenador de eventos añade un script de condición sin interfaz a una programación `every` o `cron`. Cron evalúa el script cuando corresponde ejecutar el trabajo y ejecuta la carga útil normal solo cuando el script devuelve `fire: true`:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Se activa solo cuando el estado observado difiere del de la última evaluación.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Investigate the CI status change." },
}
```

El script debe devolver `{ fire, message?, state? }`. El estado JSON anterior está disponible como `trigger.state`, profundamente inmutable; devuelva un nuevo valor de `state` para conservarlo. El estado tiene un límite de 16 KB. Cuando un resultado de activación incluye `message`, Cron lo añade al texto del evento del sistema o al mensaje del turno del agente antes de la ejecución. `once: true` desactiva el trabajo después de que su primera carga útil activada se complete correctamente.

`fire: false` conserva el estado y los contadores de la evaluación y, a continuación, reprograma el trabajo sin crear un historial de ejecuciones. Si falla la ejecución de una carga útil activada, el `state` devuelto **no** se conserva: la siguiente evaluación recibe el estado anterior y puede volver a activarse; por tanto, escriba los scripts como comprobaciones de solo lectura y mantenga las acciones en la carga útil. Las programaciones de desencadenadores tienen un intervalo mínimo configurable (30 segundos de forma predeterminada). Cada evaluación dispone de un presupuesto de tiempo real de 30 segundos y de hasta 5 llamadas a herramientas.

<Warning>
Activar `cron.triggers.enabled` permite que los scripts creados por agentes se ejecuten sin supervisión con la **política completa de herramientas del agente propietario, incluido `exec`**. Trátelo como ejecución de código sin supervisión con los permisos de ese agente; manténgalo desactivado a menos que se confíe en consecuencia en todos los agentes autorizados para crear trabajos de Cron.
</Warning>

Cree un supervisor desde un archivo de script local (`-` lee el script desde la entrada estándar):

```bash
openclaw cron add \
  --name "PR CI watcher" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Respond to the CI status change" \
  --session isolated
```

## Cargas útiles

Cada trabajo contiene exactamente un tipo de carga útil, elegido mediante un indicador:

| Carga útil         | Indicador                                      | Ejecución                                                     |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------- |
| Evento del sistema | `--system-event <text>`                        | Se pone en cola en la sesión principal, sin invocar el modelo |
| Mensaje del agente | `--message <text>`                             | Un turno del agente respaldado por un modelo                   |
| Comando            | `--command <shell>` o `--command-argv <json>`  | Un shell o proceso en el host del Gateway, sin invocar el modelo |

### Opciones del turno del agente

<ParamField path="--message" type="string" required>
  Texto de la instrucción (obligatorio para trabajos aislados, de la sesión actual o de sesiones personalizadas).
</ParamField>
<ParamField path="--model" type="string">
  Sustitución del modelo; debe resolverse en un modelo permitido o la ejecución falla con un error de validación.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos de reserva por trabajo, por ejemplo, `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Use `--fallbacks ""` para una ejecución estricta sin reservas.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  En `cron edit`, elimina la sustitución de reserva por trabajo para que este siga la precedencia de reserva configurada. No se puede combinar con `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  En `cron edit`, elimina la sustitución del modelo por trabajo para que este siga la precedencia normal de modelos de Cron (sustitución almacenada de la sesión de Cron o, en su defecto, el modelo predeterminado o del agente). No se puede combinar con `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Sustitución del nivel de razonamiento (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Los niveles disponibles siguen dependiendo del modelo y del entorno de ejecución del agente seleccionados.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  En `cron edit`, elimina la sustitución del nivel de razonamiento por trabajo. No se puede combinar con `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omite la inyección de archivos de arranque del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe las herramientas que puede usar el trabajo, por ejemplo, `--tools exec,read`.
</ParamField>

`--model` establece el modelo principal del trabajo; no reemplaza una anulación de `/model` de la sesión, por lo que las cadenas de modelos alternativos configuradas siguen aplicándose sobre este. Un modelo no resuelto o no permitido hace que la ejecución falle con un error de validación explícito, en lugar de recurrir silenciosamente al modelo predeterminado. Si un trabajo tiene `--model`, pero no tiene una lista de modelos alternativos explícita ni configurada, OpenClaw pasa una anulación de modelos alternativos vacía en lugar de añadir silenciosamente el modelo principal del agente como destino oculto de reintento.

Precedencia de selección de modelos para trabajos aislados, de mayor a menor:

1. `model` de la carga útil por trabajo (configuración explícita; un modelo no permitido hace que la ejecución falle)
2. Anulación del modelo del hook de Gmail (solo cuando la ejecución se originó en Gmail y esa anulación está permitida)
3. Anulación almacenada del modelo de la sesión de cron seleccionada por el usuario
4. Selección de modelo del agente/predeterminado

El modo rápido sigue la selección activa resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, cron aislado lo usa de forma predeterminada; una anulación almacenada de `fastMode` de la sesión (y después un `fastModeDefault` del agente) sigue prevaleciendo sobre la configuración del modelo en cualquier dirección. El modo automático usa el umbral `params.fastAutoOnSeconds` del modelo, con un valor predeterminado de 60 segundos.

Si una ejecución encuentra una transferencia activa por cambio de modelo, cron reintenta con el proveedor/modelo seleccionado y conserva esa selección (y cualquier perfil de autenticación nuevo) para la ejecución activa. Los reintentos están limitados: tras el intento inicial y 2 reintentos por cambio, cron aborta en lugar de entrar en un bucle.

Antes de que se inicie una ejecución aislada, OpenClaw comprueba los endpoints locales accesibles de los proveedores `api: "ollama"` y `api: "openai-completions"` configurados cuyo `baseUrl` sea de bucle invertido, red privada o `.local`. Esta comprobación preliminar recorre la cadena de modelos alternativos configurada del trabajo y solo marca la ejecución como `skipped` cuando ningún candidato es accesible; `--fallbacks ""` limita estrictamente ese recorrido al modelo principal. Si un endpoint no está disponible, la ejecución se registra como `skipped` con un error claro en lugar de iniciar una llamada al modelo. El resultado se almacena en caché durante 5 minutos por endpoint (no por trabajo ni por modelo), por lo que muchos trabajos programados que compartan un servidor local Ollama/vLLM/SGLang/LM Studio inactivo generan una sola comprobación en lugar de una avalancha de solicitudes. Las ejecuciones omitidas por la comprobación preliminar no incrementan la espera progresiva por errores de ejecución; establezca `failureAlert.includeSkipped` para habilitar alertas repetidas por omisiones.

### Cargas útiles de comandos

Las cargas útiles de comandos ejecutan scripts deterministas dentro del planificador del Gateway sin iniciar un turno respaldado por un modelo. Se ejecutan en el host del Gateway, capturan stdout/stderr, registran la ejecución en el historial de cron y reutilizan los mismos modos de entrega `announce`, `webhook` y `none` que los trabajos de turno del agente.

<Note>
El cron de comandos es una superficie de automatización del Gateway para administradores operadores, no una llamada de agente a `tools.exec`. Crear, actualizar, eliminar o ejecutar manualmente trabajos de cron requiere `operator.admin`; las ejecuciones programadas de comandos se ejecutan posteriormente dentro del proceso del Gateway como esa automatización creada por un administrador. La política de ejecución del agente (`tools.exec.mode`, solicitudes de aprobación y listas de herramientas permitidas por agente) rige las herramientas de ejecución visibles para el modelo, no las cargas útiles del cron de comandos.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Sondeo de profundidad de la cola" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` almacena `argv: ["sh", "-lc", <shell>]`. Use `--command-argv '["node","scripts/report.mjs"]'` para una ejecución exacta de argv sin análisis del shell. Las opciones `--command-env KEY=VALUE` (repetible), `--command-input`, `--timeout-seconds` (valor predeterminado: 10 minutos), `--no-output-timeout-seconds` y `--output-max-bytes` controlan el entorno del proceso, stdin y los límites de salida.

El texto entregado se deriva de la salida del proceso: se prioriza stdout si no está vacío; si stdout está vacío y stderr no lo está, se entrega stderr; si ambos están presentes, cron envía un pequeño bloque `stdout:` / `stderr:`. El código de salida `0` registra la ejecución como `ok`; una salida distinta de cero, una señal, un tiempo de espera agotado o un tiempo de espera sin salida agotado registra `error` y puede activar alertas de fallo. Un comando que solo imprime `NO_REPLY` utiliza la supresión normal del token silencioso de cron y no publica nada en el chat.

## Estilos de ejecución

| Estilo           | Valor de `--session` | Se ejecuta en                            | Idóneo para                                  |
| ---------------- | -------------------- | ---------------------------------------- | -------------------------------------------- |
| Sesión principal | `main`               | Carril dedicado de activación de cron    | Recordatorios, eventos del sistema           |
| Aislado          | `isolated`           | `cron:<jobId>` dedicado                  | Informes, tareas de mantenimiento en segundo plano |
| Sesión actual    | `current`            | Vinculada en el momento de la creación   | Trabajo recurrente que tiene en cuenta el contexto |
| Sesión personalizada | `session:custom-id` | Sesión con nombre persistente          | Flujos de trabajo basados en el historial    |

<AccordionGroup>
  <Accordion title="Sesión principal frente a aislada y personalizada">
    Los trabajos de **sesión principal** ponen en cola un evento del sistema en un carril de ejecución propiedad de cron y, opcionalmente, activan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Pueden usar el último contexto de entrega de la sesión principal de destino para las respuestas, pero no añaden los turnos rutinarios de cron al carril de chat humano ni prolongan la vigencia del restablecimiento diario/por inactividad de la sesión de destino. Los trabajos **aislados** ejecutan un turno dedicado del agente con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) conservan el contexto entre ejecuciones, lo que permite flujos de trabajo, como reuniones diarias de seguimiento, que se basan en resúmenes anteriores.

    Los eventos de cron de la sesión principal son recordatorios autónomos de eventos del sistema. No incluyen automáticamente la instrucción "Leer HEARTBEAT.md" del mensaje predeterminado de Heartbeat; indíquelo explícitamente en el texto del evento de cron si un recordatorio debe consultar `HEARTBEAT.md`.

  </Accordion>
  <Accordion title="Qué significa 'sesión nueva' para los trabajos aislados">
    Un nuevo identificador de transcripción/sesión por ejecución. OpenClaw conserva las preferencias seguras (configuración de razonamiento/modo rápido/nivel de detalle, etiquetas y anulaciones explícitas de modelo/autenticación seleccionadas por el usuario), pero no hereda el contexto de conversación ambiental de una fila de cron anterior: enrutamiento de canal/grupo, política de envío o puesta en cola, elevación, origen o vinculación con el runtime de ACP. Use `current` o `session:<id>` cuando un trabajo recurrente deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Entrega de subagentes y Discord">
    Cuando las ejecuciones aisladas de cron coordinan subagentes, la entrega prioriza la salida final del descendiente sobre el texto provisional obsoleto del padre. Si los descendientes siguen ejecutándose, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

    Para los destinos de anuncios de Discord que solo admiten texto, OpenClaw envía una vez el texto final canónico del asistente en lugar de reproducir tanto el texto transmitido/intermedio como la respuesta final. Los archivos multimedia y las cargas útiles estructuradas de Discord se siguen entregando por separado para no omitir archivos adjuntos ni componentes.

  </Accordion>
</AccordionGroup>

## Entrega y salida

| Modo       | Qué ocurre                                                                      |
| ---------- | ------------------------------------------------------------------------------- |
| `announce` | Entrega como alternativa el texto final al destino si el agente no lo envió     |
| `webhook`  | Envía mediante POST la carga útil del evento finalizado a una URL               |
| `none`     | No hay entrega alternativa por parte del ejecutor                               |

Use `--announce --channel telegram --to "-1001234567890"` para la entrega al canal. Para los temas de foros de Telegram, use `-1001234567890:topic:123`; OpenClaw también acepta la forma abreviada `-1001234567890:123`, propiedad de Telegram. Los clientes directos de RPC/configuración pueden pasar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost usan prefijos explícitos (`channel:<id>`, `user:<id>`). Los identificadores de sala de Matrix distinguen entre mayúsculas y minúsculas; use el identificador exacto de la sala o el formato `room:!room:server` de Matrix.

Cuando la entrega de anuncios usa `channel: "last"` u omite `channel`, un destino con prefijo de proveedor, como `telegram:123`, puede seleccionar el canal antes de que cron recurra al historial de la sesión o a un único canal configurado. Solo los prefijos anunciados por el Plugin cargado actúan como selectores de proveedor. Si `delivery.channel` es explícito, el prefijo del destino debe nombrar al mismo proveedor; `channel: "whatsapp"` con `to: "telegram:123"` se rechaza en lugar de permitir que WhatsApp interprete el identificador de Telegram como un número de teléfono. Los prefijos de tipo de destino y servicio (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) siguen siendo sintaxis de destino propiedad del canal, no selectores de proveedor.

Para los trabajos aislados, la entrega al chat es compartida: si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso con `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el anuncio alternativo. De lo contrario, `announce`, `webhook` y `none` solo controlan lo que hace el ejecutor con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino activo de entrega conservado para la ruta de anuncio alternativa. Las claves internas de sesión pueden estar en minúsculas; los destinos de entrega del proveedor no se reconstruyen a partir de esas claves cuando está disponible el contexto actual del chat.

La entrega implícita de anuncios utiliza las listas de canales permitidos configuradas para validar y redirigir destinos obsoletos. Las aprobaciones del almacén de emparejamiento de mensajes directos no son destinatarios de automatización alternativa; establezca `delivery.to` o configure la entrada `allowFrom` del canal cuando un trabajo programado deba enviar proactivamente a un mensaje directo.

### Notificaciones de fallos

Las notificaciones de fallos siguen una ruta de destino independiente:

- `cron.failureDestination` establece un valor predeterminado global para las notificaciones de fallos.
- `job.delivery.failureDestination` lo anula para cada trabajo.
- Si ninguno está establecido y el trabajo ya realiza entregas mediante `announce`, las notificaciones de fallos recurren a ese destino principal de anuncios.
- `delivery.failureDestination` solo se admite en trabajos con `sessionTarget="isolated"`, salvo que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` permite que un trabajo o la política global de alertas de cron genere alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador consecutivo de omisiones independiente, por lo que no afectan a la espera progresiva por errores de ejecución.
- `openclaw cron edit` ofrece ajustes de alertas por trabajo: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` y `--failure-alert-account-id`.

### Idioma de salida

Los trabajos de cron no deducen el idioma de respuesta a partir del canal, la configuración regional ni los mensajes anteriores. Incluya la regla de idioma en el mensaje o la plantilla programados:

```bash
openclaw cron edit <jobId> \
  --message "Resume las actualizaciones. Responde en chino; mantén sin cambios las URL, el código y los nombres de productos."
```

Para los archivos de plantilla, mantenga la instrucción de idioma en el mensaje renderizado y compruebe que los marcadores de posición como `{{language}}` estén rellenados antes de ejecutar el trabajo. Si la salida mezcla idiomas, haga explícita la regla, por ejemplo: "Usa chino para el texto narrativo y mantén los términos técnicos en inglés."

## Ejemplos de la CLI

<Tabs>
  <Tab title="Recordatorio único">
    ```bash
    openclaw cron add \
      --name "Comprobación del calendario" \
      --at "20m" \
      --session main \
      --system-event "Próximo heartbeat: comprobar el calendario." \
      --wake now
    ```
  </Tab>
  <Tab title="Tarea aislada recurrente">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Resume las actualizaciones de la noche." \
      --name "Resumen matutino" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Anulación del modelo y del razonamiento">
    ```bash
    openclaw cron add \
      --name "Análisis profundo" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Análisis profundo semanal del progreso del proyecto." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Salida de Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Resume los despliegues de hoy como JSON." \
      --name "Resumen de despliegues" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Salida de comandos">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Sondeo de profundidad de la cola" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Gestión de tareas

```bash
# Enumerar todas las tareas
openclaw cron list

# Obtener una tarea almacenada como JSON
openclaw cron get <jobId>

# Mostrar una tarea, incluida la ruta de entrega resuelta
openclaw cron show <jobId>

# Activar o desactivar sin eliminar
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Editar una tarea
openclaw cron edit <jobId> --message "Instrucción actualizada" --model "opus"

# Forzar la ejecución inmediata de una tarea
openclaw cron run <jobId>

# Forzar la ejecución inmediata de una tarea y esperar su estado final
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Ejecutar solo si corresponde
openclaw cron run <jobId> --due

# Ver el historial de ejecuciones
openclaw cron runs --id <jobId> --limit 50

# Ver una ejecución exacta
openclaw cron runs --id <jobId> --run-id <runId>

# Eliminar una tarea
openclaw cron remove <jobId>

# Selección de agente (configuraciones multiagente)
openclaw cron create "0 6 * * *" "Comprueba la cola de operaciones" --name "Revisión de operaciones" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

Archivar una sesión (desde la interfaz de control o mediante `sessions.patch { archived: true }` desde un llamador operador-administrador) desactiva todas las tareas cron activadas vinculadas a esa sesión: su sesión aislada `cron:<jobId>`, un destino `session:<key>` o un carril `sessionKey` de entrega/activación. Restaurar la sesión no vuelve a activar esas tareas; usa `openclaw cron enable <jobId>`. Las sesiones con una tarea vinculada activada muestran una insignia de reloj en la barra lateral de la interfaz de control.

`openclaw cron run <jobId>` retorna después de poner en cola la ejecución manual. Usa `--wait` para enlaces de apagado, scripts de mantenimiento u otra automatización que deba bloquearse hasta que finalice la ejecución en cola; consulta periódicamente el `runId` retornado (tiempo de espera predeterminado de `10m`, intervalo de consulta de `2s`) y termina con `0` para el estado `ok`, y con un valor distinto de cero para `error`, `skipped` o si se agota el tiempo de espera.

La herramienta `cron` del agente retorna resúmenes compactos de las tareas (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) mediante `cron(action: "list")`; usa `cron(action: "get", jobId: "...")` para obtener la definición completa de una tarea. Los llamadores directos del Gateway pueden pasar `compact: true` a `cron.list`; omitirlo conserva la respuesta completa con vistas previas de entrega.

`openclaw cron create` es un alias de `openclaw cron add`. Las tareas nuevas pueden usar una programación posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` o una marca de tiempo ISO) seguida de una instrucción posicional para el agente. Usa `--webhook <url>` en `cron add|create` o `cron edit` para enviar mediante POST la carga de la ejecución finalizada a un extremo HTTP; la entrega mediante Webhook no puede combinarse con indicadores de entrega por chat (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`). En `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account` eliminan individualmente esos campos de enrutamiento (cada uno se rechaza junto con su indicador de asignación correspondiente), a diferencia de `--no-deliver`, que solo desactiva la entrega alternativa del ejecutor.

<Note>
Nota sobre la anulación del modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado de la tarea.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido o no puede resolverse, cron hace que la ejecución falle con un error de validación explícito.
- Los parches de carga de la API `cron.update` pueden establecer `model: null` para eliminar una anulación de modelo almacenada en una tarea.
- `openclaw cron edit <job-id> --clear-model` elimina esa anulación desde la CLI (el mismo efecto que el parche `model: null`) y no puede combinarse con `--model`.
- Las cadenas de alternativas configuradas siguen aplicándose porque `--model` de cron es el modelo principal de una tarea, no una anulación de `/model` de la sesión.
- `openclaw cron add|edit --fallbacks ...` establece `fallbacks` en la carga y reemplaza las alternativas configuradas para esa tarea; `--fallbacks ""` desactiva las alternativas y hace que la ejecución sea estricta. `openclaw cron edit <job-id> --clear-fallbacks` elimina la anulación específica de la tarea.
- Un `--model` por sí solo, sin una lista de alternativas explícita o configurada, no recurre al modelo principal del agente como destino adicional de reintento silencioso.

</Note>

## Webhooks

El Gateway puede exponer extremos de Webhook HTTP para activadores externos. Actívalos en la configuración:

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

Cada solicitud debe incluir el token del enlace mediante una cabecera:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Los tokens en la cadena de consulta se rechazan.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Pone en cola un evento del sistema para la sesión principal:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"Se recibió un correo electrónico nuevo","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Descripción del evento.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` o `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Ejecuta un turno aislado del agente:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Resume la bandeja de entrada","name":"Correo electrónico","model":"openai/gpt-5.6-sol"}'
    ```

    Campos: `message` (obligatorio), `name`, `agentId`, `sessionKey` (requiere `hooks.allowRequestSessionKey=true`), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Enlaces asignados (POST /hooks/<name>)">
    Los nombres de enlaces personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas arbitrarias en acciones `wake` o `agent` mediante plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantén los extremos de los enlaces detrás de la interfaz de bucle invertido, una red tailnet o un proxy inverso de confianza.

- Usa un token de enlace dedicado; no reutilices los tokens de autenticación del Gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Establece `hooks.allowedAgentIds` para limitar el agente efectivo al que puede dirigirse un enlace, incluido el agente predeterminado cuando se omite `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` a menos que necesites sesiones seleccionadas por el llamador.
- Si activas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de las claves de sesión.
- Las cargas de los enlaces se encapsulan con límites de seguridad de forma predeterminada.

</Warning>

## Integración con Gmail PubSub

Conecta los activadores de la bandeja de entrada de Gmail con OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI `gcloud`, `gog` (gogcli), enlaces de OpenClaw activados y Tailscale para el extremo HTTPS público.
</Note>

### Configuración mediante el asistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, activa el preajuste de Gmail y usa Tailscale Funnel de forma predeterminada para el extremo de envío (`--tailscale funnel|serve|off`).

### Inicio automático del Gateway

Cuando `hooks.enabled=true` y se ha establecido `hooks.gmail.account`, el Gateway inicia `gog gmail watch serve` durante el arranque y renueva automáticamente la supervisión. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desactivarla.

### Configuración manual única

<Steps>
  <Step title="Seleccionar el proyecto de GCP">
    Selecciona el proyecto de GCP propietario del cliente OAuth que utiliza `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Crear el tema y conceder a Gmail acceso de envío">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Iniciar la supervisión">
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
    triggers: {
      enabled: false,
      minIntervalMs: 30000,
    },
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

Los valores de `retry` anteriores son los predeterminados: hasta 3 reintentos con espera de `30s/60s/5m`, reintentando las cinco categorías transitorias. `webhookToken` se envía como `Authorization: Bearer <token>` en las solicitudes POST de los Webhooks de cron.

`maxConcurrentRuns` limita tanto el envío programado de cron como la ejecución de turnos aislados del agente, y su valor predeterminado es 8. Los turnos aislados del agente de cron utilizan internamente el carril de ejecución dedicado `cron-nested` de la cola, por lo que aumentar este valor permite que ejecuciones LLM de cron independientes avancen en paralelo, en lugar de iniciar únicamente sus envoltorios externos de cron. Esta opción no amplía el carril compartido `nested` que no pertenece a cron.

`cron.store` es una clave lógica del almacén y una ruta de migración de doctor, no un archivo JSON activo que deba editarse manualmente. Los datos de las tareas se encuentran en SQLite; usa la CLI o la API del Gateway para realizar cambios.

Desactivar cron: `cron.enabled: false` u `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamiento de los reintentos">
    **Reintento único**: los errores transitorios (límite de frecuencia, sobrecarga, red, tiempo de espera, error del servidor) se reintentan hasta `retry.maxAttempts` veces (valor predeterminado: 3) mediante `retry.backoffMs` (valores predeterminados: 30s, 60s, 5m). Los errores permanentes desactivan la tarea inmediatamente.

    **Reintento recurrente**: los errores de ejecución consecutivos aplican una espera conforme a una programación ampliada (30s, 60s, 5m, 15m, 60m). La espera se restablece después de la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Mantenimiento">
    `cron.sessionRetention` (valor predeterminado: `24h`; `false` lo desactiva) elimina las entradas de sesiones de ejecución aisladas. `cron.runLog.keepLines` limita el número de filas del historial de ejecuciones de SQLite que se conservan por tarea; `maxBytes` se conserva por compatibilidad de configuración con registros de ejecución antiguos respaldados por archivos.
  </Accordion>
  <Accordion title="Migración del almacén heredado">
    Después de actualizar, ejecuta `openclaw doctor --fix` para importar a SQLite los archivos heredados `~/.openclaw/cron/jobs.json`, `jobs-state.json` y `runs/*.jsonl`, y cambiarles el nombre con el sufijo `.migrated`. Las filas de tareas con formato incorrecto se omiten durante la ejecución y se copian a `jobs-quarantine.json` para su posterior reparación o revisión.
  </Accordion>
</AccordionGroup>

## Solución de problemas

### Secuencia de comandos

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
  <Accordion title="Cron no se ejecuta">
    - Compruebe `cron.enabled` y la variable de entorno `OPENCLAW_SKIP_CRON`.
    - Confirme que el Gateway se ejecuta continuamente.
    - Para las programaciones de `cron`, verifique la zona horaria (`--tz`) con respecto a la zona horaria del host.
    - `reason: not-due` en la salida de la ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y que aún no correspondía ejecutar el trabajo.

  </Accordion>
  <Accordion title="Cron se ejecutó, pero no hubo entrega">
    - El modo de entrega `none` significa que no se espera ningún envío alternativo del ejecutor. El agente aún puede enviar directamente con la herramienta `message` cuando haya disponible una ruta de chat.
    - Si falta el destino de entrega o no es válido (`channel`/`to`), se omite el envío saliente.
    - En Matrix, los trabajos copiados o heredados cuyos identificadores de sala `delivery.to` estén en minúsculas pueden fallar porque los identificadores de sala de Matrix distinguen entre mayúsculas y minúsculas. Edite el trabajo para usar el valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que las credenciales bloquearon la entrega.
    - Si la ejecución aislada devuelve únicamente el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y la ruta alternativa de resumen en cola, por lo que no se publica nada en el chat.
    - Si el agente debe enviar un mensaje al usuario por sí mismo, compruebe que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat anterior o un canal/destino explícito).

  </Accordion>
  <Accordion title="Cron o Heartbeat parece impedir la renovación de estilo /new">
    - La vigencia del restablecimiento diario y por inactividad no se basa en `updatedAt`; consulte [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Las activaciones de Cron, las ejecuciones de Heartbeat, las notificaciones de ejecución y el mantenimiento del Gateway pueden actualizar la fila de la sesión para el enrutamiento o el estado, pero no amplían `sessionStartedAt` ni `lastInteractionAt`.
    - En las filas heredadas creadas antes de que existieran esos campos, OpenClaw puede recuperar `sessionStartedAt` del encabezado de sesión de la transcripción JSONL cuando el archivo aún está disponible. Las filas heredadas inactivas sin `lastInteractionAt` utilizan esa hora de inicio recuperada como referencia de inactividad.

  </Accordion>
  <Accordion title="Consideraciones sobre las zonas horarias">
    - Cron sin `--tz` utiliza la zona horaria del host del Gateway.
    - Las programaciones de `at` sin zona horaria se tratan como UTC.
    - `activeHours` de Heartbeat utiliza la resolución de zona horaria configurada.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Automatización](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para las ejecuciones de Cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de la zona horaria
