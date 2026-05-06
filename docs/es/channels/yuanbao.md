---
read_when:
    - Quieres conectar un bot de Yuanbao
    - Está configurando el canal Yuanbao
summary: Descripción general, funciones y configuración del bot de Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-05-06T05:28:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3830af0206854e500132edfc9340724fe97f90ca60fa23ce05202d96d9cacf04
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao es la plataforma de asistente de IA de Tencent. El Plugin de canal de OpenClaw
conecta bots de Yuanbao a OpenClaw mediante WebSocket para que puedan interactuar con los usuarios
a través de mensajes directos y chats grupales.

**Estado:** listo para producción para MD de bots + chats grupales. WebSocket es el único modo de conexión compatible.

---

## Inicio rápido

> **Requiere OpenClaw 2026.4.10 o superior.** Ejecuta `openclaw --version` para comprobarlo. Actualiza con `openclaw update`.

<Steps>
  <Step title="Agrega el canal Yuanbao con tus credenciales">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  El valor de `--token` usa el formato `appKey:appSecret` separado por dos puntos. Puedes obtenerlos desde la aplicación Yuanbao creando un robot en la configuración de tu aplicación.
  </Step>

  <Step title="Cuando finalice la configuración, reinicia el gateway para aplicar los cambios">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Configuración interactiva (alternativa)

También puedes usar el asistente interactivo:

```bash
openclaw channels login --channel yuanbao
```

Sigue las indicaciones para introducir tu App ID y App Secret.

---

## Control de acceso

### Mensajes directos

Configura `dmPolicy` para controlar quién puede enviar MD al bot:

- `"pairing"` - los usuarios desconocidos reciben un código de emparejamiento; apruébalo mediante la CLI
- `"allowlist"` - solo los usuarios listados en `allowFrom` pueden chatear
- `"open"` - permite todos los usuarios (predeterminado)
- `"disabled"` - deshabilita todos los MD

**Aprobar una solicitud de emparejamiento:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Chats grupales

**Requisito de mención** (`channels.yuanbao.requireMention`):

- `true` - requiere @mención (predeterminado)
- `false` - responde sin @mención

Responder al mensaje del bot en un chat grupal se trata como una mención implícita.

---

## Ejemplos de configuración

### Configuración básica con política de MD abierta

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

### Restringir MD a usuarios específicos

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

### Deshabilitar el requisito de @mención en grupos

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### Optimizar la entrega de mensajes salientes

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### Ajustar la estrategia merge-text

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

---

## Comandos comunes

| Comando    | Descripción                  |
| ---------- | ---------------------------- |
| `/help`    | Muestra los comandos disponibles |
| `/status`  | Muestra el estado del bot    |
| `/new`     | Inicia una sesión nueva      |
| `/stop`    | Detiene la ejecución actual  |
| `/restart` | Reinicia OpenClaw            |
| `/compact` | Compacta el contexto de la sesión |

> Yuanbao admite menús nativos de comandos de barra. Los comandos se sincronizan automáticamente con la plataforma cuando se inicia el Gateway.

---

## Solución de problemas

### El bot no responde en chats grupales

1. Asegúrate de que el bot esté agregado al grupo
2. Asegúrate de @mencionar al bot (requerido de forma predeterminada)
3. Revisa los registros: `openclaw logs --follow`

### El bot no recibe mensajes

1. Asegúrate de que el bot esté creado y aprobado en la aplicación Yuanbao
2. Asegúrate de que `appKey` y `appSecret` estén configurados correctamente
3. Asegúrate de que el gateway esté en ejecución: `openclaw gateway status`
4. Revisa los registros: `openclaw logs --follow`

### El bot envía respuestas vacías o de reserva

1. Comprueba si el modelo de IA está devolviendo contenido válido
2. La respuesta de reserva predeterminada es: "暂时无法解答，你可以换个问题问问我哦"
3. Personalízala mediante `channels.yuanbao.fallbackReply`

### Se filtró App Secret

