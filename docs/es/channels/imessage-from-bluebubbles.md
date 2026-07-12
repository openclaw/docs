---
read_when:
    - Planificación de una migración de BlueBubbles al Plugin de iMessage incluido
    - Traducción de las claves de configuración de BlueBubbles a sus equivalentes de iMessage
    - Verificación de imsg antes de habilitar el plugin de iMessage
summary: 'Migra las configuraciones antiguas de BlueBubbles al plugin de iMessage incluido: asignación de claves, controles de la lista de permitidos de grupos y verificación de la transición.'
title: Procedente de BlueBubbles
x-i18n:
    generated_at: "2026-07-12T14:18:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Se eliminó la compatibilidad con BlueBubbles. OpenClaw admite iMessage únicamente mediante el plugin `imessage` incluido, que controla [`steipete/imsg`](https://github.com/steipete/imsg) mediante JSON-RPC y accede a la misma superficie de API privada que tenía BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, encuestas nativas, gestión de grupos y archivos adjuntos). Un único binario de CLI sustituye al servidor de BlueBubbles, la aplicación cliente y la infraestructura de Webhook: sin endpoint REST ni autenticación de Webhook.

Esta guía migra las configuraciones antiguas de `channels.bluebubbles` a `channels.imessage`. No existe ninguna otra ruta de migración compatible. En la versión actual de OpenClaw, cualquier bloque `channels.bluebubbles` restante queda inerte: ningún componente del entorno de ejecución lo lee.

<Note>
Para consultar el anuncio breve y el resumen para operadores, véase [Eliminación de BlueBubbles y la ruta de iMessage mediante imsg](/es/announcements/bluebubbles-imessage).
</Note>

## Lista de comprobación para la migración

La ruta segura más corta si ya conoce su configuración antigua de BlueBubbles:

1. Verifique `imsg` directamente en el Mac que ejecuta Messages.app (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Copie las claves de comportamiento de `channels.bluebubbles` a `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` y `actions`.
3. Elimine las claves de transporte que ya no existen: `serverUrl`, `password`, las URL de Webhook y la configuración del servidor de BlueBubbles.
4. Si el Gateway no se ejecuta en el Mac de Messages, establezca `channels.imessage.cliPath` en un contenedor SSH y configure `remoteHost` para obtener archivos adjuntos remotos.
5. Habilite `channels.imessage`, reinicie el Gateway y, a continuación, ejecute `openclaw channels status --probe --channel imessage`.
6. Pruebe un mensaje directo, un grupo permitido, los archivos adjuntos si están habilitados y todas las acciones de la API privada que se espera que utilice el agente.
7. Elimine el servidor de BlueBubbles y la configuración antigua de `channels.bluebubbles` después de verificar la ruta de iMessage.

## Qué hace imsg

`imsg` es una CLI local de macOS para Messages. OpenClaw inicia `imsg rpc` como proceso secundario y se comunica mediante JSON-RPC a través de stdin/stdout. No hay ningún servidor HTTP, URL de Webhook, demonio en segundo plano, agente de inicio ni puerto que exponer.

- Las lecturas proceden de `~/Library/Messages/chat.db` mediante un identificador de SQLite de solo lectura.
- Los mensajes entrantes en tiempo real proceden de `imsg watch` / `watch.subscribe`, que sigue los eventos del sistema de archivos de `chat.db` con un sondeo como mecanismo alternativo.
- Los envíos utilizan la automatización de Messages.app para enviar texto normal y archivos.
- Las acciones avanzadas utilizan `imsg launch` para inyectar el asistente de `imsg` en Messages.app. Esto habilita las confirmaciones de lectura, los indicadores de escritura, los envíos enriquecidos, la edición, la anulación de envíos, las respuestas en hilos, las reacciones tapback, las encuestas y la gestión de grupos.
- Las compilaciones para Linux pueden inspeccionar una copia de `chat.db`, pero no pueden enviar mensajes, observar la base de datos activa del Mac ni controlar Messages.app. Para iMessage en OpenClaw, ejecute `imsg` en el Mac con la sesión iniciada o mediante un contenedor SSH hacia ese Mac.

## Antes de comenzar

1. Instale `imsg` en el Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   Para la configuración local habitual, el proceso de configuración de OpenClaw puede ofrecer una instalación o actualización de `imsg` mediante Homebrew confirmada por el usuario en el Mac de Messages con la sesión iniciada. La configuración manual y las topologías con contenedor SSH siguen estando bajo la gestión del operador: repita la actualización de Homebrew en el mismo contexto de usuario local o remoto que ejecutará `imsg`. Si `imsg chats` falla con `unable to open database file`, no produce ninguna salida o muestra `authorization denied`, conceda acceso total al disco al terminal, editor, proceso de Node, servicio del Gateway o proceso principal de SSH que inicia `imsg` y, a continuación, vuelva a abrir ese proceso principal.

2. Verifique las superficies de lectura, observación, envío y RPC antes de cambiar la configuración de OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "Prueba de imsg de OpenClaw"
   imsg rpc --help
   ```

   Sustituya `42` por un identificador de chat real obtenido mediante `imsg chats`. El envío requiere permiso de automatización para Messages.app. Si OpenClaw se ejecutará mediante SSH, ejecute estos comandos a través del mismo contenedor SSH o contexto de usuario que utilizará OpenClaw. Si las lecturas funcionan, pero los envíos fallan con AppleEvents `-1743`, compruebe si el permiso de automatización se asignó a `/usr/libexec/sshd-keygen-wrapper`; véase [Los envíos mediante el contenedor SSH fallan con AppleEvents -1743](/es/channels/imessage#requirements-and-permissions-macos).

3. Habilite el puente de API privada. Se recomienda encarecidamente para iMessage en OpenClaw, ya que las respuestas, las reacciones tapback, los efectos, las encuestas, las respuestas a archivos adjuntos y las acciones de grupo dependen de él:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` requiere que SIP esté deshabilitado (y, en las versiones modernas de macOS, que la validación de bibliotecas esté relajada; véase [Habilitación de la API privada de imsg](/es/channels/imessage#enabling-the-imsg-private-api)). El envío básico, el historial y la observación funcionan sin `imsg launch`; la superficie completa de acciones de iMessage en OpenClaw no.

4. Después de habilitar `channels.imessage` e iniciar el Gateway, verifique el puente mediante OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   La cuenta de iMessage debería indicar `works`; con `--json`, la carga útil de la comprobación incluye `privateApi.available: true`. Si indica `false`, corrija primero ese problema; véase [Detección de capacidades](/es/channels/imessage#private-api-actions). La comprobación requiere un Gateway accesible (de lo contrario, la CLI recurre a una salida basada únicamente en la configuración) y solo comprueba las cuentas configuradas y habilitadas.

5. Cree una copia de la configuración:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Traducción de la configuración

iMessage y BlueBubbles comparten la mayoría de las claves de comportamiento del canal. Lo que cambia es el transporte (servidor REST frente a CLI local) y el formato de las claves del registro de grupos.

| BlueBubbles                                                | iMessage incluido                          | Notas                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`                | Misma semántica (valor predeterminado `true` una vez que existe el bloque).                                                                                                                                                                                                                                           |
| `channels.bluebubbles.serverUrl`                           | _(eliminado)_                              | Sin servidor REST: el plugin inicia `imsg rpc` mediante stdio.                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.password`                            | _(eliminado)_                              | No se necesita autenticación de Webhook.                                                                                                                                                                                                                                                                              |
| _(implícito)_                                              | `channels.imessage.cliPath`                | Ruta a `imsg` (valor predeterminado `imsg`); use un script contenedor para SSH.                                                                                                                                                                                                                                       |
| _(implícito)_                                              | `channels.imessage.dbPath`                 | Sustitución opcional de `chat.db` de Messages.app; se detecta automáticamente cuando se omite.                                                                                                                                                                                                                        |
| _(implícito)_                                              | `channels.imessage.remoteHost`             | `host` o `user@host`: solo se necesita cuando `cliPath` es un contenedor de SSH y se desea obtener archivos adjuntos mediante SCP.                                                                                                                                                                                    |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`               | Mismos valores (`pairing` / `allowlist` / `open` / `disabled`); valor predeterminado `pairing`.                                                                                                                                                                                                                       |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`              | Mismos formatos de identificador (`+15555550123`, `user@example.com`). Las aprobaciones del almacén de emparejamiento no se transfieren; consulte a continuación.                                                                                                                                                      |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`            | Mismos valores (`allowlist` / `open` / `disabled`); valor predeterminado `allowlist`.                                                                                                                                                                                                                                 |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`         | Igual. Cuando no está definido, iMessage recurre a `allowFrom`; un `groupAllowFrom: []` explícitamente vacío bloquea todos los grupos con `groupPolicy: "allowlist"`.                                                                                                                                                 |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                 | Copie literalmente la entrada comodín `"*"`; cambie las claves de las entradas de cada grupo para usar el `chat_id` numérico de iMessage; consulte «El peligro oculto del registro de grupos». `requireMention`, `tools`, `toolsBySender` y `systemPrompt` se conservan.                                                |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`       | Valor predeterminado `true`. Con el plugin incluido, esto solo se activa cuando la comprobación de la API privada está operativa.                                                                                                                                                                                     |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`     | Misma estructura y desactivado de forma predeterminada. Si los archivos adjuntos se procesaban en BlueBubbles, establezca esto explícitamente: las fotos y los elementos multimedia entrantes se descartan silenciosamente (sin ninguna línea de registro `Inbound message`) hasta que lo haga.                                                                                       |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`        | Raíces locales; mismas reglas de comodines.                                                                                                                                                                                                                                                                           |
| _(N/D)_                                                    | `channels.imessage.remoteAttachmentRoots`  | Solo se usa cuando `remoteHost` está definido para obtener archivos mediante SCP.                                                                                                                                                                                                                                     |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`             | Valor predeterminado de 16 MB en iMessage (el valor predeterminado de BlueBubbles era 8 MB). Establézcalo explícitamente para conservar el límite inferior.                                                                                                                                                           |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`         | Valor predeterminado de 4000 en ambos.                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms`  | Misma activación opcional. Solo para mensajes directos: los grupos mantienen el envío por mensaje. Amplía el antirrebote entrante predeterminado a 7000 ms, salvo que se establezca `messages.inbound.byChannel.imessage` o un `messages.inbound.debounceMs` global. Consulte [Agrupación de mensajes directos enviados por separado](/es/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/D)_                                    | `imsg` ya proporciona los nombres para mostrar de los remitentes desde `chat.db`.                                                                                                                                                                                                                                    |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`              | Mismos interruptores por acción (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`), además del nuevo `polls`. Todos están habilitados de forma predeterminada; las acciones de la API privada siguen requiriendo el puente.                                          |

Las configuraciones de varias cuentas (`channels.bluebubbles.accounts.*`) se traducen individualmente a `channels.imessage.accounts.*`.

## El peligro oculto del registro de grupos

El plugin de iMessage incluido ejecuta dos controles de grupo consecutivos. Un mensaje de grupo debe superar ambos para llegar al agente:

1. **Lista de permitidos de remitentes/destinos de chat** (`channels.imessage.groupAllowFrom`): coincide con el identificador del remitente o el destino del chat (entradas `chat_id:`, `chat_guid:`, `chat_identifier:`). Cuando `groupAllowFrom` no está definido, este control recurre a `allowFrom`; un `groupAllowFrom: []` explícito desactiva ese recurso y descarta todos los mensajes de grupo con `groupPolicy: "allowlist"`.
2. **Registro de grupos** (`channels.imessage.groups`): organizado por el `chat_id` numérico de iMessage:
   - Sin bloque `groups` (o con uno vacío): los grupos superan este control siempre que el control 1 tenga una lista de remitentes permitidos efectiva que no esté vacía; el filtrado de remitentes rige el acceso y no se emite ninguna advertencia de descarte total al inicio.
   - `groups` con entradas, pero sin `"*"`: solo se aceptan las claves `chat_id` enumeradas. Enumerar cualquier grupo convierte el registro en una lista de permitidos, incluso con `groupPolicy: "open"`.
   - `groups: { "*": { ... } }`: todos los grupos superan este control.

El riesgo de la migración: BlueBubbles organizaba las entradas de `groups` por GUID o identificador de chat, mientras que el registro de iMessage usa el `chat_id` numérico. Copiar literalmente las entradas de cada grupo crea un registro no vacío cuyas claves nunca coinciden, por lo que todos los mensajes de grupo se descartan en el control 2. Copie literalmente el comodín `"*"`; cambie las claves de las entradas de grupos específicos usando los valores de `chat_id` obtenidos mediante `imsg chats`.

Ambas rutas de descarte son visibles en el nivel de registro predeterminado mediante líneas `warn`:

- Una vez por cuenta durante el inicio, cuando se establece `groupPolicy: "allowlist"` y la lista efectiva de remitentes permitidos del grupo está vacía: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Establezca `groupAllowFrom` (o `allowFrom`) para admitir remitentes; añadir únicamente `groups` no satisface el control de remitentes.
- Una vez por `chat_id` durante la ejecución, cuando el registro descarta un grupo: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`, indicando la clave exacta que debe añadirse.

Los mensajes directos siguen funcionando en ambos casos: siguen una ruta de código diferente, por lo que el éxito de los mensajes directos no demuestra que el enrutamiento de grupos funcione.

La configuración mínima limitada por remitente con `groupPolicy: "allowlist"`:

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

Esto admite a los remitentes configurados en cualquier grupo. Añada entradas a `groups` para limitar los chats permitidos o establecer opciones por chat, como `requireMention`; copie literalmente la entrada `"*"` de BlueBubbles, pero cambie las claves de las entradas específicas usando valores numéricos de `chat_id` de iMessage.

## Paso a paso

1. Migra la configuración. Mantén el bloque nuevo deshabilitado mientras lo editas; el bloque antiguo `channels.bluebubbles` se ignora en la versión actual de OpenClaw y puede permanecer junto al nuevo como referencia:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // cambia a true cuando todo esté listo para la transición
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copia desde bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copia desde bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // el comodín se copia literalmente; cambia las claves de las entradas por chat a su chat_id
         // las acciones están habilitadas de forma predeterminada; establece controles individuales en false para deshabilitarlas
       },
     },
   }
   ```

2. **Realiza la transición y ejecuta una comprobación.** Establece `channels.imessage.enabled: true`, reinicia el Gateway y confirma que el canal se muestre como operativo:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # se espera "works"; --json muestra privateApi.available: true
   ```

   La comprobación requiere un Gateway accesible y solo comprueba las cuentas configuradas y habilitadas. Usa los comandos directos de `imsg` de [Antes de comenzar](#before-you-start) para validar el propio Mac.

3. **Verifica los MD.** Envía un mensaje directo al agente y confirma que llegue la respuesta.

4. **Verifica los grupos por separado.** Los MD y los grupos siguen rutas de código diferentes: que los MD funcionen no demuestra que los grupos se estén enrutando. Envía un mensaje en un chat grupal permitido y confirma que llegue la respuesta. Si el grupo queda en silencio (sin respuesta del agente ni error), consulta el registro del Gateway en busca de las dos líneas `warn` de la sección "Riesgo de configuración del registro de grupos" anterior. La advertencia de inicio indica que la lista de remitentes permitidos efectiva está vacía; una advertencia por `chat_id` indica que un registro `groups` con contenido no incluye ese chat.

5. **Verifica la superficie de acciones.** Desde un MD emparejado, pide al agente que reaccione, edite, anule el envío, responda, envíe una foto y, en un grupo, cambie el nombre del grupo o añada/elimine un participante. Cada acción debería reflejarse de forma nativa en Messages.app. Si alguna acción genera `iMessage <action> requires the imsg private API bridge`, vuelve a ejecutar `imsg launch` y actualiza la comprobación con `openclaw channels status --probe`.

6. **Elimina el servidor BlueBubbles y el bloque `channels.bluebubbles`** una vez verificados los MD, los grupos y las acciones de iMessage. OpenClaw no lee `channels.bluebubbles`.

## Comparación rápida de acciones

| Acción                                                       | BlueBubbles heredado | iMessage incluido                                                                                              |
| ------------------------------------------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Enviar texto / alternativa mediante SMS                      | ✅                   | ✅                                                                                                             |
| Enviar contenido multimedia (foto, vídeo, archivo, voz)      | ✅                   | ✅                                                                                                             |
| Respuesta en hilo (`reply_to_guid`)                           | ✅                   | ✅ (resuelve [#51892](https://github.com/openclaw/openclaw/issues/51892))                                      |
| Tapback (`react`)                                            | ✅                   | ✅                                                                                                             |
| Editar / anular envío (destinatarios con macOS 13+)          | ✅                   | ✅                                                                                                             |
| Enviar con efecto de pantalla                                | ✅                   | ✅ (resuelve parte de [#9394](https://github.com/openclaw/openclaw/issues/9394))                               |
| Texto enriquecido en negrita / cursiva / subrayado / tachado | ✅                   | ✅ (formato por tramos tipados mediante attributedBody)                                                        |
| Encuestas nativas de Messages (crear y votar)                 | ❌                   | ✅ (`actions.polls`; los destinatarios necesitan iOS/macOS 26+ para la representación nativa)                  |
| Cambiar el nombre del grupo / establecer el icono del grupo  | ✅                   | ✅                                                                                                             |
| Añadir / eliminar participante, abandonar el grupo           | ✅                   | ✅                                                                                                             |
| Confirmaciones de lectura e indicador de escritura           | ✅                   | ✅ (condicionado a la comprobación de la API privada)                                                          |
| Agrupación de MD del mismo remitente                          | ✅                   | ✅ (solo MD; habilitación opcional mediante `channels.imessage.coalesceSameSenderDms`)                         |
| Recuperación de entradas después de un reinicio              | ✅                   | ✅ (automática: reproducción de `since_rowid` + deduplicación por GUID; ventana más amplia en instalaciones locales) |

iMessage recupera los mensajes perdidos mientras el Gateway estaba inactivo: al iniciarse, reproduce desde el último rowid enviado mediante `imsg watch.subscribe` y `since_rowid`, deduplica por GUID, y un límite de antigüedad para el contenido pendiente obsoleto evita la "bomba de mensajes pendientes" causada por el vaciado de Push. Esto se ejecuta a través de la conexión RPC de `imsg`, por lo que también funciona en configuraciones remotas por SSH de `cliPath`; las configuraciones locales disponen de una ventana de recuperación más amplia porque pueden leer `chat.db`. Consulta [Recuperación de entradas después de reiniciar un puente o el Gateway](/es/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Emparejamiento, sesiones y vinculaciones ACP

- **Las listas de permitidos se transfieren por identificador.** `channels.imessage.allowFrom` reconoce las mismas cadenas `+15555550123` / `user@example.com` que usaba BlueBubbles; cópialas literalmente.
- **Las aprobaciones del almacén de emparejamiento no se transfieren.** El almacén de emparejamiento es específico de cada canal y no se migra ningún dato del antiguo almacén de BlueBubbles. Los remitentes aprobados únicamente mediante emparejamiento deben volver a emparejarse en iMessage, o bien debes añadir sus identificadores a `allowFrom`.
- **Las sesiones** mantienen su ámbito por agente y chat. Los MD se agrupan en la sesión principal del agente con el valor predeterminado `session.dmScope=main`; las sesiones de grupo permanecen aisladas por `chat_id` (`agent:<agentId>:imessage:group:<chat_id>`). El historial anterior de conversaciones asociado a claves de sesión de BlueBubbles no se transfiere a las sesiones de iMessage.
- **Las vinculaciones ACP** que hagan referencia a `match.channel: "bluebubbles"` deben cambiar a `"imessage"`. Los formatos de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, identificador sin prefijo) son idénticos.

## Sin canal de reversión

No existe un entorno de ejecución compatible de BlueBubbles al que regresar. Si falla la verificación de iMessage, establece `channels.imessage.enabled: false`, reinicia el Gateway, corrige el bloqueo de `imsg` y vuelve a intentar la transición.

La caché de respuestas reside en el estado SQLite del Plugin. `openclaw doctor --fix` importa y archiva el archivo auxiliar antiguo `imessage/reply-cache.jsonl` cuando está presente.

## Recursos relacionados

- [Eliminación de BlueBubbles y la ruta de iMessage mediante imsg](/es/announcements/bluebubbles-imessage) — anuncio breve y resumen para operadores.
- [iMessage](/es/channels/imessage) — referencia completa del canal iMessage, incluida la configuración de `imsg launch` y la detección de capacidades.
- `/channels/bluebubbles` — URL heredada que redirige a esta guía de migración.
- [Emparejamiento](/es/channels/pairing) — autenticación de MD y flujo de emparejamiento.
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo selecciona el Gateway un canal para las respuestas salientes.
