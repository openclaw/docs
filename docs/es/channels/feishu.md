---
read_when:
    - Quieres conectar un bot de Feishu/Lark
    - Estás configurando el canal de Feishu
summary: Descripción general, funciones y configuración del bot de Feishu
title: Feishu
x-i18n:
    generated_at: "2026-05-03T21:27:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16d8156d215d47fa6e7d810e3a70eb8e84176a681669c27de8f58320be83a7a0
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark es una plataforma de colaboración todo en uno donde los equipos chatean, comparten documentos, gestionan calendarios y trabajan juntos.

**Estado:** listo para producción para mensajes directos del bot + chats grupales. WebSocket es el modo predeterminado; el modo Webhook es opcional.

---

## Inicio rápido

<Note>
Requiere OpenClaw 2026.4.25 o superior. Ejecuta `openclaw --version` para comprobarlo. Actualiza con `openclaw update`.
</Note>

<Steps>
  <Step title="Ejecuta el asistente de configuración del canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Escanea el código QR con tu aplicación móvil de Feishu/Lark para crear automáticamente un bot de Feishu/Lark.
  </Step>
  
  <Step title="Cuando finalice la configuración, reinicia el Gateway para aplicar los cambios">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Control de acceso

### Mensajes directos

Configura `dmPolicy` para controlar quién puede enviar mensajes directos al bot:

- `"pairing"` — los usuarios desconocidos reciben un código de emparejamiento; apruébalo mediante la CLI
- `"allowlist"` — solo pueden chatear los usuarios enumerados en `allowFrom` (valor predeterminado: solo el propietario del bot)
- `"open"` — permite mensajes directos públicos solo cuando `allowFrom` incluye `"*"`; con entradas restrictivas, solo pueden chatear los usuarios coincidentes
- `"disabled"` — desactiva todos los mensajes directos

**Aprobar una solicitud de emparejamiento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chats grupales

**Política de grupo** (`channels.feishu.groupPolicy`):

| Valor         | Comportamiento                                                                              |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Responde a todos los mensajes en grupos                                                      |
| `"allowlist"` | Solo responde a grupos en `groupAllowFrom` o configurados explícitamente en `groups.<chat_id>` |
| `"disabled"`  | Desactiva todos los mensajes grupales; las entradas explícitas `groups.<chat_id>` no lo anulan |

Predeterminado: `allowlist`

**Requisito de mención** (`channels.feishu.requireMention`):

