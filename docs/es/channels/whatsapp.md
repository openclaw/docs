---
read_when:
    - Trabajar en el comportamiento de WhatsApp/web o en el enrutamiento de la bandeja de entrada
summary: Compatibilidad del canal de WhatsApp, controles de acceso, comportamiento de entrega y operaciones
title: WhatsApp
x-i18n:
    generated_at: "2026-04-23T13:59:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: e14735a33ffb48334b920a5e63645abf3445f56481b1ce8b7c128800e2adc981
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (canal web)

Estado: listo para producción mediante WhatsApp Web (Baileys). El Gateway es propietario de la(s) sesión(es) vinculada(s).

## Instalación (bajo demanda)

- La incorporación (`openclaw onboard`) y `openclaw channels add --channel whatsapp`
  ofrecen instalar el Plugin de WhatsApp la primera vez que lo seleccionas.
- `openclaw channels login --channel whatsapp` también ofrece el flujo de instalación cuando
  el Plugin aún no está presente.
- Canal de desarrollo + repositorio clonado con git: usa por defecto la ruta local del Plugin.
- Stable/Beta: usa por defecto el paquete npm `@openclaw/whatsapp`.

La instalación manual sigue estando disponible:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política predeterminada de MD es emparejamiento para remitentes desconocidos.
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

  </Step>

  <Step title="Inicia el Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Aprueba la primera solicitud de emparejamiento (si usas el modo de emparejamiento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Las solicitudes de emparejamiento caducan después de 1 hora. Las solicitudes pendientes están limitadas a 3 por canal.

  </Step>
</Steps>

<Note>
OpenClaw recomienda ejecutar WhatsApp con un número independiente cuando sea posible. (Los metadatos del canal y el flujo de configuración están optimizados para esa configuración, pero también se admiten configuraciones con número personal).
</Note>

## Patrones de despliegue

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este es el modo operativo más limpio:

    - identidad de WhatsApp separada para OpenClaw
    - listas de permitidos de MD y límites de enrutamiento más claros
    - menor probabilidad de confusión por chat con uno mismo

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
    La incorporación admite el modo de número personal y escribe una configuración base compatible con chat con uno mismo:

    - `dmPolicy: "allowlist"`
    - `allowFrom` incluye tu número personal
    - `selfChatMode: true`

    En runtime, las protecciones de chat con uno mismo se basan en el número propio vinculado y en `allowFrom`.

  </Accordion>

  <Accordion title="Alcance del canal solo para WhatsApp Web">
    El canal de la plataforma de mensajería se basa en WhatsApp Web (`Baileys`) en la arquitectura actual de canales de OpenClaw.

    No existe un canal de mensajería de WhatsApp mediante Twilio independiente en el registro integrado de canales de chat.

  </Accordion>
</AccordionGroup>

## Modelo de runtime

