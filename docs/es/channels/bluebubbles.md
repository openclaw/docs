---
read_when:
    - Configuración del canal BlueBubbles
    - Solución de problemas del emparejamiento de Webhook
    - Configuración de iMessage en macOS
summary: iMessage mediante el servidor BlueBubbles de macOS (envío/recepción REST, escritura, reacciones, emparejamiento, acciones avanzadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T13:35:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30ce50ae8a17140b42fa410647c367e0eefdffb1646b1ff92d8e1af63f2e1155
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST de macOS)

Estado: plugin integrado que se comunica con el servidor BlueBubbles de macOS por HTTP. **Recomendado para la integración con iMessage** debido a su API más completa y a una configuración más sencilla en comparación con el canal imsg heredado.

## Plugin integrado

Las versiones actuales de OpenClaw incluyen BlueBubbles, por lo que las compilaciones empaquetadas normales no necesitan un paso separado de `openclaw plugins install`.

## Descripción general

- Se ejecuta en macOS mediante la aplicación auxiliar de BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/probado: macOS Sequoia (15). macOS Tahoe (26) funciona; actualmente la edición está rota en Tahoe, y las actualizaciones del icono de grupo pueden informar éxito pero no sincronizarse.
- OpenClaw se comunica con él mediante su API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Los mensajes entrantes llegan mediante Webhooks; las respuestas salientes, los indicadores de escritura, las confirmaciones de lectura y los tapbacks son llamadas REST.
- Los archivos adjuntos y stickers se incorporan como contenido multimedia entrante (y se muestran al agente cuando es posible).
- El emparejamiento/la lista de permitidos funciona igual que en otros canales (`/channels/pairing`, etc.) con `channels.bluebubbles.allowFrom` + códigos de emparejamiento.
- Las reacciones se muestran como eventos del sistema, igual que en Slack/Telegram, para que los agentes puedan "mencionarlas" antes de responder.
- Funciones avanzadas: editar, anular envío, respuestas en hilos, efectos de mensaje, gestión de grupos.

## Inicio rápido

