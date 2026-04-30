---
read_when:
    - Configurar el canal de BlueBubbles
    - Solución de problemas del emparejamiento de Webhook
    - Configuración de iMessage en macOS
sidebarTitle: BlueBubbles
summary: iMessage mediante el servidor macOS de BlueBubbles (envío/recepción por REST, indicadores de escritura, reacciones, emparejamiento, acciones avanzadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-30T05:27:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a77b248ed86eb4114f8b7f1fc6bd4cea004d65095a0439a4a8c814bc180082c
    source_path: channels/bluebubbles.md
    workflow: 16
---

Estado: Plugin incluido que se comunica con el servidor BlueBubbles de macOS a través de HTTP. **Recomendado para la integración con iMessage** por su API más completa y una configuración más sencilla en comparación con el canal imsg heredado.

<Note>
Las versiones actuales de OpenClaw incluyen BlueBubbles, por lo que las compilaciones empaquetadas normales no necesitan un paso separado de `openclaw plugins install`.
</Note>

## Descripción general

- Se ejecuta en macOS mediante la app auxiliar de BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/probado: macOS Sequoia (15). macOS Tahoe (26) funciona; la edición está rota actualmente en Tahoe, y las actualizaciones de iconos de grupo pueden informar éxito pero no sincronizarse.
- OpenClaw se comunica con él a través de su API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Los mensajes entrantes llegan mediante webhooks; las respuestas salientes, los indicadores de escritura, las confirmaciones de lectura y los tapbacks son llamadas REST.
- Los archivos adjuntos y stickers se ingieren como medios entrantes (y se exponen al agente cuando es posible).
- Las respuestas automáticas de TTS que sintetizan audio MP3 o CAF se entregan como burbujas de nota de voz de iMessage en lugar de archivos adjuntos normales.
- El emparejamiento/la lista de permitidos funciona igual que en otros canales (`/channels/pairing`, etc.) con `channels.bluebubbles.allowFrom` + códigos de emparejamiento.
- Las reacciones se exponen como eventos del sistema igual que en Slack/Telegram para que los agentes puedan "mencionarlas" antes de responder.
- Funciones avanzadas: edición, deshacer envío, hilos de respuesta, efectos de mensaje, gestión de grupos.

## Inicio rápido

<Steps>
  <Step title="Install BlueBubbles">
    Instala el servidor BlueBubbles en tu Mac (sigue las instrucciones en [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Enable the web API">
    En la configuración de BlueBubbles, activa la API web y establece una contraseña.
  </Step>
  <Step title="Configure OpenClaw">
    Ejecuta `openclaw onboard` y selecciona BlueBubbles, o configúralo manualmente:

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

  </Step>
  <Step title="Point webhooks at the gateway">
    Apunta los webhooks de BlueBubbles a tu gateway (ejemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    Inicia el gateway; registrará el controlador de webhook y comenzará el emparejamiento.
  </Step>
</Steps>

<Warning>
**Seguridad**

- Establece siempre una contraseña para el webhook.
- La autenticación del webhook siempre es obligatoria. OpenClaw rechaza las solicitudes de webhook de BlueBubbles salvo que incluyan una contraseña/guid que coincida con `channels.bluebubbles.password` (por ejemplo `?password=<password>` o `x-password`), independientemente de la topología de loopback/proxy.
- La autenticación por contraseña se comprueba antes de leer/analizar los cuerpos completos de webhook.

</Warning>

## Mantener Messages.app activa (configuraciones de VM / sin interfaz)

Algunas configuraciones de VM de macOS / siempre activas pueden terminar con Messages.app en estado "idle" (los eventos entrantes se detienen hasta que la app se abre o pasa al primer plano). Una solución sencilla es **dar un toque a Messages cada 5 minutos** usando un AppleScript + LaunchAgent.

<Steps>
  <Step title="Save the AppleScript">
    Guarda esto como `~/Scripts/poke-messages.scpt`:

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

  </Step>
  <Step title="Install a LaunchAgent">
    Guarda esto como `~/Library/LaunchAgents/com.user.poke-messages.plist`:

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

    Esto se ejecuta **cada 300 segundos** y **al iniciar sesión**. La primera ejecución puede activar avisos de **Automatización** de macOS (`osascript` → Messages). Apruébalos en la misma sesión de usuario que ejecuta el LaunchAgent.

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Incorporación

BlueBubbles está disponible en la incorporación interactiva:

```
openclaw onboard
```

El asistente solicita:

<ParamField path="Server URL" type="string" required>
  Dirección del servidor BlueBubbles (por ejemplo, `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  Contraseña de API de la configuración de BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Ruta del endpoint de webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` o `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Números de teléfono, correos electrónicos o destinos de chat.
</ParamField>

También puedes agregar BlueBubbles mediante la CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Control de acceso (DM + grupos)

<Tabs>
  <Tab title="DMs">
    - Predeterminado: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueban (los códigos caducan después de 1 hora).
    - Aprueba mediante:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - El emparejamiento es el intercambio de tokens predeterminado. Detalles: [Emparejamiento](/es/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (predeterminado: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` controla quién puede activar en grupos cuando `allowlist` está configurado.

  </Tab>
</Tabs>

### Enriquecimiento de nombres de contacto (macOS, opcional)

Los webhooks de grupo de BlueBubbles suelen incluir solo direcciones sin procesar de los participantes. Si quieres que el contexto `GroupMembers` muestre nombres de contactos locales en su lugar, puedes activar el enriquecimiento local de Contactos en macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` activa la búsqueda. Predeterminado: `false`.
- Las búsquedas se ejecutan solo después de que el acceso de grupo, la autorización de comandos y el filtrado por menciones hayan permitido que pase el mensaje.
- Solo se enriquecen los participantes telefónicos sin nombre.
- Los números de teléfono sin procesar siguen siendo la alternativa cuando no se encuentra ninguna coincidencia local.

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

BlueBubbles admite filtrado por menciones para chats de grupo, coincidiendo con el comportamiento de iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`) para detectar menciones.
- Cuando `requireMention` está activado para un grupo, el agente solo responde cuando se le menciona.
- Los comandos de control de remitentes autorizados omiten el filtrado por menciones.

Configuración por grupo:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### Filtrado de comandos

- Los comandos de control (por ejemplo, `/config`, `/model`) requieren autorización.
- Usa `allowFrom` y `groupAllowFrom` para determinar la autorización de comandos.
- Los remitentes autorizados pueden ejecutar comandos de control incluso sin mencionar en grupos.

### Prompt de sistema por grupo

Cada entrada bajo `channels.bluebubbles.groups.*` acepta una cadena `systemPrompt` opcional. El valor se inyecta en el prompt de sistema del agente en cada turno que gestiona un mensaje en ese grupo, para que puedas establecer una personalidad o reglas de comportamiento por grupo sin editar los prompts del agente:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

La clave coincide con lo que BlueBubbles informe como `chatGuid` / `chatIdentifier` / `chatId` numérico para el grupo, y una entrada comodín `"*"` proporciona un valor predeterminado para cada grupo sin coincidencia exacta (el mismo patrón usado por `requireMention` y las políticas de herramientas por grupo). Las coincidencias exactas siempre prevalecen sobre el comodín. Los DM ignoran este campo; usa en su lugar personalización de prompts a nivel de agente o de cuenta.

#### Ejemplo trabajado: respuestas en hilo y reacciones tapback (API privada)

Con la API privada de BlueBubbles activada, los mensajes entrantes llegan con IDs de mensaje cortos (por ejemplo `[[reply_to:5]]`) y el agente puede llamar a `action=reply` para responder en hilo a un mensaje específico o a `action=react` para dejar un tapback. Un `systemPrompt` por grupo es una forma fiable de mantener al agente eligiendo la herramienta correcta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tanto las reacciones tapback como las respuestas en hilo requieren la API privada de BlueBubbles; consulta [Acciones avanzadas](#advanced-actions) e [IDs de mensaje](#message-ids-short-vs-full) para ver los mecanismos subyacentes.

## Enlaces de conversación ACP

Los chats de BlueBubbles pueden convertirse en espacios de trabajo ACP duraderos sin cambiar la capa de transporte.

Flujo rápido para operador:

- Ejecuta `/acp spawn codex --bind here` dentro del DM o chat de grupo permitido.
- Los mensajes futuros en esa misma conversación de BlueBubbles se enrutan a la sesión ACP creada.
- `/new` y `/reset` restablecen la misma sesión ACP enlazada en el lugar.
- `/acp close` cierra la sesión ACP y elimina el enlace.

También se admiten enlaces persistentes configurados mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "bluebubbles"`.

`match.peer.id` puede usar cualquier forma de destino de BlueBubbles admitida:

- identificador de DM normalizado como `+15555550123` o `user@example.com`
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

Consulta [Agentes ACP](/es/tools/acp-agents) para el comportamiento compartido de enlaces ACP.

## Escritura + confirmaciones de lectura

- **Indicadores de escritura**: Se envían automáticamente antes y durante la generación de respuestas.
- **Confirmaciones de lectura**: Controladas por `channels.bluebubbles.sendReadReceipts` (predeterminado: `true`).
- **Indicadores de escritura**: OpenClaw envía eventos de inicio de escritura; BlueBubbles borra la escritura automáticamente al enviar o por tiempo de espera (la detención manual mediante DELETE no es fiable).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## Acciones avanzadas

BlueBubbles admite acciones avanzadas de mensajes cuando están habilitadas en la configuración:

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

<AccordionGroup>
  <Accordion title="Acciones disponibles">
    - **react**: Agrega o elimina reacciones tapback (`messageId`, `emoji`, `remove`). El conjunto nativo de tapbacks de iMessage es `love`, `like`, `dislike`, `laugh`, `emphasize` y `question`. Cuando un agente elige un emoji fuera de ese conjunto (por ejemplo `👀`), la herramienta de reacción recurre a `love` para que el tapback se siga renderizando en lugar de hacer fallar toda la solicitud. Las reacciones de confirmación configuradas siguen validándose estrictamente y generan error con valores desconocidos.
    - **edit**: Edita un mensaje enviado (`messageId`, `text`).
    - **unsend**: Cancela el envío de un mensaje (`messageId`).
    - **reply**: Responde a un mensaje específico (`messageId`, `text`, `to`).
    - **sendWithEffect**: Envía con efecto de iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Cambia el nombre de un chat grupal (`chatGuid`, `displayName`).
    - **setGroupIcon**: Establece el icono/foto de un chat grupal (`chatGuid`, `media`) — inestable en macOS 26 Tahoe (la API puede devolver éxito, pero el icono no se sincroniza).
    - **addParticipant**: Agrega a alguien a un grupo (`chatGuid`, `address`).
    - **removeParticipant**: Elimina a alguien de un grupo (`chatGuid`, `address`).
    - **leaveGroup**: Abandona un chat grupal (`chatGuid`).
    - **upload-file**: Envía archivos multimedia/archivos (`to`, `buffer`, `filename`, `asVoice`).
      - Notas de voz: define `asVoice: true` con audio **MP3** o **CAF** para enviar como mensaje de voz de iMessage. BlueBubbles convierte MP3 → CAF al enviar notas de voz.
    - Alias heredado: `sendAttachment` sigue funcionando, pero `upload-file` es el nombre canónico de la acción.

  </Accordion>
</AccordionGroup>

### ID de mensajes (cortos frente a completos)

OpenClaw puede mostrar ID de mensaje _cortos_ (p. ej., `1`, `2`) para ahorrar tokens.

- `MessageSid` / `ReplyToId` pueden ser ID cortos.
- `MessageSidFull` / `ReplyToIdFull` contienen los ID completos del proveedor.
- Los ID cortos están en memoria; pueden expirar al reiniciar o al desalojarse de la caché.
- Las acciones aceptan `messageId` cortos o completos, pero los ID cortos generarán error si ya no están disponibles.

Usa ID completos para automatizaciones y almacenamiento duraderos:

- Plantillas: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` en cargas útiles entrantes

Consulta [Configuración](/es/gateway/configuration) para las variables de plantilla.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Fusión de MD de envío dividido (comando + URL en una sola composición)

Cuando un usuario escribe un comando y una URL juntos en iMessage — p. ej. `Dump https://example.com/article` — Apple divide el envío en **dos entregas de Webhook separadas**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa OG como adjuntos.

Los dos Webhooks llegan a OpenClaw con ~0,8-2,0 s de diferencia en la mayoría de las configuraciones. Sin fusión, el agente recibe solo el comando en el turno 1, responde (a menudo "envíame la URL") y solo ve la URL en el turno 2 — momento en el que el contexto del comando ya se perdió.

`channels.bluebubbles.coalesceSameSenderDms` hace que un MD fusione Webhooks consecutivos del mismo remitente en un único turno del agente. Los chats grupales siguen usando claves por mensaje para preservar la estructura de turnos multiusuario.

<Tabs>
  <Tab title="Cuándo habilitar">
    Habilítalo cuando:

    - Distribuyas Skills que esperan `command + payload` en un solo mensaje (volcar, pegar, guardar, encolar, etc.).
    - Tus usuarios peguen URL, imágenes o contenido largo junto a comandos.
    - Puedas aceptar la latencia añadida en turnos de MD (ver abajo).

    Déjalo deshabilitado cuando:

    - Necesites latencia mínima de comandos para disparadores de MD de una sola palabra.
    - Todos tus flujos sean comandos de una sola ejecución sin seguimientos con carga útil.

  </Tab>
  <Tab title="Habilitación">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Con la marca activada y sin `messages.inbound.byChannel.bluebubbles` explícito, la ventana de debounce se amplía a **2500 ms** (el valor predeterminado sin fusión es 500 ms). La ventana más amplia es necesaria — la cadencia de envío dividido de Apple de 0,8-2,0 s no cabe en el valor predeterminado más estrecho.

    Para ajustar la ventana tú mismo:

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

  </Tab>
  <Tab title="Compromisos">
    - **Latencia añadida para comandos de control por MD.** Con la marca activada, los mensajes de comandos de control por MD (como `Dump`, `Save`, etc.) ahora esperan hasta la ventana de debounce antes de despacharse, por si llega un Webhook con carga útil. Los comandos de chats grupales mantienen el despacho instantáneo.
    - **La salida fusionada está acotada** — el texto fusionado tiene un límite de 4000 caracteres con un marcador explícito `…[truncated]`; los adjuntos tienen un límite de 20; las entradas de origen tienen un límite de 10 (se conservan la primera y las más recientes más allá de eso). Cada `messageId` de origen sigue llegando a la deduplicación entrante para que una reproducción posterior de MessagePoller de cualquier evento individual se reconozca como duplicado.
    - **Opt-in, por canal.** Otros canales (Telegram, WhatsApp, Slack, …) no se ven afectados.

  </Tab>
</Tabs>

### Escenarios y lo que ve el agente

| El usuario compone                                                | Apple entrega             | Marca desactivada (predeterminado)        | Marca activada + ventana de 2500 ms                                      |
| ------------------------------------------------------------------ | ------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (un envío)                              | 2 Webhooks con ~1 s entre sí | Dos turnos del agente: solo "Dump", luego URL | Un turno: texto fusionado `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (adjunto + texto)                  | 2 Webhooks                | Dos turnos                                | Un turno: texto + imagen                                                |
| `/status` (comando independiente)                                 | 1 Webhook                 | Despacho instantáneo                      | **Espera hasta la ventana y luego despacha**                            |
| URL pegada sola                                                    | 1 Webhook                 | Despacho instantáneo                      | Despacho instantáneo (solo una entrada en el bucket)                    |
| Texto + URL enviados como dos mensajes separados deliberados, con minutos de diferencia | 2 Webhooks fuera de la ventana | Dos turnos                                | Dos turnos (la ventana expira entre ellos)                              |
| Ráfaga rápida (>10 MD pequeños dentro de la ventana)               | N Webhooks                | N turnos                                  | Un turno, salida acotada (primero + más recientes, límites de texto/adjuntos aplicados) |

### Solución de problemas de fusión de envíos divididos

Si la marca está activada y los envíos divididos siguen llegando como dos turnos, revisa cada capa:

<AccordionGroup>
  <Accordion title="La configuración se cargó realmente">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Luego `openclaw gateway restart` — la marca se lee al crear el registro de debouncers.

  </Accordion>
  <Accordion title="Ventana de debounce suficientemente amplia para tu configuración">
    Mira el registro del servidor de BlueBubbles en `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Mide la separación entre el despacho de texto estilo `"Dump"` y el despacho siguiente de `"https://..."; Attachments:`. Aumenta `messages.inbound.byChannel.bluebubbles` para cubrir cómodamente esa separación.

  </Accordion>
  <Accordion title="Marcas de tiempo JSONL de sesión ≠ llegada del Webhook">
    Las marcas de tiempo de eventos de sesión (`~/.openclaw/agents/<id>/sessions/*.jsonl`) reflejan cuándo el Gateway entrega un mensaje al agente, **no** cuándo llegó el Webhook. Un segundo mensaje en cola etiquetado como `[Queued messages while agent was busy]` significa que el primer turno seguía ejecutándose cuando llegó el segundo Webhook — el bucket de fusión ya se había vaciado. Ajusta la ventana según el registro del servidor BB, no según el registro de sesión.
  </Accordion>
  <Accordion title="Presión de memoria que ralentiza el despacho de respuestas">
    En máquinas más pequeñas (8 GB), los turnos del agente pueden tardar lo suficiente como para que el bucket de fusión se vacíe antes de que la respuesta se complete, y la URL entre como segundo turno en cola. Revisa `memory_pressure` y `ps -o rss -p $(pgrep openclaw-gateway)`; si el Gateway supera ~500 MB de RSS y el compresor está activo, cierra otros procesos pesados o cambia a un host más grande.
  </Accordion>
  <Accordion title="Los envíos con cita de respuesta siguen una ruta diferente">
    Si el usuario tocó `Dump` como **respuesta** a un globo de URL existente (iMessage muestra una insignia "1 Reply" en el globo de Dump), la URL vive en `replyToBody`, no en un segundo Webhook. La fusión no se aplica — eso es una preocupación de skill/prompt, no del debouncer.
  </Accordion>
</AccordionGroup>

## Streaming por bloques

Controla si las respuestas se envían como un solo mensaje o se transmiten en bloques:

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

- Los adjuntos entrantes se descargan y almacenan en la caché multimedia.
- Límite multimedia mediante `channels.bluebubbles.mediaMaxMb` para multimedia entrante y saliente (predeterminado: 8 MB).
- El texto saliente se divide en fragmentos según `channels.bluebubbles.textChunkLimit` (predeterminado: 4000 caracteres).

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

<AccordionGroup>
  <Accordion title="Conexión y Webhook">
    - `channels.bluebubbles.enabled`: Habilita/deshabilita el canal.
    - `channels.bluebubbles.serverUrl`: URL base de la API REST de BlueBubbles.
    - `channels.bluebubbles.password`: Contraseña de la API.
    - `channels.bluebubbles.webhookPath`: Ruta del endpoint de Webhook (predeterminado: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Política de acceso">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).
    - `channels.bluebubbles.allowFrom`: Lista de permitidos de MD (identificadores, correos electrónicos, números E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predeterminado: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Lista de permitidos de remitentes de grupo.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: En macOS, opcionalmente enriquece participantes de grupo sin nombre desde Contactos locales después de superar el control de acceso. Predeterminado: `false`.
    - `channels.bluebubbles.groups`: Configuración por grupo (`requireMention`, etc.).

  </Accordion>
  <Accordion title="Entrega y fragmentación">
    - `channels.bluebubbles.sendReadReceipts`: Enviar confirmaciones de lectura (predeterminado: `true`).
    - `channels.bluebubbles.blockStreaming`: Habilitar transmisión por bloques (predeterminado: `false`; requerido para respuestas en streaming).
    - `channels.bluebubbles.textChunkLimit`: Tamaño del fragmento saliente en caracteres (predeterminado: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Tiempo de espera por solicitud en ms para envíos de texto saliente mediante `/api/v1/message/text` (predeterminado: 30000). Auméntalo en configuraciones de macOS 26 donde los envíos de iMessage con Private API pueden quedarse detenidos durante más de 60 segundos dentro del framework de iMessage; por ejemplo `45000` o `60000`. Las sondas, búsquedas de chat, reacciones, ediciones y comprobaciones de estado mantienen actualmente el valor predeterminado más corto de 10 s; ampliar la cobertura a reacciones y ediciones está previsto como seguimiento. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (predeterminado) divide solo cuando se supera `textChunkLimit`; `newline` divide en líneas en blanco (límites de párrafo) antes de la fragmentación por longitud.

  </Accordion>
  <Accordion title="Medios e historial">
    - `channels.bluebubbles.mediaMaxMb`: Límite de medios entrantes/salientes en MB (predeterminado: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Lista de permitidos explícita de directorios locales absolutos permitidos para rutas de medios locales salientes. Los envíos de rutas locales se deniegan de forma predeterminada salvo que esto esté configurado. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Fusiona webhooks de DM consecutivos del mismo remitente en un solo turno del agente para que el envío dividido texto+URL de Apple llegue como un único mensaje (predeterminado: `false`). Consulta [Fusionar DM de envío dividido](#coalescing-split-send-dms-command--url-in-one-composition) para ver escenarios, ajuste de ventana y compensaciones. Amplía la ventana predeterminada de debounce de entrada de 500 ms a 2500 ms cuando se habilita sin un `messages.inbound.byChannel.bluebubbles` explícito.
    - `channels.bluebubbles.historyLimit`: Máximo de mensajes de grupo para contexto (0 deshabilita).
    - `channels.bluebubbles.dmHistoryLimit`: Límite del historial de DM.

  </Accordion>
  <Accordion title="Acciones y cuentas">
    - `channels.bluebubbles.actions`: Habilitar/deshabilitar acciones específicas.
    - `channels.bluebubbles.accounts`: Configuración de varias cuentas.

  </Accordion>
</AccordionGroup>

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Direccionamiento / destinos de entrega

Prefiere `chat_guid` para enrutamiento estable:

- `chat_guid:iMessage;-;+15555550123` (preferido para grupos)
- `chat_id:123`
- `chat_identifier:...`
- Identificadores directos: `+15555550123`, `user@example.com`
  - Si un identificador directo no tiene un chat de DM existente, OpenClaw creará uno mediante `POST /api/v1/chat/new`. Esto requiere que la Private API de BlueBubbles esté habilitada.

### Enrutamiento iMessage frente a SMS

Cuando el mismo identificador tiene tanto un chat de iMessage como uno de SMS en el Mac (por ejemplo, un número de teléfono registrado en iMessage pero que también ha recibido alternativas de burbuja verde), OpenClaw prefiere el chat de iMessage y nunca degrada silenciosamente a SMS. Para forzar el chat de SMS, usa un prefijo de destino `sms:` explícito (por ejemplo `sms:+15555550123`). Los identificadores sin un chat de iMessage coincidente siguen enviándose a través del chat que informe BlueBubbles.

## Seguridad

- Las solicitudes de Webhook se autentican comparando los parámetros de consulta o encabezados `guid`/`password` con `channels.bluebubbles.password`.
- Mantén en secreto la contraseña de la API y el endpoint de Webhook (trátalos como credenciales).
- No hay omisión de localhost para la autenticación de Webhook de BlueBubbles. Si usas un proxy para el tráfico de Webhook, conserva la contraseña de BlueBubbles en la solicitud de extremo a extremo. `gateway.trustedProxies` no sustituye a `channels.bluebubbles.password` aquí. Consulta [Seguridad del Gateway](/es/gateway/security#reverse-proxy-configuration).
- Habilita HTTPS y reglas de firewall en el servidor de BlueBubbles si lo expones fuera de tu LAN.

## Solución de problemas

- Si los eventos de escritura/lectura dejan de funcionar, revisa los registros de Webhook de BlueBubbles y verifica que la ruta del Gateway coincida con `channels.bluebubbles.webhookPath`.
- Los códigos de emparejamiento caducan después de una hora; usa `openclaw pairing list bluebubbles` y `openclaw pairing approve bluebubbles <code>`.
- Las reacciones requieren la API privada de BlueBubbles (`POST /api/v1/message/react`); asegúrate de que la versión del servidor la exponga.
- Editar/anular envío requiere macOS 13+ y una versión compatible del servidor BlueBubbles. En macOS 26 (Tahoe), la edición está actualmente rota debido a cambios en la API privada.
- Las actualizaciones del icono de grupo pueden ser inestables en macOS 26 (Tahoe): la API puede devolver éxito, pero el nuevo icono no se sincroniza.
- OpenClaw oculta automáticamente las acciones que se sabe que están rotas según la versión de macOS del servidor BlueBubbles. Si la edición sigue apareciendo en macOS 26 (Tahoe), deshabilítala manualmente con `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` habilitado, pero los envíos divididos (p. ej. `Dump` + URL) aún llegan como dos turnos: consulta la lista de comprobación de [solución de problemas de fusión de envíos divididos](#split-send-coalescing-troubleshooting); las causas comunes son una ventana de debounce demasiado estrecha, marcas de tiempo del registro de sesión interpretadas erróneamente como llegada del Webhook o un envío con cita de respuesta (que usa `replyToBody`, no un segundo Webhook).
- Para información de estado/salud: `openclaw status --all` u `openclaw status --deep`.

Para una referencia general del flujo de trabajo de canales, consulta [Canales](/es/channels) y la guía de [Plugins](/es/tools/plugin).

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Grupos](/es/channels/groups) — comportamiento de chat de grupo y control de menciones
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
