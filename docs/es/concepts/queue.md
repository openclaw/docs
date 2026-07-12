---
read_when:
    - Cambiar la ejecución o la concurrencia de las respuestas automáticas
    - Explicación de los modos de `/queue` o del comportamiento de direccionamiento de mensajes
summary: Modos de cola de respuesta automática, valores predeterminados y anulaciones por sesión
title: Cola de comandos
x-i18n:
    generated_at: "2026-07-11T23:01:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw serializa las ejecuciones de respuesta automática entrantes (de todos los canales) mediante una pequeña cola dentro del proceso para evitar que varias ejecuciones del agente colisionen, al tiempo que permite un paralelismo seguro entre sesiones.

## Motivo

- Las ejecuciones de respuesta automática pueden ser costosas (llamadas al LLM) y pueden colisionar cuando llegan varios mensajes entrantes casi al mismo tiempo.
- La serialización evita la competencia por recursos compartidos (archivos de sesión, registros, entrada estándar de la CLI) y reduce la probabilidad de alcanzar los límites de frecuencia de los servicios externos.

## Funcionamiento

- Una cola FIFO con carriles vacía cada carril con un límite de concurrencia configurable (1 de forma predeterminada para los carriles sin configurar; `main` tiene un valor predeterminado de 4 y `subagent`, de 8).
- `runEmbeddedAgent` encola por **clave de sesión** (carril `session:<key>`) para garantizar que solo haya una ejecución activa por sesión.
- A continuación, cada ejecución de sesión se encola en un **carril global** (`main` de forma predeterminada), de modo que `agents.defaults.maxConcurrent` limite el paralelismo general.
- Cuando se habilita el registro detallado, las ejecuciones en cola emiten un breve aviso si esperaron más de unos 2 segundos antes de comenzar.
- Los indicadores de escritura se activan inmediatamente al encolar (cuando el canal los admite), por lo que la experiencia del usuario no cambia mientras la ejecución espera su turno.

## Valores predeterminados

Cuando no se especifican, todas las superficies de canales entrantes utilizan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

La redirección dentro del mismo turno es el comportamiento predeterminado. Un prompt que llega durante una ejecución se inyecta en el entorno de ejecución activo cuando este puede aceptar la redirección, por lo que no se inicia una segunda ejecución de sesión. Si la ejecución activa no puede aceptar la redirección, OpenClaw espera a que termine antes de iniciar el prompt.

## Modos de cola

`/queue` controla qué hacen los mensajes entrantes normales cuando una sesión ya tiene una ejecución activa:

- `steer`: inyecta los mensajes en el entorno de ejecución activo. OpenClaw entrega todos los mensajes de redirección pendientes **después de que el turno actual del asistente termina de ejecutar sus llamadas a herramientas**, antes de la siguiente llamada al LLM; el servidor de aplicaciones de Codex recibe un único `turn/steer` por lotes. Si la ejecución no está transmitiendo activamente o la redirección no está disponible, OpenClaw espera hasta que termine la ejecución activa antes de iniciar el prompt.
- `followup`: no redirige. Encola cada mensaje para un turno posterior del agente una vez finalizada la ejecución actual.
- `collect`: no redirige. Combina los mensajes en cola en un **único** turno de seguimiento después del intervalo de inactividad. Si los mensajes se dirigen a canales o hilos diferentes, se procesan individualmente para conservar el enrutamiento.
- `interrupt`: cancela la ejecución activa de esa sesión y, a continuación, ejecuta el mensaje más reciente.

Para obtener información sobre los tiempos específicos del entorno de ejecución y el comportamiento de las dependencias, consulta [Cola de redirección](/es/concepts/queue-steering). Para conocer el comando explícito `/steer <message>`, consulta [Redirigir](/es/tools/steer).

Configúralo globalmente o por canal mediante `messages.queue`:

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

- `debounceMs`: intervalo de inactividad antes de procesar los seguimientos en cola o los lotes combinados; en el modo `steer` de Codex, intervalo de inactividad antes de enviar el `turn/steer` por lotes. Los números sin unidades se interpretan como milisegundos; las opciones de `/queue` aceptan las unidades `ms`, `s`, `m`, `h` y `d`.
- `cap`: número máximo de mensajes en cola por sesión. Se ignoran los valores inferiores a `1`.
- `drop: "summarize"` (predeterminado): descarta las entradas más antiguas de la cola según sea necesario, conserva resúmenes compactos y los inyecta como un prompt de seguimiento sintético.
- `drop: "old"`: descarta las entradas más antiguas de la cola según sea necesario, sin conservar resúmenes.
- `drop: "new"`: rechaza el mensaje más reciente cuando la cola ya está llena.

Valores predeterminados: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Redirección y transmisión

Cuando la transmisión del canal es `partial` o `block`, la redirección puede parecer una serie de respuestas visibles breves mientras la ejecución activa alcanza los límites del entorno de ejecución:

- `partial`: la vista previa puede finalizar antes de tiempo y, después, comienza una nueva cuando se acepta la redirección.
- `block`: los bloques del tamaño de un borrador pueden producir la misma apariencia secuencial.
- Sin transmisión, la redirección recurre a un seguimiento posterior a la ejecución activa cuando el entorno de ejecución no puede aceptar la redirección dentro del mismo turno.

`steer` no cancela las herramientas que están en ejecución. Utiliza `/queue interrupt` cuando el mensaje más reciente deba cancelar la ejecución actual.

## Precedencia

Para seleccionar el modo, OpenClaw resuelve:

1. La anulación de `/queue` por sesión, insertada en línea o almacenada.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. El valor predeterminado `steer`.

