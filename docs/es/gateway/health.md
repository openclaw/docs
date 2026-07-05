---
read_when:
    - Diagnóstico de la conectividad de canales o del estado del gateway
    - Comprender los comandos y opciones de la CLI de comprobación de estado
summary: Comandos de verificación de estado y monitoreo del estado del gateway
title: Comprobaciones de estado
x-i18n:
    generated_at: "2026-07-05T11:18:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930bd0f5b91bd4e7abb79a3e0f13eb59317023b796106cf0f0fdc0af51d657fe
    source_path: gateway/health.md
    workflow: 16
---

Guía breve para verificar la conectividad de canales sin adivinar.

## Comprobaciones rápidas

- `openclaw status` - resumen local: accesibilidad/modo del gateway, sugerencia de actualización, antigüedad de autenticación de canales vinculados, sesiones + actividad reciente.
- `openclaw status --all` - diagnóstico local completo (solo lectura, color, seguro para pegar al depurar).
- `openclaw status --deep` - consulta al Gateway en ejecución para una prueba en vivo (`health` con `probe:true`), incluidas pruebas de canal por cuenta cuando sean compatibles.
- `openclaw status --usage` - muestra instantáneas de uso/cuota del proveedor de modelos.
- `openclaw health` - consulta al Gateway en ejecución su instantánea de estado (solo WS; sin sockets de canal directos desde la CLI).
- `openclaw health --verbose` (alias `--debug`) - fuerza una prueba de estado en vivo e imprime detalles de conexión del gateway.
- `openclaw health --json` - salida de instantánea de estado legible por máquina.
- Envía `/status` como comando de chat independiente en cualquier canal para obtener una respuesta de estado sin invocar al agente.
- Registros: sigue `/tmp/openclaw/openclaw-*.log` y filtra por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Para Discord y otros proveedores de chat, las filas de sesión no indican actividad del socket.
`openclaw sessions`, `sessions.list` del Gateway y la herramienta `sessions_list` del agente
leen el estado de conversación almacenado. Un proveedor puede reconectarse y mostrar un estado
de canal saludable antes de que se materialice cualquier nueva fila de sesión. Usa los comandos
de estado y salud de canales anteriores para comprobaciones de conectividad en vivo.

## Diagnósticos profundos

- Credenciales en disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime debería ser reciente).
- Almacén de sesiones: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (la ruta puede sobrescribirse en la configuración). El recuento y los destinatarios recientes se muestran mediante `status`.
- Flujo de revinculación: `openclaw channels logout && openclaw channels login --verbose` cuando aparezcan códigos de estado 409-515 o `loggedOut` en los registros. El flujo de inicio de sesión por QR se reinicia automáticamente una vez para el estado 515 después del emparejamiento.
- Los diagnósticos están habilitados de forma predeterminada (`diagnostics.enabled: false` los deshabilita). Los eventos de memoria registran recuentos de bytes RSS/heap y presión de umbral/crecimiento; la presión crítica de memoria se registra mediante el logger del gateway y, cuando `diagnostics.memoryPressureSnapshot: true` está configurado, también escribe un paquete de estabilidad previo a OOM (estadísticas del heap de V8, contadores de cgroup de Linux cuando estén disponibles, recuentos de recursos activos, archivos de sesión/transcripción más grandes por ruta relativa redactada). Las advertencias de actividad registran retraso/utilización del bucle de eventos, proporción de núcleos de CPU y recuentos de sesiones activas/en espera/en cola cuando el proceso se está ejecutando pero está saturado. Los eventos de carga útil sobredimensionada registran qué se rechazó/truncó/dividió en fragmentos, además de tamaños y límites; nunca texto de mensajes, contenido de adjuntos, cuerpos de Webhook, cuerpos sin procesar de solicitudes/respuestas, tokens, cookies ni valores secretos.
- El mismo Heartbeat impulsa el registrador de estabilidad acotado: `openclaw gateway stability` (o el RPC `diagnostics.stability` del Gateway). Las salidas fatales del Gateway, los tiempos de espera de apagado, los fallos de inicio tras reinicio y (cuando `diagnostics.memoryPressureSnapshot: true`) la presión crítica de memoria persisten la instantánea más reciente en `~/.openclaw/logs/stability/`. Inspecciona el paquete más reciente con `openclaw gateway stability --bundle latest`.
- Para informes de errores, ejecuta `openclaw gateway diagnostics export` y adjunta el zip generado: un resumen en Markdown, el paquete de estabilidad más reciente, metadatos de registro saneados, instantáneas saneadas de estado/salud del Gateway y la forma de configuración. Se omiten o redactan texto de chat, cuerpos de Webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje y valores secretos. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

