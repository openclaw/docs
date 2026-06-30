---
read_when:
    - Conectar Codex, Claude Code u otro cliente MCP a canales respaldados por OpenClaw
    - Ejecutando `openclaw mcp serve`
    - Gestionar definiciones de servidores MCP guardadas por OpenClaw
sidebarTitle: MCP
summary: Expón las conversaciones de canal de OpenClaw mediante MCP y gestiona las definiciones guardadas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-06-30T22:05:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e979654cb17f5cb25b936039f9e4690ecfda41bc58ae073426a9e42978fa85dc
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` tiene dos tareas:

- ejecutar OpenClaw como un servidor MCP con `openclaw mcp serve`
- administrar definiciones de servidores MCP salientes gestionadas por OpenClaw con `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` y `unset`

En otras palabras:

- `serve` es OpenClaw actuando como servidor MCP
- los otros subcomandos son OpenClaw actuando como un registro del lado del cliente MCP para servidores MCP que sus runtimes pueden consumir más adelante

<Note>
  `list`, `show`, `set` y `unset` solo leen y escriben entradas `mcp.servers` gestionadas por OpenClaw en la configuración de OpenClaw. No incluyen servidores mcporter de `config/mcporter.json`; usa `mcporter list` para ese registro.
</Note>

Usa [`openclaw acp`](/es/cli/acp) cuando OpenClaw deba alojar por sí mismo una sesión de arnés de codificación y enrutar ese runtime a través de ACP.

## Elige la ruta MCP correcta

OpenClaw tiene varias superficies MCP. Elige la que coincida con quién es propietario del runtime del agente y quién es propietario de las herramientas.

| Objetivo                                                            | Usar                                                                 | Por qué                                                                                                          |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Permitir que un cliente MCP externo lea/envíe conversaciones de canales de OpenClaw | `openclaw mcp serve`                                                 | OpenClaw es el servidor MCP y expone conversaciones respaldadas por Gateway sobre stdio.                         |
| Guardar servidores MCP de terceros para ejecuciones de agentes gestionadas por OpenClaw | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw es el registro del lado del cliente MCP y luego proyecta esos servidores en runtimes elegibles.         |
| Comprobar un servidor guardado sin ejecutar un turno de agente       | `openclaw mcp status`, `doctor`, `probe`                             | `status` y `doctor` inspeccionan la configuración; `probe` abre una conexión MCP en vivo y lista capacidades.   |
| Editar la configuración MCP desde un navegador                       | Control UI `/mcp`                                                    | La página muestra inventario, habilitación, resúmenes de OAuth/filtros, sugerencias de comandos y un editor `mcp` con alcance. |
| Dar al servidor de aplicación de Codex un servidor MCP nativo con alcance | `mcp.servers.<name>.codex`                                           | El bloque `codex` solo afecta la proyección de hilos del servidor de aplicación de Codex y se elimina antes de entregar la configuración nativa. |
| Ejecutar sesiones de arnés alojadas por ACP                          | [`openclaw acp`](/es/cli/acp) y [Agentes ACP](/es/tools/acp-agents-setup) | El modo puente ACP no acepta inyección de servidores MCP por sesión; configura puentes de Gateway/Plugin en su lugar. |

<Tip>
Si no tienes claro qué ruta necesitas, empieza con `openclaw mcp status --verbose`. Muestra lo que OpenClaw ha guardado sin iniciar ningún servidor MCP.
</Tip>

## OpenClaw como servidor MCP

Esta es la ruta `openclaw mcp serve`.

### Cuándo usar `serve`

Usa `openclaw mcp serve` cuando:

- Codex, Claude Code u otro cliente MCP deba comunicarse directamente con conversaciones de canales respaldadas por OpenClaw
- ya tengas un Gateway de OpenClaw local o remoto con sesiones enrutadas
- quieras un servidor MCP que funcione en todos los backends de canal de OpenClaw en lugar de ejecutar puentes separados por canal

Usa [`openclaw acp`](/es/cli/acp) en su lugar cuando OpenClaw deba alojar el runtime de codificación por sí mismo y mantener la sesión del agente dentro de OpenClaw.

### Cómo funciona

`openclaw mcp serve` inicia un servidor MCP stdio. El cliente MCP es propietario de ese proceso. Mientras el cliente mantiene abierta la sesión stdio, el puente se conecta a un Gateway de OpenClaw local o remoto mediante WebSocket y expone conversaciones de canales enrutadas mediante MCP.

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
    - el estado de la cola en vivo comienza cuando el puente se conecta
    - el historial de transcripciones anterior se lee con `messages_read`
    - las notificaciones push de Claude solo existen mientras la sesión MCP está activa
    - cuando el cliente se desconecta, el puente sale y la cola en vivo desaparece
    - los puntos de entrada de agente de una sola ejecución, como `openclaw agent` y `openclaw infer model run`, retiran cualquier runtime MCP incluido que abran cuando la respuesta se completa, por lo que las ejecuciones con scripts repetidas no acumulan procesos secundarios MCP stdio
    - los servidores MCP stdio iniciados por OpenClaw (incluidos o configurados por el usuario) se desmontan como un árbol de procesos al apagar, por lo que los subprocesos secundarios iniciados por el servidor no sobreviven después de que sale el cliente stdio padre
    - eliminar o restablecer una sesión descarta los clientes MCP de esa sesión mediante la ruta compartida de limpieza del runtime, por lo que no quedan conexiones stdio persistentes vinculadas a una sesión eliminada

  </Accordion>
</AccordionGroup>

### Elige un modo de cliente

Usa el mismo puente de dos formas diferentes:

<Tabs>
  <Tab title="Clientes MCP genéricos">
    Solo herramientas MCP estándar. Usa `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` y las herramientas de aprobación.
  </Tab>
  <Tab title="Claude Code">
    Herramientas MCP estándar más el adaptador de canal específico de Claude. Habilita `--claude-channel-mode on` o deja el valor predeterminado `auto`.
  </Tab>
</Tabs>

<Note>
Hoy, `auto` se comporta igual que `on`. Aún no hay detección de capacidades del cliente.
</Note>

### Qué expone `serve`

El puente usa metadatos de ruta de sesión existentes de Gateway para exponer conversaciones respaldadas por canales. Una conversación aparece cuando OpenClaw ya tiene estado de sesión con una ruta conocida, como:

- `channel`
- metadatos de destinatario o destino
- `accountId` opcional
- `threadId` opcional

Esto da a los clientes MCP un único lugar para:

- listar conversaciones enrutadas recientes
- leer historial reciente de transcripciones
- esperar nuevos eventos entrantes
- enviar una respuesta de vuelta por la misma ruta
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
    Lista conversaciones recientes respaldadas por sesiones que ya tienen metadatos de ruta en el estado de sesión de Gateway.

    Filtros útiles:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Devuelve una conversación por `session_key` usando una búsqueda directa de sesión de Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Lee mensajes recientes de transcripción para una conversación respaldada por sesión.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrae bloques de contenido de mensajes que no son texto de un mensaje de transcripción. Esta es una vista de metadatos sobre el contenido de transcripción, no un almacén independiente y duradero de blobs de adjuntos.
  </Accordion>
  <Accordion title="events_poll">
    Lee eventos en vivo encolados desde un cursor numérico.
  </Accordion>
  <Accordion title="events_wait">
    Hace long-polling hasta que llega el siguiente evento encolado coincidente o vence un tiempo de espera.

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
- la cola es solo en vivo; comienza cuando se inicia el puente MCP
- `events_poll` y `events_wait` no reproducen por sí mismos historial anterior de Gateway
- el backlog duradero debe leerse con `messages_read`

</Warning>

### Notificaciones de canal de Claude

El puente también puede exponer notificaciones de canal específicas de Claude. Este es el equivalente de OpenClaw a un adaptador de canal de Claude Code: las herramientas MCP estándar siguen disponibles, pero los mensajes entrantes en vivo también pueden llegar como notificaciones MCP específicas de Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: solo herramientas MCP estándar.
  </Tab>
  <Tab title="on">
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

- los mensajes de transcripción entrantes de `user` se reenvían como `notifications/claude/channel`
- las solicitudes de permiso de Claude recibidas mediante MCP se registran en memoria
- si el propietario del comando en la conversación vinculada envía más tarde `yes abcde` o `no abcde`, el puente lo convierte en `notifications/claude/channel/permission`
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
  URL WebSocket de Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Token de Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Leer el token desde un archivo.
</ParamField>
<ParamField path="--password" type="string">
  Contraseña de Gateway.
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
Prefiere `--token-file` o `--password-file` en lugar de secretos en línea cuando sea posible.
</Tip>

### Seguridad y límite de confianza

El puente no inventa el enrutamiento. Solo expone conversaciones que Gateway ya sabe cómo enrutar.

Eso significa:

- las listas de remitentes permitidos, el emparejamiento y la confianza a nivel de canal siguen perteneciendo a la configuración de canal de OpenClaw subyacente
- `messages_send` solo puede responder a través de una ruta almacenada existente
- el estado de aprobación está activo/en memoria solo para la sesión actual del puente
- la autenticación del puente debe usar los mismos controles de token o contraseña de Gateway en los que confiarías para cualquier otro cliente remoto de Gateway

Si falta una conversación en `conversations_list`, la causa habitual no es la configuración de MCP. Son metadatos de ruta ausentes o incompletos en la sesión de Gateway subyacente.

### Pruebas

OpenClaw incluye una prueba de humo Docker determinista para este puente:

```bash
pnpm test:docker:mcp-channels
```

Esa prueba de humo:

- inicia un contenedor de Gateway con datos iniciales
- inicia un segundo contenedor que genera `openclaw mcp serve`
- verifica la detección de conversaciones, las lecturas de transcripciones, las lecturas de metadatos de adjuntos, el comportamiento de la cola de eventos en vivo y el enrutamiento de envíos salientes
- valida notificaciones de permisos y canales al estilo de Claude sobre el puente MCP stdio real

Esta es la forma más rápida de demostrar que el puente funciona sin conectar una cuenta real de Telegram, Discord o iMessage a la ejecución de pruebas.

Para un contexto de pruebas más amplio, consulta [Pruebas](/es/help/testing).

### Solución de problemas

<AccordionGroup>
  <Accordion title="No se devuelven conversaciones">
    Normalmente significa que la sesión de Gateway aún no es enrutable. Confirma que la sesión subyacente tenga metadatos de ruta almacenados para canal/proveedor, destinatario y cuenta/hilo opcional.
  </Accordion>
  <Accordion title="events_poll o events_wait omiten mensajes antiguos">
    Es esperado. La cola en vivo empieza cuando el puente se conecta. Lee el historial de transcripciones antiguo con `messages_read`.
  </Accordion>
  <Accordion title="Las notificaciones de Claude no aparecen">
    Comprueba todo esto:

    - el cliente mantuvo abierta la sesión MCP stdio
    - `--claude-channel-mode` está en `on` o `auto`
    - el cliente entiende realmente los métodos de notificación específicos de Claude
    - el mensaje entrante ocurrió después de que el puente se conectara

  </Accordion>
  <Accordion title="Faltan aprobaciones">
    `permissions_list_open` solo muestra solicitudes de aprobación observadas mientras el puente estaba conectado. No es una API duradera de historial de aprobaciones.
  </Accordion>
</AccordionGroup>

## OpenClaw como registro de clientes MCP

Esta es la ruta de `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` y `unset`.

Estos comandos no exponen OpenClaw a través de MCP. Gestionan definiciones de servidores MCP administradas por OpenClaw bajo `mcp.servers` en la configuración de OpenClaw. No leen servidores de mcporter desde `config/mcporter.json`.

Esas definiciones guardadas son para runtimes que OpenClaw inicia o configura más adelante, como OpenClaw integrado y otros adaptadores de runtime. OpenClaw almacena las definiciones de forma centralizada para que esos runtimes no necesiten mantener sus propias listas duplicadas de servidores MCP.

<AccordionGroup>
  <Accordion title="Comportamiento importante">
    - estos comandos solo leen o escriben la configuración de OpenClaw
    - `status`, `list`, `show`, `doctor` sin `--probe`, `set`, `configure`, `tools`, `logout`, `reload` y `unset` no se conectan al servidor MCP de destino
    - `login` realiza el flujo de red OAuth de MCP para el servidor HTTP configurado y guarda las credenciales locales resultantes
    - `status --verbose` imprime indicaciones resueltas de transporte, autenticación, tiempo de espera, filtro y llamadas paralelas a herramientas sin conectarse
    - `doctor` comprueba las definiciones guardadas para detectar problemas de configuración local, como comandos stdio faltantes, directorios de trabajo no válidos, archivos TLS faltantes, servidores deshabilitados, valores literales sensibles de encabezado/env y autorización OAuth incompleta
    - `doctor --probe` agrega la misma prueba de conexión en vivo que `probe` después de que pasen las comprobaciones estáticas
    - `probe` se conecta al servidor seleccionado o a todos los servidores configurados, lista herramientas e informa capacidades/diagnósticos
    - `add` crea una definición a partir de flags y la sondea antes de guardarla, salvo que `--no-probe` esté configurado o que primero se necesite autorización OAuth
    - los adaptadores de runtime deciden qué formas de transporte admiten realmente en tiempo de ejecución
    - `enabled: false` mantiene un servidor guardado, pero lo excluye de la detección de runtime integrado
    - `timeout` y `connectTimeout` establecen tiempos de espera de solicitud y conexión por servidor en segundos
    - `supportsParallelToolCalls: true` marca servidores que los adaptadores pueden llamar de forma concurrente
    - los servidores HTTP pueden usar encabezados estáticos, inicio de sesión OAuth, control de verificación TLS y rutas de certificado/clave mTLS
    - OpenClaw integrado expone herramientas MCP configuradas en los perfiles de herramientas `coding` y `messaging` normales; `minimal` todavía las oculta, y `tools.deny: ["bundle-mcp"]` las deshabilita explícitamente
    - `toolFilter.include` y `toolFilter.exclude` por servidor filtran las herramientas MCP detectadas antes de que se conviertan en herramientas de OpenClaw
    - los servidores que anuncian recursos o prompts también exponen herramientas de utilidad para listar/leer recursos y listar/obtener prompts; esos nombres de utilidad generados (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) usan el mismo filtro include/exclude
    - los cambios dinámicos en la lista de herramientas MCP invalidan el catálogo en caché para esa sesión; el siguiente descubrimiento/uso lo actualiza desde el servidor
    - los fallos repetidos de solicitud/protocolo de herramientas MCP pausan brevemente ese servidor para que un servidor roto no consuma todo el turno
    - los runtimes MCP empaquetados con alcance de sesión se recolectan después de `mcp.sessionIdleTtlMs` milisegundos de inactividad (predeterminado: 10 minutos; configura `0` para deshabilitarlo), y las ejecuciones integradas de un solo uso los limpian al final de la ejecución

  </Accordion>
</AccordionGroup>

Los adaptadores de runtime pueden normalizar este registro compartido a la forma que espera su cliente descendente. Por ejemplo, OpenClaw integrado consume directamente los valores `transport` de OpenClaw, mientras que Claude Code y Gemini reciben valores `type` nativos de CLI como `http`, `sse` o `stdio`.

El servidor de aplicación de Codex también respeta un bloque opcional `codex` en cada servidor. Estos son metadatos de proyección de OpenClaw solo para hilos del servidor de aplicación de Codex; no cambian las sesiones ACP, la configuración genérica del arnés de Codex ni otros adaptadores de runtime.
Usa `codex.agents` no vacío para proyectar un servidor solo en ids de agente de OpenClaw específicos. Las listas de agentes vacías, en blanco o no válidas se rechazan mediante la validación de configuración y se omiten en la ruta de proyección de runtime en lugar de volverse globales. Usa `codex.defaultToolsApprovalMode` (`auto`, `prompt` o `approve`) para emitir el `default_tools_approval_mode` nativo de Codex para un servidor de confianza.
OpenClaw elimina los metadatos `codex` antes de entregar la configuración nativa `mcp_servers` a Codex.

### Definiciones guardadas de servidores MCP

OpenClaw también almacena un registro ligero de servidores MCP en la configuración para superficies que quieren definiciones MCP administradas por OpenClaw.

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
- `show` sin nombre imprime el objeto completo de servidores MCP configurados.
- `status` clasifica los transportes configurados sin conectarse. `--verbose` incluye detalles resueltos de inicio, tiempo de espera, OAuth, filtro y llamadas paralelas.
- `doctor` realiza comprobaciones estáticas sin conectarse. Agrega `--probe` cuando el comando también deba verificar que los servidores habilitados se conectan.
- `probe` se conecta e informa recuentos de herramientas, compatibilidad con recursos/prompts, compatibilidad con cambios de lista y diagnósticos.
- `add` acepta flags de stdio como `--command`, `--arg`, `--env` y `--cwd`, o flags HTTP como `--url`, `--transport`, `--header`, `--auth oauth`, TLS, tiempo de espera y flags de selección de herramientas.
- `set` espera un valor de objeto JSON en la línea de comandos.
- `configure` actualiza habilitación, filtros de herramientas, tiempos de espera, OAuth, TLS e indicaciones de llamadas paralelas a herramientas sin reemplazar toda la definición del servidor.
- `tools` actualiza filtros de herramientas por servidor. Las entradas include/exclude son nombres de herramientas MCP y globs `*` simples.
- `login` ejecuta el flujo OAuth para servidores HTTP configurados con `auth: "oauth"`. La primera ejecución imprime una URL de autorización; vuelve a ejecutar con `--code` después de la aprobación.
- `logout` borra las credenciales OAuth almacenadas para el servidor nombrado sin eliminar la definición de servidor guardada.
- `reload` descarta runtimes MCP en proceso almacenados en caché. Los procesos de Gateway o de agente en otro proceso aún necesitan su propia ruta de recarga o reinicio.
- Usa `transport: "streamable-http"` para servidores MCP HTTP transmitibles. `openclaw mcp set` también normaliza `type: "http"` nativo de CLI a la misma forma de configuración canónica por compatibilidad.
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

Estos ejemplos solo guardan definiciones de servidores. Ejecuta `openclaw mcp doctor --probe` después para demostrar que el servidor se inicia y expone herramientas.

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

    Limita el alcance de los servidores de sistema de archivos al árbol de directorios más pequeño que el agente deba leer o editar.

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
  <Tab title="HTTP remoto">
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
  <Tab title="Escritorio/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Los servidores de control directo del escritorio heredan los permisos del proceso que inician. Usa filtros de herramientas restringidos y avisos de permisos a nivel del sistema operativo.

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
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` sale con código distinto de cero cuando cualquier servidor comprobado habilitado tiene un error. Las advertencias se notifican, pero no hacen que el comando falle por sí solas.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
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

    `probe` abre una sesión de cliente MCP en vivo. Úsalo para probar accesibilidad y capacidades, no para auditorías de configuración estática.

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
| `command`                  | Ejecutable que se iniciará (obligatorio)         |
| `args`                     | Arreglo de argumentos de línea de comandos       |
| `env`                      | Variables de entorno adicionales                 |
| `cwd` / `workingDirectory` | Directorio de trabajo para el proceso            |

