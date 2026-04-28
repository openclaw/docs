---
read_when:
    - Configurar el canal de BlueBubbles
    - Solucionar problemas del emparejamiento de Webhook
    - Configurar iMessage en macOS
sidebarTitle: BlueBubbles
summary: iMessage mediante el servidor macOS BlueBubbles (envío/recepción REST, escritura, reacciones, emparejamiento, acciones avanzadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T11:23:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

Estado: Plugin incluido que se comunica con el servidor macOS BlueBubbles a través de HTTP. **Recomendado para la integración con iMessage** debido a su API más completa y a una configuración más sencilla en comparación con el canal heredado imsg.

<Note>
Las versiones actuales de OpenClaw incluyen BlueBubbles, por lo que las compilaciones empaquetadas normales no necesitan un paso separado de `openclaw plugins install`.
</Note>

## Descripción general

- Se ejecuta en macOS mediante la aplicación auxiliar BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/probado: macOS Sequoia (15). macOS Tahoe (26) funciona; actualmente la edición está rota en Tahoe, y las actualizaciones del icono del grupo pueden informar éxito pero no sincronizarse.
- OpenClaw se comunica con él a través de su API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Los mensajes entrantes llegan mediante Webhooks; las respuestas salientes, los indicadores de escritura, las confirmaciones de lectura y los tapbacks son llamadas REST.
- Los archivos adjuntos y stickers se incorporan como contenido multimedia entrante (y se muestran al agente cuando es posible).
- Las respuestas automáticas de TTS que sintetizan audio MP3 o CAF se entregan como burbujas de nota de voz de iMessage en lugar de archivos adjuntos simples.
- El emparejamiento/la allowlist funciona igual que en otros canales (`/channels/pairing`, etc.) con `channels.bluebubbles.allowFrom` + códigos de emparejamiento.
- Las reacciones se muestran como eventos del sistema, igual que en Slack/Telegram, para que los agentes puedan "mencionarlas" antes de responder.
- Funciones avanzadas: editar, anular envío, responder en hilos, efectos de mensaje, administración de grupos.

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
  <Step title="Apuntar los Webhooks al Gateway">
    Apunta los Webhooks de BlueBubbles a tu Gateway (ejemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Iniciar el Gateway">
    Inicia el Gateway; registrará el controlador de Webhook e iniciará el emparejamiento.
  </Step>
</Steps>

<Warning>
**Seguridad**

- Establece siempre una contraseña para el Webhook.
- La autenticación del Webhook siempre es obligatoria. OpenClaw rechaza las solicitudes de Webhook de BlueBubbles a menos que incluyan una contraseña/guid que coincida con `channels.bluebubbles.password` (por ejemplo `?password=<password>` o `x-password`), independientemente de la topología de loopback/proxy.
- La autenticación por contraseña se verifica antes de leer/analizar los cuerpos completos del Webhook.

</Warning>

## Mantener Messages.app activa (configuraciones de VM / sin interfaz)

Algunas configuraciones de VM de macOS / siempre activas pueden hacer que Messages.app quede "inactiva" (los eventos entrantes se detienen hasta que se abre o pasa a primer plano). Una solución simple es **tocar Messages cada 5 minutos** usando un AppleScript + LaunchAgent.

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

    Esto se ejecuta **cada 300 segundos** y **al iniciar sesión**. La primera ejecución puede activar avisos de **Automatización** de macOS (`osascript` → Messages). Apruébalos en la misma sesión de usuario que ejecuta el LaunchAgent.

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

<ParamField path="Server URL" type="string" required>
  Dirección del servidor BlueBubbles (p. ej., `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  Contraseña de la API desde la configuración de BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Ruta del endpoint del Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` o `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Números de teléfono, correos electrónicos o destinos de chat.
</ParamField>

También puedes añadir BlueBubbles mediante la CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Control de acceso (DM y grupos)

<Tabs>
  <Tab title="DMs">
    - Predeterminado: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueban (los códigos caducan después de 1 hora).
    - Aprobar mediante:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - El emparejamiento es el intercambio de tokens predeterminado. Detalles: [Emparejamiento](/es/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (predeterminado: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` controla quién puede activar en grupos cuando `allowlist` está establecido.

  </Tab>
</Tabs>

### Enriquecimiento de nombres de contacto (macOS, opcional)

Los Webhooks de grupo de BlueBubbles a menudo solo incluyen direcciones sin procesar de los participantes. Si quieres que el contexto `GroupMembers` muestre en su lugar nombres de contactos locales, puedes optar por el enriquecimiento local de Contactos en macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` habilita la búsqueda. Predeterminado: `false`.
- Las búsquedas se ejecutan solo después de que el acceso al grupo, la autorización de comandos y la restricción por menciones hayan permitido el paso del mensaje.
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

### Restricción por menciones (grupos)

BlueBubbles admite la restricción por menciones para chats de grupo, en línea con el comportamiento de iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`) para detectar menciones.
- Cuando `requireMention` está habilitado para un grupo, el agente solo responde cuando se le menciona.
- Los comandos de control de remitentes autorizados omiten la restricción por menciones.

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

- Los comandos de control (p. ej., `/config`, `/model`) requieren autorización.
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

La clave coincide con lo que BlueBubbles informe como `chatGuid` / `chatIdentifier` / `chatId` numérico para el grupo, y una entrada comodín `"*"` proporciona un valor predeterminado para cada grupo sin una coincidencia exacta (el mismo patrón usado por `requireMention` y las políticas de herramientas por grupo). Las coincidencias exactas siempre prevalecen sobre el comodín. Los DM ignoran este campo; usa en su lugar personalización de prompts a nivel de agente o cuenta.

#### Ejemplo práctico: respuestas en hilo y reacciones tapback (Private API)

Con la Private API de BlueBubbles habilitada, los mensajes entrantes llegan con IDs de mensaje cortos (por ejemplo `[[reply_to:5]]`) y el agente puede llamar a `action=reply` para responder en un mensaje específico o a `action=react` para dejar un tapback. Un `systemPrompt` por grupo es una forma fiable de hacer que el agente elija la herramienta correcta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Al responder en este grupo, llama siempre a action=reply con el",
            "messageId [[reply_to:N]] del contexto para que tu respuesta quede en hilo",
            "debajo del mensaje que la desencadenó. Nunca envíes un mensaje nuevo sin vincular.",
            "",
            "Para acuses breves ('ok', 'entendido', 'me encargo'), usa",
            "action=react con un emoji tapback apropiado (❤️, 👍, 😂, ‼️, ❓)",
            "en lugar de enviar una respuesta de texto.",
          ].join(" "),
        },
      },
    },
  },
}
```

Las reacciones tapback y las respuestas en hilo requieren ambas la Private API de BlueBubbles; consulta [Acciones avanzadas](#advanced-actions) e [IDs de mensaje](#message-ids-short-vs-full) para conocer la mecánica subyacente.

## Vinculaciones de conversaciones ACP

Los chats de BlueBubbles pueden convertirse en espacios de trabajo ACP duraderos sin cambiar la capa de transporte.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del DM o chat de grupo permitido.
- Los mensajes futuros en esa misma conversación de BlueBubbles se enrutan a la sesión ACP generada.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en su lugar.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

Las vinculaciones persistentes configuradas también son compatibles mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "bluebubbles"`.

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

