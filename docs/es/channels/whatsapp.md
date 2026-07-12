---
read_when:
    - Trabajo sobre el comportamiento del canal de WhatsApp/web o el enrutamiento de la bandeja de entrada
summary: Compatibilidad con el canal de WhatsApp, controles de acceso, comportamiento de entrega y operaciones
title: WhatsApp
x-i18n:
    generated_at: "2026-07-11T22:52:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

Estado: listo para producción mediante WhatsApp Web (Baileys). El Gateway gestiona las sesiones vinculadas; no existe un canal de WhatsApp de Twilio independiente.

## Instalación

`openclaw onboard` y `openclaw channels add --channel whatsapp` solicitan instalar el Plugin la primera vez que lo selecciona; `openclaw channels login --channel whatsapp` ofrece el mismo flujo de instalación si falta el Plugin. Los entornos de desarrollo usan la ruta local del Plugin; las instalaciones estables/beta instalan primero `@openclaw/whatsapp` desde ClawHub y recurren a npm si no está disponible. El entorno de ejecución de WhatsApp se distribuye fuera del paquete npm principal de OpenClaw, por lo que sus dependencias de ejecución permanecen en el Plugin externo. Instalación manual:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Use el paquete npm sin prefijo (`@openclaw/whatsapp`) únicamente como alternativa del registro; fije una versión exacta solo para obtener una instalación reproducible.

<CardGroup cols={3}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos requiere vinculación para los remitentes desconocidos.
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

    El inicio de sesión se realiza exclusivamente mediante QR. En hosts remotos o sin interfaz gráfica, asegúrese de disponer de un método fiable para enviar el QR activo al teléfono antes de iniciar la sesión; los códigos QR mostrados en la terminal, las capturas de pantalla o los archivos adjuntos del chat pueden caducar durante el envío.

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

    Las solicitudes de vinculación caducan después de 1 hora; se permiten como máximo 3 solicitudes pendientes por cuenta.

  </Step>
</Steps>

<Note>
Se recomienda usar un número de WhatsApp independiente (la configuración y los metadatos están optimizados para ello), pero también se admiten completamente las configuraciones con un número personal o chat consigo mismo.
</Note>

## Patrones de despliegue

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    - identidad de WhatsApp independiente para OpenClaw
    - listas de remitentes permitidos de mensajes directos y límites de enrutamiento más claros
    - menor probabilidad de confusión con el chat consigo mismo

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
    La incorporación admite el modo de número personal y crea una configuración de referencia apta para el chat consigo mismo: `dmPolicy: "allowlist"`, `allowFrom` con su propio número incluido y `selfChatMode: true`. Las protecciones del entorno de ejecución para el chat consigo mismo se basan en el número propio vinculado y en `allowFrom`.
  </Accordion>
</AccordionGroup>

## Modelo de ejecución

