---
read_when:
    - Aktualizowanie schematów protokołu lub generatora kodu
summary: Schematy TypeBox jako jedyne źródło prawdy dla protokołu Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T09:10:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e188ec0fefcbaf01c8b575a1898eafbbcf309d3032930aa0c09c2d9a63b93e5
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox to biblioteka schematów zorientowana na TypeScript. Używamy jej do definiowania **protokołu WebSocket Gateway** (uzgadnianie połączenia, żądanie/odpowiedź, zdarzenia serwera). Te schematy napędzają **walidację w czasie wykonywania**, **eksport JSON Schema** oraz **generowanie kodu Swift** dla aplikacji macOS. Jedno źródło prawdy; cała reszta jest generowana.

Jeśli chcesz poznać szerszy kontekst protokołu, zacznij od
[architektury Gateway](/pl/concepts/architecture).

## Model mentalny (30 sekund)

Każda wiadomość Gateway WS jest jedną z trzech ramek:

- **Żądanie**: `{ type: "req", id, method, params }`
- **Odpowiedź**: `{ type: "res", id, ok, payload | error }`
- **Zdarzenie**: `{ type: "event", event, payload, seq?, stateVersion? }`

Pierwszą ramką **musi** być żądanie `connect`. Następnie klienci mogą wywoływać
metody (np. `health`, `send`, `chat.send`) i subskrybować zdarzenia (np.
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

| Kategoria  | Przykłady                                                  | Uwagi                              |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Rdzeń      | `connect`, `health`, `status`                              | `connect` musi być pierwsze        |
| Komunikacja | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | efekty uboczne wymagają `idempotencyKey` |
| Czat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat używa tych metod           |
| Sesje      | `sessions.list`, `sessions.patch`, `sessions.delete`       | administracja sesjami              |
| Automatyzacja | `wake`, `cron.list`, `cron.run`, `cron.runs`            | kontrola wake + cron               |
| Węzły      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + akcje węzłów          |
| Zdarzenia  | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push z serwera                     |

Autorytatywny reklamowany spis **discovery** znajduje się w
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Gdzie znajdują się schematy

- Źródło: `src/gateway/protocol/schema.ts`
- Walidatory czasu wykonywania (AJV): `src/gateway/protocol/index.ts`
- Reklamowany rejestr funkcji/discovery: `src/gateway/server-methods-list.ts`
- Uzgadnianie połączenia serwera + dyspozycja metod: `src/gateway/server.impl.ts`
- Klient Node: `src/gateway/client.ts`
- Wygenerowany JSON Schema: `dist/protocol.schema.json`
- Wygenerowane modele Swift: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Obecny pipeline

- `pnpm protocol:gen`
  - zapisuje JSON Schema (draft-07) do `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - generuje modele gateway dla Swift
- `pnpm protocol:check`
  - uruchamia oba generatory i sprawdza, czy wynik został skomitowany

## Jak schematy są używane w czasie wykonywania

- **Po stronie serwera**: każda ramka przychodząca jest walidowana przez AJV. Uzgadnianie połączenia akceptuje tylko żądanie `connect`, którego parametry pasują do `ConnectParams`.
- **Po stronie klienta**: klient JS waliduje ramki zdarzeń i odpowiedzi przed ich użyciem.
- **Discovery funkcji**: Gateway wysyła zachowawczą listę `features.methods`
  i `features.events` w `hello-ok` z `listGatewayMethods()` i
  `GATEWAY_EVENTS`.
- Ta lista discovery nie jest wygenerowanym zrzutem każdego wywoływalnego helpera w
  `coreGatewayHandlers`; część pomocniczych RPC jest zaimplementowana w
  `src/gateway/server-methods/*.ts` bez wyliczania ich w reklamowanej liście
  funkcji.

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

Żądanie + odpowiedź:

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

Przykład: dodanie nowego żądania `system.echo`, które zwraca `{ ok: true, text }`.

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

Jeśli metoda może być wywoływana przez operatora lub klientów node, sklasyfikuj ją też w
`src/gateway/method-scopes.ts`, aby egzekwowanie zakresów i reklamowanie funkcji
`hello-ok` pozostały spójne.

4. **Regeneracja**

```bash
pnpm protocol:check
```

5. **Testy + dokumentacja**

Dodaj test serwera w `src/gateway/server.*.test.ts` i odnotuj metodę w dokumentacji.

## Zachowanie generowania kodu Swift

Generator Swift emituje:

- enum `GatewayFrame` z przypadkami `req`, `res`, `event` i `unknown`
- silnie typowane struktury/enumy payloadów
- wartości `ErrorCode` i `GATEWAY_PROTOCOL_VERSION`

Nieznane typy ramek są zachowywane jako surowe payloady dla zgodności w przód.

## Wersjonowanie + zgodność

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niezgodności.
- Modele Swift zachowują nieznane typy ramek, aby nie psuć starszych klientów.

## Wzorce i konwencje schematów

- Większość obiektów używa `additionalProperties: false` dla ścisłych payloadów.
- `NonEmptyString` jest wartością domyślną dla identyfikatorów oraz nazw metod/zdarzeń.
- Najwyższego poziomu `GatewayFrame` używa **dyskryminatora** na `type`.
- Metody z efektami ubocznymi zwykle wymagają `idempotencyKey` w parametrach
  (przykład: `send`, `poll`, `agent`, `chat.send`).
- `agent` akceptuje opcjonalne `internalEvents` dla generowanego w czasie wykonywania kontekstu orkiestracji
  (na przykład przekazania po ukończeniu zadania subagenta/cron); traktuj to jako wewnętrzną powierzchnię API.

## JSON schematu na żywo

Wygenerowany JSON Schema znajduje się w repozytorium pod `dist/protocol.schema.json`. Opublikowany surowy plik jest zwykle dostępny pod adresem:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Gdy zmieniasz schematy

1. Zaktualizuj schematy TypeBox.
2. Zarejestruj metodę/zdarzenie w `src/gateway/server-methods-list.ts`.
3. Zaktualizuj `src/gateway/method-scopes.ts`, gdy nowe RPC wymaga klasyfikacji zakresu operatora lub
   node.
4. Uruchom `pnpm protocol:check`.
5. Skomituj zregenerowany schemat + modele Swift.

## Powiązane

- [Protokół rich output](/pl/reference/rich-output-protocol)
- [Adaptery RPC](/pl/reference/rpc)
