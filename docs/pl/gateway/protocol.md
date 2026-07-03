---
read_when:
    - Implementowanie lub aktualizowanie klientów WS Gateway
    - Debugowanie niezgodności protokołu lub błędów połączenia
    - Regenerowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie połączenia, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-07-03T17:45:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 815ac729824587579d112d665df2060d84d2894b4d46235e210804ca8a07082d
    source_path: gateway/protocol.md
    workflow: 16
---

Protokół WS Gateway jest **jedną płaszczyzną sterowania + transportem węzłów** dla
OpenClaw. Wszyscy klienci (CLI, web UI, aplikacja macOS, węzły iOS/Android, węzły
headless) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres** podczas
uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwszą ramką **musi** być żądanie `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po udanym uzgodnieniu połączenia klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Przy włączonej diagnostyce
  zbyt duże ramki przychodzące i wolne bufory wychodzące emitują zdarzenia `payload.large`,
  zanim Gateway zamknie lub odrzuci objętą nimi ramkę. Te zdarzenia zachowują
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
`"startup-sidecars"` oraz `retryAfterMs`. Klienci powinni ponowić taką odpowiedź
w ramach swojego ogólnego budżetu połączenia, zamiast prezentować ją jako końcową
awarię uzgadniania połączenia.

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` również jest wymagane i raportuje
wynegocjowaną rolę/zakresy. `pluginSurfaceUrls` jest opcjonalne i mapuje nazwy powierzchni
Plugin, takie jak `canvas`, na zakresowe hostowane URL-e.

Zakresowe URL-e powierzchni Plugin mogą wygasać. Węzły mogą wywołać
`node.pluginSurface.refresh` z `{ "surface": "canvas" }`, aby otrzymać świeży
wpis w `pluginSurfaceUrls`. Eksperymentalna refaktoryzacja Plugin Canvas nie
obsługuje przestarzałej ścieżki zgodności `canvasHostUrl`, `canvasCapability` ani
`node.canvas.capability.refresh`; aktualni klienci natywni i Gateway muszą używać powierzchni Plugin.

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
`client.mode: "backend"`) mogą pomijać `device` przy bezpośrednich połączeniach local loopback,
gdy uwierzytelniają się współdzielonym tokenem/hasłem Gateway. Ta ścieżka jest zarezerwowana
dla wewnętrznych RPC płaszczyzny sterowania i zapobiega blokowaniu lokalnej pracy backendu,
takiej jak aktualizacje sesji subagentów, przez nieaktualne bazowe parowania CLI/urządzenia.
Klienci zdalni, klienci z originu przeglądarki, klienci węzłów oraz jawni klienci
tokenów urządzeń/tożsamości urządzeń nadal używają normalnych kontroli parowania i podnoszenia zakresu.

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

Wbudowany bootstrap kodu QR/kodu konfiguracji jest świeżą ścieżką przekazania mobilnego.
Udane połączenie bazowe z kodem konfiguracji zwraca główny token węzła oraz jeden ograniczony
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
mobilną pętlę operatora i ukończyć konfigurację natywną bez nadawania zakresów
mutacji parowania ani `operator.admin`. Obejmuje `operator.talk.secrets`, aby
klient natywny mógł odczytać potrzebną mu po bootstrapie konfigurację Talk. Szerszy
dostęp do parowania i administracji wymaga osobnego zatwierdzonego parowania operatora lub przepływu tokenu.
Klienci powinni utrwalać
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

Metody wywołujące skutki uboczne wymagają **kluczy idempotencji** (zobacz schemat).

## Role + zakresy

Pełny model zakresów operatora, kontrole w czasie zatwierdzania i semantykę współdzielonych sekretów
opisuje [Zakresy operatora](/pl/gateway/operator-scopes).

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
Gdy sekrety są uwzględnione, klienci powinni odczytywać poświadczenie aktywnego dostawcy Talk
z `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
pozostaje w kształcie źródłowym i może być obiektem SecretRef albo zredagowanym ciągiem.

Metody RPC Gateway zarejestrowane przez Plugin mogą żądać własnego zakresu operatora, ale
zarezerwowane główne prefiksy administracyjne (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze rozwiązują się do `operator.admin`.

Zakres metody jest tylko pierwszą bramką. Niektóre polecenia slash dostępne przez
`chat.send` nakładają dodatkowe, surowsze kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w czasie zatwierdzania oprócz
bazowego zakresu metody:

- żądania bez poleceń: `operator.pairing`
- żądania z poleceniami węzła innymi niż exec: `operator.pairing` + `operator.write`
- żądania obejmujące `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Możliwości/polecenia/uprawnienia (węzeł)

Węzły deklarują roszczenia możliwości podczas połączenia:

- `caps`: kategorie możliwości wysokiego poziomu, takie jak `camera`, `canvas`, `screen`,
  `location`, `voice` i `talk`.
- `commands`: lista dozwolonych poleceń dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i egzekwuje listy dozwolonych po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy obecności obejmują `deviceId`, `roles` i `scopes`, aby UI mogły pokazać jeden wiersz na urządzenie
  nawet wtedy, gdy łączy się ono zarówno jako **operator**, jak i **node**.
- `node.list` obejmuje opcjonalne pola `lastSeenAtMs` i `lastSeenReason`. Połączone węzły raportują
  czas bieżącego połączenia jako `lastSeenAtMs` z przyczyną `connect`; sparowane węzły mogą także raportować
  trwałą obecność w tle, gdy zaufane zdarzenie węzła aktualizuje ich metadane parowania.

### Zdarzenie aktywności węzła w tle

