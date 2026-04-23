---
read_when:
    - Configuración del canal BlueBubbles
    - Solución de problemas del emparejamiento de Webhook
    - Configuración de iMessage en macOS
summary: iMessage a través del servidor macOS BlueBubbles (envío/recepción por REST, escritura, reacciones, emparejamiento, acciones avanzadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-23T13:57:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1c1670bb453a1f78bb8e35e4b7065ceeba46ce93180e1288745621f8c4179c9
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST de macOS)

Estado: Plugin incluido que se comunica con el servidor macOS de BlueBubbles por HTTP. **Recomendado para la integración con iMessage** debido a su API más completa y su configuración más sencilla en comparación con el canal imsg heredado.

## Plugin incluido

Las versiones actuales de OpenClaw incluyen BlueBubbles, por lo que las compilaciones empaquetadas normales no necesitan un paso separado de `openclaw plugins install`.

## Descripción general

- Se ejecuta en macOS mediante la aplicación auxiliar BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/probado: macOS Sequoia (15). macOS Tahoe (26) funciona; actualmente la edición está rota en Tahoe, y las actualizaciones del icono de grupo pueden informar éxito pero no sincronizarse.
- OpenClaw se comunica con él a través de su API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Los mensajes entrantes llegan mediante Webhooks; las respuestas salientes, los indicadores de escritura, los acuses de lectura y los tapbacks son llamadas REST.
- Los adjuntos y stickers se procesan como contenido multimedia entrante (y se muestran al agente cuando es posible).
- El emparejamiento/lista de permitidos funciona igual que en otros canales (`/channels/pairing`, etc.) con `channels.bluebubbles.allowFrom` + códigos de emparejamiento.
- Las reacciones se muestran como eventos del sistema igual que en Slack/Telegram para que los agentes puedan "mencionarlas" antes de responder.
- Funciones avanzadas: editar, deshacer envío, respuestas en hilo, efectos de mensaje, gestión de grupos.

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
5. Inicia el Gateway; registrará el controlador del Webhook e iniciará el emparejamiento.

Nota de seguridad:

- Establece siempre una contraseña para el Webhook.
- La autenticación del Webhook siempre es obligatoria. OpenClaw rechaza las solicitudes de Webhook de BlueBubbles a menos que incluyan una contraseña/guid que coincida con `channels.bluebubbles.password` (por ejemplo `?password=<password>` o `x-password`), independientemente de la topología de loopback/proxy.
- La autenticación por contraseña se comprueba antes de leer/analizar los cuerpos completos del Webhook.

## Mantener Messages.app activa (configuraciones de VM / sin interfaz)

Algunas configuraciones de VM de macOS / siempre activas pueden hacer que Messages.app quede “inactiva” (los eventos entrantes se detienen hasta que la aplicación se abre o pasa a primer plano). Una solución sencilla es **estimular Messages cada 5 minutos** usando un AppleScript + LaunchAgent.

### 1) Guardar el AppleScript

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

### 2) Instalar un LaunchAgent

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

- **URL del servidor** (obligatoria): dirección del servidor BlueBubbles (por ejemplo, `http://192.168.1.100:1234`)
- **Contraseña** (obligatoria): contraseña de la API desde la configuración de BlueBubbles Server
- **Ruta del Webhook** (opcional): por defecto `/bluebubbles-webhook`
- **Política de MD**: pairing, allowlist, open o disabled
- **Lista de permitidos**: números de teléfono, correos electrónicos o destinos de chat

También puedes añadir BlueBubbles mediante la CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Control de acceso (MD + grupos)

MD:

- Predeterminado: `channels.bluebubbles.dmPolicy = "pairing"`.
- Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueban (los códigos caducan tras 1 hora).
- Aprobar mediante:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- El emparejamiento es el intercambio de tokens predeterminado. Detalles: [Emparejamiento](/es/channels/pairing)

