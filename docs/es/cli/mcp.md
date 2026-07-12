---
read_when:
    - Conectar Codex, Claude Code u otro cliente MCP a canales respaldados por OpenClaw
    - Ejecutando `openclaw mcp serve`
    - Administración de las definiciones de servidores MCP guardadas por OpenClaw
sidebarTitle: MCP
summary: Expón las conversaciones de los canales de OpenClaw mediante MCP y gestiona las definiciones guardadas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-07-12T14:23:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5753ffb716794edcdfa2c3cdd370bd33173b6d30785f135e84933dcd628bbe54
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` tiene dos funciones:

- ejecutar OpenClaw como servidor MCP con `openclaw mcp serve`
- gestionar las definiciones de servidores MCP salientes administradas por OpenClaw con `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` y `unset`

Con `serve`, OpenClaw actúa como servidor MCP. Con los demás subcomandos, OpenClaw actúa como registro del lado del cliente MCP para servidores que sus propios entornos de ejecución pueden consumir posteriormente.

<Note>
  `list`, `show`, `set` y `unset` solo leen y escriben entradas `mcp.servers` administradas por OpenClaw en la configuración de OpenClaw. No incluyen los servidores de mcporter de `config/mcporter.json`; use `mcporter list` para ese registro.
</Note>

Use [`openclaw acp`](/es/cli/acp) cuando OpenClaw deba alojar por sí mismo una sesión de un entorno de programación y enrutar ese entorno de ejecución mediante ACP.

## Elegir la ruta MCP adecuada

| Objetivo                                                                | Usar                                                                  | Motivo                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Permitir que un cliente MCP externo lea o envíe conversaciones de canales de OpenClaw | `openclaw mcp serve`                                                 | OpenClaw es el servidor MCP y expone conversaciones respaldadas por el Gateway mediante stdio.                                 |
| Guardar servidores MCP de terceros para ejecuciones de agentes administradas por OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw es el registro del lado del cliente MCP y posteriormente proyecta esos servidores en los entornos de ejecución compatibles.               |
| Comprobar un servidor guardado sin ejecutar un turno del agente                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` y `doctor` inspeccionan la configuración; `probe` abre una conexión MCP activa y enumera las capacidades.               |
| Editar la configuración de MCP desde un navegador                                      | Interfaz de control `/settings/mcp` (alias `/mcp`)                            | La página muestra el inventario, la habilitación, resúmenes de OAuth y filtros, sugerencias de comandos y un editor de `mcp` con alcance limitado.         |
| Proporcionar a Codex app-server un servidor MCP nativo con alcance limitado                    | `mcp.servers.<name>.codex`                                           | El bloque `codex` solo afecta a la proyección de hilos de Codex app-server y se elimina antes de entregar la configuración nativa. |
| Ejecutar sesiones de entornos alojadas mediante ACP                                     | [`openclaw acp`](/es/cli/acp) y [Agentes ACP](/es/tools/acp-agents-setup) | El modo puente de ACP no acepta la inyección de servidores MCP por sesión; configure en su lugar puentes del Gateway o de plugins.     |

<Tip>
Si no sabe con certeza qué ruta necesita, comience con `openclaw mcp status --verbose`. Muestra lo que OpenClaw ha guardado sin iniciar ningún servidor MCP.
</Tip>

## OpenClaw como servidor MCP

Esta es la ruta `openclaw mcp serve`.

### Cuándo usar serve

Use `openclaw mcp serve` cuando:

- Codex, Claude Code u otro cliente MCP deba comunicarse directamente con conversaciones de canales respaldadas por OpenClaw
- ya disponga de un Gateway de OpenClaw local o remoto con sesiones enrutadas
- quiera un único servidor MCP que funcione con los distintos backends de canales de OpenClaw, en lugar de ejecutar puentes independientes para cada canal

Use [`openclaw acp`](/es/cli/acp) en su lugar cuando OpenClaw deba alojar por sí mismo el entorno de ejecución de programación y mantener la sesión del agente dentro de OpenClaw.

### Cómo funciona

`openclaw mcp serve` inicia un servidor MCP mediante stdio. El cliente MCP controla ese proceso. Mientras el cliente mantenga abierta la sesión stdio, el puente se conecta mediante WebSocket a un Gateway de OpenClaw local o remoto y expone las conversaciones de canales enrutadas mediante MCP.