- El Gateway gestiona el socket de WhatsApp y el bucle de reconexión.
- Un supervisor controla dos señales de forma independiente: la actividad de transporte sin procesar de WhatsApp Web y la actividad de mensajes de la aplicación. Una sesión inactiva pero conectada no se reinicia solo porque no haya recibido mensajes recientemente; la reconexión solo se fuerza cuando dejan de llegar tramas de transporte durante un intervalo interno fijo (no configurable por el usuario) o cuando los mensajes de la aplicación permanecen inactivos durante más de 4 veces el tiempo de espera normal de mensajes. Justo después de reconectar una sesión que estuvo activa recientemente, ese primer intervalo usa el tiempo de espera normal de mensajes, más corto, en lugar del intervalo multiplicado por 4. OpenClaw puede responder automáticamente a los mensajes sin conexión que Baileys entrega al principio de esa reconexión, dentro del período de deduplicación de identificadores de mensajes entrantes; el inicio inicial mantiene la protección breve contra historiales obsoletos.
- Los tiempos del socket de Baileys se definen explícitamente en `web.whatsapp.*`: `keepAliveIntervalMs` (intervalo de ping de la aplicación), `connectTimeoutMs` (tiempo de espera del protocolo de enlace inicial) y `defaultQueryTimeoutMs` (esperas de consultas de Baileys, además de los tiempos de espera de OpenClaw para el envío saliente, la presencia y las confirmaciones de lectura entrantes).
- Los envíos salientes requieren un receptor de WhatsApp activo para la cuenta de destino; de lo contrario, fallan inmediatamente.
- Los envíos a grupos adjuntan metadatos nativos de menciones para los elementos `@+<digits>` y `@<digits>` (en el texto y los pies de contenido multimedia) cuando coinciden con los metadatos actuales de un participante, incluidos los grupos basados en LID.
- Se ignoran los chats de estado y difusión (`@status`, `@broadcast`).
- Los chats directos usan las reglas de sesión de mensajes directos (`session.dmScope`; el valor predeterminado `main` agrupa los mensajes directos en la sesión principal del agente). Las sesiones de grupo se aíslan por JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Los canales y boletines de WhatsApp pueden ser destinos salientes explícitos mediante su JID nativo `@newsletter`, con metadatos de sesión de canal (`agent:<agentId>:whatsapp:channel:<jid>`) en lugar de la semántica de mensajes directos.
- El transporte de WhatsApp Web respeta las variables de entorno de proxy estándar en el host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` y sus variantes en minúsculas). Prefiera la configuración de proxy del host a los ajustes específicos de cada canal.
- Con `messages.removeAckAfterReply` activado, OpenClaw elimina la reacción de confirmación cuando se entrega una respuesta visible.

## Llamar al solicitante actual con MeowCaller (experimental)

El Plugin puede exponer `whatsapp_call` en las interacciones del agente originadas en WhatsApp. Usa [MeowCaller](https://github.com/purpshell/meowcaller) para realizar una llamada de voz de WhatsApp al solicitante autorizado actual y reproducir un mensaje TTS de OpenClaw después de que responda. La herramienta no tiene ningún parámetro de número de destino, por lo que una instrucción no puede redirigir la llamada. Está desactivada de forma predeterminada.

<Warning>
MeowCaller es experimental, no tiene ninguna versión etiquetada y usa una sesión de dispositivo vinculado de whatsmeow emparejada por separado; no puede reutilizar las credenciales de Baileys del Plugin. La vinculación añade otro dispositivo vinculado a la misma cuenta de WhatsApp; escanee el código con la identidad que usa OpenClaw. El modo de número personal o chat consigo mismo no puede llamarse a sí mismo; use un número dedicado de OpenClaw para llamar a su número personal.
</Warning>

<Steps>
  <Step title="Activar las llamadas experimentales">

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

    El adaptador requiere un ejecutable `meowcaller` en el `PATH` del host del Gateway. Hasta que se fusione [la solicitud de incorporación de cambios n.º 7 de MeowCaller](https://github.com/purpshell/meowcaller/pull/7), compile la rama revisada:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Asegúrese de que `$HOME/.local/bin` esté en el `PATH` del servicio del Gateway. Esta revisión incluye comandos explícitos `pair` y `notify` exclusivamente de envío; `notify` no abre ningún micrófono, altavoz, dispositivo de vídeo ni captura de diagnóstico. No lo sustituya por el comando `play` de la CLI de ejemplo original.

  </Step>

  <Step title="Vincular el dispositivo de MeowCaller">

    Pida al agente de WhatsApp que compruebe la configuración de llamadas (la acción de estado de `whatsapp_call` informa del directorio de estado específico de la cuenta y del comando de vinculación). Para la cuenta predeterminada:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Ejecute este comando de forma interactiva, escanee el código QR desde **WhatsApp > Linked devices** y espere a que aparezca `MeowCaller linked device ready`. Mantenga `wa-voip.db` en privado: es la sesión de MeowCaller. Las cuentas que no sean la predeterminada obtienen su propia ruta de almacenamiento mediante la acción de estado; en Windows, ejecute el comando de PowerShell correspondiente.

  </Step>

  <Step title="Configurar TTS y llamar desde WhatsApp">

    Configure un [proveedor de TTS](/es/tools/tts) compatible con telefonía, reinicie el Gateway y envíe una solicitud como `Llámame y di que la compilación ha terminado.` La herramienta obtiene el remitente del contexto entrante de confianza, sintetiza un archivo WAV privado temporal, ejecuta MeowCaller durante un intervalo de llamada limitado y elimina después el archivo de audio. OpenClaw pasa explícitamente el almacenamiento de la cuenta, espera un estado de salida cero después de responder, reproducir y colgar, y considera que un tiempo de espera agotado o una salida distinta de cero constituyen una llamada fallida de la herramienta.

  </Step>
</Steps>

Límites: solo llamadas de audio salientes individuales, sin números de destino arbitrarios, sin autenticación compartida con la conexión de chat, sin llamadas a sí mismo desde el modo de número personal o chat consigo mismo, audio sintetizado limitado a 60 segundos, sin confirmación de audibilidad en el teléfono más allá de la finalización de las fases de respuesta, reproducción y finalización de MeowCaller, y OpenClaw detiene el proceso complementario después de un intervalo limitado de 115 a 175 segundos (que abarca las fases de conexión, respuesta, reproducción y cierre de MeowCaller).

## Solicitudes de aprobación

WhatsApp puede representar las solicitudes de aprobación de ejecución y de Plugins como reacciones `👍`/`👎`, controladas mediante la configuración de reenvío de aprobaciones de nivel superior:

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

`approvals.exec` y `approvals.plugin` son independientes; activar WhatsApp como canal solo vincula el transporte y no envía nada, salvo que la familia de aprobaciones correspondiente esté activada y se haya enrutado allí. El modo de sesión entrega aprobaciones con emojis nativos únicamente para las aprobaciones que se originan en WhatsApp. El modo de destino usa la canalización de reenvío compartida para destinos explícitos y no crea una distribución independiente a mensajes directos de aprobadores.

Las reacciones de aprobación de WhatsApp requieren aprobadores explícitos en `allowFrom` (o `"*"`). `defaultTo` establece los destinos predeterminados de los mensajes comunes, no una lista de aprobadores. Los comandos manuales `/approve` siguen pasando por la ruta normal de autorización de remitentes de WhatsApp antes de resolver la aprobación.

## Enlaces del Plugin y privacidad

Los mensajes entrantes de WhatsApp pueden contener información personal, números de teléfono, identificadores de grupos, nombres de remitentes y campos de correlación de sesiones. WhatsApp no difunde las cargas útiles del enlace entrante `message_received` a los Plugins, a menos que lo active:

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

Limite la activación a una sola cuenta mediante `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Active esta opción únicamente para Plugins en los que confíe para gestionar el contenido y los identificadores entrantes de WhatsApp.

