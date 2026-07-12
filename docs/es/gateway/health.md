---
read_when:
    - Diagnóstico de la conectividad de los canales o del estado del Gateway
    - Descripción de los comandos y las opciones de la CLI para las comprobaciones de estado
summary: Comandos de comprobación de estado y supervisión del estado del Gateway
title: Comprobaciones de estado
x-i18n:
    generated_at: "2026-07-12T14:29:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6cc015fcd8dc002eafac95fb3e7aa0b6f3be5b9995e94438e2fed539a561931d
    source_path: gateway/health.md
    workflow: 16
---

Guía breve para verificar la conectividad de los canales sin hacer suposiciones.

## Comprobaciones rápidas

- `openclaw status` - resumen local: accesibilidad/modo del Gateway, aviso de actualización, antigüedad de la autenticación del canal vinculado, sesiones + actividad reciente.
- `openclaw status --all` - diagnóstico local completo (solo lectura, con color, seguro para pegar al depurar).
- `openclaw status --deep` - solicita al Gateway en ejecución un sondeo en vivo (`health` con `probe:true`), incluidos sondeos de canales por cuenta cuando son compatibles.
- `openclaw status --usage` - muestra instantáneas de uso/cuota del proveedor de modelos.
- `openclaw health` - solicita al Gateway en ejecución su instantánea de estado (solo WS; sin sockets directos de canales desde la CLI).
- `openclaw health --verbose` (alias `--debug`) - fuerza un sondeo de estado en vivo y muestra los detalles de conexión del Gateway.
- `openclaw health --json` - salida de la instantánea de estado legible por máquinas.
- Envía `/status` como comando de chat independiente en cualquier canal para obtener una respuesta de estado sin invocar al agente.
- Registros: sigue `/tmp/openclaw/openclaw-*.log` y filtra por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Para Discord y otros proveedores de chat, las filas de sesiones no indican que el socket esté activo.
`openclaw sessions`, `sessions.list` del Gateway y la herramienta `sessions_list` del agente
leen el estado almacenado de las conversaciones. Un proveedor puede volver a conectarse y mostrar un estado
de canal correcto antes de que se materialice una nueva fila de sesión. Usa los comandos de estado del canal y
de estado general anteriores para realizar comprobaciones de conectividad en vivo.

## Diagnósticos detallados

- Credenciales en disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (la fecha de modificación debe ser reciente).
- Almacén de sesiones: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. El recuento y los destinatarios recientes se muestran mediante `status`.
- Flujo para volver a vincular: `openclaw channels logout && openclaw channels login --verbose` cuando aparecen códigos de estado 409-515 o `loggedOut` en los registros. El flujo de inicio de sesión mediante QR se reinicia automáticamente una vez para el estado 515 después del emparejamiento.
- Los diagnósticos están habilitados de forma predeterminada (`diagnostics.enabled: false` los deshabilita). Los eventos de memoria registran los recuentos de bytes de RSS/montículo y la presión por umbral/crecimiento; la presión crítica de memoria se registra mediante el registrador del Gateway y, cuando se establece `diagnostics.memoryPressureSnapshot: true`, también escribe un paquete de estabilidad previo a un error OOM (estadísticas del montículo de V8, contadores de cgroup de Linux cuando están disponibles, recuentos de recursos activos y los archivos de sesión/transcripción más grandes por ruta relativa censurada). Las advertencias de actividad registran el retraso/uso del bucle de eventos, la proporción de núcleos de CPU y los recuentos de sesiones activas/en espera/en cola cuando el proceso está en ejecución pero saturado. Los eventos de carga útil sobredimensionada registran qué se rechazó/truncó/dividió en fragmentos, además de los tamaños y límites, pero nunca el texto de los mensajes, el contenido de los archivos adjuntos, los cuerpos de los Webhook, los cuerpos sin procesar de solicitudes/respuestas, los tokens, las cookies ni los valores secretos.
- El mismo Heartbeat impulsa el registrador de estabilidad acotado: `openclaw gateway stability` (o el RPC `diagnostics.stability` del Gateway). Las salidas fatales del Gateway, los tiempos de espera agotados durante el cierre, los fallos de inicio tras un reinicio y, cuando `diagnostics.memoryPressureSnapshot: true`, la presión crítica de memoria conservan la instantánea más reciente en `~/.openclaw/logs/stability/`. Inspecciona el paquete más reciente con `openclaw gateway stability --bundle latest`.
- Para informes de errores, ejecuta `openclaw gateway diagnostics export` y adjunta el archivo zip generado: un resumen en Markdown, el paquete de estabilidad más reciente, metadatos de registro saneados, instantáneas saneadas de estado/condición del Gateway y la estructura de la configuración. El texto del chat, los cuerpos de los Webhook, las salidas de herramientas, las credenciales, las cookies, los identificadores de cuentas/mensajes y los valores secretos se omiten o censuran. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

