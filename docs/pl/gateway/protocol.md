---
read_when:
    - Implementowanie lub aktualizowanie klientów WS Gateway
    - Debugowanie niezgodności protokołu lub błędów połączenia
    - Ponowne generowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie połączenia, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-07-16T18:26:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc92cfed4cf1bcc7b9499d90eef9f9225a89c0e6a71bb6230bb416f8f6884b5
    source_path: gateway/protocol.md
    workflow: 16
---

Protokół WS Gateway jest pojedynczą płaszczyzną sterowania i transportem węzłów dla
OpenClaw. Klienci operatora i węzłów (CLI, interfejs WWW, aplikacja macOS, węzły iOS/Android,
węzły bez interfejsu) łączą się przez WebSocket i deklarują **rolę** oraz **zakres** podczas
uzgadniania połączenia.

## Transport i ramkowanie

- WebSocket, ramki tekstowe, ładunki JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Po
  uzgodnieniu połączenia obowiązują `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Gdy diagnostyka jest włączona, zbyt duże
  ramki przychodzące i wolne bufory wychodzące emitują zdarzenia `payload.large`, zanim
  Gateway zamknie połączenie lub odrzuci ramkę. Zdarzenia te zawierają `surface`, rozmiary
  w bajtach, limity i bezpieczny kod przyczyny, ale nigdy treści wiadomości, zawartości
  załączników, nieprzetworzonych bajtów ramek, tokenów, plików cookie ani sekretów.

Postacie ramek:

- Żądanie: `{type:"req", id, method, params}`
- Odpowiedź: `{type:"res", id, ok, payload|error}`
- Zdarzenie: `{type:"event", event, payload, seq?, stateVersion?}`

Metody wywołujące skutki uboczne wymagają kluczy idempotencji (zobacz schemat).

## Uzgadnianie połączenia

Gateway wysyła wyzwanie przed połączeniem:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Klient odpowiada za pomocą `connect`:

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

Gateway odpowiada za pomocą `hello-ok`:

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

`server`, `features`, `snapshot`, `policy` i `auth` są wymagane przez
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`). `auth`
zgłasza wynegocjowaną rolę i zakresy nawet wtedy, gdy nie wydano tokenu urządzenia (postać
powyżej). `pluginSurfaceUrls` jest opcjonalne i mapuje nazwy powierzchni pluginów (np.
`canvas`) na adresy URL hostowane w określonym zakresie; wpis może wygasnąć, dlatego węzły wywołują
`node.pluginSurface.refresh` z `{ "surface": "canvas" }`, aby uzyskać nowy wpis.
Przestarzała ścieżka `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
nie jest obsługiwana; należy używać powierzchni pluginów.
Opcjonalne `appliedConfigHash` migawki jest rozstrzygniętą rewizją konfiguracji źródłowej
zaakceptowaną przez aktywne środowisko uruchomieniowe Gateway. Klienci mogą porównać ją z
`config.get.configRevisionHash`, aby ustalić, czy nowsza zapisana konfiguracja nadal
wymaga ponownego uruchomienia. `config.get.hash` pozostaje nieprzetworzoną rewizją pliku głównego używaną przez
mechanizmy ochrony przed konfliktami zapisu konfiguracji.

Gdy Gateway nadal kończy uruchamianie procesów pomocniczych, `connect` może zwrócić
ponawialny błąd `UNAVAILABLE` z `details.reason: "startup-sidecars"` i
`retryAfterMs`. Należy ponowić próbę w ramach budżetu czasu połączenia, zamiast traktować go jako
końcowy błąd uzgadniania połączenia.

Po wydaniu tokenu urządzenia `hello-ok.auth` dodaje go:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Wbudowana inicjalizacja za pomocą kodu QR/kodu konfiguracji jest ścieżką przekazania do urządzenia mobilnego. Pomyślne
połączenie bazowe z kodem konfiguracji zwraca główny token węzła oraz jeden token
operatora o ograniczonym zakresie:

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

To przekazanie operatora jest celowo ograniczone: wystarcza do uruchomienia mobilnej
pętli operatora i natywnej konfiguracji, w tym `operator.talk.secrets` do odczytów
konfiguracji Talk, ale nie obejmuje zakresów modyfikacji parowania ani `operator.admin`. Szerszy
dostęp do parowania lub administracji wymaga oddzielnego zatwierdzonego przepływu parowania albo tokenu. Należy utrwalać
`hello-ok.auth.deviceTokens` tylko wtedy, gdy uwierzytelnianie inicjalizacyjne odbywało się przez zaufany
transport (`wss://` lub parowanie przez interfejs pętli zwrotnej/lokalne).

