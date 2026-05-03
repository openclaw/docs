---
read_when:
    - Implementar o actualizar clientes WS del Gateway
    - Depuración de incompatibilidades de protocolo o fallos de conexión
    - Regenerando el esquema/modelos de protocolo
summary: 'Protocolo WebSocket del Gateway: negociación inicial, tramas, control de versiones'
title: Protocolo de Gateway
x-i18n:
    generated_at: "2026-05-03T05:28:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06f6e1f2188860362bff481e646bd1c4bae4cf8f9a9ccae4fbd5ceea434d2247
    source_path: gateway/protocol.md
    workflow: 16
---

El protocolo WS de Gateway es el **plano de control único + transporte de nodos** para
OpenClaw. Todos los clientes (CLI, interfaz web, app de macOS, nodos iOS/Android, nodos
sin interfaz) se conectan mediante WebSocket y declaran su **rol** + **ámbito** durante
el handshake.

## Transporte

- WebSocket, frames de texto con cargas JSON.
- El primer frame **debe** ser una solicitud `connect`.
- Los frames previos a la conexión tienen un límite de 64 KiB. Después de un handshake correcto, los clientes
  deben respetar los límites `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con los diagnósticos habilitados,
  los frames entrantes sobredimensionados y los búferes salientes lentos emiten eventos `payload.large`
  antes de que el gateway cierre o descarte el frame afectado. Estos eventos conservan
  tamaños, límites, superficies y códigos de motivo seguros. No conservan el cuerpo del mensaje,
  el contenido de adjuntos, el cuerpo de frame sin procesar, tokens, cookies ni valores secretos.

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
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

Mientras el Gateway todavía termina de iniciar procesos auxiliares, la solicitud `connect` puede
devolver un error reintentable `UNAVAILABLE` con `details.reason` establecido en
`"startup-sidecars"` y `retryAfterMs`. Los clientes deben reintentar esa respuesta
dentro de su presupuesto general de conexión en lugar de mostrarla como un fallo terminal
de handshake.

`server`, `features`, `snapshot` y `policy` son obligatorios según el esquema
(`src/gateway/protocol/schema/frames.ts`). `auth` también es obligatorio e informa
el rol/los ámbitos negociados. `canvasHostUrl` es opcional.

Cuando no se emite ningún token de dispositivo, `hello-ok.auth` informa los permisos
negociados sin campos de token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Los clientes backend confiables del mismo proceso (`client.id: "gateway-client"`,
`client.mode: "backend"`) pueden omitir `device` en conexiones directas de local loopback cuando
se autentican con el token/contraseña compartidos del gateway. Esta ruta está reservada
para RPC internos del plano de control y evita que las líneas base obsoletas de emparejamiento CLI/dispositivo
bloqueen trabajo backend local, como actualizaciones de sesiones de subagentes. Los clientes remotos,
los clientes con origen de navegador, los clientes nodo y los clientes explícitos de token de dispositivo/identidad de dispositivo
siguen usando las comprobaciones normales de emparejamiento y elevación de ámbitos.

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

Durante la transferencia de bootstrap confiable, `hello-ok.auth` también puede incluir entradas
de rol acotadas adicionales en `deviceTokens`:

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

Para el flujo integrado de bootstrap de nodo/operador, el token de nodo principal conserva
`scopes: []` y cualquier token de operador transferido permanece acotado a la lista de permitidos
del operador de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Las comprobaciones de ámbito de bootstrap siguen
prefijadas por rol: las entradas de operador solo satisfacen solicitudes de operador, y los roles
que no son de operador siguen necesitando ámbitos bajo su propio prefijo de rol.

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

## Encuadre

- **Solicitud**: `{type:"req", id, method, params}`
- **Respuesta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

Los métodos con efectos secundarios requieren **claves de idempotencia** (consulta el esquema).

## Roles + ámbitos

Para consultar el modelo completo de ámbitos de operador, las comprobaciones en el momento de aprobación
y la semántica de secretos compartidos, consulta [Ámbitos de operador](/es/gateway/operator-scopes).

### Roles

- `operator` = cliente del plano de control (CLI/UI/automatización).
- `node` = host de capacidades (camera/screen/canvas/system.run).

### Ámbitos (operador)

Ámbitos comunes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` requiere `operator.talk.secrets`
(o `operator.admin`).

