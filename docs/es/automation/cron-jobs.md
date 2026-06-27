---
read_when:
    - Programación de trabajos en segundo plano o activaciones
    - Integrar desencadenadores externos (Webhooks, Gmail) en OpenClaw
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Trabajos programados, webhooks y disparadores de Gmail PubSub para el planificador de Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-06-27T10:33:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el programador integrado del Gateway. Persiste trabajos, despierta al agente en el momento adecuado y puede entregar la salida de vuelta a un canal de chat o a un punto de conexión de Webhook.

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
  <Step title="Consultar tus trabajos">
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

- Cron se ejecuta **dentro del proceso del Gateway** (no dentro del modelo).
- Las definiciones de trabajos, el estado en tiempo de ejecución y el historial de ejecuciones persisten en la base de datos de estado SQLite compartida de OpenClaw para que los reinicios no pierdan programaciones.
- Al actualizar, ejecuta `openclaw doctor --fix` para importar los archivos heredados `~/.openclaw/cron/jobs.json`, `jobs-state.json` y `runs/*.jsonl` a SQLite y renombrarlos con un sufijo `.migrated`. Las filas de trabajos mal formadas se omiten del tiempo de ejecución y se copian a `jobs-quarantine.json` para reparación o revisión posterior.
- `cron.store` sigue nombrando la clave lógica del almacén cron y la ruta de importación de doctor. Después de la importación, editar ese archivo JSON ya no cambia los trabajos cron activos; usa `openclaw cron add|edit|remove` o los métodos RPC cron del Gateway en su lugar.
- Todas las ejecuciones cron crean registros de [tareas en segundo plano](/es/automation/tasks).
- Al iniciar el Gateway, los trabajos aislados de turno de agente vencidos se reprograman fuera de la ventana de conexión del canal en lugar de reproducirse inmediatamente, de modo que el inicio de Discord/Telegram y la configuración de comandos nativos sigan respondiendo después de los reinicios.
- Los trabajos de una sola ejecución (`--at`) se eliminan automáticamente después de completarse correctamente de forma predeterminada.
- Las ejecuciones cron aisladas cierran, en la medida de lo posible, las pestañas/procesos de navegador rastreados para su sesión `cron:<jobId>` cuando la ejecución finaliza, de modo que la automatización de navegador desacoplada no deje procesos huérfanos.
- Las ejecuciones cron aisladas que reciben la concesión limitada de autolimpieza de cron aún pueden leer el estado del programador, una lista autofíltrada de su trabajo actual y el historial de ejecuciones de ese trabajo, de modo que las comprobaciones de estado/Heartbeat puedan inspeccionar su propia programación sin obtener acceso más amplio para mutar cron.
- Las ejecuciones cron aisladas también protegen contra respuestas de acuse de recibo obsoletas. Si el primer resultado es solo una actualización de estado provisional (`on it`, `pulling everything together` y pistas similares) y ninguna ejecución de subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a pedir una vez el resultado real antes de la entrega.
- Las ejecuciones cron aisladas usan metadatos estructurados de denegación de ejecución de la ejecución incrustada, incluidos envoltorios `UNAVAILABLE` de host de nodo cuyo mensaje de error anidado comienza con `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`, de modo que un comando bloqueado no se informe como una ejecución correcta mientras que la prosa ordinaria del asistente no se trate como una denegación.
- Las ejecuciones cron aisladas también tratan los errores de agente a nivel de ejecución como errores de trabajo incluso cuando no se produce ninguna carga de respuesta, de modo que los errores de modelo/proveedor incrementen los contadores de error y activen notificaciones de fallo en lugar de marcar el trabajo como correcto.
- Cuando un trabajo aislado de turno de agente alcanza `timeoutSeconds`, cron aborta la ejecución de agente subyacente y le da una breve ventana de limpieza. Si la ejecución no se vacía, la limpieza propiedad del Gateway libera por la fuerza la propiedad de sesión de esa ejecución antes de que cron registre el tiempo de espera agotado, de modo que el trabajo de chat en cola no quede detrás de una sesión de procesamiento obsoleta.
- Si un turno de agente aislado se detiene antes de que el ejecutor arranque o antes de la primera llamada al modelo, cron registra un tiempo de espera agotado específico de la fase, como `setup timed out before runner start` o `stalled before first model call (last phase: context-engine)`. Estos watchdogs cubren proveedores incrustados y proveedores respaldados por CLI antes de que su proceso CLI externo se inicie realmente, y tienen límites independientes de los valores largos de `timeoutSeconds` para que los fallos de arranque en frío/autenticación/contexto afloren rápido en lugar de esperar todo el presupuesto del trabajo.
- Si usas cron del sistema u otro programador externo para ejecutar `openclaw agent`, envuélvelo con una escalada de finalización forzada aunque la CLI gestione `SIGTERM`/`SIGINT`. Las ejecuciones respaldadas por el Gateway le piden al Gateway que aborte las ejecuciones aceptadas; las ejecuciones locales y de reserva incrustadas reciben la misma señal de aborto. Para GNU `timeout`, prefiere `timeout -k 60 600 openclaw agent ...` en lugar de `timeout 600 ...`; el valor `-k` es el respaldo del supervisor si el proceso no puede vaciarse. Para unidades systemd, conserva la misma forma usando una señal de detención `SIGTERM` más una ventana de gracia como `TimeoutStopSec` antes de cualquier finalización definitiva. Si un reintento reutiliza un `--run-id` mientras la ejecución original del Gateway sigue activa, el duplicado se informa como en curso en lugar de iniciar una segunda ejecución.

