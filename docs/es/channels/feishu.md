---
read_when:
    - Quieres conectar un bot de Feishu/Lark
    - Se está configurando el canal de Feishu
summary: Descripción general, funciones y configuración del bot de Feishu
title: Feishu
x-i18n:
    generated_at: "2026-07-19T01:46:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 907f99245ec1d5d038362636def039b16225f90ab9d8ec9d61d08f16495a1710
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw se conecta a Feishu/Lark (la plataforma de colaboración todo en uno) mediante el plugin oficial `@openclaw/feishu`: mensajes directos al bot, chats grupales, respuestas de tarjetas en streaming y herramientas de documentos, wikis, Drive y Bitable de Feishu.

**Estado:** listo para producción con mensajes directos al bot y chats grupales. WebSocket es el transporte de eventos predeterminado (no se necesita una URL pública); el modo Webhook es opcional.

## Inicio rápido

<Note>
Requiere OpenClaw 2026.5.29 o posterior. Ejecute `openclaw --version` para comprobarlo. Actualice con `openclaw update`.
</Note>

<Steps>
  <Step title="Ejecutar el asistente de configuración del canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Esto instala el plugin `@openclaw/feishu` si falta y, a continuación, guía el proceso de configuración:

- **Configuración manual**: pegue un App ID y un App Secret de Feishu Open Platform (`https://open.feishu.cn`) o Lark Developer (`https://open.larksuite.com`).
- **Configuración mediante QR**: escanee un código QR en la aplicación Feishu para crear automáticamente un bot. Este flujo restringe los mensajes directos a su propia cuenta (`dmPolicy: "allowlist"` con su `open_id`).

El asistente también solicita el dominio de la API (Feishu o Lark) y la política de grupos. Si la aplicación móvil nacional de Feishu no reacciona al código QR, vuelva a ejecutar la configuración y elija la configuración manual.
</Step>

  <Step title="Después de completar la configuración, reiniciar el Gateway para aplicar los cambios">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Durabilidad de la entrada

OpenClaw pone de forma duradera en cola los sobres autenticados `im.message.receive_v1` y `drive.notice.comment_add_v1` antes de enviarlos al agente. Los eventos pendientes o reintentables sobreviven al reinicio del Gateway, permanecen serializados por chat o documento y utilizan el ID de evento de Feishu para evitar entradas duplicadas en la cola mientras exista el registro de finalización activo o retenido.

Si un evento de WebSocket no se puede conservar tras un número limitado de reintentos, OpenClaw cierra ese socket y fuerza una nueva conexión autenticada en lugar de continuar después de un turno no confirmado. Otros tipos de eventos de Feishu, incluidas las reacciones y las invitaciones a reuniones de VC, siguen sus rutas de eventos normales y no reciben esta garantía de cola duradera.

## Control de acceso

### Mensajes directos

Configure `channels.feishu.dmPolicy` (valor predeterminado: `pairing`) para controlar quién puede enviar mensajes directos al bot:

| Valor         | Comportamiento                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Los usuarios desconocidos reciben un código de emparejamiento; apruébelo mediante la CLI                                                         |
| `"allowlist"` | Solo pueden chatear los usuarios incluidos en `allowFrom`                                                                     |
| `"open"`      | Mensajes directos públicos; la validación de la configuración requiere que `allowFrom` incluya `"*"`. Las entradas sin comodines siguen restringiendo el acceso |

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
| `"allowlist"` | Responder únicamente a los grupos incluidos en `groupAllowFrom` o configurados explícitamente en `groups.<chat_id>` |
| `"disabled"`  | Desactivar todos los mensajes grupales; las entradas explícitas de `groups.<chat_id>` no anulan esta opción         |

**Requisito de mención** (`channels.feishu.requireMention`):

- Valor predeterminado: se requiere una @mención, excepto cuando la política de grupos efectiva es `"open"`; en ese caso, el valor predeterminado es `false`, de modo que los mensajes que no pueden incluir menciones (por ejemplo, las imágenes) sigan llegando al agente.
- Establezca explícitamente `true` o `false` para anularlo; anulación por grupo: `channels.feishu.groups.<chat_id>.requireMention`.
- Los valores `@all` y `@_all`, destinados únicamente a difusiones, no se consideran menciones al bot. Un mensaje que mencione tanto a `@all` como directamente al bot sigue contando como mención al bot.

## Ejemplos de configuración de grupos