Los métodos RPC de gateway registrados por plugins pueden solicitar su propio ámbito de operador, pero
los prefijos reservados de administración del core (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre se resuelven como `operator.admin`.

El ámbito del método es solo la primera barrera. Algunos comandos slash alcanzados mediante
`chat.send` aplican comprobaciones más estrictas a nivel de comando encima de eso. Por ejemplo, las escrituras persistentes
`/config set` y `/config unset` requieren `operator.admin`.

`node.pair.approve` también tiene una comprobación de ámbito adicional en el momento de aprobación, encima del
ámbito base del método:

- solicitudes sin comandos: `operator.pairing`
- solicitudes con comandos de nodo que no son de ejecución: `operator.pairing` + `operator.write`
- solicitudes que incluyen `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacidades/comandos/permisos (nodo)

Los nodos declaran afirmaciones de capacidades al conectarse:

- `caps`: categorías de capacidades de alto nivel.
- `commands`: lista de permitidos de comandos para invocación.
- `permissions`: conmutadores granulares (p. ej., `screen.record`, `camera.capture`).

El Gateway trata esto como **afirmaciones** y aplica listas de permitidos del lado del servidor.

## Presencia

- `system-presence` devuelve entradas indexadas por identidad de dispositivo.
- Las entradas de presencia incluyen `deviceId`, `roles` y `scopes` para que las interfaces puedan mostrar una sola fila por dispositivo
  incluso cuando se conecta como **operador** y como **nodo**.
- `node.list` incluye los campos opcionales `lastSeenAtMs` y `lastSeenReason`. Los nodos conectados informan
  su hora de conexión actual como `lastSeenAtMs` con motivo `connect`; los nodos emparejados también pueden informar
  presencia duradera en segundo plano cuando un evento de nodo confiable actualiza sus metadatos de emparejamiento.

### Evento de actividad en segundo plano de nodo

Los nodos pueden llamar a `node.event` con `event: "node.presence.alive"` para registrar que un nodo emparejado estuvo
activo durante un despertar en segundo plano sin marcarlo como conectado.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` es una enumeración cerrada: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Las cadenas de activador desconocidas se normalizan a
`background` por el gateway antes de la persistencia. El evento solo es duradero para sesiones de dispositivo
de nodo autenticadas; las sesiones sin dispositivo o sin emparejar devuelven `handled: false`.

Los gateways correctos devuelven un resultado estructurado:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Los gateways antiguos todavía pueden devolver `{ "ok": true }` para `node.event`; los clientes deben tratarlo como una
RPC confirmada, no como persistencia duradera de presencia.

## Ámbito de eventos de broadcast

Los eventos de broadcast WebSocket enviados por el servidor se controlan por ámbito para que las sesiones con ámbito de emparejamiento o solo de nodo no reciban pasivamente contenido de sesión.

- Los **frames de chat, agente y resultado de herramienta** (incluidos eventos `agent` transmitidos en streaming y resultados de llamadas a herramientas) requieren al menos `operator.read`. Las sesiones sin `operator.read` omiten estos frames por completo.
- Los **broadcasts `plugin.*` definidos por plugins** están restringidos a `operator.write` u `operator.admin`, según cómo los haya registrado el plugin.
- Los **eventos de estado y transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexión/desconexión, etc.) permanecen sin restricciones para que el estado del transporte siga siendo observable para toda sesión autenticada.
- Las **familias de eventos de broadcast desconocidas** se controlan por ámbito de forma predeterminada (fallo cerrado), a menos que un controlador registrado las relaje explícitamente.

Cada conexión de cliente mantiene su propio número de secuencia por cliente para que los broadcasts preserven el orden monótono en ese socket, incluso cuando distintos clientes ven subconjuntos diferentes del flujo de eventos filtrados por ámbito.

## Familias comunes de métodos RPC

