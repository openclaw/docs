---
read_when:
    - Usabas el canal antiguo de BlueBubbles y necesitas pasar a iMessage
    - Estás eligiendo la configuración de iMessage compatible con OpenClaw
    - Necesitas una breve explicación de la eliminación de BlueBubbles
summary: La compatibilidad con BlueBubbles se eliminó de OpenClaw. Usa el plugin de iMessage incluido con imsg para las configuraciones nuevas y migradas de iMessage.
title: Eliminación de BlueBubbles y la ruta imsg de iMessage
x-i18n:
    generated_at: "2026-07-05T11:00:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Eliminación de BlueBubbles y la ruta imsg de iMessage

OpenClaw ya no incluye el canal BlueBubbles. La compatibilidad con iMessage se ejecuta a través del Plugin `imessage` incluido: el Gateway inicia [`imsg`](https://github.com/steipete/imsg) como proceso secundario, localmente o mediante un envoltorio SSH, y se comunica por JSON-RPC a través de stdin/stdout. Sin servidor, sin Webhook, sin puerto.

Si tu configuración todavía contiene `channels.bluebubbles`, mígrala a `channels.imessage`. La URL de documentación heredada `/channels/bluebubbles` redirige a [Venir desde BlueBubbles](/es/channels/imessage-from-bluebubbles), que contiene la tabla completa de traducción de configuración y la lista de verificación de transición.

## Qué cambió

- La ruta de iMessage compatible no tiene servidor HTTP de BlueBubbles, ruta de Webhook, contraseña REST ni runtime de Plugin de BlueBubbles.
- OpenClaw lee y observa Messages a través de `imsg` en la Mac donde Messages.app tiene la sesión iniciada.
- El envío, la recepción, el historial y los medios básicos usan las superficies normales de `imsg` y los permisos de macOS.
- Las acciones avanzadas (respuestas en hilos, tapbacks, editar, deshacer envío, efectos, confirmaciones de lectura, indicadores de escritura, gestión de grupos) necesitan el puente de API privada: ejecuta `imsg launch`, que requiere SIP desactivado.
- Los gateways de Linux y Windows todavía pueden usar iMessage apuntando `channels.imessage.cliPath` a un envoltorio SSH que ejecute `imsg` en la Mac con sesión iniciada.

## Qué hacer

1. Instala y verifica `imsg` en la Mac de Messages:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Concede permisos de Acceso total al disco y Automatización al contexto de proceso que ejecuta `imsg` y OpenClaw.

3. Traduce la configuración anterior:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Reinicia el gateway y verifica:

   ```bash
   openclaw channels status --probe
   ```

5. Prueba los DM, los grupos, los adjuntos y cualquier acción de API privada de la que dependas antes de eliminar tu servidor BlueBubbles anterior.

## Notas de migración

- `channels.bluebubbles.serverUrl` y `channels.bluebubbles.password` no tienen equivalente en iMessage; no hay ningún servidor al que acceder ni contra el cual autenticarse.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` y `actions.*` conservan su significado bajo `channels.imessage`.
- `channels.imessage.includeAttachments` sigue desactivado de forma predeterminada. Configúralo explícitamente si esperas que las fotos, notas de voz, videos o archivos entrantes lleguen al agente.
- Con `groupPolicy: "allowlist"`, copia el bloque `groups` anterior, incluida cualquier entrada comodín `"*"`. Las listas de permitidos de remitentes de grupo y el registro de grupos son controles separados; un bloque `groups` con entradas pero sin un `chat_id` coincidente (o sin `"*"`) descarta el mensaje en runtime, y un bloque `groups` vacío registra una advertencia de inicio aunque el filtrado de remitentes siga permitiendo que pasen los mensajes.
- Los enlaces ACP con `match.channel: "bluebubbles"` deben cambiar a `"imessage"`.
- Las claves de sesión antiguas de BlueBubbles no se convierten en claves de sesión de iMessage. Las aprobaciones de emparejamiento se basan en identificadores de remitente, por lo que las entradas `allowFrom` copiadas siguen funcionando, pero el historial de conversaciones bajo claves de sesión de BlueBubbles no se transfiere.

## Ver también

- [Venir desde BlueBubbles](/es/channels/imessage-from-bluebubbles)
- [iMessage](/es/channels/imessage)
- [Referencia de configuración - iMessage](/es/gateway/config-channels#imessage)
