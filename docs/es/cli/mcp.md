---
read_when:
    - Conectar Codex, Claude Code u otro cliente MCP a canales respaldados por OpenClaw
    - Ejecutando `openclaw mcp serve`
    - Gestionar las definiciones de servidores MCP guardadas por OpenClaw
sidebarTitle: MCP
summary: Exponer las conversaciones de canales de OpenClaw mediante MCP y gestionar las definiciones guardadas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-05-02T20:44:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1d3b5d7c3a9075c020a35bc9617d6e6902c96b40cc03e76119d01d0d94fd014
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` tiene dos tareas:

- ejecutar OpenClaw como servidor MCP con `openclaw mcp serve`
- gestionar definiciones de servidores MCP salientes propiedad de OpenClaw con `list`, `show`, `set` y `unset`

En otras palabras:

- `serve` es OpenClaw actuando como servidor MCP
- `list` / `show` / `set` / `unset` es OpenClaw actuando como registro del lado del cliente MCP para otros servidores MCP que sus runtimes podrían consumir más adelante

Usa [`openclaw acp`](/es/cli/acp) cuando OpenClaw deba alojar por sí mismo una sesión de arnés de codificación y enrutar ese runtime mediante ACP.

## OpenClaw como servidor MCP

Esta es la ruta de `openclaw mcp serve`.

### Cuándo usar `serve`

Usa `openclaw mcp serve` cuando:

- Codex, Claude Code u otro cliente MCP deba hablar directamente con conversaciones de canal respaldadas por OpenClaw
- ya tengas un Gateway de OpenClaw local o remoto con sesiones enrutadas
- quieras un servidor MCP que funcione con los backends de canal de OpenClaw en lugar de ejecutar puentes separados por canal

Usa [`openclaw acp`](/es/cli/acp) en su lugar cuando OpenClaw deba alojar por sí mismo el runtime de codificación y mantener la sesión del agente dentro de OpenClaw.

### Cómo funciona

`openclaw mcp serve` inicia un servidor MCP por stdio. El cliente MCP es propietario de ese proceso. Mientras el cliente mantenga abierta la sesión stdio, el puente se conecta a un Gateway de OpenClaw local o remoto mediante WebSocket y expone conversaciones de canal enrutadas mediante MCP.

<Steps>
  <Step title="Client spawns the bridge">
    El cliente MCP inicia `openclaw mcp serve`.
  </Step>
  <Step title="Bridge connects to Gateway">
    El puente se conecta al Gateway de OpenClaw mediante WebSocket.
  </Step>
  <Step title="Sessions become MCP conversations">
    Las sesiones enrutadas se convierten en conversaciones MCP y herramientas de transcripción/historial.
  </Step>
  <Step title="Live events queue">
    Los eventos en vivo se encolan en memoria mientras el puente está conectado.
  </Step>
  <Step title="Optional Claude push">
    Si el modo de canal Claude está habilitado, la misma sesión también puede recibir notificaciones push específicas de Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - el estado de la cola en vivo comienza cuando el puente se conecta
    - el historial de transcripciones anterior se lee con `messages_read`
    - las notificaciones push de Claude solo existen mientras la sesión MCP está activa
    - cuando el cliente se desconecta, el puente finaliza y la cola en vivo desaparece
    - los puntos de entrada de agente de una sola ejecución como `openclaw agent` y `openclaw infer model run` retiran cualquier runtime MCP incluido que abran cuando se completa la respuesta, por lo que las ejecuciones con scripts repetidas no acumulan procesos secundarios MCP por stdio
    - los servidores MCP stdio lanzados por OpenClaw (incluidos o configurados por el usuario) se terminan como un árbol de procesos al apagarse, por lo que los subprocesos secundarios iniciados por el servidor no sobreviven después de que sale el cliente stdio padre
    - eliminar o restablecer una sesión desecha los clientes MCP de esa sesión mediante la ruta compartida de limpieza de runtime, por lo que no quedan conexiones stdio persistentes vinculadas a una sesión eliminada

  </Accordion>
</AccordionGroup>

### Elegir un modo de cliente

Usa el mismo puente de dos maneras distintas:

<Tabs>
  <Tab title="Generic MCP clients">
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

El puente usa metadatos de ruta de sesión existentes del Gateway para exponer conversaciones respaldadas por canales. Una conversación aparece cuando OpenClaw ya tiene estado de sesión con una ruta conocida, como:

- `channel`
- metadatos de destinatario o destino
- `accountId` opcional
- `threadId` opcional

Esto da a los clientes MCP un lugar para:

- listar conversaciones enrutadas recientes
- leer el historial de transcripción reciente
- esperar nuevos eventos entrantes
- enviar una respuesta de vuelta por la misma ruta
- ver solicitudes de aprobación que llegan mientras el puente está conectado

### Uso

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
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
    Devuelve una conversación por `session_key` usando una búsqueda directa de sesión del Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Lee mensajes de transcripción recientes para una conversación respaldada por sesión.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrae bloques de contenido de mensaje que no son texto desde un mensaje de transcripción. Esta es una vista de metadatos sobre el contenido de la transcripción, no un almacén independiente y duradero de blobs de adjuntos.
  </Accordion>
  <Accordion title="events_poll">
    Lee eventos en vivo encolados desde un cursor numérico.
  </Accordion>
  <Accordion title="events_wait">
    Hace long-polling hasta que llegue el siguiente evento encolado coincidente o venza un tiempo de espera.

    Usa esto cuando un cliente MCP genérico necesite entrega casi en tiempo real sin un protocolo push específico de Claude.

  </Accordion>
  <Accordion title="messages_send">
    Envía texto de vuelta por la misma ruta ya registrada en la sesión.

    Comportamiento actual:

    - requiere una ruta de conversación existente
    - usa el canal, destinatario, id. de cuenta e id. de hilo de la sesión
    - envía solo texto

  </Accordion>
  <Accordion title="permissions_list_open">
    Lista solicitudes pendientes de aprobación de exec/Plugin que el puente ha observado desde que se conectó al Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Resuelve una solicitud pendiente de aprobación de exec/Plugin con:

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
- el backlog duradero debe leerse con `messages_read`

</Warning>

### Notificaciones de canal Claude

El puente también puede exponer notificaciones de canal específicas de Claude. Este es el equivalente en OpenClaw de un adaptador de canal de Claude Code: las herramientas MCP estándar siguen estando disponibles, pero los mensajes entrantes en vivo también pueden llegar como notificaciones MCP específicas de Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: solo herramientas MCP estándar.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: habilita las notificaciones de canal Claude.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: valor predeterminado actual; mismo comportamiento del puente que `on`.
  </Tab>
</Tabs>

Cuando el modo de canal Claude está habilitado, el servidor anuncia capacidades experimentales de Claude y puede emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamiento actual del puente:

- los mensajes de transcripción entrantes `user` se reenvían como `notifications/claude/channel`
- las solicitudes de permiso de Claude recibidas mediante MCP se rastrean en memoria
- si la conversación vinculada envía más tarde `yes abcde` o `no abcde`, el puente lo convierte en `notifications/claude/channel/permission`
- estas notificaciones son solo para la sesión en vivo; si el cliente MCP se desconecta, no hay destino push

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
  Leer token desde archivo.
</ParamField>
<ParamField path="--password" type="string">
  Contraseña del Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Leer contraseña desde archivo.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Modo de notificaciones de Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Registros detallados en stderr.
</ParamField>

<Tip>
Prefiere `--token-file` o `--password-file` antes que secretos en línea cuando sea posible.
</Tip>

### Seguridad y límite de confianza

El puente no inventa el enrutamiento. Solo expone conversaciones que el Gateway ya sabe cómo enrutar.

Eso significa:

- las listas de remitentes permitidos, el emparejamiento y la confianza a nivel de canal siguen perteneciendo a la configuración subyacente de canal de OpenClaw
- `messages_send` solo puede responder mediante una ruta almacenada existente
- el estado de aprobación es en vivo/en memoria solo para la sesión actual del puente
- la autenticación del puente debe usar los mismos controles de token o contraseña del Gateway en los que confiarías para cualquier otro cliente de Gateway remoto

Si falta una conversación en `conversations_list`, la causa habitual no es la configuración MCP. Son metadatos de ruta faltantes o incompletos en la sesión subyacente del Gateway.

### Pruebas

OpenClaw incluye una prueba smoke determinista de Docker para este puente:

```bash
pnpm test:docker:mcp-channels
```

Esa prueba smoke:

- inicia un contenedor Gateway con datos iniciales
- inicia un segundo contenedor que ejecuta `openclaw mcp serve`
- verifica el descubrimiento de conversaciones, las lecturas de transcripciones, las lecturas de metadatos de adjuntos, el comportamiento de la cola de eventos en vivo y el enrutamiento de envíos salientes
- valida notificaciones de canal y permisos al estilo Claude mediante el puente MCP stdio real

Esta es la forma más rápida de demostrar que el puente funciona sin conectar una cuenta real de Telegram, Discord o iMessage a la ejecución de pruebas.

Para un contexto de pruebas más amplio, consulta [Pruebas](/es/help/testing).

### Solución de problemas

<AccordionGroup>
  <Accordion title="No conversations returned">
    Normalmente significa que la sesión del Gateway todavía no es enrutable. Confirma que la sesión subyacente tenga almacenados el canal/proveedor, el destinatario y los metadatos opcionales de ruta de cuenta/hilo.
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    Esperado. La cola en vivo comienza cuando el puente se conecta. Lee el historial de transcripción anterior con `messages_read`.
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    Comprueba todo esto:

    - el cliente mantuvo abierta la sesión MCP stdio
    - `--claude-channel-mode` es `on` o `auto`
    - el cliente realmente entiende los métodos de notificación específicos de Claude
    - el mensaje entrante ocurrió después de que el puente se conectó

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` solo muestra solicitudes de aprobación observadas mientras el puente estaba conectado. No es una API duradera de historial de aprobaciones.
  </Accordion>