1. Restablece App Secret en YuanBao APP
2. Actualiza el valor en tu configuración
3. Reinicia el gateway: `openclaw gateway restart`

---

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

- `maxChars` - cantidad máxima de caracteres de un mensaje individual (predeterminado: `3000` caracteres)
- `mediaMaxMb` - límite de carga/descarga de medios (predeterminado: `20` MB)
- `overflowPolicy` - comportamiento cuando el mensaje supera el límite: `"split"` (predeterminado) o `"stop"`

### Streaming

Yuanbao admite salida de streaming a nivel de bloque. Cuando está habilitado, el bot envía texto en fragmentos a medida que lo genera.

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

### Contexto del historial de chat grupal

Controla cuántos mensajes históricos se incluyen en el contexto de IA para los chats grupales:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### Modo responder a

Controla cómo el bot cita mensajes al responder en chats grupales:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Valor     | Comportamiento                                           |
| --------- | -------------------------------------------------------- |
| `"off"`   | Sin respuesta citada                                     |
| `"first"` | Cita solo la primera respuesta por mensaje entrante (predeterminado) |
| `"all"`   | Cita cada respuesta                                      |

### Inyección de sugerencia de Markdown

De forma predeterminada, el bot inyecta instrucciones en el prompt del sistema para evitar que el modelo de IA envuelva toda la respuesta en bloques de código markdown.

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

Habilita la salida de registros sin sanear para IDs de bot específicos:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Enrutamiento multiagente

Usa `bindings` para enrutar MD o grupos de Yuanbao a diferentes agentes.

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

Campos de enrutamiento:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (MD) o `"group"` (chat grupal)
- `match.peer.id`: ID de usuario o código de grupo

---

## Referencia de configuración

Configuración completa: [Configuración de Gateway](/es/gateway/configuration)

| Ajuste                                     | Descripción                                       | Predeterminado                         |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Habilita/deshabilita el canal                     | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Cuenta predeterminada para enrutamiento saliente  | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (usada para firma y generación de tickets) | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (usada para firma)                     | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | Token firmado previamente (omite la firma automática de tickets) | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | Nombre para mostrar de la cuenta                  | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Habilita/deshabilita una cuenta específica        | `true`                                 |
| `channels.yuanbao.dm.policy`               | Política de MD                                    | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | Lista de permitidos de MD (lista de IDs de usuario) | -                                      |
| `channels.yuanbao.requireMention`          | Requiere @mención en grupos                       | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Manejo de mensajes largos (`split` o `stop`)      | `split`                                |
| `channels.yuanbao.replyToMode`             | Estrategia de responder a en grupo (`off`, `first`, `all`) | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | Estrategia saliente (`merge-text` o `immediate`)  | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text: caracteres mínimos para activar el envío | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text: caracteres máximos por mensaje        | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text: tiempo de espera de inactividad antes del vaciado automático (ms) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | Límite de tamaño de medios (MB)                   | `20`                                   |
| `channels.yuanbao.historyLimit`            | Entradas de contexto de historial de chat grupal  | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | Deshabilita la salida de streaming a nivel de bloque | `false`                                |
| `channels.yuanbao.fallbackReply`           | Respuesta de reserva cuando la IA no devuelve contenido | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Inyecta instrucciones contra el envoltorio en markdown | `true`                                 |
| `channels.yuanbao.debugBotIds`             | IDs de bot de lista blanca de depuración (registros sin sanear) | `[]`                                   |

---

## Tipos de mensaje compatibles

### Recibir

- ✅ Texto
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio / Voz
- ✅ Video
- ✅ Stickers / Emoji personalizado
- ✅ Elementos personalizados (tarjetas de enlace, etc.)

### Enviar

- ✅ Texto (con compatibilidad con markdown)
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Video
- ✅ Stickers

### Hilos y respuestas

- ✅ Respuestas citadas (configurables mediante `replyToMode`)
- ❌ Respuestas en hilo (no compatibles con la plataforma)

---

## Relacionado

- [Resumen de canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - autenticación de MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento de chat grupal y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y fortalecimiento
