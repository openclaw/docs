---
read_when:
    - Diagnóstico de la conectividad del canal o del estado del Gateway
    - Comprender los comandos y opciones de CLI de comprobación de estado
summary: Comandos de comprobación de estado y supervisión del estado del Gateway
title: Comprobaciones de estado
x-i18n:
    generated_at: "2026-05-02T20:47:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

Guía breve para verificar la conectividad del canal sin hacer suposiciones.

## Comprobaciones rápidas

- `openclaw status` — resumen local: alcanzabilidad/modo del Gateway, indicación de actualización, antigüedad de la autenticación del canal vinculado, sesiones + actividad reciente.
- `openclaw status --all` — diagnóstico local completo (solo lectura, con color, seguro para pegar para depuración).
- `openclaw status --deep` — pregunta al Gateway en ejecución por una sonda de salud en vivo (`health` con `probe:true`), incluidas sondas de canal por cuenta cuando se admiten.
- `openclaw health` — pregunta al Gateway en ejecución por su instantánea de salud (solo WS; sin sockets de canal directos desde la CLI).
- `openclaw health --verbose` — fuerza una sonda de salud en vivo e imprime detalles de conexión del Gateway.
- `openclaw health --json` — salida de instantánea de salud legible por máquina.
- Envía `/status` como mensaje independiente en WhatsApp/WebChat para obtener una respuesta de estado sin invocar al agente.
- Registros: sigue `/tmp/openclaw/openclaw-*.log` y filtra por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Para Discord y otros proveedores de chat, las filas de sesión no representan la vitalidad del socket.
`openclaw sessions`, Gateway `sessions.list` y la herramienta `sessions_list` del agente
leen el estado de conversación almacenado. Un proveedor puede reconectarse y mostrar un estado
de canal saludable antes de que se materialice cualquier fila de sesión nueva. Usa los comandos
de estado del canal y salud anteriores para comprobaciones de conectividad en vivo.

## Diagnósticos profundos

- Credenciales en disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` debería ser reciente).
- Almacén de sesiones: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (la ruta puede sobrescribirse en la configuración). El recuento y los destinatarios recientes se muestran mediante `status`.
- Flujo de revinculación: `openclaw channels logout && openclaw channels login --verbose` cuando aparezcan códigos de estado 409–515 o `loggedOut` en los registros. (Nota: el flujo de inicio de sesión con QR se reinicia automáticamente una vez para el estado 515 después del emparejamiento).
- Los diagnósticos están habilitados de forma predeterminada. El Gateway registra datos operativos salvo que se establezca `diagnostics.enabled: false`. Los eventos de memoria registran recuentos de bytes de RSS/heap, presión por umbral y presión de crecimiento. Las advertencias de vitalidad registran el retraso del bucle de eventos, la utilización del bucle de eventos, la relación de núcleos de CPU y los recuentos de sesiones activas/en espera/en cola cuando el proceso se está ejecutando pero está saturado. Los eventos de cargas sobredimensionadas registran qué se rechazó, truncó o fragmentó, además de tamaños y límites cuando están disponibles. No registran el texto del mensaje, el contenido de los adjuntos, el cuerpo del webhook, el cuerpo sin procesar de la solicitud o respuesta, tokens, cookies ni valores secretos. El mismo Heartbeat inicia el registrador de estabilidad acotado, que está disponible mediante `openclaw gateway stability` o el RPC de Gateway `diagnostics.stability`. Las salidas fatales del Gateway, los tiempos de espera de apagado y los fallos de arranque tras reinicio conservan la instantánea más reciente del registrador en `~/.openclaw/logs/stability/` cuando existen eventos; inspecciona el paquete guardado más reciente con `openclaw gateway stability --bundle latest`.
- Para informes de errores, ejecuta `openclaw gateway diagnostics export` y adjunta el zip generado. La exportación combina un resumen en Markdown, el paquete de estabilidad más reciente, metadatos de registro saneados, instantáneas saneadas de estado/salud del Gateway y la forma de la configuración. Está pensada para compartirse: el texto de chat, los cuerpos de webhook, las salidas de herramientas, las credenciales, las cookies, los identificadores de cuenta/mensaje y los valores secretos se omiten o redactan. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

## Configuración del monitor de salud

- `gateway.channelHealthCheckMinutes`: cada cuánto el Gateway comprueba la salud del canal. Valor predeterminado: `5`. Establece `0` para deshabilitar globalmente los reinicios del monitor de salud.
- `gateway.channelStaleEventThresholdMinutes`: cuánto tiempo puede permanecer inactivo un canal conectado antes de que el monitor de salud lo trate como obsoleto y lo reinicie. Valor predeterminado: `30`. Mantén esto mayor o igual que `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: límite móvil de una hora para reinicios del monitor de salud por canal/cuenta. Valor predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: deshabilita los reinicios del monitor de salud para un canal específico mientras se mantiene habilitada la supervisión global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: sobrescritura multicuenta que prevalece sobre la configuración a nivel de canal.
- Estas sobrescrituras por canal se aplican a los monitores de canal integrados que las exponen hoy: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram y WhatsApp.

## Cuando algo falla

- `logged out` o estado 409–515 → revincula con `openclaw channels logout` y luego `openclaw channels login`.
- Gateway inalcanzable → inícialo: `openclaw gateway --port 18789` (usa `--force` si el puerto está ocupado).
- Sin mensajes entrantes → confirma que el teléfono vinculado esté en línea y que el remitente esté permitido (`channels.whatsapp.allowFrom`); para chats grupales, asegúrate de que la lista de permitidos + las reglas de mención coincidan (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado "health"

`openclaw health` pregunta al Gateway en ejecución por su instantánea de salud (sin sockets
de canal directos desde la CLI). De forma predeterminada puede devolver una instantánea reciente
del Gateway en caché; luego el Gateway actualiza esa caché en segundo plano. `openclaw health --verbose` fuerza
una sonda en vivo en su lugar. El comando informa las credenciales vinculadas/la antigüedad de autenticación cuando están disponibles,
resúmenes de sondas por canal, resumen del almacén de sesiones y duración de la sonda. Sale
con un valor distinto de cero si el Gateway es inalcanzable o si la sonda falla/agota el tiempo.

Opciones:

- `--json`: salida JSON legible por máquina
- `--timeout <ms>`: sobrescribe el tiempo de espera predeterminado de 10 s para la sonda
- `--verbose`: fuerza una sonda en vivo e imprime detalles de conexión del Gateway
- `--debug`: alias de `--verbose`

La instantánea de salud incluye: `ok` (booleano), `ts` (marca de tiempo), `durationMs` (tiempo de sonda), estado por canal, disponibilidad del agente y resumen del almacén de sesiones.

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