Grupos:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (predeterminado: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` controla quién puede activar el agente en grupos cuando `allowlist` está configurado.

### Enriquecimiento de nombres de contactos (macOS, opcional)

Los Webhooks de grupo de BlueBubbles a menudo solo incluyen direcciones sin procesar de los participantes. Si quieres que el contexto de `GroupMembers` muestre en su lugar los nombres de contactos locales, puedes activar el enriquecimiento local desde Contactos en macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` habilita la búsqueda. Predeterminado: `false`.
- Las búsquedas solo se ejecutan después de que el acceso al grupo, la autorización de comandos y la restricción por mención hayan permitido el paso del mensaje.
- Solo se enriquecen participantes telefónicos sin nombre.
- Los números de teléfono sin procesar siguen siendo el respaldo cuando no se encuentra una coincidencia local.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Restricción por mención (grupos)

BlueBubbles admite restricción por mención para chats de grupo, en línea con el comportamiento de iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`) para detectar menciones.
- Cuando `requireMention` está habilitado para un grupo, el agente solo responde cuando es mencionado.
- Los comandos de control de remitentes autorizados omiten la restricción por mención.

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

### Restricción de comandos

- Los comandos de control (por ejemplo, `/config`, `/model`) requieren autorización.
- Usa `allowFrom` y `groupAllowFrom` para determinar la autorización de comandos.
- Los remitentes autorizados pueden ejecutar comandos de control incluso sin mencionar en grupos.

### Prompt del sistema por grupo

Cada entrada en `channels.bluebubbles.groups.*` acepta una cadena `systemPrompt` opcional. El valor se inyecta en el prompt del sistema del agente en cada turno que maneja un mensaje en ese grupo, para que puedas establecer reglas de personalidad o comportamiento por grupo sin editar los prompts del agente:

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

La clave coincide con lo que BlueBubbles informa como `chatGuid` / `chatIdentifier` / `chatId` numérico para el grupo, y una entrada comodín `"*"` proporciona un valor predeterminado para cada grupo sin coincidencia exacta (el mismo patrón usado por `requireMention` y las políticas de herramientas por grupo). Las coincidencias exactas siempre tienen prioridad sobre el comodín. Los MD ignoran este campo; usa en su lugar la personalización del prompt a nivel de agente o de cuenta.

#### Ejemplo práctico: respuestas en hilo y reacciones tapback (API privada)

Con la API privada de BlueBubbles habilitada, los mensajes entrantes llegan con IDs de mensaje cortos (por ejemplo, `[[reply_to:5]]`) y el agente puede llamar a `action=reply` para responder en un hilo a un mensaje específico o `action=react` para añadir un tapback. Un `systemPrompt` por grupo es una forma fiable de hacer que el agente elija la herramienta correcta:

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
            "Para acuses breves ('ok', 'entendido', 'en ello'), usa",
            "action=react con un emoji tapback apropiado (❤️, 👍, 😂, ‼️, ❓)",
            "en lugar de enviar una respuesta de texto.",
          ].join(" "),
        },
      },
    },
  },
}
```

Las reacciones tapback y las respuestas en hilo requieren la API privada de BlueBubbles; consulta [Acciones avanzadas](#advanced-actions) e [IDs de mensaje](#message-ids-short-vs-full) para ver la mecánica subyacente.

## Vinculaciones de conversación ACP

Los chats de BlueBubbles pueden convertirse en espacios de trabajo ACP duraderos sin cambiar la capa de transporte.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del MD o chat de grupo permitido.
- Los mensajes futuros en esa misma conversación de BlueBubbles se enrutan a la sesión ACP creada.
- `/new` y `/reset` reinician la misma sesión ACP vinculada en su lugar.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

También se admiten vinculaciones persistentes configuradas mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "bluebubbles"`.

`match.peer.id` puede usar cualquier formato de destino BlueBubbles compatible:

- identificador MD normalizado como `+15555550123` o `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Para vinculaciones estables de grupo, prefiere `chat_id:*` o `chat_identifier:*`.

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

Consulta [Agentes ACP](/es/tools/acp-agents) para ver el comportamiento compartido de las vinculaciones ACP.

## Escritura + acuses de lectura

- **Indicadores de escritura**: se envían automáticamente antes y durante la generación de respuestas.
- **Acuses de lectura**: controlados por `channels.bluebubbles.sendReadReceipts` (predeterminado: `true`).
- **Indicadores de escritura**: OpenClaw envía eventos de inicio de escritura; BlueBubbles borra el estado de escritura automáticamente al enviar o al agotar el tiempo de espera (la detención manual mediante DELETE no es fiable).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // desactiva los acuses de lectura
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
        unsend: true, // deshacer el envío de mensajes (macOS 13+)
        reply: true, // respuestas en hilo por GUID del mensaje
        sendWithEffect: true, // efectos de mensaje (slam, loud, etc.)
        renameGroup: true, // cambiar el nombre de chats de grupo
        setGroupIcon: true, // establecer icono/foto del chat de grupo (inestable en macOS 26 Tahoe)
        addParticipant: true, // añadir participantes a grupos
        removeParticipant: true, // eliminar participantes de grupos
        leaveGroup: true, // salir de chats de grupo
        sendAttachment: true, // enviar adjuntos/multimedia
      },
    },
  },
}
```

Acciones disponibles:

- **react**: Añadir/eliminar reacciones tapback (`messageId`, `emoji`, `remove`). El conjunto nativo de tapbacks de iMessage es `love`, `like`, `dislike`, `laugh`, `emphasize` y `question`. Cuando un agente elige un emoji fuera de ese conjunto (por ejemplo `👀`), la herramienta de reacciones recurre a `love` para que el tapback siga mostrándose en lugar de fallar toda la solicitud. Las reacciones de acuse configuradas siguen validándose de forma estricta y dan error con valores desconocidos.
- **edit**: Editar un mensaje enviado (`messageId`, `text`)
- **unsend**: Deshacer el envío de un mensaje (`messageId`)
- **reply**: Responder a un mensaje específico (`messageId`, `text`, `to`)
- **sendWithEffect**: Enviar con efecto de iMessage (`text`, `to`, `effectId`)
- **renameGroup**: Cambiar el nombre de un chat de grupo (`chatGuid`, `displayName`)
- **setGroupIcon**: Establecer el icono/foto de un chat de grupo (`chatGuid`, `media`) — inestable en macOS 26 Tahoe (la API puede devolver éxito, pero el icono no se sincroniza).
- **addParticipant**: Añadir a alguien a un grupo (`chatGuid`, `address`)
- **removeParticipant**: Eliminar a alguien de un grupo (`chatGuid`, `address`)
- **leaveGroup**: Salir de un chat de grupo (`chatGuid`)
- **upload-file**: Enviar contenido multimedia/archivos (`to`, `buffer`, `filename`, `asVoice`)
  - Notas de voz: establece `asVoice: true` con audio **MP3** o **CAF** para enviar como mensaje de voz de iMessage. BlueBubbles convierte MP3 → CAF al enviar notas de voz.
- Alias heredado: `sendAttachment` sigue funcionando, pero `upload-file` es el nombre canónico de la acción.

### IDs de mensaje (cortos frente a completos)

OpenClaw puede mostrar IDs de mensaje _cortos_ (p. ej., `1`, `2`) para ahorrar tokens.

- `MessageSid` / `ReplyToId` pueden ser IDs cortos.
- `MessageSidFull` / `ReplyToIdFull` contienen los IDs completos del proveedor.
- Los IDs cortos están en memoria; pueden caducar tras un reinicio o una expulsión de caché.
- Las acciones aceptan `messageId` corto o completo, pero los IDs cortos darán error si ya no están disponibles.

Usa IDs completos para automatizaciones y almacenamiento duraderos:

- Plantillas: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` en las cargas útiles entrantes

