---
read_when:
    - Conectar Codex, Claude Code u otro cliente MCP a canales respaldados por OpenClaw
    - Ejecutar `openclaw mcp serve`
    - Gestionar definiciones de servidores MCP guardadas por OpenClaw
sidebarTitle: MCP
summary: Exponer conversaciones de canales de OpenClaw a través de MCP y gestionar definiciones guardadas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-04-26T11:26:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e003d974a7ae989f240d7608470ddcf2f37e20ca342cf4569c14677dc6fc1d8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` tiene dos funciones:

- ejecutar OpenClaw como servidor MCP con `openclaw mcp serve`
- gestionar definiciones de servidores MCP salientes propiedad de OpenClaw con `list`, `show`, `set` y `unset`

En otras palabras:

- `serve` es OpenClaw actuando como servidor MCP
- `list` / `show` / `set` / `unset` es OpenClaw actuando como un registro del lado cliente MCP para otros servidores MCP que sus runtimes podrían consumir más tarde

Usa [`openclaw acp`](/es/cli/acp) cuando OpenClaw deba alojar por sí mismo una sesión de arnés de programación y enrutar ese runtime mediante ACP.

## OpenClaw como servidor MCP

Esta es la ruta `openclaw mcp serve`.

### Cuándo usar `serve`

Usa `openclaw mcp serve` cuando:

- Codex, Claude Code u otro cliente MCP deba comunicarse directamente con conversaciones de canales respaldadas por OpenClaw
- ya tengas un Gateway de OpenClaw local o remoto con sesiones enrutadas
- quieras un único servidor MCP que funcione en los backends de canales de OpenClaw en lugar de ejecutar bridges separados por canal

Usa [`openclaw acp`](/es/cli/acp) en su lugar cuando OpenClaw deba alojar el runtime de programación por sí mismo y mantener la sesión del agente dentro de OpenClaw.

### Cómo funciona

`openclaw mcp serve` inicia un servidor MCP stdio. El cliente MCP es dueño de ese proceso. Mientras el cliente mantenga abierta la sesión stdio, el bridge se conecta por WebSocket a un Gateway de OpenClaw local o remoto y expone conversaciones de canales enrutadas a través de MCP.

<Steps>
  <Step title="El cliente genera el bridge">
    El cliente MCP genera `openclaw mcp serve`.
  </Step>
  <Step title="El bridge se conecta al Gateway">
    El bridge se conecta al Gateway de OpenClaw por WebSocket.
  </Step>
  <Step title="Las sesiones se convierten en conversaciones MCP">
    Las sesiones enrutadas se convierten en conversaciones MCP y herramientas de transcripción/historial.
  </Step>
  <Step title="Cola de eventos en vivo">
    Los eventos en vivo se ponen en cola en memoria mientras el bridge está conectado.
  </Step>
  <Step title="Push opcional de Claude">
    Si el modo de canal de Claude está habilitado, la misma sesión también puede recibir notificaciones push específicas de Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportamiento importante">
    - el estado de la cola en vivo comienza cuando el bridge se conecta
    - el historial de transcripciones más antiguo se lee con `messages_read`
    - las notificaciones push de Claude solo existen mientras la sesión MCP está activa
    - cuando el cliente se desconecta, el bridge termina y la cola en vivo desaparece
    - los puntos de entrada de agente de una sola ejecución, como `openclaw agent` y `openclaw infer model run`, retiran los runtimes MCP incluidos que abren cuando la respuesta termina, por lo que las ejecuciones repetidas por script no acumulan procesos hijo MCP stdio
    - los servidores MCP stdio iniciados por OpenClaw (incluidos o configurados por el usuario) se desmontan como árbol de procesos al apagarse, por lo que los subprocesos hijo iniciados por el servidor no sobreviven después de que el cliente stdio padre sale
    - eliminar o restablecer una sesión libera los clientes MCP de esa sesión a través de la ruta compartida de limpieza del runtime, por lo que no quedan conexiones stdio residuales ligadas a una sesión eliminada
  </Accordion>
</AccordionGroup>

### Elegir un modo de cliente

Usa el mismo bridge de dos maneras diferentes:

<Tabs>
  <Tab title="Clientes MCP genéricos">
    Solo herramientas MCP estándar. Usa `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` y las herramientas de aprobación.
  </Tab>
  <Tab title="Claude Code">
    Herramientas MCP estándar más el adaptador de canal específico de Claude. Habilita `--claude-channel-mode on` o deja el valor predeterminado `auto`.
  </Tab>
</Tabs>

<Note>
Hoy, `auto` se comporta igual que `on`. Todavía no hay detección de capacidades del cliente.
</Note>

### Lo que expone `serve`

El bridge usa metadatos de rutas de sesión existentes del Gateway para exponer conversaciones respaldadas por canales. Una conversación aparece cuando OpenClaw ya tiene estado de sesión con una ruta conocida, como:

- `channel`
- metadatos del destinatario o destino
- `accountId` opcional
- `threadId` opcional

Esto da a los clientes MCP un único lugar para:

- listar conversaciones enrutadas recientes
- leer historial reciente de transcripciones
- esperar nuevos eventos entrantes
- enviar una respuesta de vuelta por la misma ruta
- ver solicitudes de aprobación que llegan mientras el bridge está conectado

### Uso

<Tabs>
  <Tab title="Gateway local">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway remoto (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway remoto (contraseña)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Detallado / Claude desactivado">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Herramientas del bridge

Actualmente, el bridge expone estas herramientas MCP:

<AccordionGroup>
  <Accordion title="conversations_list">
    Lista conversaciones recientes respaldadas por sesión que ya tienen metadatos de ruta en el estado de sesión del Gateway.

    Filtros útiles:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Devuelve una conversación por `session_key`.
  </Accordion>
  <Accordion title="messages_read">
    Lee mensajes recientes de la transcripción para una conversación respaldada por sesión.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrae bloques de contenido de mensaje no textual de una transcripción. Esta es una vista de metadatos sobre el contenido de la transcripción, no un almacén independiente y duradero de blobs adjuntos.
  </Accordion>
  <Accordion title="events_poll">
    Lee eventos en vivo en cola desde un cursor numérico.
  </Accordion>
  <Accordion title="events_wait">
    Hace long-poll hasta que llega el siguiente evento coincidente en cola o expira un tiempo de espera.

    Usa esto cuando un cliente MCP genérico necesite entrega casi en tiempo real sin un protocolo push específico de Claude.

  </Accordion>
  <Accordion title="messages_send">
    Envía texto de vuelta por la misma ruta ya registrada en la sesión.

    Comportamiento actual:

    - requiere una ruta de conversación existente
    - usa el canal, destinatario, id de cuenta e id de hilo de la sesión
    - solo envía texto

  </Accordion>
  <Accordion title="permissions_list_open">
    Lista solicitudes pendientes de aprobación de exec/Plugin que el bridge ha observado desde que se conectó al Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Resuelve una solicitud pendiente de aprobación de exec/Plugin con:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modelo de eventos

El bridge mantiene una cola de eventos en memoria mientras está conectado.

Tipos de eventos actuales:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- la cola es solo en vivo; comienza cuando inicia el bridge MCP
- `events_poll` y `events_wait` no reproducen por sí solos historial más antiguo del Gateway
- el backlog duradero debe leerse con `messages_read`
</Warning>

### Notificaciones de canal de Claude

El bridge también puede exponer notificaciones de canal específicas de Claude. Este es el equivalente en OpenClaw de un adaptador de canal de Claude Code: las herramientas MCP estándar siguen disponibles, pero los mensajes entrantes en vivo también pueden llegar como notificaciones MCP específicas de Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: solo herramientas MCP estándar.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: habilita notificaciones de canal de Claude.
  </Tab>
  <Tab title="auto (predeterminado)">
    `--claude-channel-mode auto`: valor predeterminado actual; mismo comportamiento del bridge que `on`.
  </Tab>
</Tabs>

Cuando el modo de canal de Claude está habilitado, el servidor anuncia capacidades experimentales de Claude y puede emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamiento actual del bridge:

- los mensajes entrantes de transcripción `user` se reenvían como `notifications/claude/channel`
- las solicitudes de permisos de Claude recibidas a través de MCP se rastrean en memoria
- si la conversación vinculada envía más tarde `yes abcde` o `no abcde`, el bridge lo convierte en `notifications/claude/channel/permission`
- estas notificaciones existen solo durante la sesión en vivo; si el cliente MCP se desconecta, no hay destino push

Esto es intencionadamente específico del cliente. Los clientes MCP genéricos deben apoyarse en las herramientas de sondeo estándar.

### Configuración del cliente MCP

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

Para la mayoría de los clientes MCP genéricos, empieza con la superficie de herramientas estándar e ignora el modo Claude. Activa el modo Claude solo para clientes que realmente entiendan los métodos de notificación específicos de Claude.

### Opciones

`openclaw mcp serve` admite:

<ParamField path="--url" type="string">
  URL WebSocket del Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Token del Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Leer el token desde un archivo.
</ParamField>
<ParamField path="--password" type="string">
  Contraseña del Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Leer la contraseña desde un archivo.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Modo de notificación de Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Registros detallados en stderr.
</ParamField>

<Tip>
Prefiere `--token-file` o `--password-file` en lugar de secretos inline cuando sea posible.
</Tip>

### Seguridad y límite de confianza

El bridge no inventa el enrutamiento. Solo expone conversaciones que el Gateway ya sabe cómo enrutar.

Eso significa:

- las allowlists de remitentes, el emparejamiento y la confianza a nivel de canal siguen perteneciendo a la configuración subyacente del canal de OpenClaw
- `messages_send` solo puede responder a través de una ruta almacenada existente
- el estado de aprobación es solo en vivo/en memoria para la sesión actual del bridge
- la autenticación del bridge debe usar los mismos controles de token o contraseña del Gateway que considerarías confiables para cualquier otro cliente remoto del Gateway

Si falta una conversación en `conversations_list`, la causa habitual no es la configuración de MCP. Son metadatos de ruta faltantes o incompletos en la sesión subyacente del Gateway.

### Pruebas

OpenClaw incluye una prueba de humo Docker determinista para este bridge:

```bash
pnpm test:docker:mcp-channels
```

Esa prueba de humo:

- inicia un contenedor Gateway con datos precargados
- inicia un segundo contenedor que genera `openclaw mcp serve`
- verifica descubrimiento de conversaciones, lecturas de transcripciones, lecturas de metadatos de adjuntos, comportamiento de la cola de eventos en vivo y enrutamiento de envíos salientes
- valida notificaciones de canal y permisos de estilo Claude sobre el bridge MCP stdio real

Esta es la forma más rápida de demostrar que el bridge funciona sin conectar una cuenta real de Telegram, Discord o iMessage a la ejecución de prueba.

Para un contexto más amplio de pruebas, consulta [Testing](/es/help/testing).

### Solución de problemas

<AccordionGroup>
  <Accordion title="No se devuelven conversaciones">
    Normalmente significa que la sesión del Gateway todavía no es enrutable. Confirma que la sesión subyacente tenga almacenados los metadatos de ruta de canal/proveedor, destinatario y cuenta/hilo opcionales.
  </Accordion>
  <Accordion title="events_poll o events_wait omite mensajes antiguos">
    Es lo esperado. La cola en vivo comienza cuando el bridge se conecta. Lee el historial de transcripciones más antiguo con `messages_read`.
  </Accordion>
  <Accordion title="No aparecen notificaciones de Claude">
    Comprueba todo esto:

    - el cliente mantuvo abierta la sesión MCP stdio
    - `--claude-channel-mode` es `on` o `auto`
    - el cliente realmente entiende los métodos de notificación específicos de Claude
    - el mensaje entrante ocurrió después de que el bridge se conectó

  </Accordion>
  <Accordion title="Faltan aprobaciones">
    `permissions_list_open` solo muestra solicitudes de aprobación observadas mientras el bridge estaba conectado. No es una API duradera de historial de aprobaciones.
  </Accordion>
</AccordionGroup>

## OpenClaw como registro de cliente MCP

Esta es la ruta de `openclaw mcp list`, `show`, `set` y `unset`.

Estos comandos no exponen OpenClaw a través de MCP. Gestionan definiciones de servidores MCP propiedad de OpenClaw en `mcp.servers` dentro de la configuración de OpenClaw.

Esas definiciones guardadas son para runtimes que OpenClaw inicia o configura más tarde, como Pi integrado y otros adaptadores de runtime. OpenClaw almacena las definiciones de forma centralizada para que esos runtimes no necesiten mantener sus propias listas duplicadas de servidores MCP.

<AccordionGroup>
  <Accordion title="Comportamiento importante">
    - estos comandos solo leen o escriben la configuración de OpenClaw
    - no se conectan al servidor MCP de destino
    - no validan si el comando, la URL o el transporte remoto son accesibles en este momento
    - los adaptadores de runtime deciden qué formas de transporte admiten realmente en tiempo de ejecución
    - Pi integrado expone las herramientas MCP configuradas en los perfiles de herramientas normales `coding` y `messaging`; `minimal` sigue ocultándolas, y `tools.deny: ["bundle-mcp"]` las desactiva explícitamente
    - los runtimes MCP incluidos con alcance de sesión se recolectan tras `mcp.sessionIdleTtlMs` milisegundos de inactividad (predeterminado: 10 minutos; establece `0` para desactivar) y las ejecuciones integradas de una sola vez los limpian al terminar la ejecución
  </Accordion>
</AccordionGroup>

Los adaptadores de runtime pueden normalizar este registro compartido a la forma que espera su cliente descendente. Por ejemplo, Pi integrado consume directamente los valores `transport` de OpenClaw, mientras que Claude Code y Gemini reciben valores `type` nativos de la CLI como `http`, `sse` o `stdio`.

### Definiciones guardadas de servidores MCP

OpenClaw también almacena un registro ligero de servidores MCP en la configuración para las superficies que quieren definiciones MCP gestionadas por OpenClaw.

Comandos:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Notas:

- `list` ordena los nombres de los servidores.
- `show` sin nombre imprime el objeto completo de servidores MCP configurados.
- `set` espera un valor de objeto JSON en una sola línea de comandos.
- `unset` falla si el servidor nombrado no existe.

Ejemplos:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Ejemplo de estructura de configuración:

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

| Campo                      | Descripción                         |
| -------------------------- | ----------------------------------- |
| `command`                  | Ejecutable que se iniciará (obligatorio) |
| `args`                     | Matriz de argumentos de línea de comandos |
| `env`                      | Variables de entorno adicionales    |
| `cwd` / `workingDirectory` | Directorio de trabajo del proceso   |

<Warning>
**Filtro de seguridad de env para stdio**

OpenClaw rechaza claves `env` de inicio de intérprete que puedan alterar cómo se inicia un servidor MCP stdio antes del primer RPC, incluso si aparecen en el bloque `env` de un servidor. Las claves bloqueadas incluyen `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` y variables similares de control del runtime. El inicio rechaza estas claves con un error de configuración para que no puedan inyectar un preludio implícito, cambiar el intérprete o habilitar un depurador contra el proceso stdio. Las variables de entorno normales de credenciales, proxy y específicas del servidor (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizadas, etc.) no se ven afectadas.

Si tu servidor MCP realmente necesita una de las variables bloqueadas, configúrala en el proceso host del Gateway en lugar de hacerlo bajo `env` del servidor stdio.
</Warning>

### Transporte SSE / HTTP

Se conecta a un servidor MCP remoto mediante HTTP Server-Sent Events.

| Campo                 | Descripción                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del servidor remoto (obligatorio)              |
| `headers`             | Mapa opcional clave-valor de encabezados HTTP (por ejemplo, tokens de autenticación) |
| `connectionTimeoutMs` | Tiempo de espera de conexión por servidor en ms (opcional)      |

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

Los valores sensibles en `url` (userinfo) y `headers` se redaccionan en los registros y en la salida de estado.

### Transporte Streamable HTTP

`streamable-http` es una opción de transporte adicional junto con `sse` y `stdio`. Usa streaming HTTP para la comunicación bidireccional con servidores MCP remotos.

| Campo                 | Descripción                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del servidor remoto (obligatorio)                                     |
| `transport`           | Establécelo en `"streamable-http"` para seleccionar este transporte; cuando se omite, OpenClaw usa `sse` |
| `headers`             | Mapa opcional clave-valor de encabezados HTTP (por ejemplo, tokens de autenticación)   |
| `connectionTimeoutMs` | Tiempo de espera de conexión por servidor en ms (opcional)                             |

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

<Note>
Estos comandos gestionan solo la configuración guardada. No inician el bridge del canal, no abren una sesión de cliente MCP en vivo ni demuestran que el servidor de destino sea accesible.
</Note>

## Límites actuales

Esta página documenta el bridge tal como se distribuye hoy.

Límites actuales:

- el descubrimiento de conversaciones depende de metadatos de rutas de sesión existentes en el Gateway
- no hay protocolo push genérico más allá del adaptador específico de Claude
- todavía no hay herramientas para editar mensajes ni reaccionar
- el transporte HTTP/SSE/streamable-http se conecta a un único servidor remoto; todavía no hay upstream multiplexado
- `permissions_list_open` solo incluye aprobaciones observadas mientras el bridge está conectado

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Plugins](/es/cli/plugins)
