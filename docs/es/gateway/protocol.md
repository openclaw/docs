---
read_when:
    - Implementar o actualizar clientes WS del Gateway
    - Depurar incompatibilidades de protocolo o fallos de conexión
    - Regenerar esquema/modelos del protocolo
summary: 'Protocolo WebSocket del Gateway: handshake, tramas, versionado'
title: Protocolo del Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01f873c7051f2a462cbefb50331e04edfdcedadeda8b3d7b7320ceb2462edccc
    source_path: gateway/protocol.md
    workflow: 15
---

El protocolo WS del Gateway es el **único plano de control + transporte de nodos** para
OpenClaw. Todos los clientes (CLI, UI web, app de macOS, nodos iOS/Android, nodos headless)
se conectan mediante WebSocket y declaran su **rol** + **alcance** en el momento
del handshake.

## Transporte

- WebSocket, tramas de texto con cargas útiles JSON.
- La primera trama **debe** ser una solicitud `connect`.
- Las tramas previas a la conexión están limitadas a 64 KiB. Después de un handshake correcto, los clientes
  deben seguir los límites `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con diagnósticos habilitados,
  las tramas entrantes sobredimensionadas y los buffers salientes lentos emiten eventos `payload.large`
  antes de que el gateway cierre o descarte la trama afectada. Estos eventos conservan
  tamaños, límites, superficies y códigos de motivo seguros. No conservan el cuerpo del mensaje,
  el contenido de los adjuntos, el cuerpo bruto de la trama, tokens, cookies ni valores secretos.

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

`server`, `features`, `snapshot` y `policy` son todos obligatorios según el esquema
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` es opcional. `auth`
informa del rol/alcances negociados cuando están disponibles, e incluye `deviceToken`
cuando el gateway emite uno.

Cuando no se emite ningún token de dispositivo, `hello-ok.auth` aún puede informar de los
permisos negociados:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Los clientes backend de confianza en el mismo proceso (`client.id: "gateway-client"`,
`client.mode: "backend"`) pueden omitir `device` en conexiones directas loopback cuando
se autentican con el token/contraseña compartido del gateway. Esta ruta está reservada
para RPC internas del plano de control y evita que valores base obsoletos de emparejamiento CLI/dispositivo
bloqueen trabajo backend local como actualizaciones de sesión de subagentes. Clientes remotos,
clientes de origen navegador, clientes nodo y clientes explícitos de token de dispositivo/identidad de dispositivo
siguen usando las comprobaciones normales de emparejamiento y ampliación de alcance.

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

Durante la transferencia bootstrap de confianza, `hello-ok.auth` también puede incluir
entradas adicionales de rol limitado en `deviceTokens`:

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