<a id="maintenance"></a>

<Note>
La reconciliación de tareas para cron pertenece primero al tiempo de ejecución y en segundo lugar está respaldada por historial durable: una tarea cron activa permanece viva mientras el tiempo de ejecución cron todavía rastrea ese trabajo como en ejecución, incluso si aún existe una fila antigua de sesión hija. Una vez que el tiempo de ejecución deja de poseer el trabajo y vence la ventana de gracia de 5 minutos, el mantenimiento comprueba los registros de ejecución persistidos y el estado del trabajo para la ejecución coincidente `cron:<jobId>:<startedAt>`. Si ese historial durable muestra un resultado terminal, el libro mayor de tareas se finaliza a partir de él; de lo contrario, el mantenimiento propiedad del Gateway puede marcar la tarea como `lost`. La auditoría CLI sin conexión puede recuperarse desde el historial durable, pero no trata su propio conjunto vacío de trabajos activos en proceso como prueba de que una ejecución cron propiedad del Gateway haya desaparecido.
</Note>

## Tipos de programación

| Tipo    | Marca de CLI | Descripción                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Marca de tiempo de una sola ejecución (ISO 8601 o relativa como `20m`)    |
| `every` | `--every` | Intervalo fijo                                          |
| `cron`  | `--cron`  | Expresión cron de 5 o 6 campos con `--tz` opcional |

Las marcas de tiempo sin zona horaria se tratan como UTC. Agrega `--tz America/New_York` para programación con hora local de pared.

Las expresiones recurrentes al inicio de la hora se escalonan automáticamente hasta 5 minutos para reducir picos de carga. Usa `--exact` para forzar una temporización precisa o `--stagger 30s` para una ventana explícita.

### Día del mes y día de la semana usan lógica OR

