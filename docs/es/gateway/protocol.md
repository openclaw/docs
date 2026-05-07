---
read_when:
    - Implementación o actualización de clientes WS de Gateway
    - Depuración de incompatibilidades de protocolo o fallos de conexión
    - Regenerando el esquema y los modelos del protocolo
summary: 'Protocolo WebSocket de Gateway: negociación inicial, tramas, versionado'
title: Protocolo de Gateway
x-i18n:
    generated_at: "2026-05-07T13:17:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

El protocolo WS del Gateway es el **plano de control único + transporte de nodos** para
OpenClaw. Todos los clientes (CLI, IU web, app de macOS, nodos iOS/Android, nodos
sin interfaz) se conectan por WebSocket y declaran su **rol** + **ámbito** en el
momento de la negociación.

## Transporte

- WebSocket, tramas de texto con cargas JSON.
- La primera trama **debe** ser una solicitud `connect`.
- Las tramas previas a la conexión tienen un límite de 64 KiB. Después de una negociación correcta, los clientes
  deben seguir los límites `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con los diagnósticos activados,
  las tramas entrantes demasiado grandes y los búferes salientes lentos emiten eventos `payload.large`
  antes de que el gateway cierre o descarte la trama afectada. Estos eventos conservan
  tamaños, límites, superficies y códigos de motivo seguros. No conservan el cuerpo del mensaje,
  contenidos adjuntos, cuerpo de trama sin procesar, tokens, cookies ni valores secretos.

## Negociación (connect)

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
    "minProtocol": 4,
    "maxProtocol": 4,
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
    "protocol": 4,
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

Mientras el Gateway aún termina de iniciar los procesos auxiliares de arranque, la solicitud `connect` puede
devolver un error reintentable `UNAVAILABLE` con `details.reason` establecido en
`"startup-sidecars"` y `retryAfterMs`. Los clientes deben reintentar esa respuesta
dentro de su presupuesto general de conexión en lugar de presentarla como un fallo terminal
de negociación.

`server`, `features`, `snapshot` y `policy` son todos obligatorios según el esquema
(`src/gateway/protocol/schema/frames.ts`). `auth` también es obligatorio e informa
el rol/los ámbitos negociados. `pluginSurfaceUrls` es opcional y asigna nombres de superficies
de plugins, como `canvas`, a URL alojadas con ámbito.

Las URL de superficies de plugins con ámbito pueden expirar. Los nodos pueden llamar a
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` para recibir una entrada nueva
en `pluginSurfaceUrls`. La refactorización experimental del plugin Canvas no
admite la ruta de compatibilidad obsoleta `canvasHostUrl`, `canvasCapability` ni
`node.canvas.capability.refresh`; los clientes nativos y gateways actuales deben usar superficies de plugins.

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

Los clientes backend de confianza en el mismo proceso (`client.id: "gateway-client"`,
`client.mode: "backend"`) pueden omitir `device` en conexiones directas de local loopback cuando
se autentican con el token/contraseña compartidos del gateway. Esta ruta está reservada
para RPC internos del plano de control y evita que las líneas base obsoletas de emparejamiento CLI/dispositivo
bloqueen trabajo backend local como actualizaciones de sesiones de subagentes. Los clientes remotos,
clientes con origen en navegador, clientes de nodo y clientes explícitos con token de dispositivo/identidad de dispositivo
siguen usando las comprobaciones normales de emparejamiento y mejora de ámbitos.

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

Durante la entrega de arranque de confianza, `hello-ok.auth` también puede incluir entradas
de rol limitadas adicionales en `deviceTokens`:

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