## Control de acceso y activación

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.whatsapp.dmPolicy`:

    | Valor | Comportamiento |
    | --- | --- |
    | `pairing` (predeterminado) | Los remitentes desconocidos solicitan vinculación; el propietario la aprueba |
    | `allowlist` | Solo se admiten los remitentes incluidos en `allowFrom` |
    | `open` | Requiere que `allowFrom` incluya `"*"` |
    | `disabled` | Bloquea todos los mensajes directos |

    `allowFrom` acepta números con formato E.164 (normalizados internamente). Es únicamente una lista de control de acceso de remitentes de mensajes directos; no restringe los envíos salientes explícitos a JID de grupos ni a JID de canales `@newsletter`.

    Sustitución para varias cuentas: `channels.whatsapp.accounts.<id>.dmPolicy` (y `.allowFrom`) tienen prioridad sobre los valores predeterminados del canal para esa cuenta.

    Notas del entorno de ejecución:

    - los emparejamientos persisten en el almacén de permitidos del canal y se combinan con el valor configurado de `allowFrom`
    - la automatización programada y la selección alternativa de destinatarios de Heartbeat usan destinos de entrega explícitos o el valor configurado de `allowFrom`; las aprobaciones de emparejamiento por mensaje directo no convierten implícitamente a esos usuarios en destinatarios de Cron/Heartbeat
    - si no se configura ninguna lista de permitidos, el número propio vinculado se permite de forma predeterminada
    - OpenClaw nunca empareja automáticamente mensajes directos salientes `fromMe` (mensajes que usted se envía desde el dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupos y listas de permitidos">
    El acceso a grupos tiene dos capas:

    1. **Lista de permitidos de pertenencia a grupos** (`channels.whatsapp.groups`): si se omite `groups`, todos los grupos son aptos; si está presente, actúa como lista de grupos permitidos (`"*"` admite todos).
    2. **Política de remitentes de grupos** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` omite la lista de remitentes permitidos, `allowlist` exige una coincidencia en `groupAllowFrom` (o `*`) y `disabled` bloquea todos los mensajes entrantes de grupos.

    Si `groupAllowFrom` no está definido, las comprobaciones de remitentes recurren a `allowFrom` cuando contiene entradas. Las listas de remitentes permitidos se evalúan antes de la activación por mención/respuesta.

    Si no existe ningún bloque `channels.whatsapp`, durante la ejecución se recurre a `groupPolicy: "allowlist"` (con una advertencia en el registro), aunque `channels.defaults.groupPolicy` esté establecido en otro valor.

    <Note>
    La resolución de pertenencia a grupos tiene una protección para cuentas únicas: si solo hay una cuenta de WhatsApp configurada y su `accounts.<id>.groups` es un objeto vacío explícito (`{}`), se interpreta como "no establecido" y se recurre al mapa raíz `channels.whatsapp.groups`, en lugar de bloquear silenciosamente todos los grupos. Con 2 o más cuentas configuradas, un mapa de cuenta explícitamente vacío permanece vacío y no recurre al valor raíz; esto permite que una cuenta deshabilite intencionadamente todos los grupos sin afectar a las demás.
    </Note>

  </Tab>

  <Tab title="Menciones y /activation">
    De forma predeterminada, las respuestas en grupos requieren una mención. La detección de menciones incluye:

    - menciones explícitas de WhatsApp a la identidad del bot
    - patrones de expresiones regulares de menciones configurados (`agents.list[].groupChat.mentionPatterns`, con alternativa en `messages.groupChat.mentionPatterns`)
    - transcripciones de notas de voz entrantes para mensajes de grupos autorizados
    - detección implícita de respuesta al bot (el remitente de la respuesta coincide con la identidad del bot)

    Seguridad: citar/responder solo satisface el requisito de mención; **no** concede autorización al remitente. Con `groupPolicy: "allowlist"`, los remitentes que no estén en la lista de permitidos siguen bloqueados incluso si responden al mensaje de un usuario permitido.

    Comando de activación en el ámbito de la sesión: `/activation mention` o `/activation always`. Esto actualiza el estado de la sesión (no la configuración global) y está restringido al propietario.

  </Tab>
