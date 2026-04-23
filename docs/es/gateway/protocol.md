---
read_when:
    - Implementar o actualizar clientes WS de Gateway
    - Depurar incompatibilidades del protocolo o fallos de conexión
    - Regenerar el esquema/modelos del protocolo
summary: 'Protocolo WebSocket de Gateway: handshake, tramas y control de versiones'
title: Protocolo de Gateway
x-i18n:
    generated_at: "2026-04-23T05:15:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d4ea65fbe31962ed8ece04a645cfe5aaff9fee8b5f89bc896b461cd45567634
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocolo de Gateway (WebSocket)

El protocolo WS de Gateway es el **único plano de control + transporte de nodos** para
OpenClaw. Todos los clientes (CLI, UI web, app de macOS, nodos iOS/Android, nodos sin interfaz)
se conectan por WebSocket y declaran su **rol** + **alcance** en el momento del
handshake.

## Transporte

- WebSocket, tramas de texto con cargas JSON.
- La primera trama **debe** ser una solicitud `connect`.
- Las tramas previas a la conexión están limitadas a 64 KiB. Después de un handshake exitoso, los clientes
  deben respetar los límites `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con el diagnóstico habilitado,
  las tramas entrantes sobredimensionadas y los búferes salientes lentos emiten eventos `payload.large`
  antes de que el gateway cierre o descarte la trama afectada. Estos eventos conservan
  tamaños, límites, superficies y códigos de motivo seguros. No conservan el cuerpo del mensaje,
  el contenido de adjuntos, el cuerpo bruto de la trama, tokens, cookies ni valores secretos.

## Handshake (`connect`)

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

`server`, `features`, `snapshot` y `policy` son obligatorios según el esquema
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` es opcional. `auth`
informa el rol/los alcances negociados cuando están disponibles, e incluye `deviceToken`
cuando el gateway emite uno.

Cuando no se emite ningún token de dispositivo, `hello-ok.auth` aún puede informar los
permisos negociados:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

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

Durante la transferencia de bootstrap de confianza, `hello-ok.auth` también puede incluir entradas
de rol adicionales acotadas en `deviceTokens`:

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

Para el flujo integrado de bootstrap node/operator, el token principal del nodo permanece con
`scopes: []` y cualquier token de operador transferido permanece acotado a la lista permitida del operador de bootstrap
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Las comprobaciones de alcance de bootstrap siguen
prefijadas por rol: las entradas de operador solo satisfacen solicitudes de operador, y los roles que no son operador
siguen necesitando alcances bajo su propio prefijo de rol.

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

Alcances comunes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` requiere `operator.talk.secrets`
(o `operator.admin`).

Los métodos RPC de Gateway registrados por plugins pueden solicitar su propio alcance de operador, pero
los prefijos administrativos centrales reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre se resuelven como `operator.admin`.

El alcance del método es solo la primera barrera. Algunos comandos slash alcanzados mediante
`chat.send` aplican comprobaciones a nivel de comando más estrictas además de eso. Por ejemplo, las escrituras
persistentes de `/config set` y `/config unset` requieren `operator.admin`.

`node.pair.approve` también tiene una comprobación adicional de alcance en el momento de la aprobación además del
alcance base del método:

- solicitudes sin comando: `operator.pairing`
- solicitudes con comandos de nodo que no sean exec: `operator.pairing` + `operator.write`
- solicitudes que incluyen `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Los nodos declaran reclamaciones de capacidad en el momento de la conexión:

- `caps`: categorías de capacidad de alto nivel.
- `commands`: lista permitida de comandos para invocación.
- `permissions`: alternadores granulares (por ejemplo, `screen.record`, `camera.capture`).

El Gateway trata estas como **reclamaciones** y aplica listas permitidas del lado del servidor.

## Presencia

- `system-presence` devuelve entradas indexadas por identidad del dispositivo.
- Las entradas de presencia incluyen `deviceId`, `roles` y `scopes` para que las UI puedan mostrar una sola fila por dispositivo
  incluso cuando se conecta como **operator** y **node** a la vez.

