---
read_when:
    - Actualización de esquemas de protocolo o generación de código
summary: Esquemas de TypeBox como única fuente de verdad para el protocolo del Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-07-11T23:01:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox es una biblioteca de esquemas orientada a TypeScript. OpenClaw la utiliza para definir el **protocolo WebSocket del Gateway** (negociación inicial, solicitud/respuesta y eventos del servidor). Esos esquemas impulsan la **validación en tiempo de ejecución** (AJV), la **exportación de JSON Schema** y la **generación de código Swift** para la aplicación de macOS. Una única fuente de verdad; todo lo demás se genera.

Para conocer el contexto general del protocolo, comienza por [Arquitectura del Gateway](/es/concepts/architecture).

## Modelo mental (30 segundos)

Cada mensaje WS del Gateway es uno de estos tres tipos de trama:

- **Solicitud**: `{ type: "req", id, method, params }`
- **Respuesta**: `{ type: "res", id, ok, payload | error }`
- **Evento**: `{ type: "event", event, payload, seq?, stateVersion? }`

La primera trama **debe** ser una solicitud `connect`. Después, los clientes llaman a métodos (por ejemplo, `health`, `send`, `chat.send`) y se suscriben a eventos (por ejemplo, `presence`, `tick`, `agent`).

Flujo de conexión (mínimo):

```text
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Métodos y eventos habituales:

| Categoría   | Ejemplos                                                   | Notas                                                   |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| Núcleo      | `connect`, `health`, `status`                              | `connect` debe ser el primero                           |
| Mensajería  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | los métodos con efectos secundarios necesitan `idempotencyKey` |
| Chat        | `chat.history`, `chat.send`, `chat.abort`                  | WebChat utiliza estos                                   |
| Sesiones    | `sessions.list`, `sessions.patch`, `sessions.delete`       | administración de sesiones                              |
| Automatización | `wake`, `cron.list`, `cron.run`, `cron.runs`            | control de activación y Cron                            |
| Nodos       | `node.list`, `node.invoke`, `node.pair.*`                  | WS del Gateway más acciones del nodo                    |
| Eventos     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | envío iniciado por el servidor                          |

El inventario autoritativo de **descubrimiento** anunciado se encuentra en `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Dónde se encuentran los esquemas

- Módulo de exportación de origen: `packages/gateway-protocol/src/schema.ts` reexporta los módulos de dominio incluidos en `packages/gateway-protocol/src/schema/*.ts` (`frames.ts` para los envoltorios de nivel superior y la negociación inicial, `agent.ts`, `sessions.ts`, `cron.ts`, etc., según el área funcional). `protocol-schemas.ts` es el registro central `ProtocolSchemas` que asigna los nombres de los esquemas a sus definiciones de TypeBox.
- Validadores en tiempo de ejecución (AJV): `packages/gateway-protocol/src/index.ts`
- Registro anunciado de funcionalidades y descubrimiento: `src/gateway/server-methods-list.ts`
- Negociación inicial del servidor y despacho de métodos: `src/gateway/server.impl.ts`
- Cliente del nodo: `src/gateway/client.ts`
- JSON Schema generado: `dist/protocol.schema.json` (salida de compilación, no se incluye en el repositorio)
- Modelos Swift generados: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## Canalización actual

- `pnpm protocol:gen` escribe el JSON Schema (borrador 07) en `dist/protocol.schema.json`.
- `pnpm protocol:gen:swift` genera los modelos Swift del Gateway.
- `pnpm protocol:check` ejecuta ambos generadores y verifica que la salida Swift esté incluida en el repositorio (la salida de JSON Schema es un artefacto de compilación ignorado por Git).

## Cómo se utilizan los esquemas en tiempo de ejecución

