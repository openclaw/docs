---
read_when:
    - Trabajar en el comportamiento del canal WhatsApp/web o el enrutamiento de la bandeja de entrada
summary: Soporte del canal WhatsApp, controles de acceso, comportamiento de entrega y operaciones
title: WhatsApp
x-i18n:
    generated_at: "2026-07-05T17:39:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

Estado: listo para producción mediante WhatsApp Web (Baileys). El gateway es propietario de las sesiones vinculadas; no hay ningún canal de WhatsApp de Twilio separado.

## Instalación

`openclaw onboard` y `openclaw channels add --channel whatsapp` solicitan instalar el plugin la primera vez que lo seleccionas; `openclaw channels login --channel whatsapp` ofrece el mismo flujo de instalación si falta el plugin. Los checkouts de desarrollo usan la ruta local del plugin; las instalaciones estables/beta instalan primero `@openclaw/whatsapp` desde ClawHub, con fallback a npm. El runtime de WhatsApp se distribuye fuera del paquete npm principal de OpenClaw, por lo que sus dependencias de runtime permanecen con el plugin externo. Instalación manual:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Usa el paquete npm sin prefijo (`@openclaw/whatsapp`) solo para el fallback del registro; fija una versión exacta solo para una instalación reproducible.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política de DM predeterminada es emparejamiento para remitentes desconocidos.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
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

    El inicio de sesión es solo con QR. En hosts remotos o sin interfaz gráfica, ten una ruta fiable para entregar el QR activo al teléfono antes de iniciar sesión; los QR renderizados en la terminal, capturas de pantalla o adjuntos de chat pueden caducar en tránsito.

    Para una cuenta específica:

```bash
openclaw channels login --channel whatsapp --account work
```

    Para adjuntar un directorio de autenticación existente/personalizado antes de iniciar sesión:

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

  <Step title="Aprobar la primera solicitud de emparejamiento (modo de emparejamiento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Las solicitudes de emparejamiento caducan después de 1 hora; las solicitudes pendientes tienen un límite de 3 por cuenta.

  </Step>
</Steps>

<Note>
Se recomienda un número de WhatsApp separado (la configuración y los metadatos están optimizados para ello), pero las configuraciones con número personal/autochat son totalmente compatibles.
</Note>

## Patrones de despliegue

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    - identidad de WhatsApp separada para OpenClaw
    - listas de permitidos de DM y límites de enrutamiento más claros
    - menor probabilidad de confusión por autochat

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

  <Accordion title="Fallback de número personal">
    La incorporación admite el modo de número personal y escribe una base compatible con autochat: `dmPolicy: "allowlist"`, `allowFrom` con tu propio número incluido, `selfChatMode: true`. Las protecciones de autochat en runtime se basan en el número propio vinculado más `allowFrom`.
  </Accordion>
</AccordionGroup>

## Modelo de runtime