</AccordionGroup>

## OpenClaw como registro de cliente MCP

Esta es la ruta de `openclaw mcp list`, `show`, `set` y `unset`.

Estos comandos no exponen OpenClaw mediante MCP. Administran las definiciones de servidores MCP propiedad de OpenClaw bajo `mcp.servers` en la configuración de OpenClaw.

Esas definiciones guardadas son para runtimes que OpenClaw inicia o configura más tarde, como Pi integrado y otros adaptadores de runtime. OpenClaw almacena las definiciones de forma centralizada para que esos runtimes no tengan que mantener sus propias listas duplicadas de servidores MCP.

<AccordionGroup>
  <Accordion title="Comportamiento importante">
    - estos comandos solo leen o escriben la configuración de OpenClaw
    - no se conectan al servidor MCP de destino
    - no validan si el comando, la URL o el transporte remoto están disponibles ahora mismo
    - los adaptadores de runtime deciden qué formas de transporte admiten realmente en tiempo de ejecución
    - Pi integrado expone las herramientas MCP configuradas en los perfiles de herramientas normales `coding` y `messaging`; `minimal` aún las oculta, y `tools.deny: ["bundle-mcp"]` las desactiva explícitamente
    - los runtimes MCP empaquetados con alcance de sesión se recolectan después de `mcp.sessionIdleTtlMs` milisegundos de inactividad (valor predeterminado: 10 minutos; usa `0` para desactivarlo) y las ejecuciones integradas de una sola vez los limpian al final de la ejecución

  </Accordion>