Las expresiones cron se analizan con [croner](https://github.com/Hexagon/croner). Cuando tanto los campos de día del mes como de día de la semana no son comodines, croner coincide cuando **cualquiera** de los campos coincide, no ambos. Este es el comportamiento estándar de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se dispara unas 5-6 veces al mes en lugar de 0-1 veces al mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para exigir ambas condiciones, usa el modificador de día de la semana `+` de Croner (`0 9 15 * +1`) o programa en un campo y protege el otro en el prompt o comando de tu trabajo.

## Estilos de ejecución

| Estilo           | Valor de `--session`   | Se ejecuta en                  | Ideal para                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesión principal    | `main`              | Carril dedicado de activación cron | Recordatorios, eventos del sistema        |
| Aislado        | `isolated`          | `cron:<jobId>` dedicado | Informes, tareas en segundo plano      |
| Sesión actual | `current`           | Vinculada en el momento de creación   | Trabajo recurrente consciente del contexto    |
| Sesión personalizada  | `session:custom-id` | Sesión nombrada persistente | Flujos de trabajo que se basan en el historial |

<AccordionGroup>
  <Accordion title="Sesión principal frente a aislada frente a personalizada">
    Los trabajos de **sesión principal** encolan un evento del sistema en un carril de ejecución propiedad de cron y, opcionalmente, despiertan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Pueden usar el último contexto de entrega de la sesión principal de destino para las respuestas, pero no agregan turnos cron rutinarios al carril de chat humano ni extienden la frescura del restablecimiento diario/por inactividad para la sesión de destino. Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) persisten el contexto entre ejecuciones, lo que habilita flujos de trabajo como reuniones diarias que se basan en resúmenes anteriores.

    Los eventos cron de sesión principal son recordatorios autónomos de eventos del sistema. No
    incluyen automáticamente la instrucción "Read
    HEARTBEAT.md" del prompt predeterminado de Heartbeat. Si un recordatorio recurrente debe consultar
    `HEARTBEAT.md`, dilo explícitamente en el texto del evento cron o en las
    propias instrucciones del agente.

  </Accordion>
  <Accordion title="Qué significa 'sesión nueva' para trabajos aislados">
    Para trabajos aislados, "sesión nueva" significa un id de transcripción/sesión nuevo para cada ejecución. OpenClaw puede trasladar preferencias seguras como ajustes de pensamiento/rápido/detallado, etiquetas y anulaciones explícitas de modelo/autenticación seleccionadas por el usuario, pero no hereda contexto ambiental de conversación de una fila cron anterior: enrutamiento de canal/grupo, política de envío o cola, elevación, origen o vinculación de tiempo de ejecución ACP. Usa `current` o `session:<id>` cuando un trabajo recurrente deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Limpieza en tiempo de ejecución">
    Para trabajos aislados, el desmontaje en tiempo de ejecución ahora incluye limpieza de navegador, en la medida de lo posible, para esa sesión cron. Los fallos de limpieza se ignoran para que el resultado cron real siga prevaleciendo.

    Las ejecuciones cron aisladas también desechan cualquier instancia de tiempo de ejecución MCP incluida creada para el trabajo mediante la ruta compartida de limpieza en tiempo de ejecución. Esto coincide con cómo se desmontan los clientes MCP de sesión principal y sesión personalizada, de modo que los trabajos cron aislados no filtren procesos hijos stdio ni conexiones MCP de larga duración entre ejecuciones.

  </Accordion>
  <Accordion title="Entrega de subagente y Discord">
    Cuando las ejecuciones cron aisladas orquestan subagentes, la entrega también prefiere la salida final descendiente sobre el texto provisional obsoleto del padre. Si los descendientes siguen en ejecución, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

    Para destinos de anuncio de Discord solo de texto, OpenClaw envía el texto final canónico del asistente una vez en lugar de reproducir tanto las cargas de texto transmitidas/intermedias como la respuesta final. Las cargas multimedia y estructuradas de Discord aún se entregan como cargas separadas para que los adjuntos y componentes no se descarten.

  </Accordion>
</AccordionGroup>

### Cargas de comando

Usa cargas de comando para scripts deterministas que deban ejecutarse dentro del programador del Gateway sin iniciar un turno de agente aislado respaldado por modelo. Los trabajos de comando se ejecutan en el host del Gateway, capturan stdout/stderr, registran la ejecución en el historial de cron y reutilizan los mismos modos de entrega `announce`, `webhook` y `none` que los trabajos aislados.

<Note>
Command cron es una superficie de automatización del Gateway para operador administrador, no una llamada
`tools.exec` de agente. Crear, actualizar, eliminar o ejecutar manualmente trabajos cron
requiere `operator.admin`; las ejecuciones de comando programadas se ejecutan después dentro del
proceso del Gateway como esa automatización creada por el administrador. La política de exec de agente, como
`tools.exec.mode`, los prompts de aprobación y las listas de permisos de herramientas por agente, rige
las herramientas exec visibles para el modelo, no las cargas command cron.
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

