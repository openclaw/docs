---
read_when:
    - Protokollschemata oder Codegenerierung aktualisieren
summary: TypeBox-Schemata als alleinige maßgebliche Quelle für das Gateway-Protokoll
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T06:46:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e188ec0fefcbaf01c8b575a1898eafbbcf309d3032930aa0c09c2d9a63b93e5
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox ist eine TypeScript-first-Schemabibliothek. Wir verwenden sie, um das **Gateway
WebSocket-Protokoll** zu definieren (Handshake, Anfrage/Antwort, Serverereignisse). Diese Schemas
steuern **Laufzeitvalidierung**, **JSON-Schema-Export** und **Swift-Codegenerierung** für
die macOS-App. Eine einzige Quelle der Wahrheit; alles andere wird generiert.

Wenn Sie den übergeordneten Protokollkontext möchten, beginnen Sie mit der
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

Gängige Methoden und Ereignisse:

| Kategorie  | Beispiele                                                  | Hinweise                           |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Kern       | `connect`, `health`, `status`                              | `connect` muss zuerst erfolgen     |
| Messaging  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | Nebeneffekte benötigen `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat verwendet diese            |
| Sitzungen  | `sessions.list`, `sessions.patch`, `sessions.delete`       | Sitzungsadministration             |
| Automatisierung | `wake`, `cron.list`, `cron.run`, `cron.runs`          | Wake- und Cron-Steuerung           |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway-WS- und Node-Aktionen      |
| Ereignisse | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | Server-Push                        |

Das maßgebliche beworbene **Discovery**-Inventar befindet sich in
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Speicherort der Schemas

- Quelle: `src/gateway/protocol/schema.ts`
- Laufzeitvalidatoren (AJV): `src/gateway/protocol/index.ts`
- Beworbenes Feature-/Discovery-Register: `src/gateway/server-methods-list.ts`
- Server-Handshake und Methodendispatch: `src/gateway/server.impl.ts`
- Node-Client: `src/gateway/client.ts`
- Generiertes JSON-Schema: `dist/protocol.schema.json`
- Generierte Swift-Modelle: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Aktuelle Pipeline

- `pnpm protocol:gen`
  - schreibt JSON-Schema (Draft-07) nach `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - generiert Swift-Gateway-Modelle
- `pnpm protocol:check`
  - führt beide Generatoren aus und überprüft, ob die Ausgabe committet ist

## Wie die Schemas zur Laufzeit verwendet werden

- **Serverseitig**: Jeder eingehende Frame wird mit AJV validiert. Der Handshake akzeptiert nur
  eine `connect`-Anfrage, deren Parameter `ConnectParams` entsprechen.
- **Clientseitig**: Der JS-Client validiert Ereignis- und Antwort-Frames, bevor
  er sie verwendet.
- **Feature-Discovery**: Das Gateway sendet eine konservative Liste `features.methods`
  und `features.events` in `hello-ok` aus `listGatewayMethods()` und
  `GATEWAY_EVENTS`.
- Diese Discovery-Liste ist kein generierter Dump aller aufrufbaren Hilfsfunktionen in
  `coreGatewayHandlers`; einige Hilfs-RPCs sind in
  `src/gateway/server-methods/*.ts` implementiert, ohne in der beworbenen
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

Hello-ok-Antwort:

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

Anfrage und Antwort:

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

Kleinster nützlicher Ablauf: verbinden und Health prüfen.

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

## Ausgearbeitetes Beispiel: eine Methode Ende-zu-Ende hinzufügen

Beispiel: Fügen Sie eine neue `system.echo`-Anfrage hinzu, die `{ ok: true, text }` zurückgibt.

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
und fügen Sie anschließend `"system.echo"` zur Eingabe von `listGatewayMethods` in
`src/gateway/server-methods-list.ts` hinzu.

Wenn die Methode von Operator- oder Node-Clients aufrufbar ist, klassifizieren Sie sie außerdem in
`src/gateway/method-scopes.ts`, damit Scope-Erzwingung und `hello-ok`-Feature-Werbung
abgestimmt bleiben.

4. **Neu generieren**

```bash
pnpm protocol:check
```

5. **Tests und Dokumentation**

Fügen Sie einen Servertest in `src/gateway/server.*.test.ts` hinzu und erwähnen Sie die Methode in der Dokumentation.

## Verhalten der Swift-Codegenerierung

Der Swift-Generator gibt Folgendes aus:

- `GatewayFrame`-Enum mit den Fällen `req`, `res`, `event` und `unknown`
- Stark typisierte Payload-Structs/-Enums
- `ErrorCode`-Werte und `GATEWAY_PROTOCOL_VERSION`

Unbekannte Frame-Typen werden für Vorwärtskompatibilität als Roh-Payloads beibehalten.

## Versionierung und Kompatibilität

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/schema.ts`.
- Clients senden `minProtocol` und `maxProtocol`; der Server weist Abweichungen zurück.
- Die Swift-Modelle behalten unbekannte Frame-Typen bei, um ältere Clients nicht zu beschädigen.

## Schemamuster und Konventionen

- Die meisten Objekte verwenden `additionalProperties: false` für strikte Payloads.
- `NonEmptyString` ist der Standard für IDs sowie Methoden- und Ereignisnamen.
- Das Top-Level-`GatewayFrame` verwendet einen **Diskriminator** auf `type`.
- Methoden mit Nebeneffekten erfordern in der Regel einen `idempotencyKey` in den Parametern
  (Beispiel: `send`, `poll`, `agent`, `chat.send`).
- `agent` akzeptiert optional `internalEvents` für laufzeitgenerierten Orchestrierungskontext
  (zum Beispiel Übergabe nach Abschluss von Subagent-/Cron-Aufgaben); behandeln Sie dies als interne API-Oberfläche.

## Live-Schema-JSON

Das generierte JSON-Schema befindet sich im Repo unter `dist/protocol.schema.json`. Die
veröffentlichte Rohdatei ist normalerweise verfügbar unter:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Wenn Sie Schemas ändern

1. Aktualisieren Sie die TypeBox-Schemas.
2. Registrieren Sie die Methode/das Ereignis in `src/gateway/server-methods-list.ts`.
3. Aktualisieren Sie `src/gateway/method-scopes.ts`, wenn der neue RPC eine Operator- oder
   Node-Scope-Klassifizierung benötigt.
4. Führen Sie `pnpm protocol:check` aus.
5. Committen Sie das neu generierte Schema und die Swift-Modelle.

## Verwandte Themen

- [Rich-Output-Protokoll](/de/reference/rich-output-protocol)
- [RPC-Adapter](/de/reference/rpc)