Zaufani klienci zaplecza działający w tym samym procesie (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogą pominąć `device` w bezpośrednich połączeniach przez interfejs pętli zwrotnej podczas
uwierzytelniania za pomocą współdzielonego tokenu/hasła Gateway. Ta ścieżka jest zarezerwowana
dla wewnętrznych wywołań RPC płaszczyzny sterowania (np. aktualizacji sesji podagentów) i zapobiega
blokowaniu lokalnej pracy zaplecza przez nieaktualne bazowe ustawienia parowania CLI/urządzenia. Klienci zdalni,
pochodzący z przeglądarki, węzłowi oraz jawnie korzystający z tokenu lub tożsamości urządzenia nadal
przechodzą zwykłe kontrole parowania i rozszerzania zakresu.

### Rola procesu roboczego i protokół zamknięty

Procesy robocze w chmurze korzystają z dedykowanego punktu wejścia przez interfejs pętli zwrotnej za pośrednictwem należącego do Gateway,
przypiętego do klucza hosta tunelu SSH. Akceptuje on wyłącznie tożsamość procesu roboczego i nigdy nie kieruje
ogólnego uwierzytelniania, zdarzeń węzłów, wywołań RPC operatora ani metod pluginów. Ścisłe `connect`
weryfikuje zapisane jako skrót, krótkotrwałe poświadczenie powiązane ze środowiskiem, skrótem
pakietu, epoką właściciela, wersją zestawu RPC, czasem wygaśnięcia i jedną opcjonalną sesją;
oddzielnie sprawdza bieżącą wersję i zestaw funkcji. Powodzenie zwraca minimalne
`worker-hello-ok`; negocjowanie funkcji jest niezależne od wersji protokołu
ogólnego. Ramki pozostają mniejsze niż 64 KiB, z wyjątkiem wynegocjowanej ramki `worker.inference.start`,
która może mieć do 25 MiB. Zamknięta lista dozwolonych elementów zawiera `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start` i
`worker.inference.cancel`.

Zatwierdzanie transkrypcji korzysta z ochrony epoką właściciela, powiązania sesji należącego do Gateway,
operacji porównania i zamiany liścia bazowego oraz trwałego odtwarzania sekwencji; Gateway generuje
identyfikatory wpisów i elementów nadrzędnych transkrypcji za pośrednictwem zwykłego mechanizmu zapisu sesji. Własność i
czas wygaśnięcia są ponownie sprawdzane przy każdym wywołaniu RPC.

### Możliwości klienta

Klienci operatora mogą ogłaszać opcjonalne możliwości w `connect.params.caps`:

- `tool-events`: akceptuje ustrukturyzowane zdarzenia cyklu życia narzędzi.
- `inline-widgets`: może renderować wyniki hostowanych narzędzi widżetów osadzonych.

Możliwości klienta opisują połączonego klienta, a nie autoryzację. Narzędzia agenta mogą deklarować wymagane możliwości; Gateway pomija te narzędzia, chyba że każde wymaganie występuje w `caps` klienta inicjującego. Uruchomienia pochodzące z kanałów nie mają możliwości klienta Gateway, dlatego narzędzia ograniczone możliwościami są niedostępne nawet wtedy, gdy zasady narzędzi jawnie na nie zezwalają.

### Przykład połączenia węzła

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

Węzły deklarują możliwości podczas nawiązywania połączenia:

- `caps`: kategorie wysokiego poziomu, takie jak `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: lista dozwolonych poleceń do wywołania.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako deklaracje i wymusza listy dozwolonych elementów po stronie serwera.

## Role i zakresy

Pełny model zakresów operatora, kontrole podczas zatwierdzania oraz semantykę
współdzielonych sekretów opisano w sekcji [Zakresy operatora](/pl/gateway/operator-scopes).

Role:

- `operator`: klient płaszczyzny sterowania (CLI/interfejs użytkownika/automatyzacja).
- `node`: host możliwości (aparat/ekran/płótno/system.run).
- `worker`: host wykonywania w chmurze korzystający z dedykowanego, zamkniętego protokołu procesów roboczych.

Zakresy operatora (`src/gateway/operator-scopes.ts`), pełny zamknięty zestaw:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` z `includeSecrets: true` wymaga `operator.talk.secrets` (lub
`operator.admin`). Gdy dołączone są sekrety, należy odczytać poświadczenie aktywnego dostawcy Talk
z `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
zachowuje postać źródłową i może być obiektem SecretRef albo zredagowanym ciągiem znaków.

Metody RPC Gateway rejestrowane przez pluginy mogą wymagać własnego zakresu operatora,
ale następujące zarezerwowane prefiksy rdzenia zawsze odpowiadają `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

Zakres metody jest tylko pierwszą kontrolą. Niektóre polecenia z ukośnikiem dostępne za pośrednictwem
`chat.send` stosują ściślejsze kontrole na poziomie poleceń: trwałe zapisy `/config set` i
`/config unset` wymagają `operator.admin` nawet w przypadku klientów Gateway, którzy
mają już niższy zakres operatora.

`node.pair.approve` ma dodatkową kontrolę zakresu podczas zatwierdzania, ponad bazowy
zakres metody (`operator.pairing`), opartą na zadeklarowanym
`commands` oczekującego żądania (`src/infra/node-pairing-authz.ts`):

| Zadeklarowane polecenia                                                                                                       | Wymagane zakresy                       |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| brak                                                                                                                          | `operator.pairing`                    |
| zwykłe polecenia                                                                                                              | `operator.pairing` + `operator.write` |
| obejmuje `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` lub `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### Możliwości/polecenia/uprawnienia (węzeł)

Węzły deklarują możliwości podczas nawiązywania połączenia:

- `caps`: kategorie możliwości wysokiego poziomu, takie jak `camera`, `canvas`, `screen`,
  `location`, `voice` i `talk`.
- `commands`: lista dozwolonych poleceń do wywołania.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **deklaracje** i wymusza listy dozwolonych elementów po stronie serwera.
Po pomyślnym połączeniu lub ponownym połączeniu połączone węzły mogą publikować opcjonalne,
widoczne dla agenta deskryptory narzędzi pluginów lub MCP za pomocą `node.pluginTools.update`.
Hosty węzłów bez interfejsu graficznego uruchamiają się ponownie, aby zastosować zmiany
deklaratywnego wykazu MCP. Ta metoda aktualizacji jest jedyną ścieżką publikacji;
deskryptory narzędzi pluginów nie są akceptowane w parametrach
`connect`. Każdy deskryptor musi używać bezpiecznego dla dostawcy narzędzia `name` i wskazywać
`command` znajdujące się na bieżącej liście dozwolonych poleceń węzła. Gateway ufa metadanym
deskryptorów z powiązanego węzła, odfiltrowuje deskryptory spoza zatwierdzonego
zakresu poleceń, usuwa je po rozłączeniu węzła i odrzuca podejmowane przez operatora
próby modyfikowania katalogu innego węzła. Ustaw `gateway.nodes.pluginTools.enabled: false`,
aby ignorować deskryptory publikowane przez węzły.

Połączone hosty węzłów publikują pełny katalog zastępczy umiejętności za pomocą
`node.skills.update`. Ta metoda roli węzła jest jedyną ścieżką publikacji umiejętności
węzła; umiejętności nie są akceptowane w parametrach `connect`. Każdy deskryptor zawiera
bezpieczną nazwę, opis oraz treść `SKILL.md` o ograniczonym rozmiarze. Gateway analizuje tę
treść przy użyciu standardowego modułu ładującego umiejętności, uwzględnia ją w migawkach
umiejętności agenta, gdy węzeł jest połączony, i usuwa ją po rozłączeniu. Ustaw
`gateway.nodes.skills.enabled: false`, aby ignorować umiejętności publikowane przez węzły.

## Obecność

- `system-presence` zwraca wpisy indeksowane według tożsamości urządzenia, obejmujące
  `deviceId`, `roles` i `scopes`, dzięki czemu interfejsy mogą wyświetlać jeden wiersz na urządzenie, nawet
  gdy łączy się ono zarówno jako operator, jak i węzeł.
- `node.list` zawiera opcjonalne `lastSeenAtMs` i `lastSeenReason`. Połączone
  węzły zgłaszają bieżący czas połączenia z przyczyną `connect`; powiązane węzły mogą
  również zgłaszać trwałą obecność w tle za pośrednictwem zaufanego zdarzenia węzła.

Natywne węzły systemu macOS mogą również wysyłać uwierzytelnione zdarzenia `node.presence.activity`
z ograniczonym czasem bezczynności wejścia. Gateway wyznacza znaczniki czasu aktywności według
własnego zegara, udostępnia ostatnio aktywny połączony komputer Mac przez `node.list` i
`node.describe` oraz rozgłasza aktualizacje `node.presence` do klientów z zakresem odczytu.
Informacje o wyborze, prywatności, kontekście modelu i sposobie kierowania powiadomień
zawiera sekcja [Obecność aktywnego komputera](/nodes/presence).

### Zdarzenie aktywności węzła w tle

Węzły wywołują `node.event` z `event: "node.presence.alive"`, aby zarejestrować, że
powiązany węzeł był aktywny podczas wybudzenia w tle, bez oznaczania go jako połączonego:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"iPhone Petera\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` jest zamkniętym typem wyliczeniowym: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Nieznane wartości są normalizowane do
`background` (`src/shared/node-presence.ts`). Zdarzenie jest utrwalane wyłącznie dla
uwierzytelnionych sesji urządzeń węzłowych; sesje bez urządzenia lub niepowiązane zwracają
`handled: false`.

Gateway po pomyślnym przetworzeniu zwraca ustrukturyzowany wynik:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Starsze wersje Gateway mogą zwracać tylko `{ "ok": true }` dla `node.event`; należy traktować to
jako potwierdzenie RPC, a nie trwałe utrwalenie obecności.

## Zakres zdarzeń rozgłoszeniowych

Zdarzenia rozgłoszeniowe wysyłane przez serwer są ograniczane według zakresu, aby sesje
ograniczone do parowania lub wyłącznie węzłowe nie otrzymywały pasywnie treści sesji
(`src/gateway/server-broadcast.ts`):

- Ramki czatu, agenta i wyników narzędzi (strumieniowane zdarzenia `agent`, zdarzenia
  wyników narzędzi) wymagają co najmniej `operator.read`. Sesje bez tego
  zakresu całkowicie pomijają te ramki.
- Rozgłoszenia `plugin.*` zdefiniowane przez plugin są domyślnie ograniczone do `operator.write` lub
  `operator.admin`; jawne wpisy, takie jak
  `plugin.approval.requested` / `plugin.approval.resolved`, używają zamiast tego
  `operator.approvals`.
- Zdarzenia stanu/transportu (`heartbeat`, `presence`, `tick`, cykl życia
  połączenia/rozłączenia) pozostają nieograniczone, aby stan transportu był widoczny dla każdej
  uwierzytelnionej sesji.
- Nieznane rodziny zdarzeń rozgłoszeniowych są domyślnie ograniczane według zakresu
  (zasada bezpiecznego odrzucania), chyba że zarejestrowana procedura obsługi jawnie złagodzi te ograniczenia.

Każde połączenie klienta utrzymuje własny numer sekwencyjny dla danego klienta, dzięki czemu
zdarzenia rozgłoszeniowe zachowują monotoniczną kolejność w tym gnieździe, nawet gdy różni klienci
widzą różne, odfiltrowane według zakresu podzbiory strumienia zdarzeń.

## Rodziny metod RPC

`hello-ok.features.methods` jest zachowawczą listą wykrywania utworzoną na podstawie
`src/gateway/server-methods-list.ts` oraz eksportów metod załadowanych pluginów/kanałów
— nie jest to automatycznie wygenerowany wykaz wszystkich metod, a niektóre metody (na
przykład `push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
są celowo wykluczone z wykrywania, mimo że są rzeczywistymi metodami, które można
wywołać. Należy traktować tę listę jako mechanizm wykrywania funkcji, a nie pełne wyliczenie
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System i tożsamość">
    - `health` zwraca buforowaną lub świeżo sprawdzoną migawkę kondycji Gateway.
    - `diagnostics.stability` zwraca ostatnie wpisy rejestratora stabilności diagnostycznej o ograniczonym rozmiarze: nazwy zdarzeń, liczby, rozmiary w bajtach, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów i identyfikatory sesji. Bez tekstu czatu, treści webhooków, wyników narzędzi, nieprzetworzonych treści żądań/odpowiedzi, tokenów, plików cookie ani sekretów. Wymaga `operator.read`.
    - `status` zwraca podsumowanie Gateway w stylu `/status`; pola poufne są dostępne tylko dla klientów operatora z zakresem administratora.
    - `gateway.identity.get` zwraca tożsamość urządzenia Gateway używaną w przepływach przekazywania i parowania.
    - `system-presence` zwraca bieżącą migawkę obecności połączonych urządzeń operatora/węzła.
    - `system-event` dołącza zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
    - `last-heartbeat` zwraca ostatnie utrwalone zdarzenie Heartbeat.
    - `set-heartbeats` włącza lub wyłącza przetwarzanie Heartbeat w Gateway.
    - `gateway.suspend.prepare` tworzy krótką dzierżawę kooperacyjnego wstrzymania tylko wtedy, gdy śledzone zadania Gateway są bezczynne. `gateway.suspend.status` sprawdza tę dzierżawę, a `gateway.suspend.resume` zwalnia ją po wznowieniu lub przerwaniu operacji hosta.

  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolonych w środowisku wykonawczym. Zobacz sekcję „Widoki `models.list`” poniżej.
    - `usage.status` zwraca podsumowania okien użycia dostawcy/pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat. Przekaż `agentId` dla jednego agenta lub `agentScope: "all"`, aby zagregować skonfigurowanych agentów.
    - `doctor.memory.status` zwraca stan gotowości pamięci wektorowej / buforowanych osadzeń dla aktywnego domyślnego obszaru roboczego agenta. Przekaż `{ "probe": true }` lub `{ "deep": true }` wyłącznie w celu jawnego sprawdzenia na żywo dostawcy osadzeń. Przekaż `{ "agentId": "agent-id" }`, aby ograniczyć statystyki magazynu Dreaming do jednego obszaru roboczego agenta; pominięcie go powoduje agregację skonfigurowanych obszarów roboczych Dreaming.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` i `doctor.memory.dedupeDreamDiary` akceptują opcjonalne `{ "agentId": "agent-id" }`; po jego pominięciu działają na skonfigurowanym domyślnym obszarze roboczym agenta.
    - `doctor.memory.remHarness` zwraca ograniczony podgląd zestawu testowego REM tylko do odczytu dla zdalnych klientów płaszczyzny sterowania, obejmujący ścieżki obszarów roboczych, fragmenty pamięci, wyrenderowany Markdown oparty na źródłach oraz kandydatów do głębokiej promocji. Wymaga `operator.read`.
    - `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji. Przekaż `agentId` dla jednego agenta lub `agentScope: "all"`, aby wyświetlić razem skonfigurowanych agentów.
      Obie metody użycia akceptują `mode: "specific"` ze strefą `timeZone` IANA, aby wyznaczać granice i przedziały dni kalendarzowych z uwzględnieniem czasu letniego. `utcOffset` pozostaje obsługiwane dla starszych klientów oraz jako mechanizm rezerwowy, gdy środowisko wykonawcze Gateway nie rozpoznaje żądanej strefy.
    - `sessions.usage.timeseries` zwraca szeregi czasowe użycia dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Kanały i narzędzia logowania">
    - `channels.status` zwraca podsumowania stanu wbudowanych i dołączonych kanałów/pluginów.
    - `channels.logout` wylogowuje określony kanał/konto, jeśli kanał to obsługuje.
    - `web.login.start` rozpoczyna przepływ logowania przez kod QR/sieć dla bieżącego dostawcy kanału internetowego obsługującego kody QR.
    - `web.login.wait` oczekuje na ukończenie tego przepływu i po powodzeniu uruchamia kanał.
    - `push.test` wysyła testowe powiadomienie push APNs do zarejestrowanego węzła iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słów aktywacyjnych.
    - `voicewake.set` aktualizuje wyzwalacze słów aktywacyjnych i rozgłasza zmianę.

  </Accordion>

  <Accordion title="Zarządzanie pluginami">
    - `plugins.list` (`operator.read`) zwraca wykaz zainstalowanych pluginów wraz z lokalnie wyselekcjonowanymi oficjalnymi propozycjami, diagnostyką oraz informacją, czy bieżący tryb instalacji zezwala na modyfikacje.
    - `plugins.search` (`operator.read`) wyszukuje możliwe do zainstalowania rodziny pluginów kodu i pluginów pakietowych ClawHub. Przekaż niepuste `query` oraz opcjonalne `limit` od 1 do 100.
    - `plugins.install` (`operator.admin`) instaluje wpis z oficjalnego katalogu za pomocą `{ source: "official", pluginId }` albo pakiet ClawHub za pomocą `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. Instalacje z ClawHub zachowują mechanizmy kontroli zaufania, integralności i zasad instalacji Gateway. Pomyślne instalacje wymagają ponownego uruchomienia Gateway.
    - `plugins.setEnabled` (`operator.admin`) zmienia zasadę włączenia jednego zainstalowanego pluginu za pomocą `{ pluginId, enabled }`. Odpowiedź zawiera zaktualizowany wpis katalogu, metadane ponownego uruchomienia i wszelkie ostrzeżenia dotyczące wyboru miejsca.
    - `plugins.uninstall` (`operator.admin`) usuwa jeden zewnętrznie zainstalowany plugin za pomocą `{ pluginId }`: odwołania w konfiguracji, rekord instalacji i zarządzane pliki. Dołączonych pluginów nie można odinstalować, a jedynie wyłączyć. Odpowiedź zawiera listę działań usuwania i zawsze wymaga ponownego uruchomienia Gateway.

  </Accordion>

  <Accordion title="Wiadomości i dzienniki">
    - `send` jest bezpośrednim RPC dostarczania wychodzącego dla wysyłek kierowanych do kanału/konta/wątku poza modułem uruchamiającym czat.
    - `logs.tail` zwraca końcowy fragment skonfigurowanego dziennika plikowego Gateway z ustawieniami kursora/limitu i maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Terminal operatora">
    - `terminal.open` uruchamia PTY hosta dla jawnie wskazanego `agentId` lub domyślnego agenta i zwraca ustalonego agenta, katalog roboczy, powłokę oraz stan izolacji.
    - `terminal.input`, `terminal.resize` i `terminal.close` działają wyłącznie na sesjach należących do połączenia wywołującego.
    - `terminal.upload` przyjmuje jeden plik zakodowany w base64 o rozmiarze do 16 MiB, umieszcza go w prywatnym, 24-godzinnym katalogu tymczasowym na hoście Gateway sesji lub sparowanego węzła i zwraca ścieżkę bezwzględną. Wywołujący nadal musi wkleić tę ścieżkę lub użyć jej w inny sposób; RPC nigdy nie zapisuje danych wejściowych terminala ani nie wykonuje polecenia.
    - Zdarzenia `terminal.data` i `terminal.exit` są przesyłane strumieniowo wyłącznie do połączenia będącego właścicielem sesji.
    - Sesje, których połączenie zostanie przerwane, są odłączane, a nie kończone: można je ponownie dołączyć przez `gateway.terminal.detachedSessionTimeoutSeconds` (domyślnie 300; `0` przywraca kończenie po rozłączeniu), podczas gdy najnowsze dane wyjściowe gromadzą się w ograniczonym buforze po stronie serwera.
    - `terminal.list` zwraca sesje, które można dołączyć; `terminal.attach` ponownie wiąże aktywną lub odłączoną sesję z połączeniem wywołującym i zwraca bufor powtórzeniowy (przejęcie w stylu tmux — poprzedni aktywny właściciel otrzymuje `terminal.exit` z powodem `detached`); `terminal.text` odczytuje bufor jako zwykły tekst bez dołączania.
    - Każda metoda terminala wymaga `operator.admin`; `gateway.terminal.enabled` musi mieć jawną wartość true. W pełni izolowani agenci są odrzucani, a zmiana zasad agenta zamyka istniejące i uruchamiane PTY, w tym odłączone.

  </Accordion>

  <Accordion title="Rozmowa i TTS">
    - `talk.catalog` zwraca katalog dostawców Rozmowy tylko do odczytu, przeznaczony do syntezy mowy, transkrypcji strumieniowej i głosu w czasie rzeczywistym: kanoniczne identyfikatory dostawców, aliasy rejestru, etykiety, stan konfiguracji, opcjonalny wynik `ready` na poziomie grupy, udostępnione identyfikatory modeli i głosów, kanoniczne tryby, transporty, strategie mechanizmu rozumowania oraz flagi dźwięku i możliwości czasu rzeczywistego, bez zwracania sekretów dostawców ani modyfikowania konfiguracji globalnej. Bieżące bramy ustawiają `ready` po zastosowaniu wyboru dostawcy środowiska uruchomieniowego; jego brak w starszych bramach należy traktować jako stan niezweryfikowany.
    - `talk.config` zwraca efektywny ładunek konfiguracji Rozmowy; `includeSecrets` wymaga `operator.talk.secrets` (lub `operator.admin`).
    - `talk.session.create` tworzy należącą do Gateway sesję Rozmowy dla `realtime/gateway-relay`, `transcription/gateway-relay` lub `stt-tts/managed-room`. W przypadku `stt-tts/managed-room` wywołujący `operator.write`, którzy przekazują `sessionKey`, muszą również przekazać `spawnedBy`, aby uzyskać widoczność klucza sesji ograniczoną do zakresu; tworzenie `sessionKey` bez zakresu oraz `brain: "direct-tools"` wymagają `operator.admin`.
    - `talk.session.join` weryfikuje token sesji zarządzanego pokoju, emituje odpowiednio `session.ready` lub `session.replaced` i zwraca metadane pokoju oraz sesji wraz z ostatnimi zdarzeniami Rozmowy, nigdy zaś token w postaci jawnego tekstu ani jego skrót.
    - `talk.session.appendAudio` dołącza wejściowy dźwięk PCM zakodowany w base64 do należących do Gateway sesji przekaźnika czasu rzeczywistego i transkrypcji.
    - `talk.session.startTurn`, `talk.session.endTurn` i `talk.session.cancelTurn` sterują cyklem życia tury zarządzanego pokoju, odrzucając nieaktualne tury przed wyczyszczeniem stanu.
    - `talk.session.cancelOutput` zatrzymuje wyjściowy dźwięk asystenta, głównie na potrzeby przerywania wypowiedzi sterowanego przez VAD w sesjach przekaźnika Gateway.
    - `talk.session.submitToolResult` kończy wywołanie narzędzia dostawcy wyemitowane przez należącą do Gateway sesję przekaźnika czasu rzeczywistego. Żądanie czeka na dowolny asynchroniczny sygnał zakończenia udostępniany przez most dostawcy; nieudane przesłania pozostawiają powiązane uruchomienie aktywne i nie emitują zdarzenia pomyślnego wyniku narzędzia. Należy przekazać `options: { willContinue: true }` dla pośrednich danych wyjściowych narzędzia lub `options: { suppressResponse: true }`, gdy most dostawcy deklaruje obsługę pomijania, a wynik nie powinien rozpoczynać kolejnej odpowiedzi.
    - `talk.session.steer` wysyła sterowanie głosowe aktywnym uruchomieniem do należącej do Gateway sesji Rozmowy opartej na agencie: `{ sessionId, text, mode? }`, gdzie `mode` to `status`, `steer`, `cancel` lub `followup`; pominięty tryb jest klasyfikowany na podstawie wypowiedzianego tekstu.
    - `talk.session.close` zamyka należącą do Gateway sesję przekaźnika, transkrypcji lub zarządzanego pokoju i emituje końcowe zdarzenia Rozmowy.
    - `talk.mode` ustawia i rozgłasza bieżący stan trybu Rozmowy dla klientów WebChat/Control UI.
    - `talk.client.create` tworzy należącą do klienta sesję dostawcy czasu rzeczywistego przy użyciu `webrtc` lub `provider-websocket`, podczas gdy Gateway jest właścicielem konfiguracji, poświadczeń, instrukcji i zasad narzędzi.
    - `talk.client.toolCall` umożliwia należącym do klienta transportom czasu rzeczywistego przekazywanie wywołań narzędzi dostawcy do zasad Gateway. Pierwszym obsługiwanym narzędziem jest `openclaw_agent_consult`; klienci otrzymują identyfikator uruchomienia i czekają na zwykłe zdarzenia cyklu życia czatu przed przesłaniem wyniku narzędzia właściwego dla dostawcy.
    - `talk.client.steer` wysyła sterowanie głosowe aktywnym uruchomieniem dla należących do klienta transportów czasu rzeczywistego. Gateway ustala aktywne osadzone uruchomienie na podstawie `sessionKey` i zamiast po cichu odrzucać sterowanie, zwraca ustrukturyzowany wynik zaakceptowania lub odrzucenia.
    - `talk.event` jest pojedynczym kanałem zdarzeń Rozmowy dla adapterów czasu rzeczywistego, transkrypcji, STT/TTS, zarządzanych pokojów, telefonii i spotkań.
    - `talk.speak` syntetyzuje mowę za pośrednictwem aktywnego dostawcy mowy Rozmowy.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców rezerwowych oraz stan konfiguracji dostawców.
    - `tts.providers` zwraca widoczny wykaz dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` wykonuje jednorazową konwersję tekstu na mowę.
    - `tts.speak` (`operator.write`) renderuje niepusty `text` za pomocą skonfigurowanego ogólnego łańcucha dostawców TTS i zwraca cały klip bezpośrednio jako `audioBase64`, wraz z `provider` i opcjonalnymi metadanymi `outputFormat`, `mimeType` oraz `fileExtension`. W przeciwieństwie do `tts.convert` nie zwraca ścieżki lokalnej dla Gateway; w przeciwieństwie do `talk.speak` nie wymaga dostawcy Rozmowy. Tekst przekraczający `messages.tts.maxTextLength` zwraca `INVALID_REQUEST`; błędy syntezy zwracają `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne odwołania SecretRef i podmienia stan sekretów środowiska uruchomieniowego wyłącznie po pełnym powodzeniu.
    - `secrets.resolve` rozwiązuje przypisania sekretów docelowych poleceń dla określonego zestawu poleceń i celów.
    - `config.get` zwraca bieżącą migawkę konfiguracji na dysku, surowy `hash` pliku głównego, rozwiązany `configRevisionHash` oraz opcjonalny `appliedConfigHash` dla rozwiązanej rewizji zaakceptowanej przez aktywne środowisko uruchomieniowe Gateway.
    - `config.set` zapisuje zweryfikowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji. Destrukcyjne zastąpienie tablicy wymaga podania odpowiedniej ścieżki w `replacePaths`; zagnieżdżone tablice we wpisach tablic używają ścieżek `[]`, takich jak `agents.list[].skills`.
    - `config.apply` weryfikuje i zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca aktywny ładunek schematu konfiguracji używany przez narzędzia Control UI i CLI: schemat, `uiHints`, wersję, metadane generowania oraz — jeśli można je wczytać — metadane schematu pluginów i kanałów. Obejmuje metadane `title` / `description` pochodzące z tych samych etykiet i tekstów pomocy co w interfejsie użytkownika, w tym gałęzie kompozycji zagnieżdżonych obiektów, symboli wieloznacznych, elementów tablic oraz `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pola.
    - `config.schema.lookup` zwraca ładunek wyszukiwania ograniczonego do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę i `hintPath`, opcjonalny `reloadKind` oraz podsumowania bezpośrednich elementów podrzędnych na potrzeby zagłębiania się w dane w UI/CLI. `reloadKind` ma jedną z wartości `restart`, `hot` lub `none` (`src/config/schema.ts`) i odzwierciedla planistę ponownego ładowania konfiguracji Gateway dla żądanej ścieżki. Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika oraz typowe pola walidacji (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia liczb, ciągów, tablic i obiektów, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania elementów podrzędnych udostępniają `key`, znormalizowany `path`, `type`, `required`, `hasChildren`, opcjonalny `reloadKind` oraz dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia proces aktualizacji Gateway i planuje ponowne uruchomienie tylko wtedy, gdy aktualizacja się powiedzie; wywołujący dysponujący sesją mogą dołączyć `continuationMessage`, aby po uruchomieniu wznowić jedną kolejną turę agenta za pośrednictwem kolejki kontynuacji po ponownym uruchomieniu. Aktualizacje menedżera pakietów i nadzorowane aktualizacje repozytorium git inicjowane z płaszczyzny sterowania korzystają z odłączonego przekazania do usługi zarządzanej zamiast zastępować drzewo pakietów lub modyfikować repozytorium i dane wyjściowe kompilacji wewnątrz aktywnego Gateway. Rozpoczęte przekazanie zwraca `ok: true` wraz z `result.reason: "managed-service-handoff-started"` i `handoff.status: "started"`; niedostępne lub nieudane przekazania zwracają `ok: false` wraz z `managed-service-handoff-unavailable` lub `managed-service-handoff-failed`, a także `handoff.command`, gdy wymagana jest ręczna aktualizacja z poziomu powłoki. Niedostępność oznacza, że OpenClaw nie ma bezpiecznej granicy nadzorcy lub trwałej tożsamości usługi, takiej jak `OPENCLAW_SYSTEMD_UNIT` dla systemd. Podczas rozpoczętego przekazania znacznik ponownego uruchomienia może krótko zgłaszać `stats.reason: "restart-health-pending"`; kontynuacja jest opóźniana, dopóki CLI nie zweryfikuje ponownie uruchomionego Gateway i nie zapisze końcowego znacznika `ok`.
    - `update.status` odświeża i zwraca najnowszy znacznik ponownego uruchomienia po aktualizacji, w tym — jeśli jest dostępna — wersję działającą po ponownym uruchomieniu.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator wdrażania początkowego za pośrednictwem WS RPC.

  </Accordion>

  <Accordion title="Pomocnicze funkcje agentów i obszarów roboczych">
    - `agents.list` zwraca skonfigurowane wpisy agentów, w tym efektywny model i metadane środowiska uruchomieniowego.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów oraz powiązaniami obszarów roboczych.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami inicjalizacyjnymi obszaru roboczego udostępnianymi agentowi.
    - `audit.activity.list` zwraca wersjonowany dziennik aktywności zawierający wyłącznie metadane; `audit.list` pozostaje bezpiecznym pod względem zgodności RPC uruchomień i narzędzi.
    - `agents.workspace.list` i `agents.workspace.get` (`operator.read`) udostępniają klientom w zaufanej domenie operatora opisanej w sekcji [Zakresy operatora](/pl/gateway/operator-scopes) stronicowane przeglądanie katalogu obszaru roboczego agenta tylko do odczytu. Żądania przyjmują wyłącznie ścieżki względne wobec obszaru roboczego; odczyty pozostają ograniczone do rzeczywistej, kanonicznej ścieżki głównej obszaru roboczego (próby wyjścia przez dowiązania symboliczne i twarde są odrzucane), mają limit rozmiaru i obejmują tylko tekst UTF-8 oraz typowe typy obrazów (base64). Odpowiedzi nie ujawniają ścieżki obszaru roboczego na hoście. W tej przestrzeni nazw nie ma operacji zapisu.
    - `tasks.list`, `tasks.get` i `tasks.cancel` udostępniają dziennik zadań Gateway klientom SDK i operatora. Zobacz poniżej [RPC dziennika zadań](#task-ledger-rpcs).
    - `artifacts.list`, `artifacts.get` i `artifacts.download` udostępniają podsumowania artefaktów pochodzących z transkrypcji oraz możliwość ich pobierania dla jawnego zakresu `sessionKey`, `runId` lub `taskId`. Zapytania dotyczące uruchomień i zadań ustalają sesję właściciela po stronie serwera i zwracają tylko multimedia transkrypcji o zgodnym pochodzeniu; niebezpieczne lub lokalne źródła URL powodują zwrócenie informacji o nieobsługiwanym pobieraniu zamiast pobierania po stronie serwera.
    - `environments.list` i `environments.status` zachowują wykrywanie środowiska lokalnego dla Gateway i Node. Skonfigurowane procesy robocze w chmurze oraz trwałe rekordy pozostawione przez wcześniejsze profile dodają metadane `worker` zawierające `providerId`, opcjonalne `leaseId`, `state`, `ageMs`, opcjonalne `idleMs` oraz `attachedSessionIds`. Stany cyklu życia procesu roboczego to `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` i `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) przydziela proces roboczy na podstawie skonfigurowanego profilu dostawcy pluginu; ponowienia z tym samym kluczem używają ponownie trwałej operacji. `environments.destroy` (`{ environmentId }`) żąda idempotentnego usunięcia trwałego środowiska procesu roboczego. Obie operacje wymagają `operator.admin`, są zapisami płaszczyzny sterowania i zwracają podsumowanie środowiska w takim samym formacie jak odpowiedzi dotyczące stanu.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcowy obraz stanu, gdy jest dostępny.

  </Accordion>

  <Accordion title="Sterowanie sesją">
    - `sessions.list` zwraca bieżący indeks sesji, w tym metadane `agentRuntime` dla poszczególnych wierszy, gdy skonfigurowano zaplecze środowiska uruchomieniowego agenta. Gdy włączono rozmieszczanie procesów roboczych w chmurze lub istnieje trwały stan odzyskiwania, wiersze sesji zawierają również zamknięty stan `placement` (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed` lub `failed`) oraz zależne od stanu pola środowiska, epoki właściciela, obszaru roboczego, pakietu, kursora ACK lub odzyskiwania.
    - `sessions.subscribe` i `sessions.unsubscribe` włączają lub wyłączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` włączają lub wyłączają subskrypcje zdarzeń transkrypcji i wiadomości dla jednej sesji. Należy przekazać `includeApprovals: true`, aby otrzymywać również oczyszczone zdarzenia cyklu życia `session.approval` dla zatwierdzeń, których utrwalona grupa odbiorców obejmuje dokładnie tę sesję i których powiązanie recenzenta upoważnia subskrybującego klienta. Odpowiedź na subskrypcję zawiera wtedy ograniczony oczekujący `approvalReplay`; jest on miarodajny, gdy `truncated` ma wartość false. Zgoda dotyczy każdego wywołania subskrypcji osobno i nie jest trwała: ponowna subskrypcja tej samej sesji bez `includeApprovals: true` usuwa istniejącą subskrypcję zatwierdzeń. Oprócz standardowych uprawnień do odczytu sesji ta zgoda wymaga `operator.admin` lub `operator.approvals` na sparowanym urządzeniu.
    - `sessions.preview` zwraca ograniczone podglądy transkrypcji dla określonych kluczy sesji.
    - `sessions.describe` zwraca jeden wiersz sesji Gateway dla dokładnego klucza sesji.
    - `sessions.resolve` rozpoznaje lub kanonizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji. Opcjonalne wartości `model` i `thinkingLevel` atomowo utrwalają początkowe nadpisania modelu i rozumowania. `worktree: true` przydziela zarządzane drzewo robocze; opcjonalne `worktreeBaseRef`/`worktreeName` wybierają referencję bazową i nazwę gałęzi, a `execNode` (`operator.admin`) wiąże wykonywanie poleceń sesji z hostem Node. Utworzone drzewo robocze jest zwracane w wyniku i utrwalane w wierszu sesji (`worktree: { id, branch, repoRoot }`). Gdy wpis zostanie utworzony, ale jego zagnieżdżone początkowe `chat.send` zostanie odrzucone, pomyślny wynik zawiera `runStarted: false` i `runError`; klienci mogą zachować prompt i ponowić próbę z użyciem zwróconego klucza sesji.
    - `sessions.dispatch` (`operator.admin`) przenosi istniejącą lokalną sesję OpenClaw z należącym do sesji zarządzanym drzewem roboczym do skonfigurowanego profilu procesu roboczego w chmurze. Należy przekazać `{ key, profileId, agentId? }`. Metoda jest niedostępna, gdy nie skonfigurowano profilu procesu roboczego, zamyka lokalne przyjmowanie tur przed opróżnieniem aktywnych prac i zwraca wynik dopiero po osiągnięciu przez rozmieszczenie własności procesu roboczego `active`. Przekazanie jest jednokierunkowe; przeniesienie procesu roboczego z powrotem do środowiska lokalnego nie wchodzi w zakres tego RPC.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` i `sessions.groups.delete` zarządzają należącym do Gateway katalogiem niestandardowych grup sesji (nazwy i kolejność wyświetlania). Członkostwo pozostaje w polu `category` każdej sesji; zmiana nazwy i usunięcie aktualizują sesje członkowskie po stronie serwera.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` jest wariantem przerywającym i przekierowującym aktywną sesję.
    - `sessions.abort` przerywa aktywną pracę w sesji. Należy przekazać `key` wraz z opcjonalnym `runId` albo samo `runId` w przypadku aktywnych uruchomień, które Gateway może przypisać do sesji.
    - `sessions.patch` aktualizuje metadane i nadpisania sesji oraz zgłasza rozpoznany model kanoniczny wraz z efektywnym `agentRuntime`.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest normalizowane do wyświetlania klientom interfejsu użytkownika: wbudowane znaczniki dyrektyw są usuwane z widocznego tekstu, tekstowe ładunki XML wywołań narzędzi (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi) i ujawnione tokeny sterujące modelu w formacie ASCII lub pełnej szerokości są usuwane, wiersze asystenta zawierające wyłącznie token ciszy (dokładnie `NO_REPLY` / `no_reply`) są pomijane, a zbyt duże wiersze mogą zostać zastąpione symbolami zastępczymi.
    - `chat.message.get` jest dodatkowym, ograniczonym czytnikiem pełnych wiadomości dla pojedynczego widocznego wpisu transkrypcji. Należy przekazać `sessionKey`, opcjonalne `agentId`, gdy wybór sesji jest ograniczony do agenta, oraz `messageId` transkrypcji udostępnione wcześniej przez `chat.history`; Gateway zwraca tę samą projekcję znormalizowaną do wyświetlania bez lekkiego limitu skracania historii, jeśli zapisany wpis jest nadal dostępny i nie jest zbyt duży.
    - `chat.toolTitles` zwraca krótkie tytuły określające przeznaczenie wywołań narzędzi renderowanych w interfejsie Control UI (wsadowo, maks. 24 elementy z ograniczonymi danymi wejściowymi). Funkcja wymaga jawnego włączenia przez `gateway.controlUi.toolTitles` (domyślnie wyłączona); wyłączone Gateway odpowiadają `{ titles: {}, disabled: true }` bez wywołania modelu, dzięki czemu klienci przestają wysyłać zapytania. Po włączeniu tytuły korzystają ze standardowego routingu modelu pomocniczego: jawnie skonfigurowanego `utilityModel` (decyzja operatora, która — podobnie jak wszystkie zadania pomocnicze — może wysłać ograniczoną treść zadania do wybranego dostawcy), a w przeciwnym razie z zadeklarowanego domyślnego małego modelu dostawcy sesji, dzięki czemu nie pojawia się niejawnie nowe miejsce docelowe ruchu wychodzącego; pusty `utilityModel` całkowicie je wyłącza. Tytuły nigdy nie korzystają awaryjnie z modelu podstawowego. Wyniki są buforowane w bazie danych stanu poszczególnych agentów pod kluczem złożonym z nazwy narzędzia i danych wejściowych, dlatego ponowne wyświetlenia nigdy nie powodują ponownego naliczenia opłat za te same wywołania.
    - `chat.send` przyjmuje jednorazowe `fastMode: "auto"`, aby używać trybu szybkiego dla wywołań modelu rozpoczętych przed automatycznym limitem czasowym, a następnie uruchamiać późniejsze ponowienia, przełączenia awaryjne, wyniki narzędzi lub wywołania kontynuacji bez trybu szybkiego. Limit domyślnie wynosi 60 sekund (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) i można go skonfigurować dla poszczególnych modeli za pomocą `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Wywołujący `chat.send` może przekazać jednorazowe `fastAutoOnSeconds`, aby nadpisać limit dla tego żądania. Należy przekazać `queueMode` (`steer`, `followup`, `collect` lub `interrupt`), aby nadpisać zapisany tryb kolejki wyłącznie dla tego żądania; jawne działania przekierowania w Control UI używają `queueMode: "steer"`.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.setupCode` tworzy kod konfiguracji urządzenia mobilnego oraz domyślnie adres URL danych obrazu QR w formacie PNG. Wymaga `operator.admin` i celowo nie jest uwzględniane w ogłaszanym mechanizmie wykrywania. Wynik zawiera `setupCode`, opcjonalne `qrDataUrl`, `gatewayUrl`, niepoufną etykietę `auth` oraz `urlSource`.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.pair.rename` przypisuje etykietę operatora (`{ deviceId, label }`), która ma pierwszeństwo przed nazwą wyświetlaną zgłaszaną przez klienta i pozostaje zachowana po naprawie urządzenia lub ponownym zatwierdzeniu.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu wywołującego.

    Kod konfiguracji zawiera krótkotrwałe poświadczenie inicjalizacyjne. Klienci nie mogą
    go rejestrować ani utrwalać po zakończeniu procesu parowania.

  </Accordion>

  <Accordion title="Parowanie Node, wywoływanie i oczekujące zadania">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` i `node.pair.remove` obsługują zatwierdzanie możliwości Node. `node.pair.request` i `node.pair.verify` usunięto w wersji 2026.7 wraz z osobnym magazynem parowania Node; oczekujące żądania są tworzone przez Gateway podczas łączenia Node.
    - `node.list` i `node.describe` zwracają stan znanych/połączonych Node.
    - `node.rename` aktualizuje etykietę sparowanego Node.
    - `node.invoke` przekazuje polecenie do połączonego Node.
    - `node.invoke.result` zwraca wynik żądania wywołania.
    - `mcp.tools.call.v1` to bezinterfejsowe polecenie hosta Node służące do wywoływania skonfigurowanego, lokalnego dla Node narzędzia MCP. Jest przekazywane przez `node.invoke`, wymaga zadeklarowania polecenia przez Node i nadal podlega zatwierdzeniu parowania oraz `gateway.nodes.denyCommands`.
    - `node.event` przekazuje zdarzenia pochodzące z Node z powrotem do Gateway.
    - `node.pluginTools.update` to jedyna ścieżka publikacji służąca do zastępowania widocznych dla agenta deskryptorów narzędzi pluginów/MCP połączonego Node; parametry `connect` ich nie przenoszą.
    - `node.pending.pull` i `node.pending.ack` to interfejsy API kolejki połączonego Node.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałymi oczekującymi zadaniami dla Node będących offline lub rozłączonych.

  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `approval.get` i `approval.resolve` to niezależne od rodzaju metody trwałego zatwierdzania (zakres `operator.approvals`). `approval.get` zwraca oczyszczoną projekcję oczekującą lub zachowaną projekcję stanu końcowego ze stabilnym `urlPath`; `approval.resolve` przyjmuje kanoniczny identyfikator zatwierdzenia, jawny `kind` i decyzję, stosuje zasadę rozstrzygania przez pierwszą odpowiedź i zawsze zwraca zarejestrowany wynik kanoniczny.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obsługują jednorazowe żądania zatwierdzenia wykonania oraz wyszukiwanie i ponowne odtwarzanie oczekujących zatwierdzeń. Są adapterami granicy protokołu korzystającymi z tego samego trwałego rejestru zatwierdzeń.
    - `exec.approval.waitDecision` oczekuje na jedno oczekujące zatwierdzenie wykonania i zwraca ostateczną decyzję (lub `null` po przekroczeniu limitu czasu).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają migawkami zasad zatwierdzania wykonania przez Gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalnymi dla Node zasadami zatwierdzania wykonania za pośrednictwem poleceń przekazywanych przez Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obsługują przepływy zatwierdzania definiowane przez pluginy.

  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe lub wykonywane przy następnym Heartbeat wstrzyknięcie tekstu wybudzającego; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowanymi zadaniami.
    - `cron.run` pozostaje RPC w stylu dodawania do kolejki na potrzeby ręcznych uruchomień. Klienci wymagający semantyki ukończenia powinni odczytać zwrócony `runId` i odpytywać `cron.runs`.
    - `cron.runs` przyjmuje opcjonalny, niepusty filtr `runId`, aby klienci mogli śledzić jedno ręczne uruchomienie umieszczone w kolejce bez rywalizacji z innymi wpisami historii tego samego zadania.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Zobacz [Metody pomocnicze operatora](#operator-helper-methods) poniżej.

  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu interfejsu użytkownika, takie jak `chat.inject`, oraz inne zdarzenia czatu
  występujące wyłącznie w transkrypcji. W protokole v4 ładunki różnicowe przenoszą `deltaText`; `message` pozostaje
  skumulowaną migawką asystenta. Zastąpienia niebędące prefiksem ustawiają
  `replace=true` i używają `deltaText` jako tekstu zastępczego.
- `session.message`, `session.operation`, `session.tool`: aktualizacje transkrypcji, trwającej
  operacji sesji i strumienia zdarzeń dla subskrybowanej sesji.
- `session.approval`: oczyszczone, wiarygodne dane o oczekujących i końcowych zatwierdzeniach dla
  subskrybenta, który jawnie wyraził zgodę na dokładnie wskazaną sesję. Zatwierdzenia podrzędne korzystają z
  utrwalonej grupy odbiorców przodka; zdarzenia nigdy nie modyfikują transkrypcji ani nie wybudzają agentów.
- `sessions.changed`: zmienił się indeks lub metadane sesji.
- `presence`: aktualizacje migawki obecności systemu.
- `tick`: okresowe zdarzenie podtrzymania połączenia/sprawdzania aktywności.
- `health`: aktualizacja migawki kondycji Gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania Cron.
- `shutdown`: powiadomienie o wyłączeniu Gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania Node.
- `node.invoke.request`: rozgłaszanie żądania wywołania Node.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniono konfigurację wyzwalacza słowa wybudzającego.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia
  zatwierdzenia wykonania.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia
  zatwierdzenia pluginu.

### Metody pomocnicze Node

Node mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych Skills
na potrzeby kontroli automatycznego zezwalania.

## RPC rejestru audytowego

`audit.activity.list` zapewnia klientom operatora stabilny, uporządkowany od najnowszych widok metadanych cyklu życia
uruchomień agentów, działań narzędzi i wiadomości objętych jawną zgodą. Wymaga
`operator.read`. Zapytania wykluczają rekordy starsze niż 30 dni, a współdzielony
rejestr SQLite jest ograniczony do 100,000 rekordów. Wygasłe wiersze są usuwane podczas
uruchamiania Gateway, cogodzinnej konserwacji i kolejnych zapisów. Model danych i semantykę prywatności opisano w
[Historii audytu](/gateway/audit).

- Parametry: opcjonalny dokładny `agentId`, `sessionKey` lub `runId`; opcjonalny `kind`
  (`"agent_run"`, `"tool_action"` lub `"message"`); opcjonalny `status`
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` lub `"unknown"`); opcjonalny `direction` wiadomości (`"inbound"` lub
  `"outbound"`) i dokładny `channel`; opcjonalne inkluzywne granice `after` / `before`
  w milisekundach czasu uniksowego; opcjonalny `limit` od `1` do `500`; oraz opcjonalny
  ciąg `cursor` z poprzedniej strony.
- Wynik: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

Nazwana unia wyników V1 zawiera osobne schematy uruchomienia agenta, działania narzędzia, wiadomości przychodzącej
i wiadomości wychodzącej. Dyskryminator `eventType` ma odpowiednio wartość
`agent_run`, `tool_action`, `inbound_message` lub `outbound_message`; `kind` i
`direction` wiadomości pozostają dostępne do filtrowania i wyświetlania. Każde zdarzenie ma
całkowitoliczbowy `schemaVersion: 1`. Odwołania do tożsamości wiadomości używają dokładnego
formatu `hmac-sha256:v1:<32 hex key id>:<64 hex digest>`; identyfikator aktora będącego nadawcą w kanale
używa tego samego formatu.

Wszystkie warianty wymagają `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` i
`redaction`. Pola wariantów:

| `eventType`        | Pola wymagane                                                   | Pola opcjonalne                                                                                                                 |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, odwołania do tożsamości, `reasonCode`, `errorCode`                                 |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, odwołania do tożsamości, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Zamknięte wyliczenia wiadomości:

- `conversationKind`: `direct`, `group`, `channel` lub `unknown`.
- Przychodzący `outcome`: `completed`, `skipped` lub `failed`; opcjonalny
  `reasonCode`: `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty` lub `acp_dispatch_aborted`.
- Wychodzący `outcome`: `sent`, `suppressed`, `failed` lub `unknown`; opcjonalny
  `reasonCode`: `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`
  lub `no_visible_payload`. Adapter, który nie zwraca tożsamości platformy, ma wartość
  `unknown`, ponieważ nie można wykluczyć wystąpienia zewnętrznego skutku ubocznego.
- `deliveryKind`: `text`, `media` lub `other`; `failureStage`:
  `platform_send`, `queue` lub `unknown`.

Pola końcowe są skorelowane, a nie niezależnie opcjonalne:

| Wariant          | Mapowanie stanu końcowego                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Uruchomienie agenta        | `started` nie ma `errorCode`; każdy zakończony stan inny niż powodzenie wymaga odpowiadającego mu kodu `run_*`.                                                                 |
| Działanie narzędzia      | `started` i powodzenie nie mają `errorCode`; każdy inny zakończony stan wymaga odpowiadającego mu kodu `tool_*`.                                                       |
| Wiadomość przychodząca  | powodzenie = `completed`; zablokowanie = `skipped`; niepowodzenie = `failed` oraz `message_processing_failed`. Jeśli `reasonCode` występuje, musi należeć do tej rodziny stanów końcowych. |
| Wiadomość wychodząca | powodzenie = `sent`; zablokowanie = `suppressed` oraz `reasonCode`; niepowodzenie = `failed` oraz `errorCode` i `failureStage`; stan nieznany = `unknown` oraz `failureStage`.      |

Każde zdarzenie aktywności zawiera stabilny identyfikator zdarzenia, monotoniczny numer sekwencyjny rejestru,
numer sekwencyjny zdarzenia źródłowego, znacznik czasu, aktora, działanie, stan, całkowitą wartość
`schemaVersion: 1` oraz `redaction: "metadata_only"`. Rekordy uruchomień i narzędzi
wymagają informacji o pochodzeniu agenta i uruchomienia oraz mogą zawierać informacje o pochodzeniu sesji. Rekordy
wiadomości mogą zawierać identyfikatory agenta i uruchomienia, ale celowo nigdy nie zawierają
`sessionKey` ani `sessionId`; dlatego filtr zapytania `sessionKey` dotyczy
wyłącznie wierszy uruchomień i narzędzi. Zdarzenia narzędzi mogą zawierać identyfikator wywołania i nazwę narzędzia.

Rekordy wiadomości używają `message.inbound.processed` lub
`message.outbound.finished` i dodają kierunek, kanał, rodzaj konwersacji,
znormalizowany wynik oraz opcjonalnie rodzaj dostarczenia, etap niepowodzenia, czas trwania,
liczbę wyników, kod przyczyny i lokalne dla instalacji pseudonimy
konta/konwersacji/wiadomości/celu oparte na kluczu. Te pseudonimy ułatwiają
korelację, ale nie zapewniają anonimizacji: baza danych stanu zawiera ich klucz,
natomiast eksporty RPC i CLI go nie zawierają. Rejestr nie przechowuje promptów, treści
wiadomości, argumentów narzędzi, wyników narzędzi, danych wyjściowych poleceń ani nieprzetworzonego tekstu błędów.
Wartości `sessionKey` uruchomień/narzędzi pozostają nieprzetworzonymi metadanymi korelacyjnymi i mogą zawierać
identyfikatory kont platformy lub rozmówców; rekordy wiadomości pomijają klucze sesji.

W przypadku wierszy przychodzących `durationMs` mierzy główne przekazywanie do jego stanu końcowego, a
`resultCount` zlicza sfinalizowane, zakolejkowane ładunki narzędzi, bloków i odpowiedzi. W przypadku
wierszy wychodzących `durationMs` obejmuje okres odpowiedzialności za dostarczenie do potwierdzenia,
przeniesienia do kolejki niedostarczonych wiadomości lub uzgodnienia (w tym czas oczekiwania w kolejce), a `resultCount`
zlicza zidentyfikowane fizyczne wysłania na platformie. `deliveryKind`, jeśli występuje,
opisuje efektywny ładunek po zastosowaniu hooków i renderowaniu; wiersze wyciszone lub
niejednoznaczne z powodu awarii go pomijają.

Obecny zakres wiadomości obejmuje zaakceptowane wiadomości przychodzące, które docierają do głównego
przekazywania, w tym główne wyniki duplikacji/końcowe. Dla wiadomości wychodzących zapisywany jest
jeden wiersz końcowy na każdy pierwotny logiczny ładunek odpowiedzi, który dociera do wspólnej trwałej
warstwy dostarczania; dzielenie na fragmenty i rozsyłanie przez adaptery są agregowane w `resultCount`. Zakolejkowane
wysłania możliwe do ponowienia lub niejednoznaczne są rejestrowane dopiero po potwierdzeniu, przeniesieniu do kolejki
niedostarczonych wiadomości lub uzgodnieniu. Ścieżki lokalne dla Pluginu i ścieżki bezpośredniego wysyłania, które omijają te
wspólne granice, nie są jeszcze objęte. Ograniczona kolejka robocza działa w trybie best-effort
i może odrzucać rekordy w przypadku awarii lub przeciążenia, dlatego ta powierzchnia nie jest
bezstratnym archiwum zgodności.

Rejestrowanie jest domyślnie włączone i kontrolowane przez
[`audit.enabled`](/pl/gateway/configuration-reference#audit). Rejestrowanie wiadomości jest
kontrolowane oddzielnie przez `audit.messages` i domyślnie ma wartość `"off"`. Gdy
rejestrowanie jest wyłączone, `audit.activity.list` nadal udostępnia wcześniej zapisane rekordy,
dopóki nie wygasną.

Dostarczone schematy żądania, wyniku i `AuditEvent` dla `audit.list` pozostają
niezmienione i zwracają wyłącznie rekordy uruchomień agentów oraz działań narzędzi. Nowe klienty
operatorskie powinny wywoływać `audit.activity.list`, gdy Gateway je udostępnia. Starsze
wersje Gateway mogą zgłaszać `unknown method: audit.activity.list` albo — ponieważ
autoryzacja w dostarczonych wersjach poprzedzała wyszukiwanie metody — `missing scope:
operator.admin` dla żądania z zakresem odczytu. Ten drugi przypadek należy traktować jako brak metody
tylko wtedy, gdy metoda nie była udostępniana. Klient może następnie ponowić próbę z użyciem `audit.list`
wyłącznie wtedy, gdy jego filtry nie wymagają obsługi rodzaju wiadomości, kierunku ani kanału.

Do zapytań tekstowych i ograniczonych eksportów JSON należy używać [`openclaw audit`](/pl/cli/audit).

## Wywołania RPC rejestru zadań

Klienty operatorskie sprawdzają i anulują rekordy zadań Gateway działających w tle za pośrednictwem
wywołań RPC rejestru zadań (`packages/gateway-protocol/src/schema/tasks.ts`). Zwracają one
oczyszczone podsumowania zadań, a nie nieprzetworzony stan środowiska wykonawczego.

- `tasks.list` wymaga `operator.read`.
  - Parametry: opcjonalny `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` lub `"timed_out"`) albo tablica tych stanów,
    opcjonalny `agentId`, opcjonalny `sessionKey`, opcjonalny `limit` od `1` do
    `500` oraz opcjonalny ciąg `cursor`.
  - Wynik: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` wymaga `operator.read`.
  - Parametry: `{ "taskId": string }`.
  - Wynik: `{ "task": TaskSummary }`.
  - Brakujące identyfikatory zadań zwracają format błędu nieznalezienia Gateway.
- `tasks.cancel` wymaga `operator.write`.
  - Parametry: `{ "taskId": string, "reason"?: string }`.
  - Wynik: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` wskazuje, czy rejestr zawierał pasujące zadanie. `cancelled`
    wskazuje, czy środowisko wykonawcze zaakceptowało lub zarejestrowało anulowanie.

`TaskSummary` zawiera `id`, `status` oraz opcjonalne metadane: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, znaczniki czasu, postęp,
podsumowanie końcowe i oczyszczony tekst błędu. `agentId` identyfikuje agenta
wykonującego zadanie; `sessionKey` i `ownerKey` zachowują kontekst żądającego i sterowania.

## Metody pomocnicze operatora

- `commands.list` (`operator.read`) pobiera spis poleceń środowiska wykonawczego dla
  agenta.
  - `agentId` jest opcjonalny; należy go pominąć, aby odczytać domyślny obszar roboczy agenta.
  - `scope` określa powierzchnię, do której odnosi się główny `name`: `text` zwraca
    główny tekstowy token polecenia bez początkowego `/`; `native` i
    domyślna ścieżka `both` zwracają natywne nazwy uwzględniające dostawcę, jeśli są dostępne.
  - `textAliases` zawiera dokładne aliasy z ukośnikiem, takie jak `/model` i `/m`.
  - `nativeName` zawiera natywną nazwę polecenia uwzględniającą dostawcę, jeśli taka
    istnieje.
  - `provider` jest opcjonalny i wpływa wyłącznie na nazewnictwo natywne oraz dostępność natywnych poleceń
    Pluginu.
  - `includeArgs=false` pomija serializowane metadane argumentów w odpowiedzi.
- `tools.catalog` (`operator.read`) pobiera katalog narzędzi środowiska wykonawczego dla
  agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel Pluginu, gdy `source="plugin"`
  - `optional`: czy narzędzie Pluginu jest opcjonalne
- `tools.effective` (`operator.read`) pobiera efektywny w środowisku wykonawczym
  spis narzędzi dla sesji.
  - `sessionKey` jest wymagany.
  - Gateway wyprowadza zaufany kontekst środowiska wykonawczego z sesji po stronie serwera,
    zamiast akceptować kontekst uwierzytelniania lub dostarczania podany przez wywołującego.
  - Odpowiedź jest zakreśloną do sesji, wyprowadzoną przez serwer projekcją aktywnego
    spisu, obejmującą narzędzia podstawowe, Pluginu, kanału i już wykrytych serwerów MCP.
  - `tools.effective` działa tylko do odczytu w przypadku MCP: może rzutować katalog MCP
    aktywnej sesji przez końcową politykę narzędzi, ale nie tworzy środowisk wykonawczych MCP,
    nie łączy transportów ani nie wydaje `tools/list`. Jeśli nie istnieje pasujący aktywny katalog,
    odpowiedź może zawierać komunikat, taki jak `mcp-not-yet-connected`,
    `mcp-not-yet-listed` lub `mcp-stale-catalog`.
  - Efektywne wpisy narzędzi używają `source="core"`, `source="plugin"`,
    `source="channel"` lub `source="mcp"`.
- `tools.invoke` (`operator.write`) wywołuje jedno dostępne narzędzie za pośrednictwem
  tej samej ścieżki polityki Gateway co `/tools/invoke`.
  - `name` jest wymagany. `args`, `sessionKey`, `agentId`, `confirm` i
    `idempotencyKey` są opcjonalne.
  - Jeśli występują zarówno `sessionKey`, jak i `agentId`, agent rozwiązanej sesji
    musi być zgodny z `agentId`.
  - Dostępne wyłącznie właścicielowi opakowania podstawowe, takie jak `cron`, `gateway` i `nodes`, wymagają
    tożsamości właściciela/administratora (`operator.admin`), mimo że sam `tools.invoke`
    ma wartość `operator.write`.
  - Odpowiedź jest kopertą przeznaczoną dla SDK z polami `ok`, `toolName`, opcjonalnym
    `output` oraz typowanymi polami `error`. Odmowy zatwierdzenia lub wynikające z polityki zwracają
    `ok:false` w ładunku, zamiast omijać potok polityki narzędzi Gateway.
- `skills.status` (`operator.read`) pobiera widoczny spis Skills dla
  agenta.
  - `agentId` jest opcjonalny; należy go pominąć, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź zawiera informacje o kwalifikowalności, brakujących wymaganiach, kontrolach konfiguracji
    i oczyszczonych opcjach instalacji bez ujawniania nieprzetworzonych wartości sekretów.
- `skills.search` i `skills.detail` (`operator.read`) zwracają metadane
  wykrywania ClawHub.
- `skills.upload.begin`, `skills.upload.chunk` i `skills.upload.commit`
  (`operator.admin`) przygotowują prywatne archiwum Skills przed jego instalacją. Jest to
  oddzielna administracyjna ścieżka przesyłania dla zaufanych klientów, a nie zwykły przepływ instalacji
  Skills z ClawHub, i jest domyślnie wyłączona, chyba że
  włączono `skills.install.allowUploadedArchives`.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    tworzy przesyłanie powiązane z tym slugiem i wartością wymuszenia.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` dołącza bajty od
    dokładnego zdekodowanego przesunięcia.
  - `skills.upload.commit({ uploadId, sha256? })` weryfikuje końcowy rozmiar i
    SHA-256. Zatwierdzenie tylko finalizuje przesyłanie; nie instaluje Skills.
  - Przesłane archiwa Skills są archiwami zip zawierającymi katalog główny `SKILL.md`. Wewnętrzna
    nazwa katalogu archiwum nigdy nie wybiera celu instalacji.
- `skills.install` (`operator.admin`) ma trzy tryby:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje
    folder Skills w katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb przesyłania: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instaluje zatwierdzone przesyłanie w katalogu `skills/<slug>`
    domyślnego obszaru roboczego agenta. Slug i wartość wymuszenia muszą odpowiadać
    pierwotnemu żądaniu `skills.upload.begin`. Żądanie jest odrzucane, chyba że
    włączono `skills.install.allowUploadedArchives`; to ustawienie nie
    wpływa na instalacje z ClawHub.
  - Tryb instalatora Gateway: `{ name, installId, timeoutMs? }` uruchamia zadeklarowane
    działanie `metadata.openclaw.install` na hoście Gateway. Starsze klienty mogą
    nadal wysyłać `dangerouslyForceUnsafeInstall`; to pole jest przestarzałe,
    akceptowane wyłącznie w celu zgodności protokołu i ignorowane. Do decyzji instalacyjnych
    należących do operatora należy używać `security.installPolicy`.
- `skills.update` (`operator.admin`) ma dwa tryby:
  - Tryb ClawHub aktualizuje jeden śledzony slug albo wszystkie śledzone instalacje ClawHub w
    domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji aktualizuje wartości `skills.entries.<skillKey>`, takie jak `enabled`,
    `apiKey` i `env`.

### Widoki `models.list`

`models.list` przyjmuje opcjonalny parametr `view`
(`src/agents/model-catalog-visibility.ts`):

- Pominięte lub `"default"`: jeśli skonfigurowano `agents.defaults.models`,
  odpowiedzią jest dozwolony katalog, obejmujący dynamicznie wykryte modele
  dla wpisów `provider/*`. W przeciwnym razie odpowiedzią jest pełny katalog
  Gateway.
- `"configured"`: zachowanie dostosowane do selektora. Jeśli skonfigurowano
  `agents.defaults.models`, nadal ma ono pierwszeństwo, w tym wykrywanie w zakresie dostawcy
  dla wpisów `provider/*`. Bez listy dozwolonych odpowiedź wykorzystuje jawne
  wpisy `models.providers.<provider>.models`, a pełny katalog stosuje jako rozwiązanie rezerwowe
  tylko wtedy, gdy nie istnieją żadne skonfigurowane wiersze modeli.
- `"provider-config"`: utworzony w źródle spis `models.providers.*.models`,
  niezależny od list dozwolonych selektora. Wiersze zawierają publiczne możliwości modeli
  oraz dostępność uwzględniającą trasę, ale pomijają punkty końcowe dostawców, dane
  uwierzytelniające i konfigurację żądań środowiska wykonawczego.
- `"all"`: pełny katalog Gateway, z pominięciem `agents.defaults.models`. Służy do
  interfejsów diagnostycznych/wykrywania, a nie zwykłych selektorów modeli.

## Zatwierdzanie wykonywania

- Gdy żądanie wykonania wymaga zatwierdzenia, Gateway rozgłasza
  `exec.approval.requested`.
- Klienci operatora rozstrzygają je, wywołując `exec.approval.resolve` (wymaga
  `operator.approvals`).
- Dla `host=node` element `exec.approval.request` musi zawierać `systemRunPlan`
  (kanoniczne metadane `argv`/`cwd`/`rawCommand`/sesji). Żądania bez
  `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazywane wywołania `node.invoke system.run` ponownie wykorzystują ten
  kanoniczny `systemRunPlan` jako wiążący kontekst polecenia/katalogu roboczego/sesji.
- Jeśli wywołujący zmodyfikuje `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` między przygotowaniem a ostatecznym przekazaniem zatwierdzonego `system.run`,
  Gateway odrzuci uruchomienie zamiast zaufać zmodyfikowanemu ładunkowi.

## Rezerwowy sposób dostarczania przez agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczenia wychodzącego.
- `bestEffortDeliver=false` (wartość domyślna) zachowuje ścisłe działanie: nierozpoznane lub
  wyłącznie wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` zezwala na użycie jako rozwiązania rezerwowego wykonania wyłącznie w sesji, gdy nie można
  rozpoznać żadnej zewnętrznej trasy dostarczania (na przykład w przypadku sesji
  wewnętrznych/czatu internetowego albo niejednoznacznych konfiguracji wielokanałowych).
- Końcowe wyniki `agent` mogą zawierać `result.deliveryStatus`, gdy zażądano
  dostarczenia, z użyciem tych samych statusów `sent`, `suppressed`, `partial_failed` i
  `failed`, które udokumentowano w sekcji
  [`openclaw agent --json --deliver`](/pl/cli/agent#json-delivery-status).

## Wersjonowanie

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` i `MIN_PROBE_PROTOCOL_VERSION` znajdują się w
  `packages/gateway-protocol/src/version.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`. Klienci operatora i interfejsu użytkownika muszą
  uwzględniać bieżący protokół w tym zakresie; obecne klienty i serwery używają
  protokołu v4.
- Uwierzytelnieni klienci mający zarówno `role: "node"`, jak i `client.mode: "node"`
  mogą używać protokołu Node w wersji N-1 (obecnie v3). Lekkie sondy ponownego uruchomienia używają
  tego samego przedziału N-1. Ten przedział zgodności nie zmienia uwierzytelniania urządzeń,
  parowania, zakresów, zasad poleceń ani zatwierdzania wykonywania. Możliwości i polecenia
  Node należące do Pluginów są wstrzymywane do czasu uaktualnienia Node do bieżącego
  protokołu, ponieważ udostępniane przez nie powierzchnie nie należą do kontraktu N-1.
- Schematy i modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Referencyjna implementacja klienta znajduje się w `packages/gateway-client/src/`
(OpenClaw opakowuje ją za pomocą cienkiej fasady `src/gateway/client.ts`). Te
wartości domyślne są stabilne w całym protokole v4 i stanowią oczekiwaną wartość bazową dla
klientów zewnętrznych.

| Stała                                     | Wartość domyślna                                      | Źródło                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Limit czasu żądania (na RPC)              | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Limit czasu wstępnego uwierzytelniania / wyzwania połączenia | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (zmienna środowiskowa `OPENCLAW_HANDSHAKE_TIMEOUT_MS` może zwiększyć wspólny budżet serwera/klienta) |
| Początkowe opóźnienie ponownego łączenia  | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Maksymalne opóźnienie ponownego łączenia  | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Ograniczenie szybkiej ponownej próby po zamknięciu z powodu tokenu urządzenia | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Okres karencji wymuszonego zatrzymania przed `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Domyślny limit czasu `stopAndWait()`   | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Domyślny interwał taktu (przed `hello-ok`) | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Zamknięcie po przekroczeniu limitu czasu taktu | kod `4000`, gdy cisza przekroczy `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

Serwer ogłasza efektywne wartości `policy.tickIntervalMs`,
`policy.maxPayload` i `policy.maxBufferedBytes` w `hello-ok`; klienci
powinni przestrzegać tych wartości zamiast wartości domyślnych sprzed uzgadniania połączenia.

Klient referencyjny pozwala, aby żądania o skończonym czasie trwania używały skonfigurowanego terminu,
gdy każde oczekujące żądanie ma taki termin. Żądanie `expectFinal` bez skończonej wartości
`timeoutMs`, dowolne żądanie z `timeoutMs: null` albo połączenie żądań ograniczonych czasowo
i nieograniczonych utrzymuje aktywny mechanizm nadzorujący takt. Jeśli zdarzenia przychodzące i
odpowiedzi pozostają nieaktywne dłużej niż próg limitu czasu taktu, klient zamyka
gniazdo z kodem `4000`, odrzuca każde oczekujące żądanie i ponownie nawiązuje połączenie. Nie
odtwarza odrzuconych żądań po ponownym połączeniu.

## Uwierzytelnianie

- Uwierzytelnianie Gateway przy użyciu sekretu współdzielonego korzysta z `connect.params.auth.token` lub
  `connect.params.auth.password`, zależnie od skonfigurowanego
  `gateway.auth.mode` (`"none" | "token" | "password" | "trusted-proxy"`).
- Tryby przenoszące tożsamość, takie jak Tailscale Serve (`gateway.auth.allowTailscale: true`)
  lub `gateway.auth.mode: "trusted-proxy"` poza interfejsem loopback, spełniają kontrolę uwierzytelniania
  połączenia na podstawie nagłówków żądania zamiast `connect.params.auth.*`.
- Tryb `gateway.auth.mode: "none"` z prywatnym ruchem przychodzącym całkowicie pomija
  uwierzytelnianie połączenia przy użyciu sekretu współdzielonego; nie należy udostępniać tego trybu przez publiczny/niezaufany ruch przychodzący.
- Po sparowaniu Gateway wystawia token urządzenia ograniczony do roli
  połączenia i zakresów, zwracany w `hello-ok.auth.deviceToken`. Klienci powinni
  utrwalać go po każdym pomyślnym połączeniu.
- Ponowne połączenie przy użyciu zapisanego tokenu urządzenia powinno również
  ponownie wykorzystywać zapisany, zatwierdzony zestaw zakresów tego tokenu. Pozwala to zachować
  przyznany już dostęp do odczytu/sondowania/statusu i zapobiega cichemu ograniczeniu
  ponownych połączeń do węższego, niejawnego zakresu tylko dla administratora.
- Składanie uwierzytelniania połączenia po stronie klienta (`selectConnectAuth` w
  `packages/gateway-client/src/client.ts`):
  - `auth.password` jest niezależne i po ustawieniu zawsze przekazywane dalej.
  - `auth.token` jest wypełniane według kolejności priorytetów: najpierw jawny token współdzielony,
    następnie jawne `deviceToken`, a potem zapisany token poszczególnego urządzenia (indeksowany według
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłane tylko wtedy, gdy żadne z powyższych nie wyznaczyło
    `auth.token`. Token współdzielony lub dowolny wyznaczony token urządzenia powoduje jego pominięcie.
  - Automatyczne użycie zapisanego tokenu urządzenia podczas jednorazowej
    ponownej próby `AUTH_TOKEN_MISMATCH` jest dozwolone tylko dla zaufanych punktów końcowych: interfejsu loopback
    lub `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://` bez przypięcia
    nie spełnia tego warunku.
- Wbudowany bootstrap z kodem konfiguracji zwraca `hello-ok.auth.deviceToken`
  głównego Node oraz ograniczony token operatora w
  `hello-ok.auth.deviceTokens` na potrzeby zaufanego przekazania do urządzenia mobilnego. Token operatora
  obejmuje `operator.talk.secrets` do natywnego odczytu konfiguracji Talk, ale
  wyklucza zakresy modyfikacji parowania oraz `operator.admin`.
- Gdy bootstrap z kodem konfiguracji innym niż bazowy oczekuje na zatwierdzenie,
  szczegóły `PAIRING_REQUIRED` obejmują `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` i `pauseReconnect: false`. Należy ponawiać połączenie przy użyciu
  tego samego tokenu bootstrapu, aż żądanie zostanie zatwierdzone lub token
  utraci ważność.
- Należy utrwalać `hello-ok.auth.deviceTokens` tylko wtedy, gdy połączenie korzystało z uwierzytelniania
  bootstrapu przez zaufany transport, taki jak `wss://`, albo parowanie przez interfejs loopback/lokalne.
- Jeśli klient podaje jawne `deviceToken` lub jawne `scopes`, ten
  zestaw zakresów żądany przez wywołującego pozostaje nadrzędny; zakresy z pamięci podręcznej są
  ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokenu poszczególnego urządzenia.
- Tokeny urządzeń można rotować/unieważniać za pomocą `device.token.rotate` i
  `device.token.revoke` (wymaga `operator.pairing`). Rotowanie lub unieważnianie
  tokenu Node albo innej roli niebędącej operatorem wymaga również `operator.admin`.
- `device.token.rotate` zwraca metadane rotacji. Zwraca zastępczy
  token okaziciela tylko w przypadku wywołań z tego samego urządzenia, już uwierzytelnionych tym
  tokenem urządzenia, aby klienci korzystający wyłącznie z tokenu mogli utrwalić jego zamiennik przed
  ponownym połączeniem. Rotacje wykonywane przy użyciu tokenu współdzielonego/administratora nie zwracają tokenu okaziciela.
- Wystawianie, rotowanie i unieważnianie tokenów pozostaje ograniczone do zatwierdzonego zestawu ról
  zapisanego we wpisie parowania danego urządzenia; modyfikacja tokenu nie może rozszerzyć uprawnień ani
  wskazać roli urządzenia, której nigdy nie przyznano podczas zatwierdzania parowania.
- W sesjach tokenów sparowanych urządzeń zarządzanie urządzeniem jest ograniczone do własnego urządzenia, chyba że
  wywołujący ma również `operator.admin`: wywołujący bez uprawnień administratora mogą zarządzać tylko
  tokenem operatora własnego wpisu urządzenia. Zarządzanie tokenami Node i innych ról niebędących operatorem
  jest dostępne wyłącznie dla administratora, nawet w przypadku własnego urządzenia wywołującego.
- `device.token.rotate` i `device.token.revoke` sprawdzają również zestaw zakresów docelowego
  tokenu operatora względem zakresów bieżącej sesji wywołującego.
  Wywołujący bez uprawnień administratora nie mogą rotować ani unieważniać tokenu operatora o szerszym zakresie niż ten,
  który już mają.
- Błędy uwierzytelniania obejmują `error.details.code` oraz wskazówki dotyczące odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (wartość logiczna)
  - `error.details.recommendedNextStep`: jedna z wartości `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufane klienty mogą podjąć jedną ograniczoną ponowną próbę przy użyciu tokenu poszczególnego urządzenia
    z pamięci podręcznej.
  - Jeśli ta ponowna próba się nie powiedzie, należy zatrzymać automatyczne pętle ponownego łączenia i wyświetlić
    wskazówki dotyczące działań operatora.
- `AUTH_SCOPE_MISMATCH` oznacza, że token urządzenia został rozpoznany, ale nie
  obejmuje żądanej roli/zakresów. Nie należy przedstawiać tego jako nieprawidłowego tokenu; należy poprosić
  operatora o ponowne sparowanie lub zatwierdzenie węższego/szerszego kontraktu zakresów.

## Tożsamość urządzenia i parowanie

- Node powinny zawierać stabilną tożsamość urządzenia (`device.id`) utworzoną na podstawie
  odcisku palca pary kluczy.
- Gateway wystawia tokeny dla poszczególnych urządzeń i ról.
- Zatwierdzenie parowania jest wymagane dla nowych identyfikatorów urządzeń, chyba że włączono lokalne
  automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania koncentruje się na bezpośrednich lokalnych połączeniach przez interfejs loopback.
- OpenClaw ma również wąską ścieżkę samodzielnego połączenia lokalnego dla backendu/kontenera przeznaczoną dla
  zaufanych przepływów pomocniczych korzystających z sekretu współdzielonego.
- Połączenia z tej samej maszyny przez tailnet lub LAN są nadal traktowane jako zdalne na potrzeby parowania
  i wymagają zatwierdzenia.
- Klienty WS zwykle dołączają tożsamość `device` podczas `connect` (operator +
  Node). Jedynymi wyjątkami dla operatora bez urządzenia są jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` na potrzeby zgodności z niezabezpieczonym
    HTTP wyłącznie na localhost.
  - pomyślne uwierzytelnianie `gateway.auth.mode: "trusted-proxy"` operatora w interfejsie Control UI.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tryb awaryjny, poważne
    obniżenie poziomu bezpieczeństwa).
  - wywołania RPC backendu `gateway-client` przez bezpośredni interfejs loopback na zastrzeżonej wewnętrznej
    ścieżce pomocniczej.
- Pominięcie tożsamości urządzenia ma konsekwencje dla zakresów. Gdy połączenie
  operatora bez urządzenia jest dozwolone przez jawną ścieżkę zaufania, OpenClaw
  nadal usuwa samodzielnie zadeklarowane zakresy, ustawiając pusty zestaw, chyba że dana ścieżka ma
  nazwany wyjątek zachowujący zakresy. Metody chronione zakresem kończą się wtedy błędem
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` to awaryjna ścieżka zachowywania zakresów
  interfejsu Control UI. Nie przyznaje zakresów dowolnym niestandardowym klientom WebSocket
  backendu ani klientom przypominającym CLI.
- Zastrzeżona ścieżka pomocnicza backendu `gateway-client` przez bezpośredni interfejs loopback zachowuje
  zakresy tylko dla wewnętrznych lokalnych wywołań RPC płaszczyzny sterowania; niestandardowe identyfikatory backendu
  nie otrzymują tego wyjątku.
- Wszystkie połączenia muszą podpisywać dostarczony przez serwer nonce `connect.challenge`.

### Diagnostyka migracji uwierzytelniania urządzeń

W przypadku starszych klientów, które nadal korzystają z zachowania podpisywania sprzed mechanizmu challenge, `connect`
zwraca kody szczegółów `DEVICE_AUTH_*` w `error.details.code` ze stabilnym
`error.details.reason`.

Typowe błędy migracji:

| Komunikat                     | details.code                     | details.reason           | Znaczenie                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (lub wysłał pustą wartość).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał przy użyciu nieaktualnego/nieprawidłowego nonce.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie odpowiada ładunkowi v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Podpisany znacznik czasu wykracza poza dozwoloną różnicę.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie odpowiada odciskowi palca klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonizacja klucza publicznego nie powiodły się.         |

Cel migracji:

- Należy zawsze czekać na `connect.challenge`.
- Należy podpisać ładunek v2 zawierający nonce serwera.
- Należy wysłać ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`
  (`buildDeviceAuthPayloadV3` w `packages/gateway-client/src/device-auth.ts`),
  który oprócz pól urządzenia/klienta/roli/zakresów/tokenu/nonce wiąże również
  `platform` i `deviceFamily`.
- Starsze podpisy `v2` są nadal akceptowane ze względu na zgodność, ale przypięcie
  metadanych sparowanego urządzenia nadal kontroluje zasady poleceń przy ponownym połączeniu.

## TLS i przypinanie

- TLS jest obsługiwany dla połączeń WS (konfiguracja `gateway.tls`).
- Klienty mogą opcjonalnie przypiąć odcisk palca certyfikatu Gateway za pomocą
  `gateway.remote.tlsFingerprint` lub opcji CLI `--tls-fingerprint`.

## Zakres

Ten protokół udostępnia pełne API Gateway: status, kanały, modele, czat,
agenta, sesje, Node, zatwierdzenia i inne funkcje. Dokładny zakres jest definiowany przez
schematy TypeBox ponownie eksportowane z `packages/gateway-protocol/src/schema.ts`.

## Powiązane

- [Protokół mostu](/pl/gateway/bridge-protocol)
- [Podręcznik operacyjny Gateway](/pl/gateway)
