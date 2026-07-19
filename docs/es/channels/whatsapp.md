---
read_when:
    - Trabajo con el comportamiento de los canales de WhatsApp/web o el enrutamiento de la bandeja de entrada
summary: Compatibilidad con el canal de WhatsApp, controles de acceso, comportamiento de entrega y operaciones
title: WhatsApp
x-i18n:
    generated_at: "2026-07-19T01:47:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4b510a49741f823a05baea28453a2d4a12932a442172ff8323d0835d86da8897
    source_path: channels/whatsapp.md
    workflow: 16
---

Estado: listo para producción mediante WhatsApp Web (Baileys). El Gateway gestiona las sesiones vinculadas; no existe un canal de WhatsApp de Twilio independiente.

## Instalación

`openclaw onboard` y `openclaw channels add --channel whatsapp` solicitan instalar el plugin la primera vez que se selecciona; `openclaw channels login --channel whatsapp` ofrece el mismo flujo de instalación si falta el plugin. Los checkouts de desarrollo usan la ruta local del plugin; las instalaciones estables/beta instalan primero `@openclaw/whatsapp` desde ClawHub y, si falla, recurren a npm. El runtime de WhatsApp se distribuye fuera del paquete npm principal de OpenClaw, por lo que sus dependencias de runtime permanecen con el plugin externo. Instalación manual:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Use el paquete npm sin prefijo (`@openclaw/whatsapp`) solo como alternativa del registro; fije una versión exacta únicamente para obtener una instalación reproducible.

<CardGroup cols={3}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos es la vinculación para remitentes desconocidos.
  </Card>
  <Card title="Solución de problemas del canal" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y procedimientos de reparación.
  </Card>
  <Card title="Configuración del Gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración de canales.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Configurar la política de acceso">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Vincular WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    El inicio de sesión se realiza exclusivamente mediante QR. En hosts remotos o sin interfaz gráfica, asegúrese de disponer de una vía fiable para enviar el QR activo al teléfono antes de iniciar la sesión; los QR mostrados en la terminal, las capturas de pantalla o los archivos adjuntos de chat pueden caducar durante el envío.

    Para una cuenta específica:

```bash
openclaw channels login --channel whatsapp --account work
```

    Para asociar un directorio de autenticación existente o personalizado antes de iniciar sesión:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Iniciar el Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Aprobar la primera solicitud de vinculación (modo de vinculación)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Las solicitudes de vinculación caducan después de 1 hora; las solicitudes pendientes están limitadas a 3 por cuenta.

  </Step>
</Steps>

<Note>
Se recomienda usar un número de WhatsApp independiente (la configuración y los metadatos están optimizados para ello), pero las configuraciones con un número personal o un chat consigo mismo son totalmente compatibles.
</Note>

## Patrones de implementación

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    - identidad de WhatsApp independiente para OpenClaw
    - límites de enrutamiento y listas de permitidos de mensajes directos más claros
    - menor probabilidad de confusión con los chats consigo mismo

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Alternativa con número personal">
    La incorporación admite el modo de número personal y escribe una configuración de referencia apta para chats consigo mismo: `dmPolicy: "allowlist"`, `allowFrom` incluido su propio número, `selfChatMode: true`. Las protecciones de runtime para chats consigo mismo se basan en el número propio vinculado y en `allowFrom`.
  </Accordion>
</AccordionGroup>

## Modelo de runtime

