---
read_when:
    - Trabajando en el comportamiento del canal de WhatsApp/web o en el enrutamiento de la bandeja de entrada
summary: Soporte del canal de WhatsApp, controles de acceso, comportamiento de entrega y operaciones
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T18:17:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0935e7ac3676c57d83173a6dd9eedc489f77b278dfbc47bd811045078ee7e4d0
    source_path: channels/whatsapp.md
    workflow: 15
---

Estado: listo para producción mediante WhatsApp Web (Baileys). El Gateway es propietario de la(s) sesión(es) vinculada(s).

## Instalación (bajo demanda)

- La incorporación (`openclaw onboard`) y `openclaw channels add --channel whatsapp`
  solicitan instalar el plugin de WhatsApp la primera vez que lo seleccionas.
- `openclaw channels login --channel whatsapp` también ofrece el flujo de instalación cuando
  el plugin aún no está presente.
- Canal de desarrollo + checkout de git: usa por defecto la ruta local del plugin.
- Estable/Beta: usa por defecto el paquete npm `@openclaw/whatsapp`.

La instalación manual sigue estando disponible:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos es vinculación para remitentes desconocidos.
  </Card>
  <Card title="Solución de problemas del canal" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
  <Card title="Configuración del Gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración del canal.
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

    Para adjuntar un directorio de autenticación existente/personalizado de WhatsApp Web antes de iniciar sesión:

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

  <Step title="Aprobar la primera solicitud de vinculación (si usas el modo de vinculación)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Las solicitudes de vinculación caducan después de 1 hora. Las solicitudes pendientes están limitadas a 3 por canal.

  </Step>
</Steps>

<Note>
OpenClaw recomienda ejecutar WhatsApp con un número separado cuando sea posible. (Los metadatos del canal y el flujo de configuración están optimizados para esa configuración, pero las configuraciones con número personal también son compatibles).
</Note>

## Patrones de implementación

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este es el modo operativo más limpio:

    - identidad de WhatsApp separada para OpenClaw
    - listas de permitidos de mensajes directos y límites de enrutamiento más claros
    - menor probabilidad de confusión con el chat propio

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
    La incorporación admite el modo de número personal y escribe una configuración base apta para el chat propio:

    - `dmPolicy: "allowlist"`
    - `allowFrom` incluye tu número personal
    - `selfChatMode: true`

    En tiempo de ejecución, las protecciones de chat propio se basan en el número propio vinculado y en `allowFrom`.

  </Accordion>

  <Accordion title="Alcance del canal solo para WhatsApp Web">
    El canal de la plataforma de mensajería está basado en WhatsApp Web (`Baileys`) en la arquitectura actual de canales de OpenClaw.

    No hay un canal de mensajería de WhatsApp de Twilio separado en el registro integrado de canales de chat.

  </Accordion>
</AccordionGroup>

## Modelo de tiempo de ejecución

- El Gateway es propietario del socket de WhatsApp y del bucle de reconexión.
- Los envíos salientes requieren un listener activo de WhatsApp para la cuenta de destino.
- Los chats de estado y de difusión se ignoran (`@status`, `@broadcast`).
- Los chats directos usan reglas de sesión de mensajes directos (`session.dmScope`; el valor predeterminado `main` colapsa los mensajes directos en la sesión principal del agente).
- Las sesiones de grupo están aisladas (`agent:<agentId>:whatsapp:group:<jid>`).
- El transporte de WhatsApp Web respeta las variables de entorno de proxy estándar en el host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minúsculas). Prefiere la configuración de proxy a nivel de host en lugar de la configuración de proxy de WhatsApp específica del canal.

## Hooks del plugin y privacidad

Los mensajes entrantes de WhatsApp pueden contener contenido personal de mensajes, números de teléfono,
identificadores de grupo, nombres de remitentes y campos de correlación de sesión. Por esa razón,
WhatsApp no transmite cargas útiles de hooks entrantes `message_received` a los plugins
a menos que actives esto explícitamente:

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

