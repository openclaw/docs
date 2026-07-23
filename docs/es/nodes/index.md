---
read_when:
    - Emparejamiento de nodos iOS/watchOS/Android con un Gateway
    - Uso del lienzo/la cámara del Node para el contexto del agente
    - Adición de nuevos comandos de Node o auxiliares de la CLI
summary: 'Nodos: emparejamiento, capacidades, permisos y utilidades de la CLI para lienzo/cámara/pantalla/dispositivo/notificaciones/sistema'
title: Nodos
x-i18n:
    generated_at: "2026-07-22T20:05:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b4f7c80491d713777e1ba5b8f55c88bd9fa48be602b504e6ac6ba00cd12a4313
    source_path: nodes/index.md
    workflow: 16
---

Un **nodo** es un dispositivo complementario (macOS/iOS/watchOS/Android/sin interfaz gráfica) que se conecta al Gateway con `role: "node"` y expone una superficie de comandos (p. ej., `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) mediante `node.invoke`. La mayoría de los nodos usan el WebSocket del Gateway en el puerto del operador. El nodo directo opcional de Apple Watch usa sondeos HTTPS firmados en ese mismo puerto porque watchOS bloquea las redes genéricas de bajo nivel para las aplicaciones comunes. Detalles del protocolo: [Protocolo del Gateway](/es/gateway/protocol).

Transporte heredado: [Protocolo Bridge](/es/gateway/bridge-protocol) (JSONL sobre TCP; solo de interés histórico para los nodos actuales).

macOS también puede ejecutarse en **modo nodo**: la aplicación de la barra de menús se conecta al servidor
WS del Gateway como un nodo (por lo que `openclaw nodes …` funciona en este Mac). La aplicación
añade comandos nativos de Canvas, cámara, pantalla, notificaciones y control del equipo
a la misma superficie de comandos del host de nodo que usa `openclaw node run`. No inicie un
segundo nodo de CLI en ese Mac; la aplicación ejecuta el entorno de ejecución correspondiente del host de nodo de CLI como
un proceso interno y sigue siendo la única conexión al Gateway y la única identidad de nodo.

Los nodos son **periféricos**, no gateways: no ejecutan el servicio del Gateway, y los mensajes de los canales (Telegram, WhatsApp, etc.) llegan al Gateway, no a los nodos.

Guía de resolución de problemas: [/nodes/troubleshooting](/es/nodes/troubleshooting)

## Emparejamiento y estado

Los nodos usan **emparejamiento de dispositivos**. Durante la conexión, un nodo presenta una identidad de dispositivo firmada; el Gateway crea una solicitud de emparejamiento de dispositivo para `role: node`. Apruébela mediante la CLI de dispositivos (o la interfaz de usuario). La configuración directa de Apple Watch usa un código de configuración de corta duración, exclusivo para nodos y generado por un administrador, para aprobar su superficie fija de comandos de bajo riesgo; cualquier ampliación posterior de las capacidades sigue requiriendo la aprobación normal.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Las solicitudes de emparejamiento pendientes caducan 5 minutos después del último reintento del dispositivo: si un dispositivo sigue reconectándose, mantiene activa su única solicitud pendiente (y `requestId`) en lugar de generar una nueva solicitud cada pocos minutos; consulte [Emparejamiento de nodos](/es/gateway/pairing) para conocer el ciclo completo de solicitud y aprobación. Si un nodo vuelve a intentarlo con datos de autenticación modificados (rol/ámbitos/clave pública), la solicitud pendiente anterior se sustituye y se crea un nuevo `requestId`; los clientes reciben un evento `device.pair.resolved` para la solicitud sustituida y se debe volver a ejecutar `openclaw devices list` antes de aprobarla.

- `nodes status` marca un nodo como **emparejado** cuando su rol de emparejamiento de dispositivo incluye `node`.
- Un Mac nativo conectado puede habilitar la actividad agrupada de entrada física desde
  **Settings -> Permissions -> Active computer detection**. También se requiere
  Accesibilidad. El Gateway marca el Mac válido con actividad más reciente como
  `active`, proporciona al agente una indicación estable del identificador del nodo y dirige allí las alertas de conexión
  del nodo antes de recurrir a una alternativa con retraso. Consulte
  [Presencia del equipo activo](/es/nodes/presence) para obtener información sobre la configuración, la privacidad, los tiempos y la
  resolución de problemas.
- El registro de emparejamiento del dispositivo constituye el contrato duradero de roles aprobados. La rotación de tokens permanece dentro de ese contrato; no puede elevar un nodo emparejado a un rol que la aprobación del emparejamiento nunca concedió.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) es un almacén independiente de emparejamientos de nodos, propiedad del Gateway, que registra la superficie de comandos y capacidades aprobada del nodo entre reconexiones. **No** controla la autenticación del transporte; de ello se encarga el emparejamiento del dispositivo.
- `openclaw nodes remove --node <id|name|ip>` elimina el emparejamiento de un nodo. En un nodo respaldado por un dispositivo, revoca el rol `node` del dispositivo en el almacén de dispositivos emparejados y desconecta las sesiones de ese dispositivo con rol de nodo: un dispositivo con varios roles conserva su fila y solo pierde el rol `node`, mientras que se elimina la fila de un dispositivo que solo tiene el rol de nodo. También borra cualquier entrada coincidente del almacén independiente de emparejamientos de nodos. `operator.pairing` puede eliminar filas de nodos sin rol de operador en otros dispositivos; un solicitante con token de dispositivo que revoque su propio rol de nodo en un dispositivo con varios roles necesita además `operator.admin`.
- El ámbito de aprobación se ajusta a los comandos declarados en la solicitud pendiente:
  - solicitud sin comandos: `operator.pairing`
  - comandos de nodo que no son de ejecución: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Diferencias de versión y orden de actualización

El WebSocket del Gateway acepta clientes de nodo autenticados dentro de una ventana de protocolo N-1.
Por tanto, el Gateway v4 actual acepta nodos v3 cuando la conexión declara
tanto `role: "node"` como `client.mode: "node"`. Las sesiones del operador y de la interfaz de usuario deben
seguir usando el protocolo actual.

Para las actualizaciones por etapas de una flota, actualice primero el Gateway y después cada nodo.
Un nodo N-1 permanece visible y administrable mientras se actualiza; el Gateway
registra `legacy node protocol accepted` con una recomendación de actualización. Se siguen aplicando el emparejamiento,
la autenticación de dispositivos, las listas de comandos permitidos y las aprobaciones de ejecución.
Las capacidades y los comandos propiedad de plugins permanecen ocultos hasta que el nodo se actualiza al
protocolo actual. Los nodos anteriores a N-1 requieren una actualización fuera de banda antes de
volver a conectarse.

El transporte HTTPS directo de watchOS requiere la versión actual del protocolo; actualice
la aplicación del reloj junto con el Gateway antes de habilitar el modo directo.

## Host de nodo remoto (system.run)

Use un **host de nodo** cuando el Gateway se ejecute en una máquina y se desee ejecutar comandos en otra. El modelo sigue comunicándose con el **Gateway**; el Gateway reenvía las llamadas a `exec` al **host de nodo** cuando se selecciona `host=node`.

| Rol              | Responsabilidad                                                              |
| ---------------- | ---------------------------------------------------------------------------- |
| Host del Gateway | Recibe mensajes, ejecuta el modelo y dirige las llamadas a herramientas.     |
| Host de nodo     | Ejecuta `system.run`/`system.which` en la máquina del nodo.        |
| Aprobaciones     | Se aplican en el host de nodo mediante `~/.openclaw/exec-approvals.json`.                   |

Nota sobre la aprobación:

- Las ejecuciones de nodos sujetas a aprobación vinculan el contexto exacto de la solicitud. La ruta de ejecución prepara un `systemRunPlan` canónico antes de la aprobación; una vez concedida, el Gateway reenvía ese plan almacenado, no los campos de comando, directorio de trabajo o sesión que el solicitante haya modificado posteriormente, y vuelve a validar el directorio de trabajo antes de la ejecución.
- Para las ejecuciones directas de archivos mediante shell o entorno de ejecución, OpenClaw también intenta vincular un único operando de archivo local concreto y deniega la ejecución si ese archivo cambia antes de ejecutarse.
- Si OpenClaw no puede identificar exactamente un archivo local concreto para un comando de intérprete o entorno de ejecución, se deniega la ejecución sujeta a aprobación en lugar de simular una cobertura completa del entorno de ejecución. Para una semántica más amplia del intérprete, use aislamiento, hosts independientes o una lista explícita de elementos de confianza o un flujo de trabajo completo.

### Iniciar un host de nodo (en primer plano)

En la máquina del nodo:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` también acepta `--context-path` (ruta de contexto WS del Gateway), `--tls`, `--tls-fingerprint <sha256>` y `--node-id` (sustituye el identificador heredado de la instancia del cliente; esto no restablece el emparejamiento). En macOS, pase `--share-installed-apps` para anunciar `device.apps`; el uso compartido está desactivado de forma predeterminada. Use `--no-share-installed-apps` para deshabilitar una habilitación guardada anteriormente.

### Gateway remoto mediante un túnel SSH (vinculación a loopback)

Si el Gateway se vincula a loopback (`gateway.bind=loopback`, valor predeterminado en modo local), los hosts de nodo remotos no pueden conectarse directamente. Cree un túnel SSH y dirija el host de nodo al extremo local del túnel.

Ejemplo (host de nodo -> host del Gateway):

```bash
# Terminal A (manténgala en ejecución): reenviar el puerto local 18790 -> Gateway 127.0.0.1:18789
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
- En modo remoto, `gateway.remote.token` / `gateway.remote.password` pueden utilizarse según las reglas de precedencia remota.
- Si hay SecretRefs locales activas de `gateway.auth.*` configuradas pero sin resolver, la autenticación del host de nodo falla de forma cerrada.
- La resolución de autenticación del host de nodo solo admite las variables de entorno `OPENCLAW_GATEWAY_*`.

### Iniciar un host de nodo (servicio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` también acepta `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (solo el identificador heredado de la instancia del cliente), `--share-installed-apps` / `--no-share-installed-apps`, `--runtime <node>` (valor predeterminado: nodo) y `--force` para reinstalar. También están disponibles `node status`, `node stop` y `node uninstall`.

### Emparejar y asignar un nombre

En el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si el nodo vuelve a intentarlo con datos de autenticación modificados, vuelva a ejecutar `openclaw devices list` y apruebe el `requestId` actual.

Opciones de asignación de nombres:

- `--display-name` en `openclaw node run` / `openclaw node install` (se conserva en la fila SQLite compartida de `node_host_config` junto con el identificador de la instancia del cliente y los metadatos de conexión del Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (sustitución del Gateway).

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

El host de nodo sin interfaz gráfica inicia estos servidores, enumera sus herramientas y publica
los descriptores después de conectarse. Las llamadas a herramientas regresan a ese nodo mediante
`mcp.tools.call.v1`; el Gateway no necesita una configuración MCP coincidente ni un
plugin de JS. Esta ruta v1 alojada en el nodo no admite servidores MCP con OAuth.

Los hosts de nodo actuales declaran la familia de comandos integrada `mcp.tools.call.v1` durante
su emparejamiento inicial, incluso cuando no hay ningún servidor MCP configurado. Un nodo emparejado con una
versión anterior de OpenClaw puede solicitar una actualización única de la superficie de comandos después de
actualizar el host de nodo. Añadir, eliminar o filtrar servidores después de eso no
requiere volver a emparejar, porque la familia de comandos aprobada no cambia. Reinicie
`openclaw node run` o `openclaw node restart` para aplicar los cambios en la configuración MCP del nodo;
el host de nodo no supervisa esta configuración.

Los operadores del Gateway pueden ignorar todas las herramientas visibles para el agente publicadas por nodos emparejados,
incluidas las herramientas MCP alojadas en nodos, con
`gateway.nodes.pluginTools.enabled: false`. Las denegaciones exactas de comandos, como
`gateway.nodes.commands.deny: ["mcp.tools.call.v1"]`, también bloquean la ejecución.

### Skills alojadas en nodos

Instale las Skills en el directorio activo de Skills de OpenClaw de la máquina del Node,
`~/.openclaw/skills` de forma predeterminada. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` y
`OPENCLAW_CONFIG_PATH` trasladan ese perfil activo. `OPENCLAW_STATE_DIR` tiene
prioridad para las Skills; de lo contrario, `skills/` está junto a la ruta que muestra
`openclaw config file`. El host del Node sin interfaz gráfica publica archivos `SKILL.md` válidos
después de conectarse, y el Gateway los añade a las instantáneas de Skills del agente solo mientras
ese Node permanezca conectado. El nombre de cada directorio de Skills debe coincidir con el campo
de frontmatter `name`, para que el localizador abstracto del Node se asigne a una entrada sin añadir
otro campo de protocolo.

El emparejamiento inicial del rol del Node autoriza la publicación de Skills. Añadir, eliminar o
cambiar Skills no requiere otro emparejamiento ni un cambio en la configuración del Gateway.
Reinicie `openclaw node run` o `openclaw node restart` después de cambiar
los archivos de Skills del Node; el host del Node no supervisa el directorio de Skills.

Las entradas de Skills alojadas en el Node identifican su Node e incluyen su ubicación
de ejecución. Los archivos de Skills, las rutas relativas referenciadas y los binarios permanecen en ese
Node. El agente lee la ubicación `node://.../SKILL.md` anunciada con la
herramienta `read` habitual. `file_fetch` acepta rutas absolutas del Node aprobadas por el operador,
no localizadores de Skills del Node; en su lugar, los entornos de ejecución que no dispongan de la herramienta de lectura habitual pueden ejecutar
`cat SKILL.md` mediante `exec host=node node=<node-id>`, con el directorio
`node://.../skills/<name>` anunciado como `workdir`. Los archivos y binarios referenciados
usan el mismo destino de ejecución y directorio de trabajo. El host del Node resuelve ese localizador con respecto
a su directorio de estado activo de OpenClaw, por lo que las rutas relativas se resuelven en el Node y no
en la máquina del Gateway. El Node que publica debe tener aprobado `system.run`,
y la política de ejecución del agente debe permitir `host=node`; de lo contrario, la Skill queda
fuera de la instantánea de ese agente.

Establezca `nodeHost.skills.enabled: false` en el Node para detener la publicación. Los operadores del Gateway
pueden ignorar las Skills de todos los Nodes emparejados mediante
`gateway.nodes.allowSkills: false`.

### Estado de identidad sin interfaz gráfica

El Node sin interfaz gráfica conserva tres registros de estado independientes en SQLite compartido:

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): el ID de instancia del cliente, el nombre para mostrar y los metadatos de conexión al Gateway.
- `~/.openclaw/state/openclaw.sqlite` (`device_identities`, clave `primary`): el par de claves firmado del dispositivo y el ID criptográfico derivado del dispositivo.
- `~/.openclaw/state/openclaw.sqlite` (`device_auth_tokens`): los tokens de autenticación de dispositivos emparejados, indexados por el ID criptográfico del dispositivo y el rol.

