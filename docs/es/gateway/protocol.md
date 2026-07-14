---
read_when:
    - Implementación o actualización de clientes WS del Gateway
    - Depuración de incompatibilidades de protocolo o fallos de conexión
    - Regeneración del esquema y los modelos del protocolo
summary: 'Protocolo WebSocket del Gateway: negociación, tramas y control de versiones'
title: Protocolo del Gateway
x-i18n:
    generated_at: "2026-07-14T13:40:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 90e759ed822c71b1d64da8413569355baf0cd010b0ab623b96a7e9406b8871b5
    source_path: gateway/protocol.md
    workflow: 16
---

El protocolo WS del Gateway es el único plano de control y transporte de nodos de
OpenClaw. Los clientes de operador y de nodo (CLI, interfaz web, aplicación para macOS, nodos iOS/Android,
nodos sin interfaz gráfica) se conectan mediante WebSocket y declaran un **rol** y un **ámbito** durante
el protocolo de enlace.

## Transporte y entramado

- WebSocket, tramas de texto, cargas útiles JSON.
- La primera trama **debe** ser una solicitud `connect`.
- Las tramas previas a la conexión tienen un límite de 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Tras
  el protocolo de enlace, se siguen `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con los diagnósticos habilitados, las tramas
  entrantes que superan el tamaño permitido y los búferes de salida lentos emiten eventos `payload.large` antes de que
  el Gateway cierre o descarte la trama. Estos eventos incluyen `surface`, tamaños
  en bytes, límites y un código de motivo seguro; nunca incluyen cuerpos de mensajes, contenido
  de archivos adjuntos, bytes sin procesar de las tramas, tokens, cookies ni secretos.

Formas de las tramas:

- Solicitud: `{type:"req", id, method, params}`
- Respuesta: `{type:"res", id, ok, payload|error}`
- Evento: `{type:"event", event, payload, seq?, stateVersion?}`

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
anterior). `pluginSurfaceUrls` es opcional y asigna nombres de superficies de plugins (por ejemplo,
`canvas`) a URL alojadas con ámbito; puede caducar, por lo que los nodos llaman a
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` para obtener una entrada nueva.
La ruta obsoleta `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
no es compatible; utilice superficies de plugins.

Mientras el Gateway aún termina de iniciar los procesos auxiliares, `connect` puede devolver un
error reintentable `UNAVAILABLE` con `details.reason: "startup-sidecars"` y
`retryAfterMs`. Vuelva a intentarlo dentro del presupuesto de conexión en lugar de tratarlo como
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

El arranque integrado mediante QR/código de configuración es una ruta de transferencia móvil. Una conexión
correcta con un código de configuración de referencia devuelve un token de nodo principal y un token
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

Esta transferencia de operador está limitada deliberadamente: es suficiente para iniciar el bucle
del operador móvil y la configuración nativa, incluido `operator.talk.secrets` para las lecturas
de configuración de Talk, pero sin ámbitos para modificar emparejamientos ni `operator.admin`. Un acceso
más amplio de emparejamiento o administración requiere un flujo independiente de emparejamiento aprobado o de tokens. Conserve
`hello-ok.auth.deviceTokens` únicamente cuando la autenticación de arranque se haya ejecutado mediante un transporte
de confianza (`wss://` o emparejamiento local/de bucle invertido).

Los clientes de backend de confianza que se ejecutan en el mismo proceso (`client.id: "gateway-client"`,
`client.mode: "backend"`) pueden omitir `device` en conexiones directas de bucle invertido cuando
se autentican con el token o la contraseña compartidos del Gateway. Esta ruta está reservada
para RPC internos del plano de control (por ejemplo, actualizaciones de sesiones de subagentes) y evita que
las referencias obsoletas de emparejamiento de la CLI o del dispositivo bloqueen el trabajo local del backend. Los clientes remotos,
con origen en el navegador, de nodo y con token o identidad de dispositivo explícitos siguen
las comprobaciones normales de emparejamiento y ampliación de ámbitos.

### Rol de trabajador y protocolo cerrado

Los trabajadores en la nube utilizan una entrada de bucle invertido dedicada mediante el túnel SSH propiedad del Gateway
y anclado a la clave del host. Solo acepta la identidad del trabajador y nunca distribuye
autenticación general, eventos de nodo, RPC de operador ni métodos de plugins. Un `connect` estricto
verifica una credencial de corta duración, almacenada como hash y vinculada al entorno, al hash
del paquete, a la época del propietario, a la versión del conjunto de RPC, a la caducidad y a una sesión anulable; además,
comprueba por separado la versión y el conjunto de características actuales. Si se realiza correctamente, devuelve un
`worker-hello-ok` mínimo; la negociación de características es independiente de la versión general
del protocolo. Las tramas se mantienen por debajo de 64 KiB, excepto una trama `worker.inference.start`
negociada, que puede tener hasta 25 MiB. La lista cerrada de elementos permitidos contiene `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start` y
`worker.inference.cancel`.

Las confirmaciones de transcripciones utilizan delimitación por época del propietario, una vinculación de sesión
propiedad del Gateway, comparación e intercambio de la hoja base y repetición duradera de secuencias; el Gateway genera
los identificadores de las entradas y sus elementos principales mediante el escritor de sesiones normal. La propiedad y
la caducidad se vuelven a comprobar en cada RPC.

### Capacidades del cliente

Los clientes de operador pueden anunciar capacidades opcionales en `connect.params.caps`:

- `tool-events`: acepta eventos estructurados del ciclo de vida de las herramientas.
- `inline-widgets`: puede representar resultados de herramientas de widgets integrados alojados.

Las capacidades del cliente describen al cliente conectado, no la autorización. Las herramientas del agente pueden declarar capacidades obligatorias; el Gateway omite esas herramientas salvo que todos los requisitos estén presentes en `caps` del cliente de origen. Las ejecuciones originadas en canales no tienen capacidades de cliente del Gateway, por lo que las herramientas restringidas por capacidades no están disponibles aunque la política de herramientas las permita explícitamente.

### Ejemplo de conexión de un nodo

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

Los nodos declaran afirmaciones de capacidades al conectarse:

- `caps`: categorías de alto nivel como `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: lista de comandos permitidos para la invocación.
- `permissions`: controles granulares (por ejemplo, `screen.record`, `camera.capture`).

El Gateway los trata como afirmaciones y aplica listas de elementos permitidos en el servidor.

## Roles y ámbitos

Para consultar el modelo completo de ámbitos de operador, las comprobaciones durante la aprobación y la semántica
de los secretos compartidos, consulte [Ámbitos de operador](/es/gateway/operator-scopes).

Roles:

- `operator`: cliente del plano de control (CLI/interfaz de usuario/automatización).
- `node`: host de capacidades (cámara/pantalla/lienzo/system.run).
- `worker`: host de ejecución en la nube en el protocolo de trabajador dedicado y cerrado.

Ámbitos de operador (`src/gateway/operator-scopes.ts`), el conjunto cerrado completo:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` requiere `operator.talk.secrets` (o
`operator.admin`). Cuando se incluyen secretos, se lee la credencial activa del proveedor de Talk
desde `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
conserva la forma de origen y puede ser un objeto SecretRef o una cadena censurada.

Los métodos RPC del Gateway registrados por plugins pueden solicitar su propio ámbito de operador,
pero estos prefijos reservados del núcleo siempre se resuelven como `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

El ámbito del método es solo el primer control. Algunos comandos con barra a los que se accede mediante
`chat.send` aplican comprobaciones más estrictas en el nivel del comando: las escrituras persistentes `/config set` y
`/config unset` requieren `operator.admin` incluso para clientes del Gateway que
ya poseen un ámbito de operador inferior.

`node.pair.approve` tiene una comprobación de ámbito adicional durante la aprobación, además del ámbito
base del método (`operator.pairing`), en función de los `commands` declarados
por la solicitud pendiente (`src/infra/node-pairing-authz.ts`):

