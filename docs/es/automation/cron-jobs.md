---
read_when:
    - Programación de tareas en segundo plano o activaciones
    - Conexión de activadores externos (webhooks, Gmail) con OpenClaw
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Tareas programadas, webhooks y activadores de PubSub de Gmail para el programador del Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-07-20T00:45:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3365e59e06517169306425b639d45082e3331616c4c62b5f05e5e2b8181fc212
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el programador integrado del Gateway. Conserva los trabajos, activa al agente en el momento adecuado y puede entregar la salida a un canal de chat, un Webhook o a ningún destino.

## Inicio rápido

<Steps>
  <Step title="Añadir un recordatorio de una sola ejecución">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Recordatorio" \
      --session main \
      --system-event "Recordatorio: revisar el borrador de la documentación de cron" \
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

## Cómo funciona cron

- Cron se ejecuta **dentro del proceso del Gateway**, no dentro del modelo. El Gateway debe estar en ejecución para que se activen las programaciones.
- Las definiciones de trabajos, el estado de ejecución y el historial de ejecuciones se conservan en la base de datos de estado SQLite compartida de OpenClaw, por lo que los reinicios no hacen que se pierdan las programaciones.
- Cada ejecución de cron crea un registro de [tarea en segundo plano](/es/automation/tasks).
- Los trabajos de una sola ejecución (`--at`) se eliminan automáticamente después de completarse correctamente de forma predeterminada; se debe pasar `--keep-after-run` para conservarlos.
- Presupuesto de tiempo de reloj por ejecución: `--timeout-seconds` cuando se establece. De lo contrario, los trabajos de turno de agente aislados o desvinculados están limitados por el supervisor propio de cron de 60 minutos antes de que pudiera aplicarse el tiempo de espera del turno de agente subyacente (`agents.defaults.timeoutSeconds`, 48 horas de forma predeterminada); los trabajos de comandos tienen un valor predeterminado de 10 minutos y las cargas útiles de scripts, de 5 minutos.
- Al iniciar el Gateway, los trabajos de turno de agente aislados vencidos se reprograman en lugar de reproducirse de inmediato, lo que mantiene el trabajo de inicialización del modelo y las herramientas fuera del intervalo de conexión del canal.
- Si se ejecuta `openclaw agent` desde el cron del sistema u otro programador externo, se debe envolver con un escalado de terminación forzada, aunque la CLI ya gestione `SIGTERM`/`SIGINT`. Las ejecuciones respaldadas por el Gateway solicitan al Gateway que cancele las ejecuciones aceptadas; las ejecuciones locales y las de reserva integradas reciben la misma señal de cancelación. Para `timeout` de GNU, se recomienda `timeout -k 60 600 openclaw agent ...` en lugar de `timeout 600 ...` sin más: el valor `-k` actúa como último recurso si el proceso no puede finalizar a tiempo. Para las unidades systemd, se debe usar una señal de detención `SIGTERM` con un período de gracia (`TimeoutStopSec`) antes de la terminación final. Si se reutiliza un `--run-id` mientras la ejecución original del Gateway sigue activa, el duplicado se notifica como en curso en lugar de iniciar una segunda ejecución.

