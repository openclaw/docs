---
read_when:
    - Usabas el antiguo canal BlueBubbles y necesitas migrar a iMessage
    - Estás eligiendo la configuración compatible de iMessage para OpenClaw
    - Necesitas una breve explicación sobre la eliminación de BlueBubbles
summary: Se eliminó la compatibilidad con BlueBubbles de OpenClaw. Use el plugin de iMessage incluido con imsg para las configuraciones nuevas y migradas de iMessage.
title: Eliminación de BlueBubbles y la ruta de iMessage de imsg
x-i18n:
    generated_at: "2026-07-11T22:49:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Eliminación de BlueBubbles y la vía de iMessage mediante imsg

OpenClaw ya no incluye el canal BlueBubbles. La compatibilidad con iMessage funciona mediante el plugin `imessage` incluido: el Gateway inicia [`imsg`](https://github.com/steipete/imsg) como proceso secundario, localmente o mediante un contenedor SSH, y se comunica por JSON-RPC a través de stdin/stdout. Sin servidor, sin Webhook y sin puerto.

Si tu configuración aún contiene `channels.bluebubbles`, migra a `channels.imessage`. La URL antigua de la documentación `/channels/bluebubbles` redirige a [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles), donde encontrarás la tabla completa de conversión de la configuración y la lista de comprobación para la transición.

## Qué cambió

- La vía compatible con iMessage no tiene servidor HTTP de BlueBubbles, ruta de Webhook, contraseña REST ni entorno de ejecución del plugin BlueBubbles.
- OpenClaw lee y supervisa Mensajes mediante `imsg` en el Mac donde se ha iniciado sesión en Messages.app.
- El envío, la recepción, el historial y el contenido multimedia básicos utilizan las interfaces habituales de `imsg` y los permisos de macOS.
- Las acciones avanzadas (respuestas en hilos, reacciones, edición, anulación del envío, efectos, confirmaciones de lectura, indicadores de escritura y administración de grupos) requieren el puente de la API privada: ejecuta `imsg launch`, lo que requiere que SIP esté desactivado.
- Los Gateways de Linux y Windows aún pueden usar iMessage configurando `channels.imessage.cliPath` con un contenedor SSH que ejecute `imsg` en el Mac donde se haya iniciado sesión.

## Qué debes hacer

1. Instala y verifica `imsg` en el Mac con Mensajes:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Concede permisos de acceso total al disco y automatización al contexto del proceso que ejecuta `imsg` y OpenClaw.

3. Convierte la configuración anterior:

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

4. Reinicia el Gateway y comprueba su funcionamiento:

   ```bash
   openclaw channels status --probe
   ```

5. Prueba los mensajes directos, los grupos, los archivos adjuntos y todas las acciones de la API privada de las que dependas antes de eliminar tu antiguo servidor BlueBubbles.

## Notas de migración

- `channels.bluebubbles.serverUrl` y `channels.bluebubbles.password` no tienen equivalente en iMessage; no hay ningún servidor al que conectarse ni en el que autenticarse.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` y `actions.*` conservan su significado en `channels.imessage`.
- `channels.imessage.includeAttachments` sigue desactivado de forma predeterminada. Actívalo explícitamente si esperas que las fotos, notas de voz, vídeos o archivos entrantes lleguen al agente.
- Con `groupPolicy: "allowlist"`, copia el bloque `groups` anterior, incluida cualquier entrada comodín `"*"`. Las listas de remitentes permitidos de los grupos y el registro de grupos son controles independientes; un bloque `groups` con entradas pero sin un `chat_id` coincidente (o sin `"*"`) descarta el mensaje durante la ejecución, y un bloque `groups` vacío registra una advertencia durante el inicio aunque el filtrado de remitentes siga permitiendo el paso de mensajes.
- Los enlaces ACP con `match.channel: "bluebubbles"` deben cambiar a `"imessage"`.
- Las claves de sesión antiguas de BlueBubbles no se convierten en claves de sesión de iMessage. Las aprobaciones de emparejamiento se basan en los identificadores de los remitentes, por lo que las entradas copiadas de `allowFrom` siguen funcionando, pero el historial de conversaciones asociado a las claves de sesión de BlueBubbles no se transfiere.

## Véase también

- [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles)
- [iMessage](/es/channels/imessage)
- [Referencia de configuración: iMessage](/es/gateway/config-channels#imessage)
