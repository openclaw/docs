---
read_when:
    - Conectar Codex, Claude Code u otro cliente MCP a canales respaldados por OpenClaw
    - Ejecutando `openclaw mcp serve`
    - Gestión de las definiciones de servidores MCP guardadas por OpenClaw
sidebarTitle: MCP
summary: Expón las conversaciones de los canales de OpenClaw mediante MCP y gestiona las definiciones guardadas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-07-20T11:43:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 07db33cc81d9e307b4bd83e0a3a283aa8a9bb66f9fbedd7f972d59333676b7e9
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` tiene dos funciones:

- ejecutar OpenClaw como servidor MCP con `openclaw mcp serve`
- administrar definiciones de servidores MCP salientes gestionadas por OpenClaw con `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` y `unset`

`serve` es OpenClaw actuando como servidor MCP. Los demás subcomandos corresponden a OpenClaw actuando como registro del lado del cliente MCP para servidores que sus propios entornos de ejecución podrán consumir posteriormente.

<Note>
  `list`, `show`, `set` y `unset` solo leen y escriben entradas `mcp.servers` gestionadas por OpenClaw en la configuración de OpenClaw. No incluyen servidores de mcporter procedentes de `config/mcporter.json`; use `mcporter list` para ese registro.
</Note>

Use [`openclaw acp`](/es/cli/acp) cuando OpenClaw deba alojar por sí mismo una sesión de infraestructura de programación y enrutar ese entorno de ejecución mediante ACP.

## Elegir la ruta MCP adecuada

| Objetivo                                                                | Usar                                                                  | Motivo                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Permitir que un cliente MCP externo lea o envíe conversaciones de canales de OpenClaw | `openclaw mcp serve`                                                 | OpenClaw es el servidor MCP y expone mediante stdio las conversaciones respaldadas por el Gateway.                                 |
| Guardar servidores MCP de terceros para ejecuciones de agentes gestionadas por OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw es el registro del lado del cliente MCP y posteriormente proyecta esos servidores en entornos de ejecución aptos.               |
| Comprobar un servidor guardado sin ejecutar un turno del agente                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` y `doctor` inspeccionan la configuración; `probe` abre una conexión MCP activa y enumera las capacidades.               |
| Editar la configuración de MCP desde un navegador                                      | `/settings/mcp` de la IU de control (alias `/mcp`)                            | La página muestra el inventario, la habilitación, resúmenes de OAuth y filtros, sugerencias de comandos y un editor limitado al ámbito de `mcp`.         |
| Proporcionar a Codex app-server un servidor MCP nativo limitado al ámbito                    | `mcp.servers.<name>.codex`                                           | El bloque `codex` solo afecta a la proyección de hilos de Codex app-server y se elimina antes de entregar la configuración nativa. |
| Ejecutar sesiones de infraestructura alojadas mediante ACP                                     | [`openclaw acp`](/es/cli/acp) y [Agentes ACP](/es/tools/acp-agents-setup) | El modo de puente ACP no acepta la inyección de servidores MCP por sesión; configure en su lugar puentes del Gateway o de plugins.     |

<Tip>
Si no se sabe con certeza qué ruta se necesita, empiece por `openclaw mcp status --verbose`. Muestra lo que OpenClaw tiene guardado sin iniciar ningún servidor MCP.
</Tip>

## OpenClaw como servidor MCP

Esta es la ruta `openclaw mcp serve`.

### Cuándo usar serve

Use `openclaw mcp serve` cuando:

- Codex, Claude Code u otro cliente MCP deba comunicarse directamente con conversaciones de canales respaldadas por OpenClaw
- ya se disponga de un Gateway de OpenClaw local o remoto con sesiones enrutadas
- se quiera un único servidor MCP que funcione con todos los backends de canales de OpenClaw, en lugar de ejecutar puentes independientes para cada canal

Use [`openclaw acp`](/es/cli/acp) en su lugar cuando OpenClaw deba alojar por sí mismo el entorno de ejecución de programación y mantener la sesión del agente dentro de OpenClaw.

### Funcionamiento

`openclaw mcp serve` inicia un servidor MCP mediante stdio. El cliente MCP es propietario de ese proceso. Mientras el cliente mantiene abierta la sesión stdio, el puente se conecta por WebSocket a un Gateway de OpenClaw local o remoto y expone mediante MCP las conversaciones de canales enrutadas.

