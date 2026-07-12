---
read_when:
    - Implementación o actualización de clientes WS del Gateway
    - Depuración de incompatibilidades de protocolo o fallos de conexión
    - Regeneración del esquema y los modelos del protocolo
summary: 'Protocolo WebSocket del Gateway: establecimiento de conexión, tramas y control de versiones'
title: Protocolo del Gateway
x-i18n:
    generated_at: "2026-07-12T14:30:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d71b75d49bf8a1ea2d835b1d8e532b1d01e87e8b64d6ab7dcb00f28791d3b8ac
    source_path: gateway/protocol.md
    workflow: 16
---

El protocolo WS del Gateway es el único plano de control y transporte de nodos de
OpenClaw. Los clientes de operador y nodo (CLI, interfaz web, aplicación para macOS, nodos iOS/Android,
nodos sin interfaz gráfica) se conectan mediante WebSocket y declaran un **rol** y un **ámbito** durante
el protocolo de enlace.

## Transporte y entramado

- WebSocket, tramas de texto, cargas JSON.
- La primera trama **debe** ser una solicitud `connect`.
- Las tramas previas a la conexión tienen un límite de 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Tras
  el protocolo de enlace, se deben respetar `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con los diagnósticos habilitados, las tramas
  entrantes sobredimensionadas y los búferes de salida lentos emiten eventos `payload.large` antes de que
  el Gateway cierre o descarte la trama. Estos eventos contienen `surface`, tamaños en
  bytes, límites y un código de motivo seguro, pero nunca cuerpos de mensajes, contenido de
  archivos adjuntos, bytes de trama sin procesar, tokens, cookies ni secretos.

Formas de las tramas:

- Solicitud: `{type:"req", id, method, params}`
- Respuesta: `{type:"res", id, ok, payload|error}`
- Evento: `{type:"event", event, payload, seq?, stateVersion?}`

Los métodos con efectos secundarios requieren claves de idempotencia (véase el esquema).

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

`server`, `features`, `snapshot`, `policy` y `auth` son obligatorios según
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`). `auth`
informa del rol y los ámbitos negociados incluso cuando no se emite ningún token de dispositivo (forma
anterior). `pluginSurfaceUrls` es opcional y asigna nombres de superficies de plugins (p. ej.,
`canvas`) a URL alojadas con ámbito; puede caducar, por lo que los nodos llaman a
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` para obtener una entrada nueva.
La ruta obsoleta `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
no es compatible; utilice superficies de plugins.

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

El arranque integrado mediante QR/código de configuración es una vía de transferencia a dispositivos móviles. Una
conexión correcta con código de configuración básico devuelve un token de nodo principal y un
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

Esta transferencia de operador está limitada deliberadamente: es suficiente para iniciar el bucle del
operador móvil y la configuración nativa, incluido `operator.talk.secrets` para las lecturas de la
configuración de Talk, pero sin ámbitos de modificación del emparejamiento ni `operator.admin`. Un acceso más amplio
al emparejamiento o la administración requiere un flujo independiente de emparejamiento aprobado o de tokens. Conserve
`hello-ok.auth.deviceTokens` únicamente cuando la autenticación de arranque se haya ejecutado mediante un
transporte de confianza (`wss://` o emparejamiento de bucle invertido/local).

Los clientes de backend de confianza dentro del mismo proceso (`client.id: "gateway-client"`,
`client.mode: "backend"`) pueden omitir `device` en conexiones directas de bucle invertido cuando
se autentican con el token o la contraseña compartidos del Gateway. Esta vía está reservada
para RPC internos del plano de control (p. ej., actualizaciones de sesiones de subagentes) y evita
que las bases de referencia obsoletas de emparejamiento del CLI o del dispositivo bloqueen el trabajo local del backend. Los clientes remotos,
con origen en navegadores, de nodos y los que usan explícitamente tokens o identidades de dispositivo siguen
pasando por las comprobaciones normales de emparejamiento y ampliación de ámbitos.

### Rol de trabajador y protocolo cerrado

Los trabajadores en la nube usan una entrada de bucle invertido dedicada a través del túnel SSH propiedad del Gateway
y anclado a la clave del host. Solo acepta identidades de trabajadores y nunca despacha
autenticación general, eventos de nodos, RPC de operadores ni métodos de plugins. Un `connect` estricto
verifica una credencial de corta duración almacenada como hash y vinculada al entorno, al hash del
paquete, a la época del propietario, a la versión del conjunto de RPC, a la caducidad y a una sesión anulable; además,
comprueba por separado la versión y el conjunto de funciones actuales. Si se completa correctamente, devuelve el
`worker-hello-ok` mínimo; la negociación de funciones es independiente de la versión general del protocolo.
Las tramas se mantienen por debajo de 64 KiB. La lista cerrada de permitidos contiene
`worker.heartbeat`, `worker.transcript.commit` y `worker.live-event`.
Las confirmaciones de transcripciones utilizan delimitación por época del propietario, una vinculación de sesión propiedad del Gateway, una operación de
comparación e intercambio de la hoja base y una reproducción duradera de secuencias; el Gateway genera los identificadores de
entrada y de elemento principal de la transcripción mediante el escritor de sesiones normal. La propiedad y la caducidad se
vuelven a comprobar en cada RPC.

### Capacidades del cliente

Los clientes de operador pueden anunciar capacidades opcionales en `connect.params.caps`:

- `tool-events`: acepta eventos estructurados del ciclo de vida de herramientas.
- `inline-widgets`: puede representar resultados de herramientas de widgets integrados alojados.

Las capacidades del cliente describen el cliente conectado, no la autorización. Las herramientas del agente pueden declarar capacidades obligatorias; el Gateway omite esas herramientas a menos que cada requisito aparezca en `caps` del cliente de origen. Las ejecuciones originadas en canales no tienen capacidades de cliente del Gateway, por lo que las herramientas restringidas por capacidades no están disponibles, incluso cuando la política de herramientas las permite explícitamente.

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

Los nodos declaran afirmaciones de capacidades durante la conexión:

- `caps`: categorías de alto nivel como `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: lista de comandos permitidos para invocación.
- `permissions`: controles granulares (p. ej., `screen.record`, `camera.capture`).

El Gateway las trata como afirmaciones y aplica listas de permitidos en el servidor.

## Roles y ámbitos

Para consultar el modelo completo de ámbitos de operador, las comprobaciones durante la aprobación y la semántica
de los secretos compartidos, véase [Ámbitos de operador](/es/gateway/operator-scopes).

Roles:

- `operator`: cliente del plano de control (CLI/interfaz/automatización).
- `node`: host de capacidades (cámara/pantalla/lienzo/system.run).
- `worker`: host de ejecución en la nube en el protocolo dedicado y cerrado para trabajadores.

Ámbitos de operador (`src/gateway/operator-scopes.ts`), el conjunto cerrado completo:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` requiere `operator.talk.secrets` (u
`operator.admin`). Cuando se incluyen secretos, lea la credencial del proveedor activo de Talk
desde `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
conserva la forma del origen y puede ser un objeto SecretRef o una cadena redactada.

Los métodos RPC del Gateway registrados por plugins pueden solicitar su propio ámbito de operador,
pero estos prefijos reservados del núcleo siempre se resuelven como `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

El ámbito del método es solo la primera barrera. Algunos comandos con barra a los que se accede mediante
`chat.send` aplican comprobaciones más estrictas a nivel de comando: las escrituras persistentes de `/config set` y
`/config unset` requieren `operator.admin`, incluso para clientes del Gateway que
ya poseen un ámbito de operador inferior.

`node.pair.approve` tiene una comprobación adicional de ámbito durante la aprobación, además del
ámbito base del método (`operator.pairing`), basada en los `commands` declarados
en la solicitud pendiente (`src/infra/node-pairing-authz.ts`):

| Comandos declarados                                            | Ámbitos requeridos                      |
| -------------------------------------------------------------- | --------------------------------------- |
| ninguno                                                        | `operator.pairing`                      |
| comandos que no son de ejecución                               | `operator.pairing` + `operator.write`   |
| incluye `system.run`, `system.run.prepare` o `system.which`    | `operator.pairing` + `operator.admin`   |

### Caps/comandos/permisos (nodo)

Los nodos declaran afirmaciones de capacidades durante la conexión:

- `caps`: categorías de capacidades de alto nivel como `camera`, `canvas`, `screen`,
  `location`, `voice` y `talk`.
- `commands`: lista de comandos permitidos para invocación.
- `permissions`: controles granulares (p. ej., `screen.record`, `camera.capture`).

El Gateway las trata como **afirmaciones** y aplica listas de permitidos en el servidor.
Los nodos conectados pueden publicar descriptores opcionales de herramientas de plugins o MCP visibles para el agente
mediante `node.pluginTools.update` después de una conexión o
reconexión correcta. Los hosts de nodos sin interfaz gráfica se reinician para aplicar los cambios declarativos del inventario
MCP. Este método de actualización es la única vía de publicación; los descriptores de herramientas de plugins no se aceptan en los
parámetros de `connect`. Cada descriptor debe usar un `name` de herramienta seguro para el proveedor y nombrar
un `command` de la lista actual de comandos permitidos del nodo. El Gateway confía en los metadatos
de los descriptores procedentes del nodo emparejado, filtra los descriptores fuera de la superficie de comandos aprobada,
los elimina cuando el nodo se desconecta y rechaza los intentos de un operador de
modificar el catálogo de otro nodo. Establezca `gateway.nodes.pluginTools.enabled: false`
para ignorar los descriptores publicados por los nodos.

Los hosts de nodos conectados publican su catálogo completo de reemplazo de Skills mediante
`node.skills.update`. Este método del rol de nodo es la única vía de publicación de Skills
del nodo; no se aceptan Skills en los parámetros de `connect`. Cada descriptor contiene un
nombre seguro, una descripción y contenido limitado de `SKILL.md`. El Gateway analiza ese
contenido mediante el cargador normal de Skills, lo incluye en las instantáneas de Skills del agente
mientras el nodo está conectado y lo elimina al desconectarse. Establezca
`gateway.nodes.skills.enabled: false` para ignorar las Skills publicadas por los nodos.

## Presencia

- `system-presence` devuelve entradas indexadas por identidad de dispositivo, incluidos
  `deviceId`, `roles` y `scopes`, para que las interfaces puedan mostrar una fila por dispositivo incluso
  cuando se conecta tanto como operador como nodo.
- `node.list` incluye los campos opcionales `lastSeenAtMs` y `lastSeenReason`. Los nodos
  conectados informan de la hora de conexión actual con el motivo `connect`; los nodos emparejados también pueden
  informar de una presencia persistente en segundo plano mediante un evento de nodo de confianza.

Los nodos nativos de macOS también pueden enviar eventos autenticados `node.presence.activity`
con un tiempo de inactividad de entrada acotado. El Gateway obtiene las marcas de tiempo de actividad
según su propio reloj, expone el Mac conectado con la actividad más reciente mediante `node.list` y
`node.describe`, y transmite actualizaciones de `node.presence` a los clientes con ámbito de lectura.
Consulte [Presencia del equipo activo](/nodes/presence) para conocer el comportamiento de selección, privacidad, contexto
del modelo y enrutamiento de notificaciones.

### Evento de actividad en segundo plano del nodo

Los nodos llaman a `node.event` con `event: "node.presence.alive"` para registrar que un
nodo emparejado estuvo activo durante una activación en segundo plano, sin marcarlo como conectado:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"iPhone de Peter\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` es una enumeración cerrada: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Los valores desconocidos se normalizan a
`background` (`src/shared/node-presence.ts`). El evento solo se conserva para
sesiones autenticadas de dispositivos de nodo; las sesiones sin dispositivo o no emparejadas devuelven
`handled: false`.

Los gateways que procesan correctamente la solicitud devuelven un resultado estructurado:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Los gateways más antiguos pueden devolver solo `{ "ok": true }` para `node.event`; esto debe tratarse
como una RPC confirmada, no como persistencia duradera de la presencia.

## Delimitación del ámbito de los eventos de transmisión

Los eventos de transmisión enviados por el servidor están restringidos por ámbito para que las sesiones
con ámbito de emparejamiento o exclusivas del nodo no reciban pasivamente contenido de la sesión
(`src/gateway/server-broadcast.ts`):

- Las tramas de chat, agente y resultados de herramientas (eventos `agent` transmitidos, eventos de
  resultados de herramientas) requieren al menos `operator.read`. Las sesiones que no lo tienen omiten
  por completo estas tramas.
- Las transmisiones `plugin.*` definidas por plugins están restringidas de forma predeterminada a
  `operator.write` u `operator.admin`; las entradas explícitas como
  `plugin.approval.requested` / `plugin.approval.resolved` usan
  `operator.approvals` en su lugar.
- Los eventos de estado/transporte (`heartbeat`, `presence`, `tick`, ciclo de vida de
  conexión/desconexión) permanecen sin restricciones para que todas las sesiones autenticadas puedan
  observar el estado del transporte.
- Las familias desconocidas de eventos de transmisión están restringidas por ámbito de forma predeterminada
  (fallo cerrado), salvo que un controlador registrado las flexibilice explícitamente.

Cada conexión de cliente mantiene su propio número de secuencia por cliente, por lo que las transmisiones
conservan un orden monótonamente creciente en ese socket, incluso cuando distintos clientes ven
subconjuntos diferentes del flujo de eventos filtrados por ámbito.

