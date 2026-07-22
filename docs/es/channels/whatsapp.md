---
read_when:
    - Trabajo en el comportamiento de los canales de WhatsApp/web o en el enrutamiento de la bandeja de entrada
summary: Compatibilidad con el canal de WhatsApp, controles de acceso, comportamiento de entrega y operaciones
title: WhatsApp
x-i18n:
    generated_at: "2026-07-22T13:19:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3894650b530e191c13d4e8b0b2bfd95dde984649719b890aad5c1aa78ac3a3a1
    source_path: channels/whatsapp.md
    workflow: 16
---

Estado: listo para producción mediante WhatsApp Web (Baileys). El Gateway administra las sesiones vinculadas; no existe un canal de WhatsApp de Twilio independiente.

## Instalación

`openclaw onboard` y `openclaw channels add --channel whatsapp` solicitan instalar el plugin la primera vez que se selecciona; `openclaw channels login --channel whatsapp` ofrece el mismo flujo de instalación si falta el plugin. Los checkouts de desarrollo usan la ruta local del plugin; las instalaciones estables/beta instalan primero `@openclaw/whatsapp` desde ClawHub y recurren a npm si falla. El entorno de ejecución de WhatsApp se distribuye fuera del paquete npm principal de OpenClaw, por lo que sus dependencias de ejecución permanecen con el plugin externo. Instalación manual:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Use el paquete npm sin prefijo (`@openclaw/whatsapp`) únicamente como alternativa del registro; fije una versión exacta solo para obtener una instalación reproducible.

<CardGroup cols={3}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos para remitentes desconocidos es la vinculación.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
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

    El inicio de sesión solo admite QR. En hosts remotos o sin interfaz gráfica, asegúrese de disponer de un medio fiable para enviar el QR activo al teléfono antes de iniciar la sesión; los QR mostrados en la terminal, las capturas de pantalla o los archivos adjuntos de chat pueden caducar durante el envío.

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

  <Step title="Aprobar la primera solicitud de acceso por mensaje directo (modo de vinculación)">

    Abra **Settings → Channels → DM access requests**, busque la cuenta de WhatsApp
    y apruebe al remitente. Si prefiere la CLI:

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Las solicitudes de acceso por mensaje directo caducan después de 1 hora; las solicitudes pendientes están limitadas a 3 por
    cuenta. Esta aprobación es independiente del QR de inicio de sesión de WhatsApp utilizado para vincular la
    cuenta.

  </Step>
</Steps>

<Note>
Se recomienda usar un número de WhatsApp independiente (la configuración y los metadatos están optimizados para ello), pero se admiten por completo las configuraciones con número personal o chat con uno mismo.
</Note>

## Patrones de despliegue

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    - identidad de WhatsApp independiente para OpenClaw
    - listas de permitidos de mensajes directos y límites de enrutamiento más claros
    - menor probabilidad de confusión con el chat con uno mismo

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
    La incorporación admite el modo de número personal y escribe una configuración de referencia adecuada para el chat con uno mismo: `dmPolicy: "allowlist"`, `allowFrom` incluido su propio número, `selfChatMode: true`. Las protecciones del entorno de ejecución para el chat con uno mismo se basan en el número propio vinculado y en `allowFrom`.
  </Accordion>
</AccordionGroup>

## Modelo de ejecución

