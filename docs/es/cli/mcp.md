---
read_when:
    - Conectar Codex, Claude Code u otro cliente MCP a canales respaldados por OpenClaw
    - Ejecutando `openclaw mcp serve`
    - Administrar las definiciones de servidores MCP guardadas por OpenClaw
sidebarTitle: MCP
summary: Exponer las conversaciones de canales de OpenClaw mediante MCP y gestionar las definiciones guardadas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-07-05T11:07:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 569540aefe6700c82b00249183fd09e35ea41055a7e7fc0622a811bb2055488b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` tiene dos funciones:

- ejecutar OpenClaw como servidor MCP con `openclaw mcp serve`
- gestionar definiciones de servidores MCP salientes administrados por OpenClaw con `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` y `unset`

`serve` es OpenClaw actuando como servidor MCP. Los demás subcomandos son OpenClaw actuando como registro del lado cliente de MCP para servidores que sus propios runtimes puedan consumir más adelante.

<Note>
  `list`, `show`, `set` y `unset` solo leen y escriben entradas `mcp.servers` administradas por OpenClaw en la configuración de OpenClaw. No incluyen servidores mcporter de `config/mcporter.json`; usa `mcporter list` para ese registro.
</Note>

Usa [`openclaw acp`](/es/cli/acp) cuando OpenClaw deba alojar por sí mismo una sesión de arnés de programación y enrutar ese runtime mediante ACP.

## Elige la ruta MCP correcta

| Objetivo                                                            | Uso                                                                  | Por qué                                                                                                         |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Permitir que un cliente MCP externo lea/envíe conversaciones de canales de OpenClaw | `openclaw mcp serve`                                                 | OpenClaw es el servidor MCP y expone conversaciones respaldadas por Gateway mediante stdio.                    |
| Guardar servidores MCP de terceros para ejecuciones de agentes administradas por OpenClaw | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw es el registro del lado cliente de MCP y luego proyecta esos servidores en runtimes elegibles.         |
| Comprobar un servidor guardado sin ejecutar un turno de agente      | `openclaw mcp status`, `doctor`, `probe`                             | `status` y `doctor` inspeccionan la configuración; `probe` abre una conexión MCP en vivo y lista capacidades.  |
| Editar la configuración MCP desde un navegador                      | Control UI `/mcp`                                                    | La página muestra inventario, habilitación, resúmenes de OAuth/filtros, sugerencias de comandos y un editor `mcp` con alcance. |
| Dar al servidor de aplicaciones de Codex un servidor MCP nativo con alcance | `mcp.servers.<name>.codex`                                           | El bloque `codex` solo afecta la proyección de hilos del servidor de aplicaciones de Codex y se elimina antes de entregar la configuración nativa. |
| Ejecutar sesiones de arnés alojadas por ACP                         | [`openclaw acp`](/es/cli/acp) y [Agentes ACP](/es/tools/acp-agents-setup) | El modo puente ACP no acepta inyección de servidores MCP por sesión; configura en su lugar puentes de gateway/plugins. |

<Tip>
Si no tienes claro qué ruta necesitas, empieza con `openclaw mcp status --verbose`. Muestra lo que OpenClaw tiene guardado sin iniciar ningún servidor MCP.
</Tip>

## OpenClaw como servidor MCP

Esta es la ruta `openclaw mcp serve`.

### Cuándo usar serve

Usa `openclaw mcp serve` cuando:

- Codex, Claude Code u otro cliente MCP deban hablar directamente con conversaciones de canales respaldadas por OpenClaw
- ya tengas un Gateway de OpenClaw local o remoto con sesiones enrutadas
- quieras un servidor MCP que funcione en todos los backends de canales de OpenClaw en lugar de ejecutar puentes separados por canal

Usa [`openclaw acp`](/es/cli/acp) en su lugar cuando OpenClaw deba alojar el runtime de programación por sí mismo y mantener la sesión del agente dentro de OpenClaw.

### Cómo funciona

`openclaw mcp serve` inicia un servidor MCP stdio. El cliente MCP es dueño de ese proceso. Mientras el cliente mantiene abierta la sesión stdio, el puente se conecta a un Gateway de OpenClaw local o remoto mediante WebSocket y expone conversaciones de canales enrutadas mediante MCP.

<Steps>
  <Step title="El cliente inicia el puente">
    El cliente MCP inicia `openclaw mcp serve`.
  </Step>
  <Step title="El puente se conecta a Gateway">
    El puente se conecta al Gateway de OpenClaw mediante WebSocket.
  </Step>
  <Step title="Las sesiones se convierten en conversaciones MCP">
    Las sesiones enrutadas se convierten en conversaciones MCP y herramientas de transcripción/historial.
  </Step>
  <Step title="Cola de eventos en vivo">
    Los eventos en vivo se ponen en cola en memoria mientras el puente está conectado.
  </Step>
  <Step title="Push opcional de Claude">
    Si el modo de canal Claude está habilitado, la misma sesión también puede recibir notificaciones push específicas de Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportamiento importante">
    - el estado de la cola en vivo empieza cuando el puente se conecta
    - el historial de transcripción anterior se lee con `messages_read`
    - las notificaciones push de Claude solo existen mientras la sesión MCP está activa
    - cuando el cliente se desconecta, el puente sale y la cola en vivo desaparece
    - los puntos de entrada de agente de una sola ejecución, como `openclaw agent` y `openclaw infer model run`, retiran cualquier runtime MCP incluido que abran cuando se completa la respuesta, por lo que las ejecuciones con scripts repetidas no acumulan procesos hijos MCP stdio
    - los servidores MCP stdio iniciados por OpenClaw (incluidos o configurados por el usuario) se desmontan como un árbol de procesos al apagarse, por lo que los subprocesos hijos iniciados por el servidor no sobreviven después de que sale el cliente stdio padre
    - eliminar o restablecer una sesión desecha los clientes MCP de esa sesión mediante la ruta compartida de limpieza de runtime, por lo que no quedan conexiones stdio persistentes vinculadas a una sesión eliminada

  </Accordion>
</AccordionGroup>

### Elige un modo de cliente

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

### Qué expone serve

El puente usa los metadatos de rutas de sesión existentes de Gateway para exponer conversaciones respaldadas por canales. Una conversación aparece cuando OpenClaw ya tiene estado de sesión con una ruta conocida, como:

- `channel`
- metadatos de destinatario o destino
- `accountId` opcional
- `threadId` opcional

Esto ofrece a los clientes MCP un único lugar para:

- listar conversaciones enrutadas recientes
- leer el historial de transcripción reciente
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

<AccordionGroup>
  <Accordion title="conversations_list">
    Lista conversaciones recientes respaldadas por sesiones que ya tienen metadatos de ruta en el estado de sesión de Gateway.

    Filtros: `limit` (máx. 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Devuelve una conversación por `session_key` usando una búsqueda directa de sesión de Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Lee mensajes de transcripción recientes para una conversación respaldada por sesión. `limit` tiene un valor predeterminado de 20, máximo 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrae bloques de contenido de mensaje que no son texto de un mensaje de transcripción. Esta es una vista de metadatos sobre el contenido de la transcripción, no un almacén independiente de blobs de adjuntos duraderos.
  </Accordion>
  <Accordion title="events_poll">
    Lee eventos en vivo en cola desde un cursor numérico. `limit` máximo 200.
  </Accordion>
  <Accordion title="events_wait">
    Realiza long polling hasta que llega el siguiente evento en cola coincidente o vence un tiempo de espera (predeterminado 30 s, máximo 300 s).

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

Tipos de evento actuales:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- la cola es solo en vivo; empieza cuando se inicia el puente MCP
- `events_poll` y `events_wait` no reproducen por sí mismos el historial anterior de Gateway
- el backlog duradero debe leerse con `messages_read`

</Warning>

### Notificaciones de canal Claude

El puente también puede exponer notificaciones de canal específicas de Claude. Este es el equivalente en OpenClaw de un adaptador de canal de Claude Code: las herramientas MCP estándar siguen disponibles, pero los mensajes entrantes en vivo también pueden llegar como notificaciones MCP específicas de Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: solo herramientas MCP estándar.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: habilita las notificaciones de canal Claude.
  </Tab>
  <Tab title="auto (predeterminado)">
    `--claude-channel-mode auto`: valor predeterminado actual; el mismo comportamiento de puente que `on`.
  </Tab>
</Tabs>

Cuando el modo de canal Claude está habilitado, el servidor anuncia capacidades experimentales de Claude y puede emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamiento actual del puente:

- los mensajes de transcripción `user` entrantes se reenvían como `notifications/claude/channel`
- las solicitudes de permiso de Claude recibidas mediante MCP se rastrean en memoria
- si el propietario del comando en la conversación vinculada envía más adelante `yes <id>` o `no <id>` (`<id>` es el id de solicitud de 5 letras, excluyendo `l`), el puente lo convierte en `notifications/claude/channel/permission`
- estas notificaciones son solo para la sesión en vivo; si el cliente MCP se desconecta, no hay destino push

Esto es intencionadamente específico del cliente. Los clientes MCP genéricos deben depender de las herramientas de sondeo estándar.

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
  URL WebSocket de Gateway. Usa `gateway.remote.url` de forma predeterminada cuando está configurado.
</ParamField>
<ParamField path="--token" type="string">
  Token de Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Lee el token desde un archivo.
</ParamField>
<ParamField path="--password" type="string">
  Contraseña de Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Lee la contraseña desde un archivo.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Modo de notificaciones de Claude. Valor predeterminado: `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Registros detallados en stderr.