</Tabs>

## Vinculaciones ACP configuradas

WhatsApp admite vinculaciones ACP persistentes mediante `bindings[]` en el nivel superior:

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

Los chats directos coinciden con números E.164; los grupos coinciden con JID de grupos de WhatsApp. Las listas de grupos permitidos, la política de remitentes y los requisitos de mención/activación se ejecutan antes de que OpenClaw garantice que exista la sesión ACP vinculada. Una vinculación coincidente controla la ruta: los grupos de difusión no distribuyen ese turno a sesiones ordinarias de WhatsApp.

## Comportamiento del número personal y del chat con uno mismo

Cuando el número propio vinculado también está presente en `allowFrom`, se activan las protecciones del chat con uno mismo: se omiten las confirmaciones de lectura en los turnos del chat con uno mismo, se ignora el comportamiento de activación automática mediante JID de mención que generaría una notificación para usted mismo y las respuestas usan de forma predeterminada `[{identity.name}]` (o `[openclaw]`) cuando `messages.responsePrefix` no está definido.

## Normalización de mensajes y contexto

<AccordionGroup>
  <Accordion title="Envolvente de entrada y contexto de respuesta">
    Los mensajes entrantes se encapsulan en la envolvente de entrada compartida. Una respuesta citada agrega contexto con este formato:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Los metadatos de respuesta (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del remitente) se rellenan cuando están disponibles. Si el destino citado es contenido multimedia descargable, OpenClaw lo guarda mediante el almacén normal de contenido multimedia entrante y expone `MediaPath`/`MediaType` para que el agente pueda inspeccionarlo directamente en lugar de ver únicamente `<media:image>`.

  </Accordion>

  <Accordion title="Marcadores de contenido multimedia y extracción de ubicaciones/contactos">
    Los mensajes que solo contienen contenido multimedia se normalizan como marcadores: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Las notas de voz de grupos autorizados se transcriben antes de aplicar el requisito de mención cuando el cuerpo solo contiene `<media:audio>`, por lo que mencionar al bot en la nota de voz puede activar la respuesta. Si la transcripción sigue sin mencionar al bot, permanece en el historial pendiente del grupo en lugar del marcador sin procesar.

    Los cuerpos de ubicación se representan como texto conciso de coordenadas. Las etiquetas/comentarios de ubicación y los detalles de contactos/vCard se representan como metadatos no confiables delimitados, no como texto en línea del prompt.

  </Accordion>

  <Accordion title="Inyección del historial pendiente del grupo">
    Los mensajes de grupo sin procesar se almacenan temporalmente y se inyectan como contexto cuando finalmente se activa el bot.

    - límite predeterminado: `50`
    - configuración: `channels.whatsapp.historyLimit`, con alternativa en `messages.groupChat.historyLimit`
    - `0` lo deshabilita

    Marcadores de inyección: `[Chat messages since your last reply - for context]` y `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Confirmaciones de lectura">
    Están habilitadas de forma predeterminada para los mensajes entrantes aceptados. Para deshabilitarlas globalmente:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Sustitución por cuenta: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Los turnos del chat con uno mismo omiten las confirmaciones de lectura aunque estén habilitadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentación y contenido multimedia

<AccordionGroup>
  <Accordion title="Fragmentación de texto">
    - límite de fragmento predeterminado: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`; `newline` prioriza los límites de párrafo (líneas en blanco) y después recurre a una fragmentación segura por longitud

  </Accordion>

  <Accordion title="Comportamiento del contenido multimedia saliente">
    - admite cargas útiles de imágenes, vídeos, audio (nota de voz PTT) y documentos
    - el audio se envía como carga útil `audio` de Baileys con `ptt: true`, por lo que se representa como una nota de voz para pulsar y hablar; `audioAsVoice` se conserva en las cargas útiles de respuesta para que la salida de notas de voz TTS permanezca en esta ruta independientemente del formato de origen del proveedor
    - el audio Ogg/Opus nativo se envía como `audio/ogg; codecs=opus`; cualquier otro formato (incluida la salida MP3/WebM de TTS de Microsoft Edge) se transcodifica con `ffmpeg` a Ogg/Opus mono de 48 kHz antes de la entrega PTT
    - `/tts latest` envía la respuesta más reciente del asistente como una sola nota de voz y evita envíos repetidos de la misma respuesta; `/tts chat on|off|default` controla el TTS automático del chat actual
    - `gifPlayback: true` en los envíos de vídeo habilita la reproducción de GIF animados
    - `forceDocument`/`asDocument` envía las imágenes, los GIF y los vídeos salientes mediante la carga útil de documento de Baileys para evitar la compresión multimedia de WhatsApp, conservando el nombre de archivo y el tipo MIME resueltos
    - los pies de foto se aplican al primer elemento multimedia de una respuesta con varios elementos, excepto en las notas de voz PTT: el audio se envía primero sin pie de foto y después el pie de foto se envía como un mensaje de texto separado (los clientes de WhatsApp no representan de forma coherente los pies de foto de las notas de voz)
    - la fuente multimedia puede ser HTTP(S), `file://` o una ruta local

  </Accordion>

  <Accordion title="Límites de tamaño del contenido multimedia y comportamiento alternativo">
    - límite de almacenamiento entrante y límite de envío saliente: `channels.whatsapp.mediaMaxMb` (valor predeterminado: `50`)
    - sustitución por cuenta: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - las imágenes se optimizan automáticamente (redimensionamiento/ajuste de calidad) para respetar los límites, salvo que `forceDocument`/`asDocument` solicite la entrega como documento
    - si falla el envío de contenido multimedia, la alternativa para el primer elemento envía una advertencia de texto en lugar de descartar silenciosamente la respuesta

  </Accordion>