- El Gateway es propietario del socket de WhatsApp y del bucle de reconexión.
- Los envíos salientes requieren un listener activo de WhatsApp para la cuenta de destino.
- Los chats de estado y difusión se ignoran (`@status`, `@broadcast`).
- Los chats directos usan reglas de sesión de MD (`session.dmScope`; el valor predeterminado `main` colapsa los MD en la sesión principal del agente).
- Las sesiones de grupo están aisladas (`agent:<agentId>:whatsapp:group:<jid>`).
- El transporte de WhatsApp Web respeta las variables de entorno de proxy estándar en el host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` y variantes en minúsculas). Prefiere la configuración de proxy a nivel de host sobre la configuración específica del canal de proxy de WhatsApp.

## Control de acceso y activación

<Tabs>
  <Tab title="Política de MD">
    `channels.whatsapp.dmPolicy` controla el acceso al chat directo:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `allowFrom` acepta números con formato E.164 (normalizados internamente).

    Sobrescritura de varias cuentas: `channels.whatsapp.accounts.<id>.dmPolicy` (y `allowFrom`) tienen prioridad sobre los valores predeterminados a nivel de canal para esa cuenta.

    Detalles del comportamiento en runtime:

    - los emparejamientos se conservan en el almacén de permitidos del canal y se combinan con `allowFrom` configurado
    - si no hay ninguna lista de permitidos configurada, el número propio vinculado se permite de forma predeterminada
    - los MD salientes `fromMe` nunca se emparejan automáticamente

  </Tab>

  <Tab title="Política de grupos + listas de permitidos">
    El acceso a grupos tiene dos capas:

    1. **Lista de permitidos de pertenencia al grupo** (`channels.whatsapp.groups`)
       - si se omite `groups`, todos los grupos son aptos
       - si `groups` está presente, actúa como lista de permitidos de grupos (se permite `"*"`)

    2. **Política de remitentes del grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: se omite la lista de permitidos de remitentes
       - `allowlist`: el remitente debe coincidir con `groupAllowFrom` (o `*`)
       - `disabled`: bloquea toda entrada desde grupos

    Alternativa de lista de permitidos de remitentes:

    - si `groupAllowFrom` no está establecido, el runtime recurre a `allowFrom` cuando está disponible
    - las listas de permitidos de remitentes se evalúan antes de la activación por mención/respuesta

    Nota: si no existe ningún bloque `channels.whatsapp`, la política de grupos alternativa del runtime es `allowlist` (con una advertencia en el registro), incluso si `channels.defaults.groupPolicy` está establecido.

  </Tab>

  <Tab title="Menciones + /activation">
    Las respuestas en grupos requieren mención de forma predeterminada.

    La detección de menciones incluye:

    - menciones explícitas en WhatsApp de la identidad del bot
    - patrones regex de mención configurados (`agents.list[].groupChat.mentionPatterns`, alternativa `messages.groupChat.mentionPatterns`)
    - detección implícita de respuesta al bot (el remitente de la respuesta coincide con la identidad del bot)

    Nota de seguridad:

    - citar/responder solo satisface la restricción de mención; **no** concede autorización al remitente
    - con `groupPolicy: "allowlist"`, los remitentes que no estén en la lista de permitidos siguen bloqueados aunque respondan al mensaje de un usuario incluido en la lista

    Comando de activación a nivel de sesión:

    - `/activation mention`
    - `/activation always`

    `activation` actualiza el estado de la sesión (no la configuración global). Está restringido al propietario.

  </Tab>
</Tabs>

## Comportamiento con número personal y chat con uno mismo

Cuando el número propio vinculado también está presente en `allowFrom`, se activan las protecciones de WhatsApp para chat con uno mismo:

- omitir confirmaciones de lectura en turnos de chat con uno mismo
- ignorar el comportamiento de activación automática por JID de mención que, de otro modo, te haría ping a ti mismo
- si `messages.responsePrefix` no está establecido, las respuestas en chat con uno mismo usan por defecto `[{identity.name}]` o `[openclaw]`

## Normalización de mensajes y contexto

<AccordionGroup>
  <Accordion title="Sobre entrante + contexto de respuesta">
    Los mensajes entrantes de WhatsApp se envuelven en el sobre entrante compartido.

    Si existe una respuesta citada, el contexto se añade con esta forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Los campos de metadatos de respuesta también se rellenan cuando están disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del remitente).

  </Accordion>

  <Accordion title="Marcadores de medios y extracción de ubicación/contacto">
    Los mensajes entrantes solo de medios se normalizan con marcadores como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Las cargas útiles de ubicación y contacto se normalizan en contexto textual antes del enrutamiento.

  </Accordion>

  <Accordion title="Inyección de historial pendiente del grupo">
    En los grupos, los mensajes no procesados pueden almacenarse temporalmente e inyectarse como contexto cuando finalmente se activa el bot.

    - límite predeterminado: `50`
    - configuración: `channels.whatsapp.historyLimit`
    - alternativa: `messages.groupChat.historyLimit`
    - `0` lo desactiva

    Marcadores de inyección:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Confirmaciones de lectura">
    Las confirmaciones de lectura están activadas de forma predeterminada para los mensajes entrantes de WhatsApp aceptados.

    Desactívalas globalmente:

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

    Los turnos de chat con uno mismo omiten las confirmaciones de lectura incluso cuando están activadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentación y medios

<AccordionGroup>
  <Accordion title="Fragmentación de texto">
    - límite predeterminado de fragmento: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - el modo `newline` prefiere los límites de párrafo (líneas en blanco) y luego recurre a una fragmentación segura por longitud
  </Accordion>

  <Accordion title="Comportamiento de medios salientes">
    - admite cargas útiles de imagen, video, audio (nota de voz PTT) y documento
    - `audio/ogg` se reescribe a `audio/ogg; codecs=opus` para compatibilidad con notas de voz
    - la reproducción de GIF animados se admite mediante `gifPlayback: true` en envíos de video
    - los subtítulos se aplican al primer elemento multimedia al enviar cargas útiles de respuesta con varios medios
    - la fuente de medios puede ser HTTP(S), `file://` o rutas locales
  </Accordion>

  <Accordion title="Límites de tamaño de medios y comportamiento alternativo">
    - límite de guardado de medios entrantes: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - límite de envío de medios salientes: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - las sobrescrituras por cuenta usan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - las imágenes se optimizan automáticamente (barrido de tamaño/calidad) para ajustarse a los límites
    - en caso de fallo al enviar medios, la alternativa del primer elemento envía una advertencia en texto en lugar de descartar la respuesta silenciosamente
  </Accordion>
