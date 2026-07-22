---
read_when:
    - Quieres conectar un bot de Feishu/Lark
    - Está configurando el canal de Feishu
summary: Descripción general, funciones y configuración del bot de Feishu
title: Feishu
x-i18n:
    generated_at: "2026-07-22T10:25:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e7c4cbb704ce266b7c7b0f6e160c36c873050fee8d5808965e15b56ad637f28
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw se conecta a Feishu/Lark (la plataforma de colaboración todo en uno) mediante el Plugin oficial `@openclaw/feishu`: mensajes directos al bot, chats grupales, respuestas en tarjetas mediante streaming y herramientas de documentos, wikis, Drive y Bitable de Feishu.

**Estado:** listo para producción en mensajes directos al bot y chats grupales. WebSocket es el transporte de eventos predeterminado (no se necesita una URL pública); el modo webhook es opcional.

## Inicio rápido

<Note>
Requiere OpenClaw 2026.5.29 o posterior. Ejecute `openclaw --version` para comprobarlo. Actualice con `openclaw update`.
</Note>

<Steps>
  <Step title="Ejecutar el asistente de configuración del canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Esto instala el Plugin `@openclaw/feishu` si falta y, a continuación, guía el proceso de configuración:

- **Configuración manual**: pegue un App ID y un App Secret de Feishu Open Platform (`https://open.feishu.cn`) o Lark Developer (`https://open.larksuite.com`).
- **Configuración mediante QR**: escanee un código QR en la aplicación Feishu para crear un bot automáticamente. Este flujo restringe los mensajes directos a su propia cuenta (`dmPolicy: "allowlist"` con su `open_id`).

El asistente también solicita el dominio de la API (Feishu o Lark) y la política de grupos. Si la aplicación móvil nacional de Feishu no reacciona al código QR, vuelva a ejecutar la configuración y elija la configuración manual.
</Step>

  <Step title="Una vez completada la configuración, reiniciar el Gateway para aplicar los cambios">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Durabilidad de la entrada

OpenClaw pone de forma duradera en cola los sobres autenticados `im.message.receive_v1` y `drive.notice.comment_add_v1` antes de enviarlos al agente. Los eventos pendientes o reintentables sobreviven al reinicio del Gateway, permanecen serializados por chat o documento y utilizan el ID de evento de Feishu para evitar entradas duplicadas en la cola mientras exista el registro de finalización activo o conservado.

Si un evento de WebSocket no puede persistirse tras un número limitado de reintentos, OpenClaw cierra ese socket y fuerza una nueva conexión autenticada, en lugar de continuar después de un turno no confirmado. Otros tipos de eventos de Feishu, incluidas las reacciones y las invitaciones a reuniones de VC, utilizan sus rutas de eventos normales y no reciben esta garantía de cola duradera.

## Control de acceso

### Mensajes directos

Configure `channels.feishu.dmPolicy` (valor predeterminado: `pairing`) para controlar quién puede enviar mensajes directos al bot:

| Valor         | Comportamiento                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Los usuarios desconocidos reciben un código de emparejamiento; apruébelo mediante la CLI                                                         |
| `"allowlist"` | Solo pueden chatear los usuarios incluidos en `allowFrom`                                                                     |
| `"open"`      | Mensajes directos públicos; la validación de la configuración requiere que `allowFrom` incluya `"*"`. Las entradas sin comodín siguen restringiendo el acceso |

**Aprobar una solicitud de emparejamiento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chats grupales

**Política de grupos** (`channels.feishu.groupPolicy`, valor predeterminado: `allowlist`):

| Valor         | Comportamiento                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Responder a todos los mensajes de los grupos                                                            |
| `"allowlist"` | Responder solo a los grupos incluidos en `groupAllowFrom` o configurados explícitamente en `groups.<chat_id>` |
| `"disabled"`  | Desactivar todos los mensajes grupales; las entradas explícitas de `groups.<chat_id>` no anulan esta opción         |

**Requisito de mención** (`channels.feishu.requireMention`):

- Valor predeterminado: se requiere una @mención, excepto cuando la política de grupos efectiva es `"open"`; en ese caso, el valor predeterminado es `false` para que los mensajes que no pueden incluir menciones (por ejemplo, imágenes) lleguen igualmente al agente.
- Establezca explícitamente `true` o `false` para anularlo; anulación por grupo: `channels.feishu.groups.<chat_id>.requireMention`.
- Las menciones `@all` y `@_all`, que son solo de difusión, no se tratan como menciones al bot. Un mensaje que menciona tanto `@all` como directamente al bot sigue contando como una mención al bot.

## Ejemplos de configuración de grupos

### Permitir todos los grupos sin requerir @mención

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention tiene el valor predeterminado false con "open"
    },
  },
}
```

### Permitir todos los grupos, pero seguir requiriendo @mención

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Permitir solo grupos específicos

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Los ID de grupo tienen este aspecto: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

En el modo `allowlist`, también se puede admitir un grupo añadiendo una entrada explícita `groups.<chat_id>`. Las entradas explícitas no anulan `groupPolicy: "disabled"`. Los valores predeterminados con comodín en `groups.*` configuran los grupos coincidentes, pero no los admiten por sí solos.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### Restringir los remitentes dentro de un grupo

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Los open_id de usuario tienen este aspecto: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` establece la misma lista de remitentes permitidos para todos los grupos; un `allowFrom` por grupo tiene prioridad.

### Mensajes creados por bots

Feishu ignora de forma predeterminada los mensajes creados por otros bots. Para permitir conversaciones grupales entre bots, conceda a la aplicación los ámbitos `im:message.group_at_msg.include_bot:readonly` y `im:message:readonly` y, a continuación, establezca `allowBots`:

```json5
{
  channels: {
    feishu: {
      allowBots: true,
    },
  },
}
```

Feishu solo entrega eventos grupales creados por bots cuando otro bot menciona a este bot. Se siguen aplicando la política de grupos, las listas de remitentes permitidos y los requisitos de mención existentes. OpenClaw descarta los mensajes creados por sí mismo, menciona al bot homólogo en cada respuesta de texto o tarjeta y aplica la protección compartida [`channels.defaults.botLoopProtection`](/es/channels/bot-loop-protection).

<a id="get-groupuser-ids"></a>

## Obtener los ID de grupos y usuarios

### ID de grupo (`chat_id`, formato: `oc_xxx`)

Abra el grupo en Feishu/Lark, haga clic en el icono de menú de la esquina superior derecha y vaya a **Settings**. El ID del grupo (`chat_id`) aparece en la página de configuración.

![Obtener el ID del grupo](/images/feishu-get-group-id.png)

### ID de usuario (`open_id`, formato: `ou_xxx`)

Inicie el Gateway, envíe un mensaje directo al bot y consulte los registros:

```bash
openclaw logs --follow
```

Busque `open_id` en la salida del registro. También puede consultar las solicitudes de emparejamiento pendientes:

```bash
openclaw pairing list feishu
```

## Comandos habituales

| Comando   | Descripción                 |
| --------- | --------------------------- |
| `/status` | Mostrar el estado del bot             |
| `/reset`  | Restablecer la sesión actual   |
| `/model`  | Mostrar o cambiar el modelo de IA |

<Note>
Feishu/Lark no admite menús nativos de comandos con barra, por lo que deben enviarse como mensajes de texto sin formato.
</Note>

## Solución de problemas

### El bot no responde en los chats grupales

1. Asegúrese de que el bot se haya añadido al grupo
2. Asegúrese de @mencionar al bot (es obligatorio de forma predeterminada)
3. Compruebe que `groupPolicy` no sea `"disabled"`
4. Consulte los registros: `openclaw logs --follow`

### El bot no recibe mensajes

1. Asegúrese de que el bot esté publicado y aprobado en Feishu Open Platform / Lark Developer
2. Asegúrese de que la suscripción a eventos incluya `im.message.receive_v1`
3. Para la incorporación automática a invitaciones de reuniones, suscríbase también a `vc.bot.meeting_invited_v1`
4. Asegúrese de que esté seleccionada la **persistent connection** (WebSocket)
5. Asegúrese de que se hayan concedido todos los ámbitos de permisos necesarios
6. Asegúrese de que el Gateway esté en ejecución: `openclaw gateway status`
7. Consulte los registros: `openclaw logs --follow`

Suscribirse a `vc.bot.meeting_invited_v1` solo entrega el evento. Las incorporaciones automáticas están
desactivadas de forma predeterminada. Para activarlas globalmente:

```json5
{
  channels: {
    feishu: {
      vcAutoJoin: true,
    },
  },
}
```