Para el flujo de arranque integrado de nodo/operador, el token de nodo principal permanece con
`scopes: []` y cualquier token de operador entregado permanece limitado a la lista de permitidos del operador
de arranque (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Las comprobaciones de ámbito de arranque permanecen
prefijadas por rol: las entradas de operador solo satisfacen solicitudes de operador, y los roles
no operadores siguen necesitando ámbitos bajo su propio prefijo de rol.

### Ejemplo de Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
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

Para ver el modelo completo de ámbitos de operador, las comprobaciones en tiempo de aprobación
y la semántica de secretos compartidos, consulta [Ámbitos de operador](/es/gateway/operator-scopes).

### Roles

- `operator` = cliente del plano de control (CLI/IU/automatización).
- `node` = host de capacidades (cámara/pantalla/canvas/system.run).

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
los prefijos reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre se resuelven a `operator.admin`.

El ámbito de método es solo la primera barrera. Algunos comandos con barra a los que se llega mediante
`chat.send` aplican comprobaciones más estrictas a nivel de comando encima. Por ejemplo, las escrituras persistentes
`/config set` y `/config unset` requieren `operator.admin`.

`node.pair.approve` también tiene una comprobación adicional de ámbito en tiempo de aprobación además del
ámbito base del método:

- solicitudes sin comando: `operator.pairing`
- solicitudes con comandos de nodo no exec: `operator.pairing` + `operator.write`
- solicitudes que incluyen `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacidades/comandos/permisos (nodo)

Los nodos declaran afirmaciones de capacidad en el momento de la conexión:

- `caps`: categorías de capacidad de alto nivel como `camera`, `canvas`, `screen`,
  `location`, `voice` y `talk`.
- `commands`: lista de permitidos de comandos para invocación.
- `permissions`: interruptores granulares (por ejemplo, `screen.record`, `camera.capture`).

El Gateway trata esto como **afirmaciones** y aplica listas de permitidos del lado del servidor.

## Presencia

- `system-presence` devuelve entradas indexadas por identidad de dispositivo.
- Las entradas de presencia incluyen `deviceId`, `roles` y `scopes` para que las IU puedan mostrar una sola fila por dispositivo
  incluso cuando se conecta como **operador** y **nodo**.
- `node.list` incluye campos opcionales `lastSeenAtMs` y `lastSeenReason`. Los nodos conectados informan
  su hora de conexión actual como `lastSeenAtMs` con motivo `connect`; los nodos emparejados también pueden informar
  presencia en segundo plano duradera cuando un evento de nodo de confianza actualiza sus metadatos de emparejamiento.

### Evento alive en segundo plano de Node

Los nodos pueden llamar a `node.event` con `event: "node.presence.alive"` para registrar que un nodo emparejado estuvo
activo durante una reactivación en segundo plano sin marcarlo como conectado.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` es una enumeración cerrada: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Las cadenas de activador desconocidas se normalizan a
`background` por el gateway antes de la persistencia. El evento solo es duradero para sesiones de dispositivo de nodo
autenticadas; las sesiones sin dispositivo o sin emparejar devuelven `handled: false`.

Los gateways correctos devuelven un resultado estructurado:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Los gateways más antiguos aún pueden devolver `{ "ok": true }` para `node.event`; los clientes deben tratarlo como una
confirmación de RPC, no como persistencia de presencia duradera.

## Ámbito de eventos de difusión

Los eventos de difusión WebSocket enviados por el servidor están protegidos por ámbitos para que las sesiones con ámbito de emparejamiento o solo de nodo no reciban pasivamente contenido de sesión.

- **Tramas de chat, agente y resultados de herramientas** (incluidos eventos `agent` transmitidos y resultados de llamadas de herramientas) requieren al menos `operator.read`. Las sesiones sin `operator.read` omiten estas tramas por completo.
- **Difusiones `plugin.*` definidas por plugins** están protegidas por `operator.write` u `operator.admin`, según cómo las haya registrado el plugin.
- **Eventos de estado y transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexión/desconexión, etc.) permanecen sin restricciones para que la salud del transporte siga siendo observable para cada sesión autenticada.
- **Familias de eventos de difusión desconocidas** están protegidas por ámbitos de forma predeterminada (fallo cerrado), salvo que un manejador registrado las relaje explícitamente.

Cada conexión de cliente mantiene su propio número de secuencia por cliente para que las difusiones conserven un orden monotónico en ese socket incluso cuando distintos clientes ven distintos subconjuntos filtrados por ámbito del flujo de eventos.

## Familias comunes de métodos RPC