</ParamField>

<Tip>
Prefiere `--token-file` o `--password-file` en lugar de secretos en línea cuando sea posible.
</Tip>

### Seguridad y límite de confianza

El puente no inventa enrutamiento. Solo expone conversaciones que Gateway ya sabe enrutar.

Eso significa:

- las listas de permitidos de remitentes, el emparejamiento y la confianza a nivel de canal siguen perteneciendo a la configuración del canal de OpenClaw subyacente
- `messages_send` solo puede responder a través de una ruta almacenada existente
- el estado de aprobación es en vivo/en memoria solo para la sesión actual del puente
- la autenticación del puente debe usar los mismos controles de token o contraseña de Gateway en los que confiarías para cualquier otro cliente remoto de Gateway

Si falta una conversación en `conversations_list`, la causa habitual no es la configuración de MCP. Es la falta de metadatos de ruta, o metadatos incompletos, en la sesión de Gateway subyacente.

### Pruebas

OpenClaw incluye una prueba de humo determinista de Docker para este puente:

```bash
pnpm test:docker:mcp-channels
```

Esa prueba de humo ejecuta un único contenedor: siembra el estado de conversación, inicia Gateway y luego genera `openclaw mcp serve` como un proceso hijo stdio y lo controla como cliente MCP. Verifica el descubrimiento de conversaciones, las lecturas de transcripciones, las lecturas de metadatos de adjuntos, el comportamiento de la cola de eventos en vivo y las notificaciones de canal y permisos de estilo Claude sobre el puente MCP stdio real. El enrutamiento de envío saliente (`messages_send` reutilizando la ruta de conversación almacenada) está cubierto por separado mediante pruebas unitarias en `src/mcp/channel-server.test.ts`.