<AccordionGroup>
  <Accordion title="Refuerzo de las ejecuciones aisladas">
    - Al finalizar, las ejecuciones aisladas intentan cerrar, en la medida de lo posible, las pestañas y los procesos del navegador rastreados para su sesión `cron:<jobId>`, y eliminan cualquier instancia del entorno de ejecución MCP incluido creada para el trabajo mediante la misma ruta de desmontaje compartida que utilizan las ejecuciones de la sesión principal y las sesiones personalizadas. Los fallos de limpieza se ignoran para que siga prevaleciendo el resultado de cron.
    - Las ejecuciones aisladas con la concesión limitada de autolimpieza de cron pueden leer el estado del programador, una lista filtrada que contiene únicamente su propio trabajo y el historial de ejecuciones de ese trabajo, y solo pueden eliminar su propio trabajo.
    - Las ejecuciones aisladas se protegen frente a respuestas de confirmación obsoletas: si el primer resultado es únicamente una actualización de estado provisional (`on it`, `pulling everything together` e indicaciones similares) y ningún subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de entregarlo.
    - Se reconocen los metadatos estructurados de denegación de ejecución (incluidos los envoltorios `UNAVAILABLE` del host del Node cuyo error anidado comienza por `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`) para que un comando bloqueado no se notifique como una ejecución correcta, mientras que el texto normal del asistente no se confunde con una denegación.
    - Los fallos del agente en el ámbito de la ejecución se consideran errores del trabajo incluso cuando no hay carga útil de respuesta, por lo que los fallos del modelo o proveedor incrementan los contadores de errores y activan notificaciones de fallo en lugar de marcar el trabajo como completado correctamente.
    - Cuando un trabajo alcanza `timeoutSeconds`, cron cancela la ejecución y le concede un breve intervalo de limpieza. Si no finaliza, la limpieza administrada por el Gateway elimina a la fuerza la propiedad de sesión de esa ejecución antes de que cron registre el tiempo de espera agotado, de modo que el trabajo de chat en cola no quede bloqueado tras una sesión de procesamiento obsoleta.
    - Los bloqueos durante la configuración o el inicio tienen un tiempo de espera específico para la fase (por ejemplo, `cron: isolated agent setup timed out before runner start` o `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Estos supervisores abarcan los proveedores integrados y los respaldados por la CLI incluso antes de que se inicie su proceso de CLI externo, y sus límites son independientes de los valores prolongados de `timeoutSeconds`, para que los fallos de arranque en frío, autenticación o contexto se manifiesten rápidamente.

  </Accordion>
  <Accordion title="Conciliación de tareas">
    La conciliación de tareas de cron depende primero del entorno de ejecución y, en segundo lugar, del historial persistente: una tarea de cron activa permanece activa mientras el entorno de ejecución de cron siga registrando ese trabajo como en ejecución, aunque todavía exista una fila antigua de una sesión secundaria. Cuando el entorno de ejecución deja de ser propietario del trabajo y transcurre un período de gracia de 5 minutos, las comprobaciones de mantenimiento consultan los registros de ejecución persistentes y el estado del trabajo para la ejecución `cron:<jobId>:<startedAt>` correspondiente. Un resultado terminal en esos datos finaliza el registro contable de la tarea; de lo contrario, el mantenimiento administrado por el Gateway puede marcar la tarea como `lost`. La auditoría sin conexión de la CLI puede recuperar información del historial persistente, pero su propio conjunto vacío de trabajos activos dentro del proceso no demuestra que haya desaparecido una ejecución administrada por el Gateway.
  </Accordion>
</AccordionGroup>

## Tipos de programación

| Tipo      | Opción de la CLI    | Descripción                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | Marca de tiempo de una sola ejecución (ISO 8601 o relativa, como `20m`)                                                     |
| `every`   | `--every`   | Intervalo fijo (`10m`, `1h`, `1d`)                                                                       |
| `cron`    | `--cron`    | Expresión cron de 5 o 6 campos con `--tz` opcional                                                  |
| `on-exit` | `--on-exit` | Se activa una vez cuando finaliza un comando supervisado (desencadenador de evento; persiste tras el desmontaje del turno; `--on-exit-cwd` opcional) |

Las marcas de tiempo sin zona horaria se interpretan como UTC. Se debe añadir `--tz America/New_York` para interpretar una fecha y hora `--at` sin desplazamiento, o para evaluar una expresión cron, en esa zona horaria de IANA. Las expresiones cron sin `--tz` utilizan la zona horaria del host del Gateway. `--tz` no es válido con `--every` ni con `--on-exit`.

Las expresiones recurrentes que se ejecutan al inicio de cada hora (minuto `0` con un comodín en el campo de la hora) se distribuyen automáticamente hasta 5 minutos para reducir los picos de carga. Se debe usar `--exact` para forzar una temporización precisa o `--stagger 30s` para definir un intervalo explícito (solo para programaciones cron).

### Cadencia dinámica (ritmo)

Los trabajos recurrentes pueden establecer `pacing.min` o `pacing.max`, o ambos, en cadenas de duración como `15m` o `4h`; se requiere al menos un límite. Se deben usar `--pacing-min` y `--pacing-max` con `cron add|edit` (`--clear-pacing` elimina ambos límites).

Durante una ejecución aislada, un trabajo con ritmo puede llamar a la herramienta `cron` con `action: "next_check"` y `in: "30m"`. La propuesta solo se aplica al trabajo que se está ejecutando en ese momento y se mide desde la finalización correcta de la ejecución. OpenClaw la ajusta silenciosamente a los límites configurados.

Si se usa el ritmo sin una propuesta, la programación normal no cambia. Las ejecuciones fallidas, con el tiempo de espera agotado u omitidas descartan la propuesta, por lo que prevalece el comportamiento existente de reintentos y espera incremental tras errores. Forzar manualmente un trabajo recurrente es una operación fuera de secuencia y conserva su turno natural o con ritmo pendiente. En los trabajos activados por condiciones, el intervalo mínimo integrado sigue siendo un límite inferior incluso cuando una propuesta solicita una comprobación anterior.

### El día del mes y el día de la semana usan lógica OR

Las expresiones Cron se analizan mediante [croner](https://github.com/Hexagon/croner). Cuando ni el campo del día del mes ni el del día de la semana contienen comodines, croner considera que hay coincidencia cuando coincide **cualquiera** de los campos, no ambos. Este es el comportamiento estándar de Vixie cron.

```bash
# Intención: "A las 9 a. m. del día 15, solo si es lunes"
# Realidad:  "A las 9 a. m. de cada día 15 Y a las 9 a. m. de cada lunes"
0 9 15 * 1
```

Esto se activa aproximadamente 5-6 veces al mes, en lugar de 0-1 veces al mes. Para exigir que se cumplan ambas condiciones, use el modificador de día de la semana `+` de croner (`0 9 15 * +1`), o programe según un campo y compruebe el otro en el prompt o comando del trabajo.

## Desencadenadores de eventos (supervisores de condiciones)

Un desencadenador de eventos añade un script de condición sin interfaz a una programación `every` o `cron`. Cron evalúa el script cuando corresponde ejecutar el trabajo y solo ejecuta la carga útil normal cuando el script devuelve `fire: true`:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Se activa solo cuando el estado observado difiere del de la última evaluación.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Investiga el cambio de estado de la CI." },
}
```

El script debe devolver `{ fire, message?, state? }`. El estado JSON anterior está disponible como `trigger.state`, que está profundamente congelado; devuelva un nuevo valor `state` para conservarlo. El estado tiene un límite de 16 KB. Cuando el resultado de una activación incluye `message`, Cron lo añade al texto del evento del sistema o al mensaje del turno del agente antes de la ejecución. `once: true` deshabilita el trabajo después de su primera carga activada correctamente.

`fire: false` conserva el estado y los contadores de la evaluación y, a continuación, reprograma sin crear un historial de ejecuciones. Si falla la ejecución de una carga activada, el valor `state` devuelto **no** se conserva: la siguiente evaluación ve el estado anterior y puede volver a activarse, por lo que los scripts deben escribirse como comprobaciones de solo lectura y las acciones deben mantenerse en la carga. Las programaciones por activación tienen un intervalo mínimo configurable (30 segundos de forma predeterminada). Cada evaluación dispone de un límite de tiempo real de 30 segundos y de hasta 5 llamadas a herramientas.

Diseñe los monitores en torno al **estado que requiere una acción**, no solo al éxito: un monitor que deja de informar cuando su comprobación falla o agota el tiempo parece estar en buen estado aunque no funcione. Compare la observación con `trigger.state` y devuelva un estado nuevo para eliminar duplicados; no dependa de la memoria del modelo ni del proceso. Al activarse, haga que `message` sea autosuficiente, ya que se convierte en el contexto completo del evento de la ejecución activada.

<Warning>
Habilitar `cron.triggers.enabled` permite que tanto los scripts de activación condicional como las cargas `script` se ejecuten sin supervisión con la **política completa de herramientas del agente propietario, incluida `exec`**. Trátelo como una ejecución de código desatendida con los permisos de ese agente; déjelo deshabilitado a menos que todos los agentes autorizados para crear trabajos de Cron sean de la confianza correspondiente.
</Warning>

Cree un monitor a partir de un archivo de script local (`-` lee el script desde la entrada estándar):

```bash
openclaw cron add \
  --name "Monitor de CI del PR" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Responde al cambio de estado de la CI" \
  --session isolated
```

## Cargas

Cada trabajo contiene exactamente un tipo de carga, elegido mediante una marca:

| Carga útil       | Indicador                                           | Ejecución                                                       |
| ------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| Evento del sistema  | `--system-event <text>`                        | Se pone en cola en la sesión principal, sin invocar al modelo por sí solo    |
| Mensaje del agente | `--message <text>`                             | Un turno del agente respaldado por un modelo                                  |
| Comando       | `--command <shell>` o `--command-argv <json>` | Un shell/proceso en el host del Gateway, sin invocar al modelo         |
| Script        | `--script <file\|->`                           | Un script sin interfaz en modo de código que utiliza las herramientas del agente propietario |

### Opciones del turno del agente

<ParamField path="--message" type="string" required>
  Texto del prompt (obligatorio para trabajos de sesión aislada, actual o personalizada).
</ParamField>
<ParamField path="--model" type="string">
  Sustitución del modelo; debe resolverse como un modelo permitido o la ejecución falla con un error de validación.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos alternativos por trabajo, por ejemplo `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Pase `--fallbacks ""` para una ejecución estricta sin modelos alternativos.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  En `cron edit`, elimina la sustitución de modelos alternativos por trabajo para que el trabajo siga la precedencia configurada de modelos alternativos. No se puede combinar con `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  En `cron edit`, elimina la sustitución del modelo por trabajo para que el trabajo siga la precedencia normal del modelo de cron (sustitución almacenada de la sesión de cron o, en su defecto, modelo del agente/predeterminado). No se puede combinar con `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Sustitución del nivel de razonamiento (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Los niveles disponibles siguen dependiendo del modelo y del entorno de ejecución del agente seleccionados.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  En `cron edit`, elimina la sustitución del nivel de razonamiento por trabajo. No se puede combinar con `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omite la inyección de archivos de inicialización del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe las herramientas que puede utilizar el trabajo, por ejemplo `--tools exec,read`.
</ParamField>

`--model` establece el modelo principal del trabajo; no sustituye una anulación `/model` de la sesión, por lo que las cadenas de modelos alternativos configuradas siguen aplicándose sobre él. Un modelo que no se pueda resolver o que no esté permitido hace que la ejecución falle con un error de validación explícito, en lugar de recurrir silenciosamente al modelo predeterminado. Si un trabajo tiene `--model` pero ninguna lista de modelos alternativos explícita o configurada, OpenClaw pasa una sustitución vacía de modelos alternativos en lugar de añadir silenciosamente el modelo principal del agente como destino de reintento oculto.

Precedencia de selección de modelos para trabajos aislados, de mayor a menor:

1. Carga útil por trabajo `model` (configuración explícita; un modelo no permitido hace que la ejecución falle)
2. Sustitución del modelo del hook de Gmail (solo cuando la ejecución procede de Gmail y dicha sustitución está permitida)
3. Sustitución del modelo almacenada de la sesión de cron seleccionada por el usuario
4. Selección del modelo del agente/predeterminado

El modo rápido sigue la selección activa resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, cron aislado lo utiliza de forma predeterminada; una sustitución `fastMode` almacenada en la sesión (y después una `fastModeDefault` del agente) sigue teniendo prioridad sobre la configuración del modelo en cualquier sentido. El modo automático utiliza el límite `params.fastAutoOnSeconds` del modelo, con un valor predeterminado de 60 segundos.

Si una ejecución encuentra una transferencia por cambio de modelo en vivo, cron vuelve a intentarlo con el proveedor/modelo cambiado y conserva esa selección (y cualquier perfil de autenticación nuevo) durante la ejecución activa. Los reintentos están limitados: después del intento inicial más 2 reintentos por cambio, cron cancela en lugar de entrar en un bucle.

Antes de iniciar una ejecución aislada, OpenClaw comprueba los endpoints locales accesibles de los proveedores `api: "ollama"` y `api: "openai-completions"` configurados cuyo `baseUrl` sea de bucle local, de red privada o `.local`. Esta comprobación previa recorre la cadena de modelos alternativos configurada del trabajo y solo marca la ejecución como `skipped` cuando todos los candidatos son inaccesibles; `--fallbacks ""` mantiene ese recorrido estrictamente limitado al modelo principal. Un endpoint caído registra la ejecución como `skipped` con un error claro en lugar de iniciar una llamada al modelo. El resultado se almacena en caché durante 5 minutos por endpoint (no por trabajo ni por modelo), por lo que muchos trabajos programados que comparten un servidor Ollama/vLLM/SGLang/LM Studio local caído generan una sola comprobación en lugar de una avalancha de solicitudes. Las ejecuciones omitidas por la comprobación previa no incrementan la espera entre reintentos por errores de ejecución; establezca `failureAlert.includeSkipped` para habilitar alertas repetidas de omisión.

### Cargas útiles de comandos

Las cargas útiles de comandos ejecutan scripts deterministas dentro del planificador del Gateway sin iniciar un turno respaldado por un modelo. Se ejecutan en el host del Gateway, capturan stdout/stderr, registran la ejecución en el historial de cron y reutilizan los mismos modos de entrega `announce`, `webhook` y `none` que los trabajos de turnos del agente.

<Note>
El cron de comandos es una superficie de automatización del Gateway para operadores administradores, no una llamada `tools.exec` de un agente. Para crear, actualizar, eliminar o ejecutar manualmente trabajos de cron se requiere `operator.admin`; las ejecuciones programadas de comandos se ejecutan posteriormente dentro del proceso del Gateway como esa automatización creada por el administrador. La política de ejecución del agente (`tools.exec.mode`, solicitudes de aprobación, listas de herramientas permitidas por agente) rige las herramientas de ejecución visibles para el modelo, no las cargas útiles del cron de comandos.
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

`--command <shell>` almacena `argv: ["sh", "-lc", <shell>]`. Utilice `--command-argv '["node","scripts/report.mjs"]'` para una ejecución argv exacta sin análisis del shell. Los parámetros opcionales `--command-env KEY=VALUE` (repetible), `--command-input`, `--timeout-seconds` (valor predeterminado de 10 minutos), `--no-output-timeout-seconds` y `--output-max-bytes` controlan el entorno del proceso, stdin y los límites de salida.

El texto entregado se deriva de la salida del proceso: stdout no vacío tiene prioridad; si stdout está vacío y stderr no, se entrega stderr; si ambos están presentes, cron envía un pequeño bloque `stdout:` / `stderr:`. El código de salida `0` registra la ejecución como `ok`; una salida distinta de cero, una señal, un tiempo de espera agotado o un tiempo de espera sin salida agotado registra `error` y puede activar alertas de fallo. Un comando que solo imprime `NO_REPLY` utiliza la supresión normal de tokens silenciosos de cron y no publica nada en el chat.

### Cargas útiles de scripts

Las cargas útiles de scripts se ejecutan sin interfaz en el mismo ejecutor en modo de código que los scripts de activación, sin iniciar un turno conversacional del agente. Habilite `cron.triggers.enabled` antes de crearlas o ejecutarlas; esta puerta para automatizaciones peligrosas abarca tanto los scripts de activación como las cargas útiles de scripts. Los trabajos de scripts solo admiten los destinos de sesión `main` y `isolated`.

```bash
openclaw cron create "0 * * * *" \
  --name "Comprobación horaria de la cola" \
  --script ./automation/check-queue.js \
  --script-timeout-seconds 300 \
  --script-tool-budget 50 \
  --session isolated \
  --announce
```

Utilice `--script <file|->` para leer JavaScript desde un archivo o stdin. El tiempo de espera predeterminado es de 300 segundos y tiene un límite de 900; el presupuesto de herramientas predeterminado es de 50 llamadas y tiene un límite de 200. Estos presupuestos de carga útil son independientes de los presupuestos más pequeños de evaluación de la puerta de activación.

El script puede devolver un objeto con estos campos opcionales:

- `notify`: Texto entregado mediante el modo de entrega `announce`, `webhook` o `none` del trabajo. Si se omite, no se entrega nada. Para un trabajo `main`, el texto se convierte en un evento del sistema.
- `wake`: `"now"` solicita un Heartbeat inmediato después de poner en cola `notify` (o un evento de finalización compacto); `"next-heartbeat"` pone el evento en cola para el próximo Heartbeat.
- `state`: Estado JSON, limitado a 16 KB y conservado únicamente después de una ejecución correcta. La siguiente ejecución recibe una copia inmutable como `trigger.state`, al igual que los scripts de activación. Como ese espacio de nombres tiene un único propietario persistente, una carga útil de script no puede combinarse con un activador condicional en el mismo trabajo.
- `nextCheck`: Una duración como `"15m"`. Solo es válida para trabajos con cadencia habilitada y utiliza el mismo límite de cadencia que las propuestas de turnos del agente.

Las excepciones, los tiempos de espera agotados, los presupuestos de herramientas agotados, los resultados no válidos y `nextCheck` sin cadencia son errores normales de ejecución de cron: se incorporan al historial de ejecuciones, a la espera entre reintentos y al tratamiento de alertas de fallo sin conservar el estado devuelto.

## Estilos de ejecución

| Estilo           | Valor de `--session`   | Se ejecuta en                  | Ideal para                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesión principal    | `main`              | Carril de activación dedicado de cron | Recordatorios, eventos del sistema        |
| Aislado        | `isolated`          | `cron:<jobId>` dedicado | Informes, tareas rutinarias en segundo plano      |
| Sesión actual | `current`           | Vinculada en el momento de la creación   | Trabajo recurrente sensible al contexto    |
| Sesión personalizada  | `session:custom-id` | Sesión persistente con nombre | Flujos de trabajo que se basan en el historial |

<AccordionGroup>
  <Accordion title="Sesión principal frente a aislada y personalizada">
    Los trabajos de **sesión principal** ponen en cola un evento del sistema en un carril de ejecución propiedad de cron y, opcionalmente, activan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Pueden utilizar el último contexto de entrega de la sesión principal de destino para las respuestas, pero no añaden los turnos rutinarios de cron al carril de chat humano ni prolongan la vigencia del restablecimiento diario/por inactividad de la sesión de destino. Los trabajos **aislados** ejecutan un turno dedicado del agente con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) conservan el contexto entre ejecuciones, lo que permite flujos de trabajo como reuniones diarias de seguimiento que se basan en resúmenes anteriores.

    Los eventos de cron de la sesión principal son recordatorios de eventos del sistema autocontenidos. No incluyen automáticamente la instrucción "Leer HEARTBEAT.md" del prompt predeterminado de Heartbeat; indíquelo explícitamente en el texto del evento de cron si un recordatorio debe consultar `HEARTBEAT.md`.

  </Accordion>
  <Accordion title="Qué significa «sesión nueva» para los trabajos aislados">
    Un nuevo id de transcripción/sesión por ejecución. OpenClaw conserva las preferencias seguras (configuración de razonamiento/modo rápido/nivel de detalle, etiquetas y sustituciones explícitas de modelo/autenticación seleccionadas por el usuario), pero no hereda el contexto de conversación implícito de una fila de cron anterior: enrutamiento de canal/grupo, política de envío o cola, elevación, origen o vinculación al entorno de ejecución de ACP. Utilice `current` o `session:<id>` cuando un trabajo recurrente deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Contrato de ejecución desatendida">
    Los turnos del agente de cron aislado y de hooks son explícitamente desatendidos: no hay nadie presente para aclarar ni aprobar. La respuesta final debe ser el resultado entregable en lugar de un plan, acuse de recibo o solicitud de información. El agente devuelve `HEARTBEAT_OK` cuando no hay nada que hacer e indica los fallos claramente; cron controla la política de reintentos y alertas de fallo.

    Para los trabajos programados de confianza, las instrucciones propias del trabajo tienen prioridad cuando solicitan intencionadamente una pregunta o un plan, y el agente puede eliminar un trabajo que ya no sea necesario. Los turnos de hooks externos solo reciben el contrato desatendido común; no reciben esa sustitución ni las indicaciones de autoeliminación a través del límite de contenido externo.

  </Accordion>
  <Accordion title="Entrega de subagentes y Discord">
    Cuando las ejecuciones aisladas de cron coordinan subagentes, la entrega da prioridad a la salida final del descendiente sobre el texto provisional obsoleto del agente padre. Si los descendientes siguen ejecutándose, OpenClaw suprime esa actualización parcial del agente padre en lugar de anunciarla.

    Para los destinos de anuncios de Discord que solo admiten texto, OpenClaw envía una sola vez el texto final canónico del asistente, en lugar de reproducir tanto el texto transmitido/intermedio como la respuesta final. Los archivos multimedia y las cargas útiles estructuradas de Discord se siguen entregando por separado para no omitir archivos adjuntos ni componentes.

  </Accordion>
