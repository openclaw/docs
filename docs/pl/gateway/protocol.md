---
read_when:
    - Implementowanie lub aktualizowanie klientów WS Gateway
    - Debugowanie niezgodności protokołu lub niepowodzeń połączenia
    - Regenerowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie połączenia, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-07-03T10:02:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

Protokół Gateway WS jest **pojedynczą płaszczyzną sterowania + transportem węzłów** dla
OpenClaw. Wszyscy klienci (CLI, web UI, aplikacja macOS, węzły iOS/Android,
węzły headless) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres**
podczas uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po udanym uzgodnieniu połączenia klienci
  powinni stosować limity `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Przy włączonej diagnostyce
  zbyt duże ramki przychodzące i powolne bufory wychodzące emitują zdarzenia `payload.large`
  zanim Gateway zamknie lub odrzuci dotkniętą ramkę. Te zdarzenia zachowują
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

Gdy Gateway nadal kończy uruchamianie procesów sidecar, żądanie `connect` może
zwrócić ponawialny błąd `UNAVAILABLE` z `details.reason` ustawionym na
`"startup-sidecars"` i `retryAfterMs`. Klienci powinni ponowić tę odpowiedź
w ramach swojego ogólnego budżetu połączenia zamiast prezentować ją jako końcową
awarię uzgadniania połączenia.

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` również jest wymagane i raportuje
wynegocjowaną rolę/zakresy. `pluginSurfaceUrls` jest opcjonalne i mapuje nazwy
powierzchni pluginów, takie jak `canvas`, na zakresowane hostowane adresy URL.

Zakresowane adresy URL powierzchni pluginów mogą wygasać. Węzły mogą wywołać
`node.pluginSurface.refresh` z `{ "surface": "canvas" }`, aby otrzymać świeży
wpis w `pluginSurfaceUrls`. Eksperymentalny refaktor pluginu Canvas nie obsługuje
przestarzałej ścieżki zgodności `canvasHostUrl`, `canvasCapability` ani
`node.canvas.capability.refresh`; bieżący klienci natywni i gatewaye muszą używać
powierzchni pluginów.

Gdy nie zostanie wydany token urządzenia, `hello-ok.auth` raportuje wynegocjowane
uprawnienia bez pól tokenów:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Zaufani klienci backendu w tym samym procesie (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogą pominąć `device` przy bezpośrednich połączeniach local loopback,
gdy uwierzytelniają się współdzielonym tokenem/hasłem gatewaya. Ta ścieżka jest zarezerwowana
dla wewnętrznych RPC płaszczyzny sterowania i zapobiega blokowaniu lokalnej pracy backendu,
takiej jak aktualizacje sesji subagentów, przez nieaktualne baseline’y parowania CLI/urządzenia. Klienci zdalni,
klienci pochodzący z przeglądarki, klienci węzłów oraz jawni klienci z tokenem urządzenia/tożsamością urządzenia
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

Wbudowany bootstrap kodu QR/kodu konfiguracji jest świeżą ścieżką przekazania mobilnego. Udane
połączenie z baseline’owym kodem konfiguracji zwraca podstawowy token węzła oraz jeden ograniczony
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

Przekazanie operatora jest celowo ograniczone, aby onboarding QR mógł uruchomić
mobilną pętlę operatora bez przyznawania `operator.admin` ani `operator.pairing`.
Obejmuje ono `operator.talk.secrets`, aby klient natywny mógł odczytać konfigurację Talk,
której potrzebuje po bootstrapie. Szersze zakresy administracyjne i parowania wymagają
oddzielnego zatwierdzonego parowania operatora lub przepływu tokenu. Klienci powinni utrwalać
`hello-ok.auth.deviceTokens` tylko
wtedy, gdy połączenie użyło uwierzytelniania bootstrap na zaufanym transporcie, takim jak `wss://` lub
parowanie loopback/lokalne.

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

Metody wywołujące skutki uboczne wymagają **kluczy idempotencji** (zobacz schemat).

## Role + zakresy

Pełny model zakresów operatora, kontrole w czasie zatwierdzania i semantykę współdzielonych sekretów
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
Gdy sekrety są uwzględnione, klienci powinni odczytywać aktywne poświadczenie
dostawcy Talk z `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
pozostaje w kształcie źródłowym i może być obiektem SecretRef albo zredagowanym ciągiem znaków.

Metody RPC Gateway rejestrowane przez plugin mogą żądać własnego zakresu operatora, ale
zastrzeżone podstawowe prefiksy administracyjne (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze rozstrzygają się do `operator.admin`.

Zakres metody jest tylko pierwszą bramką. Niektóre polecenia slash osiągane przez
`chat.send` stosują dodatkowo surowsze kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w czasie zatwierdzania ponad
bazowym zakresem metody:

- żądania bez polecenia: `operator.pairing`
- żądania z poleceniami węzła innymi niż exec: `operator.pairing` + `operator.write`
- żądania, które obejmują `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Możliwości/polecenia/uprawnienia (węzeł)

Węzły deklarują roszczenia możliwości podczas połączenia:

- `caps`: kategorie możliwości wysokiego poziomu, takie jak `camera`, `canvas`, `screen`,
  `location`, `voice` i `talk`.
- `commands`: lista dozwolonych poleceń do wywołania.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i egzekwuje listy dozwolone po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy obecności zawierają `deviceId`, `roles` i `scopes`, dzięki czemu UI mogą pokazywać jeden wiersz na urządzenie
  nawet wtedy, gdy łączy się ono zarówno jako **operator**, jak i **node**.
- `node.list` zawiera opcjonalne pola `lastSeenAtMs` i `lastSeenReason`. Połączone węzły raportują
  swój bieżący czas połączenia jako `lastSeenAtMs` z przyczyną `connect`; sparowane węzły mogą także raportować
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

`trigger` jest zamkniętym enumem: `background`, `silent_push`, `bg_app_refresh`,
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

## Zakresowanie zdarzeń broadcast

Wypychane przez serwer zdarzenia broadcast WebSocket są bramkowane zakresami, aby sesje z zakresem parowania lub tylko węzła nie odbierały pasywnie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Definiowane przez plugin broadcasty `plugin.*`** są bramkowane do `operator.write` lub `operator.admin`, zależnie od tego, jak plugin je zarejestrował.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia połączenia/rozłączenia itd.) pozostają nieograniczone, aby kondycja transportu była obserwowalna dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń broadcast** są domyślnie bramkowane zakresami (fail-closed), chyba że zarejestrowany handler jawnie je rozluźni.

Każde połączenie klienta utrzymuje własny numer sekwencyjny per klient, więc broadcasty zachowują monotoniczną kolejność na tym gnieździe nawet wtedy, gdy różni klienci widzą różne przefiltrowane zakresami podzbiory strumienia zdarzeń.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż powyższe przykłady uzgadniania połączenia/uwierzytelniania. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` jest konserwatywną
listą odkrywania zbudowaną z `src/gateway/server-methods-list.ts` oraz załadowanych
eksportów metod pluginów/kanałów. Traktuj ją jako odkrywanie funkcji, nie pełne
wyliczenie `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System i tożsamość">
    - `health` zwraca buforowany lub świeżo sprawdzony obraz kondycji Gateway.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestrator stabilności diagnostycznej. Przechowuje metadane operacyjne, takie jak nazwy zdarzeń, liczby, rozmiary w bajtach, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów oraz identyfikatory sesji. Nie przechowuje tekstu czatów, treści Webhook, wyników narzędzi, surowych treści żądań lub odpowiedzi, tokenów, plików cookie ani wartości tajnych. Wymagany jest zakres odczytu operatora.
    - `status` zwraca podsumowanie Gateway w stylu `/status`; pola wrażliwe są uwzględniane tylko dla klientów operatora z zakresem administracyjnym.
    - `gateway.identity.get` zwraca tożsamość urządzenia Gateway używaną przez przepływy przekaźnika i parowania.
    - `system-presence` zwraca bieżący obraz obecności połączonych urządzeń operatora/węzłów.
    - `system-event` dodaje zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
    - `last-heartbeat` zwraca najnowsze utrwalone zdarzenie Heartbeat.
    - `set-heartbeats` przełącza przetwarzanie Heartbeat w Gateway.

  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolonych w czasie działania. Przekaż `{ "view": "configured" }` dla skonfigurowanych modeli o rozmiarze selektora (`agents.defaults.models` najpierw, potem `models.providers.*.models`) albo `{ "view": "all" }` dla pełnego katalogu.
    - `usage.status` zwraca okna użycia dostawcy / podsumowania pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
      Przekaż `agentId` dla jednego agenta albo `agentScope: "all"`, aby zagregować skonfigurowanych agentów.
    - `doctor.memory.status` zwraca gotowość pamięci wektorowej / buforowanego osadzania dla aktywnego domyślnego obszaru roboczego agenta. Przekaż `{ "probe": true }` albo `{ "deep": true }` tylko wtedy, gdy wywołujący jawnie chce sprawdzić na żywo dostawcę osadzania. Klienci świadomi Dreaming mogą także przekazać `{ "agentId": "agent-id" }`, aby ograniczyć statystyki magazynu Dreaming do wybranego obszaru roboczego agenta; pominięcie `agentId` zachowuje domyślne wycofanie do agenta domyślnego i agreguje skonfigurowane obszary robocze Dreaming.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` i `doctor.memory.dedupeDreamDiary` akceptują opcjonalne parametry `{ "agentId": "agent-id" }` dla widoków/akcji Dreaming wybranego agenta. Gdy `agentId` zostanie pominięte, działają na skonfigurowanym domyślnym obszarze roboczym agenta.
    - `doctor.memory.remHarness` zwraca ograniczony, tylko do odczytu podgląd mechanizmu REM dla zdalnych klientów płaszczyzny sterowania. Może zawierać ścieżki obszaru roboczego, fragmenty pamięci, wyrenderowany ugruntowany Markdown i kandydatów do głębokiej promocji, więc wywołujący potrzebują `operator.read`.
    - `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji. Przekaż `agentId` dla jednego
      agenta albo `agentScope: "all"`, aby wyświetlić razem skonfigurowanych agentów.
    - `sessions.usage.timeseries` zwraca użycie w szeregu czasowym dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Channels and login helpers">
    - `channels.status` zwraca podsumowania stanu wbudowanych i dołączonych kanałów/pluginów.
    - `channels.logout` wylogowuje określony kanał/konto, jeśli kanał obsługuje wylogowanie.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na ukończenie tego przepływu logowania QR/web i po powodzeniu uruchamia kanał.
    - `push.test` wysyła testowe powiadomienie push APNs do zarejestrowanego węzła iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słów wybudzających.
    - `voicewake.set` aktualizuje wyzwalacze słów wybudzających i rozgłasza zmianę.

  </Accordion>

  <Accordion title="Wiadomości i logi">
    - `send` to bezpośredni RPC dostarczania wychodzącego dla wysyłek kierowanych do kanału/konta/wątku poza runnerem czatu.
    - `logs.tail` zwraca ogon skonfigurowanego plikowego logu Gateway z kontrolami kursora/limitu i maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Talk i TTS">
    - `talk.catalog` zwraca tylko do odczytu katalog dostawców Talk dla mowy, transkrypcji strumieniowej i głosu w czasie rzeczywistym. Zawiera kanoniczne identyfikatory dostawców, aliasy rejestru, etykiety, skonfigurowany stan, opcjonalny wynik `ready` na poziomie grupy, ujawnione identyfikatory modeli/głosów, kanoniczne tryby, transporty, strategie brain oraz flagi audio/możliwości czasu rzeczywistego bez zwracania sekretów dostawców ani modyfikowania globalnej konfiguracji. Bieżące instancje Gateway ustawiają `ready` po zastosowaniu wyboru dostawcy środowiska uruchomieniowego; klienci powinni traktować jego brak jako niezweryfikowany dla zgodności ze starszymi instancjami Gateway.
    - `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (lub `operator.admin`).
    - `talk.session.create` tworzy sesję Talk należącą do Gateway dla `realtime/gateway-relay`, `transcription/gateway-relay` lub `stt-tts/managed-room`. Dla `stt-tts/managed-room` wywołujący z `operator.write`, którzy przekazują `sessionKey`, muszą także przekazać `spawnedBy` dla zakresowanej widoczności klucza sesji; tworzenie niezakresowanego `sessionKey` oraz `brain: "direct-tools"` wymagają `operator.admin`.
    - `talk.session.join` weryfikuje token sesji managed-room, emituje zdarzenia `session.ready` lub `session.replaced` według potrzeb oraz zwraca metadane pokoju/sesji i ostatnie zdarzenia Talk bez tokenu w postaci jawnego tekstu ani zapisanego hasha tokenu.
    - `talk.session.appendAudio` dołącza wejściowy dźwięk PCM w base64 do należących do Gateway sesji przekaźnika czasu rzeczywistego i transkrypcji.
    - `talk.session.startTurn`, `talk.session.endTurn` i `talk.session.cancelTurn` sterują cyklem życia tury managed-room z odrzucaniem przestarzałych tur przed wyczyszczeniem stanu.
    - `talk.session.cancelOutput` zatrzymuje wyjściowy dźwięk asystenta, głównie dla wejścia wtrącającego bramkowanego przez VAD w sesjach przekaźnika Gateway.
    - `talk.session.submitToolResult` kończy wywołanie narzędzia dostawcy wyemitowane przez należącą do Gateway sesję przekaźnika czasu rzeczywistego. Przekaż `options: { willContinue: true }` dla tymczasowego wyniku narzędzia, gdy końcowy wynik pojawi się później, albo `options: { suppressResponse: true }`, gdy wynik narzędzia powinien zaspokoić wywołanie dostawcy bez uruchamiania kolejnej odpowiedzi asystenta w czasie rzeczywistym.
    - `talk.session.steer` wysyła sterowanie głosowe aktywnego uruchomienia do należącej do Gateway sesji Talk wspieranej przez agenta. Akceptuje `{ sessionId, text, mode? }`, gdzie `mode` to `status`, `steer`, `cancel` albo `followup`; pominięty tryb jest klasyfikowany na podstawie wypowiedzianego tekstu.
    - `talk.session.close` zamyka należącą do Gateway sesję przekaźnika, transkrypcji lub managed-room i emituje końcowe zdarzenia Talk.
    - `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów WebChat/Control UI.
    - `talk.client.create` tworzy należącą do klienta sesję dostawcy czasu rzeczywistego przy użyciu `webrtc` lub `provider-websocket`, podczas gdy Gateway posiada konfigurację, poświadczenia, instrukcje i politykę narzędzi.
    - `talk.client.toolCall` pozwala należącym do klienta transportom czasu rzeczywistego przekazywać wywołania narzędzi dostawcy do polityki Gateway. Pierwszym obsługiwanym narzędziem jest `openclaw_agent_consult`; klienci otrzymują identyfikator uruchomienia i czekają na zwykłe zdarzenia cyklu życia czatu przed przesłaniem specyficznego dla dostawcy wyniku narzędzia.
    - `talk.client.steer` wysyła sterowanie głosowe aktywnego uruchomienia dla należących do klienta transportów czasu rzeczywistego. Gateway rozwiązuje aktywne osadzone uruchomienie z `sessionKey` i zwraca ustrukturyzowany wynik zaakceptowany/odrzucony zamiast po cichu porzucać sterowanie.
    - `talk.event` to pojedynczy kanał zdarzeń Talk dla adapterów czasu rzeczywistego, transkrypcji, STT/TTS, managed-room, telefonii i spotkań.
    - `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców rezerwowych i stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny inwentarz dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRefs i podmienia stan sekretów środowiska uruchomieniowego tylko przy pełnym powodzeniu.
    - `secrets.resolve` rozwiązuje przypisania sekretów docelowych dla polecenia dla konkretnego zestawu polecenie/cel.
    - `config.get` zwraca bieżącą migawkę konfiguracji i hash.
    - `config.set` zapisuje zweryfikowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji. Destrukcyjna zamiana tablicy
      wymaga ścieżki objętej zmianą w `replacePaths`; zagnieżdżone tablice
      pod wpisami tablic używają ścieżek `[]`, takich jak `agents.list[].skills`.
    - `config.apply` weryfikuje i zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca bieżący ładunek schematu konfiguracji używany przez narzędzia Control UI i CLI: schemat, `uiHints`, wersję i metadane generowania, w tym metadane schematów Plugin + kanału, gdy środowisko uruchomieniowe może je załadować. Schemat zawiera metadane pól `title` / `description` wyprowadzone z tych samych etykiet i tekstów pomocy, których używa UI, w tym gałęzie kompozycji zagnieżdżonych obiektów, wildcard, elementów tablic oraz `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pola.
    - `config.schema.lookup` zwraca ładunek wyszukiwania o zakresie ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę + `hintPath`, opcjonalne `reloadKind` oraz bezpośrednie podsumowania elementów potomnych dla zejścia w głąb w UI/CLI. `reloadKind` jest jednym z `restart`, `hot` albo `none` i odzwierciedla planer przeładowania konfiguracji Gateway dla żądanej ścieżki. Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika i typowe pola walidacji (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia liczbowe/tekstowe/tablicowe/obiektowe oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania elementów potomnych ujawniają `key`, znormalizowaną `path`, `type`, `required`, `hasChildren`, opcjonalne `reloadKind` oraz dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji Gateway i planuje restart tylko wtedy, gdy sama aktualizacja się powiodła; wywołujący z sesją mogą dołączyć `continuationMessage`, aby uruchamianie wznowiło jedną kolejną turę agenta przez kolejkę kontynuacji restartu. Aktualizacje menedżera pakietów i nadzorowane aktualizacje checkoutu git z płaszczyzny sterowania używają odłączonego przekazania do usługi zarządzanej zamiast zastępować drzewo pakietu lub modyfikować checkout/wynik budowania wewnątrz działającego Gateway. Rozpoczęte przekazanie zwraca `ok: true` z `result.reason: "managed-service-handoff-started"` i `handoff.status: "started"`; niedostępne lub nieudane przekazania zwracają `ok: false` z `managed-service-handoff-unavailable` albo `managed-service-handoff-failed`, plus `handoff.command`, gdy wymagana jest ręczna aktualizacja w powłoce. Niedostępne przekazanie oznacza, że OpenClaw nie ma bezpiecznej granicy nadzorcy ani trwałej tożsamości usługi, takiej jak `OPENCLAW_SYSTEMD_UNIT` dla systemd. Podczas rozpoczętego przekazania znacznik restartu może krótko zgłaszać `stats.reason: "restart-health-pending"`; kontynuacja jest opóźniana, dopóki CLI nie zweryfikuje zrestartowanego Gateway i nie zapisze końcowego znacznika `ok`.
    - `update.status` odświeża i zwraca najnowszy znacznik restartu aktualizacji, w tym działającą wersję po restarcie, gdy jest dostępna.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator onboardingu przez WS RPC.

  </Accordion>

  <Accordion title="Pomocniki agenta i obszaru roboczego">
    - `agents.list` zwraca skonfigurowane wpisy agentów, w tym efektywny model i metadane środowiska uruchomieniowego.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów oraz połączeniami obszaru roboczego.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami rozruchowymi obszaru roboczego udostępnionymi agentowi.
    - `tasks.list`, `tasks.get` i `tasks.cancel` udostępniają rejestr zadań Gateway klientom SDK i operatorom.
    - `artifacts.list`, `artifacts.get` i `artifacts.download` udostępniają podsumowania artefaktów pochodzących z transkrypcji oraz pobieranie dla jawnego zakresu `sessionKey`, `runId` lub `taskId`. Zapytania o uruchomienia i zadania rozwiązują sesję właściciela po stronie serwera i zwracają tylko multimedia transkrypcji o zgodnym pochodzeniu; niebezpieczne lub lokalne źródła URL zwracają nieobsługiwane pobrania zamiast pobierania po stronie serwera.
    - `environments.list` i `environments.status` udostępniają klientom SDK wykrywanie lokalnych dla Gateway i węzłowych środowisk w trybie tylko do odczytu.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcową migawkę, gdy jest dostępna.

  </Accordion>

  <Accordion title="Kontrola sesji">
    - `sessions.list` zwraca bieżący indeks sesji, w tym metadane `agentRuntime` dla każdego wiersza, gdy skonfigurowano backend środowiska uruchomieniowego agenta.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkrypcji/wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkrypcji dla konkretnych kluczy sesji.
    - `sessions.describe` zwraca jeden wiersz sesji Gateway dla dokładnego klucza sesji.
    - `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant przerwania i sterowania dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji. Wywołujący może przekazać `key` z opcjonalnym `runId` albo samo `runId` dla aktywnych uruchomień, które Gateway może rozwiązać do sesji.
    - `sessions.patch` aktualizuje metadane/nadpisania sesji i raportuje rozwiązany model kanoniczny oraz efektywny `agentRuntime`.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest normalizowane do wyświetlania dla klientów UI: wbudowane tagi dyrektyw są usuwane z widocznego tekstu, tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi) i ujawnione tokeny sterujące modelu w ASCII/pełnej szerokości są usuwane, wiersze asystenta zawierające wyłącznie ciche tokeny, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a nadmiernie duże wiersze mogą być zastąpione symbolami zastępczymi.
    - `chat.message.get` to addytywny, ograniczony czytnik pełnej wiadomości dla pojedynczego widocznego wpisu transkrypcji. Klienci przekazują `sessionKey`, opcjonalne `agentId`, gdy wybór sesji jest ograniczony do agenta, oraz `messageId` transkrypcji wcześniej ujawniony przez `chat.history`, a Gateway zwraca tę samą projekcję znormalizowaną do wyświetlania bez lekkiego limitu obcięcia historii, gdy zapisany wpis jest nadal dostępny i nie jest nadmiernie duży.
    - `chat.send` akceptuje jednoturowe `fastMode: "auto"`, aby użyć trybu szybkiego dla wywołań modelu rozpoczętych przed automatycznym progiem, a następnie uruchamiać późniejsze ponowienia, fallback, wyniki narzędzi lub wywołania kontynuacji bez trybu szybkiego. Próg domyślnie wynosi 60 sekund i można go skonfigurować dla każdego modelu za pomocą `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Wywołujący `chat.send` może przekazać jednoturowe `fastAutoOnSeconds`, aby nadpisać próg dla tego żądania.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.

  </Accordion>

  <Accordion title="Parowanie Node, wywoływanie i praca oczekująca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` i `node.pair.verify` obejmują parowanie Node i weryfikację rozruchu.
    - `node.list` i `node.describe` zwracają znany/podłączony stan Node.
    - `node.rename` aktualizuje etykietę sparowanego Node.
    - `node.invoke` przekazuje polecenie do podłączonego Node.
    - `node.invoke.result` zwraca wynik żądania wywołania.
    - `node.event` przenosi zdarzenia pochodzące z Node z powrotem do gateway.
    - `node.pending.pull` i `node.pending.ack` to interfejsy API kolejki podłączonego Node.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą pracą oczekującą dla offline/rozłączonych Node.

  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia exec oraz wyszukiwanie/odtwarzanie oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie exec i zwraca ostateczną decyzję (lub `null` po przekroczeniu limitu czasu).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają migawkami zasad zatwierdzania exec gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalnymi dla Node zasadami zatwierdzania exec przez polecenia przekaźnika Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują przepływy zatwierdzania zdefiniowane przez Plugin.

  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe lub przy następnym Heartbeat wstrzyknięcie tekstu wybudzającego; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - `cron.run` pozostaje RPC w stylu dodawania do kolejki dla ręcznych uruchomień. Klienci, którzy potrzebują semantyki ukończenia, powinni odczytać zwrócone `runId` i odpytywać `cron.runs`.
    - `cron.runs` akceptuje opcjonalny niepusty filtr `runId`, aby klienci mogli śledzić jedno zakolejkowane ręczne uruchomienie bez ścigania się z innymi wpisami historii dla tego samego zadania.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject`, oraz inne zdarzenia czatu wyłącznie transkrypcyjne. W protokole v4 ładunki delta przenoszą `deltaText`; `message` pozostaje skumulowaną migawką asystenta. Zamiany niebędące prefiksami ustawiają `replace=true` i używają `deltaText` jako tekstu zastępczego.
- `session.message`, `session.operation` i `session.tool`: aktualizacje transkrypcji, operacji sesji w toku oraz strumienia zdarzeń dla subskrybowanej sesji.
- `sessions.changed`: zmienił się indeks sesji lub metadane.
- `presence`: aktualizacje migawki obecności systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja migawki kondycji gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania Cron.
- `shutdown`: powiadomienie o wyłączeniu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania Node.
- `node.invoke.request`: rozgłoszenie żądania wywołania Node.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniono konfigurację wyzwalacza słowa wybudzającego.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia zatwierdzania exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzania Plugin.

### Metody pomocnicze Node

- Node mogą wywołać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych Skills do sprawdzania automatycznego zezwalania.

### RPC rejestru zadań

Klienci operatora mogą sprawdzać i anulować rekordy zadań w tle Gateway przez RPC rejestru zadań. Te metody zwracają oczyszczone podsumowania zadań, a nie surowy stan środowiska uruchomieniowego.

- `tasks.list` wymaga `operator.read`.
  - Parametry: opcjonalny `status` (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` lub `"timed_out"`) albo tablica tych statusów, opcjonalny `agentId`, opcjonalny `sessionKey`, opcjonalny `limit` od `1` do `500` oraz opcjonalny ciąg `cursor`.
  - Wynik: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` wymaga `operator.read`.
  - Parametry: `{ "taskId": string }`.
  - Wynik: `{ "task": TaskSummary }`.
  - Brakujące identyfikatory zadań zwracają kształt błędu not-found Gateway.
- `tasks.cancel` wymaga `operator.write`.
  - Parametry: `{ "taskId": string, "reason"?: string }`.
  - Wynik:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informuje, czy rejestr zawierał pasujące zadanie. `cancelled` informuje, czy środowisko uruchomieniowe zaakceptowało lub zarejestrowało anulowanie.

`TaskSummary` zawiera `id`, `status` oraz opcjonalne metadane, takie jak `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, znaczniki czasu, postęp, podsumowanie końcowe i oczyszczony tekst błędu. `agentId` identyfikuje agenta wykonującego zadanie; `sessionKey` i `ownerKey` zachowują kontekst żądającego i kontroli.

### Metody pomocnicze operatora

- Operatorzy mogą wywołać `commands.list` (`operator.read`), aby pobrać wykaz poleceń środowiska uruchomieniowego dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, do której powierzchni kierowana jest podstawowa wartość `name`:
    - `text` zwraca podstawowy token polecenia tekstowego bez początkowego `/`
    - `native` i domyślna ścieżka `both` zwracają natywne nazwy świadome dostawcy, gdy są dostępne
  - `textAliases` przenosi dokładne aliasy z ukośnikiem, takie jak `/model` i `/m`.
  - `nativeName` przenosi natywną nazwę polecenia świadomą dostawcy, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na natywne nazewnictwo oraz dostępność natywnych poleceń Plugin.
  - `includeArgs=false` pomija serializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywołać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi środowiska uruchomieniowego dla agenta. Odpowiedź obejmuje pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel Plugin, gdy `source="plugin"`
  - `optional`: czy narzędzie Plugin jest opcjonalne
- Operatorzy mogą wywołać `tools.effective` (`operator.read`), aby pobrać skuteczny w środowisku uruchomieniowym wykaz narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst środowiska uruchomieniowego z sesji po stronie serwera zamiast akceptować dostarczony przez wywołującego kontekst uwierzytelniania lub dostarczania.
  - Odpowiedź jest projekcją aktywnego wykazu wyprowadzoną przez serwer i ograniczoną do sesji, obejmującą narzędzia rdzenia, Plugin, kanału oraz już wykrytych serwerów MCP.
  - `tools.effective` jest tylko do odczytu dla MCP: może przepuścić rozgrzany katalog MCP sesji przez końcową politykę narzędzi, ale nie tworzy środowisk uruchomieniowych MCP, nie łączy transportów ani nie wydaje `tools/list`. Jeśli nie istnieje pasujący rozgrzany katalog, odpowiedź może zawierać powiadomienie, takie jak `mcp-not-yet-connected`, `mcp-not-yet-listed` lub `mcp-stale-catalog`.
  - Wpisy skutecznych narzędzi używają `source="core"`, `source="plugin"`, `source="channel"` lub `source="mcp"`.
- Operatorzy mogą wywołać `tools.invoke` (`operator.write`), aby uruchomić jedno dostępne narzędzie przez tę samą ścieżkę polityki Gateway co `/tools/invoke`.
  - `name` jest wymagane. `args`, `sessionKey`, `agentId`, `confirm` i `idempotencyKey` są opcjonalne.
  - Jeśli obecne są zarówno `sessionKey`, jak i `agentId`, rozwiązany agent sesji musi odpowiadać `agentId`.
  - Wrappery rdzenia tylko dla właściciela, takie jak `cron`, `gateway` i `nodes`, wymagają tożsamości właściciela/administratora (`operator.admin`), mimo że sama metoda `tools.invoke` ma uprawnienie `operator.write`.
  - Odpowiedź jest kopertą przeznaczoną dla SDK z polami `ok`, `toolName`, opcjonalnym `output` oraz typowanymi polami `error`. Odmowy zatwierdzenia lub polityki zwracają `ok:false` w ładunku zamiast omijać potok polityki narzędzi Gateway.
- Operatorzy mogą wywołać `skills.status` (`operator.read`), aby pobrać widoczny wykaz Skills dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź obejmuje kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywołać `skills.search` i `skills.detail` (`operator.read`) dla metadanych odkrywania ClawHub.
- Operatorzy mogą wywołać `skills.upload.begin`, `skills.upload.chunk` i `skills.upload.commit` (`operator.admin`), aby przygotować prywatne archiwum Skills przed jego zainstalowaniem. Jest to osobna administracyjna ścieżka przesyłania dla zaufanych klientów, a nie zwykły przepływ instalacji Skills z ClawHub, i jest domyślnie wyłączona, chyba że włączono `skills.install.allowUploadedArchives`.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    tworzy przesyłanie powiązane z tym slugiem i wartością force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` dołącza bajty pod dokładnym zdekodowanym przesunięciem.
  - `skills.upload.commit({ uploadId, sha256? })` weryfikuje końcowy rozmiar i SHA-256. Commit tylko finalizuje przesyłanie; nie instaluje Skills.
  - Przesłane archiwa Skills są archiwami zip zawierającymi główny `SKILL.md`. Wewnętrzna nazwa katalogu archiwum nigdy nie wybiera celu instalacji.
- Operatorzy mogą wywołać `skills.install` (`operator.admin`) w trzech trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje folder Skills w katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb przesyłania: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instaluje zatwierdzone przesłanie w katalogu `skills/<slug>` domyślnego obszaru roboczego agenta. Slug i wartość force muszą odpowiadać pierwotnemu żądaniu `skills.upload.begin`. Ten tryb jest odrzucany, chyba że włączono `skills.install.allowUploadedArchives`. Ustawienie nie wpływa na instalacje ClawHub.
  - Tryb instalatora Gateway: `{ name, installId, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście Gateway. Starsi klienci mogą nadal wysyłać `dangerouslyForceUnsafeInstall`; to pole jest przestarzałe, akceptowane tylko ze względu na zgodność protokołu i ignorowane. Użyj `security.installPolicy` dla decyzji instalacyjnych należących do operatora.
- Operatorzy mogą wywołać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug lub wszystkie śledzone instalacje ClawHub w domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji łata wartości `skills.entries.<skillKey>`, takie jak `enabled`, `apiKey` i `env`.

### Widoki `models.list`

`models.list` akceptuje opcjonalny parametr `view`:

- Pominięte lub `"default"`: bieżące zachowanie środowiska uruchomieniowego. Jeśli skonfigurowano `agents.defaults.models`, odpowiedzią jest dozwolony katalog, w tym dynamicznie odkryte modele dla wpisów `provider/*`. W przeciwnym razie odpowiedzią jest pełny katalog Gateway.
- `"configured"`: zachowanie o rozmiarze selektora. Jeśli skonfigurowano `agents.defaults.models`, nadal ma pierwszeństwo, w tym odkrywanie ograniczone do dostawcy dla wpisów `provider/*`. Bez listy dozwolonych odpowiedź używa jawnych wpisów `models.providers.*.models`, cofając się do pełnego katalogu tylko wtedy, gdy nie istnieją żadne skonfigurowane wiersze modeli.
- `"all"`: pełny katalog Gateway, z pominięciem `agents.defaults.models`. Używaj tego do diagnostyki i interfejsów odkrywania, a nie do zwykłych selektorów modeli.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, Gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozstrzygają je, wywołując `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node`, `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane wywołania `node.invoke system.run` ponownie używają tego kanonicznego `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmodyfikuje `command`, `rawCommand`, `cwd`, `agentId` lub `sessionKey` między przygotowaniem a końcowym zatwierdzonym przekazaniem `system.run`, Gateway odrzuca uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Awaryjne dostarczanie agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczania wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe działanie: nierozwiązane lub wyłącznie wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na awaryjne przejście do wykonania tylko w sesji, gdy nie da się rozwiązać zewnętrznej dostarczalnej trasy (na przykład sesje wewnętrzne/webchat lub niejednoznaczne konfiguracje wielokanałowe).
- Końcowe wyniki `agent` mogą zawierać `result.deliveryStatus`, gdy zażądano dostarczania, używając tych samych statusów `sent`, `suppressed`, `partial_failed` i `failed`, które udokumentowano dla [`openclaw agent --json --deliver`](/pl/cli/agent#json-delivery-status).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `packages/gateway-protocol/src/version.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca zakresy, które nie obejmują jego bieżącego protokołu. Bieżący klienci i serwery wymagają protokołu v4.
- Schematy i modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości są stabilne w protokole v4 i stanowią oczekiwaną podstawę dla klientów zewnętrznych.

| Stała                                     | Wartość domyślna                                      | Źródło                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Limit czasu żądania (na RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Limit czasu preauth / connect-challenge   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env może zwiększyć sparowany budżet serwera/klienta) |
| Początkowe opóźnienie ponownego połączenia | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksymalne opóźnienie ponownego połączenia | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Ograniczenie szybkiej ponownej próby po zamknięciu tokenu urządzenia | `250` ms                     | `src/gateway/client.ts`                                                                    |
| Okres karencji force-stop przed `terminate()` | `250` ms                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Domyślny limit czasu `stopAndWait()`       | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Domyślny interwał tick (przed `hello-ok`)  | `30_000` ms                                          | `src/gateway/client.ts`                                                                    |
| Zamknięcie po limicie czasu tick           | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Serwer ogłasza skuteczne wartości `policy.tickIntervalMs`, `policy.maxPayload` i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości zamiast domyślnych wartości sprzed uzgodnienia.

## Uwierzytelnianie

- Uwierzytelnianie Gateway przy użyciu wspólnego sekretu używa `connect.params.auth.token` lub
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby niosące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) albo niebędący loopback
  `gateway.auth.mode: "trusted-proxy"`, spełniają kontrolę uwierzytelniania connect na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatny ingress `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie connect
  wspólnym sekretem; nie wystawiaj tego trybu na publicznym/niezaufanym ingressie.
- Po sparowaniu Gateway wystawia **token urządzenia** ograniczony do roli połączenia
  + zakresów. Jest zwracany w `hello-ok.auth.deviceToken` i powinien być
  utrwalony przez klienta do przyszłych połączeń.
- Klienci powinni utrwalać podstawowy `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne połączenie z tym **zapisanym** tokenem urządzenia powinno również ponownie użyć zapisanego
  zatwierdzonego zestawu zakresów dla tego tokena. Zachowuje to dostęp do odczytu/sondowania/statusu,
  który już przyznano, i pozwala uniknąć cichego zawężania ponownych połączeń do
  węższego, niejawnego zakresu tylko dla administratora.
- Składanie uwierzytelniania connect po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest niezależne i zawsze jest przekazywane, gdy jest ustawione.
  - `auth.token` jest wypełniane według priorytetu: najpierw jawny wspólny token,
    potem jawny `deviceToken`, a następnie zapisany token dla danego urządzenia (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żadne z powyższych nie rozwiązało
    `auth.token`. Wspólny token albo dowolny rozwiązany token urządzenia go wyłącza.
  - Automatyczne promowanie zapisanego tokena urządzenia przy jednorazowej
    ponownej próbie `AUTH_TOKEN_MISMATCH` jest ograniczone wyłącznie do **zaufanych punktów końcowych** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez przypięcia nie kwalifikuje się.
- Wbudowany bootstrap kodu konfiguracji zwraca podstawowy token Node
  `hello-ok.auth.deviceToken` oraz ograniczony token operatora w
  `hello-ok.auth.deviceTokens` do zaufanego przekazania mobilnego. Token operatora
  zawiera `operator.talk.secrets` do natywnych odczytów konfiguracji Talk oraz
  wyklucza `operator.admin` i `operator.pairing`.
- Gdy bootstrap kodu konfiguracji spoza bazowego zestawu oczekuje na zatwierdzenie, szczegóły `PAIRING_REQUIRED`
  zawierają `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  oraz `pauseReconnect: false`. Klienci powinni nadal ponawiać połączenie z tym samym
  tokenem bootstrap, aż żądanie zostanie zatwierdzone albo token stanie się nieprawidłowy.
- Utrwalaj `hello-ok.auth.deviceTokens` tylko wtedy, gdy połączenie używało uwierzytelniania bootstrap
  przez zaufany transport, taki jak `wss://` albo parowanie loopback/lokalne.
- Jeśli klient podaje **jawny** `deviceToken` albo jawne `scopes`, ten
  żądany przez wywołującego zestaw zakresów pozostaje autorytatywny; zakresy z pamięci podręcznej są
  ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokena dla danego urządzenia.
- Tokeny urządzeń można rotować/unieważniać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`). Rotacja albo
  unieważnienie tokena Node lub innej roli nieoperatorowej wymaga również `operator.admin`.
- `device.token.rotate` zwraca metadane rotacji. Powtarza zastępczy
  token bearer tylko dla wywołań z tego samego urządzenia, które są już uwierzytelnione tym
  tokenem urządzenia, dzięki czemu klienci używający wyłącznie tokenów mogą utrwalić zamiennik przed
  ponownym połączeniem. Rotacje wykonywane wspólnym/administacyjnym tokenem nie powtarzają tokena bearer.
- Wystawianie, rotacja i unieważnianie tokenów pozostają ograniczone do zatwierdzonego zestawu ról
  zapisanego we wpisie parowania tego urządzenia; mutacja tokena nie może rozszerzyć ani
  wskazać roli urządzenia, której zatwierdzenie parowania nigdy nie przyznało.
- Dla sesji tokenów sparowanych urządzeń zarządzanie urządzeniami jest samoograniczone, chyba że
  wywołujący ma również `operator.admin`: wywołujący bez uprawnień administratora mogą zarządzać tylko
  tokenem operatora dla wpisu **własnego** urządzenia. Zarządzanie tokenami Node i innymi
  tokenami nieoperatorowymi jest dostępne tylko dla administratora, nawet dla własnego urządzenia wywołującego.
- `device.token.rotate` i `device.token.revoke` sprawdzają także docelowy zestaw zakresów
  tokena operatora względem bieżących zakresów sesji wywołującego. Wywołujący bez uprawnień administratora
  nie mogą rotować ani unieważniać szerszego tokena operatora niż ten, który już posiadają.
- Błędy uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z tokenem dla danego urządzenia z pamięci podręcznej.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać wskazówki działań operatora.
- `AUTH_SCOPE_MISMATCH` oznacza, że token urządzenia został rozpoznany, ale nie obejmuje
  żądanej roli/zakresów. Klienci nie powinni przedstawiać tego jako błędnego tokena;
  poproś operatora o ponowne sparowanie albo zatwierdzenie węższego/szerszego kontraktu zakresów.

## Tożsamość urządzenia + parowanie

- Node powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  odcisku palca pary kluczy.
- Gateway wystawia tokeny dla urządzenia + roli.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączono
  lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania koncentruje się na bezpośrednich połączeniach local loopback.
- OpenClaw ma również wąską ścieżkę samopołączenia lokalną dla backendu/kontenera dla
  zaufanych przepływów pomocniczych ze wspólnym sekretem.
- Połączenia z tego samego hosta przez tailnet albo LAN nadal są traktowane jako zdalne na potrzeby parowania i
  wymagają zatwierdzenia.
- Klienci WS zwykle zawierają tożsamość `device` podczas `connect` (operator +
  Node). Jedynymi wyjątkami operatora bez urządzenia są jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niezabezpieczonym HTTP tylko na localhost.
  - pomyślne uwierzytelnienie operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tryb awaryjny, poważne obniżenie bezpieczeństwa).
  - bezpośrednie RPC backendu `gateway-client` przez direct-loopback na zarezerwowanej wewnętrznej
    ścieżce pomocniczej.
- Pominięcie tożsamości urządzenia ma konsekwencje dla zakresów. Gdy połączenie operatora
  bez urządzenia jest dopuszczone przez jawną ścieżkę zaufania, OpenClaw nadal czyści
  samodzielnie zadeklarowane zakresy do pustego zestawu, chyba że ta ścieżka ma nazwany
  wyjątek zachowywania zakresów. Metody bramkowane zakresem wtedy kończą się błędem
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` to ścieżka zachowywania zakresów Control UI
  w trybie awaryjnym. Nie przyznaje zakresów dowolnym
  niestandardowym klientom WebSocket w kształcie backendu albo CLI.
- Zarezerwowana bezpośrednia ścieżka pomocnicza backendu `gateway-client` przez direct-loopback zachowuje
  zakresy tylko dla wewnętrznych lokalnych RPC płaszczyzny sterowania; niestandardowe identyfikatory backendu nie
  otrzymują tego wyjątku.
- Wszystkie połączenia muszą podpisać nonce `connect.challenge` dostarczony przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed wyzwania, `connect` teraz zwraca
kody szczegółów `DEVICE_AUTH_*` pod `error.details.code` ze stabilnym `error.details.reason`.

Typowe błędy migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (albo wysłał puste). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał nieaktualnym/błędnym nonce.        |
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
- Starsze podpisy `v2` pozostają akceptowane dla zgodności, ale przypinanie metadanych
  sparowanego urządzenia nadal kontroluje politykę poleceń przy ponownym połączeniu.

## TLS + przypinanie

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk palca certyfikatu Gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` albo CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API Gateway** (status, kanały, modele, czat,
agent, sesje, Node, zatwierdzenia itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `packages/gateway-protocol/src/schema.ts`.

## Powiązane

- [Protokół Bridge](/pl/gateway/bridge-protocol)
- [Runbook Gateway](/pl/gateway)
