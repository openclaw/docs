---
read_when:
    - El transporte del canal indica que está conectado, pero las respuestas fallan
    - Necesitas comprobaciones específicas del canal antes de la documentación detallada del proveedor
summary: Solución rápida de problemas a nivel de canal con firmas de fallos y soluciones por canal
title: Solución de problemas de canales
x-i18n:
    generated_at: "2026-04-30T05:31:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6024f2ae0a058b2296758c237c912a5cd8ea6bbafea33cc201690cc081efcbee
    source_path: channels/troubleshooting.md
    workflow: 16
---

Usa esta página cuando un canal se conecta pero el comportamiento es incorrecto.

## Secuencia de comandos

Ejecuta estos comandos en orden primero:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Base saludable:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` o `admin-capable`
- La prueba del canal muestra el transporte conectado y, donde sea compatible, `works` o `audit ok`

## WhatsApp

### Firmas de fallo de WhatsApp

| Síntoma                         | Comprobación más rápida                              | Corrección                                                                                                                                |
| ------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Conectado, pero sin respuestas por mensaje directo | `openclaw pairing list whatsapp`                     | Aprueba el remitente o cambia la política/lista de permitidos de mensajes directos.                                                       |
| Mensajes de grupo ignorados     | Revisa `requireMention` + los patrones de mención en la configuración | Menciona al bot o flexibiliza la política de menciones para ese grupo.                                                                    |
| El inicio de sesión por QR agota el tiempo con 408 | Revisa las variables de entorno `HTTPS_PROXY` / `HTTP_PROXY` del Gateway | Configura un proxy alcanzable; usa `NO_PROXY` solo para omisiones.                                                                        |
| Bucles aleatorios de desconexión/reinicio de sesión | `openclaw channels status --probe` + registros        | Las reconexiones recientes se marcan incluso si actualmente está conectado; observa los registros, reinicia el Gateway y luego vuelve a enlazar si la inestabilidad continúa. |

Solución de problemas completa: [Solución de problemas de WhatsApp](/es/channels/whatsapp#troubleshooting)

## Telegram

### Firmas de fallo de Telegram

| Síntoma                              | Comprobación más rápida                           | Corrección                                                                                                                        |
| ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` pero sin flujo de respuesta utilizable | `openclaw pairing list telegram`                  | Aprueba el emparejamiento o cambia la política de mensajes directos.                                                       |
| Bot en línea, pero el grupo permanece en silencio | Verifica el requisito de mención y el modo de privacidad del bot | Desactiva el modo de privacidad para la visibilidad en grupos o menciona al bot.                                           |
| Fallos de envío con errores de red    | Inspecciona los registros en busca de fallos de llamadas a la API de Telegram | Corrige el enrutamiento DNS/IPv6/proxy hacia `api.telegram.org`.                                                          |
| El arranque informa `getMe returned 401` | Revisa la fuente del token configurada             | Vuelve a copiar o regenera el token de BotFather y actualiza `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` de la cuenta predeterminada. |
| El sondeo se detiene o reconecta lentamente | `openclaw logs --follow` para diagnósticos de sondeo | Actualiza; si los reinicios son falsos positivos, ajusta `pollingStallThresholdMs`. Los bloqueos persistentes siguen apuntando a proxy/DNS/IPv6. |
| `setMyCommands` rechazado al arrancar | Inspecciona los registros en busca de `BOT_COMMANDS_TOO_MUCH` | Reduce los comandos de Telegram de plugins/Skills/personalizados o desactiva los menús nativos.                           |
| Actualizaste y la lista de permitidos te bloquea | `openclaw security audit` y listas de permitidos de configuración | Ejecuta `openclaw doctor --fix` o reemplaza `@username` por IDs numéricos de remitente.                                   |

