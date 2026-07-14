---
read_when:
    - Conectar Codex, Claude Code u otro cliente MCP a canales respaldados por OpenClaw
    - Ejecutando `openclaw mcp serve`
    - Administración de las definiciones de servidores MCP guardadas por OpenClaw
sidebarTitle: MCP
summary: Exponga las conversaciones de los canales de OpenClaw mediante MCP y gestione las definiciones guardadas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-07-14T13:31:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` tiene dos funciones:

- ejecutar OpenClaw como servidor MCP con `openclaw mcp serve`
- gestionar las definiciones de servidores MCP salientes administradas por OpenClaw con `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` y `unset`

`serve` corresponde a OpenClaw actuando como servidor MCP. Los demás subcomandos corresponden a OpenClaw actuando como registro del lado del cliente MCP para servidores que sus propios entornos de ejecución podrán consumir más adelante.

<Note>
  `list`, `show`, `set` y `unset` solo leen y escriben entradas `mcp.servers` administradas por OpenClaw en la configuración de OpenClaw. No incluyen servidores de mcporter procedentes de `config/mcporter.json`; use `mcporter list` para ese registro.
</Note>

Use [`openclaw acp`](/es/cli/acp) cuando OpenClaw deba alojar una sesión de entorno de programación y enrutar ese entorno de ejecución mediante ACP.

## Elegir la ruta MCP adecuada

| Objetivo                                                                | Usar                                                                  | Motivo                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Permitir que un cliente MCP externo lea o envíe conversaciones de canales de OpenClaw | `openclaw mcp serve`                                                 | OpenClaw es el servidor MCP y expone mediante stdio conversaciones respaldadas por el Gateway.                                 |
| Guardar servidores MCP de terceros para ejecuciones de agentes administradas por OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw es el registro del lado del cliente MCP y posteriormente proyecta esos servidores en los entornos de ejecución compatibles.               |
| Comprobar un servidor guardado sin ejecutar un turno del agente                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` y `doctor` inspeccionan la configuración; `probe` abre una conexión MCP activa y enumera sus capacidades.               |
| Editar la configuración de MCP desde un navegador                                      | `/settings/mcp` de la interfaz de control (alias `/mcp`)                            | La página muestra el inventario, la habilitación, resúmenes de OAuth y filtros, sugerencias de comandos y un editor de `mcp` con ámbito limitado.         |
| Proporcionar a Codex app-server un servidor MCP nativo con ámbito limitado                    | `mcp.servers.<name>.codex`                                           | El bloque `codex` solo afecta a la proyección de hilos de Codex app-server y se elimina antes de transferir la configuración nativa. |
| Ejecutar sesiones de entornos alojadas mediante ACP                                     | [`openclaw acp`](/es/cli/acp) y [Agentes ACP](/es/tools/acp-agents-setup) | El modo de puente ACP no acepta la inyección de servidores MCP por sesión; configure en su lugar puentes del Gateway o de plugins.     |

<Tip>
Si no se sabe con certeza qué ruta se necesita, se recomienda comenzar con `openclaw mcp status --verbose`. Muestra lo que OpenClaw ha guardado sin iniciar ningún servidor MCP.
</Tip>

## OpenClaw como servidor MCP

Esta es la ruta `openclaw mcp serve`.

### Cuándo usar serve

Use `openclaw mcp serve` cuando:

- Codex, Claude Code u otro cliente MCP deba comunicarse directamente con conversaciones de canales respaldadas por OpenClaw
- ya se disponga de un Gateway de OpenClaw local o remoto con sesiones enrutadas
- se desee un único servidor MCP que funcione con los distintos backends de canales de OpenClaw, en lugar de ejecutar puentes separados para cada canal

Use [`openclaw acp`](/es/cli/acp) en su lugar cuando OpenClaw deba alojar el propio entorno de ejecución de programación y mantener la sesión del agente dentro de OpenClaw.

### Funcionamiento

`openclaw mcp serve` inicia un servidor MCP mediante stdio. El cliente MCP es propietario de ese proceso. Mientras el cliente mantenga abierta la sesión stdio, el puente se conecta mediante WebSocket a un Gateway de OpenClaw local o remoto y expone las conversaciones de canales enrutadas mediante MCP.

