---
read_when:
    - Conectar Codex, Claude Code u otro cliente MCP a canales respaldados por OpenClaw
    - Ejecutando `openclaw mcp serve`
    - Gestión de las definiciones de servidores MCP guardadas por OpenClaw
sidebarTitle: MCP
summary: Exponer las conversaciones de canales de OpenClaw a través de MCP y gestionar las definiciones guardadas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-04-30T05:34:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d66ec20b81ab3894c7202ee1c1c6666bd9cdeffc8d48a280b1f298bb358887ef
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` tiene dos funciones:

- ejecutar OpenClaw como servidor MCP con `openclaw mcp serve`
- gestionar las definiciones de servidores MCP salientes propiedad de OpenClaw con `list`, `show`, `set` y `unset`

En otras palabras:

- `serve` es OpenClaw actuando como servidor MCP
- `list` / `show` / `set` / `unset` es OpenClaw actuando como registro del lado del cliente MCP para otros servidores MCP que sus runtimes puedan consumir más adelante

Usa [`openclaw acp`](/es/cli/acp) cuando OpenClaw deba alojar por sí mismo una sesión de arnés de codificación y enrutar ese runtime a través de ACP.

## OpenClaw como servidor MCP

Esta es la ruta de `openclaw mcp serve`.

### Cuándo usar `serve`

Usa `openclaw mcp serve` cuando:

- Codex, Claude Code u otro cliente MCP deba comunicarse directamente con conversaciones de canal respaldadas por OpenClaw
- ya tengas un Gateway de OpenClaw local o remoto con sesiones enrutadas
- quieras un servidor MCP que funcione con los backends de canal de OpenClaw en lugar de ejecutar puentes separados por canal

Usa [`openclaw acp`](/es/cli/acp) en su lugar cuando OpenClaw deba alojar el runtime de codificación por sí mismo y mantener la sesión del agente dentro de OpenClaw.

### Cómo funciona

`openclaw mcp serve` inicia un servidor MCP stdio. El cliente MCP es propietario de ese proceso. Mientras el cliente mantiene abierta la sesión stdio, el puente se conecta a un Gateway de OpenClaw local o remoto mediante WebSocket y expone las conversaciones de canal enrutadas sobre MCP.

<Steps>
  <Step title="El cliente inicia el puente">
    El cliente MCP inicia `openclaw mcp serve`.
  </Step>
  <Step title="El puente se conecta al Gateway">
    El puente se conecta al Gateway de OpenClaw mediante WebSocket.
  </Step>
  <Step title="Las sesiones se convierten en conversaciones MCP">
    Las sesiones enrutadas se convierten en conversaciones MCP y herramientas de transcripción/historial.
  </Step>
  <Step title="Los eventos en vivo se encolan">
    Los eventos en vivo se encolan en memoria mientras el puente está conectado.
  </Step>
  <Step title="Push opcional de Claude">
    Si el modo de canal de Claude está habilitado, la misma sesión también puede recibir notificaciones push específicas de Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportamiento importante">
    - el estado de la cola en vivo empieza cuando el puente se conecta
    - el historial de transcripciones anterior se lee con `messages_read`
    - las notificaciones push de Claude solo existen mientras la sesión MCP está activa
    - cuando el cliente se desconecta, el puente sale y la cola en vivo desaparece
    - los puntos de entrada de agente de una sola ejecución, como `openclaw agent` y `openclaw infer model run`, retiran cualquier runtime MCP incluido que abran cuando se completa la respuesta, por lo que las ejecuciones con scripts repetidas no acumulan procesos hijo MCP stdio
    - los servidores MCP stdio iniciados por OpenClaw (incluidos o configurados por el usuario) se cierran como un árbol de procesos al apagar, por lo que los subprocesos hijo iniciados por el servidor no sobreviven después de que sale el cliente stdio principal
    - eliminar o restablecer una sesión desecha los clientes MCP de esa sesión mediante la ruta compartida de limpieza del runtime, por lo que no quedan conexiones stdio persistentes vinculadas a una sesión eliminada

  </Accordion>
</AccordionGroup>

### Elige un modo de cliente

Usa el mismo puente de dos maneras diferentes:

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

### Qué expone `serve`

El puente usa los metadatos existentes de ruta de sesión del Gateway para exponer conversaciones respaldadas por canales. Una conversación aparece cuando OpenClaw ya tiene estado de sesión con una ruta conocida, como:

- `channel`
- metadatos de destinatario o destino
- `accountId` opcional
- `threadId` opcional

Esto da a los clientes MCP un único lugar para:

- listar conversaciones enrutadas recientes
- leer historial reciente de transcripciones
- esperar nuevos eventos entrantes
- enviar una respuesta por la misma ruta
- ver solicitudes de aprobación que llegan mientras el puente está conectado

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

### Herramientas del puente

El puente actual expone estas herramientas MCP:

<AccordionGroup>
  <Accordion title="conversations_list">
    Lista conversaciones recientes respaldadas por sesiones que ya tienen metadatos de ruta en el estado de sesión del Gateway.

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
    Lee mensajes recientes de transcripción para una conversación respaldada por sesión.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrae bloques de contenido de mensaje no textuales de un mensaje de transcripción. Esta es una vista de metadatos sobre el contenido de la transcripción, no un almacén independiente y durable de blobs de adjuntos.
  </Accordion>
  <Accordion title="events_poll">
    Lee eventos en vivo encolados desde un cursor numérico.
  </Accordion>
  <Accordion title="events_wait">
    Hace long polling hasta que llegue el siguiente evento encolado coincidente o venza un tiempo de espera.

    Usa esto cuando un cliente MCP genérico necesite entrega casi en tiempo real sin un protocolo push específico de Claude.

  </Accordion>
  <Accordion title="messages_send">
    Envía texto de vuelta por la misma ruta ya registrada en la sesión.

    Comportamiento actual:

    - requiere una ruta de conversación existente
    - usa el canal, destinatario, id de cuenta e id de hilo de la sesión
    - envía solo texto

  </Accordion>
  <Accordion title="permissions_list_open">
    Lista solicitudes pendientes de aprobación de exec/plugin que el puente ha observado desde que se conectó al Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Resuelve una solicitud pendiente de aprobación de exec/plugin con:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modelo de eventos

El puente mantiene una cola de eventos en memoria mientras está conectado.

Tipos de eventos actuales:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- la cola es solo en vivo; empieza cuando se inicia el puente MCP
- `events_poll` y `events_wait` no reproducen por sí mismos el historial anterior del Gateway
- el backlog durable debe leerse con `messages_read`

</Warning>

### Notificaciones de canal de Claude

El puente también puede exponer notificaciones de canal específicas de Claude. Este es el equivalente en OpenClaw de un adaptador de canal de Claude Code: las herramientas MCP estándar siguen disponibles, pero los mensajes entrantes en vivo también pueden llegar como notificaciones MCP específicas de Claude.

<Tabs>
  <Tab title="desactivado">
    `--claude-channel-mode off`: solo herramientas MCP estándar.
  </Tab>
  <Tab title="activado">
    `--claude-channel-mode on`: habilita las notificaciones de canal de Claude.
  </Tab>
  <Tab title="auto (predeterminado)">
    `--claude-channel-mode auto`: valor predeterminado actual; mismo comportamiento del puente que `on`.
  </Tab>
</Tabs>

Cuando el modo de canal de Claude está habilitado, el servidor anuncia capacidades experimentales de Claude y puede emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamiento actual del puente:

- los mensajes de transcripción entrantes `user` se reenvían como `notifications/claude/channel`
- las solicitudes de permiso de Claude recibidas sobre MCP se rastrean en memoria
- si la conversación vinculada envía posteriormente `yes abcde` o `no abcde`, el puente lo convierte en `notifications/claude/channel/permission`
- estas notificaciones son solo de sesión en vivo; si el cliente MCP se desconecta, no hay destino push

Esto es intencionalmente específico del cliente. Los clientes MCP genéricos deben depender de las herramientas de sondeo estándar.

### Configuración de cliente MCP

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
  Lee el token desde un archivo.
</ParamField>
<ParamField path="--password" type="string">
  Contraseña del Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Lee la contraseña desde un archivo.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Modo de notificación de Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Registros detallados en stderr.
</ParamField>

<Tip>
Prefiere `--token-file` o `--password-file` antes que secretos en línea cuando sea posible.
</Tip>

### Límite de seguridad y confianza

El puente no inventa el enrutamiento. Solo expone conversaciones que el Gateway ya sabe cómo enrutar.

Eso significa que:

- las listas de remitentes permitidos, el emparejamiento y la confianza a nivel de canal siguen perteneciendo a la configuración de canal subyacente de OpenClaw
- `messages_send` solo puede responder mediante una ruta almacenada existente
- el estado de aprobación es solo en vivo/en memoria para la sesión actual del puente
- la autenticación del puente debe usar los mismos controles de token o contraseña del Gateway en los que confiarías para cualquier otro cliente remoto del Gateway

Si falta una conversación en `conversations_list`, la causa habitual no es la configuración de MCP. Son metadatos de ruta faltantes o incompletos en la sesión subyacente del Gateway.

### Pruebas

OpenClaw incluye una prueba smoke determinista en Docker para este puente:

```bash
pnpm test:docker:mcp-channels
```

Esa prueba smoke:

- inicia un contenedor de Gateway con datos iniciales
- inicia un segundo contenedor que ejecuta `openclaw mcp serve`
- verifica el descubrimiento de conversaciones, lecturas de transcripción, lecturas de metadatos de adjuntos, comportamiento de la cola de eventos en vivo y enrutamiento de envío saliente
- valida notificaciones de canal y permiso al estilo Claude sobre el puente MCP stdio real

Esta es la forma más rápida de demostrar que el puente funciona sin conectar una cuenta real de Telegram, Discord o iMessage a la ejecución de pruebas.

Para un contexto de pruebas más amplio, consulta [Pruebas](/es/help/testing).

### Solución de problemas

<AccordionGroup>
  <Accordion title="No se devuelven conversaciones">
    Normalmente significa que la sesión del Gateway aún no es enrutable. Confirma que la sesión subyacente tenga metadatos almacenados de canal/proveedor, destinatario y ruta opcional de cuenta/hilo.
  </Accordion>
  <Accordion title="events_poll o events_wait no ve mensajes antiguos">
    Es esperado. La cola en vivo empieza cuando el puente se conecta. Lee el historial de transcripciones anterior con `messages_read`.
  </Accordion>
  <Accordion title="Las notificaciones de Claude no aparecen">
    Comprueba todo esto:

    - el cliente mantuvo abierta la sesión MCP stdio
    - `--claude-channel-mode` es `on` o `auto`
    - el cliente realmente entiende los métodos de notificación específicos de Claude
    - el mensaje entrante ocurrió después de que el puente se conectara

  </Accordion>
  <Accordion title="Faltan aprobaciones">
    `permissions_list_open` solo muestra solicitudes de aprobación observadas mientras el puente estaba conectado. No es una API de historial durable de aprobaciones.
  </Accordion>
</AccordionGroup>

## OpenClaw como registro de cliente MCP

Esta es la ruta de `openclaw mcp list`, `show`, `set` y `unset`.

Estos comandos no exponen OpenClaw mediante MCP. Gestionan las definiciones de servidores MCP propiedad de OpenClaw bajo `mcp.servers` en la configuración de OpenClaw.

Esas definiciones guardadas son para entornos de ejecución que OpenClaw inicia o configura más tarde, como Pi integrado y otros adaptadores de entorno de ejecución. OpenClaw almacena las definiciones de forma centralizada para que esos entornos de ejecución no tengan que mantener sus propias listas duplicadas de servidores MCP.

<AccordionGroup>
  <Accordion title="Important behavior">
    - estos comandos solo leen o escriben la configuración de OpenClaw
    - no se conectan al servidor MCP de destino
    - no validan si el comando, la URL o el transporte remoto están disponibles en este momento
    - los adaptadores de entorno de ejecución deciden qué formas de transporte admiten realmente en tiempo de ejecución
    - Pi integrado expone las herramientas MCP configuradas en los perfiles de herramientas normales `coding` y `messaging`; `minimal` sigue ocultándolas, y `tools.deny: ["bundle-mcp"]` las deshabilita explícitamente
    - los entornos de ejecución MCP agrupados con ámbito de sesión se recolectan después de `mcp.sessionIdleTtlMs` milisegundos de inactividad (10 minutos de forma predeterminada; establece `0` para deshabilitarlo) y las ejecuciones integradas de una sola vez los limpian al finalizar la ejecución

  </Accordion>
</AccordionGroup>

Los adaptadores de entorno de ejecución pueden normalizar este registro compartido a la forma que espera su cliente descendente. Por ejemplo, Pi integrado consume directamente los valores `transport` de OpenClaw, mientras que Claude Code y Gemini reciben valores `type` nativos de la CLI, como `http`, `sse` o `stdio`.

### Definiciones de servidores MCP guardadas

OpenClaw también almacena un registro ligero de servidores MCP en la configuración para superficies que quieren definiciones MCP gestionadas por OpenClaw.

Comandos:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Notas:

- `list` ordena los nombres de los servidores.
- `show` sin un nombre imprime el objeto completo de servidores MCP configurados.
- `set` espera un valor de objeto JSON en la línea de comandos.
- Usa `transport: "streamable-http"` para servidores MCP Streamable HTTP. `openclaw mcp set` también normaliza `type: "http"` nativo de la CLI a la misma forma canónica de configuración por compatibilidad.
- `unset` falla si el servidor con ese nombre no existe.

Ejemplos:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

Forma de configuración de ejemplo:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http"
      }
    }
  }
}
```

### Transporte stdio

Inicia un proceso secundario local y se comunica mediante stdin/stdout.

| Campo                      | Descripción                              |
| -------------------------- | ---------------------------------------- |
| `command`                  | Ejecutable que se iniciará (obligatorio) |
| `args`                     | Matriz de argumentos de línea de comandos |
| `env`                      | Variables de entorno adicionales         |
| `cwd` / `workingDirectory` | Directorio de trabajo para el proceso    |

<Warning>
**Filtro de seguridad de env para stdio**

OpenClaw rechaza claves de env de inicio de intérprete que pueden alterar cómo se inicia un servidor MCP stdio antes del primer RPC, incluso si aparecen en el bloque `env` de un servidor. Las claves bloqueadas incluyen `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` y variables similares de control del entorno de ejecución. El inicio las rechaza con un error de configuración para que no puedan inyectar un preludio implícito, cambiar el intérprete o habilitar un depurador contra el proceso stdio. Las variables de entorno ordinarias de credenciales, proxy y específicas del servidor (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizadas, etc.) no se ven afectadas.

Si tu servidor MCP realmente necesita una de las variables bloqueadas, configúrala en el proceso host del Gateway en lugar de bajo el `env` del servidor stdio.
</Warning>

### Transporte SSE / HTTP

Se conecta a un servidor MCP remoto mediante HTTP Server-Sent Events.

| Campo                 | Descripción                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del servidor remoto (obligatorio)                     |
| `headers`             | Mapa clave-valor opcional de encabezados HTTP (por ejemplo tokens auth) |
| `connectionTimeoutMs` | Tiempo de espera de conexión por servidor en ms (opcional)             |

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

Los valores sensibles en `url` (userinfo) y `headers` se redactan en los registros y en la salida de estado.

### Transporte Streamable HTTP

`streamable-http` es una opción de transporte adicional junto con `sse` y `stdio`. Usa streaming HTTP para comunicación bidireccional con servidores MCP remotos.

| Campo                 | Descripción                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `url`                 | URL HTTP o HTTPS del servidor remoto (obligatorio)                                                           |
| `transport`           | Establécelo en `"streamable-http"` para seleccionar este transporte; si se omite, OpenClaw usa `sse`          |
| `headers`             | Mapa clave-valor opcional de encabezados HTTP (por ejemplo tokens auth)                                      |
| `connectionTimeoutMs` | Tiempo de espera de conexión por servidor en ms (opcional)                                                   |

La configuración de OpenClaw usa `transport: "streamable-http"` como la escritura canónica. Los valores MCP nativos de la CLI `type: "http"` se aceptan cuando se guardan mediante `openclaw mcp set` y los repara `openclaw doctor --fix` en la configuración existente, pero `transport` es lo que Pi integrado consume directamente.

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
Estos comandos gestionan solo la configuración guardada. No inician el puente de canal, no abren una sesión activa de cliente MCP ni prueban que el servidor de destino esté disponible.
</Note>

## Límites actuales

Esta página documenta el puente tal como se entrega hoy.

Límites actuales:

- el descubrimiento de conversaciones depende de los metadatos de ruta de sesión existentes del Gateway
- no hay un protocolo push genérico más allá del adaptador específico de Claude
- todavía no hay herramientas para editar mensajes ni reaccionar
- el transporte HTTP/SSE/streamable-http se conecta a un único servidor remoto; todavía no hay upstream multiplexado
- `permissions_list_open` solo incluye aprobaciones observadas mientras el puente está conectado

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Plugins](/es/cli/plugins)
