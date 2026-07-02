---
read_when:
    - Programación de trabajos en segundo plano o activaciones
    - Conectar desencadenadores externos (webhooks, Gmail) a OpenClaw
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Tareas programadas, webhooks y activadores PubSub de Gmail para el planificador de Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-07-02T07:55:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el programador integrado del Gateway. Persiste trabajos, despierta al agente en el momento adecuado y puede entregar la salida de vuelta a un canal de chat o endpoint de webhook.

## Inicio rápido

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cómo funciona cron

- Cron se ejecuta **dentro del proceso del Gateway** (no dentro del modelo).
- Las definiciones de trabajos, el estado de ejecución y el historial de ejecuciones persisten en la base de datos SQLite de estado compartido de OpenClaw, por lo que los reinicios no pierden programaciones.
- Al actualizar, ejecuta `openclaw doctor --fix` para importar los archivos heredados `~/.openclaw/cron/jobs.json`, `jobs-state.json` y `runs/*.jsonl` a SQLite y renombrarlos con un sufijo `.migrated`. Las filas de trabajos mal formadas se omiten en tiempo de ejecución y se copian a `jobs-quarantine.json` para su reparación o revisión posterior.
- `cron.store` todavía nombra la clave lógica del almacén de cron y la ruta de importación de doctor. Después de importar, editar ese archivo JSON ya no cambia los trabajos de cron activos; usa `openclaw cron add|edit|remove` o los métodos RPC de cron del Gateway en su lugar.
- Todas las ejecuciones de cron crean registros de [tarea en segundo plano](/es/automation/tasks).
- Al iniciar el Gateway, los trabajos aislados de turno de agente atrasados se reprograman fuera de la ventana de conexión de canal en lugar de reproducirse de inmediato, de modo que el inicio de Discord/Telegram y la configuración de comandos nativos sigan respondiendo después de los reinicios.
- Los trabajos de una sola ejecución (`--at`) se eliminan automáticamente después de completarse correctamente de forma predeterminada.
- Las ejecuciones aisladas de cron cierran, con el mejor esfuerzo, las pestañas/procesos de navegador rastreados para su sesión `cron:<jobId>` cuando la ejecución termina, de modo que la automatización de navegador desacoplada no deje procesos huérfanos.
- Las ejecuciones aisladas de cron que reciben la concesión estrecha de autolimpieza de cron aún pueden leer el estado del programador, una lista autofiltrada de su trabajo actual y el historial de ejecuciones de ese trabajo, de modo que las comprobaciones de estado/heartbeat puedan inspeccionar su propia programación sin obtener acceso más amplio para mutar cron.
- Las ejecuciones aisladas de cron también protegen contra respuestas de acuse obsoletas. Si el primer resultado es solo una actualización de estado provisional (`on it`, `pulling everything together` y pistas similares) y ninguna ejecución de subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de la entrega.
- Las ejecuciones aisladas de cron usan metadatos estructurados de denegación de ejecución de la ejecución integrada, incluidos envoltorios `UNAVAILABLE` de node-host cuyo mensaje de error anidado comienza con `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`, de modo que un comando bloqueado no se informe como una ejecución correcta mientras que la prosa ordinaria del asistente no se trate como una denegación.
- Las ejecuciones aisladas de cron también tratan los fallos de agente a nivel de ejecución como errores de trabajo incluso cuando no se produce ninguna carga útil de respuesta, de modo que los fallos de modelo/proveedor incrementen los contadores de error y disparen notificaciones de fallo en lugar de marcar el trabajo como correcto.
- Cuando un trabajo aislado de turno de agente alcanza `timeoutSeconds`, cron aborta la ejecución de agente subyacente y le da una breve ventana de limpieza. Si la ejecución no se vacía, la limpieza propiedad del Gateway fuerza la liberación de la propiedad de sesión de esa ejecución antes de que cron registre el tiempo de espera agotado, de modo que el trabajo de chat en cola no quede detrás de una sesión de procesamiento obsoleta.
- Si un turno de agente aislado se bloquea antes de que el ejecutor arranque o antes de la primera llamada al modelo, cron registra un tiempo de espera agotado específico de fase, como `setup timed out before runner start` o `stalled before first model call (last phase: context-engine)`. Estos watchdogs cubren proveedores integrados y proveedores respaldados por CLI antes de que su proceso CLI externo se inicie realmente, y se limitan de forma independiente respecto a valores largos de `timeoutSeconds` para que los fallos de arranque en frío/autenticación/contexto afloren rápidamente en lugar de esperar todo el presupuesto del trabajo.
- Si usas cron del sistema u otro programador externo para ejecutar `openclaw agent`, envuélvelo con una escalada de terminación forzada aunque la CLI maneje `SIGTERM`/`SIGINT`. Las ejecuciones respaldadas por Gateway piden al Gateway que aborte las ejecuciones aceptadas; las ejecuciones locales y de reserva integradas reciben la misma señal de aborto. Para GNU `timeout`, prefiere `timeout -k 60 600 openclaw agent ...` frente a `timeout 600 ...` sin más; el valor `-k` es el respaldo del supervisor si el proceso no puede vaciarse. Para unidades systemd, conserva la misma forma usando una señal de parada `SIGTERM` más una ventana de gracia como `TimeoutStopSec` antes de cualquier terminación final. Si un reintento reutiliza un `--run-id` mientras la ejecución original del Gateway sigue activa, el duplicado se informa como en curso en lugar de iniciar una segunda ejecución.