## Familias de métodos RPC

  `hello-ok.features.methods` es una lista de descubrimiento conservadora creada a partir de
  `src/gateway/server-methods-list.ts` más las exportaciones de métodos de plugins/canales
  cargados; no es un volcado generado de todos los métodos, y algunos métodos (por
  ejemplo, `push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
  se excluyen intencionadamente del descubrimiento, aunque son métodos reales que se
  pueden invocar. Debe considerarse como descubrimiento de funcionalidades, no como una
  enumeración completa de `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Sistema e identidad">
    - `health` devuelve la instantánea de estado del Gateway almacenada en caché o recién comprobada.
    - `diagnostics.stability` devuelve el registro acotado de estabilidad de diagnóstico reciente: nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de colas/sesiones, nombres de canales/plugins e identificadores de sesión. No incluye texto de chats, cuerpos de webhooks, salidas de herramientas, cuerpos sin procesar de solicitudes/respuestas, tokens, cookies ni secretos. Requiere `operator.read`.
    - `status` devuelve el resumen del Gateway similar a `/status`; los campos confidenciales solo se incluyen para clientes operadores con ámbito de administrador.
    - `gateway.identity.get` devuelve la identidad del dispositivo Gateway utilizada por los flujos de retransmisión y emparejamiento.
    - `system-presence` devuelve la instantánea de presencia actual de los dispositivos de operador/Node conectados.
    - `system-event` añade un evento del sistema y puede actualizar o difundir el contexto de presencia.
    - `last-heartbeat` devuelve el evento de Heartbeat persistido más reciente.
    - `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el Gateway.
    - `gateway.suspend.prepare` crea un breve arrendamiento de suspensión cooperativa solo cuando el trabajo supervisado del Gateway está inactivo. `gateway.suspend.status` comprueba ese arrendamiento y `gateway.suspend.resume` lo libera después de la reanudación o de una operación de host cancelada.

  </Accordion>

  <Accordion title="Modelos y uso">
    - `models.list` devuelve el catálogo de modelos permitidos durante la ejecución. Consulte «Vistas de `models.list`» más abajo.
    - `usage.status` devuelve resúmenes de las ventanas de uso y de la cuota restante del proveedor.
    - `usage.cost` devuelve resúmenes agregados del uso de costes para un intervalo de fechas. Pase `agentId` para un agente o `agentScope: "all"` para agregar los agentes configurados.
    - `doctor.memory.status` devuelve la disponibilidad de la memoria vectorial y de las incrustaciones almacenadas en caché para el espacio de trabajo activo del agente predeterminado. Pase `{ "probe": true }` o `{ "deep": true }` solo para realizar explícitamente una comprobación en vivo del proveedor de incrustaciones. Pase `{ "agentId": "agent-id" }` para limitar las estadísticas del almacén de Dreaming al espacio de trabajo de un agente; si se omite, se agregan los espacios de trabajo de Dreaming configurados.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` y `doctor.memory.dedupeDreamDiary` aceptan el valor opcional `{ "agentId": "agent-id" }`; si se omite, operan sobre el espacio de trabajo configurado del agente predeterminado.
    - `doctor.memory.remHarness` devuelve una vista previa acotada y de solo lectura del entorno REM para clientes remotos del plano de control, incluidas las rutas de los espacios de trabajo, fragmentos de memoria, Markdown fundamentado renderizado y candidatos para la promoción profunda. Requiere `operator.read`.
    - `sessions.usage` devuelve resúmenes de uso por sesión. Pase `agentId` para un agente o `agentScope: "all"` para enumerar conjuntamente los agentes configurados.
      Ambos métodos de uso aceptan `mode: "specific"` con un valor IANA de `timeZone` para obtener límites y segmentos de días naturales que tengan en cuenta el horario de verano. `utcOffset` sigue siendo compatible con clientes antiguos y se usa como alternativa cuando el entorno de ejecución del Gateway no reconoce la zona solicitada.
    - `sessions.usage.timeseries` devuelve el uso en forma de serie temporal para una sesión.
    - `sessions.usage.logs` devuelve las entradas del registro de uso de una sesión.

  </Accordion>

  <Accordion title="Canales y asistentes de inicio de sesión">
    - `channels.status` devuelve resúmenes del estado de los canales/plugins integrados y empaquetados.
    - `channels.logout` cierra la sesión de un canal o una cuenta específicos cuando el canal lo admite.
    - `web.login.start` inicia un flujo de inicio de sesión mediante QR/web para el proveedor actual de canales web compatible con QR.
    - `web.login.wait` espera a que ese flujo finalice e inicia el canal si se completa correctamente.
    - `push.test` envía una notificación push de prueba mediante APNs a un Node iOS registrado.
    - `voicewake.get` devuelve los activadores de palabras de activación almacenados.
    - `voicewake.set` actualiza los activadores de palabras de activación y difunde el cambio.

  </Accordion>

  <Accordion title="Gestión de plugins">
    - `plugins.list` (`operator.read`) devuelve el inventario de plugins instalados, además de una selección local de opciones oficiales, diagnósticos e información sobre si el modo de instalación actual permite modificaciones.
    - `plugins.search` (`operator.read`) busca familias instalables de plugins de código y plugins de paquete de ClawHub. Pase un valor `query` no vacío y un valor `limit` opcional de 1 a 100.
    - `plugins.install` (`operator.admin`) instala una entrada del catálogo oficial con `{ source: "official", pluginId }` o un paquete de ClawHub con `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. Las instalaciones de ClawHub conservan las comprobaciones de confianza del Gateway, integridad y política de instalación. Las instalaciones correctas requieren reiniciar el Gateway.
    - `plugins.setEnabled` (`operator.admin`) cambia la política de habilitación de un plugin instalado mediante `{ pluginId, enabled }`. La respuesta incluye la entrada actualizada del catálogo, los metadatos de reinicio y cualquier advertencia sobre la selección de ranuras.
    - `plugins.uninstall` (`operator.admin`) elimina un plugin instalado externamente mediante `{ pluginId }`: las referencias de configuración, el registro de instalación y los archivos administrados. Los plugins incluidos no se pueden desinstalar, solo deshabilitar. La respuesta enumera las acciones de eliminación y siempre requiere reiniciar el Gateway.

  </Accordion>

  <Accordion title="Mensajería y registros">
    - `send` es el RPC de entrega saliente directa para envíos dirigidos a un canal, una cuenta o un hilo fuera del ejecutor de chat.
    - `logs.tail` devuelve la parte final configurada del registro de archivo del Gateway, con controles de cursor, límite y número máximo de bytes.

  </Accordion>

  <Accordion title="Terminal del operador">
    - `terminal.open` inicia una PTY del host para un `agentId` explícito o para el agente predeterminado y devuelve el agente resuelto, el directorio de trabajo, el shell y el estado de confinamiento.
    - `terminal.input`, `terminal.resize` y `terminal.close` operan únicamente en sesiones propiedad de la conexión que realiza la llamada.
    - Los eventos `terminal.data` y `terminal.exit` se transmiten únicamente a la conexión propietaria de la sesión.
    - Las sesiones cuya conexión se interrumpe se desvinculan, pero no se terminan: pueden volver a vincularse durante `gateway.terminal.detachedSessionTimeoutSeconds` (valor predeterminado: 300; `0` restablece la terminación al desconectarse), mientras la salida reciente se acumula en un búfer acotado del lado del servidor.
    - `terminal.list` devuelve las sesiones que pueden vincularse; `terminal.attach` vuelve a vincular una sesión activa o desvinculada a la conexión que realiza la llamada y devuelve el búfer de reproducción (toma de control al estilo de tmux: un propietario activo anterior recibe `terminal.exit` con el motivo `detached`); `terminal.text` lee el búfer como texto sin formato sin vincularse.
    - Cada método de terminal requiere `operator.admin`; `gateway.terminal.enabled` debe establecerse explícitamente en true. Se rechazan los agentes completamente aislados y un cambio en la política del agente cierra las PTY existentes y en curso, incluidas las desvinculadas.

  </Accordion>

  <Accordion title="Conversación y TTS">
    - `talk.catalog` devuelve el catálogo de proveedores de Conversación de solo lectura para voz, transcripción en streaming y voz en tiempo real: ids canónicos de proveedores, alias del registro, etiquetas, estado de configuración, un resultado `ready` opcional a nivel de grupo, ids de modelos/voces expuestos, modos canónicos, transportes, estrategias del cerebro e indicadores de audio/capacidades en tiempo real, sin devolver secretos de proveedores ni modificar la configuración global. Los gateways actuales establecen `ready` después de aplicar la selección de proveedores en tiempo de ejecución; su ausencia debe considerarse como no verificada en gateways anteriores.
    - `talk.config` devuelve la carga útil de configuración efectiva de Conversación; `includeSecrets` requiere `operator.talk.secrets` (u `operator.admin`).
    - `talk.session.create` crea una sesión de Conversación controlada por el gateway para `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. Para `stt-tts/managed-room`, los llamadores con `operator.write` que proporcionen `sessionKey` también deben proporcionar `spawnedBy` para que la visibilidad de la clave de sesión quede delimitada; la creación de `sessionKey` sin delimitar y `brain: "direct-tools"` requieren `operator.admin`.
    - `talk.session.join` valida un token de sesión de sala administrada, emite `session.ready` o `session.replaced` según sea necesario y devuelve metadatos de sala/sesión junto con eventos recientes de Conversación, pero nunca el token en texto sin formato ni su hash.
    - `talk.session.appendAudio` añade audio de entrada PCM en base64 a sesiones de retransmisión en tiempo real y transcripción controladas por el gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` y `talk.session.cancelTurn` controlan el ciclo de vida de los turnos de una sala administrada, con rechazo de turnos obsoletos antes de borrar el estado.
    - `talk.session.cancelOutput` detiene la salida de audio del asistente, principalmente para interrupciones controladas por VAD en sesiones de retransmisión del gateway.
    - `talk.session.submitToolResult` completa una llamada a herramienta del proveedor emitida por una sesión de retransmisión en tiempo real controlada por el gateway. La solicitud espera cualquier señal de finalización asíncrona expuesta por el puente del proveedor; los envíos fallidos mantienen activa la ejecución vinculada y no emiten un evento de resultado de herramienta satisfactorio. Proporcione `options: { willContinue: true }` para una salida provisional de la herramienta u `options: { suppressResponse: true }` cuando el puente del proveedor anuncie compatibilidad con la supresión y el resultado no deba iniciar otra respuesta.
    - `talk.session.steer` envía control de voz de una ejecución activa a una sesión de Conversación respaldada por un agente y controlada por el gateway: `{ sessionId, text, mode? }`, donde `mode` es `status`, `steer`, `cancel` o `followup`; si se omite el modo, se clasifica a partir del texto hablado.
    - `talk.session.close` cierra una sesión de retransmisión, transcripción o sala administrada controlada por el gateway y emite eventos terminales de Conversación.
    - `talk.mode` establece/difunde el estado actual del modo de Conversación para clientes de WebChat/Control UI.
    - `talk.client.create` crea una sesión de proveedor en tiempo real controlada por el cliente mediante `webrtc` o `provider-websocket`, mientras el gateway controla la configuración, las credenciales, las instrucciones y la política de herramientas.
    - `talk.client.toolCall` permite que los transportes en tiempo real controlados por el cliente reenvíen las llamadas a herramientas del proveedor a la política del gateway. La primera herramienta compatible es `openclaw_agent_consult`; los clientes reciben un id de ejecución y esperan los eventos normales del ciclo de vida del chat antes de enviar el resultado de herramienta específico del proveedor.
    - `talk.client.steer` envía control de voz de una ejecución activa para transportes en tiempo real controlados por el cliente. El gateway resuelve la ejecución integrada activa a partir de `sessionKey` y devuelve un resultado estructurado de aceptación/rechazo en lugar de descartar silenciosamente el control.
    - `talk.event` es el canal único de eventos de Conversación para adaptadores en tiempo real, transcripción, STT/TTS, salas administradas, telefonía y reuniones.
    - `talk.speak` sintetiza voz mediante el proveedor de voz de Conversación activo.
    - `tts.status` devuelve el estado de activación de TTS, el proveedor activo, los proveedores alternativos y el estado de configuración del proveedor.
    - `tts.providers` devuelve el inventario visible de proveedores de TTS.
    - `tts.enable` y `tts.disable` alternan el estado de las preferencias de TTS.
    - `tts.setProvider` actualiza el proveedor de TTS preferido.
    - `tts.convert` ejecuta una conversión puntual de texto a voz.
    - `tts.speak` (`operator.write`) renderiza `text` no vacío con la cadena configurada de proveedores generales de TTS y devuelve un clip completo en línea como `audioBase64`, además de `provider` y metadatos opcionales `outputFormat`, `mimeType` y `fileExtension`. A diferencia de `tts.convert`, no devuelve una ruta local del Gateway; a diferencia de `talk.speak`, no requiere un proveedor de Conversación. El texto que supera `messages.tts.maxTextLength` devuelve `INVALID_REQUEST`; los errores de síntesis devuelven `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Secretos, configuración, actualización y asistente">
    - `secrets.reload` vuelve a resolver las SecretRefs activas y sustituye el estado de secretos en tiempo de ejecución solo si todo se completa correctamente.
    - `secrets.resolve` resuelve asignaciones de secretos destinadas a comandos para un conjunto específico de comandos/destinos.
    - `config.get` devuelve la instantánea y el hash actuales de la configuración.
    - `config.set` escribe una carga útil de configuración validada.
    - `config.patch` combina una actualización parcial de la configuración. La sustitución destructiva de matrices requiere que la ruta afectada figure en `replacePaths`; las matrices anidadas bajo entradas de matrices usan rutas `[]` como `agents.list[].skills`.
    - `config.apply` valida y sustituye la carga útil completa de configuración.
    - `config.schema` devuelve la carga útil del esquema de configuración activo que utilizan Control UI y las herramientas de CLI: esquema, `uiHints`, versión, metadatos de generación y metadatos de esquemas de plugins y canales cuando pueden cargarse. Incluye metadatos `title` / `description` procedentes de las mismas etiquetas/textos de ayuda que la interfaz de usuario, incluidas las ramas de composición de objetos anidados, comodines, elementos de matriz y `anyOf` / `oneOf` / `allOf` cuando existe documentación de campos coincidente.
    - `config.schema.lookup` devuelve una carga útil de consulta delimitada a una ruta para una ruta de configuración: ruta normalizada, un nodo de esquema superficial, indicación coincidente + `hintPath`, `reloadKind` opcional y resúmenes de elementos secundarios inmediatos para la exploración detallada en la interfaz de usuario/CLI. `reloadKind` es uno de `restart`, `hot` o `none` (`src/config/schema.ts`) y refleja el planificador de recarga de configuración del gateway para la ruta solicitada. Los nodos del esquema de consulta conservan la documentación orientada al usuario y los campos de validación comunes (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos/de cadenas/de matrices/de objetos, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de elementos secundarios exponen `key`, la `path` normalizada, `type`, `required`, `hasChildren`, `reloadKind` opcional, además de `hint` / `hintPath` coincidentes.
    - `update.run` ejecuta el flujo de actualización del gateway y programa un reinicio solo si la actualización se completa correctamente; los llamadores con una sesión pueden incluir `continuationMessage` para que el inicio reanude un turno de seguimiento del agente mediante la cola de continuación tras reinicios. Las actualizaciones mediante el gestor de paquetes y las actualizaciones supervisadas de una copia de trabajo de Git desde el plano de control usan una transferencia a un servicio administrado desacoplado, en lugar de sustituir el árbol de paquetes o modificar la copia de trabajo/salida de compilación dentro del gateway activo. Una transferencia iniciada devuelve `ok: true` con `result.reason: "managed-service-handoff-started"` y `handoff.status: "started"`; las transferencias no disponibles o fallidas devuelven `ok: false` con `managed-service-handoff-unavailable` o `managed-service-handoff-failed`, además de `handoff.command` cuando se requiere una actualización manual desde el shell. No disponible significa que OpenClaw carece de un límite seguro de supervisión o de una identidad de servicio duradera, como `OPENCLAW_SYSTEMD_UNIT` para systemd. Durante una transferencia iniciada, el indicador de reinicio puede informar brevemente `stats.reason: "restart-health-pending"`; la continuación se retrasa hasta que la CLI verifica el gateway reiniciado y escribe el indicador `ok` final.
    - `update.status` actualiza y devuelve el indicador más reciente de reinicio por actualización, incluida la versión en ejecución posterior al reinicio cuando está disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de incorporación mediante RPC de WS.

  </Accordion>

  <Accordion title="Ayudantes de agentes y espacios de trabajo">
    - `agents.list` devuelve las entradas de agentes configuradas, incluidos el modelo efectivo y los metadatos de tiempo de ejecución.
    - `agents.create`, `agents.update` y `agents.delete` administran los registros de agentes y la conexión con los espacios de trabajo.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` administran los archivos de arranque del espacio de trabajo expuestos para un agente.
    - `audit.activity.list` devuelve el registro de actividad versionado que solo contiene metadatos; `audit.list` continúa siendo el RPC de ejecuciones/herramientas seguro para la compatibilidad.
    - `agents.workspace.list` y `agents.workspace.get` (`operator.read`) exponen una exploración paginada y de solo lectura del directorio del espacio de trabajo de un agente para clientes del dominio de operadores de confianza descrito en [Ámbitos del operador](/es/gateway/operator-scopes). Las solicitudes solo aceptan rutas relativas al espacio de trabajo; las lecturas permanecen restringidas a la raíz real del espacio de trabajo (se rechazan escapes mediante enlaces simbólicos y enlaces físicos), tienen un límite de tamaño y se limitan a texto UTF-8 y tipos de imagen comunes (base64). Las respuestas no exponen la ruta del espacio de trabajo del host. No hay operaciones de escritura en este espacio de nombres.
    - `tasks.list`, `tasks.get` y `tasks.cancel` exponen el registro de tareas del gateway a clientes del SDK y operadores. Consulte [RPC del registro de tareas](#task-ledger-rpcs) más adelante.
    - `artifacts.list`, `artifacts.get` y `artifacts.download` exponen resúmenes y descargas de artefactos derivados de transcripciones para un ámbito explícito `sessionKey`, `runId` o `taskId`. Las consultas de ejecuciones y tareas resuelven la sesión propietaria en el servidor y solo devuelven medios de transcripciones con procedencia coincidente; las fuentes URL no seguras o locales devuelven descargas no compatibles en lugar de obtenerlas en el servidor.
    - `environments.list` y `environments.status` conservan la detección de entornos locales del gateway y de Node. Los trabajadores en la nube configurados y los registros duraderos dejados por perfiles anteriores añaden metadatos `worker` con `providerId`, `leaseId` opcional, `state`, `ageMs`, `idleMs` opcional y `attachedSessionIds`. Los estados del ciclo de vida del trabajador son `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` y `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) aprovisiona un trabajador a partir de un perfil de proveedor de plugin configurado; los reintentos con la misma clave reutilizan la operación duradera. `environments.destroy` (`{ environmentId }`) solicita la eliminación idempotente de un entorno de trabajador duradero. Ambos requieren `operator.admin`, son escrituras del plano de control y devuelven la misma estructura de resumen del entorno utilizada por las respuestas de estado.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o una sesión.
    - `agent.wait` espera a que finalice una ejecución y devuelve la instantánea terminal cuando está disponible.

  </Accordion>

  <Accordion title="Control de sesiones">
    - `sessions.list` devuelve el índice de sesiones actual, incluidos los metadatos `agentRuntime` de cada fila cuando hay configurado un backend de entorno de ejecución de agente.
    - `sessions.subscribe` y `sessions.unsubscribe` activan o desactivan las suscripciones a eventos de cambios de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` activan o desactivan las suscripciones a eventos de transcripción/mensajes para una sesión. Pase `includeApprovals: true` para recibir también eventos de ciclo de vida `session.approval` saneados correspondientes a aprobaciones cuya audiencia persistida incluya esa sesión exacta y cuya vinculación de revisor autorice al cliente suscriptor. La respuesta de suscripción incluye entonces una `approvalReplay` pendiente y acotada; es autoritativa cuando `truncated` es false. La habilitación es por llamada de suscripción y no es persistente: volver a suscribirse a la misma sesión sin `includeApprovals: true` elimina una suscripción de aprobación existente. Además de la autoridad normal de lectura de sesiones, esta habilitación requiere `operator.admin` o `operator.approvals` en un dispositivo emparejado.
    - `sessions.preview` devuelve vistas previas acotadas de transcripciones para claves de sesión específicas.
    - `sessions.describe` devuelve una fila de sesión del Gateway para una clave de sesión exacta.
    - `sessions.resolve` resuelve o canoniza un destino de sesión.
    - `sessions.create` crea una nueva entrada de sesión. `worktree: true` aprovisiona un árbol de trabajo administrado; los valores opcionales `worktreeBaseRef`/`worktreeName` seleccionan la referencia base y el nombre de la rama, y `execNode` (`operator.admin`) vincula la ejecución de la sesión a un host de Node. El árbol de trabajo creado se devuelve en el resultado y se conserva en la fila de sesión (`worktree: { id, branch, repoRoot }`). Cuando se crea la entrada, pero se rechaza su llamada inicial anidada a `chat.send`, el resultado satisfactorio incluye `runStarted: false` y `runError`; los clientes pueden conservar la solicitud y reintentar con la clave de sesión devuelta.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` y `sessions.groups.delete` administran el catálogo de grupos de sesiones personalizados propiedad del Gateway (nombres + orden de visualización). La pertenencia permanece en el campo `category` de cada sesión; el cambio de nombre y la eliminación actualizan las sesiones miembro en el servidor.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrupción y redirección para una sesión activa.
    - `sessions.abort` cancela el trabajo activo de una sesión. Pase `key` más el valor opcional `runId`, o solo `runId` para ejecuciones activas que el Gateway pueda resolver a una sesión.
    - `sessions.patch` actualiza los metadatos/anulaciones de la sesión e informa del modelo canónico resuelto más el `agentRuntime` efectivo.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan tareas de mantenimiento de la sesión.
    - `sessions.get` devuelve la fila de sesión almacenada completa.
    - La ejecución del chat sigue utilizando `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` se normaliza para su visualización en clientes de interfaz de usuario: las etiquetas de directivas en línea se eliminan del texto visible; se eliminan las cargas XML de llamadas a herramientas en texto sin formato (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y los bloques truncados de llamadas a herramientas), así como los tokens de control del modelo filtrados en ASCII o de ancho completo; se omiten las filas del asistente compuestas exclusivamente por tokens de silencio (`NO_REPLY` / `no_reply` exactos), y las filas sobredimensionadas pueden sustituirse por marcadores de posición.
    - `chat.message.get` es el lector completo, aditivo y acotado de un mensaje para una única entrada visible de la transcripción. Pase `sessionKey`, el valor opcional `agentId` cuando la selección de sesión esté limitada al agente y un `messageId` de transcripción mostrado anteriormente mediante `chat.history`; el Gateway devuelve la misma proyección normalizada para visualización, sin el límite de truncamiento del historial ligero, cuando la entrada almacenada todavía está disponible y no es sobredimensionada.
    - `chat.toolTitles` devuelve títulos breves sobre la finalidad de las llamadas a herramientas representadas en la interfaz de control (por lotes, con un máximo de 24 elementos y entradas acotadas). La función debe habilitarse explícitamente mediante `gateway.controlUi.toolTitles` (desactivada de forma predeterminada); los Gateway deshabilitados responden `{ titles: {}, disabled: true }` sin llamar al modelo para que los clientes dejen de solicitarla. Cuando está habilitada, los títulos utilizan el enrutamiento estándar del modelo de utilidad: un `utilityModel` configurado explícitamente (una decisión del operador que, como todas las tareas de utilidad, puede enviar contenido acotado de la tarea al proveedor elegido) o, en su defecto, el modelo pequeño predeterminado declarado por el proveedor de la sesión, para que no aparezca implícitamente ningún destino de salida nuevo; un `utilityModel` vacío los deshabilita por completo. Los títulos nunca recurren al modelo principal. Los resultados se almacenan en caché en la base de datos de estado por agente, con una clave formada por el nombre de la herramienta + la entrada, por lo que las visualizaciones repetidas nunca vuelven a facturar las mismas llamadas.
    - `chat.send` acepta `fastMode: "auto"` para un solo turno a fin de usar el modo rápido en las llamadas al modelo iniciadas antes del límite automático y, posteriormente, iniciar sin modo rápido las llamadas de reintento, respaldo, resultado de herramienta o continuación. El límite predeterminado es de 60 segundos (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) y puede configurarse por modelo mediante `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un emisor de `chat.send` puede pasar `fastAutoOnSeconds` para un solo turno a fin de anular el límite de esa solicitud.

  </Accordion>

  <Accordion title="Emparejamiento de dispositivos y tokens de dispositivo">
    - `device.pair.list` devuelve los dispositivos emparejados pendientes y aprobados.
    - `device.pair.setupCode` crea un código de configuración móvil y, de forma predeterminada, una URL de datos de un código QR PNG. Requiere `operator.admin` y se omite intencionadamente del descubrimiento anunciado. El resultado incluye `setupCode`, el valor opcional `qrDataUrl`, `gatewayUrl`, la etiqueta no secreta `auth` y `urlSource`.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` administran los registros de emparejamiento de dispositivos.
    - `device.pair.rename` asigna una etiqueta del operador (`{ deviceId, label }`) que tiene preferencia sobre el nombre para mostrar informado por el cliente y persiste tras reparar o volver a aprobar el dispositivo.
    - `device.token.rotate` rota un token de dispositivo emparejado dentro de los límites de su rol aprobado y del ámbito del emisor.
    - `device.token.revoke` revoca un token de dispositivo emparejado dentro de los límites de su rol aprobado y del ámbito del emisor.

    El código de configuración incorpora una credencial de arranque de corta duración. Los clientes no deben
    registrarla ni conservarla después del flujo de emparejamiento.

  </Accordion>

  <Accordion title="Emparejamiento e invocación de Node, y trabajo pendiente">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` y `node.pair.remove` abarcan las aprobaciones de capacidades de Node. `node.pair.request` y `node.pair.verify` se eliminaron en 2026.7 junto con el almacén independiente de emparejamiento de Node; el Gateway crea las solicitudes pendientes durante las conexiones de Node.
    - `node.list` y `node.describe` devuelven el estado conocido/conectado de Node.
    - `node.rename` actualiza la etiqueta de un Node emparejado.
    - `node.invoke` reenvía un comando a un Node conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud de invocación.
    - `mcp.tools.call.v1` es el comando sin interfaz del host de Node para llamar a una herramienta MCP local de Node configurada. Se transmite mediante `node.invoke`, requiere que el Node declare el comando y sigue sujeto a la aprobación de emparejamiento y a `gateway.nodes.denyCommands`.
    - `node.event` transporta eventos originados en Node de vuelta al Gateway.
    - `node.pluginTools.update` es la única vía de publicación para sustituir los descriptores de herramientas de Plugin/MCP visibles para el agente del Node conectado; los parámetros de `connect` no los incluyen.
    - `node.pending.pull` y `node.pending.ack` son las API de cola del Node conectado.
    - `node.pending.enqueue` y `node.pending.drain` administran el trabajo pendiente duradero para Nodes sin conexión/desconectados.

  </Accordion>

  <Accordion title="Familias de aprobaciones">
    - `approval.get` y `approval.resolve` son los métodos de aprobación duraderos independientes del tipo (ámbito `operator.approvals`). `approval.get` devuelve una proyección saneada pendiente o terminal conservada con un `urlPath` estable; `approval.resolve` acepta el id. canónico de la aprobación, un `kind` explícito y una decisión, aplica una resolución en la que prevalece la primera respuesta y siempre devuelve el resultado canónico registrado.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` abarcan las solicitudes de aprobación de ejecución de un solo uso, además de la consulta/reproducción de aprobaciones pendientes. Son adaptadores del límite del protocolo sobre el mismo registro duradero de aprobaciones.
    - `exec.approval.waitDecision` espera una aprobación de ejecución pendiente y devuelve la decisión final (o `null` si se agota el tiempo de espera).
    - `exec.approvals.get` y `exec.approvals.set` administran instantáneas de la política de aprobación de ejecución del Gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` administran la política de aprobación de ejecución local de Node mediante comandos de retransmisión de Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` abarcan los flujos de aprobación definidos por el Plugin.

  </Accordion>

  <Accordion title="Automatización, Skills y herramientas">
    - Automatización: `wake` programa la inyección inmediata o en el siguiente Heartbeat de un texto de activación; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run` y `cron.runs` administran el trabajo programado.
    - `cron.run` sigue siendo una RPC de tipo encolado para ejecuciones manuales. Los clientes que necesiten semántica de finalización deben leer el `runId` devuelto y consultar periódicamente `cron.runs`.
    - `cron.runs` acepta un filtro `runId` opcional y no vacío para que los clientes puedan seguir una ejecución manual encolada sin competir con otras entradas del historial del mismo trabajo.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Consulte [Métodos auxiliares del operador](#operator-helper-methods) más adelante.

  </Accordion>
</AccordionGroup>

### Familias de eventos comunes

- `chat`: actualizaciones del chat de la interfaz de usuario, como `chat.inject`, y otros eventos de chat exclusivos de la transcripción. En la versión 4 del protocolo, las cargas diferenciales incluyen `deltaText`; `message` sigue siendo
  la instantánea acumulativa del asistente. Las sustituciones que no son prefijos establecen
  `replace=true` y utilizan `deltaText` como texto de sustitución.
- `session.message`, `session.operation`, `session.tool`: actualizaciones de la transcripción, de las operaciones de sesión
  en curso y del flujo de eventos para una sesión suscrita.
- `session.approval`: estado fiable y saneado de las aprobaciones pendientes y terminales para un
  suscriptor de una sesión exacta que haya habilitado explícitamente la opción. Las aprobaciones secundarias utilizan la
  audiencia antecesora persistida; los eventos nunca modifican las transcripciones ni activan agentes.
- `sessions.changed`: cambió el índice o los metadatos de la sesión.
- `presence`: actualizaciones de la instantánea de presencia del sistema.
- `tick`: evento periódico de mantenimiento de conexión/actividad.
- `health`: actualización de la instantánea de estado del Gateway.
- `heartbeat`: actualización del flujo de eventos de Heartbeat.
- `cron`: evento de cambio de ejecución/trabajo de Cron.
- `shutdown`: notificación de cierre del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida del emparejamiento de Node.
- `node.invoke.request`: difusión de una solicitud de invocación de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida del dispositivo emparejado.
- `voicewake.changed`: cambió la configuración del activador por palabra de activación.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de la
  aprobación de ejecución.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de la
  aprobación de Plugin.

### Métodos auxiliares de Node

Los Nodes pueden llamar a `skills.bins` para obtener la lista actual de ejecutables de Skills
para las comprobaciones de permiso automático.

## RPC del registro de auditoría

`audit.activity.list` proporciona a los clientes del operador una vista estable, de más reciente a más antigua, de los metadatos del ciclo de vida de las ejecuciones de agentes,
las acciones de herramientas y los mensajes habilitados explícitamente. Requiere
`operator.read`. Las consultas excluyen los registros con más de 30 días de antigüedad y el registro
SQLite compartido tiene un límite de 100,000 registros. Las filas caducadas se eliminan durante
el inicio del Gateway, el mantenimiento cada hora y las escrituras posteriores. Consulte
[Historial de auditoría](/gateway/audit) para conocer el modelo de datos y la semántica de privacidad.

- Parámetros: `agentId`, `sessionKey` o `runId` exactos opcionales; `kind`
  opcional (`"agent_run"`, `"tool_action"` o `"message"`); `status` opcional
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` o `"unknown"`); `direction` opcional del mensaje (`"inbound"` o
  `"outbound"`) y `channel` exacto; límites inclusivos opcionales `after` /
  `before` en milisegundos Unix; `limit` opcional de `1` a `500`; y `cursor`
  de cadena opcional de la página anterior.
