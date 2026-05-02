---
read_when:
    - Trabajo en el comportamiento del canal WhatsApp/web o en el enrutamiento de la bandeja de entrada
summary: Compatibilidad con el canal de WhatsApp, controles de acceso, comportamiento de entrega y operaciones
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T05:21:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c25380f6a08e771b1a3f5e39f2284cffbffe76a3b05f1a885efe0a5f6a7d022c
    source_path: channels/whatsapp.md
    workflow: 16
---

Estado: listo para producción mediante WhatsApp Web (Baileys). Gateway posee las sesiones vinculadas.

## Instalación (bajo demanda)

- El onboarding (`openclaw onboard`) y `openclaw channels add --channel whatsapp`
  solicitan instalar el Plugin de WhatsApp la primera vez que lo seleccionas.
- `openclaw channels login --channel whatsapp` también ofrece el flujo de instalación cuando
  el Plugin todavía no está presente.
- Canal de desarrollo + checkout de git: usa de forma predeterminada la ruta del Plugin local.
- Stable/Beta: usa el paquete npm `@openclaw/whatsapp` cuando hay un paquete actual
  publicado.

La instalación manual sigue disponible:

```bash
openclaw plugins install @openclaw/whatsapp
```

Si npm informa que el paquete propiedad de OpenClaw está obsoleto o no existe, usa una
compilación empaquetada actual de OpenClaw o un checkout local hasta que la cadena de paquetes npm
se ponga al día.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos es emparejamiento para remitentes desconocidos.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos y guías de reparación entre canales.
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

  <Step title="Aprueba la primera solicitud de emparejamiento (si usas modo de emparejamiento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Las solicitudes de emparejamiento caducan después de 1 hora. Las solicitudes pendientes tienen un límite de 3 por canal.

  </Step>
</Steps>

<Note>
OpenClaw recomienda ejecutar WhatsApp en un número separado cuando sea posible. (Los metadatos del canal y el flujo de configuración están optimizados para esa configuración, pero también se admiten configuraciones con números personales).
</Note>

## Patrones de despliegue

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este es el modo operativo más limpio:

    - identidad de WhatsApp separada para OpenClaw
    - listas de permitidos de mensajes directos y límites de enrutamiento más claros
    - menor probabilidad de confusión con chats contigo mismo

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
    El onboarding admite el modo de número personal y escribe una base compatible con chats contigo mismo:

    - `dmPolicy: "allowlist"`
    - `allowFrom` incluye tu número personal
    - `selfChatMode: true`

    En tiempo de ejecución, las protecciones de chat contigo mismo se basan en el número propio vinculado y `allowFrom`.

  </Accordion>

  <Accordion title="Alcance de canal solo WhatsApp Web">
    El canal de plataforma de mensajería está basado en WhatsApp Web (`Baileys`) en la arquitectura actual de canales de OpenClaw.

    No hay un canal separado de mensajería de Twilio WhatsApp en el registro integrado de canales de chat.

  </Accordion>
</AccordionGroup>

## Modelo de tiempo de ejecución

- Gateway posee el socket de WhatsApp y el bucle de reconexión.
- El watchdog de reconexión usa la actividad de transporte de WhatsApp Web, no solo el volumen de mensajes entrantes de la aplicación, así que una sesión silenciosa de dispositivo vinculado no se reinicia solo porque nadie haya enviado un mensaje recientemente. Un límite más largo de silencio de aplicación sigue forzando una reconexión si siguen llegando tramas de transporte pero no se procesa ningún mensaje de aplicación durante la ventana del watchdog; después de una reconexión transitoria para una sesión activa recientemente, esa comprobación de silencio de aplicación usa el tiempo de espera normal de mensajes durante la primera ventana de recuperación.
- Los tiempos del socket de Baileys son explícitos bajo `web.whatsapp.*`: `keepAliveIntervalMs` controla los pings de aplicación de WhatsApp Web, `connectTimeoutMs` controla el tiempo de espera del handshake inicial y `defaultQueryTimeoutMs` controla los tiempos de espera de consultas de Baileys.
- Los envíos salientes requieren un listener activo de WhatsApp para la cuenta de destino.
- Los chats de estado y difusión se ignoran (`@status`, `@broadcast`).
- El watchdog de reconexión sigue la actividad de transporte de WhatsApp Web, no solo el volumen de mensajes entrantes de la aplicación: las sesiones silenciosas de dispositivos vinculados permanecen activas mientras continúen las tramas de transporte, pero un bloqueo de transporte fuerza una reconexión mucho antes de la ruta posterior de desconexión remota.
- Los chats directos usan reglas de sesión de mensajes directos (`session.dmScope`; el valor predeterminado `main` contrae los mensajes directos a la sesión principal del agente).
- Las sesiones de grupo están aisladas (`agent:<agentId>:whatsapp:group:<jid>`).
- El transporte de WhatsApp Web respeta las variables de entorno estándar de proxy en el host de Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minúsculas). Prefiere la configuración de proxy a nivel de host en lugar de ajustes de proxy específicos del canal de WhatsApp.
- Cuando `messages.removeAckAfterReply` está habilitado, OpenClaw borra la reacción de acuse de WhatsApp después de que se entrega una respuesta visible.

