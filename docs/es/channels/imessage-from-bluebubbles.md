---
read_when:
    - Planificar una migración de BlueBubbles al plugin iMessage incluido
    - Traducir claves de configuración de BlueBubbles a equivalentes de iMessage
    - Verificación de imsg antes de habilitar el Plugin de iMessage
summary: Migra las configuraciones antiguas de BlueBubbles al Plugin de iMessage incluido sin perder el emparejamiento, las listas de permitidos ni las vinculaciones de grupos.
title: Viniendo de BlueBubbles
x-i18n:
    generated_at: "2026-06-27T10:38:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

El Plugin `imessage` incluido ahora alcanza la misma superficie de API privada que BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, gestión de grupos, adjuntos) controlando [`steipete/imsg`](https://github.com/steipete/imsg) mediante JSON-RPC. Si ya ejecutas un Mac con `imsg` instalado, puedes eliminar el servidor BlueBubbles y permitir que el Plugin hable directamente con Messages.app.

Se eliminó la compatibilidad con BlueBubbles. OpenClaw admite iMessage solo mediante `imsg`. Esta guía sirve para migrar configuraciones antiguas de `channels.bluebubbles` a `channels.imessage`; no hay otra ruta de migración compatible.

<Note>
Para el anuncio breve y el resumen para operadores, consulta [Eliminación de BlueBubbles y la ruta de iMessage con imsg](/es/announcements/bluebubbles-imessage).
</Note>

## Lista de comprobación de migración

Usa esta lista cuando ya conozcas tu configuración antigua de BlueBubbles y quieras la ruta segura más corta:

1. Verifica `imsg` directamente en el Mac que ejecuta Messages.app (`imsg chats`, `imsg history`, `imsg send` y `imsg rpc --help`).
2. Copia las claves de comportamiento de `channels.bluebubbles` a `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` y `actions`.
3. Elimina las claves de transporte que ya no existen: `serverUrl`, `password`, URLs de Webhook y la configuración del servidor BlueBubbles.
4. Si el Gateway no se ejecuta en el Mac de Messages, establece `channels.imessage.cliPath` en un contenedor SSH y establece `remoteHost` para recuperaciones remotas de adjuntos.
5. Con el Gateway detenido, habilita `channels.imessage` y luego ejecuta `openclaw channels status --probe --channel imessage`.
6. Prueba un DM, un grupo permitido, adjuntos si están habilitados y cada acción de API privada que esperes que use el agente.
7. Elimina el servidor BlueBubbles y la configuración antigua de `channels.bluebubbles` después de verificar la ruta de iMessage.

## Cuándo tiene sentido esta migración

- Ya ejecutas `imsg` en el mismo Mac (o en uno accesible mediante SSH) donde Messages.app tiene la sesión iniciada.
- Quieres una pieza móvil menos: sin servidor BlueBubbles separado, sin endpoint REST que autenticar, sin cableado de Webhook. Un único binario de CLI en lugar de un servidor + app cliente + helper.
- Estás en una [compilación compatible de macOS / `imsg`](/es/channels/imessage#requirements-and-permissions-macos) donde la sonda de API privada informa `available: true`.

## Qué hace imsg

`imsg` es una CLI local de macOS para Messages. OpenClaw inicia `imsg rpc` como proceso secundario y habla JSON-RPC por stdin/stdout. No hay servidor HTTP, URL de Webhook, demonio en segundo plano, agente de inicio ni puerto que exponer.

- Las lecturas vienen de `~/Library/Messages/chat.db` usando un identificador SQLite de solo lectura.
- Los mensajes entrantes en vivo vienen de `imsg watch` / `watch.subscribe`, que sigue eventos del sistema de archivos de `chat.db` con un sondeo de reserva.
- Los envíos usan automatización de Messages.app para envíos normales de texto y archivos.
- Las acciones avanzadas usan `imsg launch` para inyectar el helper de `imsg` en Messages.app. Eso es lo que desbloquea confirmaciones de lectura, indicadores de escritura, envíos enriquecidos, edición, anulación de envío, respuesta en hilo, tapbacks y gestión de grupos.
- Las compilaciones de Linux pueden inspeccionar un `chat.db` copiado, pero no pueden enviar, vigilar la base de datos en vivo del Mac ni controlar Messages.app. Para OpenClaw iMessage, ejecuta `imsg` en el Mac con la sesión iniciada o mediante un contenedor SSH hacia ese Mac.

## Antes de empezar

1. Instala `imsg` en el Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Si `imsg chats` falla con `unable to open database file`, salida vacía o `authorization denied`, concede Acceso total al disco al terminal, editor, proceso de Node, servicio de Gateway o proceso padre SSH que inicia `imsg`, y luego vuelve a abrir ese proceso padre.

2. Verifica las superficies de lectura, vigilancia, envío y RPC antes de cambiar la configuración de OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Sustituye `42` por un id de chat real de `imsg chats`. Enviar requiere permiso de Automatización para Messages.app. Si OpenClaw se ejecutará mediante SSH, ejecuta estos comandos mediante el mismo contenedor SSH o contexto de usuario que usará OpenClaw. Si las lecturas/sondas funcionan pero los envíos fallan con AppleEvents `-1743`, comprueba si Automatización cayó en `/usr/libexec/sshd-keygen-wrapper`; consulta [Los envíos del contenedor SSH fallan con AppleEvents -1743](/es/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

3. Habilita el puente de API privada cuando necesites acciones avanzadas:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` requiere que SIP esté deshabilitado. El envío básico, el historial y la vigilancia funcionan sin `imsg launch`; las acciones avanzadas no.

4. Después de agregar una configuración `channels.imessage` habilitada, verifica el puente mediante OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Quieres `imessage.privateApi.available: true`. Si informa `false`, corrige eso primero; consulta [Detección de capacidades](/es/channels/imessage#private-api-actions). `channels status --probe` solo sondea cuentas configuradas y habilitadas.

5. Haz una instantánea de tu configuración:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Traducción de configuración

iMessage y BlueBubbles comparten mucha configuración de nivel de canal. Las claves que cambian son principalmente de transporte (servidor REST frente a CLI local). Las claves de comportamiento (`dmPolicy`, `groupPolicy`, `allowFrom`, etc.) mantienen el mismo significado.

| BlueBubbles                                                | iMessage incluido                         | Notas                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Misma semántica.                                                                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.serverUrl`                           | _(eliminado)_                             | Sin servidor REST: el Plugin inicia `imsg rpc` sobre stdio.                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.password`                            | _(eliminado)_                             | No se necesita autenticación de Webhook.                                                                                                                                                                                                                                                                                                                                             |
| _(implícito)_                                              | `channels.imessage.cliPath`               | Ruta a `imsg` (valor predeterminado `imsg`); usa un script de envoltura para SSH.                                                                                                                                                                                                                                                                                                    |
| _(implícito)_                                              | `channels.imessage.dbPath`                | Anulación opcional de `chat.db` de Messages.app; se detecta automáticamente cuando se omite.                                                                                                                                                                                                                                                                                         |
| _(implícito)_                                              | `channels.imessage.remoteHost`            | `host` o `user@host`: solo se necesita cuando `cliPath` es un script de envoltura SSH y quieres obtener adjuntos mediante SCP.                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Mismos valores (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Las aprobaciones de emparejamiento se trasladan por identificador, no por token.                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Mismos valores (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Igual.                                                                                                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Copia esto literalmente, incluida cualquier entrada comodín `groups: { "*": { ... } }`.** `requireMention`, `tools` y `toolsBySender` por grupo se trasladan. Con `groupPolicy: "allowlist"`, un bloque `groups` vacío o ausente descarta silenciosamente todos los mensajes de grupo; consulta "Trampa del registro de grupos" más abajo.                                        |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Valor predeterminado `true`. Con el Plugin incluido, esto solo se activa cuando la sonda de API privada está activa.                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Misma forma, **también desactivado de forma predeterminada**. Si tenías adjuntos en funcionamiento en BlueBubbles, debes volver a configurarlo explícitamente en el bloque de iMessage: no se traslada de forma implícita, y las fotos o archivos multimedia entrantes se descartarán silenciosamente sin ninguna línea de registro `Inbound message` hasta que lo hagas.             |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Raíces locales; mismas reglas de comodines.                                                                                                                                                                                                                                                                                                                                          |
| _(N/A)_                                                    | `channels.imessage.remoteAttachmentRoots` | Solo se usa cuando `remoteHost` está definido para descargas mediante SCP.                                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Valor predeterminado de 16 MB en iMessage (el valor predeterminado de BlueBubbles era 8 MB). Configúralo explícitamente si quieres mantener el límite inferior.                                                                                                                                                                                                                      |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Valor predeterminado de 4000 en ambos.                                                                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Misma opción voluntaria. Solo para DM: los chats de grupo mantienen el despacho instantáneo por mensaje en ambos canales. Amplía el antirrebote entrante predeterminado a 7000 ms cuando se habilita sin un `messages.inbound.byChannel.imessage` explícito o un `messages.inbound.debounceMs` global. Consulta [documentación de iMessage § Agrupación de DM enviados por partes](/es/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/A)_                                   | iMessage ya lee los nombres visibles de los remitentes desde `chat.db`.                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Conmutadores por acción: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                                            |

Las configuraciones multicuenta (`channels.bluebubbles.accounts.*`) se traducen uno a uno a `channels.imessage.accounts.*`.

## Trampa del registro de grupos

El Plugin de iMessage incluido ejecuta **dos** compuertas de allowlist de grupos separadas, una detrás de la otra. Ambas deben pasar para que un mensaje de grupo llegue al agente:

1. **Allowlist de remitente / destino de chat** (`channels.imessage.groupAllowFrom`): comprobada por `isAllowedIMessageSender`. Hace coincidir mensajes entrantes por identificador del remitente, `chat_guid`, `chat_identifier` o `chat_id`. Misma forma que BlueBubbles.
2. **Registro de grupos** (`channels.imessage.groups`): comprobado por `resolveChannelGroupPolicy` desde `inbound-processing.ts:199`. Con `groupPolicy: "allowlist"`, esta compuerta requiere una de estas opciones:
   - una entrada comodín `groups: { "*": { ... } }` (establece `allowAll = true`), o
   - una entrada explícita por `chat_id` en `groups`.

Si la compuerta 1 pasa pero la compuerta 2 falla, el mensaje se descarta. El Plugin emite dos señales de nivel `warn`, por lo que esto ya no es silencioso con el nivel de registro predeterminado:

- Un `warn` único al inicio por cuenta cuando `groupPolicy: "allowlist"` está definido pero `channels.imessage.groups` está vacío (sin comodín `"*"`, sin entradas por `chat_id`), emitido antes de que llegue cualquier mensaje.
- Un `warn` único por `chat_id` la primera vez que se descarta un grupo específico en tiempo de ejecución, que nombra el chat_id y la clave exacta que se debe agregar a `groups` para permitirlo.

Los MD siguen funcionando porque toman una ruta de código diferente.

Este es el modo de fallo más común de la migración BlueBubbles → iMessage incluido: los operadores copian `groupAllowFrom` y `groupPolicy`, pero omiten el bloque `groups`, porque `groups: { "*": { "requireMention": true } }` de BlueBubbles parece una configuración de menciones no relacionada. En realidad es esencial para la puerta del registro.

La configuración mínima para que los mensajes de grupo sigan fluyendo después de `groupPolicy: "allowlist"`:

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

`requireMention: true` bajo `*` no causa problemas cuando no hay patrones de mención configurados: el runtime establece `canDetectMention = false` y evita la eliminación por mención en `inbound-processing.ts:512`. Con patrones de mención configurados (`agents.list[].groupChat.mentionPatterns`), funciona como se espera.

Si los registros del Gateway muestran `imessage: dropping group message from chat_id=<id>` o la línea de inicio `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, la puerta 2 está descartando el mensaje: añade el bloque `groups`.

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

2. **Prueba antes de que el tráfico importe**: detén el Gateway, habilita temporalmente el bloque de iMessage y confirma desde la CLI que iMessage informa un estado correcto:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` solo prueba cuentas configuradas y habilitadas. No reinicies el Gateway con BlueBubbles e iMessage habilitados a la vez, salvo que quieras ejecutar intencionalmente ambos monitores de canal. Si no vas a hacer la transición de inmediato, vuelve a establecer `channels.imessage.enabled` en `false` antes de reiniciar el Gateway. Usa los comandos directos de `imsg` en [Antes de empezar](#before-you-start) para validar el Mac antes de habilitar el tráfico de OpenClaw.

3. **Haz la transición.** Cuando la cuenta de iMessage habilitada informe un estado correcto, elimina la configuración de BlueBubbles y mantén iMessage habilitado:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Reinicia el gateway. El tráfico entrante de iMessage ahora fluye a través del plugin incluido.

4. **Verifica los MD.** Envía al agente un mensaje directo; confirma que llega la respuesta.

5. **Verifica los grupos por separado.** Los MD y los grupos toman rutas de código diferentes: que los MD funcionen no prueba que los grupos se estén enrutando. Envía un mensaje al agente en un chat de grupo emparejado y confirma que llega la respuesta. Si el grupo queda en silencio (sin respuesta del agente, sin error), revisa el registro del gateway en busca de `imessage: dropping group message from chat_id=<id>` o la línea de inicio `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`: ambas se emiten en el nivel de registro predeterminado. Si aparece cualquiera de ellas, falta tu bloque `groups` o está vacío; consulta "Error crítico del registro de grupos" arriba.

6. **Verifica la superficie de acciones**: desde un MD emparejado, pide al agente que reaccione, edite, anule el envío, responda, envíe una foto y (en un grupo) cambie el nombre del grupo / añada o elimine un participante. Cada acción debería llegar de forma nativa a Messages.app. Si alguna lanza "iMessage `<action>` requires the imsg private API bridge", ejecuta `imsg launch` otra vez y actualiza `channels status --probe`.

7. **Elimina el servidor y la configuración de BlueBubbles** cuando hayas verificado los MD, los grupos y las acciones de iMessage. OpenClaw no usará `channels.bluebubbles`.

## Paridad de acciones de un vistazo

| Acción                                              | BlueBubbles heredado                | iMessage incluido                                                            |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Enviar texto / reserva por SMS                      | ✅                                  | ✅                                                                            |
| Enviar medios (foto, vídeo, archivo, voz)           | ✅                                  | ✅                                                                            |
| Respuesta en hilo (`reply_to_guid`)                 | ✅                                  | ✅ (cierra [#51892](https://github.com/openclaw/openclaw/issues/51892))       |
| Tapback (`react`)                                   | ✅                                  | ✅                                                                            |
| Editar / anular envío (destinatarios con macOS 13+) | ✅                                  | ✅                                                                            |
| Enviar con efecto de pantalla                       | ✅                                  | ✅ (cierra parte de [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Texto enriquecido en negrita / cursiva / subrayado / tachado | ✅                                  | ✅ (formato typed-run mediante attributedBody)                                |
| Cambiar nombre del grupo / establecer icono del grupo | ✅                                  | ✅                                                                            |
| Añadir / eliminar participante, salir del grupo      | ✅                                  | ✅                                                                            |
| Confirmaciones de lectura e indicador de escritura  | ✅                                  | ✅ (condicionado a la prueba de API privada)                                  |
| Agrupación de MD del mismo remitente                | ✅                                  | ✅ (solo MD; activación voluntaria mediante `channels.imessage.coalesceSameSenderDms`) |
| Recuperación entrante tras un reinicio              | ✅ (reproducción de Webhook + obtención de historial) | ✅ (automática: reproduce mensajes perdidos mediante since_rowid + deduplicación; ventana más amplia en local) |

iMessage recupera los mensajes perdidos mientras el gateway estaba apagado: al iniciarse, reproduce desde el último rowid despachado mediante `imsg watch.subscribe` `since_rowid` y deduplica por GUID, mientras una barrera de edad para acumulación obsoleta suprime la "bomba de acumulación" de Push-flush. Esto se ejecuta sobre la conexión RPC de `imsg`, así que también funciona para configuraciones remotas SSH con `cliPath`; las configuraciones locales tienen una ventana de recuperación más amplia porque pueden leer `chat.db`. Consulta [Recuperación entrante tras un reinicio del puente o del gateway](/es/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Emparejamiento, sesiones y enlaces ACP

- **Las aprobaciones de emparejamiento** se conservan por identificador. No necesitas volver a aprobar remitentes conocidos: `channels.imessage.allowFrom` reconoce las mismas cadenas `+15555550123` / `user@example.com` que usaba BlueBubbles.
- **Las sesiones** permanecen acotadas por agente + chat. Los MD se contraen en la sesión principal del agente con el valor predeterminado `session.dmScope=main`; las sesiones de grupo permanecen aisladas por `chat_id`. Las claves de sesión difieren (`agent:<id>:imessage:group:<chat_id>` frente al equivalente de BlueBubbles): el historial de conversación antiguo bajo claves de sesión de BlueBubbles no se traslada a sesiones de iMessage.
- **Los enlaces ACP** que hagan referencia a `match.channel: "bluebubbles"` deben actualizarse a `"imessage"`. Las formas de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, identificador sin prefijo) son idénticas.

## Sin canal de reversión

No hay ningún runtime de BlueBubbles compatible al que volver. Si falla la verificación de iMessage, establece `channels.imessage.enabled: false`, reinicia el Gateway, corrige el bloqueo de `imsg` y vuelve a intentar la transición.

La caché de respuestas vive en el estado de plugin de SQLite. `openclaw doctor --fix` importa y archiva el sidecar antiguo `imessage/reply-cache.jsonl` cuando está presente.

## Relacionado

- [Eliminación de BlueBubbles y la ruta de iMessage con imsg](/es/announcements/bluebubbles-imessage): anuncio breve y resumen para operadores.
- [iMessage](/es/channels/imessage): referencia completa del canal iMessage, incluida la configuración de `imsg launch` y la detección de capacidades.
- `/channels/bluebubbles`: URL heredada que redirige a esta guía de migración.
- [Emparejamiento](/es/channels/pairing): autenticación por MD y flujo de emparejamiento.
- [Enrutamiento de canales](/es/channels/channel-routing): cómo el gateway elige un canal para respuestas salientes.
