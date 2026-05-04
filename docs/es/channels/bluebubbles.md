---
read_when:
    - Configurar el canal de BlueBubbles
    - Solución de problemas del emparejamiento de Webhook
    - Configurar iMessage en macOS
sidebarTitle: BlueBubbles
summary: iMessage a través del servidor macOS de BlueBubbles (envío/recepción REST, escritura, reacciones, emparejamiento, acciones avanzadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-04T02:21:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78a054da0c7c32b161997acd05914896259dd1a050e736a4c9e438a452ab6a51
    source_path: channels/bluebubbles.md
    workflow: 16
---

Estado: Plugin incluido que se comunica con el servidor macOS de BlueBubbles por HTTP. **Recomendado para la integración con iMessage** por su API más completa y configuración más sencilla en comparación con el canal imsg heredado.

<Note>
Las versiones actuales de OpenClaw incluyen BlueBubbles, por lo que las compilaciones empaquetadas normales no necesitan un paso separado de `openclaw plugins install`.
</Note>

## Descripción general

- Se ejecuta en macOS mediante la aplicación auxiliar BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/probado: macOS Sequoia (15). macOS Tahoe (26) funciona; la edición actualmente está rota en Tahoe, y las actualizaciones de iconos de grupo pueden informar éxito pero no sincronizarse.
- OpenClaw se comunica con él a través de su API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Los mensajes entrantes llegan mediante webhooks; las respuestas salientes, los indicadores de escritura, las confirmaciones de lectura y los tapbacks son llamadas REST.
- Los adjuntos y stickers se incorporan como medios entrantes (y se exponen al agente cuando es posible).
- Las respuestas Auto-TTS que sintetizan audio MP3 o CAF se entregan como burbujas de notas de voz de iMessage en lugar de adjuntos de archivo simples.
- El emparejamiento/lista de permitidos funciona igual que en otros canales (`/channels/pairing`, etc.) con `channels.bluebubbles.allowFrom` + códigos de emparejamiento.
- Las reacciones se exponen como eventos del sistema, igual que en Slack/Telegram, para que los agentes puedan "mencionarlas" antes de responder.
- Funciones avanzadas: editar, deshacer envío, hilos de respuesta, efectos de mensaje, gestión de grupos.

## Inicio rápido

<Steps>
  <Step title="Instalar BlueBubbles">
    Instala el servidor BlueBubbles en tu Mac (sigue las instrucciones en [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Habilitar la API web">
    En la configuración de BlueBubbles, habilita la API web y establece una contraseña.
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
  <Step title="Apuntar los webhooks al Gateway">
    Apunta los webhooks de BlueBubbles a tu Gateway (ejemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Iniciar el Gateway">
    Inicia el Gateway; registrará el controlador del Webhook e iniciará el emparejamiento.
  </Step>
</Steps>

<Warning>
**Seguridad**

- Establece siempre una contraseña de Webhook.
- La autenticación de Webhook siempre es obligatoria. OpenClaw rechaza las solicitudes de Webhook de BlueBubbles a menos que incluyan una contraseña/guid que coincida con `channels.bluebubbles.password` (por ejemplo `?password=<password>` o `x-password`), independientemente de la topología de local loopback/proxy.
- La autenticación por contraseña se comprueba antes de leer/analizar los cuerpos completos de Webhook.

</Warning>

## Mantener Messages.app activa (VM / configuraciones headless)

Algunas VM de macOS / configuraciones siempre activas pueden hacer que Messages.app quede "inactiva" (los eventos entrantes se detienen hasta que se abre o trae al frente la aplicación). Una solución sencilla es **dar un toque a Messages cada 5 minutos** usando un AppleScript + LaunchAgent.

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
  Contraseña de API desde la configuración de BlueBubbles Server.
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

También puedes añadir BlueBubbles mediante CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Control de acceso (DMs + grupos)

<Tabs>
  <Tab title="DMs">
    - Predeterminado: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueban (los códigos caducan después de 1 hora).
    - Aprobar mediante:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - El emparejamiento es el intercambio de tokens predeterminado. Detalles: [Emparejamiento](/es/channels/pairing)

  </Tab>
  <Tab title="Grupos">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (predeterminado: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` controla quién puede activar en grupos cuando `allowlist` está configurado.

  </Tab>
</Tabs>

### Enriquecimiento de nombres de contactos (macOS, opcional)

Los webhooks de grupos de BlueBubbles a menudo solo incluyen direcciones sin procesar de participantes. Si quieres que el contexto `GroupMembers` muestre nombres de contactos locales en su lugar, puedes optar por el enriquecimiento local de Contactos en macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` habilita la búsqueda. Predeterminado: `false`.
- Las búsquedas se ejecutan solo después de que el acceso de grupo, la autorización de comandos y el filtro de menciones hayan permitido el paso del mensaje.
- Solo se enriquecen los participantes telefónicos sin nombre.
- Los números de teléfono sin procesar permanecen como alternativa cuando no se encuentra una coincidencia local.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Filtro de menciones (grupos)

BlueBubbles admite filtro de menciones para chats grupales, alineado con el comportamiento de iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`) para detectar menciones.
- Cuando `requireMention` está habilitado para un grupo, el agente solo responde cuando se le menciona.
- Los comandos de control de remitentes autorizados omiten el filtro de menciones.

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

### Filtro de comandos

- Los comandos de control (por ejemplo, `/config`, `/model`) requieren autorización.
- Usa `allowFrom` y `groupAllowFrom` para determinar la autorización de comandos.
- Los remitentes autorizados pueden ejecutar comandos de control incluso sin mencionar en grupos.

### Prompt del sistema por grupo

Cada entrada bajo `channels.bluebubbles.groups.*` acepta una cadena opcional `systemPrompt`. El valor se inyecta en el prompt del sistema del agente en cada turno que maneja un mensaje en ese grupo, por lo que puedes establecer reglas de personalidad o comportamiento por grupo sin editar los prompts del agente:

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

La clave coincide con lo que BlueBubbles informe como `chatGuid` / `chatIdentifier` / `chatId` numérico para el grupo, y una entrada comodín `"*"` proporciona un valor predeterminado para cada grupo sin una coincidencia exacta (el mismo patrón que usan `requireMention` y las políticas de herramientas por grupo). Las coincidencias exactas siempre prevalecen sobre el comodín. Los DMs ignoran este campo; usa en su lugar la personalización de prompt a nivel de agente o de cuenta.

#### Ejemplo práctico: respuestas en hilo y reacciones tapback (API privada)

Con la API privada de BlueBubbles habilitada, los mensajes entrantes llegan con IDs de mensaje cortos (por ejemplo `[[reply_to:5]]`) y el agente puede llamar a `action=reply` para responder en hilo a un mensaje específico o a `action=react` para dejar un tapback. Un `systemPrompt` por grupo es una forma fiable de hacer que el agente elija la herramienta correcta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

Tanto las reacciones tapback como las respuestas en hilo requieren la API privada de BlueBubbles; consulta [Acciones avanzadas](#advanced-actions) e [IDs de mensaje](#message-ids-short-vs-full) para la mecánica subyacente.

## Vinculaciones de conversaciones ACP

Los chats de BlueBubbles pueden convertirse en espacios de trabajo ACP duraderos sin cambiar la capa de transporte.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del DM o chat grupal permitido.
- Los mensajes futuros en esa misma conversación de BlueBubbles se enrutan a la sesión ACP creada.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en su lugar.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

También se admiten vinculaciones persistentes configuradas mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "bluebubbles"`.

`match.peer.id` puede usar cualquier forma de destino admitida por BlueBubbles:

- identificador de DM normalizado como `+15555550123` o `user@example.com`
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

Consulta [Agentes ACP](/es/tools/acp-agents) para el comportamiento compartido de vinculaciones ACP.

## Escritura + confirmaciones de lectura

- **Indicadores de escritura**: Se envían automáticamente antes y durante la generación de la respuesta.
- **Confirmaciones de lectura**: Controladas por `channels.bluebubbles.sendReadReceipts` (predeterminado: `true`).
- **Indicadores de escritura**: OpenClaw envía eventos de inicio de escritura; BlueBubbles borra la escritura automáticamente al enviar o al agotarse el tiempo de espera (la detención manual mediante DELETE no es fiable).

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
    - **react**: Agrega o elimina reacciones tapback (`messageId`, `emoji`, `remove`). El conjunto de tapbacks nativo de iMessage es `love`, `like`, `dislike`, `laugh`, `emphasize` y `question`. Cuando un agente elige un emoji fuera de ese conjunto (por ejemplo `👀`), la herramienta de reacción recurre a `love` para que el tapback se siga mostrando en lugar de hacer fallar toda la solicitud. Las reacciones de confirmación configuradas se siguen validando estrictamente y producen error con valores desconocidos.
    - **edit**: Edita un mensaje enviado (`messageId`, `text`).
    - **unsend**: Cancela el envío de un mensaje (`messageId`).
    - **reply**: Responde a un mensaje específico (`messageId`, `text`, `to`).
    - **sendWithEffect**: Envía con efecto de iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Cambia el nombre de un chat de grupo (`chatGuid`, `displayName`).
    - **setGroupIcon**: Establece el icono o la foto de un chat de grupo (`chatGuid`, `media`): inestable en macOS 26 Tahoe (la API puede devolver éxito, pero el icono no se sincroniza).
    - **addParticipant**: Agrega a alguien a un grupo (`chatGuid`, `address`).
    - **removeParticipant**: Elimina a alguien de un grupo (`chatGuid`, `address`).
    - **leaveGroup**: Sale de un chat de grupo (`chatGuid`).
    - **upload-file**: Envía contenido multimedia o archivos (`to`, `buffer`, `filename`, `asVoice`).
      - Notas de voz: establece `asVoice: true` con audio **MP3** o **CAF** para enviar como mensaje de voz de iMessage. BlueBubbles convierte MP3 → CAF al enviar notas de voz.
    - Alias heredado: `sendAttachment` sigue funcionando, pero `upload-file` es el nombre de acción canónico.

  </Accordion>
</AccordionGroup>

### ID de mensajes (cortos frente a completos)

OpenClaw puede mostrar ID de mensajes _cortos_ (por ejemplo, `1`, `2`) para ahorrar tokens.

- `MessageSid` / `ReplyToId` pueden ser ID cortos.
- `MessageSidFull` / `ReplyToIdFull` contienen los ID completos del proveedor.
- Los ID cortos están en memoria; pueden vencer al reiniciar o al desalojarse la caché.
- Las acciones aceptan `messageId` cortos o completos, pero los ID cortos producirán error si ya no están disponibles.

Usa ID completos para automatizaciones y almacenamiento duraderos:

- Plantillas: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` en cargas entrantes

Consulta [Configuración](/es/gateway/configuration) para conocer las variables de plantilla.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Coalescencia de MD de envío dividido (comando + URL en una composición)

Cuando un usuario escribe un comando y una URL juntos en iMessage, por ejemplo `Dump https://example.com/article`, Apple divide el envío en **dos entregas de webhook separadas**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa OG como adjuntos.

Los dos webhooks llegan a OpenClaw con una separación de ~0,8-2,0 s en la mayoría de las configuraciones. Sin coalescencia, el agente recibe solo el comando en el turno 1, responde (a menudo "envíame la URL") y solo ve la URL en el turno 2, momento en el que el contexto del comando ya se perdió.

`channels.bluebubbles.coalesceSameSenderDms` opta por fusionar webhooks consecutivos del mismo remitente en un MD en un único turno del agente. Los chats de grupo siguen identificándose por mensaje para preservar la estructura de turnos multiusuario.

<Tabs>
  <Tab title="Cuándo habilitar">
    Habilita esto cuando:

    - Publicas Skills que esperan `command + payload` en un solo mensaje (volcar, pegar, guardar, poner en cola, etc.).
    - Tus usuarios pegan URL, imágenes o contenido largo junto con comandos.
    - Puedes aceptar la latencia añadida al turno de MD (consulta abajo).

    Déjalo deshabilitado cuando:

    - Necesitas latencia mínima de comandos para activadores de MD de una sola palabra.
    - Todos tus flujos son comandos de una sola ejecución sin seguimientos de carga.

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

    Con la marca activada y sin `messages.inbound.byChannel.bluebubbles` explícito, la ventana de antirrebote se amplía a **2500 ms** (el valor predeterminado sin coalescencia es 500 ms). La ventana más amplia es necesaria: la cadencia de envío dividido de Apple de 0,8-2,0 s no cabe en el valor predeterminado más estrecho.

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
  <Tab title="Compensaciones">
    - **Latencia añadida para comandos de control de MD.** Con la marca activada, los mensajes de comandos de control de MD (como `Dump`, `Save`, etc.) ahora esperan hasta la ventana de antirrebote antes de enviarse, por si viene un webhook de carga. Los comandos de chat de grupo mantienen el envío instantáneo.
    - **La salida fusionada está acotada**: el texto fusionado tiene un límite de 4000 caracteres con un marcador explícito `…[truncated]`; los adjuntos tienen un límite de 20; las entradas de origen tienen un límite de 10 (se conservan la primera y la más reciente más allá de eso). Cada `messageId` de origen sigue llegando a la deduplicación entrante, por lo que una reproducción posterior de MessagePoller de cualquier evento individual se reconoce como duplicado.
    - **Opt-in, por canal.** Los demás canales (Telegram, WhatsApp, Slack, …) no se ven afectados.

  </Tab>
</Tabs>

### Escenarios y lo que ve el agente

| El usuario compone                                                 | Apple entrega             | Marca desactivada (predeterminado)       | Marca activada + ventana de 2500 ms                                      |
| ------------------------------------------------------------------ | ------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (un envío)                              | 2 webhooks con ~1 s de separación | Dos turnos del agente: "Dump" solo, luego URL | Un turno: texto fusionado `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (adjunto + texto)                  | 2 webhooks                | Dos turnos                              | Un turno: texto + imagen                                                |
| `/status` (comando independiente)                                  | 1 webhook                 | Envío instantáneo                       | **Espera hasta la ventana y luego envía**                               |
| URL pegada sola                                                    | 1 webhook                 | Envío instantáneo                       | Envío instantáneo (solo una entrada en el cubo)                         |
| Texto + URL enviados como dos mensajes separados deliberados, con minutos de separación | 2 webhooks fuera de la ventana | Dos turnos                              | Dos turnos (la ventana vence entre ellos)                               |
| Inundación rápida (>10 MD pequeños dentro de la ventana)           | N webhooks                | N turnos                                | Un turno, salida acotada (primero + más reciente, límites de texto/adjuntos aplicados) |

### Solución de problemas de coalescencia de envío dividido

Si la marca está activada y los envíos divididos siguen llegando como dos turnos, revisa cada capa:

<AccordionGroup>
  <Accordion title="Configuración realmente cargada">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Luego `openclaw gateway restart`: la marca se lee al crear el registro de antirrebote.

  </Accordion>
  <Accordion title="Ventana de antirrebote lo bastante amplia para tu configuración">
    Mira el registro del servidor BlueBubbles en `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Mide la separación entre el envío de texto estilo `"Dump"` y el envío posterior de `"https://..."; Attachments:`. Sube `messages.inbound.byChannel.bluebubbles` para cubrir cómodamente esa separación.

  </Accordion>
  <Accordion title="Marcas de tiempo JSONL de sesión ≠ llegada del webhook">
    Las marcas de tiempo de eventos de sesión (`~/.openclaw/agents/<id>/sessions/*.jsonl`) reflejan cuándo el Gateway entrega un mensaje al agente, **no** cuándo llegó el webhook. Un segundo mensaje en cola etiquetado como `[Queued messages while agent was busy]` significa que el primer turno aún se estaba ejecutando cuando llegó el segundo webhook: el cubo de coalescencia ya se había vaciado. Ajusta la ventana contra el registro del servidor BB, no contra el registro de sesión.
  </Accordion>
  <Accordion title="Presión de memoria que ralentiza el envío de respuestas">
    En máquinas más pequeñas (8 GB), los turnos del agente pueden tardar lo suficiente como para que el cubo de coalescencia se vacíe antes de que termine la respuesta, y la URL llegue como un segundo turno en cola. Revisa `memory_pressure` y `ps -o rss -p $(pgrep openclaw-gateway)`; si el Gateway supera ~500 MB de RSS y el compresor está activo, cierra otros procesos pesados o cambia a un host más grande.
  </Accordion>
  <Accordion title="Los envíos con cita de respuesta son una ruta distinta">
    Si el usuario tocó `Dump` como **respuesta** a un globo de URL existente (iMessage muestra una insignia "1 Reply" en el globo de Dump), la URL vive en `replyToBody`, no en un segundo webhook. La coalescencia no se aplica: eso es una cuestión de Skill/prompt, no del antirrebote.
  </Accordion>
</AccordionGroup>

## Streaming en bloques

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

## Multimedia + límites

- Los adjuntos entrantes se descargan y se almacenan en la caché multimedia.
- Límite multimedia mediante `channels.bluebubbles.mediaMaxMb` para multimedia entrante y saliente (predeterminado: 8 MB).
- El texto saliente se fragmenta según `channels.bluebubbles.textChunkLimit` (predeterminado: 4000 caracteres).

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

<AccordionGroup>
  <Accordion title="Conexión y webhook">
    - `channels.bluebubbles.enabled`: Habilita o deshabilita el canal.
    - `channels.bluebubbles.serverUrl`: URL base de la API REST de BlueBubbles.
    - `channels.bluebubbles.password`: Contraseña de la API.
    - `channels.bluebubbles.webhookPath`: Ruta del endpoint de webhook (predeterminado: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Política de acceso">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).
    - `channels.bluebubbles.allowFrom`: Lista de permitidos de MD (identificadores, correos electrónicos, números E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predeterminado: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Lista de permitidos de remitentes de grupo.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: En macOS, enriquece opcionalmente los participantes de grupo sin nombre desde Contactos locales después de superar las comprobaciones de acceso. Predeterminado: `false`.
    - `channels.bluebubbles.groups`: Configuración por grupo (`requireMention`, etc.).

  </Accordion>
  <Accordion title="Delivery and chunking">
    - `channels.bluebubbles.sendReadReceipts`: Enviar confirmaciones de lectura (predeterminado: `true`).
    - `channels.bluebubbles.blockStreaming`: Habilitar la transmisión en bloques (predeterminado: `false`; requerido para respuestas en streaming).
    - `channels.bluebubbles.textChunkLimit`: Tamaño de fragmento saliente en caracteres (predeterminado: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Tiempo de espera por solicitud en ms para envíos de texto saliente mediante `/api/v1/message/text` (predeterminado: 30000). Auméntalo en configuraciones de macOS 26 donde los envíos de iMessage con Private API pueden quedarse detenidos durante más de 60 segundos dentro del framework de iMessage; por ejemplo `45000` o `60000`. Las sondas, búsquedas de chat, reacciones, ediciones y comprobaciones de estado actualmente mantienen el valor predeterminado más corto de 10 s; se planea ampliar la cobertura a reacciones y ediciones en un seguimiento. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (predeterminado) divide solo cuando se supera `textChunkLimit`; `newline` divide en líneas en blanco (límites de párrafo) antes de fragmentar por longitud.

  </Accordion>
  <Accordion title="Media and history">
    - `channels.bluebubbles.mediaMaxMb`: Límite de medios entrantes/salientes en MB (predeterminado: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Lista de permitidos explícita de directorios locales absolutos permitidos para rutas de medios locales salientes. Los envíos de rutas locales se deniegan de forma predeterminada salvo que esto esté configurado. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Fusiona Webhooks de mensajes directos consecutivos del mismo remitente en un solo turno del agente para que el envío dividido de texto+URL de Apple llegue como un único mensaje (predeterminado: `false`). Consulta [Fusionar mensajes directos de envío dividido](#coalescing-split-send-dms-command--url-in-one-composition) para ver escenarios, ajuste de ventana y compensaciones. Amplía la ventana de debounce entrante predeterminada de 500 ms a 2500 ms cuando se habilita sin un `messages.inbound.byChannel.bluebubbles` explícito.
    - `channels.bluebubbles.historyLimit`: Máximo de mensajes de grupo para contexto (0 deshabilita).
    - `channels.bluebubbles.dmHistoryLimit`: Límite de historial de mensajes directos.
    - `channels.bluebubbles.replyContextApiFallback`: Cuando llega una respuesta entrante sin `replyToBody`/`replyToSender` y la caché en memoria de contexto de respuesta falla, obtiene el mensaje original desde la API HTTP de BlueBubbles como respaldo de mejor esfuerzo (predeterminado: `false`). Útil para despliegues de varias instancias que comparten una cuenta de BlueBubbles, después de reinicios de proceso o después de la expulsión de una caché TTL/LRU de larga duración. La obtención está protegida contra SSRF por la misma política que cualquier otra solicitud de cliente de BlueBubbles, nunca lanza errores y rellena la caché para que las respuestas posteriores se amorticen. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Una configuración a nivel de canal se propaga a las cuentas que omiten la marca.

  </Accordion>
  <Accordion title="Actions and accounts">
    - `channels.bluebubbles.actions`: Habilita/deshabilita acciones específicas.
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
  - Si un identificador directo no tiene un chat de mensaje directo existente, OpenClaw creará uno mediante `POST /api/v1/chat/new`. Esto requiere que la Private API de BlueBubbles esté habilitada.

### Enrutamiento de iMessage frente a SMS

Cuando el mismo identificador tiene tanto un chat de iMessage como uno de SMS en el Mac (por ejemplo, un número de teléfono registrado en iMessage que también ha recibido alternativas de burbuja verde), OpenClaw prefiere el chat de iMessage y nunca cambia silenciosamente a SMS. Para forzar el chat SMS, usa un prefijo de destino `sms:` explícito (por ejemplo `sms:+15555550123`). Los identificadores sin un chat de iMessage coincidente siguen enviándose mediante cualquier chat que BlueBubbles informe.

## Seguridad

- Las solicitudes de Webhook se autentican comparando los parámetros de consulta o encabezados `guid`/`password` con `channels.bluebubbles.password`.
- Mantén en secreto la contraseña de la API y el endpoint de Webhook (trátalos como credenciales).
- No hay omisión de localhost para la autenticación de Webhook de BlueBubbles. Si proxyas tráfico de Webhook, conserva la contraseña de BlueBubbles en la solicitud de extremo a extremo. `gateway.trustedProxies` no reemplaza a `channels.bluebubbles.password` aquí. Consulta [Seguridad del Gateway](/es/gateway/security#reverse-proxy-configuration).
- Habilita HTTPS + reglas de firewall en el servidor de BlueBubbles si lo expones fuera de tu LAN.

## Solución de problemas

- Si los eventos de escritura/lectura dejan de funcionar, revisa los registros de Webhook de BlueBubbles y verifica que la ruta del gateway coincida con `channels.bluebubbles.webhookPath`.
- Los códigos de emparejamiento caducan después de una hora; usa `openclaw pairing list bluebubbles` y `openclaw pairing approve bluebubbles <code>`.
- Las reacciones requieren la API privada de BlueBubbles (`POST /api/v1/message/react`); asegúrate de que la versión del servidor la exponga.
- Editar/deshacer envío requiere macOS 13+ y una versión compatible del servidor de BlueBubbles. En macOS 26 (Tahoe), editar está actualmente roto debido a cambios en la API privada.
- Las actualizaciones del icono de grupo pueden ser inestables en macOS 26 (Tahoe): la API puede devolver éxito, pero el icono nuevo no se sincroniza.
- OpenClaw oculta automáticamente las acciones que se sabe que están rotas según la versión de macOS del servidor de BlueBubbles. Si editar sigue apareciendo en macOS 26 (Tahoe), deshabilítalo manualmente con `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` habilitado pero los envíos divididos (p. ej., `Dump` + URL) siguen llegando como dos turnos: consulta la lista de comprobación de [solución de problemas de fusión de envíos divididos](#split-send-coalescing-troubleshooting); las causas comunes son una ventana de debounce demasiado ajustada, marcas de tiempo del registro de sesión interpretadas erróneamente como llegada del Webhook o un envío con cita de respuesta (que usa `replyToBody`, no un segundo Webhook).
- Para información de estado/salud: `openclaw status --all` o `openclaw status --deep`.

Para referencia general del flujo de trabajo de canales, consulta [Canales](/es/channels) y la guía de [Plugins](/es/tools/plugin).

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control por menciones
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
