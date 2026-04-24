---
read_when:
    - Conectar Codex, Claude Code u otro cliente MCP a canales respaldados por OpenClaw
    - Ejecutar `openclaw mcp serve`
    - Gestionar definiciones guardadas de servidores MCP de OpenClaw
summary: Exponer conversaciones de canales de OpenClaw a través de MCP y gestionar definiciones guardadas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-04-24T05:23:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9df42ebc547f07698f84888d8cd6125340d0f0e02974a965670844589e1fbf8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` tiene dos funciones:

- ejecutar OpenClaw como un servidor MCP con `openclaw mcp serve`
- gestionar definiciones de servidores MCP salientes propiedad de OpenClaw con `list`, `show`,
  `set` y `unset`

En otras palabras:

- `serve` es OpenClaw actuando como servidor MCP
- `list` / `show` / `set` / `unset` es OpenClaw actuando como un registro del lado cliente MCP
  para otros servidores MCP que sus tiempos de ejecución puedan consumir más adelante

Usa [`openclaw acp`](/es/cli/acp) cuando OpenClaw deba alojar una
sesión de arnés de programación por sí mismo y enrutar ese tiempo de ejecución a través de ACP.

## OpenClaw como servidor MCP

Esta es la ruta `openclaw mcp serve`.

## Cuándo usar `serve`

Usa `openclaw mcp serve` cuando:

- Codex, Claude Code u otro cliente MCP deban hablar directamente con
  conversaciones de canales respaldadas por OpenClaw
- ya tengas un Gateway de OpenClaw local o remoto con sesiones enrutadas
- quieras un único servidor MCP que funcione en todos los backends de canales de OpenClaw en lugar
  de ejecutar bridges separados por canal

Usa [`openclaw acp`](/es/cli/acp) en su lugar cuando OpenClaw deba alojar el
tiempo de ejecución de programación por sí mismo y mantener la sesión del agente dentro de OpenClaw.

## Cómo funciona

`openclaw mcp serve` inicia un servidor MCP stdio. El cliente MCP es propietario de ese
proceso. Mientras el cliente mantenga abierta la sesión stdio, el bridge se conecta a un
Gateway de OpenClaw local o remoto mediante WebSocket y expone conversaciones de canales enrutadas
a través de MCP.

Ciclo de vida:

1. el cliente MCP inicia `openclaw mcp serve`
2. el bridge se conecta a Gateway
3. las sesiones enrutadas se convierten en conversaciones MCP y herramientas de transcripción/historial
4. los eventos en vivo se ponen en cola en memoria mientras el bridge está conectado
5. si el modo de canal de Claude está habilitado, la misma sesión también puede recibir
   notificaciones push específicas de Claude

Comportamiento importante:

- el estado de la cola en vivo empieza cuando el bridge se conecta
- el historial anterior de transcripción se lee con `messages_read`
- las notificaciones push de Claude solo existen mientras la sesión MCP está activa
- cuando el cliente se desconecta, el bridge se cierra y la cola en vivo desaparece
- los servidores MCP stdio iniciados por OpenClaw (incluidos o configurados por el usuario) se desmontan
  como un árbol de procesos al apagarse, por lo que los subprocesos hijo iniciados por el
  servidor no sobreviven después de que el cliente stdio padre se cierre
- eliminar o restablecer una sesión desmonta los clientes MCP de esa sesión mediante la
  ruta compartida de limpieza de tiempo de ejecución, por lo que no quedan conexiones stdio persistentes
  vinculadas a una sesión eliminada

## Elige un modo de cliente

Usa el mismo bridge de dos maneras distintas:

- Clientes MCP genéricos: solo herramientas MCP estándar. Usa `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` y las
  herramientas de aprobación.
- Claude Code: herramientas MCP estándar más el adaptador de canal específico de Claude.
  Habilita `--claude-channel-mode on` o deja el valor predeterminado `auto`.

Hoy, `auto` se comporta igual que `on`. Todavía no hay detección de capacidades del cliente.

## Qué expone `serve`

El bridge usa los metadatos de ruta de sesión existentes de Gateway para exponer
conversaciones respaldadas por canales. Una conversación aparece cuando OpenClaw ya tiene
estado de sesión con una ruta conocida como:

- `channel`
- metadatos de destinatario o destino
- `accountId` opcional
- `threadId` opcional

Esto da a los clientes MCP un solo lugar para:

- listar conversaciones enrutadas recientes
- leer el historial reciente de transcripción
- esperar nuevos eventos entrantes
- enviar una respuesta de vuelta a través de la misma ruta
- ver solicitudes de aprobación que lleguen mientras el bridge está conectado

## Uso

```bash
# Local Gateway
openclaw mcp serve

# Remote Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Remote Gateway with password auth
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Enable verbose bridge logs
openclaw mcp serve --verbose

# Disable Claude-specific push notifications
openclaw mcp serve --claude-channel-mode off
```

## Herramientas del bridge

El bridge actual expone estas herramientas MCP:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Lista conversaciones recientes respaldadas por sesiones que ya tienen metadatos de ruta en
el estado de sesión de Gateway.

Filtros útiles:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Devuelve una conversación por `session_key`.

### `messages_read`

Lee mensajes recientes de transcripción para una conversación respaldada por sesión.

### `attachments_fetch`

Extrae bloques de contenido de mensaje no textual de un mensaje de transcripción. Esta es una
vista de metadatos sobre el contenido de la transcripción, no un almacenamiento duradero independiente
de blobs de adjuntos.

### `events_poll`

Lee eventos en vivo en cola desde un cursor numérico.

### `events_wait`

Hace long-poll hasta que llega el siguiente evento en cola que coincida o hasta que expire el tiempo de espera.

Usa esto cuando un cliente MCP genérico necesite entrega casi en tiempo real sin un
protocolo push específico de Claude.

### `messages_send`

Envía texto de vuelta a través de la misma ruta ya registrada en la sesión.

Comportamiento actual:

- requiere una ruta de conversación existente
- usa el canal, destinatario, id de cuenta e id de hilo de la sesión
- solo envía texto

### `permissions_list_open`

Lista solicitudes pendientes de aprobación de exec/Plugin que el bridge ha observado desde que
se conectó a Gateway.

### `permissions_respond`

Resuelve una solicitud pendiente de aprobación de exec/Plugin con:

- `allow-once`
- `allow-always`
- `deny`

## Modelo de eventos

El bridge mantiene una cola de eventos en memoria mientras está conectado.

Tipos de evento actuales:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Límites importantes:

- la cola es solo en vivo; empieza cuando se inicia el bridge MCP
- `events_poll` y `events_wait` no reproducen por sí solos el historial anterior de Gateway
- el backlog duradero debe leerse con `messages_read`

## Notificaciones de canal de Claude

El bridge también puede exponer notificaciones de canal específicas de Claude. Este es el
equivalente en OpenClaw de un adaptador de canal de Claude Code: las herramientas MCP estándar siguen
disponibles, pero los mensajes entrantes en vivo también pueden llegar como notificaciones MCP
específicas de Claude.

Banderas:

- `--claude-channel-mode off`: solo herramientas MCP estándar
- `--claude-channel-mode on`: habilita notificaciones de canal de Claude
- `--claude-channel-mode auto`: valor predeterminado actual; mismo comportamiento del bridge que `on`

Cuando el modo de canal de Claude está habilitado, el servidor anuncia capacidades
experimentales de Claude y puede emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamiento actual del bridge:

- los mensajes entrantes de transcripción de `user` se reenvían como
  `notifications/claude/channel`
- las solicitudes de permiso de Claude recibidas por MCP se rastrean en memoria
- si la conversación vinculada envía después `yes abcde` o `no abcde`, el bridge
  convierte eso en `notifications/claude/channel/permission`
- estas notificaciones son solo de sesión en vivo; si el cliente MCP se desconecta,
  no hay destino push

Esto es intencionalmente específico del cliente. Los clientes MCP genéricos deben apoyarse en las
herramientas de sondeo estándar.

## Configuración del cliente MCP

Ejemplo de configuración de cliente stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Para la mayoría de clientes MCP genéricos, empieza con la superficie de herramientas estándar e ignora
el modo Claude. Activa el modo Claude solo para clientes que realmente entiendan los
métodos de notificación específicos de Claude.

## Opciones

`openclaw mcp serve` admite:

- `--url <url>`: URL WebSocket de Gateway
- `--token <token>`: token de Gateway
- `--token-file <path>`: leer token desde archivo
- `--password <password>`: contraseña de Gateway
- `--password-file <path>`: leer contraseña desde archivo
- `--claude-channel-mode <auto|on|off>`: modo de notificación de Claude
- `-v`, `--verbose`: registros detallados en stderr

Prefiere `--token-file` o `--password-file` en lugar de secretos en línea cuando sea posible.

## Seguridad y límite de confianza

El bridge no inventa enrutamiento. Solo expone conversaciones que Gateway
ya sabe enrutar.

Eso significa:

- las listas permitidas de remitentes, el emparejamiento y la confianza a nivel de canal siguen perteneciendo a la
  configuración subyacente del canal de OpenClaw
- `messages_send` solo puede responder mediante una ruta almacenada existente
- el estado de aprobación es solo en vivo/en memoria para la sesión actual del bridge
- la autenticación del bridge debe usar los mismos controles de token o contraseña de Gateway en los que confiarías
  para cualquier otro cliente remoto de Gateway

Si falta una conversación en `conversations_list`, la causa habitual no es la
configuración de MCP. Son metadatos de ruta ausentes o incompletos en la
sesión subyacente de Gateway.

## Pruebas

OpenClaw incluye una prueba smoke determinista en Docker para este bridge:

```bash
pnpm test:docker:mcp-channels
```

Esa prueba smoke:

- inicia un contenedor Gateway precargado
- inicia un segundo contenedor que ejecuta `openclaw mcp serve`
- verifica descubrimiento de conversaciones, lecturas de transcripción, lecturas de metadatos
  de adjuntos, comportamiento de la cola de eventos en vivo y enrutamiento de envío saliente
- valida notificaciones de canal y permisos de estilo Claude sobre el bridge MCP stdio real

Esta es la forma más rápida de demostrar que el bridge funciona sin conectar una cuenta real de
Telegram, Discord o iMessage a la ejecución de prueba.

Para un contexto más amplio de pruebas, consulta [Testing](/es/help/testing).

## Solución de problemas

### No se devuelven conversaciones

Normalmente significa que la sesión de Gateway aún no es enrutable. Confirma que la
sesión subyacente tenga almacenados los metadatos de ruta de canal/proveedor, destinatario y
cuenta/hilo opcionales.

### `events_poll` o `events_wait` omiten mensajes antiguos

Es lo esperado. La cola en vivo empieza cuando el bridge se conecta. Lee el historial
anterior de transcripción con `messages_read`.

### Las notificaciones de Claude no aparecen

Comprueba todo esto:

- el cliente mantuvo abierta la sesión MCP stdio
- `--claude-channel-mode` es `on` o `auto`
- el cliente realmente entiende los métodos de notificación específicos de Claude
- el mensaje entrante ocurrió después de que el bridge se conectó

### Faltan aprobaciones

`permissions_list_open` solo muestra solicitudes de aprobación observadas mientras el bridge
estaba conectado. No es una API de historial duradero de aprobaciones.

## OpenClaw como registro cliente MCP

Esta es la ruta `openclaw mcp list`, `show`, `set` y `unset`.

Estos comandos no exponen OpenClaw sobre MCP. Gestionan definiciones de servidores MCP
propiedad de OpenClaw en `mcp.servers` dentro de la configuración de OpenClaw.

Esas definiciones guardadas son para tiempos de ejecución que OpenClaw inicia o configura
más adelante, como Pi integrado y otros adaptadores de tiempo de ejecución. OpenClaw almacena las
definiciones centralmente para que esos tiempos de ejecución no tengan que mantener sus propias listas
duplicadas de servidores MCP.

Comportamiento importante:

- estos comandos solo leen o escriben la configuración de OpenClaw
- no se conectan al servidor MCP de destino
- no validan si el comando, la URL o el transporte remoto son
  accesibles en este momento
- los adaptadores de tiempo de ejecución deciden qué formas de transporte admiten realmente en
  tiempo de ejecución
- Pi integrado expone herramientas MCP configuradas en los perfiles normales de herramientas `coding` y `messaging`;
  `minimal` sigue ocultándolas, y `tools.deny: ["bundle-mcp"]`
  las desactiva explícitamente

## Definiciones guardadas de servidores MCP

OpenClaw también almacena un registro ligero de servidores MCP en la configuración para superficies
que quieren definiciones MCP gestionadas por OpenClaw.

Comandos:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Notas:

- `list` ordena los nombres de servidor.
- `show` sin nombre imprime el objeto completo de servidores MCP configurados.
- `set` espera un valor de objeto JSON en la línea de comandos.
- `unset` falla si el servidor nombrado no existe.

Ejemplos:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Ejemplo de forma de configuración:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Transporte stdio

Inicia un proceso hijo local y se comunica por stdin/stdout.

| Campo | Descripción |
| -------------------------- | --------------------------------- |
| `command` | Ejecutable que se iniciará (obligatorio) |
| `args` | Matriz de argumentos de línea de comandos |
| `env` | Variables de entorno adicionales |
| `cwd` / `workingDirectory` | Directorio de trabajo para el proceso |

#### Filtro de seguridad de env para stdio

OpenClaw rechaza claves de entorno de inicio de intérprete que puedan alterar cómo se inicia un servidor MCP stdio antes del primer RPC, incluso si aparecen en el bloque `env` de un servidor. Las claves bloqueadas incluyen `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` y variables similares de control de tiempo de ejecución. El inicio rechaza estas claves con un error de configuración para que no puedan inyectar un preludio implícito, intercambiar el intérprete o habilitar un depurador contra el proceso stdio. Las variables de entorno normales de credenciales, proxy y específicas del servidor (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizadas, etc.) no se ven afectadas.

Si tu servidor MCP realmente necesita una de las variables bloqueadas, configúrala en el proceso host de gateway en lugar de hacerlo bajo `env` del servidor stdio.

### Transporte SSE / HTTP

Se conecta a un servidor MCP remoto mediante HTTP Server-Sent Events.

| Campo | Descripción |
| --------------------- | ---------------------------------------------------------------- |
| `url` | URL HTTP o HTTPS del servidor remoto (obligatoria) |
| `headers` | Mapa opcional clave-valor de encabezados HTTP (por ejemplo, tokens de autenticación) |
| `connectionTimeoutMs` | Tiempo de espera de conexión por servidor en ms (opcional) |

Ejemplo:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Los valores sensibles en `url` (userinfo) y `headers` se ocultan en los registros y
en la salida de estado.

### Transporte Streamable HTTP

`streamable-http` es una opción de transporte adicional junto con `sse` y `stdio`. Usa streaming HTTP para la comunicación bidireccional con servidores MCP remotos.

| Campo | Descripción |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url` | URL HTTP o HTTPS del servidor remoto (obligatoria) |
| `transport` | Establécelo en `"streamable-http"` para seleccionar este transporte; cuando se omite, OpenClaw usa `sse` |
| `headers` | Mapa opcional clave-valor de encabezados HTTP (por ejemplo, tokens de autenticación) |
| `connectionTimeoutMs` | Tiempo de espera de conexión por servidor en ms (opcional) |

Ejemplo:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Estos comandos gestionan solo la configuración guardada. No inician el bridge de canal,
no abren una sesión activa de cliente MCP ni demuestran que el servidor de destino sea accesible.

## Límites actuales

Esta página documenta el bridge tal como se distribuye hoy.

Límites actuales:

- el descubrimiento de conversaciones depende de los metadatos de ruta de sesión existentes en Gateway
- no hay protocolo push genérico más allá del adaptador específico de Claude
- aún no hay herramientas para editar mensajes o reaccionar
- el transporte HTTP/SSE/streamable-http se conecta a un único servidor remoto; todavía no hay upstream multiplexado
- `permissions_list_open` solo incluye aprobaciones observadas mientras el bridge está
  conectado

## Relacionado

- [Referencia de CLI](/es/cli)
- [Plugins](/es/cli/plugins)
