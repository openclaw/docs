---
read_when:
    - Protocolschema's of codegeneratie bijwerken
summary: TypeBox-schema's als enige bron van waarheid voor het Gateway-protocol
title: TypeBox
x-i18n:
    generated_at: "2026-07-12T08:49:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox is een schema-bibliotheek die primair voor TypeScript is ontworpen. OpenClaw gebruikt deze om het **Gateway WebSocket-protocol** te definiëren (handshake, verzoek/antwoord, servergebeurtenissen). Deze schema's sturen **runtimevalidatie** (AJV), **JSON Schema-export** en **Swift-codegeneratie** voor de macOS-app aan. Eén bron van waarheid; al het overige wordt gegenereerd.

Begin voor de protocolcontext op een hoger niveau bij [Gateway-architectuur](/nl/concepts/architecture).

## Mentaal model (30 seconden)

Elk Gateway WS-bericht is een van drie frames:

- **Verzoek**: `{ type: "req", id, method, params }`
- **Antwoord**: `{ type: "res", id, ok, payload | error }`
- **Gebeurtenis**: `{ type: "event", event, payload, seq?, stateVersion? }`

Het eerste frame **moet** een `connect`-verzoek zijn. Daarna roepen clients methoden aan (bijvoorbeeld `health`, `send`, `chat.send`) en abonneren ze zich op gebeurtenissen (bijvoorbeeld `presence`, `tick`, `agent`).

Verbindingsverloop (minimaal):

```text
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Veelgebruikte methoden en gebeurtenissen:

| Categorie  | Voorbeelden                                                 | Opmerkingen                                              |
| ---------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| Kern       | `connect`, `health`, `status`                               | `connect` moet als eerste komen                          |
| Berichten  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail`  | methoden met neveneffecten vereisen `idempotencyKey`     |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                   | WebChat gebruikt deze                                    |
| Sessies    | `sessions.list`, `sessions.patch`, `sessions.delete`        | sessiebeheer                                              |
| Automatisering | `wake`, `cron.list`, `cron.run`, `cron.runs`            | beheer van wake en Cron                                  |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                   | Gateway WS plus Node-acties                              |
| Gebeurtenissen | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | pushberichten van de server                           |

De gezaghebbende gepubliceerde **detectie-inventaris** staat in `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Waar de schema's staan

- Bron-barrel: `packages/gateway-protocol/src/schema.ts` exporteert domeinmodules onder `packages/gateway-protocol/src/schema/*.ts` opnieuw (`frames.ts` voor de enveloppen en handshake op het hoogste niveau, `agent.ts`, `sessions.ts`, `cron.ts` enzovoort per functiegebied). `protocol-schemas.ts` is het centrale `ProtocolSchemas`-register dat schemanamen aan hun TypeBox-definities koppelt.
- Runtimevalidators (AJV): `packages/gateway-protocol/src/index.ts`
- Gepubliceerd functie-/detectieregister: `src/gateway/server-methods-list.ts`
- Serverhandshake en methodedispatch: `src/gateway/server.impl.ts`
- Node-client: `src/gateway/client.ts`
- Gegenereerd JSON Schema: `dist/protocol.schema.json` (builduitvoer, niet gecommit)
- Gegenereerde Swift-modellen: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## Huidige pijplijn

- `pnpm protocol:gen` schrijft JSON Schema (draft-07) naar `dist/protocol.schema.json`.
- `pnpm protocol:gen:swift` genereert de Swift Gateway-modellen.
- `pnpm protocol:check` voert beide generatoren uit en controleert of de Swift-uitvoer is gecommit (de JSON Schema-uitvoer is een door Git genegeerd buildartefact).

## Hoe de schema's tijdens runtime worden gebruikt

- **Serverzijde**: elk inkomend frame wordt met AJV gevalideerd. De handshake accepteert alleen een `connect`-verzoek waarvan de parameters overeenkomen met `ConnectParams`.
- **Clientzijde**: de JS-client valideert gebeurtenis- en antwoordframes voordat deze worden gebruikt.
- **Functiedetectie**: de Gateway stuurt in `hello-ok` een conservatieve lijst `features.methods` en `features.events`, afkomstig van `listGatewayMethods()` en `GATEWAY_EVENTS`.
- Deze detectielijst is geen gegenereerde dump van elke aanroepbare helper in `coreGatewayHandlers`; sommige helper-RPC's zijn geïmplementeerd in `src/gateway/server-methods/*.ts` zonder dat ze in de gepubliceerde functielijst worden vermeld.

## Voorbeeldframes

Verbinding maken (eerste bericht):

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

`hello-ok`-antwoord:

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

Verzoek en antwoord:

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

Kleinste bruikbare verloop: verbinden + statuscontrole.

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

## Uitgewerkt voorbeeld: een methode van begin tot eind toevoegen

Voorbeeld: voeg een nieuw `system.echo`-verzoek toe dat `{ ok: true, text }` retourneert.

1. **Schema (bron van waarheid)**

Voeg dit toe aan `packages/gateway-protocol/src/schema/system.ts` (of de functie-module die het beste overeenkomt):

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

Importeer beide in `packages/gateway-protocol/src/schema/protocol-schemas.ts`, voeg ze toe aan het `ProtocolSchemas`-register en exporteer de afgeleide typen:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validatie**

Exporteer in `packages/gateway-protocol/src/index.ts` een AJV-validator:

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

Registreer deze in `src/gateway/server-methods.ts` (voegt `systemHandlers` al samen) en voeg vervolgens `"system.echo"` toe aan de invoer van `listGatewayMethods` in `src/gateway/server-methods-list.ts`.

Als de methode kan worden aangeroepen door operator- of Node-clients, classificeer deze dan ook in `src/gateway/method-scopes.ts`, zodat scopehandhaving en de functiepublicatie in `hello-ok` op elkaar afgestemd blijven.

4. **Opnieuw genereren**

```bash
pnpm protocol:check
```

5. **Tests en documentatie**

Voeg een servertest toe in `src/gateway/server.*.test.ts` en vermeld de methode in de documentatie.

## Gedrag van Swift-codegeneratie

De Swift-generator produceert:

- een `GatewayFrame`-enum met de gevallen `req`, `res`, `event` en `unknown`
- sterk getypeerde payloadstructuren/-enums
- `ErrorCode`-waarden, `GATEWAY_PROTOCOL_VERSION` en `GATEWAY_MIN_PROTOCOL_VERSION`

Onbekende frametypen blijven als ruwe payloads behouden voor voorwaartse compatibiliteit.

## Versiebeheer en compatibiliteit

- `PROTOCOL_VERSION` staat in `packages/gateway-protocol/src/version.ts` (huidige waarde: `4`).
- Clients sturen `minProtocol` en `maxProtocol`; de server weigert bereiken die het huidige protocol niet bevatten.
- De Swift-modellen behouden onbekende frametypen om te voorkomen dat oudere clients niet meer werken.

## Schemapatronen en conventies

- De meeste objecten gebruiken `additionalProperties: false` voor strikte payloads.
- `NonEmptyString` (`Type.String({ minLength: 1 })`) is de standaard voor ID's en methode-/gebeurtenisnamen.
- `GatewayFrame` op het hoogste niveau gebruikt een **discriminator** voor `type`.
- Methoden met neveneffecten vereisen doorgaans een `idempotencyKey` in de parameters (voorbeeld: `send`, `poll`, `agent`, `chat.send`).
- `agent` accepteert optioneel `internalEvents` voor tijdens runtime gegenereerde orkestratiecontext (bijvoorbeeld de overdracht bij voltooiing van een subagent-/Cron-taak); behandel dit als een intern API-oppervlak.

## Live schema-JSON

Het gegenereerde JSON Schema is een buildartefact en wordt niet in de repository gecommit. Het gepubliceerde onbewerkte bestand is doorgaans beschikbaar op:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Wanneer u schema's wijzigt

1. Werk de TypeBox-schema's bij in de verantwoordelijke module `packages/gateway-protocol/src/schema/*.ts` en registreer ze in `protocol-schemas.ts`.
2. Registreer de methode/gebeurtenis in `src/gateway/server-methods-list.ts`.
3. Werk `src/gateway/method-scopes.ts` bij wanneer de nieuwe RPC een scopeclassificatie voor operator of Node vereist.
4. Voer `pnpm protocol:check` uit.
5. Commit de opnieuw gegenereerde Swift-modellen.

## Gerelateerd

- [Protocol voor rijke uitvoer](/nl/reference/rich-output-protocol)
- [RPC-adapters](/nl/reference/rpc)