Para el flujo bootstrap integrado de node/operator, el token primario del Node
permanece en `scopes: []` y cualquier token de operador transferido permanece limitado
a la lista bootstrap de permitidos del operador (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Las comprobaciones de alcance bootstrap siguen
teniendo prefijo de rol: las entradas de operador solo satisfacen solicitudes de operador, y los roles que no son de operador
siguen necesitando alcances bajo su propio prefijo de rol.

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

## Estructura de tramas

- **Solicitud**: `{type:"req", id, method, params}`
- **Respuesta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

Los métodos con efectos secundarios requieren **claves de idempotencia** (consulta el esquema).

## Roles + alcances

### Roles

- `operator` = cliente del plano de control (CLI/UI/automatización).
- `node` = host de capacidades (camera/screen/canvas/system.run).

### Alcances (operator)

Alcances habituales:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` requiere `operator.talk.secrets`
(o `operator.admin`).

Los métodos RPC del gateway registrados por Plugin pueden solicitar su propio alcance de operador, pero
los prefijos de administración básicos reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre se resuelven como `operator.admin`.

El alcance del método es solo el primer control. Algunos slash commands alcanzados mediante
`chat.send` aplican comprobaciones de nivel de comando más estrictas además de eso. Por ejemplo, las escrituras persistentes
`/config set` y `/config unset` requieren `operator.admin`.

`node.pair.approve` también tiene una comprobación adicional de alcance en el momento de aprobación además del
alcance base del método:

- solicitudes sin comando: `operator.pairing`
- solicitudes con comandos de node que no son exec: `operator.pairing` + `operator.write`
- solicitudes que incluyen `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Los Nodes declaran reclamaciones de capacidad en el momento de conexión:

- `caps`: categorías de capacidad de alto nivel.
- `commands`: lista de permitidos de comandos para invoke.
- `permissions`: alternancias granulares (p. ej. `screen.record`, `camera.capture`).

El Gateway trata esto como **reclamaciones** y aplica listas de permitidos del lado del servidor.

## Presencia

- `system-presence` devuelve entradas indexadas por identidad de dispositivo.
- Las entradas de presencia incluyen `deviceId`, `roles` y `scopes` para que las UIs puedan mostrar una sola fila por dispositivo
  incluso cuando se conecta como **operator** y como **node**.

## Delimitación de alcance de eventos de broadcast

Los eventos de broadcast WebSocket enviados por el servidor están protegidos por alcance para que las sesiones con alcance de emparejamiento o solo de node no reciban pasivamente contenido de sesión.

- Las **tramas de chat, agente y resultado de herramienta** (incluidos los eventos `agent` en streaming y los resultados de llamadas a herramientas) requieren al menos `operator.read`. Las sesiones sin `operator.read` omiten estas tramas por completo.
- Los **broadcasts `plugin.*` definidos por Plugin** están protegidos con `operator.write` o `operator.admin`, según cómo los haya registrado el plugin.
- Los **eventos de estado y transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de connect/disconnect, etc.) siguen sin restricciones para que la salud del transporte siga siendo observable para toda sesión autenticada.
- Las **familias de eventos de broadcast desconocidas** están protegidas por alcance de forma predeterminada (fallo cerrado) a menos que un manejador registrado las relaje explícitamente.

Cada conexión cliente mantiene su propio número de secuencia por cliente para que los broadcasts conserven el orden monótono en ese socket incluso cuando distintos clientes ven subconjuntos distintos del flujo de eventos filtrados por alcance.

## Familias habituales de métodos RPC

