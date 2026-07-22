---
read_when:
    - Emparejamiento de nodos iOS/watchOS/Android con un gateway
    - Uso del lienzo/cámara del Node para el contexto del agente
    - Añadir nuevos comandos de Node o auxiliares de la CLI
summary: 'Nodes: emparejamiento, capacidades, permisos y asistentes de la CLI para canvas/cámara/pantalla/dispositivo/notificaciones/sistema'
title: Nodos
x-i18n:
    generated_at: "2026-07-22T10:38:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 86400f329385cb66657f9dbd239aa2d9e6d216b87b35b84e514dc17376041407
    source_path: nodes/index.md
    workflow: 16
---

Un **nodo** es un dispositivo complementario (macOS/iOS/watchOS/Android/sin interfaz gráfica) que se conecta al Gateway con `role: "node"` y expone una superficie de comandos (p. ej., `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) mediante `node.invoke`. La mayoría de los nodos usan el WebSocket del Gateway en el puerto del operador. El nodo directo opcional de Apple Watch usa sondeos HTTPS firmados en ese mismo puerto porque watchOS bloquea las redes genéricas de bajo nivel para las aplicaciones comunes. Detalles del protocolo: [Protocolo del Gateway](/es/gateway/protocol).

Transporte heredado: [Protocolo Bridge](/es/gateway/bridge-protocol) (JSONL sobre TCP; solo de interés histórico para los nodos actuales).

macOS también puede ejecutarse en **modo nodo**: la aplicación de la barra de menús se conecta al servidor
WS del Gateway como un nodo (por lo que `openclaw nodes …` funciona con este Mac). La aplicación
añade comandos nativos de Canvas, cámara, pantalla, notificaciones y control del equipo
a la misma superficie de comandos del host de nodo que usa `openclaw node run`. No se debe iniciar un
segundo nodo de CLI en ese Mac; la aplicación ejecuta el entorno de ejecución correspondiente del host de nodo de CLI como
un proceso interno y sigue siendo la única conexión al Gateway y la única identidad de nodo.

Los nodos son **periféricos**, no gateways: no ejecutan el servicio del Gateway, y los mensajes de los canales (Telegram, WhatsApp, etc.) llegan al Gateway, no a los nodos.

Guía de resolución de problemas: [/nodes/troubleshooting](/es/nodes/troubleshooting)

## Emparejamiento y estado

Los nodos usan **emparejamiento de dispositivos**. Un nodo presenta una identidad de dispositivo firmada durante la conexión; el Gateway crea una solicitud de emparejamiento de dispositivo para `role: node`. Se aprueba mediante la CLI de dispositivos (o la interfaz de usuario). La configuración directa de Apple Watch usa un código de configuración de corta duración, exclusivo para nodos y generado por un administrador, para aprobar su superficie fija de comandos de bajo riesgo; la ampliación posterior de las capacidades sigue requiriendo una aprobación normal.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Las solicitudes de emparejamiento pendientes caducan 5 minutos después del último reintento del dispositivo; un dispositivo que continúa reconectándose mantiene activa su única solicitud pendiente (y `requestId`) en lugar de generar una nueva indicación cada pocos minutos. Consulte [Emparejamiento de nodos](/es/gateway/pairing) para conocer el ciclo completo de solicitud y aprobación. Si un nodo reintenta la conexión con datos de autenticación modificados (rol/ámbitos/clave pública), la solicitud pendiente anterior se sustituye y se crea un nuevo `requestId`; los clientes reciben un evento `device.pair.resolved` para la solicitud sustituida, y se debe volver a ejecutar `openclaw devices list` antes de aprobarla.

- `nodes status` marca un nodo como **emparejado** cuando su rol de emparejamiento de dispositivo incluye `node`.
- Un Mac nativo conectado puede habilitar la actividad combinada de entrada física en
  **Settings -> Permissions -> Active computer detection**. También se requiere
  accesibilidad. El Gateway marca el Mac apto con actividad más reciente como
  `active`, proporciona al agente una indicación estable del ID de nodo y dirige allí las alertas
  de conexión de nodos antes de recurrir a una alternativa con demora. Consulte
  [Presencia del equipo activo](/es/nodes/presence) para obtener información sobre la configuración, la privacidad, los tiempos y la
  resolución de problemas.
- El registro de emparejamiento de dispositivos es el contrato persistente de roles aprobados. La rotación de tokens permanece dentro de ese contrato; no puede convertir un nodo emparejado en un rol que la aprobación del emparejamiento nunca concedió.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) es un almacén independiente de emparejamiento de nodos, propiedad del Gateway, que registra la superficie aprobada de comandos y capacidades del nodo entre reconexiones. **No** controla la autenticación del transporte; de ello se encarga el emparejamiento de dispositivos.
- `openclaw nodes remove --node <id|name|ip>` elimina un emparejamiento de nodo. Para un nodo respaldado por un dispositivo, revoca el rol `node` del dispositivo en el almacén de dispositivos emparejados y desconecta las sesiones con rol de nodo de ese dispositivo: un dispositivo con varios roles conserva su fila y solo pierde el rol `node`, mientras que se elimina la fila de un dispositivo que solo tiene el rol de nodo. También borra cualquier entrada coincidente del almacén independiente de emparejamiento de nodos. `operator.pairing` puede eliminar filas de nodos que no sean operadores en otros dispositivos; un emisor con token de dispositivo que revoque su propio rol de nodo en un dispositivo con varios roles necesita además `operator.admin`.
- El ámbito de aprobación depende de los comandos declarados en la solicitud pendiente:
  - solicitud sin comandos: `operator.pairing`
  - comandos de nodo que no son de ejecución: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Desfase de versiones y orden de actualización

El WebSocket del Gateway acepta clientes de nodo autenticados dentro de una ventana de protocolo N-1.
Por lo tanto, el Gateway v4 actual acepta nodos v3 cuando la conexión declara
tanto `role: "node"` como `client.mode: "node"`. Las sesiones del operador y de la interfaz de usuario deben
seguir usando el protocolo actual.

Para las actualizaciones escalonadas de una flota, se actualiza primero el Gateway y después cada nodo.
Un nodo N-1 permanece visible y administrable mientras se actualiza; el Gateway
registra `legacy node protocol accepted` con una recomendación de actualización. El emparejamiento,
la autenticación de dispositivos, las listas de comandos permitidos y las aprobaciones de ejecución siguen aplicándose.
Las capacidades y los comandos propiedad de plugins permanecen ocultos hasta que el nodo se actualiza al
protocolo actual. Los nodos anteriores a N-1 requieren una actualización fuera de banda antes de
volver a conectarse.

El transporte HTTPS directo de watchOS requiere la versión actual del protocolo; se debe actualizar
la aplicación del reloj junto con el Gateway antes de activar el modo directo.

## Host de nodo remoto (system.run)

Se usa un **host de nodo** cuando el Gateway se ejecuta en una máquina y se desea ejecutar comandos en otra. El modelo sigue comunicándose con el **Gateway**; el Gateway reenvía las llamadas `exec` al **host de nodo** cuando se selecciona `host=node`.

| Rol             | Responsabilidad                                                        |
| --------------- | ---------------------------------------------------------------------- |
| Host del Gateway | Recibe mensajes, ejecuta el modelo y dirige las llamadas a herramientas. |
| Host de nodo    | Ejecuta `system.run`/`system.which` en la máquina del nodo.        |
| Aprobaciones    | Se aplican en el host de nodo mediante `~/.openclaw/exec-approvals.json`. |

Nota sobre la aprobación:

- Las ejecuciones de nodos respaldadas por aprobación se vinculan al contexto exacto de la solicitud. La ruta de ejecución prepara un `systemRunPlan` canónico antes de la aprobación; una vez concedida, el Gateway reenvía ese plan almacenado, no los campos de comando, directorio de trabajo o sesión que el emisor modifique posteriormente, y vuelve a validar el directorio de trabajo antes de la ejecución.
- Para las ejecuciones directas de archivos mediante shell o entorno de ejecución, OpenClaw también intenta vincular un único operando de archivo local concreto y deniega la ejecución si dicho archivo cambia antes de ejecutarse.
- Si OpenClaw no puede identificar exactamente un archivo local concreto para un comando de intérprete o entorno de ejecución, se deniega la ejecución respaldada por aprobación en lugar de simular una cobertura completa del entorno de ejecución. Para una semántica más amplia del intérprete, se debe usar aislamiento, hosts independientes o una lista de permitidos explícita y de confianza o un flujo de trabajo completo.

### Iniciar un host de nodo (primer plano)

En la máquina del nodo:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` también acepta `--context-path` (ruta de contexto WS del Gateway), `--tls`, `--tls-fingerprint <sha256>` y `--node-id` (sobrescribe el ID heredado de instancia de cliente; esto no restablece el emparejamiento). En macOS, se pasa `--share-installed-apps` para anunciar `device.apps`; el uso compartido está desactivado de forma predeterminada. Se usa `--no-share-installed-apps` para desactivar una habilitación guardada anteriormente.

### Gateway remoto mediante un túnel SSH (vinculación a bucle invertido)

Si el Gateway se vincula a la interfaz de bucle invertido (`gateway.bind=loopback`, valor predeterminado en modo local), los hosts de nodo remotos no pueden conectarse directamente. Se crea un túnel SSH y se dirige el host de nodo al extremo local del túnel.

Ejemplo (host de nodo -> host del Gateway):

```bash
# Terminal A (mantener en ejecución): reenviar el puerto local 18790 -> Gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exportar el token del Gateway y conectarse mediante el túnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notas:

- `openclaw node run` admite autenticación mediante token o contraseña.
- Se prefieren las variables de entorno: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- La configuración alternativa es `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host de nodo ignora intencionadamente `gateway.remote.token` / `gateway.remote.password`.
- En modo remoto, `gateway.remote.token` / `gateway.remote.password` pueden usarse según las reglas de prioridad remota.
- Si se configuran SecretRefs locales `gateway.auth.*` activas pero no se resuelven, la autenticación del host de nodo falla de forma cerrada.
- La resolución de autenticación del host de nodo solo admite las variables de entorno `OPENCLAW_GATEWAY_*`.

### Iniciar un host de nodo (servicio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` también acepta `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (solo el ID heredado de instancia de cliente), `--share-installed-apps` / `--no-share-installed-apps`, `--runtime <node>` (valor predeterminado: nodo) y `--force` para reinstalar. `node status`, `node stop` y `node uninstall` también están disponibles.

### Emparejar y asignar un nombre

En el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si el nodo vuelve a intentarlo con datos de autenticación modificados, se vuelve a ejecutar `openclaw devices list` y se aprueba el `requestId` actual.

Opciones de nombre:

- `--display-name` en `openclaw node run` / `openclaw node install` (se conserva en la fila SQLite compartida `node_host_config` junto con el ID de instancia de cliente y los metadatos de conexión del Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (sobrescritura del Gateway).

### Servidores MCP alojados en nodos

Los servidores MCP se configuran en `openclaw.json` en la máquina del nodo, no en el
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

El host de nodo sin interfaz gráfica inicia estos servidores, enumera sus herramientas y publica
los descriptores después de conectarse. Las llamadas a herramientas regresan a ese nodo mediante
`mcp.tools.call.v1`; el Gateway no necesita una configuración MCP correspondiente ni un
plugin de JS. Los servidores MCP con OAuth no son compatibles con esta ruta v1 alojada en nodos.

Los hosts de nodo actuales declaran la familia de comandos integrada `mcp.tools.call.v1` durante
su emparejamiento inicial, incluso cuando no se ha configurado ningún servidor MCP. Un nodo emparejado con una
versión anterior de OpenClaw puede solicitar una actualización puntual de la superficie de comandos después de
actualizar el host de nodo. Añadir, eliminar o filtrar servidores después de eso no
requiere volver a emparejar, porque la familia de comandos aprobada no cambia. Se reinicia
`openclaw node run` o `openclaw node restart` para aplicar los cambios en la configuración MCP del nodo;
el host de nodo no supervisa esta configuración.

Los operadores del Gateway pueden ignorar todas las herramientas visibles para los agentes publicadas por nodos emparejados,
incluidas las herramientas MCP alojadas en nodos, mediante
`gateway.nodes.pluginTools.enabled: false`. Las denegaciones exactas de comandos, como
`gateway.nodes.commands.deny: ["mcp.tools.call.v1"]`, también bloquean la ejecución.

### Skills alojadas en nodos

Instala las Skills en el directorio activo de Skills de OpenClaw de la máquina del Node,
`~/.openclaw/skills` de forma predeterminada. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` y
`OPENCLAW_CONFIG_PATH` trasladan ese perfil activo. `OPENCLAW_STATE_DIR` tiene
precedencia para las Skills; de lo contrario, `skills/` está junto a la ruta que muestra
`openclaw config file`. El host del Node sin interfaz gráfica publica archivos `SKILL.md` válidos
después de conectarse, y el Gateway los añade a las instantáneas de Skills del agente solo mientras
ese Node permanece conectado. El nombre de cada directorio de Skills debe coincidir con el campo
`name` del frontmatter para que el localizador abstracto del Node se corresponda con una
sola entrada sin añadir otro campo de protocolo.

El emparejamiento inicial con el rol de Node aprueba la publicación de Skills. Añadir, eliminar o
cambiar Skills no requiere otro emparejamiento ni un cambio en la configuración del Gateway.
Reinicia `openclaw node run` o `openclaw node restart` después de cambiar
los archivos de Skills del Node; el host del Node no supervisa el directorio de Skills.

Las entradas de Skills alojadas en el Node identifican su Node e incluyen su ubicación
de ejecución. Los archivos de Skills, las rutas relativas a las que hacen referencia y los binarios
permanecen en ese Node. El agente lee la ubicación `node://.../SKILL.md` anunciada con la
herramienta `read` normal. `file_fetch` acepta rutas absolutas del Node aprobadas por el operador,
no localizadores de Skills del Node; los entornos de ejecución que no dispongan de la herramienta de lectura normal pueden ejecutar
`cat SKILL.md` mediante `exec host=node node=<node-id>` con el directorio
`node://.../skills/<name>` anunciado como `workdir`. Los archivos y binarios
referenciados utilizan el mismo destino y directorio de trabajo de ejecución. El host del Node resuelve ese localizador con respecto
a su directorio de estado activo de OpenClaw, por lo que las rutas relativas se resuelven en el Node y no
en la máquina del Gateway. El Node que publica debe tener aprobado `system.run`,
y la política de ejecución del agente debe permitir `host=node`; de lo contrario, la Skill queda
fuera de la instantánea de ese agente.

Establece `nodeHost.skills.enabled: false` en el Node para detener la publicación. Los operadores del Gateway
pueden ignorar las Skills de todos los Nodes emparejados mediante
`gateway.nodes.allowSkills: false`.

### Estado de identidad sin interfaz gráfica

El Node sin interfaz gráfica mantiene tres registros de estado independientes:

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): el ID de instancia del cliente, el nombre para mostrar y los metadatos de conexión del Gateway.
- `~/.openclaw/state/openclaw.sqlite` (`device_identities`, clave `primary`): el par de claves firmado del dispositivo y el ID criptográfico del dispositivo derivado.
- `~/.openclaw/identity/device-auth.json`: tokens de autenticación de dispositivos emparejados, indexados por ID criptográfico del dispositivo y rol.

Para un Node firmado, el Gateway utiliza el ID criptográfico del dispositivo para el emparejamiento y
el enrutamiento del Node. El ID de instancia del cliente es solo un metadato de conexión. Por lo tanto, cambiar
`--node-id` o migrar un `node.json` retirado no restablece el emparejamiento. Consulta
[Estado de identidad y emparejamiento](/es/cli/node#identity-and-pairing-state) para conocer el
flujo admitido de revocación y nuevo emparejamiento, así como las notas de actualización.

Un archivo `identity/device.json` retirado o una reclamación interrumpida de Doctor bloquean el uso normal
de la identidad. Detén el host del Node y ejecuta `openclaw doctor --fix`; Doctor importa
el par de claves validado en SQLite antes de eliminar el archivo antiguo. La migración de identidad
no modifica `identity/device-auth.json`.

### Añadir los comandos a la lista de permitidos

Las aprobaciones de ejecución son **específicas de cada host del Node**. Añade entradas a la lista de permitidos desde el Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Las aprobaciones se almacenan en el host del Node en `~/.openclaw/exec-approvals.json`.

### Dirigir la ejecución al Node

Configura los valores predeterminados (configuración del Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.mode allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

O por sesión:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Una vez configurado, cualquier llamada a `exec` con `host=node` se ejecuta en el host del Node (sujeta a la lista de permitidos y las aprobaciones del Node).

`host=auto` no elegirá implícitamente el Node por sí solo, pero se permite una solicitud explícita por llamada de `host=node` desde `auto`. Si se desea que la ejecución en el Node sea la predeterminada para la sesión, establece explícitamente `tools.exec.host=node` o `/exec host=node ...`.

Relacionado:

- [CLI del host del Node](/es/cli/node)
- [Herramienta de ejecución](/es/tools/exec)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)

### Inferencia de modelos locales

Un Node de escritorio o servidor puede exponer modelos con capacidad de chat desde un servidor Ollama que se ejecute en ese Node. Los agentes utilizan la herramienta `node_inference` del Plugin de Ollama para detectar los modelos instalados y ejecutar de forma remota un prompt limitado; el Gateway no necesita acceso directo de red a Ollama. Consulta [Inferencia local del Node con Ollama](/es/providers/ollama#node-local-inference) para obtener instrucciones de configuración, filtrado de modelos y comandos de verificación directa.

### Sesiones y transcripciones de Codex

El Plugin oficial `codex` puede exponer sesiones de Codex no archivadas en un
host del Node sin interfaz gráfica o en un Node nativo de macOS. El registro del catálogo ya no depende
de `supervision.enabled`; esa opción controla las herramientas de supervisión orientadas al agente.
Establece `sessionCatalog.enabled: false` en la configuración del Plugin de Codex para desactivar los
comandos del catálogo del operador y del catálogo de Nodes emparejados sin desactivar el
proveedor ni el arnés.
El Plugin debe seguir activo en ambos equipos, y la configuración del Node continúa siendo
un consentimiento local: habilitar solo el Gateway no permite leer el estado de Codex de otro equipo.

El Node anuncia los comandos versionados de solo lectura
`codex.appServer.threads.list.v1` y
`codex.appServer.thread.turns.list.v1`. Un host del Node nativo que también disponga de la
CLI de Codex anuncia `codex.terminal.resume.v1`. Aprueba la actualización del emparejamiento del Node
cuando estos comandos aparezcan por primera vez. El Gateway los invoca mediante la
política normal de Nodes del Plugin y aísla los fallos por host.

Las filas de Nodes emparejados aparecen como un grupo **Codex** en la barra lateral normal de sesiones.
Dentro de cada host, las filas se agrupan de forma predeterminada por carpeta de proyecto; un directorio de trabajo
bajo `.claude/worktrees/<name>` se integra en su repositorio de origen, y los grupos de
proyectos se contraen como las demás secciones de la barra lateral. Utiliza el icono de carpeta del encabezado del catálogo
para aplanar o restaurar los grupos de proyectos. La misma agrupación se aplica al
catálogo de sesiones de Claude.
De forma predeterminada, al seleccionar una fila se abre el panel normal de chat y se lee su transcripción persistente
mediante llamadas limitadas a `thread/turns/list`, paginadas por cursor y con proyección completa de elementos. Utiliza el menú de la fila, el encabezado del visor o la preferencia **Abrir sesiones de Codex/Claude en** para iniciar `codex resume <thread-id>` en el terminal del operador del equipo propietario de la sesión. La ruta de terminal del Node emparejado es un relé PTY incluido en la lista de permitidos y propiedad del Plugin de Codex, no una ejecución arbitraria de comandos del Node.

El relé no proporciona todos los contratos de continuación del arnés y propiedad del archivo de OpenClaw. Por tanto, **Continuar** y **Archivar** no están disponibles para las filas remotas. En el equipo del Gateway, las filas almacenadas e inactivas
pueden iniciar una rama de chat distinta y fijada al modelo. Cualquiera de ellas puede archivarse solo
después de que el operador confirme que ningún otro cliente de Codex la está utilizando; se desconoce
la actividad en vivo de una fila almacenada. Las filas activas no pueden ramificarse ni archivarse.

Consulta [Supervisar sesiones de Codex](/es/plugins/codex-supervision) para obtener información sobre la configuración,
la paginación, la continuación local y el límite de seguridad de los metadatos.

### Sesiones y transcripciones de Claude

El Plugin incluido `anthropic` detecta de forma predeterminada las sesiones no archivadas de la CLI de Claude y Claude
Desktop en el Gateway y en los Nodes emparejados. Establece
`plugins.entries.anthropic.config.sessionCatalog.enabled: false` para desactivar los
comandos del catálogo del operador y del catálogo de Nodes emparejados sin desactivar los modelos de Anthropic
ni el backend de la CLI de Claude.
Un Node remoto de la aplicación de macOS anuncia
`anthropic.claude.sessions.list.v1` y `anthropic.claude.sessions.read.v1`
cuando el Plugin de Anthropic está habilitado y existe `~/.claude/projects/`. Aprueba
la actualización del emparejamiento del Node cuando estos comandos aparezcan por primera vez.

Un host del Node nativo que disponga de la CLI de Claude también anuncia
`anthropic.claude.terminal.resume.v1`. Las filas aptas de la CLI y Desktop pueden abrir
`claude --resume <session-id>` en el terminal del operador de su host propietario.
Esto toma el control de la sesión nativa; a diferencia de la adopción de OpenClaw, no
bifurca primero la sesión de Claude.

El catálogo combina registros válidos del índice de proyectos de la CLI de Claude con un respaldo limitado
de metadatos para transcripciones JSONL no indexadas. Ese respaldo reconoce sesiones simultáneas
interactivas que no son cadenas secundarias (`cli`) y sesiones sin interfaz gráfica de la CLI del Agent SDK
(`sdk-cli`). Los metadatos locales de Claude Desktop proporcionan los títulos y el estado de archivo de Desktop.
Los metadatos de Desktop prevalecen cuando ambas fuentes hacen referencia al mismo ID de sesión de Claude Code;
las transcripciones exclusivas de la CLI siguen visibles porque la CLI no tiene un indicador de archivo.
Las lecturas de transcripciones utilizan cursores opacos de desplazamiento de bytes y lecturas de archivos hacia atrás
limitadas, por lo que seleccionar una sesión grande o cargar una página anterior no lee todo el historial JSONL
en una sola respuesta del Gateway.

Los comandos de listado y lectura son de solo lectura. Exponen los metadatos del catálogo y el contenido de las transcripciones
solo mediante los métodos genéricos `sessions.catalog.list` y
`sessions.catalog.read` a una conexión autenticada del operador con
`operator.write`. Una fila de la CLI de Claude local al Gateway puede adoptarse desde el compositor normal
del chat: OpenClaw importa un historial visible limitado, reanuda con
`--fork-session` en el primer turno y no modifica la transcripción de origen.

Un host del Node sin interfaz gráfica puede optar por el mismo flujo de continuación:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

El Node anuncia `agent.cli.claude.run.v1` solo cuando esta configuración local del Node
está habilitada y el ejecutable `claude` se resuelve en ese Node. El Gateway no puede
habilitarlo de forma remota. El comando también pasa por la política de aprobación de ejecución existente
del Node. Cuando los tres comandos de Claude están anunciados y permitidos por
la política de comandos de Nodes del Gateway, una fila de la CLI de Claude
en ese Node pasa a ser continuable: OpenClaw importa un historial limitado, vincula
la sesión adoptada al Node y al directorio de trabajo indicado por su catálogo, y
ejecuta allí cada turno único de `claude -p`. El primer turno sigue utilizando
`--fork-session`, lo que conserva la transcripción de origen.

Los turnos ejecutados en el Node utilizan los valores predeterminados de Claude del Node. En v1 no reciben la
configuración MCP de bucle invertido del Gateway ni el Plugin de Skills del Gateway, no pueden reinicializarse desde una
transcripción del Gateway y rechazan archivos adjuntos e imágenes. Las filas de Claude Desktop y
los Nodes que no anuncien el comando de ejecución permanecen en modo de solo visualización. El Node de la aplicación de
macOS aún no anuncia este comando, por lo que sus filas permanecen en modo de solo visualización.

Consulta [Anthropic: sesiones de Claude entre equipos](/es/providers/anthropic#claude-sessions-across-computers)
para conocer el comportamiento de la interfaz de control y las fuentes de almacenamiento.

### Sesiones de OpenCode y Pi

Los Plugins incluidos de OpenCode y ACPX también detectan catálogos de sesiones nativas
de solo lectura en el Gateway y en los Nodes emparejados. Un Node anuncia
`opencode.sessions.list.v1` / `opencode.sessions.read.v1` cuando la CLI `opencode`
está instalada, y `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`
cuando existe el directorio de sesiones de Pi. Aprueba la actualización del emparejamiento del Node cuando aparezcan
nuevos comandos por primera vez. Cuando la CLI correspondiente también está disponible, el Node añade
`opencode.terminal.resume.v1` o `acpx.pi.terminal.resume.v1`; el menú de fila
y el encabezado del visor existentes pueden volver a abrir la sesión seleccionada en su terminal
propietario mediante `opencode --session <id>` o `pi --session <id>`.

OpenCode realiza las lecturas mediante su superficie oficial de CLI JSON/exportación. Pi lee su
almacén de sesiones JSONL documentado, incluidos los directorios de sesiones `settings.json`
de proyecto y globales, además de las sustituciones `PI_CODING_AGENT_DIR` y
`PI_CODING_AGENT_SESSION_DIR`. Ambos catálogos están habilitados de forma predeterminada;
desactívalos en la interfaz web, en **Config > Plugins**.

La reanudación en el terminal utiliza el directorio de trabajo almacenado de la sesión y el mismo
relé PTY bidireccional incluido en la lista de permitidos que Codex y Claude. No expone la ejecución arbitraria
de comandos del Node.

### Cargas de archivos del terminal

La interfaz de control permite arrastrar archivos a una terminal abierta de un Node emparejado. El host nativo del Node anuncia el comando exclusivo para administradores `terminal.upload`; apruebe la actualización del emparejamiento cuando aparezca por primera vez. Cada archivo está limitado a 16 MiB, se almacena temporalmente en un directorio privado del Node y se devuelve a la terminal como una ruta entrecomillada para el shell, sin ejecutarlo.

La inserción de rutas admite PowerShell, `cmd.exe` y shells POSIX reconocidos (`sh`, Bash, Dash, Ash, Ksh, Zsh y Fish), incluido Git Bash en Windows. Se rechazan otras sustituciones del shell porque sus reglas de entrecomillado no pueden inferirse de forma segura; ejecute el host del Node dentro de WSL para obtener rutas nativas de WSL. También se rechazan las rutas `cmd.exe` que contienen `%` o `!`, porque ese shell expande esos caracteres incluso dentro de comillas dobles.

## Invocación de comandos

Nivel bajo (RPC sin procesar):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` bloquea `system.run` y `system.run.prepare`; esos comandos solo se ejecutan mediante la herramienta `exec` con `host=node` (consulte la información anterior). Existen funciones auxiliares de nivel superior para los flujos de trabajo habituales de «proporcionar al agente un archivo adjunto MEDIA» (Canvas, cámara, pantalla y ubicación, descritos más adelante).

Los comandos de Node de larga duración con transmisión usan eventos `node.invoke.progress`
aditivos. Cada evento contiene el ID de invocación, un número de secuencia de base
cero y un fragmento de texto UTF-8 de tamaño limitado; el Gateway ordena los fragmentos
antes de entregárselos al autor de la llamada. El `node.invoke.result` existente sigue
siendo la única respuesta terminal. Los autores de llamadas con transmisión pueden
establecer un plazo de inactividad que comienza con el primer evento de progreso y se
reinicia tras cada progreso posterior, mientras se conserva el tiempo de espera máximo
independiente de la invocación durante la aprobación y la ejecución. El resultado, el
tiempo de espera máximo, el tiempo de espera por inactividad y la desconexión del Node
descartan todo el estado de transmisión pendiente. La cancelación por parte del autor
de la llamada emite `node.invoke.cancel`; a continuación, el host del Node finaliza el
árbol de procesos correspondiente. Los comandos existentes de solicitud y respuesta no cambian.

## Política de comandos

Los comandos de Node deben superar dos controles antes de poder invocarse:

1. El Node debe declarar el comando en sus metadatos de conexión autenticados (`connect.commands`).
2. La lista de permitidos del Gateway derivada de la plataforma y la aprobación debe incluir el comando declarado.

Listas de permitidos predeterminadas por plataforma (antes de los valores predeterminados de los plugins y las sustituciones `commands.allow`/`commands.deny`):

| Plataforma | Comandos permitidos de forma predeterminada                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `device.apps`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                         |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (los comandos del host del Node, como `system.run`, requieren aprobación; consulte la información siguiente)                                                                                                                                                                                                                                  |

Estas filas describen el límite máximo de la política del Gateway, no los comandos implementados por cada aplicación de Node. Un comando solo puede utilizarse cuando el Node conectado también lo declara. En particular, la aplicación actual de macOS no declara las familias de dispositivos y datos personales indicadas en la fila de la política de macOS.

Los comandos `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) son un valor predeterminado de plugin en iOS, Android, macOS, Windows, Linux y plataformas desconocidas. Los Nodes de Linux solo los declaran cuando está presente el socket local de Canvas de la aplicación de escritorio. Todos los comandos de Canvas están restringidos al primer plano en iOS.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once` se permiten de forma predeterminada para cualquier Node que anuncie la capacidad `talk` o declare comandos `talk.*`, independientemente de la etiqueta de la plataforma.

Los comandos del host de escritorio (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` y `screen.snapshot` en macOS/Windows/Linux) no forman parte de la tabla estática de valores predeterminados por plataforma anterior. Pasan a estar disponibles cuando el operador aprueba una solicitud de emparejamiento que los declara; a partir de entonces, el conjunto de comandos aprobados del Node los conserva al volver a conectarse.

Los comandos peligrosos o con un gran impacto en la privacidad siguen requiriendo una habilitación explícita mediante `gateway.nodes.commands.allow`, incluso si un Node los declara: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.commands.deny` siempre prevalece sobre los valores predeterminados y las entradas adicionales de la lista de permitidos. Consulte [Resúmenes de HealthKit](/es/platforms/ios-healthkit) para obtener información sobre el control de consentimiento del iPhone y [Uso del ordenador](/es/nodes/computer-use) para conocer los controles adicionales de capacidad, política de herramientas, habilitación y ejecutor de plataforma relacionados con la entrada de escritorio.

Los comandos de Node pertenecientes a plugins pueden añadir una política de invocación de Nodes del Gateway. Esa política se ejecuta después de comprobar la lista de permitidos y antes de reenviar la solicitud al Node, por lo que `node.invoke` sin procesar, las funciones auxiliares de la CLI y las herramientas específicas de agentes comparten el mismo límite de permisos del plugin. Los comandos peligrosos de Node pertenecientes a plugins siguen requiriendo una habilitación explícita mediante `gateway.nodes.commands.allow`.

Después de que un Node cambie su lista de comandos declarados, rechace el emparejamiento anterior del dispositivo y apruebe la nueva solicitud para que el Gateway almacene la instantánea de comandos actualizada.

## Configuración (`openclaw.json`)

Los ajustes relacionados con Nodes se encuentran en `gateway.nodes` y `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Aprobar automáticamente el emparejamiento inicial de Nodes desde redes de confianza (lista CIDR).
      // Está desactivado cuando no se establece. Solo se aplica a solicitudes role:node iniciales
      // sin ámbitos solicitados; no aprueba automáticamente las actualizaciones.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // Aprobación automática verificada mediante SSH (valor predeterminado: activada). Aprueba el
        // emparejamiento inicial del Node cuando la clave del dispositivo leída mediante SSH coincide exactamente.
        sshVerify: true,
      },
      // Confiar en las herramientas de plugins visibles para agentes que publican los Nodes emparejados (valor predeterminado: true).
      pluginTools: {
        enabled: true,
      },
      // Habilitar comandos de Node peligrosos o con un gran impacto en la privacidad (camera.snap, etc.).
      commands: {
        allow: ["camera.snap", "screen.record"],
        // Bloquear nombres de comandos exactos aunque los valores predeterminados o commands.allow los incluyan.
        deny: ["camera.clip"],
      },
    },
  },
  tools: {
    exec: {
      // Host de ejecución predeterminado: "node" dirige todas las llamadas de ejecución a un Node emparejado.
      host: "node",
      // Modo de seguridad para la ejecución en Nodes: permitir solo comandos aprobados o incluidos en la lista de permitidos.
      security: "allowlist",
      // Fijar la ejecución a un Node específico (ID o nombre). Omitir para permitir cualquier Node.
      node: "build-node",
    },
  },
}
```

Utilice los nombres exactos de los comandos de Node. `commands.deny` elimina un comando incluso cuando un valor predeterminado de plataforma o una entrada `commands.allow` lo permitiría en otras circunstancias. Los Nodes emparejados pueden publicar de forma predeterminada descriptores de herramientas de plugins visibles para agentes, pero el comando de cada descriptor debe seguir formando parte de la superficie de comandos aprobada del Node. Establezca `gateway.nodes.pluginTools.enabled: false` para ignorar todos esos descriptores. Consulte la [Referencia de configuración del Gateway](/es/gateway/configuration-reference#gateway) para obtener detalles sobre los campos de emparejamiento de Nodes y de la política de comandos del Gateway.

Sustitución del Node de ejecución por agente:

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

## Capturas de pantalla (instantáneas de Canvas)

Si el Node muestra Canvas (WebView), `canvas.snapshot` devuelve `{ format, base64 }`.

Función auxiliar de la CLI (escribe en un archivo temporal e imprime la ruta guardada):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Controles de Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Notas:

- `canvas present` acepta URL o rutas de archivos locales (`--target`) en Nodes que admiten rutas locales, además de `--x/--y/--width/--height` opcional para el posicionamiento. Canvas de Linux acepta URL HTTP(S) o su renderizador A2UI incluido.
- `canvas eval` acepta JS en línea (`--js`) o un argumento posicional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hola"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notas:

- Los Nodes móviles y de escritorio Linux usan una página A2UI incluida y perteneciente a la aplicación para el renderizado con acciones.
- Solo se admite JSONL de A2UI v0.8 (se rechaza v0.9/createSurface).
- iOS y Android renderizan páginas remotas de Canvas del Gateway, pero las acciones de los botones de A2UI solo se envían desde la página A2UI incluida y perteneciente a la aplicación. En esos clientes móviles, las páginas A2UI HTTP/HTTPS alojadas en el Gateway son solo de renderizado.
- macOS puede enviar acciones desde la página A2UI exacta del Gateway, limitada por capacidades y seleccionada por la aplicación. Las demás páginas HTTP/HTTPS siguen siendo solo de renderizado.
- Linux solo envía acciones desde la página A2UI incluida. Las demás páginas HTTP/HTTPS siguen siendo solo de renderizado, y un Node Linux sin interfaz gráfica que no tenga la aplicación de escritorio no anuncia Canvas.

## Fotos y vídeos (cámara del Node)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # valor predeterminado: ambas orientaciones (2 líneas MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Clips de vídeo (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notas:

- El nodo debe estar **en primer plano** para `canvas.*` y `camera.*` (las llamadas en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE`).
- Los nodos limitan la duración de los clips para mantener manejable la carga útil en base64 (consulte [Captura de cámara](/es/nodes/camera) para conocer los límites exactos de cada plataforma). La herramienta de agente `nodes` también limita el valor solicitado de `durationMs` a 300000 (5 minutos) antes de reenviar la llamada; el propio nodo aplica el límite más estricto.
- Android solicitará los permisos de `CAMERA`/`RECORD_AUDIO` cuando sea posible; si se deniegan, se producirá un error con `*_PERMISSION_REQUIRED`.