- El Gateway gestiona el socket de WhatsApp y el bucle de reconexión.
- Un monitor supervisa dos señales de forma independiente: la actividad del transporte sin procesar de WhatsApp Web y la actividad de los mensajes de la aplicación. Una sesión inactiva pero conectada no se reinicia solo porque no haya llegado ningún mensaje recientemente; solo fuerza la reconexión cuando dejan de llegar tramas de transporte durante una ventana interna fija (no configurable por el usuario) o cuando los mensajes de la aplicación permanecen inactivos durante más de 4 veces el tiempo de espera normal de los mensajes. Justo después de una reconexión de una sesión activa recientemente, esa primera ventana utiliza el tiempo de espera normal de los mensajes, más corto, en lugar de la ventana de 4 veces. OpenClaw puede responder automáticamente a los mensajes sin conexión que Baileys entrega al principio de esa reconexión, dentro del límite de la vida útil de deduplicación del ID de mensaje entrante; el arranque inicial conserva la protección breve contra historiales obsoletos.
- Los tiempos del socket de Baileys se especifican explícitamente en `web.whatsapp.*`: `keepAliveIntervalMs` (intervalo de ping de la aplicación), `connectTimeoutMs` (tiempo de espera del protocolo de enlace inicial), `defaultQueryTimeoutMs` (esperas de consultas de Baileys, además de los tiempos de espera de envío saliente, presencia y confirmación de lectura entrante de OpenClaw).
- Los envíos salientes requieren un receptor de WhatsApp activo para la cuenta de destino; de lo contrario, fallan inmediatamente.
- Los envíos a grupos adjuntan metadatos nativos de menciones para los tokens `@+<digits>` y `@<digits>` (en el texto y en los pies de contenido multimedia) cuando el token coincide con los metadatos actuales de un participante, incluidos los grupos respaldados por LID.
- Se ignoran los chats de estado y difusión (`@status`, `@broadcast`).
- Los chats directos usan las reglas de sesión de mensajes directos (`session.dmScope`; el valor predeterminado `main` agrupa los mensajes directos en la sesión principal del agente). Las sesiones de grupo se aíslan por JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Los canales y boletines de WhatsApp pueden ser destinos salientes explícitos mediante su JID `@newsletter` nativo y usar metadatos de sesión de canal (`agent:<agentId>:whatsapp:channel:<jid>`) en lugar de la semántica de mensajes directos.
- El transporte de WhatsApp Web respeta las variables de entorno de proxy estándar del host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` y sus variantes en minúsculas). Es preferible configurar el proxy en el host en lugar de usar ajustes por canal.
- Cuando `messages.removeAckAfterReply` está habilitado, OpenClaw elimina la reacción de confirmación una vez que se entrega una respuesta visible.

## Llamar al solicitante actual con MeowCaller (experimental)

El plugin puede exponer `whatsapp_call` en los turnos del agente originados en WhatsApp. Utiliza [MeowCaller](https://github.com/purpshell/meowcaller) para realizar una llamada de voz de WhatsApp al solicitante autorizado actual y reproducir un mensaje TTS de OpenClaw después de que responda. La herramienta no tiene ningún parámetro de número de destino, por lo que una instrucción no puede redirigir la llamada. Está deshabilitada de forma predeterminada.

<Warning>
MeowCaller es experimental, no tiene ninguna versión etiquetada y utiliza una sesión de dispositivo vinculado de whatsmeow emparejada por separado; no puede reutilizar las credenciales de Baileys del plugin. La vinculación añade otro dispositivo vinculado a la misma cuenta de WhatsApp; escanee el código con la identidad que utiliza OpenClaw. El modo de número personal o chat consigo mismo no permite llamarse a sí mismo; use un número dedicado de OpenClaw para llamar a su número personal.
</Warning>

<Steps>
  <Step title="Habilitar las llamadas experimentales">

    Añada `actions.calls: true` a la configuración del canal de WhatsApp y reinicie el Gateway:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    Cuando está ausente o es `false`, OpenClaw no expone la herramienta `whatsapp_call`.

  </Step>

  <Step title="Instalar la CLI de MeowCaller revisada">

    El adaptador espera encontrar un ejecutable `meowcaller` en el `PATH` del host del Gateway. Hasta que se fusione [el pull request n.º 7 de MeowCaller](https://github.com/purpshell/meowcaller/pull/7), compile la rama revisada:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Asegúrese de que `$HOME/.local/bin` esté en el `PATH` del servicio del Gateway. Esta revisión incluye comandos explícitos `pair` y `notify` de solo envío; `notify` no abre ningún micrófono, altavoz, dispositivo de vídeo ni captura de diagnóstico. No lo sustituya por el comando `play` de la CLI de ejemplo del proyecto original.

  </Step>

  <Step title="Vincular el dispositivo de MeowCaller">

    Solicite al agente de WhatsApp que compruebe la configuración de llamadas (la acción de estado `whatsapp_call` muestra el directorio de estado específico de la cuenta y el comando de vinculación). Para la cuenta predeterminada:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Ejecute este proceso de forma interactiva, escanee el QR desde **WhatsApp > Linked devices** y espere a `MeowCaller linked device ready`. Mantenga `wa-voip.db` en privado: es la sesión de MeowCaller. Las cuentas no predeterminadas obtienen su propia ruta de almacenamiento mediante la acción de estado; en Windows, ejecute su comando de PowerShell.

  </Step>

  <Step title="Configurar TTS y llamar desde WhatsApp">

    Configure un [proveedor de TTS](/es/tools/tts) apto para telefonía, reinicie el Gateway y envíe una solicitud como `Call me and say the build finished.` La herramienta obtiene el remitente a partir del contexto entrante de confianza, sintetiza un archivo WAV privado temporal, ejecuta MeowCaller durante una ventana de llamada limitada y elimina después el archivo de audio. OpenClaw pasa explícitamente el almacenamiento de la cuenta, espera un estado de salida cero después de responder, reproducir y colgar, y considera que un tiempo de espera agotado o un estado de salida distinto de cero constituye un fallo de la llamada a la herramienta.

  </Step>
</Steps>

Límites: solo llamadas de audio salientes individuales, sin números de destino arbitrarios, sin autenticación compartida con la conexión de chat, sin llamadas a sí mismo desde el modo de número personal o chat consigo mismo, audio sintetizado limitado a 60 segundos, sin confirmación de audibilidad por parte del teléfono más allá de la finalización de respuesta, reproducción y cierre de MeowCaller, y OpenClaw detiene el proceso complementario después de una ventana limitada de 115-175 segundos (que abarca las fases de conexión, respuesta, reproducción y cierre de MeowCaller).

## Solicitudes de aprobación

WhatsApp puede mostrar solicitudes de aprobación de ejecución y plugins como reacciones `👍`/`👎`, controladas mediante la configuración de reenvío de aprobaciones de nivel superior:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` y `approvals.plugin` son independientes; habilitar WhatsApp como canal solo vincula el transporte y no envía nada a menos que la familia de aprobaciones correspondiente esté habilitada y dirigida allí. El modo de sesión entrega aprobaciones mediante emojis nativos únicamente para las aprobaciones que se originan en WhatsApp. El modo de destino utiliza el Pipeline compartido de reenvío para destinos explícitos y no crea una distribución independiente a los mensajes directos de los aprobadores.

Las reacciones de aprobación de WhatsApp requieren aprobadores explícitos en `allowFrom` (o `"*"`). `defaultTo` establece destinos predeterminados para mensajes normales, no una lista de aprobadores. Los comandos manuales `/approve` siguen pasando por la ruta normal de autorización del remitente de WhatsApp antes de resolver la aprobación.

## Reacciones a preguntas

Para una solicitud `ask_user` con una pregunta no secreta de selección única y entre una y cuatro opciones, WhatsApp muestra desde `1️⃣` hasta `4️⃣` junto a las etiquetas de las opciones. Reaccione a la solicitud entregada con el número correspondiente para responderla. OpenClaw asigna el número a la opción canónica mediante el Gateway; se ignoran las pulsaciones obsoletas o duplicadas. Las solicitudes con varias preguntas, selección múltiple o texto libre siguen admitiendo únicamente respuestas de texto. Las reglas normales de admisión de mensajes directos y grupos de WhatsApp autorizan al remitente que reacciona.

## Hooks de plugins y privacidad

Los mensajes entrantes de WhatsApp pueden contener contenido personal, números de teléfono, identificadores de grupos, nombres de remitentes y campos de correlación de sesiones. WhatsApp no difunde las cargas útiles entrantes del hook `message_received` a los plugins a menos que se habilite expresamente:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Limite la habilitación a una cuenta en `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Habilite esta opción únicamente para plugins en los que confíe el contenido y los identificadores entrantes de WhatsApp.

## Control de acceso y activación

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.whatsapp.dmPolicy`:

    | Valor | Comportamiento |
    | --- | --- |
    | `pairing` (predeterminado) | Los remitentes desconocidos solicitan emparejamiento; el propietario lo aprueba |
    | `allowlist` | Solo se admiten remitentes `allowFrom` |
    | `open` | Requiere que `allowFrom` incluya `"*"` |
    | `disabled` | Bloquea todos los mensajes directos |

    `allowFrom` acepta números con formato E.164 (normalizados internamente). Es únicamente una lista de control de acceso de remitentes de mensajes directos; no restringe los envíos salientes explícitos a JID de grupos ni a JID de canales `@newsletter`.

    Anulación para varias cuentas: `channels.whatsapp.accounts.<id>.dmPolicy` (y `.allowFrom`) tienen prioridad sobre los valores predeterminados del canal para esa cuenta.

    Notas sobre el entorno de ejecución:

    - los emparejamientos se conservan en el almacén de permitidos del canal y se combinan con la configuración de `allowFrom`
    - la automatización programada y el destinatario alternativo de Heartbeat usan destinos de entrega explícitos o la configuración de `allowFrom`; las aprobaciones de emparejamiento de mensajes directos no se convierten implícitamente en destinatarios de Cron o Heartbeat
    - si no se configura ninguna lista de permitidos, el número propio vinculado se permite de forma predeterminada
    - OpenClaw nunca empareja automáticamente mensajes directos salientes de `fromMe` (mensajes que se envían a sí mismos desde el dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupos y listas de permitidos">
    El acceso a grupos tiene dos niveles:

    1. **Lista de permitidos de pertenencia a grupos** (`channels.whatsapp.groups`): si se omite `groups`, todos los grupos cumplen los requisitos; si está presente, actúa como una lista de grupos permitidos (`"*"` los admite todos).
    2. **Política de remitentes de grupos** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` omite la lista de remitentes permitidos, `allowlist` exige una coincidencia con `groupAllowFrom` (o `*`) y `disabled` bloquea todos los mensajes entrantes de grupos.

    Si `groupAllowFrom` no está definido, las comprobaciones de remitentes recurren a `allowFrom` cuando contiene entradas. Las listas de remitentes permitidos se evalúan antes de la activación por mención o respuesta.

    Si no existe ningún bloque `channels.whatsapp`, el entorno de ejecución recurre a `groupPolicy: "allowlist"` (con una advertencia en el registro), incluso si `channels.defaults.groupPolicy` tiene otro valor.

    <Note>
    La resolución de pertenencia a grupos dispone de una medida de seguridad para cuentas únicas: si solo hay una cuenta de WhatsApp configurada y su `accounts.<id>.groups` es un objeto vacío explícito (`{}`), se considera que «no está definido» y se recurre al mapa raíz `channels.whatsapp.groups`, en lugar de bloquear silenciosamente todos los grupos. Si hay 2 o más cuentas configuradas, un mapa de cuenta vacío explícito permanece vacío y no recurre al mapa raíz; esto permite que una cuenta desactive intencionadamente todos los grupos sin afectar a las demás.
    </Note>

  </Tab>

  <Tab title="Menciones y /activation">
    De forma predeterminada, las respuestas en grupos requieren una mención. La detección de menciones incluye:

    - menciones explícitas de WhatsApp a la identidad del bot
    - patrones de expresiones regulares de menciones configurados (`agents.list[].groupChat.mentionPatterns`, con `messages.groupChat.mentionPatterns` como alternativa)
    - transcripciones de notas de voz entrantes para mensajes de grupos autorizados
    - detección implícita de respuestas al bot (el remitente de la respuesta coincide con la identidad del bot)

    Seguridad: citar o responder solo satisface el requisito de mención; **no** concede autorización al remitente. Con `groupPolicy: "allowlist"`, los remitentes que no figuren en la lista de permitidos permanecen bloqueados incluso al responder al mensaje de un usuario permitido.

    Comando de activación a nivel de sesión: `/activation mention` o `/activation always`. Actualiza el estado de la sesión (no la configuración global) y está restringido al propietario.

  </Tab>
</Tabs>

## Enlaces ACP configurados

WhatsApp admite enlaces ACP persistentes mediante `bindings[]` en el nivel superior:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

Los chats directos se asocian mediante números E.164; los grupos se asocian mediante JID de grupos de WhatsApp. Las listas de grupos permitidos, la política de remitentes y los requisitos de mención o activación se ejecutan antes de que OpenClaw garantice la existencia de la sesión ACP enlazada. Un enlace coincidente controla la ruta: los grupos de difusión no distribuyen ese turno a sesiones ordinarias de WhatsApp.

## Comportamiento del número personal y del chat propio

Cuando el número propio vinculado también está presente en `allowFrom`, se activan las medidas de protección del chat propio: se omiten las confirmaciones de lectura en los turnos del chat propio, se ignora la activación automática mediante el JID de mención que provocaría una mención a sí mismo y, cuando `messages.responsePrefix` no está definido, las respuestas se dirigen de forma predeterminada a `[{identity.name}]` (o `[openclaw]`).

## Normalización de mensajes y contexto

<AccordionGroup>
  <Accordion title="Envolvente entrante y contexto de respuesta">
    Los mensajes entrantes se encapsulan en la envolvente entrante compartida. Una respuesta citada añade el contexto con este formato:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Los metadatos de respuesta (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del remitente) se rellenan cuando están disponibles. Si el destino citado es contenido multimedia descargable, OpenClaw lo guarda mediante el almacén normal de contenido multimedia entrante y expone `MediaPath`/`MediaType` para que el agente pueda inspeccionarlo directamente en lugar de ver únicamente `<media:image>`.

  </Accordion>

  <Accordion title="Marcadores de contenido multimedia y extracción de ubicaciones/contactos">
    Los mensajes que solo contienen contenido multimedia se normalizan como marcadores: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Las notas de voz de grupos autorizados se transcriben antes de aplicar el requisito de mención cuando el cuerpo solo contiene `<media:audio>`, de modo que pronunciar la mención del bot en la nota de voz puede activar la respuesta. Si la transcripción sigue sin mencionar al bot, permanece en el historial pendiente del grupo en lugar de conservar el marcador sin procesar.

    Los cuerpos de ubicación se representan como texto conciso de coordenadas. Las etiquetas o los comentarios de ubicación y los detalles de contactos o vCard se representan como metadatos no fiables delimitados, no como texto integrado en el prompt.

  </Accordion>

  <Accordion title="Inyección del historial pendiente del grupo">
    Los mensajes de grupo no procesados se almacenan temporalmente y se inyectan como contexto cuando finalmente se activa el bot.

    - límite predeterminado: `50`
    - configuración: `channels.whatsapp.historyLimit`, con `messages.groupChat.historyLimit` como alternativa
    - `0` desactiva esta función

    Marcadores de inyección: `[Chat messages since your last reply - for context]` y `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Confirmaciones de lectura">
    Están activadas de forma predeterminada para los mensajes entrantes aceptados. Para desactivarlas globalmente:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Anulación por cuenta: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Los turnos del chat propio omiten las confirmaciones de lectura incluso cuando están activadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, división en fragmentos y contenido multimedia

<AccordionGroup>
  <Accordion title="División de texto en fragmentos">
    - límite predeterminado de fragmentos: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline` prioriza los límites entre párrafos (líneas en blanco) y después recurre a una división segura según la longitud

  </Accordion>

  <Accordion title="Comportamiento del contenido multimedia saliente">
    - admite cargas útiles de imágenes, vídeos, audio (notas de voz PTT) y documentos
    - el audio se envía como carga útil `audio` de Baileys con `ptt: true`, y se representa como una nota de voz «pulsar para hablar»; `audioAsVoice` se conserva en las cargas útiles de respuesta para que la salida de notas de voz TTS permanezca en esta ruta independientemente del formato de origen del proveedor
    - el audio Ogg/Opus nativo se envía como `audio/ogg; codecs=opus`; cualquier otro formato (incluidas las salidas MP3/WebM de TTS de Microsoft Edge) se transcodifica mediante `ffmpeg` a Ogg/Opus mono de 48 kHz antes de la entrega PTT
    - `/tts latest` envía la respuesta más reciente del asistente como una única nota de voz y evita los envíos repetidos de la misma respuesta; `/tts chat on|off|default` controla el TTS automático del chat actual
    - activar `gifPlayback: true` en los vídeos permite la reproducción como GIF animado
    - `forceDocument`/`asDocument` dirige las imágenes, los GIF y los vídeos salientes mediante la carga útil de documentos de Baileys para evitar la compresión multimedia de WhatsApp y conservar el nombre de archivo y el tipo MIME resueltos
    - los pies de foto se aplican al primer elemento multimedia de una respuesta con varios elementos, excepto en las notas de voz PTT: el audio se envía primero sin pie y después el pie se envía como un mensaje de texto independiente (los clientes de WhatsApp no representan de forma coherente los pies de las notas de voz)
    - la fuente del contenido multimedia puede ser HTTP(S), `file://` o una ruta local

  </Accordion>

  <Accordion title="Límites de tamaño del contenido multimedia y comportamiento alternativo">
    - límite de almacenamiento entrante y límite de envío saliente: `channels.whatsapp.mediaMaxMb` (valor predeterminado: `50`)
    - anulación por cuenta: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - las imágenes se optimizan automáticamente (redimensionamiento y ajuste progresivo de calidad) para respetar los límites, salvo que `forceDocument`/`asDocument` solicite la entrega como documento
    - si falla el envío de contenido multimedia, el mecanismo alternativo del primer elemento envía una advertencia de texto en lugar de descartar silenciosamente la respuesta

  </Accordion>
</AccordionGroup>

## Citas de respuestas

`channels.whatsapp.replyToMode` controla las citas nativas de respuestas (las respuestas salientes citan visiblemente el mensaje entrante):

| Valor             | Comportamiento                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (predeterminado) | No cita nunca; envía como mensaje sin formato                           |
| `"first"`         | Cita solo el primer fragmento de la respuesta saliente                      |
| `"all"`           | Cita todos los fragmentos de la respuesta saliente                               |
| `"batched"`       | Cita las respuestas agrupadas en cola; deja sin citar las respuestas inmediatas |

Anulación por cuenta: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Nivel de reacciones

`channels.whatsapp.reactionLevel` controla la amplitud con la que el agente usa reacciones con emojis:

| Nivel                 | Reacciones de confirmación | Reacciones iniciadas por el agente  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | No            | No                         |
| `"ack"`               | Sí           | No                         |
| `"minimal"` (predeterminado) | Sí           | Sí, con pautas conservadoras |
| `"extensive"`         | Sí           | Sí, con pautas que las fomentan   |

Anulación por cuenta: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Reacciones de confirmación

`channels.whatsapp.ackReaction` envía una reacción inmediata al recibir un mensaje entrante, condicionada por `reactionLevel` (se suprime cuando `"off"`):

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // siempre | menciones | nunca
      },
    },
  },
}
```

Notas: se envía inmediatamente después de aceptar el mensaje entrante (antes de la respuesta); si `ackReaction` está presente sin `emoji`, WhatsApp usa el emoji de identidad del agente al que se dirige la ruta y recurre a "👀" como alternativa (omita `ackReaction` o establezca `emoji: ""` para no enviar confirmación); los fallos se registran, pero no bloquean la entrega de la respuesta; el modo de grupo `mentions` solo reacciona en los turnos activados por una mención, mientras que la activación de grupo `always` omite esa comprobación; WhatsApp solo usa `channels.whatsapp.ackReaction` (el antiguo `messages.ackReaction` no se aplica aquí).

## Reacciones de estado del ciclo de vida

Establezca `messages.statusReactions.enabled: true` para permitir que WhatsApp sustituya la reacción de confirmación durante un turno, en lugar de dejar un emoji de recepción estático, recorriendo estados como en cola, razonando, actividad de herramientas, Compaction, finalizado y error:

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Notas: `channels.whatsapp.ackReaction` sigue controlando la elegibilidad para mensajes directos y grupos; el estado en cola usa el mismo emoji efectivo que las reacciones de acuse de recibo simples; WhatsApp tiene un único espacio de reacción del bot por mensaje, por lo que las actualizaciones del ciclo de vida sustituyen la reacción actual en el mismo lugar; `messages.removeAckAfterReply: true` elimina la reacción de estado final después del tiempo de retención configurado para finalización/error; las categorías de emojis de herramientas incluyen `tool`, `coding`, `web`, `deploy`, `build` y `concierge`.

## Varias cuentas y credenciales

<AccordionGroup>
  <Accordion title="Selección de cuentas y valores predeterminados">
    Los identificadores de cuenta provienen de `channels.whatsapp.accounts`. La selección de cuenta predeterminada es `default` si está presente; de lo contrario, es el primer identificador de cuenta configurado (ordenado alfabéticamente). Los identificadores de cuenta se normalizan internamente para su búsqueda.
  </Accordion>

  <Accordion title="Rutas de credenciales y compatibilidad heredada">
    - ruta de autenticación actual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (copia de seguridad: `creds.json.bak`)
    - la autenticación predeterminada heredada en `~/.openclaw/credentials/` todavía se reconoce y migra para los flujos de la cuenta predeterminada

  </Accordion>

  <Accordion title="Comportamiento al cerrar sesión">
    `openclaw channels logout --channel whatsapp [--account <id>]` elimina el estado de autenticación de WhatsApp para esa cuenta. Cuando se puede acceder a un Gateway, el cierre de sesión detiene primero el receptor activo de esa cuenta, por lo que la sesión vinculada deja de recibir mensajes antes del siguiente reinicio. `openclaw channels remove --channel whatsapp` también detiene el receptor activo antes de deshabilitar o eliminar la configuración de la cuenta.

    En los directorios de autenticación heredados, se conserva `oauth.json` mientras se eliminan los archivos de autenticación de Baileys.

  </Accordion>
</AccordionGroup>

## Herramientas, acciones y escrituras de configuración

- La compatibilidad con herramientas del agente incluye la acción de reacción de WhatsApp (`react`).
- Controles de acciones: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (las acciones existentes tienen como valor predeterminado `true`), `channels.whatsapp.actions.calls` (valor predeterminado: `false`; consulte MeowCaller más arriba).
- Las escrituras de configuración iniciadas por el canal están habilitadas de forma predeterminada; deshabilítelas mediante `channels.whatsapp.configWrites: false`.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Sin vincular (se requiere un código QR)">
    Síntoma: el estado del canal indica que no está vinculado.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Vinculado, pero desconectado o en un bucle de reconexión">
    Síntoma: cuenta vinculada con desconexiones o intentos de reconexión repetidos.

    Las cuentas inactivas pueden permanecer conectadas más allá del tiempo de espera normal de los mensajes; el supervisor solo reinicia cuando se detiene la actividad del transporte de WhatsApp Web, se cierra el socket o la actividad en el nivel de la aplicación permanece inactiva más allá del intervalo de seguridad más largo (consulte Modelo de ejecución más arriba).

    Si los registros muestran `status=408 Request Time-out Connection was lost` repetidamente, ajuste los tiempos del socket de Baileys en `web.whatsapp`. Empiece por reducir `keepAliveIntervalMs` por debajo del tiempo de espera por inactividad de la red y aumentar `connectTimeoutMs` en conexiones lentas o con pérdidas:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Solución:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Si el bucle persiste después de corregir la conectividad del host y los tiempos, haga una copia de seguridad del directorio de autenticación de la cuenta y vuelva a vincularla:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Si `~/.openclaw/logs/whatsapp-health.log` indica `Gateway inactive`, pero tanto `openclaw gateway status` como `openclaw channels status --probe` muestran un estado correcto, ejecute `openclaw doctor`. En Linux, doctor advierte sobre entradas heredadas de crontab que invocan el script retirado `~/.openclaw/bin/ensure-whatsapp.sh`; elimine esas entradas con `crontab -e`: Cron puede carecer del entorno del bus de usuario de systemd y hacer que ese script antiguo informe incorrectamente sobre el estado del Gateway.

  </Accordion>

  <Accordion title="El inicio de sesión mediante QR agota el tiempo de espera detrás de un proxy">
    Síntoma: `openclaw channels login --channel whatsapp` falla antes de mostrar un código QR utilizable, con `status=408 Request Time-out` o una desconexión del socket TLS.

    El inicio de sesión de WhatsApp Web usa el entorno de proxy estándar del host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes en minúsculas y `NO_PROXY`). Verifique que el proceso del Gateway herede el entorno del proxy y que `NO_PROXY` no coincida con `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="No hay ningún receptor activo al enviar">
    Los envíos salientes fallan de inmediato cuando no existe ningún receptor activo del Gateway para la cuenta de destino. Confirme que el Gateway esté en ejecución y que la cuenta esté vinculada.
  </Accordion>

  <Accordion title="La respuesta aparece en la transcripción, pero no en WhatsApp">
    Las filas de la transcripción registran lo que generó el agente; la entrega en WhatsApp se comprueba por separado. OpenClaw solo considera enviada una respuesta automática después de que Baileys devuelve un identificador de mensaje saliente para al menos un envío visible de texto o contenido multimedia.

    Las reacciones de acuse de recibo son confirmaciones previas a la respuesta independientes: que una reacción se complete correctamente no demuestra que se haya aceptado la respuesta posterior de texto o contenido multimedia. Compruebe los registros del Gateway en busca de `auto-reply delivery failed` o `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran inesperadamente">
    Compruebe, en este orden: `groupPolicy`, `groupAllowFrom`/`allowFrom`, las entradas de la lista de permitidos de `groups`, el control por menciones (`requireMention` + patrones de mención) y las claves duplicadas en `openclaw.json` (las entradas posteriores de JSON5 sobrescriben las anteriores; mantenga un único `groupPolicy` por ámbito).

    Si `channels.whatsapp.groups` está presente, WhatsApp aún puede observar mensajes de otros grupos, pero OpenClaw los descarta antes del enrutamiento de la sesión. Añada el JID del grupo a `channels.whatsapp.groups` o añada `groups["*"]` para admitir todos los grupos y mantener la autorización de remitentes bajo `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Advertencia sobre el entorno de ejecución Bun">
    Los Gateway de OpenClaw requieren Node. Bun no proporciona la API `node:sqlite` que usa el almacén de estado canónico, y doctor migra los servicios heredados de Bun a Node.
  </Accordion>
</AccordionGroup>

## Indicaciones del sistema

WhatsApp admite indicaciones del sistema al estilo de Telegram para grupos y chats directos mediante los mapas `groups` y `direct`.

Resolución para mensajes de grupo: primero se determina el mapa `groups` efectivo; si la cuenta define su propia clave `groups`, esta sustituye por completo el mapa raíz `groups` (sin combinación profunda). A continuación, la búsqueda de la indicación se ejecuta en ese único mapa resultante:

1. **Indicación específica del grupo** (`groups["<groupId>"].systemPrompt`): se usa cuando existe la entrada del grupo **y** su clave `systemPrompt` está definida. Una cadena vacía (`""`) suprime el comodín y no aplica ninguna indicación.
2. **Indicación comodín de grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada específica del grupo no existe o existe sin una clave `systemPrompt`.

La resolución para los mensajes directos sigue el mismo patrón con el mapa `direct` y `direct["*"]`.

<Note>
`dms` sigue siendo el contenedor ligero de sustituciones del historial por mensaje directo (`dms.<id>.historyLimit`). Las sustituciones de indicaciones se encuentran en `direct`.
</Note>

<Note>
Este comportamiento en el que la cuenta sustituye la raíz para resolver indicaciones es una sustitución superficial simple: cualquier clave `groups`/`direct` de la cuenta, incluido un objeto vacío explícito, sustituye el mapa raíz. Se diferencia de la comprobación de la lista de permitidos de pertenencia a grupos descrita anteriormente, que dispone de una protección para una sola cuenta en caso de que `groups: {}` esté vacío accidentalmente.
</Note>

**Diferencia respecto a Telegram:** Telegram suprime el `groups` raíz para todas las cuentas de una configuración con varias cuentas (incluso para cuentas que no tienen un `groups` propio), a fin de impedir que un bot reciba mensajes de grupos a los que no pertenece. WhatsApp no aplica esa protección: cualquier cuenta sin una sustitución propia hereda los `groups`/`direct` raíz, independientemente del número de cuentas. En una configuración de WhatsApp con varias cuentas, defina explícitamente el mapa completo en cada cuenta si desea indicaciones específicas por cuenta.

Comportamiento importante:

- `channels.whatsapp.groups` es tanto un mapa de configuración por grupo como la lista de permitidos de grupos en el nivel del chat. Tanto en el ámbito raíz como en el de la cuenta, `groups["*"]` significa «se admiten todos los grupos» para ese ámbito.
- Añada un comodín `systemPrompt` únicamente cuando ya desee que ese ámbito admita todos los grupos. Para mantener como elegible solo un conjunto fijo de identificadores de grupo, repita la indicación en cada entrada incluida explícitamente en la lista de permitidos en lugar de usar `groups["*"]`.
- La admisión de grupos y la autorización de remitentes son comprobaciones independientes. `groups["*"]` amplía los grupos que llegan al procesamiento de grupos; no autoriza a todos los remitentes de esos grupos, lo cual sigue controlándose mediante `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` no tiene ningún efecto secundario equivalente para los mensajes directos: `direct["*"]` solo proporciona una configuración predeterminada después de que `dmPolicy` junto con `allowFrom` o las reglas del almacén de emparejamiento ya hayan admitido un mensaje directo.

Ejemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Usar solo si deben admitirse todos los grupos en el ámbito raíz.
        // Se aplica a todas las cuentas que no definan su propio mapa groups.
        "*": { systemPrompt: "Indicación predeterminada para todos los grupos." },
      },
      direct: {
        // Se aplica a todas las cuentas que no definan su propio mapa direct.
        "*": { systemPrompt: "Indicación predeterminada para todos los chats directos." },
      },
      accounts: {
        work: {
          groups: {
            // Esta cuenta define su propio mapa groups, por lo que el mapa groups raíz
            // se sustituye por completo. Para conservar un comodín, defina "*" explícitamente aquí también.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Centrarse en la gestión de proyectos.",
            },
            // Usar solo si deben admitirse todos los grupos en esta cuenta.
            "*": { systemPrompt: "Indicación predeterminada para los grupos de trabajo." },
          },
          direct: {
            // Esta cuenta define su propio mapa direct, por lo que las entradas direct raíz
            // se sustituyen por completo. Para conservar un comodín, defina "*" explícitamente aquí también.
            "+15551234567": { systemPrompt: "Indicación para un chat directo de trabajo específico." },
            "*": { systemPrompt: "Indicación predeterminada para los chats directos de trabajo." },
          },
        },
      },
    },
  },
}
```

## Referencias de configuración

Referencia principal: [Referencia de configuración: WhatsApp](/es/gateway/config-channels#whatsapp)

| Área                | Campos                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Acceso              | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Entrega             | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| Varias cuentas      | `accounts.<id>.enabled`, `accounts.<id>.authDir` y otras sustituciones por cuenta                              |
| Operaciones         | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Comportamiento de la sesión | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Indicaciones        | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Contenido relacionado

- [Vinculación](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
