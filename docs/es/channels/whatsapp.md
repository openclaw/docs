---
read_when:
    - Trabajar en el comportamiento del canal de WhatsApp/web o en el enrutamiento de la bandeja de entrada
summary: Compatibilidad del canal WhatsApp, controles de acceso, comportamiento de entrega y operaciones
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:26:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

Estado: listo para producción mediante WhatsApp Web (Baileys). Gateway administra las sesiones vinculadas.

## Instalación (bajo demanda)

- La incorporación (`openclaw onboard`) y `openclaw channels add --channel whatsapp`
  solicitan instalar el Plugin de WhatsApp la primera vez que lo seleccionas.
- `openclaw channels login --channel whatsapp` también ofrece el flujo de instalación cuando
  el Plugin aún no está presente.
- Canal de desarrollo + checkout de git: usa de forma predeterminada la ruta local del Plugin.
- Stable/Beta: instala primero el Plugin oficial `@openclaw/whatsapp` desde ClawHub,
  con npm como alternativa.
- El runtime de WhatsApp se distribuye fuera del paquete npm principal de OpenClaw para que
  las dependencias de runtime específicas de WhatsApp permanezcan con el Plugin externo.

La instalación manual sigue disponible:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Usa el paquete npm básico (`@openclaw/whatsapp`) solo cuando necesites la alternativa del
registro. Fija una versión exacta solo cuando necesites una instalación reproducible.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política de DM predeterminada es el emparejamiento para remitentes desconocidos.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
  <Card title="Configuración de Gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración de canales.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Configura la política de acceso de WhatsApp">

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

  <Step title="Vincula WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    El inicio de sesión actual se basa en QR. En entornos remotos o sin interfaz,
    asegúrate de tener una ruta fiable para entregar el código QR activo al teléfono que lo escaneará
    antes de iniciar sesión.

    Para una cuenta específica:

```bash
openclaw channels login --channel whatsapp --account work
```

    Para adjuntar un directorio de autenticación de WhatsApp Web existente/personalizado antes de iniciar sesión:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Inicia el gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Aprueba la primera solicitud de emparejamiento (si usas el modo de emparejamiento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Las solicitudes de emparejamiento caducan después de 1 hora. Las solicitudes pendientes tienen un límite de 3 por canal.

  </Step>
</Steps>

<Note>
OpenClaw recomienda ejecutar WhatsApp con un número separado siempre que sea posible. (Los metadatos del canal y el flujo de configuración están optimizados para esa configuración, pero las configuraciones con número personal también son compatibles).
</Note>

<Warning>
El flujo de configuración actual de WhatsApp solo usa QR. Los QR renderizados en terminal, capturas de pantalla,
PDF o adjuntos de chat pueden caducar o volverse ilegibles mientras se retransmiten
desde una máquina remota. Para hosts remotos/sin interfaz, prefiere una ruta directa
de entrega de imagen QR frente a la captura manual desde la terminal.
</Warning>

## Llama al solicitante actual con MeowCaller (experimental)

El Plugin de WhatsApp puede exponer `whatsapp_call` en turnos de agente originados en WhatsApp. La herramienta
usa [MeowCaller](https://github.com/purpshell/meowcaller) para realizar una llamada de voz de WhatsApp al
solicitante autorizado actual y reproduce un mensaje TTS de OpenClaw después de que responda. La herramienta
no acepta un número de destino, por lo que un prompt no puede redirigir la llamada a un tercero.
Esta capacidad experimental está deshabilitada de forma predeterminada.

<Warning>
MeowCaller es experimental, no tiene una versión etiquetada y usa una sesión de dispositivo vinculado de whatsmeow
emparejada por separado. No puede reutilizar las credenciales de Baileys del Plugin de WhatsApp. El emparejamiento agrega
otro dispositivo vinculado a la misma cuenta de WhatsApp. Escanea con la identidad de WhatsApp usada por
OpenClaw. El modo de número personal/chat propio no puede llamarse a sí mismo; usa un número dedicado de OpenClaw
para llamar a tu número personal.
</Warning>

<Steps>
  <Step title="Habilita las llamadas experimentales">

    Agrega `actions.calls: true` al canal de WhatsApp en `openclaw.json`:

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

    Fusiona esto con tu configuración de WhatsApp existente y luego reinicia el gateway. Cuando la
    configuración está ausente o es `false`, OpenClaw no expone la herramienta `whatsapp_call` al agente.

  </Step>

  <Step title="Instala la CLI revisada de MeowCaller">

    El adaptador espera un ejecutable llamado `meowcaller` en el `PATH` del host del gateway.
    Hasta que se fusione [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7), compila
    la rama revisada en el commit `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f`:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Asegúrate de que `$HOME/.local/bin` también esté en el `PATH` del servicio del gateway. Esta revisión proporciona
    comandos explícitos `pair` y `notify` solo de envío. `notify` no abre ningún micrófono, altavoz,
    dispositivo de video, receptor de audio entrante ni captura de diagnóstico. No sustituyas el comando
    `play` de la CLI de ejemplo.

  </Step>

  <Step title="Empareja el dispositivo vinculado de MeowCaller">

    Pide al agente de WhatsApp que compruebe la configuración de llamadas. La acción de estado `whatsapp_call` informa el
    directorio de estado específico de la cuenta y el comando de emparejamiento. Para la cuenta predeterminada:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Ejecuta el comando en una terminal interactiva. Escanea su QR desde **WhatsApp > Dispositivos vinculados**
    y espera a `MeowCaller linked device ready`. Luego el comando sale. Mantén `wa-voip.db`
    privado; es la sesión de dispositivo vinculado de MeowCaller. La acción de estado `whatsapp_call`
    devuelve el comando y el shell específicos de la cuenta cuando usas una cuenta no predeterminada. En
    Windows, ejecuta su comando de PowerShell; MeowCaller crea el directorio de almacenamiento.

  </Step>

  <Step title="Configura TTS y llama desde WhatsApp">

    Configura un [proveedor de TTS](/es/tools/tts) compatible con telefonía, reinicia el gateway y luego envía una
    solicitud de WhatsApp como `Call me and say the build finished.` La herramienta resuelve el remitente
    desde el contexto entrante de confianza, sintetiza un archivo WAV privado temporal, ejecuta MeowCaller durante una
    ventana de llamada limitada y elimina el archivo de audio después. OpenClaw pasa explícitamente el almacenamiento
    de la cuenta, espera un estado de salida cero después de responder, reproducir y colgar, y trata
    un timeout o una salida distinta de cero como una llamada de herramienta fallida.

  </Step>
</Steps>

Límites actuales:

- solo llamadas de audio salientes uno a uno
- sin números de destino arbitrarios
- sin autenticación compartida con la conexión de chat
- sin llamadas a sí mismo desde el modo de número personal/chat propio
- el audio sintetizado está limitado a 60 segundos
- sin confirmación de audibilidad en el teléfono más allá de la finalización de respuesta/reproducción/colgado de MeowCaller
- OpenClaw detiene el proceso complementario después de una ventana limitada de 115–175 segundos, incluidas
  las fases de conexión, respuesta, reproducción y apagado de MeowCaller

## Patrones de despliegue

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este es el modo operativo más limpio:

    - identidad de WhatsApp separada para OpenClaw
    - allowlists de DM y límites de enrutamiento más claros
    - menor probabilidad de confusión con chat propio

    Patrón de política mínimo:

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
    La incorporación admite el modo de número personal y escribe una base compatible con chat propio:

    - `dmPolicy: "allowlist"`
    - `allowFrom` incluye tu número personal
    - `selfChatMode: true`

    En runtime, las protecciones de chat propio se basan en el número propio vinculado y `allowFrom`.

  </Accordion>

  <Accordion title="Alcance del canal solo de WhatsApp Web">
    El canal de plataforma de mensajería se basa en WhatsApp Web (`Baileys`) en la arquitectura actual de canales de OpenClaw.

    No hay un canal separado de mensajería de Twilio WhatsApp en el registro integrado de canales de chat.

  </Accordion>
</AccordionGroup>

## Modelo de runtime

- Gateway administra el socket de WhatsApp y el bucle de reconexión.
- El watchdog de reconexión usa la actividad del transporte de WhatsApp Web, no solo el volumen de mensajes de aplicación entrantes, por lo que una sesión silenciosa de dispositivo vinculado no se reinicia solo porque nadie haya enviado un mensaje recientemente. Un límite más largo de silencio de la aplicación aún fuerza una reconexión si siguen llegando tramas de transporte pero no se gestiona ningún mensaje de aplicación durante la ventana del watchdog; después de una reconexión transitoria para una sesión activa recientemente, esa comprobación de silencio de la aplicación usa el timeout normal de mensajes para la primera ventana de recuperación.
- Los tiempos del socket de Baileys son explícitos bajo `web.whatsapp.*`: `keepAliveIntervalMs` controla los pings de aplicación de WhatsApp Web, `connectTimeoutMs` controla el timeout del handshake de apertura y `defaultQueryTimeoutMs` controla las esperas de consultas de Baileys más los límites de operación locales de envío/presencia saliente y confirmación de lectura entrante de OpenClaw.
- Los envíos salientes requieren un listener de WhatsApp activo para la cuenta de destino.
- Los envíos a grupos adjuntan metadatos nativos de mención para tokens `@+<digits>` y `@<digits>` en texto y pies de medios cuando el token coincide con los metadatos actuales de participantes de WhatsApp, incluidos grupos respaldados por LID.
- Los chats de estado y difusión se ignoran (`@status`, `@broadcast`).
- El watchdog de reconexión sigue la actividad del transporte de WhatsApp Web, no solo el volumen de mensajes de aplicación entrantes: las sesiones silenciosas de dispositivo vinculado permanecen activas mientras continúen las tramas de transporte, pero un bloqueo del transporte fuerza la reconexión mucho antes de la ruta posterior de desconexión remota.
- Los chats directos usan reglas de sesión de DM (`session.dmScope`; el valor predeterminado `main` colapsa los DM en la sesión principal del agente).
- Las sesiones de grupo están aisladas (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters pueden ser destinos salientes explícitos con su JID nativo `@newsletter`. Los envíos salientes de newsletters usan metadatos de sesión de canal (`agent:<agentId>:whatsapp:channel:<jid>`) en lugar de semántica de sesión de DM.
- El transporte de WhatsApp Web respeta las variables de entorno proxy estándar en el host del gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minúsculas). Prefiere la configuración de proxy a nivel de host frente a ajustes de proxy de WhatsApp específicos del canal.
- Cuando `messages.removeAckAfterReply` está habilitado, OpenClaw borra la reacción de confirmación de WhatsApp después de que se entregue una respuesta visible.

## Prompts de aprobación

WhatsApp puede renderizar prompts de aprobación de ejecución y Plugin con reacciones `👍` / `👎`. La entrega está
controlada por la configuración de reenvío de aprobaciones de nivel superior:

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

`approvals.exec` y `approvals.plugin` son independientes. Habilitar WhatsApp como canal solo vincula
el transporte; no envía prompts de aprobación a menos que la familia de aprobación correspondiente esté habilitada
y enrute a WhatsApp. El modo de sesión entrega aprobaciones nativas con emoji solo para aprobaciones que
se originan en WhatsApp. El modo de destino usa la canalización compartida de reenvío para destinos explícitos de WhatsApp
y no crea una distribución separada a DM de aprobadores.

Las reacciones de aprobación de WhatsApp requieren aprobadores explícitos de WhatsApp desde `allowFrom` o `"*"`.
`defaultTo` controla los destinos predeterminados ordinarios de mensajes; no es un aprobador de aprobación. Los comandos manuales
`/approve` aún pasan por la ruta normal de autorización del remitente de WhatsApp antes de
la resolución de aprobación.

## Hooks de Plugin y privacidad

Los mensajes entrantes de WhatsApp pueden contener contenido de mensajes personales, números de teléfono,
identificadores de grupo, nombres de remitente y campos de correlación de sesión. Por ese motivo,
WhatsApp no transmite las cargas de hooks `message_received` entrantes a los plugins
a menos que optes explícitamente por ello:

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

Puedes limitar la activación a una cuenta:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Activa esto solo para plugins en los que confíes para recibir contenido e
identificadores de mensajes entrantes de WhatsApp.

## Control de acceso y activación

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` controla el acceso a chats directos:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `allowFrom` acepta números con estilo E.164 (normalizados internamente).

    `allowFrom` es una lista de control de acceso para remitentes de DM. No limita envíos salientes explícitos a JID de grupos de WhatsApp ni a JID de canales `@newsletter`.

    Anulación para varias cuentas: `channels.whatsapp.accounts.<id>.dmPolicy` (y `allowFrom`) tienen prioridad sobre los valores predeterminados de nivel de canal para esa cuenta.

    Detalles del comportamiento en tiempo de ejecución:

    - los emparejamientos se conservan en el almacén de permisos del canal y se fusionan con el `allowFrom` configurado
    - la automatización programada y el fallback de destinatario de Heartbeat usan destinos de entrega explícitos o el `allowFrom` configurado; las aprobaciones de emparejamiento de DM no son destinatarios implícitos de Cron ni de Heartbeat
    - si no se configura ninguna lista de permitidos, el número propio vinculado se permite de forma predeterminada
    - OpenClaw nunca empareja automáticamente DM salientes `fromMe` (mensajes que te envías a ti mismo desde el dispositivo vinculado)

  </Tab>

  <Tab title="Group policy + allowlists">
    El acceso a grupos tiene dos capas:

    1. **Lista de permitidos de pertenencia a grupos** (`channels.whatsapp.groups`)
       - si se omite `groups`, todos los grupos son aptos
       - si `groups` está presente, actúa como una lista de permitidos de grupos (`"*"` permitido)

    2. **Política de remitentes de grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: se omite la lista de permitidos de remitentes
       - `allowlist`: el remitente debe coincidir con `groupAllowFrom` (o `*`)
       - `disabled`: bloquea todos los mensajes entrantes de grupo

    Fallback de lista de permitidos de remitentes:

    - si `groupAllowFrom` no está definido, el tiempo de ejecución recurre a `allowFrom` cuando está disponible
    - las listas de permitidos de remitentes se evalúan antes de la activación por mención/respuesta

    Nota: si no existe ningún bloque `channels.whatsapp`, el fallback de política de grupo en tiempo de ejecución es `allowlist` (con un registro de advertencia), incluso si `channels.defaults.groupPolicy` está definido.

  </Tab>

  <Tab title="Mentions + /activation">
    Las respuestas en grupo requieren mención de forma predeterminada.

    La detección de menciones incluye:

    - menciones explícitas de WhatsApp a la identidad del bot
    - patrones regex de mención configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcripciones de notas de voz entrantes para mensajes de grupo autorizados
    - detección implícita de respuesta al bot (el remitente de la respuesta coincide con la identidad del bot)

    Nota de seguridad:

    - citar/responder solo satisface el control de mención; **no** concede autorización al remitente
    - con `groupPolicy: "allowlist"`, los remitentes no incluidos en la lista siguen bloqueados aunque respondan al mensaje de un usuario incluido en la lista

    Comando de activación a nivel de sesión:

    - `/activation mention`
    - `/activation always`

    `activation` actualiza el estado de la sesión (no la configuración global). Está limitado al propietario.

  </Tab>
</Tabs>

## Enlaces ACP configurados

WhatsApp admite enlaces ACP persistentes con entradas `bindings[]` de nivel superior:

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

- Los chats directos coinciden con números E.164 como `+15555550123`.
- Los grupos coinciden con JID de grupos de WhatsApp como `120363424282127706@g.us`.
- Las listas de permitidos de grupos, la política de remitentes y el control por mención o activación se ejecutan antes de que OpenClaw asegure que exista la sesión ACP configurada.
- Un enlace ACP configurado que coincide es dueño de la ruta. Los grupos de difusión de WhatsApp no distribuyen ese turno a sesiones ordinarias de WhatsApp.

## Comportamiento de número personal y chat contigo mismo

Cuando el número propio vinculado también está presente en `allowFrom`, se activan las protecciones de chat contigo mismo de WhatsApp:

- omitir confirmaciones de lectura para turnos de chat contigo mismo
- ignorar el comportamiento de activación automática por JID de mención que de otro modo te haría ping a ti mismo
- si `messages.responsePrefix` no está definido, las respuestas de chat contigo mismo usan de forma predeterminada `[{identity.name}]` o `[openclaw]`

## Normalización de mensajes y contexto

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Los mensajes entrantes de WhatsApp se envuelven en el sobre entrante compartido.

    Si existe una respuesta citada, el contexto se agrega con esta forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Los campos de metadatos de respuesta también se completan cuando están disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del remitente).
    Cuando el destino de la respuesta citada es contenido multimedia descargable, OpenClaw lo guarda mediante
    el almacén normal de contenido multimedia entrante y lo expone como `MediaPath`/`MediaType` para que
    el agente pueda inspeccionar la imagen referenciada en lugar de ver solo
    `<media:image>`.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Los mensajes entrantes que solo contienen contenido multimedia se normalizan con marcadores como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Las notas de voz de grupos autorizados se transcriben antes del control de mención cuando el
    cuerpo es solo `<media:audio>`, de modo que decir la mención del bot en la nota de voz puede
    activar la respuesta. Si la transcripción todavía no menciona al bot, la
    transcripción se conserva en el historial pendiente del grupo en lugar del marcador sin procesar.

    Los cuerpos de ubicación usan texto breve de coordenadas. Las etiquetas/comentarios de ubicación y los detalles de contacto/vCard se representan como metadatos no confiables delimitados, no como texto de prompt en línea.

  </Accordion>

  <Accordion title="Pending group history injection">
    Para grupos, los mensajes no procesados pueden almacenarse en búfer e inyectarse como contexto cuando finalmente se activa el bot.

    - límite predeterminado: `50`
    - configuración: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desactiva

    Marcadores de inyección:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Las confirmaciones de lectura están activadas de forma predeterminada para mensajes entrantes de WhatsApp aceptados.

    Desactivar globalmente:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Anulación por cuenta:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Los turnos de chat contigo mismo omiten las confirmaciones de lectura incluso cuando están activadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentación y contenido multimedia

<AccordionGroup>
  <Accordion title="Text chunking">
    - límite de fragmento predeterminado: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - el modo `newline` prefiere límites de párrafo (líneas en blanco) y luego recurre a fragmentación segura por longitud

  </Accordion>

  <Accordion title="Outbound media behavior">
    - admite cargas de imagen, video, audio (nota de voz PTT) y documento
    - el audio se envía mediante la carga `audio` de Baileys con `ptt: true`, de modo que los clientes de WhatsApp lo renderizan como una nota de voz push-to-talk
    - las cargas de respuesta conservan `audioAsVoice`; la salida de nota de voz TTS para WhatsApp permanece en esta ruta PTT incluso cuando el proveedor devuelve MP3 o WebM
    - el audio Ogg/Opus nativo se envía como `audio/ogg; codecs=opus` para compatibilidad con notas de voz
    - el audio que no es Ogg, incluida la salida MP3/WebM de Microsoft Edge TTS, se transcodifica con `ffmpeg` a Ogg/Opus mono de 48 kHz antes de la entrega PTT
    - `/tts latest` envía la respuesta más reciente del asistente como una sola nota de voz y suprime envíos repetidos de la misma respuesta; `/tts chat on|off|default` controla el TTS automático para el chat actual de WhatsApp
    - la reproducción de GIF animados se admite mediante `gifPlayback: true` en envíos de video
    - `forceDocument` / `asDocument` envía imágenes, GIF y videos salientes mediante la carga de documento de Baileys para evitar la compresión multimedia de WhatsApp mientras conserva el nombre de archivo resuelto y el tipo MIME
    - los subtítulos se aplican al primer elemento multimedia al enviar cargas de respuesta con varios medios, excepto que las notas de voz PTT envían primero el audio y el texto visible por separado porque los clientes de WhatsApp no renderizan subtítulos de notas de voz de forma consistente
    - la fuente multimedia puede ser HTTP(S), `file://` o rutas locales

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - límite de guardado de contenido multimedia entrante: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - límite de envío de contenido multimedia saliente: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - las anulaciones por cuenta usan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - las imágenes se optimizan automáticamente (barrido de redimensionado/calidad) para ajustarse a los límites a menos que `forceDocument` / `asDocument` solicite entrega como documento
    - ante un fallo de envío de contenido multimedia, el fallback del primer elemento envía una advertencia de texto en lugar de descartar la respuesta silenciosamente

  </Accordion>
</AccordionGroup>

## Citas de respuesta

WhatsApp admite citas de respuesta nativas, donde las respuestas salientes citan visiblemente el mensaje entrante. Contrólalo con `channels.whatsapp.replyToMode`.

| Valor       | Comportamiento                                                       |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nunca citar; enviar como mensaje simple                               |
| `"first"`   | Citar solo el primer fragmento de respuesta saliente                  |
| `"all"`     | Citar cada fragmento de respuesta saliente                            |
| `"batched"` | Citar respuestas agrupadas en cola dejando las respuestas inmediatas sin citar |

El valor predeterminado es `"off"`. Las anulaciones por cuenta usan `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Nivel de reacciones

`channels.whatsapp.reactionLevel` controla con qué amplitud el agente usa reacciones emoji en WhatsApp:

| Nivel         | Reacciones de acuse | Reacciones iniciadas por el agente | Descripción                                      |
| ------------- | ------------------- | ---------------------------------- | ------------------------------------------------ |
| `"off"`       | No                  | No                                 | Sin reacciones                                   |
| `"ack"`       | Sí                  | No                                 | Solo reacciones de acuse (recepción previa a la respuesta) |
| `"minimal"`   | Sí                  | Sí (conservador)                   | Acuse + reacciones del agente con orientación conservadora |
| `"extensive"` | Sí                  | Sí (recomendado)                   | Acuse + reacciones del agente con orientación recomendada |

Predeterminado: `"minimal"`.

Las anulaciones por cuenta usan `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Reacciones de reconocimiento

WhatsApp admite reacciones de acuse inmediatas al recibir mensajes entrantes mediante `channels.whatsapp.ackReaction`.
Las reacciones de acuse están limitadas por `reactionLevel`: se suprimen cuando `reactionLevel` es `"off"`.

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

Notas de comportamiento:

- se envía inmediatamente después de que se acepta el mensaje entrante (antes de la respuesta)
- si `ackReaction` está presente sin `emoji`, WhatsApp usa el emoji de identidad del agente enrutado, con "👀" como alternativa; omite `ackReaction` o define `emoji: ""` para no enviar ninguna reacción de confirmación
- los fallos se registran, pero no bloquean la entrega normal de la respuesta
- el modo de grupo `mentions` reacciona en turnos activados por mención; la activación de grupo `always` actúa como omisión para esta comprobación
- WhatsApp usa `channels.whatsapp.ackReaction` (el valor heredado `messages.ackReaction` no se usa aquí)

## Reacciones de estado del ciclo de vida

Define `messages.statusReactions.enabled: true` para permitir que WhatsApp reemplace la reacción de confirmación durante un turno en lugar de dejar un emoji de acuse estático. Cuando está habilitado, OpenClaw usa el mismo espacio de reacción del mensaje entrante para estados del ciclo de vida como en cola, pensando, actividad de herramientas, Compaction, completado y error.

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

Notas de comportamiento:

- `channels.whatsapp.ackReaction` sigue controlando si las reacciones de estado son elegibles para mensajes directos y grupos.
- La reacción de estado en cola usa el mismo emoji de confirmación efectivo que las reacciones de confirmación simples.
- WhatsApp tiene un solo espacio de reacción de bot por mensaje, por lo que las actualizaciones del ciclo de vida reemplazan la reacción actual en el mismo lugar.
- `messages.removeAckAfterReply: true` borra la reacción de estado final después del tiempo de retención configurado para completado/error.
- Las categorías de emoji de herramientas incluyen `tool`, `coding`, `web`, `deploy`, `build` y `concierge`.

## Varias cuentas y credenciales

<AccordionGroup>
  <Accordion title="Selección de cuenta y valores predeterminados">
    - los ids de cuenta provienen de `channels.whatsapp.accounts`
    - selección de cuenta predeterminada: `default` si está presente; de lo contrario, el primer id de cuenta configurado (ordenado)
    - los ids de cuenta se normalizan internamente para la búsqueda

  </Accordion>

  <Accordion title="Rutas de credenciales y compatibilidad heredada">
    - ruta de autenticación actual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - archivo de copia de seguridad: `creds.json.bak`
    - la autenticación predeterminada heredada en `~/.openclaw/credentials/` aún se reconoce/migra para flujos de cuenta predeterminada

  </Accordion>

  <Accordion title="Comportamiento de cierre de sesión">
    `openclaw channels logout --channel whatsapp [--account <id>]` borra el estado de autenticación de WhatsApp para esa cuenta.

    Cuando se puede acceder a un Gateway, el cierre de sesión primero detiene el listener activo de WhatsApp para la cuenta seleccionada, de modo que la sesión vinculada no siga recibiendo mensajes hasta el siguiente reinicio. `openclaw channels remove --channel whatsapp` también detiene el listener activo antes de deshabilitar o eliminar la configuración de cuenta.

    En directorios de autenticación heredados, `oauth.json` se conserva mientras se eliminan los archivos de autenticación de Baileys.

  </Accordion>
</AccordionGroup>

## Herramientas, acciones y escrituras de configuración

- La compatibilidad con herramientas del agente incluye la acción de reacción de WhatsApp (`react`).
- Puertas de acciones:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Las escrituras de configuración iniciadas por el canal están habilitadas de forma predeterminada (deshabilítalas mediante `channels.whatsapp.configWrites=false`).

## Solución de problemas

<AccordionGroup>
  <Accordion title="No vinculado (QR requerido)">
    Síntoma: el estado del canal informa que no está vinculado.

    Solución:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Vinculado pero desconectado / bucle de reconexión">
    Síntoma: cuenta vinculada con desconexiones repetidas o intentos de reconexión.

    Las cuentas silenciosas pueden permanecer conectadas más allá del tiempo de espera normal de mensajes; el watchdog
    se reinicia cuando la actividad del transporte de WhatsApp Web se detiene, el socket se cierra o
    la actividad a nivel de aplicación permanece en silencio más allá de la ventana de seguridad más larga.

    Si los registros muestran `status=408 Request Time-out Connection was lost` repetido, ajusta
    los tiempos del socket de Baileys en `web.whatsapp`. Empieza acortando
    `keepAliveIntervalMs` por debajo del tiempo de espera de inactividad de tu red y aumentando
    `connectTimeoutMs` en enlaces lentos o con pérdidas:

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

    Si el bucle persiste después de corregir la conectividad del host y los tiempos, haz una copia de seguridad
    del directorio de autenticación de la cuenta y vuelve a vincular esa cuenta:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Si `~/.openclaw/logs/whatsapp-health.log` dice `Gateway inactive`, pero
    `openclaw gateway status` y `openclaw channels status --probe` muestran que el
    Gateway y WhatsApp están en buen estado, ejecuta `openclaw doctor`. En Linux, doctor
    advierte sobre entradas heredadas de crontab que todavía invocan
    `~/.openclaw/bin/ensure-whatsapp.sh`; elimina esas entradas obsoletas con
    `crontab -e`, porque cron puede carecer del entorno de bus de usuario de systemd y
    hacer que ese script antiguo informe incorrectamente del estado del Gateway.

    Si es necesario, vuelve a vincular con `channels login`.

  </Accordion>

  <Accordion title="El inicio de sesión con QR agota el tiempo detrás de un proxy">
    Síntoma: `openclaw channels login --channel whatsapp` falla antes de mostrar un código QR utilizable con `status=408 Request Time-out` o una desconexión de socket TLS.

    El inicio de sesión de WhatsApp Web usa el entorno de proxy estándar del host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes en minúsculas y `NO_PROXY`). Verifica que el proceso del Gateway herede el entorno de proxy y que `NO_PROXY` no coincida con `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="No hay listener activo al enviar">
    Los envíos salientes fallan rápido cuando no existe ningún listener activo del Gateway para la cuenta de destino.

    Asegúrate de que el Gateway esté en ejecución y de que la cuenta esté vinculada.

  </Accordion>

  <Accordion title="La respuesta aparece en la transcripción, pero no en WhatsApp">
    Las filas de transcripción registran lo que generó el agente. La entrega de WhatsApp se comprueba por separado: OpenClaw solo trata una respuesta automática como enviada después de que Baileys devuelve un id de mensaje saliente para al menos un envío visible de texto o medios.

    Las reacciones de confirmación son acuses previos a la respuesta independientes. Una reacción correcta no prueba que la respuesta posterior de texto o medios haya sido aceptada por WhatsApp.

    Revisa los registros del Gateway para `auto-reply delivery failed` o `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Mensajes de grupo ignorados inesperadamente">
    Comprueba en este orden:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas de lista de permitidos de `groups`
    - puerta por mención (`requireMention` + patrones de mención)
    - claves duplicadas en `openclaw.json` (JSON5): las entradas posteriores anulan las anteriores, así que mantén un solo `groupPolicy` por ámbito

    Si `channels.whatsapp.groups` está presente, WhatsApp aún puede observar mensajes de otros grupos, pero OpenClaw los descarta antes del enrutamiento de sesión. Añade el JID del grupo a `channels.whatsapp.groups` o añade `groups["*"]` para admitir todos los grupos mientras mantienes la autorización de remitentes bajo `groupPolicy` y `groupAllowFrom`.

  </Accordion>

  <Accordion title="Advertencia del runtime Bun">
    El runtime del Gateway de WhatsApp debe usar Node. Bun se marca como incompatible para el funcionamiento estable del Gateway de WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts del sistema

WhatsApp admite prompts del sistema al estilo Telegram para grupos y chats directos mediante los mapas `groups` y `direct`.

Jerarquía de resolución para mensajes de grupo:

El mapa efectivo de `groups` se determina primero: si la cuenta define sus propios `groups`, reemplaza por completo el mapa raíz de `groups` (sin fusión profunda). La búsqueda de prompt se ejecuta luego en el único mapa resultante:

1. **Prompt del sistema específico de grupo** (`groups["<groupId>"].systemPrompt`): se usa cuando la entrada del grupo específico existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), el comodín se suprime y no se aplica ningún prompt del sistema.
2. **Prompt del sistema comodín de grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada del grupo específico está ausente del mapa por completo, o cuando existe pero no define ninguna clave `systemPrompt`.