Si stdout no está vacío, ese texto es el resultado entregado. Si stdout está vacío y stderr no está vacío, se entrega stderr. Si ambos flujos están presentes, cron entrega un pequeño bloque `stdout:` / `stderr:`. Un código de salida cero registra la ejecución como `ok`; una salida distinta de cero, una señal, un timeout o un timeout sin salida registra `error` y puede activar alertas de fallo. Un comando que imprime solo `NO_REPLY` usa la supresión normal de token silencioso de cron y no publica nada de vuelta en el chat.

### Opciones de carga para trabajos aislados

<ParamField path="--message" type="string" required>
  Texto del prompt (obligatorio para aislado).
</ParamField>
<ParamField path="--model" type="string">
  Anulación de modelo; usa el modelo permitido seleccionado para el trabajo.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos fallback por trabajo, por ejemplo `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Pasa `--fallbacks ""` para una ejecución estricta sin fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  En `cron edit`, elimina la anulación de fallbacks por trabajo para que el trabajo siga la precedencia de fallbacks configurada. No se puede combinar con `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  En `cron edit`, elimina la anulación de modelo por trabajo para que el trabajo siga la precedencia normal de selección de modelo de cron (una anulación almacenada de sesión cron si está definida; de lo contrario, el modelo del agente/predeterminado). No se puede combinar con `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Anulación del nivel de razonamiento.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omite la inyección del archivo de arranque del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe qué herramientas puede usar el trabajo, por ejemplo `--tools exec,read`.
</ParamField>

`--model` usa el modelo permitido seleccionado como modelo principal de ese trabajo. No es lo mismo que una anulación `/model` de sesión de chat: las cadenas de fallback configuradas siguen aplicándose cuando falla el modelo principal del trabajo. Si el modelo solicitado no está permitido o no se puede resolver, cron falla la ejecución con un error de validación explícito en lugar de volver silenciosamente a la selección de modelo del agente/predeterminado del trabajo.

Los trabajos de cron también pueden llevar `fallbacks` a nivel de carga. Cuando está presente, esa lista reemplaza la cadena de fallbacks configurada para el trabajo. Usa `fallbacks: []` en la carga/API del trabajo cuando quieras una ejecución de cron estricta que pruebe solo el modelo seleccionado. Si un trabajo tiene `--model` pero no tiene fallbacks en la carga ni configurados, OpenClaw pasa una anulación explícita de fallback vacía para que el modelo principal del agente no se agregue como destino oculto de reintento adicional.

Las comprobaciones previas de proveedor local recorren los fallbacks configurados antes de marcar una ejecución de cron como `skipped`; `fallbacks: []` mantiene estricta esa ruta de comprobación previa.

La precedencia de selección de modelo para trabajos aislados es:

1. Anulación de modelo del hook de Gmail (cuando la ejecución proviene de Gmail y esa anulación está permitida)
2. `model` de la carga por trabajo
3. Anulación almacenada del modelo de sesión cron seleccionado por el usuario
4. Selección de modelo del agente/predeterminado

El modo rápido también sigue la selección en vivo resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, cron aislado la usa de forma predeterminada. Una anulación almacenada de sesión `fastMode` sigue prevaleciendo sobre la configuración en cualquier dirección. El modo automático usa el corte `params.fastAutoOnSeconds` del modelo seleccionado cuando está presente; el valor predeterminado es 60 segundos.

Si una ejecución aislada alcanza una transferencia de cambio de modelo en vivo, cron reintenta con el proveedor/modelo cambiado y persiste esa selección en vivo para la ejecución activa antes de reintentar. Cuando el cambio también lleva un nuevo perfil de autenticación, cron también persiste esa anulación de perfil de autenticación para la ejecución activa. Los reintentos están acotados: después del intento inicial más 2 reintentos de cambio, cron aborta en lugar de entrar en un bucle infinito.

Antes de que una ejecución de cron aislada entre en el ejecutor del agente, OpenClaw comprueba los endpoints de proveedor local alcanzables para proveedores configurados `api: "ollama"` y `api: "openai-completions"` cuyo `baseUrl` sea loopback, de red privada o `.local`. Si ese endpoint está caído, la ejecución se registra como `skipped` con un error claro de proveedor/modelo en lugar de iniciar una llamada de modelo. El resultado del endpoint se almacena en caché durante 5 minutos, de modo que muchos trabajos vencidos que usan el mismo servidor local Ollama, vLLM, SGLang o LM Studio caído comparten una pequeña sonda en lugar de crear una tormenta de solicitudes. Las ejecuciones omitidas por comprobación previa del proveedor no incrementan el backoff de error de ejecución; habilita `failureAlert.includeSkipped` cuando quieras notificaciones repetidas de omisión.

## Entrega y salida

| Modo       | Qué ocurre                                                           |
| ---------- | -------------------------------------------------------------------- |
| `announce` | Entrega fallback del texto final al destino si el agente no lo envió |
| `webhook`  | Envía por POST la carga del evento finalizado a una URL              |
| `none`     | Sin entrega fallback del ejecutor                                    |

Usa `--announce --channel telegram --to "-1001234567890"` para la entrega al canal. Para temas de foro de Telegram, usa `-1001234567890:topic:123`; OpenClaw también acepta la forma abreviada propiedad de Telegram `-1001234567890:123`. Los llamadores directos de RPC/config pueden pasar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`). Los ID de sala de Matrix distinguen entre mayúsculas y minúsculas; usa el ID exacto de sala o la forma `room:!room:server` de Matrix.

Cuando la entrega announce usa `channel: "last"` u omite `channel`, un destino con prefijo de proveedor como `telegram:123` puede seleccionar el canal antes de que cron recurra al historial de sesión o a un único canal configurado. Solo los prefijos anunciados por el plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo de destino debe nombrar el mismo proveedor; por ejemplo, `channel: "whatsapp"` con `to: "telegram:123"` se rechaza en lugar de permitir que WhatsApp interprete el ID de Telegram como un número de teléfono. Los prefijos de tipo de destino y servicio como `channel:<id>`, `user:<id>`, `imessage:<handle>` y `sms:<number>` siguen siendo sintaxis de destino propiedad del canal, no selectores de proveedor.

Para trabajos aislados, la entrega de chat se comparte. Si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso cuando el trabajo usa `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el announce fallback. De lo contrario, `announce`, `webhook` y `none` solo controlan qué hace el ejecutor con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino de entrega en vivo preservado para la ruta announce fallback. Las claves internas de sesión pueden estar en minúsculas; los destinos de entrega del proveedor no se reconstruyen a partir de esas claves cuando el contexto de chat actual está disponible.

La entrega announce implícita usa listas de permitidos de canales configuradas para validar y redirigir destinos obsoletos. Las aprobaciones del almacén de emparejamiento de DM no son destinatarios de automatización fallback; define `delivery.to` o configura la entrada `allowFrom` del canal cuando un trabajo programado deba enviar proactivamente a un DM.

## Idioma de salida

Los trabajos de cron no infieren un idioma de respuesta a partir del canal, la configuración regional ni mensajes anteriores. Coloca la regla de idioma en el mensaje o la plantilla programados:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Para archivos de plantilla, mantén la instrucción de idioma en el prompt renderizado y verifica que los placeholders como `{{language}}` estén completados antes de que se ejecute el trabajo. Si la salida mezcla idiomas, haz explícita la regla, por ejemplo: "Usa chino para el texto narrativo y conserva los términos técnicos en inglés."

Las notificaciones de fallo siguen una ruta de destino separada:

- `cron.failureDestination` define un valor predeterminado global para las notificaciones de fallo.
- `job.delivery.failureDestination` lo anula por trabajo.
- Si ninguno está definido y el trabajo ya entrega mediante `announce`, las notificaciones de fallo ahora recurren a ese destino announce principal.
- `delivery.failureDestination` solo se admite en trabajos `sessionTarget="isolated"` salvo que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` incluye un trabajo o una política global de alerta de cron en alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador separado de omisiones consecutivas, por lo que no afectan al backoff de errores de ejecución.