Para las opciones, las opciones de `/queue` insertadas en línea o almacenadas tienen prioridad sobre la configuración. A continuación, se aplican, en este orden, la espera por canal (`messages.queue.debounceMsByChannel`), los valores predeterminados de espera del Plugin, las opciones globales de `messages.queue` y los valores predeterminados integrados. `cap` y `drop` son opciones globales o de sesión, no claves de configuración por canal.

## Anulaciones por sesión

- Envía `/queue <steer|followup|collect|interrupt>` como comando independiente para almacenar el modo de cola de la sesión actual.
- Las opciones se pueden combinar: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` borra la anulación de la sesión.

## Cancelación de turnos en cola

Mientras un prompt permanece en la cola de seguimiento o combinación (por ejemplo, un `chat.send` de la TUI o del chat web que llega mientras hay otro turno activo), el Gateway conserva una **identidad de cancelación propiedad del Gateway** para el `runId` de ese cliente hasta que el contenido en cola se ejecute o se descarte. La identidad acompaña al contenido incorporado a un resumen de desbordamiento.

- `chat.abort` con un `runId` específico cancela ese turno mientras siga en cola, si el solicitante tiene autorización (se aplican las mismas reglas de propiedad que a las ejecuciones activas).
- `chat.abort` para una sesión sin `runId` cancela **primero los turnos en cola autorizados** y, después, cancela las ejecuciones activas autorizadas. Ese orden evita que el procesamiento de la cola promueva trabajo a una sesión detenida parcialmente.
- Vaciar toda la cola de la sesión sin comprobaciones por solicitante no es la ruta de detención para las sesiones con varios propietarios.
- Las esperas en cola no se muestran como ejecuciones activas del agente en `sessions.list` ni poseen la semántica de tiempo de espera de las ejecuciones activas; solo la fase activa la posee.

Los clientes (incluida la TUI) reenvían los prompts recibidos durante una ejecución y permiten que el Gateway aplique el modo de cola. Esc/`/stop` utiliza una cancelación en el ámbito de la sesión para que la pérdida de identificadores locales no deje ejecutándose un prompt que aún permanece en cola.

## Ámbito y garantías

- Se aplica a las ejecuciones de respuesta automática del agente en todos los canales entrantes que utilizan la canalización de respuestas del Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, chat web, etc.).
- El carril predeterminado (`main`) se comparte en todo el proceso para las entradas y los heartbeats principales; establece `agents.defaults.maxConcurrent` para permitir varias sesiones en paralelo.
- Pueden existir carriles adicionales (por ejemplo, `cron`, `cron-nested`, `nested`, `subagent`) para que los trabajos en segundo plano puedan ejecutarse en paralelo sin bloquear las respuestas entrantes. Los turnos aislados del agente de cron mantienen una posición de `cron` mientras su ejecución interna del agente utiliza `cron-nested`; ambos utilizan `cron.maxConcurrentRuns`. Los flujos `nested` compartidos que no son de cron conservan su propio comportamiento de carril. Estas ejecuciones desacopladas se registran como [tareas en segundo plano](/es/automation/tasks).
- Los carriles por sesión garantizan que solo una ejecución del agente interactúe con una sesión determinada a la vez.
- Sin dependencias externas ni subprocesos de trabajo en segundo plano; solo TypeScript y promesas.

## Solución de problemas

- Si los comandos parecen bloqueados, habilita los registros detallados y busca líneas con "queued for ...ms" para confirmar que la cola se está procesando.
- Las ejecuciones del servidor de aplicaciones de Codex que aceptan un turno y después dejan de emitir progreso son interrumpidas por el adaptador de Codex para que el carril de sesión activo pueda liberarse en lugar de esperar al tiempo de espera de la ejecución externa.
- Cuando se habilitan los diagnósticos, las sesiones que permanecen en `processing` más allá de `diagnostics.stuckSessionWarnMs` sin que se observe ninguna respuesta ni progreso de herramientas, estado, bloques o ACP se clasifican según la actividad actual:
  - El trabajo activo con progreso reciente se registra como `session.long_running`. Las llamadas silenciosas al modelo con propietario también permanecen como `session.long_running` hasta `diagnostics.stuckSessionAbortMs`, para que los proveedores lentos o sin transmisión no se identifiquen como bloqueados demasiado pronto.
  - El trabajo activo sin progreso reciente se registra como `session.stalled`; las llamadas al modelo con propietario, las llamadas a herramientas bloqueadas y las ejecuciones integradas bloqueadas cambian a `session.stalled` al alcanzar o superar el umbral de cancelación. La actividad obsoleta de modelos o herramientas sin propietario no se oculta como una ejecución prolongada.
  - `session.stuck` se reserva para los registros administrativos obsoletos y recuperables de una sesión, incluidas las sesiones inactivas en cola con actividad obsoleta de modelos o herramientas sin propietario.
  - `session.stuck` siempre activa una recuperación que puede liberar el carril de la sesión afectada. Una clasificación `session.stalled` que supere `diagnostics.stuckSessionAbortMs` (llamada a herramienta bloqueada, llamada al modelo bloqueada o ejecución integrada bloqueada) también puede activar una recuperación mediante cancelación activa, por lo que ambas clasificaciones pueden desbloquear una cola, no solo `session.stuck`.
  - Las líneas de advertencia repetidas de `session.stuck` y `session.long_running` en el registro aumentan exponencialmente el intervalo entre emisiones mientras la sesión permanece sin cambios; los intentos de recuperación siguen ejecutándose en cada ciclo de Heartbeat, independientemente de ese aumento.

## Temas relacionados

- [Gestión de sesiones](/es/concepts/session)
- [Cola de redirección](/es/concepts/queue-steering)
- [Redirigir](/es/tools/steer)
- [Política de reintentos](/es/concepts/retry)
