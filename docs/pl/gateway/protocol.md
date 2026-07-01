---
read_when:
    - Implementowanie lub aktualizowanie klientów WS Gateway
    - Debugowanie niezgodności protokołu lub błędów połączenia
    - Regenerowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-07-01T08:34:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

Protokół WS Gateway jest **pojedynczą płaszczyzną sterowania + transportem węzłów** dla
OpenClaw. Wszyscy klienci (CLI, webowy interfejs użytkownika, aplikacja macOS, węzły iOS/Android, węzły bez interfejsu)
łączą się przez WebSocket i deklarują swoją **rolę** + **zakres** podczas
uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po udanym uzgodnieniu połączenia klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Przy włączonej diagnostyce
  zbyt duże ramki przychodzące i wolne bufory wychodzące emitują zdarzenia `payload.large`,
  zanim gateway zamknie lub odrzuci daną ramkę. Te zdarzenia zachowują
  rozmiary, limity, powierzchnie i bezpieczne kody powodów. Nie zachowują treści wiadomości,
  zawartości załączników, surowej treści ramki, tokenów, plików cookie ani wartości tajnych.

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
`"startup-sidecars"` oraz `retryAfterMs`. Klienci powinni ponowić taką odpowiedź
w ramach swojego całkowitego budżetu połączenia, zamiast prezentować ją jako końcową
awarię uzgadniania połączenia.

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` również jest wymagane i zgłasza
wynegocjowaną rolę oraz zakresy. `pluginSurfaceUrls` jest opcjonalne i mapuje nazwy
powierzchni Plugin, takie jak `canvas`, na zakresowane hostowane adresy URL.

Zakresowane adresy URL powierzchni Plugin mogą wygasać. Węzły mogą wywołać
`node.pluginSurface.refresh` z `{ "surface": "canvas" }`, aby otrzymać świeży
wpis w `pluginSurfaceUrls`. Eksperymentalny refaktor Plugin Canvas nie
obsługuje przestarzałej ścieżki zgodności `canvasHostUrl`, `canvasCapability` ani
`node.canvas.capability.refresh`; obecni klienci natywni i gatewaye muszą używać powierzchni Plugin.

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

Zaufani klienci backendowi w tym samym procesie (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogą pominąć `device` przy bezpośrednich połączeniach loopback,
gdy uwierzytelniają się współdzielonym tokenem/hasłem gatewaya. Ta ścieżka jest zarezerwowana
dla wewnętrznych RPC płaszczyzny sterowania i zapobiega blokowaniu lokalnej pracy backendu,
takiej jak aktualizacje sesji subagentów, przez nieaktualne bazowe parowania CLI/urządzeń. Klienci zdalni,
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
połączenie z bazowym kodem konfiguracji zwraca główny token węzła oraz jeden ograniczony
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
mobilną pętlę operatora bez nadawania `operator.admin` ani `operator.pairing`.
Obejmuje `operator.talk.secrets`, aby klient natywny mógł odczytać konfigurację Talk,
której potrzebuje po bootstrapie. Szersze zakresy administratora i parowania wymagają
osobnego zatwierdzonego parowania operatora lub przepływu tokenu. Klienci powinni utrwalać
`hello-ok.auth.deviceTokens` tylko
wtedy, gdy połączenie używało uwierzytelnienia bootstrapu na zaufanym transporcie, takim jak `wss://` albo
parowanie loopback/lokalne.

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

Pełny model zakresów operatora, kontrole podczas zatwierdzania i semantykę
współdzielonych sekretów opisuje [Zakresy operatora](/pl/gateway/operator-scopes).

### Role

- `operator` = klient płaszczyzny sterowania (CLI/interfejs użytkownika/automatyzacja).
- `node` = host możliwości (kamera/ekran/canvas/system.run).

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

Metody RPC gatewaya rejestrowane przez Plugin mogą żądać własnego zakresu operatora, ale
zarezerwowane prefiksy administracyjne rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze rozstrzygają się do `operator.admin`.

Zakres metody to tylko pierwsza bramka. Niektóre polecenia ukośnikowe osiągane przez
`chat.send` nakładają na to bardziej rygorystyczne kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma również dodatkową kontrolę zakresu podczas zatwierdzania oprócz
bazowego zakresu metody:

- żądania bez polecenia: `operator.pairing`
- żądania z poleceniami węzła innymi niż exec: `operator.pairing` + `operator.write`
- żądania zawierające `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Możliwości/polecenia/uprawnienia (węzeł)

Węzły deklarują roszczenia możliwości w czasie połączenia:

- `caps`: wysokopoziomowe kategorie możliwości, takie jak `camera`, `canvas`, `screen`,
  `location`, `voice` i `talk`.
- `commands`: allowlista poleceń dla wywołania.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i wymusza allowlisty po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy indeksowane tożsamością urządzenia.
- Wpisy obecności zawierają `deviceId`, `roles` i `scopes`, aby interfejsy użytkownika mogły pokazywać jeden wiersz na urządzenie,
  nawet gdy łączy się ono zarówno jako **operator**, jak i **węzeł**.
- `node.list` zawiera opcjonalne pola `lastSeenAtMs` i `lastSeenReason`. Połączone węzły zgłaszają
  swój bieżący czas połączenia jako `lastSeenAtMs` z powodem `connect`; sparowane węzły mogą również zgłaszać
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
`significant_location`, `manual` lub `connect`. Nieznane ciągi wyzwalacza są normalizowane do
`background` przez gateway przed utrwaleniem. Zdarzenie jest trwałe tylko dla uwierzytelnionych sesji urządzeń
węzłów; sesje bez urządzenia lub niesparowane zwracają `handled: false`.

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

## Zakresowanie zdarzeń rozgłaszania

Zdarzenia rozgłaszania WebSocket wypychane przez serwer są bramkowane zakresem, aby sesje ograniczone do parowania lub tylko węzłów nie odbierały pasywnie treści sesji.

- **Ramki czatu, agentów i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Rozgłoszenia `plugin.*` zdefiniowane przez Plugin** są bramkowane do `operator.write` lub `operator.admin`, zależnie od tego, jak Plugin je zarejestrował.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia połączenia/rozłączenia itd.) pozostają nieograniczone, aby stan transportu był obserwowalny dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń rozgłaszania** są domyślnie bramkowane zakresem (fail-closed), chyba że zarejestrowany handler jawnie je rozluźnia.

Każde połączenie klienta zachowuje własny numer sekwencji per klient, aby rozgłoszenia zachowywały monotoniczny porządek na tym gnieździe, nawet gdy różni klienci widzą różne, przefiltrowane zakresem podzbiory strumienia zdarzeń.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż powyższe przykłady uzgadniania połączenia/uwierzytelniania. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` jest konserwatywną
listą odkrywania zbudowaną z `src/gateway/server-methods-list.ts` oraz załadowanych
eksportów metod Plugin/kanału. Traktuj ją jako odkrywanie funkcji, a nie pełne
wyliczenie `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System i tożsamość">
    - `health` zwraca buforowaną lub świeżo sprawdzoną migawkę stanu Gateway.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestrator stabilności diagnostycznej. Przechowuje metadane operacyjne, takie jak nazwy zdarzeń, liczby, rozmiary w bajtach, odczyty pamięci, stan kolejek/sesji, nazwy kanałów/Pluginów oraz identyfikatory sesji. Nie przechowuje tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, plików cookie ani wartości tajnych. Wymagany jest zakres odczytu operatora.
    - `status` zwraca podsumowanie Gateway w stylu `/status`; pola wrażliwe są dołączane tylko dla klientów operatora z zakresem administratora.
    - `gateway.identity.get` zwraca tożsamość urządzenia Gateway używaną przez przepływy przekazywania i parowania.
    - `system-presence` zwraca bieżącą migawkę obecności dla połączonych urządzeń operatora/węzła.
    - `system-event` dodaje zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
    - `last-heartbeat` zwraca najnowsze utrwalone zdarzenie heartbeat.
    - `set-heartbeats` przełącza przetwarzanie heartbeatów w Gateway.

  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolonych w środowisku uruchomieniowym. Przekaż `{ "view": "configured" }` dla skonfigurowanych modeli o rozmiarze selektora (`agents.defaults.models` najpierw, potem `models.providers.*.models`) albo `{ "view": "all" }` dla pełnego katalogu.
    - `usage.status` zwraca okna użycia dostawcy / podsumowania pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
      Przekaż `agentId` dla jednego agenta albo `agentScope: "all"`, aby zagregować skonfigurowanych agentów.
    - `doctor.memory.status` zwraca gotowość pamięci wektorowej / buforowanych embeddingów dla aktywnego obszaru roboczego domyślnego agenta. Przekaż `{ "probe": true }` albo `{ "deep": true }` tylko wtedy, gdy wywołujący wyraźnie chce aktywnego pingowania dostawcy embeddingów. Klienci świadomi Dreaming mogą też przekazać `{ "agentId": "agent-id" }`, aby ograniczyć statystyki magazynu Dreaming do wybranego obszaru roboczego agenta; pominięcie `agentId` zachowuje ścieżkę awaryjną domyślnego agenta i agreguje skonfigurowane obszary robocze Dreaming.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` oraz `doctor.memory.dedupeDreamDiary` akceptują opcjonalne parametry `{ "agentId": "agent-id" }` dla widoków/akcji Dreaming wybranego agenta. Gdy `agentId` zostanie pominięte, działają na skonfigurowanym obszarze roboczym domyślnego agenta.
    - `doctor.memory.remHarness` zwraca ograniczony, tylko do odczytu podgląd środowiska REM harness dla zdalnych klientów płaszczyzny sterowania. Może zawierać ścieżki obszarów roboczych, fragmenty pamięci, wyrenderowany ugruntowany Markdown i kandydatów do głębokiej promocji, więc wywołujący potrzebują `operator.read`.
    - `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji. Przekaż `agentId` dla jednego
      agenta albo `agentScope: "all"`, aby wyświetlić razem skonfigurowanych agentów.
    - `sessions.usage.timeseries` zwraca użycie w szeregach czasowych dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Kanały i pomocniki logowania">
    - `channels.status` zwraca podsumowania stanu wbudowanych i dołączonych kanałów/Pluginów.
    - `channels.logout` wylogowuje określony kanał/konto, jeśli kanał obsługuje wylogowanie.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na ukończenie tego przepływu logowania QR/web i po powodzeniu uruchamia kanał.
    - `push.test` wysyła testowe powiadomienie push APNs do zarejestrowanego węzła iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słowa wybudzającego.
    - `voicewake.set` aktualizuje wyzwalacze słowa wybudzającego i rozgłasza zmianę.

  </Accordion>

  <Accordion title="Wiadomości i logi">
    - `send` to bezpośrednie RPC dostarczania wychodzącego dla wysyłek kierowanych do kanału/konta/wątku poza mechanizmem uruchamiania czatu.
    - `logs.tail` zwraca skonfigurowany końcowy fragment pliku logu gatewaya z kursorem/limitem oraz kontrolą maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Talk i TTS">
    - `talk.catalog` zwraca tylko do odczytu katalog dostawców Talk dla mowy, transkrypcji strumieniowej i głosu w czasie rzeczywistym. Obejmuje identyfikatory dostawców, etykiety, stan konfiguracji, ujawnione identyfikatory modeli/głosów, tryby kanoniczne, transporty, strategie mózgu oraz flagi dźwięku/możliwości czasu rzeczywistego bez zwracania sekretów dostawców ani modyfikowania konfiguracji globalnej.
    - `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (lub `operator.admin`).
    - `talk.session.create` tworzy sesję Talk należącą do Gateway dla `realtime/gateway-relay`, `transcription/gateway-relay` lub `stt-tts/managed-room`. W przypadku `stt-tts/managed-room` wywołujący `operator.write`, którzy przekazują `sessionKey`, muszą także przekazać `spawnedBy` na potrzeby zakresowej widoczności klucza sesji; tworzenie niezakresowego `sessionKey` oraz `brain: "direct-tools"` wymagają `operator.admin`.
    - `talk.session.join` weryfikuje token sesji pokoju zarządzanego, emituje zdarzenia `session.ready` lub `session.replaced` zgodnie z potrzebą i zwraca metadane pokoju/sesji oraz ostatnie zdarzenia Talk bez tokenu w postaci jawnego tekstu ani zapisanego skrótu tokenu.
    - `talk.session.appendAudio` dołącza wejściowy dźwięk PCM w base64 do należących do Gateway sesji przekaźnika czasu rzeczywistego i transkrypcji.
    - `talk.session.startTurn`, `talk.session.endTurn` i `talk.session.cancelTurn` sterują cyklem życia tury w pokoju zarządzanym, odrzucając przestarzałe tury przed wyczyszczeniem stanu.
    - `talk.session.cancelOutput` zatrzymuje wyjściowy dźwięk asystenta, głównie na potrzeby przerwania wypowiedzi bramkowanego przez VAD w sesjach przekaźnika Gateway.
    - `talk.session.submitToolResult` kończy wywołanie narzędzia dostawcy wyemitowane przez należącą do Gateway sesję przekaźnika czasu rzeczywistego. Przekaż `options: { willContinue: true }` dla tymczasowego wyjścia narzędzia, gdy wynik końcowy pojawi się później, albo `options: { suppressResponse: true }`, gdy wynik narzędzia powinien zaspokoić wywołanie dostawcy bez rozpoczynania kolejnej odpowiedzi asystenta w czasie rzeczywistym.
    - `talk.session.steer` wysyła sterowanie głosowe aktywnego uruchomienia do należącej do Gateway sesji Talk wspieranej przez agenta. Akceptuje `{ sessionId, text, mode? }`, gdzie `mode` to `status`, `steer`, `cancel` lub `followup`; pominięty tryb jest klasyfikowany na podstawie wypowiedzianego tekstu.
    - `talk.session.close` zamyka należącą do Gateway sesję przekaźnika, transkrypcji lub pokoju zarządzanego i emituje końcowe zdarzenia Talk.
    - `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów WebChat/Control UI.
    - `talk.client.create` tworzy należącą do klienta sesję dostawcy czasu rzeczywistego przy użyciu `webrtc` lub `provider-websocket`, podczas gdy Gateway odpowiada za konfigurację, poświadczenia, instrukcje i politykę narzędzi.
    - `talk.client.toolCall` pozwala należącym do klienta transportom czasu rzeczywistego przekazywać wywołania narzędzi dostawcy do polityki Gateway. Pierwszym obsługiwanym narzędziem jest `openclaw_agent_consult`; klienci otrzymują identyfikator uruchomienia i czekają na zwykłe zdarzenia cyklu życia czatu przed przesłaniem specyficznego dla dostawcy wyniku narzędzia.
    - `talk.client.steer` wysyła sterowanie głosowe aktywnego uruchomienia dla należących do klienta transportów czasu rzeczywistego. Gateway rozwiązuje aktywne osadzone uruchomienie z `sessionKey` i zwraca ustrukturyzowany wynik zaakceptowania/odrzucenia zamiast po cichu odrzucać sterowanie.
    - `talk.event` to pojedynczy kanał zdarzeń Talk dla adapterów czasu rzeczywistego, transkrypcji, STT/TTS, pokojów zarządzanych, telefonii i spotkań.
    - `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców awaryjnych i stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny spis dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRefs i podmienia stan sekretów środowiska uruchomieniowego tylko po pełnym powodzeniu.
    - `secrets.resolve` rozwiązuje przypisania sekretów kierowanych do polecenia dla konkretnego zestawu poleceń/celów.
    - `config.get` zwraca bieżący zrzut konfiguracji i skrót.
    - `config.set` zapisuje zweryfikowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji. Destrukcyjne zastąpienie tablicy wymaga ścieżki, której to dotyczy, w `replacePaths`; zagnieżdżone tablice pod wpisami tablic używają ścieżek `[]`, takich jak `agents.list[].skills`.
    - `config.apply` weryfikuje i zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca bieżący ładunek schematu konfiguracji używany przez Control UI i narzędzia CLI: schemat, `uiHints`, wersję i metadane generowania, w tym metadane schematu pluginów i kanałów, gdy środowisko uruchomieniowe może je załadować. Schemat zawiera metadane pól `title` / `description` pochodzące z tych samych etykiet i tekstu pomocy, których używa UI, w tym gałęzie zagnieżdżonych obiektów, symboli wieloznacznych, elementów tablic oraz kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pól.
    - `config.schema.lookup` zwraca ładunek wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę i `hintPath`, opcjonalne `reloadKind` oraz bezpośrednie podsumowania elementów podrzędnych do zagłębiania w UI/CLI. `reloadKind` to jedno z `restart`, `hot` lub `none` i odzwierciedla planer przeładowania konfiguracji Gateway dla żądanej ścieżki. Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika i typowe pola walidacji (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia liczbowe/łańcuchów/tablic/obiektów oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania elementów podrzędnych ujawniają `key`, znormalizowaną `path`, `type`, `required`, `hasChildren`, opcjonalne `reloadKind` oraz dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji gatewaya i planuje restart tylko wtedy, gdy sama aktualizacja się powiodła; wywołujący z sesją mogą dołączyć `continuationMessage`, aby uruchamianie wznowiło jedną dodatkową turę agenta przez kolejkę kontynuacji restartu. Aktualizacje menedżera pakietów i nadzorowane aktualizacje checkoutu git z płaszczyzny sterowania używają odłączonego przekazania do usługi zarządzanej zamiast zastępować drzewo pakietu lub modyfikować wyjście checkoutu/kompilacji wewnątrz działającego Gateway. Rozpoczęte przekazanie zwraca `ok: true` z `result.reason: "managed-service-handoff-started"` i `handoff.status: "started"`; niedostępne lub nieudane przekazania zwracają `ok: false` z `managed-service-handoff-unavailable` lub `managed-service-handoff-failed`, oraz `handoff.command`, gdy wymagana jest ręczna aktualizacja w powłoce. Niedostępne przekazanie oznacza, że OpenClaw nie ma bezpiecznej granicy nadzorcy ani trwałej tożsamości usługi, takiej jak `OPENCLAW_SYSTEMD_UNIT` dla systemd. Podczas rozpoczętego przekazania znacznik restartu może krótko zgłaszać `stats.reason: "restart-health-pending"`; kontynuacja jest opóźniona, dopóki CLI nie zweryfikuje zrestartowanego Gateway i nie zapisze końcowego znacznika `ok`.
    - `update.status` odświeża i zwraca najnowszy znacznik restartu aktualizacji, w tym wersję działającą po restarcie, gdy jest dostępna.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator onboardingu przez WS RPC.

  </Accordion>

  <Accordion title="Pomocnicze metody agentów i obszarów roboczych">
    - `agents.list` zwraca skonfigurowane wpisy agentów, w tym efektywny model i metadane środowiska uruchomieniowego.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów i powiązaniami obszaru roboczego.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami rozruchowymi obszaru roboczego udostępnianymi agentowi.
    - `tasks.list`, `tasks.get` i `tasks.cancel` udostępniają rejestr zadań Gateway klientom SDK i operatora.
    - `artifacts.list`, `artifacts.get` i `artifacts.download` udostępniają podsumowania artefaktów wyprowadzonych z transkryptu oraz pobieranie dla jawnego zakresu `sessionKey`, `runId` lub `taskId`. Zapytania o uruchomienia i zadania rozwiązują sesję właściciela po stronie serwera i zwracają tylko media transkryptu o zgodnym pochodzeniu; niebezpieczne lub lokalne źródła URL zwracają nieobsługiwane pobrania zamiast pobierania po stronie serwera.
    - `environments.list` i `environments.status` udostępniają klientom SDK tylko do odczytu wykrywanie środowisk lokalnych dla Gateway i środowisk Node.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcową migawkę, gdy jest dostępna.

  </Accordion>

  <Accordion title="Kontrola sesji">
    - `sessions.list` zwraca bieżący indeks sesji, w tym metadane `agentRuntime` dla każdego wiersza, gdy skonfigurowany jest backend środowiska uruchomieniowego agenta.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkryptu/wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkryptu dla określonych kluczy sesji.
    - `sessions.describe` zwraca jeden wiersz sesji Gateway dla dokładnego klucza sesji.
    - `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant przerwania i pokierowania dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji. Wywołujący może przekazać `key` oraz opcjonalne `runId` albo przekazać samo `runId` dla aktywnych uruchomień, które Gateway może rozwiązać do sesji.
    - `sessions.patch` aktualizuje metadane/nadpisania sesji i raportuje rozwiązany model kanoniczny oraz efektywne `agentRuntime`.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest normalizowane do wyświetlania dla klientów UI: wbudowane tagi dyrektyw są usuwane z widocznego tekstu, zwykłotekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi) i ujawnione tokeny sterujące modelu ASCII/pełnej szerokości są usuwane, czyste wiersze asystenta z cichymi tokenami, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a zbyt duże wiersze mogą zostać zastąpione symbolami zastępczymi.
    - `chat.message.get` to addytywny, ograniczony czytnik pełnej wiadomości dla pojedynczego widocznego wpisu transkryptu. Klienci przekazują `sessionKey`, opcjonalne `agentId`, gdy wybór sesji jest ograniczony do agenta, oraz `messageId` transkryptu wcześniej ujawniony przez `chat.history`, a Gateway zwraca tę samą projekcję znormalizowaną do wyświetlania bez lekkiego limitu obcięcia historii, gdy zapisany wpis jest nadal dostępny i nie jest zbyt duży.
    - `chat.send` akceptuje jednorazowe `fastMode: "auto"`, aby użyć trybu szybkiego dla wywołań modelu rozpoczętych przed automatycznym progiem odcięcia, a następnie uruchamiać późniejsze ponowienia, wywołania awaryjne, wyniki narzędzi lub kontynuacje bez trybu szybkiego. Próg odcięcia domyślnie wynosi 60 sekund i można go skonfigurować dla każdego modelu przez `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Wywołujący `chat.send` może przekazać jednorazowe `fastAutoOnSeconds`, aby nadpisać próg odcięcia dla tego żądania.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.

  </Accordion>

  <Accordion title="Parowanie Node, wywołania i oczekująca praca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` i `node.pair.verify` obejmują parowanie Node oraz weryfikację rozruchową.
    - `node.list` i `node.describe` zwracają znany/połączony stan Node.
    - `node.rename` aktualizuje etykietę sparowanego Node.
    - `node.invoke` przekazuje polecenie do połączonego Node.
    - `node.invoke.result` zwraca wynik żądania wywołania.
    - `node.event` przenosi zdarzenia pochodzące z Node z powrotem do Gateway.
    - `node.pending.pull` i `node.pending.ack` to API kolejki połączonego Node.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą dla Node offline/rozłączonych.

  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia exec oraz wyszukiwanie/odtwarzanie oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie exec i zwraca ostateczną decyzję (lub `null` przy przekroczeniu limitu czasu).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają migawkami zasad zatwierdzania exec w Gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną dla Node zasadą zatwierdzania exec przez polecenia przekaźnika Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują przepływy zatwierdzania zdefiniowane przez plugin.

  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe lub przy następnym Heartbeat wstrzyknięcie tekstu wybudzenia; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - `cron.run` pozostaje RPC w stylu kolejkowania dla ręcznych uruchomień. Klienci potrzebujący semantyki ukończenia powinni odczytać zwrócone `runId` i odpytywać `cron.runs`.
    - `cron.runs` akceptuje opcjonalny niepusty filtr `runId`, aby klienci mogli śledzić jedno zakolejkowane ręczne uruchomienie bez wyścigu z innymi wpisami historii dla tego samego zadania.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject` i inne zdarzenia czatu dotyczące tylko transkryptu. W protokole v4 ładunki różnicowe przenoszą `deltaText`; `message` pozostaje skumulowaną migawką asystenta. Zastąpienia bez prefiksu ustawiają `replace=true` i używają `deltaText` jako tekstu zastępczego.
- `session.message`, `session.operation` i `session.tool`: aktualizacje transkryptu, trwającej operacji sesji i strumienia zdarzeń dla subskrybowanej sesji.
- `sessions.changed`: zmienił się indeks sesji lub metadane.
- `presence`: aktualizacje migawki obecności systemu.
- `tick`: okresowe zdarzenie podtrzymania połączenia / żywotności.
- `health`: aktualizacja migawki kondycji Gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania Cron.
- `shutdown`: powiadomienie o zamknięciu Gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania Node.
- `node.invoke.request`: rozgłoszenie żądania wywołania Node.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniono konfigurację wyzwalacza słowa wybudzającego.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia zatwierdzania exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzania plugin.

### Metody pomocnicze Node

- Node mogą wywołać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych umiejętności do kontroli automatycznego zezwalania.

### RPC rejestru zadań

Klienci operatora mogą sprawdzać i anulować rekordy zadań w tle Gateway przez RPC rejestru zadań. Te metody zwracają oczyszczone podsumowania zadań, a nie surowy stan środowiska uruchomieniowego.

- `tasks.list` wymaga `operator.read`.
  - Parametry: opcjonalny `status` (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` lub `"timed_out"`) albo tablica tych statusów, opcjonalny `agentId`, opcjonalny `sessionKey`, opcjonalny `limit` od `1` do `500` oraz opcjonalny ciąg `cursor`.
  - Wynik: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` wymaga `operator.read`.
  - Parametry: `{ "taskId": string }`.
  - Wynik: `{ "task": TaskSummary }`.
  - Brakujące identyfikatory zadań zwracają kształt błędu nieznalezienia Gateway.
- `tasks.cancel` wymaga `operator.write`.
  - Parametry: `{ "taskId": string, "reason"?: string }`.
  - Wynik:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` raportuje, czy rejestr miał pasujące zadanie. `cancelled` raportuje, czy środowisko uruchomieniowe zaakceptowało lub odnotowało anulowanie.

`TaskSummary` zawiera `id`, `status` i opcjonalne metadane, takie jak `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, znaczniki czasu, postęp, podsumowanie końcowe oraz oczyszczony tekst błędu. `agentId` identyfikuje agenta wykonującego zadanie; `sessionKey` i `ownerKey` zachowują kontekst żądającego i kontroli.

### Metody pomocnicze operatora

- Operatorzy mogą wywołać `commands.list` (`operator.read`), aby pobrać inwentarz poleceń środowiska uruchomieniowego dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, do której powierzchni odnosi się podstawowa wartość `name`:
    - `text` zwraca podstawowy tekstowy token polecenia bez początkowego `/`
    - `native` oraz domyślna ścieżka `both` zwracają nazwy natywne uwzględniające dostawcę, gdy są dostępne
  - `textAliases` przenosi dokładne aliasy z ukośnikiem, takie jak `/model` i `/m`.
  - `nativeName` przenosi nazwę natywnego polecenia uwzględniającą dostawcę, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na nazewnictwo natywne oraz dostępność natywnych poleceń pluginów.
  - `includeArgs=false` pomija zserializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywołać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi środowiska uruchomieniowego dla agenta. Odpowiedź obejmuje pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` albo `plugin`
  - `pluginId`: właściciel pluginu, gdy `source="plugin"`
  - `optional`: czy narzędzie pluginu jest opcjonalne
- Operatorzy mogą wywołać `tools.effective` (`operator.read`), aby pobrać efektywny w środowisku uruchomieniowym inwentarz narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst środowiska uruchomieniowego z sesji po stronie serwera, zamiast akceptować kontekst uwierzytelniania lub dostarczania podany przez wywołującego.
  - Odpowiedź jest projekcją aktywnego inwentarza wyprowadzoną przez serwer i ograniczoną do sesji, obejmującą narzędzia core, pluginów, kanałów oraz już wykrytych serwerów MCP.
  - `tools.effective` jest tylko do odczytu dla MCP: może przepuścić katalog MCP ciepłej sesji przez końcową politykę narzędzi, ale nie tworzy środowisk uruchomieniowych MCP, nie łączy transportów ani nie wysyła `tools/list`. Jeśli nie istnieje pasujący ciepły katalog, odpowiedź może zawierać powiadomienie, takie jak `mcp-not-yet-connected`, `mcp-not-yet-listed` albo `mcp-stale-catalog`.
  - Efektywne wpisy narzędzi używają `source="core"`, `source="plugin"`, `source="channel"` albo `source="mcp"`.
- Operatorzy mogą wywołać `tools.invoke` (`operator.write`), aby wywołać jedno dostępne narzędzie przez tę samą ścieżkę polityki Gateway co `/tools/invoke`.
  - `name` jest wymagane. `args`, `sessionKey`, `agentId`, `confirm` i `idempotencyKey` są opcjonalne.
  - Jeśli obecne są zarówno `sessionKey`, jak i `agentId`, rozwiązany agent sesji musi pasować do `agentId`.
  - Core wrappers tylko dla właściciela, takie jak `cron`, `gateway` i `nodes`, wymagają tożsamości właściciela/administratora (`operator.admin`), mimo że sama metoda `tools.invoke` ma `operator.write`.
  - Odpowiedź jest kopertą dla SDK z polami `ok`, `toolName`, opcjonalnym `output` oraz typowanymi polami `error`. Odmowy zatwierdzenia lub polityki zwracają `ok:false` w ładunku, zamiast omijać potok polityki narzędzi Gateway.
