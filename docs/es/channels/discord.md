---
read_when:
    - Trabajando en funciones del canal de Discord
summary: Estado de soporte, capacidades y configuración del bot de Discord
title: Discord
x-i18n:
    generated_at: "2026-06-27T10:36:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ed02258347113ca5b1dfcc5169a48190e3b4e1273d27a8a5c45f0f930cdbbf
    source_path: channels/discord.md
    workflow: 16
---

Listo para DMs y canales de servidor mediante el Gateway oficial de Discord.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    Los DMs de Discord usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de comandos nativos y catálogo de comandos.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y flujo de reparación.
  </Card>
</CardGroup>

## Configuración rápida

Tendrás que crear una nueva aplicación con un bot, añadir el bot a tu servidor y emparejarlo con OpenClaw. Recomendamos añadir tu bot a tu propio servidor privado. Si todavía no tienes uno, [crea uno primero](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (elige **Create My Own > For me and my friends**).

<Steps>
  <Step title="Create a Discord application and bot">
    Ve al [Portal de desarrolladores de Discord](https://discord.com/developers/applications) y haz clic en **New Application**. Ponle un nombre como "OpenClaw".

    Haz clic en **Bot** en la barra lateral. Configura el **Username** con el nombre que uses para tu agente de OpenClaw.

  </Step>

  <Step title="Enable privileged intents">
    Aún en la página **Bot**, desplázate hacia abajo hasta **Privileged Gateway Intents** y habilita:

    - **Message Content Intent** (obligatorio)
    - **Server Members Intent** (recomendado; obligatorio para listas de permitidos de roles y coincidencia de nombres con ID)
    - **Presence Intent** (opcional; solo necesario para actualizaciones de presencia)

  </Step>

  <Step title="Copy your bot token">
    Vuelve a la parte superior de la página **Bot** y haz clic en **Reset Token**.

    <Note>
    A pesar del nombre, esto genera tu primer token; no se está "restableciendo" nada.
    </Note>

    Copia el token y guárdalo en algún lugar. Este es tu **Bot Token** y lo necesitarás en breve.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    Haz clic en **OAuth2** en la barra lateral. Generarás una URL de invitación con los permisos adecuados para añadir el bot a tu servidor.

    Desplázate hacia abajo hasta **OAuth2 URL Generator** y habilita:

    - `bot`
    - `applications.commands`

    Aparecerá debajo una sección **Bot Permissions**. Habilita al menos:

    **General Permissions**
      - Ver canales
    **Text Permissions**
      - Enviar mensajes
      - Leer historial de mensajes
      - Insertar enlaces
      - Adjuntar archivos
      - Añadir reacciones (opcional)

    Este es el conjunto base para canales de texto normales. Si planeas publicar en hilos de Discord, incluidos flujos de trabajo de canales de foro o multimedia que crean o continúan un hilo, habilita también **Send Messages in Threads**.
    Copia la URL generada en la parte inferior, pégala en tu navegador, selecciona tu servidor y haz clic en **Continue** para conectar. Ahora deberías ver tu bot en el servidor de Discord.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    De vuelta en la aplicación de Discord, debes habilitar el modo de desarrollador para poder copiar IDs internos.

    1. Haz clic en **User Settings** (icono de engranaje junto a tu avatar) → **Advanced** → activa **Developer Mode**
    2. Haz clic derecho en el **icono de tu servidor** en la barra lateral → **Copy Server ID**
    3. Haz clic derecho en tu **propio avatar** → **Copy User ID**

    Guarda tu **Server ID** y **User ID** junto con tu Bot Token; enviarás los tres a OpenClaw en el siguiente paso.

  </Step>

  <Step title="Allow DMs from server members">
    Para que el emparejamiento funcione, Discord debe permitir que tu bot te envíe un DM. Haz clic derecho en el **icono de tu servidor** → **Privacy Settings** → activa **Direct Messages**.

    Esto permite que los miembros del servidor (incluidos los bots) te envíen DMs. Mantén esto habilitado si quieres usar DMs de Discord con OpenClaw. Si solo planeas usar canales de servidor, puedes deshabilitar los DMs después del emparejamiento.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
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

    Si OpenClaw ya se está ejecutando como servicio en segundo plano, reinícialo mediante la aplicación de OpenClaw para Mac o deteniendo y reiniciando el proceso `openclaw gateway run`.
    Para instalaciones de servicio administradas, ejecuta `openclaw gateway install` desde una shell donde `DISCORD_BOT_TOKEN` esté presente, o almacena la variable en `~/.openclaw/.env`, para que el servicio pueda resolver el SecretRef de entorno después del reinicio.
    Si tu host está bloqueado o limitado por tasa por la consulta de aplicación de inicio de Discord, configura el ID de aplicación/cliente de Discord desde el Portal de desarrolladores para que el inicio pueda omitir esa llamada REST. Usa `channels.discord.applicationId` para la cuenta predeterminada, o `channels.discord.accounts.<accountId>.applicationId` cuando ejecutes varios bots de Discord.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        Chatea con tu agente de OpenClaw en cualquier canal existente (por ejemplo, Telegram) y díselo. Si Discord es tu primer canal, usa en su lugar la pestaña de CLI / configuración.

        > "Ya configuré mi token de bot de Discord en la configuración. Finaliza la configuración de Discord con User ID `<user_id>` y Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Si prefieres la configuración basada en archivos, establece:

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

        Respaldo de entorno para la cuenta predeterminada:

```bash
DISCORD_BOT_TOKEN=...
```

        Para una configuración remota o con scripts, escribe el mismo bloque JSON5 con `openclaw config patch --file ./discord.patch.json5 --dry-run` y luego vuelve a ejecutarlo sin `--dry-run`. Se admiten valores `token` en texto plano. También se admiten valores SecretRef para `channels.discord.token` en proveedores env/file/exec. Consulta [Gestión de secretos](/es/gateway/secrets).

        Para varios bots de Discord, mantén cada token de bot e ID de aplicación bajo su cuenta. Un `channels.discord.applicationId` de nivel superior se hereda por las cuentas, así que configúralo allí solo cuando todas las cuentas deban usar el mismo ID de aplicación.

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

  <Step title="Approve first DM pairing">
    Espera hasta que el Gateway esté en ejecución y luego envía un DM a tu bot en Discord. Responderá con un código de emparejamiento.

    <Tabs>
      <Tab title="Ask your agent">
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
La resolución de tokens tiene en cuenta la cuenta. Los valores de token de configuración tienen prioridad sobre el respaldo de entorno. `DISCORD_BOT_TOKEN` solo se usa para la cuenta predeterminada.
Si dos cuentas de Discord habilitadas se resuelven al mismo token de bot, OpenClaw inicia solo un monitor de Gateway para ese token. Un token procedente de la configuración tiene prioridad sobre el respaldo de entorno predeterminado; de lo contrario, gana la primera cuenta habilitada y la cuenta duplicada se informa como deshabilitada.
Para llamadas salientes avanzadas (acciones de herramienta/canal de mensajes), se usa un `token` explícito por llamada para esa llamada. Esto se aplica a acciones de envío y de tipo lectura/sondeo (por ejemplo, leer/buscar/obtener/hilo/anclados/permisos). La configuración de política/reintento de la cuenta sigue viniendo de la cuenta seleccionada en la instantánea de runtime activa.
</Note>

## Recomendado: Configurar un espacio de trabajo de servidor

Una vez que los DMs funcionen, puedes configurar tu servidor de Discord como un espacio de trabajo completo donde cada canal obtiene su propia sesión de agente con su propio contexto. Esto se recomienda para servidores privados donde solo están tú y tu bot.

<Steps>
  <Step title="Add your server to the guild allowlist">
    Esto permite que tu agente responda en cualquier canal de tu servidor, no solo en DMs.

    <Tabs>
      <Tab title="Ask your agent">
        > "Añade mi Discord Server ID `<server_id>` a la lista de permitidos del servidor"
      </Tab>
      <Tab title="Config">

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

  <Step title="Allow responses without @mention">
    De forma predeterminada, tu agente solo responde en canales de servidor cuando se le @menciona. Para un servidor privado, probablemente quieras que responda a todos los mensajes.

    En canales de servidor, las respuestas normales se publican automáticamente de forma predeterminada. Para salas compartidas siempre activas, opta por `messages.groupChat.visibleReplies: "message_tool"` para que el agente pueda observar en segundo plano y solo publicar cuando decida que una respuesta en el canal es útil. Esto funciona mejor con modelos de última generación y fiables con herramientas, como GPT 5.5. Los eventos de sala ambientales permanecen silenciosos salvo que la herramienta envíe. Consulta [Eventos de sala ambientales](/es/channels/ambient-room-events) para ver la configuración completa del modo de observación.

    Si Discord muestra escritura y los registros muestran uso de tokens pero no hay ningún mensaje publicado, comprueba si el turno se configuró como evento de sala ambiental o si optó por respuestas visibles con herramienta de mensajes.

    <Tabs>
      <Tab title="Ask your agent">
        > "Permite que mi agente responda en este servidor sin tener que ser @mencionado"
      </Tab>
      <Tab title="Config">
        Establece `requireMention: false` en la configuración de tu servidor:

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

        Para exigir envíos con herramienta de mensajes para respuestas visibles de grupo/canal, establece `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    De forma predeterminada, la memoria a largo plazo (MEMORY.md) solo se carga en sesiones de DM. Los canales de servidor no cargan automáticamente MEMORY.md.

    <Tabs>
      <Tab title="Ask your agent">
        > "Cuando haga preguntas en canales de Discord, usa memory_search o memory_get si necesitas contexto a largo plazo de MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Si necesitas contexto compartido en todos los canales, coloca las instrucciones estables en `AGENTS.md` o `USER.md` (se inyectan en cada sesión). Mantén las notas a largo plazo en `MEMORY.md` y accede a ellas bajo demanda con herramientas de memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ahora crea algunos canales en tu servidor de Discord y empieza a chatear. Tu agente puede ver el nombre del canal, y cada canal obtiene su propia sesión aislada, así que puedes configurar `#coding`, `#home`, `#research` o lo que encaje con tu flujo de trabajo.

## Modelo de runtime

- Gateway gestiona la conexión de Discord.
- El enrutamiento de respuestas es determinista: las respuestas entrantes de Discord vuelven a Discord.
- Los metadatos de servidor/canal de Discord se añaden al prompt del modelo como contexto
  no confiable, no como prefijo de respuesta visible para el usuario. Si un modelo copia ese envoltorio
  de vuelta, OpenClaw elimina los metadatos copiados de las respuestas salientes y del
  contexto de reproducción futuro.
- De forma predeterminada (`session.dmScope=main`), los chats directos comparten la sesión principal del agente (`agent:main:main`).
- Los canales de servidor son claves de sesión aisladas (`agent:<agentId>:discord:channel:<channelId>`).
- Los mensajes directos grupales se ignoran de forma predeterminada (`channels.discord.dm.groupEnabled=false`).
- Los comandos slash nativos se ejecutan en sesiones de comandos aisladas (`agent:<agentId>:discord:slash:<userId>`), aunque siguen llevando `CommandTargetSessionKey` a la sesión de conversación enrutada.
- La entrega de anuncios de cron/heartbeat solo de texto a Discord usa una vez la respuesta final
  visible para el asistente. Los payloads de componentes multimedia y estructurados siguen siendo
  de varios mensajes cuando el agente emite varios payloads entregables.

## Canales de foro

Los canales de foro y multimedia de Discord solo aceptan publicaciones en hilos. OpenClaw admite dos formas de crearlos:

- Envía un mensaje al foro padre (`channel:<forumId>`) para crear automáticamente un hilo. El título del hilo usa la primera línea no vacía de tu mensaje.
- Usa `openclaw message thread create` para crear un hilo directamente. No pases `--message-id` para canales de foro.

Ejemplo: enviar al foro padre para crear un hilo

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Ejemplo: crear un hilo de foro explícitamente

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Los foros padre no aceptan componentes de Discord. Si necesitas componentes, envía al propio hilo (`channel:<threadId>`).

## Componentes interactivos

OpenClaw admite contenedores de componentes v2 de Discord para mensajes de agentes. Usa la herramienta de mensajes con un payload `components`. Los resultados de interacción se enrutan de vuelta al agente como mensajes entrantes normales y siguen la configuración existente de Discord `replyToMode`.

Bloques admitidos:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Las filas de acciones permiten hasta 5 botones o un único menú de selección
- Tipos de selección: `string`, `user`, `role`, `mentionable`, `channel`

De forma predeterminada, los componentes son de un solo uso. Define `components.reusable=true` para permitir que botones, selecciones y formularios se usen varias veces hasta que expiren.

Para restringir quién puede hacer clic en un botón, define `allowedUsers` en ese botón (IDs de usuario de Discord, etiquetas o `*`). Cuando está configurado, los usuarios que no coinciden reciben una denegación efímera.

Las devoluciones de llamada de componentes expiran después de 30 minutos de forma predeterminada. Define `channels.discord.agentComponents.ttlMs` para cambiar esa duración del registro de devoluciones de llamada para la cuenta predeterminada de Discord, o `channels.discord.accounts.<accountId>.agentComponents.ttlMs` para sobrescribir una cuenta en una configuración multicuenta. El valor está en milisegundos, debe ser un entero positivo y tiene un límite de `86400000` (24 horas). Los TTL más largos son útiles para flujos de revisión o aprobación que necesitan que los botones sigan siendo utilizables, pero también amplían la ventana en la que un mensaje antiguo de Discord todavía puede activar una acción. Prefiere el TTL más corto que encaje con el flujo de trabajo y conserva el valor predeterminado cuando las devoluciones de llamada obsoletas serían inesperadas.

Los comandos slash `/model` y `/models` abren un selector de modelo interactivo con desplegables de proveedor, modelo y runtime compatible, además de un paso de envío. `/models add` está obsoleto y ahora devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat. La respuesta del selector es efímera y solo puede usarla el usuario que lo invoca. Los menús de selección de Discord están limitados a 25 opciones, así que añade entradas `provider/*` a `agents.defaults.models` cuando quieras que el selector muestre modelos descubiertos dinámicamente solo para proveedores seleccionados como `openai` o `vllm`.

Adjuntos de archivo:

- Los bloques `file` deben apuntar a una referencia de adjunto (`attachment://<filename>`)
- Proporciona el adjunto mediante `media`/`path`/`filePath` (un solo archivo); usa `media-gallery` para varios archivos
- Usa `filename` para sobrescribir el nombre de carga cuando deba coincidir con la referencia del adjunto

Formularios modales:

- Añade `components.modal` con hasta 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw añade automáticamente un botón disparador

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
    `channels.discord.dmPolicy` controla el acceso por mensaje directo. `channels.discord.allowFrom` es la lista de permitidos canónica para mensajes directos.

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.discord.allowFrom` incluya `"*"`)
    - `disabled`

    Si la política de mensajes directos no está abierta, los usuarios desconocidos se bloquean (o se les solicita emparejamiento en modo `pairing`).

    Precedencia multicuenta:

    - `channels.discord.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Para una cuenta, `allowFrom` tiene precedencia sobre el valor heredado `dm.allowFrom`.
    - Las cuentas con nombre heredan `channels.discord.allowFrom` cuando sus propios `allowFrom` y el valor heredado `dm.allowFrom` no están definidos.
    - Las cuentas con nombre no heredan `channels.discord.accounts.default.allowFrom`.

    Los valores heredados `channels.discord.dm.policy` y `channels.discord.dm.allowFrom` todavía se leen por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    Formato de destino de mensaje directo para la entrega:

    - `user:<id>`
    - mención `<@id>`

    Los IDs numéricos sin prefijo normalmente se resuelven como IDs de canal cuando hay un valor predeterminado de canal activo, pero los IDs enumerados en el `allowFrom` efectivo de mensajes directos de la cuenta se tratan como destinos de mensajes directos de usuario por compatibilidad.

  </Tab>

  <Tab title="Access groups">
    Los mensajes directos de Discord y la autorización de comandos de texto pueden usar entradas dinámicas `accessGroup:<name>` en `channels.discord.allowFrom`.

    Los nombres de grupos de acceso se comparten entre canales de mensajes. Usa `type: "message.senders"` para un grupo estático cuyos miembros se expresan en la sintaxis normal de `allowFrom` de cada canal, o `type: "discord.channelAudience"` cuando la audiencia actual `ViewChannel` de un canal de Discord deba definir la pertenencia dinámicamente. El comportamiento compartido de grupos de acceso está documentado aquí: [Grupos de acceso](/es/channels/access-groups).

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

    Un canal de texto de Discord no tiene una lista de miembros separada. `type: "discord.channelAudience"` modela la pertenencia así: el remitente del mensaje directo es miembro del servidor configurado y actualmente tiene permiso efectivo `ViewChannel` sobre el canal configurado después de aplicar roles y sobrescrituras de canal.

    Ejemplo: permitir que cualquiera que pueda ver `#maintainers` envíe mensajes directos al bot, manteniendo cerrados los mensajes directos para todos los demás.

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

    Las búsquedas fallan en modo cerrado. Si Discord devuelve `Missing Access`, la búsqueda del miembro falla o el canal pertenece a un servidor distinto, el remitente del mensaje directo se trata como no autorizado.

    Activa **Server Members Intent** en el Discord Developer Portal para el bot cuando uses grupos de acceso basados en audiencia de canal. Los mensajes directos no incluyen el estado de miembro del servidor, así que OpenClaw resuelve el miembro mediante Discord REST en el momento de la autorización.

  </Tab>

  <Tab title="Guild policy">
    El manejo de servidores se controla mediante `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La base segura cuando existe `channels.discord` es `allowlist`.

    Comportamiento de `allowlist`:

    - el servidor debe coincidir con `channels.discord.guilds` (se prefiere `id`, se acepta slug)
    - listas opcionales de remitentes permitidos: `users` (se recomiendan IDs estables) y `roles` (solo IDs de rol); si cualquiera de las dos está configurada, los remitentes se permiten cuando coinciden con `users` O `roles`
    - la coincidencia directa por nombre/etiqueta está desactivada de forma predeterminada; activa `channels.discord.dangerouslyAllowNameMatching: true` solo como modo de compatibilidad de emergencia
    - se admiten nombres/etiquetas para `users`, pero los IDs son más seguros; `openclaw security audit` advierte cuando se usan entradas de nombre/etiqueta
    - si un servidor tiene `channels` configurado, los canales no listados se deniegan
    - si un servidor no tiene un bloque `channels`, se permiten todos los canales de ese servidor en la lista de permitidos

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

    Si solo defines `DISCORD_BOT_TOKEN` y no creas un bloque `channels.discord`, el fallback en runtime es `groupPolicy="allowlist"` (con una advertencia en los registros), incluso si `channels.defaults.groupPolicy` es `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Los mensajes de servidor requieren mención de forma predeterminada.

    La detección de menciones incluye:

    - mención explícita del bot
    - patrones de mención configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de respuesta al bot en los casos admitidos

    Al escribir mensajes salientes de Discord, usa la sintaxis canónica de mención: `<@USER_ID>` para usuarios, `<#CHANNEL_ID>` para canales y `<@&ROLE_ID>` para roles. No uses la forma heredada de mención de apodo `<@!USER_ID>`.

    `requireMention` se configura por servidor/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` descarta opcionalmente mensajes que mencionan a otro usuario/rol pero no al bot (excluyendo @everyone/@here).

    Mensajes directos grupales:

    - predeterminado: ignorados (`dm.groupEnabled=false`)
    - lista de permitidos opcional mediante `dm.groupChannels` (IDs de canal o slugs)

  </Tab>
</Tabs>

### Enrutamiento de agentes basado en roles

Usa `bindings[].match.roles` para enrutar miembros de servidores de Discord a distintos agentes por ID de rol. Las vinculaciones basadas en roles solo aceptan IDs de rol y se evalúan después de las vinculaciones de par o par principal y antes de las vinculaciones solo de servidor. Si una vinculación también define otros campos de coincidencia (por ejemplo, `peer` + `guildId` + `roles`), todos los campos configurados deben coincidir.

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

## Comandos nativos y autenticación de comandos

- `commands.native` usa `"auto"` de forma predeterminada y está habilitado para Discord.
- Anulación por canal: `channels.discord.commands.native`.
- `commands.native=false` omite el registro y la limpieza de comandos slash de Discord durante el inicio. Los comandos registrados anteriormente pueden seguir visibles en Discord hasta que los elimines de la aplicación de Discord.
- La autenticación de comandos nativos usa las mismas listas de permitidos y políticas de Discord que el manejo normal de mensajes.
- Los comandos pueden seguir visibles en la interfaz de Discord para usuarios no autorizados; la ejecución sigue aplicando la autenticación de OpenClaw y devuelve "no autorizado".

Consulta [Comandos slash](/es/tools/slash-commands) para ver el catálogo y el comportamiento de los comandos.

Configuración predeterminada de comandos slash:

- `ephemeral: true`

## Detalles de funciones

<AccordionGroup>
  <Accordion title="Etiquetas de respuesta y respuestas nativas">
    Discord admite etiquetas de respuesta en la salida del agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controlado por `channels.discord.replyToMode`:

    - `off` (predeterminado)
    - `first`
    - `all`
    - `batched`

    Nota: `off` deshabilita el encadenamiento implícito de respuestas. Las etiquetas explícitas `[[reply_to_*]]` siguen respetándose.
    `first` siempre adjunta la referencia implícita de respuesta nativa al primer mensaje saliente de Discord del turno.
    `batched` solo adjunta la referencia implícita de respuesta nativa de Discord cuando el
    evento entrante fue un lote agrupado de varios mensajes con antirrebote. Esto es útil
    cuando quieres respuestas nativas principalmente para chats ambiguos con ráfagas, no para
    cada turno de un solo mensaje.

    Los IDs de mensaje se exponen en el contexto/historial para que los agentes puedan dirigirse a mensajes específicos.

  </Accordion>

  <Accordion title="Vistas previas de enlaces">
    Discord genera incrustaciones enriquecidas de enlaces para las URL de forma predeterminada. OpenClaw suprime esas incrustaciones generadas en los mensajes salientes de Discord de forma predeterminada, por lo que las URL enviadas por agentes permanecen como enlaces simples salvo que lo habilites explícitamente:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Define `channels.discord.accounts.<id>.suppressEmbeds` para anular una cuenta. Los envíos de la herramienta de mensajes del agente también pueden pasar `suppressEmbeds: false` para un solo mensaje. Las cargas útiles explícitas de Discord `embeds` no se suprimen con la configuración predeterminada de vista previa de enlaces.

  </Accordion>

  <Accordion title="Vista previa de transmisión en vivo">
    OpenClaw puede transmitir borradores de respuestas enviando un mensaje temporal y editándolo a medida que llega el texto. `channels.discord.streaming` acepta `off` | `partial` | `block` | `progress` (predeterminado). `progress` mantiene un borrador de estado editable y lo actualiza con el progreso de herramientas hasta la entrega final; la etiqueta inicial compartida es una línea móvil, por lo que se desplaza fuera de la vista como el resto cuando aparece suficiente trabajo. `streamMode` es un alias heredado del runtime. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida a la clave canónica.

    Define `channels.discord.streaming.mode` como `off` para deshabilitar las ediciones de vista previa de Discord. Si la transmisión por bloques de Discord está habilitada explícitamente, OpenClaw omite la transmisión de vista previa para evitar una doble transmisión.

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
    - `streaming.preview.toolProgress` (predeterminado `true`) controla si las actualizaciones de herramientas/progreso reutilizan el mensaje de vista previa.
    - Las filas de herramientas/progreso se representan como emoji compacto + título + detalle cuando están disponibles, por ejemplo `🛠️ Bash: run tests` o `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (predeterminado `false`) habilita texto de comentario/preámbulo del asistente en el borrador temporal de progreso. El comentario se limpia antes de mostrarse, permanece transitorio y no cambia la entrega de la respuesta final.
    - `streaming.progress.maxLineChars` controla el presupuesto de vista previa de progreso por línea. La prosa se acorta en límites de palabras; los detalles de comandos y rutas conservan sufijos útiles.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controla el detalle de comando/exec en líneas compactas de progreso: `raw` (predeterminado) o `status` (solo etiqueta de herramienta).

    Oculta el texto sin procesar de comando/exec mientras mantienes líneas compactas de progreso:

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

    La transmisión de vista previa es solo de texto; las respuestas con medios recurren a la entrega normal. Cuando la transmisión `block` está habilitada explícitamente, OpenClaw omite la transmisión de vista previa para evitar una doble transmisión.

  </Accordion>

  <Accordion title="Historial, contexto y comportamiento de hilos">
    Contexto de historial de servidor:

    - `channels.discord.historyLimit` predeterminado `20`
    - alternativa: `messages.groupChat.historyLimit`
    - `0` deshabilita

    Controles de historial de MD:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamiento de hilos:

    - Los hilos de Discord se enrutan como sesiones de canal y heredan la configuración del canal principal salvo que se anule.
    - Las sesiones de hilo heredan la selección `/model` de nivel de sesión del canal principal como alternativa solo de modelo; las selecciones `/model` locales del hilo siguen teniendo prioridad y el historial de transcripción principal no se copia salvo que la herencia de transcripción esté habilitada.
    - `channels.discord.thread.inheritParent` (predeterminado `false`) hace que los nuevos hilos automáticos se inicialicen desde la transcripción principal. Las anulaciones por cuenta se encuentran en `channels.discord.accounts.<id>.thread.inheritParent`.
    - Las reacciones de la herramienta de mensajes pueden resolver destinos de MD `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` se conserva durante la alternativa de activación en fase de respuesta.

    Los temas de canal se inyectan como contexto **no confiable**. Las listas de permitidos controlan quién puede activar el agente, no constituyen un límite completo de censura de contexto suplementario.

  </Accordion>

  <Accordion title="Sesiones ligadas a hilos para subagentes">
    Discord puede vincular un hilo a un destino de sesión para que los mensajes posteriores en ese hilo sigan enrutándose a la misma sesión (incluidas sesiones de subagentes).

    Comandos:

    - `/focus <target>` vincula el hilo actual/nuevo a un destino de subagente/sesión
    - `/unfocus` elimina la vinculación del hilo actual
    - `/agents` muestra ejecuciones activas y el estado de vinculación
    - `/session idle <duration|off>` inspecciona/actualiza el desenfoque automático por inactividad para vinculaciones enfocadas
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

    - `session.threadBindings.*` define los valores predeterminados globales.
    - `channels.discord.threadBindings.*` anula el comportamiento de Discord.
    - `spawnSessions` controla la creación/vinculación automática de hilos para `sessions_spawn({ thread: true })` y generaciones de hilos ACP. Valor predeterminado: `true`.
    - `defaultSpawnContext` controla el contexto de subagente nativo para generaciones ligadas a hilos. Valor predeterminado: `"fork"`.
    - Las claves obsoletas `spawnSubagentSessions`/`spawnAcpSessions` se migran mediante `openclaw doctor --fix`.
    - Si las vinculaciones de hilos están deshabilitadas para una cuenta, `/focus` y las operaciones relacionadas de vinculación de hilos no están disponibles.

    Consulta [Subagentes](/es/tools/subagents), [Agentes ACP](/es/tools/acp-agents) y [Referencia de configuración](/es/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Vinculaciones persistentes de canales ACP">
    Para espacios de trabajo ACP estables "siempre activos", configura vinculaciones ACP tipadas de nivel superior dirigidas a conversaciones de Discord.

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

    - `/acp spawn codex --bind here` vincula el canal o hilo actual en el lugar y mantiene los mensajes futuros en la misma sesión ACP. Los mensajes de hilo heredan la vinculación del canal principal.
    - En un canal o hilo vinculado, `/new` y `/reset` restablecen la misma sesión ACP en el lugar. Las vinculaciones temporales de hilos pueden anular la resolución del destino mientras estén activas.
    - `spawnSessions` controla la creación/vinculación de hilos secundarios mediante `--thread auto|here`.

    Consulta [Agentes ACP](/es/tools/acp-agents) para obtener detalles del comportamiento de vinculación.

  </Accordion>

  <Accordion title="Notificaciones de reacciones">
    Modo de notificación de reacciones por servidor:

    - `off`
    - `own` (predeterminado)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Los eventos de reacción se convierten en eventos del sistema y se adjuntan a la sesión de Discord enrutada.

  </Accordion>

  <Accordion title="Reacciones de confirmación">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - alternativa de emoji de identidad del agente (`agents.list[].identity.emoji`, si no "👀")

    Notas:

    - Discord acepta emoji Unicode o nombres de emoji personalizados.
    - Usa `""` para deshabilitar la reacción en un canal o una cuenta.

  </Accordion>

  <Accordion title="Escrituras de configuración">
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

  <Accordion title="Proxy de Gateway">
    Enruta el tráfico WebSocket de Gateway de Discord y las búsquedas REST de inicio (ID de aplicación + resolución de lista de permitidos) a través de un proxy HTTP(S) con `channels.discord.proxy`.

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
    Habilita la resolución de PluralKit para asignar mensajes proxificados a la identidad de miembro del sistema:

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
    - los nombres para mostrar de miembros se comparan por nombre/slug solo cuando `channels.discord.dangerouslyAllowNameMatching: true`
    - las búsquedas usan el ID del mensaje original y están restringidas por una ventana de tiempo
    - si la búsqueda falla, los mensajes enviados mediante proxy se tratan como mensajes de bot y se descartan salvo que `allowBots=true`

  </Accordion>

  <Accordion title="Alias de menciones salientes">
    Usa `mentionAliases` cuando los agentes necesiten menciones salientes deterministas para usuarios conocidos de Discord. Las claves son identificadores sin la `@` inicial; los valores son IDs de usuario de Discord. Los identificadores desconocidos, `@everyone`, `@here` y las menciones dentro de intervalos de código de Markdown se dejan sin cambios.

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
    Las actualizaciones de presencia se aplican cuando estableces un campo de estado o actividad, o cuando habilitas la presencia automática.

    Ejemplo de solo estado:

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
    - 1: Transmitiendo (requiere `activityUrl`)
    - 2: Escuchando
    - 3: Viendo
    - 4: Personalizada (usa el texto de actividad como estado; el emoji es opcional)
    - 5: Compitiendo

    Ejemplo de presencia automática (señal de salud del runtime):

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

    La presencia automática asigna la disponibilidad del runtime al estado de Discord: saludable => en línea, degradado o desconocido => inactivo, agotado o no disponible => dnd. Sobrescrituras de texto opcionales:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (admite el marcador de posición `{reason}`)

  </Accordion>

  <Accordion title="Aprobaciones en Discord">
    Discord admite la gestión de aprobaciones mediante botones en mensajes directos y, opcionalmente, puede publicar solicitudes de aprobación en el canal de origen.

    Ruta de configuración:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando es posible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord habilita automáticamente las aprobaciones nativas de ejecución cuando `enabled` no está definido o es `"auto"` y se puede resolver al menos un aprobador, ya sea desde `execApprovals.approvers` o desde `commands.ownerAllowFrom`. Discord no infiere aprobadores de ejecución desde `allowFrom` del canal, `dm.allowFrom` heredado ni `defaultTo` de mensajes directos. Establece `enabled: false` para deshabilitar Discord explícitamente como cliente de aprobación nativo.

    Para comandos de grupo confidenciales solo para propietarios, como `/diagnostics` y `/export-trajectory`, OpenClaw envía solicitudes de aprobación y resultados finales en privado. Primero intenta un mensaje directo de Discord cuando el propietario que invoca tiene una ruta de propietario de Discord; si no está disponible, recurre a la primera ruta de propietario disponible de `commands.ownerAllowFrom`, como Telegram.

    Cuando `target` es `channel` o `both`, la solicitud de aprobación es visible en el canal. Solo los aprobadores resueltos pueden usar los botones; otros usuarios reciben una denegación efímera. Las solicitudes de aprobación incluyen el texto del comando, por lo que solo debes habilitar la entrega en canal en canales de confianza. Si el ID del canal no puede derivarse de la clave de sesión, OpenClaw recurre a la entrega por mensaje directo.

    Discord también renderiza los botones de aprobación compartidos usados por otros canales de chat. El adaptador nativo de Discord principalmente agrega enrutamiento de mensajes directos a aprobadores y distribución a canales.
    Cuando esos botones están presentes, son la UX principal de aprobación; OpenClaw
    solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique
    que las aprobaciones por chat no están disponibles o que la aprobación manual es la única ruta.
    Si el runtime de aprobación nativa de Discord no está activo, OpenClaw mantiene visible la
    solicitud determinista local `/approve <id> <decision>`. Si el
    runtime está activo pero no se puede entregar una tarjeta nativa a ningún destino,
    OpenClaw envía un aviso de reserva en el mismo chat con el comando `/approve`
    exacto de la aprobación pendiente.

    La autenticación del Gateway y la resolución de aprobaciones siguen el contrato compartido del cliente Gateway (los IDs `plugin:` se resuelven mediante `plugin.approval.resolve`; otros IDs mediante `exec.approval.resolve`). Las aprobaciones caducan después de 30 minutos de forma predeterminada.

    Consulta [Aprobaciones de ejecución](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Herramientas y controles de acción

Las acciones de mensaje de Discord incluyen mensajería, administración de canales, moderación, presencia y acciones de metadatos.

Ejemplos principales:

- mensajería: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reacciones: `react`, `reactions`, `emojiList`
- moderación: `timeout`, `kick`, `ban`
- presencia: `setPresence`

La acción `event-create` acepta un parámetro opcional `image` (URL o ruta de archivo local) para establecer la imagen de portada del evento programado.

Los controles de acción viven en `channels.discord.actions.*`.

Comportamiento predeterminado de los controles:

| Grupo de acciones                                                                                                                                                        | Predeterminado |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| reacciones, mensajes, hilos, fijados, encuestas, búsqueda, información de miembros, información de roles, información de canales, canales, estado de voz, eventos, stickers, cargas de emoji, cargas de stickers, permisos | habilitado     |
| roles                                                                                                                                                                    | deshabilitado  |
| moderación                                                                                                                                                               | deshabilitado  |
| presencia                                                                                                                                                                | deshabilitado  |

## UI de componentes v2

OpenClaw usa componentes v2 de Discord para aprobaciones de ejecución y marcadores entre contextos. Las acciones de mensaje de Discord también pueden aceptar `components` para UI personalizada (avanzado; requiere construir una carga útil de componente mediante la herramienta de Discord), mientras que los `embeds` heredados siguen disponibles, pero no se recomiendan.

- `channels.discord.ui.components.accentColor` establece el color de acento usado por los contenedores de componentes de Discord (hex).
- Establécelo por cuenta con `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` controla cuánto tiempo permanecen registrados los callbacks de componentes enviados de Discord (predeterminado `1800000`, máximo `86400000`). Establécelo por cuenta con `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` se ignoran cuando los componentes v2 están presentes.
- Las vistas previas de URL simples se suprimen de forma predeterminada. Establece `suppressEmbeds: false` en una acción de mensaje cuando un único enlace saliente deba expandirse.

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

Discord tiene dos superficies de voz distintas: **canales de voz** en tiempo real (conversaciones continuas) y **adjuntos de mensaje de voz** (el formato de vista previa de forma de onda). El gateway admite ambas.

### Canales de voz

Lista de verificación de configuración:

1. Habilita Message Content Intent en el Discord Developer Portal.
2. Habilita Server Members Intent cuando se usen listas de permitidos de roles/usuarios.
3. Invita al bot con los ámbitos `bot` y `applications.commands`.
4. Concede Connect, Speak, Send Messages y Read Message History en el canal de voz de destino.
5. Habilita los comandos nativos (`commands.native` o `channels.discord.commands.native`).
6. Configura `channels.discord.voice`.

Usa `/vc join|leave|status` para controlar sesiones. El comando usa el agente predeterminado de la cuenta y sigue las mismas reglas de lista de permitidos y política de grupo que otros comandos de Discord.

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

- `voice.tts` anula `messages.tts` solo para la reproducción de voz `stt-tts`. Los modos realtime usan `voice.realtime.speakerVoice`.
- `voice.mode` controla la ruta de conversación. El valor predeterminado es `agent-proxy`: un front end de voz realtime gestiona la temporización de turnos, la interrupción y la reproducción, delega el trabajo sustantivo al agente OpenClaw enrutado mediante `openclaw_agent_consult` y trata el resultado como un prompt de Discord escrito por ese hablante. `stt-tts` conserva el flujo por lotes anterior de STT más TTS. `bidi` permite que el modelo realtime converse directamente mientras expone `openclaw_agent_consult` para el cerebro de OpenClaw.
- `voice.agentSession` controla qué conversación de OpenClaw recibe los turnos de voz. Déjalo sin definir para usar la sesión propia del canal de voz, o define `{ mode: "target", target: "channel:<text-channel-id>" }` para hacer que el canal de voz actúe como extensión de micrófono/altavoz de una sesión existente de canal de texto de Discord, como `#maintainers`.
- `voice.model` anula el cerebro del agente OpenClaw para las respuestas de voz de Discord y las consultas realtime. Déjalo sin definir para heredar el modelo del agente enrutado. Es independiente de `voice.realtime.model`.
- `voice.followUsers` permite que el bot se una, se mueva y salga de voz de Discord con usuarios seleccionados. Consulta [Seguir usuarios en voz](#follow-users-in-voice) para ver reglas de comportamiento y ejemplos.
- `agent-proxy` enruta el habla mediante `discord-voice`, que conserva la autorización normal de propietario/herramientas para el hablante y la sesión de destino, pero oculta la herramienta `tts` del agente porque la voz de Discord es propietaria de la reproducción. De forma predeterminada, `agent-proxy` otorga a la consulta acceso completo a herramientas equivalente al propietario para hablantes propietarios (`voice.realtime.toolPolicy: "owner"`) y prefiere firmemente consultar al agente OpenClaw antes de dar respuestas sustantivas (`voice.realtime.consultPolicy: "always"`). En ese modo predeterminado `always`, la capa realtime no pronuncia automáticamente relleno antes de la respuesta de la consulta; captura y transcribe el habla, y luego pronuncia la respuesta de OpenClaw enrutada. Si varias respuestas de consulta forzadas terminan mientras Discord todavía reproduce la primera respuesta, las respuestas posteriores de habla exacta se ponen en cola hasta que la reproducción queda inactiva, en lugar de reemplazar el habla a mitad de frase.
- En modo `stt-tts`, STT usa `tools.media.audio`; `voice.model` no afecta la transcripción.
- En modos realtime, `voice.realtime.provider`, `voice.realtime.model` y `voice.realtime.speakerVoice` configuran la sesión de audio realtime. Para OpenAI Realtime 2 más el cerebro Codex, usa `voice.realtime.model: "gpt-realtime-2"` y `voice.model: "openai/gpt-5.5"`.
- Los modos de voz realtime incluyen pequeños archivos de perfil `IDENTITY.md`, `USER.md` y `SOUL.md` en las instrucciones del proveedor realtime de forma predeterminada para que los turnos directos rápidos mantengan la misma identidad, base de usuario y persona que el agente OpenClaw enrutado. Define `voice.realtime.bootstrapContextFiles` en un subconjunto para personalizar esto, o `[]` para deshabilitarlo. Los archivos bootstrap realtime admitidos se limitan a esos archivos de perfil; `AGENTS.md` permanece en el contexto normal del agente. El contexto de perfil inyectado no reemplaza `openclaw_agent_consult` para trabajo en el workspace, hechos actuales, búsqueda en memoria ni acciones respaldadas por herramientas.
- En el modo realtime `agent-proxy` de OpenAI, define `voice.realtime.requireWakeName: true` para mantener la voz realtime de Discord en silencio hasta que una transcripción empiece o termine con un nombre de activación. Los nombres de activación configurados deben tener una o dos palabras. Si `voice.realtime.wakeNames` no está definido, OpenClaw usa el `name` del agente enrutado más `OpenClaw`, con fallback al id del agente más `OpenClaw`. La compuerta por nombre de activación deshabilita la respuesta automática del proveedor realtime, enruta los turnos aceptados por la ruta de consulta del agente OpenClaw y da un breve acuse hablado cuando se reconoce un nombre de activación inicial a partir de la transcripción parcial antes de que llegue la transcripción final.
- El proveedor realtime de OpenAI acepta los nombres actuales de eventos de Realtime 2 y alias heredados compatibles con Codex para eventos de audio de salida y transcripción, de modo que las instantáneas compatibles del proveedor pueden desviarse sin perder el audio del asistente.
- `voice.realtime.bargeIn` controla si los eventos de inicio de hablante de Discord interrumpen la reproducción realtime activa. Si no se define, sigue la configuración de interrupción de audio de entrada del proveedor realtime.
- `voice.realtime.minBargeInAudioEndMs` controla la duración mínima de reproducción del asistente antes de que una interrupción de OpenAI realtime trunque el audio. Valor predeterminado: `250`. Define `0` para interrupción inmediata en salas con poco eco, o auméntalo para configuraciones de altavoces con mucho eco.
- Para una voz de OpenAI en reproducción de Discord, define `voice.tts.provider: "openai"` y elige una voz de texto a voz en `voice.tts.providers.openai.speakerVoice`. `cedar` es una buena opción con sonido masculino en el modelo TTS actual de OpenAI.
- Las anulaciones `systemPrompt` de Discord por canal se aplican a los turnos de transcripción de voz para ese canal de voz.
- Los turnos de transcripción de voz derivan el estado de propietario de `allowFrom` de Discord (o `dm.allowFrom`) para comandos con compuerta de propietario y acciones de canal. La visibilidad de herramientas del agente sigue la política de herramientas configurada para la sesión enrutada.
- La voz de Discord es opcional para configuraciones solo de texto; define `channels.discord.voice.enabled=true` (o conserva un bloque `channels.discord.voice` existente) para habilitar los comandos `/vc`, el runtime de voz y el intent de Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` puede anular explícitamente la suscripción al intent de estado de voz. Déjalo sin definir para que el intent siga la habilitación efectiva de voz.
- Si `voice.autoJoin` tiene varias entradas para el mismo servidor, OpenClaw se une al último canal configurado para ese servidor.
- `voice.allowedChannels` es una allowlist de residencia opcional. Déjalo sin definir para permitir `/vc join` en cualquier canal de voz de Discord autorizado. Cuando está definido, `/vc join`, la unión automática al inicio y los movimientos de estado de voz del bot se restringen a las entradas `{ guildId, channelId }` indicadas. Defínelo como un array vacío para denegar todas las uniones de voz de Discord. Si Discord mueve el bot fuera de la allowlist, OpenClaw sale de ese canal y vuelve a unirse al destino de auto-join configurado cuando haya uno disponible.
- `voice.daveEncryption` y `voice.decryptionFailureTolerance` se pasan a las opciones de unión de `@discordjs/voice`.
- Los valores predeterminados de `@discordjs/voice` son `daveEncryption=true` y `decryptionFailureTolerance=24` si no se definen.
- OpenClaw usa el codec incluido `libopus-wasm` para recepción de voz de Discord y reproducción PCM sin procesar realtime. Incluye una compilación WebAssembly fijada de libopus y no requiere complementos nativos de opus.
- `voice.connectTimeoutMs` controla la espera inicial de Ready de `@discordjs/voice` para intentos de `/vc join` y auto-join. Valor predeterminado: `30000`.
- `voice.reconnectGraceMs` controla cuánto tiempo espera OpenClaw a que una sesión de voz desconectada empiece a reconectarse antes de destruirla. Valor predeterminado: `15000`.
- En modo `stt-tts`, la reproducción de voz no se detiene solo porque otro usuario empiece a hablar. Para evitar bucles de realimentación, OpenClaw ignora la nueva captura de voz mientras TTS está reproduciendo; habla después de que termine la reproducción para el siguiente turno. Los modos realtime reenvían los inicios de hablante como señales de interrupción al proveedor realtime.
- En modos realtime, el eco de altavoces hacia un micrófono abierto puede parecer una interrupción y cortar la reproducción. Para salas de Discord con mucho eco, define `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` para impedir que OpenAI interrumpa automáticamente ante audio de entrada. Añade `voice.realtime.bargeIn: true` si aún quieres que los eventos de inicio de hablante de Discord interrumpan la reproducción activa. El puente realtime de OpenAI ignora truncamientos de reproducción más cortos que `voice.realtime.minBargeInAudioEndMs` como probable eco/ruido y los registra como omitidos en lugar de borrar la reproducción de Discord.
- `voice.captureSilenceGraceMs` controla cuánto tiempo espera OpenClaw después de que Discord informa que un hablante se detuvo antes de finalizar ese segmento de audio para STT. Valor predeterminado: `2000`; auméntalo si Discord divide pausas normales en transcripciones parciales entrecortadas.
- Cuando ElevenLabs es el proveedor TTS seleccionado, la reproducción de voz de Discord usa TTS en streaming y empieza desde el stream de respuesta del proveedor. Los proveedores sin soporte de streaming hacen fallback a la ruta de archivo temporal sintetizado.
- OpenClaw también vigila los fallos de descifrado de recepción y se recupera automáticamente saliendo y volviendo a unirse al canal de voz después de fallos repetidos en una ventana corta.
- Si los registros de recepción muestran repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` después de actualizar, recopila un informe de dependencias y registros. La línea incluida de `@discordjs/voice` contiene la corrección upstream de padding del PR #11449 de discord.js, que cerró el issue #11419 de discord.js.
- Los eventos de recepción `The operation was aborted` son esperados cuando OpenClaw finaliza un segmento de hablante capturado; son diagnósticos detallados, no advertencias.
- Los registros detallados de voz de Discord incluyen una vista previa limitada a una línea de la transcripción STT por cada segmento de hablante aceptado, de modo que la depuración muestra tanto el lado del usuario como el lado de respuesta del agente sin volcar texto de transcripción ilimitado.
- En modo `agent-proxy`, el fallback de consulta forzada omite fragmentos de transcripción probablemente incompletos, como texto que termina en `...` o un conector final como `and`, además de cierres obviamente no accionables como “vuelvo enseguida” o “adiós”. Los registros muestran `forced agent consult skipped reason=...` cuando esto evita una respuesta antigua en cola.

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

- `followUsers` acepta IDs de usuario de Discord sin procesar y valores `discord:<id>`. OpenClaw normaliza ambas formas antes de compararlas con eventos de estado de voz.
- `followUsersEnabled` tiene como valor predeterminado `true` cuando `followUsers` está configurado. Defínelo en `false` para conservar la lista guardada pero detener el seguimiento automático de voz.
- Cuando un usuario seguido se une a un canal de voz permitido, OpenClaw se une a ese canal. Cuando el usuario se mueve, OpenClaw se mueve con él. Cuando el usuario seguido activo se desconecta, OpenClaw sale.
- Si varios usuarios seguidos están en el mismo servidor y el usuario seguido activo sale, OpenClaw se mueve al canal de otro usuario seguido rastreado antes de salir del servidor. Si varios usuarios seguidos se mueven a la vez, gana el último evento de estado de voz observado.
- `allowedChannels` sigue aplicándose. Un usuario seguido en un canal no permitido se ignora, y una sesión propiedad de seguimiento se mueve a otro usuario seguido o sale.
- OpenClaw reconcilia eventos de estado de voz perdidos al inicio y a un intervalo limitado. La reconciliación toma muestras de servidores configurados y limita las consultas REST por ejecución, por lo que listas `followUsers` muy grandes pueden necesitar más de un intervalo para converger.
- Si Discord o un administrador mueve el bot mientras está siguiendo a un usuario, OpenClaw reconstruye la sesión de voz y conserva la propiedad de seguimiento cuando el destino está permitido. Si el bot se mueve fuera de `allowedChannels`, OpenClaw sale y vuelve a unirse al destino configurado cuando existe.
- La recuperación de recepción DAVE puede salir y volver a unirse al mismo canal después de fallos de descifrado repetidos. Las sesiones propiedad de seguimiento conservan su propiedad de seguimiento durante esa ruta de recuperación, por lo que una desconexión posterior del usuario seguido todavía abandona el canal.

Elige entre los modos de unión:

- Usa `followUsers` para configuraciones personales o de operador donde el bot debería estar automáticamente en voz cuando tú lo estés.
- Usa `autoJoin` para bots de sala fija que deben estar presentes incluso cuando ningún usuario rastreado esté en voz.
- Usa `/vc join` para uniones puntuales o salas donde la presencia automática de voz sería inesperada.

Codec de voz de Discord:

- Los registros de recepción de voz muestran `discord voice: opus decoder: libopus-wasm`.
- La reproducción en tiempo real codifica PCM estéreo sin procesar de 48 kHz a Opus con el mismo paquete incluido `libopus-wasm` antes de entregar los paquetes a `@discordjs/voice`.
- La reproducción de archivos y flujos de proveedores transcodifica a PCM estéreo sin procesar de 48 kHz con ffmpeg y luego usa `libopus-wasm` para el flujo de paquetes Opus enviado a Discord.

Pipeline de STT más TTS:

- La captura PCM de Discord se convierte en un archivo temporal WAV.
- `tools.media.audio` gestiona STT, por ejemplo `openai/gpt-4o-mini-transcribe`.
- La transcripción se envía a través de la entrada y el enrutamiento de Discord mientras el LLM de respuesta se ejecuta con una política de salida de voz que oculta la herramienta `tts` del agente y solicita texto devuelto, porque la voz de Discord controla la reproducción final de TTS.
- `voice.model`, cuando está configurado, sobrescribe solo el LLM de respuesta para este turno de canal de voz.
- `voice.tts` se fusiona sobre `messages.tts`; los proveedores compatibles con streaming alimentan el reproductor directamente; de lo contrario, el archivo de audio resultante se reproduce en el canal unido.

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

Sin un bloque `voice.agentSession`, cada canal de voz obtiene su propia sesión enrutada de OpenClaw. Por ejemplo, `/vc join channel:234567890123456789` habla con la sesión de ese canal de voz de Discord. El modelo en tiempo real es solo la interfaz de voz; las solicitudes sustantivas se entregan al agente de OpenClaw configurado. Si el modelo en tiempo real produce una transcripción final sin llamar a la herramienta de consulta, OpenClaw fuerza la consulta como alternativa para que el valor predeterminado siga comportándose como hablar con el agente.

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

En modo `agent-proxy`, el bot se une al canal de voz configurado, pero los turnos del agente de OpenClaw usan la sesión enrutada y el agente normales del canal de destino. La sesión de voz en tiempo real pronuncia el resultado devuelto en el canal de voz. El agente supervisor aún puede usar herramientas de mensaje normales según su política de herramientas, incluido enviar un mensaje separado de Discord si esa es la acción correcta.

Mientras una ejecución delegada de OpenClaw está activa, las nuevas transcripciones de voz de Discord se tratan como control de ejecución en vivo antes de iniciar otro turno del agente. Frases como “estado”, “cancela eso”, “usa la corrección más pequeña” o “cuando termines revisa también las pruebas” se clasifican como estado, cancelación, dirección o entrada de seguimiento para la sesión activa. Los resultados de estado, cancelación, dirección aceptada y seguimiento se pronuncian en el canal de voz para que quien llama sepa si OpenClaw gestionó la solicitud.

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

Usa esto cuando el modelo escucha su propia reproducción de Discord a través de un micrófono abierto, pero aun así quieres interrumpirlo hablando. OpenClaw evita que OpenAI interrumpa automáticamente con audio de entrada sin procesar, mientras que `bargeIn: true` permite que los eventos de inicio de hablante de Discord y el audio de hablante ya activo cancelen respuestas en tiempo real activas antes de que el siguiente turno capturado llegue a OpenAI. Las señales de interrupción muy tempranas con `audioEndMs` por debajo de `minBargeInAudioEndMs` se tratan como probable eco/ruido y se ignoran para que el modelo no se corte en el primer fotograma de reproducción.

Registros de voz esperados:

- Al unirse: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Al iniciar en tiempo real: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- En audio de hablante: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` y `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- En habla obsoleta omitida: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` o `reason=non-actionable-closing ...`
- Al completar la respuesta en tiempo real: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Al detener/restablecer reproducción: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- En consulta en tiempo real: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- En respuesta del agente: `discord voice: agent turn answer ...`
- En habla exacta en cola: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, seguido de `discord voice: realtime exact speech dequeued reason=player-idle ...`
- En detección de interrupción: `discord voice: realtime barge-in detected source=speaker-start ...` o `discord voice: realtime barge-in detected source=active-speaker-audio ...`, seguido de `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- En interrupción en tiempo real: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, seguido de `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` o `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- En eco/ruido ignorado: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- En interrupción deshabilitada: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- En reproducción inactiva: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Para depurar audio cortado, lee los registros de voz en tiempo real como una línea de tiempo:

1. `realtime audio playback started` significa que Discord ha empezado a reproducir audio del asistente. El puente empieza a contar fragmentos de salida del asistente, bytes PCM de Discord, bytes en tiempo real del proveedor y duración de audio sintetizado desde este punto.
2. `realtime speaker turn opened` marca que un hablante de Discord pasa a estar activo. Si la reproducción ya está activa y `bargeIn` está habilitado, esto puede ir seguido de `barge-in detected source=speaker-start`.
3. `realtime input audio started` marca el primer fotograma de audio real recibido para ese turno de hablante. `outputActive=true` o un `outputAudioMs` distinto de cero aquí significa que el micrófono está enviando entrada mientras la reproducción del asistente sigue activa.
4. `barge-in detected source=active-speaker-audio` significa que OpenClaw vio audio de hablante en vivo mientras la reproducción del asistente estaba activa. Esto es útil para distinguir una interrupción real de un evento de inicio de hablante de Discord sin audio útil.
5. `barge-in requested reason=...` significa que OpenClaw pidió al proveedor en tiempo real que cancelara o truncara la respuesta activa. Incluye `outputAudioMs`, `outputActive` y `playbackChunks` para que puedas ver cuánto audio del asistente se había reproducido realmente antes de la interrupción.
6. `realtime audio playback stopped reason=...` es el punto local de restablecimiento de reproducción de Discord. El motivo indica quién detuvo la reproducción: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` o `session-close`.
7. `realtime speaker turn closed` resume el turno de entrada capturado. `chunks=0` o `hasAudio=false` significa que el turno de hablante se abrió, pero no llegó audio usable al puente en tiempo real. `interruptedPlayback=true` significa que ese turno de entrada se solapó con la salida del asistente y activó la lógica de interrupción.

Campos útiles:

- `outputAudioMs`: duración del audio del asistente generado por el proveedor en tiempo real antes de la línea de registro.
- `audioMs`: duración del audio del asistente que OpenClaw contó antes de que se detuviera la reproducción.
- `elapsedMs`: tiempo de reloj entre abrir y cerrar el flujo de reproducción o el turno de hablante.
- `discordBytes`: bytes PCM estéreo de 48 kHz enviados a la voz de Discord o recibidos desde ella.
- `realtimeBytes`: bytes PCM en formato del proveedor enviados al proveedor en tiempo real o recibidos desde él.
- `playbackChunks`: fragmentos de audio del asistente reenviados a Discord para la respuesta activa.
- `sinceLastAudioMs`: intervalo entre el último fotograma de audio de hablante capturado y el cierre del turno de hablante.

Patrones comunes:

- Un corte inmediato con `source=active-speaker-audio`, `outputAudioMs` pequeño y el mismo usuario cerca suele indicar que el eco del altavoz entra en el micrófono. Aumenta `voice.realtime.minBargeInAudioEndMs`, baja el volumen del altavoz, usa auriculares o configura `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` seguido de `speaker turn closed ... hasAudio=false` significa que Discord notificó un inicio de hablante, pero no llegó audio a OpenClaw. Puede ser un evento transitorio de voz de Discord, comportamiento de puerta de ruido o que un cliente activara brevemente el micrófono.
- `audio playback stopped reason=stream-close` sin una interrupción cercana ni `provider-clear-audio` significa que el flujo local de reproducción de Discord terminó inesperadamente. Revisa los registros anteriores del proveedor y del reproductor de Discord.
- `capture ignored during playback (barge-in disabled)` significa que OpenClaw descartó intencionadamente la entrada mientras el audio del asistente estaba activo. Habilita `voice.realtime.bargeIn` si quieres que el habla interrumpa la reproducción.
- `barge-in ignored ... outputActive=false` significa que Discord o el VAD del proveedor notificó habla, pero OpenClaw no tenía reproducción activa que interrumpir. Esto no debería cortar el audio.

Las credenciales se resuelven por componente: autenticación de ruta LLM para `voice.model`, autenticación STT para `tools.media.audio`, autenticación TTS para `messages.tts`/`voice.tts` y autenticación del proveedor en tiempo real para `voice.realtime.providers` o la configuración de autenticación normal del proveedor.

### Mensajes de voz

Los mensajes de voz de Discord muestran una vista previa de forma de onda y requieren audio OGG/Opus. OpenClaw genera la forma de onda automáticamente, pero necesita `ffmpeg` y `ffprobe` en el host del Gateway para inspeccionar y convertir.

- Proporciona una **ruta de archivo local** (las URL se rechazan).
- Omite el contenido de texto (Discord rechaza texto + mensaje de voz en la misma carga útil).
- Se acepta cualquier formato de audio; OpenClaw lo convierte a OGG/Opus según sea necesario.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - habilita Message Content Intent
    - habilita Server Members Intent cuando dependas de la resolución de usuarios/miembros
    - reinicia Gateway después de cambiar los intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - verifica `groupPolicy`
    - verifica la lista de permitidos de guilds en `channels.discord.guilds`
    - si existe el mapa `channels` del guild, solo se permiten los canales listados
    - verifica el comportamiento de `requireMention` y los patrones de menciones

    Comprobaciones útiles:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Causas comunes:

    - `groupPolicy="allowlist"` sin una lista de permitidos de guild/canal coincidente
    - `requireMention` configurado en el lugar incorrecto (debe estar bajo `channels.discord.guilds` o en la entrada del canal)
    - remitente bloqueado por la lista de permitidos `users` del guild/canal

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Registros típicos:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Controles de la cola del Gateway de Discord:

    - cuenta única: `channels.discord.eventQueue.listenerTimeout`
    - varias cuentas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - esto solo controla el trabajo del listener del Gateway de Discord, no la duración del turno del agente

    Discord no aplica un tiempo de espera propio del canal a los turnos de agente en cola. Los listeners de mensajes delegan de inmediato, y las ejecuciones de Discord en cola conservan el orden por sesión hasta que el ciclo de vida de la sesión/herramienta/runtime completa o aborta el trabajo.

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw obtiene los metadatos de Discord `/gateway/bot` antes de conectarse. Los fallos transitorios recurren a la URL de Gateway predeterminada de Discord y se limitan por tasa en los registros.

    Controles de tiempo de espera de metadatos:

    - cuenta única: `channels.discord.gatewayInfoTimeoutMs`
    - varias cuentas: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - alternativa de entorno cuando la configuración no está definida: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - predeterminado: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw espera el evento `READY` del Gateway de Discord durante el inicio y después de reconexiones del runtime. Las configuraciones con varias cuentas y escalonamiento de inicio pueden necesitar una ventana READY de inicio más larga que la predeterminada.

    Controles de tiempo de espera READY:

    - inicio con cuenta única: `channels.discord.gatewayReadyTimeoutMs`
    - inicio con varias cuentas: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - alternativa de entorno de inicio cuando la configuración no está definida: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - predeterminado de inicio: `15000` (15 segundos), máximo: `120000`
    - runtime con cuenta única: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime con varias cuentas: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - alternativa de entorno de runtime cuando la configuración no está definida: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - predeterminado de runtime: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Las comprobaciones de permisos de `channels status --probe` solo funcionan con IDs de canal numéricos.

    Si usas claves slug, la coincidencia en runtime puede seguir funcionando, pero la sonda no puede verificar completamente los permisos.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM deshabilitados: `channels.discord.dm.enabled=false`
    - política de DM deshabilitada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - esperando aprobación de emparejamiento en modo `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    De forma predeterminada, los mensajes escritos por bots se ignoran.

    Si configuras `channels.discord.allowBots=true`, usa reglas estrictas de mención y listas de permitidos para evitar comportamiento de bucle.
    Prefiere `channels.discord.allowBots="mentions"` para aceptar solo mensajes de bots que mencionen al bot.

    OpenClaw también incluye [protección contra bucles de bots](/es/channels/bot-loop-protection) compartida. Siempre que `allowBots` permite que mensajes escritos por bots lleguen al despacho, Discord asigna el evento entrante a datos de `(account, channel, bot pair)` y el guard genérico de pares suprime el par después de que supera el presupuesto de eventos configurado. El guard evita bucles descontrolados de dos bots que antes tenían que detenerse mediante los límites de tasa de Discord; no afecta a implementaciones de un solo bot ni a respuestas puntuales de bots que se mantienen por debajo del presupuesto.

    Configuración predeterminada (activa cuando `allowBots` está definido):

    - `maxEventsPerWindow: 20` -- el par de bots puede intercambiar 20 mensajes dentro de la ventana deslizante
    - `windowSeconds: 60` -- duración de la ventana deslizante
    - `cooldownSeconds: 60` -- una vez que se dispara el presupuesto, cada mensaje bot-a-bot adicional en cualquier dirección se descarta durante un minuto

    Configura el valor predeterminado compartido una vez en `channels.defaults.botLoopProtection`, luego sobrescribe Discord cuando un flujo de trabajo legítimo necesite más margen. La precedencia es:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - valores predeterminados integrados

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - mantén OpenClaw actualizado (`openclaw update`) para que esté presente la lógica de recuperación de recepción de voz de Discord
    - confirma `channels.discord.voice.daveEncryption=true` (predeterminado)
    - empieza con `channels.discord.voice.decryptionFailureTolerance=24` (valor predeterminado upstream) y ajusta solo si es necesario
    - observa los registros para:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si los fallos continúan después de la reconexión automática, recopila registros y compáralos con el historial de recepción DAVE upstream en [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) y [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referencia de configuración

Referencia principal: [Referencia de configuración - Discord](/es/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- inicio/autenticación: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- cola de eventos: `eventQueue.listenerTimeout` (presupuesto del listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- respuesta/historial: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legado: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medios/reintento: `mediaMaxMb` (limita las cargas salientes de Discord, predeterminado `100MB`), `retry`
- acciones: `actions.*`
- presencia: `activity`, `status`, `activityType`, `activityUrl`
- IU: `ui.components.accentColor`
- funciones: `threadBindings`, `bindings[]` de nivel superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Seguridad y operaciones

- Trata los tokens de bot como secretos (se prefiere `DISCORD_BOT_TOKEN` en entornos supervisados).
- Concede permisos de Discord con el menor privilegio.
- Si el despliegue/estado de comandos está obsoleto, reinicia Gateway y vuelve a comprobar con `openclaw channels status --probe`.

## Relacionado

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Discord con el Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/es/channels/groups">
    Comportamiento de chat grupal y listas de permitidos.
  </Card>
  <Card title="Channel routing" icon="route" href="/es/channels/channel-routing">
    Enruta mensajes entrantes a agentes.
  </Card>
  <Card title="Security" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y endurecimiento.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/es/concepts/multi-agent">
    Asigna guilds y canales a agentes.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de comandos nativos.
  </Card>
</CardGroup>