<a id="maintenance"></a>

<Note>
La reconciliación de tareas para cron pertenece primero al tiempo de ejecución y, en segundo lugar, se respalda en historial durable: una tarea de cron activa permanece viva mientras el runtime de cron todavía rastrea ese trabajo como en ejecución, incluso si aún existe una fila antigua de sesión hija. Una vez que el runtime deja de poseer el trabajo y vence la ventana de gracia de 5 minutos, el mantenimiento comprueba los registros de ejecución persistidos y el estado del trabajo para la ejecución coincidente `cron:<jobId>:<startedAt>`. Si ese historial durable muestra un resultado terminal, el libro de tareas se finaliza desde él; de lo contrario, el mantenimiento propiedad del Gateway puede marcar la tarea como `lost`. La auditoría CLI sin conexión puede recuperarse desde el historial durable, pero no trata su propio conjunto vacío de trabajos activos en proceso como prueba de que una ejecución de cron propiedad del Gateway ha desaparecido.
</Note>

## Tipos de programación

| Tipo    | Flag de CLI | Descripción                                             |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Marca de tiempo de una sola ejecución (ISO 8601 o relativa como `20m`) |
| `every` | `--every`   | Intervalo fijo                                          |
| `cron`  | `--cron`    | Expresión cron de 5 o 6 campos con `--tz` opcional      |

Las marcas de tiempo sin zona horaria se tratan como UTC. Añade `--tz America/New_York` para programar según la hora local de pared.

Las expresiones recurrentes al inicio de la hora se escalonan automáticamente hasta 5 minutos para reducir picos de carga. Usa `--exact` para forzar tiempos precisos o `--stagger 30s` para una ventana explícita.

### El día del mes y el día de la semana usan lógica OR

Las expresiones cron se analizan con [croner](https://github.com/Hexagon/croner). Cuando los campos de día del mes y día de la semana no son comodines, croner coincide cuando **cualquiera** de los campos coincide, no ambos. Este es el comportamiento estándar de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se dispara aproximadamente 5-6 veces al mes en lugar de 0-1 veces al mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para requerir ambas condiciones, usa el modificador de día de la semana `+` de Croner (`0 9 15 * +1`) o programa en un campo y protege el otro en el prompt o comando de tu trabajo.

## Estilos de ejecución

| Estilo          | Valor de `--session` | Se ejecuta en           | Mejor para                      |
| --------------- | -------------------- | ----------------------- | ------------------------------- |
| Sesión principal | `main`              | Carril dedicado de activación de cron | Recordatorios, eventos del sistema |
| Aislado         | `isolated`           | `cron:<jobId>` dedicado | Informes, tareas en segundo plano |
| Sesión actual   | `current`            | Vinculada en el momento de creación | Trabajo recurrente consciente del contexto |
| Sesión personalizada | `session:custom-id` | Sesión nombrada persistente | Flujos de trabajo que se basan en el historial |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Los trabajos de **sesión principal** ponen en cola un evento del sistema en un carril de ejecución propiedad de cron y, opcionalmente, despiertan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Pueden usar el último contexto de entrega de la sesión principal de destino para las respuestas, pero no anexan turnos rutinarios de cron al carril de chat humano ni extienden la frescura de reinicio diario/inactivo para la sesión de destino. Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) persisten contexto entre ejecuciones, lo que permite flujos de trabajo como reuniones diarias que se basan en resúmenes previos.

    Los eventos de cron de sesión principal son recordatorios autónomos de evento del sistema. No
    incluyen automáticamente la instrucción "Read
    HEARTBEAT.md" del prompt predeterminado de Heartbeat. Si un recordatorio recurrente debe consultar
    `HEARTBEAT.md`, dilo explícitamente en el texto del evento de cron o en las
    instrucciones propias del agente.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Para trabajos aislados, "sesión nueva" significa un nuevo identificador de transcripción/sesión para cada ejecución. OpenClaw puede trasladar preferencias seguras como ajustes de razonamiento/rápido/detallado, etiquetas y sobrescrituras explícitas de modelo/autenticación seleccionadas por el usuario, pero no hereda el contexto ambiental de conversación de una fila de cron anterior: enrutamiento de canal/grupo, política de envío o cola, elevación, origen o vinculación del runtime ACP. Usa `current` o `session:<id>` cuando un trabajo recurrente deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Para trabajos aislados, el desmontaje del runtime ahora incluye limpieza de navegador con el mejor esfuerzo para esa sesión de cron. Los fallos de limpieza se ignoran para que el resultado real de cron siga prevaleciendo.

    Las ejecuciones aisladas de cron también desechan cualquier instancia de runtime MCP incluida creada para el trabajo mediante la ruta compartida de limpieza de runtime. Esto coincide con cómo se desmontan los clientes MCP de sesión principal y sesión personalizada, de modo que los trabajos aislados de cron no filtren procesos hijos stdio ni conexiones MCP de larga duración entre ejecuciones.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Cuando las ejecuciones aisladas de cron orquestan subagentes, la entrega también prefiere la salida final descendiente frente al texto provisional obsoleto del padre. Si los descendientes siguen ejecutándose, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

    Para destinos de anuncio de Discord solo de texto, OpenClaw envía una vez el texto final canónico del asistente en lugar de reproducir tanto las cargas útiles de texto transmitido/intermedio como la respuesta final. Los medios y las cargas útiles estructuradas de Discord siguen entregándose como cargas útiles separadas para que los adjuntos y componentes no se descarten.

  </Accordion>
</AccordionGroup>

### Cargas útiles de comando

Usa cargas útiles de comando para scripts deterministas que deban ejecutarse dentro del programador del Gateway sin iniciar un turno de agente aislado respaldado por modelo. Los trabajos de comando se ejecutan en el host del Gateway, capturan stdout/stderr, registran la ejecución en el historial de cron y reutilizan los mismos modos de entrega `announce`, `webhook` y `none` que los trabajos aislados.

<Note>
Cron de comando es una superficie de automatización de Gateway para operadores administradores, no una llamada
`tools.exec` de agente. Crear, actualizar, eliminar o ejecutar manualmente trabajos de cron
requiere `operator.admin`; las ejecuciones de comando programadas se ejecutan más tarde dentro del
proceso del Gateway como esa automatización creada por el administrador. La política de exec de agente, como
`tools.exec.mode`, los prompts de aprobación y las listas de permisos de herramientas por agente, gobierna
las herramientas de exec visibles para el modelo, no las cargas útiles de cron de comando.
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