Jerarquía de resolución para mensajes directos:

El mapa efectivo de `direct` se determina primero: si la cuenta define su propio `direct`, reemplaza por completo el mapa raíz de `direct` (sin fusión profunda). La búsqueda de prompt se ejecuta luego en el único mapa resultante:

1. **Prompt del sistema específico de directo** (`direct["<peerId>"].systemPrompt`): se usa cuando la entrada del par específico existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), el comodín se suprime y no se aplica ningún prompt del sistema.
2. **Prompt del sistema comodín de directo** (`direct["*"].systemPrompt`): se usa cuando la entrada del par específico está ausente del mapa por completo, o cuando existe pero no define ninguna clave `systemPrompt`.

<Note>
`dms` sigue siendo el contenedor ligero de anulación de historial por DM (`dms.<id>.historyLimit`). Las anulaciones de prompt viven bajo `direct`.
</Note>

**Diferencia respecto del comportamiento de varias cuentas de Telegram:** En Telegram, `groups` raíz se suprime intencionalmente para todas las cuentas en una configuración de varias cuentas, incluso las cuentas que no definen `groups` propios, para evitar que un bot reciba mensajes de grupo de grupos a los que no pertenece. WhatsApp no aplica esta protección: `groups` raíz y `direct` raíz siempre son heredados por cuentas que no definen ninguna anulación a nivel de cuenta, independientemente de cuántas cuentas estén configuradas. En una configuración de varias cuentas de WhatsApp, si quieres prompts de grupo o directos por cuenta, define explícitamente el mapa completo bajo cada cuenta en lugar de depender de valores predeterminados a nivel raíz.

