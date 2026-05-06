---
read_when:
    - Implementowanie lub aktualizowanie klientów WS dla Gateway
    - Debugowanie niezgodności protokołu lub błędów połączenia
    - Regenerowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-05-06T09:14:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5eb7a84dbe0664fd78271408686a643dbc0579de5b5402fd1a8d33fd59221d
    source_path: gateway/protocol.md
    workflow: 16
---

Protokół WS Gateway jest **pojedynczą płaszczyzną sterowania + transportem węzłów** dla
OpenClaw. Wszyscy klienci (CLI, interfejs WWW, aplikacja macOS, węzły
iOS/Android, węzły bez interfejsu) łączą się przez WebSocket i deklarują swoją
**rolę** + **zakres** podczas uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed `connect` są ograniczone do 64 KiB. Po udanym uzgodnieniu
  połączenia klienci powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Przy włączonej diagnostyce zbyt duże ramki
  przychodzące i wolne bufory wychodzące emitują zdarzenia `payload.large`,
  zanim Gateway zamknie lub odrzuci dotkniętą ramkę. Te zdarzenia zachowują
  rozmiary, limity, obszary i bezpieczne kody przyczyn. Nie zachowują treści
  wiadomości, zawartości załączników, surowej treści ramki, tokenów, plików
  cookie ani wartości sekretów.

## Uzgadnianie połączenia (connect)

Gateway → Klient (wyzwanie przed `connect`):

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

Gdy Gateway wciąż kończy uruchamianie procesów pomocniczych, żądanie `connect`
może zwrócić ponawialny błąd `UNAVAILABLE` z `details.reason` ustawionym na
`"startup-sidecars"` oraz `retryAfterMs`. Klienci powinni ponowić próbę po
takiej odpowiedzi w ramach ogólnego budżetu połączenia, zamiast prezentować ją
jako końcowe niepowodzenie uzgadniania.

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`src/gateway/protocol/schema/frames.ts`). `auth` jest również wymagane i
zgłasza wynegocjowaną rolę/zakresy. `canvasHostUrl` jest opcjonalne.

