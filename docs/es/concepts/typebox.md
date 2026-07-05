---
read_when:
    - Actualización de esquemas de protocolo o codegen
summary: Esquemas de TypeBox como fuente única de verdad para el protocolo del Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-07-05T11:15:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox es una biblioteca de esquemas orientada a TypeScript. OpenClaw la usa para definir el **protocolo WebSocket del Gateway** (handshake, solicitud/respuesta, eventos del servidor). Esos esquemas impulsan la **validación en tiempo de ejecución** (AJV), la **exportación de JSON Schema** y la **generación de código Swift** para la app de macOS. Una única fuente de verdad; todo lo demás se genera.

Para el contexto de protocolo de más alto nivel, empieza con [arquitectura del Gateway](/es/concepts/architecture).

## Modelo mental (30 segundos)

Cada mensaje WS del Gateway es uno de tres marcos:

- **Solicitud**: `{ type: "req", id, method, params }`
- **Respuesta**: `{ type: "res", id, ok, payload | error }`
- **Evento**: `{ type: "event", event, payload, seq?, stateVersion? }`

El primer marco **debe** ser una solicitud `connect`. Después de eso, los clientes llaman a métodos (por ejemplo, `health`, `send`, `chat.send`) y se suscriben a eventos (por ejemplo, `presence`, `tick`, `agent`).

Flujo de conexión (mínimo):

```text
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Métodos y eventos comunes:

| Categoría   | Ejemplos                                                   | Notas                                                   |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| Núcleo      | `connect`, `health`, `status`                              | `connect` debe ir primero                              |
| Mensajería  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | los métodos con efectos secundarios necesitan `idempotencyKey` |
| Chat        | `chat.history`, `chat.send`, `chat.abort`                  | WebChat usa estos                                      |
| Sesiones    | `sessions.list`, `sessions.patch`, `sessions.delete`       | administración de sesiones                             |
| Automatización | `wake`, `cron.list`, `cron.run`, `cron.runs`            | control de wake y cron                                 |
| Nodos       | `node.list`, `node.invoke`, `node.pair.*`                  | WS del Gateway más acciones de nodo                    |
| Eventos     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push del servidor                                      |

El inventario **discovery** anunciado y autorizado vive en `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Dónde viven los esquemas

- Barrel de origen: `packages/gateway-protocol/src/schema.ts` reexporta módulos de dominio bajo `packages/gateway-protocol/src/schema/*.ts` (`frames.ts` para los envoltorios de nivel superior y el handshake, `agent.ts`, `sessions.ts`, `cron.ts`, etc. por área de funcionalidad). `protocol-schemas.ts` es el registro central `ProtocolSchemas` que asigna nombres de esquema a sus definiciones TypeBox.
- Validadores en tiempo de ejecución (AJV): `packages/gateway-protocol/src/index.ts`
- Registro de funcionalidades/discovery anunciado: `src/gateway/server-methods-list.ts`
- Handshake del servidor y despacho de métodos: `src/gateway/server.impl.ts`
- Cliente de Node: `src/gateway/client.ts`
- JSON Schema generado: `dist/protocol.schema.json` (salida de build, no comprometida)
- Modelos Swift generados: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline actual

- `pnpm protocol:gen` escribe JSON Schema (draft-07) en `dist/protocol.schema.json`.
- `pnpm protocol:gen:swift` genera los modelos Swift del Gateway.
- `pnpm protocol:check` ejecuta ambos generadores y verifica que la salida Swift esté comprometida (la salida JSON Schema es un artefacto de build ignorado por git).

## Cómo se usan los esquemas en tiempo de ejecución

- **Lado del servidor**: cada marco entrante se valida con AJV. El handshake solo acepta una solicitud `connect` cuyos parámetros coincidan con `ConnectParams`.
- **Lado del cliente**: el cliente JS valida los marcos de evento y respuesta antes de usarlos.
- **Discovery de funcionalidades**: el Gateway envía una lista conservadora `features.methods` y `features.events` en `hello-ok`, desde `listGatewayMethods()` y `GATEWAY_EVENTS`.
- Esa lista de discovery no es un volcado generado de cada helper invocable en `coreGatewayHandlers`; algunos RPC helper se implementan en `src/gateway/server-methods/*.ts` sin enumerarse en la lista de funcionalidades anunciada.

## Marcos de ejemplo

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
    "auth": { "role": "operator", "scopes": ["operator.read"] },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Solicitud y respuesta:

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

Flujo útil más pequeño: connect + health.

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

## Ejemplo desarrollado: añadir un método de extremo a extremo

Ejemplo: añadir una nueva solicitud `system.echo` que devuelve `{ ok: true, text }`.

1. **Esquema (fuente de verdad)**

Añade a `packages/gateway-protocol/src/schema/system.ts` (o al módulo de funcionalidad más cercano):

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

Importa ambos en `packages/gateway-protocol/src/schema/protocol-schemas.ts`, añádelos al registro `ProtocolSchemas` y exporta los tipos derivados:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validación**

En `packages/gateway-protocol/src/index.ts`, exporta un validador AJV:

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

Regístralo en `src/gateway/server-methods.ts` (ya fusiona `systemHandlers`), luego añade `"system.echo"` a la entrada de `listGatewayMethods` en `src/gateway/server-methods-list.ts`.

Si el método es invocable por clientes operador o nodo, clasifícalo también en `src/gateway/method-scopes.ts` para mantener alineados el cumplimiento de alcances y el anuncio de funcionalidades de `hello-ok`.

4. **Regenerar**

```bash
pnpm protocol:check
```

5. **Pruebas y documentación**

Añade una prueba de servidor en `src/gateway/server.*.test.ts` y anota el método en la documentación.

## Comportamiento de generación de código Swift

El generador Swift emite:

- un enum `GatewayFrame` con casos `req`, `res`, `event` y `unknown`
- structs/enums de payload con tipos fuertes
- valores `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` y `GATEWAY_MIN_PROTOCOL_VERSION`

Los tipos de marco desconocidos se conservan como payloads sin procesar para compatibilidad hacia delante.

## Versionado y compatibilidad

- `PROTOCOL_VERSION` vive en `packages/gateway-protocol/src/version.ts` (valor actual: `4`).
- Los clientes envían `minProtocol` y `maxProtocol`; el servidor rechaza rangos que no incluyan su protocolo actual.
- Los modelos Swift conservan los tipos de marco desconocidos para evitar romper clientes antiguos.

## Patrones y convenciones de esquema

- La mayoría de los objetos usan `additionalProperties: false` para payloads estrictos.
- `NonEmptyString` (`Type.String({ minLength: 1 })`) es el valor predeterminado para ID y nombres de método/evento.
- El `GatewayFrame` de nivel superior usa un **discriminador** en `type`.
- Los métodos con efectos secundarios suelen requerir un `idempotencyKey` en params (ejemplo: `send`, `poll`, `agent`, `chat.send`).
- `agent` acepta `internalEvents` opcionales para contexto de orquestación generado en tiempo de ejecución (por ejemplo, entrega de finalización de tarea de subagente/cron); trata esto como superficie de API interna.

## JSON de esquema en vivo

El JSON Schema generado es un artefacto de build, no se compromete al repo. El archivo raw publicado normalmente está disponible en:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Cuando cambies esquemas

1. Actualiza los esquemas TypeBox en el módulo propietario `packages/gateway-protocol/src/schema/*.ts` y regístralos en `protocol-schemas.ts`.
2. Registra el método/evento en `src/gateway/server-methods-list.ts`.
3. Actualiza `src/gateway/method-scopes.ts` cuando el nuevo RPC necesite clasificación de alcance de operador o nodo.
4. Ejecuta `pnpm protocol:check`.
5. Compromete los modelos Swift regenerados.

## Relacionado

- [Protocolo de salida enriquecida](/es/reference/rich-output-protocol)
- [Adaptadores RPC](/es/reference/rpc)
