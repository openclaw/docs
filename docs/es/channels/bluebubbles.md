---
read_when:
    - Configuración del canal BlueBubbles
    - Solución de problemas del emparejamiento de Webhook
    - Configuración de iMessage en macOS
summary: iMessage a través del servidor macOS de BlueBubbles (envío/recepción por REST, escritura, reacciones, emparejamiento, acciones avanzadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T05:12:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3d8d617fc86ca1b191ff4dd2ae26b464e4d3f456a79c67b484a3a76d75de0d2
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST de macOS)

Estado: plugin incluido que se comunica con el servidor macOS de BlueBubbles por HTTP. **Recomendado para la integración con iMessage** debido a su API más completa y a una configuración más sencilla en comparación con el canal imsg heredado.

## Plugin incluido

Las versiones actuales de OpenClaw incluyen BlueBubbles, por lo que las compilaciones empaquetadas normales no
necesitan un paso separado de `openclaw plugins install`.

## Descripción general

- Se ejecuta en macOS mediante la aplicación auxiliar de BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/probado: macOS Sequoia (15). macOS Tahoe (26) funciona; actualmente la edición está rota en Tahoe, y las actualizaciones del icono de grupo pueden informar éxito pero no sincronizarse.
- OpenClaw se comunica con él mediante su API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Los mensajes entrantes llegan mediante Webhooks; las respuestas salientes, los indicadores de escritura, las confirmaciones de lectura y los tapbacks son llamadas REST.
- Los archivos adjuntos y stickers se incorporan como contenido multimedia entrante (y se muestran al agente cuando es posible).
- El emparejamiento/lista de permitidos funciona igual que en otros canales (`/channels/pairing`, etc.) con `channels.bluebubbles.allowFrom` + códigos de emparejamiento.
- Las reacciones se muestran como eventos del sistema igual que en Slack/Telegram, por lo que los agentes pueden "mencionarlas" antes de responder.
- Funciones avanzadas: editar, anular envío, respuestas en hilo, efectos de mensaje, gestión de grupos.

## Inicio rápido