- El Gateway administra el socket de WhatsApp y el bucle de reconexión.
- Un monitor supervisa dos señales de forma independiente: la actividad sin procesar del transporte de WhatsApp Web y la actividad de mensajes de la aplicación. Una sesión inactiva pero conectada no se reinicia únicamente porque no haya llegado ningún mensaje recientemente; solo fuerza una reconexión cuando dejan de llegar tramas de transporte durante un intervalo interno fijo (no configurable por el usuario) o cuando los mensajes de la aplicación permanecen inactivos durante más de 4 veces el tiempo de espera normal de los mensajes. Inmediatamente después de una reconexión de una sesión activa recientemente, ese primer intervalo utiliza el tiempo de espera normal más corto de los mensajes en lugar del intervalo de 4 veces. OpenClaw puede responder automáticamente a los mensajes sin conexión que Baileys entrega al principio de esa reconexión, con el límite de la duración de la deduplicación del ID de los mensajes entrantes; el inicio inicial mantiene la protección breve contra el historial obsoleto.
- Los envíos salientes requieren un agente de escucha de WhatsApp activo para la cuenta de destino; de lo contrario, fallan de inmediato.
- Los envíos a grupos adjuntan metadatos nativos de menciones para los tokens `@+<digits>` y `@<digits>` (en el texto y en los pies de contenido multimedia) cuando el token coincide con los metadatos actuales de un participante, incluidos los grupos respaldados por LID.
- Se ignoran los chats de estado y difusión (`@status`, `@broadcast`).
- Los chats directos utilizan las reglas de sesión de mensajes directos (`session.dmScope`; el valor predeterminado `main` agrupa los mensajes directos en la sesión principal del agente). Las sesiones de grupo se aíslan por JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Los canales o boletines de WhatsApp pueden ser destinos salientes explícitos mediante su JID `@newsletter` nativo y utilizan metadatos de sesión del canal (`agent:<agentId>:whatsapp:channel:<jid>`) en lugar de la semántica de los mensajes directos.
- El transporte de WhatsApp Web respeta las variables de entorno de proxy estándar del host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` y sus variantes en minúsculas). Se recomienda la configuración de proxy a nivel de host en lugar de ajustes por canal.

## Llamar al solicitante actual con MeowCaller (experimental)

El plugin puede exponer `whatsapp_call` en los turnos del agente originados en WhatsApp. Utiliza [MeowCaller](https://github.com/purpshell/meowcaller) para realizar una llamada de voz de WhatsApp al solicitante autorizado actual y reproducir un mensaje TTS de OpenClaw después de que responda. La herramienta no tiene ningún parámetro de número de destino, por lo que una instrucción no puede redirigir la llamada. Está deshabilitada de forma predeterminada.

<Warning>
MeowCaller es experimental, no tiene ninguna versión etiquetada y utiliza una sesión de dispositivo vinculado de whatsmeow emparejada por separado; no puede reutilizar las credenciales de Baileys del plugin. La vinculación añade otro dispositivo vinculado a la misma cuenta de WhatsApp; escanee con la identidad utilizada por OpenClaw. El modo de número personal o chat con uno mismo no puede llamarse a sí mismo; utilice un número dedicado de OpenClaw para llamar a su número personal.
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

    Cuando no está presente o es `false`, OpenClaw no expone la herramienta `whatsapp_call`.

  </Step>

  <Step title="Instalar la CLI de MeowCaller revisada">

    El adaptador espera un ejecutable `meowcaller` en la variable `PATH` del host del Gateway. Hasta que se fusione [el pull request n.º 7 de MeowCaller](https://github.com/purpshell/meowcaller/pull/7), compile la rama revisada:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Asegúrese de que `$HOME/.local/bin` esté en la variable `PATH` del servicio del Gateway. Esta revisión incluye los comandos explícitos `pair` y `notify` de solo envío; `notify` no abre ningún micrófono, altavoz, dispositivo de vídeo ni captura de diagnóstico. No lo sustituya por el comando `play` de la CLI de ejemplo del proyecto original.

  </Step>

  <Step title="Vincular el dispositivo asociado de MeowCaller">

    Pida al agente de WhatsApp que compruebe la configuración de llamadas (la acción de estado `whatsapp_call` informa del directorio de estado específico de la cuenta y del comando de vinculación). Para la cuenta predeterminada:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Ejecute este comando de forma interactiva, escanee el QR desde **WhatsApp > Linked devices** y espere a `MeowCaller linked device ready`. Mantenga `wa-voip.db` en privado: es la sesión de MeowCaller. Las cuentas que no sean la predeterminada obtienen su propia ruta de almacenamiento mediante la acción de estado; en Windows, ejecute su comando de PowerShell.

  </Step>

  <Step title="Configurar TTS y llamar desde WhatsApp">

    Configure un [proveedor de TTS](/es/tools/tts) compatible con telefonía, reinicie el Gateway y, a continuación, envíe una solicitud como `Call me and say the build finished.` La herramienta obtiene el remitente del contexto entrante de confianza, sintetiza un archivo WAV privado temporal, ejecuta MeowCaller durante un intervalo de llamada limitado y elimina después el archivo de audio. OpenClaw pasa explícitamente el almacén de la cuenta, espera un estado de salida cero tras responder, reproducir y colgar, y considera que un tiempo de espera agotado o un estado de salida distinto de cero constituye una llamada fallida a la herramienta.

  </Step>
</Steps>

Límites: solo llamadas de audio salientes individuales, sin números de destino arbitrarios, sin autenticación compartida con la conexión de chat, sin llamadas a uno mismo desde el modo de número personal o chat con uno mismo, audio sintetizado limitado a 60 segundos, sin confirmación de audibilidad en el teléfono más allá de que MeowCaller complete la respuesta, la reproducción y la finalización de la llamada, y OpenClaw detiene el proceso auxiliar después de un intervalo limitado de 115-175 segundos (que abarca las fases de conexión, respuesta, reproducción y cierre de MeowCaller).

## Solicitudes de aprobación

WhatsApp puede representar las solicitudes de aprobación de ejecución y plugins como reacciones `👍`/`👎`, controladas mediante la configuración de reenvío de aprobaciones de nivel superior:

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

`approvals.exec` y `approvals.plugin` son independientes; habilitar WhatsApp como canal solo vincula el transporte y no envía nada, salvo que la familia de aprobaciones correspondiente esté habilitada y enrutada allí. El modo de sesión entrega aprobaciones con emojis nativos únicamente para las aprobaciones que se originan en WhatsApp. El modo de destino utiliza el Pipeline de reenvío compartido para destinos explícitos y no crea una distribución separada a mensajes directos de los aprobadores.

Las reacciones de aprobación de WhatsApp requieren aprobadores explícitos en `allowFrom` (o `"*"`). `defaultTo` establece destinos predeterminados de mensajes ordinarios, no una lista de aprobadores. Los comandos manuales `/approve` siguen pasando por la ruta normal de autorización de remitentes de WhatsApp antes de resolver la aprobación.

## Reacciones a preguntas

Para una solicitud `ask_user` con una pregunta de selección única no secreta y entre una y cuatro opciones, WhatsApp muestra de `1️⃣` a `4️⃣` junto a las etiquetas de las opciones. Reaccione a la solicitud entregada con el número correspondiente para responder. OpenClaw asigna el número a la opción canónica mediante el Gateway; se ignoran las pulsaciones obsoletas o duplicadas. Las solicitudes con varias preguntas, selección múltiple o texto libre siguen admitiendo únicamente respuestas de texto. Las reglas normales de admisión de mensajes directos y grupos de WhatsApp autorizan al remitente de la reacción.

## Hooks de plugins y privacidad

Los mensajes entrantes de WhatsApp pueden contener información personal, números de teléfono, identificadores de grupos, nombres de remitentes y campos de correlación de sesiones. WhatsApp no difunde a los plugins las cargas útiles entrantes del hook `message_received`, salvo que se habilite explícitamente:

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

Limite la habilitación a una cuenta mediante `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Habilítela únicamente para plugins en los que confíe para gestionar el contenido y los identificadores entrantes de WhatsApp.

