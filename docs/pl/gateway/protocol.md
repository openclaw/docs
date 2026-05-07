---
read_when:
    - Implementowanie lub aktualizowanie klientów WS Gateway
    - Debugowanie niezgodności protokołu lub niepowodzeń połączenia
    - Ponowne generowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie połączenia, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-05-07T13:17:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

Protokół Gateway WS jest **pojedynczą płaszczyzną sterowania + transportem Node** dla
OpenClaw. Wszyscy klienci (CLI, web UI, aplikacja macOS, Node iOS/Android, bezgłowe
Node) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres** podczas
handshake.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po udanym handshake klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Przy włączonej diagnostyce
  zbyt duże ramki przychodzące i wolne bufory wychodzące emitują zdarzenia
  `payload.large`, zanim gateway zamknie lub odrzuci dotkniętą ramkę. Te zdarzenia
  zachowują rozmiary, limity, powierzchnie i bezpieczne kody przyczyn. Nie zachowują treści
  wiadomości, zawartości załączników, surowej treści ramki, tokenów, plików cookie ani wartości tajnych.

## Handshake (connect)

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
    "minProtocol": 4,
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
awarię handshake.

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`src/gateway/protocol/schema/frames.ts`). `auth` także jest wymagane i raportuje
wynegocjowaną rolę/zakresy. `pluginSurfaceUrls` jest opcjonalne i mapuje nazwy powierzchni
Plugin, takie jak `canvas`, na zakresowe hostowane adresy URL.

Zakresowe adresy URL powierzchni Plugin mogą wygasać. Node mogą wywołać
`node.pluginSurface.refresh` z `{ "surface": "canvas" }`, aby otrzymać świeży
wpis w `pluginSurfaceUrls`. Eksperymentalna refaktoryzacja Plugin Canvas nie
obsługuje przestarzałej ścieżki zgodności `canvasHostUrl`, `canvasCapability` ani
`node.canvas.capability.refresh`; aktualni klienci natywni i gatewaye muszą używać powierzchni Plugin.

