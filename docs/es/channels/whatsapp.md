---
read_when:
    - Trabajando en el comportamiento del canal de WhatsApp/web o el enrutamiento de la bandeja de entrada
summary: Compatibilidad con el canal de WhatsApp, controles de acceso, comportamiento de entrega y operaciones
title: WhatsApp
x-i18n:
    generated_at: "2026-05-05T05:22:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52a81fc323568e06d11606931e34465fe5a823a0699d8e0638195b8667c3ebee
    source_path: channels/whatsapp.md
    workflow: 16
---

Estado: listo para producción mediante WhatsApp Web (Baileys). Gateway gestiona las sesiones vinculadas.

## Instalación (bajo demanda)

- La incorporación (`openclaw onboard`) y `openclaw channels add --channel whatsapp`
  solicitan instalar el Plugin de WhatsApp la primera vez que lo seleccionas.
- `openclaw channels login --channel whatsapp` también ofrece el flujo de instalación cuando
  el Plugin aún no está presente.
- Canal de desarrollo + checkout de git: usa de forma predeterminada la ruta local del Plugin.
- Stable/Beta: usa el paquete npm `@openclaw/whatsapp` en la etiqueta de versión oficial
  actual.

La instalación manual sigue disponible:

```bash
openclaw plugins install @openclaw/whatsapp
```

Usa el paquete base para seguir la etiqueta de versión oficial actual. Fija una versión exacta
solo cuando necesites una instalación reproducible.

En Windows, el Plugin de WhatsApp necesita Git en `PATH` durante la instalación de npm porque
una de sus dependencias de Baileys/libsignal se obtiene desde una URL de git. Instala
Git for Windows, luego reinicia la shell y vuelve a ejecutar la instalación:

```powershell
winget install --id Git.Git -e
```

Portable Git también funciona si su directorio `bin` está en `PATH`.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política predeterminada de DM es el emparejamiento para remitentes desconocidos.
  </Card>
  <Card title="Solución de problemas de canal" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
  <Card title="Configuración de Gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración de canal.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Configurar la política de acceso de WhatsApp">

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

  <Step title="Iniciar el Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Aprobar la primera solicitud de emparejamiento (si usas el modo de emparejamiento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Las solicitudes de emparejamiento caducan después de 1 hora. Las solicitudes pendientes tienen un límite de 3 por canal.

  </Step>
</Steps>

<Note>
OpenClaw recomienda ejecutar WhatsApp en un número separado cuando sea posible. (Los metadatos del canal y el flujo de configuración están optimizados para esa configuración, pero las configuraciones con número personal también están admitidas).
</Note>

## Patrones de despliegue

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este es el modo operativo más limpio:

    - identidad de WhatsApp separada para OpenClaw
    - listas de permitidos de DM y límites de enrutamiento más claros
    - menor probabilidad de confusión con chats contigo mismo

    Patrón mínimo de política:

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
    La incorporación admite el modo de número personal y escribe una base compatible con chats contigo mismo:

    - `dmPolicy: "allowlist"`
    - `allowFrom` incluye tu número personal
    - `selfChatMode: true`

    En tiempo de ejecución, las protecciones de chat contigo mismo se basan en el número propio vinculado y `allowFrom`.

  </Accordion>

  <Accordion title="Alcance del canal solo para WhatsApp Web">
    El canal de la plataforma de mensajería está basado en WhatsApp Web (`Baileys`) en la arquitectura de canales actual de OpenClaw.

    No hay un canal de mensajería de Twilio WhatsApp separado en el registro integrado de canales de chat.

  </Accordion>
</AccordionGroup>

## Modelo de tiempo de ejecución

- Gateway gestiona el socket de WhatsApp y el bucle de reconexión.
- El vigilante de reconexión usa la actividad de transporte de WhatsApp Web, no solo el volumen de mensajes entrantes de la aplicación, por lo que una sesión silenciosa de dispositivo vinculado no se reinicia solo porque nadie haya enviado un mensaje recientemente. Un límite más largo de silencio de la aplicación sigue forzando una reconexión si los frames de transporte continúan llegando pero no se procesa ningún mensaje de aplicación durante la ventana del vigilante; después de una reconexión transitoria para una sesión activa recientemente, esa comprobación de silencio de la aplicación usa el tiempo de espera normal de mensajes para la primera ventana de recuperación.
- Los tiempos del socket de Baileys son explícitos bajo `web.whatsapp.*`: `keepAliveIntervalMs` controla los pings de aplicación de WhatsApp Web, `connectTimeoutMs` controla el tiempo de espera del handshake de apertura y `defaultQueryTimeoutMs` controla los tiempos de espera de consultas de Baileys.
- Los envíos salientes requieren un listener de WhatsApp activo para la cuenta de destino.
- Los envíos a grupos adjuntan metadatos nativos de mención para tokens `@+<digits>` y `@<digits>` en texto y pies de medios cuando el token coincide con los metadatos actuales de participantes de WhatsApp, incluidos grupos respaldados por LID.
- Los chats de estado y difusión se ignoran (`@status`, `@broadcast`).
- El vigilante de reconexión sigue la actividad de transporte de WhatsApp Web, no solo el volumen de mensajes entrantes de la aplicación: las sesiones silenciosas de dispositivo vinculado permanecen activas mientras continúen los frames de transporte, pero un bloqueo del transporte fuerza una reconexión mucho antes de la ruta posterior de desconexión remota.
- Los chats directos usan reglas de sesión de DM (`session.dmScope`; el valor predeterminado `main` colapsa los DM en la sesión principal del agente).
- Las sesiones de grupo están aisladas (`agent:<agentId>:whatsapp:group:<jid>`).
- Los canales/newsletters de WhatsApp pueden ser destinos salientes explícitos con su JID nativo `@newsletter`. Los envíos salientes a newsletters usan metadatos de sesión de canal (`agent:<agentId>:whatsapp:channel:<jid>`) en lugar de semántica de sesión de DM.
- El transporte de WhatsApp Web respeta las variables de entorno de proxy estándar en el host de Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minúsculas). Prefiere la configuración de proxy a nivel de host frente a ajustes de proxy de WhatsApp específicos del canal.
- Cuando `messages.removeAckAfterReply` está habilitado, OpenClaw borra la reacción de acuse de WhatsApp después de que se entrega una respuesta visible.

## Hooks de Plugin y privacidad

Los mensajes entrantes de WhatsApp pueden contener contenido de mensajes personales, números de teléfono,
identificadores de grupo, nombres de remitente y campos de correlación de sesión. Por ese motivo,
WhatsApp no transmite cargas de hook `message_received` entrantes a plugins
a menos que lo habilites explícitamente:

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

Puedes limitar la habilitación a una cuenta:

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

Habilita esto solo para plugins en los que confíes para recibir contenido e
identificadores de mensajes entrantes de WhatsApp.

## Control de acceso y activación