1. Instala el servidor de BlueBubbles en tu Mac (sigue las instrucciones en [bluebubbles.app/install](https://bluebubbles.app/install)).
2. En la configuración de BlueBubbles, habilita la API web y establece una contraseña.
3. Ejecuta `openclaw onboard` y selecciona BlueBubbles, o configúralo manualmente:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Apunta los Webhooks de BlueBubbles a tu Gateway (ejemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Inicia el Gateway; registrará el controlador del Webhook e iniciará el emparejamiento.

Nota de seguridad:

- Establece siempre una contraseña para el Webhook.
- La autenticación del Webhook siempre es obligatoria. OpenClaw rechaza las solicitudes de Webhook de BlueBubbles a menos que incluyan una contraseña/guid que coincida con `channels.bluebubbles.password` (por ejemplo `?password=<password>` o `x-password`), independientemente de la topología de loopback/proxy.
- La autenticación por contraseña se comprueba antes de leer/analizar los cuerpos completos de los Webhooks.

## Mantener Messages.app activa (VM / configuraciones sin interfaz)

Algunas configuraciones de VM de macOS / siempre activas pueden hacer que Messages.app quede “inactiva” (los eventos entrantes se detienen hasta que la aplicación se abre o pasa al primer plano). Una solución simple es **estimular Messages cada 5 minutos** usando un AppleScript + LaunchAgent.

### 1) Guarda el AppleScript

Guárdalo como:

- `~/Scripts/poke-messages.scpt`

Script de ejemplo (no interactivo; no roba el foco):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Instala un LaunchAgent

Guárdalo como:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Notas:

- Esto se ejecuta **cada 300 segundos** y **al iniciar sesión**.
- La primera ejecución puede activar avisos de **Automatización** de macOS (`osascript` → Messages). Apruébalos en la misma sesión de usuario que ejecuta el LaunchAgent.

Cárgalo:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Incorporación

BlueBubbles está disponible en la incorporación interactiva:

```
openclaw onboard
```

El asistente solicita:

- **URL del servidor** (obligatoria): dirección del servidor BlueBubbles (p. ej., `http://192.168.1.100:1234`)
- **Contraseña** (obligatoria): contraseña de la API desde la configuración de BlueBubbles Server
- **Ruta del Webhook** (opcional): el valor predeterminado es `/bluebubbles-webhook`
- **Política de mensajes directos**: emparejamiento, lista de permitidos, abierto o deshabilitado
- **Lista de permitidos**: números de teléfono, correos electrónicos o destinos de chat

También puedes agregar BlueBubbles mediante la CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Control de acceso (mensajes directos + grupos)

Mensajes directos:

- Predeterminado: `channels.bluebubbles.dmPolicy = "pairing"`.
- Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueban (los códigos caducan después de 1 hora).
- Aprueba mediante:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- El emparejamiento es el intercambio de tokens predeterminado. Detalles: [Emparejamiento](/es/channels/pairing)

Grupos:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (predeterminado: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` controla quién puede activar en grupos cuando se establece `allowlist`.

### Enriquecimiento de nombres de contacto (macOS, opcional)

Los Webhooks de grupo de BlueBubbles a menudo solo incluyen direcciones sin procesar de los participantes. Si quieres que el contexto `GroupMembers` muestre en su lugar nombres de contactos locales, puedes activar el enriquecimiento desde Contactos locales en macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` habilita la búsqueda. Predeterminado: `false`.
- Las búsquedas solo se ejecutan después de que el acceso al grupo, la autorización de comandos y el filtrado por menciones hayan permitido el paso del mensaje.
- Solo se enriquecen los participantes telefónicos sin nombre.
- Los números de teléfono sin procesar permanecen como respaldo cuando no se encuentra ninguna coincidencia local.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Filtrado por menciones (grupos)

BlueBubbles admite el filtrado por menciones para chats grupales, en línea con el comportamiento de iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`) para detectar menciones.
- Cuando `requireMention` está habilitado para un grupo, el agente solo responde cuando se le menciona.
- Los comandos de control de remitentes autorizados omiten el filtrado por menciones.

Configuración por grupo:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // predeterminado para todos los grupos
        "iMessage;-;chat123": { requireMention: false }, // anulación para un grupo específico
      },
    },
  },
}
```

### Filtrado de comandos

- Los comandos de control (p. ej., `/config`, `/model`) requieren autorización.
- Usa `allowFrom` y `groupAllowFrom` para determinar la autorización de comandos.
- Los remitentes autorizados pueden ejecutar comandos de control incluso sin mencionar en grupos.

### Prompt del sistema por grupo

Cada entrada en `channels.bluebubbles.groups.*` acepta una cadena `systemPrompt` opcional. El valor se inyecta en el prompt del sistema del agente en cada turno que gestiona un mensaje en ese grupo, para que puedas establecer reglas de comportamiento o personalidad por grupo sin editar los prompts del agente:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Mantén las respuestas por debajo de 3 oraciones. Refleja el tono informal del grupo.",
        },
      },
    },
  },
}
```

La clave coincide con lo que BlueBubbles informa como `chatGuid` / `chatIdentifier` / `chatId` numérico para el grupo, y una entrada comodín `"*"` proporciona un valor predeterminado para cada grupo sin coincidencia exacta (el mismo patrón usado por `requireMention` y las políticas de herramientas por grupo). Las coincidencias exactas siempre prevalecen sobre el comodín. Los mensajes directos ignoran este campo; usa en su lugar la personalización de prompts a nivel de agente o de cuenta.

#### Ejemplo práctico: respuestas en hilo y reacciones tapback (API privada)

Con la API privada de BlueBubbles habilitada, los mensajes entrantes llegan con identificadores cortos de mensaje (por ejemplo `[[reply_to:5]]`) y el agente puede llamar a `action=reply` para responder en hilo a un mensaje específico o a `action=react` para añadir un tapback. Un `systemPrompt` por grupo es una forma fiable de hacer que el agente elija la herramienta correcta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Al responder en este grupo, llama siempre a action=reply con el",
            "messageId [[reply_to:N]] del contexto para que tu respuesta quede en hilo",
            "bajo el mensaje que la activó. Nunca envíes un mensaje nuevo sin enlace.",
            "",
            "Para confirmaciones breves ('ok', 'entendido', 'en ello'), usa",
            "action=react con un emoji tapback apropiado (❤️, 👍, 😂, ‼️, ❓)",
            "en lugar de enviar una respuesta de texto.",
          ].join(" "),
        },
      },
    },
  },
}
```

