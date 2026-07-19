---
read_when:
    - Implementación o actualización de clientes WS del Gateway
    - Depuración de incompatibilidades de protocolo o fallos de conexión
    - Regeneración del esquema y los modelos del protocolo
summary: 'Protocolo WebSocket del Gateway: negociación, tramas y versionado'
title: Protocolo del Gateway
x-i18n:
    generated_at: "2026-07-19T13:35:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9411a21c528545cdaa9d06c5e2ac554cf56912aa314d6ab9bba92d7da467dd1e
    source_path: gateway/protocol.md
    workflow: 16
---

El protocolo WS del Gateway es el único plano de control y transporte de nodos para
OpenClaw. Los clientes de operador y de nodo (CLI, interfaz web, aplicación para macOS, nodos iOS/Android,
nodos sin interfaz gráfica) se conectan mediante WebSocket y declaran un **rol** y un **ámbito** en el
momento del protocolo de enlace.

## Transporte y entramado

- WebSocket, tramas de texto, cargas útiles JSON.
- La primera trama **debe** ser una solicitud `connect`.
- Las tramas previas a la conexión están limitadas a 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Después
  del protocolo de enlace, se aplican `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con los diagnósticos habilitados, las tramas
  entrantes demasiado grandes y los búferes de salida lentos emiten eventos `payload.large` antes de que
  el Gateway cierre o descarte la trama. Estos eventos incluyen `surface`, tamaños en
  bytes, límites y un código de motivo seguro, pero nunca cuerpos de mensajes, contenido de
  archivos adjuntos, bytes de tramas sin procesar, tokens, cookies ni secretos.

Formas de las tramas:

- Solicitud: `{type:"req", id, method, params}`
- Respuesta: `{type:"res", id, ok, payload|error}`
- Evento: `{type:"event", event, payload, seq?, stateVersion?}`

Los errores de respuesta usan `{ code, message, details?, retryable?, retryAfterMs? }`.
Los clientes deben bifurcar según `code` y `details.code`; `message` permanece legible
para humanos y puede cambiar, salvo cuando una nota de compatibilidad indique lo contrario. Los fallos de
autorización a nivel de método usan `code: "FORBIDDEN"` en el nivel superior con detalles
estructurados sobre los ámbitos que faltan:

- Ámbito faltante: `{ code: "MISSING_SCOPE", missingScope, requiredScopes }`.
  `requiredScopes` es el conjunto completo de ámbitos conocidos para la operación solicitada.
  El mensaje heredado `missing scope: <scope>` se conserva para clientes antiguos.

Los clientes deben leer primero `details` y usar el mensaje heredado únicamente como alternativa
de compatibilidad. `readMissingScopeError` y `readMissingScopeErrorDetails` se exportan desde
`@openclaw/gateway-protocol/gateway-error-details`; el cliente del Gateway seguro para navegadores
los vuelve a exportar desde `@openclaw/gateway-client/browser`.

Los esquemas se exportan como `GatewayErrorDetailsSchema`,
`MissingScopeErrorDetailsSchema` desde `@openclaw/gateway-protocol/schema`.
Los fallos de ámbito HTTP reflejan el objeto `MISSING_SCOPE` en `error.details` y
usan el estado HTTP `403`.

Los métodos con efectos secundarios requieren claves de idempotencia (consulte el esquema).

## Protocolo de enlace

El Gateway envía un desafío previo a la conexión:

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

El Gateway responde con `hello-ok`:

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

`server`, `features`, `snapshot`, `policy` y `auth` son obligatorios para
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`). `auth`
informa del rol y los ámbitos negociados incluso cuando no se emite ningún token de dispositivo (forma
anterior). `pluginSurfaceUrls` es opcional y asigna nombres de superficies de plugins (p. ej.,
`canvas`) a URL alojadas con ámbito; puede caducar, por lo que los nodos llaman a
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` para obtener una entrada nueva.
La ruta obsoleta `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
no es compatible; use superficies de plugins.
El valor opcional `appliedConfigHash` de la instantánea es la revisión resuelta de la configuración de origen
aceptada por el entorno de ejecución activo del Gateway. Los clientes pueden compararla con
`config.get.configRevisionHash` para determinar si una configuración guardada más reciente aún
requiere un reinicio. `config.get.hash` sigue siendo la revisión sin procesar del archivo raíz que usan
las protecciones contra conflictos de escritura de configuración.

Mientras el Gateway aún termina de iniciar los procesos auxiliares, `connect` puede devolver un
error reintentable `UNAVAILABLE` con `details.reason: "startup-sidecars"` y
`retryAfterMs`. Vuelva a intentarlo dentro del margen de conexión en lugar de tratarlo como
un fallo terminal del protocolo de enlace.

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

El arranque integrado mediante QR/código de configuración es una ruta de transferencia móvil. Una
conexión correcta con un código de configuración básico devuelve un token de nodo principal y un
token de operador limitado:

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

Esta transferencia al operador está limitada intencionadamente: es suficiente para iniciar el bucle
del operador móvil y la configuración nativa, incluido `operator.talk.secrets` para las
lecturas de configuración de Talk, pero no incluye ámbitos para modificar el emparejamiento ni `operator.admin`. Un acceso
más amplio de emparejamiento/administración requiere un flujo independiente de emparejamiento aprobado o de tokens. Conserve
`hello-ok.auth.deviceTokens` únicamente cuando la autenticación de arranque se haya ejecutado mediante un
transporte de confianza (`wss://` o emparejamiento de bucle invertido/local).

Los clientes de backend de confianza del mismo proceso (`client.id: "gateway-client"`,
`client.mode: "backend"`) pueden omitir `device` en conexiones directas de bucle invertido cuando
se autentican con el token o la contraseña compartidos del Gateway. Esta ruta está reservada
para RPC internos del plano de control (p. ej., actualizaciones de sesiones de subagentes) y evita
que referencias básicas obsoletas de emparejamiento de CLI/dispositivos bloqueen el trabajo local del backend. Los clientes remotos,
con origen en el navegador, de nodo y con token de dispositivo o identidad de dispositivo explícitos siguen
los controles normales de emparejamiento y ampliación de ámbitos.

### Rol de trabajador y protocolo cerrado

Los trabajadores en la nube usan una entrada de bucle invertido dedicada a través del túnel SSH
propiedad del Gateway y fijado a la clave del host. Solo acepta identidades de trabajador y nunca despacha
autenticación general, eventos de nodo, RPC de operador ni métodos de plugins. Un `connect` estricto
verifica una credencial efímera almacenada como hash y vinculada al entorno, al hash
del paquete, a la época del propietario, a la versión del conjunto de RPC, a la caducidad y a una sesión anulable; además,
comprueba por separado la versión actual y el conjunto de características. Si se completa correctamente, devuelve un
`worker-hello-ok` mínimo; la negociación de características es independiente de la versión general
del protocolo. Las tramas se mantienen por debajo de 64 KiB, salvo una trama `worker.inference.start`
negociada, que puede alcanzar hasta 25 MiB. La lista cerrada de permitidos contiene `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start` y
`worker.inference.cancel`.

Las confirmaciones de transcripciones usan delimitación por época del propietario, una vinculación de sesión
propiedad del Gateway, comparación e intercambio de la hoja base y reproducción duradera de secuencias; el Gateway genera
los identificadores de las entradas de transcripción y sus elementos superiores mediante el escritor de sesiones normal. La propiedad y
la caducidad se vuelven a comprobar en cada RPC.

### Capacidades del cliente

Los clientes de operador pueden anunciar capacidades opcionales en `connect.params.caps`:

- `tool-events`: acepta eventos estructurados del ciclo de vida de las herramientas.
- `inline-widgets`: puede representar resultados de herramientas de widgets integrados alojados.

Las capacidades del cliente describen al cliente conectado, no la autorización. Las herramientas del agente pueden declarar capacidades obligatorias; el Gateway omite esas herramientas a menos que todos los requisitos aparezcan en `caps` del cliente de origen. Las ejecuciones originadas en canales no tienen capacidades de cliente del Gateway, por lo que las herramientas restringidas por capacidades no están disponibles aunque la política de herramientas las permita explícitamente.

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

Los nodos declaran capacidades afirmadas al conectarse:

- `caps`: categorías de alto nivel como `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: lista de comandos permitidos para la invocación.
- `permissions`: controles granulares (p. ej., `screen.record`, `camera.capture`).

El Gateway los trata como afirmaciones y aplica listas de permitidos en el servidor.

## Roles y ámbitos

Para consultar el modelo completo de ámbitos del operador, las comprobaciones en el momento de la aprobación y la semántica
de secretos compartidos, consulte [Ámbitos del operador](/es/gateway/operator-scopes).

Roles:

- `operator`: cliente del plano de control (CLI/interfaz de usuario/automatización).
- `node`: host de capacidades (cámara/pantalla/lienzo/system.run).
- `worker`: host de ejecución en la nube en el protocolo dedicado y cerrado de trabajadores.

Ámbitos del operador (`src/gateway/operator-scopes.ts`), el conjunto cerrado completo:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` requiere `operator.talk.secrets` (o
`operator.admin`). Cuando se incluyan secretos, lea la credencial activa del proveedor de Talk
desde `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
conserva la forma del origen y puede ser un objeto SecretRef o una cadena censurada.

Los métodos RPC del Gateway registrados por plugins pueden solicitar su propio ámbito de operador,
pero estos prefijos reservados del núcleo siempre se resuelven como `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

El ámbito del método es solo la primera barrera. Algunos comandos con barra a los que se accede mediante
`chat.send` aplican comprobaciones más estrictas a nivel de comando: las escrituras persistentes de `/config set` y
`/config unset` requieren `operator.admin` incluso para clientes del Gateway que
ya tengan un ámbito de operador inferior.

`node.pair.approve` tiene una comprobación de ámbito adicional en el momento de la aprobación, además del ámbito
base del método (`operator.pairing`), según el valor `commands` declarado
por la solicitud pendiente (`src/infra/node-pairing-authz.ts`):

| Comandos declarados                                                                                                           | Ámbitos requeridos                         |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| ninguno                                                                                                                       | `operator.pairing`                         |
| comandos ordinarios                                                                                                          | `operator.pairing` + `operator.write`    |
| incluye `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` o `system.execApprovals.get/set` | `operator.pairing` + `operator.admin`    |

### Capacidades/comandos/permisos (nodo)

Los nodos declaran capacidades afirmadas al conectarse:

- `caps`: categorías de capacidades de alto nivel, como `camera`, `canvas`, `screen`,
  `location`, `voice` y `talk`.
- `commands`: lista de comandos permitidos para la invocación.
- `permissions`: controles granulares (p. ej., `screen.record`, `camera.capture`).

El Gateway trata estos elementos como **declaraciones** y aplica listas de permitidos en el servidor.
Los nodos conectados pueden publicar descriptores opcionales de herramientas de plugins o MCP visibles para el agente
con `node.pluginTools.update` después de conectarse o
reconectarse correctamente. Los hosts de nodos sin interfaz se reinician para aplicar cambios
declarativos en el inventario de MCP. Este método de actualización es la única vía de publicación; los descriptores de herramientas de plugins no se aceptan en los
parámetros de `connect`. Cada descriptor debe usar un `name` de herramienta seguro para el proveedor y nombrar
un `command` incluido en la lista actual de comandos permitidos del nodo. El Gateway confía en los metadatos
del descriptor procedentes del nodo emparejado, filtra los descriptores fuera de la superficie de comandos
aprobada, los elimina cuando el nodo se desconecta y rechaza los intentos de los operadores
de modificar el catálogo de otro nodo. Establezca `gateway.nodes.pluginTools.enabled: false`
para ignorar los descriptores publicados por los nodos.

Los hosts de nodos conectados publican su catálogo completo de reemplazo de Skills con
`node.skills.update`. Este método del rol de nodo es la única vía de publicación
de Skills del nodo; las Skills no se aceptan en los parámetros de `connect`. Cada descriptor contiene un
nombre seguro, una descripción y contenido de `SKILL.md` limitado. El Gateway analiza ese
contenido con el cargador normal de Skills, lo incluye en las instantáneas de Skills del agente
mientras el nodo está conectado y lo elimina al desconectarse. Establezca
`gateway.nodes.skills.enabled: false` para ignorar las Skills publicadas por los nodos.

## Presencia

- `system-presence` devuelve entradas indexadas por la identidad del dispositivo, incluidos
  `deviceId`, `roles` y `scopes`, para que las interfaces puedan mostrar una fila por dispositivo incluso
  cuando se conecta como operador y como nodo.
- `node.list` incluye `lastSeenAtMs` y `lastSeenReason` opcionales. Los nodos
  conectados informan de la hora actual de conexión con el motivo `connect`; los nodos emparejados también pueden
  informar de una presencia duradera en segundo plano mediante un evento de nodo de confianza.

Los nodos nativos de macOS también pueden enviar eventos autenticados de `node.presence.activity`
con un tiempo de inactividad de entrada limitado. El Gateway obtiene las marcas de tiempo de actividad con su
propio reloj, expone el Mac conectado más reciente mediante `node.list` y
`node.describe`, y difunde actualizaciones de `node.presence` a clientes con ámbito de lectura.
Consulte [Presencia del ordenador activo](/es/nodes/presence) para obtener información sobre la selección, la privacidad, el contexto del modelo
y el comportamiento del enrutamiento de notificaciones.

### Evento de nodo activo en segundo plano

Los nodos llaman a `node.event` con `event: "node.presence.alive"` para registrar que un
nodo emparejado estuvo activo durante una activación en segundo plano, sin marcarlo como conectado:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` es una enumeración cerrada: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Los valores desconocidos se normalizan como
`background` (`src/shared/node-presence.ts`). El evento solo se conserva para
sesiones autenticadas de dispositivos de nodo; las sesiones sin dispositivo o no emparejadas devuelven
`handled: false`.

Los gateways compatibles devuelven un resultado estructurado:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Los gateways más antiguos pueden devolver únicamente `{ "ok": true }` para `node.event`; esto debe tratarse
como una RPC confirmada, no como una persistencia duradera de la presencia.

## Ámbito de los eventos de difusión

Los eventos de difusión enviados por el servidor están restringidos por ámbito para que las sesiones
limitadas al emparejamiento o exclusivas de nodos no reciban pasivamente contenido de sesión
(`src/gateway/server-broadcast.ts`):

- Los fotogramas de chat, agente y resultados de herramientas (eventos de `agent` transmitidos, eventos de resultados
  de herramientas) requieren al menos `operator.read`. Las sesiones que no lo tengan omiten estos
  fotogramas por completo.
- Las difusiones de `plugin.*` definidas por plugins se restringen de forma predeterminada a `operator.write` o
  `operator.admin`; las entradas explícitas como
  `plugin.approval.requested` / `plugin.approval.resolved` usan
  `operator.approvals` en su lugar.
- Los eventos de estado/transporte (`heartbeat`, `presence`, `tick`, ciclo de vida de conexión/desconexión)
  permanecen sin restricciones para que todas las sesiones autenticadas puedan
  observar el estado del transporte.
- Las familias desconocidas de eventos de difusión están restringidas por ámbito de forma predeterminada (se bloquean ante fallos),
  salvo que un controlador registrado las flexibilice explícitamente.

Cada conexión de cliente mantiene su propio número de secuencia por cliente, por lo que las difusiones
se mantienen ordenadas de forma monótona en ese socket incluso cuando distintos clientes ven
subconjuntos diferentes del flujo de eventos filtrados por ámbito.

## Familias de métodos RPC

`hello-ok.features.methods` es una lista de detección conservadora creada a partir de
`src/gateway/server-methods-list.ts` más las exportaciones de métodos de plugins/canales
cargados; no es un volcado generado de todos los métodos, y algunos métodos (por
ejemplo, `push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
se excluyen intencionadamente de la detección aunque sean métodos reales e
invocables. Debe tratarse como detección de funciones, no como una enumeración completa de
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidad">
    - `health` devuelve la instantánea de estado del Gateway almacenada en caché o consultada recientemente.
    - `diagnostics.stability` devuelve el registrador de estabilidad de diagnóstico reciente y limitado: nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de colas/sesiones, nombres de canales/plugins e identificadores de sesión. No incluye texto de chats, cuerpos de webhooks, resultados de herramientas, cuerpos sin procesar de solicitudes/respuestas, tokens, cookies ni secretos. Requiere `operator.read`.
    - `status` devuelve el resumen del Gateway al estilo de `/status`; los campos confidenciales solo están disponibles para clientes operadores con ámbito de administración.
    - `gateway.identity.get` devuelve la identidad de dispositivo del Gateway utilizada por los flujos de retransmisión y emparejamiento.
    - `system-presence` devuelve la instantánea de presencia actual de los dispositivos operadores/nodos conectados.
    - `system-event` añade un evento del sistema y puede actualizar/difundir el contexto de presencia.
    - `last-heartbeat` devuelve el último evento de Heartbeat persistido.
    - `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el Gateway.
    - `gateway.suspend.prepare` crea un arrendamiento breve de suspensión cooperativa solo cuando el trabajo supervisado del Gateway está inactivo. `gateway.suspend.status` comprueba ese arrendamiento y `gateway.suspend.resume` lo libera tras la reanudación o después de abortar una operación del host.

  </Accordion>

  <Accordion title="Modelos y uso">
    - `models.list` devuelve el catálogo de modelos permitidos durante la ejecución. Consulte las «vistas de `models.list`» más adelante.
    - `usage.status` devuelve resúmenes de los intervalos de uso y de la cuota restante del proveedor.
    - `usage.cost` devuelve resúmenes agregados del uso de costes para un intervalo de fechas. Pase `agentId` para un agente o `agentScope: "all"` para agregar los agentes configurados.
    - `doctor.memory.status` devuelve la disponibilidad de la memoria vectorial o de las incrustaciones almacenadas en caché para el espacio de trabajo del agente predeterminado activo. Pase `{ "probe": true }` o `{ "deep": true }` únicamente para realizar un sondeo activo y explícito al proveedor de incrustaciones. Pase `{ "agentId": "agent-id" }` para limitar las estadísticas del almacén de Dreaming al espacio de trabajo de un agente; si se omite, se agregan los espacios de trabajo de Dreaming configurados.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` y `doctor.memory.dedupeDreamDiary` aceptan un `{ "agentId": "agent-id" }` opcional; si se omite, operan en el espacio de trabajo del agente predeterminado configurado.
    - `doctor.memory.remHarness` devuelve una vista previa limitada y de solo lectura del entorno de pruebas REM para clientes remotos del plano de control, incluidas rutas del espacio de trabajo, fragmentos de memoria, Markdown fundamentado renderizado y candidatos a promoción profunda. Requiere `operator.read`.
    - `sessions.usage` devuelve resúmenes de uso por sesión. Pase `agentId` para un agente o `agentScope: "all"` para enumerar conjuntamente los agentes configurados.
      Ambos métodos de uso aceptan `mode: "specific"` con una `timeZone` de IANA para establecer límites y segmentos de días naturales que tengan en cuenta el horario de verano. `utcOffset` sigue siendo compatible con clientes antiguos y se utiliza como alternativa cuando el entorno de ejecución del Gateway no reconoce la zona solicitada.
    - `sessions.usage.timeseries` devuelve el uso como serie temporal de una sesión.
    - `sessions.usage.logs` devuelve entradas del registro de uso de una sesión.

  </Accordion>

  <Accordion title="Canales y asistentes de inicio de sesión">
    - `channels.status` devuelve resúmenes de estado de los canales/plugins integrados y empaquetados.
    - `channels.logout` cierra la sesión de un canal/cuenta específicos cuando el canal lo admite.
    - `web.login.start` inicia un flujo de inicio de sesión mediante QR/web para el proveedor actual de canales web compatible con QR.
    - `web.login.wait` espera a que finalice ese flujo e inicia el canal si se completa correctamente.
    - `push.test` envía una notificación push de APNs de prueba a un nodo iOS registrado.
    - `voicewake.get` devuelve los activadores de palabras de activación almacenados.
    - `voicewake.set` actualiza los activadores de palabras de activación y difunde el cambio.

  </Accordion>

  <Accordion title="Gestión de plugins">
    - `plugins.list` (`operator.read`) devuelve el inventario de plugins instalados junto con selecciones oficiales gestionadas localmente, diagnósticos e información sobre si el modo de instalación actual permite modificaciones.
    - `plugins.search` (`operator.read`) busca familias instalables de plugins de código y plugins de paquetes de ClawHub. Pase un `query` no vacío y un `limit` opcional de 1 a 100.
    - `plugins.install` (`operator.admin`) instala una entrada del catálogo oficial con `{ source: "official", pluginId }` o un paquete de ClawHub con `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. Las instalaciones de ClawHub conservan las comprobaciones de confianza, integridad y políticas de instalación del Gateway. Las instalaciones correctas requieren reiniciar el Gateway.
    - `plugins.setEnabled` (`operator.admin`) cambia la política de activación de un plugin instalado mediante `{ pluginId, enabled }`. La respuesta incluye la entrada de catálogo actualizada, los metadatos de reinicio y cualquier advertencia de selección de ranura.
    - `plugins.uninstall` (`operator.admin`) elimina un plugin instalado externamente mediante `{ pluginId }`: referencias de configuración, el registro de instalación y los archivos gestionados. Los plugins empaquetados no pueden desinstalarse, solo desactivarse. La respuesta enumera las acciones de eliminación y siempre requiere reiniciar el Gateway.

  </Accordion>

  <Accordion title="Mensajería y registros">
    - `send` es la RPC de entrega saliente directa para envíos dirigidos a un canal, una cuenta o un hilo fuera del ejecutor de chat.
    - `logs.tail` devuelve el final del registro de archivos configurado del Gateway, con controles de cursor/límite y de bytes máximos.

  </Accordion>

  <Accordion title="Terminal del operador">
    - `terminal.open` inicia una PTY del host para un `agentId` explícito o para el agente predeterminado y devuelve el agente resuelto, el directorio de trabajo, el shell y el estado de confinamiento.
    - `terminal.input`, `terminal.resize` y `terminal.close` operan únicamente en sesiones propiedad de la conexión que realiza la llamada.
    - `terminal.upload` acepta un archivo en base64 de hasta 16 MiB, lo almacena temporalmente en un directorio privado con una duración de 24 horas en el Gateway de la sesión o en el host del nodo emparejado y devuelve la ruta absoluta. La parte que realiza la llamada aún debe pegar o utilizar esa ruta de algún otro modo; la RPC nunca escribe entradas en el terminal ni ejecuta comandos.
    - Los eventos `terminal.data` y `terminal.exit` se transmiten únicamente a la conexión propietaria de la sesión.
    - Las sesiones cuya conexión se interrumpe se desvinculan, pero no se terminan: permanecen disponibles para volver a vincularse durante `gateway.terminal.detachedSessionTimeoutSeconds` (valor predeterminado: 300; `0` restaura la terminación al desconectarse), mientras la salida reciente se acumula en un búfer limitado del lado del servidor.
    - `terminal.list` devuelve las sesiones que pueden vincularse; `terminal.attach` vuelve a vincular una sesión activa o desvinculada a la conexión que realiza la llamada y devuelve el búfer de reproducción (toma de control al estilo de tmux: un propietario activo anterior recibe `terminal.exit` con el motivo `detached`); `terminal.text` lee el búfer como texto sin formato sin vincularse.
    - Todos los métodos del terminal requieren `operator.admin`; `gateway.terminal.enabled` debe ser explícitamente verdadero. Se rechazan los agentes completamente aislados y un cambio en la política del agente cierra las PTY existentes y en curso, incluidas las desvinculadas.

  </Accordion>

  <Accordion title="Conversación y TTS">
    - `talk.catalog` devuelve el catálogo de proveedores de conversación de solo lectura para voz, transcripción en streaming y voz en tiempo real: identificadores canónicos de proveedores, alias del registro, etiquetas, estado de configuración, un resultado opcional `ready` a nivel de grupo, identificadores expuestos de modelos y voces, modos canónicos, transportes, estrategias de razonamiento y marcas de audio y capacidades en tiempo real, sin devolver secretos del proveedor ni modificar la configuración global. Los gateways actuales establecen `ready` después de aplicar la selección del proveedor en tiempo de ejecución; su ausencia debe considerarse como no verificada en gateways anteriores.
    - `talk.config` devuelve la carga útil efectiva de configuración de conversación; `includeSecrets` requiere `operator.talk.secrets` (o `operator.admin`).
    - `talk.session.create` crea una sesión de conversación propiedad del Gateway para `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. Para `stt-tts/managed-room`, las partes `operator.write` que realizan la llamada y proporcionan `sessionKey` también deben proporcionar `spawnedBy` para obtener visibilidad de la clave de sesión limitada al ámbito; la creación de `sessionKey` sin ámbito y `brain: "direct-tools"` requieren `operator.admin`.
    - `talk.session.join` valida un token de sesión de sala administrada, emite `session.ready` o `session.replaced` según sea necesario y devuelve metadatos de la sala y la sesión junto con eventos recientes de conversación, pero nunca el token en texto sin formato ni su hash.
    - `talk.session.appendAudio` añade audio de entrada PCM en base64 a las sesiones de retransmisión en tiempo real y transcripción propiedad del Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` y `talk.session.cancelTurn` controlan el ciclo de vida de los turnos de las salas administradas, con rechazo de turnos obsoletos antes de borrar el estado.
    - `talk.session.cancelOutput` detiene la salida de audio del asistente, principalmente para permitir interrupciones controladas por VAD en sesiones de retransmisión del Gateway.
    - `talk.session.submitToolResult` completa una llamada a herramienta del proveedor emitida por una sesión de retransmisión en tiempo real propiedad del Gateway. La solicitud espera cualquier señal de finalización asíncrona expuesta por el puente del proveedor; los envíos fallidos mantienen activa la ejecución vinculada y no emiten un evento de resultado de herramienta satisfactorio. Proporcione `options: { willContinue: true }` para una salida provisional de la herramienta o `options: { suppressResponse: true }` cuando el puente del proveedor anuncie compatibilidad con la supresión y el resultado no deba iniciar otra respuesta.
    - `talk.session.steer` envía el control por voz de la ejecución activa a una sesión de conversación respaldada por un agente y propiedad del Gateway: `{ sessionId, text, mode? }`, donde `mode` es `status`, `steer`, `cancel` o `followup`; si se omite el modo, se clasifica a partir del texto hablado.
    - `talk.session.close` cierra una sesión de retransmisión, transcripción o sala administrada propiedad del Gateway y emite eventos terminales de conversación.
    - `talk.mode` establece y difunde el estado actual del modo de conversación para clientes de WebChat/Control UI.
    - `talk.client.create` crea o reanuda una sesión de proveedor en tiempo real propiedad del cliente mediante `webrtc` o `provider-websocket`, mientras el Gateway administra las credenciales, las instrucciones, la política de herramientas y el valor `voiceSessionId` devuelto. Los clientes proporcionan `sessionKey` y reutilizan `voiceSessionId` al sustituir el transporte del proveedor durante una llamada.
    - `talk.client.transcript` añade un elemento `{ role, text }` finalizado a la sesión normal del agente. El valor `entryId` obligatorio es idempotente dentro de `voiceSessionId`; los reintentos no duplican los mensajes de la transcripción.
    - `talk.client.close` cierra la sesión de voz lógica después de las escrituras pendientes de la transcripción. El cierre es idempotente y puede entregar un resumen de la llamada que solo contiene mutaciones al último canal de la sesión que no sea WebChat.
    - `talk.client.toolCall` permite que los transportes en tiempo real propiedad del cliente reenvíen las llamadas a herramientas del proveedor a la política del Gateway. La primera herramienta compatible es `openclaw_agent_consult`; los clientes obtienen un identificador de ejecución y esperan los eventos normales del ciclo de vida del chat antes de enviar el resultado de herramienta específico del proveedor. Las acciones de alto impacto vinculadas a la voz devuelven `VOICE_CONFIRMATION_REQUIRED:<id>` hasta que una intervención posterior y finalizada del usuario confirme explícitamente esa acción exacta y la siguiente consulta proporcione `confirmationId`.
    - `talk.client.steer` envía el control por voz de la ejecución activa para transportes en tiempo real propiedad del cliente. El Gateway resuelve la ejecución integrada activa a partir de `sessionKey` y devuelve un resultado estructurado de aceptación o rechazo, en lugar de descartar silenciosamente las instrucciones.
    - `talk.event` es el canal único de eventos de conversación para adaptadores en tiempo real, transcripción, STT/TTS, salas administradas, telefonía y reuniones.
    - `talk.speak` sintetiza voz mediante el proveedor de voz de conversación activo.
    - `tts.status` devuelve el estado de activación de TTS, el proveedor activo, los proveedores alternativos y el estado de configuración del proveedor.
    - `tts.providers` devuelve el inventario visible de proveedores de TTS.
    - `tts.enable` y `tts.disable` alternan el estado de las preferencias de TTS.
    - `tts.setProvider` actualiza el proveedor de TTS preferido.
    - `tts.convert` ejecuta una conversión puntual de texto a voz.
    - `tts.speak` (`operator.write`) procesa contenido `text` no vacío con la cadena configurada de proveedores generales de TTS y devuelve un clip completo en línea como `audioBase64`, además de `provider` y los metadatos opcionales `outputFormat`, `mimeType` y `fileExtension`. A diferencia de `tts.convert`, no devuelve una ruta local del Gateway; a diferencia de `talk.speak`, no requiere un proveedor de conversación. El texto que supere `messages.tts.maxTextLength` devuelve `INVALID_REQUEST`; los fallos de síntesis devuelven `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Secretos, configuración, actualización y asistente">
    - `secrets.reload` vuelve a resolver las SecretRefs activas y publica atómicamente un estado de ejecución que tiene en cuenta al propietario. Los fallos de propietarios aptos pueden publicarse como degradación en frío u obsoleta con `warningCount`; los fallos estrictos o sin asignación rechazan la recarga y conservan la instantánea activa.
    - `secrets.resolve` resuelve las asignaciones de secretos de destinos de comandos para un conjunto específico de comandos y destinos.
    - `config.get` devuelve la instantánea actual de la configuración en disco, el valor `hash` sin procesar del archivo raíz, el valor `configRevisionHash` resuelto y el valor `appliedConfigHash` opcional para la revisión resuelta aceptada por el entorno de ejecución activo del Gateway.
    - `config.set` escribe una carga útil de configuración validada.
    - `config.patch` combina una actualización parcial de la configuración. La sustitución destructiva de matrices requiere la ruta afectada en `replacePaths`; las matrices anidadas dentro de entradas de matrices utilizan rutas `[]`, como `agents.list[].skills`.
    - `config.apply` valida y sustituye la carga útil completa de configuración.
    - `config.schema` devuelve la carga útil del esquema de configuración activo que utilizan Control UI y las herramientas de la CLI: esquema, `uiHints`, versión, metadatos de generación y metadatos del esquema de plugins y canales cuando pueden cargarse. Incluye metadatos `title` / `description` procedentes de las mismas etiquetas y textos de ayuda que la interfaz de usuario, incluidas las ramas de composición de objetos anidados, comodines, elementos de matriz y `anyOf` / `oneOf` / `allOf` cuando existe documentación de campos coincidente.
    - `config.schema.lookup` devuelve una carga útil de búsqueda limitada a una ruta para una ruta de configuración: la ruta normalizada, un nodo de esquema superficial, la sugerencia coincidente y `hintPath`, el valor `reloadKind` opcional y resúmenes de los elementos secundarios inmediatos para la exploración detallada en la interfaz de usuario o la CLI. `reloadKind` es uno de `restart`, `hot` o `none` (`src/config/schema.ts`) y refleja el planificador de recarga de la configuración del Gateway para la ruta solicitada. Los nodos del esquema de búsqueda conservan la documentación orientada al usuario y los campos de validación comunes (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos, de cadenas, matrices y objetos, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de los elementos secundarios exponen `key`, el valor `path` normalizado, `type`, `required`, `hasChildren`, el valor `reloadKind` opcional, además de los valores coincidentes `hint` / `hintPath`.
    - `update.run` ejecuta el flujo de actualización del Gateway y programa un reinicio únicamente si la actualización se completa correctamente; las partes que realizan la llamada y disponen de una sesión pueden incluir `continuationMessage` para que el inicio reanude un turno posterior del agente mediante la cola de continuación tras el reinicio. Las actualizaciones del gestor de paquetes y las actualizaciones supervisadas de repositorios Git desde el plano de control utilizan una transferencia a un servicio administrado independiente, en lugar de sustituir el árbol de paquetes o modificar la salida del repositorio o de la compilación dentro del Gateway activo. Una transferencia iniciada devuelve `ok: true` con `result.reason: "managed-service-handoff-started"` y `handoff.status: "started"`. Una segunda solicitud `update.run` simultánea gestionada por el mismo proceso del Gateway devuelve `ok: false` con `result.reason: "managed-service-handoff-already-running"` y `handoff.status: "already-running"`; su continuación no se acepta, por lo que la parte que realiza la llamada puede volver a intentarlo cuando finalice la actualización activa. Los actualizadores independientes de la CLI y los procesos de sustitución del Gateway quedan fuera de esta protección local del proceso. Las transferencias no disponibles o fallidas devuelven `ok: false` con `managed-service-handoff-unavailable` o `managed-service-handoff-failed`, además de `handoff.command` cuando se requiere una actualización manual desde el shell. «No disponible» significa que OpenClaw carece de un límite de supervisión seguro o de una identidad de servicio persistente, como `OPENCLAW_SYSTEMD_UNIT` para systemd. Durante una transferencia iniciada, el indicador de reinicio puede mostrar brevemente `stats.reason: "restart-health-pending"`; la continuación se retrasa hasta que la CLI verifica el Gateway reiniciado y escribe el indicador `ok` final.
    - `update.status` actualiza y devuelve el indicador más reciente de reinicio tras una actualización, incluida la versión en ejecución posterior al reinicio cuando está disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de incorporación mediante RPC de WS.

  </Accordion>

  <Accordion title="Ayudantes de agentes y espacios de trabajo">
    - `agents.list` devuelve las entradas de agentes configuradas, incluidos el modelo efectivo y los metadatos del entorno de ejecución.
    - `agents.create`, `agents.update` y `agents.delete` administran los registros de agentes y la conexión con el espacio de trabajo.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` administran los archivos de arranque del espacio de trabajo expuestos para un agente.
    - `audit.activity.list` devuelve el registro de actividad versionado que contiene solo metadatos; `audit.list` sigue siendo el RPC de ejecución/herramientas con compatibilidad garantizada.
    - `agents.workspace.list` y `agents.workspace.get` (`operator.read`) permiten explorar, en modo de solo lectura y con paginación, el directorio del espacio de trabajo de un agente para clientes del dominio de operadores de confianza descrito en [Ámbitos de operador](/es/gateway/operator-scopes). Las solicitudes solo aceptan rutas relativas al espacio de trabajo; las lecturas permanecen confinadas a la raíz del espacio de trabajo resuelta mediante realpath (se rechazan los escapes mediante enlaces simbólicos y enlaces físicos), tienen un límite de tamaño y se restringen a texto UTF-8 y tipos de imágenes comunes (base64). Las respuestas no exponen la ruta del espacio de trabajo del host. No hay operaciones de escritura en este espacio de nombres.
    - `tasks.list`, `tasks.get` y `tasks.cancel` exponen el registro de tareas del Gateway a clientes del SDK y operadores. Consulte [RPC del registro de tareas](#task-ledger-rpcs) a continuación.
    - `artifacts.list`, `artifacts.get` y `artifacts.download` exponen resúmenes y descargas de artefactos derivados de transcripciones para un ámbito explícito `sessionKey`, `runId` o `taskId`. Las consultas de ejecuciones y tareas resuelven en el servidor la sesión propietaria y solo devuelven contenido multimedia de la transcripción cuya procedencia coincida; las fuentes de URL inseguras o locales producen descargas no compatibles en lugar de obtenerse en el servidor.
    - `environments.list` y `environments.status` conservan la detección del entorno local del Gateway y del Node. Los trabajadores en la nube configurados y los registros duraderos dejados por perfiles anteriores añaden metadatos `worker` con `providerId`, `leaseId` opcional, `state`, `ageMs`, `idleMs` opcional y `attachedSessionIds`. Los estados del ciclo de vida de los trabajadores son `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` y `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) aprovisiona un trabajador a partir de un perfil de proveedor de Plugin configurado; los reintentos con la misma clave reutilizan la operación duradera. `environments.destroy` (`{ environmentId }`) solicita el desmantelamiento idempotente de un entorno de trabajador duradero. Ambos requieren `operator.admin`, son escrituras del plano de control y devuelven la misma estructura de resumen del entorno utilizada por las respuestas de estado.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o una sesión.
    - `agent.wait` espera a que finalice una ejecución y devuelve la instantánea terminal cuando está disponible.

  </Accordion>

  <Accordion title="Control de sesiones">
    - `sessions.list` devuelve el índice actual de sesiones, incluidos los metadatos `agentRuntime` por fila cuando se ha configurado un backend de entorno de ejecución de agentes. Cuando la ubicación en trabajadores en la nube está habilitada o existe un estado de recuperación duradero, las filas de sesión también incluyen un estado cerrado `placement` (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed` o `failed`), además de campos específicos del estado relativos al entorno, la época del propietario, el espacio de trabajo, el paquete, el cursor de ACK o la recuperación.
    - `sessions.subscribe` y `sessions.unsubscribe` activan o desactivan las suscripciones a eventos de cambio de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` activan o desactivan las suscripciones a eventos de transcripción/mensajes para una sesión. Pase `includeApprovals: true` para recibir también eventos de ciclo de vida `session.approval` saneados para aprobaciones cuya audiencia persistida incluya esa sesión exacta y cuya vinculación del revisor autorice al cliente suscriptor. La respuesta de suscripción incluye entonces un conjunto pendiente y acotado `approvalReplay`; este es la fuente autoritativa cuando `truncated` es falso. La participación es específica de cada llamada de suscripción, no persistente: volver a suscribirse a la misma sesión sin `includeApprovals: true` elimina una suscripción de aprobación existente. Además de la autorización normal de lectura de sesiones, esta participación requiere `operator.admin`, o `operator.approvals` en un dispositivo emparejado.
    - `sessions.preview` devuelve vistas previas acotadas de transcripciones para claves de sesión específicas.
    - `sessions.describe` devuelve una fila de sesión del Gateway para una clave de sesión exacta.
    - `sessions.resolve` resuelve o canoniza un destino de sesión.
    - `sessions.create` crea una nueva entrada de sesión. Los valores opcionales `model` y `thinkingLevel` persisten atómicamente las anulaciones iniciales del modelo y el razonamiento. `worktree: true` aprovisiona un árbol de trabajo administrado; los valores opcionales `worktreeBaseRef`/`worktreeName` seleccionan la referencia base y el nombre de la rama, y `execNode` (`operator.admin`) vincula la ejecución de la sesión a un host Node. El árbol de trabajo creado se incluye en el resultado y persiste en la fila de sesión (`worktree: { id, branch, repoRoot }`). Cuando se crea la entrada, pero se rechaza su `chat.send` inicial anidado, el resultado satisfactorio incluye `runStarted: false` y `runError`; los clientes pueden conservar el mensaje y volver a intentarlo con la clave de sesión devuelta. Un llamador que pase `parentSessionKey` con `emitCommandHooks: true` también debe declarar la disposición del ciclo de vida de un hijo distinto: `succeedsParent: true` finaliza el padre con `session_end`, mientras que `false` mantiene activo al padre y emite únicamente el `session_start` del hijo. Omitir `succeedsParent` conserva el comportamiento heredado de sustitución del padre para los clientes existentes. La disposición requiere tanto la vinculación con el padre como los enlaces de comandos; una bifurcación no puede completar satisfactoriamente a su padre. El comportamiento de restablecimiento en el mismo lugar de la sesión principal no cambia porque no se crea ningún hijo distinto.
    - `sessions.dispatch` (`operator.admin`) traslada una sesión local existente de OpenClaw, con un árbol de trabajo administrado propiedad de la sesión, a un perfil de trabajador en la nube configurado. Pase `{ key, profileId, agentId? }`. El método no está disponible cuando no se ha configurado ningún perfil de trabajador, cierra la admisión local de turnos antes de drenar el trabajo activo y solo devuelve el resultado después de que la ubicación alcance la propiedad del trabajador `active`. El envío es unidireccional; este RPC no incluye el retorno del trabajador al entorno local.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` y `sessions.groups.delete` administran el catálogo de grupos de sesiones personalizados propiedad del Gateway (nombres + orden de visualización). La pertenencia permanece en el campo `category` de cada sesión; el cambio de nombre y la eliminación actualizan en el servidor las sesiones miembro.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrupción y redirección para una sesión activa.
    - `sessions.abort` cancela el trabajo activo de una sesión. Pase `key` más el valor opcional `runId`, o solo `runId` para ejecuciones activas que el Gateway pueda resolver en una sesión.
    - `sessions.patch` actualiza los metadatos o las anulaciones de la sesión e informa del modelo canónico resuelto, además del `agentRuntime` efectivo.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan el mantenimiento de la sesión.
    - `sessions.get` devuelve la fila de sesión almacenada completa.
    - La ejecución del chat sigue utilizando `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` se normaliza para su visualización en clientes de interfaz de usuario: las etiquetas de directivas insertadas se eliminan del texto visible; se eliminan las cargas XML de llamadas a herramientas en texto sin formato (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y los tokens de control del modelo filtrados en ASCII o de ancho completo; se omiten las filas del asistente que contienen únicamente tokens de silencio (`NO_REPLY` / `no_reply` exactos), y las filas de tamaño excesivo pueden sustituirse por marcadores de posición.
    - `chat.message.get` es el lector aditivo y acotado del mensaje completo para una única entrada visible de la transcripción. Pase `sessionKey`, el valor opcional `agentId` cuando la selección de sesión esté limitada al agente y un `messageId` de transcripción expuesto previamente mediante `chat.history`; el Gateway devuelve la misma proyección normalizada para visualización sin el límite ligero de truncamiento del historial cuando la entrada almacenada sigue disponible y no tiene un tamaño excesivo.
    - `chat.toolTitles` devuelve títulos breves que describen la finalidad de las llamadas a herramientas representadas en la interfaz de control (por lotes, con un máximo de 24 elementos y entradas acotadas). La función se habilita explícitamente mediante `gateway.controlUi.toolTitles` (desactivada de forma predeterminada); los gateways deshabilitados responden `{ titles: {}, disabled: true }` sin llamar al modelo para que los clientes dejen de solicitarla. Cuando está habilitada, los títulos utilizan el enrutamiento estándar de modelos auxiliares: un `utilityModel` configurado explícitamente (una decisión del operador que, como todas las tareas auxiliares, puede enviar contenido acotado de la tarea al proveedor elegido) o, en caso contrario, el modelo pequeño predeterminado declarado por el proveedor de la sesión, de modo que no aparezca implícitamente ningún destino de salida nuevo; un `utilityModel` vacío los deshabilita por completo. Los títulos nunca recurren al modelo principal. Los resultados se almacenan en caché en la base de datos de estado por agente, con una clave formada por el nombre de la herramienta + la entrada, por lo que las vistas repetidas nunca vuelven a facturar las mismas llamadas.
    - `chat.send` acepta un `fastMode: "auto"` de un solo turno para utilizar el modo rápido en las llamadas al modelo iniciadas antes del corte automático y, posteriormente, iniciar reintentos, alternativas, resultados de herramientas o llamadas de continuación sin el modo rápido. El corte predeterminado es de 60 segundos (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) y puede configurarse por modelo mediante `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un llamador `chat.send` puede pasar un `fastAutoOnSeconds` de un solo turno para anular el corte en esa solicitud. Pase `queueMode` (`steer`, `followup`, `collect` o `interrupt`) para anular el modo de cola almacenado únicamente en esta solicitud; las acciones explícitas de redirección de la interfaz de control utilizan `queueMode: "steer"`.

  </Accordion>

  <Accordion title="Emparejamiento de dispositivos y tokens de dispositivos">
    - `device.pair.list` devuelve los dispositivos emparejados pendientes y aprobados.
    - `device.pair.setupCode` crea un código de configuración móvil y, de forma predeterminada, una URL de datos de un código QR PNG. Requiere `operator.admin` y se omite intencionadamente de la detección anunciada. El resultado incluye `setupCode`, el valor opcional `qrDataUrl`, `gatewayUrl`, la etiqueta no secreta `auth` y `urlSource`.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` administran los registros de emparejamiento de dispositivos.
    - `device.pair.rename` asigna una etiqueta de operador (`{ deviceId, label }`) que tiene prioridad sobre el nombre para mostrar informado por el cliente y se conserva tras reparar o volver a aprobar el dispositivo.
    - `device.token.rotate` rota el token de un dispositivo emparejado dentro de los límites de su rol aprobado y del ámbito del llamador.
    - `device.token.revoke` revoca el token de un dispositivo emparejado dentro de los límites de su rol aprobado y del ámbito del llamador.

    El código de configuración incorpora una credencial de arranque de corta duración. Los clientes no deben
    registrarla ni conservarla después del flujo de emparejamiento.

  </Accordion>

  <Accordion title="Emparejamiento de nodos, invocación y trabajo pendiente">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` y `node.pair.remove` abarcan las aprobaciones de capacidades de nodos. `node.pair.request` y `node.pair.verify` se eliminaron en 2026.7 junto con el almacén independiente de emparejamiento de nodos; el Gateway crea las solicitudes pendientes durante las conexiones de nodos.
    - `node.list` y `node.describe` devuelven el estado de los nodos conocidos/conectados.
    - `node.rename` actualiza la etiqueta de un nodo emparejado.
    - `node.invoke` reenvía un comando a un nodo conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud de invocación.
    - `mcp.tools.call.v1` es el comando del host de nodos sin interfaz gráfica para llamar a una herramienta MCP local del nodo configurada. Se transmite mediante `node.invoke`, requiere que el nodo declare el comando y sigue sujeto a la aprobación de emparejamiento y a `gateway.nodes.denyCommands`.
    - `node.event` transmite los eventos originados en nodos de vuelta al Gateway.
    - `node.pluginTools.update` es la única vía de publicación para sustituir los descriptores de herramientas de plugins/MCP visibles para el agente del nodo conectado; los parámetros de `connect` no los incluyen.
    - `node.pending.pull` y `node.pending.ack` son las API de cola de los nodos conectados.
    - `node.pending.enqueue` y `node.pending.drain` gestionan el trabajo pendiente duradero de los nodos sin conexión/desconectados.

  </Accordion>

  <Accordion title="Familias de aprobaciones">
    - `approval.history` devuelve, primero las más recientes, las aprobaciones terminales conservadas durante 30 días para solicitudes de ejecución, plugins y agentes del sistema (ámbito `operator.approvals`). Admite paginación mediante cursor y un filtro opcional por tipo; las aprobaciones pendientes no son filas del historial.
    - `approval.get` y `approval.resolve` son los métodos de aprobación duraderos independientes del tipo (ámbito `operator.approvals`). `approval.get` devuelve una proyección saneada pendiente o terminal conservada con un `urlPath` estable; `approval.resolve` acepta el identificador de aprobación canónico, un `kind` explícito y una decisión, aplica una resolución en la que prevalece la primera respuesta y siempre devuelve el resultado canónico registrado.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` abarcan las solicitudes de aprobación de ejecución de un solo uso, además de la consulta y repetición de aprobaciones pendientes. Son adaptadores de límite de protocolo sobre el mismo registro de aprobaciones duradero.
    - `exec.approval.waitDecision` espera una aprobación de ejecución pendiente y devuelve la decisión final (o `null` al agotarse el tiempo de espera).
    - `exec.approvals.get` y `exec.approvals.set` gestionan instantáneas de las políticas de aprobación de ejecución del Gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` gestionan la política de aprobación de ejecución local del nodo mediante comandos de retransmisión de nodos.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` abarcan los flujos de aprobación definidos por plugins.

  </Accordion>

  <Accordion title="Comandos de la interfaz de control">
    - `ui.command` permite que un invocador `operator.write` envíe comandos tipados de disposición y navegación a clientes conectados de la interfaz de control que anuncien la capacidad `ui-commands`.
    - Los comandos abarcan la división, el cierre y el enfoque de paneles; la visibilidad de la barra lateral; la visibilidad y el acoplamiento de los paneles de terminal y navegador; y la navegación entre sesiones.
    - El protocolo v1 distribuye intencionadamente los comandos a todas las interfaces de control conectadas y compatibles. Si no hay ninguna conectada, la solicitud falla con `UNAVAILABLE` en lugar de simular que la disposición ha cambiado.

  </Accordion>

  <Accordion title="Automatización, Skills y herramientas">
    - Automatización: `wake` programa una inyección inmediata o en el siguiente Heartbeat de texto de activación; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run` y `cron.runs` gestionan el trabajo programado.
    - `cron.run` sigue siendo una RPC de tipo puesta en cola para ejecuciones manuales. Los clientes que necesiten semántica de finalización deben leer el `runId` devuelto y consultar periódicamente `cron.runs`.
    - `cron.runs` acepta un filtro `runId` opcional y no vacío para que los clientes puedan seguir una ejecución manual en cola sin condiciones de carrera con otras entradas del historial del mismo trabajo.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Consulte [Métodos auxiliares del operador](#operator-helper-methods) más adelante.

  </Accordion>
</AccordionGroup>

### Familias de eventos comunes

- `chat`: actualizaciones del chat de la interfaz, como `chat.inject` y otros eventos
  de chat exclusivos de la transcripción. En el protocolo v4, las cargas útiles delta incluyen `deltaText`; `message` sigue siendo
  la instantánea acumulativa del asistente. Las sustituciones que no son prefijos establecen
  `replace=true` y utilizan `deltaText` como texto de sustitución.
- `session.message`, `session.operation`, `session.tool`: actualizaciones de la transcripción, de la operación
  de sesión en curso y del flujo de eventos de una sesión suscrita.
- `session.approval`: estado real saneado de las aprobaciones pendientes y terminales para un
  suscriptor de sesión exacta que haya dado su consentimiento explícito. Las aprobaciones secundarias usan la
  audiencia ancestral persistida; los eventos nunca modifican las transcripciones ni activan agentes.
- `sessions.changed`: el índice o los metadatos de la sesión han cambiado.
- `presence`: actualizaciones de la instantánea de presencia del sistema.
- `tick`: evento periódico de mantenimiento de conexión/actividad.
- `health`: actualización de la instantánea de estado del Gateway.
- `heartbeat`: actualización del flujo de eventos de Heartbeat.
- `cron`: evento de cambio de ejecución/trabajo de Cron.
- `shutdown`: notificación de apagado del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida del emparejamiento de nodos.
- `node.invoke.request`: difusión de una solicitud de invocación de nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de los dispositivos emparejados.
- `voicewake.changed`: ha cambiado la configuración del activador por palabra de activación.
- `config.changed`: se ha persistido una escritura de configuración (la carga útil incluye la ruta de configuración,
  el nuevo hash de la instantánea y una marca de tiempo, pero nunca el contenido de la configuración). Limitado
  a lectura por operadores; los clientes actualizan mediante `config.get`.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de la aprobación
  de ejecución.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de la aprobación
  de plugins.

### Métodos auxiliares de nodos

Los nodos pueden llamar a `skills.bins` para obtener la lista actual de ejecutables de Skills
para las comprobaciones de autorización automática.

## RPC del libro mayor de auditoría

`audit.activity.list` proporciona a los clientes operadores una vista estable, primero con los más recientes, de los metadatos
del ciclo de vida de las ejecuciones de agentes, las acciones de herramientas y los mensajes con consentimiento explícito. Requiere
`operator.read`. Las consultas excluyen los registros de más de 30 días, y el libro mayor
SQLite compartido está limitado a 100,000 registros. Las filas vencidas se eliminan durante
el inicio del Gateway, el mantenimiento cada hora y las escrituras posteriores. Consulte
[Historial de auditoría](/es/gateway/audit) para conocer el modelo de datos y la semántica de privacidad.

- Parámetros: `agentId`, `sessionKey` o `runId` exactos opcionales; `kind` opcional
  (`"agent_run"`, `"tool_action"` o `"message"`); `status` opcional
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` o `"unknown"`); `direction` de mensaje opcional (`"inbound"` o
  `"outbound"`) y `channel` exacto; límites inclusivos opcionales `after` / `before`
  en milisegundos Unix; `limit` opcional de `1` a `500`; y una cadena
  `cursor` opcional de la página anterior.
- Resultado: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

La unión de resultados V1 con nombre tiene esquemas independientes para ejecuciones de agentes, acciones de herramientas, mensajes entrantes
y mensajes salientes. El discriminador `eventType` es, respectivamente,
`agent_run`, `tool_action`, `inbound_message` o `outbound_message`; `kind` y el
`direction` de mensaje siguen disponibles para el filtrado y la visualización. Cada evento tiene un
`schemaVersion: 1` entero. Las referencias de identidad de mensajes usan el formato
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>` exacto; un identificador de actor remitente del canal
usa el mismo formato.

Todas las variantes requieren `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` y
`redaction`. Los campos de las variantes son:

| `eventType`        | Campos obligatorios                                                | Campos opcionales                                                                                                                |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, referencias de identidad, `reasonCode`, `errorCode`                                 |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, referencias de identidad, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Las enumeraciones cerradas de mensajes son:

- `conversationKind`: `direct`, `group`, `channel` o `unknown`.
- `outcome` entrante: `completed`, `skipped` o `failed`; `reasonCode` opcional:
  `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty` o `acp_dispatch_aborted`.
- `outcome` saliente: `sent`, `suppressed`, `failed` o `unknown`; `reasonCode` opcional:
  `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`
  o `no_visible_payload`. Un adaptador que no devuelve ninguna identidad de plataforma es
  `unknown`, porque el efecto secundario externo no puede descartarse.
- `deliveryKind`: `text`, `media` o `other`; `failureStage`:
  `platform_send`, `queue` o `unknown`.

Los campos terminales están correlacionados, no son opcionales de forma independiente:

| Variante          | Correspondencia de terminal                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ejecución del agente        | `started` no tiene `errorCode`; cada estado finalizado que no sea satisfactorio requiere su código `run_*` correspondiente.                                                                 |
| Acción de herramienta      | `started` y satisfactorio no tienen `errorCode`; cada otro estado finalizado requiere su código `tool_*` correspondiente.                                                       |
| Mensaje entrante  | satisfactorio = `completed`; bloqueado = `skipped`; fallido = `failed` más `message_processing_failed`. `reasonCode`, cuando está presente, debe pertenecer a esa familia de terminales. |
| Mensaje saliente | satisfactorio = `sent`; bloqueado = `suppressed` más `reasonCode`; fallido = `failed` más `errorCode` y `failureStage`; desconocido = `unknown` más `failureStage`.      |

Cada evento de actividad incluye un identificador de evento estable, una secuencia monotónica del registro,
una secuencia del evento de origen, una marca de tiempo, el actor, la acción, el estado, el entero
`schemaVersion: 1` y `redaction: "metadata_only"`. Los registros de ejecución y de herramientas
requieren la procedencia del agente y de la ejecución, y pueden incluir la procedencia de la sesión. Los registros de
mensajes pueden incluir identificadores del agente y de la ejecución, pero intencionadamente nunca incluyen
`sessionKey` ni `sessionId`; por lo tanto, el filtro de consulta `sessionKey` solo se aplica a
las filas de ejecución y de herramientas. Los eventos de herramientas pueden incluir el identificador de llamada a la herramienta y el nombre de la herramienta.

Los registros de mensajes usan `message.inbound.processed` o
`message.outbound.finished` y añaden la dirección, el canal, el tipo de conversación,
el resultado normalizado y, opcionalmente, el tipo de entrega, la etapa del fallo, la duración,
el recuento de resultados, el código de motivo y seudónimos con clave locales de la instalación
para la cuenta, la conversación, el mensaje y el destino. Estos seudónimos facilitan
la correlación, pero no constituyen anonimización: la base de datos de estado contiene su clave,
mientras que las exportaciones de RPC y CLI no. El registro no almacena prompts, cuerpos de
mensajes, argumentos de herramientas, resultados de herramientas, salida de comandos ni texto de error sin procesar.
Los valores `sessionKey` de ejecución/herramienta siguen siendo metadatos de correlación sin procesar y pueden contener
identificadores de cuentas o pares de la plataforma; los registros de mensajes omiten las claves de sesión.

Para las filas entrantes, `durationMs` mide el despacho del núcleo hasta su terminal y
`resultCount` cuenta las cargas útiles finalizadas en cola de herramientas, bloqueos y respuestas. Para
las filas salientes, `durationMs` abarca la responsabilidad de la entrega hasta la confirmación,
la cola de mensajes fallidos o la reconciliación (incluido el tiempo de espera en cola), y `resultCount`
cuenta los envíos físicos identificados a la plataforma. `deliveryKind`, cuando está presente,
describe la carga útil efectiva después de los hooks y la renderización; las filas suprimidas o
ambiguas debido a un fallo omiten este valor.

La cobertura actual de mensajes incluye los mensajes entrantes aceptados que llegan al
despacho del núcleo, incluidos los resultados duplicados/terminales del núcleo. La cobertura saliente escribe
una fila terminal por cada carga útil de respuesta lógica original que alcanza la entrega duradera
compartida; la fragmentación y la distribución en abanico del adaptador se agregan en `resultCount`. Los envíos
en cola que pueden reintentarse o que son ambiguos solo se registran después de la confirmación, la cola
de mensajes fallidos o la reconciliación. Las rutas locales del Plugin y de envío directo que eluden esos
límites compartidos aún no están cubiertas. La cola limitada de trabajadores funciona con el mejor esfuerzo
y puede descartar registros en caso de fallo o saturación, por lo que esta superficie no es un
archivo de cumplimiento sin pérdidas.

El registro está activado de forma predeterminada y se controla mediante
[`audit.enabled`](/es/gateway/configuration-reference#audit). El registro de mensajes se
controla por separado mediante `audit.messages` y su valor predeterminado es `"off"`. Cuando
el registro está desactivado, `audit.activity.list` continúa sirviendo los registros escritos
anteriormente hasta que caducan.

Los esquemas distribuidos de solicitud, resultado y `AuditEvent` de `audit.list`
permanecen sin cambios y devuelven únicamente registros de ejecuciones de agentes y acciones de herramientas. Los nuevos clientes
de operador deben llamar a `audit.activity.list` cuando el Gateway lo anuncie. Los Gateways más
antiguos pueden devolver `unknown method: audit.activity.list` o, debido a que
la autorización precedía a la búsqueda del método en las versiones distribuidas, `missing scope:
operator.admin` ante una solicitud con ámbito de lectura. Este último debe tratarse como ausencia del método
solo cuando el método no se haya anunciado. Un cliente puede volver a intentar `audit.list`
solo cuando sus filtros no requieran compatibilidad con el tipo, la dirección o el canal del mensaje.

Use [`openclaw audit`](/es/cli/audit) para consultas de texto y exportaciones JSON limitadas.

## RPC del registro de tareas

Los clientes de operador inspeccionan y cancelan los registros de tareas en segundo plano del Gateway mediante
los RPC del registro de tareas (`packages/gateway-protocol/src/schema/tasks.ts`). Estos
devuelven resúmenes de tareas depurados, no el estado del entorno de ejecución sin procesar.

- `tasks.list` requiere `operator.read`.
  - Parámetros: `status` opcional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` o `"timed_out"`) o una matriz de esos estados,
    `agentId` opcional, `sessionKey` opcional, `limit` opcional de `1` a
    `500` y la cadena opcional `cursor`.
  - Resultado: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` requiere `operator.read`.
  - Parámetros: `{ "taskId": string }`.
  - Resultado: `{ "task": TaskSummary }`.
  - Los identificadores de tareas inexistentes devuelven la estructura de error de elemento no encontrado del Gateway.
- `tasks.cancel` requiere `operator.write`.
  - Parámetros: `{ "taskId": string, "reason"?: string }`.
  - Resultado: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` indica si el registro tenía una tarea coincidente. `cancelled`
    indica si el entorno de ejecución aceptó o registró la cancelación.

`TaskSummary` incluye `id`, `status` y metadatos opcionales: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, marcas de tiempo, progreso,
resumen terminal y texto de error depurado. `agentId` identifica al agente
que ejecuta la tarea; `sessionKey` y `ownerKey` conservan el contexto del solicitante y de control.

## Métodos auxiliares del operador

- `commands.list` (`operator.read`) obtiene el inventario de comandos en tiempo de ejecución de
  un agente.
  - `agentId` es opcional; omítalo para leer el espacio de trabajo predeterminado del agente.
  - `scope` controla a qué superficie se dirige el `name` principal: `text` devuelve
    el token principal del comando de texto sin el `/` inicial; `native` y la
    ruta predeterminada `both` devuelven nombres nativos adaptados al proveedor cuando están disponibles.
  - `textAliases` contiene alias exactos con barra, como `/model` y `/m`.
  - `nativeName` contiene el nombre del comando nativo adaptado al proveedor cuando
    existe.
  - `provider` es opcional y solo afecta a la denominación nativa y a la disponibilidad
    de comandos nativos de plugins.
  - `includeArgs=false` omite de la respuesta los metadatos serializados de los argumentos.
- `tools.catalog` (`operator.read`) obtiene el catálogo de herramientas en tiempo de ejecución de un
  agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: plugin propietario cuando `source="plugin"`
  - `optional`: indica si una herramienta de plugin es opcional
- `tools.effective` (`operator.read`) obtiene el inventario efectivo de herramientas en
  tiempo de ejecución para una sesión.
  - `sessionKey` es obligatorio.
  - El Gateway deriva el contexto de ejecución de confianza a partir de la sesión en el servidor,
    en lugar de aceptar del llamador un contexto de autenticación o entrega.
  - La respuesta es una proyección derivada por el servidor y limitada a la sesión del
    inventario activo, que incluye las herramientas principales, de plugins, de canales y de
    servidores MCP ya descubiertos.
  - `tools.effective` es de solo lectura para MCP: puede proyectar el catálogo MCP de una
    sesión activa mediante la política final de herramientas, pero no crea entornos de ejecución MCP,
    conecta transportes ni emite `tools/list`. Si no existe un catálogo activo
    coincidente, la respuesta puede incluir un aviso como `mcp-not-yet-connected`,
    `mcp-not-yet-listed` o `mcp-stale-catalog`.
  - Las entradas de herramientas efectivas usan `source="core"`, `source="plugin"`,
    `source="channel"` o `source="mcp"`.
- `tools.invoke` (`operator.write`) invoca una herramienta disponible mediante la
  misma ruta de políticas del Gateway que `/tools/invoke`.
  - `name` es obligatorio. `args`, `sessionKey`, `agentId`, `confirm` y
    `idempotencyKey` son opcionales.
  - Si están presentes tanto `sessionKey` como `agentId`, el agente de sesión resuelto
    debe coincidir con `agentId`.
  - Los envoltorios principales exclusivos del propietario, como `cron`, `gateway` y `nodes`, requieren
    una identidad de propietario/administrador (`operator.admin`), aunque el propio `tools.invoke`
    sea `operator.write`.
  - La respuesta es un sobre orientado al SDK con `ok`, `toolName`, el campo opcional
    `output` y campos `error` tipados. Los rechazos por aprobación o política devuelven
    `ok:false` en la carga útil, en lugar de eludir el pipeline de políticas de herramientas
    del Gateway.
- `skills.status` (`operator.read`) obtiene el inventario visible de Skills de un
  agente.
  - `agentId` es opcional; omítalo para leer el espacio de trabajo predeterminado del agente.
  - La respuesta incluye la elegibilidad, los requisitos que faltan, las comprobaciones de configuración
    y opciones de instalación depuradas sin exponer valores de secretos sin procesar.
- `skills.search` y `skills.detail` (`operator.read`) devuelven metadatos
  de descubrimiento de ClawHub.
- `skills.upload.begin`, `skills.upload.chunk` y `skills.upload.commit`
  (`operator.admin`) preparan un archivo privado de una Skill antes de instalarlo. Esta
  es una ruta de carga administrativa independiente para clientes de confianza, no el flujo normal
  de instalación de Skills de ClawHub, y está deshabilitada de forma predeterminada salvo que
  `skills.install.allowUploadedArchives` esté habilitado.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    crea una carga vinculada a ese slug y valor de forzado.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` añade bytes en
    el desplazamiento decodificado exacto.
  - `skills.upload.commit({ uploadId, sha256? })` verifica el tamaño final y
    SHA-256. La confirmación solo finaliza la carga; no instala la Skill.
  - Los archivos de Skills cargados son archivos zip que contienen una raíz `SKILL.md`. El
    nombre del directorio interno del archivo nunca selecciona el destino de instalación.
- `skills.install` (`operator.admin`) tiene tres modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una
    carpeta de Skill en el directorio `skills/` del espacio de trabajo predeterminado del agente.
  - Modo de carga: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instala una carga confirmada en el directorio `skills/<slug>` del espacio de trabajo
    predeterminado del agente. El slug y el valor de forzado deben coincidir con la solicitud
    `skills.upload.begin` original. Se rechaza salvo que
    `skills.install.allowUploadedArchives` esté habilitado; el ajuste no
    afecta a las instalaciones de ClawHub.
  - Modo de instalador del Gateway: `{ name, installId, timeoutMs? }` ejecuta una acción
    `metadata.openclaw.install` declarada en el host del Gateway. Los clientes antiguos aún pueden
    enviar `dangerouslyForceUnsafeInstall`; este campo está obsoleto,
    solo se acepta por compatibilidad con el protocolo y se ignora. Use
    `security.installPolicy` para las decisiones de instalación bajo responsabilidad del operador.
- `skills.update` (`operator.admin`) tiene dos modos:
  - El modo ClawHub actualiza un slug registrado o todas las instalaciones registradas de ClawHub en
    el espacio de trabajo predeterminado del agente.
  - El modo de configuración modifica valores de `skills.entries.<skillKey>`, como `enabled`,
    `apiKey` y `env`.

### Vistas de `models.list`

`models.list` acepta un parámetro opcional `view`
(`src/agents/model-catalog-visibility.ts`):

- Omitido o `"default"`: si `agents.defaults.modelPolicy.allow` está configurado, la
  respuesta es el catálogo permitido, incluidos los modelos descubiertos dinámicamente
  para las entradas `provider/*`. De lo contrario, la respuesta es el catálogo completo
  del Gateway.
- `"configured"`: comportamiento con dimensiones para el selector. Si `agents.defaults.modelPolicy.allow` está
  configurado, sigue teniendo prioridad, incluido el descubrimiento limitado al proveedor para
  las entradas `provider/*`. Sin una lista de permitidos, la respuesta usa entradas
  `models.providers.<provider>.models` explícitas y recurre al catálogo completo
  solo cuando no existen filas de modelos configuradas.
- `"provider-config"`: inventario `models.providers.*.models` definido en el origen,
  independiente de las listas de permitidos del selector. Las filas incluyen capacidades públicas del modelo y
  disponibilidad adaptada a la ruta, pero omiten extremos del proveedor, material de autenticación y
  configuración de solicitudes en tiempo de ejecución.
- `"all"`: catálogo completo del Gateway, omitiendo `agents.defaults.modelPolicy.allow`. Úselo para
  interfaces de diagnóstico/descubrimiento, no para selectores de modelos normales.

## Aprobaciones de ejecución

- Cuando una solicitud de ejecución necesita aprobación, el Gateway difunde
  `exec.approval.requested`.
- Los clientes del operador la resuelven llamando a `exec.approval.resolve` (requiere
  `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan`
  (metadatos canónicos de `argv`/`cwd`/`rawCommand`/sesión). Las solicitudes sin
  `systemRunPlan` se rechazan.
- Tras la aprobación, las llamadas `node.invoke system.run` reenviadas reutilizan ese
  `systemRunPlan` canónico como contexto autoritativo de comando/directorio de trabajo/sesión.
- Si un llamador modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` entre la preparación y el reenvío final aprobado de `system.run`,
  el Gateway rechaza la ejecución en lugar de confiar en la carga útil modificada.

## Alternativa de entrega del agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar una entrega saliente.
- `bestEffortDeliver=false` (el valor predeterminado) mantiene un comportamiento estricto: los destinos de
  entrega no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite recurrir a una ejecución limitada a la sesión cuando no
  se puede resolver ninguna ruta de entrega externa (por ejemplo, sesiones internas/de chat web
  o configuraciones ambiguas con varios canales).
- Los resultados finales de `agent` pueden incluir `result.deliveryStatus` cuando se solicitó la
  entrega, con los mismos estados `sent`, `suppressed`, `partial_failed` y
  `failed` documentados para
  [`openclaw agent --json --deliver`](/es/cli/agent#json-delivery-status).

## Control de versiones

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` y `MIN_PROBE_PROTOCOL_VERSION` se encuentran en
  `packages/gateway-protocol/src/version.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`. Los clientes del operador y de la interfaz deben
  incluir el protocolo actual en ese intervalo; los clientes y servidores actuales ejecutan
  el protocolo v4.
- Los clientes autenticados con `role: "node"` y `client.mode: "node"`
  pueden usar el protocolo de Node N-1 (actualmente v3). Las sondas ligeras de reinicio usan
  la misma ventana N-1. La autenticación de dispositivos, el emparejamiento, los ámbitos, la política de comandos y las
  aprobaciones de ejecución no cambian debido a esta ventana de compatibilidad. Las capacidades y los comandos de Node
  bajo responsabilidad de plugins no se proporcionan hasta que el Node se actualiza al protocolo
  actual, porque sus superficies alojadas no forman parte del contrato N-1.
- Los esquemas y modelos se generan a partir de definiciones de TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes del cliente

La implementación de referencia del cliente se encuentra en `packages/gateway-client/src/`
(OpenClaw la envuelve mediante la delgada fachada `src/gateway/client.ts`). Estos
valores predeterminados son estables en el protocolo v4 y constituyen la referencia esperada para
clientes de terceros.

| Constante                                  | Valor predeterminado                                               | Fuente                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Tiempo de espera de la solicitud (por RPC)                 | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Tiempo de espera de preautenticación/desafío de conexión       | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (la variable de entorno `OPENCLAW_HANDSHAKE_TIMEOUT_MS` puede aumentar el límite conjunto del servidor y el cliente) |
| Retardo inicial de reconexión                 | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Retardo máximo de reconexión                     | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Límite de reintento rápido tras el cierre por token de dispositivo | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Período de gracia para la detención forzada antes de `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Tiempo de espera predeterminado de `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Intervalo de ciclo predeterminado (antes de `hello-ok`)    | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Cierre por tiempo de espera del ciclo                        | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

El servidor anuncia los valores efectivos de `policy.tickIntervalMs`,
`policy.maxPayload` y `policy.maxBufferedBytes` en `hello-ok`; los clientes
deben respetar esos valores en lugar de los predeterminados anteriores al protocolo de enlace.

El cliente de referencia permite que las solicitudes finitas controlen su plazo configurado cuando
cada solicitud pendiente tiene uno. Una solicitud `expectFinal` sin un
`timeoutMs` finito, cualquier solicitud con `timeoutMs: null` o una combinación de solicitudes
finitas y sin límite mantiene activo el monitor del ciclo. Si los eventos entrantes y las
respuestas permanecen en silencio más allá del umbral de tiempo de espera del ciclo, el cliente cierra el
socket con el código `4000`, rechaza todas las solicitudes pendientes y vuelve a conectarse. No
reproduce las solicitudes rechazadas después de volver a conectarse.

## Autenticación

- La autenticación del Gateway mediante secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el
  `gateway.auth.mode` configurado (`"none" | "token" | "password" | "trusted-proxy"`).
- Los modos que contienen identidad, como Tailscale Serve (`gateway.auth.allowTailscale: true`)
  o `gateway.auth.mode: "trusted-proxy"` fuera de la interfaz de bucle invertido, satisfacen la comprobación de
  autenticación de la conexión mediante los encabezados de la solicitud en lugar de `connect.params.auth.*`.
- El `gateway.auth.mode: "none"` de entrada privada omite por completo la autenticación de conexión
  mediante secreto compartido; no exponga ese modo en una entrada pública o no confiable.
- Después del emparejamiento, el Gateway emite un token de dispositivo limitado al rol y los
  ámbitos de la conexión, que se devuelve en `hello-ok.auth.deviceToken`. Los clientes deben
  conservarlo después de cualquier conexión correcta.
- Al volver a conectarse con ese token de dispositivo almacenado, también se debe reutilizar el conjunto de
  ámbitos aprobados almacenado para dicho token. Esto conserva el acceso de lectura, sondeo y estado
  ya concedido y evita que las reconexiones se reduzcan silenciosamente a un ámbito
  implícito más limitado y exclusivo para administradores.
- Composición de la autenticación de conexión en el cliente (`selectConnectAuth` en
  `packages/gateway-client/src/client.ts`):
  - `auth.password` es independiente y siempre se reenvía cuando está definido.
  - `auth.token` se rellena en este orden de prioridad: primero el token compartido explícito,
    luego un `deviceToken` explícito y, por último, un token almacenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` se envía solo cuando ninguna de las opciones anteriores resolvió
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La promoción automática de un token de dispositivo almacenado durante el reintento único
    `AUTH_TOKEN_MISMATCH` se limita exclusivamente a endpoints confiables: bucle invertido
    o `wss://` con un `tlsFingerprint` fijado. Un `wss://` público sin fijación
    no cumple los requisitos.
- El arranque integrado mediante código de configuración devuelve el
  `hello-ok.auth.deviceToken` del Node principal y un token de operador limitado en
  `hello-ok.auth.deviceTokens` para una transferencia móvil confiable. El token de operador
  incluye `operator.talk.secrets` para las lecturas de configuración nativas de Talk, pero
  excluye los ámbitos de modificación del emparejamiento y `operator.admin`.
- Mientras un arranque mediante código de configuración que no sea de referencia espera la aprobación,
  los detalles de `PAIRING_REQUIRED` incluyen `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` y `pauseReconnect: false`. Siga volviendo a conectarse con el
  mismo token de arranque hasta que se apruebe la solicitud o el token deje de ser
  válido.
- Conserve `hello-ok.auth.deviceTokens` solo cuando la conexión haya usado la autenticación de
  arranque en un transporte confiable, como `wss://` o un emparejamiento local o mediante bucle invertido.
- Si un cliente proporciona un `deviceToken` explícito o un `scopes` explícito, ese
  conjunto de ámbitos solicitado por el invocador sigue siendo autoritativo; los ámbitos almacenados en caché solo
  se reutilizan cuando el cliente reutiliza el token almacenado por dispositivo.
- Los tokens de dispositivo pueden rotarse o revocarse mediante `device.token.rotate` y
  `device.token.revoke` (requiere `operator.pairing`). Rotar o revocar el token de un
  Node u otro rol que no sea de operador también requiere `operator.admin`.
- `device.token.rotate` devuelve metadatos de rotación. Solo devuelve el token de portador
  sustituto en llamadas del mismo dispositivo que ya estén autenticadas con ese
  token de dispositivo, de modo que los clientes que solo usan tokens puedan conservar el sustituto antes de
  volver a conectarse. Las rotaciones compartidas o de administrador no devuelven el token de portador.
- La emisión, rotación y revocación de tokens permanecen limitadas al conjunto de roles
  aprobados registrado en la entrada de emparejamiento de ese dispositivo; la modificación de tokens no puede ampliar ni
  dirigirse a un rol de dispositivo que nunca haya sido concedido mediante la aprobación del emparejamiento.
- En las sesiones de tokens de dispositivos emparejados, la administración de dispositivos queda limitada al propio dispositivo, salvo que
  el invocador también tenga `operator.admin`: los invocadores que no sean administradores solo pueden administrar el
  token de operador de su propia entrada de dispositivo. La administración de tokens de Node y de otros roles
  que no sean de operador es exclusiva para administradores, incluso para el propio dispositivo del invocador.
- `device.token.rotate` y `device.token.revoke` también comprueban el conjunto de ámbitos del
  token de operador de destino con respecto a los ámbitos de la sesión actual del invocador.
  Los invocadores que no sean administradores no pueden rotar ni revocar un token de operador con más ámbitos que los
  que ya poseen.
- Los fallos de autenticación incluyen `error.details.code` y sugerencias de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep`: uno de `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes confiables pueden intentar un único reintento limitado con un token almacenado
    por dispositivo.
  - Si ese reintento falla, detenga los ciclos de reconexión automática y muestre indicaciones
    sobre la acción que debe realizar el operador.
- `AUTH_SCOPE_MISMATCH` significa que se reconoció el token de dispositivo, pero no
  abarca el rol o los ámbitos solicitados. No lo presente como un token incorrecto; indique
  al operador que vuelva a emparejar el dispositivo o apruebe el contrato de ámbitos más limitado o más amplio.

## Identidad y emparejamiento de dispositivos

- Los Nodes deben incluir una identidad estable del dispositivo (`device.id`) derivada de la
  huella digital de un par de claves.
- Los Gateways emiten tokens por dispositivo y rol.
- Se requieren aprobaciones de emparejamiento para los nuevos identificadores de dispositivo, salvo que esté habilitada la
  aprobación automática local.
- La aprobación automática del emparejamiento se centra en las conexiones locales directas mediante bucle invertido.
- OpenClaw también dispone de una ruta limitada de autoconexión local al backend o contenedor para
  flujos de asistentes confiables mediante secreto compartido.
- Las conexiones desde el mismo host mediante tailnet o LAN siguen tratándose como remotas para el emparejamiento
  y requieren aprobación.
- Los clientes WS suelen incluir la identidad `device` durante `connect` (operador +
  Node). Las únicas excepciones para operadores sin dispositivo son rutas de confianza explícitas:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad HTTP no segura
    exclusiva de localhost.
  - autenticación correcta del operador en la interfaz de control mediante `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (último recurso, grave
    degradación de la seguridad).
  - RPC de backend `gateway-client` mediante bucle invertido directo en la ruta interna
    reservada para asistentes.
- Omitir la identidad del dispositivo tiene consecuencias para los ámbitos. Cuando se permite una conexión de
  operador sin dispositivo mediante una ruta de confianza explícita, OpenClaw
  sigue borrando los ámbitos autodeclarados y los deja como un conjunto vacío, salvo que dicha ruta tenga una
  excepción explícita de conservación de ámbitos. Los métodos sujetos a ámbitos fallan entonces con
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` es una ruta de conservación de
  ámbitos de último recurso para la interfaz de control. No concede ámbitos a clientes WebSocket
  arbitrarios con forma de backend personalizado o CLI.
- La ruta reservada del asistente de backend `gateway-client` mediante bucle invertido directo conserva
  los ámbitos solo para RPC internos del plano de control local; los identificadores de backend personalizados no
  reciben esta excepción.
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de la autenticación de dispositivos

Para los clientes heredados que todavía usan el comportamiento de firma anterior al desafío, `connect`
devuelve códigos de detalle `DEVICE_AUTH_*` en `error.details.code` con un
`error.details.reason` estable.

Fallos de migración frecuentes:

| Mensaje                     | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió vacío).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto/incorrecto.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga útil de la firma no coincide con la carga útil v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella digital de la clave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Se produjo un error en el formato o la canonicalización de la clave pública.         |

Objetivo de migración:

- Esperar siempre a `connect.challenge`.
- Firmar la carga útil v2 que incluye el nonce del servidor.
- Enviar el mismo nonce en `connect.params.device.nonce`.
- La carga útil de firma preferida es `v3`
  (`buildDeviceAuthPayloadV3` en `packages/gateway-client/src/device-auth.ts`),
  que vincula `platform` y `deviceFamily`, además de los campos
  de dispositivo/cliente/rol/ámbitos/token/nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero la fijación
  de metadatos del dispositivo emparejado continúa controlando la política de comandos al volver a conectarse.

## TLS y fijación

- TLS es compatible con las conexiones WS (configuración `gateway.tls`).
- Los clientes pueden fijar opcionalmente la huella digital del certificado del Gateway mediante
  `gateway.remote.tlsFingerprint` o la opción de CLI `--tls-fingerprint`.

## Alcance

Este protocolo expone la API completa del Gateway: estado, canales, modelos, chat,
agente, sesiones, nodos, aprobaciones y más. La superficie exacta se define mediante
los esquemas de TypeBox reexportados desde `packages/gateway-protocol/src/schema.ts`.

## Contenido relacionado

- [Protocolo de puente](/es/gateway/bridge-protocol)
- [Guía operativa del Gateway](/es/gateway)
