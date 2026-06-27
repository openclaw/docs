---
read_when:
    - Emparejar nodos iOS/Android con un Gateway
    - Usar canvas/cámara de Node para el contexto del agente
    - Agregar nuevos comandos de Node o ayudantes de CLI
summary: 'Nodos: emparejamiento, capacidades, permisos y utilidades de CLI para lienzo/cámara/pantalla/dispositivo/notificaciones/sistema'
title: Nodos
x-i18n:
    generated_at: "2026-06-27T11:53:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

Un **nodo** es un dispositivo complementario (macOS/iOS/Android/headless) que se conecta al **WebSocket** del Gateway (mismo puerto que los operadores) con `role: "node"` y expone una superficie de comandos (por ejemplo, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) mediante `node.invoke`. Detalles del protocolo: [protocolo del Gateway](/es/gateway/protocol).

Transporte heredado: [protocolo Bridge](/es/gateway/bridge-protocol) (TCP JSONL;
solo histórico para los nodos actuales).

macOS también puede ejecutarse en **modo nodo**: la app de la barra de menús se conecta al servidor WS del Gateway y expone sus comandos locales de canvas/cámara como un nodo (para que `openclaw nodes …` funcione contra este Mac). En modo de Gateway remoto, la automatización del navegador la gestiona el host de nodo de la CLI (`openclaw node run` o el servicio de nodo instalado), no el nodo de la app nativa.

Notas:

- Los nodos son **periféricos**, no gateways. No ejecutan el servicio de Gateway.
- Los mensajes de Telegram/WhatsApp/etc. llegan al **gateway**, no a los nodos.
- Runbook de solución de problemas: [/nodes/troubleshooting](/es/nodes/troubleshooting)

## Emparejamiento + estado

**Los nodos WS usan emparejamiento de dispositivos.** Los nodos presentan una identidad de dispositivo durante `connect`; el Gateway crea una solicitud de emparejamiento de dispositivo para `role: node`. Apruébala mediante la CLI de dispositivos (o la UI).

