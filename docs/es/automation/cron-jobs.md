---
read_when:
    - Programación de trabajos en segundo plano o activaciones
    - Integrar disparadores externos (webhooks, Gmail) en OpenClaw
    - Decidir entre heartbeat y cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Trabajos programados, Webhooks y activadores de PubSub de Gmail para el programador del Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-07-02T00:42:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el programador integrado de Gateway. Persiste trabajos, despierta al agente en el momento adecuado y puede entregar la salida de vuelta a un canal de chat o a un endpoint de Webhook.

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

## Cómo funciona Cron

- Cron se ejecuta **dentro del proceso de Gateway** (no dentro del modelo).
- Las definiciones de trabajos, el estado de ejecución y el historial de ejecuciones persisten en la base de datos SQLite de estado compartido de OpenClaw, de modo que los reinicios no pierdan programaciones.
- Al actualizar, ejecuta `openclaw doctor --fix` para importar los archivos heredados `~/.openclaw/cron/jobs.json`, `jobs-state.json` y `runs/*.jsonl` a SQLite y renombrarlos con el sufijo `.migrated`. Las filas de trabajos mal formadas se omiten en tiempo de ejecución y se copian a `jobs-quarantine.json` para reparación o revisión posterior.
- `cron.store` sigue nombrando la clave lógica del almacén de cron y la ruta de importación de doctor. Después de la importación, editar ese archivo JSON ya no cambia los trabajos de cron activos; usa `openclaw cron add|edit|remove` o los métodos RPC de cron de Gateway.
- Todas las ejecuciones de cron crean registros de [tarea en segundo plano](/es/automation/tasks).
- Al iniciar Gateway, los trabajos aislados atrasados de turnos de agente se reprograman fuera de la ventana de conexión del canal en lugar de reproducirse de inmediato, por lo que el inicio de Discord/Telegram y la configuración de comandos nativos se mantienen responsivos tras los reinicios.
- Los trabajos de una sola ejecución (`--at`) se eliminan automáticamente después de completarse correctamente de forma predeterminada.
- Las ejecuciones aisladas de cron cierran, con el mejor esfuerzo, pestañas/procesos de navegador rastreados para su sesión `cron:<jobId>` cuando se completa la ejecución, para que la automatización de navegador separada no deje procesos huérfanos.
- Las ejecuciones aisladas de cron que reciben la concesión estrecha de autolimpieza de cron todavía pueden leer el estado del programador, una lista autofiltada de su trabajo actual y el historial de ejecuciones de ese trabajo, para que las comprobaciones de estado/Heartbeat puedan inspeccionar su propia programación sin obtener acceso más amplio para mutar cron.
- Las ejecuciones aisladas de cron también protegen contra respuestas de confirmación obsoletas. Si el primer resultado es solo una actualización de estado provisional (`on it`, `pulling everything together` e indicios similares) y ninguna ejecución de subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de la entrega.
- Las ejecuciones aisladas de cron usan metadatos estructurados de denegación de ejecución de la ejecución incrustada, incluidos contenedores `UNAVAILABLE` de host de Node cuyo mensaje de error anidado empieza por `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`, por lo que un comando bloqueado no se informa como una ejecución correcta mientras que la prosa ordinaria del asistente no se trata como una denegación.
- Las ejecuciones aisladas de cron también tratan los fallos de agente a nivel de ejecución como errores del trabajo incluso cuando no se produce una carga de respuesta, de modo que los fallos de modelo/proveedor incrementen los contadores de error y activen notificaciones de fallo en lugar de marcar el trabajo como correcto.
- Cuando un trabajo aislado de turno de agente alcanza `timeoutSeconds`, cron aborta la ejecución de agente subyacente y le da una breve ventana de limpieza. Si la ejecución no se drena, la limpieza propiedad de Gateway fuerza la liberación de la propiedad de sesión de esa ejecución antes de que cron registre el tiempo de espera, para que el trabajo de chat en cola no quede detrás de una sesión de procesamiento obsoleta.
- Si un turno de agente aislado se bloquea antes de que se inicie el ejecutor o antes de la primera llamada al modelo, cron registra un tiempo de espera específico de fase, como `setup timed out before runner start` o `stalled before first model call (last phase: context-engine)`. Estos watchdogs cubren proveedores incrustados y proveedores respaldados por CLI antes de que su proceso CLI externo se inicie realmente, y se limitan de forma independiente respecto de valores largos de `timeoutSeconds` para que los fallos de arranque en frío/autenticación/contexto afloren rápidamente en lugar de esperar todo el presupuesto del trabajo.
- Si usas cron del sistema u otro programador externo para ejecutar `openclaw agent`, envuélvelo con una escalada de terminación forzosa aunque la CLI gestione `SIGTERM`/`SIGINT`. Las ejecuciones respaldadas por Gateway piden a Gateway que aborte las ejecuciones aceptadas; las ejecuciones locales y de reserva incrustadas reciben la misma señal de aborto. Para GNU `timeout`, prefiere `timeout -k 60 600 openclaw agent ...` en lugar de `timeout 600 ...`; el valor `-k` es el respaldo del supervisor si el proceso no puede drenarse. Para unidades systemd, conserva la misma forma usando una señal de detención `SIGTERM` más una ventana de gracia como `TimeoutStopSec` antes de cualquier terminación final. Si un reintento reutiliza un `--run-id` mientras la ejecución original de Gateway sigue activa, el duplicado se informa como en curso en lugar de iniciar una segunda ejecución.