Esta es la forma más rápida de demostrar que el puente funciona sin conectar una cuenta real de Telegram, Discord o iMessage a la ejecución de pruebas.

Para un contexto más amplio de pruebas, consulta [Pruebas](/es/help/testing).

### Solución de problemas

<AccordionGroup>
  <Accordion title="No se devolvieron conversaciones">
    Normalmente significa que la sesión de Gateway todavía no es enrutable. Confirma que la sesión subyacente tenga almacenados el canal/proveedor, el destinatario y los metadatos opcionales de ruta de cuenta/hilo.
  </Accordion>
  <Accordion title="events_poll o events_wait omiten mensajes antiguos">
    Esperado. La cola en vivo comienza cuando el puente se conecta. Lee el historial de transcripciones más antiguo con `messages_read`.
  </Accordion>
  <Accordion title="Las notificaciones de Claude no aparecen">
    Revisa todo lo siguiente:

    - el cliente mantuvo abierta la sesión MCP stdio
    - `--claude-channel-mode` es `on` o `auto`
    - el cliente realmente entiende los métodos de notificación específicos de Claude
    - el mensaje entrante ocurrió después de que el puente se conectó

  </Accordion>
  <Accordion title="Faltan aprobaciones">
    `permissions_list_open` solo muestra solicitudes de aprobación observadas mientras el puente estaba conectado. No es una API duradera de historial de aprobaciones.
  </Accordion>
</AccordionGroup>

## OpenClaw como registro de clientes MCP

Esta es la ruta de `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` y `unset`.

Estos comandos no exponen OpenClaw sobre MCP. Administran definiciones de servidores MCP gestionadas por OpenClaw bajo `mcp.servers` en la configuración de OpenClaw. No leen servidores mcporter desde `config/mcporter.json`.

Esas definiciones guardadas son para runtimes que OpenClaw inicia o configura más tarde, como OpenClaw integrado y otros adaptadores de runtime. OpenClaw almacena las definiciones de forma centralizada para que esos runtimes no tengan que mantener sus propias listas duplicadas de servidores MCP.

<AccordionGroup>
  <Accordion title="Comportamiento importante">
    - estos comandos solo leen o escriben configuración de OpenClaw
    - `status`, `list`, `show`, `doctor` sin `--probe`, `set`, `configure`, `tools`, `logout`, `reload` y `unset` no se conectan al servidor MCP de destino
    - `login` ejecuta el flujo de red OAuth de MCP para el servidor HTTP configurado y guarda las credenciales locales resultantes
    - `status --verbose` imprime sugerencias resueltas de transporte, autenticación, tiempo de espera, filtro y llamadas paralelas a herramientas sin conectarse
    - `doctor` revisa las definiciones guardadas en busca de problemas de configuración local como comandos stdio faltantes, directorios de trabajo no válidos, archivos TLS faltantes, servidores deshabilitados, valores sensibles literales de encabezado/env y autorización OAuth incompleta
    - `doctor --probe` agrega la misma prueba de conexión en vivo que `probe` después de que pasan las comprobaciones estáticas
    - `probe` se conecta al servidor seleccionado o a todos los servidores configurados, enumera herramientas e informa capacidades/diagnósticos
    - `add` construye una definición a partir de flags y ejecuta una prueba antes de guardar, salvo que `--no-probe` esté configurado o primero se necesite autorización OAuth
    - los adaptadores de runtime deciden qué formas de transporte admiten realmente en tiempo de ejecución
    - `enabled: false` conserva un servidor guardado pero lo excluye del descubrimiento de runtime integrado
    - `timeout` y `connectTimeout` establecen tiempos de espera de solicitud y conexión por servidor en segundos
    - `supportsParallelToolCalls: true` marca servidores a los que los adaptadores pueden llamar simultáneamente
    - los servidores HTTP pueden usar encabezados estáticos, inicio de sesión OAuth, control de verificación TLS y rutas de certificado/clave mTLS
    - OpenClaw integrado expone las herramientas MCP configuradas en los perfiles de herramientas normales `coding` y `messaging`; `minimal` sigue ocultándolas, y `tools.deny: ["bundle-mcp"]` las deshabilita explícitamente
    - `toolFilter.include` y `toolFilter.exclude` por servidor filtran las herramientas MCP descubiertas antes de que se conviertan en herramientas de OpenClaw
    - los servidores que anuncian recursos o prompts también exponen herramientas utilitarias para listar/leer recursos y listar/obtener prompts; esos nombres utilitarios generados (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) usan el mismo filtro de inclusión/exclusión
    - los cambios dinámicos en la lista de herramientas MCP invalidan el catálogo en caché de esa sesión; el siguiente descubrimiento/uso lo actualiza desde el servidor
    - los fallos repetidos de solicitud/protocolo de herramientas MCP pausan brevemente ese servidor para que un servidor roto no consuma todo el turno
    - los runtimes MCP empaquetados con alcance de sesión se eliminan tras `mcp.sessionIdleTtlMs` milisegundos de inactividad (10 minutos de forma predeterminada; configura `0` para deshabilitarlo) y las ejecuciones integradas de un solo uso los limpian al final de la ejecución

  </Accordion>
</AccordionGroup>

Los adaptadores de runtime pueden normalizar este registro compartido a la forma que espera su cliente descendente. Por ejemplo, OpenClaw integrado consume directamente los valores `transport` de OpenClaw, mientras que Claude Code y Gemini reciben valores `type` nativos de CLI como `http`, `sse` o `stdio`.

Codex app-server también respeta un bloque opcional `codex` en cada servidor. Esto es
metadatos de proyección de OpenClaw solo para hilos de Codex app-server; no
cambia sesiones ACP, configuración genérica de arnés Codex ni otros adaptadores de runtime.
Usa `codex.agents` no vacío para proyectar un servidor solo en ids específicos de agentes de OpenClaw. Las listas de agentes vacías, en blanco o no válidas son rechazadas por la validación de configuración
y omitidas por la ruta de proyección de runtime en lugar de volverse
globales. Usa `codex.defaultToolsApprovalMode` (`auto`, `prompt` o `approve`)
para emitir el `default_tools_approval_mode` nativo de Codex para un servidor de confianza.
OpenClaw elimina los metadatos `codex` antes de entregar la configuración nativa `mcp_servers`
a Codex.

### Definiciones guardadas de servidores MCP

Comandos:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Notas:

- `list` ordena los nombres de servidores.
- `show` sin un nombre imprime el objeto completo del servidor MCP configurado.
- `status` clasifica los transportes configurados sin conectarse. `--verbose` incluye detalles resueltos de lanzamiento, tiempo de espera, OAuth, filtro y llamadas paralelas.
- `doctor` realiza comprobaciones estáticas sin conectarse. Agrega `--probe` cuando el comando también deba verificar que los servidores habilitados se conectan.
- `probe` se conecta e informa recuentos de herramientas, compatibilidad con recursos/prompts, compatibilidad con cambios de lista y diagnósticos.
- `add` acepta flags stdio como `--command`, `--arg`, `--env` y `--cwd`, o flags HTTP como `--url`, `--transport`, `--header`, `--auth oauth`, TLS, tiempo de espera y flags de selección de herramientas.
- `set` espera un valor de objeto JSON en la línea de comandos.
- `configure` actualiza habilitación, filtros de herramientas, tiempos de espera, OAuth, TLS y sugerencias de llamadas paralelas a herramientas sin reemplazar toda la definición del servidor. Agrega `--probe` para verificar el servidor actualizado antes de guardar.
- `tools` actualiza los filtros de herramientas por servidor. Las entradas de inclusión/exclusión son nombres de herramientas MCP y globs simples `*`.
- `login` ejecuta el flujo OAuth para servidores HTTP configurados con `auth: "oauth"`. La primera ejecución imprime una URL de autorización; vuelve a ejecutarlo con `--code` después de la aprobación.
- `logout` borra las credenciales OAuth almacenadas para el servidor nombrado sin quitar la definición del servidor guardada.
- `reload` descarta los runtimes MCP en proceso almacenados en caché solo para el proceso CLI actual. Los procesos de Gateway o agente en otro proceso siguen necesitando su propia ruta de recarga o reinicio.
- Usa `transport: "streamable-http"` para servidores MCP Streamable HTTP. `openclaw mcp set` también normaliza el `type: "http"` nativo de CLI a la misma forma de configuración canónica por compatibilidad.
- `unset` falla si el servidor nombrado no existe.

Ejemplos:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### Recetas comunes de servidores

Estos ejemplos solo guardan definiciones de servidores. Ejecuta `openclaw mcp doctor --probe` después para demostrar que el servidor inicia y expone herramientas.

<Tabs>
  <Tab title="Sistema de archivos">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Limita los servidores de sistema de archivos al árbol de directorios más pequeño que el agente deba leer o editar.

  </Tab>
  <Tab title="Memoria">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Usa un filtro de herramientas si el servidor expone herramientas de escritura que no deberían estar disponibles para agentes normales.

  </Tab>
  <Tab title="Script local">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` comprueba que `cwd` exista y que el comando se resuelva desde el entorno configurado.

  </Tab>
  <Tab title="Remote HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    Usa OAuth cuando el servidor remoto lo admita. Si el servidor requiere encabezados estáticos, evita confirmar tokens bearer literales.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Los servidores de control directo del escritorio heredan los permisos del proceso que inician. Usa filtros de herramientas restrictivos y solicitudes de permisos a nivel del sistema operativo.

  </Tab>
</Tabs>

### Formas de salida JSON

Usa `--json` para scripts y paneles. Los conjuntos de campos pueden crecer con el tiempo, por lo que los consumidores deben ignorar las claves desconocidas.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` sale con un código distinto de cero cuando cualquier servidor habilitado y comprobado tiene un problema de nivel `error`. Los problemas `warning` e `info` se notifican, pero no hacen que el comando falle por sí solos.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe --json` abre una sesión de cliente MCP en vivo e imprime su resultado directamente; a diferencia de `status`/`doctor`, la salida no tiene un campo `path` de nivel superior. Las claves `resources` y `prompts` solo están presentes cuando el servidor anuncia realmente esa capacidad (un servidor sin prompts omite la clave `prompts` en lugar de informar `false`). Usa `probe` para demostrar alcanzabilidad y capacidades, no para auditorías de configuración estática.

  </Accordion>
</AccordionGroup>

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
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Transporte stdio

Inicia un proceso hijo local y se comunica por stdin/stdout.

| Campo                      | Descripción                                      |
| -------------------------- | ------------------------------------------------ |
| `command`                  | Ejecutable que se va a generar (obligatorio)     |
| `args`                     | Arreglo de argumentos de línea de comandos       |
| `env`                      | Variables de entorno adicionales                 |
| `cwd` / `workingDirectory` | Directorio de trabajo para el proceso            |

<Warning>
**Filtro de seguridad de entorno stdio**

OpenClaw rechaza las claves de entorno de inicio de intérprete, secuestro de cargador e inicio de shell antes de generar un servidor MCP stdio, incluso si aparecen en el bloque `env` de un servidor. Esto usa la misma política de seguridad del entorno host que otros procesos generados por OpenClaw: bloquea hooks conocidos de inicio de intérprete (por ejemplo `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), prefijos de bibliotecas compartidas e inyección de funciones (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) y variables similares de control de tiempo de ejecución. El inicio las descarta silenciosamente y registra una advertencia para que no puedan inyectar un preludio implícito, cambiar el intérprete, habilitar un depurador ni secuestrar el enlazador dinámico contra el proceso stdio. Una lista de permitidos explícita mantiene utilizables las variables de entorno comunes de credenciales MCP (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), junto con variables de entorno comunes de proxy y específicas del servidor (`HTTP_PROXY`, `*_API_KEY` personalizadas, etc.). Otras claves `AWS_*`, como `AWS_CONFIG_FILE` y `AWS_SHARED_CREDENTIALS_FILE`, permanecen bloqueadas porque apuntan a archivos de credenciales en lugar de llevar directamente un valor de credencial.

Si tu servidor MCP necesita realmente una de las variables bloqueadas, configúrala en el proceso host del Gateway en lugar de hacerlo en el `env` del servidor stdio.
</Warning>

### Transporte SSE / HTTP

Se conecta a un servidor MCP remoto mediante HTTP Server-Sent Events.

| Campo                          | Descripción                                                          |
| ------------------------------ | -------------------------------------------------------------------- |
| `url`                          | URL HTTP o HTTPS del servidor remoto (obligatorio)                   |
| `headers`                      | Mapa opcional clave-valor de encabezados HTTP (por ejemplo tokens de autenticación) |
| `connectionTimeoutMs`          | Tiempo de espera de conexión por servidor en ms (opcional)           |
| `connectTimeout`               | Tiempo de espera de conexión por servidor en segundos (opcional)     |
| `timeout` / `requestTimeoutMs` | Tiempo de espera de solicitud MCP por servidor en segundos o ms      |
| `auth: "oauth"`                | Usa almacenamiento de tokens OAuth de MCP y `openclaw mcp login`     |
| `sslVerify`                    | Establécelo en false solo para endpoints HTTPS privados explícitamente confiables |
| `clientCert` / `clientKey`     | Rutas del certificado y la clave de cliente mTLS                     |
| `supportsParallelToolCalls`    | Indica que las llamadas concurrentes son seguras para este servidor  |

Ejemplo:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Los valores sensibles en `url` (userinfo) y `headers` se redactan en los registros y en la salida de estado. `openclaw mcp doctor` advierte cuando las entradas `headers` o `env` que parecen sensibles contienen valores literales, para que los operadores puedan sacar esos valores de la configuración confirmada.

### Flujo de trabajo OAuth

OAuth es para servidores MCP HTTP que anuncian el flujo OAuth de MCP. Los encabezados `Authorization` estáticos se ignoran para un servidor mientras `auth: "oauth"` esté habilitado.

<Steps>
  <Step title="Save the server">
    Agrega o actualiza el servidor con `auth: "oauth"` y cualquier metadato OAuth opcional.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    Ejecuta login para crear la solicitud de autorización.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw imprime la URL de autorización y almacena el estado temporal del verificador OAuth en el directorio de estado de OpenClaw.

  </Step>
  <Step title="Finish with the code">
    Después de aprobar en el navegador, pasa el código devuelto de vuelta a OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    Usa status o doctor para confirmar que los tokens están presentes.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    Logout elimina las credenciales OAuth almacenadas, pero conserva la definición guardada del servidor.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Si el proveedor rota tokens o el estado de autorización se queda bloqueado, ejecuta `openclaw mcp logout <name>` y luego repite `login`. `logout` puede borrar las credenciales de un servidor HTTP guardado incluso después de que `auth: "oauth"` se haya eliminado de la configuración, siempre que el nombre del servidor y la URL aún identifiquen la entrada del almacén de credenciales.

### Transporte HTTP transmisible

`streamable-http` es una opción de transporte adicional junto con `sse` y `stdio`. Usa streaming HTTP para la comunicación bidireccional con servidores MCP remotos.