- **Servidor**: cada trama entrante se valida con AJV. La negociación inicial solo acepta una solicitud `connect` cuyos parámetros coincidan con `ConnectParams`.
- **Cliente**: el cliente de JS valida las tramas de eventos y respuestas antes de utilizarlas.
- **Descubrimiento de funcionalidades**: el Gateway envía una lista conservadora de `features.methods` y `features.events` en `hello-ok`, obtenida de `listGatewayMethods()` y `GATEWAY_EVENTS`.
- Esa lista de descubrimiento no es un volcado generado de todos los auxiliares invocables de `coreGatewayHandlers`; algunos RPC auxiliares están implementados en `src/gateway/server-methods/*.ts` sin estar enumerados en la lista de funcionalidades anunciada.

## Ejemplos de tramas

Conexión (primer mensaje):

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

Respuesta `hello-ok`:

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

Flujo útil más pequeño: conexión + estado de salud.

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

## Ejemplo práctico: añadir un método de extremo a extremo

Ejemplo: añadir una nueva solicitud `system.echo` que devuelva `{ ok: true, text }`.

1. **Esquema (fuente de verdad)**

Añádelo a `packages/gateway-protocol/src/schema/system.ts` (o al módulo funcional correspondiente más cercano):

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

Añade un controlador en `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Regístralo en `src/gateway/server-methods.ts` (que ya combina `systemHandlers`) y después añade `"system.echo"` a la entrada de `listGatewayMethods` en `src/gateway/server-methods-list.ts`.

Si los clientes de operador o de nodo pueden invocar el método, clasifícalo también en `src/gateway/method-scopes.ts` para que la aplicación de ámbitos y el anuncio de funcionalidades de `hello-ok` permanezcan alineados.

4. **Regenerar**

```bash
pnpm protocol:check
```

5. **Pruebas y documentación**

Añade una prueba del servidor en `src/gateway/server.*.test.ts` y menciona el método en la documentación.

## Comportamiento de la generación de código Swift

El generador de Swift emite:

- una enumeración `GatewayFrame` con los casos `req`, `res`, `event` y `unknown`
- estructuras y enumeraciones de cargas útiles con tipos estrictos
- valores de `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` y `GATEWAY_MIN_PROTOCOL_VERSION`

Los tipos de trama desconocidos se conservan como cargas útiles sin procesar para mantener la compatibilidad futura.

## Control de versiones y compatibilidad

- `PROTOCOL_VERSION` se encuentra en `packages/gateway-protocol/src/version.ts` (valor actual: `4`).
- Los clientes envían `minProtocol` y `maxProtocol`; el servidor rechaza los intervalos que no incluyan su protocolo actual.
- Los modelos Swift conservan los tipos de trama desconocidos para evitar que los clientes antiguos dejen de funcionar.

## Patrones y convenciones de los esquemas

- La mayoría de los objetos utilizan `additionalProperties: false` para imponer cargas útiles estrictas.
- `NonEmptyString` (`Type.String({ minLength: 1 })`) es el valor predeterminado para los identificadores y los nombres de métodos y eventos.
- El `GatewayFrame` de nivel superior utiliza un **discriminador** en `type`.
- Los métodos con efectos secundarios suelen requerir un `idempotencyKey` en los parámetros (por ejemplo: `send`, `poll`, `agent`, `chat.send`).
- `agent` acepta el parámetro opcional `internalEvents` para el contexto de orquestación generado en tiempo de ejecución (por ejemplo, la transferencia al completarse una tarea de subagente o Cron); considera esto una superficie de API interna.

## JSON del esquema publicado

El JSON Schema generado es un artefacto de compilación y no se incluye en el repositorio. El archivo sin procesar publicado suele estar disponible en:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Cuando cambies los esquemas

1. Actualiza los esquemas de TypeBox en el módulo propietario `packages/gateway-protocol/src/schema/*.ts` y regístralos en `protocol-schemas.ts`.
2. Registra el método o evento en `src/gateway/server-methods-list.ts`.
3. Actualiza `src/gateway/method-scopes.ts` cuando el nuevo RPC necesite una clasificación de ámbito de operador o nodo.
4. Ejecuta `pnpm protocol:check`.
5. Incluye en el repositorio los modelos Swift regenerados.

## Contenido relacionado

- [Protocolo de salida enriquecida](/es/reference/rich-output-protocol)
- [Adaptadores RPC](/es/reference/rpc)