</AccordionGroup>

Los adaptadores de runtime pueden normalizar este registro compartido a la forma que espera su cliente descendente. Por ejemplo, Pi integrado consume directamente los valores `transport` de OpenClaw, mientras que Claude Code y Gemini reciben valores `type` nativos de CLI como `http`, `sse` o `stdio`.

### Definiciones guardadas de servidores MCP

OpenClaw también almacena un registro ligero de servidores MCP en la configuración para superficies que quieren definiciones MCP administradas por OpenClaw.

Comandos:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Notas:

- `list` ordena los nombres de los servidores.
- `show` sin un nombre imprime el objeto completo de servidores MCP configurados.
- `set` espera un valor de objeto JSON en la línea de comandos.
- Usa `transport: "streamable-http"` para servidores MCP Streamable HTTP. `openclaw mcp set` también normaliza el `type: "http"` nativo de CLI a la misma forma de configuración canónica por compatibilidad.
- `unset` falla si el servidor indicado no existe.

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

### Transporte Stdio

Inicia un proceso secundario local y se comunica mediante stdin/stdout.

| Campo                      | Descripción                                     |
| -------------------------- | ----------------------------------------------- |
| `command`                  | Ejecutable que se iniciará (obligatorio)        |
| `args`                     | Array de argumentos de línea de comandos        |
| `env`                      | Variables de entorno adicionales               |
| `cwd` / `workingDirectory` | Directorio de trabajo para el proceso           |

