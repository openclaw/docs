---
read_when:
    - El transporte del canal indica que está conectado, pero las respuestas fallan
    - Necesitas comprobaciones específicas del canal antes de consultar documentación detallada del proveedor.
summary: Solución rápida de problemas a nivel de canal con patrones de error y correcciones específicos de cada canal
title: Solución de problemas de canales
x-i18n:
    generated_at: "2026-07-11T22:52:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

Usa esta página cuando un canal se conecta, pero el comportamiento es incorrecto.

## Secuencia de comandos

Ejecuta primero estos comandos en orden:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Estado de referencia correcto:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` o `admin-capable`
- La comprobación del canal muestra que el transporte está conectado y, cuando se admite, `works` o `audit ok`

## Después de una actualización

Usa este procedimiento cuando Telegram, iMessage, las configuraciones de la época de BlueBubbles u otro canal de Plugin desaparezcan
después de actualizar.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Busca `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` en `openclaw
status --all`. Esto significa que el canal está configurado, pero la configuración o carga del Plugin encontró un árbol de
dependencias dañado en lugar de registrar el canal. `openclaw doctor --fix` elimina los enlaces simbólicos obsoletos
de dependencias del entorno de ejecución del Plugin y las réplicas de autenticación obsoletas; después, `openclaw gateway restart` vuelve a cargar
un estado limpio.

## WhatsApp

### Indicadores de fallos de WhatsApp

| Síntoma                                  | Comprobación más rápida                             | Solución                                                                                                                                                                                                        |
| ---------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conectado, pero sin respuestas por MD    | `openclaw pairing list whatsapp`                    | Aprueba al remitente o cambia la política/lista de permitidos de MD.                                                                                                                                             |
| Se ignoran los mensajes de grupo         | Comprueba `requireMention` y los patrones de mención en la configuración | Menciona al bot o flexibiliza la política de menciones para ese grupo.                                                                                                      |
| El inicio de sesión por QR expira con 408 | Comprueba las variables de entorno `HTTPS_PROXY` / `HTTP_PROXY` del Gateway | Configura un proxy accesible; usa `NO_PROXY` solo para las exclusiones.                                                                                                          |
| Desconexiones o ciclos de inicio de sesión aleatorios | `openclaw channels status --probe` y los registros | Las reconexiones recientes se señalan incluso si actualmente hay conexión; observa los registros, reinicia el Gateway y vuelve a vincular la cuenta si la inestabilidad continúa. |
| Ciclo `status=408 Request Time-out`       | Comprobación, registros, doctor y después estado del Gateway | Corrige primero la conectividad o la temporización del host; haz una copia de seguridad de la autenticación y vuelve a vincular la cuenta si el ciclo persiste.                          |
| Las respuestas llegan segundos o minutos tarde | `openclaw doctor --fix`                       | Doctor detiene los clientes TUI locales obsoletos verificados cuando degradan el bucle de eventos del Gateway.                                                                                                   |

Solución de problemas completa: [Solución de problemas de WhatsApp](/es/channels/whatsapp#troubleshooting)

## Telegram

### Indicadores de fallos de Telegram

| Síntoma                                      | Comprobación más rápida                         | Solución                                                                                                                                                                                   |
| -------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/start`, pero no hay un flujo de respuesta utilizable | `openclaw pairing list telegram`       | Aprueba el emparejamiento o cambia la política de MD.                                                                                                                                      |
| El bot está en línea, pero el grupo permanece en silencio | Verifica el requisito de mención y el modo de privacidad del bot | Desactiva el modo de privacidad para que el bot pueda ver el grupo o menciona al bot.                                                            |
| Fallos de envío con errores de red            | Examina los registros para detectar fallos en las llamadas a la API de Telegram | Corrige el enrutamiento de DNS/IPv6/proxy hacia `api.telegram.org`.                                                                 |
| El inicio informa `getMe returned 401`        | Comprueba la fuente configurada del token       | Vuelve a copiar o genera de nuevo el token de BotFather y actualiza `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` de la cuenta predeterminada.                                         |
| El sondeo se bloquea o se reconecta lentamente | Consulta `openclaw logs --follow` para ver los diagnósticos del sondeo | Actualiza; si los reinicios son falsos positivos, ajusta `pollingStallThresholdMs`. Los bloqueos persistentes siguen apuntando al proxy, DNS o IPv6. |
| `setMyCommands` se rechaza al iniciar         | Examina los registros en busca de `BOT_COMMANDS_TOO_MUCH` | Reduce los comandos de Plugin, Skills o personalizados de Telegram, o desactiva los menús nativos.                                                                 |
| Tras actualizar, la lista de permitidos te bloquea | `openclaw security audit` y las listas de permitidos de la configuración | Ejecuta `openclaw doctor --fix` o sustituye `@username` por identificadores numéricos de remitente.                                      |