Consulta [Agentes ACP](/es/tools/acp-agents) para el comportamiento compartido de las vinculaciones ACP.

## Escritura + confirmaciones de lectura

- **Indicadores de escritura**: se envían automáticamente antes y durante la generación de la respuesta.
- **Confirmaciones de lectura**: controladas por `channels.bluebubbles.sendReadReceipts` (predeterminado: `true`).
- **Indicadores de escritura**: OpenClaw envía eventos de inicio de escritura; BlueBubbles limpia automáticamente el estado de escritura al enviar o al agotar el tiempo de espera (la detención manual mediante DELETE no es fiable).

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
        reactions: true, // tapbacks (predeterminado: true)
        edit: true, // editar mensajes enviados (macOS 13+, roto en macOS 26 Tahoe)
        unsend: true, // anular el envío de mensajes (macOS 13+)
        reply: true, // responder en hilo por GUID del mensaje
        sendWithEffect: true, // efectos de mensaje (slam, loud, etc.)
        renameGroup: true, // cambiar el nombre de chats grupales
        setGroupIcon: true, // establecer icono/foto del chat grupal (inestable en macOS 26 Tahoe)
        addParticipant: true, // añadir participantes a grupos
        removeParticipant: true, // eliminar participantes de grupos
        leaveGroup: true, // salir de chats grupales
        sendAttachment: true, // enviar archivos adjuntos/multimedia
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Acciones disponibles">
    - **react**: añadir/quitar reacciones tapback (`messageId`, `emoji`, `remove`). El conjunto nativo de tapbacks de iMessage es `love`, `like`, `dislike`, `laugh`, `emphasize` y `question`. Cuando un agente elige un emoji fuera de ese conjunto (por ejemplo `👀`), la herramienta de reacciones recurre a `love` para que el tapback siga mostrándose en lugar de que falle toda la solicitud. Las reacciones de acuse configuradas siguen validándose estrictamente y producen error con valores desconocidos.
    - **edit**: editar un mensaje enviado (`messageId`, `text`).
    - **unsend**: anular el envío de un mensaje (`messageId`).
    - **reply**: responder a un mensaje específico (`messageId`, `text`, `to`).
    - **sendWithEffect**: enviar con efecto de iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: cambiar el nombre de un chat grupal (`chatGuid`, `displayName`).
    - **setGroupIcon**: establecer el icono/foto de un chat grupal (`chatGuid`, `media`) — inestable en macOS 26 Tahoe (la API puede devolver éxito, pero el icono no se sincroniza).
    - **addParticipant**: añadir a alguien a un grupo (`chatGuid`, `address`).
    - **removeParticipant**: eliminar a alguien de un grupo (`chatGuid`, `address`).
    - **leaveGroup**: salir de un chat grupal (`chatGuid`).
    - **upload-file**: enviar multimedia/archivos (`to`, `buffer`, `filename`, `asVoice`).
      - Notas de voz: establece `asVoice: true` con audio **MP3** o **CAF** para enviar como mensaje de voz de iMessage. BlueBubbles convierte MP3 → CAF al enviar notas de voz.
    - Alias heredado: `sendAttachment` sigue funcionando, pero `upload-file` es el nombre canónico de la acción.

  </Accordion>