Las reacciones tapback y las respuestas en hilo requieren la API privada de BlueBubbles; consulta [Acciones avanzadas](#advanced-actions) y [IDs de mensaje](#message-ids-short-vs-full) para ver la mecánica subyacente.

## Enlaces de conversación de ACP

Los chats de BlueBubbles pueden convertirse en espacios de trabajo ACP persistentes sin cambiar la capa de transporte.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del mensaje directo o del chat grupal permitido.
- Los mensajes futuros en esa misma conversación de BlueBubbles se enrutan a la sesión ACP iniciada.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en su lugar.
- `/acp close` cierra la sesión ACP y elimina el enlace.

También se admiten enlaces persistentes configurados mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "bluebubbles"`.

`match.peer.id` puede usar cualquier formato de destino de BlueBubbles compatible:

- identificador de mensaje directo normalizado, como `+15555550123` o `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Para enlaces de grupo estables, prefiere `chat_id:*` o `chat_identifier:*`.

Ejemplo:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Consulta [Agentes ACP](/es/tools/acp-agents) para el comportamiento compartido de los enlaces ACP.

## Escritura + confirmaciones de lectura

- **Indicadores de escritura**: se envían automáticamente antes y durante la generación de la respuesta.
- **Confirmaciones de lectura**: controladas por `channels.bluebubbles.sendReadReceipts` (predeterminado: `true`).
- **Indicadores de escritura**: OpenClaw envía eventos de inicio de escritura; BlueBubbles borra el estado de escritura automáticamente al enviar o por tiempo de espera (la detención manual mediante DELETE no es fiable).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // deshabilitar confirmaciones de lectura
    },
  },
}
```

## Acciones avanzadas

BlueBubbles admite acciones avanzadas de mensajes cuando se habilitan en la configuración:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (predeterminado: true)
        edit: true, // editar mensajes enviados (macOS 13+, roto en macOS 26 Tahoe)
        unsend: true, // anular el envío de mensajes (macOS 13+)
        reply: true, // respuestas en hilo por GUID de mensaje
        sendWithEffect: true, // efectos de mensaje (slam, loud, etc.)
        renameGroup: true, // cambiar el nombre de los chats grupales
        setGroupIcon: true, // establecer el icono/foto del chat grupal (inestable en macOS 26 Tahoe)
        addParticipant: true, // agregar participantes a grupos
        removeParticipant: true, // eliminar participantes de grupos
        leaveGroup: true, // salir de chats grupales
        sendAttachment: true, // enviar archivos adjuntos/contenido multimedia
      },
    },
  },
}
```

Acciones disponibles:

- **react**: Agregar/eliminar reacciones tapback (`messageId`, `emoji`, `remove`)
- **edit**: Editar un mensaje enviado (`messageId`, `text`)
- **unsend**: Anular el envío de un mensaje (`messageId`)
- **reply**: Responder a un mensaje específico (`messageId`, `text`, `to`)
- **sendWithEffect**: Enviar con un efecto de iMessage (`text`, `to`, `effectId`)
- **renameGroup**: Cambiar el nombre de un chat grupal (`chatGuid`, `displayName`)
- **setGroupIcon**: Establecer el icono/foto de un chat grupal (`chatGuid`, `media`) — inestable en macOS 26 Tahoe (la API puede indicar éxito, pero el icono no se sincroniza).
- **addParticipant**: Agregar a alguien a un grupo (`chatGuid`, `address`)
- **removeParticipant**: Eliminar a alguien de un grupo (`chatGuid`, `address`)
- **leaveGroup**: Salir de un chat grupal (`chatGuid`)
- **upload-file**: Enviar contenido multimedia/archivos (`to`, `buffer`, `filename`, `asVoice`)
  - Notas de voz: establece `asVoice: true` con audio **MP3** o **CAF** para enviar como mensaje de voz de iMessage. BlueBubbles convierte MP3 → CAF al enviar notas de voz.
- Alias heredado: `sendAttachment` sigue funcionando, pero `upload-file` es el nombre de acción canónico.

### IDs de mensaje (corto vs. completo)

OpenClaw puede mostrar IDs de mensaje _cortos_ (p. ej., `1`, `2`) para ahorrar tokens.

- `MessageSid` / `ReplyToId` pueden ser IDs cortos.
- `MessageSidFull` / `ReplyToIdFull` contienen los IDs completos del proveedor.
- Los IDs cortos están en memoria; pueden caducar al reiniciar o al vaciarse la caché.
- Las acciones aceptan `messageId` corto o completo, pero los IDs cortos producirán error si ya no están disponibles.

Usa IDs completos para automatizaciones y almacenamiento persistentes:

- Plantillas: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` en cargas entrantes

Consulta [Configuration](/es/gateway/configuration) para ver las variables de plantilla.

## Streaming por bloques

Controla si las respuestas se envían como un solo mensaje o en bloques transmitidos:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // habilitar streaming por bloques (desactivado de forma predeterminada)
    },
  },
}
```

## Contenido multimedia + límites

- Los archivos adjuntos entrantes se descargan y almacenan en la caché multimedia.
- Límite multimedia mediante `channels.bluebubbles.mediaMaxMb` para contenido multimedia entrante y saliente (predeterminado: 8 MB).
- El texto saliente se divide en fragmentos según `channels.bluebubbles.textChunkLimit` (predeterminado: 4000 caracteres).

## Referencia de configuración

Configuración completa: [Configuration](/es/gateway/configuration)

Opciones del proveedor:

- `channels.bluebubbles.enabled`: habilitar/deshabilitar el canal.
- `channels.bluebubbles.serverUrl`: URL base de la API REST de BlueBubbles.
- `channels.bluebubbles.password`: contraseña de la API.
- `channels.bluebubbles.webhookPath`: ruta del endpoint del Webhook (predeterminado: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).
- `channels.bluebubbles.allowFrom`: lista de permitidos de mensajes directos (handles, correos electrónicos, números E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predeterminado: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: lista de permitidos de remitentes en grupos.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: en macOS, enriquece opcionalmente los participantes de grupo sin nombre a partir de Contactos locales después de que pase el filtrado. Predeterminado: `false`.
- `channels.bluebubbles.groups`: configuración por grupo (`requireMention`, etc.).
- `channels.bluebubbles.sendReadReceipts`: enviar confirmaciones de lectura (predeterminado: `true`).
- `channels.bluebubbles.blockStreaming`: habilitar streaming por bloques (predeterminado: `false`; necesario para respuestas en streaming).
- `channels.bluebubbles.textChunkLimit`: tamaño del fragmento saliente en caracteres (predeterminado: 4000).
- `channels.bluebubbles.sendTimeoutMs`: tiempo de espera por solicitud en ms para envíos de texto salientes mediante `/api/v1/message/text` (predeterminado: 30000). Auméntalo en configuraciones de macOS 26 donde los envíos de iMessage con la API privada puedan quedarse bloqueados durante más de 60 segundos dentro del marco de iMessage; por ejemplo `45000` o `60000`. Las sondas, búsquedas de chats, reacciones, ediciones y comprobaciones de estado actualmente mantienen el valor predeterminado más corto de 10 s; ampliar la cobertura a reacciones y ediciones está previsto como seguimiento. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (predeterminado) divide solo cuando se supera `textChunkLimit`; `newline` divide en líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.bluebubbles.mediaMaxMb`: límite de contenido multimedia entrante/saliente en MB (predeterminado: 8).
- `channels.bluebubbles.mediaLocalRoots`: lista de permitidos explícita de directorios locales absolutos permitidos para rutas multimedia locales salientes. Los envíos desde rutas locales se deniegan de forma predeterminada a menos que esto esté configurado. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: máximo de mensajes grupales para el contexto (0 lo desactiva).
- `channels.bluebubbles.dmHistoryLimit`: límite del historial de mensajes directos.
- `channels.bluebubbles.actions`: habilitar/deshabilitar acciones específicas.
- `channels.bluebubbles.accounts`: configuración de múltiples cuentas.

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Direccionamiento / destinos de entrega

Prefiere `chat_guid` para un enrutamiento estable:

- `chat_guid:iMessage;-;+15555550123` (preferido para grupos)
- `chat_id:123`
- `chat_identifier:...`
- Handles directos: `+15555550123`, `user@example.com`
  - Si un handle directo no tiene un chat de mensaje directo existente, OpenClaw creará uno mediante `POST /api/v1/chat/new`. Esto requiere que la API privada de BlueBubbles esté habilitada.

## Seguridad

- Las solicitudes de Webhook se autentican comparando los parámetros de consulta o encabezados `guid`/`password` con `channels.bluebubbles.password`.
- Mantén en secreto la contraseña de la API y el endpoint del Webhook (trátalos como credenciales).
- No hay omisión de localhost para la autenticación del Webhook de BlueBubbles. Si haces pasar el tráfico del Webhook por un proxy, conserva la contraseña de BlueBubbles en la solicitud de extremo a extremo. `gateway.trustedProxies` no sustituye aquí a `channels.bluebubbles.password`. Consulta [Gateway security](/es/gateway/security#reverse-proxy-configuration).
- Habilita HTTPS + reglas de firewall en el servidor BlueBubbles si lo expones fuera de tu LAN.

## Solución de problemas

- Si los eventos de escritura/lectura dejan de funcionar, revisa los registros del Webhook de BlueBubbles y verifica que la ruta del Gateway coincida con `channels.bluebubbles.webhookPath`.
- Los códigos de emparejamiento caducan después de una hora; usa `openclaw pairing list bluebubbles` y `openclaw pairing approve bluebubbles <code>`.
- Las reacciones requieren la API privada de BlueBubbles (`POST /api/v1/message/react`); asegúrate de que la versión del servidor la exponga.
- Editar/anular envío requiere macOS 13+ y una versión compatible del servidor BlueBubbles. En macOS 26 (Tahoe), la edición está actualmente rota debido a cambios en la API privada.
- Las actualizaciones del icono de grupo pueden ser inestables en macOS 26 (Tahoe): la API puede indicar éxito, pero el nuevo icono no se sincroniza.
- OpenClaw oculta automáticamente las acciones que se sabe que están rotas según la versión de macOS del servidor BlueBubbles. Si `edit` sigue apareciendo en macOS 26 (Tahoe), desactívalo manualmente con `channels.bluebubbles.actions.edit=false`.
- Para información de estado/salud: `openclaw status --all` o `openclaw status --deep`.

Para la referencia general del flujo de trabajo de canales, consulta [Channels](/es/channels) y la guía [Plugins](/es/tools/plugin).

## Relacionado

- [Channels Overview](/es/channels) — todos los canales compatibles
- [Pairing](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Groups](/es/channels/groups) — comportamiento de chats grupales y filtrado por menciones
- [Channel Routing](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Security](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
