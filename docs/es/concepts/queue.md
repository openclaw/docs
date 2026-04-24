---
read_when:
    - Cambiar la ejecución de respuesta automática o la concurrencia
summary: Diseño de cola de comandos que serializa ejecuciones de respuesta automática entrantes
title: Cola de comandos
x-i18n:
    generated_at: "2026-04-24T05:26:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa442e9aa2f0d6d95770d43e987d19ce8d9343450b302ee448e1fa4ab3feeb15
    source_path: concepts/queue.md
    workflow: 15
---

# Cola de comandos (2026-01-16)

Serializamos las ejecuciones de respuesta automática entrantes (todos los canales) mediante una pequeña cola en proceso para evitar que varias ejecuciones del agente colisionen, y al mismo tiempo permitir paralelismo seguro entre sesiones.

## Por qué

- Las ejecuciones de respuesta automática pueden ser costosas (llamadas LLM) y pueden colisionar cuando llegan varios mensajes entrantes con poca diferencia de tiempo.
- Serializar evita competir por recursos compartidos (archivos de sesión, registros, stdin de CLI) y reduce la probabilidad de límites de tasa ascendentes.

## Cómo funciona

- Una cola FIFO consciente de lanes vacía cada lane con un límite de concurrencia configurable (predeterminado 1 para lanes no configurados; `main` usa por defecto 4, `subagent` 8).
- `runEmbeddedPiAgent` encola por **clave de sesión** (lane `session:<key>`) para garantizar que solo haya una ejecución activa por sesión.
- Luego, cada ejecución de sesión se encola en un **lane global** (`main` por defecto) para que el paralelismo general quede limitado por `agents.defaults.maxConcurrent`.
- Cuando el registro detallado está habilitado, las ejecuciones en cola emiten un aviso breve si esperaron más de ~2 s antes de comenzar.
- Los indicadores de escritura siguen activándose inmediatamente al encolar (cuando el canal lo admite), por lo que la experiencia del usuario no cambia mientras espera su turno.

## Modos de cola (por canal)

Los mensajes entrantes pueden dirigir la ejecución actual, esperar un turno de seguimiento o hacer ambas cosas:

- `steer`: se inyecta inmediatamente en la ejecución actual (cancela llamadas de herramientas pendientes después del siguiente límite de herramienta). Si no hay streaming, recurre a seguimiento.
- `followup`: se encola para el siguiente turno del agente después de que termine la ejecución actual.
- `collect`: fusiona todos los mensajes en cola en un **único** turno de seguimiento (predeterminado). Si los mensajes apuntan a canales/hilos distintos, se vacían individualmente para preservar el enrutamiento.
- `steer-backlog` (también `steer+backlog`): dirige ahora **y** conserva el mensaje para un turno de seguimiento.
- `interrupt` (heredado): aborta la ejecución activa de esa sesión y luego ejecuta el mensaje más reciente.
- `queue` (alias heredado): igual que `steer`.

Steer-backlog significa que puedes obtener una respuesta de seguimiento después de la ejecución dirigida, por lo que
las superficies con streaming pueden parecer duplicadas. Prefiere `collect`/`steer` si quieres
una respuesta por mensaje entrante.
Envía `/queue collect` como comando independiente (por sesión) o establece `messages.queue.byChannel.discord: "collect"`.

Valores predeterminados (cuando no se definen en la configuración):

- Todas las superficies → `collect`

Configura globalmente o por canal mediante `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opciones de cola

Las opciones se aplican a `followup`, `collect` y `steer-backlog` (y a `steer` cuando recurre a seguimiento):

- `debounceMs`: espera a que haya silencio antes de iniciar un turno de seguimiento (evita “continúa, continúa”).
- `cap`: máximo de mensajes en cola por sesión.
- `drop`: política de desbordamiento (`old`, `new`, `summarize`).

Summarize mantiene una lista breve con viñetas de mensajes descartados y la inyecta como prompt sintético de seguimiento.
Valores predeterminados: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Sobrescrituras por sesión

- Envía `/queue <mode>` como comando independiente para guardar el modo de la sesión actual.
- Las opciones se pueden combinar: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` o `/queue reset` borra la sobrescritura de la sesión.

## Alcance y garantías

- Se aplica a ejecuciones del agente de respuesta automática en todos los canales entrantes que usan la canalización de respuesta del gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- El lane predeterminado (`main`) es de todo el proceso para entrantes + Heartbeat principales; establece `agents.defaults.maxConcurrent` para permitir varias sesiones en paralelo.
- Pueden existir lanes adicionales (por ejemplo, `cron`, `subagent`) para que los trabajos en segundo plano se ejecuten en paralelo sin bloquear respuestas entrantes. Estas ejecuciones desacopladas se rastrean como [tareas en segundo plano](/es/automation/tasks).
- Los lanes por sesión garantizan que solo una ejecución del agente toque una sesión dada a la vez.
- Sin dependencias externas ni hilos de worker en segundo plano; TypeScript puro + promesas.

## Solución de problemas

- Si los comandos parecen bloqueados, habilita los registros detallados y busca líneas “queued for …ms” para confirmar que la cola se está vaciando.
- Si necesitas profundidad de cola, habilita registros detallados y observa las líneas de temporización de la cola.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Política de reintentos](/es/concepts/retry)
