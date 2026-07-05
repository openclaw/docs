---
read_when:
    - Quiere conectar un bot de Feishu/Lark
    - Estás configurando el canal Feishu
summary: Descripción general, funciones y configuración del bot de Feishu
title: Feishu
x-i18n:
    generated_at: "2026-07-05T11:02:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 677884d299ab56a16926d73a29a48e862a12e89ed04c1134c1154e98fb56342d
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw se conecta a Feishu/Lark (la plataforma de colaboración todo en uno) mediante el plugin oficial `@openclaw/feishu`: mensajes directos del bot, chats grupales, respuestas de tarjetas en streaming y herramientas para documentos/wiki/drive/Bitable de Feishu.

**Estado:** listo para producción para mensajes directos del bot y chats grupales. WebSocket es el transporte de eventos predeterminado (no se necesita una URL pública); el modo webhook es opcional.

## Inicio rápido

<Note>
Requiere OpenClaw 2026.5.29 o superior. Ejecuta `openclaw --version` para comprobarlo. Actualiza con `openclaw update`.
</Note>

<Steps>
  <Step title="Ejecuta el asistente de configuración del canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Esto instala el plugin `@openclaw/feishu` si falta y luego te guía por la configuración:

- **Configuración manual**: pega un App ID y un App Secret de Feishu Open Platform (`https://open.feishu.cn`) o Lark Developer (`https://open.larksuite.com`).
- **Configuración por QR**: escanea un código QR en la aplicación Feishu para crear un bot automáticamente. Este flujo limita los mensajes directos a tu propia cuenta (`dmPolicy: "allowlist"` con tu `open_id`).

El asistente también solicita el dominio de la API (Feishu o Lark) y la política de grupos. Si la aplicación móvil doméstica de Feishu no reacciona al código QR, vuelve a ejecutar la configuración y elige la configuración manual.
</Step>

  <Step title="Cuando finalice la configuración, reinicia el gateway para aplicar los cambios">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Control de acceso

### Mensajes directos

Configura `channels.feishu.dmPolicy` (predeterminado: `pairing`) para controlar quién puede enviar mensajes directos al bot:

| Valor         | Comportamiento                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Los usuarios desconocidos reciben un código de emparejamiento; apruébalo mediante la CLI                                                         |
| `"allowlist"` | Solo los usuarios incluidos en `allowFrom` pueden chatear                                                                     |
| `"open"`      | Mensajes directos públicos; la validación de configuración exige que `allowFrom` incluya `"*"`. Las entradas sin comodín siguen restringiendo el acceso |

**Aprobar una solicitud de emparejamiento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chats grupales

**Política de grupo** (`channels.feishu.groupPolicy`, predeterminado: `allowlist`):

| Valor         | Comportamiento                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Responder a todos los mensajes en grupos                                                            |
| `"allowlist"` | Responder solo a grupos en `groupAllowFrom` o configurados explícitamente en `groups.<chat_id>` |
| `"disabled"`  | Desactivar todos los mensajes grupales; las entradas explícitas `groups.<chat_id>` no anulan esto         |

**Requisito de mención** (`channels.feishu.requireMention`):

- Predeterminado: se requiere @mención, excepto cuando la política de grupo efectiva es `"open"`; ahí el valor predeterminado es `false` para que los mensajes que no pueden llevar menciones (por ejemplo, imágenes) aun lleguen al agente.
- Establécelo explícitamente en `true` o `false` para anularlo; anulación por grupo: `channels.feishu.groups.<chat_id>.requireMention`.
- Los mensajes de difusión `@all` y `@_all` no se tratan como menciones al bot. Un mensaje que menciona tanto a `@all` como al bot directamente sigue contando como mención al bot.

## Ejemplos de configuración de grupos

### Permitir todos los grupos, sin requerir @mención

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention defaults to false under "open"
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
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

En modo `allowlist`, también puedes admitir un grupo agregando una entrada explícita `groups.<chat_id>`. Las entradas explícitas no anulan `groupPolicy: "disabled"`. Los valores predeterminados con comodín en `groups.*` configuran los grupos coincidentes, pero no admiten grupos por sí solos.

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

### Restringir remitentes dentro de un grupo

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

`channels.feishu.groupSenderAllowFrom` establece la misma lista de permitidos de remitentes para todos los grupos; un `allowFrom` por grupo tiene prioridad.

<a id="get-groupuser-ids"></a>

## Obtener IDs de grupo/usuario

### IDs de grupo (`chat_id`, formato: `oc_xxx`)

Abre el grupo en Feishu/Lark, haz clic en el icono de menú en la esquina superior derecha y ve a **Configuración**. El ID del grupo (`chat_id`) aparece en la página de configuración.

![Obtener ID de grupo](/images/feishu-get-group-id.png)

### IDs de usuario (`open_id`, formato: `ou_xxx`)

Inicia el gateway, envía un mensaje directo al bot y luego revisa los registros:

```bash
openclaw logs --follow
```

Busca `open_id` en la salida del registro. También puedes revisar las solicitudes de emparejamiento pendientes:

```bash
openclaw pairing list feishu
```

## Comandos comunes

| Comando   | Descripción                 |
| --------- | --------------------------- |
| `/status` | Mostrar el estado del bot             |
| `/reset`  | Restablecer la sesión actual   |
| `/model`  | Mostrar o cambiar el modelo de IA |

<Note>
Feishu/Lark no admite menús nativos de comandos con barra, así que envía estos comandos como mensajes de texto sin formato.
</Note>

## Solución de problemas

### El bot no responde en chats grupales

1. Asegúrate de que el bot esté agregado al grupo
2. Asegúrate de @mencionar al bot (requerido de forma predeterminada)
3. Verifica que `groupPolicy` no sea `"disabled"`
4. Revisa los registros: `openclaw logs --follow`

### El bot no recibe mensajes

1. Asegúrate de que el bot esté publicado y aprobado en Feishu Open Platform / Lark Developer
2. Asegúrate de que la suscripción a eventos incluya `im.message.receive_v1`
3. Asegúrate de que esté seleccionada la **conexión persistente** (WebSocket)
4. Asegúrate de que todos los ámbitos de permiso requeridos estén concedidos
5. Asegúrate de que el gateway esté en ejecución: `openclaw gateway status`
6. Revisa los registros: `openclaw logs --follow`

### La configuración por QR no reacciona en la aplicación móvil de Feishu

1. Vuelve a ejecutar la configuración: `openclaw channels login --channel feishu`
2. Elige la configuración manual
3. En Feishu Open Platform, crea una aplicación autoconstruida y copia su App ID y App Secret
4. Pega esas credenciales en el asistente de configuración

### Se filtró el App Secret

1. Restablece el App Secret en Feishu Open Platform / Lark Developer
2. Actualiza el valor en tu configuración
3. Reinicia el gateway: `openclaw gateway restart`

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

`defaultAccount` controla qué cuenta se usa cuando las API salientes no especifican un `accountId`. Las entradas de cuenta heredan la configuración de nivel superior; la mayoría de las claves de nivel superior se pueden anular por cuenta.
`accounts.<id>.tts` usa la misma forma que `messages.tts` y se fusiona en profundidad sobre la configuración TTS global, por lo que las configuraciones de Feishu con varios bots pueden mantener credenciales de proveedor compartidas globalmente mientras anulan solo voz, modelo, persona o modo automático por cuenta.

### Límites de mensajes

- `textChunkLimit` - tamaño de fragmento de texto saliente (predeterminado: `4000` caracteres)
- `chunkMode` - `"length"` (predeterminado) divide en el límite; `"newline"` prefiere límites de salto de línea
- `mediaMaxMb` - límite de carga/descarga de medios (predeterminado: `30` MB)

### Streaming

Feishu/Lark admite respuestas en streaming mediante tarjetas interactivas (API de streaming de Card Kit). Cuando está activado, el bot actualiza la tarjeta en tiempo real mientras genera texto.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Establece `streaming: false` para enviar la respuesta completa en un solo mensaje; `renderMode: "raw"` (texto sin formato en lugar de tarjetas) también desactiva las tarjetas en streaming. `blockStreaming` está desactivado de forma predeterminada; actívalo solo cuando quieras que los bloques completados del asistente se envíen antes de la respuesta final.

### Optimización de cuota

Reduce el número de llamadas a la API de Feishu/Lark con dos banderas opcionales:

- `typingIndicator` (predeterminado `true`): establece `false` para omitir las llamadas de reacción de escritura
- `resolveSenderNames` (predeterminado `true`): establece `false` para omitir las búsquedas de perfiles de remitentes

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

### Alcance de sesión de grupo e hilos de temas

`channels.feishu.groupSessionScope` (nivel superior, por cuenta o por grupo) controla cómo los mensajes grupales se asignan a sesiones de agente:

| Valor                  | Sesión                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (predeterminado)    | Una sesión por chat grupal                                       |
| `"group_sender"`       | Una sesión por (grupo + remitente)                                 |
| `"group_topic"`        | Una sesión por hilo de tema; recurre a la sesión de grupo    |
| `"group_topic_sender"` | Una sesión por (tema + remitente); recurre a (grupo + remitente) |

Para los alcances de tema, los grupos de temas nativos de Feishu/Lark usan el `thread_id` del evento (`omt_*`) como clave canónica de sesión de tema. Si un evento iniciador de tema nativo omite `thread_id`, OpenClaw lo hidrata desde Feishu antes de enrutar el turno. Las respuestas normales de grupo que OpenClaw convierte en hilos siguen usando el ID del mensaje raíz de respuesta (`om_*`) para que el primer turno y los turnos de seguimiento permanezcan en la misma sesión.

Establece `replyInThread: "enabled"` (nivel superior o por grupo) para hacer que las respuestas del bot creen o continúen un hilo de tema de Feishu en lugar de responder en línea. `topicSessionMode` es el predecesor obsoleto de `groupSessionScope`; prefiere `groupSessionScope`.

### Herramientas de espacio de trabajo de Feishu

El plugin incluye herramientas de agente para documentos, chats, base de conocimientos, almacenamiento en la nube, permisos y Bitable de Feishu, además de Skills correspondientes (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`). Las familias de herramientas están controladas por `channels.feishu.tools`:

| Clave             | Herramientas                                         | Predeterminado             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | Operaciones de documentos `feishu_doc`              | `true`              |
| `tools.chat`    | Información de chats `feishu_chat` + consultas de miembros      | `true`              |
| `tools.wiki`    | Base de conocimientos `feishu_wiki` (requiere `doc`) | `true`              |
| `tools.drive`   | Almacenamiento en la nube `feishu_drive`                  | `true`              |
| `tools.perm`    | Gestión de permisos `feishu_perm`           | `false` (sensible) |
| `tools.scopes`  | Diagnósticos de ámbitos de la aplicación `feishu_app_scopes`     | `true`              |
| `tools.bitable` | Operaciones Bitable/Base `feishu_bitable_*`    | `true`              |

`tools.base` es un alias de `tools.bitable`; el valor explícito de `bitable` tiene prioridad cuando ambos están establecidos. Las compuertas por cuenta están en `accounts.<id>.tools`.

### Sesiones ACP

Feishu/Lark admite ACP para mensajes directos y mensajes en hilos grupales. ACP de Feishu/Lark se controla mediante comandos de texto: no hay menús nativos de comandos con barra, así que usa mensajes `/acp ...` directamente en la conversación.

#### Vinculación ACP persistente

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

En un DM o hilo de Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funciona para DMs y mensajes de hilo de Feishu/Lark. Los mensajes de seguimiento en la conversación vinculada se enrutan directamente a esa sesión ACP.

### Enrutamiento multiagente

Usa `bindings` para enrutar DMs o grupos de Feishu/Lark a distintos agentes.

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
- `match.peer.kind`: `"direct"` (DM) o `"group"` (chat de grupo)
- `match.peer.id`: Open ID del usuario (`ou_xxx`) o ID de grupo (`oc_xxx`)

Consulta [Obtener IDs de grupo/usuario](#get-groupuser-ids) para consejos de búsqueda.

## Aislamiento de agente por usuario (Creación dinámica de agentes)

Habilita `dynamicAgentCreation` para crear automáticamente **instancias de agente aisladas** para cada usuario de DM. Cada usuario obtiene su propio:

- Directorio de workspace independiente
- `USER.md` / `SOUL.md` / `MEMORY.md` separados
- Historial de conversación privado
- Skills y estado aislados

Esto es esencial para bots públicos en los que quieres que cada usuario tenga su propia experiencia privada de asistente de IA.

<Note>
Las vinculaciones dinámicas incluyen el `accountId` normalizado de Feishu, por lo que las cuentas predeterminadas y con nombre enrutan a cada remitente al agente dinámico correcto.

Si una cuenta con nombre creó un agente dinámico sin ámbito en una versión anterior, ese agente heredado aún cuenta para `maxAgents`. Confirma que la cuenta predeterminada no lo usa antes de eliminarlo, o aumenta temporalmente `maxAgents`; OpenClaw no puede inferir con seguridad qué cuenta es propietaria de un estado heredado ambiguo.
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

### Cómo funciona

Cuando un usuario nuevo envía su primer DM:

1. El canal genera un `agentId` único: `feishu-{user_open_id}` para la cuenta predeterminada, o un resumen de identidad acotado con prefijo de cuenta para una cuenta con nombre
2. Crea un nuevo workspace en la ruta `workspaceTemplate`
3. Registra el agente y crea una vinculación para este usuario
4. El ayudante del workspace garantiza los archivos de arranque (`AGENTS.md`, `SOUL.md`, `USER.md`, etc.) en el primer acceso
5. Enruta todos los mensajes futuros de este usuario a su agente dedicado

### Opciones de configuración

| Configuración                                           | Descripción                                            | Predeterminado                      |
| ------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------- |
| `channels.feishu.dynamicAgentCreation.enabled`          | Habilita la creación automática de agentes por usuario | `false`                             |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Plantilla de ruta para workspaces de agentes dinámicos | `~/.openclaw/workspace-{agentId}`   |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate` | Plantilla de nombre del directorio del agente          | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`        | Número máximo de agentes dinámicos que se crearán      | sin límite                          |

Variables de plantilla:

- `{agentId}` - el ID de agente generado (por ejemplo, `feishu-ou_xxxxxx` o `feishu-support-<identity_digest>`)
- `{userId}` - el open_id de Feishu del remitente (por ejemplo, `ou_xxxxxx`)

### Ámbito de sesión

`session.dmScope` controla cómo se asignan los mensajes directos a sesiones de agente. Esta es una **configuración global** que afecta a todos los canales.

| Valor                        | Comportamiento                                                       | Ideal para                                                        |
| ---------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `"main"`                     | El DM de cada usuario se asigna a la sesión principal de su agente   | Bots de usuario único donde quieres que `USER.md` / `SOUL.md` se carguen automáticamente |
| `"per-peer"`                 | Cada par obtiene una sesión separada (independientemente del canal)  | Aislamiento definido solo por identidad del remitente             |
| `"per-channel-peer"`         | Cada combinación (canal + usuario) obtiene una sesión separada       | Bots públicos multiusuario que necesitan mayor aislamiento        |
| `"per-account-channel-peer"` | Cada combinación (cuenta + canal + usuario) obtiene una sesión separada | Bots multicuenta que necesitan aislamiento de sesión por cuenta |

**Compensación**: Usar `"main"` habilita la carga automática de archivos de arranque (`USER.md`, `SOUL.md`, `MEMORY.md`), pero significa que todos los DMs de todos los canales comparten el mismo patrón de clave de sesión. Para bots públicos multiusuario donde el aislamiento importa más que la carga automática de arranque, considera `"per-channel-peer"` y administra los archivos de arranque manualmente.

<Note>
Usa `"per-account-channel-peer"` cuando las cuentas con nombre de Feishu deban mantener sesiones separadas para el mismo remitente. Las vinculaciones dinámicas preservan el ámbito de la cuenta.
</Note>

### Despliegue multiusuario típico

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

Revisa los registros del gateway para confirmar que la creación dinámica funciona:

```text
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
  workspace: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  agentDir: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Lista todos los workspaces creados:

```bash
ls -la ~/.openclaw/workspace-*
```

### Notas

- **Aislamiento del workspace**: Cada usuario obtiene su propio directorio de workspace e instancia de agente. Los usuarios no pueden ver el historial de conversación ni los archivos de otros usuarios dentro del flujo normal de mensajería.
- **Límite de seguridad**: Este es un mecanismo de aislamiento de contexto de mensajería, no un límite de seguridad frente a coarrendatarios hostiles. El proceso del agente y el entorno del host son compartidos.
- **Las escrituras de configuración deben permanecer habilitadas**: La creación dinámica de agentes escribe agentes y vinculaciones en la configuración; se omite cuando `channels.feishu.configWrites` es `false` (predeterminado: habilitado).
- **`bindings` debe estar vacío**: Los agentes dinámicos registran automáticamente sus propias vinculaciones
- **Ruta de actualización**: Las vinculaciones manuales existentes siguen funcionando junto con los agentes dinámicos
- **`session.dmScope` es global**: Esto afecta a todos los canales, no solo a Feishu

## Referencia de configuración

Configuración completa: [Configuración de Gateway](/es/gateway/configuration)

| Configuración                                            | Descripción                                                                          | Predeterminado                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| `channels.feishu.enabled`                                | Habilita/deshabilita el canal                                                        | `true`                              |
| `channels.feishu.domain`                                 | Dominio de API (`feishu`, `lark` o una URL base `https://`)                          | `feishu`                            |
| `channels.feishu.connectionMode`                         | Transporte de eventos (`websocket` o `webhook`)                                      | `websocket`                         |
| `channels.feishu.defaultAccount`                         | Cuenta predeterminada para el enrutamiento saliente                                  | `default`                           |
| `channels.feishu.verificationToken`                      | Requerido para el modo webhook                                                       | -                                   |
| `channels.feishu.encryptKey`                             | Requerido para el modo webhook                                                       | -                                   |
| `channels.feishu.webhookPath`                            | Ruta del Webhook                                                                     | `/feishu/events`                    |
| `channels.feishu.webhookHost`                            | Host de enlace del Webhook                                                           | `127.0.0.1`                         |
| `channels.feishu.webhookPort`                            | Puerto de enlace del Webhook                                                         | `3000`                              |
| `channels.feishu.accounts.<id>.appId`                    | ID de la aplicación                                                                  | -                                   |
| `channels.feishu.accounts.<id>.appSecret`                | Secreto de la aplicación                                                             | -                                   |
| `channels.feishu.accounts.<id>.domain`                   | Anulación de dominio por cuenta                                                      | `feishu`                            |
| `channels.feishu.accounts.<id>.tts`                      | Anulación de TTS por cuenta                                                          | `messages.tts`                      |
| `channels.feishu.dmPolicy`                               | Política de DM (`pairing`, `allowlist`, `open`)                                      | `pairing`                           |
| `channels.feishu.allowFrom`                              | Lista de permitidos de DM (lista de open_id)                                         | -                                   |
| `channels.feishu.groupPolicy`                            | Política de grupo (`open`, `allowlist`, `disabled`)                                  | `allowlist`                         |
| `channels.feishu.groupAllowFrom`                         | Lista de permitidos de grupo                                                         | -                                   |
| `channels.feishu.groupSenderAllowFrom`                   | Lista de permitidos de remitentes aplicada a todos los grupos                        | -                                   |
| `channels.feishu.requireMention`                         | Requerir @mención en grupos                                                          | `true` (`false` cuando la política es `open`) |
| `channels.feishu.groups.<chat_id>.requireMention`        | Anulación de @mención por grupo; los ID explícitos también admiten el grupo en modo de lista de permitidos | heredado                            |
| `channels.feishu.groups.<chat_id>.enabled`               | Habilita/deshabilita un grupo específico                                             | `true`                              |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Lista de permitidos de remitentes por grupo (anula `groupSenderAllowFrom`)           | -                                   |
| `channels.feishu.groupSessionScope`                      | Asignación de sesión de grupo (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                             |
| `channels.feishu.replyInThread`                          | Las respuestas del bot crean/continúan hilos de tema (`disabled`, `enabled`)         | `disabled`                          |
| `channels.feishu.reactionNotifications`                  | Eventos de reacción entrantes (`off`, `own`, `all`)                                  | `own`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | Habilita la creación automática de agentes por usuario                               | `false`                             |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Plantilla de ruta para espacios de trabajo de agentes dinámicos                      | `~/.openclaw/workspace-{agentId}`   |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Plantilla de nombre de directorio de agente                                          | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Número máximo de agentes dinámicos que crear                                         | ilimitado                           |
| `channels.feishu.textChunkLimit`                         | Tamaño de fragmento de mensaje                                                       | `4000`                              |
| `channels.feishu.chunkMode`                              | División de fragmentos (`length` o `newline`)                                        | `length`                            |
| `channels.feishu.mediaMaxMb`                             | Límite de tamaño de medios                                                           | `30`                                |
| `channels.feishu.renderMode`                             | Renderización de respuestas (`auto`, `raw`, `card`)                                  | `auto`                              |
| `channels.feishu.streaming`                              | Salida de tarjeta en streaming                                                       | `true`                              |
| `channels.feishu.blockStreaming`                         | Streaming de respuestas por bloques completados                                      | `false`                             |
| `channels.feishu.typingIndicator`                        | Enviar reacciones de escritura                                                       | `true`                              |
| `channels.feishu.resolveSenderNames`                     | Resolver nombres visibles de remitentes                                              | `true`                              |
| `channels.feishu.configWrites`                           | Permitir escrituras de configuración iniciadas por el canal (necesario para agentes dinámicos) | `true`                              |
| `channels.feishu.tools.doc`                              | Habilitar herramientas de documentos                                                 | `true`                              |
| `channels.feishu.tools.chat`                             | Habilitar herramientas de información de chat                                        | `true`                              |
| `channels.feishu.tools.wiki`                             | Habilitar herramientas de base de conocimiento (requiere `doc`)                      | `true`                              |
| `channels.feishu.tools.drive`                            | Habilitar herramientas de almacenamiento en la nube                                  | `true`                              |
| `channels.feishu.tools.perm`                             | Habilitar herramientas de gestión de permisos                                        | `false`                             |
| `channels.feishu.tools.scopes`                           | Habilitar herramienta de diagnóstico de alcances de la aplicación                    | `true`                              |
| `channels.feishu.tools.bitable`                          | Habilitar herramientas de Bitable/Base                                               | `true`                              |
| `channels.feishu.tools.base`                             | Alias de `channels.feishu.tools.bitable`; `bitable` explícito prevalece cuando ambos están definidos | `true`                              |
| `channels.feishu.accounts.<id>.tools.bitable`            | Control de herramientas Bitable/Base por cuenta                                      | heredado                            |
| `channels.feishu.accounts.<id>.tools.base`               | Alias por cuenta de `tools.bitable`                                                  | heredado                            |

## Tipos de mensaje admitidos

### Recibir

- ✅ Texto
- ✅ Texto enriquecido (post)
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Vídeo/medios
- ✅ Stickers

Los mensajes de audio entrantes de Feishu/Lark se normalizan como marcadores de posición de medios en lugar de JSON `file_key` sin procesar. Cuando `tools.media.audio` está configurado, OpenClaw descarga el recurso de nota de voz y ejecuta la transcripción de audio compartida antes del turno del agente, de modo que el agente recibe la transcripción hablada. Si Feishu incluye texto de transcripción directamente en la carga útil de audio, ese texto se usa sin otra llamada de ASR. Sin un proveedor de transcripción de audio, el agente sigue recibiendo un marcador de posición `<media:audio>` más el adjunto guardado, no la carga útil del recurso de Feishu sin procesar.

### Enviar

- ✅ Texto
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Vídeo/medios
- ✅ Tarjetas interactivas (incluidas actualizaciones en streaming)
- ⚠️ Texto enriquecido (formato de estilo post; no admite todas las capacidades de autoría de Feishu/Lark)

Las burbujas de audio nativas de Feishu/Lark usan el tipo de mensaje `audio` de Feishu y requieren medios subidos Ogg/Opus (`file_type: "opus"`). Los medios `.opus` y `.ogg` existentes se envían directamente como audio nativo. MP3/WAV/M4A y otros formatos probablemente de audio se transcodifican a Ogg/Opus de 48 kHz con `ffmpeg` solo cuando la respuesta solicita entrega por voz (`audioAsVoice` / herramienta de mensaje `asVoice`, incluidas las respuestas de notas de voz TTS). Los adjuntos MP3 ordinarios se mantienen como archivos normales. Si falta `ffmpeg` o falla la conversión, OpenClaw recurre a un adjunto de archivo y registra el motivo.

### Hilos y respuestas

- ✅ Respuestas en línea
- ✅ Respuestas en hilos
- ✅ Las respuestas con medios siguen teniendo en cuenta el hilo al responder a un mensaje de hilo

El enrutamiento de sesiones de grupos por tema se cubre en
[Alcance de sesión de grupo e hilos de tema](#group-session-scope-and-topic-threads).

## Relacionado

- [Resumen de canales](/es/channels) - todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) - autenticación de DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento de chats grupales y control de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo de seguridad