- Resultado: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

La unión de resultados V1 con nombre tiene esquemas separados para ejecuciones
de agentes, acciones de herramientas, mensajes entrantes y mensajes salientes.
El discriminador `eventType` es, respectivamente, `agent_run`, `tool_action`,
`inbound_message` u `outbound_message`; `kind` y `direction` del mensaje siguen
disponibles para el filtrado y la visualización. Cada evento tiene el entero
`schemaVersion: 1`. Las referencias de identidad de mensajes usan el formato
exacto `hmac-sha256:v1:<32 hex key id>:<64 hex digest>`; el id de actor de un
remitente de canal usa el mismo formato.

Todas las variantes requieren `eventType`, `schemaVersion`, `eventId`,
`sequence`, `sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor`
y `redaction`. Los campos de las variantes son:

| `eventType`        | Campos obligatorios                                               | Campos opcionales                                                                                                               |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, referencias de identidad, `reasonCode`, `errorCode`                            |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, referencias de identidad, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Las enumeraciones cerradas de mensajes son:

- `conversationKind`: `direct`, `group`, `channel` o `unknown`.
- `outcome` entrante: `completed`, `skipped` o `failed`; `reasonCode`
  opcional: `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty` o `acp_dispatch_aborted`.
- `outcome` saliente: `sent`, `suppressed`, `failed` o `unknown`; `reasonCode`
  opcional: `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`
  o `no_visible_payload`. Un adaptador que no devuelve ninguna identidad de la
  plataforma se considera `unknown`, porque no se puede descartar el efecto
  externo.