<Steps>
  <Step title="El cliente inicia el puente">
    El cliente MCP inicia `openclaw mcp serve`.
  </Step>
  <Step title="El puente se conecta al Gateway">
    El puente se conecta por WebSocket al Gateway de OpenClaw.
  </Step>
  <Step title="Las sesiones se convierten en conversaciones MCP">
    Las sesiones enrutadas se convierten en conversaciones MCP y en herramientas de transcripción e historial.
  </Step>
  <Step title="Los eventos en directo se ponen en cola">
    Los eventos en directo se ponen en cola en memoria mientras el puente está conectado.
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
    - los puntos de entrada de agente de una sola ejecución, como `openclaw agent` y `openclaw infer model run`, cierran cualquier entorno de ejecución MCP incluido que abran cuando finaliza la respuesta, de modo que las ejecuciones repetidas mediante scripts no acumulen procesos secundarios MCP de stdio
    - los servidores MCP de stdio iniciados por OpenClaw (incluidos o configurados por el usuario) se cierran como un árbol de procesos durante el apagado, por lo que los subprocesos iniciados por el servidor no permanecen activos después de que finalice el cliente stdio principal
    - al eliminar o restablecer una sesión, se cierran los clientes MCP de esa sesión mediante la ruta compartida de limpieza del entorno de ejecución, por lo que no quedan conexiones stdio persistentes vinculadas a una sesión eliminada

  </Accordion>
</AccordionGroup>

### Elegir un modo de cliente

<Tabs>
  <Tab title="Clientes MCP genéricos">
    Solo herramientas MCP estándar. Use `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` y las herramientas de aprobación.
  </Tab>
  <Tab title="Claude Code">
    Herramientas MCP estándar más el adaptador de canal específico de Claude. Habilite `--claude-channel-mode on` o conserve el valor predeterminado `auto`.
  </Tab>
</Tabs>

<Note>
Actualmente, `auto` se comporta igual que `on`. Aún no existe detección de capacidades del cliente.
</Note>

### Qué expone serve

El puente utiliza los metadatos existentes de las rutas de sesión del Gateway para exponer conversaciones respaldadas por canales. Una conversación aparece cuando OpenClaw ya dispone de un estado de sesión con una ruta conocida, como:

- `channel`
- metadatos del destinatario o del destino
- `accountId` opcional
- `threadId` opcional

Esto proporciona a los clientes MCP un único lugar para:

- enumerar conversaciones enrutadas recientes
- leer el historial reciente de transcripciones
- esperar nuevos eventos entrantes
- enviar una respuesta por la misma ruta
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
    Lee mensajes recientes de la transcripción de una conversación respaldada por una sesión. El valor predeterminado de `limit` es 20; el máximo es 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrae bloques de contenido no textual de un mensaje de la transcripción. Esta es una vista de metadatos del contenido de la transcripción, no un almacén independiente y duradero de blobs de archivos adjuntos.
  </Accordion>
  <Accordion title="events_poll">
    Lee los eventos en directo en cola desde un cursor numérico. Máximo de `limit`: 200.
  </Accordion>
  <Accordion title="events_wait">
    Realiza una consulta de sondeo largo hasta que llega el siguiente evento en cola que coincide o vence el tiempo de espera (valor predeterminado: 30s; máximo: 300s).

    Use esta opción cuando un cliente MCP genérico necesite una entrega casi en tiempo real sin un protocolo push específico de Claude.

  </Accordion>
  <Accordion title="messages_send">
    Devuelve texto por la misma ruta ya registrada en la sesión.

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
- el historial pendiente duradero debe leerse con `messages_read`

</Warning>

### Notificaciones del canal de Claude

El puente también puede exponer notificaciones específicas del canal de Claude. Este es el equivalente en OpenClaw de un adaptador de canal de Claude Code: las herramientas MCP estándar siguen estando disponibles, pero los mensajes entrantes en directo también pueden llegar como notificaciones MCP específicas de Claude.

<Tabs>
  <Tab title="desactivado">
    `--claude-channel-mode off`: solo herramientas MCP estándar.
  </Tab>
  <Tab title="activado">
    `--claude-channel-mode on`: habilita las notificaciones del canal de Claude.
  </Tab>
  <Tab title="automático (predeterminado)">
    `--claude-channel-mode auto`: valor predeterminado actual; el mismo comportamiento del puente que `on`.
  </Tab>
</Tabs>

Cuando el modo de canal de Claude está habilitado, el servidor anuncia capacidades experimentales de Claude y puede emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamiento actual del puente:

- los mensajes entrantes de transcripción `user` se reenvían como `notifications/claude/channel`
- las solicitudes de permiso de Claude recibidas mediante MCP se registran en memoria
- si el propietario del comando en la conversación vinculada envía posteriormente `yes <id>` o `no <id>` (`<id>` es el id. de solicitud de 5 letras, sin incluir `l`), el puente lo convierte en `notifications/claude/channel/permission`
- estas notificaciones solo existen durante la sesión activa; si el cliente MCP se desconecta, no hay ningún destino push

Esto es específico del cliente de forma intencionada. Los clientes MCP genéricos deben utilizar las herramientas de sondeo estándar.

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

Para la mayoría de los clientes MCP genéricos, se recomienda comenzar con la superficie de herramientas estándar e ignorar el modo Claude. Se debe activar el modo Claude únicamente para los clientes que realmente comprendan los métodos de notificación específicos de Claude.

