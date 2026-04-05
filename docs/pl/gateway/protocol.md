---
read_when:
    - Implementowanie lub aktualizowanie klientów WS gateway
    - Debugowanie niezgodności protokołu lub błędów połączenia
    - Ponowne generowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: handshake, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-04-05T13:55:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: c37f5b686562dda3ba3516ac6982ad87b2f01d8148233284e9917099c6e96d87
    source_path: gateway/protocol.md
    workflow: 15
---

# Protokół Gateway (WebSocket)

Protokół Gateway WS to **pojedyncza płaszczyzna sterowania + transport węzłów** dla
OpenClaw. Wszyscy klienci (CLI, web UI, aplikacja macOS, węzły iOS/Android, bezgłowe
węzły) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres** w momencie
handshake.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.

## Handshake (`connect`)

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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

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

Podczas wbudowanego zaufanego przekazania bootstrap `hello-ok.auth` może również zawierać dodatkowe
ograniczone wpisy ról w `deviceTokens`:

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

Dla wbudowanego przepływu bootstrap node/operator podstawowy token węzła pozostaje z
`scopes: []`, a każdy przekazany token operatora pozostaje ograniczony do bootstrapowej
listy dozwolonych operatora (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kontrole zakresu bootstrap pozostają
prefiksowane rolą: wpisy operatora spełniają tylko żądania operatora, a role inne niż operator
nadal wymagają zakresów z własnym prefiksem roli.

### Przykład węzła

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

## Ramki

- **Żądanie**: `{type:"req", id, method, params}`
- **Odpowiedź**: `{type:"res", id, ok, payload|error}`
- **Zdarzenie**: `{type:"event", event, payload, seq?, stateVersion?}`

Metody powodujące skutki uboczne wymagają **kluczy idempotencyjnych** (zobacz schemat).

## Role + zakresy

### Role

- `operator` = klient płaszczyzny sterowania (CLI/UI/automatyzacja).
- `node` = host możliwości (`camera/screen/canvas/system.run`).

### Zakresy (`operator`)

Typowe zakresy:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` z `includeSecrets: true` wymaga `operator.talk.secrets`
(lub `operator.admin`).

Metody Gateway RPC zarejestrowane przez pluginy mogą żądać własnego zakresu operatora, ale
zastrzeżone prefiksy administracyjne rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze są rozwiązywane do `operator.admin`.

Zakres metody jest tylko pierwszą bramką. Niektóre polecenia slash osiągane przez
`chat.send` stosują na dodatek bardziej rygorystyczne kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w momencie zatwierdzania ponad
podstawowy zakres metody:

- żądania bez polecenia: `operator.pairing`
- żądania z poleceniami węzła innymi niż exec: `operator.pairing` + `operator.write`
- żądania zawierające `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (`node`)

Węzły deklarują roszczenia możliwości w momencie połączenia:

- `caps`: kategorie możliwości wysokiego poziomu.
- `commands`: lista dozwolonych poleceń dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i wymusza listy dozwolonych po stronie serwera.

## Presence

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy presence zawierają `deviceId`, `roles` i `scopes`, dzięki czemu UI może pokazywać jeden wiersz na urządzenie
  nawet wtedy, gdy łączy się ono zarówno jako **operator**, jak i **node**.

## Typowe rodziny metod RPC

Ta strona nie jest wygenerowanym pełnym zrzutem, ale publiczna powierzchnia WS jest
szersza niż powyższe przykłady handshake/auth. To główne rodziny metod, które
Gateway udostępnia obecnie.

`hello-ok.features.methods` to zachowawcza lista wykrywania zbudowana z
`src/gateway/server-methods-list.ts` oraz załadowanych eksportów metod pluginów/kanałów.
Traktuj ją jako wykrywanie funkcji, a nie jako wygenerowany zrzut każdej wywoływalnej funkcji pomocniczej
zaimplementowanej w `src/gateway/server-methods/*.ts`.

### System i tożsamość

- `health` zwraca buforowaną lub świeżo sprawdzoną migawkę stanu gateway.
- `status` zwraca podsumowanie gateway w stylu `/status`; pola wrażliwe są
  uwzględniane tylko dla klientów operatora o zakresie admin.
- `gateway.identity.get` zwraca tożsamość urządzenia gateway używaną przez przepływy relay i
  parowania.
- `system-presence` zwraca bieżącą migawkę presence dla połączonych
  urządzeń operator/node.
- `system-event` dopisuje zdarzenie systemowe i może aktualizować/rozgłaszać
  kontekst presence.
- `last-heartbeat` zwraca najnowsze utrwalone zdarzenie heartbeat.
- `set-heartbeats` przełącza przetwarzanie heartbeat na gateway.

### Models i użycie

- `models.list` zwraca katalog modeli dozwolonych w runtime.
- `usage.status` zwraca okna użycia dostawców/podsumowania pozostałego limitu.
- `usage.cost` zwraca zagregowane podsumowania użycia kosztów dla zakresu dat.
- `doctor.memory.status` zwraca gotowość pamięci wektorowej / osadzeń dla
  aktywnego domyślnego workspace agenta.
- `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji.
- `sessions.usage.timeseries` zwraca szereg czasowy użycia dla jednej sesji.
- `sessions.usage.logs` zwraca wpisy logu użycia dla jednej sesji.

### Kanały i pomocniki logowania

- `channels.status` zwraca podsumowania stanu wbudowanych + dołączonych kanałów/pluginów.
- `channels.logout` wylogowuje konkretne konto kanału, jeśli kanał
  obsługuje wylogowanie.
- `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego
  dostawcy kanału web obsługującego QR.
- `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i uruchamia
  kanał po powodzeniu.
- `push.test` wysyła testowy push APNs do zarejestrowanego węzła iOS.
- `voicewake.get` zwraca zapisane wyzwalacze wake word.
- `voicewake.set` aktualizuje wyzwalacze wake word i rozgłasza zmianę.

### Wiadomości i logi

- `send` to bezpośrednie RPC dostarczania wychodzącego dla wysyłek kierowanych do
  kanału/konta/wątku poza runnerem czatu.
- `logs.tail` zwraca ogon skonfigurowanego logu plikowego gateway z kontrolą kursora/limitu i
  maksymalnej liczby bajtów.

### Talk i TTS

- `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets`
  wymaga `operator.talk.secrets` (lub `operator.admin`).
- `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów
  WebChat/Control UI.
- `talk.speak` syntezuje mowę przez aktywnego dostawcę mowy Talk.
- `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców zapasowych
  oraz stan konfiguracji dostawcy.
- `tts.providers` zwraca widoczny inwentarz dostawców TTS.
- `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
- `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
- `tts.convert` uruchamia jednorazową konwersję text-to-speech.

### Secrets, config, update i wizard

- `secrets.reload` ponownie rozwiązuje aktywne SecretRef i podmienia stan sekretów runtime
  tylko przy pełnym powodzeniu.
- `secrets.resolve` rozwiązuje przypisania sekretów docelowych dla poleceń dla konkretnego
  zestawu poleceń/celów.
- `config.get` zwraca bieżącą migawkę konfiguracji i hash.
- `config.set` zapisuje zwalidowany ładunek konfiguracji.
- `config.patch` scala częściową aktualizację konfiguracji.
- `config.apply` waliduje + zastępuje pełny ładunek konfiguracji.
- `config.schema` zwraca aktywny ładunek schematu konfiguracji używany przez Control UI i
  narzędzia CLI: schemat, `uiHints`, wersję i metadane generowania, w tym
  metadane schematów pluginów + kanałów, gdy runtime może je załadować. Schemat
  zawiera metadane pól `title` / `description` wyprowadzone z tych samych etykiet
  i tekstu pomocy używanych przez UI, w tym dla zagnieżdżonych obiektów, wildcard,
  elementów tablic i gałęzi kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje
  pasująca dokumentacja pól.
- `config.schema.lookup` zwraca ładunek wyszukiwania o zakresie ścieżki dla jednej ścieżki konfiguracji:
  znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną podpowiedź + `hintPath` oraz
  podsumowania bezpośrednich elementów potomnych dla UI/CLI drill-down.
  - Węzły schematu lookup zachowują dokumentację widoczną dla użytkownika i typowe pola walidacji:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    ograniczenia liczb/stringów/tablic/obiektów oraz flagi boolowskie, takie jak
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Podsumowania dzieci ujawniają `key`, znormalizowaną `path`, `type`, `required`,
    `hasChildren`, a także dopasowane `hint` / `hintPath`.
- `update.run` uruchamia przepływ aktualizacji gateway i planuje restart tylko wtedy,
  gdy sama aktualizacja zakończyła się powodzeniem.
- `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają
  kreator onboardingu przez WS RPC.

### Istniejące główne rodziny

#### Pomocniki agentów i workspace

- `agents.list` zwraca skonfigurowane wpisy agentów.
- `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów i
  połączeniem workspace.
- `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają
  plikami bootstrapowego workspace udostępnianymi dla agenta.
- `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub
  sesji.
- `agent.wait` czeka na zakończenie uruchomienia i zwraca końcową migawkę, gdy
  jest dostępna.

#### Sterowanie sesją

- `sessions.list` zwraca bieżący indeks sesji.
- `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji
  dla bieżącego klienta WS.
- `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają
  subskrypcje zdarzeń transkryptu/wiadomości dla jednej sesji.
- `sessions.preview` zwraca ograniczone podglądy transkryptu dla określonych kluczy
  sesji.
- `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
- `sessions.create` tworzy nowy wpis sesji.
- `sessions.send` wysyła wiadomość do istniejącej sesji.
- `sessions.steer` to wariant przerwania i sterowania dla aktywnej sesji.
- `sessions.abort` przerywa aktywną pracę dla sesji.
- `sessions.patch` aktualizuje metadane/nadpisania sesji.
- `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację
  sesji.
- `sessions.get` zwraca pełny zapisany wiersz sesji.
- wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i
  `chat.inject`.
- `chat.history` jest znormalizowane do wyświetlania dla klientów UI: inline tagi dyrektyw są
  usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w czystym tekście (w tym
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz
  obcięte bloki wywołań narzędzi) i wyciekające tokeny sterujące modelu ASCII/full-width
  są usuwane, czyste wiersze asystenta ze znacznikami silent-token, takie jak dokładne `NO_REPLY` /
  `no_reply`, są pomijane, a zbyt duże wiersze mogą być zastępowane placeholderami.

#### Parowanie urządzeń i tokeny urządzeń

- `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
- `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają
  rekordami parowania urządzeń.
- `device.token.rotate` obraca token sparowanego urządzenia w granicach jego zatwierdzonej roli
  i zakresów.
- `device.token.revoke` unieważnia token sparowanego urządzenia.

#### Parowanie węzłów, invoke i oczekująca praca

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` i `node.pair.verify` obejmują parowanie węzłów i weryfikację
  bootstrap.
- `node.list` i `node.describe` zwracają stan znanych/połączonych węzłów.
- `node.rename` aktualizuje etykietę sparowanego węzła.
- `node.invoke` przekazuje polecenie do połączonego węzła.
- `node.invoke.result` zwraca wynik żądania invoke.
- `node.event` przenosi zdarzenia pochodzące z węzła z powrotem do gateway.
- `node.canvas.capability.refresh` odświeża tokeny możliwości canvas o określonym zakresie.
- `node.pending.pull` i `node.pending.ack` to API kolejki dla połączonych węzłów.
- `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą
  dla węzłów offline/rozłączonych.

#### Rodziny zatwierdzeń

- `exec.approval.request` i `exec.approval.resolve` obejmują jednorazowe
  żądania zatwierdzenia exec.
- `exec.approval.waitDecision` czeka na jedną oczekującą decyzję zatwierdzenia exec i zwraca
  ostateczną decyzję (lub `null` przy limicie czasu).
- `exec.approvals.get` i `exec.approvals.set` zarządzają migawkami polityki
  zatwierdzeń exec gateway.
- `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną polityką exec
  węzła przez polecenia relay węzła.
- `plugin.approval.request`, `plugin.approval.waitDecision` i
  `plugin.approval.resolve` obejmują przepływy zatwierdzeń definiowane przez pluginy.

#### Inne główne rodziny

- automatyzacja:
  - `wake` planuje natychmiastowe lub najbliższe wstrzyknięcie tekstu wake przy heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/narzędzia: `skills.*`, `tools.catalog`, `tools.effective`

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject` i inne zdarzenia czatu
  dotyczące wyłącznie transkryptu.
- `session.message` i `session.tool`: aktualizacje transkryptu/strumienia zdarzeń dla
  subskrybowanej sesji.
- `sessions.changed`: indeks sesji lub metadane uległy zmianie.
- `presence`: aktualizacje migawki presence systemu.
- `tick`: okresowe zdarzenie keepalive / liveness.
- `health`: aktualizacja migawki stanu gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania cron.
- `shutdown`: powiadomienie o zamknięciu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania węzła.
- `node.invoke.request`: rozgłoszenie żądania invoke węzła.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniono konfigurację wyzwalaczy wake word.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia
  zatwierdzenia exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzenia pluginu.

### Metody pomocnicze węzła

- Węzły mogą wywoływać `skills.bins`, aby pobrać bieżącą listę wykonywalnych plików Skill
  do kontroli auto-allow.

### Metody pomocnicze operatora

- Operatorzy mogą wywoływać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi runtime dla
  agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel pluginu, gdy `source="plugin"`
  - `optional`: czy narzędzie pluginu jest opcjonalne
- Operatorzy mogą wywoływać `tools.effective` (`operator.read`), aby pobrać efektywny inwentarz narzędzi runtime
  dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst runtime po stronie serwera z sesji zamiast akceptować
    auth lub kontekst dostarczenia dostarczony przez wywołującego.
  - Odpowiedź ma zakres sesji i odzwierciedla to, czego aktywna rozmowa może używać w tej chwili,
    w tym narzędzi rdzenia, pluginów i kanałów.
- Operatorzy mogą wywoływać `skills.status` (`operator.read`), aby pobrać widoczny
  inwentarz Skill dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny workspace agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji i
    oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywoływać `skills.search` i `skills.detail` (`operator.read`) dla
  metadanych wykrywania ClawHub.
- Operatorzy mogą wywoływać `skills.install` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje
    folder Skill do katalogu `skills/` domyślnego workspace agenta.
  - Tryb instalatora Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście gateway.
- Operatorzy mogą wywoływać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug lub wszystkie śledzone instalacje ClawHub w
    domyślnym workspace agenta.
  - Tryb config łata wartości `skills.entries.<skillKey>`, takie jak `enabled`,
    `apiKey` i `env`.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozwiązują to przez wywołanie `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node`, `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane wywołania `node.invoke system.run` używają ponownie tego kanonicznego
  `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` między prepare a końcowym zatwierdzonym przekazaniem `system.run`, gateway odrzuci uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Zapasowe dostarczenie agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczenia wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe działanie: nierozwiązane lub wyłącznie wewnętrzne cele dostarczenia zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na przejście do wykonania wyłącznie w sesji, gdy nie można rozwiązać zewnętrznej trasy dostarczalnej (na przykład sesje internal/webchat lub niejednoznaczne konfiguracje wielokanałowe).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niezgodności.
- Schematy + modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Auth

- Uwierzytelnianie gateway przy użyciu współdzielonego sekretu używa `connect.params.auth.token` lub
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu auth.
- Tryby przenoszące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) lub `gateway.auth.mode: "trusted-proxy"` poza loopback,
  spełniają kontrolę auth dla connect na podstawie nagłówków żądania zamiast
  `connect.params.auth.*`.
- Prywatny ingress `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie connect współdzielonym sekretem;
  nie wystawiaj tego trybu na publiczny/niezaufany ingress.
- Po sparowaniu Gateway wydaje **token urządzenia** o zakresie zgodnym z rolą + zakresami połączenia.
  Jest on zwracany w `hello-ok.auth.deviceToken` i powinien zostać
  utrwalony przez klienta do przyszłych połączeń.
- Klienci powinni utrwalać podstawowy `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne połączenie z tym **zapisanym** tokenem urządzenia powinno również ponownie używać zapisanego
  zestawu zatwierdzonych zakresów dla tego tokena. Pozwala to zachować już przyznany
  dostęp do odczytu/sond/statusu i unika cichego zawężania ponownych połączeń do
  węższego domyślnego zakresu wyłącznie admin.
- Normalna kolejność auth dla connect to najpierw jawny współdzielony token/hasło, potem
  jawne `deviceToken`, potem zapisany token per urządzenie, a następnie token bootstrap.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` to tokeny przekazania bootstrap.
  Utrwalaj je tylko wtedy, gdy połączenie używało auth bootstrap na zaufanym transporcie,
  takim jak `wss://` lub loopback/local pairing.
- Jeśli klient dostarcza **jawne** `deviceToken` lub jawne `scopes`, ten
  zestaw zakresów żądany przez wywołującego pozostaje autorytatywny; buforowane zakresy są ponownie używane tylko wtedy,
  gdy klient używa zapisanego tokena per urządzenie.
- Tokeny urządzeń mogą być obracane/unieważniane przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- Wydawanie/obracanie tokenów pozostaje ograniczone do zatwierdzonego zestawu ról zapisanego we
  wpisie parowania tego urządzenia; obrót tokena nie może rozszerzyć urządzenia do
  roli, której zatwierdzenie parowania nigdy nie przyznało.
- Dla sesji tokenów sparowanych urządzeń zarządzanie urządzeniem ma zakres własny, chyba że
  wywołujący ma również `operator.admin`: wywołujący bez admin może usuwać/unieważniać/obracać
  tylko **własny** wpis urządzenia.
- `device.token.rotate` sprawdza także żądany zestaw zakresów operatora względem
  bieżących zakresów sesji wywołującego. Wywołujący bez admin nie może obrócić tokena do
  szerszego zestawu zakresów operatora, niż już posiada.
- Błędy auth zawierają `error.details.code` oraz podpowiedzi naprawcze:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną próbę ponowną z buforowanym tokenem per urządzenie.
  - Jeśli ta próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i wyświetlić operatorowi wskazówki wymagające działania.

## Tożsamość urządzenia + parowanie

- Węzły powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  fingerprintu pary kluczy.
- Gateway wydaje tokeny per urządzenie + rola.
- Dla nowych `deviceId` wymagane są zatwierdzenia parowania, chyba że włączono lokalne auto-zatwierdzanie.
- Auto-zatwierdzanie parowania jest skoncentrowane na bezpośrednich lokalnych połączeniach loopback.
- OpenClaw ma także wąską ścieżkę backend/container-local self-connect dla
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia tailnet lub LAN z tego samego hosta nadal są traktowane jako zdalne w kontekście parowania i
  wymagają zatwierdzenia.
- Wszyscy klienci WS muszą zawierać tożsamość `device` podczas `connect` (operator + node).
  Control UI może ją pominąć tylko w tych trybach:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niezabezpieczonym HTTP tylko dla localhost.
  - udane auth operatora `gateway.auth.mode: "trusted-proxy"` dla Control UI.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tryb awaryjny, poważne obniżenie bezpieczeństwa).
- Wszystkie połączenia muszą podpisywać dostarczony przez serwer nonce `connect.challenge`.

### Diagnostyka migracji auth urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed wyzwania, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` pod `error.details.code` ze stabilnym `error.details.reason`.

Typowe błędy migracji:

| Komunikat                     | details.code                     | details.reason           | Znaczenie                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (lub wysłał pusty).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał przy użyciu nieaktualnego/błędnego nonce.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie odpowiada ładunkowi v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Podpisany znacznik czasu jest poza dozwolonym odchyleniem.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do fingerprintu klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonizacja klucza publicznego nie powiodły się.         |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisuj ładunek v2, który zawiera nonce serwera.
- Wysyłaj ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól device/client/role/scopes/token/nonce.
- Starsze podpisy `v2` pozostają akceptowane dla zgodności, ale przypinanie metadanych
  sparowanych urządzeń nadal steruje polityką poleceń przy ponownym połączeniu.

## TLS + pinning

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypinać fingerprint certyfikatu gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` lub flagę CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API gateway** (status, kanały, models, chat,
agent, sessions, nodes, approvals itd.). Dokładna powierzchnia jest definiowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.