- `deliveryKind`: `text`, `media` u `other`; `failureStage`:
  `platform_send`, `queue` o `unknown`.

Los campos terminales están correlacionados, no son opcionales de forma
independiente:

| Variante         | Correspondencia terminal                                                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ejecución de agente | `started` no tiene `errorCode`; cada estado finalizado sin éxito requiere su código `run_*` correspondiente.                                                                  |
| Acción de herramienta | `started` y el estado de éxito no tienen `errorCode`; cada uno de los demás estados finalizados requiere su código `tool_*` correspondiente.                                |
| Mensaje entrante | succeeded = `completed`; blocked = `skipped`; failed = `failed` más `message_processing_failed`. Cuando está presente, `reasonCode` debe pertenecer a esa familia terminal.       |
| Mensaje saliente | succeeded = `sent`; blocked = `suppressed` más `reasonCode`; failed = `failed` más `errorCode` y `failureStage`; unknown = `unknown` más `failureStage`.                          |

Cada evento de actividad incluye un id de evento estable, una secuencia
monótona del registro, una secuencia del evento de origen, una marca de tiempo,
un actor, una acción, un estado, el entero `schemaVersion: 1` y
`redaction: "metadata_only"`. Los registros de ejecuciones y herramientas
requieren la procedencia del agente y de la ejecución, y pueden incluir la
procedencia de la sesión. Los registros de mensajes pueden incluir los ids del
agente y de la ejecución, pero intencionalmente nunca incluyen `sessionKey` ni
`sessionId`; por lo tanto, el filtro de consulta `sessionKey` se aplica solo a
las filas de ejecuciones y herramientas. Los eventos de herramientas pueden
incluir el id de llamada a la herramienta y el nombre de la herramienta.

