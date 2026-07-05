---
read_when:
    - Implementar o actualizar clientes WS de Gateway
    - Depuración de discrepancias de protocolo o fallos de conexión
    - Regenerando el esquema/modelos del protocolo
summary: 'Protocolo WebSocket de Gateway: negociación inicial, tramas, control de versiones'
title: Protocolo Gateway
x-i18n:
    generated_at: "2026-07-05T11:21:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d9df5dd7d7c09d5293d6cebf19ddec23976dd0f6af062d81b93e4947cc3a61b
    source_path: gateway/protocol.md
    workflow: 16
---

El protocolo WS del Gateway es el único plano de control y transporte de nodos para
OpenClaw. Todos los clientes (CLI, interfaz web, aplicación macOS, nodos iOS/Android, nodos
sin interfaz) se conectan mediante WebSocket y declaran un **rol** y un **alcance** durante
el handshake.

## Transporte y encapsulado

- WebSocket, frames de texto, cargas JSON.
- El primer frame **debe** ser una solicitud `connect`.
- Los frames previos a la conexión están limitados a 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Después
  del handshake, siga `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con los diagnósticos habilitados, los frames entrantes
  sobredimensionados y los búferes salientes lentos emiten eventos `payload.large` antes de que
  el gateway cierre o descarte el frame. Estos eventos llevan `surface`, tamaños en bytes,
  límites y un código de motivo seguro, nunca cuerpos de mensaje, contenidos de adjuntos,
  bytes de frame sin procesar, tokens, cookies ni secretos.

Formas de frame:

- Solicitud: `{type:"req", id, method, params}`
- Respuesta: `{type:"res", id, ok, payload|error}`
- Evento: `{type:"event", event, payload, seq?, stateVersion?}`

Los métodos con efectos secundarios requieren claves de idempotencia (consulte el esquema).

## Handshake

Gateway envía un desafío previo a la conexión:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

El cliente responde con `connect`:

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

Gateway responde con `hello-ok`:

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

`server`, `features`, `snapshot`, `policy` y `auth` son todos obligatorios según
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`). `auth`
informa el rol/alcances negociados incluso cuando no se emite ningún token de dispositivo (forma
anterior). `pluginSurfaceUrls` es opcional y asigna nombres de superficies de Plugin (por ejemplo,
`canvas`) a URL alojadas con alcance; puede caducar, por lo que los nodos llaman a
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` para obtener una entrada nueva.
La ruta obsoleta `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
no es compatible; use superficies de Plugin.

Mientras el gateway todavía está terminando sidecars de arranque, `connect` puede devolver un
error `UNAVAILABLE` reintentable con `details.reason: "startup-sidecars"` y
`retryAfterMs`. Reintente dentro de su presupuesto de conexión en lugar de tratarlo como
un fallo terminal del handshake.

Cuando se emite un token de dispositivo, `hello-ok.auth` lo añade:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

El arranque integrado mediante QR/código de configuración es una ruta de transferencia móvil. Una conexión
correcta de código de configuración base devuelve un token de nodo primario más un token de operador
limitado:

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

Esta transferencia de operador está limitada a propósito: lo suficiente para iniciar el bucle de
operador móvil y la configuración nativa, incluido `operator.talk.secrets` para lecturas de configuración
de Talk, pero sin alcances de mutación de emparejamiento y sin `operator.admin`. El acceso más amplio
de emparejamiento/administración necesita un flujo separado de emparejamiento o token aprobado. Persista
`hello-ok.auth.deviceTokens` solo cuando la autenticación de arranque se haya ejecutado sobre un transporte
de confianza (`wss://` o emparejamiento loopback/local).

Los clientes backend de confianza del mismo proceso (`client.id: "gateway-client"`,
`client.mode: "backend"`) pueden omitir `device` en conexiones loopback directas cuando
se autentican con el token/contraseña compartido del gateway. Esta ruta está reservada
para RPC internas del plano de control (por ejemplo, actualizaciones de sesión de subagente) y evita
que las bases obsoletas de emparejamiento CLI/dispositivo bloqueen el trabajo backend local. Los clientes remotos,
de origen navegador, de nodo y de token de dispositivo/identidad de dispositivo explícitos siguen
pasando por las comprobaciones normales de emparejamiento y ampliación de alcance.

### Ejemplo de conexión de nodo

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

Los nodos declaran afirmaciones de capacidad al conectarse:

- `caps`: categorías de alto nivel como `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: lista de permitidos de comandos para invocación.
- `permissions`: conmutadores granulares (por ejemplo, `screen.record`, `camera.capture`).

El gateway trata esto como afirmaciones y aplica listas de permitidos del lado del servidor.

## Roles y alcances

Para el modelo completo de alcance de operador, las comprobaciones en tiempo de aprobación y la semántica de
secreto compartido, consulte [Alcances de operador](/es/gateway/operator-scopes).

Roles:

- `operator`: cliente del plano de control (CLI/UI/automatización).
- `node`: host de capacidades (camera/screen/canvas/system.run).

Alcances de operador (`src/gateway/operator-scopes.ts`), el conjunto cerrado completo:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` requiere `operator.talk.secrets` (u
`operator.admin`). Cuando se incluyen secretos, lea la credencial activa del proveedor de Talk
desde `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
mantiene la forma de origen y puede ser un objeto SecretRef o una cadena redactada.

Los métodos RPC de gateway registrados por Plugin pueden solicitar su propio alcance de operador,
pero estos prefijos reservados del núcleo siempre se resuelven a `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

El alcance del método es solo la primera puerta. Algunos comandos slash alcanzados mediante
`chat.send` aplican comprobaciones más estrictas a nivel de comando: las escrituras persistentes `/config set` y
`/config unset` requieren `operator.admin` incluso para clientes de gateway que
ya tienen un alcance de operador inferior.

`node.pair.approve` tiene una comprobación de alcance adicional en tiempo de aprobación además del alcance
base del método (`operator.pairing`), basada en los `commands` declarados de la solicitud
pendiente (`src/infra/node-pairing-authz.ts`):

| Comandos declarados                                            | Alcances requeridos                    |
| -------------------------------------------------------------- | -------------------------------------- |
| ninguno                                                        | `operator.pairing`                     |
| comandos no exec                                               | `operator.pairing` + `operator.write`  |
| incluye `system.run`, `system.run.prepare` o `system.which`    | `operator.pairing` + `operator.admin`  |

## Presencia

- `system-presence` devuelve entradas indexadas por identidad de dispositivo, incluidos
  `deviceId`, `roles` y `scopes`, para que las UI puedan mostrar una fila por dispositivo incluso
  cuando se conecta como operador y como nodo.
- `node.list` incluye `lastSeenAtMs` y `lastSeenReason` opcionales. Los nodos conectados
  informan la hora de conexión actual con motivo `connect`; los nodos emparejados también pueden
  informar presencia duradera en segundo plano mediante un evento de nodo de confianza.

### Evento de nodo vivo en segundo plano

Los nodos llaman a `node.event` con `event: "node.presence.alive"` para registrar que un
nodo emparejado estuvo vivo durante una activación en segundo plano, sin marcarlo como conectado:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` es un enum cerrado: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Los valores desconocidos se normalizan a
`background` (`src/shared/node-presence.ts`). El evento solo persiste para
sesiones autenticadas de dispositivo de nodo; las sesiones sin dispositivo o no emparejadas devuelven
`handled: false`.

Los gateways correctos devuelven un resultado estructurado:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Los gateways más antiguos pueden devolver solo `{ "ok": true }` para `node.event`; trate eso
como una RPC reconocida, no como persistencia duradera de presencia.

## Alcance de eventos de difusión

Los eventos de difusión enviados por el servidor están protegidos por alcance para que las sesiones con alcance
de emparejamiento o solo de nodo no reciban pasivamente contenido de sesión
(`src/gateway/server-broadcast.ts`):

- Los frames de chat, agente y resultado de herramientas (eventos `agent` transmitidos, eventos de resultado
  de herramientas) requieren al menos `operator.read`. Las sesiones sin él omiten estos
  frames por completo.
- Las difusiones `plugin.*` definidas por Plugin están protegidas por `operator.write` u
  `operator.admin` de forma predeterminada; las entradas explícitas como
  `plugin.approval.requested` / `plugin.approval.resolved` usan
  `operator.approvals` en su lugar.
- Los eventos de estado/transporte (`heartbeat`, `presence`, `tick`, ciclo de vida de conexión/desconexión)
  permanecen sin restricciones para que la salud del transporte sea observable para toda
  sesión autenticada.
- Las familias desconocidas de eventos de difusión están protegidas por alcance de forma predeterminada (fallo cerrado)
  salvo que un manejador registrado las relaje explícitamente.

Cada conexión de cliente mantiene su propio número de secuencia por cliente, por lo que las difusiones
se mantienen ordenadas monótonamente en ese socket incluso cuando distintos clientes ven
subconjuntos diferentes filtrados por alcance del flujo de eventos.

## Familias de métodos RPC

`hello-ok.features.methods` es una lista conservadora de descubrimiento construida a partir de
`src/gateway/server-methods-list.ts` más las exportaciones de métodos de Plugin/canal cargadas:
no es un volcado generado de todos los métodos, y algunos métodos (por
ejemplo `push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
se excluyen intencionadamente del descubrimiento aunque sean métodos reales e invocables.
Trátelo como descubrimiento de características, no como una enumeración completa de
`src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Sistema e identidad">
    - `health` devuelve la instantánea de salud del Gateway en caché o recién sondeada.
    - `diagnostics.stability` devuelve el registrador reciente y acotado de estabilidad diagnóstica: nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de cola/sesión, nombres de canales/Plugin, ids de sesión. Sin texto de chat, cuerpos de Webhook, salidas de herramientas, cuerpos sin procesar de solicitudes/respuestas, tokens, cookies ni secretos. Requiere `operator.read`.
    - `status` devuelve el resumen del Gateway tipo `/status`; los campos sensibles solo para clientes operadores con ámbito de administrador.
    - `gateway.identity.get` devuelve la identidad del dispositivo Gateway usada por los flujos de retransmisión y emparejamiento.
    - `system-presence` devuelve la instantánea de presencia actual para dispositivos operador/Node conectados.
    - `system-event` agrega un evento del sistema y puede actualizar/difundir el contexto de presencia.
    - `last-heartbeat` devuelve el evento Heartbeat persistido más reciente.
    - `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el Gateway.

  </Accordion>

  <Accordion title="Modelos y uso">
    - `models.list` devuelve el catálogo de modelos permitido en tiempo de ejecución. Consulta las vistas de "`models.list`" más abajo.
    - `usage.status` devuelve ventanas de uso de proveedores/resúmenes de cuota restante.
    - `usage.cost` devuelve resúmenes agregados de uso de costos para un intervalo de fechas. Pasa `agentId` para un agente, o `agentScope: "all"` para agregar agentes configurados.
    - `doctor.memory.status` devuelve la preparación de memoria vectorial / embeddings en caché para el espacio de trabajo del agente predeterminado activo. Pasa `{ "probe": true }` o `{ "deep": true }` solo para un ping explícito en vivo al proveedor de embeddings. Pasa `{ "agentId": "agent-id" }` para limitar las estadísticas del almacén de Dreaming a un espacio de trabajo de agente; omitirlo agrega los espacios de trabajo de Dreaming configurados.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` y `doctor.memory.dedupeDreamDiary` aceptan el parámetro opcional `{ "agentId": "agent-id" }`; si se omite, operan sobre el espacio de trabajo del agente predeterminado configurado.
    - `doctor.memory.remHarness` devuelve una vista previa acotada y de solo lectura del arnés REM para clientes remotos del plano de control, incluidas rutas de espacios de trabajo, fragmentos de memoria, Markdown fundamentado renderizado y candidatos de promoción profunda. Requiere `operator.read`.
    - `sessions.usage` devuelve resúmenes de uso por sesión. Pasa `agentId` para un agente, o `agentScope: "all"` para listar juntos los agentes configurados.
    - `sessions.usage.timeseries` devuelve el uso de series temporales para una sesión.
    - `sessions.usage.logs` devuelve entradas de registro de uso para una sesión.

  </Accordion>

  <Accordion title="Canales y ayudantes de inicio de sesión">
    - `channels.status` devuelve resúmenes de estado de canales/Plugin integrados + incluidos.
    - `channels.logout` cierra sesión en un canal/cuenta específico cuando el canal lo admite.
    - `web.login.start` inicia un flujo de inicio de sesión QR/web para el proveedor de canal web actual compatible con QR.
    - `web.login.wait` espera a que ese flujo se complete e inicia el canal si tiene éxito.
    - `push.test` envía una notificación push APNs de prueba a un Node iOS registrado.
    - `voicewake.get` devuelve los activadores de palabra de activación almacenados.
    - `voicewake.set` actualiza los activadores de palabra de activación y difunde el cambio.

  </Accordion>

  <Accordion title="Mensajería y registros">
    - `send` es el RPC directo de entrega saliente para envíos dirigidos a canal/cuenta/hilo fuera del ejecutor de chat.
    - `logs.tail` devuelve la cola del registro de archivo del Gateway configurado con controles de cursor/límite y máximo de bytes.

  </Accordion>

  <Accordion title="Terminal de operador">
    - `terminal.open` inicia una PTY del host para un `agentId` explícito o el agente predeterminado, y devuelve el agente resuelto, el directorio de trabajo, la shell y el estado de confinamiento.
    - `terminal.input`, `terminal.resize` y `terminal.close` operan solo sobre sesiones propiedad de la conexión que llama.
    - Los eventos `terminal.data` y `terminal.exit` se transmiten solo a la conexión propietaria de la sesión.
    - Las sesiones cuya conexión se cae se separan, no se terminan: permanecen reanudables durante `gateway.terminal.detachedSessionTimeoutSeconds` (predeterminado 300; `0` restaura terminar al desconectar) mientras la salida reciente se acumula en un búfer acotado del lado del servidor.
    - `terminal.list` devuelve sesiones adjuntables; `terminal.attach` vuelve a vincular una sesión activa o separada a la conexión que llama y devuelve el búfer de reproducción (toma de control estilo tmux — un propietario activo anterior recibe `terminal.exit` con motivo `detached`); `terminal.text` lee el búfer como texto plano sin adjuntarse.
    - Cada método de terminal requiere `operator.admin`; `gateway.terminal.enabled` debe ser explícitamente true. Se rechazan los agentes completamente aislados, y un cambio de política de agente cierra las PTY existentes y en curso, incluidas las separadas.

  </Accordion>

  <Accordion title="Talk y TTS">
    - `talk.catalog` devuelve el catálogo de proveedores Talk de solo lectura para voz, transcripción en streaming y voz en tiempo real: ids canónicos de proveedores, alias de registro, etiquetas, estado configurado, un resultado `ready` opcional a nivel de grupo, ids de modelos/voces expuestos, modos canónicos, transportes, estrategias de cerebro y marcas de audio/capacidades en tiempo real, sin devolver secretos de proveedores ni mutar la configuración global. Los Gateways actuales establecen `ready` después de aplicar la selección de proveedor en tiempo de ejecución; trata su ausencia como no verificada en Gateways antiguos.
    - `talk.config` devuelve la carga útil efectiva de configuración de Talk; `includeSecrets` requiere `operator.talk.secrets` (o `operator.admin`).
    - `talk.session.create` crea una sesión Talk propiedad del Gateway para `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. Para `stt-tts/managed-room`, los llamadores `operator.write` que pasan `sessionKey` también deben pasar `spawnedBy` para visibilidad de clave de sesión con ámbito; la creación de `sessionKey` sin ámbito y `brain: "direct-tools"` requieren `operator.admin`.
    - `talk.session.join` valida un token de sesión de sala administrada, emite `session.ready` o `session.replaced` según sea necesario, y devuelve metadatos de sala/sesión más eventos Talk recientes, nunca el token en texto plano ni su hash.
    - `talk.session.appendAudio` agrega audio de entrada PCM en base64 a sesiones de retransmisión en tiempo real y transcripción propiedad del Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` y `talk.session.cancelTurn` impulsan el ciclo de vida de turnos de sala administrada con rechazo de turnos obsoletos antes de que se borre el estado.
    - `talk.session.cancelOutput` detiene la salida de audio del asistente, principalmente para interrupción con VAD en sesiones de retransmisión del Gateway.
    - `talk.session.submitToolResult` completa una llamada a herramienta de proveedor emitida por una sesión de retransmisión en tiempo real propiedad del Gateway. Pasa `options: { willContinue: true }` para salida intermedia de herramienta cuando seguirá un resultado final, u `options: { suppressResponse: true }` cuando el resultado de la herramienta deba satisfacer la llamada del proveedor sin iniciar otra respuesta en tiempo real.
    - `talk.session.steer` envía control de voz de ejecución activa a una sesión Talk respaldada por agente y propiedad del Gateway: `{ sessionId, text, mode? }`, donde `mode` es `status`, `steer`, `cancel` o `followup`; el modo omitido se clasifica a partir del texto hablado.
    - `talk.session.close` cierra una sesión de retransmisión, transcripción o sala administrada propiedad del Gateway y emite eventos Talk terminales.
    - `talk.mode` establece/difunde el estado actual del modo Talk para clientes WebChat/Control UI.
    - `talk.client.create` crea una sesión de proveedor en tiempo real propiedad del cliente usando `webrtc` o `provider-websocket`, mientras el Gateway posee la configuración, credenciales, instrucciones y política de herramientas.
    - `talk.client.toolCall` permite que transportes en tiempo real propiedad del cliente reenvíen llamadas a herramientas del proveedor a la política del Gateway. La primera herramienta admitida es `openclaw_agent_consult`; los clientes reciben un id de ejecución y esperan eventos normales del ciclo de vida de chat antes de enviar el resultado de herramienta específico del proveedor.
    - `talk.client.steer` envía control de voz de ejecución activa para transportes en tiempo real propiedad del cliente. El Gateway resuelve la ejecución integrada activa desde `sessionKey` y devuelve un resultado estructurado aceptado/rechazado en lugar de descartar silenciosamente la dirección.
    - `talk.event` es el canal único de eventos Talk para adaptadores en tiempo real, transcripción, STT/TTS, sala administrada, telefonía y reuniones.
    - `talk.speak` sintetiza voz mediante el proveedor de voz Talk activo.
    - `tts.status` devuelve el estado habilitado de TTS, el proveedor activo, proveedores de fallback y el estado de configuración de proveedores.
    - `tts.providers` devuelve el inventario visible de proveedores TTS.
    - `tts.enable` y `tts.disable` activan o desactivan el estado de preferencias TTS.
    - `tts.setProvider` actualiza el proveedor TTS preferido.
    - `tts.convert` ejecuta una conversión puntual de texto a voz.

  </Accordion>

  <Accordion title="Secretos, configuración, actualización y asistente">
    - `secrets.reload` vuelve a resolver SecretRefs activos e intercambia el estado de secretos en tiempo de ejecución solo si todo tiene éxito.
    - `secrets.resolve` resuelve asignaciones de secretos dirigidas a comandos para un conjunto específico de comando/objetivo.
    - `config.get` devuelve la instantánea y el hash de configuración actuales.
    - `config.set` escribe una carga útil de configuración validada.
    - `config.patch` fusiona una actualización parcial de configuración. El reemplazo destructivo de arrays requiere la ruta afectada en `replacePaths`; los arrays anidados bajo entradas de array usan rutas `[]` como `agents.list[].skills`.
    - `config.apply` valida + reemplaza la carga útil completa de configuración.
    - `config.schema` devuelve la carga útil del esquema de configuración en vivo usada por Control UI y herramientas CLI: esquema, `uiHints`, versión, metadatos de generación, metadatos de esquema de Plugin + canal cuando se pueden cargar. Incluye metadatos `title` / `description` del mismo texto de etiquetas/ayuda que la UI, incluidas ramas de composición de objetos anidados, comodines, elementos de array y `anyOf` / `oneOf` / `allOf` cuando existe documentación de campo coincidente.
    - `config.schema.lookup` devuelve una carga útil de búsqueda con ámbito de ruta para una ruta de configuración: ruta normalizada, un nodo de esquema superficial, pista coincidente + `hintPath`, `reloadKind` opcional y resúmenes de hijos inmediatos para exploración UI/CLI. `reloadKind` es uno de `restart`, `hot` o `none` (`src/config/schema.ts`) y refleja el planificador de recarga de configuración del Gateway para la ruta solicitada. Los nodos de esquema de búsqueda conservan la documentación orientada al usuario y campos comunes de validación (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos/de cadena/array/objeto, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de hijos exponen `key`, `path` normalizada, `type`, `required`, `hasChildren`, `reloadKind` opcional, además del `hint` / `hintPath` coincidente.
    - `update.run` ejecuta el flujo de actualización del Gateway y programa un reinicio solo si la actualización tuvo éxito; los llamadores con una sesión pueden incluir `continuationMessage` para que el arranque reanude un turno de agente de seguimiento a través de la cola de continuación de reinicio. Las actualizaciones del gestor de paquetes y las actualizaciones supervisadas de checkout de git desde el plano de control usan un traspaso de servicio administrado separado en lugar de reemplazar el árbol de paquetes o mutar la salida de checkout/build dentro del Gateway activo. Un traspaso iniciado devuelve `ok: true` con `result.reason: "managed-service-handoff-started"` y `handoff.status: "started"`; traspasos no disponibles o fallidos devuelven `ok: false` con `managed-service-handoff-unavailable` o `managed-service-handoff-failed`, además de `handoff.command` cuando se requiere una actualización manual de shell. No disponible significa que OpenClaw carece de un límite de supervisor seguro o de una identidad de servicio duradera, como `OPENCLAW_SYSTEMD_UNIT` para systemd. Durante un traspaso iniciado, el centinela de reinicio puede informar brevemente `stats.reason: "restart-health-pending"`; la continuación se retrasa hasta que la CLI verifica el Gateway reiniciado y escribe el centinela final `ok`.
    - `update.status` actualiza y devuelve el centinela de reinicio de actualización más reciente, incluida la versión en ejecución posterior al reinicio cuando esté disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de incorporación mediante WS RPC.

  </Accordion>

  <Accordion title="Ayudantes de agente y área de trabajo">
    - `agents.list` devuelve las entradas de agente configuradas, incluidos el modelo efectivo y los metadatos de runtime.
    - `agents.create`, `agents.update` y `agents.delete` gestionan los registros de agentes y el cableado del área de trabajo.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` gestionan los archivos de inicialización del área de trabajo expuestos para un agente.
    - `tasks.list`, `tasks.get` y `tasks.cancel` exponen el registro de tareas del Gateway a clientes SDK y operadores. Consulta [RPC del registro de tareas](#task-ledger-rpcs) abajo.
    - `artifacts.list`, `artifacts.get` y `artifacts.download` exponen resúmenes de artefactos derivados de la transcripción y descargas para un ámbito explícito de `sessionKey`, `runId` o `taskId`. Las consultas de ejecución y tarea resuelven la sesión propietaria en el servidor y solo devuelven medios de transcripción con procedencia coincidente; las fuentes de URL no seguras o locales devuelven descargas no compatibles en lugar de recuperarse en el servidor.
    - `environments.list` y `environments.status` exponen descubrimiento de entornos locales del Gateway y de Node de solo lectura para clientes SDK.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o sesión.
    - `agent.wait` espera a que una ejecución termine y devuelve la instantánea terminal cuando está disponible.

  </Accordion>

  <Accordion title="Control de sesión">
    - `sessions.list` devuelve el índice de sesiones actual, incluidos los metadatos `agentRuntime` por fila cuando hay configurado un backend de runtime de agente.
    - `sessions.subscribe` y `sessions.unsubscribe` alternan las suscripciones a eventos de cambio de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` alternan las suscripciones a eventos de transcripción/mensaje para una sesión.
    - `sessions.preview` devuelve vistas previas acotadas de transcripciones para claves de sesión específicas.
    - `sessions.describe` devuelve una fila de sesión del Gateway para una clave de sesión exacta.
    - `sessions.resolve` resuelve o canonicaliza un destino de sesión.
    - `sessions.create` crea una nueva entrada de sesión.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrumpir y dirigir para una sesión activa.
    - `sessions.abort` aborta el trabajo activo de una sesión. Pasa `key` más `runId` opcional, o solo `runId` para ejecuciones activas que el Gateway puede resolver a una sesión.
    - `sessions.patch` actualiza metadatos/anulaciones de sesión e informa el modelo canónico resuelto más el `agentRuntime` efectivo.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan mantenimiento de sesión.
    - `sessions.get` devuelve la fila completa de sesión almacenada.
    - La ejecución de chat todavía usa `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` se normaliza para visualización en clientes de UI: las etiquetas de directivas en línea se eliminan del texto visible, las cargas XML de llamadas a herramientas en texto sin formato (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y los tokens de control de modelo ASCII/ancho completo filtrados se eliminan, las filas de asistente con solo tokens silenciosos puros (`NO_REPLY` / `no_reply` exactos) se omiten, y las filas demasiado grandes pueden reemplazarse con marcadores de posición.
    - `chat.message.get` es el lector aditivo acotado de mensaje completo para una única entrada visible de transcripción. Pasa `sessionKey`, `agentId` opcional cuando la selección de sesión está delimitada por agente, y un `messageId` de transcripción expuesto previamente mediante `chat.history`; el Gateway devuelve la misma proyección normalizada para visualización sin el límite ligero de truncamiento de historial cuando la entrada almacenada sigue disponible y no es demasiado grande.
    - `chat.send` acepta `fastMode: "auto"` de un turno para usar el modo rápido en llamadas de modelo iniciadas antes del corte automático, y luego iniciar llamadas posteriores de reintento, fallback, resultado de herramienta o continuación sin modo rápido. El corte predeterminado es de 60 segundos (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) y puede configurarse por modelo con `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un llamador de `chat.send` puede pasar `fastAutoOnSeconds` de un turno para anular el corte de esa solicitud.

  </Accordion>

  <Accordion title="Emparejamiento de dispositivos y tokens de dispositivo">
    - `device.pair.list` devuelve dispositivos emparejados pendientes y aprobados.
    - `device.pair.setupCode` crea un código de configuración móvil y, de forma predeterminada, una URL de datos QR PNG. Requiere `operator.admin` y se omite intencionalmente del descubrimiento anunciado. El resultado incluye `setupCode`, `qrDataUrl` opcional, `gatewayUrl`, la etiqueta no secreta `auth` y `urlSource`.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` gestionan registros de emparejamiento de dispositivos.
    - `device.token.rotate` rota un token de dispositivo emparejado dentro de los límites de su rol aprobado y del ámbito del llamador.
    - `device.token.revoke` revoca un token de dispositivo emparejado dentro de los límites de su rol aprobado y del ámbito del llamador.

    El código de configuración incorpora una credencial de inicialización de corta duración. Los clientes no deben
    registrarla ni conservarla más allá del flujo de emparejamiento.

  </Accordion>

  <Accordion title="Emparejamiento de Node, invocación y trabajo pendiente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` y `node.pair.verify` cubren el emparejamiento de Node y la verificación de inicialización.
    - `node.list` y `node.describe` devuelven el estado de Node conocidos/conectados.
    - `node.rename` actualiza una etiqueta de Node emparejado.
    - `node.invoke` reenvía un comando a un Node conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud de invocación.
    - `node.event` transporta eventos originados en Node de vuelta al Gateway.
    - `node.pending.pull` y `node.pending.ack` son las API de cola de Node conectados.
    - `node.pending.enqueue` y `node.pending.drain` gestionan trabajo pendiente duradero para Node sin conexión/desconectados.

  </Accordion>

  <Accordion title="Familias de aprobación">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` cubren solicitudes de aprobación exec de una sola vez más búsqueda/reproducción de aprobaciones pendientes.
    - `exec.approval.waitDecision` espera una aprobación exec pendiente y devuelve la decisión final (o `null` en caso de tiempo de espera).
    - `exec.approvals.get` y `exec.approvals.set` gestionan instantáneas de política de aprobación exec del Gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` gestionan la política de aprobación exec local de Node mediante comandos de relé de Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` cubren flujos de aprobación definidos por Plugin.

  </Accordion>

  <Accordion title="Automatización, Skills y herramientas">
    - Automatización: `wake` programa una inyección inmediata o en el siguiente Heartbeat de texto de activación; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestionan trabajo programado.
    - `cron.run` sigue siendo un RPC de estilo encolado para ejecuciones manuales. Los clientes que necesiten semántica de finalización deben leer el `runId` devuelto y sondear `cron.runs`.
    - `cron.runs` acepta un filtro `runId` opcional no vacío para que los clientes puedan seguir una ejecución manual encolada sin competir con otras entradas de historial del mismo trabajo.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Consulta [Métodos auxiliares de operador](#operator-helper-methods) abajo.

  </Accordion>
</AccordionGroup>

### Familias comunes de eventos

- `chat`: actualizaciones de chat de UI como `chat.inject` y otros eventos de chat
  solo de transcripción. En el protocolo v4, las cargas delta llevan `deltaText`; `message` sigue siendo
  la instantánea acumulativa del asistente. Los reemplazos que no son de prefijo establecen
  `replace=true` y usan `deltaText` como texto de reemplazo.
- `session.message`, `session.operation`, `session.tool`: actualizaciones de transcripción, operación de sesión
  en curso y flujo de eventos para una sesión suscrita.
- `sessions.changed`: el índice de sesiones o los metadatos cambiaron.
- `presence`: actualizaciones de instantánea de presencia del sistema.
- `tick`: evento periódico de keepalive/actividad.
- `health`: actualización de instantánea de salud del Gateway.
- `heartbeat`: actualización de flujo de eventos de Heartbeat.
- `cron`: evento de cambio de ejecución/trabajo de Cron.
- `shutdown`: notificación de apagado del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de emparejamiento de Node.
- `node.invoke.request`: difusión de solicitud de invocación de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo emparejado.
- `voicewake.changed`: cambió la configuración del disparador de palabra de activación.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprobación
  exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprobación
  de Plugin.

### Métodos auxiliares de Node

Los Node pueden llamar a `skills.bins` para obtener la lista actual de ejecutables de skill
para comprobaciones de permiso automático.

## RPC del registro de tareas

Los clientes operadores inspeccionan y cancelan registros de tareas en segundo plano del Gateway mediante
los RPC del registro de tareas (`packages/gateway-protocol/src/schema/tasks.ts`). Estos
devuelven resúmenes de tareas saneados, no estado de runtime sin procesar.

- `tasks.list` requiere `operator.read`.
  - Parámetros: `status` opcional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` o `"timed_out"`) o un arreglo de esos estados,
    `agentId` opcional, `sessionKey` opcional, `limit` opcional de `1` a
    `500`, y cadena `cursor` opcional.
  - Resultado: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` requiere `operator.read`.
  - Parámetros: `{ "taskId": string }`.
  - Resultado: `{ "task": TaskSummary }`.
  - Los ids de tarea faltantes devuelven la forma de error no encontrado del Gateway.
- `tasks.cancel` requiere `operator.write`.
  - Parámetros: `{ "taskId": string, "reason"?: string }`.
  - Resultado: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informa si el registro tenía una tarea coincidente. `cancelled`
    informa si el runtime aceptó o registró la cancelación.

`TaskSummary` incluye `id`, `status` y metadatos opcionales: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, marcas de tiempo, progreso,
resumen terminal y texto de error saneado. `agentId` identifica el agente
que ejecuta la tarea; `sessionKey` y `ownerKey` preservan el contexto de solicitante y control.

## Métodos auxiliares de operador

- `commands.list` (`operator.read`) obtiene el inventario de comandos en tiempo de ejecución para
  un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - `scope` controla a qué superficie apunta el `name` principal: `text` devuelve
    el token principal del comando de texto sin la `/` inicial; `native` y la ruta
    predeterminada `both` devuelven nombres nativos con conocimiento del proveedor cuando están disponibles.
  - `textAliases` contiene alias de barra exactos como `/model` y `/m`.
  - `nativeName` contiene el nombre del comando nativo con conocimiento del proveedor cuando
    existe uno.
  - `provider` es opcional y solo afecta la nomenclatura nativa y la disponibilidad
    de comandos nativos de Plugin.
  - `includeArgs=false` omite de la respuesta los metadatos de argumentos serializados.
- `tools.catalog` (`operator.read`) obtiene el catálogo de herramientas en tiempo de ejecución para un
  agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: propietario del Plugin cuando `source="plugin"`
  - `optional`: si una herramienta de Plugin es opcional
- `tools.effective` (`operator.read`) obtiene el inventario de herramientas efectivo en tiempo
  de ejecución para una sesión.
  - `sessionKey` es obligatorio.
  - El Gateway deriva el contexto confiable de tiempo de ejecución desde la sesión en el servidor
    en lugar de aceptar autenticación o contexto de entrega proporcionados por quien llama.
  - La respuesta es una proyección derivada por el servidor y con alcance de sesión del inventario
    activo, incluidas las herramientas del núcleo, Plugin, canal y servidores MCP ya descubiertos.
  - `tools.effective` es de solo lectura para MCP: puede proyectar un catálogo MCP de sesión activa
    a través de la política final de herramientas, pero no crea tiempos de ejecución MCP,
    conecta transportes ni emite `tools/list`. Si no existe ningún catálogo activo coincidente,
    la respuesta puede incluir un aviso como `mcp-not-yet-connected`,
    `mcp-not-yet-listed` o `mcp-stale-catalog`.
  - Las entradas de herramientas efectivas usan `source="core"`, `source="plugin"`,
    `source="channel"` o `source="mcp"`.
- `tools.invoke` (`operator.write`) invoca una herramienta disponible a través de la
  misma ruta de política del Gateway que `/tools/invoke`.
  - `name` es obligatorio. `args`, `sessionKey`, `agentId`, `confirm` e
    `idempotencyKey` son opcionales.
  - Si tanto `sessionKey` como `agentId` están presentes, el agente de sesión resuelto
    debe coincidir con `agentId`.
  - Los envoltorios del núcleo solo para propietarios como `cron`, `gateway` y `nodes` requieren
    identidad de propietario/administrador (`operator.admin`), aunque `tools.invoke` en sí
    sea `operator.write`.
  - La respuesta es un sobre orientado al SDK con `ok`, `toolName`, `output` opcional
    y campos `error` tipados. Las denegaciones de aprobación o política devuelven
    `ok:false` en la carga útil en lugar de omitir la canalización de política de herramientas
    del Gateway.
- `skills.status` (`operator.read`) obtiene el inventario visible de Skills para un
  agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - La respuesta incluye elegibilidad, requisitos faltantes, comprobaciones de configuración
    y opciones de instalación saneadas sin exponer valores secretos sin procesar.
- `skills.search` y `skills.detail` (`operator.read`) devuelven metadatos de
  descubrimiento de ClawHub.
- `skills.upload.begin`, `skills.upload.chunk` y `skills.upload.commit`
  (`operator.admin`) preparan un archivo privado de Skill antes de instalarlo. Esta
  es una ruta separada de carga de administrador para clientes confiables, no el flujo normal
  de instalación de Skills de ClawHub, y está deshabilitada de forma predeterminada a menos que
  `skills.install.allowUploadedArchives` esté habilitado.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    crea una carga vinculada a ese slug y valor de force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` agrega bytes en
    el desplazamiento decodificado exacto.
  - `skills.upload.commit({ uploadId, sha256? })` verifica el tamaño final y
    SHA-256. La confirmación solo finaliza la carga; no instala el Skill.
  - Los archivos de Skills cargados son archivos zip que contienen una raíz `SKILL.md`. El
    nombre del directorio interno del archivo nunca selecciona el destino de instalación.
- `skills.install` (`operator.admin`) tiene tres modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una
    carpeta de Skill en el directorio `skills/` del espacio de trabajo del agente predeterminado.
  - Modo de carga: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instala una carga confirmada en el directorio `skills/<slug>` del espacio de trabajo
    del agente predeterminado. El slug y el valor de force deben coincidir con la
    solicitud original `skills.upload.begin`. Se rechaza a menos que
    `skills.install.allowUploadedArchives` esté habilitado; la configuración no
    afecta las instalaciones de ClawHub.
  - Modo de instalador del Gateway: `{ name, installId, timeoutMs? }` ejecuta una acción
    `metadata.openclaw.install` declarada en el host del Gateway. Los clientes antiguos aún pueden
    enviar `dangerouslyForceUnsafeInstall`; este campo está obsoleto,
    se acepta solo por compatibilidad de protocolo y se ignora. Usa
    `security.installPolicy` para decisiones de instalación propiedad del operador.
- `skills.update` (`operator.admin`) tiene dos modos:
  - El modo ClawHub actualiza un slug rastreado o todas las instalaciones rastreadas de ClawHub en
    el espacio de trabajo del agente predeterminado.
  - El modo de configuración parchea valores de `skills.entries.<skillKey>` como `enabled`,
    `apiKey` y `env`.

### Vistas de `models.list`

`models.list` acepta un parámetro opcional `view`
(`src/agents/model-catalog-visibility.ts`):

- Omitido o `"default"`: si `agents.defaults.models` está configurado, la
  respuesta es el catálogo permitido, incluidos los modelos descubiertos dinámicamente
  para entradas `provider/*`. De lo contrario, la respuesta es el catálogo completo del
  Gateway.
- `"configured"`: comportamiento con tamaño de selector. Si `agents.defaults.models` está
  configurado, sigue teniendo prioridad, incluido el descubrimiento con alcance de proveedor para
  entradas `provider/*`. Sin una lista de permitidos, la respuesta usa entradas explícitas
  `models.providers.<provider>.models`, con reserva al catálogo completo
  solo cuando no existen filas de modelos configuradas.
- `"all"`: catálogo completo del Gateway, omitiendo `agents.defaults.models`. Úsalo para
  interfaces de diagnóstico/descubrimiento, no para selectores de modelos normales.

## Aprobaciones de exec

- Cuando una solicitud de exec necesita aprobación, el Gateway transmite
  `exec.approval.requested`.
- Los clientes operadores resuelven llamando a `exec.approval.resolve` (requiere
  `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan`
  (`argv`/`cwd`/`rawCommand`/metadatos de sesión canónicos). Las solicitudes sin
  `systemRunPlan` se rechazan.
- Después de la aprobación, las llamadas reenviadas `node.invoke system.run` reutilizan ese
  `systemRunPlan` canónico como contexto autoritativo de comando/cwd/sesión.
- Si quien llama muta `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` entre la preparación y el reenvío final aprobado de `system.run`,
  el Gateway rechaza la ejecución en lugar de confiar en la carga útil mutada.

## Reserva de entrega del agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar entrega saliente.
- `bestEffortDeliver=false` (valor predeterminado) mantiene un comportamiento estricto: los destinos
  de entrega no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite la reserva a ejecución solo de sesión cuando no
  se puede resolver una ruta entregable externa (por ejemplo, sesiones internas/webchat
  o configuraciones ambiguas multicanal).
- Los resultados finales de `agent` pueden incluir `result.deliveryStatus` cuando se solicitó
  entrega, usando los mismos estados `sent`, `suppressed`, `partial_failed` y
  `failed` documentados para
  [`openclaw agent --json --deliver`](/es/cli/agent#json-delivery-status).

## Versionado

- `PROTOCOL_VERSION` y `MIN_CLIENT_PROTOCOL_VERSION` viven en
  `packages/gateway-protocol/src/version.ts`. Ambos son actualmente `4`.
- Los clientes envían `minProtocol` + `maxProtocol`; el Gateway acepta una conexión
  cuando `maxProtocol >= PROTOCOL_VERSION && minProtocol <= PROTOCOL_VERSION`
  (`src/gateway/server/ws-connection/message-handler.ts`). Los clientes y servidores actuales
  ejecutan ambos el protocolo v4.
- Los esquemas y modelos se generan a partir de definiciones TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes del cliente

La implementación del cliente de referencia vive en `packages/gateway-client/src/`
(OpenClaw la envuelve mediante la fachada ligera `src/gateway/client.ts`). Estos
valores predeterminados son estables en todo el protocolo v4 y son la línea base esperada para
clientes de terceros.

| Constante                                 | Valor predeterminado                                  | Fuente                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Tiempo de espera de solicitud (por RPC)   | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Tiempo de espera de preautenticación / desafío de conexión | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (`OPENCLAW_HANDSHAKE_TIMEOUT_MS` env can raise the paired server/client budget) |
| Retroceso de reconexión inicial           | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`backoffMs`)                                                                     |
| Retroceso máximo de reconexión            | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`scheduleReconnect`)                                                             |
| Límite de reintento rápido tras cierre por token de dispositivo | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Gracia de detención forzada antes de `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Intervalo de tick predeterminado (antes de `hello-ok`) | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Cierre por tiempo de espera de tick       | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

El servidor anuncia los valores efectivos `policy.tickIntervalMs`,
`policy.maxPayload` y `policy.maxBufferedBytes` en `hello-ok`; los clientes
deben respetar esos valores en lugar de los valores predeterminados previos al handshake.

## Autenticación

- La autenticación del gateway con secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el
  `gateway.auth.mode` configurado (`"none" | "token" | "password" | "trusted-proxy"`).
- Los modos que llevan identidad, como Tailscale Serve (`gateway.auth.allowTailscale: true`)
  o `gateway.auth.mode: "trusted-proxy"` sin loopback, satisfacen la comprobación
  de autenticación de conexión desde los encabezados de la solicitud en lugar de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` para ingreso privado omite por completo la autenticación
  de conexión con secreto compartido; no expongas ese modo en ingresos públicos/no confiables.
- Tras el emparejamiento, el gateway emite un token de dispositivo limitado al rol
  de conexión + alcances, devuelto en `hello-ok.auth.deviceToken`. Los clientes deben
  conservarlo después de cualquier conexión correcta.
- Reconectar con ese token de dispositivo almacenado también debe reutilizar el conjunto
  de alcances aprobados almacenado para ese token. Esto conserva el acceso de lectura/sondeo/estado
  ya concedido y evita reducir silenciosamente las reconexiones a un alcance implícito
  más estrecho solo de administración.
- Ensamblado de autenticación de conexión del lado del cliente (`selectConnectAuth` en
  `packages/gateway-client/src/client.ts`):
  - `auth.password` es ortogonal y siempre se reenvía cuando está definido.
  - `auth.token` se rellena por orden de prioridad: primero el token compartido explícito,
    luego un `deviceToken` explícito y después un token por dispositivo almacenado (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` se envía solo cuando ninguno de los anteriores resolvió
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La promoción automática de un token de dispositivo almacenado en el reintento único
    `AUTH_TOKEN_MISMATCH` está limitada solo a endpoints confiables: loopback,
    o `wss://` con un `tlsFingerprint` fijado. `wss://` público sin fijación
    no cumple los requisitos.
- El arranque con código de configuración integrado devuelve el
  `hello-ok.auth.deviceToken` del Node principal más un token de operador acotado en
  `hello-ok.auth.deviceTokens` para traspaso móvil confiable. El token de operador
  incluye `operator.talk.secrets` para lecturas de configuración nativa de Talk, pero
  excluye los alcances de mutación de emparejamiento y `operator.admin`.
- Mientras un arranque con código de configuración no base espera aprobación,
  los detalles de `PAIRING_REQUIRED` incluyen `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` y `pauseReconnect: false`. Sigue reconectando con el
  mismo token de arranque hasta que la solicitud se apruebe o el token deje de ser
  válido.
- Conserva `hello-ok.auth.deviceTokens` solo cuando la conexión usó autenticación de
  arranque en un transporte confiable como `wss://` o emparejamiento por loopback/local.
- Si un cliente proporciona un `deviceToken` explícito o `scopes` explícitos, ese
  conjunto de alcances solicitado por el llamador sigue siendo autoritativo; los alcances en caché
  solo se reutilizan cuando el cliente reutiliza el token por dispositivo almacenado.
- Los tokens de dispositivo pueden rotarse/revocarse mediante `device.token.rotate` y
  `device.token.revoke` (requiere `operator.pairing`). Rotar o revocar un
  Node u otro rol que no sea de operador también requiere `operator.admin`.
- `device.token.rotate` devuelve metadatos de rotación. Repite el token portador
  de reemplazo solo para llamadas del mismo dispositivo ya autenticadas con ese
  token de dispositivo, de modo que los clientes solo con token puedan conservar su reemplazo antes de
  reconectarse. Las rotaciones compartidas/de administración no repiten el token portador.
- La emisión, rotación y revocación de tokens permanecen acotadas al conjunto de roles
  aprobados registrado en la entrada de emparejamiento de ese dispositivo; la mutación de tokens no puede ampliar ni
  apuntar a un rol de dispositivo que la aprobación de emparejamiento nunca concedió.
- Para sesiones de token de dispositivo emparejado, la gestión de dispositivos queda autoacotada salvo que
  el llamador también tenga `operator.admin`: los llamadores no administradores solo pueden gestionar el
  token de operador de su propia entrada de dispositivo. La gestión de tokens de Node y otros que no sean de operador
  es solo para administradores, incluso para el propio dispositivo del llamador.
- `device.token.rotate` y `device.token.revoke` también comprueban el conjunto de alcances del token
  de operador de destino frente a los alcances de la sesión actual del llamador.
  Los llamadores no administradores no pueden rotar ni revocar un token de operador más amplio del que
  ya poseen.
- Los fallos de autenticación incluyen `error.details.code` más sugerencias de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep`: uno de `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes confiables pueden intentar un reintento acotado con un token por dispositivo
    en caché.
  - Si ese reintento falla, detén los bucles de reconexión automática y muestra orientación de
    acción para el operador.
- `AUTH_SCOPE_MISMATCH` significa que el token de dispositivo fue reconocido pero no
  cubre el rol/los alcances solicitados. No lo presentes como un token incorrecto; solicita
  al operador volver a emparejar o aprobar el contrato de alcance más estrecho/amplio.

## Identidad del dispositivo y emparejamiento

- Los Nodes deben incluir una identidad de dispositivo estable (`device.id`) derivada de una
  huella de par de claves.
- Los Gateways emiten tokens por dispositivo + rol.
- Se requieren aprobaciones de emparejamiento para nuevos ID de dispositivo salvo que la
  aprobación automática local esté habilitada.
- La aprobación automática de emparejamiento se centra en conexiones directas por local loopback.
- OpenClaw también tiene una ruta estrecha de autoconexión local al backend/contenedor para
  flujos auxiliares confiables con secreto compartido.
- Las conexiones tailnet o LAN del mismo host siguen tratándose como remotas para el emparejamiento
  y requieren aprobación.
- Los clientes WS normalmente incluyen identidad de `device` durante `connect` (operador +
  Node). Las únicas excepciones de operador sin dispositivo son rutas de confianza explícitas:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad HTTP insegura
    solo en localhost.
  - autenticación correcta de operador de Control UI con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (ruptura de emergencia, degradación
    de seguridad grave).
  - RPCs de backend directas por loopback de `gateway-client` en la ruta auxiliar interna
    reservada.
- Omitir la identidad del dispositivo tiene consecuencias de alcance. Cuando se permite una
  conexión de operador sin dispositivo mediante una ruta de confianza explícita, OpenClaw
  aun así limpia los alcances autodeclarados a un conjunto vacío salvo que esa ruta tenga una
  excepción nombrada de preservación de alcances. Los métodos protegidos por alcance entonces fallan con
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` es una ruta de preservación de alcances
  de ruptura de emergencia de Control UI. No concede alcances a clientes WebSocket arbitrarios
  de backend personalizado o con forma de CLI.
- La ruta auxiliar reservada de backend `gateway-client` por loopback directo preserva
  alcances solo para RPCs internas del plano de control local; los ID de backend personalizados
  no reciben esta excepción.
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de autenticación de dispositivo

Para clientes heredados que todavía usan el comportamiento de firma previo al desafío, `connect`
devuelve códigos de detalle `DEVICE_AUTH_*` bajo `error.details.code` con un
`error.details.reason` estable.

Fallos comunes de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió en blanco).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto/incorrecto.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga de firma no coincide con la carga v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella de la clave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falló el formato/canonicalización de la clave pública.         |

Objetivo de migración:

- Espera siempre a `connect.challenge`.
- Firma la carga v2 que incluye el nonce del servidor.
- Envía el mismo nonce en `connect.params.device.nonce`.
- La carga de firma preferida es `v3`
  (`buildDeviceAuthPayloadV3` en `packages/gateway-client/src/device-auth.ts`),
  que vincula `platform` y `deviceFamily` además de los campos
  device/client/role/scopes/token/nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero la fijación de metadatos
  de dispositivos emparejados todavía controla la política de comandos al reconectar.

## TLS y fijación

- TLS es compatible con conexiones WS (configuración `gateway.tls`).
- Los clientes pueden fijar opcionalmente la huella del certificado del gateway mediante
  `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`.

## Alcance

Este protocolo expone la API completa del gateway: estado, canales, modelos, chat,
agente, sesiones, Nodes, aprobaciones y más. La superficie exacta se define mediante
los esquemas TypeBox reexportados desde `packages/gateway-protocol/src/schema.ts`.

## Relacionado

- [Protocolo de puente](/es/gateway/bridge-protocol)
- [Runbook del Gateway](/es/gateway)
