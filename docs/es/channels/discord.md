---
read_when:
    - Trabajo en las funcionalidades del canal de Discord
summary: Configuración del bot de Discord, claves de configuración, componentes, voz y solución de problemas
title: Discord
x-i18n:
    generated_at: "2026-07-20T00:45:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 72bebf4de91d8f9a2c462477505ee01dc688d0cfb638fd16bda9853efe3fdc0e
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw se conecta a Discord como un bot a través del gateway oficial de Discord. Se admiten los mensajes directos y los canales de servidores.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de Discord usan de forma predeterminada el modo de emparejamiento.
  </Card>
  <Card title="Comandos con barra" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de los comandos nativos y catálogo de comandos.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico entre canales y flujo de reparación.
  </Card>
</CardGroup>

## Configuración rápida

Cree una aplicación de Discord con un bot, añada el bot a su servidor y emparéjelo con OpenClaw. Use un servidor privado si puede; [cree uno primero](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**) si es necesario.

<Steps>
  <Step title="Crear una aplicación y un bot de Discord">
    En el [Portal para desarrolladores de Discord](https://discord.com/developers/applications), haga clic en **New Application** y asígnele un nombre (por ejemplo, "OpenClaw").

    Abra **Bot** en la barra lateral y establezca **Username** en el nombre de su agente.

  </Step>

  <Step title="Habilitar intents privilegiados">
    En la página **Bot**, en **Privileged Gateway Intents**, habilite:

    - **Message Content Intent** (obligatorio)
    - **Server Members Intent** (recomendado; obligatorio para listas de permitidos por rol, correspondencia de nombres con identificadores y grupos de acceso al público del canal)
    - **Presence Intent** (opcional; solo para actualizaciones de presencia)

  </Step>

  <Step title="Copiar el token del bot">
    En la página **Bot**, haga clic en **Reset Token** y copie el token.

    <Note>
    A pesar del nombre, esto genera el primer token; no se está «restableciendo» nada.
    </Note>

  </Step>

  <Step title="Generar una URL de invitación y añadir el bot al servidor">
    Abra **OAuth2** en la barra lateral. En **OAuth2 URL Generator**, habilite los ámbitos:

    - `bot`
    - `applications.commands`

    En la sección **Bot Permissions** que aparece, habilite al menos:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcional)

    Esta es la configuración básica para los canales de texto normales. Si el bot publicará en hilos —incluidos los flujos de trabajo de canales de foro o multimedia que creen o continúen un hilo—, habilite también **Send Messages in Threads**.

    Copie la URL generada, ábrala en un navegador, seleccione su servidor y haga clic en **Continue**. El bot debería aparecer ahora en su servidor.

  </Step>

  <Step title="Habilitar el modo de desarrollador y recopilar los identificadores">
    En la aplicación de Discord, habilite el modo de desarrollador para poder copiar identificadores:

    1. **User Settings** (icono de engranaje) → **Developer** → active **Developer Mode**
       *(en dispositivos móviles: **App Settings** → **Advanced**)*
    2. Haga clic con el botón derecho en el **icono de su servidor** → **Copy Server ID**
    3. Haga clic con el botón derecho en su **propio avatar** → **Copy User ID**

    Conserve el identificador del servidor y el identificador de usuario junto con el token del bot; necesitará los tres a continuación.

  </Step>

  <Step title="Permitir mensajes directos de miembros del servidor">
    Para que el emparejamiento funcione, Discord debe permitir que el bot le envíe mensajes directos. Haga clic con el botón derecho en el **icono de su servidor** → **Privacy Settings** → active **Direct Messages**.

    Mantenga esta opción activada si usa mensajes directos de Discord con OpenClaw. Si solo usa canales del servidor, puede desactivarla después del emparejamiento.

  </Step>

  <Step title="Establecer de forma segura el token del bot (no enviarlo por el chat)">
    El token del bot es un secreto. Establézcalo en la máquina que ejecuta OpenClaw antes de enviar mensajes al agente:

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
    Para instalaciones como servicio administrado, ejecute `openclaw gateway install` desde un shell donde `DISCORD_BOT_TOKEN` esté establecida, o almacene la variable en `~/.openclaw/.env` para que el servicio pueda resolver la SecretRef de entorno después del reinicio.
    Si Discord bloquea o limita por frecuencia la consulta inicial de la aplicación desde su host, establezca el identificador de aplicación/cliente desde el Portal para desarrolladores para que el inicio pueda omitir esa llamada REST: `channels.discord.applicationId` para la cuenta predeterminada o `channels.discord.accounts.<accountId>.applicationId` para cada bot.

  </Step>

  <Step title="Configurar OpenClaw y realizar el emparejamiento">

    <Tabs>
      <Tab title="Pedir al agente">
        Converse con su agente de OpenClaw en un canal existente (por ejemplo, Telegram) e indíqueselo. Si Discord es su primer canal, use en su lugar la pestaña CLI / configuración.

        > "Ya establecí el token de mi bot de Discord en la configuración. Completa la configuración de Discord con el identificador de usuario `<user_id>` y el identificador de servidor `<server_id>`."
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

        Alternativa de entorno para la cuenta predeterminada:

```bash
DISCORD_BOT_TOKEN=...
```

        Para una configuración mediante scripts o remota, escriba el mismo bloque JSON5 con `openclaw config patch --file ./discord.patch.json5 --dry-run` y vuelva a ejecutarlo sin `--dry-run`. También funcionan las cadenas de texto sin formato `token`, y se admiten valores SecretRef para `channels.discord.token` mediante proveedores de entorno, archivo y ejecución. Consulte [Gestión de secretos](/es/gateway/secrets).

        Para varios bots de Discord, mantenga el token y el identificador de aplicación de cada bot en su cuenta. Las cuentas heredan un `channels.discord.applicationId` de nivel superior, así que establézcalo allí únicamente cuando todas las cuentas usen el mismo identificador de aplicación.

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
    Una vez que el gateway esté en ejecución, envíe un mensaje directo a su bot en Discord. Este responderá con un código de emparejamiento.

    <Tabs>
      <Tab title="Pedir al agente">
        Envíe el código de emparejamiento al agente a través de su canal existente:

        > "Aprueba este código de emparejamiento de Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Los códigos de emparejamiento caducan después de 1 hora. Tras la aprobación, converse con el agente mediante un mensaje directo de Discord.

  </Step>
</Steps>

<Note>
La resolución de tokens tiene en cuenta la cuenta. Los valores de token de la configuración prevalecen sobre la alternativa de entorno, y `DISCORD_BOT_TOKEN` solo se usa para la cuenta predeterminada.
Si dos cuentas de Discord habilitadas se resuelven al mismo token de bot, OpenClaw inicia un solo monitor del gateway para ese token: un token procedente de la configuración prevalece sobre la alternativa de entorno; de lo contrario, prevalece la primera cuenta habilitada y la cuenta duplicada se indica como deshabilitada con el motivo `duplicate bot token`.
Para llamadas salientes avanzadas (herramienta de mensajes/acciones de canal), se usa un `token` explícito por llamada para esa llamada. Esto se aplica a las acciones de envío y de lectura/sondeo (lectura/búsqueda/obtención/hilo/mensajes fijados/permisos). La configuración de políticas y reintentos de la cuenta sigue procediendo de la cuenta seleccionada en la instantánea activa del entorno de ejecución.
</Note>

## Recomendación: configurar un espacio de trabajo en un servidor

Una vez que funcionen los mensajes directos, puede convertir su servidor en un espacio de trabajo completo donde cada canal tenga su propia sesión del agente con su propio contexto. Se recomienda para servidores privados donde solo estén usted y su bot.

<Steps>
  <Step title="Añadir el servidor a la lista de servidores permitidos">
    Esto permite que el agente responda en cualquier canal de su servidor, no solo en mensajes directos.

    <Tabs>
      <Tab title="Pedir al agente">
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
    De forma predeterminada, el agente solo responde en los canales del servidor cuando se lo menciona con @. En un servidor privado, probablemente convenga que responda a todos los mensajes.

    En los canales del servidor, las respuestas normales se publican automáticamente de forma predeterminada. Para salas compartidas siempre activas, habilite `messages.groupChat.visibleReplies: "message_tool"` para que el agente pueda observar en silencio y publicar únicamente cuando determine que una respuesta en el canal resulta útil. Esto funciona mejor con modelos de última generación fiables en el uso de herramientas, como GPT-5.6 Sol. Los eventos ambientales de la sala permanecen silenciosos salvo que la herramienta realice un envío. Consulte [Eventos ambientales de sala](/es/channels/ambient-room-events) para ver la configuración completa del modo de observación silenciosa.

    Si Discord muestra el indicador de escritura y los registros muestran uso de tokens, pero no se publica ningún mensaje, compruebe si el turno se configuró como evento ambiental de sala o si se habilitaron respuestas visibles mediante la herramienta de mensajes.

    <Tabs>
      <Tab title="Pedir al agente">
        > "Permite que mi agente responda en este servidor sin tener que mencionarlo con @"
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

        Para exigir envíos mediante la herramienta de mensajes en las respuestas visibles de grupos o canales, establezca `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planificar el uso de memoria en los canales del servidor">
    La memoria a largo plazo (MEMORY.md) solo se carga automáticamente en las sesiones de mensajes directos; los canales del servidor no la cargan.

    <Tabs>
      <Tab title="Pedir al agente">
        > "Cuando haga preguntas en canales de Discord, usa memory_search o memory_get si necesitas contexto a largo plazo de MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Para disponer de contexto compartido en todos los canales, coloque instrucciones estables en `AGENTS.md` o `USER.md` (se insertan en cada sesión). Mantenga las notas a largo plazo en `MEMORY.md` y acceda a ellas cuando sea necesario mediante las herramientas de memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ahora cree canales y empiece a conversar. El agente ve el nombre del canal y cada canal es una sesión aislada; configure `#coding`, `#home`, `#research` o lo que se adapte a su flujo de trabajo.