La superficie WS pública es más amplia que los ejemplos de negociación/autenticación anteriores. Esta
no es una descarga generada: `hello-ok.features.methods` es una lista de descubrimiento
conservadora construida a partir de `src/gateway/server-methods-list.ts` más las exportaciones de métodos de
plugin/canal cargadas. Trátala como descubrimiento de funciones, no como una enumeración completa
de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidad">
    - `health` devuelve la instantánea de salud del gateway en caché o sondeada recientemente.
    - `diagnostics.stability` devuelve el registrador de estabilidad diagnóstica reciente y limitado. Conserva metadatos operativos como nombres de eventos, conteos, tamaños en bytes, lecturas de memoria, estado de cola/sesión, nombres de canal/plugin e ids de sesión. No conserva texto de chat, cuerpos de webhook, salidas de herramientas, cuerpos sin procesar de solicitudes o respuestas, tokens, cookies ni valores secretos. Se requiere ámbito de lectura de operador.
    - `status` devuelve el resumen del gateway estilo `/status`; los campos sensibles se incluyen solo para clientes operadores con ámbito de administración.
    - `gateway.identity.get` devuelve la identidad de dispositivo del gateway usada por los flujos de relay y emparejamiento.
    - `system-presence` devuelve la instantánea de presencia actual para dispositivos operador/nodo conectados.
    - `system-event` agrega un evento del sistema y puede actualizar/difundir contexto de presencia.
    - `last-heartbeat` devuelve el último evento Heartbeat persistido.
    - `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el gateway.

  </Accordion>

  <Accordion title="Modelos y uso">
    - `models.list` devuelve el catálogo de modelos permitido en tiempo de ejecución. Pasa `{ "view": "configured" }` para modelos configurados de tamaño selector (`agents.defaults.models` primero y luego `models.providers.*.models`), o `{ "view": "all" }` para el catálogo completo.
    - `usage.status` devuelve resúmenes de ventanas de uso del proveedor y cuota restante.
    - `usage.cost` devuelve resúmenes agregados de uso de costos para un intervalo de fechas.
    - `doctor.memory.status` devuelve la preparación de memoria vectorial / embeddings en caché para el espacio de trabajo activo del agente predeterminado. Pasa `{ "probe": true }` o `{ "deep": true }` solo cuando el llamador quiere explícitamente un ping en vivo al proveedor de embeddings.
    - `doctor.memory.remHarness` devuelve una vista previa acotada y de solo lectura del arnés REM para clientes remotos del plano de control. Puede incluir rutas del espacio de trabajo, fragmentos de memoria, markdown fundamentado renderizado y candidatos de promoción profunda, por lo que los llamadores necesitan `operator.read`.
    - `sessions.usage` devuelve resúmenes de uso por sesión.
    - `sessions.usage.timeseries` devuelve uso de series temporales para una sesión.
    - `sessions.usage.logs` devuelve entradas de registro de uso para una sesión.

  </Accordion>

  <Accordion title="Canales y ayudantes de inicio de sesión">
    - `channels.status` devuelve resúmenes de estado de canales/Plugins integrados + incluidos.
    - `channels.logout` cierra la sesión de un canal/cuenta específico cuando el canal admite cierre de sesión.
    - `web.login.start` inicia un flujo de inicio de sesión QR/web para el proveedor de canal web actual compatible con QR.
    - `web.login.wait` espera a que ese flujo de inicio de sesión QR/web se complete e inicia el canal si tiene éxito.
    - `push.test` envía una notificación push APNs de prueba a un Node de iOS registrado.
    - `voicewake.get` devuelve los activadores de palabra de activación almacenados.
    - `voicewake.set` actualiza los activadores de palabra de activación y difunde el cambio.

  </Accordion>

  <Accordion title="Mensajería y registros">
    - `send` es el RPC directo de entrega saliente para envíos dirigidos a canal/cuenta/hilo fuera del ejecutor de chat.
    - `logs.tail` devuelve la cola configurada del registro de archivo del Gateway con controles de cursor/límite y bytes máximos.

  </Accordion>

  <Accordion title="Talk y TTS">
    - `talk.catalog` devuelve el catálogo de proveedores Talk de solo lectura para voz, transcripción en streaming y voz en tiempo real. Incluye ids de proveedor, etiquetas, estado configurado, ids de modelo/voz expuestos, modos canónicos, transportes, estrategias de cerebro y flags de audio/capacidad en tiempo real sin devolver secretos de proveedores ni modificar la configuración global.
    - `talk.config` devuelve la carga útil efectiva de configuración de Talk; `includeSecrets` requiere `operator.talk.secrets` (o `operator.admin`).
    - `talk.session.create` crea una sesión Talk propiedad del Gateway para `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. `brain: "direct-tools"` requiere `operator.admin`.
    - `talk.session.join` valida un token de sesión de sala gestionada, emite eventos `session.ready` o `session.replaced` según sea necesario, y devuelve metadatos de sala/sesión más eventos recientes de Talk sin el token en texto sin formato ni el hash de token almacenado.
    - `talk.session.appendAudio` agrega audio de entrada PCM base64 a sesiones de retransmisión en tiempo real y transcripción propiedad del Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` y `talk.session.cancelTurn` controlan el ciclo de vida de turnos de sala gestionada con rechazo de turnos obsoletos antes de limpiar el estado.
    - `talk.session.cancelOutput` detiene la salida de audio del asistente, principalmente para interrupción controlada por VAD en sesiones de retransmisión del Gateway.
    - `talk.session.submitToolResult` completa una llamada a herramienta de proveedor emitida por una sesión de retransmisión en tiempo real propiedad del Gateway.
    - `talk.session.close` cierra una sesión de retransmisión, transcripción o sala gestionada propiedad del Gateway y emite eventos terminales de Talk.
    - `talk.mode` establece/difunde el estado actual del modo Talk para clientes WebChat/Control UI.
    - `talk.client.create` crea una sesión de proveedor en tiempo real propiedad del cliente usando `webrtc` o `provider-websocket` mientras el Gateway es propietario de la configuración, credenciales, instrucciones y política de herramientas.
    - `talk.client.toolCall` permite que los transportes en tiempo real propiedad del cliente reenvíen llamadas a herramientas del proveedor a la política del Gateway. La primera herramienta compatible es `openclaw_agent_consult`; los clientes reciben un id de ejecución y esperan los eventos normales del ciclo de vida del chat antes de enviar el resultado de herramienta específico del proveedor.
    - `talk.event` es el único canal de eventos Talk para adaptadores en tiempo real, transcripción, STT/TTS, sala gestionada, telefonía y reuniones.
    - `talk.speak` sintetiza voz mediante el proveedor de voz Talk activo.
    - `tts.status` devuelve el estado habilitado de TTS, el proveedor activo, los proveedores de respaldo y el estado de configuración del proveedor.
    - `tts.providers` devuelve el inventario visible de proveedores TTS.
    - `tts.enable` y `tts.disable` alternan el estado de preferencias de TTS.
    - `tts.setProvider` actualiza el proveedor TTS preferido.
    - `tts.convert` ejecuta una conversión de texto a voz de una sola vez.

  </Accordion>

  <Accordion title="Secretos, configuración, actualización y asistente">
    - `secrets.reload` vuelve a resolver los SecretRefs activos e intercambia el estado de secretos en tiempo de ejecución solo si todo tiene éxito.
    - `secrets.resolve` resuelve asignaciones de secretos dirigidas a comandos para un conjunto específico de comandos/objetivos.
    - `config.get` devuelve la instantánea y el hash de la configuración actual.
    - `config.set` escribe una carga útil de configuración validada.
    - `config.patch` fusiona una actualización parcial de configuración.
    - `config.apply` valida + reemplaza la carga útil de configuración completa.
    - `config.schema` devuelve la carga útil del esquema de configuración en vivo usada por Control UI y las herramientas CLI: esquema, `uiHints`, versión y metadatos de generación, incluidos metadatos de esquema de Plugin + canal cuando el runtime puede cargarlos. El esquema incluye metadatos de campo `title` / `description` derivados de las mismas etiquetas y texto de ayuda usados por la UI, incluidas ramas de composición de objeto anidado, comodín, elemento de arreglo y `anyOf` / `oneOf` / `allOf` cuando existe documentación de campo coincidente.
    - `config.schema.lookup` devuelve una carga útil de búsqueda acotada por ruta para una ruta de configuración: ruta normalizada, un nodo de esquema superficial, indicio coincidente + `hintPath`, y resúmenes de hijos inmediatos para desglose en UI/CLI. Los nodos de esquema de búsqueda conservan la documentación orientada al usuario y los campos de validación comunes (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos/de cadena/arreglo/objeto, y flags como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de hijos exponen `key`, `path` normalizada, `type`, `required`, `hasChildren`, además de `hint` / `hintPath` coincidentes.
    - `update.run` ejecuta el flujo de actualización del Gateway y programa un reinicio solo cuando la actualización en sí tuvo éxito; los llamadores con una sesión pueden incluir `continuationMessage` para que el inicio reanude un turno de agente de seguimiento a través de la cola de continuación de reinicio. Las actualizaciones del gestor de paquetes fuerzan un reinicio de actualización no diferido y sin periodo de enfriamiento después del intercambio de paquetes para que el proceso antiguo del Gateway no siga cargando perezosamente desde un árbol `dist` reemplazado.
    - `update.status` devuelve el sentinel de reinicio de actualización en caché más reciente, incluida la versión en ejecución posterior al reinicio cuando está disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de incorporación mediante RPC de WS.

  </Accordion>

  <Accordion title="Ayudantes de agente y espacio de trabajo">
    - `agents.list` devuelve entradas de agente configuradas, incluido el modelo efectivo y metadatos de runtime.
    - `agents.create`, `agents.update` y `agents.delete` gestionan registros de agente y cableado del espacio de trabajo.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` gestionan los archivos del espacio de trabajo de arranque expuestos para un agente.
    - `artifacts.list`, `artifacts.get` y `artifacts.download` exponen resúmenes de artefactos derivados de la transcripción y descargas para un ámbito explícito de `sessionKey`, `runId` o `taskId`. Las consultas de ejecución y tarea resuelven la sesión propietaria del lado del servidor y solo devuelven medios de transcripción con procedencia coincidente; las fuentes de URL inseguras o locales devuelven descargas no compatibles en lugar de obtenerse del lado del servidor.
    - `environments.list` y `environments.status` exponen descubrimiento de entornos locales al Gateway y de Node de solo lectura para clientes SDK.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o sesión.
    - `agent.wait` espera a que una ejecución termine y devuelve la instantánea terminal cuando está disponible.

  </Accordion>

  <Accordion title="Control de sesiones">
    - `sessions.list` devuelve el índice de sesiones actual, incluidos metadatos `agentRuntime` por fila cuando está configurado un backend de runtime de agente.
    - `sessions.subscribe` y `sessions.unsubscribe` alternan suscripciones a eventos de cambio de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` alternan suscripciones a eventos de transcripción/mensaje para una sesión.
    - `sessions.preview` devuelve vistas previas acotadas de transcripción para claves de sesión específicas.
    - `sessions.describe` devuelve una fila de sesión del Gateway para una clave de sesión exacta.
    - `sessions.resolve` resuelve o canonicaliza un objetivo de sesión.
    - `sessions.create` crea una nueva entrada de sesión.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrumpir y dirigir para una sesión activa.
    - `sessions.abort` aborta el trabajo activo de una sesión. Un llamador puede pasar `key` más `runId` opcional, o pasar solo `runId` para ejecuciones activas que el Gateway puede resolver a una sesión.
    - `sessions.patch` actualiza metadatos/invalidaciones de sesión e informa el modelo canónico resuelto más el `agentRuntime` efectivo.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan mantenimiento de sesión.
    - `sessions.get` devuelve la fila de sesión almacenada completa.
    - La ejecución de chat sigue usando `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` se normaliza para visualización en clientes UI: las etiquetas de directivas en línea se eliminan del texto visible, se eliminan las cargas útiles XML de llamadas a herramientas en texto sin formato (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y los tokens de control de modelo ASCII/ancho completo filtrados, se omiten las filas de asistente de token silencioso puro como `NO_REPLY` / `no_reply` exactos, y las filas sobredimensionadas pueden reemplazarse con marcadores de posición.

  </Accordion>

  <Accordion title="Emparejamiento de dispositivos y tokens de dispositivo">
    - `device.pair.list` devuelve dispositivos emparejados pendientes y aprobados.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` gestionan registros de emparejamiento de dispositivos.
    - `device.token.rotate` rota un token de dispositivo emparejado dentro de su rol aprobado y los límites de ámbito del llamador.
    - `device.token.revoke` revoca un token de dispositivo emparejado dentro de su rol aprobado y los límites de ámbito del llamador.

  </Accordion>

  <Accordion title="Emparejamiento de Node, invocación y trabajo pendiente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` y `node.pair.verify` cubren el emparejamiento de Node y la verificación de arranque.
    - `node.list` y `node.describe` devuelven el estado de Nodes conocidos/conectados.
    - `node.rename` actualiza una etiqueta de Node emparejado.
    - `node.invoke` reenvía un comando a un Node conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud de invocación.
    - `node.event` transporta eventos originados en Node de vuelta al gateway.
    - `node.pending.pull` y `node.pending.ack` son las API de cola de Node conectado.
    - `node.pending.enqueue` y `node.pending.drain` gestionan trabajo pendiente duradero para Nodes sin conexión/desconectados.

  </Accordion>

  <Accordion title="Approval families">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` cubren solicitudes únicas de aprobación de exec, además de la búsqueda/reproducción de aprobaciones pendientes.
    - `exec.approval.waitDecision` espera una aprobación de exec pendiente y devuelve la decisión final (o `null` al agotarse el tiempo de espera).
    - `exec.approvals.get` y `exec.approvals.set` gestionan instantáneas de la política de aprobación de exec del Gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` gestionan la política de aprobación de exec local del nodo mediante comandos de retransmisión del nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` cubren flujos de aprobación definidos por Plugin.

  </Accordion>

  <Accordion title="Automation, skills, and tools">
    - Automatización: `wake` programa una inyección de texto de activación inmediata o en el siguiente Heartbeat; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestionan trabajo programado.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Familias de eventos comunes

- `chat`: actualizaciones de chat de la UI, como `chat.inject` y otros eventos de chat
  solo de transcripción.
- `session.message` y `session.tool`: actualizaciones de transcripción/flujo de eventos para una
  sesión suscrita.
- `sessions.changed`: el índice de sesiones o los metadatos cambiaron.
- `presence`: actualizaciones de instantáneas de presencia del sistema.
- `tick`: evento periódico de keepalive / actividad.
- `health`: actualización de instantánea de estado del Gateway.
- `heartbeat`: actualización del flujo de eventos de Heartbeat.
- `cron`: evento de cambio de ejecución/trabajo de Cron.
- `shutdown`: notificación de apagado del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de emparejamiento de nodo.
- `node.invoke.request`: difusión de solicitud de invocación de nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo emparejado.
- `voicewake.changed`: cambió la configuración del disparador de palabra de activación.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprobación de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprobación de Plugin.

### Métodos auxiliares de nodo

- Los nodos pueden llamar a `skills.bins` para obtener la lista actual de ejecutables de Skills
  para comprobaciones de autorización automática.

### Métodos auxiliares de operador

- Los operadores pueden llamar a `commands.list` (`operator.read`) para obtener el inventario de
  comandos en tiempo de ejecución de un agente.
  - `agentId` es opcional; omítalo para leer el espacio de trabajo predeterminado del agente.
  - `scope` controla a qué superficie apunta el `name` principal:
    - `text` devuelve el token principal del comando de texto sin la `/` inicial
    - `native` y la ruta predeterminada `both` devuelven nombres nativos conscientes del proveedor
      cuando están disponibles
  - `textAliases` contiene alias de barra exactos, como `/model` y `/m`.
  - `nativeName` contiene el nombre de comando nativo consciente del proveedor cuando existe.
  - `provider` es opcional y solo afecta a la nomenclatura nativa, además de la disponibilidad de comandos nativos de Plugin.
  - `includeArgs=false` omite los metadatos de argumentos serializados en la respuesta.
- Los operadores pueden llamar a `tools.catalog` (`operator.read`) para obtener el catálogo de herramientas en tiempo de ejecución de un
  agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: propietario del Plugin cuando `source="plugin"`
  - `optional`: si una herramienta de Plugin es opcional
- Los operadores pueden llamar a `tools.effective` (`operator.read`) para obtener el inventario de herramientas efectivo en tiempo de ejecución
  de una sesión.
  - `sessionKey` es obligatorio.
  - El Gateway deriva el contexto de tiempo de ejecución de confianza desde la sesión en el servidor, en lugar de aceptar
    contexto de autenticación o entrega proporcionado por quien llama.
  - La respuesta está acotada a la sesión y refleja lo que la conversación activa puede usar ahora mismo,
    incluidas herramientas principales, de Plugin y de canal.
- Los operadores pueden llamar a `tools.invoke` (`operator.write`) para invocar una herramienta disponible mediante la
  misma ruta de política del Gateway que `/tools/invoke`.
  - `name` es obligatorio. `args`, `sessionKey`, `agentId`, `confirm` y
    `idempotencyKey` son opcionales.
  - Si tanto `sessionKey` como `agentId` están presentes, el agente de la sesión resuelta debe coincidir con
    `agentId`.
  - La respuesta es un sobre orientado al SDK con `ok`, `toolName`, `output` opcional y campos
    `error` tipados. Los rechazos por aprobación o política devuelven `ok:false` en la carga útil, en lugar de
    omitir la canalización de políticas de herramientas del Gateway.
- Los operadores pueden llamar a `skills.status` (`operator.read`) para obtener el inventario visible de
  Skills de un agente.
  - `agentId` es opcional; omítalo para leer el espacio de trabajo predeterminado del agente.
  - La respuesta incluye elegibilidad, requisitos faltantes, comprobaciones de configuración y
    opciones de instalación saneadas sin exponer valores secretos sin procesar.
- Los operadores pueden llamar a `skills.search` y `skills.detail` (`operator.read`) para
  metadatos de descubrimiento de ClawHub.
- Los operadores pueden llamar a `skills.install` (`operator.admin`) en dos modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una
    carpeta de Skill en el directorio `skills/` del espacio de trabajo predeterminado del agente.
  - Modo instalador del Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    ejecuta una acción declarada `metadata.openclaw.install` en el host del Gateway.
- Los operadores pueden llamar a `skills.update` (`operator.admin`) en dos modos:
  - El modo ClawHub actualiza un slug rastreado o todas las instalaciones de ClawHub rastreadas en
    el espacio de trabajo predeterminado del agente.
  - El modo de configuración aplica parches a valores de `skills.entries.<skillKey>`, como `enabled`,
    `apiKey` y `env`.

### Vistas de `models.list`

`models.list` acepta un parámetro opcional `view`:

- Omitido o `"default"`: comportamiento actual en tiempo de ejecución. Si `agents.defaults.models` está configurado, la respuesta es el catálogo permitido; de lo contrario, la respuesta es el catálogo completo del Gateway.
- `"configured"`: comportamiento con tamaño de selector. Si `agents.defaults.models` está configurado, sigue teniendo prioridad. De lo contrario, la respuesta usa entradas explícitas de `models.providers.*.models` y recurre al catálogo completo solo cuando no existen filas de modelos configuradas.
- `"all"`: catálogo completo del Gateway, omitiendo `agents.defaults.models`. Use esto para diagnósticos y UI de descubrimiento, no para selectores de modelos normales.

## Aprobaciones de exec

- Cuando una solicitud de exec necesita aprobación, el Gateway difunde `exec.approval.requested`.
- Los clientes de operador resuelven llamando a `exec.approval.resolve` (requiere el alcance `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadatos de sesión canónicos). Las solicitudes sin `systemRunPlan` se rechazan.
- Después de la aprobación, las llamadas reenviadas `node.invoke system.run` reutilizan ese
  `systemRunPlan` canónico como contexto autoritativo de comando/cwd/sesión.
- Si quien llama muta `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` entre la preparación y el reenvío final aprobado de `system.run`, el
  Gateway rechaza la ejecución en lugar de confiar en la carga útil mutada.

## Reserva de entrega del agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar entrega saliente.
- `bestEffortDeliver=false` mantiene el comportamiento estricto: los destinos de entrega no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite recurrir a ejecución solo de sesión cuando no se puede resolver ninguna ruta entregable externa (por ejemplo, sesiones internas/webchat o configuraciones multicanal ambiguas).

## Versionado

- `PROTOCOL_VERSION` vive en `src/gateway/protocol/version.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`; el servidor rechaza las incompatibilidades.
- Los esquemas + modelos se generan a partir de definiciones de TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes de cliente

El cliente de referencia en `src/gateway/client.ts` usa estos valores predeterminados. Los valores son
estables en el protocolo v4 y son la línea base esperada para clientes de terceros.

| Constante                                 | Predeterminado                                        | Fuente                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Tiempo de espera de solicitud (por RPC)   | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Tiempo de espera de preautenticación / desafío de conexión | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env puede aumentar el presupuesto emparejado de servidor/cliente) |
| Backoff de reconexión inicial             | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff máximo de reconexión              | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Límite de reintento rápido tras cierre por token de dispositivo | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Gracia de detención forzada antes de `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalo de tick predeterminado (antes de `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Cierre por tiempo de espera de tick       | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

