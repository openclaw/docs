---
read_when:
    - Quieres conectar un bot de Feishu/Lark
    - Estás configurando el canal Feishu
summary: Descripción general, funciones y configuración del bot de Feishu
title: Feishu
x-i18n:
    generated_at: "2026-06-27T10:36:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a12e91ff42b17ee99f07c10933d65a407db8ed9de2ac7bc6028d7004aa4e346
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark es una plataforma de colaboración todo en uno donde los equipos chatean, comparten documentos, gestionan calendarios y trabajan juntos.

**Estado:** listo para producción para mensajes directos del bot y chats de grupo. WebSocket es el modo predeterminado; el modo Webhook es opcional.

---

## Inicio rápido

<Note>
Requiere OpenClaw 2026.5.29 o superior. Ejecuta `openclaw --version` para comprobarlo. Actualiza con `openclaw update`.
</Note>

<Steps>
  <Step title="Ejecuta el asistente de configuración del canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Elige la configuración manual para pegar un App ID y App Secret desde Feishu Open Platform, o elige la configuración por QR para crear un bot automáticamente. Si la aplicación móvil nacional de Feishu no reacciona al código QR, vuelve a ejecutar la configuración y elige la configuración manual.
  </Step>
  
  <Step title="Cuando finalice la configuración, reinicia el gateway para aplicar los cambios">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Control de acceso

### Mensajes directos

Configura `dmPolicy` para controlar quién puede enviar mensajes directos al bot:

- `"pairing"` - los usuarios desconocidos reciben un código de emparejamiento; apruébalo mediante la CLI
- `"allowlist"` - solo los usuarios enumerados en `allowFrom` pueden chatear
- `"open"` - permite mensajes directos públicos solo cuando `allowFrom` incluye `"*"`; con entradas restrictivas, solo los usuarios coincidentes pueden chatear
- `"disabled"` - desactiva todos los mensajes directos

**Aprobar una solicitud de emparejamiento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chats de grupo

**Política de grupo** (`channels.feishu.groupPolicy`):

| Valor         | Comportamiento                                                                              |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Responder a todos los mensajes en grupos                                                     |
| `"allowlist"` | Responder solo a grupos en `groupAllowFrom` o configurados explícitamente en `groups.<chat_id>` |
| `"disabled"`  | Desactivar todos los mensajes de grupo; las entradas explícitas de `groups.<chat_id>` no anulan esto |

Predeterminado: `allowlist`

**Requisito de mención** (`channels.feishu.requireMention`):

- `true` - requiere mención @ (predeterminado)
- `false` - responde sin mención @
- Anulación por grupo: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` y `@_all` solo de difusión no se tratan como menciones al bot. Un mensaje que menciona tanto a `@all` como directamente al bot sigue contando como una mención al bot.

---

## Ejemplos de configuración de grupos

### Permitir todos los grupos, sin requerir mención @

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Permitir todos los grupos, pero seguir requiriendo mención @

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

En modo `allowlist`, también puedes admitir un grupo añadiendo una entrada explícita `groups.<chat_id>`. Las entradas explícitas no anulan `groupPolicy: "disabled"`. Los valores predeterminados con comodín en `groups.*` configuran los grupos coincidentes, pero no admiten grupos por sí solos.

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

Inicia el gateway, envía un mensaje directo al bot y luego revisa los registros:

```bash
openclaw logs --follow
```

Busca `open_id` en la salida del registro. También puedes comprobar las solicitudes de emparejamiento pendientes:

```bash
openclaw pairing list feishu
```

---

## Comandos comunes

| Comando   | Descripción                   |
| --------- | ----------------------------- |
| `/status` | Mostrar el estado del bot     |
| `/reset`  | Restablecer la sesión actual  |
| `/model`  | Mostrar o cambiar el modelo de IA |

<Note>
Feishu/Lark no admite menús nativos de comandos con barra, así que envíalos como mensajes de texto sin formato.
</Note>

---

## Solución de problemas

### El bot no responde en chats grupales

1. Asegúrate de que el bot esté añadido al grupo
2. Asegúrate de @mencionar al bot (requerido de forma predeterminada)
3. Verifica que `groupPolicy` no sea `"disabled"`
4. Revisa los registros: `openclaw logs --follow`

### El bot no recibe mensajes

1. Asegúrate de que el bot esté publicado y aprobado en Feishu Open Platform / Lark Developer
2. Asegúrate de que la suscripción a eventos incluya `im.message.receive_v1`
3. Asegúrate de que esté seleccionada la **conexión persistente** (WebSocket)
4. Asegúrate de que se hayan concedido todos los permisos requeridos
5. Asegúrate de que Gateway esté en ejecución: `openclaw gateway status`
6. Revisa los registros: `openclaw logs --follow`

### La configuración con QR no reacciona en la app móvil de Feishu

1. Vuelve a ejecutar la configuración: `openclaw channels login --channel feishu`
2. Elige la configuración manual
3. En Feishu Open Platform, crea una app autoconstruida y copia su App ID y App Secret
4. Pega esas credenciales en el asistente de configuración

### App Secret filtrado

1. Restablece el App Secret en Feishu Open Platform / Lark Developer
2. Actualiza el valor en tu configuración
3. Reinicia Gateway: `openclaw gateway restart`

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

`defaultAccount` controla qué cuenta se usa cuando las APIs salientes no especifican un `accountId`.
`accounts.<id>.tts` usa la misma forma que `messages.tts` y se combina en profundidad sobre
la configuración global de TTS, de modo que las configuraciones Feishu con varios bots pueden mantener las credenciales
compartidas de proveedores de forma global y anular solo la voz, el modelo, la persona o el modo automático
por cuenta.

### Límites de mensajes

- `textChunkLimit` - tamaño del fragmento de texto saliente (predeterminado: `2000` caracteres)
- `mediaMaxMb` - límite de carga/descarga de medios (predeterminado: `30` MB)

### Transmisión

Feishu/Lark admite respuestas en streaming mediante tarjetas interactivas. Cuando está habilitado, el bot actualiza la tarjeta en tiempo real mientras genera texto.

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

Define `streaming: false` para enviar la respuesta completa en un solo mensaje. `blockStreaming` está desactivado de forma predeterminada; habilítalo solo cuando quieras vaciar bloques completados del asistente antes de la respuesta final.

### Optimización de cuota

Reduce la cantidad de llamadas a la API de Feishu/Lark con dos indicadores opcionales:

- `typingIndicator` (predeterminado `true`): define `false` para omitir las llamadas de reacción de escritura
- `resolveSenderNames` (predeterminado `true`): define `false` para omitir las búsquedas de perfil del remitente

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

Feishu/Lark admite ACP para mensajes directos y mensajes de hilos grupales. ACP en Feishu/Lark se controla mediante comandos de texto: no hay menús nativos de comandos de barra, así que usa mensajes `/acp ...` directamente en la conversación.

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

#### Crear ACP desde el chat

En un mensaje directo o hilo de Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funciona para mensajes directos y mensajes de hilos de Feishu/Lark. Los mensajes de seguimiento en la conversación enlazada se enrutan directamente a esa sesión ACP.

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
- `match.peer.id`: Open ID del usuario (`ou_xxx`) o ID del grupo (`oc_xxx`)

Consulta [Obtener IDs de grupo/usuario](#get-groupuser-ids) para ver consejos de búsqueda.

---

## Aislamiento de agente por usuario (creación dinámica de agentes)

Habilita `dynamicAgentCreation` para crear automáticamente **instancias de agente aisladas** para cada usuario de mensajes directos. Cada usuario obtiene su propio:

- Directorio de espacio de trabajo independiente
- `USER.md` / `SOUL.md` / `MEMORY.md` separados
- Historial de conversación privado
- Skills y estado aislados

Esto es esencial para bots públicos cuando quieres que cada usuario tenga su propia experiencia privada de asistente de IA.

<Note>
Los enlaces dinámicos incluyen el `accountId` normalizado de Feishu, por lo que las cuentas predeterminadas y con nombre enrutan a cada remitente al agente dinámico correcto.

Si una cuenta con nombre creó un agente dinámico sin ámbito en una versión anterior, ese agente heredado aún cuenta para `maxAgents`. Confirma que la cuenta predeterminada no lo esté usando antes de eliminarlo, o aumenta temporalmente `maxAgents`; OpenClaw no puede inferir con seguridad qué cuenta posee un estado heredado ambiguo.
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

Cuando un usuario nuevo envía su primer mensaje directo:

1. El canal genera un `agentId` único: `feishu-{user_open_id}` para la cuenta predeterminada, o un resumen de identidad acotado con prefijo de cuenta para una cuenta con nombre
2. Crea un nuevo espacio de trabajo en la ruta `workspaceTemplate`
3. Registra el agente y crea un enlace para este usuario
4. El asistente de espacio de trabajo asegura los archivos de arranque (`AGENTS.md`, `SOUL.md`, `USER.md`, etc.) en el primer acceso
5. Enruta todos los mensajes futuros de este usuario a su agente dedicado

### Opciones de configuración

| Configuración                                           | Descripción                                          | Predeterminado                      |
| -------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------- |
| `channels.feishu.dynamicAgentCreation.enabled`           | Habilitar la creación automática de agentes por usuario | `false`                             |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Plantilla de ruta para espacios de trabajo dinámicos de agentes | `~/.openclaw/workspace-{agentId}`   |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Plantilla de nombre del directorio del agente        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Número máximo de agentes dinámicos que crear         | ilimitado                           |

Variables de plantilla:

- `{agentId}` - el ID de agente generado (p. ej., `feishu-ou_xxxxxx` o `feishu-support-<identity_digest>`)
- `{userId}` - el open_id de Feishu del remitente (p. ej., `ou_xxxxxx`)

### Alcance de sesión

`session.dmScope` controla cómo se asignan los mensajes directos a sesiones de agente. Esta es una **configuración global** que afecta a todos los canales.

| Valor                        | Comportamiento                                                     | Ideal para                                                         |
| ---------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `"main"`                     | El DM de cada usuario se asigna a la sesión principal de su agente | Bots de un solo usuario donde quieres que `USER.md` / `SOUL.md` se carguen automáticamente |
| `"per-channel-peer"`         | Cada combinación de (canal + usuario) obtiene una sesión separada  | Bots públicos multiusuario que necesitan un aislamiento más fuerte |
| `"per-account-channel-peer"` | Cada combinación de (cuenta + canal + usuario) obtiene una sesión separada | Bots multicuenta que necesitan aislamiento de sesión a nivel de cuenta |

**Contrapartida**: Usar `"main"` habilita la carga automática de archivos de arranque (`USER.md`, `SOUL.md`, `MEMORY.md`), pero significa que todos los DM en todos los canales comparten el mismo patrón de clave de sesión. Para bots públicos multiusuario donde el aislamiento importa más que la carga automática de arranque, considera `"per-channel-peer"` y administra los archivos de arranque manualmente.

<Note>
Usa `"per-account-channel-peer"` cuando las cuentas con nombre de Feishu deban mantener sesiones separadas para el mismo remitente. Los enlaces dinámicos conservan el alcance de cuenta.
</Note>

```json5
{
  session: {
    // Para bots personales de un solo usuario: habilita la carga automática de arranque
    dmScope: "main",

    // Para bots públicos multiusuario: aislamiento más fuerte
    // dmScope: "per-channel-peer",
  },
}
```

### Implementación multiusuario típica

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
    // Elige dmScope en función de tus necesidades de aislamiento:
    // "main" para carga automática de arranque, "per-channel-peer" para aislamiento más fuerte
    dmScope: "main",
  },
  bindings: [], // Vacío - los agentes dinámicos se enlazan automáticamente
}
```