| Campo                          | Descripción                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | URL HTTP o HTTPS del servidor remoto (obligatorio)                                     |
| `transport`                    | Establécelo en `"streamable-http"` para seleccionar este transporte; si se omite, OpenClaw usa `sse` |
| `headers`                      | Mapa opcional clave-valor de encabezados HTTP (por ejemplo tokens de autenticación)    |
| `connectionTimeoutMs`          | Tiempo de espera de conexión por servidor en ms (opcional)                             |
| `connectTimeout`               | Tiempo de espera de conexión por servidor en segundos (opcional)                       |
| `timeout` / `requestTimeoutMs` | Tiempo de espera de solicitud MCP por servidor en segundos o ms                        |
| `auth: "oauth"`                | Usa almacenamiento de tokens OAuth de MCP y `openclaw mcp login`                       |
| `sslVerify`                    | Establécelo en false solo para endpoints HTTPS privados explícitamente confiables      |
| `clientCert` / `clientKey`     | Rutas del certificado y la clave de cliente mTLS                                       |
| `supportsParallelToolCalls`    | Indica que las llamadas concurrentes son seguras para este servidor                    |

La configuración de OpenClaw usa `transport: "streamable-http"` como la grafía canónica. Los valores MCP nativos de la CLI `type: "http"` se aceptan cuando se guardan mediante `openclaw mcp set` y `openclaw doctor --fix` los repara en la configuración existente, pero `transport` es lo que OpenClaw integrado consume directamente.

Ejemplo:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Los comandos de registro no inician el puente de canal. Solo `probe` y `doctor --probe` abren una sesión de cliente MCP en vivo para demostrar que el servidor de destino es alcanzable.
</Note>

## Interfaz de control

La UI de Control del navegador incluye una página dedicada de configuración de MCP en `/mcp`. Muestra recuentos de servidores configurados, resúmenes de habilitados/OAuth/filtros, filas de transporte por servidor, controles para habilitar/deshabilitar, comandos CLI comunes y un editor delimitado para la sección de configuración `mcp`.

Usa la página para ediciones de operadores e inventario rápido. Usa `openclaw mcp doctor --probe` o `openclaw mcp probe` cuando necesites prueba en vivo del servidor.

Flujo de trabajo del operador:

1. Abre la UI de Control y elige **MCP**.
2. Revisa las tarjetas de resumen de servidores totales, habilitados, OAuth y filtrados.
3. Usa cada fila de servidor para ver indicaciones de transporte, autenticación, filtro, tiempo de espera y comando.
4. Alterna la habilitación cuando quieras conservar una definición pero excluirla del descubrimiento en tiempo de ejecución.
5. Edita la sección de configuración `mcp` delimitada para cambios estructurales como servidores nuevos, encabezados, TLS, metadatos de OAuth o filtros de herramientas.
6. Elige **Guardar** para persistir solo la configuración, o **Guardar y publicar** para aplicarla a través de la ruta de configuración del Gateway.
7. Ejecuta `openclaw mcp doctor --probe` cuando necesites prueba en vivo de que el servidor editado arranca y lista herramientas.

Notas:

- los fragmentos de comando entrecomillan los nombres de servidores para que los nombres inusuales sigan siendo copiables en una shell
- los valores mostrados con formato similar a URL se censuran antes de renderizarse cuando contienen credenciales incrustadas
- la página no inicia transportes MCP por sí sola
- los tiempos de ejecución activos pueden necesitar `openclaw mcp reload`, publicación de configuración del Gateway o reinicio del proceso, según qué proceso sea dueño de los clientes MCP

## Límites actuales

Esta página documenta el puente tal como se distribuye hoy.

Límites actuales:

- el descubrimiento de conversaciones depende de los metadatos de rutas de sesión existentes del Gateway
- no hay protocolo push genérico más allá del adaptador específico de Claude
- todavía no hay herramientas para editar mensajes ni reaccionar
- el transporte HTTP/SSE/streamable-http se conecta a un único servidor remoto; todavía no hay upstream multiplexado
- `permissions_list_open` solo incluye aprobaciones observadas mientras el puente está conectado

## Relacionado

- [Referencia de CLI](/es/cli)
- [Plugins](/es/cli/plugins)