<a id="maintenance"></a>

<Note>
La reconciliación de tareas para cron es primero propiedad del runtime y segundo respaldada por historial duradero: una tarea de cron activa permanece viva mientras el runtime de cron aún rastree ese trabajo como en ejecución, incluso si todavía existe una fila antigua de sesión hija. Una vez que el runtime deja de ser dueño del trabajo y expira la ventana de gracia de 5 minutos, el mantenimiento revisa los registros de ejecución persistidos y el estado del trabajo para la ejecución coincidente `cron:<jobId>:<startedAt>`. Si ese historial duradero muestra un resultado terminal, el libro mayor de tareas se finaliza a partir de él; de lo contrario, el mantenimiento propiedad de Gateway puede marcar la tarea como `lost`. La auditoría CLI sin conexión puede recuperarse desde el historial duradero, pero no trata su propio conjunto vacío de trabajos activos en proceso como prueba de que una ejecución de cron propiedad de Gateway haya desaparecido.
</Note>

## Tipos de programación

| Tipo    | Flag de CLI | Descripción                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Marca de tiempo de una sola ejecución (ISO 8601 o relativa como `20m`) |
| `every` | `--every` | Intervalo fijo                                          |
| `cron`  | `--cron`  | Expresión cron de 5 o 6 campos con `--tz` opcional |

Las marcas de tiempo sin zona horaria se tratan como UTC. Agrega `--tz America/New_York` para programar según la hora local de pared.

Las expresiones recurrentes al inicio de la hora se escalonan automáticamente hasta 5 minutos para reducir picos de carga. Usa `--exact` para forzar una sincronización precisa o `--stagger 30s` para una ventana explícita.

### El día del mes y el día de la semana usan lógica OR

