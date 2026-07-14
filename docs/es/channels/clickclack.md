---
read_when:
    - Conectar OpenClaw a un espacio de trabajo de ClickClack
    - Prueba de identidades de bots de ClickClack
summary: Configuración del canal mediante token de bot de ClickClack y sintaxis del destino
title: ClickClack
x-i18n:
    generated_at: "2026-07-14T13:27:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 76068c71c0d6cdb5153e74d69ec1a01a75f1bc6a5bcba636f5e41a1293c20139
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack conecta OpenClaw con un espacio de trabajo ClickClack autoalojado mediante tokens de bot ClickClack de primera clase.

Utilice esta opción cuando desee que un agente de OpenClaw aparezca como usuario bot de ClickClack. ClickClack admite bots de servicio independientes y bots propiedad de usuarios; los bots propiedad de usuarios conservan un `owner_user_id` y reciben únicamente los ámbitos de token que se les concedan.

## Configuración rápida

Cree un token de bot en el servidor ClickClack:

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

Una cuenta se considera configurada únicamente cuando `baseUrl`, `token` y `workspace` están definidos. `workspace` acepta un id de espacio de trabajo (`wsp_...`), un slug o un nombre; el Gateway lo resuelve al id durante el inicio.

### Claves de configuración de la cuenta

| Clave                   | Valor predeterminado | Notas                                                                                   |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | ninguno (obligatorio) | URL del servidor ClickClack.                                                            |
| `token`                 | ninguno (obligatorio) | Cadena sin formato o referencia de secreto (`source: "env" \| "file" \| "exec"`).                        |
| `workspace`             | ninguno (obligatorio) | Id, slug o nombre del espacio de trabajo.                                               |
| `replyMode`             | `"agent"`           | `"agent"` ejecuta la canalización completa del agente; `"model"` envía respuestas breves directas del modelo. |
| `defaultTo`             | `"channel:general"` | Destino utilizado cuando una ruta saliente no proporciona ninguno.                     |
| `allowFrom`             | `["*"]`             | Lista de usuarios permitidos por id para mensajes directos y mensajes de canal entrantes. |
| `botUserId`             | detectado automáticamente | Se resuelve a partir de la identidad del token de bot durante el inicio.                |
| `agentId`               | ruta predeterminada | Fija los mensajes entrantes de esta cuenta a un agente.                                 |
| `toolsAllow`            | ninguno             | Lista de herramientas permitidas para las respuestas del agente desde esta cuenta.     |
| `model`, `systemPrompt` | ninguno             | Se utilizan en las respuestas de `replyMode: "model"`.                                   |
| `reconnectMs`           | `1500`              | Retraso de reconexión en tiempo real (100 a 60000).                                     |

Si `plugins.allow` es una lista restrictiva no vacía, seleccionar explícitamente
ClickClack en la configuración del canal o ejecutar `openclaw plugins enable clickclack`
añade `clickclack` a esa lista. La instalación durante la incorporación utiliza el mismo
comportamiento de selección explícita. Estas rutas no anulan `plugins.deny` ni una
configuración global de `plugins.enabled: false`. La ejecución directa de
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

- `replyMode: "agent"` (predeterminado) distribuye los mensajes entrantes a través de la canalización normal del agente, incluido el registro de sesiones y la política de herramientas.
- `replyMode: "model"` omite la canalización del agente y utiliza el `llm.complete` del entorno de ejecución del plugin para las respuestas directas del bot, opcionalmente definidas por `model` y `systemPrompt`. El proveedor y el modelo seleccionados controlan el presupuesto de la respuesta.

El modo de modelo ejecuta las respuestas con el id resuelto del agente del bot, lo que requiere
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

Mantenga desactivado el indicador de confianza si solo utiliza el modo de respuesta predeterminado `agent`; no es
necesario en ese caso.

Utilice el modo `agent` para obtener pruebas de correlación entre servicios. Para un
id de mensaje de ClickClack autoritativo con su formato canónico `msg_<ulid>`, el canal deriva
el id de ejecución determinista de OpenClaw `clickclack:<message-id>`. Cada llamada al modelo
queda visible en los diagnósticos como `clickclack:<message-id>:model:<n>`; cuando ese
turno utiliza ClawRouter, el mismo id de llamada al modelo se envía como `X-Request-ID`.
El modo `model` omite los diagnósticos normales de ejecución y sesión del agente y, por tanto,
no es adecuado para esta ruta de pruebas.