Para un Node firmado, el Gateway usa el ID criptográfico del dispositivo para el emparejamiento y
el enrutamiento del Node. El ID de instancia del cliente solo son metadatos de conexión. Por tanto, cambiar
`--node-id` o migrar un `node.json` retirado no restablece el emparejamiento. Consulte
[Estado de identidad y emparejamiento](/es/cli/node#identity-and-pairing-state) para conocer el
flujo compatible de revocación y nuevo emparejamiento, así como las notas de actualización.

Los archivos `identity/device.json` y `identity/device-auth.json` retirados son
entradas de migración gestionadas por Doctor. Detenga el host del Node y ejecute
`openclaw doctor --fix`; Doctor importa y verifica sus filas en SQLite antes de
eliminar los archivos antiguos.

### Añadir los comandos a la lista de permitidos

Las aprobaciones de ejecución son **específicas de cada host del Node**. Añada entradas a la lista de permitidos desde el Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Las aprobaciones se almacenan en el host del Node en `~/.openclaw/exec-approvals.json`.

### Dirigir la ejecución al Node

Configure los valores predeterminados (configuración del Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.mode allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

O para cada sesión:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Una vez configurado, cualquier llamada a `exec` con `host=node` se ejecuta en el host del Node (sujeta a la lista de permitidos y las aprobaciones del Node).

`host=auto` no elegirá implícitamente el Node por sí solo, pero se permite una solicitud explícita `host=node` por llamada desde `auto`. Si desea que la ejecución en el Node sea la predeterminada para la sesión, establezca explícitamente `tools.exec.host=node` o `/exec host=node ...`.

Relacionado:

- [CLI del host del Node](/es/cli/node)
- [Herramienta de ejecución](/es/tools/exec)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)

### Inferencia local de modelos

Un Node de escritorio o servidor puede exponer modelos con capacidad de chat desde un servidor Ollama que se ejecute en ese Node. Los agentes usan la herramienta `node_inference` del Plugin de Ollama para detectar los modelos instalados y ejecutar de forma remota un prompt limitado; el Gateway no necesita acceso directo por red a Ollama. Consulte [Inferencia de Ollama local al Node](/es/providers/ollama#node-local-inference) para conocer la configuración, el filtrado de modelos y los comandos de verificación directa.

### Sesiones y transcripciones de Codex

El Plugin oficial `codex` puede exponer sesiones de Codex no archivadas en un
host de Node sin interfaz gráfica o en un Node nativo de macOS. El registro del catálogo ya no depende
de `supervision.enabled`; esa opción controla las herramientas de supervisión orientadas al agente.
Establezca `sessionCatalog.enabled: false` en la configuración del Plugin de Codex para desactivar los
comandos del catálogo del operador y del catálogo de Nodes emparejados sin desactivar el
proveedor ni el arnés.
El Plugin debe seguir activo en ambos equipos, y la configuración del Node sigue representando
el consentimiento local: habilitar únicamente el Gateway no permite leer el estado de Codex de otro equipo.

El Node anuncia los comandos versionados y de solo lectura
`codex.appServer.threads.list.v1` y
`codex.appServer.thread.turns.list.v1`. Un host de Node nativo que tenga disponible la
CLI de Codex también anuncia `codex.terminal.resume.v1`. Apruebe la actualización del emparejamiento del Node
cuando estos comandos aparezcan por primera vez. El Gateway los invoca mediante la
política normal de Nodes del Plugin y aísla los fallos por host.

Las filas de Nodes emparejados aparecen como un grupo de **Codex** en la barra lateral normal de sesiones.
Dentro de cada host, las filas se agrupan de forma predeterminada por carpeta de proyecto; un directorio de trabajo
bajo `.claude/worktrees/<name>` se integra en su repositorio de origen, y los grupos de
proyectos se contraen como las demás secciones de la barra lateral. Use el icono de carpeta en la cabecera del catálogo
para eliminar o restaurar la agrupación por proyectos. La misma agrupación se aplica al
catálogo de sesiones de Claude.
De forma predeterminada, al seleccionar una fila se abre el panel normal de Chat y se lee su transcripción persistente
mediante llamadas limitadas a
`thread/turns/list`, paginadas por cursor y con proyección completa de elementos. Use el menú de la fila, la cabecera del visor o la preferencia **Abrir sesiones de Codex/Claude en** para iniciar `codex resume <thread-id>` en el terminal del operador del equipo propietario de la sesión. La ruta de terminal del Node emparejado es un relé PTY incluido en la lista de permitidos y gestionado por el Plugin de Codex, no una ejecución arbitraria de comandos en el Node.

El relé no proporciona todos los contratos de continuación del arnés de OpenClaw ni de propiedad del archivo. Por tanto, **Continuar** y **Archivar** no están disponibles para las filas remotas. En el equipo del Gateway, las filas almacenadas e inactivas
pueden iniciar una rama de Chat independiente y bloqueada a un modelo. Cualquiera de ellas solo puede archivarse
después de que el operador confirme que ningún otro cliente de Codex la está usando; se desconoce
la actividad en vivo de una fila almacenada. Las filas activas no pueden ramificarse ni archivarse.

Consulte [Supervisar sesiones de Codex](/es/plugins/codex-supervision) para conocer la configuración,
la paginación, la continuación local y el límite de seguridad de los metadatos.

### Sesiones y transcripciones de Claude

El Plugin incluido `anthropic` detecta de forma predeterminada las sesiones no archivadas de Claude CLI y Claude
Desktop en el Gateway y en los Nodes emparejados. Establezca
`plugins.entries.anthropic.config.sessionCatalog.enabled: false` para desactivar los
comandos del catálogo del operador y del catálogo de Nodes emparejados sin desactivar los modelos de Anthropic
ni el backend de Claude CLI.
Un Node remoto de la aplicación de macOS anuncia
`anthropic.claude.sessions.list.v1` y `anthropic.claude.sessions.read.v1`
cuando el Plugin de Anthropic está habilitado y existe `~/.claude/projects/`. Apruebe
la actualización del emparejamiento del Node cuando estos comandos aparezcan por primera vez.

Un host de Node nativo que tenga disponible Claude CLI también anuncia
`anthropic.claude.terminal.resume.v1`. Las filas aptas de la CLI y Desktop pueden abrir
`claude --resume <session-id>` en el terminal del operador de su host propietario.
Esto toma el control de la sesión nativa; a diferencia de la adopción de OpenClaw, no
bifurca primero la sesión de Claude.

El catálogo combina registros válidos del índice de proyectos de Claude CLI con una alternativa limitada
de metadatos para transcripciones JSONL no indexadas. Esa alternativa reconoce
sesiones simultáneas interactivas que no son cadenas secundarias (`cli`) y sesiones sin interfaz gráfica de la CLI
del SDK de agentes (`sdk-cli`). Los metadatos locales de Claude Desktop proporcionan los títulos de Desktop y el estado de
archivo. Los metadatos de Desktop prevalecen cuando ambas fuentes hacen referencia al mismo ID de sesión de Claude Code;
las transcripciones exclusivas de la CLI siguen visibles porque la CLI no tiene una marca de archivo.
Las lecturas de transcripciones usan cursores opacos de desplazamiento de bytes
y lecturas retrospectivas limitadas de archivos, por lo que seleccionar una sesión
grande o cargar una página anterior no lee todo el historial JSONL en una sola
respuesta del Gateway.

Los comandos de lista y lectura son de solo lectura. Exponen los metadatos del catálogo y el contenido de las transcripciones
únicamente mediante los métodos genéricos `sessions.catalog.list` y
`sessions.catalog.read` a una conexión autenticada del operador con
`operator.write`. Una fila de Claude CLI local al Gateway puede adoptarse desde el compositor normal de
Chat: OpenClaw importa el historial visible limitado, reanuda con
`--fork-session` en el primer turno y deja intacta la transcripción de origen.

Un host de Node sin interfaz gráfica puede habilitar el mismo flujo de continuación:

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
habilitarlo de forma remota. El comando también pasa por la política de aprobación de ejecución
existente del Node. Cuando los tres comandos de Claude se anuncian y están permitidos por
la política de comandos de Nodes del Gateway, una fila de Claude CLI
en ese Node pasa a ser continuable: OpenClaw importa el historial limitado, vincula
la sesión adoptada al Node y a su directorio de trabajo indicado por el catálogo, y
ejecuta allí cada turno de una sola ejecución `claude -p`. El primer turno sigue usando
`--fork-session`, lo que conserva la transcripción de origen.

Los turnos ejecutados en el Node usan los valores predeterminados de Claude del Node. En v1 no reciben la
configuración MCP de bucle invertido del Gateway ni el Plugin de Skills del Gateway, no pueden reinicializarse desde una
transcripción del Gateway y rechazan archivos adjuntos e imágenes. Las filas de Claude Desktop y los
Nodes que no anuncian el comando de ejecución permanecen en modo de solo lectura. El Node de la aplicación de macOS
todavía no anuncia este comando, por lo que sus filas permanecen en modo de solo lectura.

Consulte [Anthropic: sesiones de Claude entre equipos](/es/providers/anthropic#claude-sessions-across-computers)
para conocer el comportamiento de la interfaz de control y los orígenes de almacenamiento.

### Sesiones de OpenCode y Pi

Los Plugins incluidos de OpenCode y ACPX también detectan catálogos de sesiones nativas
de solo lectura en el Gateway y los Nodes emparejados. Un Node anuncia
`opencode.sessions.list.v1` / `opencode.sessions.read.v1` cuando está instalada la CLI
`opencode`, y `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`
cuando existe el directorio de sesiones de Pi. Apruebe la actualización del emparejamiento del Node cuando aparezcan
comandos nuevos por primera vez. Cuando la CLI correspondiente también está disponible, el Node añade
`opencode.terminal.resume.v1` o `acpx.pi.terminal.resume.v1`; el menú de fila
y la cabecera del visor existentes pueden volver a abrir la sesión seleccionada en su terminal
propietario mediante `opencode --session <id>` o `pi --session <id>`.

OpenCode realiza las lecturas mediante la superficie JSON/de exportación de su CLI oficial. Pi lee su
almacén documentado de sesiones JSONL, incluidos los directorios de sesiones `settings.json`
del proyecto y globales, además de las sustituciones `PI_CODING_AGENT_DIR` y
`PI_CODING_AGENT_SESSION_DIR`. Ambos catálogos están habilitados de forma predeterminada;
desactívelos en la interfaz web, en **Config > Plugins**.

La reanudación en el terminal usa el directorio de trabajo almacenado de la sesión y el mismo
relé PTY dúplex incluido en la lista de permitidos que Codex y Claude. No expone la ejecución arbitraria
de comandos en el Node.

### Carga de archivos en el terminal

La interfaz de control permite arrastrar archivos a un terminal abierto de un nodo emparejado. El host nativo del nodo anuncia el comando `terminal.upload`, exclusivo para administradores; apruebe la actualización del emparejamiento cuando aparezca por primera vez. Cada archivo está limitado a 16 MiB, se prepara en un directorio temporal privado de ese nodo y se devuelve al terminal como una ruta entrecomillada para el shell sin ejecutarla.

La inserción de rutas admite PowerShell, `cmd.exe` y shells POSIX reconocidos (`sh`, Bash, Dash, Ash, Ksh, Zsh y Fish), incluido Git Bash en Windows. Se rechazan otras sustituciones del shell porque sus reglas de entrecomillado no pueden deducirse de forma segura; ejecute el host del nodo dentro de WSL para obtener rutas nativas de WSL. También se rechazan las rutas `cmd.exe` que contienen `%` o `!`, porque ese shell expande esos caracteres incluso dentro de comillas dobles.

## Invocación de comandos

De bajo nivel (RPC sin procesar):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` bloquea `system.run` y `system.run.prepare`; esos comandos solo se ejecutan mediante la herramienta `exec` con `host=node` (véase más arriba). Existen auxiliares de nivel superior para los flujos de trabajo habituales de «proporcionar al agente un archivo adjunto MEDIA» (lienzo, cámara, pantalla y ubicación, descritos más adelante).

Los comandos de nodo de transmisión continua y larga duración utilizan eventos `node.invoke.progress` aditivos. Cada evento contiene el identificador de invocación, un número de secuencia basado en cero y un fragmento de texto UTF-8 de tamaño limitado; el Gateway ordena los fragmentos antes de entregarlos al
invocador. La respuesta `node.invoke.result` existente sigue siendo la única respuesta
final. Los invocadores de transmisión pueden establecer un plazo de inactividad que comienza con el
primer evento de progreso y se reinicia tras los eventos de progreso posteriores, mientras se mantiene el
tiempo de espera máximo independiente de la invocación durante la aprobación y la ejecución. El resultado, el
tiempo de espera máximo, el tiempo de espera por inactividad y la desconexión del nodo descartan todo el estado de transmisión
pendiente. La cancelación por parte del invocador emite `node.invoke.cancel`; a continuación, el host del nodo
termina el árbol de procesos correspondiente. Los comandos existentes de solicitud y respuesta no cambian.

## Política de comandos

Los comandos de nodo deben superar dos controles antes de poder invocarse:

1. El nodo debe declarar el comando en sus metadatos de conexión autenticados (`connect.commands`).
2. La lista de permitidos del Gateway, derivada de la plataforma y la aprobación, debe incluir el comando declarado.

Listas de permitidos predeterminadas por plataforma (antes de los valores predeterminados de los plugins y las sustituciones `commands.allow`/`commands.deny`):

| Plataforma | Comandos permitidos de forma predeterminada                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `device.apps`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                         |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (los comandos del host del nodo, como `system.run`, están sujetos a aprobación; véase más adelante)                                                                                                                                                                                                                                  |

Estas filas describen el límite superior de la política del Gateway, no los comandos implementados por cada aplicación de nodo. Un comando solo puede utilizarse cuando el nodo conectado también lo declara. En particular, la aplicación actual de macOS no declara las familias de datos personales y del dispositivo indicadas en la fila de la política de macOS.

Los comandos `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) son un valor predeterminado del plugin en iOS, Android, macOS, Windows, Linux y plataformas desconocidas. Los nodos Linux solo los declaran cuando está presente el socket local de Canvas de la aplicación de escritorio. Todos los comandos de Canvas están restringidos al primer plano en iOS.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once` se permiten de forma predeterminada para cualquier nodo que anuncie la capacidad `talk` o declare comandos `talk.*`, independientemente de la etiqueta de plataforma.

Los comandos del host de escritorio (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` y `screen.snapshot` en macOS/Windows/Linux) no forman parte de la tabla estática de valores predeterminados por plataforma anterior. Pasan a estar disponibles una vez que el operador aprueba una solicitud de emparejamiento que los declara; a partir de entonces, el conjunto de comandos aprobados del nodo los conserva al volver a conectarse.

Los comandos peligrosos o con implicaciones importantes para la privacidad siguen requiriendo una habilitación explícita mediante `gateway.nodes.commands.allow`, incluso si un nodo los declara: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.commands.deny` siempre prevalece sobre los valores predeterminados y las entradas adicionales de la lista de permitidos. Consulte [Resúmenes de HealthKit](/es/platforms/ios-healthkit) para conocer el control de consentimiento del iPhone y [Uso del ordenador](/es/nodes/computer-use) para conocer los controles adicionales de capacidad, política de herramientas, activación e implementación de plataforma que afectan a la entrada de escritorio.

Los comandos de nodo propiedad de un plugin pueden añadir una política de invocación de nodos del Gateway. Esa política se ejecuta después de comprobar la lista de permitidos y antes de reenviar la solicitud al nodo, por lo que las invocaciones `node.invoke` sin procesar, los auxiliares de la CLI y las herramientas específicas del agente comparten el mismo límite de permisos del plugin. Los comandos de nodo peligrosos de plugins siguen requiriendo una habilitación explícita mediante `gateway.nodes.commands.allow`.

Después de que un nodo cambie su lista de comandos declarados, rechace el emparejamiento anterior del dispositivo y apruebe la nueva solicitud para que el Gateway almacene la instantánea de comandos actualizada.

## Configuración (`openclaw.json`)

Los ajustes relacionados con los nodos se encuentran en `gateway.nodes` y `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Aprobar automáticamente el emparejamiento inicial de nodos desde redes de confianza (lista CIDR).
      // Se desactiva cuando no se define. Solo se aplica a las solicitudes iniciales role:node
      // sin ámbitos solicitados; no aprueba automáticamente las actualizaciones.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // Aprobación automática verificada mediante SSH (valor predeterminado: activada). Aprueba el emparejamiento inicial
        // del nodo cuando la clave del dispositivo coincide exactamente con la obtenida mediante SSH.
        sshVerify: true,
      },
      // Confiar en las herramientas de plugins visibles para el agente publicadas por nodos emparejados (valor predeterminado: true).
      pluginTools: {
        enabled: true,
      },
      // Habilitar comandos de nodo peligrosos o con implicaciones importantes para la privacidad (camera.snap, etc.).
      commands: {
        allow: ["camera.snap", "screen.record"],
        // Bloquear nombres de comandos exactos aunque los valores predeterminados o commands.allow los incluyan.
        deny: ["camera.clip"],
      },
    },
  },
  tools: {
    exec: {
      // Host de ejecución predeterminado: "node" dirige todas las llamadas de ejecución a un nodo emparejado.
      host: "node",
      // Modo de seguridad para la ejecución en nodos: permitir solo comandos aprobados o incluidos en la lista de permitidos.
      security: "allowlist",
      // Fijar la ejecución a un nodo concreto (identificador o nombre). Omitir para permitir cualquier nodo.
      node: "build-node",
    },
  },
}
```

Utilice nombres exactos de comandos de nodo. `commands.deny` elimina un comando incluso cuando un valor predeterminado de la plataforma o una entrada `commands.allow` lo permitirían de otro modo. De forma predeterminada, los nodos emparejados pueden publicar descriptores de herramientas de plugins visibles para el agente, pero el comando de cada descriptor debe seguir formando parte de la superficie de comandos aprobados del nodo. Establezca `gateway.nodes.pluginTools.enabled: false` para ignorar todos esos descriptores. Consulte la [Referencia de configuración del Gateway](/es/gateway/configuration-reference#gateway) para obtener detalles sobre los campos de emparejamiento de nodos y la política de comandos del Gateway.

Sustitución del nodo de ejecución por agente:

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

Si el nodo muestra Canvas (WebView), `canvas.snapshot` devuelve `{ format, base64 }`.

Auxiliar de la CLI (escribe en un archivo temporal e imprime la ruta guardada):

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

- `canvas present` acepta URL o rutas de archivos locales (`--target`) en los nodos que admiten rutas locales, además de `--x/--y/--width/--height` opcional para el posicionamiento. Canvas en Linux acepta URL HTTP(S) o su renderizador A2UI integrado.
- `canvas eval` acepta JavaScript en línea (`--js`) o un argumento posicional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notas:

- Los nodos móviles y de escritorio Linux utilizan una página A2UI integrada y propiedad de la aplicación para la representación con capacidad de realizar acciones.
- Solo se admite JSONL de A2UI v0.8 (se rechaza v0.9/createSurface).
- iOS y Android representan páginas remotas de Canvas del Gateway, pero las acciones de los botones de A2UI solo se envían desde la página A2UI integrada y propiedad de la aplicación. Las páginas A2UI HTTP/HTTPS alojadas en el Gateway solo permiten la representación en esos clientes móviles.
- macOS puede enviar acciones desde la página A2UI exacta del Gateway, limitada por capacidades y seleccionada por la aplicación. Las demás páginas HTTP/HTTPS siguen permitiendo únicamente la representación.
- Linux solo envía acciones desde la página A2UI integrada. Las demás páginas HTTP/HTTPS siguen permitiendo únicamente la representación, y un nodo Linux sin interfaz gráfica y sin la aplicación de escritorio no anuncia Canvas.

## Fotos y vídeos (cámara del nodo)

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
- Android solicitará los permisos `CAMERA`/`RECORD_AUDIO` cuando sea posible; si se deniegan, la operación falla con `*_PERMISSION_REQUIRED`.

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
- Use `--screen <index>` para seleccionar una pantalla cuando haya varias disponibles (0 = principal).

## Ubicación (nodos)

Los nodos exponen `location.get` cuando la ubicación está habilitada en la configuración.

Comando auxiliar de la CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notas:

- La ubicación está **desactivada de forma predeterminada**.
- «Siempre» requiere permiso del sistema; la obtención en segundo plano se realiza en la medida de lo posible.
- La respuesta incluye latitud/longitud, precisión (metros) y marca de tiempo.
- Estructura completa de los parámetros y la respuesta, y códigos de error: [Comando de ubicación](/es/nodes/location-command).

## SMS (nodos Android)

Los nodos Android pueden exponer `sms.send` y `sms.search` cuando el usuario concede el permiso **SMS** y el dispositivo admite telefonía. Ambos comandos son peligrosos de forma predeterminada: el operador del Gateway también debe añadirlos a `gateway.nodes.commands.allow` para que puedan invocarse (consulte [Política de comandos](#command-policy)).

Para realizar búsquedas de SMS de solo lectura, habilítelas explícitamente en `openclaw.json`:

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
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hola desde OpenClaw"}'
```

