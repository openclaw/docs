---
read_when:
    - Quieres conectar un bot de Feishu/Lark
    - Estás configurando el canal de Feishu
summary: Descripción general del bot de Feishu, funciones y configuración
title: Feishu
x-i18n:
    generated_at: "2026-04-24T05:18:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: f68a03c457fb2be7654f298fbad759705983d9e673b7b7b950609694894bdcbc
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark es una plataforma integral de colaboración donde los equipos chatean, comparten documentos, gestionan calendarios y trabajan juntos.

**Estado:** listo para producción para mensajes directos de bots y chats de grupo. WebSocket es el modo predeterminado; el modo Webhook es opcional.

---

## Inicio rápido

> **Requiere OpenClaw 2026.4.24 o superior.** Ejecuta `openclaw --version` para comprobarlo. Actualiza con `openclaw update`.

<Steps>
  <Step title="Ejecuta el asistente de configuración del canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Escanea el código QR con tu aplicación móvil de Feishu/Lark para crear automáticamente un bot de Feishu/Lark.
  </Step>
  
  <Step title="Una vez completada la configuración, reinicia el Gateway para aplicar los cambios">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Control de acceso

### Mensajes directos

Configura `dmPolicy` para controlar quién puede enviar mensajes directos al bot:

- `"pairing"` — los usuarios desconocidos reciben un código de vinculación; apruébalo mediante la CLI
- `"allowlist"` — solo los usuarios incluidos en `allowFrom` pueden chatear (predeterminado: solo el propietario del bot)
- `"open"` — permite a todos los usuarios
- `"disabled"` — desactiva todos los mensajes directos

**Aprobar una solicitud de vinculación:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chats de grupo

**Política de grupo** (`channels.feishu.groupPolicy`):

| Valor         | Comportamiento                              |
| ------------- | ------------------------------------------- |
| `"open"`      | Responde a todos los mensajes en grupos     |
| `"allowlist"` | Solo responde a los grupos en `groupAllowFrom` |
| `"disabled"`  | Desactiva todos los mensajes de grupo       |

Predeterminado: `allowlist`

**Requisito de mención** (`channels.feishu.requireMention`):

- `true` — requiere una @mención (predeterminado)
- `false` — responde sin @mención
- Anulación por grupo: `channels.feishu.groups.<chat_id>.requireMention`

---

## Ejemplos de configuración de grupos

### Permitir todos los grupos, sin requerir @mención

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
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
      // Los ID de grupo tienen este formato: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
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
          // Los open_id de usuario tienen este formato: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Obtener ID de grupo/usuario

### ID de grupo (`chat_id`, formato: `oc_xxx`)

Abre el grupo en Feishu/Lark, haz clic en el icono de menú en la esquina superior derecha y ve a **Settings**. El ID del grupo (`chat_id`) aparece en la página de configuración.

![Obtener ID de grupo](/images/feishu-get-group-id.png)

### ID de usuario (`open_id`, formato: `ou_xxx`)

Inicia el Gateway, envía un mensaje directo al bot y luego revisa los registros:

```bash
openclaw logs --follow
```

Busca `open_id` en la salida del registro. También puedes comprobar las solicitudes de vinculación pendientes:

```bash
openclaw pairing list feishu
```

---

## Comandos comunes

| Comando   | Descripción                      |
| --------- | -------------------------------- |
| `/status` | Muestra el estado del bot        |
| `/reset`  | Restablece la sesión actual      |
| `/model`  | Muestra o cambia el modelo de IA |

> Feishu/Lark no admite menús nativos de comandos con barra, así que envíalos como mensajes de texto sin formato.

---

## Solución de problemas

### El bot no responde en chats de grupo

1. Asegúrate de que el bot esté añadido al grupo
2. Asegúrate de @mencionar al bot (obligatorio de forma predeterminada)
3. Verifica que `groupPolicy` no sea `"disabled"`
4. Revisa los registros: `openclaw logs --follow`

### El bot no recibe mensajes

1. Asegúrate de que el bot esté publicado y aprobado en Feishu Open Platform / Lark Developer
2. Asegúrate de que la suscripción a eventos incluya `im.message.receive_v1`
3. Asegúrate de que esté seleccionada la **conexión persistente** (WebSocket)
4. Asegúrate de que se hayan concedido todos los ámbitos de permisos necesarios
5. Asegúrate de que el Gateway esté en ejecución: `openclaw gateway status`
6. Revisa los registros: `openclaw logs --follow`

### Se filtró el App Secret

1. Restablece el App Secret en Feishu Open Platform / Lark Developer
2. Actualiza el valor en tu configuración
3. Reinicia el Gateway: `openclaw gateway restart`

---

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

`defaultAccount` controla qué cuenta se usa cuando las API salientes no especifican un `accountId`.

### Límites de mensajes