Consulta [Configuración](/es/gateway/configuration) para las variables de plantilla.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Coalescencia de MD con envío dividido (comando + URL en una sola composición)

Cuando un usuario escribe un comando y una URL juntos en iMessage — por ejemplo, `Dump https://example.com/article` — Apple divide el envío en **dos entregas de Webhook separadas**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa OG como adjuntos.

Los dos Webhooks llegan a OpenClaw con una diferencia aproximada de 0.8-2.0 s en la mayoría de las configuraciones. Sin coalescencia, el agente recibe el comando solo en el turno 1, responde (a menudo "envíame la URL"), y solo ve la URL en el turno 2 — momento en el que el contexto del comando ya se ha perdido.

`channels.bluebubbles.coalesceSameSenderDms` permite que un MD fusione Webhooks consecutivos del mismo remitente en un único turno del agente. Los chats de grupo siguen usando clave por mensaje para preservar la estructura de turnos de varios usuarios.

### Cuándo habilitarlo

Habilítalo cuando:

- Ofrezcas Skills que esperen `comando + carga útil` en un solo mensaje (dump, paste, save, queue, etc.).
- Tus usuarios peguen URLs, imágenes o contenido largo junto con comandos.
- Puedas aceptar la latencia adicional en turnos de MD (consulta abajo).