La superficie WS pública es más amplia que los ejemplos de handshake/autenticación anteriores. Esto
no es un volcado generado: `hello-ok.features.methods` es una lista de descubrimiento conservadora
construida a partir de `src/gateway/server-methods-list.ts` más las exportaciones de métodos de plugin/canal cargadas. Trátala como descubrimiento de funciones, no como enumeración completa de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidad">
    - `health` devuelve la instantánea de salud del gateway en caché o recién sondeada.
    - `diagnostics.stability` devuelve el registrador reciente y acotado de estabilidad diagnóstica. Conserva metadata operativa como nombres de eventos, conteos, tamaños en bytes, lecturas de memoria, estado de cola/sesión, nombres de canal/plugin e ids de sesión. No conserva texto de chat, cuerpos de Webhook, salidas de herramientas, cuerpos brutos de solicitud o respuesta, tokens, cookies ni valores secretos. Requiere alcance operator read.
    - `status` devuelve el resumen del gateway estilo `/status`; los campos sensibles se incluyen solo para clientes operator con alcance de administrador.
    - `gateway.identity.get` devuelve la identidad de dispositivo del gateway usada por los flujos de relay y emparejamiento.
    - `system-presence` devuelve la instantánea actual de presencia para dispositivos operator/node conectados.
    - `system-event` agrega un evento del sistema y puede actualizar/difundir el contexto de presencia.
    - `last-heartbeat` devuelve el último evento Heartbeat persistido.
    - `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el gateway.

  </Accordion>

  <Accordion title="Modelos y uso">
    - `models.list` devuelve el catálogo de modelos permitido en tiempo de ejecución.
    - `usage.status` devuelve resúmenes de ventanas de uso/cuota restante por proveedor.
    - `usage.cost` devuelve resúmenes agregados de coste para un intervalo de fechas.
    - `doctor.memory.status` devuelve el estado de preparación de memoria vectorial / embeddings para el espacio de trabajo activo del agente predeterminado.
    - `sessions.usage` devuelve resúmenes de uso por sesión.
    - `sessions.usage.timeseries` devuelve series temporales de uso para una sesión.
    - `sessions.usage.logs` devuelve entradas de log de uso para una sesión.

  </Accordion>

  <Accordion title="Canales y helpers de inicio de sesión">
    - `channels.status` devuelve resúmenes de estado de canales/plugins integrados + incluidos.
    - `channels.logout` cierra la sesión de un canal/cuenta específico cuando el canal admite cierre de sesión.
    - `web.login.start` inicia un flujo de inicio de sesión por QR/web para el proveedor de canal web actual compatible con QR.
    - `web.login.wait` espera a que ese flujo de inicio de sesión por QR/web se complete e inicia el canal si tiene éxito.
    - `push.test` envía una notificación push de prueba APNs a un node iOS registrado.
    - `voicewake.get` devuelve los disparadores de palabra de activación almacenados.
    - `voicewake.set` actualiza los disparadores de palabra de activación y difunde el cambio.

  </Accordion>

  <Accordion title="Mensajería y logs">
    - `send` es el RPC de entrega saliente directa para envíos dirigidos a canal/cuenta/hilo fuera del runner de chat.
    - `logs.tail` devuelve la cola configurada del log de archivos del gateway con controles de cursor/límite y bytes máximos.

  </Accordion>

  <Accordion title="Talk y TTS">
    - `talk.config` devuelve la carga útil de configuración Talk efectiva; `includeSecrets` requiere `operator.talk.secrets` (u `operator.admin`).
    - `talk.mode` establece/difunde el estado actual del modo Talk para clientes WebChat/Control UI.
    - `talk.speak` sintetiza voz mediante el proveedor de voz Talk activo.
    - `tts.status` devuelve el estado habilitado de TTS, el proveedor activo, los proveedores de fallback y el estado de configuración del proveedor.
    - `tts.providers` devuelve el inventario visible de proveedores TTS.
    - `tts.enable` y `tts.disable` activan o desactivan el estado de preferencias de TTS.
    - `tts.setProvider` actualiza el proveedor TTS preferido.
    - `tts.convert` ejecuta una conversión puntual de texto a voz.

  </Accordion>

  <Accordion title="Secrets, config, actualización y asistente">
    - `secrets.reload` vuelve a resolver los SecretRef activos e intercambia el estado secreto de runtime solo si todo tiene éxito.
    - `secrets.resolve` resuelve asignaciones de secretos orientadas a comandos para un conjunto específico de comando/destino.
    - `config.get` devuelve la instantánea actual de configuración y su hash.
    - `config.set` escribe una carga útil de configuración validada.
    - `config.patch` fusiona una actualización parcial de configuración.
    - `config.apply` valida + reemplaza toda la carga útil de configuración.
    - `config.schema` devuelve la carga útil del esquema de configuración activo usada por Control UI y herramientas de CLI: esquema, `uiHints`, versión y metadata de generación, incluida la metadata de esquema de Plugin + canal cuando el runtime puede cargarla. El esquema incluye metadata de campos `title` / `description` derivada de las mismas etiquetas y textos de ayuda usados por la UI, incluidas ramas de composición de objetos anidados, comodines, elementos de array y `anyOf` / `oneOf` / `allOf` cuando existe documentación de campo coincidente.
    - `config.schema.lookup` devuelve una carga útil de búsqueda limitada a una ruta para una ruta de configuración: ruta normalizada, nodo superficial del esquema, pista coincidente + `hintPath`, y resúmenes inmediatos de hijos para navegación detallada en UI/CLI. Los nodos de esquema de búsqueda conservan la documentación orientada al usuario y campos comunes de validación (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos/de string/de array/de objeto y banderas como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de hijos exponen `key`, `path` normalizada, `type`, `required`, `hasChildren`, además de `hint` / `hintPath` coincidentes.
    - `update.run` ejecuta el flujo de actualización del gateway y programa un reinicio solo cuando la propia actualización ha tenido éxito.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de incorporación mediante WS RPC.

  </Accordion>

  <Accordion title="Helpers de agente y espacio de trabajo">
    - `agents.list` devuelve las entradas de agente configuradas.
    - `agents.create`, `agents.update` y `agents.delete` gestionan registros de agentes y conexión del espacio de trabajo.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` gestionan los archivos bootstrap del espacio de trabajo expuestos para un agente.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o sesión.
    - `agent.wait` espera a que termine una ejecución y devuelve la instantánea terminal cuando está disponible.

  </Accordion>

  <Accordion title="Control de sesiones">
    - `sessions.list` devuelve el índice actual de sesiones.
    - `sessions.subscribe` y `sessions.unsubscribe` activan o desactivan suscripciones a eventos de cambio de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` activan o desactivan suscripciones a eventos de transcripción/mensajes para una sesión.
    - `sessions.preview` devuelve vistas previas acotadas de transcripciones para claves de sesión específicas.
    - `sessions.resolve` resuelve o canoniza un destino de sesión.
    - `sessions.create` crea una nueva entrada de sesión.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrumpir y guiar para una sesión activa.
    - `sessions.abort` aborta el trabajo activo de una sesión.
    - `sessions.patch` actualiza metadata/anulaciones de sesión.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan mantenimiento de sesiones.
    - `sessions.get` devuelve la fila completa almacenada de la sesión.
    - La ejecución de chat sigue usando `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` está normalizado para visualización en clientes UI: las etiquetas de directiva en línea se eliminan del texto visible, las cargas útiles XML de llamadas a herramientas en texto plano (incluyendo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamada a herramientas) y los tokens de control del modelo filtrados en ASCII/ancho completo se eliminan, las filas de asistente compuestas solo por tokens silenciosos puros como `NO_REPLY` / `no_reply` exactos se omiten, y las filas sobredimensionadas pueden reemplazarse por marcadores.

  </Accordion>

  <Accordion title="Emparejamiento de dispositivos y tokens de dispositivo">
    - `device.pair.list` devuelve dispositivos emparejados pendientes y aprobados.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` gestionan registros de emparejamiento de dispositivos.
    - `device.token.rotate` rota un token de dispositivo emparejado dentro de su rol aprobado y de los límites de alcance del emisor.
    - `device.token.revoke` revoca un token de dispositivo emparejado dentro de su rol aprobado y de los límites de alcance del emisor.

  </Accordion>

  <Accordion title="Emparejamiento de Node, invoke y trabajo pendiente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` y `node.pair.verify` cubren el emparejamiento de Node y la verificación bootstrap.
    - `node.list` y `node.describe` devuelven el estado de Nodes conocidos/conectados.
    - `node.rename` actualiza la etiqueta de un Node emparejado.
    - `node.invoke` reenvía un comando a un Node conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud invoke.
    - `node.event` transporta eventos originados por Node de vuelta al gateway.
    - `node.canvas.capability.refresh` actualiza tokens de capacidad de canvas limitados por alcance.
    - `node.pending.pull` y `node.pending.ack` son las APIs de cola para Nodes conectados.
    - `node.pending.enqueue` y `node.pending.drain` gestionan trabajo pendiente duradero para Nodes desconectados o sin conexión.

  </Accordion>

  <Accordion title="Familias de aprobaciones">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` cubren solicitudes puntuales de aprobación de exec más búsqueda/repetición de aprobaciones pendientes.
    - `exec.approval.waitDecision` espera una aprobación pendiente de exec y devuelve la decisión final (o `null` por timeout).
    - `exec.approvals.get` y `exec.approvals.set` gestionan instantáneas de política de aprobación de exec del gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` gestionan la política local de aprobación de exec del node mediante comandos de relay del node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` cubren flujos de aprobación definidos por Plugin.

  </Accordion>

  <Accordion title="Automatización, Skills y herramientas">
    - Automatización: `wake` programa una inyección inmediata o en el siguiente Heartbeat de texto de activación; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestionan trabajo programado.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Familias habituales de eventos

- `chat`: actualizaciones de chat de la UI como `chat.inject` y otros eventos de chat solo de transcripción.
- `session.message` y `session.tool`: actualizaciones de transcripción/flujo de eventos para una sesión suscrita.
- `sessions.changed`: cambió el índice de sesiones o la metadata.
- `presence`: actualizaciones de instantánea de presencia del sistema.
- `tick`: evento periódico de keepalive / liveness.
- `health`: actualización de instantánea de salud del gateway.
- `heartbeat`: actualización del flujo de eventos de Heartbeat.
- `cron`: evento de cambio de ejecución/trabajo de cron.
- `shutdown`: notificación de apagado del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida del emparejamiento de Node.
- `node.invoke.request`: broadcast de solicitud invoke de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida del dispositivo emparejado.
- `voicewake.changed`: cambió la configuración de disparadores de palabra de activación.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprobación de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprobación de Plugin.

### Métodos helper de Node

- Los Nodes pueden llamar a `skills.bins` para obtener la lista actual de ejecutables de Skills
  para comprobaciones de permiso automático.

### Métodos helper de operator

- Los operators pueden llamar a `commands.list` (`operator.read`) para obtener el inventario
  de comandos de runtime de un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - `scope` controla qué superficie apunta el `name` principal:
    - `text` devuelve el token principal de comando de texto sin la `/` inicial
    - `native` y la ruta predeterminada `both` devuelven nombres nativos dependientes del proveedor
      cuando están disponibles
  - `textAliases` contiene alias exactos con barra como `/model` y `/m`.
  - `nativeName` contiene el nombre nativo dependiente del proveedor cuando existe.
  - `provider` es opcional y solo afecta el nombre nativo y la disponibilidad de comandos nativos del plugin.
  - `includeArgs=false` omite metadata serializada de argumentos de la respuesta.
- Los operators pueden llamar a `tools.catalog` (`operator.read`) para obtener el catálogo de herramientas en runtime para un
  agente. La respuesta incluye herramientas agrupadas y metadata de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: propietario del plugin cuando `source="plugin"`
  - `optional`: si una herramienta de plugin es opcional
- Los operators pueden llamar a `tools.effective` (`operator.read`) para obtener el inventario
  efectivo de herramientas en runtime para una sesión.
  - `sessionKey` es obligatorio.
  - El gateway deriva el contexto de runtime fiable del lado del servidor a partir de la sesión en lugar de aceptar
    autenticación o contexto de entrega proporcionados por el emisor.
  - La respuesta está limitada a la sesión y refleja lo que la conversación activa puede usar ahora mismo,
    incluidas herramientas básicas, de plugin y de canal.
- Los operators pueden llamar a `skills.status` (`operator.read`) para obtener el inventario visible
  de Skills de un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - La respuesta incluye elegibilidad, requisitos faltantes, comprobaciones de configuración y
    opciones de instalación saneadas sin exponer valores secretos sin procesar.
- Los operators pueden llamar a `skills.search` y `skills.detail` (`operator.read`) para
  metadata de descubrimiento de ClawHub.
- Los operators pueden llamar a `skills.install` (`operator.admin`) en dos modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una
    carpeta de skill en el directorio `skills/` del espacio de trabajo del agente predeterminado.
  - Modo instalador del Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    ejecuta una acción declarada `metadata.openclaw.install` en el host del gateway.
- Los operators pueden llamar a `skills.update` (`operator.admin`) en dos modos:
  - El modo ClawHub actualiza un slug seguido o todas las instalaciones de ClawHub seguidas en
    el espacio de trabajo del agente predeterminado.
  - El modo config aplica parches a valores `skills.entries.<skillKey>` como `enabled`,
    `apiKey` y `env`.

## Aprobaciones de exec

- Cuando una solicitud exec necesita aprobación, el gateway difunde `exec.approval.requested`.
- Los clientes operator resuelven llamando a `exec.approval.resolve` (requiere el alcance `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata de sesión canónicos). Las solicitudes sin `systemRunPlan` se rechazan.
- Después de la aprobación, las llamadas reenviadas `node.invoke system.run` reutilizan ese
  `systemRunPlan` canónico como contexto autoritativo de comando/cwd/sesión.
- Si un emisor modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` entre prepare y el reenvío final aprobado de `system.run`, el
  gateway rechaza la ejecución en lugar de confiar en la carga útil modificada.

## Fallback de entrega de agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar entrega saliente.
- `bestEffortDeliver=false` mantiene el comportamiento estricto: los destinos de entrega no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback a ejecución solo de sesión cuando no se puede resolver ninguna ruta externa entregable (por ejemplo sesiones internas/webchat o configuraciones multicanal ambiguas).

## Versionado

- `PROTOCOL_VERSION` vive en `src/gateway/protocol/schema/protocol-schemas.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`; el servidor rechaza incompatibilidades.
- Los esquemas + modelos se generan a partir de definiciones TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes de cliente

El cliente de referencia en `src/gateway/client.ts` usa estos valores predeterminados. Los valores son
estables en todo el protocolo v3 y son la base esperada para clientes de terceros.

| Constante                                  | Predeterminado                                        | Origen                                                     |
| ------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                         | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Tiempo de espera de solicitud (por RPC)    | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Tiempo de espera de preauth / connect-challenge | `10_000` ms                                       | `src/gateway/handshake-timeouts.ts` (límite `250`–`10_000`) |
| Backoff inicial de reconexión              | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff máximo de reconexión               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Límite de reintento rápido tras cierre por device-token | `250` ms                                    | `src/gateway/client.ts`                                    |
| Gracia de parada forzada antes de `terminate()` | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                     | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalo tick predeterminado (antes de `hello-ok`) | `30_000` ms                                    | `src/gateway/client.ts`                                    |
| Cierre por timeout de tick                 | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                            |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

El servidor anuncia los valores efectivos `policy.tickIntervalMs`, `policy.maxPayload`
y `policy.maxBufferedBytes` en `hello-ok`; los clientes deben respetar esos valores
en lugar de los valores predeterminados anteriores al handshake.

## Autenticación

- La autenticación del gateway con secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el modo de autenticación configurado.
- Los modos con identidad, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o
  `gateway.auth.mode: "trusted-proxy"` fuera de loopback, satisfacen la comprobación de autenticación de connect desde
  los encabezados de la solicitud en lugar de `connect.params.auth.*`.
- El ingreso privado con `gateway.auth.mode: "none"` omite por completo la autenticación de connect con secreto compartido;
  no expongas ese modo en ingreso público o no confiable.
- Después del emparejamiento, el Gateway emite un **device token** limitado al
  rol + alcances de la conexión. Se devuelve en `hello-ok.auth.deviceToken` y el
  cliente debe conservarlo para futuras conexiones.
- Los clientes deben conservar el `hello-ok.auth.deviceToken` principal después de cualquier
  conexión correcta.
- Al reconectar con ese **device token almacenado**, también debe reutilizarse el conjunto de alcances aprobados almacenado
  para ese token. Esto preserva el acceso de lectura/sondeo/estado que ya se había concedido y evita reducir silenciosamente las reconexiones a un
  alcance implícito más estrecho solo de administrador.
- Ensamblado de autenticación de connect en el lado del cliente (`selectConnectAuth` en
  `src/gateway/client.ts`):
  - `auth.password` es ortogonal y siempre se reenvía cuando está configurado.
  - `auth.token` se rellena por orden de prioridad: primero el token compartido explícito,
    luego un `deviceToken` explícito y después un token almacenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` se envía solo cuando ninguna de las opciones anteriores resolvió un
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La promoción automática de un token de dispositivo almacenado en el reintento puntual
    `AUTH_TOKEN_MISMATCH` está limitada a **endpoints de confianza**:
    loopback, o `wss://` con `tlsFingerprint` fijado. `wss://` público
    sin fijación no cumple este criterio.
- Las entradas adicionales `hello-ok.auth.deviceTokens` son tokens de transferencia bootstrap.
  Consérvalas solo cuando la conexión usó autenticación bootstrap en un transporte de confianza
  como `wss://` o loopback/emparejamiento local.
- Si un cliente proporciona un `deviceToken` **explícito** o `scopes` explícitos, ese
  conjunto de alcances solicitado por el emisor sigue siendo autoritativo; los alcances en caché solo
  se reutilizan cuando el cliente está reutilizando el token almacenado por dispositivo.
- Los device tokens pueden rotarse/revocarse mediante `device.token.rotate` y
  `device.token.revoke` (requiere alcance `operator.pairing`).
- La emisión, rotación y revocación de tokens siguen limitadas al conjunto de roles aprobados
  registrado en la entrada de emparejamiento de ese dispositivo; la mutación de tokens no puede ampliar ni
  dirigirse a un rol de dispositivo que la aprobación de emparejamiento nunca concedió.
- Para sesiones de token de dispositivo emparejado, la gestión del dispositivo está limitada al propio ámbito salvo que el
  emisor también tenga `operator.admin`: los emisores sin admin solo pueden eliminar/revocar/rotar
  su **propia** entrada de dispositivo.
- `device.token.rotate` y `device.token.revoke` también comprueban el conjunto de alcances del token operator de destino
  frente a los alcances de la sesión actual del emisor. Los emisores sin admin
  no pueden rotar ni revocar un token operator más amplio que el que ya poseen.
- Los fallos de autenticación incluyen `error.details.code` más sugerencias de recuperación:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes de confianza pueden intentar un reintento limitado con un token por dispositivo en caché.
  - Si ese reintento falla, los clientes deben detener los bucles automáticos de reconexión y mostrar instrucciones para acción del operador.

## Identidad de dispositivo + emparejamiento

- Los Nodes deben incluir una identidad de dispositivo estable (`device.id`) derivada de la
  huella digital de un par de claves.
- Los Gateways emiten tokens por dispositivo + rol.
- Se requieren aprobaciones de emparejamiento para nuevos IDs de dispositivo salvo que la aprobación automática local
  esté habilitada.
- La aprobación automática de emparejamiento se centra en conexiones directas loopback locales.
- OpenClaw también tiene una ruta estrecha de autoconexión backend/local al contenedor para
  flujos helper de confianza con secreto compartido.
- Las conexiones por tailnet o LAN en el mismo host siguen tratándose como remotas para el emparejamiento y
  requieren aprobación.
- Los clientes WS normalmente incluyen identidad `device` durante `connect` (operator +
  node). Las únicas excepciones operator sin dispositivo son rutas de confianza explícitas:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad localhost-only con HTTP inseguro.
  - autenticación correcta de operator en Control UI con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (uso extremo, degradación grave de seguridad).
  - RPC backend `gateway-client` de loopback directo autenticadas con el
    token/contraseña compartido del gateway.
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de autenticación de dispositivo

