---
read_when:
    - Cambiar la ejecución o la concurrencia de las respuestas automáticas
    - Explicación de los modos de `/queue` o del comportamiento de direccionamiento de mensajes
summary: Modos de cola de respuesta automática, valores predeterminados y anulaciones por sesión
title: Cola de comandos
x-i18n:
    generated_at: "2026-07-19T01:56:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 01a888217e8bcb9f379278d49943ce7b1d59e813a0f218c6b8c7f94c066b88d0
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw serializa las ejecuciones de respuesta automática entrantes (de todos los canales) mediante una pequeña cola en proceso para evitar que varias ejecuciones del agente entren en conflicto, al tiempo que permite un paralelismo seguro entre sesiones.

## Motivo

- Las ejecuciones de respuesta automática pueden consumir muchos recursos (llamadas al LLM) y entrar en conflicto cuando llegan varios mensajes con poca diferencia de tiempo.
- La serialización evita la competencia por recursos compartidos (archivos de sesión, registros, entrada estándar de la CLI) y reduce la probabilidad de alcanzar los límites de frecuencia del servicio de origen.

## Funcionamiento

- Una cola FIFO que reconoce carriles procesa cada carril con un límite de concurrencia configurable (el valor predeterminado es 1 para los carriles sin configurar; `main` tiene como valor predeterminado 4 y `subagent`, 8).
- `runEmbeddedAgent` pone en cola según la **clave de sesión** (carril `session:<key>`) para garantizar que solo haya una ejecución activa por sesión.
- Después, cada ejecución de sesión se coloca en un **carril global** (`main` de forma predeterminada), de modo que el paralelismo general quede limitado por `agents.defaults.maxConcurrent`.
- Cuando el registro detallado está activado, las ejecuciones en cola emiten un aviso breve si esperan más de ~2s antes de comenzar.
- Los indicadores de escritura se activan inmediatamente al poner la ejecución en cola (cuando el canal lo admite), por lo que la experiencia de usuario no cambia mientras la ejecución espera su turno.

## Valores predeterminados

Cuando no se configuran, todas las superficies de canales entrantes utilizan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

La dirección durante el mismo turno es el comportamiento predeterminado. Una instrucción que llega durante una ejecución se inyecta en el entorno de ejecución activo cuando este admite dirección, por lo que no se inicia una segunda ejecución de sesión. Si la ejecución activa no admite dirección, OpenClaw espera a que finalice antes de iniciar la instrucción.

## Modos de cola

`/queue` controla lo que hacen los mensajes entrantes normales cuando una sesión ya tiene una ejecución activa:

- `steer`: inyecta mensajes en el entorno de ejecución activo. OpenClaw entrega todos los mensajes de dirección pendientes **después de que el turno actual del asistente termine de ejecutar sus llamadas a herramientas**, antes de la siguiente llamada al LLM; el servidor de aplicaciones de Codex recibe un único `turn/steer` agrupado. Si la ejecución no está transmitiendo activamente o la dirección no está disponible, OpenClaw espera a que finalice la ejecución activa antes de iniciar la instrucción.
- `followup`: no dirige. Pone cada mensaje en cola para un turno posterior del agente, una vez que finaliza la ejecución actual.
- `collect`: no dirige. Agrupa los mensajes en cola en un **único** turno de seguimiento después del intervalo de inactividad. Si los mensajes se dirigen a distintos canales o hilos, se procesan individualmente para preservar el enrutamiento.
- `interrupt`: cancela la ejecución activa de esa sesión y, a continuación, ejecuta el mensaje más reciente.

Para obtener información sobre los tiempos específicos del entorno de ejecución y el comportamiento de las dependencias, consulte [Cola de dirección](/es/concepts/queue-steering). Para el comando explícito `/steer <message>`, consulte [Dirigir](/es/tools/steer).

Configure el comportamiento globalmente o por canal mediante `messages.queue`:

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

Las opciones se aplican a la entrega en cola. `debounceMs` también establece el intervalo de inactividad de dirección de Codex en el modo `steer`:

- `debounceMs`: intervalo de inactividad antes de procesar los seguimientos en cola o los lotes agrupados; en el modo `steer` de Codex, intervalo de inactividad antes de enviar el `turn/steer` agrupado. Los números sin unidad representan milisegundos; las opciones `/queue` aceptan las unidades `ms`, `s`, `m`, `h` y `d`.
- `cap`: número máximo de mensajes en cola por sesión. Se ignoran los valores inferiores a `1`.
- `drop: "summarize"` (valor predeterminado): descarta las entradas más antiguas de la cola según sea necesario, conserva resúmenes compactos y los inyecta como una instrucción de seguimiento sintética.
- `drop: "old"`: descarta las entradas más antiguas de la cola según sea necesario, sin conservar resúmenes.
- `drop: "new"`: rechaza el mensaje más reciente cuando la cola ya está llena.

Valores predeterminados: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Dirección y transmisión

Cuando la transmisión del canal es `partial` o `block`, la dirección puede mostrarse como varias respuestas visibles breves mientras la ejecución activa alcanza los límites del entorno de ejecución:

- `partial`: la vista previa puede finalizar antes de tiempo y, después de que se acepte la dirección, comienza una nueva.
- `block`: los bloques del tamaño de un borrador pueden producir la misma apariencia secuencial.
- Sin transmisión, la dirección pasa a ser un seguimiento posterior a la ejecución activa cuando el entorno de ejecución no admite dirección durante el mismo turno.

`steer` no cancela las herramientas en curso. Utilice `/queue interrupt` cuando el mensaje más reciente deba cancelar la ejecución actual.

## Precedencia

Para seleccionar el modo, OpenClaw resuelve en este orden:

1. Anulación `/queue` por sesión, insertada o almacenada.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Valor predeterminado `steer`.

En el caso de las opciones, las opciones `/queue` insertadas o almacenadas prevalecen sobre la configuración. A continuación se aplican, en este orden, el tiempo de estabilización específico del canal (`messages.queue.debounceMsByChannel`), los valores predeterminados de estabilización del Plugin, las opciones globales `messages.queue` y los valores predeterminados integrados. `cap` y `drop` son opciones globales o de sesión, no claves de configuración por canal.

## Anulaciones por sesión

- Envíe `/queue <steer|followup|collect|interrupt>` como comando independiente para almacenar el modo de cola de la sesión actual.
- Las opciones se pueden combinar: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` elimina la anulación de la sesión.

## Cancelación de turnos en cola

Mientras una instrucción permanece en la cola de seguimiento o agrupación (por ejemplo, un
`chat.send` de la TUI o del chat web que llega mientras hay otro turno activo), el Gateway conserva una
**identidad de cancelación propiedad del Gateway** para el `runId` de ese cliente hasta que el contenido
en cola se ejecute o se descarte. La identidad acompaña al contenido incorporado a un
resumen de desbordamiento.

- `chat.abort` con un `runId` específico cancela ese turno mientras todavía está
  en cola, si el solicitante tiene autorización (se aplican las mismas reglas de propiedad que a las ejecuciones activas).
- `chat.abort` para una sesión sin `runId` cancela **primero los turnos en cola
  autorizados** y después cancela las ejecuciones activas autorizadas. Este orden evita que el procesamiento de la cola
  promueva trabajo a una sesión detenida a medias.
- Vaciar toda la cola de la sesión sin comprobaciones por solicitante no es la
  vía de detención para sesiones con varios propietarios.
- Las esperas en cola no se presentan como ejecuciones activas del agente para `sessions.list` y
  no poseen la semántica de tiempo de espera de una ejecución activa; solo la posee la fase activa.

Los clientes respaldados por el Gateway (incluido `openclaw tui`) reenvían las instrucciones que llegan durante la ejecución y
permiten que el Gateway aplique el modo de cola. Esc/`/stop` utiliza una cancelación con ámbito de sesión
para que la pérdida de controladores locales no permita que siga ejecutándose una instrucción aún en cola.

`openclaw chat` y `openclaw tui --local` aplican los mismos cuatro modos en el
entorno de ejecución integrado. El `steer` local se inyecta en una ejecución integrada activa cuando ese
entorno admite dirección y, de lo contrario, se convierte en un seguimiento; `followup` y
`collect` permanecen como trabajo local pendiente; `interrupt` cancela la ejecución local activa
antes de iniciar el mensaje más reciente. El comando explícito `/steer <message>`
no es un comando de modo local.

## Ámbito y garantías

- Se aplica a las ejecuciones del agente de respuesta automática en todos los canales entrantes que utilizan el pipeline de respuestas del Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, chat web, etc.).
- El carril predeterminado (`main`) abarca todo el proceso para los mensajes entrantes y los Heartbeat principales; establezca `agents.defaults.maxConcurrent` para permitir varias sesiones en paralelo.
- Puede haber carriles adicionales (por ejemplo, `cron`, `cron-nested`, `nested`, `subagent`) para que los trabajos en segundo plano puedan ejecutarse en paralelo sin bloquear las respuestas entrantes. Los turnos aislados del agente Cron ocupan una ranura `cron` mientras su ejecución interna del agente utiliza `cron-nested`; ambos utilizan `cron.maxConcurrentRuns`. Los flujos `nested` compartidos que no son Cron conservan el comportamiento de su propio carril. Estas ejecuciones desacopladas se registran como [tareas en segundo plano](/es/automation/tasks).
- Los carriles por sesión garantizan que solo una ejecución del agente acceda a una sesión determinada a la vez.
- No hay dependencias externas ni hilos de trabajo en segundo plano; solo TypeScript y promesas.

## Solución de problemas

- Si los comandos parecen bloqueados, active los registros detallados y busque líneas "queued for ...ms" para confirmar que la cola se está procesando.
- El adaptador de Codex interrumpe las ejecuciones del servidor de aplicaciones de Codex que aceptan un turno y después dejan de emitir progreso, de modo que el carril de la sesión activa pueda liberarse en lugar de esperar al tiempo de espera de la ejecución externa.
- Cuando los diagnósticos están activados, las sesiones que permanecen en `processing` después de `diagnostics.stuckSessionWarnMs` sin que se observe progreso de respuesta, herramienta, estado, bloque o ACP se clasifican según la actividad actual:
  - El trabajo activo con progreso reciente se registra como `session.long_running`. Las llamadas silenciosas al modelo con propietario también permanecen en `session.long_running` hasta `diagnostics.stuckSessionAbortMs`, para que los proveedores lentos o sin transmisión no se indiquen como bloqueados demasiado pronto.
  - El trabajo activo sin progreso reciente se registra como `session.stalled`; las llamadas al modelo con propietario, las llamadas a herramientas bloqueadas y las ejecuciones integradas bloqueadas cambian a `session.stalled` al alcanzar o superar el umbral de cancelación. La actividad obsoleta de modelos o herramientas sin propietario no se oculta como una ejecución prolongada.
  - `session.stuck` se reserva para registros de sesión obsoletos recuperables, incluidas las sesiones inactivas en cola con actividad obsoleta de modelos o herramientas sin propietario.
  - `session.stuck` siempre activa una recuperación capaz de liberar el carril de la sesión afectada. Una clasificación `session.stalled` posterior a `diagnostics.stuckSessionAbortMs` (llamada a herramienta bloqueada, llamada al modelo bloqueada o ejecución integrada bloqueada) también puede activar la recuperación mediante cancelación activa, por lo que ambas clasificaciones pueden desbloquear una cola, no solo `session.stuck`.
  - Las líneas repetidas de advertencia `session.stuck` y `session.long_running` de los registros aplican un retroceso exponencial mientras la sesión no cambie; los intentos de recuperación siguen ejecutándose en cada ciclo de Heartbeat independientemente de ese retroceso.

## Contenido relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Cola de dirección](/es/concepts/queue-steering)
- [Dirigir](/es/tools/steer)
- [Política de reintentos](/es/concepts/retry)