| Comandos declarados                                                                                                           | Ámbitos obligatorios                    |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| ninguno                                                                                                                       | `operator.pairing`                    |
| comandos ordinarios                                                                                                          | `operator.pairing` + `operator.write` |
| incluye `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` o `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### Capacidades/comandos/permisos (nodo)

Los nodos declaran afirmaciones de capacidades al conectarse:

- `caps`: categorías de capacidades de alto nivel como `camera`, `canvas`, `screen`,
  `location`, `voice` y `talk`.
- `commands`: lista de comandos permitidos para la invocación.
- `permissions`: controles granulares (por ejemplo, `screen.record`, `camera.capture`).

El Gateway los trata como **afirmaciones** y aplica listas de elementos permitidos en el servidor.
Los nodos conectados pueden publicar descriptores opcionales de herramientas de plugins o MCP
visibles para el agente mediante `node.pluginTools.update` tras una conexión o
reconexión correcta. Los hosts de nodos sin interfaz gráfica se reinician para aplicar cambios declarativos
en el inventario de MCP. Este método de actualización es la única ruta de publicación; los descriptores de herramientas de plugins no se aceptan en
los parámetros de `connect`. Cada descriptor debe utilizar un `name` de herramienta seguro para el proveedor y nombrar
un `command` de la lista actual de comandos permitidos del nodo. El Gateway confía en los metadatos
de los descriptores del nodo emparejado, filtra los descriptores ajenos a la superficie de comandos aprobada,
los elimina cuando el nodo se desconecta y rechaza los intentos de los operadores
de modificar el catálogo de otro nodo. Establezca `gateway.nodes.pluginTools.enabled: false`
para ignorar los descriptores publicados por nodos.

Los hosts de Node conectados publican su catálogo completo de reemplazo de Skills mediante
`node.skills.update`. Este método de rol de Node es la única vía de publicación
de Skills de Node; no se aceptan Skills en los parámetros de `connect`. Cada descriptor contiene un
nombre seguro, una descripción y contenido `SKILL.md` acotado. El Gateway analiza ese
contenido con el cargador normal de Skills, lo incluye en las instantáneas de Skills del agente
mientras el Node está conectado y lo elimina cuando se desconecta. Establezca
`gateway.nodes.skills.enabled: false` para ignorar las Skills publicadas por el Node.

## Presencia

- `system-presence` devuelve entradas indexadas por identidad de dispositivo, incluidos
  `deviceId`, `roles` y `scopes`, para que las interfaces de usuario puedan mostrar una fila por dispositivo incluso
  cuando se conecta como operador y como Node.
- `node.list` incluye los valores opcionales `lastSeenAtMs` y `lastSeenReason`. Los Nodes conectados
  informan de la hora de conexión actual con el motivo `connect`; los Nodes emparejados también pueden
  informar de presencia duradera en segundo plano mediante un evento de Node de confianza.

Los Nodes nativos de macOS también pueden enviar eventos `node.presence.activity` autenticados
con un tiempo de inactividad de entrada acotado. El Gateway deriva las marcas de tiempo de actividad según su
propio reloj, expone el Mac conectado más reciente mediante `node.list` y
`node.describe`, y transmite las actualizaciones de `node.presence` a los clientes con ámbito de lectura.
Consulte [Presencia del ordenador activo](/es/nodes/presence) para conocer el comportamiento de selección, privacidad, contexto
del modelo y enrutamiento de notificaciones.

### Evento de actividad en segundo plano del Node

Los Nodes llaman a `node.event` con `event: "node.presence.alive"` para registrar que un
Node emparejado estuvo activo durante una activación en segundo plano, sin marcarlo como conectado:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` es una enumeración cerrada: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Los valores desconocidos se normalizan a
`background` (`src/shared/node-presence.ts`). El evento solo se conserva para
sesiones autenticadas de dispositivos Node; las sesiones sin dispositivo o sin emparejar devuelven
`handled: false`.

Los Gateways que procesan la solicitud correctamente devuelven un resultado estructurado:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Los Gateways antiguos pueden devolver únicamente `{ "ok": true }` para `node.event`; considérelo
una RPC confirmada, no una persistencia duradera de presencia.

## Ámbito de los eventos de transmisión

Los eventos de transmisión enviados por el servidor se restringen por ámbito para que las sesiones
con ámbito de emparejamiento o exclusivas de Node no reciban pasivamente contenido de sesión
(`src/gateway/server-broadcast.ts`):

- Los marcos de chat, agente y resultados de herramientas (eventos `agent` transmitidos, eventos de resultados
  de herramientas) requieren al menos `operator.read`. Las sesiones que no lo tengan omiten estos
  marcos por completo.
- Las transmisiones `plugin.*` definidas por Plugins se restringen de forma predeterminada a `operator.write` o
  `operator.admin`; las entradas explícitas como
  `plugin.approval.requested` / `plugin.approval.resolved` utilizan
  `operator.approvals` en su lugar.
- Los eventos de estado/transporte (`heartbeat`, `presence`, `tick`, ciclo de vida de conexión/desconexión)
  permanecen sin restricciones para que todas las sesiones autenticadas puedan observar
  el estado del transporte.
- Las familias de eventos de transmisión desconocidas se restringen por ámbito de forma predeterminada (cierre seguro)
  salvo que un controlador registrado las flexibilice explícitamente.

Cada conexión de cliente mantiene su propio número de secuencia por cliente, por lo que las transmisiones
conservan un orden monótonamente creciente en ese socket, incluso cuando distintos clientes ven
subconjuntos diferentes del flujo de eventos filtrados por ámbito.

## Familias de métodos RPC