### Verificación

Revisa los registros del gateway para confirmar que la creación dinámica funciona:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

Lista todos los espacios de trabajo creados:

```bash
ls -la ~/.openclaw/workspace-*
```

### Notas

- **Aislamiento del espacio de trabajo**: Cada usuario obtiene su propio directorio de espacio de trabajo e instancia de agente. Los usuarios no pueden ver el historial de conversación ni los archivos de otros dentro del flujo de mensajería normal.
- **Límite de seguridad**: Este es un mecanismo de aislamiento de contexto de mensajería, no un límite de seguridad frente a coarrendatarios hostiles. El proceso del agente y el entorno host se comparten.
- **`bindings` debe estar vacío**: Los agentes dinámicos registran automáticamente sus propios enlaces
- **Ruta de actualización**: Los enlaces manuales existentes siguen funcionando junto con los agentes dinámicos
- **`session.dmScope` es global**: Esto afecta a todos los canales, no solo a Feishu

---

## Referencia de configuración

Configuración completa: [Configuración del Gateway](/es/gateway/configuration)

| Configuración                                           | Descripción                                                                      | Predeterminado                      |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------- |
| `channels.feishu.enabled`                                | Habilitar/deshabilitar el canal                                                  | `true`                              |
| `channels.feishu.domain`                                 | Dominio de API (`feishu` o `lark`)                                               | `feishu`                            |
| `channels.feishu.connectionMode`                         | Transporte de eventos (`websocket` o `webhook`)                                  | `websocket`                         |
| `channels.feishu.defaultAccount`                         | Cuenta predeterminada para enrutamiento saliente                                 | `default`                           |
| `channels.feishu.verificationToken`                      | Requerido para el modo webhook                                                   | -                                   |
| `channels.feishu.encryptKey`                             | Requerido para el modo webhook                                                   | -                                   |
| `channels.feishu.webhookPath`                            | Ruta de Webhook                                                                  | `/feishu/events`                    |
| `channels.feishu.webhookHost`                            | Host de enlace de Webhook                                                        | `127.0.0.1`                         |
| `channels.feishu.webhookPort`                            | Puerto de enlace de Webhook                                                      | `3000`                              |
| `channels.feishu.accounts.<id>.appId`                    | ID de la app                                                                     | -                                   |
| `channels.feishu.accounts.<id>.appSecret`                | Secreto de la app                                                                | -                                   |
| `channels.feishu.accounts.<id>.domain`                   | Anulación de dominio por cuenta                                                  | `feishu`                            |
| `channels.feishu.accounts.<id>.tts`                      | Anulación de TTS por cuenta                                                      | `messages.tts`                      |
| `channels.feishu.dmPolicy`                               | Política de DM                                                                   | `pairing`                           |
| `channels.feishu.allowFrom`                              | Lista de permitidos de DM (lista de open_id)                                     | -                                   |
| `channels.feishu.groupPolicy`                            | Política de grupo                                                                | `allowlist`                         |
| `channels.feishu.groupAllowFrom`                         | Lista de permitidos de grupos                                                    | -                                   |
| `channels.feishu.requireMention`                         | Requerir @mención en grupos                                                      | `true`                              |
| `channels.feishu.groups.<chat_id>.requireMention`        | Anulación de @mención por grupo; los ID explícitos también admiten el grupo en modo de lista de permitidos | heredado                            |
| `channels.feishu.groups.<chat_id>.enabled`               | Habilitar/deshabilitar un grupo específico                                       | `true`                              |
| `channels.feishu.dynamicAgentCreation.enabled`           | Habilitar la creación automática de agentes por usuario                          | `false`                             |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Plantilla de ruta para espacios de trabajo dinámicos de agentes                  | `~/.openclaw/workspace-{agentId}`   |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Plantilla de nombre del directorio del agente                                    | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Número máximo de agentes dinámicos que crear                                     | ilimitado                           |
| `channels.feishu.textChunkLimit`                         | Tamaño de fragmento de mensaje                                                   | `2000`                              |
| `channels.feishu.mediaMaxMb`                             | Límite de tamaño de medios                                                       | `30`                                |
| `channels.feishu.streaming`                              | Salida de tarjeta en streaming                                                   | `true`                              |
| `channels.feishu.blockStreaming`                         | Streaming de respuestas de bloques completados                                   | `false`                             |
| `channels.feishu.typingIndicator`                        | Enviar reacciones de escritura                                                   | `true`                              |
| `channels.feishu.resolveSenderNames`                     | Resolver nombres para mostrar de remitentes                                      | `true`                              |
| `channels.feishu.tools.bitable`                          | Habilitar herramientas Bitable/Base                                              | `true`                              |
| `channels.feishu.tools.base`                             | Alias de `channels.feishu.tools.bitable`; `bitable` explícito prevalece cuando ambos están definidos | `true`                              |
| `channels.feishu.accounts.<id>.tools.bitable`            | Control de herramientas Bitable/Base por cuenta                                  | heredado                            |
| `channels.feishu.accounts.<id>.tools.base`               | Alias por cuenta de `tools.bitable`                                              | heredado                            |