## Ejemplos de CLI

<Tabs>
  <Tab title="Recordatorio de una sola vez">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Trabajo aislado recurrente">
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
  <Tab title="Anulación de modelo y razonamiento">
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
  <Tab title="Salida de Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Salida de comando">
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

Gateway puede exponer endpoints Webhook HTTP para disparadores externos. Habilítalo en la configuración:

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

Cada solicitud debe incluir el token del hook mediante encabezado:

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
    Ejecuta un turno de agente aislado:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Campos: `message` (obligatorio), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hooks asignados (POST /hooks/<name>)">
    Los nombres de hooks personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas arbitrarias en acciones `wake` o `agent` con plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantén los endpoints de hook detrás de loopback, tailnet o un proxy inverso de confianza.

- Usa un token de hook dedicado; no reutilices tokens de autenticación de Gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Define `hooks.allowedAgentIds` para limitar a qué agente efectivo puede dirigirse un hook, incluido el agente predeterminado cuando se omite `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` salvo que necesites sesiones seleccionadas por el llamador.
- Si habilitas `hooks.allowRequestSessionKey`, define también `hooks.allowedSessionKeyPrefixes` para restringir las formas de clave de sesión permitidas.
- Las cargas de hooks se envuelven con límites de seguridad de forma predeterminada.

</Warning>

## Integración de Gmail PubSub

Conecta los disparadores de la bandeja de entrada de Gmail a OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados, Tailscale para el endpoint HTTPS público.
</Note>

### Configuración con asistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el preset de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático del Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está configurado, el Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la supervisión. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desactivarlo.

### Configuración manual de una sola vez

<Steps>
  <Step title="Seleccionar el proyecto de GCP">
    Selecciona el proyecto de GCP que posee el cliente OAuth usado por `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Crear el tema y conceder acceso push a Gmail">
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

`openclaw cron run <jobId>` devuelve el control después de poner en cola la ejecución manual. Usa `--wait` para hooks de apagado, scripts de mantenimiento u otra automatización que deba bloquearse hasta que termine la ejecución en cola. El modo de espera sondea el `runId` exacto devuelto; sale con `0` para el estado `ok` y con un valor distinto de cero para `error`, `skipped` o un timeout de espera.

La herramienta `cron` del agente devuelve resúmenes compactos de trabajos (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) desde `cron(action: "list")`; usa `cron(action: "get", jobId: "...")` para obtener una definición completa de un trabajo. Los llamadores directos del Gateway pueden pasar `compact: true` a `cron.list`; omitirlo conserva la respuesta completa existente con vistas previas de entrega.

`openclaw cron create` es un alias de `openclaw cron add`, y los trabajos nuevos pueden usar una programación posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` o una marca de tiempo ISO) seguida de un prompt posicional del agente. Usa `--webhook <url>` en `cron add|create` o `cron edit` para enviar mediante POST la carga útil de la ejecución finalizada a un endpoint HTTP. La entrega por Webhook no puede combinarse con flags de entrega por chat como `--announce`, `--channel`, `--to`, `--thread-id` o `--account`. En `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account` desconfiguran esos campos de enrutamiento individualmente (cada uno se rechaza junto con su flag de configuración correspondiente), lo cual es distinto de que `--no-deliver` deshabilite la entrega de reserva del ejecutor.