- Operatorzy mogą wywołać `skills.status` (`operator.read`), aby pobrać widoczny inwentarz umiejętności dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź obejmuje kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywołać `skills.search` i `skills.detail` (`operator.read`) dla metadanych odkrywania ClawHub.
- Operatorzy mogą wywołać `skills.upload.begin`, `skills.upload.chunk` i `skills.upload.commit` (`operator.admin`), aby przygotować prywatne archiwum umiejętności przed jego instalacją. Jest to osobna ścieżka przesyłania administracyjnego dla zaufanych klientów, a nie zwykły przepływ instalacji umiejętności ClawHub, i jest domyślnie wyłączona, chyba że włączono `skills.install.allowUploadedArchives`.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    tworzy przesyłanie powiązane z tym slugiem i wartością wymuszenia.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` dołącza bajty dokładnie pod zdekodowanym przesunięciem.
  - `skills.upload.commit({ uploadId, sha256? })` weryfikuje końcowy rozmiar i SHA-256. Commit tylko finalizuje przesyłanie; nie instaluje umiejętności.
  - Przesłane archiwa umiejętności to archiwa zip zawierające katalog główny `SKILL.md`. Wewnętrzna nazwa katalogu w archiwum nigdy nie wybiera celu instalacji.
- Operatorzy mogą wywołać `skills.install` (`operator.admin`) w trzech trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje folder umiejętności w katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb przesyłania: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instaluje zatwierdzone przesyłanie w katalogu `skills/<slug>` domyślnego obszaru roboczego agenta. Slug i wartość wymuszenia muszą pasować do pierwotnego żądania `skills.upload.begin`. Ten tryb jest odrzucany, chyba że włączono `skills.install.allowUploadedArchives`. Ustawienie nie wpływa na instalacje ClawHub.
  - Tryb instalatora Gateway: `{ name, installId, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście Gateway. Starsi klienci mogą nadal wysyłać `dangerouslyForceUnsafeInstall`; to pole jest przestarzałe, akceptowane tylko dla zgodności protokołu i ignorowane. Używaj `security.installPolicy` do decyzji instalacyjnych należących do operatora.
- Operatorzy mogą wywołać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug albo wszystkie śledzone instalacje ClawHub w domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji łata wartości `skills.entries.<skillKey>`, takie jak `enabled`, `apiKey` i `env`.

### Widoki `models.list`

`models.list` akceptuje opcjonalny parametr `view`:

- Pominięte albo `"default"`: bieżące zachowanie środowiska uruchomieniowego. Jeśli skonfigurowano `agents.defaults.models`, odpowiedzią jest dozwolony katalog, w tym dynamicznie wykryte modele dla wpisów `provider/*`. W przeciwnym razie odpowiedzią jest pełny katalog Gateway.
- `"configured"`: zachowanie o rozmiarze odpowiednim dla selektora. Jeśli skonfigurowano `agents.defaults.models`, nadal ma pierwszeństwo, w tym odkrywanie ograniczone do dostawcy dla wpisów `provider/*`. Bez listy dozwolonych odpowiedź używa jawnych wpisów `models.providers.*.models`, cofając się do pełnego katalogu tylko wtedy, gdy nie istnieją skonfigurowane wiersze modeli.
- `"all"`: pełny katalog Gateway, z pominięciem `agents.defaults.models`. Używaj tego do diagnostyki i interfejsów odkrywania, nie do zwykłych selektorów modeli.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, Gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozwiązują je, wywołując `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node`, `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane wywołania `node.invoke system.run` ponownie używają tego kanonicznego `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` albo `sessionKey` między przygotowaniem a końcowym zatwierdzonym przekazaniem `system.run`, Gateway odrzuca uruchomienie zamiast ufać zmienionemu ładunkowi.

## Fallback dostarczania agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczania wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe działanie: nierozwiązane albo tylko wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na fallback do wykonania tylko w sesji, gdy nie da się rozwiązać żadnej zewnętrznej dostarczalnej trasy (na przykład sesje wewnętrzne/webchat albo niejednoznaczne konfiguracje wielokanałowe).
- Końcowe wyniki `agent` mogą zawierać `result.deliveryStatus`, gdy zażądano dostarczania, używając tych samych statusów `sent`, `suppressed`, `partial_failed` i `failed`, które udokumentowano dla [`openclaw agent --json --deliver`](/pl/cli/agent#json-delivery-status).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `packages/gateway-protocol/src/version.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca zakresy, które nie obejmują jego bieżącego protokołu. Bieżący klienci i serwery wymagają protokołu v4.
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
| Limit czasu preauth / connect-challenge   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env może podnieść sparowany budżet serwera/klienta) |
| Początkowe opóźnienie reconnect backoff   | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksymalne opóźnienie reconnect backoff   | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Ograniczenie fast-retry po zamknięciu device-token | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Okres karencji force-stop przed `terminate()` | `250` ms                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Domyślny limit czasu `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Domyślny interwał tick (przed `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Zamknięcie tick-timeout                   | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Serwer ogłasza efektywne `policy.tickIntervalMs`, `policy.maxPayload` i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości zamiast wartości domyślnych sprzed handshake.