</AccordionGroup>

## Citas en las respuestas

`channels.whatsapp.replyToMode` controla las citas nativas en las respuestas (las respuestas salientes citan visiblemente el mensaje entrante):

| Valor             | Comportamiento                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (predeterminado) | Nunca cita; envía como mensaje simple                           |
| `"first"`         | Cita únicamente el primer fragmento de la respuesta saliente                      |
| `"all"`           | Cita todos los fragmentos de la respuesta saliente                               |
| `"batched"`       | Cita las respuestas agrupadas en cola; deja sin citar las respuestas inmediatas |

Sustitución por cuenta: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Nivel de reacciones

`channels.whatsapp.reactionLevel` controla la amplitud con la que el agente utiliza reacciones con emojis:

| Nivel                 | Reacciones de confirmación | Reacciones iniciadas por el agente  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | No            | No                         |
| `"ack"`               | Sí           | No                         |
| `"minimal"` (predeterminado) | Sí           | Sí, con criterios conservadores |
| `"extensive"`         | Sí           | Sí, se recomienda su uso   |

Sustitución por cuenta: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Reacciones de confirmación

`channels.whatsapp.ackReaction` envía una reacción inmediata al recibir un mensaje entrante, condicionada por `reactionLevel` (se omite cuando es `"off"`):

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