El servidor anuncia los valores efectivos de `policy.tickIntervalMs`, `policy.maxPayload`
y `policy.maxBufferedBytes` en `hello-ok`; los clientes deben respetar esos valores
en lugar de los predeterminados previos al handshake.

## Autenticación

- La autenticación del Gateway mediante secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el modo de autenticación configurado.
- Los modos con identidad, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o `gateway.auth.mode: "trusted-proxy"`
  que no sean local loopback, satisfacen la comprobación de autenticación de conexión a partir de
  los encabezados de la solicitud en lugar de `connect.params.auth.*`.
- La entrada privada con `gateway.auth.mode: "none"` omite por completo la
  autenticación de conexión mediante secreto compartido; no expongas ese modo en entradas públicas o no confiables.
- Después del emparejamiento, el Gateway emite un **token de dispositivo** limitado al rol de conexión
  + alcances. Se devuelve en `hello-ok.auth.deviceToken` y el cliente debe
  conservarlo para conexiones futuras.
- Los clientes deben conservar el `hello-ok.auth.deviceToken` principal después de cualquier
  conexión correcta.
- Al reconectar con ese token de dispositivo **almacenado**, también debe reutilizarse el conjunto
  de alcances aprobados almacenado para ese token. Esto preserva el acceso de lectura/sondeo/estado
  que ya se había concedido y evita reducir silenciosamente las reconexiones a un
  alcance implícito más estrecho solo de administrador.