Para clientes heredados que aún usan el comportamiento de firma anterior al desafío, `connect` ahora devuelve
códigos de detalle `DEVICE_AUTH_*` bajo `error.details.code` con un `error.details.reason` estable.

Fallos habituales de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió vacío). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto/incorrecto. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga útil de la firma no coincide con la carga v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella digital de la clave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falló el formato/canonización de la clave pública. |

Objetivo de migración:

- Espera siempre a `connect.challenge`.
- Firma la carga útil v2 que incluye el nonce del servidor.
- Envía ese mismo nonce en `connect.params.device.nonce`.
- La carga útil de firma preferida es `v3`, que vincula `platform` y `deviceFamily`
  además de los campos de dispositivo/cliente/rol/alcances/token/nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero el anclaje de metadata
  del dispositivo emparejado sigue controlando la política de comandos en reconexión.

## TLS + fijación

- TLS es compatible con conexiones WS.
- Los clientes pueden fijar opcionalmente la huella digital del certificado del gateway (consulta la configuración `gateway.tls`
  más `gateway.remote.tlsFingerprint` o el CLI `--tls-fingerprint`).

## Alcance

Este protocolo expone la **API completa del gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals, etc.). La superficie exacta está definida por los
esquemas TypeBox en `src/gateway/protocol/schema.ts`.

## Relacionado

- [Protocolo Bridge](/es/gateway/bridge-protocol)
- [Runbook del Gateway](/es/gateway)