## Hooks de Plugin y privacidad

Los mensajes entrantes de WhatsApp pueden contener contenido personal de mensajes, números de teléfono,
identificadores de grupo, nombres de remitentes y campos de correlación de sesión. Por ese motivo,
WhatsApp no transmite payloads de hook `message_received` entrantes a plugins
a menos que lo aceptes explícitamente:

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

Puedes limitar la aceptación a una cuenta:

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

Habilita esto solo para plugins en los que confíes para recibir contenido e identificadores
de mensajes entrantes de WhatsApp.

## Control de acceso y activación

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.whatsapp.dmPolicy` controla el acceso a chats directos:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `allowFrom` acepta números con estilo E.164 (normalizados internamente).

    Anulación de varias cuentas: `channels.whatsapp.accounts.<id>.dmPolicy` (y `allowFrom`) tienen prioridad sobre los valores predeterminados a nivel de canal para esa cuenta.

    Detalles de comportamiento en tiempo de ejecución:

    - los emparejamientos se persisten en el allow-store del canal y se combinan con el `allowFrom` configurado
    - si no se configura ninguna lista de permitidos, el número propio vinculado se permite de forma predeterminada
    - OpenClaw nunca empareja automáticamente mensajes directos salientes `fromMe` (mensajes que te envías a ti mismo desde el dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupos + listas de permitidos">
    El acceso a grupos tiene dos capas:

    1. **Lista de permitidos de pertenencia a grupos** (`channels.whatsapp.groups`)
       - si se omite `groups`, todos los grupos son aptos
       - si `groups` está presente, actúa como lista de permitidos de grupos (`"*"` permitido)

    2. **Política de remitentes de grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: se omite la lista de permitidos de remitentes
       - `allowlist`: el remitente debe coincidir con `groupAllowFrom` (o `*`)
       - `disabled`: bloquea todas las entradas de grupo

    Reserva de lista de permitidos de remitentes:

    - si `groupAllowFrom` no está definido, el tiempo de ejecución recurre a `allowFrom` cuando está disponible
    - las listas de permitidos de remitentes se evalúan antes de la activación por mención/respuesta

    Nota: si no existe ningún bloque `channels.whatsapp`, la reserva de política de grupos en tiempo de ejecución es `allowlist` (con un log de advertencia), incluso si `channels.defaults.groupPolicy` está definido.

  </Tab>

  <Tab title="Menciones + /activation">
    Las respuestas de grupo requieren mención de forma predeterminada.

    La detección de menciones incluye:

    - menciones explícitas de WhatsApp a la identidad del bot
    - patrones regex de mención configurados (`agents.list[].groupChat.mentionPatterns`, reserva `messages.groupChat.mentionPatterns`)
    - transcripciones de notas de voz entrantes para mensajes de grupo autorizados
    - detección implícita de respuesta al bot (el remitente de la respuesta coincide con la identidad del bot)

    Nota de seguridad:

    - citar/responder solo satisface el filtro de mención; **no** concede autorización al remitente
    - con `groupPolicy: "allowlist"`, los remitentes que no estén en la lista de permitidos siguen bloqueados aunque respondan al mensaje de un usuario permitido

    Comando de activación a nivel de sesión:

    - `/activation mention`
    - `/activation always`

    `activation` actualiza el estado de la sesión (no la configuración global). Está restringido al propietario.

  </Tab>
</Tabs>

## Comportamiento de número personal y chat contigo mismo

Cuando el número propio vinculado también está presente en `allowFrom`, se activan las protecciones de WhatsApp para chats contigo mismo:

- omitir confirmaciones de lectura para turnos de chat contigo mismo
- ignorar el comportamiento de activación automática por JID de mención que, de otro modo, te haría ping a ti mismo
- si `messages.responsePrefix` no está definido, las respuestas de chat contigo mismo usan por defecto `[{identity.name}]` o `[openclaw]`

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

    Los campos de metadatos de respuesta también se rellenan cuando están disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del remitente).
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

    Las notas de voz de grupo autorizadas se transcriben antes del filtro de mención cuando el
    cuerpo es solo `<media:audio>`, así que decir la mención del bot en la nota de voz puede
    activar la respuesta. Si la transcripción todavía no menciona al bot, la
    transcripción se conserva en el historial de grupo pendiente en lugar del marcador de posición sin procesar.

    Los cuerpos de ubicación usan texto conciso de coordenadas. Las etiquetas/comentarios de ubicación y los detalles de contacto/vCard se renderizan como metadatos no confiables delimitados, no como texto de prompt en línea.

  </Accordion>

  <Accordion title="Inyección de historial de grupo pendiente">
    Para los grupos, los mensajes no procesados pueden almacenarse en búfer e inyectarse como contexto cuando finalmente se activa el bot.

    - límite predeterminado: `50`
    - configuración: `channels.whatsapp.historyLimit`
    - reserva: `messages.groupChat.historyLimit`
    - `0` deshabilita

    Marcadores de inyección:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Confirmaciones de lectura">
    Las confirmaciones de lectura están habilitadas de forma predeterminada para mensajes entrantes aceptados de WhatsApp.

    Deshabilitar globalmente:

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

    Los turnos de chat contigo mismo omiten las confirmaciones de lectura incluso cuando están habilitadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentación y medios

<AccordionGroup>
  <Accordion title="Fragmentación de texto">
    - límite de fragmento predeterminado: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - el modo `newline` prefiere los límites de párrafo (líneas en blanco) y luego recurre a la fragmentación segura por longitud

  </Accordion>

  <Accordion title="Comportamiento de medios salientes">
    - admite cargas de imagen, video, audio (nota de voz PTT) y documento
    - los medios de audio se envían mediante la carga `audio` de Baileys con `ptt: true`, por lo que los clientes de WhatsApp los muestran como una nota de voz de pulsar para hablar
    - las cargas de respuesta conservan `audioAsVoice`; la salida de nota de voz TTS para WhatsApp permanece en esta ruta PTT incluso cuando el proveedor devuelve MP3 o WebM
    - el audio nativo Ogg/Opus se envía como `audio/ogg; codecs=opus` para compatibilidad con notas de voz
    - el audio que no es Ogg, incluida la salida MP3/WebM de Microsoft Edge TTS, se transcodifica con `ffmpeg` a Ogg/Opus mono de 48 kHz antes de la entrega PTT
    - `/tts latest` envía la respuesta más reciente del asistente como una nota de voz y suprime envíos repetidos para la misma respuesta; `/tts chat on|off|default` controla el TTS automático para el chat actual de WhatsApp
    - la reproducción de GIF animados se admite mediante `gifPlayback: true` en envíos de video
    - los subtítulos se aplican al primer elemento multimedia al enviar cargas de respuesta con varios medios, excepto que las notas de voz PTT envían primero el audio y el texto visible por separado porque los clientes de WhatsApp no muestran subtítulos de notas de voz de forma consistente
    - el origen de los medios puede ser HTTP(S), `file://` o rutas locales

  </Accordion>

  <Accordion title="Límites de tamaño de medios y comportamiento de respaldo">
    - límite de guardado de medios entrantes: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - límite de envío de medios salientes: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - las anulaciones por cuenta usan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - las imágenes se optimizan automáticamente (redimensionado/barrido de calidad) para ajustarse a los límites
    - en caso de fallo de envío de medios, el respaldo del primer elemento envía una advertencia de texto en lugar de descartar la respuesta silenciosamente

  </Accordion>
