---
read_when:
    - Quieres conectar un bot de Yuanbao
    - Estás configurando el canal Yuanbao
summary: Descripción general, funciones y configuración del bot Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-07-05T11:06:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao es la plataforma de asistente de IA de Tencent. El Plugin `openclaw-plugin-yuanbao`, mantenido por la comunidad, conecta bots de Yuanbao con OpenClaw mediante WebSocket para mensajes directos y chats grupales.

**Estado:** listo para producción para mensajes directos de bots y chats grupales. WebSocket es el único modo de conexión compatible. Este Plugin lo mantiene el equipo de Tencent Yuanbao como una entrada de catálogo externa, no el núcleo de OpenClaw; los detalles de configuración/comportamiento siguientes (más allá de la instalación y la superficie genérica de la CLI) provienen de la documentación propia del Plugin y no se han verificado contra el código fuente del núcleo de OpenClaw.

## Inicio rápido

Requiere OpenClaw 2026.4.10 o superior. Compruébalo con `openclaw --version`; actualiza con `openclaw update`.

<Steps>
  <Step title="Añade el canal Yuanbao con tus credenciales">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` usa `appKey:appSecret` separado por dos puntos. Obtén estos valores desde la aplicación Yuanbao creando un bot en la configuración de tu aplicación.
  </Step>

  <Step title="Reinicia el gateway para aplicar el cambio">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Configuración interactiva (alternativa)

```bash
openclaw channels login --channel yuanbao
```

Sigue las indicaciones para introducir tu App ID y App Secret.

## Control de acceso

### Mensajes directos

`channels.yuanbao.dm.policy`:

| Valor            | Comportamiento                                          |
| ---------------- | ------------------------------------------------------- |
| `open` (predeterminado) | Permite todos los usuarios                         |
| `pairing`        | Los usuarios desconocidos reciben un código de emparejamiento; aprueba mediante CLI |
| `allowlist`      | Solo pueden chatear los usuarios de `allowFrom`         |
| `disabled`       | Desactiva todos los mensajes directos                   |

Aprueba una solicitud de emparejamiento:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Chats grupales

`channels.yuanbao.requireMention` (predeterminado `true`): requiere una @mención antes de que el bot responda en un grupo. Responder al propio mensaje del bot se trata como una mención implícita.

## Ejemplos de configuración

Configuración básica, política de mensajes directos abierta:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

Restringir mensajes directos a usuarios específicos:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

Desactivar el requisito de @mención en grupos:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

Ajuste de entrega saliente:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

Establece `outboundQueueStrategy: "immediate"` para enviar cada fragmento sin búfer.

## Comandos comunes

| Comando    | Descripción                 |
| ---------- | --------------------------- |
| `/help`    | Muestra los comandos disponibles |
| `/status`  | Muestra el estado del bot   |
| `/new`     | Inicia una sesión nueva     |
| `/stop`    | Detiene la ejecución actual |
| `/restart` | Reinicia OpenClaw           |
| `/compact` | Compacta el contexto de la sesión |

Yuanbao admite menús nativos de comandos slash; los comandos se sincronizan automáticamente con la plataforma cuando se inicia el gateway.

## Solución de problemas

**El bot no responde en chats grupales:**

1. Confirma que el bot se haya añadido al grupo
2. Confirma que @mencionas al bot (obligatorio de forma predeterminada)
3. Revisa los registros: `openclaw logs --follow`

**El bot no recibe mensajes:**

1. Confirma que el bot se haya creado y aprobado en la aplicación Yuanbao
2. Confirma que `appKey` y `appSecret` estén configurados correctamente
3. Confirma que el gateway esté en ejecución: `openclaw gateway status`
4. Revisa los registros: `openclaw logs --follow`

**El bot envía respuestas vacías o de fallback:**

1. Comprueba si el modelo de IA está devolviendo contenido válido
2. Respuesta de fallback predeterminada: "暂时无法解答，你可以换个问题问问我哦"
3. Personaliza con `channels.yuanbao.fallbackReply`

**App Secret filtrado:**

1. Restablece el App Secret en la aplicación Yuanbao
2. Actualiza el valor en tu configuración
3. Reinicia el gateway: `openclaw gateway restart`

## Configuración avanzada

### Varias cuentas

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
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

- `maxChars`: número máximo de caracteres de un solo mensaje (predeterminado `3000`)
- `mediaMaxMb`: límite de carga/descarga de medios (predeterminado `20` MB)
- `overflowPolicy`: comportamiento cuando un mensaje supera el límite, `"split"` (predeterminado) o `"stop"`

### Streaming

Yuanbao admite salida de streaming a nivel de bloque; el bot envía texto en fragmentos a medida que lo genera.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

Establece `disableBlockStreaming: true` para enviar la respuesta completa en un solo mensaje.

### Contexto de historial de chats grupales

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

Controla cuántos mensajes históricos se incluyen en el contexto de IA para chats grupales.

### Modo de respuesta a

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Valor   | Comportamiento                                                 |
| ------- | -------------------------------------------------------------- |
| `off`   | Sin respuesta citada                                           |
| `first` | Cita solo la primera respuesta por mensaje entrante (predeterminado) |
| `all`   | Cita cada respuesta                                            |

### Inyección de sugerencia de Markdown

De forma predeterminada, el bot inyecta una instrucción de prompt de sistema para impedir que el modelo envuelva toda la respuesta en un bloque de código Markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### Modo de depuración

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

Activa la salida de registros sin sanitizar para los IDs de bot indicados.

### Enrutamiento multiagente

Usa `bindings` para enrutar mensajes directos o grupos de Yuanbao a distintos agentes:

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
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (mensaje directo) o `"group"` (chat grupal)
- `match.peer.id`: ID de usuario o código de grupo

## Referencia de configuración

Configuración completa: [Configuración del Gateway](/es/gateway/configuration)

| Ajuste                                     | Descripción                                       | Predeterminado                         |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Activar/desactivar el canal                       | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Cuenta predeterminada para enrutamiento saliente  | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (firma + generación de ticket)            | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (firma)                                | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | Token prefirmado (omite la firma automática de ticket) | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | Nombre visible de la cuenta                       | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Activar/desactivar una cuenta específica          | `true`                                 |
| `channels.yuanbao.dm.policy`               | Política de mensajes directos                     | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | Allowlist de mensajes directos (lista de IDs de usuario) | -                                      |
| `channels.yuanbao.requireMention`          | Requerir @mención en grupos                       | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Manejo de mensajes largos (`split` o `stop`)      | `split`                                |
| `channels.yuanbao.replyToMode`             | Estrategia de respuesta a en grupo (`off`, `first`, `all`) | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | Estrategia saliente (`merge-text` o `immediate`)  | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text: caracteres mínimos para activar el envío | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text: caracteres máximos por mensaje        | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text: tiempo de inactividad antes del auto-flush (ms) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | Límite de tamaño de medios (MB)                   | `20`                                   |
| `channels.yuanbao.historyLimit`            | Entradas de contexto de historial de chats grupales | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | Desactivar salida de streaming a nivel de bloque  | `false`                                |
| `channels.yuanbao.fallbackReply`           | Respuesta de fallback cuando el modelo no devuelve contenido | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Inyectar instrucciones antienvoltura de Markdown  | `true`                                 |
| `channels.yuanbao.debugBotIds`             | IDs de bot de allowlist de depuración (registros sin sanitizar) | `[]`                                   |

## Tipos de mensaje compatibles

**Recepción:** texto, imágenes, archivos, audio/voz, video, stickers/emoji personalizados, elementos personalizados (tarjetas de enlace).

**Envío:** texto (Markdown), imágenes, archivos, audio, video, stickers.

**Hilos y respuestas:** respuestas citadas (configurables mediante `replyToMode`); la plataforma no admite respuestas en hilos.

## Relacionado

- [Resumen de canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento de chats grupales y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y endurecimiento
