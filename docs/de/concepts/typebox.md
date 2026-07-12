---
read_when:
    - Protokollschemas oder Codegenerierung aktualisieren
summary: TypeBox-Schemas als zentrale Quelle der Wahrheit für das Gateway-Protokoll
title: TypeBox
x-i18n:
    generated_at: "2026-07-12T01:35:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox ist eine Schema-Bibliothek mit TypeScript als primärem Ansatz. OpenClaw verwendet sie zur Definition des **Gateway-WebSocket-Protokolls** (Handshake, Anfrage/Antwort, Serverereignisse). Diese Schemas steuern die **Laufzeitvalidierung** (AJV), den **JSON-Schema-Export** und die **Swift-Codegenerierung** für die macOS-App. Eine zentrale Quelle der Wahrheit; alles Weitere wird generiert.

Für den übergeordneten Protokollkontext beginnen Sie mit der [Gateway-Architektur](/de/concepts/architecture).

## Grundmodell (30 Sekunden)

Jede Gateway-WS-Nachricht ist einer von drei Frames:

- **Anfrage**: `{ type: "req", id, method, params }`
- **Antwort**: `{ type: "res", id, ok, payload | error }`
- **Ereignis**: `{ type: "event", event, payload, seq?, stateVersion? }`

Der erste Frame **muss** eine `connect`-Anfrage sein. Danach rufen Clients Methoden auf (z. B. `health`, `send`, `chat.send`) und abonnieren Ereignisse (z. B. `presence`, `tick`, `agent`).

Verbindungsablauf (minimal):

```text
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Häufige Methoden und Ereignisse:

| Kategorie    | Beispiele                                                  | Hinweise                                             |
| ------------ | ---------------------------------------------------------- | ---------------------------------------------------- |
| Kern         | `connect`, `health`, `status`                              | `connect` muss zuerst erfolgen                       |
| Nachrichten  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | Methoden mit Nebenwirkungen benötigen `idempotencyKey` |
| Chat         | `chat.history`, `chat.send`, `chat.abort`                  | WebChat verwendet diese                              |
| Sitzungen    | `sessions.list`, `sessions.patch`, `sessions.delete`       | Sitzungsverwaltung                                   |
| Automatisierung | `wake`, `cron.list`, `cron.run`, `cron.runs`            | Steuerung von Wake und Cron                          |
| Nodes        | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway-WS plus Node-Aktionen                        |
| Ereignisse   | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | Server-Push                                          |

Das maßgebliche veröffentlichte **Discovery**-Inventar befindet sich in `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Speicherort der Schemas

- Quell-Barrel: `packages/gateway-protocol/src/schema.ts` reexportiert Domänenmodule unter `packages/gateway-protocol/src/schema/*.ts` (`frames.ts` für die übergeordneten Umschläge und den Handshake, `agent.ts`, `sessions.ts`, `cron.ts` usw. je Funktionsbereich). `protocol-schemas.ts` ist die zentrale `ProtocolSchemas`-Registry, die Schemanamen ihren TypeBox-Definitionen zuordnet.
- Laufzeitvalidatoren (AJV): `packages/gateway-protocol/src/index.ts`
- Veröffentlichte Funktions-/Discovery-Registry: `src/gateway/server-methods-list.ts`
- Server-Handshake und Methodendispatch: `src/gateway/server.impl.ts`
- Node-Client: `src/gateway/client.ts`
- Generiertes JSON-Schema: `dist/protocol.schema.json` (Build-Ausgabe, nicht eingecheckt)
- Generierte Swift-Modelle: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## Aktuelle Pipeline

- `pnpm protocol:gen` schreibt das JSON-Schema (Draft-07) nach `dist/protocol.schema.json`.
- `pnpm protocol:gen:swift` generiert die Swift-Gateway-Modelle.
- `pnpm protocol:check` führt beide Generatoren aus und überprüft, ob die Swift-Ausgabe eingecheckt ist (die JSON-Schema-Ausgabe ist ein von Git ignoriertes Build-Artefakt).

## Verwendung der Schemas zur Laufzeit

- **Serverseitig**: Jeder eingehende Frame wird mit AJV validiert. Der Handshake akzeptiert nur eine `connect`-Anfrage, deren Parameter `ConnectParams` entsprechen.
- **Clientseitig**: Der JS-Client validiert Ereignis- und Antwort-Frames, bevor er sie verwendet.
- **Funktionserkennung**: Der Gateway sendet in `hello-ok` eine konservative Liste `features.methods` und `features.events`, die aus `listGatewayMethods()` und `GATEWAY_EVENTS` stammt.
- Diese Discovery-Liste ist kein generierter Auszug aller aufrufbaren Hilfsfunktionen in `coreGatewayHandlers`; einige Hilfs-RPCs sind in `src/gateway/server-methods/*.ts` implementiert, ohne in der veröffentlichten Funktionsliste aufgeführt zu sein.

## Beispiel-Frames

Verbindung (erste Nachricht):

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

`hello-ok`-Antwort:

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

Kleinster sinnvoller Ablauf: Verbindung + Integritätsprüfung.

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

## Durchgängiges Beispiel: Eine Methode hinzufügen

Beispiel: Fügen Sie eine neue `system.echo`-Anfrage hinzu, die `{ ok: true, text }` zurückgibt.

1. **Schema (Quelle der Wahrheit)**

Fügen Sie Folgendes zu `packages/gateway-protocol/src/schema/system.ts` (oder dem am besten passenden Funktionsmodul) hinzu:

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

Importieren Sie beide in `packages/gateway-protocol/src/schema/protocol-schemas.ts`, fügen Sie sie der `ProtocolSchemas`-Registry hinzu und exportieren Sie die abgeleiteten Typen:

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

Fügen Sie in `src/gateway/server-methods/system.ts` einen Handler hinzu:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Registrieren Sie ihn in `src/gateway/server-methods.ts` (führt `systemHandlers` bereits zusammen) und fügen Sie anschließend `"system.echo"` zur Eingabe von `listGatewayMethods` in `src/gateway/server-methods-list.ts` hinzu.

Wenn die Methode von Operator- oder Node-Clients aufgerufen werden kann, klassifizieren Sie sie außerdem in `src/gateway/method-scopes.ts`, damit die Bereichserzwingung und die Funktionsankündigung in `hello-ok` synchron bleiben.

4. **Neu generieren**

```bash
pnpm protocol:check
```

5. **Tests und Dokumentation**

Fügen Sie einen Servertest in `src/gateway/server.*.test.ts` hinzu und dokumentieren Sie die Methode.

## Verhalten der Swift-Codegenerierung

Der Swift-Generator erzeugt:

- ein `GatewayFrame`-Enum mit den Fällen `req`, `res`, `event` und `unknown`
- stark typisierte Payload-Strukturen und -Enums
- `ErrorCode`-Werte, `GATEWAY_PROTOCOL_VERSION` und `GATEWAY_MIN_PROTOCOL_VERSION`

Unbekannte Frame-Typen werden zur Vorwärtskompatibilität als rohe Payloads beibehalten.

## Versionierung und Kompatibilität

- `PROTOCOL_VERSION` befindet sich in `packages/gateway-protocol/src/version.ts` (aktueller Wert: `4`).
- Clients senden `minProtocol` und `maxProtocol`; der Server lehnt Bereiche ab, die sein aktuelles Protokoll nicht einschließen.
- Die Swift-Modelle behalten unbekannte Frame-Typen bei, um ältere Clients nicht zu beeinträchtigen.

## Schemamuster und Konventionen

- Die meisten Objekte verwenden `additionalProperties: false` für strikt definierte Payloads.
- `NonEmptyString` (`Type.String({ minLength: 1 })`) ist der Standard für IDs sowie Methoden- und Ereignisnamen.
- Der übergeordnete `GatewayFrame` verwendet einen **Diskriminator** für `type`.
- Methoden mit Nebenwirkungen erfordern üblicherweise einen `idempotencyKey` in den Parametern (Beispiel: `send`, `poll`, `agent`, `chat.send`).
- `agent` akzeptiert optionale `internalEvents` für einen zur Laufzeit generierten Orchestrierungskontext (zum Beispiel die Übergabe nach Abschluss einer Subagenten- oder Cron-Aufgabe); behandeln Sie dies als interne API-Oberfläche.

## Aktuelles Schema-JSON

Das generierte JSON-Schema ist ein Build-Artefakt und wird nicht in das Repository eingecheckt. Die veröffentlichte Rohdatei ist normalerweise hier verfügbar:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Wenn Sie Schemas ändern

1. Aktualisieren Sie die TypeBox-Schemas im zuständigen Modul `packages/gateway-protocol/src/schema/*.ts` und registrieren Sie sie in `protocol-schemas.ts`.
2. Registrieren Sie die Methode bzw. das Ereignis in `src/gateway/server-methods-list.ts`.
3. Aktualisieren Sie `src/gateway/method-scopes.ts`, wenn der neue RPC eine Klassifizierung für den Operator- oder Node-Bereich benötigt.
4. Führen Sie `pnpm protocol:check` aus.
5. Checken Sie die neu generierten Swift-Modelle ein.

## Verwandte Themen

- [Protokoll für umfangreiche Ausgaben](/de/reference/rich-output-protocol)
- [RPC-Adapter](/de/reference/rpc)
