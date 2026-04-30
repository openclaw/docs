---
read_when:
    - Trabajando en funciones del canal de Discord
summary: Estado de soporte, capacidades y configuración del bot de Discord
title: Discord
x-i18n:
    generated_at: "2026-04-30T05:27:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f31af2801e7faf6456d4452a5f43b0e42a067b86b7e562c308fa450a847356
    source_path: channels/discord.md
    workflow: 16
---

Listo para MDs y canales de gremio mediante el Gateway oficial de Discord.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los MDs de Discord usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento nativo de comandos y catálogo de comandos.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y flujo de reparación.
  </Card>
</CardGroup>

## Configuración rápida

Tendrás que crear una nueva aplicación con un bot, agregar el bot a tu servidor y emparejarlo con OpenClaw. Recomendamos agregar tu bot a tu propio servidor privado. Si aún no tienes uno, [crea uno primero](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (elige **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crear una aplicación y un bot de Discord">
    Ve al [Portal para desarrolladores de Discord](https://discord.com/developers/applications) y haz clic en **New Application**. Ponle un nombre como "OpenClaw".

    Haz clic en **Bot** en la barra lateral. Configura **Username** con el nombre que uses para tu agente de OpenClaw.

  </Step>

  <Step title="Habilitar intents privilegiados">
    Aún en la página **Bot**, desplázate hacia abajo hasta **Privileged Gateway Intents** y habilita:

    - **Message Content Intent** (obligatorio)
    - **Server Members Intent** (recomendado; obligatorio para listas de permitidos por rol y coincidencia de nombre a ID)
    - **Presence Intent** (opcional; solo se necesita para actualizaciones de presencia)

  </Step>

  <Step title="Copiar tu token de bot">
    Desplázate de nuevo hacia arriba en la página **Bot** y haz clic en **Reset Token**.

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

    Aparecerá una sección **Bot Permissions** debajo. Habilita al menos:

    **Permisos generales**
      - Ver canales
    **Permisos de texto**
      - Enviar mensajes
      - Leer historial de mensajes
      - Insertar enlaces
      - Adjuntar archivos
      - Agregar reacciones (opcional)

    Este es el conjunto base para canales de texto normales. Si planeas publicar en hilos de Discord, incluidos flujos de trabajo de canales de foro o multimedia que crean o continúan un hilo, habilita también **Send Messages in Threads**.
    Copia la URL generada en la parte inferior, pégala en tu navegador, selecciona tu servidor y haz clic en **Continue** para conectar. Ahora deberías ver tu bot en el servidor de Discord.

  </Step>

  <Step title="Habilitar el modo de desarrollador y recopilar tus ID">
    De vuelta en la app de Discord, debes habilitar el modo de desarrollador para poder copiar ID internos.

    1. Haz clic en **User Settings** (icono de engranaje junto a tu avatar) → **Advanced** → activa **Developer Mode**
    2. Haz clic derecho en el **icono de tu servidor** en la barra lateral → **Copy Server ID**
    3. Haz clic derecho en tu **propio avatar** → **Copy User ID**

    Guarda tu **Server ID** y **User ID** junto con tu Bot Token; enviarás los tres a OpenClaw en el siguiente paso.

  </Step>

  <Step title="Permitir MDs de miembros del servidor">
    Para que el emparejamiento funcione, Discord debe permitir que tu bot te envíe MDs. Haz clic derecho en el **icono de tu servidor** → **Privacy Settings** → activa **Direct Messages**.

    Esto permite que los miembros del servidor (incluidos los bots) te envíen MDs. Mantén esto habilitado si quieres usar MDs de Discord con OpenClaw. Si solo planeas usar canales de gremio, puedes deshabilitar los MDs después del emparejamiento.

  </Step>

  <Step title="Configurar tu token de bot de forma segura (no lo envíes por chat)">
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

    Si OpenClaw ya se está ejecutando como servicio en segundo plano, reinícialo mediante la app para Mac de OpenClaw o deteniendo y reiniciando el proceso `openclaw gateway run`.
    Para instalaciones de servicio gestionado, ejecuta `openclaw gateway install` desde una shell donde `DISCORD_BOT_TOKEN` esté presente, o almacena la variable en `~/.openclaw/.env`, para que el servicio pueda resolver la SecretRef de entorno después de reiniciar.
    Si tu host está bloqueado o limitado por frecuencia por la búsqueda de aplicación de inicio de Discord, configura el ID de aplicación/cliente de Discord desde el Portal para desarrolladores para que el inicio pueda omitir esa llamada REST. Usa `channels.discord.applicationId` para la cuenta predeterminada, o `channels.discord.accounts.<accountId>.applicationId` cuando ejecutes varios bots de Discord.

  </Step>

  <Step title="Configurar OpenClaw y emparejar">

    <Tabs>
      <Tab title="Preguntar a tu agente">
        Chatea con tu agente de OpenClaw en cualquier canal existente (por ejemplo, Telegram) y díselo. Si Discord es tu primer canal, usa en su lugar la pestaña CLI / configuración.

        > "Ya configuré mi token de bot de Discord en la configuración. Termina la configuración de Discord con User ID `<user_id>` y Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / configuración">
        Si prefieres configuración basada en archivos, configura:

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

        Para configuración con scripts o remota, escribe el mismo bloque JSON5 con `openclaw config patch --file ./discord.patch.json5 --dry-run` y luego vuelve a ejecutarlo sin `--dry-run`. Se admiten valores `token` en texto sin formato. También se admiten valores SecretRef para `channels.discord.token` en proveedores env/file/exec. Consulta [Gestión de secretos](/es/gateway/secrets).

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

  <Step title="Aprobar el primer emparejamiento por MD">
    Espera hasta que el gateway esté en ejecución y luego envía un MD a tu bot en Discord. Responderá con un código de emparejamiento.

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

    Ahora deberías poder chatear con tu agente en Discord mediante MD.

  </Step>
</Steps>

<Note>
La resolución de tokens tiene en cuenta la cuenta. Los valores de token de configuración prevalecen sobre la alternativa de entorno. `DISCORD_BOT_TOKEN` solo se usa para la cuenta predeterminada.
Si dos cuentas de Discord habilitadas se resuelven al mismo token de bot, OpenClaw inicia solo un monitor de gateway para ese token. Un token procedente de la configuración prevalece sobre la alternativa de entorno predeterminada; de lo contrario, la primera cuenta habilitada prevalece y la cuenta duplicada se informa como deshabilitada.
Para llamadas salientes avanzadas (acciones de herramienta/canal de mensajes), se usa un `token` explícito por llamada para esa llamada. Esto se aplica a acciones de envío y de estilo lectura/sondeo (por ejemplo, leer/buscar/obtener/hilo/pines/permisos). La configuración de política/reintento de la cuenta sigue proviniendo de la cuenta seleccionada en la instantánea de runtime activa.
</Note>

## Recomendado: Configurar un espacio de trabajo de gremio

Una vez que los MDs funcionen, puedes configurar tu servidor de Discord como un espacio de trabajo completo donde cada canal obtiene su propia sesión de agente con su propio contexto. Esto se recomienda para servidores privados donde solo están tú y tu bot.

<Steps>
  <Step title="Agregar tu servidor a la lista de permitidos de gremios">
    Esto permite que tu agente responda en cualquier canal de tu servidor, no solo en MDs.

    <Tabs>
      <Tab title="Preguntar a tu agente">
        > "Agrega mi Server ID de Discord `<server_id>` a la lista de permitidos de gremios"
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
    De forma predeterminada, tu agente solo responde en canales de gremio cuando se lo @menciona. Para un servidor privado, probablemente quieras que responda a todos los mensajes.

    En los canales de gremio, las respuestas finales normales del asistente permanecen privadas de forma predeterminada. La salida visible de Discord debe enviarse explícitamente con la herramienta `message`, para que el agente pueda permanecer en segundo plano de forma predeterminada y solo publicar cuando decida que una respuesta en el canal es útil.

    <Tabs>
      <Tab title="Preguntar a tu agente">
        > "Permite que mi agente responda en este servidor sin tener que ser @mencionado"
      </Tab>
      <Tab title="Configuración">
        Configura `requireMention: false` en tu configuración de gremio:

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

        Para restaurar las respuestas finales automáticas heredadas en salas de grupo/canal, configura `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planificar la memoria en canales de gremio">
    De forma predeterminada, la memoria a largo plazo (MEMORY.md) solo se carga en sesiones de MD. Los canales de gremio no cargan automáticamente MEMORY.md.

    <Tabs>
      <Tab title="Preguntar a tu agente">
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

- Gateway posee la conexión de Discord.
- El enrutamiento de respuestas es determinista: las respuestas entrantes de Discord vuelven a Discord.
- Los metadatos de guild/canal de Discord se agregan al prompt del modelo como contexto no confiable, no como prefijo de respuesta visible para el usuario. Si un modelo copia ese sobre de vuelta, OpenClaw elimina los metadatos copiados de las respuestas salientes y del contexto de reproducción futuro.
- De forma predeterminada (`session.dmScope=main`), los chats directos comparten la sesión principal del agente (`agent:main:main`).
- Los canales de guild son claves de sesión aisladas (`agent:<agentId>:discord:channel:<channelId>`).
- Los DM de grupo se ignoran de forma predeterminada (`channels.discord.dm.groupEnabled=false`).
- Los comandos de barra nativos se ejecutan en sesiones de comando aisladas (`agent:<agentId>:discord:slash:<userId>`), aunque siguen llevando `CommandTargetSessionKey` a la sesión de conversación enrutada.
- La entrega de anuncios de cron/heartbeat solo de texto a Discord usa una vez la respuesta final visible para el asistente. Los medios y las cargas de componentes estructurados siguen siendo de varios mensajes cuando el agente emite varias cargas entregables.

## Canales de foro

Los canales de foro y medios de Discord solo aceptan publicaciones en hilos. OpenClaw admite dos formas de crearlas:

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

Los foros padre no aceptan componentes de Discord. Si necesitas componentes, envía al hilo mismo (`channel:<threadId>`).

## Componentes interactivos

OpenClaw admite contenedores de componentes v2 de Discord para mensajes del agente. Usa la herramienta de mensajes con una carga `components`. Los resultados de interacción se enrutan de vuelta al agente como mensajes entrantes normales y siguen la configuración existente de Discord `replyToMode`.

Bloques admitidos:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Las filas de acciones permiten hasta 5 botones o un solo menú de selección
- Tipos de selección: `string`, `user`, `role`, `mentionable`, `channel`

De forma predeterminada, los componentes son de un solo uso. Define `components.reusable=true` para permitir que botones, selectores y formularios se usen varias veces hasta que expiren.

Para restringir quién puede hacer clic en un botón, define `allowedUsers` en ese botón (ID de usuario de Discord, etiquetas o `*`). Cuando está configurado, los usuarios sin coincidencia reciben una denegación efímera.

Los comandos de barra `/model` y `/models` abren un selector de modelos interactivo con menús desplegables de proveedor, modelo y runtime compatible, además de un paso Enviar. `/models add` está obsoleto y ahora devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat. La respuesta del selector es efímera y solo el usuario que la invoca puede usarla.

Archivos adjuntos:

- Los bloques `file` deben apuntar a una referencia de adjunto (`attachment://<filename>`)
- Proporciona el adjunto mediante `media`/`path`/`filePath` (un solo archivo); usa `media-gallery` para varios archivos
- Usa `filename` para sobrescribir el nombre de subida cuando deba coincidir con la referencia del adjunto

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

    Si la política de DM no está abierta, los usuarios desconocidos se bloquean (o se les solicita el emparejamiento en modo `pairing`).

    Precedencia de varias cuentas:

    - `channels.discord.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Para una cuenta, `allowFrom` tiene precedencia sobre el `dm.allowFrom` heredado.
    - Las cuentas con nombre heredan `channels.discord.allowFrom` cuando su propio `allowFrom` y el `dm.allowFrom` heredado no están definidos.
    - Las cuentas con nombre no heredan `channels.discord.accounts.default.allowFrom`.

    Los `channels.discord.dm.policy` y `channels.discord.dm.allowFrom` heredados todavía se leen por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    Formato de destino DM para entrega:

    - `user:<id>`
    - mención `<@id>`

    Los ID numéricos sin prefijo normalmente se resuelven como ID de canal cuando hay un canal predeterminado activo, pero los ID enumerados en el `allowFrom` de DM efectivo de la cuenta se tratan como destinos de DM de usuario por compatibilidad.

  </Tab>

  <Tab title="Guild policy">
    El manejo de guilds se controla mediante `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La línea base segura cuando existe `channels.discord` es `allowlist`.

    Comportamiento de `allowlist`:

    - la guild debe coincidir con `channels.discord.guilds` (se prefiere `id`, se acepta slug)
    - listas de permitidos opcionales de remitentes: `users` (se recomiendan ID estables) y `roles` (solo ID de rol); si cualquiera está configurada, los remitentes se permiten cuando coinciden con `users` O `roles`
    - la coincidencia directa por nombre/etiqueta está desactivada de forma predeterminada; habilita `channels.discord.dangerouslyAllowNameMatching: true` solo como modo de compatibilidad de emergencia
    - se admiten nombres/etiquetas para `users`, pero los ID son más seguros; `openclaw security audit` advierte cuando se usan entradas de nombre/etiqueta
    - si una guild tiene `channels` configurado, se deniegan los canales no enumerados
    - si una guild no tiene bloque `channels`, se permiten todos los canales de esa guild en la lista de permitidos

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
    Los mensajes de guild requieren mención de forma predeterminada.

    La detección de menciones incluye:

    - mención explícita al bot
    - patrones de mención configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de respuesta al bot en casos admitidos

    `requireMention` se configura por guild/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` descarta opcionalmente los mensajes que mencionan a otro usuario/rol pero no al bot (excluyendo @everyone/@here).

    DM de grupo:

    - predeterminado: ignorados (`dm.groupEnabled=false`)
    - lista de permitidos opcional mediante `dm.groupChannels` (ID de canal o slugs)

  </Tab>
</Tabs>

### Enrutamiento de agentes basado en roles

Usa `bindings[].match.roles` para enrutar miembros de guilds de Discord a distintos agentes por ID de rol. Los bindings basados en roles aceptan solo ID de rol y se evalúan después de los bindings de par o padre-par y antes de los bindings solo de guild. Si un binding también define otros campos de coincidencia (por ejemplo `peer` + `guildId` + `roles`), todos los campos configurados deben coincidir.

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

- `commands.native` tiene el valor predeterminado `"auto"` y está habilitado para Discord.
- Sobrescritura por canal: `channels.discord.commands.native`.
- `commands.native=false` borra explícitamente comandos nativos de Discord registrados anteriormente.
- La autorización de comandos nativos usa las mismas listas de permitidos/políticas de Discord que el manejo normal de mensajes.
- Los comandos aún pueden ser visibles en la interfaz de Discord para usuarios que no están autorizados; la ejecución sigue aplicando la autorización de OpenClaw y devuelve "not authorized".

Consulta [Comandos de barra](/es/tools/slash-commands) para ver el catálogo y comportamiento de comandos.

Configuración predeterminada de comandos de barra:

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

    Nota: `off` desactiva el encadenamiento implícito de respuestas. Las etiquetas explícitas `[[reply_to_*]]` se siguen respetando.
    `first` siempre adjunta la referencia de respuesta nativa implícita al primer mensaje saliente de Discord del turno.
    `batched` solo adjunta la referencia de respuesta nativa implícita de Discord cuando el turno entrante fue un lote con debounce de varios mensajes. Esto es útil cuando quieres respuestas nativas principalmente para chats de ráfagas ambiguas, no para cada turno de un solo mensaje.

    Los ID de mensaje se exponen en contexto/historial para que los agentes puedan apuntar a mensajes específicos.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw puede transmitir respuestas en borrador enviando un mensaje temporal y editándolo a medida que llega el texto. `channels.discord.streaming` acepta `off` (predeterminado) | `partial` | `block` | `progress`. `progress` se asigna a `partial` en Discord; `streamMode` es un alias heredado y se migra automáticamente.

    El valor predeterminado se mantiene en `off` porque las ediciones de vista previa de Discord alcanzan rápidamente los límites de frecuencia cuando varios bots o gateways comparten una cuenta.

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

    - `partial` edita un solo mensaje de vista previa a medida que llegan tokens.
    - `block` emite fragmentos del tamaño de un borrador (usa `draftChunk` para ajustar el tamaño y los puntos de corte, limitado a `textChunkLimit`).
    - Los finales con medios, error y respuesta explícita cancelan las ediciones de vista previa pendientes.
    - `streaming.preview.toolProgress` (predeterminado `true`) controla si las actualizaciones de herramientas/progreso reutilizan el mensaje de vista previa.

    La transmisión de vista previa es solo de texto; las respuestas con medios recurren a la entrega normal. Cuando la transmisión `block` está habilitada explícitamente, OpenClaw omite la transmisión de vista previa para evitar la doble transmisión.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Contexto de historial de guild:

    - `channels.discord.historyLimit` predeterminado `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desactiva

    Controles de historial de DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamiento de los hilos:

    - Los hilos de Discord se enrutan como sesiones de canal y heredan la configuración del canal principal salvo que se sobrescriba.
    - Las sesiones de hilo heredan la selección de `/model` a nivel de sesión del canal principal como respaldo solo de modelo; las selecciones de `/model` locales del hilo siguen teniendo prioridad y el historial de transcripción principal no se copia a menos que la herencia de transcripción esté habilitada.
    - `channels.discord.thread.inheritParent` (predeterminado `false`) hace que los nuevos hilos automáticos se inicialicen desde la transcripción principal. Las sobrescrituras por cuenta se encuentran en `channels.discord.accounts.<id>.thread.inheritParent`.
    - Las reacciones de herramientas de mensaje pueden resolver destinos de DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` se preserva durante el respaldo de activación en la etapa de respuesta.

    Los temas de canal se inyectan como contexto **no confiable**. Las listas de permitidos controlan quién puede activar al agente, no son un límite completo de redacción de contexto suplementario.

  </Accordion>

  <Accordion title="Sesiones vinculadas a hilos para subagentes">
    Discord puede vincular un hilo a un destino de sesión para que los mensajes de seguimiento en ese hilo sigan enrutándose a la misma sesión (incluidas las sesiones de subagentes).

    Comandos:

    - `/focus <target>` vincula el hilo actual/nuevo a un destino de subagente/sesión
    - `/unfocus` elimina la vinculación del hilo actual
    - `/agents` muestra ejecuciones activas y el estado de vinculación
    - `/session idle <duration|off>` inspecciona/actualiza la eliminación automática del foco por inactividad para vinculaciones enfocadas
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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Notas:

    - `session.threadBindings.*` establece valores predeterminados globales.
    - `channels.discord.threadBindings.*` sobrescribe el comportamiento de Discord.
    - `spawnSubagentSessions` debe ser true para crear/vincular automáticamente hilos para `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` debe ser true para crear/vincular automáticamente hilos para ACP (`/acp spawn ... --thread ...` o `sessions_spawn({ runtime: "acp", thread: true })`).
    - Si las vinculaciones de hilos están deshabilitadas para una cuenta, `/focus` y las operaciones relacionadas de vinculación de hilos no están disponibles.

    Consulta [Subagentes](/es/tools/subagents), [Agentes ACP](/es/tools/acp-agents) y [Referencia de configuración](/es/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Vinculaciones persistentes de canales ACP">
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

    - `/acp spawn codex --bind here` vincula el canal o hilo actual in situ y mantiene los mensajes futuros en la misma sesión ACP. Los mensajes de hilo heredan la vinculación del canal principal.
    - En un canal o hilo vinculado, `/new` y `/reset` restablecen la misma sesión ACP in situ. Las vinculaciones temporales de hilos pueden sobrescribir la resolución de destino mientras estén activas.
    - `spawnAcpSessions` solo se requiere cuando OpenClaw necesita crear/vincular un hilo secundario mediante `--thread auto|here`.

    Consulta [Agentes ACP](/es/tools/acp-agents) para ver detalles del comportamiento de vinculación.

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
    - respaldo del emoji de identidad del agente (`agents.list[].identity.emoji`, o "👀" en caso contrario)

    Notas:

    - Discord acepta emoji Unicode o nombres de emoji personalizados.
    - Usa `""` para desactivar la reacción para un canal o una cuenta.

  </Accordion>

  <Accordion title="Escrituras de configuración">
    Las escrituras de configuración iniciadas desde el canal están habilitadas de forma predeterminada.

    Esto afecta los flujos de `/config set|unset` (cuando las funciones de comandos están habilitadas).

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

  <Accordion title="Proxy del Gateway">
    Enruta el tráfico WebSocket del Gateway de Discord y las búsquedas REST de inicio (ID de aplicación + resolución de lista de permitidos) a través de un proxy HTTP(S) con `channels.discord.proxy`.

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
    Habilita la resolución de PluralKit para asignar mensajes reenviados por proxy a la identidad del miembro del sistema:

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
    - las búsquedas usan el ID del mensaje original y están restringidas por ventana temporal
    - si la búsqueda falla, los mensajes reenviados por proxy se tratan como mensajes de bot y se descartan a menos que `allowBots=true`

  </Accordion>

  <Accordion title="Configuración de presencia">
    Las actualizaciones de presencia se aplican cuando estableces un campo de estado o actividad, o cuando habilitas la presencia automática.

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
    - 4: Personalizada (usa el texto de actividad como el estado; el emoji es opcional)
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

    La presencia automática asigna la disponibilidad del entorno de ejecución al estado de Discord: saludable => online, degradado o desconocido => idle, agotado o no disponible => dnd. Sobrescrituras de texto opcionales:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (admite el marcador de posición `{reason}`)

  </Accordion>

  <Accordion title="Aprobaciones en Discord">
    Discord admite la gestión de aprobaciones basada en botones en mensajes directos y, opcionalmente, puede publicar solicitudes de aprobación en el canal de origen.

    Ruta de configuración:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando sea posible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord habilita automáticamente las aprobaciones nativas de ejecución cuando `enabled` no está definido o es `"auto"` y se puede resolver al menos un aprobador, ya sea desde `execApprovals.approvers` o desde `commands.ownerAllowFrom`. Discord no infiere aprobadores de ejecución desde `allowFrom` de canal, `dm.allowFrom` heredado ni `defaultTo` de mensaje directo. Establece `enabled: false` para deshabilitar Discord explícitamente como cliente de aprobación nativo.

    Para comandos de grupo sensibles exclusivos de propietarios como `/diagnostics` y `/export-trajectory`, OpenClaw envía solicitudes de aprobación y resultados finales de forma privada. Primero intenta enviar un DM de Discord cuando el propietario que invoca tiene una ruta de propietario de Discord; si no está disponible, recurre a la primera ruta de propietario disponible desde `commands.ownerAllowFrom`, como Telegram.

    Cuando `target` es `channel` o `both`, la solicitud de aprobación es visible en el canal. Solo los aprobadores resueltos pueden usar los botones; otros usuarios reciben una denegación efímera. Las solicitudes de aprobación incluyen el texto del comando, así que habilita la entrega en canal solo en canales de confianza. Si el ID del canal no se puede derivar de la clave de sesión, OpenClaw recurre a la entrega por DM.

    Discord también renderiza los botones de aprobación compartidos que usan otros canales de chat. El adaptador nativo de Discord principalmente añade enrutamiento por DM a aprobadores y distribución a canales.
    Cuando esos botones están presentes, son la experiencia principal de aprobación; OpenClaw
    solo debe incluir un comando `/approve` manual cuando el resultado de la herramienta dice
    que las aprobaciones de chat no están disponibles o que la aprobación manual es la única ruta.
    Si el entorno de ejecución de aprobación nativa de Discord no está activo, OpenClaw mantiene visible la
    solicitud local determinista `/approve <id> <decision>`. Si el
    entorno de ejecución está activo pero no se puede entregar una tarjeta nativa a ningún destino,
    OpenClaw envía un aviso de respaldo en el mismo chat con el comando `/approve`
    exacto de la aprobación pendiente.

    La autenticación del Gateway y la resolución de aprobaciones siguen el contrato compartido del cliente Gateway (los ID `plugin:` se resuelven mediante `plugin.approval.resolve`; otros ID mediante `exec.approval.resolve`). Las aprobaciones caducan después de 30 minutos de forma predeterminada.

    Consulta [Aprobaciones de ejecución](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Herramientas y controles de acciones

Las acciones de mensajes de Discord incluyen mensajería, administración de canales, moderación, presencia y acciones de metadatos.

Ejemplos básicos:

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

## UI de Components v2

OpenClaw usa Discord components v2 para aprobaciones de ejecución y marcadores entre contextos. Las acciones de mensajes de Discord también pueden aceptar `components` para UI personalizada (avanzado; requiere construir una carga de componente mediante la herramienta discord), mientras que los `embeds` heredados siguen disponibles pero no se recomiendan.

- `channels.discord.ui.components.accentColor` establece el color de acento usado por los contenedores de componentes de Discord (hex).
- Configúralo por cuenta con `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` se ignoran cuando components v2 están presentes.

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

Discord tiene dos superficies de voz distintas: **canales de voz** en tiempo real (conversaciones continuas) y **adjuntos de mensajes de voz** (el formato de vista previa con forma de onda). El Gateway admite ambas.

### Canales de voz

Lista de configuración:

1. Habilita Message Content Intent en Discord Developer Portal.
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

- `voice.tts` anula `messages.tts` solo para la reproducción de voz.
- `voice.model` anula el LLM usado solo para respuestas de canales de voz de Discord. Déjalo sin definir para heredar el modelo del agente enrutado.
- STT usa `tools.media.audio`; `voice.model` no afecta a la transcripción.
- Los turnos de transcripción de voz derivan el estado de propietario de `allowFrom` de Discord (o `dm.allowFrom`); los hablantes que no son propietarios no pueden acceder a herramientas solo para propietarios (por ejemplo `gateway` y `cron`).
- La voz está habilitada de forma predeterminada; establece `channels.discord.voice.enabled=false` para deshabilitar el runtime de voz y el intent de Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` puede anular explícitamente la suscripción al intent de estado de voz. Déjalo sin definir para que el intent siga `voice.enabled`.
- `voice.daveEncryption` y `voice.decryptionFailureTolerance` se pasan a las opciones de unión de `@discordjs/voice`.
- Los valores predeterminados de `@discordjs/voice` son `daveEncryption=true` y `decryptionFailureTolerance=24` si no se definen.
- OpenClaw también vigila los fallos de descifrado de recepción y se recupera automáticamente saliendo y volviendo a unirse al canal de voz tras fallos repetidos en una ventana corta.
- Si los registros de recepción muestran repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` después de actualizar, recopila un informe de dependencias y registros. La línea incluida de `@discordjs/voice` incorpora la corrección de padding upstream del PR #11449 de discord.js, que cerró el issue #11419 de discord.js.

Pipeline de canal de voz:

- La captura PCM de Discord se convierte en un archivo temporal WAV.
- `tools.media.audio` gestiona STT, por ejemplo `openai/gpt-4o-mini-transcribe`.
- La transcripción se envía mediante el ingreso y el enrutamiento normales de Discord.
- `voice.model`, cuando está definido, anula solo el LLM de respuesta para este turno de canal de voz.
- `voice.tts` se fusiona sobre `messages.tts`; el audio resultante se reproduce en el canal unido.

Las credenciales se resuelven por componente: autenticación de ruta LLM para `voice.model`, autenticación STT para `tools.media.audio` y autenticación TTS para `messages.tts`/`voice.tts`.

### Mensajes de voz

Los mensajes de voz de Discord muestran una vista previa con forma de onda y requieren audio OGG/Opus. OpenClaw genera la forma de onda automáticamente, pero necesita `ffmpeg` y `ffprobe` en el host del Gateway para inspeccionar y convertir.

- Proporciona una **ruta de archivo local** (las URL se rechazan).
- Omite el contenido de texto (Discord rechaza texto + mensaje de voz en la misma carga).
- Se acepta cualquier formato de audio; OpenClaw lo convierte a OGG/Opus según sea necesario.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="Intents no permitidos usados o el bot no ve mensajes de servidores">

    - habilita Message Content Intent
    - habilita Server Members Intent cuando dependas de la resolución de usuarios/miembros
    - reinicia el gateway después de cambiar intents

  </Accordion>

  <Accordion title="Mensajes de servidor bloqueados inesperadamente">

    - verifica `groupPolicy`
    - verifica la lista de permitidos de servidor en `channels.discord.guilds`
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
    - `requireMention` configurado en el lugar incorrecto (debe estar bajo `channels.discord.guilds` o en la entrada del canal)
    - remitente bloqueado por la lista de permitidos `users` del servidor/canal

  </Accordion>

  <Accordion title="Turnos largos de Discord o respuestas duplicadas">

    Registros típicos:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Controles de cola del Gateway de Discord:

    - cuenta única: `channels.discord.eventQueue.listenerTimeout`
    - varias cuentas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - esto solo controla el trabajo del listener del Gateway de Discord, no la duración del turno del agente

    Discord no aplica un timeout propio del canal a los turnos de agente en cola. Los listeners de mensajes hacen la entrega de inmediato, y las ejecuciones de Discord en cola conservan el orden por sesión hasta que el ciclo de vida de sesión/herramienta/runtime completa o aborta el trabajo.

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

  <Accordion title="Advertencias de timeout en búsqueda de metadatos del Gateway">
    OpenClaw obtiene metadatos de Discord `/gateway/bot` antes de conectarse. Los fallos transitorios recurren a la URL predeterminada del Gateway de Discord y se limitan por tasa en los registros.

    Controles de timeout de metadatos:

    - cuenta única: `channels.discord.gatewayInfoTimeoutMs`
    - varias cuentas: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - respaldo de env cuando la configuración no está definida: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - predeterminado: `30000` (30 segundos), máximo: `120000`

  </Accordion>

  <Accordion title="Discrepancias en auditoría de permisos">
    Las comprobaciones de permisos de `channels status --probe` solo funcionan para ID de canal numéricos.

    Si usas claves slug, la coincidencia en runtime todavía puede funcionar, pero probe no puede verificar completamente los permisos.

  </Accordion>

  <Accordion title="Problemas de DM y emparejamiento">

    - DM deshabilitado: `channels.discord.dm.enabled=false`
    - política de DM deshabilitada: `channels.discord.dmPolicy="disabled"` (heredado: `channels.discord.dm.policy`)
    - esperando aprobación de emparejamiento en modo `pairing`

  </Accordion>

  <Accordion title="Bucles de bot a bot">
    De forma predeterminada se ignoran los mensajes creados por bots.

    Si estableces `channels.discord.allowBots=true`, usa reglas estrictas de mención y lista de permitidos para evitar comportamientos de bucle.
    Prefiere `channels.discord.allowBots="mentions"` para aceptar solo mensajes de bots que mencionen al bot.

  </Accordion>

  <Accordion title="STT de voz se pierde con DecryptionFailed(...)">

    - mantén OpenClaw actualizado (`openclaw update`) para que esté presente la lógica de recuperación de recepción de voz de Discord
    - confirma `channels.discord.voice.daveEncryption=true` (predeterminado)
    - empieza con `channels.discord.voice.decryptionFailureTolerance=24` (predeterminado upstream) y ajusta solo si es necesario
    - vigila los registros para:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si los fallos continúan después de la reunión automática, recopila registros y compáralos con el historial upstream de recepción de DAVE en [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) y [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referencia de configuración

Referencia principal: [Referencia de configuración - Discord](/es/gateway/config-channels#discord).

<Accordion title="Campos de Discord de alta señal">

- inicio/autenticación: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- cola de eventos: `eventQueue.listenerTimeout` (presupuesto del listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- metadatos del Gateway: `gatewayInfoTimeoutMs`
- respuesta/historial: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias heredado: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medios/reintento: `mediaMaxMb` (limita subidas salientes a Discord, predeterminado `100MB`), `retry`
- acciones: `actions.*`
- presencia: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funciones: `threadBindings`, `bindings[]` de nivel superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Seguridad y operaciones

- Trata los tokens de bot como secretos (se prefiere `DISCORD_BOT_TOKEN` en entornos supervisados).
- Concede permisos de Discord de privilegio mínimo.
- Si el despliegue/estado de comandos está obsoleto, reinicia el Gateway y vuelve a comprobar con `openclaw channels status --probe`.

## Relacionado

<CardGroup cols={2}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Discord con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de chats grupales y listas de permitidos.
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
  <Card title="Comandos de barra diagonal" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento nativo de comandos.
  </Card>
</CardGroup>