<Steps>
  <Step title="El cliente inicia el puente">
    El cliente MCP inicia `openclaw mcp serve`.
  </Step>
  <Step title="El puente se conecta al Gateway">
    El puente se conecta al Gateway de OpenClaw mediante WebSocket.
  </Step>
  <Step title="Las sesiones se convierten en conversaciones MCP">
    Las sesiones enrutadas se convierten en conversaciones MCP y en herramientas de transcripción e historial.
  </Step>
  <Step title="Los eventos en directo se ponen en cola">
    Los eventos en directo se ponen en cola en la memoria mientras el puente permanece conectado.
  </Step>
  <Step title="Notificaciones push opcionales de Claude">
    Si está habilitado el modo de canal de Claude, la misma sesión también puede recibir notificaciones push específicas de Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportamiento importante">
    - el estado de la cola en directo comienza cuando se conecta el puente
    - el historial de transcripciones anterior se lee con `messages_read`
    - las notificaciones push de Claude solo existen mientras la sesión MCP está activa
    - cuando el cliente se desconecta, el puente finaliza y se pierde la cola en directo
    - los puntos de entrada de agente de una sola ejecución, como `openclaw agent` y `openclaw infer model run`, finalizan cualquier entorno de ejecución MCP incluido que abran cuando se completa la respuesta, por lo que las ejecuciones repetidas mediante scripts no acumulan procesos secundarios MCP de stdio
    - los servidores MCP de stdio iniciados por OpenClaw, ya sean incluidos o configurados por el usuario, se cierran como un árbol de procesos al apagarse, por lo que los subprocesos secundarios iniciados por el servidor no permanecen activos después de que finalice el cliente stdio principal
    - al eliminar o restablecer una sesión, se liberan los clientes MCP de esa sesión mediante la ruta compartida de limpieza del entorno de ejecución, por lo que no quedan conexiones stdio persistentes vinculadas a una sesión eliminada

  </Accordion>
</AccordionGroup>

### Elegir un modo de cliente

<Tabs>
  <Tab title="Clientes MCP genéricos">
    Solo herramientas MCP estándar. Use `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` y las herramientas de aprobación.
  </Tab>
  <Tab title="Claude Code">
    Herramientas MCP estándar más el adaptador de canal específico de Claude. Habilite `--claude-channel-mode on` o mantenga el valor predeterminado `auto`.
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

Esto proporciona a los clientes MCP un único lugar donde:

- enumerar conversaciones enrutadas recientes
- leer el historial reciente de transcripciones
- esperar nuevos eventos entrantes
- devolver una respuesta mediante la misma ruta
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

    Filtros: `limit` (máximo 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Devuelve una conversación mediante `session_key` usando una consulta directa de sesión al Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Lee los mensajes recientes de la transcripción de una conversación respaldada por una sesión. El valor predeterminado de `limit` es 20; el máximo es 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrae los bloques de contenido que no son de texto de un mensaje de la transcripción. Esta es una vista de metadatos del contenido de la transcripción, no un almacén independiente y persistente de blobs de archivos adjuntos.
  </Accordion>
  <Accordion title="events_poll">
    Lee los eventos en directo en cola desde un cursor numérico. El máximo de `limit` es 200.
  </Accordion>
  <Accordion title="events_wait">
    Realiza una consulta de larga duración hasta que llega el siguiente evento en cola que coincida o vence el tiempo de espera (valor predeterminado de 30s, máximo de 300s).

    Use esta opción cuando un cliente MCP genérico necesite una entrega casi en tiempo real sin un protocolo push específico de Claude.

  </Accordion>
  <Accordion title="messages_send">
    Envía texto mediante la misma ruta ya registrada en la sesión.

    Comportamiento actual:

    - requiere una ruta de conversación existente
    - utiliza el canal, el destinatario, el identificador de cuenta y el identificador del hilo de la sesión
    - solo envía texto

  </Accordion>
  <Accordion title="permissions_list_open">
    Enumera las solicitudes de aprobación de ejecución o plugins pendientes que el puente ha observado desde que se conectó al Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Resuelve una solicitud de aprobación de ejecución o plugins pendiente con:

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
- el historial pendiente persistente debe leerse con `messages_read`

</Warning>

### Notificaciones de canal de Claude

El puente también puede exponer notificaciones de canal específicas de Claude. Este es el equivalente en OpenClaw de un adaptador de canal de Claude Code: las herramientas MCP estándar siguen disponibles, pero los mensajes entrantes en directo también pueden llegar como notificaciones MCP específicas de Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: solo herramientas MCP estándar.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: habilita las notificaciones de canal de Claude.
  </Tab>
  <Tab title="auto (predeterminado)">
    `--claude-channel-mode auto`: valor predeterminado actual; el comportamiento del puente es el mismo que con `on`.
  </Tab>
</Tabs>

Cuando el modo de canal de Claude está habilitado, el servidor anuncia capacidades experimentales de Claude y puede emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamiento actual del puente:

- los mensajes entrantes `user` de la transcripción se reenvían como `notifications/claude/channel`
- las solicitudes de permisos de Claude recibidas mediante MCP se registran en memoria
- si el propietario del comando en la conversación vinculada envía posteriormente `yes <id>` o `no <id>` (`<id>` es el identificador de solicitud de 5 letras, sin incluir `l`), el puente lo convierte en `notifications/claude/channel/permission`
- estas notificaciones solo existen durante la sesión en directo; si el cliente MCP se desconecta, no hay ningún destino para las notificaciones push

Este comportamiento es específico del cliente de forma intencionada. Los clientes MCP genéricos deben utilizar las herramientas de consulta estándar.

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

Para la mayoría de los clientes MCP genéricos, comience con el conjunto estándar de herramientas e ignore el modo de Claude. Active el modo de Claude solo para los clientes que comprendan realmente los métodos de notificación específicos de Claude.

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
  Modo de notificaciones de Claude. Valor predeterminado: `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Registros detallados en stderr.
</ParamField>

<Tip>
Cuando sea posible, se recomienda usar `--token-file` o `--password-file` en lugar de secretos en línea.
</Tip>

### Límite de seguridad y confianza

El puente no crea rutas. Solo expone las conversaciones que el Gateway ya sabe cómo enrutar.

Esto significa lo siguiente:

- las listas de remitentes permitidos, el emparejamiento y la confianza a nivel de canal siguen perteneciendo a la configuración subyacente del canal de OpenClaw
- `messages_send` solo puede responder mediante una ruta almacenada existente
- el estado de aprobación solo está activo y en memoria durante la sesión actual del puente
- la autenticación del puente debe usar los mismos controles de token o contraseña del Gateway en los que se confiaría para cualquier otro cliente remoto del Gateway

Si una conversación no aparece en `conversations_list`, la causa habitual no es la configuración de MCP. Se debe a que faltan metadatos de ruta o están incompletos en la sesión subyacente del Gateway.

### Pruebas

OpenClaw incluye una prueba de humo determinista en Docker para este puente:

```bash
pnpm test:docker:mcp-channels
```

Esta prueba de humo ejecuta un único contenedor: inicializa el estado de las conversaciones, inicia el Gateway y, a continuación, genera `openclaw mcp serve` como proceso secundario stdio y lo controla como cliente MCP. Verifica el descubrimiento de conversaciones, la lectura de transcripciones, la lectura de metadatos de archivos adjuntos, el comportamiento de la cola de eventos en tiempo real y las notificaciones de canales y permisos al estilo de Claude mediante el puente MCP stdio real. El enrutamiento de envíos salientes (`messages_send` reutilizando la ruta almacenada de la conversación) se cubre por separado mediante pruebas unitarias en `src/mcp/channel-server.test.ts`.

Esta es la forma más rápida de demostrar que el puente funciona sin conectar una cuenta real de Telegram, Discord o iMessage a la ejecución de pruebas.

Para obtener un contexto más amplio sobre las pruebas, consulte [Pruebas](/es/help/testing).

### Solución de problemas

<AccordionGroup>
  <Accordion title="No se devolvieron conversaciones">
    Normalmente significa que la sesión del Gateway aún no se puede enrutar. Confirme que la sesión subyacente tenga almacenados el canal o proveedor, el destinatario y los metadatos opcionales de ruta de la cuenta o del hilo.
  </Accordion>
  <Accordion title="events_poll o events_wait omite mensajes anteriores">
    Es el comportamiento esperado. La cola en tiempo real comienza cuando se conecta el puente. Lea el historial anterior de la transcripción con `messages_read`.
  </Accordion>
  <Accordion title="Las notificaciones de Claude no aparecen">
    Compruebe todo lo siguiente:

    - el cliente mantuvo abierta la sesión MCP stdio
    - `--claude-channel-mode` está establecido en `on` o `auto`
    - el cliente comprende realmente los métodos de notificación específicos de Claude
    - el mensaje entrante se produjo después de que se conectara el puente

  </Accordion>
  <Accordion title="Faltan aprobaciones">
    `permissions_list_open` solo muestra las solicitudes de aprobación observadas mientras el puente estaba conectado. No es una API de historial de aprobaciones persistente.
  </Accordion>
</AccordionGroup>

## OpenClaw como registro de clientes MCP

Esta es la ruta de `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` y `unset`.

Estos comandos no exponen OpenClaw mediante MCP. Administran las definiciones de servidores MCP gestionadas por OpenClaw en `mcp.servers`, dentro de la configuración de OpenClaw. No leen servidores de mcporter desde `config/mcporter.json`.

Estas definiciones guardadas están destinadas a entornos de ejecución que OpenClaw inicia o configura posteriormente, como OpenClaw integrado y otros adaptadores de entorno de ejecución. OpenClaw almacena las definiciones de forma centralizada para que esos entornos de ejecución no necesiten mantener sus propias listas duplicadas de servidores MCP.

<AccordionGroup>
  <Accordion title="Comportamiento importante">
    - estos comandos solo leen o escriben la configuración de OpenClaw
    - `status`, `list`, `show`, `doctor` sin `--probe`, `set`, `configure`, `tools`, `logout`, `reload` y `unset` no se conectan al servidor MCP de destino
    - `login` ejecuta el flujo de red OAuth de MCP para el servidor HTTP configurado y guarda las credenciales locales resultantes
    - `status --verbose` muestra el transporte resuelto y las indicaciones de autenticación, tiempos de espera, filtros y llamadas paralelas a herramientas sin conectarse
    - `doctor` comprueba si las definiciones guardadas presentan problemas de configuración local, como comandos stdio ausentes, directorios de trabajo no válidos, archivos TLS ausentes, servidores deshabilitados, valores confidenciales literales de encabezados o variables de entorno y autorizaciones OAuth incompletas
    - `doctor --probe` añade la misma prueba de conexión en tiempo real que `probe` después de superar las comprobaciones estáticas
    - `probe` se conecta al servidor seleccionado o a todos los servidores configurados, enumera las herramientas e informa de las capacidades y los diagnósticos
    - `add` crea una definición a partir de indicadores y realiza una prueba antes de guardarla, salvo que se establezca `--no-probe` o que primero sea necesaria una autorización OAuth
    - los adaptadores de entorno de ejecución deciden qué formatos de transporte admiten realmente durante la ejecución
    - `enabled: false` mantiene guardado un servidor, pero lo excluye del descubrimiento del entorno de ejecución integrado
    - `timeout` y `connectTimeout` establecen, en segundos, los tiempos de espera de las solicitudes y conexiones de cada servidor
    - `supportsParallelToolCalls: true` marca los servidores a los que los adaptadores pueden llamar simultáneamente
    - los servidores HTTP pueden usar encabezados estáticos, inicio de sesión OAuth, control de verificación TLS y rutas de certificados y claves mTLS
    - OpenClaw integrado expone las herramientas MCP configuradas en los perfiles de herramientas normales `coding` y `messaging`; `minimal` sigue ocultándolas y `tools.deny: ["bundle-mcp"]` las deshabilita explícitamente
    - `toolFilter.include` y `toolFilter.exclude` de cada servidor filtran las herramientas MCP descubiertas antes de que se conviertan en herramientas de OpenClaw
    - los servidores que anuncian recursos o prompts también exponen herramientas auxiliares para enumerar o leer recursos y enumerar u obtener prompts; los nombres auxiliares generados (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) usan el mismo filtro de inclusión y exclusión
    - los cambios dinámicos en la lista de herramientas MCP invalidan el catálogo almacenado en caché para esa sesión; el siguiente descubrimiento o uso lo actualiza desde el servidor
    - los fallos repetidos en solicitudes de herramientas o en el protocolo MCP ponen en pausa brevemente ese servidor para que un servidor averiado no consuma todo el turno
    - los entornos de ejecución MCP incluidos y limitados a la sesión se eliminan después de `mcp.sessionIdleTtlMs` milisegundos de inactividad (valor predeterminado: 10 minutos; establezca `0` para deshabilitarlo), y las ejecuciones integradas de una sola vez los limpian al finalizar

  </Accordion>
</AccordionGroup>

Los adaptadores de entorno de ejecución pueden normalizar este registro compartido al formato que espera su cliente descendente. Por ejemplo, OpenClaw integrado consume directamente los valores `transport` de OpenClaw, mientras que Claude Code y Gemini reciben valores `type` nativos de la CLI, como `http`, `sse` o `stdio`.

Codex app-server también respeta un bloque `codex` opcional en cada servidor. Estos son
metadatos de proyección de OpenClaw exclusivamente para hilos de Codex app-server; no
cambian las sesiones ACP, la configuración genérica del entorno de Codex ni otros adaptadores de entorno de ejecución.
Use `codex.agents` no vacío para proyectar un servidor únicamente en identificadores específicos de agentes de OpenClaw.
Las listas de agentes vacías, en blanco o no válidas se rechazan durante la validación de la configuración
y se omiten en la ruta de proyección del entorno de ejecución, en lugar de convertirse
en globales. Use `codex.defaultToolsApprovalMode` (`auto`, `prompt` o `approve`)
para emitir el valor nativo `default_tools_approval_mode` de Codex para un servidor de confianza.
OpenClaw elimina los metadatos `codex` antes de entregar la configuración nativa
`mcp_servers` a Codex.

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
- `show` sin un nombre muestra el objeto completo de servidores MCP configurados.
- `status` clasifica los transportes configurados sin conectarse. `--verbose` incluye detalles resueltos sobre el inicio, los tiempos de espera, OAuth, los filtros y las llamadas paralelas.
- `doctor` realiza comprobaciones estáticas sin conectarse. Añada `--probe` cuando el comando también deba verificar que los servidores habilitados puedan conectarse.
- `probe` se conecta e informa de la cantidad de herramientas, la compatibilidad con recursos y prompts, la compatibilidad con cambios en la lista y los diagnósticos.
- `add` acepta indicadores stdio como `--command`, `--arg`, `--env` y `--cwd`, o indicadores HTTP como `--url`, `--transport`, `--header`, `--auth oauth`, TLS, tiempos de espera y selección de herramientas.
- `set` espera un valor de objeto JSON en la línea de comandos.
- `configure` actualiza la habilitación, los filtros de herramientas, los tiempos de espera, OAuth, TLS y las indicaciones de llamadas paralelas a herramientas sin reemplazar toda la definición del servidor. Añada `--probe` para verificar el servidor actualizado antes de guardarlo.
- `tools` actualiza los filtros de herramientas de cada servidor. Las entradas de inclusión y exclusión son nombres de herramientas MCP y patrones glob simples con `*`.
- `login` ejecuta el flujo OAuth para servidores HTTP configurados con `auth: "oauth"`. La primera ejecución muestra una URL de autorización; vuelva a ejecutarlo con `--code` después de la aprobación.
- `logout` borra las credenciales OAuth almacenadas del servidor indicado sin eliminar la definición guardada del servidor.
- `reload` descarta los entornos de ejecución MCP en proceso almacenados en caché únicamente para el proceso actual de la CLI. Los procesos del Gateway o de agentes que se ejecuten en otro proceso siguen necesitando su propia ruta de recarga o reinicio.
- Use `transport: "streamable-http"` para servidores MCP de Streamable HTTP. `openclaw mcp set` también normaliza el valor `type: "http"` nativo de la CLI al mismo formato de configuración canónico por compatibilidad.
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

### Recetas comunes para servidores

Estos ejemplos solo guardan definiciones de servidores. Ejecute después `openclaw mcp doctor --probe` para demostrar que el servidor se inicia y expone herramientas.

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

    Limite los servidores de sistemas de archivos al árbol de directorios más pequeño que el agente deba leer o editar.

  </Tab>
  <Tab title="Memoria">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Use un filtro de herramientas si el servidor expone herramientas de escritura que no deban estar disponibles para los agentes normales.

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

    `doctor` comprueba que `cwd` exista y que el comando pueda resolverse desde el entorno configurado.

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

    Use OAuth cuando el servidor remoto lo admita. Si el servidor requiere encabezados estáticos, evite confirmar en el repositorio tokens de portador literales.

  </Tab>
  <Tab title="Escritorio/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Los servidores de control directo del escritorio heredan los permisos del proceso que inician. Use filtros de herramientas restrictivos y solicitudes de permisos del sistema operativo.

  </Tab>
</Tabs>

### Formatos de salida JSON

Use `--json` para scripts y paneles. Los conjuntos de campos pueden ampliarse con el tiempo, por lo que los consumidores deben ignorar las claves desconocidas.

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

    `doctor --json` finaliza con un código distinto de cero cuando cualquier servidor habilitado que se compruebe presenta un problema de nivel `error`. Los problemas `warning` e `info` se notifican, pero por sí solos no hacen que el comando falle.

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

    `probe --json` abre una sesión activa del cliente MCP e imprime directamente su resultado; a diferencia de `status`/`doctor`, la salida no tiene un campo `path` de nivel superior. Las claves `resources` y `prompts` solo están presentes cuando el servidor anuncia realmente esa capacidad (un servidor sin indicaciones omite la clave `prompts` en lugar de informar `false`). Use `probe` para demostrar la accesibilidad y las capacidades, no para auditar la configuración estática.

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

### Transporte stdio

Inicia un proceso secundario local y se comunica mediante stdin/stdout.

| Campo                      | Descripción                                  |
| -------------------------- | -------------------------------------------- |
| `command`                  | Ejecutable que se iniciará (obligatorio)     |
| `args`                     | Matriz de argumentos de línea de comandos    |
| `env`                      | Variables de entorno adicionales             |
| `cwd` / `workingDirectory` | Directorio de trabajo del proceso            |

<Warning>
**Filtro de seguridad del entorno de stdio**

OpenClaw rechaza las claves de entorno de inicio del intérprete, secuestro del cargador e inicialización del shell antes de iniciar un servidor MCP stdio, incluso si aparecen en el bloque `env` de un servidor. Para ello, utiliza la misma política de seguridad del entorno del host que los demás procesos iniciados por OpenClaw: bloquea los enlaces conocidos de inicio del intérprete (por ejemplo, `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), los prefijos de inyección de bibliotecas compartidas y funciones (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) y variables similares de control del entorno de ejecución. Durante el inicio, estas se descartan silenciosamente y se registra una advertencia para impedir que inyecten un preámbulo implícito, sustituyan el intérprete, habiliten un depurador o secuestren el enlazador dinámico del proceso stdio. Una lista explícita de permitidos mantiene utilizables las variables de entorno habituales de credenciales de MCP (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), junto con las variables de proxy habituales y las específicas del servidor (`HTTP_PROXY`, variables `*_API_KEY` personalizadas, etc.). Otras claves `AWS_*`, como `AWS_CONFIG_FILE` y `AWS_SHARED_CREDENTIALS_FILE`, permanecen bloqueadas porque apuntan a archivos de credenciales en lugar de contener directamente un valor de credencial.

Si el servidor MCP necesita realmente una de las variables bloqueadas, establézcala en el proceso host del gateway en lugar de hacerlo en el bloque `env` del servidor stdio.
</Warning>

### Transporte SSE/HTTP

Se conecta a un servidor MCP remoto mediante eventos enviados por el servidor a través de HTTP.

| Campo                          | Descripción                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `url`                          | URL HTTP o HTTPS del servidor remoto (obligatoria)                               |
| `headers`                      | Mapa opcional de pares clave-valor de encabezados HTTP (por ejemplo, tokens de autenticación) |
| `connectionTimeoutMs`          | Tiempo de espera de conexión por servidor en ms (opcional)                       |
| `connectTimeout`               | Tiempo de espera de conexión por servidor en segundos (opcional)                 |
| `timeout` / `requestTimeoutMs` | Tiempo de espera de solicitudes MCP por servidor en segundos o ms                |
| `auth: "oauth"`                | Usa las credenciales de OAuth guardadas mediante `openclaw mcp login`            |
| `sslVerify`                    | Establecer en false solo para puntos de conexión HTTPS privados y explícitamente confiables |
| `clientCert` / `clientKey`     | Rutas del certificado y la clave del cliente mTLS                                |
| `supportsParallelToolCalls`    | Indica que las llamadas simultáneas son seguras para este servidor               |

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

Los valores confidenciales de `url` (información de usuario) y `headers` se ocultan en los registros y en la salida de estado. `openclaw mcp doctor` advierte cuando las entradas de `headers` o `env` que parecen confidenciales contienen valores literales, para que los operadores puedan trasladar esos valores fuera de la configuración confirmada en el repositorio.

### Flujo de trabajo de OAuth

OAuth se utiliza para servidores MCP HTTP que anuncian el flujo OAuth de MCP. Los encabezados `Authorization` estáticos se ignoran en un servidor mientras `auth: "oauth"` está habilitado. Las credenciales guardadas mediante `openclaw mcp login` funcionan con MCP integrado, los ejecutores de la CLI y el servidor de aplicaciones local de Codex.

Hasta que las credenciales estén disponibles, OpenClaw omite únicamente ese servidor MCP del entorno de ejecución del agente, en lugar de provocar un error en el turno del agente. El operador, o un agente con acceso al shell, puede ejecutar entonces `openclaw mcp login <name>` y utilizar el servidor en un turno posterior.

Cuando un servicio MCP remoto ya está respaldado por un perfil de autenticación independiente de OpenClaw con capacidad de actualización, se puede establecer opcionalmente `oauth.authProfileId`. OpenClaw actualiza cualquiera de las fuentes de credenciales antes de la proyección en el entorno de ejecución y pasa únicamente el token de acceso actual al cliente MCP posterior.

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

    OpenClaw muestra la URL de autorización y almacena el estado temporal del verificador de OAuth en el directorio de estado de OpenClaw.

  </Step>
  <Step title="Finalizar con el código">
    Después de aprobar la solicitud en el navegador, devuelva el código recibido a OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Comprobar la autorización">
    Utilice el estado o el diagnóstico para confirmar que los tokens estén presentes.

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

Si el proveedor rota los tokens o el estado de autorización queda bloqueado, ejecute `openclaw mcp logout <name>` y, a continuación, repita `login`. `logout` puede borrar las credenciales de un servidor HTTP guardado incluso después de que `auth: "oauth"` se haya eliminado de la configuración, siempre que el nombre y la URL del servidor sigan identificando la entrada del almacén de credenciales.

### Transporte HTTP con transmisión

`streamable-http` es una opción de transporte adicional junto con `sse` y `stdio`. Utiliza transmisión HTTP para la comunicación bidireccional con servidores MCP remotos.

| Campo                          | Descripción                                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `url`                          | URL HTTP o HTTPS del servidor remoto (obligatoria)                                                                                |
| `transport`                    | Establézcalo en `"streamable-http"` para seleccionar este transporte; si se omite, OpenClaw utiliza `sse`                         |
| `headers`                      | Mapa opcional de pares clave-valor de encabezados HTTP (por ejemplo, tokens de autenticación)                                     |
| `connectionTimeoutMs`          | Tiempo de espera de conexión por servidor en ms (opcional)                                                                        |
| `connectTimeout`               | Tiempo de espera de conexión por servidor en segundos (opcional)                                                                  |
| `timeout` / `requestTimeoutMs` | Tiempo de espera de solicitudes MCP por servidor en segundos o ms                                                                 |
| `auth: "oauth"`                | Utiliza las credenciales OAuth de MCP guardadas mediante `openclaw mcp login`                                                      |
| `sslVerify`                    | Establézcalo en falso únicamente para endpoints HTTPS privados en los que se confíe explícitamente                                |
| `clientCert` / `clientKey`     | Rutas del certificado y la clave de cliente mTLS                                                                                  |
| `supportsParallelToolCalls`    | Indica que las llamadas simultáneas son seguras para este servidor                                                                |

La configuración de OpenClaw utiliza `transport: "streamable-http"` como grafía canónica. Los valores MCP nativos de la CLI `type: "http"` se aceptan cuando se guardan mediante `openclaw mcp set` y se corrigen mediante `openclaw doctor --fix` en la configuración existente, pero `transport` es lo que consume directamente OpenClaw integrado.

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
Los comandos del registro no inician el puente del canal. Solo `probe` y `doctor --probe` abren una sesión activa del cliente MCP para comprobar que se puede acceder al servidor de destino.
</Note>

## Interfaz de control

La interfaz de control del navegador incluye una página dedicada de configuración de MCP en `/settings/mcp`; la ruta anterior `/mcp` permanece como alias. La página muestra los recuentos de servidores configurados, resúmenes de servidores habilitados, con OAuth y con filtros, filas de transporte por servidor, controles para habilitar o deshabilitar, comandos habituales de la CLI y un editor con ámbito limitado para la sección de configuración `mcp`.

Utilice la página para realizar modificaciones de operador y consultar rápidamente el inventario. Utilice `openclaw mcp doctor --probe` u `openclaw mcp probe` cuando necesite una comprobación activa del servidor.

Flujo de trabajo del operador:

1. Abra la interfaz de control y elija **MCP**.
2. Revise las tarjetas de resumen de los servidores totales, habilitados, con OAuth y filtrados.
3. Utilice cada fila de servidor para consultar indicaciones de transporte, autenticación, filtros, tiempo de espera y comandos.
4. Cambie el estado de habilitación cuando quiera conservar una definición, pero excluirla de la detección en tiempo de ejecución.
5. Edite la sección de configuración `mcp` con ámbito limitado para realizar cambios estructurales, como añadir servidores, encabezados, TLS, metadatos de OAuth o filtros de herramientas.
6. Elija **Save** para conservar únicamente la configuración o **Save & Publish** para aplicarla mediante la ruta de configuración del Gateway.
7. Ejecute `openclaw mcp doctor --probe` cuando necesite una comprobación activa de que el servidor modificado se inicia y enumera las herramientas.