</AccordionGroup>

## Cita de respuestas

WhatsApp admite la cita nativa de respuestas, donde las respuestas salientes citan visiblemente el mensaje entrante. Contrólalo con `channels.whatsapp.replyToMode`.

| Valor    | Comportamiento                                                                     |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | Cita el mensaje entrante cuando el proveedor lo admite; omite la cita en caso contrario |
| `"on"`   | Cita siempre el mensaje entrante; recurre a un envío simple si se rechaza la cita |
| `"off"`  | Nunca cita; envía como mensaje simple                                              |

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

`channels.whatsapp.reactionLevel` controla con qué amplitud el agente usa reacciones con emoji en WhatsApp:

| Nivel         | Reacciones de acuse | Reacciones iniciadas por el agente | Descripción                                      |
| ------------- | ------------------- | ---------------------------------- | ------------------------------------------------ |
| `"off"`       | No                  | No                                 | Sin reacciones en absoluto                       |
| `"ack"`       | Sí                  | No                                 | Solo reacciones de acuse (recepción previa a la respuesta) |
| `"minimal"`   | Sí                  | Sí (conservadoras)                 | Acuse + reacciones del agente con guía conservadora |
| `"extensive"` | Sí                  | Sí (fomentadas)                    | Acuse + reacciones del agente con guía fomentada |

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

## Reacciones de acuse

WhatsApp admite reacciones inmediatas de acuse al recibir un mensaje entrante mediante `channels.whatsapp.ackReaction`.
Las reacciones de acuse están condicionadas por `reactionLevel`: se suprimen cuando `reactionLevel` es `"off"`.

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
- los fallos se registran, pero no bloquean la entrega normal de respuestas
- el modo de grupo `mentions` reacciona en turnos activados por mención; la activación de grupo `always` actúa como omisión de esta comprobación
- WhatsApp usa `channels.whatsapp.ackReaction` (aquí no se usa el heredado `messages.ackReaction`)

## Varias cuentas y credenciales

<AccordionGroup>
  <Accordion title="Selección de cuenta y valores predeterminados">
    - los ID de cuenta provienen de `channels.whatsapp.accounts`
    - selección de cuenta predeterminada: `default` si está presente; en caso contrario, el primer ID de cuenta configurado (ordenado)
    - los ID de cuenta se normalizan internamente para la búsqueda
  </Accordion>

  <Accordion title="Rutas de credenciales y compatibilidad heredada">
    - ruta actual de autenticación: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - archivo de copia de seguridad: `creds.json.bak`
    - la autenticación predeterminada heredada en `~/.openclaw/credentials/` sigue reconociéndose/migrándose para flujos de cuenta predeterminada
  </Accordion>

  <Accordion title="Comportamiento de cierre de sesión">
    `openclaw channels logout --channel whatsapp [--account <id>]` borra el estado de autenticación de WhatsApp para esa cuenta.

    En directorios de autenticación heredados, se conserva `oauth.json` mientras se eliminan los archivos de autenticación de Baileys.

  </Accordion>
</AccordionGroup>

## Herramientas, acciones y escrituras de configuración

- La compatibilidad de herramientas del agente incluye la acción de reacción de WhatsApp (`react`).
- Restricciones de acciones:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Las escrituras de configuración iniciadas por el canal están habilitadas de forma predeterminada (desactívalas mediante `channels.whatsapp.configWrites=false`).

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
    Los envíos salientes fallan rápidamente cuando no existe un listener activo del Gateway para la cuenta de destino.

    Asegúrate de que el Gateway esté en ejecución y de que la cuenta esté vinculada.

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran inesperadamente">
    Compruébalo en este orden:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas de lista de permitidos de `groups`
    - restricción por mención (`requireMention` + patrones de mención)
    - claves duplicadas en `openclaw.json` (JSON5): las entradas posteriores sobrescriben las anteriores, así que mantén un único `groupPolicy` por ámbito

  </Accordion>

  <Accordion title="Advertencia de runtime de Bun">
    El runtime del Gateway de WhatsApp debe usar Node. Bun está marcado como incompatible para el funcionamiento estable del Gateway de WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts del sistema

WhatsApp admite prompts del sistema de estilo Telegram para grupos y chats directos mediante los mapas `groups` y `direct`.

Jerarquía de resolución para mensajes de grupo:

Primero se determina el mapa `groups` efectivo: si la cuenta define su propio `groups`, reemplaza completamente el mapa `groups` raíz (sin fusión profunda). Después, la búsqueda de prompts se ejecuta sobre el único mapa resultante:

1. **Prompt del sistema específico del grupo** (`groups["<groupId>"].systemPrompt`): se usa si la entrada del grupo específico define un `systemPrompt`.
2. **Prompt del sistema comodín para grupos** (`groups["*"].systemPrompt`): se usa cuando la entrada del grupo específico no existe o no define `systemPrompt`.

Jerarquía de resolución para mensajes directos:

Primero se determina el mapa `direct` efectivo: si la cuenta define su propio `direct`, reemplaza completamente el mapa `direct` raíz (sin fusión profunda). Después, la búsqueda de prompts se ejecuta sobre el único mapa resultante:

1. **Prompt del sistema específico del chat directo** (`direct["<peerId>"].systemPrompt`): se usa si la entrada del peer específico define un `systemPrompt`.
2. **Prompt del sistema comodín para chats directos** (`direct["*"].systemPrompt`): se usa cuando la entrada del peer específico no existe o no define `systemPrompt`.

Nota: `dms` sigue siendo el contenedor ligero de sobrescritura de historial por MD (`dms.<id>.historyLimit`); las sobrescrituras de prompts viven en `direct`.

**Diferencia con el comportamiento de varias cuentas en Telegram:** en Telegram, el `groups` raíz se suprime intencionadamente para todas las cuentas en una configuración de varias cuentas, incluso para las cuentas que no definen su propio `groups`, para evitar que un bot reciba mensajes de grupos a los que no pertenece. WhatsApp no aplica esta protección: `groups` raíz y `direct` raíz siempre se heredan en las cuentas que no definen una sobrescritura a nivel de cuenta, independientemente de cuántas cuentas haya configuradas. En una configuración de WhatsApp con varias cuentas, si quieres prompts de grupo o directos por cuenta, define explícitamente el mapa completo en cada cuenta en lugar de depender de valores predeterminados a nivel raíz.

Comportamiento importante:

- `channels.whatsapp.groups` es a la vez un mapa de configuración por grupo y la lista de permitidos de grupos a nivel de chat. En el ámbito raíz o de cuenta, `groups["*"]` significa "se admiten todos los grupos" para ese ámbito.
- Añade un `systemPrompt` de grupo comodín solo cuando ya quieras que ese ámbito admita todos los grupos. Si aún quieres que solo un conjunto fijo de ID de grupo sea apto, no uses `groups["*"]` para el prompt predeterminado. En su lugar, repite el prompt en cada entrada de grupo incluida explícitamente en la lista de permitidos.
- La admisión al grupo y la autorización del remitente son comprobaciones separadas. `groups["*"]` amplía el conjunto de grupos que pueden llegar al manejo de grupos, pero no autoriza por sí mismo a todos los remitentes de esos grupos. El acceso de remitentes sigue controlándose por separado mediante `channels.whatsapp.groupPolicy` y `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` no tiene el mismo efecto secundario para los MD. `direct["*"]` solo proporciona una configuración predeterminada de chat directo después de que un MD ya haya sido admitido por `dmPolicy` más `allowFrom` o las reglas del almacén de emparejamiento.

Ejemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Úsalo solo si todos los grupos deben admitirse en el ámbito raíz.
        // Se aplica a todas las cuentas que no definen su propio mapa groups.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Se aplica a todas las cuentas que no definen su propio mapa direct.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // Esta cuenta define su propio groups, por lo que el groups raíz se
            // reemplaza por completo. Para conservar un comodín, define aquí
            // también "*" explícitamente.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Úsalo solo si todos los grupos deben admitirse en esta cuenta.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // Esta cuenta define su propio mapa direct, por lo que las entradas
            // direct raíz se reemplazan por completo. Para conservar un comodín,
            // define aquí también "*" explícitamente.
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

- [Referencia de configuración - WhatsApp](/es/gateway/configuration-reference#whatsapp)

Campos de WhatsApp de alta relevancia:

- acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- varias cuentas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, sobrescrituras a nivel de cuenta
- operaciones: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamiento de sesión: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Enrutamiento de varios agentes](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