Gdy nie wydano tokenu urządzenia, `hello-ok.auth` zgłasza wynegocjowane
uprawnienia bez pól tokenu:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Zaufani klienci zaplecza działający w tym samym procesie (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogą pominąć `device` w bezpośrednich połączeniach
loopback, gdy uwierzytelniają się współdzielonym tokenem/hasłem Gateway. Ta
ścieżka jest zarezerwowana dla wewnętrznych RPC płaszczyzny sterowania i
sprawia, że nieaktualne bazowe dane parowania CLI/urządzenia nie blokują
lokalnej pracy zaplecza, takiej jak aktualizacje sesji podagentów. Klienci
zdalni, klienci z pochodzenia przeglądarki, klienci węzłów oraz jawni klienci
tokenów/tożsamości urządzeń nadal używają standardowych kontroli parowania i
podwyższania zakresów.

Gdy wydano token urządzenia, `hello-ok` zawiera również:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Podczas zaufanego przekazania rozruchowego `hello-ok.auth` może również zawierać
dodatkowe ograniczone wpisy ról w `deviceTokens`:

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

Dla wbudowanego przepływu rozruchowego węzła/operatora główny token węzła
pozostaje `scopes: []`, a każdy przekazany token operatora pozostaje ograniczony
do listy dozwolonych zakresów operatora dla rozruchu (`operator.approvals`,
`operator.read`, `operator.talk.secrets`, `operator.write`). Kontrole zakresów
rozruchowych pozostają prefiksowane rolą: wpisy operatora spełniają tylko
żądania operatora, a role niebędące operatorami nadal potrzebują zakresów pod
własnym prefiksem roli.

### Przykład Node

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

Metody wywołujące skutki uboczne wymagają **kluczy idempotencyjności** (zobacz schemat).

## Role + zakresy

Pełny model zakresów operatora, kontrole w czasie zatwierdzania oraz semantykę
współdzielonych sekretów opisuje [Zakresy operatora](/pl/gateway/operator-scopes).

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

Metody RPC Gateway rejestrowane przez Plugin mogą żądać własnego zakresu
operatora, ale zarezerwowane podstawowe prefiksy administracyjne (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) zawsze są rozwiązywane do
`operator.admin`.

Zakres metody jest tylko pierwszą bramką. Niektóre polecenia z ukośnikiem
osiągane przez `chat.send` stosują dodatkowo ostrzejsze kontrole na poziomie
polecenia. Na przykład trwałe zapisy `/config set` i `/config unset` wymagają
`operator.admin`.

`node.pair.approve` ma również dodatkową kontrolę zakresu w czasie zatwierdzania
oprócz bazowego zakresu metody:

- żądania bez polecenia: `operator.pairing`
- żądania z poleceniami węzła innymi niż exec: `operator.pairing` + `operator.write`
- żądania zawierające `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Możliwości/polecenia/uprawnienia (Node)

Węzły deklarują możliwości podczas łączenia:

- `caps`: kategorie możliwości wysokiego poziomu, takie jak `camera`, `canvas`, `screen`,
  `location`, `voice` i `talk`.
- `commands`: lista dozwolonych poleceń dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **deklaracje** i wymusza listy dozwolonych po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy indeksowane tożsamością urządzenia.
- Wpisy obecności zawierają `deviceId`, `roles` i `scopes`, aby interfejsy UI mogły pokazywać pojedynczy wiersz na urządzenie
  nawet wtedy, gdy łączy się ono zarówno jako **operator**, jak i **node**.
- `node.list` zawiera opcjonalne pola `lastSeenAtMs` i `lastSeenReason`. Połączone węzły zgłaszają
  swój bieżący czas połączenia jako `lastSeenAtMs` z przyczyną `connect`; sparowane węzły mogą też zgłaszać
  trwałą obecność w tle, gdy zaufane zdarzenie węzła aktualizuje ich metadane parowania.

### Zdarzenie aktywności Node w tle

Węzły mogą wywołać `node.event` z `event: "node.presence.alive"`, aby zarejestrować, że sparowany węzeł był
aktywny podczas wybudzenia w tle, bez oznaczania go jako połączonego.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` jest zamkniętym wyliczeniem: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` lub `connect`. Nieznane ciągi wyzwalacza są normalizowane przez
Gateway do `background` przed utrwaleniem. Zdarzenie jest trwałe tylko dla uwierzytelnionych sesji
urządzeń węzłów; sesje bez urządzenia lub niesparowane zwracają `handled: false`.

Po powodzeniu Gateway zwraca ustrukturyzowany wynik:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Starsze wersje Gateway mogą nadal zwracać `{ "ok": true }` dla `node.event`; klienci powinni traktować to jako
potwierdzone RPC, a nie jako trwałe utrwalenie obecności.

## Zakresowanie zdarzeń rozgłaszanych

Zdarzenia rozgłaszane WebSocket wypychane przez serwer są bramkowane zakresami, aby sesje ograniczone do parowania lub tylko dla węzłów nie odbierały pasywnie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Transmisje `plugin.*` definiowane przez Plugin** są bramkowane do `operator.write` lub `operator.admin`, zależnie od rejestracji przez Plugin.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia połączenia/rozłączenia itd.) pozostają nieograniczone, aby stan transportu był widoczny dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń rozgłoszeniowych** są domyślnie bramkowane zakresami (odmowa przy braku dopasowania), chyba że zarejestrowany program obsługi jawnie je złagodzi.

Każde połączenie klienta utrzymuje własny numer sekwencyjny klienta, dzięki czemu transmisje zachowują monotoniczny porządek na tym gnieździe nawet wtedy, gdy różni klienci widzą różne podzbiory strumienia zdarzeń przefiltrowane według zakresów.

## Typowe rodziny metod RPC

Publiczny interfejs WS jest szerszy niż powyższe przykłady uzgadniania/uwierzytelniania. Nie jest to wygenerowany zrzut — `hello-ok.features.methods` to konserwatywna lista wykrywania zbudowana z `src/gateway/server-methods-list.ts` oraz załadowanych eksportów metod Plugin/kanałów. Traktuj ją jako wykrywanie funkcji, a nie pełne wyliczenie `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System i tożsamość">
    - `health` zwraca buforowaną lub świeżo sprawdzoną migawkę stanu Gateway.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestrator stabilności diagnostycznej. Przechowuje metadane operacyjne, takie jak nazwy zdarzeń, liczniki, rozmiary w bajtach, odczyty pamięci, stan kolejek/sesji, nazwy kanałów/Plugin oraz identyfikatory sesji. Nie przechowuje tekstu czatu, treści Webhook, wyników narzędzi, surowych treści żądań lub odpowiedzi, tokenów, plików cookie ani wartości sekretów. Wymagany jest zakres odczytu operatora.
    - `status` zwraca podsumowanie Gateway w stylu `/status`; pola wrażliwe są uwzględniane tylko dla klientów operatora z zakresem administratora.
    - `gateway.identity.get` zwraca tożsamość urządzenia Gateway używaną przez przepływy przekaźnika i parowania.
    - `system-presence` zwraca bieżącą migawkę obecności połączonych urządzeń operatora/węzła.
    - `system-event` dołącza zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
    - `last-heartbeat` zwraca najnowsze utrwalone zdarzenie Heartbeat.
    - `set-heartbeats` przełącza przetwarzanie Heartbeat w Gateway.

  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolonych w czasie wykonywania. Przekaż `{ "view": "configured" }`, aby uzyskać skonfigurowane modele w rozmiarze selektora (`agents.defaults.models` najpierw, następnie `models.providers.*.models`), albo `{ "view": "all" }`, aby uzyskać pełny katalog.
    - `usage.status` zwraca okna użycia dostawców oraz podsumowania pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
    - `doctor.memory.status` zwraca gotowość pamięci wektorowej / buforowanych osadzeń dla aktywnego domyślnego obszaru roboczego agenta. Przekaż `{ "probe": true }` lub `{ "deep": true }` tylko wtedy, gdy wywołujący wyraźnie chce aktywnego pingu dostawcy osadzeń.
    - `doctor.memory.remHarness` zwraca ograniczony, tylko do odczytu podgląd środowiska REM dla zdalnych klientów płaszczyzny sterowania. Może zawierać ścieżki obszaru roboczego, fragmenty pamięci, wyrenderowany ugruntowany Markdown i kandydatów do głębokiej promocji, więc wywołujący potrzebują `operator.read`.
    - `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji.
    - `sessions.usage.timeseries` zwraca użycie w postaci szeregu czasowego dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Kanały i pomocniki logowania">
    - `channels.status` zwraca wbudowane + dołączone podsumowania statusu kanałów/pluginów.
    - `channels.logout` wylogowuje określony kanał/konto tam, gdzie kanał obsługuje wylogowanie.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i uruchamia kanał po powodzeniu.
    - `push.test` wysyła testowe powiadomienie push APNs do zarejestrowanego węzła iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słowa wybudzającego.
    - `voicewake.set` aktualizuje wyzwalacze słowa wybudzającego i rozgłasza zmianę.

  </Accordion>

  <Accordion title="Wiadomości i dzienniki">
    - `send` to bezpośrednie RPC dostarczania wychodzącego dla wysyłek skierowanych do kanału/konta/wątku poza uruchamiaczem czatu.
    - `logs.tail` zwraca skonfigurowany ogon dziennika plikowego Gateway z kursorem/limitem oraz kontrolami maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Mowa i TTS">
    - `talk.catalog` zwraca tylko do odczytu katalog dostawców mowy do mowy, transkrypcji strumieniowej i głosu w czasie rzeczywistym. Zawiera identyfikatory dostawców, etykiety, stan konfiguracji, ujawnione identyfikatory modeli/głosów, kanoniczne tryby, transporty, strategie mózgu oraz flagi dźwięku/możliwości czasu rzeczywistego, bez zwracania sekretów dostawcy ani modyfikowania konfiguracji globalnej.
    - `talk.config` zwraca efektywny ładunek konfiguracji mowy; `includeSecrets` wymaga `operator.talk.secrets` (lub `operator.admin`).
    - `talk.session.create` tworzy należącą do Gateway sesję mowy dla `realtime/gateway-relay`, `transcription/gateway-relay` lub `stt-tts/managed-room`. `brain: "direct-tools"` wymaga `operator.admin`.
    - `talk.session.join` weryfikuje token sesji zarządzanego pokoju, emituje zdarzenia `session.ready` lub `session.replaced` w razie potrzeby oraz zwraca metadane pokoju/sesji i ostatnie zdarzenia mowy bez tokenu w postaci jawnej ani zapisanego hasha tokenu.
    - `talk.session.appendAudio` dołącza wejściowy dźwięk PCM w base64 do należących do Gateway sesji przekaźnika czasu rzeczywistego i transkrypcji.
    - `talk.session.startTurn`, `talk.session.endTurn` i `talk.session.cancelTurn` sterują cyklem życia tury w zarządzanym pokoju z odrzuceniem nieaktualnej tury przed wyczyszczeniem stanu.
    - `talk.session.cancelOutput` zatrzymuje wyjściowy dźwięk asystenta, głównie dla przejęcia głosu bramkowanego przez VAD w sesjach przekaźnika Gateway.
    - `talk.session.submitToolResult` kończy wywołanie narzędzia dostawcy wyemitowane przez należącą do Gateway sesję przekaźnika czasu rzeczywistego.
    - `talk.session.close` zamyka należącą do Gateway sesję przekaźnika, transkrypcji lub zarządzanego pokoju i emituje końcowe zdarzenia mowy.
    - `talk.mode` ustawia/rozgłasza bieżący stan trybu mowy dla klientów WebChat/Control UI.
    - `talk.client.create` tworzy należącą do klienta sesję dostawcy czasu rzeczywistego za pomocą `webrtc` lub `provider-websocket`, podczas gdy Gateway posiada konfigurację, poświadczenia, instrukcje i politykę narzędzi.
    - `talk.client.toolCall` pozwala należącym do klienta transportom czasu rzeczywistego przekazywać wywołania narzędzi dostawcy do polityki Gateway. Pierwszym obsługiwanym narzędziem jest `openclaw_agent_consult`; klienci otrzymują identyfikator uruchomienia i czekają na normalne zdarzenia cyklu życia czatu przed przesłaniem wyniku narzędzia specyficznego dla dostawcy.
    - `talk.event` jest pojedynczym kanałem zdarzeń mowy dla adapterów czasu rzeczywistego, transkrypcji, STT/TTS, zarządzanego pokoju, telefonii i spotkań.
    - `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców zapasowych i stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny spis dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRefs i podmienia stan sekretów w czasie wykonywania tylko przy pełnym powodzeniu.
    - `secrets.resolve` rozwiązuje przypisania sekretów docelowych polecenia dla określonego zestawu poleceń/celów.
    - `config.get` zwraca bieżącą migawkę konfiguracji i hash.
    - `config.set` zapisuje zweryfikowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji.
    - `config.apply` weryfikuje + zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca aktywny ładunek schematu konfiguracji używany przez narzędzia Control UI i CLI: schemat, `uiHints`, wersję i metadane generowania, w tym metadane schematów pluginów + kanałów, gdy środowisko wykonawcze może je załadować. Schemat zawiera metadane pól `title` / `description` pochodzące z tych samych etykiet i tekstu pomocy, których używa UI, w tym gałęzie kompozycji zagnieżdżonych obiektów, wieloznaczników, elementów tablicy oraz `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pola.
    - `config.schema.lookup` zwraca ładunek wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną podpowiedź + `hintPath` oraz podsumowania bezpośrednich elementów podrzędnych do nawigacji UI/CLI. Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika i typowe pola walidacji (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia liczbowe/ciągów/tablic/obiektów oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania elementów podrzędnych ujawniają `key`, znormalizowaną `path`, `type`, `required`, `hasChildren`, plus dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji Gateway i planuje restart tylko wtedy, gdy sama aktualizacja się powiodła; wywołujący z sesją mogą dołączyć `continuationMessage`, aby uruchomienie wznowiło jedną kolejną turę agenta przez kolejkę kontynuacji restartu. Aktualizacje menedżera pakietów wymuszają nieodroczony restart aktualizacyjny bez czasu karencji po podmianie pakietu, aby stary proces Gateway nie kontynuował leniwego ładowania z zastąpionego drzewa `dist`.
    - `update.status` zwraca najnowszy zapisany w pamięci podręcznej znacznik restartu aktualizacji, w tym uruchomioną wersję po restarcie, gdy jest dostępna.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator wdrożenia przez WS RPC.

  </Accordion>

  <Accordion title="Pomocniki agenta i obszaru roboczego">
    - `agents.list` zwraca skonfigurowane wpisy agentów, w tym efektywny model i metadane czasu wykonywania.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów oraz okablowaniem obszaru roboczego.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami obszaru roboczego rozruchu udostępnianymi dla agenta.
    - `artifacts.list`, `artifacts.get` i `artifacts.download` udostępniają podsumowania artefaktów i pobrania pochodzące z transkrypcji dla jawnego zakresu `sessionKey`, `runId` lub `taskId`. Zapytania uruchomień i zadań rozwiązują sesję właściciela po stronie serwera i zwracają tylko media transkrypcji z pasującą proweniencją; niebezpieczne lub lokalne źródła URL zwracają nieobsługiwane pobrania zamiast pobierania po stronie serwera.
    - `environments.list` i `environments.status` udostępniają tylko do odczytu wykrywanie środowisk lokalnych Gateway i Node dla klientów SDK.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcową migawkę, gdy jest dostępna.

  </Accordion>

  <Accordion title="Sterowanie sesją">
    - `sessions.list` zwraca bieżący indeks sesji, w tym metadane `agentRuntime` dla każdego wiersza, gdy skonfigurowano backend czasu wykonywania agenta.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkrypcji/wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkrypcji dla określonych kluczy sesji.
    - `sessions.describe` zwraca jeden wiersz sesji Gateway dla dokładnego klucza sesji.
    - `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant przerwania i pokierowania dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji. Wywołujący może przekazać `key` oraz opcjonalnie `runId` albo przekazać samo `runId` dla aktywnych uruchomień, które Gateway może rozwiązać do sesji.
    - `sessions.patch` aktualizuje metadane/nadpisania sesji i zgłasza rozwiązany model kanoniczny oraz efektywny `agentRuntime`.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują utrzymanie sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest normalizowane do wyświetlania dla klientów UI: wbudowane tagi dyrektyw są usuwane z widocznego tekstu, zwykłotekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi) i ujawnione tokeny sterujące modelu ASCII/pełnej szerokości są usuwane, czyste wiersze asystenta z tokenem ciszy, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a zbyt duże wiersze mogą być zastępowane symbolami zastępczymi.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach zatwierdzonej roli i zakresu wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach zatwierdzonej roli i zakresu wywołującego.

  </Accordion>

  <Accordion title="Parowanie Node, wywołania i oczekująca praca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` i `node.pair.verify` obejmują parowanie Node oraz weryfikację rozruchu.
    - `node.list` i `node.describe` zwracają znany/podłączony stan Node.
    - `node.rename` aktualizuje etykietę sparowanego Node.
    - `node.invoke` przekazuje polecenie do podłączonego Node.
    - `node.invoke.result` zwraca wynik żądania wywołania.
    - `node.event` przenosi zdarzenia pochodzące z Node z powrotem do Gateway.
    - `node.canvas.capability.refresh` odświeża tokeny możliwości canvas o określonym zakresie.
    - `node.pending.pull` i `node.pending.ack` to API kolejki podłączonego Node.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą dla Node offline/rozłączonych.

  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia wykonania oraz wyszukiwanie/odtwarzanie oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie wykonania i zwraca ostateczną decyzję (lub `null` po przekroczeniu limitu czasu).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają migawkami polityki zatwierdzania wykonań w gatewayu.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną dla węzła polityką zatwierdzania wykonań za pomocą poleceń przekaźnika węzła.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują przepływy zatwierdzania definiowane przez plugin.

  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe lub przy następnym heartbeat wstrzyknięcie tekstu wybudzającego; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject`, oraz inne zdarzenia czatu dotyczące wyłącznie transkrypcji.
- `session.message` i `session.tool`: aktualizacje transkrypcji/strumienia zdarzeń dla subskrybowanej sesji.
- `sessions.changed`: zmieniono indeks sesji lub metadane.
- `presence`: aktualizacje migawki obecności systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja migawki kondycji gatewaya.
- `heartbeat`: aktualizacja strumienia zdarzeń heartbeat.
- `cron`: zdarzenie zmiany przebiegu/zadania cron.
- `shutdown`: powiadomienie o zamknięciu gatewaya.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania węzła.
- `node.invoke.request`: rozgłoszenie żądania wywołania węzła.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniono konfigurację wyzwalacza słowa wybudzającego.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia zatwierdzania wykonania.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzania pluginu.

### Metody pomocnicze węzła

- Węzły mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych skill na potrzeby kontroli automatycznego zezwalania.

### Metody pomocnicze operatora

- Operatorzy mogą wywoływać `commands.list` (`operator.read`), aby pobrać inwentarz poleceń środowiska uruchomieniowego dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, do której powierzchni odnosi się podstawowa wartość `name`:
    - `text` zwraca podstawowy tekstowy token polecenia bez początkowego `/`
    - `native` i domyślna ścieżka `both` zwracają natywne nazwy świadome dostawcy, gdy są dostępne
  - `textAliases` przenosi dokładne aliasy ukośnikowe, takie jak `/model` i `/m`.
  - `nativeName` przenosi natywną nazwę polecenia świadomą dostawcy, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na natywne nazewnictwo oraz dostępność natywnych poleceń pluginu.
  - `includeArgs=false` pomija serializowane metadane argumentów z odpowiedzi.
- Operatorzy mogą wywoływać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi środowiska uruchomieniowego dla agenta. Odpowiedź obejmuje pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel pluginu, gdy `source="plugin"`
  - `optional`: czy narzędzie pluginu jest opcjonalne
- Operatorzy mogą wywoływać `tools.effective` (`operator.read`), aby pobrać efektywny w środowisku uruchomieniowym inwentarz narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst środowiska uruchomieniowego z sesji po stronie serwera zamiast akceptować dostarczony przez wywołującego kontekst uwierzytelniania lub dostarczania.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, czego aktywna konwersacja może używać w tej chwili, w tym narzędzia rdzenia, pluginu i kanału.
- Operatorzy mogą wywoływać `tools.invoke` (`operator.write`), aby wywołać jedno dostępne narzędzie przez tę samą ścieżkę polityki gatewaya co `/tools/invoke`.
  - `name` jest wymagane. `args`, `sessionKey`, `agentId`, `confirm` i `idempotencyKey` są opcjonalne.
  - Jeśli obecne są zarówno `sessionKey`, jak i `agentId`, rozwiązany agent sesji musi odpowiadać `agentId`.
  - Odpowiedź jest kopertą skierowaną do SDK z polami `ok`, `toolName`, opcjonalnym `output` oraz typowanymi polami `error`. Odmowy wynikające z zatwierdzenia lub polityki zwracają `ok:false` w ładunku zamiast omijać potok polityki narzędzi gatewaya.
- Operatorzy mogą wywoływać `skills.status` (`operator.read`), aby pobrać widoczny inwentarz skill dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź obejmuje kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywoływać `skills.search` i `skills.detail` (`operator.read`) dla metadanych odkrywania ClawHub.
- Operatorzy mogą wywoływać `skills.install` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje folder skill w katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb instalatora Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście gatewaya.
- Operatorzy mogą wywoływać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug lub wszystkie śledzone instalacje ClawHub w domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji poprawia wartości `skills.entries.<skillKey>`, takie jak `enabled`, `apiKey` i `env`.

### Widoki `models.list`

`models.list` przyjmuje opcjonalny parametr `view`:

- Pominięty lub `"default"`: bieżące zachowanie środowiska uruchomieniowego. Jeśli skonfigurowano `agents.defaults.models`, odpowiedzią jest dozwolony katalog; w przeciwnym razie odpowiedzią jest pełny katalog Gateway.
- `"configured"`: zachowanie o rozmiarze selektora. Jeśli skonfigurowano `agents.defaults.models`, nadal ma pierwszeństwo. W przeciwnym razie odpowiedź używa jawnych wpisów `models.providers.*.models`, wracając do pełnego katalogu tylko wtedy, gdy nie istnieją żadne skonfigurowane wiersze modeli.
- `"all"`: pełny katalog Gateway, z pominięciem `agents.defaults.models`. Używaj tego do diagnostyki i interfejsów odkrywania, nie do zwykłych selektorów modeli.

## Zatwierdzenia wykonania

- Gdy żądanie wykonania wymaga zatwierdzenia, gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozstrzygają je, wywołując `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node`, `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazywane wywołania `node.invoke system.run` ponownie używają tego kanonicznego `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub `sessionKey` między przygotowaniem a ostatecznym zatwierdzonym przekazaniem `system.run`, gateway odrzuca uruchomienie zamiast ufać zmienionemu ładunkowi.

## Fallback dostarczania agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczania wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe zachowanie: nierozwiązane lub wyłącznie wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na fallback do wykonania tylko w sesji, gdy nie można rozwiązać zewnętrznej trasy możliwej do dostarczenia (na przykład sesje wewnętrzne/webchat lub niejednoznaczne konfiguracje wielokanałowe).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niezgodności.
- Schematy + modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości są stabilne w protokole v3 i stanowią oczekiwaną bazę dla klientów zewnętrznych.

| Stała                                     | Domyślnie                                             | Źródło                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Limit czasu żądania (na RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Limit czasu preauth / connect-challenge   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env może zwiększyć sparowany budżet serwera/klienta) |
| Początkowy backoff ponownego połączenia   | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksymalny backoff ponownego połączenia   | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Ograniczenie szybkiej ponownej próby po zamknięciu tokenu urządzenia | `250` ms                         | `src/gateway/client.ts`                                                                    |
| Okres karencji wymuszonego zatrzymania przed `terminate()` | `250` ms                                  | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Domyślny limit czasu `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Domyślny interwał tick (przed `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Zamknięcie po limicie czasu tick          | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Serwer ogłasza efektywne `policy.tickIntervalMs`, `policy.maxPayload` i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości zamiast wartości domyślnych sprzed uzgadniania.

## Uwierzytelnianie

- Uwierzytelnianie Gateway za pomocą współdzielonego sekretu używa `connect.params.auth.token` albo
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby przenoszące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) albo inne niż loopback
  `gateway.auth.mode: "trusted-proxy"`, spełniają sprawdzenie uwierzytelniania connect na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatny ingress `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie connect
  za pomocą współdzielonego sekretu; nie wystawiaj tego trybu na publiczny/niezaufany ingress.
- Po sparowaniu Gateway wydaje **token urządzenia** ograniczony do roli połączenia
  i zakresów. Jest zwracany w `hello-ok.auth.deviceToken` i powinien być
  utrwalany przez klienta do przyszłych połączeń.
- Klienci powinni utrwalać podstawowy `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne połączenie z tym **zapisanym** tokenem urządzenia powinno też ponownie używać zapisanego
  zatwierdzonego zestawu zakresów dla tego tokena. Zachowuje to dostęp do odczytu/próbkowania/statusu,
  który został już przyznany, i zapobiega cichemu zawężeniu ponownych połączeń do
  węższego domyślnego zakresu tylko administracyjnego.
- Składanie uwierzytelniania connect po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest niezależne i zawsze jest przekazywane, gdy jest ustawione.
  - `auth.token` jest wypełniany według priorytetu: najpierw jawny token współdzielony,
    potem jawny `deviceToken`, a następnie zapisany token dla danego urządzenia (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żadne z powyższych nie rozwiązało
    `auth.token`. Token współdzielony lub dowolny rozwiązany token urządzenia go tłumi.
  - Automatyczne promowanie zapisanego tokena urządzenia przy jednorazowej ponownej próbie
    `AUTH_TOKEN_MISMATCH` jest ograniczone wyłącznie do **zaufanych punktów końcowych**:
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez przypięcia nie kwalifikuje się.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` to tokeny przekazania bootstrap.
  Utrwalaj je tylko wtedy, gdy połączenie użyło uwierzytelniania bootstrap na zaufanym transporcie,
  takim jak `wss://` albo loopback/parowanie lokalne.
- Jeśli klient podaje **jawny** `deviceToken` albo jawne `scopes`, ten
  zestaw zakresów żądany przez wywołującego pozostaje autorytatywny; zakresy z pamięci podręcznej są
  ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokena dla danego urządzenia.
- Tokeny urządzeń można rotować/unieważniać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- `device.token.rotate` zwraca metadane rotacji. Zwraca zastępczy
  token bearer tylko dla wywołań z tego samego urządzenia, które są już uwierzytelnione tym
  tokenem urządzenia, aby klienci używający wyłącznie tokenów mogli utrwalić zamiennik przed
  ponownym połączeniem. Rotacje współdzielone/administracyjne nie zwracają tokena bearer.
- Wydawanie, rotacja i unieważnianie tokenów pozostają ograniczone do zatwierdzonego zestawu ról
  zapisanego we wpisie parowania tego urządzenia; mutacja tokena nie może rozszerzyć ani
  wskazać roli urządzenia, której zatwierdzenie parowania nigdy nie przyznało.
- Dla sparowanych sesji tokenów urządzeń zarządzanie urządzeniami jest samoograniczone, chyba że
  wywołujący ma też `operator.admin`: wywołujący niebędący administratorem mogą usuwać/unieważniać/rotować
  tylko wpis **własnego** urządzenia.
- `device.token.rotate` i `device.token.revoke` sprawdzają też docelowy zestaw zakresów tokena
  operatora względem bieżących zakresów sesji wywołującego. Wywołujący niebędący administratorem
  nie mogą rotować ani unieważniać szerszego tokena operatora niż ten, który już posiadają.
- Błędy uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (wartość logiczna)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą spróbować jednej ograniczonej ponownej próby z tokenem dla danego urządzenia z pamięci podręcznej.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać wskazówki działania dla operatora.

## Tożsamość urządzenia i parowanie

- Każdy Node powinien zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  odcisku palca pary kluczy.
- Instancje Gateway wydają tokeny na urządzenie i rolę.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączono lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania koncentruje się na bezpośrednich połączeniach local loopback.
- OpenClaw ma też wąską ścieżkę samopołączenia lokalną dla backendu/kontenera dla
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia z tego samego hosta przez tailnet albo LAN nadal są traktowane jako zdalne na potrzeby parowania i
  wymagają zatwierdzenia.
- Klienci WS zwykle dołączają tożsamość `device` podczas `connect` (operator +
  node). Jedynymi wyjątkami operatora bez urządzenia są jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności niezabezpieczonego HTTP tylko na localhost.
  - udane uwierzytelnienie Control UI operatora w `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tryb awaryjny, poważne obniżenie bezpieczeństwa).
  - bezpośrednie RPC backendu `gateway-client` przez loopback uwierzytelnione współdzielonym
    tokenem/hasłem Gateway.
- Wszystkie połączenia muszą podpisać nonce `connect.challenge` dostarczony przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed challenge, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` w `error.details.code` ze stabilnym `error.details.reason`.

Typowe niepowodzenia migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (albo wysłał pusty). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał przestarzały/nieprawidłowy nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Podpisany znacznik czasu jest poza dozwolonym odchyleniem. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do odcisku palca klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalizacja klucza publicznego nie powiodła się. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisz ładunek v2, który zawiera nonce serwera.
- Wyślij ten sam nonce w `connect.params.device.nonce`.
- Preferowanym ładunkiem podpisu jest `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól device/client/role/scopes/token/nonce.
- Starsze podpisy `v2` pozostają akceptowane ze względu na zgodność, ale przypinanie metadanych
  sparowanego urządzenia nadal kontroluje politykę poleceń przy ponownym połączeniu.

## TLS i przypinanie

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk palca certyfikatu Gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` albo CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API Gateway** (status, kanały, modele, czat,
agent, sesje, Node, zatwierdzenia itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.

## Powiązane

- [Protokół mostu](/pl/gateway/bridge-protocol)
- [Runbook Gateway](/pl/gateway)
