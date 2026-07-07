---
read_when:
    - Emparejar nodos iOS/Android con un gateway
    - Uso del lienzo/cámara de Node para el contexto del agente
    - Agregar nuevos comandos de nodo o utilidades auxiliares de CLI
summary: 'Nodos: emparejamiento, capacidades, permisos y ayudantes de CLI para lienzo/cámara/pantalla/dispositivo/notificaciones/sistema'
title: Nodos
x-i18n:
    generated_at: "2026-07-06T21:49:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 942ddfdbd2210c54537fe57d5f50f20f53eaa2478c2ccb81886f2cedd4e9ea73
    source_path: nodes/index.md
    workflow: 16
---

Un **Node** es un dispositivo complementario (macOS/iOS/Android/sin interfaz) que se conecta al **WebSocket** del Gateway (el mismo puerto que los operadores) con `role: "node"` y expone una superficie de comandos (por ejemplo, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) mediante `node.invoke`. Detalles del protocolo: [protocolo del Gateway](/es/gateway/protocol).

Transporte heredado: [protocolo Bridge](/es/gateway/bridge-protocol) (TCP JSONL; solo histórico para los Nodes actuales).

macOS también puede ejecutarse en **modo Node**: la app de la barra de menús se conecta al servidor WS del Gateway y expone sus comandos locales de lienzo/cámara como un Node (de modo que `openclaw nodes …` funciona contra este Mac). En modo de gateway remoto, la automatización del navegador la gestiona el host de Node de la CLI (`openclaw node run` o el servicio de Node instalado), no el Node de la app nativa.

Los Nodes son **periféricos**, no gateways: no ejecutan el servicio de gateway, y los mensajes de canales (Telegram, WhatsApp, etc.) llegan al gateway, no a los Nodes.

Runbook de solución de problemas: [/nodes/troubleshooting](/es/nodes/troubleshooting)

## Emparejamiento + estado

