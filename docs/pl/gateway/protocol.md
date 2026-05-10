---
read_when:
    - Implementowanie lub aktualizowanie klientów WS Gateway
    - Debugowanie niezgodności protokołu lub niepowodzeń nawiązywania połączenia
    - Ponowne generowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: handshake, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-05-10T19:38:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8bca116f2b05387e3c045f94137dff4eafba281ea5f2eabb65e75469cba8e8e
    source_path: gateway/protocol.md
    workflow: 16
---

Protokół Gateway WS jest **pojedynczą płaszczyzną kontroli + transportem węzłów** dla
OpenClaw. Wszyscy klienci (CLI, interfejs webowy, aplikacja macOS, węzły iOS/Android,
węzły headless) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres**
podczas uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po pomyślnym uzgodnieniu połączenia klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Przy włączonej diagnostyce
  zbyt duże ramki przychodzące i wolne bufory wychodzące emitują zdarzenia `payload.large`,
  zanim gateway zamknie lub odrzuci dotkniętą ramkę. Te zdarzenia zachowują
  rozmiary, limity, powierzchnie i bezpieczne kody przyczyn. Nie zachowują treści
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

Gdy Gateway nadal kończy uruchamianie sidecarów startowych, żądanie `connect` może
zwrócić ponawialny błąd `UNAVAILABLE` z `details.reason` ustawionym na
`"startup-sidecars"` oraz `retryAfterMs`. Klienci powinni ponowić tę odpowiedź
w ramach swojego całkowitego budżetu połączenia, zamiast pokazywać ją jako końcową
porażkę uzgadniania połączenia.

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`src/gateway/protocol/schema/frames.ts`). `auth` jest również wymagane i raportuje
uzgodnioną rolę/zakresy. `pluginSurfaceUrls` jest opcjonalne i mapuje nazwy powierzchni
pluginów, takie jak `canvas`, na ograniczone zakresem hostowane adresy URL.

Adresy URL powierzchni pluginów ograniczone zakresem mogą wygasać. Węzły mogą wywołać
`node.pluginSurface.refresh` z `{ "surface": "canvas" }`, aby otrzymać świeży
wpis w `pluginSurfaceUrls`. Eksperymentalny refaktoring pluginu Canvas nie obsługuje
przestarzałej ścieżki zgodności `canvasHostUrl`, `canvasCapability` ani
`node.canvas.capability.refresh`; bieżący klienci natywni i gatewaye muszą używać
powierzchni pluginów.

Gdy token urządzenia nie zostanie wydany, `hello-ok.auth` raportuje uzgodnione
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
`client.mode: "backend"`) mogą pominąć `device` w bezpośrednich połączeniach loopback,
gdy uwierzytelniają się współdzielonym tokenem/hasłem gatewaya. Ta ścieżka jest zarezerwowana
dla wewnętrznych RPC płaszczyzny kontroli i sprawia, że nieaktualne bazowe parowania CLI/urządzenia
nie blokują lokalnej pracy backendu, takiej jak aktualizacje sesji subagentów. Klienci zdalni,
klienci pochodzenia przeglądarkowego, klienci węzłów oraz jawni klienci tokenu urządzenia/tożsamości urządzenia
nadal używają standardowych kontroli parowania i podnoszenia zakresu.

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
`scopes: []`, a każdy przekazany token operatora pozostaje ograniczony do listy dozwolonych
operatorów bootstrapu (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kontrole zakresów bootstrapu pozostają
prefiksowane rolą: wpisy operatora spełniają tylko żądania operatora, a role inne niż operator
nadal wymagają zakresów z własnym prefiksem roli.

### Przykład węzła

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

Pełny model zakresów operatora, kontrole w czasie zatwierdzania i semantykę współdzielonych sekretów
opisano w [Zakresy operatora](/pl/gateway/operator-scopes).

### Role

- `operator` = klient płaszczyzny kontroli (CLI/UI/automatyzacja).
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

Metody RPC Gateway zarejestrowane przez pluginy mogą żądać własnego zakresu operatora, ale
zarezerwowane prefiksy administracyjne rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze rozwiązują się do `operator.admin`.

Zakres metody jest tylko pierwszą bramką. Niektóre polecenia slash osiągane przez
`chat.send` stosują dodatkowo ostrzejsze kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w czasie zatwierdzania oprócz
bazowego zakresu metody:

- żądania bez polecenia: `operator.pairing`
- żądania z poleceniami węzła innymi niż exec: `operator.pairing` + `operator.write`
- żądania zawierające `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Funkcjonalności/polecenia/uprawnienia (węzeł)

Węzły deklarują roszczenia funkcjonalności podczas połączenia:

- `caps`: wysokopoziomowe kategorie funkcjonalności, takie jak `camera`, `canvas`, `screen`,
  `location`, `voice` i `talk`.
- `commands`: lista dozwolonych poleceń dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i egzekwuje listy dozwolonych po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy obecności zawierają `deviceId`, `roles` i `scopes`, dzięki czemu interfejsy mogą pokazywać pojedynczy wiersz na urządzenie
  nawet wtedy, gdy łączy się ono zarówno jako **operator**, jak i **node**.
- `node.list` zawiera opcjonalne pola `lastSeenAtMs` i `lastSeenReason`. Połączone węzły raportują
  swój bieżący czas połączenia jako `lastSeenAtMs` z przyczyną `connect`; sparowane węzły mogą także raportować
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
`significant_location`, `manual` lub `connect`. Nieznane ciągi wyzwalaczy są normalizowane do
`background` przez gateway przed utrwaleniem. Zdarzenie jest trwałe tylko dla uwierzytelnionych sesji urządzeń
węzła; sesje bez urządzenia lub niesparowane zwracają `handled: false`.

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

## Określanie zakresu zdarzeń rozgłoszeniowych

Zdarzenia rozgłoszeniowe WebSocket wypychane przez serwer są bramkowane zakresem, aby sesje ograniczone do parowania lub tylko węzła nie otrzymywały pasywnie zawartości sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Rozgłoszenia `plugin.*` definiowane przez pluginy** są bramkowane do `operator.write` lub `operator.admin`, zależnie od tego, jak plugin je zarejestrował.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia connect/disconnect itd.) pozostają nieograniczone, aby kondycja transportu była widoczna dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń rozgłoszeniowych** są domyślnie bramkowane zakresem (fail-closed), chyba że zarejestrowany handler jawnie je rozluźni.

Każde połączenie klienckie utrzymuje własny numer sekwencyjny per klient, dzięki czemu rozgłoszenia zachowują monotoniczne uporządkowanie na tym gnieździe, nawet gdy różni klienci widzą różne podzbiory strumienia zdarzeń filtrowane zakresem.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż powyższe przykłady uzgadniania połączenia/uwierzytelniania. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` to konserwatywna
lista odkrywania zbudowana z `src/gateway/server-methods-list.ts` oraz załadowanych
eksportów metod pluginów/kanałów. Traktuj ją jako odkrywanie funkcji, a nie pełne
wyliczenie `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` zwraca zbuforowany lub świeżo sprawdzony snapshot kondycji gatewaya.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestrator stabilności diagnostycznej. Przechowuje metadane operacyjne, takie jak nazwy zdarzeń, liczniki, rozmiary bajtowe, odczyty pamięci, stan kolejek/sesji, nazwy kanałów/pluginów i identyfikatory sesji. Nie przechowuje tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań lub odpowiedzi, tokenów, ciasteczek ani wartości tajnych. Wymagany jest zakres odczytu operatora.
    - `status` zwraca podsumowanie gatewaya w stylu `/status`; pola wrażliwe są uwzględniane tylko dla klientów operatora z zakresem administracyjnym.
    - `gateway.identity.get` zwraca tożsamość urządzenia gatewaya używaną przez przepływy relay i parowania.
    - `system-presence` zwraca bieżący snapshot obecności dla połączonych urządzeń operatora/węzła.
    - `system-event` dołącza zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
    - `last-heartbeat` zwraca ostatnie utrwalone zdarzenie Heartbeat.
    - `set-heartbeats` przełącza przetwarzanie Heartbeat na gatewayu.

  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolony w środowisku uruchomieniowym. Przekaż `{ "view": "configured" }`, aby uzyskać skonfigurowane modele odpowiednie dla selektora (`agents.defaults.models` najpierw, potem `models.providers.*.models`), albo `{ "view": "all" }`, aby uzyskać pełny katalog.
    - `usage.status` zwraca podsumowania okien użycia dostawców / pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
    - `doctor.memory.status` zwraca gotowość pamięci wektorowej / buforowanych embeddingów dla aktywnej domyślnej przestrzeni roboczej agenta. Przekaż `{ "probe": true }` lub `{ "deep": true }` tylko wtedy, gdy wywołujący wyraźnie chce aktywnego sprawdzenia dostawcy embeddingów.
    - `doctor.memory.remHarness` zwraca ograniczony, tylko do odczytu podgląd harnessu REM dla zdalnych klientów płaszczyzny sterowania. Może zawierać ścieżki przestrzeni roboczej, fragmenty pamięci, wyrenderowany ugruntowany markdown i kandydatów do głębokiej promocji, więc wywołujący potrzebują `operator.read`.
    - `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji.
    - `sessions.usage.timeseries` zwraca szeregi czasowe użycia dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Kanały i pomocniki logowania">
    - `channels.status` zwraca podsumowania statusu wbudowanych oraz dołączonych kanałów / Pluginów.
    - `channels.logout` wylogowuje określony kanał / konto, jeśli kanał obsługuje wylogowanie.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i po powodzeniu uruchamia kanał.
    - `push.test` wysyła testowe powiadomienie push APNs do zarejestrowanego węzła iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słowa wybudzającego.
    - `voicewake.set` aktualizuje wyzwalacze słowa wybudzającego i rozgłasza zmianę.

  </Accordion>

  <Accordion title="Wiadomości i dzienniki">
    - `send` to bezpośrednie RPC dostarczania wychodzącego dla wysyłek kierowanych do kanału / konta / wątku poza runnerem czatu.
    - `logs.tail` zwraca skonfigurowany ogon dziennika plikowego Gateway z kontrolą kursora / limitu i maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Talk i TTS">
    - `talk.catalog` zwraca tylko do odczytu katalog dostawców Talk dla mowy, transkrypcji strumieniowej i głosu w czasie rzeczywistym. Obejmuje identyfikatory dostawców, etykiety, stan konfiguracji, ujawnione identyfikatory modeli / głosów, kanoniczne tryby, transporty, strategie brain oraz flagi audio / możliwości czasu rzeczywistego, bez zwracania sekretów dostawcy ani modyfikowania globalnej konfiguracji.
    - `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (albo `operator.admin`).
    - `talk.session.create` tworzy należącą do Gateway sesję Talk dla `realtime/gateway-relay`, `transcription/gateway-relay` albo `stt-tts/managed-room`. `brain: "direct-tools"` wymaga `operator.admin`.
    - `talk.session.join` waliduje token sesji managed-room, emituje zdarzenia `session.ready` albo `session.replaced` w razie potrzeby i zwraca metadane pokoju / sesji oraz ostatnie zdarzenia Talk bez jawnego tokena ani zapisanego hasha tokena.
    - `talk.session.appendAudio` dołącza wejściowe audio PCM w base64 do należących do Gateway sesji przekaźnika czasu rzeczywistego i transkrypcji.
    - `talk.session.startTurn`, `talk.session.endTurn` i `talk.session.cancelTurn` sterują cyklem życia tury managed-room z odrzucaniem nieaktualnej tury przed wyczyszczeniem stanu.
    - `talk.session.cancelOutput` zatrzymuje wyjściowe audio asystenta, głównie na potrzeby wejścia w wypowiedź bramkowanego przez VAD w sesjach przekaźnika Gateway.
    - `talk.session.submitToolResult` kończy wywołanie narzędzia dostawcy wyemitowane przez należącą do Gateway sesję przekaźnika czasu rzeczywistego. Przekaż `options: { willContinue: true }` dla tymczasowego wyjścia narzędzia, gdy wynik końcowy pojawi się później, albo `options: { suppressResponse: true }`, gdy wynik narzędzia powinien spełnić wywołanie dostawcy bez uruchamiania kolejnej odpowiedzi asystenta w czasie rzeczywistym.
    - `talk.session.close` zamyka należącą do Gateway sesję przekaźnika, transkrypcji lub managed-room i emituje końcowe zdarzenia Talk.
    - `talk.mode` ustawia / rozgłasza bieżący stan trybu Talk dla klientów WebChat / interfejsu Control.
    - `talk.client.create` tworzy należącą do klienta sesję dostawcy czasu rzeczywistego przy użyciu `webrtc` albo `provider-websocket`, podczas gdy Gateway jest właścicielem konfiguracji, poświadczeń, instrukcji i polityki narzędzi.
    - `talk.client.toolCall` pozwala należącym do klienta transportom czasu rzeczywistego przekazywać wywołania narzędzi dostawcy do polityki Gateway. Pierwszym obsługiwanym narzędziem jest `openclaw_agent_consult`; klienci otrzymują identyfikator uruchomienia i czekają na normalne zdarzenia cyklu życia czatu przed przesłaniem specyficznego dla dostawcy wyniku narzędzia.
    - `talk.event` to pojedynczy kanał zdarzeń Talk dla adapterów czasu rzeczywistego, transkrypcji, STT/TTS, managed-room, telefonii i spotkań.
    - `talk.speak` syntetyzuje mowę za pośrednictwem aktywnego dostawcy mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców awaryjnych i stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny inwentarz dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRefs i podmienia stan sekretów środowiska uruchomieniowego tylko przy pełnym powodzeniu.
    - `secrets.resolve` rozwiązuje przypisania sekretów kierowane do polecenia dla określonego zestawu poleceń / celów.
    - `config.get` zwraca bieżącą migawkę konfiguracji i hash.
    - `config.set` zapisuje zwalidowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji.
    - `config.apply` waliduje i zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca aktywny ładunek schematu konfiguracji używany przez interfejs Control i narzędzia CLI: schemat, `uiHints`, wersję i metadane generowania, w tym metadane schematów Pluginów i kanałów, gdy środowisko uruchomieniowe może je załadować. Schemat obejmuje metadane pól `title` / `description` pochodzące z tych samych etykiet i tekstu pomocy, których używa interfejs, w tym zagnieżdżone obiekty, wildcardy, elementy tablic oraz gałęzie kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pola.
    - `config.schema.lookup` zwraca ładunek wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę + `hintPath` oraz podsumowania bezpośrednich elementów potomnych do zagłębiania w UI/CLI. Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika i typowe pola walidacji (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia liczbowe / tekstowe / tablicowe / obiektowe oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania elementów potomnych ujawniają `key`, znormalizowaną `path`, `type`, `required`, `hasChildren` oraz dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji gatewaya i planuje restart tylko wtedy, gdy sama aktualizacja się powiodła; wywołujący z sesją mogą dołączyć `continuationMessage`, aby start wznowił jedną następną turę agenta przez kolejkę kontynuacji po restarcie. Aktualizacje menedżera pakietów wymuszają nieodroczony restart aktualizacji bez czasu schładzania po podmianie pakietu, aby stary proces Gateway nie kontynuował leniwego ładowania z zastąpionego drzewa `dist`.
    - `update.status` zwraca najnowszy buforowany sentinel restartu aktualizacji, w tym uruchomioną wersję po restarcie, gdy jest dostępna.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator wdrażania przez WS RPC.

  </Accordion>

  <Accordion title="Pomocniki agenta i przestrzeni roboczej">
    - `agents.list` zwraca skonfigurowane wpisy agentów, w tym efektywny model i metadane środowiska uruchomieniowego.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów i połączeniem z przestrzenią roboczą.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami startowymi przestrzeni roboczej ujawnionymi agentowi.
    - `tasks.list`, `tasks.get` i `tasks.cancel` udostępniają rejestr zadań Gateway klientom SDK i operatorskim.
    - `artifacts.list`, `artifacts.get` i `artifacts.download` udostępniają podsumowania artefaktów pochodzących z transkryptu i pobrania dla jawnego zakresu `sessionKey`, `runId` albo `taskId`. Zapytania o uruchomienia i zadania rozwiązują sesję właściciela po stronie serwera i zwracają tylko media transkryptu z pasującą proweniencją; niebezpieczne lub lokalne źródła URL zwracają nieobsługiwane pobrania zamiast pobierania po stronie serwera.
    - `environments.list` i `environments.status` udostępniają klientom SDK tylko do odczytu wykrywanie środowisk lokalnych dla Gateway i węzłów.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcową migawkę, gdy jest dostępna.

  </Accordion>

  <Accordion title="Sterowanie sesją">
    - `sessions.list` zwraca bieżący indeks sesji, w tym metadane `agentRuntime` dla każdego wiersza, gdy skonfigurowano backend środowiska uruchomieniowego agenta.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkryptu / wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkryptów dla określonych kluczy sesji.
    - `sessions.describe` zwraca jeden wiersz sesji Gateway dla dokładnego klucza sesji.
    - `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant przerwania i ukierunkowania dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji. Wywołujący może przekazać `key` oraz opcjonalne `runId` albo przekazać samo `runId` dla aktywnych uruchomień, które Gateway może rozwiązać do sesji.
    - `sessions.patch` aktualizuje metadane / nadpisania sesji i raportuje rozwiązany model kanoniczny oraz efektywne `agentRuntime`.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest normalizowane do wyświetlania dla klientów UI: wbudowane tagi dyrektyw są usuwane z widocznego tekstu, tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi) i ujawnione tokeny sterujące modelu ASCII / pełnej szerokości są usuwane, czyste wiersze asystenta z cichymi tokenami, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a zbyt duże wiersze mogą zostać zastąpione placeholderami.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.

  </Accordion>

  <Accordion title="Parowanie węzłów, invoke i praca oczekująca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` i `node.pair.verify` obejmują parowanie węzłów i weryfikację bootstrapu.
    - `node.list` i `node.describe` zwracają stan znanych / połączonych węzłów.
    - `node.rename` aktualizuje etykietę sparowanego węzła.
    - `node.invoke` przekazuje polecenie do połączonego węzła.
    - `node.invoke.result` zwraca wynik żądania invoke.
    - `node.event` przenosi zdarzenia pochodzące z węzła z powrotem do gatewaya.
    - `node.pending.pull` i `node.pending.ack` to API kolejki połączonego węzła.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą pracą oczekującą dla węzłów offline / rozłączonych.

  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia exec oraz wyszukiwanie/odtwarzanie oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie exec i zwraca ostateczną decyzję (albo `null` po przekroczeniu limitu czasu).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają migawkami zasad zatwierdzania exec Gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalnymi dla node zasadami zatwierdzania exec za pomocą poleceń przekaźnika node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują przepływy zatwierdzania zdefiniowane przez plugin.

  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe lub przy następnym heartbeat wstrzyknięcie tekstu wybudzającego; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject`, oraz inne zdarzenia czatu
  tylko w transkrypcie.
- `session.message` i `session.tool`: aktualizacje transkryptu/strumienia zdarzeń dla
  subskrybowanej sesji.
- `sessions.changed`: indeks sesji lub metadane uległy zmianie.
- `presence`: aktualizacje migawki obecności systemu.
- `tick`: okresowe zdarzenie utrzymania połączenia / żywotności.
- `health`: aktualizacja migawki kondycji gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania cron.
- `shutdown`: powiadomienie o zamknięciu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania node.
- `node.invoke.request`: rozgłaszanie żądania wywołania node.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniono konfigurację wyzwalacza słowa wybudzającego.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia zatwierdzenia exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzenia plugin.

### Metody pomocnicze node

- Node mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych skill
  na potrzeby kontroli automatycznego zezwalania.

### RPC rejestru zadań

Klienty operatora mogą sprawdzać i anulować rekordy zadań w tle Gateway za pomocą
RPC rejestru zadań. Te metody zwracają oczyszczone podsumowania zadań, a nie surowy
stan środowiska wykonawczego.

- `tasks.list` wymaga `operator.read`.
  - Parametry: opcjonalny `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` lub `"timed_out"`) albo tablica tych statusów,
    opcjonalny `agentId`, opcjonalny `sessionKey`, opcjonalny `limit` od `1` do
    `500` oraz opcjonalny ciąg `cursor`.
  - Wynik: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` wymaga `operator.read`.
  - Parametry: `{ "taskId": string }`.
  - Wynik: `{ "task": TaskSummary }`.
  - Brakujące identyfikatory zadań zwracają kształt błędu not-found Gateway.
- `tasks.cancel` wymaga `operator.write`.
  - Parametry: `{ "taskId": string, "reason"?: string }`.
  - Wynik:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informuje, czy rejestr zawierał pasujące zadanie. `cancelled`
    informuje, czy środowisko wykonawcze zaakceptowało lub odnotowało anulowanie.

`TaskSummary` zawiera `id`, `status` oraz opcjonalne metadane, takie jak `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, znaczniki czasu, postęp,
podsumowanie terminalne oraz oczyszczony tekst błędu.

### Metody pomocnicze operatora

- Operatorzy mogą wywołać `commands.list` (`operator.read`), aby pobrać inwentarz
  poleceń środowiska wykonawczego dla agenta.
  - `agentId` jest opcjonalny; pomiń go, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, do której powierzchni odnosi się podstawowy `name`:
    - `text` zwraca podstawowy token polecenia tekstowego bez początkowego `/`
    - `native` oraz domyślna ścieżka `both` zwracają natywne nazwy świadome providera,
      gdy są dostępne
  - `textAliases` przenosi dokładne aliasy z ukośnikiem, takie jak `/model` i `/m`.
  - `nativeName` przenosi natywną nazwę polecenia świadomą providera, gdy taka istnieje.
  - `provider` jest opcjonalny i wpływa tylko na nazewnictwo natywne oraz dostępność
    natywnych poleceń plugin.
  - `includeArgs=false` pomija serializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywołać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi środowiska wykonawczego dla
  agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel plugin, gdy `source="plugin"`
  - `optional`: czy narzędzie plugin jest opcjonalne
- Operatorzy mogą wywołać `tools.effective` (`operator.read`), aby pobrać efektywny w środowisku wykonawczym
  inwentarz narzędzi dla sesji.
  - `sessionKey` jest wymagany.
  - Gateway wyprowadza zaufany kontekst środowiska wykonawczego z sesji po stronie serwera, zamiast akceptować
    kontekst uwierzytelniania lub dostarczania dostarczony przez wywołującego.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, czego aktywna rozmowa może użyć w tej chwili,
    w tym narzędzia core, plugin i kanału.
- Operatorzy mogą wywołać `tools.invoke` (`operator.write`), aby wywołać jedno dostępne narzędzie przez tę samą
  ścieżkę zasad gateway co `/tools/invoke`.
  - `name` jest wymagany. `args`, `sessionKey`, `agentId`, `confirm` i
    `idempotencyKey` są opcjonalne.
  - Jeśli obecne są zarówno `sessionKey`, jak i `agentId`, rozpoznany agent sesji musi pasować do
    `agentId`.
  - Odpowiedź jest kopertą dla SDK z polami `ok`, `toolName`, opcjonalnym `output` oraz typowanymi
    polami `error`. Odmowy zatwierdzenia lub zasad zwracają `ok:false` w ładunku, zamiast
    omijać potok zasad narzędzi gateway.
- Operatorzy mogą wywołać `skills.status` (`operator.read`), aby pobrać widoczny
  inwentarz skill dla agenta.
  - `agentId` jest opcjonalny; pomiń go, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz
    oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywołać `skills.search` i `skills.detail` (`operator.read`) dla
  metadanych odkrywania ClawHub.
- Operatorzy mogą wywołać `skills.upload.begin`, `skills.upload.chunk` i
  `skills.upload.commit` (`operator.admin`), aby przygotować prywatne archiwum skill
  przed jego instalacją. Jest to oddzielna ścieżka przesyłania administracyjnego dla zaufanych klientów,
  a nie normalny przepływ instalacji skill z ClawHub, i jest domyślnie wyłączona, chyba że
  włączono `skills.install.allowUploadedArchives`.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    tworzy przesyłanie powiązane z tym slug i wartością force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` dołącza bajty przy
    dokładnym zdekodowanym przesunięciu.
  - `skills.upload.commit({ uploadId, sha256? })` weryfikuje końcowy rozmiar i
    SHA-256. Commit tylko finalizuje przesyłanie; nie instaluje skill.
  - Przesłane archiwa skill są archiwami zip zawierającymi główny `SKILL.md`. Wewnętrzna
    nazwa katalogu archiwum nigdy nie wybiera celu instalacji.
- Operatorzy mogą wywołać `skills.install` (`operator.admin`) w trzech trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje folder
    skill w katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb przesyłania: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instaluje zatwierdzone przesyłanie w katalogu `skills/<slug>`
    domyślnego obszaru roboczego agenta. Slug i wartość force muszą pasować do pierwotnego
    żądania `skills.upload.begin`. Ten tryb jest odrzucany, chyba że
    włączono `skills.install.allowUploadedArchives`. Ustawienie nie wpływa na
    instalacje ClawHub.
  - Tryb instalatora Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście gateway.
- Operatorzy mogą wywołać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug lub wszystkie śledzone instalacje ClawHub w
    domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji łata wartości `skills.entries.<skillKey>`, takie jak `enabled`,
    `apiKey` i `env`.

### Widoki `models.list`

`models.list` akceptuje opcjonalny parametr `view`:

- Pominięte lub `"default"`: bieżące zachowanie środowiska wykonawczego. Jeśli skonfigurowano `agents.defaults.models`, odpowiedzią jest dozwolony katalog, w tym dynamicznie odkryte modele dla wpisów `provider/*`. W przeciwnym razie odpowiedzią jest pełny katalog Gateway.
- `"configured"`: zachowanie o rozmiarze selektora. Jeśli skonfigurowano `agents.defaults.models`, nadal ma pierwszeństwo, w tym odkrywanie ograniczone do providera dla wpisów `provider/*`. Bez listy dozwolonych odpowiedź używa jawnych wpisów `models.providers.*.models`, przechodząc na pełny katalog tylko wtedy, gdy nie istnieją żadne skonfigurowane wiersze modeli.
- `"all"`: pełny katalog Gateway, z pominięciem `agents.defaults.models`. Używaj tego do diagnostyki i UI odkrywania, a nie do zwykłych selektorów modeli.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, gateway rozgłasza `exec.approval.requested`.
- Klienty operatora rozstrzygają je, wywołując `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node`, `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazywane wywołania `node.invoke system.run` ponownie używają tego kanonicznego
  `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmodyfikuje `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` między przygotowaniem a ostatecznym zatwierdzonym przekazaniem `system.run`, gateway
  odrzuca uruchomienie, zamiast ufać zmodyfikowanemu ładunkowi.

## Awaryjne dostarczanie agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczenia wychodzącego.
- `bestEffortDeliver=false` utrzymuje ścisłe zachowanie: nierozpoznane lub tylko wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na przejście do wykonania tylko w sesji, gdy nie da się rozpoznać żadnej zewnętrznej trasy dostarczania (na przykład sesje wewnętrzne/webchat lub niejednoznaczne konfiguracje wielokanałowe).
- Końcowe wyniki `agent` mogą zawierać `result.deliveryStatus`, gdy żądano dostarczenia,
  używając tych samych statusów `sent`, `suppressed`, `partial_failed` i `failed`
  udokumentowanych dla [`openclaw agent --json --deliver`](/pl/cli/agent#json-delivery-status).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/version.ts`.
- Klienty wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niezgodności.
- Schematy i modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości są
stabilne w protokole v4 i stanowią oczekiwaną bazę dla klientów zewnętrznych.

| Stała                                    | Domyślne                                             | Źródło                                                                                     |
| ---------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                       | `4`                                                  | `src/gateway/protocol/version.ts`                                                          |
| Limit czasu żądania (na RPC)             | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Limit czasu preauth / connect-challenge  | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (config/env może zwiększyć sparowany budżet serwera/klienta) |
| Początkowy backoff ponownego połączenia  | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksymalny backoff ponownego połączenia  | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Ograniczenie szybkiej ponownej próby po zamknięciu device-token | `250` ms                             | `src/gateway/client.ts`                                                                    |
| Okres łaski force-stop przed `terminate()` | `250` ms                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Domyślny limit czasu `stopAndWait()`     | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Domyślny interwał tick (przed `hello-ok`) | `30_000` ms                                         | `src/gateway/client.ts`                                                                    |
| Zamknięcie po limicie czasu tick         | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                      | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                          |

Serwer ogłasza efektywne `policy.tickIntervalMs`, `policy.maxPayload`
oraz `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości
zamiast domyślnych ustawień sprzed uzgadniania.

## Uwierzytelnianie

- Uwierzytelnianie Gateway za pomocą wspólnego sekretu używa `connect.params.auth.token` albo
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby niosące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) albo nie-loopback
  `gateway.auth.mode: "trusted-proxy"`, spełniają kontrolę uwierzytelniania połączenia na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatny ingress `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie połączenia
  wspólnym sekretem; nie wystawiaj tego trybu na publiczny/niezaufany ingress.
- Po sparowaniu Gateway wystawia **token urządzenia** ograniczony do roli połączenia
  + zakresów. Jest zwracany w `hello-ok.auth.deviceToken` i powinien być
  utrwalony przez klienta na potrzeby przyszłych połączeń.
- Klienci powinni utrwalać podstawowy `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne łączenie z tym **zapisanym** tokenem urządzenia powinno również ponownie użyć zapisanego
  zatwierdzonego zestawu zakresów dla tego tokena. Zachowuje to dostęp do odczytu/sondowania/statusu,
  który został już przyznany, i zapobiega cichemu zawężaniu ponownych połączeń do
  węższego, domyślnego zakresu tylko administracyjnego.
- Składanie uwierzytelniania połączenia po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest ortogonalne i zawsze przekazywane, gdy jest ustawione.
  - `auth.token` jest wypełniany według priorytetu: najpierw jawny token współdzielony,
    następnie jawny `deviceToken`, a potem zapisany token dla urządzenia (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żaden z powyższych nie rozwiązał
    `auth.token`. Wspólny token albo dowolny rozwiązany token urządzenia go wyłącza.
  - Automatyczne promowanie zapisanego tokena urządzenia przy jednorazowej ponownej próbie
    `AUTH_TOKEN_MISMATCH` jest ograniczone wyłącznie do **zaufanych punktów końcowych** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez przypięcia się nie kwalifikuje.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` są tokenami przekazania bootstrap.
  Utrwalaj je tylko wtedy, gdy połączenie użyło uwierzytelniania bootstrap przez zaufany transport,
  taki jak `wss://` albo parowanie loopback/lokalne.
- Jeśli klient podaje **jawny** `deviceToken` albo jawne `scopes`, ten
  żądany przez wywołującego zestaw zakresów pozostaje nadrzędny; zakresy z pamięci podręcznej są
  ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokena dla urządzenia.
- Tokeny urządzeń można rotować/unieważniać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- `device.token.rotate` zwraca metadane rotacji. Zwraca zastępczy
  bearer token tylko dla wywołań z tego samego urządzenia, które są już uwierzytelnione za pomocą
  tego tokena urządzenia, dzięki czemu klienci używający wyłącznie tokena mogą utrwalić zamiennik przed
  ponownym połączeniem. Rotacje współdzielone/administracyjne nie zwracają bearer tokena.
- Wystawianie, rotacja i unieważnianie tokenów pozostają ograniczone do zatwierdzonego zestawu ról
  zapisanego we wpisie parowania danego urządzenia; mutacja tokena nie może rozszerzyć ani
  wskazać roli urządzenia, której nigdy nie przyznało zatwierdzenie parowania.
- W sesjach tokenów sparowanych urządzeń zarządzanie urządzeniami jest samoograniczone, chyba że
  wywołujący ma również `operator.admin`: wywołujący bez uprawnień administratora mogą usuwać/unieważniać/rotować
  tylko wpis **własnego** urządzenia.
- `device.token.rotate` i `device.token.revoke` sprawdzają również docelowy zestaw zakresów tokena operatora
  względem bieżących zakresów sesji wywołującego. Wywołujący bez uprawnień administratora
  nie mogą rotować ani unieważniać szerszego tokena operatora niż ten, który już posiadają.
- Błędy uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z tokenem dla urządzenia z pamięci podręcznej.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownych połączeń i pokazać operatorowi wskazówki działania.

## Tożsamość urządzenia + parowanie

- Węzły powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  odcisku palca pary kluczy.
- Gateways wystawiają tokeny na urządzenie + rolę.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączone jest lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania koncentruje się na bezpośrednich połączeniach local loopback.
- OpenClaw ma również wąską ścieżkę samopołączenia lokalną dla backendu/kontenera dla
  zaufanych przepływów pomocniczych ze wspólnym sekretem.
- Połączenia z tej samej maszyny przez tailnet albo LAN są nadal traktowane jako zdalne przy parowaniu i
  wymagają zatwierdzenia.
- Klienci WS zwykle dołączają tożsamość `device` podczas `connect` (operator +
  węzeł). Jedynymi wyjątkami operatora bez urządzenia są jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niezabezpieczonym HTTP wyłącznie na localhost.
  - udane uwierzytelnianie Control UI operatora przez `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tryb awaryjny, poważne obniżenie bezpieczeństwa).
  - backendowe RPC `gateway-client` przez bezpośredni loopback, uwierzytelnione współdzielonym
    tokenem/hasłem Gateway.
- Wszystkie połączenia muszą podpisać nonce `connect.challenge` podany przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed challenge, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` w `error.details.code` ze stabilnym `error.details.reason`.

Typowe błędy migracji:

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
- Wysyłaj ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól device/client/role/scopes/token/nonce.
- Starsze podpisy `v2` pozostają akceptowane dla zgodności, ale przypinanie metadanych sparowanego urządzenia
  nadal kontroluje politykę poleceń przy ponownym połączeniu.

## TLS + przypinanie

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk palca certyfikatu Gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` albo CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API Gateway** (status, kanały, modele, czat,
agent, sesje, węzły, zatwierdzenia itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.

## Powiązane

- [Protokół mostka](/pl/gateway/bridge-protocol)
- [Procedura operacyjna Gateway](/pl/gateway)