## Grabaciones de pantalla (nodos)

Los nodos compatibles exponen `screen.record` (mp4). Ejemplo:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notas:

- La disponibilidad de `screen.record` depende de la plataforma del nodo.
- La herramienta de agente `nodes` limita el valor solicitado de `durationMs` a 300000 (5 minutos); el nodo puede aplicar un límite más estricto para acotar la carga útil devuelta.
- `--no-audio` desactiva la captura del micrófono en las plataformas compatibles.
- Utilice `--screen <index>` para seleccionar una pantalla cuando haya varias disponibles (0 = principal).

## Ubicación (nodos)

Los nodos exponen `location.get` cuando la ubicación está habilitada en la configuración.

Asistente de CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notas:

- La ubicación está **desactivada de forma predeterminada**.
- «Always» requiere permiso del sistema; la obtención en segundo plano se realiza con el mejor esfuerzo.
- La respuesta incluye latitud/longitud, precisión (metros) y marca de tiempo.
- Estructura completa de parámetros/respuesta y códigos de error: [Comando de ubicación](/es/nodes/location-command).

## SMS (nodos Android)

Los nodos Android pueden exponer `sms.send` y `sms.search` cuando el usuario concede el permiso de **SMS** y el dispositivo admite telefonía. Ambos comandos son peligrosos de forma predeterminada: el operador del Gateway también debe añadirlos a `gateway.nodes.commands.allow` antes de poder invocarlos (consulte [Política de comandos](#command-policy)).

Para la búsqueda de SMS de solo lectura, habilítela explícitamente en `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      commands: { allow: ["sms.search"] },
    },
  },
}
```

Añada `sms.send` por separado solo cuando el nodo también deba poder enviar mensajes. El permiso de Android y la autorización de comandos del Gateway son independientes; conceder el permiso del teléfono no modifica la política del Gateway.

Invocación de bajo nivel:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notas:

- `sms.search` puede declararse antes de que se conceda `READ_SMS`, de modo que una invocación pueda devolver un diagnóstico de permisos; la lectura de mensajes sigue requiriendo ese permiso de Android.
- Los dispositivos que solo disponen de Wi-Fi y carecen de telefonía no anunciarán `sms.send`.
- Un error `requires explicit gateway.nodes.commands.allow opt-in` significa que el teléfono declaró el comando, pero el operador del Gateway no lo ha autorizado.

## Comandos de datos personales y del dispositivo

Los nodos iOS y Android anuncian de forma predeterminada varios comandos de datos de solo lectura (consulte la tabla de [Política de comandos](#command-policy)); Android también expone una familia más amplia controlada por su propia configuración dentro de la aplicación. Un host de nodo TypeScript de macOS o macOS sin interfaz anuncia `device.apps` únicamente después de que el operador habilite el uso compartido de aplicaciones instaladas mediante `--share-installed-apps`.

Familias disponibles:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health` — solo Android.
- `device.apps` — nodos Android, macOS y macOS sin interfaz. Android requiere habilitar el uso compartido de aplicaciones instaladas en Settings y devuelve de forma predeterminada las aplicaciones visibles en el iniciador. Los hosts de nodo TypeScript mantienen deshabilitado el uso compartido de forma predeterminada y aceptan `query`, `limit` y `includeSystem`; los resultados de macOS contienen `label`, `bundleId`, `path` y `system`.
- `notifications.list`, `notifications.actions` — solo Android.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (solo lectura de forma predeterminada); `contacts.add` es peligroso y necesita `gateway.nodes.commands.allow`.
- `calendar.events` — iOS, Android (solo lectura de forma predeterminada); `calendar.add` es peligroso y necesita `gateway.nodes.commands.allow`.
- `reminders.list` — iOS, Android (solo lectura de forma predeterminada); `reminders.add` es peligroso y necesita `gateway.nodes.commands.allow`.
- `callLog.search` — solo Android.
- `motion.activity`, `motion.pedometer` — iOS, Android; sujetos a las capacidades de los sensores disponibles.

Ejemplos de invocación:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Comandos del sistema (host de nodo/nodo Mac)

El nodo macOS expone `system.run`, `system.which`, `system.notify` y `system.execApprovals.get/set`. El host de nodo sin interfaz expone `system.run.prepare`, `system.run`, `system.which` y `system.execApprovals.get/set`.

Ejemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Notas:

- `system.run` devuelve la salida estándar, la salida de error y el código de salida en la carga útil.
- La ejecución del shell ahora pasa por la herramienta `exec` con `host=node`; `nodes` sigue siendo la superficie RPC directa para comandos de nodo explícitos.
- `nodes invoke` no expone `system.run` ni `system.run.prepare`; estos permanecen exclusivamente en la ruta de ejecución.
- La ruta de ejecución prepara un `systemRunPlan` canónico antes de la aprobación. Una vez concedida la aprobación, el Gateway reenvía ese plan almacenado, no los campos de comando/cwd/sesión que el llamador modifique posteriormente.
- `system.notify` respeta el estado del permiso de notificaciones en la aplicación de macOS; admite `--priority <passive|active|timeSensitive>` y `--delivery <system|overlay|auto>`.
- Los metadatos de nodo `platform` / `deviceFamily` no reconocidos utilizan una lista de permitidos predeterminada conservadora que excluye `system.run` y `system.which`. Si necesita intencionadamente esos comandos para una plataforma desconocida, añádalos explícitamente mediante `gateway.nodes.commands.allow`.
- `system.run` admite `--cwd`, `--env KEY=VAL`, `--command-timeout` y `--needs-screen-recording`.
- Para los envoltorios de shell (`bash|sh|zsh ... -c/-lc`), los valores de `--env` con ámbito de solicitud se reducen a una lista de permitidos explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para las decisiones de permitir siempre en el modo de lista de permitidos, los envoltorios de despacho conocidos (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan las rutas de los ejecutables internos en lugar de las rutas de los envoltorios. Si no es seguro desenvolverlos, no se conserva automáticamente ninguna entrada en la lista de permitidos.
- En los hosts de nodo Windows que utilizan el modo de lista de permitidos, las ejecuciones de envoltorios de shell mediante `cmd.exe /c` requieren aprobación (una entrada en la lista de permitidos por sí sola no permite automáticamente la forma con envoltorio).
- Los hosts de nodo ignoran las sustituciones de `PATH` en `--env` y eliminan un conjunto amplio y mantenido de variables de inicio de intérpretes/shells (por ejemplo, `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) antes de ejecutar un comando. Si necesita entradas adicionales en PATH, configure el entorno del servicio del host de nodo (o instale las herramientas en ubicaciones estándar) en lugar de pasar `PATH` mediante `--env`.
- En el modo de nodo de macOS, `system.run` está sujeto a las aprobaciones de ejecución de la aplicación de macOS (Settings → Exec approvals). Los modos de preguntar/lista de permitidos/completo se comportan igual que en el host de nodo sin interfaz; las solicitudes denegadas devuelven `SYSTEM_RUN_DENIED`.
- En el host de nodo sin interfaz, `system.run` está sujeto a las aprobaciones de ejecución (`~/.openclaw/exec-approvals.json`); específicamente en macOS, consulte las variables de entorno de enrutamiento del host de ejecución en [Host de nodo sin interfaz](#headless-node-host-cross-platform), más adelante.

## Vinculación del nodo de ejecución

Cuando hay varios nodos disponibles, se puede vincular la ejecución a un nodo específico. Esto establece el nodo predeterminado para `exec host=node` (y se puede sustituir por agente).

Valor predeterminado global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Sustitución por agente:

```bash
openclaw config get agents.entries
openclaw config set 'agents.entries.main.tools.exec.node' "node-id-or-name"
```

Elimine la configuración para permitir cualquier nodo:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.entries.main.tools.exec.node'
```

## Mapa de permisos

Los nodos pueden incluir un mapa `permissions` en `node.list` / `node.describe`, indexado por nombre de permiso (por ejemplo, `screenRecording`, `accessibility`, `location`) con valores booleanos (`true` = concedido).

## Host de nodo sin interfaz (multiplataforma)

OpenClaw puede ejecutar un **host de nodo sin interfaz** (sin interfaz de usuario) que se conecta al WebSocket del Gateway y expone `system.run` / `system.which`. Esto resulta útil en Linux/Windows o para ejecutar un nodo mínimo junto a un servidor.

Inícielo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notas:

- El emparejamiento sigue siendo obligatorio (el Gateway mostrará una solicitud de emparejamiento de dispositivo).
- Los metadatos de la instancia del cliente, la identidad firmada del dispositivo y la autenticación de emparejamiento utilizan registros de estado independientes; consulte [Estado de identidad sin interfaz](#headless-identity-state).
- Las aprobaciones de ejecución se aplican localmente mediante `~/.openclaw/exec-approvals.json` (consulte [Aprobaciones de ejecución](/es/tools/exec-approvals)).
- En macOS, el host de nodo sin interfaz ejecuta `system.run` localmente de forma predeterminada. Establezca `OPENCLAW_NODE_EXEC_HOST=app` para enrutar `system.run` mediante el host de ejecución de la aplicación complementaria; añada `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir el host de la aplicación y denegar de forma segura si no está disponible.
- Añada `--tls` / `--tls-fingerprint` cuando el WebSocket del Gateway utilice TLS.

## Modo de nodo Mac

- La aplicación de la barra de menús de macOS se conecta al servidor WebSocket del Gateway como nodo (por lo que `openclaw nodes …` funciona con este Mac).
- En modo remoto, la aplicación abre un túnel SSH para el puerto del Gateway y se conecta a `localhost`.