Węzły mogą wywołać `node.event` z `event: "node.presence.alive"`, aby zarejestrować, że sparowany węzeł był
aktywny podczas wybudzenia w tle, bez oznaczania go jako połączonego.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` jest zamkniętym enumem: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` lub `connect`. Nieznane ciągi wyzwalacza są normalizowane do
`background` przez Gateway przed utrwaleniem. Zdarzenie jest trwałe tylko dla uwierzytelnionych sesji
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

## Zakresowanie zdarzeń rozgłoszeniowych

Zdarzenia rozgłoszeniowe WebSocket wypychane przez serwer są bramkowane zakresami, aby sesje ograniczone do parowania lub tylko węzłów nie odbierały pasywnie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Zdefiniowane przez Plugin rozgłoszenia `plugin.*`** są bramkowane do `operator.write` albo `operator.admin`, w zależności od tego, jak Plugin je zarejestrował.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia połączenia/rozłączenia itd.) pozostają nieograniczone, aby stan transportu był widoczny dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń rozgłoszeniowych** są domyślnie bramkowane zakresami (fail-closed), chyba że zarejestrowany handler jawnie je poluzuje.

Każde połączenie klienta utrzymuje własny numer sekwencyjny na klienta, więc rozgłoszenia zachowują monotoniczne uporządkowanie na tym gnieździe nawet wtedy, gdy różni klienci widzą różne, przefiltrowane według zakresu podzbiory strumienia zdarzeń.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż powyższe przykłady uzgadniania połączenia/uwierzytelniania. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` jest konserwatywną
listą odkrywania zbudowaną z `src/gateway/server-methods-list.ts` oraz załadowanych
eksportów metod Plugin/kanału. Traktuj ją jako odkrywanie funkcji, a nie pełne
wyliczenie `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System i tożsamość">
    - `health` zwraca buforowaną lub świeżo sprawdzoną migawkę kondycji gateway.
    - `diagnostics.stability` zwraca ostatni, ograniczony rejestrator stabilności diagnostycznej. Przechowuje metadane operacyjne, takie jak nazwy zdarzeń, liczby wystąpień, rozmiary w bajtach, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów i identyfikatory sesji. Nie przechowuje tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, plików cookie ani wartości tajnych. Wymagany jest zakres odczytu operatora.
    - `status` zwraca podsumowanie gateway w stylu `/status`; pola wrażliwe są uwzględniane tylko dla klientów operatora z zakresem administratora.
    - `gateway.identity.get` zwraca tożsamość urządzenia gateway używaną przez przepływy relay i parowania.
    - `system-presence` zwraca bieżącą migawkę obecności połączonych urządzeń operatora/węzła.
    - `system-event` dołącza zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
    - `last-heartbeat` zwraca najnowsze utrwalone zdarzenie heartbeat.
    - `set-heartbeats` przełącza przetwarzanie heartbeat w gateway.

  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolonych w czasie wykonywania. Przekaż `{ "view": "configured" }` dla skonfigurowanych modeli o rozmiarze odpowiednim dla selektora (`agents.defaults.models` najpierw, potem `models.providers.*.models`), albo `{ "view": "all" }` dla pełnego katalogu.
    - `usage.status` zwraca okna użycia dostawców/podsumowania pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
      Przekaż `agentId` dla jednego agenta albo `agentScope: "all"`, aby zagregować skonfigurowanych agentów.
    - `doctor.memory.status` zwraca gotowość pamięci wektorowej / buforowanych embeddingów dla aktywnej domyślnej przestrzeni roboczej agenta. Przekaż `{ "probe": true }` albo `{ "deep": true }` tylko wtedy, gdy wywołujący jawnie chce wykonać aktywny ping dostawcy embeddingów. Klienci świadomi Dreaming mogą też przekazać `{ "agentId": "agent-id" }`, aby ograniczyć statystyki magazynu Dreaming do wybranej przestrzeni roboczej agenta; pominięcie `agentId` zachowuje fallback domyślnego agenta i agreguje skonfigurowane przestrzenie robocze Dreaming.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` i `doctor.memory.dedupeDreamDiary` przyjmują opcjonalne parametry `{ "agentId": "agent-id" }` dla widoków/akcji Dreaming wybranego agenta. Gdy `agentId` jest pominięty, działają na skonfigurowanej domyślnej przestrzeni roboczej agenta.
    - `doctor.memory.remHarness` zwraca ograniczony, tylko do odczytu podgląd harnessu REM dla zdalnych klientów płaszczyzny sterowania. Może zawierać ścieżki przestrzeni roboczej, fragmenty pamięci, wyrenderowany grounded markdown i kandydatów do głębokiej promocji, więc wywołujący potrzebują `operator.read`.
    - `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji. Przekaż `agentId` dla jednego
      agenta albo `agentScope: "all"`, aby wyświetlić skonfigurowanych agentów razem.
    - `sessions.usage.timeseries` zwraca użycie szeregów czasowych dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Kanały i pomocniki logowania">
    - `channels.status` zwraca wbudowane + dołączone podsumowania stanu kanałów/pluginów.
    - `channels.logout` wylogowuje określony kanał/konto tam, gdzie kanał obsługuje wylogowanie.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i po powodzeniu uruchamia kanał.
    - `push.test` wysyła testowy push APNs do zarejestrowanego węzła iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słowa wybudzającego.
    - `voicewake.set` aktualizuje wyzwalacze słowa wybudzającego i rozgłasza zmianę.

  </Accordion>

  <Accordion title="Wiadomości i dzienniki">
    - `send` to bezpośrednie RPC dostarczania wychodzącego dla wysyłek kierowanych do kanału/konta/wątku poza runnerem czatu.
    - `logs.tail` zwraca skonfigurowany ogon dziennika plikowego gateway z kontrolą kursora/limitu i maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Talk i TTS">
    - `talk.catalog` zwraca tylko do odczytu katalog dostawców Talk dla mowy, transkrypcji strumieniowej i głosu w czasie rzeczywistym. Obejmuje kanoniczne identyfikatory dostawców, aliasy rejestru, etykiety, stan skonfigurowania, opcjonalny wynik `ready` na poziomie grupy, ujawnione identyfikatory modeli/głosów, tryby kanoniczne, transporty, strategie mózgu oraz flagi audio/możliwości czasu rzeczywistego bez zwracania sekretów dostawcy ani mutowania globalnej konfiguracji. Bieżące Gateway ustawiają `ready` po zastosowaniu wyboru dostawcy w czasie wykonywania; klienci powinni traktować jego brak jako niezweryfikowany dla zgodności ze starszymi Gateway.
    - `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (albo `operator.admin`).
    - `talk.session.create` tworzy sesję Talk należącą do Gateway dla `realtime/gateway-relay`, `transcription/gateway-relay` albo `stt-tts/managed-room`. Dla `stt-tts/managed-room` wywołujący z `operator.write`, którzy przekazują `sessionKey`, muszą też przekazać `spawnedBy` dla ograniczonej widoczności klucza sesji; tworzenie nieograniczonego `sessionKey` i `brain: "direct-tools"` wymaga `operator.admin`.
    - `talk.session.join` sprawdza poprawność tokenu sesji managed-room, emituje zdarzenia `session.ready` albo `session.replaced` w razie potrzeby i zwraca metadane pokoju/sesji oraz ostatnie zdarzenia Talk bez tokenu w postaci jawnej ani zapisanego skrótu tokenu.
    - `talk.session.appendAudio` dołącza wejściowy dźwięk PCM zakodowany w base64 do należących do Gateway sesji relay czasu rzeczywistego i transkrypcji.
    - `talk.session.startTurn`, `talk.session.endTurn` i `talk.session.cancelTurn` sterują cyklem życia tury managed-room z odrzucaniem przestarzałej tury przed wyczyszczeniem stanu.
    - `talk.session.cancelOutput` zatrzymuje wyjściowy dźwięk asystenta, głównie dla przerwania wypowiedzi bramkowanego przez VAD w sesjach Gateway relay.
    - `talk.session.submitToolResult` kończy wywołanie narzędzia dostawcy wyemitowane przez należącą do Gateway sesję relay czasu rzeczywistego. Przekaż `options: { willContinue: true }` dla tymczasowego wyniku narzędzia, gdy końcowy wynik nastąpi później, albo `options: { suppressResponse: true }`, gdy wynik narzędzia ma zaspokoić wywołanie dostawcy bez uruchamiania kolejnej odpowiedzi asystenta czasu rzeczywistego.
    - `talk.session.steer` wysyła sterowanie głosowe aktywnego przebiegu do należącej do Gateway sesji Talk wspieranej przez agenta. Przyjmuje `{ sessionId, text, mode? }`, gdzie `mode` to `status`, `steer`, `cancel` albo `followup`; pominięty tryb jest klasyfikowany na podstawie wypowiedzianego tekstu.
    - `talk.session.close` zamyka należącą do Gateway sesję relay, transkrypcji albo managed-room i emituje terminalne zdarzenia Talk.
    - `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów WebChat/Control UI.
    - `talk.client.create` tworzy należącą do klienta sesję dostawcy czasu rzeczywistego przy użyciu `webrtc` albo `provider-websocket`, podczas gdy Gateway posiada konfigurację, poświadczenia, instrukcje i politykę narzędzi.
    - `talk.client.toolCall` pozwala należącym do klienta transportom czasu rzeczywistego przekazywać wywołania narzędzi dostawcy do polityki Gateway. Pierwszym obsługiwanym narzędziem jest `openclaw_agent_consult`; klienci otrzymują identyfikator przebiegu i czekają na normalne zdarzenia cyklu życia czatu przed przesłaniem specyficznego dla dostawcy wyniku narzędzia.
    - `talk.client.steer` wysyła sterowanie głosowe aktywnego przebiegu dla należących do klienta transportów czasu rzeczywistego. Gateway rozwiązuje aktywny osadzony przebieg z `sessionKey` i zwraca ustrukturyzowany wynik zaakceptowano/odrzucono zamiast po cichu porzucać sterowanie.
    - `talk.event` to pojedynczy kanał zdarzeń Talk dla adapterów czasu rzeczywistego, transkrypcji, STT/TTS, managed-room, telefonii i spotkań.
    - `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców fallback i stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny spis dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRefs i zamienia stan sekretów w czasie wykonywania tylko po pełnym powodzeniu.
    - `secrets.resolve` rozwiązuje przypisania sekretów kierowanych do poleceń dla określonego zestawu poleceń/celów.
    - `config.get` zwraca bieżącą migawkę konfiguracji i hash.
    - `config.set` zapisuje zweryfikowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji. Destrukcyjne zastąpienie tablicy
      wymaga ścieżki, której dotyczy zmiana, w `replacePaths`; zagnieżdżone tablice
      pod wpisami tablicy używają ścieżek `[]`, takich jak `agents.list[].skills`.
    - `config.apply` sprawdza poprawność + zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca aktywny ładunek schematu konfiguracji używany przez narzędzia Control UI i CLI: schema, `uiHints`, wersję i metadane generowania, w tym metadane schematów pluginu + kanału, gdy runtime może je załadować. Schemat obejmuje metadane pól `title` / `description` pochodzące z tych samych etykiet i tekstu pomocy, których używa UI, w tym zagnieżdżone gałęzie obiektów, wildcardów, elementów tablicy oraz kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pola.
    - `config.schema.lookup` zwraca ładunek wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę + `hintPath`, opcjonalne `reloadKind` oraz bezpośrednie podsumowania potomków dla przechodzenia w głąb w UI/CLI. `reloadKind` jest jednym z `restart`, `hot` albo `none` i odzwierciedla planer przeładowania konfiguracji Gateway dla żądanej ścieżki. Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika i typowe pola walidacji (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia liczby/stringu/tablicy/obiektu oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania potomków ujawniają `key`, znormalizowaną `path`, `type`, `required`, `hasChildren`, opcjonalne `reloadKind`, a także dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji gateway i planuje restart tylko wtedy, gdy sama aktualizacja się powiodła; wywołujący z sesją mogą dołączyć `continuationMessage`, aby po uruchomieniu wznowić jedną następną turę agenta przez kolejkę kontynuacji restartu. Aktualizacje menedżera pakietów i nadzorowane aktualizacje git-checkout z płaszczyzny sterowania używają odłączonego przekazania do usługi zarządzanej zamiast zastępować drzewo pakietów albo mutować checkout/wynik builda wewnątrz działającego Gateway. Rozpoczęte przekazanie zwraca `ok: true` z `result.reason: "managed-service-handoff-started"` i `handoff.status: "started"`; niedostępne lub nieudane przekazania zwracają `ok: false` z `managed-service-handoff-unavailable` albo `managed-service-handoff-failed`, plus `handoff.command`, gdy wymagana jest ręczna aktualizacja w powłoce. Niedostępne przekazanie oznacza, że OpenClaw nie ma bezpiecznej granicy nadzorcy ani trwałej tożsamości usługi, takiej jak `OPENCLAW_SYSTEMD_UNIT` dla systemd. Podczas rozpoczętego przekazania sentinel restartu może krótko zgłaszać `stats.reason: "restart-health-pending"`; kontynuacja jest opóźniana, dopóki CLI nie zweryfikuje zrestartowanego Gateway i nie zapisze końcowego sentinela `ok`.
    - `update.status` odświeża i zwraca najnowszego sentinela restartu aktualizacji, w tym wersję działającą po restarcie, gdy jest dostępna.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator onboardingu przez WS RPC.

  </Accordion>

  <Accordion title="Pomocnicze funkcje agentów i obszarów roboczych">
    - `agents.list` zwraca skonfigurowane wpisy agentów, w tym efektywny model i metadane środowiska uruchomieniowego.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów oraz podłączeniem obszaru roboczego.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami startowymi obszaru roboczego udostępnianymi agentowi.
    - `tasks.list`, `tasks.get` i `tasks.cancel` udostępniają rejestr zadań Gateway klientom SDK i operatorskim.
    - `artifacts.list`, `artifacts.get` i `artifacts.download` udostępniają podsumowania artefaktów pochodzących z transkrypcji oraz pobieranie dla jawnego zakresu `sessionKey`, `runId` lub `taskId`. Zapytania o uruchomienia i zadania rozpoznają sesję właścicielską po stronie serwera i zwracają tylko media transkrypcji z pasującą proweniencją; niebezpieczne lub lokalne źródła URL zwracają nieobsługiwane pobrania zamiast pobierania po stronie serwera.
    - `environments.list` i `environments.status` udostępniają klientom SDK wykrywanie środowisk lokalnych dla Gateway i środowisk Node w trybie tylko do odczytu.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcową migawkę, gdy jest dostępna.

  </Accordion>

  <Accordion title="Sterowanie sesją">
    - `sessions.list` zwraca bieżący indeks sesji, w tym metadane `agentRuntime` dla każdego wiersza, gdy skonfigurowano backend środowiska uruchomieniowego agenta.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkrypcji/wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkrypcji dla określonych kluczy sesji.
    - `sessions.describe` zwraca jeden wiersz sesji Gateway dla dokładnego klucza sesji.
    - `sessions.resolve` rozpoznaje lub kanonizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant przerwania i pokierowania dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji. Wywołujący może przekazać `key` oraz opcjonalne `runId` albo przekazać samo `runId` dla aktywnych uruchomień, które Gateway może rozpoznać jako należące do sesji.
    - `sessions.patch` aktualizuje metadane/nadpisania sesji i raportuje rozpoznany kanoniczny model oraz efektywny `agentRuntime`.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują obsługę konserwacyjną sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest normalizowane pod kątem wyświetlania dla klientów UI: wbudowane tagi dyrektyw są usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w zwykłym tekście (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi) i ujawnione tokeny sterowania modelem ASCII/pełnej szerokości są usuwane, pomijane są wiersze asystenta zawierające wyłącznie ciche tokeny, takie jak dokładne `NO_REPLY` / `no_reply`, a zbyt duże wiersze mogą zostać zastąpione placeholderami.
    - `chat.message.get` to addytywny, ograniczony czytnik pełnej wiadomości dla pojedynczego widocznego wpisu transkrypcji. Klienci przekazują `sessionKey`, opcjonalne `agentId`, gdy wybór sesji jest ograniczony do agenta, oraz `messageId` transkrypcji wcześniej ujawniony przez `chat.history`, a Gateway zwraca tę samą projekcję normalizowaną pod kątem wyświetlania bez lekkiego limitu obcinania historii, gdy zapisany wpis jest nadal dostępny i nie jest zbyt duży.
    - `chat.send` akceptuje jednorazowe `fastMode: "auto"`, aby użyć trybu szybkiego dla wywołań modelu rozpoczętych przed automatycznym progiem odcięcia, a następnie uruchamiać późniejsze ponowienia, fallbacki, wyniki narzędzi lub kontynuacje bez trybu szybkiego. Próg odcięcia domyślnie wynosi 60 sekund i można go skonfigurować per model za pomocą `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Wywołujący `chat.send` może przekazać jednorazowe `fastAutoOnSeconds`, aby nadpisać próg odcięcia dla tego żądania.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.

  </Accordion>

  <Accordion title="Parowanie Node, wywoływanie i oczekująca praca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` i `node.pair.verify` obejmują parowanie Node i weryfikację startową.
    - `node.list` i `node.describe` zwracają stan znanych/połączonych Node.
    - `node.rename` aktualizuje etykietę sparowanego Node.
    - `node.invoke` przekazuje polecenie do połączonego Node.
    - `node.invoke.result` zwraca wynik żądania wywołania.
    - `node.event` przenosi zdarzenia pochodzące z Node z powrotem do gateway.
    - `node.pending.pull` i `node.pending.ack` to API kolejki połączonego Node.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą dla Node offline/rozłączonych.

  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia exec oraz wyszukiwanie/odtwarzanie oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie exec i zwraca ostateczną decyzję (lub `null` po przekroczeniu limitu czasu).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają migawkami polityki zatwierdzania exec w gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną dla Node polityką zatwierdzania exec za pomocą poleceń przekaźnika Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują przepływy zatwierdzania zdefiniowane przez Plugin.

  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe lub przy następnym Heartbeat wstrzyknięcie tekstu pobudki; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - `cron.run` pozostaje RPC w stylu dodania do kolejki dla ręcznych uruchomień. Klienci, którzy potrzebują semantyki ukończenia, powinni odczytać zwrócone `runId` i odpytywać `cron.runs`.
    - `cron.runs` akceptuje opcjonalny niepusty filtr `runId`, dzięki czemu klienci mogą śledzić jedno zakolejkowane ręczne uruchomienie bez wyścigu z innymi wpisami historii dla tego samego zadania.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject`, oraz inne zdarzenia czatu dotyczące wyłącznie transkrypcji. W protokole v4 ładunki delta przenoszą `deltaText`; `message` pozostaje skumulowaną migawką asystenta. Zastąpienia niebędące prefiksem ustawiają `replace=true` i używają `deltaText` jako tekstu zastępczego.
- `session.message`, `session.operation` i `session.tool`: aktualizacje transkrypcji, trwającej operacji sesji oraz strumienia zdarzeń dla subskrybowanej sesji.
- `sessions.changed`: zmieniono indeks sesji lub metadane.
- `presence`: aktualizacje migawki obecności systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja migawki kondycji gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania Cron.
- `shutdown`: powiadomienie o zamknięciu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania Node.
- `node.invoke.request`: rozgłoszenie żądania wywołania Node.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniono konfigurację wyzwalacza słowa wybudzającego.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia zatwierdzenia exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzenia Plugin.

### Metody pomocnicze Node

- Node mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych Skills na potrzeby kontroli automatycznego zezwalania.

### RPC rejestru zadań

Klienci operatorscy mogą sprawdzać i anulować rekordy zadań w tle Gateway za pomocą RPC rejestru zadań. Te metody zwracają oczyszczone podsumowania zadań, a nie surowy stan środowiska uruchomieniowego.

- `tasks.list` wymaga `operator.read`.
  - Parametry: opcjonalne `status` (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` lub `"timed_out"`) albo tablica tych statusów, opcjonalne `agentId`, opcjonalne `sessionKey`, opcjonalne `limit` od `1` do `500` oraz opcjonalny ciąg `cursor`.
  - Wynik: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` wymaga `operator.read`.
  - Parametry: `{ "taskId": string }`.
  - Wynik: `{ "task": TaskSummary }`.
  - Brakujące identyfikatory zadań zwracają kształt błędu not-found Gateway.
- `tasks.cancel` wymaga `operator.write`.
  - Parametry: `{ "taskId": string, "reason"?: string }`.
  - Wynik:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` raportuje, czy rejestr miał pasujące zadanie. `cancelled` raportuje, czy środowisko uruchomieniowe zaakceptowało lub zarejestrowało anulowanie.

`TaskSummary` zawiera `id`, `status` oraz opcjonalne metadane, takie jak `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, znaczniki czasu, postęp, podsumowanie końcowe i oczyszczony tekst błędu. `agentId` identyfikuje agenta wykonującego zadanie; `sessionKey` i `ownerKey` zachowują kontekst żądającego i sterowania.

### Metody pomocnicze operatora

- Operatorzy mogą wywołać `commands.list` (`operator.read`), aby pobrać inwentarz poleceń środowiska uruchomieniowego dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, do której powierzchni odnosi się podstawowe `name`:
    - `text` zwraca podstawowy token polecenia tekstowego bez początkowego `/`
    - `native` oraz domyślna ścieżka `both` zwracają natywne nazwy świadome dostawcy, gdy są dostępne
  - `textAliases` przenosi dokładne aliasy z ukośnikiem, takie jak `/model` i `/m`.
  - `nativeName` przenosi natywną nazwę polecenia świadomą dostawcy, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na natywne nazewnictwo oraz dostępność natywnych poleceń Plugin.
  - `includeArgs=false` pomija serializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywołać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi środowiska uruchomieniowego dla agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel Plugin, gdy `source="plugin"`
  - `optional`: czy narzędzie Plugin jest opcjonalne
- Operatorzy mogą wywołać `tools.effective` (`operator.read`), aby pobrać efektywny w środowisku uruchomieniowym inwentarz narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst środowiska uruchomieniowego po stronie serwera z sesji, zamiast akceptować kontekst uwierzytelniania lub dostarczania podany przez wywołującego.
  - Odpowiedź jest ograniczoną do sesji, wyprowadzoną po stronie serwera projekcją aktywnego inwentarza, obejmującą narzędzia rdzenia, Plugin, kanału oraz już wykrytych serwerów MCP.
  - `tools.effective` jest tylko do odczytu dla MCP: może przepuścić ciepły katalog MCP sesji przez końcową politykę narzędzi, ale nie tworzy środowisk uruchomieniowych MCP, nie łączy transportów ani nie wysyła `tools/list`. Jeśli nie istnieje pasujący ciepły katalog, odpowiedź może zawierać powiadomienie takie jak `mcp-not-yet-connected`, `mcp-not-yet-listed` lub `mcp-stale-catalog`.
  - Efektywne wpisy narzędzi używają `source="core"`, `source="plugin"`, `source="channel"` lub `source="mcp"`.
- Operatorzy mogą wywołać `tools.invoke` (`operator.write`), aby uruchomić jedno dostępne narzędzie przez tę samą ścieżkę polityki Gateway co `/tools/invoke`.
  - `name` jest wymagane. `args`, `sessionKey`, `agentId`, `confirm` i `idempotencyKey` są opcjonalne.
  - Jeśli obecne są zarówno `sessionKey`, jak i `agentId`, rozwiązany agent sesji musi odpowiadać `agentId`.
  - Wrappery rdzenia tylko dla właściciela, takie jak `cron`, `gateway` i `nodes`, wymagają tożsamości właściciela/administratora (`operator.admin`), mimo że sama metoda `tools.invoke` ma zakres `operator.write`.
  - Odpowiedź jest kopertą skierowaną do SDK z polami `ok`, `toolName`, opcjonalnym `output` oraz typowanymi polami `error`. Odmowy zatwierdzenia lub polityki zwracają `ok:false` w ładunku, zamiast omijać potok polityki narzędzi Gateway.
- Operatorzy mogą wywołać `skills.status` (`operator.read`), aby pobrać widoczny inwentarz Skills dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywołać `skills.search` i `skills.detail` (`operator.read`) dla metadanych odkrywania ClawHub.
- Operatorzy mogą wywołać `skills.upload.begin`, `skills.upload.chunk` i `skills.upload.commit` (`operator.admin`), aby przygotować prywatne archiwum Skills przed jego instalacją. Jest to oddzielna ścieżka przesyłania administracyjnego dla zaufanych klientów, a nie normalny przepływ instalacji Skills z ClawHub, i jest domyślnie wyłączona, chyba że włączono `skills.install.allowUploadedArchives`.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    tworzy przesyłanie powiązane z tym slugiem i wartością force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` dołącza bajty pod dokładnym zdekodowanym przesunięciem.
  - `skills.upload.commit({ uploadId, sha256? })` weryfikuje końcowy rozmiar i SHA-256. Commit tylko finalizuje przesyłanie; nie instaluje Skills.
  - Przesłane archiwa Skills to archiwa zip zawierające katalog główny `SKILL.md`. Wewnętrzna nazwa katalogu archiwum nigdy nie wybiera celu instalacji.