<Tabs>
  <Tab title="Política de DM">
    `channels.whatsapp.dmPolicy` controla el acceso a chats directos:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `allowFrom` acepta números con estilo E.164 (normalizados internamente).

    `allowFrom` es una lista de control de acceso de remitentes de DM. No controla envíos salientes explícitos a JID de grupos de WhatsApp ni a JID de canales `@newsletter`.

    Anulación multicuenta: `channels.whatsapp.accounts.<id>.dmPolicy` (y `allowFrom`) tienen prioridad sobre los valores predeterminados a nivel de canal para esa cuenta.

    Detalles del comportamiento en tiempo de ejecución:

    - los emparejamientos se conservan en el almacén de permitidos del canal y se combinan con `allowFrom` configurado
    - la automatización programada y el fallback de destinatario de Heartbeat usan destinos de entrega explícitos o `allowFrom` configurado; las aprobaciones de emparejamiento de DM no son destinatarios implícitos de cron ni de Heartbeat
    - si no hay una lista de permitidos configurada, el número propio vinculado se permite de forma predeterminada
    - OpenClaw nunca empareja automáticamente DM salientes `fromMe` (mensajes que te envías a ti mismo desde el dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupos + listas de permitidos">
    El acceso a grupos tiene dos capas:

    1. **Lista de permitidos de membresía de grupo** (`channels.whatsapp.groups`)
       - si `groups` se omite, todos los grupos son elegibles
       - si `groups` está presente, actúa como una lista de permitidos de grupos (`"*"` permitido)

    2. **Política de remitentes de grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: se omite la lista de permitidos de remitentes
       - `allowlist`: el remitente debe coincidir con `groupAllowFrom` (o `*`)
       - `disabled`: bloquea todas las entradas de grupo

    Fallback de lista de permitidos de remitentes:

    - si `groupAllowFrom` no está definido, el tiempo de ejecución recurre a `allowFrom` cuando esté disponible
    - las listas de permitidos de remitentes se evalúan antes de la activación por mención/respuesta

    Nota: si no existe ningún bloque `channels.whatsapp`, el fallback de política de grupos en tiempo de ejecución es `allowlist` (con un log de advertencia), incluso si `channels.defaults.groupPolicy` está definido.

  </Tab>

  <Tab title="Menciones + /activation">
    Las respuestas de grupo requieren mención de forma predeterminada.

    La detección de menciones incluye:

    - menciones explícitas de WhatsApp a la identidad del bot
    - patrones regex de mención configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcripciones de notas de voz entrantes para mensajes de grupo autorizados
    - detección implícita de respuesta al bot (el remitente de la respuesta coincide con la identidad del bot)

    Nota de seguridad:

    - citar/responder solo satisface el control de mención; **no** concede autorización al remitente
    - con `groupPolicy: "allowlist"`, los remitentes que no estén en la lista de permitidos siguen bloqueados aunque respondan al mensaje de un usuario incluido en la lista de permitidos

    Comando de activación a nivel de sesión:

    - `/activation mention`
    - `/activation always`

    `activation` actualiza el estado de la sesión (no la configuración global). Está controlado por el propietario.

  </Tab>
</Tabs>

## Comportamiento con número personal y chat contigo mismo

Cuando el número propio vinculado también está presente en `allowFrom`, se activan las salvaguardas de chat contigo mismo de WhatsApp:

- omitir confirmaciones de lectura para turnos de chat contigo mismo
- ignorar comportamiento de activación automática por mention-JID que de otro modo te haría ping a ti mismo
- si `messages.responsePrefix` no está definido, las respuestas de chat contigo mismo usan de forma predeterminada `[{identity.name}]` o `[openclaw]`

## Normalización de mensajes y contexto

<AccordionGroup>
  <Accordion title="Envoltorio entrante + contexto de respuesta">
    Los mensajes entrantes de WhatsApp se envuelven en el envoltorio entrante compartido.

    Si existe una respuesta citada, el contexto se añade con esta forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Los campos de metadatos de respuesta también se completan cuando están disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del remitente).
    Cuando el destino de la respuesta citada es un medio descargable, OpenClaw lo guarda mediante
    el almacén normal de medios entrantes y lo expone como `MediaPath`/`MediaType` para que
    el agente pueda inspeccionar la imagen referenciada en lugar de ver solo
    `<media:image>`.

  </Accordion>

  <Accordion title="Marcadores de posición de medios y extracción de ubicación/contacto">
    Los mensajes entrantes solo con medios se normalizan con marcadores de posición como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Las notas de voz de grupo autorizadas se transcriben antes del control de menciones cuando el
    cuerpo es solo `<media:audio>`, por lo que decir la mención del bot en la nota de voz puede
    activar la respuesta. Si la transcripción aún no menciona al bot, la
    transcripción se conserva en el historial de grupo pendiente en lugar del marcador de posición sin procesar.

    Los cuerpos de ubicación usan texto de coordenadas conciso. Las etiquetas/comentarios de ubicación y los detalles de contacto/vCard se renderizan como metadatos no confiables delimitados, no como texto de prompt inline.

  </Accordion>

  <Accordion title="Inyección de historial de grupo pendiente">
    Para grupos, los mensajes no procesados pueden almacenarse en búfer e inyectarse como contexto cuando finalmente se activa el bot.

    - límite predeterminado: `50`
    - configuración: `channels.whatsapp.historyLimit`
    - reserva: `messages.groupChat.historyLimit`
    - `0` desactiva

    Marcadores de inyección:

    - `[Mensajes de chat desde tu última respuesta - para contexto]`
    - `[Mensaje actual - responde a esto]`

  </Accordion>

  <Accordion title="Confirmaciones de lectura">
    Las confirmaciones de lectura están activadas de forma predeterminada para los mensajes entrantes aceptados de WhatsApp.

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

    Los turnos de chat propio omiten las confirmaciones de lectura incluso cuando están activadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentación y multimedia

<AccordionGroup>
  <Accordion title="Fragmentación de texto">
    - límite de fragmento predeterminado: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - el modo `newline` prefiere los límites de párrafo (líneas en blanco) y luego recurre a una fragmentación segura por longitud

  </Accordion>

  <Accordion title="Comportamiento de multimedia saliente">
    - admite cargas de imagen, video, audio (nota de voz PTT) y documento
    - el multimedia de audio se envía mediante la carga `audio` de Baileys con `ptt: true`, por lo que los clientes de WhatsApp lo muestran como una nota de voz push-to-talk
    - las cargas de respuesta conservan `audioAsVoice`; la salida de nota de voz TTS para WhatsApp permanece en esta ruta PTT incluso cuando el proveedor devuelve MP3 o WebM
    - el audio nativo Ogg/Opus se envía como `audio/ogg; codecs=opus` para compatibilidad con notas de voz
    - el audio que no sea Ogg, incluida la salida MP3/WebM de Microsoft Edge TTS, se transcodifica con `ffmpeg` a Ogg/Opus mono de 48 kHz antes de la entrega PTT
    - `/tts latest` envía la última respuesta del asistente como una nota de voz y suprime envíos repetidos de la misma respuesta; `/tts chat on|off|default` controla el TTS automático para el chat actual de WhatsApp
    - la reproducción de GIF animados es compatible mediante `gifPlayback: true` en envíos de video
    - los subtítulos se aplican al primer elemento multimedia al enviar cargas de respuesta con varios medios, salvo que las notas de voz PTT envían primero el audio y el texto visible por separado porque los clientes de WhatsApp no muestran los subtítulos de notas de voz de forma uniforme
    - la fuente multimedia puede ser HTTP(S), `file://` o rutas locales

  </Accordion>

  <Accordion title="Límites de tamaño de multimedia y comportamiento de reserva">
    - límite de guardado de multimedia entrante: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - límite de envío de multimedia saliente: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - las anulaciones por cuenta usan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - las imágenes se optimizan automáticamente (barrido de redimensionamiento/calidad) para ajustarse a los límites
    - ante un fallo de envío de multimedia, la reserva del primer elemento envía una advertencia de texto en lugar de descartar la respuesta silenciosamente

  </Accordion>
</AccordionGroup>

## Citas en respuestas

WhatsApp admite citas nativas en respuestas, donde las respuestas salientes citan visiblemente el mensaje entrante. Contrólalo con `channels.whatsapp.replyToMode`.

| Valor       | Comportamiento                                                        |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | No citar nunca; enviar como mensaje simple                            |
| `"first"`   | Citar solo el primer fragmento de respuesta saliente                   |
| `"all"`     | Citar cada fragmento de respuesta saliente                            |
| `"batched"` | Citar respuestas agrupadas en cola y dejar sin cita las respuestas inmediatas |

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

## Nivel de reacción

`channels.whatsapp.reactionLevel` controla con qué amplitud el agente usa reacciones de emoji en WhatsApp:

| Nivel         | Reacciones de acuse | Reacciones iniciadas por el agente | Descripción                                      |
| ------------- | ------------------- | ---------------------------------- | ------------------------------------------------ |
| `"off"`       | No                  | No                                 | Sin reacciones en absoluto                       |
| `"ack"`       | Sí                  | No                                 | Solo reacciones de acuse (confirmación previa a la respuesta) |
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

## Reacciones de acuse

WhatsApp admite reacciones de acuse inmediatas al recibir mensajes entrantes mediante `channels.whatsapp.ackReaction`.
Las reacciones de acuse están controladas por `reactionLevel`: se suprimen cuando `reactionLevel` es `"off"`.

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

- se envían inmediatamente después de aceptar el mensaje entrante (antes de la respuesta)
- los fallos se registran, pero no bloquean la entrega normal de la respuesta
- el modo de grupo `mentions` reacciona en turnos activados por menciones; la activación de grupo `always` actúa como omisión para esta comprobación
- WhatsApp usa `channels.whatsapp.ackReaction` (el valor heredado `messages.ackReaction` no se usa aquí)

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
    - la autenticación predeterminada heredada en `~/.openclaw/credentials/` todavía se reconoce/migra para flujos de cuenta predeterminada

  </Accordion>

  <Accordion title="Comportamiento de cierre de sesión">
    `openclaw channels logout --channel whatsapp [--account <id>]` borra el estado de autenticación de WhatsApp para esa cuenta.

    Cuando hay un Gateway accesible, el cierre de sesión primero detiene el escuchador activo de WhatsApp para la cuenta seleccionada, de modo que la sesión vinculada no siga recibiendo mensajes hasta el siguiente reinicio. `openclaw channels remove --channel whatsapp` también detiene el escuchador activo antes de desactivar o eliminar la configuración de la cuenta.

    En directorios de autenticación heredados, `oauth.json` se conserva mientras se eliminan los archivos de autenticación de Baileys.

  </Accordion>
</AccordionGroup>

## Herramientas, acciones y escrituras de configuración

- La compatibilidad con herramientas del agente incluye la acción de reacción de WhatsApp (`react`).
- Controles de acciones:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Las escrituras de configuración iniciadas por el canal están activadas de forma predeterminada (desactivar mediante `channels.whatsapp.configWrites=false`).

## Solución de problemas