<Note>
Nota sobre la anulación del modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido o no se puede resolver, Cron falla la ejecución con un error de validación explícito.
- Los parches de carga útil de la API `cron.update` pueden establecer `model: null` para borrar una anulación de modelo almacenada en el trabajo.
- `openclaw cron edit <job-id> --clear-model` borra esa anulación desde la CLI (el mismo efecto que el parche `model: null`) y no puede combinarse con `--model`.
- Las cadenas de reserva configuradas siguen aplicándose porque `--model` de Cron es un modelo primario de trabajo, no una anulación de sesión `/model`.
- `openclaw cron add|edit --fallbacks ...` establece la carga útil `fallbacks`, reemplazando las reservas configuradas para ese trabajo; `--fallbacks ""` deshabilita la reserva y hace que la ejecución sea estricta. `openclaw cron edit <job-id> --clear-fallbacks` borra la anulación por trabajo.
- Un `--model` simple sin una lista de reserva explícita o configurada no recurre al modelo primario del agente como destino adicional silencioso de reintento.

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

`maxConcurrentRuns` limita tanto el envío programado de Cron como la ejecución de turnos aislados de agente, y su valor predeterminado es 8. Los turnos aislados de agente de Cron usan internamente el carril de ejecución dedicado `cron-nested` de la cola, por lo que aumentar este valor permite que ejecuciones LLM independientes de Cron avancen en paralelo en lugar de iniciar solo sus contenedores externos de Cron. Este ajuste no amplía el carril compartido no Cron `nested`.

`cron.store` es una clave lógica de almacenamiento y una ruta de importación heredada para doctor. Ejecuta `openclaw doctor --fix` para importar almacenes JSON existentes a SQLite y archivarlos; los cambios futuros de Cron deben pasar por la CLI o la API del Gateway.

Deshabilitar Cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamiento de reintento">
    **Reintento único**: los errores transitorios (límite de tasa, sobrecarga, red, error del servidor) se reintentan hasta 3 veces con retroceso exponencial. Los errores permanentes se deshabilitan de inmediato.

    **Reintento recurrente**: retroceso exponencial (de 30 s a 60 min) entre reintentos. El retroceso se restablece después de la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Mantenimiento">
    `cron.sessionRetention` (predeterminado `24h`) depura entradas de sesiones de ejecución aisladas. `cron.runLog.keepLines` limita las filas de historial de ejecución de SQLite retenidas por trabajo; `maxBytes` se conserva por compatibilidad de configuración con registros de ejecución antiguos respaldados por archivos.
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
    - `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y que el trabajo aún no vencía.

  </Accordion>
  <Accordion title="Cron se disparó, pero no hubo entrega">
    - El modo de entrega `none` significa que no se espera ningún envío de reserva del ejecutor. El agente aún puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
    - Si falta el destino de entrega o no es válido (`channel`/`to`), el envío saliente se omitió.
    - En Matrix, los trabajos copiados o heredados con IDs de sala `delivery.to` en minúsculas pueden fallar porque los IDs de sala de Matrix distinguen mayúsculas y minúsculas. Edita el trabajo con el valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que las credenciales bloquearon la entrega.
    - Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y también suprime la ruta de resumen en cola de reserva, por lo que no se publica nada de vuelta en el chat.
    - Si el agente debe enviar un mensaje al usuario por sí mismo, comprueba que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat previo, o un canal/destino explícito).

  </Accordion>
  <Accordion title="Cron o Heartbeat parecen impedir la rotación de estilo /new">
    - La frescura del restablecimiento diario y por inactividad no se basa en `updatedAt`; consulta [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Las activaciones de Cron, ejecuciones de Heartbeat, notificaciones de exec y la contabilidad del gateway pueden actualizar la fila de sesión para enrutamiento/estado, pero no extienden `sessionStartedAt` ni `lastInteractionAt`.
    - Para filas heredadas creadas antes de que esos campos existieran, OpenClaw puede recuperar `sessionStartedAt` del encabezado de sesión del transcript JSONL cuando el archivo todavía está disponible. Las filas heredadas inactivas sin `lastInteractionAt` usan esa hora de inicio recuperada como su base de inactividad.

  </Accordion>
  <Accordion title="Consideraciones de zona horaria">
    - Cron sin `--tz` usa la zona horaria del host del gateway.
    - Las programaciones `at` sin zona horaria se tratan como UTC.
    - `activeHours` de Heartbeat usa la resolución de zona horaria configurada.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Automatización](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — libro mayor de tareas para ejecuciones de Cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de zona horaria