Para activarlas solo para una cuenta, omita el conmutador de nivel superior y establezca la anulación de la cuenta:

```json5
{
  channels: {
    feishu: {
      accounts: {
        meetings: { vcAutoJoin: true },
      },
    },
  },
}
```

Los usuarios que envían invitaciones siguen pasando por la política normal de mensajes directos de Feishu, la lista de permitidos o el emparejamiento, la sesión y el
enrutamiento de respuestas antes de que el agente reciba un turno para incorporarse. La incorporación también requiere una herramienta disponible de incorporación a VC de Feishu
configurada para la identidad de la aplicación con el
ámbito `vc:meeting.bot.join:write`. Por ejemplo, la Skill oficial de
[agente de VC `lark-cli`](https://github.com/larksuite/cli/tree/main/skills/lark-vc-agent)
proporciona `vc +meeting-join`.

<Warning>
La Skill oficial de agente de VC `lark-cli` marca actualmente las acciones del bot de reuniones como una versión beta limitada. Si la herramienta devuelve `ErrNotInGray` o el código de error `20017`, la aplicación o el tenant no están habilitados para esa versión beta; siga las instrucciones de acceso anticipado de la Skill enlazada antes de solucionar problemas relacionados con la concesión habitual de ámbitos.
</Warning>

### La configuración mediante QR no reacciona en la aplicación móvil de Feishu

1. Vuelva a ejecutar la configuración: `openclaw channels login --channel feishu`
2. Elija la configuración manual
3. En Feishu Open Platform, cree una aplicación propia y copie su App ID y App Secret
4. Pegue esas credenciales en el asistente de configuración

### Se ha filtrado el App Secret

1. Restablezca el App Secret en Feishu Open Platform / Lark Developer
2. Actualice el valor en la configuración
3. Reinicie el Gateway: `openclaw gateway restart`

## Configuración avanzada

### Varias cuentas

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Bot principal",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Bot de respaldo",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` controla qué cuenta se utiliza cuando las API de salida no especifican un `accountId`. Las entradas de cuenta heredan la configuración de nivel superior; la mayoría de las claves de nivel superior pueden anularse por cuenta.
`accounts.<id>.tts` utiliza la misma estructura que `tts` y se combina en profundidad con la configuración global de TTS, de modo que las configuraciones de Feishu con varios bots pueden mantener globalmente las credenciales compartidas del proveedor y anular únicamente la voz, el modelo, la persona o el modo automático por cuenta.

### Límites de mensajes

- `textChunkLimit` - tamaño de los fragmentos de texto de salida (valor predeterminado: `4000` caracteres)
- `streaming.chunkMode` - `"length"` (valor predeterminado) divide al alcanzar el límite; `"newline"` prioriza los límites de salto de línea
- `mediaMaxMb` - límite de carga y descarga de archivos multimedia (valor predeterminado: `30` MB)

### Streaming

Feishu/Lark admite respuestas mediante streaming a través de tarjetas interactivas (API de streaming de Card Kit). Cuando está habilitado, el bot actualiza la tarjeta en tiempo real a medida que genera el texto.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // salida de tarjeta mediante streaming (valor predeterminado: "partial")
        block: { enabled: true }, // activa el streaming de bloques completados
      },
    },
  },
}
```

Establece `streaming.mode: "off"` para enviar la respuesta completa en un solo mensaje; `renderMode: "raw"` (texto sin formato en lugar de tarjetas) también desactiva las tarjetas en streaming. `streaming.block.enabled` está desactivado de forma predeterminada; actívalo solo cuando quieras que los bloques completados del asistente se envíen antes de la respuesta final. El booleano heredado `streaming` y las claves planas `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` se migran a esta estructura anidada mediante `openclaw doctor --fix`.

### Optimización de la cuota

Reduce el número de llamadas a la API de Feishu/Lark con dos indicadores opcionales:

- `typingIndicator` (valor predeterminado: `true`): establece `false` para omitir las llamadas de reacción de escritura
- `resolveSenderNames` (valor predeterminado: `true`): establece `false` para omitir las consultas de perfiles de remitentes

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Ámbito de las sesiones de grupo e hilos de temas

`channels.feishu.groupSessionScope` (en el nivel superior, por cuenta o por grupo) controla cómo se asignan los mensajes de grupo a las sesiones de agentes:

| Valor                  | Sesión                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (predeterminado)    | Una sesión por chat de grupo                                       |
| `"group_sender"`       | Una sesión por (grupo + remitente)                                 |
| `"group_topic"`        | Una sesión por hilo de tema; recurre a la sesión del grupo    |
| `"group_topic_sender"` | Una sesión por (tema + remitente); recurre a (grupo + remitente) |

Para los ámbitos de temas, los grupos de temas nativos de Feishu/Lark utilizan el evento `thread_id` (`omt_*`) como clave canónica de la sesión del tema. Si un evento de inicio de tema nativo omite `thread_id`, OpenClaw lo obtiene de Feishu antes de enrutar el turno. Las respuestas normales de grupo que OpenClaw convierte en hilos siguen utilizando el ID del mensaje raíz de la respuesta (`om_*`) para que el primer turno y los posteriores permanezcan en la misma sesión.

Establece `replyInThread: "enabled"` (en el nivel superior o por grupo) para que las respuestas del bot creen o continúen un hilo de tema de Feishu en lugar de responder en línea. `topicSessionMode` es el predecesor obsoleto de `groupSessionScope`; se recomienda `groupSessionScope`.

### Herramientas del espacio de trabajo de Feishu

El plugin incluye herramientas de agente para documentos, chats, base de conocimientos, almacenamiento en la nube, permisos y Bitable de Feishu, además de las Skills correspondientes (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`). Las familias de herramientas se controlan mediante `channels.feishu.tools`:

| Clave             | Herramientas                                         | Valor predeterminado             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | Operaciones de documentos `feishu_doc`              | `true`              |
| `tools.chat`    | Información de chats y consultas de miembros `feishu_chat`      | `true`              |
| `tools.wiki`    | Base de conocimientos `feishu_wiki` (requiere `doc`) | `true`              |
| `tools.drive`   | Almacenamiento en la nube `feishu_drive`                  | `true`              |
| `tools.perm`    | Gestión de permisos `feishu_perm`           | `false` (confidencial) |
| `tools.scopes`  | Diagnóstico de ámbitos de la aplicación `feishu_app_scopes`     | `true`              |
| `tools.bitable` | Operaciones de Bitable/Base `feishu_bitable_*`    | `true`              |

`tools.base` es un alias de `tools.bitable`; el valor explícito de `bitable` prevalece cuando se establecen ambos. Los controles por cuenta se encuentran en `accounts.<id>.tools`.

Concede `drive:drive.metadata:readonly` para realizar consultas directas de `feishu_drive info` fuera del directorio
raíz, salvo que la aplicación ya tenga el ámbito completo `drive:drive`. Sin ninguno de estos ámbitos, `info`
mantiene disponible la consulta heredada del directorio raíz mediante `drive:drive:readonly`.

### Sesiones ACP

Feishu/Lark admite ACP para mensajes directos y mensajes en hilos de grupo. ACP en Feishu/Lark se controla mediante comandos de texto; no hay menús nativos de comandos con barra, por lo que se deben usar mensajes `/acp ...` directamente en la conversación.

#### Vinculación persistente de ACP

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
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Iniciar ACP desde el chat

En un mensaje directo o hilo de Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funciona con mensajes directos y mensajes en hilos de Feishu/Lark. Los mensajes posteriores de la conversación vinculada se enrutan directamente a esa sesión ACP.

### Enrutamiento de múltiples agentes

Utiliza `bindings` para enrutar mensajes directos o grupos de Feishu/Lark a distintos agentes.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Campos de enrutamiento:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (mensaje directo) o `"group"` (chat de grupo)
- `match.peer.id`: Open ID del usuario (`ou_xxx`) o ID del grupo (`oc_xxx`)

Consulta [Obtener los ID de grupos y usuarios](#get-groupuser-ids) para ver consejos de búsqueda.

## Aislamiento de agentes por usuario (creación dinámica de agentes)

Activa `dynamicAgentCreation` para crear automáticamente **instancias aisladas de agentes** para cada usuario de mensajes directos. Cada usuario obtiene su propio:

- Directorio de espacio de trabajo independiente
- `USER.md` / `SOUL.md` / `MEMORY.md` separados
- Historial privado de conversaciones
- Skills y estado aislados

Esto es esencial para los bots públicos cuando se quiere que cada usuario tenga su propia experiencia privada con un asistente de IA.

<Note>
Las vinculaciones dinámicas incluyen el `accountId` normalizado de Feishu, por lo que las cuentas predeterminadas y con nombre enrutan a cada remitente al agente dinámico correcto.

Si una cuenta con nombre creó un agente dinámico sin ámbito en una versión anterior, ese agente heredado sigue contando para `maxAgents`. Confirma que la cuenta predeterminada no lo utilice antes de eliminarlo, o aumenta temporalmente `maxAgents`; OpenClaw no puede determinar de forma segura qué cuenta posee un estado heredado ambiguo.
</Note>

### Configuración rápida

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Crítico: hace que el mensaje directo de cada usuario sea su «sesión principal»
    // Carga automáticamente USER.md / SOUL.md / MEMORY.md
    // Para un aislamiento más estricto, utiliza "per-channel-peer" en su lugar
    dmScope: "main",
  },
}
```

### Cómo funciona

Cuando un usuario nuevo envía su primer mensaje directo:

1. El canal genera un `agentId` único: `feishu-{user_open_id}` para la cuenta predeterminada, o un resumen acotado de identidad con prefijo de cuenta para una cuenta con nombre
2. Crea un nuevo espacio de trabajo en la ruta `workspaceTemplate`
3. Registra el agente y crea una vinculación para este usuario
4. El asistente del espacio de trabajo garantiza los archivos de inicialización (`AGENTS.md`, `SOUL.md`, `USER.md`, etc.) en el primer acceso
5. Enruta todos los mensajes futuros de este usuario a su agente dedicado

### Opciones de configuración

| Ajuste                                                  | Descripción                                | Valor predeterminado                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Activar la creación automática de agentes por usuario   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Plantilla de ruta para espacios de trabajo de agentes dinámicos | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Plantilla del nombre del directorio del agente              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Número máximo de agentes dinámicos que se pueden crear | ilimitado                            |

Variables de plantilla:

- `{agentId}`: el ID de agente generado (p. ej., `feishu-ou_xxxxxx` o `feishu-support-<identity_digest>`)
- `{userId}`: el open_id del remitente en Feishu (p. ej., `ou_xxxxxx`)

### Ámbito de las sesiones

`session.dmScope` controla cómo se asignan los mensajes directos a las sesiones de agentes. Este es un **ajuste global** que afecta a todos los canales.

| Valor                        | Comportamiento                                                            | Recomendado para                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | El mensaje directo de cada usuario se asigna a la sesión principal de su agente                   | Bots de un solo usuario en los que se quiere cargar automáticamente `USER.md` / `SOUL.md` |
| `"per-peer"`                 | Cada interlocutor obtiene una sesión separada (independientemente del canal)           | Aislamiento basado únicamente en la identidad del remitente                            |
| `"per-channel-peer"`         | Cada combinación de (canal + usuario) obtiene una sesión separada           | Bots públicos multiusuario que necesitan un aislamiento más estricto                  |
| `"per-account-channel-peer"` | Cada combinación de (cuenta + canal + usuario) obtiene una sesión separada | Bots con varias cuentas que necesitan aislamiento de sesiones por cuenta         |

**Contrapartida**: utilizar `"main"` activa la carga automática de archivos de inicialización (`USER.md`, `SOUL.md`, `MEMORY.md`), pero implica que todos los mensajes directos de todos los canales compartan el mismo patrón de claves de sesión. Para bots públicos multiusuario en los que el aislamiento sea más importante que la carga automática de la inicialización, considera `"per-channel-peer"` y gestiona manualmente los archivos de inicialización.

<Note>
Utiliza `"per-account-channel-peer"` cuando las cuentas de Feishu con nombre deban mantener sesiones separadas para el mismo remitente. Las vinculaciones dinámicas conservan el ámbito de la cuenta.
</Note>

### Implementación multiusuario habitual

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Elige dmScope según tus necesidades de aislamiento:
    // "main" para la carga automática de la inicialización, "per-channel-peer" para un aislamiento más estricto
    dmScope: "main",
  },
  bindings: [], // Vacío: los agentes dinámicos se vinculan automáticamente
}
```

### Verificación

Comprueba los registros del Gateway para confirmar que la creación dinámica funciona:

```text
feishu: creando el agente dinámico "feishu-ou_xxxxxx" para el usuario ou_xxxxxx
  espacio de trabajo: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  agentDir: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Enumere todos los espacios de trabajo creados:

```bash
ls -la ~/.openclaw/workspace-*
```

### Notas

- **Aislamiento de espacios de trabajo**: Cada usuario obtiene su propio directorio de espacio de trabajo y su propia instancia de agente. Los usuarios no pueden ver el historial de conversaciones ni los archivos de otros usuarios dentro del flujo normal de mensajería.
- **Límite de seguridad**: Este es un mecanismo de aislamiento del contexto de mensajería, no un límite de seguridad frente a cotitulares hostiles. El proceso del agente y el entorno del host son compartidos.
- **Las escrituras de configuración deben permanecer habilitadas**: La creación dinámica de agentes escribe agentes y vinculaciones en la configuración; se omite cuando `channels.feishu.configWrites` es `false` (valor predeterminado: habilitado).
- **`bindings` debe estar vacío**: Los agentes dinámicos registran automáticamente sus propias vinculaciones
- **Ruta de actualización**: Las vinculaciones manuales existentes siguen funcionando junto con los agentes dinámicos
- **`session.dmScope` es global**: Esto afecta a todos los canales, no solo a Feishu

## Referencia de configuración

Configuración completa: [Configuración del Gateway](/es/gateway/configuration)

| Ajuste                                                   | Descripción                                                                          | Valor predeterminado                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Habilitar o deshabilitar el canal                                                    | `true`                               |
| `channels.feishu.domain`                                 | Dominio de la API (`feishu`, `lark` o una URL base `https://`)                         | `feishu`                             |
| `channels.feishu.connectionMode`                         | Transporte de eventos (`websocket` o `webhook`)                                      | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Cuenta predeterminada para el enrutamiento saliente                                  | `default`                            |
| `channels.feishu.verificationToken`                      | Obligatorio para el modo Webhook                                                     | -                                    |
| `channels.feishu.encryptKey`                             | Obligatorio para el modo Webhook                                                     | -                                    |
| `channels.feishu.webhookPath`                            | Ruta del Webhook                                                                     | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Host de enlace del Webhook                                                           | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Puerto de enlace del Webhook                                                         | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ID de la aplicación                                                                  | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Secreto de la aplicación                                                             | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Sustitución del dominio por cuenta                                                   | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Sustitución de TTS por cuenta                                                        | `tts`                                |
| `channels.feishu.dmPolicy`                               | Política de mensajes directos (`pairing`, `allowlist`, `open`)                         | `pairing`                            |
| `channels.feishu.allowFrom`                              | Lista de permitidos para mensajes directos (lista de open_id)                        | -                                    |
| `channels.feishu.groupPolicy`                            | Política de grupos (`open`, `allowlist`, `disabled`)                           | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Lista de grupos permitidos                                                           | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | Lista de remitentes permitidos aplicada a todos los grupos                           | -                                    |
| `channels.feishu.requireMention`                         | Requerir una @mención en los grupos                                                  | `true` (`false` cuando la política es `open`) |
| `channels.feishu.allowBots`                              | Aceptar otros bots que mencionen este bot, con protección contra bucles de bots      | `false`                              |
| `channels.feishu.groups.<chat_id>.requireMention`        | Sustitución de @mención por grupo; los ID explícitos también admiten el grupo en el modo de lista de permitidos | heredado                             |
| `channels.feishu.groups.<chat_id>.enabled`               | Habilitar o deshabilitar un grupo específico                                         | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Lista de remitentes permitidos por grupo (sustituye a `groupSenderAllowFrom`)         | -                                    |
| `channels.feishu.groupSessionScope`                      | Asignación de sesiones de grupo (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | Las respuestas del bot crean o continúan hilos de temas (`disabled`, `enabled`)       | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | Eventos de reacción entrantes (`off`, `own`, `all`)                            | `own`                                |
| `channels.feishu.vcAutoJoin`                             | Unirse a reuniones de VC por invitación tras la autorización normal de mensajes directos | `false`                              |
| `channels.feishu.dynamicAgentCreation.enabled`           | Habilitar la creación automática de agentes por usuario                              | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Plantilla de ruta para los espacios de trabajo de agentes dinámicos                  | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Plantilla de nombre del directorio del agente                                         | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Número máximo de agentes dinámicos que se pueden crear                                | ilimitado                            |
| `channels.feishu.textChunkLimit`                         | Tamaño de fragmento de mensaje                                                       | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | División en fragmentos (`length` o `newline`)                                     | `length`                             |
| `channels.feishu.mediaMaxMb`                             | Límite de tamaño de los archivos multimedia                                          | `30`                                 |
| `channels.feishu.renderMode`                             | Representación de respuestas (`auto`, `raw`, `card`)                          | `auto`                               |
| `channels.feishu.streaming.mode`                         | Salida de tarjetas en streaming (`partial` o `off`)                            | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | Streaming de respuestas por bloques completados                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | Enviar reacciones de escritura                                                       | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Resolver los nombres visibles de los remitentes                                      | `true`                               |
| `channels.feishu.configWrites`                           | Permitir escrituras de configuración iniciadas por el canal (necesarias para los agentes dinámicos) | `true`                               |
| `channels.feishu.tools.doc`                              | Habilitar las herramientas de documentos                                             | `true`                               |
| `channels.feishu.tools.chat`                             | Habilitar las herramientas de información del chat                                   | `true`                               |
| `channels.feishu.tools.wiki`                             | Habilitar las herramientas de la base de conocimientos (requiere `doc`)              | `true`                               |
| `channels.feishu.tools.drive`                            | Habilitar las herramientas de almacenamiento en la nube                              | `true`                               |
| `channels.feishu.tools.perm`                             | Habilitar las herramientas de gestión de permisos                                    | `false`                              |
| `channels.feishu.tools.scopes`                           | Habilitar la herramienta de diagnóstico de ámbitos de la aplicación                  | `true`                               |
| `channels.feishu.tools.bitable`                          | Habilitar las herramientas de Bitable/Base                                           | `true`                               |
| `channels.feishu.tools.base`                             | Alias de `channels.feishu.tools.bitable`; el valor explícito de `bitable` prevalece si ambos están definidos | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Control de herramientas de Bitable/Base por cuenta                                   | heredado                             |
| `channels.feishu.accounts.<id>.tools.base`               | Alias por cuenta de `tools.bitable`                                               | heredado                             |

## Tipos de mensajes compatibles

### Recepción

- ✅ Texto
- ✅ Texto enriquecido (publicación)
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Vídeo/multimedia
- ✅ Adhesivos

Los mensajes de audio entrantes de Feishu/Lark se normalizan como marcadores de posición multimedia en lugar
del JSON `file_key` sin procesar. Cuando se configura `tools.media.audio`, OpenClaw
descarga el recurso de la nota de voz y ejecuta la transcripción de audio compartida antes del
turno del agente, de modo que este recibe la transcripción del contenido hablado. Si Feishu incluye
el texto de la transcripción directamente en la carga útil del audio, dicho texto se utiliza sin otra
llamada de ASR. Sin un proveedor de transcripción de audio, el agente sigue recibiendo un
marcador de posición `<media:audio>` junto con el archivo adjunto guardado, no la carga útil
del recurso de Feishu sin procesar.

### Envío

- ✅ Texto
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Vídeo/multimedia
- ✅ Tarjetas interactivas (incluidas las actualizaciones en streaming)
- ⚠️ Texto enriquecido (formato de estilo publicación; no admite todas las funciones de creación de Feishu/Lark)

Las burbujas de audio nativas de Feishu/Lark usan el tipo de mensaje `audio` de Feishu y requieren
medios de carga Ogg/Opus (`file_type: "opus"`). Los medios `.opus` y `.ogg` existentes
se envían directamente como audio nativo. MP3/WAV/M4A y otros formatos probablemente de audio se
transcodifican a Ogg/Opus de 48 kHz con `ffmpeg` solo cuando la respuesta solicita la entrega
por voz (`audioAsVoice` / `asVoice` de la herramienta de mensajes, incluidas las respuestas
de notas de voz mediante TTS). Los archivos MP3 adjuntos normales permanecen como archivos estándar. Si falta
`ffmpeg` o falla la conversión, OpenClaw recurre a adjuntar un archivo y registra el motivo.

### Hilos y respuestas

- ✅ Respuestas en línea
- ✅ Respuestas en hilos
- ✅ Las respuestas multimedia mantienen el contexto del hilo al responder a un mensaje de un hilo

El enrutamiento de sesiones de grupos temáticos se explica en
[Ámbito de las sesiones de grupo e hilos temáticos](#group-session-scope-and-topic-threads).

## Temas relacionados

- [Descripción general de los canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - autenticación por mensaje directo y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento del chat grupal y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo de la seguridad