Déjalo deshabilitado cuando:

- Necesites la latencia mínima de comandos para activadores de MD de una sola palabra.
- Todos tus flujos sean comandos de una sola acción sin cargas útiles posteriores.

### Habilitación

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // activar (predeterminado: false)
    },
  },
}
```

Con esta opción activada y sin `messages.inbound.byChannel.bluebubbles` explícito, la ventana de debounce se amplía a **2500 ms** (el valor predeterminado sin coalescencia es 500 ms). La ventana más amplia es necesaria: la cadencia de envío dividido de Apple, de 0.8-2.0 s, no cabe en el valor predeterminado más ajustado.

Para ajustar la ventana manualmente:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms funciona para la mayoría de las configuraciones; súbelo a 4000 ms si tu Mac es lenta
        // o está bajo presión de memoria (la diferencia observada puede superar los 2 s en ese caso).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Compensaciones

- **Latencia añadida para comandos de control por MD.** Con esta opción activada, los mensajes de comandos de control por MD (como `Dump`, `Save`, etc.) ahora esperan hasta la ventana de debounce antes de enviarse, por si llega un Webhook de carga útil. Los comandos de chats de grupo mantienen el envío inmediato.
- **La salida fusionada está limitada** — el texto fusionado se limita a 4000 caracteres con un marcador explícito `…[truncated]`; los adjuntos se limitan a 20; las entradas de origen se limitan a 10 (se conservan la primera y la más reciente más allá de ese número). Cada `messageId` de origen sigue llegando a la deduplicación de entrada, de modo que una reproducción posterior del MessagePoller de cualquier evento individual se reconozca como duplicado.
- **Activación opcional, por canal.** Los demás canales (Telegram, WhatsApp, Slack, …) no se ven afectados.

### Escenarios y qué ve el agente

| El usuario compone                                                 | Apple entrega             | Opción desactivada (predeterminado)     | Opción activada + ventana de 2500 ms                                     |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `Dump https://example.com` (un solo envío)                         | 2 Webhooks con ~1 s       | Dos turnos del agente: "Dump" solo, luego URL | Un turno: texto fusionado `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (adjunto + texto)                  | 2 Webhooks                | Dos turnos                              | Un turno: texto + imagen                                                  |
| `/status` (comando independiente)                                  | 1 Webhook                 | Envío inmediato                         | **Espera hasta la ventana y luego se envía**                              |
| URL pegada sola                                                    | 1 Webhook                 | Envío inmediato                         | Envío inmediato (solo una entrada en el bucket)                           |
| Texto + URL enviados como dos mensajes separados deliberadamente, con minutos de diferencia | 2 Webhooks fuera de la ventana | Dos turnos                    | Dos turnos (la ventana caduca entre ellos)                                |
| Ráfaga rápida (>10 MD pequeños dentro de la ventana)               | N Webhooks                | N turnos                                | Un turno, salida limitada (primero + más reciente, con límites de texto/adjuntos aplicados) |

### Solución de problemas de coalescencia en envío dividido

Si la opción está activada y los envíos divididos siguen llegando como dos turnos, revisa cada capa:

1. **La configuración realmente está cargada.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Luego `openclaw gateway restart` — la opción se lee al crear el registro de debounce.