</AccordionGroup>

## Cita de respuestas

WhatsApp admite cita nativa de respuestas, donde las respuestas salientes citan visiblemente el mensaje entrante. Contrólala con `channels.whatsapp.replyToMode`.

| Valor       | Comportamiento                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nunca citar; enviar como mensaje simple                                  |
| `"first"`   | Citar solo el primer fragmento de respuesta saliente                             |
| `"all"`     | Citar cada fragmento de respuesta saliente                                      |
| `"batched"` | Citar respuestas en cola por lotes y dejar las respuestas inmediatas sin citar |

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

`channels.whatsapp.reactionLevel` controla cuán ampliamente el agente usa reacciones con emoji en WhatsApp:

| Nivel         | Reacciones de confirmación | Reacciones iniciadas por el agente | Descripción                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | No            | No                        | Sin reacciones en absoluto                              |
| `"ack"`       | Sí           | No                        | Solo reacciones de confirmación (recibo previo a la respuesta)           |
| `"minimal"`   | Sí           | Sí (conservador)        | Confirmación + reacciones del agente con orientación conservadora |
| `"extensive"` | Sí           | Sí (recomendado)          | Confirmación + reacciones del agente con orientación recomendada   |

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

## Reacciones de confirmación

WhatsApp admite reacciones de confirmación inmediatas al recibir mensajes entrantes mediante `channels.whatsapp.ackReaction`.
Las reacciones de confirmación están controladas por `reactionLevel`; se suprimen cuando `reactionLevel` es `"off"`.

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

- se envían inmediatamente después de que se acepta el mensaje entrante (antes de la respuesta)
- los fallos se registran, pero no bloquean la entrega normal de respuestas
- el modo de grupo `mentions` reacciona en turnos activados por mención; la activación de grupo `always` actúa como omisión de esta comprobación
- WhatsApp usa `channels.whatsapp.ackReaction` (el legado `messages.ackReaction` no se usa aquí)

## Varias cuentas y credenciales

<AccordionGroup>
  <Accordion title="Selección de cuenta y valores predeterminados">
    - los id. de cuenta provienen de `channels.whatsapp.accounts`
    - selección de cuenta predeterminada: `default` si está presente; de lo contrario, el primer id. de cuenta configurado (ordenado)
    - los id. de cuenta se normalizan internamente para la búsqueda

  </Accordion>

  <Accordion title="Rutas de credenciales y compatibilidad heredada">
    - ruta de autenticación actual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - archivo de copia de seguridad: `creds.json.bak`
    - la autenticación predeterminada heredada en `~/.openclaw/credentials/` aún se reconoce/migra para flujos de cuenta predeterminada

  </Accordion>

  <Accordion title="Comportamiento de cierre de sesión">
    `openclaw channels logout --channel whatsapp [--account <id>]` borra el estado de autenticación de WhatsApp para esa cuenta.

    Cuando se puede alcanzar un Gateway, el cierre de sesión primero detiene el listener activo de WhatsApp para la cuenta seleccionada, de modo que la sesión vinculada no siga recibiendo mensajes hasta el siguiente reinicio. `openclaw channels remove --channel whatsapp` también detiene el listener activo antes de deshabilitar o eliminar la configuración de la cuenta.

    En directorios de autenticación heredados, `oauth.json` se conserva mientras se eliminan los archivos de autenticación de Baileys.

  </Accordion>
</AccordionGroup>

## Herramientas, acciones y escrituras de configuración

- La compatibilidad de herramientas del agente incluye la acción de reacción de WhatsApp (`react`).
- Controles de acciones:
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

    Las cuentas silenciosas pueden mantenerse conectadas más allá del tiempo de espera normal de mensajes; el watchdog
    reinicia cuando se detiene la actividad de transporte de WhatsApp Web, se cierra el socket o
    la actividad a nivel de aplicación permanece silenciosa más allá de la ventana de seguridad más larga.

    Si los registros muestran repetidamente `status=408 Request Time-out Connection was lost`, ajusta
    los tiempos del socket de Baileys en `web.whatsapp`. Empieza reduciendo
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
    Gateway y WhatsApp están en buen estado, ejecuta `openclaw doctor`. En Linux, doctor
    advierte sobre entradas de crontab heredadas que aún invocan
    `~/.openclaw/bin/ensure-whatsapp.sh`; elimina esas entradas obsoletas con
    `crontab -e` porque cron puede carecer del entorno de bus de usuario de systemd y
    hacer que ese script antiguo informe incorrectamente el estado del Gateway.

    Si es necesario, vuelve a vincular con `channels login`.

  </Accordion>

  <Accordion title="El inicio de sesión QR agota el tiempo tras un proxy">
    Síntoma: `openclaw channels login --channel whatsapp` falla antes de mostrar un código QR utilizable con `status=408 Request Time-out` o una desconexión de socket TLS.

    El inicio de sesión de WhatsApp Web usa el entorno proxy estándar del host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes en minúsculas y `NO_PROXY`). Verifica que el proceso del Gateway herede el entorno proxy y que `NO_PROXY` no coincida con `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Sin listener activo al enviar">
    Los envíos salientes fallan rápido cuando no existe ningún listener de Gateway activo para la cuenta de destino.

    Asegúrate de que el Gateway esté en ejecución y de que la cuenta esté vinculada.

  </Accordion>

  <Accordion title="La respuesta aparece en la transcripción, pero no en WhatsApp">
    Las filas de transcripción registran lo que generó el agente. La entrega en WhatsApp se comprueba por separado: OpenClaw solo trata una respuesta automática como enviada después de que Baileys devuelve un id. de mensaje saliente para al menos un envío visible de texto o medios.

    Las reacciones de confirmación son recibos independientes previos a la respuesta. Una reacción correcta no demuestra que la respuesta posterior de texto o medios haya sido aceptada por WhatsApp.

    Revisa los registros del Gateway en busca de `auto-reply delivery failed` o `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran inesperadamente">
    Comprueba en este orden:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas de lista de permitidos de `groups`
    - control por mención (`requireMention` + patrones de mención)
    - claves duplicadas en `openclaw.json` (JSON5): las entradas posteriores sobrescriben las anteriores, así que mantén un único `groupPolicy` por ámbito

  </Accordion>

  <Accordion title="Advertencia de runtime de Bun">
    El runtime de Gateway de WhatsApp debe usar Node. Bun se marca como incompatible para el funcionamiento estable del Gateway de WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts del sistema