Activa esto solo para plugins en los que confíes para recibir contenido
e identificadores de mensajes entrantes de WhatsApp.

## Control de acceso y activación

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.whatsapp.dmPolicy` controla el acceso a chats directos:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `allowFrom` acepta números con formato E.164 (normalizados internamente).

    Reemplazo para múltiples cuentas: `channels.whatsapp.accounts.<id>.dmPolicy` (y `allowFrom`) tienen prioridad sobre los valores predeterminados a nivel de canal para esa cuenta.

    Detalles del comportamiento en tiempo de ejecución:

    - las vinculaciones se conservan en el almacén de permitidos del canal y se combinan con `allowFrom` configurado
    - si no se configura ninguna lista de permitidos, el número propio vinculado se permite de forma predeterminada
    - OpenClaw nunca vincula automáticamente mensajes directos salientes `fromMe` (mensajes que te envías a ti mismo desde el dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupo + listas de permitidos">
    El acceso a grupos tiene dos capas:

    1. **Lista de permitidos de pertenencia al grupo** (`channels.whatsapp.groups`)
       - si se omite `groups`, todos los grupos son aptos
       - si `groups` está presente, actúa como una lista de permitidos de grupos (se permite `"*"`)

    2. **Política de remitentes del grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: se omite la lista de permitidos de remitentes
       - `allowlist`: el remitente debe coincidir con `groupAllowFrom` (o `*`)
       - `disabled`: bloquea toda entrada de grupos

    Reserva de lista de permitidos de remitentes:

    - si `groupAllowFrom` no está definido, el tiempo de ejecución usa `allowFrom` como reserva cuando está disponible
    - las listas de permitidos de remitentes se evalúan antes de la activación por mención/respuesta

    Nota: si no existe ningún bloque `channels.whatsapp`, la reserva de política de grupo en tiempo de ejecución es `allowlist` (con una advertencia en el registro), incluso si `channels.defaults.groupPolicy` está establecido.

  </Tab>

  <Tab title="Menciones + /activation">
    Las respuestas en grupos requieren mención de forma predeterminada.

    La detección de mención incluye:

    - menciones explícitas de WhatsApp a la identidad del bot
    - patrones regex de mención configurados (`agents.list[].groupChat.mentionPatterns`, con reserva en `messages.groupChat.mentionPatterns`)
    - detección implícita de respuesta al bot (el remitente de la respuesta coincide con la identidad del bot)

    Nota de seguridad:

    - citar/responder solo satisface la restricción de mención; **no** concede autorización al remitente
    - con `groupPolicy: "allowlist"`, los remitentes que no están en la lista de permitidos siguen bloqueados aunque respondan al mensaje de un usuario que sí está en la lista

    Comando de activación a nivel de sesión:

    - `/activation mention`
    - `/activation always`

    `activation` actualiza el estado de la sesión (no la configuración global). Está restringido al propietario.

  </Tab>
</Tabs>

## Comportamiento con número personal y chat propio

Cuando el número propio vinculado también está presente en `allowFrom`, se activan las protecciones de chat propio de WhatsApp:

- omitir confirmaciones de lectura en turnos de chat propio
- ignorar el comportamiento de activación automática por JID de mención que, de otro modo, te haría ping a ti mismo
- si `messages.responsePrefix` no está definido, las respuestas de chat propio usan por defecto `[{identity.name}]` o `[openclaw]`

## Normalización de mensajes y contexto

<AccordionGroup>
  <Accordion title="Sobre entrante + contexto de respuesta">
    Los mensajes entrantes de WhatsApp se encapsulan en el sobre compartido de entrada.

    Si existe una respuesta citada, el contexto se añade de esta forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Los campos de metadatos de respuesta también se completan cuando están disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, remitente JID/E.164).

  </Accordion>

  <Accordion title="Marcadores de posición de medios y extracción de ubicación/contacto">
    Los mensajes entrantes solo de medios se normalizan con marcadores de posición como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Los cuerpos de ubicación usan texto conciso de coordenadas. Las etiquetas/comentarios de ubicación y los detalles de contacto/vCard se muestran como metadatos no confiables delimitados, no como texto en línea del prompt.

  </Accordion>

  <Accordion title="Inyección del historial pendiente de grupos">
    Para grupos, los mensajes no procesados pueden almacenarse en búfer e inyectarse como contexto cuando finalmente se activa el bot.

    - límite predeterminado: `50`
    - configuración: `channels.whatsapp.historyLimit`
    - reserva: `messages.groupChat.historyLimit`
    - `0` desactiva

    Marcadores de inyección:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Confirmaciones de lectura">
    Las confirmaciones de lectura están activadas de forma predeterminada para los mensajes entrantes de WhatsApp aceptados.

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

    Reemplazo por cuenta:

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

## Entrega, fragmentación y medios

<AccordionGroup>
  <Accordion title="Fragmentación de texto">
    - límite predeterminado de fragmento: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - el modo `newline` prioriza los límites de párrafo (líneas en blanco), y luego recurre a una fragmentación segura por longitud
  </Accordion>

  <Accordion title="Comportamiento de medios salientes">
    - admite cargas útiles de imagen, video, audio (nota de voz PTT) y documento
    - las cargas útiles de respuesta conservan `audioAsVoice`; WhatsApp envía medios de audio como notas de voz PTT de Baileys
    - el audio que no sea Ogg, incluida la salida MP3/WebM de Microsoft Edge TTS, se transcodifica a Ogg/Opus antes de la entrega PTT
    - el audio nativo Ogg/Opus se envía con `audio/ogg; codecs=opus` para compatibilidad con notas de voz
    - la reproducción de GIF animados es compatible mediante `gifPlayback: true` en envíos de video
    - los subtítulos se aplican al primer elemento multimedia al enviar cargas útiles de respuesta con múltiples medios, excepto que las notas de voz PTT envían primero el audio y el texto visible por separado porque los clientes de WhatsApp no muestran los subtítulos de notas de voz de manera consistente
    - la fuente de medios puede ser HTTP(S), `file://` o rutas locales
  </Accordion>

  <Accordion title="Límites de tamaño de medios y comportamiento de reserva">
    - límite de guardado de medios entrantes: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - límite de envío de medios salientes: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - los reemplazos por cuenta usan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - las imágenes se optimizan automáticamente (barrido de tamaño/calidad) para ajustarse a los límites
    - ante un fallo en el envío de medios, la reserva del primer elemento envía una advertencia de texto en lugar de descartar la respuesta en silencio
  </Accordion>
