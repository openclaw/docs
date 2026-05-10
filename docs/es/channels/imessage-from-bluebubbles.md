---
read_when:
    - Planificación de una migración de BlueBubbles al Plugin de iMessage incluido
    - Traducción de las claves de configuración de BlueBubbles a equivalentes de iMessage
    - Verificar imsg antes de habilitar el Plugin de iMessage
summary: Migra las configuraciones antiguas de BlueBubbles al Plugin de iMessage incluido sin perder el emparejamiento, las listas de permitidos ni las vinculaciones de grupos.
title: Si vienes de BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

El plugin incluido `imessage` ahora alcanza la misma superficie de API privada que BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, gestión de grupos, archivos adjuntos) al controlar [`steipete/imsg`](https://github.com/steipete/imsg) mediante JSON-RPC. Si ya ejecutas un Mac con `imsg` instalado, puedes eliminar el servidor de BlueBubbles y dejar que el plugin hable directamente con Messages.app.

Se eliminó el soporte de BlueBubbles. OpenClaw admite iMessage únicamente mediante `imsg`. Esta guía sirve para migrar configuraciones antiguas de `channels.bluebubbles` a `channels.imessage`; no hay ninguna otra ruta de migración compatible.

## Cuándo tiene sentido esta migración

- Ya ejecutas `imsg` en el mismo Mac (o en uno accesible mediante SSH) donde Messages.app tiene sesión iniciada.
- Quieres una pieza menos que mantener: sin servidor de BlueBubbles separado, sin endpoint REST que autenticar, sin configuración de Webhook. Un único binario de CLI en lugar de un servidor + aplicación cliente + auxiliar.
- Estás en una [versión compatible de macOS / `imsg`](/es/channels/imessage#requirements-and-permissions-macos) donde la prueba de la API privada informa `available: true`.

## Qué hace imsg

`imsg` es una CLI local de macOS para Messages. OpenClaw inicia `imsg rpc` como proceso hijo y se comunica mediante JSON-RPC por stdin/stdout. No hay servidor HTTP, URL de Webhook, daemon en segundo plano, agente de lanzamiento ni puerto que exponer.

- Las lecturas provienen de `~/Library/Messages/chat.db` mediante un manejador SQLite de solo lectura.
- Los mensajes entrantes en vivo provienen de `imsg watch` / `watch.subscribe`, que sigue los eventos del sistema de archivos de `chat.db` con una alternativa de sondeo.
- Los envíos usan la automatización de Messages.app para texto normal y envíos de archivos.
- Las acciones avanzadas usan `imsg launch` para inyectar el auxiliar `imsg` en Messages.app. Eso es lo que habilita confirmaciones de lectura, indicadores de escritura, envíos enriquecidos, edición, anulación de envío, respuesta en hilo, tapbacks y gestión de grupos.
- Las compilaciones de Linux pueden inspeccionar una copia de `chat.db`, pero no pueden enviar, observar la base de datos activa del Mac ni controlar Messages.app. Para iMessage en OpenClaw, ejecuta `imsg` en el Mac con sesión iniciada o mediante un wrapper SSH hacia ese Mac.

## Antes de empezar

1. Instala `imsg` en el Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Si `imsg chats` falla con `unable to open database file`, salida vacía o `authorization denied`, concede Acceso total al disco al terminal, editor, proceso de Node, servicio Gateway o proceso padre de SSH que lanza `imsg`, y luego vuelve a abrir ese proceso padre.

2. Verifica las superficies de lectura, observación, envío y RPC antes de cambiar la configuración de OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Sustituye `42` por un id de chat real obtenido de `imsg chats`. El envío requiere permiso de Automatización para Messages.app. Si OpenClaw se ejecutará mediante SSH, ejecuta estos comandos con el mismo wrapper SSH o contexto de usuario que usará OpenClaw.

3. Habilita el puente de API privada cuando necesites acciones avanzadas:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` requiere que SIP esté desactivado. El envío básico, el historial y la observación funcionan sin `imsg launch`; las acciones avanzadas no.

4. Verifica el puente mediante OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Busca `imessage.privateApi.available: true`. Si informa `false`, corrige eso primero; consulta [Detección de capacidades](/es/channels/imessage#private-api-actions).

5. Haz una instantánea de tu configuración:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Traducción de configuración

iMessage y BlueBubbles comparten gran parte de la configuración a nivel de canal. Las claves que cambian son principalmente de transporte (servidor REST frente a CLI local). Las claves de comportamiento (`dmPolicy`, `groupPolicy`, `allowFrom`, etc.) conservan el mismo significado.

| BlueBubbles                                                | iMessage incluido                         | Notas                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Misma semántica.                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.serverUrl`                           | _(eliminado)_                             | Sin servidor REST: el Plugin ejecuta `imsg rpc` sobre stdio.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.password`                            | _(eliminado)_                             | No se necesita autenticación de Webhook.                                                                                                                                                                                                                                                                                                     |
| _(implícito)_                                              | `channels.imessage.cliPath`               | Ruta a `imsg` (valor predeterminado `imsg`); usa un script envoltorio para SSH.                                                                                                                                                                                                                                                              |
| _(implícito)_                                              | `channels.imessage.dbPath`                | Anulación opcional de `chat.db` de Messages.app; se detecta automáticamente cuando se omite.                                                                                                                                                                                                                                                 |
| _(implícito)_                                              | `channels.imessage.remoteHost`            | `host` o `user@host`: solo se necesita cuando `cliPath` es un envoltorio SSH y quieres obtener adjuntos por SCP.                                                                                                                                                                                                                             |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Mismos valores (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Las aprobaciones de emparejamiento se trasladan por identificador, no por token.                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Mismos valores (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Igual.                                                                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Copia esto literalmente, incluida cualquier entrada comodín `groups: { "*": { ... } }`.** `requireMention`, `tools` y `toolsBySender` por grupo se trasladan. Con `groupPolicy: "allowlist"`, un bloque `groups` vacío o ausente descarta silenciosamente todos los mensajes de grupo; consulta "Riesgo del registro de grupos" más abajo. |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Valor predeterminado `true`. Con el Plugin incluido, esto solo se activa cuando la sonda de la API privada está activa.                                                                                                                                                                                                                       |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Misma forma, **también desactivado de forma predeterminada**. Si tenías adjuntos fluyendo en BlueBubbles, debes volver a configurar esto explícitamente en el bloque de iMessage: no se traslada de forma implícita, y las fotos/medios entrantes se descartarán silenciosamente sin línea de registro `Inbound message` hasta que lo hagas. |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Raíces locales; mismas reglas de comodines.                                                                                                                                                                                                                                                                                                  |
| _(N/D)_                                                    | `channels.imessage.remoteAttachmentRoots` | Solo se usa cuando `remoteHost` está configurado para obtenciones por SCP.                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Valor predeterminado de 16 MB en iMessage (el valor predeterminado de BlueBubbles era 8 MB). Configúralo explícitamente si quieres conservar el límite inferior.                                                                                                                                                                             |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Valor predeterminado de 4000 en ambos.                                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Misma opción voluntaria. Solo para DM: los chats de grupo mantienen el despacho instantáneo por mensaje en ambos canales. Amplía el debounce entrante predeterminado a 2500 ms cuando se habilita sin un `messages.inbound.byChannel.imessage` explícito. Consulta [documentación de iMessage § Fusionar DM enviados en partes](/es/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/D)_                                   | iMessage ya lee los nombres visibles de los remitentes desde `chat.db`.                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Conmutadores por acción: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                    |

Las configuraciones multicuenta (`channels.bluebubbles.accounts.*`) se traducen uno a uno a `channels.imessage.accounts.*`.

## Riesgo del registro de grupos

El Plugin de iMessage incluido ejecuta **dos** puertas de lista de permitidos de grupo separadas, una tras otra. Ambas deben aprobar para que un mensaje de grupo llegue al agente:

1. **Lista de permitidos de remitente / destino de chat** (`channels.imessage.groupAllowFrom`): verificada por `isAllowedIMessageSender`. Coincide con mensajes entrantes por identificador de remitente, `chat_guid`, `chat_identifier` o `chat_id`. Misma forma que BlueBubbles.
2. **Registro de grupos** (`channels.imessage.groups`): verificado por `resolveChannelGroupPolicy` desde `inbound-processing.ts:199`. Con `groupPolicy: "allowlist"`, esta puerta requiere:
   - una entrada comodín `groups: { "*": { ... } }` (establece `allowAll = true`), o
   - una entrada explícita por `chat_id` bajo `groups`.

Si la puerta 1 aprueba pero la puerta 2 falla, el mensaje se descarta. El Plugin emite dos señales de nivel `warn`, por lo que esto ya no queda en silencio con el nivel de registro predeterminado:

- Un `warn` único al inicio por cuenta cuando `groupPolicy: "allowlist"` está configurado pero `channels.imessage.groups` está vacío (sin comodín `"*"`, sin entradas por `chat_id`), emitido antes de que llegue cualquier mensaje.
- Un `warn` único por `chat_id` la primera vez que un grupo específico se descarta en tiempo de ejecución, nombrando el chat_id y la clave exacta que debe agregarse a `groups` para permitirlo.

Los DM siguen funcionando porque toman una ruta de código diferente.

Este es el modo de fallo más común en la migración de BlueBubbles → iMessage incluido: los operadores copian `groupAllowFrom` y `groupPolicy`, pero omiten el bloque `groups`, porque `groups: { "*": { "requireMention": true } }` de BlueBubbles parece una configuración de mención no relacionada. En realidad es esencial para la puerta del registro.

La configuración mínima para mantener el flujo de mensajes de grupo después de `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` bajo `*` no causa problemas cuando no hay patrones de mención configurados: el runtime establece `canDetectMention = false` y omite la caída por mención en `inbound-processing.ts:512`. Con patrones de mención configurados (`agents.list[].groupChat.mentionPatterns`), funciona como se espera.

Si los logs del Gateway muestran `imessage: dropping group message from chat_id=<id>` o la línea de inicio `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, la compuerta 2 está descartando el mensaje: agrega el bloque `groups`.

## Paso a paso

1. Agrega un bloque de iMessage junto al bloque existente de BlueBubbles. Mantén el bloque anterior solo como fuente de copia hasta verificar la nueva ruta:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **Prueba en seco**: inicia el Gateway y confirma que iMessage se reporta como saludable:

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   Como `imessage.enabled` todavía es `false`, aún no se enruta tráfico entrante de iMessage, pero `--probe` ejercita el puente para que detectes problemas de permisos o instalación antes de la transición.

3. **Haz la transición.** Elimina la configuración de BlueBubbles y habilita iMessage en una sola edición de configuración:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Reinicia el Gateway. El tráfico entrante de iMessage ahora fluye a través del Plugin incluido.

4. **Verifica los DM.** Envía al agente un mensaje directo; confirma que llegue la respuesta.

5. **Verifica los grupos por separado.** Los DM y los grupos toman rutas de código diferentes; que los DM funcionen no prueba que los grupos se estén enrutando. Envía al agente un mensaje en un chat grupal emparejado y confirma que llegue la respuesta. Si el grupo queda en silencio (sin respuesta del agente, sin error), revisa el log del Gateway para ver si aparece `imessage: dropping group message from chat_id=<id>` o la línea de inicio `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`; ambas se emiten en el nivel de log predeterminado. Si aparece cualquiera de las dos, tu bloque `groups` falta o está vacío; consulta “Problema del registro de grupos” arriba.

6. **Verifica la superficie de acciones**: desde un DM emparejado, pide al agente que reaccione, edite, anule el envío, responda, envíe una foto y (en un grupo) cambie el nombre del grupo / agregue o quite un participante. Cada acción debería llegar de forma nativa a Messages.app. Si alguna lanza "iMessage `<action>` requires the imsg private API bridge", ejecuta `imsg launch` de nuevo y actualiza `channels status --probe`.

7. **Elimina el servidor y la configuración de BlueBubbles** una vez verificados los DM, los grupos y las acciones de iMessage. OpenClaw no usará `channels.bluebubbles`.

## Paridad de acciones de un vistazo

| Acción                                                     | BlueBubbles heredado                | iMessage incluido                                                                                                       |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Enviar texto / fallback a SMS                              | ✅                                  | ✅                                                                                                                      |
| Enviar medios (foto, video, archivo, voz)                  | ✅                                  | ✅                                                                                                                      |
| Respuesta en hilo (`reply_to_guid`)                        | ✅                                  | ✅ (cierra [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                 |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Editar / anular envío (destinatarios en macOS 13+)         | ✅                                  | ✅                                                                                                                      |
| Enviar con efecto de pantalla                              | ✅                                  | ✅ (cierra parte de [#9394](https://github.com/openclaw/openclaw/issues/9394))                                          |
| Texto enriquecido en negrita / cursiva / subrayado / tachado | ✅                                  | ✅ (formato de segmentos tipados mediante attributedBody)                                                               |
| Cambiar nombre del grupo / establecer icono del grupo      | ✅                                  | ✅                                                                                                                      |
| Agregar / quitar participante, salir del grupo             | ✅                                  | ✅                                                                                                                      |
| Confirmaciones de lectura e indicador de escritura         | ✅                                  | ✅ (condicionado a la prueba de API privada)                                                                            |
| Combinación de DM del mismo remitente                      | ✅                                  | ✅ (solo DM; opt-in mediante `channels.imessage.coalesceSameSenderDms`)                                                 |
| Recuperación de mensajes entrantes recibidos mientras el Gateway está inactivo | ✅ (repetición de Webhook + obtención de historial) | ✅ (opt-in mediante `channels.imessage.catchup.enabled`; cierra [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

La recuperación de iMessage ahora está disponible como una función opt-in en el Plugin incluido. Al iniciar el Gateway, si `channels.imessage.catchup.enabled` es `true`, el Gateway ejecuta una pasada de `chats.list` + `messages.history` por chat contra el mismo cliente JSON-RPC que usa `imsg watch`, reproduce cada fila entrante perdida por la ruta de despacho en vivo (allowlists, política de grupo, debouncer, caché de eco) y persiste un cursor por cuenta para que los inicios posteriores continúen desde donde quedaron. Consulta [Puesta al día tras inactividad del Gateway](/es/channels/imessage#catching-up-after-gateway-downtime) para ajustar la configuración.

## Emparejamiento, sesiones y vinculaciones de ACP

- **Las aprobaciones de emparejamiento** se conservan por identificador. No necesitas volver a aprobar remitentes conocidos: `channels.imessage.allowFrom` reconoce las mismas cadenas `+15555550123` / `user@example.com` que usaba BlueBubbles.
- **Las sesiones** permanecen delimitadas por agente + chat. Los DM se agrupan en la sesión principal del agente bajo el valor predeterminado `session.dmScope=main`; las sesiones de grupo permanecen aisladas por `chat_id`. Las claves de sesión difieren (`agent:<id>:imessage:group:<chat_id>` frente al equivalente de BlueBubbles): el historial de conversación anterior bajo claves de sesión de BlueBubbles no se transfiere a las sesiones de iMessage.
- **Las vinculaciones de ACP** que referencian `match.channel: "bluebubbles"` deben actualizarse a `"imessage"`. Las formas de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, identificador sin prefijo) son idénticas.

## Sin canal de reversión

No hay un runtime de BlueBubbles compatible al que volver. Si la verificación de iMessage falla, establece `channels.imessage.enabled: false`, reinicia el Gateway, corrige el bloqueo de `imsg` y vuelve a intentar la transición.

La caché de respuestas está en `~/.openclaw/state/imessage/reply-cache.jsonl` (modo `0600`, directorio padre `0700`). Puedes eliminarla sin riesgo si quieres empezar de cero.

## Relacionado

- [iMessage](/es/channels/imessage) — referencia completa del canal de iMessage, incluida la configuración de `imsg launch` y la detección de capacidades.
- `/channels/bluebubbles` — URL heredada que redirige a esta guía de migración.
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento.
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo el Gateway elige un canal para las respuestas salientes.
