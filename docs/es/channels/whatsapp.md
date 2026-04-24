---
read_when:
    - Trabajando en el comportamiento del canal de WhatsApp/web o en el enrutamiento de la bandeja de entrada
summary: Soporte del canal de WhatsApp, controles de acceso, comportamiento de entrega y operaciones
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T05:21:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0261e132d459c91f5d81d5ad9485acbdf5792e6bfc8cd33bb74e45192df9fd2f
    source_path: channels/whatsapp.md
    workflow: 15
---

Estado: listo para producción mediante WhatsApp Web (Baileys). Gateway gestiona las sesiones vinculadas.

## Instalación (bajo demanda)

- La incorporación (`openclaw onboard`) y `openclaw channels add --channel whatsapp`
  solicitan instalar el Plugin de WhatsApp la primera vez que lo seleccionas.
- `openclaw channels login --channel whatsapp` también ofrece el flujo de instalación cuando
  el Plugin aún no está presente.
- Canal de desarrollo + checkout de git: usa de forma predeterminada la ruta local del Plugin.
- Estable/Beta: usa de forma predeterminada el paquete npm `@openclaw/whatsapp`.

La instalación manual sigue estando disponible:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos es el emparejamiento para remitentes desconocidos.
  </Card>
  <Card title="Solución de problemas del canal" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
  <Card title="Configuración de Gateway" icon="settings" href="/es/gateway/configuration">
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

  </Step>

  <Step title="Iniciar el gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Aprobar la primera solicitud de emparejamiento (si usas el modo de emparejamiento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Las solicitudes de emparejamiento caducan después de 1 hora. Las solicitudes pendientes están limitadas a 3 por canal.

  </Step>
</Steps>

<Note>
OpenClaw recomienda ejecutar WhatsApp en un número independiente cuando sea posible. (Los metadatos del canal y el flujo de configuración están optimizados para esa configuración, pero también se admiten configuraciones con número personal).
</Note>

## Patrones de implementación

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este es el modo operativo más limpio:

    - identidad de WhatsApp separada para OpenClaw
    - límites de allowlist y enrutamiento de mensajes directos más claros
    - menor probabilidad de confusión en chats con uno mismo

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

  <Accordion title="Respaldo con número personal">
    La incorporación admite el modo de número personal y escribe una configuración base compatible con chat con uno mismo:

    - `dmPolicy: "allowlist"`
    - `allowFrom` incluye tu número personal
    - `selfChatMode: true`

    En tiempo de ejecución, las protecciones de chat con uno mismo se basan en el número propio vinculado y en `allowFrom`.

  </Accordion>

  <Accordion title="Alcance del canal solo de WhatsApp Web">
    El canal de la plataforma de mensajería se basa en WhatsApp Web (`Baileys`) en la arquitectura actual de canales de OpenClaw.

    No existe un canal independiente de mensajería de WhatsApp por Twilio en el registro integrado de canales de chat.

  </Accordion>
</AccordionGroup>

## Modelo de ejecución

