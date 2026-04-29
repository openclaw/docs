---
read_when:
    - Protocolschema's of codegeneratie bijwerken
summary: TypeBox-schema's als de enige bron van waarheid voor het Gateway-protocol
title: TypeBox
x-i18n:
    generated_at: "2026-04-29T22:41:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0496db919ee5c50a5932aa9e51eb54e1f54791bc0a271f39d6fb9e6fe17a2a28
    source_path: concepts/typebox.md
    workflow: 16
---

# TypeBox als protocol source of truth

Laatst bijgewerkt: 2026-01-10

TypeBox is een TypeScript-first schemabibliotheek. We gebruiken het om het **Gateway
WebSocket-protocol** te definiëren (handshake, verzoek/antwoord, servergebeurtenissen). Die schema's
sturen **runtimevalidatie**, **JSON Schema-export** en **Swift-codegen** voor
de macOS-app aan. Eén source of truth; al het andere wordt gegenereerd.

Als je de protocolcontext op hoger niveau wilt, begin dan met
[Gateway-architectuur](/nl/concepts/architecture).

## Mentaal model (30 seconden)

Elk Gateway WS-bericht is een van drie frames:

- **Verzoek**: `{ type: "req", id, method, params }`
- **Antwoord**: `{ type: "res", id, ok, payload | error }`
- **Gebeurtenis**: `{ type: "event", event, payload, seq?, stateVersion? }`

Het eerste frame **moet** een `connect`-verzoek zijn. Daarna kunnen clients
methoden aanroepen (bijv. `health`, `send`, `chat.send`) en zich abonneren op gebeurtenissen (bijv.
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

Veelgebruikte methoden en gebeurtenissen:

| Categorie  | Voorbeelden                                                | Opmerkingen                        |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Core       | `connect`, `health`, `status`                              | `connect` moet eerst zijn          |
| Messaging  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | neveneffecten hebben `idempotencyKey` nodig |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat gebruikt deze              |
| Sessies    | `sessions.list`, `sessions.patch`, `sessions.delete`       | sessiebeheer                       |
| Automatisering | `wake`, `cron.list`, `cron.run`, `cron.runs`           | wake + cron-besturing              |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + node-acties           |
| Gebeurtenissen | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | server-push                    |

De gezaghebbende geadverteerde **discovery**-inventaris staat in
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Waar de schema's staan

- Bron: `src/gateway/protocol/schema.ts`
- Runtimevalidators (AJV): `src/gateway/protocol/index.ts`
- Geadverteerd feature-/discovery-register: `src/gateway/server-methods-list.ts`
- Serverhandshake + methodedispatch: `src/gateway/server.impl.ts`
- Node-client: `src/gateway/client.ts`
- Gegenereerd JSON Schema: `dist/protocol.schema.json`
- Gegenereerde Swift-modellen: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Huidige pipeline

- `pnpm protocol:gen`
  - schrijft JSON Schema (draft‑07) naar `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - genereert Swift Gateway-modellen
- `pnpm protocol:check`
  - voert beide generators uit en controleert of de output is gecommit

## Hoe de schema's tijdens runtime worden gebruikt

- **Serverkant**: elk inkomend frame wordt gevalideerd met AJV. De handshake accepteert alleen
  een `connect`-verzoek waarvan de params overeenkomen met `ConnectParams`.
- **Clientkant**: de JS-client valideert gebeurtenis- en antwoordframes voordat
  ze worden gebruikt.
- **Feature discovery**: de Gateway stuurt een conservatieve lijst `features.methods`
  en `features.events` in `hello-ok` vanuit `listGatewayMethods()` en
  `GATEWAY_EVENTS`.
- Die discovery-lijst is geen gegenereerde dump van elke aanroepbare helper in
  `coreGatewayHandlers`; sommige helper-RPC's zijn geïmplementeerd in
  `src/gateway/server-methods/*.ts` zonder te worden opgesomd in de geadverteerde
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

Hello-ok-antwoord:

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

Verzoek + antwoord:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Gebeurtenis:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Minimale client (Node.js)

Kleinste bruikbare stroom: connect + health.

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

## Uitgewerkt voorbeeld: een methode end-to-end toevoegen

Voorbeeld: voeg een nieuw `system.echo`-verzoek toe dat `{ ok: true, text }` retourneert.

1. **Schema (source of truth)**

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

Voeg beide toe aan `ProtocolSchemas` en exporteer typen:

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
en voeg vervolgens `"system.echo"` toe aan de input van `listGatewayMethods` in
`src/gateway/server-methods-list.ts`.

Als de methode aanroepbaar is door operator- of node-clients, classificeer deze dan ook in
`src/gateway/method-scopes.ts` zodat scope-afdwinging en `hello-ok`-featureadvertising
op elkaar afgestemd blijven.

4. **Opnieuw genereren**

```bash
pnpm protocol:check
```

5. **Tests + docs**

Voeg een servertest toe in `src/gateway/server.*.test.ts` en vermeld de methode in de docs.

## Swift-codegen-gedrag

De Swift-generator maakt:

- `GatewayFrame`-enum met gevallen `req`, `res`, `event` en `unknown`
- Sterk getypeerde payload-structs/enums
- `ErrorCode`-waarden en `GATEWAY_PROTOCOL_VERSION`

Onbekende frametypen worden bewaard als ruwe payloads voor voorwaartse compatibiliteit.

## Versiebeheer + compatibiliteit

- `PROTOCOL_VERSION` staat in `src/gateway/protocol/schema.ts`.
- Clients sturen `minProtocol` + `maxProtocol`; de server weigert mismatches.
- De Swift-modellen behouden onbekende frametypen om te voorkomen dat oudere clients breken.

## Schemapatronen en conventies

- De meeste objecten gebruiken `additionalProperties: false` voor strikte payloads.
- `NonEmptyString` is de standaard voor ID's en methode-/gebeurtenisnamen.
- De top-level `GatewayFrame` gebruikt een **discriminator** op `type`.
- Methoden met neveneffecten vereisen meestal een `idempotencyKey` in params
  (voorbeeld: `send`, `poll`, `agent`, `chat.send`).
- `agent` accepteert optionele `internalEvents` voor tijdens runtime gegenereerde orkestratiecontext
  (bijvoorbeeld overdracht van subagent-/cron-taakvoltooiing); behandel dit als intern API-oppervlak.

## Live schema-JSON

Gegenereerd JSON Schema staat in de repo op `dist/protocol.schema.json`. Het
gepubliceerde ruwe bestand is doorgaans beschikbaar op:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Wanneer je schema's wijzigt

1. Werk de TypeBox-schema's bij.
2. Registreer de methode/gebeurtenis in `src/gateway/server-methods-list.ts`.
3. Werk `src/gateway/method-scopes.ts` bij wanneer de nieuwe RPC operator- of
   node-scopeclassificatie nodig heeft.
4. Voer `pnpm protocol:check` uit.
5. Commit het opnieuw gegenereerde schema + de Swift-modellen.

## Gerelateerd

- [Rich output-protocol](/nl/reference/rich-output-protocol)
- [RPC-adapters](/nl/reference/rpc)
