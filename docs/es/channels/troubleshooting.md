---
read_when:
    - El transporte del canal indica que está conectado, pero fallan las respuestas
    - Necesitas comprobaciones específicas del canal antes de la documentación detallada del proveedor
summary: Solución rápida de problemas a nivel de canal con firmas de fallo y correcciones por canal
title: Solución de problemas de canales
x-i18n:
    generated_at: "2026-05-11T20:22:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a314cd772e15c038008b78603f811caaa40a3be31e7268c8fb1eefbb000b32
    source_path: channels/troubleshooting.md
    workflow: 16
---

Usa esta página cuando un canal se conecta pero el comportamiento es incorrecto.

## Secuencia de comandos

Ejecuta primero estos comandos en orden:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Estado base correcto:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, o `admin-capable`
- La comprobación del canal muestra el transporte conectado y, donde sea compatible, `works` o `audit ok`

## WhatsApp

### Firmas de fallo de WhatsApp

| Síntoma                             | Comprobación más rápida                            | Corrección                                                                                                                            |
| ----------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Conectado, pero sin respuestas por DM | `openclaw pairing list whatsapp`                 | Aprueba al remitente o cambia la política/lista de permitidos de DM.                                                                  |
| Mensajes de grupo ignorados          | Comprueba `requireMention` + patrones de mención en la configuración | Menciona al bot o relaja la política de menciones para ese grupo.                                                                      |
| El inicio de sesión con QR agota el tiempo con 408 | Comprueba las variables de entorno `HTTPS_PROXY` / `HTTP_PROXY` del Gateway | Configura un proxy accesible; usa `NO_PROXY` solo para exclusiones.                                                                    |
| Bucles aleatorios de desconexión/reinicio de sesión | `openclaw channels status --probe` + registros | Las reconexiones recientes se marcan incluso cuando actualmente está conectado; observa los registros, reinicia el Gateway y vuelve a vincular si la inestabilidad continúa. |
| Las respuestas llegan segundos/minutos tarde | `openclaw doctor --fix`                       | Doctor detiene clientes TUI locales obsoletos verificados cuando están degradando el bucle de eventos del Gateway.                    |