Solución de problemas completa: [Solución de problemas de Telegram](/es/channels/telegram#troubleshooting)

## Discord

### Firmas de fallo de Discord

| Síntoma                         | Comprobación más rápida              | Corrección                                                       |
| ------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| Bot en línea, pero sin respuestas del servidor | `openclaw channels status --probe`  | Permite el servidor/canal y verifica la intención de contenido de mensajes. |
| Mensajes de grupo ignorados     | Revisa los registros en busca de descartes por control de menciones | Menciona al bot o establece `requireMention: false` en el servidor/canal. |
| Faltan respuestas por mensaje directo | `openclaw pairing list discord`     | Aprueba el emparejamiento de mensajes directos o ajusta la política de mensajes directos. |

Solución de problemas completa: [Solución de problemas de Discord](/es/channels/discord#troubleshooting)

## Slack

### Firmas de fallo de Slack

| Síntoma                                | Comprobación más rápida                    | Corrección                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modo socket conectado, pero sin respuestas | `openclaw channels status --probe`        | Verifica el token de la aplicación + el token del bot y los permisos requeridos; observa `botTokenStatus` / `appTokenStatus = configured_unavailable` en configuraciones respaldadas por SecretRef. |
| Mensajes directos bloqueados           | `openclaw pairing list slack`              | Aprueba el emparejamiento o flexibiliza la política de mensajes directos.                                                                            |
| Mensaje de canal ignorado              | Revisa `groupPolicy` y la lista de permitidos del canal | Permite el canal o cambia la política a `open`.                                                                                                     |

Solución de problemas completa: [Solución de problemas de Slack](/es/channels/slack#troubleshooting)

## iMessage y BlueBubbles

### Firmas de fallo de iMessage y BlueBubbles

| Síntoma                          | Comprobación más rápida                                                  | Corrección                                                   |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| Sin eventos entrantes            | Verifica la alcanzabilidad del Webhook/servidor y los permisos de la aplicación | Corrige la URL del Webhook o el estado del servidor BlueBubbles. |
| Puede enviar, pero no recibir en macOS | Revisa los permisos de privacidad de macOS para la automatización de Messages | Vuelve a conceder los permisos TCC y reinicia el proceso del canal. |
| Remitente de mensaje directo bloqueado | `openclaw pairing list imessage` o `openclaw pairing list bluebubbles` | Aprueba el emparejamiento o actualiza la lista de permitidos. |

Solución de problemas completa:

- [Solución de problemas de iMessage](/es/channels/imessage#troubleshooting)
- [Solución de problemas de BlueBubbles](/es/channels/bluebubbles#troubleshooting)

## Signal

### Firmas de fallo de Signal

| Síntoma                         | Comprobación más rápida                     | Corrección                                                      |
| ------------------------------- | ------------------------------------------- | -------------------------------------------------------- |
| Demonio alcanzable, pero bot silencioso | `openclaw channels status --probe`         | Verifica la URL/cuenta del demonio `signal-cli` y el modo de recepción. |
| Mensaje directo bloqueado       | `openclaw pairing list signal`              | Aprueba el remitente o ajusta la política de mensajes directos. |
| Las respuestas de grupo no se activan | Revisa la lista de permitidos del grupo y los patrones de mención | Agrega el remitente/grupo o afloja el control de acceso. |

Solución de problemas completa: [Solución de problemas de Signal](/es/channels/signal#troubleshooting)

## QQ Bot

### Firmas de fallo de QQ Bot

| Síntoma                         | Comprobación más rápida                              | Corrección                                                             |
| ------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| El bot responde "se fue a Marte" | Verifica `appId` y `clientSecret` en la configuración | Configura las credenciales o reinicia el Gateway.                       |
| Sin mensajes entrantes          | `openclaw channels status --probe`                   | Verifica las credenciales en la QQ Open Platform.                       |
| Voz no transcrita               | Revisa la configuración del proveedor STT            | Configura `channels.qqbot.stt` o `tools.media.audio`.                  |
| Los mensajes proactivos no llegan | Revisa los requisitos de interacción de la plataforma QQ | QQ puede bloquear mensajes iniciados por el bot sin interacción reciente. |

Solución de problemas completa: [Solución de problemas de QQ Bot](/es/channels/qqbot#troubleshooting)

## Matrix

### Firmas de fallo de Matrix

| Síntoma                             | Comprobación más rápida                 | Corrección                                                                       |
| ----------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| Sesión iniciada, pero ignora mensajes de sala | `openclaw channels status --probe`     | Revisa `groupPolicy`, la lista de permitidos de salas y el control por menciones. |
| Los mensajes directos no se procesan | `openclaw pairing list matrix`         | Aprueba el remitente o ajusta la política de mensajes directos.                  |
| Fallan las salas cifradas           | `openclaw matrix verify status`        | Vuelve a verificar el dispositivo y luego revisa `openclaw matrix verify backup status`. |
| La restauración de copia de seguridad está pendiente/rota | `openclaw matrix verify backup status` | Ejecuta `openclaw matrix verify backup restore` o vuelve a ejecutar con una clave de recuperación. |
| La firma cruzada/inicialización parece incorrecta | `openclaw matrix verify bootstrap`     | Repara el almacenamiento secreto, la firma cruzada y el estado de copia de seguridad en una sola pasada. |

Configuración e instalación completas: [Matrix](/es/channels/matrix)

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
