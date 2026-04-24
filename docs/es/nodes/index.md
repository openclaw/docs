---
read_when:
    - Emparejar nodos iOS/Android con un gateway
    - Usar canvas/cámara de nodos para el contexto del agente
    - Añadir nuevos comandos de nodo o ayudantes de CLI
summary: 'Nodes: emparejamiento, capacidades, permisos y ayudantes de CLI para canvas/cámara/pantalla/dispositivo/notificaciones/sistema'
title: Nodes
x-i18n:
    generated_at: "2026-04-24T05:36:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a210a5b90d78870dd6d17c0f0a81181a8897dc41149618c4359d7c03ef342fd
    source_path: nodes/index.md
    workflow: 15
---

Un **node** es un dispositivo complementario (macOS/iOS/Android/sin interfaz) que se conecta al Gateway por **WebSocket** (mismo puerto que los operadores) con `role: "node"` y expone una superficie de comandos (por ejemplo `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) mediante `node.invoke`. Detalles del protocolo: [Protocolo de Gateway](/es/gateway/protocol).

Transporte heredado: [Protocolo Bridge](/es/gateway/bridge-protocol) (TCP JSONL;
solo histórico para los nodos actuales).

macOS también puede ejecutarse en **modo node**: la app de barra de menús se conecta al servidor WS del Gateway y expone sus comandos locales de canvas/cámara como node (así `openclaw nodes …` funciona contra este Mac).

Notas:

- Los nodes son **periféricos**, no gateways. No ejecutan el servicio gateway.
- Los mensajes de Telegram/WhatsApp/etc. llegan al **gateway**, no a los nodes.
- Guía operativa de solución de problemas: [/nodes/troubleshooting](/es/nodes/troubleshooting)

## Emparejamiento + estado

**Los nodos WS usan emparejamiento de dispositivos.** Los nodos presentan una identidad de dispositivo durante `connect`; el Gateway
crea una solicitud de emparejamiento de dispositivo para `role: node`. Apruébala mediante la CLI de dispositivos (o la UI).

CLI rápida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Si un node reintenta con detalles de autenticación cambiados (rol/alcances/clave pública), la
solicitud pendiente anterior queda reemplazada y se crea un nuevo `requestId`. Vuelve a ejecutar
`openclaw devices list` antes de aprobar.

Notas:

- `nodes status` marca un node como **emparejado** cuando el rol de emparejamiento del dispositivo incluye `node`.
- El registro de emparejamiento del dispositivo es el contrato duradero de rol aprobado. La
  rotación de token permanece dentro de ese contrato; no puede actualizar un node emparejado a un
  rol distinto que la aprobación de emparejamiento nunca concedió.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) es un almacén separado de emparejamiento de nodos propiedad del gateway; **no** controla el handshake WS `connect`.
- El alcance de aprobación sigue los comandos declarados por la solicitud pendiente:
  - solicitud sin comando: `operator.pairing`
  - comandos de node que no son exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host de node remoto (system.run)

Usa un **host de node** cuando tu Gateway se ejecuta en una máquina y quieres que los comandos
se ejecuten en otra. El modelo sigue hablando con el **gateway**; el gateway
reenvía llamadas `exec` al **host de node** cuando se selecciona `host=node`.

### Qué se ejecuta dónde

- **Host del Gateway**: recibe mensajes, ejecuta el modelo, enruta llamadas a herramientas.
- **Host del node**: ejecuta `system.run`/`system.which` en la máquina del node.
- **Aprobaciones**: se aplican en el host del node mediante `~/.openclaw/exec-approvals.json`.

Nota sobre aprobaciones:

- Las ejecuciones de node respaldadas por aprobación vinculan el contexto exacto de la solicitud.
- Para ejecuciones directas de shell/runtime sobre archivos, OpenClaw también vincula con el mejor esfuerzo un único
  operando de archivo local concreto y deniega la ejecución si ese archivo cambia antes de ejecutarse.
- Si OpenClaw no puede identificar exactamente un único archivo local concreto para un comando de intérprete/runtime,
  la ejecución respaldada por aprobación se deniega en lugar de fingir cobertura completa del entorno de ejecución. Usa sandboxing,
  hosts separados o una allowlist/flujo completo de confianza explícito para semánticas más amplias de intérprete.

### Iniciar un host de node (primer plano)

En la máquina del node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto mediante túnel SSH (enlace loopback)

Si el Gateway se enlaza a loopback (`gateway.bind=loopback`, predeterminado en modo local),
los hosts de node remotos no pueden conectarse directamente. Crea un túnel SSH y apunta el
host de node al extremo local del túnel.

Ejemplo (host de node -> host del gateway):

```bash
# Terminal A (mantener en ejecución): reenviar el puerto local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exportar el token del gateway y conectar a través del túnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notas:

- `openclaw node run` admite autenticación por token o contraseña.
- Se prefieren variables de entorno: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- El respaldo por configuración es `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host de node ignora intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- En modo remoto, `gateway.remote.token` / `gateway.remote.password` son válidos según las reglas de precedencia remota.
- Si los SecretRefs activos locales `gateway.auth.*` están configurados pero no resueltos, la autenticación del host de node falla en modo cerrado.
- La resolución de autenticación del host de node solo respeta variables env `OPENCLAW_GATEWAY_*`.

### Iniciar un host de node (servicio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Emparejar + nombrar

En el host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si el node reintenta con detalles de autenticación cambiados, vuelve a ejecutar `openclaw devices list`
y aprueba el `requestId` actual.

Opciones de nombre:

- `--display-name` en `openclaw node run` / `openclaw node install` (se conserva en `~/.openclaw/node.json` en el node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (sobrescritura del gateway).

### Añadir los comandos a la allowlist

Las aprobaciones de exec son **por host de node**. Añade entradas a la allowlist desde el gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Las aprobaciones viven en el host de node en `~/.openclaw/exec-approvals.json`.

### Apuntar exec al node

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

Una vez configurado, cualquier llamada `exec` con `host=node` se ejecuta en el host de node (sujeto a la
allowlist/aprobaciones del node).

`host=auto` no elegirá implícitamente el node por sí solo, pero sí se permite una solicitud explícita por llamada `host=node` desde `auto`. Si quieres que exec en node sea el valor predeterminado de la sesión, configura `tools.exec.host=node` o `/exec host=node ...` explícitamente.

Relacionado:

- [CLI de host de node](/es/cli/node)
- [Herramienta exec](/es/tools/exec)
- [Aprobaciones de exec](/es/tools/exec-approvals)

## Invocar comandos

Nivel bajo (RPC sin procesar):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Existen ayudantes de más alto nivel para los flujos comunes de “darle al agente un adjunto MEDIA”.

## Capturas de pantalla (instantáneas de canvas)

Si el node está mostrando Canvas (WebView), `canvas.snapshot` devuelve `{ format, base64 }`.

Ayudante de CLI (escribe en un archivo temporal e imprime `MEDIA:<path>`):

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

- `canvas present` acepta URL o rutas de archivo locales (`--target`), además de `--x/--y/--width/--height` opcionales para posicionamiento.
- `canvas eval` acepta JS inline (`--js`) o un argumento posicional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notas:

- Solo se admite A2UI v0.8 JSONL (se rechaza v0.9/createSurface).

## Fotos + videos (cámara del node)

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

- El node debe estar **en primer plano** para `canvas.*` y `camera.*` (las llamadas en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE`).
- La duración del clip está limitada (actualmente `<= 60s`) para evitar cargas útiles base64 sobredimensionadas.
- Android solicitará permisos `CAMERA`/`RECORD_AUDIO` cuando sea posible; los permisos denegados fallan con `*_PERMISSION_REQUIRED`.

