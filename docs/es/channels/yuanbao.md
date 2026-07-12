---
read_when:
    - Quieres conectar un bot de Yuanbao
    - Estás configurando el canal Yuanbao
summary: Descripción general, funciones y configuración del bot Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-07-11T22:56:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao es la plataforma de asistente de IA de Tencent. El plugin `openclaw-plugin-yuanbao`, mantenido por la comunidad, conecta bots de Yuanbao con OpenClaw mediante WebSocket para mensajes directos y chats grupales.

**Estado:** listo para producción para mensajes directos a bots y chats grupales. WebSocket es el único modo de conexión compatible. Este plugin es mantenido por el equipo de Tencent Yuanbao como una entrada de catálogo externa, no por el núcleo de OpenClaw; los detalles de configuración y comportamiento que aparecen a continuación (más allá de la instalación y la interfaz genérica de la CLI) proceden de la documentación del propio plugin y no se han verificado con el código fuente del núcleo de OpenClaw.

## Inicio rápido

Requiere OpenClaw 2026.4.10 o posterior. Compruébelo con `openclaw --version`; actualice con `openclaw update`.

<Steps>
  <Step title="Añada el canal Yuanbao con sus credenciales">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` utiliza `appKey:appSecret` separados por dos puntos. Obtenga estos valores de la aplicación de Yuanbao creando un bot en la configuración de su aplicación.
  </Step>

  <Step title="Reinicie el Gateway para aplicar el cambio">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Configuración interactiva (alternativa)

```bash
openclaw channels login --channel yuanbao
```

Siga las indicaciones para introducir su ID de aplicación y su secreto de aplicación.

## Control de acceso

### Mensajes directos

`channels.yuanbao.dm.policy`:

| Valor            | Comportamiento                                                        |
| ---------------- | --------------------------------------------------------------------- |
| `open` (predeterminado) | Permite a todos los usuarios                                   |
| `pairing`        | Los usuarios desconocidos reciben un código de vinculación; apruébelo mediante la CLI |
| `allowlist`      | Solo pueden chatear los usuarios incluidos en `allowFrom`             |
| `disabled`       | Desactiva todos los mensajes directos                                 |

Apruebe una solicitud de vinculación:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Chats grupales

`channels.yuanbao.requireMention` (valor predeterminado: `true`): exige una @mención antes de que el bot responda en un grupo. Responder al propio mensaje del bot se considera una mención implícita.

## Ejemplos de configuración

Configuración básica con una política abierta de mensajes directos:

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

Restrinja los mensajes directos a usuarios específicos:

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

Desactive el requisito de @mención en los grupos:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

Ajuste de la entrega saliente:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // almacenar en búfer hasta alcanzar esta cantidad de caracteres
      maxChars: 3000, // forzar la división por encima de este límite
      idleMs: 5000, // vaciar automáticamente tras el tiempo de espera de inactividad (ms)
    },
  },
}
```

Establezca `outboundQueueStrategy: "immediate"` para enviar cada fragmento sin almacenamiento en búfer.

## Comandos habituales

| Comando    | Descripción                         |
| ---------- | ----------------------------------- |
| `/help`    | Muestra los comandos disponibles    |
| `/status`  | Muestra el estado del bot           |
| `/new`     | Inicia una sesión nueva             |
| `/stop`    | Detiene la ejecución actual         |
| `/restart` | Reinicia OpenClaw                   |
| `/compact` | Compacta el contexto de la sesión   |

Yuanbao admite menús nativos de comandos con barra diagonal; los comandos se sincronizan automáticamente con la plataforma cuando se inicia el Gateway.

## Solución de problemas

**El bot no responde en los chats grupales:**

1. Confirme que el bot se haya añadido al grupo
2. Confirme que haya @mencionado al bot (requerido de forma predeterminada)
3. Consulte los registros: `openclaw logs --follow`

**El bot no recibe mensajes:**

1. Confirme que el bot se haya creado y aprobado en la aplicación de Yuanbao
2. Confirme que `appKey` y `appSecret` estén configurados correctamente
3. Confirme que el Gateway esté en ejecución: `openclaw gateway status`
4. Consulte los registros: `openclaw logs --follow`

**El bot envía respuestas vacías o de reserva:**

1. Compruebe si el modelo de IA devuelve contenido válido
2. Respuesta de reserva predeterminada: "暂时无法解答，你可以换个问题问问我哦"
3. Personalícela con `channels.yuanbao.fallbackReply`

**Se ha filtrado el secreto de aplicación:**

1. Restablezca el secreto de aplicación en la aplicación de Yuanbao
2. Actualice el valor en su configuración
3. Reinicie el Gateway: `openclaw gateway restart`

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

`defaultAccount` controla qué cuenta se utiliza cuando las API salientes no especifican un `accountId`.

### Límites de mensajes

- `maxChars`: cantidad máxima de caracteres de un solo mensaje (valor predeterminado: `3000`)
- `mediaMaxMb`: límite de carga y descarga de contenido multimedia (valor predeterminado: `20` MB)
- `overflowPolicy`: comportamiento cuando un mensaje supera el límite, `"split"` (predeterminado) o `"stop"`

### Transmisión

