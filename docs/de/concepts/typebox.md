---
read_when:
    - Protokollschemata oder Codegenerierung aktualisieren
summary: TypeBox-Schemata als einzige maßgebliche Quelle für das Gateway-Protokoll
title: TypeBox
x-i18n:
    generated_at: "2026-05-07T13:15:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95baccfdfa6f77ba57f6ac8502d502084289a84cfd03a450dd1e9422931706dd
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox ist eine TypeScript-first-Schemabibliothek. Wir verwenden sie, um das **Gateway
WebSocket-Protokoll** zu definieren (Handshake, Request/Response, Server-Events). Diese Schemas
steuern **Laufzeitvalidierung**, **JSON Schema-Export** und **Swift-Codegen** für
die macOS-App. Eine einzige Quelle der Wahrheit; alles andere wird generiert.

Wenn Sie den übergeordneten Protokollkontext möchten, beginnen Sie mit
[Gateway-Architektur](/de/concepts/architecture).

## Mentales Modell (30 Sekunden)

Jede Gateway-WS-Nachricht ist einer von drei Frames:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

Der erste Frame **muss** ein `connect`-Request sein. Danach können Clients
Methoden aufrufen (z. B. `health`, `send`, `chat.send`) und Events abonnieren (z. B.
`presence`, `tick`, `agent`).

Verbindungsablauf (minimal):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Häufige Methoden + Events:

| Kategorie      | Beispiele                                                  | Hinweise                                   |
| -------------- | ---------------------------------------------------------- | ------------------------------------------ |
| Kern           | `connect`, `health`, `status`                              | `connect` muss zuerst kommen               |
| Messaging      | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | Seiteneffekte benötigen `idempotencyKey`   |
| Chat           | `chat.history`, `chat.send`, `chat.abort`                  | WebChat verwendet diese                    |
| Sitzungen      | `sessions.list`, `sessions.patch`, `sessions.delete`       | Sitzungsadministration                     |
| Automatisierung | `wake`, `cron.list`, `cron.run`, `cron.runs`              | Wake + Cron-Steuerung                      |
| Nodes          | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway-WS + Node-Aktionen                 |
| Events         | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | Server-Push                                |

Das maßgebliche angekündigte **Discovery**-Inventar befindet sich in
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Wo die Schemas liegen

- Quelle: `src/gateway/protocol/schema.ts`
- Laufzeitvalidatoren (AJV): `src/gateway/protocol/index.ts`
- Registry für angekündigte Features/Discovery: `src/gateway/server-methods-list.ts`
- Server-Handshake + Methodendispatch: `src/gateway/server.impl.ts`
- Node-Client: `src/gateway/client.ts`
- Generiertes JSON Schema: `dist/protocol.schema.json`
- Generierte Swift-Modelle: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Aktuelle Pipeline

