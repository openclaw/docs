---
read_when:
    - Emparejar nodos iOS/Android con un gateway
    - Uso de Node canvas/camera para el contexto del agente
    - Agregar nuevos comandos de Node o ayudantes de CLI
summary: 'Nodos: emparejamiento, capacidades, permisos y ayudantes de CLI para lienzo/cámara/pantalla/dispositivo/notificaciones/sistema'
title: Nodos
x-i18n:
    generated_at: "2026-07-05T11:25:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8a781c60e80989d35dcf5bfefe8a3c706e1a1682377876e0d83da924bfcb908
    source_path: nodes/index.md
    workflow: 16
---

Un **nodo** es un dispositivo complementario (macOS/iOS/Android/headless) que se conecta al **WebSocket** del Gateway (el mismo puerto que los operadores) con `role: "node"` y expone una superficie de comandos (por ejemplo, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) mediante `node.invoke`. Detalles del protocolo: [protocolo del Gateway](/es/gateway/protocol).

Transporte heredado: [protocolo Bridge](/es/gateway/bridge-protocol) (TCP JSONL; solo histórico para los nodos actuales).

macOS también puede ejecutarse en **modo de nodo**: la aplicación de la barra de menús se conecta al servidor WS del Gateway y expone sus comandos locales de canvas/cámara como un nodo (para que `openclaw nodes …` funcione contra este Mac). En modo de gateway remoto, la automatización del navegador la maneja el host de nodo de la CLI (`openclaw node run` o el servicio de nodo instalado), no el nodo de la aplicación nativa.

Los nodos son **periféricos**, no gateways: no ejecutan el servicio de gateway, y los mensajes de canales (Telegram, WhatsApp, etc.) llegan al gateway, no a los nodos.

Guía de procedimientos de solución de problemas: [/nodes/troubleshooting](/es/nodes/troubleshooting)

## Emparejamiento + estado