</AccordionGroup>

## Entrega y salida

| Modo       | Qué sucede                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Entrega como alternativa el texto final al destino si el agente no lo envió |
| `webhook`  | Envía mediante POST la carga útil del evento finalizado a una URL                                |
| `none`     | Sin entrega alternativa del ejecutor                                         |

Use `--announce --channel telegram --to "-1001234567890"` para la entrega al canal. Para los temas de foros de Telegram, use `-1001234567890:topic:123`; OpenClaw también acepta la forma abreviada `-1001234567890:123`, que pertenece a Telegram. Los llamadores directos de RPC/configuración pueden pasar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost usan prefijos explícitos (`channel:<id>`, `user:<id>`). Los identificadores de sala de Matrix distinguen entre mayúsculas y minúsculas; use el identificador exacto de la sala o la forma `room:!room:server` de Matrix.

Cuando la entrega de anuncios usa `channel: "last"` u omite `channel`, un destino con prefijo de proveedor, como `telegram:123`, puede seleccionar el canal antes de que cron recurra al historial de la sesión o a un único canal configurado. Solo los prefijos anunciados por el plugin cargado actúan como selectores de proveedor. Si `delivery.channel` es explícito, el prefijo del destino debe indicar el mismo proveedor; `channel: "whatsapp"` con `to: "telegram:123"` se rechaza, en lugar de permitir que WhatsApp interprete el identificador de Telegram como un número de teléfono. Los prefijos de tipo de destino y servicio (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) siguen siendo sintaxis de destino propiedad del canal, no selectores de proveedor.