</AccordionGroup>

### IDs de mensaje (cortos frente a completos)

OpenClaw puede mostrar IDs de mensaje _cortos_ (p. ej., `1`, `2`) para ahorrar tokens.

- `MessageSid` / `ReplyToId` pueden ser IDs cortos.
- `MessageSidFull` / `ReplyToIdFull` contienen los IDs completos del proveedor.
- Los IDs cortos están en memoria; pueden caducar al reiniciar o al vaciar la caché.
- Las acciones aceptan `messageId` corto o completo, pero los IDs cortos producirán error si ya no están disponibles.

Usa IDs completos para automatizaciones y almacenamiento duraderos:

- Plantillas: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` en las cargas entrantes

Consulta [Configuración](/es/gateway/configuration) para las variables de plantilla.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Coalescencia de DM con envío dividido (comando + URL en una sola composición)

Cuando un usuario escribe un comando y una URL juntos en iMessage — por ejemplo `Dump https://example.com/article` — Apple divide el envío en **dos entregas de Webhook separadas**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa OG como archivos adjuntos.

Los dos Webhooks llegan a OpenClaw con una diferencia de ~0,8-2,0 s en la mayoría de configuraciones. Sin coalescencia, el agente recibe solo el comando en el turno 1, responde (a menudo "envíame la URL"), y solo ve la URL en el turno 2, momento en el que el contexto del comando ya se ha perdido.

`channels.bluebubbles.coalesceSameSenderDms` hace que un DM combine Webhooks consecutivos del mismo remitente en un solo turno del agente. Los chats grupales siguen usando la clave por mensaje para preservar la estructura de turnos multiusuario.