- `textChunkLimit` — tamaño del fragmento de texto saliente (predeterminado: `2000` caracteres)
- `mediaMaxMb` — límite de carga/descarga de archivos multimedia (predeterminado: `30` MB)

### Streaming

Feishu/Lark admite respuestas en streaming mediante tarjetas interactivas. Cuando está habilitado, el bot actualiza la tarjeta en tiempo real a medida que genera texto.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // enable block-level streaming (default: true)
    },
  },
}
```

Establece `streaming: false` para enviar la respuesta completa en un solo mensaje.

### Optimización de cuota

Reduce el número de llamadas a la API de Feishu/Lark con dos indicadores opcionales:

- `typingIndicator` (predeterminado `true`): establece `false` para omitir las llamadas de reacción de escritura
- `resolveSenderNames` (predeterminado `true`): establece `false` para omitir las búsquedas del perfil del remitente

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

### Sesiones ACP

Feishu/Lark admite ACP para mensajes directos y mensajes de hilos de grupo. El ACP de Feishu/Lark se controla mediante comandos de texto: no hay menús nativos de comandos con barra, así que usa mensajes `/acp ...` directamente en la conversación.

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

`--thread here` funciona para mensajes directos y mensajes de hilos de Feishu/Lark. Los mensajes posteriores en la conversación vinculada se enrutan directamente a esa sesión ACP.

### Enrutamiento multiagente

Usa `bindings` para enrutar mensajes directos o grupos de Feishu/Lark a distintos agentes.

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

Consulta [Obtener ID de grupo/usuario](#get-groupuser-ids) para ver consejos de búsqueda.

---

## Referencia de configuración

Configuración completa: [Configuración del Gateway](/es/gateway/configuration)

| Configuración                                    | Descripción                                | Predeterminado   |
| ------------------------------------------------ | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                        | Activa/desactiva el canal                  | `true`           |
| `channels.feishu.domain`                         | Dominio de la API (`feishu` o `lark`)      | `feishu`         |
| `channels.feishu.connectionMode`                 | Transporte de eventos (`websocket` o `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                 | Cuenta predeterminada para el enrutamiento saliente | `default`        |
| `channels.feishu.verificationToken`              | Obligatorio para el modo Webhook           | —                |
| `channels.feishu.encryptKey`                     | Obligatorio para el modo Webhook           | —                |
| `channels.feishu.webhookPath`                    | Ruta del Webhook                           | `/feishu/events` |
| `channels.feishu.webhookHost`                    | Host de enlace del Webhook                 | `127.0.0.1`      |
| `channels.feishu.webhookPort`                    | Puerto de enlace del Webhook               | `3000`           |
| `channels.feishu.accounts.<id>.appId`            | ID de la aplicación                        | —                |
| `channels.feishu.accounts.<id>.appSecret`        | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`           | Anulación del dominio por cuenta           | `feishu`         |
| `channels.feishu.dmPolicy`                       | Política de mensajes directos              | `allowlist`      |
| `channels.feishu.allowFrom`                      | Lista de permitidos para mensajes directos (lista de `open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                    | Política de grupo                          | `allowlist`      |
| `channels.feishu.groupAllowFrom`                 | Lista de grupos permitidos                 | —                |
| `channels.feishu.requireMention`                 | Requiere @mención en grupos                | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention`| Anulación de @mención por grupo            | heredado         |
| `channels.feishu.groups.<chat_id>.enabled`       | Activa/desactiva un grupo específico       | `true`           |
| `channels.feishu.textChunkLimit`                 | Tamaño del fragmento de mensaje            | `2000`           |
| `channels.feishu.mediaMaxMb`                     | Límite de tamaño de archivos multimedia    | `30`             |
| `channels.feishu.streaming`                      | Salida de tarjeta en streaming             | `true`           |
| `channels.feishu.blockStreaming`                 | Streaming a nivel de bloque                | `true`           |
| `channels.feishu.typingIndicator`                | Envía reacciones de escritura              | `true`           |
| `channels.feishu.resolveSenderNames`             | Resuelve nombres para mostrar del remitente | `true`           |

---

## Tipos de mensaje compatibles

### Recibir

- ✅ Texto
- ✅ Texto enriquecido (post)
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Vídeo/multimedia
- ✅ Stickers

### Enviar

- ✅ Texto
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Vídeo/multimedia
- ✅ Tarjetas interactivas (incluidas actualizaciones en streaming)
- ⚠️ Texto enriquecido (formato de estilo post; no admite todas las capacidades de creación de Feishu/Lark)

### Hilos y respuestas

- ✅ Respuestas en línea
- ✅ Respuestas en hilos
- ✅ Las respuestas multimedia mantienen la compatibilidad con hilos al responder a un mensaje de hilo

---

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Vinculación](/es/channels/pairing) — autenticación por mensaje directo y flujo de vinculación
- [Grupos](/es/channels/groups) — comportamiento de los chats de grupo y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
