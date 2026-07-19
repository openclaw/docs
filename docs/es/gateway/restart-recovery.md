---
read_when:
    - Quieres saber si reiniciar el Gateway hace que se pierda el trabajo del agente en curso
    - Una ejecución del agente se interrumpió debido a un reinicio, un fallo o una recarga de la configuración.
    - Está depurando la recuperación automática de la sesión después de que el Gateway vuelve a estar operativo
summary: 'Qué sobrevive a un reinicio o fallo del Gateway: los turnos interrumpidos del agente se reanudan automáticamente, los subagentes y las tareas en segundo plano se recuperan, y las entregas en cola se procesan.'
title: Recuperación tras reinicio
x-i18n:
    generated_at: "2026-07-19T01:58:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bdea30f3a90697951f4f63a06897d2c1d936e5145138b47fed7d8ebd8b7187ad
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Reiniciar el Gateway no provoca la pérdida del estado del agente. Las conversaciones, las transcripciones,
los trabajos programados, los registros de tareas en segundo plano y los mensajes salientes en cola se almacenan
en disco, y el trabajo interrumpido a mitad de un turno se detecta y se reanuda
automáticamente después de que el Gateway vuelve a estar operativo. La recuperación siempre está activada y
normalmente no requiere intervención manual. Los fallos de recuperación repetidos están limitados
y pueden poner una sesión en cuarentena hasta que se inspeccione o sustituya.

Esta página describe qué se conserva tras un reinicio, cómo se detecta el trabajo interrumpido
y cómo funciona la reanudación automática.

## Qué se conserva tras un reinicio

| Estado                        | Almacenamiento                               | Comportamiento tras el reinicio                                        |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Historial de conversaciones   | Base de datos SQLite por agente             | Sin cambios; las sesiones continúan desde la transcripción almacenada   |
| Turno interrumpido de la sesión principal | Fila de sesión y transcripción de SQLite por agente | Se reanuda o concilia automáticamente unos segundos después del inicio |
| Ejecuciones de subagentes     | SQLite (base de datos de estado compartida) | El registro se restaura al arrancar; las ejecuciones interrumpidas se reanudan |
| Tareas en segundo plano       | SQLite (base de datos de estado compartida) | Se concilian al arrancar; las ejecuciones huérfanas se recuperan o se marcan como perdidas |
| Entregas salientes en cola    | Cola de entrega de SQLite                   | Se procesa tras el reinicio; se reintentan las respuestas no entregadas |
| Trabajos programados (cron)   | Almacén de cron de SQLite                   | Las programaciones persisten; el planificador se reactiva al arrancar   |
| Continuación tras el reinicio | Centinela de reinicio de SQLite             | Se envía una continuación única a la sesión que solicitó el reinicio    |

## Los reinicios ordenados primero esperan a que termine el trabajo

Un reinicio solicitado (`openclaw gateway restart`, un cambio de configuración que requiere
un reinicio o una actualización del Gateway) no finaliza inmediatamente el trabajo en curso. El
Gateway deja de aceptar trabajo nuevo y espera a que terminen los turnos activos del agente y las
tareas en segundo plano, hasta agotar un plazo de espera (5 minutos de forma predeterminada). Por lo tanto, la mayoría
de los reinicios no interrumpen nada.

Solo se cancela el trabajo que no puede terminar dentro del plazo de espera (o cualquier ejecución interrumpida
por un reinicio forzado o un fallo) y, antes de que eso ocurra, cada
sesión afectada se marca para su recuperación.

## Cómo se detecta el trabajo interrumpido

Tres mecanismos complementarios marcan las sesiones cuyo turno no terminó:

- **Al admitir el turno:** para un turno de texto ordinario en una sesión principal existente,
  el Gateway añade el mensaje del usuario, marca la sesión como en ejecución y registra
  su declaración de entrega de recuperación en una transacción de SQLite antes de ejecutar el modelo o el
  hook `before_agent_reply`. Control UI hace esto antes de devolver la confirmación
  `started`; el envío del canal lo hace cuando el turno preparado
  adopta la ejecución del agente.
  Los comandos, los archivos adjuntos, las anulaciones por turno, las entregas pendientes, las indicaciones de cancelación
  previas, las sesiones propiedad de plugins y los turnos con hooks de ejecución mantienen sus
  rutas de admisión especializadas.
  Si hay instalado un hook `before_agent_reply`, la admisión también registra su fase.
  La recuperación nunca vuelve a ejecutar un hook interrumpido a mitad de una llamada. Una vez que termina un hook no gestionado,
  su punto de control registra el resultado, pero la recuperación continúa bloqueándose de forma segura
  mientras ese hook permanezca activo: un punto de control no puede demostrar que el mismo
  código y configuración del plugin se cargaron después del reinicio. Los resultados de texto gestionados y
  silenciosos se registran por separado en puntos de control para garantizar una resolución determinista.
  Las declaraciones de recuperación duraderas escritas por versiones anteriores no tienen un marcador de propiedad
  del origen, por lo que reciben la misma comprobación de bloqueo seguro del hook durante una actualización.
- **Al apagar:** durante la espera del reinicio, toda sesión con una ejecución activa
  se marca con un indicador de recuperación en el almacén de sesiones antes de
  cancelar la ejecución.
- **Al iniciar:** el Gateway examina los almacenes de sesiones en busca de sesiones que aún
  indiquen estar en ejecución pero que no tengan un propietario activo en el nuevo proceso. Esto detecta
  fallos graves y finalizaciones en los que no se ejecutó ningún código de apagado. Los archivos obsoletos de bloqueo
  de transcripciones se eliminan al mismo tiempo.

## Reanudación automática

Unos segundos después del inicio, el Gateway vuelve a enviar cada sesión marcada
con un mensaje sintético del sistema que indica al agente que su turno anterior fue
interrumpido por un reinicio y que debe continuar a partir de la transcripción existente. Si ya se
había generado una respuesta final, pero no se había entregado, se incluye su texto
para que el agente pueda entregarla en lugar de repetir el trabajo.

La conciliación al inicio reintenta los fallos transitorios hasta tres veces con
espera exponencial. Por separado, cada ciclo interrumpido de la sesión principal dispone de un
presupuesto duradero de tres intentos contabilizados de envío automático, que se conserva entre
reinicios del Gateway. OpenClaw contabiliza un intento antes del envío, lo reembolsa cuando
el Gateway rechaza explícitamente la solicitud antes de aceptarla y mantiene el
cargo cuando el resultado posterior al envío es incierto para evitar volver a ejecutar el trabajo.
El trabajo en primer plano que ya controla la sesión impide la recuperación automática
hasta que dicho trabajo finaliza.

Una vez agotado el presupuesto duradero, la sesión se marca con una lápida en lugar de
entrar en un bucle infinito. Inspeccione la sesión fallida y use `/new` o `/reset` para iniciar una
sesión de sustitución. `openclaw doctor --fix` puede reparar una marca de cancelación obsoleta que
entre en conflicto con una lápida, pero no vuelve a habilitar ese ciclo de recuperación.

Cada reintento reutiliza un único identificador de envío duradero, por lo que un fallo de conexión
ambiguo no puede iniciar dos veces la misma recuperación. Los turnos completados y no reanudables de Control
UI también conservan lápidas duraderas de idempotencia limitadas, lo que permite que una
bandeja de salida que vuelva a conectarse los retire sin volver a ejecutar la solicitud.

Las respuestas enviadas únicamente mediante herramientas de mensajería usan una segunda correlación duradera. Antes de que un envío terminal
en la misma conversación llegue al canal, el Gateway registra una intención de entrega sin resolver
en la sesión y el turno de origen exactos. Un éxito confirmado del proveedor
la resuelve como un recibo duradero de entrega; un fallo confirmado la elimina.
La recuperación completa un recibo de entrega sin volver a ejecutar las herramientas. Si un fallo
deja sin determinar el resultado del proveedor, la recuperación se bloquea de forma segura en lugar de volver a ejecutar
un efecto externo.

La respuesta entregada también se refleja en la transcripción con el ID de su mensaje
de origen. Los reflejos terminales usan una clave de recibo distinta, por lo que un envío de progreso con
la misma clave de idempotencia del proveedor no puede ocultar el marcador terminal. Los envíos de progreso
y los recibos de turnos anteriores no pueden completar el turno actual. Solo
las declaraciones duraderas de entrada del canal pueden restaurar la autoridad para ejecutar acciones de mensajes. Una ejecución reanudada
mantiene el modo original de entrega de origen y la correlación de origen, incluida
la identidad del solicitante y cualquier restricción del mismo canal o hilo, por lo que el mismo recibo
sigue siendo vinculante incluso si se produce otro reinicio durante la recuperación. Un
turno basado únicamente en herramientas de mensajería sin una autoridad de canal que pueda reconstruirse se bloquea
de forma segura y recibe el aviso único para volver a enviar.

Antes de reanudar, el Gateway comprueba que sea seguro continuar desde el final de la
transcripción. Si no lo es (por ejemplo, si el turno terminó en una aprobación pendiente
obsoleta), la sesión no se vuelve a ejecutar a ciegas; en su lugar, el agente publica un breve
aviso que solicita al usuario que vuelva a enviar la última solicitud. En WebChat, ese aviso se
escribe directamente en el historial de la sesión para que siga visible después de volver a conectarse.

