---
read_when:
    - Implementación o actualización de clientes WS de Gateway
    - Depuración de incompatibilidades de protocolo o fallos de conexión
    - Regenerando el esquema/los modelos del protocolo
summary: 'Protocolo WebSocket de Gateway: handshake, tramas, versionado'
title: Protocolo de Gateway
x-i18n:
    generated_at: "2026-05-02T20:48:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc8bd6bae485f13bbd0e8762d30abdfab7e2aee635f8ebac1a38798493239798
    source_path: gateway/protocol.md
    workflow: 16
---

El protocolo WS del Gateway es el **plano de control único + transporte de nodos** de
OpenClaw. Todos los clientes (CLI, interfaz web, app de macOS, nodos iOS/Android,
nodos sin interfaz) se conectan mediante WebSocket y declaran su **rol** + **ámbito**
durante la negociación inicial.

## Transporte

- WebSocket, marcos de texto con cargas JSON.
- El primer marco **debe** ser una solicitud `connect`.
- Los marcos previos a la conexión están limitados a 64 KiB. Después de una negociación inicial correcta, los clientes
  deben respetar los límites `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con los diagnósticos habilitados,
  los marcos entrantes sobredimensionados y los búferes salientes lentos emiten eventos `payload.large`
  antes de que el Gateway cierre o descarte el marco afectado. Estos eventos conservan
  tamaños, límites, superficies y códigos de motivo seguros. No conservan el cuerpo del mensaje,
  el contenido de los adjuntos, el cuerpo bruto del marco, tokens, cookies ni valores secretos.

## Negociación inicial (connect)

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

Mientras el Gateway todavía termina de iniciar los procesos auxiliares, la solicitud `connect` puede
devolver un error `UNAVAILABLE` reintentable con `details.reason` establecido en
`"startup-sidecars"` y `retryAfterMs`. Los clientes deben reintentar esa respuesta
dentro de su presupuesto general de conexión en lugar de mostrarla como un fallo terminal
de negociación inicial.

`server`, `features`, `snapshot` y `policy` son todos obligatorios según el esquema
(`src/gateway/protocol/schema/frames.ts`). `auth` también es obligatorio e informa
el rol y los ámbitos negociados. `canvasHostUrl` es opcional.

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

Los clientes backend de confianza del mismo proceso (`client.id: "gateway-client"`,
`client.mode: "backend"`) pueden omitir `device` en conexiones directas local loopback cuando
se autentican con el token/contraseña compartido del Gateway. Esta ruta está reservada
para RPC internas del plano de control y evita que las líneas base obsoletas de emparejamiento de CLI/dispositivo
bloqueen trabajo local de backend, como actualizaciones de sesiones de subagentes. Los clientes remotos,
clientes con origen de navegador, clientes de nodo y clientes explícitos de token de dispositivo/identidad de dispositivo
siguen usando las comprobaciones normales de emparejamiento y ampliación de ámbitos.

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

Durante la transferencia de arranque de confianza, `hello-ok.auth` también puede incluir entradas
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

Para el flujo de arranque integrado de nodo/operador, el token de nodo principal mantiene
`scopes: []` y cualquier token de operador transferido permanece acotado a la lista de permitidos
del operador de arranque (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Las comprobaciones de ámbito de arranque siguen
prefijadas por rol: las entradas de operador solo satisfacen solicitudes de operador, y los roles
que no son de operador todavía necesitan ámbitos bajo su propio prefijo de rol.

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

## Roles + ámbitos

### Roles

- `operator` = cliente del plano de control (CLI/interfaz de usuario/automatización).
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

Los métodos RPC de Gateway registrados por Plugins pueden solicitar su propio ámbito de operador, pero
los prefijos reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre se resuelven como `operator.admin`.

El ámbito del método es solo la primera barrera. Algunos comandos slash alcanzados mediante
`chat.send` aplican comprobaciones más estrictas a nivel de comando además de eso. Por ejemplo, las escrituras persistentes
`/config set` y `/config unset` requieren `operator.admin`.

`node.pair.approve` también tiene una comprobación adicional de ámbito en el momento de aprobación, además del
ámbito base del método:

- solicitudes sin comandos: `operator.pairing`
- solicitudes con comandos de nodo que no son de ejecución: `operator.pairing` + `operator.write`
- solicitudes que incluyen `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacidades/comandos/permisos (nodo)

Los nodos declaran reclamaciones de capacidad en el momento de conectarse:

- `caps`: categorías de capacidad de alto nivel.
- `commands`: lista de permitidos de comandos para invocación.
- `permissions`: conmutadores granulares (por ejemplo, `screen.record`, `camera.capture`).

El Gateway trata esto como **reclamaciones** y aplica listas de permitidos del lado del servidor.

## Presencia

- `system-presence` devuelve entradas indexadas por identidad de dispositivo.
- Las entradas de presencia incluyen `deviceId`, `roles` y `scopes` para que las IU puedan mostrar una sola fila por dispositivo
  incluso cuando se conecta como **operador** y **nodo**.
- `node.list` incluye los campos opcionales `lastSeenAtMs` y `lastSeenReason`. Los nodos conectados informan
  su hora de conexión actual como `lastSeenAtMs` con el motivo `connect`; los nodos emparejados también pueden informar
  presencia duradera en segundo plano cuando un evento de nodo de confianza actualiza sus metadatos de emparejamiento.

### Evento de nodo activo en segundo plano

Los nodos pueden llamar a `node.event` con `event: "node.presence.alive"` para registrar que un nodo emparejado estaba
activo durante una activación en segundo plano sin marcarlo como conectado.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` es una enumeración cerrada: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Las cadenas de activador desconocidas se normalizan a
`background` mediante el Gateway antes de la persistencia. El evento solo es duradero para sesiones de dispositivo de nodo
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

Los Gateways más antiguos aún pueden devolver `{ "ok": true }` para `node.event`; los clientes deben tratarlo como una
RPC reconocida, no como persistencia de presencia duradera.

## Delimitación de ámbitos de eventos de difusión

Los eventos de difusión WebSocket enviados por el servidor están protegidos por ámbito para que las sesiones con ámbito de emparejamiento o solo de nodo no reciban pasivamente contenido de sesión.

- **Tramas de chat, agente y resultado de herramienta** (incluidos los eventos `agent` transmitidos y los resultados de llamadas de herramienta) requieren al menos `operator.read`. Las sesiones sin `operator.read` omiten estas tramas por completo.
- **Difusiones `plugin.*` definidas por Plugins** están protegidas con `operator.write` o `operator.admin`, según cómo las registró el Plugin.
- **Eventos de estado y transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexión/desconexión, etc.) permanecen sin restricciones para que el estado del transporte siga siendo observable para cada sesión autenticada.
- **Familias de eventos de difusión desconocidas** están protegidas por ámbito de forma predeterminada (cerradas ante fallos), salvo que un manejador registrado las relaje explícitamente.

Cada conexión de cliente mantiene su propio número de secuencia por cliente, por lo que las difusiones conservan el orden monotónico en ese socket incluso cuando distintos clientes ven subconjuntos filtrados por ámbito diferentes del flujo de eventos.

## Familias comunes de métodos RPC

La superficie pública de WS es más amplia que los ejemplos de protocolo de enlace/autenticación anteriores. Esta
no es una descarga generada: `hello-ok.features.methods` es una lista conservadora
de descubrimiento creada a partir de `src/gateway/server-methods-list.ts` más las exportaciones de métodos de
Plugins/canales cargados. Trátala como descubrimiento de características, no como una
enumeración completa de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidad">
    - `health` devuelve la instantánea de salud del Gateway almacenada en caché o recién comprobada.
    - `diagnostics.stability` devuelve el registrador de estabilidad diagnóstica reciente y acotado. Conserva metadatos operativos como nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de cola/sesión, nombres de canal/Plugin e identificadores de sesión. No conserva texto de chat, cuerpos de webhook, salidas de herramientas, cuerpos sin procesar de solicitudes o respuestas, tokens, cookies ni valores secretos. Se requiere ámbito de lectura de operador.
    - `status` devuelve el resumen del Gateway al estilo de `/status`; los campos sensibles se incluyen solo para clientes de operador con ámbito de administración.
    - `gateway.identity.get` devuelve la identidad de dispositivo del Gateway utilizada por los flujos de relé y emparejamiento.
    - `system-presence` devuelve la instantánea de presencia actual para dispositivos operador/nodo conectados.
    - `system-event` agrega un evento del sistema y puede actualizar/difundir contexto de presencia.
    - `last-heartbeat` devuelve el último evento Heartbeat persistido.
    - `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el Gateway.

  </Accordion>

  <Accordion title="Modelos y uso">
    - `models.list` devuelve el catálogo de modelos permitido por el runtime. Pasa `{ "view": "configured" }` para modelos configurados de tamaño adecuado para selector (`agents.defaults.models` primero, luego `models.providers.*.models`), o `{ "view": "all" }` para el catálogo completo.
    - `usage.status` devuelve resúmenes de ventanas de uso/cuota restante del proveedor.
    - `usage.cost` devuelve resúmenes agregados de uso de costes para un intervalo de fechas.
    - `doctor.memory.status` devuelve la preparación de memoria vectorial / embeddings en caché para el workspace activo del agente predeterminado. Pasa `{ "probe": true }` o `{ "deep": true }` solo cuando el llamador quiere explícitamente un ping en vivo al proveedor de embeddings.
    - `doctor.memory.remHarness` devuelve una vista previa acotada y de solo lectura del arnés REM para clientes remotos del plano de control. Puede incluir rutas de workspace, fragmentos de memoria, markdown fundamentado renderizado y candidatos de promoción profunda, por lo que los llamadores necesitan `operator.read`.
    - `sessions.usage` devuelve resúmenes de uso por sesión.
    - `sessions.usage.timeseries` devuelve uso en serie temporal para una sesión.
    - `sessions.usage.logs` devuelve entradas de registro de uso para una sesión.

  </Accordion>

  <Accordion title="Canales y asistentes de inicio de sesión">
    - `channels.status` devuelve resúmenes de estado de canales/plugins integrados + incluidos.
    - `channels.logout` cierra sesión en un canal/cuenta específico cuando el canal admite cierre de sesión.
    - `web.login.start` inicia un flujo de inicio de sesión QR/web para el proveedor de canal web actual compatible con QR.
    - `web.login.wait` espera a que ese flujo de inicio de sesión QR/web se complete e inicia el canal si tiene éxito.
    - `push.test` envía una notificación push de prueba de APNs a un nodo iOS registrado.
    - `voicewake.get` devuelve los disparadores de palabra de activación almacenados.
    - `voicewake.set` actualiza los disparadores de palabra de activación y transmite el cambio.

  </Accordion>

  <Accordion title="Mensajería y registros">
    - `send` es el RPC directo de entrega saliente para envíos dirigidos a canal/cuenta/hilo fuera del ejecutor de chat.
    - `logs.tail` devuelve la cola del registro de archivo del Gateway configurada con controles de cursor/límite y bytes máximos.

  </Accordion>

  <Accordion title="Talk y TTS">
    - `talk.config` devuelve la carga de configuración efectiva de Talk; `includeSecrets` requiere `operator.talk.secrets` (o `operator.admin`).
    - `talk.mode` establece/transmite el estado actual del modo Talk para clientes WebChat/Control UI.
    - `talk.speak` sintetiza voz mediante el proveedor activo de voz de Talk.
    - `tts.status` devuelve el estado habilitado de TTS, el proveedor activo, los proveedores de respaldo y el estado de configuración del proveedor.
    - `tts.providers` devuelve el inventario visible de proveedores de TTS.
    - `tts.enable` y `tts.disable` alternan el estado de preferencias de TTS.
    - `tts.setProvider` actualiza el proveedor de TTS preferido.
    - `tts.convert` ejecuta una conversión puntual de texto a voz.

  </Accordion>

  <Accordion title="Secretos, configuración, actualización y asistente">
    - `secrets.reload` vuelve a resolver los SecretRefs activos e intercambia el estado de secretos del runtime solo si todo se completa correctamente.
    - `secrets.resolve` resuelve asignaciones de secretos dirigidas a comandos para un conjunto específico de comando/destino.
    - `config.get` devuelve la instantánea y el hash de la configuración actual.
    - `config.set` escribe una carga de configuración validada.
    - `config.patch` fusiona una actualización parcial de configuración.
    - `config.apply` valida + reemplaza la carga completa de configuración.
    - `config.schema` devuelve la carga del esquema de configuración en vivo usada por Control UI y las herramientas de CLI: esquema, `uiHints`, versión y metadatos de generación, incluidos metadatos de esquema de plugin + canal cuando el runtime puede cargarlos. El esquema incluye metadatos de campo `title` / `description` derivados de las mismas etiquetas y texto de ayuda usados por la UI, incluidas ramas de composición de objeto anidado, comodín, elemento de arreglo y `anyOf` / `oneOf` / `allOf` cuando existe documentación de campo coincidente.
    - `config.schema.lookup` devuelve una carga de búsqueda limitada a una ruta para una ruta de configuración: ruta normalizada, un nodo de esquema superficial, pista coincidente + `hintPath` y resúmenes inmediatos de hijos para exploración en UI/CLI. Los nodos de esquema de búsqueda conservan la documentación orientada al usuario y los campos de validación comunes (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos/de cadena/de arreglo/de objeto y banderas como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de hijos exponen `key`, `path` normalizada, `type`, `required`, `hasChildren`, además de `hint` / `hintPath` coincidentes.
    - `update.run` ejecuta el flujo de actualización del Gateway y programa un reinicio solo cuando la actualización en sí tuvo éxito. Las actualizaciones del gestor de paquetes fuerzan un reinicio de actualización no diferido y sin periodo de enfriamiento después del intercambio del paquete, para que el proceso antiguo del Gateway no siga cargando de forma perezosa desde un árbol `dist` reemplazado.
    - `update.status` devuelve el último centinela de reinicio de actualización en caché, incluida la versión en ejecución posterior al reinicio cuando está disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de incorporación mediante WS RPC.

  </Accordion>

  <Accordion title="Asistentes de agente y workspace">
    - `agents.list` devuelve entradas de agente configuradas, incluidos el modelo efectivo y metadatos del runtime.
    - `agents.create`, `agents.update` y `agents.delete` administran registros de agentes y cableado de workspace.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` administran los archivos de workspace de arranque expuestos para un agente.
    - `artifacts.list`, `artifacts.get` y `artifacts.download` exponen resúmenes y descargas de artefactos derivados de transcripciones para un alcance explícito de `sessionKey`, `runId` o `taskId`. Las consultas de ejecución y tarea resuelven la sesión propietaria en el servidor y solo devuelven medios de transcripción con procedencia coincidente; las fuentes de URL inseguras o locales devuelven descargas no admitidas en lugar de recuperarse en el servidor.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o una sesión.
    - `agent.wait` espera a que termine una ejecución y devuelve la instantánea terminal cuando está disponible.

  </Accordion>

  <Accordion title="Control de sesión">
    - `sessions.list` devuelve el índice de sesiones actual, incluidos metadatos `agentRuntime` por fila cuando hay un backend de runtime de agente configurado.
    - `sessions.subscribe` y `sessions.unsubscribe` alternan suscripciones a eventos de cambio de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` alternan suscripciones a eventos de transcripción/mensaje para una sesión.
    - `sessions.preview` devuelve vistas previas acotadas de transcripciones para claves de sesión específicas.
    - `sessions.describe` devuelve una fila de sesión del Gateway para una clave de sesión exacta.
    - `sessions.resolve` resuelve o canoniza un destino de sesión.
    - `sessions.create` crea una nueva entrada de sesión.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrupción y dirección para una sesión activa.
    - `sessions.abort` cancela trabajo activo para una sesión. Un llamador puede pasar `key` más `runId` opcional, o pasar solo `runId` para ejecuciones activas que el Gateway pueda resolver a una sesión.
    - `sessions.patch` actualiza metadatos/anulaciones de sesión e informa el modelo canónico resuelto además del `agentRuntime` efectivo.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan mantenimiento de sesión.
    - `sessions.get` devuelve la fila completa de sesión almacenada.
    - La ejecución de chat todavía usa `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` se normaliza para visualización en clientes de UI: las etiquetas de directivas en línea se eliminan del texto visible, las cargas XML de llamadas a herramientas en texto sin formato (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y los tokens de control de modelo ASCII/de ancho completo filtrados se eliminan, las filas de asistente de token silencioso puro como `NO_REPLY` / `no_reply` exactos se omiten, y las filas sobredimensionadas pueden reemplazarse por marcadores de posición.

  </Accordion>

  <Accordion title="Emparejamiento de dispositivos y tokens de dispositivo">
    - `device.pair.list` devuelve dispositivos emparejados pendientes y aprobados.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` administran registros de emparejamiento de dispositivos.
    - `device.token.rotate` rota un token de dispositivo emparejado dentro de los límites de su rol aprobado y del alcance del llamador.
    - `device.token.revoke` revoca un token de dispositivo emparejado dentro de los límites de su rol aprobado y del alcance del llamador.

  </Accordion>

  <Accordion title="Emparejamiento de nodos, invocación y trabajo pendiente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` y `node.pair.verify` cubren el emparejamiento de nodos y la verificación de arranque.
    - `node.list` y `node.describe` devuelven el estado de nodos conocidos/conectados.
    - `node.rename` actualiza una etiqueta de nodo emparejado.
    - `node.invoke` reenvía un comando a un nodo conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud de invocación.
    - `node.event` lleva eventos originados en nodos de vuelta al Gateway.
    - `node.canvas.capability.refresh` actualiza tokens de capacidad de canvas con alcance.
    - `node.pending.pull` y `node.pending.ack` son las API de cola de nodo conectado.
    - `node.pending.enqueue` y `node.pending.drain` administran trabajo pendiente durable para nodos sin conexión/desconectados.

  </Accordion>

  <Accordion title="Familias de aprobación">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` cubren solicitudes puntuales de aprobación de exec además de búsqueda/repetición de aprobaciones pendientes.
    - `exec.approval.waitDecision` espera una aprobación de exec pendiente y devuelve la decisión final (o `null` si se agota el tiempo de espera).
    - `exec.approvals.get` y `exec.approvals.set` administran instantáneas de política de aprobación de exec del Gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` administran la política local de aprobación de exec del nodo mediante comandos de retransmisión de nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` cubren flujos de aprobación definidos por plugins.

  </Accordion>

  <Accordion title="Automatización, Skills y herramientas">
    - Automatización: `wake` programa una inyección de texto de activación inmediata o en el siguiente Heartbeat; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` administran trabajo programado.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Familias de eventos comunes

- `chat`: actualizaciones de chat de UI como `chat.inject` y otros eventos de chat solo de transcripción.
- `session.message` y `session.tool`: actualizaciones de transcripción/flujo de eventos para una sesión suscrita.
- `sessions.changed`: el índice de sesiones o los metadatos cambiaron.
- `presence`: actualizaciones de instantánea de presencia del sistema.
- `tick`: evento periódico de mantenimiento de conexión / vivacidad.
- `health`: actualización de instantánea de estado del Gateway.
- `heartbeat`: actualización de flujo de eventos de Heartbeat.
- `cron`: evento de cambio de ejecución/trabajo de Cron.
- `shutdown`: notificación de apagado del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de emparejamiento de nodo.
- `node.invoke.request`: difusión de solicitud de invocación de nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo emparejado.
- `voicewake.changed`: la configuración de disparadores de palabra de activación cambió.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprobación de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprobación de plugin.

### Métodos auxiliares de nodo

- Los nodos pueden llamar a `skills.bins` para recuperar la lista actual de ejecutables de Skills para comprobaciones de permiso automático.

### Métodos auxiliares de operador

- Los operadores pueden llamar a `commands.list` (`operator.read`) para obtener el inventario de comandos en tiempo de ejecución de un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo predeterminado del agente.
  - `scope` controla a qué superficie apunta el `name` principal:
    - `text` devuelve el token de comando de texto principal sin la `/` inicial
    - `native` y la ruta predeterminada `both` devuelven nombres nativos conscientes del proveedor cuando están disponibles
  - `textAliases` contiene alias exactos con barra, como `/model` y `/m`.
  - `nativeName` contiene el nombre de comando nativo consciente del proveedor cuando existe.
  - `provider` es opcional y solo afecta a la nomenclatura nativa y a la disponibilidad de comandos nativos de plugin.
  - `includeArgs=false` omite de la respuesta los metadatos de argumentos serializados.
- Los operadores pueden llamar a `tools.catalog` (`operator.read`) para obtener el catálogo de herramientas en tiempo de ejecución de un agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: propietario del plugin cuando `source="plugin"`
  - `optional`: si una herramienta de plugin es opcional
- Los operadores pueden llamar a `tools.effective` (`operator.read`) para obtener el inventario de herramientas efectivo en tiempo de ejecución de una sesión.
  - `sessionKey` es obligatorio.
  - El Gateway deriva el contexto de tiempo de ejecución de confianza desde la sesión en el servidor, en lugar de aceptar contexto de autenticación o entrega proporcionado por el llamador.
  - La respuesta tiene alcance de sesión y refleja lo que la conversación activa puede usar ahora mismo, incluidas herramientas del núcleo, de plugins y de canales.
- Los operadores pueden llamar a `tools.invoke` (`operator.write`) para invocar una herramienta disponible mediante la misma ruta de políticas del Gateway que `/tools/invoke`.
  - `name` es obligatorio. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` son opcionales.
  - Si `sessionKey` y `agentId` están presentes, el agente resuelto de la sesión debe coincidir con `agentId`.
  - La respuesta es un sobre orientado al SDK con `ok`, `toolName`, `output` opcional y campos `error` tipados. Las denegaciones por aprobación o política devuelven `ok:false` en la carga útil en lugar de omitir la canalización de políticas de herramientas del Gateway.
- Los operadores pueden llamar a `skills.status` (`operator.read`) para obtener el inventario visible de Skills de un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo predeterminado del agente.
  - La respuesta incluye elegibilidad, requisitos faltantes, comprobaciones de configuración y opciones de instalación saneadas sin exponer valores secretos sin procesar.
- Los operadores pueden llamar a `skills.search` y `skills.detail` (`operator.read`) para metadatos de descubrimiento de ClawHub.
- Los operadores pueden llamar a `skills.install` (`operator.admin`) en dos modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una carpeta de skill en el directorio `skills/` del espacio de trabajo predeterminado del agente.
  - Modo de instalador del Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` ejecuta una acción declarada `metadata.openclaw.install` en el host del Gateway.
- Los operadores pueden llamar a `skills.update` (`operator.admin`) en dos modos:
  - El modo ClawHub actualiza un slug rastreado o todas las instalaciones rastreadas de ClawHub en el espacio de trabajo predeterminado del agente.
  - El modo de configuración parchea valores de `skills.entries.<skillKey>` como `enabled`, `apiKey` y `env`.

### Vistas de `models.list`

`models.list` acepta un parámetro opcional `view`:

- Omitido o `"default"`: comportamiento actual en tiempo de ejecución. Si `agents.defaults.models` está configurado, la respuesta es el catálogo permitido; de lo contrario, la respuesta es el catálogo completo del Gateway.
- `"configured"`: comportamiento con tamaño de selector. Si `agents.defaults.models` está configurado, sigue teniendo prioridad. De lo contrario, la respuesta usa entradas explícitas de `models.providers.*.models`, recurriendo al catálogo completo solo cuando no existen filas de modelos configuradas.
- `"all"`: catálogo completo del Gateway, omitiendo `agents.defaults.models`. Úsalo para diagnósticos e interfaces de descubrimiento, no para selectores de modelos normales.

## Aprobaciones de ejecución

- Cuando una solicitud de ejecución necesita aprobación, el gateway emite `exec.approval.requested`.
- Los clientes operadores resuelven llamando a `exec.approval.resolve` (requiere el alcance `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadatos de sesión canónicos). Las solicitudes sin `systemRunPlan` se rechazan.
- Después de la aprobación, las llamadas reenviadas `node.invoke system.run` reutilizan ese `systemRunPlan` canónico como contexto autoritativo de comando/cwd/sesión.
- Si un llamador muta `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` entre la preparación y el reenvío final aprobado de `system.run`, el gateway rechaza la ejecución en lugar de confiar en la carga útil mutada.

## Alternativa de entrega del agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar entrega saliente.
- `bestEffortDeliver=false` mantiene el comportamiento estricto: los destinos de entrega no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite recurrir a ejecución solo de sesión cuando no puede resolverse ninguna ruta entregable externa (por ejemplo, sesiones internas/de webchat o configuraciones multicanal ambiguas).

## Versionado

- `PROTOCOL_VERSION` reside en `src/gateway/protocol/schema/protocol-schemas.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`; el servidor rechaza las incompatibilidades.
- Los esquemas y modelos se generan a partir de definiciones TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes de cliente

El cliente de referencia en `src/gateway/client.ts` usa estos valores predeterminados. Los valores son estables en el protocolo v3 y son la base esperada para clientes de terceros.

| Constante                                 | Predeterminado                                       | Fuente                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`                                                       |
| Tiempo de espera de solicitud (por RPC)   | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                                            |
| Tiempo de espera de preautenticación / desafío de conexión | `15_000` ms                             | `src/gateway/handshake-timeouts.ts` (config/env puede aumentar el presupuesto emparejado servidor/cliente) |
| Retroceso inicial de reconexión           | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                                   |
| Retroceso máximo de reconexión            | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                                           |
| Límite de reintento rápido tras cierre por token de dispositivo | `250` ms                              | `src/gateway/client.ts`                                                                                 |
| Gracia de detención forzada antes de `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                         |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                  | `STOP_AND_WAIT_TIMEOUT_MS`                                                                              |
| Intervalo de tick predeterminado (antes de `hello-ok`) | `30_000` ms                              | `src/gateway/client.ts`                                                                                 |
| Cierre por tiempo de espera de tick       | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                      |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                                       |

El servidor anuncia los valores efectivos de `policy.tickIntervalMs`, `policy.maxPayload` y `policy.maxBufferedBytes` en `hello-ok`; los clientes deben respetar esos valores en lugar de los predeterminados previos al handshake.

## Autenticación

- La autenticación de Gateway con secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el modo de autenticación configurado.
- Los modos con identidad, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o
  `gateway.auth.mode: "trusted-proxy"` sin loopback
  satisfacen la comprobación de autenticación de conexión desde
  encabezados de solicitud en lugar de `connect.params.auth.*`.
- La entrada privada `gateway.auth.mode: "none"` omite por completo la autenticación
  de conexión con secreto compartido; no expongas ese modo en entradas públicas o no confiables.
- Después del emparejamiento, el Gateway emite un **token de dispositivo** limitado al rol
  de conexión + alcances. Se devuelve en `hello-ok.auth.deviceToken` y el cliente debería
  persistirlo para conexiones futuras.
- Los clientes deberían persistir el `hello-ok.auth.deviceToken` principal después de cualquier
  conexión correcta.
- Reconectar con ese token de dispositivo **almacenado** también debería reutilizar el conjunto
  de alcances aprobados almacenado para ese token. Esto conserva el acceso de lectura/sondeo/estado
  que ya se concedió y evita reducir silenciosamente las reconexiones a un
  alcance implícito más estrecho solo de administrador.
- Ensamblado de autenticación de conexión del lado del cliente (`selectConnectAuth` en
  `src/gateway/client.ts`):
  - `auth.password` es ortogonal y siempre se reenvía cuando está configurado.
  - `auth.token` se rellena por orden de prioridad: primero el token compartido explícito,
    luego un `deviceToken` explícito, luego un token por dispositivo almacenado (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` se envía solo cuando ninguno de los anteriores resolvió un
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La promoción automática de un token de dispositivo almacenado en el reintento único por
    `AUTH_TOKEN_MISMATCH` está restringida a **puntos de conexión de confianza solamente**:
    loopback, o `wss://` con un `tlsFingerprint` fijado. Un `wss://` público
    sin fijación no califica.
- Las entradas adicionales de `hello-ok.auth.deviceTokens` son tokens de transferencia de arranque.
  Persístelas solo cuando la conexión haya usado autenticación de arranque en un transporte de confianza
  como `wss://` o emparejamiento por loopback/local.
- Si un cliente proporciona un `deviceToken` **explícito** o `scopes` explícitos, ese
  conjunto de alcances solicitado por el llamador sigue siendo autoritativo; los alcances en caché solo
  se reutilizan cuando el cliente reutiliza el token por dispositivo almacenado.
- Los tokens de dispositivo pueden rotarse/revocarse mediante `device.token.rotate` y
  `device.token.revoke` (requiere el alcance `operator.pairing`).
- `device.token.rotate` devuelve metadatos de rotación. Refleja el token portador de reemplazo
  solo para llamadas del mismo dispositivo que ya están autenticadas con
  ese token de dispositivo, de modo que los clientes solo con token puedan persistir su reemplazo antes de
  reconectar. Las rotaciones compartidas/de administrador no reflejan el token portador.
- La emisión, rotación y revocación de tokens permanecen limitadas al conjunto de roles aprobados
  registrado en la entrada de emparejamiento de ese dispositivo; la mutación de tokens no puede ampliar ni
  apuntar a un rol de dispositivo que la aprobación de emparejamiento nunca concedió.
- Para sesiones de tokens de dispositivos emparejados, la administración de dispositivos tiene alcance propio salvo que el
  llamador también tenga `operator.admin`: los llamadores que no sean administradores pueden eliminar/revocar/rotar
  solo la entrada de su **propio** dispositivo.
- `device.token.rotate` y `device.token.revoke` también comprueban el conjunto de alcances del token de operador
  de destino frente a los alcances de la sesión actual del llamador. Los llamadores que no sean administradores
  no pueden rotar ni revocar un token de operador más amplio que el que ya tienen.
- Los errores de autenticación incluyen `error.details.code` más sugerencias de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes de confianza pueden intentar un reintento acotado con un token por dispositivo en caché.
  - Si ese reintento falla, los clientes deberían detener los bucles de reconexión automática y mostrar orientación de acción para el operador.

## Identidad del dispositivo + emparejamiento

- Los nodos deberían incluir una identidad de dispositivo estable (`device.id`) derivada de una
  huella digital de par de claves.
- Los Gateways emiten tokens por dispositivo + rol.
- Se requieren aprobaciones de emparejamiento para los nuevos ID de dispositivo, salvo que la aprobación automática local
  esté habilitada.
- La aprobación automática de emparejamiento se centra en conexiones directas por local loopback.
- OpenClaw también tiene una ruta estrecha de autoconexión local al backend/contenedor para
  flujos auxiliares de confianza con secreto compartido.
- Las conexiones de la misma máquina por tailnet o LAN siguen tratándose como remotas para el emparejamiento y
  requieren aprobación.
- Los clientes WS normalmente incluyen identidad de `device` durante `connect` (operador +
  nodo). Las únicas excepciones de operador sin dispositivo son rutas de confianza explícitas:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad HTTP insegura solo en localhost.
  - autenticación correcta de operador en la interfaz de control con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (emergencia, degradación de seguridad grave).
  - RPCs de backend directos por loopback de `gateway-client` autenticados con el token/contraseña compartidos del
    Gateway.
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de autenticación de dispositivos

Para clientes heredados que aún usan el comportamiento de firma anterior al desafío, `connect` ahora devuelve
códigos de detalle `DEVICE_AUTH_*` en `error.details.code` con un `error.details.reason` estable.

Errores comunes de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió en blanco). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto/incorrecto. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga útil de firma no coincide con la carga útil v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella digital de la clave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falló el formato/canonicalización de la clave pública. |

Objetivo de migración:

- Espera siempre `connect.challenge`.
- Firma la carga útil v2 que incluye el nonce del servidor.
- Envía el mismo nonce en `connect.params.device.nonce`.
- La carga útil de firma preferida es `v3`, que vincula `platform` y `deviceFamily`
  además de los campos de dispositivo/cliente/rol/alcances/token/nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero la fijación de
  metadatos de dispositivos emparejados sigue controlando la política de comandos al reconectar.

## TLS + fijación

- TLS es compatible con conexiones WS.
- Los clientes pueden fijar opcionalmente la huella digital del certificado del gateway (consulta la configuración
  `gateway.tls` más `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Alcance

Este protocolo expone la **API completa del gateway** (estado, canales, modelos, chat,
agente, sesiones, nodos, aprobaciones, etc.). La superficie exacta está definida por los
esquemas TypeBox en `src/gateway/protocol/schema.ts`.

## Relacionado

- [Protocolo de puente](/es/gateway/bridge-protocol)
- [Guía operativa del Gateway](/es/gateway)
