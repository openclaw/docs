---
read_when:
    - Configuración del canal de BlueBubbles
    - Solución de problemas del emparejamiento de Webhook
    - Configuración de iMessage en macOS
sidebarTitle: BlueBubbles
summary: iMessage mediante el servidor macOS de BlueBubbles (envío/recepción REST, escritura, reacciones, emparejamiento, acciones avanzadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-01T05:30:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

Estado: Plugin incluido que se comunica con el servidor BlueBubbles de macOS por HTTP. **Recomendado para la integración con iMessage** por su API más completa y su configuración más sencilla en comparación con el canal imsg heredado.

<Note>
Las versiones actuales de OpenClaw incluyen BlueBubbles, por lo que las compilaciones empaquetadas normales no necesitan un paso independiente de `openclaw plugins install`.
</Note>

## Información general

- Se ejecuta en macOS mediante la aplicación auxiliar BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/probado: macOS Sequoia (15). macOS Tahoe (26) funciona; la edición actualmente no funciona en Tahoe, y las actualizaciones de iconos de grupo pueden informar éxito pero no sincronizarse.
- OpenClaw se comunica con él a través de su API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Los mensajes entrantes llegan mediante webhooks; las respuestas salientes, los indicadores de escritura, los recibos de lectura y los tapbacks son llamadas REST.
- Los adjuntos y stickers se ingieren como contenido multimedia entrante (y se exponen al agente cuando es posible).
- Las respuestas Auto-TTS que sintetizan audio MP3 o CAF se entregan como burbujas de nota de voz de iMessage en lugar de adjuntos de archivo simples.
- El emparejamiento/lista de permitidos funciona igual que en otros canales (`/channels/pairing`, etc.) con `channels.bluebubbles.allowFrom` + códigos de emparejamiento.
- Las reacciones se exponen como eventos del sistema igual que en Slack/Telegram para que los agentes puedan "mencionarlas" antes de responder.
- Funciones avanzadas: editar, deshacer envío, respuestas en hilo, efectos de mensaje, gestión de grupos.

## Inicio rápido

<Steps>
  <Step title="Instalar BlueBubbles">
    Instala el servidor BlueBubbles en tu Mac (sigue las instrucciones en [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Activar la API web">
    En la configuración de BlueBubbles, activa la API web y establece una contraseña.
  </Step>
  <Step title="Configurar OpenClaw">
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
  <Step title="Dirigir los webhooks al gateway">
    Dirige los webhooks de BlueBubbles a tu Gateway (ejemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Iniciar el gateway">
    Inicia el Gateway; registrará el controlador del Webhook y comenzará el emparejamiento.
  </Step>
</Steps>

<Warning>
**Seguridad**

- Establece siempre una contraseña para el Webhook.
- La autenticación del Webhook siempre es obligatoria. OpenClaw rechaza las solicitudes de Webhook de BlueBubbles a menos que incluyan una contraseña/guid que coincida con `channels.bluebubbles.password` (por ejemplo `?password=<password>` o `x-password`), independientemente de la topología de local loopback/proxy.
- La autenticación por contraseña se comprueba antes de leer/analizar los cuerpos completos del Webhook.

</Warning>

## Mantener Messages.app activa (VM / configuraciones sin monitor)

Algunas VM de macOS / configuraciones siempre activas pueden terminar con Messages.app en estado "inactivo" (los eventos entrantes se detienen hasta que la app se abre o pasa a primer plano). Una solución sencilla es **activar Messages cada 5 minutos** usando un AppleScript + LaunchAgent.

<Steps>
  <Step title="Guardar el AppleScript">
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
  <Step title="Instalar un LaunchAgent">
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

    Esto se ejecuta **cada 300 segundos** y **al iniciar sesión**. La primera ejecución puede activar solicitudes de **Automatización** de macOS (`osascript` → Messages). Apruébalas en la misma sesión de usuario que ejecuta el LaunchAgent.

  </Step>
  <Step title="Cargarlo">
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

<ParamField path="URL del servidor" type="string" required>
  Dirección del servidor BlueBubbles (por ejemplo, `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Contraseña" type="string" required>
  Contraseña de API de la configuración de BlueBubbles Server.
</ParamField>
<ParamField path="Ruta del Webhook" type="string" default="/bluebubbles-webhook">
  Ruta del endpoint de Webhook.
</ParamField>
<ParamField path="Política de DM" type="string">
  `pairing`, `allowlist`, `open` o `disabled`.
</ParamField>
<ParamField path="Lista de permitidos" type="string[]">
  Números de teléfono, correos electrónicos u objetivos de chat.
</ParamField>

También puedes añadir BlueBubbles mediante la CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Control de acceso (DMs + grupos)

<Tabs>
  <Tab title="DMs">
    - Predeterminado: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueban (los códigos caducan después de 1 hora).
    - Aprueba mediante:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - El emparejamiento es el intercambio de tokens predeterminado. Detalles: [Emparejamiento](/es/channels/pairing)

  </Tab>
  <Tab title="Grupos">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (predeterminado: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` controla quién puede activar en grupos cuando `allowlist` está establecido.

  </Tab>
</Tabs>

### Enriquecimiento de nombres de contactos (macOS, opcional)

Los webhooks de grupo de BlueBubbles a menudo solo incluyen direcciones sin procesar de los participantes. Si quieres que el contexto `GroupMembers` muestre nombres de contactos locales en su lugar, puedes activar el enriquecimiento local desde Contactos en macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` activa la búsqueda. Predeterminado: `false`.
- Las búsquedas se ejecutan solo después de que el acceso al grupo, la autorización de comandos y el filtrado por mención hayan permitido el paso del mensaje.
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

### Filtrado por mención (grupos)

BlueBubbles admite filtrado por mención para chats de grupo, igual que el comportamiento de iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`) para detectar menciones.
- Cuando `requireMention` está activado para un grupo, el agente solo responde cuando se le menciona.
- Los comandos de control de remitentes autorizados omiten el filtrado por mención.

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

### Prompt del sistema por grupo

Cada entrada bajo `channels.bluebubbles.groups.*` acepta una cadena opcional `systemPrompt`. El valor se inyecta en el prompt del sistema del agente en cada turno que gestiona un mensaje de ese grupo, para que puedas establecer una personalidad o reglas de comportamiento por grupo sin editar los prompts del agente:

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

La clave coincide con lo que BlueBubbles informe como `chatGuid` / `chatIdentifier` / `chatId` numérico para el grupo, y una entrada comodín `"*"` proporciona un valor predeterminado para cada grupo sin coincidencia exacta (el mismo patrón usado por `requireMention` y las políticas de herramientas por grupo). Las coincidencias exactas siempre tienen prioridad sobre el comodín. Los DMs ignoran este campo; usa la personalización de prompts a nivel de agente o de cuenta en su lugar.

#### Ejemplo práctico: respuestas en hilo y reacciones tapback (API privada)

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

Las reacciones tapback y las respuestas en hilo requieren la API privada de BlueBubbles; consulta [Acciones avanzadas](#advanced-actions) e [IDs de mensaje](#message-ids-short-vs-full) para conocer la mecánica subyacente.

## Enlaces de conversación ACP

Los chats de BlueBubbles pueden convertirse en espacios de trabajo ACP duraderos sin cambiar la capa de transporte.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del DM o chat de grupo permitido.
- Los mensajes futuros en esa misma conversación de BlueBubbles se enrutan a la sesión ACP generada.
- `/new` y `/reset` restablecen la misma sesión ACP enlazada en su lugar.
- `/acp close` cierra la sesión ACP y elimina el enlace.

También se admiten enlaces persistentes configurados mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "bluebubbles"`.

`match.peer.id` puede usar cualquier forma de destino compatible de BlueBubbles:

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

## Escritura + recibos de lectura

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
    - **react**: Agrega/elimina reacciones tapback (`messageId`, `emoji`, `remove`). El conjunto nativo de tapbacks de iMessage es `love`, `like`, `dislike`, `laugh`, `emphasize` y `question`. Cuando un agente elige un emoji fuera de ese conjunto (por ejemplo `👀`), la herramienta de reacción recurre a `love` para que el tapback se muestre igualmente en lugar de fallar toda la solicitud. Las reacciones de confirmación configuradas siguen validándose estrictamente y generan un error con valores desconocidos.
    - **edit**: Edita un mensaje enviado (`messageId`, `text`).
    - **unsend**: Anula el envío de un mensaje (`messageId`).
    - **reply**: Responde a un mensaje específico (`messageId`, `text`, `to`).
    - **sendWithEffect**: Envía con un efecto de iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Cambia el nombre de un chat de grupo (`chatGuid`, `displayName`).
    - **setGroupIcon**: Establece el icono/foto de un chat de grupo (`chatGuid`, `media`) — poco fiable en macOS 26 Tahoe (la API puede devolver éxito, pero el icono no se sincroniza).
    - **addParticipant**: Agrega a alguien a un grupo (`chatGuid`, `address`).
    - **removeParticipant**: Elimina a alguien de un grupo (`chatGuid`, `address`).
    - **leaveGroup**: Sale de un chat de grupo (`chatGuid`).
    - **upload-file**: Envía medios/archivos (`to`, `buffer`, `filename`, `asVoice`).
      - Notas de voz: establece `asVoice: true` con audio **MP3** o **CAF** para enviar como mensaje de voz de iMessage. BlueBubbles convierte MP3 → CAF al enviar notas de voz.
    - Alias heredado: `sendAttachment` todavía funciona, pero `upload-file` es el nombre canónico de la acción.

  </Accordion>
</AccordionGroup>

### ID de mensajes (cortos frente a completos)

OpenClaw puede exponer ID de mensaje _cortos_ (p. ej., `1`, `2`) para ahorrar tokens.

- `MessageSid` / `ReplyToId` pueden ser ID cortos.
- `MessageSidFull` / `ReplyToIdFull` contienen los ID completos del proveedor.
- Los ID cortos están en memoria; pueden caducar al reiniciar o por expulsión de la caché.
- Las acciones aceptan `messageId` corto o completo, pero los ID cortos generarán un error si ya no están disponibles.

Usa ID completos para automatizaciones y almacenamiento duraderos:

- Plantillas: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` en cargas de entrada

Consulta [Configuración](/es/gateway/configuration) para ver las variables de plantilla.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Fusión de DM con envío dividido (comando + URL en una sola composición)

Cuando un usuario escribe un comando y una URL juntos en iMessage — p. ej. `Dump https://example.com/article` — Apple divide el envío en **dos entregas de webhook separadas**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa OG como adjuntos.

Los dos webhooks llegan a OpenClaw con una separación de ~0,8-2,0 s en la mayoría de las configuraciones. Sin fusión, el agente recibe solo el comando en el turno 1, responde (a menudo "envíame la URL") y solo ve la URL en el turno 2 — momento en el que el contexto del comando ya se perdió.

`channels.bluebubbles.coalesceSameSenderDms` hace que un DM combine webhooks consecutivos del mismo remitente en un único turno del agente. Los chats de grupo siguen usando clave por mensaje, de modo que se conserva la estructura de turnos de varios usuarios.

<Tabs>
  <Tab title="Cuándo habilitar">
    Habilita esto cuando:

    - Entregas Skills que esperan `command + payload` en un solo mensaje (dump, paste, save, queue, etc.).
    - Tus usuarios pegan URL, imágenes o contenido largo junto con comandos.
    - Puedes aceptar la latencia adicional en los turnos de DM (consulta abajo).

    Déjalo deshabilitado cuando:

    - Necesitas latencia mínima de comandos para disparadores de DM de una sola palabra.
    - Todos tus flujos son comandos de una sola acción sin seguimientos de carga útil.

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

    Con la opción activada y sin un `messages.inbound.byChannel.bluebubbles` explícito, la ventana de debounce se amplía a **2500 ms** (el valor predeterminado sin fusión es 500 ms). La ventana más amplia es necesaria: la cadencia de envío dividido de Apple de 0,8-2,0 s no cabe en el valor predeterminado más estrecho.

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
  <Tab title="Concesiones">
    - **Latencia adicional para comandos de control de DM.** Con la opción activada, los mensajes de comandos de control de DM (como `Dump`, `Save`, etc.) ahora esperan hasta la ventana de debounce antes de despacharse, por si viene un webhook de carga útil. Los comandos de chats de grupo conservan el despacho instantáneo.
    - **La salida fusionada está acotada** — el texto fusionado se limita a 4000 caracteres con un marcador explícito `…[truncated]`; los adjuntos se limitan a 20; las entradas de origen se limitan a 10 (se conservan la primera y las más recientes más allá de eso). Cada `messageId` de origen sigue llegando a la deduplicación de entrada, de modo que una reproducción posterior de MessagePoller de cualquier evento individual se reconoce como duplicado.
    - **Opt-in, por canal.** Otros canales (Telegram, WhatsApp, Slack, …) no se ven afectados.

  </Tab>
</Tabs>

### Escenarios y lo que ve el agente

| El usuario compone                                                 | Apple entrega             | Opción desactivada (predeterminado)       | Opción activada + ventana de 2500 ms                                    |
| ------------------------------------------------------------------ | ------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (un envío)                              | 2 webhooks separados ~1 s | Dos turnos del agente: solo "Dump", luego URL | Un turno: texto fusionado `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (adjunto + texto)                  | 2 webhooks                | Dos turnos                                 | Un turno: texto + imagen                                                |
| `/status` (comando independiente)                                  | 1 webhook                 | Despacho instantáneo                       | **Espera hasta la ventana y luego despacha**                            |
| URL pegada sola                                                    | 1 webhook                 | Despacho instantáneo                       | Despacho instantáneo (solo una entrada en el depósito)                  |
| Texto + URL enviados como dos mensajes separados deliberados, con minutos de diferencia | 2 webhooks fuera de la ventana | Dos turnos                                 | Dos turnos (la ventana caduca entre ellos)                              |
| Ráfaga rápida (>10 DM pequeños dentro de la ventana)               | N webhooks                | N turnos                                   | Un turno, salida acotada (primero + últimos, con límites de texto/adjuntos aplicados) |

### Solución de problemas de la fusión de envíos divididos

Si la opción está activada y los envíos divididos siguen llegando como dos turnos, revisa cada capa:

<AccordionGroup>
  <Accordion title="Configuración realmente cargada">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Luego `openclaw gateway restart` — la opción se lee al crear el registro del debouncer.

  </Accordion>
  <Accordion title="Ventana de debounce suficientemente amplia para tu configuración">
    Revisa el registro del servidor BlueBubbles en `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Mide la brecha entre el despacho de texto estilo `"Dump"` y el despacho posterior de `"https://..."; Attachments:`. Aumenta `messages.inbound.byChannel.bluebubbles` para cubrir cómodamente esa brecha.

  </Accordion>
  <Accordion title="Marcas de tiempo JSONL de sesión ≠ llegada del webhook">
    Las marcas de tiempo de eventos de sesión (`~/.openclaw/agents/<id>/sessions/*.jsonl`) reflejan cuándo el Gateway entrega un mensaje al agente, **no** cuándo llegó el webhook. Un segundo mensaje en cola etiquetado como `[Queued messages while agent was busy]` significa que el primer turno todavía se estaba ejecutando cuando llegó el segundo webhook — el depósito de fusión ya se había vaciado. Ajusta la ventana con respecto al registro del servidor BB, no al registro de sesión.
  </Accordion>
  <Accordion title="La presión de memoria ralentiza el despacho de respuestas">
    En máquinas más pequeñas (8 GB), los turnos del agente pueden tardar lo suficiente como para que el depósito de fusión se vacíe antes de que la respuesta se complete, y la URL llegue como un segundo turno en cola. Revisa `memory_pressure` y `ps -o rss -p $(pgrep openclaw-gateway)`; si el Gateway supera ~500 MB RSS y el compresor está activo, cierra otros procesos pesados o cambia a un host más grande.
  </Accordion>
  <Accordion title="Los envíos con cita de respuesta son una ruta distinta">
    Si el usuario tocó `Dump` como una **respuesta** a un globo de URL existente (iMessage muestra una insignia "1 Reply" en la burbuja de Dump), la URL vive en `replyToBody`, no en un segundo webhook. La fusión no se aplica — eso es un asunto de skill/prompt, no del debouncer.
  </Accordion>
</AccordionGroup>

## Streaming por bloques

Controla si las respuestas se envían como un único mensaje o se transmiten en bloques:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Medios + límites

- Los adjuntos de entrada se descargan y almacenan en la caché de medios.
- Límite de medios mediante `channels.bluebubbles.mediaMaxMb` para medios de entrada y salida (predeterminado: 8 MB).
- El texto de salida se divide en fragmentos según `channels.bluebubbles.textChunkLimit` (predeterminado: 4000 caracteres).

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

<AccordionGroup>
  <Accordion title="Conexión y webhook">
    - `channels.bluebubbles.enabled`: Habilita/deshabilita el canal.
    - `channels.bluebubbles.serverUrl`: URL base de la API REST de BlueBubbles.
    - `channels.bluebubbles.password`: Contraseña de la API.
    - `channels.bluebubbles.webhookPath`: Ruta del endpoint Webhook (predeterminado: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Política de acceso">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).
    - `channels.bluebubbles.allowFrom`: Lista de permitidos de DM (identificadores, correos electrónicos, números E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predeterminado: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Lista de remitentes permitidos de grupo.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: En macOS, opcionalmente enriquece participantes de grupo sin nombre desde Contactos locales después de pasar las compuertas. Predeterminado: `false`.
    - `channels.bluebubbles.groups`: Configuración por grupo (`requireMention`, etc.).

  </Accordion>
  <Accordion title="Entrega y fragmentación">
    - `channels.bluebubbles.sendReadReceipts`: Enviar confirmaciones de lectura (predeterminado: `true`).
    - `channels.bluebubbles.blockStreaming`: Habilitar streaming en bloque (predeterminado: `false`; requerido para respuestas en streaming).
    - `channels.bluebubbles.textChunkLimit`: Tamaño de fragmento saliente en caracteres (predeterminado: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Tiempo de espera por solicitud en ms para envíos de texto salientes mediante `/api/v1/message/text` (predeterminado: 30000). Auméntalo en configuraciones de macOS 26 donde los envíos de iMessage con Private API pueden quedarse bloqueados durante más de 60 segundos dentro del framework de iMessage; por ejemplo `45000` o `60000`. Las sondas, búsquedas de chats, reacciones, ediciones y comprobaciones de estado mantienen actualmente el valor predeterminado más corto de 10 s; se planea ampliar la cobertura a reacciones y ediciones como seguimiento. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (predeterminado) divide solo cuando se supera `textChunkLimit`; `newline` divide en líneas en blanco (límites de párrafo) antes de fragmentar por longitud.

  </Accordion>
  <Accordion title="Medios e historial">
    - `channels.bluebubbles.mediaMaxMb`: Límite de medios entrantes/salientes en MB (predeterminado: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Lista de permitidos explícita de directorios locales absolutos permitidos para rutas de medios locales salientes. Los envíos de rutas locales se deniegan de forma predeterminada salvo que esto esté configurado. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Fusiona Webhooks de DM consecutivos del mismo remitente en un turno de agente para que el envío dividido texto+URL de Apple llegue como un solo mensaje (predeterminado: `false`). Consulta [Fusionar DM de envío dividido](#coalescing-split-send-dms-command--url-in-one-composition) para ver escenarios, ajuste de ventana y compensaciones. Amplía la ventana predeterminada de antirrebote entrante de 500 ms a 2500 ms cuando se habilita sin un `messages.inbound.byChannel.bluebubbles` explícito.
    - `channels.bluebubbles.historyLimit`: Máximo de mensajes de grupo para contexto (0 deshabilita).
    - `channels.bluebubbles.dmHistoryLimit`: Límite del historial de DM.
    - `channels.bluebubbles.replyContextApiFallback`: Cuando una respuesta entrante llega sin `replyToBody`/`replyToSender` y la caché en memoria de contexto de respuesta no acierta, recupera el mensaje original desde la API HTTP de BlueBubbles como respaldo de mejor esfuerzo (predeterminado: `false`). Útil para despliegues de varias instancias que comparten una cuenta de BlueBubbles, tras reinicios de proceso o después de la expulsión de una caché TTL/LRU de larga duración. La obtención está protegida contra SSRF por la misma política que cualquier otra solicitud de cliente de BlueBubbles, nunca lanza errores y rellena la caché para amortizar respuestas posteriores. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Un ajuste a nivel de canal se propaga a las cuentas que omiten la marca.

  </Accordion>
  <Accordion title="Acciones y cuentas">
    - `channels.bluebubbles.actions`: Habilita/deshabilita acciones específicas.
    - `channels.bluebubbles.accounts`: Configuración multicuenta.

  </Accordion>
</AccordionGroup>

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Direccionamiento / destinos de entrega

Prefiere `chat_guid` para un enrutamiento estable:

- `chat_guid:iMessage;-;+15555550123` (preferido para grupos)
- `chat_id:123`
- `chat_identifier:...`
- Identificadores directos: `+15555550123`, `user@example.com`
  - Si un identificador directo no tiene un chat de DM existente, OpenClaw creará uno mediante `POST /api/v1/chat/new`. Esto requiere que la Private API de BlueBubbles esté habilitada.

### Enrutamiento de iMessage frente a SMS

Cuando el mismo identificador tiene tanto un chat de iMessage como uno de SMS en el Mac (por ejemplo, un número de teléfono registrado en iMessage pero que también ha recibido alternativas de burbuja verde), OpenClaw prefiere el chat de iMessage y nunca cambia silenciosamente a SMS. Para forzar el chat de SMS, usa un prefijo de destino `sms:` explícito (por ejemplo `sms:+15555550123`). Los identificadores sin un chat de iMessage coincidente se siguen enviando mediante el chat que informe BlueBubbles.

## Seguridad

- Las solicitudes de Webhook se autentican comparando los parámetros de consulta o encabezados `guid`/`password` con `channels.bluebubbles.password`.
- Mantén en secreto la contraseña de la API y el endpoint de Webhook (trátalos como credenciales).
- No hay omisión por localhost para la autenticación de Webhook de BlueBubbles. Si proxias tráfico de Webhook, conserva la contraseña de BlueBubbles en la solicitud de extremo a extremo. `gateway.trustedProxies` no reemplaza aquí a `channels.bluebubbles.password`. Consulta [Seguridad del Gateway](/es/gateway/security#reverse-proxy-configuration).
- Habilita HTTPS y reglas de firewall en el servidor de BlueBubbles si lo expones fuera de tu LAN.

## Solución de problemas

- Si los eventos de escritura/lectura dejan de funcionar, revisa los registros de Webhook de BlueBubbles y verifica que la ruta del gateway coincida con `channels.bluebubbles.webhookPath`.
- Los códigos de emparejamiento caducan después de una hora; usa `openclaw pairing list bluebubbles` y `openclaw pairing approve bluebubbles <code>`.
- Las reacciones requieren la API privada de BlueBubbles (`POST /api/v1/message/react`); asegúrate de que la versión del servidor la exponga.
- Editar/anular envío requiere macOS 13+ y una versión compatible del servidor de BlueBubbles. En macOS 26 (Tahoe), la edición está rota actualmente debido a cambios en la API privada.
- Las actualizaciones de icono de grupo pueden ser poco fiables en macOS 26 (Tahoe): la API puede devolver éxito, pero el icono nuevo no se sincroniza.
- OpenClaw oculta automáticamente acciones que se sabe que están rotas según la versión de macOS del servidor de BlueBubbles. Si la edición aún aparece en macOS 26 (Tahoe), deshabilítala manualmente con `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` está habilitado pero los envíos divididos (p. ej., `Dump` + URL) siguen llegando como dos turnos: consulta la lista de comprobación de [solución de problemas de fusión de envíos divididos](#split-send-coalescing-troubleshooting); las causas comunes son una ventana de antirrebote demasiado ajustada, marcas de tiempo del registro de sesión interpretadas erróneamente como llegada de Webhook, o un envío con cita de respuesta (que usa `replyToBody`, no un segundo Webhook).
- Para información de estado/salud: `openclaw status --all` u `openclaw status --deep`.

Para referencia general del flujo de trabajo de canales, consulta [Canales](/es/channels) y la guía de [Plugins](/es/tools/plugin).

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control por menciones
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