La superficie WS pública es más amplia que los ejemplos de handshake/autenticación anteriores. Esto
no es un volcado generado: `hello-ok.features.methods` es una lista de descubrimiento conservadora
construida desde `src/gateway/server-methods-list.ts` más las exportaciones de métodos de plugins/canales cargados.
Trátala como descubrimiento de funciones, no como una enumeración completa de
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidad">
    - `health` devuelve la instantánea de salud del gateway en caché o recién sondeada.
    - `diagnostics.stability` devuelve el registrador de estabilidad diagnóstica reciente y acotado. Conserva metadatos operativos como nombres de eventos, conteos, tamaños en bytes, lecturas de memoria, estado de cola/sesión, nombres de canales/plugins e ids de sesión. No conserva texto de chat, cuerpos de webhook, salidas de herramientas, cuerpos sin procesar de solicitud o respuesta, tokens, cookies ni valores secretos. Se requiere ámbito de lectura de operador.
    - `status` devuelve el resumen del gateway estilo `/status`; los campos sensibles se incluyen solo para clientes operador con ámbito de administrador.
    - `gateway.identity.get` devuelve la identidad de dispositivo del gateway usada por los flujos de retransmisión y emparejamiento.
    - `system-presence` devuelve la instantánea de presencia actual de dispositivos operador/nodo conectados.
    - `system-event` agrega un evento del sistema y puede actualizar/difundir contexto de presencia.
    - `last-heartbeat` devuelve el último evento Heartbeat persistido.
    - `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el gateway.

  </Accordion>

  <Accordion title="Modelos y uso">
    - `models.list` devuelve el catálogo de modelos permitidos en tiempo de ejecución. Pasa `{ "view": "configured" }` para modelos configurados de tamaño adecuado para el selector (`agents.defaults.models` primero, luego `models.providers.*.models`), o `{ "view": "all" }` para el catálogo completo.
    - `usage.status` devuelve resúmenes de ventanas de uso/cuota restante del proveedor.
    - `usage.cost` devuelve resúmenes agregados de uso de costos para un intervalo de fechas.
    - `doctor.memory.status` devuelve la preparación de la memoria vectorial / embeddings en caché para el workspace del agente predeterminado activo. Pasa `{ "probe": true }` o `{ "deep": true }` solo cuando el llamador quiere explícitamente un ping en vivo al proveedor de embeddings.
    - `doctor.memory.remHarness` devuelve una vista previa delimitada y de solo lectura del arnés REM para clientes remotos del plano de control. Puede incluir rutas de workspace, fragmentos de memoria, markdown fundamentado renderizado y candidatos de promoción profunda, por lo que los llamadores necesitan `operator.read`.
    - `sessions.usage` devuelve resúmenes de uso por sesión.
    - `sessions.usage.timeseries` devuelve el uso de series temporales para una sesión.
    - `sessions.usage.logs` devuelve entradas de registro de uso para una sesión.

  </Accordion>

  <Accordion title="Canales y asistentes de inicio de sesión">
    - `channels.status` devuelve resúmenes de estado de canales/plugins integrados + incluidos.
    - `channels.logout` cierra la sesión de un canal/cuenta específico donde el canal admite cierre de sesión.
    - `web.login.start` inicia un flujo de inicio de sesión QR/web para el proveedor de canal web actual compatible con QR.
    - `web.login.wait` espera a que se complete ese flujo de inicio de sesión QR/web e inicia el canal si tiene éxito.
    - `push.test` envía una notificación push APNs de prueba a un Node iOS registrado.
    - `voicewake.get` devuelve los disparadores de palabra de activación almacenados.
    - `voicewake.set` actualiza los disparadores de palabra de activación y difunde el cambio.

  </Accordion>

  <Accordion title="Mensajería y registros">
    - `send` es el RPC directo de entrega saliente para envíos dirigidos a canal/cuenta/hilo fuera del ejecutor de chat.
    - `logs.tail` devuelve la cola del registro de archivo configurado del Gateway con controles de cursor/límite y bytes máximos.

  </Accordion>

  <Accordion title="Talk y TTS">
    - `talk.config` devuelve la carga útil de configuración efectiva de Talk; `includeSecrets` requiere `operator.talk.secrets` (u `operator.admin`).
    - `talk.mode` establece/difunde el estado actual del modo Talk para clientes WebChat/Control UI.
    - `talk.speak` sintetiza voz a través del proveedor de voz de Talk activo.
    - `tts.status` devuelve el estado de TTS habilitado, el proveedor activo, los proveedores de respaldo y el estado de configuración del proveedor.
    - `tts.providers` devuelve el inventario visible de proveedores TTS.
    - `tts.enable` y `tts.disable` alternan el estado de preferencias de TTS.
    - `tts.setProvider` actualiza el proveedor TTS preferido.
    - `tts.convert` ejecuta una conversión puntual de texto a voz.

  </Accordion>

  <Accordion title="Secretos, configuración, actualización y asistente">
    - `secrets.reload` vuelve a resolver SecretRefs activos e intercambia el estado de secretos en tiempo de ejecución solo si todo tiene éxito.
    - `secrets.resolve` resuelve asignaciones de secretos dirigidas por comando para un conjunto específico de comando/objetivo.
    - `config.get` devuelve la instantánea y el hash de la configuración actual.
    - `config.set` escribe una carga útil de configuración validada.
    - `config.patch` fusiona una actualización parcial de configuración.
    - `config.apply` valida + reemplaza la carga útil completa de configuración.
    - `config.schema` devuelve la carga útil del esquema de configuración en vivo usada por Control UI y las herramientas CLI: esquema, `uiHints`, versión y metadatos de generación, incluidos los metadatos de esquema de plugin + canal cuando el tiempo de ejecución puede cargarlos. El esquema incluye metadatos de campo `title` / `description` derivados de las mismas etiquetas y texto de ayuda usados por la UI, incluidas ramas de composición de objetos anidados, comodines, elementos de array y `anyOf` / `oneOf` / `allOf` cuando existe documentación de campo coincidente.
    - `config.schema.lookup` devuelve una carga útil de búsqueda acotada por ruta para una ruta de configuración: ruta normalizada, un nodo de esquema superficial, sugerencia coincidente + `hintPath`, y resúmenes de hijos inmediatos para profundización de UI/CLI. Los nodos de esquema de búsqueda conservan la documentación orientada al usuario y los campos comunes de validación (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos/de cadena/array/objeto y banderas como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de hijos exponen `key`, `path` normalizada, `type`, `required`, `hasChildren`, además de `hint` / `hintPath` coincidentes.
    - `update.run` ejecuta el flujo de actualización del Gateway y programa un reinicio solo cuando la actualización en sí tuvo éxito. Las actualizaciones del gestor de paquetes fuerzan un reinicio de actualización no diferido y sin periodo de espera después del intercambio de paquete, para que el proceso anterior de Gateway no siga haciendo cargas diferidas desde un árbol `dist` reemplazado.
    - `update.status` devuelve el último centinela de reinicio de actualización en caché, incluida la versión en ejecución posterior al reinicio cuando esté disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de incorporación sobre WS RPC.

  </Accordion>

  <Accordion title="Asistentes de agente y workspace">
    - `agents.list` devuelve entradas de agente configuradas, incluidos el modelo efectivo y los metadatos de tiempo de ejecución.
    - `agents.create`, `agents.update` y `agents.delete` gestionan registros de agente y cableado de workspace.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` gestionan los archivos de workspace de arranque expuestos para un agente.
    - `artifacts.list`, `artifacts.get` y `artifacts.download` exponen resúmenes y descargas de artefactos derivados de transcripciones para un alcance explícito de `sessionKey`, `runId` o `taskId`. Las consultas de ejecución y tarea resuelven la sesión propietaria del lado del servidor y solo devuelven medios de transcripción con procedencia coincidente; las fuentes de URL inseguras o locales devuelven descargas no admitidas en lugar de recuperarse del lado del servidor.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o sesión.
    - `agent.wait` espera a que termine una ejecución y devuelve la instantánea terminal cuando está disponible.

  </Accordion>

  <Accordion title="Control de sesión">
    - `sessions.list` devuelve el índice de sesiones actual, incluidos metadatos `agentRuntime` por fila cuando hay configurado un backend de tiempo de ejecución de agente.
    - `sessions.subscribe` y `sessions.unsubscribe` alternan las suscripciones a eventos de cambio de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` alternan las suscripciones a eventos de transcripción/mensaje para una sesión.
    - `sessions.preview` devuelve vistas previas delimitadas de transcripciones para claves de sesión específicas.
    - `sessions.describe` devuelve una fila de sesión del Gateway para una clave de sesión exacta.
    - `sessions.resolve` resuelve o canonicaliza un objetivo de sesión.
    - `sessions.create` crea una nueva entrada de sesión.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrumpir y dirigir para una sesión activa.
    - `sessions.abort` aborta trabajo activo para una sesión. Un llamador puede pasar `key` más `runId` opcional, o pasar solo `runId` para ejecuciones activas que el Gateway puede resolver a una sesión.
    - `sessions.patch` actualiza metadatos/anulaciones de sesión e informa el modelo canónico resuelto más el `agentRuntime` efectivo.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan mantenimiento de sesión.
    - `sessions.get` devuelve la fila de sesión almacenada completa.
    - La ejecución de chat todavía usa `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` está normalizado para visualización en clientes UI: las etiquetas de directivas en línea se eliminan del texto visible, las cargas XML de llamadas a herramientas en texto plano (incluidas `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques de llamadas a herramientas truncados) y los tokens de control de modelo ASCII/de ancho completo filtrados se eliminan, se omiten filas de asistente de tokens silenciosos puros como `NO_REPLY` / `no_reply` exactos, y las filas sobredimensionadas pueden reemplazarse con marcadores de posición.

  </Accordion>

  <Accordion title="Emparejamiento de dispositivos y tokens de dispositivo">
    - `device.pair.list` devuelve dispositivos emparejados pendientes y aprobados.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` gestionan registros de emparejamiento de dispositivos.
    - `device.token.rotate` rota un token de dispositivo emparejado dentro de su rol aprobado y los límites de alcance del llamador.
    - `device.token.revoke` revoca un token de dispositivo emparejado dentro de su rol aprobado y los límites de alcance del llamador.

  </Accordion>

  <Accordion title="Emparejamiento de Node, invocación y trabajo pendiente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` y `node.pair.verify` cubren el emparejamiento de Node y la verificación de arranque.
    - `node.list` y `node.describe` devuelven el estado de Node conocidos/conectados.
    - `node.rename` actualiza una etiqueta de Node emparejado.
    - `node.invoke` reenvía un comando a un Node conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud de invocación.
    - `node.event` transporta eventos originados en Node de vuelta al gateway.
    - `node.canvas.capability.refresh` actualiza tokens de capacidad de canvas acotados.
    - `node.pending.pull` y `node.pending.ack` son las API de cola de Node conectado.
    - `node.pending.enqueue` y `node.pending.drain` gestionan trabajo pendiente duradero para Node sin conexión/desconectados.

  </Accordion>

  <Accordion title="Familias de aprobaciones">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` cubren solicitudes de aprobación de exec puntuales más búsqueda/repetición de aprobación pendiente.
    - `exec.approval.waitDecision` espera una aprobación de exec pendiente y devuelve la decisión final (o `null` al agotarse el tiempo).
    - `exec.approvals.get` y `exec.approvals.set` gestionan instantáneas de política de aprobación de exec del gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` gestionan la política de aprobación de exec local del Node mediante comandos de retransmisión de Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` cubren flujos de aprobación definidos por Plugin.

  </Accordion>

  <Accordion title="Automatización, Skills y herramientas">
    - Automatización: `wake` programa una inyección de texto de activación inmediata o en el siguiente Heartbeat; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestionan trabajo programado.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Familias de eventos comunes

- `chat`: actualizaciones de chat de UI como `chat.inject` y otros eventos de chat
  solo de transcripción.
- `session.message` y `session.tool`: actualizaciones de transcripción/flujo de eventos para una
  sesión suscrita.
- `sessions.changed`: el índice de sesiones o los metadatos cambiaron.
- `presence`: actualizaciones de instantánea de presencia del sistema.
- `tick`: evento periódico de keepalive / actividad.
- `health`: actualización de instantánea de salud del gateway.
- `heartbeat`: actualización de flujo de eventos de heartbeat.
- `cron`: evento de cambio de ejecución/trabajo de cron.
- `shutdown`: notificación de apagado del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de emparejamiento de Node.
- `node.invoke.request`: difusión de solicitud de invocación de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo emparejado.
- `voicewake.changed`: cambió la configuración de disparadores de palabra de activación.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprobación de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprobación de plugin.

### Métodos auxiliares de Node

- Los Node pueden llamar a `skills.bins` para obtener la lista actual de ejecutables de Skills
  para comprobaciones de permiso automático.

### Métodos auxiliares del operador

- Los operadores pueden llamar a `commands.list` (`operator.read`) para obtener el inventario de comandos de runtime de un agente.
  - `agentId` es opcional; omítelo para leer el workspace del agente predeterminado.
  - `scope` controla a qué superficie apunta el `name` principal:
    - `text` devuelve el token de comando de texto principal sin la `/` inicial
    - `native` y la ruta predeterminada `both` devuelven nombres nativos compatibles con el proveedor cuando están disponibles
  - `textAliases` contiene alias de barra exactos, como `/model` y `/m`.
  - `nativeName` contiene el nombre de comando nativo compatible con el proveedor cuando existe uno.
  - `provider` es opcional y solo afecta la nomenclatura nativa más la disponibilidad de comandos nativos de plugins.
  - `includeArgs=false` omite los metadatos de argumentos serializados de la respuesta.
- Los operadores pueden llamar a `tools.catalog` (`operator.read`) para obtener el catálogo de herramientas de runtime de un agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: propietario del plugin cuando `source="plugin"`
  - `optional`: si una herramienta de plugin es opcional
- Los operadores pueden llamar a `tools.effective` (`operator.read`) para obtener el inventario de herramientas efectivo en runtime de una sesión.
  - `sessionKey` es obligatorio.
  - El Gateway deriva el contexto de runtime confiable desde la sesión en el servidor en lugar de aceptar contexto de autenticación o entrega proporcionado por el llamador.
  - La respuesta tiene alcance de sesión y refleja lo que la conversación activa puede usar ahora mismo, incluidas herramientas de core, plugins y canales.
- Los operadores pueden llamar a `tools.invoke` (`operator.write`) para invocar una herramienta disponible a través de la misma ruta de políticas del Gateway que `/tools/invoke`.
  - `name` es obligatorio. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` son opcionales.
  - Si tanto `sessionKey` como `agentId` están presentes, el agente de sesión resuelto debe coincidir con `agentId`.
  - La respuesta es un sobre orientado al SDK con `ok`, `toolName`, `output` opcional y campos `error` tipados. Las denegaciones de aprobación o política devuelven `ok:false` en la carga útil en lugar de eludir la canalización de políticas de herramientas del Gateway.