- `true` — requiere @mención (predeterminado)
- `false` — responde sin @mención
- Anulación por grupo: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` y `@_all` de solo difusión no se tratan como menciones al bot. Un mensaje que menciona tanto a `@all` como directamente al bot sigue contando como una mención al bot.

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

### Permitir todos los grupos, seguir requiriendo @mención

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

En modo `allowlist`, también puedes admitir un grupo agregando una entrada explícita `groups.<chat_id>`. Las entradas explícitas no anulan `groupPolicy: "disabled"`. Los valores predeterminados comodín en `groups.*` configuran grupos coincidentes, pero no admiten grupos por sí solos.

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

---

<a id="get-groupuser-ids"></a>

## Obtener IDs de grupo/usuario

### IDs de grupo (`chat_id`, formato: `oc_xxx`)

Abre el grupo en Feishu/Lark, haz clic en el icono de menú en la esquina superior derecha y ve a **Configuración**. El ID del grupo (`chat_id`) aparece en la página de configuración.

![Obtener ID de grupo](/images/feishu-get-group-id.png)

### IDs de usuario (`open_id`, formato: `ou_xxx`)

Inicia el Gateway, envía un mensaje directo al bot y luego revisa los registros:

```bash
openclaw logs --follow
```

Busca `open_id` en la salida del registro. También puedes revisar las solicitudes de emparejamiento pendientes:

```bash
openclaw pairing list feishu
```

---

## Comandos comunes

| Comando   | Descripción                 |
| --------- | --------------------------- |
| `/status` | Muestra el estado del bot   |
| `/reset`  | Restablece la sesión actual |
| `/model`  | Muestra o cambia el modelo de IA |

<Note>
Feishu/Lark no admite menús nativos de comandos con barra, así que envíalos como mensajes de texto sin formato.
</Note>

---

## Solución de problemas

### El bot no responde en chats grupales

1. Asegúrate de que el bot se haya agregado al grupo
2. Asegúrate de @mencionar al bot (requerido de forma predeterminada)
3. Verifica que `groupPolicy` no sea `"disabled"`
4. Revisa los registros: `openclaw logs --follow`

### El bot no recibe mensajes

1. Asegúrate de que el bot esté publicado y aprobado en Feishu Open Platform / Lark Developer
2. Asegúrate de que la suscripción a eventos incluya `im.message.receive_v1`
3. Asegúrate de que esté seleccionada la **conexión persistente** (WebSocket)
4. Asegúrate de que todos los ámbitos de permisos requeridos estén concedidos
5. Asegúrate de que el Gateway esté en ejecución: `openclaw gateway status`
6. Revisa los registros: `openclaw logs --follow`

### App Secret filtrado

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

`defaultAccount` controla qué cuenta se usa cuando las API salientes no especifican un `accountId`.
`accounts.<id>.tts` usa la misma forma que `messages.tts` y se fusiona en profundidad sobre
la configuración global de TTS, por lo que las configuraciones de Feishu con varios bots pueden mantener las credenciales
compartidas del proveedor globalmente mientras anulan solo la voz, el modelo, la persona o el modo automático
por cuenta.

### Límites de mensajes

- `textChunkLimit` — tamaño de fragmento de texto saliente (predeterminado: `2000` caracteres)
- `mediaMaxMb` — límite de carga/descarga de medios (predeterminado: `30` MB)

### Streaming

Feishu/Lark admite respuestas en streaming mediante tarjetas interactivas. Cuando está activado, el bot actualiza la tarjeta en tiempo real a medida que genera texto.

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

Configura `streaming: false` para enviar la respuesta completa en un solo mensaje. `blockStreaming` está desactivado de forma predeterminada; actívalo solo cuando quieras que los bloques completados del asistente se envíen antes de la respuesta final.

### Optimización de cuota

Reduce la cantidad de llamadas a la API de Feishu/Lark con dos marcas opcionales:

- `typingIndicator` (predeterminado `true`): establece `false` para omitir las llamadas de reacción de escritura
- `resolveSenderNames` (predeterminado `true`): establece `false` para omitir las búsquedas de perfil del remitente

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

Feishu/Lark admite ACP para mensajes directos y mensajes en hilos de grupo. ACP de Feishu/Lark se controla mediante comandos de texto: no hay menús nativos de comandos con barra, así que usa mensajes `/acp ...` directamente en la conversación.

#### Enlace ACP persistente

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

`--thread here` funciona para mensajes directos y mensajes en hilos de Feishu/Lark. Los mensajes de seguimiento en la conversación enlazada se enrutan directamente a esa sesión ACP.

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
- `match.peer.kind`: `"direct"` (mensaje directo) o `"group"` (chat grupal)
- `match.peer.id`: Open ID de usuario (`ou_xxx`) o ID de grupo (`oc_xxx`)

Consulta [Obtener IDs de grupo/usuario](#get-groupuser-ids) para consejos de búsqueda.

---

## Referencia de configuración

Configuración completa: [Configuración del Gateway](/es/gateway/configuration)

| Configuración                                     | Descripción                                                                                         | Predeterminado  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------- |
| `channels.feishu.enabled`                         | Habilitar/deshabilitar el canal                                                                     | `true`          |
| `channels.feishu.domain`                          | Dominio de API (`feishu` o `lark`)                                                                  | `feishu`        |
| `channels.feishu.connectionMode`                  | Transporte de eventos (`websocket` o `webhook`)                                                     | `websocket`     |
| `channels.feishu.defaultAccount`                  | Cuenta predeterminada para enrutamiento saliente                                                    | `default`       |
| `channels.feishu.verificationToken`               | Requerido para el modo Webhook                                                                      | —               |
| `channels.feishu.encryptKey`                      | Requerido para el modo Webhook                                                                      | —               |
| `channels.feishu.webhookPath`                     | Ruta de Webhook                                                                                     | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host de enlace de Webhook                                                                           | `127.0.0.1`     |
| `channels.feishu.webhookPort`                     | Puerto de enlace de Webhook                                                                         | `3000`          |
| `channels.feishu.accounts.<id>.appId`             | ID de aplicación                                                                                    | —               |
| `channels.feishu.accounts.<id>.appSecret`         | Secreto de aplicación                                                                               | —               |
| `channels.feishu.accounts.<id>.domain`            | Sustitución de dominio por cuenta                                                                   | `feishu`        |
| `channels.feishu.accounts.<id>.tts`               | Sustitución de TTS por cuenta                                                                       | `messages.tts`  |
| `channels.feishu.dmPolicy`                        | Política de DM                                                                                      | `allowlist`     |
| `channels.feishu.allowFrom`                       | Lista de permitidos de DM (lista de open_id)                                                        | [BotOwnerId]    |
| `channels.feishu.groupPolicy`                     | Política de grupo                                                                                   | `allowlist`     |
| `channels.feishu.groupAllowFrom`                  | Lista de permitidos de grupo                                                                        | —               |
| `channels.feishu.requireMention`                  | Requerir @mention en grupos                                                                         | `true`          |
| `channels.feishu.groups.<chat_id>.requireMention` | Sustitución de @mention por grupo; los ID explícitos también admiten el grupo en modo allowlist      | heredado        |
| `channels.feishu.groups.<chat_id>.enabled`        | Habilitar/deshabilitar un grupo específico                                                          | `true`          |
| `channels.feishu.textChunkLimit`                  | Tamaño de fragmento de mensaje                                                                      | `2000`          |
| `channels.feishu.mediaMaxMb`                      | Límite de tamaño de medios                                                                          | `30`            |
| `channels.feishu.streaming`                       | Salida de tarjeta en streaming                                                                      | `true`          |
| `channels.feishu.blockStreaming`                  | Streaming de respuestas de bloques completados                                                      | `false`         |
| `channels.feishu.typingIndicator`                 | Enviar reacciones de escritura                                                                      | `true`          |
| `channels.feishu.resolveSenderNames`              | Resolver nombres visibles de remitentes                                                             | `true`          |

---

## Tipos de mensaje compatibles

### Recepción

- ✅ Texto
- ✅ Texto enriquecido (post)
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Vídeo/medios
- ✅ Stickers

Los mensajes de audio entrantes de Feishu/Lark se normalizan como marcadores de posición de medios en lugar de JSON `file_key` sin procesar. Cuando `tools.media.audio` está configurado, OpenClaw descarga el recurso de nota de voz y ejecuta la transcripción de audio compartida antes del turno del agente, por lo que el agente recibe la transcripción hablada. Si Feishu incluye texto de transcripción directamente en la carga de audio, ese texto se usa sin otra llamada ASR. Sin un proveedor de transcripción de audio, el agente sigue recibiendo un marcador de posición `<media:audio>` más el adjunto guardado, no la carga del recurso de Feishu sin procesar.

### Envío

- ✅ Texto
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Vídeo/medios
- ✅ Tarjetas interactivas (incluidas actualizaciones en streaming)
- ⚠️ Texto enriquecido (formato de estilo post; no admite todas las capacidades de autoría de Feishu/Lark)

Las burbujas de audio nativas de Feishu/Lark usan el tipo de mensaje `audio` de Feishu y requieren medios de carga Ogg/Opus (`file_type: "opus"`). Los medios `.opus` y `.ogg` existentes se envían directamente como audio nativo. MP3/WAV/M4A y otros formatos probablemente de audio se transcodifican a Ogg/Opus de 48 kHz con `ffmpeg` solo cuando la respuesta solicita entrega por voz (`audioAsVoice` / herramienta de mensajes `asVoice`, incluidas respuestas de nota de voz TTS). Los adjuntos MP3 ordinarios permanecen como archivos normales. Si falta `ffmpeg` o la conversión falla, OpenClaw recurre a un adjunto de archivo y registra el motivo.

### Hilos y respuestas

- ✅ Respuestas en línea
- ✅ Respuestas en hilos
- ✅ Las respuestas con medios siguen siendo conscientes del hilo al responder a un mensaje de hilo

Para `groupSessionScope: "group_topic"` y `"group_topic_sender"`, los grupos de temas nativos de Feishu/Lark usan el `thread_id` del evento (`omt_*`) como clave canónica de sesión de tema. Las respuestas de grupo normales que OpenClaw convierte en hilos siguen usando el ID del mensaje raíz de respuesta (`om_*`) para que el primer turno y el turno de seguimiento permanezcan en la misma sesión.

---

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat de grupo y control de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo
