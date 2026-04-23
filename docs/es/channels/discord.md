---
read_when:
    - Trabajando en funciones del canal de Discord
summary: Estado de compatibilidad, capacidades y configuración del bot de Discord
title: Discord
x-i18n:
    generated_at: "2026-04-23T13:57:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1160a0b221bc3251722a81c00c65ee7c2001efce345248727f1f3c8580a0e953
    source_path: channels/discord.md
    workflow: 15
---

# Discord (API de bot)

Estado: listo para mensajes directos y canales de servidor mediante el Gateway oficial de Discord.

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

Necesitará crear una nueva aplicación con un bot, añadir el bot a su servidor y emparejarlo con OpenClaw. Recomendamos añadir su bot a su propio servidor privado. Si todavía no tiene uno, [cree uno primero](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (elija **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crear una aplicación de Discord y un bot">
    Vaya al [Portal para desarrolladores de Discord](https://discord.com/developers/applications) y haga clic en **New Application**. Póngale un nombre como "OpenClaw".

    Haga clic en **Bot** en la barra lateral. Configure el **Username** con el nombre que use para su agente de OpenClaw.

  </Step>

  <Step title="Habilitar intents privilegiados">
    Todavía en la página **Bot**, desplácese hacia abajo hasta **Privileged Gateway Intents** y habilite:

    - **Message Content Intent** (obligatorio)
    - **Server Members Intent** (recomendado; obligatorio para listas de permitidos por rol y coincidencia de nombre a ID)
    - **Presence Intent** (opcional; solo se necesita para actualizaciones de presencia)

  </Step>

  <Step title="Copiar el token de su bot">
    Vuelva a desplazarse hacia arriba en la página **Bot** y haga clic en **Reset Token**.

    <Note>
    A pesar del nombre, esto genera su primer token; no se está “restableciendo” nada.
    </Note>

    Copie el token y guárdelo en algún lugar. Este es su **Bot Token** y lo necesitará en breve.

  </Step>

  <Step title="Generar una URL de invitación y añadir el bot a su servidor">
    Haga clic en **OAuth2** en la barra lateral. Generará una URL de invitación con los permisos correctos para añadir el bot a su servidor.

    Desplácese hacia abajo hasta **OAuth2 URL Generator** y habilite:

    - `bot`
    - `applications.commands`

    Debajo aparecerá una sección **Bot Permissions**. Habilite al menos:

    **Permisos generales**
      - Ver canales
    **Permisos de texto**
      - Enviar mensajes
      - Leer historial de mensajes
      - Insertar enlaces
      - Adjuntar archivos
      - Añadir reacciones (opcional)

    Este es el conjunto base para canales de texto normales. Si planea publicar en hilos de Discord, incluidos flujos de trabajo de canales de foro o multimedia que crean o continúan un hilo, habilite también **Send Messages in Threads**.
    Copie la URL generada al final, péguela en su navegador, seleccione su servidor y haga clic en **Continue** para conectarlo. Ahora debería ver su bot en el servidor de Discord.

  </Step>

  <Step title="Habilitar el modo Desarrollador y recopilar sus IDs">
    De vuelta en la aplicación de Discord, necesita habilitar el modo Desarrollador para poder copiar los IDs internos.

    1. Haga clic en **User Settings** (icono de engranaje junto a su avatar) → **Advanced** → active **Developer Mode**
    2. Haga clic con el botón derecho en el **icono de su servidor** en la barra lateral → **Copy Server ID**
    3. Haga clic con el botón derecho en **su propio avatar** → **Copy User ID**

    Guarde su **Server ID** y **User ID** junto con su Bot Token; enviará los tres a OpenClaw en el siguiente paso.

  </Step>

  <Step title="Permitir mensajes directos de miembros del servidor">
    Para que el emparejamiento funcione, Discord debe permitir que su bot le envíe mensajes directos. Haga clic con el botón derecho en el **icono de su servidor** → **Privacy Settings** → active **Direct Messages**.

    Esto permite que los miembros del servidor (incluidos los bots) le envíen mensajes directos. Mantenga esto habilitado si quiere usar mensajes directos de Discord con OpenClaw. Si solo planea usar canales de servidor, puede deshabilitar los mensajes directos después del emparejamiento.

  </Step>

  <Step title="Configure el token de su bot de forma segura (no lo envíe por chat)">
    El token de su bot de Discord es un secreto (como una contraseña). Configúrelo en la máquina que ejecuta OpenClaw antes de enviar mensajes a su agente.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Si OpenClaw ya se está ejecutando como servicio en segundo plano, reinícielo mediante la app de OpenClaw para Mac o deteniendo y reiniciando el proceso `openclaw gateway run`.

  </Step>

  <Step title="Configurar OpenClaw y emparejar">

    <Tabs>
      <Tab title="Preguntar a su agente">
        Chatee con su agente de OpenClaw en cualquier canal existente (por ejemplo, Telegram) y dígaselo. Si Discord es su primer canal, use en su lugar la pestaña de CLI / configuración.

        > "Ya configuré el token de mi bot de Discord en la configuración. Termine por favor la configuración de Discord con el User ID `<user_id>` y el Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / configuración">
        Si prefiere una configuración basada en archivos, establezca:

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

        Se admiten valores `token` en texto sin formato. También se admiten valores SecretRef para `channels.discord.token` en proveedores env/file/exec. Consulte [Gestión de secretos](/es/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Aprobar el primer emparejamiento por mensaje directo">
    Espere hasta que el Gateway esté en ejecución y luego envíe un mensaje directo a su bot en Discord. Responderá con un código de emparejamiento.

    <Tabs>
      <Tab title="Preguntar a su agente">
        Envíe el código de emparejamiento a su agente en su canal existente:

        > "Aprueba este código de emparejamiento de Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Los códigos de emparejamiento vencen después de 1 hora.

    Ahora debería poder chatear con su agente por mensaje directo en Discord.

  </Step>
</Steps>

<Note>
La resolución de tokens tiene en cuenta la cuenta. Los valores de token de configuración prevalecen sobre el respaldo de entorno. `DISCORD_BOT_TOKEN` solo se usa para la cuenta predeterminada.
Para llamadas salientes avanzadas (acciones de herramienta/canal de mensajes), se usa un `token` explícito por llamada para esa llamada. Esto se aplica a acciones de envío y de lectura/sondeo (por ejemplo, read/search/fetch/thread/pins/permissions). La configuración de políticas de cuenta/reintentos sigue proviniendo de la cuenta seleccionada en la instantánea activa del entorno de ejecución.
</Note>

## Recomendado: configurar un espacio de trabajo de servidor

Una vez que funcionen los mensajes directos, puede configurar su servidor de Discord como un espacio de trabajo completo donde cada canal obtiene su propia sesión de agente con su propio contexto. Esto se recomienda para servidores privados donde solo están usted y su bot.

<Steps>
  <Step title="Añadir su servidor a la lista de permitidos de servidores">
    Esto permite que su agente responda en cualquier canal de su servidor, no solo en mensajes directos.

    <Tabs>
      <Tab title="Preguntar a su agente">
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
    De forma predeterminada, su agente solo responde en canales de servidor cuando se le menciona con @. Para un servidor privado, probablemente quiera que responda a todos los mensajes.

    <Tabs>
      <Tab title="Preguntar a su agente">
        > "Permite que mi agente responda en este servidor sin necesidad de mencionarlo con @"
      </Tab>
      <Tab title="Configuración">
        Establezca `requireMention: false` en la configuración de su servidor:

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
    De forma predeterminada, la memoria a largo plazo (`MEMORY.md`) solo se carga en sesiones de mensajes directos. Los canales de servidor no cargan automáticamente `MEMORY.md`.

    <Tabs>
      <Tab title="Preguntar a su agente">
        > "Cuando haga preguntas en canales de Discord, usa memory_search o memory_get si necesitas contexto a largo plazo de MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Si necesita contexto compartido en todos los canales, coloque las instrucciones estables en `AGENTS.md` o `USER.md` (se inyectan en cada sesión). Mantenga las notas a largo plazo en `MEMORY.md` y acceda a ellas cuando sea necesario con las herramientas de memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ahora cree algunos canales en su servidor de Discord y empiece a chatear. Su agente puede ver el nombre del canal y cada canal obtiene su propia sesión aislada, por lo que puede configurar `#coding`, `#home`, `#research` o lo que mejor se adapte a su flujo de trabajo.

## Modelo de ejecución

- El Gateway gestiona la conexión de Discord.
- El enrutamiento de respuestas es determinista: las respuestas entrantes de Discord vuelven a Discord.
- De forma predeterminada (`session.dmScope=main`), los chats directos comparten la sesión principal del agente (`agent:main:main`).
- Los canales de servidor tienen claves de sesión aisladas (`agent:<agentId>:discord:channel:<channelId>`).
- Los mensajes directos grupales se ignoran de forma predeterminada (`channels.discord.dm.groupEnabled=false`).
- Los comandos slash nativos se ejecutan en sesiones de comandos aisladas (`agent:<agentId>:discord:slash:<userId>`), al tiempo que siguen transportando `CommandTargetSessionKey` a la sesión de conversación enrutada.

## Canales de foro

Los canales de foro y multimedia de Discord solo aceptan publicaciones en hilos. OpenClaw admite dos formas de crearlos:

- Enviar un mensaje al padre del foro (`channel:<forumId>`) para crear automáticamente un hilo. El título del hilo usa la primera línea no vacía de su mensaje.
- Usar `openclaw message thread create` para crear un hilo directamente. No pase `--message-id` para canales de foro.

Ejemplo: enviar al padre del foro para crear un hilo

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Ejemplo: crear explícitamente un hilo de foro

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Los padres de foro no aceptan componentes de Discord. Si necesita componentes, envíelos al propio hilo (`channel:<threadId>`).

## Componentes interactivos

OpenClaw admite contenedores de componentes v2 de Discord para mensajes de agente. Use la herramienta de mensajes con una carga útil `components`. Los resultados de interacción se enrutan de vuelta al agente como mensajes entrantes normales y siguen la configuración existente de `replyToMode` de Discord.

Bloques admitidos:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Las filas de acciones permiten hasta 5 botones o un único menú de selección
- Tipos de selección: `string`, `user`, `role`, `mentionable`, `channel`

De forma predeterminada, los componentes son de un solo uso. Establezca `components.reusable=true` para permitir que botones, selectores y formularios se usen varias veces hasta que caduquen.

Para restringir quién puede hacer clic en un botón, establezca `allowedUsers` en ese botón (IDs de usuario de Discord, etiquetas o `*`). Cuando se configure, los usuarios que no coincidan recibirán una denegación efímera.

Los comandos slash `/model` y `/models` abren un selector de modelo interactivo con menús desplegables de proveedor y modelo, además de un paso de envío. A menos que `commands.modelsWrite=false`, `/models add` también admite añadir una nueva entrada de proveedor/modelo desde el chat, y los modelos recién añadidos aparecen sin reiniciar el Gateway. La respuesta del selector es efímera y solo el usuario que lo invocó puede usarla.

Adjuntos de archivo:

- Los bloques `file` deben apuntar a una referencia de adjunto (`attachment://<filename>`)
- Proporcione el adjunto mediante `media`/`path`/`filePath` (un solo archivo); use `media-gallery` para varios archivos
- Use `filename` para sobrescribir el nombre de carga cuando deba coincidir con la referencia del adjunto

Formularios modales:

- Añada `components.modal` con hasta 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw añade un botón disparador automáticamente

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
    `channels.discord.dmPolicy` controla el acceso a mensajes directos (anterior: `channels.discord.dm.policy`):

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.discord.allowFrom` incluya `"*"`; anterior: `channels.discord.dm.allowFrom`)
    - `disabled`

    Si la política de mensajes directos no es abierta, los usuarios desconocidos se bloquean (o se les solicita emparejamiento en modo `pairing`).

    Precedencia de varias cuentas:

    - `channels.discord.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Las cuentas con nombre heredan `channels.discord.allowFrom` cuando su propio `allowFrom` no está configurado.
    - Las cuentas con nombre no heredan `channels.discord.accounts.default.allowFrom`.

    Formato de destino de mensaje directo para la entrega:

    - `user:<id>`
    - mención `<@id>`

    Los IDs numéricos sin formato son ambiguos y se rechazan a menos que se proporcione un tipo de destino usuario/canal explícito.

  </Tab>

  <Tab title="Política de servidor">
    El manejo de servidores está controlado por `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La base segura cuando existe `channels.discord` es `allowlist`.

    Comportamiento de `allowlist`:

    - el servidor debe coincidir con `channels.discord.guilds` (se prefiere `id`, se acepta slug)
    - listas de remitentes permitidos opcionales: `users` (se recomiendan IDs estables) y `roles` (solo IDs de rol); si cualquiera está configurada, los remitentes están permitidos cuando coinciden con `users` O `roles`
    - la coincidencia directa de nombre/etiqueta está deshabilitada de forma predeterminada; habilite `channels.discord.dangerouslyAllowNameMatching: true` solo como modo de compatibilidad de emergencia
    - se admiten nombres/etiquetas para `users`, pero los IDs son más seguros; `openclaw security audit` avisa cuando se usan entradas de nombre/etiqueta
    - si un servidor tiene `channels` configurado, se deniegan los canales no incluidos en la lista
    - si un servidor no tiene bloque `channels`, se permiten todos los canales de ese servidor incluido en la lista de permitidos

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

    Si solo configura `DISCORD_BOT_TOKEN` y no crea un bloque `channels.discord`, el respaldo en tiempo de ejecución es `groupPolicy="allowlist"` (con una advertencia en los registros), incluso si `channels.defaults.groupPolicy` es `open`.

  </Tab>

  <Tab title="Menciones y mensajes directos grupales">
    Los mensajes de servidor están limitados por mención de forma predeterminada.

    La detección de menciones incluye:

    - mención explícita al bot
    - patrones de mención configurados (`agents.list[].groupChat.mentionPatterns`, respaldo `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de respuesta al bot en casos compatibles

    `requireMention` se configura por servidor/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcionalmente descarta mensajes que mencionan a otro usuario/rol pero no al bot (excluyendo @everyone/@here).

    Mensajes directos grupales:

    - predeterminado: ignorados (`dm.groupEnabled=false`)
    - lista de permitidos opcional mediante `dm.groupChannels` (IDs de canal o slugs)

  </Tab>
</Tabs>

### Enrutamiento de agentes basado en roles

Use `bindings[].match.roles` para enrutar miembros de servidores de Discord a distintos agentes según el ID del rol. Los enlaces basados en roles aceptan solo IDs de rol y se evalúan después de los enlaces peer o parent-peer y antes de los enlaces solo de servidor. Si un enlace también configura otros campos de coincidencia (por ejemplo `peer` + `guildId` + `roles`), todos los campos configurados deben coincidir.

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

## Configuración del Portal para desarrolladores

<AccordionGroup>
  <Accordion title="Crear aplicación y bot">

    1. Portal para desarrolladores de Discord -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Copie el token del bot

  </Accordion>

  <Accordion title="Intents privilegiados">
    En **Bot -> Privileged Gateway Intents**, habilite:

    - Message Content Intent
    - Server Members Intent (recomendado)

    Presence Intent es opcional y solo obligatorio si quiere recibir actualizaciones de presencia. Configurar la presencia del bot (`setPresence`) no requiere habilitar actualizaciones de presencia para miembros.

  </Accordion>

  <Accordion title="Ámbitos OAuth y permisos base">
    Generador de URL de OAuth:

    - ámbitos: `bot`, `applications.commands`

    Permisos base típicos:

    **Permisos generales**
      - Ver canales
    **Permisos de texto**
      - Enviar mensajes
      - Leer historial de mensajes
      - Insertar enlaces
      - Adjuntar archivos
      - Añadir reacciones (opcional)

    Este es el conjunto base para canales de texto normales. Si planea publicar en hilos de Discord, incluidos flujos de trabajo de canales de foro o multimedia que crean o continúan un hilo, habilite también **Send Messages in Threads**.
    Evite `Administrator` a menos que sea explícitamente necesario.

  </Accordion>

  <Accordion title="Copiar IDs">
    Habilite el modo Desarrollador de Discord y luego copie:

    - ID del servidor
    - ID del canal
    - ID del usuario

    Prefiera IDs numéricos en la configuración de OpenClaw para auditorías y sondeos fiables.

  </Accordion>
</AccordionGroup>

## Comandos nativos y autenticación de comandos

- `commands.native` usa `"auto"` de forma predeterminada y está habilitado para Discord.
- Anulación por canal: `channels.discord.commands.native`.
- `commands.native=false` borra explícitamente los comandos nativos de Discord registrados previamente.
- La autenticación de comandos nativos usa las mismas listas de permitidos/políticas de Discord que el manejo normal de mensajes.
- Los comandos pueden seguir siendo visibles en la interfaz de Discord para usuarios no autorizados; la ejecución sigue aplicando la autenticación de OpenClaw y devuelve "no autorizado".

Consulte [Comandos slash](/es/tools/slash-commands) para ver el catálogo y el comportamiento de los comandos.

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
    `batched` solo adjunta la referencia implícita de respuesta nativa de Discord cuando el turno entrante era un lote con debounce de varios mensajes. Esto es útil cuando quiere respuestas nativas principalmente para chats ambiguos y repentinos, no para cada turno de un solo mensaje.

    Los IDs de mensajes se muestran en el contexto/historial para que los agentes puedan dirigirse a mensajes específicos.

  </Accordion>

  <Accordion title="Vista previa de streaming en vivo">
    OpenClaw puede transmitir borradores de respuesta enviando un mensaje temporal y editándolo a medida que llega el texto. `channels.discord.streaming` acepta `off` (predeterminado) | `partial` | `block` | `progress`. `progress` se asigna a `partial` en Discord; `streamMode` es un alias heredado y se migra automáticamente.

    El valor predeterminado sigue siendo `off` porque las ediciones de vista previa de Discord alcanzan rápidamente los límites de tasa cuando varios bots o Gateways comparten una cuenta.

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
    - `block` emite fragmentos del tamaño del borrador (use `draftChunk` para ajustar tamaño y puntos de corte, limitados por `textChunkLimit`).
    - Los finales con medios, errores y respuestas explícitas cancelan las ediciones de vista previa pendientes.
    - `streaming.preview.toolProgress` (predeterminado `true`) controla si las actualizaciones de herramienta/progreso reutilizan el mensaje de vista previa.

    La vista previa por streaming es solo de texto; las respuestas con medios vuelven a la entrega normal. Cuando el streaming `block` está habilitado explícitamente, OpenClaw omite la vista previa por streaming para evitar un doble streaming.

  </Accordion>

  <Accordion title="Historial, contexto y comportamiento de hilos">
    Contexto del historial de servidor:

    - `channels.discord.historyLimit` predeterminado `20`
    - respaldo: `messages.groupChat.historyLimit`
    - `0` deshabilita

    Controles del historial de mensajes directos:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamiento de hilos:

    - Los hilos de Discord se enrutan como sesiones de canal y heredan la configuración del canal padre salvo que se sobrescriba.
    - `channels.discord.thread.inheritParent` (predeterminado `false`) hace que los nuevos hilos automáticos usen como semilla la transcripción del padre. Las anulaciones por cuenta están en `channels.discord.accounts.<id>.thread.inheritParent`.
    - Las reacciones de la herramienta de mensajes pueden resolver destinos de mensaje directo `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` se conserva durante el respaldo de activación en la etapa de respuesta.

    Los temas de canal se inyectan como contexto **no confiable**. Las listas de permitidos controlan quién puede activar al agente, no constituyen un límite completo de redacción de contexto suplementario.

  </Accordion>

  <Accordion title="Sesiones vinculadas a hilos para subagentes">
    Discord puede vincular un hilo a un destino de sesión para que los mensajes de seguimiento en ese hilo sigan enrutándose a la misma sesión (incluidas las sesiones de subagentes).

    Comandos:

    - `/focus <target>` vincula el hilo actual/nuevo a un destino de subagente/sesión
    - `/unfocus` elimina el vínculo del hilo actual
    - `/agents` muestra ejecuciones activas y estado del vínculo
    - `/session idle <duration|off>` inspecciona/actualiza el desenfoque automático por inactividad para vínculos enfocados
    - `/session max-age <duration|off>` inspecciona/actualiza la antigüedad máxima estricta para vínculos enfocados

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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Notas:

    - `session.threadBindings.*` establece valores predeterminados globales.
    - `channels.discord.threadBindings.*` sobrescribe el comportamiento de Discord.
    - `spawnSubagentSessions` debe ser true para crear/vincular hilos automáticamente para `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` debe ser true para crear/vincular hilos automáticamente para ACP (`/acp spawn ... --thread ...` o `sessions_spawn({ runtime: "acp", thread: true })`).
    - Si los vínculos de hilo están deshabilitados para una cuenta, `/focus` y las operaciones relacionadas de vínculo de hilo no están disponibles.

    Consulte [Subagentes](/es/tools/subagents), [Agentes ACP](/es/tools/acp-agents) y [Referencia de configuración](/es/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Vínculos persistentes de canal ACP">
    Para espacios de trabajo ACP estables y “siempre activos”, configure vínculos ACP tipados de nivel superior dirigidos a conversaciones de Discord.

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

    - `/acp spawn codex --bind here` vincula el canal o hilo actual en su lugar y mantiene los mensajes futuros en la misma sesión ACP. Los mensajes del hilo heredan el vínculo del canal padre.
    - En un canal o hilo vinculado, `/new` y `/reset` restablecen la misma sesión ACP en su lugar. Los vínculos temporales de hilo pueden sobrescribir la resolución de destino mientras estén activos.
    - `spawnAcpSessions` solo es obligatorio cuando OpenClaw necesita crear/vincular un hilo hijo mediante `--thread auto|here`.

    Consulte [Agentes ACP](/es/tools/acp-agents) para ver detalles del comportamiento de los vínculos.

  </Accordion>

  <Accordion title="Notificaciones de reacciones">
    Modo de notificación de reacciones por servidor:

    - `off`
    - `own` (predeterminado)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Los eventos de reacción se convierten en eventos del sistema y se adjuntan a la sesión de Discord enrutada.

  </Accordion>

  <Accordion title="Reacciones de acuse">
    `ackReaction` envía un emoji de acuse mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - respaldo del emoji de identidad del agente (`agents.list[].identity.emoji`, o si no "👀")

    Notas:

    - Discord acepta emoji unicode o nombres de emoji personalizados.
    - Use `""` para deshabilitar la reacción de un canal o cuenta.

  </Accordion>

  <Accordion title="Escrituras de configuración">
    Las escrituras de configuración iniciadas desde el canal están habilitadas de forma predeterminada.

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

  <Accordion title="Proxy del Gateway">
    Enrute el tráfico WebSocket del Gateway de Discord y las búsquedas REST de inicio (ID de aplicación + resolución de allowlist) a través de un proxy HTTP(S) con `channels.discord.proxy`.

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
    Habilite la resolución de PluralKit para asignar mensajes con proxy a la identidad del miembro del sistema:

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
    - los nombres para mostrar de miembros coinciden por nombre/slug solo cuando `channels.discord.dangerouslyAllowNameMatching: true`
    - las búsquedas usan el ID de mensaje original y están restringidas por ventana temporal
    - si la búsqueda falla, los mensajes con proxy se tratan como mensajes de bot y se descartan a menos que `allowBots=true`

  </Accordion>

  <Accordion title="Configuración de presencia">
    Las actualizaciones de presencia se aplican cuando configura un campo de estado o actividad, o cuando habilita la presencia automática.

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
    - 4: Personalizada (usa el texto de actividad como estado; el emoji es opcional)
    - 5: Compitiendo

    Ejemplo de presencia automática (señal de estado del entorno de ejecución):

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

    La presencia automática asigna la disponibilidad del entorno de ejecución al estado de Discord: saludable => online, degradado o desconocido => idle, agotado o no disponible => dnd. Sobrescrituras de texto opcionales:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (admite el marcador `{reason}`)

  </Accordion>

  <Accordion title="Aprobaciones en Discord">
    Discord admite el manejo de aprobaciones basado en botones en mensajes directos y opcionalmente puede publicar solicitudes de aprobación en el canal de origen.

    Ruta de configuración:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; usa como respaldo `commands.ownerAllowFrom` cuando es posible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord habilita automáticamente las aprobaciones nativas de ejecución cuando `enabled` no está configurado o es `"auto"` y se puede resolver al menos un aprobador, ya sea desde `execApprovals.approvers` o desde `commands.ownerAllowFrom`. Discord no infiere aprobadores de ejecución desde `allowFrom` del canal, `dm.allowFrom` heredado ni `defaultTo` de mensajes directos. Configure `enabled: false` para deshabilitar explícitamente Discord como cliente nativo de aprobación.

    Cuando `target` es `channel` o `both`, la solicitud de aprobación es visible en el canal. Solo los aprobadores resueltos pueden usar los botones; otros usuarios reciben una denegación efímera. Las solicitudes de aprobación incluyen el texto del comando, por lo que solo debe habilitar la entrega en canal en canales de confianza. Si el ID del canal no puede derivarse de la clave de sesión, OpenClaw vuelve a la entrega por mensaje directo.

    Discord también renderiza los botones de aprobación compartidos usados por otros canales de chat. El adaptador nativo de Discord añade principalmente el enrutamiento de mensajes directos para aprobadores y la distribución al canal.
    Cuando esos botones están presentes, son la UX principal de aprobación; OpenClaw
    solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique
    que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

    La autenticación del Gateway y la resolución de aprobación siguen el contrato compartido del cliente Gateway (los IDs `plugin:` se resuelven mediante `plugin.approval.resolve`; otros IDs mediante `exec.approval.resolve`). Las aprobaciones caducan después de 30 minutos de forma predeterminada.

    Consulte [Aprobaciones de ejecución](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Herramientas y compuertas de acciones

Las acciones de mensajes de Discord incluyen mensajería, administración de canales, moderación, presencia y acciones de metadatos.

Ejemplos principales:

- mensajería: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reacciones: `react`, `reactions`, `emojiList`
- moderación: `timeout`, `kick`, `ban`
- presencia: `setPresence`

La acción `event-create` acepta un parámetro `image` opcional (URL o ruta de archivo local) para establecer la imagen de portada del evento programado.

Las compuertas de acciones están en `channels.discord.actions.*`.

Comportamiento predeterminado de las compuertas:

| Grupo de acciones                                                                                                                                                         | Predeterminado |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | habilitado     |
| roles                                                                                                                                                                     | deshabilitado  |
| moderation                                                                                                                                                                | deshabilitado  |
| presence                                                                                                                                                                  | deshabilitado  |

## IU de componentes v2

OpenClaw usa componentes v2 de Discord para aprobaciones de ejecución y marcadores entre contextos. Las acciones de mensajes de Discord también pueden aceptar `components` para IU personalizada (avanzado; requiere construir una carga útil de componentes mediante la herramienta de Discord), mientras que `embeds` heredados siguen disponibles pero no se recomiendan.

- `channels.discord.ui.components.accentColor` establece el color de acento usado por los contenedores de componentes de Discord (hex).
- Configúrelo por cuenta con `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` se ignora cuando hay componentes v2 presentes.

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

Discord tiene dos superficies de voz distintas: los **canales de voz** en tiempo real (conversaciones continuas) y los **adjuntos de mensajes de voz** (el formato de vista previa con forma de onda). El Gateway admite ambas.

### Canales de voz

Requisitos:

- Habilite los comandos nativos (`commands.native` o `channels.discord.commands.native`).
- Configure `channels.discord.voice`.
- El bot necesita permisos de Conectar + Hablar en el canal de voz de destino.

Use `/vc join|leave|status` para controlar sesiones. El comando usa el agente predeterminado de la cuenta y sigue las mismas reglas de allowlist y política de grupo que otros comandos de Discord.

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
- La voz está habilitada de forma predeterminada; establezca `channels.discord.voice.enabled=false` para deshabilitarla.
- `voice.daveEncryption` y `voice.decryptionFailureTolerance` se transfieren a las opciones de unión de `@discordjs/voice`.
- Los valores predeterminados de `@discordjs/voice` son `daveEncryption=true` y `decryptionFailureTolerance=24` si no se configuran.
- OpenClaw también vigila los fallos de descifrado de recepción y se recupera automáticamente saliendo y volviendo a entrar al canal de voz tras fallos repetidos en un intervalo corto.
- Si los registros de recepción muestran repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, esto puede deberse al error de recepción ascendente de `@discordjs/voice` rastreado en [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### Mensajes de voz

Los mensajes de voz de Discord muestran una vista previa de forma de onda y requieren audio OGG/Opus. OpenClaw genera la forma de onda automáticamente, pero necesita `ffmpeg` y `ffprobe` en el host del Gateway para inspeccionar y convertir.

- Proporcione una **ruta de archivo local** (las URL se rechazan).
- Omita el contenido de texto (Discord rechaza texto + mensaje de voz en la misma carga útil).
- Se acepta cualquier formato de audio; OpenClaw convierte a OGG/Opus según sea necesario.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="Se usaron intents no permitidos o el bot no ve mensajes del servidor">

    - habilite Message Content Intent
    - habilite Server Members Intent cuando dependa de la resolución de usuario/miembro
    - reinicie el Gateway después de cambiar los intents

  </Accordion>

  <Accordion title="Mensajes del servidor bloqueados inesperadamente">

    - verifique `groupPolicy`
    - verifique la allowlist del servidor en `channels.discord.guilds`
    - si existe el mapa `channels` del servidor, solo se permiten los canales incluidos en la lista
    - verifique el comportamiento de `requireMention` y los patrones de mención

    Comprobaciones útiles:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention es false pero sigue bloqueado">
    Causas comunes:

    - `groupPolicy="allowlist"` sin una allowlist de servidor/canal coincidente
    - `requireMention` configurado en el lugar incorrecto (debe estar bajo `channels.discord.guilds` o en la entrada del canal)
    - remitente bloqueado por la allowlist `users` del servidor/canal

  </Accordion>

  <Accordion title="Los controladores de larga duración agotan el tiempo o duplican respuestas">

    Registros típicos:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Ajuste de presupuesto del listener:

    - cuenta única: `channels.discord.eventQueue.listenerTimeout`
    - varias cuentas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Ajuste de tiempo de espera de ejecución del worker:

    - cuenta única: `channels.discord.inboundWorker.runTimeoutMs`
    - varias cuentas: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - predeterminado: `1800000` (30 minutos); establezca `0` para deshabilitar

    Base recomendada:

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

    Use `eventQueue.listenerTimeout` para una configuración lenta del listener y `inboundWorker.runTimeoutMs`
    solo si quiere una válvula de seguridad independiente para turnos de agente en cola.

  </Accordion>

  <Accordion title="Incompatibilidades en la auditoría de permisos">
    Las comprobaciones de permisos de `channels status --probe` solo funcionan con IDs numéricos de canal.

    Si usa claves slug, la coincidencia en tiempo de ejecución aún puede funcionar, pero el sondeo no puede verificar completamente los permisos.

  </Accordion>

  <Accordion title="Problemas de mensajes directos y emparejamiento">

    - mensajes directos deshabilitados: `channels.discord.dm.enabled=false`
    - política de mensajes directos deshabilitada: `channels.discord.dmPolicy="disabled"` (anterior: `channels.discord.dm.policy`)
    - esperando aprobación de emparejamiento en modo `pairing`

  </Accordion>

  <Accordion title="Bucles de bot a bot">
    De forma predeterminada, los mensajes creados por bots se ignoran.

    Si establece `channels.discord.allowBots=true`, use reglas estrictas de mención y allowlist para evitar comportamientos en bucle.
    Prefiera `channels.discord.allowBots="mentions"` para aceptar solo mensajes de bots que mencionen al bot.

  </Accordion>

  <Accordion title="La STT de voz pierde datos con DecryptionFailed(...)">

    - mantenga OpenClaw actualizado (`openclaw update`) para que esté presente la lógica de recuperación de recepción de voz de Discord
    - confirme `channels.discord.voice.daveEncryption=true` (predeterminado)
    - empiece con `channels.discord.voice.decryptionFailureTolerance=24` (valor predeterminado ascendente) y ajuste solo si es necesario
    - observe los registros para:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si los fallos continúan después de volver a unirse automáticamente, recopile registros y compárelos con [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Indicadores de referencia de configuración

Referencia principal:

- [Referencia de configuración - Discord](/es/gateway/configuration-reference#discord)

Campos de Discord de alta señal:

- inicio/autenticación: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- cola de eventos: `eventQueue.listenerTimeout` (presupuesto del listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker entrante: `inboundWorker.runTimeoutMs`
- respuesta/historial: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias heredado: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medios/reintento: `mediaMaxMb`, `retry`
  - `mediaMaxMb` limita las cargas salientes a Discord (predeterminado: `100MB`)
- acciones: `actions.*`
- presencia: `activity`, `status`, `activityType`, `activityUrl`
- IU: `ui.components.accentColor`
- funciones: `threadBindings`, `bindings[]` de nivel superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Seguridad y operaciones

- Trate los tokens de bot como secretos (`DISCORD_BOT_TOKEN` preferido en entornos supervisados).
- Otorgue los permisos mínimos necesarios de Discord.
- Si el estado o despliegue de comandos está obsoleto, reinicie el Gateway y vuelva a comprobar con `openclaw channels status --probe`.

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Seguridad](/es/gateway/security)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
- [Comandos slash](/es/tools/slash-commands)