- Los operadores pueden llamar a `skills.status` (`operator.read`) para obtener el inventario visible de Skills de un agente.
  - `agentId` es opcional; omítelo para leer el workspace del agente predeterminado.
  - La respuesta incluye elegibilidad, requisitos faltantes, comprobaciones de configuración y opciones de instalación saneadas sin exponer valores secretos sin procesar.
- Los operadores pueden llamar a `skills.search` y `skills.detail` (`operator.read`) para los metadatos de descubrimiento de ClawHub.
- Los operadores pueden llamar a `skills.install` (`operator.admin`) en dos modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una carpeta de Skills en el directorio `skills/` del workspace del agente predeterminado.
  - Modo de instalador del Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` ejecuta una acción declarada `metadata.openclaw.install` en el host del Gateway.
- Los operadores pueden llamar a `skills.update` (`operator.admin`) en dos modos:
  - El modo ClawHub actualiza un slug rastreado o todas las instalaciones rastreadas de ClawHub en el workspace del agente predeterminado.
  - El modo de configuración aplica parches a valores de `skills.entries.<skillKey>` como `enabled`, `apiKey` y `env`.

### Vistas de `models.list`

`models.list` acepta un parámetro opcional `view`:

- Omitido o `"default"`: comportamiento actual de runtime. Si `agents.defaults.models` está configurado, la respuesta es el catálogo permitido; de lo contrario, la respuesta es el catálogo completo del Gateway.
- `"configured"`: comportamiento con tamaño de selector. Si `agents.defaults.models` está configurado, sigue teniendo prioridad. De lo contrario, la respuesta usa entradas explícitas de `models.providers.*.models`, recurriendo al catálogo completo solo cuando no existen filas de modelos configuradas.
- `"all"`: catálogo completo del Gateway, omitiendo `agents.defaults.models`. Usa esto para diagnósticos e interfaces de descubrimiento, no para selectores de modelos normales.

## Aprobaciones de exec

- Cuando una solicitud de exec necesita aprobación, el Gateway transmite `exec.approval.requested`.
- Los clientes de operador resuelven llamando a `exec.approval.resolve` (requiere el alcance `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadatos de sesión canónicos). Las solicitudes sin `systemRunPlan` se rechazan.
- Después de la aprobación, las llamadas reenviadas `node.invoke system.run` reutilizan ese `systemRunPlan` canónico como contexto autoritativo de comando/cwd/sesión.
- Si un llamador muta `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` entre la preparación y el reenvío final aprobado de `system.run`, el Gateway rechaza la ejecución en lugar de confiar en la carga útil mutada.

