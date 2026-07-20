---
read_when:
    - Diagnóstico de la conectividad de los canales o del estado del Gateway
    - Descripción de los comandos y las opciones de la CLI para comprobar el estado del sistema
summary: Comandos de comprobación de estado y monitorización del estado del Gateway
title: Comprobaciones de estado
x-i18n:
    generated_at: "2026-07-20T00:49:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2aad0ffe968452e34158757c45e094c60528a4c6b5c57f9977bb6bc15ffd202e
    source_path: gateway/health.md
    workflow: 16
---

Guía breve para verificar la conectividad de los canales sin hacer suposiciones.

## Comprobaciones rápidas

- `openclaw status` - resumen local: accesibilidad/modo del Gateway, aviso de actualización, antigüedad de la autenticación del canal vinculado, sesiones y actividad reciente.
- `openclaw status --all` - diagnóstico local completo (solo lectura, con colores, seguro para pegar durante la depuración).
- `openclaw status --deep` - solicita al Gateway en ejecución un sondeo en vivo (`health` con `probe:true`), incluidos sondeos de canales por cuenta cuando se admiten.
- `openclaw status --usage` - muestra instantáneas de uso/cuota del proveedor de modelos.
- `openclaw health` - solicita al Gateway en ejecución su instantánea de estado (solo WS; la CLI no abre sockets directos con los canales).
- `openclaw health --verbose` (alias `--debug`) - fuerza un sondeo de estado en vivo y muestra los detalles de conexión del Gateway.
- `openclaw health --json` - salida de la instantánea de estado legible por máquinas.
- Envía `/status` como comando de chat independiente en cualquier canal para obtener una respuesta de estado sin invocar al agente.
- Registros: sigue `/tmp/openclaw/openclaw-*.log` y filtra por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Para Discord y otros proveedores de chat, las filas de sesión no indican que el socket esté activo.
`openclaw sessions`, `sessions.list` del Gateway y la herramienta `sessions_list`
del agente leen el estado almacenado de las conversaciones. Un proveedor puede volver a conectarse y mostrar un estado
de canal correcto antes de que se materialice cualquier nueva fila de sesión. Usa los comandos de estado del canal y
de estado general anteriores para comprobar la conectividad en vivo.

## Diagnóstico avanzado

- Credenciales en el disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (la fecha de modificación debe ser reciente).
- Almacén de sesiones: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. El recuento y los destinatarios recientes se muestran mediante `status`.
- Flujo de revinculación: `openclaw channels logout && openclaw channels login --verbose` cuando aparecen en los registros códigos de estado 409-515 o `loggedOut`. El flujo de inicio de sesión mediante QR se reinicia automáticamente una vez para el estado 515 después del emparejamiento.
- El diagnóstico está activado de forma predeterminada (`diagnostics.enabled: false` lo desactiva). Los eventos de memoria registran los recuentos de bytes de RSS/montículo y la presión debida al umbral/crecimiento. Las advertencias de actividad registran el retraso/uso del bucle de eventos, la proporción de núcleos de CPU y los recuentos de sesiones activas/en espera/en cola cuando el proceso está en ejecución, pero saturado. Los eventos de carga útil excesiva registran qué se rechazó/truncó/dividió, además de los tamaños y límites, pero nunca el texto de los mensajes, el contenido de los archivos adjuntos, los cuerpos de los Webhook, los cuerpos sin procesar de solicitudes/respuestas, los tokens, las cookies ni los valores secretos.
- El mismo Heartbeat controla el registrador de estabilidad acotado: `openclaw gateway stability` (o el RPC `diagnostics.stability` del Gateway). Las salidas fatales del Gateway, los tiempos de espera agotados durante el cierre y los fallos de inicio tras un reinicio conservan la instantánea más reciente en `~/.openclaw/logs/stability/`. Inspecciona el paquete más reciente con `openclaw gateway stability --bundle latest`.
- Para los informes de errores, ejecuta `openclaw gateway diagnostics export` y adjunta el archivo zip generado: un resumen en Markdown, el paquete de estabilidad más reciente, metadatos de registro depurados, instantáneas depuradas del estado general y del Gateway, y la estructura de la configuración. El texto del chat, los cuerpos de los Webhook, las salidas de las herramientas, las credenciales, las cookies, los identificadores de cuentas/mensajes y los valores secretos se omiten o censuran. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

## Configuración del monitor de estado

- `channels.<provider>.healthMonitor.enabled`: desactiva los reinicios del monitor de estado para un canal específico sin desactivar la supervisión global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: configuración específica para varias cuentas que prevalece sobre la configuración del canal.
- Actualmente, estas configuraciones por canal se aplican a los canales integrados que las exponen: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram y WhatsApp.

## Supervisión del tiempo de actividad

Los servicios externos de supervisión del tiempo de actividad deben usar el endpoint específico `/health`, no `/v1/chat/completions`.

- **USA:** `GET /health` - respuesta instantánea, no se crea ninguna sesión, no se llama al LLM, devuelve `{"ok":true,"status":"live"}`
- **NO USES:** `/v1/chat/completions` para comprobaciones de estado - cada solicitud crea una sesión completa del agente con una instantánea de Skills, composición de contexto y llamadas al LLM

Cuando no se proporciona el encabezado `x-openclaw-session-key` ni el campo `user`, `/v1/chat/completions` genera una nueva sesión aleatoria para cada solicitud. Los servicios de supervisión que realizan un sondeo cada 15 minutos crean unas 96 sesiones/día, cada una de las cuales consume entre 4-22KB. Con el tiempo, esto provoca que el almacén de sesiones aumente excesivamente y puede desbordar la ventana de contexto.

### Ejemplos de configuración de servicios de supervisión

- **BetterStack:** establece la URL de comprobación de estado en `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** añade un nuevo monitor HTTP con la URL `https://<your-gateway-host>:<port>/health`
- **Genérico:** cualquier solicitud HTTP GET a `/health` devuelve 200 con `{"ok":true}` cuando el Gateway funciona correctamente

## Cuando algo falla

- `logged out` o estado 409-515 -> vuelve a vincular con `openclaw channels logout` y después con `openclaw channels login`.
- No se puede acceder al Gateway -> inícialo: `openclaw gateway --port 18789` (usa `--force` si el puerto está ocupado).
- No hay mensajes entrantes -> confirma que el teléfono vinculado esté conectado y que el remitente esté permitido (`channels.whatsapp.allowFrom`); para los chats grupales, comprueba que la lista de permitidos y las reglas de mención coincidan (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando específico "health"

`openclaw health` solicita al Gateway en ejecución su instantánea de estado (la CLI no abre
sockets directos con los canales). De forma predeterminada, devuelve una instantánea reciente del Gateway almacenada en caché y el
Gateway actualiza esa caché en segundo plano; `--verbose` fuerza en su lugar un sondeo en vivo.
El comando informa sobre la antigüedad de las credenciales/autenticación vinculadas cuando está disponible, resúmenes de sondeos por canal,
un resumen del almacén de sesiones y la duración del sondeo. Finaliza con un código distinto de cero si no se puede
acceder al Gateway o si el sondeo falla o agota el tiempo de espera.

Opciones:

- `--json`: salida JSON legible por máquinas
- `--timeout <ms>`: sustituye el tiempo de espera predeterminado del sondeo de 10s
- `--verbose`: fuerza un sondeo en vivo y muestra los detalles de conexión del Gateway
- `--debug`: alias de `--verbose`

La instantánea de estado incluye: `ok` (booleano), `ts` (marca de tiempo), `durationMs` (duración del sondeo), el estado por canal, la disponibilidad del agente y el resumen del almacén de sesiones.

## Relacionado

- [Guía operativa del Gateway](/es/gateway)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