Notas:

- `sms.search` puede declararse antes de que se conceda `READ_SMS`, de modo que una invocación pueda devolver un diagnóstico de permisos; la lectura de mensajes sigue requiriendo ese permiso de Android.
- Los dispositivos que solo disponen de Wi-Fi y no tienen telefonía no anunciarán `sms.send`.
- Un error `requires explicit gateway.nodes.commands.allow opt-in` significa que el teléfono declaró el comando, pero el operador del Gateway no lo ha autorizado.

## Comandos de datos personales y del dispositivo

Los nodos iOS y Android anuncian de forma predeterminada varios comandos de datos de solo lectura (consulte la tabla de [Política de comandos](#command-policy)); Android también expone un conjunto más amplio, controlado mediante sus propios ajustes integrados en la aplicación. Un host de nodo TypeScript de macOS o macOS sin interfaz solo anuncia `device.apps` después de que el operador habilite el uso compartido de aplicaciones instaladas mediante `--share-installed-apps`.

Familias disponibles:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health` — solo Android.
- `device.apps` — nodos Android, macOS y macOS sin interfaz. Android requiere habilitar el uso compartido de aplicaciones instaladas en la configuración y devuelve de forma predeterminada las aplicaciones visibles en el iniciador. Los hosts de nodo TypeScript mantienen deshabilitado el uso compartido de forma predeterminada y aceptan `query`, `limit` y `includeSystem`; los resultados de macOS contienen `label`, `bundleId`, `path` y `system`.
- `notifications.list`, `notifications.actions` — solo Android.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (solo lectura de forma predeterminada); `contacts.add` es peligroso y necesita `gateway.nodes.commands.allow`.
- `calendar.events` — iOS, Android (solo lectura de forma predeterminada); `calendar.add` es peligroso y necesita `gateway.nodes.commands.allow`.
- `reminders.list` — iOS, Android (solo lectura de forma predeterminada); `reminders.add` es peligroso y necesita `gateway.nodes.commands.allow`.
- `callLog.search` — solo Android.
- `motion.activity`, `motion.pedometer` — iOS, Android; condicionados por las capacidades de los sensores disponibles.

Ejemplos de invocación:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Comandos del sistema (host de nodo/nodo Mac)

El nodo de macOS expone `system.run`, `system.which`, `system.notify` y `system.execApprovals.get/set`. El host de nodo sin interfaz expone `system.run.prepare`, `system.run`, `system.which` y `system.execApprovals.get/set`.

Ejemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Aviso" --body "Gateway listo"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Notas:

- `system.run` devuelve la salida estándar, la salida de error y el código de salida en la carga útil.
- La ejecución del shell ahora se realiza mediante la herramienta `exec` con `host=node`; `nodes` sigue siendo la superficie RPC directa para comandos explícitos del nodo.
- `nodes invoke` no expone `system.run` ni `system.run.prepare`; estos siguen estando disponibles únicamente en la ruta de ejecución.
- La ruta de ejecución prepara un `systemRunPlan` canónico antes de la aprobación. Una vez concedida la aprobación, el Gateway reenvía ese plan almacenado, no los campos de comando, directorio de trabajo o sesión que el emisor de la llamada pueda modificar posteriormente.
- `system.notify` respeta el estado del permiso de notificaciones en la aplicación de macOS; admite `--priority <passive|active|timeSensitive>` y `--delivery <system|overlay|auto>`.
- Los metadatos `platform` / `deviceFamily` de nodos no reconocidos utilizan una lista conservadora de permisos predeterminados que excluye `system.run` y `system.which`. Si se necesitan intencionadamente esos comandos para una plataforma desconocida, añádalos explícitamente mediante `gateway.nodes.commands.allow`.
- `system.run` admite `--cwd`, `--env KEY=VAL`, `--command-timeout` y `--needs-screen-recording`.
- Para los envoltorios de shell (`bash|sh|zsh ... -c/-lc`), los valores `--env` específicos de la solicitud se reducen a una lista explícita de permisos (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para las decisiones de permitir siempre en el modo de lista de permisos, los envoltorios de despacho conocidos (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan las rutas de los ejecutables internos en lugar de las rutas de los envoltorios. Si no es seguro desenvolverlos, no se conserva automáticamente ninguna entrada en la lista de permisos.
- En los hosts de nodo Windows que utilizan el modo de lista de permisos, las ejecuciones mediante envoltorios de shell a través de `cmd.exe /c` requieren aprobación (la entrada en la lista de permisos por sí sola no permite automáticamente la forma con envoltorio).
- Los hosts de nodo ignoran las sustituciones de `PATH` en `--env` y eliminan un conjunto amplio y mantenido de variables de inicio de intérpretes y shells (por ejemplo, `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) antes de ejecutar un comando. Si se necesitan entradas adicionales en PATH, configure el entorno del servicio del host de nodo (o instale las herramientas en ubicaciones estándar) en lugar de pasar `PATH` mediante `--env`.
- En el modo de nodo de macOS, `system.run` está sujeto a las aprobaciones de ejecución de la aplicación de macOS (Configuración → Aprobaciones de ejecución). Los modos preguntar/lista de permisos/completo se comportan igual que en el host de nodo sin interfaz; las solicitudes denegadas devuelven `SYSTEM_RUN_DENIED`.
- En el host de nodo sin interfaz, `system.run` está sujeto a las aprobaciones de ejecución (`~/.openclaw/exec-approvals.json`); concretamente en macOS, consulte más adelante las variables de entorno de enrutamiento del host de ejecución en [Host de nodo sin interfaz](#headless-node-host-cross-platform).

## Vinculación del nodo de ejecución

Cuando hay varios nodos disponibles, la ejecución puede vincularse a uno específico. Esto establece el nodo predeterminado para `exec host=node` (y puede sustituirse para cada agente).

Valor predeterminado global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Sustitución por agente:

```bash
openclaw config get agents.entries
openclaw config set 'agents.entries.main.tools.exec.node' "node-id-or-name"
```

Elimine el valor para permitir cualquier nodo:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.entries.main.tools.exec.node'
```

## Mapa de permisos

Los nodos pueden incluir un mapa `permissions` en `node.list` / `node.describe`, cuyas claves son nombres de permisos (por ejemplo, `screenRecording`, `accessibility`, `location`) y cuyos valores son booleanos (`true` = concedido).

## Host de nodo sin interfaz (multiplataforma)

OpenClaw puede ejecutar un **host de nodo sin interfaz** (sin interfaz de usuario) que se conecta al WebSocket del Gateway y expone `system.run` / `system.which`. Esto resulta útil en Linux/Windows o para ejecutar un nodo mínimo junto a un servidor.

Para iniciarlo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notas:

- El emparejamiento sigue siendo obligatorio (el Gateway mostrará una solicitud de emparejamiento del dispositivo).
- Los metadatos de la instancia del cliente, la identidad firmada del dispositivo y la autenticación de emparejamiento utilizan registros de estado independientes; consulte [Estado de identidad sin interfaz](#headless-identity-state).
- Las aprobaciones de ejecución se aplican localmente mediante `~/.openclaw/exec-approvals.json` (consulte [Aprobaciones de ejecución](/es/tools/exec-approvals)).
- En macOS, el host de nodo sin interfaz ejecuta `system.run` localmente de forma predeterminada. Establezca `OPENCLAW_NODE_EXEC_HOST=app` para enrutar `system.run` a través del host de ejecución de la aplicación complementaria; añada `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir el host de la aplicación y producir un error seguro si no está disponible.
- Añada `--tls` / `--tls-fingerprint` cuando el WebSocket del Gateway utilice TLS.

## Modo de nodo Mac

- La aplicación de la barra de menús de macOS se conecta al servidor WebSocket del Gateway como un nodo (por lo que `openclaw nodes …` funciona con este Mac).
- En el modo remoto, la aplicación abre un túnel SSH para el puerto del Gateway y se conecta a `localhost`.
