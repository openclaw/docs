---
read_when:
    - Programación de trabajos en segundo plano o activaciones
    - Conexión de activadores externos (webhooks, Gmail) con OpenClaw
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Trabajos programados, webhooks y activadores de Gmail PubSub para el planificador del Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-07-16T11:21:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9a419d4376fa08df1c429c167ead6918262cc34b986a85ffec024023f6da1eef
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el planificador integrado del Gateway. Conserva los trabajos, activa al agente en el momento adecuado y puede entregar la salida a un canal de chat, a un webhook o a ningún destino.

## Inicio rápido

<Steps>
  <Step title="Añadir un recordatorio de una sola ejecución">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Consultar los trabajos">
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
- Los trabajos de una sola ejecución (`--at`) se eliminan automáticamente tras completarse correctamente de forma predeterminada; proporcione `--keep-after-run` para conservarlos.
- Presupuesto de tiempo real por ejecución: `--timeout-seconds` cuando se establece. De lo contrario, los trabajos de turno de agente aislados o desacoplados están limitados por el supervisor propio de Cron de 60 minutos, antes de que pudiera aplicarse el tiempo de espera del turno de agente subyacente (`agents.defaults.timeoutSeconds`, 48 horas de forma predeterminada); los trabajos de comandos tienen un valor predeterminado de 10 minutos.
- Al iniciar el Gateway, los trabajos de turno de agente aislados vencidos se reprograman en lugar de reproducirse inmediatamente, lo que mantiene el trabajo de inicialización del modelo y las herramientas fuera del intervalo de conexión del canal.
- Si ejecuta `openclaw agent` mediante el Cron del sistema u otro planificador externo, envuélvalo con una escalada de finalización forzada, aunque la CLI ya gestione `SIGTERM`/`SIGINT`. Las ejecuciones respaldadas por el Gateway solicitan al Gateway que cancele las ejecuciones aceptadas; las ejecuciones locales y las de reserva integradas reciben la misma señal de cancelación. Para `timeout` de GNU, se recomienda `timeout -k 60 600 openclaw agent ...` en lugar de `timeout 600 ...` sin más: el valor `-k` sirve como último recurso si el proceso no puede finalizar a tiempo. Para las unidades de systemd, use una señal de detención `SIGTERM` con un período de gracia (`TimeoutStopSec`) antes de la finalización definitiva. Si se reutiliza un `--run-id` mientras la ejecución original del Gateway sigue activa, el duplicado se notifica como en curso en lugar de iniciar una segunda ejecución.

