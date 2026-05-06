---
read_when:
    - Protocolschema's of codegeneratie bijwerken
summary: TypeBox-schema's als de enige bron van waarheid voor het Gateway-protocol
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T09:11:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e188ec0fefcbaf01c8b575a1898eafbbcf309d3032930aa0c09c2d9a63b93e5
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox is een TypeScript-first schemabibliotheek. We gebruiken deze om het **Gateway
WebSocket-protocol** te definiëren (handshake, request/response, serverevents). Die schema's
sturen **runtimevalidatie**, **JSON Schema-export** en **Swift-codegeneratie** voor
de macOS-app aan. Eén bron van waarheid; al het andere wordt gegenereerd.

Als je de protocolcontext op hoger niveau wilt, begin dan met
[Gateway-architectuur](/nl/concepts/architecture).

## Mentaal model (30 seconden)

Elk Gateway WS-bericht is een van drie frames:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

Het eerste frame **moet** een `connect`-request zijn. Daarna kunnen clients
methoden aanroepen (bijv. `health`, `send`, `chat.send`) en zich abonneren op events (bijv.
`presence`, `tick`, `agent`).

Verbindingsstroom (minimaal):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Veelgebruikte methoden + events:

| Categorie  | Voorbeelden                                                | Opmerkingen                        |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Core       | `connect`, `health`, `status`                              | `connect` moet eerst komen         |
| Messaging  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | side-effects vereisen `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat gebruikt deze              |
| Sessies    | `sessions.list`, `sessions.patch`, `sessions.delete`       | sessiebeheer                       |
| Automatisering | `wake`, `cron.list`, `cron.run`, `cron.runs`           | wake + cronbesturing               |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + node-acties           |
| Events     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | serverpush                         |

De gezaghebbende gepubliceerde ontdekkingsinventaris staat in
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Waar de schema's staan

- Bron: `src/gateway/protocol/schema.ts`
- Runtimevalidators (AJV): `src/gateway/protocol/index.ts`
- Gepubliceerd feature-/ontdekkingsregister: `src/gateway/server-methods-list.ts`
- Serverhandshake + methodedispatch: `src/gateway/server.impl.ts`
- Node-client: `src/gateway/client.ts`
- Gegenereerd JSON Schema: `dist/protocol.schema.json`
- Gegenereerde Swift-modellen: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Huidige pijplijn

- `pnpm protocol:gen`
  - schrijft JSON Schema (draft-07) naar `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - genereert Swift-gatewaymodellen
- `pnpm protocol:check`
  - voert beide generators uit en controleert of de output is gecommit

## Hoe de schema's tijdens runtime worden gebruikt

- **Serverzijde**: elk binnenkomend frame wordt gevalideerd met AJV. De handshake
  accepteert alleen een `connect`-request waarvan de params overeenkomen met `ConnectParams`.
- **Clientzijde**: de JS-client valideert event- en responseframes voordat
  ze worden gebruikt.
- **Featuredetectie**: de Gateway verstuurt een conservatieve lijst met `features.methods`
  en `features.events` in `hello-ok` vanuit `listGatewayMethods()` en
  `GATEWAY_EVENTS`.
- Die ontdekkingslijst is geen gegenereerde dump van elke aanroepbare helper in
  `coreGatewayHandlers`; sommige helper-RPC's zijn geïmplementeerd in
  `src/gateway/server-methods/*.ts` zonder dat ze worden opgenomen in de gepubliceerde
  featurelijst.

## Voorbeeldframes

Connect (eerste bericht):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

Hello-ok-response:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
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

Request + response:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Event:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Minimale client (Node.js)

Kleinste bruikbare flow: connect + health.

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
        minProtocol: 3,
        maxProtocol: 3,
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

## Uitgewerkt voorbeeld: end-to-end een methode toevoegen

Voorbeeld: voeg een nieuwe `system.echo`-request toe die `{ ok: true, text }` retourneert.

1. **Schema (bron van waarheid)**

Voeg toe aan `src/gateway/protocol/schema.ts`:

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

Voeg beide toe aan `ProtocolSchemas` en exporteer types:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validatie**

Exporteer in `src/gateway/protocol/index.ts` een AJV-validator:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Servergedrag**

Voeg een handler toe in `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Registreer deze in `src/gateway/server-methods.ts` (voegt `systemHandlers` al samen),
en voeg daarna `"system.echo"` toe aan de input van `listGatewayMethods` in
`src/gateway/server-methods-list.ts`.

Als de methode aanroepbaar is door operator- of node-clients, classificeer deze dan ook in
`src/gateway/method-scopes.ts`, zodat scopehandhaving en `hello-ok`-featureadvertising
op elkaar afgestemd blijven.

4. **Opnieuw genereren**

```bash
pnpm protocol:check
```

5. **Tests + docs**

Voeg een servertest toe in `src/gateway/server.*.test.ts` en vermeld de methode in de docs.

## Gedrag van Swift-codegeneratie

De Swift-generator geeft het volgende uit:

- `GatewayFrame`-enum met `req`-, `res`-, `event`- en `unknown`-cases
- Sterk getypte payloadstructs/-enums
- `ErrorCode`-waarden en `GATEWAY_PROTOCOL_VERSION`

Onbekende frametypes worden bewaard als ruwe payloads voor voorwaartse compatibiliteit.

## Versionering + compatibiliteit

- `PROTOCOL_VERSION` staat in `src/gateway/protocol/schema.ts`.
- Clients versturen `minProtocol` + `maxProtocol`; de server weigert mismatches.
- De Swift-modellen behouden onbekende frametypes om oudere clients niet te breken.

## Schemapatronen en conventies

- De meeste objecten gebruiken `additionalProperties: false` voor strikte payloads.
- `NonEmptyString` is de standaard voor ID's en methode-/eventnamen.
- De top-level `GatewayFrame` gebruikt een **discriminator** op `type`.
- Methoden met side-effects vereisen meestal een `idempotencyKey` in params
  (voorbeeld: `send`, `poll`, `agent`, `chat.send`).
- `agent` accepteert optionele `internalEvents` voor runtimegegenereerde orchestration-context
  (bijvoorbeeld overdracht bij voltooiing van subagent-/crontaken); behandel dit als intern API-oppervlak.

## Live schema-JSON

Gegenereerd JSON Schema staat in de repo op `dist/protocol.schema.json`. Het
gepubliceerde raw bestand is meestal beschikbaar op:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Wanneer je schema's wijzigt

1. Werk de TypeBox-schema's bij.
2. Registreer de methode/het event in `src/gateway/server-methods-list.ts`.
3. Werk `src/gateway/method-scopes.ts` bij wanneer de nieuwe RPC classificatie voor operator-
   of node-scope nodig heeft.
4. Voer `pnpm protocol:check` uit.
5. Commit het opnieuw gegenereerde schema + de Swift-modellen.

## Gerelateerd

- [Rich output-protocol](/nl/reference/rich-output-protocol)
- [RPC-adapters](/nl/reference/rpc)