## Control de acceso y activación

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.whatsapp.dmPolicy`:

    | Valor | Comportamiento |
    | --- | --- |
    | `pairing` (predeterminado) | Los remitentes desconocidos solicitan vinculación; el propietario los aprueba |
    | `allowlist` | Solo se admiten los remitentes de `allowFrom` |
    | `open` | Requiere que `allowFrom` incluya `"*"` |
    | `disabled` | Bloquea todos los mensajes directos |

    `allowFrom` acepta números con formato E.164 (normalizados internamente). Es únicamente una lista de control de acceso de remitentes de mensajes directos; no restringe los envíos salientes explícitos a JID de grupos ni a JID de canales de `@newsletter`.

    Anulación para varias cuentas: `channels.whatsapp.accounts.<id>.dmPolicy` (y `.allowFrom`) tienen prioridad sobre los valores predeterminados del canal para esa cuenta.

    Notas sobre el entorno de ejecución:

    - los emparejamientos se conservan en el almacén de permitidos del canal y se combinan con el valor configurado de `allowFrom`
    - la automatización programada y el destinatario alternativo de Heartbeat usan destinos de entrega explícitos o el valor configurado de `allowFrom`; las aprobaciones de emparejamiento de mensajes directos no son destinatarios implícitos de Cron/Heartbeat
    - si no se configura ninguna lista de permitidos, el número propio vinculado se permite de forma predeterminada
    - OpenClaw nunca empareja automáticamente mensajes directos salientes de `fromMe` (mensajes que se envían a uno mismo desde el dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupos y listas de permitidos">
    El acceso a grupos tiene dos capas:

    1. **Lista de permitidos de pertenencia a grupos** (`channels.whatsapp.groups`): si se omite `groups`, todos los grupos son aptos; si está presente, actúa como una lista de grupos permitidos (`"*"` admite todos).
    2. **Política de remitentes de grupos** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` omite la lista de remitentes permitidos, `allowlist` requiere una coincidencia con `groupAllowFrom` (o `*`) y `disabled` bloquea todos los mensajes entrantes de grupos.

    Si `groupAllowFrom` no está definido, las comprobaciones de remitentes recurren a `allowFrom` cuando contiene entradas. Las listas de remitentes permitidos se evalúan antes de la activación por mención o respuesta.

    Si no existe ningún bloque `channels.whatsapp`, el entorno de ejecución recurre a `groupPolicy: "allowlist"` (con una advertencia en el registro), aunque `channels.defaults.groupPolicy` tenga otro valor.

    <Note>
    La resolución de pertenencia a grupos dispone de una protección para cuentas únicas: si solo hay una cuenta de WhatsApp configurada y su `accounts.<id>.groups` es un objeto vacío explícito (`{}`), se considera «no definido» y se recurre al mapa raíz `channels.whatsapp.groups`, en lugar de bloquear silenciosamente todos los grupos. Si hay 2 o más cuentas configuradas, un mapa de cuenta vacío explícito permanece vacío y no recurre al mapa raíz; esto permite que una cuenta deshabilite intencionadamente todos los grupos sin afectar a las demás.
    </Note>

  </Tab>

  <Tab title="Menciones y /activation">
    De forma predeterminada, las respuestas en grupos requieren una mención. La detección de menciones incluye:

    - menciones explícitas de WhatsApp a la identidad del bot
    - patrones de expresiones regulares de mención configurados (`agents.entries.*.groupChat.mentionPatterns`, con `messages.groupChat.mentionPatterns` como alternativa)
    - transcripciones de notas de voz entrantes para mensajes de grupo autorizados
    - detección implícita de respuesta al bot (el remitente de la respuesta coincide con la identidad del bot)

    Seguridad: citar o responder solo satisface el requisito de mención; **no** concede autorización al remitente. Con `groupPolicy: "allowlist"`, los remitentes que no estén en la lista de permitidos permanecen bloqueados incluso si responden al mensaje de un usuario permitido.

    Comando de activación en el nivel de sesión: `/activation mention` o `/activation always`. Esto actualiza el estado de la sesión (no la configuración global) y está restringido al propietario.

  </Tab>