## Fallback de entrega del agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar entrega saliente.
- `bestEffortDeliver=false` mantiene el comportamiento estricto: los destinos de entrega no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite recurrir a ejecución solo de sesión cuando no se puede resolver ninguna ruta entregable externa (por ejemplo, sesiones internas/webchat o configuraciones multicanal ambiguas).

## Versionado

- `PROTOCOL_VERSION` reside en `src/gateway/protocol/schema/protocol-schemas.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`; el servidor rechaza las incompatibilidades.
- Los esquemas y modelos se generan desde definiciones TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes del cliente

El cliente de referencia en `src/gateway/client.ts` usa estos valores predeterminados. Los valores son estables en protocol v3 y son la línea base esperada para clientes de terceros.

| Constante                                  | Predeterminado                                       | Fuente                                                                                     |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Tiempo de espera de solicitud (por RPC)   | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Tiempo de espera de preauth / desafío de conexión | `15_000` ms                                  | `src/gateway/handshake-timeouts.ts` (config/env puede aumentar el presupuesto emparejado de servidor/cliente) |
| Backoff inicial de reconexión             | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff máximo de reconexión              | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Límite de reintento rápido tras cierre por token de dispositivo | `250` ms                         | `src/gateway/client.ts`                                                                    |
| Gracia de detención forzada antes de `terminate()` | `250` ms                                    | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                  | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalo de tick predeterminado (antes de `hello-ok`) | `30_000` ms                              | `src/gateway/client.ts`                                                                    |
| Cierre por tiempo de espera de tick       | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                           |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                          |

