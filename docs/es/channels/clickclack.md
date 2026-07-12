---
read_when:
    - Conectar OpenClaw a un espacio de trabajo de ClickClack
    - Pruebas de identidades de bots de ClickClack
summary: Configuración del canal mediante token de bot de ClickClack y sintaxis del destino
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T14:17:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack conecta OpenClaw con un espacio de trabajo ClickClack autoalojado mediante tokens de bot de ClickClack con soporte nativo.

Use esta opción cuando quiera que un agente de OpenClaw aparezca como usuario bot de ClickClack. ClickClack admite bots de servicio independientes y bots propiedad de usuarios; los bots propiedad de usuarios conservan un `owner_user_id` y reciben únicamente los ámbitos del token que se les concedan.

## Configuración rápida

Cree un token de bot en el servidor de ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Para un bot propiedad de un usuario, añada `--owner <user_id>`.

Configure OpenClaw:

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

A continuación, ejecute:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Una cuenta se considera configurada solo cuando se han definido `baseUrl`, `token` y `workspace`. `workspace` acepta un identificador de espacio de trabajo (`wsp_...`), un slug o un nombre; el Gateway lo resuelve al identificador durante el inicio.

### Claves de configuración de la cuenta

| Clave                   | Valor predeterminado | Notas                                                                                                            |
| ----------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `baseUrl`               | ninguno (obligatorio) | URL del servidor de ClickClack.                                                                                  |
| `token`                 | ninguno (obligatorio) | Cadena sin formato o referencia de secreto (`source: "env" \| "file" \| "exec"`).                                |
| `workspace`             | ninguno (obligatorio) | Identificador, slug o nombre del espacio de trabajo.                                                             |
| `replyMode`             | `"agent"`            | `"agent"` ejecuta el flujo completo del agente; `"model"` envía compleciones breves y directas del modelo.       |
| `defaultTo`             | `"channel:general"`  | Destino utilizado cuando una ruta saliente no proporciona ninguno.                                              |
| `allowFrom`             | `["*"]`              | Lista de identificadores de usuario permitidos para mensajes directos y mensajes de canal entrantes.             |
| `botUserId`             | detectado automáticamente | Se resuelve a partir de la identidad del token de bot durante el inicio.                                     |
| `agentId`               | valor predeterminado de la ruta | Fija los mensajes entrantes de esta cuenta a un único agente.                                           |
| `toolsAllow`            | ninguno              | Lista de herramientas permitidas para las respuestas del agente desde esta cuenta.                               |
| `model`, `systemPrompt` | ninguno              | Se utilizan para las compleciones con `replyMode: "model"`.                                                      |
| `reconnectMs`           | `1500`               | Retardo de reconexión en tiempo real (100 a 60000).                                                              |

Si `plugins.allow` es una lista restrictiva no vacía, seleccionar explícitamente
ClickClack durante la configuración del canal o ejecutar `openclaw plugins enable clickclack`
añade `clickclack` a esa lista. La instalación durante la incorporación utiliza el mismo
comportamiento de selección explícita. Estas rutas no anulan `plugins.deny` ni una
configuración global `plugins.enabled: false`. La ejecución directa de
`openclaw plugins install @openclaw/clickclack` sigue la política normal de
instalación de plugins y también registra ClickClack en una lista de permitidos existente.

## Varios bots

Cada cuenta abre su propia conexión en tiempo real con ClickClack y utiliza su propio token de bot.

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

- `replyMode: "agent"` (predeterminado) procesa los mensajes entrantes mediante el flujo normal del agente, incluido el registro de sesiones y la política de herramientas.
- `replyMode: "model"` omite el flujo del agente y utiliza `llm.complete` del entorno de ejecución del plugin para generar respuestas de bot breves y directas (que pueden configurarse mediante `model` y `systemPrompt`).

El modo de modelo ejecuta las compleciones con el identificador resuelto del agente del bot, lo que requiere
el indicador de confianza explícito `plugins.entries.clickclack.llm.allowAgentIdOverride: true`:

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

Mantenga desactivado el indicador de confianza si solo utiliza el modo de respuesta `agent` predeterminado; no es
necesario en ese caso.

Use el modo `agent` para obtener pruebas de correlación entre servicios. Para un identificador
autoritativo de mensaje de ClickClack con su forma canónica `msg_<ulid>`, el canal deriva
el identificador determinista de ejecución de OpenClaw `clickclack:<message-id>`. Cada llamada al modelo
aparece entonces en los diagnósticos como `clickclack:<message-id>:model:<n>`; cuando ese
turno utiliza ClawRouter, el mismo identificador de llamada al modelo se envía como `X-Request-ID`.
El modo `model` omite los diagnósticos normales de ejecución y sesión del agente y, por tanto,
no es adecuado para esta ruta de pruebas.

Cuando un evento en tiempo real contiene un `payload.correlation_id` validado, el
canal lo transmite como `X-Correlation-ID` en la obtención autoritativa del mensaje y
en las solicitudes de respuesta de ClickClack resultantes. Los valores utilizan el conjunto seguro
de 128 caracteres de ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` y `-`); los valores no válidos
se omiten. Estas asociaciones solo contienen identificadores, nunca cuerpos de mensajes,
prompts, compleciones, credenciales ni resultados de herramientas.

## Filas de actividad del agente

De forma predeterminada, un canal de ClickClack no muestra nada mientras se ejecuta un turno del agente; solo se publica la respuesta final. Defina `agentActivity: true` en una cuenta para publicar filas de mensajes persistentes `agent_commentary` y `agent_tool` mientras el turno está en curso:

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

- **Desactivado de forma predeterminada.** Las configuraciones estándar y los servidores de ClickClack antiguos no se ven afectados.
- **Requiere el ámbito de token `agent_activity:write`.** Este ámbito es independiente de `bot:write` y no se hereda de él; cree el token de bot con `--scopes bot:write,agent_activity:write` (o conceda el ámbito a un token existente) antes de activar la opción.
- **Degradación basada en el mejor esfuerzo.** Si el token no incluye `agent_activity:write` o el servidor rechaza las escrituras de actividad, los errores se registran y la respuesta final se entrega normalmente; no aparecen filas de actividad.
- Las filas se agrupan por turno (`turn_id`), se combinan para que cada paso lógico corresponda a una fila y las filas de herramientas utilizan el mismo formato de progreso que Discord/Slack/Telegram (nombre de la herramienta más los detalles del comando).
- **Metadatos de atribución.** Las publicaciones creadas por el agente (las filas de actividad y la respuesta final) incluyen los campos `author_model` y `author_thinking`, resueltos a partir del modelo realmente utilizado para el turno (también después de recurrir a una alternativa). Los servidores que no definen estas columnas ignoran los campos JSON desconocidos; los servidores que los conservan pueden responder «qué modelo dijo esta línea y con qué nivel de razonamiento» para cada mensaje.

## Destinos

- `channel:<name-or-id>` envía a un canal del espacio de trabajo. Los destinos sin prefijo utilizan `channel:` de forma predeterminada.
- `dm:<user_id>` crea o reutiliza una conversación directa con ese usuario.
- `thread:<message_id>` responde en el hilo cuyo mensaje raíz es el indicado.

Los destinos salientes explícitos también pueden incluir el prefijo de proveedor `clickclack:` o `cc:`.

Ejemplos:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Permisos

La API de ClickClack aplica los ámbitos de los tokens de ClickClack.

- `bot:read`: permite leer datos de espacios de trabajo, canales, mensajes, hilos, mensajes directos, tiempo real y perfiles.
- `bot:write`: incluye `bot:read`, además de mensajes de canal, respuestas en hilos, mensajes directos y cargas.
- `bot:admin`: incluye `bot:write`, además de la creación de canales.
- `agent_activity:write`: filas persistentes de actividad del agente (`agent_commentary` / `agent_tool`). No se hereda de `bot:write` ni de `bot:admin`; solo es obligatorio cuando se define `agentActivity: true`.

OpenClaw solo necesita `bot:write` para el chat normal del agente. Añada `agent_activity:write` al activar las [filas de actividad del agente](#agent-activity-rows).

## Solución de problemas

- `ClickClack is not configured for account "<id>"`: defina `baseUrl`, `token` (por ejemplo, mediante `CLICKCLACK_BOT_TOKEN`) y `workspace` para esa cuenta.
- `ClickClack workspace not found: <value>`: defina `workspace` con el identificador, slug o nombre del espacio de trabajo devuelto por ClickClack.
- No hay respuestas entrantes: confirme que el token tiene acceso de lectura en tiempo real y tenga en cuenta que el bot ignora sus propios mensajes y los mensajes de otros bots.
- Los envíos al canal fallan: compruebe que el bot pertenece al espacio de trabajo y dispone de `bot:write`.