Los Nodes WS usan **emparejamiento de dispositivos**. Un Node presenta una identidad de dispositivo durante `connect`; el Gateway crea una solicitud de emparejamiento de dispositivo para `role: node`. Apruébala mediante la CLI de dispositivos (o la UI).

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Las solicitudes de emparejamiento pendientes vencen 5 minutos después del último reintento del dispositivo: un dispositivo que sigue reconectándose mantiene activa su única solicitud pendiente (y su `requestId`) en lugar de generar un nuevo aviso cada pocos minutos; consulta [emparejamiento propiedad del Gateway](/es/gateway/pairing) para ver el ciclo completo de solicitud/aprobación/token. Si un Node reintenta con detalles de autenticación modificados (rol/alcances/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`; los clientes reciben un evento `device.pair.resolved` para la solicitud reemplazada, y debes volver a ejecutar `openclaw devices list` antes de aprobar.

- `nodes status` marca un Node como **emparejado** cuando su rol de emparejamiento de dispositivo incluye `node`.
- El registro de emparejamiento de dispositivo es el contrato duradero de rol aprobado. La rotación de tokens permanece dentro de ese contrato; no puede actualizar un Node emparejado a un rol que la aprobación de emparejamiento nunca concedió.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) es un almacén separado de emparejamiento de Nodes, propiedad del gateway, que rastrea la superficie aprobada de comandos/capacidades del Node entre reconexiones. **No** controla el handshake WS `connect`; el emparejamiento de dispositivos lo hace.
- `openclaw nodes remove --node <id|name|ip>` elimina un emparejamiento de Node. Para un Node respaldado por dispositivo, revoca el rol `node` del dispositivo en `devices/paired.json` y desconecta las sesiones con rol de Node de ese dispositivo: un dispositivo con roles mixtos conserva su fila y solo pierde el rol `node`, mientras que una fila de dispositivo solo Node se elimina. También borra cualquier entrada coincidente del almacén separado de emparejamiento de Nodes. `operator.pairing` puede eliminar filas de Nodes que no sean operadores en otros dispositivos; un llamador con token de dispositivo que revoca su propio rol de Node en un dispositivo de roles mixtos además necesita `operator.admin`.
- El alcance de aprobación sigue los comandos declarados por la solicitud pendiente:
  - solicitud sin comandos: `operator.pairing`
  - comandos de Node que no son exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Desfase de versiones y orden de actualización

El Gateway acepta clientes Node autenticados dentro de una ventana de protocolo N-1.
Por tanto, el Gateway v4 actual acepta Nodes v3 cuando la conexión declara
tanto `role: "node"` como `client.mode: "node"`. Las sesiones de operador y UI deben
seguir usando el protocolo actual.

Para actualizaciones escalonadas de flotas, actualiza primero el Gateway y luego cada Node.
Un Node N-1 sigue visible y administrable mientras se actualiza; el Gateway
registra `legacy node protocol accepted` con una recomendación de actualización. El emparejamiento,
la autenticación de dispositivos, las listas de comandos permitidos y las aprobaciones exec siguen aplicándose.
Las capacidades y comandos propiedad de Plugins permanecen ocultos hasta que el Node se actualiza al
protocolo actual. Los Nodes anteriores a N-1 requieren una actualización fuera de banda antes de
reconectarse.

## Host de Node remoto (system.run)

Usa un **host de Node** cuando tu Gateway se ejecuta en una máquina y quieres que los comandos se ejecuten en otra. El modelo sigue hablando con el **gateway**; el gateway reenvía las llamadas `exec` al **host de Node** cuando se selecciona `host=node`.

| Rol             | Responsabilidad                                                   |
| --------------- | ----------------------------------------------------------------- |
| Host de Gateway | Recibe mensajes, ejecuta el modelo, enruta llamadas de herramientas. |
| Host de Node    | Ejecuta `system.run`/`system.which` en la máquina del Node.       |
| Aprobaciones    | Se aplican en el host de Node mediante `~/.openclaw/exec-approvals.json`. |

Nota de aprobación:

- Las ejecuciones de Node respaldadas por aprobación vinculan el contexto exacto de la solicitud. La ruta exec prepara un `systemRunPlan` canónico antes de la aprobación; una vez concedida, el gateway reenvía ese plan almacenado, no campos command/cwd/session editados posteriormente por el llamador, y vuelve a validar el directorio de trabajo antes de ejecutar.
- Para ejecuciones directas de archivos de shell/runtime, OpenClaw también intenta vincular un operando concreto de archivo local y deniega la ejecución si ese archivo cambia antes de ejecutarse.
- Si OpenClaw no puede identificar exactamente un archivo local concreto para un comando de intérprete/runtime, la ejecución respaldada por aprobación se deniega en lugar de simular cobertura completa del runtime. Usa sandboxing, hosts separados o una lista explícita de permitidos confiable/flujo completo para semánticas de intérprete más amplias.

### Iniciar un host de Node (primer plano)

En la máquina del Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` también acepta `--context-path` (ruta de contexto WS del Gateway), `--tls`, `--tls-fingerprint <sha256>` y `--node-id` (sobrescribirlo borra el token de emparejamiento).

### Gateway remoto mediante túnel SSH (enlace loopback)

Si el Gateway se enlaza a loopback (`gateway.bind=loopback`, predeterminado en modo local), los hosts de Node remotos no pueden conectarse directamente. Crea un túnel SSH y apunta el host de Node al extremo local del túnel.

Ejemplo (host de Node -> host de gateway):

```bash
# Terminal A (mantener en ejecución): reenviar local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exportar el token del gateway y conectar a través del túnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notas:

- `openclaw node run` admite autenticación con token o contraseña.
- Se prefieren las variables de entorno: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- El fallback de configuración es `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host de Node ignora intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- En modo remoto, `gateway.remote.token` / `gateway.remote.password` son elegibles según las reglas de precedencia remota.
- Si hay SecretRefs locales activos `gateway.auth.*` configurados pero no resueltos, la autenticación del host de Node falla cerrada.
- La resolución de autenticación del host de Node solo respeta variables de entorno `OPENCLAW_GATEWAY_*`.

### Iniciar un host de Node (servicio)

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

Si el Node reintenta con detalles de autenticación modificados, vuelve a ejecutar `openclaw devices list` y aprueba el `requestId` actual.

Opciones de nombre:

- `--display-name` en `openclaw node run` / `openclaw node install` (persiste en `~/.openclaw/node.json` en el Node, junto con el id del Node, el token y la información de conexión del gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (sobrescritura del gateway).

### Permitir los comandos

Las aprobaciones exec son **por host de Node**. Agrega entradas a la lista de permitidos desde el gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Las aprobaciones residen en el host de Node en `~/.openclaw/exec-approvals.json`.

### Apuntar exec al Node

Configura valores predeterminados (configuración del gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

O por sesión:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Una vez configurado, cualquier llamada `exec` con `host=node` se ejecuta en el host de Node (sujeta a la lista de permitidos/aprobaciones del Node).

`host=auto` no elegirá implícitamente el Node por sí solo, pero se permite una solicitud explícita por llamada `host=node` desde `auto`. Si quieres que exec en Node sea el valor predeterminado para la sesión, configura `tools.exec.host=node` o `/exec host=node ...` explícitamente.

Relacionado:

- [CLI del host de Node](/es/cli/node)
- [Herramienta exec](/es/tools/exec)
- [Aprobaciones exec](/es/tools/exec-approvals)

### Inferencia local de modelos

Un Node de escritorio o servidor puede exponer modelos con capacidad de chat desde un servidor Ollama que se ejecute en ese Node. Los agentes usan la herramienta `node_inference` del Plugin de Ollama para descubrir modelos instalados y ejecutar un prompt acotado de forma remota; el Gateway no necesita acceso de red directo a Ollama. Consulta [inferencia local de Node de Ollama](/es/providers/ollama#node-local-inference) para la configuración, el filtrado de modelos y comandos de verificación directa.

## Invocar comandos

Bajo nivel (RPC sin procesar):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` bloquea `system.run` y `system.run.prepare`; esos comandos solo se ejecutan a través de la herramienta `exec` con `host=node` (consulta arriba). Existen ayudantes de nivel superior para los flujos comunes de "dar al agente un adjunto MEDIA" (lienzo, cámara, pantalla, ubicación, más abajo).

## Política de comandos

Los comandos de Node deben pasar dos controles antes de poder invocarse:

1. El Node debe declarar el comando en su lista WebSocket `connect.commands`.
2. La lista de permitidos derivada de plataforma y aprobación del gateway debe incluir el comando declarado.

Listas de permitidos predeterminadas por plataforma (antes de los valores predeterminados de Plugins y las sobrescrituras `allowCommands`/`denyCommands`):

| Plataforma | Comandos permitidos de forma predeterminada                                                                                                                                                                                                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (los comandos del host de Node como `system.run` están sujetos a aprobación, consulta más abajo)                                                                                                                                                                                                       |

Los comandos `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) son un valor predeterminado de Plugin en iOS, Android, macOS, Windows y plataformas desconocidas (no Linux); todos ellos están restringidos al primer plano en iOS.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once` están permitidos de forma predeterminada para cualquier nodo que anuncie la capacidad `talk` o declare comandos `talk.*`, independientemente de la etiqueta de plataforma.

Los comandos de host de escritorio (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `screen.snapshot` en macOS/Windows) no forman parte de la tabla estática de valores predeterminados de plataforma anterior. Están disponibles una vez que el operador aprueba una solicitud de emparejamiento que los declara; después de eso, el conjunto de comandos aprobados del nodo los conserva al reconectarse.

Los comandos peligrosos o con mucha implicación de privacidad siguen requiriendo una inclusión explícita con `gateway.nodes.allowCommands`, aunque un nodo los declare: `camera.snap`, `camera.clip`, `screen.record`, `contacts.add`, `calendar.add`, `reminders.add`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` siempre prevalece sobre los valores predeterminados y las entradas adicionales de la lista de permitidos.

Los comandos de nodo propiedad de un Plugin pueden añadir una política de invocación de nodo de Gateway. Esa política se ejecuta después de la comprobación de la lista de permitidos y antes de reenviar al nodo, por lo que `node.invoke` sin procesar, los ayudantes de CLI y las herramientas de agente dedicadas comparten el mismo límite de permisos del Plugin. Los comandos de nodo de Plugin peligrosos siguen requiriendo inclusión explícita en `gateway.nodes.allowCommands`.

Después de que un nodo cambie su lista de comandos declarados, rechaza el emparejamiento antiguo del dispositivo y aprueba la nueva solicitud para que el gateway almacene la instantánea de comandos actualizada.

## Configuración (`openclaw.json`)

Los ajustes relacionados con nodos se encuentran en `gateway.nodes` y `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Autoaprobar el primer emparejamiento de nodo desde redes de confianza (lista CIDR).
      // Deshabilitado si no se establece. Solo se aplica a solicitudes role:node iniciales
      // sin ámbitos solicitados; no autoaprueba actualizaciones.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Optar por comandos de nodo peligrosos o con mucha implicación de privacidad (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Bloquear nombres exactos de comandos aunque los valores predeterminados o allowCommands los incluyan.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Host exec predeterminado: "node" enruta todas las llamadas exec a un nodo emparejado.
      host: "node",
      // Modo de seguridad para exec de nodo: permitir solo comandos aprobados/en lista de permitidos.
      security: "allowlist",
      // Fijar exec a un nodo específico (id o nombre). Omítelo para permitir cualquier nodo.
      node: "build-node",
    },
  },
}
```

Usa nombres exactos de comandos de nodo. `denyCommands` elimina un comando aunque un valor predeterminado de plataforma o una entrada de `allowCommands` lo permitiera de otro modo. Consulta la [referencia de configuración de Gateway](/es/gateway/configuration-reference#gateway) para ver detalles sobre el emparejamiento de nodos de gateway y los campos de política de comandos.

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

Si el nodo muestra Canvas (WebView), `canvas.snapshot` devuelve `{ format, base64 }`.

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

- Los nodos móviles usan una página A2UI agrupada y propiedad de la app para renderizado con capacidad de acciones.
- Solo se admite A2UI v0.8 JSONL (v0.9/createSurface se rechaza).
- iOS y Android renderizan páginas remotas de Gateway Canvas, pero las acciones de botones de A2UI se despachan solo desde la página A2UI agrupada y propiedad de la app. Las páginas A2UI HTTP/HTTPS alojadas por Gateway son de solo renderizado en esos clientes móviles.

## Fotos + videos (cámara de nodo)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # predeterminado: ambas orientaciones (2 líneas MEDIA)
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
- Los nodos limitan la duración del clip para mantener manejable la carga útil base64 (consulta [Captura de cámara](/es/nodes/camera) para ver los límites exactos por plataforma). La herramienta de agente `nodes` además limita el `durationMs` solicitado a 300000 (5 minutos) antes de reenviar la llamada; el propio nodo aplica el límite más estricto.
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
- `--no-audio` deshabilita la captura de micrófono en las plataformas compatibles.
- Usa `--screen <index>` para seleccionar una pantalla cuando haya varias pantallas disponibles (0 = principal).

## Ubicación (nodos)

Los nodos exponen `location.get` cuando Ubicación está habilitada en la configuración.

Ayudante de CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notas:

- Ubicación está **desactivada de forma predeterminada**.
- "Always" requiere permiso del sistema; la obtención en segundo plano se hace en modo de mejor esfuerzo.
- La respuesta incluye lat/lon, precisión (metros) y marca de tiempo.
- Forma completa de parámetros/respuesta y códigos de error: [Comando de ubicación](/es/nodes/location-command).

## SMS (nodos Android)

Los nodos Android pueden exponer `sms.send` y `sms.search` cuando el usuario concede permiso de **SMS** y el dispositivo admite telefonía. Ambos comandos son peligrosos de forma predeterminada: el operador de gateway también debe añadirlos a `gateway.nodes.allowCommands` antes de que puedan invocarse (consulta [Política de comandos](#command-policy)).

Para búsqueda de SMS de solo lectura, opta explícitamente en `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Añade `sms.send` por separado solo cuando el nodo también deba poder enviar mensajes. El permiso de Android y la autorización de comandos de Gateway son independientes; conceder el permiso del teléfono no edita la política de Gateway.

Invocación de bajo nivel:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notas:

- `sms.search` puede declararse antes de que se conceda `READ_SMS`, de modo que una invocación pueda devolver un diagnóstico de permisos; leer mensajes sigue requiriendo ese permiso de Android.
- Los dispositivos solo Wi-Fi sin telefonía no anunciarán `sms.send`.
- Un error `requires explicit gateway.nodes.allowCommands opt-in` significa que el teléfono declaró el comando, pero el operador de Gateway no lo ha autorizado.

## Comandos de dispositivo y datos personales

Los nodos iOS, Android y macOS anuncian varios comandos de datos de solo lectura de forma predeterminada (consulta la tabla de [Política de comandos](#command-policy)); Android además expone una familia más amplia controlada por sus propios ajustes dentro de la app.

Familias disponibles:

- `device.status`, `device.info` — iOS, Android, macOS, Windows.
- `device.permissions`, `device.health`, `device.apps` — solo Android; `device.apps` requiere que Compartir apps instaladas esté habilitado en Ajustes de Android y devuelve de forma predeterminada apps visibles en el lanzador.
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

## Comandos del sistema (host de nodo / nodo Mac)

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
- La ruta de exec prepara un `systemRunPlan` canónico antes de la aprobación. Una vez concedida una aprobación, el gateway reenvía ese plan almacenado, no ningún campo de comando/cwd/sesión editado posteriormente por el llamador.
- `system.notify` respeta el estado de permiso de notificaciones en la app macOS; admite `--priority <passive|active|timeSensitive>` y `--delivery <system|overlay|auto>`.
- Los metadatos `platform` / `deviceFamily` de nodo no reconocidos usan una lista de permitidos predeterminada conservadora que excluye `system.run` y `system.which`. Si necesitas intencionalmente esos comandos para una plataforma desconocida, agrégalos explícitamente mediante `gateway.nodes.allowCommands`.
- `system.run` admite `--cwd`, `--env KEY=VAL`, `--command-timeout` y `--needs-screen-recording`.
- Para envoltorios de shell (`bash|sh|zsh ... -c/-lc`), los valores `--env` con alcance de solicitud se reducen a una lista de permitidos explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisiones de permitir siempre en modo de lista de permitidos, los envoltorios de despacho conocidos (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan las rutas de los ejecutables internos en lugar de las rutas de los envoltorios. Si desenvolver no es seguro, no se conserva automáticamente ninguna entrada de lista de permitidos.
- En hosts de nodo Windows en modo de lista de permitidos, las ejecuciones de envoltorio de shell mediante `cmd.exe /c` requieren aprobación (la entrada de lista de permitidos por sí sola no permite automáticamente la forma de envoltorio).
- Los hosts de nodo ignoran las anulaciones de `PATH` en `--env` y eliminan un conjunto amplio y mantenido de variables de inicio de intérprete/shell (por ejemplo `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) antes de ejecutar un comando. Si necesitas entradas PATH adicionales, configura el entorno del servicio host de nodo (o instala herramientas en ubicaciones estándar) en lugar de pasar `PATH` mediante `--env`.
- En modo de nodo macOS, `system.run` está protegido por aprobaciones de exec en la app macOS (Configuración → Aprobaciones de exec). Preguntar/lista de permitidos/completo se comportan igual que el host de nodo sin interfaz; las solicitudes denegadas devuelven `SYSTEM_RUN_DENIED`.
- En el host de nodo sin interfaz, `system.run` está protegido por aprobaciones de exec (`~/.openclaw/exec-approvals.json`); específicamente en macOS, consulta las variables de entorno de enrutamiento de exec-host en [Host de nodo sin interfaz](#headless-node-host-cross-platform) más abajo.

## Vinculación de nodo exec

Cuando hay varios nodos disponibles, puedes vincular exec a un nodo específico. Esto establece el nodo predeterminado para `exec host=node` (y se puede anular por agente).

Predeterminado global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Anulación por agente:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Anula la configuración para permitir cualquier nodo:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Mapa de permisos

Los nodos pueden incluir un mapa `permissions` en `node.list` / `node.describe`, con claves por nombre de permiso (por ejemplo, `screenRecording`, `accessibility`, `location`) y valores booleanos (`true` = concedido).

## Host de nodo sin interfaz gráfica (multiplataforma)

OpenClaw puede ejecutar un **host de nodo sin interfaz gráfica** (sin UI) que se conecta al WebSocket del Gateway y expone `system.run` / `system.which`. Esto es útil en Linux/Windows o para ejecutar un nodo mínimo junto a un servidor.

Inícialo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notas:

- El emparejamiento sigue siendo obligatorio (el Gateway mostrará un aviso de emparejamiento de dispositivo).
- El host de nodo almacena su id de nodo, token, nombre visible e información de conexión del gateway en `~/.openclaw/node.json`.
- Las aprobaciones de ejecución se aplican localmente mediante `~/.openclaw/exec-approvals.json` (consulta [Aprobaciones de ejecución](/es/tools/exec-approvals)).
- En macOS, el host de nodo sin interfaz gráfica ejecuta `system.run` localmente de forma predeterminada. Define `OPENCLAW_NODE_EXEC_HOST=app` para enrutar `system.run` a través del host de ejecución de la app complementaria; añade `OPENCLAW_NODE_EXEC_FALLBACK=0` para requerir el host de la app y fallar en modo cerrado si no está disponible.
- Añade `--tls` / `--tls-fingerprint` cuando el WS del Gateway use TLS.

## Modo de nodo de Mac

- La app de barra de menús de macOS se conecta al servidor WS del Gateway como un nodo (por lo que `openclaw nodes …` funciona contra este Mac).
- En modo remoto, la app abre un túnel SSH para el puerto del Gateway y se conecta a `localhost`.
