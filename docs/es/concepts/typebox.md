---
read_when:
    - Actualización de esquemas de protocolo o generación de código
summary: Esquemas de TypeBox como la única fuente de verdad para el protocolo del Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-07T13:15:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95baccfdfa6f77ba57f6ac8502d502084289a84cfd03a450dd1e9422931706dd
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox es una biblioteca de esquemas orientada a TypeScript. La usamos para definir el **protocolo WebSocket del Gateway** (handshake, solicitud/respuesta, eventos del servidor). Esos esquemas impulsan la **validación en tiempo de ejecución**, la **exportación de JSON Schema** y la **generación de código Swift** para la app de macOS. Una única fuente de verdad; todo lo demás se genera.

Si quieres el contexto de protocolo de más alto nivel, empieza con
[Arquitectura del Gateway](/es/concepts/architecture).

## Modelo mental (30 segundos)

Cada mensaje WS del Gateway es uno de tres frames:

- **Solicitud**: `{ type: "req", id, method, params }`
- **Respuesta**: `{ type: "res", id, ok, payload | error }`
- **Evento**: `{ type: "event", event, payload, seq?, stateVersion? }`

El primer frame **debe** ser una solicitud `connect`. Después de eso, los clientes pueden llamar
a métodos (por ejemplo, `health`, `send`, `chat.send`) y suscribirse a eventos (por ejemplo,
`presence`, `tick`, `agent`).

Flujo de conexión (mínimo):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Métodos y eventos comunes:

| Categoría  | Ejemplos                                                   | Notas                                        |
| ---------- | ---------------------------------------------------------- | -------------------------------------------- |
| Núcleo     | `connect`, `health`, `status`                              | `connect` debe ir primero                    |
| Mensajería | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | los efectos secundarios necesitan `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat usa estos                            |
| Sesiones   | `sessions.list`, `sessions.patch`, `sessions.delete`       | administración de sesiones                   |
| Automatización | `wake`, `cron.list`, `cron.run`, `cron.runs`           | activación + control de cron                 |
| Nodos      | `node.list`, `node.invoke`, `node.pair.*`                  | WS del Gateway + acciones de nodo            |
| Eventos    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | envío desde el servidor                      |

El inventario autorizado de **descubrimiento** anunciado vive en
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Dónde viven los esquemas

- Fuente: `src/gateway/protocol/schema.ts`
- Validadores en tiempo de ejecución (AJV): `src/gateway/protocol/index.ts`
- Registro anunciado de funcionalidades/descubrimiento: `src/gateway/server-methods-list.ts`
- Handshake del servidor + despacho de métodos: `src/gateway/server.impl.ts`
- Cliente Node: `src/gateway/client.ts`
- JSON Schema generado: `dist/protocol.schema.json`
- Modelos Swift generados: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline actual

- `pnpm protocol:gen`
  - escribe JSON Schema (draft-07) en `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - genera modelos Swift del Gateway
- `pnpm protocol:check`
  - ejecuta ambos generadores y verifica que la salida esté confirmada en el repositorio

## Cómo se usan los esquemas en tiempo de ejecución

- **Lado servidor**: cada frame entrante se valida con AJV. El handshake solo
  acepta una solicitud `connect` cuyos parámetros coincidan con `ConnectParams`.
- **Lado cliente**: el cliente JS valida frames de evento y respuesta antes de
  usarlos.
- **Descubrimiento de funcionalidades**: el Gateway envía una lista conservadora de `features.methods`
  y `features.events` en `hello-ok` desde `listGatewayMethods()` y
  `GATEWAY_EVENTS`.
- Esa lista de descubrimiento no es un volcado generado de cada helper invocable en
  `coreGatewayHandlers`; algunos RPC auxiliares se implementan en
  `src/gateway/server-methods/*.ts` sin estar enumerados en la lista de funcionalidades anunciadas.

## Frames de ejemplo

Conexión (primer mensaje):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Respuesta hello-ok:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Solicitud + respuesta:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Evento:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Cliente mínimo (Node.js)

Flujo útil más pequeño: conectar + health.

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 4,
        maxProtocol: 4,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## Ejemplo trabajado: agregar un método de extremo a extremo

Ejemplo: agrega una nueva solicitud `system.echo` que devuelve `{ ok: true, text }`.

1. **Esquema (fuente de verdad)**

Agrega a `src/gateway/protocol/schema.ts`:

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

Agrega ambos a `ProtocolSchemas` y exporta los tipos:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validación**

En `src/gateway/protocol/index.ts`, exporta un validador AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Comportamiento del servidor**

Agrega un handler en `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Regístralo en `src/gateway/server-methods.ts` (ya combina `systemHandlers`),
luego agrega `"system.echo"` a la entrada de `listGatewayMethods` en
`src/gateway/server-methods-list.ts`.

Si el método puede ser llamado por clientes operador o nodo, clasifícalo también en
`src/gateway/method-scopes.ts` para que la aplicación de ámbitos y el anuncio de funcionalidades
de `hello-ok` se mantengan alineados.

4. **Regenerar**

```bash
pnpm protocol:check
```

5. **Pruebas + documentación**

Agrega una prueba de servidor en `src/gateway/server.*.test.ts` y menciona el método en la documentación.

## Comportamiento de la generación de código Swift

El generador Swift emite:

- enum `GatewayFrame` con los casos `req`, `res`, `event` y `unknown`
- structs/enums de payload con tipado estricto
- valores `ErrorCode` y `GATEWAY_PROTOCOL_VERSION`

Los tipos de frame desconocidos se conservan como payloads sin procesar para compatibilidad futura.

## Versionado + compatibilidad

- `PROTOCOL_VERSION` vive en `src/gateway/protocol/version.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`; el servidor rechaza las incompatibilidades.
- Los modelos Swift conservan tipos de frame desconocidos para evitar romper clientes antiguos.

## Patrones y convenciones de esquema

- La mayoría de los objetos usa `additionalProperties: false` para payloads estrictos.
- `NonEmptyString` es el valor predeterminado para IDs y nombres de métodos/eventos.
- El `GatewayFrame` de nivel superior usa un **discriminador** en `type`.
- Los métodos con efectos secundarios normalmente requieren un `idempotencyKey` en los parámetros
  (ejemplo: `send`, `poll`, `agent`, `chat.send`).
- `agent` acepta `internalEvents` opcional para contexto de orquestación generado en tiempo de ejecución
  (por ejemplo, traspaso de finalización de tareas de subagente/cron); trátalo como superficie de API interna.

## JSON de esquema en vivo

El JSON Schema generado está en el repositorio en `dist/protocol.schema.json`. El
archivo raw publicado suele estar disponible en:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Cuando cambies esquemas

1. Actualiza los esquemas TypeBox.
2. Registra el método/evento en `src/gateway/server-methods-list.ts`.
3. Actualiza `src/gateway/method-scopes.ts` cuando el nuevo RPC necesite clasificación de ámbito de operador o
   nodo.
4. Ejecuta `pnpm protocol:check`.
5. Confirma el esquema regenerado + los modelos Swift.

## Relacionado

- [Protocolo de salida enriquecida](/es/reference/rich-output-protocol)
- [Adaptadores RPC](/es/reference/rpc)
