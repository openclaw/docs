---
read_when:
    - Implementar o actualizar clientes WS del Gateway
    - Depuración de incompatibilidades de protocolo o fallos de conexión
    - Regenerando esquema/modelos de protocolo
summary: 'Protocolo WebSocket de Gateway: negociación inicial, tramas y versionado'
title: Protocolo de Gateway
x-i18n:
    generated_at: "2026-05-02T05:26:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8295e4e416250e7381393c0aa6a0016719f96552485cf9d56bb3896c9704c4a9
    source_path: gateway/protocol.md
    workflow: 16
---

El protocolo WS del Gateway es el **plano de control único + transporte de nodos** para
OpenClaw. Todos los clientes (CLI, interfaz web, app de macOS, nodos iOS/Android, nodos
sin interfaz) se conectan mediante WebSocket y declaran su **rol** + **alcance** en el
momento del handshake.

## Transporte

- WebSocket, marcos de texto con cargas JSON.
- El primer marco **debe** ser una solicitud `connect`.
- Los marcos previos a la conexión tienen un límite de 64 KiB. Después de un handshake correcto, los clientes
  deben respetar los límites de `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con los diagnósticos habilitados,
  los marcos entrantes demasiado grandes y los búferes salientes lentos emiten eventos `payload.large`
  antes de que el Gateway cierre o descarte el marco afectado. Estos eventos conservan
  tamaños, límites, superficies y códigos de motivo seguros. No conservan el cuerpo del mensaje,
  el contenido de adjuntos, el cuerpo sin procesar del marco, tokens, cookies ni valores secretos.

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

Mientras el Gateway todavía termina los sidecars de inicio, la solicitud `connect` puede
devolver un error reintentable `UNAVAILABLE` con `details.reason` establecido en
`"startup-sidecars"` y `retryAfterMs`. Los clientes deben reintentar esa respuesta
dentro de su presupuesto general de conexión en lugar de mostrarla como un fallo
terminal de handshake.

`server`, `features`, `snapshot` y `policy` son obligatorios según el esquema
(`src/gateway/protocol/schema/frames.ts`). `auth` también es obligatorio e informa
el rol y los alcances negociados. `canvasHostUrl` es opcional.

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

Los clientes de backend confiables del mismo proceso (`client.id: "gateway-client"`,
`client.mode: "backend"`) pueden omitir `device` en conexiones directas de local loopback cuando
se autentican con el token/contraseña compartido del Gateway. Esta ruta está reservada
para RPCs internos del plano de control y evita que las bases de emparejamiento obsoletas de CLI/dispositivo
bloqueen trabajo local de backend, como actualizaciones de sesiones de subagentes. Los clientes remotos,
clientes de origen de navegador, clientes de nodo y clientes explícitos con token de dispositivo/identidad de dispositivo
siguen usando las comprobaciones normales de emparejamiento y elevación de alcance.

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

Para el flujo integrado de bootstrap de nodo/operador, el token primario de nodo permanece con
`scopes: []` y cualquier token de operador transferido queda acotado a la lista permitida
del operador de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Las comprobaciones de alcance de bootstrap siguen
prefijadas por rol: las entradas de operador solo satisfacen solicitudes de operador, y los roles
que no son de operador aún necesitan alcances bajo su propio prefijo de rol.

### Ejemplo de Node

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

## Roles + alcances

### Roles

- `operator` = cliente del plano de control (CLI/UI/automatización).
- `node` = host de capacidades (camera/screen/canvas/system.run).

### Alcances (operador)

Alcances comunes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` requiere `operator.talk.secrets`
(o `operator.admin`).

Los métodos RPC del Gateway registrados por Plugins pueden solicitar su propio alcance de operador, pero
los prefijos reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre se resuelven como `operator.admin`.

El alcance del método es solo la primera barrera. Algunos comandos de barra alcanzados mediante
`chat.send` aplican comprobaciones más estrictas a nivel de comando encima de eso. Por ejemplo, las escrituras persistentes
de `/config set` y `/config unset` requieren `operator.admin`.

`node.pair.approve` también tiene una comprobación adicional de alcance en el momento de aprobación encima del
alcance base del método:

- solicitudes sin comando: `operator.pairing`
- solicitudes con comandos de nodo que no son de ejecución: `operator.pairing` + `operator.write`
- solicitudes que incluyen `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/comandos/permisos (nodo)

Los nodos declaran afirmaciones de capacidades en el momento de conexión:

- `caps`: categorías de capacidades de alto nivel.
- `commands`: lista permitida de comandos para invocación.
- `permissions`: conmutadores granulares (por ejemplo, `screen.record`, `camera.capture`).

El Gateway trata esto como **afirmaciones** y aplica listas permitidas del lado del servidor.

## Presencia

- `system-presence` devuelve entradas indexadas por identidad de dispositivo.
- Las entradas de presencia incluyen `deviceId`, `roles` y `scopes` para que las interfaces puedan mostrar una sola fila por dispositivo
  incluso cuando se conecta como **operator** y **node**.
- `node.list` incluye campos opcionales `lastSeenAtMs` y `lastSeenReason`. Los nodos conectados informan
  su hora de conexión actual como `lastSeenAtMs` con motivo `connect`; los nodos emparejados también pueden informar
  presencia duradera en segundo plano cuando un evento de nodo confiable actualiza sus metadatos de emparejamiento.

### Evento de nodo activo en segundo plano

Los nodos pueden llamar a `node.event` con `event: "node.presence.alive"` para registrar que un nodo emparejado estuvo
activo durante una activación en segundo plano sin marcarlo como conectado.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` es una enumeración cerrada: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. El Gateway normaliza las cadenas de disparador desconocidas a
`background` antes de persistirlas. El evento solo es duradero para sesiones de dispositivo de nodo
autenticadas; las sesiones sin dispositivo o no emparejadas devuelven `handled: false`.

Los Gateways correctos devuelven un resultado estructurado:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Los Gateways anteriores aún pueden devolver `{ "ok": true }` para `node.event`; los clientes deben tratarlo como una
RPC confirmada, no como persistencia duradera de presencia.

## Ámbito de eventos de difusión

Los eventos de difusión WebSocket enviados por el servidor se restringen por alcance para que las sesiones con alcance de emparejamiento o solo de nodo no reciban pasivamente contenido de sesión.

- Los **marcos de chat, agente y resultado de herramienta** (incluidos eventos `agent` transmitidos y resultados de llamadas a herramientas) requieren al menos `operator.read`. Las sesiones sin `operator.read` omiten estos marcos por completo.
- Las **difusiones `plugin.*` definidas por Plugins** se restringen a `operator.write` u `operator.admin`, según cómo las haya registrado el Plugin.
- Los **eventos de estado y transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexión/desconexión, etc.) permanecen sin restricciones para que la salud del transporte siga siendo observable para cada sesión autenticada.
- Las **familias de eventos de difusión desconocidas** se restringen por alcance de forma predeterminada (fallo cerrado), a menos que un manejador registrado las relaje explícitamente.

Cada conexión de cliente conserva su propio número de secuencia por cliente, de modo que las difusiones preservan un orden monótono en ese socket incluso cuando distintos clientes ven subconjuntos diferentes filtrados por alcance del flujo de eventos.

## Familias comunes de métodos RPC

La superficie pública de WS es más amplia que los ejemplos de handshake/autenticación anteriores. Esta
no es una exportación generada: `hello-ok.features.methods` es una lista conservadora
de descubrimiento creada a partir de `src/gateway/server-methods-list.ts` más las exportaciones de métodos
de Plugins/canales cargados. Trátala como descubrimiento de funciones, no como una
enumeración completa de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidad">
    - `health` devuelve la instantánea de salud del Gateway, en caché o recién sondeada.
    - `diagnostics.stability` devuelve el registrador de estabilidad diagnóstica reciente y acotado. Conserva metadatos operativos como nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de cola/sesión, nombres de canal/Plugin e ids de sesión. No conserva texto de chat, cuerpos de Webhook, salidas de herramientas, cuerpos sin procesar de solicitud o respuesta, tokens, cookies ni valores secretos. Se requiere alcance de lectura de operador.
    - `status` devuelve el resumen del Gateway al estilo `/status`; los campos sensibles se incluyen solo para clientes operadores con alcance de administración.
    - `gateway.identity.get` devuelve la identidad de dispositivo del Gateway usada por los flujos de relay y emparejamiento.
    - `system-presence` devuelve la instantánea actual de presencia para dispositivos operador/nodo conectados.
    - `system-event` agrega un evento del sistema y puede actualizar/difundir el contexto de presencia.
    - `last-heartbeat` devuelve el último evento de Heartbeat persistido.
    - `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el Gateway.

  </Accordion>

  <Accordion title="Modelos y uso">
    - `models.list` devuelve el catálogo de modelos permitido por el runtime. Pasa `{ "view": "configured" }` para obtener modelos configurados con tamaño adecuado para selectores (`agents.defaults.models` primero, luego `models.providers.*.models`), o `{ "view": "all" }` para el catálogo completo.
    - `usage.status` devuelve resúmenes de ventanas de uso y cuota restante del proveedor.
    - `usage.cost` devuelve resúmenes agregados de costes de uso para un intervalo de fechas.
    - `doctor.memory.status` devuelve la preparación de memoria vectorial / embeddings en caché para el workspace del agente predeterminado activo. Pasa `{ "probe": true }` o `{ "deep": true }` solo cuando quien llama quiere explícitamente un ping en vivo al proveedor de embeddings.
    - `doctor.memory.remHarness` devuelve una vista previa acotada y de solo lectura del arnés REM para clientes remotos del plano de control. Puede incluir rutas de workspace, fragmentos de memoria, Markdown fundamentado renderizado y candidatos de promoción profunda, por lo que quienes llaman necesitan `operator.read`.
    - `sessions.usage` devuelve resúmenes de uso por sesión.
    - `sessions.usage.timeseries` devuelve el uso de series temporales para una sesión.
    - `sessions.usage.logs` devuelve entradas de registro de uso para una sesión.

  </Accordion>

  <Accordion title="Canales y ayudantes de inicio de sesión">
    - `channels.status` devuelve resúmenes de estado de canales/plugins integrados y empaquetados.
    - `channels.logout` cierra la sesión de un canal/cuenta específico cuando el canal admite cierre de sesión.
    - `web.login.start` inicia un flujo de inicio de sesión QR/web para el proveedor actual de canal web compatible con QR.
    - `web.login.wait` espera a que se complete ese flujo de inicio de sesión QR/web e inicia el canal si tiene éxito.
    - `push.test` envía una notificación push APNs de prueba a un Node iOS registrado.
    - `voicewake.get` devuelve los disparadores de palabra de activación almacenados.
    - `voicewake.set` actualiza los disparadores de palabra de activación y difunde el cambio.

  </Accordion>

  <Accordion title="Mensajería y registros">
    - `send` es el RPC directo de entrega saliente para envíos dirigidos a canal/cuenta/hilo fuera del ejecutor de chat.
    - `logs.tail` devuelve la cola configurada del registro de archivos del Gateway con controles de cursor/límite y bytes máximos.

  </Accordion>

  <Accordion title="Talk y TTS">
    - `talk.config` devuelve la carga útil efectiva de configuración de Talk; `includeSecrets` requiere `operator.talk.secrets` (o `operator.admin`).
    - `talk.mode` establece/difunde el estado actual del modo Talk para clientes WebChat/Control UI.
    - `talk.speak` sintetiza voz mediante el proveedor de voz de Talk activo.
    - `tts.status` devuelve el estado de activación de TTS, el proveedor activo, los proveedores de reserva y el estado de configuración del proveedor.
    - `tts.providers` devuelve el inventario visible de proveedores TTS.
    - `tts.enable` y `tts.disable` alternan el estado de preferencias de TTS.
    - `tts.setProvider` actualiza el proveedor TTS preferido.
    - `tts.convert` ejecuta una conversión puntual de texto a voz.

  </Accordion>

  <Accordion title="Secretos, configuración, actualización y asistente">
    - `secrets.reload` vuelve a resolver las SecretRefs activas y sustituye el estado de secretos del runtime solo si todo tiene éxito.
    - `secrets.resolve` resuelve asignaciones de secretos dirigidas a comandos para un conjunto específico de comando/destino.
    - `config.get` devuelve la instantánea y el hash de la configuración actual.
    - `config.set` escribe una carga útil de configuración validada.
    - `config.patch` fusiona una actualización parcial de configuración.
    - `config.apply` valida y reemplaza la carga útil completa de configuración.
    - `config.schema` devuelve la carga útil del esquema de configuración en vivo que usan Control UI y las herramientas CLI: esquema, `uiHints`, versión y metadatos de generación, incluidos los metadatos de esquema de plugin y canal cuando el runtime puede cargarlos. El esquema incluye metadatos de campo `title` / `description` derivados de las mismas etiquetas y texto de ayuda usados por la interfaz, incluidas ramas de composición de objeto anidado, comodín, elemento de array y `anyOf` / `oneOf` / `allOf` cuando existe documentación de campo coincidente.
    - `config.schema.lookup` devuelve una carga útil de búsqueda limitada por ruta para una ruta de configuración: ruta normalizada, un nodo de esquema superficial, indicio coincidente + `hintPath` y resúmenes de hijos inmediatos para exploración detallada en UI/CLI. Los nodos de esquema de búsqueda conservan la documentación orientada al usuario y los campos comunes de validación (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos/de cadena/de array/de objeto y marcas como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de hijos exponen `key`, `path` normalizada, `type`, `required`, `hasChildren`, además del `hint` / `hintPath` coincidente.
    - `update.run` ejecuta el flujo de actualización del Gateway y programa un reinicio solo cuando la actualización en sí tuvo éxito. Las actualizaciones del gestor de paquetes fuerzan un reinicio de actualización no diferido y sin periodo de espera tras el intercambio de paquetes para que el proceso antiguo del Gateway no siga cargando de forma diferida desde un árbol `dist` reemplazado.
    - `update.status` devuelve el último centinela en caché de reinicio de actualización, incluida la versión en ejecución posterior al reinicio cuando esté disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de incorporación mediante WS RPC.

  </Accordion>

  <Accordion title="Ayudantes de agente y workspace">
    - `agents.list` devuelve entradas de agente configuradas, incluidos el modelo efectivo y los metadatos de runtime.
    - `agents.create`, `agents.update` y `agents.delete` gestionan registros de agente y cableado de workspace.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` gestionan los archivos de workspace de arranque expuestos para un agente.
    - `artifacts.list`, `artifacts.get` y `artifacts.download` exponen resúmenes y descargas de artefactos derivados de transcripciones para un alcance explícito de `sessionKey`, `runId` o `taskId`. Las consultas de ejecución y tarea resuelven la sesión propietaria en el servidor y solo devuelven medios de transcripción con procedencia coincidente; las fuentes de URL no seguras o locales devuelven descargas no compatibles en lugar de recuperarse desde el servidor.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o sesión.
    - `agent.wait` espera a que finalice una ejecución y devuelve la instantánea terminal cuando está disponible.

  </Accordion>

  <Accordion title="Control de sesiones">
    - `sessions.list` devuelve el índice de sesiones actual, incluidos los metadatos `agentRuntime` por fila cuando está configurado un backend de runtime de agente.
    - `sessions.subscribe` y `sessions.unsubscribe` alternan las suscripciones a eventos de cambio de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` alternan las suscripciones a eventos de transcripción/mensaje para una sesión.
    - `sessions.preview` devuelve vistas previas acotadas de transcripciones para claves de sesión específicas.
    - `sessions.resolve` resuelve o canoniza un destino de sesión.
    - `sessions.create` crea una nueva entrada de sesión.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrumpir y dirigir para una sesión activa.
    - `sessions.abort` cancela el trabajo activo de una sesión. Quien llama puede pasar `key` más un `runId` opcional, o pasar solo `runId` para ejecuciones activas que el Gateway puede resolver a una sesión.
    - `sessions.patch` actualiza metadatos/sobrescrituras de sesión e informa el modelo canónico resuelto más el `agentRuntime` efectivo.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan mantenimiento de sesión.
    - `sessions.get` devuelve la fila completa de sesión almacenada.
    - La ejecución de chat sigue usando `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` se normaliza para visualización en clientes de interfaz: las etiquetas de directivas en línea se eliminan del texto visible, las cargas útiles XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y los tokens de control de modelo ASCII/de ancho completo filtrados se eliminan, las filas de asistente que solo contienen tokens silenciosos, como `NO_REPLY` / `no_reply` exactos, se omiten, y las filas sobredimensionadas pueden reemplazarse por marcadores de posición.

  </Accordion>

  <Accordion title="Emparejamiento de dispositivos y tokens de dispositivo">
    - `device.pair.list` devuelve dispositivos emparejados pendientes y aprobados.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` gestionan registros de emparejamiento de dispositivos.
    - `device.token.rotate` rota un token de dispositivo emparejado dentro de los límites de su rol aprobado y del alcance de quien llama.
    - `device.token.revoke` revoca un token de dispositivo emparejado dentro de los límites de su rol aprobado y del alcance de quien llama.

  </Accordion>

  <Accordion title="Emparejamiento de Node, invocación y trabajo pendiente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` y `node.pair.verify` cubren el emparejamiento de Node y la verificación de arranque.
    - `node.list` y `node.describe` devuelven el estado de Nodes conocidos/conectados.
    - `node.rename` actualiza la etiqueta de un Node emparejado.
    - `node.invoke` reenvía un comando a un Node conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud de invocación.
    - `node.event` transporta eventos originados en Node de vuelta al Gateway.
    - `node.canvas.capability.refresh` actualiza tokens de capacidad de canvas con alcance.
    - `node.pending.pull` y `node.pending.ack` son las API de cola de Node conectado.
    - `node.pending.enqueue` y `node.pending.drain` gestionan trabajo pendiente duradero para Nodes sin conexión/desconectados.

  </Accordion>

  <Accordion title="Familias de aprobación">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` cubren solicitudes de aprobación exec puntuales y búsqueda/reproducción de aprobaciones pendientes.
    - `exec.approval.waitDecision` espera una aprobación exec pendiente y devuelve la decisión final (o `null` si se agota el tiempo de espera).
    - `exec.approvals.get` y `exec.approvals.set` gestionan instantáneas de política de aprobación exec del Gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` gestionan la política de aprobación exec local del Node mediante comandos de retransmisión de Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` cubren flujos de aprobación definidos por plugins.

  </Accordion>

  <Accordion title="Automatización, Skills y herramientas">
    - Automatización: `wake` programa una inyección inmediata o en el siguiente Heartbeat de texto de activación; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestionan trabajo programado.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Familias de eventos comunes

- `chat`: actualizaciones de chat de la interfaz, como `chat.inject` y otros eventos de chat solo de transcripción.
- `session.message` y `session.tool`: actualizaciones de transcripción/flujo de eventos para una sesión suscrita.
- `sessions.changed`: el índice de sesiones o los metadatos cambiaron.
- `presence`: actualizaciones de instantáneas de presencia del sistema.
- `tick`: evento periódico de keepalive / vitalidad.
- `health`: actualización de instantánea de estado del Gateway.
- `heartbeat`: actualización del flujo de eventos de Heartbeat.
- `cron`: evento de cambio de ejecución/trabajo de Cron.
- `shutdown`: notificación de apagado del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de emparejamiento de Node.
- `node.invoke.request`: difusión de solicitud de invocación de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo emparejado.
- `voicewake.changed`: la configuración de disparadores de palabra de activación cambió.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprobación exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprobación de plugin.

### Métodos ayudantes de Node

- Los Nodes pueden llamar a `skills.bins` para obtener la lista actual de ejecutables de Skills para comprobaciones de permiso automático.

### Métodos ayudantes de operador

- Los operadores pueden llamar a `commands.list` (`operator.read`) para obtener el inventario de comandos en tiempo de ejecución de un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - `scope` controla a qué superficie apunta el `name` principal:
    - `text` devuelve el token del comando de texto principal sin la `/` inicial
    - `native` y la ruta predeterminada `both` devuelven nombres nativos conscientes del proveedor cuando están disponibles
  - `textAliases` incluye alias exactos con barra, como `/model` y `/m`.
  - `nativeName` incluye el nombre de comando nativo consciente del proveedor cuando existe.
  - `provider` es opcional y solo afecta la nomenclatura nativa y la disponibilidad de comandos de Plugin nativos.
  - `includeArgs=false` omite los metadatos de argumentos serializados de la respuesta.
- Los operadores pueden llamar a `tools.catalog` (`operator.read`) para obtener el catálogo de herramientas en tiempo de ejecución de un agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: propietario del Plugin cuando `source="plugin"`
  - `optional`: si una herramienta de Plugin es opcional
- Los operadores pueden llamar a `tools.effective` (`operator.read`) para obtener el inventario de herramientas efectivo en tiempo de ejecución de una sesión.
  - `sessionKey` es obligatorio.
  - El Gateway deriva el contexto de tiempo de ejecución de confianza desde la sesión en el servidor en lugar de aceptar contexto de autenticación o entrega suministrado por el llamador.
  - La respuesta está limitada a la sesión y refleja lo que la conversación activa puede usar ahora mismo, incluidas herramientas del núcleo, de Plugin y de canales.
- Los operadores pueden llamar a `tools.invoke` (`operator.write`) para invocar una herramienta disponible mediante la misma ruta de política del Gateway que `/tools/invoke`.
  - `name` es obligatorio. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` son opcionales.
  - Si `sessionKey` y `agentId` están presentes, el agente de la sesión resuelta debe coincidir con `agentId`.
  - La respuesta es un envoltorio orientado al SDK con `ok`, `toolName`, `output` opcional y campos `error` tipados. Las denegaciones por aprobación o política devuelven `ok:false` en la carga útil en lugar de omitir la canalización de políticas de herramientas del Gateway.
- Los operadores pueden llamar a `skills.status` (`operator.read`) para obtener el inventario visible de Skills de un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - La respuesta incluye elegibilidad, requisitos faltantes, comprobaciones de configuración y opciones de instalación saneadas sin exponer valores secretos sin procesar.
- Los operadores pueden llamar a `skills.search` y `skills.detail` (`operator.read`) para los metadatos de descubrimiento de ClawHub.
- Los operadores pueden llamar a `skills.install` (`operator.admin`) en dos modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una carpeta de Skill en el directorio `skills/` del espacio de trabajo del agente predeterminado.
  - Modo instalador del Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` ejecuta una acción `metadata.openclaw.install` declarada en el host del Gateway.
- Los operadores pueden llamar a `skills.update` (`operator.admin`) en dos modos:
  - El modo ClawHub actualiza un slug rastreado o todas las instalaciones de ClawHub rastreadas en el espacio de trabajo del agente predeterminado.
  - El modo de configuración parchea valores de `skills.entries.<skillKey>`, como `enabled`, `apiKey` y `env`.

### Vistas de `models.list`

`models.list` acepta un parámetro `view` opcional:

- Omitido o `"default"`: comportamiento actual en tiempo de ejecución. Si `agents.defaults.models` está configurado, la respuesta es el catálogo permitido; de lo contrario, la respuesta es el catálogo completo del Gateway.
- `"configured"`: comportamiento con tamaño de selector. Si `agents.defaults.models` está configurado, sigue teniendo prioridad. De lo contrario, la respuesta usa entradas explícitas de `models.providers.*.models` y recurre al catálogo completo solo cuando no existen filas de modelos configuradas.
- `"all"`: catálogo completo del Gateway, omitiendo `agents.defaults.models`. Usa esto para diagnósticos e interfaces de descubrimiento, no para selectores de modelos normales.

## Aprobaciones de exec

- Cuando una solicitud de exec necesita aprobación, el Gateway difunde `exec.approval.requested`.
- Los clientes operadores resuelven llamando a `exec.approval.resolve` (requiere el alcance `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadatos de sesión canónicos). Las solicitudes sin `systemRunPlan` se rechazan.
- Después de la aprobación, las llamadas reenviadas `node.invoke system.run` reutilizan ese `systemRunPlan` canónico como el contexto autorizado de comando/cwd/sesión.
- Si un llamador muta `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` entre la preparación y el reenvío final aprobado de `system.run`, el Gateway rechaza la ejecución en lugar de confiar en la carga útil mutada.

## Reserva de entrega del agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar entrega saliente.
- `bestEffortDeliver=false` mantiene el comportamiento estricto: los destinos de entrega no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite recurrir a ejecución solo de sesión cuando no se puede resolver ninguna ruta externa entregable (por ejemplo, sesiones internas/webchat o configuraciones multicanal ambiguas).

## Versionado

- `PROTOCOL_VERSION` reside en `src/gateway/protocol/schema/protocol-schemas.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`; el servidor rechaza las incompatibilidades.
- Los esquemas y modelos se generan a partir de definiciones de TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes del cliente

El cliente de referencia en `src/gateway/client.ts` usa estos valores predeterminados. Los valores son estables en todo el protocolo v3 y son la base esperada para clientes de terceros.

| Constante                                 | Valor predeterminado                                  | Fuente                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Tiempo de espera de solicitud (por RPC)   | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Tiempo de espera de preautenticación / desafío de conexión | `15_000` ms                              | `src/gateway/handshake-timeouts.ts` (config/env puede aumentar el presupuesto emparejado del servidor/cliente) |
| Backoff de reconexión inicial             | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff máximo de reconexión              | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Límite de reintento rápido tras cierre por token de dispositivo | `250` ms                               | `src/gateway/client.ts`                                                                    |
| Gracia de parada forzada antes de `terminate()` | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                      | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalo de tick predeterminado (antes de `hello-ok`) | `30_000` ms                                  | `src/gateway/client.ts`                                                                    |
| Cierre por tiempo de espera de tick       | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

El servidor anuncia los valores efectivos de `policy.tickIntervalMs`, `policy.maxPayload` y `policy.maxBufferedBytes` en `hello-ok`; los clientes deben respetar esos valores en lugar de los valores predeterminados previos al handshake.

## Autenticación

- La autenticación del Gateway con secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el modo de autenticación configurado.
- Los modos que llevan identidad, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o `gateway.auth.mode: "trusted-proxy"`
  no local loopback, satisfacen la verificación de autenticación de `connect` a partir de
  los encabezados de la solicitud en lugar de `connect.params.auth.*`.
- La entrada privada `gateway.auth.mode: "none"` omite por completo la autenticación
  de `connect` con secreto compartido; no expongas ese modo en una entrada pública/no confiable.
- Después del emparejamiento, el Gateway emite un **token de dispositivo** limitado al rol
  de conexión + ámbitos. Se devuelve en `hello-ok.auth.deviceToken` y el cliente debe
  conservarlo para conexiones futuras.
- Los clientes deben conservar el `hello-ok.auth.deviceToken` principal después de cualquier
  conexión correcta.
- Reconectarse con ese token de dispositivo **almacenado** también debe reutilizar el conjunto
  de ámbitos aprobados almacenado para ese token. Esto conserva el acceso de lectura/sondeo/estado
  que ya se había concedido y evita reducir silenciosamente las reconexiones a un
  ámbito implícito más estrecho solo de administrador.
- Ensamblado de autenticación de `connect` del lado del cliente (`selectConnectAuth` en
  `src/gateway/client.ts`):
  - `auth.password` es ortogonal y siempre se reenvía cuando está definido.
  - `auth.token` se rellena por orden de prioridad: primero el token compartido explícito,
    luego un `deviceToken` explícito y después un token por dispositivo almacenado (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` se envía solo cuando ninguno de los anteriores resolvió un
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La promoción automática de un token de dispositivo almacenado en el reintento único
    `AUTH_TOKEN_MISMATCH` se limita a **endpoints de confianza únicamente**:
    loopback, o `wss://` con un `tlsFingerprint` fijado. `wss://` público
    sin fijación no cumple los requisitos.
- Las entradas adicionales de `hello-ok.auth.deviceTokens` son tokens de traspaso de arranque.
  Consérvalos solo cuando la conexión haya usado autenticación de arranque en un transporte de confianza
  como `wss://` o emparejamiento loopback/local.
- Si un cliente proporciona un `deviceToken` **explícito** o `scopes` explícitos, ese
  conjunto de ámbitos solicitado por el llamador sigue siendo la autoridad; los ámbitos en caché solo
  se reutilizan cuando el cliente reutiliza el token por dispositivo almacenado.
- Los tokens de dispositivo pueden rotarse/revocarse mediante `device.token.rotate` y
  `device.token.revoke` (requiere el ámbito `operator.pairing`).
- `device.token.rotate` devuelve metadatos de rotación. Repite el token portador de reemplazo
  solo para llamadas del mismo dispositivo que ya están autenticadas con
  ese token de dispositivo, para que los clientes que solo usan tokens puedan conservar su reemplazo antes de
  reconectarse. Las rotaciones compartidas/de administrador no repiten el token portador.
- La emisión, rotación y revocación de tokens permanecen limitadas al conjunto de roles aprobados
  registrado en la entrada de emparejamiento de ese dispositivo; la mutación de tokens no puede ampliar ni
  apuntar a un rol de dispositivo que la aprobación de emparejamiento nunca concedió.
- Para sesiones de token de dispositivo emparejado, la gestión de dispositivos se limita a sí misma salvo que el
  llamador también tenga `operator.admin`: los llamadores no administradores solo pueden quitar/revocar/rotar
  su **propia** entrada de dispositivo.
- `device.token.rotate` y `device.token.revoke` también comprueban el conjunto de ámbitos del token de operador
  de destino contra los ámbitos de sesión actuales del llamador. Los llamadores no administradores
  no pueden rotar ni revocar un token de operador más amplio que el que ya poseen.
- Los fallos de autenticación incluyen `error.details.code` más sugerencias de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes de confianza pueden intentar un reintento limitado con un token por dispositivo en caché.
  - Si ese reintento falla, los clientes deben detener los bucles de reconexión automática y mostrar orientación de acción para el operador.

## Identidad del dispositivo + emparejamiento

- Los nodos deben incluir una identidad de dispositivo estable (`device.id`) derivada de una
  huella digital de par de claves.
- Los Gateways emiten tokens por dispositivo + rol.
- Se requieren aprobaciones de emparejamiento para nuevos identificadores de dispositivo, salvo que la aprobación automática local
  esté habilitada.
- La aprobación automática de emparejamiento se centra en conexiones directas local loopback.
- OpenClaw también tiene una ruta estrecha de autoconexión local al backend/contenedor para
  flujos auxiliares de confianza con secreto compartido.
- Las conexiones de la misma red tailnet o LAN del host siguen tratándose como remotas para el emparejamiento y
  requieren aprobación.
- Los clientes WS normalmente incluyen identidad de `device` durante `connect` (operador +
  nodo). Las únicas excepciones de operador sin dispositivo son rutas de confianza explícitas:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad HTTP insegura solo en localhost.
  - autenticación correcta de operador de la interfaz de control con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (romper el cristal, degradación grave de seguridad).
  - RPCs de backend `gateway-client` por loopback directo autenticadas con el token/contraseña compartido
    del Gateway.
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de autenticación de dispositivos

Para clientes heredados que aún usan el comportamiento de firma anterior al desafío, `connect` ahora devuelve
códigos de detalle `DEVICE_AUTH_*` bajo `error.details.code` con un `error.details.reason` estable.

Fallos comunes de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió en blanco). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto/incorrecto. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga útil de firma no coincide con la carga útil v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella digital de la clave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falló el formato/canonización de la clave pública. |

Objetivo de migración:

- Espera siempre a `connect.challenge`.
- Firma la carga útil v2 que incluye el nonce del servidor.
- Envía el mismo nonce en `connect.params.device.nonce`.
- La carga útil de firma preferida es `v3`, que vincula `platform` y `deviceFamily`
  además de los campos de dispositivo/cliente/rol/ámbitos/token/nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero la fijación de
  metadatos de dispositivo emparejado sigue controlando la política de comandos al reconectarse.

## TLS + fijación

- TLS es compatible con conexiones WS.
- Los clientes pueden fijar opcionalmente la huella digital del certificado del Gateway (consulta la configuración
  `gateway.tls` más `gateway.remote.tlsFingerprint` o CLI `--tls-fingerprint`).

## Alcance

Este protocolo expone la **API completa del Gateway** (estado, canales, modelos, chat,
agente, sesiones, nodos, aprobaciones, etc.). La superficie exacta está definida por los
esquemas TypeBox en `src/gateway/protocol/schema.ts`.

## Relacionado

- [Protocolo de puente](/es/gateway/bridge-protocol)
- [Runbook del Gateway](/es/gateway)
