---
read_when:
    - Cambiar la ejecución o la concurrencia de las respuestas automáticas
    - Explicación de los modos de /queue o del comportamiento de direccionamiento de mensajes
summary: Modos de cola de respuesta automática, valores predeterminados y anulaciones por sesión
title: Cola de comandos
x-i18n:
    generated_at: "2026-07-20T00:47:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 69b40f67146226b0315492b27fc9d2218cace8bbd1eaff6514f7efb33b69d763
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw serializa las ejecuciones de respuesta automática entrantes (de todos los canales) mediante una pequeña cola dentro del proceso para evitar que varias ejecuciones del agente entren en conflicto, a la vez que permite un paralelismo seguro entre sesiones.

## Por qué

- Las ejecuciones de respuesta automática pueden ser costosas (llamadas al LLM) y pueden entrar en conflicto cuando llegan varios mensajes entrantes casi al mismo tiempo.
- La serialización evita la competencia por recursos compartidos (archivos de sesión, registros, entrada estándar de la CLI) y reduce la probabilidad de alcanzar los límites de frecuencia del servicio ascendente.

## Cómo funciona

- Una cola FIFO con reconocimiento de carriles procesa cada carril con un límite de concurrencia configurable (el valor predeterminado es 1 para los carriles no configurados; `main` tiene como valor predeterminado 4 y `subagent`, 8).
- `runEmbeddedAgent` pone en cola por **clave de sesión** (carril `session:<key>`) para garantizar que solo haya una ejecución activa por sesión.
- A continuación, cada ejecución de sesión se pone en una **cola global** (`main` de forma predeterminada), de modo que el paralelismo total quede limitado por `agents.defaults.maxConcurrent`.
- Cuando el registro detallado está habilitado, las ejecuciones en cola emiten un aviso breve si esperan más de ~2s antes de comenzar.
- Los indicadores de escritura siguen activándose inmediatamente al poner una ejecución en cola (cuando el canal lo admite), por lo que la experiencia del usuario no cambia mientras la ejecución espera su turno.

## Valores predeterminados

Cuando no se establece ningún valor, todas las superficies de canales entrantes usan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

La redirección dentro del mismo turno es el comportamiento predeterminado. Una instrucción que llega durante una ejecución se inyecta en el entorno de ejecución activo cuando este puede aceptar redirecciones, por lo que no se inicia una segunda ejecución de sesión. Si la ejecución activa no puede aceptar redirecciones, OpenClaw espera a que termine antes de iniciar la instrucción.

## Modos de cola

`/queue` controla lo que hacen los mensajes entrantes normales mientras una sesión ya tiene una ejecución activa:

- `steer`: inyecta los mensajes en el entorno de ejecución activo. OpenClaw entrega todos los mensajes de redirección pendientes **después de que el turno actual del asistente termine de ejecutar sus llamadas a herramientas**, antes de la siguiente llamada al LLM; el servidor de aplicaciones de Codex recibe un único `turn/steer` agrupado. Si la ejecución no está transmitiendo activamente o la redirección no está disponible, OpenClaw espera a que termine la ejecución activa antes de iniciar la instrucción.
- `followup`: no redirige. Pone cada mensaje en cola para un turno posterior del agente una vez finalizada la ejecución actual.
- `collect`: no redirige. Agrupa los mensajes en cola en un **único** turno de seguimiento después del intervalo de inactividad. Si los mensajes se dirigen a canales o hilos diferentes, se procesan individualmente para conservar el enrutamiento.
- `interrupt`: cancela la ejecución activa de esa sesión y, a continuación, ejecuta el mensaje más reciente.

Para obtener información sobre los tiempos y el comportamiento de las dependencias específicos del entorno de ejecución, consulte [Cola de redirección](/es/concepts/queue-steering). Para el comando explícito `/steer <message>`, consulte [Redirigir](/es/tools/steer).

