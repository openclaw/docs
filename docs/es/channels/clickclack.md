---
read_when:
    - Conectar OpenClaw a un espacio de trabajo de ClickClack
    - Prueba de identidades de bots de ClickClack
summary: Configuración del canal bot-token de ClickClack y sintaxis de destino
title: ClickClack
x-i18n:
    generated_at: "2026-07-05T17:39:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 164f6ee2e41092adf26d753c835ca82b2eb730e1fa93e987f07b7346441dff09
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack conecta OpenClaw a un espacio de trabajo ClickClack autohospedado mediante tokens de bot ClickClack de primera clase.

Usa esto cuando quieras que un agente de OpenClaw aparezca como un usuario bot de ClickClack. ClickClack admite bots de servicio independientes y bots propiedad de usuarios; los bots propiedad de usuarios conservan un `owner_user_id` y reciben solo los alcances de token que les concedas.

## Configuración rápida

Crea un token de bot en el servidor de ClickClack:

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

Una cuenta cuenta como configurada solo cuando `baseUrl`, `token` y `workspace` están todos definidos. `workspace` acepta un id de espacio de trabajo (`wsp_...`), slug o nombre; el gateway lo resuelve al id durante el arranque.

### Claves de configuración de cuenta

| Clave                   | Predeterminado       | Notas                                                                                         |
| ----------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `baseUrl`               | ninguno (requerido)  | URL del servidor de ClickClack.                                                               |
| `token`                 | ninguno (requerido)  | Cadena simple o referencia secreta (`source: "env" \| "file" \| "exec"`).                     |
| `workspace`             | ninguno (requerido)  | Id, slug o nombre del espacio de trabajo.                                                     |
| `replyMode`             | `"agent"`            | `"agent"` ejecuta el pipeline completo del agente; `"model"` envía completions directas cortas del modelo. |
| `defaultTo`             | `"channel:general"`  | Destino usado cuando una ruta saliente no proporciona destino.                                |
| `allowFrom`             | `["*"]`              | Lista de usuarios permitidos por id para DM y mensajes de canal entrantes.                    |
| `botUserId`             | detectado automáticamente | Se resuelve desde la identidad del token de bot durante el arranque.                     |
| `agentId`               | predeterminado de ruta | Fija los mensajes entrantes de esta cuenta a un agente.                                    |
| `toolsAllow`            | ninguno              | Lista de herramientas permitidas para respuestas de agentes desde esta cuenta.                |
| `model`, `systemPrompt` | ninguno              | Usados por las completions de `replyMode: "model"`.                                          |
| `reconnectMs`           | `1500`               | Retraso de reconexión en tiempo real (100 a 60000).                                           |

Si `plugins.allow` es una lista restrictiva no vacía, seleccionar explícitamente
ClickClack en la configuración del canal o ejecutar `openclaw plugins enable clickclack`
agrega `clickclack` a esa lista. La instalación durante onboarding usa el mismo
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

- `replyMode: "agent"` (predeterminado) despacha los mensajes entrantes a través del pipeline normal del agente, incluida la grabación de sesiones y la política de herramientas.
- `replyMode: "model"` omite el pipeline del agente y usa `llm.complete` del runtime del plugin para respuestas directas cortas del bot (opcionalmente ajustadas por `model` y `systemPrompt`).

El modo de modelo ejecuta completions contra el id de agente de bot resuelto, lo que requiere
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

Mantén desactivado el bit de confianza si solo usas el modo de respuesta `agent` predeterminado; no es
necesario allí.

## Filas de actividad del agente

De forma predeterminada, un canal de ClickClack no muestra nada mientras se ejecuta un turno de agente; solo llega la respuesta final. Define `agentActivity: true` en una cuenta para publicar filas de mensaje duraderas `agent_commentary` y `agent_tool` mientras el turno está en curso:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Requisitos y comportamiento:

- **Desactivado de forma predeterminada.** Las configuraciones estándar y los servidores ClickClack antiguos no se ven afectados.
- **Requiere el alcance de token `agent_activity:write`.** Este alcance está separado de `bot:write` y no se hereda de él; crea el token de bot con `--scopes bot:write,agent_activity:write` (o concede el alcance a un token existente) antes de habilitar la opción.
- **Degradación de mejor esfuerzo.** Si al token le falta `agent_activity:write` o el servidor rechaza las escrituras de actividad, los errores se registran y la respuesta final se entrega normalmente; no aparecen filas de actividad.
- Las filas se agrupan por turno (`turn_id`), se fusionan para que un paso lógico sea una fila, y las filas de herramientas usan el mismo formato de progreso que Discord/Slack/Telegram (nombre de la herramienta más detalle del comando).
- **Metadatos de atribución.** Las publicaciones escritas por el agente (filas de actividad y respuesta final) llevan campos `author_model` y `author_thinking` resueltos desde el modelo real usado para el turno (incluido después de fallback). Los servidores que no definen estas columnas ignoran los campos JSON desconocidos; los servidores que los persisten pueden responder "qué modelo dijo esta línea, en qué nivel de pensamiento" por mensaje.

## Destinos

- `channel:<name-or-id>` envía a un canal del espacio de trabajo. Los destinos sin prefijo usan `channel:` de forma predeterminada.
- `dm:<user_id>` crea o reutiliza una conversación directa con ese usuario.
- `thread:<message_id>` responde en el hilo con raíz en ese mensaje.

Los destinos salientes explícitos también pueden llevar el prefijo de proveedor `clickclack:` o `cc:`.

Ejemplos:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Permisos

Los alcances de token de ClickClack los aplica la API de ClickClack.

- `bot:read`: leer datos de espacio de trabajo/canal/mensaje/hilo/DM/tiempo real/perfil.
- `bot:write`: `bot:read` más mensajes de canal, respuestas en hilos, DM y cargas.
- `bot:admin`: `bot:write` más creación de canales.
- `agent_activity:write`: filas duraderas de actividad del agente (`agent_commentary` / `agent_tool`). No se hereda de `bot:write` ni de `bot:admin`; solo se requiere cuando `agentActivity: true` está definido.

OpenClaw solo necesita `bot:write` para el chat normal del agente. Agrega `agent_activity:write` al habilitar [filas de actividad del agente](#agent-activity-rows).

## Solución de problemas

- `ClickClack is not configured for account "<id>"`: define `baseUrl`, `token` (por ejemplo mediante `CLICKCLACK_BOT_TOKEN`) y `workspace` para esa cuenta.
- `ClickClack workspace not found: <value>`: define `workspace` como el id, slug o nombre del espacio de trabajo devuelto por ClickClack.
- No hay respuestas entrantes: confirma que el token tenga acceso de lectura en tiempo real y ten en cuenta que el bot ignora sus propios mensajes y los mensajes de otros bots.
- Fallan los envíos a canales: verifica que el bot sea miembro del espacio de trabajo y tenga `bot:write`.
