---
read_when:
    - Emparejamiento de nodos iOS/watchOS/Android con un Gateway
    - Uso del lienzo/cámara del Node para el contexto del agente
    - Adición de nuevos comandos de Node o auxiliares de la CLI
summary: 'Nodos: emparejamiento, capacidades, permisos y auxiliares de la CLI para lienzo/cámara/pantalla/dispositivo/notificaciones/sistema'
title: Nodos
x-i18n:
    generated_at: "2026-07-12T14:34:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b59e34e93ec38c69d0cee274d2366eef22c6ff6619a8aea3c2d4a75721865b72
    source_path: nodes/index.md
    workflow: 16
---

Un **nodo** es un dispositivo complementario (macOS/iOS/watchOS/Android/sin interfaz gráfica) que se conecta al Gateway con `role: "node"` y expone una superficie de comandos (p. ej., `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) mediante `node.invoke`. La mayoría de los nodos usan el WebSocket del Gateway en el puerto del operador. El nodo directo opcional de Apple Watch usa sondeos HTTPS firmados en ese mismo puerto porque watchOS bloquea las redes genéricas de bajo nivel para las aplicaciones ordinarias. Detalles del protocolo: [Protocolo del Gateway](/es/gateway/protocol).

Transporte heredado: [Protocolo Bridge](/es/gateway/bridge-protocol) (JSONL sobre TCP; solo histórico para los nodos actuales).

macOS también puede ejecutarse en **modo nodo**: la aplicación de la barra de menús se conecta al servidor WS del Gateway y expone sus comandos locales de lienzo/cámara como un nodo (por lo que `openclaw nodes …` funciona con este Mac). En el modo de Gateway remoto, la automatización del navegador la gestiona el host de nodo de la CLI (`openclaw node run` o el servicio de nodo instalado), no el nodo de la aplicación nativa.

Los nodos son **periféricos**, no gateways: no ejecutan el servicio del Gateway y los mensajes de los canales (Telegram, WhatsApp, etc.) llegan al Gateway, no a los nodos.

Guía de resolución de problemas: [/nodes/troubleshooting](/es/nodes/troubleshooting)

## Emparejamiento y estado

Los nodos usan **emparejamiento de dispositivos**. Un nodo presenta una identidad de dispositivo firmada durante la conexión; el Gateway crea una solicitud de emparejamiento de dispositivo para `role: node`. Apruébela mediante la CLI de dispositivos (o la interfaz de usuario). La configuración directa de Apple Watch usa un código de configuración de corta duración, emitido por un administrador y exclusivo para nodos, para aprobar su superficie fija de comandos de bajo riesgo; cualquier ampliación posterior de capacidades sigue requiriendo la aprobación normal.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Las solicitudes de emparejamiento pendientes caducan 5 minutos después del último reintento del dispositivo: un dispositivo que continúa reconectándose mantiene activa su única solicitud pendiente (y su `requestId`) en lugar de generar una nueva petición cada pocos minutos; consulte [Emparejamiento de nodos](/es/gateway/pairing) para conocer el ciclo completo de solicitud y aprobación. Si un nodo vuelve a intentarlo con datos de autenticación modificados (rol/ámbitos/clave pública), se sustituye la solicitud pendiente anterior y se crea un nuevo `requestId`; los clientes reciben un evento `device.pair.resolved` para la solicitud sustituida y se debe volver a ejecutar `openclaw devices list` antes de aprobar.

- `nodes status` marca un nodo como **emparejado** cuando su rol de emparejamiento de dispositivo incluye `node`.
- Un Mac nativo conectado con permiso de accesibilidad puede informar actividad
  agrupada de entrada física. El Gateway marca el Mac apto con actividad más
  reciente como `active`, proporciona al agente una referencia estable del ID
  del nodo y dirige allí las alertas de conexión de nodos antes de recurrir a una
  alternativa con demora. Consulte
  [Presencia del equipo activo](/nodes/presence) para obtener información sobre
  la configuración, la privacidad, los tiempos y la resolución de problemas.
- El registro de emparejamiento del dispositivo es el contrato duradero de roles aprobados. La rotación del token permanece dentro de ese contrato; no puede elevar un nodo emparejado a un rol que la aprobación de emparejamiento nunca concedió.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) es un almacén independiente de emparejamiento de nodos, propiedad del Gateway, que mantiene la superficie aprobada de comandos y capacidades del nodo entre reconexiones. **No** controla la autenticación del transporte; de eso se encarga el emparejamiento de dispositivos.
- `openclaw nodes remove --node <id|name|ip>` elimina un emparejamiento de nodo. Para un nodo respaldado por un dispositivo, revoca el rol `node` del dispositivo en el almacén de dispositivos emparejados y desconecta las sesiones con rol de nodo de ese dispositivo: un dispositivo con varios roles conserva su fila y solo pierde el rol `node`, mientras que se elimina la fila de un dispositivo que solo tiene el rol de nodo. También borra cualquier entrada coincidente del almacén independiente de emparejamiento de nodos. `operator.pairing` puede eliminar filas de nodos sin rol de operador en otros dispositivos; un solicitante que use un token de dispositivo para revocar su propio rol de nodo en un dispositivo con varios roles necesita además `operator.admin`.
- El ámbito de aprobación depende de los comandos declarados en la solicitud pendiente:
  - solicitud sin comandos: `operator.pairing`
  - comandos de nodo que no son de ejecución: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Diferencias entre versiones y orden de actualización

El WebSocket del Gateway acepta clientes de nodo autenticados dentro de una
ventana de protocolo N-1. Por lo tanto, el Gateway v4 actual acepta nodos v3
cuando la conexión declara tanto `role: "node"` como `client.mode: "node"`.
Las sesiones del operador y de la interfaz de usuario deben seguir usando el
protocolo actual.

Para actualizaciones escalonadas de una flota, actualice primero el Gateway y
después cada nodo. Un nodo N-1 permanece visible y administrable mientras se
actualiza; el Gateway registra `legacy node protocol accepted` junto con una
recomendación de actualización. El emparejamiento, la autenticación de
dispositivos, las listas de comandos permitidos y las aprobaciones de ejecución
siguen aplicándose. Las capacidades y los comandos propiedad de plugins
permanecen ocultos hasta que el nodo se actualiza al protocolo actual. Los nodos
anteriores a N-1 requieren una actualización por un canal alternativo antes de
volver a conectarse.

El transporte HTTPS directo de watchOS requiere la versión actual del protocolo;
actualice la aplicación del reloj junto con el Gateway antes de habilitar el
modo directo.

## Host de nodo remoto (system.run)

Use un **host de nodo** cuando el Gateway se ejecute en una máquina y se desee ejecutar comandos en otra. El modelo sigue comunicándose con el **Gateway**; el Gateway reenvía las llamadas `exec` al **host de nodo** cuando se selecciona `host=node`.

| Rol              | Responsabilidad                                                           |
| ---------------- | ------------------------------------------------------------------------- |
| Host del Gateway | Recibe mensajes, ejecuta el modelo y dirige las llamadas a herramientas.  |
| Host de nodo     | Ejecuta `system.run`/`system.which` en la máquina del nodo.                |
| Aprobaciones     | Se aplican en el host de nodo mediante `~/.openclaw/exec-approvals.json`.  |

Nota sobre la aprobación:

- Las ejecuciones de nodos respaldadas por una aprobación se vinculan al contexto exacto de la solicitud. La ruta de ejecución prepara un `systemRunPlan` canónico antes de la aprobación; una vez concedida, el Gateway reenvía ese plan almacenado, no los campos de comando, directorio de trabajo o sesión que el solicitante haya modificado posteriormente, y vuelve a validar el directorio de trabajo antes de ejecutar.
- Para las ejecuciones directas de archivos mediante un shell o entorno de ejecución, OpenClaw también intenta vincular un único operando de archivo local concreto y rechaza la ejecución si ese archivo cambia antes de ejecutarse.
- Si OpenClaw no puede identificar exactamente un archivo local concreto para un comando de intérprete o entorno de ejecución, se rechaza la ejecución respaldada por una aprobación en lugar de aparentar una cobertura completa del entorno de ejecución. Use aislamiento, hosts separados o una lista explícita de elementos de confianza o un flujo de trabajo completo para una semántica de intérprete más amplia.

### Iniciar un host de nodo (primer plano)

En la máquina del nodo:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` también acepta `--context-path` (ruta de contexto del WS del Gateway), `--tls`, `--tls-fingerprint <sha256>` y `--node-id` (sustituye el ID heredado de instancia del cliente; esto no restablece el emparejamiento).

### Gateway remoto mediante un túnel SSH (vinculación de bucle invertido)

Si el Gateway se vincula a la interfaz de bucle invertido (`gateway.bind=loopback`, valor predeterminado en el modo local), los hosts de nodo remotos no pueden conectarse directamente. Cree un túnel SSH y dirija el host de nodo al extremo local del túnel.

Ejemplo (host de nodo -> host del Gateway):

```bash
# Terminal A (manténgalo en ejecución): reenviar el puerto local 18790 -> Gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exportar el token del Gateway y conectarse a través del túnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notas:

- `openclaw node run` admite autenticación mediante token o contraseña.
- Se prefieren las variables de entorno: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- La configuración alternativa es `gateway.auth.token` / `gateway.auth.password`.
- En el modo local, el host de nodo ignora intencionadamente `gateway.remote.token` / `gateway.remote.password`.
- En el modo remoto, `gateway.remote.token` / `gateway.remote.password` se pueden usar según las reglas de precedencia remota.
- Si hay SecretRefs activas de `gateway.auth.*` local configuradas pero sin resolver, la autenticación del host de nodo falla de forma cerrada.
- La resolución de autenticación del host de nodo solo reconoce las variables de entorno `OPENCLAW_GATEWAY_*`.

### Iniciar un host de nodo (servicio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` también acepta `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (solo el ID heredado de instancia del cliente), `--runtime <node|bun>` (valor predeterminado: node) y `--force` para reinstalar. También están disponibles `node status`, `node stop` y `node uninstall`.

### Emparejar y asignar un nombre

En el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si el nodo vuelve a intentarlo con datos de autenticación modificados, vuelva a ejecutar `openclaw devices list` y apruebe el `requestId` actual.

Opciones de nomenclatura:

- `--display-name` en `openclaw node run` / `openclaw node install` (se conserva en `~/.openclaw/node.json` en el nodo, junto con el ID de instancia del cliente y los metadatos de conexión del Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (sustitución en el Gateway).

### Servidores MCP alojados en nodos

Configure los servidores MCP en `openclaw.json` en la máquina del nodo, no en el
Gateway:

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

El host de nodo sin interfaz gráfica inicia estos servidores, enumera sus
herramientas y publica los descriptores después de conectarse. Las llamadas a
herramientas regresan a ese nodo mediante `mcp.tools.call.v1`; el Gateway no
necesita una configuración MCP coincidente ni un plugin JS. Esta ruta v1
alojada en nodos no admite servidores MCP con OAuth.

Los hosts de nodo actuales declaran la familia de comandos integrada
`mcp.tools.call.v1` durante su emparejamiento inicial, incluso cuando no hay
ningún servidor MCP configurado. Un nodo emparejado con una versión anterior de
OpenClaw puede solicitar una actualización única de la superficie de comandos
después de actualizar el host de nodo. Añadir, eliminar o filtrar servidores
posteriormente no requiere volver a emparejar porque la familia de comandos
aprobada no cambia. Reinicie `openclaw node run` o `openclaw node restart` para
aplicar cambios en la configuración MCP del nodo; el host de nodo no supervisa
esta configuración.

Los operadores del Gateway pueden ignorar todas las herramientas visibles para
los agentes publicadas por nodos emparejados, incluidas las herramientas MCP
alojadas en nodos, mediante
`gateway.nodes.pluginTools.enabled: false`. Las denegaciones de comandos exactos,
como `gateway.nodes.denyCommands: ["mcp.tools.call.v1"]`, también bloquean la
ejecución.

### Skills alojadas en nodos

Instale las Skills en el directorio activo de Skills de OpenClaw de la máquina
del nodo, `~/.openclaw/skills` de forma predeterminada. `OPENCLAW_HOME`,
`OPENCLAW_STATE_DIR` y `OPENCLAW_CONFIG_PATH` trasladan ese perfil activo.
`OPENCLAW_STATE_DIR` tiene precedencia para las Skills; de lo contrario,
`skills/` se encuentra junto a la ruta mostrada por `openclaw config file`. El
host de nodo sin interfaz gráfica publica los archivos `SKILL.md` válidos
después de conectarse, y el Gateway los añade a las instantáneas de Skills del
agente solo mientras ese nodo permanece conectado. El nombre del directorio de
cada Skill debe coincidir con el campo `name` del frontmatter para que el
localizador abstracto del nodo se asocie a una sola entrada sin añadir otro
campo al protocolo.

El emparejamiento inicial con rol de nodo aprueba la publicación de Skills.
Añadir, eliminar o cambiar Skills no requiere otro emparejamiento ni un cambio
en la configuración del Gateway. Reinicie `openclaw node run` o
`openclaw node restart` después de cambiar los archivos de Skills del nodo; el
host de nodo no supervisa el directorio de Skills.

Las entradas de Skills alojadas en Node identifican su Node e incluyen su
ubicación de ejecución. Los archivos de Skills, las rutas relativas referenciadas
y los binarios permanecen en ese Node. El agente lee la ubicación anunciada
`node://.../SKILL.md` con la herramienta `read` normal. `file_fetch` acepta rutas
absolutas del Node aprobadas por el operador, no localizadores de Skills del Node;
los entornos de ejecución sin la herramienta de lectura normal pueden ejecutar
`cat SKILL.md` mediante `exec host=node node=<node-id>` con el directorio anunciado
`node://.../skills/<name>` como `workdir`. Los archivos y binarios referenciados
usan el mismo destino de ejecución y directorio de trabajo. El host del Node
resuelve ese localizador con respecto a su directorio de estado activo de
OpenClaw, por lo que las rutas relativas se resuelven en el Node y no en la
máquina del Gateway. El Node que publica debe tener aprobado `system.run`, y la
política de ejecución del agente debe permitir `host=node`; de lo contrario, la
Skill queda fuera de la instantánea de ese agente.

Establezca `nodeHost.skills.enabled: false` en el Node para detener la publicación.
Los operadores del Gateway pueden ignorar las Skills de todos los Nodes emparejados
con `gateway.nodes.skills.enabled: false`.

### Estado de identidad sin interfaz gráfica

El Node sin interfaz gráfica mantiene tres archivos de estado independientes:

- `~/.openclaw/node.json`: el ID heredado de la instancia del cliente (almacenado como `nodeId`), el nombre para mostrar y los metadatos de conexión del Gateway.
- `~/.openclaw/identity/device.json`: el par de claves firmado del dispositivo y el ID criptográfico derivado del dispositivo.
- `~/.openclaw/identity/device-auth.json`: los tokens de autenticación del dispositivo emparejado, indexados por el ID criptográfico del dispositivo y el rol.

Para un Node firmado, el Gateway usa el ID criptográfico del dispositivo para el
emparejamiento y el enrutamiento del Node. El ID de instancia del cliente solo
constituye metadatos de conexión. Por lo tanto, cambiar `--node-id` o eliminar
únicamente `node.json` no restablece el emparejamiento. Consulte
[Estado de identidad y emparejamiento](/es/cli/node#identity-and-pairing-state) para
conocer el flujo compatible de revocación y nuevo emparejamiento, así como las
notas de actualización.

### Añadir los comandos a la lista de permitidos

Las aprobaciones de ejecución son **específicas de cada host de Node**. Añada
entradas a la lista de permitidos desde el Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Las aprobaciones se almacenan en el host del Node en
`~/.openclaw/exec-approvals.json`.

### Dirigir la ejecución al Node

Configurar los valores predeterminados (configuración del Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

O por sesión:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Una vez configurado, cualquier llamada a `exec` con `host=node` se ejecuta en el host del Node (sujeto a la lista de permitidos y las aprobaciones del Node).

`host=auto` no elegirá implícitamente el Node por sí solo, pero desde `auto` se permite una solicitud explícita por llamada con `host=node`. Si se desea que la ejecución en el Node sea el valor predeterminado de la sesión, se debe establecer explícitamente `tools.exec.host=node` o `/exec host=node ...`.

Relacionado:

- [CLI del host del Node](/es/cli/node)
- [Herramienta Exec](/es/tools/exec)
- [Aprobaciones de Exec](/es/tools/exec-approvals)

### Inferencia de modelos locales

Un Node de escritorio o servidor puede exponer modelos con capacidad de chat desde un servidor Ollama que se ejecute en ese Node. Los agentes usan la herramienta `node_inference` del Plugin de Ollama para descubrir los modelos instalados y ejecutar de forma remota un prompt limitado; el Gateway no necesita acceso directo por red a Ollama. Consulte [Inferencia local del Node con Ollama](/es/providers/ollama#node-local-inference) para obtener información sobre la configuración, el filtrado de modelos y los comandos de verificación directa.

### Sesiones y transcripciones de Codex

El plugin oficial `codex` puede exponer sesiones de Codex no archivadas en un
host Node sin interfaz gráfica o en un Node nativo de macOS. El registro en el catálogo ya no depende
de `supervision.enabled`; esa opción controla las herramientas de supervisión orientadas al agente.
El plugin debe seguir activo en ambos equipos, y la configuración del Node sigue siendo
un consentimiento local: habilitar únicamente el Gateway no permite leer el estado de Codex
de otro equipo.

El Node anuncia los comandos de solo lectura con versiones
`codex.appServer.threads.list.v1` y
`codex.appServer.thread.turns.list.v1`. Apruebe la actualización del emparejamiento
del Node cuando esos comandos aparezcan por primera vez. El Gateway los invoca mediante la
política normal de Node del plugin y aísla los fallos por host.

Las filas de los Nodes emparejados aparecen como un grupo **Codex** en la barra lateral normal de sesiones.
Al seleccionar una fila, se abre el panel normal de Chat y se lee su transcripción persistente
mediante llamadas acotadas y paginadas por cursor a
`thread/turns/list`, con una proyección completa de los elementos. El transporte de invocación del Node es exclusivamente de solicitud/respuesta y no puede
transportar los turnos en streaming, los eventos en vivo ni las aprobaciones necesarias para continuar un
hilo nativo mediante el entorno de Codex. Por tanto, **Continuar** y **Archivar** no están
disponibles para las filas remotas. En el equipo del Gateway, las filas almacenadas e inactivas
pueden iniciar una rama de Chat independiente bloqueada a un modelo. Cualquiera de ellas puede archivarse únicamente
después de que el operador confirme que ningún otro cliente de Codex la está utilizando; la actividad
en vivo de una fila almacenada sigue siendo desconocida. Las filas activas no pueden ramificarse ni archivarse.

Consulte [Supervisar sesiones de Codex](/plugins/codex-supervision) para obtener información sobre la configuración,
la paginación, la continuación local y el límite de seguridad de los metadatos.

### Sesiones y transcripciones de Claude

El plugin `anthropic` incluido detecta sesiones no archivadas de Claude CLI y Claude
Desktop en el Gateway y en los Nodes emparejados. A diferencia de la supervisión de Codex,
esto no requiere una activación independiente: un Node remoto de la aplicación para macOS anuncia
`anthropic.claude.sessions.list.v1` y `anthropic.claude.sessions.read.v1`
cuando el plugin Anthropic está habilitado y existe `~/.claude/projects/`. Apruebe
la actualización del emparejamiento del Node cuando esos comandos aparezcan por primera vez.

El catálogo combina registros válidos del índice de proyectos de Claude CLI con un prefijo
acotado de metadatos procedente de los archivos JSONL `sdk-cli` actuales. Los metadatos locales
de Claude Desktop proporcionan los títulos de Desktop y el estado de archivado. Los metadatos de Desktop prevalecen cuando
ambas fuentes hacen referencia al mismo ID de sesión de Claude Code; las transcripciones exclusivas
de la CLI siguen visibles porque la CLI no tiene un indicador de archivado. Las lecturas de transcripciones utilizan cursores opacos
de desplazamiento en bytes y lecturas acotadas de archivos hacia atrás, por lo que seleccionar una sesión
grande o cargar una página anterior no lee todo el historial JSONL en una única
respuesta del Gateway.

Ambos comandos del Node son de solo lectura. Exponen los metadatos del catálogo y el contenido
de las transcripciones únicamente mediante los métodos genéricos `sessions.catalog.list` y
`sessions.catalog.read` a una conexión autenticada del operador con
`operator.write`. Las filas de los Nodes emparejados permanecen en modo de solo visualización. Una fila de Claude CLI
local al Gateway puede adoptarse desde el editor normal de Chat: OpenClaw importa un historial visible
acotado, reanuda con `--fork-session` en el primer turno y deja intacta la
transcripción de origen. Las filas de Claude Desktop permanecen en modo de solo visualización.

Consulte [Anthropic: sesiones de Claude entre equipos](/es/providers/anthropic#claude-sessions-across-computers)
para conocer el comportamiento de la interfaz de control y las fuentes de almacenamiento.

## Invocación de comandos

Bajo nivel (RPC sin procesar):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` bloquea `system.run` y `system.run.prepare`; esos comandos solo se ejecutan mediante la herramienta `exec` con `host=node` (consulte lo anterior). Existen asistentes de nivel superior para los flujos de trabajo habituales de «proporcionar al agente un archivo adjunto MEDIA» (lienzo, cámara, pantalla, ubicación; se describen más adelante).

## Política de comandos

Los comandos del Node deben superar dos controles antes de poder invocarse:

1. El Node debe declarar el comando en sus metadatos de conexión autenticados (`connect.commands`).
2. La lista de permitidos del Gateway, derivada de la plataforma y las aprobaciones, debe incluir el comando declarado.

Listas de permitidos predeterminadas por plataforma (antes de los valores predeterminados del plugin y las anulaciones de `allowCommands`/`denyCommands`):

| Plataforma | Comandos permitidos de forma predeterminada                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (los comandos del host del Node, como `system.run`, están sujetos a aprobación; consulte más adelante)                                                                                                                                                                                                                                  |

Estas filas describen el límite máximo de la política del Gateway, no los comandos implementados por cada aplicación de Node. Un comando solo puede utilizarse cuando el Node conectado también lo declara. En particular, la aplicación actual para macOS no declara las familias de datos personales y del dispositivo indicadas en la fila de la política de macOS.

Los comandos `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) son un valor predeterminado del plugin en iOS, Android, macOS, Windows y plataformas desconocidas (no en Linux); todos están restringidos al primer plano en iOS.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once` se permiten de forma predeterminada para cualquier Node que anuncie la capacidad `talk` o declare comandos `talk.*`, independientemente de la etiqueta de la plataforma.

Los comandos del host de escritorio (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` y `screen.snapshot` en macOS/Windows) no forman parte de la tabla estática de valores predeterminados por plataforma anterior. Pasan a estar disponibles una vez que el operador aprueba una solicitud de emparejamiento que los declara; a partir de entonces, el conjunto de comandos aprobados del Node los conserva en las reconexiones.

Los comandos peligrosos o con importantes implicaciones para la privacidad siguen requiriendo una activación explícita mediante `gateway.nodes.allowCommands`, incluso si un Node los declara: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` siempre prevalece sobre los valores predeterminados y las entradas adicionales de la lista de permitidos. Consulte [Uso del equipo](/nodes/computer-use) para conocer los controles adicionales de macOS, de la política de herramientas y de activación relacionados con la entrada de escritorio.

Los comandos de Node propiedad de un Plugin pueden añadir una política de invocación de Node del Gateway. Esa política se ejecuta después de comprobar la lista de permitidos y antes de reenviar al Node, por lo que `node.invoke` sin procesar, los auxiliares de la CLI y las herramientas específicas del agente comparten el mismo límite de permisos del Plugin. Los comandos peligrosos de Node del Plugin siguen requiriendo la inclusión explícita en `gateway.nodes.allowCommands`.

Después de que un Node cambie su lista de comandos declarada, rechace el emparejamiento anterior del dispositivo y apruebe la nueva solicitud para que el Gateway almacene la instantánea actualizada de comandos.

## Configuración (`openclaw.json`)

Los ajustes relacionados con Node se encuentran en `gateway.nodes` y `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Aprobar automáticamente el primer emparejamiento de un Node desde redes de confianza (lista CIDR).
      // Está deshabilitado si no se configura. Solo se aplica a solicitudes iniciales de role:node
      // sin ámbitos solicitados; no aprueba automáticamente las actualizaciones.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // Aprobación automática verificada mediante SSH (valor predeterminado: habilitada). Aprueba el primer
        // emparejamiento de un Node cuando la clave exacta del dispositivo leída mediante SSH coincide.
        sshVerify: true,
      },
      // Confiar en las herramientas de Plugin visibles para el agente publicadas por Nodes emparejados (valor predeterminado: true).
      pluginTools: {
        enabled: true,
      },
      // Habilitar comandos de Node peligrosos o con un alto impacto en la privacidad (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Bloquear nombres de comandos exactos aunque los valores predeterminados o allowCommands los incluyan.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Host de ejecución predeterminado: "node" dirige todas las llamadas de ejecución a un Node emparejado.
      host: "node",
      // Modo de seguridad para la ejecución en Node: permitir solo comandos aprobados o incluidos en la lista de permitidos.
      security: "allowlist",
      // Fijar la ejecución a un Node específico (identificador o nombre). Omitir para permitir cualquier Node.
      node: "build-node",
    },
  },
}
```

Use los nombres exactos de los comandos de Node. `denyCommands` elimina un comando aunque un valor predeterminado de la plataforma o una entrada de `allowCommands` lo permitiera de otro modo. Los Nodes emparejados pueden publicar de forma predeterminada descriptores de herramientas de Plugin visibles para el agente, pero el comando de cada descriptor debe seguir formando parte de la superficie de comandos aprobada del Node. Establezca `gateway.nodes.pluginTools.enabled: false` para ignorar todos esos descriptores. Consulte la [referencia de configuración del Gateway](/es/gateway/configuration-reference#gateway) para obtener detalles sobre los campos de emparejamiento de Nodes y de la política de comandos del Gateway.

Anulación del Node de ejecución por agente:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Capturas de pantalla (instantáneas del lienzo)

Si el Node muestra el lienzo (WebView), `canvas.snapshot` devuelve `{ format, base64 }`.

Auxiliar de la CLI (escribe en un archivo temporal e imprime la ruta guardada):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Controles del lienzo

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Notas:

- `canvas present` acepta URL o rutas de archivos locales (`--target`), además de los parámetros opcionales `--x/--y/--width/--height` para el posicionamiento.
- `canvas eval` acepta JS en línea (`--js`) o un argumento posicional.

### A2UI (lienzo)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notas:

- Los Nodes móviles utilizan una página A2UI incluida y propiedad de la aplicación para representar contenido compatible con acciones.
- Solo se admite JSONL de A2UI v0.8 (se rechaza v0.9/createSurface).
- iOS y Android representan páginas remotas del lienzo del Gateway, pero las acciones de los botones de A2UI solo se envían desde la página A2UI incluida y propiedad de la aplicación. En esos clientes móviles, las páginas A2UI HTTP/HTTPS alojadas en el Gateway son solo de representación.
- macOS puede enviar acciones desde la página A2UI exacta del Gateway, limitada por capacidades, que seleccione la aplicación. Las demás páginas HTTP/HTTPS siguen siendo solo de representación.

## Fotos y vídeos (cámara del Node)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # valor predeterminado: ambas cámaras (2 líneas MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Clips de vídeo (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notas:

- El Node debe estar **en primer plano** para `canvas.*` y `camera.*` (las llamadas en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE`).
- Los Nodes limitan la duración de los clips para mantener manejable la carga útil base64 (consulte [Captura de cámara](/es/nodes/camera) para conocer los límites exactos de cada plataforma). La herramienta de agente `nodes` limita además el valor solicitado de `durationMs` a 300000 (5 minutos) antes de reenviar la llamada; el propio Node aplica el límite más estricto.
- Android solicitará los permisos `CAMERA`/`RECORD_AUDIO` cuando sea posible; si se deniegan, se produce un error `*_PERMISSION_REQUIRED`.

## Grabaciones de pantalla (Nodes)

Los Nodes compatibles exponen `screen.record` (mp4). Ejemplo:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notas:

- La disponibilidad de `screen.record` depende de la plataforma del Node.
- La herramienta de agente `nodes` limita el valor solicitado de `durationMs` a 300000 (5 minutos); el Node puede aplicar un límite más estricto para restringir la carga útil devuelta.
- `--no-audio` deshabilita la captura del micrófono en las plataformas compatibles.
- Use `--screen <index>` para seleccionar una pantalla cuando haya varias disponibles (0 = principal).

## Ubicación (Nodes)

Los Nodes exponen `location.get` cuando Ubicación está habilitada en los ajustes.

Auxiliar de la CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notas:

- La ubicación está **desactivada de forma predeterminada**.
- "Always" requiere permiso del sistema; la obtención en segundo plano se realiza en la medida de lo posible.
- La respuesta incluye latitud/longitud, precisión (metros) y marca de tiempo.
- Forma completa de los parámetros y la respuesta, y códigos de error: [Comando de ubicación](/es/nodes/location-command).

## SMS (Nodes Android)

Los Nodes Android pueden exponer `sms.send` y `sms.search` cuando el usuario concede el permiso **SMS** y el dispositivo admite telefonía. Ambos comandos son peligrosos de forma predeterminada: el operador del Gateway también debe añadirlos a `gateway.nodes.allowCommands` antes de que puedan invocarse (consulte [Política de comandos](#command-policy)).

Para habilitar explícitamente la búsqueda de SMS de solo lectura en `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Añada `sms.send` por separado solo cuando el Node también deba poder enviar mensajes. El permiso de Android y la autorización de comandos del Gateway son independientes; conceder el permiso del teléfono no modifica la política del Gateway.

Invocación de bajo nivel:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notas:

- `sms.search` puede declararse antes de conceder `READ_SMS` para que una invocación pueda devolver un diagnóstico de permisos; la lectura de mensajes sigue requiriendo ese permiso de Android.
- Los dispositivos que solo disponen de Wi-Fi y no tienen telefonía no anunciarán `sms.send`.
- Un error `requires explicit gateway.nodes.allowCommands opt-in` significa que el teléfono declaró el comando, pero el operador del Gateway no lo ha autorizado.

## Comandos de datos personales y del dispositivo

Los Nodes iOS y Android anuncian de forma predeterminada varios comandos de datos de solo lectura (consulte la tabla de [Política de comandos](#command-policy)); Android expone además una familia más amplia controlada mediante sus propios ajustes en la aplicación.

Familias disponibles:

- `device.status`, `device.info` — iOS, Android y Windows.
- `device.permissions`, `device.health`, `device.apps` — solo Android; `device.apps` requiere que el uso compartido de aplicaciones instaladas esté habilitado en Android Settings y devuelve de forma predeterminada las aplicaciones visibles en el iniciador.
- `notifications.list`, `notifications.actions` — solo Android.
- `photos.latest` — iOS y Android.
- `contacts.search` — iOS y Android (solo lectura de forma predeterminada); `contacts.add` es peligroso y necesita `gateway.nodes.allowCommands`.
- `calendar.events` — iOS y Android (solo lectura de forma predeterminada); `calendar.add` es peligroso y necesita `gateway.nodes.allowCommands`.
- `reminders.list` — iOS y Android (solo lectura de forma predeterminada); `reminders.add` es peligroso y necesita `gateway.nodes.allowCommands`.
- `callLog.search` — solo Android.
- `motion.activity`, `motion.pedometer` — iOS y Android; sujetos a las capacidades de los sensores disponibles.

Ejemplos de invocación:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Comandos del sistema (host del Node / Node Mac)

El Node de macOS expone `system.run`, `system.which`, `system.notify` y `system.execApprovals.get/set`. El host de Node sin interfaz gráfica expone `system.run.prepare`, `system.run`, `system.which` y `system.execApprovals.get/set`.

Ejemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Notas:

- `system.run` devuelve stdout/stderr/el código de salida en la carga útil.
- La ejecución del shell ahora se realiza mediante la herramienta `exec` con `host=node`; `nodes` sigue siendo la superficie RPC directa para comandos explícitos de Node.
- `nodes invoke` no expone `system.run` ni `system.run.prepare`; estos permanecen únicamente en la ruta de exec.
- La ruta de exec prepara un `systemRunPlan` canónico antes de la aprobación. Una vez concedida la aprobación, el Gateway reenvía ese plan almacenado, no los campos de comando/cwd/sesión que el invocador edite posteriormente.
- `system.notify` respeta el estado del permiso de notificaciones en la aplicación para macOS; admite `--priority <passive|active|timeSensitive>` y `--delivery <system|overlay|auto>`.
- Los metadatos `platform` / `deviceFamily` de Node no reconocidos usan una lista de permitidos predeterminada conservadora que excluye `system.run` y `system.which`. Si necesita intencionadamente esos comandos para una plataforma desconocida, añádalos explícitamente mediante `gateway.nodes.allowCommands`.
- `system.run` admite `--cwd`, `--env KEY=VAL`, `--command-timeout` y `--needs-screen-recording`.
- Para los envoltorios de shell (`bash|sh|zsh ... -c/-lc`), los valores `--env` con alcance de solicitud se reducen a una lista de permitidos explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para las decisiones de permitir siempre en el modo de lista de permitidos, los envoltorios de despacho conocidos (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan las rutas de los ejecutables internos en lugar de las rutas de los envoltorios. Si no es seguro desenvolverlos, no se conserva automáticamente ninguna entrada en la lista de permitidos.
- En hosts de Node con Windows en modo de lista de permitidos, las ejecuciones mediante un envoltorio de shell con `cmd.exe /c` requieren aprobación (una entrada en la lista de permitidos por sí sola no permite automáticamente la forma con envoltorio).
- Los hosts de Node ignoran las sobrescrituras de `PATH` en `--env` y eliminan un conjunto amplio y mantenido de variables de inicio de intérpretes/shells (por ejemplo, `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) antes de ejecutar un comando. Si necesita entradas adicionales en PATH, configure el entorno del servicio del host de Node (o instale las herramientas en ubicaciones estándar) en lugar de pasar `PATH` mediante `--env`.
- En el modo de Node para macOS, `system.run` está controlado por las aprobaciones de exec en la aplicación para macOS (Settings → Exec approvals). Los modos preguntar/lista de permitidos/completo se comportan igual que en el host de Node sin interfaz; las solicitudes denegadas devuelven `SYSTEM_RUN_DENIED`.
- En el host de Node sin interfaz, `system.run` está controlado por las aprobaciones de exec (`~/.openclaw/exec-approvals.json`); específicamente en macOS, consulte las variables de entorno de enrutamiento del host de exec en [Host de Node sin interfaz](#headless-node-host-cross-platform) a continuación.

## Vinculación de Node para exec

Cuando hay varios Nodes disponibles, puede vincular exec a un Node específico. Esto establece el Node predeterminado para `exec host=node` (y se puede sobrescribir por agente).

Valor predeterminado global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Sobrescritura por agente:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Elimine la configuración para permitir cualquier Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Mapa de permisos

Los Nodes pueden incluir un mapa `permissions` en `node.list` / `node.describe`, indexado por nombre de permiso (por ejemplo, `screenRecording`, `accessibility`, `location`) con valores booleanos (`true` = concedido).

## Host de Node sin interfaz (multiplataforma)

OpenClaw puede ejecutar un **host de Node sin interfaz** (sin interfaz de usuario) que se conecta al WebSocket del Gateway y expone `system.run` / `system.which`. Esto resulta útil en Linux/Windows o para ejecutar un Node mínimo junto a un servidor.

Inícielo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notas:

- El emparejamiento sigue siendo obligatorio (el Gateway mostrará una solicitud de emparejamiento de dispositivo).
- Los metadatos de la instancia del cliente, la identidad firmada del dispositivo y la autenticación de emparejamiento usan archivos separados; consulte [Estado de identidad sin interfaz](#headless-identity-state).
- Las aprobaciones de exec se aplican localmente mediante `~/.openclaw/exec-approvals.json` (consulte [Aprobaciones de exec](/es/tools/exec-approvals)).
- En macOS, el host de Node sin interfaz ejecuta `system.run` localmente de forma predeterminada. Establezca `OPENCLAW_NODE_EXEC_HOST=app` para enrutar `system.run` mediante el host de exec de la aplicación complementaria; añada `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir el host de la aplicación y aplicar un fallo cerrado si no está disponible.
- Añada `--tls` / `--tls-fingerprint` cuando el WS del Gateway use TLS.

## Modo de Node para Mac

- La aplicación de la barra de menús de macOS se conecta al servidor WS del Gateway como Node (por lo que `openclaw nodes …` funciona con este Mac).
- En el modo remoto, la aplicación abre un túnel SSH para el puerto del Gateway y se conecta a `localhost`.
