---
read_when:
    - Quieres conectar un bot de Yuanbao
    - Estás configurando el canal Yuanbao
summary: Descripción general, funciones y configuración del bot Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-04-30T05:31:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 16
---

# Yuanbao

Tencent Yuanbao es la plataforma de asistente de IA de Tencent. El Plugin de canal de OpenClaw
conecta bots de Yuanbao con OpenClaw mediante WebSocket para que puedan interactuar con usuarios
a través de mensajes directos y chats grupales.

**Estado:** listo para producción para mensajes directos de bot + chats grupales. WebSocket es el único modo de conexión admitido.

---

## Inicio rápido

> **Requiere OpenClaw 2026.4.10 o superior.** Ejecuta `openclaw --version` para comprobarlo. Actualiza con `openclaw update`.

<Steps>
  <Step title="Agrega el canal Yuanbao con tus credenciales">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  El valor de `--token` usa el formato `appKey:appSecret` separado por dos puntos. Puedes obtenerlos desde la app de Yuanbao creando un robot en la configuración de tu aplicación.
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

Configura `dmPolicy` para controlar quién puede enviar mensajes directos al bot:

- `"pairing"` — los usuarios desconocidos reciben un código de emparejamiento; apruébalo mediante la CLI
- `"allowlist"` — solo pueden chatear los usuarios listados en `allowFrom`
- `"open"` — permite todos los usuarios (predeterminado)
- `"disabled"` — desactiva todos los mensajes directos

**Aprobar una solicitud de emparejamiento:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Chats grupales

**Requisito de mención** (`channels.yuanbao.requireMention`):

- `true` — requiere @mención (predeterminado)
- `false` — responde sin @mención

Responder al mensaje del bot en un chat grupal se trata como una mención implícita.

---

## Ejemplos de configuración

### Configuración básica con política de mensajes directos abierta

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

### Restringir mensajes directos a usuarios específicos

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

### Desactivar el requisito de @mención en grupos

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
      // Enviar cada fragmento de inmediato sin buffer
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### Ajustar la estrategia de fusión de texto

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer hasta alcanzar esta cantidad de caracteres
      maxChars: 3000, // forzar división por encima de este límite
      idleMs: 5000, // vaciado automático tras el tiempo de espera de inactividad (ms)
    },
  },
}
```

---

## Comandos comunes

| Comando    | Descripción                         |
| ---------- | ----------------------------------- |
| `/help`    | Muestra los comandos disponibles    |
| `/status`  | Muestra el estado del bot           |
| `/new`     | Inicia una nueva sesión             |
| `/stop`    | Detiene la ejecución actual         |
| `/restart` | Reinicia OpenClaw                   |
| `/compact` | Compacta el contexto de la sesión   |

> Yuanbao admite menús nativos de comandos con barra. Los comandos se sincronizan automáticamente con la plataforma cuando se inicia el gateway.

---

## Solución de problemas

### El bot no responde en chats grupales

1. Asegúrate de que el bot se haya agregado al grupo
2. Asegúrate de @mencionar al bot (requerido de forma predeterminada)
3. Revisa los registros: `openclaw logs --follow`

### El bot no recibe mensajes

1. Asegúrate de que el bot esté creado y aprobado en la app de Yuanbao
2. Asegúrate de que `appKey` y `appSecret` estén configurados correctamente
3. Asegúrate de que el gateway esté en ejecución: `openclaw gateway status`
4. Revisa los registros: `openclaw logs --follow`

### El bot envía respuestas vacías o alternativas

1. Comprueba si el modelo de IA está devolviendo contenido válido
2. La respuesta alternativa predeterminada es: "暂时无法解答，你可以换个问题问问我哦"
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

- `maxChars` — recuento máximo de caracteres de un solo mensaje (predeterminado: `3000` caracteres)
- `mediaMaxMb` — límite de carga/descarga de medios (predeterminado: `20` MB)
- `overflowPolicy` — comportamiento cuando el mensaje supera el límite: `"split"` (predeterminado) o `"stop"`

### Streaming

Yuanbao admite salida de streaming a nivel de bloque. Cuando está activado, el bot envía texto en fragmentos a medida que lo genera.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // streaming por bloques activado (predeterminado)
    },
  },
}
```

Establece `disableBlockStreaming: true` para enviar la respuesta completa en un solo mensaje.

### Contexto del historial de chat grupal

