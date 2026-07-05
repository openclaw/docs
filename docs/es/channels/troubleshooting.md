---
read_when:
    - El transporte del canal indica que está conectado, pero las respuestas fallan
    - Se necesitan comprobaciones específicas del canal antes de profundizar en la documentación del proveedor.
summary: Solución rápida de problemas a nivel de canal con firmas de fallo y correcciones por canal
title: Solución de problemas de canales
x-i18n:
    generated_at: "2026-07-05T11:04:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

Usa esta página cuando un canal se conecta, pero el comportamiento es incorrecto.

## Secuencia de comandos

Ejecuta estos primero y en orden:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Línea base saludable:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` o `admin-capable`
- La comprobación del canal muestra el transporte conectado y, cuando es compatible, `works` o `audit ok`

## Después de una actualización

Usa esto cuando Telegram, iMessage, configuraciones de la época de BlueBubbles u otro canal de Plugin desaparezca
después de actualizar.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Busca `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` en `openclaw
status --all`. Eso significa que el canal está configurado, pero la configuración/carga del Plugin encontró un árbol
de dependencias dañado en lugar de registrar el canal. `openclaw doctor --fix` elimina enlaces simbólicos obsoletos
de dependencias del runtime de Plugins y sombras de autenticación obsoletas; luego `openclaw gateway restart` recarga
un estado limpio.

## WhatsApp

### Firmas de fallo de WhatsApp

| Síntoma                             | Comprobación más rápida                              | Corrección                                                                                                                       |
| ----------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Conectado, pero sin respuestas por DM | `openclaw pairing list whatsapp`                   | Aprueba al remitente o cambia la política/lista de permitidos de DM.                                                             |
| Mensajes de grupo ignorados         | Revisa `requireMention` + patrones de mención en la configuración | Menciona al bot o relaja la política de menciones para ese grupo.                                                        |
| El inicio de sesión por QR agota el tiempo con 408 | Revisa las variables de entorno `HTTPS_PROXY` / `HTTP_PROXY` del Gateway | Configura un proxy alcanzable; usa `NO_PROXY` solo para omisiones.                                          |
| Bucles aleatorios de desconexión/reinicio de sesión | `openclaw channels status --probe` + registros | Las reconexiones recientes se marcan incluso si actualmente está conectado; revisa los registros, reinicia el Gateway y vuelve a vincular si las fluctuaciones continúan. |
| Bucle `status=408 Request Time-out` | Comprobación, registros, doctor y luego estado del Gateway | Corrige primero la conectividad/temporización del host; haz una copia de seguridad de la autenticación y vuelve a vincular la cuenta si el bucle persiste. |
| Las respuestas llegan segundos/minutos tarde | `openclaw doctor --fix`                      | Doctor detiene clientes TUI locales obsoletos verificados cuando están degradando el bucle de eventos del Gateway.               |

Solución de problemas completa: [Solución de problemas de WhatsApp](/es/channels/whatsapp#troubleshooting)

## Telegram

### Firmas de fallo de Telegram

| Síntoma                              | Comprobación más rápida                           | Corrección                                                                                                                |
| ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/start`, pero sin flujo de respuesta usable | `openclaw pairing list telegram`          | Aprueba el emparejamiento o cambia la política de DM.                                                                      |
| Bot en línea, pero el grupo permanece en silencio | Verifica el requisito de mención y el modo de privacidad del bot | Desactiva el modo de privacidad para visibilidad en grupos o menciona al bot.                                  |
| Fallos de envío con errores de red    | Inspecciona los registros para ver fallos de llamadas a la API de Telegram | Corrige el enrutamiento DNS/IPv6/proxy hacia `api.telegram.org`.                                            |
| El arranque informa `getMe returned 401` | Revisa la fuente del token configurado          | Vuelve a copiar o regenera el token de BotFather y actualiza `botToken`, `tokenFile` o la cuenta predeterminada `TELEGRAM_BOT_TOKEN`. |
| El sondeo se atasca o reconecta lentamente | `openclaw logs --follow` para diagnósticos de sondeo | Actualiza; si los reinicios son falsos positivos, ajusta `pollingStallThresholdMs`. Los atascos persistentes siguen apuntando a proxy/DNS/IPv6. |
| `setMyCommands` rechazado al iniciar | Inspecciona los registros para `BOT_COMMANDS_TOO_MUCH` | Reduce comandos de Telegram de Plugins/Skills/personalizados o desactiva los menús nativos.                           |
| Actualizaste y la lista de permitidos te bloquea | `openclaw security audit` y listas de permitidos de configuración | Ejecuta `openclaw doctor --fix` o reemplaza `@username` por ID numéricos de remitente.                         |