</Tabs>

## Enlaces ACP configurados

WhatsApp admite enlaces ACP persistentes mediante el elemento de nivel superior `bindings[]`:

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

Los chats directos se comparan con números E.164; los grupos se comparan con JID de grupos de WhatsApp. Las listas de grupos permitidos, la política de remitentes y los requisitos de mención o activación se ejecutan antes de que OpenClaw compruebe que existe la sesión ACP enlazada. Un enlace coincidente controla la ruta: los grupos de difusión no distribuyen ese turno a sesiones ordinarias de WhatsApp.

## Comportamiento con el número personal y el chat propio

Cuando el número propio vinculado también está presente en `allowFrom`, se activan las protecciones del chat propio: se omiten las confirmaciones de lectura en los turnos del chat propio, se ignora el comportamiento de activación automática mediante el JID de mención que provocaría una mención a uno mismo y las respuestas usan de forma predeterminada `[{identity.name}]` (o `[openclaw]`) cuando `responsePrefix` no está definido para el canal o la cuenta.

## Normalización de mensajes y contexto

<AccordionGroup>
  <Accordion title="Contenedor de entrada y contexto de respuesta">
    Los mensajes entrantes se encapsulan en el contenedor compartido de entrada. Una respuesta citada añade contexto con este formato:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Los metadatos de respuesta (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del remitente) se rellenan cuando están disponibles. Si el destino citado es contenido multimedia descargable, OpenClaw lo guarda mediante el almacén normal de contenido multimedia entrante y expone `MediaPath`/`MediaType` para que el agente pueda inspeccionarlo directamente, en lugar de ver únicamente `<media:image>`.

  </Accordion>

  <Accordion title="Marcadores de contenido multimedia y extracción de ubicaciones/contactos">
    Los mensajes que solo contienen contenido multimedia se normalizan como marcadores: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Las notas de voz autorizadas de grupos se transcriben antes de aplicar el requisito de mención cuando el cuerpo solo contiene `<media:audio>`, por lo que mencionar al bot en la nota de voz puede activar la respuesta. Si la transcripción sigue sin mencionar al bot, permanece en el historial pendiente del grupo en lugar de conservar el marcador sin procesar.

    Los cuerpos de ubicaciones se representan como texto conciso de coordenadas. Las etiquetas y los comentarios de ubicaciones, así como los detalles de contactos o vCard, se representan como metadatos no confiables delimitados, no como texto en línea del prompt.

  </Accordion>

  <Accordion title="Inserción del historial pendiente del grupo">
    Los mensajes de grupo sin procesar se almacenan temporalmente y se insertan como contexto cuando finalmente se activa el bot.

    - límite predeterminado: `50`
    - configuración: `channels.whatsapp.historyLimit`, con `messages.groupChat.historyLimit` como alternativa
    - `0` lo deshabilita

    Marcadores de inserción: `[Chat messages since your last reply - for context]` y `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Confirmaciones de lectura">
    Están habilitadas de forma predeterminada para los mensajes entrantes aceptados. Para deshabilitarlas globalmente:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Anulación por cuenta: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Los turnos del chat propio omiten las confirmaciones de lectura aunque estén habilitadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentación y contenido multimedia

<AccordionGroup>
  <Accordion title="Fragmentación de texto">
    - límite predeterminado de fragmento: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline` prioriza los límites de párrafo (líneas en blanco) y, a continuación, recurre a una fragmentación segura según la longitud

  </Accordion>

  <Accordion title="Comportamiento del contenido multimedia saliente">
    - admite cargas útiles de imagen, vídeo, audio (nota de voz PTT) y documento
    - el audio se envía como carga útil `audio` de Baileys con `ptt: true`, por lo que se representa como una nota de voz de pulsar para hablar; `audioAsVoice` se conserva en las cargas útiles de respuesta para que la salida de notas de voz TTS permanezca en esta ruta independientemente del formato de origen del proveedor
    - el audio Ogg/Opus nativo se envía como `audio/ogg; codecs=opus`; cualquier otro formato (incluida la salida MP3/WebM de TTS de Microsoft Edge) se transcodifica con `ffmpeg` a Ogg/Opus mono de 48 kHz antes de la entrega PTT
    - `/tts latest` envía la última respuesta del asistente como una única nota de voz y evita envíos repetidos de la misma respuesta; `/tts chat on|off|default` controla la TTS automática del chat actual
    - habilitar `gifPlayback: true` en un vídeo activa la reproducción como GIF animado
    - `forceDocument`/`asDocument` dirige las imágenes, los GIF y los vídeos salientes mediante la carga útil de documento de Baileys para evitar la compresión multimedia de WhatsApp, conservando el nombre de archivo y el tipo MIME resueltos
    - los pies de contenido se aplican al primer elemento multimedia de una respuesta con varios elementos, excepto en las notas de voz PTT: el audio se envía primero sin pie y, después, este se envía como un mensaje de texto separado (los clientes de WhatsApp no representan de forma uniforme los pies de las notas de voz)
    - la fuente multimedia puede ser HTTP(S), `file://` o una ruta local

  </Accordion>

  <Accordion title="Límites de tamaño multimedia y comportamiento alternativo">
    - límite de almacenamiento de entrada y límite de envío de salida: `channels.whatsapp.mediaMaxMb` (valor predeterminado: `50`)
    - anulación por cuenta: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - las imágenes se optimizan automáticamente (redimensionamiento y ajuste progresivo de calidad) para cumplir los límites, salvo que `forceDocument`/`asDocument` solicite la entrega como documento
    - si falla el envío de contenido multimedia, la alternativa para el primer elemento envía una advertencia de texto en lugar de descartar silenciosamente la respuesta

  </Accordion>