`hello-ok.features.methods` es una lista de detección conservadora creada a partir de
`src/gateway/server-methods-list.ts` junto con las exportaciones de métodos de Plugins/canales
cargados; no es un volcado generado de todos los métodos, y algunos métodos (por
ejemplo, `push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
se excluyen deliberadamente de la detección aunque sean métodos reales que se pueden
invocar. Considérela un mecanismo de detección de funciones, no una enumeración completa de
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidad">
    - `health` devuelve la instantánea de estado del Gateway almacenada en caché o sondeada recientemente.
    - `diagnostics.stability` devuelve el registro reciente y acotado de estabilidad de diagnóstico: nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de colas/sesiones, nombres de canales/Plugins e identificadores de sesión. No incluye texto de chat, cuerpos de Webhooks, resultados de herramientas, cuerpos de solicitudes/respuestas sin procesar, tokens, cookies ni secretos. Requiere `operator.read`.
    - `status` devuelve el resumen del Gateway con formato de `/status`; los campos sensibles solo están disponibles para clientes operadores con ámbito de administración.
    - `gateway.identity.get` devuelve la identidad de dispositivo del Gateway utilizada por los flujos de retransmisión y emparejamiento.
    - `system-presence` devuelve la instantánea de presencia actual de los dispositivos operadores/Nodes conectados.
    - `system-event` añade un evento del sistema y puede actualizar/transmitir el contexto de presencia.
    - `last-heartbeat` devuelve el último evento Heartbeat persistido.
    - `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el Gateway.
    - `gateway.suspend.prepare` crea una concesión breve de suspensión cooperativa solo cuando el trabajo registrado del Gateway está inactivo. `gateway.suspend.status` comprueba esa concesión y `gateway.suspend.resume` la libera después de reanudarse o tras una operación del host cancelada.

  </Accordion>

  <Accordion title="Modelos y uso">
    - `models.list` devuelve el catálogo de modelos permitidos durante la ejecución. Consulte las «vistas de `models.list`» a continuación.
    - `usage.status` devuelve resúmenes de ventanas de uso/cuota restante del proveedor.
    - `usage.cost` devuelve resúmenes agregados del uso de costes para un intervalo de fechas. Pase `agentId` para un agente o `agentScope: "all"` para agregar los agentes configurados.
    - `doctor.memory.status` devuelve el estado de disponibilidad de la memoria vectorial/incrustaciones almacenadas en caché para el espacio de trabajo del agente predeterminado activo. Pase `{ "probe": true }` o `{ "deep": true }` solo para realizar un ping explícito en vivo al proveedor de incrustaciones. Pase `{ "agentId": "agent-id" }` para limitar las estadísticas del almacén de Dreaming a un espacio de trabajo de agente; si se omite, se agregan los espacios de trabajo de Dreaming configurados.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` y `doctor.memory.dedupeDreamDiary` aceptan el valor opcional `{ "agentId": "agent-id" }`; si se omite, operan sobre el espacio de trabajo del agente predeterminado configurado.
    - `doctor.memory.remHarness` devuelve una vista previa acotada y de solo lectura del arnés REM para clientes remotos del plano de control, incluidas las rutas del espacio de trabajo, fragmentos de memoria, Markdown fundamentado renderizado y candidatos a promoción profunda. Requiere `operator.read`.
    - `sessions.usage` devuelve resúmenes de uso por sesión. Pase `agentId` para un agente o `agentScope: "all"` para enumerar conjuntamente los agentes configurados.
      Ambos métodos de uso aceptan `mode: "specific"` con una `timeZone` de IANA para establecer límites y agrupaciones por día natural que tengan en cuenta el horario de verano. `utcOffset` sigue siendo compatible con clientes antiguos y sirve como alternativa cuando el entorno de ejecución del Gateway no reconoce la zona solicitada.
    - `sessions.usage.timeseries` devuelve el uso en series temporales de una sesión.
    - `sessions.usage.logs` devuelve las entradas del registro de uso de una sesión.

  </Accordion>

  <Accordion title="Canales y auxiliares de inicio de sesión">
    - `channels.status` devuelve resúmenes de estado de los canales/Plugins integrados e incluidos.
    - `channels.logout` cierra la sesión de un canal/cuenta específico cuando el canal lo admite.
    - `web.login.start` inicia un flujo de inicio de sesión mediante QR/web para el proveedor actual del canal web compatible con QR.
    - `web.login.wait` espera a que finalice ese flujo e inicia el canal si se completa correctamente.
    - `push.test` envía una notificación push de prueba mediante APNs a un Node iOS registrado.
    - `voicewake.get` devuelve los activadores de palabras de activación almacenados.
    - `voicewake.set` actualiza los activadores de palabras de activación y transmite el cambio.

  </Accordion>

  <Accordion title="Gestión de Plugins">
    - `plugins.list` (`operator.read`) devuelve el inventario de Plugins instalados junto con una selección local de opciones oficiales, diagnósticos y la indicación de si el modo de instalación actual permite modificaciones.
    - `plugins.search` (`operator.read`) busca familias instalables de Plugins de código y Plugins de paquetes de ClawHub. Pase un valor `query` no vacío y un valor `limit` opcional de 1 a 100.
    - `plugins.install` (`operator.admin`) instala una entrada del catálogo oficial mediante `{ source: "official", pluginId }` o un paquete de ClawHub mediante `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. Las instalaciones de ClawHub conservan las comprobaciones de confianza, integridad y política de instalación del Gateway. Las instalaciones correctas requieren reiniciar el Gateway.
    - `plugins.setEnabled` (`operator.admin`) cambia la política de habilitación de un Plugin instalado mediante `{ pluginId, enabled }`. La respuesta incluye la entrada actualizada del catálogo, metadatos de reinicio y cualquier advertencia sobre la selección de ranuras.
    - `plugins.uninstall` (`operator.admin`) elimina un Plugin instalado externamente mediante `{ pluginId }`: referencias de configuración, el registro de instalación y los archivos administrados. Los Plugins incluidos no se pueden desinstalar, solo deshabilitar. La respuesta enumera las acciones de eliminación y siempre requiere reiniciar el Gateway.

  </Accordion>

  <Accordion title="Mensajería y registros">
    - `send` es la RPC de entrega saliente directa para envíos dirigidos a un canal/cuenta/hilo fuera del ejecutor de chat.
    - `logs.tail` devuelve la parte final del registro de archivos configurado del Gateway con controles de cursor/límite y máximo de bytes.

  </Accordion>

  <Accordion title="Terminal del operador">
    - `terminal.open` inicia una PTY del host para un `agentId` explícito o para el agente predeterminado y devuelve el agente resuelto, el directorio de trabajo, el shell y el estado de confinamiento.
    - `terminal.input`, `terminal.resize` y `terminal.close` operan únicamente sobre sesiones que pertenecen a la conexión que realiza la llamada.
    - Los eventos `terminal.data` y `terminal.exit` se transmiten únicamente a la conexión propietaria de la sesión.
    - Las sesiones cuya conexión se interrumpe se desvinculan, no se terminan: permanecen disponibles para volver a vincularse durante `gateway.terminal.detachedSessionTimeoutSeconds` (valor predeterminado: 300; `0` restablece la terminación al desconectarse), mientras la salida reciente se acumula en un búfer acotado del servidor.
    - `terminal.list` devuelve las sesiones que se pueden vincular; `terminal.attach` vuelve a vincular una sesión activa o desvinculada a la conexión que realiza la llamada y devuelve el búfer de reproducción (toma de control al estilo de tmux: el propietario activo anterior recibe `terminal.exit` con el motivo `detached`); `terminal.text` lee el búfer como texto sin formato sin vincular la sesión.
    - Todos los métodos de terminal requieren `operator.admin`; `gateway.terminal.enabled` debe ser explícitamente verdadero. Los agentes completamente aislados se rechazan, y un cambio en la política del agente cierra las PTY existentes y en curso, incluidas las desvinculadas.

  </Accordion>

  <Accordion title="Habla y TTS">
    - `talk.catalog` devuelve el catálogo de solo lectura de proveedores de Habla para voz, transcripción en streaming y voz en tiempo real: identificadores canónicos de proveedores, alias del registro, etiquetas, estado de configuración, un resultado opcional `ready` a nivel de grupo, identificadores de modelos/voces expuestos, modos canónicos, transportes, estrategias de razonamiento e indicadores de audio/capacidades en tiempo real, sin devolver secretos de proveedores ni modificar la configuración global. Los gateways actuales establecen `ready` después de aplicar la selección de proveedores en tiempo de ejecución; su ausencia debe considerarse como no verificada en gateways anteriores.
    - `talk.config` devuelve la carga útil efectiva de configuración de Habla; `includeSecrets` requiere `operator.talk.secrets` (o `operator.admin`).
    - `talk.session.create` crea una sesión de Habla administrada por el gateway para `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. Para `stt-tts/managed-room`, los llamadores de `operator.write` que pasan `sessionKey` también deben pasar `spawnedBy` para obtener visibilidad de la clave de sesión limitada al ámbito; la creación de `sessionKey` sin ámbito y `brain: "direct-tools"` requieren `operator.admin`.
    - `talk.session.join` valida un token de sesión de sala administrada, emite `session.ready` o `session.replaced` según sea necesario y devuelve metadatos de la sala/sesión junto con eventos recientes de Habla, pero nunca el token en texto sin formato ni su hash.
    - `talk.session.appendAudio` añade audio de entrada PCM en base64 a sesiones de retransmisión y transcripción en tiempo real administradas por el gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` y `talk.session.cancelTurn` controlan el ciclo de vida de los turnos de salas administradas, con rechazo de turnos obsoletos antes de borrar el estado.
    - `talk.session.cancelOutput` detiene la salida de audio del asistente, principalmente para permitir interrupciones controladas por VAD en sesiones de retransmisión del gateway.
    - `talk.session.submitToolResult` completa una llamada a herramienta del proveedor emitida por una sesión de retransmisión en tiempo real administrada por el gateway. La solicitud espera cualquier señal de finalización asíncrona expuesta por el puente del proveedor; los envíos fallidos mantienen activa la ejecución vinculada y no emiten un evento de resultado de herramienta correcto. Pase `options: { willContinue: true }` para obtener una salida provisional de la herramienta o `options: { suppressResponse: true }` cuando el puente del proveedor anuncie compatibilidad con la supresión y el resultado no deba iniciar otra respuesta.
    - `talk.session.steer` envía control de voz de la ejecución activa a una sesión de Habla respaldada por un agente y administrada por el gateway: `{ sessionId, text, mode? }`, donde `mode` es `status`, `steer`, `cancel` o `followup`; si se omite el modo, se clasifica a partir del texto hablado.
    - `talk.session.close` cierra una sesión de retransmisión, transcripción o sala administrada que pertenece al gateway y emite eventos terminales de Habla.
    - `talk.mode` establece/difunde el estado actual del modo Habla para los clientes de WebChat/interfaz de control.
    - `talk.client.create` crea una sesión de proveedor en tiempo real propiedad del cliente mediante `webrtc` o `provider-websocket`, mientras el gateway administra la configuración, las credenciales, las instrucciones y la política de herramientas.
    - `talk.client.toolCall` permite que los transportes en tiempo real propiedad del cliente reenvíen las llamadas a herramientas del proveedor a la política del gateway. La primera herramienta compatible es `openclaw_agent_consult`; los clientes reciben un identificador de ejecución y esperan los eventos normales del ciclo de vida del chat antes de enviar el resultado de la herramienta específico del proveedor.
    - `talk.client.steer` envía control de voz de la ejecución activa para transportes en tiempo real propiedad del cliente. El gateway resuelve la ejecución integrada activa a partir de `sessionKey` y devuelve un resultado estructurado de aceptación/rechazo en lugar de descartar silenciosamente las instrucciones de control.
    - `talk.event` es el canal único de eventos de Habla para adaptadores de tiempo real, transcripción, STT/TTS, salas administradas, telefonía y reuniones.
    - `talk.speak` sintetiza voz mediante el proveedor de voz de Habla activo.
    - `tts.status` devuelve el estado habilitado de TTS, el proveedor activo, los proveedores de respaldo y el estado de configuración de los proveedores.
    - `tts.providers` devuelve el inventario visible de proveedores de TTS.
    - `tts.enable` y `tts.disable` alternan el estado de las preferencias de TTS.
    - `tts.setProvider` actualiza el proveedor de TTS preferido.
    - `tts.convert` ejecuta una conversión de texto a voz puntual.
    - `tts.speak` (`operator.write`) procesa un valor `text` no vacío con la cadena de proveedores generales de TTS configurada y devuelve un clip completo en línea como `audioBase64`, además de `provider` y metadatos opcionales `outputFormat`, `mimeType` y `fileExtension`. A diferencia de `tts.convert`, no devuelve una ruta local del Gateway; a diferencia de `talk.speak`, no requiere un proveedor de Habla. El texto que supere `messages.tts.maxTextLength` devuelve `INVALID_REQUEST`; los fallos de síntesis devuelven `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Secretos, configuración, actualización y asistente">
    - `secrets.reload` vuelve a resolver las SecretRefs activas y sustituye el estado de secretos en tiempo de ejecución solo si todo se completa correctamente.
    - `secrets.resolve` resuelve las asignaciones de secretos destinadas a comandos para un conjunto específico de comandos/destinos.
    - `config.get` devuelve la instantánea y el hash de la configuración actual.
    - `config.set` escribe una carga útil de configuración validada.
    - `config.patch` combina una actualización parcial de la configuración. La sustitución destructiva de matrices requiere incluir la ruta afectada en `replacePaths`; las matrices anidadas bajo entradas de matrices utilizan rutas `[]`, como `agents.list[].skills`.
    - `config.apply` valida y sustituye la carga útil de configuración completa.
    - `config.schema` devuelve la carga útil del esquema de configuración activo que utilizan la interfaz de control y las herramientas de la CLI: esquema, `uiHints`, versión, metadatos de generación y metadatos de esquemas de plugins y canales cuando pueden cargarse. Incluye metadatos `title` / `description` procedentes de las mismas etiquetas/textos de ayuda que la interfaz, incluidas las ramas de composición de objetos anidados, comodines, elementos de matrices y `anyOf` / `oneOf` / `allOf` cuando existe documentación coincidente para el campo.
    - `config.schema.lookup` devuelve una carga útil de consulta limitada a una ruta de configuración: la ruta normalizada, un nodo superficial del esquema, la sugerencia coincidente y `hintPath`, un valor opcional `reloadKind` y resúmenes de los elementos secundarios inmediatos para la exploración detallada en la interfaz/CLI. `reloadKind` es uno de `restart`, `hot` o `none` (`src/config/schema.ts`) y refleja el planificador de recarga de configuración del gateway para la ruta solicitada. Los nodos del esquema de consulta conservan la documentación orientada al usuario y los campos de validación comunes (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos/de cadenas/de matrices/de objetos, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de elementos secundarios exponen `key`, `path` normalizado, `type`, `required`, `hasChildren`, un valor opcional `reloadKind`, además de los valores coincidentes `hint` / `hintPath`.
    - `update.run` ejecuta el flujo de actualización del gateway y programa un reinicio solo si la actualización se completa correctamente; los llamadores que dispongan de una sesión pueden incluir `continuationMessage` para que, al iniciarse, se reanude un turno de seguimiento del agente mediante la cola de continuación tras el reinicio. Las actualizaciones del gestor de paquetes y las actualizaciones supervisadas de repositorios Git desde el plano de control utilizan una transferencia desacoplada al servicio administrado, en lugar de sustituir el árbol de paquetes o modificar el repositorio y la salida de compilación dentro del gateway activo. Una transferencia iniciada devuelve `ok: true` con `result.reason: "managed-service-handoff-started"` y `handoff.status: "started"`; las transferencias no disponibles o fallidas devuelven `ok: false` con `managed-service-handoff-unavailable` o `managed-service-handoff-failed`, además de `handoff.command` cuando se requiere una actualización manual desde el shell. No disponible significa que OpenClaw carece de un límite seguro de supervisión o de una identidad de servicio duradera, como `OPENCLAW_SYSTEMD_UNIT` para systemd. Durante una transferencia iniciada, el indicador de reinicio puede informar brevemente de `stats.reason: "restart-health-pending"`; la continuación se retrasa hasta que la CLI verifica el gateway reiniciado y escribe el indicador final `ok`.
    - `update.status` actualiza y devuelve el indicador más reciente de reinicio por actualización, incluida la versión en ejecución después del reinicio cuando está disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de incorporación mediante RPC por WS.

  </Accordion>

  <Accordion title="Utilidades para agentes y espacios de trabajo">
    - `agents.list` devuelve las entradas de agentes configuradas, incluidos el modelo efectivo y los metadatos de tiempo de ejecución.
    - `agents.create`, `agents.update` y `agents.delete` administran los registros de agentes y la conexión con los espacios de trabajo.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` administran los archivos iniciales del espacio de trabajo expuestos para un agente.
    - `audit.activity.list` devuelve el registro de actividad versionado que solo contiene metadatos; `audit.list` sigue siendo el RPC de ejecución/herramienta compatible.
    - `agents.workspace.list` y `agents.workspace.get` (`operator.read`) exponen una exploración de solo lectura y paginada del directorio del espacio de trabajo de un agente para los clientes del dominio de operadores de confianza descrito en [Ámbitos de operador](/es/gateway/operator-scopes). Las solicitudes solo aceptan rutas relativas al espacio de trabajo; las lecturas permanecen confinadas a la raíz del espacio de trabajo resuelta como ruta real (se rechazan las fugas mediante enlaces simbólicos y enlaces físicos), tienen un límite de tamaño y se restringen a texto UTF-8 y tipos de imagen comunes (base64). Las respuestas no exponen la ruta del espacio de trabajo del host. No hay operaciones de escritura en este espacio de nombres.
    - `tasks.list`, `tasks.get` y `tasks.cancel` exponen el registro de tareas del gateway a los clientes del SDK y a los operadores. Consulte [RPC del registro de tareas](#task-ledger-rpcs) más adelante.
    - `artifacts.list`, `artifacts.get` y `artifacts.download` exponen resúmenes y descargas de artefactos derivados de transcripciones para un ámbito explícito `sessionKey`, `runId` o `taskId`. Las consultas de ejecuciones y tareas resuelven en el servidor la sesión propietaria y solo devuelven contenido multimedia de transcripciones cuya procedencia coincida; las fuentes de URL no seguras o locales devuelven descargas no compatibles en lugar de obtenerlas desde el servidor.
    - `environments.list` y `environments.status` conservan la detección del entorno local del gateway y del Node. Los trabajadores en la nube configurados y los registros duraderos dejados por perfiles anteriores añaden metadatos `worker` con `providerId`, un valor opcional `leaseId`, `state`, `ageMs`, un valor opcional `idleMs` y `attachedSessionIds`. Los estados del ciclo de vida de los trabajadores son `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` y `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) aprovisiona un trabajador a partir de un perfil configurado de proveedor de Plugin; los reintentos con la misma clave reutilizan la operación duradera. `environments.destroy` (`{ environmentId }`) solicita el desmantelamiento idempotente de un entorno de trabajador duradero. Ambas requieren `operator.admin`, son escrituras del plano de control y devuelven la misma estructura de resumen del entorno que utilizan las respuestas de estado.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o una sesión.
    - `agent.wait` espera a que finalice una ejecución y devuelve la instantánea terminal cuando está disponible.

  </Accordion>

  <Accordion title="Control de sesiones">
    - `sessions.list` devuelve el índice de sesiones actual, incluidos los metadatos `agentRuntime` de cada fila cuando se configura un backend de entorno de ejecución de agentes. Cuando se habilita la asignación de trabajadores en la nube o existe un estado de recuperación duradero, las filas de sesión también incluyen un estado cerrado `placement` (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed` o `failed`), además de campos de entorno, época del propietario, espacio de trabajo, paquete, cursor de ACK o recuperación específicos del estado.
    - `sessions.subscribe` y `sessions.unsubscribe` activan o desactivan las suscripciones a eventos de cambio de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` activan o desactivan las suscripciones a eventos de transcripción/mensajes para una sesión. Pase `includeApprovals: true` para recibir también eventos de ciclo de vida `session.approval` saneados para las aprobaciones cuya audiencia persistente incluya esa sesión exacta y cuya vinculación de revisor autorice al cliente suscriptor. La respuesta de suscripción incluye entonces un `approvalReplay` pendiente y acotado; este es autoritativo cuando `truncated` es falso. La participación voluntaria se aplica a cada llamada de suscripción y no es persistente: volver a suscribirse a la misma sesión sin `includeApprovals: true` elimina una suscripción de aprobación existente. Además de la autoridad normal de lectura de sesiones, esta participación voluntaria requiere `operator.admin`, o `operator.approvals` en un dispositivo emparejado.
    - `sessions.preview` devuelve vistas previas acotadas de transcripciones para claves de sesión específicas.
    - `sessions.describe` devuelve una fila de sesión del Gateway para una clave de sesión exacta.
    - `sessions.resolve` resuelve o canoniza un destino de sesión.
    - `sessions.create` crea una nueva entrada de sesión. `worktree: true` aprovisiona un árbol de trabajo administrado; los parámetros opcionales `worktreeBaseRef`/`worktreeName` seleccionan la referencia base y el nombre de la rama, y `execNode` (`operator.admin`) vincula la ejecución de la sesión a un host Node. El árbol de trabajo creado se reproduce en el resultado y se conserva en la fila de sesión (`worktree: { id, branch, repoRoot }`). Cuando se crea la entrada, pero se rechaza su `chat.send` inicial anidado, el resultado correcto incluye `runStarted: false` y `runError`; los clientes pueden conservar la instrucción y volver a intentarlo con la clave de sesión devuelta.
    - `sessions.dispatch` (`operator.admin`) traslada una sesión local existente de OpenClaw con un árbol de trabajo administrado propiedad de la sesión a un perfil configurado de trabajador en la nube. Pase `{ key, profileId, agentId? }`. El método no está disponible cuando no se ha configurado ningún perfil de trabajador, cierra la admisión de turnos locales antes de agotar el trabajo activo y solo devuelve el control después de que la asignación alcanza la propiedad del trabajador `active`. El envío es unidireccional; la recuperación desde el trabajador al entorno local no forma parte de este RPC.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` y `sessions.groups.delete` administran el catálogo de grupos de sesiones personalizados propiedad del Gateway (nombres + orden de visualización). La pertenencia permanece en el campo `category` de cada sesión; el cambio de nombre y la eliminación actualizan las sesiones integrantes en el servidor.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrupción y redirección para una sesión activa.
    - `sessions.abort` cancela el trabajo activo de una sesión. Pase `key` junto con el parámetro opcional `runId`, o solo `runId` para ejecuciones activas que el Gateway pueda resolver como una sesión.
    - `sessions.patch` actualiza los metadatos y las anulaciones de la sesión e informa del modelo canónico resuelto y del `agentRuntime` efectivo.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan el mantenimiento de sesiones.
    - `sessions.get` devuelve la fila de sesión almacenada completa.
    - La ejecución del chat sigue usando `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` se normaliza para su visualización en clientes de interfaz de usuario: las etiquetas de directivas en línea se eliminan del texto visible; se eliminan las cargas XML de llamadas a herramientas en texto sin formato (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y los tokens de control de modelo ASCII o de ancho completo filtrados; se omiten las filas del asistente compuestas exclusivamente por tokens silenciosos (`NO_REPLY` / `no_reply` exactos), y las filas de tamaño excesivo pueden sustituirse por marcadores de posición.
    - `chat.message.get` es el lector completo de mensajes, aditivo y acotado, para una sola entrada visible de la transcripción. Pase `sessionKey`, el parámetro opcional `agentId` cuando la selección de sesiones se limite al agente y un `messageId` de transcripción mostrado previamente mediante `chat.history`; el Gateway devuelve la misma proyección normalizada para su visualización sin el límite de truncamiento del historial ligero, siempre que la entrada almacenada siga disponible y no tenga un tamaño excesivo.
    - `chat.toolTitles` devuelve títulos breves de propósito para las llamadas a herramientas que se muestran en la interfaz de control (por lotes, con un máximo de 24 elementos y entradas acotadas). La función requiere participación voluntaria mediante `gateway.controlUi.toolTitles` (desactivada de forma predeterminada); los Gateways desactivados responden `{ titles: {}, disabled: true }` sin llamar al modelo para que los clientes dejen de solicitarla. Cuando se habilita, los títulos usan el enrutamiento estándar del modelo de utilidades: un `utilityModel` configurado explícitamente (una decisión del operador que, como todas las tareas de utilidades, puede enviar contenido acotado de la tarea al proveedor elegido), o bien el valor predeterminado de modelo pequeño declarado por el proveedor de la sesión, de modo que no aparezca implícitamente ningún destino de salida nuevo; un `utilityModel` vacío los desactiva por completo. Los títulos nunca recurren al modelo principal. Los resultados se almacenan en caché en la base de datos de estado de cada agente, con una clave formada por el nombre de la herramienta y la entrada, por lo que las vistas repetidas nunca vuelven a facturar las mismas llamadas.
    - `chat.send` acepta un `fastMode: "auto"` de un solo turno para usar el modo rápido en las llamadas al modelo iniciadas antes del límite automático y, después, iniciar llamadas posteriores de reintento, alternativa, resultado de herramienta o continuación sin el modo rápido. El límite predeterminado es de 60 segundos (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) y puede configurarse por modelo mediante `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un invocador `chat.send` puede pasar un `fastAutoOnSeconds` de un solo turno para anular el límite de esa solicitud.

  </Accordion>

  <Accordion title="Emparejamiento de dispositivos y tokens de dispositivo">
    - `device.pair.list` devuelve los dispositivos emparejados pendientes y aprobados.
    - `device.pair.setupCode` crea un código de configuración para dispositivos móviles y, de forma predeterminada, una URL de datos QR en formato PNG. Requiere `operator.admin` y se omite intencionadamente del descubrimiento anunciado. El resultado incluye `setupCode`, el parámetro opcional `qrDataUrl`, `gatewayUrl`, la etiqueta no secreta `auth` y `urlSource`.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` administran los registros de emparejamiento de dispositivos.
    - `device.pair.rename` asigna una etiqueta de operador (`{ deviceId, label }`) que tiene preferencia sobre el nombre para mostrar informado por el cliente y se conserva después de reparar o volver a aprobar el dispositivo.
    - `device.token.rotate` rota un token de dispositivo emparejado dentro de los límites de su rol aprobado y del ámbito del invocador.
    - `device.token.revoke` revoca un token de dispositivo emparejado dentro de los límites de su rol aprobado y del ámbito del invocador.

    El código de configuración incorpora una credencial de arranque de corta duración. Los clientes no deben
    registrarla ni conservarla después del flujo de emparejamiento.

  </Accordion>

  <Accordion title="Emparejamiento de nodos, invocación y trabajo pendiente">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` y `node.pair.remove` abarcan las aprobaciones de capacidades de nodos. `node.pair.request` y `node.pair.verify` se eliminaron en 2026.7 junto con el almacén independiente de emparejamiento de nodos; el Gateway crea las solicitudes pendientes durante las conexiones de nodos.
    - `node.list` y `node.describe` devuelven el estado de los nodos conocidos/conectados.
    - `node.rename` actualiza la etiqueta de un nodo emparejado.
    - `node.invoke` reenvía un comando a un nodo conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud de invocación.
    - `mcp.tools.call.v1` es el comando sin interfaz del host del nodo para llamar a una herramienta MCP local del nodo configurada. Se transporta mediante `node.invoke`, requiere que el nodo declare el comando y sigue sujeto a la aprobación de emparejamiento y a `gateway.nodes.denyCommands`.
    - `node.event` transporta los eventos originados en el nodo de vuelta al Gateway.
    - `node.pluginTools.update` es la única ruta de publicación para sustituir los descriptores de herramientas de Plugin/MCP visibles para el agente del nodo conectado; los parámetros `connect` no los transportan.
    - `node.pending.pull` y `node.pending.ack` son las API de cola del nodo conectado.
    - `node.pending.enqueue` y `node.pending.drain` administran el trabajo pendiente duradero para nodos sin conexión o desconectados.

  </Accordion>

  <Accordion title="Familias de aprobaciones">
    - `approval.get` y `approval.resolve` son los métodos de aprobación duraderos e independientes del tipo (ámbito `operator.approvals`). `approval.get` devuelve una proyección saneada, pendiente o terminal retenida, con un `urlPath` estable; `approval.resolve` acepta el identificador canónico de aprobación, un `kind` explícito y una decisión, aplica una resolución en la que prevalece la primera respuesta y siempre devuelve el resultado canónico registrado.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` abarcan las solicitudes de aprobación de ejecución de un solo uso, además de la consulta/repetición de aprobaciones pendientes. Son adaptadores de límites de protocolo sobre el mismo registro duradero de aprobaciones.
    - `exec.approval.waitDecision` espera una aprobación de ejecución pendiente y devuelve la decisión final (o `null` cuando se agota el tiempo de espera).
    - `exec.approvals.get` y `exec.approvals.set` administran las instantáneas de políticas de aprobación de ejecución del Gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` administran la política de aprobación de ejecución local del nodo mediante comandos de retransmisión del nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` abarcan los flujos de aprobación definidos por plugins.

  </Accordion>

  <Accordion title="Automatización, Skills y herramientas">
    - Automatización: `wake` programa una inyección de texto de activación inmediata o para el siguiente Heartbeat; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run` y `cron.runs` administran el trabajo programado.
    - `cron.run` sigue siendo un RPC de tipo puesta en cola para ejecuciones manuales. Los clientes que necesiten semántica de finalización deben leer el `runId` devuelto y consultar periódicamente `cron.runs`.
    - `cron.runs` acepta un filtro `runId` opcional y no vacío para que los clientes puedan seguir una ejecución manual en cola sin entrar en conflicto con otras entradas del historial del mismo trabajo.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Consulte [Métodos auxiliares del operador](#operator-helper-methods) más adelante.

  </Accordion>
</AccordionGroup>

### Familias de eventos comunes

- `chat`: actualizaciones del chat de la UI, como `chat.inject` y otros eventos de chat
  exclusivos de la transcripción. En el protocolo v4, las cargas útiles delta contienen `deltaText`; `message` sigue siendo
  la instantánea acumulativa del asistente. Los reemplazos que no son prefijos establecen
  `replace=true` y usan `deltaText` como texto de reemplazo.
- `session.message`, `session.operation`, `session.tool`: actualizaciones de la transcripción, de la operación de sesión
  en curso y del flujo de eventos de una sesión suscrita.
- `session.approval`: estado depurado de aprobaciones pendientes y terminales para un
  suscriptor de sesión exacta que haya aceptado explícitamente. Las aprobaciones secundarias usan la
  audiencia persistida del antecesor; los eventos nunca modifican las transcripciones ni activan agentes.
- `sessions.changed`: el índice o los metadatos de la sesión han cambiado.
- `presence`: actualizaciones de la instantánea de presencia del sistema.
- `tick`: evento periódico de mantenimiento de conexión/actividad.
- `health`: actualización de la instantánea de estado del Gateway.
- `heartbeat`: actualización del flujo de eventos de Heartbeat.
- `cron`: evento de cambio de una ejecución o tarea de Cron.
- `shutdown`: notificación de cierre del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida del emparejamiento de nodos.
- `node.invoke.request`: difusión de una solicitud de invocación de nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de los dispositivos emparejados.
- `voicewake.changed`: ha cambiado la configuración del activador por palabra de activación.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de la aprobación
  de ejecución.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de la aprobación
  del Plugin.

### Métodos auxiliares de los nodos

Los nodos pueden llamar a `skills.bins` para obtener la lista actual de ejecutables de Skills
para las comprobaciones de autorización automática.

## RPC del registro de auditoría

`audit.activity.list` proporciona a los clientes de operador una vista estable, ordenada de más reciente a más antigua, de los metadatos
del ciclo de vida de ejecuciones de agentes, acciones de herramientas y mensajes con registro opcional. Requiere
`operator.read`. Las consultas excluyen los registros con más de 30 días de antigüedad y el registro
SQLite compartido está limitado a 100,000 registros. Las filas caducadas se eliminan durante
el inicio del Gateway, el mantenimiento horario y las escrituras posteriores. Consulte
[Historial de auditoría](/es/gateway/audit) para conocer el modelo de datos y la semántica de privacidad.

- Parámetros: `agentId`, `sessionKey` o `runId` exactos opcionales; `kind` opcional
  (`"agent_run"`, `"tool_action"` o `"message"`); `status` opcional
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` o `"unknown"`); `direction` de mensaje opcional (`"inbound"` o
  `"outbound"`) y `channel` exacto; límites inclusivos opcionales `after` / `before`
  en milisegundos Unix; `limit` opcional de `1` a `500`; y
  `cursor` de cadena opcional de la página anterior.
- Resultado: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

La unión de resultados V1 con nombre tiene esquemas separados para ejecuciones de agentes, acciones de herramientas, mensajes entrantes
y mensajes salientes. El discriminador `eventType` es, respectivamente,
`agent_run`, `tool_action`, `inbound_message` o `outbound_message`; `kind` y
el `direction` del mensaje siguen disponibles para filtrar y mostrar. Cada evento tiene
un `schemaVersion: 1` entero. Las referencias de identidad de mensajes usan el formato exacto
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>`; un identificador de actor remitente del canal
usa el mismo formato.

Todas las variantes requieren `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` y
`redaction`. Los campos de las variantes son:

| `eventType`        | Campos obligatorios                                               | Campos opcionales                                                                                                                |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, referencias de identidad, `reasonCode`, `errorCode`                      |
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
  `unknown`, porque no puede descartarse el efecto secundario externo.
- `deliveryKind`: `text`, `media` o `other`; `failureStage`:
  `platform_send`, `queue` o `unknown`.

Los campos terminales están correlacionados, no son opcionales de forma independiente:

| Variante         | Correspondencia terminal                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ejecución de agente | `started` no tiene `errorCode`; cada estado finalizado no satisfactorio requiere su código `run_*` correspondiente.                                            |
| Acción de herramienta | `started` y los estados satisfactorios no tienen `errorCode`; cada otro estado finalizado requiere su código `tool_*` correspondiente.                           |
| Mensaje entrante | satisfactorio = `completed`; bloqueado = `skipped`; fallido = `failed` más `message_processing_failed`. `reasonCode`, cuando está presente, debe pertenecer a esa familia terminal. |
| Mensaje saliente | satisfactorio = `sent`; bloqueado = `suppressed` más `reasonCode`; fallido = `failed` más `errorCode` y `failureStage`; desconocido = `unknown` más `failureStage`. |

Cada evento de actividad incluye un identificador de evento estable, una secuencia monotónica del registro,
una secuencia del evento de origen, una marca de tiempo, un actor, una acción, un estado, un
`schemaVersion: 1` entero y `redaction: "metadata_only"`. Los registros de ejecuciones y herramientas
requieren la procedencia del agente y de la ejecución, y pueden incluir la procedencia de la sesión. Los registros de
mensajes pueden incluir identificadores del agente y de la ejecución, pero intencionadamente nunca incluyen
`sessionKey` ni `sessionId`; por tanto, el filtro de consulta `sessionKey` se aplica
solo a las filas de ejecuciones y herramientas. Los eventos de herramientas pueden incluir el identificador de llamada a la herramienta y el nombre de la herramienta.

Los registros de mensajes usan `message.inbound.processed` o
`message.outbound.finished` y añaden la dirección, el canal, el tipo de conversación,
el resultado normalizado y, opcionalmente, el tipo de entrega, la etapa del fallo, la duración,
el recuento de resultados, el código de motivo y seudónimos de cuenta, conversación, mensaje y destino
con clave local de la instalación. Estos seudónimos facilitan
la correlación, pero no constituyen anonimización: la base de datos de estado contiene su clave,
mientras que las exportaciones de RPC y CLI no la incluyen. El registro no almacena prompts, cuerpos de mensajes,
argumentos de herramientas, resultados de herramientas, salida de comandos ni texto de error sin procesar.
Los valores `sessionKey` de ejecuciones/herramientas siguen siendo metadatos de correlación sin procesar y pueden contener
identificadores de cuentas o pares de la plataforma; los registros de mensajes omiten las claves de sesión.

En las filas entrantes, `durationMs` mide el procesamiento central hasta su estado terminal y
`resultCount` cuenta las cargas útiles finalizadas en cola de herramientas, bloqueos y respuestas. En las
filas salientes, `durationMs` abarca desde la asunción de responsabilidad de la entrega hasta la confirmación,
la cola de mensajes no entregados o la reconciliación (incluido el tiempo de espera en cola), y `resultCount`
cuenta los envíos físicos identificados a la plataforma. `deliveryKind`, cuando está presente,
describe la carga útil efectiva después de los hooks y el renderizado; las filas suprimidas o con ambigüedad
por bloqueo inesperado lo omiten.

La cobertura actual de mensajes incluye los mensajes entrantes aceptados que llegan al procesamiento
central, incluidos los resultados duplicados/terminales del núcleo. La cobertura saliente escribe
una fila terminal por cada carga útil de respuesta lógica original que llega a la entrega duradera
compartida; la fragmentación y la distribución del adaptador se agregan en `resultCount`. Los envíos
reintentables o ambiguos en cola solo se registran después de la confirmación, la cola
de mensajes no entregados o la reconciliación. Las rutas locales del Plugin y de envío directo que eluden esos
límites compartidos aún no están cubiertas. La cola acotada de procesos de trabajo funciona según el mejor esfuerzo
y puede descartar registros en caso de fallo o saturación, por lo que esta superficie no es un
archivo de cumplimiento sin pérdidas.

El registro está activado de forma predeterminada y se controla mediante
[`audit.enabled`](/es/gateway/configuration-reference#audit). El registro de mensajes
se controla por separado mediante `audit.messages` y su valor predeterminado es `"off"`. Cuando
el registro está desactivado, `audit.activity.list` continúa sirviendo los registros escritos
anteriormente hasta que caducan.

Los esquemas publicados de solicitud, resultado y `AuditEvent` de `audit.list`
permanecen sin cambios y solo devuelven registros de ejecuciones de agentes y acciones de herramientas. Los nuevos clientes
de operador deben llamar a `audit.activity.list` cuando el Gateway lo anuncie. Los Gateways
anteriores pueden devolver `unknown method: audit.activity.list` o, debido a que en las versiones publicadas
la autorización precedía a la búsqueda del método, `missing scope:
operator.admin` ante una solicitud con ámbito de lectura. Trate este último como ausencia del método
solo cuando el método no se haya anunciado. Un cliente puede volver a intentar `audit.list`
solo cuando sus filtros no requieran compatibilidad con el tipo, la dirección o el canal
del mensaje.

Use [`openclaw audit`](/es/cli/audit) para consultas de texto y exportaciones JSON acotadas.

## RPC del registro de tareas

Los clientes de operador inspeccionan y cancelan los registros de tareas en segundo plano del Gateway mediante
los RPC del registro de tareas (`packages/gateway-protocol/src/schema/tasks.ts`). Estos
devuelven resúmenes depurados de las tareas, no el estado de ejecución sin procesar.

- `tasks.list` requiere `operator.read`.
  - Parámetros: `status` opcional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` o `"timed_out"`) o una matriz de esos estados,
    `agentId` opcional, `sessionKey` opcional, `limit` opcional de `1` a
    `500` y la cadena opcional `cursor`.
  - Resultado: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` requiere `operator.read`.
  - Parámetros: `{ "taskId": string }`.
  - Resultado: `{ "task": TaskSummary }`.
  - Los identificadores de tarea inexistentes devuelven el formato de error de elemento no encontrado del Gateway.
- `tasks.cancel` requiere `operator.write`.
  - Parámetros: `{ "taskId": string, "reason"?: string }`.
  - Resultado: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` indica si el registro contenía una tarea coincidente. `cancelled`
    indica si el entorno de ejecución aceptó o registró la cancelación.

`TaskSummary` incluye `id`, `status` y metadatos opcionales: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, marcas de tiempo, progreso,
resumen de terminación y texto de error depurado. `agentId` identifica al agente
que ejecuta la tarea; `sessionKey` y `ownerKey` conservan el contexto del solicitante y de
control.

## Métodos auxiliares para operadores

- `commands.list` (`operator.read`) obtiene el inventario de comandos del entorno de ejecución para
  un agente.
  - `agentId` es opcional; omítalo para leer el espacio de trabajo predeterminado del agente.
  - `scope` controla a qué superficie se dirige el `name` principal: `text` devuelve
    el token principal del comando de texto sin el `/` inicial; `native` y la
    ruta predeterminada `both` devuelven nombres nativos adaptados al proveedor cuando están disponibles.
  - `textAliases` contiene alias exactos con barra diagonal, como `/model` y `/m`.
  - `nativeName` contiene el nombre del comando nativo adaptado al proveedor cuando
    existe.
  - `provider` es opcional y solo afecta a la nomenclatura nativa y a la disponibilidad de comandos
    nativos de plugins.
  - `includeArgs=false` omite de la respuesta los metadatos serializados de argumentos.
- `tools.catalog` (`operator.read`) obtiene el catálogo de herramientas del entorno de ejecución para un
  agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: plugin propietario cuando `source="plugin"`
  - `optional`: indica si una herramienta de plugin es opcional
