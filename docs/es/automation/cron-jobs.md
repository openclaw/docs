---
read_when:
    - Programación de trabajos en segundo plano o activaciones
    - Conexión de activadores externos (webhooks, Gmail) con OpenClaw
    - Elegir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Trabajos programados, webhooks y activadores de PubSub de Gmail para el planificador del Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-07-22T10:25:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c7556be1cd253fefc1844cb76fcef292dc5d8e9d082e8bda1fcc004ecfa0b49
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el planificador integrado del Gateway. Conserva los trabajos, activa el agente en el momento adecuado y puede enviar la salida a un canal de chat, un Webhook o a ningún destino.

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
- Las definiciones de los trabajos, el estado de ejecución y el historial de ejecuciones se conservan en la base de datos de estado SQLite compartida de OpenClaw, por lo que los reinicios no pierden las programaciones.
- Cada ejecución de Cron crea un registro de [tarea en segundo plano](/es/automation/tasks).
- Los trabajos de una sola ejecución (`--at`) se eliminan automáticamente después de completarse correctamente de forma predeterminada; pase `--keep-after-run` para conservarlos.
- Presupuesto de tiempo de reloj por ejecución: `--timeout-seconds` cuando se establece. De lo contrario, los trabajos de turno del agente aislados o desacoplados están limitados por el supervisor de 60 minutos propio de Cron antes de que pueda aplicarse el tiempo de espera del turno del agente subyacente (`agents.defaults.timeoutSeconds`, 48 horas de forma predeterminada); los trabajos de comandos tienen un valor predeterminado de 10 minutos y las cargas útiles de scripts, de 5 minutos.
- Al iniciar el Gateway, los trabajos de turno del agente aislados que estén vencidos se reprograman en lugar de reproducirse de inmediato, lo que mantiene el trabajo de arranque del modelo y las herramientas fuera del intervalo de conexión del canal.
- Si ejecuta `openclaw agent` mediante el Cron del sistema u otro planificador externo, envuélvalo con un mecanismo de terminación forzada escalonada, aunque la CLI ya gestione `SIGTERM`/`SIGINT`. Las ejecuciones respaldadas por el Gateway solicitan al Gateway que cancele las ejecuciones aceptadas; las ejecuciones `--local` reciben la misma señal de cancelación. Para `timeout` de GNU, prefiera `timeout -k 60 600 openclaw agent ...` en lugar de `timeout 600 ...` sin opciones: el valor `-k` actúa como último recurso si el proceso no puede finalizar a tiempo. Para unidades de systemd, utilice una señal de detención `SIGTERM` con un período de gracia (`TimeoutStopSec`) antes de la terminación definitiva. Si se reutiliza un `--run-id` mientras la ejecución original del Gateway sigue activa, el duplicado se notifica como en curso en lugar de iniciar una segunda ejecución.

