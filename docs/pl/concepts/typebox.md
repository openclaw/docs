---
read_when:
    - Aktualizowanie schematów protokołu lub generowanego kodu
summary: Schematy TypeBox jako jedyne źródło prawdy dla protokołu Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-07-12T15:01:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox to biblioteka schematów zaprojektowana przede wszystkim dla TypeScript. OpenClaw używa jej do definiowania **protokołu WebSocket Gateway** (uzgadnianie połączenia, żądania/odpowiedzi, zdarzenia serwera). Schematy te sterują **walidacją w czasie wykonywania** (AJV), **eksportem JSON Schema** oraz **generowaniem kodu Swift** dla aplikacji macOS. Jedno źródło prawdy; cała reszta jest generowana.

Aby poznać kontekst protokołu wyższego poziomu, zacznij od [architektury Gateway](/pl/concepts/architecture).

## Model mentalny (30 sekund)

Każdy komunikat WS Gateway jest jedną z trzech ramek:

- **Żądanie**: `{ type: "req", id, method, params }`
- **Odpowiedź**: `{ type: "res", id, ok, payload | error }`
- **Zdarzenie**: `{ type: "event", event, payload, seq?, stateVersion? }`

Pierwsza ramka **musi** być żądaniem `connect`. Następnie klienci wywołują metody (np. `health`, `send`, `chat.send`) i subskrybują zdarzenia (np. `presence`, `tick`, `agent`).

Przepływ połączenia (minimalny):

```text
Klient                    Gateway
  |---- żąd.:connect ------->|
  |<---- odp.:hello-ok -------|
  |<---- zdarz.:tick ---------|
  |---- żąd.:health -------->|
  |<---- odp.:health ---------|
```

Typowe metody i zdarzenia:

| Kategoria     | Przykłady                                                   | Uwagi                                             |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| Podstawowe    | `connect`, `health`, `status`                               | `connect` musi być pierwsze                       |
| Wiadomości    | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail`  | metody z efektami ubocznymi wymagają `idempotencyKey` |
| Czat          | `chat.history`, `chat.send`, `chat.abort`                   | WebChat używa tych metod                          |
| Sesje         | `sessions.list`, `sessions.patch`, `sessions.delete`        | administrowanie sesjami                           |
| Automatyzacja | `wake`, `cron.list`, `cron.run`, `cron.runs`                | sterowanie wybudzaniem i Cron                     |
| Węzły         | `node.list`, `node.invoke`, `node.pair.*`                   | WS Gateway oraz działania węzłów                  |
| Zdarzenia     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`   | komunikaty wypychane przez serwer                 |

Autorytatywny, publikowany wykaz **wykrywania funkcji** znajduje się w `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Gdzie znajdują się schematy

- Główny moduł eksportujący źródła: `packages/gateway-protocol/src/schema.ts` ponownie eksportuje moduły domenowe z `packages/gateway-protocol/src/schema/*.ts` (`frames.ts` dla obwiedni najwyższego poziomu i uzgadniania połączenia oraz `agent.ts`, `sessions.ts`, `cron.ts` itd. dla poszczególnych obszarów funkcjonalnych). `protocol-schemas.ts` jest centralnym rejestrem `ProtocolSchemas`, który odwzorowuje nazwy schematów na ich definicje TypeBox.
- Walidatory czasu wykonywania (AJV): `packages/gateway-protocol/src/index.ts`
- Publikowany rejestr funkcji i wykrywania: `src/gateway/server-methods-list.ts`
- Uzgadnianie połączenia przez serwer i rozsyłanie wywołań metod: `src/gateway/server.impl.ts`
- Klient węzła: `src/gateway/client.ts`
- Wygenerowany JSON Schema: `dist/protocol.schema.json` (wynik kompilacji, nie jest zatwierdzany w repozytorium)
- Wygenerowane modele Swift: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## Obecny potok

- `pnpm protocol:gen` zapisuje JSON Schema (draft-07) do `dist/protocol.schema.json`.
- `pnpm protocol:gen:swift` generuje modele Gateway w języku Swift.
- `pnpm protocol:check` uruchamia oba generatory i sprawdza, czy wynik Swift został zatwierdzony w repozytorium (wynik JSON Schema jest ignorowanym przez Git artefaktem kompilacji).

## Sposób użycia schematów w czasie wykonywania

- **Po stronie serwera**: każda przychodząca ramka jest walidowana za pomocą AJV. Uzgadnianie połączenia przyjmuje wyłącznie żądanie `connect`, którego parametry są zgodne z `ConnectParams`.
- **Po stronie klienta**: klient JS waliduje ramki zdarzeń i odpowiedzi przed ich użyciem.
- **Wykrywanie funkcji**: Gateway wysyła zachowawczą listę `features.methods` i `features.events` w `hello-ok`, pochodzącą z `listGatewayMethods()` i `GATEWAY_EVENTS`.
- Ta lista wykrywania nie jest wygenerowanym wykazem wszystkich wywoływalnych funkcji pomocniczych w `coreGatewayHandlers`; niektóre pomocnicze wywołania RPC są zaimplementowane w `src/gateway/server-methods/*.ts`, ale nie są wymienione w publikowanej liście funkcji.

## Przykładowe ramki

Połączenie (pierwszy komunikat):

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

Odpowiedź hello-ok:

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

Żądanie i odpowiedź:

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

Najprostszy użyteczny przepływ: połączenie + kontrola stanu.

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

## Kompletny przykład: dodawanie metody

Przykład: dodaj nowe żądanie `system.echo`, które zwraca `{ ok: true, text }`.

1. **Schemat (źródło prawdy)**

Dodaj do `packages/gateway-protocol/src/schema/system.ts` (lub najlepiej pasującego modułu funkcjonalnego):

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

Zaimportuj oba schematy do `packages/gateway-protocol/src/schema/protocol-schemas.ts`, dodaj je do rejestru `ProtocolSchemas` i wyeksportuj typy pochodne:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Walidacja**

W `packages/gateway-protocol/src/index.ts` wyeksportuj walidator AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Zachowanie serwera**

Dodaj procedurę obsługi w `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Zarejestruj ją w `src/gateway/server-methods.ts` (który już scala `systemHandlers`), a następnie dodaj `"system.echo"` do danych wejściowych `listGatewayMethods` w `src/gateway/server-methods-list.ts`.

Jeśli metoda może być wywoływana przez klientów operatora lub węzła, sklasyfikuj ją również w `src/gateway/method-scopes.ts`, aby wymuszanie zakresów i publikowanie funkcji w `hello-ok` pozostały spójne.

4. **Ponowne generowanie**

```bash
pnpm protocol:check
```

5. **Testy i dokumentacja**

Dodaj test serwera w `src/gateway/server.*.test.ts` i opisz metodę w dokumentacji.

## Działanie generatora kodu Swift

Generator Swift tworzy:

- wyliczenie `GatewayFrame` z wariantami `req`, `res`, `event` i `unknown`
- struktury i wyliczenia ładunków ze ścisłym typowaniem
- wartości `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` i `GATEWAY_MIN_PROTOCOL_VERSION`

Nieznane typy ramek są zachowywane jako nieprzetworzone ładunki w celu zapewnienia zgodności w przód.

## Wersjonowanie i zgodność

- `PROTOCOL_VERSION` znajduje się w `packages/gateway-protocol/src/version.ts` (obecna wartość: `4`).
- Klienci wysyłają `minProtocol` i `maxProtocol`; serwer odrzuca zakresy, które nie obejmują jego bieżącego protokołu.
- Modele Swift zachowują nieznane typy ramek, aby nie powodować awarii starszych klientów.

## Wzorce i konwencje schematów

- Większość obiektów używa `additionalProperties: false`, aby zapewnić ścisłe ładunki.
- `NonEmptyString` (`Type.String({ minLength: 1 })`) jest domyślnym typem identyfikatorów oraz nazw metod i zdarzeń.
- Ramka najwyższego poziomu `GatewayFrame` używa **dyskryminatora** dla pola `type`.
- Metody z efektami ubocznymi zwykle wymagają parametru `idempotencyKey` (przykłady: `send`, `poll`, `agent`, `chat.send`).
- `agent` przyjmuje opcjonalne `internalEvents` dla kontekstu orkiestracji generowanego w czasie wykonywania (na przykład przekazania informacji o ukończeniu zadania podagenta lub Cron); traktuj to jako wewnętrzną powierzchnię API.

## Aktualny schemat JSON

Wygenerowany JSON Schema jest artefaktem kompilacji i nie jest zatwierdzany w repozytorium. Opublikowany nieprzetworzony plik jest zwykle dostępny pod adresem:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Gdy zmieniasz schematy

1. Zaktualizuj schematy TypeBox w odpowiednim module `packages/gateway-protocol/src/schema/*.ts` i zarejestruj je w `protocol-schemas.ts`.
2. Zarejestruj metodę lub zdarzenie w `src/gateway/server-methods-list.ts`.
3. Zaktualizuj `src/gateway/method-scopes.ts`, gdy nowe RPC wymaga klasyfikacji zakresu operatora lub węzła.
4. Uruchom `pnpm protocol:check`.
5. Zatwierdź ponownie wygenerowane modele Swift.

## Powiązane materiały

- [Protokół rozbudowanych danych wyjściowych](/pl/reference/rich-output-protocol)
- [Adaptery RPC](/pl/reference/rpc)