Las expresiones Cron son analizadas por [croner](https://github.com/Hexagon/croner). Cuando tanto los campos de día del mes como de día de la semana no son comodines, croner coincide cuando **cualquiera** de los campos coincide, no ambos. Este es el comportamiento estándar de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se dispara unas 5-6 veces al mes en lugar de 0-1 veces al mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para exigir ambas condiciones, usa el modificador de día de la semana `+` de Croner (`0 9 15 * +1`) o programa sobre un campo y protege el otro en el prompt o comando del trabajo.

## Estilos de ejecución

| Estilo           | Valor de `--session` | Se ejecuta en                  | Ideal para                       |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| Sesión principal | `main`              | Carril dedicado de despertar de cron | Recordatorios, eventos del sistema |
| Aislado        | `isolated`          | `cron:<jobId>` dedicado | Informes, tareas en segundo plano |
| Sesión actual | `current`           | Ejecución de cron separada | Trabajo recurrente consciente del contexto |
| Sesión personalizada | `session:custom-id` | Ejecución de cron separada | Apuntar a un chat/sesión conocido |

<AccordionGroup>
  <Accordion title="Sesión principal frente a aislada frente a personalizada">
    Los trabajos de **sesión principal** encolan un evento del sistema en un carril de ejecución propiedad de cron y, opcionalmente, despiertan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Pueden usar el último contexto de entrega de la sesión principal de destino para las respuestas, pero no agregan turnos rutinarios de cron al carril de chat humano y no extienden la frescura de reinicio diario/inactivo de la sesión de destino. Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Los trabajos de sesión **actual** y **personalizada** (`current`, `session:xxx`) pueden usar el chat/sesión seleccionado para el contexto de entrega y la siembra segura de preferencias, pero cada ejecución sigue ejecutándose en una sesión de cron separada para que el trabajo programado no bloquee ni contamine la transcripción de la conversación en vivo.

    Los eventos de cron de sesión principal son recordatorios de eventos del sistema autocontenidos. No
    incluyen automáticamente la instrucción "Read
    HEARTBEAT.md" del prompt predeterminado de Heartbeat. Si un recordatorio recurrente debe consultar
    `HEARTBEAT.md`, dilo explícitamente en el texto del evento de cron o en las
    instrucciones propias del agente.

  </Accordion>
  <Accordion title="Qué significa 'sesión nueva' para trabajos separados">
    Para trabajos aislados, de sesión actual y de sesión personalizada, "sesión nueva" significa un nuevo id de transcripción/sesión para cada ejecución. OpenClaw puede transportar preferencias seguras como configuraciones de thinking/fast/verbose, etiquetas y anulaciones explícitas de modelo/autenticación seleccionadas por el usuario. Las ejecuciones separadas no heredan contexto de conversación ambiental de una fila de cron anterior: enrutamiento de canal/grupo, política de envío o cola, elevación, origen o vinculación de runtime ACP. Coloca el estado duradero de trabajo recurrente en el prompt, archivos del workspace, herramientas o el sistema sobre el que opera el trabajo, en lugar de depender de una transcripción de chat en vivo como memoria de cron.
  </Accordion>
  <Accordion title="Limpieza de runtime">
    Para trabajos aislados, el desmontaje del runtime ahora incluye limpieza de navegador con el mejor esfuerzo para esa sesión de cron. Los fallos de limpieza se ignoran para que el resultado real de cron siga prevaleciendo.

    Las ejecuciones aisladas de cron también desechan cualquier instancia de runtime MCP empaquetada creada para el trabajo a través de la ruta compartida de limpieza de runtime. Esto coincide con cómo se desmontan los clientes MCP de sesión principal y sesión personalizada, de modo que los trabajos aislados de cron no filtren procesos hijos stdio ni conexiones MCP de larga duración entre ejecuciones.

  </Accordion>
  <Accordion title="Entrega de subagente y Discord">
    Cuando las ejecuciones aisladas de cron orquestan subagentes, la entrega también prefiere la salida final del descendiente sobre texto provisional obsoleto del padre. Si los descendientes siguen ejecutándose, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

    Para destinos de anuncio de Discord solo de texto, OpenClaw envía una vez el texto final canónico del asistente en lugar de reproducir tanto las cargas de texto transmitidas/intermedias como la respuesta final. Las cargas de medios y estructuradas de Discord siguen entregándose como cargas separadas para que los adjuntos y componentes no se descarten.

  </Accordion>
</AccordionGroup>

### Cargas de comandos

Usa cargas de comandos para scripts deterministas que deben ejecutarse dentro del programador de Gateway sin iniciar un turno de agente aislado respaldado por modelo. Los trabajos de comando se ejecutan en el host de Gateway, capturan stdout/stderr, registran la ejecución en el historial de cron y reutilizan los mismos modos de entrega `announce`, `webhook` y `none` que los trabajos aislados.

<Note>
Cron de comandos es una superficie de automatización Gateway de administrador-operador, no una llamada
`tools.exec` de agente. Crear, actualizar, eliminar o ejecutar manualmente trabajos de cron
requiere `operator.admin`; las ejecuciones programadas de comandos se ejecutan después dentro del
proceso de Gateway como esa automatización creada por el administrador. La política de exec de agente, como
`tools.exec.mode`, los prompts de aprobación y las listas de permisos de herramientas por agente gobiernan
las herramientas exec visibles para el modelo, no las cargas de cron de comandos.
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

Si stdout no está vacío, ese texto es el resultado entregado. Si stdout está vacío y stderr no lo está, se entrega stderr. Si ambos flujos están presentes, cron entrega un pequeño bloque `stdout:` / `stderr:`. Un código de salida cero registra la ejecución como `ok`; una salida distinta de cero, una señal, un tiempo de espera agotado o un tiempo de espera agotado sin salida registran `error` y pueden activar alertas de fallo. Un comando que imprime solo `NO_REPLY` usa la supresión normal del token silencioso de cron y no publica nada de vuelta en el chat.

### Opciones de carga útil para trabajos aislados

<ParamField path="--message" type="string" required>
  Texto del prompt (obligatorio para aislado).
</ParamField>
<ParamField path="--model" type="string">
  Sustitución del modelo; usa el modelo permitido seleccionado para el trabajo.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos alternativos por trabajo, por ejemplo `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Pasa `--fallbacks ""` para una ejecución estricta sin alternativas.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  En `cron edit`, elimina la sustitución de alternativas por trabajo para que el trabajo siga la precedencia de alternativas configurada. No se puede combinar con `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  En `cron edit`, elimina la sustitución del modelo por trabajo para que el trabajo siga la precedencia normal de selección de modelo de cron (una sustitución almacenada de sesión de cron si está definida; de lo contrario, el modelo del agente/predeterminado). No se puede combinar con `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Sustitución del nivel de razonamiento.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  En `cron edit`, elimina la sustitución de razonamiento por trabajo para que el trabajo siga la precedencia normal de razonamiento de cron. No se puede combinar con `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omite la inyección de archivos de arranque del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe qué herramientas puede usar el trabajo, por ejemplo `--tools exec,read`.
</ParamField>

`--model` usa el modelo permitido seleccionado como modelo principal de ese trabajo. No es lo mismo que una sustitución `/model` de sesión de chat: las cadenas de alternativas configuradas siguen aplicándose cuando falla el modelo principal del trabajo. Si el modelo solicitado no está permitido o no se puede resolver, cron falla la ejecución con un error de validación explícito en lugar de volver silenciosamente a la selección de modelo del agente/predeterminado del trabajo.

Los trabajos de Cron también pueden incluir `fallbacks` a nivel de carga útil. Cuando está presente, esa lista reemplaza la cadena de alternativas configurada para el trabajo. Usa `fallbacks: []` en la carga útil/API del trabajo cuando quieras una ejecución de cron estricta que pruebe solo el modelo seleccionado. Si un trabajo tiene `--model` pero no tiene alternativas ni de carga útil ni configuradas, OpenClaw pasa una sustitución explícita de alternativas vacía para que el modelo principal del agente no se añada como un destino de reintento oculto adicional.

Las comprobaciones previas de proveedores locales recorren las alternativas configuradas antes de marcar una ejecución de cron como `skipped`; `fallbacks: []` mantiene estricta esa ruta de comprobación previa.

La precedencia de selección de modelo para trabajos aislados es:

1. Sustitución del modelo del hook de Gmail (cuando la ejecución vino de Gmail y esa sustitución está permitida)
2. `model` de la carga útil por trabajo
3. Sustitución almacenada de modelo de sesión de cron seleccionada por el usuario
4. Selección de modelo del agente/predeterminado

El modo rápido también sigue la selección activa resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, cron aislado la usa de forma predeterminada. Una sustitución `fastMode` de sesión almacenada sigue prevaleciendo sobre la configuración en cualquier dirección. El modo automático usa el umbral `params.fastAutoOnSeconds` del modelo seleccionado cuando está presente, con 60 segundos como valor predeterminado.

Si una ejecución aislada alcanza una transferencia de cambio de modelo en vivo, cron reintenta con el proveedor/modelo cambiado y conserva esa selección en vivo para la ejecución activa antes de reintentar. Cuando el cambio también incluye un nuevo perfil de autenticación, cron también conserva esa sustitución de perfil de autenticación para la ejecución activa. Los reintentos están acotados: después del intento inicial más 2 reintentos de cambio, cron aborta en lugar de entrar en un bucle indefinido.

Antes de que una ejecución de cron aislada entre en el ejecutor del agente, OpenClaw comprueba los endpoints alcanzables de proveedores locales para proveedores configurados con `api: "ollama"` y `api: "openai-completions"` cuyo `baseUrl` sea loopback, de red privada o `.local`. Si ese endpoint no está disponible, la ejecución se registra como `skipped` con un error claro de proveedor/modelo en lugar de iniciar una llamada de modelo. El resultado del endpoint se almacena en caché durante 5 minutos, así que muchos trabajos vencidos que usan el mismo servidor local Ollama, vLLM, SGLang o LM Studio inactivo comparten una pequeña prueba en lugar de crear una tormenta de solicitudes. Las ejecuciones omitidas por comprobación previa de proveedor no incrementan el retroceso por errores de ejecución; habilita `failureAlert.includeSkipped` cuando quieras notificaciones repetidas de omisión.

## Entrega y salida

| Modo       | Qué ocurre                                                           |
| ---------- | -------------------------------------------------------------------- |
| `announce` | Entrega alternativa del texto final al destino si el agente no envió |
| `webhook`  | Publica con POST la carga útil del evento terminado en una URL       |
| `none`     | Sin entrega alternativa del ejecutor                                 |

Usa `--announce --channel telegram --to "-1001234567890"` para entrega a canales. Para temas de foro de Telegram, usa `-1001234567890:topic:123`; OpenClaw también acepta la abreviatura propiedad de Telegram `-1001234567890:123`. Los llamadores directos de RPC/configuración pueden pasar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`). Los ID de sala de Matrix distinguen mayúsculas y minúsculas; usa el ID de sala exacto o la forma `room:!room:server` de Matrix.

Cuando la entrega de anuncio usa `channel: "last"` u omite `channel`, un destino con prefijo de proveedor como `telegram:123` puede seleccionar el canal antes de que cron recurra al historial de sesión o a un único canal configurado. Solo los prefijos anunciados por el Plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo del destino debe nombrar el mismo proveedor; por ejemplo, `channel: "whatsapp"` con `to: "telegram:123"` se rechaza en lugar de permitir que WhatsApp interprete el ID de Telegram como un número de teléfono. Los prefijos de tipo de destino y servicio como `channel:<id>`, `user:<id>`, `imessage:<handle>` y `sms:<number>` siguen siendo sintaxis de destino propiedad del canal, no selectores de proveedor.

Para trabajos aislados, la entrega de chat se comparte. Si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso cuando el trabajo usa `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el anuncio alternativo. De lo contrario, `announce`, `webhook` y `none` solo controlan qué hace el ejecutor con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino de entrega en vivo conservado para la ruta de anuncio alternativa. Las claves internas de sesión pueden estar en minúsculas; los destinos de entrega del proveedor no se reconstruyen a partir de esas claves cuando el contexto de chat actual está disponible.

La entrega de anuncio implícita usa listas de permitidos de canales configuradas para validar y redirigir destinos obsoletos. Las aprobaciones del almacén de emparejamiento de DM no son destinatarios de automatización alternativa; define `delivery.to` o configura la entrada `allowFrom` del canal cuando un trabajo programado deba enviar proactivamente a un DM.

## Idioma de salida

Los trabajos de Cron no infieren un idioma de respuesta a partir del canal, la configuración regional ni los mensajes anteriores. Pon la regla de idioma en el mensaje o la plantilla programados:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Para archivos de plantilla, mantén la instrucción de idioma en el prompt renderizado y verifica que los marcadores de posición como `{{language}}` estén rellenados antes de que se ejecute el trabajo. Si la salida mezcla idiomas, haz explícita la regla, por ejemplo: "Use Chinese for narrative text and keep technical terms in English."

Las notificaciones de fallo siguen una ruta de destino separada:

- `cron.failureDestination` define un valor predeterminado global para notificaciones de fallo.
- `job.delivery.failureDestination` lo sustituye por trabajo.
- Si ninguno está definido y el trabajo ya entrega mediante `announce`, las notificaciones de fallo ahora recurren a ese destino de anuncio principal.
- `delivery.failureDestination` solo se admite en trabajos `sessionTarget="isolated"` a menos que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` incluye un trabajo o una política global de alertas de cron en alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador consecutivo separado de omisiones, así que no afectan al retroceso por errores de ejecución.

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

Gateway puede exponer endpoints de Webhook HTTP para activadores externos. Habilítalo en la configuración:

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

Los tokens en cadenas de consulta se rechazan.

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
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Los nombres de hooks personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas útiles arbitrarias en acciones `wake` o `agent` con plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantén los endpoints de hook detrás de loopback, tailnet o un proxy inverso de confianza.

- Usa un token de hook dedicado; no reutilices tokens de autenticación del gateway.
- Mantén `hooks.path` en una subruta dedicada; se rechaza `/`.
- Configura `hooks.allowedAgentIds` para limitar a qué agente efectivo puede dirigirse un hook, incluido el agente predeterminado cuando se omite `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` salvo que necesites sesiones seleccionadas por el llamador.
- Si habilitas `hooks.allowRequestSessionKey`, configura también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de las claves de sesión.
- Las cargas útiles de hook se envuelven con límites de seguridad de forma predeterminada.

</Warning>

## Integración de Gmail PubSub

Conecta los disparadores de la bandeja de entrada de Gmail con OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados, Tailscale para el endpoint HTTPS público.
</Note>

### Configuración guiada (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el preajuste de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático del Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está configurado, el Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la vigilancia. Configura `OPENCLAW_SKIP_GMAIL_WATCHER=1` para excluirte.

### Configuración manual de una sola vez

<Steps>
  <Step title="Select the GCP project">
    Selecciona el proyecto de GCP propietario del cliente OAuth usado por `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
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

`openclaw cron run <jobId>` vuelve después de poner en cola la ejecución manual. Usa `--wait` para hooks de apagado, scripts de mantenimiento u otra automatización que deba bloquearse hasta que termine la ejecución en cola. El modo de espera sondea el `runId` exacto devuelto; sale con `0` para el estado `ok` y con un valor distinto de cero para `error`, `skipped` o un tiempo de espera agotado.

La herramienta de agente `cron` devuelve resúmenes compactos de trabajos (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) desde `cron(action: "list")`; usa `cron(action: "get", jobId: "...")` para obtener una definición completa de un trabajo. Los llamadores directos del Gateway pueden pasar `compact: true` a `cron.list`; omitirlo conserva la respuesta completa existente con vistas previas de entrega.

`openclaw cron create` es un alias de `openclaw cron add`, y los trabajos nuevos pueden usar una programación posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` o una marca de tiempo ISO) seguida de un prompt de agente posicional. Usa `--webhook <url>` en `cron add|create` o `cron edit` para enviar por POST la carga útil de la ejecución terminada a un endpoint HTTP. La entrega de Webhook no se puede combinar con marcas de entrega por chat como `--announce`, `--channel`, `--to`, `--thread-id` o `--account`. En `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account` desconfiguran esos campos de enrutamiento individualmente (cada uno se rechaza junto con su marca de configuración correspondiente), lo cual es distinto de que `--no-deliver` deshabilite la entrega de reserva del ejecutor.

<Note>
Nota sobre anulación de modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido o no se puede resolver, Cron hace fallar la ejecución con un error de validación explícito.
- Los parches de carga útil de API `cron.update` pueden establecer `model: null` para borrar una anulación de modelo almacenada en el trabajo.
- `openclaw cron edit <job-id> --clear-model` borra esa anulación desde la CLI (el mismo efecto que el parche `model: null`) y no se puede combinar con `--model`.
- Las cadenas de reserva configuradas siguen aplicándose porque `--model` de Cron es un primario del trabajo, no una anulación de sesión `/model`.
- `openclaw cron add|edit --fallbacks ...` establece la carga útil `fallbacks`, reemplazando las reservas configuradas para ese trabajo; `--fallbacks ""` deshabilita la reserva y hace que la ejecución sea estricta. `openclaw cron edit <job-id> --clear-fallbacks` borra la anulación por trabajo.
- Un `--model` simple sin una lista de reservas explícita o configurada no pasa al primario del agente como destino adicional silencioso de reintento.

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

`maxConcurrentRuns` limita tanto el envío de Cron programado como la ejecución de turnos de agente aislados, y su valor predeterminado es 8. Los turnos de agente aislados de Cron usan internamente el carril de ejecución dedicado `cron-nested` de la cola, por lo que aumentar este valor permite que las ejecuciones LLM de Cron independientes progresen en paralelo en lugar de solo iniciar sus envoltorios externos de Cron. El carril compartido no Cron `nested` no se amplía con esta configuración.

`cron.store` es una clave de almacén lógica y una ruta heredada de importación de doctor. Ejecuta `openclaw doctor --fix` para importar almacenes JSON existentes a SQLite y archivarlos; los cambios futuros de Cron deben pasar por la CLI o la API del Gateway.

Deshabilitar Cron: `cron.enabled: false` u `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Reintento de una sola ejecución**: los errores transitorios (límite de tasa, sobrecarga, red, error de servidor) se reintentan hasta 3 veces con retroceso exponencial. Los errores permanentes deshabilitan de inmediato.

    **Reintento recurrente**: retroceso exponencial (30 s a 60 min) entre reintentos. El retroceso se restablece después de la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (predeterminado `24h`) poda entradas de sesión de ejecución aislada. `cron.runLog.keepLines` limita las filas retenidas del historial de ejecuciones de SQLite por trabajo; `maxBytes` se conserva por compatibilidad de configuración con registros de ejecución antiguos respaldados por archivos.
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
  <Accordion title="Cron not firing">
    - Comprueba `cron.enabled` y la variable de entorno `OPENCLAW_SKIP_CRON`.
    - Confirma que el Gateway se esté ejecutando continuamente.
    - Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
    - `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y que el trabajo aún no vencía.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - El modo de entrega `none` significa que no se espera ningún envío de reserva del ejecutor. El agente aún puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
    - Un destino de entrega faltante/no válido (`channel`/`to`) significa que se omitió el envío saliente.
    - Para Matrix, los trabajos copiados o heredados con ID de sala `delivery.to` en minúsculas pueden fallar porque los ID de sala de Matrix distinguen mayúsculas y minúsculas. Edita el trabajo con el valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación de canal (`unauthorized`, `Forbidden`) significan que la entrega fue bloqueada por credenciales.
    - Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y también suprime la ruta de resumen en cola de reserva, por lo que no se publica nada de vuelta en el chat.
    - Si el agente debe enviar el mensaje al usuario por sí mismo, comprueba que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat anterior, o un canal/destino explícito).

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - La frescura del reinicio diario e inactivo no se basa en `updatedAt`; consulta [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Los despertares de Cron, las ejecuciones de Heartbeat, las notificaciones de exec y la contabilidad del gateway pueden actualizar la fila de sesión para enrutamiento/estado, pero no extienden `sessionStartedAt` ni `lastInteractionAt`.
    - Para filas heredadas creadas antes de que existieran esos campos, OpenClaw puede recuperar `sessionStartedAt` desde el encabezado de sesión JSONL de la transcripción cuando el archivo aún está disponible. Las filas heredadas inactivas sin `lastInteractionAt` usan esa hora de inicio recuperada como su referencia de inactividad.

  </Accordion>
  <Accordion title="Timezone gotchas">
    - Cron sin `--tz` usa la zona horaria del host del gateway.
    - Las programaciones `at` sin zona horaria se tratan como UTC.
    - `activeHours` de Heartbeat usa la resolución de zona horaria configurada.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Automatización](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para ejecuciones de Cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de zona horaria
