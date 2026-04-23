---
read_when:
    - Diagnóstico de la conectividad del canal o del estado del Gateway
    - Comprender los comandos y opciones de la CLI para comprobaciones de estado
summary: Comandos de comprobación de estado y supervisión del estado del Gateway
title: Comprobaciones de estado
x-i18n:
    generated_at: "2026-04-23T05:15:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddcbe6fa913c5ba889f78cb417124c96b562cf8939410b1d6f66042dfb51a9f
    source_path: gateway/health.md
    workflow: 15
---

# Comprobaciones de estado (CLI)

Guía breve para verificar la conectividad del canal sin adivinar.

## Comprobaciones rápidas

- `openclaw status` — resumen local: accesibilidad/modo del Gateway, sugerencia de actualización, antigüedad de autenticación del canal vinculado, sesiones + actividad reciente.
- `openclaw status --all` — diagnóstico local completo (solo lectura, con color, seguro para pegar al depurar).
- `openclaw status --deep` — solicita al Gateway en ejecución una sonda de estado en vivo (`health` con `probe:true`), incluidas sondas de canal por cuenta cuando se admitan.
- `openclaw health` — solicita al Gateway en ejecución su instantánea de estado (solo WS; sin sockets directos del canal desde la CLI).
- `openclaw health --verbose` — fuerza una sonda de estado en vivo e imprime detalles de conexión del Gateway.
- `openclaw health --json` — salida de instantánea de estado legible por máquina.
- Envíe `/status` como mensaje independiente en WhatsApp/WebChat para obtener una respuesta de estado sin invocar al agente.
- Registros: siga `/tmp/openclaw/openclaw-*.log` y filtre por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnóstico profundo

- Credenciales en disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` debería ser reciente).
- Almacén de sesiones: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (la ruta puede anularse en la configuración). El recuento y los destinatarios recientes se muestran mediante `status`.
- Flujo de revinculación: `openclaw channels logout && openclaw channels login --verbose` cuando aparecen códigos de estado 409–515 o `loggedOut` en los registros. (Nota: el flujo de inicio de sesión por QR se reinicia automáticamente una vez para el estado 515 después del emparejamiento).
- El diagnóstico está habilitado de forma predeterminada. El Gateway registra datos operativos a menos que se establezca `diagnostics.enabled: false`. Los eventos de memoria registran recuentos de bytes RSS/heap, presión de umbral y presión de crecimiento. Los eventos de carga sobredimensionada registran qué se rechazó, truncó o dividió en fragmentos, además de tamaños y límites cuando están disponibles. No registran el texto del mensaje, el contenido de adjuntos, el cuerpo del Webhook, el cuerpo sin procesar de la solicitud o la respuesta, tokens, cookies ni valores secretos. El mismo Heartbeat inicia el registrador de estabilidad acotado, disponible mediante `openclaw gateway stability` o el RPC del Gateway `diagnostics.stability`. Las salidas fatales del Gateway, los tiempos de espera de apagado y los fallos de inicio durante reinicios conservan la última instantánea del registrador en `~/.openclaw/logs/stability/` cuando existen eventos; inspeccione el paquete guardado más reciente con `openclaw gateway stability --bundle latest`.
- Para informes de errores, ejecute `openclaw gateway diagnostics export` y adjunte el archivo zip generado. La exportación combina un resumen en Markdown, el paquete de estabilidad más reciente, metadatos de registros saneados, instantáneas saneadas de estado/salud del Gateway y la forma de la configuración. Está pensada para compartirse: el texto del chat, los cuerpos de Webhook, las salidas de herramientas, las credenciales, las cookies, los identificadores de cuenta/mensaje y los valores secretos se omiten o redactan.

## Configuración del monitor de estado

- `gateway.channelHealthCheckMinutes`: frecuencia con la que el Gateway comprueba el estado del canal. Valor predeterminado: `5`. Establézcalo en `0` para deshabilitar globalmente los reinicios del monitor de estado.
- `gateway.channelStaleEventThresholdMinutes`: cuánto tiempo puede permanecer inactivo un canal conectado antes de que el monitor de estado lo trate como obsoleto y lo reinicie. Valor predeterminado: `30`. Mantenga este valor mayor o igual que `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: límite móvil de una hora para reinicios del monitor de estado por canal/cuenta. Valor predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: deshabilita los reinicios del monitor de estado para un canal específico y mantiene habilitada la supervisión global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: anulación multicuenta que prevalece sobre la configuración a nivel de canal.
- Estas anulaciones por canal se aplican a los monitores de canal integrados que las exponen actualmente: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram y WhatsApp.

## Cuando algo falla

- `logged out` o estado 409–515 → vuelva a vincular con `openclaw channels logout` y luego `openclaw channels login`.
- Gateway inaccesible → inícielo: `openclaw gateway --port 18789` (use `--force` si el puerto está ocupado).
- No hay mensajes entrantes → confirme que el teléfono vinculado está en línea y que el remitente está permitido (`channels.whatsapp.allowFrom`); para chats grupales, asegúrese de que la lista de permitidos + las reglas de menciones coincidan (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado `health`

`openclaw health` solicita al Gateway en ejecución su instantánea de estado (sin sockets directos del canal desde la CLI). De forma predeterminada, puede devolver una instantánea reciente en caché del Gateway; luego, el Gateway actualiza esa caché en segundo plano. `openclaw health --verbose` fuerza en su lugar una sonda en vivo. El comando informa la antigüedad de las credenciales/autenticación vinculadas cuando está disponible, resúmenes de sonda por canal, resumen del almacén de sesiones y una duración de la sonda. Sale con un código distinto de cero si el Gateway es inaccesible o si la sonda falla/se agota el tiempo.

Opciones:

- `--json`: salida JSON legible por máquina
- `--timeout <ms>`: anula el tiempo de espera predeterminado de la sonda de 10 s
- `--verbose`: fuerza una sonda en vivo e imprime detalles de conexión del Gateway
- `--debug`: alias de `--verbose`

La instantánea de estado incluye: `ok` (booleano), `ts` (marca de tiempo), `durationMs` (tiempo de sonda), estado por canal, disponibilidad del agente y resumen del almacén de sesiones.