- Ensamblado de autenticación de conexión del lado del cliente (`selectConnectAuth` en
  `src/gateway/client.ts`):
  - `auth.password` es ortogonal y siempre se reenvía cuando está definido.
  - `auth.token` se rellena por orden de prioridad: primero el token compartido explícito,
    luego un `deviceToken` explícito y después un token por dispositivo almacenado (claveado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` se envía solo cuando nada de lo anterior resolvió un
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La promoción automática de un token de dispositivo almacenado en el reintento único
    `AUTH_TOKEN_MISMATCH` está limitada a **endpoints confiables únicamente**:
    loopback, o `wss://` con un `tlsFingerprint` fijado. Un `wss://` público
    sin fijación no cumple los requisitos.
- Las entradas adicionales de `hello-ok.auth.deviceTokens` son tokens de traspaso de bootstrap.
  Consérvalas solo cuando la conexión usó autenticación de bootstrap en un transporte confiable
  como `wss://` o emparejamiento loopback/local.
- Si un cliente proporciona un `deviceToken` **explícito** o `scopes` explícitos, ese
  conjunto de alcances solicitado por el llamador sigue siendo autoritativo; los alcances en caché solo
  se reutilizan cuando el cliente reutiliza el token por dispositivo almacenado.
- Los tokens de dispositivo pueden rotarse o revocarse mediante `device.token.rotate` y
  `device.token.revoke` (requiere el alcance `operator.pairing`).
- `device.token.rotate` devuelve metadatos de rotación. Repite el token portador de reemplazo
  solo para llamadas del mismo dispositivo que ya están autenticadas con
  ese token de dispositivo, para que los clientes que solo usan token puedan conservar su reemplazo antes de
  reconectar. Las rotaciones compartidas/de administrador no repiten el token portador.
- La emisión, rotación y revocación de tokens se mantienen acotadas al conjunto de roles aprobado
  registrado en la entrada de emparejamiento de ese dispositivo; la mutación de tokens no puede ampliar ni
  apuntar a un rol de dispositivo que la aprobación de emparejamiento nunca concedió.
- Para sesiones de token de dispositivo emparejado, la administración de dispositivos se limita a sí misma salvo que el
  llamador también tenga `operator.admin`: los llamadores no administradores pueden eliminar/revocar/rotar
  solo su **propia** entrada de dispositivo.
- `device.token.rotate` y `device.token.revoke` también comprueban el conjunto de alcances del token de operador
  de destino contra los alcances de la sesión actual del llamador. Los llamadores no administradores
  no pueden rotar ni revocar un token de operador más amplio que el que ya poseen.
- Los fallos de autenticación incluyen `error.details.code` más indicaciones de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes confiables pueden intentar un reintento acotado con un token por dispositivo en caché.
  - Si ese reintento falla, los clientes deben detener los bucles de reconexión automática y mostrar orientación para que actúe el operador.

## Identidad del dispositivo + emparejamiento

- Los nodos deben incluir una identidad de dispositivo estable (`device.id`) derivada de una
  huella digital de par de claves.
- Los Gateway emiten tokens por dispositivo + rol.
- Se requieren aprobaciones de emparejamiento para nuevos ID de dispositivo salvo que la aprobación automática local
  esté habilitada.
- La aprobación automática de emparejamiento se centra en conexiones directas de local loopback.
- OpenClaw también tiene una ruta estrecha de autoconexión backend/local de contenedor para
  flujos auxiliares confiables con secreto compartido.
- Las conexiones de la misma máquina mediante tailnet o LAN se siguen tratando como remotas para el emparejamiento y
  requieren aprobación.
- Los clientes WS normalmente incluyen la identidad `device` durante `connect` (operador +
  nodo). Las únicas excepciones de operador sin dispositivo son rutas de confianza explícitas:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad con HTTP inseguro solo en localhost.
  - autenticación correcta de Control UI de operador con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (medida de emergencia, degradación grave de seguridad).
  - RPCs de backend `gateway-client` de loopback directo autenticadas con el token/contraseña
    compartido del Gateway.
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de autenticación de dispositivo

Para clientes heredados que aún usan el comportamiento de firma anterior al desafío, `connect` ahora devuelve
códigos de detalle `DEVICE_AUTH_*` bajo `error.details.code` con un `error.details.reason` estable.

Fallos comunes de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió vacío). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto/incorrecto. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga útil de firma no coincide con la carga útil v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella digital de la clave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falló el formato/canonicalización de la clave pública. |

Objetivo de migración:

- Espera siempre a `connect.challenge`.
- Firma la carga útil v2 que incluye el nonce del servidor.
- Envía el mismo nonce en `connect.params.device.nonce`.
- La carga útil de firma preferida es `v3`, que vincula `platform` y `deviceFamily`
  además de los campos de dispositivo/cliente/rol/alcances/token/nonce.
- Las firmas `v2` heredadas siguen aceptándose por compatibilidad, pero la fijación de
  metadatos de dispositivo emparejado sigue controlando la política de comandos al reconectar.

## TLS + fijación

- TLS es compatible con conexiones WS.
- Los clientes pueden fijar opcionalmente la huella digital del certificado del Gateway (consulta la configuración
  `gateway.tls` más `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Alcance

Este protocolo expone la **API completa del Gateway** (estado, canales, modelos, chat,
agente, sesiones, nodos, aprobaciones, etc.). La superficie exacta está definida por los
esquemas TypeBox en `src/gateway/protocol/schema.ts`.

## Relacionado

- [Protocolo de puente](/es/gateway/bridge-protocol)
- [Manual operativo de Gateway](/es/gateway)