Los nodos WS usan **emparejamiento de dispositivos**. Un nodo presenta una identidad de dispositivo durante `connect`; el Gateway crea una solicitud de emparejamiento de dispositivo para `role: node`. Apruébala mediante la CLI de dispositivos (o la UI).

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Las solicitudes de emparejamiento pendientes caducan después de 5 minutos; consulta [emparejamiento propiedad del Gateway](/es/gateway/pairing) para ver el ciclo completo de solicitud/aprobación/token. Si un nodo reintenta con detalles de autenticación cambiados (rol/ámbitos/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`; vuelve a ejecutar `openclaw devices list` antes de aprobar.

- `nodes status` marca un nodo como **emparejado** cuando su rol de emparejamiento de dispositivo incluye `node`.
- El registro de emparejamiento de dispositivo es el contrato duradero de roles aprobados. La rotación de tokens permanece dentro de ese contrato; no puede elevar un nodo emparejado a un rol que la aprobación de emparejamiento nunca concedió.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) es un almacén de emparejamiento de nodos independiente y propiedad del gateway que rastrea la superficie de comandos/capacidades aprobada del nodo entre reconexiones. **No** bloquea el handshake WS `connect`: el emparejamiento de dispositivos hace eso.
- `openclaw nodes remove --node <id|name|ip>` elimina un emparejamiento de nodo. Para un nodo respaldado por dispositivo, revoca el rol `node` del dispositivo en `devices/paired.json` y desconecta las sesiones con rol de nodo de ese dispositivo: un dispositivo con roles mixtos conserva su fila y solo pierde el rol `node`, mientras que una fila de dispositivo solo de nodo se elimina. También borra cualquier entrada coincidente del almacén separado de emparejamiento de nodos. `operator.pairing` puede eliminar filas de nodos no operadores en otros dispositivos; un llamador con token de dispositivo que revoca su propio rol de nodo en un dispositivo con roles mixtos necesita además `operator.admin`.
- El alcance de aprobación sigue los comandos declarados por la solicitud pendiente:
  - solicitud sin comandos: `operator.pairing`
  - comandos de nodo no exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host de nodo remoto (system.run)

Usa un **host de nodo** cuando tu Gateway se ejecuta en una máquina y quieres que los comandos se ejecuten en otra. El modelo sigue hablando con el **gateway**; el gateway reenvía las llamadas `exec` al **host de nodo** cuando se selecciona `host=node`.

| Rol             | Responsabilidad                                                   |
| --------------- | ----------------------------------------------------------------- |
| Host de Gateway | Recibe mensajes, ejecuta el modelo, enruta llamadas a herramientas. |
| Host de nodo    | Ejecuta `system.run`/`system.which` en la máquina del nodo.        |
| Aprobaciones    | Se aplican en el host de nodo mediante `~/.openclaw/exec-approvals.json`. |

Nota de aprobación:

- Las ejecuciones de nodo respaldadas por aprobación vinculan el contexto exacto de la solicitud. La ruta de exec prepara un `systemRunPlan` canónico antes de la aprobación; una vez concedida, el gateway reenvía ese plan almacenado, no ningún campo de comando/cwd/sesión editado posteriormente por el llamador, y vuelve a validar el directorio de trabajo antes de ejecutar.
- Para ejecuciones directas de archivos de shell/runtime, OpenClaw también intenta vincular un operando de archivo local concreto y deniega la ejecución si ese archivo cambia antes de la ejecución.
- Si OpenClaw no puede identificar exactamente un archivo local concreto para un comando de intérprete/runtime, la ejecución respaldada por aprobación se deniega en lugar de simular cobertura completa del runtime. Usa sandboxing, hosts separados o una lista explícita y confiable de permitidos/flujo de trabajo completo para semánticas de intérprete más amplias.

### Iniciar un host de nodo (primer plano)

En la máquina del nodo:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` también acepta `--context-path` (ruta de contexto WS del Gateway), `--tls`, `--tls-fingerprint <sha256>` y `--node-id` (sobrescribirlo borra el token de emparejamiento).

### Gateway remoto mediante túnel SSH (enlace loopback)

Si el Gateway se enlaza a loopback (`gateway.bind=loopback`, predeterminado en modo local), los hosts de nodo remotos no pueden conectarse directamente. Crea un túnel SSH y apunta el host de nodo al extremo local del túnel.

Ejemplo (host de nodo -> host de gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notas:

- `openclaw node run` admite autenticación por token o contraseña.
- Se prefieren las variables de entorno: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- El fallback de configuración es `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host de nodo ignora intencionadamente `gateway.remote.token` / `gateway.remote.password`.
- En modo remoto, `gateway.remote.token` / `gateway.remote.password` son aptos según las reglas de precedencia remota.
- Si hay SecretRefs locales activos `gateway.auth.*` configurados pero sin resolver, la autenticación del host de nodo falla en modo cerrado.
- La resolución de autenticación del host de nodo solo respeta las variables de entorno `OPENCLAW_GATEWAY_*`.

### Iniciar un host de nodo (servicio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` también acepta `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id`, `--runtime <node|bun>` (predeterminado: node) y `--force` para reinstalar. `node status`, `node stop` y `node uninstall` también están disponibles.

### Emparejar + nombrar

En el host de gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si el nodo reintenta con detalles de autenticación cambiados, vuelve a ejecutar `openclaw devices list` y aprueba el `requestId` actual.

Opciones de nombrado:

- `--display-name` en `openclaw node run` / `openclaw node install` (persiste en `~/.openclaw/node.json` en el nodo, junto con el id del nodo, el token y la información de conexión del gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (sobrescritura del gateway).

### Permitir los comandos

Las aprobaciones de exec son **por host de nodo**. Añade entradas a la lista de permitidos desde el gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Las aprobaciones viven en el host de nodo en `~/.openclaw/exec-approvals.json`.

### Apuntar exec al nodo

Configura los valores predeterminados (configuración del gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

O por sesión:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Una vez establecido, cualquier llamada `exec` con `host=node` se ejecuta en el host de nodo (sujeta a la lista de permitidos/aprobaciones del nodo).

`host=auto` no elegirá implícitamente el nodo por sí solo, pero se permite una solicitud explícita por llamada `host=node` desde `auto`. Si quieres que exec en nodo sea el valor predeterminado de la sesión, establece explícitamente `tools.exec.host=node` o `/exec host=node ...`.

Relacionado:

- [CLI del host de nodo](/es/cli/node)
- [Herramienta exec](/es/tools/exec)
- [Aprobaciones de exec](/es/tools/exec-approvals)

### Inferencia de modelo local

Un nodo de escritorio o servidor puede exponer modelos con capacidad de chat desde un servidor Ollama que se ejecute en ese nodo. Los agentes usan la herramienta `node_inference` del plugin Ollama para descubrir los modelos instalados y ejecutar un prompt acotado de forma remota; el Gateway no necesita acceso directo de red a Ollama. Consulta [inferencia local al nodo de Ollama](/es/providers/ollama#node-local-inference) para la configuración, el filtrado de modelos y los comandos de verificación directa.

## Invocar comandos

Bajo nivel (RPC sin procesar):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` bloquea `system.run` y `system.run.prepare`; esos comandos solo se ejecutan mediante la herramienta `exec` con `host=node` (consulta arriba). Existen helpers de nivel superior para los flujos de trabajo comunes de "dar al agente un adjunto MEDIA" (canvas, cámara, pantalla, ubicación, abajo).

## Política de comandos

Los comandos de nodo deben pasar dos controles antes de poder invocarse:

1. El nodo debe declarar el comando en su lista `connect.commands` de WebSocket.
2. La lista de permitidos derivada de plataforma y aprobación del gateway debe incluir el comando declarado.

Listas de permitidos predeterminadas por plataforma (antes de los valores predeterminados del plugin y las sobrescrituras `allowCommands`/`denyCommands`):

| Plataforma | Comandos permitidos de forma predeterminada                                                                                                                                                                                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS        | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                          |
| Android    | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                          |
| Windows    | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                          |
| Linux      | `system.notify` (los comandos de host de nodo como `system.run` están controlados por aprobación; consulta abajo)                                                                                                                                                                                                       |

Los comandos `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) son un valor predeterminado del plugin en iOS, Android, macOS, Windows y plataformas desconocidas (no Linux); todos ellos están restringidos al primer plano en iOS.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once` están permitidos de forma predeterminada para cualquier nodo que anuncie la capacidad `talk` o declare comandos `talk.*`, independientemente de la etiqueta de plataforma.

Los comandos de host de escritorio (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `screen.snapshot` en macOS/Windows) no forman parte de la tabla estática de valores predeterminados por plataforma anterior. Pasan a estar disponibles cuando el operador aprueba una solicitud de emparejamiento que los declara; a partir de entonces, el conjunto de comandos aprobado del nodo los conserva al reconectarse.

Los comandos peligrosos o con gran impacto en la privacidad aún requieren una inclusión explícita con `gateway.nodes.allowCommands`, incluso si un nodo los declara: `camera.snap`, `camera.clip`, `screen.record`, `contacts.add`, `calendar.add`, `reminders.add`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` siempre prevalece sobre los valores predeterminados y las entradas adicionales de la lista de permitidos.

Los comandos de nodo propiedad de un Plugin pueden agregar una política de invocación de nodos del Gateway. Esa política se ejecuta después de la comprobación de la lista de permitidos y antes de reenviar al nodo, por lo que `node.invoke` sin procesar, los ayudantes de CLI y las herramientas de agente dedicadas comparten el mismo límite de permisos del plugin. Los comandos de nodo peligrosos del plugin aún requieren una inclusión explícita en `gateway.nodes.allowCommands`.

Después de que un nodo cambie su lista de comandos declarada, rechaza el emparejamiento antiguo del dispositivo y aprueba la nueva solicitud para que el gateway almacene la instantánea de comandos actualizada.

## Configuración (`openclaw.json`)

Los ajustes relacionados con nodos viven bajo `gateway.nodes` y `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

Usa nombres exactos de comandos de nodo. `denyCommands` elimina un comando incluso cuando un valor predeterminado de plataforma o una entrada de `allowCommands` lo permitiría de otro modo. Consulta la [referencia de configuración del Gateway](/es/gateway/configuration-reference#gateway) para ver detalles sobre el emparejamiento de nodos del gateway y los campos de política de comandos.

Anulación de nodo de ejecución por agente:

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

## Capturas de pantalla (instantáneas de canvas)

Si el nodo está mostrando Canvas (WebView), `canvas.snapshot` devuelve `{ format, base64 }`.

Ayudante de CLI (escribe en un archivo temporal e imprime la ruta guardada):

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

- `canvas present` acepta URL o rutas de archivos locales (`--target`), además de `--x/--y/--width/--height` opcionales para posicionamiento.
- `canvas eval` acepta JS en línea (`--js`) o un argumento posicional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notas:

- Los nodos móviles usan una página A2UI incluida y propiedad de la app para renderizado con capacidad de acciones.
- Solo se admite A2UI v0.8 JSONL (v0.9/createSurface se rechaza).
- iOS y Android renderizan páginas remotas de Gateway Canvas, pero las acciones de botones A2UI se despachan solo desde la página A2UI incluida y propiedad de la app. Las páginas A2UI HTTP/HTTPS alojadas en Gateway son solo de renderizado en esos clientes móviles.

## Fotos y videos (cámara del nodo)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Clips de video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notas:

- El nodo debe estar **en primer plano** para `canvas.*` y `camera.*` (las llamadas en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE`).
- Los nodos limitan la duración de los clips para mantener manejable la carga útil base64 (consulta [Captura de cámara](/es/nodes/camera) para ver los límites exactos por plataforma). La herramienta de agente `nodes` además limita el `durationMs` solicitado a 300000 (5 minutos) antes de reenviar la llamada; el propio nodo aplica el límite más estricto.
- Android solicitará permisos `CAMERA`/`RECORD_AUDIO` cuando sea posible; los permisos denegados fallan con `*_PERMISSION_REQUIRED`.

## Grabaciones de pantalla (nodos)

Los nodos compatibles exponen `screen.record` (mp4). Ejemplo:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notas:

- La disponibilidad de `screen.record` depende de la plataforma del nodo.
- La herramienta de agente `nodes` limita el `durationMs` solicitado a 300000 (5 minutos); el nodo puede aplicar un límite más estricto para acotar la carga útil devuelta.
- `--no-audio` desactiva la captura del micrófono en las plataformas compatibles.
- Usa `--screen <index>` para seleccionar una pantalla cuando haya varias pantallas disponibles (0 = principal).

## Ubicación (nodos)

Los nodos exponen `location.get` cuando Ubicación está habilitada en los ajustes.

Ayudante de CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notas:

- Ubicación está **desactivada de forma predeterminada**.
- "Always" requiere permiso del sistema; la obtención en segundo plano es de mejor esfuerzo.
- La respuesta incluye lat/lon, precisión (metros) y marca de tiempo.
- Forma completa de parámetros/respuesta y códigos de error: [Comando de ubicación](/es/nodes/location-command).

## SMS (nodos Android)

Los nodos Android pueden exponer `sms.send` y `sms.search` cuando el usuario concede permiso de **SMS** y el dispositivo admite telefonía. Ambos comandos son peligrosos de forma predeterminada: el operador del gateway también debe agregarlos a `gateway.nodes.allowCommands` antes de que puedan invocarse (consulta [Política de comandos](#command-policy)).

Invocación de bajo nivel:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notas:

- La solicitud de permiso debe aceptarse en el dispositivo Android antes de que se anuncie la capacidad.
- Los dispositivos solo Wi-Fi sin telefonía no anunciarán `sms.send`.

## Comandos de dispositivo y datos personales

Los nodos iOS, Android y macOS anuncian varios comandos de datos de solo lectura de forma predeterminada (consulta la tabla de [Política de comandos](#command-policy)); Android además expone una familia más amplia controlada por sus propios ajustes dentro de la app.

Familias disponibles:

- `device.status`, `device.info` — iOS, Android, macOS, Windows.
- `device.permissions`, `device.health`, `device.apps` — solo Android; `device.apps` requiere que el uso compartido de apps instaladas esté habilitado en los ajustes de Android y devuelve de forma predeterminada las apps visibles en el lanzador.
- `notifications.list`, `notifications.actions` — solo Android.
- `photos.latest` — iOS, Android, macOS.
- `contacts.search` — iOS, Android, macOS (valor predeterminado de solo lectura); `contacts.add` es peligroso y necesita `gateway.nodes.allowCommands`.
- `calendar.events` — iOS, Android, macOS (valor predeterminado de solo lectura); `calendar.add` es peligroso y necesita `gateway.nodes.allowCommands`.
- `reminders.list` — iOS, Android, macOS (valor predeterminado de solo lectura); `reminders.add` es peligroso y necesita `gateway.nodes.allowCommands`.
- `callLog.search` — solo Android.
- `motion.activity`, `motion.pedometer` — iOS, Android, macOS; controlados por capacidad según los sensores disponibles.

Invocaciones de ejemplo:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Comandos del sistema (host de nodo / nodo mac)

El nodo macOS expone `system.run`, `system.notify` y `system.execApprovals.get/set`. El host de nodo sin interfaz expone `system.run`, `system.which` y `system.execApprovals.get/set`.

Ejemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notas:

- `system.run` devuelve stdout/stderr/código de salida en la carga útil.
- La ejecución de shell ahora pasa por la herramienta `exec` con `host=node`; `nodes` sigue siendo la superficie RPC directa para comandos de nodo explícitos.
- `nodes invoke` no expone `system.run` ni `system.run.prepare`; estos permanecen solo en la ruta de exec.
- La ruta de exec prepara un `systemRunPlan` canónico antes de la aprobación. Una vez concedida una aprobación, el gateway reenvía ese plan almacenado, no ningún campo command/cwd/session editado posteriormente por el llamador.
- `system.notify` respeta el estado del permiso de notificaciones en la app de macOS; admite `--priority <passive|active|timeSensitive>` y `--delivery <system|overlay|auto>`.
- Los metadatos de nodo `platform` / `deviceFamily` no reconocidos usan una lista de permitidos predeterminada conservadora que excluye `system.run` y `system.which`. Si necesitas intencionalmente esos comandos para una plataforma desconocida, agrégalos explícitamente mediante `gateway.nodes.allowCommands`.
- `system.run` admite `--cwd`, `--env KEY=VAL`, `--command-timeout` y `--needs-screen-recording`.
- Para envoltorios de shell (`bash|sh|zsh ... -c/-lc`), los valores `--env` con alcance de solicitud se reducen a una lista de permitidos explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisiones de permitir siempre en modo de lista de permitidos, los envoltorios de despacho conocidos (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persisten las rutas de ejecutables internos en lugar de las rutas de los envoltorios. Si desenvolver no es seguro, no se persiste automáticamente ninguna entrada en la lista de permitidos.
- En hosts de nodo Windows en modo de lista de permitidos, las ejecuciones de envoltorio de shell mediante `cmd.exe /c` requieren aprobación (una entrada en la lista de permitidos por sí sola no permite automáticamente la forma de envoltorio).
- Los hosts de nodo ignoran sobrescrituras de `PATH` en `--env` y eliminan un conjunto amplio y mantenido de variables de inicio de intérprete/shell (por ejemplo `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) antes de ejecutar un comando. Si necesitas entradas adicionales en PATH, configura el entorno del servicio del host de nodo (o instala herramientas en ubicaciones estándar) en lugar de pasar `PATH` mediante `--env`.
- En modo de nodo macOS, `system.run` está controlado por aprobaciones de exec en la app de macOS (Ajustes → Aprobaciones de exec). Ask/allowlist/full se comportan igual que en el host de nodo sin interfaz; las solicitudes denegadas devuelven `SYSTEM_RUN_DENIED`.
- En el host de nodo sin interfaz, `system.run` está controlado por aprobaciones de exec (`~/.openclaw/exec-approvals.json`); específicamente en macOS, consulta las variables de entorno de enrutamiento del host de exec bajo [Host de nodo sin interfaz](#headless-node-host-cross-platform) más abajo.

## Vinculación de nodo de exec

Cuando hay varios nodos disponibles, puedes vincular exec a un nodo específico. Esto establece el nodo predeterminado para `exec host=node` (y puede anularse por agente).

Valor predeterminado global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Anulación por agente:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Desconfigurar para permitir cualquier nodo:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Mapa de permisos

Los nodos pueden incluir un mapa `permissions` en `node.list` / `node.describe`, indexado por nombre de permiso (por ejemplo, `screenRecording`, `accessibility`, `location`) con valores booleanos (`true` = concedido).

## Host de nodo sin interfaz (multiplataforma)

OpenClaw puede ejecutar un **host de nodo sin interfaz** (sin UI) que se conecta al WebSocket del Gateway y expone `system.run` / `system.which`. Esto es útil en Linux/Windows o para ejecutar un nodo mínimo junto a un servidor.

Inícielo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notas:

- El emparejamiento sigue siendo obligatorio (el Gateway mostrará una solicitud de emparejamiento de dispositivo).
- El host de nodo almacena su id de nodo, token, nombre visible e información de conexión del Gateway en `~/.openclaw/node.json`.
- Las aprobaciones de ejecución se aplican localmente mediante `~/.openclaw/exec-approvals.json` (consulte [Aprobaciones de ejecución](/es/tools/exec-approvals)).
- En macOS, el host de nodo sin interfaz ejecuta `system.run` localmente de forma predeterminada. Configure `OPENCLAW_NODE_EXEC_HOST=app` para enrutar `system.run` a través del host de ejecución de la app complementaria; agregue `OPENCLAW_NODE_EXEC_FALLBACK=0` para requerir el host de la app y fallar de forma cerrada si no está disponible.
- Agregue `--tls` / `--tls-fingerprint` cuando el WS del Gateway use TLS.

## Modo de nodo Mac

- La app de la barra de menús de macOS se conecta al servidor WS del Gateway como un nodo (por lo que `openclaw nodes …` funciona contra este Mac).
- En modo remoto, la app abre un túnel SSH para el puerto del Gateway y se conecta a `localhost`.
