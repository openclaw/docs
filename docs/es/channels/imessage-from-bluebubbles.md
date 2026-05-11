---
read_when:
    - Planificación de una migración de BlueBubbles al Plugin de iMessage incluido
    - Traducción de las claves de configuración de BlueBubbles a equivalentes de iMessage
    - Verificar imsg antes de habilitar el Plugin de iMessage
summary: Migra las configuraciones antiguas de BlueBubbles al Plugin de iMessage incluido sin perder el emparejamiento, las listas de permitidos ni las vinculaciones de grupo.
title: Si vienes de BlueBubbles
x-i18n:
    generated_at: "2026-05-11T20:20:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

El Plugin `imessage` incluido ahora accede a la misma superficie de API privada que BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, administración de grupos, adjuntos) controlando [`steipete/imsg`](https://github.com/steipete/imsg) mediante JSON-RPC. Si ya ejecutas un Mac con `imsg` instalado, puedes prescindir del servidor BlueBubbles y dejar que el Plugin se comunique directamente con Messages.app.

Se eliminó la compatibilidad con BlueBubbles. OpenClaw admite iMessage solo mediante `imsg`. Esta guía sirve para migrar configuraciones antiguas de `channels.bluebubbles` a `channels.imessage`; no hay ninguna otra ruta de migración compatible.

<Note>
Para el anuncio breve y el resumen para operadores, consulta [Eliminación de BlueBubbles y la ruta de imsg para iMessage](/es/announcements/bluebubbles-imessage).
</Note>

## Lista de verificación de migración

Usa esta lista de verificación cuando ya conozcas tu configuración antigua de BlueBubbles y quieras la ruta segura más corta:

1. Verifica `imsg` directamente en el Mac que ejecuta Messages.app (`imsg chats`, `imsg history`, `imsg send` y `imsg rpc --help`).
2. Copia las claves de comportamiento de `channels.bluebubbles` a `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` y `actions`.
3. Elimina las claves de transporte que ya no existen: `serverUrl`, `password`, URL de Webhook y la configuración del servidor BlueBubbles.
4. Si el Gateway no se está ejecutando en el Mac de Messages, establece `channels.imessage.cliPath` en un envoltorio SSH y configura `remoteHost` para las recuperaciones remotas de adjuntos.
5. Con el Gateway detenido, habilita `channels.imessage` y luego ejecuta `openclaw channels status --probe --channel imessage`.
6. Prueba un DM, un grupo permitido, adjuntos si están habilitados y cada acción de API privada que esperas que use el agente.
7. Elimina el servidor BlueBubbles y la configuración antigua de `channels.bluebubbles` después de verificar la ruta de iMessage.

## Cuándo tiene sentido esta migración

- Ya ejecutas `imsg` en el mismo Mac (o en uno accesible por SSH) donde Messages.app tiene una sesión iniciada.
- Quieres una pieza móvil menos: sin servidor BlueBubbles separado, sin endpoint REST que autenticar, sin conexiones de Webhook. Un único binario CLI en lugar de un servidor + aplicación cliente + auxiliar.
- Estás en una [versión compatible de macOS / `imsg`](/es/channels/imessage#requirements-and-permissions-macos) donde la sonda de API privada informa `available: true`.

## Qué hace imsg

`imsg` es una CLI local de macOS para Messages. OpenClaw inicia `imsg rpc` como proceso hijo y se comunica mediante JSON-RPC por stdin/stdout. No hay servidor HTTP, URL de Webhook, daemon en segundo plano, agente de lanzamiento ni puerto que exponer.

- Las lecturas provienen de `~/Library/Messages/chat.db` usando un identificador SQLite de solo lectura.
- Los mensajes entrantes en vivo provienen de `imsg watch` / `watch.subscribe`, que sigue eventos del sistema de archivos de `chat.db` con una alternativa de sondeo.
- Los envíos usan automatización de Messages.app para texto normal y envíos de archivos.
- Las acciones avanzadas usan `imsg launch` para inyectar el auxiliar `imsg` en Messages.app. Eso es lo que desbloquea confirmaciones de lectura, indicadores de escritura, envíos enriquecidos, edición, anulación de envío, respuesta en hilo, tapbacks y administración de grupos.
- Las compilaciones para Linux pueden inspeccionar un `chat.db` copiado, pero no pueden enviar, observar la base de datos en vivo del Mac ni controlar Messages.app. Para OpenClaw iMessage, ejecuta `imsg` en el Mac con la sesión iniciada o mediante un envoltorio SSH hacia ese Mac.

## Antes de empezar

1. Instala `imsg` en el Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Si `imsg chats` falla con `unable to open database file`, salida vacía o `authorization denied`, concede Acceso total al disco al terminal, editor, proceso de Node, servicio Gateway o proceso padre SSH que inicia `imsg`, y luego vuelve a abrir ese proceso padre.

2. Verifica las superficies de lectura, observación, envío y RPC antes de cambiar la configuración de OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Sustituye `42` por un id de chat real de `imsg chats`. El envío requiere permiso de Automatización para Messages.app. Si OpenClaw se ejecutará mediante SSH, ejecuta estos comandos con el mismo envoltorio SSH o contexto de usuario que usará OpenClaw.

3. Habilita el puente de API privada cuando necesites acciones avanzadas:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` requiere que SIP esté deshabilitado. El envío básico, el historial y la observación funcionan sin `imsg launch`; las acciones avanzadas no.

4. Después de agregar una configuración `channels.imessage` habilitada, verifica el puente mediante OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Quieres `imessage.privateApi.available: true`. Si informa `false`, corrige eso primero; consulta [Detección de capacidades](/es/channels/imessage#private-api-actions). `channels status --probe` solo sondea cuentas configuradas y habilitadas.

5. Toma una instantánea de tu configuración:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Traducción de configuración

iMessage y BlueBubbles comparten mucha configuración a nivel de canal. Las claves que cambian son principalmente de transporte (servidor REST frente a CLI local). Las claves de comportamiento (`dmPolicy`, `groupPolicy`, `allowFrom`, etc.) mantienen el mismo significado.

| BlueBubbles                                                | iMessage incluido                         | Notas                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Misma semántica.                                                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.serverUrl`                           | _(eliminado)_                             | Sin servidor REST: el plugin inicia `imsg rpc` sobre stdio.                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.password`                            | _(eliminado)_                             | No se necesita autenticación de Webhook.                                                                                                                                                                                                                                                                                                     |
| _(implícito)_                                              | `channels.imessage.cliPath`               | Ruta a `imsg` (predeterminado `imsg`); usa un script envoltorio para SSH.                                                                                                                                                                                                                                                                    |
| _(implícito)_                                              | `channels.imessage.dbPath`                | Anulación opcional de `chat.db` de Messages.app; se detecta automáticamente cuando se omite.                                                                                                                                                                                                                                                  |
| _(implícito)_                                              | `channels.imessage.remoteHost`            | `host` o `user@host`: solo necesario cuando `cliPath` es un envoltorio SSH y quieres obtener adjuntos por SCP.                                                                                                                                                                                                                               |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Mismos valores (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Las aprobaciones de emparejamiento se conservan por handle, no por token.                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Mismos valores (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Igual.                                                                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Copia esto literalmente, incluida cualquier entrada comodín `groups: { "*": { ... } }`.** `requireMention`, `tools` y `toolsBySender` por grupo se conservan. Con `groupPolicy: "allowlist"`, un bloque `groups` vacío o ausente descarta silenciosamente todos los mensajes de grupo; consulta "Riesgo del registro de grupos" abajo. |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Predeterminado `true`. Con el plugin incluido, esto solo se ejecuta cuando la sonda de API privada está activa.                                                                                                                                                                                                                               |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Misma forma, **también desactivado de forma predeterminada**. Si tenías adjuntos funcionando en BlueBubbles, debes volver a configurar esto explícitamente en el bloque de iMessage: no se conserva implícitamente, y las fotos/medios entrantes se descartarán silenciosamente sin línea de registro `Inbound message` hasta que lo hagas. |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Raíces locales; mismas reglas de comodines.                                                                                                                                                                                                                                                                                                  |
| _(N/D)_                                                    | `channels.imessage.remoteAttachmentRoots` | Solo se usa cuando `remoteHost` está configurado para obtenciones por SCP.                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Predeterminado 16 MB en iMessage (el predeterminado de BlueBubbles era 8 MB). Configúralo explícitamente si quieres mantener el límite inferior.                                                                                                                                                                                              |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Predeterminado 4000 en ambos.                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Misma opción voluntaria. Solo DM: los chats de grupo mantienen el despacho instantáneo por mensaje en ambos canales. Amplía el antirrebote entrante predeterminado a 2500 ms cuando se habilita sin un `messages.inbound.byChannel.imessage` explícito. Consulta [docs de iMessage § Combinar DM de envío dividido](/es/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/D)_                                   | iMessage ya lee los nombres visibles de los remitentes desde `chat.db`.                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Activadores por acción: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                      |

Las configuraciones multicuenta (`channels.bluebubbles.accounts.*`) se traducen una a una a `channels.imessage.accounts.*`.

## Riesgo del registro de grupos

El plugin de iMessage incluido ejecuta **dos** compuertas de lista de permitidos de grupo separadas, una tras otra. Ambas deben aprobarse para que un mensaje de grupo llegue al agente:

1. **Lista de permitidos de remitente / destino de chat** (`channels.imessage.groupAllowFrom`): verificada por `isAllowedIMessageSender`. Coincide con mensajes entrantes por handle de remitente, `chat_guid`, `chat_identifier` o `chat_id`. Misma forma que BlueBubbles.
2. **Registro de grupos** (`channels.imessage.groups`): verificado por `resolveChannelGroupPolicy` desde `inbound-processing.ts:199`. Con `groupPolicy: "allowlist"`, esta compuerta requiere:
   - una entrada comodín `groups: { "*": { ... } }` (establece `allowAll = true`), o
   - una entrada explícita por `chat_id` en `groups`.

Si la compuerta 1 aprueba pero la compuerta 2 falla, el mensaje se descarta. El plugin emite dos señales de nivel `warn`, por lo que esto ya no es silencioso con el nivel de registro predeterminado:

- Un `warn` de inicio único por cuenta cuando `groupPolicy: "allowlist"` está configurado pero `channels.imessage.groups` está vacío (sin comodín `"*"`, sin entradas por `chat_id`): se dispara antes de que llegue cualquier mensaje.
- Un `warn` único por `chat_id` la primera vez que se descarta un grupo específico en tiempo de ejecución, indicando el chat_id y la clave exacta que debes añadir a `groups` para permitirlo.

Los DM siguen funcionando porque toman una ruta de código distinta.

Este es el modo de fallo más común en la migración de BlueBubbles a iMessage incluido: los operadores copian `groupAllowFrom` y `groupPolicy`, pero omiten el bloque `groups`, porque `groups: { "*": { "requireMention": true } }` de BlueBubbles parece una configuración de mención no relacionada. En realidad es esencial para la compuerta del registro.

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

`requireMention: true` bajo `*` es inocuo cuando no hay patrones de mención configurados: el runtime establece `canDetectMention = false` y omite anticipadamente el descarte de menciones en `inbound-processing.ts:512`. Con patrones de mención configurados (`agents.list[].groupChat.mentionPatterns`), funciona como se espera.

Si los registros del Gateway muestran `imessage: dropping group message from chat_id=<id>` o la línea de inicio `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, la puerta 2 está descartando mensajes: añade el bloque `groups`.

## Paso a paso

1. Añade un bloque de iMessage junto al bloque existente de BlueBubbles. Mantenlo deshabilitado mientras el Gateway siga enrutando tráfico de BlueBubbles:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
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

2. **Prueba antes de que el tráfico importe**: detén el Gateway, habilita temporalmente el bloque de iMessage y confirma que iMessage se informa como saludable desde la CLI:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` solo prueba cuentas configuradas y habilitadas. No reinicies el Gateway con BlueBubbles e iMessage habilitados a la vez, salvo que quieras intencionadamente que ambos monitores de canal se ejecuten. Si no vas a hacer la transición de inmediato, vuelve a establecer `channels.imessage.enabled` en `false` antes de reiniciar el Gateway. Usa los comandos directos de `imsg` en [Antes de empezar](#before-you-start) para validar el Mac antes de habilitar el tráfico de OpenClaw.

3. **Haz la transición.** Cuando la cuenta de iMessage habilitada se informe como saludable, elimina la configuración de BlueBubbles y mantén iMessage habilitado:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Reinicia el Gateway. El tráfico entrante de iMessage ahora fluye por el Plugin incluido.

4. **Verifica los MD.** Envía un mensaje directo al agente; confirma que llega la respuesta.

5. **Verifica los grupos por separado.** Los MD y los grupos usan rutas de código diferentes: que los MD funcionen no prueba que los grupos estén enrutando. Envía un mensaje al agente en un chat grupal emparejado y confirma que llega la respuesta. Si el grupo queda en silencio (sin respuesta del agente, sin error), revisa el registro del Gateway en busca de `imessage: dropping group message from chat_id=<id>` o la línea de inicio `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`; ambas se emiten en el nivel de registro predeterminado. Si aparece cualquiera de las dos, tu bloque `groups` falta o está vacío; consulta “problema del registro de grupos” más arriba.

6. **Verifica la superficie de acciones**: desde un MD emparejado, pídele al agente que reaccione, edite, anule el envío, responda, envíe una foto y (en un grupo) cambie el nombre del grupo / añada o elimine un participante. Cada acción debería llegar de forma nativa a Messages.app. Si alguna arroja "iMessage `<action>` requires the imsg private API bridge", ejecuta `imsg launch` de nuevo y actualiza `channels status --probe`.

7. **Elimina el servidor y la configuración de BlueBubbles** cuando se hayan verificado los MD, los grupos y las acciones de iMessage. OpenClaw no usará `channels.bluebubbles`.

## Paridad de acciones de un vistazo

| Acción                                                     | BlueBubbles heredado                  | iMessage incluido                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Enviar texto / respaldo por SMS                                   | ✅                                  | ✅                                                                                                                      |
| Enviar medios (foto, video, archivo, voz)                     | ✅                                  | ✅                                                                                                                      |
| Respuesta en hilo (`reply_to_guid`)                           | ✅                                  | ✅ (cierra [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                 |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Editar / anular envío (destinatarios con macOS 13+)                       | ✅                                  | ✅                                                                                                                      |
| Enviar con efecto de pantalla                                    | ✅                                  | ✅ (cierra parte de [#9394](https://github.com/openclaw/openclaw/issues/9394))                                           |
| Texto enriquecido en negrita / cursiva / subrayado / tachado        | ✅                                  | ✅ (formato de tramos tipados mediante attributedBody)                                                                            |
| Cambiar nombre del grupo / establecer icono de grupo                              | ✅                                  | ✅                                                                                                                      |
| Añadir / eliminar participante, salir del grupo                      | ✅                                  | ✅                                                                                                                      |
| Confirmaciones de lectura e indicador de escritura                         | ✅                                  | ✅ (controlado por la prueba de API privada)                                                                                         |
| Coalescencia de MD del mismo remitente                                  | ✅                                  | ✅ (solo MD; activación explícita mediante `channels.imessage.coalesceSameSenderDms`)                                                      |
| Recuperación de mensajes entrantes recibidos mientras el Gateway está caído | ✅ (repetición de Webhook + obtención de historial) | ✅ (activación explícita mediante `channels.imessage.catchup.enabled`; cierra [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

La recuperación de iMessage ahora está disponible como una función de activación explícita en el Plugin incluido. Al iniciar el Gateway, si `channels.imessage.catchup.enabled` es `true`, el Gateway ejecuta una pasada de `chats.list` + `messages.history` por chat contra el mismo cliente JSON-RPC usado por `imsg watch`, vuelve a reproducir cada fila entrante perdida por la ruta de despacho en vivo (listas de permitidos, política de grupos, debouncer, caché de eco) y persiste un cursor por cuenta para que los inicios posteriores continúen desde donde quedaron. Consulta [Ponerse al día tras una caída del Gateway](/es/channels/imessage#catching-up-after-gateway-downtime) para los ajustes.

## Emparejamiento, sesiones y enlaces ACP

- **Las aprobaciones de emparejamiento** se trasladan por identificador. No necesitas volver a aprobar remitentes conocidos: `channels.imessage.allowFrom` reconoce las mismas cadenas `+15555550123` / `user@example.com` que usaba BlueBubbles.
- **Las sesiones** siguen delimitadas por agente + chat. Los MD se colapsan en la sesión principal del agente con el valor predeterminado `session.dmScope=main`; las sesiones de grupo siguen aisladas por `chat_id`. Las claves de sesión difieren (`agent:<id>:imessage:group:<chat_id>` frente al equivalente de BlueBubbles): el historial de conversaciones antiguo bajo claves de sesión de BlueBubbles no se transfiere a las sesiones de iMessage.
- **Los enlaces ACP** que hagan referencia a `match.channel: "bluebubbles"` deben actualizarse a `"imessage"`. Las formas de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, identificador simple) son idénticas.

## Sin canal de reversión

No hay un runtime de BlueBubbles compatible al que volver. Si la verificación de iMessage falla, establece `channels.imessage.enabled: false`, reinicia el Gateway, corrige el bloqueo de `imsg` y vuelve a intentar la transición.

La caché de respuestas vive en `~/.openclaw/state/imessage/reply-cache.jsonl` (modo `0600`, directorio padre `0700`). Es seguro eliminarla si quieres empezar desde cero.

## Relacionado

- [Eliminación de BlueBubbles y la ruta iMessage de imsg](/es/announcements/bluebubbles-imessage): anuncio breve y resumen para operadores.
- [iMessage](/es/channels/imessage): referencia completa del canal iMessage, incluida la configuración de `imsg launch` y la detección de capacidades.
- `/channels/bluebubbles`: URL heredada que redirige a esta guía de migración.
- [Emparejamiento](/es/channels/pairing): autenticación de MD y flujo de emparejamiento.
- [Enrutamiento de canales](/es/channels/channel-routing): cómo el Gateway elige un canal para las respuestas salientes.
