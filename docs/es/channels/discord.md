---
read_when:
    - Trabajando en funciones del canal de Discord
summary: Estado de soporte, capacidades y configuración del bot de Discord
title: Discord
x-i18n:
    generated_at: "2026-07-03T02:41:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e8724b02baa1a2dba1ac932e20533c9293b6021f30b1a79107349c34f195e5
    source_path: channels/discord.md
    workflow: 16
---

Listo para DMs y canales de servidor mediante el gateway oficial de Discord.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los DMs de Discord usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de comandos nativos y catálogo de comandos.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico entre canales y flujo de reparación.
  </Card>
</CardGroup>

## Configuración rápida

Tendrás que crear una aplicación nueva con un bot, agregar el bot a tu servidor y emparejarlo con OpenClaw. Recomendamos agregar tu bot a tu propio servidor privado. Si aún no tienes uno, [crea uno primero](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (elige **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crear una aplicación y un bot de Discord">
    Ve al [Discord Developer Portal](https://discord.com/developers/applications) y haz clic en **New Application**. Asígnale un nombre como "OpenClaw".

    Haz clic en **Bot** en la barra lateral. Define el **Username** como quieras llamar a tu agente de OpenClaw.

  </Step>

  <Step title="Habilitar intents privilegiados">
    Aún en la página **Bot**, desplázate hacia abajo hasta **Privileged Gateway Intents** y habilita:

    - **Message Content Intent** (obligatorio)
    - **Server Members Intent** (recomendado; obligatorio para listas de permitidos por rol y coincidencia de nombre a ID)
    - **Presence Intent** (opcional; solo necesario para actualizaciones de presencia)

  </Step>

  <Step title="Copiar el token de tu bot">
    Vuelve a desplazarte hacia arriba en la página **Bot** y haz clic en **Reset Token**.

    <Note>
    A pesar del nombre, esto genera tu primer token; no se está "restableciendo" nada.
    </Note>

    Copia el token y guárdalo en algún lugar. Este es tu **Bot Token** y lo necesitarás en breve.

  </Step>

  <Step title="Generar una URL de invitación y agregar el bot a tu servidor">
    Haz clic en **OAuth2** en la barra lateral. Generarás una URL de invitación con los permisos correctos para agregar el bot a tu servidor.

    Desplázate hacia abajo hasta **OAuth2 URL Generator** y habilita:

    - `bot`
    - `applications.commands`

    Aparecerá debajo una sección **Bot Permissions**. Habilita al menos:

    **Permisos generales**
      - Ver canales

    **Permisos de texto**
      - Enviar mensajes
      - Leer historial de mensajes
      - Insertar enlaces
      - Adjuntar archivos
      - Agregar reacciones (opcional)

    Este es el conjunto base para canales de texto normales. Si planeas publicar en hilos de Discord, incluidos flujos de trabajo de canales de foro o multimedia que crean o continúan un hilo, habilita también **Send Messages in Threads**.
    Copia la URL generada en la parte inferior, pégala en tu navegador, selecciona tu servidor y haz clic en **Continue** para conectarlo. Ahora deberías ver tu bot en el servidor de Discord.

  </Step>

  <Step title="Habilitar Developer Mode y recopilar tus IDs">
    De vuelta en la aplicación de Discord, debes habilitar Developer Mode para poder copiar IDs internos.

    1. Haz clic en **User Settings** (icono de engranaje junto a tu avatar) → Desplázate hasta **Developer** en la barra lateral → activa **Developer Mode**

        *(Nota: En la aplicación móvil de Discord, Developer Mode está en **App Settings** → **Advanced**)*

    2. Haz clic derecho en el **icono de tu servidor** en la barra lateral → **Copy Server ID**
    3. Haz clic derecho en **tu propio avatar** → **Copy User ID**

    Guarda tu **Server ID** y **User ID** junto con tu Bot Token; enviarás los tres a OpenClaw en el siguiente paso.

  </Step>

  <Step title="Permitir DMs de miembros del servidor">
    Para que el emparejamiento funcione, Discord debe permitir que tu bot te envíe un DM. Haz clic derecho en el **icono de tu servidor** → **Privacy Settings** → activa **Direct Messages**.

    Esto permite que los miembros del servidor (incluidos bots) te envíen DMs. Mantén esto habilitado si quieres usar DMs de Discord con OpenClaw. Si solo planeas usar canales de servidor, puedes deshabilitar los DMs después del emparejamiento.

  </Step>

  <Step title="Configurar el token de tu bot de forma segura (no lo envíes en el chat)">
    Tu token de bot de Discord es un secreto (como una contraseña). Configúralo en la máquina que ejecuta OpenClaw antes de enviar mensajes a tu agente.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    Si OpenClaw ya se está ejecutando como servicio en segundo plano, reinícialo mediante la app de OpenClaw para Mac o deteniendo y reiniciando el proceso `openclaw gateway run`.
    Para instalaciones como servicio administrado, ejecuta `openclaw gateway install` desde una shell donde `DISCORD_BOT_TOKEN` esté presente, o almacena la variable en `~/.openclaw/.env`, para que el servicio pueda resolver el SecretRef de env después del reinicio.
    Si tu host está bloqueado o limitado por frecuencia por la búsqueda de aplicación de inicio de Discord, configura el ID de aplicación/cliente de Discord desde el Developer Portal para que el inicio pueda omitir esa llamada REST. Usa `channels.discord.applicationId` para la cuenta predeterminada, o `channels.discord.accounts.<accountId>.applicationId` cuando ejecutes varios bots de Discord.

  </Step>

  <Step title="Configurar OpenClaw y emparejar">

    <Tabs>
      <Tab title="Preguntar a tu agente">
        Chatea con tu agente de OpenClaw en cualquier canal existente (por ejemplo, Telegram) y díselo. Si Discord es tu primer canal, usa la pestaña de CLI / config en su lugar.

        > "Ya configuré mi token de bot de Discord en la configuración. Termina la configuración de Discord con User ID `<user_id>` y Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Si prefieres la configuración basada en archivos, define:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Fallback de env para la cuenta predeterminada:

```bash
DISCORD_BOT_TOKEN=...
```

        Para configuración remota o con scripts, escribe el mismo bloque JSON5 con `openclaw config patch --file ./discord.patch.json5 --dry-run` y luego vuelve a ejecutarlo sin `--dry-run`. Los valores de `token` en texto plano son compatibles. También se admiten valores SecretRef para `channels.discord.token` en proveedores env/file/exec. Consulta [Gestión de secretos](/es/gateway/secrets).

        Para varios bots de Discord, mantén cada token de bot e ID de aplicación bajo su cuenta. Un `channels.discord.applicationId` de nivel superior lo heredan las cuentas, así que configúralo allí solo cuando todas las cuentas deban usar el mismo ID de aplicación.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Aprobar el primer emparejamiento por DM">
    Espera hasta que el gateway esté en ejecución y luego envía un DM a tu bot en Discord. Responderá con un código de emparejamiento.

    <Tabs>
      <Tab title="Preguntar a tu agente">
        Envía el código de emparejamiento a tu agente en tu canal existente:

        > "Aprueba este código de emparejamiento de Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Los códigos de emparejamiento caducan después de 1 hora.

    Ahora deberías poder chatear con tu agente en Discord mediante DM.

  </Step>
</Steps>

<Note>
La resolución de tokens tiene en cuenta la cuenta. Los valores de token de la configuración tienen prioridad sobre el fallback de env. `DISCORD_BOT_TOKEN` solo se usa para la cuenta predeterminada.
Si dos cuentas de Discord habilitadas se resuelven al mismo token de bot, OpenClaw inicia solo un monitor de gateway para ese token. Un token proveniente de la configuración tiene prioridad sobre el fallback de env predeterminado; de lo contrario, gana la primera cuenta habilitada y la cuenta duplicada se informa como deshabilitada.
Para llamadas salientes avanzadas (acciones de herramienta de mensajes/canal), se usa un `token` explícito por llamada para esa llamada. Esto se aplica a acciones de envío y acciones de lectura/sondeo (por ejemplo, read/search/fetch/thread/pins/permissions). La política de cuenta y la configuración de reintentos siguen viniendo de la cuenta seleccionada en la instantánea activa del runtime.
</Note>

## Recomendado: Configurar un espacio de trabajo de servidor

Una vez que los DMs funcionen, puedes configurar tu servidor de Discord como un espacio de trabajo completo donde cada canal obtiene su propia sesión de agente con su propio contexto. Esto se recomienda para servidores privados donde solo están tú y tu bot.

<Steps>
  <Step title="Agregar tu servidor a la lista de permitidos de servidores">
    Esto permite que tu agente responda en cualquier canal de tu servidor, no solo en DMs.

    <Tabs>
      <Tab title="Preguntar a tu agente">
        > "Agrega mi Server ID de Discord `<server_id>` a la lista de permitidos de servidores"
      </Tab>
      <Tab title="Configuración">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Permitir respuestas sin @mention">
    De forma predeterminada, tu agente solo responde en canales de servidor cuando se le menciona con @. Para un servidor privado, probablemente quieras que responda a todos los mensajes.

    En canales de servidor, las respuestas normales se publican automáticamente de forma predeterminada. Para salas compartidas siempre activas, opta por `messages.groupChat.visibleReplies: "message_tool"` para que el agente pueda observar en silencio y solo publicar cuando decida que una respuesta en el canal es útil. Esto funciona mejor con modelos de última generación y fiables con herramientas, como GPT 5.5. Los eventos de sala ambientales permanecen silenciosos a menos que la herramienta envíe. Consulta [Eventos de sala ambientales](/es/channels/ambient-room-events) para ver la configuración completa del modo de observación.

    Si Discord muestra que se está escribiendo y los registros muestran uso de tokens pero no se publica ningún mensaje, comprueba si el turno se configuró como evento de sala ambiental o si optó por respuestas visibles mediante herramienta de mensajes.

    <Tabs>
      <Tab title="Preguntar a tu agente">
        > "Permite que mi agente responda en este servidor sin tener que ser mencionado con @"
      </Tab>
      <Tab title="Configuración">
        Define `requireMention: false` en tu configuración de servidor:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        Para exigir envíos mediante herramienta de mensajes en respuestas visibles de grupo/canal, define `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planificar la memoria en canales de servidor">
    De forma predeterminada, la memoria a largo plazo (MEMORY.md) solo se carga en sesiones de DM. Los canales de servidor no cargan MEMORY.md automáticamente.

    <Tabs>
      <Tab title="Preguntar a tu agente">
        > "Cuando haga preguntas en canales de Discord, usa memory_search o memory_get si necesitas contexto a largo plazo de MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Si necesitas contexto compartido en todos los canales, coloca las instrucciones estables en `AGENTS.md` o `USER.md` (se inyectan para cada sesión). Mantén las notas a largo plazo en `MEMORY.md` y accede a ellas bajo demanda con herramientas de memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ahora crea algunos canales en tu servidor de Discord y empieza a chatear. Tu agente puede ver el nombre del canal, y cada canal obtiene su propia sesión aislada, así que puedes configurar `#coding`, `#home`, `#research` o lo que se adapte a tu flujo de trabajo.

## Modelo de runtime

- Gateway es responsable de la conexión de Discord.
- El enrutamiento de respuestas es determinista: las respuestas entrantes de Discord vuelven a Discord.
- Los metadatos de servidor/canal de Discord se agregan al prompt del modelo como contexto no confiable,
  no como un prefijo de respuesta visible para el usuario. Si un modelo copia ese contenedor
  de vuelta, OpenClaw elimina los metadatos copiados de las respuestas salientes y del
  contexto de reproducción futuro.
- De forma predeterminada (`session.dmScope=main`), los chats directos comparten la sesión principal del agente (`agent:main:main`).
- Los canales de servidor son claves de sesión aisladas (`agent:<agentId>:discord:channel:<channelId>`).
- Los DM de grupo se ignoran de forma predeterminada (`channels.discord.dm.groupEnabled=false`).
- Los comandos slash nativos se ejecutan en sesiones de comando aisladas (`agent:<agentId>:discord:slash:<userId>`), mientras siguen llevando `CommandTargetSessionKey` a la sesión de conversación enrutada.
- La entrega de anuncios de Cron/Heartbeat solo de texto a Discord usa la respuesta final
  visible para el asistente una vez. Las cargas útiles de medios y componentes estructurados permanecen
  como varios mensajes cuando el agente emite varias cargas útiles entregables.

## Canales de foro

Los canales de foro y medios de Discord solo aceptan publicaciones de hilo. OpenClaw admite dos formas de crearlas:

- Envía un mensaje al padre del foro (`channel:<forumId>`) para crear un hilo automáticamente. El título del hilo usa la primera línea no vacía de tu mensaje.
- Usa `openclaw message thread create` para crear un hilo directamente. No pases `--message-id` para canales de foro.

Ejemplo: enviar al padre del foro para crear un hilo

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Ejemplo: crear un hilo de foro explícitamente

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Los padres de foro no aceptan componentes de Discord. Si necesitas componentes, envía al propio hilo (`channel:<threadId>`).

## Componentes interactivos

OpenClaw admite contenedores de componentes v2 de Discord para mensajes de agente. Usa la herramienta de mensajes con una carga útil `components`. Los resultados de interacción se enrutan de vuelta al agente como mensajes entrantes normales y siguen la configuración existente de Discord `replyToMode`.

Bloques admitidos:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Las filas de acciones permiten hasta 5 botones o un único menú de selección
- Tipos de selección: `string`, `user`, `role`, `mentionable`, `channel`

De forma predeterminada, los componentes son de un solo uso. Configura `components.reusable=true` para permitir que botones, selectores y formularios se usen varias veces hasta que expiren.

Para restringir quién puede hacer clic en un botón, configura `allowedUsers` en ese botón (ID de usuario de Discord, etiquetas o `*`). Cuando está configurado, los usuarios que no coinciden reciben una denegación efímera.

Las callbacks de componentes expiran después de 30 minutos de forma predeterminada. Configura `channels.discord.agentComponents.ttlMs` para cambiar esa vida útil del registro de callbacks para la cuenta predeterminada de Discord, o `channels.discord.accounts.<accountId>.agentComponents.ttlMs` para sobrescribir una cuenta en una configuración de varias cuentas. El valor está en milisegundos, debe ser un entero positivo y tiene un límite de `86400000` (24 horas). Los TTL más largos son útiles para flujos de revisión o aprobación que necesitan que los botones sigan siendo utilizables, pero también extienden la ventana en la que un mensaje antiguo de Discord todavía puede activar una acción. Prefiere el TTL más corto que se ajuste al flujo de trabajo y conserva el valor predeterminado cuando las callbacks obsoletas serían sorprendentes.

Los comandos slash `/model` y `/models` abren un selector interactivo de modelos con desplegables de proveedor, modelo y runtime compatible, además de un paso de envío. `/models add` está obsoleto y ahora devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat. La respuesta del selector es efímera y solo el usuario que lo invoca puede usarla. Los menús de selección de Discord están limitados a 25 opciones, así que agrega entradas `provider/*` a `agents.defaults.models` cuando quieras que el selector muestre modelos descubiertos dinámicamente solo para proveedores seleccionados como `openai` o `vllm`.

Archivos adjuntos:

- Los bloques `file` deben apuntar a una referencia de adjunto (`attachment://<filename>`)
- Proporciona el adjunto mediante `media`/`path`/`filePath` (archivo único); usa `media-gallery` para varios archivos
- Usa `filename` para sobrescribir el nombre de carga cuando deba coincidir con la referencia de adjunto

Formularios modales:

- Agrega `components.modal` con hasta 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw agrega automáticamente un botón disparador

Ejemplo:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` controla el acceso por DM. `channels.discord.allowFrom` es la lista de permitidos canónica para DM.

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.discord.allowFrom` incluya `"*"`)
    - `disabled`

    Si la política de DM no está abierta, los usuarios desconocidos se bloquean (o se les solicita emparejamiento en modo `pairing`).

    Precedencia de varias cuentas:

    - `channels.discord.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Para una cuenta, `allowFrom` tiene precedencia sobre el valor heredado `dm.allowFrom`.
    - Las cuentas con nombre heredan `channels.discord.allowFrom` cuando su propio `allowFrom` y el valor heredado `dm.allowFrom` no están configurados.
    - Las cuentas con nombre no heredan `channels.discord.accounts.default.allowFrom`.

    Los valores heredados `channels.discord.dm.policy` y `channels.discord.dm.allowFrom` todavía se leen por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    Formato de destino de DM para entrega:

    - `user:<id>`
    - mención `<@id>`

    Los ID numéricos sin prefijo normalmente se resuelven como ID de canal cuando hay un valor predeterminado de canal activo, pero los ID listados en el `allowFrom` de DM efectivo de la cuenta se tratan como destinos de DM de usuario por compatibilidad.

  </Tab>

  <Tab title="Access groups">
    Los DM de Discord y la autorización de comandos de texto pueden usar entradas dinámicas `accessGroup:<name>` en `channels.discord.allowFrom`.

    Los nombres de grupos de acceso se comparten entre canales de mensajes. Usa `type: "message.senders"` para un grupo estático cuyos miembros se expresan con la sintaxis normal de `allowFrom` de cada canal, o `type: "discord.channelAudience"` cuando la audiencia actual `ViewChannel` de un canal de Discord deba definir la pertenencia dinámicamente. El comportamiento compartido de grupos de acceso está documentado aquí: [Grupos de acceso](/es/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Un canal de texto de Discord no tiene una lista de miembros separada. `type: "discord.channelAudience"` modela la pertenencia así: el remitente del DM es miembro del servidor configurado y actualmente tiene permiso efectivo `ViewChannel` en el canal configurado después de aplicar roles y sobrescrituras de canal.

    Ejemplo: permitir que cualquiera que pueda ver `#maintainers` envíe DM al bot, mientras se mantienen los DM cerrados para todos los demás.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    Puedes mezclar entradas dinámicas y estáticas:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    Las búsquedas fallan de forma cerrada. Si Discord devuelve `Missing Access`, la búsqueda de miembro falla o el canal pertenece a un servidor diferente, el remitente del DM se trata como no autorizado.

    Activa **Server Members Intent** del Discord Developer Portal para el bot cuando uses grupos de acceso basados en audiencia de canal. Los DM no incluyen estado de miembro del servidor, así que OpenClaw resuelve el miembro mediante Discord REST en el momento de la autorización.

  </Tab>

  <Tab title="Guild policy">
    La gestión de servidores se controla mediante `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La base segura cuando `channels.discord` existe es `allowlist`.

    Comportamiento de `allowlist`:

    - el servidor debe coincidir con `channels.discord.guilds` (se prefiere `id`, se acepta slug)
    - listas de permitidos opcionales para remitentes: `users` (se recomiendan ID estables) y `roles` (solo ID de rol); si cualquiera está configurada, los remitentes se permiten cuando coinciden con `users` O `roles`
    - la coincidencia directa por nombre/etiqueta está desactivada de forma predeterminada; activa `channels.discord.dangerouslyAllowNameMatching: true` solo como modo de compatibilidad de emergencia
    - se admiten nombres/etiquetas para `users`, pero los ID son más seguros; `openclaw security audit` advierte cuando se usan entradas de nombre/etiqueta
    - si un servidor tiene `channels` configurado, los canales no listados se deniegan
    - si un servidor no tiene bloque `channels`, todos los canales de ese servidor en la lista de permitidos se permiten

    Ejemplo:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Si solo configuras `DISCORD_BOT_TOKEN` y no creas un bloque `channels.discord`, el fallback de runtime es `groupPolicy="allowlist"` (con una advertencia en los logs), incluso si `channels.defaults.groupPolicy` es `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Los mensajes de servidor requieren mención de forma predeterminada.

    La detección de menciones incluye:

    - mención explícita al bot
    - patrones de mención configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de respuesta al bot en los casos admitidos

    Al escribir mensajes salientes de Discord, usa la sintaxis de mención canónica: `<@USER_ID>` para usuarios, `<#CHANNEL_ID>` para canales y `<@&ROLE_ID>` para roles. No uses la forma heredada de mención de apodo `<@!USER_ID>`.

    `requireMention` se configura por servidor/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` descarta opcionalmente mensajes que mencionan a otro usuario/rol pero no al bot (excepto @everyone/@here).

    DM de grupo:

    - predeterminado: ignorados (`dm.groupEnabled=false`)
    - lista de permitidos opcional mediante `dm.groupChannels` (ID de canal o slugs)

  </Tab>
</Tabs>

### Enrutamiento de agentes basado en roles

Usa `bindings[].match.roles` para enrutar miembros de guilds de Discord a distintos agentes por ID de rol. Las vinculaciones basadas en roles solo aceptan IDs de rol y se evalúan después de las vinculaciones de peer o parent-peer y antes de las vinculaciones solo de guild. Si una vinculación también define otros campos de coincidencia (por ejemplo, `peer` + `guildId` + `roles`), todos los campos configurados deben coincidir.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Comandos nativos y autorización de comandos

- `commands.native` tiene como valor predeterminado `"auto"` y está habilitado para Discord.
- Anulación por canal: `channels.discord.commands.native`.
- `commands.native=false` omite el registro y la limpieza de comandos slash de Discord durante el inicio. Los comandos registrados anteriormente pueden seguir visibles en Discord hasta que los elimines de la aplicación de Discord.
- La autorización de comandos nativos usa las mismas listas de permitidos/políticas de Discord que el manejo normal de mensajes.
- Los comandos pueden seguir siendo visibles en la interfaz de Discord para usuarios que no están autorizados; la ejecución sigue aplicando la autorización de OpenClaw y devuelve "no autorizado".

Consulta [Comandos slash](/es/tools/slash-commands) para ver el catálogo y el comportamiento de los comandos.

Configuración predeterminada de comandos slash:

- `ephemeral: true`

## Detalles de la función

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord admite etiquetas de respuesta en la salida del agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controlado por `channels.discord.replyToMode`:

    - `off` (predeterminado)
    - `first`
    - `all`
    - `batched`

    Nota: `off` deshabilita el enhebrado implícito de respuestas. Las etiquetas explícitas `[[reply_to_*]]` se siguen respetando.
    `first` siempre adjunta la referencia implícita de respuesta nativa al primer mensaje saliente de Discord del turno.
    `batched` solo adjunta la referencia implícita de respuesta nativa de Discord cuando el
    evento entrante fue un lote con debounce de varios mensajes. Esto es útil
    cuando quieres respuestas nativas principalmente para chats ambiguos y con ráfagas, no para cada
    turno de un solo mensaje.

    Los IDs de mensaje se exponen en el contexto/historial para que los agentes puedan dirigirse a mensajes específicos.

  </Accordion>

  <Accordion title="Link previews">
    Discord genera incrustaciones enriquecidas de enlaces para URLs de forma predeterminada. OpenClaw suprime esas incrustaciones generadas en los mensajes salientes de Discord de forma predeterminada, por lo que las URLs enviadas por agentes permanecen como enlaces simples salvo que habilites lo contrario:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Define `channels.discord.accounts.<id>.suppressEmbeds` para anular una cuenta. Los envíos de herramienta de mensajes del agente también pueden pasar `suppressEmbeds: false` para un solo mensaje. Las cargas útiles explícitas de Discord `embeds` no se suprimen por la configuración predeterminada de vista previa de enlaces.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw puede transmitir borradores de respuestas enviando un mensaje temporal y editándolo a medida que llega el texto. `channels.discord.streaming` acepta `off` | `partial` | `block` | `progress` (predeterminado). `progress` mantiene un borrador de estado editable y lo actualiza con el progreso de herramientas hasta la entrega final; la etiqueta inicial compartida es una línea móvil, por lo que se desplaza fuera de vista como el resto una vez que aparece suficiente trabajo. `streamMode` es un alias de runtime heredado. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida a la clave canónica.

    Define `channels.discord.streaming.mode` en `off` para deshabilitar las ediciones de vista previa de Discord. Si la transmisión por bloques de Discord está habilitada explícitamente, OpenClaw omite la transmisión de vista previa para evitar una doble transmisión.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` edita un único mensaje de vista previa a medida que llegan los tokens.
    - `block` emite fragmentos del tamaño de borrador (usa `draftChunk` para ajustar el tamaño y los puntos de corte, limitado a `textChunkLimit`).
    - Los finales con medios, errores y respuestas explícitas cancelan las ediciones de vista previa pendientes.
    - `streaming.preview.toolProgress` (predeterminado `true`) controla si las actualizaciones de herramienta/progreso reutilizan el mensaje de vista previa.
    - Las filas de herramienta/progreso se muestran como emoji compacto + título + detalle cuando están disponibles, por ejemplo `🛠️ Bash: run tests` o `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (predeterminado `false`) habilita texto de comentario/preámbulo del asistente en el borrador temporal de progreso. El comentario se limpia antes de mostrarse, permanece transitorio y no cambia la entrega de la respuesta final.
    - `streaming.progress.maxLineChars` controla el presupuesto de vista previa de progreso por línea. La prosa se acorta en límites de palabras; los detalles de comandos y rutas conservan sufijos útiles.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controla el detalle de comando/exec en líneas de progreso compactas: `raw` (predeterminado) o `status` (solo etiqueta de herramienta).

    Oculta el texto sin procesar de comando/exec mientras mantienes líneas de progreso compactas:

    ```json
    {
      "channels": {
        "discord": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    La transmisión de vista previa es solo de texto; las respuestas con medios vuelven a la entrega normal. Cuando la transmisión `block` está habilitada explícitamente, OpenClaw omite la transmisión de vista previa para evitar una doble transmisión.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Contexto de historial de guild:

    - `channels.discord.historyLimit` predeterminado `20`
    - alternativa: `messages.groupChat.historyLimit`
    - `0` deshabilita

    Controles de historial de DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamiento de hilos:

    - Los hilos de Discord se enrutan como sesiones de canal y heredan la configuración del canal principal salvo que se anule.
    - Las sesiones de hilo heredan la selección `/model` a nivel de sesión del canal principal como alternativa solo de modelo; las selecciones `/model` locales del hilo siguen teniendo prioridad y el historial de transcripción principal no se copia salvo que la herencia de transcripción esté habilitada.
    - `channels.discord.thread.inheritParent` (predeterminado `false`) hace que los nuevos auto-hilos se inicialicen desde la transcripción principal. Las anulaciones por cuenta viven en `channels.discord.accounts.<id>.thread.inheritParent`.
    - Las reacciones de herramienta de mensajes pueden resolver destinos DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` se conserva durante la alternativa de activación en etapa de respuesta.

    Los temas de canal se inyectan como contexto **no confiable**. Las listas de permitidos controlan quién puede activar el agente, no son un límite completo de supresión de contexto suplementario.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord puede vincular un hilo a un destino de sesión para que los mensajes posteriores en ese hilo sigan enrutándose a la misma sesión (incluidas sesiones de subagentes).

    Comandos:

    - `/focus <target>` vincula el hilo actual/nuevo a un destino de subagente/sesión
    - `/unfocus` elimina la vinculación del hilo actual
    - `/agents` muestra ejecuciones activas y estado de vinculación
    - `/session idle <duration|off>` inspecciona/actualiza el auto-unfocus por inactividad para vinculaciones enfocadas
    - `/session max-age <duration|off>` inspecciona/actualiza la edad máxima estricta para vinculaciones enfocadas

    Configuración:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    Notas:

    - `session.threadBindings.*` define valores predeterminados globales.
    - `channels.discord.threadBindings.*` anula el comportamiento de Discord.
    - `spawnSessions` controla la creación/vinculación automática de hilos para `sessions_spawn({ thread: true })` y generaciones de hilos ACP. Predeterminado: `true`.
    - `defaultSpawnContext` controla el contexto nativo de subagente para generaciones vinculadas a hilos. Predeterminado: `"fork"`.
    - Las claves obsoletas `spawnSubagentSessions`/`spawnAcpSessions` se migran mediante `openclaw doctor --fix`.
    - Si las vinculaciones de hilos están deshabilitadas para una cuenta, `/focus` y las operaciones relacionadas de vinculación de hilos no están disponibles.

    Consulta [Subagentes](/es/tools/subagents), [Agentes ACP](/es/tools/acp-agents) y [Referencia de configuración](/es/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Para espacios de trabajo ACP estables y "siempre activos", configura vinculaciones ACP tipadas de nivel superior dirigidas a conversaciones de Discord.

    Ruta de configuración:

    - `bindings[]` con `type: "acp"` y `match.channel: "discord"`

    Ejemplo:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Notas:

    - `/acp spawn codex --bind here` vincula el canal o hilo actual en su lugar y mantiene los mensajes futuros en la misma sesión ACP. Los mensajes de hilo heredan la vinculación del canal principal.
    - En un canal o hilo vinculado, `/new` y `/reset` restablecen la misma sesión ACP en su lugar. Las vinculaciones temporales de hilos pueden anular la resolución del destino mientras están activas.
    - `spawnSessions` controla la creación/vinculación de hilos secundarios mediante `--thread auto|here`.

    Consulta [Agentes ACP](/es/tools/acp-agents) para detalles sobre el comportamiento de vinculación.

  </Accordion>

  <Accordion title="Reaction notifications">
    Modo de notificación de reacciones por guild:

    - `off`
    - `own` (predeterminado)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Los eventos de reacción se convierten en eventos del sistema y se adjuntan a la sesión de Discord enrutada.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` envía un emoji de reconocimiento mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - alternativa de emoji de identidad del agente (`agents.list[].identity.emoji`, si no "👀")

    Notas:

    - Discord acepta emoji unicode o nombres de emoji personalizados.
    - Usa `""` para deshabilitar la reacción para un canal o una cuenta.

  </Accordion>

  <Accordion title="Config writes">
    Las escrituras de configuración iniciadas por canal están habilitadas de forma predeterminada.

    Esto afecta a los flujos `/config set|unset` (cuando las funciones de comandos están habilitadas).

    Deshabilitar:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway proxy">
    Enruta el tráfico WebSocket del Gateway de Discord y las consultas REST de inicio (ID de aplicación + resolución de lista de permitidos) a través de un proxy HTTP(S) con `channels.discord.proxy`.
    El proxy del WebSocket del Gateway de Discord es explícito; las conexiones WebSocket no heredan variables de entorno de proxy ambiental del proceso Gateway. Las consultas REST de inicio usan este proxy cuando `channels.discord.proxy` está configurado.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Anulación por cuenta:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Compatibilidad con PluralKit">
    Habilita la resolución de PluralKit para asignar los mensajes proxy a la identidad del miembro del sistema:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Notas:

    - las listas de permitidos pueden usar `pk:<memberId>`
    - los nombres visibles de los miembros se comparan por nombre/slug solo cuando `channels.discord.dangerouslyAllowNameMatching: true`
    - las búsquedas usan el ID del mensaje original y están restringidas por ventana de tiempo
    - si la búsqueda falla, los mensajes proxy se tratan como mensajes de bot y se descartan salvo que `allowBots=true`

  </Accordion>

  <Accordion title="Alias de menciones salientes">
    Usa `mentionAliases` cuando los agentes necesiten menciones salientes deterministas para usuarios conocidos de Discord. Las claves son identificadores sin el `@` inicial; los valores son IDs de usuario de Discord. Los identificadores desconocidos, `@everyone`, `@here` y las menciones dentro de spans de código Markdown se dejan sin cambios.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Configuración de presencia">
    Las actualizaciones de presencia se aplican cuando configuras un campo de estado o actividad, o cuando habilitas la presencia automática.

    Ejemplo solo con estado:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Ejemplo de actividad (el estado personalizado es el tipo de actividad predeterminado):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Ejemplo de streaming:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mapa de tipos de actividad:

    - 0: Jugando
    - 1: Streaming (requiere `activityUrl`)
    - 2: Escuchando
    - 3: Viendo
    - 4: Personalizado (usa el texto de la actividad como estado; el emoji es opcional)
    - 5: Compitiendo

    Ejemplo de presencia automática (señal de salud del entorno de ejecución):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    La presencia automática asigna la disponibilidad del entorno de ejecución al estado de Discord: saludable => en línea, degradado o desconocido => ausente, agotado o no disponible => no molestar. Sobrescrituras de texto opcionales:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (admite el marcador de posición `{reason}`)

  </Accordion>

  <Accordion title="Aprobaciones en Discord">
    Discord admite la gestión de aprobaciones basada en botones en mensajes directos y, opcionalmente, puede publicar solicitudes de aprobación en el canal de origen.

    Ruta de configuración:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando es posible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord habilita automáticamente las aprobaciones de ejecución nativas cuando `enabled` no está definido o es `"auto"` y se puede resolver al menos un aprobador, ya sea desde `execApprovals.approvers` o desde `commands.ownerAllowFrom`. Discord no infiere aprobadores de ejecución desde el `allowFrom` del canal, el `dm.allowFrom` heredado ni el `defaultTo` de mensajes directos. Configura `enabled: false` para deshabilitar explícitamente Discord como cliente de aprobación nativo.

    Para comandos de grupo sensibles solo para propietarios, como `/diagnostics` y `/export-trajectory`, OpenClaw envía las solicitudes de aprobación y los resultados finales de forma privada. Primero intenta usar un mensaje directo de Discord cuando el propietario que invoca el comando tiene una ruta de propietario de Discord; si no está disponible, recurre a la primera ruta de propietario disponible desde `commands.ownerAllowFrom`, como Telegram.

    Cuando `target` es `channel` o `both`, la solicitud de aprobación es visible en el canal. Solo los aprobadores resueltos pueden usar los botones; los demás usuarios reciben una denegación efímera. Las solicitudes de aprobación incluyen el texto del comando, así que habilita la entrega en canal solo en canales de confianza. Si el ID del canal no puede derivarse de la clave de sesión, OpenClaw recurre a la entrega por mensaje directo.

    Discord también renderiza los botones de aprobación compartidos que usan otros canales de chat. El adaptador nativo de Discord agrega principalmente enrutamiento de mensajes directos a aprobadores y distribución a canales.
    Cuando esos botones están presentes, son la UX de aprobación principal; OpenClaw
    solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique
    que las aprobaciones por chat no están disponibles o que la aprobación manual es la única ruta.
    Si el entorno de ejecución de aprobaciones nativas de Discord no está activo, OpenClaw conserva visible el
    aviso determinista local `/approve <id> <decision>`. Si el
    entorno de ejecución está activo pero no se puede entregar una tarjeta nativa a ningún destino,
    OpenClaw envía un aviso de reserva en el mismo chat con el comando `/approve`
    exacto de la aprobación pendiente.

    La autenticación de Gateway y la resolución de aprobaciones siguen el contrato compartido del cliente de Gateway (los IDs `plugin:` se resuelven mediante `plugin.approval.resolve`; los demás IDs mediante `exec.approval.resolve`). Las aprobaciones expiran después de 30 minutos de forma predeterminada.

    Consulta [Aprobaciones de ejecución](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Herramientas y compuertas de acciones

Las acciones de mensajes de Discord incluyen acciones de mensajería, administración de canales, moderación, presencia y metadatos.

Ejemplos principales:

- mensajería: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reacciones: `react`, `reactions`, `emojiList`
- moderación: `timeout`, `kick`, `ban`
- presencia: `setPresence`

La acción `event-create` acepta un parámetro opcional `image` (URL o ruta de archivo local) para configurar la imagen de portada del evento programado.

Las compuertas de acciones viven bajo `channels.discord.actions.*`.

Comportamiento predeterminado de las compuertas:

| Grupo de acciones                                                                                                                                                        | Predeterminado |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | habilitado     |
| roles                                                                                                                                                                    | deshabilitado  |
| moderation                                                                                                                                                               | deshabilitado  |
| presence                                                                                                                                                                 | deshabilitado  |

## UI de componentes v2

OpenClaw usa componentes v2 de Discord para aprobaciones de ejecución y marcadores entre contextos. Las acciones de mensajes de Discord también pueden aceptar `components` para UI personalizada (avanzado; requiere construir una carga útil de componente mediante la herramienta de Discord), mientras que los `embeds` heredados siguen disponibles, pero no se recomiendan.

- `channels.discord.ui.components.accentColor` configura el color de acento usado por los contenedores de componentes de Discord (hex).
- Configúralo por cuenta con `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` controla durante cuánto tiempo permanecen registrados los callbacks de componentes de Discord enviados (predeterminado `1800000`, máximo `86400000`). Configúralo por cuenta con `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` se ignoran cuando hay componentes v2 presentes.
- Las vistas previas de URL simples se suprimen de forma predeterminada. Configura `suppressEmbeds: false` en una acción de mensaje cuando se deba expandir un único enlace saliente.

Ejemplo:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Voz

Discord tiene dos superficies de voz distintas: **canales de voz** en tiempo real (conversaciones continuas) y **archivos adjuntos de mensajes de voz** (el formato de vista previa de forma de onda). El gateway admite ambas.

### Canales de voz

Lista de configuración:

1. Habilita Message Content Intent en el Portal para desarrolladores de Discord.
2. Habilita Server Members Intent cuando se usen listas de permitidos de roles/usuarios.
3. Invita al bot con los alcances `bot` y `applications.commands`.
4. Concede Connect, Speak, Send Messages y Read Message History en el canal de voz de destino.
5. Habilita comandos nativos (`commands.native` o `channels.discord.commands.native`).
6. Configura `channels.discord.voice`.

Usa `/vc join|leave|status` para controlar sesiones. El comando usa el agente predeterminado de la cuenta y sigue las mismas reglas de listas de permitidos y política de grupos que otros comandos de Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Para inspeccionar los permisos efectivos del bot antes de unirse, ejecuta:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Ejemplo de unión automática:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Notas:

- `voice.tts` anula `messages.tts` solo para la reproducción de voz `stt-tts`. Los modos en tiempo real usan `voice.realtime.speakerVoice`.
- `voice.mode` controla la ruta de conversación. El valor predeterminado es `agent-proxy`: una interfaz de voz en tiempo real gestiona el tiempo de los turnos, las interrupciones y la reproducción, delega el trabajo sustantivo al agente OpenClaw enrutado mediante `openclaw_agent_consult` y trata el resultado como un prompt escrito de Discord de ese hablante. `stt-tts` mantiene el flujo anterior de STT por lotes más TTS. `bidi` permite que el modelo en tiempo real converse directamente mientras expone `openclaw_agent_consult` para el cerebro de OpenClaw.
- `voice.agentSession` controla qué conversación de OpenClaw recibe los turnos de voz. Déjalo sin configurar para usar la sesión propia del canal de voz, o configúralo como `{ mode: "target", target: "channel:<text-channel-id>" }` para hacer que el canal de voz actúe como extensión de micrófono/altavoz de una sesión existente de canal de texto de Discord, como `#maintainers`.
- `voice.model` anula el cerebro del agente OpenClaw para respuestas de voz de Discord y consultas en tiempo real. Déjalo sin configurar para heredar el modelo del agente enrutado. Es independiente de `voice.realtime.model`.
- `voice.followUsers` permite que el bot se una, se mueva y salga de la voz de Discord con usuarios seleccionados. Consulta [Seguir usuarios en voz](#follow-users-in-voice) para ver reglas de comportamiento y ejemplos.
- `agent-proxy` enruta el habla mediante `discord-voice`, lo que conserva la autorización normal de propietario/herramientas para el hablante y la sesión de destino, pero oculta la herramienta `tts` del agente porque la voz de Discord se encarga de la reproducción. De forma predeterminada, `agent-proxy` concede a la consulta acceso completo a herramientas equivalente al propietario para hablantes propietarios (`voice.realtime.toolPolicy: "owner"`) y prefiere firmemente consultar al agente OpenClaw antes de respuestas sustantivas (`voice.realtime.consultPolicy: "always"`). En ese modo `always` predeterminado, la capa en tiempo real no habla automáticamente con relleno antes de la respuesta de la consulta; captura y transcribe el habla, y luego reproduce la respuesta enrutada de OpenClaw. Si varias respuestas de consulta forzada terminan mientras Discord todavía reproduce la primera respuesta, las respuestas exactas de voz posteriores se encolan hasta que la reproducción queda inactiva, en lugar de reemplazar el habla a mitad de frase.
- En modo `stt-tts`, STT usa `tools.media.audio`; `voice.model` no afecta la transcripción.
- En modos en tiempo real, `voice.realtime.provider`, `voice.realtime.model` y `voice.realtime.speakerVoice` configuran la sesión de audio en tiempo real. Para OpenAI Realtime 2 más el cerebro Codex, usa `voice.realtime.model: "gpt-realtime-2"` y `voice.model: "openai/gpt-5.5"`.
- Los modos de voz en tiempo real incluyen pequeños archivos de perfil `IDENTITY.md`, `USER.md` y `SOUL.md` en las instrucciones del proveedor en tiempo real de forma predeterminada, para que los turnos directos rápidos mantengan la misma identidad, contexto de usuario y persona que el agente OpenClaw enrutado. Configura `voice.realtime.bootstrapContextFiles` con un subconjunto para personalizarlo, o `[]` para desactivarlo. Los archivos de arranque en tiempo real admitidos se limitan a esos archivos de perfil; `AGENTS.md` permanece en el contexto normal del agente. El contexto de perfil inyectado no reemplaza `openclaw_agent_consult` para trabajo en el espacio de trabajo, datos actuales, búsqueda en memoria ni acciones respaldadas por herramientas.
- En el modo en tiempo real `agent-proxy` de OpenAI, configura `voice.realtime.requireWakeName: true` para mantener la voz en tiempo real de Discord en silencio hasta que una transcripción empiece o termine con un nombre de activación. Los nombres de activación configurados deben tener una o dos palabras. Si `voice.realtime.wakeNames` no está configurado, OpenClaw usa el `name` del agente enrutado más `OpenClaw`, con reserva al id del agente más `OpenClaw`. La compuerta por nombre de activación desactiva la respuesta automática del proveedor en tiempo real, enruta los turnos aceptados por la ruta de consulta del agente OpenClaw y da un breve reconocimiento hablado cuando se reconoce un nombre de activación inicial desde una transcripción parcial antes de que llegue la transcripción final.
- El proveedor en tiempo real de OpenAI acepta nombres de evento actuales de Realtime 2 y alias heredados compatibles con Codex para eventos de audio de salida y transcripción, de modo que las instantáneas de proveedor compatibles puedan derivar sin perder audio del asistente.
- `voice.realtime.bargeIn` controla si los eventos de inicio de habla de Discord interrumpen la reproducción activa en tiempo real. Si no está configurado, sigue la configuración de interrupción por audio de entrada del proveedor en tiempo real.
- `voice.realtime.minBargeInAudioEndMs` controla la duración mínima de reproducción del asistente antes de que una interrupción en tiempo real de OpenAI trunque el audio. Valor predeterminado: `250`. Configúralo en `0` para interrupción inmediata en salas con poco eco, o auméntalo para configuraciones de altavoces con mucho eco.
- Para una voz de OpenAI en la reproducción de Discord, configura `voice.tts.provider: "openai"` y elige una voz de texto a voz en `voice.tts.providers.openai.speakerVoice`. `cedar` es una buena opción de sonido masculino en el modelo TTS actual de OpenAI.
- Las anulaciones `systemPrompt` de Discord por canal se aplican a los turnos de transcripción de voz de ese canal de voz.
- Los turnos de transcripción de voz derivan el estado de propietario de `allowFrom` de Discord (o `dm.allowFrom`) para comandos protegidos por propietario y acciones de canal. La visibilidad de herramientas del agente sigue la política de herramientas configurada para la sesión enrutada.
- La voz de Discord es opcional para configuraciones solo de texto; configura `channels.discord.voice.enabled=true` (o conserva un bloque `channels.discord.voice` existente) para habilitar los comandos `/vc`, el runtime de voz y la intención de Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` puede anular explícitamente la suscripción a la intención de estado de voz. Déjalo sin configurar para que la intención siga la habilitación efectiva de voz.
- Si `voice.autoJoin` tiene varias entradas para el mismo gremio, OpenClaw se une al último canal configurado para ese gremio.
- `voice.allowedChannels` es una lista de permitidos de residencia opcional. Déjala sin configurar para permitir `/vc join` en cualquier canal de voz autorizado de Discord. Cuando se configura, `/vc join`, la unión automática al inicio y los movimientos de estado de voz del bot se restringen a las entradas `{ guildId, channelId }` listadas. Configúrala como un arreglo vacío para denegar todas las uniones de voz de Discord. Si Discord mueve el bot fuera de la lista de permitidos, OpenClaw sale de ese canal y vuelve a unirse al destino de unión automática configurado cuando hay uno disponible.
- `voice.daveEncryption` y `voice.decryptionFailureTolerance` se pasan a las opciones de unión de `@discordjs/voice`.
- Los valores predeterminados de `@discordjs/voice` son `daveEncryption=true` y `decryptionFailureTolerance=24` si no están configurados.
- OpenClaw usa el códec incluido `libopus-wasm` para recepción de voz de Discord y reproducción PCM sin procesar en tiempo real. Incluye una compilación WebAssembly fija de libopus y no requiere complementos nativos de opus.
- `voice.connectTimeoutMs` controla la espera inicial de Ready de `@discordjs/voice` para `/vc join` e intentos de unión automática. Valor predeterminado: `30000`.
- `voice.reconnectGraceMs` controla cuánto tiempo espera OpenClaw a que una sesión de voz desconectada empiece a reconectarse antes de destruirla. Valor predeterminado: `15000`.
- En modo `stt-tts`, la reproducción de voz no se detiene solo porque otro usuario empiece a hablar. Para evitar bucles de realimentación, OpenClaw ignora nuevas capturas de voz mientras TTS se está reproduciendo; habla después de que termine la reproducción para el siguiente turno. Los modos en tiempo real reenvían los inicios de habla como señales de interrupción al proveedor en tiempo real.
- En modos en tiempo real, el eco de los altavoces en un micrófono abierto puede parecer una interrupción e interrumpir la reproducción. Para salas de Discord con mucho eco, configura `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` para evitar que OpenAI interrumpa automáticamente por audio de entrada. Añade `voice.realtime.bargeIn: true` si aún quieres que los eventos de inicio de habla de Discord interrumpan la reproducción activa. El puente en tiempo real de OpenAI ignora truncamientos de reproducción más cortos que `voice.realtime.minBargeInAudioEndMs` como probable eco/ruido y los registra como omitidos en lugar de limpiar la reproducción de Discord.
- `voice.captureSilenceGraceMs` controla cuánto tiempo espera OpenClaw después de que Discord informa que un hablante se ha detenido antes de finalizar ese segmento de audio para STT. Valor predeterminado: `2000`; auméntalo si Discord divide pausas normales en transcripciones parciales entrecortadas.
- Cuando ElevenLabs es el proveedor TTS seleccionado, la reproducción de voz de Discord usa TTS en streaming y empieza desde el flujo de respuesta del proveedor. Los proveedores sin soporte de streaming vuelven a la ruta de archivo temporal sintetizado.
- OpenClaw también vigila fallos de descifrado de recepción y se recupera automáticamente saliendo del canal de voz y volviendo a unirse después de fallos repetidos en una ventana corta.
- Si los registros de recepción muestran repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` después de actualizar, recopila un informe de dependencias y registros. La línea incluida de `@discordjs/voice` incluye la corrección de padding upstream de la PR #11449 de discord.js, que cerró el issue #11419 de discord.js.
- Los eventos de recepción `The operation was aborted` son esperados cuando OpenClaw finaliza un segmento de hablante capturado; son diagnósticos detallados, no advertencias.
- Los registros detallados de voz de Discord incluyen una vista previa acotada de una línea de la transcripción STT para cada segmento de hablante aceptado, de modo que la depuración muestra tanto el lado del usuario como el lado de la respuesta del agente sin volcar texto de transcripción sin límite.
- En modo `agent-proxy`, la reserva de consulta forzada omite fragmentos de transcripción probablemente incompletos, como texto que termina en `...` o un conector final como `and`, además de cierres obviamente no accionables como “vuelvo enseguida” o “adiós”. Los registros muestran `forced agent consult skipped reason=...` cuando esto evita una respuesta encolada obsoleta.

### Seguir usuarios en voz

Usa `voice.followUsers` cuando quieras que el bot de voz de Discord permanezca con uno o más usuarios conocidos de Discord en lugar de unirse a un canal fijo al inicio o esperar `/vc join`.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

Comportamiento:

- `followUsers` acepta IDs de usuario sin formato de Discord y valores `discord:<id>`. OpenClaw normaliza ambas formas antes de hacer coincidir eventos de estado de voz.
- `followUsersEnabled` toma como valor predeterminado `true` cuando `followUsers` está configurado. Configúralo como `false` para conservar la lista guardada pero detener el seguimiento de voz automático.
- Cuando un usuario seguido se une a un canal de voz permitido, OpenClaw se une a ese canal. Cuando el usuario se mueve, OpenClaw se mueve con él. Cuando el usuario seguido activo se desconecta, OpenClaw sale.
- Si varios usuarios seguidos están en el mismo gremio y el usuario seguido activo sale, OpenClaw se mueve al canal de otro usuario seguido rastreado antes de salir del gremio. Si varios usuarios seguidos se mueven a la vez, gana el último evento de estado de voz observado.
- `allowedChannels` sigue aplicándose. Un usuario seguido en un canal no permitido se ignora, y una sesión propiedad del seguimiento se mueve a otro usuario seguido o sale.
- OpenClaw reconcilia eventos de estado de voz perdidos al inicio y a un intervalo acotado. La reconciliación muestrea gremios configurados y limita las consultas REST por ejecución, por lo que las listas `followUsers` muy grandes pueden tardar más de un intervalo en converger.
- Si Discord o un administrador mueve el bot mientras sigue a un usuario, OpenClaw reconstruye la sesión de voz y conserva la propiedad del seguimiento cuando el destino está permitido. Si el bot se mueve fuera de `allowedChannels`, OpenClaw sale y vuelve a unirse al destino configurado cuando existe uno.
- La recuperación de recepción DAVE puede salir y volver a unirse al mismo canal después de fallos de descifrado repetidos. Las sesiones propiedad del seguimiento conservan su propiedad de seguimiento a través de esa ruta de recuperación, por lo que una desconexión posterior del usuario seguido todavía hace que se salga del canal.

Elige entre los modos de unión:

- Usa `followUsers` para configuraciones personales o de operador donde el bot debe estar automáticamente en voz cuando tú lo estés.
- Usa `autoJoin` para bots de salas fijas que deben estar presentes incluso cuando ningún usuario rastreado esté en voz.
- Usa `/vc join` para uniones puntuales o salas donde la presencia de voz automática sería inesperada.

Códec de voz de Discord:

- Los registros de recepción de voz muestran `discord voice: opus decoder: libopus-wasm`.
- La reproducción en tiempo real codifica PCM estéreo sin procesar de 48 kHz a Opus con el mismo paquete incluido `libopus-wasm` antes de entregar los paquetes a `@discordjs/voice`.
- La reproducción de archivos y de flujos del proveedor transcodifica a PCM estéreo sin procesar de 48 kHz con ffmpeg, y luego usa `libopus-wasm` para el flujo de paquetes Opus enviado a Discord.

Canalización de STT más TTS:

- La captura PCM de Discord se convierte en un archivo temporal WAV.
- `tools.media.audio` gestiona STT, por ejemplo `openai/gpt-4o-mini-transcribe`.
- La transcripción se envía a través de la entrada y el enrutamiento de Discord mientras el LLM de respuesta se ejecuta con una política de salida de voz que oculta la herramienta `tts` del agente y solicita texto devuelto, porque la voz de Discord es propietaria de la reproducción TTS final.
- `voice.model`, cuando está definido, solo anula el LLM de respuesta para este turno de canal de voz.
- `voice.tts` se fusiona sobre `messages.tts`; los proveedores con capacidad de streaming alimentan directamente al reproductor; de lo contrario, el archivo de audio resultante se reproduce en el canal unido.

Ejemplo de sesión de canal de voz agent-proxy predeterminada:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Sin un bloque `voice.agentSession`, cada canal de voz obtiene su propia sesión enrutada de OpenClaw. Por ejemplo, `/vc join channel:234567890123456789` habla con la sesión de ese canal de voz de Discord. El modelo en tiempo real es solo la interfaz de voz; las solicitudes sustantivas se entregan al agente de OpenClaw configurado. Si el modelo en tiempo real produce una transcripción final sin llamar a la herramienta de consulta, OpenClaw fuerza la consulta como reserva para que el valor predeterminado siga comportándose como hablar con el agente.

Ejemplo heredado de STT más TTS:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

Ejemplo bidi en tiempo real:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Voz como extensión de una sesión existente de canal de Discord:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

En modo `agent-proxy`, el bot se une al canal de voz configurado, pero los turnos del agente de OpenClaw usan la sesión y el agente enrutados normales del canal de destino. La sesión de voz en tiempo real dice el resultado devuelto en el canal de voz. El agente supervisor aún puede usar las herramientas normales de mensajes según su política de herramientas, incluido enviar un mensaje separado de Discord si esa es la acción correcta.

Mientras una ejecución delegada de OpenClaw está activa, las nuevas transcripciones de voz de Discord se tratan como control de ejecución en vivo antes de iniciar otro turno del agente. Frases como "status", "cancel that", "use the smaller fix" o "when you're done also check tests" se clasifican como entrada de estado, cancelación, dirección o seguimiento para la sesión activa. Los resultados de estado, cancelación, dirección aceptada y seguimiento se dicen en el canal de voz para que quien llama sepa si OpenClaw gestionó la solicitud.

Formas de destino útiles:

- `target: "channel:123456789012345678"` enruta a través de una sesión de canal de texto de Discord.
- `target: "123456789012345678"` se trata como un destino de canal.
- `target: "dm:123456789012345678"` o `target: "user:123456789012345678"` enruta a través de esa sesión de mensaje directo.

Ejemplo de OpenAI Realtime con mucho eco:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

Use esto cuando el modelo escuche su propia reproducción de Discord a través de un micrófono abierto, pero aun así quiera interrumpirlo hablando. OpenClaw evita que OpenAI interrumpa automáticamente con audio de entrada sin procesar, mientras que `bargeIn: true` permite que los eventos de inicio de habla de Discord y el audio de hablante ya activo cancelen respuestas en tiempo real activas antes de que el siguiente turno capturado llegue a OpenAI. Las señales de interrupción muy tempranas con `audioEndMs` por debajo de `minBargeInAudioEndMs` se tratan como probable eco/ruido y se ignoran para que el modelo no se corte en el primer fotograma de reproducción.

Registros de voz esperados:

- Al unirse: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Al iniciar en tiempo real: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Con audio del hablante: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` y `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Al omitir habla obsoleta: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` o `reason=non-actionable-closing ...`
- Al completar la respuesta en tiempo real: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Al detener/restablecer la reproducción: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- En una consulta en tiempo real: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- En la respuesta del agente: `discord voice: agent turn answer ...`
- Al poner en cola habla exacta: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, seguido de `discord voice: realtime exact speech dequeued reason=player-idle ...`
- En la detección de interrupción: `discord voice: realtime barge-in detected source=speaker-start ...` o `discord voice: realtime barge-in detected source=active-speaker-audio ...`, seguido de `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- En la interrupción en tiempo real: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, seguido de `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` o `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- En eco/ruido ignorado: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- En interrupción deshabilitada: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- En reproducción inactiva: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Para depurar audio cortado, lea los registros de voz en tiempo real como una línea de tiempo:

1. `realtime audio playback started` significa que Discord ha empezado a reproducir audio del asistente. El puente empieza a contar fragmentos de salida del asistente, bytes PCM de Discord, bytes en tiempo real del proveedor y duración de audio sintetizado desde este punto.
2. `realtime speaker turn opened` marca que un hablante de Discord se vuelve activo. Si la reproducción ya está activa y `bargeIn` está habilitado, esto puede ir seguido de `barge-in detected source=speaker-start`.
3. `realtime input audio started` marca el primer fotograma de audio real recibido para ese turno de hablante. `outputActive=true` o un `outputAudioMs` distinto de cero aquí significa que el micrófono está enviando entrada mientras la reproducción del asistente sigue activa.
4. `barge-in detected source=active-speaker-audio` significa que OpenClaw vio audio de hablante en vivo mientras la reproducción del asistente estaba activa. Esto es útil para distinguir una interrupción real de un evento de inicio de hablante de Discord sin audio útil.
5. `barge-in requested reason=...` significa que OpenClaw pidió al proveedor en tiempo real cancelar o truncar la respuesta activa. Incluye `outputAudioMs`, `outputActive` y `playbackChunks` para que pueda ver cuánto audio del asistente se había reproducido realmente antes de la interrupción.
6. `realtime audio playback stopped reason=...` es el punto local de restablecimiento de reproducción de Discord. El motivo indica quién detuvo la reproducción: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` o `session-close`.
7. `realtime speaker turn closed` resume el turno de entrada capturado. `chunks=0` o `hasAudio=false` significa que el turno de hablante se abrió, pero no llegó audio utilizable al puente en tiempo real. `interruptedPlayback=true` significa que ese turno de entrada se superpuso con la salida del asistente y activó la lógica de interrupción.

Campos útiles:

- `outputAudioMs`: duración de audio del asistente generada por el proveedor en tiempo real antes de la línea de registro.
- `audioMs`: duración de audio del asistente que OpenClaw contó antes de que la reproducción se detuviera.
- `elapsedMs`: tiempo de reloj entre abrir y cerrar el flujo de reproducción o el turno de hablante.
- `discordBytes`: bytes PCM estéreo de 48 kHz enviados a la voz de Discord o recibidos de ella.
- `realtimeBytes`: bytes PCM en formato del proveedor enviados al proveedor en tiempo real o recibidos de él.
- `playbackChunks`: fragmentos de audio del asistente reenviados a Discord para la respuesta activa.
- `sinceLastAudioMs`: intervalo entre el último fotograma de audio de hablante capturado y el cierre del turno de hablante.

Patrones comunes:

- Un corte inmediato con `source=active-speaker-audio`, `outputAudioMs` pequeño y el mismo usuario cerca suele apuntar a eco del altavoz entrando en el micrófono. Aumente `voice.realtime.minBargeInAudioEndMs`, baje el volumen del altavoz, use auriculares o defina `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` seguido de `speaker turn closed ... hasAudio=false` significa que Discord notificó un inicio de hablante, pero no llegó audio a OpenClaw. Eso puede ser un evento transitorio de voz de Discord, comportamiento de puerta de ruido o un cliente que activa brevemente el micrófono.
- `audio playback stopped reason=stream-close` sin una interrupción cercana ni `provider-clear-audio` significa que el flujo local de reproducción de Discord terminó inesperadamente. Revise los registros anteriores del proveedor y del reproductor de Discord.
- `capture ignored during playback (barge-in disabled)` significa que OpenClaw descartó intencionalmente la entrada mientras el audio del asistente estaba activo. Habilite `voice.realtime.bargeIn` si quiere que el habla interrumpa la reproducción.
- `barge-in ignored ... outputActive=false` significa que Discord o el VAD del proveedor notificó habla, pero OpenClaw no tenía reproducción activa que interrumpir. Esto no debería cortar el audio.

Las credenciales se resuelven por componente: autenticación de ruta de LLM para `voice.model`, autenticación de STT para `tools.media.audio`, autenticación de TTS para `messages.tts`/`voice.tts` y autenticación del proveedor en tiempo real para `voice.realtime.providers` o la configuración de autenticación normal del proveedor.

### Mensajes de voz

Los mensajes de voz de Discord muestran una vista previa de forma de onda y requieren audio OGG/Opus. OpenClaw genera la forma de onda automáticamente, pero necesita `ffmpeg` y `ffprobe` en el host del Gateway para inspeccionar y convertir.

- Proporciona una **ruta de archivo local** (se rechazan las URL).
- Omite el contenido de texto (Discord rechaza texto + mensaje de voz en la misma carga útil).
- Se acepta cualquier formato de audio; OpenClaw lo convierte a OGG/Opus según sea necesario.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="Se usaron intents no permitidos o el bot no ve mensajes del servidor">

    - habilita Message Content Intent
    - habilita Server Members Intent cuando dependas de la resolución de usuarios/miembros
    - reinicia el Gateway después de cambiar los intents

  </Accordion>

  <Accordion title="Mensajes del servidor bloqueados inesperadamente">

    - verifica `groupPolicy`
    - verifica la lista de permitidos de servidores en `channels.discord.guilds`
    - si existe el mapa `channels` del servidor, solo se permiten los canales enumerados
    - verifica el comportamiento de `requireMention` y los patrones de mención

    Comprobaciones útiles:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention es false pero sigue bloqueado">
    Causas comunes:

    - `groupPolicy="allowlist"` sin una lista de permitidos de servidor/canal coincidente
    - `requireMention` configurado en el lugar incorrecto (debe estar en `channels.discord.guilds` o en la entrada del canal)
    - remitente bloqueado por la lista de permitidos `users` del servidor/canal

  </Accordion>

  <Accordion title="Turnos de Discord de larga duración o respuestas duplicadas">

    Registros típicos:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Controles de cola del Gateway de Discord:

    - cuenta única: `channels.discord.eventQueue.listenerTimeout`
    - multicuenta: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - esto solo controla el trabajo del listener del Gateway de Discord, no la duración del turno del agente

    Discord no aplica un tiempo de espera propio del canal a los turnos de agente en cola. Los listeners de mensajes delegan de inmediato, y las ejecuciones de Discord en cola preservan el orden por sesión hasta que el ciclo de vida de la sesión/herramienta/runtime completa o cancela el trabajo.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Advertencias de tiempo de espera al consultar metadatos del Gateway">
    OpenClaw obtiene los metadatos `/gateway/bot` de Discord antes de conectarse. Los fallos transitorios recurren a la URL de Gateway predeterminada de Discord y se limitan por frecuencia en los registros.

    Controles de tiempo de espera de metadatos:

    - cuenta única: `channels.discord.gatewayInfoTimeoutMs`
    - multicuenta: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - variable de entorno alternativa cuando la configuración no está definida: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - predeterminado: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Reinicios por tiempo de espera de READY del Gateway">
    OpenClaw espera el evento `READY` del Gateway de Discord durante el arranque y después de reconexiones del runtime. Las configuraciones multicuenta con escalonamiento de arranque pueden necesitar una ventana READY de arranque más larga que la predeterminada.

    Controles de tiempo de espera de READY:

    - arranque con cuenta única: `channels.discord.gatewayReadyTimeoutMs`
    - arranque multicuenta: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - variable de entorno alternativa de arranque cuando la configuración no está definida: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - valor predeterminado de arranque: `15000` (15 segundos), máximo: `120000`
    - runtime con cuenta única: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multicuenta: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - variable de entorno alternativa de runtime cuando la configuración no está definida: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - valor predeterminado de runtime: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Discordancias en la auditoría de permisos">
    Las comprobaciones de permisos de `channels status --probe` solo funcionan con ID de canal numéricos.

    Si usas claves de slug, la coincidencia en tiempo de ejecución aún puede funcionar, pero la comprobación no puede verificar completamente los permisos.

  </Accordion>

  <Accordion title="Problemas de DM y emparejamiento">

    - DM deshabilitado: `channels.discord.dm.enabled=false`
    - Política de DM deshabilitada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - esperando aprobación de emparejamiento en modo `pairing`

  </Accordion>

  <Accordion title="Bucles de bot a bot">
    De forma predeterminada, se ignoran los mensajes escritos por bots.

    Si configuras `channels.discord.allowBots=true`, usa reglas estrictas de menciones y lista de permitidos para evitar comportamientos de bucle.
    Prefiere `channels.discord.allowBots="mentions"` para aceptar solo mensajes de bots que mencionen al bot.

    OpenClaw también incluye [protección contra bucles de bots](/es/channels/bot-loop-protection) compartida. Siempre que `allowBots` permite que los mensajes escritos por bots lleguen al despacho, Discord asigna el evento entrante a datos de `(cuenta, canal, par de bots)` y la protección genérica de pares suprime el par después de que supera el presupuesto de eventos configurado. La protección evita bucles descontrolados entre dos bots que antes debían detenerse mediante los límites de frecuencia de Discord; no afecta a implementaciones de un solo bot ni a respuestas únicas de bots que se mantienen por debajo del presupuesto.

    Configuración predeterminada (activa cuando `allowBots` está configurado):

    - `maxEventsPerWindow: 20` -- el par de bots puede intercambiar 20 mensajes dentro de la ventana deslizante
    - `windowSeconds: 60` -- longitud de la ventana deslizante
    - `cooldownSeconds: 60` -- una vez que se agota el presupuesto, cada mensaje adicional de bot a bot en cualquier dirección se descarta durante un minuto

    Configura el valor predeterminado compartido una vez en `channels.defaults.botLoopProtection` y luego sobrescribe Discord cuando un flujo de trabajo legítimo necesite más margen. La precedencia es:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - valores predeterminados incorporados

    Discord usa las claves genéricas `maxEventsPerWindow`, `windowSeconds` y `cooldownSeconds`.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Caídas de STT de voz con DecryptionFailed(...)">

    - mantén OpenClaw actualizado (`openclaw update`) para que esté presente la lógica de recuperación de recepción de voz de Discord
    - confirma `channels.discord.voice.daveEncryption=true` (predeterminado)
    - empieza con `channels.discord.voice.decryptionFailureTolerance=24` (valor predeterminado upstream) y ajusta solo si es necesario
    - vigila los registros en busca de:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si los fallos continúan después de la reconexión automática, recopila registros y compáralos con el historial upstream de recepción de DAVE en [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) y [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referencia de configuración

Referencia principal: [Referencia de configuración - Discord](/es/gateway/config-channels#discord).

<Accordion title="Campos de Discord de alto valor">

- inicio/autenticación: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- cola de eventos: `eventQueue.listenerTimeout` (presupuesto de listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- respuesta/historial: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- transmisión: `streaming` (alias legado: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medios/reintento: `mediaMaxMb` (limita las cargas salientes de Discord, predeterminado `100MB`), `retry`
- acciones: `actions.*`
- presencia: `activity`, `status`, `activityType`, `activityUrl`
- IU: `ui.components.accentColor`
- funciones: `threadBindings`, `bindings[]` de nivel superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Seguridad y operaciones

- Trata los tokens de bot como secretos (se prefiere `DISCORD_BOT_TOKEN` en entornos supervisados).
- Concede permisos de Discord de mínimo privilegio.
- Si el despliegue o el estado de comandos está obsoleto, reinicia el Gateway y vuelve a comprobar con `openclaw channels status --probe`.

## Relacionado

<CardGroup cols={2}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Discord con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de chat grupal y lista de permitidos.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enruta mensajes entrantes a agentes.
  </Card>
  <Card title="Seguridad" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y endurecimiento.
  </Card>
  <Card title="Enrutamiento multiagente" icon="sitemap" href="/es/concepts/multi-agent">
    Asigna gremios y canales a agentes.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de comandos nativos.
  </Card>
</CardGroup>