## Alcance de eventos de difusión

Los eventos de difusión WebSocket enviados por el servidor están restringidos por alcance para que las sesiones con alcance de emparejamiento o solo de nodo no reciban pasivamente contenido de sesión.

- **Las tramas de chat, agente y resultado de herramientas** (incluidos los eventos `agent` transmitidos y los resultados de llamadas a herramientas) requieren al menos `operator.read`. Las sesiones sin `operator.read` omiten por completo estas tramas.
- **Las difusiones `plugin.*` definidas por plugins** están restringidas a `operator.write` o `operator.admin`, según cómo las haya registrado el plugin.
- **Los eventos de estado y transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexión/desconexión, etc.) siguen sin restricciones para que el estado de salud del transporte siga siendo observable para toda sesión autenticada.
- **Las familias de eventos de difusión desconocidas** están restringidas por alcance de forma predeterminada (fallo cerrado), salvo que un controlador registrado las flexibilice explícitamente.

Cada conexión de cliente mantiene su propio número de secuencia por cliente para que las difusiones preserven el orden monotónico en ese socket incluso cuando distintos clientes ven subconjuntos distintos del stream de eventos filtrados por alcance.

## Familias comunes de métodos RPC

Esta página no es un volcado completo generado, pero la superficie pública de WS es más amplia
que los ejemplos de handshake/autenticación anteriores. Estas son las principales familias de métodos que el
Gateway expone hoy.

`hello-ok.features.methods` es una lista conservadora de descubrimiento construida a partir de
`src/gateway/server-methods-list.ts` más las exportaciones de métodos de plugins/canales cargados.
Trátala como descubrimiento de características, no como un volcado generado de todos los auxiliares invocables
implementados en `src/gateway/server-methods/*.ts`.

### Sistema e identidad

- `health` devuelve la instantánea de salud del gateway en caché o recién sondeada.
- `diagnostics.stability` devuelve el registrador reciente y acotado de estabilidad diagnóstica.
  Conserva metadatos operativos como nombres de eventos, recuentos, tamaños en bytes,
  lecturas de memoria, estado de cola/sesión, nombres de canal/plugin e identificadores de sesión.
  No conserva texto de chat, cuerpos de Webhook, salidas de herramientas, cuerpos brutos de solicitudes o
  respuestas, tokens, cookies ni valores secretos. Requiere alcance de lectura de operador.
- `status` devuelve el resumen del gateway al estilo `/status`; los campos sensibles se
  incluyen solo para clientes operator con alcance de administrador.
- `gateway.identity.get` devuelve la identidad del dispositivo del gateway usada por los flujos de relay y
  emparejamiento.
- `system-presence` devuelve la instantánea de presencia actual de los dispositivos
  operator/node conectados.
- `system-event` agrega un evento del sistema y puede actualizar/difundir el
  contexto de presencia.
- `last-heartbeat` devuelve el evento Heartbeat persistido más reciente.
- `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el gateway.

### Modelos y uso

- `models.list` devuelve el catálogo de modelos permitido en runtime.
- `usage.status` devuelve resúmenes de ventanas de uso del proveedor/cuota restante.
- `usage.cost` devuelve resúmenes agregados de uso de costos para un intervalo de fechas.
- `doctor.memory.status` devuelve la preparación de memoria vectorial / embeddings para el
  espacio de trabajo activo del agente predeterminado.
- `sessions.usage` devuelve resúmenes de uso por sesión.
- `sessions.usage.timeseries` devuelve series temporales de uso para una sesión.
- `sessions.usage.logs` devuelve entradas de registro de uso para una sesión.

### Canales y auxiliares de inicio de sesión

- `channels.status` devuelve resúmenes de estado de canales/plugins integrados y empaquetados.
- `channels.logout` cierra la sesión de una cuenta/canal específica cuando el canal
  admite cierre de sesión.
- `web.login.start` inicia un flujo de inicio de sesión web/QR para el proveedor del canal web actual con capacidad QR.
- `web.login.wait` espera a que ese flujo de inicio de sesión web/QR se complete e inicia el
  canal cuando tiene éxito.
- `push.test` envía una notificación push APNs de prueba a un nodo iOS registrado.
- `voicewake.get` devuelve los activadores de palabra de activación almacenados.
- `voicewake.set` actualiza los activadores de palabra de activación y difunde el cambio.

### Mensajería y registros

- `send` es el RPC directo de entrega saliente para envíos dirigidos a canal/cuenta/hilo
  fuera del ejecutor de chat.
- `logs.tail` devuelve la cola configurada del registro de archivos del gateway con controles de cursor/límite y
  máximo de bytes.

### Talk y TTS

- `talk.config` devuelve la carga útil efectiva de configuración de Talk; `includeSecrets`
  requiere `operator.talk.secrets` (o `operator.admin`).
- `talk.mode` establece/difunde el estado actual del modo Talk para clientes
  WebChat/Control UI.
- `talk.speak` sintetiza voz mediante el proveedor de voz Talk activo.
- `tts.status` devuelve el estado de TTS habilitado, el proveedor activo, los proveedores de respaldo
  y el estado de configuración del proveedor.
- `tts.providers` devuelve el inventario visible de proveedores TTS.
- `tts.enable` y `tts.disable` activan o desactivan el estado de preferencias de TTS.
- `tts.setProvider` actualiza el proveedor TTS preferido.
- `tts.convert` ejecuta una conversión puntual de texto a voz.

### Secretos, configuración, actualización y asistente de configuración

- `secrets.reload` vuelve a resolver los SecretRefs activos e intercambia el estado secreto del runtime
  solo si todo se completa correctamente.
- `secrets.resolve` resuelve asignaciones de secretos dirigidas a comandos para un
  conjunto específico de comando/destino.
- `config.get` devuelve la instantánea y el hash de la configuración actual.
- `config.set` escribe una carga de configuración validada.
- `config.patch` fusiona una actualización parcial de la configuración.
- `config.apply` valida y reemplaza la carga completa de configuración.
- `config.schema` devuelve la carga del esquema de configuración en vivo usada por Control UI y
  las herramientas de CLI: esquema, `uiHints`, versión y metadatos de generación, incluidos
  los metadatos de esquema de plugin + canal cuando el runtime puede cargarlos. El esquema
  incluye metadatos de campo `title` / `description` derivados de las mismas etiquetas
  y el texto de ayuda usado por la UI, incluidas las ramas de composición de objetos anidados, comodines, elementos de matriz
  y `anyOf` / `oneOf` / `allOf` cuando existe la documentación
  correspondiente del campo.
- `config.schema.lookup` devuelve una carga de búsqueda con alcance de ruta para una ruta de configuración:
  ruta normalizada, un nodo superficial del esquema, la sugerencia coincidente + `hintPath`, y
  resúmenes inmediatos de elementos secundarios para profundización en UI/CLI.
  - Los nodos de esquema de búsqueda conservan la documentación visible para el usuario y los campos comunes de validación:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    límites numéricos/de cadena/de matriz/de objeto, e indicadores booleanos como
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Los resúmenes de elementos secundarios exponen `key`, `path` normalizada, `type`, `required`,
    `hasChildren`, además de la `hint` / `hintPath` coincidente.
- `update.run` ejecuta el flujo de actualización del gateway y programa un reinicio solo cuando
  la propia actualización se completó correctamente.
- `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el
  asistente de incorporación a través de WS RPC.

### Familias principales existentes

#### Agente y auxiliares del espacio de trabajo

- `agents.list` devuelve las entradas de agentes configuradas.
- `agents.create`, `agents.update` y `agents.delete` administran los registros de agentes y
  la conexión del espacio de trabajo.
- `agents.files.list`, `agents.files.get` y `agents.files.set` administran los
  archivos del espacio de trabajo bootstrap expuestos para un agente.
- `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o
  sesión.
- `agent.wait` espera a que una ejecución termine y devuelve la instantánea terminal cuando
  está disponible.

#### Control de sesiones

- `sessions.list` devuelve el índice de sesiones actual.
- `sessions.subscribe` y `sessions.unsubscribe` activan o desactivan las suscripciones a eventos de cambio de sesión para el cliente WS actual.
- `sessions.messages.subscribe` y `sessions.messages.unsubscribe` activan o desactivan
  las suscripciones a eventos de transcripción/mensajes para una sesión.
- `sessions.preview` devuelve vistas previas acotadas de transcripciones para claves de sesión específicas.
- `sessions.resolve` resuelve o canoniza un destino de sesión.
- `sessions.create` crea una nueva entrada de sesión.
- `sessions.send` envía un mensaje a una sesión existente.
- `sessions.steer` es la variante de interrumpir y redirigir para una sesión activa.
- `sessions.abort` aborta el trabajo activo de una sesión.
- `sessions.patch` actualiza metadatos/anulaciones de la sesión.
- `sessions.reset`, `sessions.delete` y `sessions.compact` realizan mantenimiento de sesión.
- `sessions.get` devuelve la fila almacenada completa de la sesión.
- La ejecución del chat sigue usando `chat.history`, `chat.send`, `chat.abort` y
  `chat.inject`.
- `chat.history` está normalizado para visualización para clientes de UI: las etiquetas de directivas inline se
  eliminan del texto visible, las cargas XML de llamadas a herramientas en texto plano
  (incluidas `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, y
  bloques truncados de llamadas a herramientas) y los tokens de control del modelo filtrados en ASCII/ancho completo
  se eliminan, se omiten las filas del asistente con solo token de silencio puro como `NO_REPLY` /
  `no_reply` exactos, y las filas sobredimensionadas pueden reemplazarse por marcadores.

#### Emparejamiento de dispositivos y tokens de dispositivo

- `device.pair.list` devuelve los dispositivos emparejados pendientes y aprobados.
- `device.pair.approve`, `device.pair.reject` y `device.pair.remove` administran
  los registros de emparejamiento de dispositivos.
- `device.token.rotate` rota un token de dispositivo emparejado dentro de sus límites aprobados de rol
  y alcance.
- `device.token.revoke` revoca un token de dispositivo emparejado.

#### Emparejamiento de nodos, invocación y trabajo pendiente

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` y `node.pair.verify` cubren el emparejamiento de nodos y la verificación
  de bootstrap.
- `node.list` y `node.describe` devuelven el estado de nodos conocidos/conectados.
- `node.rename` actualiza la etiqueta de un nodo emparejado.
- `node.invoke` reenvía un comando a un nodo conectado.
- `node.invoke.result` devuelve el resultado de una solicitud de invocación.
- `node.event` transporta eventos originados por el nodo de vuelta al gateway.
- `node.canvas.capability.refresh` actualiza tokens de capacidad de canvas con alcance restringido.
- `node.pending.pull` y `node.pending.ack` son las API de cola para nodos conectados.
- `node.pending.enqueue` y `node.pending.drain` administran trabajo pendiente duradero
  para nodos desconectados/sin conexión.

#### Familias de aprobación

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y
  `exec.approval.resolve` cubren solicitudes puntuales de aprobación de exec además de
  búsqueda/repetición de aprobaciones pendientes.
- `exec.approval.waitDecision` espera una aprobación de exec pendiente y devuelve
  la decisión final (o `null` al agotarse el tiempo).
- `exec.approvals.get` y `exec.approvals.set` administran instantáneas de la política de aprobación de exec del gateway.
- `exec.approvals.node.get` y `exec.approvals.node.set` administran la política local de aprobación de exec del nodo
  mediante comandos de relay del nodo.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` y `plugin.approval.resolve` cubren
  flujos de aprobación definidos por plugins.

#### Otras familias principales

- automatización:
  - `wake` programa una inyección de texto de activación inmediata o en el siguiente Heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Familias comunes de eventos

- `chat`: actualizaciones del chat de UI como `chat.inject` y otros eventos
  de chat solo de transcripción.
- `session.message` y `session.tool`: actualizaciones de transcripción/stream de eventos para una
  sesión suscrita.
- `sessions.changed`: cambió el índice de sesiones o sus metadatos.
- `presence`: actualizaciones de la instantánea de presencia del sistema.
- `tick`: evento periódico de keepalive/actividad.
- `health`: actualización de la instantánea de salud del gateway.
- `heartbeat`: actualización del stream de eventos de Heartbeat.
- `cron`: evento de cambio de ejecución/trabajo de Cron.
- `shutdown`: notificación de apagado del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida del emparejamiento de nodos.
- `node.invoke.request`: difusión de solicitud de invocación de nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida del dispositivo emparejado.
- `voicewake.changed`: cambió la configuración de activadores de palabra de activación.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida
  de aprobación de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida
  de aprobación de plugins.

### Métodos auxiliares de nodo

- Los nodos pueden llamar a `skills.bins` para obtener la lista actual de ejecutables de Skills
  para comprobaciones de permiso automático.

### Métodos auxiliares de operator

- Los operadores pueden llamar a `commands.list` (`operator.read`) para obtener el inventario de comandos del runtime para un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - `scope` controla a qué superficie apunta el `name` principal:
    - `text` devuelve el token principal del comando de texto sin la barra inicial `/`
    - `native` y la ruta predeterminada `both` devuelven nombres nativos dependientes del proveedor
      cuando están disponibles
  - `textAliases` contiene alias exactos con barra como `/model` y `/m`.
  - `nativeName` contiene el nombre del comando nativo dependiente del proveedor cuando existe.
  - `provider` es opcional y solo afecta el nombre nativo además de la disponibilidad de comandos nativos de plugins.
  - `includeArgs=false` omite los metadatos serializados de argumentos de la respuesta.
- Los operadores pueden llamar a `tools.catalog` (`operator.read`) para obtener el catálogo de herramientas del runtime para un
  agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: propietario del plugin cuando `source="plugin"`
  - `optional`: si una herramienta de plugin es opcional
- Los operadores pueden llamar a `tools.effective` (`operator.read`) para obtener el inventario efectivo de herramientas del runtime
  para una sesión.
  - `sessionKey` es obligatorio.
  - El gateway deriva el contexto confiable del runtime del lado del servidor a partir de la sesión en lugar de aceptar
    autenticación o contexto de entrega proporcionados por el llamante.
  - La respuesta tiene alcance de sesión y refleja lo que la conversación activa puede usar en este momento,
    incluidas herramientas de core, plugins y canales.
- Los operadores pueden llamar a `skills.status` (`operator.read`) para obtener el inventario visible
  de Skills para un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - La respuesta incluye elegibilidad, requisitos faltantes, comprobaciones de configuración y
    opciones de instalación sanitizadas sin exponer valores secretos sin procesar.
- Los operadores pueden llamar a `skills.search` y `skills.detail` (`operator.read`) para
  obtener metadatos de descubrimiento de ClawHub.
- Los operadores pueden llamar a `skills.install` (`operator.admin`) en dos modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una
    carpeta de skill en el directorio `skills/` del espacio de trabajo del agente predeterminado.
  - Modo instalador de gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    ejecuta una acción declarada `metadata.openclaw.install` en el host del gateway.
- Los operadores pueden llamar a `skills.update` (`operator.admin`) en dos modos:
  - El modo ClawHub actualiza un slug rastreado o todas las instalaciones rastreadas de ClawHub en
    el espacio de trabajo del agente predeterminado.
  - El modo Config parchea valores de `skills.entries.<skillKey>` como `enabled`,
    `apiKey` y `env`.

## Aprobaciones de exec

