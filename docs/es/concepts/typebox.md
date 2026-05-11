---
read_when:
    - Actualizar esquemas de protocolo o generación de código
summary: Esquemas de TypeBox como la única fuente de verdad para el protocolo Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-11T20:32:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecc9a69ac6d4ac101a4a6f34e44acfbe952dce0f90d178d4f8559191fb92c3b4
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox es una biblioteca de esquemas orientada a TypeScript. La usamos para definir el **protocolo WebSocket del Gateway** (handshake, solicitud/respuesta, eventos del servidor). Esos esquemas impulsan la **validación en tiempo de ejecución**, la **exportación a JSON Schema** y la **generación de código Swift** para la app de macOS. Una única fuente de verdad; todo lo demás se genera.

Si quieres el contexto de protocolo de más alto nivel, empieza con
[Arquitectura del Gateway](/es/concepts/architecture).

## Modelo mental (30 segundos)

Cada mensaje WS del Gateway es uno de tres frames:

- **Solicitud**: `{ type: "req", id, method, params }`
- **Respuesta**: `{ type: "res", id, ok, payload | error }`
- **Evento**: `{ type: "event", event, payload, seq?, stateVersion? }`

El primer frame **debe** ser una solicitud `connect`. Después de eso, los clientes pueden llamar a
métodos (por ejemplo, `health`, `send`, `chat.send`) y suscribirse a eventos (por ejemplo,
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

| Categoría  | Ejemplos                                                   | Notas                                      |
| ---------- | ---------------------------------------------------------- | ------------------------------------------ |
| Núcleo     | `connect`, `health`, `status`                              | `connect` debe ir primero                  |
| Mensajería | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | los efectos secundarios necesitan `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat usa estos                          |
| Sesiones   | `sessions.list`, `sessions.patch`, `sessions.delete`       | administración de sesiones                 |
| Automatización | `wake`, `cron.list`, `cron.run`, `cron.runs`           | control de wake + cron                     |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | WS del Gateway + acciones de Node          |
| Eventos    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push del servidor                          |

El inventario autoritativo de **descubrimiento** anunciado vive en
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Dónde viven los esquemas

- Fuente: `src/gateway/protocol/schema.ts`
- Validadores en tiempo de ejecución (AJV): `src/gateway/protocol/index.ts`
- Registro de características/descubrimiento anunciados: `src/gateway/server-methods-list.ts`
- Handshake del servidor + despacho de métodos: `src/gateway/server.impl.ts`
- Cliente de Node: `src/gateway/client.ts`
- JSON Schema generado: `dist/protocol.schema.json`
- Modelos Swift generados: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline actual

- `pnpm protocol:gen`
  - escribe JSON Schema (draft-07) en `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - genera modelos Swift del Gateway
- `pnpm protocol:check`
  - ejecuta ambos generadores y verifica que la salida esté confirmada

## Cómo se usan los esquemas en tiempo de ejecución

- **Lado del servidor**: cada frame entrante se valida con AJV. El handshake solo
  acepta una solicitud `connect` cuyos parámetros coincidan con `ConnectParams`.
- **Lado del cliente**: el cliente JS valida los frames de eventos y respuestas antes de
  usarlos.
- **Descubrimiento de características**: el Gateway envía una lista conservadora `features.methods`
  y `features.events` en `hello-ok` desde `listGatewayMethods()` y
  `GATEWAY_EVENTS`.
- Esa lista de descubrimiento no es un volcado generado de todos los helpers invocables en
  `coreGatewayHandlers`; algunos RPC helpers se implementan en
  `src/gateway/server-methods/*.ts` sin enumerarse en la lista de características
  anunciada.

## Frames de ejemplo

Connect (primer mensaje):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

Respuesta Hello-ok:

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

El flujo útil más pequeño: connect + health.

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

## Ejemplo completo: añadir un método de extremo a extremo

Ejemplo: añadir una nueva solicitud `system.echo` que devuelve `{ ok: true, text }`.

1. **Esquema (fuente de verdad)**

Añade a `src/gateway/protocol/schema.ts`:

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

Añade ambos a `ProtocolSchemas` y exporta los tipos:

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

Añade un handler en `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Regístralo en `src/gateway/server-methods.ts` (ya fusiona `systemHandlers`),
luego añade `"system.echo"` a la entrada de `listGatewayMethods` en
`src/gateway/server-methods-list.ts`.

Si el método puede ser llamado por clientes operador o Node, clasifícalo también en
`src/gateway/method-scopes.ts` para que la aplicación de alcances y el anuncio de características
de `hello-ok` permanezcan alineados.

4. **Regenerar**

```bash
pnpm protocol:check
```

5. **Pruebas + documentación**

Añade una prueba de servidor en `src/gateway/server.*.test.ts` y documenta el método.

## Comportamiento de la generación de código Swift

El generador Swift emite:

- enum `GatewayFrame` con casos `req`, `res`, `event` y `unknown`
- structs/enums de payload fuertemente tipados
- valores `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` y `GATEWAY_MIN_PROTOCOL_VERSION`

Los tipos de frame desconocidos se conservan como payloads sin procesar para compatibilidad futura.

## Versionado + compatibilidad

- `PROTOCOL_VERSION` vive en `src/gateway/protocol/version.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`; el servidor rechaza rangos que
  no incluyan su protocolo actual.
- Los modelos Swift conservan los tipos de frame desconocidos para evitar romper clientes antiguos.

## Patrones y convenciones de esquemas

- La mayoría de los objetos usan `additionalProperties: false` para payloads estrictos.
- `NonEmptyString` es el valor predeterminado para IDs y nombres de métodos/eventos.
- El `GatewayFrame` de nivel superior usa un **discriminador** en `type`.
- Los métodos con efectos secundarios suelen requerir un `idempotencyKey` en params
  (ejemplo: `send`, `poll`, `agent`, `chat.send`).
- `agent` acepta `internalEvents` opcionales para contexto de orquestación generado en tiempo de ejecución
  (por ejemplo, traspaso de finalización de subagent/tarea cron); trata esto como superficie de API interna.

## JSON de esquema en vivo

El JSON Schema generado está en el repositorio en `dist/protocol.schema.json`. El
archivo sin procesar publicado suele estar disponible en:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Cuando cambias esquemas

1. Actualiza los esquemas TypeBox.
2. Registra el método/evento en `src/gateway/server-methods-list.ts`.
3. Actualiza `src/gateway/method-scopes.ts` cuando el nuevo RPC necesite clasificación de alcance de operador o
   Node.
4. Ejecuta `pnpm protocol:check`.
5. Confirma el esquema regenerado + los modelos Swift.

## Relacionado

- [Protocolo de salida enriquecida](/es/reference/rich-output-protocol)
- [Adaptadores RPC](/es/reference/rpc)
