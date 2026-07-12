---
read_when:
    - Trabajo en las funciones del canal de Discord
summary: Configuración del bot de Discord, claves de configuración, componentes, voz y solución de problemas
title: Discord
x-i18n:
    generated_at: "2026-07-11T22:52:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw se conecta a Discord como bot mediante el Gateway oficial de Discord. Se admiten los mensajes directos y los canales de servidores.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de Discord usan de forma predeterminada el modo de emparejamiento.
  </Card>
  <Card title="Comandos de barra diagonal" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de los comandos nativos y catálogo de comandos.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Flujo de diagnóstico y reparación entre canales.
  </Card>
</CardGroup>

## Configuración rápida

Crea una aplicación de Discord con un bot, añade el bot a tu servidor y emparéjalo con OpenClaw. Si puedes, utiliza un servidor privado; [crea uno primero](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**) si es necesario.

<Steps>
  <Step title="Crear una aplicación y un bot de Discord">
    En el [Portal para desarrolladores de Discord](https://discord.com/developers/applications), haz clic en **New Application** y asígnale un nombre (por ejemplo, "OpenClaw").

    Abre **Bot** en la barra lateral y establece **Username** en el nombre de tu agente.

  </Step>

  <Step title="Habilitar las intenciones privilegiadas">
    En la página **Bot**, dentro de **Privileged Gateway Intents**, habilita:

    - **Message Content Intent** (obligatoria)
    - **Server Members Intent** (recomendada; obligatoria para las listas de permitidos por rol, la correspondencia de nombres con identificadores y los grupos de acceso según la audiencia del canal)
    - **Presence Intent** (opcional; solo para actualizaciones de presencia)

  </Step>

  <Step title="Copiar el token del bot">
    En la página **Bot**, haz clic en **Reset Token** y copia el token.

    <Note>
    A pesar del nombre, esto genera tu primer token; no se está «restableciendo» nada.
    </Note>

  </Step>

  <Step title="Generar una URL de invitación y añadir el bot a tu servidor">
    Abre **OAuth2** en la barra lateral. En **OAuth2 URL Generator**, habilita los ámbitos:

    - `bot`
    - `applications.commands`

    En la sección **Bot Permissions** que aparece, habilita como mínimo:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcional)

    Esta es la configuración básica para los canales de texto normales. Si el bot va a publicar en hilos —incluidos los flujos de trabajo de canales de foros o multimedia que creen o continúen un hilo—, habilita también **Send Messages in Threads**.

    Copia la URL generada, ábrela en un navegador, selecciona tu servidor y haz clic en **Continue**. El bot debería aparecer ahora en tu servidor.

  </Step>

  <Step title="Habilitar el modo de desarrollador y recopilar tus identificadores">
    En la aplicación de Discord, habilita el modo de desarrollador para poder copiar los identificadores:

    1. **User Settings** (icono de engranaje) → **Developer** → activa **Developer Mode**
       *(en dispositivos móviles: **App Settings** → **Advanced**)*
    2. Haz clic con el botón derecho en el **icono de tu servidor** → **Copy Server ID**
    3. Haz clic con el botón derecho en **tu propio avatar** → **Copy User ID**

    Conserva el identificador del servidor y el identificador de usuario junto con el token del bot; necesitarás los tres a continuación.

  </Step>

  <Step title="Permitir mensajes directos de miembros del servidor">
    Para que el emparejamiento funcione, Discord debe permitir que el bot te envíe mensajes directos. Haz clic con el botón derecho en el **icono de tu servidor** → **Privacy Settings** → activa **Direct Messages**.

    Déjalo activado si utilizas mensajes directos de Discord con OpenClaw. Si solo utilizas canales del servidor, puedes desactivarlo después del emparejamiento.

  </Step>

  <Step title="Configurar el token del bot de forma segura (no lo envíes por el chat)">
    El token del bot es un secreto. Configúralo en la máquina que ejecuta OpenClaw antes de enviar mensajes a tu agente:

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

    Si OpenClaw ya se ejecuta como servicio en segundo plano, reinícialo mediante la aplicación de OpenClaw para Mac o deteniendo y reiniciando el proceso `openclaw gateway run`.
    Para las instalaciones como servicio administrado, ejecuta `openclaw gateway install` desde un intérprete de comandos donde esté configurada `DISCORD_BOT_TOKEN`, o guarda la variable en `~/.openclaw/.env` para que el servicio pueda resolver la SecretRef de entorno después de reiniciarse.
    Si Discord bloquea o limita por frecuencia la consulta inicial de la aplicación desde tu host, configura el identificador de aplicación/cliente del Portal para desarrolladores para que el inicio pueda omitir esa llamada REST: `channels.discord.applicationId` para la cuenta predeterminada o `channels.discord.accounts.<accountId>.applicationId` para cada bot.

  </Step>

  <Step title="Configurar OpenClaw y realizar el emparejamiento">

    <Tabs>
      <Tab title="Pedirlo a tu agente">
        Chatea con tu agente de OpenClaw en un canal existente (por ejemplo, Telegram) e indícaselo. Si Discord es tu primer canal, utiliza en su lugar la pestaña de CLI/configuración.

        > "Ya configuré el token de mi bot de Discord. Completa la configuración de Discord con el identificador de usuario `<user_id>` y el identificador del servidor `<server_id>`."
      </Tab>
      <Tab title="CLI / configuración">
        Configuración basada en archivos:

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

        Alternativa mediante variable de entorno para la cuenta predeterminada:

```bash
DISCORD_BOT_TOKEN=...
```

        Para una configuración automatizada o remota, escribe el mismo bloque JSON5 mediante `openclaw config patch --file ./discord.patch.json5 --dry-run` y vuelve a ejecutarlo sin `--dry-run`. También funcionan las cadenas `token` en texto sin formato, y se admiten valores SecretRef para `channels.discord.token` mediante proveedores de entorno, archivo y ejecución. Consulta [Gestión de secretos](/es/gateway/secrets).

        Para utilizar varios bots de Discord, guarda el token y el identificador de aplicación de cada bot dentro de su cuenta. Las cuentas heredan un `channels.discord.applicationId` de nivel superior, así que configúralo allí únicamente cuando todas las cuentas utilicen el mismo identificador de aplicación.

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

  <Step title="Aprobar el primer emparejamiento por mensaje directo">
    Cuando el Gateway esté en ejecución, envía un mensaje directo a tu bot en Discord. Este responderá con un código de emparejamiento.

    <Tabs>
      <Tab title="Pedirlo a tu agente">
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

    Los códigos de emparejamiento caducan después de 1 hora. Tras la aprobación, chatea con tu agente mediante un mensaje directo de Discord.

  </Step>
</Steps>

<Note>
La resolución de tokens tiene en cuenta la cuenta. Los valores de token de la configuración tienen prioridad sobre la alternativa mediante variable de entorno, y `DISCORD_BOT_TOKEN` solo se utiliza para la cuenta predeterminada.
Si dos cuentas de Discord habilitadas se resuelven con el mismo token de bot, OpenClaw inicia un único monitor del Gateway para ese token: un token procedente de la configuración tiene prioridad sobre la alternativa mediante variable de entorno; de lo contrario, prevalece la primera cuenta habilitada y se informa que la cuenta duplicada está deshabilitada con el motivo `duplicate bot token`.
Para las llamadas salientes avanzadas (herramienta de mensajes/acciones de canal), se utiliza un `token` explícito por llamada para esa llamada. Esto se aplica tanto a las acciones de envío como a las acciones de lectura o consulta (leer/buscar/obtener/hilo/mensajes fijados/permisos). La configuración de políticas y reintentos de la cuenta sigue procediendo de la cuenta seleccionada en la instantánea activa del entorno de ejecución.
</Note>

## Recomendación: configurar un espacio de trabajo en el servidor

Cuando los mensajes directos funcionen, puedes convertir tu servidor en un espacio de trabajo completo donde cada canal tenga su propia sesión del agente con su propio contexto. Se recomienda para servidores privados en los que solo estén tú y tu bot.