<AccordionGroup>
  <Accordion title="Protección de las ejecuciones aisladas">
    - Al finalizar, las ejecuciones aisladas intentan cerrar las pestañas y los procesos del navegador rastreados para su sesión `cron:<jobId>`, y descartan cualquier instancia del entorno de ejecución MCP incluido que se haya creado para el trabajo mediante la misma ruta de desmontaje compartida que usan las ejecuciones de la sesión principal y de sesiones personalizadas. Los fallos de limpieza se ignoran para que el resultado de Cron siga prevaleciendo.
    - Las ejecuciones aisladas que disponen de la concesión limitada de autolimpieza de Cron pueden consultar el estado del planificador, una lista filtrada que contiene únicamente su propio trabajo y el historial de ejecuciones de ese trabajo, y solo pueden eliminar su propio trabajo.
    - Las ejecuciones aisladas se protegen frente a respuestas de confirmación obsoletas: si el primer resultado es únicamente una actualización provisional de estado (`on it`, `pulling everything together` e indicaciones similares) y ningún subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de entregarlo.
    - Se reconocen los metadatos estructurados de denegación de ejecución (incluidos los envoltorios `UNAVAILABLE` del host de Node cuyo error anidado comienza por `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`), de modo que un comando bloqueado no se notifica como una ejecución correcta, mientras que el texto normal del asistente no se confunde con una denegación.
    - Los fallos del agente en el ámbito de la ejecución cuentan como errores del trabajo incluso cuando no existe contenido de respuesta, por lo que los fallos del modelo o del proveedor incrementan los contadores de errores y activan notificaciones de fallo en lugar de dar el trabajo por completado correctamente.
    - Cuando un trabajo alcanza `timeoutSeconds`, Cron cancela la ejecución y le concede un breve intervalo de limpieza. Si no finaliza, la limpieza gestionada por el Gateway libera por la fuerza la propiedad de la sesión de esa ejecución antes de que Cron registre el tiempo de espera agotado, para que el trabajo de chat en cola no quede bloqueado detrás de una sesión de procesamiento obsoleta.
    - Los bloqueos durante la configuración o el inicio tienen un tiempo de espera específico para cada fase (por ejemplo, `cron: isolated agent setup timed out before runner start` o `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Estos supervisores abarcan a los proveedores integrados y a los respaldados por la CLI incluso antes de que se inicie su proceso de CLI externo, y se limitan independientemente de los valores elevados de `timeoutSeconds`, para que los fallos de arranque en frío, autenticación o contexto aparezcan rápidamente.

  </Accordion>
  <Accordion title="Conciliación de tareas">
    La conciliación de tareas de Cron se basa primero en el entorno de ejecución y, en segundo lugar, en el historial persistente: una tarea activa de Cron permanece activa mientras el entorno de ejecución de Cron siga registrando ese trabajo como en ejecución, aunque todavía exista una fila antigua de una sesión secundaria. Cuando el entorno de ejecución deja de controlar el trabajo y transcurre un período de gracia de 5 minutos, el mantenimiento consulta los registros de ejecución persistentes y el estado del trabajo para la ejecución `cron:<jobId>:<startedAt>` correspondiente. Un resultado terminal allí finaliza el registro de tareas; de lo contrario, el mantenimiento gestionado por el Gateway puede marcar la tarea como `lost`. La auditoría de la CLI sin conexión puede recuperar información del historial persistente, pero que su propio conjunto de trabajos activos en proceso esté vacío no demuestra que haya desaparecido una ejecución gestionada por el Gateway.
  </Accordion>
</AccordionGroup>

## Tipos de programación

| Tipo      | Opción de la CLI    | Descripción                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | Marca de tiempo de una sola ejecución (ISO 8601 o relativa, como `20m`)                                                     |
| `every`   | `--every`   | Intervalo fijo (`10m`, `1h`, `1d`)                                                                       |
| `cron`    | `--cron`    | Expresión de Cron de 5 o 6 campos con `--tz` opcional                                                  |
| `on-exit` | `--on-exit` | Se activa una vez cuando finaliza un comando supervisado (desencadenador de eventos; persiste tras el desmontaje del turno; `--on-exit-cwd` opcional) |

Las marcas de tiempo sin zona horaria se consideran UTC. Añada `--tz America/New_York` para interpretar una fecha y hora `--at` sin desplazamiento, o para evaluar una expresión de Cron, en esa zona horaria de IANA. Las expresiones de Cron sin `--tz` usan la zona horaria del host del Gateway. `--tz` no es válido con `--every` ni con `--on-exit`.

Las expresiones recurrentes al inicio de cada hora (minuto `0` con un comodín en el campo de la hora) se escalonan automáticamente hasta 5 minutos para reducir los picos de carga. Use `--exact` para forzar una temporización precisa o `--stagger 30s` para establecer un intervalo explícito (solo para programaciones de Cron).

### El día del mes y el día de la semana usan lógica OR

Las expresiones de Cron se analizan mediante [croner](https://github.com/Hexagon/croner). Cuando tanto el campo del día del mes como el del día de la semana no son comodines, croner considera que hay una coincidencia cuando coincide **cualquiera** de los campos, no ambos. Este es el comportamiento estándar de Cron de Vixie.

```bash
# Previsto: "9 a. m. el día 15, solo si es lunes"
# Real:     "9 a. m. cada día 15, Y 9 a. m. cada lunes"
0 9 15 * 1
```

Esto se activa aproximadamente 5-6 veces al mes en lugar de 0-1 veces al mes. Para exigir ambas condiciones, use el modificador de día de la semana de croner `+` (`0 9 15 * +1`), o programe según un campo y compruebe el otro en el prompt o comando del trabajo.

## Desencadenadores de eventos (supervisores de condiciones)

Un desencadenador de eventos añade un script de condición sin interfaz a una programación `every` o `cron`. Cron evalúa el script cuando corresponde ejecutar el trabajo y ejecuta la carga útil normal solo cuando el script devuelve `fire: true`:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Se activa solo cuando el estado observado difiere de la última evaluación.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Investiga el cambio de estado de la CI." },
}
```

El script debe devolver `{ fire, message?, state? }`. El estado JSON anterior está disponible como el objeto profundamente inmutable `trigger.state`; devuelva un nuevo valor `state` para conservarlo. El estado tiene un límite de 16 KB. Cuando un resultado de activación incluye `message`, Cron lo añade al texto del evento del sistema o al mensaje del turno del agente antes de la ejecución. `once: true` deshabilita el trabajo después de la primera ejecución correcta de su carga útil activada.

`fire: false` conserva el estado y los contadores de la evaluación y, a continuación, reprograma sin crear un historial de ejecuciones. Si falla la ejecución de una carga útil activada, el valor `state` devuelto **no** se conserva: la siguiente evaluación ve el estado anterior y puede volver a activarse, por lo que los scripts deben realizar comprobaciones de solo lectura y las acciones deben mantenerse en la carga útil. Las programaciones con desencadenadores tienen un intervalo mínimo configurable (30 segundos de forma predeterminada). Cada evaluación dispone de un límite de 30 segundos de tiempo de reloj y hasta 5 llamadas a herramientas.

<Warning>
Habilitar `cron.triggers.enabled` permite que los scripts creados por agentes se ejecuten sin interfaz con la **política de herramientas completa del agente propietario, incluido `exec`**. Trátelo como ejecución de código desatendida con los permisos de ese agente; manténgalo deshabilitado a menos que se confíe en consecuencia en todos los agentes que pueden crear trabajos de Cron.
</Warning>

Cree un supervisor desde un archivo de script local (`-` lee el script desde la entrada estándar):

```bash
openclaw cron add \
  --name "Supervisor de CI de PR" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Responde al cambio de estado de la CI" \
  --session isolated
```

## Cargas útiles

Cada trabajo contiene exactamente un tipo de carga útil, elegido mediante una opción:

| Carga útil        | Opción                                         | Ejecución                                                        |
| ----------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| Evento del sistema | `--system-event <text>`                            | Se pone en cola en la sesión principal, sin llamar al modelo por sí solo |
| Mensaje del agente | `--message <text>`                            | Un turno del agente respaldado por un modelo                      |
| Comando            | `--command <shell>` o `--command-argv <json>`      | Un shell/proceso en el host del Gateway, sin llamar al modelo     |

### Opciones de turno del agente

<ParamField path="--message" type="string" required>
  Texto del prompt (obligatorio para tareas aisladas, de sesión actual o de sesión personalizada).
</ParamField>
<ParamField path="--model" type="string">
  Sustitución del modelo; debe resolverse en un modelo permitido o la ejecución falla con un error de validación.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos alternativos por tarea, por ejemplo `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Pase `--fallbacks ""` para una ejecución estricta sin modelos alternativos.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Con `cron edit`, elimina la sustitución de modelos alternativos por tarea para que la tarea siga la precedencia de modelos alternativos configurada. No se puede combinar con `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Con `cron edit`, elimina la sustitución del modelo por tarea para que esta siga la precedencia normal de modelos de Cron (sustitución almacenada de la sesión de Cron o, en su defecto, modelo predeterminado o del agente). No se puede combinar con `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Sustitución del nivel de razonamiento (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Los niveles disponibles siguen dependiendo del modelo y del entorno de ejecución del agente seleccionados.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Con `cron edit`, elimina la sustitución del nivel de razonamiento por tarea. No se puede combinar con `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omite la inserción de archivos de arranque del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe las herramientas que puede usar la tarea, por ejemplo `--tools exec,read`.
</ParamField>

`--model` establece el modelo principal de la tarea; no reemplaza una sustitución de sesión `/model`, por lo que las cadenas de modelos alternativos configuradas siguen aplicándose sobre él. Un modelo no resuelto o no permitido hace que la ejecución falle con un error de validación explícito, en lugar de recurrir silenciosamente al modelo predeterminado. Si una tarea tiene `--model` pero no tiene una lista explícita o configurada de modelos alternativos, OpenClaw pasa una sustitución vacía de modelos alternativos en lugar de añadir silenciosamente el modelo principal del agente como destino oculto para reintentos.

Precedencia de selección de modelos para tareas aisladas, de mayor a menor:

1. Carga útil por tarea `model` (configuración explícita; un modelo no permitido hace que la ejecución falle)
2. Sustitución del modelo del enlace de Gmail (solo cuando la ejecución procede de Gmail y esa sustitución está permitida)
3. Sustitución del modelo almacenada en la sesión de Cron y seleccionada por el usuario
4. Selección del modelo predeterminado o del agente

El modo rápido sigue la selección activa resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, Cron aislado lo usa de forma predeterminada; una sustitución almacenada de sesión `fastMode` (y después una `fastModeDefault` del agente) sigue teniendo prioridad sobre la configuración del modelo en cualquier sentido. El modo automático usa el límite `params.fastAutoOnSeconds` del modelo, cuyo valor predeterminado es 60 segundos.

Si una ejecución llega a una transferencia de cambio de modelo en vivo, Cron vuelve a intentarlo con el proveedor y el modelo seleccionados por el cambio y conserva esa selección (y cualquier perfil de autenticación nuevo) para la ejecución activa. Los reintentos están limitados: después del intento inicial y 2 reintentos por cambio, Cron se interrumpe en lugar de entrar en un bucle.

Antes de iniciar una ejecución aislada, OpenClaw comprueba los puntos de conexión locales accesibles para los proveedores `api: "ollama"` y `api: "openai-completions"` configurados cuyo `baseUrl` sea de bucle invertido, de red privada o `.local`. Esta comprobación previa recorre la cadena de modelos alternativos configurada para la tarea y solo marca la ejecución como `skipped` cuando no se puede acceder a ningún candidato; `--fallbacks ""` mantiene el recorrido restringido estrictamente al modelo principal. Un punto de conexión inactivo registra la ejecución como `skipped` con un error claro en lugar de iniciar una llamada al modelo. El resultado se almacena en caché durante 5 minutos por punto de conexión (no por tarea ni por modelo), de modo que muchas tareas con vencimiento simultáneo que compartan un servidor local inactivo de Ollama/vLLM/SGLang/LM Studio solo generen una comprobación en lugar de una avalancha de solicitudes. Las ejecuciones omitidas por la comprobación previa no incrementan el retraso progresivo por errores de ejecución; establezca `failureAlert.includeSkipped` para habilitar alertas repetidas de omisión.

### Cargas útiles de comandos

Las cargas útiles de comandos ejecutan scripts deterministas dentro del programador del Gateway sin iniciar un turno respaldado por un modelo. Se ejecutan en el host del Gateway, capturan stdout/stderr, registran la ejecución en el historial de Cron y reutilizan los mismos modos de entrega `announce`, `webhook` y `none` que las tareas de turno del agente.

<Note>
Cron de comandos es una superficie de automatización administrativa del Gateway para operadores, no una llamada `tools.exec` del agente. Crear, actualizar, eliminar o ejecutar manualmente tareas de Cron requiere `operator.admin`; las ejecuciones programadas de comandos se ejecutan posteriormente dentro del proceso del Gateway como esa automatización creada por un administrador. La política de ejecución del agente (`tools.exec.mode`, solicitudes de aprobación y listas de herramientas permitidas por agente) rige las herramientas de ejecución visibles para el modelo, no las cargas útiles de Cron de comandos.
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

`--command <shell>` almacena `argv: ["sh", "-lc", <shell>]`. Use `--command-argv '["node","scripts/report.mjs"]'` para ejecutar argv exactamente sin análisis del intérprete de comandos. Los valores opcionales `--command-env KEY=VALUE` (repetible), `--command-input`, `--timeout-seconds` (valor predeterminado: 10 minutos), `--no-output-timeout-seconds` y `--output-max-bytes` controlan el entorno del proceso, stdin y los límites de salida.

El texto entregado se deriva de la salida del proceso: stdout no vacío tiene prioridad; si stdout está vacío y stderr no lo está, se entrega stderr; si ambos están presentes, Cron envía un pequeño bloque `stdout:` / `stderr:`. El código de salida `0` registra la ejecución como `ok`; una salida distinta de cero, una señal, un tiempo de espera agotado o un tiempo de espera agotado sin salida registra `error` y puede activar alertas de fallo. Un comando que solo imprime `NO_REPLY` usa la supresión normal de tokens silenciosos de Cron y no publica nada en el chat.

## Estilos de ejecución

| Estilo          | Valor de `--session` | Se ejecuta en                         | Ideal para                              |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesión principal | `main`              | Canal de activación dedicado de Cron | Recordatorios, eventos del sistema      |
| Aislado         | `isolated`          | `cron:<jobId>` dedicado | Informes, tareas rutinarias en segundo plano |
| Sesión actual   | `current`           | Vinculada en el momento de la creación | Trabajo recurrente que tiene en cuenta el contexto |
| Sesión personalizada | `session:custom-id` | Sesión persistente con nombre | Flujos de trabajo que se basan en el historial |

<AccordionGroup>
  <Accordion title="Sesión principal frente a aislada y personalizada">
    Las tareas de **sesión principal** ponen en cola un evento del sistema en un canal de ejecución propiedad de Cron y, opcionalmente, activan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Pueden usar el último contexto de entrega de la sesión principal de destino para las respuestas, pero no añaden los turnos rutinarios de Cron al canal de chat humano ni prolongan la vigencia del restablecimiento diario o por inactividad de la sesión de destino. Las tareas **aisladas** ejecutan un turno dedicado del agente con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) conservan el contexto entre ejecuciones, lo que permite flujos de trabajo como reuniones diarias que se basan en resúmenes anteriores.

    Los eventos de Cron de la sesión principal son recordatorios autocontenidos de eventos del sistema. No incluyen automáticamente la instrucción "Leer HEARTBEAT.md" del prompt predeterminado de Heartbeat; indíquelo explícitamente en el texto del evento de Cron si un recordatorio debe consultar `HEARTBEAT.md`.

  </Accordion>
  <Accordion title="Qué significa «sesión nueva» para las tareas aisladas">
    Un nuevo identificador de transcripción o sesión por ejecución. OpenClaw conserva preferencias seguras (ajustes de razonamiento, modo rápido y nivel de detalle, etiquetas y sustituciones explícitas de modelo o autenticación seleccionadas por el usuario), pero no hereda el contexto de conversación implícito de una fila anterior de Cron: enrutamiento de canal o grupo, política de envío o puesta en cola, elevación, origen ni vinculación del entorno de ejecución de ACP. Use `current` o `session:<id>` cuando una tarea recurrente deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Entrega de subagentes y Discord">
    Cuando las ejecuciones aisladas de Cron coordinan subagentes, la entrega da prioridad a la salida final del último descendiente frente al texto provisional obsoleto del elemento principal. Si los descendientes siguen ejecutándose, OpenClaw suprime esa actualización parcial del elemento principal en lugar de anunciarla.

    Para destinos de anuncios de Discord que solo admiten texto, OpenClaw envía una vez el texto final canónico del asistente, en lugar de reproducir tanto el texto transmitido o provisional como la respuesta final. Los archivos multimedia y las cargas útiles estructuradas de Discord siguen entregándose por separado para no omitir los archivos adjuntos ni los componentes.

  </Accordion>
