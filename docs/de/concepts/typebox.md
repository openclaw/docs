---
read_when:
    - Protokollschemata oder Codegen aktualisieren
summary: TypeBox-Schemas als Single Source of Truth für das Gateway-Protokoll
title: TypeBox
x-i18n:
    generated_at: "2026-06-27T17:26:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2f3da11e9dcf3250fd77e0c43f4ed918551a536d93fa71bce95eaf3d7539f6d
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox ist eine TypeScript-first-Schemabibliothek. Wir verwenden sie, um das **Gateway-
WebSocket-Protokoll** zu definieren (Handshake, Anfrage/Antwort, Serverereignisse). Diese Schemata
steuern **Laufzeitvalidierung**, **JSON-Schema-Export** und **Swift-Codegenerierung** für
die macOS-App. Eine einzige Quelle der Wahrheit; alles andere wird generiert.

Wenn Sie den übergeordneten Protokollkontext wünschen, beginnen Sie mit
[Gateway-Architektur](/de/concepts/architecture).

## Mentales Modell (30 Sekunden)

Jede Gateway-WS-Nachricht ist einer von drei Frames:

- **Anfrage**: `{ type: "req", id, method, params }`
- **Antwort**: `{ type: "res", id, ok, payload | error }`
- **Ereignis**: `{ type: "event", event, payload, seq?, stateVersion? }`

Der erste Frame **muss** eine `connect`-Anfrage sein. Danach können Clients
Methoden aufrufen (z. B. `health`, `send`, `chat.send`) und Ereignisse abonnieren (z. B.
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

Gängige Methoden + Ereignisse:

| Kategorie  | Beispiele                                                  | Hinweise                           |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Kern       | `connect`, `health`, `status`                              | `connect` muss zuerst kommen       |
| Messaging  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | Seiteneffekte benötigen `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat verwendet diese            |
| Sitzungen  | `sessions.list`, `sessions.patch`, `sessions.delete`       | Sitzungsverwaltung                 |
| Automatisierung | `wake`, `cron.list`, `cron.run`, `cron.runs`          | Wake- + Cron-Steuerung             |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway-WS + Node-Aktionen         |
| Ereignisse | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | Server-Push                        |

Das maßgebliche angekündigte **Discovery**-Inventar befindet sich in
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Wo die Schemata liegen

- Quelle: `packages/gateway-protocol/src/schema.ts`
- Laufzeit-Validatoren (AJV): `packages/gateway-protocol/src/index.ts`
- Angekündigte Feature-/Discovery-Registry: `src/gateway/server-methods-list.ts`
- Server-Handshake + Methoden-Dispatch: `src/gateway/server.impl.ts`
- Node-Client: `src/gateway/client.ts`
- Generiertes JSON-Schema: `dist/protocol.schema.json`
- Generierte Swift-Modelle: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Aktuelle Pipeline

- `pnpm protocol:gen`
  - schreibt JSON-Schema (draft-07) nach `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - generiert Swift-Gateway-Modelle
- `pnpm protocol:check`
  - führt beide Generatoren aus und prüft, ob die Ausgabe committet ist

## Wie die Schemata zur Laufzeit verwendet werden

- **Serverseitig**: Jeder eingehende Frame wird mit AJV validiert. Der Handshake akzeptiert nur
  eine `connect`-Anfrage, deren Parameter `ConnectParams` entsprechen.
- **Clientseitig**: Der JS-Client validiert Ereignis- und Antwort-Frames, bevor
  er sie verwendet.
- **Feature-Discovery**: Das Gateway sendet eine konservative `features.methods`-
  und `features.events`-Liste in `hello-ok` aus `listGatewayMethods()` und
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

Hello-ok-Antwort:

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

Anfrage + Antwort:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Ereignis:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Minimaler Client (Node.js)

Kleinster sinnvoller Ablauf: Connect + Health.

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

## Durchgearbeitetes Beispiel: Eine Methode vollständig hinzufügen

Beispiel: Fügen Sie eine neue `system.echo`-Anfrage hinzu, die `{ ok: true, text }` zurückgibt.

1. **Schema (Quelle der Wahrheit)**

Zu `packages/gateway-protocol/src/schema.ts` hinzufügen:

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

Beide zu `ProtocolSchemas` hinzufügen und Typen exportieren:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validierung**

Exportieren Sie in `packages/gateway-protocol/src/index.ts` einen AJV-Validator:

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
und fügen Sie dann `"system.echo"` zur Eingabe von `listGatewayMethods` in
`src/gateway/server-methods-list.ts` hinzu.

Wenn die Methode durch Operator- oder Node-Clients aufrufbar ist, klassifizieren Sie sie außerdem in
`src/gateway/method-scopes.ts`, damit Scope-Durchsetzung und `hello-ok`-Feature-
Ankündigung aufeinander abgestimmt bleiben.

4. **Neu generieren**

```bash
pnpm protocol:check
```

5. **Tests + Dokumentation**

Fügen Sie einen Servertest in `src/gateway/server.*.test.ts` hinzu und erwähnen Sie die Methode in der Dokumentation.

## Swift-Codegenerierungsverhalten

Der Swift-Generator erzeugt:

- `GatewayFrame`-Enum mit den Fällen `req`, `res`, `event` und `unknown`
- Stark typisierte Payload-Structs/-Enums
- `ErrorCode`-Werte, `GATEWAY_PROTOCOL_VERSION` und `GATEWAY_MIN_PROTOCOL_VERSION`

Unbekannte Frame-Typen werden für Vorwärtskompatibilität als rohe Payloads beibehalten.

## Versionierung + Kompatibilität

- `PROTOCOL_VERSION` befindet sich in `packages/gateway-protocol/src/version.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server weist Bereiche zurück, die
  sein aktuelles Protokoll nicht enthalten.
- Die Swift-Modelle behalten unbekannte Frame-Typen bei, um ältere Clients nicht zu beschädigen.

## Schemamuster und Konventionen

- Die meisten Objekte verwenden `additionalProperties: false` für strikte Payloads.
- `NonEmptyString` ist der Standard für IDs und Methoden-/Ereignisnamen.
- Das oberste `GatewayFrame` verwendet einen **Discriminator** auf `type`.
- Methoden mit Seiteneffekten erfordern normalerweise einen `idempotencyKey` in den Parametern
  (Beispiel: `send`, `poll`, `agent`, `chat.send`).
- `agent` akzeptiert optionale `internalEvents` für zur Laufzeit generierten Orchestrierungskontext
  (zum Beispiel Übergabe bei Abschluss von Subagent-/Cron-Aufgaben); behandeln Sie dies als interne API-Oberfläche.

## Live-Schema-JSON

Das generierte JSON-Schema liegt im Repo unter `dist/protocol.schema.json`. Die
veröffentlichte Rohdatei ist typischerweise verfügbar unter:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Wenn Sie Schemata ändern

1. Aktualisieren Sie die TypeBox-Schemata.
2. Registrieren Sie die Methode/das Ereignis in `src/gateway/server-methods-list.ts`.
3. Aktualisieren Sie `src/gateway/method-scopes.ts`, wenn der neue RPC eine Klassifizierung für Operator-
   oder Node-Scope benötigt.
4. Führen Sie `pnpm protocol:check` aus.
5. Committen Sie das neu generierte Schema + die Swift-Modelle.

## Verwandte Themen

- [Rich-Output-Protokoll](/de/reference/rich-output-protocol)
- [RPC-Adapter](/de/reference/rpc)