El servidor anuncia los valores efectivos de `policy.tickIntervalMs`, `policy.maxPayload` y `policy.maxBufferedBytes` en `hello-ok`; los clientes deben respetar esos valores en lugar de los valores predeterminados previos al handshake.

## Autenticación

- La autenticación del Gateway mediante secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el modo de autenticación configurado.
- Los modos que portan identidad, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o `gateway.auth.mode: "trusted-proxy"`
  no loopback, satisfacen la comprobación de autenticación de conexión desde
  los encabezados de solicitud en lugar de `connect.params.auth.*`.
- El ingreso privado con `gateway.auth.mode: "none"` omite por completo la
  autenticación de conexión mediante secreto compartido; no expongas ese modo en
  ingresos públicos/no confiables.
- Después del emparejamiento, el Gateway emite un **token de dispositivo**
  limitado al rol de conexión + ámbitos. Se devuelve en
  `hello-ok.auth.deviceToken` y el cliente debe conservarlo para conexiones futuras.
- Los clientes deben conservar el `hello-ok.auth.deviceToken` principal después
  de cualquier conexión correcta.
- Reconectar con ese token de dispositivo **almacenado** también debe reutilizar
  el conjunto de ámbitos aprobados almacenado para ese token. Esto conserva el
  acceso de lectura/sondeo/estado que ya se había concedido y evita que las
  reconexiones se reduzcan silenciosamente a un ámbito implícito más estrecho
  solo de administrador.
- Ensamblado de autenticación de conexión del lado del cliente (`selectConnectAuth` en
  `src/gateway/client.ts`):
  - `auth.password` es ortogonal y siempre se reenvía cuando está definido.
  - `auth.token` se rellena por orden de prioridad: primero el token compartido
    explícito, luego un `deviceToken` explícito y después un token por dispositivo
    almacenado (con clave por `deviceId` + `role`).
  - `auth.bootstrapToken` se envía solo cuando nada de lo anterior resolvió un
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto
    lo suprime.
  - La promoción automática de un token de dispositivo almacenado en el reintento
    único por `AUTH_TOKEN_MISMATCH` está limitada a **endpoints confiables**:
    loopback, o `wss://` con un `tlsFingerprint` fijado. `wss://` público sin
    fijación no cumple los requisitos.
- Las entradas adicionales de `hello-ok.auth.deviceTokens` son tokens de traspaso
  de arranque. Consérvalas solo cuando la conexión haya usado autenticación de
  arranque en un transporte confiable como `wss://` o emparejamiento loopback/local.
- Si un cliente proporciona un `deviceToken` **explícito** o `scopes` explícitos,
  ese conjunto de ámbitos solicitado por el llamador sigue siendo autoritativo;
  los ámbitos en caché solo se reutilizan cuando el cliente reutiliza el token
  por dispositivo almacenado.