### Opciones

`openclaw mcp serve` admite:

<ParamField path="--url" type="string">
  URL de WebSocket del Gateway. Cuando está configurada, el valor predeterminado es `gateway.remote.url`.
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
  Modo de notificaciones de Claude. Valor predeterminado: `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Registros detallados en stderr.
</ParamField>

<Tip>
Cuando sea posible, es preferible usar `--token-file` o `--password-file` en lugar de secretos en línea.
</Tip>

### Límite de seguridad y confianza

El puente no crea rutas. Solo expone las conversaciones que el Gateway ya sabe cómo enrutar.

Esto significa lo siguiente:

- las listas de remitentes permitidos, el emparejamiento y la confianza a nivel de canal siguen perteneciendo a la configuración del canal de OpenClaw subyacente
- `messages_send` solo puede responder mediante una ruta almacenada existente
- el estado de aprobación solo está activo y en memoria durante la sesión actual del puente
- la autenticación del puente debe usar los mismos controles de token o contraseña del Gateway en los que se confiaría para cualquier otro cliente remoto del Gateway

Si falta una conversación en `conversations_list`, la causa habitual no es la configuración de MCP. Se debe a metadatos de ruta ausentes o incompletos en la sesión del Gateway subyacente.

### Pruebas

OpenClaw incluye una prueba de humo determinista en Docker para este puente:

```bash
pnpm test:docker:mcp-channels
```

Esta prueba de humo ejecuta un único contenedor: inicializa el estado de las conversaciones, inicia el Gateway y, a continuación, genera `openclaw mcp serve` como proceso secundario stdio y lo controla como cliente MCP. Verifica la detección de conversaciones, la lectura de transcripciones, la lectura de metadatos de archivos adjuntos, el comportamiento de la cola de eventos en vivo y las notificaciones de canales y permisos al estilo de Claude mediante el puente MCP stdio real. El enrutamiento de envíos salientes (`messages_send` reutilizando la ruta de conversación almacenada) se cubre por separado mediante pruebas unitarias en `src/mcp/channel-server.test.ts`.

Esta es la forma más rápida de demostrar que el puente funciona sin conectar una cuenta real de Telegram, Discord o iMessage a la ejecución de la prueba.

Para obtener más contexto sobre las pruebas, se puede consultar [Pruebas](/es/help/testing).

### Solución de problemas

<AccordionGroup>
  <Accordion title="No se devolvieron conversaciones">
    Por lo general, significa que la sesión del Gateway todavía no se puede enrutar. Se debe confirmar que la sesión subyacente tenga almacenados el canal o proveedor, el destinatario y los metadatos opcionales de la ruta de la cuenta o del hilo.
  </Accordion>
  <Accordion title="events_poll o events_wait omite mensajes anteriores">
    Es el comportamiento esperado. La cola en vivo comienza cuando el puente se conecta. El historial anterior de la transcripción se puede leer con `messages_read`.
  </Accordion>
  <Accordion title="Las notificaciones de Claude no aparecen">
    Se debe comprobar todo lo siguiente:

    - el cliente mantuvo abierta la sesión MCP stdio
    - `--claude-channel-mode` es `on` o `auto`
    - el cliente realmente comprende los métodos de notificación específicos de Claude
    - el mensaje entrante se produjo después de que el puente se conectara

  </Accordion>
  <Accordion title="Faltan las aprobaciones">
    `permissions_list_open` solo muestra las solicitudes de aprobación observadas mientras el puente estaba conectado. No es una API de historial de aprobaciones persistente.
  </Accordion>
</AccordionGroup>

## OpenClaw como registro de clientes MCP

Esta es la ruta de `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` y `unset`.

Estos comandos no exponen OpenClaw mediante MCP. Gestionan las definiciones de servidores MCP administradas por OpenClaw en `mcp.servers` dentro de la configuración de OpenClaw. No leen los servidores de mcporter desde `config/mcporter.json`.

Estas definiciones guardadas están destinadas a entornos de ejecución que OpenClaw inicia o configura posteriormente, como OpenClaw integrado y otros adaptadores de entornos de ejecución. OpenClaw almacena las definiciones de forma centralizada para que estos entornos de ejecución no tengan que mantener sus propias listas duplicadas de servidores MCP.

<AccordionGroup>
  <Accordion title="Comportamiento importante">
    - estos comandos solo leen o escriben la configuración de OpenClaw
    - `status`, `list`, `show`, `doctor` sin `--probe`, `set`, `configure`, `tools`, `logout`, `reload` y `unset` no se conectan al servidor MCP de destino
    - `login` realiza el flujo de red de OAuth de MCP para el servidor HTTP configurado y guarda las credenciales locales resultantes
    - `status --verbose` muestra indicaciones resueltas sobre transporte, autenticación, tiempo de espera, filtros y llamadas paralelas a herramientas sin conectarse
    - `doctor` comprueba las definiciones guardadas para detectar problemas de configuración local, como comandos stdio ausentes, directorios de trabajo no válidos, archivos TLS ausentes, servidores desactivados, valores confidenciales literales en encabezados o variables de entorno y autorizaciones OAuth incompletas
    - `doctor --probe` añade la misma prueba de conexión en vivo que `probe` después de superar las comprobaciones estáticas
    - `probe` se conecta al servidor seleccionado o a todos los servidores configurados, enumera las herramientas e informa de las capacidades y los diagnósticos
    - `add` crea una definición a partir de marcas y realiza una prueba antes de guardarla, salvo que se establezca `--no-probe` o sea necesario autorizar OAuth primero
    - los adaptadores de entornos de ejecución deciden qué formatos de transporte admiten realmente durante la ejecución
    - `enabled: false` mantiene un servidor guardado, pero lo excluye de la detección del entorno de ejecución integrado
    - `requestTimeoutMs` y `connectionTimeoutMs` establecen los tiempos de espera de las solicitudes y conexiones de cada servidor en milisegundos
    - `supportsParallelToolCalls: true` marca los servidores a los que los adaptadores pueden llamar de forma simultánea
    - los servidores HTTP pueden usar encabezados estáticos, inicio de sesión mediante OAuth, control de verificación TLS y rutas de claves y certificados mTLS
    - OpenClaw integrado expone las herramientas MCP configuradas en los perfiles de herramientas normales `coding` y `messaging`; `minimal` sigue ocultándolas y `tools.deny: ["bundle-mcp"]` las desactiva explícitamente
    - los valores `toolFilter.include` y `toolFilter.exclude` de cada servidor filtran las herramientas MCP detectadas antes de que se conviertan en herramientas de OpenClaw
    - los servidores que anuncian recursos o indicaciones también exponen herramientas auxiliares para enumerar o leer recursos y para enumerar u obtener indicaciones; estos nombres auxiliares generados (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) usan el mismo filtro de inclusión y exclusión
    - los cambios dinámicos en la lista de herramientas MCP invalidan el catálogo almacenado en caché para esa sesión; la siguiente detección o uso lo actualiza desde el servidor
    - los fallos repetidos de solicitudes de herramientas o del protocolo MCP ponen en pausa brevemente ese servidor para que un servidor averiado no consuma todo el turno
    - los entornos de ejecución MCP incluidos y limitados a una sesión se eliminan después de 10 minutos de inactividad, y las ejecuciones integradas de una sola vez los limpian al finalizar

  </Accordion>
</AccordionGroup>

Los adaptadores de entornos de ejecución pueden normalizar este registro compartido al formato que espera su cliente posterior. Por ejemplo, OpenClaw integrado consume directamente los valores `transport` de OpenClaw, mientras que Claude Code y Gemini reciben valores `type` nativos de la CLI, como `http`, `sse` o `stdio`.

Codex app-server también respeta un bloque opcional `codex` en cada servidor. Estos son
metadatos de proyección de OpenClaw únicamente para hilos de Codex app-server; no
cambian las sesiones ACP, la configuración del entorno genérico de Codex ni otros adaptadores de entornos de ejecución.
Se debe usar un valor no vacío de `codex.agents` para proyectar un servidor únicamente en identificadores
de agentes de OpenClaw específicos. Las listas de agentes vacías, en blanco o no válidas se rechazan durante la validación
de la configuración y la ruta de proyección del entorno de ejecución las omite, en lugar de convertirlas
en globales. Se debe usar `codex.defaultToolsApprovalMode` (`auto`, `prompt` o `approve`)
para emitir el valor nativo `default_tools_approval_mode` de Codex para un servidor de confianza.
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

- `list` ordena los nombres de los servidores.
- `show` sin un nombre muestra el objeto completo del servidor MCP configurado.
- `status` clasifica los transportes configurados sin conectarse. `--verbose` incluye detalles resueltos de inicio, tiempo de espera, OAuth, filtros y llamadas paralelas, incluso cuando los tokens OAuth almacenados requieren autorización adicional. Los argumentos stdio que contienen credenciales se ocultan en la salida de texto y JSON.
- `doctor` realiza comprobaciones estáticas sin conectarse. Se debe añadir `--probe` cuando el comando también deba verificar que los servidores activados puedan conectarse.
- `probe` se conecta e informa del número de herramientas, la compatibilidad con recursos e indicaciones, la compatibilidad con cambios en la lista y los diagnósticos.
- `add` acepta marcas de stdio como `--command`, `--arg`, `--env` y `--cwd`, o marcas de HTTP como `--url`, `--transport`, `--header`, `--auth oauth`, además de marcas de TLS, tiempo de espera y selección de herramientas.
- `set` espera un valor de objeto JSON en la línea de comandos.
- `configure` actualiza la activación, los filtros de herramientas, los tiempos de espera, OAuth, TLS y las indicaciones de llamadas paralelas a herramientas sin reemplazar toda la definición del servidor. Se debe añadir `--probe` para verificar el servidor actualizado antes de guardarlo.
- `tools` actualiza los filtros de herramientas de cada servidor. Las entradas de inclusión y exclusión son nombres de herramientas MCP y patrones glob sencillos `*`.
- `login` ejecuta el flujo de OAuth para los servidores HTTP configurados con `auth: "oauth"`. La primera ejecución muestra una URL de autorización; se debe volver a ejecutar con `--code` después de la aprobación.
- `logout` borra las credenciales OAuth almacenadas del servidor especificado sin eliminar la definición guardada del servidor.
- `reload` elimina los entornos de ejecución MCP almacenados en caché dentro del proceso únicamente para el proceso actual de la CLI. Los procesos del Gateway o de agentes que se ejecuten en otro proceso seguirán necesitando su propia ruta de recarga o reinicio.
- Se debe usar `transport: "streamable-http"` para servidores MCP con Streamable HTTP. `openclaw mcp set` también normaliza el valor `type: "http"` nativo de la CLI al mismo formato de configuración canónico por compatibilidad.
- `unset` falla si el servidor especificado no existe.

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

Estos ejemplos solo guardan definiciones de servidores. Ejecuta `openclaw mcp doctor --probe` después para comprobar que el servidor se inicia y expone herramientas.

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

    Limita los servidores del sistema de archivos al árbol de directorios más pequeño que el agente deba leer o editar.

  </Tab>
  <Tab title="Memoria">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Usa un filtro de herramientas si el servidor expone herramientas de escritura que no deberían estar disponibles para los agentes normales.

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

    Usa OAuth cuando el servidor remoto lo admita. Si el servidor requiere cabeceras estáticas, evita confirmar tokens de portador literales en el repositorio.

  </Tab>
  <Tab title="Escritorio/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Los servidores de control directo del escritorio heredan los permisos del proceso que inician. Usa filtros de herramientas restringidos y solicitudes de permisos del sistema operativo.

  </Tab>
</Tabs>

### Formatos de salida JSON

Usa `--json` para scripts y paneles. Los conjuntos de campos pueden ampliarse con el tiempo, por lo que los consumidores deben ignorar las claves desconocidas.

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
            "requiresAuthorization": false,
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
              "message": "Las credenciales de OAuth no están autorizadas; ejecuta openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` termina con un código distinto de cero cuando cualquier servidor habilitado que se haya comprobado presenta un problema de nivel `error`. Los problemas `warning` y `info` se notifican, pero por sí solos no provocan que el comando falle.

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

    `probe --json` abre una sesión activa de cliente MCP e imprime su resultado directamente; a diferencia de `status`/`doctor`, la salida no tiene un campo `path` de nivel superior. Las claves `resources` y `prompts` solo están presentes cuando el servidor anuncia realmente esa capacidad (un servidor sin indicaciones omite la clave `prompts` en lugar de informar `false`). Usa `probe` para demostrar la accesibilidad y las capacidades, no para auditar la configuración estática.

  </Accordion>
</AccordionGroup>

Ejemplo de formato de configuración:

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
        "requestTimeoutMs": 20000,
        "connectionTimeoutMs": 5000,
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

Inicia un proceso secundario local y se comunica mediante stdin/stdout.

| Campo                      | Descripción                       |
| -------------------------- | --------------------------------- |
| `command`                  | Ejecutable que se iniciará (obligatorio)    |
| `args`                     | Matriz de argumentos de la línea de comandos   |
| `env`                      | Variables de entorno adicionales       |
| `cwd` / `workingDirectory` | Directorio de trabajo del proceso |

<Warning>
**Filtro de seguridad del entorno de stdio**

OpenClaw rechaza las claves de entorno de inicio del intérprete, secuestro del cargador e inicio del intérprete de comandos antes de iniciar un servidor MCP stdio, incluso si aparecen en el bloque `env` de un servidor. Para ello, utiliza la misma política de seguridad del entorno del host que otros procesos iniciados por OpenClaw: bloquea los enlaces de inicio de intérpretes conocidos (por ejemplo, `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), los prefijos de inyección de funciones y bibliotecas compartidas (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) y variables similares de control del entorno de ejecución. Durante el inicio, estas se descartan silenciosamente y se registra una advertencia para impedir que inyecten un preámbulo implícito, sustituyan el intérprete, habiliten un depurador o secuestren el enlazador dinámico contra el proceso stdio. Una lista explícita de elementos permitidos mantiene utilizables las variables de entorno habituales de credenciales MCP (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), además de las variables de entorno habituales del proxy y específicas del servidor (`HTTP_PROXY`, `*_API_KEY` personalizadas, etc.). Otras claves `AWS_*`, como `AWS_CONFIG_FILE` y `AWS_SHARED_CREDENTIALS_FILE`, permanecen bloqueadas porque apuntan a archivos de credenciales en lugar de contener directamente un valor de credencial.

Si el servidor MCP necesita realmente una de las variables bloqueadas, establécela en el proceso del host del Gateway en lugar de hacerlo bajo el bloque `env` del servidor stdio.
</Warning>

### Transporte SSE/HTTP

Se conecta a un servidor MCP remoto mediante eventos enviados por el servidor a través de HTTP.

| Campo                       | Descripción                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| `url`                       | URL HTTP o HTTPS del servidor remoto (obligatoria)                |
| `headers`                   | Mapa opcional de pares clave-valor de cabeceras HTTP (por ejemplo, tokens de autenticación) |
| `connectionTimeoutMs`       | Tiempo de espera de conexión por servidor en ms (opcional)                   |
| `requestTimeoutMs`          | Tiempo de espera de solicitudes MCP por servidor en milisegundos                   |
| `auth: "oauth"`             | Usa las credenciales OAuth de MCP guardadas mediante `openclaw mcp login`          |
| `sslVerify`                 | Establece el valor en falso solo para puntos de conexión HTTPS privados que sean explícitamente de confianza    |
| `clientCert` / `clientKey`  | Rutas del certificado y la clave del cliente mTLS                            |
| `supportsParallelToolCalls` | Indica que las llamadas simultáneas son seguras para este servidor              |

Ejemplo:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "requestTimeoutMs": 20000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Los valores confidenciales de `url` (información de usuario) y `headers` se ocultan en los registros y en la salida de estado. `openclaw mcp doctor` advierte cuando las entradas `headers` o `env` que parecen confidenciales contienen valores literales, para que los operadores puedan retirar esos valores de la configuración confirmada en el repositorio.

### Flujo de trabajo de OAuth

OAuth está destinado a servidores MCP HTTP que anuncian el flujo OAuth de MCP. Las cabeceras estáticas `Authorization` se ignoran para un servidor mientras `auth: "oauth"` está habilitado. Las credenciales guardadas mediante `openclaw mcp login` funcionan con MCP integrado, los ejecutores de la CLI y el servidor de aplicaciones local de Codex.

Las sesiones OAuth nativas de MCP se almacenan en la base de datos SQLite compartida, accesible solo para el propietario, ubicada en `<state-dir>/state/openclaw.sqlite` (`mcp_oauth_stores`). La fila puede contener tokens de acceso y actualización, secretos de registro dinámico del cliente, metadatos de detección y el verificador PKCE temporal. La actualización, el inicio de sesión y el cierre de sesión utilizan el mismo arrendamiento de SQLite, por lo que los procesos paralelos de OpenClaw no pueden consumir un mismo token de actualización ni restaurar una sesión cerrada.

Las actualizaciones desde el almacén retirado `<state-dir>/mcp-oauth/*.json` solo las gestiona `openclaw doctor --fix`. El código del entorno de ejecución nunca lee, escribe ni recurre a esos archivos.

Hasta que las credenciales estén disponibles, OpenClaw omite únicamente ese servidor MCP del entorno de ejecución del agente, en lugar de provocar un error en el turno del agente. El operador, o un agente con acceso al intérprete de comandos, puede ejecutar entonces `openclaw mcp login <name>` y usar el servidor en un turno posterior.

Si un servidor rechaza un token con `insufficient_scope`, OpenClaw conserva el ámbito solicitado y pide `openclaw mcp login <name>` en lugar de repetir una actualización que no puede conceder un ámbito nuevo. Ese inicio de sesión inicia una nueva solicitud de autorización y conserva el token anterior hasta que se guarden las credenciales de sustitución.

Cuando un servicio MCP remoto ya cuenta con el respaldo de un perfil de autenticación independiente de OpenClaw capaz de actualizarse, se puede establecer opcionalmente `oauth.authProfileId`. OpenClaw actualiza cualquiera de las fuentes de credenciales antes de la proyección del entorno de ejecución y solo transmite el token de acceso vigente al cliente MCP descendente.

<Steps>
  <Step title="Guardar el servidor">
    Añade o actualiza el servidor con `auth: "oauth"` y cualquier metadato OAuth opcional.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Para un portador respaldado por un perfil de autenticación, guarde la vinculación del perfil:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Iniciar sesión">
    Ejecute el inicio de sesión para crear la solicitud de autorización.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw muestra la URL de autorización y almacena temporalmente el estado del verificador de OAuth en SQLite compartido.

  </Step>
  <Step title="Finalizar con el código">
    Después de aprobar la solicitud en el navegador, devuelva el código recibido a OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Comprobar la autorización">
    Use el estado o el diagnóstico para confirmar que los tokens estén presentes y no requieran autorización adicional. Si el estado indica `authorization-required` o el diagnóstico solicita autorización adicional, vuelva a ejecutar `openclaw mcp login <name>`.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Borrar las credenciales">
    El cierre de sesión elimina las credenciales de OAuth almacenadas, pero conserva la definición guardada del servidor.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Si el proveedor rota los tokens o el estado de autorización se bloquea, ejecute `openclaw mcp logout <name>` y, a continuación, repita `login`. `logout` puede borrar las credenciales de un servidor HTTP guardado incluso después de que `auth: "oauth"` se haya eliminado de la configuración, siempre que el nombre y la URL del servidor sigan identificando la entrada del almacén de credenciales.

### Transporte HTTP con streaming

`streamable-http` es una opción de transporte adicional junto con `sse` y `stdio`. Utiliza streaming HTTP para la comunicación bidireccional con servidores MCP remotos.

| Campo                       | Descripción                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `url`                       | URL HTTP o HTTPS del servidor remoto (obligatoria)                                      |
| `transport`                 | Establézcalo en `"streamable-http"` para seleccionar este transporte; si se omite, OpenClaw utiliza `sse` |
| `headers`                   | Mapa opcional de pares clave-valor de cabeceras HTTP (por ejemplo, tokens de autenticación)                       |
| `connectionTimeoutMs`       | Tiempo de espera de conexión por servidor en ms (opcional)                                         |
| `requestTimeoutMs`          | Tiempo de espera de las solicitudes MCP por servidor en milisegundos                                         |
| `auth: "oauth"`             | Utiliza las credenciales de OAuth de MCP guardadas por `openclaw mcp login`                                |
| `sslVerify`                 | Establézcalo en falso únicamente para endpoints HTTPS privados de confianza explícita                          |
| `clientCert` / `clientKey`  | Rutas del certificado y la clave de cliente mTLS                                                  |
| `supportsParallelToolCalls` | Indica que las llamadas simultáneas son seguras para este servidor                                    |

La configuración de OpenClaw utiliza `transport: "streamable-http"` como grafía canónica. Los valores `type: "http"` de MCP nativos de la CLI se aceptan cuando se guardan mediante `openclaw mcp set` y `openclaw doctor --fix` los repara en la configuración existente, pero `transport` es lo que consume directamente OpenClaw integrado.

Ejemplo:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "requestTimeoutMs": 30000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Los comandos del registro no inician el puente de canales. Solo `probe` y `doctor --probe` abren una sesión activa del cliente MCP para comprobar que se puede acceder al servidor de destino.
</Note>

## Interfaz de control

La interfaz de control del navegador incluye una página específica de configuración de MCP en `/settings/mcp`; la ruta anterior `/mcp` se conserva como alias. La página muestra el número de servidores configurados, resúmenes de servidores habilitados, OAuth y filtros, filas de transporte por servidor, controles para habilitar o deshabilitar, comandos habituales de la CLI y un editor limitado a la sección de configuración `mcp`.

Utilice la página para realizar cambios operativos y consultar rápidamente el inventario. Utilice `openclaw mcp doctor --probe` o `openclaw mcp probe` cuando necesite una comprobación activa del servidor.

Flujo de trabajo del operador:

1. Abra la interfaz de control y seleccione **MCP**.
2. Revise las tarjetas de resumen de servidores totales, habilitados, con OAuth y filtrados.
3. Consulte en cada fila de servidor el transporte, la autenticación, el filtro, el tiempo de espera y las sugerencias de comandos.
4. Cambie el estado de habilitación cuando desee conservar una definición, pero excluirla de la detección en tiempo de ejecución.
5. Edite la sección de configuración `mcp` delimitada para realizar cambios estructurales, como añadir servidores, cabeceras, TLS, metadatos de OAuth o filtros de herramientas.
6. Seleccione **Save** para conservar solo la configuración o **Save & Publish** para aplicarla mediante la ruta de configuración del Gateway.
7. Ejecute `openclaw mcp doctor --probe` cuando necesite comprobar activamente que el servidor editado se inicia y enumera las herramientas.

Notas:

- los fragmentos de comandos escriben entre comillas los nombres de los servidores para que los nombres poco habituales se puedan copiar en un shell
- los valores mostrados con formato de URL se ocultan antes de su representación cuando contienen credenciales integradas
- la página no inicia por sí sola los transportes MCP
- los entornos de ejecución activos pueden requerir `openclaw mcp reload`, la publicación de la configuración del Gateway o el reinicio del proceso, según el proceso propietario de los clientes MCP

## Aplicaciones MCP

OpenClaw puede representar herramientas que implementen la [extensión MCP Apps](https://modelcontextprotocol.io/extensions/apps) estable. Las aplicaciones son opcionales porque su HTML procede del servidor MCP configurado y puede solicitar herramientas o recursos visibles para la aplicación desde ese mismo servidor.

Habilite el puente del host:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Reinicie el Gateway después de cambiar esta opción. Cuando está habilitada, OpenClaw inicia un agente de escucha HTTP(S) exclusivo del entorno aislado en el puerto del Gateway más uno (para el Gateway predeterminado, `18790`). La interfaz de control carga las aplicaciones desde ese origen independiente; el agente de escucha nunca sirve la interfaz de control, las rutas autenticadas del Gateway ni los datos de usuario.

Las conexiones directas al Gateway necesitan acceso a ambos puertos. Si un proxy inverso o un terminador TLS expone la interfaz de control, proporcione a las aplicaciones un origen público específico y redirija únicamente ese origen al agente de escucha del entorno aislado:

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

El origen del entorno aislado debe ser diferente del origen de la interfaz de control. No aloje en él otro contenido autenticado o confidencial.

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

- OpenClaw anuncia la extensión `io.modelcontextprotocol/ui` únicamente cuando las aplicaciones están habilitadas.
- Solo se representan los recursos `ui://` con el tipo MIME exacto `text/html;profile=mcp-app`.
- Los recursos de la interfaz de usuario tienen un límite de 2 MiB, se sitúan detrás de un proxy de iframe doble en un origen externo específico, se cargan en un origen interno opaco de la aplicación y están restringidos por una CSP derivada de los metadatos del recurso.
- Las herramientas exclusivas de las aplicaciones (`_meta.ui.visibility: ["app"]`) no aparecen en las listas de herramientas del modelo. Las aplicaciones solo pueden llamar a herramientas visibles para ellas en el servidor propietario que también cumplan la política efectiva de herramientas de OpenClaw para la ejecución que creó la vista.
- Los permisos de la aplicación vinculados al origen, como la cámara, el micrófono y la geolocalización, no se conceden mientras los documentos internos de la aplicación utilicen orígenes opacos para aislar las aplicaciones entre sí.
- El HTML de la aplicación, los argumentos completos de las herramientas y los resultados sin procesar permanecen en una concesión de vista en memoria limitada a diez minutos y no se escriben en disco ni se copian en los metadatos de vista previa de la transcripción. La transcripción almacena únicamente un descriptor acotado del servidor, la herramienta y el recurso, vinculado al ID original de la llamada a la herramienta. Después de reiniciar el Gateway, la interfaz de control puede verificar ese descriptor mediante la transcripción de la sesión autenticada y volver a obtener el recurso `ui://`; las vistas reconstruidas son de solo lectura hasta que una nueva ejecución establezca los permisos actuales de las herramientas.
- En las conversaciones de canales, la última vista de aplicación completada correctamente de un turno añade una acción de tipo **Abrir aplicación** a la respuesta final del asistente. Los mensajes directos de Telegram utilizan un botón nativo de Mini App; Slack y Discord representan la misma acción portátil como enlace. Los demás canales conservan el texto original de la respuesta y añaden un enlace HTTPS comprensible.
- Los enlaces de inicio de los canales solo están disponibles cuando la exposición de Tailscale del Gateway ha preparado un origen HTTPS publicado. `gateway.tailscale.mode: "serve"` solo es accesible desde la tailnet; `"funnel"` es accesible desde la Internet pública. Un Funnel administrado externamente y conservado por `gateway.tailscale.preserveFunnel` también se considera accesible desde Internet. Consulte [Tailscale](/es/gateway/tailscale).
- Los tickets de inicio son opacos, se acuñan únicamente al materializar la respuesta final del canal y caducan después de dos minutos como máximo o cuando caduca la concesión de la vista subyacente, lo que ocurra primero. La URL no contiene credenciales de portador del Gateway, claves de sesión, metadatos de la vista, HTML de la aplicación, entradas de herramientas ni resultados de herramientas.
- Si no hay disponible un origen publicado o capacidad para tickets, la vista o el ticket han caducado, o el transporte no puede representar controles nativos, el texto original del asistente sigue estando disponible. La interfaz de control conserva su lienzo de aplicación integrado y no recibe una acción de inicio duplicada.
- `openclaw security audit` muestra una advertencia mientras el puente está habilitado. Deshabilítelo con `openclaw config set mcp.apps.enabled false --strict-json` cuando no sea necesario.

## Límites actuales

Esta página documenta el puente tal como se distribuye actualmente.

Límites actuales:

- la detección de conversaciones depende de los metadatos existentes de las rutas de sesión del Gateway
- no existe ningún protocolo push genérico más allá del adaptador específico de Claude
- todavía no hay herramientas para editar mensajes ni añadir reacciones
- el transporte HTTP/SSE/streamable-http se conecta a un único servidor remoto; todavía no hay upstream multiplexado
- `permissions_list_open` solo incluye las aprobaciones observadas mientras el puente está conectado

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Plugins](/es/cli/plugins)