Solución de problemas completa: [Solución de problemas de Telegram](/es/channels/telegram#troubleshooting)

## Discord

### Indicadores de fallos de Discord

| Síntoma                                           | Comprobación más rápida                                                                                                                   | Solución                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El bot está en línea, pero no responde en el servidor | `openclaw channels status --probe`                                                                                                     | Permite el servidor/canal y verifica la intención de contenido de mensajes.                                                                                                                                                                                                                                                           |
| Se ignoran los mensajes de grupo                  | Comprueba en los registros los descartes causados por el filtro de menciones                                                             | Menciona al bot o establece `requireMention: false` para el servidor/canal.                                                                                                                                                                                                                                                            |
| Hay actividad de escritura o uso de tokens, pero no aparece ningún mensaje en Discord | Comprueba si se trata de un evento de sala ambiental o de una sala `message_tool` habilitada en la que el modelo omitió `message(action=send)` | Examina el registro detallado del Gateway para detectar metadatos de la carga final suprimida, verifica `messages.groupChat.unmentionedInbound`, consulta [Eventos de salas ambientales](/es/channels/ambient-room-events) o mantén `messages.groupChat.visibleReplies: "automatic"` para las solicitudes normales de grupo. |
| Faltan respuestas por MD                          | `openclaw pairing list discord`                                                                                                          | Aprueba el emparejamiento de MD o ajusta la política de MD.                                                                                                                                                                                                                                                                            |

Solución de problemas completa: [Solución de problemas de Discord](/es/channels/discord#troubleshooting)

## Slack

### Indicadores de fallos de Slack

| Síntoma                                            | Comprobación más rápida                         | Solución                                                                                                                                                                                                                          |
| -------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El modo de socket está conectado, pero no responde | `openclaw channels status --probe`              | Verifica el token de la aplicación, el token del bot y los permisos necesarios; busca `botTokenStatus` / `appTokenStatus = configured_unavailable` en configuraciones respaldadas por SecretRef.                                  |
| Los MD están bloqueados                            | `openclaw pairing list slack`                   | Aprueba el emparejamiento o flexibiliza la política de MD.                                                                                                                                                                       |
| Se ignora el mensaje del canal                     | Comprueba `groupPolicy` y la lista de canales permitidos | Permite el canal o cambia la política a `open`.                                                                                                                                                                        |

Solución de problemas completa: [Solución de problemas de Slack](/es/channels/slack#troubleshooting)

## iMessage

### Indicadores de fallos de iMessage

| Síntoma                                      | Comprobación más rápida                                      | Solución                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Falta `imsg` o falla fuera de macOS          | `openclaw channels status --probe --channel imessage`        | Ejecuta OpenClaw en el Mac con Mensajes o usa un contenedor SSH para `cliPath`.                       |
| Puede enviar, pero no recibir en macOS       | Comprueba los permisos de privacidad de macOS para la automatización de Mensajes | Vuelve a conceder los permisos de TCC y reinicia el proceso del canal.             |
| El remitente de MD está bloqueado            | `openclaw pairing list imessage`                             | Aprueba el emparejamiento o actualiza la lista de permitidos.                                        |

Solución de problemas completa: [Solución de problemas de iMessage](/es/channels/imessage#troubleshooting)

## Signal

### Indicadores de fallos de Signal

| Síntoma                                     | Comprobación más rápida                         | Solución                                                                  |
| ------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| Se puede acceder al demonio, pero el bot no responde | `openclaw channels status --probe`       | Verifica la URL/cuenta del demonio `signal-cli` y el modo de recepción.   |
| El MD está bloqueado                        | `openclaw pairing list signal`                 | Aprueba al remitente o ajusta la política de MD.                          |
| Las respuestas de grupo no se activan       | Comprueba la lista de grupos permitidos y los patrones de mención | Añade el remitente/grupo o flexibiliza el filtro.             |

Solución de problemas completa: [Solución de problemas de Signal](/es/channels/signal#troubleshooting)

## Bot de QQ

### Indicadores de fallos del Bot de QQ

| Síntoma                                      | Comprobación más rápida                         | Solución                                                                 |
| -------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| El bot responde que «se fue a Marte»         | Verifica `appId` y `clientSecret` en la configuración | Configura las credenciales o reinicia el Gateway.                  |
| No hay mensajes entrantes                    | `openclaw channels status --probe`             | Verifica las credenciales en la plataforma abierta de QQ.                |
| La voz no se transcribe                      | Comprueba la configuración del proveedor de STT | Configura `channels.qqbot.stt` o `tools.media.audio`.                    |
| Los mensajes proactivos no llegan            | Comprueba los requisitos de interacción de la plataforma QQ | QQ puede bloquear los mensajes iniciados por el bot si no ha habido una interacción reciente. |

Solución de problemas completa: [Solución de problemas del Bot de QQ](/es/channels/qqbot#troubleshooting)

## Matrix

### Firmas de fallos de Matrix

| Síntoma                                      | Comprobación más rápida                  | Solución                                                                                               |
| -------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Ha iniciado sesión, pero ignora los mensajes de las salas | `openclaw channels status --probe`       | Compruebe `groupPolicy`, la lista de permitidos de salas y el requisito de mención.                    |
| Los mensajes directos no se procesan         | `openclaw pairing list matrix`           | Apruebe al remitente o ajuste la política de mensajes directos.                                        |
| Las salas cifradas fallan                    | `openclaw matrix verify status`          | Vuelva a verificar el dispositivo y, después, compruebe `openclaw matrix verify backup status`.        |
| La restauración de la copia de seguridad está pendiente o falla | `openclaw matrix verify backup status`   | Ejecute `openclaw matrix verify backup restore` o repita la operación con una clave de recuperación.   |
| La firma cruzada o la inicialización parecen incorrectas | `openclaw matrix verify bootstrap`       | Repare de una vez el almacenamiento de secretos, la firma cruzada y el estado de la copia de seguridad. |

Configuración completa: [Matrix](/es/channels/matrix)

## Temas relacionados

- [Emparejamiento](/es/channels/pairing)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