En los trabajos aislados, la entrega al chat es compartida: si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso con `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el anuncio alternativo. De lo contrario, `announce`, `webhook` y `none` solo controlan lo que hace el ejecutor con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino de entrega activo conservado para la ruta de anuncio alternativa. Las claves internas de sesión pueden estar en minúsculas; los destinos de entrega del proveedor no se reconstruyen a partir de esas claves cuando está disponible el contexto del chat actual.

La entrega implícita de anuncios usa las listas de canales permitidos configuradas para validar y redirigir destinos obsoletos. Las aprobaciones del almacén de emparejamiento de mensajes directos no son destinatarios de automatización alternativa; establezca `delivery.to` o configure la entrada `allowFrom` del canal cuando un trabajo programado deba enviar proactivamente a un mensaje directo.

### Notificaciones de fallos

Las notificaciones de fallos siguen una ruta de destino independiente:

- `cron.failureDestination` establece un valor predeterminado global para las notificaciones de fallos.
- `job.delivery.failureDestination` lo sustituye para cada trabajo.
- Si no se establece ninguno y el trabajo ya realiza la entrega mediante `announce`, las notificaciones de fallos recurren a ese destino principal de anuncios.
- `delivery.failureDestination` solo se admite en trabajos `sessionTarget="isolated"`, salvo que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` habilita para un trabajo o una política global de alertas de cron las alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador consecutivo independiente, por lo que no afectan al retroceso por errores de ejecución.
- `openclaw cron edit` expone el ajuste de alertas por trabajo: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` y `--failure-alert-account-id`.

### Idioma de salida

Los trabajos de cron no deducen el idioma de respuesta a partir del canal, la configuración regional ni los mensajes anteriores. Incluya la regla de idioma en el mensaje o la plantilla programados:

```bash
openclaw cron edit <jobId> \
  --message "Resume las actualizaciones. Responde en chino; mantén sin cambios las URL, el código y los nombres de productos."
```

En los archivos de plantilla, mantenga la instrucción de idioma en el prompt renderizado y compruebe que los marcadores de posición, como `{{language}}`, estén rellenados antes de ejecutar el trabajo. Si la salida mezcla idiomas, haga explícita la regla, por ejemplo: "Usa chino para el texto narrativo y mantén los términos técnicos en inglés."

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
  <Tab title="Sustitución de modelo y razonamiento">
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
  <Tab title="Salida mediante Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Resume los despliegues de hoy como JSON." \
      --name "Resumen de despliegues" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Salida de comando">
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

## Administración de trabajos

```bash
# Enumerar todos los trabajos
openclaw cron list

# Obtener un trabajo almacenado como JSON
openclaw cron get <jobId>

# Mostrar un trabajo, incluida la ruta de entrega resuelta
openclaw cron show <jobId>

# Activar o desactivar sin eliminar
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Editar un trabajo
openclaw cron edit <jobId> --message "Prompt actualizado" --model "opus"

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

Archivar una sesión (desde la interfaz de control o mediante `sessions.patch { archived: true }` desde un llamador administrador-operador) desactiva todos los trabajos de cron habilitados vinculados a esa sesión: su sesión `cron:<jobId>` aislada, un destino `session:<key>` o un carril de entrega/activación `sessionKey`. Restaurar la sesión no vuelve a activar esos trabajos; use `openclaw cron enable <jobId>`. Las sesiones que tienen un trabajo vinculado habilitado muestran una insignia de reloj en la barra lateral de la interfaz de control.

`openclaw cron run <jobId>` retorna después de poner en cola la ejecución manual. Use `--wait` para hooks de apagado, scripts de mantenimiento u otras automatizaciones que deban bloquearse hasta que finalice la ejecución en cola; consulta periódicamente el `runId` retornado (tiempo de espera predeterminado `10m`, intervalo de consulta `2s`) y finaliza con `0` para el estado `ok`, y con un valor distinto de cero para `error`, `skipped` o un tiempo de espera agotado.

La herramienta `cron` del agente retorna resúmenes compactos de trabajos (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) desde `cron(action: "list")`; use `cron(action: "get", jobId: "...")` para obtener la definición completa de un trabajo. Los llamadores directos del Gateway pueden pasar `compact: true` a `cron.list`; omitirlo conserva la respuesta completa con vistas previas de entrega.

`openclaw cron create` es un alias de `openclaw cron add`. Los trabajos nuevos pueden usar una programación posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` o una marca de tiempo ISO) seguida de un prompt posicional del agente. Use `--webhook <url>` en `cron add|create` o `cron edit` para enviar mediante POST la carga útil de la ejecución finalizada a un endpoint HTTP; la entrega mediante Webhook no se puede combinar con indicadores de entrega al chat (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`). En `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account`, elimine individualmente esos campos de enrutamiento (cada uno se rechaza junto con su indicador de establecimiento correspondiente), a diferencia de `--no-deliver`, que solo desactiva la entrega alternativa del ejecutor.