<Steps>
  <Step title="Añadir tu servidor a la lista de permitidos">
    Esto permite que tu agente responda en cualquier canal de tu servidor, no solo mediante mensajes directos.

    <Tabs>
      <Tab title="Pedirlo a tu agente">
        > "Añade el identificador de mi servidor de Discord `<server_id>` a la lista de servidores permitidos"
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

  <Step title="Permitir respuestas sin @mención">
    De forma predeterminada, el agente solo responde en los canales del servidor cuando se le menciona con @. En un servidor privado, probablemente quieras que responda a todos los mensajes.

    En los canales del servidor, las respuestas normales se publican automáticamente de forma predeterminada. Para salas compartidas siempre activas, configura `messages.groupChat.visibleReplies: "message_tool"` para que el agente pueda observar sin intervenir y solo publique cuando decida que una respuesta en el canal resulta útil. Esto funciona mejor con modelos de última generación fiables en el uso de herramientas, como GPT-5.6 Sol. Los eventos ambientales de la sala permanecen en silencio a menos que la herramienta realice un envío. Consulta [Eventos ambientales de sala](/es/channels/ambient-room-events) para ver la configuración completa del modo de observación.

    Si Discord muestra que se está escribiendo y los registros indican uso de tokens, pero no se publica ningún mensaje, comprueba si el turno se configuró como evento ambiental de sala o si se activaron las respuestas visibles mediante la herramienta de mensajes.

    <Tabs>
      <Tab title="Pedirlo a tu agente">
        > "Permite que mi agente responda en este servidor sin que sea necesario mencionarlo con @"
      </Tab>
      <Tab title="Configuración">
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

        Para exigir envíos mediante la herramienta de mensajes en las respuestas visibles de grupos o canales, establece `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planificar el uso de memoria en los canales del servidor">
    La memoria a largo plazo (MEMORY.md) solo se carga automáticamente en las sesiones de mensajes directos; los canales del servidor no la cargan.

    <Tabs>
      <Tab title="Pedirlo a tu agente">
        > "Cuando haga preguntas en canales de Discord, utiliza memory_search o memory_get si necesitas contexto a largo plazo de MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Para compartir contexto en todos los canales, incluye instrucciones estables en `AGENTS.md` o `USER.md` (se incorporan en cada sesión). Conserva las notas a largo plazo en `MEMORY.md` y accede a ellas cuando sea necesario mediante las herramientas de memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ahora crea canales y empieza a chatear. El agente ve el nombre del canal, y cada canal es una sesión aislada: configura `#coding`, `#home`, `#research` o cualquier opción que se adapte a tu flujo de trabajo.

## Modelo de ejecución

- El Gateway administra la conexión con Discord.
- El enrutamiento de respuestas es determinista: las respuestas a entradas de Discord vuelven a Discord.
- Los metadatos del servidor y del canal de Discord se añaden al mensaje de entrada del modelo como contexto no confiable, no como prefijo visible para el usuario en la respuesta. Si un modelo vuelve a copiar ese envoltorio, OpenClaw elimina los metadatos copiados de las respuestas salientes y del contexto de reproducción futuro.
- De forma predeterminada (`session.dmScope=main`), los chats directos comparten la sesión principal del agente (`agent:main:main`).
- Los canales del servidor utilizan claves de sesión aisladas (`agent:<agentId>:discord:channel:<channelId>`).
- Los mensajes directos grupales se ignoran de forma predeterminada (`channels.discord.dm.groupEnabled=false`).
- Los comandos de barra diagonal nativos se ejecutan en sesiones de comandos aisladas (`agent:<agentId>:discord:slash:<userId>`), aunque siguen llevando `CommandTargetSessionKey` a la sesión de conversación enrutada.
- La entrega de anuncios de Cron/Heartbeat exclusivamente de texto a Discord se reduce a la respuesta final visible del asistente, enviada una sola vez. Los contenidos multimedia y las cargas útiles de componentes estructurados permanecen como varios mensajes cuando el agente emite varias cargas útiles entregables.

## Canales de foros

Los canales de foros y multimedia de Discord solo aceptan publicaciones en hilos. OpenClaw admite dos formas de crearlas:

- Envía un mensaje al canal principal del foro (`channel:<forumId>`) para crear automáticamente un hilo. El título del hilo es la primera línea no vacía del mensaje (truncada al límite de Discord de 100 caracteres para el nombre del hilo).
- Usa `openclaw message thread create` para crear un hilo directamente. No pases `--message-id` para los canales de foro.

Envía al canal principal del foro para crear un hilo:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Crea explícitamente un hilo de foro:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Los canales principales de foro no admiten componentes de Discord. Si necesitas componentes, envía el mensaje al propio hilo (`channel:<threadId>`).

## Componentes interactivos

OpenClaw admite contenedores de componentes v2 de Discord para los mensajes del agente. Usa la herramienta de mensajes con una carga útil `components`. Los resultados de las interacciones se redirigen al agente como mensajes entrantes normales y siguen la configuración existente de `replyToMode` de Discord.

Bloques compatibles:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Las filas de acciones admiten hasta 5 botones o un único menú de selección
- Tipos de selección: `string`, `user`, `role`, `mentionable`, `channel`

De forma predeterminada, los componentes son de un solo uso. Establece `components.reusable=true` para permitir que los botones, las selecciones y los formularios se utilicen varias veces hasta que caduquen.

Para restringir quién puede hacer clic en un botón, establece `allowedUsers` en ese botón (identificadores de usuario de Discord, etiquetas o `*`). Los usuarios que no coincidan reciben una denegación efímera.

Las devoluciones de llamada de los componentes caducan después de 30 minutos de forma predeterminada. Establece `channels.discord.agentComponents.ttlMs` para cambiar la duración del registro de devoluciones de llamada de la cuenta predeterminada, o `channels.discord.accounts.<accountId>.agentComponents.ttlMs` para cada cuenta. El valor se expresa en milisegundos, debe ser un entero positivo y tiene un límite máximo de `86400000` (24 horas). Los TTL más largos son apropiados para flujos de revisión y aprobación que necesitan mantener utilizables los botones, pero amplían el período durante el cual un mensaje antiguo de Discord aún puede activar una acción. Prefiere el TTL más corto que resulte adecuado y conserva el valor predeterminado cuando las devoluciones de llamada obsoletas puedan resultar inesperadas.

Los comandos de barra `/model` y `/models` abren un selector de modelos interactivo con listas desplegables de proveedor, modelo y entorno de ejecución compatible, además de un paso Submit. `/models add` está obsoleto y devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat. La respuesta del selector es efímera y solo puede utilizarla el usuario que lo invocó. Los menús de selección de Discord están limitados a 25 opciones; por tanto, añade entradas `provider/*` a `agents.defaults.models` cuando quieras que el selector muestre modelos descubiertos dinámicamente solo para proveedores seleccionados, como `openai` o `vllm`.

Archivos adjuntos:

- Los bloques `file` deben apuntar a una referencia de archivo adjunto (`attachment://<filename>`)
- Proporciona el archivo adjunto mediante `media`/`path`/`filePath` (un solo archivo); usa `media-gallery` para varios archivos
- Usa `filename` para sustituir el nombre de la carga cuando deba coincidir con la referencia del archivo adjunto

Formularios modales:

- Añade `components.modal` con hasta 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw añade automáticamente un botón de activación

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
  <Tab title="Política de mensajes directos">
    `channels.discord.dmPolicy` controla el acceso a los mensajes directos. `channels.discord.allowFrom` es la lista de permitidos canónica para mensajes directos.

    - `pairing` (valor predeterminado)
    - `allowlist` (requiere al menos un remitente en `allowFrom`)
    - `open` (requiere que `channels.discord.allowFrom` incluya `"*"`)
    - `disabled`

    Si la política de mensajes directos no es abierta, los usuarios desconocidos se bloquean (o se les solicita que realicen el emparejamiento en el modo `pairing`).

    Precedencia para varias cuentas:

    - `channels.discord.accounts.default.allowFrom` se aplica únicamente a la cuenta `default`.
    - Para una cuenta, `allowFrom` tiene precedencia sobre el valor heredado `dm.allowFrom`.
    - Las cuentas con nombre heredan `channels.discord.allowFrom` cuando sus propios valores `allowFrom` y el valor heredado `dm.allowFrom` no están establecidos.
    - Las cuentas con nombre no heredan `channels.discord.accounts.default.allowFrom`.

    Los valores heredados `channels.discord.dm.policy` y `channels.discord.dm.allowFrom` todavía se leen por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    Formato del destino de mensajes directos para la entrega:

    - `user:<id>`
    - Mención `<@id>`

    Los identificadores numéricos sin prefijo normalmente se resuelven como identificadores de canal cuando hay un canal predeterminado activo, pero los identificadores incluidos en el valor efectivo `allowFrom` de mensajes directos de la cuenta se tratan como destinos de mensajes directos de usuario por compatibilidad.

  </Tab>

  <Tab title="Grupos de acceso">
    Los mensajes directos de Discord y la autorización de comandos de texto pueden usar entradas dinámicas `accessGroup:<name>` en `channels.discord.allowFrom`.

    Los nombres de los grupos de acceso se comparten entre los canales de mensajes. Usa `type: "message.senders"` para un grupo estático cuyos miembros se expresan mediante la sintaxis normal de `allowFrom` de cada canal, o `type: "discord.channelAudience"` cuando la audiencia actual de `ViewChannel` de un canal de Discord deba definir dinámicamente la pertenencia. Comportamiento compartido de los grupos de acceso: [Grupos de acceso](/es/channels/access-groups).

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

    Un canal de texto de Discord no tiene una lista de miembros independiente. `type: "discord.channelAudience"` modela la pertenencia de esta forma: el remitente del mensaje directo es miembro del servidor configurado y actualmente dispone del permiso efectivo `ViewChannel` en el canal configurado después de aplicar las sobrescrituras de roles y del canal.

    Ejemplo: permite que cualquier persona que pueda ver `#maintainers` envíe mensajes directos al bot, mientras se mantienen cerrados los mensajes directos para todos los demás.

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

    Puedes combinar entradas dinámicas y estáticas:

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

    Las búsquedas deniegan el acceso en caso de error. Si Discord devuelve `Missing Access`, la búsqueda del miembro falla o el canal pertenece a otro servidor, el remitente del mensaje directo se considera no autorizado.

    Activa **Server Members Intent** en Discord Developer Portal cuando uses grupos de acceso basados en la audiencia del canal. Los mensajes directos no incluyen el estado de pertenencia al servidor, por lo que OpenClaw resuelve el miembro mediante la API REST de Discord en el momento de la autorización.

  </Tab>

  <Tab title="Política de servidores">
    La gestión de los servidores se controla mediante `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La configuración de seguridad de referencia cuando existe `channels.discord` es `allowlist`.

    Comportamiento de `allowlist`:

    - el servidor debe coincidir con `channels.discord.guilds` (se prefiere `id`, aunque también se acepta un identificador legible)
    - listas opcionales de remitentes permitidos: `users` (se recomiendan identificadores estables) y `roles` (solo identificadores de rol); si se configura cualquiera de ellas, los remitentes están permitidos cuando coinciden con `users` O con `roles`
    - la coincidencia directa por nombre o etiqueta está desactivada de forma predeterminada; activa `channels.discord.dangerouslyAllowNameMatching: true` únicamente como modo de compatibilidad de emergencia
    - se admiten nombres y etiquetas en `users`, pero los identificadores son más seguros; `openclaw security audit` advierte cuando se usan entradas de nombre o etiqueta
    - si un servidor tiene `channels` configurado, se deniegan los canales que no estén incluidos
    - si un servidor no tiene un bloque `channels`, se permiten todos los canales de ese servidor incluido en la lista de permitidos

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
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    `openclaw doctor --fix` migra la clave heredada `allow` de cada canal a `enabled`.

    Si solo estableces `DISCORD_BOT_TOKEN` y no creas un bloque `channels.discord`, el valor de respaldo en tiempo de ejecución es `groupPolicy="allowlist"` (con una advertencia en los registros), incluso si `channels.defaults.groupPolicy` es `open`.

  </Tab>

  <Tab title="Menciones y mensajes directos grupales">
    Los mensajes de los servidores requieren una mención de forma predeterminada.

    La detección de menciones incluye:

    - mención explícita al bot
    - patrones de mención configurados (`agents.list[].groupChat.mentionPatterns`, con `messages.groupChat.mentionPatterns` como valor de respaldo)
    - comportamiento implícito de respuesta al bot en los casos compatibles

    Al redactar mensajes salientes de Discord, usa la sintaxis canónica de menciones: `<@USER_ID>` para usuarios, `<#CHANNEL_ID>` para canales y `<@&ROLE_ID>` para roles. No uses la forma heredada de mención mediante apodo `<@!USER_ID>`.

    `requireMention` se configura por servidor o canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` descarta opcionalmente los mensajes que mencionen a otro usuario o rol, pero no al bot (excepto @everyone/@here).

    Mensajes directos grupales:

    - valor predeterminado: se ignoran (`dm.groupEnabled=false`)
    - lista de permitidos opcional mediante `dm.groupChannels` (identificadores o nombres legibles de canales)

  </Tab>
</Tabs>

### Enrutamiento de agentes basado en roles

Usa `bindings[].match.roles` para dirigir a los miembros de servidores de Discord a distintos agentes según el identificador de rol. Las vinculaciones basadas en roles solo aceptan identificadores de rol y se evalúan después de las vinculaciones de interlocutor o interlocutor principal y antes de las vinculaciones exclusivas del servidor. Si una vinculación también establece otros campos de coincidencia (por ejemplo, `peer` + `guildId` + `roles`), todos los campos configurados deben coincidir.

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
- Reemplazo por canal: `channels.discord.commands.native`.
- `commands.native=false` omite el registro y la limpieza de los comandos de barra de Discord durante el inicio. Los comandos registrados anteriormente pueden seguir visibles en Discord hasta que los elimine de la aplicación de Discord.
- La autenticación de comandos nativos utiliza las mismas listas de permitidos y políticas de Discord que el procesamiento normal de mensajes.
- Los comandos pueden seguir visibles en la interfaz de Discord para usuarios no autorizados; al ejecutarlos, se aplica la autenticación de OpenClaw y se responde «no autorizado».
- Configuración predeterminada de los comandos de barra: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Consulte [Comandos de barra](/es/tools/slash-commands) para conocer el catálogo y el comportamiento de los comandos.

## Detalles de las funciones

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord admite etiquetas de respuesta en la salida del agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Se controla mediante `channels.discord.replyToMode`:

    - `off` (valor predeterminado): no se crean hilos de respuesta implícitos; las etiquetas explícitas `[[reply_to_*]]` se siguen respetando
    - `first`: adjunta la referencia de respuesta nativa implícita al primer mensaje saliente de Discord del turno
    - `all`: la adjunta a todos los mensajes salientes
    - `batched`: la adjunta únicamente cuando el evento entrante era un lote con eliminación de rebotes compuesto por varios mensajes; resulta útil si desea respuestas nativas principalmente para conversaciones ambiguas con ráfagas de mensajes, no para cada turno de un solo mensaje

    Los identificadores de mensajes se incluyen en el contexto y el historial para que los agentes puedan dirigirse a mensajes específicos.

  </Accordion>

  <Accordion title="Link previews">
    Discord genera de forma predeterminada contenido enriquecido incrustado para las URL. OpenClaw suprime de forma predeterminada este contenido incrustado generado en los mensajes salientes de Discord, por lo que las URL enviadas por el agente permanecen como enlaces simples, salvo que habilite esta función:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Establezca `channels.discord.accounts.<id>.suppressEmbeds` para reemplazar la configuración de una cuenta. Los envíos mediante la herramienta de mensajes del agente también pueden incluir `suppressEmbeds: false` para un solo mensaje. Las cargas útiles explícitas `embeds` de Discord no se suprimen mediante la configuración predeterminada de vistas previas de enlaces.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw puede transmitir borradores de respuestas enviando un mensaje temporal y editándolo a medida que llega el texto. `channels.discord.streaming.mode` acepta `off` | `partial` | `block` | `progress` (`progress` es el valor predeterminado cuando no se establece ninguna clave `streaming` ni la clave heredada `streamMode`). `streamMode` es un alias heredado; ejecute `openclaw doctor --fix` para reescribir la configuración persistente con la estructura anidada canónica `streaming`.

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

    - `off` deshabilita las ediciones de la vista previa de Discord.
    - `partial` edita un único mensaje de vista previa a medida que llegan los tokens.
    - `block` emite fragmentos del tamaño de un borrador; ajuste el tamaño y los puntos de corte mediante `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), con un límite máximo de `textChunkLimit`. Cuando la transmisión por bloques está habilitada explícitamente, OpenClaw omite la transmisión de la vista previa para evitar una transmisión duplicada.
    - `progress` mantiene un borrador de estado editable y lo actualiza con el progreso de las herramientas hasta la entrega final; la etiqueta inicial compartida es una línea móvil, por lo que desaparece al desplazarse, como el resto, cuando se muestra suficiente trabajo.
    - Los resultados finales con contenido multimedia, errores o respuestas explícitas cancelan las ediciones de vista previa pendientes.
    - `streaming.preview.toolProgress` (valor predeterminado: `true`) controla si las actualizaciones de herramientas o progreso reutilizan el mensaje de vista previa.
    - Las filas de herramientas o progreso se muestran como emoji compacto + título + detalle cuando están disponibles; por ejemplo, `🛠️ Bash: ejecutar pruebas` o `🔎 Búsqueda web: de "consulta"`.
    - `streaming.progress.commentary` (valor predeterminado: `false`) permite incluir el texto de comentarios o preámbulo del asistente en el borrador temporal de progreso. Los comentarios se depuran antes de mostrarse, permanecen transitorios y no cambian la entrega de la respuesta final.
    - `streaming.progress.maxLineChars` controla el límite por línea de la vista previa de progreso. La prosa se acorta respetando los límites entre palabras; los detalles de comandos y rutas conservan los sufijos útiles.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controla los detalles de comandos o ejecuciones en las líneas compactas de progreso: `raw` (valor predeterminado) o `status` (solo la etiqueta de la herramienta).

    Oculte el texto sin procesar de comandos o ejecuciones y mantenga las líneas compactas de progreso:

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

    La transmisión de la vista previa solo admite texto; las respuestas con contenido multimedia recurren a la entrega normal.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Contexto del historial del servidor:

    - `channels.discord.historyLimit`, valor predeterminado: `20`
    - alternativa: `messages.groupChat.historyLimit`
    - `0` lo deshabilita

    Controles del historial de mensajes directos:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamiento de los hilos:

    - Los hilos de Discord se enrutan como sesiones de canal y heredan la configuración del canal principal, salvo que se reemplace.
    - Las sesiones de hilo heredan la selección `/model` de la sesión del canal principal únicamente como alternativa de modelo; las selecciones `/model` locales del hilo tienen prioridad y el historial de la transcripción principal no se copia, salvo que se habilite la herencia de transcripciones.
    - `channels.discord.thread.inheritParent` (valor predeterminado: `false`) permite que los nuevos hilos automáticos se inicialicen a partir de la transcripción principal. Reemplazo por cuenta: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Las reacciones de la herramienta de mensajes pueden resolver destinos de mensajes directos `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` se conserva durante la activación alternativa de la fase de respuesta.

    Los temas de los canales se inyectan como contexto **no confiable**. Las listas de permitidos limitan quién puede activar al agente, pero no constituyen un límite completo de censura del contexto complementario.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord puede vincular un hilo a un destino de sesión para que los mensajes posteriores de ese hilo sigan enrutándose a la misma sesión, incluidas las sesiones de subagentes.

    Comandos:

    - `/focus <target>` vincula el hilo actual o uno nuevo a un destino de subagente o sesión
    - `/unfocus` elimina la vinculación del hilo actual
    - `/agents` muestra las ejecuciones activas y el estado de vinculación
    - `/session idle <duration|off>` consulta o actualiza la desvinculación automática por inactividad de las vinculaciones enfocadas
    - `/session max-age <duration|off>` consulta o actualiza la antigüedad máxima absoluta de las vinculaciones enfocadas

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

    - `session.threadBindings.*` establece los valores predeterminados globales; `channels.discord.threadBindings.*` reemplaza el comportamiento de Discord.
    - `spawnSessions` controla la creación y vinculación automáticas de hilos para `sessions_spawn({ thread: true })` y las creaciones de hilos de ACP. Valor predeterminado: `true`.
    - `defaultSpawnContext` controla el contexto nativo del subagente para las creaciones vinculadas a hilos. Valor predeterminado: `"fork"`.
    - `openclaw doctor --fix` migra las claves obsoletas `spawnSubagentSessions` y `spawnAcpSessions`.
    - Si las vinculaciones de hilos están deshabilitadas para una cuenta, `/focus` y las operaciones relacionadas con la vinculación de hilos no están disponibles.

    Consulte [Subagentes](/es/tools/subagents), [Agentes ACP](/es/tools/acp-agents) y [Referencia de configuración](/es/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Para espacios de trabajo ACP estables y «siempre activos», configure vinculaciones ACP tipadas de nivel superior dirigidas a conversaciones de Discord.

    Ruta de configuración: `bindings[]` con `type: "acp"` y `match.channel: "discord"`.

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

    - `/acp spawn codex --bind here` vincula el canal o hilo actual en el mismo lugar y mantiene los mensajes futuros en la misma sesión ACP. Los mensajes del hilo heredan la vinculación del canal principal.
    - En un canal o hilo vinculado, `/new` y `/reset` restablecen la misma sesión ACP en el mismo lugar. Las vinculaciones temporales de hilos pueden reemplazar la resolución del destino mientras estén activas.
    - `spawnSessions` controla la creación y vinculación de hilos secundarios mediante `--thread auto|here`.

    Consulte [Agentes ACP](/es/tools/acp-agents) para obtener información detallada sobre el comportamiento de las vinculaciones.

  </Accordion>

  <Accordion title="Reaction notifications">
    Modo de notificación de reacciones por servidor (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (valor predeterminado)
    - `all`
    - `allowlist` (utiliza `guilds.<id>.users`)

    Los eventos de reacción se convierten en eventos del sistema y se adjuntan a la sesión de Discord enrutada.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - alternativa mediante el emoji de identidad del agente (`agents.list[].identity.emoji`; de lo contrario, `"👀"`)

    Notas:

    - Discord acepta emojis Unicode o nombres de emojis personalizados.
    - Utilice `""` para deshabilitar la reacción en un canal o una cuenta.

    **Ámbito (`messages.ackReactionScope`):**

    Valores: `"all"` (mensajes directos + grupos, incluidos los eventos ambientales de salas), `"direct"` (solo mensajes directos), `"group-all"` (todos los mensajes de grupo excepto los eventos ambientales de salas; sin mensajes directos), `"group-mentions"` (grupos cuando se menciona al bot; **sin mensajes directos**, valor predeterminado), `"off"` / `"none"` (deshabilitado).

    <Note>
    El ámbito predeterminado (`"group-mentions"`) no activa reacciones de confirmación en mensajes directos ni en eventos ambientales de salas. Para obtener una reacción de confirmación en los mensajes directos entrantes de Discord y en los eventos de salas silenciosas, establezca `messages.ackReactionScope` en `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Config writes">
    Las escrituras de configuración iniciadas desde el canal están habilitadas de forma predeterminada. Esto afecta a los flujos `/config set|unset` cuando las funciones de comandos están habilitadas.

    Para deshabilitarlas:

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
    Enrute el tráfico WebSocket del Gateway de Discord y las consultas REST de inicio (identificador de la aplicación + resolución de listas de permitidos) a través de un proxy HTTP(S) mediante `channels.discord.proxy`.
    El uso de un proxy para el WebSocket del Gateway de Discord es explícito; las conexiones WebSocket no heredan las variables de entorno de proxy del proceso del Gateway. Las consultas REST de inicio utilizan este proxy cuando se configura `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Reemplazo por cuenta:

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

  <Accordion title="PluralKit support">
    Habilite la resolución de PluralKit para asociar los mensajes enviados mediante proxy con la identidad del miembro del sistema:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // opcional; necesario para sistemas privados
      },
    },
  },
}
```

    Notas:

    - las listas de permitidos pueden usar `pk:<memberId>`
    - los nombres para mostrar de los miembros se comparan por nombre/slug solo cuando `channels.discord.dangerouslyAllowNameMatching: true`
    - las búsquedas consultan la API de PluralKit con el ID del mensaje original
    - si la búsqueda falla, los mensajes enviados mediante proxy se tratan como mensajes de bots y se descartan, a menos que `allowBots` permita su paso

  </Accordion>

  <Accordion title="Alias de menciones salientes">
    Usa `mentionAliases` cuando los agentes necesiten menciones salientes deterministas para usuarios conocidos de Discord. Las claves son identificadores sin la `@` inicial; los valores son ID de usuario de Discord. Los identificadores desconocidos, `@everyone`, `@here` y las menciones dentro de fragmentos de código Markdown no se modifican.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
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

    Solo estado:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Actividad (el estado personalizado es el tipo de actividad predeterminado cuando se establece `activity`):

```json5
{
  channels: {
    discord: {
      activity: "Tiempo de concentración",
      activityType: 4,
    },
  },
}
```

    Transmisión:

```json5
{
  channels: {
    discord: {
      activity: "Programación en directo",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mapa de tipos de actividad:

    - 0: Jugando
    - 1: Transmitiendo (requiere `activityUrl`; a su vez, `activityUrl` requiere `activityType: 1`)
    - 2: Escuchando
    - 3: Viendo
    - 4: Personalizada (usa el texto de la actividad como estado; el emoji es opcional)
    - 5: Compitiendo

    Presencia automática (señal de estado del entorno de ejecución):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token agotado",
      },
    },
  },
}
```

    La presencia automática asigna la disponibilidad del entorno de ejecución al estado de Discord: correcto => conectado, degradado o desconocido => inactivo, agotado o no disponible => no molestar. Valores predeterminados: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (debe ser menor o igual que `intervalMs`). Sustituciones de texto opcionales:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (admite el marcador de posición `{reason}`)

  </Accordion>

  <Accordion title="Aprobaciones en Discord">
    Discord admite la gestión de aprobaciones mediante botones en mensajes directos y, opcionalmente, puede publicar solicitudes de aprobación en el canal de origen.

    Ruta de configuración:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando es posible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, valor predeterminado: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord habilita automáticamente las aprobaciones nativas de ejecución cuando `enabled` no está definido o es `"auto"` y se puede determinar al menos un aprobador, ya sea desde `execApprovals.approvers` o desde `commands.ownerAllowFrom`. Discord no deduce aprobadores de ejecución a partir de `allowFrom` del canal, el `dm.allowFrom` heredado ni el `defaultTo` de mensajes directos. Establece `enabled: false` para deshabilitar explícitamente Discord como cliente nativo de aprobaciones.

    Para comandos de grupo confidenciales y exclusivos del propietario, como `/diagnostics` y `/export-trajectory`, OpenClaw envía las solicitudes de aprobación y los resultados finales de forma privada. Primero intenta usar un mensaje directo de Discord cuando el propietario que invoca el comando tiene una ruta de propietario en Discord; de lo contrario, recurre a la primera ruta de propietario disponible de `commands.ownerAllowFrom`, como Telegram.

    Cuando `target` es `channel` o `both`, la solicitud de aprobación es visible en el canal. Solo los aprobadores determinados pueden usar los botones; los demás usuarios reciben una denegación efímera. Las solicitudes de aprobación incluyen el texto del comando, por lo que solo debes habilitar la entrega en el canal en canales de confianza. Si el ID del canal no se puede obtener de la clave de sesión, OpenClaw recurre a la entrega mediante mensaje directo.

    Discord representa los botones de aprobación compartidos que usan otros canales de chat; el adaptador nativo de Discord añade principalmente el enrutamiento de mensajes directos a los aprobadores y la distribución en canales. Cuando esos botones están presentes, constituyen la experiencia de aprobación principal; OpenClaw solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía. Si el entorno de ejecución de aprobaciones nativas de Discord no está activo, OpenClaw mantiene visible la solicitud local determinista `/approve <id> <decision>`. Si el entorno de ejecución está activo, pero no se puede entregar una tarjeta nativa a ningún destino, OpenClaw envía en el mismo chat un aviso alternativo con el comando `/approve` exacto de la aprobación pendiente.

    La autenticación del Gateway y la resolución de aprobaciones siguen el contrato compartido del cliente del Gateway (los ID `plugin:` se resuelven mediante `plugin.approval.resolve`; los demás ID, mediante `exec.approval.resolve`). De forma predeterminada, las aprobaciones caducan después de 30 minutos.

    Consulta [Aprobaciones de ejecución](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Herramientas y controles de acciones

Las acciones de mensajes de Discord abarcan la mensajería, la administración de canales, la moderación, la presencia y los metadatos.

Ejemplos principales:

- mensajería: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reacciones: `react`, `reactions`, `emojiList`
- moderación: `timeout`, `kick`, `ban`
- presencia: `setPresence`

La acción `event-create` acepta un parámetro opcional `image` (URL o ruta de archivo local) para establecer la imagen de portada del evento programado.

Los controles de acciones se encuentran en `channels.discord.actions.*`.

Comportamiento predeterminado de los controles:

| Grupo de acciones                                                                                                                                                         | Valor predeterminado |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | habilitado           |
| roles                                                                                                                                                                    | deshabilitado        |
| moderation                                                                                                                                                               | deshabilitado        |
| presence                                                                                                                                                                 | deshabilitado        |

## Interfaz de componentes v2

OpenClaw usa los componentes v2 de Discord para las aprobaciones de ejecución y los marcadores entre contextos. Las acciones de mensajes de Discord también pueden aceptar `components` para una interfaz personalizada (funcionalidad avanzada; requiere construir una carga útil de componentes mediante la herramienta de Discord), mientras que los `embeds` heredados siguen disponibles, pero no se recomiendan.

- `channels.discord.ui.components.accentColor` establece el color de énfasis que usan los contenedores de componentes de Discord (hexadecimal). Por cuenta: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` controla durante cuánto tiempo permanecen registrados los callbacks de los componentes de Discord enviados (valor predeterminado: `1800000`; máximo: `86400000`). Por cuenta: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- Los `embeds` se ignoran cuando hay componentes v2.
- Las vistas previas de URL simples se suprimen de forma predeterminada. Establece `suppressEmbeds: false` en una acción de mensaje cuando se deba expandir un único enlace saliente.

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