1. Instala el servidor BlueBubbles en tu Mac (sigue las instrucciones en [bluebubbles.app/install](https://bluebubbles.app/install)).
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
5. Inicia el Gateway; registrará el controlador del Webhook y comenzará el emparejamiento.

Nota de seguridad:

- Establece siempre una contraseña para el Webhook.
- La autenticación del Webhook siempre es obligatoria. OpenClaw rechaza las solicitudes de Webhook de BlueBubbles a menos que incluyan una contraseña/guid que coincida con `channels.bluebubbles.password` (por ejemplo `?password=<password>` o `x-password`), independientemente de la topología de loopback/proxy.
- La autenticación por contraseña se comprueba antes de leer/analizar cuerpos completos de Webhook.

## Mantener Messages.app activa (configuraciones de VM / sin interfaz)

Algunas configuraciones de VM de macOS / siempre activas pueden hacer que Messages.app quede “inactiva” (los eventos entrantes se detienen hasta que la aplicación se abre o pasa a primer plano). Una solución sencilla es **activar Messages cada 5 minutos** mediante un AppleScript + LaunchAgent.

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

## Onboarding

BlueBubbles está disponible en el onboarding interactivo:

```
openclaw onboard
```

El asistente solicita:

- **URL del servidor** (obligatorio): dirección del servidor BlueBubbles (p. ej., `http://192.168.1.100:1234`)
- **Contraseña** (obligatorio): contraseña de la API de la configuración de BlueBubbles Server
- **Ruta del Webhook** (opcional): por defecto `/bluebubbles-webhook`
- **Política de DM**: pairing, allowlist, open o disabled
- **Lista de permitidos**: números de teléfono, correos electrónicos o destinos de chat

También puedes añadir BlueBubbles mediante la CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Control de acceso (DM + grupos)

DM:

- Predeterminado: `channels.bluebubbles.dmPolicy = "pairing"`.
- Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueban (los códigos caducan después de 1 hora).
- Aprueba mediante:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- El emparejamiento es el intercambio de tokens predeterminado. Detalles: [Pairing](/es/channels/pairing)

Grupos:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (predeterminado: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` controla quién puede activar en grupos cuando se establece `allowlist`.

### Enriquecimiento de nombres de contactos (macOS, opcional)

Los Webhooks de grupos de BlueBubbles suelen incluir solo direcciones sin procesar de los participantes. Si quieres que el contexto de `GroupMembers` muestre en su lugar nombres de contactos locales, puedes activar opcionalmente el enriquecimiento local desde Contactos en macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` habilita la búsqueda. Predeterminado: `false`.
- Las búsquedas se ejecutan solo después de que el acceso al grupo, la autorización de comandos y el control por mención hayan permitido el paso del mensaje.
- Solo se enriquecen los participantes telefónicos sin nombre.
- Los números de teléfono sin procesar se mantienen como alternativa cuando no se encuentra ninguna coincidencia local.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Control por mención (grupos)

BlueBubbles admite control por mención para chats grupales, en línea con el comportamiento de iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`) para detectar menciones.
- Cuando `requireMention` está habilitado para un grupo, el agente solo responde cuando se le menciona.
- Los comandos de control de remitentes autorizados omiten el control por mención.

Configuración por grupo:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // predeterminado para todos los grupos
        "iMessage;-;chat123": { requireMention: false }, // reemplazo para un grupo específico
      },
    },
  },
}
```

### Control de comandos

- Los comandos de control (p. ej., `/config`, `/model`) requieren autorización.
- Usa `allowFrom` y `groupAllowFrom` para determinar la autorización de comandos.
- Los remitentes autorizados pueden ejecutar comandos de control incluso sin mencionar en grupos.

### Prompt del sistema por grupo

Cada entrada en `channels.bluebubbles.groups.*` acepta una cadena `systemPrompt` opcional. El valor se inyecta en el prompt del sistema del agente en cada turno que maneja un mensaje de ese grupo, por lo que puedes establecer reglas de comportamiento o personalidad por grupo sin editar los prompts del agente:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Mantén las respuestas por debajo de 3 frases. Refleja el tono informal del grupo.",
        },
      },
    },
  },
}
```

La clave coincide con lo que BlueBubbles informa como `chatGuid` / `chatIdentifier` / `chatId` numérico para el grupo, y una entrada comodín `"*"` proporciona un valor predeterminado para todos los grupos sin coincidencia exacta (el mismo patrón que usan `requireMention` y las políticas de herramientas por grupo). Las coincidencias exactas siempre prevalecen sobre el comodín. Los DM ignoran este campo; usa en su lugar la personalización del prompt a nivel de agente o de cuenta.

#### Ejemplo práctico: respuestas en hilos y reacciones tapback (API privada)

Con la API privada de BlueBubbles habilitada, los mensajes entrantes llegan con identificadores de mensaje cortos (por ejemplo `[[reply_to:5]]`) y el agente puede llamar a `action=reply` para responder en hilo a un mensaje específico o `action=react` para dejar un tapback. Un `systemPrompt` por grupo es una forma fiable de hacer que el agente elija la herramienta correcta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Al responder en este grupo, llama siempre a action=reply con el",
            "messageId [[reply_to:N]] del contexto para que tu respuesta quede en hilo",
            "debajo del mensaje que la activó. Nunca envíes un mensaje nuevo sin vincular.",
            "",
            "Para confirmaciones breves ('ok', 'entendido', 'voy a ello'), usa",
            "action=react con un emoji tapback apropiado (❤️, 👍, 😂, ‼️, ❓)",
            "en lugar de enviar una respuesta de texto.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tanto las reacciones tapback como las respuestas en hilo requieren la API privada de BlueBubbles; consulta [Advanced actions](#advanced-actions) y [Message IDs](#message-ids-short-vs-full) para ver la mecánica subyacente.

## Vinculaciones de conversaciones ACP

Los chats de BlueBubbles pueden convertirse en espacios de trabajo ACP persistentes sin cambiar la capa de transporte.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del DM o chat grupal permitido.
- Los mensajes futuros en esa misma conversación de BlueBubbles se enrutan a la sesión ACP generada.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en el mismo lugar.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

También se admiten vinculaciones persistentes configuradas mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "bluebubbles"`.

