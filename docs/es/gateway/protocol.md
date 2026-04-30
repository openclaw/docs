---
read_when:
    - Implementación o actualización de clientes WS del Gateway
    - Depurar desajustes de protocolo o fallos de conexión
    - Regenerando el esquema/modelos del protocolo
summary: 'Protocolo WebSocket de Gateway: protocolo de enlace, tramas, versionado'
title: Protocolo de Gateway
x-i18n:
    generated_at: "2026-04-30T05:43:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

El protocolo WS del Gateway es el **plano de control único + transporte de nodos** de
OpenClaw. Todos los clientes (CLI, interfaz web, app de macOS, nodos iOS/Android, nodos
sin interfaz) se conectan por WebSocket y declaran su **rol** + **alcance** durante
el handshake.

## Transporte

- WebSocket, tramas de texto con cargas JSON.
- La primera trama **debe** ser una solicitud `connect`.
- Las tramas previas a la conexión tienen un límite de 64 KiB. Después de un handshake correcto, los clientes
  deben seguir los límites `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con diagnósticos habilitados,
  las tramas entrantes sobredimensionadas y los búferes salientes lentos emiten eventos `payload.large`
  antes de que el gateway cierre o descarte la trama afectada. Estos eventos conservan
  tamaños, límites, superficies y códigos de motivo seguros. No conservan el cuerpo del mensaje,
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

Mientras el Gateway sigue terminando de iniciar sidecars, la solicitud `connect` puede
devolver un error reintentable `UNAVAILABLE` con `details.reason` establecido en
`"startup-sidecars"` y `retryAfterMs`. Los clientes deben reintentar esa respuesta
dentro de su presupuesto general de conexión en lugar de mostrarla como un fallo terminal
del handshake.

`server`, `features`, `snapshot` y `policy` son obligatorios según el esquema
(`src/gateway/protocol/schema/frames.ts`). `auth` también es obligatorio e informa
el rol/los alcances negociados. `canvasHostUrl` es opcional.

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
`client.mode: "backend"`) pueden omitir `device` en conexiones directas local loopback cuando
se autentican con el token/contraseña compartidos del gateway. Esta ruta está reservada
para RPC internos del plano de control y evita que las líneas base obsoletas de emparejamiento de CLI/dispositivo
bloqueen trabajo de backend local, como actualizaciones de sesión de subagentes. Los clientes remotos,
clientes de origen de navegador, clientes de nodo y clientes explícitos con token de dispositivo/identidad de dispositivo
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

Durante la entrega de bootstrap confiable, `hello-ok.auth` también puede incluir entradas
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

Para el flujo de bootstrap de nodo/operador integrado, el token de nodo principal mantiene
`scopes: []` y cualquier token de operador entregado queda acotado a la lista de permitidos del operador
de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Las comprobaciones de alcance de bootstrap siguen
prefijadas por rol: las entradas de operador solo satisfacen solicitudes de operador, y los roles
que no son de operador siguen necesitando alcances bajo su propio prefijo de rol.

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

Los métodos RPC de gateway registrados por plugins pueden solicitar su propio alcance de operador, pero
los prefijos administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre se resuelven a `operator.admin`.

El alcance del método es solo la primera barrera. Algunos comandos de barra a los que se llega mediante
`chat.send` aplican comprobaciones más estrictas a nivel de comando además de esa. Por ejemplo, las escrituras persistentes
`/config set` y `/config unset` requieren `operator.admin`.

`node.pair.approve` también tiene una comprobación de alcance adicional en el momento de aprobación, además del
alcance base del método:

- solicitudes sin comandos: `operator.pairing`
- solicitudes con comandos de nodo que no son de ejecución: `operator.pairing` + `operator.write`
- solicitudes que incluyen `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacidades/comandos/permisos (nodo)

Los nodos declaran afirmaciones de capacidad al conectarse:

- `caps`: categorías de capacidad de alto nivel.
- `commands`: lista de permitidos de comandos para invocación.
- `permissions`: conmutadores granulares (por ejemplo, `screen.record`, `camera.capture`).

El Gateway trata esto como **afirmaciones** y aplica listas de permitidos del lado del servidor.

## Presencia

- `system-presence` devuelve entradas indexadas por identidad de dispositivo.
- Las entradas de presencia incluyen `deviceId`, `roles` y `scopes` para que las interfaces puedan mostrar una sola fila por dispositivo
  incluso cuando se conecta como **operator** y **node**.
- `node.list` incluye los campos opcionales `lastSeenAtMs` y `lastSeenReason`. Los nodos conectados informan
  su hora de conexión actual como `lastSeenAtMs` con el motivo `connect`; los nodos emparejados también pueden informar
  presencia duradera en segundo plano cuando un evento de nodo confiable actualiza sus metadatos de emparejamiento.

### Evento de actividad de nodo en segundo plano

Los nodos pueden llamar a `node.event` con `event: "node.presence.alive"` para registrar que un nodo emparejado estaba
activo durante un despertar en segundo plano sin marcarlo como conectado.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` es una enumeración cerrada: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Las cadenas de activador desconocidas son normalizadas a
`background` por el gateway antes de la persistencia. El evento solo es duradero para sesiones de dispositivo de nodo
autenticadas; las sesiones sin dispositivo o no emparejadas devuelven `handled: false`.

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

## Delimitación de alcances de eventos de difusión

Los eventos de difusión WebSocket enviados por el servidor están restringidos por alcance para que las sesiones limitadas a emparejamiento o solo de nodo no reciban pasivamente contenido de sesión.

- **Tramas de chat, agente y resultado de herramienta** (incluidos eventos `agent` transmitidos y resultados de llamadas a herramientas) requieren al menos `operator.read`. Las sesiones sin `operator.read` omiten estas tramas por completo.
- **Difusiones `plugin.*` definidas por plugins** están restringidas a `operator.write` o `operator.admin`, según cómo las haya registrado el plugin.
- **Eventos de estado y transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexión/desconexión, etc.) permanecen sin restricciones para que la salud del transporte sea observable para toda sesión autenticada.
- **Familias de eventos de difusión desconocidas** se restringen por alcance de forma predeterminada (fallan cerradas), salvo que un controlador registrado las relaje explícitamente.

Cada conexión de cliente conserva su propio número de secuencia por cliente para que las difusiones preserven el orden monótono en ese socket, incluso cuando distintos clientes ven distintos subconjuntos filtrados por alcance del flujo de eventos.

## Familias comunes de métodos RPC

La superficie WS pública es más amplia que los ejemplos de handshake/autenticación anteriores. Esto
no es un volcado generado: `hello-ok.features.methods` es una lista conservadora
de descubrimiento creada a partir de `src/gateway/server-methods-list.ts` más las exportaciones de métodos de
plugins/canales cargados. Trátala como descubrimiento de funciones, no como una enumeración completa
de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` devuelve la instantánea de salud del gateway, en caché o recién sondeada.
    - `diagnostics.stability` devuelve el registrador de estabilidad diagnóstica acotado reciente. Conserva metadatos operativos como nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de colas/sesiones, nombres de canales/plugins e ids de sesión. No conserva texto de chat, cuerpos de Webhook, salidas de herramientas, cuerpos sin procesar de solicitud o respuesta, tokens, cookies ni valores secretos. Se requiere alcance de lectura de operador.
    - `status` devuelve el resumen del gateway de estilo `/status`; los campos sensibles solo se incluyen para clientes operadores con alcance de administrador.
    - `gateway.identity.get` devuelve la identidad de dispositivo del gateway usada por los flujos de relay y emparejamiento.
    - `system-presence` devuelve la instantánea de presencia actual para dispositivos operador/nodo conectados.
    - `system-event` agrega un evento de sistema y puede actualizar/difundir el contexto de presencia.
    - `last-heartbeat` devuelve el último evento de Heartbeat persistido.
    - `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el gateway.

  </Accordion>

  <Accordion title="Modelos y uso">
    - `models.list` devuelve el catálogo de modelos permitido por el runtime. Pasa `{ "view": "configured" }` para modelos configurados de tamaño selector (`agents.defaults.models` primero, luego `models.providers.*.models`), o `{ "view": "all" }` para el catálogo completo.
    - `usage.status` devuelve resúmenes de ventanas de uso/cuota restante del proveedor.
    - `usage.cost` devuelve resúmenes agregados de uso de costos para un intervalo de fechas.
    - `doctor.memory.status` devuelve la preparación de memoria vectorial / embeddings en caché para el workspace del agente predeterminado activo. Pasa `{ "probe": true }` o `{ "deep": true }` solo cuando el llamador quiere explícitamente un ping en vivo al proveedor de embeddings.
    - `doctor.memory.remHarness` devuelve una vista previa acotada y de solo lectura del arnés REM para clientes remotos del plano de control. Puede incluir rutas de workspace, fragmentos de memoria, markdown fundamentado renderizado y candidatos de promoción profunda, por lo que los llamadores necesitan `operator.read`.
    - `sessions.usage` devuelve resúmenes de uso por sesión.
    - `sessions.usage.timeseries` devuelve el uso de series temporales de una sesión.
    - `sessions.usage.logs` devuelve entradas del registro de uso de una sesión.

  </Accordion>

  <Accordion title="Canales y ayudantes de inicio de sesión">
    - `channels.status` devuelve resúmenes de estado de canales/plugins integrados + incluidos.
    - `channels.logout` cierra sesión en un canal/cuenta específico cuando el canal admite cierre de sesión.
    - `web.login.start` inicia un flujo de inicio de sesión QR/web para el proveedor actual de canal web compatible con QR.
    - `web.login.wait` espera a que ese flujo de inicio de sesión QR/web se complete e inicia el canal si tiene éxito.
    - `push.test` envía una notificación push APNs de prueba a un nodo iOS registrado.
    - `voicewake.get` devuelve los disparadores de palabra de activación almacenados.
    - `voicewake.set` actualiza los disparadores de palabra de activación y difunde el cambio.

  </Accordion>

  <Accordion title="Mensajería y registros">
    - `send` es el RPC directo de entrega saliente para envíos dirigidos a canal/cuenta/hilo fuera del ejecutor de chat.
    - `logs.tail` devuelve el final configurado del registro de archivo del Gateway con controles de cursor/límite y bytes máximos.

  </Accordion>

  <Accordion title="Talk y TTS">
    - `talk.config` devuelve la carga útil efectiva de configuración de Talk; `includeSecrets` requiere `operator.talk.secrets` (u `operator.admin`).
    - `talk.mode` establece/difunde el estado actual del modo Talk para clientes de WebChat/Control UI.
    - `talk.speak` sintetiza voz mediante el proveedor de voz activo de Talk.
    - `tts.status` devuelve el estado habilitado de TTS, el proveedor activo, los proveedores de respaldo y el estado de configuración del proveedor.
    - `tts.providers` devuelve el inventario visible de proveedores TTS.
    - `tts.enable` y `tts.disable` alternan el estado de preferencias de TTS.
    - `tts.setProvider` actualiza el proveedor TTS preferido.
    - `tts.convert` ejecuta una conversión puntual de texto a voz.

  </Accordion>

  <Accordion title="Secretos, configuración, actualización y asistente">
    - `secrets.reload` vuelve a resolver las SecretRefs activas e intercambia el estado secreto del runtime solo si todo tiene éxito.
    - `secrets.resolve` resuelve asignaciones de secretos dirigidas a comandos para un conjunto específico de comando/objetivo.
    - `config.get` devuelve la instantánea y el hash de la configuración actual.
    - `config.set` escribe una carga útil de configuración validada.
    - `config.patch` fusiona una actualización parcial de configuración.
    - `config.apply` valida + reemplaza la carga útil completa de configuración.
    - `config.schema` devuelve la carga útil del esquema de configuración en vivo usada por Control UI y las herramientas CLI: esquema, `uiHints`, versión y metadatos de generación, incluidos metadatos de esquema de Plugin + canal cuando el runtime puede cargarlos. El esquema incluye metadatos de campo `title` / `description` derivados de las mismas etiquetas y texto de ayuda usados por la UI, incluidas ramas de composición de objeto anidado, comodín, elemento de arreglo y `anyOf` / `oneOf` / `allOf` cuando existe documentación de campo coincidente.
    - `config.schema.lookup` devuelve una carga útil de búsqueda limitada por ruta para una ruta de configuración: ruta normalizada, un nodo de esquema superficial, sugerencia coincidente + `hintPath`, y resúmenes inmediatos de hijos para profundización en UI/CLI. Los nodos de esquema de búsqueda conservan la documentación orientada al usuario y los campos comunes de validación (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos/de cadena/de arreglo/de objeto, y flags como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de hijos exponen `key`, `path` normalizada, `type`, `required`, `hasChildren`, además del `hint` / `hintPath` coincidente.
    - `update.run` ejecuta el flujo de actualización del Gateway y programa un reinicio solo cuando la actualización en sí tuvo éxito.
    - `update.status` devuelve el último centinela de reinicio de actualización en caché, incluida la versión en ejecución posterior al reinicio cuando está disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de onboarding mediante WS RPC.

  </Accordion>

  <Accordion title="Ayudantes de agente y workspace">
    - `agents.list` devuelve entradas de agentes configurados, incluidos el modelo efectivo y los metadatos del runtime.
    - `agents.create`, `agents.update` y `agents.delete` gestionan registros de agentes y cableado de workspace.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` gestionan los archivos de workspace de arranque expuestos para un agente.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o sesión.
    - `agent.wait` espera a que una ejecución finalice y devuelve la instantánea terminal cuando está disponible.

  </Accordion>

  <Accordion title="Control de sesiones">
    - `sessions.list` devuelve el índice de sesiones actual, incluidos metadatos `agentRuntime` por fila cuando hay un backend de runtime de agente configurado.
    - `sessions.subscribe` y `sessions.unsubscribe` alternan las suscripciones a eventos de cambio de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` alternan las suscripciones a eventos de transcripción/mensaje para una sesión.
    - `sessions.preview` devuelve vistas previas acotadas de transcripciones para claves de sesión específicas.
    - `sessions.resolve` resuelve o canonicaliza un objetivo de sesión.
    - `sessions.create` crea una nueva entrada de sesión.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrumpir y dirigir para una sesión activa.
    - `sessions.abort` aborta el trabajo activo de una sesión. Un llamador puede pasar `key` más `runId` opcional, o pasar solo `runId` para ejecuciones activas que el Gateway pueda resolver a una sesión.
    - `sessions.patch` actualiza metadatos/anulaciones de sesión e informa el modelo canónico resuelto más el `agentRuntime` efectivo.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan mantenimiento de sesión.
    - `sessions.get` devuelve la fila completa de sesión almacenada.
    - La ejecución de chat sigue usando `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` está normalizado para visualización para clientes UI: las etiquetas de directiva en línea se eliminan del texto visible, se eliminan las cargas útiles XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y tokens filtrados de control de modelo ASCII/de ancho completo, se omiten filas de asistente con tokens silenciosos puros como `NO_REPLY` / `no_reply` exactos, y las filas demasiado grandes pueden reemplazarse por marcadores de posición.

  </Accordion>

  <Accordion title="Emparejamiento de dispositivos y tokens de dispositivo">
    - `device.pair.list` devuelve dispositivos emparejados pendientes y aprobados.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` gestionan registros de emparejamiento de dispositivos.
    - `device.token.rotate` rota un token de dispositivo emparejado dentro de los límites de su rol aprobado y del alcance del llamador.
    - `device.token.revoke` revoca un token de dispositivo emparejado dentro de los límites de su rol aprobado y del alcance del llamador.

  </Accordion>

  <Accordion title="Emparejamiento de Node, invocación y trabajo pendiente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` y `node.pair.verify` cubren el emparejamiento de nodos y la verificación de arranque.
    - `node.list` y `node.describe` devuelven el estado de nodos conocidos/conectados.
    - `node.rename` actualiza la etiqueta de un nodo emparejado.
    - `node.invoke` reenvía un comando a un nodo conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud de invocación.
    - `node.event` transporta eventos originados en nodos de vuelta al gateway.
    - `node.canvas.capability.refresh` actualiza tokens de capacidad de canvas con alcance.
    - `node.pending.pull` y `node.pending.ack` son las APIs de cola de nodos conectados.
    - `node.pending.enqueue` y `node.pending.drain` gestionan trabajo pendiente duradero para nodos offline/desconectados.

  </Accordion>

  <Accordion title="Familias de aprobación">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` cubren solicitudes de aprobación de ejecución puntuales más búsqueda/reproducción de aprobaciones pendientes.
    - `exec.approval.waitDecision` espera una aprobación de ejecución pendiente y devuelve la decisión final (o `null` en timeout).
    - `exec.approvals.get` y `exec.approvals.set` gestionan instantáneas de política de aprobación de ejecución del gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` gestionan la política de aprobación de ejecución local de Node mediante comandos de retransmisión de nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` cubren flujos de aprobación definidos por Plugin.

  </Accordion>

  <Accordion title="Automatización, Skills y herramientas">
    - Automatización: `wake` programa una inyección de texto de activación inmediata o en el siguiente Heartbeat; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestionan trabajo programado.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Familias comunes de eventos

- `chat`: actualizaciones de chat de UI como `chat.inject` y otros eventos de chat solo de transcripción.
- `session.message` y `session.tool`: actualizaciones de transcripción/flujo de eventos para una sesión suscrita.
- `sessions.changed`: cambió el índice de sesiones o los metadatos.
- `presence`: actualizaciones de instantánea de presencia del sistema.
- `tick`: evento periódico de keepalive / liveness.
- `health`: actualización de instantánea de salud del gateway.
- `heartbeat`: actualización de flujo de eventos Heartbeat.
- `cron`: evento de cambio de ejecución/trabajo Cron.
- `shutdown`: notificación de apagado del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de emparejamiento de Node.
- `node.invoke.request`: difusión de solicitud de invocación de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo emparejado.
- `voicewake.changed`: cambió la configuración de disparadores de palabra de activación.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprobación de ejecución.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprobación de Plugin.

### Métodos auxiliares de Node

- Los nodos pueden llamar a `skills.bins` para obtener la lista actual de ejecutables de Skills para comprobaciones de permiso automático.

### Métodos auxiliares del operador

- Los operadores pueden llamar a `commands.list` (`operator.read`) para obtener el inventario de comandos en tiempo de ejecución de un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo predeterminado del agente.
  - `scope` controla a qué superficie apunta el `name` principal:
    - `text` devuelve el token de comando de texto principal sin la `/` inicial
    - `native` y la ruta predeterminada `both` devuelven nombres nativos conscientes del proveedor cuando están disponibles
  - `textAliases` contiene alias de barra exactos como `/model` y `/m`.
  - `nativeName` contiene el nombre de comando nativo consciente del proveedor cuando existe.
  - `provider` es opcional y solo afecta la nomenclatura nativa más la disponibilidad de comandos nativos de Plugin.
  - `includeArgs=false` omite los metadatos de argumentos serializados de la respuesta.
- Los operadores pueden llamar a `tools.catalog` (`operator.read`) para obtener el catálogo de herramientas en tiempo de ejecución de un agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: propietario del Plugin cuando `source="plugin"`
  - `optional`: si una herramienta de Plugin es opcional
- Los operadores pueden llamar a `tools.effective` (`operator.read`) para obtener el inventario de herramientas efectivo en tiempo de ejecución para una sesión.
  - `sessionKey` es obligatorio.
  - El Gateway deriva el contexto de tiempo de ejecución de confianza desde la sesión en el servidor en lugar de aceptar autenticación o contexto de entrega proporcionados por quien llama.
  - La respuesta está acotada a la sesión y refleja lo que la conversación activa puede usar ahora mismo, incluidas herramientas del núcleo, de Plugin y de canal.
- Los operadores pueden llamar a `skills.status` (`operator.read`) para obtener el inventario visible de Skills de un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo predeterminado del agente.
  - La respuesta incluye elegibilidad, requisitos faltantes, comprobaciones de configuración y opciones de instalación saneadas sin exponer valores secretos sin procesar.
- Los operadores pueden llamar a `skills.search` y `skills.detail` (`operator.read`) para metadatos de descubrimiento de ClawHub.
- Los operadores pueden llamar a `skills.install` (`operator.admin`) en dos modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una carpeta de skill en el directorio `skills/` del espacio de trabajo predeterminado del agente.
  - Modo instalador de Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` ejecuta una acción `metadata.openclaw.install` declarada en el host del Gateway.
- Los operadores pueden llamar a `skills.update` (`operator.admin`) en dos modos:
  - El modo ClawHub actualiza un slug rastreado o todas las instalaciones de ClawHub rastreadas en el espacio de trabajo predeterminado del agente.
  - El modo de configuración parchea valores de `skills.entries.<skillKey>` como `enabled`, `apiKey` y `env`.

### Vistas de `models.list`

`models.list` acepta un parámetro opcional `view`:

- Omitido o `"default"`: comportamiento actual en tiempo de ejecución. Si `agents.defaults.models` está configurado, la respuesta es el catálogo permitido; de lo contrario, la respuesta es el catálogo completo del Gateway.
- `"configured"`: comportamiento del tamaño de un selector. Si `agents.defaults.models` está configurado, sigue teniendo prioridad. De lo contrario, la respuesta usa entradas explícitas de `models.providers.*.models`, recurriendo al catálogo completo solo cuando no existen filas de modelo configuradas.
- `"all"`: catálogo completo del Gateway, omitiendo `agents.defaults.models`. Usa esto para diagnósticos e interfaces de descubrimiento, no para selectores de modelos normales.

## Aprobaciones de exec

- Cuando una solicitud de exec necesita aprobación, el Gateway difunde `exec.approval.requested`.
- Los clientes operadores resuelven llamando a `exec.approval.resolve` (requiere el alcance `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand` canónicos/metadatos de sesión). Las solicitudes sin `systemRunPlan` se rechazan.
- Después de la aprobación, las llamadas reenviadas de `node.invoke system.run` reutilizan ese `systemRunPlan` canónico como contexto autorizado de comando/cwd/sesión.
- Si quien llama muta `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` entre la preparación y el reenvío final aprobado de `system.run`, el Gateway rechaza la ejecución en lugar de confiar en la carga útil mutada.

## Reserva de entrega del agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar entrega saliente.
- `bestEffortDeliver=false` conserva el comportamiento estricto: los destinos de entrega no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite recurrir a ejecución solo de sesión cuando no se puede resolver ninguna ruta entregable externa (por ejemplo, sesiones internas/webchat o configuraciones multicanal ambiguas).

## Versionado

- `PROTOCOL_VERSION` vive en `src/gateway/protocol/schema/protocol-schemas.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`; el servidor rechaza incompatibilidades.
- Los esquemas + modelos se generan a partir de definiciones de TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes del cliente

El cliente de referencia en `src/gateway/client.ts` usa estos valores predeterminados. Los valores son estables en el protocolo v3 y son la base esperada para clientes de terceros.

| Constante                                 | Predeterminado                                        | Fuente                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Tiempo de espera de solicitud (por RPC)   | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Tiempo de espera de preauth / connect-challenge | `15_000` ms                                      | `src/gateway/handshake-timeouts.ts` (config/env puede aumentar el presupuesto emparejado de servidor/cliente) |
| Retroceso inicial de reconexión           | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Retroceso máximo de reconexión            | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Límite de reintento rápido tras cierre de device-token | `250` ms                                  | `src/gateway/client.ts`                                                                    |
| Gracia de detención forzada antes de `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                    | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalo de tick predeterminado (antes de `hello-ok`) | `30_000` ms                              | `src/gateway/client.ts`                                                                    |
| Cierre por tiempo de espera de tick        | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

El servidor anuncia los valores efectivos `policy.tickIntervalMs`, `policy.maxPayload` y `policy.maxBufferedBytes` en `hello-ok`; los clientes deberían respetar esos valores en lugar de los valores predeterminados previos al handshake.

## Autenticación

- La autenticación de Gateway con secreto compartido usa `connect.params.auth.token` o `connect.params.auth.password`, según el modo de autenticación configurado.
- Los modos con identidad, como Tailscale Serve (`gateway.auth.allowTailscale: true`) o `gateway.auth.mode: "trusted-proxy"` no local loopback, satisfacen la comprobación de autenticación de conexión desde los encabezados de solicitud en lugar de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` de ingreso privado omite por completo la autenticación de conexión con secreto compartido; no expongas ese modo en ingresos públicos/no confiables.
- Después del emparejamiento, el Gateway emite un **token de dispositivo** acotado al rol + alcances de la conexión. Se devuelve en `hello-ok.auth.deviceToken` y el cliente debería conservarlo para conexiones futuras.
- Los clientes deberían conservar el `hello-ok.auth.deviceToken` principal después de cualquier conexión correcta.
- Reconectarse con ese token de dispositivo **almacenado** también debería reutilizar el conjunto de alcances aprobados almacenado para ese token. Esto preserva el acceso de lectura/sondeo/estado que ya se concedió y evita reducir silenciosamente las reconexiones a un alcance implícito más estrecho de solo administrador.
- Ensamblado de autenticación de conexión del lado del cliente (`selectConnectAuth` en `src/gateway/client.ts`):
  - `auth.password` es ortogonal y siempre se reenvía cuando está definido.
  - `auth.token` se rellena por orden de prioridad: primero token compartido explícito, luego un `deviceToken` explícito, luego un token almacenado por dispositivo (indexado por `deviceId` + `role`).
  - `auth.bootstrapToken` se envía solo cuando nada de lo anterior resolvió un `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La promoción automática de un token de dispositivo almacenado en el reintento único `AUTH_TOKEN_MISMATCH` está restringida a **endpoints de confianza**: loopback, o `wss://` con un `tlsFingerprint` fijado. `wss://` público sin fijación no califica.
- Las entradas adicionales de `hello-ok.auth.deviceTokens` son tokens de transferencia de bootstrap. Consérvalas solo cuando la conexión usó autenticación bootstrap en un transporte de confianza como `wss://` o emparejamiento loopback/local.
- Si un cliente proporciona un `deviceToken` **explícito** o `scopes` explícitos, ese conjunto de alcances solicitado por quien llama sigue siendo la autoridad; los alcances en caché solo se reutilizan cuando el cliente reutiliza el token almacenado por dispositivo.
- Los tokens de dispositivo se pueden rotar/revocar mediante `device.token.rotate` y `device.token.revoke` (requiere el alcance `operator.pairing`).
- `device.token.rotate` devuelve metadatos de rotación. Refleja el token portador de reemplazo solo para llamadas del mismo dispositivo que ya están autenticadas con ese token de dispositivo, para que los clientes solo de token puedan conservar su reemplazo antes de reconectarse. Las rotaciones compartidas/de administrador no reflejan el token portador.
- La emisión, rotación y revocación de tokens permanecen limitadas al conjunto de roles aprobados registrado en la entrada de emparejamiento de ese dispositivo; la mutación de tokens no puede ampliar ni apuntar a un rol de dispositivo que la aprobación de emparejamiento nunca concedió.
- Para sesiones con token de dispositivo emparejado, la administración de dispositivos está autoacotada salvo que quien llama también tenga `operator.admin`: quienes llaman sin administrador solo pueden eliminar/revocar/rotar la entrada de su **propio** dispositivo.
- `device.token.rotate` y `device.token.revoke` también comprueban el conjunto de alcances del token de operador objetivo frente a los alcances de sesión actuales de quien llama. Quienes llaman sin administrador no pueden rotar ni revocar un token de operador más amplio que el que ya poseen.
- Los errores de autenticación incluyen `error.details.code` más indicaciones de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes de confianza pueden intentar un reintento acotado con un token por dispositivo en caché.
  - Si ese reintento falla, los clientes deberían detener los bucles de reconexión automática y mostrar orientación de acción para el operador.

## Identidad de dispositivo + emparejamiento

- Los Nodes deben incluir una identidad de dispositivo estable (`device.id`) derivada de una
  huella de keypair.
- Los Gateways emiten tokens por dispositivo + rol.
- Se requieren aprobaciones de emparejamiento para nuevos ID de dispositivo a menos que la aprobación automática local
  esté habilitada.
- La aprobación automática de emparejamiento se centra en conexiones directas de local loopback.
- OpenClaw también tiene una ruta limitada de autoconexión backend/local al contenedor para
  flujos auxiliares de secreto compartido de confianza.
- Las conexiones tailnet o LAN del mismo host se siguen tratando como remotas para el emparejamiento y
  requieren aprobación.
- Los clientes WS normalmente incluyen la identidad de `device` durante `connect` (operador +
  node). Las únicas excepciones de operador sin dispositivo son rutas de confianza explícitas:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad HTTP insegura solo en localhost.
  - autenticación correcta de la UI de Control de operador con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, degradación de seguridad grave).
  - RPCs backend directos por loopback de `gateway-client` autenticados con el token/contraseña
    compartido del Gateway.
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de autenticación de dispositivo

Para clientes heredados que aún usan el comportamiento de firma anterior al desafío, `connect` ahora devuelve
códigos de detalle `DEVICE_AUTH_*` en `error.details.code` con un `error.details.reason` estable.

Fallos comunes de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió vacío). |
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
  además de los campos de dispositivo/cliente/rol/alcances/token/nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero la fijación de
  metadatos de dispositivos emparejados aún controla la política de comandos al reconectar.

## TLS + fijación

- TLS es compatible con conexiones WS.
- Los clientes pueden fijar opcionalmente la huella del certificado del Gateway (consulta la configuración
  `gateway.tls` más `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Alcance

Este protocolo expone la **API completa del Gateway** (estado, canales, modelos, chat,
agente, sesiones, nodes, aprobaciones, etc.). La superficie exacta la definen los
esquemas TypeBox en `src/gateway/protocol/schema.ts`.

## Relacionado

- [Protocolo de puente](/es/gateway/bridge-protocol)
- [Runbook del Gateway](/es/gateway)