Yuanbao admite salida transmitida por bloques; el bot envía el texto en fragmentos a medida que lo genera.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // transmisión por bloques activada (predeterminado)
    },
  },
}
```

Establezca `disableBlockStreaming: true` para enviar la respuesta completa en un solo mensaje.

### Contexto del historial de chats grupales

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // predeterminado: 100; establezca 0 para desactivarlo
    },
  },
}
```

Controla cuántos mensajes históricos se incluyen en el contexto de la IA para los chats grupales.

### Modo de respuesta a mensajes

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (predeterminado: "first")
    },
  },
}
```

| Valor   | Comportamiento                                                                  |
| ------- | ------------------------------------------------------------------------------- |
| `off`   | Sin respuesta con cita                                                          |
| `first` | Cita solo la primera respuesta por cada mensaje entrante (predeterminado)       |
| `all`   | Cita todas las respuestas                                                       |

### Inyección de indicaciones para Markdown

De forma predeterminada, el bot inyecta una instrucción en el mensaje del sistema para impedir que el modelo encierre toda la respuesta en un bloque de código Markdown.

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

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

Activa la salida de registros sin depurar para los identificadores de bot indicados.

### Enrutamiento multiagente

Utilice `bindings` para enrutar los mensajes directos o grupos de Yuanbao a distintos agentes:

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
- `match.peer.id`: identificador de usuario o código de grupo

## Referencia de configuración

Configuración completa: [Configuración del Gateway](/es/gateway/configuration)

| Ajuste                                     | Descripción                                                      | Valor predeterminado                     |
| ------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------- |
| `channels.yuanbao.enabled`                 | Activa o desactiva el canal                                      | `true`                                   |
| `channels.yuanbao.defaultAccount`          | Cuenta predeterminada para el enrutamiento saliente              | `default`                                |
| `channels.yuanbao.accounts.<id>.appKey`    | Clave de aplicación (firma y generación de tickets)              | -                                        |
| `channels.yuanbao.accounts.<id>.appSecret` | Secreto de aplicación (firma)                                    | -                                        |
| `channels.yuanbao.accounts.<id>.token`     | Token firmado previamente (omite la firma automática de tickets) | -                                        |
| `channels.yuanbao.accounts.<id>.name`      | Nombre para mostrar de la cuenta                                 | -                                        |
| `channels.yuanbao.accounts.<id>.enabled`   | Activa o desactiva una cuenta específica                         | `true`                                   |
| `channels.yuanbao.dm.policy`               | Política de mensajes directos                                    | `open`                                   |
| `channels.yuanbao.dm.allowFrom`            | Lista de permitidos para mensajes directos (lista de identificadores de usuario) | -                            |
| `channels.yuanbao.requireMention`          | Exige una @mención en los grupos                                 | `true`                                   |
| `channels.yuanbao.overflowPolicy`          | Gestión de mensajes largos (`split` o `stop`)                    | `split`                                  |
| `channels.yuanbao.replyToMode`             | Estrategia de respuesta a mensajes en grupos (`off`, `first`, `all`) | `first`                              |
| `channels.yuanbao.outboundQueueStrategy`   | Estrategia saliente (`merge-text` o `immediate`)                 | `merge-text`                             |
| `channels.yuanbao.minChars`                | Fusión de texto: caracteres mínimos para activar el envío        | `2800`                                   |
| `channels.yuanbao.maxChars`                | Fusión de texto: caracteres máximos por mensaje                  | `3000`                                   |
| `channels.yuanbao.idleMs`                  | Fusión de texto: tiempo de espera de inactividad antes del vaciado automático (ms) | `5000`                    |
| `channels.yuanbao.mediaMaxMb`              | Límite de tamaño del contenido multimedia (MB)                   | `20`                                     |
| `channels.yuanbao.historyLimit`            | Entradas del contexto del historial de chats grupales            | `100`                                    |
| `channels.yuanbao.disableBlockStreaming`   | Desactiva la salida transmitida por bloques                      | `false`                                  |
| `channels.yuanbao.fallbackReply`           | Respuesta de reserva cuando el modelo no devuelve contenido      | `暂时无法解答，你可以换个问题问问我哦`   |
| `channels.yuanbao.markdownHintEnabled`     | Inyecta instrucciones para evitar el encapsulado en Markdown     | `true`                                   |
| `channels.yuanbao.debugBotIds`             | Identificadores de bots en la lista de depuración (registros sin depurar) | `[]`                              |

## Tipos de mensajes compatibles

**Recepción:** texto, imágenes, archivos, audio/voz, vídeo, adhesivos/emojis personalizados y elementos personalizados (tarjetas de enlace).

**Envío:** texto (Markdown), imágenes, archivos, audio, vídeo y adhesivos.

**Hilos y respuestas:** respuestas con cita (configurables mediante `replyToMode`); la plataforma no admite respuestas en hilos.

## Contenido relacionado

- [Descripción general de los canales](/es/channels) - todos los canales compatibles
- [Vinculación](/es/channels/pairing) - autenticación de mensajes directos y flujo de vinculación
- [Grupos](/es/channels/groups) - comportamiento de los chats grupales y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo de seguridad