`match.peer.id` puede usar cualquier formato de destino de BlueBubbles compatible:

- identificador DM normalizado, como `+15555550123` o `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Para vinculaciones de grupo estables, prefiere `chat_id:*` o `chat_identifier:*`.

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

Consulta [ACP Agents](/es/tools/acp-agents) para ver el comportamiento compartido de las vinculaciones ACP.

## Escritura + confirmaciones de lectura

- **Indicadores de escritura**: se envían automáticamente antes y durante la generación de respuestas.
- **Confirmaciones de lectura**: controladas por `channels.bluebubbles.sendReadReceipts` (predeterminado: `true`).
- **Indicadores de escritura**: OpenClaw envía eventos de inicio de escritura; BlueBubbles borra la escritura automáticamente al enviar o por tiempo de espera (la detención manual mediante DELETE no es fiable).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // desactiva las confirmaciones de lectura
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
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

Acciones disponibles:

- **react**: añadir/eliminar reacciones tapback (`messageId`, `emoji`, `remove`)
- **edit**: editar un mensaje enviado (`messageId`, `text`)
- **unsend**: anular el envío de un mensaje (`messageId`)
- **reply**: responder a un mensaje específico (`messageId`, `text`, `to`)
- **sendWithEffect**: enviar con efecto de iMessage (`text`, `to`, `effectId`)
- **renameGroup**: cambiar el nombre de un chat grupal (`chatGuid`, `displayName`)
- **setGroupIcon**: establecer el icono/foto de un chat grupal (`chatGuid`, `media`) — poco fiable en macOS 26 Tahoe (la API puede devolver éxito, pero el icono no se sincroniza).
- **addParticipant**: añadir a alguien a un grupo (`chatGuid`, `address`)
- **removeParticipant**: eliminar a alguien de un grupo (`chatGuid`, `address`)
- **leaveGroup**: salir de un chat grupal (`chatGuid`)
- **upload-file**: enviar archivos multimedia/archivos (`to`, `buffer`, `filename`, `asVoice`)
  - Notas de voz: establece `asVoice: true` con audio **MP3** o **CAF** para enviar como mensaje de voz de iMessage. BlueBubbles convierte MP3 → CAF al enviar notas de voz.
- Alias heredado: `sendAttachment` sigue funcionando, pero `upload-file` es el nombre canónico de la acción.

### IDs de mensajes (cortos frente a completos)

OpenClaw puede mostrar IDs de mensaje _cortos_ (por ejemplo, `1`, `2`) para ahorrar tokens.

- `MessageSid` / `ReplyToId` pueden ser IDs cortos.
- `MessageSidFull` / `ReplyToIdFull` contienen los IDs completos del proveedor.
- Los IDs cortos están en memoria; pueden caducar al reiniciar o al vaciar la caché.
- Las acciones aceptan `messageId` cortos o completos, pero los IDs cortos darán error si ya no están disponibles.

Usa IDs completos para automatizaciones y almacenamiento persistentes:

- Plantillas: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` en cargas útiles entrantes

Consulta [Configuration](/es/gateway/configuration) para ver las variables de plantilla.

## Coalescencia de DMs de envío dividido (comando + URL en una sola composición)

Cuando un usuario escribe un comando y una URL juntos en iMessage — por ejemplo, `Dump https://example.com/article` — Apple divide el envío en **dos entregas de Webhook separadas**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa OG como archivos adjuntos.

Los dos Webhooks llegan a OpenClaw con una diferencia de ~0.8-2.0 s en la mayoría de configuraciones. Sin coalescencia, el agente recibe solo el comando en el turno 1, responde (a menudo "envíame la URL") y solo ve la URL en el turno 2, momento en el que el contexto del comando ya se ha perdido.

`channels.bluebubbles.coalesceSameSenderDms` permite que un DM combine Webhooks consecutivos del mismo remitente en un solo turno del agente. Los chats grupales siguen usando claves por mensaje para preservar la estructura de turnos de varios usuarios.

### Cuándo habilitarlo

Habilítalo cuando:

- Publicas Skills que esperan `comando + carga útil` en un solo mensaje (dump, paste, save, queue, etc.).
- Tus usuarios pegan URL, imágenes o contenido largo junto con comandos.
- Puedes aceptar la latencia adicional del turno de DM (consulta abajo).

Déjalo deshabilitado cuando:

- Necesitas la latencia mínima de comandos para activadores DM de una sola palabra.
- Todos tus flujos son comandos de una sola ejecución sin cargas útiles posteriores.

### Habilitación

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // opt in (default: false)
    },
  },
}
```

Con la marca activada y sin `messages.inbound.byChannel.bluebubbles` explícito, la ventana de debounce se amplía a **2500 ms** (el valor predeterminado sin coalescencia es 500 ms). Se requiere una ventana más amplia: la cadencia de envío dividido de Apple de 0.8-2.0 s no encaja en la ventana predeterminada más ajustada.

Para ajustar la ventana manualmente:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
        // or under memory pressure (observed gap can stretch past 2 s then).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Compensaciones

- **Latencia añadida para comandos de control en DM.** Con la marca activada, los mensajes de comandos de control en DM (como `Dump`, `Save`, etc.) ahora esperan hasta la ventana de debounce antes de despacharse, por si llega un Webhook de carga útil. Los comandos en chats grupales mantienen el despacho instantáneo.
- **La salida combinada está limitada**: el texto combinado se limita a 4000 caracteres con un marcador explícito `…[truncated]`; los archivos adjuntos se limitan a 20; las entradas de origen se limitan a 10 (se conserva la primera y la más reciente por encima de ese límite). Cada `messageId` de origen sigue llegando a la deduplicación de entrada, por lo que una repetición posterior de MessagePoller de cualquier evento individual se reconoce como duplicado.
- **Activación opcional, por canal.** Otros canales (Telegram, WhatsApp, Slack, …) no se ven afectados.

### Escenarios y lo que ve el agente

| El usuario redacta                                                  | Apple entrega            | Marca desactivada (predeterminado)      | Marca activada + ventana de 2500 ms                                      |
| ------------------------------------------------------------------- | ------------------------ | --------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (un solo envío)                          | 2 Webhooks ~1 s aparte   | Dos turnos del agente: "Dump" solo, luego URL | Un turno: texto combinado `Dump https://example.com`                 |
| `Save this 📎image.jpg caption` (archivo adjunto + texto)           | 2 Webhooks               | Dos turnos                              | Un turno: texto + imagen                                                 |
| `/status` (comando independiente)                                   | 1 Webhook                | Despacho instantáneo                    | **Espera hasta la ventana y luego despacha**                             |
| URL pegada sola                                                     | 1 Webhook                | Despacho instantáneo                    | Despacho instantáneo (solo una entrada en el bucket)                     |
| Texto + URL enviados como dos mensajes separados intencionalmente, con minutos de diferencia | 2 Webhooks fuera de la ventana | Dos turnos                    | Dos turnos (la ventana caduca entre ellos)                               |
| Ráfaga rápida (>10 DMs pequeños dentro de la ventana)               | N Webhooks               | N turnos                                | Un turno, salida limitada (se aplican límites de primero + más reciente, texto/adjuntos) |

### Solución de problemas de la coalescencia de envío dividido

Si la marca está activada y los envíos divididos siguen llegando como dos turnos, comprueba cada capa:

1. **La configuración realmente se cargó.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Luego `openclaw gateway restart`: la marca se lee al crear el registro de debounce.

