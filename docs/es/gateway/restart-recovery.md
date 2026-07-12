---
read_when:
    - Quieres saber si reiniciar el Gateway hace que se pierda el trabajo del agente en curso
    - Una ejecución del agente se interrumpió debido a un reinicio, un fallo o una recarga de la configuración
    - Está depurando la recuperación automática de la sesión después de que el Gateway vuelve a estar operativo
summary: 'Qué sobrevive a un reinicio o fallo del Gateway: los turnos interrumpidos del agente se reanudan automáticamente, los subagentes y las tareas en segundo plano se recuperan, y las entregas en cola se procesan.'
title: Recuperación tras el reinicio
x-i18n:
    generated_at: "2026-07-12T14:32:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b2701cb9cdc5aabffc395a2956260389cbe81a6c3ca2876830ef4ed83db2fb53
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Reiniciar el Gateway no provoca la pérdida del estado de los agentes. Las conversaciones, las transcripciones,
los trabajos programados, los registros de tareas en segundo plano y los mensajes salientes en cola se almacenan
en disco, y el trabajo que se haya interrumpido durante un turno se detecta y se reanuda
automáticamente cuando el Gateway vuelve a estar operativo. No se requiere ninguna intervención
manual ni hay nada que configurar: la recuperación siempre está activa.

Esta página describe qué se conserva tras un reinicio, cómo se detecta el trabajo interrumpido
y cómo funciona la reanudación automática.

## Qué se conserva tras un reinicio

| Estado                                | Almacenamiento                                                | Comportamiento tras el reinicio                                                |
| ------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Historial de conversaciones           | Transcripciones JSONL + almacén de sesiones por agente en disco | No se modifica; las sesiones continúan desde la transcripción almacenada       |
| Turno interrumpido de la sesión principal | Marcadores de recuperación en el almacén de sesiones          | Se reanuda automáticamente unos segundos después del inicio                    |
| Ejecuciones de subagentes             | SQLite (base de datos de estado compartida)                   | El registro se restaura al arrancar; las ejecuciones interrumpidas se reanudan |
| Tareas en segundo plano               | SQLite (base de datos de estado compartida)                   | Se concilian al arrancar; las ejecuciones huérfanas se recuperan o se marcan como perdidas |
| Entregas salientes en cola            | Cola de entrega de SQLite                                     | Se procesan tras el reinicio; se reintentan las respuestas no entregadas       |
| Trabajos programados (Cron)           | Almacén de Cron de SQLite                                     | Las programaciones persisten; el planificador se rearma al arrancar            |
| Continuación tras el reinicio         | Centinela de reinicio de SQLite                               | Se envía un seguimiento único a la sesión que solicitó el reinicio             |

## Los reinicios controlados esperan primero a que termine el trabajo

Un reinicio solicitado (`openclaw gateway restart`, un cambio de configuración que requiere
un reinicio o una actualización del Gateway) no finaliza de inmediato el trabajo en curso. El
Gateway deja de aceptar trabajo nuevo y espera a que terminen los turnos de agentes y las
tareas en segundo plano activos, hasta agotar un tiempo de espera de drenaje (5 minutos de forma predeterminada). Por
tanto, la mayoría de los reinicios no interrumpen absolutamente nada.

Solo se cancela el trabajo que no puede terminar dentro del tiempo de espera de drenaje (o cualquier ejecución interrumpida
por un reinicio forzado o un fallo) y, antes de que esto ocurra, cada
sesión afectada se marca para su recuperación.

## Cómo se detecta el trabajo interrumpido

Dos mecanismos complementarios marcan las sesiones cuyo turno no terminó:

- **Durante el apagado:** mientras se espera a que termine el trabajo antes del reinicio, cada sesión con una ejecución activa
  recibe un marcador de recuperación en el almacén de sesiones antes de que la ejecución
  se cancele.
- **Durante el inicio:** el Gateway examina los almacenes de sesiones en busca de sesiones que aún
  indiquen que están en ejecución, pero que no tengan un propietario activo en el proceso nuevo. Esto permite detectar
  fallos graves y finalizaciones forzadas en los que no se ejecutó ningún código de apagado. Al mismo tiempo, se limpian
  los archivos de bloqueo obsoletos de las transcripciones.

## Reanudación automática

Unos segundos después del inicio, el Gateway vuelve a enviar cada sesión marcada
con un mensaje sintético del sistema que informa al agente de que su turno anterior se
interrumpió debido a un reinicio y le indica que continúe desde la transcripción existente. Si ya
se había generado una respuesta final, pero no se había entregado, se incluye su texto
para que el agente pueda entregarla en lugar de repetir el trabajo. La recuperación realiza hasta
3 intentos con espera exponencial.

Antes de reanudar, el Gateway comprueba que sea seguro continuar desde el final de
la transcripción. Si no lo es (por ejemplo, si el turno terminó con una aprobación pendiente
obsoleta), la sesión no se vuelve a ejecutar a ciegas; en su lugar, el agente publica un breve
aviso para pedir al usuario que vuelva a enviar la última solicitud.

OpenClaw también puede reconstruir el trabajo interrumpido de solo lectura del [Modo de código](/es/reference/code-mode).
El Modo de código marca estas ejecuciones como seguras frente a reinicios y rechaza las herramientas
de catálogo o los espacios de nombres de plugins con efectos secundarios antes de que se ejecuten. Si un reinicio se produce
en el control `wait`, el nuevo Gateway reconstruye el turno a partir de su transcripción
y obliga a que la ejecución reconstruida siga siendo segura frente a reinicios, incluso si el
modelo omite o elimina ese indicador. El host limita todo el turno reconstruido
a herramientas principales de solo lectura auditadas y herramientas de plugins explícitamente seguras para su repetición,
incluso cuando el Modo de código se desactiva después del reinicio. El trabajo con efectos secundarios
sigue estando protegido por el aviso de reenvío, en lugar de arriesgarse a realizar una escritura duplicada.

### Subagentes

Las ejecuciones de subagentes se conservan en la base de datos de estado compartida de SQLite, por lo que el
registro de subagentes se mantiene entre procesos. Al arrancar, se restaura el registro y
las sesiones de subagentes interrumpidas se reanudan con el contexto de su tarea original.
Se aplican dos mecanismos de seguridad:

- Las ejecuciones interrumpidas hace más de 2 horas se finalizan en lugar de reanudarse, para que
  un Gateway que haya permanecido inactivo durante la noche no reactive trabajo obsoleto.
- Una sesión cuya recuperación falle repetidamente se marca de forma permanente como bloqueada para que
  la recuperación no pueda repetirse indefinidamente.

### Tareas en segundo plano

El [registro de tareas en segundo plano](/es/automation/tasks) utiliza SQLite y
se concilia al arrancar y a intervalos periódicos: se recuperan los resultados duraderos registrados por
las ejecuciones finalizadas, y las ejecuciones cuyo proceso propietario haya desaparecido se
marcan como perdidas después de un período de gracia, en lugar de quedar bloqueadas indefinidamente.

### Reinicios solicitados por el agente

Cuando el propio agente inicia un reinicio (al aplicar un cambio de configuración, actualizar
el Gateway o realizar una solicitud explícita de reinicio), se escribe un centinela de reinicio en
SQLite antes de que finalice el proceso. Después de arrancar, el Gateway publica el resultado en
el chat de origen y envía un turno de continuación único para que el
agente retome el trabajo exactamente donde lo dejó, en el mismo canal e hilo.

## Mecanismos de seguridad y observabilidad

- **Interruptor de bucles de fallos:** 3 arranques incorrectos en un período de 5 minutos activan un interruptor que
  impide que los servicios auxiliares se inicien automáticamente en el siguiente arranque, para que un Gateway con fallos
  no agrave el problema. Se restablece cuando finaliza el intervalo de arranques incorrectos.
- **Métricas:** la actividad de recuperación se exporta mediante
  [Prometheus](/es/gateway/prometheus) como `openclaw_session_recovery_total` y
  `openclaw_session_recovery_age_seconds`.
- **Registros:** las decisiones de recuperación se registran en los subsistemas
  `main-session-restart-recovery` y `subagent-interrupted-resume`.

## Qué no se reanuda

- Las sesiones excluidas de la recuperación de la sesión principal porque ya las gestiona otro
  propietario: sesiones de subagentes (recuperación de subagentes), sesiones de Cron (el
  planificador vuelve a ejecutarlas según su programación) y sesiones administradas por ACP (el IDE
  o cliente conectado se encarga de la reanudación).
- Las sesiones cuyo final de transcripción no permite continuar de forma segura; estas reciben el
  aviso de reenvío descrito anteriormente en lugar de volver a ejecutarse silenciosamente.
- El trabajo que nunca se admitió: los mensajes que llegan durante el período de drenaje se
  rechazan con un error explícito de reinicio, en lugar de ponerse silenciosamente en cola en un
  proceso que está finalizando.
