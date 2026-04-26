---
read_when:
    - Emparejar Nodes de iOS/Android con un gateway
    - Usar canvas/camera del node para el contexto del agente
    - Añadir nuevos comandos de node o helpers de CLI
summary: 'Nodes: emparejamiento, capacidades, permisos y helpers de CLI para canvas/camera/screen/device/notifications/system'
title: Nodes
x-i18n:
    generated_at: "2026-04-26T11:33:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 611678b91b0e54910fded6f7d25bf4b5ef03e0a4e1da6d72f5ccf30d18054d3d
    source_path: nodes/index.md
    workflow: 15
---

Un **Node** es un dispositivo complementario (macOS/iOS/Android/headless) que se conecta al **WebSocket** del Gateway (el mismo puerto que usan los operadores) con `role: "node"` y expone una superficie de comandos (por ejemplo `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) mediante `node.invoke`. Detalles del protocolo: [Protocolo del Gateway](/es/gateway/protocol).

Transporte heredado: [Protocolo Bridge](/es/gateway/bridge-protocol) (TCP JSONL;
solo histórico para los Nodes actuales).

macOS también puede ejecutarse en **modo Node**: la app de barra de menús se conecta al
servidor WS del Gateway y expone sus comandos locales de canvas/camera como un Node (por lo que
`openclaw nodes …` funciona contra este Mac). En modo de gateway remoto, la
automatización del navegador la gestiona el host CLI del Node (`openclaw node run` o el
servicio Node instalado), no el Node de la app nativa.

Notas:

- Los Nodes son **periféricos**, no gateways. No ejecutan el servicio de gateway.
- Los mensajes de Telegram/WhatsApp/etc. llegan al **gateway**, no a los Nodes.
- Runbook de resolución de problemas: [/nodes/troubleshooting](/es/nodes/troubleshooting)

## Emparejamiento + estado

**Los Nodes WS usan emparejamiento de dispositivos.** Los Nodes presentan una identidad de dispositivo durante `connect`; el Gateway
crea una solicitud de emparejamiento de dispositivo para `role: node`. Apruébala mediante la CLI de dispositivos (o la UI).

CLI rápida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Si un Node vuelve a intentarlo con detalles de autenticación modificados (rol/alcances/clave pública), la solicitud
pendiente anterior se reemplaza y se crea un nuevo `requestId`. Vuelve a ejecutar
`openclaw devices list` antes de aprobar.

Notas:

- `nodes status` marca un Node como **emparejado** cuando su rol de emparejamiento de dispositivo incluye `node`.
- El registro de emparejamiento del dispositivo es el contrato duradero de roles aprobados. La
  rotación del token permanece dentro de ese contrato; no puede convertir un Node emparejado en un
  rol diferente que la aprobación de emparejamiento nunca concedió.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) es un almacén de
  emparejamiento de Node independiente y propiedad del gateway; **no** controla el handshake WS `connect`.
- El alcance de aprobación sigue los comandos declarados en la solicitud pendiente:
  - solicitud sin comandos: `operator.pairing`
  - comandos de Node sin exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host remoto de Node (`system.run`)

Usa un **host de Node** cuando tu Gateway se ejecuta en una máquina y quieres que los comandos
se ejecuten en otra. El modelo sigue hablando con el **gateway**; el gateway
reenvía las llamadas `exec` al **host de Node** cuando se selecciona `host=node`.

### Qué se ejecuta dónde

- **Host del Gateway**: recibe mensajes, ejecuta el modelo, enruta llamadas a herramientas.
- **Host de Node**: ejecuta `system.run`/`system.which` en la máquina del Node.
- **Aprobaciones**: se aplican en el host de Node mediante `~/.openclaw/exec-approvals.json`.

Nota sobre aprobaciones:

- Las ejecuciones de Node respaldadas por aprobación vinculan el contexto exacto de la solicitud.
- Para ejecuciones directas de shell/archivos de runtime, OpenClaw también intenta vincular, en la medida de lo posible, un único
  operando concreto de archivo local y deniega la ejecución si ese archivo cambia antes de ejecutarse.
- Si OpenClaw no puede identificar exactamente un único archivo local concreto para un comando de intérprete/runtime,
  la ejecución respaldada por aprobación se deniega en lugar de fingir una cobertura completa del runtime. Usa sandboxing,
  hosts separados o una allowlist explícita de confianza/un flujo completo para una semántica más amplia de intérpretes.

### Iniciar un host de Node (primer plano)

En la máquina del Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto mediante túnel SSH (bind loopback)

Si el Gateway se vincula a loopback (`gateway.bind=loopback`, predeterminado en modo local),
los hosts remotos de Node no pueden conectarse directamente. Crea un túnel SSH y apunta el
host de Node al extremo local del túnel.

Ejemplo (host de Node -> host del gateway):

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
- La alternativa en config es `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host de Node ignora intencionadamente `gateway.remote.token` / `gateway.remote.password`.
- En modo remoto, `gateway.remote.token` / `gateway.remote.password` son candidatos según las reglas de precedencia remota.
- Si hay SecretRef activos locales `gateway.auth.*` configurados pero sin resolver, la autenticación del host de Node falla en modo cerrado.
- La resolución de autenticación del host de Node solo respeta las variables de entorno `OPENCLAW_GATEWAY_*`.

### Iniciar un host de Node (servicio)

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

Si el Node vuelve a intentarlo con detalles de autenticación modificados, vuelve a ejecutar `openclaw devices list`
y aprueba el `requestId` actual.

Opciones de nombre:

- `--display-name` en `openclaw node run` / `openclaw node install` (se conserva en `~/.openclaw/node.json` en el Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (anulación del gateway).

### Añadir los comandos a la allowlist

Las aprobaciones de exec son **por host de Node**. Añade entradas a la allowlist desde el gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Las aprobaciones se guardan en el host de Node en `~/.openclaw/exec-approvals.json`.

### Apuntar exec al Node

Configura valores predeterminados (configuración del gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

O por sesión:

```
/exec host=node security=allowlist node=<id-or-name>
```

Una vez configurado, cualquier llamada `exec` con `host=node` se ejecuta en el host de Node (sujeta a la
allowlist/aprobaciones del Node).

`host=auto` no elegirá implícitamente el Node por sí solo, pero una solicitud explícita por llamada `host=node` sí está permitida desde `auto`. Si quieres que exec en Node sea el valor predeterminado de la sesión, configura `tools.exec.host=node` o `/exec host=node ...` explícitamente.

Relacionado:

- [CLI de host de Node](/es/cli/node)
- [Herramienta exec](/es/tools/exec)
- [Aprobaciones de exec](/es/tools/exec-approvals)

## Invocar comandos

Bajo nivel (RPC sin procesar):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Existen helpers de mayor nivel para los flujos de trabajo habituales de “dar al agente un adjunto MEDIA”.

## Capturas de pantalla (instantáneas de canvas)

Si el Node está mostrando el Canvas (WebView), `canvas.snapshot` devuelve `{ format, base64 }`.

Helper de CLI (escribe en un archivo temporal e imprime `MEDIA:<path>`):

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
- `canvas eval` acepta JS en línea (`--js`) o un argumento posicional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notas:

- Solo se admite A2UI v0.8 JSONL (v0.9/createSurface se rechaza).

## Fotos + videos (camera del Node)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clips de video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notas:

- El Node debe estar en **primer plano** para `canvas.*` y `camera.*` (las llamadas en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE`).
- La duración del clip se limita (actualmente `<= 60s`) para evitar cargas útiles base64 demasiado grandes.
- Android solicitará permisos `CAMERA`/`RECORD_AUDIO` cuando sea posible; los permisos denegados fallan con `*_PERMISSION_REQUIRED`.

## Grabaciones de pantalla (Nodes)

Los Nodes compatibles exponen `screen.record` (`mp4`). Ejemplo:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notas:

- La disponibilidad de `screen.record` depende de la plataforma del Node.
- Las grabaciones de pantalla se limitan a `<= 60s`.
- `--no-audio` desactiva la captura de micrófono en las plataformas compatibles.
- Usa `--screen <index>` para seleccionar una pantalla cuando haya varias disponibles.

## Ubicación (Nodes)

Los Nodes exponen `location.get` cuando la ubicación está habilitada en la configuración.

Helper de CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notas:

- La ubicación está **desactivada de forma predeterminada**.
- “Always” requiere permiso del sistema; la obtención en segundo plano es de mejor esfuerzo.
- La respuesta incluye lat/lon, precisión (metros) y marca de tiempo.

## SMS (Nodes Android)

Los Nodes Android pueden exponer `sms.send` cuando el usuario concede permiso de **SMS** y el dispositivo admite telefonía.

Invocación de bajo nivel:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notas:

- La solicitud de permiso debe aceptarse en el dispositivo Android antes de que se anuncie la capacidad.
- Los dispositivos solo con Wi‑Fi y sin telefonía no anunciarán `sms.send`.

## Comandos de dispositivo Android + datos personales

Los Nodes Android pueden anunciar familias de comandos adicionales cuando las capacidades correspondientes están habilitadas.

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

- Los comandos de movimiento están limitados por capacidad según los sensores disponibles.

## Comandos del sistema (host de Node / Node de Mac)

El Node de macOS expone `system.run`, `system.notify` y `system.execApprovals.get/set`.
El host de Node headless expone `system.run`, `system.which` y `system.execApprovals.get/set`.

Ejemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notas:

- `system.run` devuelve stdout/stderr/código de salida en la carga útil.
- La ejecución de shell ahora pasa por la herramienta `exec` con `host=node`; `nodes` sigue siendo la superficie RPC directa para comandos explícitos de Node.
- `nodes invoke` no expone `system.run` ni `system.run.prepare`; ambos permanecen solo en la ruta de exec.
- La ruta de exec prepara un `systemRunPlan` canónico antes de la aprobación. Una vez que se concede una
  aprobación, el gateway reenvía ese plan almacenado, no ningún campo posterior de comando/cwd/sesión
  editado por el emisor.
- `system.notify` respeta el estado de permiso de notificaciones en la app de macOS.
- La metadata `platform` / `deviceFamily` de Node no reconocida usa una allowlist predeterminada conservadora que excluye `system.run` y `system.which`. Si intencionadamente necesitas esos comandos para una plataforma desconocida, añádelos explícitamente mediante `gateway.nodes.allowCommands`.
- `system.run` admite `--cwd`, `--env KEY=VAL`, `--command-timeout` y `--needs-screen-recording`.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), los valores `--env` con alcance de solicitud se reducen a una allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisiones de permitir siempre en modo allowlist, los wrappers de despacho conocidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan rutas de ejecutables internos en lugar de rutas del wrapper. Si no es seguro desempaquetar, no se conserva automáticamente ninguna entrada en la allowlist.
- En hosts de Node Windows en modo allowlist, las ejecuciones con wrapper de shell mediante `cmd.exe /c` requieren aprobación (una entrada en allowlist por sí sola no permite automáticamente la forma wrapper).
- `system.notify` admite `--priority <passive|active|timeSensitive>` y `--delivery <system|overlay|auto>`.
- Los hosts de Node ignoran anulaciones de `PATH` y eliminan claves peligrosas de arranque/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Si necesitas entradas adicionales en PATH, configura el entorno del servicio del host de Node (o instala herramientas en ubicaciones estándar) en lugar de pasar `PATH` mediante `--env`.
- En modo Node de macOS, `system.run` está controlado por aprobaciones de exec en la app de macOS (Configuración → Aprobaciones de exec).
  Ask/allowlist/full se comportan igual que en el host de Node headless; los prompts denegados devuelven `SYSTEM_RUN_DENIED`.
- En el host de Node headless, `system.run` está controlado por aprobaciones de exec (`~/.openclaw/exec-approvals.json`).

## Vinculación de exec a Node

Cuando hay varios Nodes disponibles, puedes vincular exec a un Node específico.
Esto establece el Node predeterminado para `exec host=node` (y puede anularse por agente).

Predeterminado global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Anulación por agente:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Quitar para permitir cualquier Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mapa de permisos

Los Nodes pueden incluir un mapa `permissions` en `node.list` / `node.describe`, indexado por nombre de permiso (por ejemplo `screenRecording`, `accessibility`) con valores booleanos (`true` = concedido).

## Host de Node headless (multiplataforma)

OpenClaw puede ejecutar un **host de Node headless** (sin UI) que se conecta al
WebSocket del Gateway y expone `system.run` / `system.which`. Esto resulta útil en Linux/Windows
o para ejecutar un Node mínimo junto a un servidor.

Inícialo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notas:

- El emparejamiento sigue siendo obligatorio (el Gateway mostrará un prompt de emparejamiento de dispositivo).
- El host de Node almacena su id de Node, token, nombre visible e información de conexión del gateway en `~/.openclaw/node.json`.
- Las aprobaciones de exec se aplican localmente mediante `~/.openclaw/exec-approvals.json`
  (consulta [Aprobaciones de exec](/es/tools/exec-approvals)).
- En macOS, el host de Node headless ejecuta `system.run` localmente de forma predeterminada. Configura
  `OPENCLAW_NODE_EXEC_HOST=app` para enrutar `system.run` a través del host exec de la app complementaria; añade
  `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir el host de la app y fallar en modo cerrado si no está disponible.
- Añade `--tls` / `--tls-fingerprint` cuando el WS del Gateway use TLS.

## Modo Node de Mac

- La app de barra de menús de macOS se conecta al servidor WS del Gateway como un Node (por lo que `openclaw nodes …` funciona contra este Mac).
- En modo remoto, la app abre un túnel SSH para el puerto del Gateway y se conecta a `localhost`.
