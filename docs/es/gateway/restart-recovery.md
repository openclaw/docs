---
read_when:
    - Quieres saber si reiniciar el Gateway hace que se pierda el trabajo en curso del agente
    - Una ejecución del agente fue interrumpida por un reinicio, un fallo o una recarga de la configuración
    - Está depurando la recuperación automática de la sesión después de que el Gateway vuelve a estar operativo
summary: 'Qué persiste tras un reinicio o fallo del Gateway: los turnos interrumpidos del agente se reanudan automáticamente, los subagentes y las tareas en segundo plano se recuperan, y las entregas en cola se procesan'
title: Recuperación tras el reinicio
x-i18n:
    generated_at: "2026-07-14T13:41:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 4c03eb16ff37f1d412647b9ae8933a524cc1bc705b1cfd486ce8542699336785
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Reiniciar el Gateway no provoca la pérdida del estado del agente. Las conversaciones, las transcripciones,
los trabajos programados, los registros de tareas en segundo plano y los mensajes salientes en cola se almacenan
en disco, y el trabajo que se interrumpió a mitad de un turno se detecta y se reanuda
automáticamente después de que el Gateway vuelve a estar disponible. No se requiere ninguna intervención
manual ni hay nada que configurar: la recuperación siempre está activada.

Esta página describe qué elementos sobreviven a un reinicio, cómo se detecta el trabajo interrumpido
y cómo funciona la reanudación automática.

## Qué sobrevive a un reinicio

| Estado                        | Almacenamiento                               | Comportamiento durante el reinicio                                      |
| ----------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| Historial de conversaciones   | Base de datos SQLite por agente              | No se modifica; las sesiones continúan desde la transcripción almacenada |
| Turno interrumpido de la sesión principal | Fila de sesión y transcripción de SQLite por agente | Se reanuda automáticamente unos segundos después del inicio             |
| Ejecuciones de subagentes     | SQLite (base de datos de estado compartida)  | El registro se restaura al arrancar; las ejecuciones interrumpidas se reanudan |
| Tareas en segundo plano       | SQLite (base de datos de estado compartida)  | Se concilian al arrancar; las ejecuciones huérfanas se recuperan o se marcan como perdidas |
| Entregas salientes en cola    | Cola de entregas de SQLite                   | Se procesa después del reinicio; se reintentan las respuestas no entregadas |
| Trabajos programados (cron)   | Almacén de cron de SQLite                    | Las programaciones se conservan; el planificador se reactiva al arrancar |
| Continuación tras el reinicio | Centinela de reinicio de SQLite              | Se envía una continuación única a la sesión que solicitó el reinicio    |

## Los reinicios ordenados esperan primero a que termine el trabajo

Un reinicio solicitado (`openclaw gateway restart`, un cambio de configuración que requiere
un reinicio o una actualización del Gateway) no finaliza inmediatamente el trabajo en curso. El
Gateway deja de aceptar trabajo nuevo y espera a que finalicen los turnos activos de los agentes y
las tareas en segundo plano, hasta agotar un margen de espera (5 minutos de forma predeterminada). Por tanto, la mayoría
de los reinicios no interrumpen ningún trabajo.

Solo se cancela el trabajo que no puede finalizar dentro del margen de espera (o cualquier ejecución interrumpida
por un reinicio forzado o un bloqueo), y antes de que esto ocurra, cada
sesión afectada se marca para su recuperación.

## Cómo se detecta el trabajo interrumpido

Tres mecanismos complementarios marcan las sesiones cuyo turno no finalizó:

- **Al admitirlo en la interfaz de control:** para un turno de texto normal en una sesión
  principal existente, el Gateway añade el mensaje del usuario, marca la sesión como en ejecución y
  registra su declaración de entrega exclusiva de la transcripción en una única transacción de SQLite antes de
  devolver la confirmación `started`.
  Los comandos, los archivos adjuntos, las anulaciones por turno, las entregas pendientes, las indicaciones de cancelación
  anteriores, las sesiones gestionadas por plugins y los turnos con enlaces de ejecución mantienen sus
  rutas de admisión especializadas.
- **Al apagar:** durante la espera del reinicio, cada sesión con una ejecución activa
  recibe una marca de recuperación en el almacén de sesiones antes de que se
  cancele la ejecución.
- **Al iniciar:** el Gateway examina los almacenes de sesiones en busca de aquellas que todavía
  indican que están en ejecución, pero que no tienen un propietario activo en el nuevo proceso. Esto detecta
  bloqueos graves y finalizaciones en los que no se ejecutó ningún código de apagado. Los archivos obsoletos de
  bloqueo de transcripciones se limpian al mismo tiempo.

## Reanudación automática

Unos segundos después del inicio, el Gateway vuelve a enviar cada sesión marcada
con un mensaje sintético del sistema que indica al agente que su turno anterior fue
interrumpido por un reinicio y que debe continuar desde la transcripción existente. Si ya se
había generado una respuesta final, pero no se había entregado, se incluye su texto
para que el agente pueda entregarla en lugar de repetir el trabajo. La recuperación se reintenta
hasta 3 veces con espera exponencial. Cada reintento reutiliza un identificador de envío
persistente, por lo que un fallo de conexión ambiguo no puede iniciar dos veces la misma
recuperación. Los turnos completados y no reanudables de la interfaz de control también conservan
marcadores de idempotencia persistentes y limitados, lo que permite que una bandeja de salida que vuelve a conectarse los retire
sin volver a ejecutar la solicitud.

Antes de reanudar, el Gateway comprueba que sea seguro continuar desde el final de
la transcripción. Si no lo es (por ejemplo, si el turno terminó con una aprobación pendiente
obsoleta), la sesión no se vuelve a ejecutar a ciegas; en su lugar, el agente publica un breve
aviso que solicita al usuario que vuelva a enviar la última solicitud. En WebChat, ese aviso se
escribe directamente en el historial de la sesión para que siga visible después de volver a conectarse.

OpenClaw también puede reconstruir el trabajo interrumpido de solo lectura de [Code Mode](/es/reference/code-mode).
Code Mode marca estas ejecuciones como seguras frente a reinicios y rechaza las herramientas de catálogo con efectos secundarios
o los espacios de nombres de plugins antes de que se ejecuten. Si un reinicio ocurre en
el control `wait`, el nuevo Gateway reconstruye el turno a partir de su transcripción
y fuerza que la ejecución reconstruida siga siendo segura frente a reinicios, incluso si el
modelo omite o desactiva esa opción. El host restringe todo el turno reconstruido
a herramientas centrales auditadas de solo lectura y herramientas de plugins explícitamente seguras para su repetición,
incluso cuando Code Mode se desactiva después del reinicio. El trabajo con efectos secundarios
sigue protegido mediante el aviso de reenvío en lugar de arriesgarse a una escritura duplicada.

### Subagentes

Las ejecuciones de subagentes se conservan en la base de datos de estado compartida de SQLite, por lo que el
registro de subagentes sobrevive al proceso. Al arrancar, el registro se restaura y
las sesiones de subagentes interrumpidas se reanudan con el contexto de su tarea original.
Se aplican dos mecanismos de seguridad:

- Las ejecuciones interrumpidas hace más de 2 horas se finalizan en lugar de reanudarse, para que
  un Gateway que estuvo inactivo durante la noche no reactive trabajo obsoleto.
- Una sesión que no logra recuperarse repetidamente se marca con un marcador permanente como bloqueada para que
  la recuperación no pueda repetirse indefinidamente.

### Tareas en segundo plano

El [registro de tareas en segundo plano](/es/automation/tasks) está respaldado por SQLite y
se concilia al arrancar y en intervalos periódicos: se recuperan los resultados persistentes registrados por
las ejecuciones finalizadas, y las ejecuciones cuyo proceso propietario desapareció se
marcan como perdidas después de un periodo de gracia, en lugar de quedar bloqueadas indefinidamente.

### Reinicios solicitados por el agente

Cuando el propio agente activa un reinicio (al aplicar un cambio de configuración, actualizar
el Gateway o mediante una solicitud explícita de reinicio), se escribe un centinela de reinicio en
SQLite antes de que finalice el proceso. Después del arranque, el Gateway publica el resultado en
el chat de origen y envía un turno de continuación único para que el
agente retome el trabajo exactamente donde lo dejó, en el mismo canal e hilo.

## Mecanismos de seguridad y observabilidad

- **Interruptor de bucle de bloqueos:** 3 arranques incorrectos en un intervalo de 5 minutos activan un interruptor que
  impide el inicio automático de los servicios auxiliares en el siguiente arranque, para que un Gateway que
  se bloquea no agrave el problema. Se recupera cuando expira el intervalo de arranques incorrectos.
- **Métricas:** la actividad de recuperación se exporta mediante
  [Prometheus](/es/gateway/prometheus) como `openclaw_session_recovery_total` y
  `openclaw_session_recovery_age_seconds`.
- **Registros:** las decisiones de recuperación se registran en los subsistemas
  `main-session-restart-recovery` y `subagent-interrupted-resume`.

## Qué no se reanuda

- Las sesiones excluidas de la recuperación de la sesión principal porque otro propietario ya
  se encarga de ellas: sesiones de subagentes (recuperación de subagentes), sesiones de cron (el
  planificador vuelve a ejecutarlas según lo programado) y sesiones gestionadas por ACP (el IDE
  o cliente conectado se encarga de la reanudación).
- Las sesiones cuyo final de transcripción no permite continuar de forma segura; estas reciben el
  aviso de reenvío descrito anteriormente en lugar de una nueva ejecución silenciosa.
- El trabajo que nunca se admitió: los mensajes que llegan durante el periodo de espera
  se rechazan con un error explícito de reinicio, en lugar de colocarse silenciosamente en la cola de un
  proceso que está finalizando.