<AccordionGroup>
  <Accordion title="Refuerzo de ejecuciones aisladas">
    - Al finalizar, las ejecuciones aisladas intentan cerrar las pestañas y los procesos del navegador registrados para su sesión `cron:<jobId>`, y descartan todas las instancias agrupadas del entorno de ejecución de MCP creadas para el trabajo mediante la misma ruta de desmontaje compartida que utilizan las ejecuciones de la sesión principal y las sesiones personalizadas. Los fallos de limpieza se ignoran para que prevalezca el resultado de Cron.
    - Las ejecuciones aisladas con la concesión limitada de autolimpieza de Cron pueden leer el estado del planificador, una lista filtrada que contiene únicamente su propio trabajo y el historial de ejecuciones de ese trabajo, y solo pueden eliminar su propio trabajo.
    - Las ejecuciones aisladas se protegen frente a respuestas de confirmación obsoletas: si el primer resultado es solo una actualización de estado provisional (`on it`, `pulling everything together` e indicaciones similares) y ningún subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de entregarlo.
    - Se reconocen los metadatos estructurados de denegación de ejecución (incluidos los envoltorios `UNAVAILABLE` del host Node cuyo error anidado comienza por `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`) para que un comando bloqueado no se notifique como una ejecución correcta, mientras que el texto normal del asistente no se confunde con una denegación.
    - Los fallos del agente a nivel de ejecución cuentan como errores del trabajo incluso cuando no hay una carga útil de respuesta, por lo que los fallos del modelo o proveedor incrementan los contadores de errores y activan las notificaciones de fallos, en lugar de marcar el trabajo como completado correctamente.
    - Cuando un trabajo alcanza `timeoutSeconds`, Cron cancela la ejecución y le concede un breve período de limpieza. Si no finaliza, la limpieza controlada por el Gateway libera de forma forzada la propiedad de la sesión de esa ejecución antes de que Cron registre el tiempo de espera agotado, de modo que el trabajo de chat en cola no quede bloqueado tras una sesión de procesamiento obsoleta.
    - Los bloqueos durante la configuración o el inicio tienen un tiempo de espera específico de la fase (por ejemplo, `cron: isolated agent setup timed out before runner start` o `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Estos supervisores abarcan los proveedores integrados y los respaldados por la CLI incluso antes de que se inicie su proceso externo de CLI, y tienen un límite independiente de los valores prolongados de `timeoutSeconds`, de modo que los fallos de inicio en frío, autenticación o contexto aparezcan rápidamente.

  </Accordion>
  <Accordion title="Conciliación de tareas">
    La conciliación de tareas de Cron está controlada en primer lugar por el entorno de ejecución y, en segundo lugar, respaldada por el historial persistente: una tarea de Cron activa permanece en ejecución mientras el entorno de ejecución de Cron siga registrando ese trabajo como activo, aunque todavía exista una fila antigua de sesión secundaria. Cuando el entorno de ejecución deja de ser propietario del trabajo y vence un período de gracia de 5 minutos, las comprobaciones de mantenimiento consultan los registros de ejecución persistentes y el estado del trabajo para la ejecución `cron:<jobId>:<startedAt>` correspondiente. Un resultado final en esos datos completa el registro de tareas; de lo contrario, el mantenimiento controlado por el Gateway puede marcar la tarea como `lost`. La auditoría sin conexión de la CLI puede recuperar información del historial persistente, pero su propio conjunto vacío de trabajos activos dentro del proceso no demuestra que haya desaparecido una ejecución controlada por el Gateway.
  </Accordion>
</AccordionGroup>

## Tipos de programación

| Tipo      | Opción de CLI           | Descripción                                                                                              |
| --------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`             | Marca de tiempo de una sola ejecución (ISO 8601 o relativa, como `20m`)                                                     |
| `every`   | `--every`          | Intervalo fijo (`10m`, `1h`, `1d`)                                                                       |
| `cron`    | `--cron`           | Expresión de Cron de 5 o 6 campos con `--tz` opcional                                                  |
| `on-exit` | `--on-exit`        | Se activa una vez cuando finaliza un comando supervisado (desencadenador de eventos; sobrevive al desmontaje del turno; `--on-exit-cwd` opcional) |
| `stream`  | `--stream-command` | Se activa a partir de líneas agrupadas generadas por un comando supervisado de larga duración                                      |

Las marcas de tiempo sin zona horaria se tratan como UTC. Añada `--tz America/New_York` para interpretar una fecha y hora `--at` sin desplazamiento, o para evaluar una expresión de Cron, en esa zona horaria de IANA. Las expresiones de Cron sin `--tz` utilizan la zona horaria del host del Gateway. `--tz` no es válido con `--every` ni `--on-exit`.

Las expresiones recurrentes al comienzo de la hora (minuto `0` con un campo de hora comodín) se escalonan automáticamente hasta 5 minutos para reducir los picos de carga. Utilice `--exact` para forzar una temporización precisa o `--stagger 30s` para definir un intervalo explícito (solo para programaciones de Cron).

### Fuentes de flujo

Una programación de flujo mantiene en ejecución bajo el Gateway un comando argv creado por el operador y activa el trabajo a partir de las líneas de stdout y stderr. Las programaciones de flujo se basan en eventos, nunca en vencimientos temporales, y requieren `cron.triggers.enabled: true` porque el comando de larga duración tiene la misma clase de confianza sin supervisión que los scripts de activación. Deshabilitar o eliminar el trabajo detiene el proceso; el apagado del Gateway espera a que finalice todo el árbol de procesos. Los fallos rápidos provocan reinicios con el retroceso de errores integrado de Cron. Cinco ejecuciones consecutivas de menos de 60 segundos dejan el trabajo en estado de error y utilizan la ruta normal de alertas de fallo; vuelva a habilitar manualmente el trabajo para borrar el límite de reinicios.

```bash
openclaw cron add \
  --name "Build event stream" \
  --stream-command '["node","scripts/build-events.mjs"]' \
  --stream-mode match \
  --stream-match '^(failed|recovered):' \
  --stream-batch-ms 250 \
  --session isolated \
  --message "Investigate these build events."
```

`mode: "line"` (el valor predeterminado) acepta todas las líneas. `mode: "match"` acepta únicamente las líneas que coinciden con la expresión regular `match` compilada. Un lote se cierra después de `batchMs` de inactividad (250 ms de forma predeterminada, limitado a 50–5000) o al alcanzar `maxBatchBytes` (16384 de forma predeterminada, limitado a 1024–65536). Al alcanzar el límite de bytes, el lote termina con `[truncated]`. El modo de coincidencia siempre evalúa líneas completas comparándolas con su texto íntegro, incluso más allá de `maxBatchBytes` (solo se trunca el lote entregado); una línea cortada en el límite restringido de entrada sin procesar es solo un prefijo, por lo que se trata como no coincidente en lugar de permitir que un patrón anclado al final se active sobre el fragmento. El lote se añade al texto del evento del sistema o al mensaje del turno del agente. Las cargas útiles de comando se rechazan para las programaciones de flujo porque el comando de origen y el comando de la carga útil tendrían una propiedad del proceso ambigua.

Solo se conservan una activación de carga útil y un lote pendiente de tamaño limitado por trabajo. Las líneas que llegan mientras se ejecuta una carga útil, o antes de que haya transcurrido el intervalo de activación integrado de 30 segundos, se agrupan en ese lote pendiente en lugar de crear una cola sin límites. Un único propietario serializado registra los descartes de la compuerta, los errores de la carga útil y los envíos sin ejecución en `streamDroppedBatches`; las fusiones limitadas incrementan `streamCoalescedBatches`. Las cargas útiles fallidas no se reintentan porque podrían no ser idempotentes. Una identidad lógica de origen permanece estable durante los reinicios supervisados de procesos secundarios, pero cambia cuando el origen se deshabilita, elimina o sustituye, de modo que los lotes en cola del origen retirado no pueden activarse ni siquiera después de una edición de A a B y de nuevo a A. Una vez completada una detención, las devoluciones de llamada tardías de un proceso secundario antiguo quedan inertes. V1 no incluye un origen WebSocket nativo; conéctelo mediante un comando argv como `websocat wss://example.invalid/events`.

Cuando un trabajo de flujo también tiene `trigger.script`, la compuerta se ejecuta una vez por cada lote cerrado. El lote actual está disponible como la cadena `trigger.streamBatch`, profundamente congelada, junto con `trigger.state`. `fire: false` descarta ese lote después de conservar el estado de la compuerta. `fire: true` mantiene la semántica existente del mensaje de activación y después añade el lote a la carga útil resultante. Como alternativa, un trabajo de flujo puede usar una carga útil de script sin una compuerta de condición; ese script recibe el lote mediante el mismo valor `trigger.streamBatch`. Se rechaza la combinación de una carga útil de script con una compuerta de condición porque ambas serían propietarias de la ranura persistente `trigger.state`.

### Cadencia dinámica (ritmo)

Los trabajos recurrentes pueden establecer `pacing.min` o `pacing.max`, o ambos, como cadenas de duración, por ejemplo `15m` o `4h`; se requiere al menos un límite. Use `--pacing-min` y `--pacing-max` con `cron add|edit` (`--clear-pacing` elimina ambos límites).

Durante una ejecución aislada, un trabajo con ritmo puede llamar a la herramienta `cron` con `action: "next_check"` y `in: "30m"`. La propuesta se aplica únicamente a ese trabajo que se está ejecutando en ese momento y se mide desde la finalización correcta de la ejecución. OpenClaw la ajusta silenciosamente a los límites configurados.

Si hay ritmo pero no hay una propuesta, la programación normal permanece sin cambios. Las ejecuciones fallidas, agotadas por tiempo de espera y omitidas descartan la propuesta, por lo que prevalecen el comportamiento existente de reintentos y el retroceso de errores. Forzar manualmente un trabajo recurrente ocurre fuera de banda y conserva su intervalo natural o con ritmo pendiente. Para los trabajos activados por condiciones, el intervalo mínimo integrado sigue siendo un límite inferior incluso cuando una propuesta solicita una comprobación anterior.

### El día del mes y el día de la semana usan lógica OR

Las expresiones de Cron se analizan mediante [croner](https://github.com/Hexagon/croner). Cuando tanto el campo del día del mes como el del día de la semana no contienen comodines, croner considera que hay una coincidencia cuando coincide **cualquiera** de los campos, no ambos. Este es el comportamiento estándar de Cron de Vixie.

```bash
# Previsto: "9 AM on the 15th, only if it's a Monday"
# Real:     "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se activa aproximadamente 5-6 veces al mes en lugar de 0-1 veces al mes. Para exigir ambas condiciones, use el modificador de día de la semana de croner `+` (`0 9 15 * +1`), o programe según un campo y compruebe el otro en el prompt o comando del trabajo.

## Desencadenadores de eventos (supervisores de condiciones)

Un desencadenador de eventos añade un script de condición sin interfaz a una programación `every`, `cron` o `stream`. Las programaciones temporales lo evalúan cuando corresponde; las programaciones de flujo lo evalúan para cada lote cerrado. Cron ejecuta la carga útil normal solo cuando el script devuelve `fire: true`:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Se activa solo cuando el estado observado difiere de la última evaluación.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Investigue el cambio de estado de la CI." },
}
```

El script debe devolver `{ fire, message?, state? }`. El estado JSON anterior está disponible como `trigger.state`, profundamente congelado; las puertas de flujo también reciben el lote actual como `trigger.streamBatch`. Devuelva un nuevo valor `state` para conservarlo. El estado está limitado a 16 KB. Cuando un resultado que activa la ejecución incluye `message`, cron lo añade al texto del evento del sistema o al mensaje del turno del agente antes de la ejecución. `once: true` deshabilita el trabajo después de su primera carga útil activada correctamente.

`fire: false` conserva el estado y los contadores de evaluación y, a continuación, vuelve a programar sin crear un historial de ejecuciones. Si una ejecución de carga útil activada falla, el valor `state` devuelto **no** se conserva: la siguiente evaluación ve el estado anterior y puede volver a activarse; por ello, escriba los scripts como comprobaciones de solo lectura y mantenga las acciones en la carga útil. Las programaciones con desencadenador tienen un intervalo mínimo integrado de 30 segundos. Cada evaluación dispone de un límite de tiempo de reloj de 30 segundos y hasta 5 llamadas a herramientas.

Diseñe los supervisores en torno a un **estado procesable**, no solo al éxito: un supervisor que deja de informar cuando su comprobación falla o agota el tiempo parece funcionar correctamente aunque esté averiado. Compare la observación con `trigger.state` y devuelva un estado nuevo para eliminar duplicados; no dependa de la memoria del modelo ni del proceso. Al activar la ejecución, haga que `message` sea autocontenido, porque se convierte en el contexto completo del evento de la ejecución activada.

<Warning>
Habilitar `cron.triggers.enabled` permite que tanto los scripts de desencadenadores de condiciones como las cargas útiles `script` se ejecuten sin interfaz con la **política de herramientas completa del agente propietario, incluido `exec`**. Trátelo como una ejecución de código desatendida con los permisos de ese agente; déjelo deshabilitado salvo que todos los agentes autorizados para crear trabajos de cron sean de confianza para ello.
</Warning>

Cree un supervisor a partir de un archivo de script local (`-` lee el script desde la entrada estándar):

```bash
openclaw cron add \
  --name "PR CI watcher" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Respond to the CI status change" \
  --session isolated
```

## Cargas útiles

Cada trabajo contiene exactamente un tipo de carga útil, elegido mediante una opción:

| Carga útil       | Opción                                           | Ejecución                                                       |
| ------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| Evento del sistema  | `--system-event <text>`                        | Se pone en cola en la sesión principal, sin llamada al modelo por sí mismo    |
| Mensaje del agente | `--message <text>`                             | Un turno del agente respaldado por un modelo                                  |
| Comando       | `--command <shell>` o `--command-argv <json>` | Un shell/proceso en el host del Gateway, sin llamada al modelo         |
| Script        | `--script <file\|->`                           | Un script sin interfaz en modo código que usa las herramientas del agente propietario |

### Opciones del turno del agente

<ParamField path="--message" type="string" required>
  Texto del prompt (obligatorio para trabajos de sesión aislada, actual o personalizada).
</ParamField>
<ParamField path="--model" type="string">
  Sustitución del modelo; debe resolverse como un modelo permitido o la ejecución falla con un error de validación.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos alternativos por trabajo, por ejemplo, `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Pase `--fallbacks ""` para una ejecución estricta sin modelos alternativos.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  En `cron edit`, elimina la sustitución de modelos alternativos por trabajo para que el trabajo siga la precedencia de alternativas configurada. No puede combinarse con `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  En `cron edit`, elimina la sustitución del modelo por trabajo para que el trabajo siga la precedencia normal de modelos de cron (la sustitución almacenada de la sesión de cron o, en su defecto, el modelo predeterminado o del agente). No puede combinarse con `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Sustitución del nivel de razonamiento (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Los niveles disponibles siguen dependiendo del modelo y del entorno de ejecución del agente seleccionados.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  En `cron edit`, elimina la sustitución del nivel de razonamiento por trabajo. No puede combinarse con `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omite la inyección de archivos de inicialización del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe las herramientas que puede usar el trabajo, por ejemplo, `--tools exec,read`.
</ParamField>

Los trabajos nuevos que pueden ejecutar herramientas siempre almacenan una política de herramientas explícita. Los trabajos creados por un agente
se limitan a las herramientas disponibles para el turno que los crea, y el agente no puede ampliar la
lista almacenada. Los trabajos creados por un operador autenticado sin `--tools` almacenan una
política `*` sin restricciones; `cron edit --clear-tools` restaura esa política explícita sin
restricciones. Los trabajos existentes anteriores a una política de herramientas explícita conservan su comportamiento actual
hasta que se edite explícitamente su política de herramientas o se vuelva a crear el trabajo.

`--model` establece el modelo principal del trabajo; no sustituye una anulación `/model` de sesión, por lo que las cadenas de modelos alternativos configuradas siguen aplicándose sobre él. Un modelo que no pueda resolverse o no esté permitido hace que la ejecución falle con un error de validación explícito, en lugar de recurrir silenciosamente al modelo predeterminado. Si un trabajo tiene `--model` pero ninguna lista de modelos alternativos explícita ni configurada, OpenClaw pasa una anulación de alternativas vacía en lugar de añadir silenciosamente el modelo principal del agente como destino oculto de reintento.

Precedencia de selección de modelos para trabajos aislados, de mayor a menor:

1. Carga útil por trabajo `model` (configuración explícita; un modelo no permitido hace que la ejecución falle)
2. Sustitución del modelo del hook de Gmail (solo cuando la ejecución procede de Gmail y esa sustitución está permitida)
3. Sustitución del modelo almacenada de la sesión de cron seleccionada por el usuario
4. Selección del modelo predeterminado o del agente

El modo rápido sigue la selección activa resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, el cron aislado lo usa de forma predeterminada; una sustitución almacenada de sesión `fastMode` (y después una sustitución del agente `fastModeDefault`) sigue prevaleciendo sobre la configuración del modelo en cualquier dirección. El modo automático usa el umbral `params.fastAutoOnSeconds` del modelo, cuyo valor predeterminado es 60 segundos.

Si una ejecución encuentra una transferencia activa por cambio de modelo, cron vuelve a intentarlo con el proveedor/modelo cambiado y conserva esa selección (y cualquier perfil de autenticación nuevo) para la ejecución activa. Los reintentos están limitados: tras el intento inicial y 2 reintentos de cambio, cron aborta en lugar de entrar en un bucle.

Antes de iniciar una ejecución aislada, OpenClaw comprueba los endpoints locales accesibles de los proveedores `api: "ollama"` y `api: "openai-completions"` configurados cuyo `baseUrl` sea de bucle invertido, de red privada o `.local`. Esta comprobación previa recorre la cadena de modelos alternativos configurada del trabajo y solo marca la ejecución como `skipped` cuando todos los candidatos están inaccesibles; `--fallbacks ""` mantiene el recorrido estrictamente limitado al modelo principal. Un endpoint inactivo registra la ejecución como `skipped` con un error claro, en lugar de iniciar una llamada al modelo. El resultado se almacena en caché durante 5 minutos por endpoint (no por trabajo ni modelo), de modo que muchos trabajos pendientes que compartan un servidor local Ollama/vLLM/SGLang/LM Studio inactivo solo generen una comprobación en lugar de una avalancha de solicitudes. Las ejecuciones omitidas durante la comprobación previa no incrementan el retroceso por errores de ejecución; establezca `failureAlert.includeSkipped` para habilitar alertas repetidas de omisión.

### Cargas útiles de comando

Las cargas útiles de comando ejecutan scripts deterministas dentro del programador del Gateway sin iniciar un turno respaldado por un modelo. Se ejecutan en el host del Gateway, capturan stdout/stderr, registran la ejecución en el historial de cron y reutilizan los mismos modos de entrega `announce`, `webhook` y `none` que los trabajos de turno del agente.

<Note>
El cron de comandos es una superficie de automatización del Gateway para administradores operadores, no una llamada `tools.exec` del agente. Crear, actualizar, eliminar o ejecutar manualmente trabajos de cron requiere `operator.admin`; posteriormente, las ejecuciones programadas de comandos se ejecutan dentro del proceso del Gateway como esa automatización creada por el administrador. La política de ejecución del agente (`tools.exec.mode`, prompts de aprobación y listas de herramientas permitidas por agente) controla las herramientas de ejecución visibles para el modelo, no las cargas útiles del cron de comandos.
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

`--command <shell>` almacena `argv: ["sh", "-lc", <shell>]`. Use `--command-argv '["node","scripts/report.mjs"]'` para ejecutar argv exactamente sin análisis del shell. Los parámetros opcionales `--command-env KEY=VALUE` (repetible), `--command-input`, `--timeout-seconds` (valor predeterminado: 10 minutos), `--no-output-timeout-seconds` y `--output-max-bytes` controlan el entorno del proceso, la entrada estándar y los límites de salida.

El texto entregado se deriva de la salida del proceso: prevalece stdout si no está vacío; si stdout está vacío y stderr no, se entrega stderr; si ambos contienen datos, cron envía un pequeño bloque `stdout:` / `stderr:`. El código de salida `0` registra la ejecución como `ok`; una salida distinta de cero, una señal, un tiempo de espera agotado o un tiempo de espera sin salida agotado registra `error` y puede activar alertas de fallo. Un comando que imprime únicamente `NO_REPLY` usa la supresión normal del token silencioso de cron y no publica nada en el chat.

### Cargas útiles de script

Las cargas útiles de script se ejecutan sin interfaz en el mismo ejecutor en modo código que los scripts de desencadenadores, sin iniciar un turno conversacional del agente. Habilite `cron.triggers.enabled` antes de crearlas o ejecutarlas; esta puerta de automatización peligrosa cubre tanto los scripts de desencadenadores como las cargas útiles de script. Los trabajos de script solo admiten los destinos de sesión `main` y `isolated`.

```bash
openclaw cron create "0 * * * *" \
  --name "Hourly queue check" \
  --script ./automation/check-queue.js \
  --script-timeout-seconds 300 \
  --script-tool-budget 50 \
  --session isolated \
  --announce
```

Use `--script <file|->` para leer JavaScript desde un archivo o desde la entrada estándar. El tiempo de espera predeterminado es de 300 segundos y está limitado a 900; el presupuesto de herramientas predeterminado es de 50 llamadas y está limitado a 200. Estos presupuestos de carga útil son independientes de los presupuestos menores de evaluación de la puerta del desencadenador.

El script puede devolver un objeto con estos campos opcionales:

- `notify`: Texto entregado mediante el modo de entrega `announce`, `webhook` o `none` del trabajo. Si se omite, no se entrega nada. Para un trabajo `main`, el texto se convierte en un evento del sistema.
- `wake`: `"now"` solicita un Heartbeat inmediato después de poner en cola `notify` (o un evento de finalización compacto); `"next-heartbeat"` pone en cola el evento para el siguiente Heartbeat.
- `state`: Estado JSON, limitado a 16 KB y conservado solo después de una ejecución correcta. La siguiente ejecución recibe una copia inmutable como `trigger.state`, de acuerdo con los scripts de activación. Como ese espacio de nombres tiene un único propietario persistente, no se puede combinar la carga útil de un script con un activador de condición en el mismo trabajo.
- `nextCheck`: Una duración como `"15m"`. Solo es válida para trabajos con ritmo habilitado y utiliza el mismo límite de ritmo que las propuestas de turnos del agente.

Las excepciones, los tiempos de espera agotados, los presupuestos de herramientas agotados, los resultados no válidos y `nextCheck` sin ritmo son errores normales de ejecución de Cron: se incorporan al historial de ejecuciones, al retroceso y a la gestión de alertas de fallos sin conservar el estado devuelto.

## Estilos de ejecución

| Estilo           | Valor de `--session`   | Se ejecuta en                  | Ideal para                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesión principal    | `main`              | Canal de activación dedicado de Cron | Recordatorios, eventos del sistema        |
| Aislado        | `isolated`          | `cron:<jobId>` dedicado | Informes, tareas rutinarias en segundo plano      |
| Sesión actual | `current`           | Vinculada en el momento de la creación   | Trabajo periódico que tiene en cuenta el contexto    |
| Sesión personalizada  | `session:custom-id` | Sesión persistente con nombre | Flujos de trabajo que se basan en el historial |

<AccordionGroup>
  <Accordion title="Sesión principal frente a aislada y personalizada">
    Los trabajos de **sesión principal** ponen en cola un evento del sistema en un canal de ejecución propiedad de Cron y, opcionalmente, activan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Pueden usar el último contexto de entrega de la sesión principal de destino para las respuestas, pero no añaden los turnos rutinarios de Cron al canal de chat humano ni prolongan la vigencia del restablecimiento diario o por inactividad de la sesión de destino. Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) conservan el contexto entre ejecuciones, lo que permite flujos de trabajo como reuniones diarias que se basan en resúmenes anteriores.

    Los eventos de Cron de la sesión principal son recordatorios autocontenidos de eventos del sistema. No incluyen automáticamente la instrucción «Read HEARTBEAT.md» del mensaje predeterminado de Heartbeat; indíquelo explícitamente en el texto del evento de Cron si un recordatorio debe consultar `HEARTBEAT.md`.

  </Accordion>
  <Accordion title="Qué significa «sesión nueva» para los trabajos aislados">
    Un nuevo identificador de transcripción/sesión por ejecución. OpenClaw conserva las preferencias seguras (ajustes de razonamiento/rapidez/nivel de detalle, etiquetas y anulaciones de modelo/autenticación seleccionadas explícitamente por el usuario), pero no hereda el contexto de conversación implícito de una fila de Cron anterior: enrutamiento de canal/grupo, política de envío o puesta en cola, elevación, origen ni vinculación del entorno de ejecución de ACP. Utilice `current` o `session:<id>` cuando un trabajo periódico deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Contrato de ejecución desatendida">
    Los turnos de agentes aislados de Cron y de enlaces están explícitamente desatendidos: no hay nadie presente para aclarar o aprobar. La respuesta final debe ser el entregable, no un plan, un acuse de recibo ni una solicitud de información. El agente devuelve `HEARTBEAT_OK` cuando no hay nada que hacer e indica claramente los fallos; Cron controla la política de reintentos y alertas de fallos.

    Para los trabajos programados de confianza, las propias instrucciones del trabajo prevalecen cuando solicitan intencionadamente una pregunta o un plan, y el agente puede eliminar un trabajo que ya no sea necesario. Los turnos de enlaces externos reciben únicamente el contrato común de ejecución desatendida; no reciben esa anulación ni las indicaciones de eliminación propia a través del límite de contenido externo.

  </Accordion>
  <Accordion title="Entrega de subagentes y Discord">
    Cuando las ejecuciones aisladas de Cron coordinan subagentes, la entrega prioriza la salida del último descendiente frente al texto provisional obsoleto del agente principal. Si los descendientes todavía están en ejecución, OpenClaw suprime esa actualización parcial del agente principal en lugar de anunciarla.

    Para los destinos de anuncio de Discord que solo admiten texto, OpenClaw envía una vez el texto final canónico del asistente en lugar de reproducir tanto el texto transmitido/intermedio como la respuesta final. Los contenidos multimedia y las cargas útiles estructuradas de Discord se siguen entregando por separado para no omitir archivos adjuntos ni componentes.

  </Accordion>
</AccordionGroup>

## Entrega y salida

| Modo       | Qué sucede                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Entrega como alternativa el texto final al destino si el agente no lo envió |
| `webhook`  | Envía mediante POST la carga útil del evento finalizado a una URL                                |
| `none`     | Sin entrega alternativa por parte del ejecutor                                         |

Utilice `--announce --channel telegram --to "-1001234567890"` para la entrega por canal. Para los temas de foros de Telegram, utilice `-1001234567890:topic:123`; OpenClaw también acepta la forma abreviada `-1001234567890:123`, propiedad de Telegram. Los llamadores directos de RPC/configuración pueden proporcionar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost utilizan prefijos explícitos (`channel:<id>`, `user:<id>`). Los identificadores de salas de Matrix distinguen entre mayúsculas y minúsculas; utilice el identificador exacto de la sala o la forma `room:!room:server` de Matrix.

Cuando la entrega de anuncios utiliza `channel: "last"` u omite `channel`, un destino con prefijo de proveedor como `telegram:123` puede seleccionar el canal antes de que Cron recurra al historial de la sesión o a un único canal configurado. Solo los prefijos anunciados por el Plugin cargado son selectores de proveedores. Si `delivery.channel` es explícito, el prefijo del destino debe indicar el mismo proveedor; se rechaza `channel: "whatsapp"` con `to: "telegram:123"` en lugar de permitir que WhatsApp interprete el identificador de Telegram como un número de teléfono. Los prefijos de tipo de destino y servicio (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) siguen siendo sintaxis de destino propiedad del canal, no selectores de proveedores.

Para los trabajos aislados, la entrega de chat es compartida: si hay una ruta de chat disponible, el agente puede utilizar la herramienta `message` incluso con `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el anuncio alternativo. De lo contrario, `announce`, `webhook` y `none` solo controlan lo que hace el ejecutor con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino de entrega activo conservado para la ruta de anuncio alternativa. Las claves internas de sesión pueden estar en minúsculas; los destinos de entrega del proveedor no se reconstruyen a partir de esas claves cuando está disponible el contexto del chat actual.

La entrega implícita de anuncios utiliza listas de canales permitidos configuradas para validar y redirigir destinos obsoletos. Las aprobaciones del almacén de emparejamiento de mensajes directos no son destinatarios de automatización alternativa; establezca `delivery.to` o configure la entrada `allowFrom` del canal cuando un trabajo programado deba realizar envíos proactivos a un mensaje directo.

### Notificaciones de fallos

Las notificaciones de fallos siguen una ruta de destino independiente:

- `cron.failureDestination` establece un valor predeterminado global para las notificaciones de fallos.
- `job.delivery.failureDestination` lo anula para cada trabajo.
- Si no se establece ninguno y el trabajo ya realiza entregas mediante `announce`, las notificaciones de fallos recurren a ese destino principal de anuncios.
- `delivery.failureDestination` solo se admite en trabajos `sessionTarget="isolated"`, salvo que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` permite que la política de alertas de un trabajo o la política global de alertas de Cron emita alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador consecutivo de omisiones independiente, por lo que no afectan al retroceso por errores de ejecución.
- `openclaw cron edit` expone ajustes de alertas por trabajo: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` y `--failure-alert-account-id`.

### Idioma de salida

Los trabajos de Cron no deducen el idioma de respuesta a partir del canal, la configuración regional ni los mensajes anteriores. Incluya la regla de idioma en el mensaje o la plantilla programados:

```bash
openclaw cron edit <jobId> \
  --message "Resume las actualizaciones. Responde en chino; mantén sin cambios las URL, el código y los nombres de productos."
```

Para los archivos de plantilla, mantenga la instrucción de idioma en el mensaje generado y compruebe que los marcadores de posición como `{{language}}` estén rellenados antes de ejecutar el trabajo. Si la salida mezcla idiomas, haga explícita la regla, por ejemplo: «Utiliza chino para el texto narrativo y mantén los términos técnicos en inglés».

## Ejemplos de la CLI

<Tabs>
  <Tab title="Recordatorio único">
    ```bash
    openclaw cron add \
      --name "Comprobación del calendario" \
      --at "20m" \
      --session main \
      --system-event "Siguiente Heartbeat: comprobar el calendario." \
      --wake now
    ```
  </Tab>
  <Tab title="Trabajo aislado periódico">
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
  <Tab title="Anulación del modelo y el razonamiento">
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
      "Resume como JSON los despliegues de hoy." \
      --name "Resumen de despliegues" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Salida de comandos">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Sondeo de profundidad de cola" \
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
# Enumerar los trabajos habilitados
openclaw cron list

# Incluir los trabajos deshabilitados
openclaw cron list --all

# Obtener un trabajo almacenado como JSON
openclaw cron get <jobId>

# Mostrar un trabajo, incluida la ruta de entrega resuelta
openclaw cron show <jobId>

# Habilitar/deshabilitar sin eliminar
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Editar un trabajo
openclaw cron edit <jobId> --message "Mensaje actualizado" --model "opus"

# Forzar la ejecución inmediata de un trabajo
openclaw cron run <jobId>

# Forzar la ejecución inmediata de un trabajo y esperar su estado terminal
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

Archivar una sesión (en la interfaz de control o mediante `sessions.patch { archived: true }` desde un llamador administrador-operador) deshabilita todos los trabajos de Cron habilitados vinculados a esa sesión: su sesión aislada `cron:<jobId>`, un destino `session:<key>` o un canal `sessionKey` de entrega/activación. Restaurar la sesión no vuelve a habilitar esos trabajos; utilice `openclaw cron enable <jobId>`. Las sesiones con un trabajo vinculado habilitado muestran una insignia de reloj en la barra lateral de la interfaz de control.

`openclaw cron run <jobId>` retorna después de poner en cola la ejecución manual. Use `--wait` para hooks de apagado, scripts de mantenimiento u otras automatizaciones que deban bloquearse hasta que finalice la ejecución en cola; sondea el `runId` devuelto (tiempo de espera predeterminado `10m`, intervalo de sondeo `2s`) y sale con `0` para el estado `ok`, y con un valor distinto de cero para `error`, `skipped` o un tiempo de espera agotado.

La herramienta `cron` del agente devuelve resúmenes compactos de trabajos (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) desde `cron(action: "list")`; use `cron(action: "get", jobId: "...")` para obtener la definición completa de un trabajo. Los clientes directos del Gateway pueden pasar `compact: true` a `cron.list`; omitirlo conserva la respuesta completa con vistas previas de entrega.

`openclaw cron create` es un alias de `openclaw cron add`. Los trabajos nuevos pueden usar una programación posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` o una marca de tiempo ISO) seguida de un prompt posicional para el agente. Use `--webhook <url>` en `cron add|create` o `cron edit` para enviar mediante POST la carga útil de la ejecución finalizada a un endpoint HTTP; la entrega por Webhook no puede combinarse con indicadores de entrega por chat (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`). En `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account`, quite esos campos de enrutamiento individualmente (cada uno se rechaza junto con su indicador de establecimiento correspondiente), a diferencia de `--no-deliver`, que solo desactiva la entrega alternativa del ejecutor.

<Note>
Nota sobre la sustitución del modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido o no puede resolverse, Cron marca la ejecución como fallida con un error de validación explícito.
- Los parches de cargas útiles `cron.update` de la API pueden establecer `model: null` para borrar la sustitución de modelo almacenada de un trabajo.
- `openclaw cron edit <job-id> --clear-model` borra esa sustitución desde la CLI (con el mismo efecto que el parche `model: null`) y no puede combinarse con `--model`.
- Las cadenas alternativas configuradas siguen aplicándose porque `--model` de Cron es el modelo principal de un trabajo, no una sustitución `/model` de una sesión.
- `openclaw cron add|edit --fallbacks ...` establece `fallbacks` en la carga útil y reemplaza las alternativas configuradas para ese trabajo; `--fallbacks ""` desactiva las alternativas y hace que la ejecución sea estricta. `openclaw cron edit <job-id> --clear-fallbacks` borra la sustitución específica del trabajo.
- Un `--model` simple sin una lista de alternativas explícita o configurada no recurre al modelo principal del agente como destino adicional silencioso para reintentos.

</Note>

## Webhooks

El Gateway puede exponer endpoints Webhook HTTP para activadores externos. Habilítelos en la configuración:

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
    Pone en cola un evento del sistema para la sesión principal:

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
    Ejecuta un turno aislado del agente:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Resume la bandeja de entrada","name":"Correo electrónico","model":"openai/gpt-5.6-sol"}'
    ```

    Campos: `message` (obligatorio), `name`, `agentId`, `sessionKey` (requiere `hooks.allowRequestSessionKey=true`), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hooks asignados (POST /hooks/<name>)">
    Los nombres de hooks personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas útiles arbitrarias en acciones `wake` o `agent` mediante plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantenga los endpoints de hooks detrás de la interfaz de bucle invertido, la tailnet o un proxy inverso de confianza.

- Use un token dedicado para hooks; no reutilice los tokens de autenticación del Gateway.
- Mantenga `hooks.path` en una subruta dedicada; `/` se rechaza.
- Establezca `hooks.allowedAgentIds` para limitar el agente efectivo al que puede dirigirse un hook, incluido el agente predeterminado cuando se omite `agentId`.
- Mantenga `hooks.allowRequestSessionKey=false` salvo que necesite sesiones seleccionadas por el cliente.
- Si habilita `hooks.allowRequestSessionKey`, establezca también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de las claves de sesión.
- Las cargas útiles de los hooks se encapsulan con límites de seguridad de forma predeterminada.

</Warning>

## Integración con Gmail PubSub

Conecte los activadores de la bandeja de entrada de Gmail con OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados y Tailscale para el endpoint HTTPS público.
</Note>

### Configuración mediante el asistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el ajuste preestablecido de Gmail y usa Tailscale Funnel de forma predeterminada para el endpoint de envío (`--tailscale funnel|serve|off`).

<Warning>
La sesión por mensaje del ajuste preestablecido de Gmail separa el contexto de conversación; no restringe las herramientas ni el espacio de trabajo del agente de destino. Sin una asignación personalizada que establezca `agentId`, los hooks de Gmail se ejecutan como el agente predeterminado.

Para bandejas de entrada que no sean de confianza, dirija el hook a un agente lector dedicado, proporcione a ese agente acceso de solo lectura o ningún acceso al espacio de trabajo y deniegue la escritura en el sistema de archivos, el shell, el navegador y otras herramientas innecesarias. Si necesita notificar al agente principal, permita únicamente la transferencia necesaria entre agentes. Consulte [Inyección de prompts](/es/gateway/security#prompt-injection), [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) y [`tools.agentToAgent`](/es/gateway/config-tools#toolsagenttoagent).
</Warning>

### Inicio automático del Gateway

Cuando se establece `hooks.enabled=true` y `hooks.gmail.account`, el Gateway inicia `gog gmail watch serve` durante el arranque y renueva automáticamente la vigilancia. Establezca `OPENCLAW_SKIP_GMAIL_WATCHER=1` para deshabilitarlo.

### Configuración manual única

<Steps>
  <Step title="Seleccione el proyecto de GCP">
    Seleccione el proyecto de GCP propietario del cliente OAuth que usa `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Cree el tema y conceda acceso de envío a Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Inicie la vigilancia">
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

Para bandejas de entrada que no sean de confianza, use el modelo de última generación y mejor nivel disponible en su proveedor. El valor anterior es un ejemplo; el modelo debe existir en el catálogo y la lista de permitidos configurados.

## Configuración

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    triggers: {
      enabled: false,
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

`webhookToken` se envía como `Authorization: Bearer <token>` en las solicitudes POST del Webhook de Cron.

`cron.store` es una clave lógica del almacén y una ruta de migración de doctor, no un archivo JSON activo que deba editarse manualmente. Los datos de los trabajos residen en SQLite; use la CLI o la API del Gateway para realizar cambios.

Desactive Cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamiento de los reintentos">
    **Reintento de una sola ejecución**: los errores transitorios (límite de frecuencia, sobrecarga, red, tiempo de espera o error del servidor) usan una programación de reintentos integrada. Los errores permanentes deshabilitan el trabajo inmediatamente.

    **Reintento recurrente**: los errores de ejecución consecutivos aplican una espera progresiva conforme a una programación ampliada (30s, 60s, 5m, 15m, 60m). La espera progresiva se restablece después de la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Mantenimiento">
    `cron.sessionRetention` (valor predeterminado `24h`; `false` lo deshabilita) elimina las entradas de sesiones de ejecución aisladas. El historial de ejecuciones conserva las 2000 filas terminales más recientes por trabajo; las filas perdidas mantienen su periodo de limpieza de 24 horas.
  </Accordion>
  <Accordion title="Migración del almacén heredado">
    Tras actualizar, ejecute `openclaw doctor --fix` para importar los archivos heredados `~/.openclaw/cron/jobs.json`, `jobs-state.json` y `runs/*.jsonl` a SQLite y cambiarles el nombre con un sufijo `.migrated`. Las filas de trabajos con formato incorrecto se omiten durante la ejecución y se copian en `jobs-quarantine.json` para repararlas o revisarlas posteriormente.
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
    - Confirme que el Gateway se ejecuta continuamente.
    - Para programaciones `cron`, verifique la zona horaria (`--tz`) frente a la zona horaria del host.
    - `reason: not-due` en la salida de la ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y el trabajo aún no debía ejecutarse.

  </Accordion>
  <Accordion title="Cron se activó, pero no hubo entrega">
    - El modo de entrega `none` significa que no se espera ningún envío alternativo del ejecutor. El agente aún puede realizar un envío directo con la herramienta `message` cuando haya una ruta de chat disponible.
    - Un destino de entrega ausente o no válido (`channel`/`to`) significa que se omitió el envío saliente.
    - En Matrix, los trabajos copiados o heredados con identificadores de sala `delivery.to` en minúsculas pueden fallar porque los identificadores de sala de Matrix distinguen entre mayúsculas y minúsculas. Edite el trabajo para usar el valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación del canal (`unauthorized`, `Forbidden`) indican que las credenciales bloquearon la entrega.
    - Si la ejecución aislada devuelve únicamente el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y la ruta alternativa de resumen en cola, por lo que no se publica nada en el chat.
    - Si el agente debe enviar mensajes al usuario por sí mismo, compruebe que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat anterior o un canal/destino explícito).

  </Accordion>
  <Accordion title="Cron o Heartbeat parecen impedir la rotación de estilo /new">
    - La actualización del restablecimiento diario y por inactividad no se basa en `updatedAt`; consulte [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Las activaciones de Cron, las ejecuciones de Heartbeat, las notificaciones de exec y el mantenimiento del Gateway pueden actualizar la fila de la sesión para el enrutamiento o el estado, pero no amplían `sessionStartedAt` ni `lastInteractionAt`.
    - En el caso de las filas heredadas creadas antes de que existieran esos campos, OpenClaw puede recuperar `sessionStartedAt` del encabezado de sesión del archivo de transcripción JSONL cuando el archivo sigue disponible. Las filas heredadas inactivas sin `lastInteractionAt` utilizan esa hora de inicio recuperada como referencia de inactividad.

  </Accordion>
  <Accordion title="Aspectos problemáticos de las zonas horarias">
    - Cron sin `--tz` utiliza la zona horaria del host del Gateway.
    - Las programaciones de `at` sin zona horaria se tratan como UTC.
    - El `activeHours` de Heartbeat utiliza la resolución de zona horaria configurada.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [Automatización](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para las ejecuciones de Cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de la zona horaria