- `tools.effective` (`operator.read`) obtiene el inventario efectivo de herramientas del entorno de
  ejecución para una sesión.
  - `sessionKey` es obligatorio.
  - El Gateway deriva del lado del servidor el contexto fiable del entorno de ejecución a partir de la sesión,
    en lugar de aceptar un contexto de autenticación o entrega suministrado por el llamador.
  - La respuesta es una proyección derivada por el servidor y limitada a la sesión del inventario
    activo, incluidas las herramientas del núcleo, de plugins, de canales y de servidores MCP
    ya detectadas.
  - `tools.effective` es de solo lectura para MCP: puede proyectar un catálogo MCP
    de una sesión activa mediante la política final de herramientas, pero no crea entornos de ejecución MCP,
    conecta transportes ni emite `tools/list`. Si no existe un catálogo activo
    coincidente, la respuesta puede incluir un aviso como `mcp-not-yet-connected`,
    `mcp-not-yet-listed` o `mcp-stale-catalog`.
  - Las entradas de herramientas efectivas usan `source="core"`, `source="plugin"`,
    `source="channel"` o `source="mcp"`.
- `tools.invoke` (`operator.write`) invoca una herramienta disponible mediante la
  misma ruta de políticas del Gateway que `/tools/invoke`.
  - `name` es obligatorio. `args`, `sessionKey`, `agentId`, `confirm` y
    `idempotencyKey` son opcionales.
  - Si están presentes tanto `sessionKey` como `agentId`, el agente de la sesión resuelta
    debe coincidir con `agentId`.
  - Los envoltorios del núcleo exclusivos del propietario, como `cron`, `gateway` y `nodes`, requieren
    una identidad de propietario/administrador (`operator.admin`), aunque `tools.invoke`
    sea `operator.write`.
  - La respuesta es un contenedor orientado al SDK con `ok`, `toolName`, el campo opcional
    `output` y campos `error` tipados. Los rechazos de aprobación o de políticas devuelven
    `ok:false` en la carga útil, en lugar de eludir el flujo de políticas de herramientas
    del Gateway.
- `skills.status` (`operator.read`) obtiene el inventario visible de Skills para un
  agente.
  - `agentId` es opcional; omítalo para leer el espacio de trabajo predeterminado del agente.
  - La respuesta incluye la idoneidad, los requisitos que faltan, las comprobaciones de configuración
    y opciones de instalación depuradas sin exponer valores de secretos sin procesar.
- `skills.search` y `skills.detail` (`operator.read`) devuelven metadatos de
  detección de ClawHub.
- `skills.upload.begin`, `skills.upload.chunk` y `skills.upload.commit`
  (`operator.admin`) preparan un archivo privado de Skills antes de instalarlo. Esta
  es una ruta de carga administrativa independiente para clientes de confianza, no el flujo normal
  de instalación de Skills de ClawHub, y está desactivada de forma predeterminada salvo que
  `skills.install.allowUploadedArchives` esté activado.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    crea una carga vinculada a ese slug y valor de imposición.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` agrega bytes en
    el desplazamiento decodificado exacto.
  - `skills.upload.commit({ uploadId, sha256? })` verifica el tamaño final y
    SHA-256. La confirmación solo finaliza la carga; no instala la Skill.
  - Los archivos de Skills cargados son archivos zip que contienen una raíz `SKILL.md`. El
    nombre del directorio interno del archivo nunca selecciona el destino de instalación.
- `skills.install` (`operator.admin`) tiene tres modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una
    carpeta de Skill en el directorio `skills/` del espacio de trabajo predeterminado del agente.
  - Modo de carga: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instala una carga confirmada en el directorio `skills/<slug>`
    del espacio de trabajo predeterminado del agente. El slug y el valor de imposición deben coincidir con la
    solicitud `skills.upload.begin` original. Se rechaza salvo que
    `skills.install.allowUploadedArchives` esté activado; la configuración no
    afecta a las instalaciones de ClawHub.
  - Modo de instalador del Gateway: `{ name, installId, timeoutMs? }` ejecuta una acción
    `metadata.openclaw.install` declarada en el host del Gateway. Los clientes antiguos aún pueden
    enviar `dangerouslyForceUnsafeInstall`; este campo está obsoleto,
    se acepta únicamente por compatibilidad con el protocolo y se ignora. Use
    `security.installPolicy` para decisiones de instalación a cargo del operador.
- `skills.update` (`operator.admin`) tiene dos modos:
  - El modo ClawHub actualiza un slug registrado o todas las instalaciones de ClawHub registradas en
    el espacio de trabajo predeterminado del agente.
  - El modo de configuración modifica valores de `skills.entries.<skillKey>` como `enabled`,
    `apiKey` y `env`.

### Vistas de `models.list`

`models.list` acepta un parámetro `view` opcional
(`src/agents/model-catalog-visibility.ts`):

- Omitido o `"default"`: si `agents.defaults.models` está configurado, la
  respuesta es el catálogo permitido, incluidos los modelos detectados dinámicamente
  para las entradas `provider/*`. De lo contrario, la respuesta es el catálogo completo
  del Gateway.
- `"configured"`: comportamiento con dimensiones de selector. Si `agents.defaults.models` está
  configurado, sigue teniendo prioridad, incluida la detección limitada al proveedor para
  las entradas `provider/*`. Sin una lista de permitidos, la respuesta usa entradas
  `models.providers.<provider>.models` explícitas y recurre al catálogo
  completo solo cuando no existen filas de modelos configuradas.
- `"provider-config"`: inventario `models.providers.*.models` definido por la fuente,
  independiente de las listas de permitidos del selector. Las filas incluyen capacidades públicas de los modelos y
  disponibilidad según la ruta, pero omiten los puntos de conexión del proveedor, el material de autenticación y
  la configuración de solicitudes del entorno de ejecución.
- `"all"`: catálogo completo del Gateway, que omite `agents.defaults.models`. Úselo para
  interfaces de diagnóstico/detección, no para selectores de modelos normales.

## Aprobaciones de ejecución

- Cuando una solicitud de ejecución necesita aprobación, el Gateway difunde
  `exec.approval.requested`.
- Los clientes operadores la resuelven llamando a `exec.approval.resolve` (requiere
  `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan`
  (metadatos canónicos de `argv`/`cwd`/`rawCommand`/sesión). Las solicitudes sin
  `systemRunPlan` se rechazan.
- Tras la aprobación, las llamadas `node.invoke system.run` reenviadas reutilizan ese
  `systemRunPlan` canónico como contexto autoritativo de comando/directorio de trabajo/sesión.
- Si un llamador modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` entre la preparación y el reenvío `system.run` aprobado definitivo,
  el Gateway rechaza la ejecución en lugar de confiar en la carga útil modificada.

## Alternativa de entrega del agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar la entrega saliente.
- `bestEffortDeliver=false` (el valor predeterminado) mantiene el comportamiento estricto: los destinos de entrega
  no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite recurrir a la ejecución solo en la sesión cuando no
  se puede resolver ninguna ruta externa de entrega (por ejemplo, sesiones internas/de chat web
  o configuraciones ambiguas con varios canales).
- Los resultados `agent` finales pueden incluir `result.deliveryStatus` cuando se solicitó la
  entrega, usando los mismos estados `sent`, `suppressed`, `partial_failed` y
  `failed` documentados para
  [`openclaw agent --json --deliver`](/es/cli/agent#json-delivery-status).

## Control de versiones

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` y `MIN_PROBE_PROTOCOL_VERSION` residen en
  `packages/gateway-protocol/src/version.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`. Los clientes operadores y de interfaz deben
  incluir el protocolo actual en ese intervalo; los clientes y servidores actuales usan
  el protocolo v4.
- Los clientes autenticados con `role: "node"` y `client.mode: "node"`
  pueden usar el protocolo de Node N-1 (actualmente v3). Las sondas ligeras de reinicio usan
  el mismo intervalo N-1. La autenticación de dispositivos, el emparejamiento, los ámbitos, la política de comandos y las
  aprobaciones de ejecución no cambian debido a esta ventana de compatibilidad. Las capacidades y los comandos
  de Node pertenecientes a plugins se omiten hasta que el Node se actualiza al protocolo
  actual porque sus superficies alojadas no forman parte del contrato N-1.
- Los esquemas y modelos se generan a partir de definiciones de TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes del cliente

La implementación de referencia del cliente reside en `packages/gateway-client/src/`
(OpenClaw la encapsula mediante la delgada fachada `src/gateway/client.ts`). Estos
valores predeterminados son estables en todo el protocolo v4 y constituyen la referencia esperada para
clientes de terceros.

| Constante                                 | Valor predeterminado                                  | Fuente                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Tiempo de espera de solicitud (por RPC)   | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Tiempo de espera de preautenticación/desafío de conexión | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (la variable de entorno `OPENCLAW_HANDSHAKE_TIMEOUT_MS` puede aumentar el margen emparejado del servidor y el cliente) |
| Retardo inicial de reconexión             | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Retardo máximo de reconexión              | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Límite de reintento rápido tras el cierre por token de dispositivo | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Período de gracia para la detención forzada antes de `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Intervalo de tick predeterminado (antes de `hello-ok`) | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Cierre por tiempo de espera de tick       | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

El servidor anuncia los valores efectivos de `policy.tickIntervalMs`,
`policy.maxPayload` y `policy.maxBufferedBytes` en `hello-ok`; los clientes
deben respetar esos valores en lugar de los valores predeterminados anteriores al protocolo de enlace.

El cliente de referencia permite que las solicitudes finitas controlen el plazo configurado cuando
cada solicitud pendiente tiene uno. Una solicitud `expectFinal` sin un
`timeoutMs` finito, cualquier solicitud con `timeoutMs: null` o una combinación de solicitudes
finitas y sin límite mantiene activo el mecanismo de vigilancia de ticks. Si no se reciben eventos ni
respuestas durante un período superior al umbral de tiempo de espera de tick, el cliente cierra el
socket con el código `4000`, rechaza todas las solicitudes pendientes y se vuelve a conectar. No
repite las solicitudes rechazadas después de volver a conectarse.

## Autenticación

- La autenticación del Gateway mediante secreto compartido utiliza `connect.params.auth.token` o
  `connect.params.auth.password`, según el
  `gateway.auth.mode` configurado (`"none" | "token" | "password" | "trusted-proxy"`).
- Los modos que contienen identidad, como Tailscale Serve (`gateway.auth.allowTailscale: true`)
  o `gateway.auth.mode: "trusted-proxy"` que no sea de bucle invertido, satisfacen la comprobación de
  autenticación de conexión mediante los encabezados de la solicitud en lugar de `connect.params.auth.*`.
- El `gateway.auth.mode: "none"` de ingreso privado omite por completo la autenticación
  de conexión mediante secreto compartido; no se debe exponer ese modo en ingresos públicos o no fiables.
- Tras el emparejamiento, el Gateway emite un token de dispositivo limitado al rol
  y los ámbitos de la conexión, devuelto en `hello-ok.auth.deviceToken`. Los clientes deben
  conservarlo después de cualquier conexión correcta.
- Al volver a conectarse con ese token de dispositivo almacenado, también se debe reutilizar el
  conjunto de ámbitos aprobados almacenado para dicho token. Esto conserva el acceso de lectura, sondeo y estado
  ya concedido y evita que las reconexiones se reduzcan silenciosamente a un ámbito
  implícito más restringido, exclusivo de administración.
- Composición de la autenticación de conexión del lado del cliente (`selectConnectAuth` en
  `packages/gateway-client/src/client.ts`):
  - `auth.password` es independiente y siempre se reenvía cuando está establecido.
  - `auth.token` se rellena por orden de prioridad: primero el token compartido explícito,
    después un `deviceToken` explícito y, por último, un token almacenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` solo se envía cuando ninguna de las opciones anteriores ha resuelto
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La promoción automática de un token de dispositivo almacenado durante el reintento único
    de `AUTH_TOKEN_MISMATCH` se limita exclusivamente a puntos de conexión fiables: bucle invertido
    o `wss://` con un `tlsFingerprint` fijado. Un `wss://` público sin fijación
    no cumple los requisitos.
- El arranque integrado mediante código de configuración devuelve el
  `hello-ok.auth.deviceToken` del nodo principal y un token de operador limitado en
  `hello-ok.auth.deviceTokens` para la transferencia móvil fiable. El token de operador
  incluye `operator.talk.secrets` para las lecturas de configuración nativas de Talk, pero
  excluye los ámbitos de modificación del emparejamiento y `operator.admin`.
- Mientras un arranque mediante código de configuración que no sea de referencia espera la aprobación,
  los detalles de `PAIRING_REQUIRED` incluyen `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` y `pauseReconnect: false`. Se debe seguir intentando la conexión con el
  mismo token de arranque hasta que se apruebe la solicitud o el token deje de
  ser válido.
- Se debe conservar `hello-ok.auth.deviceTokens` únicamente cuando la conexión haya utilizado la
  autenticación de arranque en un transporte fiable, como `wss://`, o mediante emparejamiento local o de bucle invertido.
- Si un cliente proporciona un `deviceToken` explícito o un `scopes` explícito, el
  conjunto de ámbitos solicitado por el invocador sigue siendo el autoritativo; los ámbitos almacenados en caché solo
  se reutilizan cuando el cliente reutiliza el token almacenado por dispositivo.
- Los tokens de dispositivo se pueden rotar o revocar mediante `device.token.rotate` y
  `device.token.revoke` (requiere `operator.pairing`). Rotar o revocar un
  nodo u otro rol que no sea de operador también requiere `operator.admin`.
- `device.token.rotate` devuelve metadatos de rotación. Solo devuelve el token
  portador de sustitución en las llamadas del mismo dispositivo que ya estén autenticadas con ese
  token de dispositivo, para que los clientes que solo utilizan tokens puedan conservar el sustituto antes de
  volver a conectarse. Las rotaciones compartidas o administrativas no devuelven el token portador.
- La emisión, rotación y revocación de tokens permanecen limitadas al conjunto de roles
  aprobados registrado en la entrada de emparejamiento de ese dispositivo; la modificación de tokens no puede ampliar ni
  dirigirse a un rol de dispositivo que la aprobación del emparejamiento nunca haya concedido.
- En las sesiones de tokens de dispositivos emparejados, la administración de dispositivos se limita al propio dispositivo, salvo que
  el invocador también tenga `operator.admin`: los invocadores sin privilegios administrativos solo pueden administrar el
  token de operador de su propia entrada de dispositivo. La administración de tokens de nodos y otros tokens
  que no sean de operador es exclusiva de administración, incluso para el propio dispositivo del invocador.
- `device.token.rotate` y `device.token.revoke` también comparan el conjunto de ámbitos
  del token de operador de destino con los ámbitos de la sesión actual del invocador.
  Los invocadores sin privilegios administrativos no pueden rotar ni revocar un token de operador con un ámbito más amplio que el que
  ya poseen.
- Los fallos de autenticación incluyen `error.details.code` y sugerencias de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep`: uno de `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes fiables pueden intentar un único reintento limitado con un token almacenado
    por dispositivo.
  - Si ese reintento falla, se deben detener los bucles de reconexión automática y mostrar
    indicaciones sobre la intervención necesaria del operador.
- `AUTH_SCOPE_MISMATCH` significa que se reconoció el token de dispositivo, pero no
  abarca el rol ni los ámbitos solicitados. No se debe presentar como un token incorrecto; se debe indicar
  al operador que vuelva a emparejar el dispositivo o que apruebe el contrato de ámbitos más restringido o más amplio.

## Identidad y emparejamiento de dispositivos

- Los nodos deben incluir una identidad de dispositivo estable (`device.id`) derivada de una
  huella digital del par de claves.
- Los Gateways emiten tokens por dispositivo y rol.
- Se requiere la aprobación del emparejamiento para los nuevos identificadores de dispositivo, salvo que esté habilitada la
  aprobación automática local.
- La aprobación automática del emparejamiento se centra en las conexiones directas mediante bucle invertido local.
- OpenClaw también dispone de una ruta restringida de conexión consigo mismo, local al backend o al contenedor, para
  flujos auxiliares fiables mediante secreto compartido.
- Las conexiones mediante tailnet o LAN en el mismo host siguen tratándose como remotas para el emparejamiento
  y requieren aprobación.
- Los clientes WS normalmente incluyen la identidad `device` durante `connect` (operador +
  nodo). Las únicas excepciones para operadores sin dispositivo son rutas de confianza explícitas:
  - `gateway.controlUi.allowInsecureAuth=true` para la compatibilidad con HTTP
    no seguro exclusivamente en localhost.
  - autenticación correcta del operador de la interfaz de control mediante `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (medida de emergencia, reducción
    grave de la seguridad).
  - RPC de backend de `gateway-client` mediante bucle invertido directo en la ruta auxiliar interna
    reservada.
- Omitir la identidad del dispositivo tiene consecuencias para los ámbitos. Cuando se permite una conexión
  de operador sin dispositivo mediante una ruta de confianza explícita, OpenClaw
  sigue borrando los ámbitos autodeclarados y los deja como un conjunto vacío, salvo que dicha ruta tenga una
  excepción específica de conservación de ámbitos. Los métodos restringidos por ámbitos fallan entonces con
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` es una ruta de conservación de ámbitos de emergencia de la
  interfaz de control. No concede ámbitos a clientes WebSocket arbitrarios
  personalizados con forma de backend o CLI.
- La ruta auxiliar de backend reservada de `gateway-client` mediante bucle invertido directo conserva
  los ámbitos únicamente para RPC internas del plano de control local; los identificadores de backend personalizados
  no reciben esta excepción.
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de la autenticación de dispositivos

Para los clientes heredados que aún utilizan el comportamiento de firma anterior al desafío, `connect`
devuelve códigos de detalle `DEVICE_AUTH_*` en `error.details.code` con un
`error.details.reason` estable.

Fallos comunes de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió en blanco).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto o incorrecto.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga útil de la firma no coincide con la carga útil v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella digital de la clave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Se produjo un error en el formato o la canonicalización de la clave pública.         |

Objetivo de migración:

- Espere siempre a `connect.challenge`.
- Firme la carga útil v2 que incluye el nonce del servidor.
- Envíe el mismo nonce en `connect.params.device.nonce`.
- La carga útil de firma preferida es `v3`
  (`buildDeviceAuthPayloadV3` en `packages/gateway-client/src/device-auth.ts`),
  que vincula `platform` y `deviceFamily`, además de
  los campos de dispositivo, cliente, rol, ámbitos, token y nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero la fijación
  de los metadatos del dispositivo emparejado continúa controlando la política de comandos al reconectarse.

## TLS y fijación

- Se admite TLS para las conexiones WS (configuración `gateway.tls`).
- Los clientes pueden fijar opcionalmente la huella digital del certificado del Gateway mediante
  `gateway.remote.tlsFingerprint` o la opción de la CLI `--tls-fingerprint`.

## Alcance

Este protocolo expone la API completa del Gateway: estado, canales, modelos, chat,
agente, sesiones, nodos, aprobaciones y más. La superficie exacta se define mediante
los esquemas de TypeBox reexportados desde `packages/gateway-protocol/src/schema.ts`.

## Contenido relacionado

- [Protocolo de puente](/es/gateway/bridge-protocol)
- [Guía operativa del Gateway](/es/gateway)
