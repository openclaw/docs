---
read_when:
    - Conectar OpenClaw a un espacio de trabajo de ClickClack
    - Probando identidades de bots ClickClack
summary: Configuración del canal de token de bot de ClickClack y sintaxis de destino
title: ClickClack
x-i18n:
    generated_at: "2026-07-05T11:01:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f268ab4ec96226a890aa1be7ccd1f05c9c92656aa5347864b1c74026dea9098
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack conecta OpenClaw a un espacio de trabajo ClickClack autoalojado mediante tokens de bot ClickClack de primera clase.

Usa esto cuando quieras que un agente de OpenClaw aparezca como un usuario bot de ClickClack. ClickClack admite bots de servicio independientes y bots propiedad de usuarios; los bots propiedad de usuarios mantienen un `owner_user_id` y reciben solo los alcances de token que otorgues.

## Configuración rápida

Crea un token de bot en el servidor ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Para un bot propiedad de un usuario, agrega `--owner <user_id>`.

Configura OpenClaw:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Luego ejecuta:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Una cuenta se considera configurada solo cuando `baseUrl`, `token` y `workspace` están todos definidos. `workspace` acepta un id de espacio de trabajo (`wsp_...`), un slug o un nombre; el Gateway lo resuelve al id durante el inicio.

### Claves de configuración de cuenta

| Clave                   | Predeterminado      | Notas                                                                                   |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | ninguno (obligatorio) | URL del servidor ClickClack.                                                            |
| `token`                 | ninguno (obligatorio) | Cadena sin formato o referencia secreta (`source: "env" \| "file" \| "exec"`).          |
| `workspace`             | ninguno (obligatorio) | Id, slug o nombre del espacio de trabajo.                                               |
| `replyMode`             | `"agent"`           | `"agent"` ejecuta el flujo completo del agente; `"model"` envía completados directos y breves del modelo. |
| `defaultTo`             | `"channel:general"` | Destino usado cuando una ruta saliente no proporciona destino.                          |
| `allowFrom`             | `["*"]`             | Lista de permitidos de ids de usuario para mensajes directos entrantes y mensajes de canal. |
| `botUserId`             | detección automática | Se resuelve a partir de la identidad del token de bot durante el inicio.                |
| `agentId`               | predeterminado de ruta | Fija los mensajes entrantes de esta cuenta a un agente.                                 |
| `toolsAllow`            | ninguno             | Lista de permitidos de herramientas para respuestas del agente desde esta cuenta.        |
| `model`, `systemPrompt` | ninguno             | Se usa en completados de `replyMode: "model"`.                                          |
| `reconnectMs`           | `1500`              | Retraso de reconexión en tiempo real (100 a 60000).                                     |

Si `plugins.allow` es una lista restrictiva no vacía, seleccionar explícitamente
ClickClack en la configuración de canal o ejecutar `openclaw plugins enable clickclack`
agrega `clickclack` a esa lista. La instalación de incorporación usa el mismo
comportamiento de selección explícita. Estas rutas no sobrescriben `plugins.deny` ni una
configuración global `plugins.enabled: false`. La ejecución directa de
`openclaw plugins install @openclaw/clickclack` sigue la política normal de
instalación de plugins y también registra ClickClack en una lista de permitidos existente.

## Varios bots

Cada cuenta abre su propia conexión en tiempo real de ClickClack y usa su propio token de bot.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Modos de respuesta

- `replyMode: "agent"` (predeterminado) envía los mensajes entrantes por el flujo normal del agente, incluido el registro de sesión y la política de herramientas.
- `replyMode: "model"` omite el flujo del agente y usa `llm.complete` del runtime del plugin para respuestas directas y breves del bot (opcionalmente definidas por `model` y `systemPrompt`).

El modo de modelo ejecuta completados con el id de agente de bot resuelto, lo que requiere
el bit de confianza explícito `plugins.entries.clickclack.llm.allowAgentIdOverride: true`:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

Mantén desactivado el bit de confianza si solo usas el modo de respuesta `agent`
predeterminado; ahí no se necesita.

## Destinos

- `channel:<name-or-id>` envía a un canal del espacio de trabajo. Los destinos sin prefijo usan `channel:` de forma predeterminada.
- `dm:<user_id>` crea o reutiliza una conversación directa con ese usuario.
- `thread:<message_id>` responde en el hilo cuyo origen es ese mensaje.

Los destinos salientes explícitos también pueden llevar el prefijo de proveedor `clickclack:` o `cc:`.

Ejemplos:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Permisos

Los alcances de token de ClickClack son aplicados por la API de ClickClack.

- `bot:read`: lee datos de espacio de trabajo/canal/mensaje/hilo/DM/tiempo real/perfil.
- `bot:write`: `bot:read` más mensajes de canal, respuestas de hilo, DM y cargas.
- `bot:admin`: `bot:write` más creación de canales.

OpenClaw solo necesita `bot:write` para el chat normal del agente.

## Solución de problemas

- `ClickClack is not configured for account "<id>"`: configura `baseUrl`, `token` (por ejemplo, mediante `CLICKCLACK_BOT_TOKEN`) y `workspace` para esa cuenta.
- `ClickClack workspace not found: <value>`: establece `workspace` en el id, slug o nombre del espacio de trabajo devuelto por ClickClack.
- No hay respuestas entrantes: confirma que el token tenga acceso de lectura en tiempo real y ten en cuenta que el bot ignora sus propios mensajes y los mensajes de otros bots.
- Fallan los envíos a canales: verifica que el bot sea miembro del espacio de trabajo y tenga `bot:write`.