- El Gateway es propietario del socket de WhatsApp y del bucle de reconexión.
- Un watchdog rastrea dos señales de forma independiente: la actividad sin procesar del transporte de WhatsApp Web y la actividad de mensajes de la aplicación. Una sesión silenciosa pero conectada no se reinicia solo porque no haya llegado ningún mensaje recientemente; fuerza la reconexión solo cuando los frames de transporte dejan de llegar durante una ventana interna fija (no configurable por el usuario) o los mensajes de la aplicación permanecen en silencio más allá de 4 veces el timeout normal de mensajes. Justo después de una reconexión de una sesión recientemente activa, esa primera ventana usa el timeout normal de mensajes más corto en lugar de la ventana de 4 veces. OpenClaw puede responder automáticamente a mensajes sin conexión que Baileys entrega al inicio de esa reconexión, limitado por la duración de deduplicación de los ID de mensajes entrantes; el arranque inicial conserva la protección corta contra historial obsoleto.
- Los tiempos del socket de Baileys son explícitos bajo `web.whatsapp.*`: `keepAliveIntervalMs` (intervalo de ping de la aplicación), `connectTimeoutMs` (timeout del handshake de apertura), `defaultQueryTimeoutMs` (esperas de consultas de Baileys, además de los timeouts de envío/presencia salientes y confirmación de lectura entrante de OpenClaw).
- Los envíos salientes requieren un listener de WhatsApp activo para la cuenta de destino; de lo contrario, los envíos fallan rápidamente.
- Los envíos a grupos adjuntan metadatos nativos de mención para tokens `@+<digits>` y `@<digits>` (en texto y pies de medios) cuando el token coincide con los metadatos actuales de participantes, incluidos grupos respaldados por LID.
- Los chats de estado y difusión (`@status`, `@broadcast`) se ignoran.
- Los chats directos usan reglas de sesión de DM (`session.dmScope`; el valor predeterminado `main` colapsa los DM en la sesión principal del agente). Las sesiones de grupo se aíslan por JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Los canales/boletines de WhatsApp pueden ser destinos salientes explícitos mediante su JID nativo `@newsletter`, usando metadatos de sesión de canal (`agent:<agentId>:whatsapp:channel:<jid>`) en lugar de semántica de DM.
- El transporte de WhatsApp Web respeta las variables de entorno de proxy estándar en el host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, variantes en minúsculas). Prefiere la configuración de proxy a nivel de host sobre los ajustes por canal.
- Con `messages.removeAckAfterReply` habilitado, OpenClaw borra la reacción de acuse una vez que se entrega una respuesta visible.

## Llamar al solicitante actual con MeowCaller (experimental)

El plugin puede exponer `whatsapp_call` en turnos de agente originados en WhatsApp. Usa [MeowCaller](https://github.com/purpshell/meowcaller) para realizar una llamada de voz de WhatsApp al solicitante autorizado actual y reproducir un mensaje TTS de OpenClaw después de que responda. La herramienta no tiene parámetro de número de destino, por lo que un prompt no puede redirigir la llamada. Deshabilitado de forma predeterminada.

<Warning>
MeowCaller es experimental, no tiene release etiquetado y usa una sesión de dispositivo vinculado whatsmeow emparejada por separado: no puede reutilizar las credenciales de Baileys del plugin. El emparejamiento añade otro dispositivo vinculado a la misma cuenta de WhatsApp; escanea con la identidad usada por OpenClaw. El modo de número personal/autochat no puede llamarse a sí mismo; usa un número dedicado de OpenClaw para llamar a tu número personal.
</Warning>

<Steps>
  <Step title="Habilitar llamadas experimentales">

    Añade `actions.calls: true` a la configuración del canal de WhatsApp y reinicia el Gateway:

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

    El adaptador espera un ejecutable `meowcaller` en el `PATH` del host del Gateway. Hasta que se fusione [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7), compila la rama revisada:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Asegúrate de que `$HOME/.local/bin` esté en el `PATH` del servicio del Gateway. Esta revisión tiene comandos explícitos `pair` y `notify` solo de envío; `notify` no abre micrófono, altavoz, dispositivo de vídeo ni captura de diagnóstico. No sustituyas el comando `play` de la CLI de ejemplo upstream.

  </Step>

  <Step title="Emparejar el dispositivo vinculado de MeowCaller">

    Pide al agente de WhatsApp que compruebe la configuración de llamadas (la acción de estado `whatsapp_call` informa del directorio de estado específico de la cuenta y del comando de emparejamiento). Para la cuenta predeterminada:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Ejecuta esto de forma interactiva, escanea el QR desde **WhatsApp > Dispositivos vinculados** y espera `MeowCaller linked device ready`. Mantén `wa-voip.db` privado: es la sesión de MeowCaller. Las cuentas no predeterminadas obtienen su propia ruta de almacén desde la acción de estado; en Windows, ejecuta su comando de PowerShell.

  </Step>

  <Step title="Configurar TTS y llamar desde WhatsApp">

    Configura un [proveedor TTS](/es/tools/tts) compatible con telefonía, reinicia el Gateway y luego envía una solicitud como `Call me and say the build finished.` La herramienta resuelve el remitente desde contexto entrante de confianza, sintetiza un archivo WAV temporal privado, ejecuta MeowCaller durante una ventana de llamada acotada y elimina el archivo de audio después. OpenClaw pasa explícitamente el almacén de la cuenta, espera un estado de salida cero después de responder/reproducir/colgar y trata un timeout o una salida distinta de cero como una llamada de herramienta fallida.

  </Step>
</Steps>

Límites: solo llamadas de audio salientes uno a uno, sin números de destino arbitrarios, sin autenticación compartida con la conexión de chat, sin autollamadas desde el modo de número personal/autochat, audio sintetizado limitado a 60 segundos, sin confirmación de audibilidad del lado del teléfono más allá de la finalización de respuesta/reproducción/colgado de MeowCaller, y OpenClaw detiene el proceso complementario después de una ventana acotada de 115-175 segundos (que cubre las fases de conexión, respuesta, reproducción y apagado de MeowCaller).

## Prompts de aprobación

WhatsApp puede renderizar prompts de aprobación de ejecución y plugin como reacciones `👍`/`👎`, controladas por la configuración de reenvío de aprobaciones de nivel superior:

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

`approvals.exec` y `approvals.plugin` son independientes; habilitar WhatsApp como canal solo vincula el transporte y no envía nada salvo que la familia de aprobaciones correspondiente esté habilitada y enrutada allí. El modo de sesión entrega aprobaciones nativas con emoji solo para aprobaciones que se originan en WhatsApp. El modo de destino usa la canalización compartida de reenvío para destinos explícitos y no crea un fanout de DM de aprobador separado.

Las reacciones de aprobación de WhatsApp requieren aprobadores explícitos en `allowFrom` (o `"*"`). `defaultTo` establece destinos predeterminados ordinarios de mensajes, no una lista de aprobadores. Los comandos manuales `/approve` siguen pasando por la ruta normal de autorización de remitente de WhatsApp antes de la resolución de la aprobación.

## Hooks de Plugin y privacidad

Los mensajes entrantes de WhatsApp pueden llevar contenido personal, números de teléfono, identificadores de grupo, nombres de remitentes y campos de correlación de sesión. WhatsApp no difunde payloads de hook `message_received` entrantes a plugins salvo que lo actives:

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

Limita la activación a una cuenta bajo `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Habilita esto solo para plugins en los que confíes con contenido e identificadores entrantes de WhatsApp.

## Control de acceso y activación

<Tabs>
  <Tab title="Política de DM">
    `channels.whatsapp.dmPolicy`:

    | Valor | Comportamiento |
    | --- | --- |
    | `pairing` (predeterminado) | Los remitentes desconocidos solicitan emparejamiento; el propietario aprueba |
    | `allowlist` | Solo se admiten remitentes de `allowFrom` |
    | `open` | Requiere que `allowFrom` incluya `"*"` |
    | `disabled` | Bloquea todos los DM |

    `allowFrom` acepta números de estilo E.164 (normalizados internamente). Es solo una lista de control de acceso de remitentes de DM; no bloquea envíos salientes explícitos a JID de grupos ni JID de canal `@newsletter`.

    Anulación para varias cuentas: `channels.whatsapp.accounts.<id>.dmPolicy` (y `.allowFrom`) tienen prioridad sobre los valores predeterminados de nivel de canal para esa cuenta.

    Notas de runtime:

    - los emparejamientos persisten en el almacén de permitidos del canal y se fusionan con el `allowFrom` configurado
    - la automatización programada y la reserva de destinatarios de Heartbeat usan destinos de entrega explícitos o el `allowFrom` configurado; las aprobaciones de emparejamiento por DM no son destinatarios implícitos de Cron/Heartbeat
    - si no se configura ninguna lista de permitidos, el número propio vinculado se permite de forma predeterminada
    - OpenClaw nunca empareja automáticamente DMs salientes `fromMe` (mensajes que te envías a ti mismo desde el dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupos y listas de permitidos">
    El acceso a grupos tiene dos capas:

    1. **Lista de permitidos de pertenencia a grupos** (`channels.whatsapp.groups`): si se omite `groups`, todos los grupos son elegibles; si está presente, actúa como una lista de permitidos de grupos (`"*"` admite todos).
    2. **Política de remitentes de grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` omite la lista de permitidos de remitentes, `allowlist` requiere una coincidencia con `groupAllowFrom` (o `*`), `disabled` bloquea toda entrada de grupo.

    Si `groupAllowFrom` no está definido, las comprobaciones de remitente recurren a `allowFrom` cuando tiene entradas. Las listas de permitidos de remitentes se evalúan antes de la activación por mención/respuesta.

    Si no existe ningún bloque `channels.whatsapp`, el tiempo de ejecución recurre a `groupPolicy: "allowlist"` (con un registro de advertencia), incluso si `channels.defaults.groupPolicy` está definido con otro valor.

    <Note>
    La resolución de pertenencia a grupos tiene una red de seguridad para una sola cuenta: si solo hay una cuenta de WhatsApp configurada y su `accounts.<id>.groups` es un objeto vacío explícito (`{}`), se trata como "no definido" y recurre al mapa raíz `channels.whatsapp.groups`, en lugar de bloquear silenciosamente todos los grupos. Con 2 o más cuentas configuradas, un mapa de cuenta vacío explícito permanece vacío y no recurre al valor raíz — esto permite que una cuenta desactive intencionalmente todos los grupos sin afectar a sus cuentas hermanas.
    </Note>

  </Tab>

  <Tab title="Menciones y /activation">
    Las respuestas de grupo requieren una mención de forma predeterminada. La detección de menciones incluye:

    - menciones explícitas de WhatsApp a la identidad del bot
    - patrones regex de mención configurados (`agents.list[].groupChat.mentionPatterns`, reserva `messages.groupChat.mentionPatterns`)
    - transcripciones de notas de voz entrantes para mensajes de grupo autorizados
    - detección implícita de respuesta al bot (el remitente de la respuesta coincide con la identidad del bot)

    Seguridad: citar/responder solo satisface el control de mención; **no** concede autorización al remitente. Con `groupPolicy: "allowlist"`, los remitentes que no estén en la lista de permitidos siguen bloqueados incluso al responder al mensaje de un usuario permitido.

    Comando de activación a nivel de sesión: `/activation mention` o `/activation always`. Esto actualiza el estado de la sesión (no la configuración global) y está restringido al propietario.

  </Tab>
</Tabs>

## Enlaces ACP configurados

WhatsApp admite enlaces ACP persistentes mediante `bindings[]` de nivel superior:

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

Los chats directos coinciden con números E.164; los grupos coinciden con JIDs de grupo de WhatsApp. Las listas de permitidos de grupos, la política de remitentes y los controles de mención/activación se ejecutan antes de que OpenClaw garantice que exista la sesión ACP vinculada. Un enlace coincidente posee la ruta: los grupos de difusión no distribuyen ese turno a sesiones ordinarias de WhatsApp.

## Comportamiento de número personal y chat propio

Cuando el número propio vinculado también está presente en `allowFrom`, se activan las protecciones de chat propio: se omiten confirmaciones de lectura para turnos de chat propio, se ignora el comportamiento de activación automática por JID de mención que te haría ping a ti mismo, y las respuestas predeterminadas usan `[{identity.name}]` (o `[openclaw]`) cuando `messages.responsePrefix` no está definido.

## Normalización de mensajes y contexto

<AccordionGroup>
  <Accordion title="Envoltorio entrante y contexto de respuesta">
    Los mensajes entrantes se envuelven en el envoltorio entrante compartido. Una respuesta citada agrega contexto con esta forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Los metadatos de respuesta (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del remitente) se rellenan cuando están disponibles. Si el destino citado es contenido multimedia descargable, OpenClaw lo guarda mediante el almacén normal de multimedia entrante y expone `MediaPath`/`MediaType` para que el agente pueda inspeccionarlo directamente en lugar de ver solo `<media:image>`.

  </Accordion>

  <Accordion title="Marcadores de posición multimedia y extracción de ubicación/contacto">
    Los mensajes solo multimedia se normalizan a marcadores de posición: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Las notas de voz de grupo autorizadas se transcriben antes del control de mención cuando el cuerpo es solo `<media:audio>`, de modo que decir la mención del bot en la nota de voz puede activar la respuesta. Si la transcripción aun así no menciona al bot, permanece en el historial de grupo pendiente en lugar del marcador de posición sin procesar.

    Los cuerpos de ubicación se representan como texto breve de coordenadas. Las etiquetas/comentarios de ubicación y los detalles de contacto/vCard se representan como metadatos no confiables en bloque delimitado, no como texto de prompt en línea.

  </Accordion>

  <Accordion title="Inyección de historial de grupo pendiente">
    Los mensajes de grupo no procesados se almacenan en búfer y se inyectan como contexto cuando finalmente se activa el bot.

    - límite predeterminado: `50`
    - configuración: `channels.whatsapp.historyLimit`, reserva `messages.groupChat.historyLimit`
    - `0` desactiva

    Marcadores de inyección: `[Chat messages since your last reply - for context]` y `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Confirmaciones de lectura">
    Activadas de forma predeterminada para mensajes entrantes aceptados. Desactivar globalmente:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Anulación por cuenta: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Los turnos de chat propio omiten confirmaciones de lectura incluso cuando están activadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentación y multimedia

<AccordionGroup>
  <Accordion title="Fragmentación de texto">
    - límite de fragmento predeterminado: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`; `newline` prefiere límites de párrafo (líneas en blanco) y luego recurre a fragmentación segura por longitud

  </Accordion>

  <Accordion title="Comportamiento de multimedia saliente">
    - admite cargas útiles de imagen, video, audio (nota de voz PTT) y documento
    - el audio se envía como la carga útil `audio` de Baileys con `ptt: true`, representándose como una nota de voz push-to-talk; `audioAsVoice` se conserva en cargas útiles de respuesta para que la salida de nota de voz TTS permanezca en esta ruta independientemente del formato de origen del proveedor
    - el audio Ogg/Opus nativo se envía como `audio/ogg; codecs=opus`; cualquier otra cosa (incluida la salida MP3/WebM de TTS de Microsoft Edge) se transcodifica con `ffmpeg` a Ogg/Opus mono de 48 kHz antes de la entrega PTT
    - `/tts latest` envía la última respuesta del asistente como una nota de voz y suprime envíos repetidos para la misma respuesta; `/tts chat on|off|default` controla el TTS automático para el chat actual
    - `gifPlayback: true` en envíos de video habilita la reproducción de GIF animado
    - `forceDocument`/`asDocument` enruta imágenes, GIFs y videos salientes mediante la carga útil de documento de Baileys para evitar la compresión multimedia de WhatsApp, conservando el nombre de archivo resuelto y el tipo MIME
    - los pies de foto se aplican al primer elemento multimedia en una respuesta con varios medios, excepto las notas de voz PTT: el audio se envía primero sin pie de foto y luego el pie de foto se envía como un mensaje de texto separado (los clientes de WhatsApp no renderizan de forma consistente los pies de foto de notas de voz)
    - la fuente multimedia puede ser HTTP(S), `file://` o una ruta local

  </Accordion>

  <Accordion title="Límites de tamaño de multimedia y comportamiento de reserva">
    - límite de guardado entrante y límite de envío saliente: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - anulación por cuenta: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - las imágenes se optimizan automáticamente (barrido de redimensionamiento/calidad) para ajustarse a los límites salvo que `forceDocument`/`asDocument` solicite entrega como documento
    - ante un fallo de envío multimedia, la reserva del primer elemento envía una advertencia de texto en lugar de descartar la respuesta silenciosamente

  </Accordion>
</AccordionGroup>

## Citas de respuesta

`channels.whatsapp.replyToMode` controla las citas de respuesta nativas (las respuestas salientes citan visiblemente el mensaje entrante):

| Valor             | Comportamiento                                                |
| ----------------- | ------------------------------------------------------------- |
| `"off"` (predeterminado) | Nunca citar; enviar como mensaje simple              |
| `"first"`         | Citar solo el primer fragmento de respuesta saliente          |
| `"all"`           | Citar cada fragmento de respuesta saliente                    |
| `"batched"`       | Citar respuestas en cola por lotes; dejar sin cita las respuestas inmediatas |

Anulación por cuenta: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Nivel de reacción

`channels.whatsapp.reactionLevel` controla con qué amplitud el agente usa reacciones emoji:

| Nivel                 | Reacciones de acuse | Reacciones iniciadas por el agente |
| --------------------- | ------------------- | ---------------------------------- |
| `"off"`               | No                  | No                                 |
| `"ack"`               | Sí                  | No                                 |
| `"minimal"` (predeterminado) | Sí           | Sí, guía conservadora              |
| `"extensive"`         | Sí                  | Sí, guía fomentada                 |

Anulación por cuenta: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Reacciones de acuse

`channels.whatsapp.ackReaction` envía una reacción inmediata al recibir un entrante, controlada por `reactionLevel` (suprimida cuando es `"off"`):

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

Notas: se envía inmediatamente después de que se acepta el entrante (antes de la respuesta); si `ackReaction` está presente sin `emoji`, WhatsApp usa el emoji de identidad del agente enrutado y recurre a "👀" (omite `ackReaction` o define `emoji: ""` para no enviar acuse); los fallos se registran, pero no bloquean la entrega de la respuesta; el modo de grupo `mentions` reacciona solo en turnos activados por mención, mientras que la activación de grupo `always` omite esa comprobación; WhatsApp usa solo `channels.whatsapp.ackReaction` (`messages.ackReaction` heredado no se aplica aquí).

## Reacciones de estado del ciclo de vida

Define `messages.statusReactions.enabled: true` para permitir que WhatsApp reemplace la reacción de acuse durante un turno en lugar de dejar un emoji de recibo estático, recorriendo estados como en cola, pensando, actividad de herramienta, Compaction, completado y error:

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

Notas: `channels.whatsapp.ackReaction` sigue controlando la elegibilidad para mensajes directos y grupos; el estado en cola usa el mismo emoji efectivo que las reacciones de acuse simples; WhatsApp tiene una ranura de reacción de bot por mensaje, por lo que las actualizaciones del ciclo de vida reemplazan la reacción actual in situ; `messages.removeAckAfterReply: true` borra la reacción de estado final después de la retención configurada para completado/error; las categorías de emoji de herramienta incluyen `tool`, `coding`, `web`, `deploy`, `build` y `concierge`.

## Varias cuentas y credenciales

<AccordionGroup>
  <Accordion title="Selección de cuenta y valores predeterminados">
    Los ids de cuenta provienen de `channels.whatsapp.accounts`. La selección de cuenta predeterminada es `default` si está presente; de lo contrario, el primer id de cuenta configurado (ordenado alfabéticamente). Los ids de cuenta se normalizan internamente para la búsqueda.
  </Accordion>

  <Accordion title="Rutas de credenciales y compatibilidad heredada">
    - ruta de autenticación actual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (copia de seguridad: `creds.json.bak`)
    - la autenticación predeterminada heredada en `~/.openclaw/credentials/` todavía se reconoce/migra para flujos de cuenta predeterminada

  </Accordion>

  <Accordion title="Comportamiento de cierre de sesión">
    `openclaw channels logout --channel whatsapp [--account <id>]` borra el estado de autenticación de WhatsApp para esa cuenta. Cuando se puede acceder a un Gateway, el cierre de sesión detiene primero el listener en vivo para esa cuenta, de modo que la sesión vinculada deja de recibir mensajes antes del próximo reinicio. `openclaw channels remove --channel whatsapp` también detiene el listener en vivo antes de deshabilitar o eliminar la configuración de la cuenta.

    En directorios de autenticación heredados, `oauth.json` se conserva mientras se eliminan los archivos de autenticación de Baileys.

  </Accordion>
</AccordionGroup>

## Herramientas, acciones y escrituras de configuración

- La compatibilidad con herramientas del agente incluye la acción de reacción de WhatsApp (`react`).
- Compuertas de acciones: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (las acciones existentes tienen `true` de forma predeterminada), `channels.whatsapp.actions.calls` (valor predeterminado `false`, consulta MeowCaller arriba).
- Las escrituras de configuración iniciadas por el canal están habilitadas de forma predeterminada; deshabilítalas mediante `channels.whatsapp.configWrites: false`.

## Solución de problemas

<AccordionGroup>
  <Accordion title="No vinculado (se requiere QR)">
    Síntoma: el estado del canal informa que no está vinculado.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Vinculado pero desconectado / bucle de reconexión">
    Síntoma: cuenta vinculada con desconexiones o intentos de reconexión repetidos.

    Las cuentas silenciosas pueden permanecer conectadas más allá del tiempo de espera normal de mensajes; el watchdog reinicia solo cuando se detiene la actividad del transporte de WhatsApp Web, se cierra el socket o la actividad de nivel de aplicación permanece en silencio más allá de la ventana de seguridad más larga (consulta Modelo de tiempo de ejecución arriba).

    Si los registros muestran repetidamente `status=408 Request Time-out Connection was lost`, ajusta los tiempos del socket de Baileys en `web.whatsapp`. Empieza por acortar `keepAliveIntervalMs` por debajo del tiempo de espera por inactividad de tu red y aumentar `connectTimeoutMs` en enlaces lentos o con pérdidas:

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

    Corrección:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Si el bucle persiste después de corregir la conectividad del host y los tiempos, haz una copia de seguridad del directorio de autenticación de la cuenta y vuelve a vincularla:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Si `~/.openclaw/logs/whatsapp-health.log` dice `Gateway inactive`, pero `openclaw gateway status` y `openclaw channels status --probe` muestran ambos un estado correcto, ejecuta `openclaw doctor`. En Linux, doctor advierte sobre entradas heredadas de crontab que invocan el script retirado `~/.openclaw/bin/ensure-whatsapp.sh`; elimina esas entradas con `crontab -e`: cron puede carecer del entorno de bus de usuario de systemd y hacer que ese script antiguo informe incorrectamente del estado del Gateway.

  </Accordion>

  <Accordion title="El inicio de sesión con QR agota el tiempo de espera detrás de un proxy">
    Síntoma: `openclaw channels login --channel whatsapp` falla antes de mostrar un QR utilizable con `status=408 Request Time-out` o una desconexión de socket TLS.

    El inicio de sesión de WhatsApp Web usa el entorno de proxy estándar del host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes en minúsculas, `NO_PROXY`). Verifica que el proceso del Gateway herede el entorno de proxy y que `NO_PROXY` no coincida con `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="No hay listener activo al enviar">
    Los envíos salientes fallan rápidamente cuando no existe un listener de Gateway activo para la cuenta de destino. Confirma que el Gateway esté en ejecución y que la cuenta esté vinculada.
  </Accordion>

  <Accordion title="La respuesta aparece en la transcripción pero no en WhatsApp">
    Las filas de transcripción registran lo que generó el agente; la entrega de WhatsApp se comprueba por separado. OpenClaw solo trata una respuesta automática como enviada después de que Baileys devuelve un id de mensaje saliente para al menos un envío visible de texto o medios.

    Las reacciones de acuse son recibos previos a la respuesta independientes: una reacción correcta no demuestra que la respuesta posterior de texto/medios haya sido aceptada. Revisa los registros del Gateway para `auto-reply delivery failed` o `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran inesperadamente">
    Comprueba en este orden: `groupPolicy`, `groupAllowFrom`/`allowFrom`, entradas de lista de permitidos de `groups`, compuerta de menciones (`requireMention` + patrones de mención) y claves duplicadas en `openclaw.json` (las entradas posteriores de JSON5 anulan las anteriores: mantén un único `groupPolicy` por ámbito).

    Si `channels.whatsapp.groups` está presente, WhatsApp aún puede observar mensajes de otros grupos, pero OpenClaw los descarta antes del enrutamiento de sesión. Añade el JID del grupo a `channels.whatsapp.groups`, o añade `groups["*"]` para admitir todos los grupos mientras mantienes la autorización de remitentes bajo `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Advertencia de runtime de Bun">
    El runtime del Gateway de WhatsApp debe usar Node. Bun se marca como incompatible para el funcionamiento estable del Gateway de WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts del sistema

WhatsApp admite prompts del sistema de estilo Telegram para grupos y chats directos mediante los mapas `groups` y `direct`.

Resolución para mensajes de grupo: primero se determina el mapa `groups` efectivo; si la cuenta define su propia clave `groups`, reemplaza por completo el mapa `groups` raíz (sin fusión profunda). Luego, la búsqueda del prompt se ejecuta en ese único mapa resultante:

1. **Prompt específico de grupo** (`groups["<groupId>"].systemPrompt`): se usa cuando la entrada del grupo existe **y** su clave `systemPrompt` está definida. Una cadena vacía (`""`) suprime el comodín y no aplica ningún prompt.
2. **Prompt comodín de grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada específica del grupo está ausente, o existe sin una clave `systemPrompt`.

La resolución para mensajes directos sigue el patrón idéntico contra el mapa `direct` y `direct["*"]`.

<Note>
`dms` sigue siendo el contenedor ligero de anulación de historial por DM (`dms.<id>.historyLimit`). Las anulaciones de prompts viven bajo `direct`.
</Note>

<Note>
Este comportamiento de cuenta-reemplaza-raíz para la resolución de prompts es una anulación superficial simple: cualquier clave `groups`/`direct` de cuenta, incluido un objeto vacío explícito, reemplaza el mapa raíz. Difiere de la comprobación de lista de permitidos de pertenencia a grupos descrita arriba, que tiene una red de seguridad de cuenta única para un `groups: {}` accidentalmente vacío.
</Note>

**Diferencia con Telegram:** Telegram suprime `groups` raíz para cada cuenta en una configuración de varias cuentas (incluso cuentas sin `groups` propios) para impedir que un bot reciba mensajes de grupo de grupos a los que no pertenece. WhatsApp no aplica esa protección: `groups`/`direct` raíz son heredados por cualquier cuenta sin su propia anulación, independientemente del número de cuentas. En una configuración de WhatsApp de varias cuentas, define explícitamente el mapa completo bajo cada cuenta si quieres prompts por cuenta.

Comportamiento importante:

- `channels.whatsapp.groups` es tanto un mapa de configuración por grupo como la lista de permitidos de grupos a nivel de chat. En el ámbito raíz o de cuenta, `groups["*"]` significa "todos los grupos son admitidos" para ese ámbito.
- Añade un `systemPrompt` comodín solo cuando ya quieras que ese ámbito admita todos los grupos. Para mantener elegible solo un conjunto fijo de IDs de grupo, repite el prompt en cada entrada explícitamente incluida en la lista de permitidos en lugar de usar `groups["*"]`.
- La admisión de grupos y la autorización de remitentes son comprobaciones separadas. `groups["*"]` amplía qué grupos llegan al manejo de grupos; no autoriza a todos los remitentes de esos grupos: eso sigue controlado por `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` no tiene un efecto secundario equivalente para DMs: `direct["*"]` solo proporciona una configuración predeterminada después de que un DM ya haya sido admitido por `dmPolicy` más reglas de `allowFrom` o del almacén de emparejamientos.

Ejemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Punteros de referencia de configuración

Referencia principal: [Referencia de configuración - WhatsApp](/es/gateway/config-channels#whatsapp)

| Área                    | Campos                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Acceso                  | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Entrega                 | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| Varias cuentas          | `accounts.<id>.enabled`, `accounts.<id>.authDir` y otras anulaciones por cuenta                                |
| Operaciones             | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Comportamiento de sesión | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Prompts                 | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
