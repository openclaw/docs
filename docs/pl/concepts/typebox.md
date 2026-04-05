---
read_when:
    - Aktualizujesz schematy protokołu lub codegen
summary: Schematy TypeBox jako jedyne źródło prawdy dla protokołu gateway
title: TypeBox
x-i18n:
    generated_at: "2026-04-05T13:52:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f508523998f94d12fbd6ce98d8a7d49fa641913196a4ab7b01f91f83c01c7eb
    source_path: concepts/typebox.md
    workflow: 15
---

# TypeBox jako źródło prawdy protokołu

Ostatnia aktualizacja: 2026-01-10

TypeBox to biblioteka schematów stworzona z myślą o TypeScript. Używamy jej do definiowania **protokołu WebSocket Gateway**
(handshake, request/response, zdarzenia serwera). Te schematy napędzają **walidację w runtime**, **eksport JSON Schema** oraz **Swift codegen** dla
aplikacji macOS. Jedno źródło prawdy; wszystko inne jest generowane.

Jeśli chcesz zacząć od kontekstu protokołu na wyższym poziomie, zacznij od
[Gateway architecture](/concepts/architecture).

## Model mentalny (30 sekund)

Każda wiadomość Gateway WS jest jedną z trzech ramek:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

Pierwsza ramka **musi** być requestem `connect`. Po tym klienci mogą wywoływać
metody (na przykład `health`, `send`, `chat.send`) i subskrybować zdarzenia (na przykład
`presence`, `tick`, `agent`).

Przepływ połączenia (minimalny):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Typowe metody + zdarzenia:

| Kategoria   | Przykłady                                                  | Uwagi                              |
| ----------- | ---------------------------------------------------------- | ---------------------------------- |
| Podstawowe  | `connect`, `health`, `status`                              | `connect` musi być pierwsze        |
| Wiadomości  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | efekty uboczne wymagają `idempotencyKey` |
| Czat        | `chat.history`, `chat.send`, `chat.abort`                  | WebChat ich używa                  |
| Sesje       | `sessions.list`, `sessions.patch`, `sessions.delete`       | administracja sesjami              |
| Automatyzacja | `wake`, `cron.list`, `cron.run`, `cron.runs`             | sterowanie wake + cron             |
| Węzły       | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + działania węzłów      |
| Zdarzenia   | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push serwera                       |

Autorytatywny reklamowany inwentarz **discovery** znajduje się w
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Gdzie znajdują się schematy

- Źródło: `src/gateway/protocol/schema.ts`
- Walidatory runtime (AJV): `src/gateway/protocol/index.ts`
- Rejestr reklamowanych funkcji/discovery: `src/gateway/server-methods-list.ts`
- Handshake serwera + dyspozycja metod: `src/gateway/server.impl.ts`
- Klient węzła: `src/gateway/client.ts`
- Wygenerowany JSON Schema: `dist/protocol.schema.json`
- Wygenerowane modele Swift: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Obecny pipeline

- `pnpm protocol:gen`
  - zapisuje JSON Schema (draft‑07) do `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - generuje modele gateway w Swift
- `pnpm protocol:check`
  - uruchamia oba generatory i sprawdza, czy wynik został zapisany w commicie

## Jak schematy są używane w runtime

- **Po stronie serwera**: każda przychodząca ramka jest walidowana przez AJV. Handshake
  akceptuje tylko request `connect`, którego params pasują do `ConnectParams`.
- **Po stronie klienta**: klient JS waliduje ramki zdarzeń i odpowiedzi przed
  ich użyciem.
- **Discovery funkcji**: Gateway wysyła zachowawczą listę `features.methods`
  i `features.events` w `hello-ok` z `listGatewayMethods()` i
  `GATEWAY_EVENTS`.
- Ta lista discovery nie jest wygenerowanym zrzutem każdego pomocniczego wywołania
  dostępnego w `coreGatewayHandlers`; niektóre pomocnicze RPC są implementowane w
  `src/gateway/server-methods/*.ts`, ale nie są wyliczane na reklamowanej
  liście funkcji.

## Przykładowe ramki

Connect (pierwsza wiadomość):

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

Odpowiedź hello-ok:

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

Zdarzenie:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Minimalny klient (Node.js)

Najmniejszy użyteczny przepływ: connect + health.

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

## Przykład krok po kroku: dodanie metody end-to-end

Przykład: dodaj nowy request `system.echo`, który zwraca `{ ok: true, text }`.

1. **Schemat (źródło prawdy)**

Dodaj do `src/gateway/protocol/schema.ts`:

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

Dodaj oba do `ProtocolSchemas` i wyeksportuj typy:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Walidacja**

W `src/gateway/protocol/index.ts` wyeksportuj walidator AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Zachowanie serwera**

Dodaj handler w `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Zarejestruj go w `src/gateway/server-methods.ts` (już scala `systemHandlers`),
a następnie dodaj `"system.echo"` do wejścia `listGatewayMethods` w
`src/gateway/server-methods-list.ts`.

Jeśli metoda ma być wywoływalna przez klientów operatora lub węzła, sklasyfikuj ją też w
`src/gateway/method-scopes.ts`, aby egzekwowanie zakresów i reklamowanie funkcji w `hello-ok`
pozostały spójne.

4. **Wygeneruj ponownie**

```bash
pnpm protocol:check
```

5. **Testy + dokumentacja**

Dodaj test serwera w `src/gateway/server.*.test.ts` i opisz metodę w dokumentacji.

## Zachowanie Swift codegen

Generator Swift emituje:

- enum `GatewayFrame` z przypadkami `req`, `res`, `event` i `unknown`
- silnie typowane struktury/enumeracje ładunków
- wartości `ErrorCode` oraz `GATEWAY_PROTOCOL_VERSION`

Nieznane typy ramek są zachowywane jako surowe ładunki dla zgodności w przód.

## Wersjonowanie + zgodność

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niezgodności.
- Modele Swift zachowują nieznane typy ramek, aby nie psuć starszych klientów.

## Wzorce i konwencje schematów

- Większość obiektów używa `additionalProperties: false` dla ścisłych ładunków.
- `NonEmptyString` to domyślny wybór dla ID oraz nazw metod/zdarzeń.
- Top-level `GatewayFrame` używa **dyskryminatora** na `type`.
- Metody z efektami ubocznymi zwykle wymagają `idempotencyKey` w params
  (na przykład `send`, `poll`, `agent`, `chat.send`).
- `agent` akceptuje opcjonalne `internalEvents` dla kontekstu orkiestracji generowanego w runtime
  (na przykład przekazanie ukończenia zadania subagent/cron); traktuj to jako wewnętrzną powierzchnię API.

## Aktywny JSON schematu

Wygenerowany JSON Schema znajduje się w repozytorium pod `dist/protocol.schema.json`. Opublikowany
surowy plik jest zwykle dostępny pod adresem:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Gdy zmieniasz schematy

1. Zaktualizuj schematy TypeBox.
2. Zarejestruj metodę/zdarzenie w `src/gateway/server-methods-list.ts`.
3. Zaktualizuj `src/gateway/method-scopes.ts`, gdy nowe RPC wymaga klasyfikacji zakresu operatora lub
   węzła.
4. Uruchom `pnpm protocol:check`.
5. Zacommituj ponownie wygenerowany schemat + modele Swift.