- Cuando una solicitud de exec necesita aprobación, el gateway difunde `exec.approval.requested`.
- Los clientes operator resuelven llamando a `exec.approval.resolve` (requiere el alcance `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadatos de sesión canónicos). Las solicitudes que no incluyan `systemRunPlan` se rechazan.
- Después de la aprobación, las llamadas reenviadas a `node.invoke system.run` reutilizan ese
  `systemRunPlan` canónico como el contexto autorizado de comando/cwd/sesión.
- Si un llamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` entre `prepare` y el reenvío final aprobado de `system.run`, el
  gateway rechaza la ejecución en lugar de confiar en la carga modificada.

## Respaldo de entrega del agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar entrega saliente.
- `bestEffortDeliver=false` mantiene el comportamiento estricto: los destinos de entrega no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite recurrir a ejecución solo de sesión cuando no puede resolverse ninguna ruta de entrega externa (por ejemplo, sesiones internas/webchat o configuraciones ambiguas de múltiples canales).

## Control de versiones

- `PROTOCOL_VERSION` vive en `src/gateway/protocol/schema/protocol-schemas.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`; el servidor rechaza incompatibilidades.
- Los esquemas + modelos se generan a partir de definiciones de TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes del cliente

El cliente de referencia en `src/gateway/client.ts` usa estos valores predeterminados. Los valores
son estables en todo el protocolo v3 y son la base esperada para clientes de terceros.

| Constante                                  | Predeterminado                                        | Origen                                                     |
| ------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                         | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Tiempo de espera de solicitud (por RPC)    | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Tiempo de espera de preautenticación / desafío de conexión | `10_000` ms                               | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff inicial de reconexión              | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff máximo de reconexión               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp de reintento rápido después del cierre por token de dispositivo | `250` ms                          | `src/gateway/client.ts`                                    |
| Período de gracia de parada forzada antes de `terminate()` | `250` ms                               | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                     | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalo de tick predeterminado (antes de `hello-ok`) | `30_000` ms                                   | `src/gateway/client.ts`                                    |
| Cierre por tiempo de espera de tick        | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                             |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

El servidor anuncia los valores efectivos `policy.tickIntervalMs`, `policy.maxPayload`
y `policy.maxBufferedBytes` en `hello-ok`; los clientes deben respetar esos valores
en lugar de los valores predeterminados previos al handshake.

## Autenticación

- La autenticación del gateway con secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el modo de autenticación configurado.
- Los modos con identidad como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o el modo no loopback
  `gateway.auth.mode: "trusted-proxy"` satisfacen la comprobación de autenticación de conexión a partir de
  los encabezados de la solicitud en lugar de `connect.params.auth.*`.
- El modo de ingreso privado `gateway.auth.mode: "none"` omite por completo la autenticación de conexión con secreto compartido;
  no expongas ese modo en ingresos públicos o no confiables.
- Después del emparejamiento, el Gateway emite un **token de dispositivo** con alcance restringido al
  rol + alcances de la conexión. Se devuelve en `hello-ok.auth.deviceToken` y el
  cliente debe persistirlo para futuras conexiones.
- Los clientes deben persistir el `hello-ok.auth.deviceToken` principal después de cualquier
  conexión exitosa.
- Volver a conectar con ese token de dispositivo **almacenado** también debe reutilizar el conjunto de
  alcances aprobados almacenado para ese token. Esto preserva el acceso de lectura/sondeo/estado
  que ya se había concedido y evita reducir silenciosamente las reconexiones a un
  alcance implícito más restringido de solo administrador.
- El ensamblaje de la autenticación de conexión del lado del cliente (`selectConnectAuth` en
  `src/gateway/client.ts`):
  - `auth.password` es ortogonal y siempre se reenvía cuando está configurado.
  - `auth.token` se completa en orden de prioridad: primero un token compartido explícito,
    luego un `deviceToken` explícito y después un token almacenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` se envía solo cuando ninguna de las opciones anteriores resolvió un
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La autopromoción de un token de dispositivo almacenado en el reintento único de
    `AUTH_TOKEN_MISMATCH` está restringida **solo a endpoints confiables**:
    loopback, o `wss://` con `tlsFingerprint` fijado. Un `wss://` público
    sin fijación no califica.
- Las entradas adicionales de `hello-ok.auth.deviceTokens` son tokens de transferencia de bootstrap.
  Persístelos solo cuando la conexión haya usado autenticación bootstrap en un transporte confiable
  como `wss://` o loopback/emparejamiento local.
- Si un cliente proporciona un `deviceToken` **explícito** o `scopes` explícitos, ese
  conjunto de alcances solicitado por el llamante sigue siendo el autorizado; los alcances en caché solo
  se reutilizan cuando el cliente está reutilizando el token por dispositivo almacenado.
- Los tokens de dispositivo pueden rotarse/revocarse mediante `device.token.rotate` y
  `device.token.revoke` (requiere el alcance `operator.pairing`).
- La emisión/rotación de tokens sigue estando restringida al conjunto de roles aprobado registrado en
  la entrada de emparejamiento de ese dispositivo; rotar un token no puede expandir el dispositivo a un
  rol que la aprobación de emparejamiento nunca concedió.
- Para sesiones con token de dispositivo emparejado, la gestión del dispositivo queda restringida al propio dispositivo a menos que el
  llamante también tenga `operator.admin`: los llamantes que no son administradores solo pueden eliminar/revocar/rotar
  su **propia** entrada de dispositivo.
- `device.token.rotate` también comprueba el conjunto de alcances de operador solicitado frente a los
  alcances de la sesión actual del llamante. Los llamantes que no son administradores no pueden rotar un token a
  un conjunto de alcances de operador más amplio que el que ya poseen.
- Los fallos de autenticación incluyen `error.details.code` además de sugerencias de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes confiables pueden intentar un reintento acotado con un token almacenado por dispositivo en caché.
  - Si ese reintento falla, los clientes deben detener los bucles automáticos de reconexión y mostrar indicaciones de acción al operador.

## Identidad del dispositivo + emparejamiento

- Los nodos deben incluir una identidad de dispositivo estable (`device.id`) derivada de la
  huella digital de un par de claves.
- Los gateways emiten tokens por dispositivo + rol.
- Se requieren aprobaciones de emparejamiento para nuevos ID de dispositivo, salvo que esté habilitada la aprobación automática local.
- La aprobación automática del emparejamiento está centrada en conexiones directas de loopback local.
- OpenClaw también tiene una ruta limitada de autoconexión local de backend/contenedor para flujos auxiliares confiables con secreto compartido.
- Las conexiones tailnet o LAN del mismo host siguen tratándose como remotas para el emparejamiento y
  requieren aprobación.
- Todos los clientes WS deben incluir la identidad `device` durante `connect` (operator + node).
  Control UI puede omitirla solo en estos modos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad con HTTP inseguro solo en localhost.
  - autenticación exitosa de Control UI de operator con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (medida extrema, degradación grave de seguridad).
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnóstico de migración de autenticación de dispositivo

Para clientes heredados que todavía usan el comportamiento de firma previo al desafío, `connect` ahora devuelve
códigos de detalle `DEVICE_AUTH_*` en `error.details.code` con un `error.details.reason` estable.

Fallos comunes de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                         |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió vacío). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto/incorrecto.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga de la firma no coincide con la carga v2.   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella del public key. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falló el formato/canonización del public key.       |

Objetivo de la migración:

- Espera siempre a `connect.challenge`.
- Firma la carga v2 que incluye el nonce del servidor.
- Envía el mismo nonce en `connect.params.device.nonce`.
- La carga de firma preferida es `v3`, que vincula `platform` y `deviceFamily`
  además de los campos de dispositivo/cliente/rol/alcances/token/nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero la fijación de metadatos
  del dispositivo emparejado sigue controlando la política de comandos en la reconexión.

## TLS + fijación

- TLS es compatible con conexiones WS.
- Los clientes pueden fijar opcionalmente la huella del certificado del gateway (consulta la configuración `gateway.tls`
  más `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Alcance

Este protocolo expone la **API completa del gateway** (estado, canales, modelos, chat,
agente, sesiones, nodos, aprobaciones, etc.). La superficie exacta está definida por los
esquemas TypeBox en `src/gateway/protocol/schema.ts`.