Solución de problemas completa: [Solución de problemas de Telegram](/es/channels/telegram#troubleshooting)

## Discord

### Firmas de fallo de Discord

| Síntoma                                   | Comprobación más rápida                                                                                                     | Corrección                                                                                                                                                                                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot en línea, pero sin respuestas en servidores | `openclaw channels status --probe`                                                                                   | Permite el servidor/canal y verifica la intención de contenido de mensajes.                                                                                                                                                                                          |
| Mensajes de grupo ignorados               | Revisa los registros para descartes por compuerta de menciones                                                              | Menciona al bot o configura `requireMention: false` en el servidor/canal.                                                                                                                                                                                            |
| Uso de escritura/token, pero sin mensaje de Discord | Revisa si es un evento de sala ambiente o una sala `message_tool` activada donde el modelo omitió `message(action=send)` | Inspecciona el registro detallado del Gateway para metadatos de carga final suprimidos, verifica `messages.groupChat.unmentionedInbound`, lee [Eventos de sala ambiente](/es/channels/ambient-room-events) o conserva `messages.groupChat.visibleReplies: "automatic"` para solicitudes normales de grupo. |
| Faltan respuestas por DM                  | `openclaw pairing list discord`                                                                                             | Aprueba el emparejamiento por DM o ajusta la política de DM.                                                                                                                                                                                                         |

Solución de problemas completa: [Solución de problemas de Discord](/es/channels/discord#troubleshooting)

## Slack

### Firmas de fallo de Slack

| Síntoma                                | Comprobación más rápida                    | Corrección                                                                                                                                             |
| -------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Socket mode conectado, pero sin respuestas | `openclaw channels status --probe`      | Verifica el token de app + token de bot y los alcances requeridos; revisa `botTokenStatus` / `appTokenStatus = configured_unavailable` en configuraciones respaldadas por SecretRef. |
| DM bloqueados                          | `openclaw pairing list slack`              | Aprueba el emparejamiento o relaja la política de DM.                                                                                                  |
| Mensaje de canal ignorado              | Revisa `groupPolicy` y la lista de permitidos del canal | Permite el canal o cambia la política a `open`.                                                                                     |

Solución de problemas completa: [Solución de problemas de Slack](/es/channels/slack#troubleshooting)

## iMessage

### Firmas de fallo de iMessage

| Síntoma                              | Comprobación más rápida                                      | Corrección                                                           |
| ------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------- |
| `imsg` falta o falla en sistemas que no son macOS | `openclaw channels status --probe --channel imessage` | Ejecuta OpenClaw en el Mac con Messages o usa un envoltorio SSH para `cliPath`. |
| Puede enviar, pero no recibir en macOS | Revisa los permisos de privacidad de macOS para automatización de Messages | Vuelve a conceder permisos TCC y reinicia el proceso del canal. |
| Remitente de DM bloqueado            | `openclaw pairing list imessage`                             | Aprueba el emparejamiento o actualiza la lista de permitidos.         |

Solución de problemas completa: [Solución de problemas de iMessage](/es/channels/imessage#troubleshooting)

## Signal

### Firmas de fallo de Signal

| Síntoma                         | Comprobación más rápida                     | Corrección                                               |
| ------------------------------- | ------------------------------------------- | -------------------------------------------------------- |
| Demonio accesible, pero bot silencioso | `openclaw channels status --probe`     | Verifica la URL/cuenta del demonio `signal-cli` y el modo de recepción. |
| DM bloqueado                    | `openclaw pairing list signal`              | Aprueba al remitente o ajusta la política de DM.         |
| Las respuestas de grupo no se activan | Revisa la lista de permitidos de grupo y los patrones de mención | Agrega remitente/grupo o relaja la compuerta. |

Solución de problemas completa: [Solución de problemas de Signal](/es/channels/signal#troubleshooting)

## QQ Bot

### Firmas de fallo de QQ Bot

| Síntoma                         | Comprobación más rápida                              | Corrección                                                       |
| ------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| El bot responde "se fue a Marte" | Verifica `appId` y `clientSecret` en la configuración | Configura las credenciales o reinicia el Gateway.                |
| No hay mensajes entrantes       | `openclaw channels status --probe`                   | Verifica las credenciales en QQ Open Platform.                   |
| La voz no se transcribe         | Revisa la configuración del proveedor STT            | Configura `channels.qqbot.stt` o `tools.media.audio`.            |
| Los mensajes proactivos no llegan | Revisa los requisitos de interacción de la plataforma QQ | QQ puede bloquear mensajes iniciados por el bot sin interacción reciente. |

Solución de problemas completa: [Solución de problemas de QQ Bot](/es/channels/qqbot#troubleshooting)

## Matrix

### Firmas de fallos de Matrix

| Síntoma                             | Comprobación más rápida                | Solución                                                                   |
| ----------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Sesión iniciada, pero ignora los mensajes de sala | `openclaw channels status --probe`     | Comprueba `groupPolicy`, la lista de salas permitidas y el control de menciones. |
| Los MD no se procesan               | `openclaw pairing list matrix`         | Aprueba al remitente o ajusta la política de MD.                           |
| Las salas cifradas fallan           | `openclaw matrix verify status`        | Vuelve a verificar el dispositivo y luego comprueba `openclaw matrix verify backup status`. |
| La restauración de la copia de seguridad está pendiente o rota | `openclaw matrix verify backup status` | Ejecuta `openclaw matrix verify backup restore` o vuelve a ejecutarlo con una clave de recuperación. |
| La firma cruzada/el arranque inicial parece incorrecto | `openclaw matrix verify bootstrap`     | Repara el almacenamiento de secretos, la firma cruzada y el estado de la copia de seguridad en una sola pasada. |

Configuración y ajuste completos: [Matrix](/es/channels/matrix)

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