Gdy nie wydano tokena urządzenia, `hello-ok.auth` raportuje wynegocjowane
uprawnienia bez pól tokena:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Zaufani klienci backendu w tym samym procesie (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogą pominąć `device` na bezpośrednich połączeniach loopback,
gdy uwierzytelniają się współdzielonym tokenem/hasłem gatewaya. Ta ścieżka jest zarezerwowana
dla wewnętrznych RPC płaszczyzny sterowania i sprawia, że nieaktualne bazowe powiązania CLI/urządzenia
nie blokują lokalnej pracy backendu, takiej jak aktualizacje sesji subagentów. Zdalni klienci,
klienci z pochodzenia przeglądarkowego, klienci Node oraz jawni klienci tokenów urządzeń/tożsamości urządzeń
nadal używają normalnych kontroli parowania i podwyższania zakresu.

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

Podczas zaufanego przekazania bootstrap, `hello-ok.auth` może także zawierać dodatkowe
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

Dla wbudowanego przepływu bootstrap Node/operator główny token Node pozostaje
`scopes: []`, a każdy przekazany token operatora pozostaje ograniczony do listy dozwolonych zakresów operatora bootstrap
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kontrole zakresu bootstrap pozostają
prefiksowane rolą: wpisy operatora spełniają tylko żądania operatora, a role inne niż operator
nadal potrzebują zakresów pod własnym prefiksem roli.

### Przykład Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
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

Metody powodujące skutki uboczne wymagają **kluczy idempotencji** (zobacz schemat).

## Role + zakresy

Pełny model zakresów operatora, kontrole w czasie zatwierdzania i semantyka
współdzielonych sekretów są opisane w [Zakresach operatora](/pl/gateway/operator-scopes).

### Role

- `operator` = klient płaszczyzny sterowania (CLI/UI/automatyzacja).
- `node` = host funkcji (kamera/ekran/canvas/system.run).

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

Metody RPC gatewaya zarejestrowane przez Plugin mogą żądać własnego zakresu operatora, ale
zarezerwowane prefiksy administracyjne rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze rozwiązywane są do `operator.admin`.

Zakres metody jest tylko pierwszą bramką. Niektóre polecenia slash dostępne przez
`chat.send` nakładają dodatkowo bardziej rygorystyczne kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w czasie zatwierdzania oprócz
bazowego zakresu metody:

- żądania bez polecenia: `operator.pairing`
- żądania z poleceniami Node innymi niż exec: `operator.pairing` + `operator.write`
- żądania zawierające `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Funkcje/polecenia/uprawnienia (Node)

Node deklarują roszczenia dotyczące funkcji podczas połączenia:

- `caps`: kategorie funkcji wysokiego poziomu, takie jak `camera`, `canvas`, `screen`,
  `location`, `voice` i `talk`.
- `commands`: lista dozwolonych poleceń dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i egzekwuje listy dozwolone po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy obecności zawierają `deviceId`, `roles` i `scopes`, aby UI mogły pokazać jeden wiersz na urządzenie
  nawet wtedy, gdy łączy się ono zarówno jako **operator**, jak i **node**.
- `node.list` zawiera opcjonalne pola `lastSeenAtMs` i `lastSeenReason`. Połączone Node raportują
  bieżący czas połączenia jako `lastSeenAtMs` z przyczyną `connect`; sparowane Node mogą także raportować
  trwałą obecność w tle, gdy zaufane zdarzenie Node aktualizuje ich metadane parowania.

### Zdarzenie aktywności Node w tle

Node mogą wywołać `node.event` z `event: "node.presence.alive"`, aby zapisać, że sparowany Node był
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
urządzenia Node; sesje bez urządzenia lub niesparowane zwracają `handled: false`.

Pomyślne gatewaye zwracają ustrukturyzowany wynik:

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

Zdarzenia rozgłoszeniowe WebSocket wypychane przez serwer są bramkowane zakresem, aby sesje ograniczone do parowania lub wyłącznie Node nie odbierały pasywnie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` oraz wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Rozgłoszenia `plugin.*` zdefiniowane przez Plugin** są bramkowane do `operator.write` lub `operator.admin`, zależnie od tego, jak zarejestrował je Plugin.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia połączenia/rozłączenia itd.) pozostają nieograniczone, aby stan transportu był widoczny dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń rozgłoszeniowych** są domyślnie bramkowane zakresem (fail-closed), chyba że zarejestrowany handler jawnie je poluzuje.

