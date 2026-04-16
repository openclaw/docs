---
read_when:
    - Implementowanie lub aktualizowanie klientów Gateway WS
    - Debugowanie niezgodności protokołu lub niepowodzeń połączenia
    - Ponowne generowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie połączenia, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-04-16T09:50:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 683e61ebe993a2d739bc34860060b0e3eda36b5c57267a2bcc03d177ec612fb3
    source_path: gateway/protocol.md
    workflow: 15
---

# Protokół Gateway (WebSocket)

Protokół Gateway WS to **jednolita płaszczyzna sterowania + transport Node** dla
OpenClaw. Wszyscy klienci (CLI, interfejs webowy, aplikacja macOS, nody iOS/Android,
nody bezgłowe) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres**
w momencie uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.

## Uzgadnianie połączenia (connect)

Gateway → klient (wyzwanie przed połączeniem):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Klient → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → klient:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` i `policy` są wszystkie wymagane przez schemat
(`src/gateway/protocol/schema/frames.ts`). `auth` i `canvasHostUrl` są opcjonalne.

Gdy wydawany jest token urządzenia, `hello-ok` zawiera także:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Podczas przekazania zaufanego bootstrapu `hello-ok.auth` może także zawierać dodatkowe
powiązane wpisy ról w `deviceTokens`:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Dla wbudowanego przepływu bootstrapu node/operator podstawowy token node pozostaje
`scopes: []`, a każdy przekazany token operatora pozostaje ograniczony do listy dozwolonych
zakresów operatora bootstrapu (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kontrole zakresu bootstrapu pozostają
prefiksowane rolą: wpisy operatora spełniają tylko żądania operatora, a role inne niż operator
nadal potrzebują zakresów pod własnym prefiksem roli.

### Przykład node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Ramkowanie

- **Żądanie**: `{type:"req", id, method, params}`
- **Odpowiedź**: `{type:"res", id, ok, payload|error}`
- **Zdarzenie**: `{type:"event", event, payload, seq?, stateVersion?}`

Metody wywołujące skutki uboczne wymagają **kluczy idempotencji** (zobacz schemat).

## Role + zakresy

### Role

- `operator` = klient płaszczyzny sterowania (CLI/UI/automatyzacja).
- `node` = host możliwości (`camera/screen/canvas/system.run`).

### Zakresy (operator)

Typowe zakresy:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` z `includeSecrets: true` wymaga `operator.talk.secrets`
(lub `operator.admin`).

Metody Gateway RPC rejestrowane przez Plugin mogą wymagać własnego zakresu operatora, ale
zastrzeżone prefiksy podstawowego administratora (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze są mapowane na `operator.admin`.

Zakres metody to tylko pierwszy próg. Niektóre komendy slash wywoływane przez
`chat.send` stosują dodatkowo bardziej rygorystyczne kontrole na poziomie komendy. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w momencie zatwierdzania ponad
bazowy zakres metody:

- żądania bez komendy: `operator.pairing`
- żądania z komendami node innymi niż exec: `operator.pairing` + `operator.write`
- żądania zawierające `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nody deklarują zgłoszenia możliwości w momencie połączenia:

- `caps`: wysokopoziomowe kategorie możliwości.
- `commands`: lista dozwolonych komend dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **deklaracje** i wymusza listy dozwolonych działań po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy obecności zawierają `deviceId`, `roles` i `scopes`, dzięki czemu interfejsy UI mogą wyświetlać jeden wiersz na urządzenie,
  nawet gdy łączy się ono zarówno jako **operator**, jak i **node**.

## Typowe rodziny metod RPC

Ta strona nie jest wygenerowanym pełnym zrzutem, ale publiczna powierzchnia WS jest szersza
niż przykłady handshake/auth powyżej. To główne rodziny metod, które Gateway udostępnia obecnie.

`hello-ok.features.methods` to zachowawcza lista wykrywania zbudowana na podstawie
`src/gateway/server-methods-list.ts` oraz eksportów metod z załadowanych Pluginów/kanałów.
Traktuj ją jako wykrywanie funkcji, a nie jako wygenerowany zrzut każdej wywoływalnej funkcji pomocniczej
zaimplementowanej w `src/gateway/server-methods/*.ts`.

### System i tożsamość

- `health` zwraca buforowany lub świeżo sprawdzony obraz stanu zdrowia Gateway.
- `status` zwraca podsumowanie Gateway w stylu `/status`; pola wrażliwe są
  uwzględniane tylko dla klientów operatora z zakresem administratora.
- `gateway.identity.get` zwraca tożsamość urządzenia Gateway używaną przez relay i
  przepływy parowania.
- `system-presence` zwraca bieżący obraz obecności dla połączonych
  urządzeń operator/node.
- `system-event` dopisuje zdarzenie systemowe i może aktualizować/rozgłaszać kontekst
  obecności.
- `last-heartbeat` zwraca ostatnie utrwalone zdarzenie Heartbeat.
- `set-heartbeats` przełącza przetwarzanie Heartbeat w Gateway.

### Modele i użycie

- `models.list` zwraca katalog modeli dozwolonych w czasie działania.
- `usage.status` zwraca podsumowania okien użycia dostawcy/pozostałego limitu.
- `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
- `doctor.memory.status` zwraca gotowość pamięci wektorowej / embeddingów dla
  aktywnego domyślnego obszaru roboczego agenta.
- `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji.
- `sessions.usage.timeseries` zwraca szereg czasowy użycia dla jednej sesji.
- `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

### Kanały i pomocniki logowania

- `channels.status` zwraca podsumowania stanu wbudowanych i dołączonych kanałów/Pluginów.
- `channels.logout` wylogowuje określony kanał/konto tam, gdzie kanał
  obsługuje wylogowanie.
- `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego
  dostawcy kanału web obsługującego QR.
- `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i uruchamia
  kanał po sukcesie.
- `push.test` wysyła testowe powiadomienie APNs push do zarejestrowanego noda iOS.
- `voicewake.get` zwraca zapisane wyzwalacze słów aktywacji.
- `voicewake.set` aktualizuje wyzwalacze słów aktywacji i rozgłasza zmianę.

### Wiadomości i logi

- `send` to bezpośrednie wywołanie RPC dostarczania wychodzącego dla
  wysyłek ukierunkowanych na kanał/konto/wątek poza runnerem czatu.
- `logs.tail` zwraca skonfigurowany końcowy fragment logu plikowego Gateway z kursorem/limitem oraz
  kontrolą maksymalnej liczby bajtów.

### Talk i TTS

- `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets`
  wymaga `operator.talk.secrets` (lub `operator.admin`).
- `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów
  WebChat/Control UI.
- `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
- `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców zapasowych
  oraz stan konfiguracji dostawcy.
- `tts.providers` zwraca widoczny inwentarz dostawców TTS.
- `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
- `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
- `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

### Sekrety, konfiguracja, aktualizacja i kreator

- `secrets.reload` ponownie rozwiązuje aktywne SecretRef i podmienia stan sekretów w czasie działania
  tylko przy pełnym powodzeniu.
- `secrets.resolve` rozwiązuje przypisania sekretów docelowych dla określonego
  zestawu komend/celów.
- `config.get` zwraca bieżący obraz konfiguracji i hash.
- `config.set` zapisuje zwalidowany ładunek konfiguracji.
- `config.patch` scala częściową aktualizację konfiguracji.
- `config.apply` waliduje i zastępuje pełny ładunek konfiguracji.
- `config.schema` zwraca ładunek aktywnego schematu konfiguracji używany przez Control UI i
  narzędzia CLI: schemat, `uiHints`, wersję i metadane generacji, w tym
  metadane schematu Pluginów i kanałów, gdy środowisko uruchomieniowe może je załadować. Schemat
  obejmuje metadane pól `title` / `description` pochodzące z tych samych etykiet
  i tekstu pomocy używanych przez UI, w tym dla zagnieżdżonych obiektów, wildcard, elementów tablic
  oraz gałęzi kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje odpowiadająca
  dokumentacja pól.
- `config.schema.lookup` zwraca ładunek wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji:
  znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę i `hintPath`, oraz
  podsumowania bezpośrednich elementów podrzędnych do przeglądania w UI/CLI.
  - Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika i typowe pola walidacji:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    ograniczenia liczbowe/łańcuchowe/tablicowe/obiektowe oraz flagi logiczne takie jak
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Podsumowania elementów podrzędnych ujawniają `key`, znormalizowaną `path`, `type`, `required`,
    `hasChildren`, a także dopasowane `hint` / `hintPath`.
- `update.run` uruchamia przepływ aktualizacji Gateway i planuje restart tylko wtedy,
  gdy sama aktualizacja się powiodła.
- `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają
  kreator wdrożenia przez WS RPC.

### Istniejące główne rodziny

#### Pomocniki agentów i obszaru roboczego

- `agents.list` zwraca skonfigurowane wpisy agentów.
- `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów oraz
  połączeniem z obszarem roboczym.
- `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają
  plikami bootstrapowego obszaru roboczego udostępnianymi dla agenta.
- `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub
  sesji.
- `agent.wait` czeka na zakończenie uruchomienia i zwraca końcowy obraz, jeśli
  jest dostępny.

#### Sterowanie sesją

- `sessions.list` zwraca bieżący indeks sesji.
- `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji
  dla bieżącego klienta WS.
- `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają
  subskrypcje zdarzeń transkryptu/wiadomości dla jednej sesji.
- `sessions.preview` zwraca ograniczone podglądy transkryptu dla określonych
  kluczy sesji.
- `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
- `sessions.create` tworzy nowy wpis sesji.
- `sessions.send` wysyła wiadomość do istniejącej sesji.
- `sessions.steer` to wariant przerwania i sterowania dla aktywnej sesji.
- `sessions.abort` przerywa aktywną pracę dla sesji.
- `sessions.patch` aktualizuje metadane/nadpisania sesji.
- `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują
  konserwację sesji.
- `sessions.get` zwraca pełny zapisany wiersz sesji.
- wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i
  `chat.inject`.
- `chat.history` jest znormalizowane pod kątem wyświetlania dla klientów UI: znaczniki dyrektyw inline są
  usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w zwykłym tekście (w tym
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz
  obcięte bloki wywołań narzędzi) i ujawnione tokeny sterujące modelem w ASCII/pełnej szerokości
  są usuwane, czysto ciche wiersze asystenta z tokenami takie jak dokładne `NO_REPLY` /
  `no_reply` są pomijane, a zbyt duże wiersze mogą zostać zastąpione placeholderami.

#### Parowanie urządzeń i tokeny urządzeń

- `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
- `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają
  rekordami parowania urządzeń.
- `device.token.rotate` obraca token sparowanego urządzenia w granicach zatwierdzonej roli
  i zakresu.
- `device.token.revoke` unieważnia token sparowanego urządzenia.

#### Parowanie node, invoke i oczekująca praca

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` i `node.pair.verify` obejmują parowanie node i weryfikację
  bootstrapu.
- `node.list` i `node.describe` zwracają stan znanych/połączonych node.
- `node.rename` aktualizuje etykietę sparowanego node.
- `node.invoke` przekazuje komendę do połączonego node.
- `node.invoke.result` zwraca wynik dla żądania invoke.
- `node.event` przenosi zdarzenia pochodzące z node z powrotem do Gateway.
- `node.canvas.capability.refresh` odświeża tokeny możliwości canvas o określonym zakresie.
- `node.pending.pull` i `node.pending.ack` to API kolejki połączonych node.
- `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą
  dla node offline/rozłączonych.

#### Rodziny zatwierdzeń

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i
  `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia exec oraz
  wyszukiwanie/odtwarzanie oczekujących zatwierdzeń.
- `exec.approval.waitDecision` czeka na jedną oczekującą decyzję zatwierdzenia exec i zwraca
  ostateczną decyzję (lub `null` przy przekroczeniu czasu).
- `exec.approvals.get` i `exec.approvals.set` zarządzają obrazami zasad zatwierdzania exec
  w Gateway.
- `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalnymi dla node
  zasadami zatwierdzania exec przez komendy relay node.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują
  przepływy zatwierdzania zdefiniowane przez Plugin.

#### Inne główne rodziny

- automatyzacja:
  - `wake` planuje natychmiastowe lub przy następnym Heartbeat wstrzyknięcie tekstu wybudzenia
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject` i inne zdarzenia czatu
  dotyczące wyłącznie transkryptu.
- `session.message` i `session.tool`: aktualizacje strumienia transkryptu/zdarzeń dla
  subskrybowanej sesji.
- `sessions.changed`: zmienił się indeks sesji lub metadane.
- `presence`: aktualizacje obrazu obecności systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja obrazu stanu zdrowia Gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania Cron.
- `shutdown`: powiadomienie o zamknięciu Gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania node.
- `node.invoke.request`: rozgłoszenie żądania invoke node.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniła się konfiguracja wyzwalaczy słów aktywacji.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia
  zatwierdzania exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzania Pluginu.

### Metody pomocnicze node

- Nody mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych Skills
  do kontroli auto-allow.

### Metody pomocnicze operatora

- Operatorzy mogą wywoływać `commands.list` (`operator.read`), aby pobrać inwentarz komend środowiska uruchomieniowego dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, którą powierzchnię celuje podstawowa `name`:
    - `text` zwraca podstawowy tekstowy token komendy bez wiodącego `/`
    - `native` oraz domyślna ścieżka `both` zwracają nazwy natywne zależne od dostawcy,
      gdy są dostępne
  - `textAliases` zawiera dokładne aliasy slash, takie jak `/model` i `/m`.
  - `nativeName` zawiera natywną nazwę komendy zależną od dostawcy, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na nazewnictwo natywne oraz dostępność natywnych komend Pluginu.
  - `includeArgs=false` pomija zserializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywoływać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi środowiska uruchomieniowego dla
  agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel Pluginu, gdy `source="plugin"`
  - `optional`: czy narzędzie Pluginu jest opcjonalne
- Operatorzy mogą wywoływać `tools.effective` (`operator.read`), aby pobrać efektywny inwentarz narzędzi środowiska uruchomieniowego
  dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst środowiska uruchomieniowego po stronie serwera z sesji zamiast akceptować
    uwierzytelnianie lub kontekst dostarczania podany przez wywołującego.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, czego aktywna rozmowa może używać w tej chwili,
    w tym narzędzi core, Pluginów i kanałów.
- Operatorzy mogą wywoływać `skills.status` (`operator.read`), aby pobrać widoczny
  inwentarz Skills dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz
    oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywoływać `skills.search` i `skills.detail` (`operator.read`) dla
  metadanych wykrywania ClawHub.
- Operatorzy mogą wywoływać `skills.install` (`operator.admin`) w dwóch trybach:
  - tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje
    folder umiejętności do katalogu `skills/` domyślnego obszaru roboczego agenta.
  - tryb instalatora Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście Gateway.
- Operatorzy mogą wywoływać `skills.update` (`operator.admin`) w dwóch trybach:
  - tryb ClawHub aktualizuje jeden śledzony slug lub wszystkie śledzone instalacje ClawHub w
    domyślnym obszarze roboczym agenta.
  - tryb konfiguracji wprowadza poprawki do wartości `skills.entries.<skillKey>` takich jak `enabled`,
    `apiKey` i `env`.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, Gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozwiązują to przez wywołanie `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node`, `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane dalej wywołania `node.invoke system.run` ponownie używają tego kanonicznego
  `systemRunPlan` jako autorytatywnego kontekstu komendy/cwd/sesji.
- Jeśli wywołujący zmienia `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` między prepare a ostatecznym zatwierdzonym przekazaniem `system.run`,
  Gateway odrzuca uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Awaryjne dostarczanie agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczenia wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe zachowanie: nierozwiązane lub wyłącznie wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na przejście awaryjne do wykonania tylko w sesji, gdy nie da się rozwiązać żadnej zewnętrznej drogi dostarczania (na przykład dla sesji internal/webchat lub niejednoznacznych konfiguracji wielokanałowych).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niezgodności.
- Schematy + modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości są
stabilne w całym protokole v3 i stanowią oczekiwaną bazę dla klientów firm trzecich.

| Stała                                     | Wartość domyślna                                      | Źródło                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Limit czasu żądania (na RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Limit czasu preauth / connect-challenge   | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (ograniczenie `250`–`10_000`) |
| Początkowy backoff ponownego połączenia   | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Maksymalny backoff ponownego połączenia   | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Ograniczenie szybkiej ponownej próby po zamknięciu tokenu urządzenia | `250` ms                              | `src/gateway/client.ts`                                    |
| Okres karencji wymuszonego zatrzymania przed `terminate()` | `250` ms                             | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Domyślny limit czasu `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Domyślny interwał tick (przed `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Zamknięcie przy limicie czasu tick        | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Serwer ogłasza efektywne `policy.tickIntervalMs`, `policy.maxPayload`
i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości
zamiast domyślnych wartości sprzed handshake.

## Uwierzytelnianie

- Uwierzytelnianie Gateway za pomocą współdzielonego sekretu używa `connect.params.auth.token` lub
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby przenoszące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) lub tryb inny niż loopback
  `gateway.auth.mode: "trusted-proxy"`, spełniają kontrolę uwierzytelniania connect na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatny ingress `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie connect oparte na współdzielonym sekrecie; nie wystawiaj tego trybu na publiczny/niezaufany ingress.
- Po sparowaniu Gateway wydaje **token urządzenia** ograniczony do roli + zakresów
  połączenia. Jest zwracany w `hello-ok.auth.deviceToken` i powinien zostać
  zapisany przez klienta do wykorzystania przy przyszłych połączeniach.
- Klienci powinni zapisywać podstawowy `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne łączenie przy użyciu tego **zapisanego** tokenu urządzenia powinno także ponownie używać
  zapisanego zatwierdzonego zestawu zakresów dla tego tokenu. Pozwala to zachować dostęp
  do odczytu/sprawdzania/statusu, który został już przyznany, i zapobiega cichemu zawężaniu ponownych połączeń do
  węższego niejawnego zakresu tylko administratora.
- Składanie uwierzytelniania connect po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest niezależne i zawsze jest przekazywane, gdy jest ustawione.
  - `auth.token` jest uzupełniane według kolejności priorytetu: najpierw jawny współdzielony token,
    następnie jawny `deviceToken`, a potem zapisany token per urządzenie (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żadne z powyższych nie rozwiązało
    `auth.token`. Współdzielony token lub dowolny rozwiązany token urządzenia go tłumią.
  - Automatyczna promocja zapisanego tokenu urządzenia przy jednorazowej
    ponownej próbie `AUTH_TOKEN_MISMATCH` jest ograniczona wyłącznie do **zaufanych endpointów** —
    loopback lub `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez pinningu się nie kwalifikuje.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` to tokeny przekazania bootstrapu.
  Zapisuj je tylko wtedy, gdy połączenie używało uwierzytelniania bootstrap na zaufanym transporcie,
  takim jak `wss://` lub loopback/local pairing.
- Jeśli klient podaje jawny **`deviceToken`** lub jawne **`scopes`**, ten
  zestaw zakresów zażądany przez wywołującego pozostaje autorytatywny; zapisane zakresy są ponownie używane tylko wtedy,
  gdy klient ponownie używa zapisanego tokenu per urządzenie.
- Tokeny urządzeń można obracać/unieważniać za pomocą `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- Wydawanie/rotacja tokenów pozostaje ograniczone do zatwierdzonego zestawu ról zapisanego w
  wpisie parowania tego urządzenia; rotacja tokenu nie może rozszerzyć urządzenia do
  roli, której zatwierdzenie parowania nigdy nie przyznało.
- W przypadku sesji tokenu sparowanego urządzenia zarządzanie urządzeniem jest ograniczone do własnego zakresu, chyba że
  wywołujący ma również `operator.admin`: wywołujący bez uprawnień administratora mogą usuwać/unieważniać/obracać
  tylko **własny** wpis urządzenia.
- `device.token.rotate` sprawdza również żądany zestaw zakresów operatora względem
  bieżących zakresów sesji wywołującego. Wywołujący bez uprawnień administratora nie mogą obrócić tokenu do
  szerszego zestawu zakresów operatora, niż już posiadają.
- Niepowodzenia uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z zapisanym tokenem per urządzenie.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i wyświetlić wskazówki dotyczące działań operatora.

## Tożsamość urządzenia + parowanie

- Nody powinny uwzględniać stabilną tożsamość urządzenia (`device.id`) pochodzącą z
  odcisku palca pary kluczy.
- Gateway wydaje tokeny per urządzenie + rola.
- Zatwierdzenia parowania są wymagane dla nowych `device.id`, chyba że włączone jest
  lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania koncentruje się na bezpośrednich lokalnych połączeniach loopback.
- OpenClaw ma również wąską ścieżkę samopołączenia backend/container-local dla
  zaufanych przepływów pomocniczych opartych na współdzielonym sekrecie.
- Połączenia tailnet lub LAN z tego samego hosta nadal są traktowane jako zdalne na potrzeby parowania i
  wymagają zatwierdzenia.
- Wszyscy klienci WS muszą uwzględniać tożsamość `device` podczas `connect` (operator + node).
  Control UI może ją pominąć tylko w tych trybach:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niezabezpieczonym HTTP tylko na localhost.
  - pomyślne uwierzytelnianie operatora Control UI z `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tryb awaryjny, poważne obniżenie bezpieczeństwa).
- Wszystkie połączenia muszą podpisywać `connect.challenge` nonce dostarczony przez serwer.

### Diagnostyka migracji uwierzytelniania urządzenia

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed challenge, `connect` zwraca teraz
kody szczegółowe `DEVICE_AUTH_*` w `error.details.code` wraz ze stabilnym `error.details.reason`.

Typowe niepowodzenia migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                           |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (lub wysłał pusty).   |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał przestarzałym/błędnym nonce.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.           |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Sygnatura czasu podpisu jest poza dozwolonym odchyleniem. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie odpowiada odciskowi palca klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonizacja klucza publicznego nie powiodły się. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisz ładunek v2 zawierający nonce serwera.
- Wyślij ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól device/client/role/scopes/token/nonce.
- Starsze sygnatury `v2` pozostają akceptowane dla zgodności, ale pinning metadanych
  sparowanego urządzenia nadal kontroluje zasady komend przy ponownym połączeniu.

## TLS + pinning

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk palca certyfikatu Gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` lub flagę CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API Gateway** (status, kanały, modele, chat,
agent, sesje, nody, zatwierdzenia itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.
