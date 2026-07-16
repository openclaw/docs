---
read_when:
    - Conexión de OpenClaw a un espacio de trabajo de ClickClack
    - Pruebas de identidades de bots de ClickClack
summary: Configuración del canal mediante token de bot de ClickClack y sintaxis del destino
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T11:21:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack conecta OpenClaw con un espacio de trabajo ClickClack autoalojado mediante tokens de bot de ClickClack con integración de primera clase.

Use esta opción cuando se quiera que un agente de OpenClaw aparezca como usuario bot de ClickClack. ClickClack admite bots de servicio independientes y bots propiedad de usuarios; los bots propiedad de usuarios conservan un `owner_user_id` y reciben únicamente los ámbitos de token que se les concedan.

## Configuración rápida

En ClickClack, abra **Workspace settings → Integrations → OpenClaw**, cree un
bot y copie su token. A continuación, configure el canal:

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` acepta un id de espacio de trabajo (`wsp_...`), un slug o un nombre para mostrar.
`channels add` verifica el servidor, el token y el espacio de trabajo después de guardar y, a continuación,
indica si el Gateway en ejecución detectó la nueva cuenta. Si OpenClaw ya está
en ejecución, ClickClack se conecta automáticamente y no se necesita un segundo
comando. De lo contrario, inícielo con:

```bash
openclaw gateway
```

Para realizar una configuración guiada, ejecute:

```bash
openclaw onboard
```

Seleccione ClickClack y, cuando se solicite, introduzca la URL del servidor, el token del bot y el espacio de trabajo.
La configuración guiada comprueba el servidor, el token y el espacio de trabajo después de guardar; si
la comprobación falla, la configuración no se descarta.

### Alternativa: token basado en una variable de entorno

La cuenta predeterminada puede leer `CLICKCLACK_BOT_TOKEN` en lugar de almacenar un token
en la configuración:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

Las cuentas con nombre deben usar un token configurado o un archivo de token; la variable de entorno
compartida está limitada intencionadamente a la cuenta predeterminada.

### Referencia de JSON5

La estructura de configuración equivalente es:

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

Una cuenta solo se considera configurada cuando `baseUrl`, una fuente de token y
`workspace` están establecidos. Una fuente de token puede ser `token`, `tokenFile` o
`CLICKCLACK_BOT_TOKEN` para la cuenta predeterminada. `workspace` acepta un id de espacio de trabajo
(`wsp_...`), un slug o un nombre; el Gateway lo resuelve al id durante el inicio.

### Claves de configuración de la cuenta

| Clave                   | Valor predeterminado | Notas                                                                                   |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | ninguno (obligatorio) | URL del servidor de ClickClack.                                                         |
| `token`                 | ninguno             | Token del bot como cadena de texto sin formato o referencia de secreto (`source: "env" \| "file" \| "exec"`). |
| `tokenFile`             | ninguno             | Ruta a un archivo de token de bot; tiene prioridad sobre `token`.                        |
| `workspace`             | ninguno (obligatorio) | Id, slug o nombre del espacio de trabajo.                                               |
| `replyMode`             | `"agent"`           | `"agent"` ejecuta la canalización completa del agente; `"model"` envía breves completaciones directas del modelo. |
| `defaultTo`             | `"channel:general"` | Destino utilizado cuando una ruta saliente no especifica ninguno.                       |
| `allowFrom`             | `["*"]`             | Lista de ids de usuario permitidos para mensajes directos y mensajes de canal entrantes. |
| `botUserId`             | detectado automáticamente | Se resuelve a partir de la identidad del token del bot durante el inicio.                |
| `agentId`               | ruta predeterminada | Fija los mensajes entrantes de esta cuenta a un único agente.                           |
| `toolsAllow`            | ninguno             | Lista de herramientas permitidas para las respuestas del agente desde esta cuenta.      |
| `model`, `systemPrompt` | ninguno             | Se utilizan en las completaciones de `replyMode: "model"`.                                |
| `commandMenu`           | `true`              | Publica comandos nativos en el autocompletado del editor de ClickClack.                  |
| `reconnectMs`           | `1500`              | Retraso de reconexión en tiempo real (100 a 60000).                                     |

Si `plugins.allow` es una lista restrictiva no vacía, al seleccionar explícitamente
ClickClack en la configuración del canal o al ejecutar `openclaw plugins enable clickclack`
se añade `clickclack` a esa lista. La instalación durante la incorporación utiliza el mismo
comportamiento de selección explícita. Estas rutas no anulan `plugins.deny` ni una
configuración global de `plugins.enabled: false`. La ejecución directa de
`openclaw plugins install @openclaw/clickclack` sigue la política normal de instalación de
plugins y también registra ClickClack en una lista de permitidos existente.

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

- `replyMode: "agent"` (predeterminado) despacha los mensajes entrantes mediante la canalización normal del agente, incluido el registro de sesiones y la política de herramientas.
- `replyMode: "model"` omite la canalización del agente y utiliza `llm.complete` del entorno de ejecución del plugin para las respuestas directas del bot, con la forma opcional definida por `model` y `systemPrompt`. El proveedor y el modelo seleccionados determinan el presupuesto de la completación.

El modo de modelo ejecuta las completaciones con el id resuelto del agente del bot, lo que requiere
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

Mantenga desactivado el indicador de confianza si solo utiliza el modo de respuesta predeterminado `agent`;
en ese caso no es necesario.

## Menú de comandos

Al iniciar el Gateway, cada cuenta configurada publica los comandos nativos de
OpenClaw en ClickClack. Aparecen en el autocompletado del editor etiquetados con el
identificador del bot. El conjunto publicado se sustituye por completo en cada inicio,
lo que incluye borrar un menú obsoleto cuando el catálogo de comandos nativos está vacío.

La sincronización del menú de comandos está activada de forma predeterminada. Establezca `commandMenu: false` en una cuenta
para desactivarla:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

El token necesita `commands:write`. Los paquetes actuales `bot:write` y
`bot:admin` de ClickClack incluyen ese ámbito, que también se puede conceder
individualmente. Es posible que los tokens creados antes de la introducción de los menús de comandos necesiten
que se añada el ámbito o que se sustituyan.

La sincronización se realiza en la medida de lo posible y se ejecuta una vez por cada inicio del Gateway. La falta de un ámbito o un fallo de
red registra una advertencia; un servidor ClickClack antiguo sin el endpoint registra el incidente en
el nivel de depuración. Ninguno de estos fallos bloquea el inicio en tiempo real. Los menús permanecen
disponibles mientras el agente está desconectado y se eliminan cuando el bot abandona el
espacio de trabajo.

Esta versión solo publica especificaciones de comandos nativos. Los alias y los catálogos
de Skills, plugins o comandos personalizados no se añaden al menú. Si un
nombre también está registrado como comando de barra HTTP, ClickClack despacha primero ese
registro; los demás comandos del menú continúan mediante la entrega normal de
mensajes.

Use el modo `agent` como evidencia de correlación entre servicios. Para un id de mensaje
autoritativo de ClickClack con su estructura canónica `msg_<ulid>`, el canal deriva
el id de ejecución determinista de OpenClaw `clickclack:<message-id>`. Cada llamada al modelo
aparece entonces en los diagnósticos como `clickclack:<message-id>:model:<n>`; cuando ese
turno utiliza ClawRouter, el mismo id de llamada al modelo se envía como `X-Request-ID`.
El modo `model` omite los diagnósticos normales de ejecución y sesión del agente y, por tanto,
no es adecuado para esta ruta de evidencia.

Cuando un evento en tiempo real contiene un `payload.correlation_id` validado, el
canal lo transmite como `X-Correlation-ID` en la obtención autoritativa del mensaje y
en las solicitudes de respuesta resultantes de ClickClack. Los valores utilizan el conjunto seguro de
128 caracteres de ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` y `-`); los valores no válidos
se omiten. Estas asociaciones contienen únicamente identificadores, nunca cuerpos de mensajes,
prompts, completaciones, credenciales ni resultados de herramientas.

## Entrega duradera de contenido multimedia

Las respuestas del agente que contienen contenido multimedia utilizan obligatoriamente la entrega duradera. OpenClaw asigna
nonces estables por cada parte del mensaje y cada carga antes de la primera escritura en ClickClack, por lo que
un reintento reutiliza la misma carga y el mismo mensaje en lugar de consumir cuota de almacenamiento
o publicar duplicados. Si una carga ya existe después de un reinicio,
OpenClaw no vuelve a leer la ruta local original ni la URL remota del contenido multimedia.

Este contrato de recuperación requiere un servidor ClickClack que admita:

- `GET /api/uploads/by-nonce` con
  `X-ClickClack-Upload-Nonce: supported` en resultados encontrados y no encontrados.
- `GET /api/messages/by-nonce` con
  `X-ClickClack-Message-Nonce: supported` en resultados encontrados y no encontrados.
- Creación idempotente de mensajes y asociación de archivos adjuntos para el mismo
  nonce y la misma carga, con ámbito de propietario.

El error 404 genérico de un servidor antiguo no se considera una prueba de que un envío esté ausente.
OpenClaw deja la entrega sin resolver en lugar de arriesgarse a crear un duplicado; actualice
ClickClack antes de activar respuestas de agentes que generen contenido multimedia.

## Filas de actividad del agente

De forma predeterminada, un canal de ClickClack no muestra nada mientras se ejecuta un turno del agente; solo aparece la respuesta final. Establezca `agentActivity: true` en una cuenta para publicar filas de mensaje duraderas `agent_commentary` y `agent_tool` mientras el turno está en curso:

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
- **Requiere el ámbito de token `agent_activity:write`.** Este ámbito es independiente de `bot:write` y no se hereda de él; cree el token del bot con `--scopes bot:write,agent_activity:write` (o conceda el ámbito a un token existente) antes de activar la opción.
- **Degradación en la medida de lo posible.** Si el token carece de `agent_activity:write` o el servidor rechaza las escrituras de actividad, los fallos se registran y la respuesta final se entrega normalmente; no aparece ninguna fila de actividad.
- Las filas se agrupan por turno (`turn_id`), se combinan para que cada paso lógico corresponda a una fila y las filas de herramientas utilizan el mismo formato de progreso que Discord/Slack/Telegram (nombre de la herramienta más detalles del comando).
- **Metadatos de atribución.** Las publicaciones creadas por el agente (las filas de actividad y la respuesta final) incluyen los campos `author_model` y `author_thinking`, resueltos a partir del modelo realmente utilizado durante el turno (también después de recurrir a una alternativa). Los servidores que no definen estas columnas ignoran los campos JSON desconocidos; los servidores que los conservan pueden responder, para cada mensaje, «qué modelo dijo esta línea y con qué nivel de razonamiento».

## Destinos

- `channel:<name-or-id>` envía a un canal del espacio de trabajo. Los destinos sin prefijo usan `channel:` de forma predeterminada.
- `dm:<user_id>` crea o reutiliza una conversación directa con ese usuario.
- `thread:<message_id>` responde en el hilo cuya raíz es ese mensaje.

Los destinos salientes explícitos también pueden incluir el prefijo de proveedor `clickclack:` o `cc:`.

El contenido multimedia saliente utiliza la API de carga de ClickClack y, a continuación, adjunta la carga persistente
al mensaje de canal, la respuesta del hilo o el mensaje directo creados. Los archivos locales y las URL de contenido
multimedia remoto compatibles siguen la política habitual de acceso a contenido multimedia de OpenClaw, con un límite
de 64 MiB por archivo. Los envíos persistentes en cola utilizan nonces independientes con ámbito de propietario para cada
carga y cada parte del mensaje y, después, reintentan asociar los archivos adjuntos con esos mismos
objetos. Consulte [Entrega persistente de contenido multimedia](#durable-media-delivery) para conocer el contrato del servidor
y el comportamiento de recuperación.

Ejemplos:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Permisos

La API de ClickClack aplica los ámbitos del token de ClickClack.

- `bot:read`: permite leer datos del espacio de trabajo, canales, mensajes, hilos, mensajes directos, tiempo real y perfiles.
- `bot:write`: `bot:read` más mensajes de canal, respuestas en hilos, mensajes directos, cargas y publicación del menú de comandos.
- `bot:admin`: `bot:write` más creación de canales.
- `commands:write`: permite publicar el menú de comandos del bot. Se incluye en los paquetes actuales `bot:write` y `bot:admin`, y puede concederse individualmente.
- `agent_activity:write`: filas persistentes de actividad del agente (`agent_commentary` / `agent_tool`). No se hereda de `bot:write` ni de `bot:admin`; solo es obligatorio cuando se establece `agentActivity: true`.

OpenClaw solo necesita el valor actual de `bot:write` para el chat normal del agente y la sincronización del menú de comandos. Añada `agent_activity:write` al habilitar las [filas de actividad del agente](#agent-activity-rows).

## Solución de problemas

- `ClickClack is not configured for account "<id>"`: establezca `baseUrl`, `token` (por ejemplo, mediante `CLICKCLACK_BOT_TOKEN`) y `workspace` para esa cuenta.
- `ClickClack workspace not found: <value>`: establezca `workspace` en el identificador, slug o nombre del espacio de trabajo devuelto por ClickClack.
- No se reciben respuestas: confirme que el token tiene acceso de lectura en tiempo real y tenga en cuenta que el bot ignora sus propios mensajes y los mensajes de otros bots.
- Los envíos al canal fallan: verifique que el bot sea miembro del espacio de trabajo y tenga `bot:write`.
- No aparece el menú de comandos: confirme que `commandMenu` no sea `false`, que el servidor de ClickClack admita `PUT /api/bots/self/commands` y que el token tenga `commands:write`.
