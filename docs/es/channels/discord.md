---
read_when:
    - Trabajo en las funciones del canal de Discord
summary: Configuración del bot de Discord, claves de configuración, componentes, voz y solución de problemas
title: Discord
x-i18n:
    generated_at: "2026-07-12T14:17:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw se conecta a Discord como un bot a través del Gateway oficial de Discord. Se admiten los mensajes directos y los canales de servidores.

<CardGroup cols={3}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    Los mensajes directos de Discord usan de forma predeterminada el modo de vinculación.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de los comandos nativos y catálogo de comandos.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Flujo de diagnóstico y reparación entre canales.
  </Card>
</CardGroup>

## Configuración rápida

Cree una aplicación de Discord con un bot, añada el bot a su servidor y vincúlelo con OpenClaw. Use un servidor privado si es posible; [cree uno primero](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**) si es necesario.

<Steps>
  <Step title="Crear una aplicación y un bot de Discord">
    En el [Portal para desarrolladores de Discord](https://discord.com/developers/applications), haga clic en **New Application** y asígnele un nombre (por ejemplo, «OpenClaw»).

    Abra **Bot** en la barra lateral y establezca **Username** con el nombre de su agente.

  </Step>

  <Step title="Habilitar intents privilegiados">
    En la página **Bot**, en **Privileged Gateway Intents**, habilite:

    - **Message Content Intent** (obligatorio)
    - **Server Members Intent** (recomendado; obligatorio para las listas de permitidos por rol, la correspondencia de nombres con identificadores y los grupos de acceso de audiencia de los canales)
    - **Presence Intent** (opcional; solo para las actualizaciones de presencia)

  </Step>

  <Step title="Copiar el token del bot">
    En la página **Bot**, haga clic en **Reset Token** y copie el token.

    <Note>
    Pese al nombre, esto genera su primer token; no se está «restableciendo» nada.
    </Note>

  </Step>

  <Step title="Generar una URL de invitación y añadir el bot al servidor">
    Abra **OAuth2** en la barra lateral. En **OAuth2 URL Generator**, habilite los ámbitos:

    - `bot`
    - `applications.commands`

    En la sección **Bot Permissions** que aparece, habilite como mínimo:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcional)

    Esta es la configuración básica para los canales de texto normales. Si el bot va a publicar en hilos —incluidos los flujos de trabajo de foros o canales multimedia que crean o continúan un hilo—, habilite también **Send Messages in Threads**.

    Copie la URL generada, ábrala en un navegador, seleccione su servidor y haga clic en **Continue**. El bot debería aparecer ahora en su servidor.

  </Step>

  <Step title="Habilitar el modo de desarrollador y recopilar los identificadores">
    En la aplicación de Discord, habilite el modo de desarrollador para poder copiar los identificadores:

    1. **User Settings** (icono de engranaje) → **Developer** → active **Developer Mode**
       *(en dispositivos móviles: **App Settings** → **Advanced**)*
    2. Haga clic con el botón derecho en el **icono de su servidor** → **Copy Server ID**
    3. Haga clic con el botón derecho en su **propio avatar** → **Copy User ID**

    Guarde el identificador del servidor y el identificador de usuario junto con el token del bot; necesitará los tres a continuación.

  </Step>

  <Step title="Permitir mensajes directos de los miembros del servidor">
    Para que la vinculación funcione, Discord debe permitir que el bot le envíe mensajes directos. Haga clic con el botón derecho en el **icono de su servidor** → **Privacy Settings** → active **Direct Messages**.

    Mantenga esta opción activada si usa mensajes directos de Discord con OpenClaw. Si solo usa canales del servidor, puede desactivarla después de la vinculación.

  </Step>

  <Step title="Configurar el token del bot de forma segura (no enviarlo por el chat)">
    El token del bot es un secreto. Configúrelo en la máquina que ejecuta OpenClaw antes de enviar mensajes a su agente:

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

    Si OpenClaw ya se ejecuta como servicio en segundo plano, reinícielo mediante la aplicación de OpenClaw para Mac o deteniendo y reiniciando el proceso `openclaw gateway run`.
    En las instalaciones como servicio administrado, ejecute `openclaw gateway install` desde un shell donde esté configurada `DISCORD_BOT_TOKEN`, o almacene la variable en `~/.openclaw/.env` para que el servicio pueda resolver la SecretRef del entorno después del reinicio.
    Si Discord bloquea o limita por frecuencia la consulta inicial de la aplicación desde su host, configure el identificador de aplicación/cliente del Portal para desarrolladores para que el inicio pueda omitir esa llamada REST: `channels.discord.applicationId` para la cuenta predeterminada o `channels.discord.accounts.<accountId>.applicationId` para cada bot.

  </Step>

  <Step title="Configurar OpenClaw y realizar la vinculación">

    <Tabs>
      <Tab title="Preguntar al agente">
        Converse con su agente de OpenClaw en un canal existente (por ejemplo, Telegram) e indíqueselo. Si Discord es su primer canal, use en su lugar la pestaña de CLI/configuración.

        > «Ya configuré el token de mi bot de Discord. Completa la configuración de Discord con el identificador de usuario `<user_id>` y el identificador del servidor `<server_id>`.»
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

        Alternativa mediante el entorno para la cuenta predeterminada:

```bash
DISCORD_BOT_TOKEN=...
```

        Para una configuración automatizada o remota, escriba el mismo bloque JSON5 con `openclaw config patch --file ./discord.patch.json5 --dry-run` y vuelva a ejecutarlo sin `--dry-run`. También se admiten cadenas `token` de texto sin formato y valores SecretRef para `channels.discord.token` mediante proveedores de entorno, archivo o ejecución. Consulte [Gestión de secretos](/es/gateway/secrets).

        Para varios bots de Discord, mantenga el token y el identificador de aplicación de cada bot en su cuenta. Las cuentas heredan un `channels.discord.applicationId` de nivel superior, así que configúrelo allí únicamente cuando todas las cuentas usen el mismo identificador de aplicación.

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

  <Step title="Aprobar la primera vinculación por mensaje directo">
    Una vez que el Gateway esté en ejecución, envíe un mensaje directo a su bot en Discord. Este responderá con un código de vinculación.

    <Tabs>
      <Tab title="Preguntar al agente">
        Envíe el código de vinculación a su agente por el canal existente:

        > «Aprueba este código de vinculación de Discord: `<CODE>`»
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Los códigos de vinculación caducan después de 1 hora. Tras la aprobación, converse con su agente mediante un mensaje directo de Discord.

  </Step>
</Steps>

<Note>
La resolución de tokens tiene en cuenta la cuenta. Los valores de token de la configuración tienen prioridad sobre la alternativa del entorno, y `DISCORD_BOT_TOKEN` solo se usa para la cuenta predeterminada.
Si dos cuentas de Discord habilitadas se resuelven al mismo token de bot, OpenClaw inicia un solo monitor del Gateway para ese token: un token procedente de la configuración tiene prioridad sobre la alternativa del entorno; de lo contrario, prevalece la primera cuenta habilitada y la cuenta duplicada se marca como deshabilitada con el motivo `duplicate bot token`.
Para llamadas salientes avanzadas (herramienta de mensajes/acciones de canal), se usa un `token` explícito por llamada. Esto se aplica tanto al envío como a las acciones de lectura/sondeo (lectura/búsqueda/obtención/hilos/mensajes fijados/permisos). La configuración de directivas y reintentos de la cuenta sigue procediendo de la cuenta seleccionada en la instantánea activa del entorno de ejecución.
</Note>

## Recomendación: configurar un espacio de trabajo en un servidor

Cuando los mensajes directos funcionen, puede convertir su servidor en un espacio de trabajo completo en el que cada canal tenga su propia sesión del agente con su propio contexto. Se recomienda para servidores privados donde solo estén usted y su bot.

