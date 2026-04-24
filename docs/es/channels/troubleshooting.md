---
read_when:
    - El transporte del canal indica que está conectado, pero las respuestas fallan
    - Necesitas comprobaciones específicas del canal antes de consultar documentación más detallada del proveedor
summary: Solución rápida de problemas a nivel de canal con firmas de fallo y correcciones por canal
title: Solución de problemas de canales
x-i18n:
    generated_at: "2026-04-24T05:20:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae605835c3566958341b11d8bdfc3cd4cb4656142bb2953933d06ed6018a483f
    source_path: channels/troubleshooting.md
    workflow: 15
---

Usa esta página cuando un canal se conecta pero el comportamiento es incorrecto.

## Secuencia de comandos

Ejecuta estos comandos en este orden primero:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Estado base saludable:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, o `admin-capable`
- La sonda del canal muestra el transporte conectado y, cuando es compatible, `works` o `audit ok`

## WhatsApp

### Firmas de fallo de WhatsApp

| Síntoma                         | Comprobación más rápida                              | Solución                                                |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| Conectado pero sin respuestas a mensajes directos | `openclaw pairing list whatsapp`                    | Aprueba al remitente o cambia la política de mensajes directos/lista de permitidos. |
| Se ignoran los mensajes de grupo | Comprueba `requireMention` + patrones de mención en la configuración | Menciona al bot o flexibiliza la política de mención para ese grupo. |
| Desconexiones aleatorias/bucles de reinicio de sesión | `openclaw channels status --probe` + registros      | Vuelve a iniciar sesión y verifica que el directorio de credenciales esté en buen estado. |

Solución de problemas completa: [solución de problemas de WhatsApp](/es/channels/whatsapp#troubleshooting)

## Telegram

### Firmas de fallo de Telegram

| Síntoma                             | Comprobación más rápida                            | Solución                                                                                                                  |
| ----------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` pero sin un flujo de respuesta utilizable | `openclaw pairing list telegram`                 | Aprueba la vinculación o cambia la política de mensajes directos.                                                         |
| El bot está en línea pero el grupo permanece en silencio | Verifica el requisito de mención y el modo de privacidad del bot | Desactiva el modo de privacidad para la visibilidad en el grupo o menciona al bot.                                        |
| Fallos de envío con errores de red  | Inspecciona los registros en busca de fallos de llamadas a la API de Telegram | Corrige el enrutamiento DNS/IPv6/proxy hacia `api.telegram.org`.                                                          |
| El polling se bloquea o se reconecta lentamente | `openclaw logs --follow` para diagnósticos de polling | Actualiza; si los reinicios son falsos positivos, ajusta `pollingStallThresholdMs`. Los bloqueos persistentes siguen apuntando a proxy/DNS/IPv6. |
| `setMyCommands` rechazado al iniciar | Inspecciona los registros en busca de `BOT_COMMANDS_TOO_MUCH` | Reduce los comandos personalizados/de Plugin/Skills de Telegram o desactiva los menús nativos.                          |
| Actualizaste y la lista de permitidos te bloquea | `openclaw security audit` y listas de permitidos en la configuración | Ejecuta `openclaw doctor --fix` o sustituye `@username` por ID numéricos de remitente.                                   |

Solución de problemas completa: [solución de problemas de Telegram](/es/channels/telegram#troubleshooting)

## Discord

### Firmas de fallo de Discord

| Síntoma                         | Comprobación más rápida              | Solución                                                  |
| ------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| El bot está en línea pero no responde en el servidor | `openclaw channels status --probe`  | Permite el servidor/canal y verifica el intent de contenido de mensajes. |
| Se ignoran los mensajes de grupo | Comprueba en los registros descartes por control de mención | Menciona al bot o establece `requireMention: false` para el servidor/canal. |
| Faltan respuestas a mensajes directos | `openclaw pairing list discord`     | Aprueba la vinculación de mensajes directos o ajusta la política de mensajes directos. |

Solución de problemas completa: [solución de problemas de Discord](/es/channels/discord#troubleshooting)

## Slack

### Firmas de fallo de Slack

| Síntoma                                | Comprobación más rápida                    | Solución                                                                                                                                              |
| -------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode conectado pero sin respuestas | `openclaw channels status --probe`        | Verifica el token de la app + el token del bot y los ámbitos necesarios; observa `botTokenStatus` / `appTokenStatus = configured_unavailable` en configuraciones respaldadas por SecretRef. |
| Mensajes directos bloqueados           | `openclaw pairing list slack`              | Aprueba la vinculación o flexibiliza la política de mensajes directos.                                                                                |
| Mensaje de canal ignorado              | Comprueba `groupPolicy` y la lista de permitidos del canal | Permite el canal o cambia la política a `open`.                                                                                                      |

Solución de problemas completa: [solución de problemas de Slack](/es/channels/slack#troubleshooting)

## iMessage y BlueBubbles

### Firmas de fallo de iMessage y BlueBubbles

| Síntoma                          | Comprobación más rápida                                            | Solución                                              |
| -------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| No hay eventos entrantes         | Verifica la accesibilidad del webhook/servidor y los permisos de la app | Corrige la URL del webhook o el estado del servidor BlueBubbles. |
| Puede enviar pero no recibir en macOS | Comprueba los permisos de privacidad de macOS para la automatización de Mensajes | Vuelve a conceder permisos TCC y reinicia el proceso del canal. |
| Remitente de mensaje directo bloqueado | `openclaw pairing list imessage` o `openclaw pairing list bluebubbles` | Aprueba la vinculación o actualiza la lista de permitidos. |

Solución de problemas completa:

- [solución de problemas de iMessage](/es/channels/imessage#troubleshooting)
- [solución de problemas de BlueBubbles](/es/channels/bluebubbles#troubleshooting)

## Signal

### Firmas de fallo de Signal

| Síntoma                         | Comprobación más rápida                     | Solución                                                 |
| ------------------------------- | ------------------------------------------- | -------------------------------------------------------- |
| El daemon es accesible pero el bot está en silencio | `openclaw channels status --probe`         | Verifica la URL/cuenta del daemon `signal-cli` y el modo de recepción. |
| Mensaje directo bloqueado       | `openclaw pairing list signal`              | Aprueba al remitente o ajusta la política de mensajes directos. |
| Las respuestas de grupo no se activan | Comprueba la lista de permitidos del grupo y los patrones de mención | Añade remitente/grupo o flexibiliza el control.          |

Solución de problemas completa: [solución de problemas de Signal](/es/channels/signal#troubleshooting)

## QQ Bot

### Firmas de fallo de QQ Bot

| Síntoma                         | Comprobación más rápida                      | Solución                                                      |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| El bot responde "gone to Mars"  | Verifica `appId` y `clientSecret` en la configuración | Configura las credenciales o reinicia el Gateway.            |
| No hay mensajes entrantes       | `openclaw channels status --probe`           | Verifica las credenciales en la QQ Open Platform.            |
| La voz no se transcribe         | Comprueba la configuración del proveedor de STT | Configura `channels.qqbot.stt` o `tools.media.audio`.        |
| Los mensajes proactivos no llegan | Comprueba los requisitos de interacción de la plataforma QQ | QQ puede bloquear mensajes iniciados por el bot sin interacción reciente. |

Solución de problemas completa: [solución de problemas de QQ Bot](/es/channels/qqbot#troubleshooting)

## Matrix

### Firmas de fallo de Matrix

| Síntoma                             | Comprobación más rápida                 | Solución                                                                  |
| ----------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| Inicio de sesión correcto pero ignora mensajes de sala | `openclaw channels status --probe`     | Comprueba `groupPolicy`, la lista de permitidos de la sala y el control de mención. |
| Los mensajes directos no se procesan | `openclaw pairing list matrix`         | Aprueba al remitente o ajusta la política de mensajes directos.          |
| Las salas cifradas fallan           | `openclaw matrix verify status`        | Vuelve a verificar el dispositivo y luego comprueba `openclaw matrix verify backup status`. |
| La restauración de copia de seguridad está pendiente/rota | `openclaw matrix verify backup status` | Ejecuta `openclaw matrix verify backup restore` o vuelve a ejecutarlo con una clave de recuperación. |
| La firma cruzada/bootstrap parece incorrecta | `openclaw matrix verify bootstrap`     | Repara el almacenamiento de secretos, la firma cruzada y el estado de la copia de seguridad de una sola vez. |

Configuración y puesta en marcha completas: [Matrix](/es/channels/matrix)

## Relacionado

- [Vinculación](/es/channels/pairing)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
