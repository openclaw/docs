---
read_when:
    - Conectar OpenClaw a un espacio de trabajo de ClickClack
    - Probando identidades de bot ClickClack
summary: Configuración del canal con token de bot de ClickClack y sintaxis de destino
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T10:36:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack conecta OpenClaw con un espacio de trabajo ClickClack autoalojado mediante tokens de bot ClickClack de primera clase.

Usa esto cuando quieras que un agente de OpenClaw aparezca como un usuario bot de ClickClack. ClickClack admite bots de servicio independientes y bots propiedad de usuarios; los bots propiedad de usuarios conservan un `owner_user_id` y solo reciben los ámbitos de token que concedas.

## Configuración rápida

Crea un token de bot en ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Para un bot propiedad de un usuario, añade `--owner <user_id>`.

Configura OpenClaw:

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
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

Luego ejecuta:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Si `plugins.allow` es una lista restrictiva no vacía, seleccionar explícitamente
ClickClack en la configuración del canal o ejecutar `openclaw plugins enable clickclack`
añade `clickclack` a esa lista. La instalación de incorporación usa el mismo
comportamiento de selección explícita. Estas rutas no anulan `plugins.deny` ni una
configuración global `plugins.enabled: false`. La ejecución directa de
`openclaw plugins install @openclaw/clickclack` sigue la política normal
de instalación de plugins y también registra ClickClack en una lista de permitidos existente.

## Varios bots

Cada cuenta abre su propia conexión en tiempo real de ClickClack y usa su propio token de bot.

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
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` usa `api.runtime.llm.complete` directamente para respuestas breves del bot.
Cuando una cuenta define `agentId`, OpenClaw requiere el bit de confianza explícito
`plugins.entries.clickclack.llm.allowAgentIdOverride` para que el Plugin
pueda ejecutar finalizaciones para ese agente bot. Mantenlo desactivado si solo usas la ruta
del agente predeterminado.

## Destinos

- `channel:<name-or-id>` envía a un canal del espacio de trabajo. Los destinos sin prefijo usan `channel:` de forma predeterminada.
- `dm:<user_id>` crea o reutiliza una conversación directa con ese usuario.
- `thread:<message_id>` responde en un hilo existente.

Ejemplos:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Permisos

Los ámbitos de token de ClickClack los aplica la API de ClickClack.

- `bot:read`: leer datos de espacio de trabajo/canal/mensaje/hilo/MD/tiempo real/perfil.
- `bot:write`: `bot:read` más mensajes de canal, respuestas en hilos, MD y cargas.
- `bot:admin`: `bot:write` más creación de canales.

OpenClaw solo necesita `bot:write` para el chat normal del agente.

## Solución de problemas

- `ClickClack is not configured`: define `channels.clickclack.token` o `CLICKCLACK_BOT_TOKEN`.
- `workspace not found`: define `workspace` como el id o slug del espacio de trabajo devuelto por ClickClack.
- No hay respuestas entrantes: confirma que el token tenga acceso de lectura en tiempo real y que el bot no responda a sus propios mensajes.
- Fallan los envíos a canales: verifica que el bot sea miembro del espacio de trabajo y tenga `bot:write`.