<Note>
Nota sobre la sustitución del modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido o no se puede resolver, cron hace que la ejecución falle con un error de validación explícito.
- Los parches de carga útil `cron.update` de la API pueden establecer `model: null` para borrar la sustitución de modelo almacenada de un trabajo.
- `openclaw cron edit <job-id> --clear-model` borra esa sustitución desde la CLI (con el mismo efecto que el parche `model: null`) y no se puede combinar con `--model`.
- Las cadenas de alternativas configuradas siguen aplicándose porque `--model` de cron es el modelo principal del trabajo, no una sustitución `/model` de la sesión.
- `openclaw cron add|edit --fallbacks ...` establece `fallbacks` en la carga útil y sustituye las alternativas configuradas para ese trabajo; `--fallbacks ""` desactiva las alternativas y hace que la ejecución sea estricta. `openclaw cron edit <job-id> --clear-fallbacks` borra la sustitución específica del trabajo.
- Un `--model` simple sin una lista de alternativas explícita o configurada no recurre al modelo principal del agente como destino adicional de reintento silencioso.

</Note>

## Webhooks

El Gateway puede exponer endpoints HTTP de Webhook para activadores externos. Habilítelos en la configuración:

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

Los tokens de cadena de consulta se rechazan.

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
  <Accordion title="Hooks asignados (POST /hooks/<name>)">
    Los nombres de hooks personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas útiles arbitrarias en acciones `wake` o `agent` mediante plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantenga los endpoints de los hooks detrás de la interfaz de bucle invertido, la tailnet o un proxy inverso de confianza.

- Utilice un token específico para hooks; no reutilice los tokens de autenticación del Gateway.
- Mantenga `hooks.path` en una subruta específica; `/` se rechaza.
- Establezca `hooks.allowedAgentIds` para limitar a qué agente efectivo puede dirigirse un hook, incluido el agente predeterminado cuando se omite `agentId`.
- Mantenga `hooks.allowRequestSessionKey=false` a menos que necesite sesiones seleccionadas por quien realiza la llamada.
- Si habilita `hooks.allowRequestSessionKey`, establezca también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de las claves de sesión.
- De forma predeterminada, las cargas útiles de los hooks se encapsulan con límites de seguridad.

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

Esto escribe la configuración de `hooks.gmail`, habilita el ajuste preestablecido de Gmail y utiliza Tailscale Funnel de forma predeterminada para el endpoint de envío (`--tailscale funnel|serve|off`).

<Warning>
La sesión por mensaje del ajuste preestablecido de Gmail separa el contexto de las conversaciones; no restringe las herramientas ni el espacio de trabajo del agente de destino. Sin una asignación personalizada que establezca `agentId`, los hooks de Gmail se ejecutan como el agente predeterminado.