Los registros de mensajes usan `message.inbound.processed` o
`message.outbound.finished` y añaden la dirección, el canal, el tipo de
conversación, el resultado normalizado y, opcionalmente, el tipo de entrega, la
etapa del fallo, la duración, el recuento de resultados, el código del motivo y
seudónimos con clave, locales a la instalación, para
cuenta/conversación/mensaje/destino. Estos seudónimos facilitan la correlación,
pero no constituyen anonimización: la base de datos de estado contiene su
clave, mientras que las exportaciones de RPC y CLI no. El registro no almacena
prompts, cuerpos de mensajes, argumentos de herramientas, resultados de
herramientas, salida de comandos ni texto de error sin procesar. Los valores
`sessionKey` de ejecuciones/herramientas siguen siendo metadatos de correlación
sin procesar y pueden incorporar ids de cuentas o interlocutores de la
plataforma; los registros de mensajes omiten las claves de sesión.

Para las filas entrantes, `durationMs` mide desde el despacho del núcleo hasta su estado terminal y
`resultCount` cuenta las cargas útiles finalizadas de herramientas en cola, bloques y respuestas. Para
las filas salientes, `durationMs` abarca desde la asunción de responsabilidad sobre la entrega hasta la confirmación,
la cola de mensajes no entregados o la conciliación (incluido el tiempo de espera en cola), y `resultCount`
cuenta los envíos físicos identificados a la plataforma. `deliveryKind`, cuando está presente,
describe la carga útil efectiva después de los hooks y la renderización; las filas suprimidas o
ambiguas debido a un fallo lo omiten.

La cobertura actual de mensajes incluye los mensajes entrantes aceptados que llegan al
despacho del núcleo, incluidos los resultados de duplicación o terminación del núcleo. La cobertura saliente escribe
una fila terminal por cada carga útil de respuesta lógica original que llega a la entrega
duradera compartida; la fragmentación y la distribución en abanico del adaptador se agregan en `resultCount`. Los envíos
reintentables o ambiguos en cola solo se registran después de la confirmación, la cola de
mensajes no entregados o la conciliación. Las rutas locales del Plugin y de envío directo que omiten esos
límites compartidos todavía no están cubiertas. La cola acotada de trabajadores funciona según el mejor esfuerzo
y puede descartar registros en caso de fallo o saturación, por lo que esta superficie no es un
archivo de cumplimiento sin pérdidas.