</AccordionGroup>

## Entrega y salida

| Modo       | Qué sucede                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Entrega como alternativa el texto final al destino si el agente no lo envió |
| `webhook`  | Envía mediante POST la carga útil del evento finalizado a una URL |
| `none`     | Sin entrega alternativa del ejecutor |

Use `--announce --channel telegram --to "-1001234567890"` para la entrega por canal. Para temas de foros de Telegram, use `-1001234567890:topic:123`; OpenClaw también acepta la forma abreviada `-1001234567890:123`, propia de Telegram. Los emisores directos de RPC o configuración pueden pasar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost usan prefijos explícitos (`channel:<id>`, `user:<id>`). Los identificadores de salas de Matrix distinguen entre mayúsculas y minúsculas; use el identificador exacto de la sala o la forma `room:!room:server` de Matrix.

Cuando la entrega de anuncios usa `channel: "last"` u omite `channel`, un destino con prefijo de proveedor, como `telegram:123`, puede seleccionar el canal antes de que Cron recurra al historial de la sesión o a un único canal configurado. Solo los prefijos anunciados por el Plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo del destino debe nombrar al mismo proveedor; `channel: "whatsapp"` con `to: "telegram:123"` se rechaza en lugar de permitir que WhatsApp interprete el identificador de Telegram como un número de teléfono. Los prefijos de tipo de destino y servicio (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) siguen siendo sintaxis de destino propiedad del canal, no selectores de proveedor.