### Permitir todos los grupos sin exigir una @mención

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention defaults to false under "open"
    },
  },
}
```

### Permitir todos los grupos y seguir exigiendo una @mención

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

### Permitir únicamente grupos específicos

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

En el modo `allowlist`, también puede admitir un grupo añadiendo una entrada explícita de `groups.<chat_id>`. Las entradas explícitas no anulan `groupPolicy: "disabled"`. Los valores predeterminados con comodín de `groups.*` configuran los grupos coincidentes, pero no los admiten por sí solos.

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
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` establece la misma lista de remitentes permitidos para todos los grupos; un valor `allowFrom` específico de un grupo tiene prioridad.

### Mensajes escritos por bots

Feishu ignora de forma predeterminada los mensajes escritos por otros bots. Para permitir conversaciones grupales entre bots, conceda a la aplicación los ámbitos `im:message.group_at_msg.include_bot:readonly` y `im:message:readonly` y, a continuación, establezca `allowBots`:

```json5
{
  channels: {
    feishu: {
      allowBots: true,
    },
  },
}
```

Feishu solo entrega eventos grupales escritos por bots cuando otro bot menciona a este bot. Se siguen aplicando la política de grupos, las listas de remitentes permitidos y los requisitos de mención existentes. OpenClaw descarta los mensajes escritos por sí mismo, menciona al bot interlocutor en cada respuesta de texto o tarjeta y aplica la protección compartida [`channels.defaults.botLoopProtection`](/es/channels/bot-loop-protection).

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

Busque `open_id` en la salida del registro. También puede comprobar las solicitudes de emparejamiento pendientes:

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
Feishu/Lark no admite menús nativos de comandos con barra diagonal, por lo que estos deben enviarse como mensajes de texto sin formato.
</Note>

## Solución de problemas

### El bot no responde en los chats grupales

1. Asegúrese de que el bot esté añadido al grupo
2. Asegúrese de @mencionar al bot (requerido de forma predeterminada)
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

La suscripción a `vc.bot.meeting_invited_v1` solo entrega el evento. Las incorporaciones automáticas están
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

Para activarlas solo en una cuenta, omita el conmutador de nivel superior y establezca la anulación de la cuenta:

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

