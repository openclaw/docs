---
read_when:
    - Diagnóstico de la conectividad del canal o del estado del Gateway
    - Descripción de los comandos y las opciones de la CLI para comprobar el estado del sistema
summary: Comandos de comprobación de estado y monitorización del estado del Gateway
title: Comprobaciones de estado
x-i18n:
    generated_at: "2026-07-22T10:34:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 16880a240f66a9b8e7aa5e839cacc493f725f9c30fc136e3c144d8829fdb1471
    source_path: gateway/health.md
    workflow: 16
---

Guía breve para verificar la conectividad de los canales sin hacer conjeturas.

## Comprobaciones rápidas

- `openclaw status` - resumen local: accesibilidad/modo del gateway, sugerencia de actualización, antigüedad de la autenticación del canal vinculado, sesiones y actividad reciente.
- `openclaw status --all` - diagnóstico local completo (solo lectura, con colores, seguro para pegar al depurar).
- `openclaw status --deep` - solicita al gateway en ejecución un sondeo en vivo (`health` con `probe:true`), incluidos sondeos de canales por cuenta cuando son compatibles.
- `openclaw status --usage` - muestra instantáneas de uso/cuota del proveedor de modelos.
- `openclaw health` - solicita al gateway en ejecución su instantánea de estado (solo WS; la CLI no abre sockets directos con los canales).
- `openclaw health --verbose` (alias `--debug`) - fuerza un sondeo de estado en vivo e imprime los detalles de conexión del gateway.
- `openclaw health --json` - salida de la instantánea de estado legible por máquinas.
- Envíe `/status` como comando de chat independiente en cualquier canal para obtener una respuesta de estado sin invocar al agente.
- Registros: siga `/tmp/openclaw/openclaw-*.log` y filtre por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Para Discord y otros proveedores de chat, las filas de sesión no indican que el socket esté activo.
`openclaw sessions`, `sessions.list` del Gateway y la herramienta `sessions_list` del agente
leen el estado de conversación almacenado. Un proveedor puede volver a conectarse y mostrar un estado de canal
correcto antes de que se materialice una nueva fila de sesión. Utilice los comandos de estado del canal y
de estado general anteriores para comprobar la conectividad en vivo.

## Diagnóstico avanzado

- Credenciales en disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (la fecha de modificación debe ser reciente).
- Almacén de sesiones: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. El recuento y los destinatarios recientes se muestran mediante `status`.
- Flujo de revinculación: `openclaw channels logout && openclaw channels login --verbose` cuando aparecen en los registros códigos de estado 409-515 o `loggedOut`. El flujo de inicio de sesión mediante QR se reinicia automáticamente una vez para el estado 515 después del emparejamiento.
- El diagnóstico está activado de forma predeterminada (`diagnostics.enabled: false` lo desactiva). Los eventos de memoria registran los recuentos de bytes de RSS/montículo y la presión por umbral/crecimiento. Las advertencias de actividad registran el retraso/uso del bucle de eventos, la proporción de núcleos de CPU y los recuentos de sesiones activas/en espera/en cola cuando el proceso está en ejecución pero saturado. Los eventos de carga útil sobredimensionada registran qué se rechazó/truncó/dividió, junto con los tamaños y límites, pero nunca el texto de los mensajes, el contenido de los archivos adjuntos, los cuerpos de webhook, los cuerpos sin procesar de solicitudes/respuestas, los tokens, las cookies ni los valores secretos.
- El mismo Heartbeat impulsa el registrador de estabilidad limitado: `openclaw gateway stability` (o la RPC `diagnostics.stability` del Gateway). Las salidas fatales del Gateway, los tiempos de espera agotados durante el cierre y los fallos de inicio tras un reinicio conservan la instantánea más reciente en `~/.openclaw/logs/stability/`. Inspeccione el paquete más reciente con `openclaw gateway stability --bundle latest`.
- Para informar de errores, ejecute `openclaw gateway diagnostics export` y adjunte el archivo zip generado: un resumen en Markdown, el paquete de estabilidad más reciente, metadatos de registro depurados, instantáneas depuradas del estado general/del Gateway y la estructura de la configuración. El texto del chat, los cuerpos de webhook, las salidas de herramientas, las credenciales, las cookies, los identificadores de cuentas/mensajes y los valores secretos se omiten o se censuran. Consulte [Exportación de diagnósticos](/es/gateway/diagnostics).

## Configuración del monitor de estado

- `channels.<provider>.healthMonitor.enabled`: desactiva los reinicios del monitor de estado para un canal específico y mantiene activada la supervisión global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: anulación para varias cuentas que prevalece sobre la configuración del canal.
- Estas anulaciones por canal se aplican a los canales integrados que las exponen actualmente: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram y WhatsApp.

## Supervisión del tiempo de actividad

Los servicios externos de supervisión del tiempo de actividad deben utilizar el endpoint dedicado `/health`, no `/v1/chat/completions`.

- **UTILICE:** `GET /health` - respuesta instantánea, no se crea ninguna sesión, no se realiza ninguna llamada al LLM, devuelve `{"ok":true,"status":"live"}`
- **NO UTILICE:** `/v1/chat/completions` para las comprobaciones de estado - cada solicitud crea una sesión completa del agente con una instantánea de Skills, ensamblaje del contexto y llamadas al LLM

Cuando no se proporciona el encabezado `x-openclaw-session-key` ni el campo `user`, `/v1/chat/completions` genera una nueva sesión aleatoria para cada solicitud. Los servicios de supervisión que realizan un sondeo cada 15 minutos crean ~96 sesiones/día, cada una de las cuales consume 4-22KB. Con el tiempo, esto provoca que el almacén de sesiones crezca excesivamente y puede ocasionar un desbordamiento de la ventana de contexto.

### Ejemplos de configuración de servicios de supervisión

- **BetterStack:** Establezca la URL de comprobación de estado en `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Añada un nuevo monitor HTTP con la URL `https://<your-gateway-host>:<port>/health`
- **Genérico:** Cualquier solicitud HTTP GET a `/health` devuelve 200 con `{"ok":true}` cuando el gateway funciona correctamente

## Cuando algo falla

- `logged out` o estado 409-515 -> vuelva a vincular con `openclaw channels logout` y después con `openclaw channels login`.
- Gateway inaccesible -> inícielo: `openclaw gateway --port 18789` (utilice `--force` si el puerto está ocupado).
- No hay mensajes entrantes -> confirme que el teléfono vinculado esté en línea y que el remitente esté permitido (`channels.whatsapp.allowFrom`); para chats grupales, asegúrese de que la lista de permitidos y las reglas de menciones coincidan (`channels.whatsapp.groups`, `agents.entries.*.groupChat.mentionPatterns`).

## Comando «health» específico

`openclaw health` solicita al gateway en ejecución su instantánea de estado (la CLI no abre
sockets directos con los canales). De forma predeterminada, devuelve una instantánea reciente almacenada en caché del gateway y este
actualiza la caché en segundo plano; `--verbose` fuerza en su lugar un sondeo en vivo.
El comando informa sobre las credenciales vinculadas/la antigüedad de la autenticación cuando están disponibles, los resúmenes de sondeos por canal,
el resumen del almacén de sesiones y la duración del sondeo. Finaliza con un código distinto de cero si el gateway está
inaccesible o el sondeo falla/agota el tiempo de espera.

Opciones:

- `--json`: salida JSON legible por máquinas
- `--timeout <ms>`: anula el tiempo de espera predeterminado del sondeo de 10s
- `--verbose`: fuerza un sondeo en vivo e imprime los detalles de conexión del gateway
- `--debug`: alias de `--verbose`

La instantánea de estado incluye: `ok` (booleano), `ts` (marca de tiempo), `durationMs` (tiempo del sondeo), estado por canal, disponibilidad del agente y resumen del almacén de sesiones.

## Contenido relacionado

- [Guía operativa del Gateway](/es/gateway)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