## Modelo de ejecución

- El Gateway administra la conexión con Discord.
- El enrutamiento de respuestas es determinista: las respuestas a entradas de Discord regresan a Discord.
- Los metadatos de servidores y canales de Discord se añaden al prompt del modelo como contexto no confiable, no como prefijo visible para el usuario en la respuesta. Si un modelo vuelve a copiar ese envoltorio, OpenClaw elimina los metadatos copiados de las respuestas salientes y del contexto de reproducción futuro.
- De forma predeterminada (`session.dmScope=main`), los chats directos comparten la sesión principal del agente (`agent:main:main`).
- Los canales del servidor tienen claves de sesión aisladas (`agent:<agentId>:discord:channel:<channelId>`).
- Los mensajes directos grupales se ignoran de forma predeterminada (`channels.discord.dm.groupEnabled=false`).
- Los comandos con barra nativos se ejecutan en sesiones de comandos aisladas (`agent:<agentId>:discord:slash:<userId>`), aunque siguen llevando `CommandTargetSessionKey` a la sesión de conversación enrutada.
- La entrega de anuncios de Cron/Heartbeat solo de texto a Discord se reduce a la respuesta final visible del asistente, que se envía una sola vez. Los contenidos multimedia y las cargas útiles de componentes estructurados continúan enviándose en varios mensajes cuando el agente emite varias cargas útiles entregables.

## Canales de foro

Los canales de foro y multimedia de Discord solo aceptan publicaciones en hilos. OpenClaw permite crearlas de dos maneras:

- Enviar un mensaje al foro principal (`channel:<forumId>`) para crear automáticamente un hilo. El título del hilo es la primera línea no vacía del mensaje (truncada al límite de 100 caracteres de Discord para los nombres de hilos).
- Usar `openclaw message thread create` para crear un hilo directamente. No pasar `--message-id` para los canales de foro.

Enviar al foro principal para crear un hilo:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Título del tema\nCuerpo de la publicación"
```

Crear explícitamente un hilo de foro:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Título del tema" --message "Cuerpo de la publicación"
```

Los foros principales no aceptan componentes de Discord. Si se necesitan componentes, enviarlos al propio hilo (`channel:<threadId>`).

## Componentes interactivos

OpenClaw admite contenedores de componentes v2 de Discord para los mensajes del agente. Usar la herramienta de mensajes con una carga útil `components`. Los resultados de las interacciones se enrutan de vuelta al agente como mensajes entrantes normales y siguen la configuración existente de Discord `replyToMode`.

Bloques compatibles:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Las filas de acciones permiten hasta 5 botones o un único menú de selección
- Tipos de selección: `string`, `user`, `role`, `mentionable`, `channel`

De forma predeterminada, los componentes son de un solo uso. Establecer `components.reusable=true` para permitir que los botones, las selecciones y los formularios se utilicen varias veces hasta que caduquen.

Para restringir quién puede hacer clic en un botón, establecer `allowedUsers` en ese botón (ID de usuarios de Discord, etiquetas o `*`). Los usuarios que no coincidan reciben una denegación efímera.

Las devoluciones de llamada de los componentes caducan después de 30 minutos de forma predeterminada. Establecer `channels.discord.agentComponents.ttlMs` para cambiar la duración del registro de devoluciones de llamada de la cuenta predeterminada, o `channels.discord.accounts.<accountId>.agentComponents.ttlMs` para cada cuenta. El valor se expresa en milisegundos, debe ser un entero positivo y tiene un límite de `86400000` (24 horas). Los TTL más largos son apropiados para flujos de trabajo de revisión/aprobación que necesitan que los botones sigan siendo utilizables, pero amplían el periodo durante el cual un mensaje antiguo de Discord todavía puede desencadenar una acción. Se debe preferir el TTL más corto que resulte adecuado y mantener el valor predeterminado cuando las devoluciones de llamada obsoletas puedan resultar inesperadas.

Los comandos de barra `/model` y `/models` abren un selector de modelos interactivo con listas desplegables de proveedor, modelo y entorno de ejecución compatible, además de un paso Submit. `/models add` está obsoleto y devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat. La respuesta del selector es efímera y solo puede utilizarla el usuario que lo invocó. Los menús de selección de Discord están limitados a 25 opciones, por lo que se deben añadir entradas `provider/*` a `agents.defaults.modelPolicy.allow` cuando se quiera que el selector muestre modelos descubiertos dinámicamente solo para proveedores seleccionados, como `openai` o `vllm`.

Archivos adjuntos:

- Los bloques `file` deben apuntar a una referencia de archivo adjunto (`attachment://<filename>`)
- Proporcionar el archivo adjunto mediante `media`/`path`/`filePath` (un solo archivo); usar `media-gallery` para varios archivos
- Usar `filename` para sustituir el nombre de carga cuando deba coincidir con la referencia del archivo adjunto

Formularios modales:

- Añadir `components.modal` con hasta 5 campos
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
    text: "Elegir una ruta",
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
          placeholder: "Elegir una opción",
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
    `channels.discord.dmPolicy` controla el acceso mediante mensajes directos. `channels.discord.allowFrom` es la lista canónica de permitidos para mensajes directos.

    - `pairing` (valor predeterminado)
    - `allowlist` (requiere al menos un remitente `allowFrom`)
    - `open` (requiere que `channels.discord.allowFrom` incluya `"*"`)
    - `disabled`

    Si la política de mensajes directos no está abierta, se bloquea a los usuarios desconocidos (o se les solicita el emparejamiento en el modo `pairing`).

    Precedencia entre varias cuentas:

    - `channels.discord.accounts.default.allowFrom` se aplica únicamente a la cuenta `default`.
    - Para una cuenta, `allowFrom` tiene precedencia sobre el valor heredado `dm.allowFrom`.
    - Las cuentas con nombre heredan `channels.discord.allowFrom` cuando no están establecidos ni su propio `allowFrom` ni el valor heredado `dm.allowFrom`.
    - Las cuentas con nombre no heredan `channels.discord.accounts.default.allowFrom`.

    Los valores heredados `channels.discord.dm.policy` y `channels.discord.dm.allowFrom` todavía se leen por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    Formato del destino de mensajes directos para la entrega:

    - `user:<id>`
    - Mención `<@id>`

    Los ID numéricos sin prefijo normalmente se resuelven como ID de canales cuando hay un canal predeterminado activo, pero los ID incluidos en el valor efectivo `allowFrom` de mensajes directos de la cuenta se tratan como destinos de mensajes directos de usuarios por compatibilidad.

  </Tab>

  <Tab title="Grupos de acceso">
    Los mensajes directos de Discord y la autorización de comandos de texto pueden utilizar entradas dinámicas `accessGroup:<name>` en `channels.discord.allowFrom`.

    Los nombres de los grupos de acceso se comparten entre los canales de mensajes. Usar `type: "message.senders"` para un grupo estático cuyos miembros se expresen mediante la sintaxis `allowFrom` normal de cada canal, o `type: "discord.channelAudience"` cuando la audiencia `ViewChannel` actual de un canal de Discord deba definir dinámicamente la pertenencia. Comportamiento compartido de los grupos de acceso: [Grupos de acceso](/es/channels/access-groups).

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

    Un canal de texto de Discord no tiene una lista de miembros independiente. `type: "discord.channelAudience"` modela la pertenencia de la siguiente manera: el remitente del mensaje directo es miembro del servidor configurado y actualmente tiene el permiso efectivo `ViewChannel` en el canal configurado después de aplicar las sobrescrituras de roles y del canal.

    Ejemplo: permitir que cualquier persona que pueda ver `#maintainers` envíe mensajes directos al bot, mientras se mantienen cerrados los mensajes directos para todos los demás.

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

    Se pueden combinar entradas dinámicas y estáticas:

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

    Las consultas deniegan el acceso en caso de error. Si Discord devuelve `Missing Access`, falla la consulta del miembro o el canal pertenece a un servidor diferente, el remitente del mensaje directo se considera no autorizado.

    Activar **Server Members Intent** en el Discord Developer Portal al utilizar grupos de acceso basados en la audiencia del canal. Los mensajes directos no incluyen el estado de miembro del servidor, por lo que OpenClaw resuelve al miembro mediante la API REST de Discord en el momento de la autorización.

  </Tab>

  <Tab title="Política del servidor">
    La gestión de servidores se controla mediante `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La base segura cuando existe `channels.discord` es `allowlist`.

    Comportamiento de `allowlist`:

    - el servidor debe coincidir con `channels.discord.guilds` (se prefiere `id`; también se acepta el slug)
    - listas de remitentes permitidos opcionales: `users` (se recomiendan ID estables) y `roles` (solo ID de roles); si se configura cualquiera de ellas, se permite a los remitentes cuando coinciden con `users` O `roles`
    - la coincidencia directa por nombre/etiqueta está desactivada de forma predeterminada; activar `channels.discord.dangerouslyAllowNameMatching: true` únicamente como modo de compatibilidad de emergencia
    - se admiten nombres/etiquetas para `users`, pero los ID son más seguros; `openclaw security audit` muestra una advertencia cuando se utilizan entradas de nombre/etiqueta
    - si un servidor tiene configurado `channels`, se deniegan los canales que no figuren en la lista
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

    La clave heredada por canal `allow` se migra a `enabled` mediante `openclaw doctor --fix`.

    Si solo se establece `DISCORD_BOT_TOKEN` y no se crea un bloque `channels.discord`, el valor alternativo en tiempo de ejecución es `groupPolicy="allowlist"` (con una advertencia en los registros), incluso si `channels.defaults.groupPolicy` es `open`.

  </Tab>

  <Tab title="Menciones y mensajes directos grupales">
    De forma predeterminada, los mensajes de los servidores requieren una mención.

    La detección de menciones incluye:

    - mención explícita del bot
    - patrones de mención configurados (`agents.list[].groupChat.mentionPatterns`, con `messages.groupChat.mentionPatterns` como alternativa)
    - comportamiento implícito de respuesta al bot en los casos compatibles

    Al escribir mensajes salientes de Discord, usar la sintaxis canónica de menciones: `<@USER_ID>` para usuarios, `<#CHANNEL_ID>` para canales y `<@&ROLE_ID>` para roles. No usar el formato heredado de mención por apodo `<@!USER_ID>`.

    `requireMention` se configura por servidor/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` descarta opcionalmente los mensajes que mencionen a otro usuario/rol pero no al bot (sin incluir @everyone/@here).

    Mensajes directos grupales:

    - valor predeterminado: ignorados (`dm.groupEnabled=false`)
    - lista de permitidos opcional mediante `dm.groupChannels` (ID o slugs de canales)

  </Tab>
</Tabs>

### Enrutamiento de agentes basado en roles

Usar `bindings[].match.roles` para enrutar a los miembros de servidores de Discord a distintos agentes según el ID del rol. Las vinculaciones basadas en roles solo aceptan ID de roles y se evalúan después de las vinculaciones de pares o pares principales y antes de las vinculaciones exclusivas del servidor. Si una vinculación también establece otros campos de coincidencia (por ejemplo, `peer` + `guildId` + `roles`), todos los campos configurados deben coincidir.

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

- `commands.native` tiene como valor predeterminado `"auto"` y está habilitado para Discord.
- Modificación por canal: `channels.discord.commands.native`.
- `commands.native=false` omite el registro y la limpieza de comandos de barra de Discord durante el inicio. Los comandos registrados anteriormente pueden seguir visibles en Discord hasta que se eliminen de la aplicación de Discord.
- La autenticación de comandos nativos utiliza las mismas listas de permitidos y políticas de Discord que el procesamiento normal de mensajes.
- Los comandos pueden seguir visibles en la interfaz de Discord para usuarios no autorizados; la ejecución aplica la autenticación de OpenClaw y responde «no autorizado».
- Configuración predeterminada de los comandos de barra: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Consulte [Comandos de barra](/es/tools/slash-commands) para conocer el catálogo y el comportamiento de los comandos.

## Detalles de las funciones

<AccordionGroup>
  <Accordion title="Etiquetas de respuesta y respuestas nativas">
    Discord admite etiquetas de respuesta en la salida del agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Se controla mediante `channels.discord.replyToMode`:

    - `off` (valor predeterminado): no se crean hilos de respuesta implícitos; las etiquetas `[[reply_to_*]]` explícitas siguen respetándose
    - `first`: adjunta la referencia de respuesta nativa implícita al primer mensaje saliente de Discord del turno
    - `all`: la adjunta a cada mensaje saliente
    - `batched`: la adjunta solo cuando el evento entrante era un lote de varios mensajes con antirrebote; resulta útil cuando se desean respuestas nativas principalmente para conversaciones ambiguas con ráfagas de mensajes, no para cada turno de un solo mensaje

    Los identificadores de mensajes se incluyen en el contexto y el historial para que los agentes puedan dirigirse a mensajes específicos.

  </Accordion>

  <Accordion title="Vistas previas de enlaces">
    Discord genera de forma predeterminada inserciones enriquecidas para las URL. OpenClaw suprime de forma predeterminada esas inserciones generadas en los mensajes salientes de Discord, de modo que las URL enviadas por el agente permanecen como enlaces simples salvo que se habiliten explícitamente:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Establezca `channels.discord.accounts.<id>.suppressEmbeds` para modificar el comportamiento de una cuenta. Los envíos del agente mediante la herramienta de mensajes también pueden pasar `suppressEmbeds: false` para un solo mensaje. Las cargas `embeds` explícitas de Discord no se suprimen mediante la configuración predeterminada de vista previa de enlaces.

  </Accordion>

  <Accordion title="Vista previa de transmisión en directo">
    OpenClaw puede transmitir borradores de respuestas enviando un mensaje temporal y editándolo a medida que llega el texto. `channels.discord.streaming.mode` acepta `off` | `partial` | `block` | `progress` (valor predeterminado cuando no se ha establecido ninguna clave `streaming` ni la clave heredada `streamMode`). `streamMode` es un alias heredado; ejecute `openclaw doctor --fix` para reescribir la configuración persistente con la estructura anidada canónica `streaming`.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: false,
          commentary: false,
        },
      },
    },
  },
}
```

    - `off` deshabilita las ediciones de la vista previa de Discord.
    - `partial` edita un único mensaje de vista previa a medida que llegan los tokens.
    - `block` emite fragmentos del tamaño de un borrador; ajuste el tamaño y los puntos de interrupción con `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), con el límite de `textChunkLimit`. Cuando la transmisión por bloques se habilita explícitamente, OpenClaw omite la transmisión de vista previa para evitar una doble transmisión.
    - `progress` mantiene un único borrador de estado editable hasta la entrega final. De forma predeterminada, muestra una línea del preámbulo o la narración más reciente del agente, sin etiqueta generada, espacio separador ni filas de herramientas.
    - Los resultados finales con contenido multimedia, errores o respuestas explícitas cancelan las ediciones pendientes de la vista previa.
    - `streaming.preview.toolProgress` tiene como valor predeterminado `true` en el modo `partial`/`block`. El modo de progreso de Discord no muestra filas de herramientas de forma predeterminada; establezca `streaming.progress.toolProgress: true` para habilitarlas.
    - Establezca `streaming.progress.toolProgress: true` para añadir filas compactas de herramientas o progreso, como `🛠️ Bash: run tests` o `🔎 Web Search: for "query"`. Por compatibilidad, una configuración existente de `progress.label` o `progress.labels` conserva el valor predeterminado anterior de las filas de herramientas; establezca `toolProgress: false` para usar una etiqueta personalizada sin filas.
    - `streaming.progress.commentary` (valor predeterminado: `false`) permite incluir los comentarios sin procesar del asistente en el borrador temporal de progreso. La línea de estado predeterminada del preámbulo o la narración es independiente de esta opción. Los comentarios se depuran antes de mostrarse, siguen siendo transitorios y no modifican la entrega de la respuesta final.
    - `streaming.progress.maxLineChars` controla el límite de la vista previa de progreso por línea. La prosa se acorta respetando los límites de las palabras; los detalles de comandos y rutas conservan sufijos útiles.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controla el nivel de detalle de comandos y ejecuciones en las líneas compactas de progreso: `raw` (valor predeterminado) o `status` (solo la etiqueta de la herramienta).

    Oculte el texto sin procesar de comandos y ejecuciones y conserve las líneas compactas de progreso:

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

    La transmisión de la vista previa solo admite texto; las respuestas con contenido multimedia utilizan la entrega normal.

  </Accordion>

  <Accordion title="Historial, contexto y comportamiento de los hilos">
    Contexto del historial del servidor:

    - `channels.discord.historyLimit` tiene como valor predeterminado `20`
    - alternativa: `messages.groupChat.historyLimit`
    - `0` lo deshabilita

    Controles del historial de mensajes directos:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamiento de los hilos:

    - Los hilos de Discord se enrutan como sesiones de canal y heredan la configuración del canal principal salvo que se modifique.
    - Las sesiones de hilo heredan la selección `/model` del nivel de sesión del canal principal como alternativa solo para el modelo; las selecciones `/model` locales del hilo tienen prioridad y el historial de la transcripción principal no se copia salvo que se habilite la herencia de transcripciones.
    - `channels.discord.thread.inheritParent` (valor predeterminado: `false`) permite que los nuevos hilos automáticos se inicialicen a partir de la transcripción principal. Modificación por cuenta: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Las reacciones de la herramienta de mensajes pueden resolver destinos de mensajes directos `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` se conserva durante la alternativa de activación de la etapa de respuesta.

    Los temas de los canales se insertan como contexto **no confiable**. Las listas de permitidos controlan quién puede activar el agente, pero no constituyen un límite completo de ocultación del contexto complementario.

  </Accordion>

  <Accordion title="Sesiones vinculadas a hilos para subagentes">
    Discord puede vincular un hilo a un destino de sesión para que los mensajes posteriores de ese hilo sigan enrutándose a la misma sesión, incluidas las sesiones de subagentes.

    Comandos:

    - `/focus <target>` vincula el hilo actual o uno nuevo a un destino de subagente o sesión
    - `/unfocus` elimina la vinculación del hilo actual
    - `/agents` muestra las ejecuciones activas y el estado de vinculación
    - `/session idle <duration|off>` consulta o actualiza la pérdida automática de foco por inactividad de las vinculaciones con foco
    - `/session max-age <duration|off>` consulta o actualiza la antigüedad máxima estricta de las vinculaciones con foco

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

    - `session.threadBindings.*` establece los valores predeterminados globales; `channels.discord.threadBindings.*` modifica el comportamiento de Discord.
    - `spawnSessions` controla la creación y vinculación automáticas de hilos para `sessions_spawn({ thread: true })` y la creación de hilos ACP. Valor predeterminado: `true`.
    - `defaultSpawnContext` controla el contexto nativo de los subagentes para las creaciones vinculadas a hilos. Valor predeterminado: `"fork"`.
    - Las claves obsoletas `spawnSubagentSessions`/`spawnAcpSessions` se migran mediante `openclaw doctor --fix`.
    - Si las vinculaciones de hilos están deshabilitadas para una cuenta, `/focus` y las operaciones relacionadas con la vinculación de hilos no están disponibles.

    Consulte [Subagentes](/es/tools/subagents), [Agentes ACP](/es/tools/acp-agents) y [Referencia de configuración](/es/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Progreso de los subagentes en el mensaje de origen">
    Establezca `channels.discord.subagentProgress: true` para mostrar la actividad secundaria en segundo plano en el mensaje de Discord que inició la ejecución principal.

```json5
{
  channels: {
    discord: {
      subagentProgress: true,
    },
  },
}
```

    Mientras haya ejecuciones secundarias activas, OpenClaw mantiene activo el indicador de escritura de Discord durante un máximo de una hora y sustituye una reacción de recuento (de `1️⃣` a `🔟`) a medida que cambia el número de ejecuciones simultáneas; `🔟` también representa 10 o más. La reacción de recuento se elimina cuando finaliza la última ejecución secundaria. Una ejecución secundaria fallida, agotada por tiempo o terminada deja una reacción `🔴`.

    Esta función es opcional y utiliza valores predeterminados internos fijos para los tiempos y los emojis. El bot necesita el permiso **Add Reactions** para proporcionar comentarios mediante reacciones. `channels.discord.accounts.<id>.subagentProgress` en el nivel de cuenta modifica el valor del nivel superior.

  </Accordion>

  <Accordion title="Vinculaciones persistentes de canales ACP">
    Para espacios de trabajo ACP estables y «siempre activos», configure vinculaciones ACP con tipo en el nivel superior que se dirijan a conversaciones de Discord.

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

    - `/acp spawn codex --bind here` vincula el canal o hilo actual en su ubicación y mantiene los mensajes futuros en la misma sesión ACP. Los mensajes de los hilos heredan la vinculación del canal principal.
    - En un canal o hilo vinculado, `/new` y `/reset` restablecen la misma sesión ACP en su ubicación. Las vinculaciones temporales de hilos pueden modificar la resolución del destino mientras estén activas.
    - `spawnSessions` controla la creación y vinculación de hilos secundarios mediante `--thread auto|here`.

    Consulte [Agentes ACP](/es/tools/acp-agents) para obtener detalles sobre el comportamiento de las vinculaciones.

  </Accordion>

  <Accordion title="Notificaciones de reacciones">
    Modo de notificación de reacciones por servidor (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (valor predeterminado)
    - `all`
    - `allowlist` (utiliza `guilds.<id>.users`)

    Los eventos de reacción se convierten en eventos del sistema y se adjuntan a la sesión de Discord enrutada.

  </Accordion>

  <Accordion title="Eventos de presencia en línea">
    Habilite en un servidor las activaciones enrutadas del agente cuando un miembro humano pase de estar desconectado a estar en línea:

    ```json5
    {
      channels: {
        discord: {
          intents: { presence: true },
          guilds: {
            "111111111111111111": {
              presenceEvents: {
                channelId: "222222222222222222",
                users: ["333333333333333333"], // opcional; restringe aún más los usuarios que pueden ver el canal
                reconnectSuppressSeconds: 300, // opcional; período de silencio de la nueva sesión (0 lo deshabilita)
                burstLimit: 8, // opcional; máximo de eventos por ventana de ráfaga
                burstWindowSeconds: 60, // opcional; ventana deslizante de detección de ráfagas
              },
            },
          },
        },
      },
    }
    ```

    `presenceEvents` requiere que el Heartbeat esté habilitado para el agente al que se enruta el evento y que la opción privilegiada **Presence Intent** esté activada en la página Bot de la aplicación en Discord Developer Portal. OpenClaw obtiene los miembros actualmente en línea de cada instantánea completa `GUILD_CREATE`, enruta las transiciones observadas de desconectado a conectado y también considera como recién disponible una primera señal posterior de conexión de un miembro no visto. Es posible que ese miembro se haya conectado o unido después de la instantánea, por lo que el evento no afirma un estado previo exacto. Solo son elegibles las personas que pueden ver `channelId`: los canales y los hilos públicos requieren **View Channel** en el canal o el canal principal, mientras que los hilos privados requieren además ser miembro o disponer de **Manage Threads**. `users` puede restringir aún más esa audiencia. OpenClaw ignora los bots y los estados de conexión sin cambios, y conserva un período de espera de ocho horas por usuario tras los reinicios del Gateway. Cuando Discord establece una nueva sesión del Gateway y envía `READY`, OpenClaw suprime los eventos derivados de la presencia durante `reconnectSuppressSeconds` (valor predeterminado: 300; `0` lo deshabilita) mientras se reconstruye el estado de presencia del servidor, para que los miembros observados de nuevo no puedan activar al agente uno por uno. Además, limita la frecuencia de los eventos puestos en cola correctamente por servidor a `burstLimit` eventos (valor predeterminado: 8) por ventana deslizante de `burstWindowSeconds` (valor predeterminado: 60) y registra una sola vez cada episodio de supresión del servidor. Una sesión reanudada no se considera una sesión nueva. Discord limita las instantáneas de los servidores con más de 75,000 miembros; en ellos, OpenClaw requiere una actualización explícita al estado desconectado antes de saludar. El evento del sistema contiene identificadores inmutables de usuario, servidor y canal sin incluir nombres visibles mutables. El agente decide si saluda y cómo hacerlo.

  </Accordion>

  <Accordion title="Reacciones de confirmación">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - emoji alternativo de la identidad del agente (`agents.list[].identity.emoji`; de lo contrario, "👀")

    Notas:

    - Discord acepta emojis Unicode o nombres de emojis personalizados.
    - Use `""` para deshabilitar la reacción en un canal o una cuenta.

    **Ámbito (`messages.ackReactionScope`):**

    Valores: `"all"` (mensajes directos + grupos, incluidos los eventos ambientales de las salas), `"direct"` (solo mensajes directos), `"group-all"` (todos los mensajes de grupo excepto los eventos ambientales de las salas; sin mensajes directos), `"group-mentions"` (grupos cuando se menciona al bot; **sin mensajes directos**, valor predeterminado), `"off"` / `"none"` (deshabilitado).

    <Note>
    El ámbito predeterminado (`"group-mentions"`) no genera reacciones de confirmación en los mensajes directos ni en los eventos ambientales de las salas. Para obtener una reacción de confirmación en los mensajes directos entrantes de Discord y en los eventos de salas inactivas, establezca `messages.ackReactionScope` en `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Escrituras de configuración">
    Las escrituras de configuración iniciadas desde el canal están habilitadas de forma predeterminada. Esto afecta a los flujos `/config set|unset` (cuando las funciones de comandos están habilitadas).

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
    Enrute el tráfico WebSocket del Gateway de Discord y las consultas REST de inicio (ID de la aplicación + resolución de la lista de permitidos) mediante un proxy HTTP(S) con `channels.discord.proxy`.
    El uso de proxy para el WebSocket del Gateway de Discord es explícito; las conexiones WebSocket no heredan las variables de entorno de proxy del proceso del Gateway. Las consultas REST de inicio usan este proxy cuando se configura `channels.discord.proxy`.

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
    Habilite la resolución de PluralKit para asociar los mensajes enviados mediante proxy con la identidad de un miembro del sistema:

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
    - los nombres visibles de los miembros solo se comparan por nombre/slug cuando `channels.discord.dangerouslyAllowNameMatching: true`
    - las consultas acceden a la API de PluralKit con el ID del mensaje original
    - si la consulta falla, los mensajes enviados mediante proxy se consideran mensajes de bots y se descartan, salvo que `allowBots` permita su paso

  </Accordion>

  <Accordion title="Alias de menciones salientes">
    Use `mentionAliases` cuando los agentes necesiten menciones salientes deterministas para usuarios conocidos de Discord. Las claves son identificadores sin el `@` inicial; los valores son ID de usuario de Discord. Los identificadores desconocidos, `@everyone`, `@here` y las menciones dentro de fragmentos de código Markdown se dejan sin cambios.

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
    - 1: Transmitiendo (requiere `activityUrl`; `activityUrl` requiere a su vez `activityType: 1`)
    - 2: Escuchando
    - 3: Viendo
    - 4: Personalizado (usa el texto de la actividad como estado; el emoji es opcional)
    - 5: Compitiendo

    Presencia automática (señal del estado del entorno de ejecución):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "tokens agotados",
      },
    },
  },
}
```

    La presencia automática asocia la disponibilidad del entorno de ejecución con el estado de Discord: correcto => en línea, degradado o desconocido => inactivo, agotado o no disponible => no molestar. Valores predeterminados: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (debe ser menor o igual que `intervalMs`). Anulaciones de texto opcionales:

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

    Discord habilita automáticamente las aprobaciones nativas de ejecución cuando `enabled` no está establecido o es `"auto"`, y se puede resolver al menos un aprobador, ya sea desde `execApprovals.approvers` o desde `commands.ownerAllowFrom`. Discord no deduce los aprobadores de ejecución a partir de `allowFrom` del canal, el valor heredado `dm.allowFrom` ni `defaultTo` de los mensajes directos. Establezca `enabled: false` para deshabilitar explícitamente Discord como cliente nativo de aprobación.

    Para los comandos confidenciales de grupo exclusivos del propietario, como `/diagnostics` y `/export-trajectory`, OpenClaw envía en privado las solicitudes de aprobación y los resultados finales. Primero intenta enviar un mensaje directo de Discord cuando el propietario que invoca el comando tiene una ruta de propietario de Discord; de lo contrario, recurre a la primera ruta de propietario disponible en `commands.ownerAllowFrom`, como Telegram.

    Cuando `target` es `channel` o `both`, la solicitud de aprobación es visible en el canal. Solo los aprobadores resueltos pueden usar los botones; los demás usuarios reciben una denegación efímera. Las solicitudes de aprobación incluyen el texto del comando, por lo que la entrega en el canal solo debe habilitarse en canales de confianza. Si el ID del canal no puede derivarse de la clave de sesión, OpenClaw recurre a la entrega mediante mensaje directo.

    Discord representa los botones de aprobación compartidos que usan otros canales de chat; el adaptador nativo de Discord añade principalmente el enrutamiento de mensajes directos a los aprobadores y la distribución a canales. Cuando estos botones están presentes, constituyen la experiencia de aprobación principal; OpenClaw solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía. Si el entorno de ejecución de aprobación nativo de Discord no está activo, OpenClaw mantiene visible la solicitud determinista local `/approve <id> <decision>`. Si el entorno de ejecución está activo, pero no se puede entregar una tarjeta nativa a ningún destino, OpenClaw envía un aviso alternativo en el mismo chat con el comando exacto `/approve` de la aprobación pendiente.

    La autenticación del Gateway y la resolución de aprobaciones siguen el contrato compartido del cliente del Gateway (los ID `plugin:` se resuelven mediante `plugin.approval.resolve`; los demás ID, mediante `exec.approval.resolve`). De forma predeterminada, las aprobaciones caducan después de 30 minutos.

    Consulte [Aprobaciones de ejecución](/es/tools/exec-approvals).

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
| reacciones, mensajes, hilos, elementos fijados, encuestas, búsqueda, información de miembros, información de roles, información de canales, canales, estado de voz, eventos, stickers, cargas de emojis, cargas de stickers, permisos | habilitado           |
| roles                                                                                                                                                                    | deshabilitado        |
| moderación                                                                                                                                                               | deshabilitado        |
| presencia                                                                                                                                                                | deshabilitado        |

## Interfaz de usuario de componentes v2

OpenClaw usa los componentes v2 de Discord para las aprobaciones de ejecución y los marcadores entre contextos. Las acciones de mensajes de Discord también pueden aceptar `components` para una interfaz de usuario personalizada (avanzado; requiere construir una carga útil de componentes mediante la herramienta de Discord), mientras que los `embeds` heredados siguen disponibles, pero no se recomiendan.

- `channels.discord.ui.components.accentColor` establece el color de énfasis utilizado por los contenedores de componentes de Discord (hexadecimal). Por cuenta: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` controla durante cuánto tiempo permanecen registrados los callbacks de componentes de Discord enviados (valor predeterminado: `1800000`; máximo: `86400000`). Por cuenta: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` se ignoran cuando hay componentes v2 presentes.
- Las vistas previas de URL sin formato se suprimen de manera predeterminada. Establezca `suppressEmbeds: false` en una acción de mensaje cuando deba expandirse un único enlace saliente.

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

Lista de comprobación de configuración:

1. Habilite Message Content Intent en el Discord Developer Portal.
2. Habilite Server Members Intent cuando se utilicen listas de permitidos de roles o usuarios.
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

- La voz de Discord es opcional para las configuraciones que solo usan texto; establece `channels.discord.voice.enabled=true` (o conserva un bloque `channels.discord.voice` existente) para habilitar los comandos `/vc`, el entorno de ejecución de voz y la intención `GuildVoiceStates` del Gateway. `channels.discord.intents.voiceStates` puede anular explícitamente la suscripción a la intención; déjalo sin establecer para seguir la habilitación efectiva de la voz.
- `voice.mode` controla la ruta de conversación. El valor predeterminado es `agent-proxy`: un front-end de voz en tiempo real gestiona los tiempos de los turnos, las interrupciones y la reproducción, delega el trabajo sustancial al agente de OpenClaw enrutado mediante `openclaw_agent_consult` y trata el resultado como una solicitud escrita de Discord de ese hablante. `stt-tts` conserva el flujo anterior por lotes de STT más TTS. `bidi` permite que el modelo en tiempo real converse directamente mientras expone `openclaw_agent_consult` para el cerebro de OpenClaw.
- `voice.agentSession` controla qué conversación de OpenClaw recibe los turnos de voz. Déjalo sin establecer para usar la sesión propia del canal de voz, o establece `{ mode: "target", target: "channel:<text-channel-id>" }` para que el canal de voz actúe como extensión de micrófono/altavoz de una sesión existente de un canal de texto de Discord, como `#maintainers`.
- `voice.model` anula el cerebro del agente de OpenClaw para las respuestas de voz de Discord y las consultas en tiempo real. Déjalo sin establecer para heredar el modelo del agente enrutado. Es independiente de `voice.realtime.model`.
- `voice.followUsers` permite que el bot entre, se desplace y salga de los canales de voz de Discord con los usuarios seleccionados. Consulta [Seguir a usuarios en canales de voz](#follow-users-in-voice).
- `agent-proxy` enruta el habla mediante `discord-voice`, que conserva la autorización normal del propietario y de las herramientas para el hablante y la sesión de destino, pero oculta la herramienta `tts` del agente porque la voz de Discord controla la reproducción. De forma predeterminada, `agent-proxy` concede a la consulta acceso a herramientas completo y equivalente al del propietario para los hablantes propietarios (`voice.realtime.toolPolicy: "owner"`) y prioriza firmemente consultar al agente de OpenClaw antes de dar respuestas sustanciales (`voice.realtime.consultPolicy: "always"`). En ese modo `always` predeterminado, la capa en tiempo real no reproduce automáticamente frases de relleno antes de la respuesta de la consulta; captura y transcribe el habla y, a continuación, reproduce la respuesta de OpenClaw enrutada. Si varias respuestas de consulta forzada finalizan mientras Discord aún reproduce la primera respuesta, las respuestas posteriores de habla exacta se ponen en cola hasta que la reproducción quede inactiva, en lugar de reemplazar el habla a mitad de una frase.
- En el modo `stt-tts`, STT usa `tools.media.audio`; `voice.model` no afecta a la transcripción.
- En los modos en tiempo real, `voice.realtime.provider`, `voice.realtime.model` y `voice.realtime.speakerVoice` configuran la sesión de audio en tiempo real. Para OpenAI Realtime 2.1 junto con el cerebro Codex, usa `voice.realtime.model: "gpt-realtime-2.1"` y `voice.model: "openai/gpt-5.6-sol"`.
- De forma predeterminada, los modos de voz en tiempo real incluyen pequeños archivos de perfil `IDENTITY.md`, `USER.md` y `SOUL.md` en las instrucciones del proveedor en tiempo real, para que los turnos directos rápidos conserven la misma identidad, contextualización del usuario y personalidad que el agente de OpenClaw enrutado. Establece `voice.realtime.bootstrapContextFiles` en un subconjunto para personalizarlo, o `[]` para deshabilitarlo. Solo se admiten esos archivos de perfil; `AGENTS.md` permanece en el contexto normal del agente. El contexto de perfil inyectado no sustituye a `openclaw_agent_consult` para el trabajo en el espacio de trabajo, los hechos actuales, la consulta de memoria ni las acciones respaldadas por herramientas.
- En el modo en tiempo real `agent-proxy` de OpenAI, el control mediante nombre de activación se adapta de forma predeterminada a la sala: una persona puede hablar con naturalidad sin usar un nombre de activación, mientras que dos o más personas deben comenzar o terminar un turno con uno. Los demás bots no cuentan como personas. Establece `voice.realtime.requireWakeName: true` para exigir siempre un nombre de activación o `false` para no exigirlo nunca. Los nombres de activación configurados deben tener una o dos palabras. Si `voice.realtime.wakeNames` no está establecido, OpenClaw usa `name` del agente enrutado más `OpenClaw` y, como alternativa, el identificador del agente más `OpenClaw`. Un control activo mediante nombre de activación deshabilita la respuesta automática del proveedor en tiempo real, enruta los turnos aceptados por la ruta de consulta del agente de OpenClaw y proporciona una breve confirmación hablada cuando se reconoce un nombre de activación inicial en la transcripción parcial antes de que llegue la transcripción final. La política sigue las entradas y salidas en directo sin volver a conectar la voz.
- El proveedor en tiempo real de OpenAI acepta los nombres actuales de los eventos de Realtime 2 y los alias heredados compatibles con Codex para los eventos de audio de salida y transcripción, por lo que las instantáneas compatibles del proveedor pueden variar sin perder el audio del asistente.
- `voice.realtime.bargeIn` controla si los eventos de inicio del habla de Discord interrumpen la reproducción activa en tiempo real. Si no está establecido, sigue la configuración de interrupción por audio de entrada del proveedor en tiempo real.
- `voice.realtime.minBargeInAudioEndMs` controla la duración mínima de reproducción del asistente antes de que una interrupción durante el habla en tiempo real de OpenAI trunque el audio. Valor predeterminado: `250`. Establece `0` para una interrupción inmediata en salas con poco eco, o auméntalo para configuraciones de altavoces con mucho eco.
- `voice.tts` anula `messages.tts` únicamente para la reproducción de voz `stt-tts`; los modos en tiempo real usan `voice.realtime.speakerVoice` en su lugar. Para usar una voz de OpenAI en la reproducción de Discord, establece `voice.tts.provider: "openai"` y elige una voz de texto a voz en `voice.tts.providers.openai.speakerVoice`. `cedar` es una buena opción con sonido masculino en el modelo TTS actual de OpenAI.
- Las anulaciones `systemPrompt` de Discord por canal se aplican a los turnos de transcripción de voz de ese canal de voz.
- Cuando OpenClaw entra en un canal de voz, la sesión del agente enrutado recibe un evento silencioso del sistema con la lista actual de participantes. Las entradas y salidas posteriores de participantes actualizan esa sesión sin provocar una respuesta hablada no solicitada; los nombres para mostrar de Discord se tratan como etiquetas no confiables. Los turnos de voz autorizados también reciben una instantánea actualizada de la lista.
- Los turnos de transcripción de voz y los comandos `/vc` usan las entradas de Discord de `commands.ownerAllowFrom` para determinar el estado de propietario. Cuando no se configura ningún propietario de comandos de Discord, el `allowFrom` de la cuenta de Discord seleccionada (o el `dm.allowFrom` heredado) aún puede autorizar el acceso de voz sin conceder el estado de propietario. La visibilidad de las herramientas del agente sigue la política de herramientas configurada para la sesión enrutada.
- Si `voice.autoJoin` tiene varias entradas para el mismo servidor, OpenClaw entra en el último canal configurado para ese servidor.
- `voice.allowedChannels` es una lista de permitidos de residencia opcional. Déjalo sin establecer para permitir que `/vc join` entre en cualquier canal de voz de Discord autorizado. Cuando está establecido, `/vc join`, la entrada automática al iniciar y los cambios de estado de voz del bot se restringen a las entradas `{ guildId, channelId }` enumeradas. Establécelo en una matriz vacía para denegar todas las entradas a canales de voz de Discord. Si Discord mueve el bot fuera de la lista de permitidos, OpenClaw sale de ese canal y vuelve a entrar en el destino de entrada automática configurado cuando haya uno disponible.
- `voice.daveEncryption` y `voice.decryptionFailureTolerance` se transfieren a las opciones de entrada de `@discordjs/voice`; los valores predeterminados del componente ascendente son `daveEncryption=true` y `decryptionFailureTolerance=24`.
- OpenClaw usa el códec `libopus-wasm` incluido para recibir voz de Discord y reproducir PCM sin procesar en tiempo real. Incluye una compilación WebAssembly fijada de libopus y no requiere complementos nativos de opus.
- `voice.connectTimeoutMs` controla la espera inicial del estado Ready de `@discordjs/voice` para `/vc join` y los intentos de entrada automática. Valor predeterminado: `30000`.
- `voice.reconnectGraceMs` controla cuánto tiempo espera OpenClaw a que una sesión de voz desconectada comience a reconectarse antes de destruirla. Valor predeterminado: `15000`.
- En el modo `stt-tts`, la reproducción de voz no se detiene solo porque otro usuario comience a hablar. Para evitar bucles de retroalimentación, OpenClaw ignora las nuevas capturas de voz mientras se reproduce TTS; habla cuando termine la reproducción para iniciar el siguiente turno. Los modos en tiempo real reenvían los inicios del habla como señales de interrupción durante el habla al proveedor en tiempo real.
- En los modos en tiempo real, el eco de los altavoces que entra en un micrófono abierto puede parecer una interrupción durante el habla e interrumpir la reproducción. Para salas de Discord con mucho eco, establece `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` para evitar que OpenAI interrumpa automáticamente al detectar audio de entrada. Añade `voice.realtime.bargeIn: true` si aun así se desea que los eventos de inicio del habla de Discord interrumpan la reproducción activa. El puente en tiempo real de OpenAI ignora como probable eco o ruido los truncamientos de reproducción inferiores a `voice.realtime.minBargeInAudioEndMs` y los registra como omitidos en lugar de borrar la reproducción de Discord.
- `voice.captureSilenceGraceMs` controla cuánto tiempo espera OpenClaw después de que Discord informa de que un hablante ha dejado de hablar antes de finalizar ese segmento de audio para STT. Valor predeterminado: `2000`; auméntalo si Discord divide las pausas normales en transcripciones parciales entrecortadas.
- Cuando ElevenLabs es el proveedor TTS seleccionado, la reproducción de voz de Discord usa TTS por streaming y comienza desde el flujo de respuesta del proveedor. Los proveedores sin compatibilidad con streaming recurren a la ruta del archivo temporal sintetizado.
- OpenClaw supervisa los fallos de descifrado de recepción y se recupera automáticamente saliendo y volviendo a entrar en el canal de voz tras repetidos fallos en un intervalo breve.
- Si los registros de recepción muestran repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` después de actualizar, recopila un informe de dependencias y los registros. La línea `@discordjs/voice` incluida contiene la corrección ascendente de relleno de la PR #11449 de discord.js, que cerró la incidencia #11419 de discord.js.
- Los eventos de recepción `The operation was aborted` son esperables cuando OpenClaw finaliza un segmento capturado de un hablante; son diagnósticos detallados, no advertencias.
- Los registros detallados de voz de Discord incluyen una vista previa acotada de una línea de la transcripción STT para cada segmento de hablante aceptado, de modo que la depuración muestra tanto el lado del usuario como el de la respuesta del agente sin volcar texto de transcripción sin límites.
- En el modo `agent-proxy`, el mecanismo alternativo de consulta forzada omite fragmentos de transcripción probablemente incompletos, como texto que termina en `...` o en un conector final como «y», además de cierres evidentemente no accionables como «vuelvo enseguida» o «adiós». Los registros muestran `forced agent consult skipped reason=...` cuando esto evita una respuesta obsoleta en cola.

### Seguir a usuarios en canales de voz

Usa `voice.followUsers` cuando se desee que el bot de voz de Discord permanezca con uno o más usuarios conocidos de Discord, en lugar de entrar en un canal fijo al iniciar o esperar a `/vc join`.

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

- `followUsers` acepta ID de usuario de Discord sin procesar y valores `discord:<id>`. OpenClaw normaliza ambas formas antes de cotejar los eventos de estado de voz.
- `followUsersEnabled` utiliza de forma predeterminada `true` cuando se configura `followUsers`. Establézcalo en `false` para conservar la lista guardada, pero detener el seguimiento de voz automático.
- `followUsers` solo controla la permanencia en voz. No concede acceso como hablante ni autoridad de propietario; configure `commands.ownerAllowFrom` y los usuarios y roles del servidor o canal por separado.
- Cuando un usuario seguido se une a un canal de voz permitido, OpenClaw se une a ese canal. Cuando el usuario se mueve, OpenClaw se mueve con él. Cuando el usuario seguido activo se desconecta, OpenClaw abandona el canal.
- Si hay varios usuarios seguidos en el mismo servidor y el usuario seguido activo se va, OpenClaw se mueve al canal de otro usuario seguido antes de abandonar el servidor. Si varios usuarios seguidos se mueven a la vez, prevalece el evento de estado de voz observado más recientemente.
- `allowedChannels` sigue siendo aplicable. Se ignora a un usuario seguido que esté en un canal no permitido, y una sesión controlada por seguimiento se mueve a otro usuario seguido o se cierra.
- OpenClaw concilia los eventos de estado de voz omitidos al iniciarse y en intervalos acotados. La conciliación toma muestras de los servidores configurados y limita las consultas REST por ejecución, por lo que las listas `followUsers` muy grandes pueden tardar más de un intervalo en converger.
- Si Discord o un administrador mueven el bot mientras sigue a un usuario, OpenClaw reconstruye la sesión de voz y conserva el control mediante seguimiento cuando el destino está permitido. Si el bot se mueve fuera de `allowedChannels`, OpenClaw abandona el canal y vuelve a unirse al destino configurado cuando existe uno.
- La recuperación de recepción de DAVE puede abandonar el canal y volver a unirse al mismo después de varios errores de descifrado. Las sesiones controladas por seguimiento conservan ese control durante esta ruta de recuperación, por lo que, si el usuario seguido se desconecta posteriormente, el canal también se abandona.

Elija entre los modos de unión:

- Utilice `followUsers` para configuraciones personales o de operador en las que el bot deba estar automáticamente en el canal de voz cuando usted lo esté.
- Utilice `autoJoin` para bots de sala fija que deban estar presentes incluso cuando ningún usuario supervisado esté en el canal de voz.
- Utilice `/vc join` para incorporaciones puntuales o salas en las que la presencia automática en el canal de voz resultaría inesperada.

Códec de voz de Discord:

- Los registros de recepción de voz muestran `discord voice: opus decoder: libopus-wasm`.
- La reproducción en tiempo real codifica PCM estéreo sin procesar de 48 kHz a Opus con el mismo paquete `libopus-wasm` incluido antes de entregar los paquetes a `@discordjs/voice`.
- La reproducción de archivos y transmisiones de proveedores transcodifica a PCM estéreo sin procesar de 48 kHz con ffmpeg y, a continuación, utiliza `libopus-wasm` para el flujo de paquetes Opus enviado a Discord.

Pipeline de STT y TTS:

- La captura PCM de Discord se convierte en un archivo WAV temporal.
- `tools.media.audio` gestiona STT, por ejemplo, `openai/gpt-4o-mini-transcribe`.
- La transcripción se envía a través de la entrada y el enrutamiento de Discord mientras el LLM de respuesta se ejecuta con una política de salida de voz que oculta la herramienta `tts` del agente y solicita que se devuelva texto, porque la voz de Discord controla la reproducción TTS final.
- `voice.model`, cuando se establece, sustituye únicamente el LLM de respuesta para este turno del canal de voz.
- `voice.tts` se combina sobre `messages.tts`; los proveedores con capacidad de transmisión alimentan directamente el reproductor; de lo contrario, el archivo de audio resultante se reproduce en el canal al que se ha unido.

Ejemplo de sesión de canal de voz de proxy de agente predeterminada:

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

Sin un bloque `voice.agentSession`, cada canal de voz obtiene su propia sesión enrutada de OpenClaw. Por ejemplo, `/vc join channel:234567890123456789` se comunica con la sesión correspondiente a ese canal de voz de Discord. El modelo en tiempo real es solo la interfaz de voz; las solicitudes sustanciales se transfieren al agente de OpenClaw configurado. Si el modelo en tiempo real produce una transcripción final sin llamar a la herramienta de consulta, OpenClaw fuerza la consulta como mecanismo de reserva para que el comportamiento predeterminado siga siendo equivalente a hablar con el agente.

Ejemplo heredado de STT y TTS:

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

En el modo `agent-proxy`, el bot se une al canal de voz configurado, pero los turnos del agente de OpenClaw utilizan la sesión enrutada y el agente habituales del canal de destino. La sesión de voz en tiempo real reproduce el resultado devuelto en el canal de voz. El agente supervisor puede seguir utilizando las herramientas de mensajes normales según su política de herramientas, incluido el envío de un mensaje de Discord independiente si esa es la acción adecuada.

Mientras una ejecución delegada de OpenClaw está activa, las nuevas transcripciones de voz de Discord se tratan como control en directo de la ejecución antes de iniciar otro turno del agente. Frases como «estado», «cancela eso», «usa la corrección más pequeña» o «cuando termines, comprueba también las pruebas» se clasifican como entradas de estado, cancelación, orientación o seguimiento para la sesión activa. Los resultados de estado, cancelación, orientación aceptada y seguimiento se reproducen en el canal de voz para que la persona que llama sepa si OpenClaw ha gestionado la solicitud.

Formas de destino útiles:

- `target: "channel:123456789012345678"` se enruta mediante una sesión de canal de texto de Discord.
- `target: "123456789012345678"` se trata como un destino de canal.
- `target: "dm:123456789012345678"` o `target: "user:123456789012345678"` se enruta mediante esa sesión de mensaje directo.

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

Utilice esta configuración cuando el modelo oiga su propia reproducción de Discord a través de un micrófono abierto, pero aun así se desee interrumpirlo hablando. OpenClaw impide que OpenAI interrumpa automáticamente en respuesta al audio de entrada sin procesar, mientras que `bargeIn: true` permite que los eventos de inicio del hablante de Discord y el audio de un hablante ya activo cancelen las respuestas en tiempo real activas antes de que el siguiente turno capturado llegue a OpenAI. Las señales de interrupción verbal muy tempranas con `audioEndMs` por debajo de `minBargeInAudioEndMs` se tratan como eco o ruido probable y se ignoran para que el modelo no se interrumpa en el primer fotograma de reproducción.

Registros de voz esperados:

- Al unirse: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Al iniciar el tiempo real: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Al recibir audio del hablante: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` y `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Al omitir habla obsoleta: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` o `reason=non-actionable-closing ...`
- Al completarse la respuesta en tiempo real: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Al detener o restablecer la reproducción: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Al realizar una consulta en tiempo real: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Al recibir la respuesta del agente: `discord voice: agent turn answer ...`
- Al poner en cola el habla exacta: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, seguido de `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Al detectar una interrupción verbal: `discord voice: realtime barge-in detected source=speaker-start ...` o `discord voice: realtime barge-in detected source=active-speaker-audio ...`, seguido de `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Al producirse una interrupción en tiempo real: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, seguido de `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` o `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Al ignorar eco o ruido: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Al desactivar la interrupción verbal: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Durante la reproducción inactiva: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Para depurar el audio interrumpido, consulte los registros de voz en tiempo real como una cronología:

1. `realtime audio playback started` significa que Discord ha empezado a reproducir el audio del asistente. A partir de este punto, el puente empieza a contar los fragmentos de salida del asistente, los bytes PCM de Discord, los bytes en tiempo real del proveedor y la duración del audio sintetizado.
2. `realtime speaker turn opened` marca el momento en que un hablante de Discord pasa a estar activo. Si la reproducción ya está activa y `bargeIn` está habilitado, puede ir seguido de `barge-in detected source=speaker-start`.
3. `realtime input audio started` marca el primer fotograma de audio real recibido para ese turno del hablante. `outputActive=true` o un valor distinto de cero de `outputAudioMs` en este punto significa que el micrófono está enviando entrada mientras la reproducción del asistente sigue activa.
4. `barge-in detected source=active-speaker-audio` significa que OpenClaw detectó audio en directo del hablante mientras la reproducción del asistente estaba activa. Esto resulta útil para distinguir una interrupción real de un evento de inicio del hablante de Discord sin audio útil.
5. `barge-in requested reason=...` significa que OpenClaw solicitó al proveedor en tiempo real cancelar o truncar la respuesta activa. Incluye `outputAudioMs`, `outputActive` y `playbackChunks` para mostrar cuánto audio del asistente se había reproducido realmente antes de la interrupción.
6. `realtime audio playback stopped reason=...` es el punto de restablecimiento de la reproducción local de Discord. El motivo indica quién detuvo la reproducción: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` o `session-close`.
7. `realtime speaker turn closed` resume el turno de entrada capturado. `chunks=0` o `hasAudio=false` significa que el turno del hablante se abrió, pero ningún audio utilizable llegó al puente en tiempo real. `interruptedPlayback=true` significa que ese turno de entrada se solapó con la salida del asistente y activó la lógica de interrupción verbal.

Campos útiles:

- `outputAudioMs`: duración del audio del asistente generado por el proveedor en tiempo real antes de la línea de registro.
- `audioMs`: duración del audio del asistente que OpenClaw contabilizó antes de que se detuviera la reproducción.
- `elapsedMs`: tiempo de reloj transcurrido entre la apertura y el cierre del flujo de reproducción o del turno del hablante.
- `discordBytes`: bytes PCM estéreo de 48 kHz enviados a la voz de Discord o recibidos de ella.
- `realtimeBytes`: bytes PCM en el formato del proveedor enviados al proveedor en tiempo real o recibidos de él.
- `playbackChunks`: fragmentos de audio del asistente reenviados a Discord para la respuesta activa.
- `sinceLastAudioMs`: intervalo entre el último fotograma de audio capturado del hablante y el cierre del turno del hablante.

Patrones comunes:

- La interrupción inmediata con `source=active-speaker-audio`, valores pequeños de `outputAudioMs` y el mismo usuario cerca suele indicar que el eco del altavoz está entrando en el micrófono. Aumente `voice.realtime.minBargeInAudioEndMs`, reduzca el volumen del altavoz, use auriculares o configure `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` seguido de `speaker turn closed ... hasAudio=false` significa que Discord informó del inicio de un hablante, pero ningún audio llegó a OpenClaw. Puede deberse a un evento de voz transitorio de Discord, al comportamiento de la puerta de ruido o a que un cliente active brevemente el micrófono.
- `audio playback stopped reason=stream-close` sin una interrupción cercana ni `provider-clear-audio` significa que el flujo de reproducción local de Discord terminó inesperadamente. Revise los registros anteriores del proveedor y del reproductor de Discord.
- `capture ignored during playback (barge-in disabled)` significa que OpenClaw descartó intencionadamente la entrada mientras el audio del asistente estaba activo. Habilite `voice.realtime.bargeIn` si desea que la voz interrumpa la reproducción.
- `barge-in ignored ... outputActive=false` significa que Discord o el VAD del proveedor detectaron voz, pero OpenClaw no tenía ninguna reproducción activa que interrumpir. Esto no debería cortar el audio.

Las credenciales se resuelven por componente: autenticación de la ruta LLM para `voice.model`, autenticación de STT para `tools.media.audio`, autenticación de TTS para `messages.tts`/`voice.tts` y autenticación del proveedor en tiempo real para `voice.realtime.providers` o la configuración de autenticación normal del proveedor.

### Mensajes de voz

Los mensajes de voz de Discord muestran una vista previa de la forma de onda y requieren audio OGG/Opus. OpenClaw genera automáticamente la forma de onda, pero necesita `ffmpeg` y `ffprobe` en el host del Gateway para inspeccionar y convertir el audio.

- Proporcione una **ruta de archivo local** (se rechazan las URL).
- Omita el contenido de texto (Discord rechaza texto + mensaje de voz en la misma carga útil).
- Se acepta cualquier formato de audio; OpenClaw lo convierte a OGG/Opus cuando es necesario.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="Se usaron intents no permitidos o el bot no ve mensajes del servidor">

    - habilite Message Content Intent
    - habilite Server Members Intent cuando dependa de la resolución de usuarios/miembros
    - reinicie el Gateway después de cambiar los intents

  </Accordion>

  <Accordion title="Los mensajes del servidor se bloquean inesperadamente">

    - verifique `groupPolicy`
    - verifique la lista de permitidos del servidor en `channels.discord.guilds`
    - si existe un mapa `channels` del servidor, solo se permiten los canales enumerados
    - verifique el comportamiento de `requireMention` y los patrones de mención

    Comprobaciones útiles:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="La mención no es obligatoria, pero sigue bloqueado">
    Causas habituales:

    - `groupPolicy="allowlist"` sin una lista de permitidos coincidente del servidor/canal
    - `requireMention` configurado en el lugar equivocado (debe estar en `channels.discord.guilds` o en una entrada de canal)
    - remitente bloqueado por la lista de permitidos `users` del servidor/canal

  </Accordion>

  <Accordion title="Turnos prolongados de Discord o respuestas duplicadas">

    Registros habituales:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord no aplica un tiempo de espera propio del canal a los turnos del agente en cola. Los receptores de mensajes transfieren el control inmediatamente, y las ejecuciones de Discord en cola conservan el orden por sesión hasta que el ciclo de vida de la sesión, herramienta o entorno de ejecución finaliza o cancela el trabajo.

  </Accordion>

  <Accordion title="Advertencias de tiempo de espera al consultar metadatos del Gateway">
    OpenClaw obtiene los metadatos `/gateway/bot` de Discord antes de conectarse. Ante fallos transitorios, recurre a la URL predeterminada del Gateway de Discord y limita la frecuencia de los mensajes en los registros.

    El tiempo de espera de los metadatos es de 30 segundos de forma predeterminada. `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS` puede sustituirlo en entornos de host poco habituales.

  </Accordion>

  <Accordion title="Reinicios por tiempo de espera de READY del Gateway">
    OpenClaw espera el evento `READY` del Gateway de Discord durante el inicio y después de las reconexiones del entorno de ejecución. Las configuraciones con varias cuentas y arranque escalonado pueden necesitar una ventana de READY inicial más larga que la predeterminada.

    El inicio espera 15 segundos y las reconexiones del entorno de ejecución esperan 30 segundos. `OPENCLAW_DISCORD_READY_TIMEOUT_MS` y `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS` siguen disponibles para entornos de host poco habituales.

  </Accordion>

  <Accordion title="Discrepancias en la auditoría de permisos">
    Las comprobaciones de permisos de `channels status --probe` solo funcionan con identificadores numéricos de canal.

    Si se utilizan claves de slug, la coincidencia durante la ejecución puede seguir funcionando, pero la sonda no puede verificar completamente los permisos.

  </Accordion>

  <Accordion title="Problemas de mensajes directos y emparejamiento">

    - mensajes directos deshabilitados: `channels.discord.dm.enabled=false`
    - política de mensajes directos deshabilitada: `channels.discord.dmPolicy="disabled"` (heredado: `channels.discord.dm.policy`)
    - pendiente de aprobación del emparejamiento en el modo `pairing`

  </Accordion>

  <Accordion title="Bucles entre bots">
    De forma predeterminada, se ignoran los mensajes creados por bots.

    Si configura `channels.discord.allowBots=true`, use reglas estrictas de mención y listas de permitidos para evitar bucles.
    Es preferible usar `channels.discord.allowBots="mentions"` para aceptar únicamente los mensajes de bots que mencionen al bot.

    OpenClaw también incluye [protección contra bucles de bots](/es/channels/bot-loop-protection) compartida. Siempre que `allowBots` permita que los mensajes creados por bots lleguen al despacho, Discord asigna el evento entrante a hechos `(account, channel, bot pair)` y la protección genérica de pares bloquea el par después de superar el presupuesto de eventos configurado. La protección evita los bucles descontrolados entre dos bots que antes debían detenerse mediante los límites de frecuencia de Discord; no afecta a las implementaciones con un solo bot ni a las respuestas puntuales de bots que se mantengan dentro del presupuesto.

    Configuración predeterminada (activa cuando se establece `allowBots`):

    - `maxEventsPerWindow: 20` -- el par de bots puede intercambiar 20 mensajes dentro de la ventana deslizante
    - `windowSeconds: 60` -- duración de la ventana deslizante
    - `cooldownSeconds: 60` -- una vez superado el presupuesto, todos los mensajes adicionales entre bots en cualquier dirección se descartan durante un minuto

    Configure una vez el valor predeterminado compartido en `channels.defaults.botLoopProtection` y, después, sustitúyalo para Discord cuando un flujo de trabajo legítimo necesite más margen. El orden de precedencia es:

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
      // Sustitución opcional para todo Discord. Los bloques de cuenta sustituyen campos
      // individuales y heredan de aquí los campos omitidos.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha solo escucha a otros bots cuando estos lo mencionan.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo escucha todos los mensajes de Discord creados por bots.
          allowBots: true,
          mentionAliases: {
            // Permite que Bravo escriba una mención de Alpha en Discord con el identificador de usuario configurado.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Permite hasta cinco mensajes por minuto antes de bloquear el par.
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

  <Accordion title="La STT de voz pierde datos con DecryptionFailed(...)">

    - mantenga OpenClaw actualizado (`openclaw update`) para disponer de la lógica de recuperación de recepción de voz de Discord
    - confirme `channels.discord.voice.daveEncryption=true` (valor predeterminado)
    - comience con `channels.discord.voice.decryptionFailureTolerance=24` (valor predeterminado del proyecto de origen) y ajústelo solo si es necesario
    - revise los registros en busca de:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si los fallos continúan después de la reconexión automática, recopile los registros y compárelos con el historial de recepción de DAVE del proyecto de origen en [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) y [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referencia de configuración

Referencia principal: [Referencia de configuración: Discord](/es/gateway/config-channels#discord).

<Accordion title="Campos principales de Discord">

- inicio/autenticación: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- Gateway: `proxy`
- respuesta/historial: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit` (valor predeterminado `2000`), `maxLinesPerMessage` (valor predeterminado `17`)
- transmisión: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (las claves planas heredadas `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce` y `chunkMode` se migran a `streaming.*` mediante `openclaw doctor --fix`)
- contenido multimedia: `mediaMaxMb` (limita las cargas salientes de Discord, valor predeterminado `100`)
- acciones: `actions.*`
- presencia: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- interfaz de usuario: `ui.components.accentColor`
- funciones: `threadBindings`, `bindings[]` de nivel superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `activities`, `heartbeat`, `responsePrefix`

</Accordion>

### Actividades de Discord

Configure `channels.discord.activities` para permitir que los agentes publiquen widgets HTML autónomos que se abren dentro de Discord. El bloque es opcional; cuando está ausente, OpenClaw no registra rutas de Activity, herramientas ni controladores de interacción. Consulte [Actividades de Discord](/es/channels/discord-activities) para configurar el Developer Portal, el túnel, la seguridad y la solución de problemas.

- `activities.clientSecret`: secreto del cliente OAuth2 de la aplicación de Discord; recurre a `DISCORD_CLIENT_SECRET`
- `activities.applicationId`: identificador opcional de la aplicación Activity; de forma predeterminada, usa el identificador de la aplicación del bot obtenido al iniciar el Gateway

## Seguridad y operaciones

- Trate los tokens de bots como secretos (se prefiere `DISCORD_BOT_TOKEN` en entornos supervisados).
- Conceda los permisos mínimos necesarios en Discord.
- Si la implementación o el estado de los comandos están desactualizados, reinicie el Gateway y vuelva a comprobarlos con `openclaw channels status --probe`.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Actividades de Discord" icon="window" href="/es/channels/discord-activities">
    Inicie widgets HTML interactivos dentro de Discord.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Empareje un usuario de Discord con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento del chat grupal y de las listas de permitidos.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enrute los mensajes entrantes a los agentes.
  </Card>
  <Card title="Seguridad" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y refuerzo de la seguridad.
  </Card>
  <Card title="Enrutamiento multiagente" icon="sitemap" href="/es/concepts/multi-agent">
    Asigne servidores y canales a los agentes.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de los comandos nativos.
  </Card>
</CardGroup>