</AccordionGroup>

## Citas en las respuestas

`channels.whatsapp.replyToMode` controla las citas nativas en las respuestas (las respuestas salientes citan visiblemente el mensaje entrante):

| Valor             | Comportamiento                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (predeterminado) | No citar nunca; enviar como mensaje sin formato                           |
| `"first"`         | Citar solo el primer fragmento de la respuesta saliente                      |
| `"all"`           | Citar todos los fragmentos de la respuesta saliente                               |
| `"batched"`       | Citar las respuestas agrupadas en cola; dejar sin citar las respuestas inmediatas |

Anulación por cuenta: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Nivel de reacciones

`channels.whatsapp.reactionLevel` controla la amplitud con la que el agente utiliza reacciones con emojis:

| Nivel                 | Reacciones de confirmación | Reacciones iniciadas por el agente  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | No            | No                         |
| `"ack"`               | Sí           | No                         |
| `"minimal"` (predeterminado) | Sí           | Sí, directrices conservadoras |
| `"extensive"`         | Sí           | Sí, directrices que fomentan su uso   |

Anulación por cuenta: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Reacciones de confirmación

`channels.whatsapp.ackReaction` envía una reacción inmediata al recibir un mensaje entrante, sujeta a `reactionLevel` (se suprime cuando `"off"`):

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Notas: se envía inmediatamente después de aceptar el mensaje entrante (antes de la respuesta); si `ackReaction` está presente sin `emoji`, WhatsApp usa el emoji de identidad del agente al que se dirige y recurre a "👀" como alternativa (omitir `ackReaction` o establecer `emoji: ""` para no enviar confirmación); los fallos se registran, pero no bloquean la entrega de la respuesta; el modo de grupo `mentions` solo reacciona en los turnos activados por una mención, mientras que la activación de grupo `always` omite esa comprobación; WhatsApp solo usa `channels.whatsapp.ackReaction` (el valor heredado `messages.ackReaction` no se aplica aquí).

## Reacciones de estado del ciclo de vida

Establecer `messages.statusReactions.enabled: true` permite que WhatsApp sustituya la reacción de confirmación durante un turno, en lugar de dejar un emoji de recepción estático, pasando por estados como en cola, razonamiento, actividad de herramientas, Compaction, finalización y error:

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
    },
  },
}
```

Notas: `channels.whatsapp.ackReaction` sigue controlando la aptitud para mensajes directos y grupos; el estado en cola usa el mismo emoji efectivo que las reacciones de confirmación simples; WhatsApp dispone de un único espacio de reacción del bot por mensaje, por lo que las actualizaciones del ciclo de vida sustituyen la reacción actual en el mismo lugar y restauran la confirmación después del estado final de finalización o error.

## Varias cuentas y credenciales

<AccordionGroup>
  <Accordion title="Selección de cuentas y valores predeterminados">
    Los identificadores de cuenta proceden de `channels.whatsapp.accounts`. La selección de cuenta predeterminada es `default` si está presente; de lo contrario, es el primer identificador de cuenta configurado (ordenado alfabéticamente). Los identificadores de cuenta se normalizan internamente para su búsqueda.
  </Accordion>

  <Accordion title="Rutas de credenciales y compatibilidad heredada">
    - ruta de autenticación actual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (copia de seguridad: `creds.json.bak`)
    - la autenticación predeterminada heredada en `~/.openclaw/credentials/` aún se reconoce/migra para los flujos de la cuenta predeterminada

  </Accordion>

  <Accordion title="Comportamiento al cerrar sesión">
    `openclaw channels logout --channel whatsapp [--account <id>]` borra el estado de autenticación de WhatsApp para esa cuenta. Cuando hay un Gateway disponible, el cierre de sesión detiene primero el receptor activo de esa cuenta, de modo que la sesión vinculada deja de recibir mensajes antes del siguiente reinicio. `openclaw channels remove --channel whatsapp` también detiene el receptor activo antes de deshabilitar o eliminar la configuración de la cuenta.

    En los directorios de autenticación heredados, `oauth.json` se conserva mientras se eliminan los archivos de autenticación de Baileys.

  </Accordion>
</AccordionGroup>

## Herramientas, acciones y escrituras de configuración

- La compatibilidad con herramientas del agente incluye la acción de reacción de WhatsApp (`react`).
- Controles de acciones: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (las acciones existentes tienen como valor predeterminado `true`), `channels.whatsapp.actions.calls` (valor predeterminado `false`; consulte MeowCaller más arriba).
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

  <Accordion title="Vinculado pero desconectado/bucle de reconexión">
    Síntoma: cuenta vinculada con desconexiones o intentos de reconexión repetidos.

    Las cuentas inactivas pueden permanecer conectadas más allá del tiempo de espera normal de los mensajes; el supervisor solo reinicia cuando se detiene la actividad del transporte de WhatsApp Web, se cierra el socket o la actividad a nivel de aplicación permanece inactiva más allá del intervalo de seguridad más largo (consulte Modelo de ejecución más arriba).

    Solución:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Si el bucle persiste después de corregir la conectividad y los tiempos del host, cree una copia de seguridad del directorio de autenticación de la cuenta y vuelva a vincularla:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Si `~/.openclaw/logs/whatsapp-health.log` indica `Gateway inactive`, pero `openclaw gateway status` y `openclaw channels status --probe` muestran un estado correcto, ejecute `openclaw doctor`. En Linux, doctor advierte sobre entradas heredadas de crontab que invocan el script retirado `~/.openclaw/bin/ensure-whatsapp.sh`; elimine esas entradas con `crontab -e`: cron puede carecer del entorno del bus de usuario de systemd y hacer que ese script antiguo informe incorrectamente del estado del Gateway.

  </Accordion>

  <Accordion title="El inicio de sesión mediante QR agota el tiempo de espera detrás de un proxy">
    Síntoma: `openclaw channels login --channel whatsapp` falla antes de mostrar un QR utilizable con `status=408 Request Time-out` o con una desconexión del socket TLS.

    El inicio de sesión de WhatsApp Web utiliza el entorno de proxy estándar del host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes en minúsculas, `NO_PROXY`). Verifique que el proceso del Gateway herede el entorno del proxy y que `NO_PROXY` no coincida con `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="No hay un receptor activo al enviar">
    Los envíos salientes fallan inmediatamente cuando no existe un receptor activo del Gateway para la cuenta de destino. Confirme que el Gateway esté en ejecución y que la cuenta esté vinculada.
  </Accordion>

  <Accordion title="La respuesta aparece en la transcripción, pero no en WhatsApp">
    Las filas de la transcripción registran lo que generó el agente; la entrega en WhatsApp se comprueba por separado. OpenClaw solo considera enviada una respuesta automática después de que Baileys devuelve un identificador de mensaje saliente para al menos un envío visible de texto o contenido multimedia.

    Las reacciones de confirmación son acuses de recibo independientes y previos a la respuesta: una reacción correcta no demuestra que se haya aceptado la respuesta posterior de texto o contenido multimedia. Compruebe los registros del Gateway para detectar `auto-reply delivery failed` o `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran inesperadamente">
    Compruebe en este orden: `groupPolicy`, `groupAllowFrom`/`allowFrom`, las entradas de la lista de permitidos de `groups`, el control por menciones (`requireMention` + patrones de mención) y las claves duplicadas en `openclaw.json` (las entradas posteriores de JSON5 sobrescriben las anteriores; mantenga un único `groupPolicy` por ámbito).

    Si `channels.whatsapp.groups` está presente, WhatsApp aún puede observar mensajes de otros grupos, pero OpenClaw los descarta antes del enrutamiento de sesión. Añada el JID del grupo a `channels.whatsapp.groups` o añada `groups["*"]` para admitir todos los grupos mientras mantiene la autorización de remitentes bajo `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Advertencia sobre el entorno de ejecución Bun">
    Los Gateways de OpenClaw requieren Node. Bun no proporciona la API `node:sqlite` utilizada por el almacén de estado canónico, y doctor migra los servicios heredados de Bun a Node.
  </Accordion>
