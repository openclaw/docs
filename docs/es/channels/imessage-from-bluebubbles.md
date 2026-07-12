---
read_when:
    - Planificación de una migración de BlueBubbles al plugin de iMessage incluido
    - Traducción de las claves de configuración de BlueBubbles a sus equivalentes de iMessage
    - Verificación de `imsg` antes de habilitar el plugin de iMessage
summary: 'Migra las configuraciones antiguas de BlueBubbles al Plugin de iMessage incluido: asignación de claves, controles de listas de grupos permitidos y verificación de la transición.'
title: Si vienes de BlueBubbles
x-i18n:
    generated_at: "2026-07-11T22:50:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Se eliminó la compatibilidad con BlueBubbles. OpenClaw admite iMessage únicamente mediante el plugin `imessage` incluido, que controla [`steipete/imsg`](https://github.com/steipete/imsg) mediante JSON-RPC y accede a la misma superficie de API privada que tenía BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, encuestas nativas, administración de grupos y archivos adjuntos). Un único binario de CLI sustituye al servidor de BlueBubbles, la aplicación cliente y la infraestructura de Webhook: no hay ningún endpoint REST ni autenticación de Webhook.

Esta guía migra las configuraciones antiguas de `channels.bluebubbles` a `channels.imessage`. No existe ninguna otra ruta de migración compatible. En la versión actual de OpenClaw, cualquier bloque `channels.bluebubbles` restante queda inerte: ningún componente de ejecución lo lee.

<Note>
Para consultar el anuncio breve y el resumen para operadores, consulta [Eliminación de BlueBubbles y la ruta de iMessage mediante imsg](/es/announcements/bluebubbles-imessage).
</Note>

## Lista de comprobación para la migración

La ruta segura más corta si ya conoces tu configuración antigua de BlueBubbles:

1. Verifica `imsg` directamente en el Mac que ejecuta Messages.app (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Copia las claves de comportamiento de `channels.bluebubbles` a `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` y `actions`.
3. Elimina las claves de transporte que ya no existen: `serverUrl`, `password`, las URL de Webhook y la configuración del servidor de BlueBubbles.
4. Si el Gateway no se ejecuta en el Mac de Messages, establece `channels.imessage.cliPath` en un contenedor SSH y configura `remoteHost` para obtener archivos adjuntos remotos.
5. Habilita `channels.imessage`, reinicia el Gateway y, a continuación, ejecuta `openclaw channels status --probe --channel imessage`.
6. Prueba un mensaje directo, un grupo permitido, los archivos adjuntos si están habilitados y todas las acciones de la API privada que esperas que utilice el agente.
7. Elimina el servidor de BlueBubbles y la configuración antigua de `channels.bluebubbles` después de verificar la ruta de iMessage.

## Qué hace imsg

`imsg` es una CLI local de macOS para Messages. OpenClaw inicia `imsg rpc` como proceso secundario y se comunica mediante JSON-RPC a través de stdin/stdout. No hay ningún servidor HTTP, URL de Webhook, daemon en segundo plano, agente de inicio ni puerto que exponer.

- Las lecturas proceden de `~/Library/Messages/chat.db` mediante un identificador de SQLite de solo lectura.
- Los mensajes entrantes en vivo proceden de `imsg watch` / `watch.subscribe`, que sigue los eventos del sistema de archivos de `chat.db` con un mecanismo de sondeo alternativo.
- Los envíos utilizan la automatización de Messages.app para enviar texto normal y archivos.
- Las acciones avanzadas utilizan `imsg launch` para inyectar el asistente de `imsg` en Messages.app. Esto habilita las confirmaciones de lectura, los indicadores de escritura, los envíos enriquecidos, la edición, la anulación de envíos, las respuestas en hilos, las reacciones, las encuestas y la administración de grupos.
- Las compilaciones para Linux pueden inspeccionar una copia de `chat.db`, pero no pueden enviar mensajes, supervisar la base de datos activa del Mac ni controlar Messages.app. Para iMessage de OpenClaw, ejecuta `imsg` en el Mac con la sesión iniciada o mediante un contenedor SSH que se conecte a ese Mac.

## Antes de comenzar

1. Instala `imsg` en el Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   Para la configuración local habitual, la configuración de OpenClaw puede ofrecer una instalación o actualización de Homebrew de `imsg`, confirmada por el usuario, en el Mac de Messages con la sesión iniciada. La configuración manual y las topologías con contenedores SSH siguen estando administradas por el operador: repite la actualización de Homebrew en el mismo contexto de usuario local o remoto que ejecutará `imsg`. Si `imsg chats` falla con `unable to open database file`, no muestra resultados o devuelve `authorization denied`, concede acceso total al disco al terminal, editor, proceso de Node, servicio de Gateway o proceso principal de SSH que inicia `imsg` y, después, vuelve a abrir ese proceso principal.

2. Verifica las superficies de lectura, supervisión, envío y RPC antes de cambiar la configuración de OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Sustituye `42` por un identificador de chat real obtenido mediante `imsg chats`. El envío requiere permiso de automatización para Messages.app. Si OpenClaw se ejecutará mediante SSH, ejecuta estos comandos con el mismo contenedor SSH o contexto de usuario que utilizará OpenClaw. Si las lecturas funcionan, pero los envíos fallan con el error `-1743` de AppleEvents, comprueba si el permiso de automatización se asignó a `/usr/libexec/sshd-keygen-wrapper`; consulta [Los envíos mediante el contenedor SSH fallan con el error -1743 de AppleEvents](/es/channels/imessage#requirements-and-permissions-macos).

3. Habilita el puente de la API privada. Se recomienda encarecidamente para iMessage de OpenClaw porque las respuestas, las reacciones, los efectos, las encuestas, las respuestas a archivos adjuntos y las acciones de grupo dependen de él:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` requiere que SIP esté deshabilitado (y, en las versiones modernas de macOS, que se relaje la validación de bibliotecas; consulta [Habilitación de la API privada de imsg](/es/channels/imessage#enabling-the-imsg-private-api)). El envío básico, el historial y la supervisión funcionan sin `imsg launch`; la superficie completa de acciones de iMessage de OpenClaw no.

4. Después de habilitar `channels.imessage` e iniciar el Gateway, verifica el puente mediante OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   La cuenta de iMessage debería indicar `works`; con `--json`, la carga útil de la comprobación incluye `privateApi.available: true`. Si indica `false`, corrige primero ese problema; consulta [Detección de capacidades](/es/channels/imessage#private-api-actions). La comprobación necesita un Gateway accesible (de lo contrario, la CLI recurre a una salida basada únicamente en la configuración) y solo comprueba las cuentas configuradas y habilitadas.

5. Crea una copia de seguridad de tu configuración:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Traducción de la configuración

iMessage y BlueBubbles comparten la mayoría de las claves de comportamiento del canal. Lo que cambia es el transporte (servidor REST frente a CLI local) y el formato de las claves del registro de grupos.

| BlueBubbles                                                | iMessage incluido                          | Notas                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`                | Misma semántica (valor predeterminado `true` una vez que existe el bloque).                                                                                                                                                                                                                                           |
| `channels.bluebubbles.serverUrl`                           | _(eliminado)_                              | No hay servidor REST: el Plugin inicia `imsg rpc` mediante stdio.                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.password`                            | _(eliminado)_                              | No se necesita autenticación de Webhook.                                                                                                                                                                                                                                                                              |
| _(implícito)_                                              | `channels.imessage.cliPath`                | Ruta a `imsg` (valor predeterminado `imsg`); use un script contenedor para SSH.                                                                                                                                                                                                                                        |
| _(implícito)_                                              | `channels.imessage.dbPath`                 | Reemplazo opcional de `chat.db` de Messages.app; se detecta automáticamente si se omite.                                                                                                                                                                                                                              |
| _(implícito)_                                              | `channels.imessage.remoteHost`             | `host` o `user@host`: solo se necesita cuando `cliPath` es un script contenedor de SSH y se desea obtener archivos adjuntos mediante SCP.                                                                                                                                                                              |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`               | Mismos valores (`pairing` / `allowlist` / `open` / `disabled`); valor predeterminado `pairing`.                                                                                                                                                                                                                        |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`              | Mismos formatos de identificador (`+15555550123`, `user@example.com`). Las aprobaciones del almacén de emparejamiento no se transfieren; consulte más abajo.                                                                                                                                                            |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`            | Mismos valores (`allowlist` / `open` / `disabled`); valor predeterminado `allowlist`.                                                                                                                                                                                                                                  |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`         | Igual. Cuando no se establece, iMessage recurre a `allowFrom`; un `groupAllowFrom: []` explícitamente vacío bloquea todos los grupos con `groupPolicy: "allowlist"`.                                                                                                                                                    |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                 | Copie literalmente la entrada comodín `"*"`; vuelva a asignar las claves de las entradas de cada grupo según el `chat_id` numérico de iMessage; consulte «El peligro oculto del registro de grupos». `requireMention`, `tools`, `toolsBySender` y `systemPrompt` se conservan.                                             |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`       | Valor predeterminado `true`. Con el Plugin incluido, esto solo se activa cuando la comprobación de la API privada está disponible.                                                                                                                                                                                     |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`     | Misma estructura y desactivado de forma predeterminada. Si los archivos adjuntos se procesaban en BlueBubbles, establezca esto explícitamente: las fotos y los archivos multimedia entrantes se descartan silenciosamente (sin una línea de registro `Inbound message`) hasta que lo haga.                               |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`        | Raíces locales; mismas reglas de comodines.                                                                                                                                                                                                                                                                           |
| _(No aplicable)_                                           | `channels.imessage.remoteAttachmentRoots`  | Solo se usa cuando se establece `remoteHost` para obtener archivos mediante SCP.                                                                                                                                                                                                                                       |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`             | Valor predeterminado de 16 MB en iMessage (el valor predeterminado de BlueBubbles era 8 MB). Establézcalo explícitamente para conservar el límite inferior.                                                                                                                                                             |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`         | Valor predeterminado de 4000 en ambos.                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms`  | Misma activación opcional. Solo para mensajes directos: los grupos mantienen el envío por mensaje. Amplía la estabilización de entrada predeterminada a 7000 ms, salvo que se establezca `messages.inbound.byChannel.imessage` o el valor global `messages.inbound.debounceMs`. Consulte [Agrupación de mensajes directos enviados por partes](/es/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(No aplicable)_                           | `imsg` ya obtiene de `chat.db` los nombres para mostrar de los remitentes.                                                                                                                                                                                                                                             |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`              | Los mismos conmutadores por acción (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`), además del nuevo `polls`. Todos están activados de forma predeterminada; las acciones de la API privada siguen requiriendo el puente. |

Las configuraciones de varias cuentas (`channels.bluebubbles.accounts.*`) se trasladan individualmente a `channels.imessage.accounts.*`.

## El peligro oculto del registro de grupos

El Plugin de iMessage incluido ejecuta dos filtros de grupo consecutivos. Un mensaje de grupo debe superar ambos para llegar al agente:

1. **Lista de permitidos de remitentes/destinos de chat** (`channels.imessage.groupAllowFrom`): coincide con el identificador del remitente o con el destino del chat (entradas `chat_id:`, `chat_guid:`, `chat_identifier:`). Cuando `groupAllowFrom` no está establecido, este filtro recurre a `allowFrom`; un `groupAllowFrom: []` explícito desactiva esa alternativa y descarta todos los mensajes de grupo con `groupPolicy: "allowlist"`.
2. **Registro de grupos** (`channels.imessage.groups`): sus claves son los valores numéricos `chat_id` de iMessage:
   - Sin bloque `groups` (o con uno vacío): los grupos superan este filtro siempre que el filtro 1 tenga una lista efectiva de remitentes permitidos que no esté vacía; el filtrado de remitentes controla el acceso y no se emite ninguna advertencia de descarte total al iniciar.
   - `groups` con entradas, pero sin `"*"`: solo se admiten las claves `chat_id` enumeradas. Enumerar cualquier grupo convierte el registro en una lista de permitidos, incluso con `groupPolicy: "open"`.
   - `groups: { "*": { ... } }`: todos los grupos superan este filtro.

La trampa de la migración: BlueBubbles usaba el GUID o identificador del chat como clave para las entradas de `groups`, mientras que el registro de iMessage usa el valor numérico `chat_id`. Copiar literalmente las entradas de cada grupo crea un registro no vacío cuyas claves nunca coinciden, por lo que todos los mensajes de grupo se descartan en el filtro 2. Copie literalmente el comodín `"*"`; vuelva a asignar las claves de las entradas de grupos específicos con los valores `chat_id` obtenidos mediante `imsg chats`.

Ambas rutas de descarte son visibles con el nivel de registro predeterminado mediante líneas `warn`:

- Una vez por cuenta al iniciar, cuando se establece `groupPolicy: "allowlist"` y la lista efectiva de remitentes de grupos permitidos está vacía: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Establezca `groupAllowFrom` (o `allowFrom`) para admitir remitentes; añadir únicamente `groups` no satisface el filtro de remitentes.
- Una vez por `chat_id` durante la ejecución, cuando el registro descarta un grupo: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`, indicando la clave exacta que se debe añadir.

Los mensajes directos siguen funcionando en ambos casos: siguen una ruta de código diferente, por lo que el funcionamiento de los mensajes directos no demuestra que el enrutamiento de grupos funcione.

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

Esto admite a los remitentes configurados en cualquier grupo. Añada entradas a `groups` para limitar los chats permitidos o establezca opciones por chat, como `requireMention`; copie literalmente la entrada `"*"` de BlueBubbles, pero vuelva a asignar las claves de las entradas específicas con valores numéricos `chat_id` de iMessage.

## Paso a paso

1. Migra la configuración. Mantén el bloque nuevo deshabilitado mientras lo editas; el bloque antiguo `channels.bluebubbles` se ignora en la versión actual de OpenClaw y puede permanecer junto al nuevo como referencia:

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

2. **Realiza la transición y ejecuta una comprobación.** Establece `channels.imessage.enabled: true`, reinicia el Gateway y confirma que el canal aparece como operativo:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # expect "works"; --json shows privateApi.available: true
   ```

   La comprobación requiere un Gateway accesible y solo comprueba las cuentas configuradas y habilitadas. Usa los comandos directos de `imsg` de [Antes de comenzar](#before-you-start) para validar el propio Mac.

3. **Verifica los mensajes directos.** Envía un mensaje directo al agente y confirma que se recibe la respuesta.

4. **Verifica los grupos por separado.** Los mensajes directos y los grupos siguen rutas de código diferentes: que los mensajes directos funcionen no demuestra que los grupos se estén enrutando. Envía un mensaje en un chat grupal permitido y confirma que se recibe la respuesta. Si el grupo queda en silencio (sin respuesta del agente ni error), revisa el registro del Gateway para buscar las dos líneas `warn` de "Group registry footgun" mencionadas anteriormente. La advertencia de inicio significa que la lista efectiva de remitentes permitidos está vacía; una advertencia por `chat_id` significa que un registro `groups` con datos no contiene ese chat.

5. **Verifica la superficie de acciones.** Desde un mensaje directo emparejado, pide al agente que reaccione, edite, anule el envío, responda, envíe una foto y, en un grupo, cambie el nombre del grupo o añada o elimine un participante. Cada acción debe aparecer de forma nativa en Messages.app. Si alguna acción genera `iMessage <action> requires the imsg private API bridge`, vuelve a ejecutar `imsg launch` y actualiza el estado con `openclaw channels status --probe`.

6. **Elimina el servidor BlueBubbles y el bloque `channels.bluebubbles`** una vez verificados los mensajes directos, los grupos y las acciones de iMessage. OpenClaw no lee `channels.bluebubbles`.

## Comparación rápida de acciones

| Acción                                                      | BlueBubbles heredado | iMessage incluido                                                                       |
| ----------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| Enviar texto / alternativa por SMS                          | ✅                   | ✅                                                                                      |
| Enviar contenido multimedia (foto, vídeo, archivo, voz)     | ✅                   | ✅                                                                                      |
| Respuesta en hilo (`reply_to_guid`)                         | ✅                   | ✅ (resuelve [#51892](https://github.com/openclaw/openclaw/issues/51892))                |
| Tapback (`react`)                                           | ✅                   | ✅                                                                                      |
| Editar / anular envío (destinatarios con macOS 13 o posterior) | ✅                | ✅                                                                                      |
| Enviar con efecto de pantalla                               | ✅                   | ✅ (resuelve parte de [#9394](https://github.com/openclaw/openclaw/issues/9394))         |
| Texto enriquecido en negrita / cursiva / subrayado / tachado | ✅                 | ✅ (formato de segmentos tipados mediante attributedBody)                               |
| Encuestas nativas de Messages (crear y votar)               | ❌                   | ✅ (`actions.polls`; los destinatarios necesitan iOS/macOS 26 o posterior para la representación nativa) |
| Cambiar el nombre del grupo / establecer el icono del grupo | ✅                   | ✅                                                                                      |
| Añadir / eliminar participante, abandonar el grupo          | ✅                   | ✅                                                                                      |
| Confirmaciones de lectura e indicador de escritura          | ✅                   | ✅ (condicionado a la comprobación de la API privada)                                   |
| Agrupación de mensajes directos del mismo remitente         | ✅                   | ✅ (solo mensajes directos; activación opcional mediante `channels.imessage.coalesceSameSenderDms`) |
| Recuperación de entradas después de un reinicio             | ✅                   | ✅ (automática: reproducción con `since_rowid` + deduplicación por GUID; ventana más amplia en local) |

iMessage recupera los mensajes que no se recibieron mientras el Gateway estaba inactivo: al iniciarse, reproduce desde el último rowid despachado mediante `since_rowid` de `imsg watch.subscribe`, elimina duplicados por GUID y una barrera de antigüedad para el historial obsoleto suprime la «bomba de historial» del vaciado Push. Esto se ejecuta a través de la conexión RPC de `imsg`, por lo que también funciona en configuraciones remotas por SSH de `cliPath`; las configuraciones locales disponen de una ventana de recuperación más amplia porque pueden leer `chat.db`. Consulta [Recuperación de entradas después de reiniciar un puente o el Gateway](/es/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Emparejamiento, sesiones y vinculaciones ACP

- **Las listas de permitidos se transfieren por identificador.** `channels.imessage.allowFrom` reconoce las mismas cadenas `+15555550123` / `user@example.com` que utilizaba BlueBubbles; cópialas literalmente.
- **Las aprobaciones del almacén de emparejamiento no se transfieren.** El almacén de emparejamiento es específico de cada canal y no se migra ningún dato del antiguo almacén de BlueBubbles. Los remitentes que solo se aprobaron mediante emparejamiento deben volver a emparejarse una vez en iMessage, o debes añadir sus identificadores a `allowFrom`.
- **Las sesiones** siguen estando limitadas por agente y chat. Los mensajes directos se agrupan en la sesión principal del agente con el valor predeterminado `session.dmScope=main`; las sesiones de grupo permanecen aisladas por `chat_id` (`agent:<agentId>:imessage:group:<chat_id>`). El historial de conversaciones antiguo asociado a claves de sesión de BlueBubbles no se transfiere a las sesiones de iMessage.
- **Las vinculaciones ACP** que hagan referencia a `match.channel: "bluebubbles"` deben cambiar a `"imessage"`. Los formatos de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, identificador sin prefijo) son idénticos.

## Sin canal de reversión

No existe ningún entorno de ejecución de BlueBubbles compatible al que se pueda volver. Si falla la verificación de iMessage, establece `channels.imessage.enabled: false`, reinicia el Gateway, corrige el bloqueo de `imsg` y vuelve a intentar la transición.

La caché de respuestas reside en el estado SQLite del Plugin. `openclaw doctor --fix` importa y archiva el archivo auxiliar antiguo `imessage/reply-cache.jsonl` cuando está presente.

## Contenido relacionado

- [Eliminación de BlueBubbles y la ruta de iMessage mediante imsg](/es/announcements/bluebubbles-imessage) — anuncio breve y resumen para operadores.
- [iMessage](/es/channels/imessage) — referencia completa del canal iMessage, incluida la configuración de `imsg launch` y la detección de capacidades.
- `/channels/bluebubbles` — URL heredada que redirige a esta guía de migración.
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento.
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo el Gateway selecciona un canal para las respuestas salientes.
