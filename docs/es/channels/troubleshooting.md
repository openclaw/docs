---
read_when:
    - El transporte del canal indica que está conectado, pero las respuestas fallan
    - Necesitas comprobaciones específicas del canal antes de ir a la documentación detallada del proveedor
summary: Solución rápida de problemas a nivel de canal con firmas de fallo y correcciones por canal
title: Solución de problemas de canales
x-i18n:
    generated_at: "2026-04-21T05:13:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e9e8f093bee1c7aafc244d6b999a957b7571cc125096d72060d0df52bf52c0
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Solución de problemas de canales

Usa esta página cuando un canal se conecta pero el comportamiento es incorrecto.

## Escalera de comandos

Ejecuta estos comandos en este orden primero:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Referencia de estado saludable:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` o `admin-capable`
- La sonda del canal muestra el transporte conectado y, donde se admita, `works` o `audit ok`

## WhatsApp

### Firmas de fallo de WhatsApp

| Síntoma                          | Comprobación más rápida                            | Corrección                                              |
| -------------------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| Conectado pero sin respuestas DM | `openclaw pairing list whatsapp`                   | Aprueba el remitente o cambia la política DM/lista de permitidos. |
| Los mensajes de grupo se ignoran | Revisa `requireMention` + patrones de mención en la configuración | Menciona al bot o flexibiliza la política de mención para ese grupo. |
| Desconexiones aleatorias/bucles de reinicio de sesión | `openclaw channels status --probe` + registros     | Vuelve a iniciar sesión y verifica que el directorio de credenciales esté en buen estado. |

Solución completa de problemas: [/channels/whatsapp#troubleshooting](/es/channels/whatsapp#troubleshooting)

## Telegram

### Firmas de fallo de Telegram

| Síntoma                              | Comprobación más rápida                         | Corrección                                                                                                                 |
| ------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/start` pero sin un flujo de respuesta utilizable | `openclaw pairing list telegram`                | Aprueba el emparejamiento o cambia la política DM.                                                                         |
| El bot está en línea pero el grupo sigue en silencio | Verifica el requisito de mención y el modo privacidad del bot | Desactiva el modo privacidad para la visibilidad en grupos o menciona al bot.                                              |
| Fallos de envío con errores de red   | Inspecciona los registros para fallos de llamadas a la API de Telegram | Corrige el enrutamiento DNS/IPv6/proxy hacia `api.telegram.org`.                                                           |
| El polling se detiene o se reconecta lentamente | `openclaw logs --follow` para diagnósticos de polling | Actualiza; si los reinicios son falsos positivos, ajusta `pollingStallThresholdMs`. Los bloqueos persistentes siguen apuntando a proxy/DNS/IPv6. |
| `setMyCommands` se rechaza al iniciar | Inspecciona los registros para `BOT_COMMANDS_TOO_MUCH` | Reduce los comandos de Telegram de Plugin/Skills/personalizados o desactiva los menús nativos.                            |
| Actualizaste y la lista de permitidos te bloquea | `openclaw security audit` y listas de permitidos de la configuración | Ejecuta `openclaw doctor --fix` o reemplaza `@username` por ID numéricos de remitente.                                     |

Solución completa de problemas: [/channels/telegram#troubleshooting](/es/channels/telegram#troubleshooting)

## Discord

### Firmas de fallo de Discord

| Síntoma                          | Comprobación más rápida              | Corrección                                                      |
| -------------------------------- | ------------------------------------ | --------------------------------------------------------------- |
| El bot está en línea pero no responde en el servidor | `openclaw channels status --probe`   | Permite el servidor/canal y verifica la intención de contenido de mensajes. |
| Los mensajes de grupo se ignoran | Revisa los registros para descartes por restricción de mención | Menciona al bot o establece `requireMention: false` para el servidor/canal. |
| Faltan respuestas DM             | `openclaw pairing list discord`      | Aprueba el emparejamiento DM o ajusta la política DM.           |

Solución completa de problemas: [/channels/discord#troubleshooting](/es/channels/discord#troubleshooting)

## Slack

### Firmas de fallo de Slack

| Síntoma                                 | Comprobación más rápida                  | Corrección                                                                                                                                             |
| --------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode conectado pero sin respuestas | `openclaw channels status --probe`       | Verifica el token de la app + el token del bot y los alcances requeridos; revisa `botTokenStatus` / `appTokenStatus = configured_unavailable` en configuraciones respaldadas por SecretRef. |
| DMs bloqueados                          | `openclaw pairing list slack`            | Aprueba el emparejamiento o flexibiliza la política DM.                                                                                               |
| Mensaje de canal ignorado               | Revisa `groupPolicy` y la lista de permitidos del canal | Permite el canal o cambia la política a `open`.                                                                                                       |

Solución completa de problemas: [/channels/slack#troubleshooting](/es/channels/slack#troubleshooting)

## iMessage y BlueBubbles

### Firmas de fallo de iMessage y BlueBubbles

| Síntoma                           | Comprobación más rápida                                                | Corrección                                             |
| --------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| No hay eventos entrantes          | Verifica la accesibilidad del webhook/servidor y los permisos de la app | Corrige la URL del webhook o el estado del servidor BlueBubbles. |
| Puede enviar pero no recibir en macOS | Revisa los permisos de privacidad de macOS para la automatización de Messages | Vuelve a conceder los permisos de TCC y reinicia el proceso del canal. |
| Remitente DM bloqueado            | `openclaw pairing list imessage` o `openclaw pairing list bluebubbles` | Aprueba el emparejamiento o actualiza la lista de permitidos. |

Solución completa de problemas:

- [/channels/imessage#troubleshooting](/es/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/es/channels/bluebubbles#troubleshooting)

## Signal

### Firmas de fallo de Signal

| Síntoma                          | Comprobación más rápida              | Corrección                                                     |
| -------------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| El daemon es accesible pero el bot está en silencio | `openclaw channels status --probe`   | Verifica la URL/cuenta del daemon `signal-cli` y el modo de recepción. |
| DM bloqueado                     | `openclaw pairing list signal`       | Aprueba el remitente o ajusta la política DM.                  |
| Las respuestas en grupo no se activan | Revisa la lista de permitidos de grupos y los patrones de mención | Agrega el remitente/grupo o flexibiliza la restricción.        |

Solución completa de problemas: [/channels/signal#troubleshooting](/es/channels/signal#troubleshooting)

## QQ Bot

### Firmas de fallo de QQ Bot

| Síntoma                          | Comprobación más rápida                    | Corrección                                                            |
| -------------------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| El bot responde "gone to Mars"   | Verifica `appId` y `clientSecret` en la configuración | Configura las credenciales o reinicia el gateway.                     |
| No hay mensajes entrantes        | `openclaw channels status --probe`         | Verifica las credenciales en la QQ Open Platform.                     |
| La voz no se transcribe          | Revisa la configuración del proveedor STT  | Configura `channels.qqbot.stt` o `tools.media.audio`.                 |
| Los mensajes proactivos no llegan | Revisa los requisitos de interacción de la plataforma QQ | QQ puede bloquear mensajes iniciados por el bot sin interacción reciente. |

Solución completa de problemas: [/channels/qqbot#troubleshooting](/es/channels/qqbot#troubleshooting)

## Matrix

### Firmas de fallo de Matrix

| Síntoma                              | Comprobación más rápida                 | Corrección                                                                |
| ------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------- |
| Inició sesión pero ignora mensajes de salas | `openclaw channels status --probe`      | Revisa `groupPolicy`, la lista de permitidos de salas y la restricción por mención. |
| Los DM no se procesan                | `openclaw pairing list matrix`          | Aprueba el remitente o ajusta la política DM.                              |
| Las salas cifradas fallan            | `openclaw matrix verify status`         | Vuelve a verificar el dispositivo y luego revisa `openclaw matrix verify backup status`. |
| La restauración de la copia de seguridad está pendiente/rota | `openclaw matrix verify backup status` | Ejecuta `openclaw matrix verify backup restore` o vuelve a ejecutarlo con una clave de recuperación. |
| El cross-signing/bootstrap parece incorrecto | `openclaw matrix verify bootstrap`      | Repara el almacenamiento secreto, el cross-signing y el estado de la copia de seguridad en una sola pasada. |

Configuración e instalación completas: [Matrix](/es/channels/matrix)
