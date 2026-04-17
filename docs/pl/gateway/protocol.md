---
read_when:
    - Implementowanie lub aktualizowanie klientów Gateway WS
    - Debugowanie niezgodności protokołu lub błędów połączenia
    - Ponowne generowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie połączenia, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-04-17T09:49:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f0eebcfdd8c926c90b4753a6d96c59e3134ddb91740f65478f11eb75be85e41
    source_path: gateway/protocol.md
    workflow: 15
---

# Protokół Gateway (WebSocket)

Protokół Gateway WS to **pojedyncza płaszczyzna sterowania + transport node'ów** dla
OpenClaw. Wszyscy klienci (CLI, web UI, aplikacja macOS, nody iOS/Android,
nody bezgłowe) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres**
w czasie uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.

## Uzgadnianie połączenia (connect)

Gateway → klient (wyzwanie przed połączeniem):

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

Gateway → klient:

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
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` jest opcjonalne. `auth`
zgłasza uzgodnioną rolę/zakresy, gdy są dostępne, i zawiera `deviceToken`,
gdy gateway go wyda.

Gdy nie jest wydawany token urządzenia, `hello-ok.auth` może nadal zgłaszać
uzgodnione uprawnienia:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Gdy token urządzenia jest wydawany, `hello-ok` zawiera także:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Podczas przekazywania zaufanego bootstrapu `hello-ok.auth` może także zawierać
dodatkowe wpisy ról ograniczonych zakresem w `deviceTokens`:

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

Dla wbudowanego przepływu bootstrapu node/operator główny token node'a pozostaje
`scopes: []`, a każdy przekazany token operatora pozostaje ograniczony do listy
dozwolonych zakresów operatora bootstrapu (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kontrole zakresów bootstrapu
pozostają prefiksowane rolą: wpisy operatora spełniają tylko żądania operatora,
a role inne niż operator nadal wymagają zakresów pod własnym prefiksem roli.

### Przykład node'a

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

Metody wywołujące skutki uboczne wymagają **kluczy idempotencji** (zobacz schemat).

## Role + zakresy

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

Metody Gateway RPC zarejestrowane przez Plugin mogą wymagać własnego zakresu operatora, ale
zastrzeżone prefiksy podstawowego administratora (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) są zawsze mapowane na `operator.admin`.

Zakres metody to tylko pierwszy próg. Niektóre komendy slash osiągane przez
`chat.send` stosują dodatkowo bardziej rygorystyczne kontrole na poziomie komendy. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w momencie zatwierdzania,
oprócz bazowego zakresu metody:

- żądania bez komendy: `operator.pairing`
- żądania z komendami node'a innymi niż exec: `operator.pairing` + `operator.write`
- żądania zawierające `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nody deklarują zgłoszenia możliwości w czasie `connect`:

- `caps`: wysokopoziomowe kategorie możliwości.
- `commands`: lista dozwolonych komend dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **zgłoszenia** i wymusza listy dozwolonych operacji po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy obecności zawierają `deviceId`, `roles` i `scopes`, dzięki czemu interfejsy UI mogą pokazywać jeden wiersz na urządzenie,
  nawet gdy łączy się ono zarówno jako **operator**, jak i **node**.

## Typowe rodziny metod RPC

Ta strona nie jest wygenerowanym pełnym zrzutem, ale publiczna powierzchnia WS jest
szersza niż przykłady uzgadniania połączenia/uwierzytelniania powyżej. To główne rodziny metod,
które Gateway udostępnia obecnie.

`hello-ok.features.methods` to zachowawcza lista wykrywania zbudowana z
`src/gateway/server-methods-list.ts` oraz załadowanych eksportów metod pluginów/kanałów.
Traktuj ją jako wykrywanie funkcji, a nie jako wygenerowany zrzut każdej wywoływalnej funkcji pomocniczej
zaimplementowanej w `src/gateway/server-methods/*.ts`.

### System i tożsamość

- `health` zwraca zapisany w pamięci podręcznej lub świeżo sprawdzony snapshot kondycji gateway.
- `status` zwraca podsumowanie gateway w stylu `/status`; pola wrażliwe są
  uwzględniane tylko dla klientów operatora z zakresem administratora.
- `gateway.identity.get` zwraca tożsamość urządzenia gateway używaną przez relay i
  przepływy parowania.
- `system-presence` zwraca bieżący snapshot obecności dla podłączonych
  urządzeń operatora/node'a.
- `system-event` dopisuje zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
- `last-heartbeat` zwraca najnowsze utrwalone zdarzenie Heartbeat.
- `set-heartbeats` przełącza przetwarzanie Heartbeat w gateway.

### Modele i użycie

- `models.list` zwraca katalog modeli dozwolonych w czasie działania.
- `usage.status` zwraca okna użycia dostawców/podsumowania pozostałego limitu.
- `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
- `doctor.memory.status` zwraca gotowość pamięci wektorowej / osadzania dla
  aktywnego domyślnego obszaru roboczego agenta.
- `sessions.usage` zwraca podsumowania użycia na sesję.
- `sessions.usage.timeseries` zwraca szereg czasowy użycia dla jednej sesji.
- `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

### Kanały i pomocniki logowania

- `channels.status` zwraca podsumowania stanu wbudowanych i dołączonych kanałów/pluginów.
- `channels.logout` wylogowuje określony kanał/konto tam, gdzie kanał
  obsługuje wylogowanie.
- `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego
  dostawcy kanału web obsługującego QR.
- `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i po powodzeniu uruchamia
  kanał.
- `push.test` wysyła testowe powiadomienie APNs push do zarejestrowanego node'a iOS.
- `voicewake.get` zwraca zapisane wyzwalacze słowa wybudzającego.
- `voicewake.set` aktualizuje wyzwalacze słowa wybudzającego i rozgłasza zmianę.

### Wiadomości i logi

- `send` to bezpośrednie RPC dostarczania wychodzącego dla
  wysyłek poza runnerem czatu kierowanych na kanał/konto/wątek.
- `logs.tail` zwraca skonfigurowany ogon logu plikowego gateway z kursorem/limitem i
  kontrolą maksymalnej liczby bajtów.

### Talk i TTS

- `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets`
  wymaga `operator.talk.secrets` (lub `operator.admin`).
- `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów
  WebChat/Control UI.
- `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
- `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców zapasowych
  oraz stan konfiguracji dostawcy.
- `tts.providers` zwraca widoczny inwentarz dostawców TTS.
- `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
- `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
- `tts.convert` wykonuje jednorazową konwersję tekstu na mowę.

### Sekrety, konfiguracja, aktualizacja i kreator

- `secrets.reload` ponownie rozwiązuje aktywne SecretRef i przełącza stan sekretów w czasie działania
  tylko przy pełnym powodzeniu.
- `secrets.resolve` rozwiązuje przypisania sekretów dla określonego
  zestawu komend/celów.
- `config.get` zwraca bieżący snapshot konfiguracji i hash.
- `config.set` zapisuje zweryfikowany ładunek konfiguracji.
- `config.patch` scala częściową aktualizację konfiguracji.
- `config.apply` weryfikuje + zastępuje pełny ładunek konfiguracji.
- `config.schema` zwraca aktywny ładunek schematu konfiguracji używany przez Control UI i
  narzędzia CLI: schemat, `uiHints`, wersję i metadane generowania, w tym
  metadane schematów pluginów + kanałów, gdy środowisko uruchomieniowe może je załadować. Schemat
  zawiera metadane pól `title` / `description` pochodzące z tych samych etykiet
  i tekstów pomocy używanych przez UI, w tym dla obiektów zagnieżdżonych, wildcardów, elementów tablic,
  oraz gałęzi kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja
  pola.
- `config.schema.lookup` zwraca ładunek wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji:
  znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę + `hintPath`,
  oraz podsumowania bezpośrednich elementów podrzędnych do drążenia w UI/CLI.
  - Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika i typowe pola walidacji:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    ograniczenia numeryczne/łańcuchów/tablic/obiektów oraz flagi logiczne takie jak
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Podsumowania elementów podrzędnych ujawniają `key`, znormalizowaną `path`, `type`, `required`,
    `hasChildren`, a także dopasowane `hint` / `hintPath`.
- `update.run` uruchamia przepływ aktualizacji gateway i planuje restart tylko wtedy,
  gdy sama aktualizacja się powiodła.
- `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają
  kreator onboardingu przez WS RPC.

### Istniejące główne rodziny

#### Pomocniki agentów i obszaru roboczego

- `agents.list` zwraca skonfigurowane wpisy agentów.
- `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów i
  powiązaniem obszaru roboczego.
- `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają
  plikami bootstrapowego obszaru roboczego udostępnionymi dla agenta.
- `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub
  sesji.
- `agent.wait` czeka na zakończenie uruchomienia i zwraca końcowy snapshot, gdy jest
  dostępny.

#### Sterowanie sesją

- `sessions.list` zwraca bieżący indeks sesji.
- `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń
  zmian sesji dla bieżącego klienta WS.
- `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają
  subskrypcje zdarzeń transkryptu/wiadomości dla jednej sesji.
- `sessions.preview` zwraca ograniczone podglądy transkryptu dla określonych
  kluczy sesji.
- `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
- `sessions.create` tworzy nowy wpis sesji.
- `sessions.send` wysyła wiadomość do istniejącej sesji.
- `sessions.steer` to wariant przerwania i ukierunkowania dla aktywnej sesji.
- `sessions.abort` przerywa aktywną pracę dla sesji.
- `sessions.patch` aktualizuje metadane/nadpisania sesji.
- `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują
  utrzymanie sesji.
- `sessions.get` zwraca pełny zapisany wiersz sesji.
- wykonanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i
  `chat.inject`.
- `chat.history` jest znormalizowane pod kątem wyświetlania dla klientów UI: znaczniki dyrektyw inline są
  usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w postaci zwykłego tekstu (w tym
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz
  ucięte bloki wywołań narzędzi) i wyciekłe tokeny sterujące modelu ASCII/full-width
  są usuwane, czyste wiersze asystenta z cichym tokenem takie jak dokładne `NO_REPLY` /
  `no_reply` są pomijane, a zbyt duże wiersze mogą zostać zastąpione placeholderami.

#### Parowanie urządzeń i tokeny urządzeń

- `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
- `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają
  rekordami parowania urządzeń.
- `device.token.rotate` rotuje token sparowanego urządzenia w granicach jego zatwierdzonej roli
  i zakresów.
- `device.token.revoke` unieważnia token sparowanego urządzenia.

#### Parowanie node'ów, invoke i oczekująca praca

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` i `node.pair.verify` obejmują parowanie node'ów i
  weryfikację bootstrapu.
- `node.list` i `node.describe` zwracają stan znanych/podłączonych node'ów.
- `node.rename` aktualizuje etykietę sparowanego node'a.
- `node.invoke` przekazuje komendę do podłączonego node'a.
- `node.invoke.result` zwraca wynik dla żądania invoke.
- `node.event` przenosi zdarzenia pochodzące z node'a z powrotem do gateway.
- `node.canvas.capability.refresh` odświeża tokeny możliwości canvas ograniczone zakresem.
- `node.pending.pull` i `node.pending.ack` to API kolejki podłączonych node'ów.
- `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą
  dla node'ów offline/odłączonych.

#### Rodziny zatwierdzeń

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i
  `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia exec oraz
  wyszukiwanie/odtwarzanie oczekujących zatwierdzeń.
- `exec.approval.waitDecision` czeka na jedną oczekującą decyzję zatwierdzenia exec i zwraca
  końcową decyzję (lub `null` po przekroczeniu limitu czasu).
- `exec.approvals.get` i `exec.approvals.set` zarządzają snapshotami zasad
  zatwierdzania exec w gateway.
- `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalnymi dla node'a zasadami zatwierdzania exec
  za pomocą komend relay node'a.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują
  przepływy zatwierdzania zdefiniowane przez Plugin.

#### Inne główne rodziny

- automatyzacja:
  - `wake` planuje natychmiastowe lub przy następnym Heartbeat wstrzyknięcie tekstu wybudzenia
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI takie jak `chat.inject` i inne zdarzenia czatu
  tylko dla transkryptu.
- `session.message` i `session.tool`: aktualizacje strumienia transkryptu/zdarzeń dla
  subskrybowanej sesji.
- `sessions.changed`: indeks sesji lub metadane uległy zmianie.
- `presence`: aktualizacje snapshotu obecności systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja snapshotu kondycji gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania Cron.
- `shutdown`: powiadomienie o wyłączeniu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania node'a.
- `node.invoke.request`: rozgłoszenie żądania invoke node'a.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: konfiguracja wyzwalacza słowa wybudzającego uległa zmianie.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia
  zatwierdzania exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzania
  Plugin.

### Metody pomocnicze node'a

- Nody mogą wywołać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych Skills
  do automatycznych kontroli allowlisty.

### Metody pomocnicze operatora

- Operatorzy mogą wywołać `commands.list` (`operator.read`), aby pobrać inwentarz komend środowiska uruchomieniowego dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, którą powierzchnię wskazuje podstawowe `name`:
    - `text` zwraca podstawowy tekstowy token komendy bez początkowego `/`
    - `native` oraz domyślna ścieżka `both` zwracają nazwy natywne zależne od dostawcy,
      gdy są dostępne
  - `textAliases` zawiera dokładne aliasy slash, takie jak `/model` i `/m`.
  - `nativeName` zawiera zależną od dostawcy natywną nazwę komendy, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na nazewnictwo natywne oraz dostępność natywnych komend
    Plugin.
  - `includeArgs=false` pomija zserializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywołać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi środowiska uruchomieniowego dla
  agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel Plugin, gdy `source="plugin"`
  - `optional`: czy narzędzie Plugin jest opcjonalne
- Operatorzy mogą wywołać `tools.effective` (`operator.read`), aby pobrać efektywny w czasie działania
  inwentarz narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst środowiska uruchomieniowego po stronie serwera z sesji zamiast akceptować
    dostarczony przez wywołującego kontekst uwierzytelniania lub dostarczania.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, czego aktywna konwersacja może użyć w tej chwili,
    w tym narzędzia core, Plugin i kanałów.
- Operatorzy mogą wywołać `skills.status` (`operator.read`), aby pobrać widoczny
  inwentarz Skills dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji i
    oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywołać `skills.search` i `skills.detail` (`operator.read`) dla
  metadanych wykrywania ClawHub.
- Operatorzy mogą wywołać `skills.install` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje
    folder skill do katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb instalatora Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście gateway.
- Operatorzy mogą wywołać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug lub wszystkie śledzone instalacje ClawHub w
    domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji łata wartości `skills.entries.<skillKey>` takie jak `enabled`,
    `apiKey` i `env`.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozwiązują to, wywołując `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node` `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane wywołania `node.invoke system.run` ponownie używają tego kanonicznego
  `systemRunPlan` jako autorytatywnego kontekstu komendy/cwd/sesji.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` między przygotowaniem a końcowym zatwierdzonym przekazaniem `system.run`,
  gateway odrzuci uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Fallback dostarczania agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczenia wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe działanie: nierozwiązane lub tylko wewnętrzne cele dostarczenia zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na fallback do wykonania tylko w sesji, gdy nie można rozwiązać żadnej zewnętrznej trasy dostarczania (na przykład sesje wewnętrzne/webchat lub niejednoznaczne konfiguracje wielokanałowe).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niezgodności.
- Schematy + modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości
są stabilne w całym protokole v3 i stanowią oczekiwaną bazę dla klientów zewnętrznych.

| Stała                                     | Wartość domyślna                                      | Źródło                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Limit czasu żądania (na RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Limit czasu preauth / connect-challenge   | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (ograniczenie `250`–`10_000`) |
| Początkowy backoff ponownego połączenia   | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Maksymalny backoff ponownego połączenia   | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Ograniczenie szybkiej ponownej próby po zamknięciu tokenu urządzenia | `250` ms                                | `src/gateway/client.ts`                                    |
| Grace przed `terminate()` przy wymuszonym zatrzymaniu | `250` ms                                  | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Domyślny limit czasu `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Domyślny interwał tick (przed `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Zamknięcie z powodu limitu czasu tick     | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Serwer ogłasza efektywne `policy.tickIntervalMs`, `policy.maxPayload`
i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości,
zamiast wartości domyślnych sprzed uzgadniania połączenia.

## Uwierzytelnianie

- Uwierzytelnianie gateway przy użyciu wspólnego sekretu korzysta z `connect.params.auth.token` lub
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby niosące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) lub inne niż loopback
  `gateway.auth.mode: "trusted-proxy"`, spełniają kontrolę uwierzytelniania connect na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatny ingress `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie connect wspólnym sekretem; nie wystawiaj tego trybu na publicznym/niezaufanym ingressie.
- Po sparowaniu Gateway wydaje **token urządzenia** ograniczony do roli + zakresów
  połączenia. Jest on zwracany w `hello-ok.auth.deviceToken` i powinien być
  utrwalany przez klienta do przyszłych połączeń.
- Klienci powinni utrwalać podstawowy `hello-ok.auth.deviceToken` po każdym
  pomyślnym połączeniu.
- Ponowne łączenie przy użyciu tego **zapisanego** tokenu urządzenia powinno także ponownie używać zapisanego
  zatwierdzonego zestawu zakresów dla tego tokenu. Zachowuje to już przyznany
  dostęp do odczytu/sprawdzania/statusu i zapobiega cichemu zawężeniu ponownych połączeń do
  węższego domyślnego zakresu tylko administratora.
- Składanie uwierzytelniania connect po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest niezależne i zawsze jest przekazywane, gdy jest ustawione.
  - `auth.token` jest wypełniane w kolejności priorytetu: najpierw jawny współdzielony token,
    potem jawny `deviceToken`, a następnie zapisany token na urządzenie (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłane tylko wtedy, gdy żadne z powyższych nie ustawiło
    `auth.token`. Współdzielony token lub dowolny rozwiązany token urządzenia je tłumi.
  - Automatyczne promowanie zapisanego tokenu urządzenia przy jednorazowej
    ponownej próbie `AUTH_TOKEN_MISMATCH` jest ograniczone wyłącznie do **zaufanych endpointów** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez pinningu się nie kwalifikuje.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` to tokeny przekazania bootstrapu.
  Utrwalaj je tylko wtedy, gdy połączenie używało uwierzytelniania bootstrap przez zaufany transport
  taki jak `wss://` lub loopback/parowanie lokalne.
- Jeśli klient podaje **jawny** `deviceToken` lub jawne `scopes`,
  autorytatywny pozostaje zestaw zakresów zażądany przez wywołującego; zapisane zakresy są ponownie używane tylko
  wtedy, gdy klient ponownie używa zapisanego tokenu na urządzenie.
- Tokeny urządzeń można rotować/unieważniać za pomocą `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- Wydawanie/rotacja tokenów pozostaje ograniczone do zatwierdzonego zestawu ról zapisanego
  we wpisie parowania tego urządzenia; rotacja tokenu nie może rozszerzyć urządzenia do
  roli, której zatwierdzenie parowania nigdy nie przyznało.
- Dla sesji tokenów sparowanych urządzeń zarządzanie urządzeniami jest ograniczone do własnego zakresu, chyba że
  wywołujący ma także `operator.admin`: wywołujący bez uprawnień administratora mogą usuwać/unieważniać/rotować
  tylko **własny** wpis urządzenia.
- `device.token.rotate` sprawdza także żądany zestaw zakresów operatora względem
  bieżących zakresów sesji wywołującego. Wywołujący bez uprawnień administratora nie mogą obrócić tokenu do
  szerszego zestawu zakresów operatora niż już posiadają.
- Błędy uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z zapisanym tokenem na urządzenie.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać operatorowi wskazówki dotyczące dalszego działania.

## Tożsamość urządzenia + parowanie

- Nody powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  odcisku palca pary kluczy.
- Gateway wydaje tokeny dla urządzenia + roli.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączone
  jest lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania jest skoncentrowane na bezpośrednich lokalnych połączeniach loopback.
- OpenClaw ma także wąską ścieżkę samopołączenia backend/container-local dla
  zaufanych przepływów pomocniczych opartych na współdzielonym sekrecie.
- Połączenia tailnet lub LAN z tego samego hosta są nadal traktowane jako zdalne na potrzeby parowania i
  wymagają zatwierdzenia.
- Wszyscy klienci WS muszą dołączać tożsamość `device` podczas `connect` (operator + node).
  Control UI może ją pominąć tylko w tych trybach:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niebezpiecznym HTTP tylko dla localhost.
  - pomyślne uwierzytelnienie operatora Control UI przy `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tryb awaryjny, poważne obniżenie bezpieczeństwa).
- Wszystkie połączenia muszą podpisywać nonce `connect.challenge` dostarczone przez serwer.

### Diagnostyka migracji uwierzytelniania urządzenia

Dla starszych klientów, które nadal używają zachowania podpisywania sprzed challenge, `connect` zwraca teraz
kody szczegółowe `DEVICE_AUTH_*` w `error.details.code` wraz ze stabilnym `error.details.reason`.

Typowe błędy migracji:

| Wiadomość                   | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (lub wysłał pustą wartość). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał starym/błędnym nonce.              |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie odpowiada ładunkowi v2.        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Podpisany znacznik czasu wykracza poza dozwolone odchylenie. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie odpowiada odciskowi palca klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonizacja klucza publicznego nie powiodły się. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisuj ładunek v2 zawierający nonce serwera.
- Wyślij ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól device/client/role/scopes/token/nonce.
- Starsze podpisy `v2` pozostają akceptowane dla zgodności, ale przypinanie metadanych
  sparowanego urządzenia nadal kontroluje politykę komend przy ponownym połączeniu.

## TLS + pinning

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk palca certyfikatu gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` lub flagę CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API gateway** (status, kanały, modele, chat,
agent, sesje, nody, zatwierdzenia itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.