Notas:

- los fragmentos de comandos escriben entre comillas los nombres de los servidores para que los nombres inusuales puedan copiarse en un shell
- los valores mostrados similares a URL se ocultan antes de representarse cuando contienen credenciales integradas
- la página no inicia los transportes MCP por sí sola
- los entornos de ejecución activos pueden requerir `openclaw mcp reload`, publicar la configuración del Gateway o reiniciar el proceso, según qué proceso sea propietario de los clientes MCP

## Aplicaciones MCP

OpenClaw puede representar herramientas que implementan la [extensión MCP Apps](https://modelcontextprotocol.io/extensions/apps) estable. Las aplicaciones son opcionales porque su HTML procede del servidor MCP configurado y puede solicitar herramientas o recursos visibles para la aplicación desde ese mismo servidor.

Habilite el puente del host:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Reinicie el Gateway después de cambiar esta configuración. Cuando está habilitada, OpenClaw inicia un agente de escucha HTTP(S) exclusivo del entorno aislado en el puerto del Gateway más uno (para el Gateway predeterminado, `18790`). La interfaz de control carga las aplicaciones desde ese origen independiente; el agente de escucha nunca sirve la interfaz de control, las rutas autenticadas del Gateway ni los datos del usuario.

Las conexiones directas al Gateway necesitan acceso a ambos puertos. Si un proxy inverso o un terminador TLS expone la interfaz de control, asigne a las aplicaciones un origen público dedicado y redirija únicamente ese origen al agente de escucha del entorno aislado:

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

El origen del entorno aislado debe ser distinto del origen de la interfaz de control. No aloje en él otro contenido autenticado o confidencial.

Por ejemplo, la demostración oficial básica de React puede configurarse de la siguiente manera:

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
- Los recursos de la interfaz de usuario tienen un límite de 2 MiB, se sitúan detrás de un proxy de doble iframe en un origen externo dedicado, se cargan en un origen interno opaco de la aplicación y están restringidos por una CSP derivada de los metadatos del recurso.
- Las herramientas exclusivas de las aplicaciones (`_meta.ui.visibility: ["app"]`) no aparecen en las listas de herramientas del modelo. Las aplicaciones solo pueden llamar a herramientas visibles para aplicaciones en su servidor propietario.
- Los permisos de aplicaciones vinculados al origen, como la cámara, el micrófono y la geolocalización, no se conceden mientras los documentos internos de las aplicaciones utilizan orígenes opacos para el aislamiento entre aplicaciones.
- El HTML de la aplicación, los argumentos completos de las herramientas y los resultados sin procesar se conservan en una concesión de vista en memoria limitada a diez minutos. No se escriben en el disco ni se copian en los metadatos de vista previa de la transcripción, y una vista caducada no reinicia su entorno de ejecución MCP.
- `openclaw security audit` muestra una advertencia mientras el puente está habilitado. Deshabilítelo mediante `openclaw config set mcp.apps.enabled false --strict-json` cuando no sea necesario.

## Límites actuales

Esta página documenta el puente tal como se distribuye actualmente.

Límites actuales:

- la detección de conversaciones depende de los metadatos existentes de las rutas de sesión del Gateway
- no existe un protocolo push genérico aparte del adaptador específico de Claude
- aún no hay herramientas para editar mensajes ni añadir reacciones
- el transporte HTTP/SSE/streamable-http se conecta a un único servidor remoto; todavía no existe un servidor ascendente multiplexado
- `permissions_list_open` solo incluye las aprobaciones observadas mientras el puente está conectado

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Plugins](/es/cli/plugins)