<Tabs>
  <Tab title="Cuándo habilitarlo">
    Habilítalo cuando:

    - Ofrezcas Skills que esperan `comando + carga útil` en un solo mensaje (dump, paste, save, queue, etc.).
    - Tus usuarios peguen URLs, imágenes o contenido largo junto con comandos.
    - Puedas aceptar la latencia añadida del turno de DM (ver abajo).

    Déjalo desactivado cuando:

    - Necesites la mínima latencia de comandos para desencadenantes DM de una sola palabra.
    - Todos tus flujos sean comandos de una sola acción sin cargas útiles posteriores.

  </Tab>
  <Tab title="Habilitar">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // activar (predeterminado: false)
        },
      },
    }
    ```

    Con esta opción activada y sin `messages.inbound.byChannel.bluebubbles` explícito, la ventana de debounce se amplía a **2500 ms** (el valor predeterminado sin coalescencia es 500 ms). La ventana más amplia es necesaria: la cadencia de envío dividido de Apple de 0,8-2,0 s no encaja en el valor predeterminado más ajustado.

    Para ajustar tú mismo la ventana:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms funciona para la mayoría de configuraciones; súbelo a 4000 ms si tu Mac es lenta
            // o está bajo presión de memoria (la diferencia observada puede superar entonces los 2 s).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Compensaciones">
    - **Latencia añadida para comandos de control DM.** Con esta opción activada, los mensajes de comandos de control DM (como `Dump`, `Save`, etc.) ahora esperan hasta la ventana de debounce antes de enviarse, por si llega un Webhook de carga útil. Los comandos en chats grupales mantienen el envío instantáneo.
    - **La salida combinada está acotada** — el texto combinado se limita a 4000 caracteres con un marcador explícito `…[truncated]`; los archivos adjuntos se limitan a 20; las entradas de origen se limitan a 10 (se conservan la primera y la más reciente por encima de ese límite). Cada `messageId` de origen sigue llegando a la deduplicación entrante, por lo que una repetición posterior del MessagePoller de cualquier evento individual se reconoce como duplicado.
    - **Optativo, por canal.** Los demás canales (Telegram, WhatsApp, Slack, …) no se ven afectados.

  </Tab>
</Tabs>

### Escenarios y lo que ve el agente

| Lo que compone el usuario                                        | Lo que entrega Apple      | Opción desactivada (predeterminada)     | Opción activada + ventana de 2500 ms                                  |
| ---------------------------------------------------------------- | ------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `Dump https://example.com` (un solo envío)                       | 2 Webhooks con ~1 s de diferencia | Dos turnos del agente: "Dump" solo, luego la URL | Un turno: texto combinado `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (archivo adjunto + texto)        | 2 Webhooks                | Dos turnos                              | Un turno: texto + imagen                                              |
| `/status` (comando independiente)                                | 1 Webhook                 | Envío instantáneo                       | **Espera hasta la ventana y luego envía**                             |
| URL pegada sola                                                  | 1 Webhook                 | Envío instantáneo                       | Envío instantáneo (solo una entrada en el bucket)                     |
| Texto + URL enviados como dos mensajes deliberadamente separados, con minutos de diferencia | 2 Webhooks fuera de la ventana | Dos turnos                              | Dos turnos (la ventana caduca entre ambos)                            |
| Ráfaga rápida (>10 DM pequeños dentro de la ventana)             | N Webhooks                | N turnos                                | Un turno, salida acotada (se aplican límites de primera + última, texto/adjuntos) |

### Solución de problemas de coalescencia de envío dividido

Si la opción está activada y los envíos divididos siguen llegando como dos turnos, revisa cada capa:

<AccordionGroup>
  <Accordion title="La configuración realmente se cargó">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Luego `openclaw gateway restart` — la opción se lee al crear el registro del debouncer.

  </Accordion>
  <Accordion title="La ventana de debounce es lo bastante amplia para tu configuración">
    Mira el registro del servidor BlueBubbles en `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Mide la diferencia entre el envío de texto tipo `"Dump"` y el envío posterior de `"https://..."; Attachments:`. Aumenta `messages.inbound.byChannel.bluebubbles` para cubrir cómodamente esa diferencia.

  </Accordion>
  <Accordion title="Las marcas de tiempo JSONL de sesión ≠ llegada del Webhook">
    Las marcas de tiempo de los eventos de sesión (`~/.openclaw/agents/<id>/sessions/*.jsonl`) reflejan cuándo el Gateway entrega un mensaje al agente, **no** cuándo llegó el Webhook. Un segundo mensaje en cola etiquetado `[Queued messages while agent was busy]` significa que el primer turno seguía ejecutándose cuando llegó el segundo Webhook: el bucket de coalescencia ya se había vaciado. Ajusta la ventana según el registro del servidor BB, no según el registro de sesión.
  </Accordion>
  <Accordion title="La presión de memoria ralentiza el envío de respuestas">
    En máquinas más pequeñas (8 GB), los turnos del agente pueden tardar lo suficiente para que el bucket de coalescencia se vacíe antes de que se complete la respuesta, y la URL llegue como un segundo turno en cola. Revisa `memory_pressure` y `ps -o rss -p $(pgrep openclaw-gateway)`; si el Gateway supera ~500 MB de RSS y el compresor está activo, cierra otros procesos pesados o usa un host mayor.
  </Accordion>
  <Accordion title="Los envíos con cita de respuesta siguen una ruta distinta">
    Si el usuario pulsó `Dump` como una **respuesta** a un globo de URL existente (iMessage muestra una insignia "1 Reply" en el globo de Dump), la URL vive en `replyToBody`, no en un segundo Webhook. La coalescencia no se aplica: es un asunto de Skill/prompt, no del debouncer.
  </Accordion>
</AccordionGroup>

## Transmisión por bloques

Controla si las respuestas se envían como un único mensaje o se transmiten en bloques:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // habilitar transmisión por bloques (desactivada de forma predeterminada)
    },
  },
}
```

## Multimedia + límites

- Los archivos adjuntos entrantes se descargan y almacenan en la caché multimedia.
- Límite de multimedia mediante `channels.bluebubbles.mediaMaxMb` para multimedia entrante y saliente (predeterminado: 8 MB).
- El texto saliente se divide en fragmentos según `channels.bluebubbles.textChunkLimit` (predeterminado: 4000 caracteres).

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

<AccordionGroup>
  <Accordion title="Conexión y Webhook">
    - `channels.bluebubbles.enabled`: habilitar/deshabilitar el canal.
    - `channels.bluebubbles.serverUrl`: URL base de la API REST de BlueBubbles.
    - `channels.bluebubbles.password`: contraseña de la API.
    - `channels.bluebubbles.webhookPath`: ruta del endpoint del Webhook (predeterminado: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Política de acceso">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).
    - `channels.bluebubbles.allowFrom`: allowlist de DM (identificadores, correos electrónicos, números E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predeterminado: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: allowlist de remitentes de grupos.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: en macOS, enriquece opcionalmente los participantes de grupo sin nombre desde Contactos locales después de que pasen las restricciones. Predeterminado: `false`.
    - `channels.bluebubbles.groups`: configuración por grupo (`requireMention`, etc.).

  </Accordion>
  <Accordion title="Entrega y fragmentación">
    - `channels.bluebubbles.sendReadReceipts`: enviar confirmaciones de lectura (predeterminado: `true`).
    - `channels.bluebubbles.blockStreaming`: habilitar transmisión por bloques (predeterminado: `false`; requerido para respuestas con streaming).
    - `channels.bluebubbles.textChunkLimit`: tamaño del fragmento saliente en caracteres (predeterminado: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: tiempo de espera por solicitud en ms para envíos de texto salientes mediante `/api/v1/message/text` (predeterminado: 30000). Auméntalo en configuraciones macOS 26 donde los envíos de iMessage con Private API pueden quedarse bloqueados durante más de 60 segundos dentro del framework de iMessage; por ejemplo `45000` o `60000`. Las sondas, búsquedas de chats, reacciones, ediciones y comprobaciones de estado mantienen actualmente el valor predeterminado más corto de 10 s; ampliar la cobertura a reacciones y ediciones está previsto como seguimiento. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (predeterminado) divide solo al superar `textChunkLimit`; `newline` divide por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.

  </Accordion>
  <Accordion title="Multimedia e historial">
    - `channels.bluebubbles.mediaMaxMb`: límite de multimedia entrante/saliente en MB (predeterminado: 8).
    - `channels.bluebubbles.mediaLocalRoots`: allowlist explícita de directorios locales absolutos permitidos para rutas de multimedia local saliente. Los envíos de rutas locales se rechazan de forma predeterminada a menos que esto esté configurado. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: fusiona Webhooks DM consecutivos del mismo remitente en un solo turno del agente para que el envío dividido de Apple de texto+URL llegue como un único mensaje (predeterminado: `false`). Consulta [Coalescencia de DM con envío dividido](#coalescing-split-send-dms-command--url-in-one-composition) para escenarios, ajuste de ventana y compensaciones. Amplía la ventana de debounce entrante predeterminada de 500 ms a 2500 ms cuando se habilita sin un `messages.inbound.byChannel.bluebubbles` explícito.
    - `channels.bluebubbles.historyLimit`: máximo de mensajes de grupo para el contexto (0 lo desactiva).
    - `channels.bluebubbles.dmHistoryLimit`: límite de historial de DM.

  </Accordion>
  <Accordion title="Acciones y cuentas">
    - `channels.bluebubbles.actions`: habilitar/deshabilitar acciones específicas.
    - `channels.bluebubbles.accounts`: configuración multicuenta.

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
  - Si un identificador directo no tiene un chat DM existente, OpenClaw creará uno mediante `POST /api/v1/chat/new`. Esto requiere que la Private API de BlueBubbles esté habilitada.

### Enrutamiento de iMessage frente a SMS

Cuando el mismo identificador tiene tanto un chat de iMessage como uno de SMS en el Mac (por ejemplo, un número de teléfono registrado en iMessage pero que también ha recibido alternativas de burbuja verde), OpenClaw prefiere el chat de iMessage y nunca degrada silenciosamente a SMS. Para forzar el chat SMS, usa un prefijo de destino `sms:` explícito (por ejemplo `sms:+15555550123`). Los identificadores sin un chat de iMessage coincidente siguen enviando mediante el chat que informe BlueBubbles.

## Seguridad

- Las solicitudes de Webhook se autentican comparando los parámetros de consulta o encabezados `guid`/`password` con `channels.bluebubbles.password`.
- Mantén en secreto la contraseña de la API y el endpoint del Webhook (trátalos como credenciales).
- No hay bypass de localhost para la autenticación del Webhook de BlueBubbles. Si usas proxy para el tráfico del Webhook, mantén la contraseña de BlueBubbles en la solicitud de extremo a extremo. `gateway.trustedProxies` no reemplaza aquí a `channels.bluebubbles.password`. Consulta [Seguridad del Gateway](/es/gateway/security#reverse-proxy-configuration).
- Habilita HTTPS + reglas de firewall en el servidor BlueBubbles si lo expones fuera de tu LAN.

## Solución de problemas

- Si los eventos de escritura/lectura dejan de funcionar, revisa los registros de Webhook de BlueBubbles y verifica que la ruta del Gateway coincida con `channels.bluebubbles.webhookPath`.
- Los códigos de emparejamiento caducan después de una hora; usa `openclaw pairing list bluebubbles` y `openclaw pairing approve bluebubbles <code>`.
- Las reacciones requieren la Private API de BlueBubbles (`POST /api/v1/message/react`); asegúrate de que la versión del servidor la exponga.
- Editar/anular envío requiere macOS 13+ y una versión compatible del servidor BlueBubbles. En macOS 26 (Tahoe), la edición está actualmente rota debido a cambios en la Private API.
- Las actualizaciones de iconos de grupo pueden ser inestables en macOS 26 (Tahoe): la API puede devolver éxito, pero el nuevo icono no se sincroniza.
- OpenClaw oculta automáticamente las acciones que se sabe que están rotas según la versión de macOS del servidor BlueBubbles. Si la edición sigue apareciendo en macOS 26 (Tahoe), desactívala manualmente con `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` está habilitado pero los envíos divididos (p. ej. `Dump` + URL) siguen llegando como dos turnos: consulta la lista de comprobación de [solución de problemas de coalescencia de envío dividido](#split-send-coalescing-troubleshooting): las causas comunes son una ventana de debounce demasiado ajustada, interpretar mal las marcas de tiempo del registro de sesión como llegada del Webhook, o un envío con cita de respuesta (que usa `replyToBody`, no un segundo Webhook).
- Para información de estado/salud: `openclaw status --all` o `openclaw status --deep`.

Para una referencia general del flujo de trabajo de canales, consulta [Canales](/es/channels) y la guía de [Plugins](/es/tools/plugin).

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y restricción por menciones
- [Emparejamiento](/es/channels/pairing) — autenticación DM y flujo de emparejamiento
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