Notas: se envía inmediatamente después de aceptar el mensaje entrante (antes de la respuesta); si `ackReaction` está presente sin `emoji`, WhatsApp usa el emoji de identidad del agente al que se ha dirigido el mensaje y recurre a "👀" si no está disponible (omita `ackReaction` o establezca `emoji: ""` para no enviar confirmación); los fallos se registran, pero no bloquean la entrega de la respuesta; el modo de grupo `mentions` solo reacciona en turnos activados por una mención, mientras que la activación de grupo `always` omite esa comprobación; WhatsApp solo usa `channels.whatsapp.ackReaction` (el valor heredado `messages.ackReaction` no se aplica aquí).

## Reacciones de estado del ciclo de vida

Establezca `messages.statusReactions.enabled: true` para permitir que WhatsApp sustituya la reacción de confirmación durante un turno, en lugar de dejar un emoji de recepción estático, recorriendo estados como en cola, pensando, actividad de herramientas, Compaction, finalizado y error:

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

Notas: `channels.whatsapp.ackReaction` sigue controlando la aplicabilidad para mensajes directos y grupos; el estado en cola usa el mismo emoji efectivo que las reacciones de confirmación simples; WhatsApp dispone de un solo espacio de reacción del bot por mensaje, por lo que las actualizaciones del ciclo de vida sustituyen la reacción actual; `messages.removeAckAfterReply: true` elimina la reacción de estado final tras el periodo configurado de permanencia del estado finalizado/error; las categorías de emojis de herramientas incluyen `tool`, `coding`, `web`, `deploy`, `build` y `concierge`.

## Varias cuentas y credenciales

<AccordionGroup>
  <Accordion title="Selección de cuentas y valores predeterminados">
    Los identificadores de cuenta proceden de `channels.whatsapp.accounts`. La cuenta predeterminada es `default` si está presente; de lo contrario, se usa el primer identificador de cuenta configurado (ordenado alfabéticamente). Los identificadores de cuenta se normalizan internamente para su búsqueda.
  </Accordion>

  <Accordion title="Rutas de credenciales y compatibilidad heredada">
    - ruta de autenticación actual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (copia de seguridad: `creds.json.bak`)
    - la autenticación predeterminada heredada en `~/.openclaw/credentials/` todavía se reconoce y migra para los flujos de la cuenta predeterminada

  </Accordion>

  <Accordion title="Comportamiento al cerrar sesión">
    `openclaw channels logout --channel whatsapp [--account <id>]` borra el estado de autenticación de WhatsApp de esa cuenta. Cuando hay un Gateway accesible, el cierre de sesión detiene primero el proceso de escucha activo de esa cuenta, por lo que la sesión vinculada deja de recibir mensajes antes del siguiente reinicio. `openclaw channels remove --channel whatsapp` también detiene el proceso de escucha activo antes de deshabilitar o eliminar la configuración de la cuenta.

    En los directorios de autenticación heredados, se conserva `oauth.json` mientras se eliminan los archivos de autenticación de Baileys.

  </Accordion>
</AccordionGroup>

## Herramientas, acciones y escrituras de configuración