Comportamiento importante:

- `channels.whatsapp.groups` es tanto un mapa de configuración por grupo como la lista de permitidos de grupos a nivel de chat. En el ámbito raíz o de cuenta, `groups["*"]` significa "se admiten todos los grupos" para ese ámbito.
- Añade un `systemPrompt` de grupo comodín solo cuando ya quieras que ese ámbito admita todos los grupos. Si aún quieres que solo un conjunto fijo de ids de grupo sea elegible, no uses `groups["*"]` para el prompt predeterminado. En su lugar, repite el prompt en cada entrada de grupo incluida explícitamente en la lista de permitidos.
- La admisión de grupo y la autorización de remitentes son comprobaciones separadas. `groups["*"]` amplía el conjunto de grupos que pueden llegar al manejo de grupos, pero por sí solo no autoriza a todos los remitentes de esos grupos. El acceso de remitentes sigue controlado por separado por `channels.whatsapp.groupPolicy` y `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` no tiene el mismo efecto secundario para DMs. `direct["*"]` solo proporciona una configuración predeterminada de chat directo después de que un DM ya haya sido admitido por `dmPolicy` más `allowFrom` o las reglas del almacén de emparejamiento.

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

Referencia principal:

- [Referencia de configuración - WhatsApp](/es/gateway/config-channels#whatsapp)

Campos de WhatsApp de alta señal:

- acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multicuenta: `accounts.<id>.enabled`, `accounts.<id>.authDir`, sobrescrituras a nivel de cuenta
- operaciones: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- comportamiento de sesión: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