OpenClaw también puede reconstruir trabajo interrumpido de solo lectura de [Code Mode](/tools/code-mode).
Code Mode marca estas ejecuciones como seguras frente a reinicios y rechaza las herramientas de catálogo con efectos secundarios
o los espacios de nombres de plugins antes de que se ejecuten. Si se produce un reinicio en el
control `wait`, el nuevo Gateway reconstruye el turno a partir de su transcripción
y obliga a que la ejecución reconstruida siga siendo segura frente a reinicios, incluso si el
modelo omite o elimina esa marca. El host limita todo el turno reconstruido
a herramientas principales auditadas de solo lectura y herramientas de plugins explícitamente seguras para volver a ejecutarse,
incluso cuando Code Mode está deshabilitado después del reinicio. El trabajo con efectos secundarios
sigue protegido por el aviso de reenvío, en lugar de arriesgarse a una escritura duplicada.

### Subagentes

Las ejecuciones de subagentes se conservan en la base de datos de estado compartida de SQLite, por lo que el
registro de subagentes sobrevive al proceso. Al arrancar, el registro se restaura y
las sesiones de subagentes interrumpidas se reanudan con el contexto de su tarea original.
Se aplican dos mecanismos de seguridad:

- Las ejecuciones interrumpidas hace más de 2 horas se finalizan en lugar de reanudarse, para que
  un Gateway que haya permanecido inactivo durante la noche no reactive trabajo obsoleto.
- Una sesión que falla repetidamente al recuperarse se marca con una lápida como bloqueada, para que
  la recuperación no pueda entrar en un bucle infinito.

### Tareas en segundo plano

El [registro de tareas en segundo plano](/es/automation/tasks) se basa en SQLite y
se concilia al arrancar y en intervalos periódicos: se recuperan los resultados duraderos registrados por
las ejecuciones finalizadas, y las ejecuciones cuyo proceso propietario ha desaparecido se
marcan como perdidas después de un periodo de gracia, en lugar de quedar bloqueadas indefinidamente.

### Reinicios solicitados por el agente

Cuando el propio agente activa un reinicio (al aplicar un cambio de configuración, actualizar
el Gateway o realizar una solicitud explícita de reinicio), se escribe un centinela de reinicio en
SQLite antes de que finalice el proceso. Después del arranque, el Gateway publica el resultado en
el chat de origen y envía un turno de continuación único para que el
agente retome el trabajo exactamente donde lo dejó, en el mismo canal e hilo.

Las columnas tipadas de SQLite del centinela son la fuente vinculante para gestionar el reinicio;
su valor `payload_json` es solo una copia para repetición y depuración. En tiempo de ejecución se lee, escribe
y elimina el estado de SQLite sin recurrir a archivos. Durante la transición del almacenamiento, se
ejecuta una migración de estado limitada al inicio y mediante Doctor para conservar un
`restart-sentinel.json` validado dejado por el proceso anterior después de una actualización.
La migración verifica la fila tipada y elimina el archivo de origen antes de que continúe
la gestión normal del reinicio.

## Mecanismos de seguridad y observabilidad

- **Interruptor de bucle de fallos:** 3 arranques incorrectos en un plazo de 5 minutos activan un interruptor que
  impide el inicio automático de servicios secundarios en el siguiente arranque, para que un Gateway que falla
  no agrave su propio fallo. Se recupera una vez transcurrida la ventana de arranques incorrectos.
- **Presupuesto de intentos de la sesión principal:** tres intentos contabilizados de envío automático
  por ciclo interrumpido; al agotarse, esa sesión se marca con una lápida hasta que se
  inspeccione y sustituya.
- **Métricas:** la actividad de recuperación se exporta mediante
  [Prometheus](/es/gateway/prometheus) como `openclaw_session_recovery_total` y
  `openclaw_session_recovery_age_seconds`.
- **Registros:** las decisiones de recuperación se registran en los subsistemas
  `main-session-restart-recovery` y `subagent-interrupted-resume`.

## Qué no se reanuda

- Sesiones excluidas de la recuperación de la sesión principal porque ya las gestiona otro propietario:
  sesiones de subagentes (recuperación de subagentes), sesiones de cron (el
  planificador vuelve a ejecutarlas según la programación) y sesiones gestionadas por ACP (el IDE
  o cliente conectado controla la reanudación).
- Sesiones cuyo final de transcripción no permite una continuación segura; estas reciben el
  aviso de reenvío descrito anteriormente en lugar de volver a ejecutarse silenciosamente.
- Trabajo que nunca se admitió: los mensajes que llegan durante el periodo de espera
  se rechazan con un error explícito de reinicio, en lugar de añadirse silenciosamente a la cola de un
  proceso que está finalizando.
- Los turnos integrados independientes no pueden asumir el control de una sesión principal con una
  recuperación de reinicio pendiente porque no comparten el propietario del ciclo de vida del Gateway.
  Ejecute el turno mediante el Gateway o restablézcalo allí con `/new` o `/reset`.
