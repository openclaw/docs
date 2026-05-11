---
read_when:
    - Implementowanie lub aktualizowanie klientów WS dla Gateway
    - Debugowanie niezgodności protokołu lub niepowodzeń połączenia
    - Ponowne generowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie połączenia, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-05-11T20:30:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

Protokół Gateway WS jest **jedną płaszczyzną sterowania + transportem węzłów** dla
OpenClaw. Wszyscy klienci (CLI, interfejs WWW, aplikacja macOS, węzły iOS/Android,
węzły bezinterfejsowe) łączą się przez WebSocket i deklarują swoją **rolę** oraz
**zakres** podczas uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po udanym uzgodnieniu połączenia klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` oraz
  `hello-ok.policy.maxBufferedBytes`. Gdy diagnostyka jest włączona,
  zbyt duże ramki przychodzące i powolne bufory wychodzące emitują zdarzenia `payload.large`
  zanim Gateway zamknie lub odrzuci daną ramkę. Te zdarzenia zachowują
  rozmiary, limity, powierzchnie i bezpieczne kody powodów. Nie zachowują treści
  wiadomości, zawartości załączników, surowej treści ramki, tokenów, ciasteczek ani wartości tajnych.

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
    "maxProtocol": 4,
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
    "protocol": 4,
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

Gdy Gateway wciąż kończy uruchamianie procesów pomocniczych, żądanie `connect` może
zwrócić ponawialny błąd `UNAVAILABLE` z `details.reason` ustawionym na
`"startup-sidecars"` oraz `retryAfterMs`. Klienci powinni ponowić taką odpowiedź
w ramach swojego ogólnego budżetu połączenia zamiast pokazywać ją jako końcową
awarię uzgadniania połączenia.

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`src/gateway/protocol/schema/frames.ts`). `auth` także jest wymagane i raportuje
wynegocjowaną rolę/zakresy. `pluginSurfaceUrls` jest opcjonalne i mapuje nazwy
powierzchni pluginów, takie jak `canvas`, na zakresowane hostowane adresy URL.

Zakresowane adresy URL powierzchni pluginów mogą wygasać. Węzły mogą wywołać
`node.pluginSurface.refresh` z `{ "surface": "canvas" }`, aby otrzymać świeży
wpis w `pluginSurfaceUrls`. Eksperymentalna refaktoryzacja pluginu Canvas nie
obsługuje przestarzałej ścieżki zgodności `canvasHostUrl`, `canvasCapability` ani
`node.canvas.capability.refresh`; aktualni klienci natywni i Gateway muszą używać powierzchni pluginów.

Gdy token urządzenia nie zostanie wydany, `hello-ok.auth` raportuje wynegocjowane
uprawnienia bez pól tokenu:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Zaufani klienci backendu w tym samym procesie (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogą pomijać `device` w bezpośrednich połączeniach loopback, gdy
uwierzytelniają się współdzielonym tokenem/hasłem Gateway. Ta ścieżka jest zarezerwowana
dla wewnętrznych RPC płaszczyzny sterowania i zapobiega blokowaniu lokalnej pracy backendu,
takiej jak aktualizacje sesji podagentów, przez nieaktualne bazowe parowania CLI/urządzenia. Klienci zdalni,
klienci pochodzący z przeglądarki, klienci węzłów oraz jawni klienci tokenu urządzenia/tożsamości urządzenia
nadal używają zwykłych kontroli parowania i podnoszenia zakresu.

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

Podczas zaufanego przekazania bootstrap `hello-ok.auth` może również zawierać dodatkowe
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

Dla wbudowanego przepływu bootstrap węzeł/operator główny token węzła pozostaje
`scopes: []`, a każdy przekazany token operatora pozostaje ograniczony do listy dozwolonych
zakresów operatora bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kontrole zakresu bootstrap pozostają
prefiksowane rolą: wpisy operatora spełniają tylko żądania operatora, a role inne niż operator
nadal wymagają zakresów z prefiksem własnej roli.

### Przykład Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
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

Metody z efektami ubocznymi wymagają **kluczy idempotencji** (zobacz schemat).

## Role + zakresy

Pełny model zakresów operatora, kontrole w czasie zatwierdzania oraz semantykę współdzielonego sekretu
opisano w [Zakresach operatora](/pl/gateway/operator-scopes).

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

Metody RPC Gateway zarejestrowane przez plugin mogą żądać własnego zakresu operatora, ale
zarezerwowane podstawowe prefiksy administracyjne (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze rozstrzygają się do `operator.admin`.

Zakres metody jest tylko pierwszą bramką. Niektóre polecenia ukośnikowe osiągane przez
`chat.send` stosują dodatkowo surowsze kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w czasie zatwierdzania, oprócz
bazowego zakresu metody:

- żądania bez poleceń: `operator.pairing`
- żądania z poleceniami węzła innymi niż exec: `operator.pairing` + `operator.write`
- żądania obejmujące `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Możliwości/polecenia/uprawnienia (węzeł)

Węzły deklarują roszczenia możliwości podczas łączenia:

- `caps`: wysokopoziomowe kategorie możliwości, takie jak `camera`, `canvas`, `screen`,
  `location`, `voice` i `talk`.
- `commands`: lista dozwolonych poleceń dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i wymusza listy dozwolone po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy indeksowane tożsamością urządzenia.
- Wpisy obecności obejmują `deviceId`, `roles` i `scopes`, aby UI mogły pokazać jeden wiersz na urządzenie
  nawet wtedy, gdy łączy się ono zarówno jako **operator**, jak i **node**.
- `node.list` zawiera opcjonalne pola `lastSeenAtMs` i `lastSeenReason`. Połączone węzły raportują
  swój bieżący czas połączenia jako `lastSeenAtMs` z powodem `connect`; sparowane węzły mogą także raportować
  trwałą obecność w tle, gdy zaufane zdarzenie węzła aktualizuje ich metadane parowania.

### Zdarzenie działania węzła w tle

Węzły mogą wywołać `node.event` z `event: "node.presence.alive"`, aby zapisać, że sparowany węzeł był
aktywny podczas wybudzenia w tle bez oznaczania go jako połączonego.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` jest zamkniętym enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` lub `connect`. Nieznane ciągi wyzwalacza są normalizowane przez
Gateway do `background` przed utrwaleniem. Zdarzenie jest trwałe tylko dla uwierzytelnionych sesji
urządzeń węzłów; sesje bez urządzenia lub niesparowane zwracają `handled: false`.

Udane Gateway zwracają ustrukturyzowany wynik:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Starsze Gateway mogą nadal zwracać `{ "ok": true }` dla `node.event`; klienci powinni traktować to jako
potwierdzone RPC, a nie jako trwałe utrwalenie obecności.

## Zakresowanie zdarzeń broadcast

Zdarzenia broadcast wypychane przez serwer przez WebSocket są ograniczane zakresem, aby sesje ograniczone do parowania lub tylko węzłowe nie odbierały pasywnie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Broadcasty `plugin.*` zdefiniowane przez pluginy** są bramkowane do `operator.write` lub `operator.admin`, zależnie od sposobu ich zarejestrowania przez plugin.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia connect/disconnect itd.) pozostają nieograniczone, aby kondycja transportu była obserwowalna dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń broadcast** są domyślnie bramkowane zakresem (fail-closed), chyba że zarejestrowany handler jawnie je rozluźnia.

Każde połączenie klienta utrzymuje własny numer sekwencyjny per klient, dzięki czemu broadcasty zachowują monotoniczną kolejność na tym gnieździe nawet wtedy, gdy różni klienci widzą różne podzbiory strumienia zdarzeń odfiltrowane według zakresu.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż powyższe przykłady uzgadniania połączenia/uwierzytelniania. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` to konserwatywna
lista wykrywania zbudowana z `src/gateway/server-methods-list.ts` oraz załadowanych
eksportów metod pluginów/kanałów. Traktuj ją jako wykrywanie funkcji, a nie pełne
wyliczenie `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System i tożsamość">
    - `health` zwraca zbuforowany lub świeżo sprawdzony snapshot kondycji Gateway.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestrator stabilności diagnostycznej. Zachowuje metadane operacyjne, takie jak nazwy zdarzeń, liczby, rozmiary bajtowe, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów oraz identyfikatory sesji. Nie zachowuje tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań lub odpowiedzi, tokenów, ciasteczek ani wartości tajnych. Wymagany jest zakres odczytu operatora.
    - `status` zwraca podsumowanie Gateway w stylu `/status`; pola wrażliwe są uwzględniane tylko dla klientów operatora z zakresem administracyjnym.
    - `gateway.identity.get` zwraca tożsamość urządzenia Gateway używaną przez przepływy relay i parowania.
    - `system-presence` zwraca bieżący snapshot obecności dla połączonych urządzeń operatora/węzła.
    - `system-event` dopisuje zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
    - `last-heartbeat` zwraca najnowsze utrwalone zdarzenie heartbeat.
    - `set-heartbeats` przełącza przetwarzanie heartbeat w Gateway.

  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolonych w środowisku uruchomieniowym. Przekaż `{ "view": "configured" }` dla skonfigurowanych modeli o rozmiarze odpowiednim dla selektora (`agents.defaults.models` najpierw, potem `models.providers.*.models`) albo `{ "view": "all" }` dla pełnego katalogu.
    - `usage.status` zwraca okna użycia dostawcy/podsumowania pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
    - `doctor.memory.status` zwraca gotowość pamięci wektorowej / buforowanych embeddingów dla aktywnego domyślnego obszaru roboczego agenta. Przekaż `{ "probe": true }` lub `{ "deep": true }` tylko wtedy, gdy wywołujący jawnie chce ping do aktywnego dostawcy embeddingów.
    - `doctor.memory.remHarness` zwraca ograniczony, tylko do odczytu podgląd wiązki testowej REM dla zdalnych klientów płaszczyzny sterowania. Może zawierać ścieżki obszaru roboczego, fragmenty pamięci, wyrenderowany ugruntowany markdown oraz kandydatów do głębokiej promocji, więc wywołujący potrzebują `operator.read`.
    - `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji.
    - `sessions.usage.timeseries` zwraca szeregi czasowe użycia dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Kanały i pomocniki logowania">
    - `channels.status` zwraca podsumowania statusu wbudowanych + dołączonych kanałów/Plugin.
    - `channels.logout` wylogowuje z określonego kanału/konta, jeśli kanał obsługuje wylogowanie.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na ukończenie tego przepływu logowania QR/web i uruchamia kanał po powodzeniu.
    - `push.test` wysyła testowe powiadomienie push APNs do zarejestrowanego węzła iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słowa wybudzającego.
    - `voicewake.set` aktualizuje wyzwalacze słowa wybudzającego i rozgłasza zmianę.

  </Accordion>

  <Accordion title="Wiadomości i dzienniki">
    - `send` to bezpośrednie RPC dostarczania wychodzącego dla wysyłek kierowanych do kanału/konta/wątku poza wykonawcą czatu.
    - `logs.tail` zwraca ogon skonfigurowanego dziennika plikowego Gateway z kontrolkami kursora/limitu i maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Talk i TTS">
    - `talk.catalog` zwraca tylko do odczytu katalog dostawców Talk dla mowy, transkrypcji strumieniowej i głosu w czasie rzeczywistym. Zawiera identyfikatory dostawców, etykiety, stan konfiguracji, ujawnione identyfikatory modeli/głosów, tryby kanoniczne, transporty, strategie mózgu oraz flagi audio/możliwości czasu rzeczywistego bez zwracania sekretów dostawcy ani modyfikowania konfiguracji globalnej.
    - `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (lub `operator.admin`).
    - `talk.session.create` tworzy sesję Talk posiadaną przez Gateway dla `realtime/gateway-relay`, `transcription/gateway-relay` lub `stt-tts/managed-room`. `brain: "direct-tools"` wymaga `operator.admin`.
    - `talk.session.join` weryfikuje token sesji zarządzanego pokoju, emituje zdarzenia `session.ready` lub `session.replaced` według potrzeb oraz zwraca metadane pokoju/sesji wraz z ostatnimi zdarzeniami Talk bez tokenu w postaci jawnej ani zapisanego skrótu tokenu.
    - `talk.session.appendAudio` dołącza wejściowy dźwięk PCM base64 do sesji przekaźnika czasu rzeczywistego i transkrypcji posiadanych przez Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` i `talk.session.cancelTurn` sterują cyklem życia tury w zarządzanym pokoju z odrzuceniem nieaktualnej tury przed wyczyszczeniem stanu.
    - `talk.session.cancelOutput` zatrzymuje wyjściowy dźwięk asystenta, głównie dla wejścia w trakcie wypowiedzi bramkowanego przez VAD w sesjach przekaźnika Gateway.
    - `talk.session.submitToolResult` kończy wywołanie narzędzia dostawcy wyemitowane przez sesję przekaźnika czasu rzeczywistego posiadaną przez Gateway. Przekaż `options: { willContinue: true }` dla tymczasowego wyjścia narzędzia, gdy wynik końcowy pojawi się później, albo `options: { suppressResponse: true }`, gdy wynik narzędzia powinien zaspokoić wywołanie dostawcy bez uruchamiania kolejnej odpowiedzi asystenta w czasie rzeczywistym.
    - `talk.session.close` zamyka sesję przekaźnika, transkrypcji lub zarządzanego pokoju posiadaną przez Gateway i emituje końcowe zdarzenia Talk.
    - `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów WebChat/Control UI.
    - `talk.client.create` tworzy sesję dostawcy czasu rzeczywistego posiadaną przez klienta przy użyciu `webrtc` lub `provider-websocket`, podczas gdy Gateway posiada konfigurację, poświadczenia, instrukcje i politykę narzędzi.
    - `talk.client.toolCall` pozwala transportom czasu rzeczywistego posiadanym przez klienta przekazywać wywołania narzędzi dostawcy do polityki Gateway. Pierwszym obsługiwanym narzędziem jest `openclaw_agent_consult`; klienci otrzymują identyfikator uruchomienia i czekają na normalne zdarzenia cyklu życia czatu przed przesłaniem wyniku narzędzia specyficznego dla dostawcy.
    - `talk.event` to pojedynczy kanał zdarzeń Talk dla adapterów czasu rzeczywistego, transkrypcji, STT/TTS, zarządzanego pokoju, telefonii i spotkań.
    - `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców awaryjnych i stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny inwentarz dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRefs i podmienia stan sekretów środowiska uruchomieniowego tylko po pełnym powodzeniu.
    - `secrets.resolve` rozwiązuje przypisania sekretów docelowych dla polecenia dla określonego zestawu polecenie/cel.
    - `config.get` zwraca bieżącą migawkę konfiguracji i skrót.
    - `config.set` zapisuje zweryfikowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji.
    - `config.apply` weryfikuje + zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca aktywny ładunek schematu konfiguracji używany przez narzędzia Control UI i CLI: schemat, `uiHints`, wersję oraz metadane generowania, w tym metadane schematu Plugin + kanału, gdy środowisko uruchomieniowe może je załadować. Schemat zawiera metadane pól `title` / `description` wyprowadzone z tych samych etykiet i tekstu pomocy używanych przez UI, w tym zagnieżdżone gałęzie obiektów, wieloznaczników, elementów tablicy oraz kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pól.
    - `config.schema.lookup` zwraca ładunek wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę + `hintPath` oraz podsumowania bezpośrednich elementów podrzędnych do przechodzenia w głąb w UI/CLI. Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika i wspólne pola walidacji (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia liczbowe/ciągów/tablic/obiektów oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania elementów podrzędnych ujawniają `key`, znormalizowane `path`, `type`, `required`, `hasChildren` oraz dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji Gateway i planuje restart tylko wtedy, gdy sama aktualizacja się powiodła; wywołujący z sesją mogą dołączyć `continuationMessage`, aby po uruchomieniu wznowić jedną kolejną turę agenta przez kolejkę kontynuacji restartu. Aktualizacje menedżera pakietów wymuszają nieodroczony restart aktualizacyjny bez okresu wyciszenia po podmianie pakietu, aby stary proces Gateway nie ładował leniwie dalej z zastąpionego drzewa `dist`.
    - `update.status` zwraca najnowszy buforowany znacznik restartu aktualizacji, w tym działającą wersję po restarcie, gdy jest dostępna.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator wdrażania przez WS RPC.

  </Accordion>

  <Accordion title="Pomocniki agenta i obszaru roboczego">
    - `agents.list` zwraca skonfigurowane wpisy agentów, w tym efektywny model i metadane środowiska uruchomieniowego.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów i okablowaniem obszaru roboczego.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami obszaru roboczego inicjalizacji udostępnianymi agentowi.
    - `tasks.list`, `tasks.get` i `tasks.cancel` udostępniają rejestr zadań Gateway klientom SDK i operatora.
    - `artifacts.list`, `artifacts.get` i `artifacts.download` udostępniają podsumowania artefaktów pochodzących z transkrypcji oraz pobrania dla jawnego zakresu `sessionKey`, `runId` lub `taskId`. Zapytania o uruchomienia i zadania rozwiązują sesję właściciela po stronie serwera i zwracają tylko media transkrypcji z pasującą proweniencją; niebezpieczne lub lokalne źródła URL zwracają nieobsługiwane pobrania zamiast pobierania po stronie serwera.
    - `environments.list` i `environments.status` udostępniają klientom SDK tylko do odczytu wykrywanie środowisk lokalnych Gateway i węzłów.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcową migawkę, gdy jest dostępna.

  </Accordion>

  <Accordion title="Kontrola sesji">
    - `sessions.list` zwraca bieżący indeks sesji, w tym metadane `agentRuntime` dla każdego wiersza, gdy skonfigurowano backend środowiska uruchomieniowego agenta.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkrypcji/wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkrypcji dla określonych kluczy sesji.
    - `sessions.describe` zwraca jeden wiersz sesji Gateway dla dokładnego klucza sesji.
    - `sessions.resolve` rozwiązuje lub kanonikalizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant przerwania i pokierowania dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji. Wywołujący może przekazać `key` plus opcjonalne `runId`, albo samo `runId` dla aktywnych uruchomień, które Gateway może rozwiązać do sesji.
    - `sessions.patch` aktualizuje metadane/nadpisania sesji i raportuje rozwiązany model kanoniczny oraz efektywne `agentRuntime`.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest normalizowane do wyświetlania dla klientów UI: wbudowane tagi dyrektyw są usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w zwykłym tekście (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` i ucięte bloki wywołań narzędzi) oraz ujawnione tokeny sterujące modelu ASCII/pełnej szerokości są usuwane, czyste wiersze asystenta z cichymi tokenami, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a zbyt duże wiersze mogą być zastępowane symbolami zastępczymi.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.

  </Accordion>

  <Accordion title="Parowanie węzłów, wywoływanie i oczekująca praca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` i `node.pair.verify` obejmują parowanie węzłów i weryfikację inicjalizacji.
    - `node.list` i `node.describe` zwracają stan znanych/połączonych węzłów.
    - `node.rename` aktualizuje etykietę sparowanego węzła.
    - `node.invoke` przekazuje polecenie do połączonego węzła.
    - `node.invoke.result` zwraca wynik żądania wywołania.
    - `node.event` przenosi zdarzenia pochodzące z węzła z powrotem do Gateway.
    - `node.pending.pull` i `node.pending.ack` to API kolejki połączonego węzła.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą dla węzłów offline/rozłączonych.

  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obsługują jednorazowe żądania zatwierdzenia wykonania oraz wyszukiwanie/ponowne odtwarzanie oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie wykonania i zwraca ostateczną decyzję (lub `null` po przekroczeniu limitu czasu).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają migawkami polityki zatwierdzania wykonań Gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną dla węzła polityką zatwierdzania wykonań za pomocą poleceń przekazywania węzła.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obsługują przepływy zatwierdzania definiowane przez plugin.

  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe lub przy następnym Heartbeat wstrzyknięcie tekstu wybudzenia; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject`, oraz inne zdarzenia czatu
  dotyczące wyłącznie transkrypcji.
- `session.message` i `session.tool`: aktualizacje transkrypcji/strumienia zdarzeń dla
  subskrybowanej sesji.
- `sessions.changed`: zmieniono indeks sesji lub metadane.
- `presence`: aktualizacje migawki obecności systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja migawki kondycji gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania Cron.
- `shutdown`: powiadomienie o zamknięciu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania węzła.
- `node.invoke.request`: emisja żądania wywołania węzła.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniono konfigurację wyzwalacza słowa wybudzającego.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia zatwierdzenia wykonania.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzenia Plugin.

### Metody pomocnicze węzła

- Węzły mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych skill
  na potrzeby kontroli automatycznego zezwalania.

### RPC rejestru zadań

Klienci operatora mogą przeglądać i anulować rekordy zadań w tle Gateway za pomocą
RPC rejestru zadań. Te metody zwracają oczyszczone podsumowania zadań, a nie surowy
stan runtime.

- `tasks.list` wymaga `operator.read`.
  - Parametry: opcjonalny `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` lub `"timed_out"`) albo tablica tych statusów,
    opcjonalny `agentId`, opcjonalny `sessionKey`, opcjonalny `limit` od `1` do
    `500` oraz opcjonalny ciąg `cursor`.
  - Wynik: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` wymaga `operator.read`.
  - Parametry: `{ "taskId": string }`.
  - Wynik: `{ "task": TaskSummary }`.
  - Brakujące identyfikatory zadań zwracają kształt błędu Gateway typu not-found.
- `tasks.cancel` wymaga `operator.write`.
  - Parametry: `{ "taskId": string, "reason"?: string }`.
  - Wynik:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informuje, czy rejestr zawierał pasujące zadanie. `cancelled`
    informuje, czy runtime zaakceptował albo zarejestrował anulowanie.

`TaskSummary` zawiera `id`, `status` oraz opcjonalne metadane, takie jak `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, znaczniki czasu, postęp,
końcowe podsumowanie oraz oczyszczony tekst błędu.

### Metody pomocnicze operatora

- Operatorzy mogą wywołać `commands.list` (`operator.read`), aby pobrać inwentarz poleceń runtime
  dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, do której powierzchni odnosi się podstawowa wartość `name`:
    - `text` zwraca podstawowy token polecenia tekstowego bez początkowego `/`
    - `native` i domyślna ścieżka `both` zwracają natywne nazwy świadome providera,
      gdy są dostępne
  - `textAliases` przenosi dokładne aliasy ukośnikowe, takie jak `/model` i `/m`.
  - `nativeName` przenosi natywną nazwę polecenia świadomą providera, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na nazewnictwo natywne oraz dostępność
    natywnych poleceń plugin.
  - `includeArgs=false` pomija zserializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywołać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi runtime dla
  agenta. Odpowiedź zawiera pogrupowane narzędzia oraz metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel plugin, gdy `source="plugin"`
  - `optional`: czy narzędzie plugin jest opcjonalne
- Operatorzy mogą wywołać `tools.effective` (`operator.read`), aby pobrać efektywny w runtime
  inwentarz narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst runtime z sesji po stronie serwera, zamiast akceptować
    kontekst uwierzytelniania lub dostarczania podany przez wywołującego.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, czego aktywna rozmowa może użyć teraz,
    w tym narzędzia core, plugin i kanału.
- Operatorzy mogą wywołać `tools.invoke` (`operator.write`), aby wywołać jedno dostępne narzędzie przez
  tę samą ścieżkę polityki gateway co `/tools/invoke`.
  - `name` jest wymagane. `args`, `sessionKey`, `agentId`, `confirm` i
    `idempotencyKey` są opcjonalne.
  - Jeśli obecne są jednocześnie `sessionKey` i `agentId`, rozwiązany agent sesji musi pasować
    do `agentId`.
  - Odpowiedź jest kopertą przeznaczoną dla SDK z polami `ok`, `toolName`, opcjonalnym `output` oraz typowanymi
    polami `error`. Odmowy wynikające z zatwierdzeń lub polityki zwracają `ok:false` w ładunku, zamiast
    omijać potok polityki narzędzi gateway.
- Operatorzy mogą wywołać `skills.status` (`operator.read`), aby pobrać widoczny
  inwentarz skill dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz
    oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywołać `skills.search` i `skills.detail` (`operator.read`) dla
  metadanych odkrywania ClawHub.
- Operatorzy mogą wywołać `skills.upload.begin`, `skills.upload.chunk` i
  `skills.upload.commit` (`operator.admin`), aby przygotować prywatne archiwum skill
  przed jego instalacją. Jest to osobna ścieżka przesyłania administracyjnego dla zaufanych klientów,
  a nie zwykły przepływ instalowania skill z ClawHub, i jest domyślnie wyłączona, chyba że
  włączono `skills.install.allowUploadedArchives`.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    tworzy przesyłanie powiązane z tym slug i wartością force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` dopisuje bajty pod
    dokładnym zdekodowanym przesunięciem.
  - `skills.upload.commit({ uploadId, sha256? })` weryfikuje końcowy rozmiar i
    SHA-256. Commit tylko finalizuje przesłanie; nie instaluje skill.
  - Przesłane archiwa skill to archiwa zip zawierające główny `SKILL.md`. Wewnętrzna nazwa katalogu
    archiwum nigdy nie wybiera celu instalacji.
- Operatorzy mogą wywołać `skills.install` (`operator.admin`) w trzech trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje
    folder skill w katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb przesyłania: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instaluje zatwierdzone przesłanie w katalogu `skills/<slug>`
    domyślnego obszaru roboczego agenta. Slug i wartość force muszą pasować do pierwotnego
    żądania `skills.upload.begin`. Ten tryb jest odrzucany, chyba że
    włączono `skills.install.allowUploadedArchives`. To ustawienie nie wpływa
    na instalacje ClawHub.
  - Tryb instalatora Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście gateway.
- Operatorzy mogą wywołać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug lub wszystkie śledzone instalacje ClawHub w
    domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji aktualizuje wartości `skills.entries.<skillKey>`, takie jak `enabled`,
    `apiKey` i `env`.

### Widoki `models.list`

`models.list` akceptuje opcjonalny parametr `view`:

- Pominięty lub `"default"`: bieżące zachowanie runtime. Jeśli skonfigurowano `agents.defaults.models`, odpowiedzią jest dozwolony katalog, w tym dynamicznie odkryte modele dla wpisów `provider/*`. W przeciwnym razie odpowiedzią jest pełny katalog Gateway.
- `"configured"`: zachowanie o rozmiarze selektora. Jeśli skonfigurowano `agents.defaults.models`, nadal ma pierwszeństwo, w tym odkrywanie ograniczone do providera dla wpisów `provider/*`. Bez listy dozwolonych odpowiedź używa jawnych wpisów `models.providers.*.models`, wracając do pełnego katalogu tylko wtedy, gdy nie istnieją żadne skonfigurowane wiersze modeli.
- `"all"`: pełny katalog Gateway, z pominięciem `agents.defaults.models`. Używaj tego do diagnostyki i interfejsów odkrywania, a nie w zwykłych selektorach modeli.

## Zatwierdzenia wykonań

- Gdy żądanie wykonania wymaga zatwierdzenia, gateway emituje `exec.approval.requested`.
- Klienci operatora rozstrzygają je, wywołując `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node` żądanie `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane wywołania `node.invoke system.run` ponownie używają tego kanonicznego
  `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` między przygotowaniem a ostatecznym zatwierdzonym przekazaniem `system.run`, gateway
  odrzuca uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Awaryjna ścieżka dostarczania agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczenia wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe działanie: nierozwiązane lub wyłącznie wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na awaryjne przejście do wykonania tylko w sesji, gdy nie można rozwiązać żadnej zewnętrznej trasy dostarczalnej (na przykład sesje wewnętrzne/webchat lub niejednoznaczne konfiguracje wielokanałowe).
- Końcowe wyniki `agent` mogą zawierać `result.deliveryStatus`, gdy żądano dostarczenia,
  używając tych samych statusów `sent`, `suppressed`, `partial_failed` i `failed`,
  które udokumentowano dla [`openclaw agent --json --deliver`](/pl/cli/agent#json-delivery-status).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/version.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca zakresy, które
  nie obejmują jego bieżącego protokołu. Klienci natywni używają dolnej granicy v3, aby
  addytywni klienci v4 nadal mogli łączyć się z gateway v3.
- Schematy i modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości są
stabilne w protokole v4 i stanowią oczekiwaną bazę dla klientów zewnętrznych.

| Stała                                     | Domyślna wartość                                     | Źródło                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `3`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Limit czasu żądania (na RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Limit czasu preauth / wyzwania połączenia | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (konfiguracja/env może zwiększyć sparowany budżet serwera/klienta) |
| Początkowy backoff ponownego połączenia   | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksymalny backoff ponownego połączenia   | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Ograniczenie szybkiej ponownej próby po zamknięciu z powodu tokenu urządzenia | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Okres karencji wymuszonego zatrzymania przed `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Domyślny limit czasu `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Domyślny interwał tyknięcia (przed `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Zamknięcie po przekroczeniu limitu tyknięcia | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Serwer ogłasza efektywne wartości `policy.tickIntervalMs`, `policy.maxPayload`
i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości
zamiast domyślnych wartości sprzed handshake.

## Uwierzytelnianie

- Uwierzytelnianie Gateway współdzielonym sekretem używa `connect.params.auth.token` albo
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby przenoszące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) albo nielokalny
  `gateway.auth.mode: "trusted-proxy"`, spełniają kontrolę uwierzytelniania połączenia na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatne wejście `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie połączenia
  współdzielonym sekretem; nie wystawiaj tego trybu na publiczne/niezaufane wejście.
- Po sparowaniu Gateway wydaje **token urządzenia** ograniczony do roli połączenia
  + zakresów. Jest zwracany w `hello-ok.auth.deviceToken` i powinien być
  utrwalony przez klienta na potrzeby przyszłych połączeń.
- Klienci powinni utrwalać główny `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne łączenie z tym **zapisanym** tokenem urządzenia powinno także ponownie używać zapisanego
  zatwierdzonego zestawu zakresów dla tego tokenu. Zachowuje to dostęp do odczytu/próbkowania/statusu,
  który został już przyznany, i zapobiega cichej redukcji ponownych połączeń do
  węższego, niejawnego zakresu tylko administracyjnego.
- Składanie uwierzytelniania połączenia po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest ortogonalne i zawsze jest przekazywane, gdy jest ustawione.
  - `auth.token` jest wypełniane według priorytetu: najpierw jawny współdzielony token,
    potem jawny `deviceToken`, a następnie zapisany token dla danego urządzenia (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żaden z powyższych mechanizmów nie wyznaczył
    `auth.token`. Współdzielony token albo dowolny wyznaczony token urządzenia go tłumi.
  - Automatyczne promowanie zapisanego tokenu urządzenia podczas jednorazowej
    ponownej próby `AUTH_TOKEN_MISMATCH` jest ograniczone tylko do **zaufanych punktów końcowych** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez przypięcia się nie kwalifikuje.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` są tokenami przekazania bootstrap.
  Utrwalaj je tylko wtedy, gdy połączenie użyło uwierzytelniania bootstrap na zaufanym transporcie,
  takim jak `wss://` albo parowanie loopback/lokalne.
- Jeśli klient podaje **jawny** `deviceToken` albo jawne `scopes`, ten
  zestaw zakresów żądany przez wywołującego pozostaje autorytatywny; zakresy z pamięci podręcznej są
  używane ponownie tylko wtedy, gdy klient ponownie używa zapisanego tokenu dla danego urządzenia.
- Tokeny urządzeń można rotować/odwoływać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- `device.token.rotate` zwraca metadane rotacji. Powtarza zastępczy
  token bearer tylko dla wywołań z tego samego urządzenia, które są już uwierzytelnione tym
  tokenem urządzenia, dzięki czemu klienci używający tylko tokenu mogą utrwalić zamiennik przed
  ponownym połączeniem. Rotacje współdzielone/administracyjne nie powtarzają tokenu bearer.
- Wydawanie, rotacja i odwoływanie tokenów pozostają ograniczone do zatwierdzonego zestawu ról
  zapisanego we wpisie parowania tego urządzenia; mutacja tokenu nie może rozszerzyć ani
  wskazać roli urządzenia, której nigdy nie przyznało zatwierdzenie parowania.
- Dla sesji tokenów sparowanych urządzeń zarządzanie urządzeniami jest samoograniczone, chyba że
  wywołujący ma także `operator.admin`: wywołujący niebędący administratorem mogą usuwać/odwoływać/rotować
  tylko wpis **własnego** urządzenia.
- `device.token.rotate` i `device.token.revoke` sprawdzają także zestaw zakresów docelowego
  tokenu operatora względem bieżących zakresów sesji wywołującego. Wywołujący niebędący administratorem
  nie mogą rotować ani odwoływać szerszego tokenu operatora niż ten, który już posiadają.
- Niepowodzenia uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (wartość logiczna)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z tokenem dla danego urządzenia z pamięci podręcznej.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać operatorowi wskazówki działania.
- `AUTH_SCOPE_MISMATCH` oznacza, że token urządzenia został rozpoznany, ale nie obejmuje
  żądanej roli/zakresów. Klienci nie powinni przedstawiać tego jako błędnego tokenu;
  poproś operatora o ponowne sparowanie albo zatwierdzenie węższego/szerszego kontraktu zakresu.

## Tożsamość urządzenia + parowanie

- Węzły powinny zawierać stabilną tożsamość urządzenia (`device.id`) pochodzącą z
  odcisku palca pary kluczy.
- Gateway wydaje tokeny na urządzenie + rolę.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączone jest lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania koncentruje się na bezpośrednich połączeniach local loopback.
- OpenClaw ma także wąską ścieżkę samopołączenia lokalną dla backendu/kontenera dla
  zaufanych przepływów pomocniczych współdzielonego sekretu.
- Połączenia tailnet lub LAN na tym samym hoście nadal są traktowane jako zdalne dla parowania i
  wymagają zatwierdzenia.
- Klienci WS zwykle dołączają tożsamość `device` podczas `connect` (operator +
  węzeł). Jedynymi wyjątkami operatora bez urządzenia są jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niebezpiecznym HTTP tylko na localhost.
  - udane uwierzytelnienie operatora w Control UI przez `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tryb awaryjny, poważne obniżenie bezpieczeństwa).
  - bezpośrednie RPC backendu `gateway-client` przez loopback, uwierzytelnione współdzielonym
    tokenem/hasłem Gateway.
- Wszystkie połączenia muszą podpisać nonce `connect.challenge` dostarczony przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed wyzwania, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` w `error.details.code` ze stabilnym `error.details.reason`.

Typowe niepowodzenia migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (albo wysłał pustą wartość). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał nieaktualnym/błędnym nonce.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Podpisany znacznik czasu jest poza dozwolonym odchyleniem. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do odcisku palca klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonizacja klucza publicznego nie powiodła się. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisuj ładunek v2, który zawiera nonce serwera.
- Wyślij ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól urządzenia/klienta/roli/zakresów/tokenu/nonce.
- Starsze podpisy `v2` pozostają akceptowane dla zgodności, ale przypinanie metadanych
  sparowanego urządzenia nadal kontroluje politykę poleceń przy ponownym połączeniu.

## TLS + przypinanie

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk palca certyfikatu gateway (zobacz konfigurację
  `gateway.tls` oraz `gateway.remote.tlsFingerprint` albo CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API gateway** (status, kanały, modele, czat,
agent, sesje, węzły, zatwierdzenia itd.). Dokładna powierzchnia jest definiowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.

## Powiązane

- [Protokół mostu](/pl/gateway/bridge-protocol)
- [Runbook Gateway](/pl/gateway)