Cuando un evento en tiempo real contiene un `payload.correlation_id` validado, el
canal lo transmite como `X-Correlation-ID` en la obtención autoritativa del mensaje y
en las solicitudes de respuesta de ClickClack resultantes. Los valores utilizan el conjunto seguro de
128 caracteres de ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` y `-`); los valores no válidos
se omiten. Estas asociaciones contienen únicamente identificadores, nunca cuerpos de mensajes,
prompts, respuestas, credenciales ni resultados de herramientas.

## Entrega duradera de contenido multimedia

Las respuestas del agente que contienen contenido multimedia utilizan obligatoriamente una entrega duradera. OpenClaw asigna
nonces estables por cada parte del mensaje y carga antes de la primera escritura en ClickClack, de modo que
un reintento reutiliza la misma carga y el mismo mensaje en lugar de consumir cuota de almacenamiento
o publicar duplicados. Si una carga ya existe después de un reinicio,
OpenClaw no vuelve a leer la ruta local original ni la URL remota del contenido multimedia.

Este contrato de recuperación requiere un servidor ClickClack compatible con:

- `GET /api/uploads/by-nonce` con
  `X-ClickClack-Upload-Nonce: supported` para resultados encontrados y ausentes.
- `GET /api/messages/by-nonce` con
  `X-ClickClack-Message-Nonce: supported` para resultados encontrados y ausentes.
- Creación idempotente de mensajes y asociación de archivos adjuntos para el mismo
  nonce y la misma carga dentro del ámbito del propietario.

Un error 404 genérico de un servidor antiguo no se considera prueba de que un envío esté ausente.
OpenClaw deja la entrega sin resolver en lugar de arriesgarse a crear un duplicado; actualice
ClickClack antes de habilitar respuestas del agente que generen contenido multimedia.

## Filas de actividad del agente

De forma predeterminada, un canal de ClickClack no muestra nada mientras se ejecuta un turno del agente; solo se publica la respuesta final. Defina `agentActivity: true` en una cuenta para publicar filas de mensaje duraderas `agent_commentary` y `agent_tool` mientras el turno está en curso:

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
- **Requiere el ámbito de token `agent_activity:write`.** Este ámbito es independiente de `bot:write` y no se hereda de él; cree el token de bot con `--scopes bot:write,agent_activity:write` (o conceda el ámbito a un token existente) antes de habilitar la opción.
- **Degradación con el mejor esfuerzo.** Si el token no dispone de `agent_activity:write` o el servidor rechaza las escrituras de actividad, los fallos se registran y la respuesta final se entrega normalmente; no aparecen filas de actividad.
- Las filas se agrupan por turno (`turn_id`), se fusionan para que cada paso lógico corresponda a una fila y las filas de herramientas utilizan el mismo formato de progreso que Discord/Slack/Telegram (nombre de la herramienta más detalles del comando).
- **Metadatos de atribución.** Las publicaciones creadas por el agente (las filas de actividad y la respuesta final) incluyen los campos `author_model` y `author_thinking`, resueltos a partir del modelo utilizado realmente durante el turno (también después de una alternativa). Los servidores que no definen estas columnas ignoran los campos JSON desconocidos; los servidores que los conservan pueden responder «qué modelo dijo esta línea y con qué nivel de razonamiento» para cada mensaje.

## Destinos

- `channel:<name-or-id>` envía a un canal del espacio de trabajo. Los destinos sin prefijo utilizan `channel:` de forma predeterminada.
- `dm:<user_id>` crea o reutiliza una conversación directa con ese usuario.
- `thread:<message_id>` responde en el hilo cuyo mensaje raíz es el indicado.

Los destinos salientes explícitos también pueden incluir el prefijo de proveedor `clickclack:` o `cc:`.

El contenido multimedia saliente utiliza la API de carga de ClickClack y después adjunta la carga duradera
al mensaje de canal, la respuesta de hilo o el mensaje directo creados. Los archivos locales y las
URL remotas de contenido multimedia compatibles siguen la política normal de acceso a contenido multimedia de OpenClaw, con un límite
de 64 MiB por archivo. Los envíos duraderos en cola utilizan nonces independientes dentro del ámbito del propietario para cada
carga y parte del mensaje y, después, reintentan la asociación de archivos adjuntos con esos mismos
objetos. Consulte [Entrega duradera de contenido multimedia](#durable-media-delivery) para conocer el contrato del servidor
y el comportamiento de recuperación.

Ejemplos:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Permisos

La API de ClickClack aplica los ámbitos de los tokens de ClickClack.

- `bot:read`: lectura de datos del espacio de trabajo, canales, mensajes, hilos, mensajes directos, tiempo real y perfiles.
- `bot:write`: `bot:read` más mensajes de canal, respuestas de hilo, mensajes directos y cargas.
- `bot:admin`: `bot:write` más creación de canales.
- `agent_activity:write`: filas duraderas de actividad del agente (`agent_commentary` / `agent_tool`). No se hereda de `bot:write` ni de `bot:admin`; solo es obligatorio cuando se define `agentActivity: true`.

OpenClaw solo necesita `bot:write` para el chat normal del agente. Añada `agent_activity:write` al habilitar las [filas de actividad del agente](#agent-activity-rows).

## Solución de problemas

- `ClickClack is not configured for account "<id>"`: defina `baseUrl`, `token` (por ejemplo, mediante `CLICKCLACK_BOT_TOKEN`) y `workspace` para esa cuenta.
- `ClickClack workspace not found: <value>`: defina `workspace` como el id, slug o nombre del espacio de trabajo devuelto por ClickClack.
- No hay respuestas entrantes: confirme que el token dispone de acceso de lectura en tiempo real y tenga en cuenta que el bot ignora sus propios mensajes y los mensajes de otros bots.
- Los envíos a canales fallan: compruebe que el bot pertenece al espacio de trabajo y dispone de `bot:write`.