Configure los valores globalmente o por canal mediante `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opciones de cola

Las opciones se aplican a la entrega en cola. `debounceMs` también establece el intervalo de inactividad de redirección de Codex en el modo `steer`:

- `debounceMs`: intervalo de inactividad antes de procesar los seguimientos en cola o los lotes agrupados; en el modo `steer` de Codex, intervalo de inactividad antes de enviar `turn/steer` agrupados. Los números sin unidad representan milisegundos; las opciones `/queue` aceptan las unidades `ms`, `s`, `m`, `h` y `d`.
- `cap`: número máximo de mensajes en cola por sesión. Se ignoran los valores inferiores a `1`.
- `drop: "summarize"` (valor predeterminado): descarta las entradas más antiguas de la cola según sea necesario, conserva resúmenes compactos y los inyecta como una instrucción de seguimiento sintética.
- `drop: "old"`: descarta las entradas más antiguas de la cola según sea necesario, sin conservar resúmenes.
- `drop: "new"`: rechaza el mensaje más reciente cuando la cola ya está llena.

Valores predeterminados: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Redirección y transmisión

Cuando la transmisión del canal es `partial` o `block`, la redirección puede parecer una secuencia de varias respuestas visibles breves mientras la ejecución activa alcanza los límites del entorno de ejecución:

- `partial`: la vista previa puede finalizar antes de tiempo y, después de que se acepte la redirección, se inicia una nueva vista previa.
- `block`: los bloques del tamaño de un borrador pueden producir la misma apariencia secuencial.
- Sin transmisión, la redirección pasa a ser un seguimiento posterior a la ejecución activa cuando el entorno de ejecución no puede aceptar redirecciones dentro del mismo turno.

`steer` no cancela las herramientas en ejecución. Use `/queue interrupt` cuando el mensaje más reciente deba cancelar la ejecución actual.

## Precedencia

Para seleccionar el modo, OpenClaw resuelve:

1. La anulación `/queue` por sesión, insertada en línea o almacenada.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. El valor predeterminado `steer`.

En el caso de las opciones, las opciones `/queue` insertadas en línea o almacenadas tienen prioridad sobre la configuración. A continuación, se aplican, en este orden, el tiempo de estabilización específico del canal (`messages.queue.debounceMsByChannel`), los valores predeterminados de estabilización del Plugin, las opciones globales de `messages.queue` y los valores predeterminados integrados. `cap` y `drop` son opciones globales o de sesión, no claves de configuración por canal.

## Anulaciones por sesión

- Envíe `/queue <steer|followup|collect|interrupt>` como comando independiente para almacenar el modo de cola de la sesión actual.
- Las opciones pueden combinarse: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` borra la anulación de la sesión.

## Cancelación de turnos en cola

Mientras una instrucción permanece en la cola de seguimiento o agrupación (por ejemplo, una
`chat.send` de la TUI o del chat web que llega mientras hay otro turno activo), el Gateway conserva una
**identidad de cancelación propiedad del Gateway** para la `runId` de ese cliente hasta que el contenido
en cola se ejecuta o se descarta. La identidad acompaña al contenido incorporado a un
resumen por desbordamiento.

- `chat.abort` con una `runId` específica cancela ese turno mientras aún está
  en cola, si el solicitante está autorizado (las mismas reglas de propiedad que para las ejecuciones activas).
- `chat.abort` para una sesión sin `runId` cancela **primero los turnos en cola autorizados**
  y, a continuación, cancela las ejecuciones activas autorizadas. Este orden evita que el procesamiento de la cola
  promueva trabajo a una sesión detenida parcialmente.
- Vaciar toda la cola de la sesión sin comprobaciones por solicitante no es la
  ruta de detención para las sesiones con varios propietarios.
- Las esperas en cola no se proyectan como ejecuciones activas del agente para `sessions.list` y
  no poseen la semántica de tiempo de espera de las ejecuciones activas; solo la fase activa la posee.

Los clientes respaldados por el Gateway (incluido `openclaw tui`) reenvían las instrucciones que llegan durante la ejecución y
permiten que el Gateway aplique el modo de cola. Esc/`/stop` usa una cancelación con alcance de sesión
para que la pérdida de identificadores locales no permita que una instrucción aún en cola se ejecute.

`openclaw chat` y `openclaw tui --local` aplican los mismos cuatro modos en el
entorno de ejecución integrado. El `steer` local inyecta en una ejecución integrada activa cuando ese
entorno de ejecución acepta redirecciones y, de lo contrario, se convierte en un seguimiento; `followup` y
`collect` permanecen como trabajo local pendiente; `interrupt` cancela la ejecución local activa
antes de iniciar el mensaje más reciente. El comando explícito `/steer <message>`
no es un comando de modo local.

## Alcance y garantías

- Se aplica a las ejecuciones de agentes de respuesta automática de todos los canales entrantes que usan el pipeline de respuestas del Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, chat web, etc.).
- El carril predeterminado (`main`) abarca todo el proceso para los mensajes entrantes y los heartbeats principales; establezca `agents.defaults.maxConcurrent` para permitir varias sesiones en paralelo.
- Pueden existir carriles adicionales (p. ej., `cron`, `cron-nested`, `nested`, `subagent`) para que los trabajos en segundo plano puedan ejecutarse en paralelo sin bloquear las respuestas entrantes. Los turnos aislados del agente de Cron ocupan una ranura `cron` mientras su ejecución interna del agente usa `cron-nested`. Los flujos `nested` compartidos que no pertenecen a Cron conservan el comportamiento de su propio carril. Estas ejecuciones desacopladas se registran como [tareas en segundo plano](/es/automation/tasks).
- Los carriles por sesión garantizan que solo una ejecución del agente acceda a una sesión determinada a la vez.
- No hay dependencias externas ni subprocesos de trabajo en segundo plano; solo TypeScript + promesas.

## Solución de problemas

- Si los comandos parecen bloqueados, habilite los registros detallados y busque líneas con "queued for ...ms" para confirmar que la cola se está procesando.
- El adaptador de Codex interrumpe las ejecuciones del servidor de aplicaciones de Codex que aceptan un turno y luego dejan de emitir avances, para que el carril de la sesión activa pueda liberarse en lugar de esperar al tiempo de espera de la ejecución externa.
- Cuando los diagnósticos están habilitados, las sesiones que permanecen en `processing` más allá del umbral de advertencia integrado sin que se observe ningún avance de respuesta, herramienta, estado, bloque o ACP se clasifican según su actividad actual:
  - El trabajo activo con avances recientes se registra como `session.long_running`. Las llamadas silenciosas al modelo con propietario también permanecen como `session.long_running` hasta el umbral de cancelación integrado, para que los proveedores lentos o sin transmisión no se notifiquen como bloqueados demasiado pronto.
  - El trabajo activo sin avances recientes se registra como `session.stalled`; las llamadas al modelo con propietario, las llamadas a herramientas bloqueadas y las ejecuciones integradas bloqueadas cambian a `session.stalled` al alcanzar o superar el umbral de cancelación. La actividad obsoleta del modelo o las herramientas sin propietario no se oculta como una ejecución prolongada.
  - `session.stuck` se reserva para registros de sesión obsoletos recuperables, incluidas las sesiones inactivas en cola con actividad obsoleta del modelo o las herramientas sin propietario.
  - `session.stuck` siempre activa una recuperación que puede liberar el carril de la sesión afectada. Una clasificación `session.stalled` posterior al umbral de cancelación (llamada a herramienta bloqueada, llamada al modelo bloqueada o ejecución integrada bloqueada) también puede activar la recuperación mediante cancelación activa, por lo que ambas clasificaciones pueden desbloquear una cola, no solo `session.stuck`.
  - Las líneas repetidas de registro de advertencia `session.stuck` y `session.long_running` aplican un retraso exponencial mientras la sesión permanece sin cambios; los intentos de recuperación siguen ejecutándose en cada ciclo de heartbeat, independientemente de ese retraso.

## Contenido relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Cola de redirección](/es/concepts/queue-steering)
- [Redirigir](/es/tools/steer)
- [Política de reintentos](/es/concepts/retry)