2. **La ventana de debounce es lo bastante amplia para tu configuración.** Mira el registro del servidor BlueBubbles en `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Mide la diferencia entre el despacho de texto tipo `"Dump"` y el despacho posterior de `"https://..."; Attachments:`. Aumenta `messages.inbound.byChannel.bluebubbles` para cubrir cómodamente esa diferencia.

3. **Las marcas de tiempo JSONL de sesión ≠ llegada del Webhook.** Las marcas de tiempo de los eventos de sesión (`~/.openclaw/agents/<id>/sessions/*.jsonl`) reflejan cuándo el Gateway entrega un mensaje al agente, **no** cuándo llegó el Webhook. Un segundo mensaje en cola etiquetado como `[Queued messages while agent was busy]` significa que el primer turno seguía ejecutándose cuando llegó el segundo Webhook; el bucket de coalescencia ya se había vaciado. Ajusta la ventana según el registro del servidor BB, no según el registro de sesión.

4. **La presión de memoria ralentiza el despacho de respuestas.** En máquinas más pequeñas (8 GB), los turnos del agente pueden tardar lo suficiente como para que el bucket de coalescencia se vacíe antes de que termine la respuesta, y la URL llegue como un segundo turno en cola. Comprueba `memory_pressure` y `ps -o rss -p $(pgrep openclaw-gateway)`; si el Gateway supera ~500 MB RSS y el compresor está activo, cierra otros procesos pesados o usa un host más grande.

5. **Los envíos con cita de respuesta siguen otra ruta.** Si el usuario pulsó `Dump` como **respuesta** a un globo de URL existente (iMessage muestra una insignia "1 Reply" en el globo de Dump), la URL está en `replyToBody`, no en un segundo Webhook. La coalescencia no se aplica: es una cuestión de Skill/prompt, no del debounce.

## Streaming por bloques

Controla si las respuestas se envían como un solo mensaje o en streaming por bloques:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Multimedia + límites

- Los archivos adjuntos entrantes se descargan y se almacenan en la caché multimedia.
- Límite multimedia mediante `channels.bluebubbles.mediaMaxMb` para contenido multimedia entrante y saliente (predeterminado: 8 MB).
- El texto saliente se divide en fragmentos según `channels.bluebubbles.textChunkLimit` (predeterminado: 4000 caracteres).

## Referencia de configuración

Configuración completa: [Configuration](/es/gateway/configuration)

Opciones del proveedor:

- `channels.bluebubbles.enabled`: habilita/deshabilita el canal.
- `channels.bluebubbles.serverUrl`: URL base de la API REST de BlueBubbles.
- `channels.bluebubbles.password`: contraseña de la API.
- `channels.bluebubbles.webhookPath`: ruta del endpoint de Webhook (predeterminado: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).
- `channels.bluebubbles.allowFrom`: lista de permitidos de DM (identificadores, correos electrónicos, números E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predeterminado: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: lista de permitidos de remitentes en grupos.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: en macOS, enriquece opcionalmente a los participantes sin nombre del grupo usando Contactos locales después de que pase el control. Predeterminado: `false`.
- `channels.bluebubbles.groups`: configuración por grupo (`requireMention`, etc.).
- `channels.bluebubbles.sendReadReceipts`: envía confirmaciones de lectura (predeterminado: `true`).
- `channels.bluebubbles.blockStreaming`: habilita el streaming por bloques (predeterminado: `false`; requerido para respuestas en streaming).
- `channels.bluebubbles.textChunkLimit`: tamaño de fragmento saliente en caracteres (predeterminado: 4000).
- `channels.bluebubbles.sendTimeoutMs`: tiempo de espera por solicitud en ms para envíos de texto saliente mediante `/api/v1/message/text` (predeterminado: 30000). Auméntalo en configuraciones de macOS 26 donde los envíos de iMessage mediante la API privada pueden bloquearse durante más de 60 segundos dentro del framework de iMessage; por ejemplo `45000` o `60000`. Actualmente, las sondas, búsquedas de chats, reacciones, ediciones y comprobaciones de estado mantienen el valor predeterminado más corto de 10 s; ampliar esa cobertura a reacciones y ediciones está previsto como seguimiento. Reemplazo por cuenta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (predeterminado) divide solo al superar `textChunkLimit`; `newline` divide por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.bluebubbles.mediaMaxMb`: límite de contenido multimedia entrante/saliente en MB (predeterminado: 8).
- `channels.bluebubbles.mediaLocalRoots`: lista de permitidos explícita de directorios locales absolutos permitidos para rutas de contenido multimedia local saliente. Los envíos de rutas locales se deniegan de forma predeterminada a menos que esto esté configurado. Reemplazo por cuenta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: fusiona Webhooks consecutivos de DM del mismo remitente en un solo turno del agente para que el envío dividido de Apple de texto+URL llegue como un único mensaje (predeterminado: `false`). Consulta [Coalescing split-send DMs](#coalescing-split-send-dms-command--url-in-one-composition) para ver escenarios, ajuste de ventana y compensaciones. Amplía la ventana predeterminada de debounce de entrada de 500 ms a 2500 ms cuando se habilita sin un `messages.inbound.byChannel.bluebubbles` explícito.
- `channels.bluebubbles.historyLimit`: máximo de mensajes de grupo para el contexto (0 lo desactiva).
- `channels.bluebubbles.dmHistoryLimit`: límite del historial de DM.
- `channels.bluebubbles.actions`: habilita/deshabilita acciones específicas.
- `channels.bluebubbles.accounts`: configuración de múltiples cuentas.

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Direccionamiento / destinos de entrega

Prefiere `chat_guid` para un enrutamiento estable:

- `chat_guid:iMessage;-;+15555550123` (preferido para grupos)
- `chat_id:123`
- `chat_identifier:...`
- Identificadores directos: `+15555550123`, `user@example.com`
  - Si un identificador directo no tiene un chat DM existente, OpenClaw creará uno mediante `POST /api/v1/chat/new`. Esto requiere que la API privada de BlueBubbles esté habilitada.

## Seguridad

- Las solicitudes de Webhook se autentican comparando los parámetros de consulta o encabezados `guid`/`password` con `channels.bluebubbles.password`.
- Mantén en secreto la contraseña de la API y el endpoint de Webhook (trátalos como credenciales).
- No hay una omisión para localhost en la autenticación del Webhook de BlueBubbles. Si usas un proxy para el tráfico del Webhook, mantén la contraseña de BlueBubbles en la solicitud de extremo a extremo. `gateway.trustedProxies` no reemplaza aquí `channels.bluebubbles.password`. Consulta [Gateway security](/es/gateway/security#reverse-proxy-configuration).
- Habilita HTTPS + reglas de firewall en el servidor BlueBubbles si lo expones fuera de tu LAN.

## Solución de problemas

- Si los eventos de escritura/lectura dejan de funcionar, revisa los registros de Webhook de BlueBubbles y verifica que la ruta del Gateway coincida con `channels.bluebubbles.webhookPath`.
- Los códigos de emparejamiento caducan después de una hora; usa `openclaw pairing list bluebubbles` y `openclaw pairing approve bluebubbles <code>`.
- Las reacciones requieren la API privada de BlueBubbles (`POST /api/v1/message/react`); asegúrate de que la versión del servidor la exponga.
- Editar/anular envío requiere macOS 13+ y una versión compatible del servidor BlueBubbles. En macOS 26 (Tahoe), editar está actualmente roto debido a cambios en la API privada.
- Las actualizaciones del icono de grupo pueden ser poco fiables en macOS 26 (Tahoe): la API puede devolver éxito, pero el nuevo icono no se sincroniza.
- OpenClaw oculta automáticamente las acciones conocidas como defectuosas según la versión de macOS del servidor BlueBubbles. Si editar sigue apareciendo en macOS 26 (Tahoe), desactívalo manualmente con `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` está habilitado pero los envíos divididos (por ejemplo `Dump` + URL) siguen llegando como dos turnos: consulta la lista de comprobación de [solución de problemas de la coalescencia de envío dividido](#split-send-coalescing-troubleshooting); las causas comunes son una ventana de debounce demasiado ajustada, interpretar erróneamente las marcas de tiempo del registro de sesión como llegada del Webhook, o un envío con cita de respuesta (que usa `replyToBody`, no un segundo Webhook).
- Para información de estado/salud: `openclaw status --all` o `openclaw status --deep`.

Para consultar la referencia general del flujo de trabajo de canales, consulta [Channels](/es/channels) y la guía de [Plugins](/es/tools/plugin).

## Relacionado

- [Channels Overview](/es/channels) — todos los canales compatibles
- [Pairing](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Groups](/es/channels/groups) — comportamiento del chat grupal y control por mención
- [Channel Routing](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Security](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