CLI rápida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Si un nodo reintenta con detalles de autenticación cambiados (rol/ámbitos/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`. Vuelve a ejecutar `openclaw devices list` antes de aprobar.

Notas:

- `nodes status` marca un nodo como **emparejado** cuando su rol de emparejamiento de dispositivo incluye `node`.
- El registro de emparejamiento de dispositivo es el contrato durable de roles aprobados. La rotación de tokens permanece dentro de ese contrato; no puede actualizar un nodo emparejado a un rol diferente que la aprobación de emparejamiento nunca concedió.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) es un almacén de emparejamiento de nodos separado y propiedad del gateway; **no** controla el handshake WS de `connect`.
- `openclaw nodes remove --node <id|name|ip>` elimina un emparejamiento de nodo. Para un nodo respaldado por dispositivo, revoca el rol `node` del dispositivo en `devices/paired.json` y desconecta las sesiones con rol de nodo de ese dispositivo: un dispositivo con roles mixtos conserva su fila y solo pierde el rol `node`, mientras que una fila de dispositivo que solo es nodo se elimina. También borra cualquier entrada coincidente del almacén separado de emparejamiento de nodos propiedad del gateway. `operator.pairing` puede eliminar filas de nodos que no son operadores; un llamador con token de dispositivo que revoca su propio rol de nodo en un dispositivo con roles mixtos necesita además `operator.admin`.
- El ámbito de aprobación sigue los comandos declarados de la solicitud pendiente:
  - solicitud sin comandos: `operator.pairing`
  - comandos de nodo no exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host de nodo remoto (system.run)

Usa un **host de nodo** cuando tu Gateway se ejecuta en una máquina y quieres que los comandos se ejecuten en otra. El modelo sigue hablando con el **gateway**; el gateway reenvía las llamadas `exec` al **host de nodo** cuando se selecciona `host=node`.

### Qué se ejecuta dónde

- **Host del Gateway**: recibe mensajes, ejecuta el modelo, enruta llamadas a herramientas.
- **Host de nodo**: ejecuta `system.run`/`system.which` en la máquina del nodo.
- **Aprobaciones**: se aplican en el host de nodo mediante `~/.openclaw/exec-approvals.json`.

Nota sobre aprobaciones:

- Las ejecuciones de nodo respaldadas por aprobación vinculan el contexto exacto de la solicitud.
- Para ejecuciones directas de archivos de shell/runtime, OpenClaw también intenta vincular un operando de archivo local concreto y deniega la ejecución si ese archivo cambia antes de la ejecución.
- Si OpenClaw no puede identificar exactamente un archivo local concreto para un comando de intérprete/runtime, la ejecución respaldada por aprobación se deniega en lugar de fingir cobertura completa del runtime. Usa sandboxing, hosts separados o una allowlist explícita de confianza/flujo de trabajo completo para semánticas de intérprete más amplias.

### Iniciar un host de nodo (primer plano)

En la máquina del nodo:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto mediante túnel SSH (enlace loopback)

Si el Gateway se enlaza a loopback (`gateway.bind=loopback`, valor predeterminado en modo local), los hosts de nodo remotos no pueden conectarse directamente. Crea un túnel SSH y apunta el host de nodo al extremo local del túnel.

Ejemplo (host de nodo -> host del gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notas:

- `openclaw node run` admite autenticación con token o contraseña.
- Se prefieren las variables de entorno: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- El fallback de configuración es `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host de nodo ignora intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- En modo remoto, `gateway.remote.token` / `gateway.remote.password` son elegibles según las reglas de precedencia remota.
- Si hay SecretRefs locales activos de `gateway.auth.*` configurados pero sin resolver, la autenticación del host de nodo falla de forma cerrada.
- La resolución de autenticación del host de nodo solo respeta las variables de entorno `OPENCLAW_GATEWAY_*`.

### Iniciar un host de nodo (servicio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Emparejar + nombrar

En el host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si el nodo reintenta con detalles de autenticación cambiados, vuelve a ejecutar `openclaw devices list` y aprueba el `requestId` actual.

Opciones de nombre:

- `--display-name` en `openclaw node run` / `openclaw node install` (persiste en `~/.openclaw/node.json` en el nodo).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (anulación del gateway).

### Añadir los comandos a la allowlist

Las aprobaciones de exec son **por host de nodo**. Añade entradas de allowlist desde el gateway:

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

```
/exec host=node security=allowlist node=<id-or-name>
```

Una vez configurado, cualquier llamada `exec` con `host=node` se ejecuta en el host de nodo (sujeta a la allowlist/aprobaciones del nodo).

`host=auto` no elegirá implícitamente el nodo por sí solo, pero se permite una solicitud explícita por llamada `host=node` desde `auto`. Si quieres que exec de nodo sea el valor predeterminado de la sesión, configura `tools.exec.host=node` o `/exec host=node ...` explícitamente.

Relacionado:

- [CLI del host de nodo](/es/cli/node)
- [Herramienta exec](/es/tools/exec)
- [Aprobaciones de exec](/es/tools/exec-approvals)

## Invocar comandos

Bajo nivel (RPC sin procesar):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Existen helpers de nivel superior para los flujos de trabajo comunes de "dar al agente un adjunto MEDIA".

## Política de comandos

Los comandos de nodo deben pasar dos controles antes de poder invocarse:

1. El nodo debe declarar el comando en su lista WebSocket `connect.commands`.
2. La política de plataforma del gateway debe permitir el comando declarado.

Los nodos complementarios de Windows y macOS permiten de forma predeterminada comandos declarados seguros como `canvas.*`, `camera.list`, `location.get` y `screen.snapshot`. Los nodos de confianza que anuncian la capacidad `talk` o declaran comandos `talk.*` también permiten de forma predeterminada comandos declarados de pulsar para hablar (`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`), independientemente de la etiqueta de plataforma. Los comandos peligrosos o con gran impacto en la privacidad, como `camera.snap`, `camera.clip` y `screen.record`, siguen requiriendo opt-in explícito con `gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` siempre prevalece sobre los valores predeterminados y las entradas adicionales de allowlist.

Los comandos de nodo propiedad de un Plugin pueden añadir una política node-invoke del Gateway. Esa política se ejecuta después de la comprobación de allowlist y antes del reenvío al nodo, por lo que `node.invoke` sin procesar, los helpers de la CLI y las herramientas dedicadas de agente comparten el mismo límite de permisos del Plugin. Los comandos de nodo peligrosos de Plugin siguen requiriendo opt-in explícito con `gateway.nodes.allowCommands`.

Después de que un nodo cambie su lista de comandos declarados, rechaza el emparejamiento de dispositivo antiguo y aprueba la nueva solicitud para que el gateway almacene la instantánea de comandos actualizada.

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

Usa nombres exactos de comandos de nodo. `denyCommands` elimina un comando incluso cuando un valor predeterminado de plataforma o una entrada `allowCommands` lo permitiría de otro modo. Consulta la [referencia de configuración del Gateway](/es/gateway/configuration-reference#gateway-field-details) para obtener detalles de campos sobre emparejamiento de nodos del gateway y política de comandos.

Anulación de nodo exec por agente:

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

Si el nodo muestra el Canvas (WebView), `canvas.snapshot` devuelve `{ format, base64 }`.

Helper de CLI (escribe en un archivo temporal e imprime la ruta guardada):

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

- `canvas present` acepta URLs o rutas de archivos locales (`--target`), además de `--x/--y/--width/--height` opcionales para posicionamiento.
- `canvas eval` acepta JS en línea (`--js`) o un argumento posicional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notas:

- Los nodos móviles usan una página A2UI empaquetada y propiedad de la app para el renderizado con capacidad de acciones.
- Solo se admite JSONL de A2UI v0.8 (v0.9/createSurface se rechaza).
- iOS y Android renderizan páginas remotas de Gateway Canvas, pero las acciones de botones A2UI se despachan solo desde la página A2UI empaquetada y propiedad de la app. Las páginas A2UI HTTP/HTTPS alojadas en el Gateway son de solo renderizado en esos clientes móviles.

## Fotos + videos (cámara del nodo)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # predeterminado: ambas orientaciones (2 líneas MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clips de video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notas:

- El nodo debe estar **en primer plano** para `canvas.*` y `camera.*` (las llamadas en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE`).
- La duración del clip se limita (actualmente `<= 60s`) para evitar cargas útiles base64 demasiado grandes.
- Android solicitará permisos de `CAMERA`/`RECORD_AUDIO` cuando sea posible; los permisos denegados fallan con `*_PERMISSION_REQUIRED`.

## Grabaciones de pantalla (nodos)

Los nodos compatibles exponen `screen.record` (mp4). Ejemplo:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notas:

- La disponibilidad de `screen.record` depende de la plataforma del nodo.
- Las grabaciones de pantalla se limitan a `<= 60s`.
- `--no-audio` desactiva la captura del micrófono en las plataformas compatibles.
- Use `--screen <index>` para seleccionar una pantalla cuando haya varias pantallas disponibles.

## Ubicación (nodos)

Los nodos exponen `location.get` cuando la ubicación está habilitada en la configuración.

Ayudante de CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notas:

- La ubicación está **desactivada de forma predeterminada**.
- "Always" requiere permiso del sistema; la obtención en segundo plano se realiza con el máximo esfuerzo.
- La respuesta incluye lat/lon, precisión (metros) y marca de tiempo.

## SMS (nodos Android)

Los nodos Android pueden exponer `sms.send` cuando el usuario concede permiso de **SMS** y el dispositivo admite telefonía.

Invocación de bajo nivel:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notas:

- La solicitud de permiso debe aceptarse en el dispositivo Android antes de que se anuncie la capacidad.
- Los dispositivos solo Wi-Fi sin telefonía no anunciarán `sms.send`.

## Comandos de dispositivo Android + datos personales

Los nodos Android pueden anunciar familias de comandos adicionales cuando las capacidades correspondientes están habilitadas.

Familias disponibles:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` cuando el uso compartido de aplicaciones instaladas está habilitado en la configuración de Android
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Ejemplos de invocaciones:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Notas:

- `device.apps` es opcional y devuelve de forma predeterminada las apps visibles en el lanzador.
- Los comandos de movimiento están limitados por capacidad según los sensores disponibles.

## Comandos del sistema (host de Node / nodo Mac)

El nodo de macOS expone `system.run`, `system.notify` y `system.execApprovals.get/set`.
El host de Node sin interfaz expone `system.run`, `system.which` y `system.execApprovals.get/set`.

Ejemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notas:

- `system.run` devuelve stdout/stderr/código de salida en la carga útil.
- La ejecución de shell ahora pasa por la herramienta `exec` con `host=node`; `nodes` sigue siendo la superficie RPC directa para comandos explícitos de nodo.
- `nodes invoke` no expone `system.run` ni `system.run.prepare`; estos permanecen solo en la ruta de exec.
- La ruta de exec prepara un `systemRunPlan` canónico antes de la aprobación. Una vez
  concedida una aprobación, el Gateway reenvía ese plan almacenado, no los campos
  command/cwd/session que el llamador edite posteriormente.
- `system.notify` respeta el estado de permisos de notificaciones en la app de macOS.
- Los metadatos de `platform` / `deviceFamily` de nodo no reconocidos usan una lista de permitidos predeterminada conservadora que excluye `system.run` y `system.which`. Si necesitas intencionadamente esos comandos para una plataforma desconocida, agrégalos explícitamente mediante `gateway.nodes.allowCommands`.
- `system.run` admite `--cwd`, `--env KEY=VAL`, `--command-timeout` y `--needs-screen-recording`.
- Para envoltorios de shell (`bash|sh|zsh ... -c/-lc`), los valores `--env` con alcance de solicitud se reducen a una lista de permitidos explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisiones de permitir siempre en modo de lista de permitidos, los envoltorios de despacho conocidos (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persisten las rutas de los ejecutables internos en lugar de las rutas de los envoltorios. Si desenvolver no es seguro, no se persiste automáticamente ninguna entrada en la lista de permitidos.
- En hosts de Node de Windows en modo de lista de permitidos, las ejecuciones de envoltorio de shell mediante `cmd.exe /c` requieren aprobación (la entrada de la lista de permitidos por sí sola no permite automáticamente la forma con envoltorio).
- `system.notify` admite `--priority <passive|active|timeSensitive>` y `--delivery <system|overlay|auto>`.
- Los hosts de Node ignoran las sobrescrituras de `PATH` y eliminan claves peligrosas de inicio/shell (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Si necesitas entradas adicionales de PATH, configura el entorno del servicio del host de Node (o instala herramientas en ubicaciones estándar) en lugar de pasar `PATH` mediante `--env`.
- En modo de nodo de macOS, `system.run` está controlado por las aprobaciones de exec en la app de macOS (Configuración → Aprobaciones de exec).
  Preguntar/lista de permitidos/completo se comportan igual que en el host de Node sin interfaz; las solicitudes denegadas devuelven `SYSTEM_RUN_DENIED`.
- En el host de Node sin interfaz, `system.run` está controlado por aprobaciones de exec (`~/.openclaw/exec-approvals.json`).

## Vinculación de nodo de exec

Cuando hay varios nodos disponibles, puedes vincular exec a un nodo específico.
Esto establece el nodo predeterminado para `exec host=node` (y se puede sobrescribir por agente).

Valor predeterminado global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Sobrescritura por agente:

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

Los nodos pueden incluir un mapa `permissions` en `node.list` / `node.describe`, indexado por nombre de permiso (por ejemplo, `screenRecording`, `accessibility`) con valores booleanos (`true` = concedido).

## Host de Node sin interfaz (multiplataforma)

OpenClaw puede ejecutar un **host de Node sin interfaz** (sin UI) que se conecta al WebSocket del Gateway
y expone `system.run` / `system.which`. Esto es útil en Linux/Windows
o para ejecutar un nodo mínimo junto a un servidor.

Inícialo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notas:

- El emparejamiento sigue siendo obligatorio (el Gateway mostrará una solicitud de emparejamiento de dispositivo).
- El host de Node almacena su id de nodo, token, nombre para mostrar e información de conexión del Gateway en `~/.openclaw/node.json`.
- Las aprobaciones de exec se aplican localmente mediante `~/.openclaw/exec-approvals.json`
  (consulta [Aprobaciones de exec](/es/tools/exec-approvals)).
- En macOS, el host de Node sin interfaz ejecuta `system.run` localmente de forma predeterminada. Define
  `OPENCLAW_NODE_EXEC_HOST=app` para enrutar `system.run` a través del host de exec de la app complementaria; agrega
  `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir el host de la app y fallar de forma cerrada si no está disponible.
- Agrega `--tls` / `--tls-fingerprint` cuando el WS del Gateway use TLS.

## Modo de nodo de Mac

- La app de la barra de menús de macOS se conecta al servidor WS del Gateway como un nodo (por lo que `openclaw nodes …` funciona contra este Mac).
- En modo remoto, la app abre un túnel SSH para el puerto del Gateway y se conecta a `localhost`.