<Warning>
**Filtro de seguridad de env en Stdio**

OpenClaw rechaza las claves de env de inicio de intérprete que pueden alterar cómo arranca un servidor MCP stdio antes del primer RPC, incluso si aparecen en el bloque `env` de un servidor. Las claves bloqueadas incluyen `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` y variables similares de control de runtime. El inicio las rechaza con un error de configuración para que no puedan inyectar un preludio implícito, sustituir el intérprete o habilitar un depurador contra el proceso stdio. Las variables de env ordinarias de credenciales, proxy y específicas del servidor (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizadas, etc.) no se ven afectadas.

Si tu servidor MCP realmente necesita una de las variables bloqueadas, establécela en el proceso host del Gateway en lugar de bajo el `env` del servidor stdio.
</Warning>

### Transporte SSE / HTTP

Se conecta a un servidor MCP remoto mediante HTTP Server-Sent Events.

| Campo                 | Descripción                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del servidor remoto (obligatorio)                        |
| `headers`             | Mapa opcional de clave-valor de encabezados HTTP (por ejemplo, tokens de autenticación) |
| `connectionTimeoutMs` | Tiempo de espera de conexión por servidor en ms (opcional)                |

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

Los valores sensibles en `url` (userinfo) y `headers` se redactan en los registros y la salida de estado.

### Transporte Streamable HTTP

`streamable-http` es una opción de transporte adicional junto con `sse` y `stdio`. Usa streaming HTTP para la comunicación bidireccional con servidores MCP remotos.

| Campo                 | Descripción                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del servidor remoto (obligatorio)                                     |
| `transport`           | Establécelo en `"streamable-http"` para seleccionar este transporte; cuando se omite, OpenClaw usa `sse` |
| `headers`             | Mapa opcional de clave-valor de encabezados HTTP (por ejemplo, tokens de autenticación) |
| `connectionTimeoutMs` | Tiempo de espera de conexión por servidor en ms (opcional)                             |

La configuración de OpenClaw usa `transport: "streamable-http"` como escritura canónica. Los valores `type: "http"` de MCP nativos de CLI se aceptan cuando se guardan mediante `openclaw mcp set` y `openclaw doctor --fix` los repara en la configuración existente, pero `transport` es lo que Pi integrado consume directamente.

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
Estos comandos solo administran la configuración guardada. No inician el puente de canal, no abren una sesión de cliente MCP en vivo ni demuestran que el servidor de destino sea accesible.
</Note>

## Límites actuales

Esta página documenta el puente tal como se entrega hoy.

Límites actuales:

- el descubrimiento de conversaciones depende de los metadatos de ruta de sesión existentes del Gateway
- no hay protocolo push genérico más allá del adaptador específico de Claude
- aún no hay herramientas para editar mensajes ni reaccionar
- el transporte HTTP/SSE/streamable-http se conecta a un único servidor remoto; aún no hay upstream multiplexado
- `permissions_list_open` solo incluye aprobaciones observadas mientras el puente está conectado

## Relacionado

- [Referencia de CLI](/es/cli)
- [Plugins](/es/cli/plugins)
