---
read_when:
    - Diagnóstico de la conectividad de los canales o del estado del Gateway
    - Comprender los comandos y las opciones de CLI de comprobación de estado
summary: Comandos de comprobación de estado y supervisión del estado del Gateway
title: Comprobaciones de estado
x-i18n:
    generated_at: "2026-04-30T05:42:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

Guía breve para verificar la conectividad del canal sin hacer suposiciones.

## Comprobaciones rápidas

- `openclaw status` — resumen local: alcanzabilidad/modo del gateway, sugerencia de actualización, antigüedad de autenticación del canal vinculado, sesiones + actividad reciente.
- `openclaw status --all` — diagnóstico local completo (solo lectura, color, seguro para pegar al depurar).
- `openclaw status --deep` — solicita al gateway en ejecución una prueba de salud en vivo (`health` con `probe:true`), incluidas pruebas de canal por cuenta cuando son compatibles.
- `openclaw health` — solicita al gateway en ejecución su instantánea de salud (solo WS; sin sockets de canal directos desde la CLI).
- `openclaw health --verbose` — fuerza una prueba de salud en vivo e imprime detalles de conexión del gateway.
- `openclaw health --json` — salida de instantánea de salud legible por máquina.
- Envía `/status` como mensaje independiente en WhatsApp/WebChat para obtener una respuesta de estado sin invocar al agente.
- Registros: sigue `/tmp/openclaw/openclaw-*.log` y filtra por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnósticos profundos

- Credenciales en disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime debería ser reciente).
- Almacén de sesiones: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (la ruta se puede sobrescribir en la configuración). El recuento y los destinatarios recientes se muestran mediante `status`.
- Flujo de revinculación: `openclaw channels logout && openclaw channels login --verbose` cuando aparezcan códigos de estado 409–515 o `loggedOut` en los registros. (Nota: el flujo de inicio de sesión con QR se reinicia automáticamente una vez para el estado 515 después del emparejamiento).
- Los diagnósticos están habilitados de forma predeterminada. El gateway registra hechos operativos salvo que se establezca `diagnostics.enabled: false`. Los eventos de memoria registran recuentos de bytes RSS/heap, presión de umbral y presión de crecimiento. Las advertencias de actividad registran retraso del bucle de eventos, utilización del bucle de eventos, relación de núcleos de CPU y recuentos de sesiones activas/en espera/en cola cuando el proceso se está ejecutando pero está saturado. Los eventos de cargas excesivas registran qué se rechazó, truncó o fragmentó, además de tamaños y límites cuando están disponibles. No registran el texto del mensaje, contenido de adjuntos, cuerpo del webhook, cuerpo sin procesar de solicitud o respuesta, tokens, cookies ni valores secretos. El mismo Heartbeat inicia el registrador de estabilidad acotado, disponible mediante `openclaw gateway stability` o el RPC Gateway `diagnostics.stability`. Las salidas fatales del Gateway, los tiempos de espera de apagado y los fallos de inicio tras reinicio conservan la instantánea más reciente del registrador en `~/.openclaw/logs/stability/` cuando existen eventos; inspecciona el paquete guardado más reciente con `openclaw gateway stability --bundle latest`.
- Para informes de errores, ejecuta `openclaw gateway diagnostics export` y adjunta el zip generado. La exportación combina un resumen en Markdown, el paquete de estabilidad más reciente, metadatos de registros saneados, instantáneas saneadas de estado/salud del Gateway y la forma de la configuración. Está pensada para compartirse: se omiten o redactan texto de chat, cuerpos de webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje y valores secretos. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

## Configuración del monitor de salud

- `gateway.channelHealthCheckMinutes`: con qué frecuencia el gateway comprueba la salud del canal. Predeterminado: `5`. Establece `0` para deshabilitar globalmente los reinicios del monitor de salud.
- `gateway.channelStaleEventThresholdMinutes`: cuánto tiempo puede permanecer inactivo un canal conectado antes de que el monitor de salud lo trate como obsoleto y lo reinicie. Predeterminado: `30`. Mantén esto mayor o igual que `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: límite móvil de una hora para reinicios del monitor de salud por canal/cuenta. Predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: deshabilita los reinicios del monitor de salud para un canal específico mientras dejas habilitado el monitoreo global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: sobrescritura multicuenta que prevalece sobre la configuración a nivel de canal.
- Estas sobrescrituras por canal se aplican a los monitores de canales integrados que las exponen hoy: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram y WhatsApp.

## Cuando algo falla

- `logged out` o estado 409–515 → revincula con `openclaw channels logout` y luego `openclaw channels login`.
- Gateway inaccesible → inícialo: `openclaw gateway --port 18789` (usa `--force` si el puerto está ocupado).
- Sin mensajes entrantes → confirma que el teléfono vinculado esté en línea y que el remitente esté permitido (`channels.whatsapp.allowFrom`); para chats de grupo, asegúrate de que la lista de permitidos + las reglas de mención coincidan (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado "health"

`openclaw health` solicita al gateway en ejecución su instantánea de salud (sin sockets de canal
directos desde la CLI). De forma predeterminada puede devolver una instantánea fresca en caché del gateway; el
gateway luego actualiza esa caché en segundo plano. `openclaw health --verbose` fuerza
una prueba en vivo en su lugar. El comando informa credenciales vinculadas/antigüedad de autenticación cuando están disponibles,
resúmenes de pruebas por canal, resumen del almacén de sesiones y una duración de prueba. Sale
con código distinto de cero si el gateway no es accesible o si la prueba falla/agota el tiempo.

Opciones:

- `--json`: salida JSON legible por máquina
- `--timeout <ms>`: sobrescribe el tiempo de espera de prueba predeterminado de 10 s
- `--verbose`: fuerza una prueba en vivo e imprime detalles de conexión del gateway
- `--debug`: alias de `--verbose`

La instantánea de salud incluye: `ok` (booleano), `ts` (marca de tiempo), `durationMs` (tiempo de prueba), estado por canal, disponibilidad del agente y resumen del almacén de sesiones.

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