## Configuración del monitor de estado

- `gateway.channelHealthCheckMinutes`: frecuencia con la que el Gateway comprueba el estado del canal. Valor predeterminado: `5`. Establece `0` para deshabilitar globalmente los reinicios del monitor de estado.
- `gateway.channelStaleEventThresholdMinutes`: cuánto tiempo puede permanecer inactivo un canal conectado antes de que el monitor de estado lo considere obsoleto y lo reinicie. Valor predeterminado: `30`. Mantén este valor mayor o igual que `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: límite móvil de una hora para los reinicios del monitor de estado por canal/cuenta. Valor predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: deshabilita los reinicios del monitor de estado para un canal específico y mantiene habilitada la supervisión global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: anulación para varias cuentas que prevalece sobre la configuración del canal.
- Estas anulaciones por canal se aplican a los canales integrados que las ofrecen actualmente: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram y WhatsApp.

## Supervisión del tiempo de actividad

Los servicios externos de supervisión del tiempo de actividad deben usar el punto de conexión dedicado `/health`, no `/v1/chat/completions`.

- **USA:** `GET /health` - respuesta instantánea, no se crea ninguna sesión, no se llama al LLM, devuelve `{"ok":true,"status":"live"}`
- **NO USES:** `/v1/chat/completions` para comprobaciones de estado - cada solicitud crea una sesión completa del agente con instantánea de Skills, ensamblaje de contexto y llamadas al LLM

Cuando no se proporciona la cabecera `x-openclaw-session-key` ni el campo `user`, `/v1/chat/completions` genera una nueva sesión aleatoria para cada solicitud. Los servicios de supervisión que hacen una consulta cada 15 minutos crean ~96 sesiones/día, cada una de las cuales consume 4-22KB. Con el tiempo, esto provoca el crecimiento excesivo del almacén de sesiones y puede causar el desbordamiento de la ventana de contexto.

### Ejemplos de configuración de servicios de supervisión

- **BetterStack:** Establece la URL de comprobación de estado en `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Añade un nuevo monitor HTTP con la URL `https://<your-gateway-host>:<port>/health`
- **Genérico:** Cualquier solicitud HTTP GET a `/health` devuelve 200 con `{"ok":true}` cuando el Gateway funciona correctamente

## Cuando algo falla

- `logged out` o estado 409-515 -> vuelve a vincular con `openclaw channels logout` y después `openclaw channels login`.
- No se puede acceder al Gateway -> inícialo: `openclaw gateway --port 18789` (usa `--force` si el puerto está ocupado).
- No hay mensajes entrantes -> confirma que el teléfono vinculado esté en línea y que el remitente esté permitido (`channels.whatsapp.allowFrom`); para chats de grupo, asegúrate de que la lista de permitidos y las reglas de menciones coincidan (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado "health"

`openclaw health` solicita al Gateway en ejecución su instantánea de estado (sin sockets directos de
canales desde la CLI). De forma predeterminada, devuelve una instantánea reciente almacenada en caché del Gateway y el
Gateway actualiza esa caché en segundo plano; `--verbose` fuerza en su lugar un sondeo en vivo.
El comando informa de las credenciales vinculadas/antigüedad de la autenticación cuando están disponibles, resúmenes de sondeos por canal,
un resumen del almacén de sesiones y la duración del sondeo. Finaliza con un código distinto de cero si no se puede
acceder al Gateway o si el sondeo falla o agota el tiempo de espera.

Opciones:

- `--json`: salida JSON legible por máquinas
- `--timeout <ms>`: anula el tiempo de espera predeterminado de 10s del sondeo
- `--verbose`: fuerza un sondeo en vivo y muestra los detalles de conexión del Gateway
- `--debug`: alias de `--verbose`

La instantánea de estado incluye: `ok` (booleano), `ts` (marca de tiempo), `durationMs` (duración del sondeo), estado por canal, disponibilidad del agente y resumen del almacén de sesiones.

## Temas relacionados

- [Manual operativo del Gateway](/es/gateway)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