<Steps>
  <Step title="El cliente inicia el puente">
    El cliente MCP inicia `openclaw mcp serve`.
  </Step>
  <Step title="El puente se conecta al Gateway">
    El puente se conecta mediante WebSocket al Gateway de OpenClaw.
  </Step>
  <Step title="Las sesiones se convierten en conversaciones MCP">
    Las sesiones enrutadas se convierten en conversaciones MCP y herramientas de transcripción e historial.
  </Step>
  <Step title="Los eventos en directo se ponen en cola">
    Los eventos en directo se ponen en cola en la memoria mientras el puente está conectado.
  </Step>
  <Step title="Envío opcional de Claude">
    Si el modo de canal de Claude está habilitado, la misma sesión también puede recibir notificaciones push específicas de Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportamiento importante">
    - el estado de la cola en directo comienza cuando se conecta el puente
    - el historial de transcripciones anterior se lee con `messages_read`
    - las notificaciones push de Claude solo existen mientras la sesión MCP está activa
    - cuando el cliente se desconecta, el puente finaliza y la cola en directo desaparece
    - los puntos de entrada de agente de una sola ejecución, como `openclaw agent` y `openclaw infer model run`, cierran los entornos de ejecución MCP integrados que abren cuando se completa la respuesta, por lo que las ejecuciones programadas repetidas no acumulan procesos secundarios MCP mediante stdio
    - los servidores MCP mediante stdio iniciados por OpenClaw (integrados o configurados por el usuario) se cierran como árbol de procesos durante el apagado, por lo que los subprocesos iniciados por el servidor no permanecen activos después de que finalice el cliente stdio principal
    - al eliminar o restablecer una sesión, se descartan los clientes MCP de esa sesión mediante la ruta compartida de limpieza del entorno de ejecución, por lo que no quedan conexiones stdio persistentes asociadas a una sesión eliminada

  </Accordion>
</AccordionGroup>

### Elegir un modo de cliente

<Tabs>
  <Tab title="Clientes MCP genéricos">
    Solo herramientas MCP estándar. Use `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` y las herramientas de aprobación.
  </Tab>
  <Tab title="Claude Code">
    Herramientas MCP estándar, además del adaptador de canal específico de Claude. Habilite `--claude-channel-mode on` o mantenga el valor predeterminado `auto`.
  </Tab>
</Tabs>

<Note>
Actualmente, `auto` se comporta igual que `on`. Todavía no existe detección de capacidades del cliente.
</Note>

### Qué expone serve

El puente utiliza los metadatos de rutas de sesión existentes del Gateway para exponer conversaciones respaldadas por canales. Una conversación aparece cuando OpenClaw ya tiene un estado de sesión con una ruta conocida, como:

- `channel`
- metadatos del destinatario o destino
- `accountId` opcional
- `threadId` opcional

Esto ofrece a los clientes MCP un único lugar para:

- enumerar las conversaciones enrutadas recientes
- leer el historial de transcripciones reciente
- esperar nuevos eventos entrantes
- enviar una respuesta mediante la misma ruta
- ver las solicitudes de aprobación que lleguen mientras el puente esté conectado

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
    Enumera las conversaciones recientes respaldadas por sesiones que ya tienen metadatos de ruta en el estado de sesión del Gateway.

    Filtros: `limit` (máx. 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Devuelve una conversación por `session_key` mediante una consulta directa de sesión al Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Lee los mensajes de transcripción recientes de una conversación respaldada por una sesión. El valor predeterminado de `limit` es 20; el máximo es 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrae bloques de contenido que no sean de texto de un mensaje de transcripción. Esta es una vista de metadatos del contenido de la transcripción, no un almacén independiente y persistente de objetos binarios adjuntos.
  </Accordion>
  <Accordion title="events_poll">
    Lee los eventos en directo en cola desde un cursor numérico. Máximo de `limit`: 200.
  </Accordion>
  <Accordion title="events_wait">
    Realiza un sondeo prolongado hasta que llega el siguiente evento en cola que coincide o vence el tiempo de espera (valor predeterminado: 30 s; máximo: 300 s).

    Use esta opción cuando un cliente MCP genérico necesite una entrega casi en tiempo real sin un protocolo push específico de Claude.

  </Accordion>
  <Accordion title="messages_send">
    Envía texto mediante la misma ruta que ya está registrada en la sesión.

    Comportamiento actual:

    - requiere una ruta de conversación existente
    - utiliza el canal, el destinatario, el id. de cuenta y el id. de hilo de la sesión
    - solo envía texto

  </Accordion>
  <Accordion title="permissions_list_open">
    Enumera las solicitudes pendientes de aprobación de ejecución o plugins que el puente ha observado desde que se conectó al Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Resuelve una solicitud pendiente de aprobación de ejecución o plugins con:

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
- la cola solo contiene eventos en directo; comienza cuando se inicia el puente MCP
- `events_poll` y `events_wait` no reproducen por sí mismos el historial anterior del Gateway
- el registro pendiente persistente debe leerse con `messages_read`

</Warning>

### Notificaciones del canal de Claude

El puente también puede exponer notificaciones específicas del canal de Claude. Este es el equivalente en OpenClaw de un adaptador de canal de Claude Code: las herramientas MCP estándar siguen disponibles, pero los mensajes entrantes en directo también pueden llegar como notificaciones MCP específicas de Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: solo herramientas MCP estándar.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: habilita las notificaciones del canal de Claude.
  </Tab>
  <Tab title="auto (predeterminado)">
    `--claude-channel-mode auto`: valor predeterminado actual; el mismo comportamiento del puente que `on`.
  </Tab>
</Tabs>

Cuando el modo de canal de Claude está habilitado, el servidor anuncia capacidades experimentales de Claude y puede emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamiento actual del puente:

- los mensajes de transcripción `user` entrantes se reenvían como `notifications/claude/channel`
- las solicitudes de permisos de Claude recibidas mediante MCP se registran en memoria
- si el propietario del comando en la conversación vinculada envía posteriormente `yes <id>` o `no <id>` (`<id>` es el id. de solicitud de 5 letras, sin incluir `l`), el puente lo convierte en `notifications/claude/channel/permission`
- estas notificaciones solo están disponibles durante la sesión activa; si el cliente MCP se desconecta, no hay ningún destino push

Este comportamiento es específico del cliente de forma intencionada. Los clientes MCP genéricos deben utilizar las herramientas de sondeo estándar.

### Configuración del cliente MCP

Ejemplo de configuración de un cliente stdio:

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

Para la mayoría de los clientes MCP genéricos, comience con la superficie de herramientas estándar e ignore el modo Claude. Active el modo Claude solo para clientes que realmente comprendan los métodos de notificación específicos de Claude.

### Opciones

`openclaw mcp serve` admite:

<ParamField path="--url" type="string">
  URL de WebSocket del Gateway. El valor predeterminado es `gateway.remote.url` cuando está configurado.
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
  Modo de notificación de Claude. Valor predeterminado: `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Registros detallados en stderr.
</ParamField>

<Tip>
Siempre que sea posible, prefiera `--token-file` o `--password-file` en lugar de secretos insertados directamente.
</Tip>

### Límite de seguridad y confianza

El puente no inventa el enrutamiento. Solo expone conversaciones que el Gateway ya sabe cómo enrutar.

Esto significa lo siguiente:

- las listas de remitentes permitidos, el emparejamiento y la confianza a nivel de canal siguen perteneciendo a la configuración subyacente del canal de OpenClaw
- `messages_send` solo puede responder mediante una ruta almacenada existente
- el estado de aprobación solo está activo y en memoria durante la sesión actual del puente
- la autenticación del puente debe usar los mismos controles de token o contraseña del Gateway en los que se confiaría para cualquier otro cliente remoto del Gateway

Si falta una conversación en `conversations_list`, la causa habitual no es la configuración de MCP. Se debe a metadatos de ruta ausentes o incompletos en la sesión subyacente del Gateway.

### Pruebas

OpenClaw incluye una prueba de humo determinista de Docker para este puente:

```bash
pnpm test:docker:mcp-channels
```

Esta prueba de humo ejecuta un único contenedor: inicializa el estado de la conversación, inicia el Gateway, después genera `openclaw mcp serve` como proceso secundario mediante stdio y lo controla como cliente MCP. Verifica el descubrimiento de conversaciones, la lectura de transcripciones, la lectura de metadatos de archivos adjuntos, el comportamiento de la cola de eventos en vivo y las notificaciones de canales y permisos al estilo de Claude mediante el puente MCP de stdio real. El enrutamiento de envíos salientes (`messages_send` reutilizando la ruta de conversación almacenada) se cubre por separado mediante pruebas unitarias en `src/mcp/channel-server.test.ts`.

Esta es la forma más rápida de demostrar que el puente funciona sin vincular una cuenta real de Telegram, Discord o iMessage a la ejecución de pruebas.

Para obtener un contexto de pruebas más amplio, consulte [Pruebas](/es/help/testing).

### Solución de problemas

<AccordionGroup>
  <Accordion title="No se devuelven conversaciones">
    Por lo general, significa que la sesión del Gateway aún no se puede enrutar. Confirme que la sesión subyacente tenga almacenados el canal o proveedor, el destinatario y los metadatos opcionales de ruta de cuenta o hilo.
  </Accordion>
  <Accordion title="events_poll o events_wait omite mensajes anteriores">
    Es el comportamiento esperado. La cola en vivo comienza cuando se conecta el puente. Lea el historial anterior de la transcripción con `messages_read`.
  </Accordion>
  <Accordion title="Las notificaciones de Claude no aparecen">
    Compruebe todo lo siguiente:

    - el cliente mantuvo abierta la sesión MCP de stdio
    - `--claude-channel-mode` es `on` o `auto`
    - el cliente realmente comprende los métodos de notificación específicos de Claude
    - el mensaje entrante se produjo después de que se conectara el puente

  </Accordion>
  <Accordion title="Faltan las aprobaciones">
    `permissions_list_open` solo muestra las solicitudes de aprobación observadas mientras el puente estaba conectado. No es una API de historial de aprobaciones persistente.
  </Accordion>
</AccordionGroup>

## OpenClaw como registro de clientes MCP

Esta es la ruta de `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` y `unset`.

Estos comandos no exponen OpenClaw mediante MCP. Administran las definiciones de servidores MCP gestionadas por OpenClaw en `mcp.servers` dentro de la configuración de OpenClaw. No leen los servidores de mcporter desde `config/mcporter.json`.

Estas definiciones guardadas están destinadas a entornos de ejecución que OpenClaw inicia o configura posteriormente, como OpenClaw integrado y otros adaptadores de entorno de ejecución. OpenClaw almacena las definiciones de forma centralizada para que esos entornos de ejecución no necesiten mantener sus propias listas duplicadas de servidores MCP.

<AccordionGroup>
  <Accordion title="Comportamiento importante">
    - estos comandos solo leen o escriben la configuración de OpenClaw
    - `status`, `list`, `show`, `doctor` sin `--probe`, `set`, `configure`, `tools`, `logout`, `reload` y `unset` no se conectan al servidor MCP de destino
    - `login` realiza el flujo de red OAuth de MCP para el servidor HTTP configurado y guarda las credenciales locales resultantes
    - `status --verbose` muestra el transporte resuelto, la autenticación, el tiempo de espera, el filtro y las indicaciones de llamadas paralelas a herramientas sin conectarse
    - `doctor` comprueba las definiciones guardadas en busca de problemas de configuración local, como comandos stdio ausentes, directorios de trabajo no válidos, archivos TLS ausentes, servidores deshabilitados, valores confidenciales literales en cabeceras o variables de entorno y autorizaciones OAuth incompletas
    - `doctor --probe` añade la misma prueba de conexión en vivo que `probe` después de superar las comprobaciones estáticas
    - `probe` se conecta al servidor seleccionado o a todos los servidores configurados, enumera las herramientas e informa de las capacidades y los diagnósticos
    - `add` crea una definición a partir de indicadores y realiza sondeos antes de guardarla, salvo que se establezca `--no-probe` o que primero sea necesaria la autorización OAuth
    - los adaptadores de entorno de ejecución deciden qué formas de transporte admiten realmente durante la ejecución
    - `enabled: false` mantiene guardado un servidor, pero lo excluye del descubrimiento del entorno de ejecución integrado
    - `timeout` y `connectTimeout` establecen los tiempos de espera por servidor para solicitudes y conexiones, en segundos
    - `supportsParallelToolCalls: true` marca los servidores a los que los adaptadores pueden llamar simultáneamente
    - los servidores HTTP pueden utilizar cabeceras estáticas, inicio de sesión OAuth, control de verificación TLS y rutas de certificados y claves mTLS
    - OpenClaw integrado expone las herramientas MCP configuradas en los perfiles de herramientas normales `coding` y `messaging`; `minimal` aún las oculta y `tools.deny: ["bundle-mcp"]` las deshabilita explícitamente
    - los valores `toolFilter.include` y `toolFilter.exclude` por servidor filtran las herramientas MCP descubiertas antes de que se conviertan en herramientas de OpenClaw
    - los servidores que anuncian recursos o indicaciones también exponen herramientas auxiliares para enumerar y leer recursos, así como para enumerar y obtener indicaciones; esos nombres auxiliares generados (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) utilizan el mismo filtro de inclusión y exclusión
    - los cambios dinámicos en la lista de herramientas MCP invalidan el catálogo almacenado en caché de esa sesión; el siguiente descubrimiento o uso lo actualiza desde el servidor
    - los fallos repetidos en las solicitudes de herramientas MCP o en el protocolo pausan brevemente ese servidor para que un servidor averiado no consuma todo el turno
    - los entornos de ejecución MCP incluidos con alcance de sesión se eliminan después de `mcp.sessionIdleTtlMs` milisegundos de inactividad (el valor predeterminado es 10 minutos; establezca `0` para deshabilitarlo) y las ejecuciones integradas de un solo uso los eliminan al finalizar

  </Accordion>
</AccordionGroup>

Los adaptadores de entorno de ejecución pueden normalizar este registro compartido con la forma que espera su cliente posterior. Por ejemplo, OpenClaw integrado consume directamente los valores `transport` de OpenClaw, mientras que Claude Code y Gemini reciben valores `type` nativos de la CLI, como `http`, `sse` o `stdio`.

El servidor de aplicaciones de Codex también respeta un bloque opcional `codex` en cada servidor. Se trata de
metadatos de proyección de OpenClaw solo para hilos del servidor de aplicaciones de Codex; no
cambia las sesiones ACP, la configuración genérica del entorno de Codex ni otros adaptadores de entorno de ejecución.
Utilice valores `codex.agents` no vacíos para proyectar un servidor únicamente en identificadores específicos de agentes de OpenClaw.
Las listas de agentes vacías, en blanco o no válidas son rechazadas por la validación de la configuración
y omitidas por la ruta de proyección del entorno de ejecución, en lugar de convertirse en
globales. Utilice `codex.defaultToolsApprovalMode` (`auto`, `prompt` o `approve`)
para emitir el valor nativo `default_tools_approval_mode` de Codex para un servidor de confianza.
OpenClaw elimina los metadatos `codex` antes de entregar la configuración nativa `mcp_servers`
a Codex.

### Definiciones de servidores MCP guardadas

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

- `list` ordena los nombres de los servidores.
- `show` sin un nombre muestra el objeto completo del servidor MCP configurado.
- `status` clasifica los transportes configurados sin conectarse. `--verbose` incluye los detalles resueltos de inicio, tiempo de espera, OAuth, filtros y llamadas paralelas.
- `doctor` realiza comprobaciones estáticas sin conectarse. Añada `--probe` cuando el comando también deba verificar que los servidores habilitados se conectan.
- `probe` se conecta e informa de los recuentos de herramientas, la compatibilidad con recursos e indicaciones, la compatibilidad con cambios en la lista y los diagnósticos.
- `add` acepta indicadores de stdio como `--command`, `--arg`, `--env` y `--cwd`, o indicadores HTTP como `--url`, `--transport`, `--header`, `--auth oauth`, además de indicadores de TLS, tiempo de espera y selección de herramientas.
- `set` espera un valor de objeto JSON en la línea de comandos.
- `configure` actualiza la habilitación, los filtros de herramientas, los tiempos de espera, OAuth, TLS y las indicaciones de llamadas paralelas a herramientas sin sustituir toda la definición del servidor. Añada `--probe` para verificar el servidor actualizado antes de guardarlo.
- `tools` actualiza los filtros de herramientas por servidor. Las entradas de inclusión y exclusión son nombres de herramientas MCP y patrones glob simples `*`.
- `login` ejecuta el flujo OAuth para servidores HTTP configurados con `auth: "oauth"`. La primera ejecución muestra una URL de autorización; vuelva a ejecutarlo con `--code` después de la aprobación.
- `logout` borra las credenciales OAuth almacenadas del servidor indicado sin eliminar la definición guardada del servidor.
- `reload` elimina los entornos de ejecución MCP en proceso almacenados en caché únicamente para el proceso actual de la CLI. Los procesos del Gateway o de agentes que se ejecuten en otro proceso siguen necesitando su propia ruta de recarga o reinicio.
- Utilice `transport: "streamable-http"` para servidores MCP HTTP transmitibles. `openclaw mcp set` también normaliza el valor `type: "http"` nativo de la CLI a la misma forma de configuración canónica por compatibilidad.
- `unset` falla si el servidor indicado no existe.

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

### Recetas habituales de servidores

Estos ejemplos solo guardan definiciones de servidores. Ejecute `openclaw mcp doctor --probe` después para comprobar que el servidor se inicia y expone herramientas.

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

    Limite el ámbito de los servidores de sistema de archivos al árbol de directorios más pequeño que el agente deba leer o editar.

  </Tab>
  <Tab title="Memoria">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Utilice un filtro de herramientas si el servidor expone herramientas de escritura que no deban estar disponibles para los agentes normales.

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

    Utilice OAuth cuando el servidor remoto lo admita. Si el servidor requiere encabezados estáticos, evite confirmar tokens de portador literales en el repositorio.

  </Tab>
  <Tab title="Escritorio/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Los servidores de control directo del escritorio heredan los permisos del proceso que inician. Utilice filtros de herramientas restrictivos y solicitudes de permisos del sistema operativo.

  </Tab>
</Tabs>

### Estructuras de salida JSON

Utilice `--json` para scripts y paneles. Los conjuntos de campos pueden ampliarse con el tiempo, por lo que los consumidores deben ignorar las claves desconocidas.

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
              "message": "Las credenciales de OAuth no están autorizadas; ejecute openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` termina con un código distinto de cero cuando cualquier servidor habilitado que se haya comprobado presenta un problema de nivel `error`. Los problemas `warning` y `info` se notifican, pero no provocan por sí solos que el comando falle.

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

    `probe --json` abre una sesión activa del cliente MCP e imprime directamente su resultado; a diferencia de `status`/`doctor`, la salida no contiene ningún campo `path` de nivel superior. Las claves `resources` y `prompts` solo están presentes cuando el servidor anuncia realmente esa capacidad (un servidor sin indicaciones omite la clave `prompts` en lugar de informar `false`). Utilice `probe` para comprobar la accesibilidad y las capacidades, no para auditar configuraciones estáticas.

  </Accordion>
</AccordionGroup>

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

### Transporte Stdio

Inicia un proceso secundario local y se comunica mediante stdin/stdout.

| Campo                      | Descripción                       |
| -------------------------- | --------------------------------- |
| `command`                  | Ejecutable que se iniciará (obligatorio)    |
| `args`                     | Matriz de argumentos de línea de comandos   |
| `env`                      | Variables de entorno adicionales       |
| `cwd` / `workingDirectory` | Directorio de trabajo del proceso |

<Warning>
**Filtro de seguridad del entorno de Stdio**

OpenClaw rechaza las claves de entorno de inicio del intérprete, secuestro del cargador e inicio del shell antes de iniciar un servidor MCP Stdio, aunque aparezcan en el bloque `env` de un servidor. Para ello, utiliza la misma política de seguridad del entorno del host que otros procesos iniciados por OpenClaw: bloquea los enlaces de inicio conocidos de intérpretes (por ejemplo, `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), los prefijos de inyección de bibliotecas compartidas y funciones (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) y variables similares de control del entorno de ejecución. Al iniciarse, descarta estas variables silenciosamente y registra una advertencia para impedir que inyecten un preámbulo implícito, sustituyan el intérprete, habiliten un depurador o secuestren el enlazador dinámico del proceso Stdio. Una lista explícita de permitidos mantiene utilizables las variables de entorno habituales de credenciales MCP (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), junto con las variables de entorno habituales de proxy y específicas del servidor (`HTTP_PROXY`, `*_API_KEY` personalizadas, etc.). Otras claves `AWS_*`, como `AWS_CONFIG_FILE` y `AWS_SHARED_CREDENTIALS_FILE`, permanecen bloqueadas porque apuntan a archivos de credenciales en lugar de contener directamente un valor de credencial.

Si el servidor MCP necesita realmente una de las variables bloqueadas, establézcala en el proceso host del Gateway en lugar de hacerlo en el bloque `env` del servidor Stdio.
</Warning>

### Transporte SSE/HTTP

Se conecta a un servidor MCP remoto mediante eventos enviados por el servidor a través de HTTP.

| Campo                          | Descripción                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | URL HTTP o HTTPS del servidor remoto (obligatoria)                |
| `headers`                      | Mapa opcional de pares clave-valor de encabezados HTTP (por ejemplo, tokens de autenticación) |
| `connectionTimeoutMs`          | Tiempo de espera de conexión por servidor en ms (opcional)                   |
| `connectTimeout`               | Tiempo de espera de conexión por servidor en segundos (opcional)              |
| `timeout` / `requestTimeoutMs` | Tiempo de espera de solicitudes MCP por servidor en segundos o ms                  |
| `auth: "oauth"`                | Utilizar las credenciales OAuth de MCP guardadas mediante `openclaw mcp login`          |
| `sslVerify`                    | Establecer en false únicamente para puntos de conexión HTTPS privados y explícitamente fiables    |
| `clientCert` / `clientKey`     | Rutas del certificado y la clave del cliente mTLS                            |
| `supportsParallelToolCalls`    | Indica que las llamadas simultáneas son seguras para este servidor              |

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

Los valores confidenciales de `url` (información del usuario) y `headers` se ocultan en los registros y en la salida de estado. `openclaw mcp doctor` advierte cuando las entradas `headers` o `env` que parecen confidenciales contienen valores literales, para que los operadores puedan trasladar esos valores fuera de la configuración confirmada en el repositorio.

### Flujo de trabajo de OAuth

OAuth se utiliza para servidores MCP HTTP que anuncian el flujo OAuth de MCP. Los encabezados estáticos `Authorization` se ignoran en un servidor mientras `auth: "oauth"` está habilitado. Las credenciales guardadas mediante `openclaw mcp login` funcionan con MCP integrado, ejecutores de la CLI y el servidor de aplicaciones local de Codex.

Hasta que haya credenciales disponibles, OpenClaw omite únicamente ese servidor MCP del entorno de ejecución del agente, en lugar de provocar un error en el turno del agente. El operador, o un agente con acceso al shell, puede ejecutar entonces `openclaw mcp login <name>` y utilizar el servidor en un turno posterior.

Cuando un servicio MCP remoto ya utiliza un perfil de autenticación independiente de OpenClaw con capacidad de renovación, puede establecer opcionalmente `oauth.authProfileId`. OpenClaw renueva cualquiera de las fuentes de credenciales antes de la proyección en el entorno de ejecución y solo pasa el token de acceso actual al cliente MCP descendente.

<Steps>
  <Step title="Guardar el servidor">
    Añada o actualice el servidor con `auth: "oauth"` y cualquier metadato opcional de OAuth.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Para un token de portador respaldado por un perfil de autenticación, guarde la vinculación del perfil:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Iniciar sesión">
    Ejecute el inicio de sesión para crear la solicitud de autorización.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw imprime la URL de autorización y almacena el estado temporal del verificador de OAuth en el directorio de estado de OpenClaw.

  </Step>
  <Step title="Finalizar con el código">
    Después de conceder la aprobación en el navegador, devuelva el código recibido a OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Comprobar la autorización">
    Use status o doctor para confirmar que los tokens están presentes.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Borrar las credenciales">
    Logout elimina las credenciales OAuth almacenadas, pero conserva la definición guardada del servidor.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Si el proveedor rota los tokens o el estado de autorización queda bloqueado, ejecuta `openclaw mcp logout <name>` y, a continuación, repite `login`. `logout` puede borrar las credenciales de un servidor HTTP guardado incluso después de que `auth: "oauth"` se haya eliminado de la configuración, siempre que el nombre y la URL del servidor sigan identificando la entrada del almacén de credenciales.

### Transporte HTTP con streaming

`streamable-http` es una opción de transporte adicional junto con `sse` y `stdio`. Utiliza streaming HTTP para la comunicación bidireccional con servidores MCP remotos.

| Campo                          | Descripción                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | URL HTTP o HTTPS del servidor remoto (obligatoria)                                     |
| `transport`                    | Establécelo en `"streamable-http"` para seleccionar este transporte; si se omite, OpenClaw utiliza `sse` |
| `headers`                      | Mapa opcional de pares clave-valor de encabezados HTTP (por ejemplo, tokens de autenticación) |
| `connectionTimeoutMs`          | Tiempo de espera de conexión por servidor en ms (opcional)                             |
| `connectTimeout`               | Tiempo de espera de conexión por servidor en segundos (opcional)                       |
| `timeout` / `requestTimeoutMs` | Tiempo de espera de solicitudes MCP por servidor en segundos o ms                      |
| `auth: "oauth"`                | Utiliza las credenciales OAuth de MCP guardadas mediante `openclaw mcp login`            |
| `sslVerify`                    | Establécelo en false solo para endpoints HTTPS privados de confianza explícita          |
| `clientCert` / `clientKey`     | Rutas del certificado y la clave de cliente mTLS                                       |
| `supportsParallelToolCalls`    | Indica que las llamadas simultáneas son seguras para este servidor                     |

La configuración de OpenClaw utiliza `transport: "streamable-http"` como grafía canónica. Los valores `type: "http"` de MCP nativos de la CLI se aceptan cuando se guardan mediante `openclaw mcp set` y `openclaw doctor --fix` los repara en la configuración existente, pero `transport` es lo que consume directamente OpenClaw integrado.

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
Los comandos del registro no inician el puente del canal. Solo `probe` y `doctor --probe` abren una sesión activa del cliente MCP para demostrar que se puede acceder al servidor de destino.
</Note>

## Interfaz de control

La interfaz de control del navegador incluye una página de configuración dedicada a MCP en `/settings/mcp`; la ruta anterior `/mcp` sigue siendo un alias. La página muestra el número de servidores configurados, resúmenes de servidores habilitados, OAuth y filtros, filas de transporte por servidor, controles para habilitar o deshabilitar, comandos comunes de la CLI y un editor limitado a la sección de configuración `mcp`.

Utiliza la página para realizar modificaciones operativas y consultar rápidamente el inventario. Utiliza `openclaw mcp doctor --probe` o `openclaw mcp probe` cuando necesites una prueba activa del servidor.

Flujo de trabajo del operador:

1. Abre la interfaz de control y selecciona **MCP**.
2. Revisa las tarjetas de resumen de servidores totales, habilitados, con OAuth y filtrados.
3. Utiliza la fila de cada servidor para consultar indicaciones sobre el transporte, la autenticación, los filtros, el tiempo de espera y los comandos.
4. Alterna la habilitación cuando quieras conservar una definición, pero excluirla del descubrimiento en tiempo de ejecución.
5. Edita la sección de configuración delimitada `mcp` para realizar cambios estructurales, como añadir servidores, encabezados, TLS, metadatos OAuth o filtros de herramientas.
6. Selecciona **Guardar** para conservar únicamente la configuración o **Guardar y publicar** para aplicarla mediante la ruta de configuración del Gateway.
7. Ejecuta `openclaw mcp doctor --probe` cuando necesites una prueba activa de que el servidor editado se inicia y enumera las herramientas.

Notas:

- los fragmentos de comandos ponen entre comillas los nombres de los servidores para que los nombres poco habituales puedan seguir copiándose en un shell
- los valores mostrados similares a URL se ocultan antes de renderizarlos cuando contienen credenciales integradas
- la página no inicia por sí sola los transportes MCP
- los entornos de ejecución activos pueden requerir `openclaw mcp reload`, la publicación de la configuración del Gateway o el reinicio del proceso, según qué proceso sea el propietario de los clientes MCP

## Aplicaciones MCP

OpenClaw puede renderizar herramientas que implementen la [extensión MCP Apps](https://modelcontextprotocol.io/extensions/apps) estable. Las aplicaciones son opcionales porque su HTML procede del servidor MCP configurado y puede solicitar herramientas o recursos visibles para la aplicación desde ese mismo servidor.

Habilita el puente del host:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Reinicia el Gateway después de cambiar esta configuración. Cuando está habilitada, OpenClaw inicia un listener HTTP(S) exclusivo para el entorno aislado en el puerto del Gateway más uno (para el Gateway predeterminado, `18790`). La interfaz de control carga las aplicaciones desde ese origen independiente; el listener nunca sirve la interfaz de control, las rutas autenticadas del Gateway ni datos de usuario.

Las conexiones directas al Gateway necesitan acceso a ambos puertos. Si un proxy inverso o terminador TLS expone la interfaz de control, asigna a las aplicaciones un origen público dedicado y redirige únicamente ese origen al listener del entorno aislado:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

El origen del entorno aislado debe ser distinto del origen de la interfaz de control. No alojes en él otro contenido autenticado o confidencial.

Por ejemplo, la demostración básica oficial de React puede configurarse así:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

Comportamiento y límites de seguridad:

- OpenClaw anuncia la extensión `io.modelcontextprotocol/ui` solo cuando las aplicaciones están habilitadas.
- Solo se renderizan los recursos `ui://` con el tipo MIME exacto `text/html;profile=mcp-app`.
- Los recursos de la interfaz de usuario tienen un límite de 2 MiB, se sitúan detrás de un proxy de doble iframe en un origen externo dedicado, se cargan en un origen interno opaco de la aplicación y se restringen mediante una CSP derivada de los metadatos del recurso.
- Las herramientas exclusivas de la aplicación (`_meta.ui.visibility: ["app"]`) no se incluyen en las listas de herramientas del modelo. Las aplicaciones solo pueden llamar a herramientas visibles para la aplicación en su servidor propietario que también cumplan la política efectiva de herramientas de OpenClaw para la ejecución que creó la vista.
- Los permisos de la aplicación vinculados al origen, como la cámara, el micrófono y la geolocalización, no se conceden mientras los documentos internos de la aplicación utilicen orígenes opacos para el aislamiento entre aplicaciones.
- El HTML de la aplicación, los argumentos completos de las herramientas y los resultados sin procesar permanecen en una concesión de vista limitada en memoria durante diez minutos y no se escriben en disco ni se copian en los metadatos de vista previa de la transcripción. La transcripción solo almacena un descriptor limitado de servidor, herramienta y recurso vinculado al ID original de la llamada a la herramienta. Después de reiniciar el Gateway, la interfaz de control puede verificar ese descriptor con la transcripción de la sesión autenticada y volver a obtener el recurso `ui://`; las vistas reconstruidas son de solo lectura hasta que una nueva ejecución establezca los permisos actuales de las herramientas.
- `openclaw security audit` muestra una advertencia mientras el puente está habilitado. Deshabilítalo con `openclaw config set mcp.apps.enabled false --strict-json` cuando no sea necesario.

## Límites actuales

Esta página documenta el puente tal como se distribuye actualmente.

Límites actuales:

- el descubrimiento de conversaciones depende de los metadatos existentes de las rutas de sesión del Gateway
- no existe ningún protocolo genérico de envío más allá del adaptador específico de Claude
- todavía no hay herramientas para editar mensajes ni añadir reacciones
- el transporte HTTP/SSE/streamable-http se conecta a un único servidor remoto; todavía no existe multiplexación ascendente
- `permissions_list_open` solo incluye las aprobaciones observadas mientras el puente está conectado

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Plugins](/es/cli/plugins)