Los remitentes de invitaciones siguen pasando por la política normal de mensajes directos de Feishu, la lista de permitidos o el emparejamiento, la sesión y el enrutamiento de
respuestas antes de que el agente reciba un turno de incorporación. Para incorporarse también se requiere una herramienta disponible de incorporación a VC de Feishu
configurada para la identidad de la aplicación con el ámbito
`vc:meeting.bot.join:write`. Por ejemplo, la Skill oficial
[`lark-cli` del agente de VC](https://github.com/larksuite/cli/tree/main/skills/lark-vc-agent)
proporciona `vc +meeting-join`.

<Warning>
La Skill oficial `lark-cli` del agente de VC marca actualmente las acciones del bot de reuniones como una beta limitada. Si la herramienta devuelve `ErrNotInGray` o el código de error `20017`, la aplicación o el tenant no están habilitados para esa beta; siga las instrucciones de acceso anticipado de la Skill enlazada antes de solucionar problemas con las concesiones de ámbitos habituales.
</Warning>

### La configuración mediante QR no reacciona en la aplicación móvil Feishu

1. Vuelva a ejecutar la configuración: `openclaw channels login --channel feishu`
2. Elija la configuración manual
3. En Feishu Open Platform, cree una aplicación propia y copie su App ID y App Secret
4. Pegue esas credenciales en el asistente de configuración

### Filtración del App Secret

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
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` controla qué cuenta se utiliza cuando las API de salida no especifican un `accountId`. Las entradas de las cuentas heredan la configuración de nivel superior; la mayoría de las claves de nivel superior pueden anularse por cuenta.
`accounts.<id>.tts` utiliza la misma estructura que `messages.tts` y se combina en profundidad con la configuración global de TTS, por lo que las configuraciones de Feishu con varios bots pueden mantener globalmente las credenciales compartidas del proveedor y anular únicamente la voz, el modelo, la personalidad o el modo automático en cada cuenta.

### Límites de mensajes

- `textChunkLimit` - tamaño de los fragmentos de texto saliente (valor predeterminado: `4000` caracteres)
- `streaming.chunkMode` - `"length"` (valor predeterminado) divide al alcanzar el límite; `"newline"` prioriza los límites de línea nueva
- `mediaMaxMb` - límite de carga y descarga de contenido multimedia (valor predeterminado: `30` MB)

### Streaming

Feishu/Lark admite respuestas en streaming mediante tarjetas interactivas (API de streaming de Card Kit). Cuando se activa, el bot actualiza la tarjeta en tiempo real mientras genera el texto.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // streaming card output (default: "partial")
        block: { enabled: true }, // opt into completed-block streaming
      },
    },
  },
}
```

Establezca `streaming.mode: "off"` para enviar la respuesta completa en un solo mensaje; `renderMode: "raw"` (texto sin formato en lugar de tarjetas) también desactiva las tarjetas en streaming. `streaming.block.enabled` está desactivado de forma predeterminada; actívelo solo cuando quiera que los bloques completados del asistente se envíen antes de la respuesta final. El booleano heredado `streaming` y las claves planas `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` se migran a esta estructura anidada mediante `openclaw doctor --fix`.

### Optimización de cuotas

Reduzca el número de llamadas a la API de Feishu/Lark con dos indicadores opcionales:

- `typingIndicator` (valor predeterminado: `true`): establezca `false` para omitir las llamadas de reacción de escritura
- `resolveSenderNames` (valor predeterminado: `true`): establezca `false` para omitir las consultas de perfiles de remitentes

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

`channels.feishu.groupSessionScope` (en el nivel superior, por cuenta o por grupo) controla cómo se asignan los mensajes de grupo a las sesiones de agente:

| Valor                  | Sesión                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (valor predeterminado)    | Una sesión por chat de grupo                                       |
| `"group_sender"`       | Una sesión por (grupo + remitente)                                 |
| `"group_topic"`        | Una sesión por hilo de tema; recurre a la sesión del grupo    |
| `"group_topic_sender"` | Una sesión por (tema + remitente); recurre a (grupo + remitente) |

Para los ámbitos de temas, los grupos de temas nativos de Feishu/Lark utilizan el evento `thread_id` (`omt_*`) como clave canónica de la sesión del tema. Si un evento inicial de tema nativo omite `thread_id`, OpenClaw lo obtiene de Feishu antes de enrutar el turno. Las respuestas normales de grupo que OpenClaw convierte en hilos siguen utilizando el ID del mensaje raíz de la respuesta (`om_*`) para que el primer turno y los siguientes permanezcan en la misma sesión.

Establezca `replyInThread: "enabled"` (en el nivel superior o por grupo) para que las respuestas del bot creen o continúen un hilo de tema de Feishu en lugar de responder en línea. `topicSessionMode` es el predecesor obsoleto de `groupSessionScope`; se recomienda `groupSessionScope`.

### Herramientas del espacio de trabajo de Feishu

El plugin incluye herramientas de agente para documentos, chats, base de conocimientos, almacenamiento en la nube, permisos y Bitable de Feishu, además de las Skills correspondientes (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`). Las familias de herramientas se controlan mediante `channels.feishu.tools`:

| Clave             | Herramientas                                         | Valor predeterminado             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | Operaciones de documentos de `feishu_doc`              | `true`              |
| `tools.chat`    | Información del chat y consultas de miembros de `feishu_chat`      | `true`              |
| `tools.wiki`    | Base de conocimientos de `feishu_wiki` (requiere `doc`) | `true`              |
| `tools.drive`   | Almacenamiento en la nube de `feishu_drive`                  | `true`              |
| `tools.perm`    | Gestión de permisos de `feishu_perm`           | `false` (confidencial) |
| `tools.scopes`  | Diagnóstico del ámbito de la aplicación de `feishu_app_scopes`     | `true`              |
| `tools.bitable` | Operaciones de Bitable/Base de `feishu_bitable_*`    | `true`              |

`tools.base` es un alias de `tools.bitable`; el valor explícito de `bitable` prevalece cuando se establecen ambos. Los controles por cuenta se encuentran en `accounts.<id>.tools`.

Conceda `drive:drive.metadata:readonly` para las consultas directas de `feishu_drive info` fuera del directorio
raíz, a menos que la aplicación ya tenga el ámbito completo `drive:drive`. Sin ninguno de estos ámbitos, `info`
mantiene disponible la consulta heredada del directorio raíz mediante `drive:drive:readonly`.

### Sesiones de ACP

Feishu/Lark admite ACP para mensajes directos y mensajes en hilos de grupo. ACP en Feishu/Lark se controla mediante comandos de texto: no hay menús nativos de comandos con barra diagonal, por lo que se deben utilizar mensajes `/acp ...` directamente en la conversación.

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

`--thread here` funciona con mensajes directos y mensajes en hilos de Feishu/Lark. Los mensajes posteriores de la conversación vinculada se enrutan directamente a esa sesión de ACP.

### Enrutamiento multiagente

Utilice `bindings` para enrutar mensajes directos o grupos de Feishu/Lark a distintos agentes.

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

Consulte [Obtener los ID de grupos y usuarios](#get-groupuser-ids) para ver consejos de consulta.

## Aislamiento de agentes por usuario (creación dinámica de agentes)

Active `dynamicAgentCreation` para crear automáticamente **instancias de agente aisladas** para cada usuario de mensajes directos. Cada usuario obtiene sus propios elementos:

- Directorio de espacio de trabajo independiente
- `USER.md` / `SOUL.md` / `MEMORY.md` independientes
- Historial privado de conversaciones
- Skills y estado aislados

Esto es esencial para bots públicos en los que se desea que cada usuario tenga su propia experiencia privada con un asistente de IA.

<Note>
Las vinculaciones dinámicas incluyen el `accountId` normalizado de Feishu, de modo que las cuentas predeterminadas y con nombre enruten a cada remitente al agente dinámico correcto.

Si una cuenta con nombre creó un agente dinámico sin ámbito en una versión anterior, ese agente heredado sigue contando para `maxAgents`. Confirme que la cuenta predeterminada no lo utiliza antes de eliminarlo, o aumente temporalmente `maxAgents`; OpenClaw no puede determinar de forma segura a qué cuenta pertenece un estado heredado ambiguo.
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
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### Funcionamiento

Cuando un usuario nuevo envía su primer mensaje directo:

1. El canal genera un `agentId` único: `feishu-{user_open_id}` para la cuenta predeterminada, o un resumen de identidad acotado con prefijo de cuenta para una cuenta con nombre
2. Crea un espacio de trabajo nuevo en la ruta `workspaceTemplate`
3. Registra el agente y crea una vinculación para este usuario
4. El asistente del espacio de trabajo garantiza que existan los archivos de arranque (`AGENTS.md`, `SOUL.md`, `USER.md`, etc.) en el primer acceso
5. Enruta todos los mensajes futuros de este usuario a su agente dedicado

### Opciones de configuración

| Ajuste                                                  | Descripción                                | Valor predeterminado                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Activar la creación automática de agentes por usuario   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Plantilla de ruta para los espacios de trabajo de agentes dinámicos | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Plantilla del nombre del directorio del agente              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Número máximo de agentes dinámicos que se pueden crear | ilimitado                            |

Variables de plantilla:

- `{agentId}` - el ID de agente generado (por ejemplo, `feishu-ou_xxxxxx` o `feishu-support-<identity_digest>`)
- `{userId}` - el open_id de Feishu del remitente (por ejemplo, `ou_xxxxxx`)

### Ámbito de la sesión

`session.dmScope` controla cómo se asignan los mensajes directos a las sesiones de agente. Esta es una **configuración global** que afecta a todos los canales.

| Valor                        | Comportamiento                                                            | Recomendado para                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | El mensaje directo de cada usuario se asigna a la sesión principal de su agente                   | Bots de un solo usuario en los que se desea que `USER.md` / `SOUL.md` se carguen automáticamente |
| `"per-peer"`                 | Cada interlocutor obtiene una sesión independiente (sin importar el canal)           | Aislamiento basado únicamente en la identidad del remitente                            |
| `"per-channel-peer"`         | Cada combinación de (canal + usuario) obtiene una sesión independiente           | Bots públicos multiusuario que requieren un aislamiento más estricto                  |
| `"per-account-channel-peer"` | Cada combinación de (cuenta + canal + usuario) obtiene una sesión independiente | Bots con varias cuentas que requieren aislamiento de sesiones a nivel de cuenta         |

**Compensación**: El uso de `"main"` activa la carga automática de archivos de arranque (`USER.md`, `SOUL.md`, `MEMORY.md`), pero implica que todos los mensajes directos de todos los canales comparten el mismo patrón de claves de sesión. Para bots públicos multiusuario en los que el aislamiento sea más importante que la carga automática de archivos de arranque, considere `"per-channel-peer"` y gestione manualmente los archivos de arranque.

<Note>
Utilice `"per-account-channel-peer"` cuando las cuentas de Feishu con nombre deban mantener sesiones separadas para el mismo remitente. Las vinculaciones dinámicas conservan el ámbito de la cuenta.
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
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### Verificación

Compruebe los registros del Gateway para confirmar que la creación dinámica funciona:

```text
feishu: creando el agente dinámico "feishu-ou_xxxxxx" para el usuario ou_xxxxxx
  workspace: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  agentDir: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Enumere todos los espacios de trabajo creados:

```bash
ls -la ~/.openclaw/workspace-*
```

### Notas

- **Aislamiento de espacios de trabajo**: Cada usuario obtiene su propio directorio de espacio de trabajo y su propia instancia de agente. Los usuarios no pueden ver el historial de conversaciones ni los archivos de otros usuarios dentro del flujo normal de mensajería.
- **Límite de seguridad**: Este es un mecanismo de aislamiento del contexto de mensajería, no un límite de seguridad frente a cotitulares hostiles. El proceso del agente y el entorno del host son compartidos.
- **Las escrituras de configuración deben permanecer habilitadas**: La creación dinámica de agentes escribe los agentes y las vinculaciones en la configuración; se omite cuando `channels.feishu.configWrites` es `false` (valor predeterminado: habilitado).
- **`bindings` debe estar vacío**: Los agentes dinámicos registran automáticamente sus propias vinculaciones
- **Ruta de actualización**: Las vinculaciones manuales existentes siguen funcionando junto con los agentes dinámicos
- **`session.dmScope` es global**: Esto afecta a todos los canales, no solo a Feishu

## Referencia de configuración

Configuración completa: [Configuración del Gateway](/es/gateway/configuration)

| Ajuste                                                   | Descripción                                                                          | Valor predeterminado                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Habilitar o deshabilitar el canal                                                    | `true`                               |
| `channels.feishu.domain`                                 | Dominio de la API (`feishu`, `lark` o una URL base `https://`)                             | `feishu`                             |
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
| `channels.feishu.accounts.<id>.tts`                      | Sustitución de TTS por cuenta                                                        | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Política de mensajes directos (`pairing`, `allowlist`, `open`)                            | `pairing`                            |
| `channels.feishu.allowFrom`                              | Lista de permitidos para mensajes directos (lista de open_id)                        | -                                    |
| `channels.feishu.groupPolicy`                            | Política de grupos (`open`, `allowlist`, `disabled`)                          | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Lista de grupos permitidos                                                           | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | Lista de remitentes permitidos aplicada a todos los grupos                           | -                                    |
| `channels.feishu.requireMention`                         | Exigir una @mención en los grupos                                                    | `true` (`false` cuando la política es `open`)  |
| `channels.feishu.allowBots`                              | Aceptar otros bots que mencionen a este bot, con protección contra bucles de bots    | `false`                              |
| `channels.feishu.groups.<chat_id>.requireMention`        | Sustitución de @mención por grupo; los ID explícitos también admiten el grupo en el modo de lista de permitidos | heredado                             |
| `channels.feishu.groups.<chat_id>.enabled`               | Habilitar o deshabilitar un grupo específico                                         | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Lista de remitentes permitidos por grupo (sustituye a `groupSenderAllowFrom`)         | -                                    |
| `channels.feishu.groupSessionScope`                      | Asignación de sesiones de grupo (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | Las respuestas del bot crean o continúan hilos de temas (`disabled`, `enabled`)      | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | Eventos de reacciones entrantes (`off`, `own`, `all`)                           | `own`                                |
| `channels.feishu.vcAutoJoin`                             | Unirse a reuniones de VC por invitación tras la autorización normal de mensajes directos | `false`                              |
| `channels.feishu.dynamicAgentCreation.enabled`           | Habilitar la creación automática de agentes por usuario                              | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Plantilla de ruta para los espacios de trabajo de agentes dinámicos                  | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Plantilla del nombre del directorio del agente                                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Número máximo de agentes dinámicos que se pueden crear                                | ilimitado                            |
| `channels.feishu.textChunkLimit`                         | Tamaño de los fragmentos de mensajes                                                 | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | División en fragmentos (`length` o `newline`)                                  | `length`                             |
| `channels.feishu.mediaMaxMb`                             | Límite de tamaño de los archivos multimedia                                          | `30`                                 |
| `channels.feishu.renderMode`                             | Representación de respuestas (`auto`, `raw`, `card`)                         | `auto`                               |
| `channels.feishu.streaming.mode`                         | Salida de tarjetas en streaming (`partial` o `off`)                          | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | Transmisión en streaming de respuestas por bloques completados                       | `false`                              |
| `channels.feishu.typingIndicator`                        | Enviar reacciones de escritura                                                       | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Resolver los nombres para mostrar de los remitentes                                   | `true`                               |
| `channels.feishu.configWrites`                           | Permitir escrituras de configuración iniciadas por el canal (necesarias para los agentes dinámicos) | `true`                               |
| `channels.feishu.tools.doc`                              | Habilitar las herramientas de documentos                                             | `true`                               |
| `channels.feishu.tools.chat`                             | Habilitar las herramientas de información del chat                                   | `true`                               |
| `channels.feishu.tools.wiki`                             | Habilitar las herramientas de la base de conocimientos (requiere `doc`)              | `true`                               |
| `channels.feishu.tools.drive`                            | Habilitar las herramientas de almacenamiento en la nube                              | `true`                               |
| `channels.feishu.tools.perm`                             | Habilitar las herramientas de gestión de permisos                                    | `false`                              |
| `channels.feishu.tools.scopes`                           | Habilitar la herramienta de diagnóstico de ámbitos de la aplicación                  | `true`                               |
| `channels.feishu.tools.bitable`                          | Habilitar las herramientas de Bitable/Base                                           | `true`                               |
| `channels.feishu.tools.base`                             | Alias de `channels.feishu.tools.bitable`; el valor explícito de `bitable` prevalece cuando ambos están establecidos | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Control de herramientas de Bitable/Base por cuenta                                   | heredado                             |
| `channels.feishu.accounts.<id>.tools.base`               | Alias por cuenta de `tools.bitable`                                               | heredado                             |

## Tipos de mensajes compatibles

### Recepción

- ✅ Texto
- ✅ Texto enriquecido (publicación)
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Vídeo/contenido multimedia
- ✅ Pegatinas

Los mensajes de audio entrantes de Feishu/Lark se normalizan como marcadores de posición multimedia en lugar
de JSON `file_key` sin procesar. Cuando se configura `tools.media.audio`, OpenClaw
descarga el recurso de la nota de voz y ejecuta la transcripción de audio compartida antes del
turno del agente, de modo que el agente recibe la transcripción del contenido hablado. Si Feishu incluye
el texto de la transcripción directamente en la carga útil de audio, ese texto se utiliza sin realizar otra
llamada de ASR. Sin un proveedor de transcripción de audio, el agente sigue recibiendo un
marcador de posición `<media:audio>` junto con el archivo adjunto guardado, no la carga útil
del recurso de Feishu sin procesar.

### Envío

- ✅ Texto
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Vídeo/contenido multimedia
- ✅ Tarjetas interactivas (incluidas las actualizaciones en streaming)
- ⚠️ Texto enriquecido (formato de estilo publicación; no admite todas las capacidades de autoría de Feishu/Lark)

Las burbujas de audio nativas de Feishu/Lark usan el tipo de mensaje `audio` de Feishu y requieren
contenido multimedia de carga Ogg/Opus (`file_type: "opus"`). El contenido multimedia existente `.opus` y `.ogg`
se envía directamente como audio nativo. MP3/WAV/M4A y otros formatos que probablemente sean de audio se
transcodifican a Ogg/Opus de 48 kHz con `ffmpeg` solo cuando la respuesta solicita la entrega
por voz (`audioAsVoice` / herramienta de mensajes `asVoice`, incluidas las respuestas TTS en forma de nota
de voz). Los archivos MP3 adjuntos ordinarios permanecen como archivos normales. Si falta `ffmpeg` o
falla la conversión, OpenClaw recurre a un archivo adjunto y registra el motivo.

### Hilos y respuestas

- ✅ Respuestas en línea
- ✅ Respuestas en hilos
- ✅ Las respuestas multimedia mantienen el contexto del hilo al responder a un mensaje de un hilo

El enrutamiento de sesiones de grupos temáticos se trata en
[Ámbito de las sesiones de grupo e hilos temáticos](#group-session-scope-and-topic-threads).

## Relacionado

- [Descripción general de los canales](/es/channels) - todos los canales compatibles
- [Vinculación](/es/channels/pairing) - autenticación de mensajes directos y flujo de vinculación
- [Grupos](/es/channels/groups) - comportamiento del chat grupal y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo
