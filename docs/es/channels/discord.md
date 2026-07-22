---
read_when:
    - Trabajo en funcionalidades del canal de Discord
summary: Configuración del bot de Discord, claves de configuración, componentes, voz y solución de problemas
title: Discord
x-i18n:
    generated_at: "2026-07-22T10:25:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 52a2926217f3a8dfb9398551ddacb0bc6aae6de0a164b215c55256eda9b6245e
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw se conecta a Discord como un bot mediante el Gateway oficial de Discord. Se admiten los mensajes directos y los canales de servidor.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de Discord usan de forma predeterminada el modo de emparejamiento.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de los comandos nativos y catálogo de comandos.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico entre canales y flujo de reparación.
  </Card>
</CardGroup>

## Configuración rápida

Cree una aplicación de Discord con un bot, añada el bot a su servidor y emparéjelo con OpenClaw. Use un servidor privado si puede; si es necesario, [cree uno primero](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**).

<Steps>
  <Step title="Crear una aplicación y un bot de Discord">
    En el [Portal para desarrolladores de Discord](https://discord.com/developers/applications), haga clic en **New Application** y asígnele un nombre (por ejemplo, «OpenClaw»).

    Abra **Bot** en la barra lateral y establezca **Username** en el nombre de su agente.

  </Step>

  <Step title="Habilitar intents privilegiados">
    Todavía en la página **Bot**, en **Privileged Gateway Intents**, habilite:

    - **Message Content Intent** (obligatorio)
    - **Server Members Intent** (recomendado; obligatorio para listas de permitidos por rol, correspondencia de nombres con identificadores y grupos de acceso por audiencia del canal)
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

    Esta es la configuración básica para los canales de texto normales. Si el bot va a publicar en hilos —incluidos los flujos de trabajo de canales de foro o multimedia que crean o continúan un hilo—, habilite también **Send Messages in Threads**.

    Copie la URL generada, ábrala en un navegador, seleccione el servidor y haga clic en **Continue**. El bot debería aparecer ahora en el servidor.

  </Step>

  <Step title="Habilitar el modo de desarrollador y obtener los identificadores">
    En la aplicación de Discord, habilite el modo de desarrollador para poder copiar los identificadores:

    1. **User Settings** (icono de engranaje) → **Developer** → active **Developer Mode**
       *(en dispositivos móviles: **App Settings** → **Advanced**)*
    2. Haga clic con el botón derecho en el **icono del servidor** → **Copy Server ID**
    3. Haga clic con el botón derecho en su **propio avatar** → **Copy User ID**

    Conserve el identificador del servidor y el identificador de usuario junto con el token del bot; necesitará los tres a continuación.

  </Step>

  <Step title="Permitir mensajes directos de miembros del servidor">
    Para que el emparejamiento funcione, Discord debe permitir que el bot le envíe mensajes directos. Haga clic con el botón derecho en el **icono del servidor** → **Privacy Settings** → active **Direct Messages**.

    Mantenga esta opción activada si utiliza mensajes directos de Discord con OpenClaw. Si solo utiliza canales de servidor, puede desactivarla después del emparejamiento.

  </Step>

  <Step title="Configurar el token del bot de forma segura (no enviarlo por el chat)">
    El token del bot es un secreto. Configúrelo en la máquina que ejecuta OpenClaw antes de enviar mensajes al agente:

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
    Para instalaciones como servicio administrado, ejecute `openclaw gateway install` desde un shell en el que esté definido `DISCORD_BOT_TOKEN`, o almacene la variable en `~/.openclaw/.env` para que el servicio pueda resolver la SecretRef del entorno después de reiniciarse.
    Si Discord bloquea o limita por frecuencia la consulta de la aplicación al iniciar desde su host, configure el identificador de aplicación/cliente del Portal para desarrolladores para que el inicio pueda omitir esa llamada REST: `channels.discord.applicationId` para la cuenta predeterminada o `channels.discord.accounts.<accountId>.applicationId` para cada bot.

  </Step>

  <Step title="Configurar OpenClaw y realizar el emparejamiento">

    <Tabs>
      <Tab title="Pedir al agente">
        Converse con su agente de OpenClaw en un canal existente (por ejemplo, Telegram) e indíqueselo. Si Discord es su primer canal, use en su lugar la pestaña CLI / configuración.

        > «Ya configuré el token de mi bot de Discord. Finaliza la configuración de Discord con el identificador de usuario `<user_id>` y el identificador de servidor `<server_id>`».
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

        Para una configuración mediante scripts o de forma remota, escriba el mismo bloque JSON5 con `openclaw config patch --file ./discord.patch.json5 --dry-run` y, después, vuelva a ejecutarlo sin `--dry-run`. También funcionan las cadenas `token` de texto sin formato, y se admiten valores SecretRef para `channels.discord.token` mediante proveedores de entorno, archivo y ejecución. Consulte [Gestión de secretos](/es/gateway/secrets).

        Para varios bots de Discord, mantenga el token y el identificador de aplicación de cada bot en su cuenta. Las cuentas heredan un `channels.discord.applicationId` de nivel superior, por lo que solo debe configurarlo allí cuando todas las cuentas utilicen el mismo identificador de aplicación.

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
    Una vez que el Gateway esté en ejecución, envíe un mensaje directo al bot en Discord. Este responderá con un código de emparejamiento.

    <Tabs>
      <Tab title="Pedir al agente">
        Envíe el código de emparejamiento al agente en su canal existente:

        > «Aprueba este código de emparejamiento de Discord: `<CODE>`».
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
La resolución de tokens tiene en cuenta la cuenta. Los valores de token de la configuración tienen prioridad sobre la alternativa de entorno, y `DISCORD_BOT_TOKEN` solo se utiliza para la cuenta predeterminada.
Si dos cuentas de Discord habilitadas se resuelven al mismo token de bot, OpenClaw inicia un solo monitor del Gateway para ese token: un token procedente de la configuración tiene prioridad sobre la alternativa de entorno; de lo contrario, prevalece la primera cuenta habilitada y la cuenta duplicada se notifica como deshabilitada con el motivo `duplicate bot token`.
Para llamadas salientes avanzadas (herramienta de mensajes/acciones de canal), se utiliza un `token` explícito por llamada. Esto se aplica tanto a las acciones de envío como a las de lectura o sondeo (leer/buscar/obtener/hilo/mensajes fijados/permisos). La configuración de políticas y reintentos de la cuenta sigue procediendo de la cuenta seleccionada en la instantánea activa del entorno de ejecución.
</Note>

## Recomendación: configurar un espacio de trabajo de servidor

Una vez que funcionen los mensajes directos, puede convertir el servidor en un espacio de trabajo completo donde cada canal tenga su propia sesión de agente con su propio contexto. Se recomienda para servidores privados donde solo están usted y el bot.

<Steps>
  <Step title="Añadir el servidor a la lista de permitidos de servidores">
    Esto permite que el agente responda en cualquier canal del servidor, no solo en mensajes directos.

    <Tabs>
      <Tab title="Pedir al agente">
        > «Añade mi identificador de servidor de Discord `<server_id>` a la lista de permitidos de servidores».
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

    En los canales de servidor, las respuestas normales se publican automáticamente de forma predeterminada. Para salas compartidas siempre activas, habilite `messages.groupChat.visibleReplies: "message_tool"` para que el agente pueda permanecer a la espera y publicar solo cuando determine que una respuesta en el canal es útil. Esto funciona mejor con modelos de última generación y uso fiable de herramientas, como GPT-5.6 Sol. Los eventos de sala ambientales permanecen silenciosos a menos que la herramienta envíe algo. Consulte [Eventos de sala ambientales](/es/channels/ambient-room-events) para ver la configuración completa del modo de espera.

    Si Discord muestra que el agente está escribiendo y los registros muestran uso de tokens, pero no se publica ningún mensaje, compruebe si el turno se configuró como evento de sala ambiental o si se habilitaron las respuestas visibles mediante la herramienta de mensajes.

    <Tabs>
      <Tab title="Pedir al agente">
        > «Permite que mi agente responda en este servidor sin necesidad de que se lo mencione con @».
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

        Para exigir envíos mediante la herramienta de mensajes en las respuestas visibles de grupo o canal, establezca `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planificar la memoria en los canales del servidor">
    La memoria a largo plazo (MEMORY.md) solo se carga automáticamente en las sesiones de mensajes directos; los canales del servidor no la cargan.

    <Tabs>
      <Tab title="Pedir al agente">
        > «Cuando haga preguntas en canales de Discord, usa memory_search o memory_get si necesitas contexto a largo plazo de MEMORY.md».
      </Tab>
      <Tab title="Manual">
        Para disponer de contexto compartido en todos los canales, coloque las instrucciones estables en `AGENTS.md` o `USER.md` (se insertan en cada sesión). Mantenga las notas a largo plazo en `MEMORY.md` y acceda a ellas cuando sea necesario mediante las herramientas de memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ahora cree canales y empiece a conversar. El agente ve el nombre del canal, y cada canal es una sesión aislada: configure `#coding`, `#home`, `#research` o lo que mejor se adapte a su flujo de trabajo.

## Modelo de ejecución

- El Gateway controla la conexión con Discord.
- El enrutamiento de respuestas es determinista: las respuestas a entradas de Discord vuelven a Discord.
- Los metadatos del servidor y del canal de Discord se añaden al prompt del modelo como contexto no fiable, no como prefijo de respuesta visible para el usuario. Si un modelo vuelve a copiar ese envoltorio, OpenClaw elimina los metadatos copiados de las respuestas salientes y del contexto de reproducción futuro.
- De forma predeterminada (`session.dmScope=main`), los chats directos comparten la sesión principal del agente (`agent:main:main`).
- Los canales del servidor utilizan claves de sesión aisladas (`agent:<agentId>:discord:channel:<channelId>`).
- Los mensajes directos grupales se ignoran de forma predeterminada (`channels.discord.dm.groupEnabled=false`).
- Los comandos de barra nativos se ejecutan en sesiones de comandos aisladas (`agent:<agentId>:discord:slash:<userId>`), aunque siguen llevando `CommandTargetSessionKey` a la sesión de conversación enrutada.
- La entrega de anuncios de Cron/Heartbeat de solo texto a Discord se reduce a la respuesta final visible del asistente, que se envía una sola vez. Los contenidos multimedia y las cargas útiles de componentes estructurados siguen enviándose en varios mensajes cuando el agente emite varias cargas útiles entregables.

## Canales de foro

Los canales de foro y multimedia de Discord solo aceptan publicaciones en hilos. OpenClaw admite dos formas de crearlas:

- Enviar un mensaje al foro principal (`channel:<forumId>`) para crear automáticamente un hilo. El título del hilo es la primera línea no vacía del mensaje (truncada al límite de 100 caracteres de Discord para nombres de hilo).
- Usar `openclaw message thread create` para crear un hilo directamente. No pasar `--message-id` para canales de foro.

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

Los foros principales no aceptan componentes de Discord. Si se necesitan componentes, enviar el mensaje al propio hilo (`channel:<threadId>`).

## Componentes interactivos

OpenClaw admite contenedores de componentes v2 de Discord para los mensajes del agente. Usar la herramienta de mensajes con una carga útil `components`. Los resultados de las interacciones se redirigen al agente como mensajes entrantes normales y siguen la configuración existente de `replyToMode` de Discord.

Bloques compatibles:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Las filas de acciones permiten hasta 5 botones o un único menú de selección
- Tipos de selección: `string`, `user`, `role`, `mentionable`, `channel`

De forma predeterminada, los componentes son de un solo uso. Establecer `components.reusable=true` para permitir que los botones, las selecciones y los formularios se utilicen varias veces hasta que caduquen.

Para restringir quién puede hacer clic en un botón, establecer `allowedUsers` en ese botón (identificadores de usuario de Discord, etiquetas o `*`). Los usuarios que no coincidan reciben una denegación efímera.

Las devoluciones de llamada de los componentes caducan después de 30 minutos de forma predeterminada. Establecer `channels.discord.agentComponents.ttlMs` para cambiar la duración del registro de devoluciones de llamada de la cuenta predeterminada, o `channels.discord.accounts.<accountId>.agentComponents.ttlMs` para cada cuenta. El valor se expresa en milisegundos, debe ser un entero positivo y tiene un límite de `86400000` (24 horas). Los TTL más largos son adecuados para los flujos de revisión o aprobación que requieren que los botones sigan disponibles, pero amplían el periodo durante el cual un mensaje antiguo de Discord aún puede activar una acción. Se recomienda usar el TTL más corto que resulte adecuado y mantener el valor predeterminado cuando las devoluciones de llamada obsoletas puedan resultar inesperadas.

Los comandos de barra `/model` y `/models` abren un selector de modelos interactivo con menús desplegables de proveedor, modelo y entorno de ejecución compatible, además de un paso para enviar. `/models add` está obsoleto y devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat. La respuesta del selector es efímera y solo puede utilizarla el usuario que lo invocó. Los menús de selección de Discord están limitados a 25 opciones, por lo que deben añadirse entradas `provider/*` a `agents.defaults.modelPolicy.allow` cuando se quiera que el selector muestre modelos detectados dinámicamente solo para proveedores seleccionados, como `openai` o `vllm`.

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
    `channels.discord.dmPolicy` controla el acceso a los mensajes directos. `channels.discord.allowFrom` es la lista canónica de remitentes permitidos para mensajes directos.

    - `pairing` (predeterminado)
    - `allowlist` (requiere al menos un remitente `allowFrom`)
    - `open` (requiere que `channels.discord.allowFrom` incluya `"*"`)
    - `disabled`

    Si la política de mensajes directos no está abierta, se bloquea a los usuarios desconocidos (o se les solicita el emparejamiento en el modo `pairing`).

    Precedencia entre varias cuentas:

    - `channels.discord.accounts.default.allowFrom` solo se aplica a la cuenta `default`.
    - Para una cuenta, `allowFrom` tiene precedencia sobre el valor heredado `dm.allowFrom`.
    - Las cuentas con nombre heredan `channels.discord.allowFrom` cuando sus propios valores `allowFrom` y el valor heredado `dm.allowFrom` no están establecidos.
    - Las cuentas con nombre no heredan `channels.discord.accounts.default.allowFrom`.

    Los valores heredados `channels.discord.dm.policy` y `channels.discord.dm.allowFrom` aún se leen por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    Formato del destino de mensajes directos para la entrega:

    - `user:<id>`
    - mención `<@id>`

    Los identificadores numéricos sin formato normalmente se resuelven como identificadores de canal cuando está activo un canal predeterminado, pero los identificadores incluidos en el valor efectivo de `allowFrom` para mensajes directos de la cuenta se tratan como destinos de mensajes directos de usuario por compatibilidad.

  </Tab>

  <Tab title="Grupos de acceso">
    Los mensajes directos de Discord y la autorización de comandos de texto pueden usar entradas dinámicas `accessGroup:<name>` en `channels.discord.allowFrom`.

    Los nombres de los grupos de acceso se comparten entre los canales de mensajes. Usar `type: "message.senders"` para un grupo estático cuyos miembros se expresen con la sintaxis normal de `allowFrom` de cada canal, o `type: "discord.channelAudience"` cuando la audiencia actual de `ViewChannel` de un canal de Discord deba definir dinámicamente la pertenencia. Comportamiento compartido de los grupos de acceso: [Grupos de acceso](/es/channels/access-groups).

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

    Un canal de texto de Discord no tiene una lista de miembros independiente. `type: "discord.channelAudience"` representa la pertenencia de la siguiente manera: el remitente del mensaje directo es miembro del servidor configurado y actualmente tiene el permiso efectivo `ViewChannel` en el canal configurado después de aplicar las sobrescrituras de roles y del canal.

    Ejemplo: permitir que cualquier persona que pueda ver `#maintainers` envíe mensajes directos al bot, manteniendo los mensajes directos cerrados para todas las demás personas.

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

    Las búsquedas fallan de forma cerrada. Si Discord devuelve `Missing Access`, la búsqueda del miembro falla o el canal pertenece a un servidor diferente, el remitente del mensaje directo se considera no autorizado.

    Activar **Server Members Intent** en el Discord Developer Portal cuando se usen grupos de acceso basados en la audiencia del canal. Los mensajes directos no incluyen el estado de pertenencia al servidor, por lo que OpenClaw resuelve al miembro mediante la API REST de Discord en el momento de la autorización.

  </Tab>

  <Tab title="Política de servidores">
    La gestión de servidores se controla mediante `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La configuración de seguridad de referencia cuando existe `channels.discord` es `allowlist`.

    Comportamiento de `allowlist`:

    - el servidor debe coincidir con `channels.discord.guilds` (se prefiere `id`; también se acepta un slug)
    - listas opcionales de remitentes permitidos: `users` (se recomiendan identificadores estables) y `roles` (solo identificadores de rol); si se configura cualquiera de ellas, se permite a los remitentes cuando coinciden con `users` O `roles`
    - la coincidencia directa de nombres o etiquetas está desactivada de forma predeterminada; activar `channels.discord.dangerouslyAllowNameMatching: true` solo como modo de compatibilidad de emergencia
    - se admiten nombres y etiquetas para `users`, pero los identificadores son más seguros; `openclaw security audit` muestra una advertencia cuando se usan entradas de nombre o etiqueta
    - si un servidor tiene configurado `channels`, se deniegan los canales que no figuren en la lista
    - si un servidor no tiene ningún bloque `channels`, se permiten todos los canales de ese servidor incluido en la lista de permitidos

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

    Si solo se establece `DISCORD_BOT_TOKEN` y no se crea un bloque `channels.discord`, el valor alternativo durante la ejecución es `groupPolicy="allowlist"` (con una advertencia en los registros), incluso si `channels.defaults.groupPolicy` es `open`.

  </Tab>

  <Tab title="Menciones y mensajes directos grupales">
    Los mensajes de los servidores requieren una mención de forma predeterminada.

    La detección de menciones incluye:

    - mención explícita del bot
    - patrones de mención configurados (`agents.entries.*.groupChat.mentionPatterns`, con `messages.groupChat.mentionPatterns` como valor alternativo)
    - comportamiento implícito al responder al bot en los casos compatibles

    Al escribir mensajes salientes de Discord, usar la sintaxis canónica de menciones: `<@USER_ID>` para usuarios, `<#CHANNEL_ID>` para canales y `<@&ROLE_ID>` para roles. No usar el formato heredado de mención por apodo `<@!USER_ID>`.

    `requireMention` se configura por servidor o canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` descarta opcionalmente los mensajes que mencionan a otro usuario o rol, pero no al bot (excepto @everyone/@here).

    Mensajes directos grupales:

    - valor predeterminado: se ignoran (`dm.groupEnabled=false`)
    - lista opcional de permitidos mediante `dm.groupChannels` (identificadores de canal o slugs)

  </Tab>
</Tabs>

### Enrutamiento de agentes basado en roles

Usar `bindings[].match.roles` para dirigir a los miembros de un servidor de Discord a diferentes agentes según el identificador de rol. Las vinculaciones basadas en roles solo aceptan identificadores de rol y se evalúan después de las vinculaciones de interlocutor o interlocutor principal y antes de las vinculaciones exclusivas del servidor. Si una vinculación también establece otros campos de coincidencia (por ejemplo, `peer` + `guildId` + `roles`), todos los campos configurados deben coincidir.

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

- `commands.native` utiliza de forma predeterminada `"auto"` y está habilitado para Discord.
- Anulación por canal: `channels.discord.commands.native`.
- `commands.native=false` omite el registro y la limpieza de comandos de barra de Discord durante el inicio. Los comandos registrados anteriormente pueden seguir visibles en Discord hasta que se eliminen de la aplicación de Discord.
- La autorización de comandos nativos utiliza las mismas listas de permitidos y políticas de Discord que el procesamiento normal de mensajes.
- Los comandos pueden seguir visibles en la interfaz de Discord para usuarios no autorizados; la ejecución aplica la autorización de OpenClaw y responde "no autorizado".
- Configuración predeterminada de comandos de barra: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Consulte [Comandos de barra](/es/tools/slash-commands) para conocer el catálogo y el comportamiento de los comandos.

## Detalles de las funciones

<AccordionGroup>
  <Accordion title="Etiquetas de respuesta y respuestas nativas">
    Discord admite etiquetas de respuesta en la salida del agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controlado mediante `channels.discord.replyToMode`:

    - `off` (predeterminado): no se crean hilos de respuesta implícitos; se siguen respetando las etiquetas `[[reply_to_*]]` explícitas
    - `first`: adjunta la referencia de respuesta nativa implícita al primer mensaje saliente de Discord del turno
    - `all`: la adjunta a todos los mensajes salientes
    - `batched`: la adjunta solo cuando el evento entrante era un lote con antirrebote de varios mensajes; resulta útil cuando se desean respuestas nativas principalmente para conversaciones ambiguas con ráfagas de mensajes, no para cada turno de un solo mensaje

    Los identificadores de mensajes se incluyen en el contexto y el historial para que los agentes puedan dirigirse a mensajes específicos.

  </Accordion>

  <Accordion title="Vistas previas de enlaces">
    Discord genera de forma predeterminada inserciones enriquecidas de enlaces para las URL. OpenClaw suprime de forma predeterminada esas inserciones generadas en los mensajes salientes de Discord, por lo que las URL enviadas por el agente permanecen como enlaces simples salvo que se habiliten:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Establezca `channels.discord.accounts.<id>.suppressEmbeds` para anularlo en una cuenta. Los envíos mediante la herramienta de mensajes del agente también pueden pasar `suppressEmbeds: false` para un solo mensaje. Las cargas útiles `embeds` explícitas de Discord no se suprimen mediante la configuración predeterminada de vistas previas de enlaces.

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

    - `off` deshabilita las ediciones de vistas previas de Discord.
    - `partial` edita un único mensaje de vista previa a medida que llegan los tokens.
    - `block` emite fragmentos con tamaño de borrador; ajuste el tamaño y los puntos de interrupción mediante `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), con el límite de `textChunkLimit`. Cuando se habilita explícitamente la transmisión por bloques, OpenClaw omite la transmisión de la vista previa para evitar una transmisión duplicada.
    - `progress` mantiene un borrador de estado editable hasta la entrega final. De forma predeterminada, muestra una línea del preámbulo o la narración más reciente del agente, sin etiqueta generada, espaciador ni filas de herramientas.
    - Los resultados finales con contenido multimedia, errores o respuestas explícitas cancelan las ediciones pendientes de la vista previa.
    - `streaming.preview.toolProgress` utiliza de forma predeterminada `true` en el modo `partial`/`block`. El modo de progreso de Discord no muestra filas de herramientas de forma predeterminada; establezca `streaming.progress.toolProgress: true` para habilitarlas.
    - Establezca `streaming.progress.toolProgress: true` para añadir filas compactas de herramientas o progreso, como `🛠️ Bash: run tests` o `🔎 Web Search: for "query"`. Por compatibilidad, una configuración existente de `progress.label` o `progress.labels` conserva el valor predeterminado anterior de las filas de herramientas; establezca `toolProgress: false` para usar una etiqueta personalizada sin filas.
    - `streaming.progress.commentary` (valor predeterminado `false`) habilita los comentarios sin procesar del asistente en el borrador temporal de progreso. La línea de estado predeterminada del preámbulo o la narración es independiente de esta opción. Los comentarios se limpian antes de mostrarse, permanecen transitorios y no cambian la entrega de la respuesta final.
    - `streaming.progress.maxLineChars` controla el límite por línea de la vista previa de progreso. La prosa se acorta respetando los límites de las palabras; los detalles de comandos y rutas conservan sufijos útiles.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controla los detalles de comandos y ejecuciones en las líneas compactas de progreso: `raw` (predeterminado) o `status` (solo la etiqueta de la herramienta).

    Oculte el texto sin procesar de comandos y ejecuciones, pero conserve las líneas compactas de progreso:

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

    La transmisión de vistas previas solo admite texto; las respuestas con contenido multimedia recurren a la entrega normal.

  </Accordion>

  <Accordion title="Comportamiento del historial, el contexto y los hilos">
    Contexto del historial del servidor:

    - `channels.discord.historyLimit` valor predeterminado `20`
    - alternativa: `messages.groupChat.historyLimit`
    - `0` deshabilita

    Controles del historial de mensajes directos:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamiento de los hilos:

    - Los hilos de Discord se enrutan como sesiones de canal y heredan la configuración del canal principal salvo que se anule.
    - Las sesiones de hilo heredan la selección `/model` de nivel de sesión del canal principal como alternativa exclusiva para el modelo; las selecciones `/model` locales del hilo tienen prioridad, y el historial de la transcripción principal no se copia salvo que se habilite la herencia de transcripciones.
    - `channels.discord.thread.inheritParent` (valor predeterminado `false`) permite que los nuevos hilos automáticos se inicialicen a partir de la transcripción principal. Anulación por cuenta: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Las reacciones de la herramienta de mensajes pueden resolver destinos de mensajes directos `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` se conserva durante la activación alternativa de la fase de respuesta.

    Los temas de los canales se insertan como contexto **no confiable**. Las listas de permitidos controlan quién puede activar al agente, pero no constituyen un límite completo de ocultación del contexto complementario.

  </Accordion>

  <Accordion title="Sesiones vinculadas a hilos para subagentes">
    Discord puede vincular un hilo a un destino de sesión para que los mensajes posteriores de ese hilo sigan enrutándose a la misma sesión, incluidas las sesiones de subagentes.

    Comandos:

    - `/focus <target>` vincula el hilo actual o uno nuevo a un destino de subagente o sesión
    - `/unfocus` elimina la vinculación del hilo actual
    - `/agents` muestra las ejecuciones activas y el estado de vinculación
    - `/session idle <duration|off>` consulta o actualiza la pérdida automática de foco por inactividad de las vinculaciones enfocadas
    - `/session max-age <duration|off>` consulta o actualiza la antigüedad máxima absoluta de las vinculaciones enfocadas

    Configuración:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
      spawnSessions: true,
      defaultSpawnContext: "fork",
    },
  },
}
```

    Notas:

    - `session.threadBindings.*` es la política canónica para Discord y Telegram.
    - `spawnSessions` controla la creación y vinculación automáticas de hilos para `sessions_spawn({ thread: true })` y las generaciones de hilos de ACP. Valor predeterminado: `true`.
    - `defaultSpawnContext` controla el contexto nativo de subagentes para las generaciones vinculadas a hilos. Valor predeterminado: `"fork"`.
    - Las claves obsoletas `spawnSubagentSessions`/`spawnAcpSessions` se migran mediante `openclaw doctor --fix`.
    - Si las vinculaciones de hilos están deshabilitadas, `/focus` y las operaciones relacionadas no están disponibles.

    Consulte [Subagentes](/es/tools/subagents), [Agentes ACP](/es/tools/acp-agents) y [Referencia de configuración](/es/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Progreso del subagente en el mensaje de origen">
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

    Esta función es opcional y utiliza valores predeterminados internos fijos de temporización y emojis. El bot necesita el permiso **Add Reactions** para proporcionar información mediante reacciones. El valor `channels.discord.accounts.<id>.subagentProgress` de nivel de cuenta anula el valor de nivel superior.

  </Accordion>

  <Accordion title="Vinculaciones persistentes de canales ACP">
    Para espacios de trabajo ACP estables y siempre activos, configure vinculaciones ACP con tipo en el nivel superior que apunten a conversaciones de Discord.

    Ruta de configuración: `bindings[]` con `type: "acp"` y `match.channel: "discord"`.

```json5
{
  agents: {
    entries: {
      codex: {
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
    },
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
    - En un canal o hilo vinculado, `/new` y `/reset` restablecen la misma sesión ACP en el mismo lugar. Las vinculaciones temporales de hilos pueden anular la resolución del destino mientras estén activas.
    - `spawnSessions` controla la creación y vinculación de hilos secundarios mediante `--thread auto|here`.

    Consulte [Agentes ACP](/es/tools/acp-agents) para obtener detalles sobre el comportamiento de las vinculaciones.

  </Accordion>

  <Accordion title="Notificaciones de reacciones">
    Modo de notificación de reacciones por servidor (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (predeterminado)
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
                reconnectSuppressSeconds: 300, // opcional; periodo de silencio de una sesión nueva (0 lo desactiva)
                burstLimit: 8, // opcional; máximo de eventos por ventana de ráfaga
                burstWindowSeconds: 60, // opcional; ventana deslizante de detección de ráfagas
              },
            },
          },
        },
      },
    }
    ```

    `presenceEvents` requiere que el Heartbeat esté habilitado para el agente enrutado y el **Presence Intent** privilegiado en la página Bot de la aplicación en el Discord Developer Portal. OpenClaw obtiene los miembros conectados actuales de cada instantánea completa `GUILD_CREATE`, enruta las transiciones observadas de desconectado a conectado y también considera como recién disponible una primera señal posterior de conexión de un miembro no visto. Ese miembro puede haberse conectado o unido después de la instantánea, por lo que el evento no afirma un estado anterior exacto. Solo son elegibles las personas que pueden ver `channelId`: los canales y los hilos públicos requieren **View Channel** en el canal o canal principal, mientras que los hilos privados también requieren pertenencia o **Manage Threads**. `users` puede restringir aún más esa audiencia. OpenClaw ignora los bots y los estados de conexión sin cambios, y conserva durante ocho horas el periodo de espera por usuario entre reinicios del Gateway. Cuando Discord establece una nueva sesión del Gateway y envía `READY`, OpenClaw suprime los eventos derivados de presencia durante `reconnectSuppressSeconds` (valor predeterminado: 300; `0` lo desactiva) mientras se reconstruye el estado de presencia del servidor, para que los miembros observados de nuevo no activen al agente uno por uno. Además, limita por servidor la frecuencia de los eventos puestos correctamente en cola a `burstLimit` eventos (valor predeterminado: 8) por ventana deslizante de `burstWindowSeconds` (valor predeterminado: 60), y registra una sola vez cada episodio de supresión del servidor. Una sesión reanudada no se considera una sesión nueva. Discord limita las instantáneas de los servidores con más de 75,000 miembros; en esos casos, OpenClaw requiere una actualización explícita al estado desconectado antes de saludar. El evento del sistema contiene identificadores inmutables de usuario, servidor y canal sin incluir nombres visibles modificables. El agente decide si debe saludar y cómo hacerlo.

  </Accordion>

  <Accordion title="Reacciones de confirmación">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - emoji alternativo de la identidad del agente (`agents.entries.*.identity.emoji`; de lo contrario, "👀")

    Notas:

    - Discord acepta emojis Unicode o nombres de emojis personalizados.
    - Use `""` para desactivar la reacción en un canal o una cuenta.

    **Ámbito (`messages.ackReactionScope`):**

    Valores: `"all"` (mensajes directos + grupos, incluidos los eventos ambientales de sala), `"direct"` (solo mensajes directos), `"group-all"` (todos los mensajes de grupo excepto los eventos ambientales de sala, sin mensajes directos), `"group-mentions"` (grupos cuando se menciona al bot; **sin mensajes directos**, valor predeterminado), `"off"` / `"none"` (desactivado).

    <Note>
    El ámbito predeterminado (`"group-mentions"`) no activa reacciones de confirmación en mensajes directos ni en eventos ambientales de sala. Para obtener una reacción de confirmación en los mensajes directos entrantes de Discord y en los eventos de salas silenciosas, establezca `messages.ackReactionScope` en `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Escrituras de configuración">
    Las escrituras de configuración iniciadas desde el canal están habilitadas de forma predeterminada. Esto afecta a los flujos `/config set|unset` (cuando las funciones de comandos están habilitadas).

    Para desactivarlas:

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
    El uso de proxy para el WebSocket del Gateway de Discord es explícito; las conexiones WebSocket no heredan las variables de entorno de proxy del proceso del Gateway. Las consultas REST de inicio utilizan este proxy cuando se configura `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Sustitución por cuenta:

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
    - los nombres visibles de los miembros se comparan por nombre/slug solo cuando `channels.discord.dangerouslyAllowNameMatching: true`
    - las consultas acceden a la API de PluralKit con el ID del mensaje original
    - si la consulta falla, los mensajes enviados mediante proxy se tratan como mensajes de bot y se descartan, salvo que `allowBots` permita su paso

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
    Las actualizaciones de presencia se aplican al establecer un campo de estado o actividad, o al habilitar la presencia automática.

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
    - 1: Transmitiendo (requiere `activityUrl`; `activityUrl` a su vez requiere `activityType: 1`)
    - 2: Escuchando
    - 3: Viendo
    - 4: Personalizada (utiliza el texto de la actividad como estado; el emoji es opcional)
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

    La presencia automática asigna la disponibilidad del entorno de ejecución al estado de Discord: correcto => conectado, degradado o desconocido => ausente, agotado o no disponible => no molestar. Valores predeterminados: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (debe ser menor o igual que `intervalMs`). Sustituciones de texto opcionales:

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

    Discord habilita automáticamente las aprobaciones nativas de ejecución cuando `enabled` no está definido o es `"auto"`, y puede resolverse al menos un aprobador, ya sea desde `execApprovals.approvers` o desde `commands.ownerAllowFrom`. Discord no deduce aprobadores de ejecución a partir de `allowFrom` del canal, `dm.allowFrom` heredado ni `defaultTo` de mensajes directos. Establezca `enabled: false` para desactivar explícitamente Discord como cliente de aprobación nativo.

    Para comandos de grupo sensibles y exclusivos del propietario, como `/diagnostics` y `/export-trajectory`, OpenClaw envía en privado las solicitudes de aprobación y los resultados finales. Primero intenta usar un mensaje directo de Discord cuando el propietario que invoca el comando tiene una ruta de propietario de Discord; de lo contrario, recurre a la primera ruta de propietario disponible de `commands.ownerAllowFrom`, como Telegram.

    Cuando `target` es `channel` o `both`, la solicitud de aprobación es visible en el canal. Solo los aprobadores resueltos pueden usar los botones; los demás usuarios reciben una denegación efímera. Las solicitudes de aprobación incluyen el texto del comando, por lo que la entrega en canales solo debe habilitarse en canales de confianza. Si no se puede derivar el ID del canal a partir de la clave de sesión, OpenClaw recurre a la entrega mediante mensaje directo.

    Discord representa los botones de aprobación compartidos que utilizan otros canales de chat; el adaptador nativo de Discord añade principalmente el enrutamiento de mensajes directos a los aprobadores y la distribución a canales. Cuando estos botones están presentes, constituyen la experiencia principal de aprobación; OpenClaw solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique que las aprobaciones mediante chat no están disponibles o que la aprobación manual es la única opción. Si el entorno de ejecución de aprobación nativo de Discord no está activo, OpenClaw mantiene visible la solicitud determinista local `/approve <id> <decision>`. Si el entorno de ejecución está activo, pero no puede entregarse una tarjeta nativa a ningún destino, OpenClaw envía en el mismo chat un aviso alternativo con el comando exacto `/approve` de la aprobación pendiente.

    La autenticación del Gateway y la resolución de aprobaciones siguen el contrato compartido del cliente del Gateway (los ID `plugin:` se resuelven mediante `plugin.approval.resolve`; los demás ID, mediante `exec.approval.resolve`). Las aprobaciones caducan después de 30 minutos de forma predeterminada.

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

| Grupo de acciones                                                                                                                                                         | Predeterminado |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| reacciones, mensajes, hilos, elementos fijados, encuestas, búsqueda, información del miembro, información del rol, información del canal, canales, estado de voz, eventos, stickers, cargas de emojis, cargas de stickers, permisos | habilitado     |
| roles                                                                                                                                                                    | deshabilitado  |
| moderación                                                                                                                                                               | deshabilitado  |
| presencia                                                                                                                                                                | deshabilitado  |

## Interfaz de usuario de componentes v2

OpenClaw utiliza los componentes v2 de Discord para las aprobaciones de ejecución y los marcadores entre contextos. Las acciones de mensajes de Discord también pueden aceptar `components` para una interfaz de usuario personalizada (avanzado; requiere construir una carga útil de componentes mediante la herramienta de Discord), mientras que los `embeds` heredados siguen disponibles, pero no se recomiendan.

- `channels.discord.ui.components.accentColor` establece el color de énfasis utilizado por los contenedores de componentes de Discord (hexadecimal). Por cuenta: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` controla durante cuánto tiempo permanecen registrados los callbacks de componentes de Discord enviados (valor predeterminado: `1800000`; máximo: `86400000`). Por cuenta: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` se ignoran cuando hay componentes v2.
- Las vistas previas de URL simples se suprimen de forma predeterminada. Establezca `suppressEmbeds: false` en una acción de mensaje cuando deba expandirse un único enlace saliente.

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
2. Habilite Server Members Intent cuando se utilicen listas de permitidos de roles o usuarios.
3. Invite al bot con los ámbitos `bot` y `applications.commands`.
4. Conceda Connect, Speak, Send Messages y Read Message History en el canal de voz de destino.
5. Habilite los comandos nativos (`commands.native` o `channels.discord.commands.native`).
6. Configure `channels.discord.voice`.

Utilice `/vc join|leave|status` para controlar las sesiones. El comando utiliza el agente predeterminado de la cuenta y sigue las mismas reglas de listas de permitidos y políticas de grupo que los demás comandos de Discord.

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

- La voz de Discord es opcional para las configuraciones de solo texto; establezca `channels.discord.voice.enabled=true` (o conserve un bloque `channels.discord.voice` existente) para habilitar los comandos `/vc`, el entorno de ejecución de voz y la intención del Gateway `GuildVoiceStates`. `channels.discord.intents.voiceStates` puede anular explícitamente la suscripción a la intención; déjelo sin establecer para que siga la habilitación efectiva de la voz.
- `voice.mode` controla la ruta de conversación. El valor predeterminado es `agent-proxy`: un front-end de voz en tiempo real gestiona los tiempos de los turnos, las interrupciones y la reproducción, delega el trabajo sustancial al agente de OpenClaw enrutado mediante `openclaw_agent_consult` y trata el resultado como una solicitud escrita de Discord procedente de ese hablante. `stt-tts` conserva el flujo anterior de STT por lotes más TTS. `bidi` permite que el modelo en tiempo real converse directamente mientras expone `openclaw_agent_consult` para el cerebro de OpenClaw.
- `voice.agentSession` controla qué conversación de OpenClaw recibe los turnos de voz. Déjelo sin establecer para usar la sesión propia del canal de voz, o establezca `{ mode: "target", target: "channel:<text-channel-id>" }` para que el canal de voz actúe como extensión de micrófono y altavoz de la sesión de un canal de texto de Discord existente, como `#maintainers`.
- `voice.model` sustituye el cerebro del agente de OpenClaw para las respuestas de voz de Discord y las consultas en tiempo real. Déjelo sin establecer para heredar el modelo del agente enrutado. Es independiente de `voice.realtime.model`.
- `voice.followUsers` permite que el bot se una, se desplace y abandone la voz de Discord junto con usuarios seleccionados. Consulte [Seguir a usuarios en la voz](#follow-users-in-voice).
- `agent-proxy` enruta el habla mediante `discord-voice`, que conserva la autorización normal del propietario y de las herramientas para el hablante y la sesión de destino, pero oculta la herramienta `tts` del agente porque la voz de Discord controla la reproducción. De forma predeterminada, `agent-proxy` otorga a la consulta un acceso a herramientas completo y equivalente al del propietario para los hablantes propietarios (`voice.realtime.toolPolicy: "owner"`) y da una fuerte preferencia a consultar al agente de OpenClaw antes de ofrecer respuestas sustanciales (`voice.realtime.consultPolicy: "always"`). En ese modo `always` predeterminado, la capa en tiempo real no reproduce automáticamente frases de relleno antes de la respuesta de la consulta; captura y transcribe el habla y, a continuación, reproduce la respuesta de OpenClaw enrutada. Si varias respuestas de consulta forzada finalizan mientras Discord aún reproduce la primera, las respuestas posteriores de habla exacta se ponen en cola hasta que la reproducción quede inactiva, en lugar de sustituir el habla a mitad de una frase.
- En el modo `stt-tts`, STT utiliza `tools.media.audio`; `voice.model` no afecta a la transcripción.
- En los modos en tiempo real, `voice.realtime.provider`, `voice.realtime.model` y `voice.realtime.speakerVoice` configuran la sesión de audio en tiempo real. Para OpenAI Realtime 2.1 con el cerebro Codex, utilice `voice.realtime.model: "gpt-realtime-2.1"` y `voice.model: "openai/gpt-5.6-sol"`.
- De forma predeterminada, los modos de voz en tiempo real incluyen pequeños archivos de perfil `IDENTITY.md`, `USER.md` y `SOUL.md` en las instrucciones del proveedor en tiempo real, para que los turnos directos rápidos mantengan la misma identidad, contexto del usuario y personalidad que el agente de OpenClaw enrutado. Establezca `voice.realtime.bootstrapContextFiles` en un subconjunto para personalizarlo, o `[]` para deshabilitarlo. Solo se admiten esos archivos de perfil; `AGENTS.md` permanece en el contexto normal del agente. El contexto de perfil inyectado no sustituye a `openclaw_agent_consult` para el trabajo en el espacio de trabajo, los hechos actuales, las consultas de memoria ni las acciones respaldadas por herramientas.
- En el modo en tiempo real `agent-proxy` de OpenAI, el control por nombre de activación se adapta de forma predeterminada a la sala: una persona puede hablar con naturalidad sin un nombre de activación, mientras que dos o más personas deben comenzar o terminar un turno con uno. Los demás bots no cuentan como personas. Establezca `voice.realtime.requireWakeName: true` para exigir siempre un nombre de activación o `false` para no exigirlo nunca. Los nombres de activación configurados deben constar de una o dos palabras. Si `voice.realtime.wakeNames` no está establecido, OpenClaw utiliza el `name` del agente enrutado más `OpenClaw` y, como alternativa, el identificador del agente más `OpenClaw`. Un control activo por nombre de activación deshabilita la respuesta automática del proveedor en tiempo real, enruta los turnos aceptados mediante la ruta de consulta del agente de OpenClaw y ofrece una breve confirmación hablada cuando se reconoce un nombre de activación inicial en la transcripción parcial antes de que llegue la transcripción final. La política se adapta a las entradas y salidas en directo sin volver a conectar la voz.
- El proveedor en tiempo real de OpenAI acepta los nombres de eventos actuales de Realtime 2 y los alias heredados compatibles con Codex para los eventos de audio de salida y transcripción, por lo que las instantáneas compatibles del proveedor pueden variar sin que se pierda el audio del asistente.
- `voice.realtime.bargeIn` controla si los eventos de inicio de habla de Discord interrumpen la reproducción en tiempo real activa. Si no está establecido, sigue la configuración de interrupción por audio de entrada del proveedor en tiempo real.
- `voice.realtime.minBargeInAudioEndMs` controla la duración mínima de reproducción del asistente antes de que una interrupción por habla de OpenAI en tiempo real trunque el audio. Valor predeterminado: `250`. Establezca `0` para una interrupción inmediata en salas con poco eco, o auméntelo para configuraciones de altavoces con mucho eco.
- `voice.tts` sustituye a `tts` solo para la reproducción de voz `stt-tts`; los modos en tiempo real utilizan `voice.realtime.speakerVoice` en su lugar. Para usar una voz de OpenAI en la reproducción de Discord, establezca `voice.tts.provider: "openai"` y elija una voz de texto a voz en `voice.tts.providers.openai.speakerVoice`. `cedar` es una buena opción de sonido masculino en el modelo TTS actual de OpenAI.
- Las anulaciones `systemPrompt` de Discord por canal se aplican a los turnos de transcripción de voz de ese canal de voz.
- Cuando OpenClaw se une a un canal de voz, la sesión del agente enrutado recibe un evento silencioso del sistema con la lista actual de participantes. Las entradas y salidas posteriores de participantes actualizan esa sesión sin provocar una respuesta hablada no solicitada; los nombres visibles de Discord se tratan como etiquetas no fiables. Los turnos de voz autorizados también reciben una instantánea actualizada de la lista de participantes.
- Los turnos de transcripción de voz y los comandos `/vc` utilizan las entradas de Discord en `commands.ownerAllowFrom` para determinar el estado de propietario. Cuando no se configura ningún propietario de comandos de Discord, el `allowFrom` de la cuenta de Discord seleccionada (o el `dm.allowFrom` heredado) aún puede autorizar el acceso por voz sin otorgar el estado de propietario. La visibilidad de las herramientas del agente sigue la política de herramientas configurada para la sesión enrutada.
- Si `voice.autoJoin` contiene varias entradas para el mismo servidor, OpenClaw se une al último canal configurado para ese servidor.
- `voice.allowedChannels` es una lista de permitidos de residencia opcional. Déjelo sin establecer para permitir que `/vc join` entre en cualquier canal de voz de Discord autorizado. Cuando se establece, `/vc join`, la unión automática al inicio y los cambios del estado de voz del bot se restringen a las entradas `{ guildId, channelId }` indicadas. Establézcalo en una matriz vacía para denegar todas las uniones a la voz de Discord. Si Discord desplaza el bot fuera de la lista de permitidos, OpenClaw abandona ese canal y vuelve a unirse al destino de unión automática configurado cuando haya uno disponible.
- `voice.daveEncryption` y `voice.decryptionFailureTolerance` se transfieren a las opciones de unión de `@discordjs/voice`; los valores predeterminados del componente original son `daveEncryption=true` y `decryptionFailureTolerance=24`.
- OpenClaw utiliza el códec `libopus-wasm` incluido para la recepción de voz de Discord y la reproducción de PCM sin procesar en tiempo real. Incluye una compilación WebAssembly de libopus con versión fijada y no requiere complementos nativos de opus.
- `voice.connectTimeoutMs` controla la espera inicial de Ready de `@discordjs/voice` para `/vc join` y los intentos de unión automática. Valor predeterminado: `30000`.
- `voice.reconnectGraceMs` controla cuánto tiempo espera OpenClaw a que una sesión de voz desconectada comience a reconectarse antes de destruirla. Valor predeterminado: `15000`.
- En el modo `stt-tts`, la reproducción de voz no se detiene simplemente porque otro usuario comience a hablar. Para evitar bucles de retroalimentación, OpenClaw ignora las nuevas capturas de voz mientras se reproduce TTS; hable después de que termine la reproducción para iniciar el siguiente turno. Los modos en tiempo real envían los inicios de habla como señales de interrupción al proveedor en tiempo real.
- En los modos en tiempo real, el eco de los altavoces que entra en un micrófono abierto puede parecer una interrupción por habla e interrumpir la reproducción. En salas de Discord con mucho eco, establezca `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` para evitar que OpenAI interrumpa automáticamente por el audio de entrada. Añada `voice.realtime.bargeIn: true` si aun así desea que los eventos de inicio de habla de Discord interrumpan la reproducción activa. El puente en tiempo real de OpenAI ignora como probable eco o ruido los truncamientos de reproducción inferiores a `voice.realtime.minBargeInAudioEndMs` y los registra como omitidos en lugar de borrar la reproducción de Discord.
- `voice.captureSilenceGraceMs` controla cuánto tiempo espera OpenClaw después de que Discord indique que un hablante ha dejado de hablar antes de finalizar ese segmento de audio para STT. Valor predeterminado: `2000`; auméntelo si Discord divide las pausas normales en transcripciones parciales entrecortadas.
- Cuando ElevenLabs es el proveedor TTS seleccionado, la reproducción de voz de Discord utiliza TTS por streaming y comienza desde el flujo de respuesta del proveedor. Los proveedores que no admiten streaming recurren a la ruta del archivo temporal sintetizado.
- OpenClaw supervisa los fallos de descifrado de recepción y se recupera automáticamente abandonando el canal de voz y volviendo a unirse a él tras varios fallos en un intervalo breve.
- Si los registros de recepción muestran repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` después de actualizar, recopile un informe de dependencias y los registros. La línea `@discordjs/voice` incluida contiene la corrección de relleno del componente original procedente del PR #11449 de discord.js, que cerró el problema #11419 de discord.js.
- Los eventos de recepción `The operation was aborted` son normales cuando OpenClaw finaliza un segmento capturado del hablante; son diagnósticos detallados, no advertencias.
- Los registros detallados de voz de Discord incluyen una vista previa acotada de una sola línea de la transcripción STT para cada segmento de hablante aceptado, de modo que la depuración muestre tanto el lado del usuario como el de la respuesta del agente sin volcar texto de transcripción ilimitado.
- En el modo `agent-proxy`, el mecanismo alternativo de consulta forzada omite fragmentos de transcripción probablemente incompletos, como texto que termina en `...` o con un conector final como «y», además de cierres claramente no accionables como «vuelvo enseguida» o «adiós». Los registros muestran `forced agent consult skipped reason=...` cuando esto evita una respuesta obsoleta en cola.

### Seguir a usuarios en la voz

Utilice `voice.followUsers` cuando quiera que el bot de voz de Discord permanezca con uno o varios usuarios conocidos de Discord, en lugar de unirse a un canal fijo al inicio o esperar a `/vc join`.

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

- `followUsers` acepta ID de usuario de Discord sin procesar y valores `discord:<id>`. OpenClaw normaliza ambas formas antes de comparar los eventos de estado de voz.
- `followUsersEnabled` adopta de forma predeterminada el valor `true` cuando se configura `followUsers`. Establézcalo en `false` para conservar la lista guardada, pero detener el seguimiento automático por voz.
- `followUsers` controla únicamente la permanencia en el canal de voz. No concede acceso como hablante ni autoridad de propietario; configure `commands.ownerAllowFrom` y los usuarios y roles del servidor o canal por separado.
- Cuando un usuario seguido se une a un canal de voz permitido, OpenClaw se une a ese canal. Cuando el usuario se mueve, OpenClaw se mueve con él. Cuando el usuario seguido activo se desconecta, OpenClaw abandona el canal.
- Si hay varios usuarios seguidos en el mismo servidor y el usuario seguido activo abandona el canal, OpenClaw se mueve al canal de otro usuario seguido registrado antes de abandonar el servidor. Si varios usuarios seguidos se mueven a la vez, prevalece el evento de estado de voz observado más recientemente.
- `allowedChannels` sigue aplicándose. Se ignora a un usuario seguido que esté en un canal no permitido, y una sesión propiedad del seguimiento se mueve a otro usuario seguido o abandona el canal.
- OpenClaw concilia los eventos de estado de voz omitidos durante el inicio y en un intervalo acotado. La conciliación toma muestras de los servidores configurados y limita las consultas REST por ejecución, por lo que las listas `followUsers` muy grandes pueden tardar más de un intervalo en converger.
- Si Discord o un administrador mueve el bot mientras este sigue a un usuario, OpenClaw reconstruye la sesión de voz y conserva la propiedad del seguimiento cuando el destino está permitido. Si el bot se mueve fuera de `allowedChannels`, OpenClaw abandona el canal y vuelve a unirse al destino configurado cuando existe uno.
- La recuperación de recepción de DAVE puede abandonar el mismo canal y volver a unirse a él después de varios fallos de descifrado. Las sesiones propiedad del seguimiento conservan dicha propiedad durante esa ruta de recuperación, por lo que una desconexión posterior del usuario seguido aún hace que se abandone el canal.

Elija entre los modos de unión:

- Use `followUsers` para configuraciones personales o de operador en las que el bot deba estar automáticamente en el canal de voz cuando usted lo esté.
- Use `autoJoin` para bots de sala fija que deban estar presentes incluso cuando ningún usuario registrado esté en el canal de voz.
- Use `/vc join` para uniones puntuales o salas en las que la presencia automática en el canal de voz resultaría inesperada.

Códec de voz de Discord:

- Los registros de recepción de voz muestran `discord voice: opus decoder: libopus-wasm`.
- La reproducción en tiempo real codifica PCM estéreo sin procesar de 48 kHz a Opus con el mismo paquete `libopus-wasm` incluido antes de entregar los paquetes a `@discordjs/voice`.
- La reproducción de archivos y flujos de proveedores transcodifica a PCM estéreo sin procesar de 48 kHz con ffmpeg y, a continuación, usa `libopus-wasm` para el flujo de paquetes Opus enviado a Discord.

Pipeline de STT y TTS:

- La captura PCM de Discord se convierte en un archivo WAV temporal.
- `tools.media.audio` gestiona STT, por ejemplo, `openai/gpt-4o-mini-transcribe`.
- La transcripción se envía a través de la entrada y el enrutamiento de Discord mientras el LLM de respuesta se ejecuta con una política de salida de voz que oculta la herramienta `tts` del agente y solicita texto como resultado, porque la voz de Discord controla la reproducción TTS final.
- `voice.model`, cuando se establece, reemplaza únicamente el LLM de respuesta para este turno del canal de voz.
- `voice.tts` se combina sobre `tts`; los proveedores compatibles con streaming alimentan directamente el reproductor; de lo contrario, el archivo de audio resultante se reproduce en el canal al que se ha unido.

Ejemplo de sesión de canal de voz mediante proxy del agente predeterminado:

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

Sin un bloque `voice.agentSession`, cada canal de voz obtiene su propia sesión enrutada de OpenClaw. Por ejemplo, `/vc join channel:234567890123456789` se comunica con la sesión de ese canal de voz de Discord. El modelo en tiempo real es solo la interfaz de voz; las solicitudes sustanciales se transfieren al agente de OpenClaw configurado. Si el modelo en tiempo real produce una transcripción final sin llamar a la herramienta de consulta, OpenClaw fuerza la consulta como mecanismo alternativo para que el comportamiento predeterminado siga siendo equivalente a hablar con el agente.

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

En el modo `agent-proxy`, el bot se une al canal de voz configurado, pero los turnos del agente de OpenClaw usan la sesión enrutada y el agente habituales del canal de destino. La sesión de voz en tiempo real reproduce verbalmente el resultado devuelto en el canal de voz. El agente supervisor puede seguir usando las herramientas de mensajería normales según su política de herramientas, incluido el envío de un mensaje de Discord separado si esa es la acción adecuada.

Mientras una ejecución delegada de OpenClaw está activa, las nuevas transcripciones de voz de Discord se tratan como control en directo de la ejecución antes de iniciar otro turno del agente. Frases como «estado», «cancela eso», «usa la solución más pequeña» o «cuando termines, comprueba también las pruebas» se clasifican como entrada de estado, cancelación, orientación o seguimiento para la sesión activa. Los resultados de estado, cancelación, orientación aceptada y seguimiento se reproducen verbalmente en el canal de voz para que la persona que llama sepa si OpenClaw gestionó la solicitud.

Formas de destino útiles:

- `target: "channel:123456789012345678"` enruta mediante una sesión de canal de texto de Discord.
- `target: "123456789012345678"` se trata como destino de canal.
- `target: "dm:123456789012345678"` o `target: "user:123456789012345678"` enruta mediante esa sesión de mensaje directo.

Ejemplo de OpenAI Realtime en entornos con mucho eco:

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

Use esta opción cuando el modelo oiga su propia reproducción de Discord a través de un micrófono abierto, pero aun así se quiera poder interrumpirlo hablando. OpenClaw impide que OpenAI se interrumpa automáticamente al recibir audio de entrada sin procesar, mientras que `bargeIn: true` permite que los eventos de inicio de hablante de Discord y el audio de un hablante ya activo cancelen las respuestas en tiempo real activas antes de que el siguiente turno capturado llegue a OpenAI. Las señales de interrupción muy tempranas con `audioEndMs` por debajo de `minBargeInAudioEndMs` se tratan como eco o ruido probable y se ignoran para que el modelo no se corte en el primer fotograma de reproducción.

Registros de voz esperados:

- Al unirse: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Al iniciar el modo en tiempo real: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Al recibir audio del hablante: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` y `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Al omitir voz obsoleta: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` o `reason=non-actionable-closing ...`
- Al completarse la respuesta en tiempo real: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Al detener o restablecer la reproducción: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Al realizar una consulta en tiempo real: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Al recibir la respuesta del agente: `discord voice: agent turn answer ...`
- Al poner en cola voz exacta: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, seguido de `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Al detectar una interrupción del hablante: `discord voice: realtime barge-in detected source=speaker-start ...` o `discord voice: realtime barge-in detected source=active-speaker-audio ...`, seguido de `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Al interrumpir el modo en tiempo real: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, seguido de `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` o `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Al ignorar eco o ruido: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Al desactivar la interrupción del hablante: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Durante la reproducción inactiva: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Para depurar el audio cortado, lea los registros de voz en tiempo real como una cronología:

1. `realtime audio playback started` significa que Discord ha empezado a reproducir el audio del asistente. A partir de este punto, el puente comienza a contar los fragmentos de salida del asistente, los bytes PCM de Discord, los bytes en tiempo real del proveedor y la duración del audio sintetizado.
2. `realtime speaker turn opened` marca la activación de un hablante de Discord. Si la reproducción ya está activa y `bargeIn` está habilitado, puede ir seguido de `barge-in detected source=speaker-start`.
3. `realtime input audio started` marca el primer fotograma de audio real recibido para ese turno del hablante. `outputActive=true` o un valor distinto de cero de `outputAudioMs` en este punto significa que el micrófono está enviando entrada mientras la reproducción del asistente sigue activa.
4. `barge-in detected source=active-speaker-audio` significa que OpenClaw detectó audio en directo del hablante mientras la reproducción del asistente estaba activa. Esto resulta útil para distinguir una interrupción real de un evento de inicio de hablante de Discord sin audio útil.
5. `barge-in requested reason=...` significa que OpenClaw pidió al proveedor en tiempo real que cancelara o truncara la respuesta activa. Incluye `outputAudioMs`, `outputActive` y `playbackChunks` para mostrar cuánto audio del asistente se había reproducido realmente antes de la interrupción.
6. `realtime audio playback stopped reason=...` es el punto de restablecimiento de la reproducción local de Discord. El motivo indica quién detuvo la reproducción: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` o `session-close`.
7. `realtime speaker turn closed` resume el turno de entrada capturado. `chunks=0` o `hasAudio=false` significa que el turno del hablante se abrió, pero ningún audio utilizable llegó al puente en tiempo real. `interruptedPlayback=true` significa que ese turno de entrada se solapó con la salida del asistente y activó la lógica de interrupción del hablante.

Campos útiles:

- `outputAudioMs`: duración del audio del asistente generado por el proveedor en tiempo real antes de la línea de registro.
- `audioMs`: duración del audio del asistente contabilizada por OpenClaw antes de que se detuviera la reproducción.
- `elapsedMs`: tiempo de reloj transcurrido entre la apertura y el cierre del flujo de reproducción o del turno del hablante.
- `discordBytes`: bytes PCM estéreo de 48 kHz enviados a la voz de Discord o recibidos de ella.
- `realtimeBytes`: bytes PCM con el formato del proveedor enviados al proveedor en tiempo real o recibidos de él.
- `playbackChunks`: fragmentos de audio del asistente reenviados a Discord para la respuesta activa.
- `sinceLastAudioMs`: intervalo entre el último fotograma de audio capturado del hablante y el cierre del turno del hablante.

Patrones comunes:

- La interrupción inmediata con `source=active-speaker-audio`, un valor pequeño de `outputAudioMs` y el mismo usuario cerca suele indicar que el eco del altavoz está entrando en el micrófono. Aumente `voice.realtime.minBargeInAudioEndMs`, reduzca el volumen del altavoz, use auriculares o configure `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` seguido de `speaker turn closed ... hasAudio=false` significa que Discord informó del inicio de un hablante, pero ningún audio llegó a OpenClaw. Puede tratarse de un evento de voz transitorio de Discord, del comportamiento de la puerta de ruido o de que un cliente activara brevemente el micrófono.
- `audio playback stopped reason=stream-close` sin una interrupción cercana o `provider-clear-audio` significa que el flujo local de reproducción de Discord terminó inesperadamente. Compruebe los registros anteriores del proveedor y del reproductor de Discord.
- `capture ignored during playback (barge-in disabled)` significa que OpenClaw descartó intencionadamente la entrada mientras el audio del asistente estaba activo. Habilite `voice.realtime.bargeIn` si desea que la voz interrumpa la reproducción.
- `barge-in ignored ... outputActive=false` significa que Discord o el VAD del proveedor detectaron voz, pero OpenClaw no tenía ninguna reproducción activa que interrumpir. Esto no debería interrumpir el audio.

Las credenciales se resuelven por componente: autenticación de la ruta del LLM para `voice.model`, autenticación de STT para `tools.media.audio`, autenticación de TTS para `tts`/`voice.tts` y autenticación del proveedor en tiempo real para `voice.realtime.providers` o la configuración de autenticación normal del proveedor.

### Mensajes de voz

Los mensajes de voz de Discord muestran una vista previa de la forma de onda y requieren audio OGG/Opus. OpenClaw genera automáticamente la forma de onda, pero necesita `ffmpeg` y `ffprobe` en el host del Gateway para inspeccionar y convertir el audio.

- Proporcione una **ruta de archivo local** (se rechazan las URL).
- Omita el contenido de texto (Discord rechaza texto + mensaje de voz en la misma carga útil).
- Se acepta cualquier formato de audio; OpenClaw lo convierte a OGG/Opus según sea necesario.

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

  <Accordion title="Mensajes del servidor bloqueados inesperadamente">

    - verifique `groupPolicy`
    - verifique la lista de permitidos del servidor en `channels.discord.guilds`
    - si existe un mapa `channels` del servidor, solo se permiten los canales incluidos
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

    - `groupPolicy="allowlist"` sin una lista de permitidos coincidente para el servidor/canal
    - `requireMention` configurado en el lugar incorrecto (debe estar en `channels.discord.guilds` o en una entrada de canal)
    - remitente bloqueado por la lista de permitidos `users` del servidor/canal

  </Accordion>

  <Accordion title="Turnos de Discord de larga duración o respuestas duplicadas">

    Registros habituales:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord no aplica un tiempo de espera propio del canal a los turnos del agente en cola. Los escuchadores de mensajes transfieren el control inmediatamente y las ejecuciones de Discord en cola conservan el orden por sesión hasta que finaliza el ciclo de vida de la sesión, la herramienta o el entorno de ejecución, o hasta que este aborta el trabajo.

  </Accordion>

  <Accordion title="Advertencias de tiempo de espera al consultar los metadatos del Gateway">
    OpenClaw obtiene los metadatos `/gateway/bot` de Discord antes de conectarse. Ante fallos transitorios, utiliza como alternativa la URL predeterminada del Gateway de Discord y limita la frecuencia de los registros.

    El tiempo de espera de los metadatos es de 30 segundos de forma predeterminada. `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS` puede modificarlo para entornos de host inusuales.

  </Accordion>

  <Accordion title="Reinicios por tiempo de espera de READY del Gateway">
    OpenClaw espera el evento `READY` del Gateway de Discord durante el inicio y después de las reconexiones del entorno de ejecución. Las configuraciones con varias cuentas e inicios escalonados pueden necesitar un intervalo de espera de READY durante el inicio mayor que el predeterminado.

    El inicio espera 15 segundos y las reconexiones del entorno de ejecución esperan 30 segundos. `OPENCLAW_DISCORD_READY_TIMEOUT_MS` y `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS` siguen disponibles para entornos de host inusuales.

  </Accordion>

  <Accordion title="Discrepancias en la auditoría de permisos">
    Las comprobaciones de permisos de `channels status --probe` solo funcionan con identificadores numéricos de canal.

    Si se usan claves de slug, la coincidencia durante la ejecución puede seguir funcionando, pero la comprobación no puede verificar por completo los permisos.

  </Accordion>

  <Accordion title="Problemas con mensajes directos y emparejamiento">

    - mensajes directos deshabilitados: `channels.discord.dm.enabled=false`
    - política de mensajes directos deshabilitada: `channels.discord.dmPolicy="disabled"` (heredado: `channels.discord.dm.policy`)
    - esperando la aprobación del emparejamiento en el modo `pairing`

  </Accordion>

  <Accordion title="Bucles entre bots">
    De forma predeterminada, se ignoran los mensajes creados por bots.

    Si configura `channels.discord.allowBots=true`, use reglas estrictas de mención y listas de permitidos para evitar bucles.
    Es preferible usar `channels.discord.allowBots="mentions"` para aceptar únicamente mensajes de bots que mencionen al bot.

    OpenClaw también incluye [protección contra bucles de bots](/es/channels/bot-loop-protection) compartida. Siempre que `allowBots` permita que los mensajes creados por bots lleguen al envío, Discord asigna el evento entrante a datos de `(account, channel, bot pair)` y la protección genérica de pares suprime el par después de superar el presupuesto de eventos configurado. La protección evita bucles descontrolados entre dos bots que anteriormente debían detenerse mediante los límites de frecuencia de Discord; no afecta a las implementaciones de un solo bot ni a las respuestas puntuales de bots que se mantienen por debajo del presupuesto.

    Configuración predeterminada (activa cuando se establece `allowBots`):

    - `maxEventsPerWindow: 20` -- el par de bots puede intercambiar 20 mensajes dentro de la ventana deslizante
    - `windowSeconds: 60` -- duración de la ventana deslizante
    - `cooldownSeconds: 60` -- una vez superado el presupuesto, se descartan durante un minuto todos los mensajes adicionales entre los bots en cualquier dirección

    Configure una sola vez el valor predeterminado compartido en `channels.defaults.botLoopProtection` y, a continuación, sobrescriba la configuración de Discord cuando un flujo de trabajo legítimo necesite más margen. El orden de precedencia es:

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
      // Sobrescritura opcional para todo Discord. Los bloques de cuenta sobrescriben campos
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

  <Accordion title="STT de voz descarta audio con DecryptionFailed(...)">

    - mantenga OpenClaw actualizado (`openclaw update`) para disponer de la lógica de recuperación de recepción de voz de Discord
    - confirme `channels.discord.voice.daveEncryption=true` (valor predeterminado)
    - empiece con `channels.discord.voice.decryptionFailureTolerance=24` (valor predeterminado del proyecto original) y ajústelo solo si es necesario
    - revise los registros para detectar:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si los fallos continúan después de la reincorporación automática, recopile los registros y compárelos con el historial original de recepción de DAVE en [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) y [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referencia de configuración

Referencia principal: [Referencia de configuración: Discord](/es/gateway/config-channels#discord).

<Accordion title="Campos de Discord con información clave">

- inicio/autenticación: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- Gateway: `proxy`
- respuesta/historial: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit` (valor predeterminado: `2000`), `maxLinesPerMessage` (valor predeterminado: `17`)
- transmisión: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (las claves planas heredadas `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce` y `chunkMode` se migran a `streaming.*` mediante `openclaw doctor --fix`)
- contenido multimedia: `mediaMaxMb` (limita las cargas salientes de Discord; valor predeterminado: `100`)
- acciones: `actions.*`
- presencia: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- interfaz de usuario: `ui.components.accentColor`
- funciones: `threadBindings`, `bindings[]` de nivel superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `activities`, `heartbeat`, `responsePrefix`

</Accordion>

### Actividades de Discord

Configure `channels.discord.activities` para permitir que los agentes publiquen widgets HTML autónomos que se abran dentro de Discord. El bloque es opcional; cuando no está presente, OpenClaw no registra rutas de actividad, herramientas ni controladores de interacción. Consulte [Actividades de Discord](/es/channels/discord-activities) para conocer la configuración del Developer Portal, el túnel, la seguridad y la solución de problemas.

- `activities.clientSecret`: secreto de cliente OAuth2 para la aplicación de Discord; recurre a `DISCORD_CLIENT_SECRET` si no está disponible
- `activities.applicationId`: identificador opcional de la aplicación de actividad; de forma predeterminada, usa el identificador de la aplicación del bot obtenido al iniciar el Gateway

## Seguridad y operaciones

- Trate los tokens de bot como secretos (se recomienda `DISCORD_BOT_TOKEN` en entornos supervisados).
- Conceda los permisos mínimos necesarios en Discord.
- Si la implementación o el estado de los comandos están obsoletos, reinicie el Gateway y vuelva a comprobarlos con `openclaw channels status --probe`.

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
    Modelo de amenazas y refuerzo de seguridad.
  </Card>
  <Card title="Enrutamiento multiagente" icon="sitemap" href="/es/concepts/multi-agent">
    Asigne servidores y canales a agentes.
  </Card>
  <Card title="Comandos de barra diagonal" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de los comandos nativos.
  </Card>
</CardGroup>