Para bandejas de entrada que no sean de confianza, dirija el hook a un agente lector específico, proporcione a ese agente acceso de solo lectura o ningún acceso al espacio de trabajo, y deniegue las herramientas de escritura en el sistema de archivos, shell, navegador y cualquier otra herramienta innecesaria. Si necesita notificar al agente principal, permita únicamente la transferencia necesaria entre agentes. Consulte [Inyección de prompts](/es/gateway/security#prompt-injection), [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) y [`tools.agentToAgent`](/es/gateway/config-tools#toolsagenttoagent).
</Warning>

### Inicio automático del Gateway

Cuando `hooks.enabled=true` está habilitado y `hooks.gmail.account` está establecido, el Gateway inicia `gog gmail watch serve` durante el arranque y renueva automáticamente la supervisión. Establezca `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desactivarlo.

### Configuración manual única

<Steps>
  <Step title="Seleccione el proyecto de GCP">
    Seleccione el proyecto de GCP propietario del cliente OAuth utilizado por `gog`:

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
  <Step title="Inicie la supervisión">
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

Para bandejas de entrada que no sean de confianza, utilice el modelo de última generación y del mejor nivel disponible de su proveedor. El valor anterior es un ejemplo; el modelo debe existir en el catálogo y la lista de permitidos configurados.

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

`cron.store` es una clave lógica del almacén y una ruta de migración de doctor, no un archivo JSON activo que deba editarse manualmente. Los datos de los trabajos residen en SQLite; utilice la CLI o la API del Gateway para realizar cambios.

Deshabilite Cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamiento de los reintentos">
    **Reintento único**: los errores transitorios (límite de solicitudes, sobrecarga, red, tiempo de espera agotado o error del servidor) utilizan una programación de reintentos integrada. Los errores permanentes deshabilitan el trabajo de inmediato.

    **Reintento recurrente**: los errores de ejecución consecutivos aplican una espera progresiva según una programación ampliada (30s, 60s, 5m, 15m, 60m). La espera progresiva se restablece después de la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Mantenimiento">
    `cron.sessionRetention` (valor predeterminado: `24h`; `false` lo deshabilita) elimina las entradas aisladas de sesiones de ejecución. El historial de ejecuciones conserva las 2000 filas terminales más recientes por trabajo; las filas perdidas mantienen su periodo de limpieza de 24 horas.
  </Accordion>
  <Accordion title="Migración del almacén heredado">
    Al actualizar, ejecute `openclaw doctor --fix` para importar en SQLite los archivos heredados `~/.openclaw/cron/jobs.json`, `jobs-state.json` y `runs/*.jsonl`, y cambiarles el nombre con el sufijo `.migrated`. Las filas de trabajos con formato incorrecto se omiten durante la ejecución y se copian en `jobs-quarantine.json` para su posterior reparación o revisión.
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
    - Para las programaciones `cron`, compruebe la zona horaria (`--tz`) frente a la zona horaria del host.
    - `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y que aún no correspondía ejecutar el trabajo.

  </Accordion>
  <Accordion title="Cron se activó, pero no hubo entrega">
    - El modo de entrega `none` significa que no se espera ningún envío alternativo del ejecutor. El agente aún puede realizar un envío directo con la herramienta `message` cuando haya disponible una ruta de chat.
    - Si falta el destino de entrega o no es válido (`channel`/`to`), se omite el envío saliente.
    - En Matrix, los trabajos copiados o heredados con identificadores de sala `delivery.to` convertidos a minúsculas pueden fallar porque los identificadores de sala de Matrix distinguen entre mayúsculas y minúsculas. Edite el trabajo para usar el valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación del canal (`unauthorized`, `Forbidden`) indican que las credenciales bloquearon la entrega.
    - Si la ejecución aislada devuelve únicamente el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y la ruta alternativa del resumen en cola, por lo que no se publica nada en el chat.
    - Si el agente debe enviar el mensaje al usuario por sí mismo, compruebe que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat anterior, o un canal y destino explícitos).

  </Accordion>
  <Accordion title="Cron o Heartbeat parece impedir la renovación del estilo /new">
    - La actualización de los restablecimientos diarios y por inactividad no se basa en `updatedAt`; consulte [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Las activaciones de Cron, las ejecuciones de Heartbeat, las notificaciones de ejecución y el mantenimiento de registros del Gateway pueden actualizar la fila de la sesión para el enrutamiento o el estado, pero no amplían `sessionStartedAt` ni `lastInteractionAt`.
    - Para las filas heredadas creadas antes de que existieran esos campos, OpenClaw puede recuperar `sessionStartedAt` del encabezado de sesión del archivo de transcripción JSONL cuando este todavía está disponible. Las filas inactivas heredadas sin `lastInteractionAt` utilizan esa hora de inicio recuperada como referencia de inactividad.

  </Accordion>
  <Accordion title="Consideraciones sobre las zonas horarias">
    - Cron sin `--tz` utiliza la zona horaria del host del Gateway.
    - Las programaciones `at` sin zona horaria se interpretan como UTC.
    - Heartbeat `activeHours` utiliza la resolución de zona horaria configurada.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [Automatización](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para las ejecuciones de Cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de la zona horaria