2. **La ventana de debounce es lo bastante amplia para tu configuración.** Revisa el registro del servidor BlueBubbles en `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Mide la diferencia entre el envío de texto tipo `"Dump"` y el envío posterior de `"https://..."; Attachments:`. Aumenta `messages.inbound.byChannel.bluebubbles` para cubrir cómodamente esa diferencia.

3. **Las marcas de tiempo de JSONL de sesión ≠ llegada del Webhook.** Las marcas de tiempo de eventos de sesión (`~/.openclaw/agents/<id>/sessions/*.jsonl`) reflejan cuándo el Gateway entrega un mensaje al agente, **no** cuándo llegó el Webhook. Un segundo mensaje en cola etiquetado `[Queued messages while agent was busy]` significa que el primer turno seguía ejecutándose cuando llegó el segundo Webhook — el bucket de coalescencia ya se había vaciado. Ajusta la ventana según el registro del servidor BB, no según el registro de sesión.

4. **La presión de memoria ralentiza el envío de respuestas.** En máquinas más pequeñas (8 GB), los turnos del agente pueden tardar lo suficiente como para que el bucket de coalescencia se vacíe antes de que se complete la respuesta, y la URL llegue como un segundo turno en cola. Comprueba `memory_pressure` y `ps -o rss -p $(pgrep openclaw-gateway)`; si el Gateway supera ~500 MB de RSS y el compresor está activo, cierra otros procesos pesados o pásate a un host más grande.

5. **Los envíos con cita de respuesta siguen una ruta distinta.** Si el usuario pulsó `Dump` como **respuesta** a un globo de URL existente (iMessage muestra una insignia "1 Reply" en la burbuja Dump), la URL está en `replyToBody`, no en un segundo Webhook. La coalescencia no se aplica — es una cuestión de Skill/prompt, no del debounce.

## Streaming por bloques

Controla si las respuestas se envían como un único mensaje o se transmiten por bloques:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // habilita el streaming por bloques (desactivado de forma predeterminada)
    },
  },
}
```

## Multimedia + límites

- Los adjuntos entrantes se descargan y almacenan en la caché multimedia.
- Límite multimedia mediante `channels.bluebubbles.mediaMaxMb` para contenido multimedia entrante y saliente (predeterminado: 8 MB).
- El texto saliente se divide en fragmentos según `channels.bluebubbles.textChunkLimit` (predeterminado: 4000 caracteres).

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.bluebubbles.enabled`: Habilitar/deshabilitar el canal.
- `channels.bluebubbles.serverUrl`: URL base de la API REST de BlueBubbles.
- `channels.bluebubbles.password`: Contraseña de la API.
- `channels.bluebubbles.webhookPath`: Ruta del endpoint del Webhook (predeterminado: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).
- `channels.bluebubbles.allowFrom`: Lista de permitidos para MD (identificadores, correos electrónicos, números E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predeterminado: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Lista de permitidos de remitentes para grupos.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: En macOS, enriquece opcionalmente a los participantes sin nombre de grupos desde Contactos locales después de que pasen las restricciones. Predeterminado: `false`.
- `channels.bluebubbles.groups`: Configuración por grupo (`requireMention`, etc.).
- `channels.bluebubbles.sendReadReceipts`: Enviar acuses de lectura (predeterminado: `true`).
- `channels.bluebubbles.blockStreaming`: Habilitar streaming por bloques (predeterminado: `false`; requerido para respuestas con streaming).
- `channels.bluebubbles.textChunkLimit`: Tamaño de fragmento saliente en caracteres (predeterminado: 4000).
- `channels.bluebubbles.sendTimeoutMs`: Tiempo de espera por solicitud en ms para envíos de texto salientes a través de `/api/v1/message/text` (predeterminado: 30000). Auméntalo en configuraciones de macOS 26 donde los envíos de iMessage mediante API privada pueden quedarse bloqueados durante más de 60 segundos dentro del framework de iMessage; por ejemplo `45000` o `60000`. Las sondas, búsquedas de chats, reacciones, ediciones y comprobaciones de estado actualmente mantienen el valor predeterminado más corto de 10 s; ampliar la cobertura a reacciones y ediciones está previsto como seguimiento. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (predeterminado) solo divide cuando supera `textChunkLimit`; `newline` divide por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.bluebubbles.mediaMaxMb`: Límite de contenido multimedia entrante/saliente en MB (predeterminado: 8).
- `channels.bluebubbles.mediaLocalRoots`: Lista de permitidos explícita de directorios locales absolutos permitidos para rutas locales de contenido multimedia saliente. Los envíos desde rutas locales se deniegan de forma predeterminada a menos que esto esté configurado. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: Fusiona Webhooks consecutivos del mismo remitente en MD en un solo turno del agente para que el envío dividido de Apple de texto+URL llegue como un único mensaje (predeterminado: `false`). Consulta [Coalescencia de MD con envío dividido](#coalescing-split-send-dms-command--url-in-one-composition) para ver escenarios, ajuste de ventana y compensaciones. Amplía la ventana de debounce de entrada predeterminada de 500 ms a 2500 ms cuando se habilita sin un `messages.inbound.byChannel.bluebubbles` explícito.
- `channels.bluebubbles.historyLimit`: Máximo de mensajes de grupo para el contexto (0 desactiva).
- `channels.bluebubbles.dmHistoryLimit`: Límite de historial de MD.
- `channels.bluebubbles.actions`: Habilitar/deshabilitar acciones específicas.
- `channels.bluebubbles.accounts`: Configuración multicuenta.

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Direccionamiento / destinos de entrega

Prefiere `chat_guid` para un enrutamiento estable:

- `chat_guid:iMessage;-;+15555550123` (preferido para grupos)
- `chat_id:123`
- `chat_identifier:...`
- Identificadores directos: `+15555550123`, `user@example.com`
  - Si un identificador directo no tiene un chat MD existente, OpenClaw creará uno mediante `POST /api/v1/chat/new`. Esto requiere que la API privada de BlueBubbles esté habilitada.

### Enrutamiento de iMessage frente a SMS

Cuando el mismo identificador tiene tanto un chat de iMessage como uno de SMS en el Mac (por ejemplo, un número de teléfono registrado en iMessage pero que también ha recibido respuestas de respaldo de burbuja verde), OpenClaw prefiere el chat de iMessage y nunca degrada silenciosamente a SMS. Para forzar el chat de SMS, usa un prefijo de destino explícito `sms:` (por ejemplo `sms:+15555550123`). Los identificadores sin un chat de iMessage coincidente siguen enviándose a través del chat que BlueBubbles informe.

## Seguridad

- Las solicitudes de Webhook se autentican comparando los parámetros de consulta o encabezados `guid`/`password` con `channels.bluebubbles.password`.
- Mantén en secreto la contraseña de la API y el endpoint del Webhook (trátalos como credenciales).
- No hay omisión por localhost para la autenticación del Webhook de BlueBubbles. Si usas proxy para el tráfico del Webhook, mantén la contraseña de BlueBubbles en la solicitud de extremo a extremo. `gateway.trustedProxies` no sustituye a `channels.bluebubbles.password` aquí. Consulta [Seguridad del Gateway](/es/gateway/security#reverse-proxy-configuration).
- Habilita HTTPS + reglas de firewall en el servidor BlueBubbles si lo expones fuera de tu LAN.

## Solución de problemas

- Si los eventos de escritura/lectura dejan de funcionar, revisa los registros del Webhook de BlueBubbles y verifica que la ruta del Gateway coincida con `channels.bluebubbles.webhookPath`.
- Los códigos de emparejamiento caducan tras una hora; usa `openclaw pairing list bluebubbles` y `openclaw pairing approve bluebubbles <code>`.
- Las reacciones requieren la API privada de BlueBubbles (`POST /api/v1/message/react`); asegúrate de que la versión del servidor la exponga.
- Editar/deshacer envío requiere macOS 13+ y una versión compatible del servidor BlueBubbles. En macOS 26 (Tahoe), la edición está actualmente rota debido a cambios en la API privada.
- Las actualizaciones del icono de grupo pueden ser inestables en macOS 26 (Tahoe): la API puede devolver éxito, pero el nuevo icono no se sincroniza.
- OpenClaw oculta automáticamente las acciones conocidas como rotas según la versión de macOS del servidor BlueBubbles. Si la edición sigue apareciendo en macOS 26 (Tahoe), desactívala manualmente con `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` está habilitado pero los envíos divididos (por ejemplo `Dump` + URL) siguen llegando como dos turnos: consulta la lista de comprobación de [solución de problemas de coalescencia en envío dividido](#split-send-coalescing-troubleshooting) — las causas comunes son una ventana de debounce demasiado estrecha, marcas de tiempo del registro de sesión interpretadas erróneamente como llegada del Webhook, o un envío con cita de respuesta (que usa `replyToBody`, no un segundo Webhook).
- Para información de estado/salud: `openclaw status --all` o `openclaw status --deep`.

Para una referencia general del flujo de trabajo de canales, consulta [Canales](/es/channels) y la guía de [Plugins](/es/tools/plugin).

## Relacionado

- [Descripción general de Canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats de grupo y restricción por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
