---
read_when:
    - Implementar o actualizar clientes WS del gateway
    - Depuración de incompatibilidades de protocolo o fallos de conexión
    - Regenerando el esquema/modelos del protocolo
summary: 'Protocolo WebSocket de Gateway: negociación inicial, tramas, control de versiones'
title: Protocolo Gateway
x-i18n:
    generated_at: "2026-06-27T11:34:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
    source_path: gateway/protocol.md
    workflow: 16
---

El protocolo WS del Gateway es el **plano de control + transporte de nodos único** para
OpenClaw. Todos los clientes (CLI, interfaz web, app de macOS, nodos iOS/Android, nodos
sin interfaz) se conectan mediante WebSocket y declaran su **rol** + **ámbito** durante
el handshake.

## Transporte

- WebSocket, tramas de texto con cargas JSON.
- La primera trama **debe** ser una solicitud `connect`.
- Las tramas previas a la conexión tienen un límite de 64 KiB. Después de un handshake correcto, los clientes
  deben respetar los límites `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con los diagnósticos activados,
  las tramas entrantes demasiado grandes y los búferes salientes lentos emiten eventos `payload.large`
  antes de que el gateway cierre o descarte la trama afectada. Estos eventos conservan
  tamaños, límites, superficies y códigos de motivo seguros. No conservan el cuerpo del mensaje,
  el contenido de adjuntos, el cuerpo de la trama sin procesar, tokens, cookies ni valores secretos.

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

Mientras el Gateway todavía está terminando los sidecars de arranque, la solicitud `connect` puede
devolver un error reintentable `UNAVAILABLE` con `details.reason` establecido en
`"startup-sidecars"` y `retryAfterMs`. Los clientes deben reintentar esa respuesta
dentro de su presupuesto general de conexión en lugar de mostrarla como un fallo
terminal del handshake.

`server`, `features`, `snapshot` y `policy` son obligatorios según el esquema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` también es obligatorio e informa
el rol/los ámbitos negociados. `pluginSurfaceUrls` es opcional y asigna nombres de superficies
de plugin, como `canvas`, a URL alojadas con ámbito.

Las URL de superficies de plugin con ámbito pueden caducar. Los nodos pueden llamar a
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` para recibir una entrada nueva
en `pluginSurfaceUrls`. La refactorización experimental del plugin Canvas no
admite la ruta de compatibilidad obsoleta `canvasHostUrl`, `canvasCapability` ni
`node.canvas.capability.refresh`; los clientes nativos y gateways actuales deben usar superficies de plugin.

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
`client.mode: "backend"`) pueden omitir `device` en conexiones directas de local loopback cuando
se autentican con el token/contraseña compartidos del gateway. Esta ruta está reservada
para RPC internos del plano de control y evita que las líneas base obsoletas de emparejamiento CLI/dispositivo
bloqueen trabajo backend local, como actualizaciones de sesiones de subagentes. Los clientes remotos,
clientes de origen navegador, clientes de nodo y clientes explícitos con token de dispositivo/identidad de dispositivo
siguen usando las comprobaciones normales de emparejamiento y aumento de ámbito.

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

El bootstrap integrado mediante QR/código de configuración es una ruta nueva de traspaso móvil. Una conexión correcta
con código de configuración de referencia devuelve un token de nodo principal más un token
de operador limitado:

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

El traspaso de operador está limitado intencionadamente para que la incorporación por QR pueda iniciar el
bucle de operador móvil sin conceder `operator.admin` ni `operator.pairing`.
Sí incluye `operator.talk.secrets` para que el cliente nativo pueda leer la configuración de Talk
que necesita después del bootstrap. Los ámbitos administrativos y de emparejamiento más amplios requieren
un emparejamiento de operador aprobado por separado o un flujo de token. Los clientes deben persistir
`hello-ok.auth.deviceTokens` solo
cuando la conexión usó autenticación de bootstrap en un transporte de confianza, como `wss://` o
emparejamiento loopback/local.

### Ejemplo de nodo

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

Para ver el modelo completo de ámbitos de operador, las comprobaciones en el momento de la aprobación
y la semántica de secretos compartidos, consulta [Ámbitos de operador](/es/gateway/operator-scopes).

### Roles

- `operator` = cliente del plano de control (CLI/interfaz/automatización).
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

Los métodos RPC del gateway registrados por plugins pueden solicitar su propio ámbito de operador, pero
los prefijos administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre se resuelven como `operator.admin`.

El ámbito del método es solo la primera barrera. Algunos comandos con barra accesibles mediante
`chat.send` aplican comprobaciones más estrictas a nivel de comando encima de ella. Por ejemplo, las escrituras persistentes
`/config set` y `/config unset` requieren `operator.admin`.

`node.pair.approve` también tiene una comprobación de ámbito adicional en el momento de la aprobación además del
ámbito base del método:

- solicitudes sin comandos: `operator.pairing`
- solicitudes con comandos de nodo que no son exec: `operator.pairing` + `operator.write`
- solicitudes que incluyen `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacidades/comandos/permisos (nodo)

Los nodos declaran afirmaciones de capacidad al conectarse:

- `caps`: categorías de capacidad de alto nivel como `camera`, `canvas`, `screen`,
  `location`, `voice` y `talk`.
- `commands`: lista de permitidos de comandos para invocación.
- `permissions`: interruptores granulares (p. ej., `screen.record`, `camera.capture`).

El Gateway trata estos elementos como **afirmaciones** y aplica listas de permitidos del lado del servidor.

## Presencia

- `system-presence` devuelve entradas indexadas por identidad de dispositivo.
- Las entradas de presencia incluyen `deviceId`, `roles` y `scopes` para que las interfaces puedan mostrar una sola fila por dispositivo
  incluso cuando se conecta como **operador** y **nodo**.
- `node.list` incluye los campos opcionales `lastSeenAtMs` y `lastSeenReason`. Los nodos conectados informan
  su hora de conexión actual como `lastSeenAtMs` con el motivo `connect`; los nodos emparejados también pueden informar
  presencia en segundo plano duradera cuando un evento de nodo de confianza actualiza sus metadatos de emparejamiento.

### Evento de nodo vivo en segundo plano

Los nodos pueden llamar a `node.event` con `event: "node.presence.alive"` para registrar que un nodo emparejado estuvo
vivo durante un despertar en segundo plano sin marcarlo como conectado.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` es un enum cerrado: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Las cadenas de trigger desconocidas se normalizan a
`background` en el gateway antes de la persistencia. El evento solo es duradero para sesiones de dispositivo de nodo
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

Los gateways antiguos aún pueden devolver `{ "ok": true }` para `node.event`; los clientes deben tratarlo como una
RPC reconocida, no como persistencia duradera de presencia.

## Ámbito de eventos de difusión

Los eventos de difusión WebSocket enviados por el servidor están restringidos por ámbito para que las sesiones con ámbito de emparejamiento o solo de nodo no reciban pasivamente contenido de sesión.

- **Tramas de chat, agente y resultado de herramienta** (incluidos eventos `agent` transmitidos y resultados de llamadas a herramientas) requieren al menos `operator.read`. Las sesiones sin `operator.read` omiten estas tramas por completo.
- **Difusiones `plugin.*` definidas por plugins** están restringidas a `operator.write` u `operator.admin`, según cómo las haya registrado el plugin.
- **Eventos de estado y transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexión/desconexión, etc.) permanecen sin restricciones para que el estado del transporte siga siendo observable para cada sesión autenticada.
- **Familias de eventos de difusión desconocidas** se restringen por ámbito de forma predeterminada (fallo cerrado) salvo que un controlador registrado las relaje explícitamente.

Cada conexión de cliente conserva su propio número de secuencia por cliente para que las difusiones preserven el orden monótono en ese socket incluso cuando distintos clientes ven subconjuntos filtrados por ámbito diferentes del flujo de eventos.

## Familias comunes de métodos RPC

La superficie WS pública es más amplia que los ejemplos de handshake/autenticación anteriores. Esta
no es una exportación generada: `hello-ok.features.methods` es una lista conservadora
de descubrimiento compilada desde `src/gateway/server-methods-list.ts` más exportaciones de métodos de
plugins/canales cargados. Trátala como descubrimiento de funciones, no como una
enumeración completa de `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System and identity">
    - `health` devuelve la instantánea de estado del Gateway almacenada en caché o sondeada recientemente.
    - `diagnostics.stability` devuelve el registrador de estabilidad diagnóstica reciente y acotado. Conserva metadatos operativos como nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de cola/sesión, nombres de canales/plugins e identificadores de sesión. No conserva texto de chat, cuerpos de Webhook, salidas de herramientas, cuerpos sin procesar de solicitudes o respuestas, tokens, cookies ni valores secretos. Se requiere alcance de lectura de operador.
    - `status` devuelve el resumen del Gateway con estilo `/status`; los campos sensibles se incluyen solo para clientes operadores con alcance de administrador.
    - `gateway.identity.get` devuelve la identidad de dispositivo del Gateway usada por los flujos de retransmisión y emparejamiento.
    - `system-presence` devuelve la instantánea de presencia actual para dispositivos de operador/nodo conectados.
    - `system-event` agrega un evento del sistema y puede actualizar/difundir el contexto de presencia.
    - `last-heartbeat` devuelve el evento de Heartbeat persistido más reciente.
    - `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el Gateway.

  </Accordion>

  <Accordion title="Models and usage">
    - `models.list` devuelve el catálogo de modelos permitido por el entorno de ejecución. Pasa `{ "view": "configured" }` para modelos configurados del tamaño del selector (`agents.defaults.models` primero, luego `models.providers.*.models`), o `{ "view": "all" }` para el catálogo completo.
    - `usage.status` devuelve resúmenes de ventanas de uso/cuota restante por proveedor.
    - `usage.cost` devuelve resúmenes agregados de uso de costos para un intervalo de fechas.
      Pasa `agentId` para un agente, o `agentScope: "all"` para agregar agentes configurados.
    - `doctor.memory.status` devuelve la preparación de memoria vectorial / embeddings en caché para el espacio de trabajo del agente predeterminado activo. Pasa `{ "probe": true }` o `{ "deep": true }` solo cuando el llamador quiere explícitamente un ping en vivo al proveedor de embeddings. Los clientes compatibles con Dreaming también pueden pasar `{ "agentId": "agent-id" }` para limitar las estadísticas del almacén de Dreaming a un espacio de trabajo de agente seleccionado; omitir `agentId` mantiene la alternativa del agente predeterminado y agrega los espacios de trabajo de Dreaming configurados.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` y `doctor.memory.dedupeDreamDiary` aceptan parámetros opcionales `{ "agentId": "agent-id" }` para vistas/acciones de Dreaming del agente seleccionado. Cuando se omite `agentId`, operan en el espacio de trabajo configurado del agente predeterminado.
    - `doctor.memory.remHarness` devuelve una vista previa acotada y de solo lectura del arnés REM para clientes remotos del plano de control. Puede incluir rutas de espacios de trabajo, fragmentos de memoria, markdown fundamentado renderizado y candidatos de promoción profunda, por lo que los llamadores necesitan `operator.read`.
    - `sessions.usage` devuelve resúmenes de uso por sesión. Pasa `agentId` para un
      agente, o `agentScope: "all"` para listar juntos los agentes configurados.
    - `sessions.usage.timeseries` devuelve el uso de series temporales para una sesión.
    - `sessions.usage.logs` devuelve entradas del registro de uso para una sesión.

  </Accordion>

  <Accordion title="Channels and login helpers">
    - `channels.status` devuelve resúmenes de estado de canales/plugins integrados + incluidos.
    - `channels.logout` cierra la sesión de un canal/cuenta específico cuando el canal admite cierre de sesión.
    - `web.login.start` inicia un flujo de inicio de sesión QR/web para el proveedor de canal web actual compatible con QR.
    - `web.login.wait` espera a que ese flujo de inicio de sesión QR/web se complete e inicia el canal si tiene éxito.
    - `push.test` envía una notificación push APNs de prueba a un nodo iOS registrado.
    - `voicewake.get` devuelve los disparadores de palabra de activación almacenados.
    - `voicewake.set` actualiza los disparadores de palabra de activación y difunde el cambio.

  </Accordion>

  <Accordion title="Messaging and logs">
    - `send` es el RPC directo de entrega saliente para envíos dirigidos a canal/cuenta/hilo fuera del ejecutor de chat.
    - `logs.tail` devuelve la cola configurada del registro de archivo del Gateway con controles de cursor/límite y bytes máximos.

  </Accordion>

  <Accordion title="Talk and TTS">
    - `talk.catalog` devuelve el catálogo de solo lectura de proveedores de Talk para voz, transcripción en streaming y voz en tiempo real. Incluye identificadores de proveedores, etiquetas, estado configurado, identificadores de modelo/voz expuestos, modos canónicos, transportes, estrategias de cerebro y marcas de audio/capacidad en tiempo real sin devolver secretos de proveedores ni mutar la configuración global.
    - `talk.config` devuelve la carga útil efectiva de configuración de Talk; `includeSecrets` requiere `operator.talk.secrets` (u `operator.admin`).
    - `talk.session.create` crea una sesión de Talk propiedad del Gateway para `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. Para `stt-tts/managed-room`, los llamadores con `operator.write` que pasan `sessionKey` también deben pasar `spawnedBy` para visibilidad de clave de sesión con alcance; la creación de `sessionKey` sin alcance y `brain: "direct-tools"` requieren `operator.admin`.
    - `talk.session.join` valida un token de sesión de sala gestionada, emite eventos `session.ready` o `session.replaced` según sea necesario, y devuelve metadatos de sala/sesión más eventos recientes de Talk sin el token en texto plano ni el hash de token almacenado.
    - `talk.session.appendAudio` agrega audio de entrada PCM en base64 a sesiones de retransmisión en tiempo real y transcripción propiedad del Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` y `talk.session.cancelTurn` controlan el ciclo de vida de turnos de sala gestionada con rechazo de turnos obsoletos antes de que se borre el estado.
    - `talk.session.cancelOutput` detiene la salida de audio del asistente, principalmente para interrupción controlada por VAD en sesiones de retransmisión del Gateway.
    - `talk.session.submitToolResult` completa una llamada a herramienta de proveedor emitida por una sesión de retransmisión en tiempo real propiedad del Gateway. Pasa `options: { willContinue: true }` para una salida provisional de herramienta cuando seguirá un resultado final, u `options: { suppressResponse: true }` cuando el resultado de la herramienta deba satisfacer la llamada del proveedor sin iniciar otra respuesta de asistente en tiempo real.
    - `talk.session.steer` envía control de voz de ejecución activa a una sesión de Talk respaldada por agente y propiedad del Gateway. Acepta `{ sessionId, text, mode? }`, donde `mode` es `status`, `steer`, `cancel` o `followup`; el modo omitido se clasifica a partir del texto hablado.
    - `talk.session.close` cierra una sesión de retransmisión, transcripción o sala gestionada propiedad del Gateway y emite eventos terminales de Talk.
    - `talk.mode` establece/difunde el estado actual del modo Talk para clientes WebChat/Control UI.
    - `talk.client.create` crea una sesión de proveedor en tiempo real propiedad del cliente mediante `webrtc` o `provider-websocket` mientras el Gateway posee la configuración, credenciales, instrucciones y política de herramientas.
    - `talk.client.toolCall` permite que los transportes en tiempo real propiedad del cliente reenvíen llamadas a herramientas del proveedor a la política del Gateway. La primera herramienta compatible es `openclaw_agent_consult`; los clientes reciben un identificador de ejecución y esperan eventos normales del ciclo de vida del chat antes de enviar el resultado de herramienta específico del proveedor.
    - `talk.client.steer` envía control de voz de ejecución activa para transportes en tiempo real propiedad del cliente. El Gateway resuelve la ejecución incrustada activa desde `sessionKey` y devuelve un resultado estructurado aceptado/rechazado en lugar de descartar silenciosamente la dirección.
    - `talk.event` es el único canal de eventos de Talk para adaptadores en tiempo real, transcripción, STT/TTS, sala gestionada, telefonía y reuniones.
    - `talk.speak` sintetiza voz a través del proveedor de voz de Talk activo.
    - `tts.status` devuelve el estado habilitado de TTS, el proveedor activo, los proveedores alternativos y el estado de configuración del proveedor.
    - `tts.providers` devuelve el inventario visible de proveedores TTS.
    - `tts.enable` y `tts.disable` activan o desactivan el estado de preferencias de TTS.
    - `tts.setProvider` actualiza el proveedor TTS preferido.
    - `tts.convert` ejecuta una conversión puntual de texto a voz.

  </Accordion>

  <Accordion title="Secrets, config, update, and wizard">
    - `secrets.reload` vuelve a resolver las SecretRefs activas e intercambia el estado secreto del entorno de ejecución solo si todo tiene éxito.
    - `secrets.resolve` resuelve asignaciones de secretos dirigidas a comandos para un conjunto específico de comando/destino.
    - `config.get` devuelve la instantánea y el hash de la configuración actual.
    - `config.set` escribe una carga útil de configuración validada.
    - `config.patch` fusiona una actualización parcial de configuración. El reemplazo destructivo de arrays
      requiere la ruta afectada en `replacePaths`; los arrays anidados
      bajo entradas de array usan rutas `[]` como `agents.list[].skills`.
    - `config.apply` valida + reemplaza la carga útil completa de configuración.
    - `config.schema` devuelve la carga útil del esquema de configuración en vivo usada por Control UI y las herramientas de CLI: esquema, `uiHints`, versión y metadatos de generación, incluidos metadatos de esquema de plugin + canal cuando el entorno de ejecución puede cargarlos. El esquema incluye metadatos de campo `title` / `description` derivados de las mismas etiquetas y texto de ayuda usados por la interfaz, incluidas ramas de composición de objeto anidado, comodín, elemento de array y `anyOf` / `oneOf` / `allOf` cuando existe documentación de campo coincidente.
    - `config.schema.lookup` devuelve una carga útil de búsqueda con alcance de ruta para una ruta de configuración: ruta normalizada, un nodo de esquema superficial, sugerencia coincidente + `hintPath`, `reloadKind` opcional y resúmenes de hijos inmediatos para exploración detallada en UI/CLI. `reloadKind` es uno de `restart`, `hot` o `none` y refleja el planificador de recarga de configuración del Gateway para la ruta solicitada. Los nodos de esquema de búsqueda conservan la documentación orientada al usuario y campos comunes de validación (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos/de cadena/array/objeto y marcas como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de hijos exponen `key`, `path` normalizada, `type`, `required`, `hasChildren`, `reloadKind` opcional, además de `hint` / `hintPath` coincidentes.
    - `update.run` ejecuta el flujo de actualización del Gateway y programa un reinicio solo cuando la propia actualización tuvo éxito; los llamadores con una sesión pueden incluir `continuationMessage` para que el arranque reanude un turno de agente de seguimiento mediante la cola de continuación de reinicio. Las actualizaciones del gestor de paquetes y las actualizaciones supervisadas de checkout de git desde el plano de control usan una entrega a servicio gestionado desacoplada en lugar de reemplazar el árbol de paquetes o mutar la salida de checkout/build dentro del Gateway en vivo. Una entrega iniciada devuelve `ok: true` con `result.reason: "managed-service-handoff-started"` y `handoff.status: "started"`; las entregas no disponibles o fallidas devuelven `ok: false` con `managed-service-handoff-unavailable` o `managed-service-handoff-failed`, más `handoff.command` cuando se requiere una actualización manual de shell. Una entrega no disponible significa que OpenClaw carece de un límite de supervisor seguro o de una identidad de servicio duradera, como `OPENCLAW_SYSTEMD_UNIT` para systemd. Durante una entrega iniciada, el centinela de reinicio puede informar brevemente `stats.reason: "restart-health-pending"`; la continuación se retrasa hasta que la CLI verifica el Gateway reiniciado y escribe el centinela final `ok`.
    - `update.status` actualiza y devuelve el centinela de reinicio de actualización más reciente, incluida la versión en ejecución posterior al reinicio cuando está disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de incorporación mediante WS RPC.

  </Accordion>

  <Accordion title="Auxiliares de agente y espacio de trabajo">
    - `agents.list` devuelve entradas de agente configuradas, incluidos el modelo efectivo y los metadatos de runtime.
    - `agents.create`, `agents.update` y `agents.delete` gestionan registros de agente y el cableado del espacio de trabajo.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` gestionan los archivos de espacio de trabajo de arranque expuestos para un agente.
    - `tasks.list`, `tasks.get` y `tasks.cancel` exponen el registro de tareas del Gateway a clientes SDK y operadores.
    - `artifacts.list`, `artifacts.get` y `artifacts.download` exponen resúmenes de artefactos derivados de transcripciones y descargas para un alcance explícito de `sessionKey`, `runId` o `taskId`. Las consultas de ejecución y tarea resuelven la sesión propietaria del lado del servidor y solo devuelven medios de transcripción con procedencia coincidente; las fuentes de URL no seguras o locales devuelven descargas no admitidas en lugar de obtenerlas del lado del servidor.
    - `environments.list` y `environments.status` exponen el descubrimiento de entornos locales del Gateway y de nodos en modo de solo lectura para clientes SDK.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o una sesión.
    - `agent.wait` espera a que una ejecución termine y devuelve la instantánea terminal cuando está disponible.

  </Accordion>

  <Accordion title="Control de sesión">
    - `sessions.list` devuelve el índice de sesiones actual, incluidos los metadatos `agentRuntime` por fila cuando hay configurado un backend de runtime de agente.
    - `sessions.subscribe` y `sessions.unsubscribe` alternan las suscripciones a eventos de cambios de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` alternan las suscripciones a eventos de transcripción/mensaje para una sesión.
    - `sessions.preview` devuelve vistas previas acotadas de transcripciones para claves de sesión específicas.
    - `sessions.describe` devuelve una fila de sesión del Gateway para una clave de sesión exacta.
    - `sessions.resolve` resuelve o canonicaliza un destino de sesión.
    - `sessions.create` crea una nueva entrada de sesión.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrumpir y dirigir para una sesión activa.
    - `sessions.abort` aborta el trabajo activo de una sesión. El llamador puede pasar `key` más un `runId` opcional, o pasar solo `runId` para ejecuciones activas que el Gateway pueda resolver a una sesión.
    - `sessions.patch` actualiza metadatos/anulaciones de sesión e informa el modelo canónico resuelto más el `agentRuntime` efectivo.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan mantenimiento de sesión.
    - `sessions.get` devuelve la fila completa de sesión almacenada.
    - La ejecución de chat sigue usando `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` se normaliza para visualización en clientes de UI: las etiquetas de directiva en línea se eliminan del texto visible, las cargas XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y los tokens de control de modelo ASCII/ancho completo filtrados se eliminan, las filas de asistente con tokens silenciosos puros como `NO_REPLY` / `no_reply` exactos se omiten, y las filas de tamaño excesivo pueden reemplazarse con marcadores de posición.
    - `chat.message.get` es el lector aditivo acotado de mensaje completo para una sola entrada visible de transcripción. Los clientes pasan `sessionKey`, `agentId` opcional cuando la selección de sesión tiene alcance de agente, más un `messageId` de transcripción expuesto previamente mediante `chat.history`, y el Gateway devuelve la misma proyección normalizada para visualización sin el límite de truncamiento del historial ligero cuando la entrada almacenada todavía está disponible y no tiene tamaño excesivo.
    - `chat.send` acepta `fastMode: "auto"` de un turno para usar el modo rápido en llamadas al modelo iniciadas antes del corte automático, y luego iniciar llamadas posteriores de reintento, respaldo, resultado de herramienta o continuación sin modo rápido. El corte predeterminado es de 60 segundos y puede configurarse por modelo con `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un llamador de `chat.send` puede pasar `fastAutoOnSeconds` de un turno para anular el corte para esa solicitud.

  </Accordion>

  <Accordion title="Emparejamiento de dispositivos y tokens de dispositivo">
    - `device.pair.list` devuelve dispositivos emparejados pendientes y aprobados.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` gestionan registros de emparejamiento de dispositivos.
    - `device.token.rotate` rota un token de dispositivo emparejado dentro de su rol aprobado y los límites de alcance del llamador.
    - `device.token.revoke` revoca un token de dispositivo emparejado dentro de su rol aprobado y los límites de alcance del llamador.

  </Accordion>

  <Accordion title="Emparejamiento de nodos, invocación y trabajo pendiente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` y `node.pair.verify` cubren el emparejamiento de nodos y la verificación de arranque.
    - `node.list` y `node.describe` devuelven el estado de nodos conocidos/conectados.
    - `node.rename` actualiza la etiqueta de un nodo emparejado.
    - `node.invoke` reenvía un comando a un nodo conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud de invocación.
    - `node.event` transporta eventos originados por nodos de vuelta al gateway.
    - `node.pending.pull` y `node.pending.ack` son las API de cola de nodos conectados.
    - `node.pending.enqueue` y `node.pending.drain` gestionan trabajo pendiente duradero para nodos sin conexión/desconectados.

  </Accordion>

  <Accordion title="Familias de aprobación">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` cubren solicitudes de aprobación de ejecución únicas más búsqueda/reproducción de aprobaciones pendientes.
    - `exec.approval.waitDecision` espera una aprobación de ejecución pendiente y devuelve la decisión final (o `null` al agotarse el tiempo de espera).
    - `exec.approvals.get` y `exec.approvals.set` gestionan instantáneas de política de aprobación de ejecución del gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` gestionan la política de aprobación de ejecución local del nodo mediante comandos de relé del nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` cubren flujos de aprobación definidos por plugins.

  </Accordion>

  <Accordion title="Automatización, Skills y herramientas">
    - Automatización: `wake` programa una inyección inmediata de texto de activación o en el siguiente Heartbeat; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestionan trabajo programado.
    - `cron.run` sigue siendo un RPC de estilo encolado para ejecuciones manuales. Los clientes que necesiten semántica de finalización deben leer el `runId` devuelto y sondear `cron.runs`.
    - `cron.runs` acepta un filtro opcional no vacío `runId` para que los clientes puedan seguir una ejecución manual encolada sin competir con otras entradas de historial del mismo trabajo.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Familias comunes de eventos

- `chat`: actualizaciones de chat de UI como `chat.inject` y otros eventos de chat solo de transcripción. En el protocolo v4, las cargas delta llevan `deltaText`; `message` sigue siendo la instantánea acumulativa del asistente. Los reemplazos que no son de prefijo establecen `replace=true` y usan `deltaText` como texto de reemplazo.
- `session.message`, `session.operation` y `session.tool`: actualizaciones de transcripción, operación de sesión en curso y flujo de eventos para una sesión suscrita.
- `sessions.changed`: el índice de sesiones o los metadatos cambiaron.
- `presence`: actualizaciones de instantáneas de presencia del sistema.
- `tick`: evento periódico de keepalive / actividad.
- `health`: actualización de instantánea de estado del gateway.
- `heartbeat`: actualización del flujo de eventos Heartbeat.
- `cron`: evento de cambio de ejecución/trabajo de cron.
- `shutdown`: notificación de apagado del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de emparejamiento de nodos.
- `node.invoke.request`: difusión de solicitud de invocación de nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo emparejado.
- `voicewake.changed`: cambió la configuración del disparador de palabra de activación.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprobación de ejecución.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprobación de plugin.

### Métodos auxiliares de Node

- Los Node pueden llamar a `skills.bins` para obtener la lista actual de ejecutables de Skills para comprobaciones de permiso automático.

### RPC del registro de tareas

Los clientes operadores pueden inspeccionar y cancelar registros de tareas en segundo plano del Gateway mediante los RPC del registro de tareas. Estos métodos devuelven resúmenes saneados de tareas, no estado de runtime sin procesar.

- `tasks.list` requiere `operator.read`.
  - Parámetros: `status` opcional (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` o `"timed_out"`) o un arreglo de esos estados, `agentId` opcional, `sessionKey` opcional, `limit` opcional de `1` a `500` y cadena `cursor` opcional.
  - Resultado: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` requiere `operator.read`.
  - Parámetros: `{ "taskId": string }`.
  - Resultado: `{ "task": TaskSummary }`.
  - Los identificadores de tarea faltantes devuelven la forma de error no encontrado del Gateway.
- `tasks.cancel` requiere `operator.write`.
  - Parámetros: `{ "taskId": string, "reason"?: string }`.
  - Resultado:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informa si el registro tenía una tarea coincidente. `cancelled` informa si el runtime aceptó o registró la cancelación.

`TaskSummary` incluye `id`, `status` y metadatos opcionales como `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, marcas de tiempo, progreso, resumen terminal y texto de error saneado. `agentId` identifica al agente que ejecuta la tarea; `sessionKey` y `ownerKey` conservan el contexto del solicitante y de control.

### Métodos auxiliares de operador

- Los operadores pueden llamar a `commands.list` (`operator.read`) para obtener el inventario de comandos en tiempo de ejecución de un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - `scope` controla a qué superficie apunta el `name` principal:
    - `text` devuelve el token del comando de texto principal sin la `/` inicial
    - `native` y la ruta predeterminada `both` devuelven nombres nativos con conocimiento del proveedor cuando están disponibles
  - `textAliases` contiene alias de barra exactos como `/model` y `/m`.
  - `nativeName` contiene el nombre de comando nativo con conocimiento del proveedor cuando existe.
  - `provider` es opcional y solo afecta a la nomenclatura nativa y a la disponibilidad de comandos nativos de plugins.
  - `includeArgs=false` omite de la respuesta los metadatos de argumentos serializados.
- Los operadores pueden llamar a `tools.catalog` (`operator.read`) para obtener el catálogo de herramientas en tiempo de ejecución de un agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: propietario del plugin cuando `source="plugin"`
  - `optional`: si una herramienta de plugin es opcional
- Los operadores pueden llamar a `tools.effective` (`operator.read`) para obtener el inventario de herramientas efectivo en tiempo de ejecución de una sesión.
  - `sessionKey` es obligatorio.
  - El gateway deriva contexto de tiempo de ejecución confiable desde la sesión en el servidor en lugar de aceptar contexto de autenticación o entrega proporcionado por quien llama.
  - La respuesta es una proyección derivada por el servidor y con ámbito de sesión del inventario activo, incluidas las herramientas del núcleo, plugins, canales y servidores MCP ya descubiertas.
  - `tools.effective` es de solo lectura para MCP: puede proyectar un catálogo MCP de sesión ya preparado a través de la política final de herramientas, pero no crea tiempos de ejecución MCP, conecta transportes ni emite `tools/list`. Si no existe un catálogo ya preparado coincidente, la respuesta puede incluir un aviso como `mcp-not-yet-connected`, `mcp-not-yet-listed` o `mcp-stale-catalog`.
  - Las entradas de herramientas efectivas usan `source="core"`, `source="plugin"`, `source="channel"` o `source="mcp"`.
- Los operadores pueden llamar a `tools.invoke` (`operator.write`) para invocar una herramienta disponible mediante la misma ruta de política del gateway que `/tools/invoke`.
  - `name` es obligatorio. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` son opcionales.
  - Si `sessionKey` y `agentId` están presentes, el agente de la sesión resuelta debe coincidir con `agentId`.
  - Los envoltorios del núcleo solo para propietarios, como `cron`, `gateway` y `nodes`, requieren identidad de propietario/administrador (`operator.admin`), aunque el método `tools.invoke` en sí sea `operator.write`.
  - La respuesta es un sobre orientado al SDK con `ok`, `toolName`, `output` opcional y campos `error` tipados. Las denegaciones por aprobación o política devuelven `ok:false` en la carga útil en lugar de eludir la canalización de política de herramientas del gateway.
- Los operadores pueden llamar a `skills.status` (`operator.read`) para obtener el inventario visible de Skills de un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - La respuesta incluye elegibilidad, requisitos faltantes, comprobaciones de configuración y opciones de instalación saneadas sin exponer valores secretos sin procesar.
- Los operadores pueden llamar a `skills.search` y `skills.detail` (`operator.read`) para metadatos de descubrimiento de ClawHub.
- Los operadores pueden llamar a `skills.upload.begin`, `skills.upload.chunk` y `skills.upload.commit` (`operator.admin`) para preparar un archivo privado de skill antes de instalarlo. Esta es una ruta de carga de administrador separada para clientes de confianza, no el flujo normal de instalación de skills de ClawHub, y está desactivada de forma predeterminada a menos que `skills.install.allowUploadedArchives` esté activado.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` crea una carga vinculada a ese slug y valor de fuerza.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` agrega bytes en el desplazamiento decodificado exacto.
  - `skills.upload.commit({ uploadId, sha256? })` verifica el tamaño final y el SHA-256. La confirmación solo finaliza la carga; no instala la skill.
  - Los archivos de skills cargados son archivos zip que contienen una raíz `SKILL.md`. El nombre del directorio interno del archivo nunca selecciona el destino de instalación.
- Los operadores pueden llamar a `skills.install` (`operator.admin`) en tres modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una carpeta de skill en el directorio `skills/` del espacio de trabajo del agente predeterminado.
  - Modo de carga: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` instala una carga confirmada en el directorio `skills/<slug>` del espacio de trabajo del agente predeterminado. El slug y el valor de fuerza deben coincidir con la solicitud original de `skills.upload.begin`. Este modo se rechaza a menos que `skills.install.allowUploadedArchives` esté activado. La configuración no afecta a las instalaciones de ClawHub.
  - Modo instalador del Gateway: `{ name, installId, timeoutMs? }` ejecuta una acción `metadata.openclaw.install` declarada en el host del gateway. Los clientes antiguos todavía pueden enviar `dangerouslyForceUnsafeInstall`; este campo está obsoleto, se acepta solo por compatibilidad de protocolo y se ignora. Usa `security.installPolicy` para decisiones de instalación propiedad del operador.
- Los operadores pueden llamar a `skills.update` (`operator.admin`) en dos modos:
  - El modo ClawHub actualiza un slug rastreado o todas las instalaciones de ClawHub rastreadas en el espacio de trabajo del agente predeterminado.
  - El modo de configuración parchea valores de `skills.entries.<skillKey>` como `enabled`, `apiKey` y `env`.

### Vistas de `models.list`

`models.list` acepta un parámetro opcional `view`:

- Omitido o `"default"`: comportamiento actual en tiempo de ejecución. Si `agents.defaults.models` está configurado, la respuesta es el catálogo permitido, incluidos los modelos descubiertos dinámicamente para entradas `provider/*`. De lo contrario, la respuesta es el catálogo completo del Gateway.
- `"configured"`: comportamiento de tamaño adecuado para selector. Si `agents.defaults.models` está configurado, sigue teniendo prioridad, incluido el descubrimiento con ámbito de proveedor para entradas `provider/*`. Sin una lista de permitidos, la respuesta usa entradas explícitas de `models.providers.*.models`, con repliegue al catálogo completo solo cuando no existen filas de modelos configuradas.
- `"all"`: catálogo completo del Gateway, omitiendo `agents.defaults.models`. Usa esto para diagnósticos e interfaces de descubrimiento, no para selectores de modelos normales.

## Aprobaciones de ejecución

- Cuando una solicitud de ejecución necesita aprobación, el gateway transmite `exec.approval.requested`.
- Los clientes operadores la resuelven llamando a `exec.approval.resolve` (requiere el ámbito `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadatos de sesión canónicos). Las solicitudes sin `systemRunPlan` se rechazan.
- Después de la aprobación, las llamadas reenviadas `node.invoke system.run` reutilizan ese `systemRunPlan` canónico como el contexto autoritativo de comando/cwd/sesión.
- Si quien llama muta `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` entre la preparación y el reenvío final aprobado de `system.run`, el gateway rechaza la ejecución en lugar de confiar en la carga útil mutada.

## Repliegue de entrega de agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar entrega saliente.
- `bestEffortDeliver=false` mantiene el comportamiento estricto: los destinos de entrega no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite el repliegue a ejecución solo de sesión cuando no se puede resolver ninguna ruta entregable externa (por ejemplo, sesiones internas/webchat o configuraciones multicanal ambiguas).
- Los resultados finales de `agent` pueden incluir `result.deliveryStatus` cuando se solicitó entrega, usando los mismos estados `sent`, `suppressed`, `partial_failed` y `failed` documentados para [`openclaw agent --json --deliver`](/es/cli/agent#json-delivery-status).

## Control de versiones

- `PROTOCOL_VERSION` vive en `packages/gateway-protocol/src/version.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`; el servidor rechaza rangos que no incluyan su protocolo actual. Los clientes y servidores actuales requieren el protocolo v4.
- Los esquemas y modelos se generan a partir de definiciones de TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes del cliente

El cliente de referencia en `src/gateway/client.ts` usa estos valores predeterminados. Los valores son estables en todo el protocolo v4 y son la línea base esperada para clientes de terceros.

| Constante                                 | Predeterminado                                        | Fuente                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Tiempo de espera de solicitud (por RPC)   | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Tiempo de espera de preauth / connect-challenge | `15_000` ms                                      | `src/gateway/handshake-timeouts.ts` (config/env puede aumentar el presupuesto emparejado de servidor/cliente) |
| Reintento inicial con retroceso           | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Retroceso máximo de reconexión            | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Límite de reintento rápido tras cierre por token de dispositivo | `250` ms                         | `src/gateway/client.ts`                                                                    |
| Gracia de detención forzada antes de `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                    | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalo de tick predeterminado (antes de `hello-ok`) | `30_000` ms                                | `src/gateway/client.ts`                                                                    |
| Cierre por tiempo de espera de tick       | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                           |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

El servidor anuncia los valores efectivos de `policy.tickIntervalMs`, `policy.maxPayload` y `policy.maxBufferedBytes` en `hello-ok`; los clientes deben respetar esos valores en lugar de los valores predeterminados previos al handshake.

## Autenticación

- La autenticación del Gateway con secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el modo de autenticación configurado.
- Los modos que portan identidad, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o
  `gateway.auth.mode: "trusted-proxy"` sin loopback, satisfacen la comprobación de autenticación de conexión desde
  los encabezados de la solicitud en lugar de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` de ingreso privado omite por completo la autenticación de conexión con secreto compartido;
  no expongas ese modo en ingresos públicos/no confiables.
- Después del emparejamiento, el Gateway emite un **token de dispositivo** limitado al rol de conexión
  + ámbitos. Se devuelve en `hello-ok.auth.deviceToken` y el cliente debe
  conservarlo para conexiones futuras.
- Los clientes deben conservar el `hello-ok.auth.deviceToken` principal después de cualquier
  conexión correcta.
- Reconectar con ese token de dispositivo **almacenado** también debe reutilizar el conjunto de ámbitos aprobados
  almacenado para ese token. Esto preserva el acceso de lectura/sondeo/estado
  que ya se había concedido y evita reducir silenciosamente las reconexiones a un
  ámbito implícito más estrecho de solo administrador.
- Ensamblaje de autenticación de conexión del lado del cliente (`selectConnectAuth` en
  `src/gateway/client.ts`):
  - `auth.password` es ortogonal y siempre se reenvía cuando está establecido.
  - `auth.token` se completa por orden de prioridad: primero el token compartido explícito,
    luego un `deviceToken` explícito, y después un token por dispositivo almacenado (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` se envía solo cuando nada de lo anterior resolvió un
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La promoción automática de un token de dispositivo almacenado en el reintento único
    `AUTH_TOKEN_MISMATCH` está limitada a **endpoints confiables solamente**:
    loopback, o `wss://` con un `tlsFingerprint` fijado. `wss://` público
    sin fijación no califica.
- El bootstrap con código de configuración incorporado devuelve el
  `hello-ok.auth.deviceToken` del nodo principal más un token de operador acotado en
  `hello-ok.auth.deviceTokens` para transferencia móvil confiable. El token de operador
  incluye `operator.talk.secrets` para lecturas de configuración nativa de Talk y
  excluye `operator.admin` y `operator.pairing`.
- Mientras un bootstrap con código de configuración no basal espera aprobación, los detalles de `PAIRING_REQUIRED`
  incluyen `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  y `pauseReconnect: false`. Los clientes deben seguir reconectando con el mismo
  token de bootstrap hasta que la solicitud se apruebe o el token deje de ser válido.
- Conserva `hello-ok.auth.deviceTokens` solo cuando la conexión usó autenticación de bootstrap
  en un transporte confiable como `wss://` o emparejamiento loopback/local.
- Si un cliente suministra un `deviceToken` **explícito** o `scopes` explícitos, ese
  conjunto de ámbitos solicitado por el llamador sigue siendo autoritativo; los ámbitos en caché solo
  se reutilizan cuando el cliente reutiliza el token por dispositivo almacenado.
- Los tokens de dispositivo se pueden rotar/revocar mediante `device.token.rotate` y
  `device.token.revoke` (requiere el ámbito `operator.pairing`). Rotar o
  revocar un nodo u otro rol no operador también requiere `operator.admin`.
- `device.token.rotate` devuelve metadatos de rotación. Repite el token portador de reemplazo
  solo para llamadas del mismo dispositivo que ya están autenticadas con
  ese token de dispositivo, para que los clientes de solo token puedan conservar su reemplazo antes de
  reconectar. Las rotaciones compartidas/de administrador no repiten el token portador.
- La emisión, rotación y revocación de tokens permanecen acotadas al conjunto de roles aprobados
  registrado en la entrada de emparejamiento de ese dispositivo; la mutación de tokens no puede expandir ni
  apuntar a un rol de dispositivo que la aprobación de emparejamiento nunca concedió.
- Para sesiones de token de dispositivo emparejado, la administración de dispositivos se autolimita salvo que el
  llamador también tenga `operator.admin`: los llamadores no administradores solo pueden administrar el
  token de operador para la entrada de su **propio** dispositivo. La administración de tokens de Node y otros
  no operadores es solo para administradores, incluso para el propio dispositivo del llamador.
- `device.token.rotate` y `device.token.revoke` también comprueban el conjunto de ámbitos del token de operador
  de destino frente a los ámbitos de la sesión actual del llamador. Los llamadores no administradores
  no pueden rotar ni revocar un token de operador más amplio que el que ya poseen.
- Los fallos de autenticación incluyen `error.details.code` más pistas de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes confiables pueden intentar un reintento acotado con un token por dispositivo en caché.
  - Si ese reintento falla, los clientes deben detener los bucles de reconexión automática y mostrar orientación de acción para el operador.
- `AUTH_SCOPE_MISMATCH` significa que el token de dispositivo fue reconocido pero no cubre
  el rol/los ámbitos solicitados. Los clientes no deben presentarlo como un token incorrecto;
  solicita al operador que vuelva a emparejar o apruebe el contrato de ámbitos más estrecho/amplio.

## Identidad de dispositivo + emparejamiento

- Los nodos deben incluir una identidad de dispositivo estable (`device.id`) derivada de una
  huella de par de claves.
- Los Gateways emiten tokens por dispositivo + rol.
- Se requieren aprobaciones de emparejamiento para nuevos ID de dispositivo salvo que esté habilitada la autoaprobación local.
- La autoaprobación de emparejamiento se centra en conexiones directas de local loopback.
- OpenClaw también tiene una ruta estrecha de autoconexión local de backend/contenedor para
  flujos auxiliares confiables con secreto compartido.
- Las conexiones de tailnet o LAN del mismo host siguen tratándose como remotas para el emparejamiento y
  requieren aprobación.
- Los clientes WS normalmente incluyen identidad `device` durante `connect` (operador +
  nodo). Las únicas excepciones de operador sin dispositivo son rutas de confianza explícitas:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad HTTP insegura solo en localhost.
  - autenticación correcta del operador de Control UI con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (último recurso, degradación de seguridad grave).
  - RPC de backend `gateway-client` de loopback directo en la ruta auxiliar interna
    reservada.
- Omitir la identidad de dispositivo tiene consecuencias de ámbito. Cuando una conexión de operador
  sin dispositivo se permite mediante una ruta de confianza explícita, OpenClaw aun así limpia
  los ámbitos autodeclarados a un conjunto vacío salvo que esa ruta tenga una excepción nombrada
  de preservación de ámbitos. Los métodos protegidos por ámbitos fallan entonces con
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` es una ruta de preservación de ámbitos de último recurso de Control UI.
  No concede ámbitos a clientes WebSocket arbitrarios con forma de backend personalizado o CLI.
- La ruta auxiliar reservada de backend `gateway-client` de loopback directo preserva
  ámbitos solo para RPC internas del plano de control local; los ID de backend personalizados no
  reciben esta excepción.
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de autenticación de dispositivo

Para clientes heredados que aún usan el comportamiento de firma previo al desafío, `connect` ahora devuelve
códigos de detalle `DEVICE_AUTH_*` en `error.details.code` con un `error.details.reason` estable.

Fallos comunes de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió en blanco). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto/incorrecto. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga útil de firma no coincide con la carga útil v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella de la clave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falló el formato/canonicalización de la clave pública. |

Objetivo de migración:

- Espera siempre `connect.challenge`.
- Firma la carga útil v2 que incluye el nonce del servidor.
- Envía el mismo nonce en `connect.params.device.nonce`.
- La carga útil de firma preferida es `v3`, que vincula `platform` y `deviceFamily`
  además de los campos device/client/role/scopes/token/nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero la fijación de
  metadatos de dispositivos emparejados aún controla la política de comandos al reconectar.

## TLS + fijación

- TLS es compatible con conexiones WS.
- Los clientes pueden fijar opcionalmente la huella del certificado del Gateway (consulta la configuración
  `gateway.tls` más `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Ámbito

Este protocolo expone la **API completa del Gateway** (estado, canales, modelos, chat,
agente, sesiones, nodos, aprobaciones, etc.). La superficie exacta se define por los
esquemas TypeBox en `packages/gateway-protocol/src/schema.ts`.

## Relacionado

- [Protocolo de puente](/es/gateway/bridge-protocol)
- [Runbook del Gateway](/es/gateway)