---

## Tipos de mensaje compatibles

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
- ⚠️ Texto enriquecido (formato estilo publicación; no admite todas las capacidades de autoría de Feishu/Lark)

Las burbujas de audio nativas de Feishu/Lark usan el tipo de mensaje `audio` de Feishu y requieren
medios subidos en Ogg/Opus (`file_type: "opus"`). Los medios `.opus` y `.ogg` existentes
se envían directamente como audio nativo. MP3/WAV/M4A y otros formatos que probablemente sean de audio se
transcodifican a Ogg/Opus a 48 kHz con `ffmpeg` solo cuando la respuesta solicita entrega de voz
(`audioAsVoice` / herramienta de mensajes `asVoice`, incluidas las respuestas de nota de voz TTS).
Los adjuntos MP3 ordinarios siguen siendo archivos normales. Si falta `ffmpeg` o
la conversión falla, OpenClaw recurre a un adjunto de archivo y registra el motivo.

### Hilos y respuestas

- ✅ Respuestas en línea
- ✅ Respuestas en hilos
- ✅ Las respuestas con medios siguen teniendo en cuenta el hilo al responder a un mensaje de hilo

Para `groupSessionScope: "group_topic"` y `"group_topic_sender"`, los grupos de temas nativos de
Feishu/Lark usan el `thread_id` (`omt_*`) del evento como clave canónica de sesión del tema.
Si un evento nativo de inicio de tema omite `thread_id`, OpenClaw
lo hidrata desde Feishu antes de enrutar el turno. Las respuestas de grupo normales que
OpenClaw convierte en hilos siguen usando el ID del mensaje raíz de la respuesta (`om_*`) para que
el primer turno y el turno de seguimiento permanezcan en la misma sesión.

---

## Relacionado

- [Resumen de canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - autenticación por DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento del chat de grupo y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo
