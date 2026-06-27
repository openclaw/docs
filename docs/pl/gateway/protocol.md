---
read_when:
    - Implementowanie lub aktualizowanie klientów WS Gateway
    - Debugowanie niezgodności protokołu lub niepowodzeń połączenia
    - Ponowne generowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-06-27T17:36:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
    source_path: gateway/protocol.md
    workflow: 16
---

Protokół Gateway WS jest **pojedynczą płaszczyzną sterowania + transportem węzłów** dla
OpenClaw. Wszyscy klienci (CLI, internetowy interfejs użytkownika, aplikacja macOS, węzły iOS/Android, węzły
headless) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres**
podczas uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po udanym uzgodnieniu połączenia klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Przy włączonej diagnostyce
  zbyt duże ramki przychodzące i wolne bufory wychodzące emitują zdarzenia `payload.large`,
  zanim Gateway zamknie lub odrzuci dotkniętą ramkę. Te zdarzenia zachowują
  rozmiary, limity, powierzchnie i bezpieczne kody przyczyny. Nie zachowują treści
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
`"startup-sidecars"` i `retryAfterMs`. Klienci powinni ponowić taką odpowiedź
w ramach swojego ogólnego budżetu połączenia, zamiast prezentować ją jako końcową
awarię uzgadniania połączenia.

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` jest również wymagane i raportuje
wynegocjowaną rolę/zakresy. `pluginSurfaceUrls` jest opcjonalne i mapuje nazwy powierzchni
Plugin, takie jak `canvas`, na zakresowe hostowane adresy URL.

Zakresowe adresy URL powierzchni Plugin mogą wygasać. Węzły mogą wywołać
`node.pluginSurface.refresh` z `{ "surface": "canvas" }`, aby otrzymać świeży
wpis w `pluginSurfaceUrls`. Eksperymentalna refaktoryzacja Plugin Canvas nie
obsługuje przestarzałej ścieżki zgodności `canvasHostUrl`, `canvasCapability` ani
`node.canvas.capability.refresh`; obecni klienci natywni i bramy
muszą używać powierzchni Plugin.

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

Zaufani klienci backendu działający w tym samym procesie (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogą pominąć `device` w bezpośrednich połączeniach local loopback, gdy
uwierzytelniają się współdzielonym tokenem/hasłem gateway. Ta ścieżka jest zarezerwowana
dla wewnętrznych RPC płaszczyzny sterowania i zapobiega blokowaniu lokalnej pracy backendu,
takiej jak aktualizacje sesji subagentów, przez nieaktualne bazowe parowania CLI/urządzenia. Klienci zdalni,
klienci pochodzący z przeglądarki, klienci węzłów oraz jawni klienci tokenu urządzenia/tożsamości urządzenia
nadal używają normalnych kontroli parowania i podnoszenia zakresów.

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

Wbudowany bootstrap kodem QR/kodem konfiguracji jest świeżą ścieżką przekazania mobilnego. Udane
połączenie bazowe z kodem konfiguracji zwraca podstawowy token węzła oraz jeden ograniczony
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
wtedy, gdy połączenie użyło uwierzytelniania bootstrap w zaufanym transporcie, takim jak `wss://` lub
local loopback/parowanie lokalne.

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

Metody z efektami ubocznymi wymagają **kluczy idempotencji** (zobacz schemat).

## Role + zakresy

Pełny model zakresów operatora, kontrole w czasie zatwierdzania oraz semantykę współdzielonych sekretów
opisano w [Zakresy operatora](/pl/gateway/operator-scopes).

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

Metody RPC Gateway rejestrowane przez Plugin mogą żądać własnego zakresu operatora, ale
zarezerwowane podstawowe prefiksy administracyjne (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze rozstrzygają się do `operator.admin`.

Zakres metody jest tylko pierwszą bramką. Niektóre polecenia slash dostępne przez
`chat.send` nakładają dodatkowo ostrzejsze kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma również dodatkową kontrolę zakresu w czasie zatwierdzania, poza
podstawowym zakresem metody:

- żądania bez polecenia: `operator.pairing`
- żądania z poleceniami węzła innymi niż exec: `operator.pairing` + `operator.write`
- żądania zawierające `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Możliwości/polecenia/uprawnienia (węzeł)

Węzły deklarują roszczenia możliwości podczas połączenia:

- `caps`: kategorie możliwości wysokiego poziomu, takie jak `camera`, `canvas`, `screen`,
  `location`, `voice` i `talk`.
- `commands`: lista dozwolonych poleceń dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i wymusza listy dozwolonych po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy obecności obejmują `deviceId`, `roles` i `scopes`, aby interfejsy użytkownika mogły pokazać jeden wiersz na urządzenie
  nawet wtedy, gdy łączy się ono zarówno jako **operator**, jak i **węzeł**.
- `node.list` zawiera opcjonalne pola `lastSeenAtMs` i `lastSeenReason`. Połączone węzły raportują
  swój bieżący czas połączenia jako `lastSeenAtMs` z przyczyną `connect`; sparowane węzły mogą również raportować
  trwałą obecność w tle, gdy zaufane zdarzenie węzła aktualizuje ich metadane parowania.

### Zdarzenie aktywności węzła w tle

Węzły mogą wywołać `node.event` z `event: "node.presence.alive"`, aby zapisać, że sparowany węzeł był
aktywny podczas wybudzenia w tle, bez oznaczania go jako połączonego.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` jest zamkniętym enumem: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` lub `connect`. Nieznane ciągi wyzwalacza są normalizowane do
`background` przez Gateway przed utrwaleniem. Zdarzenie jest trwałe tylko dla uwierzytelnionych sesji urządzeń
węzłów; sesje bez urządzenia lub niesparowane zwracają `handled: false`.

Udane bramy zwracają ustrukturyzowany wynik:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Starsze bramy mogą nadal zwracać `{ "ok": true }` dla `node.event`; klienci powinni traktować to jako
potwierdzone RPC, a nie jako trwałe utrwalenie obecności.

## Zakresowanie zdarzeń broadcast

Zdarzenia broadcast WebSocket wypychane przez serwer są ograniczane zakresami, aby sesje z zakresem parowania lub tylko węzłowe nie odbierały pasywnie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Broadcasty `plugin.*` definiowane przez Plugin** są ograniczane do `operator.write` lub `operator.admin`, zależnie od tego, jak Plugin je zarejestrował.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia połączenia/rozłączenia itd.) pozostają nieograniczone, aby kondycja transportu była obserwowalna dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń broadcast** są domyślnie ograniczane zakresami (fail-closed), chyba że zarejestrowany handler jawnie je rozluźnia.

Każde połączenie klienta utrzymuje własny numer sekwencyjny na klienta, dzięki czemu broadcasty zachowują monotoniczne porządkowanie na tym gnieździe, nawet gdy różni klienci widzą różne, filtrowane zakresami podzbiory strumienia zdarzeń.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż powyższe przykłady uzgadniania połączenia/uwierzytelniania. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` to konserwatywna
lista odkrywania zbudowana z `src/gateway/server-methods-list.ts` oraz załadowanych
eksportów metod Plugin/kanału. Traktuj ją jako odkrywanie funkcji, a nie pełne
wyliczenie `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System and identity">
    - `health` zwraca buforowaną lub świeżo sprawdzoną migawkę kondycji Gateway.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestrator stabilności diagnostycznej. Przechowuje metadane operacyjne, takie jak nazwy zdarzeń, liczby, rozmiary w bajtach, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/Plugin oraz identyfikatory sesji. Nie przechowuje tekstu czatu, treści webhook, wyników narzędzi, surowych treści żądań lub odpowiedzi, tokenów, plików cookie ani wartości tajnych. Wymagany jest zakres odczytu operatora.
    - `status` zwraca podsumowanie Gateway w stylu `/status`; pola wrażliwe są uwzględniane tylko dla klientów operatora z zakresem administratora.
    - `gateway.identity.get` zwraca tożsamość urządzenia Gateway używaną przez przepływy przekazywania i parowania.
    - `system-presence` zwraca bieżącą migawkę obecności połączonych urządzeń operatora/węzła.
    - `system-event` dołącza zdarzenie systemowe i może zaktualizować/rozgłosić kontekst obecności.
    - `last-heartbeat` zwraca najnowsze utrwalone zdarzenie Heartbeat.
    - `set-heartbeats` przełącza przetwarzanie Heartbeat w Gateway.

  </Accordion>

  <Accordion title="Models and usage">
    - `models.list` zwraca katalog modeli dozwolonych w czasie działania. Przekaż `{ "view": "configured" }` dla skonfigurowanych modeli o rozmiarze selektora (`agents.defaults.models` najpierw, potem `models.providers.*.models`) albo `{ "view": "all" }` dla pełnego katalogu.
    - `usage.status` zwraca okna użycia dostawcy/podsumowania pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
      Przekaż `agentId` dla jednego agenta albo `agentScope: "all"`, aby zagregować skonfigurowanych agentów.
    - `doctor.memory.status` zwraca gotowość pamięci wektorowej / buforowanych osadzeń dla aktywnego domyślnego obszaru roboczego agenta. Przekaż `{ "probe": true }` lub `{ "deep": true }` tylko wtedy, gdy wywołujący wyraźnie chce wykonać bieżący ping dostawcy osadzeń. Klienci świadomi Dreaming mogą także przekazać `{ "agentId": "agent-id" }`, aby ograniczyć statystyki magazynu Dreaming do wybranego obszaru roboczego agenta; pominięcie `agentId` zachowuje mechanizm awaryjny domyślnego agenta i agreguje skonfigurowane obszary robocze Dreaming.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` i `doctor.memory.dedupeDreamDiary` akceptują opcjonalne parametry `{ "agentId": "agent-id" }` dla widoków/akcji Dreaming wybranego agenta. Gdy `agentId` jest pominięte, działają na skonfigurowanym domyślnym obszarze roboczym agenta.
    - `doctor.memory.remHarness` zwraca ograniczony, tylko do odczytu podgląd uprzęży REM dla zdalnych klientów płaszczyzny sterowania. Może zawierać ścieżki obszaru roboczego, fragmenty pamięci, wyrenderowany ugruntowany Markdown i kandydatów do głębokiej promocji, więc wywołujący potrzebują `operator.read`.
    - `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji. Przekaż `agentId` dla jednego
      agenta albo `agentScope: "all"`, aby wyświetlić skonfigurowanych agentów razem.
    - `sessions.usage.timeseries` zwraca użycie w szeregu czasowym dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Channels and login helpers">
    - `channels.status` zwraca podsumowania statusu wbudowanych + dołączonych kanałów/Plugin.
    - `channels.logout` wylogowuje określony kanał/konto, gdy kanał obsługuje wylogowanie.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i uruchamia kanał po powodzeniu.
    - `push.test` wysyła testowe powiadomienie push APNs do zarejestrowanego węzła iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słowa wybudzającego.
    - `voicewake.set` aktualizuje wyzwalacze słowa wybudzającego i rozgłasza zmianę.

  </Accordion>

  <Accordion title="Messaging and logs">
    - `send` to bezpośrednie RPC dostarczania wychodzącego dla wysyłek kierowanych do kanału/konta/wątku poza runnerem czatu.
    - `logs.tail` zwraca skonfigurowany ogon dziennika pliku Gateway z kontrolą kursora/limitu i maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Talk and TTS">
    - `talk.catalog` zwraca katalog dostawców Talk tylko do odczytu dla mowy, transkrypcji strumieniowej i głosu w czasie rzeczywistym. Obejmuje identyfikatory dostawców, etykiety, stan skonfigurowania, ujawnione identyfikatory modeli/głosów, tryby kanoniczne, transporty, strategie mózgu oraz flagi audio/możliwości czasu rzeczywistego, bez zwracania tajnych danych dostawcy ani modyfikowania globalnej konfiguracji.
    - `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (lub `operator.admin`).
    - `talk.session.create` tworzy należącą do Gateway sesję Talk dla `realtime/gateway-relay`, `transcription/gateway-relay` lub `stt-tts/managed-room`. Dla `stt-tts/managed-room` wywołujący z `operator.write`, którzy przekazują `sessionKey`, muszą także przekazać `spawnedBy` dla widoczności klucza sesji w danym zakresie; tworzenie `sessionKey` bez zakresu oraz `brain: "direct-tools"` wymagają `operator.admin`.
    - `talk.session.join` weryfikuje token sesji pokoju zarządzanego, emituje zdarzenia `session.ready` lub `session.replaced` zgodnie z potrzebą i zwraca metadane pokoju/sesji oraz ostatnie zdarzenia Talk bez tokenu w postaci jawnej ani zapisanego skrótu tokenu.
    - `talk.session.appendAudio` dołącza wejściowe audio PCM w base64 do należących do Gateway sesji przekazywania czasu rzeczywistego i transkrypcji.
    - `talk.session.startTurn`, `talk.session.endTurn` i `talk.session.cancelTurn` sterują cyklem życia tury pokoju zarządzanego z odrzucaniem nieaktualnych tur przed wyczyszczeniem stanu.
    - `talk.session.cancelOutput` zatrzymuje wyjściowe audio asystenta, głównie dla wejścia barge-in bramkowanego VAD w sesjach przekazywania Gateway.
    - `talk.session.submitToolResult` kończy wywołanie narzędzia dostawcy wyemitowane przez należącą do Gateway sesję przekazywania czasu rzeczywistego. Przekaż `options: { willContinue: true }` dla tymczasowego wyjścia narzędzia, gdy wynik końcowy nastąpi później, albo `options: { suppressResponse: true }`, gdy wynik narzędzia powinien spełnić wywołanie dostawcy bez uruchamiania kolejnej odpowiedzi asystenta w czasie rzeczywistym.
    - `talk.session.steer` wysyła sterowanie głosowe aktywnego uruchomienia do należącej do Gateway sesji Talk opartej na agencie. Akceptuje `{ sessionId, text, mode? }`, gdzie `mode` to `status`, `steer`, `cancel` lub `followup`; pominięty tryb jest klasyfikowany z wypowiedzianego tekstu.
    - `talk.session.close` zamyka należącą do Gateway sesję przekazywania, transkrypcji lub pokoju zarządzanego i emituje końcowe zdarzenia Talk.
    - `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów WebChat/Control UI.
    - `talk.client.create` tworzy należącą do klienta sesję dostawcy czasu rzeczywistego przy użyciu `webrtc` lub `provider-websocket`, podczas gdy Gateway jest właścicielem konfiguracji, poświadczeń, instrukcji i zasad narzędzi.
    - `talk.client.toolCall` pozwala należącym do klienta transportom czasu rzeczywistego przekazywać wywołania narzędzi dostawcy do zasad Gateway. Pierwszym obsługiwanym narzędziem jest `openclaw_agent_consult`; klienci otrzymują identyfikator uruchomienia i czekają na zwykłe zdarzenia cyklu życia czatu przed przesłaniem wyniku narzędzia specyficznego dla dostawcy.
    - `talk.client.steer` wysyła sterowanie głosowe aktywnego uruchomienia dla należących do klienta transportów czasu rzeczywistego. Gateway rozwiązuje aktywne osadzone uruchomienie z `sessionKey` i zwraca ustrukturyzowany wynik zaakceptowany/odrzucony zamiast po cichu odrzucać sterowanie.
    - `talk.event` to pojedynczy kanał zdarzeń Talk dla adapterów czasu rzeczywistego, transkrypcji, STT/TTS, pokoju zarządzanego, telefonii i spotkań.
    - `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców awaryjnych i stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny spis dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

  </Accordion>

  <Accordion title="Secrets, config, update, and wizard">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRefs i podmienia stan tajnych danych w czasie działania tylko przy pełnym powodzeniu.
    - `secrets.resolve` rozwiązuje przypisania tajnych danych kierowanych do polecenia dla określonego zestawu polecenia/celu.
    - `config.get` zwraca bieżącą migawkę konfiguracji i skrót.
    - `config.set` zapisuje zweryfikowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji. Destrukcyjne zastępowanie tablicy
      wymaga ścieżki, której dotyczy zmiana, w `replacePaths`; zagnieżdżone tablice
      pod wpisami tablic używają ścieżek `[]`, takich jak `agents.list[].skills`.
    - `config.apply` weryfikuje + zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca bieżący ładunek schematu konfiguracji używany przez narzędzia Control UI i CLI: schemat, `uiHints`, wersję i metadane generowania, w tym metadane schematu Plugin + kanału, gdy środowisko wykonawcze może je załadować. Schemat zawiera metadane pól `title` / `description` pochodzące z tych samych etykiet i tekstu pomocy, których używa UI, w tym gałęzie kompozycji obiektów zagnieżdżonych, wieloznaczników, elementów tablicy oraz `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pola.
    - `config.schema.lookup` zwraca ładunek wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę + `hintPath`, opcjonalne `reloadKind` oraz bezpośrednie podsumowania elementów podrzędnych do drążenia w UI/CLI. `reloadKind` jest jednym z `restart`, `hot` lub `none` i odzwierciedla planer ponownego ładowania konfiguracji Gateway dla żądanej ścieżki. Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika oraz typowe pola walidacji (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia liczb/ciągów/tablic/obiektów oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania elementów podrzędnych ujawniają `key`, znormalizowaną `path`, `type`, `required`, `hasChildren`, opcjonalne `reloadKind` oraz dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji Gateway i planuje restart tylko wtedy, gdy sama aktualizacja się powiodła; wywołujący z sesją mogą dołączyć `continuationMessage`, aby uruchomienie wznowiło jedną następną turę agenta przez kolejkę kontynuacji restartu. Aktualizacje menedżera pakietów i nadzorowane aktualizacje checkoutu git z płaszczyzny sterowania używają odłączonego przekazania usługi zarządzanej zamiast zastępować drzewo pakietów lub modyfikować checkout/wynik kompilacji wewnątrz działającego Gateway. Rozpoczęte przekazanie zwraca `ok: true` z `result.reason: "managed-service-handoff-started"` i `handoff.status: "started"`; niedostępne lub nieudane przekazania zwracają `ok: false` z `managed-service-handoff-unavailable` lub `managed-service-handoff-failed`, plus `handoff.command`, gdy wymagana jest ręczna aktualizacja w powłoce. Niedostępne przekazanie oznacza, że OpenClaw nie ma bezpiecznej granicy nadzorcy ani trwałej tożsamości usługi, takiej jak `OPENCLAW_SYSTEMD_UNIT` dla systemd. Podczas rozpoczętego przekazania znacznik restartu może przez krótki czas zgłaszać `stats.reason: "restart-health-pending"`; kontynuacja jest opóźniona, dopóki CLI nie zweryfikuje zrestartowanego Gateway i nie zapisze końcowego znacznika `ok`.
    - `update.status` odświeża i zwraca najnowszy znacznik restartu aktualizacji, w tym wersję działającą po restarcie, gdy jest dostępna.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator wdrażania przez WS RPC.

  </Accordion>

  <Accordion title="Pomocnicze funkcje agentów i przestrzeni roboczej">
    - `agents.list` zwraca skonfigurowane wpisy agentów, w tym efektywny model i metadane środowiska uruchomieniowego.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów oraz połączeniem z przestrzenią roboczą.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają startowymi plikami przestrzeni roboczej udostępnionymi agentowi.
    - `tasks.list`, `tasks.get` i `tasks.cancel` udostępniają rejestr zadań Gateway klientom SDK i operatorskim.
    - `artifacts.list`, `artifacts.get` i `artifacts.download` udostępniają podsumowania artefaktów pochodzące z transkryptu oraz pobieranie dla jawnego zakresu `sessionKey`, `runId` lub `taskId`. Zapytania o uruchomienia i zadania rozwiązują sesję właściciela po stronie serwera i zwracają tylko multimedia transkryptu ze zgodnym pochodzeniem; niebezpieczne lub lokalne źródła URL zwracają nieobsługiwane pobrania zamiast pobierania po stronie serwera.
    - `environments.list` i `environments.status` udostępniają klientom SDK odkrywanie lokalnych dla Gateway i węzłowych środowisk tylko do odczytu.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcową migawkę, gdy jest dostępna.

  </Accordion>

  <Accordion title="Sterowanie sesją">
    - `sessions.list` zwraca bieżący indeks sesji, w tym metadane `agentRuntime` dla każdego wiersza, gdy skonfigurowano backend środowiska uruchomieniowego agenta.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkryptu/wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkryptu dla określonych kluczy sesji.
    - `sessions.describe` zwraca jeden wiersz sesji Gateway dla dokładnego klucza sesji.
    - `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant przerwania i sterowania dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji. Wywołujący może przekazać `key` oraz opcjonalnie `runId` albo przekazać samo `runId` dla aktywnych uruchomień, które Gateway może przypisać do sesji.
    - `sessions.patch` aktualizuje metadane/nadpisania sesji i raportuje rozwiązany model kanoniczny oraz efektywne `agentRuntime`.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest normalizowane do wyświetlania dla klientów UI: znaczniki dyrektyw inline są usuwane z widocznego tekstu, zwykłotekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi) i ujawnione tokeny sterujące modelu ASCII/pełnej szerokości są usuwane, czyste wiersze asystenta z cichymi tokenami, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a nadmiernie duże wiersze mogą zostać zastąpione placeholderami.
    - `chat.message.get` to addytywny, ograniczony czytnik pełnych wiadomości dla pojedynczego widocznego wpisu transkryptu. Klienci przekazują `sessionKey`, opcjonalne `agentId`, gdy wybór sesji ma zakres agenta, oraz `messageId` transkryptu wcześniej ujawnione przez `chat.history`, a Gateway zwraca tę samą projekcję znormalizowaną do wyświetlania bez lekkiego limitu obcinania historii, gdy zapisany wpis jest nadal dostępny i nie jest nadmiernie duży.
    - `chat.send` akceptuje jednorazowe `fastMode: "auto"`, aby użyć trybu szybkiego dla wywołań modelu rozpoczętych przed automatycznym punktem odcięcia, a następnie rozpocząć późniejsze ponowienie, fallback, wynik narzędzia lub wywołania kontynuacji bez trybu szybkiego. Punkt odcięcia domyślnie wynosi 60 sekund i można go skonfigurować dla modelu za pomocą `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Wywołujący `chat.send` może przekazać jednorazowe `fastAutoOnSeconds`, aby nadpisać punkt odcięcia dla tego żądania.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.

  </Accordion>

  <Accordion title="Parowanie Node, wywołania i oczekująca praca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` i `node.pair.verify` obejmują parowanie Node oraz weryfikację startową.
    - `node.list` i `node.describe` zwracają znany/podłączony stan Node.
    - `node.rename` aktualizuje etykietę sparowanego Node.
    - `node.invoke` przekazuje polecenie do podłączonego Node.
    - `node.invoke.result` zwraca wynik żądania wywołania.
    - `node.event` przenosi zdarzenia pochodzące z Node z powrotem do gateway.
    - `node.pending.pull` i `node.pending.ack` to API kolejki podłączonego Node.
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
    - Automatyzacja: `wake` planuje natychmiastowe lub przy następnym Heartbeat wstrzyknięcie tekstu wybudzania; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - `cron.run` pozostaje RPC w stylu dodawania do kolejki dla ręcznych uruchomień. Klienci, którzy potrzebują semantyki ukończenia, powinni odczytać zwrócone `runId` i odpytywać `cron.runs`.
    - `cron.runs` akceptuje opcjonalny niepusty filtr `runId`, aby klienci mogli śledzić jedno zakolejkowane ręczne uruchomienie bez ścigania się z innymi wpisami historii dla tego samego zadania.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject`, oraz inne zdarzenia czatu wyłącznie transkryptowe. W protokole v4 ładunki delta przenoszą `deltaText`; `message` pozostaje skumulowaną migawką asystenta. Zastąpienia bez prefiksu ustawiają `replace=true` i używają `deltaText` jako tekstu zastępczego.
- `session.message`, `session.operation` i `session.tool`: aktualizacje transkryptu, operacji sesji w toku oraz strumienia zdarzeń dla subskrybowanej sesji.
- `sessions.changed`: zmieniono indeks sesji lub metadane.
- `presence`: aktualizacje migawki obecności systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja migawki kondycji gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania cron.
- `shutdown`: powiadomienie o zamknięciu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania Node.
- `node.invoke.request`: rozgłoszenie żądania wywołania Node.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniono konfigurację wyzwalacza słowa wybudzającego.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia zatwierdzenia exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzenia plugin.

### Metody pomocnicze Node

- Node mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych Skills do kontroli automatycznego zezwalania.

### RPC rejestru zadań

Klienci operatorscy mogą sprawdzać i anulować rekordy zadań w tle Gateway przez RPC rejestru zadań. Te metody zwracają oczyszczone podsumowania zadań, a nie surowy stan środowiska uruchomieniowego.

- `tasks.list` wymaga `operator.read`.
  - Parametry: opcjonalny `status` (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` lub `"timed_out"`) albo tablica tych statusów, opcjonalne `agentId`, opcjonalne `sessionKey`, opcjonalny `limit` od `1` do `500` oraz opcjonalny ciąg `cursor`.
  - Wynik: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` wymaga `operator.read`.
  - Parametry: `{ "taskId": string }`.
  - Wynik: `{ "task": TaskSummary }`.
  - Brakujące identyfikatory zadań zwracają kształt błędu nieznalezienia Gateway.
- `tasks.cancel` wymaga `operator.write`.
  - Parametry: `{ "taskId": string, "reason"?: string }`.
  - Wynik:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informuje, czy rejestr zawierał pasujące zadanie. `cancelled` informuje, czy środowisko uruchomieniowe zaakceptowało lub zarejestrowało anulowanie.

`TaskSummary` zawiera `id`, `status` oraz opcjonalne metadane, takie jak `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, znaczniki czasu, postęp, końcowe podsumowanie oraz oczyszczony tekst błędu. `agentId` identyfikuje agenta wykonującego zadanie; `sessionKey` i `ownerKey` zachowują kontekst żądającego i sterowania.

### Metody pomocnicze operatora

- Operatorzy mogą wywołać `commands.list` (`operator.read`), aby pobrać spis poleceń runtime
  dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, do której powierzchni trafia główne `name`:
    - `text` zwraca główny tekstowy token polecenia bez początkowego `/`
    - `native` oraz domyślna ścieżka `both` zwracają natywne nazwy świadome dostawcy,
      gdy są dostępne
  - `textAliases` przenosi dokładne aliasy ukośnikowe, takie jak `/model` i `/m`.
  - `nativeName` przenosi natywną nazwę polecenia świadomą dostawcy, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na natywne nazewnictwo oraz dostępność
    natywnych poleceń pluginu.
  - `includeArgs=false` pomija zserializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywołać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi runtime dla
  agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel pluginu, gdy `source="plugin"`
  - `optional`: czy narzędzie pluginu jest opcjonalne
- Operatorzy mogą wywołać `tools.effective` (`operator.read`), aby pobrać efektywny dla runtime
  spis narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst runtime z sesji po stronie serwera zamiast przyjmować
    kontekst uwierzytelnienia lub dostarczania podany przez wywołującego.
  - Odpowiedź jest projekcją aktywnego spisu wyprowadzoną przez serwer i ograniczoną do sesji,
    obejmującą narzędzia rdzenia, pluginów, kanałów oraz już wykrytych serwerów MCP.
  - `tools.effective` jest tylko do odczytu dla MCP: może przepuścić ciepły katalog MCP sesji przez
    finalną politykę narzędzi, ale nie tworzy runtime MCP, nie łączy transportów ani nie wydaje
    `tools/list`. Jeśli nie istnieje pasujący ciepły katalog, odpowiedź może zawierać powiadomienie takie jak
    `mcp-not-yet-connected`, `mcp-not-yet-listed` lub `mcp-stale-catalog`.
  - Efektywne wpisy narzędzi używają `source="core"`, `source="plugin"`, `source="channel"` lub
    `source="mcp"`.
- Operatorzy mogą wywołać `tools.invoke` (`operator.write`), aby uruchomić jedno dostępne narzędzie przez
  tę samą ścieżkę polityki Gateway co `/tools/invoke`.
  - `name` jest wymagane. `args`, `sessionKey`, `agentId`, `confirm` i
    `idempotencyKey` są opcjonalne.
  - Jeśli obecne są zarówno `sessionKey`, jak i `agentId`, rozwiązany agent sesji musi pasować do
    `agentId`.
  - Wrappery rdzenia tylko dla właściciela, takie jak `cron`, `gateway` i `nodes`, wymagają
    tożsamości właściciela/administratora (`operator.admin`), mimo że sama metoda `tools.invoke`
    ma uprawnienie `operator.write`.
  - Odpowiedź jest kopertą skierowaną do SDK z polami `ok`, `toolName`, opcjonalnym `output` oraz typowanymi
    polami `error`. Odmowy zatwierdzenia lub polityki zwracają `ok:false` w ładunku zamiast
    omijać potok polityki narzędzi Gateway.
- Operatorzy mogą wywołać `skills.status` (`operator.read`), aby pobrać widoczny
  spis skillów dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz
    oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywołać `skills.search` i `skills.detail` (`operator.read`) dla
  metadanych odkrywania ClawHub.