- Gateway gestiona el socket de WhatsApp y el bucle de reconexión.
- Los envíos salientes requieren un listener activo de WhatsApp para la cuenta de destino.
- Los chats de estado y difusión se ignoran (`@status`, `@broadcast`).
- Los chats directos usan reglas de sesión de mensajes directos (`session.dmScope`; de forma predeterminada `main` colapsa los mensajes directos en la sesión principal del agente).
- Las sesiones de grupo están aisladas (`agent:<agentId>:whatsapp:group:<jid>`).
- El transporte de WhatsApp Web respeta las variables de entorno estándar de proxy en el host del gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` y variantes en minúsculas). Prefiere la configuración de proxy a nivel de host sobre configuraciones de proxy específicas de WhatsApp en el canal.

## Control de acceso y activación

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.whatsapp.dmPolicy` controla el acceso al chat directo:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `allowFrom` acepta números con estilo E.164 (normalizados internamente).

    Sobrescritura para múltiples cuentas: `channels.whatsapp.accounts.<id>.dmPolicy` (y `allowFrom`) tienen prioridad sobre los valores predeterminados a nivel de canal para esa cuenta.

    Detalles del comportamiento en tiempo de ejecución:

    - los emparejamientos se conservan en el almacén de permitidos del canal y se combinan con `allowFrom` configurado
    - si no se configura ninguna allowlist, el número propio vinculado se permite de forma predeterminada
    - OpenClaw nunca empareja automáticamente mensajes directos salientes `fromMe` (mensajes que te envías a ti mismo desde el dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupos + allowlists">
    El acceso a grupos tiene dos capas:

    1. **Allowlist de pertenencia a grupos** (`channels.whatsapp.groups`)
       - si se omite `groups`, todos los grupos son elegibles
       - si `groups` está presente, actúa como una allowlist de grupos (se permite `"*"`)

    2. **Política de remitentes de grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: se omite la allowlist de remitentes
       - `allowlist`: el remitente debe coincidir con `groupAllowFrom` (o `*`)
       - `disabled`: bloquea toda entrada de grupos

    Respaldo de allowlist de remitentes:

    - si `groupAllowFrom` no está configurado, el tiempo de ejecución usa `allowFrom` como respaldo cuando está disponible
    - las allowlists de remitentes se evalúan antes de la activación por mención/respuesta

    Nota: si no existe ningún bloque `channels.whatsapp`, el respaldo de política de grupo en tiempo de ejecución es `allowlist` (con un registro de advertencia), incluso si `channels.defaults.groupPolicy` está configurado.

  </Tab>

  <Tab title="Menciones + /activation">
    Las respuestas en grupos requieren mención de forma predeterminada.

    La detección de menciones incluye:

    - menciones explícitas de WhatsApp a la identidad del bot
    - patrones regex de mención configurados (`agents.list[].groupChat.mentionPatterns`, con respaldo en `messages.groupChat.mentionPatterns`)
    - detección implícita de respuesta al bot (el remitente de la respuesta coincide con la identidad del bot)

    Nota de seguridad:

    - citar/responder solo satisface la restricción de mención; **no** concede autorización al remitente
    - con `groupPolicy: "allowlist"`, los remitentes no incluidos en la allowlist siguen bloqueados aunque respondan al mensaje de un usuario incluido en la allowlist

    Comando de activación a nivel de sesión:

    - `/activation mention`
    - `/activation always`

    `activation` actualiza el estado de la sesión (no la configuración global). Está restringido al propietario.

  </Tab>
</Tabs>

## Comportamiento de número personal y chat con uno mismo

Cuando el número propio vinculado también está presente en `allowFrom`, se activan las protecciones de chat con uno mismo de WhatsApp:

- omitir confirmaciones de lectura para turnos de chat con uno mismo
- ignorar el comportamiento de activación automática por mention-JID que, de otro modo, te enviaría una notificación a ti mismo
- si `messages.responsePrefix` no está configurado, las respuestas de chat con uno mismo usan de forma predeterminada `[{identity.name}]` o `[openclaw]`

## Normalización de mensajes y contexto

<AccordionGroup>
  <Accordion title="Sobre entrante + contexto de respuesta">
    Los mensajes entrantes de WhatsApp se encapsulan en el sobre compartido de entrada.

    Si existe una respuesta citada, el contexto se añade con este formato:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Los campos de metadatos de respuesta también se rellenan cuando están disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Marcadores de posición de medios y extracción de ubicación/contacto">
    Los mensajes entrantes que contienen solo medios se normalizan con marcadores de posición como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Los cuerpos de ubicación usan texto breve de coordenadas. Las etiquetas/comentarios de ubicación y los detalles de contacto/vCard se representan como metadatos no confiables delimitados, no como texto inline del prompt.

  </Accordion>

  <Accordion title="Inyección de historial pendiente de grupo">
    Para grupos, los mensajes no procesados pueden almacenarse en búfer e inyectarse como contexto cuando finalmente se activa el bot.

    - límite predeterminado: `50`
    - configuración: `channels.whatsapp.historyLimit`
    - respaldo: `messages.groupChat.historyLimit`
    - `0` lo desactiva

    Marcadores de inyección:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Confirmaciones de lectura">
    Las confirmaciones de lectura están habilitadas de forma predeterminada para los mensajes entrantes de WhatsApp aceptados.

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

    Sobrescritura por cuenta:

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

    Los turnos de chat con uno mismo omiten las confirmaciones de lectura incluso cuando están habilitadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentación y medios

<AccordionGroup>
  <Accordion title="Fragmentación de texto">
    - límite de fragmento predeterminado: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - el modo `newline` prefiere límites de párrafo (líneas en blanco) y luego usa como respaldo una fragmentación segura por longitud
  </Accordion>

  <Accordion title="Comportamiento de medios salientes">
    - admite cargas útiles de imagen, video, audio (nota de voz PTT) y documento
    - `audio/ogg` se reescribe como `audio/ogg; codecs=opus` para compatibilidad con notas de voz
    - la reproducción de GIF animados es compatible mediante `gifPlayback: true` en envíos de video
    - las leyendas se aplican al primer elemento multimedia cuando se envían cargas útiles de respuesta con múltiples medios
    - el origen de medios puede ser HTTP(S), `file://` o rutas locales
  </Accordion>

  <Accordion title="Límites de tamaño de medios y comportamiento de respaldo">
    - límite de guardado de medios entrantes: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - límite de envío de medios salientes: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - las sobrescrituras por cuenta usan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - las imágenes se optimizan automáticamente (barrido de tamaño/calidad) para ajustarse a los límites
    - en caso de fallo al enviar medios, el respaldo del primer elemento envía una advertencia en texto en lugar de descartar la respuesta silenciosamente
  </Accordion>
</AccordionGroup>

## Cita de respuestas

WhatsApp admite citas nativas de respuesta, donde las respuestas salientes citan visualmente el mensaje entrante. Contrólalo con `channels.whatsapp.replyToMode`.

| Valor    | Comportamiento                                                                     |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | Cita el mensaje entrante cuando el proveedor lo admite; de lo contrario no cita    |
| `"on"`   | Cita siempre el mensaje entrante; usa un envío sin formato como respaldo si se rechaza la cita |
| `"off"`  | Nunca cita; envía como mensaje sin formato                                         |

El valor predeterminado es `"auto"`. Las sobrescrituras por cuenta usan `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Nivel de reacciones

`channels.whatsapp.reactionLevel` controla el alcance con el que el agente usa reacciones con emoji en WhatsApp:

| Nivel         | Reacciones de confirmación | Reacciones iniciadas por el agente | Descripción                                        |
| ------------- | -------------------------- | ---------------------------------- | -------------------------------------------------- |
| `"off"`       | No                         | No                                 | Sin reacciones de ningún tipo                      |
| `"ack"`       | Sí                         | No                                 | Solo reacciones de confirmación (acuse previo a la respuesta) |
| `"minimal"`   | Sí                         | Sí (conservadoras)                 | Confirmación + reacciones del agente con orientación conservadora |
| `"extensive"` | Sí                         | Sí (fomentadas)                    | Confirmación + reacciones del agente con orientación fomentada |

Predeterminado: `"minimal"`.

Las sobrescrituras por cuenta usan `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp admite reacciones inmediatas de confirmación al recibir mensajes entrantes mediante `channels.whatsapp.ackReaction`.
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

- se envían inmediatamente después de aceptar la entrada (antes de responder)
- los fallos se registran, pero no bloquean la entrega normal de respuestas
- el modo de grupo `mentions` reacciona en turnos activados por mención; la activación de grupo `always` actúa como omisión de esta comprobación
- WhatsApp usa `channels.whatsapp.ackReaction` (aquí no se usa el heredado `messages.ackReaction`)

## Múltiples cuentas y credenciales

<AccordionGroup>
  <Accordion title="Selección de cuenta y valores predeterminados">
    - los IDs de cuenta provienen de `channels.whatsapp.accounts`
    - selección de cuenta predeterminada: `default` si existe; de lo contrario, el primer ID de cuenta configurado (ordenado)
    - los IDs de cuenta se normalizan internamente para la búsqueda
  </Accordion>

  <Accordion title="Rutas de credenciales y compatibilidad heredada">
    - ruta actual de autenticación: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - archivo de respaldo: `creds.json.bak`
    - la autenticación predeterminada heredada en `~/.openclaw/credentials/` sigue reconociéndose/migrándose para flujos de cuenta predeterminada
  </Accordion>

  <Accordion title="Comportamiento de cierre de sesión">
    `openclaw channels logout --channel whatsapp [--account <id>]` borra el estado de autenticación de WhatsApp para esa cuenta.

    En directorios de autenticación heredados, `oauth.json` se conserva mientras se eliminan los archivos de autenticación de Baileys.

  </Accordion>
</AccordionGroup>

## Herramientas, acciones y escrituras de configuración

- La compatibilidad con herramientas del agente incluye la acción de reacción de WhatsApp (`react`).
- Controles de acciones:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Las escrituras de configuración iniciadas por canal están habilitadas de forma predeterminada (desactívalas con `channels.whatsapp.configWrites=false`).

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
    Los envíos salientes fallan de inmediato cuando no existe un listener activo del gateway para la cuenta de destino.

    Asegúrate de que el gateway esté en ejecución y de que la cuenta esté vinculada.

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran inesperadamente">
    Comprueba en este orden:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas de allowlist de `groups`
    - restricción por mención (`requireMention` + patrones de mención)
    - claves duplicadas en `openclaw.json` (JSON5): las entradas posteriores sobrescriben las anteriores, así que mantén un único `groupPolicy` por ámbito

  </Accordion>

  <Accordion title="Advertencia del entorno de ejecución Bun">
    El entorno de ejecución del gateway de WhatsApp debe usar Node. Bun está marcado como incompatible para la operación estable del gateway de WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts del sistema

WhatsApp admite prompts del sistema al estilo de Telegram para grupos y chats directos mediante los mapas `groups` y `direct`.

Jerarquía de resolución para mensajes de grupo:

Primero se determina el mapa `groups` efectivo: si la cuenta define su propio `groups`, reemplaza por completo el mapa `groups` raíz (sin combinación profunda). La búsqueda del prompt se ejecuta luego en el único mapa resultante:

1. **Prompt del sistema específico del grupo** (`groups["<groupId>"].systemPrompt`): se usa si la entrada del grupo específico define un `systemPrompt`.
2. **Prompt del sistema comodín de grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada del grupo específico está ausente o no define `systemPrompt`.

Jerarquía de resolución para mensajes directos:

Primero se determina el mapa `direct` efectivo: si la cuenta define su propio `direct`, reemplaza por completo el mapa `direct` raíz (sin combinación profunda). La búsqueda del prompt se ejecuta luego en el único mapa resultante:

1. **Prompt del sistema específico del directo** (`direct["<peerId>"].systemPrompt`): se usa si la entrada del peer específico define un `systemPrompt`.
2. **Prompt del sistema comodín de directo** (`direct["*"].systemPrompt`): se usa cuando la entrada del peer específico está ausente o no define `systemPrompt`.

Nota: `dms` sigue siendo el bloque ligero de sobrescritura de historial por mensaje directo (`dms.<id>.historyLimit`); las sobrescrituras de prompt viven bajo `direct`.

**Diferencia con el comportamiento de múltiples cuentas de Telegram:** En Telegram, `groups` raíz se suprime intencionalmente para todas las cuentas en una configuración de múltiples cuentas, incluso para las cuentas que no definen su propio `groups`, para evitar que un bot reciba mensajes de grupos a los que no pertenece. WhatsApp no aplica esta protección: `groups` raíz y `direct` raíz siempre se heredan en las cuentas que no definen una sobrescritura a nivel de cuenta, independientemente de cuántas cuentas estén configuradas. En una configuración de WhatsApp con múltiples cuentas, si quieres prompts por grupo o directos por cuenta, define el mapa completo bajo cada cuenta de forma explícita en lugar de depender de valores predeterminados a nivel raíz.

Comportamiento importante:

- `channels.whatsapp.groups` es tanto un mapa de configuración por grupo como la allowlist de grupos a nivel de chat. Tanto en el ámbito raíz como en el de cuenta, `groups["*"]` significa “se admiten todos los grupos” para ese ámbito.
- Solo añade un `systemPrompt` comodín de grupo cuando ya quieras que ese ámbito admita todos los grupos. Si aún quieres que solo un conjunto fijo de IDs de grupo sea elegible, no uses `groups["*"]` para el valor predeterminado del prompt. En su lugar, repite el prompt en cada entrada de grupo explícitamente incluida en la allowlist.
- La admisión de grupos y la autorización de remitentes son comprobaciones independientes. `groups["*"]` amplía el conjunto de grupos que pueden llegar al manejo de grupos, pero no autoriza por sí mismo a todos los remitentes de esos grupos. El acceso de remitentes sigue estando controlado por separado mediante `channels.whatsapp.groupPolicy` y `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` no tiene el mismo efecto secundario para los mensajes directos. `direct["*"]` solo proporciona una configuración predeterminada de chat directo después de que un mensaje directo ya haya sido admitido por `dmPolicy` más `allowFrom` o las reglas del almacén de emparejamiento.

Ejemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Úsalo solo si todos los grupos deben admitirse en el ámbito raíz.
        // Se aplica a todas las cuentas que no definan su propio mapa groups.
        "*": { systemPrompt: "Prompt predeterminado para todos los grupos." },
      },
      direct: {
        // Se aplica a todas las cuentas que no definan su propio mapa direct.
        "*": { systemPrompt: "Prompt predeterminado para todos los chats directos." },
      },
      accounts: {
        work: {
          groups: {
            // Esta cuenta define su propio groups, así que los groups raíz se
            // reemplazan por completo. Para conservar un comodín, define "*" explícitamente aquí también.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Céntrate en la gestión de proyectos.",
            },
            // Úsalo solo si todos los grupos deben admitirse en esta cuenta.
            "*": { systemPrompt: "Prompt predeterminado para grupos de trabajo." },
          },
          direct: {
            // Esta cuenta define su propio direct, así que las entradas direct raíz se
            // reemplazan por completo. Para conservar un comodín, define "*" explícitamente aquí también.
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

Campos de WhatsApp de alta señal:

- acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- múltiples cuentas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, sobrescrituras a nivel de cuenta
- operaciones: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamiento de sesión: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
