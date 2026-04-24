---
read_when:
    - Diagnosticar la conectividad de canales o el estado de salud de Gateway
    - Entender los comandos y opciones de CLI para comprobaciones de estado de salud
summary: Comandos de comprobación de estado de salud y monitorización del estado de salud de Gateway
title: Comprobaciones de estado de salud
x-i18n:
    generated_at: "2026-04-24T05:29:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08278ff0079102459c4d9141dc2e8d89e731de1fc84487f6baa620aaf7c119b4
    source_path: gateway/health.md
    workflow: 15
---

# Comprobaciones de estado de salud (CLI)

Guía breve para verificar la conectividad de los canales sin tener que adivinar.

## Comprobaciones rápidas

- `openclaw status` — resumen local: accesibilidad/modo de Gateway, sugerencia de actualización, antigüedad de autenticación del canal vinculado, sesiones + actividad reciente.
- `openclaw status --all` — diagnóstico local completo (solo lectura, con color, seguro para pegar al depurar).
- `openclaw status --deep` — solicita al Gateway en ejecución una sonda de estado de salud en vivo (`health` con `probe:true`), incluidas sondas de canal por cuenta cuando se admiten.
- `openclaw health` — solicita al Gateway en ejecución su instantánea de estado de salud (solo WS; sin sockets directos de canal desde la CLI).
- `openclaw health --verbose` — fuerza una sonda de estado de salud en vivo e imprime detalles de conexión de Gateway.
- `openclaw health --json` — salida legible por máquina de la instantánea de estado de salud.
- Envía `/status` como mensaje independiente en WhatsApp/WebChat para obtener una respuesta de estado sin invocar al agente.
- Registros: sigue `/tmp/openclaw/openclaw-*.log` y filtra por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnóstico profundo

- Credenciales en disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime debería ser reciente).
- Almacén de sesiones: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (la ruta se puede anular en la configuración). El conteo y los destinatarios recientes se muestran mediante `status`.
- Flujo de revinculación: `openclaw channels logout && openclaw channels login --verbose` cuando aparezcan códigos de estado 409–515 o `loggedOut` en los registros. (Nota: el flujo de inicio de sesión por QR se reinicia automáticamente una vez para el estado 515 después del emparejamiento).
- El diagnóstico está habilitado de forma predeterminada. Gateway registra datos operativos a menos que se configure `diagnostics.enabled: false`. Los eventos de memoria registran recuentos de bytes RSS/heap, presión por umbral y presión de crecimiento. Los eventos de carga útil sobredimensionada registran lo que se rechazó, truncó o fragmentó, además de tamaños y límites cuando están disponibles. No registran el texto del mensaje, contenido de adjuntos, cuerpo de Webhook, cuerpo sin procesar de solicitud o respuesta, tokens, cookies ni valores secretos. El mismo Heartbeat inicia el registrador de estabilidad acotado, disponible mediante `openclaw gateway stability` o el RPC de Gateway `diagnostics.stability`. Las salidas fatales de Gateway, tiempos de espera de apagado y fallos de inicio tras reinicio conservan la última instantánea del registrador en `~/.openclaw/logs/stability/` cuando existen eventos; inspecciona el paquete guardado más reciente con `openclaw gateway stability --bundle latest`.
- Para informes de errores, ejecuta `openclaw gateway diagnostics export` y adjunta el zip generado. La exportación combina un resumen en Markdown, el paquete de estabilidad más reciente, metadatos de registros saneados, instantáneas saneadas de estado/salud de Gateway y la forma de la configuración. Está pensada para compartirse: texto de chat, cuerpos de Webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje y valores secretos se omiten o redactan. Consulta [Diagnostics Export](/es/gateway/diagnostics).

## Configuración del monitor de salud

- `gateway.channelHealthCheckMinutes`: frecuencia con la que Gateway comprueba el estado de salud del canal. Predeterminado: `5`. Establece `0` para desactivar globalmente los reinicios del monitor de salud.
- `gateway.channelStaleEventThresholdMinutes`: cuánto tiempo puede permanecer inactivo un canal conectado antes de que el monitor de salud lo trate como obsoleto y lo reinicie. Predeterminado: `30`. Mantén este valor mayor o igual que `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: límite móvil de una hora para reinicios por el monitor de salud por canal/cuenta. Predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: desactiva los reinicios del monitor de salud para un canal específico mientras mantienes habilitada la monitorización global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: anulación para varias cuentas que prevalece sobre el ajuste a nivel de canal.
- Estas anulaciones por canal se aplican a los monitores de canal integrados que las exponen hoy: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram y WhatsApp.

## Cuando algo falla

- `logged out` o estado 409–515 → vuelve a vincular con `openclaw channels logout` y luego `openclaw channels login`.
- Gateway inaccesible → inícialo: `openclaw gateway --port 18789` (usa `--force` si el puerto está ocupado).
- No hay mensajes entrantes → confirma que el teléfono vinculado esté en línea y que el remitente esté permitido (`channels.whatsapp.allowFrom`); para chats grupales, asegúrate de que la lista permitida + las reglas de menciones coincidan (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado `health`

`openclaw health` solicita al Gateway en ejecución su instantánea de estado de salud (sin sockets directos de canal
desde la CLI). De forma predeterminada puede devolver una instantánea reciente en caché del Gateway; el
Gateway actualiza entonces esa caché en segundo plano. `openclaw health --verbose` fuerza
en cambio una sonda en vivo. El comando informa de la antigüedad de credenciales/autenticación vinculadas cuando está disponible,
resúmenes de sonda por canal, resumen del almacén de sesiones y duración de la sonda. Sale con
código distinto de cero si el Gateway es inaccesible o si la sonda falla/se agota el tiempo.

Opciones:

- `--json`: salida JSON legible por máquina
- `--timeout <ms>`: anula el tiempo de espera predeterminado de 10 s de la sonda
- `--verbose`: fuerza una sonda en vivo e imprime detalles de conexión de Gateway
- `--debug`: alias de `--verbose`

La instantánea de estado de salud incluye: `ok` (booleano), `ts` (marca de tiempo), `durationMs` (tiempo de sonda), estado por canal, disponibilidad del agente y resumen del almacén de sesiones.

## Relacionado

- [Runbook de Gateway](/es/gateway)
- [Exportación de diagnóstico](/es/gateway/diagnostics)
- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