- La compatibilidad con herramientas del agente incluye la acción de reacción de WhatsApp (`react`).
- Controles de acciones: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (las acciones existentes tienen `true` como valor predeterminado), `channels.whatsapp.actions.calls` (valor predeterminado `false`; consulta MeowCaller más arriba).
- Las escrituras de configuración iniciadas por el canal están habilitadas de forma predeterminada; deshabilítalas mediante `channels.whatsapp.configWrites: false`.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Sin vincular (se requiere un código QR)">
    Síntoma: el estado del canal indica que no está vinculado.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Vinculado pero desconectado o en un bucle de reconexión">
    Síntoma: una cuenta vinculada presenta desconexiones o intentos de reconexión repetidos.

    Las cuentas inactivas pueden permanecer conectadas más allá del tiempo de espera normal de los mensajes; el monitor solo reinicia cuando se detiene la actividad del transporte de WhatsApp Web, se cierra el socket o la actividad en el nivel de la aplicación permanece inactiva más allá del intervalo de seguridad ampliado (consulta Modelo de ejecución más arriba).

    Si los registros muestran repetidamente `status=408 Request Time-out Connection was lost`, ajusta los tiempos del socket de Baileys en `web.whatsapp`. Empieza reduciendo `keepAliveIntervalMs` por debajo del tiempo de espera por inactividad de tu red y aumentando `connectTimeoutMs` en conexiones lentas o con pérdidas:

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

    Si el bucle persiste después de corregir la conectividad del host y los tiempos, crea una copia de seguridad del directorio de autenticación de la cuenta y vuelve a vincularla:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Si `~/.openclaw/logs/whatsapp-health.log` indica `Gateway inactive`, pero tanto `openclaw gateway status` como `openclaw channels status --probe` muestran un estado correcto, ejecuta `openclaw doctor`. En Linux, doctor advierte sobre entradas heredadas de crontab que invocan el script retirado `~/.openclaw/bin/ensure-whatsapp.sh`; elimina esas entradas con `crontab -e`: Cron puede carecer del entorno del bus de usuario de systemd y hacer que ese script antiguo informe incorrectamente del estado del Gateway.

  </Accordion>

  <Accordion title="El inicio de sesión mediante QR agota el tiempo de espera detrás de un proxy">
    Síntoma: `openclaw channels login --channel whatsapp` falla antes de mostrar un código QR utilizable con `status=408 Request Time-out` o una desconexión del socket TLS.

    El inicio de sesión de WhatsApp Web utiliza el entorno de proxy estándar del host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes en minúsculas, `NO_PROXY`). Verifica que el proceso del Gateway herede el entorno del proxy y que `NO_PROXY` no coincida con `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="No hay un proceso de escucha activo al enviar">
    Los envíos salientes fallan de inmediato cuando no existe un proceso de escucha activo del Gateway para la cuenta de destino. Confirma que el Gateway esté en ejecución y que la cuenta esté vinculada.
  </Accordion>

  <Accordion title="La respuesta aparece en la transcripción, pero no en WhatsApp">
    Las filas de la transcripción registran lo que generó el agente; la entrega en WhatsApp se comprueba por separado. OpenClaw solo considera enviada una respuesta automática después de que Baileys devuelve un identificador de mensaje saliente para al menos un envío visible de texto o contenido multimedia.

    Las reacciones de confirmación son acuses de recibo independientes y anteriores a la respuesta: una reacción correcta no demuestra que se haya aceptado la respuesta posterior de texto o contenido multimedia. Comprueba los registros del Gateway en busca de `auto-reply delivery failed` o `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran inesperadamente">
    Comprueba, en este orden: `groupPolicy`, `groupAllowFrom`/`allowFrom`, las entradas de la lista de permitidos de `groups`, el control mediante menciones (`requireMention` + patrones de mención) y las claves duplicadas en `openclaw.json` (las entradas posteriores de JSON5 sobrescriben las anteriores; mantén un único `groupPolicy` por ámbito).

    Si `channels.whatsapp.groups` está presente, WhatsApp aún puede observar mensajes de otros grupos, pero OpenClaw los descarta antes del enrutamiento de sesiones. Añade el JID del grupo a `channels.whatsapp.groups` o añade `groups["*"]` para admitir todos los grupos mientras mantienes la autorización de remitentes mediante `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Advertencia sobre el entorno de ejecución Bun">
    El entorno de ejecución del Gateway de WhatsApp debe usar Node. Bun se marca como incompatible con el funcionamiento estable del Gateway de WhatsApp y Telegram.
  </Accordion>
</AccordionGroup>

## Indicaciones del sistema

WhatsApp admite indicaciones del sistema al estilo de Telegram para grupos y chats directos mediante los mapas `groups` y `direct`.

Resolución para los mensajes de grupo: primero se determina el mapa `groups` efectivo. Si la cuenta define su propia clave `groups`, esta reemplaza por completo el mapa `groups` raíz (sin combinación profunda). A continuación, la búsqueda de indicaciones se realiza en ese único mapa resultante:

1. **Indicación específica del grupo** (`groups["<groupId>"].systemPrompt`): se utiliza cuando existe la entrada del grupo **y** su clave `systemPrompt` está definida. Una cadena vacía (`""`) suprime el comodín y no aplica ninguna indicación.
2. **Indicación comodín del grupo** (`groups["*"].systemPrompt`): se utiliza cuando la entrada específica del grupo no existe o existe sin una clave `systemPrompt`.

La resolución para mensajes directos sigue el mismo patrón con el mapa `direct` y `direct["*"]`.

<Note>
`dms` sigue siendo el contenedor ligero de reemplazos del historial por mensaje directo (`dms.<id>.historyLimit`). Los reemplazos de indicaciones se encuentran en `direct`.
</Note>

<Note>
Este comportamiento en el que la cuenta reemplaza la raíz para resolver indicaciones es un reemplazo superficial simple: cualquier clave `groups`/`direct` de la cuenta, incluido un objeto vacío explícito, reemplaza el mapa raíz. Es diferente de la comprobación de la lista de permitidos para la pertenencia a grupos descrita anteriormente, que dispone de una protección para cuentas únicas ante un `groups: {}` vacío por accidente.
</Note>

**Diferencia respecto a Telegram:** Telegram suprime el mapa `groups` raíz para cada cuenta de una configuración con varias cuentas (incluso para las cuentas sin un mapa `groups` propio) para impedir que un bot reciba mensajes de grupos a los que no pertenece. WhatsApp no aplica esa protección: cualquier cuenta sin un reemplazo propio hereda los mapas `groups`/`direct` raíz, independientemente del número de cuentas. En una configuración de WhatsApp con varias cuentas, define explícitamente el mapa completo en cada cuenta si quieres indicaciones específicas por cuenta.

Comportamiento importante:

- `channels.whatsapp.groups` es tanto un mapa de configuración por grupo como la lista de permitidos de grupos en el nivel del chat. En el ámbito raíz o de cuenta, `groups["*"]` significa «se admiten todos los grupos» para ese ámbito.
- Añade un `systemPrompt` comodín únicamente cuando ya quieras que ese ámbito admita todos los grupos. Para mantener como elegibles solo un conjunto fijo de identificadores de grupo, repite la indicación en cada entrada incluida explícitamente en la lista de permitidos en lugar de usar `groups["*"]`.
- La admisión de grupos y la autorización de remitentes son comprobaciones independientes. `groups["*"]` amplía los grupos que llegan al procesamiento de grupos; no autoriza a todos los remitentes de esos grupos, ya que eso sigue bajo el control de `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` no tiene un efecto secundario equivalente para los mensajes directos: `direct["*"]` solo proporciona una configuración predeterminada después de que `dmPolicy`, junto con `allowFrom` o las reglas del almacén de emparejamientos, ya haya admitido el mensaje directo.

Ejemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Úsalo solo si se deben admitir todos los grupos en el ámbito raíz.
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
            // Esta cuenta define su propio mapa groups, por lo que el mapa groups
            // raíz se reemplaza por completo. Para conservar un comodín, define
            // también "*" explícitamente aquí.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Céntrate en la gestión de proyectos.",
            },
            // Úsalo solo si se deben admitir todos los grupos en esta cuenta.
            "*": { systemPrompt: "Indicación predeterminada para los grupos de trabajo." },
          },
          direct: {
            // Esta cuenta define su propio mapa direct, por lo que las entradas
            // direct raíz se reemplazan por completo. Para conservar un comodín,
            // define también "*" explícitamente aquí.
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

| Área                    | Campos                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Acceso                  | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Entrega                 | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| Varias cuentas          | `accounts.<id>.enabled`, `accounts.<id>.authDir` y otros reemplazos por cuenta                                 |
| Operaciones             | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Comportamiento de sesión | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                  |
| Indicaciones            | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Contenido relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
