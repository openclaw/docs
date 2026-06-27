---
read_when:
    - Diagnóstico de la conectividad del canal o del estado del Gateway
    - Comprender los comandos y opciones de la CLI de comprobación de estado
summary: Comandos de comprobación de estado y supervisión del estado del Gateway
title: Comprobaciones de estado
x-i18n:
    generated_at: "2026-06-27T11:28:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

Guía breve para verificar la conectividad de canales sin adivinar.

## Comprobaciones rápidas

- `openclaw status` — resumen local: alcance/modo del Gateway, sugerencia de actualización, antigüedad de autenticación del canal vinculado, sesiones + actividad reciente.
- `openclaw status --all` — diagnóstico local completo (solo lectura, color, seguro para pegar al depurar).
- `openclaw status --deep` — pide al Gateway en ejecución una prueba de estado en vivo (`health` con `probe:true`), incluidas pruebas de canal por cuenta cuando se admiten.
- `openclaw health` — pide al Gateway en ejecución su instantánea de estado (solo WS; sin sockets de canal directos desde la CLI).
- `openclaw health --verbose` — fuerza una prueba de estado en vivo e imprime detalles de conexión del Gateway.
- `openclaw health --json` — salida de instantánea de estado legible por máquina.
- Envía `/status` como mensaje independiente en WhatsApp/WebChat para recibir una respuesta de estado sin invocar al agente.
- Registros: sigue `/tmp/openclaw/openclaw-*.log` y filtra por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Para Discord y otros proveedores de chat, las filas de sesión no indican que el socket esté activo.
`openclaw sessions`, `sessions.list` del Gateway y la herramienta `sessions_list` del agente
leen el estado de conversación almacenado. Un proveedor puede reconectarse y mostrar un estado
de canal saludable antes de que se materialice cualquier nueva fila de sesión. Usa los comandos
de estado de canal y salud anteriores para comprobaciones de conectividad en vivo.

## Diagnósticos profundos

- Credenciales en disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (el mtime debería ser reciente).
- Almacén de sesiones: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (la ruta puede sobrescribirse en la configuración). El recuento y los destinatarios recientes se muestran mediante `status`.
- Flujo de revinculación: `openclaw channels logout && openclaw channels login --verbose` cuando aparezcan códigos de estado 409–515 o `loggedOut` en los registros. (Nota: el flujo de inicio de sesión por QR se reinicia automáticamente una vez para el estado 515 después del emparejamiento).
- Los diagnósticos están habilitados por defecto. El Gateway registra hechos operativos salvo que `diagnostics.enabled: false` esté configurado. Los eventos de memoria registran recuentos de bytes RSS/heap, presión de umbral y presión de crecimiento. La presión crítica de memoria se registra mediante el registrador del Gateway. Cuando `diagnostics.memoryPressureSnapshot: true` está configurado, la presión crítica de memoria también escribe un paquete de estabilidad previo a OOM con estadísticas del heap de V8, contadores de cgroup de Linux cuando están disponibles, recuentos de recursos activos y los archivos de sesión/transcripción más grandes por ruta relativa redactada. Las advertencias de actividad registran retraso del event-loop, utilización del event-loop, proporción de núcleos de CPU y recuentos de sesiones activas/en espera/en cola cuando el proceso está en ejecución pero saturado. Los eventos de carga sobredimensionada registran qué se rechazó, truncó o dividió en fragmentos, además de tamaños y límites cuando están disponibles. No registran el texto del mensaje, contenidos adjuntos, cuerpo del Webhook, cuerpo sin procesar de solicitud o respuesta, tokens, cookies ni valores secretos. El mismo Heartbeat inicia el registrador de estabilidad acotado, que está disponible mediante `openclaw gateway stability` o el RPC `diagnostics.stability` del Gateway. Las salidas fatales del Gateway, tiempos de espera de apagado y fallos de inicio tras reinicio persisten la instantánea más reciente del registrador en `~/.openclaw/logs/stability/` cuando existen eventos; la presión crítica de memoria también lo hace solo cuando `diagnostics.memoryPressureSnapshot: true` está configurado. Inspecciona el paquete guardado más reciente con `openclaw gateway stability --bundle latest`.
- Para informes de errores, ejecuta `openclaw gateway diagnostics export` y adjunta el zip generado. La exportación combina un resumen Markdown, el paquete de estabilidad más reciente, metadatos de registro saneados, instantáneas saneadas de estado/salud del Gateway y la forma de la configuración. Está pensada para compartirse: el texto del chat, cuerpos de Webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje y valores secretos se omiten o redactan. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