</AccordionGroup>

## Cita de respuestas

WhatsApp admite la cita nativa de respuestas, donde las respuestas salientes citan visiblemente el mensaje entrante. Contrólalo con `channels.whatsapp.replyToMode`.

| Valor       | Comportamiento                                                       |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nunca citar; enviar como mensaje sin formato                         |
| `"first"`   | Citar solo el primer fragmento de respuesta saliente                 |
| `"all"`     | Citar cada fragmento de respuesta saliente                           |
| `"batched"` | Citar las respuestas por lotes en cola dejando sin citar las respuestas inmediatas |

El valor predeterminado es `"off"`. Los reemplazos por cuenta usan `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` controla qué tan ampliamente usa el agente reacciones con emoji en WhatsApp:

| Nivel         | Reacciones de acuse | Reacciones iniciadas por el agente | Descripción                                      |
| ------------- | ------------------- | ---------------------------------- | ------------------------------------------------ |
| `"off"`       | No                  | No                                 | Sin reacciones en absoluto                       |
| `"ack"`       | Sí                  | No                                 | Solo reacciones de acuse (acuse previo a respuesta) |
| `"minimal"`   | Sí                  | Sí (conservadoras)                 | Acuse + reacciones del agente con orientación conservadora |
| `"extensive"` | Sí                  | Sí (fomentadas)                    | Acuse + reacciones del agente con orientación fomentada |

Predeterminado: `"minimal"`.

Los reemplazos por cuenta usan `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp admite reacciones inmediatas de acuse al recibir mensajes entrantes mediante `channels.whatsapp.ackReaction`.
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

- se envían inmediatamente después de que se acepta la entrada (antes de la respuesta)
- los fallos se registran, pero no bloquean la entrega normal de respuestas
- el modo de grupo `mentions` reacciona en turnos activados por mención; la activación de grupo `always` actúa como omisión de esta comprobación
- WhatsApp usa `channels.whatsapp.ackReaction` (aquí no se usa el heredado `messages.ackReaction`)

## Múltiples cuentas y credenciales

<AccordionGroup>
  <Accordion title="Selección de cuenta y valores predeterminados">
    - los ID de cuenta provienen de `channels.whatsapp.accounts`
    - selección de cuenta predeterminada: `default` si está presente; de lo contrario, el primer ID de cuenta configurado (ordenado)
    - los ID de cuenta se normalizan internamente para la búsqueda
  </Accordion>

  <Accordion title="Rutas de credenciales y compatibilidad heredada">
    - ruta actual de autenticación: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - archivo de respaldo: `creds.json.bak`
    - la autenticación predeterminada heredada en `~/.openclaw/credentials/` sigue reconociéndose/migrándose para flujos de cuenta predeterminada
  </Accordion>

  <Accordion title="Comportamiento de cierre de sesión">
    `openclaw channels logout --channel whatsapp [--account <id>]` borra el estado de autenticación de WhatsApp para esa cuenta.

    En directorios de autenticación heredados, se conserva `oauth.json` mientras se eliminan los archivos de autenticación de Baileys.

  </Accordion>
</AccordionGroup>

## Herramientas, acciones y escrituras de configuración

- La compatibilidad de herramientas del agente incluye la acción de reacción de WhatsApp (`react`).
- Controles de acciones:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Las escrituras de configuración iniciadas por el canal están habilitadas de forma predeterminada (desactívalas con `channels.whatsapp.configWrites=false`).

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

    Solución:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Si es necesario, vuelve a vincular con `channels login`.

  </Accordion>

  <Accordion title="No hay listener activo al enviar">
    Los envíos salientes fallan rápidamente cuando no existe un listener activo del gateway para la cuenta de destino.

    Asegúrate de que el gateway esté en ejecución y de que la cuenta esté vinculada.

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran inesperadamente">
    Comprueba en este orden:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas de lista de permitidos de `groups`
    - control por mención (`requireMention` + patrones de mención)
    - claves duplicadas en `openclaw.json` (JSON5): las entradas posteriores reemplazan a las anteriores, así que mantén un único `groupPolicy` por ámbito

  </Accordion>

  <Accordion title="Advertencia del tiempo de ejecución de Bun">
    El tiempo de ejecución del gateway de WhatsApp debe usar Node. Bun está marcado como incompatible para una operación estable del gateway de WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts del sistema

WhatsApp admite prompts del sistema al estilo Telegram para grupos y chats directos mediante los mapas `groups` y `direct`.

Jerarquía de resolución para mensajes de grupo:

Primero se determina el mapa `groups` efectivo: si la cuenta define su propio `groups`, reemplaza por completo el mapa `groups` raíz (sin combinación profunda). Luego, la búsqueda del prompt se ejecuta sobre el mapa único resultante:

1. **Prompt del sistema específico del grupo** (`groups["<groupId>"].systemPrompt`): se usa cuando la entrada específica del grupo existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), el comodín se suprime y no se aplica ningún prompt del sistema.
2. **Prompt del sistema comodín del grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada específica del grupo está completamente ausente del mapa, o cuando existe pero no define ninguna clave `systemPrompt`.

Jerarquía de resolución para mensajes directos:

Primero se determina el mapa `direct` efectivo: si la cuenta define su propio `direct`, reemplaza por completo el mapa `direct` raíz (sin combinación profunda). Luego, la búsqueda del prompt se ejecuta sobre el mapa único resultante:

1. **Prompt del sistema específico del chat directo** (`direct["<peerId>"].systemPrompt`): se usa cuando la entrada específica del par existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), el comodín se suprime y no se aplica ningún prompt del sistema.
2. **Prompt del sistema comodín del chat directo** (`direct["*"].systemPrompt`): se usa cuando la entrada específica del par está completamente ausente del mapa, o cuando existe pero no define ninguna clave `systemPrompt`.

Nota: `dms` sigue siendo el contenedor ligero de reemplazo de historial por mensaje directo (`dms.<id>.historyLimit`); los reemplazos de prompt viven bajo `direct`.

**Diferencia con el comportamiento de múltiples cuentas de Telegram:** En Telegram, `groups` raíz se suprime intencionadamente para todas las cuentas en una configuración de múltiples cuentas —incluso en cuentas que no definen su propio `groups`— para evitar que un bot reciba mensajes de grupo de grupos a los que no pertenece. WhatsApp no aplica esta protección: `groups` raíz y `direct` raíz siempre se heredan en las cuentas que no definen un reemplazo a nivel de cuenta, independientemente de cuántas cuentas estén configuradas. En una configuración de WhatsApp con múltiples cuentas, si quieres prompts de grupo o directos por cuenta, define el mapa completo bajo cada cuenta explícitamente en lugar de depender de los valores predeterminados a nivel raíz.

Comportamiento importante:

- `channels.whatsapp.groups` es tanto un mapa de configuración por grupo como la lista de permitidos de grupos a nivel de chat. Tanto en el ámbito raíz como en el de cuenta, `groups["*"]` significa "todos los grupos están admitidos" para ese ámbito.
- Agrega un `systemPrompt` de grupo comodín solo cuando ya quieras que ese ámbito admita todos los grupos. Si aún quieres que solo un conjunto fijo de ID de grupo sea apto, no uses `groups["*"]` como valor predeterminado del prompt. En su lugar, repite el prompt en cada entrada de grupo permitida explícitamente.
- La admisión de grupos y la autorización de remitentes son comprobaciones separadas. `groups["*"]` amplía el conjunto de grupos que pueden llegar al manejo de grupos, pero por sí solo no autoriza a todos los remitentes de esos grupos. El acceso del remitente sigue controlándose por separado mediante `channels.whatsapp.groupPolicy` y `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` no tiene el mismo efecto secundario para los mensajes directos. `direct["*"]` solo proporciona una configuración predeterminada del chat directo después de que un mensaje directo ya haya sido admitido por `dmPolicy` más las reglas de `allowFrom` o del almacén de vinculaciones.

Ejemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Úsalo solo si todos los grupos deben admitirse en el ámbito raíz.
        // Se aplica a todas las cuentas que no definen su propio mapa groups.
        "*": { systemPrompt: "Prompt predeterminado para todos los grupos." },
      },
      direct: {
        // Se aplica a todas las cuentas que no definen su propio mapa direct.
        "*": { systemPrompt: "Prompt predeterminado para todos los chats directos." },
      },
      accounts: {
        work: {
          groups: {
            // Esta cuenta define su propio groups, por lo que groups raíz se
            // reemplaza por completo. Para conservar un comodín, define aquí
            // también "*" explícitamente.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Céntrate en la gestión de proyectos.",
            },
            // Úsalo solo si todos los grupos deben admitirse en esta cuenta.
            "*": { systemPrompt: "Prompt predeterminado para grupos de trabajo." },
          },
          direct: {
            // Esta cuenta define su propio direct, por lo que las entradas direct
            // raíz se reemplazan por completo. Para conservar un comodín, define
            // aquí también "*" explícitamente.
            "+15551234567": { systemPrompt: "Prompt para un chat directo de trabajo específico." },
            "*": { systemPrompt: "Prompt predeterminado para chats directos de trabajo." },
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

Campos de WhatsApp de alta relevancia:

- acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- múltiples cuentas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, reemplazos a nivel de cuenta
- operaciones: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamiento de sesión: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionado

- [Vinculación](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Enrutamiento de múltiples agentes](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