Para las tareas aisladas, la entrega al chat es compartida: si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso con `--no-deliver`. Si el agente envía al destino configurado o actual, OpenClaw omite el anuncio alternativo. De lo contrario, `announce`, `webhook` y `none` solo controlan lo que hace el ejecutor con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino de entrega en vivo conservado para la ruta alternativa de anuncios. Las claves internas de sesión pueden estar en minúsculas; los destinos de entrega del proveedor no se reconstruyen a partir de esas claves cuando está disponible el contexto del chat actual.

La entrega implícita de anuncios usa listas configuradas de canales permitidos para validar y redirigir destinos obsoletos. Las aprobaciones del almacén de emparejamiento de mensajes directos no son destinatarios de automatización alternativa; establezca `delivery.to` o configure la entrada `allowFrom` del canal cuando una tarea programada deba enviar mensajes de forma proactiva a un mensaje directo.

### Notificaciones de fallo

Las notificaciones de fallo siguen una ruta de destino independiente:

- `cron.failureDestination` establece un valor predeterminado global para las notificaciones de fallos.
- `job.delivery.failureDestination` lo sustituye para cada trabajo.
- Si no se establece ninguno y el trabajo ya realiza la entrega mediante `announce`, las notificaciones de fallos recurren a ese destino principal de anuncio.
- `delivery.failureDestination` solo se admite en trabajos `sessionTarget="isolated"`, salvo que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` permite que la política de alertas de un trabajo o de Cron global emita alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador independiente de omisiones consecutivas, por lo que no afectan al retroceso de los errores de ejecución.
- `openclaw cron edit` ofrece ajustes de alertas por trabajo: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` y `--failure-alert-account-id`.