Si stdout no está vacío, ese texto es el resultado entregado. Si stdout está vacío y stderr no está vacío, se entrega stderr. Si ambos flujos están presentes, Cron entrega un pequeño bloque `stdout:` / `stderr:`. Un código de salida cero registra la ejecución como `ok`; una salida distinta de cero, señal, tiempo de espera agotado o tiempo de espera agotado sin salida registra `error` y puede activar alertas de fallo. Un comando que imprime solo `NO_REPLY` usa la supresión normal de token silencioso de Cron y no publica nada de vuelta en el chat.

### Opciones de payload para trabajos aislados

<ParamField path="--message" type="string" required>
  Texto del prompt (obligatorio para aislado).
</ParamField>
<ParamField path="--model" type="string">
  Anulación de modelo; usa el modelo permitido seleccionado para el trabajo.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos de respaldo por trabajo, por ejemplo `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Pasa `--fallbacks ""` para una ejecución estricta sin respaldos.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  En `cron edit`, elimina la anulación de respaldos por trabajo para que el trabajo siga la precedencia de respaldos configurada. No se puede combinar con `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  En `cron edit`, elimina la anulación de modelo por trabajo para que el trabajo siga la precedencia normal de selección de modelo de Cron (una anulación almacenada de sesión Cron si está definida; de lo contrario, el modelo del agente/predeterminado). No se puede combinar con `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Anulación del nivel de razonamiento.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  En `cron edit`, elimina la anulación de razonamiento por trabajo para que el trabajo siga la precedencia normal de razonamiento de Cron. No se puede combinar con `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omite la inyección de archivos de arranque del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe qué herramientas puede usar el trabajo, por ejemplo `--tools exec,read`.
</ParamField>

`--model` usa el modelo permitido seleccionado como modelo principal de ese trabajo. No es lo mismo que una anulación `/model` de sesión de chat: las cadenas de respaldo configuradas siguen aplicándose cuando falla el modelo principal del trabajo. Si el modelo solicitado no está permitido o no se puede resolver, Cron hace fallar la ejecución con un error de validación explícito en lugar de recurrir silenciosamente a la selección de modelo del agente/predeterminado del trabajo.

Los trabajos de Cron también pueden llevar `fallbacks` a nivel de payload. Cuando está presente, esa lista reemplaza la cadena de respaldos configurada para el trabajo. Usa `fallbacks: []` en el payload/API del trabajo cuando quieras una ejecución de Cron estricta que intente solo el modelo seleccionado. Si un trabajo tiene `--model` pero no tiene respaldos ni en el payload ni configurados, OpenClaw pasa una anulación explícita de respaldos vacía para que el modelo principal del agente no se añada como destino oculto adicional de reintento.

Las comprobaciones previas de proveedores locales recorren los respaldos configurados antes de marcar una ejecución de Cron como `skipped`; `fallbacks: []` mantiene estricta esa ruta de comprobación previa.

La precedencia de selección de modelo para trabajos aislados es:

1. Anulación de modelo del hook de Gmail (cuando la ejecución vino de Gmail y esa anulación está permitida)
2. `model` del payload por trabajo
3. Anulación almacenada de modelo de sesión Cron seleccionada por el usuario
4. Selección de modelo del agente/predeterminado

El modo rápido también sigue la selección activa resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, el Cron aislado lo usa de forma predeterminada. Una anulación `fastMode` almacenada de sesión sigue teniendo prioridad sobre la configuración en cualquier dirección. El modo automático usa el umbral `params.fastAutoOnSeconds` del modelo seleccionado cuando está presente; el valor predeterminado es 60 segundos.

Si una ejecución aislada encuentra un traspaso de cambio de modelo en vivo, Cron reintenta con el proveedor/modelo cambiado y conserva esa selección en vivo para la ejecución activa antes de reintentar. Cuando el cambio también incluye un nuevo perfil de autenticación, Cron también conserva esa anulación de perfil de autenticación para la ejecución activa. Los reintentos están acotados: después del intento inicial más 2 reintentos por cambio, Cron aborta en lugar de entrar en un bucle infinito.