## Configuración del monitor de salud

- `gateway.channelHealthCheckMinutes`: con qué frecuencia el Gateway comprueba la salud del canal. Predeterminado: `5`. Configura `0` para deshabilitar globalmente los reinicios del monitor de salud.
- `gateway.channelStaleEventThresholdMinutes`: cuánto tiempo puede permanecer inactivo un canal conectado antes de que el monitor de salud lo trate como obsoleto y lo reinicie. Predeterminado: `30`. Mantén esto mayor o igual que `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: límite móvil de una hora para reinicios del monitor de salud por canal/cuenta. Predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: deshabilita los reinicios del monitor de salud para un canal específico mientras dejas habilitada la supervisión global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: sobrescritura multicuenta que prevalece sobre la configuración a nivel de canal.
- Estas sobrescrituras por canal se aplican a los monitores de canal integrados que las exponen hoy: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram y WhatsApp.

## Supervisión de tiempo activo

Los servicios externos de supervisión de tiempo activo deben usar el endpoint dedicado `/health`, no `/v1/chat/completions`.

- **SÍ usar:** `GET /health` — respuesta instantánea, no se crea sesión, no hay llamada al LLM, devuelve `{"ok":true,"status":"live"}`
- **NO usar:** `/v1/chat/completions` para comprobaciones de salud — cada solicitud crea una sesión completa de agente con instantánea de Skills, ensamblaje de contexto y llamadas al LLM

Cuando no se proporciona el encabezado `x-openclaw-session-key` ni el campo `user`, `/v1/chat/completions` genera una nueva sesión aleatoria para cada solicitud. Los servicios de supervisión que hacen ping cada 15 minutos crean ~96 sesiones/día, cada una consumiendo 4–22KB. Con el tiempo, esto provoca crecimiento excesivo del almacén de sesiones y puede causar desbordamiento de la ventana de contexto.

### Ejemplos de configuración de servicios de supervisión

- **BetterStack:** Configura la URL de comprobación de salud como `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Añade un nuevo monitor HTTP con la URL `https://<your-gateway-host>:<port>/health`
- **Genérico:** Cualquier HTTP GET a `/health` devuelve 200 con `{"ok":true}` cuando el Gateway está saludable

## Cuando algo falla

- `logged out` o estado 409–515 → revincula con `openclaw channels logout` y luego `openclaw channels login`.
- Gateway inaccesible → inícialo: `openclaw gateway --port 18789` (usa `--force` si el puerto está ocupado).
- Sin mensajes entrantes → confirma que el teléfono vinculado esté en línea y que el remitente esté permitido (`channels.whatsapp.allowFrom`); para chats de grupo, asegúrate de que la lista de permitidos + las reglas de mención coincidan (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado "health"

`openclaw health` pide al Gateway en ejecución su instantánea de salud (sin sockets de canal
directos desde la CLI). Por defecto puede devolver una instantánea reciente en caché del Gateway; luego el
Gateway actualiza esa caché en segundo plano. `openclaw health --verbose` fuerza
una prueba en vivo en su lugar. El comando informa credenciales vinculadas/antigüedad de autenticación cuando están disponibles,
resúmenes de prueba por canal, resumen del almacén de sesiones y duración de la prueba. Sale
con código distinto de cero si el Gateway es inaccesible o si la prueba falla/agota el tiempo.

Opciones:

- `--json`: salida JSON legible por máquina
- `--timeout <ms>`: sobrescribe el tiempo de espera predeterminado de prueba de 10 s
- `--verbose`: fuerza una prueba en vivo e imprime detalles de conexión del Gateway
- `--debug`: alias de `--verbose`

La instantánea de salud incluye: `ok` (booleano), `ts` (marca de tiempo), `durationMs` (tiempo de prueba), estado por canal, disponibilidad del agente y resumen del almacén de sesiones.

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