Discord tiene dos superficies de voz distintas: **canales de voz** en tiempo real (conversaciones continuas) y **archivos adjuntos de mensajes de voz** (el formato de vista previa de forma de onda). El Gateway admite ambas.

### Canales de voz

Lista de comprobación para la configuración:

1. Habilita Message Content Intent en Discord Developer Portal.
2. Habilita Server Members Intent cuando se usen listas de permitidos de roles o usuarios.
3. Invita al bot con los ámbitos `bot` y `applications.commands`.
4. Concede Connect, Speak, Send Messages y Read Message History en el canal de voz de destino.
5. Habilita los comandos nativos (`commands.native` o `channels.discord.commands.native`).
6. Configura `channels.discord.voice`.

Usa `/vc join|leave|status` para controlar las sesiones. El comando usa el agente predeterminado de la cuenta y sigue las mismas reglas de listas de permitidos y políticas de grupo que los demás comandos de Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Para inspeccionar los permisos efectivos del bot antes de unirse:

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
        model: "openai/gpt-5.6-sol",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Notas:

- La voz de Discord es opcional para las configuraciones de solo texto; establece `channels.discord.voice.enabled=true` (o conserva un bloque `channels.discord.voice` existente) para habilitar los comandos `/vc`, el entorno de ejecución de voz y la intención de Gateway `GuildVoiceStates`. `channels.discord.intents.voiceStates` puede sobrescribir explícitamente la suscripción a la intención; déjalo sin establecer para que siga la habilitación efectiva de la voz.
- `voice.mode` controla la ruta de conversación. El valor predeterminado es `agent-proxy`: una interfaz de voz en tiempo real gestiona los turnos, las interrupciones y la reproducción, delega el trabajo sustancial al agente de OpenClaw enrutado mediante `openclaw_agent_consult` y trata el resultado como una solicitud escrita de Discord procedente de ese hablante. `stt-tts` conserva el flujo por lotes anterior de STT más TTS. `bidi` permite que el modelo en tiempo real converse directamente y expone `openclaw_agent_consult` para usar el cerebro de OpenClaw.
- `voice.agentSession` controla qué conversación de OpenClaw recibe los turnos de voz. Déjalo sin establecer para usar la sesión propia del canal de voz, o establece `{ mode: "target", target: "channel:<text-channel-id>" }` para que el canal de voz actúe como extensión de micrófono y altavoz de la sesión de un canal de texto de Discord existente, como `#maintainers`.
- `voice.model` sobrescribe el cerebro del agente de OpenClaw para las respuestas de voz de Discord y las consultas en tiempo real. Déjalo sin establecer para heredar el modelo del agente enrutado. Es independiente de `voice.realtime.model`.
- `voice.followUsers` permite que el bot se una, se mueva y salga de la voz de Discord junto con usuarios seleccionados. Consulta [Seguir a usuarios en la voz](#follow-users-in-voice).
- `agent-proxy` enruta el habla mediante `discord-voice`, lo que conserva la autorización normal del propietario y de las herramientas para el hablante y la sesión de destino, pero oculta la herramienta `tts` del agente porque la voz de Discord se encarga de la reproducción. De forma predeterminada, `agent-proxy` concede a la consulta acceso completo a herramientas equivalente al del propietario para los hablantes propietarios (`voice.realtime.toolPolicy: "owner"`) y prioriza firmemente consultar al agente de OpenClaw antes de dar respuestas sustanciales (`voice.realtime.consultPolicy: "always"`). En ese modo `always` predeterminado, la capa en tiempo real no pronuncia automáticamente frases de relleno antes de recibir la respuesta de la consulta; captura y transcribe el habla y, después, reproduce la respuesta de OpenClaw enrutada. Si varias respuestas de consultas forzadas terminan mientras Discord todavía reproduce la primera respuesta, las respuestas posteriores con texto exacto para pronunciar se ponen en cola hasta que la reproducción queda inactiva, en lugar de sustituir el habla a mitad de una frase.
- En el modo `stt-tts`, STT usa `tools.media.audio`; `voice.model` no afecta a la transcripción.
- En los modos en tiempo real, `voice.realtime.provider`, `voice.realtime.model` y `voice.realtime.speakerVoice` configuran la sesión de audio en tiempo real. Para OpenAI Realtime 2.1 con el cerebro Codex, usa `voice.realtime.model: "gpt-realtime-2.1"` y `voice.model: "openai/gpt-5.6-sol"`.
- De forma predeterminada, los modos de voz en tiempo real incluyen pequeños archivos de perfil `IDENTITY.md`, `USER.md` y `SOUL.md` en las instrucciones del proveedor en tiempo real, para que los turnos directos rápidos mantengan la misma identidad, fundamentación sobre el usuario y personalidad que el agente de OpenClaw enrutado. Establece `voice.realtime.bootstrapContextFiles` en un subconjunto para personalizarlo, o en `[]` para deshabilitarlo. Solo se admiten esos archivos de perfil; `AGENTS.md` permanece en el contexto normal del agente. El contexto de perfil insertado no sustituye a `openclaw_agent_consult` para trabajar en el espacio de trabajo, obtener datos actuales, consultar la memoria o realizar acciones respaldadas por herramientas.
- En el modo en tiempo real `agent-proxy` de OpenAI, establece `voice.realtime.requireWakeName: true` para mantener la voz en tiempo real de Discord en silencio hasta que una transcripción comience o termine con un nombre de activación. Los nombres de activación configurados deben tener una o dos palabras. Si `voice.realtime.wakeNames` no está establecido, OpenClaw usa el `name` del agente enrutado más `OpenClaw` y, como alternativa, el identificador del agente más `OpenClaw`. El control mediante nombre de activación deshabilita la respuesta automática del proveedor en tiempo real, enruta los turnos aceptados mediante la ruta de consulta del agente de OpenClaw y emite una breve confirmación hablada cuando se reconoce un nombre de activación inicial en la transcripción parcial antes de que llegue la transcripción final.
- El proveedor en tiempo real de OpenAI acepta los nombres de eventos actuales de Realtime 2 y los alias heredados compatibles con Codex para los eventos de audio de salida y transcripción, de modo que las instantáneas compatibles del proveedor puedan variar sin perder el audio del asistente.
- `voice.realtime.bargeIn` controla si los eventos de inicio del hablante de Discord interrumpen la reproducción activa en tiempo real. Si no está establecido, sigue la configuración de interrupción por audio de entrada del proveedor en tiempo real.
- `voice.realtime.minBargeInAudioEndMs` controla la duración mínima de reproducción del asistente antes de que una interrupción de voz en tiempo real de OpenAI trunque el audio. Valor predeterminado: `250`. Establece `0` para permitir la interrupción inmediata en salas con poco eco, o aumenta el valor para configuraciones de altavoces con mucho eco.
- `voice.tts` sobrescribe `messages.tts` únicamente para la reproducción de voz en modo `stt-tts`; los modos en tiempo real usan `voice.realtime.speakerVoice` en su lugar. Para usar una voz de OpenAI en la reproducción de Discord, establece `voice.tts.provider: "openai"` y elige una voz de texto a voz en `voice.tts.providers.openai.speakerVoice`. `cedar` es una buena opción de sonido masculino en el modelo TTS actual de OpenAI.
- Las sobrescrituras de `systemPrompt` de Discord por canal se aplican a los turnos de transcripción de voz de ese canal de voz.
- Los turnos de transcripción de voz determinan el estado de propietario a partir de `allowFrom` (o `dm.allowFrom`) de Discord para los comandos restringidos al propietario y las acciones del canal. La visibilidad de las herramientas del agente sigue la política de herramientas configurada para la sesión enrutada.
- Si `voice.autoJoin` tiene varias entradas para el mismo servidor, OpenClaw se une al último canal configurado para ese servidor.
- `voice.allowedChannels` es una lista de canales de residencia permitidos opcional. Déjalo sin establecer para permitir que `/vc join` se una a cualquier canal de voz autorizado de Discord. Cuando se establece, `/vc join`, la unión automática al inicio y los movimientos del estado de voz del bot se restringen a las entradas `{ guildId, channelId }` indicadas. Establécelo en una matriz vacía para denegar todas las uniones a la voz de Discord. Si Discord mueve el bot fuera de la lista de permitidos, OpenClaw abandona ese canal y vuelve a unirse al destino de unión automática configurado cuando haya uno disponible.
- `voice.daveEncryption` y `voice.decryptionFailureTolerance` se pasan a las opciones de unión de `@discordjs/voice`; los valores predeterminados de la dependencia ascendente son `daveEncryption=true` y `decryptionFailureTolerance=24`.
- OpenClaw usa el códec `libopus-wasm` incluido para recibir voz de Discord y reproducir PCM sin procesar en tiempo real. Incluye una compilación WebAssembly fijada de libopus y no requiere complementos nativos de opus.
- `voice.connectTimeoutMs` controla la espera inicial del estado Ready de `@discordjs/voice` para `/vc join` y los intentos de unión automática. Valor predeterminado: `30000`.
- `voice.reconnectGraceMs` controla cuánto tiempo espera OpenClaw a que una sesión de voz desconectada comience a reconectarse antes de destruirla. Valor predeterminado: `15000`.
- En el modo `stt-tts`, la reproducción de voz no se detiene solo porque otro usuario empiece a hablar. Para evitar bucles de retroalimentación, OpenClaw ignora las nuevas capturas de voz mientras se reproduce TTS; habla después de que finalice la reproducción para iniciar el siguiente turno. Los modos en tiempo real reenvían los inicios de los hablantes como señales de interrupción al proveedor en tiempo real.
- En los modos en tiempo real, el eco de los altavoces que entra en un micrófono abierto puede parecer una interrupción e interrumpir la reproducción. Para salas de Discord con mucho eco, establece `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` para impedir que OpenAI interrumpa automáticamente al detectar audio de entrada. Añade `voice.realtime.bargeIn: true` si aún quieres que los eventos de inicio del hablante de Discord interrumpan la reproducción activa. El puente en tiempo real de OpenAI ignora los truncamientos de reproducción inferiores a `voice.realtime.minBargeInAudioEndMs` por considerarlos probablemente eco o ruido, y los registra como omitidos en lugar de borrar la reproducción de Discord.
- `voice.captureSilenceGraceMs` controla cuánto tiempo espera OpenClaw después de que Discord informa que un hablante ha dejado de hablar antes de finalizar ese segmento de audio para STT. Valor predeterminado: `2000`; auméntalo si Discord divide las pausas normales en transcripciones parciales entrecortadas.
- Cuando ElevenLabs es el proveedor TTS seleccionado, la reproducción de voz de Discord usa TTS en streaming y comienza desde el flujo de respuesta del proveedor. Los proveedores sin compatibilidad con streaming recurren a la ruta de archivo temporal sintetizado.
- OpenClaw supervisa los fallos de descifrado de recepción y se recupera automáticamente abandonando el canal de voz y volviendo a unirse después de varios fallos en un intervalo corto.
- Si los registros de recepción muestran repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` después de una actualización, recopila un informe de dependencias y los registros. La versión incluida de `@discordjs/voice` incorpora la corrección ascendente de relleno de la PR n.º 11449 de discord.js, que cerró la incidencia n.º 11419 de discord.js.
- Los eventos de recepción `The operation was aborted` son normales cuando OpenClaw finaliza un segmento capturado de un hablante; son diagnósticos detallados, no advertencias.
- Los registros detallados de voz de Discord incluyen una vista previa delimitada de una línea de la transcripción STT para cada segmento de hablante aceptado, de modo que la depuración muestre tanto el lado del usuario como el de la respuesta del agente sin volcar texto de transcripción sin límites.
- En el modo `agent-proxy`, la alternativa de consulta forzada omite los fragmentos de transcripción probablemente incompletos, como texto que termina en `...` o en un conector final como «y», así como cierres evidentemente no accionables como «ahora vuelvo» o «adiós». Los registros muestran `forced agent consult skipped reason=...` cuando esto evita una respuesta obsoleta en cola.

### Seguir a usuarios en la voz

Usa `voice.followUsers` cuando quieras que el bot de voz de Discord permanezca con uno o más usuarios conocidos de Discord, en lugar de unirse a un canal fijo al inicio o esperar a `/vc join`.

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

- `followUsers` acepta identificadores de usuario de Discord sin formato y valores `discord:<id>`. OpenClaw normaliza ambas formas antes de compararlas con los eventos de estado de voz.
- `followUsersEnabled` tiene como valor predeterminado `true` cuando se configura `followUsers`. Establécelo en `false` para conservar la lista guardada pero detener el seguimiento automático por voz.
- Cuando un usuario seguido se une a un canal de voz permitido, OpenClaw se une a ese canal. Cuando el usuario se mueve, OpenClaw se mueve con él. Cuando el usuario seguido activo se desconecta, OpenClaw abandona el canal.
- Si hay varios usuarios seguidos en el mismo servidor y el usuario seguido activo se marcha, OpenClaw se mueve al canal de otro usuario seguido antes de abandonar el servidor. Si varios usuarios seguidos se mueven a la vez, prevalece el último evento de estado de voz observado.
- `allowedChannels` sigue aplicándose. Se ignora a un usuario seguido que esté en un canal no permitido, y una sesión gestionada por seguimiento se mueve a otro usuario seguido o abandona el canal.
- OpenClaw concilia los eventos de estado de voz perdidos al inicio y en intervalos limitados. La conciliación toma muestras de los servidores configurados y limita las consultas REST por ejecución, por lo que las listas `followUsers` muy grandes pueden tardar más de un intervalo en converger.
- Si Discord o un administrador mueve el bot mientras este sigue a un usuario, OpenClaw reconstruye la sesión de voz y conserva la propiedad del seguimiento cuando el destino está permitido. Si el bot se mueve fuera de `allowedChannels`, OpenClaw abandona el canal y vuelve a unirse al destino configurado cuando existe uno.
- La recuperación de recepción de DAVE puede abandonar un canal y volver a unirse a él tras varios fallos de descifrado. Las sesiones gestionadas por seguimiento conservan la propiedad del seguimiento durante esa ruta de recuperación, por lo que una desconexión posterior del usuario seguido aún hace que se abandone el canal.

Elige entre los modos de unión:

- Usa `followUsers` para configuraciones personales o de operadores en las que el bot deba estar automáticamente en la voz cuando tú lo estés.
- Usa `autoJoin` para bots de salas fijas que deban estar presentes incluso cuando ningún usuario supervisado esté en la voz.
- Usa `/vc join` para uniones puntuales o salas donde la presencia automática por voz resultaría inesperada.

Códec de voz de Discord:

- Los registros de recepción de voz muestran `discord voice: opus decoder: libopus-wasm`.
- La reproducción en tiempo real codifica PCM estéreo sin procesar a 48 kHz en Opus con el mismo paquete `libopus-wasm` incluido antes de entregar los paquetes a `@discordjs/voice`.
- La reproducción desde archivos y flujos de proveedores transcodifica a PCM estéreo sin procesar a 48 kHz con ffmpeg y, después, usa `libopus-wasm` para el flujo de paquetes Opus enviado a Discord.

Canalización de STT más TTS:

- La captura PCM de Discord se convierte en un archivo WAV temporal.
- `tools.media.audio` se encarga de STT, por ejemplo, `openai/gpt-4o-mini-transcribe`.
- La transcripción se envía mediante la entrada y el enrutamiento de Discord mientras el LLM de respuesta se ejecuta con una política de salida de voz que oculta la herramienta `tts` del agente y solicita texto como respuesta, porque la voz de Discord controla la reproducción TTS final.
- `voice.model`, cuando está configurado, reemplaza únicamente el LLM de respuesta para este turno del canal de voz.
- `voice.tts` se combina sobre `messages.tts`; los proveedores con capacidad de transmisión alimentan directamente el reproductor; de lo contrario, el archivo de audio resultante se reproduce en el canal al que se ha unido.

Ejemplo predeterminado de sesión de canal de voz con proxy del agente:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Sin un bloque `voice.agentSession`, cada canal de voz obtiene su propia sesión enrutada de OpenClaw. Por ejemplo, `/vc join channel:234567890123456789` se comunica con la sesión correspondiente a ese canal de voz de Discord. El modelo en tiempo real es únicamente la interfaz de voz; las solicitudes sustanciales se entregan al agente de OpenClaw configurado. Si el modelo en tiempo real produce una transcripción final sin llamar a la herramienta de consulta, OpenClaw fuerza la consulta como mecanismo alternativo para que el comportamiento predeterminado siga siendo equivalente a hablar con el agente.

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

Ejemplo bidireccional en tiempo real:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
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
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

En el modo `agent-proxy`, el bot se une al canal de voz configurado, pero los turnos del agente de OpenClaw utilizan la sesión enrutada y el agente habituales del canal de destino. La sesión de voz en tiempo real reproduce oralmente el resultado devuelto en el canal de voz. El agente supervisor puede seguir usando las herramientas de mensajería habituales según su política de herramientas, incluido el envío de un mensaje independiente de Discord si esa es la acción adecuada.

Mientras una ejecución delegada de OpenClaw está activa, las nuevas transcripciones de voz de Discord se tratan como control en directo de la ejecución antes de iniciar otro turno del agente. Frases como «estado», «cancela eso», «usa la corrección más pequeña» o «cuando termines, revisa también las pruebas» se clasifican como entradas de estado, cancelación, orientación o seguimiento para la sesión activa. Los resultados de estado, cancelación, orientación aceptada y seguimiento se reproducen oralmente en el canal de voz para que la persona que llama sepa si OpenClaw gestionó la solicitud.

Formas de destino útiles:

- `target: "channel:123456789012345678"` enruta mediante una sesión de canal de texto de Discord.
- `target: "123456789012345678"` se trata como un destino de canal.
- `target: "dm:123456789012345678"` o `target: "user:123456789012345678"` enruta mediante esa sesión de mensaje directo.

Ejemplo de OpenAI Realtime para entornos con mucho eco:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
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

Use esta configuración cuando el modelo oiga su propia reproducción de Discord a través de un micrófono abierto, pero aun así quiera interrumpirlo hablando. OpenClaw evita que OpenAI interrumpa automáticamente en respuesta al audio de entrada sin procesar, mientras que `bargeIn: true` permite que los eventos de inicio de hablante de Discord y el audio de un hablante ya activo cancelen las respuestas activas en tiempo real antes de que el siguiente turno capturado llegue a OpenAI. Las señales de interrupción por voz muy tempranas cuyo `audioEndMs` sea inferior a `minBargeInAudioEndMs` se consideran probablemente eco o ruido y se ignoran para que el modelo no se corte en el primer fotograma de reproducción.

Registros de voz esperados:

- Al unirse: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Al iniciar el procesamiento en tiempo real: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Durante el audio del hablante: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` y `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Al omitir voz obsoleta: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` o `reason=non-actionable-closing ...`
- Al completarse la respuesta en tiempo real: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Al detener o restablecer la reproducción: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Durante una consulta en tiempo real: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Al recibir la respuesta del agente: `discord voice: agent turn answer ...`
- Al poner en cola una locución exacta: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, seguido de `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Al detectar una interrupción por voz: `discord voice: realtime barge-in detected source=speaker-start ...` o `discord voice: realtime barge-in detected source=active-speaker-audio ...`, seguido de `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Durante una interrupción en tiempo real: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, seguido de `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` o de `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Al ignorar eco o ruido: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Con la interrupción por voz deshabilitada: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Durante la reproducción inactiva: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Para depurar audio cortado, lea los registros de voz en tiempo real como una cronología:

1. `realtime audio playback started` significa que Discord ha comenzado a reproducir el audio del asistente. A partir de este punto, el puente comienza a contar los fragmentos de salida del asistente, los bytes PCM de Discord, los bytes en tiempo real del proveedor y la duración del audio sintetizado.
2. `realtime speaker turn opened` señala que un hablante de Discord ha pasado a estar activo. Si la reproducción ya está activa y `bargeIn` está habilitado, puede ir seguido de `barge-in detected source=speaker-start`.
3. `realtime input audio started` señala el primer fotograma de audio real recibido durante ese turno del hablante. Que aparezca `outputActive=true` o un valor de `outputAudioMs` distinto de cero significa que el micrófono está enviando entrada mientras la reproducción del asistente sigue activa.
4. `barge-in detected source=active-speaker-audio` significa que OpenClaw detectó audio en directo del hablante mientras la reproducción del asistente estaba activa. Esto resulta útil para distinguir una interrupción real de un evento de inicio de hablante de Discord sin audio útil.
5. `barge-in requested reason=...` significa que OpenClaw solicitó al proveedor en tiempo real cancelar o truncar la respuesta activa. Incluye `outputAudioMs`, `outputActive` y `playbackChunks` para que pueda ver cuánto audio del asistente se había reproducido realmente antes de la interrupción.
6. `realtime audio playback stopped reason=...` es el punto de restablecimiento de la reproducción local de Discord. El motivo indica quién detuvo la reproducción: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` o `session-close`.
7. `realtime speaker turn closed` resume el turno de entrada capturado. `chunks=0` o `hasAudio=false` significa que se abrió el turno del hablante, pero no llegó audio utilizable al puente en tiempo real. `interruptedPlayback=true` significa que ese turno de entrada coincidió con la salida del asistente y activó la lógica de interrupción por voz.

Campos útiles:

- `outputAudioMs`: duración del audio del asistente generado por el proveedor en tiempo real antes de la línea del registro.
- `audioMs`: duración del audio del asistente contabilizada por OpenClaw antes de que se detuviera la reproducción.
- `elapsedMs`: tiempo de reloj transcurrido entre la apertura y el cierre del flujo de reproducción o del turno del hablante.
- `discordBytes`: bytes PCM estéreo a 48 kHz enviados a la voz de Discord o recibidos de ella.
- `realtimeBytes`: bytes PCM con el formato del proveedor enviados al proveedor en tiempo real o recibidos de él.
- `playbackChunks`: fragmentos de audio del asistente reenviados a Discord para la respuesta activa.
- `sinceLastAudioMs`: intervalo entre el último fotograma de audio capturado del hablante y el cierre de su turno.

Patrones habituales:

- Un corte inmediato con `source=active-speaker-audio`, un valor pequeño de `outputAudioMs` y el mismo usuario cerca suele indicar que el eco del altavoz está entrando en el micrófono. Aumente `voice.realtime.minBargeInAudioEndMs`, reduzca el volumen del altavoz, use auriculares o establezca `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` seguido de `speaker turn closed ... hasAudio=false` significa que Discord informó del inicio de un hablante, pero no llegó audio a OpenClaw. Puede deberse a un evento transitorio de voz de Discord, al comportamiento de la puerta de ruido o a que un cliente activó brevemente el micrófono.
- `audio playback stopped reason=stream-close` sin una interrupción por voz cercana ni `provider-clear-audio` significa que el flujo de reproducción local de Discord terminó de forma inesperada. Revise los registros anteriores del proveedor y del reproductor de Discord.
- `capture ignored during playback (barge-in disabled)` significa que OpenClaw descartó intencionadamente la entrada mientras el audio del asistente estaba activo. Habilite `voice.realtime.bargeIn` si quiere que la voz interrumpa la reproducción.
- `barge-in ignored ... outputActive=false` significa que Discord o la detección de actividad de voz del proveedor detectaron voz, pero OpenClaw no tenía una reproducción activa que interrumpir. Esto no debería cortar el audio.

Las credenciales se resuelven por componente: autenticación de la ruta del LLM para `voice.model`, autenticación de STT para `tools.media.audio`, autenticación de TTS para `messages.tts`/`voice.tts` y autenticación del proveedor en tiempo real para `voice.realtime.providers` o la configuración de autenticación habitual del proveedor.

### Mensajes de voz

Los mensajes de voz de Discord muestran una vista previa de la forma de onda y requieren audio OGG/Opus. OpenClaw genera automáticamente la forma de onda, pero necesita `ffmpeg` y `ffprobe` en el host del Gateway para inspeccionar y convertir el audio.

- Proporcione una **ruta de archivo local** (las URL se rechazan).
- Omita el contenido de texto (Discord rechaza texto y mensaje de voz en la misma carga útil).
- Se acepta cualquier formato de audio; OpenClaw lo convierte a OGG/Opus cuando es necesario.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="Se usaron intenciones no permitidas o el bot no ve mensajes del servidor">

    - habilita Message Content Intent
    - habilita Server Members Intent cuando dependas de la resolución de usuarios/miembros
    - reinicia el Gateway después de cambiar los intents

  </Accordion>

  <Accordion title="Mensajes de servidores bloqueados inesperadamente">

    - verifica `groupPolicy`
    - verifica la lista de permitidos del servidor en `channels.discord.guilds`
    - si existe un mapa `channels` del servidor, solo se permiten los canales incluidos
    - verifica el comportamiento de `requireMention` y los patrones de mención

    Comprobaciones útiles:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="No se requiere una mención, pero sigue bloqueado">
    Causas comunes:

    - `groupPolicy="allowlist"` sin una lista de permitidos del servidor/canal coincidente
    - `requireMention` configurado en el lugar incorrecto (debe estar en `channels.discord.guilds` o en una entrada de canal)
    - remitente bloqueado por la lista de permitidos `users` del servidor/canal

  </Accordion>

  <Accordion title="Turnos prolongados de Discord o respuestas duplicadas">

    Registros habituales:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Controles de la cola del Gateway de Discord:

    - una sola cuenta: `channels.discord.eventQueue.listenerTimeout`
    - varias cuentas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - esto solo controla el trabajo del listener del Gateway de Discord, no la duración del turno del agente

    Discord no aplica un tiempo de espera propio del canal a los turnos de agentes en cola. Los listeners de mensajes delegan el trabajo de inmediato, y las ejecuciones de Discord en cola conservan el orden por sesión hasta que el ciclo de vida de la sesión, la herramienta o el entorno de ejecución completa o cancela el trabajo.

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
    OpenClaw obtiene los metadatos `/gateway/bot` de Discord antes de conectarse. Ante fallos transitorios, utiliza como alternativa la URL predeterminada del Gateway de Discord y limita la frecuencia de los mensajes en los registros.

    Controles del tiempo de espera de los metadatos:

    - una sola cuenta: `channels.discord.gatewayInfoTimeoutMs`
    - varias cuentas: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - alternativa mediante variable de entorno cuando la configuración no está definida: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - valor predeterminado: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Reinicios por tiempo de espera de READY del Gateway">
    OpenClaw espera el evento `READY` del Gateway de Discord durante el inicio y después de las reconexiones del entorno de ejecución. Las configuraciones con varias cuentas y un inicio escalonado pueden necesitar una ventana de espera de READY inicial más larga que la predeterminada.

    Controles del tiempo de espera de READY:

    - inicio con una sola cuenta: `channels.discord.gatewayReadyTimeoutMs`
    - inicio con varias cuentas: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - alternativa de inicio mediante variable de entorno cuando la configuración no está definida: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - valor predeterminado de inicio: `15000` (15 segundos), máximo: `120000`
    - entorno de ejecución con una sola cuenta: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - entorno de ejecución con varias cuentas: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - alternativa del entorno de ejecución mediante variable de entorno cuando la configuración no está definida: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - valor predeterminado del entorno de ejecución: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Discrepancias en la auditoría de permisos">
    Las comprobaciones de permisos de `channels status --probe` solo funcionan con identificadores numéricos de canales.

    Si utilizas claves de slug, la coincidencia en el entorno de ejecución puede seguir funcionando, pero la comprobación no puede verificar por completo los permisos.

  </Accordion>

  <Accordion title="Problemas con los mensajes directos y el emparejamiento">

    - mensajes directos deshabilitados: `channels.discord.dm.enabled=false`
    - política de mensajes directos deshabilitada: `channels.discord.dmPolicy="disabled"` (heredado: `channels.discord.dm.policy`)
    - aprobación de emparejamiento pendiente en el modo `pairing`

  </Accordion>

  <Accordion title="Bucles entre bots">
    De forma predeterminada, se ignoran los mensajes enviados por bots.

    Si estableces `channels.discord.allowBots=true`, utiliza reglas estrictas de menciones y listas de permitidos para evitar bucles.
    Es preferible usar `channels.discord.allowBots="mentions"` para aceptar únicamente mensajes de bots que mencionen al bot.

    OpenClaw también incluye [protección compartida contra bucles de bots](/es/channels/bot-loop-protection). Siempre que `allowBots` permita que los mensajes enviados por bots lleguen al despacho, Discord asigna el evento entrante a los datos `(cuenta, canal, pareja de bots)` y el mecanismo genérico de protección de parejas bloquea la pareja después de superar el presupuesto de eventos configurado. Este mecanismo evita los bucles descontrolados entre dos bots que antes debían detenerse mediante los límites de frecuencia de Discord; no afecta a las implementaciones con un solo bot ni a las respuestas puntuales de bots que se mantienen por debajo del presupuesto.

    Configuración predeterminada (activa cuando se establece `allowBots`):

    - `maxEventsPerWindow: 20` -- la pareja de bots puede intercambiar 20 mensajes dentro de la ventana deslizante
    - `windowSeconds: 60` -- duración de la ventana deslizante
    - `cooldownSeconds: 60` -- una vez superado el presupuesto, se descartan durante un minuto todos los mensajes adicionales entre los bots, en cualquier dirección

    Configura una sola vez el valor predeterminado compartido en `channels.defaults.botLoopProtection` y, después, sobrescribe la configuración de Discord cuando un flujo de trabajo legítimo necesite más margen. El orden de precedencia es:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - valores predeterminados integrados

    Discord utiliza las claves genéricas `maxEventsPerWindow`, `windowSeconds` y `cooldownSeconds`.

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
        alpha: {
          // Alpha listens to other bots only when they mention it.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Bravo write an Alpha Discord mention with the configured user id.
            Alpha: "ALPHA_DISCORD_USER_ID",
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

  <Accordion title="Interrupciones de STT de voz con DecryptionFailed(...)">

    - mantén OpenClaw actualizado (`openclaw update`) para disponer de la lógica de recuperación de recepción de voz de Discord
    - confirma que `channels.discord.voice.daveEncryption=true` (valor predeterminado)
    - comienza con `channels.discord.voice.decryptionFailureTolerance=24` (valor predeterminado del proyecto de origen) y ajústalo solo si es necesario
    - supervisa los registros en busca de:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si los fallos continúan después de la reincorporación automática, recopila los registros y compáralos con el historial de recepción de DAVE del proyecto de origen en [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) y [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referencia de configuración

Referencia principal: [Referencia de configuración: Discord](/es/gateway/config-channels#discord).

<Accordion title="Campos clave de Discord">

- inicio/autenticación: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comandos: `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- cola de eventos: `eventQueue.listenerTimeout` (presupuesto del listener, valor predeterminado `120000`), `eventQueue.maxQueueSize` (valor predeterminado `10000`), `eventQueue.maxConcurrency` (valor predeterminado `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- respuestas/historial: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit` (valor predeterminado `2000`), `maxLinesPerMessage` (valor predeterminado `17`)
- transmisión: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (las claves planas heredadas `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce` y `chunkMode` se migran a `streaming.*` mediante `openclaw doctor --fix`)
- contenido multimedia/reintentos: `mediaMaxMb` (limita las cargas salientes a Discord, valor predeterminado `100`), `retry`
- acciones: `actions.*`
- presencia: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- interfaz de usuario: `ui.components.accentColor`
- funciones: `threadBindings`, `bindings[]` de nivel superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Seguridad y operaciones

- Trata los tokens de bots como secretos (se recomienda `DISCORD_BOT_TOKEN` en entornos supervisados).
- Concede los permisos mínimos necesarios en Discord.
- Si el despliegue o el estado de los comandos está desactualizado, reinicia el Gateway y vuelve a comprobarlo con `openclaw channels status --probe`.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Discord con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de los chats grupales y las listas de permitidos.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enruta los mensajes entrantes a los agentes.
  </Card>
  <Card title="Seguridad" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y refuerzo de la seguridad.
  </Card>
  <Card title="Enrutamiento multiagente" icon="sitemap" href="/es/concepts/multi-agent">
    Asigna servidores y canales a los agentes.
  </Card>
  <Card title="Comandos de barra diagonal" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de los comandos nativos.
  </Card>
</CardGroup>