</AccordionGroup>

## Prompts del sistema

WhatsApp admite prompts del sistema al estilo de Telegram para grupos y chats directos mediante los mapas `groups` y `direct`.

Resolución para mensajes de grupo: primero se determina el mapa `groups` efectivo; si la cuenta define su propia clave `groups`, esta sustituye por completo el mapa raíz `groups` (sin combinación profunda). A continuación, la búsqueda del prompt se realiza en ese único mapa resultante:

1. **Prompt específico del grupo** (`groups["<groupId>"].systemPrompt`): se utiliza cuando existe la entrada del grupo **y** está definida su clave `systemPrompt`. Una cadena vacía (`""`) suprime el comodín y no aplica ningún prompt.
2. **Prompt comodín de grupo** (`groups["*"].systemPrompt`): se utiliza cuando la entrada del grupo específico no existe o existe sin una clave `systemPrompt`.

La resolución para mensajes directos sigue el mismo patrón con el mapa `direct` y `direct["*"]`.

<Note>
`dms` continúa siendo el contenedor ligero de sustituciones del historial por mensaje directo (`dms.<id>.historyLimit`). Las sustituciones de prompts se encuentran en `direct`.
</Note>

<Note>
Este comportamiento en el que la cuenta sustituye la raíz para la resolución de prompts es una sustitución superficial simple: cualquier clave `groups`/`direct` de la cuenta, incluido un objeto vacío explícito, sustituye el mapa raíz. Se diferencia de la comprobación de la lista de permitidos de pertenencia a grupos descrita anteriormente, que dispone de una protección para cuentas únicas en caso de que `groups: {}` esté vacío accidentalmente.
</Note>