Antes de que una ejecución de Cron aislada entre en el ejecutor de agentes, OpenClaw comprueba los endpoints de proveedores locales alcanzables para proveedores configurados con `api: "ollama"` y `api: "openai-completions"` cuyo `baseUrl` sea loopback, de red privada o `.local`. Si ese endpoint está caído, la ejecución se registra como `skipped` con un error claro de proveedor/modelo en lugar de iniciar una llamada al modelo. El resultado del endpoint se almacena en caché durante 5 minutos, por lo que muchos trabajos vencidos que usan el mismo servidor local inactivo de Ollama, vLLM, SGLang o LM Studio comparten una pequeña sonda en lugar de crear una tormenta de solicitudes. Las ejecuciones omitidas por comprobación previa de proveedor no incrementan el backoff por error de ejecución; habilita `failureAlert.includeSkipped` cuando quieras notificaciones repetidas de omisión.

## Entrega y salida

| Modo       | Qué sucede                                                        |
| ---------- | ----------------------------------------------------------------- |
| `announce` | Entrega de respaldo del texto final al destino si el agente no lo envió |
| `webhook`  | Publica por POST el payload del evento finalizado en una URL      |
| `none`     | Sin entrega de respaldo del ejecutor                              |

Usa `--announce --channel telegram --to "-1001234567890"` para entrega en canal. Para temas de foro de Telegram, usa `-1001234567890:topic:123`; OpenClaw también acepta la forma abreviada propiedad de Telegram `-1001234567890:123`. Los llamadores directos de RPC/configuración pueden pasar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`). Los ID de sala de Matrix distinguen mayúsculas y minúsculas; usa el ID de sala exacto o la forma `room:!room:server` de Matrix.

Cuando la entrega announce usa `channel: "last"` u omite `channel`, un destino con prefijo de proveedor como `telegram:123` puede seleccionar el canal antes de que Cron recurra al historial de sesión o a un único canal configurado. Solo los prefijos anunciados por el Plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo del destino debe nombrar el mismo proveedor; por ejemplo, `channel: "whatsapp"` con `to: "telegram:123"` se rechaza en lugar de permitir que WhatsApp interprete el ID de Telegram como un número de teléfono. Los prefijos de tipo de destino y servicio como `channel:<id>`, `user:<id>`, `imessage:<handle>` y `sms:<number>` siguen siendo sintaxis de destino propiedad del canal, no selectores de proveedor.

Para trabajos aislados, la entrega por chat es compartida. Si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso cuando el trabajo usa `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el announce de respaldo. De lo contrario, `announce`, `webhook` y `none` solo controlan lo que el ejecutor hace con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino de entrega en vivo preservado para la ruta announce de respaldo. Las claves internas de sesión pueden estar en minúsculas; los destinos de entrega de proveedores no se reconstruyen a partir de esas claves cuando hay contexto de chat actual disponible.

La entrega announce implícita usa listas de permitidos de canales configuradas para validar y redirigir destinos obsoletos. Las aprobaciones del almacén de emparejamiento de DM no son destinatarios de automatización de respaldo; define `delivery.to` o configura la entrada `allowFrom` del canal cuando un trabajo programado deba enviar proactivamente a un DM.

## Idioma de salida

Los trabajos de Cron no infieren un idioma de respuesta a partir del canal, la configuración regional ni los mensajes anteriores. Pon la regla de idioma en el mensaje o la plantilla programados:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Para archivos de plantilla, mantén la instrucción de idioma en el prompt renderizado y verifica que los marcadores de posición como `{{language}}` estén completos antes de que se ejecute el trabajo. Si la salida mezcla idiomas, haz explícita la regla, por ejemplo: "Use Chinese for narrative text and keep technical terms in English."

Las notificaciones de fallo siguen una ruta de destino separada:

- `cron.failureDestination` define un valor predeterminado global para las notificaciones de fallo.
- `job.delivery.failureDestination` lo anula por trabajo.
- Si ninguno está definido y el trabajo ya entrega mediante `announce`, las notificaciones de fallo ahora recurren a ese destino announce principal.
- `delivery.failureDestination` solo se admite en trabajos `sessionTarget="isolated"` a menos que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` opta un trabajo o una política global de alertas de Cron por alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador consecutivo de omisiones separado, por lo que no afectan el backoff por error de ejecución.

## Ejemplos de CLI

<Tabs>
  <Tab title="Recordatorio puntual">
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

Gateway puede exponer endpoints HTTP de Webhook para activadores externos. Habilítalo en la configuración:

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

Los tokens en cadena de consulta se rechazan.

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
    Los nombres de hook personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar payloads arbitrarios en acciones `wake` o `agent` con plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantén los endpoints de hook detrás de loopback, tailnet o un proxy inverso de confianza.

- Usa un token de hook dedicado; no reutilices tokens de autenticación del Gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Configura `hooks.allowedAgentIds` para limitar a qué agente efectivo puede dirigirse un hook, incluido el agente predeterminado cuando se omite `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` salvo que necesites sesiones seleccionadas por el llamador.
- Si habilitas `hooks.allowRequestSessionKey`, configura también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de las claves de sesión.
- Las cargas útiles de los hooks se envuelven con límites de seguridad de forma predeterminada.

</Warning>

## Integración Gmail PubSub

Conecta los disparadores de la bandeja de entrada de Gmail con OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados, Tailscale para el endpoint HTTPS público.
</Note>

### Configuración con asistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el preajuste de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático del Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está configurado, el Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la vigilancia. Configura `OPENCLAW_SKIP_GMAIL_WATCHER=1` para excluirte.

### Configuración manual de una sola vez

<Steps>
  <Step title="Selecciona el proyecto de GCP">
    Selecciona el proyecto de GCP propietario del cliente OAuth que usa `gog`:

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

`openclaw cron run <jobId>` devuelve el control tras encolar la ejecución manual. Usa `--wait` para hooks de apagado, scripts de mantenimiento u otra automatización que deba bloquearse hasta que finalice la ejecución en cola. El modo de espera sondea el `runId` exacto devuelto; sale con `0` para el estado `ok` y con un valor distinto de cero para `error`, `skipped` o un tiempo de espera agotado.

La herramienta de agente `cron` devuelve resúmenes compactos de trabajos (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) desde `cron(action: "list")`; usa `cron(action: "get", jobId: "...")` para obtener una definición completa de un trabajo. Los llamadores directos del Gateway pueden pasar `compact: true` a `cron.list`; omitirlo preserva la respuesta completa existente con vistas previas de entrega.

`openclaw cron create` es un alias de `openclaw cron add`, y los trabajos nuevos pueden usar una programación posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` o una marca de tiempo ISO) seguida de un prompt posicional del agente. Usa `--webhook <url>` en `cron add|create` o `cron edit` para enviar por POST la carga útil de la ejecución terminada a un endpoint HTTP. La entrega por Webhook no puede combinarse con flags de entrega por chat como `--announce`, `--channel`, `--to`, `--thread-id` o `--account`. En `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account` eliminan esos campos de enrutamiento individualmente (cada uno se rechaza junto con su flag de configuración correspondiente), lo cual es distinto de que `--no-deliver` deshabilite la entrega de reserva del ejecutor.

<Note>
Nota sobre sustitución de modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido o no puede resolverse, Cron hace fallar la ejecución con un error de validación explícito.
- Los parches de carga útil de la API `cron.update` pueden configurar `model: null` para borrar una sustitución de modelo almacenada en el trabajo.
- `openclaw cron edit <job-id> --clear-model` borra esa sustitución desde la CLI (mismo efecto que el parche `model: null`) y no puede combinarse con `--model`.
- Las cadenas de reserva configuradas siguen aplicándose porque `--model` de Cron es un modelo primario del trabajo, no una sustitución `/model` de sesión.
- `openclaw cron add|edit --fallbacks ...` configura la carga útil `fallbacks`, reemplazando las reservas configuradas para ese trabajo; `--fallbacks ""` deshabilita la reserva y hace que la ejecución sea estricta. `openclaw cron edit <job-id> --clear-fallbacks` borra la sustitución por trabajo.
- Un `--model` simple sin lista de reservas explícita o configurada no pasa al primario del agente como destino adicional silencioso de reintento.

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

`maxConcurrentRuns` limita tanto el despacho programado de Cron como la ejecución aislada de turnos de agente, y su valor predeterminado es 8. Los turnos aislados de agente de Cron usan internamente el carril de ejecución dedicado `cron-nested` de la cola, por lo que aumentar este valor permite que ejecuciones LLM independientes de Cron avancen en paralelo en lugar de iniciar solo sus envoltorios externos de Cron. Este ajuste no amplía el carril compartido `nested` que no es de Cron.

`cron.store` es una clave lógica de almacén y una ruta de importación heredada de doctor. Ejecuta `openclaw doctor --fix` para importar almacenes JSON existentes a SQLite y archivarlos; los cambios futuros de Cron deben pasar por la CLI o la API del Gateway.

Deshabilitar Cron: `cron.enabled: false` u `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamiento de reintentos">
    **Reintento de ejecución única**: los errores transitorios (límite de tasa, sobrecarga, red, error de servidor) se reintentan hasta 3 veces con retroceso exponencial. Los errores permanentes se deshabilitan inmediatamente.

    **Reintento recurrente**: retroceso exponencial (de 30 s a 60 min) entre reintentos. El retroceso se restablece tras la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Mantenimiento">
    `cron.sessionRetention` (valor predeterminado `24h`) depura entradas de sesión de ejecución aislada. `cron.runLog.keepLines` limita las filas de historial de ejecución en SQLite retenidas por trabajo; `maxBytes` se conserva por compatibilidad de configuración con registros de ejecución más antiguos respaldados por archivos.
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
    - Confirma que el Gateway se ejecuta continuamente.
    - Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
    - `reason: not-due` en la salida de la ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y el trabajo aún no vencía.

  </Accordion>
  <Accordion title="Cron se disparó pero no hubo entrega">
    - El modo de entrega `none` significa que no se espera ningún envío de reserva del ejecutor. El agente aún puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
    - Falta el destino de entrega o no es válido (`channel`/`to`) significa que se omitió la salida.
    - En Matrix, los trabajos copiados o heredados con IDs de sala `delivery.to` en minúsculas pueden fallar porque los IDs de sala de Matrix distinguen mayúsculas y minúsculas. Edita el trabajo con el valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que la entrega fue bloqueada por credenciales.
    - Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y también suprime la ruta de resumen en cola de reserva, por lo que no se publica nada de vuelta en el chat.
    - Si el agente debe enviar un mensaje al usuario por sí mismo, comprueba que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat previo, o un canal/destino explícito).

  </Accordion>
  <Accordion title="Cron o Heartbeat parece impedir la rotación de estilo /new">
    - La frescura de restablecimiento diario e inactivo no se basa en `updatedAt`; consulta [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Los despertares de Cron, las ejecuciones de Heartbeat, las notificaciones de exec y la contabilidad del gateway pueden actualizar la fila de sesión para enrutamiento/estado, pero no extienden `sessionStartedAt` ni `lastInteractionAt`.
    - Para filas heredadas creadas antes de que existieran esos campos, OpenClaw puede recuperar `sessionStartedAt` desde el encabezado de sesión del transcript JSONL cuando el archivo todavía está disponible. Las filas inactivas heredadas sin `lastInteractionAt` usan esa hora de inicio recuperada como base de inactividad.

  </Accordion>
  <Accordion title="Problemas típicos de zona horaria">
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