- `pnpm protocol:gen`
  - schreibt JSON Schema (draft-07) nach `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - generiert Swift-Gateway-Modelle
- `pnpm protocol:check`
  - führt beide Generatoren aus und prüft, dass die Ausgabe committed ist

## Wie die Schemas zur Laufzeit verwendet werden

- **Serverseitig**: Jeder eingehende Frame wird mit AJV validiert. Der Handshake akzeptiert nur
  ein `connect`-Request, dessen Params `ConnectParams` entsprechen.
- **Clientseitig**: Der JS-Client validiert Event- und Response-Frames, bevor
  er sie verwendet.
- **Feature Discovery**: Das Gateway sendet eine konservative Liste `features.methods`
  und `features.events` in `hello-ok` aus `listGatewayMethods()` und
  `GATEWAY_EVENTS`.
- Diese Discovery-Liste ist kein generierter Dump jedes aufrufbaren Helpers in
  `coreGatewayHandlers`; einige Helper-RPCs sind in
  `src/gateway/server-methods/*.ts` implementiert, ohne in der angekündigten
  Feature-Liste aufgeführt zu sein.

## Beispiel-Frames

Connect (erste Nachricht):

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

Hello-ok-Response:

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

Request + Response:

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

## Minimaler Client (Node.js)

Kleinster sinnvoller Ablauf: connect + health.

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

## Durchgearbeitetes Beispiel: eine Methode end-to-end hinzufügen

Beispiel: Fügen Sie ein neues `system.echo`-Request hinzu, das `{ ok: true, text }` zurückgibt.

1. **Schema (Quelle der Wahrheit)**

Zu `src/gateway/protocol/schema.ts` hinzufügen:

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

Beides zu `ProtocolSchemas` hinzufügen und Typen exportieren:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validierung**

Exportieren Sie in `src/gateway/protocol/index.ts` einen AJV-Validator:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Serververhalten**

Fügen Sie einen Handler in `src/gateway/server-methods/system.ts` hinzu:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Registrieren Sie ihn in `src/gateway/server-methods.ts` (führt `systemHandlers` bereits zusammen),
fügen Sie dann `"system.echo"` zur Eingabe von `listGatewayMethods` in
`src/gateway/server-methods-list.ts` hinzu.

Wenn die Methode von Operator- oder Node-Clients aufrufbar ist, klassifizieren Sie sie außerdem in
`src/gateway/method-scopes.ts`, damit Scope-Erzwingung und `hello-ok`-Feature-Ankündigung
abgeglichen bleiben.

4. **Neu generieren**

```bash
pnpm protocol:check
```

5. **Tests + Dokumentation**

Fügen Sie einen Servertest in `src/gateway/server.*.test.ts` hinzu und erwähnen Sie die Methode in der Dokumentation.

## Verhalten des Swift-Codegen

Der Swift-Generator gibt Folgendes aus:

- `GatewayFrame`-Enum mit `req`-, `res`-, `event`- und `unknown`-Fällen
- Stark typisierte Payload-Structs/-Enums
- `ErrorCode`-Werte und `GATEWAY_PROTOCOL_VERSION`

Unbekannte Frame-Typen werden für Vorwärtskompatibilität als Raw-Payloads beibehalten.

## Versionierung + Kompatibilität

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/version.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Nichtübereinstimmungen ab.
- Die Swift-Modelle behalten unbekannte Frame-Typen bei, um ältere Clients nicht zu brechen.

## Schemamuster und Konventionen

- Die meisten Objekte verwenden `additionalProperties: false` für strikte Payloads.
- `NonEmptyString` ist der Standard für IDs und Methoden-/Event-Namen.
- Das Top-Level-`GatewayFrame` verwendet einen **Discriminator** auf `type`.
- Methoden mit Seiteneffekten erfordern in den Params normalerweise ein `idempotencyKey`
  (Beispiel: `send`, `poll`, `agent`, `chat.send`).
- `agent` akzeptiert optionale `internalEvents` für zur Laufzeit generierten Orchestrierungskontext
  (zum Beispiel Übergabe beim Abschluss von Subagent-/Cron-Aufgaben); behandeln Sie dies als interne API-Oberfläche.

## Live-Schema-JSON

Generiertes JSON Schema befindet sich im Repo unter `dist/protocol.schema.json`. Die
veröffentlichte Raw-Datei ist normalerweise verfügbar unter:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Wenn Sie Schemas ändern

1. Aktualisieren Sie die TypeBox-Schemas.
2. Registrieren Sie die Methode/das Event in `src/gateway/server-methods-list.ts`.
3. Aktualisieren Sie `src/gateway/method-scopes.ts`, wenn der neue RPC eine Operator- oder
   Node-Scope-Klassifizierung benötigt.
4. Führen Sie `pnpm protocol:check` aus.
5. Committen Sie das neu generierte Schema + die Swift-Modelle.

## Verwandt

- [Rich-Output-Protokoll](/de/reference/rich-output-protocol)
- [RPC-Adapter](/de/reference/rpc)