<Steps>
  <Step title="Añadir el servidor a la lista de permitidos de servidores">
    Esto permite que su agente responda en cualquier canal de su servidor, no solo en los mensajes directos.

    <Tabs>
      <Tab title="Preguntar al agente">
        > «Añade el identificador de mi servidor de Discord `<server_id>` a la lista de permitidos de servidores»
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
    De forma predeterminada, el agente solo responde en los canales del servidor cuando se le @menciona. En un servidor privado, probablemente convenga que responda a todos los mensajes.

    En los canales del servidor, las respuestas normales se publican automáticamente de forma predeterminada. Para salas compartidas siempre activas, habilite `messages.groupChat.visibleReplies: "message_tool"` para que el agente pueda observar sin intervenir y solo publique cuando determine que una respuesta en el canal resulta útil. Esto funciona mejor con modelos de última generación y fiables en el uso de herramientas, como GPT-5.6 Sol. Los eventos ambientales de la sala permanecen en silencio salvo que la herramienta realice un envío. Consulte [Eventos ambientales de sala](/es/channels/ambient-room-events) para obtener la configuración completa del modo de observación.

    Si Discord muestra que se está escribiendo y los registros indican uso de tokens, pero no aparece ningún mensaje publicado, compruebe si el turno se configuró como un evento ambiental de sala o si se habilitaron las respuestas visibles mediante la herramienta de mensajes.

    <Tabs>
      <Tab title="Preguntar al agente">
        > «Permite que mi agente responda en este servidor sin que sea necesario @mencionarlo»
      </Tab>
      <Tab title="Configuración">
        Establezca `requireMention: false` en la configuración del servidor:

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

        Para exigir envíos mediante la herramienta de mensajes en las respuestas visibles de grupos/canales, establezca `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planificar la memoria en los canales del servidor">
    La memoria a largo plazo (MEMORY.md) solo se carga automáticamente en las sesiones de mensajes directos; los canales del servidor no la cargan.

    <Tabs>
      <Tab title="Preguntar al agente">
        > «Cuando haga preguntas en canales de Discord, usa memory_search o memory_get si necesitas contexto a largo plazo de MEMORY.md.»
      </Tab>
      <Tab title="Manual">
        Para disponer de contexto compartido en todos los canales, coloque instrucciones estables en `AGENTS.md` o `USER.md` (se incorporan en cada sesión). Mantenga las notas a largo plazo en `MEMORY.md` y acceda a ellas cuando sea necesario mediante las herramientas de memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ahora cree canales y empiece a conversar. El agente ve el nombre del canal y cada canal es una sesión aislada; configure `#coding`, `#home`, `#research` o lo que mejor se adapte a su flujo de trabajo.

## Modelo de entorno de ejecución

- El Gateway controla la conexión con Discord.
- El enrutamiento de las respuestas es determinista: las respuestas a mensajes entrantes de Discord vuelven a Discord.
- Los metadatos del servidor/canal de Discord se añaden al prompt del modelo como contexto no fiable, no como un prefijo de respuesta visible para el usuario. Si un modelo vuelve a copiar ese envoltorio, OpenClaw elimina los metadatos copiados de las respuestas salientes y del contexto de reproducción futuro.
- De forma predeterminada (`session.dmScope=main`), los chats directos comparten la sesión principal del agente (`agent:main:main`).
- Los canales del servidor tienen claves de sesión aisladas (`agent:<agentId>:discord:channel:<channelId>`).
- Los mensajes directos grupales se ignoran de forma predeterminada (`channels.discord.dm.groupEnabled=false`).
- Los comandos de barra nativos se ejecutan en sesiones de comandos aisladas (`agent:<agentId>:discord:slash:<userId>`), aunque siguen incluyendo `CommandTargetSessionKey` para la sesión de conversación enrutada.
- La entrega a Discord de anuncios de Cron/Heartbeat que solo contienen texto se reduce a la respuesta final visible del asistente, que se envía una sola vez. Los contenidos multimedia y las cargas útiles de componentes estructurados siguen usando varios mensajes cuando el agente emite varias cargas útiles entregables.

## Canales de foro

Los canales de foro y multimedia de Discord solo aceptan publicaciones en hilos. OpenClaw admite dos formas de crearlas:

- Envía un mensaje al canal principal del foro (`channel:<forumId>`) para crear automáticamente un hilo. El título del hilo es la primera línea no vacía del mensaje (truncada al límite de Discord de 100 caracteres para el nombre del hilo).
- Usa `openclaw message thread create` para crear un hilo directamente. No pases `--message-id` para los canales de foro.

Envía un mensaje al canal principal del foro para crear un hilo:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Título del tema\nCuerpo de la publicación"
```

Crea explícitamente un hilo de foro:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Título del tema" --message "Cuerpo de la publicación"
```

Los canales principales de los foros no aceptan componentes de Discord. Si necesitas componentes, envía el mensaje al propio hilo (`channel:<threadId>`).

## Componentes interactivos

OpenClaw admite contenedores de componentes v2 de Discord para los mensajes del agente. Usa la herramienta de mensajes con una carga útil `components`. Los resultados de las interacciones se redirigen al agente como mensajes entrantes normales y siguen la configuración existente de `replyToMode` de Discord.

Bloques compatibles:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Las filas de acciones permiten hasta 5 botones o un único menú de selección
- Tipos de selección: `string`, `user`, `role`, `mentionable`, `channel`

De forma predeterminada, los componentes son de un solo uso. Establece `components.reusable=true` para permitir que los botones, las selecciones y los formularios se usen varias veces hasta que caduquen.

Para restringir quién puede hacer clic en un botón, establece `allowedUsers` en ese botón (identificadores de usuario de Discord, etiquetas o `*`). Los usuarios que no coincidan reciben una denegación efímera.

Las devoluciones de llamada de los componentes caducan después de 30 minutos de forma predeterminada. Establece `channels.discord.agentComponents.ttlMs` para cambiar la duración del registro de devoluciones de llamada de la cuenta predeterminada, o `channels.discord.accounts.<accountId>.agentComponents.ttlMs` para cada cuenta. El valor se expresa en milisegundos, debe ser un entero positivo y tiene un límite de `86400000` (24 horas). Los TTL más largos son adecuados para flujos de revisión o aprobación que requieren que los botones sigan siendo utilizables, pero amplían el periodo durante el cual un mensaje antiguo de Discord todavía puede activar una acción. Usa el TTL más corto que resulte adecuado y conserva el valor predeterminado cuando las devoluciones de llamada obsoletas puedan resultar inesperadas.

Los comandos de barra `/model` y `/models` abren un selector de modelos interactivo con listas desplegables de proveedor, modelo y entorno de ejecución compatible, además de un paso Submit. `/models add` está obsoleto y devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat. La respuesta del selector es efímera y solo puede usarla el usuario que lo invocó. Los menús de selección de Discord están limitados a 25 opciones, por lo que debes añadir entradas `provider/*` a `agents.defaults.models` cuando quieras que el selector muestre modelos descubiertos dinámicamente solo para determinados proveedores, como `openai` o `vllm`.

Archivos adjuntos:

- Los bloques `file` deben apuntar a una referencia de archivo adjunto (`attachment://<filename>`)
- Proporciona el archivo adjunto mediante `media`/`path`/`filePath` (un solo archivo); usa `media-gallery` para varios archivos
- Usa `filename` para reemplazar el nombre de carga cuando deba coincidir con la referencia del archivo adjunto

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
  message: "Texto alternativo opcional",
  components: {
    reusable: true,
    text: "Elige una ruta",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Aprobar",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Rechazar", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Elige una opción",
          options: [
            { label: "Opción A", value: "a" },
            { label: "Opción B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Detalles",
      triggerLabel: "Abrir formulario",
      fields: [
        { type: "text", label: "Solicitante" },
        {
          type: "select",
          label: "Prioridad",
          options: [
            { label: "Baja", value: "low" },
            { label: "Alta", value: "high" },
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
    `channels.discord.dmPolicy` controla el acceso a los mensajes directos. `channels.discord.allowFrom` es la lista de permitidos canónica para los mensajes directos.

    - `pairing` (predeterminado)
    - `allowlist` (requiere al menos un remitente en `allowFrom`)
    - `open` (requiere que `channels.discord.allowFrom` incluya `"*"`)
    - `disabled`

    Si la política de mensajes directos no está abierta, los usuarios desconocidos se bloquean (o se les solicita el emparejamiento en el modo `pairing`).

    Precedencia para varias cuentas:

    - `channels.discord.accounts.default.allowFrom` se aplica únicamente a la cuenta `default`.
    - Para una cuenta, `allowFrom` tiene precedencia sobre el valor heredado `dm.allowFrom`.
    - Las cuentas con nombre heredan `channels.discord.allowFrom` cuando no tienen definidos sus propios valores `allowFrom` ni el valor heredado `dm.allowFrom`.
    - Las cuentas con nombre no heredan `channels.discord.accounts.default.allowFrom`.

    Los valores heredados `channels.discord.dm.policy` y `channels.discord.dm.allowFrom` todavía se leen por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    Formato del destino de mensajes directos para la entrega:

    - `user:<id>`
    - Mención `<@id>`

    Los identificadores numéricos sin prefijo normalmente se resuelven como identificadores de canal cuando hay un canal predeterminado activo, pero los identificadores incluidos en la lista de mensajes directos `allowFrom` efectiva de la cuenta se tratan como destinos de mensajes directos de usuarios por compatibilidad.

  </Tab>

  <Tab title="Grupos de acceso">
    Los mensajes directos de Discord y la autorización de comandos de texto pueden usar entradas dinámicas `accessGroup:<name>` en `channels.discord.allowFrom`.

    Los nombres de grupos de acceso se comparten entre los canales de mensajes. Usa `type: "message.senders"` para un grupo estático cuyos miembros se expresen mediante la sintaxis habitual de `allowFrom` de cada canal, o `type: "discord.channelAudience"` cuando la audiencia `ViewChannel` actual de un canal de Discord deba definir la pertenencia de forma dinámica. Comportamiento compartido de los grupos de acceso: [Grupos de acceso](/es/channels/access-groups).

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

    Un canal de texto de Discord no tiene una lista de miembros independiente. `type: "discord.channelAudience"` modela la pertenencia de la siguiente manera: el remitente del mensaje directo es miembro del servidor configurado y actualmente tiene el permiso efectivo `ViewChannel` en el canal configurado después de aplicar los roles y las sobrescrituras del canal.

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

    Las búsquedas aplican denegación de forma predeterminada. Si Discord devuelve `Missing Access`, falla la búsqueda del miembro o el canal pertenece a otro servidor, el remitente del mensaje directo se considera no autorizado.

    Activa **Server Members Intent** en Discord Developer Portal cuando uses grupos de acceso basados en la audiencia del canal. Los mensajes directos no incluyen el estado de miembro del servidor, por lo que OpenClaw resuelve el miembro mediante la API REST de Discord en el momento de la autorización.

  </Tab>

  <Tab title="Política de servidores">
    La gestión de servidores se controla mediante `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La configuración base segura cuando existe `channels.discord` es `allowlist`.

    Comportamiento de `allowlist`:

    - el servidor debe coincidir con `channels.discord.guilds` (se prefiere `id`, aunque también se acepta el slug)
    - listas de remitentes permitidos opcionales: `users` (se recomiendan identificadores estables) y `roles` (solo identificadores de roles); si se configura cualquiera de ellas, los remitentes se permiten cuando coinciden con `users` O con `roles`
    - la coincidencia directa por nombre o etiqueta está desactivada de forma predeterminada; activa `channels.discord.dangerouslyAllowNameMatching: true` únicamente como modo de compatibilidad de emergencia
    - se admiten nombres y etiquetas en `users`, pero los identificadores son más seguros; `openclaw security audit` muestra una advertencia cuando se usan entradas de nombre o etiqueta
    - si un servidor tiene configurado `channels`, se rechazan los canales que no figuren en la lista
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

    Si solo estableces `DISCORD_BOT_TOKEN` y no creas un bloque `channels.discord`, el comportamiento alternativo en tiempo de ejecución es `groupPolicy="allowlist"` (con una advertencia en los registros), aunque `channels.defaults.groupPolicy` sea `open`.

  </Tab>

  <Tab title="Menciones y mensajes directos de grupo">
    Los mensajes de los servidores requieren una mención de forma predeterminada.

    La detección de menciones incluye:

    - mención explícita del bot
    - patrones de mención configurados (`agents.list[].groupChat.mentionPatterns`, con `messages.groupChat.mentionPatterns` como alternativa)
    - comportamiento implícito de respuesta al bot en los casos compatibles

    Al redactar mensajes salientes de Discord, usa la sintaxis canónica de menciones: `<@USER_ID>` para usuarios, `<#CHANNEL_ID>` para canales y `<@&ROLE_ID>` para roles. No uses la forma heredada de mención de apodo `<@!USER_ID>`.

    `requireMention` se configura para cada servidor o canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` descarta opcionalmente los mensajes que mencionen a otro usuario o rol, pero no al bot (se excluyen @everyone/@here).

    Mensajes directos de grupo:

    - valor predeterminado: se ignoran (`dm.groupEnabled=false`)
    - lista de permitidos opcional mediante `dm.groupChannels` (identificadores de canal o slugs)

  </Tab>
</Tabs>

### Enrutamiento de agentes basado en roles

Usa `bindings[].match.roles` para dirigir a los miembros de servidores de Discord a distintos agentes según el identificador del rol. Las vinculaciones basadas en roles solo aceptan identificadores de roles y se evalúan después de las vinculaciones de pares o pares principales y antes de las vinculaciones exclusivas del servidor. Si una vinculación también establece otros campos de coincidencia (por ejemplo, `peer` + `guildId` + `roles`), todos los campos configurados deben coincidir.

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
  - `commands.native=false` omite el registro y la limpieza de los comandos de barra de Discord durante el inicio. Los comandos registrados anteriormente pueden seguir visibles en Discord hasta que se eliminen de la aplicación de Discord.
  - La autenticación de comandos nativos utiliza las mismas listas de permitidos y políticas de Discord que el procesamiento normal de mensajes.
  - Los comandos pueden seguir visibles en la interfaz de Discord para usuarios no autorizados; al ejecutarlos, se aplica la autenticación de OpenClaw y se responde "no autorizado".
  - Configuración predeterminada de los comandos de barra: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

  Consulte [Comandos de barra](/es/tools/slash-commands) para conocer el catálogo y el comportamiento de los comandos.

  ## Detalles de las funciones

  <AccordionGroup>
  <Accordion title="Etiquetas de respuesta y respuestas nativas">
    Discord admite etiquetas de respuesta en la salida del agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Se controla mediante `channels.discord.replyToMode`:

    - `off` (valor predeterminado): no se crean hilos de respuesta implícitos; las etiquetas `[[reply_to_*]]` explícitas se siguen respetando
    - `first`: adjunta la referencia implícita de respuesta nativa al primer mensaje saliente de Discord del turno
    - `all`: la adjunta a todos los mensajes salientes
    - `batched`: la adjunta solo cuando el evento entrante era un lote agrupado mediante antirrebote de varios mensajes; resulta útil cuando se desean respuestas nativas principalmente para chats ambiguos con ráfagas de mensajes, no para cada turno de un solo mensaje

    Los identificadores de los mensajes se incluyen en el contexto y el historial para que los agentes puedan dirigirse a mensajes específicos.

  </Accordion>

  <Accordion title="Vistas previas de enlaces">
    Discord genera de forma predeterminada inserciones enriquecidas para las URL. OpenClaw suprime de forma predeterminada esas inserciones generadas en los mensajes salientes de Discord, por lo que las URL enviadas por el agente permanecen como enlaces simples, a menos que se habiliten explícitamente:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Establezca `channels.discord.accounts.<id>.suppressEmbeds` para anular la configuración de una cuenta. Los envíos del agente mediante la herramienta de mensajes también pueden pasar `suppressEmbeds: false` para un solo mensaje. Las cargas útiles explícitas de `embeds` de Discord no se suprimen mediante la configuración predeterminada de vistas previas de enlaces.

  </Accordion>

  <Accordion title="Vista previa de transmisión en directo">
    OpenClaw puede transmitir borradores de respuestas enviando un mensaje temporal y editándolo a medida que llega el texto. `channels.discord.streaming.mode` acepta `off` | `partial` | `block` | `progress` (valor predeterminado cuando no se establece ninguna clave `streaming` ni la clave heredada `streamMode`). `streamMode` es un alias heredado; ejecute `openclaw doctor --fix` para reescribir la configuración persistente con la estructura anidada canónica `streaming`.

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

    - `off` desactiva las ediciones de la vista previa de Discord.
    - `partial` edita un único mensaje de vista previa a medida que llegan los tokens.
    - `block` emite fragmentos del tamaño de un borrador; ajuste el tamaño y los puntos de corte con `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), limitado a `textChunkLimit`. Cuando la transmisión por bloques se habilita explícitamente, OpenClaw omite la transmisión de vista previa para evitar una transmisión duplicada.
    - `progress` mantiene un borrador de estado editable y lo actualiza con el progreso de las herramientas hasta la entrega final; la etiqueta inicial compartida es una línea móvil, por lo que desaparece al desplazarse, al igual que el resto, cuando aparece suficiente actividad.
    - Los resultados finales con contenido multimedia, errores y respuestas explícitas cancelan las ediciones pendientes de la vista previa.
    - `streaming.preview.toolProgress` (valor predeterminado: `true`) controla si las actualizaciones de herramientas y progreso reutilizan el mensaje de vista previa.
    - Las filas de herramientas y progreso se muestran, cuando están disponibles, como un emoji compacto + título + detalle; por ejemplo, `🛠️ Bash: run tests` o `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (valor predeterminado: `false`) permite incluir el texto de comentarios o preámbulo del asistente en el borrador temporal de progreso. Los comentarios se depuran antes de mostrarse, permanecen de forma transitoria y no modifican la entrega de la respuesta final.
    - `streaming.progress.maxLineChars` controla el límite por línea de la vista previa de progreso. El texto se acorta en los límites entre palabras; los detalles de comandos y rutas conservan los sufijos útiles.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controla los detalles de comandos y ejecución en las líneas compactas de progreso: `raw` (valor predeterminado) o `status` (solo la etiqueta de la herramienta).

    Oculta el texto sin procesar de comandos/ejecución mientras mantienes líneas de progreso compactas:

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

    La transmisión de vista previa solo admite texto; las respuestas con contenido multimedia recurren a la entrega normal.

  </Accordion>

  <Accordion title="Historial, contexto y comportamiento de los hilos">
    Contexto del historial del servidor:

    - `channels.discord.historyLimit` tiene como valor predeterminado `20`
    - alternativa: `messages.groupChat.historyLimit`
    - `0` lo desactiva

    Controles del historial de mensajes directos:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamiento de los hilos:

    - Los hilos de Discord se enrutan como sesiones de canal y heredan la configuración del canal principal, salvo que se anule.
    - Las sesiones de hilo heredan la selección de `/model` de nivel de sesión del canal principal únicamente como alternativa de modelo; las selecciones de `/model` locales del hilo tienen prioridad y el historial de transcripciones principal no se copia a menos que esté habilitada la herencia de transcripciones.
    - `channels.discord.thread.inheritParent` (valor predeterminado: `false`) permite que los nuevos hilos automáticos se inicialicen a partir de la transcripción principal. Anulación por cuenta: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Las reacciones de la herramienta de mensajes pueden resolver destinos de mensajes directos `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` se conserva durante la activación alternativa en la fase de respuesta.

    Los temas de los canales se insertan como contexto **no fiable**. Las listas de permitidos limitan quién puede activar el agente; no constituyen un límite completo de ocultación del contexto complementario.

  </Accordion>

  <Accordion title="Sesiones vinculadas a hilos para subagentes">
    Discord puede vincular un hilo a un destino de sesión para que los mensajes posteriores de ese hilo sigan enrutándose a la misma sesión (incluidas las sesiones de subagentes).

    Comandos:

    - `/focus <target>` vincula el hilo actual/nuevo a un destino de subagente/sesión
    - `/unfocus` elimina la vinculación del hilo actual
    - `/agents` muestra las ejecuciones activas y el estado de vinculación
    - `/session idle <duration|off>` consulta/actualiza la desvinculación automática por inactividad de las vinculaciones enfocadas
    - `/session max-age <duration|off>` consulta/actualiza la antigüedad máxima estricta de las vinculaciones enfocadas

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

    - `session.threadBindings.*` establece los valores predeterminados globales; `channels.discord.threadBindings.*` sobrescribe el comportamiento de Discord.
    - `spawnSessions` controla la creación y vinculación automáticas de hilos para `sessions_spawn({ thread: true })` y la creación de hilos de ACP. Valor predeterminado: `true`.
    - `defaultSpawnContext` controla el contexto nativo del subagente para las creaciones vinculadas a hilos. Valor predeterminado: `"fork"`.
    - Las claves obsoletas `spawnSubagentSessions`/`spawnAcpSessions` se migran mediante `openclaw doctor --fix`.
    - Si las vinculaciones de hilos están deshabilitadas para una cuenta, `/focus` y las operaciones relacionadas de vinculación de hilos no están disponibles.

    Consulte [Subagentes](/es/tools/subagents), [Agentes ACP](/es/tools/acp-agents) y [Referencia de configuración](/es/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Vinculaciones persistentes de canales ACP">
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
    - En un canal o hilo vinculado, `/new` y `/reset` restablecen la misma sesión ACP en el mismo lugar. Las vinculaciones temporales de hilos pueden sobrescribir la resolución del destino mientras estén activas.
    - `spawnSessions` controla la creación y vinculación de hilos secundarios mediante `--thread auto|here`.

    Consulte [Agentes ACP](/es/tools/acp-agents) para obtener información detallada sobre el comportamiento de las vinculaciones.

  </Accordion>

  <Accordion title="Notificaciones de reacciones">
    Modo de notificación de reacciones por servidor (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (valor predeterminado)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Los eventos de reacción se convierten en eventos del sistema y se adjuntan a la sesión de Discord a la que se han dirigido.

  </Accordion>

  <Accordion title="Reacciones de confirmación">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - emoji de reserva de la identidad del agente (`agents.list[].identity.emoji`; de lo contrario, "👀")

    Notas:

    - Discord acepta emojis Unicode o nombres de emojis personalizados.
    - Use `""` para deshabilitar la reacción en un canal o una cuenta.

    **Ámbito (`messages.ackReactionScope`):**

    Valores: `"all"` (mensajes directos + grupos, incluidos los eventos ambientales de salas), `"direct"` (solo mensajes directos), `"group-all"` (todos los mensajes de grupo excepto los eventos ambientales de salas; sin mensajes directos), `"group-mentions"` (grupos cuando se menciona al bot; **sin mensajes directos**, valor predeterminado), `"off"` / `"none"` (deshabilitado).

    <Note>
    El ámbito predeterminado (`"group-mentions"`) no activa reacciones de confirmación en mensajes directos ni en eventos ambientales de salas. Para obtener una reacción de confirmación en los mensajes directos entrantes de Discord y en los eventos de salas sin actividad, establezca `messages.ackReactionScope` en `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Escrituras de configuración">
    Las escrituras de configuración iniciadas desde el canal están habilitadas de forma predeterminada. Esto afecta a los flujos de `/config set|unset` (cuando las funciones de comandos están habilitadas).

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

  <Accordion title="Proxy del Gateway">
    Enrute el tráfico WebSocket del Gateway de Discord y las consultas REST de inicio (ID de aplicación + resolución de la lista de permitidos) mediante un proxy HTTP(S) con `channels.discord.proxy`.
    El uso de proxy para WebSocket del Gateway de Discord es explícito; las conexiones WebSocket no heredan las variables de entorno de proxy del proceso del Gateway. Las consultas REST de inicio usan este proxy cuando se configura `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Sobrescritura por cuenta:

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
    Habilite la resolución de PluralKit para asignar los mensajes enviados mediante proxy a la identidad del miembro del sistema:

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
    - los nombres para mostrar de los miembros solo se comparan por nombre/slug cuando `channels.discord.dangerouslyAllowNameMatching: true`
    - las consultas acceden a la API de PluralKit con el ID del mensaje original
    - si la consulta falla, los mensajes enviados mediante proxy se tratan como mensajes de bot y se descartan, salvo que `allowBots` permita su paso

  </Accordion>

  <Accordion title="Alias de menciones salientes">
    Use `mentionAliases` cuando los agentes necesiten menciones salientes deterministas para usuarios conocidos de Discord. Las claves son identificadores sin la `@` inicial; los valores son ID de usuario de Discord. Los identificadores desconocidos, `@everyone`, `@here` y las menciones dentro de fragmentos de código Markdown se dejan sin cambios.

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
    Las actualizaciones de presencia se aplican cuando se establece un campo de estado o actividad, o cuando se habilita la presencia automática.

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
    - 4: Personalizado (usa el texto de la actividad como estado; el emoji es opcional)
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
    Discord admite la gestión de aprobaciones mediante botones en mensajes directos y, de manera opcional, puede publicar solicitudes de aprobación en el canal de origen.

    Ruta de configuración:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando es posible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, valor predeterminado: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord habilita automáticamente las aprobaciones nativas de ejecución cuando `enabled` no está establecido o es `"auto"` y se puede determinar al menos un aprobador, ya sea desde `execApprovals.approvers` o desde `commands.ownerAllowFrom`. Discord no deduce aprobadores de ejecución a partir del `allowFrom` del canal, el `dm.allowFrom` heredado ni el `defaultTo` de los mensajes directos. Establezca `enabled: false` para deshabilitar explícitamente Discord como cliente de aprobación nativo.

    Para comandos de grupo confidenciales y exclusivos del propietario, como `/diagnostics` y `/export-trajectory`, OpenClaw envía de forma privada las solicitudes de aprobación y los resultados finales. Primero intenta usar un mensaje directo de Discord cuando el propietario que invoca el comando dispone de una ruta de propietario de Discord; de lo contrario, recurre a la primera ruta de propietario disponible en `commands.ownerAllowFrom`, como Telegram.

    Cuando `target` es `channel` o `both`, la solicitud de aprobación es visible en el canal. Solo los aprobadores determinados pueden usar los botones; los demás usuarios reciben una denegación efímera. Las solicitudes de aprobación incluyen el texto del comando, por lo que la entrega en el canal solo debe habilitarse en canales de confianza. Si el ID del canal no puede obtenerse de la clave de sesión, OpenClaw recurre a la entrega mediante mensaje directo.

    Discord representa los botones de aprobación compartidos que usan otros canales de chat; el adaptador nativo de Discord añade principalmente el enrutamiento de mensajes directos a los aprobadores y la distribución en canales. Cuando esos botones están presentes, constituyen la experiencia principal de aprobación; OpenClaw solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique que las aprobaciones por chat no están disponibles o que la aprobación manual es la única opción. Si el entorno de ejecución de aprobación nativo de Discord no está activo, OpenClaw mantiene visible la solicitud local y determinista `/approve <id> <decision>`. Si el entorno de ejecución está activo, pero no se puede entregar una tarjeta nativa a ningún destino, OpenClaw envía un aviso alternativo en el mismo chat con el comando `/approve` exacto de la aprobación pendiente.

    La autenticación del Gateway y la resolución de aprobaciones siguen el contrato compartido del cliente del Gateway (los ID `plugin:` se resuelven mediante `plugin.approval.resolve`; los demás ID, mediante `exec.approval.resolve`). De forma predeterminada, las aprobaciones caducan después de 30 minutos.

    Consulte [Aprobaciones de ejecución](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Herramientas y controles de acciones

Las acciones de mensajes de Discord abarcan mensajería, administración de canales, moderación, presencia y metadatos.

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

## Interfaz de usuario de componentes v2

OpenClaw usa los componentes v2 de Discord para las aprobaciones de ejecución y los marcadores entre contextos. Las acciones de mensajes de Discord también pueden aceptar `components` para interfaces de usuario personalizadas (uso avanzado; requiere construir una carga útil de componentes mediante la herramienta de Discord), mientras que los `embeds` heredados siguen disponibles, pero no se recomiendan.

- `channels.discord.ui.components.accentColor` establece el color de énfasis usado por los contenedores de componentes de Discord (hexadecimal). Por cuenta: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` controla durante cuánto tiempo permanecen registrados los callbacks de los componentes de Discord enviados (valor predeterminado `1800000`, máximo `86400000`). Por cuenta: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- Los `embeds` se ignoran cuando hay componentes v2 presentes.
- Las vistas previas de URL simples se suprimen de forma predeterminada. Establezca `suppressEmbeds: false` en una acción de mensaje cuando se deba expandir un único enlace saliente.

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

1. Habilite Message Content Intent en Discord Developer Portal.
2. Habilite Server Members Intent cuando se usen listas de permitidos de roles/usuarios.
3. Invite al bot con los ámbitos `bot` y `applications.commands`.
4. Conceda Connect, Speak, Send Messages y Read Message History en el canal de voz de destino.
5. Habilite los comandos nativos (`commands.native` o `channels.discord.commands.native`).
6. Configure `channels.discord.voice`.

Use `/vc join|leave|status` para controlar las sesiones. El comando usa el agente predeterminado de la cuenta y sigue las mismas reglas de listas de permitidos y políticas de grupo que los demás comandos de Discord.

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

- La voz de Discord es opcional para las configuraciones de solo texto; establezca `channels.discord.voice.enabled=true` (o conserve un bloque `channels.discord.voice` existente) para habilitar los comandos `/vc`, el entorno de ejecución de voz y la intención `GuildVoiceStates` del Gateway. `channels.discord.intents.voiceStates` puede sobrescribir explícitamente la suscripción a la intención; déjelo sin establecer para que siga la habilitación efectiva de la voz.
- `voice.mode` controla la ruta de conversación. El valor predeterminado es `agent-proxy`: una interfaz de voz en tiempo real gestiona los tiempos de los turnos, las interrupciones y la reproducción, delega el trabajo sustancial al agente de OpenClaw enrutado mediante `openclaw_agent_consult` y trata el resultado como una solicitud escrita de Discord de ese hablante. `stt-tts` conserva el flujo anterior de STT por lotes más TTS. `bidi` permite que el modelo en tiempo real converse directamente y, al mismo tiempo, expone `openclaw_agent_consult` para el cerebro de OpenClaw.
- `voice.agentSession` controla qué conversación de OpenClaw recibe los turnos de voz. Déjelo sin establecer para usar la sesión propia del canal de voz, o establézcalo en `{ mode: "target", target: "channel:<text-channel-id>" }` para que el canal de voz actúe como extensión de micrófono/altavoz de la sesión de un canal de texto de Discord existente, como `#maintainers`.
- `voice.model` sobrescribe el cerebro del agente de OpenClaw para las respuestas de voz de Discord y las consultas en tiempo real. Déjelo sin establecer para heredar el modelo del agente enrutado. Es independiente de `voice.realtime.model`.
- `voice.followUsers` permite que el bot se una, se mueva y salga de la voz de Discord con los usuarios seleccionados. Consulte [Seguir usuarios en la voz](#follow-users-in-voice).
- `agent-proxy` enruta el habla mediante `discord-voice`, que conserva la autorización normal del propietario y de las herramientas para el hablante y la sesión de destino, pero oculta la herramienta `tts` del agente porque la voz de Discord controla la reproducción. De forma predeterminada, `agent-proxy` concede a la consulta acceso completo a las herramientas equivalente al del propietario para los hablantes propietarios (`voice.realtime.toolPolicy: "owner"`) y prioriza firmemente consultar al agente de OpenClaw antes de dar respuestas sustanciales (`voice.realtime.consultPolicy: "always"`). En ese modo `always` predeterminado, la capa en tiempo real no reproduce automáticamente frases de relleno antes de la respuesta de la consulta; captura y transcribe el habla y, después, reproduce la respuesta enrutada de OpenClaw. Si varias respuestas de consultas forzadas finalizan mientras Discord todavía reproduce la primera respuesta, las respuestas posteriores con el habla exacta se ponen en cola hasta que la reproducción queda inactiva, en lugar de sustituir el habla a mitad de una frase.
- En el modo `stt-tts`, STT utiliza `tools.media.audio`; `voice.model` no afecta a la transcripción.
- En los modos en tiempo real, `voice.realtime.provider`, `voice.realtime.model` y `voice.realtime.speakerVoice` configuran la sesión de audio en tiempo real. Para OpenAI Realtime 2.1 con el cerebro Codex, use `voice.realtime.model: "gpt-realtime-2.1"` y `voice.model: "openai/gpt-5.6-sol"`.
- De forma predeterminada, los modos de voz en tiempo real incluyen pequeños archivos de perfil `IDENTITY.md`, `USER.md` y `SOUL.md` en las instrucciones del proveedor en tiempo real, de modo que los turnos directos rápidos mantengan la misma identidad, contexto del usuario y personalidad que el agente de OpenClaw enrutado. Establezca `voice.realtime.bootstrapContextFiles` en un subconjunto para personalizarlo, o en `[]` para deshabilitarlo. Solo se admiten esos archivos de perfil; `AGENTS.md` permanece en el contexto normal del agente. El contexto de perfil inyectado no sustituye a `openclaw_agent_consult` para el trabajo en el espacio de trabajo, los datos actuales, la consulta de memoria ni las acciones respaldadas por herramientas.
- En el modo en tiempo real `agent-proxy` de OpenAI, establezca `voice.realtime.requireWakeName: true` para mantener la voz en tiempo real de Discord en silencio hasta que una transcripción comience o termine con un nombre de activación. Los nombres de activación configurados deben tener una o dos palabras. Si `voice.realtime.wakeNames` no está establecido, OpenClaw utiliza el `name` del agente enrutado más `OpenClaw` y, como alternativa, el identificador del agente más `OpenClaw`. El control mediante nombre de activación deshabilita la respuesta automática del proveedor en tiempo real, enruta los turnos aceptados mediante la ruta de consulta del agente de OpenClaw y proporciona una breve confirmación hablada cuando se reconoce un nombre de activación inicial a partir de la transcripción parcial antes de que llegue la transcripción final.
- El proveedor en tiempo real de OpenAI acepta los nombres de eventos actuales de Realtime 2 y los alias heredados compatibles con Codex para los eventos de audio de salida y transcripción, por lo que las instantáneas compatibles del proveedor pueden divergir sin perder el audio del asistente.
- `voice.realtime.bargeIn` controla si los eventos de inicio del hablante de Discord interrumpen la reproducción en tiempo real activa. Si no está establecido, sigue la configuración de interrupción por audio de entrada del proveedor en tiempo real.
- `voice.realtime.minBargeInAudioEndMs` controla la duración mínima de reproducción del asistente antes de que una interrupción en tiempo real de OpenAI trunque el audio. Valor predeterminado: `250`. Establézcalo en `0` para una interrupción inmediata en salas con poco eco, o auméntelo para configuraciones de altavoces con mucho eco.
- `voice.tts` sobrescribe `messages.tts` únicamente para la reproducción de voz de `stt-tts`; los modos en tiempo real utilizan `voice.realtime.speakerVoice` en su lugar. Para usar una voz de OpenAI en la reproducción de Discord, establezca `voice.tts.provider: "openai"` y elija una voz de texto a voz en `voice.tts.providers.openai.speakerVoice`. `cedar` es una buena opción de sonido masculino en el modelo TTS actual de OpenAI.
- Las sobrescrituras de `systemPrompt` por canal de Discord se aplican a los turnos de transcripción de voz de ese canal de voz.
- Los turnos de transcripción de voz obtienen el estado de propietario de `allowFrom` (o `dm.allowFrom`) de Discord para los comandos restringidos al propietario y las acciones del canal. La visibilidad de las herramientas del agente sigue la política de herramientas configurada para la sesión enrutada.
- Si `voice.autoJoin` tiene varias entradas para el mismo servidor, OpenClaw se une al último canal configurado para ese servidor.
- `voice.allowedChannels` es una lista de canales permitidos de residencia opcional. Déjela sin establecer para permitir que `/vc join` se una a cualquier canal de voz de Discord autorizado. Cuando se establece, `/vc join`, la unión automática al inicio y los movimientos del estado de voz del bot quedan restringidos a las entradas `{ guildId, channelId }` enumeradas. Establézcala en un arreglo vacío para denegar todas las uniones a la voz de Discord. Si Discord mueve el bot fuera de la lista de canales permitidos, OpenClaw sale de ese canal y vuelve a unirse al destino de unión automática configurado cuando haya uno disponible.
- `voice.daveEncryption` y `voice.decryptionFailureTolerance` se transfieren a las opciones de unión de `@discordjs/voice`; los valores predeterminados del proyecto original son `daveEncryption=true` y `decryptionFailureTolerance=24`.
- OpenClaw utiliza el códec `libopus-wasm` incluido para la recepción de voz de Discord y la reproducción en tiempo real de PCM sin procesar. Incluye una compilación WebAssembly fijada de libopus y no requiere complementos nativos de opus.
- `voice.connectTimeoutMs` controla la espera inicial de Ready de `@discordjs/voice` para `/vc join` y los intentos de unión automática. Valor predeterminado: `30000`.
- `voice.reconnectGraceMs` controla cuánto tiempo espera OpenClaw a que una sesión de voz desconectada comience a reconectarse antes de destruirla. Valor predeterminado: `15000`.
- En el modo `stt-tts`, la reproducción de voz no se detiene solo porque otro usuario comience a hablar. Para evitar bucles de retroalimentación, OpenClaw ignora las nuevas capturas de voz mientras se reproduce TTS; hable después de que termine la reproducción para iniciar el siguiente turno. Los modos en tiempo real reenvían los inicios de los hablantes como señales de interrupción al proveedor en tiempo real.
- En los modos en tiempo real, el eco de los altavoces que entra en un micrófono abierto puede parecer una interrupción y detener la reproducción. Para salas de Discord con mucho eco, establezca `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` para evitar que OpenAI interrumpa automáticamente al recibir audio de entrada. Añada `voice.realtime.bargeIn: true` si aun así desea que los eventos de inicio del hablante de Discord interrumpan la reproducción activa. El puente en tiempo real de OpenAI ignora los truncamientos de reproducción inferiores a `voice.realtime.minBargeInAudioEndMs` por considerarlos probablemente eco o ruido, y los registra como omitidos en lugar de borrar la reproducción de Discord.
- `voice.captureSilenceGraceMs` controla cuánto tiempo espera OpenClaw después de que Discord informa que un hablante se ha detenido antes de finalizar ese segmento de audio para STT. Valor predeterminado: `2000`; auméntelo si Discord divide las pausas normales en transcripciones parciales entrecortadas.
- Cuando ElevenLabs es el proveedor TTS seleccionado, la reproducción de voz de Discord utiliza TTS en streaming y comienza desde el flujo de respuesta del proveedor. Los proveedores sin compatibilidad con streaming recurren a la ruta del archivo temporal sintetizado.
- OpenClaw supervisa los fallos de descifrado de recepción y se recupera automáticamente saliendo y volviendo a unirse al canal de voz después de fallos repetidos en un intervalo breve.
- Si los registros de recepción muestran repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` después de actualizar, recopile un informe de dependencias y los registros. La versión incluida de `@discordjs/voice` contiene la corrección de relleno del proyecto original procedente de la PR #11449 de discord.js, que cerró la incidencia #11419 de discord.js.
- Los eventos de recepción `The operation was aborted` son esperados cuando OpenClaw finaliza un segmento capturado de un hablante; son diagnósticos detallados, no advertencias.
- Los registros detallados de voz de Discord incluyen una vista previa acotada de una sola línea de la transcripción STT para cada segmento de hablante aceptado, de modo que la depuración muestre tanto el lado del usuario como el de la respuesta del agente sin volcar texto de transcripción sin límites.
- En el modo `agent-proxy`, la alternativa de consulta forzada omite fragmentos de transcripción probablemente incompletos, como texto que termina en `...` o en un conector final como "y", además de cierres claramente no accionables como "ahora vuelvo" o "adiós". Los registros muestran `forced agent consult skipped reason=...` cuando esto impide una respuesta obsoleta en cola.

### Seguir usuarios en la voz

Use `voice.followUsers` cuando desee que el bot de voz de Discord permanezca con uno o más usuarios conocidos de Discord, en lugar de unirse a un canal fijo al inicio o esperar a `/vc join`.

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
- `followUsersEnabled` tiene el valor predeterminado `true` cuando `followUsers` está configurado. Establézcalo en `false` para conservar la lista guardada, pero detener el seguimiento automático por voz.
- Cuando un usuario seguido se une a un canal de voz permitido, OpenClaw se une a ese canal. Cuando el usuario se mueve, OpenClaw se mueve con él. Cuando el usuario seguido activo se desconecta, OpenClaw sale.
- Si hay varios usuarios seguidos en el mismo servidor y el usuario seguido activo sale, OpenClaw se mueve al canal de otro usuario seguido y supervisado antes de salir del servidor. Si varios usuarios seguidos se mueven al mismo tiempo, prevalece el último evento de estado de voz observado.
- `allowedChannels` sigue aplicándose. Se ignora a un usuario seguido que se encuentre en un canal no permitido, y una sesión controlada por seguimiento se mueve a otro usuario seguido o sale.
- OpenClaw concilia los eventos de estado de voz omitidos al inicio y en intervalos acotados. La conciliación toma muestras de los servidores configurados y limita las consultas REST por ejecución, por lo que las listas `followUsers` muy grandes pueden tardar más de un intervalo en converger.
- Si Discord o un administrador mueve el bot mientras este sigue a un usuario, OpenClaw reconstruye la sesión de voz y conserva la propiedad del seguimiento cuando el destino está permitido. Si el bot se mueve fuera de `allowedChannels`, OpenClaw sale y vuelve a unirse al destino configurado cuando existe uno.
- La recuperación de recepción DAVE puede salir y volver a unirse al mismo canal después de fallos de descifrado repetidos. Las sesiones controladas por seguimiento conservan la propiedad del seguimiento durante esa ruta de recuperación, por lo que una desconexión posterior del usuario seguido sigue haciendo que se salga del canal.

Elija entre los modos de unión:

- Use `followUsers` para configuraciones personales o de operadores en las que el bot deba estar automáticamente en la voz cuando el usuario esté presente.
- Use `autoJoin` para bots de salas fijas que deban estar presentes incluso cuando ningún usuario supervisado esté en la voz.
- Use `/vc join` para uniones puntuales o salas en las que la presencia automática por voz resultaría inesperada.

Códec de voz de Discord:

- Los registros de recepción de voz muestran `discord voice: opus decoder: libopus-wasm`.
- La reproducción en tiempo real codifica PCM estéreo sin procesar de 48 kHz a Opus con el mismo paquete `libopus-wasm` incluido antes de entregar los paquetes a `@discordjs/voice`.
- La reproducción de archivos y de flujos del proveedor transcodifica a PCM estéreo sin procesar de 48 kHz con ffmpeg y, después, utiliza `libopus-wasm` para el flujo de paquetes Opus enviado a Discord.

Canalización de STT más TTS:

- La captura PCM de Discord se convierte en un archivo WAV temporal.
- `tools.media.audio` gestiona STT, por ejemplo, `openai/gpt-4o-mini-transcribe`.
- La transcripción se envía a través de la entrada y el enrutamiento de Discord mientras el LLM de respuesta se ejecuta con una política de salida de voz que oculta la herramienta `tts` del agente y solicita texto como resultado, porque la voz de Discord controla la reproducción TTS final.
- `voice.model`, cuando se configura, sustituye únicamente el LLM de respuesta para este turno del canal de voz.
- `voice.tts` se combina con prioridad sobre `messages.tts`; los proveedores compatibles con streaming envían el audio directamente al reproductor; de lo contrario, el archivo de audio resultante se reproduce en el canal al que se ha unido.

Ejemplo predeterminado de sesión de canal de voz con proxy de agente:

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

Sin un bloque `voice.agentSession`, cada canal de voz obtiene su propia sesión enrutada de OpenClaw. Por ejemplo, `/vc join channel:234567890123456789` se comunica con la sesión de ese canal de voz de Discord. El modelo en tiempo real es únicamente la interfaz de voz; las solicitudes sustanciales se transfieren al agente de OpenClaw configurado. Si el modelo en tiempo real produce una transcripción final sin llamar a la herramienta de consulta, OpenClaw fuerza la consulta como mecanismo alternativo para que el comportamiento predeterminado siga siendo equivalente a hablar con el agente.

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

Voz como extensión de una sesión existente de un canal de Discord:

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

En el modo `agent-proxy`, el bot se une al canal de voz configurado, pero los turnos del agente de OpenClaw utilizan la sesión enrutada normal y el agente del canal de destino. La sesión de voz en tiempo real reproduce oralmente el resultado devuelto en el canal de voz. El agente supervisor puede seguir utilizando las herramientas normales de mensajería de acuerdo con su política de herramientas, incluido el envío de un mensaje independiente de Discord si esa es la acción adecuada.

Mientras una ejecución delegada de OpenClaw está activa, las nuevas transcripciones de voz de Discord se tratan como controles en directo de la ejecución antes de iniciar otro turno del agente. Frases como «estado», «cancela eso», «usa la corrección más pequeña» o «cuando termines, comprueba también las pruebas» se clasifican como entradas de estado, cancelación, orientación o seguimiento para la sesión activa. Los resultados de estado, cancelación, orientación aceptada y seguimiento se comunican oralmente en el canal de voz para que quien llama sepa si OpenClaw gestionó la solicitud.

Formatos de destino útiles:

- `target: "channel:123456789012345678"` enruta mediante una sesión de canal de texto de Discord.
- `target: "123456789012345678"` se trata como un destino de canal.
- `target: "dm:123456789012345678"` o `target: "user:123456789012345678"` enruta mediante esa sesión de mensajes directos.

Ejemplo de OpenAI Realtime con mucho eco:

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

Utilice esta configuración cuando el modelo oiga su propia reproducción de Discord a través de un micrófono abierto, pero aun así se quiera interrumpir hablando. OpenClaw impide que OpenAI interrumpa automáticamente debido al audio de entrada sin procesar, mientras que `bargeIn: true` permite que los eventos de inicio de hablante de Discord y el audio de un hablante ya activo cancelen las respuestas activas en tiempo real antes de que el siguiente turno capturado llegue a OpenAI. Las señales de interrupción por voz muy tempranas cuyo `audioEndMs` sea inferior a `minBargeInAudioEndMs` se consideran probablemente eco o ruido y se ignoran para que el modelo no se corte en el primer fotograma de reproducción.

Registros de voz esperados:

- Al unirse: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Al iniciar el modo en tiempo real: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Durante el audio del hablante: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` y `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Al omitir voz obsoleta: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` o `reason=non-actionable-closing ...`
- Al finalizar la respuesta en tiempo real: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Al detener o restablecer la reproducción: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Durante una consulta en tiempo real: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Al responder el agente: `discord voice: agent turn answer ...`
- Al poner en cola una locución exacta: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, seguido de `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Al detectar una interrupción por voz: `discord voice: realtime barge-in detected source=speaker-start ...` o `discord voice: realtime barge-in detected source=active-speaker-audio ...`, seguido de `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Durante una interrupción en tiempo real: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, seguido de `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` o de `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Al ignorar eco o ruido: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Con la interrupción por voz desactivada: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Durante la reproducción inactiva: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Para depurar audio cortado, lea los registros de voz en tiempo real como una cronología:

1. `realtime audio playback started` indica que Discord ha empezado a reproducir el audio del asistente. A partir de este punto, el puente comienza a contar los fragmentos de salida del asistente, los bytes PCM de Discord, los bytes en tiempo real del proveedor y la duración del audio sintetizado.
2. `realtime speaker turn opened` marca el momento en que un hablante de Discord pasa a estar activo. Si la reproducción ya está activa y `bargeIn` está habilitado, puede ir seguido de `barge-in detected source=speaker-start`.
3. `realtime input audio started` marca el primer fotograma de audio real recibido para ese turno del hablante. `outputActive=true` o un valor distinto de cero de `outputAudioMs` en este punto significa que el micrófono está enviando entrada mientras la reproducción del asistente sigue activa.
4. `barge-in detected source=active-speaker-audio` significa que OpenClaw detectó audio en directo del hablante mientras la reproducción del asistente estaba activa. Esto resulta útil para distinguir una interrupción real de un evento de inicio de hablante de Discord sin audio útil.
5. `barge-in requested reason=...` significa que OpenClaw solicitó al proveedor en tiempo real que cancelara o truncara la respuesta activa. Incluye `outputAudioMs`, `outputActive` y `playbackChunks` para mostrar cuánto audio del asistente se había reproducido realmente antes de la interrupción.
6. `realtime audio playback stopped reason=...` es el punto de restablecimiento de la reproducción local de Discord. El motivo indica quién detuvo la reproducción: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` o `session-close`.
7. `realtime speaker turn closed` resume el turno de entrada capturado. `chunks=0` o `hasAudio=false` significa que se abrió el turno del hablante, pero no llegó audio utilizable al puente en tiempo real. `interruptedPlayback=true` significa que ese turno de entrada se solapó con la salida del asistente y activó la lógica de interrupción por voz.

Campos útiles:

- `outputAudioMs`: duración del audio del asistente generado por el proveedor en tiempo real antes de la línea de registro.
- `audioMs`: duración del audio del asistente que OpenClaw contabilizó antes de que se detuviera la reproducción.
- `elapsedMs`: tiempo de reloj transcurrido entre la apertura y el cierre del flujo de reproducción o del turno del hablante.
- `discordBytes`: bytes PCM estéreo a 48 kHz enviados a la voz de Discord o recibidos de ella.
- `realtimeBytes`: bytes PCM en el formato del proveedor enviados al proveedor en tiempo real o recibidos de él.
- `playbackChunks`: fragmentos de audio del asistente reenviados a Discord para la respuesta activa.
- `sinceLastAudioMs`: intervalo entre el último fotograma de audio capturado del hablante y el cierre de su turno.

Patrones comunes:

- Un corte inmediato con `source=active-speaker-audio`, un valor pequeño de `outputAudioMs` y el mismo usuario cerca suele indicar que el eco del altavoz está entrando en el micrófono. Aumente `voice.realtime.minBargeInAudioEndMs`, reduzca el volumen del altavoz, utilice auriculares o configure `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` seguido de `speaker turn closed ... hasAudio=false` significa que Discord notificó el inicio de un hablante, pero el audio no llegó a OpenClaw. Puede deberse a un evento transitorio de voz de Discord, al comportamiento de la puerta de ruido o a que un cliente activó brevemente el micrófono.
- `audio playback stopped reason=stream-close` sin una interrupción por voz cercana ni `provider-clear-audio` significa que el flujo de reproducción local de Discord terminó inesperadamente. Revise los registros anteriores del proveedor y del reproductor de Discord.
- `capture ignored during playback (barge-in disabled)` significa que OpenClaw descartó intencionadamente la entrada mientras el audio del asistente estaba activo. Habilite `voice.realtime.bargeIn` si se quiere que la voz interrumpa la reproducción.
- `barge-in ignored ... outputActive=false` significa que el VAD de Discord o del proveedor detectó voz, pero OpenClaw no tenía ninguna reproducción activa que interrumpir. Esto no debería cortar el audio.

Las credenciales se resuelven por componente: autenticación de la ruta del LLM para `voice.model`, autenticación de STT para `tools.media.audio`, autenticación de TTS para `messages.tts`/`voice.tts` y autenticación del proveedor en tiempo real para `voice.realtime.providers` o la configuración de autenticación normal del proveedor.

### Mensajes de voz

Los mensajes de voz de Discord muestran una vista previa de la forma de onda y requieren audio OGG/Opus. OpenClaw genera automáticamente la forma de onda, pero necesita `ffmpeg` y `ffprobe` en el host del Gateway para inspeccionar y convertir el audio.

- Proporcione una **ruta de archivo local** (las URL se rechazan).
- Omita el contenido de texto (Discord rechaza el texto y el mensaje de voz en la misma carga útil).
- Se acepta cualquier formato de audio; OpenClaw lo convierte a OGG/Opus cuando es necesario.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="Se utilizaron intents no permitidos o el bot no detecta mensajes del servidor">

    - habilita Message Content Intent
    - habilita Server Members Intent cuando dependas de la resolución de usuarios/miembros
    - reinicia el Gateway después de cambiar los intents

  </Accordion>

  <Accordion title="Mensajes de servidor bloqueados inesperadamente">

    - verifica `groupPolicy`
    - verifica la lista de permitidos del servidor en `channels.discord.guilds`
    - si existe un mapa `channels` del servidor, solo se permiten los canales indicados
    - verifica el comportamiento de `requireMention` y los patrones de mención

    Comprobaciones útiles:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="No se requiere una mención, pero sigue bloqueado">
    Causas habituales:

    - `groupPolicy="allowlist"` sin una lista de permitidos de servidor/canal coincidente
    - `requireMention` configurado en el lugar incorrecto (debe estar en `channels.discord.guilds` o en una entrada de canal)
    - remitente bloqueado por la lista de permitidos `users` del servidor/canal

  </Accordion>

  <Accordion title="Turnos de Discord prolongados o respuestas duplicadas">

    Registros habituales:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Opciones de la cola del Gateway de Discord:

    - una sola cuenta: `channels.discord.eventQueue.listenerTimeout`
    - varias cuentas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - esto solo controla el trabajo del listener del Gateway de Discord, no la duración del turno del agente

    Discord no aplica un tiempo de espera propio del canal a los turnos del agente en cola. Los listeners de mensajes delegan el trabajo de inmediato, y las ejecuciones de Discord en cola conservan el orden por sesión hasta que el ciclo de vida de la sesión, la herramienta o el entorno de ejecución completa o cancela el trabajo.

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

  <Accordion title="Advertencias de tiempo de espera al consultar los metadatos del Gateway">
    OpenClaw obtiene los metadatos de Discord `/gateway/bot` antes de conectarse. Ante fallos transitorios, se utiliza como alternativa la URL predeterminada del Gateway de Discord y se limita la frecuencia de los registros.

    Opciones de tiempo de espera de los metadatos:

    - una sola cuenta: `channels.discord.gatewayInfoTimeoutMs`
    - varias cuentas: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - variable de entorno alternativa cuando no se establece la configuración: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - valor predeterminado: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Reinicios por tiempo de espera de READY del Gateway">
    OpenClaw espera el evento `READY` del Gateway de Discord durante el inicio y después de las reconexiones del entorno de ejecución. Las configuraciones con varias cuentas y arranques escalonados pueden necesitar durante el inicio un intervalo de espera de READY mayor que el predeterminado.

    Opciones de tiempo de espera de READY:

    - inicio con una sola cuenta: `channels.discord.gatewayReadyTimeoutMs`
    - inicio con varias cuentas: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - variable de entorno alternativa durante el inicio cuando no se establece la configuración: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - valor predeterminado durante el inicio: `15000` (15 segundos), máximo: `120000`
    - entorno de ejecución con una sola cuenta: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - entorno de ejecución con varias cuentas: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - variable de entorno alternativa del entorno de ejecución cuando no se establece la configuración: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - valor predeterminado del entorno de ejecución: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Discrepancias en la auditoría de permisos">
    Las comprobaciones de permisos de `channels status --probe` solo funcionan con identificadores numéricos de canal.

    Si usas claves de slug, la coincidencia en tiempo de ejecución aún puede funcionar, pero la comprobación no puede verificar completamente los permisos.

  </Accordion>

  <Accordion title="Problemas con mensajes directos y emparejamiento">

    - Mensajes directos deshabilitados: `channels.discord.dm.enabled=false`
    - Política de mensajes directos deshabilitada: `channels.discord.dmPolicy="disabled"` (heredado: `channels.discord.dm.policy`)
    - pendiente de aprobación de emparejamiento en el modo `pairing`

  </Accordion>

  <Accordion title="Bucles de bot a bot">
    De forma predeterminada, se ignoran los mensajes enviados por bots.

    Si establece `channels.discord.allowBots=true`, use reglas estrictas de menciones y listas de permitidos para evitar comportamientos en bucle.
    Prefiera `channels.discord.allowBots="mentions"` para aceptar únicamente los mensajes de bots que mencionen al bot.

    OpenClaw también incluye [protección compartida contra bucles de bots](/es/channels/bot-loop-protection). Siempre que `allowBots` permita que los mensajes creados por bots lleguen al despacho, Discord asigna el evento entrante a los datos de `(account, channel, bot pair)` y la protección genérica de pares suprime el par después de que supere el presupuesto de eventos configurado. La protección evita bucles descontrolados entre dos bots que antes debían detenerse mediante los límites de frecuencia de Discord; no afecta a los despliegues de un solo bot ni a las respuestas puntuales de bots que se mantienen por debajo del presupuesto.

    Configuración predeterminada (activa cuando se establece `allowBots`):

    - `maxEventsPerWindow: 20` -- el par de bots puede intercambiar 20 mensajes dentro de la ventana deslizante
    - `windowSeconds: 60` -- duración de la ventana deslizante
    - `cooldownSeconds: 60` -- una vez agotado el límite, cada mensaje adicional de bot a bot en cualquiera de las dos direcciones se descarta durante un minuto

    Configure una sola vez el valor predeterminado compartido en `channels.defaults.botLoopProtection` y, a continuación, sobrescriba Discord cuando un flujo de trabajo legítimo necesite más margen. El orden de precedencia es:

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
      // Anulación opcional para todo Discord. Los bloques de cuenta anulan campos
      // individuales y heredan de aquí los campos omitidos.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha escucha a otros bots solo cuando lo mencionan.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo escucha todos los mensajes de Discord enviados por bots.
          allowBots: true,
          mentionAliases: {
            // Permite que Bravo escriba una mención de Alpha en Discord con el id. de usuario configurado.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Permite hasta cinco mensajes por minuto antes de suprimir el par.
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

  <Accordion title="Fallos de STT de voz con DecryptionFailed(...)">

    - mantenga OpenClaw actualizado (`openclaw update`) para disponer de la lógica de recuperación de recepción de voz de Discord
    - confirme que `channels.discord.voice.daveEncryption=true` (valor predeterminado)
    - comience con `channels.discord.voice.decryptionFailureTolerance=24` (valor predeterminado del proyecto original) y ajústelo solo si es necesario
    - observe los registros para detectar:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si los fallos continúan tras la reconexión automática, recopile los registros y compárelos con el historial de recepción de DAVE del proyecto original en [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) y [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referencia de configuración

Referencia principal: [Referencia de configuración: Discord](/es/gateway/config-channels#discord).

<Accordion title="Campos de Discord con alta relevancia">

- inicio/autenticación: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comandos: `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- cola de eventos: `eventQueue.listenerTimeout` (tiempo asignado al receptor, valor predeterminado `120000`), `eventQueue.maxQueueSize` (valor predeterminado `10000`), `eventQueue.maxConcurrency` (valor predeterminado `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- respuestas/historial: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit` (valor predeterminado `2000`), `maxLinesPerMessage` (valor predeterminado `17`)
- transmisión: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (las claves planas heredadas `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` se migran a `streaming.*` mediante `openclaw doctor --fix`)
- contenido multimedia/reintentos: `mediaMaxMb` (limita las cargas salientes de Discord, valor predeterminado `100`), `retry`
- acciones: `actions.*`
- presencia: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- interfaz de usuario: `ui.components.accentColor`
- funciones: `threadBindings`, `bindings[]` de nivel superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Seguridad y operaciones

- Trate los tokens de bot como secretos (se prefiere `DISCORD_BOT_TOKEN` en entornos supervisados).
- Conceda permisos de Discord con el mínimo privilegio.
- Si el despliegue o el estado de los comandos está desactualizado, reinicie el Gateway y vuelva a comprobarlo con `openclaw channels status --probe`.

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    Vincule un usuario de Discord con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de los chats grupales y de la lista de permitidos.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enrute los mensajes entrantes a los agentes.
  </Card>
  <Card title="Seguridad" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y refuerzo.
  </Card>
  <Card title="Enrutamiento multiagente" icon="sitemap" href="/es/concepts/multi-agent">
    Asigne servidores y canales a agentes.
  </Card>
  <Card title="Comandos con barra" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de los comandos nativos.
  </Card>
</CardGroup>