<Warning>
**Filtro de seguridad de entorno stdio**

OpenClaw rechaza claves de entorno de inicio de intérprete que pueden alterar cómo se inicia un servidor MCP stdio antes del primer RPC, incluso si aparecen en el bloque `env` de un servidor. Las claves bloqueadas incluyen `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` y variables similares de control de tiempo de ejecución. El inicio las rechaza con un error de configuración para que no puedan inyectar un preludio implícito, cambiar el intérprete, habilitar un depurador ni redirigir la salida de tiempo de ejecución contra el proceso stdio. Las variables de entorno ordinarias de credenciales, proxy y específicas del servidor (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizadas, etc.) no se ven afectadas.

Si tu servidor MCP realmente necesita una de las variables bloqueadas, configúrala en el proceso host del Gateway en lugar de bajo el `env` del servidor stdio.
</Warning>

### Transporte SSE / HTTP

Se conecta a un servidor MCP remoto mediante HTTP Server-Sent Events.

| Campo                          | Descripción                                                         |
| ------------------------------ | ------------------------------------------------------------------- |
| `url`                          | URL HTTP o HTTPS del servidor remoto (obligatorio)                  |
| `headers`                      | Mapa clave-valor opcional de encabezados HTTP (por ejemplo, tokens de autenticación) |
| `connectionTimeoutMs`          | Tiempo de espera de conexión por servidor en ms (opcional)          |
| `connectTimeout`               | Tiempo de espera de conexión por servidor en segundos (opcional)    |
| `timeout` / `requestTimeoutMs` | Tiempo de espera de solicitud MCP por servidor en segundos o ms     |
| `auth: "oauth"`                | Usa almacenamiento de tokens OAuth de MCP y `openclaw mcp login`    |
| `sslVerify`                    | Establécelo en false solo para endpoints HTTPS privados explícitamente confiables |
| `clientCert` / `clientKey`     | Rutas del certificado y la clave de cliente mTLS                    |
| `supportsParallelToolCalls`    | Indica que las llamadas concurrentes son seguras para este servidor |

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

