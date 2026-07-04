---
read_when:
    - Implementowanie lub aktualizowanie klientów WS Gateway
    - Debugowanie niezgodności protokołu lub błędów połączenia
    - Ponowne generowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-07-04T18:23:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 763dd5cba2f1aa0de95243a4996b4da1b4aa32c5c1a4b5b6c112d605e677bd70
    source_path: gateway/protocol.md
    workflow: 16
---

Protokół Gateway WS jest **pojedynczą płaszczyzną sterowania + transportem węzłów** dla
OpenClaw. Wszyscy klienci (CLI, web UI, aplikacja macOS, węzły iOS/Android, węzły
headless) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres** podczas
uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po udanym uzgodnieniu połączenia klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Przy włączonej diagnostyce
  zbyt duże ramki przychodzące i wolne bufory wychodzące emitują zdarzenia `payload.large`
  zanim gateway zamknie lub odrzuci dotkniętą ramkę. Te zdarzenia zachowują
  rozmiary, limity, powierzchnie i bezpieczne kody przyczyn. Nie zachowują treści
  wiadomości, zawartości załączników, surowej treści ramki, tokenów, plików cookie ani wartości tajnych.

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

Gdy Gateway nadal kończy uruchamianie procesów pomocniczych, żądanie `connect` może
zwrócić ponawialny błąd `UNAVAILABLE` z `details.reason` ustawionym na
`"startup-sidecars"` oraz `retryAfterMs`. Klienci powinni ponawiać taką odpowiedź
w ramach swojego ogólnego budżetu połączenia zamiast przedstawiać ją jako końcową
awarię uzgadniania połączenia.

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` jest również wymagane i zgłasza
wynegocjowaną rolę/zakresy. `pluginSurfaceUrls` jest opcjonalne i mapuje nazwy powierzchni
pluginów, takie jak `canvas`, na zakresowe hostowane adresy URL.

Zakresowe adresy URL powierzchni pluginów mogą wygasać. Węzły mogą wywołać
`node.pluginSurface.refresh` z `{ "surface": "canvas" }`, aby otrzymać świeży
wpis w `pluginSurfaceUrls`. Eksperymentalna przebudowa pluginu Canvas nie
obsługuje przestarzałej ścieżki zgodności `canvasHostUrl`, `canvasCapability` ani
`node.canvas.capability.refresh`; obecni klienci natywni i gatewaye muszą używać powierzchni pluginów.

Gdy token urządzenia nie zostanie wydany, `hello-ok.auth` zgłasza wynegocjowane
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
`client.mode: "backend"`) mogą pomijać `device` przy bezpośrednich połączeniach loopback,
gdy uwierzytelniają się współdzielonym tokenem/hasłem gatewaya. Ta ścieżka jest zarezerwowana
dla wewnętrznych RPC płaszczyzny sterowania i zapobiega blokowaniu lokalnej pracy backendu,
takiej jak aktualizacje sesji podagentów, przez nieaktualne bazowe parowania CLI/urządzeń. Klienci zdalni,
klienci pochodzący z przeglądarki, klienci węzłów oraz jawni klienci tokenu urządzenia/tożsamości urządzenia
nadal używają normalnych kontroli parowania i podnoszenia zakresu.

Gdy token urządzenia zostanie wydany, `hello-ok` zawiera również:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Wbudowany bootstrap kodu QR/kodu konfiguracji jest świeżą ścieżką przekazania mobilnego. Udane
bazowe połączenie kodem konfiguracji zwraca główny token węzła oraz jeden ograniczony
token operatora:

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

Przekazanie operatora jest celowo ograniczone, aby onboarding przez QR mógł uruchomić
mobilną pętlę operatora i ukończyć natywną konfigurację bez przyznawania zakresów
modyfikacji parowania ani `operator.admin`. Obejmuje `operator.talk.secrets`, aby
klient natywny mógł odczytać konfigurację Talk potrzebną po bootstrapie. Szersze
parowanie i dostęp administracyjny wymagają osobnego zatwierdzonego parowania operatora lub przepływu
tokenu. Klienci powinni utrwalać
`hello-ok.auth.deviceTokens` tylko
wtedy, gdy połączenie użyło uwierzytelniania bootstrap na zaufanym transporcie, takim jak `wss://` lub
loopback/parowanie lokalne.

### Przykład węzła

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

Metody wywołujące skutki uboczne wymagają **kluczy idempotencji** (zobacz schemat).

## Role + zakresy

Pełny model zakresów operatora, kontrole w czasie zatwierdzania i semantykę współdzielonych sekretów
opisuje sekcja [Zakresy operatora](/pl/gateway/operator-scopes).

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
Gdy sekrety są dołączone, klienci powinni odczytywać poświadczenie aktywnego dostawcy Talk
z `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
pozostaje w kształcie źródłowym i może być obiektem SecretRef albo zredagowanym ciągiem.

Metody RPC gatewaya zarejestrowane przez plugin mogą żądać własnego zakresu operatora, ale
zastrzeżone prefiksy administracyjne rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze rozwiązują się do `operator.admin`.

Zakres metody jest tylko pierwszą bramką. Niektóre polecenia ukośnikowe osiągane przez
`chat.send` nakładają dodatkowo surowsze kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma również dodatkową kontrolę zakresu w czasie zatwierdzania ponad
bazowym zakresem metody:

- żądania bez poleceń: `operator.pairing`
- żądania z poleceniami węzła innymi niż exec: `operator.pairing` + `operator.write`
- żądania obejmujące `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Możliwości/polecenia/uprawnienia (węzeł)

Węzły deklarują roszczenia dotyczące możliwości w czasie połączenia:

- `caps`: kategorie możliwości wysokiego poziomu, takie jak `camera`, `canvas`, `screen`,
  `location`, `voice` i `talk`.
- `commands`: lista dozwolonych poleceń dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i egzekwuje listy dozwolone po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy obecności obejmują `deviceId`, `roles` i `scopes`, aby UI mogły pokazywać jeden wiersz na urządzenie
  nawet wtedy, gdy łączy się ono zarówno jako **operator**, jak i **node**.
- `node.list` obejmuje opcjonalne pola `lastSeenAtMs` i `lastSeenReason`. Połączone węzły zgłaszają
  swój bieżący czas połączenia jako `lastSeenAtMs` z przyczyną `connect`; sparowane węzły mogą też zgłaszać
  trwałą obecność w tle, gdy zaufane zdarzenie węzła aktualizuje ich metadane parowania.

### Zdarzenie aktywności węzła w tle

Węzły mogą wywołać `node.event` z `event: "node.presence.alive"`, aby zapisać, że sparowany węzeł był
aktywny podczas wybudzenia w tle bez oznaczania go jako połączonego.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` jest zamkniętym wyliczeniem: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` lub `connect`. Nieznane ciągi wyzwalacza są normalizowane do
`background` przez gateway przed utrwaleniem. Zdarzenie jest trwałe tylko dla uwierzytelnionych sesji
urządzeń węzłów; sesje bez urządzenia lub niesparowane zwracają `handled: false`.

Udane gatewaye zwracają ustrukturyzowany wynik:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Starsze gatewaye mogą nadal zwracać `{ "ok": true }` dla `node.event`; klienci powinni traktować to jako
potwierdzone RPC, a nie jako trwałe utrwalenie obecności.

## Zakresowanie zdarzeń rozgłoszeniowych

Zdarzenia rozgłoszeniowe WebSocket wypychane przez serwer są bramkowane zakresami, aby sesje zakresowane parowaniem lub tylko węzłowe nie odbierały biernie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Rozgłoszenia `plugin.*` zdefiniowane przez plugin** są bramkowane do `operator.write` lub `operator.admin`, zależnie od tego, jak plugin je zarejestrował.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia connect/disconnect itd.) pozostają nieograniczone, aby stan transportu był obserwowalny dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń rozgłoszeniowych** są domyślnie bramkowane zakresami (fail-closed), chyba że zarejestrowany handler jawnie je poluzuje.

Każde połączenie klienta utrzymuje własny numer sekwencyjny per klient, więc rozgłoszenia zachowują monotoniczną kolejność na tym gnieździe nawet wtedy, gdy różni klienci widzą różne, filtrowane zakresami podzbiory strumienia zdarzeń.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż powyższe przykłady uzgadniania połączenia/uwierzytelniania. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` jest konserwatywną
listą wykrywania zbudowaną z `src/gateway/server-methods-list.ts` oraz załadowanych
eksportów metod pluginów/kanałów. Traktuj ją jako wykrywanie funkcji, a nie pełne
wyliczenie `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System i tożsamość">
    - `health` zwraca buforowaną lub świeżo sprawdzoną migawkę kondycji Gateway.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestrator stabilności diagnostycznej. Przechowuje metadane operacyjne, takie jak nazwy zdarzeń, liczby, rozmiary w bajtach, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów oraz identyfikatory sesji. Nie przechowuje tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań lub odpowiedzi, tokenów, plików cookie ani wartości tajnych. Wymagany jest zakres odczytu operatora.
    - `status` zwraca podsumowanie Gateway w stylu `/status`; pola wrażliwe są uwzględniane tylko dla klientów operatora z zakresem administratora.
    - `gateway.identity.get` zwraca tożsamość urządzenia Gateway używaną przez przepływy przekaźnika i parowania.
    - `system-presence` zwraca bieżącą migawkę obecności dla połączonych urządzeń operatora/węzłów.
    - `system-event` dopisuje zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
    - `last-heartbeat` zwraca najnowsze utrwalone zdarzenie heartbeat.
    - `set-heartbeats` przełącza przetwarzanie heartbeat w Gateway.

  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolonych przez środowisko uruchomieniowe. Przekaż `{ "view": "configured" }` dla skonfigurowanych modeli o rozmiarze odpowiednim dla selektora (`agents.defaults.models` najpierw, potem `models.providers.*.models`) albo `{ "view": "all" }` dla pełnego katalogu.
    - `usage.status` zwraca podsumowania okien użycia dostawcy/pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
      Przekaż `agentId` dla jednego agenta albo `agentScope: "all"`, aby zagregować skonfigurowanych agentów.
    - `doctor.memory.status` zwraca gotowość pamięci wektorowej / buforowanych embeddingów dla aktywnego domyślnego obszaru roboczego agenta. Przekaż `{ "probe": true }` albo `{ "deep": true }` tylko wtedy, gdy wywołujący jawnie chce aktywnego pingu dostawcy embeddingów. Klienci obsługujący Dreaming mogą także przekazać `{ "agentId": "agent-id" }`, aby ograniczyć statystyki magazynu Dreaming do wybranego obszaru roboczego agenta; pominięcie `agentId` zachowuje fallback do domyślnego agenta i agreguje skonfigurowane obszary robocze Dreaming.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` i `doctor.memory.dedupeDreamDiary` przyjmują opcjonalne parametry `{ "agentId": "agent-id" }` dla widoków/akcji Dreaming wybranego agenta. Gdy `agentId` zostanie pominięte, działają na skonfigurowanym domyślnym obszarze roboczym agenta.
    - `doctor.memory.remHarness` zwraca ograniczony, tylko do odczytu podgląd harness REM dla zdalnych klientów płaszczyzny sterowania. Może obejmować ścieżki obszaru roboczego, fragmenty pamięci, wyrenderowany ugruntowany Markdown i kandydatów do głębokiej promocji, więc wywołujący potrzebują `operator.read`.
    - `sessions.usage` zwraca podsumowania użycia według sesji. Przekaż `agentId` dla jednego
      agenta albo `agentScope: "all"`, aby wyświetlić razem skonfigurowanych agentów.
    - `sessions.usage.timeseries` zwraca użycie w szeregach czasowych dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Kanały i pomocniki logowania">
    - `channels.status` zwraca podsumowania stanu wbudowanych + dołączonych kanałów/pluginów.
    - `channels.logout` wylogowuje określony kanał/konto, gdy kanał obsługuje wylogowanie.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i po powodzeniu uruchamia kanał.
    - `push.test` wysyła testowe powiadomienie APNs push do zarejestrowanego węzła iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słowa wybudzającego.
    - `voicewake.set` aktualizuje wyzwalacze słowa wybudzającego i rozgłasza zmianę.

  </Accordion>

  <Accordion title="Wiadomości i dzienniki">
    - `send` to bezpośrednie wychodzące RPC dostarczania dla wysyłek kierowanych do kanału/konta/wątku poza uruchamiaczem czatu.
    - `logs.tail` zwraca skonfigurowany ogon pliku dziennika gateway z kontrolkami kursora/limitu i maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Talk i TTS">
    - `talk.catalog` zwraca tylko do odczytu katalog dostawców Talk dla mowy, transkrypcji strumieniowej i głosu w czasie rzeczywistym. Obejmuje kanoniczne identyfikatory dostawców, aliasy rejestru, etykiety, skonfigurowany stan, opcjonalny wynik `ready` na poziomie grupy, ujawnione identyfikatory modeli/głosów, kanoniczne tryby, transporty, strategie mózgu oraz flagi dźwięku/możliwości czasu rzeczywistego bez zwracania sekretów dostawcy ani mutowania globalnej konfiguracji. Obecne Gateways ustawiają `ready` po zastosowaniu wyboru dostawcy runtime; klienci powinni traktować jego brak jako niezweryfikowany, aby zachować zgodność ze starszymi Gateways.
    - `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (lub `operator.admin`).
    - `talk.session.create` tworzy należącą do Gateway sesję Talk dla `realtime/gateway-relay`, `transcription/gateway-relay` albo `stt-tts/managed-room`. W przypadku `stt-tts/managed-room` wywołujący z `operator.write`, którzy przekazują `sessionKey`, muszą także przekazać `spawnedBy`, aby zapewnić zakresową widoczność klucza sesji; tworzenie `sessionKey` bez zakresu oraz `brain: "direct-tools"` wymagają `operator.admin`.
    - `talk.session.join` waliduje token sesji pokoju zarządzanego, emituje zdarzenia `session.ready` lub `session.replaced` w razie potrzeby i zwraca metadane pokoju/sesji oraz ostatnie zdarzenia Talk bez tokenu w postaci jawnej ani zapisanego skrótu tokenu.
    - `talk.session.appendAudio` dołącza wejściowy dźwięk PCM base64 do należących do Gateway sesji przekaźnika czasu rzeczywistego i transkrypcji.
    - `talk.session.startTurn`, `talk.session.endTurn` i `talk.session.cancelTurn` sterują cyklem życia tury pokoju zarządzanego z odrzucaniem nieaktualnej tury przed wyczyszczeniem stanu.
    - `talk.session.cancelOutput` zatrzymuje wyjściowy dźwięk asystenta, głównie dla wtrącenia sterowanego VAD w sesjach przekaźnika Gateway.
    - `talk.session.submitToolResult` kończy wywołanie narzędzia dostawcy wyemitowane przez należącą do Gateway sesję przekaźnika czasu rzeczywistego. Przekaż `options: { willContinue: true }` dla tymczasowego wyniku narzędzia, gdy wynik końcowy nadejdzie później, albo `options: { suppressResponse: true }`, gdy wynik narzędzia ma zaspokoić wywołanie dostawcy bez uruchamiania kolejnej odpowiedzi asystenta w czasie rzeczywistym.
    - `talk.session.steer` wysyła sterowanie głosem aktywnego przebiegu do należącej do Gateway sesji Talk wspieranej przez agenta. Akceptuje `{ sessionId, text, mode? }`, gdzie `mode` to `status`, `steer`, `cancel` albo `followup`; pominięty tryb jest klasyfikowany na podstawie wypowiedzianego tekstu.
    - `talk.session.close` zamyka należącą do Gateway sesję przekaźnika, transkrypcji lub pokoju zarządzanego i emituje końcowe zdarzenia Talk.
    - `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów WebChat/Control UI.
    - `talk.client.create` tworzy należącą do klienta sesję dostawcy czasu rzeczywistego przy użyciu `webrtc` albo `provider-websocket`, podczas gdy Gateway posiada konfigurację, poświadczenia, instrukcje i politykę narzędzi.
    - `talk.client.toolCall` pozwala należącym do klienta transportom czasu rzeczywistego przekazywać wywołania narzędzi dostawcy do polityki Gateway. Pierwszym obsługiwanym narzędziem jest `openclaw_agent_consult`; klienci otrzymują identyfikator przebiegu i czekają na zwykłe zdarzenia cyklu życia czatu przed przesłaniem wyniku narzędzia specyficznego dla dostawcy.
    - `talk.client.steer` wysyła sterowanie głosem aktywnego przebiegu dla należących do klienta transportów czasu rzeczywistego. Gateway rozwiązuje aktywny osadzony przebieg z `sessionKey` i zwraca ustrukturyzowany wynik zaakceptowany/odrzucony zamiast po cichu porzucać sterowanie.
    - `talk.event` to pojedynczy kanał zdarzeń Talk dla adapterów czasu rzeczywistego, transkrypcji, STT/TTS, pokoju zarządzanego, telefonii i spotkań.
    - `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców zapasowych i stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny spis dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRefs i podmienia stan sekretów runtime tylko przy pełnym powodzeniu.
    - `secrets.resolve` rozwiązuje przypisania sekretów celu polecenia dla określonego zestawu poleceń/celów.
    - `config.get` zwraca bieżący zrzut konfiguracji i skrót.
    - `config.set` zapisuje zwalidowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji. Destrukcyjne zastąpienie tablicy wymaga dotkniętej ścieżki w `replacePaths`; zagnieżdżone tablice pod wpisami tablic używają ścieżek `[]`, takich jak `agents.list[].skills`.
    - `config.apply` waliduje i zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca bieżący ładunek schematu konfiguracji używany przez narzędzia Control UI i CLI: schemat, `uiHints`, wersję i metadane generowania, w tym metadane schematów pluginów i kanałów, gdy runtime może je załadować. Schemat zawiera metadane pól `title` / `description` wyprowadzone z tych samych etykiet i tekstu pomocy, których używa UI, w tym gałęzie zagnieżdżonych obiektów, symboli wieloznacznych, elementów tablic oraz kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pól.
    - `config.schema.lookup` zwraca ładunek wyszukiwania w zakresie ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę i `hintPath`, opcjonalne `reloadKind` oraz bezpośrednie podsumowania dzieci dla przechodzenia w głąb w UI/CLI. `reloadKind` jest jednym z `restart`, `hot` albo `none` i odzwierciedla planer ponownego ładowania konfiguracji Gateway dla żądanej ścieżki. Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika i typowe pola walidacji (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia liczb/ciągów/tablic/obiektów oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania dzieci ujawniają `key`, znormalizowaną `path`, `type`, `required`, `hasChildren`, opcjonalne `reloadKind` oraz dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji gateway i planuje restart tylko wtedy, gdy sama aktualizacja się powiodła; wywołujący z sesją mogą dołączyć `continuationMessage`, aby uruchomienie wznowiło jedną następną turę agenta przez kolejkę kontynuacji restartu. Aktualizacje menedżera pakietów i nadzorowane aktualizacje git-checkout z płaszczyzny sterowania używają odłączonego przekazania usługi zarządzanej zamiast zastępowania drzewa pakietu albo mutowania wyjścia checkout/build wewnątrz działającego Gateway. Rozpoczęte przekazanie zwraca `ok: true` z `result.reason: "managed-service-handoff-started"` i `handoff.status: "started"`; niedostępne lub nieudane przekazania zwracają `ok: false` z `managed-service-handoff-unavailable` albo `managed-service-handoff-failed`, plus `handoff.command`, gdy wymagana jest ręczna aktualizacja w powłoce. Niedostępne przekazanie oznacza, że OpenClaw nie ma bezpiecznej granicy nadzorcy ani trwałej tożsamości usługi, takiej jak `OPENCLAW_SYSTEMD_UNIT` dla systemd. Podczas rozpoczętego przekazania znacznik restartu może krótko zgłaszać `stats.reason: "restart-health-pending"`; kontynuacja jest opóźniana, dopóki CLI nie zweryfikuje zrestartowanego Gateway i nie zapisze końcowego znacznika `ok`.
    - `update.status` odświeża i zwraca najnowszy znacznik restartu aktualizacji, w tym wersję działającą po restarcie, gdy jest dostępna.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator wdrażania przez WS RPC.

  </Accordion>

  <Accordion title="Pomocnicy agentów i przestrzeni roboczej">
    - `agents.list` zwraca skonfigurowane wpisy agentów, w tym efektywny model i metadane środowiska wykonawczego.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów oraz powiązaniami przestrzeni roboczej.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami startowymi przestrzeni roboczej udostępnianymi agentowi.
    - `tasks.list`, `tasks.get` i `tasks.cancel` udostępniają rejestr zadań Gateway klientom SDK i operatorom.
    - `artifacts.list`, `artifacts.get` i `artifacts.download` udostępniają podsumowania artefaktów pochodzących z transkrypcji oraz pobrania dla jawnego zakresu `sessionKey`, `runId` lub `taskId`. Zapytania o uruchomienia i zadania rozwiązują sesję właściciela po stronie serwera i zwracają tylko media transkrypcji z pasującym pochodzeniem; niebezpieczne lub lokalne źródła URL zwracają nieobsługiwane pobrania zamiast pobierania po stronie serwera.
    - `environments.list` i `environments.status` udostępniają klientom SDK tylko do odczytu wykrywanie środowisk lokalnych Gateway oraz węzłów.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcową migawkę, gdy jest dostępna.

  </Accordion>

  <Accordion title="Kontrola sesji">
    - `sessions.list` zwraca bieżący indeks sesji, w tym metadane `agentRuntime` w każdym wierszu, gdy skonfigurowany jest backend środowiska wykonawczego agenta.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkrypcji/wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkrypcji dla określonych kluczy sesji.
    - `sessions.describe` zwraca jeden wiersz sesji Gateway dla dokładnego klucza sesji.
    - `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant przerwania i ukierunkowania dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji. Wywołujący może przekazać `key` oraz opcjonalnie `runId`, albo przekazać samo `runId` dla aktywnych uruchomień, które Gateway może rozwiązać do sesji.
    - `sessions.patch` aktualizuje metadane/nadpisania sesji i raportuje rozwiązany model kanoniczny oraz efektywne `agentRuntime`.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest normalizowane do wyświetlania dla klientów UI: znaczniki dyrektyw inline są usuwane z widocznego tekstu, tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi) i ujawnione tokeny sterujące modelu ASCII/pełnej szerokości są usuwane, czysto ciche wiersze asystenta z tokenami, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a zbyt duże wiersze mogą być zastępowane symbolami zastępczymi.
    - `chat.message.get` to addytywny, ograniczony czytnik pełnej wiadomości dla pojedynczego widocznego wpisu transkrypcji. Klienci przekazują `sessionKey`, opcjonalne `agentId`, gdy wybór sesji jest ograniczony do agenta, oraz `messageId` transkrypcji wcześniej udostępnione przez `chat.history`, a Gateway zwraca tę samą znormalizowaną do wyświetlania projekcję bez lekkiego limitu obcinania historii, gdy zapisany wpis jest nadal dostępny i nie jest zbyt duży.
    - `chat.send` akceptuje jednorazowe `fastMode: "auto"`, aby użyć trybu szybkiego dla wywołań modelu rozpoczętych przed automatycznym odcięciem, a następnie uruchamiać późniejsze ponowienia, fallbacki, wyniki narzędzi lub wywołania kontynuacji bez trybu szybkiego. Odcięcie domyślnie wynosi 60 sekund i można je skonfigurować dla każdego modelu przez `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Wywołujący `chat.send` może przekazać jednorazowe `fastAutoOnSeconds`, aby nadpisać odcięcie dla tego żądania.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.setupCode` tworzy kod konfiguracji mobilnej oraz, domyślnie, adres URL danych QR PNG. Wymaga `operator.admin` i celowo jest pomijane w ogłaszanym wykrywaniu. Wynik obejmuje `setupCode`, opcjonalne `qrDataUrl`, `gatewayUrl`, nietajną etykietę `auth` i `urlSource`.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.

    Kod konfiguracji osadza krótkotrwałe poświadczenie startowe. Klienci nie mogą
    go logować ani utrwalać poza przepływem parowania.

  </Accordion>

  <Accordion title="Parowanie węzłów, wywoływanie i oczekująca praca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` i `node.pair.verify` obejmują parowanie węzłów oraz weryfikację startową.
    - `node.list` i `node.describe` zwracają stan znanych/połączonych węzłów.
    - `node.rename` aktualizuje etykietę sparowanego węzła.
    - `node.invoke` przekazuje polecenie do połączonego węzła.
    - `node.invoke.result` zwraca wynik żądania wywołania.
    - `node.event` przenosi zdarzenia pochodzące z węzła z powrotem do Gateway.
    - `node.pending.pull` i `node.pending.ack` to interfejsy API kolejki połączonych węzłów.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą dla węzłów offline/rozłączonych.

  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia wykonania oraz wyszukiwanie/odtwarzanie oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie wykonania i zwraca ostateczną decyzję (lub `null` po przekroczeniu limitu czasu).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają migawkami zasad zatwierdzania wykonania Gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną dla węzła zasadą zatwierdzania wykonania przez polecenia przekaźnika węzła.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują przepływy zatwierdzania zdefiniowane przez Plugin.

  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe lub przy następnym Heartbeat wstrzyknięcie tekstu wybudzenia; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - `cron.run` pozostaje RPC w stylu dodania do kolejki dla uruchomień ręcznych. Klienci, którzy potrzebują semantyki zakończenia, powinni odczytać zwrócone `runId` i odpytywać `cron.runs`.
    - `cron.runs` akceptuje opcjonalny niepusty filtr `runId`, aby klienci mogli śledzić jedno zakolejkowane uruchomienie ręczne bez wyścigu z innymi wpisami historii dla tego samego zadania.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject`, oraz inne zdarzenia czatu wyłącznie transkrypcyjne. W protokole v4 ładunki delta przenoszą `deltaText`; `message` pozostaje skumulowaną migawką asystenta. Zastąpienia niebędące prefiksem ustawiają `replace=true` i używają `deltaText` jako tekstu zastępczego.
- `session.message`, `session.operation` i `session.tool`: aktualizacje transkrypcji, operacji sesji w toku oraz strumienia zdarzeń dla subskrybowanej sesji.
- `sessions.changed`: indeks sesji lub metadane zostały zmienione.
- `presence`: aktualizacje migawek obecności systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja migawki stanu Gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania Cron.
- `shutdown`: powiadomienie o zamknięciu Gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania węzła.
- `node.invoke.request`: rozgłoszenie żądania wywołania węzła.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniono konfigurację wyzwalacza słowa wybudzającego.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia zatwierdzenia wykonania.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzenia Plugin.

### Metody pomocnicze węzłów

- Węzły mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych umiejętności
  na potrzeby kontroli automatycznego zezwalania.

### RPC rejestru zadań

Klienci operatorów mogą sprawdzać i anulować rekordy zadań w tle Gateway przez
RPC rejestru zadań. Te metody zwracają oczyszczone podsumowania zadań, a nie surowy
stan środowiska wykonawczego.

- `tasks.list` wymaga `operator.read`.
  - Parametry: opcjonalny `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` lub `"timed_out"`) albo tablica tych statusów,
    opcjonalne `agentId`, opcjonalne `sessionKey`, opcjonalny `limit` od `1` do
    `500` oraz opcjonalny ciąg `cursor`.
  - Wynik: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` wymaga `operator.read`.
  - Parametry: `{ "taskId": string }`.
  - Wynik: `{ "task": TaskSummary }`.
  - Brakujące identyfikatory zadań zwracają kształt błędu Gateway nie znaleziono.
- `tasks.cancel` wymaga `operator.write`.
  - Parametry: `{ "taskId": string, "reason"?: string }`.
  - Wynik:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informuje, czy rejestr zawierał pasujące zadanie. `cancelled`
    informuje, czy środowisko wykonawcze zaakceptowało lub odnotowało anulowanie.

`TaskSummary` zawiera `id`, `status` i opcjonalne metadane, takie jak `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, znaczniki czasu, postęp,
podsumowanie końcowe oraz oczyszczony tekst błędu. `agentId` identyfikuje agenta
wykonującego zadanie; `sessionKey` i `ownerKey` zachowują kontekst żądającego oraz kontroli.

### Metody pomocnicze operatora

- Operatorzy mogą wywołać `commands.list` (`operator.read`), aby pobrać inwentarz poleceń środowiska wykonawczego dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, do której powierzchni odnosi się główna wartość `name`:
    - `text` zwraca główny token polecenia tekstowego bez początkowego `/`
    - `native` oraz domyślna ścieżka `both` zwracają nazwy natywne uwzględniające dostawcę, gdy są dostępne
  - `textAliases` przenosi dokładne aliasy z ukośnikiem, takie jak `/model` i `/m`.
  - `nativeName` przenosi nazwę polecenia natywnego uwzględniającą dostawcę, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na nazewnictwo natywne oraz dostępność natywnych poleceń pluginu.
  - `includeArgs=false` pomija serializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywołać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi środowiska wykonawczego dla agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel pluginu, gdy `source="plugin"`
  - `optional`: czy narzędzie pluginu jest opcjonalne
- Operatorzy mogą wywołać `tools.effective` (`operator.read`), aby pobrać efektywny w środowisku wykonawczym inwentarz narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst środowiska wykonawczego z sesji po stronie serwera, zamiast akceptować kontekst uwierzytelniania lub dostarczania dostarczony przez wywołującego.
  - Odpowiedź jest ograniczoną do sesji, wyprowadzoną przez serwer projekcją aktywnego inwentarza, obejmującą narzędzia rdzenia, pluginów, kanałów oraz już wykrytych serwerów MCP.
  - `tools.effective` jest tylko do odczytu dla MCP: może przepuścić rozgrzany katalog MCP sesji przez końcową politykę narzędzi, ale nie tworzy środowisk wykonawczych MCP, nie łączy transportów ani nie wydaje `tools/list`. Jeśli nie istnieje pasujący rozgrzany katalog, odpowiedź może zawierać powiadomienie takie jak `mcp-not-yet-connected`, `mcp-not-yet-listed` lub `mcp-stale-catalog`.
  - Wpisy efektywnych narzędzi używają `source="core"`, `source="plugin"`, `source="channel"` lub `source="mcp"`.
- Operatorzy mogą wywołać `tools.invoke` (`operator.write`), aby uruchomić jedno dostępne narzędzie przez tę samą ścieżkę polityki Gateway co `/tools/invoke`.
  - `name` jest wymagane. `args`, `sessionKey`, `agentId`, `confirm` i `idempotencyKey` są opcjonalne.
  - Jeśli obecne są zarówno `sessionKey`, jak i `agentId`, rozwiązany agent sesji musi pasować do `agentId`.
  - Ograniczone do właściciela wrappery rdzenia, takie jak `cron`, `gateway` i `nodes`, wymagają tożsamości właściciela/administratora (`operator.admin`), mimo że sama metoda `tools.invoke` ma uprawnienie `operator.write`.
  - Odpowiedź jest kopertą skierowaną do SDK z polami `ok`, `toolName`, opcjonalnym `output` i typowanymi polami `error`. Odmowy zatwierdzenia lub polityki zwracają `ok:false` w ładunku, zamiast omijać potok polityki narzędzi Gateway.
- Operatorzy mogą wywołać `skills.status` (`operator.read`), aby pobrać widoczny inwentarz Skills dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywołać `skills.search` i `skills.detail` (`operator.read`) dla metadanych odkrywania ClawHub.
- Operatorzy mogą wywołać `skills.upload.begin`, `skills.upload.chunk` i `skills.upload.commit` (`operator.admin`), aby przygotować prywatne archiwum Skills przed jego instalacją. Jest to osobna administracyjna ścieżka przesyłania dla zaufanych klientów, a nie zwykły przepływ instalacji Skills z ClawHub, i domyślnie jest wyłączona, chyba że włączono `skills.install.allowUploadedArchives`.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` tworzy przesyłanie powiązane z tym slugiem i wartością force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` dopisuje bajty przy dokładnym zdekodowanym przesunięciu.
  - `skills.upload.commit({ uploadId, sha256? })` weryfikuje końcowy rozmiar i SHA-256. Commit tylko finalizuje przesyłanie; nie instaluje Skills.
  - Przesłane archiwa Skills są archiwami zip zawierającymi główny plik `SKILL.md`. Wewnętrzna nazwa katalogu archiwum nigdy nie wybiera celu instalacji.
- Operatorzy mogą wywołać `skills.install` (`operator.admin`) w trzech trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje folder Skills w katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb przesyłania: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` instaluje zatwierdzone przesyłanie w katalogu `skills/<slug>` domyślnego obszaru roboczego agenta. Slug i wartość force muszą odpowiadać pierwotnemu żądaniu `skills.upload.begin`. Ten tryb jest odrzucany, chyba że włączono `skills.install.allowUploadedArchives`. Ustawienie nie wpływa na instalacje ClawHub.
  - Tryb instalatora Gateway: `{ name, installId, timeoutMs? }` uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście Gateway. Starsi klienci nadal mogą wysyłać `dangerouslyForceUnsafeInstall`; to pole jest przestarzałe, akceptowane tylko ze względu na zgodność protokołu i ignorowane. Użyj `security.installPolicy` do decyzji instalacyjnych należących do operatora.
- Operatorzy mogą wywołać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug albo wszystkie śledzone instalacje ClawHub w domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji łata wartości `skills.entries.<skillKey>`, takie jak `enabled`, `apiKey` i `env`.

### Widoki `models.list`

`models.list` przyjmuje opcjonalny parametr `view`:

- Pominięte lub `"default"`: bieżące zachowanie środowiska wykonawczego. Jeśli skonfigurowano `agents.defaults.models`, odpowiedź jest dozwolonym katalogiem, w tym dynamicznie wykrytymi modelami dla wpisów `provider/*`. W przeciwnym razie odpowiedź jest pełnym katalogiem Gateway.
- `"configured"`: zachowanie o rozmiarze selektora. Jeśli skonfigurowano `agents.defaults.models`, nadal ma pierwszeństwo, w tym odkrywanie ograniczone do dostawcy dla wpisów `provider/*`. Bez listy dozwolonych odpowiedź używa jawnych wpisów `models.providers.*.models`, przechodząc do pełnego katalogu tylko wtedy, gdy nie istnieją skonfigurowane wiersze modeli.
- `"all"`: pełny katalog Gateway, z pominięciem `agents.defaults.models`. Używaj tego do diagnostyki i interfejsów odkrywania, nie do zwykłych selektorów modeli.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, Gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozwiązują je, wywołując `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node` żądanie `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazywane wywołania `node.invoke system.run` ponownie używają tego kanonicznego `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub `sessionKey` między przygotowaniem a końcowym, zatwierdzonym przekazaniem `system.run`, Gateway odrzuci uruchomienie zamiast ufać zmienionemu ładunkowi.

## Awaryjna ścieżka dostarczania agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczania wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe zachowanie: nierozwiązane lub wyłącznie wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na przejście do wykonania tylko w sesji, gdy nie można rozwiązać żadnej zewnętrznej trasy możliwej do dostarczenia (na przykład sesje wewnętrzne/webchat lub niejednoznaczne konfiguracje wielokanałowe).
- Końcowe wyniki `agent` mogą zawierać `result.deliveryStatus`, gdy zażądano dostarczania, używając tych samych statusów `sent`, `suppressed`, `partial_failed` i `failed`, które udokumentowano dla [`openclaw agent --json --deliver`](/pl/cli/agent#json-delivery-status).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `packages/gateway-protocol/src/version.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca zakresy, które nie obejmują jego bieżącego protokołu. Obecni klienci i serwery wymagają protokołu v4.
- Schematy i modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości są stabilne w protokole v4 i stanowią oczekiwaną bazę dla klientów zewnętrznych.

| Stała                                     | Wartość domyślna                                      | Źródło                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Limit czasu żądania (na RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Limit czasu preauth / connect-challenge   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env może zwiększyć sparowany budżet serwera/klienta) |
| Początkowy backoff ponownego połączenia   | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksymalny backoff ponownego połączenia   | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Ograniczenie szybkiej ponownej próby po zamknięciu device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Okres karencji force-stop przed `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Domyślny limit czasu `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Domyślny interwał tick (przed `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Zamknięcie po limicie czasu tick          | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Serwer ogłasza efektywne wartości `policy.tickIntervalMs`, `policy.maxPayload` i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości zamiast domyślnych sprzed uzgadniania.

## Uwierzytelnianie

- Uwierzytelnianie Gateway za pomocą współdzielonego sekretu używa `connect.params.auth.token` albo
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby przenoszące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) albo tryb spoza local loopback
  `gateway.auth.mode: "trusted-proxy"`, spełniają kontrolę uwierzytelniania połączenia na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatny ingress `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie połączenia
  współdzielonym sekretem; nie wystawiaj tego trybu na publiczny/niezaufany ingress.
- Po sparowaniu Gateway wydaje **token urządzenia** ograniczony do roli połączenia
  + zakresów. Jest zwracany w `hello-ok.auth.deviceToken` i powinien być
  utrwalony przez klienta na potrzeby przyszłych połączeń.
- Klienci powinni utrwalać podstawowy `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne łączenie z tym **zapisanym** tokenem urządzenia powinno także ponownie używać zapisanego
  zatwierdzonego zestawu zakresów dla tego tokenu. Zachowuje to dostęp do odczytu/sondowania/statusu,
  który został już przyznany, i zapobiega cichemu zawężeniu ponownych połączeń do
  węższego, domyślnego zakresu tylko dla administratora.
- Składanie uwierzytelniania połączenia po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest niezależne i zawsze przekazywane dalej, gdy jest ustawione.
  - `auth.token` jest wypełniane według priorytetu: najpierw jawny współdzielony token,
    potem jawny `deviceToken`, a następnie zapisany token dla danego urządzenia (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żaden z powyższych elementów nie rozwiązał
    `auth.token`. Współdzielony token lub dowolny rozwiązany token urządzenia go tłumi.
  - Automatyczne promowanie zapisanego tokenu urządzenia przy jednorazowej ponownej próbie
    `AUTH_TOKEN_MISMATCH` jest ograniczone do **zaufanych punktów końcowych** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez przypięcia się nie kwalifikuje.
- Wbudowany bootstrap kodu konfiguracji zwraca podstawowy token węzła
  `hello-ok.auth.deviceToken` oraz ograniczony token operatora w
  `hello-ok.auth.deviceTokens` na potrzeby zaufanego przekazania mobilnego. Token operatora
  obejmuje `operator.talk.secrets` do natywnych odczytów konfiguracji Talk, ale
  wyklucza zakresy mutacji parowania oraz `operator.admin`.
- Gdy bootstrap kodu konfiguracji inny niż bazowy czeka na zatwierdzenie, szczegóły `PAIRING_REQUIRED`
  obejmują `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  oraz `pauseReconnect: false`. Klienci powinni kontynuować ponowne łączenie z tym samym
  tokenem bootstrapu, dopóki żądanie nie zostanie zatwierdzone albo token nie stanie się nieprawidłowy.
- Utrwalaj `hello-ok.auth.deviceTokens` tylko wtedy, gdy połączenie użyło uwierzytelniania bootstrapu
  przez zaufany transport, taki jak `wss://` albo parowanie przez loopback/lokalne.
- Jeśli klient podaje **jawny** `deviceToken` albo jawne `scopes`, ten
  zestaw zakresów zażądany przez wywołującego pozostaje rozstrzygający; zakresy z pamięci podręcznej są
  ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokenu dla danego urządzenia.
- Tokeny urządzeń można rotować/odwoływać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`). Rotowanie lub
  odwoływanie tokenu węzła albo innej roli niebędącej operatorem wymaga także `operator.admin`.
- `device.token.rotate` zwraca metadane rotacji. Zwraca zastępczy
  bearer token tylko dla wywołań z tego samego urządzenia, które są już uwierzytelnione
  tym tokenem urządzenia, aby klienci używający tylko tokenów mogli utrwalić zamiennik przed
  ponownym połączeniem. Rotacje współdzielone/administracyjne nie zwracają bearer tokenu.
- Wydawanie, rotacja i odwoływanie tokenów pozostają ograniczone do zatwierdzonego zestawu ról
  zapisanego we wpisie parowania danego urządzenia; mutacja tokenu nie może rozszerzyć ani
  wskazać roli urządzenia, której zatwierdzenie parowania nigdy nie przyznało.
- W sesjach tokenów sparowanych urządzeń zarządzanie urządzeniami jest samoograniczone, chyba że
  wywołujący ma także `operator.admin`: wywołujący bez uprawnień administratora mogą zarządzać tylko
  tokenem operatora dla wpisu **własnego** urządzenia. Zarządzanie tokenami węzła i innymi
  tokenami niebędącymi operatorami jest dostępne tylko dla administratora, nawet dla własnego urządzenia wywołującego.
- `device.token.rotate` i `device.token.revoke` sprawdzają także docelowy zestaw zakresów tokenu
  operatora względem bieżących zakresów sesji wywołującego. Wywołujący bez uprawnień administratora
  nie mogą rotować ani odwoływać szerszego tokenu operatora niż ten, który już posiadają.
- Niepowodzenia uwierzytelniania obejmują `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z tokenem dla danego urządzenia z pamięci podręcznej.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać operatorowi wskazówki dotyczące działania.
- `AUTH_SCOPE_MISMATCH` oznacza, że token urządzenia został rozpoznany, ale nie obejmuje
  żądanej roli/zakresów. Klienci nie powinni przedstawiać tego jako złego tokenu;
  poproś operatora o ponowne sparowanie albo zatwierdzenie węższego/szerszego kontraktu zakresów.

## Tożsamość urządzenia + parowanie

- Węzły powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  odcisku palca pary kluczy.
- Gateway wydaje tokeny dla urządzenia + roli.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączono lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania koncentruje się na bezpośrednich połączeniach przez lokalny local loopback.
- OpenClaw ma także wąską ścieżkę samopołączenia lokalną dla backendu/kontenera dla
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia z tego samego hosta przez tailnet lub LAN nadal są traktowane jako zdalne na potrzeby parowania i
  wymagają zatwierdzenia.
- Klienci WS zwykle uwzględniają tożsamość `device` podczas `connect` (operator +
  węzeł). Jedynymi wyjątkami operatora bez urządzenia są jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niebezpiecznym HTTP tylko na localhost.
  - udane uwierzytelnienie operatora Control UI w `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tryb awaryjny, poważne obniżenie bezpieczeństwa).
  - bezpośrednie RPC backendu `gateway-client` przez loopback na zarezerwowanej wewnętrznej
    ścieżce pomocniczej.
- Pominięcie tożsamości urządzenia ma konsekwencje dla zakresu. Gdy połączenie operatora bez urządzenia
  jest dopuszczone przez jawną ścieżkę zaufania, OpenClaw nadal czyści
  samodzielnie zadeklarowane zakresy do pustego zestawu, chyba że ta ścieżka ma nazwany
  wyjątek zachowania zakresów. Metody ograniczone zakresem kończą się wtedy niepowodzeniem z
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` to ścieżka awaryjnego zachowania zakresów Control UI.
  Nie przyznaje zakresów dowolnym
  niestandardowym klientom WebSocket w kształcie backendu lub CLI.
- Zarezerwowana ścieżka pomocnicza backendu `gateway-client` przez bezpośredni loopback zachowuje
  zakresy tylko dla wewnętrznych lokalnych RPC płaszczyzny sterowania; niestandardowe identyfikatory backendu nie
  otrzymują tego wyjątku.
- Wszystkie połączenia muszą podpisać nonce `connect.challenge` dostarczony przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed challenge, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` w `error.details.code` ze stabilnym `error.details.reason`.

Typowe niepowodzenia migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (albo wysłał pusty). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał przy użyciu nieaktualnego/błędnego nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Podpisany znacznik czasu jest poza dozwolonym odchyleniem. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do odcisku palca klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalizacja klucza publicznego nie powiodła się. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisuj ładunek v2, który zawiera nonce serwera.
- Wyślij ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól device/client/role/scopes/token/nonce.
- Starsze podpisy `v2` pozostają akceptowane ze względów zgodności, ale przypinanie metadanych
  sparowanego urządzenia nadal kontroluje politykę poleceń przy ponownym połączeniu.

## TLS + przypinanie

- TLS jest obsługiwane dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk palca certyfikatu Gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` albo CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API Gateway** (status, kanały, modele, czat,
agent, sesje, węzły, zatwierdzenia itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `packages/gateway-protocol/src/schema.ts`.

## Powiązane

- [Protokół mostu](/pl/gateway/bridge-protocol)
- [Runbook Gateway](/pl/gateway)
