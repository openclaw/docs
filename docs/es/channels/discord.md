---
read_when:
    - Trabajando en las funciones del canal de Discord
summary: Estado de soporte, capacidades y configuración del bot de Discord
title: Discord
x-i18n:
    generated_at: "2026-04-24T05:18:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce73e0e6995702f3b2453b2e5ab4e55b02190e64fdf5805f53b4002be63140a2
    source_path: channels/discord.md
    workflow: 15
---

Listo para mensajes directos y canales de servidor mediante el gateway oficial de Discord.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de Discord usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento nativo de comandos y catálogo de comandos.
  </Card>
  <Card title="Solución de problemas del canal" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico entre canales y flujo de reparación.
  </Card>
</CardGroup>

## Configuración rápida

Necesitarás crear una nueva aplicación con un bot, añadir el bot a tu servidor y emparejarlo con OpenClaw. Recomendamos añadir tu bot a tu propio servidor privado. Si aún no tienes uno, [crea uno primero](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (elige **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crear una aplicación y un bot de Discord">
    Ve al [Portal para desarrolladores de Discord](https://discord.com/developers/applications) y haz clic en **New Application**. Asígnale un nombre como "OpenClaw".

    Haz clic en **Bot** en la barra lateral. Establece el **Username** con el nombre que uses para tu agente de OpenClaw.

  </Step>

  <Step title="Habilitar intents privilegiados">
    En la página **Bot**, desplázate hacia abajo hasta **Privileged Gateway Intents** y habilita:

    - **Message Content Intent** (obligatorio)
    - **Server Members Intent** (recomendado; obligatorio para listas de permitidos por rol y coincidencia de nombre a ID)
    - **Presence Intent** (opcional; solo se necesita para actualizaciones de presencia)

  </Step>

  <Step title="Copiar el token de tu bot">
    Vuelve a desplazarte hacia arriba en la página **Bot** y haz clic en **Reset Token**.

    <Note>
    A pesar del nombre, esto genera tu primer token; no se está “restableciendo” nada.
    </Note>

    Copia el token y guárdalo en algún lugar. Este es tu **Bot Token** y lo necesitarás en breve.

  </Step>

  <Step title="Generar una URL de invitación y añadir el bot a tu servidor">
    Haz clic en **OAuth2** en la barra lateral. Generarás una URL de invitación con los permisos adecuados para añadir el bot a tu servidor.

    Desplázate hacia abajo hasta **OAuth2 URL Generator** y habilita:

    - `bot`
    - `applications.commands`

    Debajo aparecerá una sección **Bot Permissions**. Habilita al menos:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcional)

    Este es el conjunto básico para canales de texto normales. Si planeas publicar en hilos de Discord, incluidos flujos de trabajo de foros o canales multimedia que crean o continúan un hilo, habilita también **Send Messages in Threads**.
    Copia la URL generada al final, pégala en tu navegador, selecciona tu servidor y haz clic en **Continue** para conectar. Ahora deberías ver tu bot en el servidor de Discord.

  </Step>

  <Step title="Habilitar el modo de desarrollador y recopilar tus IDs">
    De vuelta en la app de Discord, necesitas habilitar el modo de desarrollador para poder copiar IDs internos.

    1. Haz clic en **User Settings** (icono de engranaje junto a tu avatar) → **Advanced** → activa **Developer Mode**
    2. Haz clic derecho en el **icono de tu servidor** en la barra lateral → **Copy Server ID**
    3. Haz clic derecho en **tu propio avatar** → **Copy User ID**

    Guarda tu **Server ID** y tu **User ID** junto con tu Bot Token: enviarás los tres a OpenClaw en el siguiente paso.

  </Step>

  <Step title="Permitir mensajes directos de miembros del servidor">
    Para que el emparejamiento funcione, Discord necesita permitir que tu bot te envíe mensajes directos. Haz clic derecho en el **icono de tu servidor** → **Privacy Settings** → activa **Direct Messages**.

    Esto permite que los miembros del servidor (incluidos los bots) te envíen mensajes directos. Mantén esto habilitado si quieres usar mensajes directos de Discord con OpenClaw. Si solo planeas usar canales de servidor, puedes desactivar los mensajes directos después del emparejamiento.

  </Step>

  <Step title="Configurar de forma segura el token de tu bot (no lo envíes en el chat)">
    El token de tu bot de Discord es un secreto (como una contraseña). Configúralo en la máquina que ejecuta OpenClaw antes de enviar mensajes a tu agente.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Si OpenClaw ya se está ejecutando como un servicio en segundo plano, reinícialo mediante la app de OpenClaw para Mac o deteniendo y reiniciando el proceso `openclaw gateway run`.

  </Step>

  <Step title="Configurar OpenClaw y emparejar">

    <Tabs>
      <Tab title="Pregúntale a tu agente">
        Chatea con tu agente de OpenClaw en cualquier canal existente (por ejemplo, Telegram) y díselo. Si Discord es tu primer canal, usa en su lugar la pestaña de CLI / configuración.

        > "Ya configuré el token de mi bot de Discord en la configuración. Por favor, termina la configuración de Discord con el User ID `<user_id>` y el Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / configuración">
        Si prefieres una configuración basada en archivos, establece:

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

        Respaldo de variable de entorno para la cuenta predeterminada:

```bash
DISCORD_BOT_TOKEN=...
```

        Se admiten valores `token` en texto plano. También se admiten valores SecretRef para `channels.discord.token` en proveedores env/file/exec. Consulta [Gestión de secretos](/es/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Aprobar el primer emparejamiento por mensaje directo">
    Espera hasta que el gateway esté en ejecución y luego envía un mensaje directo a tu bot en Discord. Responderá con un código de emparejamiento.

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
La resolución de tokens reconoce la cuenta. Los valores de token de la configuración tienen prioridad sobre el respaldo de variables de entorno. `DISCORD_BOT_TOKEN` solo se usa para la cuenta predeterminada.
Para llamadas salientes avanzadas (acciones de herramienta de mensajes/canal), se usa un `token` explícito por llamada para esa llamada. Esto se aplica a acciones de envío y de lectura/sondeo (por ejemplo read/search/fetch/thread/pins/permissions). La configuración de política/reintentos de la cuenta sigue proviniendo de la cuenta seleccionada en la instantánea activa del entorno de ejecución.
</Note>

## Recomendado: Configurar un espacio de trabajo de servidor

Una vez que los mensajes directos funcionen, puedes configurar tu servidor de Discord como un espacio de trabajo completo en el que cada canal tenga su propia sesión de agente con su propio contexto. Esto se recomienda para servidores privados donde solo están tú y tu bot.

<Steps>
  <Step title="Añadir tu servidor a la lista de permitidos de servidores">
    Esto permite que tu agente responda en cualquier canal de tu servidor, no solo en mensajes directos.

    <Tabs>
      <Tab title="Pregúntale a tu agente">
        > "Añade mi Server ID de Discord `<server_id>` a la lista de permitidos de servidores"
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
    De forma predeterminada, tu agente solo responde en canales de servidor cuando se le menciona con @. Para un servidor privado, probablemente quieras que responda a cada mensaje.

    <Tabs>
      <Tab title="Pregúntale a tu agente">
        > "Permite que mi agente responda en este servidor sin necesidad de que se le mencione con @"
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

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planificar la memoria en canales de servidor">
    De forma predeterminada, la memoria a largo plazo (MEMORY.md) solo se carga en sesiones de mensajes directos. Los canales de servidor no cargan automáticamente MEMORY.md.

    <Tabs>
      <Tab title="Pregúntale a tu agente">
        > "Cuando haga preguntas en canales de Discord, usa memory_search o memory_get si necesitas contexto a largo plazo de MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Si necesitas contexto compartido en cada canal, coloca las instrucciones estables en `AGENTS.md` o `USER.md` (se inyectan en cada sesión). Mantén las notas a largo plazo en `MEMORY.md` y accede a ellas bajo demanda con herramientas de memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ahora crea algunos canales en tu servidor de Discord y empieza a chatear. Tu agente puede ver el nombre del canal, y cada canal tiene su propia sesión aislada, por lo que puedes configurar `#coding`, `#home`, `#research` o lo que mejor se adapte a tu flujo de trabajo.

## Modelo de ejecución

- Gateway gestiona la conexión de Discord.
- El enrutamiento de respuestas es determinista: las respuestas entrantes de Discord vuelven a Discord.
- De forma predeterminada (`session.dmScope=main`), los chats directos comparten la sesión principal del agente (`agent:main:main`).
- Los canales de servidor usan claves de sesión aisladas (`agent:<agentId>:discord:channel:<channelId>`).
- Los mensajes directos de grupo se ignoran de forma predeterminada (`channels.discord.dm.groupEnabled=false`).
- Los comandos slash nativos se ejecutan en sesiones de comando aisladas (`agent:<agentId>:discord:slash:<userId>`), mientras siguen transportando `CommandTargetSessionKey` a la sesión de conversación enrutada.

## Canales de foro

Los canales de foro y multimedia de Discord solo aceptan publicaciones en hilos. OpenClaw admite dos maneras de crearlos:

- Envía un mensaje al foro principal (`channel:<forumId>`) para crear automáticamente un hilo. El título del hilo usa la primera línea no vacía de tu mensaje.
- Usa `openclaw message thread create` para crear un hilo directamente. No pases `--message-id` para canales de foro.

Ejemplo: enviar al foro principal para crear un hilo

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Ejemplo: crear explícitamente un hilo de foro

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Los foros principales no aceptan componentes de Discord. Si necesitas componentes, envía al propio hilo (`channel:<threadId>`).

## Componentes interactivos

OpenClaw admite contenedores de componentes v2 de Discord para mensajes del agente. Usa la herramienta de mensajes con una carga útil `components`. Los resultados de interacción se enrutan de vuelta al agente como mensajes entrantes normales y siguen la configuración existente de `replyToMode` de Discord.

Bloques compatibles:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Las filas de acciones permiten hasta 5 botones o un único menú de selección
- Tipos de selección: `string`, `user`, `role`, `mentionable`, `channel`

De forma predeterminada, los componentes son de un solo uso. Establece `components.reusable=true` para permitir que botones, selectores y formularios se usen varias veces hasta que caduquen.

Para restringir quién puede hacer clic en un botón, establece `allowedUsers` en ese botón (IDs de usuario de Discord, etiquetas o `*`). Cuando está configurado, los usuarios que no coincidan reciben una denegación efímera.

Los comandos slash `/model` y `/models` abren un selector de modelos interactivo con menús desplegables de proveedor y modelo, además de un paso de envío. A menos que `commands.modelsWrite=false`, `/models add` también admite añadir una nueva entrada de proveedor/modelo desde el chat, y los modelos recién añadidos aparecen sin reiniciar el gateway. La respuesta del selector es efímera y solo el usuario que lo invocó puede usarla.

Archivos adjuntos:

- Los bloques `file` deben apuntar a una referencia de adjunto (`attachment://<filename>`)
- Proporciona el adjunto mediante `media`/`path`/`filePath` (un solo archivo); usa `media-gallery` para varios archivos
- Usa `filename` para sobrescribir el nombre de carga cuando deba coincidir con la referencia de adjunto

Formularios modales:

- Añade `components.modal` con hasta 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw añade un botón activador automáticamente

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
          placeholder: "Elige una opción",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
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
    `channels.discord.dmPolicy` controla el acceso a mensajes directos (heredado: `channels.discord.dm.policy`):

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.discord.allowFrom` incluya `"*"`; heredado: `channels.discord.dm.allowFrom`)
    - `disabled`

    Si la política de mensajes directos no es abierta, los usuarios desconocidos se bloquean (o se les solicita emparejamiento en modo `pairing`).

    Precedencia de múltiples cuentas:

    - `channels.discord.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Las cuentas con nombre heredan `channels.discord.allowFrom` cuando su propio `allowFrom` no está configurado.
    - Las cuentas con nombre no heredan `channels.discord.accounts.default.allowFrom`.

    Formato de destino de mensajes directos para la entrega:

    - `user:<id>`
    - mención `<@id>`

    Los IDs numéricos sin prefijo son ambiguos y se rechazan a menos que se proporcione un tipo de destino de usuario/canal explícito.

  </Tab>

  <Tab title="Política de servidor">
    El manejo de servidores se controla con `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La base segura cuando existe `channels.discord` es `allowlist`.

    Comportamiento de `allowlist`:

    - el servidor debe coincidir con `channels.discord.guilds` (se prefiere `id`, se acepta slug)
    - listas opcionales de remitentes permitidos: `users` (se recomiendan IDs estables) y `roles` (solo IDs de rol); si se configura cualquiera de ellas, los remitentes están permitidos cuando coinciden con `users` O `roles`
    - la coincidencia directa por nombre/etiqueta está deshabilitada de forma predeterminada; habilita `channels.discord.dangerouslyAllowNameMatching: true` solo como modo de compatibilidad de emergencia
    - se admiten nombres/etiquetas para `users`, pero los IDs son más seguros; `openclaw security audit` advierte cuando se usan entradas de nombre/etiqueta
    - si un servidor tiene `channels` configurado, los canales no listados se rechazan
    - si un servidor no tiene un bloque `channels`, todos los canales de ese servidor incluido en la lista de permitidos están permitidos

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

    Si solo estableces `DISCORD_BOT_TOKEN` y no creas un bloque `channels.discord`, el valor de respaldo en tiempo de ejecución es `groupPolicy="allowlist"` (con una advertencia en los registros), incluso si `channels.defaults.groupPolicy` es `open`.

  </Tab>

  <Tab title="Menciones y mensajes directos de grupo">
    Los mensajes de servidor requieren mención de forma predeterminada.

    La detección de menciones incluye:

    - mención explícita al bot
    - patrones de mención configurados (`agents.list[].groupChat.mentionPatterns`, con respaldo en `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de responder al bot en casos compatibles

    `requireMention` se configura por servidor/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcionalmente descarta mensajes que mencionan a otro usuario/rol pero no al bot (excluyendo @everyone/@here).

    Mensajes directos de grupo:

    - predeterminado: se ignoran (`dm.groupEnabled=false`)
    - lista opcional de permitidos mediante `dm.groupChannels` (IDs o slugs de canal)

  </Tab>
</Tabs>

### Enrutamiento de agentes basado en roles

Usa `bindings[].match.roles` para enrutar miembros de servidores de Discord a distintos agentes por ID de rol. Los enlaces basados en roles aceptan solo IDs de rol y se evalúan después de los enlaces de peer o parent-peer y antes de los enlaces solo de servidor. Si un enlace también establece otros campos de coincidencia (por ejemplo `peer` + `guildId` + `roles`), todos los campos configurados deben coincidir.

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
- Sobrescritura por canal: `channels.discord.commands.native`.
- `commands.native=false` elimina explícitamente los comandos nativos de Discord registrados previamente.
- La autenticación de comandos nativos usa las mismas listas de permitidos/políticas de Discord que el manejo normal de mensajes.
- Los comandos pueden seguir siendo visibles en la interfaz de Discord para usuarios no autorizados; la ejecución sigue aplicando la autenticación de OpenClaw y devuelve "not authorized".

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

    Nota: `off` desactiva el encadenamiento implícito de respuestas. Las etiquetas explícitas `[[reply_to_*]]` se siguen respetando.
    `first` siempre adjunta la referencia implícita de respuesta nativa al primer mensaje saliente de Discord del turno.
    `batched` solo adjunta la referencia implícita de respuesta nativa de Discord cuando el
    turno entrante fue un lote con debounce de varios mensajes. Esto es útil
    cuando quieres respuestas nativas principalmente para chats ambiguos y ráfagas, no para cada
    turno de un solo mensaje.

    Los IDs de mensaje se muestran en el contexto/historial para que los agentes puedan dirigirse a mensajes específicos.

  </Accordion>

  <Accordion title="Vista previa de transmisión en vivo">
    OpenClaw puede transmitir borradores de respuesta enviando un mensaje temporal y editándolo a medida que llega el texto. `channels.discord.streaming` acepta `off` (predeterminado) | `partial` | `block` | `progress`. `progress` se asigna a `partial` en Discord; `streamMode` es un alias heredado y se migra automáticamente.

    El valor predeterminado sigue siendo `off` porque las ediciones de vista previa en Discord alcanzan los límites de tasa rápidamente cuando varios bots o gateways comparten una cuenta.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` edita un único mensaje de vista previa a medida que llegan los tokens.
    - `block` emite fragmentos del tamaño del borrador (usa `draftChunk` para ajustar tamaño y puntos de corte, limitados por `textChunkLimit`).
    - Los medios, errores y respuestas finales explícitas cancelan las ediciones de vista previa pendientes.
    - `streaming.preview.toolProgress` (predeterminado `true`) controla si las actualizaciones de herramienta/progreso reutilizan el mensaje de vista previa.

    La transmisión de vista previa es solo de texto; las respuestas con medios vuelven al método de entrega normal. Cuando la transmisión `block` está habilitada explícitamente, OpenClaw omite la transmisión de vista previa para evitar la doble transmisión.

  </Accordion>

  <Accordion title="Historial, contexto y comportamiento de hilos">
    Contexto del historial del servidor:

    - `channels.discord.historyLimit` predeterminado `20`
    - respaldo: `messages.groupChat.historyLimit`
    - `0` lo desactiva

    Controles del historial de mensajes directos:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamiento de hilos:

    - Los hilos de Discord se enrutan como sesiones de canal y heredan la configuración del canal principal salvo que se sobrescriba.
    - `channels.discord.thread.inheritParent` (predeterminado `false`) permite que los nuevos hilos automáticos se inicialicen a partir de la transcripción del canal principal. Las sobrescrituras por cuenta se encuentran en `channels.discord.accounts.<id>.thread.inheritParent`.
    - Las reacciones de la herramienta de mensajes pueden resolver destinos de mensajes directos `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` se conserva durante el respaldo de activación en etapa de respuesta.

    Los temas de canal se inyectan como contexto **no confiable**. Las listas de permitidos controlan quién puede activar al agente, no constituyen un límite completo de redacción de contexto suplementario.

  </Accordion>

  <Accordion title="Sesiones vinculadas a hilos para subagentes">
    Discord puede vincular un hilo a un destino de sesión para que los mensajes posteriores en ese hilo sigan enrutándose a la misma sesión (incluidas las sesiones de subagentes).

    Comandos:

    - `/focus <target>` vincula el hilo actual/nuevo a un destino de subagente/sesión
    - `/unfocus` elimina la vinculación del hilo actual
    - `/agents` muestra las ejecuciones activas y el estado de vinculación
    - `/session idle <duration|off>` inspecciona/actualiza la desvinculación automática por inactividad para los enlaces enfocados
    - `/session max-age <duration|off>` inspecciona/actualiza la antigüedad máxima estricta para los enlaces enfocados

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
        spawnSubagentSessions: false, // opcional
      },
    },
  },
}
```

    Notas:

    - `session.threadBindings.*` establece los valores predeterminados globales.
    - `channels.discord.threadBindings.*` sobrescribe el comportamiento de Discord.
    - `spawnSubagentSessions` debe ser `true` para crear/vincular automáticamente hilos para `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` debe ser `true` para crear/vincular automáticamente hilos para ACP (`/acp spawn ... --thread ...` o `sessions_spawn({ runtime: "acp", thread: true })`).
    - Si los enlaces de hilos están deshabilitados para una cuenta, `/focus` y las operaciones relacionadas con enlaces de hilos no están disponibles.

    Consulta [Subagentes](/es/tools/subagents), [Agentes ACP](/es/tools/acp-agents) y [Referencia de configuración](/es/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Enlaces persistentes de canales ACP">
    Para espacios de trabajo ACP estables y “siempre activos”, configura enlaces ACP tipados de nivel superior dirigidos a conversaciones de Discord.

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

    - `/acp spawn codex --bind here` vincula el canal o hilo actual en el lugar y mantiene los mensajes futuros en la misma sesión ACP. Los mensajes del hilo heredan el enlace del canal principal.
    - En un canal o hilo vinculado, `/new` y `/reset` restablecen la misma sesión ACP en el lugar. Los enlaces temporales de hilos pueden sobrescribir la resolución de destino mientras están activos.
    - `spawnAcpSessions` solo es necesario cuando OpenClaw necesita crear/vincular un hilo hijo mediante `--thread auto|here`.

    Consulta [Agentes ACP](/es/tools/acp-agents) para ver los detalles del comportamiento de los enlaces.

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
    - respaldo al emoji de identidad del agente (`agents.list[].identity.emoji`, o bien "👀")

    Notas:

    - Discord acepta emojis unicode o nombres de emojis personalizados.
    - Usa `""` para desactivar la reacción para un canal o cuenta.

  </Accordion>

  <Accordion title="Escrituras de configuración">
    Las escrituras de configuración iniciadas por canal están habilitadas de forma predeterminada.

    Esto afecta a los flujos `/config set|unset` (cuando las funciones de comando están habilitadas).

    Desactivar:

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
    Enruta el tráfico WebSocket del gateway de Discord y las búsquedas REST de inicio (ID de aplicación + resolución de allowlist) a través de un proxy HTTP(S) con `channels.discord.proxy`.

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
    Habilita la resolución de PluralKit para asignar mensajes proxificados a la identidad del miembro del sistema:

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
    - las búsquedas usan el ID del mensaje original y están limitadas por una ventana de tiempo
    - si la búsqueda falla, los mensajes proxificados se tratan como mensajes de bot y se descartan salvo que `allowBots=true`

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
      activity: "Tiempo de concentración",
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
      activity: "Programación en vivo",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mapa de tipos de actividad:

    - 0: Playing
    - 1: Streaming (requiere `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (usa el texto de actividad como estado; el emoji es opcional)
    - 5: Competing

    Ejemplo de presencia automática (señal de estado del entorno de ejecución):

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

    La presencia automática asigna la disponibilidad del entorno de ejecución al estado de Discord: healthy => online, degraded o unknown => idle, exhausted o unavailable => dnd. Sobrescrituras de texto opcionales:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (admite el marcador `{reason}`)

  </Accordion>

  <Accordion title="Aprobaciones en Discord">
    Discord admite el manejo de aprobaciones basado en botones en mensajes directos y opcionalmente puede publicar solicitudes de aprobación en el canal de origen.

    Ruta de configuración:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; usa como respaldo `commands.ownerAllowFrom` cuando sea posible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord habilita automáticamente las aprobaciones nativas de ejecución cuando `enabled` no está configurado o es `"auto"` y puede resolverse al menos un aprobador, ya sea desde `execApprovals.approvers` o desde `commands.ownerAllowFrom`. Discord no infiere aprobadores de ejecución a partir de `allowFrom` del canal, `dm.allowFrom` heredado ni `defaultTo` de mensajes directos. Establece `enabled: false` para desactivar explícitamente Discord como cliente de aprobación nativo.

    Cuando `target` es `channel` o `both`, la solicitud de aprobación es visible en el canal. Solo los aprobadores resueltos pueden usar los botones; los demás usuarios reciben una denegación efímera. Las solicitudes de aprobación incluyen el texto del comando, así que habilita la entrega en canal solo en canales de confianza. Si el ID del canal no puede derivarse de la clave de sesión, OpenClaw usa como respaldo la entrega por mensaje directo.

    Discord también representa los botones de aprobación compartidos que usan otros canales de chat. El adaptador nativo de Discord principalmente añade el enrutamiento de aprobadores por mensaje directo y la distribución al canal.
    Cuando esos botones están presentes, son la UX principal de aprobación; OpenClaw
    solo debería incluir un comando manual `/approve` cuando el resultado de la herramienta indique
    que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

    La autenticación de Gateway y la resolución de aprobaciones siguen el contrato compartido del cliente Gateway (los IDs `plugin:` se resuelven mediante `plugin.approval.resolve`; los demás IDs mediante `exec.approval.resolve`). Las aprobaciones caducan después de 30 minutos de forma predeterminada.

    Consulta [Aprobaciones de exec](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Herramientas y controles de acciones

Las acciones de mensajes de Discord incluyen mensajería, administración de canales, moderación, presencia y acciones de metadatos.

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

## Interfaz Components v2

OpenClaw usa components v2 de Discord para aprobaciones de exec y marcadores entre contextos. Las acciones de mensajes de Discord también pueden aceptar `components` para interfaces personalizadas (avanzado; requiere construir una carga útil de componentes mediante la herramienta de Discord), mientras que los `embeds` heredados siguen estando disponibles, pero no se recomiendan.

- `channels.discord.ui.components.accentColor` establece el color de acento usado por los contenedores de componentes de Discord (hex).
- Establécelo por cuenta con `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` se ignoran cuando hay components v2 presentes.

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

Discord tiene dos superficies de voz distintas: **canales de voz** en tiempo real (conversaciones continuas) y **adjuntos de mensajes de voz** (el formato de vista previa de forma de onda). El gateway admite ambas.

### Canales de voz

Requisitos:

- Habilita los comandos nativos (`commands.native` o `channels.discord.commands.native`).
- Configura `channels.discord.voice`.
- El bot necesita permisos de Connect + Speak en el canal de voz de destino.

Usa `/vc join|leave|status` para controlar las sesiones. El comando usa el agente predeterminado de la cuenta y sigue las mismas reglas de allowlist y política de grupo que otros comandos de Discord.

Ejemplo de unión automática:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Notas:

- `voice.tts` sobrescribe `messages.tts` solo para la reproducción de voz.
- Los turnos de transcripción de voz derivan el estado de propietario de `allowFrom` de Discord (o `dm.allowFrom`); los hablantes que no son propietarios no pueden acceder a herramientas exclusivas del propietario (por ejemplo `gateway` y `cron`).
- La voz está habilitada de forma predeterminada; establece `channels.discord.voice.enabled=false` para deshabilitarla.
- `voice.daveEncryption` y `voice.decryptionFailureTolerance` se transfieren a las opciones de unión de `@discordjs/voice`.
- Los valores predeterminados de `@discordjs/voice` son `daveEncryption=true` y `decryptionFailureTolerance=24` si no se configuran.
- OpenClaw también supervisa los errores de descifrado de recepción y se recupera automáticamente saliendo y volviendo a entrar en el canal de voz después de errores repetidos en una ventana de tiempo corta.
- Si los registros de recepción muestran repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, esto puede ser el error ascendente de recepción de `@discordjs/voice` registrado en [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### Mensajes de voz

Los mensajes de voz de Discord muestran una vista previa de forma de onda y requieren audio OGG/Opus. OpenClaw genera la forma de onda automáticamente, pero necesita `ffmpeg` y `ffprobe` en el host del gateway para inspeccionar y convertir.

- Proporciona una **ruta de archivo local** (las URL se rechazan).
- Omite el contenido de texto (Discord rechaza texto + mensaje de voz en la misma carga útil).
- Se acepta cualquier formato de audio; OpenClaw convierte a OGG/Opus según sea necesario.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="Se usaron intents no permitidos o el bot no ve mensajes de servidor">

    - habilita Message Content Intent
    - habilita Server Members Intent cuando dependas de la resolución de usuario/miembro
    - reinicia el gateway después de cambiar intents

  </Accordion>

  <Accordion title="Los mensajes de servidor se bloquean inesperadamente">

    - verifica `groupPolicy`
    - verifica la allowlist del servidor en `channels.discord.guilds`
    - si existe el mapa `channels` del servidor, solo los canales listados están permitidos
    - verifica el comportamiento de `requireMention` y los patrones de mención

    Comprobaciones útiles:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention es false, pero aún se bloquea">
    Causas comunes:

    - `groupPolicy="allowlist"` sin una allowlist de servidor/canal coincidente
    - `requireMention` configurado en el lugar incorrecto (debe estar bajo `channels.discord.guilds` o en la entrada del canal)
    - remitente bloqueado por la allowlist `users` del servidor/canal

  </Accordion>

  <Accordion title="Los controladores de larga duración agotan el tiempo de espera o duplican respuestas">

    Registros típicos:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Ajuste del presupuesto del listener:

    - cuenta única: `channels.discord.eventQueue.listenerTimeout`
    - múltiples cuentas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Ajuste del tiempo de espera de ejecución del worker:

    - cuenta única: `channels.discord.inboundWorker.runTimeoutMs`
    - múltiples cuentas: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - predeterminado: `1800000` (30 minutos); establece `0` para deshabilitarlo

    Referencia recomendada:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Usa `eventQueue.listenerTimeout` para la configuración lenta del listener y `inboundWorker.runTimeoutMs`
    solo si quieres una válvula de seguridad independiente para los turnos de agente en cola.

  </Accordion>

  <Accordion title="Incompatibilidades en la auditoría de permisos">
    Las comprobaciones de permisos de `channels status --probe` solo funcionan para IDs de canal numéricos.

    Si usas claves slug, la coincidencia en tiempo de ejecución puede seguir funcionando, pero la sonda no puede verificar completamente los permisos.

  </Accordion>

  <Accordion title="Problemas de mensajes directos y emparejamiento">

    - mensajes directos deshabilitados: `channels.discord.dm.enabled=false`
    - política de mensajes directos deshabilitada: `channels.discord.dmPolicy="disabled"` (heredado: `channels.discord.dm.policy`)
    - esperando aprobación de emparejamiento en modo `pairing`

  </Accordion>

  <Accordion title="Bucles de bot a bot">
    De forma predeterminada, los mensajes creados por bots se ignoran.

    Si estableces `channels.discord.allowBots=true`, usa reglas estrictas de mención y allowlist para evitar comportamientos en bucle.
    Prefiere `channels.discord.allowBots="mentions"` para aceptar solo mensajes de bot que mencionen al bot.

  </Accordion>

  <Accordion title="La conversión de voz a texto falla con DecryptionFailed(...)">

    - mantén OpenClaw actualizado (`openclaw update`) para que esté presente la lógica de recuperación de recepción de voz de Discord
    - confirma `channels.discord.voice.daveEncryption=true` (predeterminado)
    - comienza con `channels.discord.voice.decryptionFailureTolerance=24` (valor predeterminado ascendente) y ajústalo solo si es necesario
    - observa los registros para:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si los fallos continúan después de la reconexión automática, recopila registros y compáralos con [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Referencia de configuración

Referencia principal: [Referencia de configuración - Discord](/es/gateway/config-channels#discord).

<Accordion title="Campos de Discord de alta señal">

- inicio/autenticación: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- cola de eventos: `eventQueue.listenerTimeout` (presupuesto del listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker entrante: `inboundWorker.runTimeoutMs`
- respuesta/historial: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- transmisión: `streaming` (alias heredado: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medios/reintento: `mediaMaxMb` (limita las cargas salientes de Discord, predeterminado `100MB`), `retry`
- acciones: `actions.*`
- presencia: `activity`, `status`, `activityType`, `activityUrl`
- interfaz: `ui.components.accentColor`
- funciones: `threadBindings`, `bindings[]` de nivel superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Seguridad y operaciones

- Trata los tokens de bot como secretos (`DISCORD_BOT_TOKEN` es preferible en entornos supervisados).
- Otorga los permisos mínimos necesarios en Discord.
- Si el estado o la implementación de comandos está desactualizado, reinicia el gateway y vuelve a comprobar con `openclaw channels status --probe`.

## Relacionado

<CardGroup cols={2}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Discord con el gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de chat grupal y allowlist.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enruta mensajes entrantes a los agentes.
  </Card>
  <Card title="Seguridad" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y refuerzo.
  </Card>
  <Card title="Enrutamiento multiagente" icon="sitemap" href="/es/concepts/multi-agent">
    Asigna servidores y canales a agentes.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento nativo de comandos.
  </Card>
</CardGroup>