**Diferencia con Telegram:** Telegram suprime el valor raíz `groups` para todas las cuentas en una configuración multicuenta (incluso para las cuentas sin un valor `groups` propio) para impedir que un bot reciba mensajes de grupos a los que no pertenece. WhatsApp no aplica esa protección: los valores raíz `groups`/`direct` se heredan en cualquier cuenta sin una sustitución propia, independientemente del número de cuentas. En una configuración multicuenta de WhatsApp, defina explícitamente el mapa completo en cada cuenta si desea prompts específicos por cuenta.

Comportamiento importante:

- `channels.whatsapp.groups` es tanto un mapa de configuración por grupo como la lista de permitidos de grupos a nivel de chat. Tanto en el ámbito raíz como en el de la cuenta, `groups["*"]` significa «se admiten todos los grupos» para ese ámbito.
- Añada un comodín `systemPrompt` únicamente cuando ya desee que ese ámbito admita todos los grupos. Para mantener como elegible solo un conjunto fijo de identificadores de grupo, repita el prompt en cada entrada incluida explícitamente en la lista de permitidos en lugar de utilizar `groups["*"]`.
- La admisión de grupos y la autorización de remitentes son comprobaciones independientes. `groups["*"]` amplía los grupos que llegan al procesamiento de grupos; no autoriza a todos los remitentes de esos grupos, ya que esto continúa bajo el control de `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` no tiene un efecto secundario equivalente para los mensajes directos: `direct["*"]` solo proporciona una configuración predeterminada después de que un mensaje directo ya haya sido admitido mediante `dmPolicy` junto con `allowFrom` o las reglas del almacén de emparejamiento.

Ejemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Se usa solo si deben admitirse todos los grupos en el ámbito raíz.
        // Se aplica a todas las cuentas que no definen su propio mapa de grupos.
        "*": { systemPrompt: "Prompt predeterminado para todos los grupos." },
      },
      direct: {
        // Se aplica a todas las cuentas que no definen su propio mapa de mensajes directos.
        "*": { systemPrompt: "Prompt predeterminado para todos los chats directos." },
      },
      accounts: {
        work: {
          groups: {
            // Esta cuenta define sus propios grupos, por lo que los grupos raíz se
            // sustituyen por completo. Para conservar un comodín, defina "*" explícitamente también aquí.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Céntrate en la gestión de proyectos.",
            },
            // Se usa solo si deben admitirse todos los grupos en esta cuenta.
            "*": { systemPrompt: "Prompt predeterminado para los grupos de trabajo." },
          },
          direct: {
            // Esta cuenta define su propio mapa de mensajes directos, por lo que las entradas
            // directas raíz se sustituyen por completo. Para conservar un comodín, defina "*" explícitamente también aquí.
            "+15551234567": { systemPrompt: "Prompt para un chat directo de trabajo específico." },
            "*": { systemPrompt: "Prompt predeterminado para los chats directos de trabajo." },
          },
        },
      },
    },
  },
}
```

## Referencias de configuración

Referencia principal: [Referencia de configuración: WhatsApp](/es/gateway/config-channels#whatsapp)

| Área                   | Campos                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| Acceso                 | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Entrega                | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| Multicuenta            | `accounts.<id>.enabled`, `accounts.<id>.authDir` y otras sustituciones por cuenta                              |
| Operaciones            | `configWrites`, `debounceMs`, `enabled`                                                                        |
| Comportamiento de sesión | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Prompts                | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Temas relacionados

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
