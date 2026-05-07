---
read_when:
    - Trabajando en funcionalidades del canal de Discord
summary: Estado de soporte, capacidades y configuración del bot de Discord
title: Discord
x-i18n:
    generated_at: "2026-05-07T01:50:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0422fe8a25a7c40d49c4a8c6ec5683c729c09b79d5d03daefc0fcf032f6d75c2
    source_path: channels/discord.md
    workflow: 16
---

Listo para mensajes directos y canales de servidor mediante el Gateway oficial de Discord.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de Discord usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento nativo de comandos y catálogo de comandos.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico multicanal y flujo de reparación.
  </Card>
</CardGroup>

## Configuración rápida

Tendrás que crear una nueva aplicación con un bot, agregar el bot a tu servidor y emparejarlo con OpenClaw. Recomendamos agregar tu bot a tu propio servidor privado. Si todavía no tienes uno, [crea uno primero](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (elige **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crear una aplicación y un bot de Discord">
    Ve al [Portal de desarrolladores de Discord](https://discord.com/developers/applications) y haz clic en **New Application**. Ponle un nombre como "OpenClaw".

    Haz clic en **Bot** en la barra lateral. Configura el **Username** con el nombre que uses para tu agente de OpenClaw.

  </Step>

  <Step title="Habilitar intents privilegiados">
    Todavía en la página **Bot**, desplázate hacia abajo hasta **Privileged Gateway Intents** y habilita:

    - **Message Content Intent** (obligatorio)
    - **Server Members Intent** (recomendado; obligatorio para listas de permitidos de roles y coincidencia de nombre a ID)
    - **Presence Intent** (opcional; solo necesario para actualizaciones de presencia)

  </Step>

  <Step title="Copiar el token de tu bot">
    Desplázate de nuevo hacia arriba en la página **Bot** y haz clic en **Reset Token**.

    <Note>
    A pesar del nombre, esto genera tu primer token; no se está "restableciendo" nada.
    </Note>

    Copia el token y guárdalo en algún lugar. Este es tu **Bot Token** y lo necesitarás en breve.

  </Step>

  <Step title="Generar una URL de invitación y agregar el bot a tu servidor">
    Haz clic en **OAuth2** en la barra lateral. Generarás una URL de invitación con los permisos adecuados para agregar el bot a tu servidor.

    Desplázate hacia abajo hasta **OAuth2 URL Generator** y habilita:

    - `bot`
    - `applications.commands`

    Aparecerá una sección **Bot Permissions** debajo. Habilita al menos:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcional)

    Este es el conjunto base para canales de texto normales. Si planeas publicar en hilos de Discord, incluidos flujos de trabajo de foros o canales multimedia que crean o continúan un hilo, habilita también **Send Messages in Threads**.
    Copia la URL generada en la parte inferior, pégala en tu navegador, selecciona tu servidor y haz clic en **Continue** para conectar. Ahora deberías ver tu bot en el servidor de Discord.

  </Step>

  <Step title="Habilitar el modo de desarrollador y recopilar tus IDs">
    De vuelta en la aplicación de Discord, necesitas habilitar el modo de desarrollador para poder copiar IDs internos.

    1. Haz clic en **User Settings** (icono de engranaje junto a tu avatar) → **Advanced** → activa **Developer Mode**
    2. Haz clic derecho en el **icono de tu servidor** en la barra lateral → **Copy Server ID**
    3. Haz clic derecho en tu **propio avatar** → **Copy User ID**

    Guarda tu **Server ID** y **User ID** junto con tu Bot Token; enviarás los tres a OpenClaw en el siguiente paso.

  </Step>

  <Step title="Permitir mensajes directos de miembros del servidor">
    Para que el emparejamiento funcione, Discord debe permitir que tu bot te envíe mensajes directos. Haz clic derecho en el **icono de tu servidor** → **Privacy Settings** → activa **Direct Messages**.

    Esto permite que los miembros del servidor (incluidos los bots) te envíen mensajes directos. Mantén esto habilitado si quieres usar mensajes directos de Discord con OpenClaw. Si solo planeas usar canales de servidor, puedes deshabilitar los mensajes directos después del emparejamiento.

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

    Si OpenClaw ya se está ejecutando como servicio en segundo plano, reinícialo mediante la aplicación de OpenClaw para Mac o deteniendo y reiniciando el proceso `openclaw gateway run`.
    Para instalaciones como servicio gestionado, ejecuta `openclaw gateway install` desde una shell donde `DISCORD_BOT_TOKEN` esté presente, o guarda la variable en `~/.openclaw/.env`, para que el servicio pueda resolver el SecretRef de entorno después del reinicio.
    Si tu host está bloqueado o limitado por frecuencia por la búsqueda de aplicación de inicio de Discord, configura el ID de aplicación/cliente de Discord desde el Portal de desarrolladores para que el inicio pueda omitir esa llamada REST. Usa `channels.discord.applicationId` para la cuenta predeterminada, o `channels.discord.accounts.<accountId>.applicationId` cuando ejecutes varios bots de Discord.

  </Step>

  <Step title="Configurar OpenClaw y emparejar">

    <Tabs>
      <Tab title="Pregúntale a tu agente">
        Chatea con tu agente de OpenClaw en cualquier canal existente (por ejemplo, Telegram) y díselo. Si Discord es tu primer canal, usa la pestaña de CLI / configuración en su lugar.

        > "Ya configuré mi token de bot de Discord en la configuración. Termina la configuración de Discord con User ID `<user_id>` y Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / configuración">
        Si prefieres una configuración basada en archivos, configura:

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

        Para una configuración remota o con scripts, escribe el mismo bloque JSON5 con `openclaw config patch --file ./discord.patch.json5 --dry-run` y luego vuelve a ejecutarlo sin `--dry-run`. Se admiten valores `token` en texto sin formato. También se admiten valores SecretRef para `channels.discord.token` en proveedores env/file/exec. Consulta [Gestión de secretos](/es/gateway/secrets).

        Para varios bots de Discord, mantén cada token de bot e ID de aplicación dentro de su cuenta. Un `channels.discord.applicationId` de nivel superior se hereda en las cuentas, así que configúralo ahí solo cuando todas las cuentas deban usar el mismo ID de aplicación.

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
    Espera hasta que el Gateway se esté ejecutando y luego envía un mensaje directo a tu bot en Discord. Responderá con un código de emparejamiento.

    <Tabs>
      <Tab title="Pregúntale a tu agente">
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

    Ahora deberías poder chatear con tu agente en Discord mediante mensaje directo.

  </Step>
</Steps>

<Note>
La resolución de tokens tiene en cuenta la cuenta. Los valores de token de la configuración prevalecen sobre el respaldo de entorno. `DISCORD_BOT_TOKEN` solo se usa para la cuenta predeterminada.
Si dos cuentas de Discord habilitadas se resuelven al mismo token de bot, OpenClaw inicia solo un monitor de Gateway para ese token. Un token procedente de la configuración prevalece sobre el respaldo de entorno predeterminado; de lo contrario, la primera cuenta habilitada prevalece y la cuenta duplicada se informa como deshabilitada.
Para llamadas salientes avanzadas (acciones de herramienta/canal de mensajes), se usa un `token` explícito por llamada para esa llamada. Esto se aplica a acciones de envío y de estilo lectura/sondeo (por ejemplo read/search/fetch/thread/pins/permissions). La configuración de política/reintento de cuenta sigue viniendo de la cuenta seleccionada en la instantánea activa del runtime.
</Note>

## Recomendado: Configurar un espacio de trabajo de servidor

Cuando los mensajes directos funcionen, puedes configurar tu servidor de Discord como un espacio de trabajo completo donde cada canal tenga su propia sesión de agente con su propio contexto. Esto se recomienda para servidores privados donde solo estén tú y tu bot.

<Steps>
  <Step title="Agregar tu servidor a la lista de permitidos de servidor">
    Esto permite que tu agente responda en cualquier canal de tu servidor, no solo en mensajes directos.

    <Tabs>
      <Tab title="Pregúntale a tu agente">
        > "Agrega mi Discord Server ID `<server_id>` a la lista de permitidos de servidor"
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
    De forma predeterminada, tu agente solo responde en canales de servidor cuando se le @menciona. Para un servidor privado, probablemente quieras que responda a todos los mensajes.

    En canales de servidor, las respuestas finales normales del asistente permanecen privadas de forma predeterminada. La salida visible de Discord debe enviarse explícitamente con la herramienta `message`, para que el agente pueda permanecer a la espera de forma predeterminada y solo publicar cuando decida que una respuesta en el canal es útil.

    Esto significa que el modelo seleccionado debe llamar herramientas de forma fiable. Si Discord muestra que está escribiendo y los registros muestran uso de tokens, pero no se publica ningún mensaje, revisa el registro de sesión para buscar texto del asistente con `didSendViaMessagingTool: false`. Eso significa que el modelo produjo una respuesta final privada en lugar de llamar a `message(action=send)`. Cambia a un modelo más fuerte para llamadas a herramientas, o usa la configuración siguiente para restaurar las respuestas finales automáticas heredadas.

    <Tabs>
      <Tab title="Pregúntale a tu agente">
        > "Permite que mi agente responda en este servidor sin tener que ser @mencionado"
      </Tab>
      <Tab title="Configuración">
        Configura `requireMention: false` en tu configuración de servidor:

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

        Para restaurar las respuestas finales automáticas heredadas para salas de grupo/canal, configura `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planificar la memoria en canales de servidor">
    De forma predeterminada, la memoria a largo plazo (MEMORY.md) solo se carga en sesiones de mensajes directos. Los canales de servidor no cargan MEMORY.md automáticamente.

    <Tabs>
      <Tab title="Pregúntale a tu agente">
        > "Cuando haga preguntas en canales de Discord, usa memory_search o memory_get si necesitas contexto a largo plazo de MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Si necesitas contexto compartido en todos los canales, coloca las instrucciones estables en `AGENTS.md` o `USER.md` (se inyectan en cada sesión). Mantén las notas a largo plazo en `MEMORY.md` y accede a ellas bajo demanda con herramientas de memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ahora crea algunos canales en tu servidor de Discord y empieza a chatear. Tu agente puede ver el nombre del canal, y cada canal obtiene su propia sesión aislada, así que puedes configurar `#coding`, `#home`, `#research` o lo que se ajuste a tu flujo de trabajo.

## Modelo de runtime

- Gateway es propietario de la conexión de Discord.
- El enrutamiento de respuestas es determinista: las respuestas entrantes de Discord vuelven a Discord.
- Los metadatos de servidor/canal de Discord se añaden al prompt del modelo como contexto no confiable, no como prefijo de respuesta visible para el usuario. Si un modelo copia ese contenedor de vuelta, OpenClaw elimina los metadatos copiados de las respuestas salientes y del contexto de reproducción futuro.
- De forma predeterminada (`session.dmScope=main`), los chats directos comparten la sesión principal del agente (`agent:main:main`).
- Los canales de servidor son claves de sesión aisladas (`agent:<agentId>:discord:channel:<channelId>`).
- Los MD de grupo se ignoran de forma predeterminada (`channels.discord.dm.groupEnabled=false`).
- Los comandos slash nativos se ejecutan en sesiones de comando aisladas (`agent:<agentId>:discord:slash:<userId>`), mientras siguen llevando `CommandTargetSessionKey` a la sesión de conversación enrutada.
- La entrega de anuncios de cron/heartbeat de solo texto a Discord usa una vez la respuesta final visible para el asistente. Los payloads de medios y componentes estructurados siguen siendo multimensaje cuando el agente emite varios payloads entregables.

## Canales de foro

Los canales de foro y medios de Discord solo aceptan publicaciones en hilos. OpenClaw admite dos formas de crearlos:

- Envía un mensaje al padre del foro (`channel:<forumId>`) para crear automáticamente un hilo. El título del hilo usa la primera línea no vacía de tu mensaje.
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

OpenClaw admite contenedores de componentes v2 de Discord para mensajes de agente. Usa la herramienta de mensajes con un payload `components`. Los resultados de interacción se enrutan de vuelta al agente como mensajes entrantes normales y siguen la configuración existente de Discord `replyToMode`.

Bloques admitidos:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Las filas de acciones permiten hasta 5 botones o un único menú de selección
- Tipos de selección: `string`, `user`, `role`, `mentionable`, `channel`

De forma predeterminada, los componentes son de un solo uso. Establece `components.reusable=true` para permitir que botones, selectores y formularios se usen varias veces hasta que caduquen.

Para restringir quién puede hacer clic en un botón, establece `allowedUsers` en ese botón (IDs de usuario de Discord, etiquetas o `*`). Cuando se configura, los usuarios no coincidentes reciben una denegación efímera.

Los comandos slash `/model` y `/models` abren un selector interactivo de modelos con desplegables de proveedor, modelo y runtime compatible, además de un paso de envío. `/models add` está obsoleto y ahora devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat. La respuesta del selector es efímera y solo puede usarla el usuario que la invocó.

Adjuntos de archivo:

- Los bloques `file` deben apuntar a una referencia de adjunto (`attachment://<filename>`)
- Proporciona el adjunto mediante `media`/`path`/`filePath` (archivo único); usa `media-gallery` para varios archivos
- Usa `filename` para sobrescribir el nombre de carga cuando deba coincidir con la referencia de adjunto

Formularios modales:

- Añade `components.modal` con hasta 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw añade automáticamente un botón activador

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
    `channels.discord.dmPolicy` controla el acceso por MD. `channels.discord.allowFrom` es la lista de permitidos canónica para MD.

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.discord.allowFrom` incluya `"*"`)
    - `disabled`

    Si la política de MD no está abierta, los usuarios desconocidos se bloquean (o se les solicita emparejamiento en modo `pairing`).

    Precedencia multicuenta:

    - `channels.discord.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Para una cuenta, `allowFrom` tiene precedencia sobre el `dm.allowFrom` heredado.
    - Las cuentas con nombre heredan `channels.discord.allowFrom` cuando sus propios `allowFrom` y `dm.allowFrom` heredado no están configurados.
    - Las cuentas con nombre no heredan `channels.discord.accounts.default.allowFrom`.

    Los `channels.discord.dm.policy` y `channels.discord.dm.allowFrom` heredados aún se leen por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    Formato de destino de MD para entrega:

    - `user:<id>`
    - mención `<@id>`

    Los IDs numéricos sin formato normalmente se resuelven como IDs de canal cuando hay un canal predeterminado activo, pero los IDs listados en el `allowFrom` de MD efectivo de la cuenta se tratan como destinos de MD de usuario por compatibilidad.

  </Tab>

  <Tab title="DM access groups">
    Los MD de Discord pueden usar entradas dinámicas `accessGroup:<name>` en `channels.discord.allowFrom`.

    Los nombres de grupos de acceso se comparten entre canales de mensajes. Usa `type: "message.senders"` para un grupo estático cuyos miembros se expresan con la sintaxis normal de `allowFrom` de cada canal, o `type: "discord.channelAudience"` cuando la audiencia actual de `ViewChannel` de un canal de Discord deba definir la pertenencia dinámicamente. El comportamiento compartido de grupos de acceso está documentado aquí: [Grupos de acceso](/es/channels/access-groups).

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

    Un canal de texto de Discord no tiene una lista de miembros separada. `type: "discord.channelAudience"` modela la pertenencia así: el remitente del MD es miembro del servidor configurado y actualmente tiene permiso efectivo `ViewChannel` en el canal configurado después de aplicar sobrescrituras de rol y canal.

    Ejemplo: permitir que cualquier persona que pueda ver `#maintainers` envíe MD al bot, manteniendo cerrados los MD para todos los demás.

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

    Las consultas fallan cerradas. Si Discord devuelve `Missing Access`, falla la consulta del miembro, o el canal pertenece a otro servidor, el remitente del MD se trata como no autorizado.

    Activa **Server Members Intent** en el Portal para desarrolladores de Discord para el bot cuando uses grupos de acceso de audiencia de canal. Los MD no incluyen estado de miembro del servidor, por lo que OpenClaw resuelve el miembro mediante Discord REST en el momento de la autorización.

  </Tab>

  <Tab title="Guild policy">
    El manejo de servidores se controla mediante `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La base segura cuando existe `channels.discord` es `allowlist`.

    Comportamiento de `allowlist`:

    - el servidor debe coincidir con `channels.discord.guilds` (`id` preferido, slug aceptado)
    - listas opcionales de remitentes permitidos: `users` (se recomiendan IDs estables) y `roles` (solo IDs de rol); si cualquiera está configurada, se permite a los remitentes cuando coinciden con `users` O `roles`
    - la coincidencia directa por nombre/etiqueta está desactivada de forma predeterminada; activa `channels.discord.dangerouslyAllowNameMatching: true` solo como modo de compatibilidad de emergencia
    - se admiten nombres/etiquetas para `users`, pero los IDs son más seguros; `openclaw security audit` advierte cuando se usan entradas de nombre/etiqueta
    - si un servidor tiene `channels` configurado, los canales no listados se deniegan
    - si un servidor no tiene bloque `channels`, se permiten todos los canales de ese servidor en la lista de permitidos

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

    Si solo estableces `DISCORD_BOT_TOKEN` y no creas un bloque `channels.discord`, el fallback de runtime es `groupPolicy="allowlist"` (con una advertencia en los registros), incluso si `channels.defaults.groupPolicy` es `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Los mensajes de servidor requieren mención de forma predeterminada.

    La detección de menciones incluye:

    - mención explícita al bot
    - patrones de mención configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de respuesta al bot en casos admitidos

    Al escribir mensajes salientes de Discord, usa la sintaxis canónica de menciones: `<@USER_ID>` para usuarios, `<#CHANNEL_ID>` para canales y `<@&ROLE_ID>` para roles. No uses la forma heredada de mención por apodo `<@!USER_ID>`.

    `requireMention` se configura por servidor/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcionalmente descarta mensajes que mencionan a otro usuario/rol pero no al bot (excluyendo @everyone/@here).

    MD de grupo:

    - predeterminado: ignorado (`dm.groupEnabled=false`)
    - lista de permitidos opcional mediante `dm.groupChannels` (IDs o slugs de canal)

  </Tab>
</Tabs>

### Enrutamiento de agentes basado en roles

Usa `bindings[].match.roles` para enrutar miembros de servidores de Discord a distintos agentes por ID de rol. Los bindings basados en roles solo aceptan IDs de rol y se evalúan después de bindings de par o par padre, y antes de bindings solo de servidor. Si un binding también establece otros campos de coincidencia (por ejemplo `peer` + `guildId` + `roles`), todos los campos configurados deben coincidir.

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

- `commands.native` toma `"auto"` como valor predeterminado y está habilitado para Discord.
- Anulación por canal: `channels.discord.commands.native`.
- `commands.native=false` omite el registro y la limpieza de comandos de barra de Discord durante el inicio. Los comandos registrados anteriormente pueden seguir visibles en Discord hasta que los elimines de la aplicación de Discord.
- La autenticación de comandos nativos usa las mismas listas de permitidos/políticas de Discord que el manejo normal de mensajes.
- Es posible que los comandos sigan visibles en la interfaz de Discord para usuarios no autorizados; la ejecución sigue aplicando la autenticación de OpenClaw y devuelve "not authorized".

Consulta [Comandos de barra](/es/tools/slash-commands) para ver el catálogo y el comportamiento de los comandos.

Configuración predeterminada de comandos de barra:

- `ephemeral: true`

## Detalles de la función

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

    Nota: `off` deshabilita el encadenamiento implícito de respuestas. Las etiquetas explícitas `[[reply_to_*]]` se siguen respetando.
    `first` siempre adjunta la referencia implícita de respuesta nativa al primer mensaje saliente de Discord del turno.
    `batched` solo adjunta la referencia implícita de respuesta nativa de Discord cuando el
    turno entrante fue un lote con rebote de varios mensajes. Esto es útil
    cuando quieres respuestas nativas principalmente para chats ambiguos en ráfaga, no para cada
    turno de un solo mensaje.

    Los ID de mensajes se exponen en el contexto/historial para que los agentes puedan dirigirse a mensajes específicos.

  </Accordion>

  <Accordion title="Vista previa de transmisión en vivo">
    OpenClaw puede transmitir borradores de respuestas enviando un mensaje temporal y editándolo a medida que llega el texto. `channels.discord.streaming` acepta `off` | `partial` | `block` | `progress` (predeterminado). `progress` mantiene un borrador de estado editable y lo actualiza con el progreso de herramientas hasta la entrega final; `streamMode` es un alias heredado en tiempo de ejecución. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida a la clave canónica.

    Establece `channels.discord.streaming.mode` en `off` para deshabilitar las ediciones de vista previa de Discord. Si la transmisión por bloques de Discord está habilitada explícitamente, OpenClaw omite la transmisión de vista previa para evitar transmitir dos veces.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
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
    - `streaming.preview.commandText` / `streaming.progress.commandText` controla el detalle de comandos/ejecución en líneas de progreso compactas: `raw` (predeterminado) o `status` (solo etiqueta de herramienta).

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

    La transmisión de vista previa solo admite texto; las respuestas con medios recurren a la entrega normal. Cuando la transmisión `block` está habilitada explícitamente, OpenClaw omite la transmisión de vista previa para evitar transmitir dos veces.

  </Accordion>

  <Accordion title="Historial, contexto y comportamiento de hilos">
    Contexto de historial de servidor:

    - `channels.discord.historyLimit` predeterminado `20`
    - alternativa: `messages.groupChat.historyLimit`
    - `0` deshabilita

    Controles de historial de mensajes directos:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamiento de hilos:

    - Los hilos de Discord se enrutan como sesiones de canal y heredan la configuración del canal padre salvo que se anule.
    - Las sesiones de hilo heredan la selección `/model` a nivel de sesión del canal padre como alternativa solo de modelo; las selecciones `/model` locales del hilo siguen teniendo prioridad y el historial de transcripción del padre no se copia salvo que la herencia de transcripción esté habilitada.
    - `channels.discord.thread.inheritParent` (predeterminado `false`) opta los nuevos hilos automáticos para inicializarse desde la transcripción padre. Las anulaciones por cuenta viven en `channels.discord.accounts.<id>.thread.inheritParent`.
    - Las reacciones de la herramienta de mensajes pueden resolver destinos de mensajes directos `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` se conserva durante la alternativa de activación en fase de respuesta.

    Los temas de canal se inyectan como contexto **no confiable**. Las listas de permitidos limitan quién puede activar el agente, no son un límite completo de censura de contexto suplementario.

  </Accordion>

  <Accordion title="Sesiones vinculadas a hilos para subagentes">
    Discord puede vincular un hilo a un destino de sesión para que los mensajes de seguimiento en ese hilo sigan enrutándose a la misma sesión (incluidas las sesiones de subagentes).

    Comandos:

    - `/focus <target>` vincula el hilo actual/nuevo a un destino de subagente/sesión
    - `/unfocus` elimina la vinculación del hilo actual
    - `/agents` muestra ejecuciones activas y estado de vinculación
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

    - `session.threadBindings.*` establece valores predeterminados globales.
    - `channels.discord.threadBindings.*` anula el comportamiento de Discord.
    - `spawnSessions` controla la creación/vinculación automática de hilos para `sessions_spawn({ thread: true })` y generaciones de hilos ACP. Predeterminado: `true`.
    - `defaultSpawnContext` controla el contexto nativo de subagente para generaciones vinculadas a hilos. Predeterminado: `"fork"`.
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

    - `/acp spawn codex --bind here` vincula el canal o hilo actual en su lugar y mantiene los mensajes futuros en la misma sesión ACP. Los mensajes de hilo heredan la vinculación del canal padre.
    - En un canal o hilo vinculado, `/new` y `/reset` restablecen la misma sesión ACP en su lugar. Las vinculaciones temporales de hilos pueden anular la resolución de destino mientras estén activas.
    - `spawnSessions` controla la creación/vinculación de hilos hijos mediante `--thread auto|here`.

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
    - alternativa de emoji de identidad del agente (`agents.list[].identity.emoji`, de lo contrario "👀")

    Notas:

    - Discord acepta emoji Unicode o nombres de emoji personalizados.
    - Usa `""` para deshabilitar la reacción para un canal o una cuenta.

  </Accordion>

  <Accordion title="Escrituras de configuración">
    Las escrituras de configuración iniciadas por canal están habilitadas de forma predeterminada.

    Esto afecta los flujos `/config set|unset` (cuando las funciones de comandos están habilitadas).

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
    Enruta el tráfico WebSocket del Gateway de Discord y las búsquedas REST de inicio (ID de aplicación + resolución de listas de permitidos) a través de un proxy HTTP(S) con `channels.discord.proxy`.

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
    Habilita la resolución de PluralKit para asignar mensajes proxy a la identidad de miembro del sistema:

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
    - los nombres visibles de miembros se coinciden por nombre/slug solo cuando `channels.discord.dangerouslyAllowNameMatching: true`
    - las búsquedas usan el ID del mensaje original y están restringidas por ventana de tiempo
    - si la búsqueda falla, los mensajes proxy se tratan como mensajes de bot y se descartan salvo que `allowBots=true`

  </Accordion>

  <Accordion title="Alias de menciones salientes">
    Usa `mentionAliases` cuando los agentes necesiten menciones salientes deterministas para usuarios conocidos de Discord. Las claves son identificadores sin la `@` inicial; los valores son ID de usuario de Discord. Los identificadores desconocidos, `@everyone`, `@here` y las menciones dentro de spans de código Markdown se dejan sin cambios.

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

    Ejemplo solo de estado:

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

    Ejemplo de transmisión:

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
    - 4: Personalizado (usa el texto de actividad como estado; el emoji es opcional)
    - 5: Compitiendo

    Ejemplo de presencia automática (señal de salud en tiempo de ejecución):

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

    La presencia automática asigna la disponibilidad en tiempo de ejecución al estado de Discord: healthy => online, degraded o unknown => idle, exhausted o unavailable => dnd. Sobrescrituras de texto opcionales:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (admite el marcador de posición `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord admite la gestión de aprobaciones mediante botones en mensajes directos y, opcionalmente, puede publicar solicitudes de aprobación en el canal de origen.

    Ruta de configuración:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando es posible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, valor predeterminado: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord habilita automáticamente las aprobaciones de ejecución nativas cuando `enabled` no está definido o es `"auto"` y se puede resolver al menos un aprobador, ya sea desde `execApprovals.approvers` o desde `commands.ownerAllowFrom`. Discord no infiere aprobadores de ejecución a partir de `allowFrom` del canal, `dm.allowFrom` heredado ni `defaultTo` de mensajes directos. Define `enabled: false` para deshabilitar Discord explícitamente como cliente de aprobación nativo.

    Para comandos de grupo sensibles solo para el propietario, como `/diagnostics` y `/export-trajectory`, OpenClaw envía solicitudes de aprobación y resultados finales de forma privada. Primero intenta enviar un mensaje directo de Discord cuando el propietario que invoca el comando tiene una ruta de propietario de Discord; si no está disponible, recurre a la primera ruta de propietario disponible de `commands.ownerAllowFrom`, como Telegram.

    Cuando `target` es `channel` o `both`, la solicitud de aprobación es visible en el canal. Solo los aprobadores resueltos pueden usar los botones; otros usuarios reciben una denegación efímera. Las solicitudes de aprobación incluyen el texto del comando, así que habilita la entrega en canal solo en canales de confianza. Si el ID del canal no puede derivarse de la clave de sesión, OpenClaw recurre a la entrega por mensaje directo.

    Discord también renderiza los botones de aprobación compartidos que usan otros canales de chat. El adaptador nativo de Discord añade principalmente enrutamiento de mensajes directos para aprobadores y distribución a canales.
    Cuando esos botones están presentes, son la UX principal de aprobación; OpenClaw
    solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique
    que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.
    Si el runtime de aprobación nativo de Discord no está activo, OpenClaw mantiene visible la
    solicitud local determinista `/approve <id> <decision>`. Si el
    runtime está activo pero no se puede entregar una tarjeta nativa a ningún destino,
    OpenClaw envía un aviso de reserva en el mismo chat con el comando `/approve`
    exacto de la aprobación pendiente.

    La autenticación de Gateway y la resolución de aprobaciones siguen el contrato compartido del cliente de Gateway (los ID `plugin:` se resuelven mediante `plugin.approval.resolve`; otros ID mediante `exec.approval.resolve`). Las aprobaciones caducan después de 30 minutos de forma predeterminada.

    Consulta [Aprobaciones de ejecución](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Herramientas y controles de acciones

Las acciones de mensaje de Discord incluyen mensajería, administración de canales, moderación, presencia y acciones de metadatos.

Ejemplos principales:

- mensajería: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reacciones: `react`, `reactions`, `emojiList`
- moderación: `timeout`, `kick`, `ban`
- presencia: `setPresence`

La acción `event-create` acepta un parámetro opcional `image` (URL o ruta de archivo local) para establecer la imagen de portada del evento programado.

Los controles de acciones se encuentran en `channels.discord.actions.*`.

Comportamiento predeterminado de los controles:

| Grupo de acciones                                                                                                                                                        | Predeterminado |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | habilitado     |
| roles                                                                                                                                                                    | deshabilitado  |
| moderation                                                                                                                                                               | deshabilitado  |
| presence                                                                                                                                                                 | deshabilitado  |

## IU de componentes v2

OpenClaw usa componentes v2 de Discord para aprobaciones de ejecución y marcadores entre contextos. Las acciones de mensaje de Discord también pueden aceptar `components` para IU personalizada (avanzado; requiere construir una carga útil de componente mediante la herramienta discord), mientras que los `embeds` heredados siguen disponibles pero no se recomiendan.

- `channels.discord.ui.components.accentColor` establece el color de acento usado por los contenedores de componentes de Discord (hex).
- Configúralo por cuenta con `channels.discord.accounts.<id>.ui.components.accentColor`.
- Los `embeds` se ignoran cuando hay componentes v2 presentes.

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

Discord tiene dos superficies de voz distintas: **canales de voz** en tiempo real (conversaciones continuas) y **adjuntos de mensajes de voz** (el formato de vista previa con forma de onda). El gateway admite ambas.

### Canales de voz

Lista de configuración:

1. Habilita Message Content Intent en el Portal para desarrolladores de Discord.
2. Habilita Server Members Intent cuando se usen listas de permitidos de roles/usuarios.
3. Invita al bot con los ámbitos `bot` y `applications.commands`.
4. Concede Connect, Speak, Send Messages y Read Message History en el canal de voz de destino.
5. Habilita comandos nativos (`commands.native` o `channels.discord.commands.native`).
6. Configura `channels.discord.voice`.

Usa `/vc join|leave|status` para controlar sesiones. El comando usa el agente predeterminado de la cuenta y sigue las mismas reglas de lista de permitidos y política de grupo que otros comandos de Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Ejemplo de unión automática:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Notas:

- `voice.tts` sobrescribe `messages.tts` solo para la reproducción de voz.
- `voice.model` sobrescribe el LLM usado solo para respuestas de canal de voz de Discord. Déjalo sin definir para heredar el modelo del agente enrutado.
- STT usa `tools.media.audio`; `voice.model` no afecta la transcripción.
- Las sobrescrituras `systemPrompt` de Discord por canal se aplican a los turnos de transcripción de voz de ese canal de voz.
- Los turnos de transcripción de voz derivan el estado de propietario de `allowFrom` de Discord (o `dm.allowFrom`); los hablantes que no sean propietarios no pueden acceder a herramientas solo para propietarios (por ejemplo, `gateway` y `cron`).
- La voz de Discord es opcional para configuraciones solo de texto; define `channels.discord.voice.enabled=true` (o conserva un bloque `channels.discord.voice` existente) para habilitar los comandos `/vc`, el runtime de voz y el intent de gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` puede sobrescribir explícitamente la suscripción al intent de estado de voz. Déjalo sin definir para que el intent siga la habilitación efectiva de voz.
- `voice.daveEncryption` y `voice.decryptionFailureTolerance` se pasan a las opciones de unión de `@discordjs/voice`.
- Los valores predeterminados de `@discordjs/voice` son `daveEncryption=true` y `decryptionFailureTolerance=24` si no se definen.
- `voice.connectTimeoutMs` controla la espera inicial de Ready de `@discordjs/voice` para `/vc join` e intentos de unión automática. Valor predeterminado: `30000`.
- `voice.reconnectGraceMs` controla cuánto tiempo espera OpenClaw a que una sesión de voz desconectada empiece a reconectarse antes de destruirla. Valor predeterminado: `15000`.
- OpenClaw también vigila errores de descifrado de recepción y se recupera automáticamente saliendo del canal de voz y volviendo a unirse después de errores repetidos en una ventana breve.
- Si los registros de recepción muestran repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` después de actualizar, recopila un informe de dependencias y registros. La línea incluida de `@discordjs/voice` incluye la corrección de relleno ascendente del PR #11449 de discord.js, que cerró el issue #11419 de discord.js.

Canalización de canal de voz:

- La captura PCM de Discord se convierte en un archivo temporal WAV.
- `tools.media.audio` gestiona STT, por ejemplo `openai/gpt-4o-mini-transcribe`.
- La transcripción se envía a través de la entrada y el enrutamiento de Discord mientras el LLM de respuesta se ejecuta con una política de salida de voz que oculta la herramienta `tts` del agente y solicita texto devuelto, porque la voz de Discord posee la reproducción TTS final.
- `voice.model`, cuando está definido, sobrescribe solo el LLM de respuesta para este turno de canal de voz.
- `voice.tts` se fusiona sobre `messages.tts`; el audio resultante se reproduce en el canal unido.

Las credenciales se resuelven por componente: autenticación de ruta LLM para `voice.model`, autenticación STT para `tools.media.audio` y autenticación TTS para `messages.tts`/`voice.tts`.

### Mensajes de voz

Los mensajes de voz de Discord muestran una vista previa de forma de onda y requieren audio OGG/Opus. OpenClaw genera la forma de onda automáticamente, pero necesita `ffmpeg` y `ffprobe` en el host del gateway para inspeccionar y convertir.

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
    - habilita Server Members Intent cuando dependas de la resolución de usuario/miembro
    - reinicia el gateway después de cambiar intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - verifica `groupPolicy`
    - verifica la lista de permitidos del servidor en `channels.discord.guilds`
    - si existe el mapa `channels` del servidor, solo se permiten los canales listados
    - verifica el comportamiento de `requireMention` y los patrones de mención

    Comprobaciones útiles:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Causas comunes:

    - `groupPolicy="allowlist"` sin lista de permitidos de servidor/canal coincidente
    - `requireMention` configurado en el lugar incorrecto (debe estar bajo `channels.discord.guilds` o en la entrada del canal)
    - remitente bloqueado por la lista de permitidos `users` del servidor/canal

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Registros típicos:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Parámetros de la cola de gateway de Discord:

    - una sola cuenta: `channels.discord.eventQueue.listenerTimeout`
    - varias cuentas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - esto solo controla el trabajo del listener de gateway de Discord, no la duración del turno del agente

    Discord no aplica un tiempo de espera propio del canal a los turnos de agente en cola. Los listeners de mensajes delegan de inmediato, y las ejecuciones de Discord en cola conservan el orden por sesión hasta que el ciclo de vida de sesión/herramienta/runtime completa o aborta el trabajo.

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

  <Accordion title="Advertencias de tiempo de espera de búsqueda de metadatos de Gateway">
    OpenClaw obtiene los metadatos `/gateway/bot` de Discord antes de conectarse. Los fallos transitorios recurren a la URL de Gateway predeterminada de Discord y se limitan por tasa en los registros.

    Ajustes de tiempo de espera de metadatos:

    - cuenta única: `channels.discord.gatewayInfoTimeoutMs`
    - varias cuentas: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - alternativa de entorno cuando la configuración no está definida: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - valor predeterminado: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Reinicios por tiempo de espera de READY de Gateway">
    OpenClaw espera el evento `READY` de Gateway de Discord durante el inicio y después de reconexiones en tiempo de ejecución. Las configuraciones con varias cuentas y escalonamiento de inicio pueden necesitar una ventana READY de inicio más larga que la predeterminada.

    Ajustes de tiempo de espera de READY:

    - inicio con cuenta única: `channels.discord.gatewayReadyTimeoutMs`
    - inicio con varias cuentas: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - alternativa de entorno de inicio cuando la configuración no está definida: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - valor predeterminado de inicio: `15000` (15 segundos), máximo: `120000`
    - tiempo de ejecución con cuenta única: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - tiempo de ejecución con varias cuentas: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - alternativa de entorno de tiempo de ejecución cuando la configuración no está definida: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - valor predeterminado de tiempo de ejecución: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Discordancias en auditorías de permisos">
    Las comprobaciones de permisos de `channels status --probe` solo funcionan con ID numéricos de canales.

    Si usas claves de slug, la coincidencia en tiempo de ejecución aún puede funcionar, pero la sonda no puede verificar completamente los permisos.

  </Accordion>

  <Accordion title="Problemas de MD y emparejamiento">

    - MD deshabilitados: `channels.discord.dm.enabled=false`
    - política de MD deshabilitada: `channels.discord.dmPolicy="disabled"` (heredado: `channels.discord.dm.policy`)
    - esperando aprobación de emparejamiento en modo `pairing`

  </Accordion>

  <Accordion title="Bucles de bot a bot">
    De forma predeterminada, se ignoran los mensajes escritos por bots.

    Si estableces `channels.discord.allowBots=true`, usa reglas estrictas de menciones y listas de permitidos para evitar comportamientos de bucle.
    Prefiere `channels.discord.allowBots="mentions"` para aceptar solo mensajes de bots que mencionen al bot.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
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
    - empieza con `channels.discord.voice.decryptionFailureTolerance=24` (predeterminado upstream) y ajusta solo si es necesario
    - revisa los registros en busca de:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si los fallos continúan después de la reincorporación automática, recopila registros y compáralos con el historial upstream de recepción de DAVE en [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) y [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referencia de configuración

Referencia principal: [Referencia de configuración - Discord](/es/gateway/config-channels#discord).

<Accordion title="Campos de Discord de alta señal">

- inicio/autenticación: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- cola de eventos: `eventQueue.listenerTimeout` (presupuesto del listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- respuesta/historial: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias heredado: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medios/reintento: `mediaMaxMb` (limita las cargas salientes a Discord, predeterminado `100MB`), `retry`
- acciones: `actions.*`
- presencia: `activity`, `status`, `activityType`, `activityUrl`
- IU: `ui.components.accentColor`
- funciones: `threadBindings`, `bindings[]` de nivel superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Seguridad y operaciones

- Trata los tokens de bot como secretos (se prefiere `DISCORD_BOT_TOKEN` en entornos supervisados).
- Concede permisos de Discord con el mínimo privilegio.
- Si el despliegue/estado de comandos está obsoleto, reinicia Gateway y vuelve a comprobar con `openclaw channels status --probe`.

## Relacionado

<CardGroup cols={2}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Discord con Gateway.
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