- Operatorzy mogą wywołać `skills.upload.begin`, `skills.upload.chunk` i
  `skills.upload.commit` (`operator.admin`), aby przygotować prywatne archiwum skilla
  przed jego instalacją. Jest to oddzielna ścieżka przesyłania administracyjnego dla zaufanych klientów,
  a nie normalny przepływ instalacji skilla z ClawHub, i jest domyślnie wyłączona, chyba że
  włączono `skills.install.allowUploadedArchives`.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    tworzy przesyłanie powiązane z tym slugiem i wartością force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` dołącza bajty przy
    dokładnym zdekodowanym przesunięciu.
  - `skills.upload.commit({ uploadId, sha256? })` weryfikuje końcowy rozmiar i
    SHA-256. Zatwierdzenie tylko finalizuje przesyłanie; nie instaluje skilla.
  - Przesłane archiwa skillów są archiwami zip zawierającymi główny `SKILL.md`.
    Wewnętrzna nazwa katalogu archiwum nigdy nie wybiera celu instalacji.
- Operatorzy mogą wywołać `skills.install` (`operator.admin`) w trzech trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje
    folder skilla w katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb przesyłania: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instaluje zatwierdzone przesyłanie w katalogu `skills/<slug>`
    domyślnego obszaru roboczego agenta. Slug i wartość force muszą pasować do pierwotnego
    żądania `skills.upload.begin`. Ten tryb jest odrzucany, chyba że
    włączono `skills.install.allowUploadedArchives`. To ustawienie nie
    wpływa na instalacje ClawHub.
  - Tryb instalatora Gateway: `{ name, installId, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście Gateway.
    Starsi klienci nadal mogą wysyłać `dangerouslyForceUnsafeInstall`; to pole jest
    przestarzałe, akceptowane tylko dla zgodności protokołu i ignorowane. Użyj
    `security.installPolicy` dla decyzji instalacyjnych należących do operatora.
- Operatorzy mogą wywołać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug lub wszystkie śledzone instalacje ClawHub w
    domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji łata wartości `skills.entries.<skillKey>`, takie jak `enabled`,
    `apiKey` i `env`.

### Widoki `models.list`

`models.list` przyjmuje opcjonalny parametr `view`:

- Pominięty lub `"default"`: bieżące zachowanie runtime. Jeśli skonfigurowano `agents.defaults.models`, odpowiedzią jest dozwolony katalog, w tym dynamicznie wykryte modele dla wpisów `provider/*`. W przeciwnym razie odpowiedzią jest pełny katalog Gateway.
- `"configured"`: zachowanie o rozmiarze odpowiednim dla selektora. Jeśli skonfigurowano `agents.defaults.models`, nadal ma pierwszeństwo, w tym odkrywanie ograniczone do dostawcy dla wpisów `provider/*`. Bez listy dozwolonych odpowiedź używa jawnych wpisów `models.providers.*.models`, wracając do pełnego katalogu tylko wtedy, gdy nie istnieją żadne skonfigurowane wiersze modeli.
- `"all"`: pełny katalog Gateway, z pominięciem `agents.defaults.models`. Używaj tego do diagnostyki i interfejsów odkrywania, nie do zwykłych selektorów modeli.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, Gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozstrzygają je przez wywołanie `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node` `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane dalej wywołania `node.invoke system.run` ponownie używają tego kanonicznego
  `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmodyfikuje `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` między przygotowaniem a końcowym zatwierdzonym przekazaniem `system.run`, 
  Gateway odrzuci uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Awaryjne dostarczanie agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczania wychodzącego.
- `bestEffortDeliver=false` utrzymuje ścisłe zachowanie: nierozwiązane lub wyłącznie wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na awaryjne przejście do wykonania tylko w sesji, gdy nie można rozwiązać żadnej zewnętrznej dostarczalnej trasy (na przykład sesje wewnętrzne/webchat lub niejednoznaczne konfiguracje wielokanałowe).
- Końcowe wyniki `agent` mogą zawierać `result.deliveryStatus`, gdy zażądano
  dostarczenia, używając tych samych statusów `sent`, `suppressed`, `partial_failed` i `failed`
  udokumentowanych dla [`openclaw agent --json --deliver`](/pl/cli/agent#json-delivery-status).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `packages/gateway-protocol/src/version.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca zakresy, które
  nie obejmują jego bieżącego protokołu. Bieżący klienci i serwery wymagają
  protokołu v4.
- Schematy + modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości są
stabilne w protokole v4 i stanowią oczekiwaną bazę dla klientów zewnętrznych.

| Stała                                    | Wartość domyślna                                     | Źródło                                                                                    |
| --------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                      | `4`                                                  | `packages/gateway-protocol/src/version.ts`                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`           | `4`                                                  | `packages/gateway-protocol/src/version.ts`                                                |
| Limit czasu żądania (na RPC)            | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                              |
| Limit czasu preauth / connect-challenge | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (config/env może podnieść sparowany budżet serwera/klienta) |
| Początkowe opóźnienie ponownego łączenia | `1_000` ms                                          | `src/gateway/client.ts` (`backoffMs`)                                                     |
| Maks. opóźnienie ponownego łączenia     | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                             |
| Ograniczenie szybkiej ponownej próby po zamknięciu tokenu urządzenia | `250` ms                         | `src/gateway/client.ts`                                                                   |
| Okres łaski force-stop przed `terminate()` | `250` ms                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                           |
| Domyślny limit czasu `stopAndWait()`    | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                |
| Domyślny interwał tick (przed `hello-ok`) | `30_000` ms                                        | `src/gateway/client.ts`                                                                   |
| Zamknięcie po przekroczeniu limitu czasu tick | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                   |
| `MAX_PAYLOAD_BYTES`                     | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                         |

Serwer ogłasza efektywne `policy.tickIntervalMs`, `policy.maxPayload`
i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości
zamiast wartości domyślnych sprzed uzgadniania.

## Uwierzytelnianie

- Uwierzytelnianie Gateway za pomocą współdzielonego sekretu używa `connect.params.auth.token` albo
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby przenoszące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) albo nie-loopback
  `gateway.auth.mode: "trusted-proxy"`, spełniają kontrolę uwierzytelniania połączenia na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Tryb prywatnego wejścia `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie połączenia
  współdzielonym sekretem; nie wystawiaj tego trybu na publiczne/niezaufane wejście.
- Po sparowaniu Gateway wydaje **token urządzenia** ograniczony do roli połączenia
  i zakresów. Jest zwracany w `hello-ok.auth.deviceToken` i powinien zostać
  utrwalony przez klienta na potrzeby przyszłych połączeń.
- Klienci powinni utrwalać główny `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne połączenie z tym **zapisanym** tokenem urządzenia powinno także ponownie użyć zapisanego
  zatwierdzonego zestawu zakresów dla tego tokena. Zachowuje to dostęp do odczytu/sondowania/statusu,
  który został już przyznany, i zapobiega cichemu zawężaniu ponownych połączeń do
  węższego, niejawnego zakresu tylko dla administratora.
- Składanie uwierzytelniania połączenia po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest niezależne i zawsze jest przekazywane, gdy jest ustawione.
  - `auth.token` jest wypełniany według priorytetu: najpierw jawny token współdzielony,
    następnie jawny `deviceToken`, a potem zapisany token per urządzenie (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żadne z powyższych nie ustaliło
    `auth.token`. Token współdzielony albo dowolny ustalony token urządzenia go tłumi.
  - Automatyczne promowanie zapisanego tokena urządzenia przy jednorazowej ponownej próbie
    `AUTH_TOKEN_MISMATCH` jest ograniczone wyłącznie do **zaufanych punktów końcowych** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez przypięcia nie kwalifikuje się.
- Wbudowany bootstrap kodu konfiguracji zwraca główny
  `hello-ok.auth.deviceToken` węzła oraz ograniczony token operatora w
  `hello-ok.auth.deviceTokens` na potrzeby zaufanego przekazania mobilnego. Token operatora
  zawiera `operator.talk.secrets` do natywnych odczytów konfiguracji Talk oraz
  wyklucza `operator.admin` i `operator.pairing`.
- Gdy bootstrap kodu konfiguracji inny niż bazowy czeka na zatwierdzenie, szczegóły `PAIRING_REQUIRED`
  zawierają `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  oraz `pauseReconnect: false`. Klienci powinni nadal ponawiać połączenie z tym samym
  tokenem bootstrapu, dopóki żądanie nie zostanie zatwierdzone albo token nie stanie się nieprawidłowy.
- Utrwalaj `hello-ok.auth.deviceTokens` tylko wtedy, gdy połączenie użyło uwierzytelniania bootstrapu
  przez zaufany transport, taki jak `wss://` albo parowanie loopback/lokalne.
- Jeśli klient podaje **jawny** `deviceToken` albo jawne `scopes`, ten
  zestaw zakresów żądany przez wywołującego pozostaje nadrzędny; zakresy z pamięci podręcznej są
  ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokena per urządzenie.
- Tokeny urządzeń można rotować/unieważniać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`). Rotacja albo
  unieważnienie węzła lub innej roli niebędącej operatorem wymaga także `operator.admin`.
- `device.token.rotate` zwraca metadane rotacji. Zwraca zastępczy
  token okaziciela tylko dla wywołań z tego samego urządzenia, które są już uwierzytelnione tym
  tokenem urządzenia, aby klienci używający wyłącznie tokenów mogli utrwalić zamiennik przed
  ponownym połączeniem. Rotacje współdzielone/administracyjne nie zwracają tokena okaziciela.
- Wydawanie, rotacja i unieważnianie tokenów pozostają ograniczone do zatwierdzonego zestawu ról
  zapisanego we wpisie parowania tego urządzenia; mutacja tokena nie może rozszerzyć ani
  wskazać roli urządzenia, której zatwierdzenie parowania nigdy nie przyznało.
- W przypadku sesji tokenów sparowanych urządzeń zarządzanie urządzeniem jest samoograniczone, chyba że
  wywołujący ma także `operator.admin`: wywołujący niebędący administratorem mogą zarządzać wyłącznie
  tokenem operatora dla wpisu **własnego** urządzenia. Zarządzanie tokenami węzła i innymi
  tokenami niebędącymi operatorami jest dostępne tylko dla administratora, nawet dla własnego urządzenia wywołującego.
- `device.token.rotate` i `device.token.revoke` sprawdzają także docelowy zestaw zakresów tokena
  operatora względem bieżących zakresów sesji wywołującego. Wywołujący niebędący administratorem
  nie mogą rotować ani unieważniać szerszego tokena operatora niż ten, który już mają.
- Błędy uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z tokenem per urządzenie z pamięci podręcznej.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownych połączeń i pokazać operatorowi wskazówki działania.
- `AUTH_SCOPE_MISMATCH` oznacza, że token urządzenia został rozpoznany, ale nie obejmuje
  żądanej roli/zakresów. Klienci nie powinni przedstawiać tego jako złego tokena;
  poproś operatora o ponowne sparowanie albo zatwierdzenie węższego/szerszego kontraktu zakresów.

## Tożsamość urządzenia + parowanie

- Węzły powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  odcisku palca pary kluczy.
- Gateway wydaje tokeny per urządzenie + rola.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączono lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania koncentruje się na bezpośrednich połączeniach lokalnych local loopback.
- OpenClaw ma także wąską ścieżkę samopołączenia lokalnego dla backendu/kontenera na potrzeby
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia tailnet albo LAN z tego samego hosta nadal są traktowane jako zdalne na potrzeby parowania i
  wymagają zatwierdzenia.
- Klienci WS zwykle zawierają tożsamość `device` podczas `connect` (operator +
  węzeł). Jedynymi wyjątkami operatora bez urządzenia są jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności niezabezpieczonego HTTP tylko na localhost.
  - pomyślne uwierzytelnienie operatora Control UI w `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tryb awaryjny, poważne obniżenie bezpieczeństwa).
  - RPC backendu `gateway-client` przez direct-loopback na zarezerwowanej wewnętrznej
    ścieżce pomocniczej.
- Pominięcie tożsamości urządzenia ma konsekwencje dla zakresu. Gdy połączenie operatora
  bez urządzenia jest dozwolone przez jawną ścieżkę zaufania, OpenClaw nadal czyści
  samodzielnie zadeklarowane zakresy do pustego zestawu, chyba że ta ścieżka ma nazwany
  wyjątek zachowania zakresu. Metody ograniczone zakresem kończą się wtedy błędem
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` to ścieżka zachowania zakresu w Control UI
  dla trybu awaryjnego. Nie przyznaje zakresów dowolnym
  niestandardowym klientom WebSocket o kształcie backendu albo CLI.
- Zarezerwowana ścieżka pomocnicza backendu `gateway-client` przez direct-loopback zachowuje
  zakresy tylko dla wewnętrznych lokalnych RPC płaszczyzny sterowania; niestandardowe identyfikatory backendu nie
  otrzymują tego wyjątku.
- Wszystkie połączenia muszą podpisać dostarczony przez serwer nonce `connect.challenge`.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed challenge, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` w `error.details.code` ze stabilnym `error.details.reason`.

Typowe niepowodzenia migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (albo wysłał pusty). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał z przestarzałym/błędnym nonce.    |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Podpisany znacznik czasu jest poza dozwolonym odchyleniem. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do odcisku palca klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalizacja klucza publicznego nie powiodła się. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisuj ładunek v2, który zawiera nonce serwera.
- Wyślij ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól urządzenia/klienta/roli/zakresów/tokenu/nonce.
- Starsze podpisy `v2` pozostają akceptowane dla zgodności, ale przypięcie metadanych
  sparowanego urządzenia nadal kontroluje politykę poleceń przy ponownym połączeniu.

## TLS + przypinanie

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk palca certyfikatu Gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` albo CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API Gateway** (status, kanały, modele, czat,
agent, sesje, węzły, zatwierdzenia itd.). Dokładny zakres jest definiowany przez
schematy TypeBox w `packages/gateway-protocol/src/schema.ts`.

## Powiązane

- [Protokół Bridge](/pl/gateway/bridge-protocol)
- [Runbook Gateway](/pl/gateway)
