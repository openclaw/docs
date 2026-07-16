---
read_when:
    - Quieres saber si reiniciar el Gateway hace que se pierda el trabajo del agente en curso
    - Una ejecución del agente se interrumpió debido a un reinicio, un fallo o una recarga de la configuración
    - Se está depurando la recuperación automática de la sesión después de que el Gateway vuelva a estar operativo
summary: 'Qué sobrevive a un reinicio o fallo del Gateway: los turnos interrumpidos del agente se reanudan automáticamente, los subagentes y las tareas en segundo plano se recuperan, y las entregas en cola se procesan.'
title: Recuperación tras el reinicio
x-i18n:
    generated_at: "2026-07-16T11:39:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2fc0263d792e78e75fb97be44671b44287d469b949e11640f11b6ff651dafb9
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Reiniciar el Gateway no provoca la pérdida del estado del agente. Las conversaciones, las transcripciones,
los trabajos programados, los registros de tareas en segundo plano y los mensajes salientes en cola se almacenan
en disco, y el trabajo que se haya interrumpido a mitad de un turno se detecta y reanuda
automáticamente cuando el Gateway vuelve a estar operativo. No se requiere ninguna intervención
manual ni hay nada que configurar: la recuperación está siempre activada.

Esta página describe qué se conserva tras un reinicio, cómo se detecta el trabajo interrumpido
y cómo funciona la reanudación automática.

## Qué se conserva tras un reinicio

| Estado                        | Almacenamiento                              | Comportamiento tras el reinicio                                         |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Historial de conversaciones   | Base de datos SQLite por agente             | No se modifica; las sesiones continúan desde la transcripción almacenada |
| Turno interrumpido de la sesión principal | Fila de sesión y transcripción de SQLite por agente | Se reanuda o concilia automáticamente unos segundos después del inicio |
| Ejecuciones de subagentes     | SQLite (base de datos de estado compartida) | El registro se restaura al arrancar; las ejecuciones interrumpidas se reanudan |
| Tareas en segundo plano       | SQLite (base de datos de estado compartida) | Se concilian al arrancar; las ejecuciones huérfanas se recuperan o se marcan como perdidas |
| Entregas salientes en cola    | Cola de entrega de SQLite                   | Se procesan tras el reinicio; se reintentan las respuestas no entregadas |
| Trabajos programados (cron)   | Almacén cron de SQLite                      | Las programaciones se conservan; el planificador se reactiva al arrancar |
| Continuación tras el reinicio | Centinela de reinicio de SQLite             | Se envía un seguimiento único a la sesión que solicitó el reinicio      |

## Los reinicios controlados esperan primero a que termine el trabajo

Un reinicio solicitado (`openclaw gateway restart`, un cambio de configuración que requiere
un reinicio o una actualización del Gateway) no finaliza de inmediato el trabajo en curso. El
Gateway deja de aceptar trabajo nuevo y espera a que finalicen los turnos activos del agente y
las tareas en segundo plano, hasta agotar un margen de espera (5 minutos de forma predeterminada). Por tanto, la mayoría
de los reinicios no interrumpen ningún trabajo.

Solo se cancela el trabajo que no puede finalizar dentro del margen de espera (o cualquier ejecución interrumpida
por un reinicio forzado o un fallo), y antes de que esto ocurra, cada
sesión afectada se marca para su recuperación.

## Cómo se detecta el trabajo interrumpido

Tres mecanismos complementarios marcan las sesiones cuyo turno no finalizó:

- **Al admitir el turno:** para un turno de texto normal en una sesión principal existente,
  el Gateway añade el mensaje del usuario, marca la sesión como en ejecución y registra
  su reclamación de entrega de recuperación en una transacción de SQLite antes de ejecutar el modelo o
  el hook `before_agent_reply`. Control UI lo hace antes de devolver la
  confirmación `started`; el envío del canal lo hace cuando el turno preparado
  adopta la ejecución del agente.
  Los comandos, los archivos adjuntos, las sustituciones por turno, las entregas pendientes, las indicaciones previas de cancelación,
  las sesiones gestionadas por plugins y los turnos con hooks de ejecución conservan sus
  rutas de admisión especializadas.
  Si hay instalado un hook `before_agent_reply`, la admisión también registra su fase.
  La recuperación nunca vuelve a ejecutar un hook interrumpido a mitad de una llamada. Cuando finaliza un hook no gestionado,
  su punto de control registra ese resultado, pero la recuperación sigue bloqueándose de forma segura
  mientras dicho hook permanezca activo: un punto de control no puede demostrar que el mismo
  código y configuración del plugin se hayan cargado tras el reinicio. Los resultados de texto gestionados y
  los resultados silenciosos se registran en puntos de control independientes para una resolución determinista.
  Las reclamaciones de recuperación persistentes escritas por versiones anteriores no tienen ningún marcador
  de propiedad de origen, por lo que reciben la misma comprobación de bloqueo seguro del hook durante una actualización.
- **Al apagar:** durante la espera del reinicio, cada sesión con una ejecución activa
  recibe un marcador de recuperación en el almacén de sesiones antes de que se
  cancele la ejecución.
- **Al iniciar:** el Gateway analiza los almacenes de sesiones en busca de sesiones que aún
  afirmen estar en ejecución, pero que no tengan un propietario activo en el proceso nuevo. Esto detecta
  fallos graves y finalizaciones en los que no se ejecutó ningún código de apagado. Los archivos obsoletos de bloqueo
  de transcripciones se limpian al mismo tiempo.

## Reanudación automática

Unos segundos después del inicio, el Gateway vuelve a enviar cada sesión marcada
con un mensaje sintético del sistema que informa al agente de que su turno anterior fue
interrumpido por un reinicio y que debe continuar desde la transcripción existente. Si ya se
había generado una respuesta final, pero no se había entregado, se incluye su texto
para que el agente pueda entregarla en lugar de repetir el trabajo. La recuperación se reintenta hasta
3 veces con espera exponencial. Cada reintento reutiliza un único identificador persistente
de envío, por lo que un fallo de conexión ambiguo no puede iniciar dos veces la misma recuperación.
Los turnos completados y no reanudables de Control UI también conservan
marcadores persistentes de idempotencia con límites definidos, lo que permite que una bandeja de salida que vuelva a conectarse los retire sin
volver a ejecutar la solicitud.

Las respuestas enviadas únicamente mediante la herramienta de mensajes usan una segunda correlación persistente. Antes de que un envío terminal
a la misma conversación llegue al canal, el Gateway registra una intención de entrega sin resolver
en la sesión y el turno de origen exactos. Un éxito confirmado del proveedor
la convierte en un recibo persistente de entrega; un fallo confirmado la elimina.
La recuperación completa un recibo de entrega sin volver a ejecutar las herramientas. Si un fallo
deja sin determinar el resultado del proveedor, la recuperación se bloquea de forma segura en lugar de volver a ejecutar
un efecto externo.

La respuesta entregada también se refleja en la transcripción con su ID de mensaje
de origen. Los reflejos terminales usan una clave de recibo distinta, por lo que un envío de progreso con
la misma clave de idempotencia del proveedor no puede ocultar el marcador terminal. Los envíos
de progreso y los recibos de turnos anteriores no pueden completar el turno actual. Solo
las reclamaciones persistentes de entrada del canal pueden restaurar la autorización para realizar acciones de mensajes. Una ejecución
reanudada conserva el modo original de entrega de origen y la correlación de origen, incluidos
la identidad del solicitante y cualquier restricción al mismo canal o hilo, por lo que el mismo recibo
sigue siendo vinculante aunque se produzca otro reinicio durante la recuperación. Un
turno ejecutado únicamente mediante la herramienta de mensajes que no disponga de una autorización de canal reconstruible se bloquea
de forma segura y recibe el aviso único para volver a enviar la solicitud.

Antes de reanudar, el Gateway comprueba que sea seguro continuar desde el final
de la transcripción. Si no lo es (por ejemplo, si el turno terminó con una aprobación pendiente
obsoleta), la sesión no se vuelve a ejecutar de forma indiscriminada; en su lugar, el agente publica un breve
aviso en el que solicita al usuario que vuelva a enviar la última solicitud. Para WebChat, ese aviso se
escribe directamente en el historial de la sesión para que siga visible tras volver a conectarse.

OpenClaw también puede reconstruir trabajo interrumpido de solo lectura de [Modo Código](/es/reference/code-mode).
Modo Código marca estas ejecuciones como seguras ante reinicios y rechaza las herramientas del catálogo
con efectos secundarios o los espacios de nombres de plugins antes de que se ejecuten. Si un reinicio se produce en
el control `wait`, el nuevo Gateway reconstruye el turno a partir de su transcripción
y obliga a que la ejecución reconstruida siga siendo segura ante reinicios, aunque el
modelo omita o desactive esa marca. El host restringe todo el turno reconstruido
a herramientas principales auditadas de solo lectura y herramientas de plugins explícitamente seguras para su repetición,
incluso cuando Modo Código se desactiva después del reinicio. El trabajo con efectos secundarios
sigue protegido mediante el aviso para volver a enviar la solicitud, en lugar de arriesgarse a duplicar una escritura.

### Subagentes

Las ejecuciones de subagentes se conservan en la base de datos de estado compartida de SQLite, por lo que el
registro de subagentes sobrevive al proceso. Al arrancar, se restaura el registro y
las sesiones interrumpidas de subagentes se reanudan con el contexto de su tarea original.
Se aplican dos mecanismos de seguridad:

- Las ejecuciones interrumpidas hace más de 2 horas se finalizan en lugar de reanudarse, para que
  un Gateway que haya permanecido inactivo durante la noche no reactive trabajo obsoleto.
- Una sesión que no logra recuperarse repetidamente se marca como bloqueada mediante un marcador persistente para que
  la recuperación no pueda repetirse indefinidamente.

### Tareas en segundo plano

El [registro de tareas en segundo plano](/es/automation/tasks) utiliza SQLite y
se concilia al arrancar y de forma periódica: se recuperan los resultados persistentes registrados por
las ejecuciones finalizadas, y las ejecuciones cuyo proceso propietario haya desaparecido se
marcan como perdidas después de un periodo de gracia, en lugar de quedar bloqueadas indefinidamente.

### Reinicios solicitados por el agente

Cuando el propio agente activa un reinicio (al aplicar un cambio de configuración, actualizar
el Gateway o mediante una solicitud explícita de reinicio), se escribe un centinela de reinicio en
SQLite antes de que finalice el proceso. Tras arrancar, el Gateway publica el resultado en
el chat de origen y envía un turno de continuación único para que el
agente retome el trabajo exactamente donde lo dejó, en el mismo canal e hilo.

## Mecanismos de seguridad y observabilidad

- **Interruptor de bucles de fallos:** 3 arranques no controlados en un periodo de 5 minutos activan un interruptor que
  impide el inicio automático de servicios auxiliares en el siguiente arranque, para que un Gateway que falla
  no amplifique sus propios fallos. Se restablece cuando expira el intervalo de arranques no controlados.
- **Métricas:** la actividad de recuperación se exporta mediante
  [Prometheus](/es/gateway/prometheus) como `openclaw_session_recovery_total` y
  `openclaw_session_recovery_age_seconds`.
- **Registros:** las decisiones de recuperación se registran en los subsistemas
  `main-session-restart-recovery` y `subagent-interrupted-resume`.

## Qué no se reanuda

- Las sesiones excluidas de la recuperación de sesiones principales porque ya las gestiona otro propietario:
  sesiones de subagentes (recuperación de subagentes), sesiones cron (el
  planificador vuelve a ejecutarlas según la programación) y sesiones gestionadas por ACP (el IDE
  o cliente conectado se encarga de la reanudación).
- Las sesiones cuyo final de transcripción no permite continuar de forma segura; estas reciben el
  aviso para volver a enviar la solicitud descrito anteriormente, en lugar de volver a ejecutarse silenciosamente.
- El trabajo que nunca se admitió: los mensajes que llegan durante el periodo de espera se
  rechazan con un error explícito de reinicio, en lugar de añadirse silenciosamente a la cola de un
  proceso que está finalizando.
