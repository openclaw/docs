---
read_when:
    - Implementowanie lub aktualizowanie klientów WS dla Gateway
    - Debugowanie niezgodności protokołu lub błędów połączenia
    - Regenerowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie połączenia, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-05-03T21:33:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 238706fcecd8ca96394402714cde5b01fb296de8e7b5a5867b1b3cf5b7940689
    source_path: gateway/protocol.md
    workflow: 16
---

Protokół Gateway WS jest **pojedynczą płaszczyzną sterowania + transportem node** dla
OpenClaw. Wszyscy klienci (CLI, webowy interfejs użytkownika, aplikacja macOS, node iOS/Android, node
bez interfejsu) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres** podczas
uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po udanym uzgodnieniu połączenia klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Gdy diagnostyka jest włączona,
  zbyt duże ramki przychodzące i wolne bufory wychodzące emitują zdarzenia `payload.large`
  zanim gateway zamknie lub porzuci dotkniętą ramkę. Te zdarzenia zachowują
  rozmiary, limity, powierzchnie i bezpieczne kody powodów. Nie zachowują treści
  wiadomości, zawartości załączników, surowej treści ramki, tokenów, plików cookie ani wartości tajnych.

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
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

Gdy Gateway nadal kończy uruchamianie procesów sidecar, żądanie `connect` może
zwrócić ponawialny błąd `UNAVAILABLE` z `details.reason` ustawionym na
`"startup-sidecars"` oraz `retryAfterMs`. Klienci powinni ponowić tę odpowiedź
w ramach swojego całkowitego budżetu połączenia zamiast prezentować ją jako końcową
awarię uzgadniania połączenia.

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`src/gateway/protocol/schema/frames.ts`). `auth` także jest wymagane i raportuje
wynegocjowaną rolę/zakresy. `canvasHostUrl` jest opcjonalne.

Gdy token urządzenia nie zostanie wydany, `hello-ok.auth` raportuje wynegocjowane
uprawnienia bez pól tokenów:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Zaufani klienci zaplecza działający w tym samym procesie (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogą pominąć `device` przy bezpośrednich połączeniach loopback,
gdy uwierzytelniają się współdzielonym tokenem/hasłem Gateway. Ta ścieżka jest zarezerwowana
dla wewnętrznych wywołań RPC płaszczyzny sterowania i zapobiega blokowaniu lokalnej pracy zaplecza,
takiej jak aktualizacje sesji subagentów, przez nieaktualne bazowe parowania CLI/urządzeń. Klienci zdalni,
klienci pochodzący z przeglądarki, klienci node oraz jawni klienci tokenu urządzenia/tożsamości urządzenia
nadal używają normalnych kontroli parowania i podnoszenia zakresu.

Gdy token urządzenia zostanie wydany, `hello-ok` zawiera także:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Podczas zaufanego przekazania bootstrap `hello-ok.auth` może także zawierać dodatkowe
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

Dla wbudowanego przepływu bootstrap node/operator główny token node pozostaje
`scopes: []`, a każdy przekazany token operatora pozostaje ograniczony do listy dozwolonej
operatora bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kontrole zakresów bootstrap pozostają
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

Pełny model zakresów operatora, kontrole w czasie zatwierdzania i semantykę współdzielonych sekretów
opisano w [Zakresy operatora](/pl/gateway/operator-scopes).

### Role

- `operator` = klient płaszczyzny sterowania (CLI/interfejs użytkownika/automatyzacja).
- `node` = host funkcjonalności (camera/screen/canvas/system.run).

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

Metody RPC Gateway rejestrowane przez Plugin mogą żądać własnego zakresu operatora, ale
zarezerwowane główne prefiksy administracyjne (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze rozwiązują się do `operator.admin`.

Zakres metody jest tylko pierwszą bramką. Niektóre komendy ukośnikowe osiągane przez
`chat.send` nakładają dodatkowo surowsze kontrole na poziomie komendy. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w czasie zatwierdzania ponad
bazowym zakresem metody:

- żądania bez komend: `operator.pairing`
- żądania z komendami node innymi niż exec: `operator.pairing` + `operator.write`
- żądania, które zawierają `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Funkcjonalności/komendy/uprawnienia (node)

Node deklarują roszczenia funkcjonalności podczas połączenia:

- `caps`: kategorie funkcjonalności wysokiego poziomu.
- `commands`: lista dozwolonych komend dla wywołań.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i egzekwuje listy dozwolone po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy indeksowane według tożsamości urządzenia.
- Wpisy obecności zawierają `deviceId`, `roles` i `scopes`, aby interfejsy użytkownika mogły pokazać jeden wiersz na urządzenie
  nawet wtedy, gdy łączy się zarówno jako **operator**, jak i **node**.
- `node.list` zawiera opcjonalne pola `lastSeenAtMs` i `lastSeenReason`. Połączone node raportują
  bieżący czas połączenia jako `lastSeenAtMs` z powodem `connect`; sparowane node mogą także raportować
  trwałą obecność w tle, gdy zaufane zdarzenie node aktualizuje ich metadane parowania.

### Zdarzenie aktywności node w tle

Node mogą wywołać `node.event` z `event: "node.presence.alive"`, aby zapisać, że sparowany node był
aktywny podczas wybudzenia w tle bez oznaczania go jako połączonego.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` jest zamkniętym enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` lub `connect`. Nieznane ciągi wyzwalaczy są normalizowane do
`background` przez gateway przed utrwaleniem. Zdarzenie jest trwałe tylko dla uwierzytelnionych sesji
urządzeń node; sesje bez urządzenia lub niesparowane zwracają `handled: false`.

Udane gateway zwracają ustrukturyzowany wynik:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Starsze gateway mogą nadal zwracać `{ "ok": true }` dla `node.event`; klienci powinni traktować to jako
potwierdzone RPC, a nie jako trwałe utrwalenie obecności.

## Zakresowanie zdarzeń rozgłoszeniowych

Zdarzenia rozgłoszeniowe WebSocket wypychane przez serwer są bramkowane zakresem, aby sesje z zakresem parowania lub tylko node nie otrzymywały pasywnie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` oraz wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Rozgłoszenia `plugin.*` definiowane przez Plugin** są bramkowane do `operator.write` lub `operator.admin`, zależnie od tego, jak Plugin je zarejestrował.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia połączenia/rozłączenia itd.) pozostają nieograniczone, aby stan transportu był obserwowalny dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń rozgłoszeniowych** są domyślnie bramkowane zakresem (fail-closed), chyba że zarejestrowany handler jawnie je rozluźnia.

Każde połączenie klienta utrzymuje własny numer sekwencji na klienta, aby rozgłoszenia zachowywały monotoniczne porządkowanie na tym gnieździe nawet wtedy, gdy różni klienci widzą różne, filtrowane zakresem podzbiory strumienia zdarzeń.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż powyższe przykłady uzgadniania połączenia/uwierzytelniania. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` jest konserwatywną
listą odkrywania zbudowaną z `src/gateway/server-methods-list.ts` oraz załadowanych
eksportów metod pluginów/kanałów. Traktuj ją jako odkrywanie funkcji, a nie pełną
enumerację `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System i tożsamość">
    - `health` zwraca buforowaną lub świeżo sprawdzoną migawkę kondycji gateway.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestrator stabilności diagnostycznej. Zachowuje metadane operacyjne, takie jak nazwy zdarzeń, liczby, rozmiary w bajtach, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów oraz identyfikatory sesji. Nie zachowuje tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań lub odpowiedzi, tokenów, plików cookie ani wartości tajnych. Wymagany jest zakres odczytu operatora.
    - `status` zwraca podsumowanie gateway w stylu `/status`; pola wrażliwe są dołączane tylko dla klientów operatora z zakresem administratora.
    - `gateway.identity.get` zwraca tożsamość urządzenia gateway używaną przez przepływy relay i parowania.
    - `system-presence` zwraca bieżącą migawkę obecności połączonych urządzeń operator/node.
    - `system-event` dołącza zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
    - `last-heartbeat` zwraca najnowsze utrwalone zdarzenie Heartbeat.
    - `set-heartbeats` przełącza przetwarzanie Heartbeat w gateway.

  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolonych przez środowisko uruchomieniowe. Przekaż `{ "view": "configured" }`, aby uzyskać skonfigurowane modele o rozmiarze odpowiednim dla wybieraka (`agents.defaults.models` najpierw, potem `models.providers.*.models`), albo `{ "view": "all" }`, aby uzyskać pełny katalog.
    - `usage.status` zwraca okna użycia dostawców oraz podsumowania pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
    - `doctor.memory.status` zwraca gotowość pamięci wektorowej / buforowanych embeddingów dla aktywnej domyślnej przestrzeni roboczej agenta. Przekaż `{ "probe": true }` lub `{ "deep": true }` tylko wtedy, gdy wywołujący wyraźnie chce aktywnego pingowania dostawcy embeddingów.
    - `doctor.memory.remHarness` zwraca ograniczony, tylko do odczytu podgląd uprzęży REM dla zdalnych klientów płaszczyzny sterowania. Może zawierać ścieżki przestrzeni roboczej, fragmenty pamięci, wyrenderowany ugruntowany Markdown oraz kandydatów do głębokiej promocji, więc wywołujący potrzebują `operator.read`.
    - `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji.
    - `sessions.usage.timeseries` zwraca użycie w szeregach czasowych dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Kanały i pomocnicy logowania">
    - `channels.status` zwraca podsumowania stanu wbudowanych oraz dołączonych kanałów/Plugin.
    - `channels.logout` wylogowuje z określonego kanału/konta tam, gdzie kanał obsługuje wylogowanie.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i po powodzeniu uruchamia kanał.
    - `push.test` wysyła testowe wypchnięcie APNs do zarejestrowanego węzła iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słowa wybudzającego.
    - `voicewake.set` aktualizuje wyzwalacze słowa wybudzającego i rozgłasza zmianę.

  </Accordion>

  <Accordion title="Wiadomości i dzienniki">
    - `send` to bezpośredni RPC dostarczania wychodzącego dla wysyłek kierowanych do kanału/konta/wątku poza runnerem czatu.
    - `logs.tail` zwraca skonfigurowany ogon pliku dziennika Gateway z kursorem/limitem oraz kontrolą maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Rozmowa i TTS">
    - `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (lub `operator.admin`).
    - `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów WebChat/Control UI.
    - `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców zapasowych oraz stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny inwentarz dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRefy i podmienia stan sekretów środowiska uruchomieniowego tylko przy pełnym powodzeniu.
    - `secrets.resolve` rozwiązuje przypisania sekretów docelowych dla polecenia dla określonego zestawu polecenie/cel.
    - `config.get` zwraca bieżący zrzut konfiguracji i skrót.
    - `config.set` zapisuje zwalidowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji.
    - `config.apply` waliduje i zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca aktywny ładunek schematu konfiguracji używany przez narzędzia Control UI i CLI: schemat, `uiHints`, wersję oraz metadane generowania, w tym metadane schematów Plugin + kanałów, gdy środowisko uruchomieniowe może je załadować. Schemat zawiera metadane pól `title` / `description` pochodzące z tych samych etykiet i tekstu pomocy, których używa UI, w tym zagnieżdżone obiekty, symbole wieloznaczne, elementy tablic oraz gałęzie kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pola.
    - `config.schema.lookup` zwraca ładunek wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę + `hintPath` oraz bezpośrednie podsumowania dzieci do zagłębiania się w UI/CLI. Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika i typowe pola walidacji (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia liczb/ciągów/tablic/obiektów oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania dzieci ujawniają `key`, znormalizowaną `path`, `type`, `required`, `hasChildren` oraz dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji Gateway i planuje restart tylko wtedy, gdy sama aktualizacja zakończyła się powodzeniem; wywołujący z sesją mogą dołączyć `continuationMessage`, aby podczas uruchamiania wznowić jedną kolejną turę agenta przez kolejkę kontynuacji restartu. Aktualizacje menedżera pakietów wymuszają nieodroczony restart po aktualizacji bez czasu oczekiwania po podmianie pakietu, aby stary proces Gateway nie kontynuował leniwego ładowania z zastąpionego drzewa `dist`.
    - `update.status` zwraca najnowszy buforowany sentinel restartu aktualizacji, w tym uruchomioną wersję po restarcie, gdy jest dostępna.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreatora onboardingu przez WS RPC.

  </Accordion>

  <Accordion title="Pomocnicy agenta i przestrzeni roboczej">
    - `agents.list` zwraca skonfigurowane wpisy agentów, w tym efektywny model i metadane środowiska uruchomieniowego.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów oraz połączeniami przestrzeni roboczej.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami startowymi przestrzeni roboczej udostępnionymi dla agenta.
    - `artifacts.list`, `artifacts.get` i `artifacts.download` udostępniają podsumowania artefaktów pochodzących z transkryptu oraz pobrania dla jawnego zakresu `sessionKey`, `runId` lub `taskId`. Zapytania o uruchomienia i zadania rozwiązują sesję właściciela po stronie serwera i zwracają tylko media transkryptu z pasującą proweniencją; niebezpieczne lub lokalne źródła URL zwracają nieobsługiwane pobrania zamiast pobierania po stronie serwera.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcowy zrzut, gdy jest dostępny.

  </Accordion>

  <Accordion title="Sterowanie sesją">
    - `sessions.list` zwraca bieżący indeks sesji, w tym metadane `agentRuntime` dla każdego wiersza, gdy skonfigurowano backend środowiska uruchomieniowego agenta.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkryptu/wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkryptów dla określonych kluczy sesji.
    - `sessions.describe` zwraca jeden wiersz sesji Gateway dla dokładnego klucza sesji.
    - `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant przerwania i pokierowania dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji. Wywołujący może przekazać `key` oraz opcjonalne `runId`, albo przekazać samo `runId` dla aktywnych uruchomień, które Gateway może rozwiązać do sesji.
    - `sessions.patch` aktualizuje metadane/nadpisania sesji i raportuje rozwiązany model kanoniczny oraz efektywne `agentRuntime`.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest normalizowane do wyświetlania dla klientów UI: wbudowane tagi dyrektyw są usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w zwykłym tekście (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi) i wyciekłe tokeny sterowania modelem ASCII/pełnej szerokości są usuwane, czyste wiersze asystenta z cichymi tokenami, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a zbyt duże wiersze mogą zostać zastąpione symbolami zastępczymi.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach zatwierdzonej roli i zakresu wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach zatwierdzonej roli i zakresu wywołującego.

  </Accordion>

  <Accordion title="Parowanie Node, wywoływanie i praca oczekująca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` i `node.pair.verify` obejmują parowanie węzłów oraz weryfikację startową.
    - `node.list` i `node.describe` zwracają stan znanych/połączonych węzłów.
    - `node.rename` aktualizuje etykietę sparowanego węzła.
    - `node.invoke` przekazuje polecenie do połączonego węzła.
    - `node.invoke.result` zwraca wynik żądania wywołania.
    - `node.event` przenosi zdarzenia pochodzące z węzła z powrotem do Gateway.
    - `node.canvas.capability.refresh` odświeża ograniczone tokeny możliwości kanwy.
    - `node.pending.pull` i `node.pending.ack` to API kolejki połączonych węzłów.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą pracą oczekującą dla węzłów offline/rozłączonych.

  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia wykonania oraz wyszukiwanie/odtwarzanie oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie wykonania i zwraca ostateczną decyzję (lub `null` po przekroczeniu limitu czasu).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają zrzutami polityki zatwierdzania wykonania Gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną dla węzła polityką zatwierdzania wykonania przez polecenia przekaźnika węzła.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują przepływy zatwierdzania zdefiniowane przez plugin.

  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe lub przy następnym Heartbeat wstrzyknięcie tekstu wybudzającego; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject` i inne zdarzenia czatu
  dotyczące wyłącznie transkryptu.
- `session.message` i `session.tool`: aktualizacje transkryptu/strumienia zdarzeń dla
  subskrybowanej sesji.
- `sessions.changed`: indeks sesji lub metadane uległy zmianie.
- `presence`: aktualizacje zrzutu obecności systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja zrzutu kondycji Gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania Cron.
- `shutdown`: powiadomienie o zamknięciu Gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania węzła.
- `node.invoke.request`: rozgłoszenie żądania wywołania węzła.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: konfiguracja wyzwalacza słowa wybudzającego uległa zmianie.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia zatwierdzenia wykonania.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzenia Plugin.

### Metody pomocnicze Node

- Węzły mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych Skills
  do kontroli automatycznego zezwalania.

### Metody pomocnicze operatora

- Operatorzy mogą wywołać `commands.list` (`operator.read`), aby pobrać spis poleceń runtime dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślną przestrzeń roboczą agenta.
  - `scope` steruje tym, do której powierzchni odnosi się główne `name`:
    - `text` zwraca główny token polecenia tekstowego bez początkowego `/`
    - `native` oraz domyślna ścieżka `both` zwracają natywne nazwy uwzględniające dostawcę, gdy są dostępne
  - `textAliases` zawiera dokładne aliasy z ukośnikiem, takie jak `/model` i `/m`.
  - `nativeName` zawiera natywną nazwę polecenia uwzględniającą dostawcę, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na natywne nazewnictwo oraz dostępność natywnych poleceń Plugin.
  - `includeArgs=false` pomija zserializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywołać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi runtime dla agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel Plugin, gdy `source="plugin"`
  - `optional`: czy narzędzie Plugin jest opcjonalne
- Operatorzy mogą wywołać `tools.effective` (`operator.read`), aby pobrać efektywny w runtime spis narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst runtime z sesji po stronie serwera zamiast akceptować dostarczony przez wywołującego kontekst uwierzytelniania lub dostarczania.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, czego aktywna konwersacja może teraz używać, w tym narzędzia core, Plugin i kanału.
- Operatorzy mogą wywołać `tools.invoke` (`operator.write`), aby uruchomić jedno dostępne narzędzie przez tę samą ścieżkę zasad Gateway co `/tools/invoke`.
  - `name` jest wymagane. `args`, `sessionKey`, `agentId`, `confirm` i `idempotencyKey` są opcjonalne.
  - Jeśli obecne są zarówno `sessionKey`, jak i `agentId`, rozpoznany agent sesji musi pasować do `agentId`.
  - Odpowiedź to koperta skierowana do SDK z polami `ok`, `toolName`, opcjonalnym `output` oraz typowanymi polami `error`. Zgody lub odmowy zasad zwracają `ok:false` w ładunku zamiast omijać potok zasad narzędzi Gateway.
- Operatorzy mogą wywołać `skills.status` (`operator.read`), aby pobrać widoczny spis Skills dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślną przestrzeń roboczą agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywołać `skills.search` i `skills.detail` (`operator.read`), aby uzyskać metadane odkrywania ClawHub.
- Operatorzy mogą wywołać `skills.install` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje folder skill w katalogu `skills/` domyślnej przestrzeni roboczej agenta.
  - Tryb instalatora Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście Gateway.
- Operatorzy mogą wywołać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug lub wszystkie śledzone instalacje ClawHub w domyślnej przestrzeni roboczej agenta.
  - Tryb konfiguracji poprawia wartości `skills.entries.<skillKey>`, takie jak `enabled`, `apiKey` i `env`.

### Widoki `models.list`

`models.list` przyjmuje opcjonalny parametr `view`:

- Pominięte lub `"default"`: bieżące zachowanie runtime. Jeśli skonfigurowano `agents.defaults.models`, odpowiedzią jest dozwolony katalog; w przeciwnym razie odpowiedzią jest pełny katalog Gateway.
- `"configured"`: zachowanie o rozmiarze selektora. Jeśli skonfigurowano `agents.defaults.models`, nadal ma pierwszeństwo. W przeciwnym razie odpowiedź używa jawnych wpisów `models.providers.*.models`, przechodząc awaryjnie do pełnego katalogu tylko wtedy, gdy nie istnieją żadne skonfigurowane wiersze modeli.
- `"all"`: pełny katalog Gateway, z pominięciem `agents.defaults.models`. Używaj tego do diagnostyki i interfejsów odkrywania, nie do zwykłych selektorów modeli.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, Gateway rozgłasza `exec.approval.requested`.
- Klienci operatorów rozstrzygają je przez wywołanie `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node` żądanie `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane dalej wywołania `node.invoke system.run` ponownie używają tego kanonicznego `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub `sessionKey` między przygotowaniem a końcowym zatwierdzonym przekazaniem `system.run`, Gateway odrzuca uruchomienie zamiast ufać zmienionemu ładunkowi.

## Awaryjne dostarczanie agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczania wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe zachowanie: nierozpoznane lub wyłącznie wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` umożliwia powrót do wykonywania tylko w sesji, gdy nie można rozpoznać żadnej zewnętrznej trasy możliwej do dostarczenia (na przykład sesje wewnętrzne/webchat lub niejednoznaczne konfiguracje wielokanałowe).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niezgodności.
- Schematy i modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości są stabilne w protokole v3 i stanowią oczekiwany punkt odniesienia dla klientów zewnętrznych.

| Stała                                     | Wartość domyślna                                      | Źródło                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Limit czasu żądania (na RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Limit czasu preauth / wyzwania połączenia | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env mogą zwiększyć sparowany budżet serwera/klienta) |
| Początkowe opóźnienie ponownego połączenia | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksymalne opóźnienie ponownego połączenia | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Ograniczenie szybkiej ponownej próby po zamknięciu tokenu urządzenia | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Okres karencji wymuszonego zatrzymania przed `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Domyślny limit czasu `stopAndWait()`       | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Domyślny interwał tick (przed `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Zamknięcie po przekroczeniu limitu czasu tick | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Serwer ogłasza efektywne wartości `policy.tickIntervalMs`, `policy.maxPayload` i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości zamiast domyślnych wartości sprzed handshake.

## Uwierzytelnianie

- Uwierzytelnianie Gateway wspólnym sekretem używa `connect.params.auth.token` albo
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby przenoszące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) albo tryb spoza loopback
  `gateway.auth.mode: "trusted-proxy"`, spełniają kontrolę uwierzytelniania połączenia na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatne wejście `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie połączenia
  wspólnym sekretem; nie wystawiaj tego trybu na publiczne/niezaufane wejście.
- Po sparowaniu Gateway wystawia **token urządzenia** ograniczony do roli połączenia
  i zakresów. Jest zwracany w `hello-ok.auth.deviceToken` i powinien zostać
  utrwalony przez klienta na potrzeby przyszłych połączeń.
- Klienci powinni utrwalać główny `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne połączenie z tym **zapisanym** tokenem urządzenia powinno również ponownie użyć zapisanego
  zatwierdzonego zestawu zakresów dla tego tokenu. Zachowuje to dostęp do odczytu/próbkowania/statusu,
  który został już przyznany, i zapobiega cichemu zawężeniu ponownych połączeń do
  węższego, niejawnego zakresu tylko dla administratora.
- Składanie uwierzytelniania połączenia po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest niezależne i zawsze jest przekazywane, gdy jest ustawione.
  - `auth.token` jest wypełniany według priorytetu: najpierw jawny token współdzielony,
    potem jawny `deviceToken`, a następnie zapisany token dla urządzenia (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żadna z powyższych opcji nie ustaliła
    `auth.token`. Token współdzielony lub dowolny ustalony token urządzenia go tłumi.
  - Automatyczne podniesienie zapisanego tokenu urządzenia przy jednorazowej
    ponownej próbie `AUTH_TOKEN_MISMATCH` jest ograniczone wyłącznie do **zaufanych punktów końcowych** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez przypięcia nie spełnia warunków.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` są tokenami przekazania bootstrap.
  Utrwalaj je tylko wtedy, gdy połączenie użyło uwierzytelniania bootstrap na zaufanym transporcie,
  takim jak `wss://` albo parowanie loopback/lokalne.
- Jeśli klient podaje **jawny** `deviceToken` lub jawne `scopes`, ten
  zestaw zakresów żądany przez wywołującego pozostaje autorytatywny; zakresy z pamięci podręcznej są
  ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokenu dla urządzenia.
- Tokeny urządzeń można rotować/unieważniać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- `device.token.rotate` zwraca metadane rotacji. Odzwierciedla zastępczy
  token bearer tylko dla wywołań z tego samego urządzenia, które są już uwierzytelnione tym
  tokenem urządzenia, aby klienci używający tylko tokenu mogli utrwalić zamiennik przed
  ponownym połączeniem. Rotacje współdzielone/administracyjne nie odzwierciedlają tokenu bearer.
- Wydawanie, rotacja i unieważnianie tokenów pozostają ograniczone do zatwierdzonego zestawu ról
  zapisanego we wpisie parowania danego urządzenia; mutacja tokenu nie może rozszerzyć ani
  wskazać roli urządzenia, której zatwierdzenie parowania nigdy nie przyznało.
- W sesjach tokenów sparowanych urządzeń zarządzanie urządzeniami jest ograniczone do siebie, chyba że
  wywołujący ma także `operator.admin`: wywołujący bez uprawnień administratora mogą usuwać/unieważniać/rotować
  tylko wpis **własnego** urządzenia.
- `device.token.rotate` i `device.token.revoke` sprawdzają też docelowy zestaw zakresów tokenu operatora
  względem bieżących zakresów sesji wywołującego. Wywołujący bez uprawnień administratora
  nie mogą rotować ani unieważniać szerszego tokenu operatora niż ten, który już mają.
- Niepowodzenia uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (wartość logiczna)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą wykonać jedną ograniczoną ponowną próbę z tokenem dla urządzenia z pamięci podręcznej.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać wskazówki działania dla operatora.

## Tożsamość urządzenia i parowanie

- Nodes powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  odcisku palca pary kluczy.
- Gateways wystawiają tokeny dla pary urządzenie + rola.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączono lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania koncentruje się na bezpośrednich połączeniach local loopback.
- OpenClaw ma też wąską ścieżkę samopołączenia lokalnego dla backendu/kontenera na potrzeby
  zaufanych przepływów pomocniczych ze wspólnym sekretem.
- Połączenia z tego samego hosta przez tailnet lub LAN nadal są traktowane jako zdalne na potrzeby parowania i
  wymagają zatwierdzenia.
- Klienci WS zwykle zawierają tożsamość `device` podczas `connect` (operator +
  node). Jedynymi wyjątkami operatora bez urządzenia są jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niezabezpieczonym HTTP tylko na localhost.
  - pomyślne uwierzytelnienie operatora Control UI w `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (awaryjne obejście, poważne obniżenie bezpieczeństwa).
  - bezpośrednie RPC backendu `gateway-client` przez loopback uwierzytelnione współdzielonym
    tokenem/hasłem Gateway.
- Wszystkie połączenia muszą podpisać nonce `connect.challenge` dostarczone przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed wyzwania, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` pod `error.details.code` ze stabilnym `error.details.reason`.

Typowe niepowodzenia migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (albo wysłał pustą wartość). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał przy użyciu nieaktualnego/błędnego nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Podpisany znacznik czasu znajduje się poza dozwolonym odchyleniem. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do odcisku palca klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalizacja klucza publicznego nie powiodła się. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisuj ładunek v2, który zawiera nonce serwera.
- Wysyłaj ten sam nonce w `connect.params.device.nonce`.
- Preferowanym ładunkiem podpisu jest `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól urządzenia/klienta/roli/zakresów/tokenu/nonce.
- Starsze podpisy `v2` pozostają akceptowane ze względu na zgodność, ale przypinanie metadanych
  sparowanego urządzenia nadal kontroluje politykę poleceń przy ponownym połączeniu.

## TLS i przypinanie

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk palca certyfikatu Gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` lub CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API Gateway** (status, kanały, modele, chat,
agent, sesje, nodes, zatwierdzenia itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.

## Powiązane

- [Protokół mostu](/pl/gateway/bridge-protocol)
- [Runbook Gateway](/pl/gateway)
