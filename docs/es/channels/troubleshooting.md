---
read_when:
    - El transporte del canal indica que está conectado, pero las respuestas fallan
    - Necesitas comprobaciones específicas del canal antes de la documentación profunda del proveedor
summary: Solución rápida de problemas a nivel de canal con firmas de fallo y correcciones por canal
title: Solución de problemas de canales
x-i18n:
    generated_at: "2026-06-27T10:47:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
    source_path: channels/troubleshooting.md
    workflow: 16
---

Usa esta página cuando un canal se conecta pero el comportamiento es incorrecto.

## Escalera de comandos

Ejecuta estos primero en orden:

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
- `Capability: read-only`, `write-capable`, o `admin-capable`
- La prueba del canal muestra el transporte conectado y, cuando sea compatible, `works` o `audit ok`

## Después de una actualización

Usa esto cuando Telegram, iMessage, configuraciones de la era BlueBubbles u otro canal de plugin
desaparezcan después de actualizar.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Busca `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix` en `openclaw status --all`. Eso significa que el canal está configurado, pero
la ruta de configuración/carga del plugin encontró un árbol de dependencias corrupto en lugar de registrar
el canal. `openclaw doctor --fix` elimina directorios obsoletos de preparación de dependencias
del plugin y sombras de autenticación obsoletas; luego `openclaw gateway restart` recarga el
estado limpio.

## WhatsApp

### Firmas de error de WhatsApp

| Síntoma                             | Comprobación más rápida                              | Corrección                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Conectado pero sin respuestas de DM | `openclaw pairing list whatsapp`                     | Aprueba el remitente o cambia la política/lista de permitidos de DM.                                                                  |
| Mensajes de grupo ignorados         | Revisa `requireMention` + patrones de mención en la configuración | Menciona al bot o relaja la política de menciones para ese grupo.                                                             |
| El inicio de sesión por QR agota el tiempo con 408 | Revisa las variables de entorno `HTTPS_PROXY` / `HTTP_PROXY` del gateway | Configura un proxy accesible; usa `NO_PROXY` solo para omisiones.                                                    |
| Bucles aleatorios de desconexión/reinicio de sesión | `openclaw channels status --probe` + registros | Las reconexiones recientes se marcan incluso cuando está conectado actualmente; observa los registros, reinicia el gateway y luego vuelve a vincular si las fluctuaciones continúan. |
| Bucle `status=408 Request Time-out` | Prueba, registros, doctor y luego estado del gateway | Corrige primero la conectividad/temporización del host; haz una copia de seguridad de la autenticación y vuelve a vincular la cuenta si el bucle persiste. |
| Las respuestas llegan segundos/minutos tarde | `openclaw doctor --fix`                      | Doctor detiene clientes TUI locales obsoletos verificados cuando degradan el bucle de eventos del Gateway.                            |

Solución de problemas completa: [Solución de problemas de WhatsApp](/es/channels/whatsapp#troubleshooting)

## Telegram

### Firmas de error de Telegram

| Síntoma                              | Comprobación más rápida                           | Corrección                                                                                                                     |
| ------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/start` pero sin flujo de respuesta utilizable | `openclaw pairing list telegram`          | Aprueba el emparejamiento o cambia la política de DM.                                                                          |
| Bot en línea pero el grupo permanece en silencio | Verifica el requisito de mención y el modo de privacidad del bot | Desactiva el modo de privacidad para visibilidad en grupos o menciona al bot.                                      |
| Errores de envío con errores de red  | Inspecciona los registros en busca de fallos de llamadas a la API de Telegram | Corrige el enrutamiento DNS/IPv6/proxy hacia `api.telegram.org`.                                             |
| El inicio informa `getMe returned 401` | Revisa la fuente del token configurada          | Vuelve a copiar o regenera el token de BotFather y actualiza `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` de la cuenta predeterminada. |
| El sondeo se atasca o se reconecta lentamente | `openclaw logs --follow` para diagnósticos de sondeo | Actualiza; si los reinicios son falsos positivos, ajusta `pollingStallThresholdMs`. Los atascos persistentes aún apuntan a proxy/DNS/IPv6. |
| `setMyCommands` rechazado al inicio | Inspecciona los registros en busca de `BOT_COMMANDS_TOO_MUCH` | Reduce los comandos de Telegram de plugins/skills/personalizados o desactiva los menús nativos.                                 |
| Actualizaste y la lista de permitidos te bloquea | `openclaw security audit` y listas de permitidos de configuración | Ejecuta `openclaw doctor --fix` o reemplaza `@username` por IDs numéricos de remitente.                                 |

Solución de problemas completa: [Solución de problemas de Telegram](/es/channels/telegram#troubleshooting)

## Discord

### Firmas de error de Discord

| Síntoma                                   | Comprobación más rápida                                                                                                      | Corrección                                                                                                                                                                                                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot en línea pero sin respuestas en servidores | `openclaw channels status --probe`                                                                                       | Permite el servidor/canal y verifica el intent de contenido de mensajes.                                                                                                                                                                                             |
| Mensajes de grupo ignorados               | Revisa los registros en busca de descartes por puerta de menciones                                                           | Menciona al bot o configura `requireMention: false` para el servidor/canal.                                                                                                                                                                                          |
| Uso de escritura/token pero sin mensaje de Discord | Revisa si esto es un evento de sala ambiental o una sala `message_tool` con participación donde el modelo omitió `message(action=send)` | Inspecciona el registro detallado del gateway en busca de metadatos de carga final suprimida, verifica `messages.groupChat.unmentionedInbound`, lee [Eventos de sala ambiental](/es/channels/ambient-room-events) o conserva `messages.groupChat.visibleReplies: "automatic"` para solicitudes normales de grupo. |
| Faltan respuestas de DM                   | `openclaw pairing list discord`                                                                                              | Aprueba el emparejamiento de DM o ajusta la política de DM.                                                                                                                                                                                                           |

Solución de problemas completa: [Solución de problemas de Discord](/es/channels/discord#troubleshooting)

## Slack

### Firmas de error de Slack

| Síntoma                                | Comprobación más rápida                    | Corrección                                                                                                                                           |
| -------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode conectado pero sin respuestas | `openclaw channels status --probe`      | Verifica el token de app + token de bot y los ámbitos requeridos; observa `botTokenStatus` / `appTokenStatus = configured_unavailable` en configuraciones respaldadas por SecretRef. |
| DM bloqueados                          | `openclaw pairing list slack`              | Aprueba el emparejamiento o relaja la política de DM.                                                                                                |
| Mensaje de canal ignorado              | Revisa `groupPolicy` y la lista de permitidos del canal | Permite el canal o cambia la política a `open`.                                                                                           |

Solución de problemas completa: [Solución de problemas de Slack](/es/channels/slack#troubleshooting)

## iMessage

### Firmas de error de iMessage

| Síntoma                              | Comprobación más rápida                                | Corrección                                                                   |
| ------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Falta `imsg` o falla en no macOS     | `openclaw channels status --probe --channel imessage`  | Ejecuta OpenClaw en la Mac con Messages o usa un envoltorio SSH para `cliPath`. |
| Puede enviar pero no recibir en macOS | Revisa los permisos de privacidad de macOS para automatización de Messages | Vuelve a conceder permisos TCC y reinicia el proceso del canal. |
| Remitente de DM bloqueado            | `openclaw pairing list imessage`                       | Aprueba el emparejamiento o actualiza la lista de permitidos.                |

Solución de problemas completa:

- [Solución de problemas de iMessage](/es/channels/imessage#troubleshooting)

## Signal

### Firmas de error de Signal

| Síntoma                         | Comprobación más rápida                      | Corrección                                                    |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| Demonio accesible pero bot silencioso | `openclaw channels status --probe`      | Verifica la URL/cuenta del demonio `signal-cli` y el modo de recepción. |
| DM bloqueado                    | `openclaw pairing list signal`               | Aprueba el remitente o ajusta la política de DM.              |
| Las respuestas de grupo no se activan | Revisa la lista de permitidos del grupo y los patrones de mención | Agrega remitente/grupo o afloja la puerta.       |

Solución de problemas completa: [Solución de problemas de Signal](/es/channels/signal#troubleshooting)

## QQ Bot

### Firmas de error de QQ Bot

| Síntoma                         | Comprobación más rápida                         | Corrección                                                       |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| El bot responde "gone to Mars"  | Verifica `appId` y `clientSecret` en la configuración | Configura las credenciales o reinicia el gateway.             |
| Sin mensajes entrantes          | `openclaw channels status --probe`              | Verifica las credenciales en QQ Open Platform.                   |
| Voz no transcrita               | Revisa la configuración del proveedor STT       | Configura `channels.qqbot.stt` o `tools.media.audio`.            |
| No llegan mensajes proactivos   | Revisa los requisitos de interacción de la plataforma QQ | QQ puede bloquear mensajes iniciados por el bot sin interacción reciente. |

Solución de problemas completa: [Solución de problemas de QQ Bot](/es/channels/qqbot#troubleshooting)

## Matrix

### Firmas de fallos de Matrix

| Síntoma                             | Comprobación más rápida                | Corrección                                                               |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Sesión iniciada, pero ignora los mensajes de sala | `openclaw channels status --probe`     | Revisa `groupPolicy`, la lista de salas permitidas y el control por menciones. |
| Los mensajes directos no se procesan | `openclaw pairing list matrix`         | Aprueba al remitente o ajusta la política de mensajes directos.          |
| Las salas cifradas fallan           | `openclaw matrix verify status`        | Vuelve a verificar el dispositivo y luego revisa `openclaw matrix verify backup status`. |
| La restauración de copia de seguridad está pendiente/rota | `openclaw matrix verify backup status` | Ejecuta `openclaw matrix verify backup restore` o vuelve a ejecutar con una clave de recuperación. |
| La firma cruzada/inicialización parece incorrecta | `openclaw matrix verify bootstrap`     | Repara el almacenamiento secreto, la firma cruzada y el estado de la copia de seguridad en una sola pasada. |

Configuración inicial y configuración completas: [Matrix](/es/channels/matrix)

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