El registro está activado de forma predeterminada y se controla mediante
[`audit.enabled`](/es/gateway/configuration-reference#audit). El registro de mensajes se
controla por separado mediante `audit.messages` y su valor predeterminado es `"off"`. Cuando
el registro está desactivado, `audit.activity.list` sigue sirviendo los registros escritos
anteriormente hasta que caduquen.

Los esquemas distribuidos de solicitud y resultado de `audit.list`, así como `AuditEvent`, permanecen
sin cambios y devuelven únicamente registros de ejecuciones de agentes y acciones de herramientas. Los nuevos clientes de
operador deben llamar a `audit.activity.list` cuando el Gateway lo anuncie. Los Gateways
anteriores pueden informar `unknown method: audit.activity.list` o, dado que
la autorización precedía a la búsqueda del método en las versiones distribuidas, `missing scope:
operator.admin` ante una solicitud con ámbito de lectura. Esto último debe tratarse como ausencia del método
solo cuando el método no se haya anunciado. A continuación, un cliente puede volver a intentar `audit.list`
solo cuando sus filtros no requieran compatibilidad con el tipo de mensaje, la dirección ni el canal.

Use [`openclaw audit`](/es/cli/audit) para consultas de texto y exportaciones JSON acotadas.

## RPC del registro de tareas

Los clientes de operador inspeccionan y cancelan los registros de tareas en segundo plano del Gateway mediante
los RPC del registro de tareas (`packages/gateway-protocol/src/schema/tasks.ts`). Estos
devuelven resúmenes de tareas saneados, no el estado bruto del entorno de ejecución.

- `tasks.list` requiere `operator.read`.
  - Parámetros: `status` opcional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` o `"timed_out"`) o una matriz de esos estados,
    `agentId` opcional, `sessionKey` opcional, `limit` opcional de `1` a
    `500` y `cursor` de cadena opcional.
  - Resultado: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` requiere `operator.read`.
  - Parámetros: `{ "taskId": string }`.
  - Resultado: `{ "task": TaskSummary }`.
  - Los identificadores de tareas inexistentes devuelven el formato de error de no encontrado del Gateway.
- `tasks.cancel` requiere `operator.write`.
  - Parámetros: `{ "taskId": string, "reason"?: string }`.
  - Resultado: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` indica si el registro contenía una tarea coincidente. `cancelled`
    indica si el entorno de ejecución aceptó o registró la cancelación.

`TaskSummary` incluye `id`, `status` y metadatos opcionales: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, marcas de tiempo, progreso,
resumen terminal y texto de error saneado. `agentId` identifica al agente
que ejecuta la tarea; `sessionKey` y `ownerKey` conservan el contexto del solicitante y de
control.

## Métodos auxiliares del operador

- `commands.list` (`operator.read`) obtiene el inventario de comandos en tiempo de ejecución de
  un agente.
  - `agentId` es opcional; omítalo para leer el espacio de trabajo del agente predeterminado.
  - `scope` controla a qué superficie se dirige el `name` principal: `text` devuelve
    el token principal del comando de texto sin la `/` inicial; `native` y la ruta
    predeterminada `both` devuelven nombres nativos adaptados al proveedor cuando están disponibles.
  - `textAliases` contiene alias exactos con barra, como `/model` y `/m`.
  - `nativeName` contiene el nombre del comando nativo adaptado al proveedor cuando
    existe.
  - `provider` es opcional y solo afecta a la nomenclatura nativa y a la disponibilidad
    de comandos nativos del Plugin.
  - `includeArgs=false` omite de la respuesta los metadatos de argumentos serializados.
- `tools.catalog` (`operator.read`) obtiene el catálogo de herramientas en tiempo de ejecución de un
  agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: Plugin propietario cuando `source="plugin"`
  - `optional`: indica si una herramienta de Plugin es opcional
- `tools.effective` (`operator.read`) obtiene el inventario de herramientas efectivo en tiempo
  de ejecución para una sesión.
  - `sessionKey` es obligatorio.
  - El Gateway deriva el contexto de ejecución de confianza a partir de la sesión en el servidor,
    en lugar de aceptar el contexto de autenticación o entrega proporcionado por el llamador.
  - La respuesta es una proyección derivada por el servidor y limitada a la sesión del inventario
    activo, que incluye herramientas del núcleo, de Plugins, de canales y de servidores MCP
    ya descubiertos.
  - `tools.effective` es de solo lectura para MCP: puede proyectar un catálogo MCP de una sesión
    activa a través de la política final de herramientas, pero no crea entornos de ejecución MCP,
    conecta transportes ni emite `tools/list`. Si no existe un catálogo activo coincidente,
    la respuesta puede incluir un aviso como `mcp-not-yet-connected`,
    `mcp-not-yet-listed` o `mcp-stale-catalog`.
  - Las entradas de herramientas efectivas usan `source="core"`, `source="plugin"`,
    `source="channel"` o `source="mcp"`.
- `tools.invoke` (`operator.write`) invoca una herramienta disponible mediante la
  misma ruta de políticas del Gateway que `/tools/invoke`.
  - `name` es obligatorio. `args`, `sessionKey`, `agentId`, `confirm` e
    `idempotencyKey` son opcionales.
  - Si están presentes tanto `sessionKey` como `agentId`, el agente de la sesión resuelta
    debe coincidir con `agentId`.
  - Los contenedores del núcleo exclusivos del propietario, como `cron`, `gateway` y `nodes`, requieren
    una identidad de propietario/administrador (`operator.admin`), aunque `tools.invoke` en sí
    sea `operator.write`.
  - La respuesta es un contenedor orientado al SDK con `ok`, `toolName`, `output`
    opcional y campos `error` tipados. Los rechazos por aprobación o política devuelven
    `ok:false` en la carga útil, en lugar de eludir la canalización de políticas de herramientas
    del Gateway.
- `skills.status` (`operator.read`) obtiene el inventario visible de Skills de un
  agente.
  - `agentId` es opcional; omítalo para leer el espacio de trabajo del agente predeterminado.
  - La respuesta incluye la idoneidad, los requisitos faltantes, las comprobaciones de configuración
    y las opciones de instalación saneadas sin exponer valores de secretos sin procesar.
- `skills.search` y `skills.detail` (`operator.read`) devuelven metadatos de
  descubrimiento de ClawHub.
- `skills.upload.begin`, `skills.upload.chunk` y `skills.upload.commit`
  (`operator.admin`) preparan un archivo privado de Skills antes de instalarlo. Esta
  es una ruta de carga administrativa independiente para clientes de confianza, no el flujo normal de
  instalación de Skills de ClawHub, y está deshabilitada de forma predeterminada a menos que
  `skills.install.allowUploadedArchives` esté habilitado.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    crea una carga vinculada a ese slug y valor de force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` añade bytes en
    el desplazamiento decodificado exacto.
  - `skills.upload.commit({ uploadId, sha256? })` verifica el tamaño final y
    SHA-256. La confirmación solo finaliza la carga; no instala las Skills.
  - Los archivos de Skills cargados son archivos zip que contienen un `SKILL.md` en la raíz. El
    nombre del directorio interno del archivo nunca selecciona el destino de instalación.
- `skills.install` (`operator.admin`) tiene tres modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una
    carpeta de Skills en el directorio `skills/` del espacio de trabajo del agente predeterminado.
  - Modo de carga: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instala una carga confirmada en el directorio
    `skills/<slug>` del espacio de trabajo del agente predeterminado. El slug y el valor de force deben coincidir con la
    solicitud original de `skills.upload.begin`. Se rechaza a menos que
    `skills.install.allowUploadedArchives` esté habilitado; la configuración no
    afecta a las instalaciones de ClawHub.
  - Modo de instalador del Gateway: `{ name, installId, timeoutMs? }` ejecuta una acción
    `metadata.openclaw.install` declarada en el host del Gateway. Los clientes más antiguos aún pueden
    enviar `dangerouslyForceUnsafeInstall`; este campo está obsoleto, se acepta
    solo por compatibilidad con el protocolo y se ignora. Use
    `security.installPolicy` para las decisiones de instalación controladas por el operador.
- `skills.update` (`operator.admin`) tiene dos modos:
  - El modo ClawHub actualiza un slug registrado o todas las instalaciones de ClawHub registradas en
    el espacio de trabajo del agente predeterminado.
  - El modo de configuración modifica valores de `skills.entries.<skillKey>`, como `enabled`,
    `apiKey` y `env`.

### Vistas de `models.list`

`models.list` acepta un parámetro `view` opcional
(`src/agents/model-catalog-visibility.ts`):

- Omitido o `"default"`: si `agents.defaults.models` está configurado, la
  respuesta es el catálogo permitido, incluidos los modelos descubiertos dinámicamente
  para las entradas `provider/*`. De lo contrario, la respuesta es el catálogo completo del
  Gateway.
- `"configured"`: comportamiento con el tamaño adecuado para un selector. Si `agents.defaults.models` está
  configurado, sigue teniendo prioridad, incluido el descubrimiento limitado al proveedor para las
  entradas `provider/*`. Sin una lista de permitidos, la respuesta usa entradas explícitas de
  `models.providers.<provider>.models` y recurre al catálogo completo
  solo cuando no existen filas de modelos configuradas.
- `"provider-config"`: inventario de `models.providers.*.models` definido por la fuente,
  independiente de las listas de permitidos del selector. Las filas incluyen capacidades públicas del modelo y
  disponibilidad según la ruta, pero omiten los puntos de conexión del proveedor, el material de autenticación y
  la configuración de solicitudes en tiempo de ejecución.
- `"all"`: catálogo completo del Gateway, omitiendo `agents.defaults.models`. Úselo para
  interfaces de diagnóstico/descubrimiento, no para selectores de modelos normales.

## Aprobaciones de ejecución

- Cuando una solicitud de ejecución necesita aprobación, el Gateway difunde
  `exec.approval.requested`.
- Los clientes del operador la resuelven llamando a `exec.approval.resolve` (requiere
  `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan`
  (`argv`/`cwd`/`rawCommand` canónicos y metadatos de la sesión). Las solicitudes sin
  `systemRunPlan` se rechazan.
- Tras la aprobación, las llamadas reenviadas a `node.invoke system.run` reutilizan ese
  `systemRunPlan` canónico como contexto autoritativo del comando/cwd/sesión.
- Si un llamador modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` entre la preparación y el reenvío final aprobado de `system.run`,
  el Gateway rechaza la ejecución en lugar de confiar en la carga útil modificada.

## Alternativa de entrega del agente

- Las solicitudes de `agent` pueden incluir `deliver=true` para solicitar una entrega saliente.
- `bestEffortDeliver=false` (el valor predeterminado) mantiene un comportamiento estricto: los destinos de
  entrega no resueltos o exclusivamente internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite recurrir a la ejecución solo en la sesión cuando no
  se puede resolver ninguna ruta externa de entrega (por ejemplo, sesiones internas/de chat web
  o configuraciones ambiguas con varios canales).
- Los resultados finales de `agent` pueden incluir `result.deliveryStatus` cuando se solicitó
  la entrega, con los mismos estados `sent`, `suppressed`, `partial_failed` y
  `failed` documentados para
  [`openclaw agent --json --deliver`](/es/cli/agent#json-delivery-status).

## Control de versiones

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` y `MIN_PROBE_PROTOCOL_VERSION` se encuentran en
  `packages/gateway-protocol/src/version.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`. Los clientes del operador y de la interfaz de usuario deben
  incluir el protocolo actual en ese intervalo; los clientes y servidores actuales ejecutan
  el protocolo v4.
- Los clientes autenticados con `role: "node"` y `client.mode: "node"`
  pueden usar el protocolo de Node N-1 (actualmente v3). Las sondas ligeras de reinicio usan
  la misma ventana N-1. La autenticación de dispositivos, el emparejamiento, los ámbitos, la política de comandos y las aprobaciones
  de ejecución no cambian debido a esta ventana de compatibilidad. Las capacidades y comandos de Node
  controlados por Plugins se retienen hasta que el Node se actualiza al protocolo actual,
  porque sus superficies alojadas no forman parte del contrato N-1.
- Los esquemas y modelos se generan a partir de definiciones de TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes del cliente

La implementación del cliente de referencia se encuentra en `packages/gateway-client/src/`
(OpenClaw la encapsula mediante la delgada fachada `src/gateway/client.ts`). Estos
valores predeterminados son estables en todo el protocolo v4 y constituyen la base esperada para
clientes de terceros.

| Constante                                 | Valor predeterminado                                  | Origen                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Tiempo de espera de solicitud (por RPC)   | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Tiempo de espera de autenticación previa/desafío de conexión | `15_000` ms                             | `packages/gateway-client/src/timeouts.ts` (la variable de entorno `OPENCLAW_HANDSHAKE_TIMEOUT_MS` puede ampliar el límite combinado de servidor/cliente) |
| Retardo inicial de reconexión             | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`backoffMs`)                                                                     |
| Retardo máximo de reconexión              | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`scheduleReconnect`)                                                             |
| Límite de reintento rápido tras el cierre por token de dispositivo | `250` ms                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Período de gracia para la detención forzada antes de `terminate()` | `250` ms                               | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                      | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Intervalo de tick predeterminado (antes de `hello-ok`) | `30_000` ms                                  | `packages/gateway-client/src/client.ts`                                                                                   |
| Cierre por tiempo de espera del tick      | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

El servidor anuncia los valores efectivos de `policy.tickIntervalMs`,
`policy.maxPayload` y `policy.maxBufferedBytes` en `hello-ok`; los clientes
deben respetar esos valores en lugar de los predeterminados anteriores al protocolo de enlace.

El cliente de referencia permite que las solicitudes finitas controlen su plazo configurado cuando
cada solicitud pendiente tiene uno. Una solicitud `expectFinal` sin un
`timeoutMs` finito, cualquier solicitud con `timeoutMs: null` o una combinación de solicitudes
finitas y sin límite mantiene activo el supervisor de ticks. Si los eventos y las
respuestas entrantes permanecen en silencio más allá del umbral de tiempo de espera del tick, el cliente cierra el
socket con el código `4000`, rechaza todas las solicitudes pendientes y vuelve a conectarse. No
reproduce las solicitudes rechazadas después de reconectarse.

## Autenticación

- La autenticación del Gateway mediante secreto compartido utiliza `connect.params.auth.token` o
  `connect.params.auth.password`, según el
  `gateway.auth.mode` configurado (`"none" | "token" | "password" | "trusted-proxy"`).
- Los modos que incorporan identidad, como Tailscale Serve (`gateway.auth.allowTailscale: true`)
  o `gateway.auth.mode: "trusted-proxy"` fuera del bucle invertido, satisfacen la comprobación de
  autenticación de conexión mediante los encabezados de la solicitud en lugar de `connect.params.auth.*`.
- El `gateway.auth.mode: "none"` de ingreso privado omite por completo la autenticación de conexión
  mediante secreto compartido; no exponga ese modo en un ingreso público o no confiable.
- Tras el emparejamiento, el Gateway emite un token de dispositivo limitado al rol y los
  ámbitos de la conexión, devuelto en `hello-ok.auth.deviceToken`. Los clientes deben
  conservarlo después de cualquier conexión correcta.
- Al volver a conectarse con ese token de dispositivo almacenado, también debe reutilizarse el conjunto de
  ámbitos aprobado y almacenado para dicho token. Esto conserva el acceso de lectura/sondeo/estado
  ya concedido y evita que las reconexiones se reduzcan silenciosamente a un ámbito
  implícito más restringido y exclusivo de administración.
- Ensamblaje de la autenticación de conexión del lado del cliente (`selectConnectAuth` en
  `packages/gateway-client/src/client.ts`):
  - `auth.password` es independiente y siempre se reenvía cuando está establecido.
  - `auth.token` se rellena según este orden de prioridad: primero, el token compartido explícito;
    después, un `deviceToken` explícito; y, por último, un token por dispositivo almacenado (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` solo se envía cuando ninguna de las opciones anteriores resolvió
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La promoción automática de un token de dispositivo almacenado durante el reintento único por
    `AUTH_TOKEN_MISMATCH` se limita únicamente a puntos de conexión confiables: bucle invertido
    o `wss://` con un `tlsFingerprint` fijado. Un `wss://` público sin fijación
    no cumple los requisitos.
- El arranque integrado mediante código de configuración devuelve el
  `hello-ok.auth.deviceToken` del Node principal, además de un token de operador limitado en
  `hello-ok.auth.deviceTokens` para la transferencia móvil confiable. El token de operador
  incluye `operator.talk.secrets` para las lecturas de configuración nativa de Talk, pero
  excluye los ámbitos de modificación del emparejamiento y `operator.admin`.
- Mientras un arranque mediante código de configuración no básico espera aprobación,
  los detalles de `PAIRING_REQUIRED` incluyen `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` y `pauseReconnect: false`. Continúe reconectándose con el
  mismo token de arranque hasta que se apruebe la solicitud o el token deje de ser
  válido.
- Conserve `hello-ok.auth.deviceTokens` únicamente cuando la conexión haya utilizado autenticación de
  arranque en un transporte confiable, como `wss://` o un emparejamiento local/por bucle invertido.
- Si un cliente proporciona un `deviceToken` explícito o `scopes` explícitos, ese
  conjunto de ámbitos solicitado por el invocador sigue siendo el autorizado; los ámbitos almacenados en caché solo
  se reutilizan cuando el cliente reutiliza el token por dispositivo almacenado.
- Los tokens de dispositivo pueden rotarse o revocarse mediante `device.token.rotate` y
  `device.token.revoke` (requiere `operator.pairing`). Rotar o revocar un
  Node u otro rol que no sea de operador también requiere `operator.admin`.
- `device.token.rotate` devuelve metadatos de rotación. Solo devuelve el token portador
  sustituto para llamadas del mismo dispositivo que ya estén autenticadas con ese
  token de dispositivo, de modo que los clientes que solo utilizan tokens puedan conservar el sustituto antes de
  volver a conectarse. Las rotaciones compartidas o administrativas no devuelven el token portador.
- La emisión, rotación y revocación de tokens permanecen limitadas al conjunto de roles
  aprobado y registrado en la entrada de emparejamiento de ese dispositivo; la modificación de tokens no puede ampliar ni
  dirigirse a un rol de dispositivo que la aprobación del emparejamiento nunca haya concedido.
- En las sesiones de tokens de dispositivos emparejados, la administración de dispositivos se limita al propio dispositivo, salvo que
  el invocador también tenga `operator.admin`: quienes no sean administradores solo pueden administrar el
  token de operador de su propia entrada de dispositivo. La administración de tokens de Node y de otros roles
  que no sean de operador es exclusiva de administradores, incluso para el propio dispositivo del invocador.
- `device.token.rotate` y `device.token.revoke` también comparan el conjunto de ámbitos
  del token de operador de destino con los ámbitos de la sesión actual del invocador.
  Los invocadores que no sean administradores no pueden rotar ni revocar un token de operador más amplio que el que
  ya poseen.
- Los errores de autenticación incluyen `error.details.code`, además de indicaciones de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep`: uno de `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes confiables pueden intentar un único reintento limitado con un token por dispositivo
    almacenado en caché.
  - Si ese reintento falla, deben detenerse los ciclos automáticos de reconexión y mostrarse al operador
    instrucciones sobre la acción necesaria.
- `AUTH_SCOPE_MISMATCH` significa que se reconoció el token de dispositivo, pero no
  cubre el rol o los ámbitos solicitados. No lo presente como un token incorrecto; solicite
  al operador que vuelva a emparejar o apruebe el contrato de ámbitos más restringido o más amplio.

## Identidad y emparejamiento de dispositivos

- Los Nodes deben incluir una identidad de dispositivo estable (`device.id`) derivada de la
  huella digital de un par de claves.
- Los Gateways emiten tokens por dispositivo y rol.
- Se requieren aprobaciones de emparejamiento para los nuevos identificadores de dispositivo, salvo que esté habilitada la
  aprobación automática local.
- La aprobación automática del emparejamiento se centra en conexiones locales directas por bucle invertido.
- OpenClaw también dispone de una ruta restringida de autoconexión local del backend/contenedor para
  flujos auxiliares confiables con secreto compartido.
- Las conexiones por tailnet o LAN en el mismo host siguen tratándose como remotas para el emparejamiento
  y requieren aprobación.
- Los clientes WS normalmente incluyen la identidad `device` durante `connect` (operador +
  Node). Las únicas excepciones para operadores sin dispositivo son rutas de confianza explícitas:
  - `gateway.controlUi.allowInsecureAuth=true` para la compatibilidad con HTTP no seguro
    limitada a localhost.
  - autenticación correcta del operador de la interfaz de control mediante `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (medida de emergencia, degradación
    grave de la seguridad).
  - RPC de backend de `gateway-client` por bucle invertido directo en la ruta auxiliar interna
    reservada.
- Omitir la identidad del dispositivo tiene consecuencias para los ámbitos. Cuando se permite una conexión
  de operador sin dispositivo mediante una ruta de confianza explícita, OpenClaw
  sigue borrando los ámbitos declarados por el propio cliente y los deja como un conjunto vacío, salvo que esa ruta tenga una
  excepción designada de conservación de ámbitos. Los métodos sujetos a ámbitos fallan entonces por
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` es una ruta de emergencia de la interfaz de control
  que conserva los ámbitos. No concede ámbitos a clientes WebSocket arbitrarios
  con forma de backend personalizado o CLI.
- La ruta auxiliar de backend reservada de `gateway-client` por bucle invertido directo conserva
  los ámbitos únicamente para RPC internos del plano de control local; los identificadores de backend personalizados no
  reciben esta excepción.
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de autenticación de dispositivos

Para los clientes heredados que aún utilizan el comportamiento de firma anterior al desafío, `connect`
devuelve códigos de detalle `DEVICE_AUTH_*` en `error.details.code` con un
`error.details.reason` estable.

Errores comunes de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                                                |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió vacío).                       |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto o incorrecto.                       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga útil de la firma no coincide con la carga útil v2.                |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido.               |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella digital de la clave pública.         |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falló el formato o la canonicalización de la clave pública.                |

Objetivo de la migración:

- Esperar siempre a `connect.challenge`.
- Firmar la carga útil v2 que incluye el nonce del servidor.
- Enviar el mismo nonce en `connect.params.device.nonce`.
- La carga útil de firma preferida es `v3`
  (`buildDeviceAuthPayloadV3` en `packages/gateway-client/src/device-auth.ts`),
  que vincula `platform` y `deviceFamily`, además de los campos
  de dispositivo/cliente/rol/ámbitos/token/nonce.
- Las firmas `v2` heredadas siguen aceptándose por compatibilidad, pero la fijación
  de metadatos de dispositivos emparejados continúa controlando la política de comandos al reconectarse.

## TLS y fijación

- TLS es compatible con las conexiones WS (configuración `gateway.tls`).
- Los clientes pueden fijar opcionalmente la huella digital del certificado del Gateway mediante
  `gateway.remote.tlsFingerprint` o la opción de la CLI `--tls-fingerprint`.

## Alcance

Este protocolo expone la API completa del Gateway: estado, canales, modelos, chat,
agente, sesiones, nodos, aprobaciones y más. La superficie exacta se define mediante
los esquemas TypeBox reexportados desde `packages/gateway-protocol/src/schema.ts`.

## Relacionado

- [Protocolo de puente](/es/gateway/bridge-protocol)
- [Guía operativa del Gateway](/es/gateway)