- Operatorzy mogą wywołać `skills.install` (`operator.admin`) w trzech trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje folder Skills w katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb przesyłania: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instaluje zatwierdzone przesyłanie w katalogu `skills/<slug>` domyślnego obszaru roboczego agenta. Slug i wartość force muszą odpowiadać pierwotnemu żądaniu `skills.upload.begin`. Ten tryb jest odrzucany, chyba że włączono `skills.install.allowUploadedArchives`. Ustawienie nie wpływa na instalacje ClawHub.
  - Tryb instalatora Gateway: `{ name, installId, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście Gateway.
    Starsi klienci mogą nadal wysyłać `dangerouslyForceUnsafeInstall`; to pole jest przestarzałe, akceptowane tylko dla zgodności protokołu i ignorowane. Użyj `security.installPolicy` dla decyzji instalacyjnych należących do operatora.
- Operatorzy mogą wywołać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug albo wszystkie śledzone instalacje ClawHub w domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji łata wartości `skills.entries.<skillKey>`, takie jak `enabled`, `apiKey` i `env`.

### Widoki `models.list`

`models.list` akceptuje opcjonalny parametr `view`:

- Pominięty lub `"default"`: bieżące zachowanie środowiska uruchomieniowego. Jeśli skonfigurowano `agents.defaults.models`, odpowiedzią jest dozwolony katalog, w tym dynamicznie wykryte modele dla wpisów `provider/*`. W przeciwnym razie odpowiedzią jest pełny katalog Gateway.
- `"configured"`: zachowanie o rozmiarze odpowiednim dla selektora. Jeśli skonfigurowano `agents.defaults.models`, nadal ma pierwszeństwo, w tym odkrywanie ograniczone do dostawcy dla wpisów `provider/*`. Bez listy dozwolonych odpowiedź używa jawnych wpisów `models.providers.*.models`, wracając do pełnego katalogu tylko wtedy, gdy nie istnieją żadne skonfigurowane wiersze modeli.
- `"all"`: pełny katalog Gateway, z pominięciem `agents.defaults.models`. Używaj tego do diagnostyki i interfejsów odkrywania, a nie do zwykłych selektorów modeli.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, Gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozstrzygają je, wywołując `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node` żądanie `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane wywołania `node.invoke system.run` ponownie używają tego kanonicznego `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmodyfikuje `command`, `rawCommand`, `cwd`, `agentId` lub `sessionKey` między przygotowaniem a końcowym zatwierdzonym przekazaniem `system.run`, Gateway odrzuca uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Mechanizm zapasowy dostarczania agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczania wychodzącego.
- `bestEffortDeliver=false` utrzymuje ścisłe zachowanie: nierozwiązane lub wyłącznie wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na powrót do wykonania tylko w sesji, gdy nie można rozwiązać żadnej zewnętrznej dostarczalnej trasy (na przykład sesje wewnętrzne/webchat albo niejednoznaczne konfiguracje wielokanałowe).
- Końcowe wyniki `agent` mogą zawierać `result.deliveryStatus`, gdy zażądano dostarczania, używając tych samych statusów `sent`, `suppressed`, `partial_failed` i `failed`, które udokumentowano dla [`openclaw agent --json --deliver`](/pl/cli/agent#json-delivery-status).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `packages/gateway-protocol/src/version.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca zakresy, które nie zawierają jego bieżącego protokołu. Bieżący klienci i serwery wymagają protokołu v4.
- Schematy + modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości są stabilne w protokole v4 i stanowią oczekiwaną bazę dla klientów zewnętrznych.

| Stała                                     | Domyślna                                             | Źródło                                                                                     |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                  | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                  | `packages/gateway-protocol/src/version.ts`                                                 |
| Limit czasu żądania (na RPC)              | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Limit czasu preauth / connect-challenge   | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (config/env może zwiększyć sparowany budżet serwera/klienta) |
| Początkowy backoff ponownego połączenia   | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksymalny backoff ponownego połączenia   | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Ograniczenie szybkiej próby po zamknięciu device-token | `250` ms                                   | `src/gateway/client.ts`                                                                    |
| Okres karencji force-stop przed `terminate()` | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Domyślny limit czasu `stopAndWait()`      | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Domyślny interwał tick (przed `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                                                    |
| Zamknięcie po limicie czasu tick          | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                          |

Serwer ogłasza efektywne `policy.tickIntervalMs`, `policy.maxPayload` i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości zamiast domyślnych sprzed handshake.

## Uwierzytelnianie

- Uwierzytelnianie Gateway współdzielonym sekretem używa `connect.params.auth.token` albo
  `connect.params.auth.password`, w zależności od skonfigurowanego trybu uwierzytelniania.
- Tryby niosące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) albo tryb spoza local loopback
  `gateway.auth.mode: "trusted-proxy"`, spełniają kontrolę uwierzytelnienia połączenia na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatny ingress `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie połączenia
  współdzielonym sekretem; nie wystawiaj tego trybu na publiczny/niezaufany ingress.
- Po sparowaniu Gateway wydaje **token urządzenia** ograniczony do roli połączenia
  i zakresów. Jest zwracany w `hello-ok.auth.deviceToken` i powinien być
  utrwalony przez klienta na potrzeby przyszłych połączeń.
- Klienci powinni utrwalać główny `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne połączenie z tym **zapisanym** tokenem urządzenia powinno również ponownie użyć zapisanego
  zatwierdzonego zestawu zakresów dla tego tokenu. Zachowuje to dostęp read/probe/status,
  który został już przyznany, i zapobiega cichemu zawężaniu ponownych połączeń do
  węższego, niejawnego zakresu tylko dla administratora.
- Składanie uwierzytelniania połączenia po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest niezależne i zawsze przekazywane, gdy jest ustawione.
  - `auth.token` jest wypełniane według priorytetu: najpierw jawny token współdzielony,
    potem jawny `deviceToken`, a następnie zapisany token dla urządzenia (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żaden z powyższych elementów nie rozwiązał
    `auth.token`. Token współdzielony albo dowolny rozwiązany token urządzenia go tłumi.
  - Automatyczne promowanie zapisanego tokenu urządzenia przy jednorazowej
    ponownej próbie `AUTH_TOKEN_MISMATCH` jest ograniczone do **zaufanych punktów końcowych** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez pinningu się nie kwalifikuje.
- Wbudowany bootstrap kodem konfiguracji zwraca główny token węzła
  `hello-ok.auth.deviceToken` oraz ograniczony token operatora w
  `hello-ok.auth.deviceTokens` na potrzeby zaufanego przekazania na urządzenie mobilne. Token operatora
  obejmuje `operator.talk.secrets` do odczytów natywnej konfiguracji Talk, ale
  wyklucza zakresy mutacji parowania oraz `operator.admin`.
- Gdy bootstrap kodem konfiguracji niebędącym baseline czeka na zatwierdzenie, szczegóły `PAIRING_REQUIRED`
  obejmują `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  oraz `pauseReconnect: false`. Klienci powinni dalej ponawiać połączenie z tym samym
  tokenem bootstrapu, dopóki żądanie nie zostanie zatwierdzone albo token nie stanie się nieprawidłowy.
- Utrwalaj `hello-ok.auth.deviceTokens` tylko wtedy, gdy połączenie użyło uwierzytelniania bootstrap
  w zaufanym transporcie, takim jak `wss://` albo parowanie loopback/lokalne.
- Jeśli klient podaje **jawny** `deviceToken` albo jawne `scopes`, ten
  zestaw zakresów żądany przez wywołującego pozostaje autorytatywny; buforowane zakresy są
  ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokenu dla urządzenia.
- Tokeny urządzeń można rotować/odwoływać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`). Rotowanie lub
  odwoływanie tokenu węzła albo innej roli niebędącej operatorem wymaga również `operator.admin`.
- `device.token.rotate` zwraca metadane rotacji. Zwraca zamienny
  token bearer tylko dla wywołań z tego samego urządzenia, które są już uwierzytelnione tym
  tokenem urządzenia, dzięki czemu klienci używający wyłącznie tokenu mogą utrwalić zamiennik przed
  ponownym połączeniem. Rotacje współdzielone/admina nie zwracają tokenu bearer.
- Wydawanie, rotacja i odwoływanie tokenów pozostają ograniczone do zatwierdzonego zestawu ról
  zapisanego we wpisie parowania tego urządzenia; mutacja tokenu nie może rozszerzyć ani
  wskazać roli urządzenia, której zatwierdzenie parowania nigdy nie przyznało.
- W przypadku sesji tokenów sparowanych urządzeń zarządzanie urządzeniem jest ograniczone do siebie, chyba że
  wywołujący ma też `operator.admin`: wywołujący bez uprawnień admina mogą zarządzać tylko
  tokenem operatora dla **własnego** wpisu urządzenia. Zarządzanie tokenami węzła i innymi tokenami
  niebędącymi operatorami jest dostępne tylko dla admina, nawet dla własnego urządzenia wywołującego.
- `device.token.rotate` i `device.token.revoke` sprawdzają też zestaw zakresów docelowego
  tokenu operatora względem bieżących zakresów sesji wywołującego. Wywołujący bez uprawnień admina
  nie mogą rotować ani odwoływać szerszego tokenu operatora niż ten, który już posiadają.
- Niepowodzenia uwierzytelniania obejmują `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (wartość logiczna)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z buforowanym tokenem dla urządzenia.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać wskazówki dotyczące działania operatora.
- `AUTH_SCOPE_MISMATCH` oznacza, że token urządzenia został rozpoznany, ale nie obejmuje
  żądanej roli/zakresów. Klienci nie powinni przedstawiać tego jako błędnego tokenu;
  poproś operatora o ponowne sparowanie albo zatwierdzenie węższego/szerszego kontraktu zakresów.

## Tożsamość urządzenia + parowanie

- Węzły powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  odcisku klucza pary kluczy.
- Gateway wydaje tokeny per urządzenie + rola.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączono lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania koncentruje się na bezpośrednich połączeniach local loopback.
- OpenClaw ma również wąską ścieżkę samopołączenia lokalną dla backendu/kontenera dla
  zaufanych przepływów pomocniczych współdzielonego sekretu.
- Połączenia z tej samej maszyny w tailnecie albo LAN nadal są traktowane jako zdalne na potrzeby parowania i
  wymagają zatwierdzenia.
- Klienci WS zwykle dołączają tożsamość `device` podczas `connect` (operator +
  węzeł). Jedynymi wyjątkami operatora bez urządzenia są jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności niezabezpieczonego HTTP tylko na localhost.
  - udane uwierzytelnienie operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tryb awaryjny, poważne obniżenie bezpieczeństwa).
  - bezpośrednie RPC backendu `gateway-client` przez loopback na zarezerwowanej wewnętrznej
    ścieżce pomocniczej.
- Pominięcie tożsamości urządzenia ma konsekwencje dla zakresów. Gdy połączenie operatora
  bez urządzenia jest dopuszczone przez jawną ścieżkę zaufania, OpenClaw nadal czyści
  samodzielnie zadeklarowane zakresy do pustego zestawu, chyba że ta ścieżka ma nazwaną
  wyjątkową regułę zachowania zakresów. Metody bramkowane zakresem kończą się wtedy niepowodzeniem
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` to ścieżka awaryjnego zachowania zakresów Control UI.
  Nie przyznaje zakresów dowolnym niestandardowym backendom ani klientom WebSocket w kształcie CLI.
- Zarezerwowana bezpośrednia ścieżka pomocnicza backendu `gateway-client` przez loopback zachowuje
  zakresy tylko dla wewnętrznych lokalnych RPC płaszczyzny sterowania; niestandardowe identyfikatory backendu nie
  otrzymują tego wyjątku.
- Wszystkie połączenia muszą podpisać nonce `connect.challenge` podany przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed challenge, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` w `error.details.code` ze stabilnym `error.details.reason`.

Typowe niepowodzenia migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (albo wysłał pusty). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał z przestarzałym/błędnym nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Podpisany znacznik czasu jest poza dozwolonym odchyleniem. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do odcisku klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalizacja klucza publicznego nie powiodła się. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisz ładunek v2, który zawiera nonce serwera.
- Wyślij ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól device/client/role/scopes/token/nonce.
- Starsze podpisy `v2` pozostają akceptowane ze względu na zgodność, ale przypinanie metadanych
  sparowanego urządzenia nadal steruje polityką poleceń przy ponownym połączeniu.

## TLS + pinning

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk certyfikatu gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` albo CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API gateway** (status, kanały, modele, czat,
agent, sesje, węzły, zatwierdzenia itd.). Dokładna powierzchnia jest definiowana przez
schematy TypeBox w `packages/gateway-protocol/src/schema.ts`.

## Powiązane

- [Protokół mostu](/pl/gateway/bridge-protocol)
- [Runbook Gateway](/pl/gateway)