Solución de problemas completa: [Solución de problemas de WhatsApp](/es/channels/whatsapp#troubleshooting)

## Telegram

### Firmas de fallo de Telegram

| Síntoma                              | Comprobación más rápida                         | Corrección                                                                                                                    |
| ------------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/start` pero sin flujo de respuesta utilizable | `openclaw pairing list telegram`       | Aprueba el emparejamiento o cambia la política de DM.                                                                          |
| El bot está en línea, pero el grupo permanece en silencio | Verifica el requisito de mención y el modo de privacidad del bot | Desactiva el modo de privacidad para visibilidad en grupos o menciona al bot.                                                  |
| Fallos de envío con errores de red   | Inspecciona los registros en busca de fallos en llamadas a la API de Telegram | Corrige el enrutamiento de DNS/IPv6/proxy hacia `api.telegram.org`.                                                            |
| El inicio informa `getMe returned 401` | Comprueba la fuente del token configurada      | Vuelve a copiar o regenera el token de BotFather y actualiza `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` de la cuenta predeterminada. |
| El sondeo se atasca o reconecta lentamente | `openclaw logs --follow` para diagnósticos de sondeo | Actualiza; si los reinicios son falsos positivos, ajusta `pollingStallThresholdMs`. Los bloqueos persistentes siguen apuntando a proxy/DNS/IPv6. |
| `setMyCommands` rechazado al iniciar | Inspecciona los registros para `BOT_COMMANDS_TOO_MUCH` | Reduce los comandos de Telegram de plugin/skill/personalizados o desactiva los menús nativos.                                  |
| Actualizaste y la lista de permitidos te bloquea | `openclaw security audit` y listas de permitidos de configuración | Ejecuta `openclaw doctor --fix` o sustituye `@username` por IDs numéricos de remitente.                                        |

Solución de problemas completa: [Solución de problemas de Telegram](/es/channels/telegram#troubleshooting)

## Discord

### Firmas de fallo de Discord

| Síntoma                                   | Comprobación más rápida                                                          | Corrección                                                                                                                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El bot está en línea, pero no responde en servidores | `openclaw channels status --probe`                                    | Permite el servidor/canal y verifica la intención de contenido de mensajes.                                                                                                     |
| Mensajes de grupo ignorados               | Revisa los registros en busca de descartes por compuerta de menciones            | Menciona al bot o configura `requireMention: false` para el servidor/canal.                                                                                                     |
| Uso de escritura/token, pero sin mensaje en Discord | El registro de sesión muestra texto del asistente con `didSendViaMessagingTool: false` | El modelo respondió en privado en lugar de llamar a la herramienta de mensajes. Usa un modelo fiable para llamadas a herramientas o configura `messages.groupChat.visibleReplies: "automatic"` para publicar automáticamente. |
| Faltan respuestas por DM                  | `openclaw pairing list discord`                                                  | Aprueba el emparejamiento por DM o ajusta la política de DM.                                                                                                                    |

Solución de problemas completa: [Solución de problemas de Discord](/es/channels/discord#troubleshooting)

## Slack

### Firmas de fallo de Slack

| Síntoma                                | Comprobación más rápida                 | Corrección                                                                                                                                                  |
| -------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode conectado, pero sin respuestas | `openclaw channels status --probe`   | Verifica el token de app + token de bot y los alcances requeridos; observa `botTokenStatus` / `appTokenStatus = configured_unavailable` en configuraciones respaldadas por SecretRef. |
| DM bloqueados                          | `openclaw pairing list slack`           | Aprueba el emparejamiento o relaja la política de DM.                                                                                                        |
| Mensaje de canal ignorado              | Comprueba `groupPolicy` y la lista de permitidos del canal | Permite el canal o cambia la política a `open`.                                                                                                             |

Solución de problemas completa: [Solución de problemas de Slack](/es/channels/slack#troubleshooting)

## iMessage

### Firmas de fallo de iMessage

| Síntoma                              | Comprobación más rápida                                      | Corrección                                                               |
| ------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Falta `imsg` o falla en sistemas que no son macOS | `openclaw channels status --probe --channel imessage` | Ejecuta OpenClaw en el Mac de Mensajes o usa un wrapper SSH para `cliPath`. |
| Puede enviar, pero no recibir en macOS | Comprueba los permisos de privacidad de macOS para la automatización de Mensajes | Vuelve a conceder permisos TCC y reinicia el proceso del canal.          |
| Remitente de DM bloqueado            | `openclaw pairing list imessage`                             | Aprueba el emparejamiento o actualiza la lista de permitidos.             |

Solución de problemas completa:

- [Solución de problemas de iMessage](/es/channels/imessage#troubleshooting)

## Signal

### Firmas de fallo de Signal

| Síntoma                         | Comprobación más rápida                      | Corrección                                                     |
| ------------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| Daemon accesible, pero bot en silencio | `openclaw channels status --probe`     | Verifica la URL/cuenta del daemon `signal-cli` y el modo de recepción. |
| DM bloqueado                    | `openclaw pairing list signal`               | Aprueba al remitente o ajusta la política de DM.               |
| Las respuestas de grupo no se activan | Comprueba la lista de permitidos del grupo y los patrones de mención | Añade el remitente/grupo o relaja la compuerta.                |

Solución de problemas completa: [Solución de problemas de Signal](/es/channels/signal#troubleshooting)

## QQ Bot

### Firmas de fallo de QQ Bot

| Síntoma                         | Comprobación más rápida                         | Corrección                                                             |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| El bot responde "gone to Mars"  | Verifica `appId` y `clientSecret` en la configuración | Configura las credenciales o reinicia el Gateway.                      |
| Sin mensajes entrantes          | `openclaw channels status --probe`              | Verifica las credenciales en la QQ Open Platform.                      |
| Voz no transcrita               | Comprueba la configuración del proveedor STT    | Configura `channels.qqbot.stt` o `tools.media.audio`.                  |
| Los mensajes proactivos no llegan | Comprueba los requisitos de interacción de la plataforma QQ | QQ puede bloquear mensajes iniciados por el bot sin interacción reciente. |

Solución de problemas completa: [Solución de problemas de QQ Bot](/es/channels/qqbot#troubleshooting)

## Matrix

### Firmas de fallo de Matrix

| Síntoma                             | Comprobación más rápida                     | Corrección                                                                       |
| ----------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------- |
| Sesión iniciada, pero ignora mensajes de sala | `openclaw channels status --probe` | Comprueba `groupPolicy`, la lista de permitidos de salas y la compuerta de menciones. |
| DM no se procesan                   | `openclaw pairing list matrix`              | Aprueba al remitente o ajusta la política de DM.                                  |
| Las salas cifradas fallan           | `openclaw matrix verify status`             | Vuelve a verificar el dispositivo y luego comprueba `openclaw matrix verify backup status`. |
| La restauración de copia de seguridad está pendiente/rota | `openclaw matrix verify backup status` | Ejecuta `openclaw matrix verify backup restore` o vuelve a ejecutarlo con una clave de recuperación. |
| El firmado cruzado/bootstrap parece incorrecto | `openclaw matrix verify bootstrap` | Repara el almacenamiento secreto, el firmado cruzado y el estado de la copia de seguridad en una sola pasada. |

Configuración completa: [Matrix](/es/channels/matrix)

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