Każde połączenie klienta utrzymuje własny numer sekwencyjny dla klienta, dzięki czemu rozgłoszenia zachowują monotoniczną kolejność na tym gnieździe, nawet gdy różni klienci widzą różne podzbiory strumienia zdarzeń przefiltrowane zakresem.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż powyższe przykłady handshake/auth. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` jest konserwatywną
listą wykrywania zbudowaną z `src/gateway/server-methods-list.ts` oraz załadowanych
eksportów metod Plugin/kanałów. Traktuj ją jako wykrywanie funkcji, a nie pełne
wyliczenie `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System i tożsamość">
    - `health` zwraca buforowaną lub świeżo sprawdzoną migawkę kondycji gatewaya.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestrator stabilności diagnostycznej. Zachowuje metadane operacyjne, takie jak nazwy zdarzeń, liczby, rozmiary bajtów, odczyty pamięci, stan kolejek/sesji, nazwy kanałów/Plugin oraz identyfikatory sesji. Nie zachowuje tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań lub odpowiedzi, tokenów, plików cookie ani wartości tajnych. Wymagany jest zakres odczytu operatora.
    - `status` zwraca podsumowanie gatewaya w stylu `/status`; pola wrażliwe są uwzględniane tylko dla klientów operatora z zakresem admin.
    - `gateway.identity.get` zwraca tożsamość urządzenia gatewaya używaną przez przepływy relay i parowania.
    - `system-presence` zwraca bieżącą migawkę obecności dla połączonych urządzeń operator/Node.
    - `system-event` dołącza zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
    - `last-heartbeat` zwraca ostatnie utrwalone zdarzenie heartbeat.
    - `set-heartbeats` przełącza przetwarzanie heartbeat w gatewayu.

  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolonych w środowisku uruchomieniowym. Przekaż `{ "view": "configured" }` dla skonfigurowanych modeli o rozmiarze listy wyboru (`agents.defaults.models` najpierw, potem `models.providers.*.models`) albo `{ "view": "all" }` dla pełnego katalogu.
    - `usage.status` zwraca okna użycia dostawców oraz podsumowania pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
    - `doctor.memory.status` zwraca gotowość pamięci wektorowej / buforowanych embeddingów dla aktywnego domyślnego obszaru roboczego agenta. Przekaż `{ "probe": true }` lub `{ "deep": true }` tylko wtedy, gdy wywołujący jawnie chce wykonać aktywne sprawdzenie dostawcy embeddingów.
    - `doctor.memory.remHarness` zwraca ograniczony, tylko do odczytu podgląd harnessu REM dla zdalnych klientów płaszczyzny sterowania. Może zawierać ścieżki obszaru roboczego, fragmenty pamięci, wyrenderowany ugruntowany Markdown oraz kandydatów do głębokiej promocji, więc wywołujący potrzebują `operator.read`.
    - `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji.
    - `sessions.usage.timeseries` zwraca użycie w szeregu czasowym dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Kanały i pomocnicy logowania">
    - `channels.status` zwraca podsumowania stanu wbudowanych i dołączonych kanałów/pluginów.
    - `channels.logout` wylogowuje z określonego kanału/konta, jeśli kanał obsługuje wylogowanie.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i po powodzeniu uruchamia kanał.
    - `push.test` wysyła testowe powiadomienie push APNs do zarejestrowanego węzła iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słowa wybudzającego.
    - `voicewake.set` aktualizuje wyzwalacze słowa wybudzającego i rozgłasza zmianę.

  </Accordion>

  <Accordion title="Wiadomości i dzienniki">
    - `send` to bezpośrednie RPC dostarczania wychodzącego dla wysyłek kierowanych do kanału/konta/wątku poza runnerem czatu.
    - `logs.tail` zwraca skonfigurowaną końcówkę dziennika plikowego gatewaya z kursorem/limitem oraz kontrolami maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Talk i TTS">
    - `talk.catalog` zwraca tylko do odczytu katalog dostawców Talk dla mowy, transkrypcji strumieniowej i głosu w czasie rzeczywistym. Obejmuje identyfikatory dostawców, etykiety, stan konfiguracji, ujawnione identyfikatory modeli/głosów, kanoniczne tryby, transporty, strategie mózgu oraz flagi audio/możliwości czasu rzeczywistego bez zwracania sekretów dostawcy ani mutowania konfiguracji globalnej.
    - `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (lub `operator.admin`).
    - `talk.session.create` tworzy sesję Talk należącą do Gatewaya dla `realtime/gateway-relay`, `transcription/gateway-relay` albo `stt-tts/managed-room`. `brain: "direct-tools"` wymaga `operator.admin`.
    - `talk.session.join` waliduje token sesji zarządzanego pokoju, emituje zdarzenia `session.ready` lub `session.replaced` zgodnie z potrzebą i zwraca metadane pokoju/sesji oraz ostatnie zdarzenia Talk bez tokena w postaci jawnej ani zapisanego skrótu tokena.
    - `talk.session.appendAudio` dołącza wejściowy dźwięk PCM w base64 do należących do Gatewaya sesji przekaźnika czasu rzeczywistego i transkrypcji.
    - `talk.session.startTurn`, `talk.session.endTurn` i `talk.session.cancelTurn` sterują cyklem życia tury zarządzanego pokoju z odrzucaniem nieaktualnej tury przed wyczyszczeniem stanu.
    - `talk.session.cancelOutput` zatrzymuje wyjściowy dźwięk asystenta, głównie dla przerywania sterowanego przez VAD w sesjach przekaźnika Gatewaya.
    - `talk.session.submitToolResult` kończy wywołanie narzędzia dostawcy wyemitowane przez należącą do Gatewaya sesję przekaźnika czasu rzeczywistego.
    - `talk.session.close` zamyka należącą do Gatewaya sesję przekaźnika, transkrypcji lub zarządzanego pokoju i emituje końcowe zdarzenia Talk.
    - `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów WebChat/Control UI.
    - `talk.client.create` tworzy należącą do klienta sesję dostawcy czasu rzeczywistego z użyciem `webrtc` lub `provider-websocket`, podczas gdy Gateway posiada konfigurację, poświadczenia, instrukcje i politykę narzędzi.
    - `talk.client.toolCall` pozwala należącym do klienta transportom czasu rzeczywistego przekazywać wywołania narzędzi dostawcy do polityki Gatewaya. Pierwszym obsługiwanym narzędziem jest `openclaw_agent_consult`; klienci otrzymują identyfikator uruchomienia i czekają na normalne zdarzenia cyklu życia czatu przed przesłaniem wyniku narzędzia specyficznego dla dostawcy.
    - `talk.event` to pojedynczy kanał zdarzeń Talk dla adapterów czasu rzeczywistego, transkrypcji, STT/TTS, zarządzanego pokoju, telefonii i spotkań.
    - `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców zapasowych i stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny spis dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRefs i podmienia stan sekretów środowiska uruchomieniowego tylko przy pełnym powodzeniu.
    - `secrets.resolve` rozwiązuje przypisania sekretów docelowych poleceń dla określonego zestawu poleceń/celów.
    - `config.get` zwraca bieżący zrzut konfiguracji i hash.
    - `config.set` zapisuje zwalidowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji.
    - `config.apply` waliduje i zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca aktywny ładunek schematu konfiguracji używany przez Control UI i narzędzia CLI: schemat, `uiHints`, wersję i metadane generowania, w tym metadane schematów pluginów i kanałów, gdy środowisko uruchomieniowe może je załadować. Schemat zawiera metadane pól `title` / `description` pochodzące z tych samych etykiet i tekstu pomocy, których używa UI, w tym zagnieżdżone obiekty, wildcardy, elementy tablic oraz gałęzie kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pól.
    - `config.schema.lookup` zwraca ładunek wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę + `hintPath` oraz bezpośrednie podsumowania elementów potomnych do przechodzenia w głąb w UI/CLI. Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika i typowe pola walidacji (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia liczbowe/tekstowe/tablicowe/obiektowe oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania elementów potomnych ujawniają `key`, znormalizowane `path`, `type`, `required`, `hasChildren` oraz dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji gatewaya i planuje restart tylko wtedy, gdy sama aktualizacja się powiodła; wywołujący z sesją mogą dołączyć `continuationMessage`, aby po uruchomieniu wznowić jedną kolejną turę agenta przez kolejkę kontynuacji restartu. Aktualizacje menedżera pakietów wymuszają nieodroczony restart aktualizacyjny bez czasu wyciszenia po podmianie pakietu, aby stary proces Gatewaya nie kontynuował leniwego ładowania z zastąpionego drzewa `dist`.
    - `update.status` zwraca najnowszy zbuforowany znacznik restartu aktualizacji, w tym działającą wersję po restarcie, gdy jest dostępna.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator wdrożenia przez WS RPC.

  </Accordion>

  <Accordion title="Pomocnicy agenta i obszaru roboczego">
    - `agents.list` zwraca skonfigurowane wpisy agentów, w tym efektywny model i metadane środowiska uruchomieniowego.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów oraz okablowaniem obszaru roboczego.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami początkowymi obszaru roboczego udostępnianymi agentowi.
    - `artifacts.list`, `artifacts.get` i `artifacts.download` udostępniają podsumowania artefaktów pochodzących z transkryptu oraz pobrania dla jawnego zakresu `sessionKey`, `runId` lub `taskId`. Zapytania o uruchomienie i zadanie rozwiązują sesję właściciela po stronie serwera i zwracają tylko media transkryptu z pasującym pochodzeniem; niebezpieczne lub lokalne źródła URL zwracają nieobsługiwane pobrania zamiast pobierania po stronie serwera.
    - `environments.list` i `environments.status` udostępniają tylko do odczytu wykrywanie środowisk lokalnych dla Gatewaya i środowisk węzłów dla klientów SDK.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcowy zrzut, gdy jest dostępny.

  </Accordion>

  <Accordion title="Sterowanie sesją">
    - `sessions.list` zwraca bieżący indeks sesji, w tym metadane `agentRuntime` dla każdego wiersza, gdy skonfigurowano backend środowiska uruchomieniowego agenta.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkryptu/wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkryptów dla określonych kluczy sesji.
    - `sessions.describe` zwraca jeden wiersz sesji Gatewaya dla dokładnego klucza sesji.
    - `sessions.resolve` rozwiązuje lub kanonikalizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant przerwania i sterowania dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji. Wywołujący może przekazać `key` oraz opcjonalnie `runId` albo przekazać samo `runId` dla aktywnych uruchomień, które Gateway może rozwiązać do sesji.
    - `sessions.patch` aktualizuje metadane/nadpisania sesji i raportuje rozwiązany model kanoniczny oraz efektywny `agentRuntime`.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest normalizowane pod kątem wyświetlania dla klientów UI: znaczniki dyrektyw inline są usuwane z widocznego tekstu, tekstowe ładunki XML wywołań narzędzi w zwykłym tekście (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi) i ujawnione tokeny kontrolne modelu ASCII/pełnej szerokości są usuwane, czysto ciche wiersze asystenta z tokenami, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a zbyt duże wiersze mogą zostać zastąpione symbolami zastępczymi.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.

  </Accordion>

  <Accordion title="Parowanie Node, wywoływanie i oczekująca praca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` i `node.pair.verify` obejmują parowanie węzłów i weryfikację bootstrapu.
    - `node.list` i `node.describe` zwracają stan znanych/połączonych węzłów.
    - `node.rename` aktualizuje etykietę sparowanego węzła.
    - `node.invoke` przekazuje polecenie do połączonego węzła.
    - `node.invoke.result` zwraca wynik żądania wywołania.
    - `node.event` przenosi zdarzenia pochodzące z węzła z powrotem do gatewaya.
    - `node.pending.pull` i `node.pending.ack` to API kolejki połączonego węzła.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą dla węzłów offline/rozłączonych.

  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia wykonania oraz wyszukiwanie/ponowne odtwarzanie oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie wykonania i zwraca ostateczną decyzję (lub `null` po przekroczeniu limitu czasu).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają migawkami zasad zatwierdzania wykonania w gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalnymi dla węzła zasadami zatwierdzania wykonania przez polecenia przekazywania węzła.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują przepływy zatwierdzania definiowane przez Plugin.

  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe lub przy następnym heartbeat wstrzyknięcie tekstu wybudzającego; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject`, oraz inne zdarzenia czatu dotyczące wyłącznie transkrypcji.
- `session.message` i `session.tool`: aktualizacje transkrypcji/strumienia zdarzeń dla subskrybowanej sesji.
- `sessions.changed`: indeks sesji lub metadane uległy zmianie.
- `presence`: aktualizacje migawki obecności systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja migawki stanu gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania cron.
- `shutdown`: powiadomienie o zamknięciu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania węzła.
- `node.invoke.request`: rozgłoszenie żądania wywołania węzła.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniono konfigurację wyzwalacza słowa wybudzającego.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia zatwierdzania wykonania.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzania Plugin.

### Metody pomocnicze węzła

- Węzły mogą wywołać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych Skills na potrzeby sprawdzeń automatycznego zezwalania.

### Metody pomocnicze operatora

- Operatorzy mogą wywołać `commands.list` (`operator.read`), aby pobrać runtime'owy spis poleceń dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, do której powierzchni odnosi się podstawowa wartość `name`:
    - `text` zwraca podstawowy token polecenia tekstowego bez początkowego `/`
    - `native` i domyślna ścieżka `both` zwracają natywne nazwy świadome dostawcy, gdy są dostępne
  - `textAliases` przenosi dokładne aliasy z ukośnikiem, takie jak `/model` i `/m`.
  - `nativeName` przenosi natywną nazwę polecenia świadomą dostawcy, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na nazewnictwo natywne oraz dostępność natywnych poleceń Plugin.
  - `includeArgs=false` pomija serializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywołać `tools.catalog` (`operator.read`), aby pobrać runtime'owy katalog narzędzi dla agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel Plugin, gdy `source="plugin"`
  - `optional`: czy narzędzie Plugin jest opcjonalne
- Operatorzy mogą wywołać `tools.effective` (`operator.read`), aby pobrać runtime'owo efektywny spis narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst runtime po stronie serwera z sesji, zamiast akceptować kontekst uwierzytelniania lub dostarczania podany przez wywołującego.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, czego aktywna rozmowa może używać w tej chwili, w tym narzędzia rdzenia, Plugin i kanału.
- Operatorzy mogą wywołać `tools.invoke` (`operator.write`), aby wywołać jedno dostępne narzędzie przez tę samą ścieżkę zasad gateway co `/tools/invoke`.
  - `name` jest wymagane. `args`, `sessionKey`, `agentId`, `confirm` i `idempotencyKey` są opcjonalne.
  - Jeśli obecne są zarówno `sessionKey`, jak i `agentId`, rozstrzygnięty agent sesji musi odpowiadać `agentId`.
  - Odpowiedź jest kopertą przeznaczoną dla SDK, z polami `ok`, `toolName`, opcjonalnym `output` oraz typowanymi polami `error`. Odmowy zatwierdzenia lub zasad zwracają `ok:false` w ładunku, zamiast omijać potok zasad narzędzi gateway.
- Operatorzy mogą wywołać `skills.status` (`operator.read`), aby pobrać widoczny spis Skills dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, sprawdzenia konfiguracji i oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywołać `skills.search` i `skills.detail` (`operator.read`) dla metadanych odkrywania ClawHub.
- Operatorzy mogą wywołać `skills.install` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje folder Skills w katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb instalatora Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście gateway.
- Operatorzy mogą wywołać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug lub wszystkie śledzone instalacje ClawHub w domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji łata wartości `skills.entries.<skillKey>`, takie jak `enabled`, `apiKey` i `env`.

### Widoki `models.list`

`models.list` akceptuje opcjonalny parametr `view`:

- Pominięty lub `"default"`: bieżące zachowanie runtime. Jeśli skonfigurowano `agents.defaults.models`, odpowiedzią jest dozwolony katalog; w przeciwnym razie odpowiedzią jest pełny katalog Gateway.
- `"configured"`: zachowanie o rozmiarze odpowiednim dla selektora. Jeśli skonfigurowano `agents.defaults.models`, nadal ma pierwszeństwo. W przeciwnym razie odpowiedź używa jawnych wpisów `models.providers.*.models`, przechodząc awaryjnie do pełnego katalogu tylko wtedy, gdy nie istnieją żadne skonfigurowane wiersze modeli.
- `"all"`: pełny katalog Gateway, z pominięciem `agents.defaults.models`. Używaj tego do diagnostyki i UI odkrywania, nie do normalnych selektorów modeli.

## Zatwierdzenia wykonania

- Gdy żądanie wykonania wymaga zatwierdzenia, gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozstrzygają je przez wywołanie `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node`, `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane wywołania `node.invoke system.run` ponownie używają tego kanonicznego `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmodyfikuje `command`, `rawCommand`, `cwd`, `agentId` lub `sessionKey` między przygotowaniem a ostatecznym zatwierdzonym przekazaniem `system.run`, gateway odrzuca uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Awaryjne dostarczanie agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczenia wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe zachowanie: nierozstrzygnięte lub wyłącznie wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na przejście awaryjne do wykonania wyłącznie w sesji, gdy nie można rozstrzygnąć żadnej zewnętrznej trasy dostarczalnej (na przykład sesje wewnętrzne/webchat lub niejednoznaczne konfiguracje wielokanałowe).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/version.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niezgodności.
- Schematy + modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości są stabilne w protokole v4 i stanowią oczekiwaną bazę dla klientów zewnętrznych.

| Stała                                     | Domyślnie                                             | Źródło                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Limit czasu żądania (na RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Limit czasu preauth / connect-challenge   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env mogą zwiększyć sparowany budżet serwera/klienta) |
| Początkowy backoff ponownego połączenia    | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksymalny backoff ponownego połączenia    | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Ograniczenie szybkiej ponownej próby po zamknięciu device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Okres karencji force-stop przed `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Domyślny limit czasu `stopAndWait()`       | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Domyślny interwał tick (przed `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Zamknięcie po przekroczeniu limitu czasu tick | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Serwer ogłasza efektywne wartości `policy.tickIntervalMs`, `policy.maxPayload` i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości zamiast domyślnych sprzed uzgadniania.

## Uwierzytelnianie

- Uwierzytelnianie Gateway z użyciem współdzielonego sekretu używa `connect.params.auth.token` albo
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby niosące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) lub nie-loopbackowe
  `gateway.auth.mode: "trusted-proxy"` spełniają kontrolę uwierzytelniania połączenia na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatne wejście `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie połączenia
  współdzielonym sekretem; nie wystawiaj tego trybu na publiczne/niezaufane wejście.
- Po sparowaniu Gateway wydaje **token urządzenia** ograniczony do roli połączenia
  + zakresów uprawnień. Jest zwracany w `hello-ok.auth.deviceToken` i powinien być
  utrwalony przez klienta na potrzeby przyszłych połączeń.
- Klienci powinni utrwalać główny `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne łączenie z tym **zapisanym** tokenem urządzenia powinno też ponownie używać zapisanego
  zatwierdzonego zestawu zakresów uprawnień dla tego tokena. Zachowuje to dostęp do odczytu/sondowania/statusu,
  który został już przyznany, i zapobiega cichemu zawężaniu ponownych połączeń do
  węższego, niejawnego zakresu tylko administracyjnego.
- Składanie uwierzytelniania po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest niezależne i zawsze jest przekazywane, gdy jest ustawione.
  - `auth.token` jest wypełniany według priorytetu: najpierw jawny token współdzielony,
    następnie jawny `deviceToken`, potem zapisany token dla danego urządzenia (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żadne z powyższych nie rozwiązało
    `auth.token`. Token współdzielony lub dowolny rozwiązany token urządzenia go wyłącza.
  - Automatyczne promowanie zapisanego tokena urządzenia przy jednorazowej
    ponownej próbie `AUTH_TOKEN_MISMATCH` jest ograniczone wyłącznie do **zaufanych punktów końcowych** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez przypięcia nie spełnia warunków.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` są tokenami przekazania bootstrap.
  Utrwalaj je tylko wtedy, gdy połączenie użyło uwierzytelniania bootstrap na zaufanym transporcie,
  takim jak `wss://` albo parowanie loopback/lokalne.
- Jeśli klient podaje **jawny** `deviceToken` albo jawne `scopes`, ten
  żądany przez wywołującego zestaw zakresów uprawnień pozostaje autorytatywny; zakresy z pamięci podręcznej są
  ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokena dla danego urządzenia.
- Tokeny urządzeń można rotować/unieważniać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- `device.token.rotate` zwraca metadane rotacji. Zwraca zastępczy
  token okaziciela tylko dla wywołań z tego samego urządzenia, które są już uwierzytelnione
  tym tokenem urządzenia, dzięki czemu klienci używający wyłącznie tokena mogą utrwalić zamiennik przed
  ponownym połączeniem. Rotacje współdzielone/administracyjne nie zwracają tokena okaziciela.
- Wydawanie, rotacja i unieważnianie tokenów pozostają ograniczone do zatwierdzonego zestawu ról
  zapisanego we wpisie parowania danego urządzenia; mutacja tokena nie może rozszerzyć ani
  wskazać roli urządzenia, której zatwierdzenie parowania nigdy nie przyznało.
- Dla sparowanych sesji tokenów urządzeń zarządzanie urządzeniami jest samoograniczone, chyba że
  wywołujący ma też `operator.admin`: wywołujący niebędący administratorem mogą usuwać/unieważniać/rotować
  tylko wpis **własnego** urządzenia.
- `device.token.rotate` i `device.token.revoke` sprawdzają też docelowy zestaw zakresów
  tokena operatora względem bieżących zakresów sesji wywołującego. Wywołujący niebędący administratorami
  nie mogą rotować ani unieważniać szerszego tokena operatora niż ten, który już mają.
- Niepowodzenia uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (wartość logiczna)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z tokenem dla danego urządzenia z pamięci podręcznej.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać operatorowi wskazówki dotyczące wymaganej akcji.

## Tożsamość urządzenia + parowanie

- Node powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  odcisku pary kluczy.
- Gateway wydają tokeny dla urządzenia + roli.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączono lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania jest skoncentrowane na bezpośrednich połączeniach local loopback.
- OpenClaw ma też wąską ścieżkę backendowego/kontenerowo-lokalnego samopołączenia dla
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia z tego samego hosta przez tailnet albo LAN nadal są traktowane jako zdalne na potrzeby parowania i
  wymagają zatwierdzenia.
- Klienci WS zwykle dołączają tożsamość `device` podczas `connect` (operator +
  Node). Jedynymi wyjątkami operatora bez urządzenia są jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niebezpiecznym HTTP tylko na localhost.
  - udane uwierzytelnianie operatora w Control UI przez `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tryb awaryjny, poważne obniżenie bezpieczeństwa).
  - bezpośrednio-loopbackowe RPC backendu `gateway-client` uwierzytelnione współdzielonym
    tokenem/hasłem Gateway.
- Wszystkie połączenia muszą podpisać nonce `connect.challenge` dostarczone przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla klientów legacy, którzy nadal używają zachowania podpisywania sprzed wyzwania, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` pod `error.details.code` ze stabilnym `error.details.reason`.

Typowe niepowodzenia migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (albo wysłał pusty). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał przestarzałym/nieprawidłowym nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Podpisany znacznik czasu jest poza dozwolonym odchyleniem. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do odcisku klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalizacja klucza publicznego nie powiodła się. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisuj ładunek v2, który zawiera nonce serwera.
- Wyślij ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól device/client/role/scopes/token/nonce.
- Podpisy legacy `v2` pozostają akceptowane dla zgodności, ale przypięcie metadanych
  sparowanego urządzenia nadal kontroluje politykę poleceń przy ponownym połączeniu.

## TLS + przypinanie

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk certyfikatu Gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` albo CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API Gateway** (status, kanały, modele, czat,
agent, sesje, Node, zatwierdzenia itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.

## Powiązane

- [Protokół mostu](/pl/gateway/bridge-protocol)
- [Runbook Gateway](/pl/gateway)