### Idioma de salida

Los trabajos de Cron no deducen el idioma de respuesta a partir del canal, la configuración regional ni los mensajes anteriores. Incluya la regla de idioma en el mensaje o la plantilla programados:

```bash
openclaw cron edit <jobId> \
  --message "Resume las actualizaciones. Responde en chino; mantén sin cambios las URL, el código y los nombres de productos."
```

Para los archivos de plantilla, mantenga la instrucción de idioma en el prompt renderizado y compruebe que los marcadores de posición como `{{language}}` estén rellenados antes de que se ejecute el trabajo. Si la salida mezcla idiomas, formule la regla de manera explícita, por ejemplo: "Usa chino para el texto narrativo y mantén los términos técnicos en inglés."

## Ejemplos de la CLI

<Tabs>
  <Tab title="Recordatorio de una sola ejecución">
    ```bash
    openclaw cron add \
      --name "Comprobación del calendario" \
      --at "20m" \
      --session main \
      --system-event "Próximo heartbeat: comprobar el calendario." \
      --wake now
    ```
  </Tab>
  <Tab title="Trabajo aislado recurrente">
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
  <Tab title="Sustitución del modelo y el razonamiento">
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

## Gestión de trabajos

```bash
# Enumerar todos los trabajos
openclaw cron list

# Obtener un trabajo almacenado como JSON
openclaw cron get <jobId>

# Mostrar un trabajo, incluida la ruta de entrega resuelta
openclaw cron show <jobId>

# Activar/desactivar sin eliminar
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Editar un trabajo
openclaw cron edit <jobId> --message "Prompt actualizado" --model "opus"

# Forzar la ejecución inmediata de un trabajo
openclaw cron run <jobId>

# Forzar la ejecución inmediata de un trabajo y esperar su estado final
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Ejecutar solo si corresponde
openclaw cron run <jobId> --due

# Ver el historial de ejecuciones
openclaw cron runs --id <jobId> --limit 50

# Ver una ejecución exacta
openclaw cron runs --id <jobId> --run-id <runId>

# Eliminar un trabajo
openclaw cron remove <jobId>

# Selección de agente (configuraciones multiagente)
openclaw cron create "0 6 * * *" "Comprobar la cola de operaciones" --name "Revisión de operaciones" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

Archivar una sesión (desde la interfaz de control o mediante `sessions.patch { archived: true }` desde un invocador administrador-operador) desactiva todos los trabajos de Cron habilitados vinculados a esa sesión: su sesión aislada `cron:<jobId>`, un destino `session:<key>` o un carril de entrega/activación `sessionKey`. Restaurar la sesión no vuelve a activar esos trabajos; use `openclaw cron enable <jobId>`. Las sesiones que tienen un trabajo vinculado habilitado muestran una insignia de reloj en la barra lateral de la interfaz de control.

`openclaw cron run <jobId>` regresa después de poner en cola la ejecución manual. Use `--wait` para enlaces de apagado, scripts de mantenimiento u otras automatizaciones que deban bloquearse hasta que finalice la ejecución en cola; consulta periódicamente el `runId` devuelto (tiempo de espera predeterminado `10m`, intervalo de consulta `2s`) y termina con `0` para el estado `ok`, y con un valor distinto de cero para `error`, `skipped` o un tiempo de espera agotado.

La herramienta `cron` del agente devuelve resúmenes compactos de trabajos (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) desde `cron(action: "list")`; use `cron(action: "get", jobId: "...")` para obtener la definición completa de un trabajo. Los invocadores directos del Gateway pueden pasar `compact: true` a `cron.list`; omitirlo conserva la respuesta completa con vistas previas de entrega.

`openclaw cron create` es un alias de `openclaw cron add`. Los trabajos nuevos pueden usar una programación posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` o una marca de tiempo ISO) seguida de un prompt posicional del agente. Use `--webhook <url>` en `cron add|create` o `cron edit` para enviar mediante POST la carga útil de la ejecución finalizada a un punto de conexión HTTP; la entrega por Webhook no puede combinarse con los indicadores de entrega por chat (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`). En `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account`, quite esos campos de enrutamiento de forma individual (cada uno se rechaza junto con su indicador correspondiente de establecimiento), a diferencia de `--no-deliver`, que solo desactiva la entrega alternativa del ejecutor.

<Note>
Nota sobre la sustitución del modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido o no puede resolverse, Cron marca la ejecución como fallida con un error de validación explícito.
- Los parches de carga útil `cron.update` de la API pueden establecer `model: null` para borrar una sustitución almacenada del modelo del trabajo.
- `openclaw cron edit <job-id> --clear-model` borra esa sustitución desde la CLI (el mismo efecto que el parche `model: null`) y no puede combinarse con `--model`.
- Las cadenas de alternativas configuradas siguen aplicándose porque el `--model` de Cron es el modelo principal del trabajo, no una sustitución `/model` de la sesión.
- `openclaw cron add|edit --fallbacks ...` establece la carga útil `fallbacks`, sustituyendo las alternativas configuradas para ese trabajo; `--fallbacks ""` desactiva las alternativas y hace que la ejecución sea estricta. `openclaw cron edit <job-id> --clear-fallbacks` borra la sustitución por trabajo.
- Un `--model` simple sin una lista de alternativas explícita ni configurada no recurre al modelo principal del agente como destino adicional silencioso para reintentos.

</Note>

## Webhooks

El Gateway puede exponer puntos de conexión HTTP de Webhook para activadores externos. Habilítelos en la configuración:

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

Los tokens de la cadena de consulta se rechazan.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ponga en cola un evento del sistema para la sesión principal:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"Nuevo correo recibido","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Descripción del evento.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` o `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Ejecute un turno aislado del agente:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Resume la bandeja de entrada","name":"Correo electrónico","model":"openai/gpt-5.6-sol"}'
    ```

    Campos: `message` (obligatorio), `name`, `agentId`, `sessionKey` (requiere `hooks.allowRequestSessionKey=true`), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Enlaces asignados (POST /hooks/<name>)">
    Los nombres de enlaces personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas útiles arbitrarias en acciones `wake` o `agent` mediante plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantenga los puntos de conexión de los enlaces detrás de la interfaz de bucle invertido, una tailnet o un proxy inverso de confianza.

- Use un token exclusivo para los enlaces; no reutilice los tokens de autenticación del Gateway.
- Mantenga `hooks.path` en una subruta exclusiva; `/` se rechaza.
- Establezca `hooks.allowedAgentIds` para limitar el agente efectivo al que puede dirigirse un enlace, incluido el agente predeterminado cuando se omite `agentId`.
- Mantenga `hooks.allowRequestSessionKey=false` salvo que necesite sesiones seleccionadas por el invocador.
- Si habilita `hooks.allowRequestSessionKey`, establezca también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de las claves de sesión.
- De forma predeterminada, las cargas útiles de los enlaces se encapsulan con límites de seguridad.

</Warning>

## Integración con Gmail PubSub

Conecte los activadores de la bandeja de entrada de Gmail con OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI `gcloud`, `gog` (gogcli), enlaces de OpenClaw habilitados y Tailscale para el punto de conexión HTTPS público.
</Note>

### Configuración mediante el asistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el ajuste predefinido de Gmail y usa de forma predeterminada Tailscale Funnel para el punto de conexión push (`--tailscale funnel|serve|off`).

<Warning>
La sesión por mensaje del ajuste predefinido de Gmail separa el contexto de conversación; no restringe las herramientas ni el espacio de trabajo del agente de destino. Sin una asignación personalizada que establezca `agentId`, los enlaces de Gmail se ejecutan como el agente predeterminado.

Para bandejas de entrada que no sean de confianza, dirija el enlace a un agente lector exclusivo, conceda a ese agente acceso de solo lectura o ningún acceso al espacio de trabajo y deniegue la escritura en el sistema de archivos, el shell, el navegador y otras herramientas innecesarias. Si necesita notificar al agente principal, permita únicamente la transferencia necesaria entre agentes. Consulte [Inyección de prompts](/es/gateway/security#prompt-injection), [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) y [`tools.agentToAgent`](/es/gateway/config-tools#toolsagenttoagent).
</Warning>

### Inicio automático del Gateway

Cuando se establecen `hooks.enabled=true` y `hooks.gmail.account`, el Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la supervisión. Establezca `OPENCLAW_SKIP_GMAIL_WATCHER=1` para deshabilitarlo.

### Configuración manual única

<Steps>
  <Step title="Seleccionar el proyecto de GCP">
    Seleccione el proyecto de GCP propietario del cliente OAuth que utiliza `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Crear el tema y conceder acceso push de Gmail">
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

### Sustitución del modelo de Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

Para bandejas de entrada no confiables, use el modelo de última generación y del mejor nivel disponible de su proveedor. El valor anterior es un ejemplo; el modelo debe existir en el catálogo y la lista de permitidos configurados.

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
  },
}
```

Los valores `retry` anteriores son los predeterminados: hasta 3 reintentos con espera progresiva `30s/60s/5m`, reintentando las cinco categorías transitorias. `webhookToken` se envía como `Authorization: Bearer <token>` en las solicitudes POST del Webhook de Cron.

`maxConcurrentRuns` limita tanto el envío programado de Cron como la ejecución aislada de turnos del agente, y su valor predeterminado es 8. Los turnos aislados del agente de Cron usan internamente el carril de ejecución `cron-nested` dedicado de la cola, por lo que aumentar este valor permite que ejecuciones independientes del LLM de Cron avancen en paralelo, en lugar de limitarse a iniciar sus contenedores externos de Cron. Este ajuste no amplía el carril compartido `nested` ajeno a Cron.

`cron.store` es una clave lógica del almacén y una ruta de migración de doctor, no un archivo JSON activo que deba editarse manualmente. Los datos de los trabajos residen en SQLite; use la CLI o la API del Gateway para realizar cambios.

Desactivar Cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamiento de los reintentos">
    **Reintento de ejecución única**: los errores transitorios (límite de frecuencia, sobrecarga, red, tiempo de espera agotado y error del servidor) se reintentan hasta `retry.maxAttempts` veces (valor predeterminado: 3) mediante `retry.backoffMs` (valores predeterminados: 30s, 60s y 5m). Los errores permanentes desactivan el trabajo inmediatamente.

    **Reintento recurrente**: los errores de ejecución consecutivos aplican una espera progresiva con una programación ampliada (30s, 60s, 5m, 15m, 60m). La espera progresiva se restablece después de la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Mantenimiento">
    `cron.sessionRetention` (valor predeterminado: `24h`; `false` lo desactiva) elimina las entradas de sesiones de ejecución aisladas. El historial de ejecuciones conserva las 2000 filas terminales más recientes por trabajo; las filas perdidas mantienen su periodo de limpieza de 24 horas.
  </Accordion>
  <Accordion title="Migración del almacén heredado">
    Al actualizar, ejecute `openclaw doctor --fix` para importar los archivos heredados `~/.openclaw/cron/jobs.json`, `jobs-state.json` y `runs/*.jsonl` en SQLite y cambiarles el nombre con el sufijo `.migrated`. Las filas de trabajos con formato incorrecto se omiten durante la ejecución y se copian en `jobs-quarantine.json` para repararlas o revisarlas posteriormente.
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
  <Accordion title="Cron no se activa">
    - Compruebe `cron.enabled` y la variable de entorno `OPENCLAW_SKIP_CRON`.
    - Confirme que el Gateway se ejecute continuamente.
    - Para las programaciones `cron`, verifique la zona horaria (`--tz`) frente a la zona horaria del host.
    - `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y el trabajo aún no debía ejecutarse.

  </Accordion>
  <Accordion title="Cron se activó, pero no hubo entrega">
    - El modo de entrega `none` significa que no se espera ningún envío alternativo del ejecutor. El agente puede seguir enviando directamente con la herramienta `message` cuando haya disponible una ruta de chat.
    - Si falta el destino de entrega o no es válido (`channel`/`to`), se omite el envío saliente.
    - En Matrix, los trabajos copiados o heredados con identificadores de sala `delivery.to` en minúsculas pueden fallar porque los identificadores de sala de Matrix distinguen entre mayúsculas y minúsculas. Edite el trabajo para usar el valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que las credenciales bloquearon la entrega.
    - Si la ejecución aislada devuelve únicamente el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y la ruta alternativa del resumen en cola, por lo que no se publica nada en el chat.
    - Si el agente debe enviar un mensaje al usuario por sí mismo, compruebe que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat anterior, o un canal/destino explícito).

  </Accordion>
  <Accordion title="Cron o Heartbeat parece impedir la renovación de estilo /new">
    - La vigencia del restablecimiento diario y por inactividad no se basa en `updatedAt`; consulte [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Las activaciones de Cron, las ejecuciones de Heartbeat, las notificaciones de ejecución y las tareas de mantenimiento del Gateway pueden actualizar la fila de la sesión para el enrutamiento o el estado, pero no amplían `sessionStartedAt` ni `lastInteractionAt`.
    - Para las filas heredadas creadas antes de que existieran esos campos, OpenClaw puede recuperar `sessionStartedAt` del encabezado de sesión de la transcripción JSONL cuando el archivo aún está disponible. Las filas heredadas inactivas sin `lastInteractionAt` usan esa hora de inicio recuperada como referencia de inactividad.

  </Accordion>
  <Accordion title="Aspectos problemáticos de las zonas horarias">
    - Cron sin `--tz` usa la zona horaria del host del Gateway.
    - Las programaciones `at` sin zona horaria se tratan como UTC.
    - El `activeHours` de Heartbeat usa la resolución de zona horaria configurada.

  </Accordion>
</AccordionGroup>

## Temas relacionados

- [Automatización](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para ejecuciones de Cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de la zona horaria