<AccordionGroup>
  <Accordion title="No vinculado (se requiere QR)">
    Síntoma: el estado del canal indica que no está vinculado.

    Solución:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Vinculado pero desconectado / bucle de reconexión">
    Síntoma: cuenta vinculada con desconexiones repetidas o intentos de reconexión.

    Las cuentas silenciosas pueden permanecer conectadas más allá del tiempo de espera normal de mensajes; el vigilante
    reinicia cuando se detiene la actividad de transporte de WhatsApp Web, se cierra el socket o
    la actividad a nivel de aplicación permanece en silencio más allá de la ventana de seguridad más larga.

    Si los registros muestran `status=408 Request Time-out Connection was lost` repetido, ajusta
    los tiempos del socket de Baileys bajo `web.whatsapp`. Empieza acortando
    `keepAliveIntervalMs` por debajo del tiempo de espera por inactividad de tu red y aumentando
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
    openclaw doctor
    openclaw logs --follow
    ```

    Si `~/.openclaw/logs/whatsapp-health.log` dice `Gateway inactive` pero
    `openclaw gateway status` y `openclaw channels status --probe` muestran que el
    gateway y WhatsApp están sanos, ejecuta `openclaw doctor`. En Linux, doctor
    advierte sobre entradas heredadas de crontab que todavía invocan
    `~/.openclaw/bin/ensure-whatsapp.sh`; elimina esas entradas obsoletas con
    `crontab -e` porque cron puede carecer del entorno de bus de usuario de systemd y
    hacer que ese script antiguo informe incorrectamente el estado del gateway.

    Si es necesario, vuelve a vincular con `channels login`.

  </Accordion>

  <Accordion title="El inicio de sesión por QR agota el tiempo detrás de un proxy">
    Síntoma: `openclaw channels login --channel whatsapp` falla antes de mostrar un código QR utilizable con `status=408 Request Time-out` o una desconexión de socket TLS.

    El inicio de sesión de WhatsApp Web usa el entorno proxy estándar del host del gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes en minúsculas y `NO_PROXY`). Verifica que el proceso del gateway herede el entorno proxy y que `NO_PROXY` no coincida con `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Sin escuchador activo al enviar">
    Los envíos salientes fallan rápido cuando no existe un escuchador de gateway activo para la cuenta de destino.

    Asegúrate de que el gateway esté en ejecución y la cuenta esté vinculada.

  </Accordion>

  <Accordion title="La respuesta aparece en la transcripción pero no en WhatsApp">
    Las filas de transcripción registran lo que generó el agente. La entrega de WhatsApp se comprueba por separado: OpenClaw solo considera que una respuesta automática se ha enviado después de que Baileys devuelva un id de mensaje saliente para al menos un envío visible de texto o multimedia.

    Las reacciones de acuse son confirmaciones previas a la respuesta independientes. Una reacción correcta no demuestra que WhatsApp haya aceptado la respuesta posterior de texto o multimedia.

    Revisa los registros del gateway para `auto-reply delivery failed` o `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Mensajes de grupo ignorados inesperadamente">
    Comprueba en este orden:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas de lista de permitidos de `groups`
    - control por menciones (`requireMention` + patrones de mención)
    - claves duplicadas en `openclaw.json` (JSON5): las entradas posteriores anulan las anteriores, así que mantén un solo `groupPolicy` por ámbito

  </Accordion>

  <Accordion title="Advertencia de runtime de Bun">
    El runtime del gateway de WhatsApp debe usar Node. Bun se marca como incompatible para el funcionamiento estable del gateway de WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts del sistema

WhatsApp admite prompts del sistema de estilo Telegram para grupos y chats directos mediante los mapas `groups` y `direct`.

Jerarquía de resolución para mensajes de grupo:

El mapa `groups` efectivo se determina primero: si la cuenta define sus propios `groups`, reemplaza completamente el mapa `groups` raíz (sin fusión profunda). La búsqueda de prompt se ejecuta entonces en el único mapa resultante:

1. **Prompt del sistema específico del grupo** (`groups["<groupId>"].systemPrompt`): se usa cuando la entrada específica del grupo existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), se suprime el comodín y no se aplica ningún prompt del sistema.
2. **Prompt del sistema comodín de grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada específica del grupo está ausente por completo del mapa o cuando existe pero no define ninguna clave `systemPrompt`.

Jerarquía de resolución para mensajes directos:

El mapa `direct` efectivo se determina primero: si la cuenta define su propio `direct`, reemplaza completamente el mapa `direct` raíz (sin fusión profunda). La búsqueda de prompt se ejecuta entonces en el único mapa resultante:

1. **Prompt del sistema específico directo** (`direct["<peerId>"].systemPrompt`): se usa cuando la entrada del par específico existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), el comodín se suprime y no se aplica ningún prompt del sistema.
2. **Prompt del sistema comodín directo** (`direct["*"].systemPrompt`): se usa cuando la entrada del par específico está totalmente ausente del mapa, o cuando existe pero no define ninguna clave `systemPrompt`.

<Note>
`dms` sigue siendo el contenedor ligero de sobrescritura de historial por DM (`dms.<id>.historyLimit`). Las sobrescrituras de prompt residen bajo `direct`.
</Note>

**Diferencia respecto al comportamiento multicuenta de Telegram:** En Telegram, la raíz `groups` se suprime intencionalmente para todas las cuentas en una configuración multicuenta, incluso para cuentas que no definen sus propios `groups`, para evitar que un bot reciba mensajes de grupos a los que no pertenece. WhatsApp no aplica esta protección: la raíz `groups` y la raíz `direct` siempre las heredan las cuentas que no definen ninguna sobrescritura a nivel de cuenta, independientemente de cuántas cuentas estén configuradas. En una configuración multicuenta de WhatsApp, si quieres prompts de grupo o directos por cuenta, define explícitamente el mapa completo bajo cada cuenta en lugar de depender de los valores predeterminados a nivel raíz.

Comportamiento importante:

- `channels.whatsapp.groups` es tanto un mapa de configuración por grupo como la lista de permitidos de grupos a nivel de chat. En el ámbito raíz o de cuenta, `groups["*"]` significa "se admiten todos los grupos" para ese ámbito.
- Añade un `systemPrompt` de grupo comodín solo cuando ya quieras que ese ámbito admita todos los grupos. Si aún quieres que solo sea apto un conjunto fijo de IDs de grupo, no uses `groups["*"]` como valor predeterminado del prompt. En su lugar, repite el prompt en cada entrada de grupo incluida explícitamente en la lista de permitidos.
- La admisión de grupos y la autorización de remitentes son comprobaciones separadas. `groups["*"]` amplía el conjunto de grupos que pueden llegar al manejo de grupos, pero no autoriza por sí solo a todos los remitentes de esos grupos. El acceso de remitentes sigue controlándose por separado mediante `channels.whatsapp.groupPolicy` y `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` no tiene el mismo efecto secundario para los DM. `direct["*"]` solo proporciona una configuración predeterminada de chat directo después de que un DM ya haya sido admitido por `dmPolicy` más `allowFrom` o por reglas del almacén de emparejamiento.

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

Campos de alta señal de WhatsApp:

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