- Los tokens de dispositivo pueden rotarse/revocarse mediante `device.token.rotate` y
  `device.token.revoke` (requiere el ámbito `operator.pairing`).
- `device.token.rotate` devuelve metadatos de rotación. Devuelve como eco el token
  portador de reemplazo solo para llamadas del mismo dispositivo que ya están
  autenticadas con ese token de dispositivo, para que los clientes solo con token
  puedan conservar su reemplazo antes de reconectar. Las rotaciones compartidas/de
  administrador no devuelven como eco el token portador.
- La emisión, rotación y revocación de tokens permanecen limitadas al conjunto de
  roles aprobados registrado en la entrada de emparejamiento de ese dispositivo;
  la mutación de tokens no puede ampliar ni dirigir a un rol de dispositivo que
  la aprobación de emparejamiento nunca concedió.
- Para sesiones de token de dispositivo emparejado, la administración de
  dispositivos tiene alcance propio salvo que el llamador también tenga
  `operator.admin`: los llamadores que no sean administradores solo pueden
  eliminar/revocar/rotar su **propia** entrada de dispositivo.
- `device.token.rotate` y `device.token.revoke` también comparan el conjunto de
  ámbitos del token de operador de destino con los ámbitos de sesión actuales del
  llamador. Los llamadores que no sean administradores no pueden rotar ni revocar
  un token de operador más amplio que el que ya poseen.
- Los fallos de autenticación incluyen `error.details.code` además de sugerencias
  de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes confiables pueden intentar un reintento limitado con un token
    por dispositivo en caché.
  - Si ese reintento falla, los clientes deben detener los bucles de reconexión
    automática y mostrar orientación de acción para el operador.

## Identidad de dispositivo + emparejamiento

- Los Nodes deben incluir una identidad de dispositivo estable (`device.id`)
  derivada de la huella digital de un par de claves.
- Los Gateways emiten tokens por dispositivo + rol.
- Se requieren aprobaciones de emparejamiento para nuevos IDs de dispositivo a
  menos que la aprobación automática local esté habilitada.
- La aprobación automática de emparejamiento se centra en conexiones directas de
  local loopback.
- OpenClaw también tiene una ruta estrecha de autoconexión local de backend/contenedor
  para flujos auxiliares confiables de secreto compartido.
- Las conexiones del mismo host mediante tailnet o LAN siguen tratándose como
  remotas para el emparejamiento y requieren aprobación.
- Los clientes WS normalmente incluyen identidad `device` durante `connect`
  (operador + Node). Las únicas excepciones de operador sin dispositivo son las
  rutas de confianza explícitas:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad HTTP insegura solo en localhost.
  - autenticación correcta de operador en la UI de Control con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (último recurso, degradación grave de seguridad).
  - RPCs backend directas por loopback de `gateway-client` autenticadas con el
    token/contraseña compartido del Gateway.
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de autenticación de dispositivo

Para clientes heredados que aún usan el comportamiento de firma previo al desafío, `connect` ahora devuelve
códigos de detalle `DEVICE_AUTH_*` en `error.details.code` con un `error.details.reason` estable.

Fallos comunes de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió en blanco).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto/incorrecto.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga útil de firma no coincide con la carga útil v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella digital de la clave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falló el formato/canonicalización de la clave pública.         |

Objetivo de migración:

- Esperar siempre a `connect.challenge`.
- Firmar la carga útil v2 que incluye el nonce del servidor.
- Enviar el mismo nonce en `connect.params.device.nonce`.
- La carga útil de firma preferida es `v3`, que vincula `platform` y `deviceFamily`
  además de los campos de dispositivo/cliente/rol/ámbitos/token/nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero la
  fijación de metadatos de dispositivos emparejados aún controla la política de
  comandos al reconectar.

## TLS + fijación

- TLS es compatible con conexiones WS.
- Los clientes pueden fijar opcionalmente la huella digital del certificado del Gateway (consulta la configuración
  `gateway.tls` además de `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Ámbito

Este protocolo expone la **API completa del Gateway** (estado, canales, modelos, chat,
agente, sesiones, Nodes, aprobaciones, etc.). La superficie exacta está definida por los
esquemas TypeBox en `src/gateway/protocol/schema.ts`.

## Relacionado

- [Protocolo de puente](/es/gateway/bridge-protocol)
- [Runbook del Gateway](/es/gateway)
