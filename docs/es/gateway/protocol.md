---
read_when:
    - Implementar o actualizar clientes WS de gateway
    - Depurar desajustes del protocolo o fallos de conexión
    - Regenerar el esquema/modelos del protocolo
summary: 'Protocolo WebSocket de Gateway: handshake, frames, versionado'
title: Protocolo de Gateway
x-i18n:
    generated_at: "2026-04-24T05:30:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6710cb1c620dc03b75421cab7953c412cb85e68c52fa9b504ea89b7302efb8
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocolo de Gateway (WebSocket)

El protocolo WS de Gateway es el **plano de control único + transporte de nodos** para
OpenClaw. Todos los clientes (CLI, interfaz web, app de macOS, nodos iOS/Android, nodos sin interfaz)
se conectan por WebSocket y declaran su **rol** + **alcance** en el momento del
handshake.

## Transporte

- WebSocket, tramas de texto con cargas JSON.
- La primera trama **debe** ser una solicitud `connect`.
- Las tramas previas a la conexión están limitadas a 64 KiB. Tras un handshake correcto, los clientes
  deben seguir los límites `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con los diagnósticos habilitados,
  las tramas entrantes sobredimensionadas y los búferes salientes lentos emiten eventos `payload.large`
  antes de que el gateway cierre o descarte la trama afectada. Estos eventos conservan
  tamaños, límites, superficies y códigos seguros de motivo. No conservan el cuerpo del mensaje,
  el contenido de adjuntos, el cuerpo sin procesar de la trama, tokens, cookies ni valores secretos.

## Handshake (connect)

Gateway → Cliente (desafío previo a la conexión):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Cliente → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Cliente:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` y `policy` son obligatorios según el esquema
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` es opcional. `auth`
informa el rol/alcances negociados cuando están disponibles, e incluye `deviceToken`
cuando el gateway emite uno.

Cuando no se emite un token de dispositivo, `hello-ok.auth` aún puede informar los
permisos negociados:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Cuando se emite un token de dispositivo, `hello-ok` también incluye:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Durante la transferencia de arranque inicial de confianza, `hello-ok.auth` también puede incluir entradas de rol
adicionales limitadas en `deviceTokens`:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Para el flujo integrado de arranque inicial de nodo/operador, el token principal del nodo permanece en
`scopes: []` y cualquier token de operador transferido sigue limitado a la lista de permitidos de operador de arranque inicial (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Las comprobaciones de alcance de arranque inicial siguen
prefijadas por rol: las entradas de operador solo satisfacen solicitudes de operador, y los roles que no son de operador
siguen necesitando alcances bajo su propio prefijo de rol.

### Ejemplo de nodo

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Enmarcado

- **Solicitud**: `{type:"req", id, method, params}`
- **Respuesta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

Los métodos con efectos secundarios requieren **claves de idempotencia** (consulta el esquema).

## Roles + alcances

### Roles

- `operator` = cliente del plano de control (CLI/UI/automatización).
- `node` = host de capacidades (camera/screen/canvas/system.run).

### Alcances (operator)

Alcances comunes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` requiere `operator.talk.secrets`
(o `operator.admin`).

Los métodos RPC de gateway registrados por Plugins pueden solicitar su propio alcance de operador, pero
los prefijos administrativos principales reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre se resuelven como `operator.admin`.

El alcance del método es solo la primera barrera. Algunos comandos slash alcanzados mediante
`chat.send` aplican comprobaciones más estrictas a nivel de comando además. Por ejemplo, las
escrituras persistentes de `/config set` y `/config unset` requieren `operator.admin`.

`node.pair.approve` también tiene una comprobación adicional de alcance en el momento de la aprobación además del
alcance base del método:

- solicitudes sin comando: `operator.pairing`
- solicitudes con comandos de nodo que no son exec: `operator.pairing` + `operator.write`
- solicitudes que incluyen `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Los nodos declaran reclamaciones de capacidad al conectarse:

- `caps`: categorías de capacidad de alto nivel.
- `commands`: lista de permitidos de comandos para invoke.
- `permissions`: alternancias granulares (por ejemplo `screen.record`, `camera.capture`).

El Gateway trata estas como **reclamaciones** y aplica listas de permitidos del lado del servidor.

## Presencia

- `system-presence` devuelve entradas indexadas por identidad del dispositivo.
- Las entradas de presencia incluyen `deviceId`, `roles` y `scopes` para que las interfaces puedan mostrar una sola fila por dispositivo
  incluso cuando se conecte como **operator** y **node** a la vez.

## Limitación por alcance de eventos de difusión

Los eventos de difusión WebSocket enviados por el servidor están limitados por alcance para que las sesiones limitadas a vinculación o solo de nodo no reciban pasivamente contenido de sesiones.

- **Las tramas de chat, agente y resultado de herramienta** (incluidos los eventos `agent` en streaming y los resultados de llamadas a herramientas) requieren al menos `operator.read`. Las sesiones sin `operator.read` omiten por completo estas tramas.
- **Las difusiones `plugin.*` definidas por Plugins** están limitadas a `operator.write` u `operator.admin`, según cómo las haya registrado el Plugin.
- **Los eventos de estado y transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexión/desconexión, etc.) permanecen sin restricciones para que el estado del transporte siga siendo observable para toda sesión autenticada.
- **Las familias desconocidas de eventos de difusión** están limitadas por alcance de forma predeterminada (fallo seguro) salvo que un controlador registrado las relaje explícitamente.

Cada conexión de cliente mantiene su propio número de secuencia por cliente para que las difusiones conserven el orden monótono en ese socket incluso cuando distintos clientes vean subconjuntos filtrados por alcance distintos del flujo de eventos.

## Familias comunes de métodos RPC

La superficie WS pública es más amplia que los ejemplos anteriores de handshake/autenticación. Esto
no es un volcado generado: `hello-ok.features.methods` es una lista de
descubrimiento conservadora construida a partir de `src/gateway/server-methods-list.ts` más las exportaciones cargadas de métodos de Plugins/canales. Trátala como descubrimiento de funcionalidades, no como una enumeración completa de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidad">
    - `health` devuelve la instantánea de estado del gateway, en caché o recién comprobada.
    - `diagnostics.stability` devuelve el registrador acotado reciente de estabilidad diagnóstica. Conserva metadatos operativos como nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de cola/sesión, nombres de canales/Plugins e id de sesiones. No conserva texto de chat, cuerpos de webhook, salidas de herramientas, cuerpos sin procesar de solicitudes o respuestas, tokens, cookies ni valores secretos. Se requiere el alcance de lectura de operador.
    - `status` devuelve el resumen del gateway al estilo `/status`; los campos sensibles solo se incluyen para clientes de operador con alcance de administrador.
    - `gateway.identity.get` devuelve la identidad del dispositivo gateway usada por los flujos de relay y vinculación.
    - `system-presence` devuelve la instantánea actual de presencia para dispositivos conectados de operador/nodo.
    - `system-event` agrega un evento del sistema y puede actualizar/difundir el contexto de presencia.
    - `last-heartbeat` devuelve el último evento heartbeat persistido.
    - `set-heartbeats` activa o desactiva el procesamiento de heartbeat en el gateway.
  </Accordion>

  <Accordion title="Modelos y uso">
    - `models.list` devuelve el catálogo de modelos permitidos en tiempo de ejecución.
    - `usage.status` devuelve ventanas de uso del proveedor/resúmenes de cuota restante.
    - `usage.cost` devuelve resúmenes agregados de uso de costes para un intervalo de fechas.
    - `doctor.memory.status` devuelve la preparación de memoria vectorial / embeddings para el espacio de trabajo activo del agente predeterminado.
    - `sessions.usage` devuelve resúmenes de uso por sesión.
    - `sessions.usage.timeseries` devuelve series temporales de uso para una sesión.
    - `sessions.usage.logs` devuelve entradas del registro de uso para una sesión.
  </Accordion>

  <Accordion title="Canales y asistentes de inicio de sesión">
    - `channels.status` devuelve resúmenes de estado de canales/Plugins integrados e incluidos.
    - `channels.logout` cierra la sesión de un canal/cuenta concretos cuando el canal admite cierre de sesión.
    - `web.login.start` inicia un flujo de inicio de sesión QR/web para el proveedor de canal web actual compatible con QR.
    - `web.login.wait` espera a que ese flujo de inicio de sesión QR/web se complete e inicia el canal si tiene éxito.
    - `push.test` envía un push APNs de prueba a un nodo iOS registrado.
    - `voicewake.get` devuelve los disparadores de palabra de activación almacenados.
    - `voicewake.set` actualiza los disparadores de palabra de activación y difunde el cambio.
  </Accordion>

  <Accordion title="Mensajería y logs">
    - `send` es el RPC de entrega saliente directa para envíos dirigidos a canal/cuenta/hilo fuera del ejecutor de chat.
    - `logs.tail` devuelve la cola configurada de logs de archivo del gateway con controles de cursor/límite y bytes máximos.
  </Accordion>

  <Accordion title="Talk y TTS">
    - `talk.config` devuelve la carga de configuración efectiva de Talk; `includeSecrets` requiere `operator.talk.secrets` (o `operator.admin`).
    - `talk.mode` establece/difunde el estado actual del modo Talk para clientes de WebChat/Control UI.
    - `talk.speak` sintetiza voz mediante el proveedor activo de voz de Talk.
    - `tts.status` devuelve el estado habilitado de TTS, proveedor activo, proveedores de respaldo y estado de configuración del proveedor.
    - `tts.providers` devuelve el inventario visible de proveedores TTS.
    - `tts.enable` y `tts.disable` activan o desactivan el estado de preferencias de TTS.
    - `tts.setProvider` actualiza el proveedor TTS preferido.
    - `tts.convert` ejecuta una conversión puntual de texto a voz.
  </Accordion>

  <Accordion title="Secretos, configuración, actualización y asistente">
    - `secrets.reload` vuelve a resolver los SecretRef activos e intercambia el estado secreto de tiempo de ejecución solo si todo tiene éxito.
    - `secrets.resolve` resuelve asignaciones de secretos dirigidas a comandos para un conjunto específico de comando/destino.
    - `config.get` devuelve la instantánea actual de configuración y el hash.
    - `config.set` escribe una carga de configuración validada.
    - `config.patch` fusiona una actualización parcial de configuración.
    - `config.apply` valida + reemplaza la carga completa de configuración.
    - `config.schema` devuelve la carga activa del esquema de configuración usada por la interfaz de Control y las herramientas CLI: esquema, `uiHints`, versión y metadatos de generación, incluidos metadatos de esquema de Plugins + canales cuando el tiempo de ejecución puede cargarlos. El esquema incluye metadatos de campo `title` / `description` derivados de las mismas etiquetas y textos de ayuda usados por la interfaz, incluidas ramas de composición de objetos anidados, comodines, elementos de arrays y `anyOf` / `oneOf` / `allOf` cuando existe documentación de campo coincidente.
    - `config.schema.lookup` devuelve una carga de búsqueda limitada a una ruta para una ruta de configuración: ruta normalizada, un nodo superficial de esquema, hint coincidente + `hintPath`, y resúmenes inmediatos de hijos para navegación detallada en UI/CLI. Los nodos de esquema de búsqueda conservan la documentación visible para el usuario y los campos habituales de validación (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos/de cadena/de array/de objeto y banderas como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de hijos exponen `key`, `path` normalizada, `type`, `required`, `hasChildren`, además del `hint` / `hintPath` coincidente.
    - `update.run` ejecuta el flujo de actualización del gateway y programa un reinicio solo cuando la actualización en sí tuvo éxito.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de incorporación mediante WS RPC.
  </Accordion>

  <Accordion title="Ayudantes de agente y espacio de trabajo">
    - `agents.list` devuelve las entradas de agentes configuradas.
    - `agents.create`, `agents.update` y `agents.delete` gestionan registros de agentes y conexión del espacio de trabajo.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` gestionan los archivos de arranque del espacio de trabajo expuestos para un agente.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o sesión.
    - `agent.wait` espera a que termine una ejecución y devuelve la instantánea terminal cuando está disponible.
  </Accordion>

  <Accordion title="Control de sesiones">
    - `sessions.list` devuelve el índice actual de sesiones.
    - `sessions.subscribe` y `sessions.unsubscribe` activan o desactivan suscripciones a eventos de cambio de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` activan o desactivan suscripciones a eventos de transcripción/mensajes para una sesión.
    - `sessions.preview` devuelve vistas previas acotadas de transcripción para claves de sesión específicas.
    - `sessions.resolve` resuelve o canoniza un destino de sesión.
    - `sessions.create` crea una nueva entrada de sesión.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrumpir y redirigir para una sesión activa.
    - `sessions.abort` interrumpe el trabajo activo de una sesión.
    - `sessions.patch` actualiza metadatos/sobrescrituras de sesión.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan mantenimiento de sesiones.
    - `sessions.get` devuelve la fila completa almacenada de la sesión.
    - La ejecución de chat sigue usando `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` está normalizado para visualización en clientes de UI: las etiquetas de directiva en línea se eliminan del texto visible, las cargas XML de llamada a herramientas en texto plano (incluidas `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamada a herramientas) y los tokens de control del modelo ASCII/de ancho completo filtrados se eliminan, se omiten las filas puras del asistente con token silencioso como `NO_REPLY` / `no_reply` exactos, y las filas sobredimensionadas pueden reemplazarse con marcadores de posición.
  </Accordion>

  <Accordion title="Vinculación de dispositivos y tokens de dispositivo">
    - `device.pair.list` devuelve dispositivos vinculados pendientes y aprobados.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` gestionan registros de vinculación de dispositivos.
    - `device.token.rotate` rota un token de dispositivo vinculado dentro de sus límites aprobados de rol y alcance.
    - `device.token.revoke` revoca un token de dispositivo vinculado.
  </Accordion>

  <Accordion title="Vinculación de nodos, invoke y trabajo pendiente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` y `node.pair.verify` cubren la vinculación de nodos y la verificación de arranque inicial.
    - `node.list` y `node.describe` devuelven el estado conocido/conectado del nodo.
    - `node.rename` actualiza una etiqueta de nodo vinculado.
    - `node.invoke` reenvía un comando a un nodo conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud invoke.
    - `node.event` transporta eventos originados por nodos de vuelta al gateway.
    - `node.canvas.capability.refresh` actualiza tokens limitados de capacidad de canvas.
    - `node.pending.pull` y `node.pending.ack` son las API de cola de nodos conectados.
    - `node.pending.enqueue` y `node.pending.drain` gestionan trabajo pendiente duradero para nodos desconectados/sin conexión.
  </Accordion>

  <Accordion title="Familias de aprobaciones">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` cubren solicitudes puntuales de aprobación de exec más búsqueda/repetición de aprobaciones pendientes.
    - `exec.approval.waitDecision` espera una aprobación pendiente de exec y devuelve la decisión final (o `null` en caso de tiempo de espera).
    - `exec.approvals.get` y `exec.approvals.set` gestionan instantáneas de política de aprobación de exec del gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` gestionan la política local de aprobación de exec del nodo mediante comandos de relay del nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` cubren flujos de aprobación definidos por Plugins.
  </Accordion>

  <Accordion title="Automatización, Skills y herramientas">
    - Automatización: `wake` programa una inyección inmediata o en el siguiente heartbeat de texto de activación; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestionan trabajo programado.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Familias de eventos comunes

- `chat`: actualizaciones de chat de la interfaz como `chat.inject` y otros
  eventos de chat solo de transcripción.
- `session.message` y `session.tool`: actualizaciones de transcripción/flujo de eventos para una
  sesión suscrita.
- `sessions.changed`: cambió el índice de sesiones o los metadatos.
- `presence`: actualizaciones de la instantánea de presencia del sistema.
- `tick`: evento periódico de keepalive / vitalidad.
- `health`: actualización de instantánea del estado del gateway.
- `heartbeat`: actualización del flujo de eventos de heartbeat.
- `cron`: evento de cambio de ejecución/trabajo cron.
- `shutdown`: notificación de apagado del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de vinculación de nodos.
- `node.invoke.request`: difusión de solicitud invoke de nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo vinculado.
- `voicewake.changed`: cambió la configuración de disparadores de palabra de activación.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprobación de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprobación de Plugin.

### Métodos auxiliares de nodo

- Los nodos pueden llamar a `skills.bins` para obtener la lista actual de ejecutables
  de Skills para comprobaciones automáticas de permitidos.

### Métodos auxiliares de operador

- Los operadores pueden llamar a `commands.list` (`operator.read`) para obtener el inventario
  de comandos en tiempo de ejecución para un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - `scope` controla a qué superficie apunta el `name` principal:
    - `text` devuelve el token principal del comando de texto sin la `/` inicial
    - `native` y la ruta predeterminada `both` devuelven nombres nativos sensibles al proveedor
      cuando están disponibles
  - `textAliases` transporta alias slash exactos como `/model` y `/m`.
  - `nativeName` transporta el nombre nativo sensible al proveedor cuando existe.
  - `provider` es opcional y solo afecta al nombre nativo más la disponibilidad de comandos nativos de Plugin.
  - `includeArgs=false` omite metadatos serializados de argumentos en la respuesta.
- Los operadores pueden llamar a `tools.catalog` (`operator.read`) para obtener el catálogo de herramientas en tiempo de ejecución para un
  agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: Plugin propietario cuando `source="plugin"`
  - `optional`: si una herramienta de Plugin es opcional
- Los operadores pueden llamar a `tools.effective` (`operator.read`) para obtener el inventario de herramientas
  efectivo en tiempo de ejecución para una sesión.
  - `sessionKey` es obligatorio.
  - El gateway deriva el contexto de ejecución fiable del lado del servidor a partir de la sesión, en lugar de aceptar
    autenticación o contexto de entrega proporcionados por quien llama.
  - La respuesta está limitada a la sesión y refleja lo que la conversación activa puede usar ahora mismo,
    incluidas herramientas core, de Plugin y de canal.
- Los operadores pueden llamar a `skills.status` (`operator.read`) para obtener el inventario visible
  de Skills para un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - La respuesta incluye elegibilidad, requisitos faltantes, comprobaciones de configuración y
    opciones de instalación saneadas sin exponer valores secretos sin procesar.
- Los operadores pueden llamar a `skills.search` y `skills.detail` (`operator.read`) para
  metadatos de descubrimiento de ClawHub.
- Los operadores pueden llamar a `skills.install` (`operator.admin`) en dos modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una
    carpeta de Skill en el directorio `skills/` del espacio de trabajo del agente predeterminado.
  - Modo instalador del gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    ejecuta una acción declarada `metadata.openclaw.install` en el host del gateway.
- Los operadores pueden llamar a `skills.update` (`operator.admin`) en dos modos:
  - El modo ClawHub actualiza un slug registrado o todas las instalaciones registradas de ClawHub en
    el espacio de trabajo del agente predeterminado.
  - El modo Config parchea valores de `skills.entries.<skillKey>` como `enabled`,
    `apiKey` y `env`.

## Aprobaciones de exec

- Cuando una solicitud exec necesita aprobación, el gateway difunde `exec.approval.requested`.
- Los clientes operador resuelven llamando a `exec.approval.resolve` (requiere el alcance `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan` (metadatos canónicos de `argv`/`cwd`/`rawCommand`/sesión). Las solicitudes sin `systemRunPlan` se rechazan.
- Tras la aprobación, las llamadas reenviadas `node.invoke system.run` reutilizan ese
  `systemRunPlan` canónico como contexto autorizado de comando/cwd/sesión.
- Si quien llama modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` entre la preparación y el reenvío final aprobado de `system.run`, el
  gateway rechaza la ejecución en lugar de confiar en la carga modificada.

## Respaldo de entrega de agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar entrega saliente.
- `bestEffortDeliver=false` mantiene un comportamiento estricto: los destinos de entrega no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite recurrir a ejecución solo de sesión cuando no se puede resolver una ruta externa entregable (por ejemplo sesiones internas/webchat o configuraciones ambiguas de varios canales).

## Versionado

- `PROTOCOL_VERSION` vive en `src/gateway/protocol/schema/protocol-schemas.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`; el servidor rechaza incompatibilidades.
- Los esquemas + modelos se generan a partir de definiciones TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes del cliente

El cliente de referencia en `src/gateway/client.ts` usa estos valores predeterminados. Los valores son
estables en el protocolo v3 y son la línea de base esperada para clientes de terceros.

| Constante                                 | Predeterminado                                        | Origen                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Tiempo de espera de solicitud (por RPC)   | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Tiempo de espera de preautenticación / connect-challenge | `10_000` ms                               | `src/gateway/handshake-timeouts.ts` (límite `250`–`10_000`) |
| Backoff inicial de reconexión             | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff máximo de reconexión              | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Límite de reintento rápido tras cierre por device-token | `250` ms                                  | `src/gateway/client.ts`                                    |
| Gracia de parada forzada antes de `terminate()` | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                    | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalo tick predeterminado (antes de `hello-ok`) | `30_000` ms                                  | `src/gateway/client.ts`                                    |
| Cierre por tiempo de espera tick          | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

El servidor anuncia los valores efectivos `policy.tickIntervalMs`, `policy.maxPayload`
y `policy.maxBufferedBytes` en `hello-ok`; los clientes deben respetar esos valores
en lugar de los valores predeterminados previos al handshake.

## Autenticación

- La autenticación del gateway con secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el modo de autenticación configurado.
- Los modos con identidad como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o `gateway.auth.mode: "trusted-proxy"`
  fuera de loopback satisfacen la comprobación de autenticación de connect a partir de
  cabeceras de solicitud en lugar de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` con entrada privada omite por completo la autenticación connect
  con secreto compartido; no expongas ese modo en entradas públicas/no fiables.
- Tras la vinculación, el Gateway emite un **device token** limitado al rol + alcances
  de la conexión. Se devuelve en `hello-ok.auth.deviceToken` y el cliente debe
  persistirlo para futuras conexiones.
- Los clientes deben persistir el `hello-ok.auth.deviceToken` principal después de cualquier
  conexión correcta.
- Volver a conectar con ese **device token almacenado** también debería reutilizar el conjunto
  de alcances aprobados almacenado para ese token. Esto conserva el acceso ya concedido de lectura/comprobación/estado
  y evita que las reconexiones colapsen silenciosamente a un
  alcance implícito más estrecho de solo administrador.
- Ensamblado de autenticación connect del lado del cliente (`selectConnectAuth` en
  `src/gateway/client.ts`):
  - `auth.password` es ortogonal y siempre se reenvía cuando está establecido.
  - `auth.token` se rellena en orden de prioridad: primero token compartido explícito,
    luego `deviceToken` explícito, luego un token almacenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` solo se envía cuando ninguna de las opciones anteriores resolvió un
    `auth.token`. Un token compartido o cualquier device token resuelto lo suprime.
  - La autopromoción de un device token almacenado en el reintento puntual
    `AUTH_TOKEN_MISMATCH` está limitada solo a **endpoints fiables**:
    loopback, o `wss://` con `tlsFingerprint` fijada. `wss://` público
    sin fijación no cumple el requisito.
- Las entradas adicionales `hello-ok.auth.deviceTokens` son tokens de transferencia de arranque inicial.
  Persístelos solo cuando la conexión haya usado autenticación de arranque inicial en un transporte fiable
  como `wss://` o loopback/vinculación local.
- Si un cliente proporciona un **deviceToken explícito** o `scopes` explícitos, ese
  conjunto de alcances solicitado por quien llama sigue siendo el autorizado; los alcances en caché solo
  se reutilizan cuando el cliente está reutilizando el token almacenado por dispositivo.
- Los device tokens pueden rotarse/revocarse mediante `device.token.rotate` y
  `device.token.revoke` (requiere el alcance `operator.pairing`).
- La emisión/rotación de tokens permanece limitada al conjunto de roles aprobados registrado en
  la entrada de vinculación de ese dispositivo; rotar un token no puede ampliar el dispositivo a un
  rol que la aprobación de vinculación nunca concedió.
- Para sesiones de token de dispositivo vinculado, la gestión del dispositivo está limitada al propio dispositivo salvo que quien
  llama también tenga `operator.admin`: los usuarios sin privilegios de administrador solo pueden eliminar/revocar/rotar
  **su propia** entrada de dispositivo.
- `device.token.rotate` también comprueba el conjunto solicitado de alcances de operador frente a los
  alcances actuales de la sesión de quien llama. Los usuarios sin privilegios de administrador no pueden rotar un token a
  un conjunto de alcances de operador más amplio que el que ya tienen.
- Los fallos de autenticación incluyen `error.details.code` más pistas de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes fiables pueden intentar un único reintento limitado con un token por dispositivo en caché.
  - Si ese reintento falla, los clientes deben detener los bucles automáticos de reconexión y mostrar orientación para acción del operador.

## Identidad del dispositivo + vinculación

- Los nodos deben incluir una identidad estable de dispositivo (`device.id`) derivada de la
  huella digital de un par de claves.
- Los gateways emiten tokens por dispositivo + rol.
- Se requieren aprobaciones de vinculación para nuevos ID de dispositivo salvo que la autoaprobación
  local esté habilitada.
- La autoaprobación de vinculación se centra en conexiones directas locales de loopback.
- OpenClaw también tiene una ruta limitada de autoconexión local de backend/contenedor para
  flujos auxiliares fiables con secreto compartido.
- Las conexiones de tailnet o LAN en el mismo host siguen tratándose como remotas para la vinculación y
  requieren aprobación.
- Todos los clientes WS deben incluir la identidad `device` durante `connect` (operator + node).
  La interfaz de Control puede omitirla solo en estos modos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad con HTTP inseguro solo en localhost.
  - autenticación correcta de operador de la interfaz de Control con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (opción de emergencia, degradación grave de seguridad).
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de autenticación de dispositivos

Para clientes heredados que aún usan el comportamiento de firma previo al desafío, `connect` ahora devuelve
códigos de detalle `DEVICE_AUTH_*` en `error.details.code` con un `error.details.reason` estable.

Fallos comunes de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió vacío). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto/incorrecto. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga firmada no coincide con la carga v2.      |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella de la clave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falló el formato/canonización de la clave pública. |

Objetivo de migración:

- Esperar siempre a `connect.challenge`.
- Firmar la carga v2 que incluye el nonce del servidor.
- Enviar el mismo nonce en `connect.params.device.nonce`.
- La carga de firma preferida es `v3`, que vincula `platform` y `deviceFamily`
  además de los campos device/client/role/scopes/token/nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero la fijación de metadatos
  de dispositivos vinculados sigue controlando la política de comandos al reconectar.

## TLS + fijación

- Se admite TLS para conexiones WS.
- Los clientes pueden fijar opcionalmente la huella digital del certificado del gateway (consulta la configuración `gateway.tls`
  más `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Alcance

Este protocolo expone la **API completa del gateway** (estado, canales, modelos, chat,
agente, sesiones, nodos, aprobaciones, etc.). La superficie exacta está definida por los
esquemas TypeBox en `src/gateway/protocol/schema.ts`.

## Relacionado

- [Protocolo de puente](/es/gateway/bridge-protocol)
- [Runbook de Gateway](/es/gateway)