Los valores confidenciales en `url` (userinfo) y `headers` se censuran en los registros y la salida de estado. `openclaw mcp doctor` advierte cuando las entradas de `headers` o `env` con apariencia confidencial contienen valores literales, para que los operadores puedan sacar esos valores de la configuración confirmada.

### Flujo de trabajo OAuth

OAuth es para servidores MCP HTTP que anuncian el flujo OAuth de MCP. Los encabezados `Authorization` estáticos se ignoran para un servidor mientras `auth: "oauth"` está habilitado.

<Steps>
  <Step title="Guardar el servidor">
    Agrega o actualiza el servidor con `auth: "oauth"` y cualquier metadato OAuth opcional.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Iniciar sesión">
    Ejecuta el inicio de sesión para crear la solicitud de autorización.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw imprime la URL de autorización y almacena el estado temporal del verificador OAuth en el directorio de estado de OpenClaw.

  </Step>
  <Step title="Finalizar con el código">
    Después de aprobar en el navegador, pasa el código devuelto de vuelta a OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Comprobar autorización">
    Usa status o doctor para confirmar que los tokens están presentes.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Borrar credenciales">
    El cierre de sesión elimina las credenciales OAuth almacenadas, pero conserva la definición de servidor guardada.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Si el proveedor rota tokens o el estado de autorización queda atascado, ejecuta `openclaw mcp logout <name>` y luego repite `login`. `logout` puede borrar credenciales de un servidor HTTP guardado incluso después de que `auth: "oauth"` se haya eliminado de la configuración, siempre que el nombre del servidor y la URL sigan identificando la entrada del almacén de credenciales.

### Transporte HTTP transmitible

`streamable-http` es una opción de transporte adicional junto con `sse` y `stdio`. Usa streaming HTTP para la comunicación bidireccional con servidores MCP remotos.

| Campo                          | Descripción                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | URL HTTP o HTTPS del servidor remoto (obligatorio)                                     |
| `transport`                    | Establécelo en `"streamable-http"` para seleccionar este transporte; cuando se omite, OpenClaw usa `sse` |
| `headers`                      | Mapa clave-valor opcional de encabezados HTTP (por ejemplo, tokens de autenticación)   |
| `connectionTimeoutMs`          | Tiempo de espera de conexión por servidor en ms (opcional)                             |
| `connectTimeout`               | Tiempo de espera de conexión por servidor en segundos (opcional)                       |
| `timeout` / `requestTimeoutMs` | Tiempo de espera de solicitud MCP por servidor en segundos o ms                        |
| `auth: "oauth"`                | Usa almacenamiento de tokens OAuth de MCP y `openclaw mcp login`                       |
| `sslVerify`                    | Establécelo en false solo para endpoints HTTPS privados explícitamente confiables      |
| `clientCert` / `clientKey`     | Rutas del certificado y la clave de cliente mTLS                                       |
| `supportsParallelToolCalls`    | Indica que las llamadas concurrentes son seguras para este servidor                    |