## Configuración del monitor de salud

- `gateway.channelHealthCheckMinutes`: frecuencia con la que el gateway comprueba la salud de los canales. Predeterminado: `5`. Establece `0` para deshabilitar globalmente los reinicios del monitor de salud.
- `gateway.channelStaleEventThresholdMinutes`: cuánto tiempo puede permanecer inactivo un canal conectado antes de que el monitor de salud lo considere obsoleto y lo reinicie. Predeterminado: `30`. Mantén esto mayor o igual que `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: límite móvil de una hora para reinicios del monitor de salud por canal/cuenta. Predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: deshabilita los reinicios del monitor de salud para un canal específico mientras dejas habilitada la monitorización global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: sobrescritura multicuenta que prevalece sobre la configuración de nivel de canal.
- Estas sobrescrituras por canal se aplican a los canales integrados que las exponen hoy: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram y WhatsApp.

## Monitorización de tiempo de actividad

Los servicios externos de monitorización de tiempo de actividad deberían usar el endpoint dedicado `/health`, no `/v1/chat/completions`.

- **USA:** `GET /health` - respuesta instantánea, no se crea ninguna sesión, no hay llamada a LLM, devuelve `{"ok":true,"status":"live"}`
- **NO uses:** `/v1/chat/completions` para comprobaciones de salud - cada solicitud crea una sesión completa de agente con instantánea de Skills, ensamblaje de contexto y llamadas a LLM

Cuando no se proporciona el encabezado `x-openclaw-session-key` ni el campo `user`, `/v1/chat/completions` genera una nueva sesión aleatoria para cada solicitud. Los servicios de monitorización que hacen ping cada 15 minutos crean unas 96 sesiones/día, cada una consumiendo 4-22 KB. Con el tiempo, esto provoca crecimiento excesivo del almacén de sesiones y puede causar desbordamiento de la ventana de contexto.

### Ejemplos de configuración de servicios de monitorización

- **BetterStack:** Configura la URL de comprobación de salud en `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Añade un nuevo monitor HTTP con la URL `https://<your-gateway-host>:<port>/health`
- **Genérico:** Cualquier GET HTTP a `/health` devuelve 200 con `{"ok":true}` cuando el gateway está saludable

## Cuando algo falla

- `logged out` o estado 409-515 -> revincula con `openclaw channels logout` y luego `openclaw channels login`.
- Gateway inaccesible -> inícialo: `openclaw gateway --port 18789` (usa `--force` si el puerto está ocupado).
- Sin mensajes entrantes -> confirma que el teléfono vinculado está en línea y que el remitente está permitido (`channels.whatsapp.allowFrom`); para chats de grupo, asegúrate de que la lista de permitidos + las reglas de mención coincidan (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando "health" dedicado

`openclaw health` consulta al Gateway en ejecución su instantánea de salud (sin sockets de canal
directos desde la CLI). De forma predeterminada, devuelve una instantánea fresca en caché del gateway y el
gateway actualiza esa caché en segundo plano; `--verbose` fuerza una prueba en vivo en su lugar.
El comando informa credenciales vinculadas/antigüedad de autenticación cuando estén disponibles, resúmenes de prueba por canal,
resumen del almacén de sesiones y duración de la prueba. Sale con código distinto de cero si el Gateway es
inaccesible o si la prueba falla/agota el tiempo de espera.

Opciones:

- `--json`: salida JSON legible por máquina
- `--timeout <ms>`: sobrescribe el tiempo de espera predeterminado de prueba de 10 s
- `--verbose`: fuerza una prueba en vivo e imprime detalles de conexión del gateway
- `--debug`: alias de `--verbose`

La instantánea de salud incluye: `ok` (booleano), `ts` (marca de tiempo), `durationMs` (tiempo de prueba), estado por canal, disponibilidad del agente y resumen del almacén de sesiones.

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