Controla cuántos mensajes históricos se incluyen en el contexto de IA para chats grupales:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // predeterminado: 100, establece 0 para desactivar
    },
  },
}
```

### Modo de respuesta a mensajes

Controla cómo el bot cita mensajes al responder en chats grupales:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (predeterminado: "first")
    },
  },
}
```

| Valor     | Comportamiento                                                   |
| --------- | ---------------------------------------------------------------- |
| `"off"`   | Sin respuesta citada                                             |
| `"first"` | Cita solo la primera respuesta por mensaje entrante (predeterminado) |
| `"all"`   | Cita cada respuesta                                              |

### Inyección de indicación de Markdown

De forma predeterminada, el bot inyecta instrucciones en el prompt del sistema para evitar que el modelo de IA envuelva toda la respuesta en bloques de código markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // predeterminado: true
    },
  },
}
```

### Modo de depuración

Activa la salida de registros sin sanitizar para IDs de bot específicos:

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

Usa `bindings` para enrutar mensajes directos o grupos de Yuanbao a distintos agentes.

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
- `match.peer.kind`: `"direct"` (mensaje directo) o `"group"` (chat grupal)
- `match.peer.id`: ID de usuario o código de grupo

---

## Referencia de configuración

Configuración completa: [Configuración del Gateway](/es/gateway/configuration)

| Ajuste                                     | Descripción                                       | Predeterminado                        |
| ------------------------------------------ | ------------------------------------------------- | ------------------------------------- |
| `channels.yuanbao.enabled`                 | Activa/desactiva el canal                         | `true`                                |
| `channels.yuanbao.defaultAccount`          | Cuenta predeterminada para enrutamiento saliente  | `default`                             |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (usada para firma y generación de tickets) | —                                    |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (usada para firma)                     | —                                     |
| `channels.yuanbao.accounts.<id>.token`     | Token prefirmado (omite la firma automática de tickets) | —                              |
| `channels.yuanbao.accounts.<id>.name`      | Nombre visible de la cuenta                       | —                                     |
| `channels.yuanbao.accounts.<id>.enabled`   | Activa/desactiva una cuenta específica            | `true`                                |
| `channels.yuanbao.dm.policy`               | Política de mensajes directos                     | `open`                                |
| `channels.yuanbao.dm.allowFrom`            | Lista de permitidos de mensajes directos (lista de IDs de usuario) | —                    |
| `channels.yuanbao.requireMention`          | Requiere @mención en grupos                       | `true`                                |
| `channels.yuanbao.overflowPolicy`          | Manejo de mensajes largos (`split` o `stop`)      | `split`                               |
| `channels.yuanbao.replyToMode`             | Estrategia de respuesta citada en grupo (`off`, `first`, `all`) | `first`              |
| `channels.yuanbao.outboundQueueStrategy`   | Estrategia saliente (`merge-text` o `immediate`)  | `merge-text`                          |
| `channels.yuanbao.minChars`                | Merge-text: caracteres mínimos para activar el envío | `2800`                             |
| `channels.yuanbao.maxChars`                | Merge-text: caracteres máximos por mensaje        | `3000`                                |
| `channels.yuanbao.idleMs`                  | Merge-text: tiempo de espera de inactividad antes del vaciado automático (ms) | `5000` |
| `channels.yuanbao.mediaMaxMb`              | Límite de tamaño de medios (MB)                   | `20`                                  |
| `channels.yuanbao.historyLimit`            | Entradas de contexto de historial de chat grupal  | `100`                                 |
| `channels.yuanbao.disableBlockStreaming`   | Desactiva la salida de streaming a nivel de bloque | `false`                              |
| `channels.yuanbao.fallbackReply`           | Respuesta alternativa cuando la IA no devuelve contenido | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Inyecta instrucciones contra el envoltorio en markdown | `true`                            |
| `channels.yuanbao.debugBotIds`             | IDs de bot en lista de depuración permitida (registros sin sanitizar) | `[]`                 |

---

## Tipos de mensaje admitidos

### Recibir

- ✅ Texto
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio / Voz
- ✅ Vídeo
- ✅ Stickers / Emojis personalizados
- ✅ Elementos personalizados (tarjetas de enlace, etc.)

### Enviar

- ✅ Texto (con compatibilidad con markdown)
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Vídeo
- ✅ Stickers

### Hilos y respuestas

- ✅ Respuestas citadas (configurable mediante `replyToMode`)
- ❌ Respuestas en hilo (no admitidas por la plataforma)

---

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats grupales y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
