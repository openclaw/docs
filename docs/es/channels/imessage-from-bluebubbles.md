---
read_when:
    - Planificar una migración de BlueBubbles al Plugin de iMessage incluido
    - Traduciendo claves de configuración de BlueBubbles a equivalentes de iMessage
    - Verificar imsg antes de habilitar el Plugin de iMessage
summary: 'Traducir las configuraciones antiguas de BlueBubbles al plugin de iMessage incluido: asignación de claves, controles de lista de permitidos para grupos y verificación de migración.'
title: Viniendo de BlueBubbles
x-i18n:
    generated_at: "2026-07-05T17:39:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93d4a6adb1ad0548368ce840f419339fdfe294ea19eca2e94f665c3b4613af4c
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

La compatibilidad con BlueBubbles se eliminó. OpenClaw admite iMessage solo a través del plugin `imessage` incluido, que controla [`steipete/imsg`](https://github.com/steipete/imsg) mediante JSON-RPC y alcanza la misma superficie de API privada que tenía BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, encuestas nativas, administración de grupos, adjuntos). Un único binario de CLI reemplaza el servidor BlueBubbles + la aplicación cliente + la integración de Webhook: sin endpoint REST, sin autenticación de Webhook.

Esta guía migra configuraciones antiguas de `channels.bluebubbles` a `channels.imessage`. No hay otra ruta de migración compatible. En OpenClaw actual, un bloque `channels.bluebubbles` sobrante queda inerte: ningún runtime lo lee.

<Note>
Para el anuncio breve y el resumen para operadores, consulta [Eliminación de BlueBubbles y la ruta de iMessage con imsg](/es/announcements/bluebubbles-imessage).
</Note>

## Lista de verificación de migración

La ruta segura más corta cuando ya conoces tu configuración antigua de BlueBubbles:

1. Verifica `imsg` directamente en el Mac que ejecuta Messages.app (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Copia las claves de comportamiento de `channels.bluebubbles` a `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` y `actions`.
3. Elimina las claves de transporte que ya no existen: `serverUrl`, `password`, URL de Webhook y configuración del servidor BlueBubbles.
4. Si el Gateway no se ejecuta en el Mac de Messages, define `channels.imessage.cliPath` como un contenedor SSH y define `remoteHost` para la obtención remota de adjuntos.
5. Habilita `channels.imessage`, reinicia el Gateway y luego ejecuta `openclaw channels status --probe --channel imessage`.
6. Prueba un MD, un grupo permitido, adjuntos si están habilitados y cada acción de API privada que esperas que use el agente.
7. Elimina el servidor BlueBubbles y la configuración antigua de `channels.bluebubbles` después de verificar la ruta de iMessage.

## Qué hace imsg

`imsg` es una CLI local de macOS para Mensajes. OpenClaw inicia `imsg rpc` como proceso hijo y se comunica por JSON-RPC a través de stdin/stdout. No hay servidor HTTP, URL de Webhook, daemon en segundo plano, agente de lanzamiento ni puerto que exponer.

- Las lecturas provienen de `~/Library/Messages/chat.db` usando un identificador SQLite de solo lectura.
- Los mensajes entrantes en vivo provienen de `imsg watch` / `watch.subscribe`, que sigue los eventos del sistema de archivos de `chat.db` con una reserva de sondeo.
- Los envíos usan automatización de Messages.app para envíos normales de texto y archivos.
- Las acciones avanzadas usan `imsg launch` para inyectar el helper de `imsg` en Messages.app. Eso desbloquea confirmaciones de lectura, indicadores de escritura, envíos enriquecidos, edición, anulación de envío, respuesta en hilo, tapbacks, encuestas y administración de grupos.
- Las compilaciones de Linux pueden inspeccionar un `chat.db` copiado, pero no pueden enviar, observar la base de datos del Mac en vivo ni controlar Messages.app. Para iMessage en OpenClaw, ejecuta `imsg` en el Mac con sesión iniciada o mediante un contenedor SSH hacia ese Mac.

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

   Reemplaza `42` por un id de chat real de `imsg chats`. Enviar requiere permiso de automatización para Messages.app. Si OpenClaw se ejecutará a través de SSH, ejecuta estos comandos mediante el mismo contenedor SSH o contexto de usuario que usará OpenClaw. Si las lecturas funcionan pero los envíos fallan con AppleEvents `-1743`, comprueba si Automation terminó en `/usr/libexec/sshd-keygen-wrapper`; consulta [Los envíos del contenedor SSH fallan con AppleEvents -1743](/es/channels/imessage#requirements-and-permissions-macos).

3. Habilita el puente de API privada cuando necesites acciones avanzadas:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` requiere que SIP esté deshabilitado (y en macOS moderno, que la validación de bibliotecas esté relajada; consulta [Habilitar la API privada de imsg](/es/channels/imessage#enabling-the-imsg-private-api)). El envío básico, el historial y la observación funcionan sin `imsg launch`; las acciones avanzadas no.

4. Después de habilitar `channels.imessage` e iniciar el Gateway, verifica el puente a través de OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   La cuenta de iMessage debería informar `works`; con `--json`, la carga útil de la sonda incluye `privateApi.available: true`. Si informa `false`, corrige eso primero; consulta [Detección de capacidades](/es/channels/imessage#private-api-actions). El sondeo necesita un Gateway accesible (si no, la CLI recurre a una salida solo de configuración) y solo sondea cuentas configuradas y habilitadas.

5. Toma una instantánea de tu configuración:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Traducción de configuración

iMessage y BlueBubbles comparten la mayoría de las claves de comportamiento a nivel de canal. Lo que cambia es el transporte (servidor REST frente a CLI local) y el formato de clave del registro de grupos.

| BlueBubbles                                                | iMessage incluido                         | Notas                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Misma semántica (valor predeterminado `true` una vez que existe el bloque).                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.serverUrl`                           | _(eliminado)_                             | Sin servidor REST: el plugin genera `imsg rpc` sobre stdio.                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.password`                            | _(eliminado)_                             | No se necesita autenticación de webhook.                                                                                                                                                                                                                                                                                                |
| _(implícito)_                                              | `channels.imessage.cliPath`               | Ruta a `imsg` (valor predeterminado `imsg`); usa un script envoltorio para SSH.                                                                                                                                                                                                                                                         |
| _(implícito)_                                              | `channels.imessage.dbPath`                | Anulación opcional de `chat.db` de Messages.app; se detecta automáticamente cuando se omite.                                                                                                                                                                                                                                             |
| _(implícito)_                                              | `channels.imessage.remoteHost`            | `host` o `user@host`: solo necesario cuando `cliPath` es un envoltorio SSH y quieres obtener adjuntos con SCP.                                                                                                                                                                                                                          |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Mismos valores (`pairing` / `allowlist` / `open` / `disabled`); valor predeterminado `pairing`.                                                                                                                                                                                                                                          |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Mismos formatos de identificador (`+15555550123`, `user@example.com`). Las aprobaciones del almacén de emparejamiento no se transfieren; consulta más abajo.                                                                                                                                                                            |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Mismos valores (`allowlist` / `open` / `disabled`); valor predeterminado `allowlist`.                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Igual. Cuando no se define, iMessage recurre a `allowFrom`; un `groupAllowFrom: []` explícitamente vacío bloquea todos los grupos bajo `groupPolicy: "allowlist"`.                                                                                                                                                                      |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | Copia literalmente la entrada comodín `"*"`; vuelve a asignar las entradas por grupo usando el `chat_id` numérico de iMessage; consulta "Trampa del registro de grupos". `requireMention`, `tools`, `toolsBySender`, `systemPrompt` se conservan.                                                                                       |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Valor predeterminado `true`. Con el plugin incluido, esto solo se activa cuando la sonda de API privada está activa.                                                                                                                                                                                                                     |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Misma forma, también desactivado de forma predeterminada. Si los adjuntos funcionaban en BlueBubbles, configúralo explícitamente: las fotos o medios entrantes se descartan silenciosamente (sin línea de registro `Inbound message`) hasta que lo hagas.                                                                                |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Raíces locales; mismas reglas de comodines.                                                                                                                                                                                                                                                                                             |
| _(N/D)_                                                    | `channels.imessage.remoteAttachmentRoots` | Solo se usa cuando `remoteHost` está definido para obtener archivos con SCP.                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Valor predeterminado 16 MB en iMessage (el valor predeterminado de BlueBubbles era 8 MB). Configúralo explícitamente para conservar el límite inferior.                                                                                                                                                                                  |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Valor predeterminado 4000 en ambos.                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Misma opción explícita. Solo DM: los grupos mantienen el despacho por mensaje. Amplía el debounce entrante predeterminado a 7000 ms a menos que se configure `messages.inbound.byChannel.imessage` o un `messages.inbound.debounceMs` global. Consulta [DMs de envío dividido agrupados](/es/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/D)_                                   | `imsg` ya expone los nombres para mostrar de los remitentes desde `chat.db`.                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Mismos conmutadores por acción (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`) más el nuevo `polls`. Todos están habilitados de forma predeterminada; las acciones de API privada siguen requiriendo el puente.        |

Las configuraciones multicuenta (`channels.bluebubbles.accounts.*`) se traducen uno a uno a `channels.imessage.accounts.*`.

## Trampa del registro de grupos

El plugin iMessage incluido ejecuta dos puertas de grupo una tras otra. Un mensaje de grupo debe pasar ambas para llegar al agente:

1. **Lista de permitidos de remitente / destino de chat** (`channels.imessage.groupAllowFrom`): coincide con el identificador del remitente o el destino del chat (entradas `chat_id:`, `chat_guid:`, `chat_identifier:`). Cuando `groupAllowFrom` no está definido, esta puerta recurre a `allowFrom`; un `groupAllowFrom: []` explícito desactiva esa alternativa y descarta todos los mensajes de grupo bajo `groupPolicy: "allowlist"`.
2. **Registro de grupos** (`channels.imessage.groups`): indexado por el `chat_id` numérico de iMessage:
   - Sin bloque `groups` (o con uno vacío): los grupos pasan esta puerta siempre que la puerta 1 tenga una lista efectiva no vacía de remitentes permitidos; el filtrado de remitentes gobierna el acceso y no se emite ninguna advertencia de inicio que descarte todo.
   - `groups` con entradas pero sin `"*"`: solo pasan las claves `chat_id` enumeradas. Enumerar cualquier grupo convierte el registro en una lista de permitidos incluso bajo `groupPolicy: "open"`.
   - `groups: { "*": { ... } }`: todos los grupos pasan esta puerta.

La trampa de migración: BlueBubbles indexaba las entradas de `groups` por GUID de chat / identificador de chat, mientras que el registro de iMessage las indexa por `chat_id` numérico. Las entradas por grupo copiadas literalmente crean un registro no vacío cuyas claves nunca coinciden, por lo que todos los mensajes de grupo se descartan en la puerta 2. Copia literalmente el comodín `"*"`; vuelve a indexar las entradas de grupos específicos con valores `chat_id` de `imsg chats`.

Ambas rutas de descarte son visibles en el nivel de registro predeterminado mediante líneas `warn`:

- Una vez por cuenta al iniciar, cuando `groupPolicy: "allowlist"` está configurado y la lista efectiva de remitentes de grupo permitidos está vacía: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Configura `groupAllowFrom` (o `allowFrom`) para admitir remitentes; agregar solo `groups` no satisface la puerta de remitente.
- Una vez por `chat_id` en tiempo de ejecución, cuando el registro descarta un grupo: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`, indicando la clave exacta que debes agregar.

Los DMs siguen funcionando en cualquier caso: usan una ruta de código diferente, por lo que el éxito de los DMs no demuestra que el enrutamiento de grupos funcione.

La configuración mínima con alcance de remitente y `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

Esto admite a los remitentes configurados en cualquier grupo. Agrega entradas `groups` para limitar los chats permitidos o definir opciones por chat, como `requireMention`; copia literalmente la entrada `"*"` de BlueBubbles, pero vuelve a indexar las entradas específicas con valores numéricos `chat_id` de iMessage.

## Paso a paso

1. Traduce la configuración. Mantén el bloque nuevo deshabilitado mientras editas; el bloque antiguo `channels.bluebubbles` es ignorado por el OpenClaw actual y puede quedarse junto a él como referencia:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // flip to true when ready to cut over
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // wildcard copies verbatim; re-key per-chat entries by chat_id
         // actions default to enabled; set individual toggles false to disable
       },
     },
   }
   ```

2. **Migra y prueba.** Configura `channels.imessage.enabled: true`, reinicia el Gateway y confirma que el canal informa que está en buen estado:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # expect "works"; --json shows privateApi.available: true
   ```

   La prueba requiere un Gateway accesible y solo prueba cuentas configuradas y habilitadas. Usa los comandos directos de `imsg` en [Antes de empezar](#before-you-start) para validar el Mac en sí.

3. **Verifica los DM.** Envía al agente un mensaje directo; confirma que llega la respuesta.

4. **Verifica los grupos por separado.** Los DM y los grupos usan rutas de código distintas; que los DM funcionen no demuestra que los grupos estén enrutando. Envía un mensaje en un chat de grupo permitido y confirma que llega la respuesta. Si el grupo queda en silencio (sin respuesta del agente, sin error), revisa el registro del gateway para ver las dos líneas `warn` de "Group registry footgun" anteriores. La advertencia de arranque significa que la lista efectiva de remitentes permitidos está vacía; una advertencia por `chat_id` significa que un registro `groups` con contenido no contiene ese chat.

5. **Verifica la superficie de acciones.** Desde un DM emparejado, pide al agente que reaccione, edite, cancele el envío, responda, envíe una foto y (en un grupo) cambie el nombre del grupo o agregue/elimine un participante. Cada acción debería llegar de forma nativa a Messages.app. Si alguna acción lanza `iMessage <action> requires the imsg private API bridge`, ejecuta `imsg launch` de nuevo y actualiza con `openclaw channels status --probe`.

6. **Elimina el servidor BlueBubbles y el bloque `channels.bluebubbles`** una vez que se hayan verificado los DM, grupos y acciones de iMessage. OpenClaw no lee `channels.bluebubbles`.

## Paridad de acciones de un vistazo

| Acción                                              | BlueBubbles heredado | iMessage incluido                                                            |
| --------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------- |
| Enviar texto / respaldo por SMS                     | ✅                   | ✅                                                                            |
| Enviar medios (foto, video, archivo, voz)           | ✅                   | ✅                                                                            |
| Respuesta en hilo (`reply_to_guid`)                 | ✅                   | ✅ (cierra [#51892](https://github.com/openclaw/openclaw/issues/51892))       |
| Tapback (`react`)                                   | ✅                   | ✅                                                                            |
| Editar / cancelar envío (macOS 13+ destinatarios)   | ✅                   | ✅                                                                            |
| Enviar con efecto de pantalla                       | ✅                   | ✅ (cierra parte de [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Texto enriquecido en negrita / cursiva / subrayado / tachado | ✅          | ✅ (formato de tramos tipados mediante attributedBody)                        |
| Encuestas nativas de Messages (crear y votar)       | ❌                   | ✅ (`actions.polls`; los destinatarios necesitan iOS/macOS 26+ para el renderizado nativo) |
| Cambiar nombre de grupo / configurar icono de grupo | ✅                   | ✅                                                                            |
| Agregar / eliminar participante, salir del grupo    | ✅                   | ✅                                                                            |
| Confirmaciones de lectura e indicador de escritura  | ✅                   | ✅ (controlado por la prueba de API privada)                                  |
| Combinación de DM del mismo remitente               | ✅                   | ✅ (solo DM; opcional mediante `channels.imessage.coalesceSameSenderDms`)     |
| Recuperación entrante después de un reinicio        | ✅                   | ✅ (automática: reproducción de `since_rowid` + deduplicación por GUID; ventana más amplia en local) |

iMessage recupera los mensajes perdidos mientras el gateway estaba detenido: al arrancar, reproduce desde el último rowid despachado mediante `imsg watch.subscribe` `since_rowid`, deduplica por GUID y una barrera de edad para el backlog obsoleto suprime la "bomba de backlog" de Push-flush. Esto se ejecuta sobre la conexión RPC de `imsg`, por lo que también funciona para configuraciones de `cliPath` por SSH remoto; las configuraciones locales obtienen una ventana de recuperación más amplia porque pueden leer `chat.db`. Consulta [Recuperación entrante después de reiniciar un bridge o gateway](/es/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Emparejamiento, sesiones y enlaces ACP

- **Las listas de permitidos se transfieren por handle.** `channels.imessage.allowFrom` reconoce las mismas cadenas `+15555550123` / `user@example.com` que usaba BlueBubbles; cópialas tal cual.
- **Las aprobaciones del almacén de emparejamiento no se transfieren.** El almacén de emparejamiento es por canal y nada migra el antiguo almacén de BlueBubbles. Los remitentes que fueron aprobados solo mediante emparejamiento deben emparejarse una vez más en iMessage, o puedes agregar sus handles a `allowFrom`.
- **Las sesiones** permanecen delimitadas por agente + chat. Los DM se colapsan en la sesión principal del agente bajo el valor predeterminado `session.dmScope=main`; las sesiones de grupo permanecen aisladas por `chat_id` (`agent:<agentId>:imessage:group:<chat_id>`). El historial de conversación antiguo bajo claves de sesión de BlueBubbles no se traslada a las sesiones de iMessage.
- **Los enlaces ACP** que referencian `match.channel: "bluebubbles"` deben cambiar a `"imessage"`. Las formas de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, handle simple) son idénticas.

## Sin canal de reversión

No hay un runtime BlueBubbles compatible al que volver. Si la verificación de iMessage falla, configura `channels.imessage.enabled: false`, reinicia el Gateway, corrige el bloqueo de `imsg` y vuelve a intentar la migración.

La caché de respuestas vive en el estado SQLite del Plugin. `openclaw doctor --fix` importa y archiva el antiguo archivo complementario `imessage/reply-cache.jsonl` cuando está presente.

## Relacionado

- [Eliminación de BlueBubbles y la ruta imsg de iMessage](/es/announcements/bluebubbles-imessage) — anuncio breve y resumen para operadores.
- [iMessage](/es/channels/imessage) — referencia completa del canal iMessage, incluida la configuración de `imsg launch` y la detección de capacidades.
- `/channels/bluebubbles` — URL heredada que redirige a esta guía de migración.
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento.
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo el gateway elige un canal para las respuestas salientes.