## Grabaciones de pantalla (nodes)

Los nodes compatibles exponen `screen.record` (mp4). Ejemplo:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notas:

- La disponibilidad de `screen.record` depende de la plataforma del node.
- Las grabaciones de pantalla están limitadas a `<= 60s`.
- `--no-audio` deshabilita la captura del micrófono en plataformas compatibles.
- Usa `--screen <index>` para seleccionar una pantalla cuando haya varias disponibles.

## Ubicación (nodes)

Los nodes exponen `location.get` cuando Ubicación está habilitada en configuración.

Ayudante de CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notas:

- La ubicación está **desactivada de forma predeterminada**.
- “Always” requiere permiso del sistema; la obtención en segundo plano es de mejor esfuerzo.
- La respuesta incluye lat/lon, precisión (metros) y marca de tiempo.

## SMS (nodes Android)

Los nodes Android pueden exponer `sms.send` cuando el usuario concede permiso de **SMS** y el dispositivo admite telefonía.

Invocación de bajo nivel:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notas:

- La solicitud de permiso debe aceptarse en el dispositivo Android antes de que se anuncie la capacidad.
- Los dispositivos solo Wi‑Fi sin telefonía no anunciarán `sms.send`.

## Comandos de dispositivo Android + datos personales

Los nodes Android pueden anunciar familias adicionales de comandos cuando las capacidades correspondientes están habilitadas.

Familias disponibles:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Ejemplos de invocación:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Notas:

- Los comandos de movimiento están controlados por capacidad según los sensores disponibles.

## Comandos del sistema (host de node / node de Mac)

