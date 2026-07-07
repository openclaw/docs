---
read_when:
    - Implementación o actualización de clientes WS de Gateway
    - Depuración de incompatibilidades de protocolo o fallos de conexión
    - Regenerando esquema/modelos de protocolo
summary: 'Protocolo WebSocket de Gateway: protocolo de enlace, tramas, versionado'
title: Protocolo de Gateway
x-i18n:
    generated_at: "2026-07-06T21:48:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15e0635d1b96e8ceabc98cfcececebde873b901de7b4bae2048b4d5cd4909c9d
    source_path: gateway/protocol.md
    workflow: 16
---

El protocolo WS del Gateway es el plano de control y transporte de nodos único de
OpenClaw. Cada cliente (CLI, interfaz web, app de macOS, nodos iOS/Android,
nodos headless) se conecta por WebSocket y declara un **rol** y **alcance** en
el momento del handshake.

## Transporte y enmarcado

- WebSocket, tramas de texto, cargas JSON.
- La primera trama **debe** ser una solicitud `connect`.
- Las tramas previas a la conexión tienen un límite de 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Después del
  handshake, siguen `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con los diagnósticos activados, las tramas
  entrantes sobredimensionadas y los búferes salientes lentos emiten eventos
  `payload.large` antes de que el Gateway cierre o descarte la trama. Estos
  eventos incluyen `surface`, tamaños en bytes, límites y un código de motivo
  seguro, nunca cuerpos de mensajes, contenido de adjuntos, bytes de tramas sin
  procesar, tokens, cookies ni secretos.

Formas de trama:

- Solicitud: `{type:"req", id, method, params}`
- Respuesta: `{type:"res", id, ok, payload|error}`
- Evento: `{type:"event", event, payload, seq?, stateVersion?}`

Los métodos con efectos secundarios requieren claves de idempotencia (consulta el esquema).

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

`server`, `features`, `snapshot`, `policy` y `auth` son todos requeridos por
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`). `auth`
informa el rol/alcances negociados incluso cuando no se emite ningún token de
dispositivo (forma anterior). `pluginSurfaceUrls` es opcional y asigna nombres
de superficies de Plugin (por ejemplo, `canvas`) a URL alojadas con alcance;
puede caducar, por lo que los nodos llaman a `node.pluginSurface.refresh` con
`{ "surface": "canvas" }` para obtener una entrada nueva. La ruta obsoleta
`canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh` no es
compatible; usa superficies de Plugin.

Mientras el Gateway todavía termina sidecars de inicio, `connect` puede devolver
un error `UNAVAILABLE` reintentable con `details.reason: "startup-sidecars"` y
`retryAfterMs`. Reintenta dentro de tu presupuesto de conexión en lugar de
tratarlo como un fallo terminal de handshake.

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

El bootstrap integrado mediante QR/código de configuración es una ruta de
traspaso móvil. Una conexión correcta de código de configuración de referencia
devuelve un token de nodo primario más un token de operador acotado:

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

Este traspaso de operador está acotado a propósito: suficiente para iniciar el
bucle de operador móvil y la configuración nativa, incluido
`operator.talk.secrets` para lecturas de configuración de Talk, pero sin alcances
de mutación de emparejamiento y sin `operator.admin`. El acceso más amplio de
emparejamiento/administración necesita un emparejamiento aprobado aparte o un
flujo de token. Persiste `hello-ok.auth.deviceTokens` solo cuando la autenticación
de bootstrap se ejecutó sobre un transporte de confianza (`wss://` o
emparejamiento local/local loopback).

Los clientes backend de confianza en el mismo proceso (`client.id: "gateway-client"`,
`client.mode: "backend"`) pueden omitir `device` en conexiones directas de
loopback al autenticarse con el token/contraseña compartidos del Gateway. Esta
ruta está reservada para RPC internos del plano de control (por ejemplo,
actualizaciones de sesión de subagentes) y evita que referencias base obsoletas
de emparejamiento CLI/dispositivo bloqueen el trabajo local de backend. Los
clientes remotos, de origen navegador, de nodo y de token de dispositivo/identidad
de dispositivo explícitos siguen pasando por las comprobaciones normales de
emparejamiento y mejora de alcance.

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

Los nodos declaran reivindicaciones de capacidades en el momento de la conexión:

- `caps`: categorías de alto nivel como `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: lista de comandos permitidos para invocar.
- `permissions`: conmutadores granulares (por ejemplo, `screen.record`, `camera.capture`).

El Gateway trata estas como reivindicaciones y aplica listas de permitidos del lado del servidor.

## Roles y alcances

Para ver el modelo completo de alcances de operador, las comprobaciones en el
momento de aprobación y la semántica de secreto compartido, consulta
[Alcances de operador](/es/gateway/operator-scopes).

Roles:

- `operator`: cliente de plano de control (CLI/UI/automatización).
- `node`: host de capacidades (camera/screen/canvas/system.run).

Alcances de operador (`src/gateway/operator-scopes.ts`), el conjunto cerrado completo:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` requiere `operator.talk.secrets` (u
`operator.admin`). Cuando se incluyen secretos, lee la credencial del proveedor
Talk activo desde `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
mantiene la forma de origen y puede ser un objeto SecretRef o una cadena
redactada.

Los métodos RPC del Gateway registrados por Plugins pueden solicitar su propio
alcance de operador, pero estos prefijos reservados del núcleo siempre se
resuelven a `operator.admin` (`src/shared/gateway-method-policy.ts`): `config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`.

El alcance de método es solo la primera puerta. Algunos comandos slash alcanzados
mediante `chat.send` aplican comprobaciones más estrictas a nivel de comando: las
escrituras persistentes `/config set` y `/config unset` requieren
`operator.admin` incluso para clientes del Gateway que ya tienen un alcance de
operador inferior.

`node.pair.approve` tiene una comprobación adicional de alcance en el momento de
aprobación además del alcance base del método (`operator.pairing`), basada en
los `commands` declarados por la solicitud pendiente
(`src/infra/node-pairing-authz.ts`):

| Comandos declarados                                            | Alcances requeridos                   |
| -------------------------------------------------------------- | ------------------------------------- |
| ninguno                                                        | `operator.pairing`                    |
| comandos que no son exec                                       | `operator.pairing` + `operator.write` |
| incluye `system.run`, `system.run.prepare` o `system.which`    | `operator.pairing` + `operator.admin` |

## Presencia

- `system-presence` devuelve entradas indexadas por identidad de dispositivo,
  incluidos `deviceId`, `roles` y `scopes`, para que las UI puedan mostrar una
  fila por dispositivo incluso cuando se conecta como operador y como nodo.
- `node.list` incluye `lastSeenAtMs` y `lastSeenReason` opcionales. Los nodos
  conectados informan la hora de conexión actual con motivo `connect`; los nodos
  emparejados también pueden informar presencia en segundo plano durable mediante
  un evento de nodo de confianza.

### Evento de nodo vivo en segundo plano

Los nodos llaman a `node.event` con `event: "node.presence.alive"` para registrar
que un nodo emparejado estuvo vivo durante una activación en segundo plano, sin
marcarlo como conectado:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` es un enum cerrado: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Los valores desconocidos se
normalizan a `background` (`src/shared/node-presence.ts`). El evento solo se
persiste para sesiones autenticadas de dispositivo de nodo; las sesiones sin
dispositivo o sin emparejar devuelven `handled: false`.

Los Gateways correctos devuelven un resultado estructurado:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Los Gateways antiguos pueden devolver solo `{ "ok": true }` para `node.event`;
trátalo como un RPC reconocido, no como persistencia durable de presencia.

## Alcance de eventos de difusión

Los eventos de difusión enviados por el servidor tienen puertas de alcance para
que las sesiones con alcance solo de emparejamiento o solo de nodo no reciban
contenido de sesión de forma pasiva (`src/gateway/server-broadcast.ts`):

- Las tramas de chat, agente y resultados de herramientas (eventos `agent`
  transmitidos, eventos de resultados de herramientas) requieren al menos
  `operator.read`. Las sesiones sin ese alcance omiten estas tramas por completo.
- Las difusiones `plugin.*` definidas por Plugins se restringen de forma
  predeterminada a `operator.write` u `operator.admin`; las entradas explícitas
  como `plugin.approval.requested` / `plugin.approval.resolved` usan
  `operator.approvals` en su lugar.
- Los eventos de estado/transporte (`heartbeat`, `presence`, `tick`, ciclo de
  vida de conexión/desconexión) permanecen sin restricciones para que la salud
  del transporte sea observable para toda sesión autenticada.
- Las familias de eventos de difusión desconocidas se restringen por alcance de
  forma predeterminada (fail-closed), salvo que un handler registrado las relaje
  explícitamente.

Cada conexión de cliente conserva su propio número de secuencia por cliente, de
modo que las difusiones permanecen ordenadas monótonamente en ese socket incluso
cuando diferentes clientes ven distintos subconjuntos del flujo de eventos
filtrados por alcance.

## Familias de métodos RPC

`hello-ok.features.methods` es una lista conservadora de descubrimiento creada a
partir de `src/gateway/server-methods-list.ts` más las exportaciones de métodos
de Plugin/canal cargadas; no es un volcado generado de todos los métodos, y
algunos métodos (por ejemplo, `push.test`, `web.login.start`, `web.login.wait`,
`sessions.usage`) se excluyen intencionadamente del descubrimiento aunque sean
métodos reales e invocables. Trátalo como descubrimiento de funciones, no como
una enumeración completa de `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Sistema e identidad">
    - `health` devuelve la instantánea de estado del gateway en caché o recién sondeada.
    - `diagnostics.stability` devuelve el registrador de estabilidad de diagnósticos acotado reciente: nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de colas/sesiones, nombres de canales/plugins, ids de sesión. Sin texto de chat, cuerpos de webhook, salidas de herramientas, cuerpos sin procesar de solicitud/respuesta, tokens, cookies ni secretos. Requiere `operator.read`.
    - `status` devuelve el resumen del gateway con estilo `/status`; los campos sensibles solo para clientes operadores con ámbito de administrador.
    - `gateway.identity.get` devuelve la identidad del dispositivo gateway usada por los flujos de relé y emparejamiento.
    - `system-presence` devuelve la instantánea de presencia actual para dispositivos de operador/nodo conectados.
    - `system-event` añade un evento del sistema y puede actualizar/difundir el contexto de presencia.
    - `last-heartbeat` devuelve el último evento de heartbeat persistido.
    - `set-heartbeats` activa o desactiva el procesamiento de heartbeat en el gateway.

  </Accordion>

  <Accordion title="Modelos y uso">
    - `models.list` devuelve el catálogo de modelos permitido por el entorno de ejecución. Consulta las vistas de "`models.list`" a continuación.
    - `usage.status` devuelve ventanas de uso del proveedor/resúmenes de cuota restante.
    - `usage.cost` devuelve resúmenes agregados del uso de costes para un intervalo de fechas. Pasa `agentId` para un agente, o `agentScope: "all"` para agregar agentes configurados.
    - `doctor.memory.status` devuelve la preparación de memoria vectorial / embedding en caché para el espacio de trabajo del agente predeterminado activo. Pasa `{ "probe": true }` o `{ "deep": true }` solo para un ping explícito en vivo al proveedor de embedding. Pasa `{ "agentId": "agent-id" }` para limitar las estadísticas del almacén Dreaming a un espacio de trabajo de agente; omitirlo agrega los espacios de trabajo Dreaming configurados.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` y `doctor.memory.dedupeDreamDiary` aceptan `{ "agentId": "agent-id" }` opcional; si se omite, operan sobre el espacio de trabajo del agente predeterminado configurado.
    - `doctor.memory.remHarness` devuelve una vista previa acotada y de solo lectura del arnés REM para clientes remotos del plano de control, incluidos rutas de espacios de trabajo, fragmentos de memoria, markdown grounded renderizado y candidatos de promoción profunda. Requiere `operator.read`.
    - `sessions.usage` devuelve resúmenes de uso por sesión. Pasa `agentId` para un agente, o `agentScope: "all"` para listar juntos los agentes configurados.
    - `sessions.usage.timeseries` devuelve el uso en serie temporal de una sesión.
    - `sessions.usage.logs` devuelve entradas del registro de uso de una sesión.

  </Accordion>

  <Accordion title="Canales y asistentes de inicio de sesión">
    - `channels.status` devuelve resúmenes de estado de canales/plugins integrados + incluidos.
    - `channels.logout` cierra la sesión de un canal/cuenta específico cuando el canal lo admite.
    - `web.login.start` inicia un flujo de inicio de sesión QR/web para el proveedor de canal web actual compatible con QR.
    - `web.login.wait` espera a que ese flujo se complete e inicia el canal si tiene éxito.
    - `push.test` envía una notificación push APNs de prueba a un nodo iOS registrado.
    - `voicewake.get` devuelve los disparadores de palabra de activación almacenados.
    - `voicewake.set` actualiza los disparadores de palabra de activación y difunde el cambio.

  </Accordion>

  <Accordion title="Mensajería y registros">
    - `send` es el RPC de entrega saliente directa para envíos dirigidos a canal/cuenta/hilo fuera del ejecutor de chat.
    - `logs.tail` devuelve la cola del registro de archivo configurado del gateway con controles de cursor/límite y bytes máximos.

  </Accordion>

  <Accordion title="Terminal de operador">
    - `terminal.open` inicia un PTY de host para un `agentId` explícito o el agente predeterminado y devuelve el agente resuelto, el directorio de trabajo, el shell y el estado de confinamiento.
    - `terminal.input`, `terminal.resize` y `terminal.close` operan solo sobre sesiones propiedad de la conexión que llama.
    - Los eventos `terminal.data` y `terminal.exit` se transmiten solo a la conexión que posee la sesión.
    - Las sesiones cuya conexión se pierde se desacoplan, no se eliminan: permanecen disponibles para volver a adjuntarse durante `gateway.terminal.detachedSessionTimeoutSeconds` (predeterminado 300; `0` restaura eliminar al desconectar) mientras la salida reciente se acumula en un búfer acotado del lado del servidor.
    - `terminal.list` devuelve sesiones adjuntables; `terminal.attach` vuelve a vincular una sesión activa o desacoplada a la conexión que llama y devuelve el búfer de reproducción (toma de control estilo tmux — un propietario activo anterior recibe `terminal.exit` con motivo `detached`); `terminal.text` lee el búfer como texto sin formato sin adjuntarse.
    - Cada método de terminal requiere `operator.admin`; `gateway.terminal.enabled` debe ser true explícitamente. Los agentes completamente aislados se rechazan, y un cambio de política de agente cierra los PTY existentes y en curso, incluidos los desacoplados.

  </Accordion>

  <Accordion title="Talk y TTS">
    - `talk.catalog` devuelve el catálogo de proveedores Talk de solo lectura para voz, transcripción en streaming y voz en tiempo real: ids de proveedor canónicos, alias de registro, etiquetas, estado configurado, un resultado `ready` opcional a nivel de grupo, ids de modelos/voces expuestos, modos canónicos, transportes, estrategias de cerebro y flags de audio/capacidad en tiempo real, sin devolver secretos del proveedor ni mutar la configuración global. Los gateways actuales establecen `ready` después de aplicar la selección de proveedor en tiempo de ejecución; trata su ausencia como no verificada en gateways anteriores.
    - `talk.config` devuelve la carga útil de configuración efectiva de Talk; `includeSecrets` requiere `operator.talk.secrets` (u `operator.admin`).
    - `talk.session.create` crea una sesión Talk propiedad del gateway para `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. Para `stt-tts/managed-room`, los llamadores `operator.write` que pasen `sessionKey` también deben pasar `spawnedBy` para la visibilidad con ámbito de la clave de sesión; la creación de `sessionKey` sin ámbito y `brain: "direct-tools"` requieren `operator.admin`.
    - `talk.session.join` valida un token de sesión de sala administrada, emite `session.ready` o `session.replaced` según sea necesario y devuelve metadatos de sala/sesión más eventos Talk recientes, nunca el token en texto plano ni su hash.
    - `talk.session.appendAudio` añade audio de entrada PCM en base64 a sesiones de relé en tiempo real y transcripción propiedad del gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` y `talk.session.cancelTurn` controlan el ciclo de vida de turnos de sala administrada con rechazo de turnos obsoletos antes de limpiar el estado.
    - `talk.session.cancelOutput` detiene la salida de audio del asistente, principalmente para interrupción controlada por VAD en sesiones de relé del gateway.
    - `talk.session.submitToolResult` completa una llamada a herramienta de proveedor emitida por una sesión de relé en tiempo real propiedad del gateway. Pasa `options: { willContinue: true }` para salida provisional de herramienta cuando seguirá un resultado final, u `options: { suppressResponse: true }` cuando el resultado de la herramienta deba satisfacer la llamada del proveedor sin iniciar otra respuesta en tiempo real.
    - `talk.session.steer` envía control de voz de ejecución activa a una sesión Talk respaldada por agente y propiedad del gateway: `{ sessionId, text, mode? }`, donde `mode` es `status`, `steer`, `cancel` o `followup`; el modo omitido se clasifica a partir del texto hablado.
    - `talk.session.close` cierra una sesión de relé, transcripción o sala administrada propiedad del gateway y emite eventos Talk terminales.
    - `talk.mode` establece/difunde el estado del modo Talk actual para clientes WebChat/Control UI.
    - `talk.client.create` crea una sesión de proveedor en tiempo real propiedad del cliente usando `webrtc` o `provider-websocket` mientras el gateway posee la configuración, credenciales, instrucciones y política de herramientas.
    - `talk.client.toolCall` permite que transportes en tiempo real propiedad del cliente reenvíen llamadas a herramientas del proveedor a la política del gateway. La primera herramienta admitida es `openclaw_agent_consult`; los clientes reciben un id de ejecución y esperan los eventos normales del ciclo de vida del chat antes de enviar el resultado de herramienta específico del proveedor.
    - `talk.client.steer` envía control de voz de ejecución activa para transportes en tiempo real propiedad del cliente. El gateway resuelve la ejecución embebida activa desde `sessionKey` y devuelve un resultado estructurado aceptado/rechazado en lugar de descartar silenciosamente el direccionamiento.
    - `talk.event` es el único canal de eventos Talk para adaptadores en tiempo real, transcripción, STT/TTS, sala administrada, telefonía y reuniones.
    - `talk.speak` sintetiza voz mediante el proveedor de voz Talk activo.
    - `tts.status` devuelve el estado de habilitación de TTS, el proveedor activo, los proveedores de respaldo y el estado de configuración del proveedor.
    - `tts.providers` devuelve el inventario visible de proveedores TTS.
    - `tts.enable` y `tts.disable` activan o desactivan el estado de preferencias de TTS.
    - `tts.setProvider` actualiza el proveedor TTS preferido.
    - `tts.convert` ejecuta una conversión puntual de texto a voz.
    - `tts.speak` (`operator.write`) renderiza `text` no vacío con la cadena configurada de proveedores TTS generales y devuelve un clip completo en línea como `audioBase64`, además de metadatos `provider` y opcionales `outputFormat`, `mimeType` y `fileExtension`. A diferencia de `tts.convert`, no devuelve una ruta local al Gateway; a diferencia de `talk.speak`, no requiere un proveedor Talk. El texto que supera `messages.tts.maxTextLength` devuelve `INVALID_REQUEST`; los fallos de síntesis devuelven `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Secretos, configuración, actualización y asistente">
    - `secrets.reload` vuelve a resolver las SecretRefs activas e intercambia el estado de secretos en tiempo de ejecución solo si todo se completa correctamente.
    - `secrets.resolve` resuelve las asignaciones de secretos dirigidas a comandos para un conjunto específico de comando/destino.
    - `config.get` devuelve la instantánea y el hash de la configuración actual.
    - `config.set` escribe una carga útil de configuración validada.
    - `config.patch` fusiona una actualización parcial de la configuración. El reemplazo destructivo de arrays requiere la ruta afectada en `replacePaths`; los arrays anidados bajo entradas de array usan rutas con `[]`, como `agents.list[].skills`.
    - `config.apply` valida + reemplaza la carga útil completa de configuración.
    - `config.schema` devuelve la carga útil del esquema de configuración activo que usan Control UI y las herramientas CLI: esquema, `uiHints`, versión, metadatos de generación, y metadatos de esquema de plugin + canal cuando se pueden cargar. Incluye metadatos de `title` / `description` del mismo texto de etiquetas/ayuda que la UI, incluidas ramas de composición de objetos anidados, comodines, elementos de array y `anyOf` / `oneOf` / `allOf` cuando existe documentación de campo coincidente.
    - `config.schema.lookup` devuelve una carga útil de búsqueda acotada a una ruta para una ruta de configuración: ruta normalizada, un nodo de esquema superficial, pista coincidente + `hintPath`, `reloadKind` opcional y resúmenes de hijos inmediatos para exploración detallada en UI/CLI. `reloadKind` es uno de `restart`, `hot` o `none` (`src/config/schema.ts`) y refleja el planificador de recarga de configuración del gateway para la ruta solicitada. Los nodos de esquema de búsqueda conservan la documentación orientada al usuario y los campos comunes de validación (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos/de cadena/array/objeto, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de hijos exponen `key`, `path` normalizada, `type`, `required`, `hasChildren`, `reloadKind` opcional, además de `hint` / `hintPath` coincidentes.
    - `update.run` ejecuta el flujo de actualización del gateway y programa un reinicio solo si la actualización tuvo éxito; los llamadores con una sesión pueden incluir `continuationMessage` para que el arranque reanude un turno de agente de seguimiento mediante la cola de continuación de reinicio. Las actualizaciones del gestor de paquetes y las actualizaciones supervisadas de checkout de git desde el plano de control usan una transferencia a servicio gestionado desacoplada en lugar de reemplazar el árbol de paquetes o mutar la salida de checkout/build dentro del gateway en vivo. Una transferencia iniciada devuelve `ok: true` con `result.reason: "managed-service-handoff-started"` y `handoff.status: "started"`; las transferencias no disponibles o fallidas devuelven `ok: false` con `managed-service-handoff-unavailable` o `managed-service-handoff-failed`, además de `handoff.command` cuando se requiere una actualización manual desde shell. No disponible significa que OpenClaw no tiene un límite de supervisor seguro o una identidad de servicio durable, como `OPENCLAW_SYSTEMD_UNIT` para systemd. Durante una transferencia iniciada, el centinela de reinicio puede informar brevemente `stats.reason: "restart-health-pending"`; la continuación se retrasa hasta que la CLI verifica el gateway reiniciado y escribe el centinela final `ok`.
    - `update.status` actualiza y devuelve el centinela de reinicio de actualización más reciente, incluida la versión en ejecución posterior al reinicio cuando está disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de incorporación mediante WS RPC.

  </Accordion>

  <Accordion title="Ayudantes de agente y espacio de trabajo">
    - `agents.list` devuelve las entradas de agentes configuradas, incluidos el modelo efectivo y los metadatos de tiempo de ejecución.
    - `agents.create`, `agents.update` y `agents.delete` administran registros de agentes y cableado de espacios de trabajo.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` administran los archivos de espacio de trabajo de arranque expuestos para un agente.
    - `audit.list` devuelve un registro acotado solo de metadatos de eventos de ejecución de agente y acciones de herramientas.
    - `agents.workspace.list` y `agents.workspace.get` (`operator.read`) exponen exploración paginada de solo lectura del directorio de espacio de trabajo de un agente para clientes del dominio de operador de confianza descrito en [Ámbitos de operador](/es/gateway/operator-scopes). Las solicitudes aceptan solo rutas relativas al espacio de trabajo; las lecturas permanecen confinadas a la raíz realpathed del espacio de trabajo (se rechazan escapes por symlink y hardlink), con límite de tamaño y limitadas a texto UTF-8 más tipos de imagen comunes (base64). Las respuestas no exponen la ruta del espacio de trabajo del host. No hay operaciones de escritura en este namespace.
    - `tasks.list`, `tasks.get` y `tasks.cancel` exponen el registro de tareas del gateway a clientes SDK y operadores. Consulta [RPCs del registro de tareas](#task-ledger-rpcs) más abajo.
    - `artifacts.list`, `artifacts.get` y `artifacts.download` exponen resúmenes de artefactos derivados de transcripciones y descargas para un alcance explícito de `sessionKey`, `runId` o `taskId`. Las consultas de ejecución y tarea resuelven la sesión propietaria del lado del servidor y solo devuelven medios de transcripción con procedencia coincidente; las fuentes URL inseguras o locales devuelven descargas no admitidas en lugar de obtenerse del lado del servidor.
    - `environments.list` y `environments.status` exponen descubrimiento de entornos locales del gateway y de Node en modo de solo lectura para clientes SDK.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o una sesión.
    - `agent.wait` espera a que una ejecución finalice y devuelve la instantánea terminal cuando está disponible.

  </Accordion>

  <Accordion title="Control de sesión">
    - `sessions.list` devuelve el índice de sesiones actual, incluidos metadatos `agentRuntime` por fila cuando hay un backend de runtime de agente configurado.
    - `sessions.subscribe` y `sessions.unsubscribe` alternan las suscripciones a eventos de cambio de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` alternan las suscripciones a eventos de transcripción/mensaje para una sesión.
    - `sessions.preview` devuelve vistas previas acotadas de transcripciones para claves de sesión específicas.
    - `sessions.describe` devuelve una fila de sesión del gateway para una clave de sesión exacta.
    - `sessions.resolve` resuelve o canoniza un destino de sesión.
    - `sessions.create` crea una nueva entrada de sesión.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrupción y dirección para una sesión activa.
    - `sessions.abort` cancela trabajo activo para una sesión. Pasa `key` más `runId` opcional, o solo `runId` para ejecuciones activas que el gateway puede resolver a una sesión.
    - `sessions.patch` actualiza metadatos/anulaciones de sesión e informa el modelo canónico resuelto más el `agentRuntime` efectivo.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan mantenimiento de sesión.
    - `sessions.get` devuelve la fila de sesión almacenada completa.
    - La ejecución de chat sigue usando `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` se normaliza para visualización en clientes UI: las etiquetas de directiva en línea se eliminan del texto visible, las cargas útiles XML de llamadas a herramientas en texto plano (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y tokens de control de modelo ASCII/ancho completo filtrados se eliminan, las filas de asistente con tokens puramente silenciosos (`NO_REPLY` / `no_reply` exactos) se omiten, y las filas sobredimensionadas pueden reemplazarse por marcadores de posición.
    - `chat.message.get` es el lector aditivo acotado de mensaje completo para una sola entrada visible de transcripción. Pasa `sessionKey`, `agentId` opcional cuando la selección de sesión está acotada al agente, y un `messageId` de transcripción expuesto previamente mediante `chat.history`; el gateway devuelve la misma proyección normalizada para visualización sin el límite de truncamiento del historial ligero cuando la entrada almacenada sigue disponible y no está sobredimensionada.
    - `chat.send` acepta `fastMode: "auto"` de un turno para usar el modo rápido en llamadas al modelo iniciadas antes del corte automático, y luego iniciar llamadas posteriores de reintento, fallback, resultado de herramienta o continuación sin modo rápido. El corte predeterminado es de 60 segundos (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) y puede configurarse por modelo con `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un llamador de `chat.send` puede pasar `fastAutoOnSeconds` de un turno para anular el corte de esa solicitud.

  </Accordion>

  <Accordion title="Emparejamiento de dispositivos y tokens de dispositivo">
    - `device.pair.list` devuelve dispositivos emparejados pendientes y aprobados.
    - `device.pair.setupCode` crea un código de configuración móvil y, de forma predeterminada, una URL de datos QR PNG. Requiere `operator.admin` y se omite intencionalmente del descubrimiento anunciado. El resultado incluye `setupCode`, `qrDataUrl` opcional, `gatewayUrl`, la etiqueta no secreta `auth` y `urlSource`.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` administran registros de emparejamiento de dispositivos.
    - `device.token.rotate` rota un token de dispositivo emparejado dentro de los límites de su rol aprobado y el alcance del llamador.
    - `device.token.revoke` revoca un token de dispositivo emparejado dentro de los límites de su rol aprobado y el alcance del llamador.

    El código de configuración incrusta una credencial de arranque de corta duración. Los clientes no deben
    registrarla ni persistirla más allá del flujo de emparejamiento.

  </Accordion>

  <Accordion title="Emparejamiento de Node, invocación y trabajo pendiente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` y `node.pair.verify` cubren el emparejamiento de Node y la verificación de arranque.
    - `node.list` y `node.describe` devuelven el estado de Node conocido/conectado.
    - `node.rename` actualiza una etiqueta de Node emparejado.
    - `node.invoke` reenvía un comando a un Node conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud de invocación.
    - `node.event` transporta eventos originados en Node de vuelta al gateway.
    - `node.pending.pull` y `node.pending.ack` son las API de cola de Node conectado.
    - `node.pending.enqueue` y `node.pending.drain` administran trabajo pendiente durable para Nodes sin conexión/desconectados.

  </Accordion>

  <Accordion title="Familias de aprobación">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` cubren solicitudes de aprobación de ejecución de un solo uso, además de búsqueda/reproducción de aprobaciones pendientes.
    - `exec.approval.waitDecision` espera una aprobación de ejecución pendiente y devuelve la decisión final (o `null` al agotarse el tiempo de espera).
    - `exec.approvals.get` y `exec.approvals.set` administran instantáneas de políticas de aprobación de ejecución del gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` administran la política de aprobación de ejecución local de Node mediante comandos de retransmisión de Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` cubren flujos de aprobación definidos por plugins.

  </Accordion>

  <Accordion title="Automatización, Skills y herramientas">
    - Automatización: `wake` programa una inyección de texto de activación inmediata o en el siguiente Heartbeat; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` administran trabajo programado.
    - `cron.run` sigue siendo un RPC de estilo encolado para ejecuciones manuales. Los clientes que necesitan semántica de finalización deben leer el `runId` devuelto y sondear `cron.runs`.
    - `cron.runs` acepta un filtro `runId` opcional no vacío para que los clientes puedan seguir una ejecución manual encolada sin competir con otras entradas de historial del mismo trabajo.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Consulta [Métodos auxiliares de operador](#operator-helper-methods) más abajo.

  </Accordion>
</AccordionGroup>

### Familias de eventos comunes

- `chat`: actualizaciones de chat de la UI como `chat.inject` y otros eventos de
  chat solo de transcripción. En el protocolo v4, las cargas útiles delta llevan
  `deltaText`; `message` sigue siendo la instantánea acumulativa del asistente.
  Los reemplazos que no son de prefijo establecen `replace=true` y usan
  `deltaText` como texto de reemplazo.
- `session.message`, `session.operation`, `session.tool`: transcripción,
  operación de sesión en curso y actualizaciones de flujo de eventos para una
  sesión suscrita.
- `sessions.changed`: cambió el índice de sesiones o los metadatos.
- `presence`: actualizaciones de instantánea de presencia del sistema.
- `tick`: evento periódico de mantenimiento de conexión/actividad.
- `health`: actualización de instantánea de salud del Gateway.
- `heartbeat`: actualización del flujo de eventos de heartbeat.
- `cron`: evento de cambio de ejecución/trabajo cron.
- `shutdown`: notificación de apagado del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de emparejamiento
  de Node.
- `node.invoke.request`: difusión de solicitud de invocación de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de
  dispositivo emparejado.
- `voicewake.changed`: cambió la configuración del disparador de palabra de
  activación.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de
  aprobación de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de
  aprobación de Plugin.

### Métodos auxiliares de Node

Los Nodes pueden llamar a `skills.bins` para obtener la lista actual de
ejecutables de skill para comprobaciones de autorización automática.

## RPC del libro de auditoría

`audit.list` proporciona a los clientes operadores una vista estable, de más
reciente a más antigua, de los metadatos de ejecuciones de agentes y acciones de
herramientas. Requiere `operator.read`. Las consultas excluyen registros con
más de 30 días de antigüedad, y el libro SQLite compartido tiene un límite de
100.000 registros. Las filas caducadas se eliminan durante el inicio del
Gateway, el mantenimiento horario y las escrituras posteriores.

- Parámetros: `agentId`, `sessionKey` o `runId` exactos opcionales; `kind`
  opcional (`"agent_run"` o `"tool_action"`); `status` opcional (`"started"`,
  `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`, `"blocked"` o
  `"unknown"`); límites inclusivos opcionales `after` / `before` en
  milisegundos Unix; `limit` opcional de `1` a `500`; y cadena `cursor`
  opcional de la página anterior.
- Resultado: `{ "events": AuditEvent[], "nextCursor"?: string }`.

Cada evento incluye un id de evento estable, secuencia monotónica del libro,
secuencia de evento de origen, marca temporal, actor, procedencia de
agente/sesión/ejecución, acción, estado y un código de error normalizado cuando
corresponda. Los eventos de herramienta pueden incluir id de llamada de
herramienta y nombre de herramienta. El campo `redaction` siempre es
`"metadata_only"`: el libro no almacena prompts, mensajes, argumentos de
herramientas, resultados de herramientas, salida de comandos ni texto de error
sin procesar.

El registro está activado de forma predeterminada y lo controla
[`audit.enabled`](/es/gateway/configuration-reference#audit); cuando se desactiva,
`audit.list` sigue sirviendo los registros escritos anteriormente hasta que
caduquen.

Usa [`openclaw audit`](/cli/audit) para consultas de texto y exportaciones JSON
acotadas.

## RPCs del libro de tareas

Los clientes operadores inspeccionan y cancelan registros de tareas en segundo
plano del Gateway mediante los RPCs del libro de tareas
(`packages/gateway-protocol/src/schema/tasks.ts`). Estos devuelven resúmenes de
tareas saneados, no estado de runtime sin procesar.

- `tasks.list` requiere `operator.read`.
  - Parámetros: `status` opcional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` o `"timed_out"`) o un arreglo de esos estados,
    `agentId` opcional, `sessionKey` opcional, `limit` opcional de `1` a
    `500` y cadena `cursor` opcional.
  - Resultado: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` requiere `operator.read`.
  - Parámetros: `{ "taskId": string }`.
  - Resultado: `{ "task": TaskSummary }`.
  - Los ids de tarea faltantes devuelven la forma de error not-found del
    Gateway.
- `tasks.cancel` requiere `operator.write`.
  - Parámetros: `{ "taskId": string, "reason"?: string }`.
  - Resultado: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informa si el libro tenía una tarea coincidente. `cancelled`
    informa si el runtime aceptó o registró la cancelación.

`TaskSummary` incluye `id`, `status` y metadatos opcionales: `kind`, `runtime`,
`title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`,
`taskId`, `flowId`, `parentTaskId`, `sourceId`, marcas temporales, progreso,
resumen terminal y texto de error saneado. `agentId` identifica el agente que
ejecuta la tarea; `sessionKey` y `ownerKey` conservan el contexto de solicitante
y control.

## Métodos auxiliares de operador

- `commands.list` (`operator.read`) obtiene el inventario de comandos de
  runtime para un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente
    predeterminado.
  - `scope` controla a qué superficie apunta el `name` principal: `text`
    devuelve el token principal de comando de texto sin la `/` inicial; `native`
    y la ruta predeterminada `both` devuelven nombres nativos conscientes del
    proveedor cuando están disponibles.
  - `textAliases` lleva alias de barra exactos como `/model` y `/m`.
  - `nativeName` lleva el nombre de comando nativo consciente del proveedor
    cuando existe.
  - `provider` es opcional y solo afecta la nomenclatura nativa y la
    disponibilidad de comandos nativos de Plugin.
  - `includeArgs=false` omite de la respuesta los metadatos de argumentos
    serializados.
- `tools.catalog` (`operator.read`) obtiene el catálogo de herramientas de
  runtime para un agente. La respuesta incluye herramientas agrupadas y
  metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: propietario del Plugin cuando `source="plugin"`
  - `optional`: si una herramienta de Plugin es opcional
- `tools.effective` (`operator.read`) obtiene el inventario de herramientas
  efectivo en runtime para una sesión.
  - `sessionKey` es obligatorio.
  - El Gateway deriva el contexto de runtime confiable de la sesión del lado
    del servidor en lugar de aceptar autenticación o contexto de entrega
    proporcionados por el llamador.
  - La respuesta es una proyección con alcance de sesión, derivada por el
    servidor, del inventario activo, incluidas herramientas de core, Plugin,
    canal y servidores MCP ya descubiertos.
  - `tools.effective` es de solo lectura para MCP: puede proyectar un catálogo
    MCP de sesión caliente a través de la política final de herramientas, pero
    no crea runtimes MCP, no conecta transportes ni emite `tools/list`. Si no
    existe un catálogo caliente coincidente, la respuesta puede incluir un aviso
    como `mcp-not-yet-connected`, `mcp-not-yet-listed` o `mcp-stale-catalog`.
  - Las entradas de herramientas efectivas usan `source="core"`,
    `source="plugin"`, `source="channel"` o `source="mcp"`.
- `tools.invoke` (`operator.write`) invoca una herramienta disponible mediante
  la misma ruta de política del Gateway que `/tools/invoke`.
  - `name` es obligatorio. `args`, `sessionKey`, `agentId`, `confirm` e
    `idempotencyKey` son opcionales.
  - Si tanto `sessionKey` como `agentId` están presentes, el agente de sesión
    resuelto debe coincidir con `agentId`.
  - Los wrappers de core solo para propietario, como `cron`, `gateway` y
    `nodes`, requieren identidad de propietario/admin (`operator.admin`) aunque
    `tools.invoke` en sí sea `operator.write`.
  - La respuesta es un sobre orientado al SDK con `ok`, `toolName`, `output`
    opcional y campos `error` tipados. Las negativas por aprobación o política
    devuelven `ok:false` en la carga útil en lugar de omitir la canalización de
    política de herramientas del Gateway.
- `skills.status` (`operator.read`) obtiene el inventario visible de skills
  para un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente
    predeterminado.
  - La respuesta incluye elegibilidad, requisitos faltantes, comprobaciones de
    configuración y opciones de instalación saneadas sin exponer valores
    secretos sin procesar.
- `skills.search` y `skills.detail` (`operator.read`) devuelven metadatos de
  descubrimiento de ClawHub.
- `skills.upload.begin`, `skills.upload.chunk` y `skills.upload.commit`
  (`operator.admin`) preparan un archivo privado de skill antes de instalarlo.
  Esta es una ruta de carga de admin separada para clientes confiables, no el
  flujo normal de instalación de skills de ClawHub, y está desactivada de forma
  predeterminada a menos que `skills.install.allowUploadedArchives` esté
  activado.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    crea una carga vinculada a ese slug y valor de force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` anexa bytes en el
    desplazamiento decodificado exacto.
  - `skills.upload.commit({ uploadId, sha256? })` verifica el tamaño final y
    SHA-256. Commit solo finaliza la carga; no instala la skill.
  - Los archivos de skill cargados son archivos zip que contienen una raíz
    `SKILL.md`. El nombre de directorio interno del archivo nunca selecciona el
    destino de instalación.
- `skills.install` (`operator.admin`) tiene tres modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una
    carpeta de skill en el directorio `skills/` del espacio de trabajo del
    agente predeterminado.
  - Modo de carga: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instala una carga confirmada en el directorio `skills/<slug>` del espacio
    de trabajo del agente predeterminado. El slug y el valor de force deben
    coincidir con la solicitud original `skills.upload.begin`. Se rechaza a
    menos que `skills.install.allowUploadedArchives` esté activado; la
    configuración no afecta a las instalaciones de ClawHub.
  - Modo instalador del Gateway: `{ name, installId, timeoutMs? }` ejecuta una
    acción declarada `metadata.openclaw.install` en el host del Gateway. Los
    clientes más antiguos aún pueden enviar `dangerouslyForceUnsafeInstall`;
    este campo está obsoleto, se acepta solo por compatibilidad de protocolo y
    se ignora. Usa `security.installPolicy` para decisiones de instalación
    propiedad del operador.
- `skills.update` (`operator.admin`) tiene dos modos:
  - El modo ClawHub actualiza un slug rastreado o todas las instalaciones de
    ClawHub rastreadas en el espacio de trabajo del agente predeterminado.
  - El modo configuración parchea valores `skills.entries.<skillKey>` como
    `enabled`, `apiKey` y `env`.

### Vistas de `models.list`

`models.list` acepta un parámetro `view` opcional
(`src/agents/model-catalog-visibility.ts`):

- Omitido o `"default"`: si `agents.defaults.models` está configurado, la
  respuesta es el catálogo permitido, incluidos los modelos descubiertos
  dinámicamente para entradas `provider/*`. De lo contrario, la respuesta es el
  catálogo completo del Gateway.
- `"configured"`: comportamiento del tamaño de un selector. Si
  `agents.defaults.models` está configurado, sigue teniendo prioridad, incluido
  el descubrimiento con alcance de proveedor para entradas `provider/*`. Sin
  una lista de permitidos, la respuesta usa entradas explícitas
  `models.providers.<provider>.models`, recurriendo al catálogo completo solo
  cuando no existen filas de modelos configuradas.
- `"all"`: catálogo completo del Gateway, omitiendo `agents.defaults.models`.
  Úsalo para UIs de diagnóstico/descubrimiento, no para selectores de modelos
  normales.

## Aprobaciones de exec

- Cuando una solicitud de exec necesita aprobación, el Gateway difunde
  `exec.approval.requested`.
- Los clientes operadores resuelven llamando a `exec.approval.resolve` (requiere
  `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan`
  (`argv`/`cwd`/`rawCommand`/metadatos de sesión canónicos). Las solicitudes que
  no tengan `systemRunPlan` se rechazan.
- Después de la aprobación, las llamadas reenviadas `node.invoke system.run`
  reutilizan ese `systemRunPlan` canónico como contexto autoritativo de
  comando/cwd/sesión.
- Si un llamador muta `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey`
  entre la preparación y el reenvío final aprobado de `system.run`, el Gateway
  rechaza la ejecución en lugar de confiar en la carga útil mutada.

## Fallback de entrega de agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar entrega
  saliente.
- `bestEffortDeliver=false` (el valor predeterminado) mantiene el comportamiento
  estricto: los destinos de entrega no resueltos o solo internos devuelven
  `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite recurrir a ejecución solo de sesión cuando
  no se puede resolver ninguna ruta entregable externa (por ejemplo, sesiones
  internas/webchat o configuraciones multicanal ambiguas).
- Los resultados finales de `agent` pueden incluir `result.deliveryStatus`
  cuando se solicitó entrega, usando los mismos estados `sent`, `suppressed`,
  `partial_failed` y `failed` documentados para
  [`openclaw agent --json --deliver`](/es/cli/agent#json-delivery-status).

## Versionado

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` y `MIN_PROBE_PROTOCOL_VERSION` viven en
  `packages/gateway-protocol/src/version.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`. Los clientes de operador y de UI deben
  incluir el protocolo actual en ese rango; los clientes y servidores actuales ejecutan
  el protocolo v4.
- Los clientes autenticados con `role: "node"` y `client.mode: "node"`
  pueden usar el protocolo de Node N-1 (actualmente v3). Las sondas ligeras de reinicio usan
  la misma ventana N-1. La autenticación de dispositivos, el emparejamiento, los ámbitos, la política de comandos y las aprobaciones de ejecución
  no cambian por esta ventana de compatibilidad. Las capacidades y comandos de Node
  propiedad del Plugin se retienen hasta que el Node se actualiza al protocolo actual
  porque sus superficies alojadas no forman parte del contrato N-1.
- Los esquemas y modelos se generan desde definiciones de TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes de cliente

La implementación de cliente de referencia vive en `packages/gateway-client/src/`
(OpenClaw la envuelve mediante la fachada delgada `src/gateway/client.ts`). Estos
valores predeterminados son estables en el protocolo v4 y son la base esperada para
clientes de terceros.

| Constante                                 | Valor predeterminado                                  | Fuente                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Tiempo de espera de solicitud (por RPC)   | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Tiempo de espera de preautenticación / desafío de conexión | `15_000` ms                            | `packages/gateway-client/src/timeouts.ts` (`OPENCLAW_HANDSHAKE_TIMEOUT_MS` env puede aumentar el presupuesto emparejado de servidor/cliente) |
| Retroceso inicial de reconexión           | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`backoffMs`)                                                                     |
| Retroceso máximo de reconexión            | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`scheduleReconnect`)                                                             |
| Límite de reintento rápido tras cierre por token de dispositivo | `250` ms                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Gracia de parada forzada antes de `terminate()` | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                    | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Intervalo de tick predeterminado (antes de `hello-ok`) | `30_000` ms                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Cierre por tiempo de espera de tick       | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

El servidor anuncia los valores efectivos `policy.tickIntervalMs`,
`policy.maxPayload` y `policy.maxBufferedBytes` en `hello-ok`; los clientes
deben respetar esos valores en lugar de los valores predeterminados previos al handshake.

## Autenticación

- La autenticación de Gateway con secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el `gateway.auth.mode` configurado
  (`"none" | "token" | "password" | "trusted-proxy"`).
- Los modos que portan identidad, como Tailscale Serve (`gateway.auth.allowTailscale: true`)
  o `gateway.auth.mode: "trusted-proxy"` sin loopback, satisfacen la comprobación de autenticación de conexión
  desde los encabezados de la solicitud en lugar de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` de ingreso privado omite por completo la autenticación de conexión
  con secreto compartido; no expongas ese modo en ingresos públicos/no confiables.
- Tras el emparejamiento, el Gateway emite un token de dispositivo limitado al rol de conexión
  + ámbitos, devuelto en `hello-ok.auth.deviceToken`. Los clientes deben
  persistirlo después de cualquier conexión correcta.
- Reconectar con ese token de dispositivo almacenado también debe reutilizar el conjunto de ámbitos
  aprobados almacenado para ese token. Esto conserva el acceso de lectura/sonda/estado
  ya concedido y evita reducir silenciosamente las reconexiones a un ámbito
  implícito más estrecho solo de administrador.
- Ensamblaje de autenticación de conexión del lado del cliente (`selectConnectAuth` en
  `packages/gateway-client/src/client.ts`):
  - `auth.password` es ortogonal y siempre se reenvía cuando está establecido.
  - `auth.token` se rellena por orden de prioridad: primero el token compartido explícito,
    luego un `deviceToken` explícito, luego un token almacenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` se envía solo cuando ninguno de los anteriores resolvió
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La promoción automática de un token de dispositivo almacenado en el reintento único
    `AUTH_TOKEN_MISMATCH` está limitada solo a endpoints confiables: loopback,
    o `wss://` con una `tlsFingerprint` fijada. `wss://` público sin fijación
    no califica.
- El bootstrap integrado con código de configuración devuelve el
  `hello-ok.auth.deviceToken` del Node primario más un token de operador acotado en
  `hello-ok.auth.deviceTokens` para transferencia móvil confiable. El token de operador
  incluye `operator.talk.secrets` para lecturas de configuración nativa de Talk, pero
  excluye ámbitos de mutación de emparejamiento y `operator.admin`.
- Mientras un bootstrap con código de configuración no base espera aprobación,
  los detalles de `PAIRING_REQUIRED` incluyen `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` y `pauseReconnect: false`. Sigue reconectando con el
  mismo token de bootstrap hasta que la solicitud se apruebe o el token deje de ser
  válido.
- Persiste `hello-ok.auth.deviceTokens` solo cuando la conexión usó autenticación de bootstrap
  en un transporte confiable como `wss://` o emparejamiento local/loopback.
- Si un cliente proporciona un `deviceToken` explícito o `scopes` explícitos, ese
  conjunto de ámbitos solicitado por el llamador sigue siendo autoritativo; los ámbitos en caché solo
  se reutilizan cuando el cliente reutiliza el token almacenado por dispositivo.
- Los tokens de dispositivo se pueden rotar/revocar mediante `device.token.rotate` y
  `device.token.revoke` (requiere `operator.pairing`). Rotar o revocar un
  Node u otro rol no operador también requiere `operator.admin`.
- `device.token.rotate` devuelve metadatos de rotación. Hace eco del token portador
  de reemplazo solo para llamadas del mismo dispositivo ya autenticadas con ese
  token de dispositivo, para que los clientes solo con token puedan persistir su reemplazo antes de
  reconectar. Las rotaciones compartidas/de administrador no hacen eco del token portador.
- La emisión, rotación y revocación de tokens permanecen acotadas al conjunto de roles aprobado
  registrado en la entrada de emparejamiento de ese dispositivo; la mutación de tokens no puede ampliar ni
  apuntar a un rol de dispositivo que la aprobación de emparejamiento nunca concedió.
- Para sesiones con token de dispositivo emparejado, la administración de dispositivos se limita a sí misma salvo que
  el llamador también tenga `operator.admin`: los llamadores no administradores solo pueden administrar
  el token de operador de su propia entrada de dispositivo. La administración de tokens de Node y otros
  no operadores es solo de administrador, incluso para el propio dispositivo del llamador.
- `device.token.rotate` y `device.token.revoke` también comprueban el conjunto de ámbitos
  del token de operador de destino frente a los ámbitos de sesión actuales del llamador.
  Los llamadores no administradores no pueden rotar ni revocar un token de operador más amplio que el que
  ya poseen.
- Los fallos de autenticación incluyen `error.details.code` más sugerencias de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep`: uno de `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes confiables pueden intentar un reintento acotado con un token
    por dispositivo en caché.
  - Si ese reintento falla, detén los bucles de reconexión automática y muestra la guía de
    acción para el operador.
- `AUTH_SCOPE_MISMATCH` significa que el token de dispositivo fue reconocido pero no
  cubre el rol/los ámbitos solicitados. No lo presentes como un token incorrecto; pide
  al operador volver a emparejar o aprobar el contrato de ámbitos más estrecho/más amplio.

## Identidad de dispositivo y emparejamiento

- Los Nodes deben incluir una identidad de dispositivo estable (`device.id`) derivada de una
  huella de keypair.
- Los Gateways emiten tokens por dispositivo + rol.
- Se requieren aprobaciones de emparejamiento para nuevos IDs de dispositivo salvo que la
  aprobación automática local esté habilitada.
- La aprobación automática de emparejamiento se centra en conexiones directas de local loopback.
- OpenClaw también tiene una ruta estrecha de autoconexión local al backend/contenedor para
  flujos auxiliares confiables con secreto compartido.
- Las conexiones de tailnet del mismo host o LAN se siguen tratando como remotas para el emparejamiento
  y requieren aprobación.
- Los clientes WS normalmente incluyen identidad `device` durante `connect` (operador +
  Node). Las únicas excepciones de operador sin dispositivo son rutas de confianza explícitas:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad HTTP insegura solo en localhost.
  - autenticación correcta de Control UI de operador con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (emergencia, degradación de seguridad severa).
  - RPCs de backend de `gateway-client` por loopback directo en la ruta auxiliar interna reservada.
- Omitir la identidad de dispositivo tiene consecuencias de ámbito. Cuando una conexión de
  operador sin dispositivo se permite mediante una ruta de confianza explícita, OpenClaw
  aún limpia los ámbitos autodeclarados a un conjunto vacío salvo que esa ruta tenga una
  excepción de preservación de ámbitos nombrada. Los métodos protegidos por ámbito fallan entonces con
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` es una ruta de preservación de ámbitos
  de emergencia de Control UI. No concede ámbitos a clientes WebSocket de backend personalizados
  arbitrarios ni con forma de CLI.
- La ruta auxiliar reservada de backend de `gateway-client` por loopback directo preserva
  ámbitos solo para RPCs internas de plano de control local; los IDs de backend personalizados
  no reciben esta excepción.
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de autenticación de dispositivos

Para clientes heredados que todavía usan el comportamiento de firma previo al desafío, `connect`
devuelve códigos de detalle `DEVICE_AUTH_*` bajo `error.details.code` con un
`error.details.reason` estable.

Fallos comunes de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió en blanco). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto/incorrecto. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga útil de la firma no coincide con la carga útil v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella de la clave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falló el formato/canonicalización de la clave pública. |

Objetivo de migración:

- Espera siempre `connect.challenge`.
- Firma la carga útil v2 que incluye el nonce del servidor.
- Envía el mismo nonce en `connect.params.device.nonce`.
- La carga útil de firma preferida es `v3`
  (`buildDeviceAuthPayloadV3` en `packages/gateway-client/src/device-auth.ts`),
  que vincula `platform` y `deviceFamily`, además de los campos
  de dispositivo/cliente/rol/alcances/token/nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero la
  fijación de metadatos de dispositivos emparejados sigue controlando la política
  de comandos al reconectar.

## TLS y fijación

- TLS es compatible con conexiones WS (configuración `gateway.tls`).
- Los clientes pueden fijar opcionalmente la huella del certificado del gateway mediante
  `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`.

## Alcance

Este protocolo expone la API completa del gateway: estado, canales, modelos, chat,
agente, sesiones, nodos, aprobaciones y más. La superficie exacta la definen
los esquemas TypeBox reexportados desde `packages/gateway-protocol/src/schema.ts`.

## Relacionado

- [Protocolo de puente](/es/gateway/bridge-protocol)
- [Runbook del Gateway](/es/gateway)