WhatsApp admite prompts del sistema de estilo Telegram para grupos y chats directos mediante los mapas `groups` y `direct`.

Jerarquía de resolución para mensajes de grupo:

El mapa efectivo `groups` se determina primero: si la cuenta define sus propios `groups`, reemplaza por completo el mapa raíz `groups` (sin fusión profunda). La búsqueda de prompt se ejecuta entonces en el mapa único resultante:

1. **Prompt del sistema específico del grupo** (`groups["<groupId>"].systemPrompt`): se usa cuando la entrada específica del grupo existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), se suprime el comodín y no se aplica ningún prompt del sistema.
2. **Prompt del sistema comodín de grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada específica del grupo está totalmente ausente del mapa, o cuando existe pero no define ninguna clave `systemPrompt`.

Jerarquía de resolución para mensajes directos:

El mapa efectivo `direct` se determina primero: si la cuenta define su propio `direct`, reemplaza por completo el mapa raíz `direct` (sin fusión profunda). La búsqueda de prompt se ejecuta entonces en el mapa único resultante:

1. **Prompt del sistema específico de mensaje directo** (`direct["<peerId>"].systemPrompt`): se usa cuando la entrada específica del par existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), se suprime el comodín y no se aplica ningún prompt del sistema.
2. **Prompt del sistema comodín de mensaje directo** (`direct["*"].systemPrompt`): se usa cuando la entrada específica del par está totalmente ausente del mapa, o cuando existe pero no define ninguna clave `systemPrompt`.

<Note>
`dms` sigue siendo el contenedor ligero de anulación de historial por DM (`dms.<id>.historyLimit`). Las anulaciones de prompts viven en `direct`.
</Note>

**Diferencia con el comportamiento de varias cuentas de Telegram:** En Telegram, `groups` raíz se suprime intencionalmente para todas las cuentas en una configuración de varias cuentas — incluso para las cuentas que no definen sus propios `groups` — para evitar que un bot reciba mensajes de grupos a los que no pertenece. WhatsApp no aplica esta protección: `groups` raíz y `direct` raíz siempre se heredan en las cuentas que no definen una anulación a nivel de cuenta, independientemente de cuántas cuentas estén configuradas. En una configuración de varias cuentas de WhatsApp, si quieres prompts de grupo o directos por cuenta, define explícitamente el mapa completo bajo cada cuenta en lugar de depender de valores predeterminados a nivel raíz.

Comportamiento importante:

- `channels.whatsapp.groups` es tanto un mapa de configuración por grupo como la lista de permitidos de grupos a nivel de chat. En el ámbito raíz o de cuenta, `groups["*"]` significa "todos los grupos están admitidos" para ese ámbito.
- Añade un `systemPrompt` de grupo comodín solo cuando ya quieres que ese ámbito admita todos los grupos. Si todavía quieres que solo un conjunto fijo de IDs de grupo sea elegible, no uses `groups["*"]` como valor predeterminado del prompt. En su lugar, repite el prompt en cada entrada de grupo incluida explícitamente en la lista de permitidos.
- La admisión de grupos y la autorización de remitentes son comprobaciones separadas. `groups["*"]` amplía el conjunto de grupos que pueden llegar al manejo de grupos, pero por sí solo no autoriza a todos los remitentes de esos grupos. El acceso de remitentes sigue controlándose por separado mediante `channels.whatsapp.groupPolicy` y `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` no tiene el mismo efecto secundario para los MD. `direct["*"]` solo proporciona una configuración directa predeterminada de chat después de que un MD ya haya sido admitido por `dmPolicy` más `allowFrom` o reglas del almacén de emparejamiento.

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

## Referencias de configuración

Referencia principal:

- [Referencia de configuración - WhatsApp](/es/gateway/config-channels#whatsapp)

Campos clave de WhatsApp:

- acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- varias cuentas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, anulaciones a nivel de cuenta
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