El node de macOS expone `system.run`, `system.notify` y `system.execApprovals.get/set`.
El host de node sin interfaz expone `system.run`, `system.which` y `system.execApprovals.get/set`.

Ejemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notas:

- `system.run` devuelve stdout/stderr/código de salida en la carga útil.
- La ejecución de shell ahora pasa por la herramienta `exec` con `host=node`; `nodes` sigue siendo la superficie RPC directa para comandos explícitos del node.
- `nodes invoke` no expone `system.run` ni `system.run.prepare`; estos permanecen solo en la ruta de exec.
- La ruta exec prepara un `systemRunPlan` canónico antes de la aprobación. Una vez
  concedida una aprobación, el gateway reenvía ese plan almacenado, no campos de comando/cwd/sesión editados posteriormente por quien llama.
- `system.notify` respeta el estado del permiso de notificaciones en la app de macOS.
- Los metadatos no reconocidos de `platform` / `deviceFamily` del node usan una allowlist predeterminada conservadora que excluye `system.run` y `system.which`. Si intencionalmente necesitas esos comandos para una plataforma desconocida, añádelos explícitamente mediante `gateway.nodes.allowCommands`.
- `system.run` admite `--cwd`, `--env KEY=VAL`, `--command-timeout` y `--needs-screen-recording`.
- Para envoltorios de shell (`bash|sh|zsh ... -c/-lc`), los valores `--env` con alcance de solicitud se reducen a una allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisiones de permitir siempre en modo allowlist, los envoltorios de despacho conocidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan rutas de ejecutables internos en lugar de rutas del envoltorio. Si el desempaquetado no es seguro, no se conserva automáticamente ninguna entrada de allowlist.
- En hosts de node Windows en modo allowlist, las ejecuciones mediante envoltorio de shell con `cmd.exe /c` requieren aprobación (la entrada de allowlist por sí sola no permite automáticamente la forma con envoltorio).
- `system.notify` admite `--priority <passive|active|timeSensitive>` y `--delivery <system|overlay|auto>`.
- Los hosts de node ignoran sobrescrituras de `PATH` y eliminan claves peligrosas de inicio/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Si necesitas entradas adicionales de PATH, configura el entorno del servicio del host de node (o instala herramientas en ubicaciones estándar) en lugar de pasar `PATH` mediante `--env`.
- En el modo node de macOS, `system.run` está controlado por aprobaciones de exec en la app de macOS (Configuración → Aprobaciones de exec).
  Ask/allowlist/full se comportan igual que en el host de node sin interfaz; las solicitudes denegadas devuelven `SYSTEM_RUN_DENIED`.
- En el host de node sin interfaz, `system.run` está controlado por aprobaciones de exec (`~/.openclaw/exec-approvals.json`).

## Enlace de exec al node

Cuando hay varios nodes disponibles, puedes vincular exec a un node específico.
Esto establece el node predeterminado para `exec host=node` (y puede sobrescribirse por agente).

Predeterminado global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Sobrescritura por agente:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Desactívalo para permitir cualquier node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mapa de permisos

Los nodes pueden incluir un mapa `permissions` en `node.list` / `node.describe`, con clave por nombre de permiso (por ejemplo `screenRecording`, `accessibility`) y valores booleanos (`true` = concedido).

## Host de node sin interfaz (multiplataforma)

OpenClaw puede ejecutar un **host de node sin interfaz** (sin UI) que se conecta al WebSocket del Gateway
y expone `system.run` / `system.which`. Esto es útil en Linux/Windows
o para ejecutar un node mínimo junto a un servidor.

Inícialo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notas:

- El emparejamiento sigue siendo obligatorio (el Gateway mostrará una solicitud de emparejamiento de dispositivo).
- El host de node conserva su ID de node, token, nombre visible e información de conexión del gateway en `~/.openclaw/node.json`.
- Las aprobaciones de exec se aplican localmente mediante `~/.openclaw/exec-approvals.json`
  (consulta [Aprobaciones de exec](/es/tools/exec-approvals)).
- En macOS, el host de node sin interfaz ejecuta `system.run` localmente de forma predeterminada. Establece
  `OPENCLAW_NODE_EXEC_HOST=app` para enrutar `system.run` a través del host exec de la app complementaria; añade
  `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir el host de la app y fallar en modo cerrado si no está disponible.
- Añade `--tls` / `--tls-fingerprint` cuando el WS del Gateway use TLS.

## Modo node de Mac

- La app de barra de menús de macOS se conecta al servidor WS del Gateway como node (así `openclaw nodes …` funciona contra este Mac).
- En modo remoto, la app abre un túnel SSH para el puerto del Gateway y se conecta a `localhost`.