La configuración de OpenClaw usa `transport: "streamable-http"` como la grafía canónica. Los valores `type: "http"` nativos del MCP de la CLI se aceptan cuando se guardan mediante `openclaw mcp set` y `openclaw doctor --fix` los repara en la configuración existente, pero `transport` es lo que OpenClaw incrustado consume directamente.

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
Los comandos de registro no inician el puente de canal. Solo `probe` y `doctor --probe` abren una sesión de cliente MCP en vivo para probar que el servidor de destino es accesible.
</Note>

## Interfaz de control

La interfaz de control del navegador incluye una página dedicada de configuración de MCP en `/mcp`. Muestra recuentos de servidores configurados, resúmenes de habilitación/OAuth/filtros, filas de transporte por servidor, controles para habilitar/deshabilitar, comandos comunes de la CLI y un editor delimitado para la sección de configuración `mcp`.

Usa la página para ediciones de operadores e inventario rápido. Usa `openclaw mcp doctor --probe` u `openclaw mcp probe` cuando necesites una prueba de servidor en vivo.

Flujo de trabajo del operador:

1. Abre la interfaz de control y elige **MCP**.
2. Revisa las tarjetas de resumen para servidores totales, habilitados, OAuth y filtrados.
3. Usa cada fila de servidor para obtener indicaciones de transporte, autenticación, filtro, tiempo de espera y comando.
4. Activa o desactiva la habilitación cuando quieras conservar una definición pero excluirla del descubrimiento en tiempo de ejecución.
5. Edita la sección de configuración `mcp` con alcance para cambios estructurales como servidores nuevos, encabezados, TLS, metadatos de OAuth o filtros de herramientas.
6. Elige **Guardar** para persistir solo la configuración, o **Guardar y publicar** para aplicarla mediante la ruta de configuración del Gateway.
7. Ejecuta `openclaw mcp doctor --probe` cuando necesites una prueba en vivo de que el servidor editado se inicia y lista herramientas.

Notas:

- los fragmentos de comando entrecomillan los nombres de servidores para que los nombres inusuales sigan siendo copiables en una shell
- los valores mostrados con formato de URL se redactan antes de renderizarse cuando contienen credenciales incrustadas
- la página no inicia transportes MCP por sí misma
- los tiempos de ejecución activos pueden necesitar `openclaw mcp reload`, publicación de configuración del Gateway o reinicio del proceso, según qué proceso sea propietario de los clientes MCP

## Límites actuales

Esta página documenta el puente tal como se distribuye hoy.

Límites actuales:

- el descubrimiento de conversaciones depende de los metadatos de ruta de sesión existentes del Gateway
- no hay ningún protocolo push genérico más allá del adaptador específico de Claude
- todavía no hay herramientas para editar mensajes ni reaccionar
- el transporte HTTP/SSE/streamable-http se conecta a un único servidor remoto; todavía no hay upstream multiplexado
- `permissions_list_open` solo incluye aprobaciones observadas mientras el puente está conectado

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Plugins](/es/cli/plugins)