## Uwierzytelnianie

- Uwierzytelnianie Gateway za pomocą wspólnego sekretu używa `connect.params.auth.token` albo
  `connect.params.auth.password`, w zależności od skonfigurowanego trybu uwierzytelniania.
- Tryby przenoszące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) albo nieloopbackowe
  `gateway.auth.mode: "trusted-proxy"`, spełniają sprawdzenie uwierzytelniania połączenia na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatny ingress `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie połączenia
  wspólnym sekretem; nie wystawiaj tego trybu na publiczny/niezaufany ingress.
- Po sparowaniu Gateway wydaje **token urządzenia** ograniczony do roli połączenia
  i zakresów. Jest zwracany w `hello-ok.auth.deviceToken` i powinien być
  utrwalony przez klienta na potrzeby przyszłych połączeń.
- Klienci powinni utrwalać główny `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne łączenie z tym **zapisanym** tokenem urządzenia powinno również ponownie używać zapisanego
  zatwierdzonego zestawu zakresów dla tego tokena. Zachowuje to dostęp do odczytu/sondowania/statusu,
  który został już przyznany, i pozwala uniknąć cichego zawężenia ponownych połączeń do
  węższego, niejawnego zakresu tylko dla administratora.
- Składanie uwierzytelniania połączenia po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest ortogonalne i zawsze jest przekazywane, gdy jest ustawione.
  - `auth.token` jest uzupełniane w kolejności priorytetu: najpierw jawny wspólny token,
    potem jawny `deviceToken`, a następnie zapisany token dla danego urządzenia (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żaden z powyższych elementów nie rozwiązał
    `auth.token`. Wspólny token albo dowolny rozpoznany token urządzenia go wyłącza.
  - Automatyczne promowanie zapisanego tokena urządzenia przy jednorazowej
    ponownej próbie `AUTH_TOKEN_MISMATCH` jest ograniczone do **zaufanych endpointów** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez przypięcia się nie kwalifikuje.
- Wbudowany bootstrap z kodem konfiguracji zwraca główny token węzła
  `hello-ok.auth.deviceToken` oraz ograniczony token operatora w
  `hello-ok.auth.deviceTokens` na potrzeby zaufanego przekazania mobilnego. Token operatora
  zawiera `operator.talk.secrets` do odczytów natywnej konfiguracji Talk i
  wyklucza `operator.admin` oraz `operator.pairing`.
- Gdy bootstrap z kodem konfiguracji spoza bazowej konfiguracji czeka na zatwierdzenie, szczegóły `PAIRING_REQUIRED`
  zawierają `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  i `pauseReconnect: false`. Klienci powinni nadal ponawiać połączenie z tym samym
  tokenem bootstrapu, aż żądanie zostanie zatwierdzone albo token stanie się nieprawidłowy.
- Utrwalaj `hello-ok.auth.deviceTokens` tylko wtedy, gdy połączenie użyło uwierzytelniania bootstrapu
  przez zaufany transport, taki jak `wss://` albo parowanie loopback/lokalne.
- Jeśli klient dostarczy **jawny** `deviceToken` albo jawne `scopes`, ten
  zestaw zakresów żądany przez wywołującego pozostaje autorytatywny; zakresy z pamięci podręcznej są
  ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokena dla danego urządzenia.
- Tokeny urządzeń można rotować/cofać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`). Rotowanie albo
  cofanie tokena węzła lub innej roli niebędącej operatorem wymaga też `operator.admin`.
- `device.token.rotate` zwraca metadane rotacji. Zwraca zastępczy
  token bearer tylko dla wywołań z tego samego urządzenia, które są już uwierzytelnione tym
  tokenem urządzenia, aby klienci używający wyłącznie tokenów mogli utrwalić zamiennik przed
  ponownym połączeniem. Rotacje wspólne/administracyjne nie zwracają tokena bearer.
- Wydawanie, rotacja i cofanie tokenów pozostają ograniczone do zatwierdzonego zestawu ról
  zapisanego we wpisie parowania danego urządzenia; mutacja tokena nie może rozszerzyć ani
  wskazać roli urządzenia, której zatwierdzenie parowania nigdy nie przyznało.
- W sesjach tokenów sparowanych urządzeń zarządzanie urządzeniami jest ograniczone do siebie, chyba że
  wywołujący ma również `operator.admin`: wywołujący bez uprawnień administratora mogą zarządzać tylko
  tokenem operatora dla wpisu **własnego** urządzenia. Zarządzanie tokenami węzła i innymi tokenami
  ról niebędących operatorem jest dostępne tylko dla administratora, nawet dla własnego urządzenia wywołującego.
- `device.token.rotate` i `device.token.revoke` sprawdzają również docelowy zestaw zakresów tokena operatora
  względem bieżących zakresów sesji wywołującego. Wywołujący bez uprawnień administratora
  nie mogą rotować ani cofać szerszego tokena operatora niż ten, który już posiadają.
- Niepowodzenia uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z tokenem dla danego urządzenia z pamięci podręcznej.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać wskazówki dotyczące działania operatora.
- `AUTH_SCOPE_MISMATCH` oznacza, że token urządzenia został rozpoznany, ale nie obejmuje
  żądanej roli/zakresów. Klienci nie powinni przedstawiać tego jako błędnego tokena;
  poproś operatora o ponowne sparowanie albo zatwierdzenie węższego/szerszego kontraktu zakresów.

## Tożsamość urządzenia + parowanie

- Węzły powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  odcisku palca pary kluczy.
- Gateway wydają tokeny dla urządzenia + roli.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączone jest lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania koncentruje się na bezpośrednich połączeniach local loopback.
- OpenClaw ma również wąską ścieżkę samopołączenia lokalną dla backendu/kontenera dla
  zaufanych przepływów pomocniczych ze wspólnym sekretem.
- Połączenia z tego samego hosta przez tailnet albo LAN nadal są traktowane jako zdalne dla parowania i
  wymagają zatwierdzenia.
- Klienci WS zwykle dołączają tożsamość `device` podczas `connect` (operator +
  węzeł). Jedyne wyjątki operatora bez urządzenia to jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności niezabezpieczonego HTTP tylko na localhost.
  - udane uwierzytelnianie operatora Control UI w `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (awaryjne obejście, poważne obniżenie bezpieczeństwa).
  - bezpośrednio loopbackowe RPC backendu `gateway-client` na zarezerwowanej wewnętrznej
    ścieżce pomocniczej.
- Pominięcie tożsamości urządzenia ma konsekwencje dla zakresów. Gdy połączenie operatora
  bez urządzenia jest dopuszczone przez jawną ścieżkę zaufania, OpenClaw nadal czyści
  samodzielnie deklarowane zakresy do pustego zestawu, chyba że ta ścieżka ma nazwany
  wyjątek zachowania zakresów. Metody bramkowane zakresami kończą się wtedy błędem
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` to ścieżka zachowania zakresów Control UI
  jako awaryjne obejście. Nie przyznaje zakresów dowolnym
  niestandardowym klientom WebSocket o kształcie backendu lub CLI.
- Zarezerwowana bezpośrednio loopbackowa ścieżka pomocnicza backendu `gateway-client` zachowuje
  zakresy tylko dla wewnętrznych lokalnych RPC płaszczyzny sterowania; niestandardowe identyfikatory backendu nie
  otrzymują tego wyjątku.
- Wszystkie połączenia muszą podpisać nonce `connect.challenge` dostarczone przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed challenge, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` w `error.details.code` ze stabilnym `error.details.reason`.

Typowe niepowodzenia migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (albo wysłał pusty). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał za pomocą przestarzałego/błędnego nonce. |
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
- Starsze podpisy `v2` pozostają akceptowane ze względu na zgodność, ale przypięcie metadanych
  sparowanego urządzenia nadal kontroluje zasady poleceń przy ponownym połączeniu.

## TLS + przypinanie

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk palca certyfikatu Gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` albo CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API gateway** (status, kanały, modele, czat,
agent, sesje, węzły, zatwierdzenia itd.). Dokładna powierzchnia jest definiowana przez
schematy TypeBox w `packages/gateway-protocol/src/schema.ts`.

## Powiązane

- [Protokół mostu](/pl/gateway/bridge-protocol)
- [Runbook Gateway](/pl/gateway)
