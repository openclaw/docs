---
read_when:
    - Implementowanie lub aktualizowanie klientów WS Gateway
    - Debugowanie niezgodności protokołu lub błędów połączenia
    - Ponowne generowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-05-01T09:59:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8295e4e416250e7381393c0aa6a0016719f96552485cf9d56bb3896c9704c4a9
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol jest **pojedynczą płaszczyzną sterowania + transportem węzłów** dla
OpenClaw. Wszyscy klienci (CLI, web UI, aplikacja macOS, węzły iOS/Android, węzły headless)
łączą się przez WebSocket i deklarują swoją **rolę** + **zakres** podczas uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po udanym uzgodnieniu połączenia klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Gdy diagnostyka jest włączona,
  zbyt duże ramki przychodzące i wolne bufory wychodzące emitują zdarzenia `payload.large`
  zanim gateway zamknie połączenie lub odrzuci dotkniętą ramkę. Te zdarzenia zachowują
  rozmiary, limity, powierzchnie i bezpieczne kody powodów. Nie zachowują treści wiadomości,
  zawartości załączników, surowej treści ramki, tokenów, ciasteczek ani wartości sekretów.

## Uzgadnianie połączenia (connect)

Gateway → Klient (wyzwanie przed połączeniem):

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

Gateway → Klient:

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

Gdy Gateway nadal kończy uruchamianie sidecarów startowych, żądanie `connect` może
zwrócić ponawialny błąd `UNAVAILABLE` z `details.reason` ustawionym na
`"startup-sidecars"` oraz `retryAfterMs`. Klienci powinni ponowić taką odpowiedź
w ramach swojego ogólnego budżetu połączenia, zamiast prezentować ją jako końcową
awarię uzgadniania połączenia.

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`src/gateway/protocol/schema/frames.ts`). `auth` także jest wymagane i raportuje
wynegocjowaną rolę/zakresy. `canvasHostUrl` jest opcjonalne.

Gdy nie wydano tokenu urządzenia, `hello-ok.auth` raportuje wynegocjowane
uprawnienia bez pól tokenu:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Zaufani klienci backendowi działający w tym samym procesie (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogą pominąć `device` przy bezpośrednich połączeniach loopback,
gdy uwierzytelniają się współdzielonym tokenem/hasłem gateway. Ta ścieżka jest zarezerwowana
dla wewnętrznych RPC płaszczyzny sterowania i zapobiega blokowaniu lokalnej pracy backendu,
takiej jak aktualizacje sesji subagentów, przez nieaktualne bazowe dane parowania CLI/urządzenia.
Klienci zdalni, klienci pochodzący z przeglądarki, klienci węzłowi oraz jawni klienci
z tokenem urządzenia/tożsamością urządzenia nadal używają zwykłych kontroli parowania
i podnoszenia zakresów.

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

Podczas zaufanego przekazania bootstrapu `hello-ok.auth` może także zawierać dodatkowe
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

Dla wbudowanego przepływu bootstrapu węzeł/operator główny token węzła pozostaje
`scopes: []`, a każdy przekazany token operatora pozostaje ograniczony do allowlisty
operatora bootstrapu (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kontrole zakresów bootstrapu pozostają
prefiksowane rolą: wpisy operatora spełniają wyłącznie żądania operatora, a role
inne niż operator nadal potrzebują zakresów z własnym prefiksem roli.

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

## Ramkowanie

- **Żądanie**: `{type:"req", id, method, params}`
- **Odpowiedź**: `{type:"res", id, ok, payload|error}`
- **Zdarzenie**: `{type:"event", event, payload, seq?, stateVersion?}`

Metody wywołujące skutki uboczne wymagają **kluczy idempotencji** (zobacz schemat).

## Role + zakresy

### Role

- `operator` = klient płaszczyzny sterowania (CLI/UI/automatyzacja).
- `node` = host możliwości (camera/screen/canvas/system.run).

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

Metody RPC gateway zarejestrowane przez Plugin mogą żądać własnego zakresu operatora, ale
zarezerwowane główne prefiksy administracyjne (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze rozwiązują się do `operator.admin`.

Zakres metody jest tylko pierwszą bramką. Niektóre komendy slash osiągane przez
`chat.send` nakładają na to surowsze kontrole na poziomie komendy. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w czasie zatwierdzania, ponad
podstawowym zakresem metody:

- żądania bez komend: `operator.pairing`
- żądania z komendami węzła innymi niż exec: `operator.pairing` + `operator.write`
- żądania zawierające `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Możliwości/komendy/uprawnienia (node)

Węzły deklarują twierdzenia o możliwościach w czasie połączenia:

- `caps`: kategorie możliwości wysokiego poziomu.
- `commands`: allowlista komend dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **twierdzenia** i egzekwuje allowlisty po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy kluczowane według tożsamości urządzenia.
- Wpisy obecności obejmują `deviceId`, `roles` i `scopes`, aby UI mogły pokazywać jeden wiersz na urządzenie
  nawet wtedy, gdy łączy się ono zarówno jako **operator**, jak i **node**.
- `node.list` zawiera opcjonalne pola `lastSeenAtMs` i `lastSeenReason`. Połączone węzły raportują
  czas bieżącego połączenia jako `lastSeenAtMs` z powodem `connect`; sparowane węzły mogą także raportować
  trwałą obecność w tle, gdy zaufane zdarzenie węzła aktualizuje ich metadane parowania.

### Zdarzenie aktywności węzła w tle

Węzły mogą wywołać `node.event` z `event: "node.presence.alive"`, aby zarejestrować, że sparowany węzeł był
aktywny podczas wybudzenia w tle bez oznaczania go jako połączonego.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` jest zamkniętym enumem: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` lub `connect`. Nieznane ciągi wyzwalacza są normalizowane przez gateway do
`background` przed utrwaleniem. Zdarzenie jest trwałe tylko dla uwierzytelnionych sesji urządzeń
węzłowych; sesje bez urządzenia lub niesparowane zwracają `handled: false`.

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

## Zakresowanie zdarzeń broadcast

Zdarzenia broadcast wypychane przez serwer przez WebSocket są bramkowane zakresem, tak aby sesje o zakresie parowania lub tylko węzłowe nie odbierały pasywnie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Broadcasty `plugin.*` definiowane przez Plugin** są bramkowane do `operator.write` lub `operator.admin`, zależnie od tego, jak Plugin je zarejestrował.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia połączenia/rozłączenia itd.) pozostają nieograniczone, aby stan transportu był obserwowalny dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń broadcast** są domyślnie bramkowane zakresem (fail-closed), chyba że zarejestrowany handler jawnie je rozluźni.

Każde połączenie klienta zachowuje własny numer sekwencji per klient, więc broadcasty zachowują monotoniczne uporządkowanie na tym gnieździe nawet wtedy, gdy różni klienci widzą różne podzbiory strumienia zdarzeń odfiltrowane według zakresu.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż powyższe przykłady uzgadniania połączenia/uwierzytelniania. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` jest konserwatywną listą
odkrywania zbudowaną z `src/gateway/server-methods-list.ts` oraz załadowanych
eksportów metod pluginu/kanału. Traktuj ją jako odkrywanie funkcji, a nie pełne
wyliczenie `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System i tożsamość">
    - `health` zwraca buforowaną lub świeżo sprawdzoną migawkę stanu gateway.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestrator stabilności diagnostycznej. Zachowuje metadane operacyjne, takie jak nazwy zdarzeń, liczby, rozmiary bajtów, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów i identyfikatory sesji. Nie zachowuje tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, ciasteczek ani wartości sekretów. Wymagany jest zakres odczytu operatora.
    - `status` zwraca podsumowanie gateway w stylu `/status`; pola wrażliwe są uwzględniane tylko dla klientów operatora z zakresem administratora.
    - `gateway.identity.get` zwraca tożsamość urządzenia gateway używaną przez przepływy relay i parowania.
    - `system-presence` zwraca bieżącą migawkę obecności dla połączonych urządzeń operator/węzeł.
    - `system-event` dopisuje zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
    - `last-heartbeat` zwraca najnowsze utrwalone zdarzenie Heartbeat.
    - `set-heartbeats` przełącza przetwarzanie Heartbeat na gateway.

  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolonych w czasie działania. Przekaż `{ "view": "configured" }` dla skonfigurowanych modeli o rozmiarze odpowiednim dla selektora (`agents.defaults.models` najpierw, potem `models.providers.*.models`) albo `{ "view": "all" }` dla pełnego katalogu.
    - `usage.status` zwraca okna użycia dostawcy/podsumowania pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
    - `doctor.memory.status` zwraca gotowość pamięci wektorowej / buforowanego osadzania dla aktywnego domyślnego obszaru roboczego agenta. Przekaż `{ "probe": true }` lub `{ "deep": true }` tylko wtedy, gdy wywołujący wyraźnie chce aktywnego pingowania dostawcy osadzania.
    - `doctor.memory.remHarness` zwraca ograniczony, tylko do odczytu podgląd zestawu REM dla zdalnych klientów płaszczyzny sterowania. Może zawierać ścieżki obszaru roboczego, fragmenty pamięci, wyrenderowany ugruntowany Markdown i kandydatów do głębokiej promocji, więc wywołujący potrzebują `operator.read`.
    - `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji.
    - `sessions.usage.timeseries` zwraca użycie w szeregach czasowych dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Kanały i pomocnicy logowania">
    - `channels.status` zwraca podsumowania stanu wbudowanych + dołączonych kanałów/pluginów.
    - `channels.logout` wylogowuje określony kanał/konto tam, gdzie kanał obsługuje wylogowanie.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na ukończenie tego przepływu logowania QR/web i po sukcesie uruchamia kanał.
    - `push.test` wysyła testowe powiadomienie push APNs do zarejestrowanego węzła iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słów wybudzania.
    - `voicewake.set` aktualizuje wyzwalacze słów wybudzania i rozgłasza zmianę.

  </Accordion>

  <Accordion title="Wiadomości i dzienniki">
    - `send` to bezpośredni RPC dostarczania wychodzącego dla wysyłek kierowanych na kanał/konto/wątek poza runnerem czatu.
    - `logs.tail` zwraca skonfigurowany końcowy fragment dziennika plikowego Gateway z kontrolą kursora/limitu i maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Talk i TTS">
    - `talk.config` zwraca efektywny payload konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (lub `operator.admin`).
    - `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów WebChat/Control UI.
    - `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców awaryjnych oraz stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny inwentarz dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRefs i podmienia stan sekretów w czasie działania tylko przy pełnym sukcesie.
    - `secrets.resolve` rozwiązuje przypisania sekretów docelowych dla polecenia dla określonego zestawu poleceń/celów.
    - `config.get` zwraca bieżącą migawkę konfiguracji i hash.
    - `config.set` zapisuje zweryfikowany payload konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji.
    - `config.apply` waliduje + zastępuje pełny payload konfiguracji.
    - `config.schema` zwraca payload aktywnego schematu konfiguracji używany przez narzędzia Control UI i CLI: schemat, `uiHints`, wersję oraz metadane generowania, w tym metadane schematów pluginów + kanałów, gdy środowisko uruchomieniowe może je załadować. Schemat zawiera metadane pól `title` / `description` pochodzące z tych samych etykiet i tekstu pomocy, których używa UI, w tym gałęzie zagnieżdżonych obiektów, symboli wieloznacznych, elementów tablicy oraz kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pól.
    - `config.schema.lookup` zwraca payload wyszukiwania ograniczonego do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną podpowiedź + `hintPath` oraz bezpośrednie podsumowania dzieci do drążenia w UI/CLI. Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika i wspólne pola walidacji (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia liczbowe/ciągów/tablic/obiektów oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania dzieci ujawniają `key`, znormalizowaną `path`, `type`, `required`, `hasChildren`, a także dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji Gateway i planuje restart tylko wtedy, gdy sama aktualizacja się powiodła. Aktualizacje menedżera pakietów wymuszają nieodroczony restart aktualizacyjny bez okresu schłodzenia po podmianie pakietu, aby stary proces Gateway nie kontynuował leniwego ładowania z zastąpionego drzewa `dist`.
    - `update.status` zwraca najnowszy zbuforowany sentinel restartu aktualizacji, w tym wersję uruchomioną po restarcie, gdy jest dostępna.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreatora wdrożenia przez WS RPC.

  </Accordion>

  <Accordion title="Pomocnicy agenta i obszaru roboczego">
    - `agents.list` zwraca skonfigurowane wpisy agentów, w tym efektywny model i metadane czasu działania.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów i połączeniem z obszarem roboczym.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami startowymi obszaru roboczego udostępnianymi agentowi.
    - `artifacts.list`, `artifacts.get` i `artifacts.download` udostępniają podsumowania artefaktów pochodzących z transkrypcji oraz pobrania dla jawnego zakresu `sessionKey`, `runId` lub `taskId`. Zapytania o przebiegi i zadania rozwiązują sesję właściciela po stronie serwera i zwracają tylko media transkrypcji z pasującym pochodzeniem; niebezpieczne lub lokalne źródła URL zwracają nieobsługiwane pobrania zamiast pobierania po stronie serwera.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie przebiegu i zwraca końcową migawkę, gdy jest dostępna.

  </Accordion>

  <Accordion title="Kontrola sesji">
    - `sessions.list` zwraca bieżący indeks sesji, w tym metadane `agentRuntime` dla każdego wiersza, gdy skonfigurowany jest backend czasu działania agenta.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkrypcji/wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkrypcji dla określonych kluczy sesji.
    - `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant przerwania i sterowania dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji. Wywołujący może przekazać `key` oraz opcjonalne `runId` albo przekazać samo `runId` dla aktywnych przebiegów, które Gateway może rozwiązać do sesji.
    - `sessions.patch` aktualizuje metadane/nadpisania sesji i zgłasza rozwiązany model kanoniczny oraz efektywny `agentRuntime`.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest normalizowane pod kątem wyświetlania dla klientów UI: wbudowane znaczniki dyrektyw są usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w zwykłym tekście (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi) i ujawnione tokeny kontrolne modelu ASCII/pełnej szerokości są usuwane, czyste wiersze asystenta z cichymi tokenami, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a zbyt duże wiersze mogą być zastępowane symbolami zastępczymi.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.

  </Accordion>

  <Accordion title="Parowanie Node, wywołania i oczekująca praca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` i `node.pair.verify` obejmują parowanie Node i weryfikację startową.
    - `node.list` i `node.describe` zwracają stan znanych/połączonych Node.
    - `node.rename` aktualizuje etykietę sparowanego Node.
    - `node.invoke` przekazuje polecenie do połączonego Node.
    - `node.invoke.result` zwraca wynik żądania wywołania.
    - `node.event` przenosi zdarzenia pochodzące z Node z powrotem do gateway.
    - `node.canvas.capability.refresh` odświeża tokeny możliwości canvas o ograniczonym zakresie.
    - `node.pending.pull` i `node.pending.ack` to API kolejki połączonego Node.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą dla Node offline/rozłączonych.

  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia exec oraz wyszukiwanie/odtwarzanie oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie exec i zwraca ostateczną decyzję (lub `null` po przekroczeniu limitu czasu).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają migawkami zasad zatwierdzania exec w gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną dla Node zasadą zatwierdzania exec przez polecenia przekaźnika Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują przepływy zatwierdzania definiowane przez plugin.

  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe lub przy następnym Heartbeat wstrzyknięcie tekstu wybudzenia; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Wspólne rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject` i inne zdarzenia czatu
  dotyczące wyłącznie transkrypcji.
- `session.message` i `session.tool`: aktualizacje transkrypcji/strumienia zdarzeń dla
  subskrybowanej sesji.
- `sessions.changed`: zmieniono indeks sesji lub metadane.
- `presence`: aktualizacje migawki obecności systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja migawki kondycji gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany przebiegu/zadania Cron.
- `shutdown`: powiadomienie o wyłączeniu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania Node.
- `node.invoke.request`: rozgłaszanie żądania wywołania Node.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniono konfigurację wyzwalacza słów wybudzania.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia zatwierdzenia exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzenia pluginu.

### Metody pomocnicze Node

- Nodes mogą wywołać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych Skills
  na potrzeby kontroli automatycznego zezwalania.

### Metody pomocnicze operatora

- Operatorzy mogą wywołać `commands.list` (`operator.read`), aby pobrać
  inwentarz poleceń czasu wykonywania dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, do której powierzchni kieruje podstawowe `name`:
    - `text` zwraca podstawowy token polecenia tekstowego bez początkowego `/`
    - `native` oraz domyślna ścieżka `both` zwracają natywne nazwy świadome dostawcy,
      gdy są dostępne
  - `textAliases` zawiera dokładne aliasy z ukośnikiem, takie jak `/model` i `/m`.
  - `nativeName` zawiera natywną nazwę polecenia świadomą dostawcy, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na nazewnictwo natywne oraz dostępność
    natywnych poleceń Plugin.
  - `includeArgs=false` pomija serializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywołać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi czasu wykonywania dla
  agenta. Odpowiedź obejmuje pogrupowane narzędzia oraz metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel Plugin, gdy `source="plugin"`
  - `optional`: czy narzędzie Plugin jest opcjonalne
- Operatorzy mogą wywołać `tools.effective` (`operator.read`), aby pobrać efektywny w czasie wykonywania
  inwentarz narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wywodzi zaufany kontekst czasu wykonywania z sesji po stronie serwera, zamiast akceptować
    kontekst uwierzytelniania lub dostarczania podany przez wywołującego.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, czego aktywna konwersacja może użyć teraz,
    w tym narzędzia rdzenia, Plugin i kanału.
- Operatorzy mogą wywołać `tools.invoke` (`operator.write`), aby uruchomić jedno dostępne narzędzie przez
  tę samą ścieżkę polityki Gateway co `/tools/invoke`.
  - `name` jest wymagane. `args`, `sessionKey`, `agentId`, `confirm` oraz
    `idempotencyKey` są opcjonalne.
  - Jeśli obecne są zarówno `sessionKey`, jak i `agentId`, rozpoznany agent sesji musi pasować do
    `agentId`.
  - Odpowiedź jest kopertą przeznaczoną dla SDK z polami `ok`, `toolName`, opcjonalnym `output` oraz typowanymi
    polami `error`. Odmowy zatwierdzenia lub polityki zwracają `ok:false` w ładunku, zamiast
    omijać potok polityki narzędzi Gateway.
- Operatorzy mogą wywołać `skills.status` (`operator.read`), aby pobrać widoczny
  inwentarz Skills dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź obejmuje kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz
    oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywołać `skills.search` i `skills.detail` (`operator.read`) dla
  metadanych odkrywania ClawHub.
- Operatorzy mogą wywołać `skills.install` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje
    folder Skills w katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb instalatora Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście Gateway.
- Operatorzy mogą wywołać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug albo wszystkie śledzone instalacje ClawHub w
    domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji aktualizuje wartości `skills.entries.<skillKey>`, takie jak `enabled`,
    `apiKey` i `env`.

### Widoki `models.list`

`models.list` akceptuje opcjonalny parametr `view`:

- Pominięty lub `"default"`: bieżące zachowanie czasu wykonywania. Jeśli skonfigurowano `agents.defaults.models`, odpowiedzią jest dozwolony katalog; w przeciwnym razie odpowiedzią jest pełny katalog Gateway.
- `"configured"`: zachowanie o rozmiarze selektora. Jeśli skonfigurowano `agents.defaults.models`, nadal ma pierwszeństwo. W przeciwnym razie odpowiedź używa jawnych wpisów `models.providers.*.models`, przechodząc do pełnego katalogu tylko wtedy, gdy nie istnieją żadne skonfigurowane wiersze modeli.
- `"all"`: pełny katalog Gateway, z pominięciem `agents.defaults.models`. Używaj tego do diagnostyki i interfejsów odkrywania, nie do zwykłych selektorów modeli.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, Gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozstrzygają je, wywołując `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node`, `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane dalej wywołania `node.invoke system.run` ponownie używają tego kanonicznego
  `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmodyfikuje `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` między przygotowaniem a końcowym zatwierdzonym przekazaniem `system.run`, Gateway
  odrzuca uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Awaryjne dostarczanie agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczenia wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe zachowanie: nierozpoznane lub wyłącznie wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na powrót do wykonywania tylko w sesji, gdy nie da się rozpoznać zewnętrznej trasy możliwej do dostarczenia (na przykład sesje wewnętrzne/webchat lub niejednoznaczne konfiguracje wielokanałowe).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niezgodności.
- Schematy i modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości są
stabilne w protocol v3 i stanowią oczekiwaną bazę dla klientów zewnętrznych.

| Stała                                     | Domyślna                                             | Źródło                                                                                    |
| ----------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`                                         |
| Limit czasu żądania (na RPC)              | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                              |
| Limit czasu preauth / connect-challenge   | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (config/env mogą zwiększyć sparowany budżet serwera/klienta) |
| Początkowe opóźnienie ponownego połączenia | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                     |
| Maks. opóźnienie ponownego połączenia     | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                             |
| Ograniczenie szybkiej próby po zamknięciu tokena urządzenia | `250` ms                                             | `src/gateway/client.ts`                                                                   |
| Okres karencji wymuszonego zatrzymania przed `terminate()` | `250` ms                                             | `FORCE_STOP_TERMINATE_GRACE_MS`                                                           |
| Domyślny limit czasu `stopAndWait()`      | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                |
| Domyślny interwał taktu (przed `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                                                   |
| Zamknięcie po przekroczeniu limitu czasu taktu | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                         |

Serwer ogłasza efektywne wartości `policy.tickIntervalMs`, `policy.maxPayload`
oraz `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości
zamiast wartości domyślnych sprzed uzgadniania.

## Uwierzytelnianie

- Uwierzytelnianie Gateway z użyciem współdzielonego sekretu używa `connect.params.auth.token` albo
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby przenoszące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) albo nie-loopback
  `gateway.auth.mode: "trusted-proxy"`, spełniają sprawdzenie uwierzytelnienia połączenia na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatny ingress `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie połączenia
  współdzielonym sekretem; nie wystawiaj tego trybu na publicznym/niezaufanym ingress.
- Po sparowaniu Gateway wystawia **token urządzenia** ograniczony do roli połączenia
  + zakresów. Jest zwracany w `hello-ok.auth.deviceToken` i powinien być
  trwale zapisany przez klienta na potrzeby przyszłych połączeń.
- Klienci powinni trwale zapisywać główny `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne łączenie z tym **zapisanym** tokenem urządzenia powinno też ponownie używać zapisanego
  zatwierdzonego zestawu zakresów dla tego tokenu. Zachowuje to dostęp read/probe/status,
  który został już przyznany, i pozwala uniknąć cichego zawężenia ponownych połączeń do
  węższego, niejawnego zakresu tylko dla administratora.
- Składanie uwierzytelniania połączenia po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest niezależne i zawsze jest przekazywane, gdy jest ustawione.
  - `auth.token` jest wypełniane według priorytetu: najpierw jawny token współdzielony,
    następnie jawny `deviceToken`, a potem zapisany token dla urządzenia (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żadne z powyższych nie rozwiązało
    `auth.token`. Token współdzielony lub dowolny rozwiązany token urządzenia go wyłącza.
  - Automatyczne promowanie zapisanego tokenu urządzenia przy jednorazowej
    ponownej próbie `AUTH_TOKEN_MISMATCH` jest ograniczone do **wyłącznie zaufanych punktów końcowych** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez pinningu się nie kwalifikuje.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` to tokeny przekazania bootstrap.
  Zapisuj je trwale tylko wtedy, gdy połączenie używało uwierzytelniania bootstrap na zaufanym transporcie,
  takim jak `wss://` albo parowanie loopback/lokalne.
- Jeśli klient podaje **jawny** `deviceToken` albo jawne `scopes`, ten
  żądany przez wywołującego zestaw zakresów pozostaje autorytatywny; zakresy z cache są
  używane ponownie tylko wtedy, gdy klient ponownie używa zapisanego tokenu dla urządzenia.
- Tokeny urządzeń można rotować/odwoływać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- `device.token.rotate` zwraca metadane rotacji. Zwraca zastępczy
  token bearer tylko dla wywołań z tego samego urządzenia, które są już uwierzytelnione tym
  tokenem urządzenia, aby klienci używający wyłącznie tokenu mogli zapisać jego zamiennik przed
  ponownym połączeniem. Rotacje współdzielone/admin nie zwracają tokenu bearer.
- Wystawianie, rotacja i odwoływanie tokenów pozostają ograniczone do zatwierdzonego zestawu ról
  zapisanego we wpisie parowania tego urządzenia; mutacja tokenu nie może rozszerzyć ani
  wskazać roli urządzenia, której zatwierdzenie parowania nigdy nie przyznało.
- W przypadku sparowanych sesji tokenów urządzeń zarządzanie urządzeniami jest ograniczone do siebie, chyba że
  wywołujący ma również `operator.admin`: wywołujący bez uprawnień administratora mogą usuwać/odwoływać/rotować
  tylko wpis **własnego** urządzenia.
- `device.token.rotate` i `device.token.revoke` sprawdzają też docelowy zestaw zakresów
  tokenu operatora względem bieżących zakresów sesji wywołującego. Wywołujący bez uprawnień administratora
  nie mogą rotować ani odwoływać szerszego tokenu operatora niż ten, który już mają.
- Błędy uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z tokenem dla urządzenia z cache.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać wskazówki działań operatora.

## Tożsamość urządzenia + parowanie

- Węzły powinny zawierać stabilną tożsamość urządzenia (`device.id`) pochodzącą z
  odcisku palca pary kluczy.
- Gateway wystawiają tokeny na urządzenie + rolę.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączone jest lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania koncentruje się na bezpośrednich połączeniach local loopback.
- OpenClaw ma też wąską ścieżkę samopołączenia lokalnego dla backendu/kontenera na potrzeby
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia z tego samego hosta przez tailnet lub LAN nadal są traktowane jako zdalne na potrzeby parowania i
  wymagają zatwierdzenia.
- Klienci WS zwykle dołączają tożsamość `device` podczas `connect` (operator +
  węzeł). Jedynymi wyjątkami operatora bez urządzenia są jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności niebezpiecznego HTTP tylko na localhost.
  - udane uwierzytelnianie operatora Control UI w `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (awaryjne obejście, poważne obniżenie bezpieczeństwa).
  - bezpośrednie backendowe RPC `gateway-client` przez loopback uwierzytelnione współdzielonym
    tokenem/hasłem Gateway.
- Wszystkie połączenia muszą podpisać nonce `connect.challenge` dostarczony przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają podpisywania sprzed challenge, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` pod `error.details.code` ze stabilnym `error.details.reason`.

Typowe niepowodzenia migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (albo wysłał pusty). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał z nieaktualnym/błędnym nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.         |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Podpisany znacznik czasu jest poza dozwolonym odchyleniem. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do odcisku palca klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonizacja klucza publicznego nie powiodły się. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisuj ładunek v2, który zawiera nonce serwera.
- Wysyłaj ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól urządzenia/klienta/roli/zakresów/tokenu/nonce.
- Starsze podpisy `v2` pozostają akceptowane dla zgodności, ale przypięcie
  metadanych sparowanego urządzenia nadal kontroluje zasady poleceń przy ponownym połączeniu.

## TLS + pinning

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk palca certyfikatu Gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` albo CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API Gateway** (status, kanały, modele, chat,
agent, sesje, węzły, zatwierdzenia itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.

## Powiązane

- [Protokół Bridge](/pl/gateway/bridge-protocol)
- [Runbook Gateway](/pl/gateway)
