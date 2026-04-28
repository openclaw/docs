---
read_when:
    - Implementowanie lub aktualizowanie klientów WS Gateway
    - Debugowanie niedopasowań protokołu lub błędów połączenia
    - Regenerowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: handshake, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-04-26T11:30:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01f873c7051f2a462cbefb50331e04edfdcedadeda8b3d7b7320ceb2462edccc
    source_path: gateway/protocol.md
    workflow: 15
---

Protokół WS Gateway to **pojedyncza warstwa control plane + transport Node** dla
OpenClaw. Wszyscy klienci (CLI, web UI, aplikacja macOS, Node iOS/Android, headless
Node) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres** w
momencie handshake.

## Transport

- WebSocket, ramki tekstowe z ładunkiem JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po udanym handshake klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Przy włączonej diagnostyce
  zbyt duże ramki przychodzące i wolne bufory wychodzące emitują zdarzenia `payload.large`
  zanim gateway zamknie połączenie lub odrzuci daną ramkę. Zdarzenia te zachowują
  rozmiary, limity, powierzchnie i bezpieczne kody powodów. Nie zachowują treści wiadomości,
  zawartości załączników, surowej treści ramki, tokenów, cookies ani tajnych wartości.

## Handshake (`connect`)

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

`server`, `features`, `snapshot` i `policy` są wszystkie wymagane przez schemat
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` jest opcjonalne. `auth`
raportuje uzgodnioną rolę/zakresy, gdy są dostępne, i zawiera `deviceToken`,
gdy gateway go wydaje.

Gdy nie jest wydawany token urządzenia, `hello-ok.auth` nadal może raportować uzgodnione
uprawnienia:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Zaufani klienci backendu działający w tym samym procesie (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogą pominąć `device` przy bezpośrednich połączeniach loopback,
gdy uwierzytelniają się współdzielonym tokenem/hasłem gateway. Ta ścieżka jest zarezerwowana
dla wewnętrznych RPC control plane i zapobiega blokowaniu lokalnej pracy backendu przez nieaktualne
bazowe założenia CLI/parowania urządzeń, np. aktualizacji sesji subagenta. Klienci zdalni,
klienci pochodzący z przeglądarki, klienci Node oraz klienci używający jawnych tokenów urządzenia/tożsamości urządzenia
nadal używają zwykłych kontroli parowania i podnoszenia zakresu.

Gdy wydawany jest token urządzenia, `hello-ok` zawiera również:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Podczas zaufanego przekazania bootstrap `hello-ok.auth` może również zawierać dodatkowe
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

Dla wbudowanego przepływu bootstrap node/operator podstawowy token Node pozostaje
`scopes: []`, a każdy przekazany token operatora pozostaje ograniczony do listy dozwolonych
zakresów operatora bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kontrole zakresów bootstrap pozostają
z prefiksem roli: wpisy operatora spełniają tylko żądania operatora, a role inne niż operator
nadal potrzebują zakresów pod własnym prefiksem roli.

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

Metody powodujące skutki uboczne wymagają **kluczy idempotency** (zobacz schemat).

## Role + zakresy

### Role

- `operator` = klient control plane (CLI/UI/automatyzacja).
- `node` = host możliwości (`camera/screen/canvas/system.run`).

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

Metody RPC Gateway zarejestrowane przez Plugin mogą wymagać własnego zakresu operatora, ale
zastrzeżone prefiksy core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze są rozwiązywane do `operator.admin`.

Zakres metody to tylko pierwsza bramka. Niektóre polecenia slash osiągane przez
`chat.send` nakładają dodatkowo bardziej rygorystyczne kontrole na poziomie polecenia. Na
przykład trwałe zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w momencie zatwierdzania ponad
bazowy zakres metody:

- żądania bez poleceń: `operator.pairing`
- żądania z poleceniami Node innymi niż exec: `operator.pairing` + `operator.write`
- żądania zawierające `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node deklarują roszczenia dotyczące możliwości w momencie `connect`:

- `caps`: kategorie możliwości wysokiego poziomu.
- `commands`: lista dozwolonych poleceń dla invoke.
- `permissions`: granularne przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i egzekwuje listy dozwolonych po stronie serwera.

## Presence

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy presence zawierają `deviceId`, `roles` i `scopes`, dzięki czemu interfejsy mogą pokazywać jeden wiersz na urządzenie,
  nawet gdy łączy się ono zarówno jako **operator**, jak i **node**.

## Zakresowanie zdarzeń broadcast

Zdarzenia broadcast WebSocket wypychane przez serwer są bramkowane zakresem, aby sesje ograniczone do parowania lub tylko-Node nie odbierały pasywnie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Broadcasty `plugin.*` zdefiniowane przez Plugin** są bramkowane do `operator.write` lub `operator.admin`, zależnie od tego, jak zarejestrował je Plugin.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia connect/disconnect itd.) pozostają bez ograniczeń, aby kondycja transportu była obserwowalna dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń broadcast** są domyślnie bramkowane zakresem (odmowa domyślna), chyba że zarejestrowany handler jawnie je poluzuje.

Każde połączenie klienta utrzymuje własny numer sekwencji per klient, dzięki czemu broadcasty zachowują monotoniczną kolejność na tym gnieździe nawet wtedy, gdy różni klienci widzą różne podzbiory strumienia zdarzeń odfiltrowane zakresem.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż przykłady handshake/uwierzytelniania powyżej. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` to konserwatywna
lista wykrywania zbudowana na podstawie `src/gateway/server-methods-list.ts` oraz załadowanych
eksportów metod pluginów/kanałów. Traktuj ją jako wykrywanie funkcji, a nie pełne
wyliczenie `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System i tożsamość">
    - `health` zwraca pamięci podręcznej lub świeżo sprawdzony snapshot kondycji gateway.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestrator stabilności diagnostycznej. Zachowuje metadane operacyjne, takie jak nazwy zdarzeń, liczniki, rozmiary bajtowe, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów oraz identyfikatory sesji. Nie zachowuje tekstu czatu, treści Webhooków, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, cookies ani tajnych wartości. Wymagany jest zakres operator read.
    - `status` zwraca podsumowanie gateway w stylu `/status`; pola wrażliwe są uwzględniane tylko dla klientów operatora z zakresem admin.
    - `gateway.identity.get` zwraca tożsamość urządzenia gateway używaną przez relay i przepływy parowania.
    - `system-presence` zwraca bieżący snapshot presence dla połączonych urządzeń operator/node.
    - `system-event` dopisuje zdarzenie systemowe i może aktualizować/emitować kontekst presence.
    - `last-heartbeat` zwraca najnowsze utrwalone zdarzenie Heartbeat.
    - `set-heartbeats` przełącza przetwarzanie Heartbeat na gateway.

  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolonych w runtime.
    - `usage.status` zwraca podsumowania okien użycia dostawców/pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania usage-cost dla zakresu dat.
    - `doctor.memory.status` zwraca gotowość vector-memory / embedding dla aktywnego workspace domyślnego agenta.
    - `sessions.usage` zwraca podsumowania użycia per sesja.
    - `sessions.usage.timeseries` zwraca szereg czasowy użycia dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy logów użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Kanały i helpery logowania">
    - `channels.status` zwraca podsumowania statusu kanałów/pluginów wbudowanych + dołączonych.
    - `channels.logout` wylogowuje określony kanał/konto tam, gdzie kanał obsługuje wylogowanie.
    - `web.login.start` rozpoczyna przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i przy sukcesie uruchamia kanał.
    - `push.test` wysyła testowy push APNs do zarejestrowanego Node iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze wake-word.
    - `voicewake.set` aktualizuje wyzwalacze wake-word i emituje zmianę.

  </Accordion>

  <Accordion title="Wiadomości i logi">
    - `send` to bezpośrednie wychodzące RPC dostarczania dla wysyłek celowanych na kanał/konto/wątek poza runnerem czatu.
    - `logs.tail` zwraca skonfigurowany tail logu plikowego gateway z kontrolą kursora/limitu i maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Talk i TTS">
    - `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (lub `operator.admin`).
    - `talk.mode` ustawia/emituje bieżący stan trybu Talk dla klientów WebChat/Control UI.
    - `talk.speak` syntezuje mowę przez aktywnego dostawcę mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców fallback i stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny inwentarz dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` wykonuje jednorazową konwersję text-to-speech.

  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRef i podmienia stan sekretów runtime tylko przy pełnym sukcesie.
    - `secrets.resolve` rozwiązuje przypisania sekretów dla celu polecenia dla określonego zestawu poleceń/celów.
    - `config.get` zwraca bieżący snapshot konfiguracji i hash.
    - `config.set` zapisuje zwalidowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji.
    - `config.apply` waliduje + zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca ładunek aktywnego schematu konfiguracji używanego przez Control UI i narzędzia CLI: schemat, `uiHints`, wersję i metadane generowania, w tym metadane schematów pluginów + kanałów, gdy runtime może je załadować. Schemat zawiera metadane pól `title` / `description` pochodzące z tych samych etykiet i tekstów pomocy używanych przez UI, w tym dla obiektów zagnieżdżonych, wildcard, elementów tablic i gałęzi kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pola.
    - `config.schema.lookup` zwraca ładunek wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę + `hintPath` oraz podsumowania bezpośrednich dzieci dla UI/CLI typu drill-down. Węzły schematu z lookup zachowują dokumentację widoczną dla użytkownika i typowe pola walidacji (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, granice liczb/ciągów/tablic/obiektów oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania dzieci ujawniają `key`, znormalizowaną `path`, `type`, `required`, `hasChildren` oraz dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji gateway i planuje restart tylko wtedy, gdy sama aktualizacja się powiedzie.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator onboardingu przez WS RPC.

  </Accordion>

  <Accordion title="Helpery agentów i workspace">
    - `agents.list` zwraca skonfigurowane wpisy agentów.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów i podłączeniem workspace.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami bootstrap workspace udostępnianymi dla agenta.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcowy snapshot, gdy jest dostępny.

  </Accordion>

  <Accordion title="Sterowanie sesją">
    - `sessions.list` zwraca bieżący indeks sesji.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkryptu/wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkryptu dla określonych kluczy sesji.
    - `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant przerwania i sterowania dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji.
    - `sessions.patch` aktualizuje metadane/nadpisania sesji.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują utrzymanie sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest znormalizowane do wyświetlania dla klientów UI: inline tagi dyrektyw są usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w postaci zwykłego tekstu (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi) i wyciekłe tokeny sterujące modelu ASCII/full-width są usuwane, czyste wiersze asystenta z cichym tokenem, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a zbyt duże wiersze mogą być zastępowane placeholderami.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresów wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresów wywołującego.

  </Accordion>

  <Accordion title="Parowanie Node, invoke i oczekująca praca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` i `node.pair.verify` obejmują parowanie Node i weryfikację bootstrap.
    - `node.list` i `node.describe` zwracają stan znanych/połączonych Node.
    - `node.rename` aktualizuje etykietę sparowanego Node.
    - `node.invoke` przekazuje polecenie do połączonego Node.
    - `node.invoke.result` zwraca wynik dla żądania invoke.
    - `node.event` przenosi zdarzenia pochodzące od Node z powrotem do gateway.
    - `node.canvas.capability.refresh` odświeża tokeny canvas-capability ograniczone zakresem.
    - `node.pending.pull` i `node.pending.ack` to API kolejki połączonego Node.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą dla offline/rozłączonych Node.

  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia exec oraz wyszukiwanie/odtwarzanie oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie exec i zwraca ostateczną decyzję (lub `null` przy timeout).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają snapshotami polityki zatwierdzeń exec gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną polityką zatwierdzeń exec Node przez polecenia relay Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują przepływy zatwierdzeń zdefiniowane przez Plugin.

  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe lub przy następnym Heartbeat wstrzyknięcie tekstu wybudzenia; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject` i inne zdarzenia
  czatu dotyczące tylko transkryptu.
- `session.message` i `session.tool`: aktualizacje transkryptu/strumienia zdarzeń dla
  subskrybowanej sesji.
- `sessions.changed`: indeks sesji lub metadane uległy zmianie.
- `presence`: aktualizacje snapshotu presence systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja snapshotu kondycji gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania Cron.
- `shutdown`: powiadomienie o zamykaniu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania Node.
- `node.invoke.request`: broadcast żądania invoke Node.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniła się konfiguracja wyzwalacza wake-word.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia
  zatwierdzeń exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia
  zatwierdzeń Plugin.

### Metody pomocnicze Node

- Node mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych
  Skills do kontroli auto-allow.

### Metody pomocnicze operatora

- Operatorzy mogą wywoływać `commands.list` (`operator.read`), aby pobrać inwentarz poleceń runtime
  dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny workspace agenta.
  - `scope` kontroluje, do której powierzchni odnosi się podstawowe `name`:
    - `text` zwraca podstawowy tekstowy token polecenia bez początkowego `/`
    - `native` i domyślna ścieżka `both` zwracają natywne nazwy zależne od dostawcy,
      gdy są dostępne
  - `textAliases` zawiera dokładne aliasy slash, takie jak `/model` i `/m`.
  - `nativeName` zawiera natywną nazwę zależną od dostawcy, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na nazewnictwo natywne oraz dostępność
    natywnych poleceń Plugin.
  - `includeArgs=false` pomija zserializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywoływać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi runtime dla
  agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel Plugin, gdy `source="plugin"`
  - `optional`: czy narzędzie Plugin jest opcjonalne
- Operatorzy mogą wywoływać `tools.effective` (`operator.read`), aby pobrać efektywny inwentarz narzędzi runtime
  dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst runtime po stronie serwera z sesji zamiast akceptować
    kontekst uwierzytelniania lub dostarczania podany przez wywołującego.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, z czego aktywna konwersacja może korzystać teraz,
    w tym narzędzia core, Plugin i kanałów.
- Operatorzy mogą wywoływać `skills.status` (`operator.read`), aby pobrać widoczny
  inwentarz Skills dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny workspace agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji i
    oczyszczone opcje instalacji bez ujawniania surowych tajnych wartości.
- Operatorzy mogą wywoływać `skills.search` i `skills.detail` (`operator.read`) dla
  metadanych wykrywania ClawHub.
- Operatorzy mogą wywoływać `skills.install` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje
    folder skill do katalogu `skills/` domyślnego workspace agenta.
  - Tryb instalatora gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście gateway.
- Operatorzy mogą wywoływać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug lub wszystkie śledzone instalacje ClawHub w
    domyślnym workspace agenta.
  - Tryb Config poprawia wartości `skills.entries.<skillKey>`, takie jak `enabled`,
    `apiKey` i `env`.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, gateway emituje `exec.approval.requested`.
- Klienci operatora rozstrzygają je przez wywołanie `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node`, `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane wywołania `node.invoke system.run` ponownie używają tego kanonicznego
  `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmodyfikuje `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` między prepare a końcowym zatwierdzonym przekazaniem `system.run`,
  gateway odrzuca uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Fallback dostarczania agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczenia wychodzącego.
- `bestEffortDeliver=false` utrzymuje ścisłe zachowanie: nierozwiązane lub tylko-wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na fallback do wykonania tylko w sesji, gdy nie można rozwiązać zewnętrznej ścieżki dostarczania (na przykład sesje internal/webchat lub niejednoznaczne konfiguracje wielokanałowe).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niedopasowania.
- Schematy + modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości są
stabilne w całym protokole v3 i stanowią oczekiwaną bazę dla klientów zewnętrznych.

| Stała                                    | Domyślnie                                             | Źródło                                                     |
| ---------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                       | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout żądania (na RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout preauth / connect-challenge      | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Początkowy backoff ponownego połączenia  | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Maksymalny backoff ponownego połączenia  | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp szybkiej ponownej próby po zamknięciu z tokenem urządzenia | `250` ms                                | `src/gateway/client.ts`                                    |
| Okres łaski force-stop przed `terminate()` | `250` ms                                            | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Domyślny timeout `stopAndWait()`         | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Domyślny interwał tick (przed `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                    |
| Zamknięcie z powodu timeoutu tick        | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                      | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Serwer ogłasza efektywne `policy.tickIntervalMs`, `policy.maxPayload`
i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości
zamiast domyślnych wartości sprzed handshake.

## Uwierzytelnianie

- Uwierzytelnianie gateway współdzielonym sekretem używa `connect.params.auth.token` lub
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby niosące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) lub nie-loopback
  `gateway.auth.mode: "trusted-proxy"`, spełniają kontrolę uwierzytelniania connect na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatny ingress `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie connect
  współdzielonym sekretem; nie wystawiaj tego trybu na publicznym/niezaufanym ingress.
- Po sparowaniu Gateway wydaje **token urządzenia** ograniczony do roli + zakresów połączenia.
  Jest zwracany w `hello-ok.auth.deviceToken` i powinien zostać zapisany przez klienta
  do przyszłych połączeń.
- Klienci powinni zapisywać główny `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne łączenie z tym **zapisanym** tokenem urządzenia powinno także ponownie używać zapisanego
  zatwierdzonego zestawu zakresów dla tego tokenu. Zachowuje to dostęp do odczytu/probe/status,
  który został już przyznany, i zapobiega cichemu zawężeniu ponownych połączeń do
  węższego domyślnego zakresu tylko admin.
- Składanie uwierzytelniania connect po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest ortogonalne i zawsze jest przekazywane, gdy ustawione.
  - `auth.token` jest wypełniane według kolejności priorytetów: najpierw jawny współdzielony token,
    potem jawny `deviceToken`, potem zapisany token per urządzenie (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żaden z powyższych elementów nie rozwiązał
    `auth.token`. Współdzielony token lub dowolny rozwiązany token urządzenia go tłumi.
  - Automatyczna promocja zapisanego tokenu urządzenia przy jednorazowej
    ponownej próbie `AUTH_TOKEN_MISMATCH` jest ograniczona tylko do **zaufanych punktów końcowych** —
    loopback lub `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez przypięcia się nie kwalifikuje.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` to tokeny przekazania bootstrap.
  Zapisuj je tylko wtedy, gdy połączenie używało uwierzytelniania bootstrap na zaufanym transporcie,
  takim jak `wss://` lub loopback/local pairing.
- Jeśli klient dostarcza **jawny** `deviceToken` lub jawne `scopes`, ten
  zestaw zakresów żądany przez wywołującego pozostaje autorytatywny; zakresy z cache są ponownie używane
  tylko wtedy, gdy klient ponownie używa zapisanego tokenu per urządzenie.
- Tokeny urządzeń można rotować/unieważniać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- Wydawanie, rotacja i unieważnianie tokenów pozostają ograniczone do zatwierdzonego zestawu ról
  zapisanego we wpisie parowania tego urządzenia; modyfikacja tokenu nie może rozszerzyć ani
  wskazać roli urządzenia, której zatwierdzenie parowania nigdy nie przyznało.
- Dla sesji tokenów sparowanych urządzeń zarządzanie urządzeniem jest ograniczone do samego siebie, chyba że
  wywołujący ma również `operator.admin`: wywołujący bez uprawnień admin mogą usuwać/unieważniać/rotować
  tylko **własny** wpis urządzenia.
- `device.token.rotate` i `device.token.revoke` sprawdzają również zestaw zakresów docelowego tokenu operatora
  względem bieżących zakresów sesji wywołującego. Wywołujący bez uprawnień admin
  nie mogą rotować ani unieważniać szerszego tokenu operatora, niż już posiadają.
- Błędy uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą wykonać jedną ograniczoną ponowną próbę z buforowanym tokenem per urządzenie.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać operatorowi wskazówki dalszego działania.

## Tożsamość urządzenia + parowanie

- Node powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z fingerprintu
  pary kluczy.
- Gatewaye wydają tokeny per urządzenie + rola.
- Zatwierdzenia parowania są wymagane dla nowych `device.id`, chyba że włączone jest lokalne autozatwierdzanie.
- Autozatwierdzanie parowania jest skoncentrowane na bezpośrednich lokalnych połączeniach loopback.
- OpenClaw ma także wąską ścieżkę samo-połączenia backend/container-local dla
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia tailnet lub LAN z tego samego hosta nadal są traktowane jako zdalne dla parowania i
  wymagają zatwierdzenia.
- Klienci WS normalnie dołączają tożsamość `device` podczas `connect` (operator +
  node). Jedynymi wyjątkami operatora bez urządzenia są jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niebezpiecznym HTTP tylko na localhost.
  - udane uwierzytelnianie operatora Control UI przy `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, poważne obniżenie bezpieczeństwa).
  - bezpośrednie loopback RPC backendu `gateway-client` uwierzytelnione współdzielonym
    tokenem/hasłem gateway.
- Wszystkie połączenia muszą podpisać nonce `connect.challenge` dostarczony przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed challenge, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` pod `error.details.code` wraz ze stabilnym `error.details.reason`.

Typowe błędy migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                            |
| --------------------------- | -------------------------------- | ------------------------ | ---------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (lub wysłał pusty).    |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał starym/błędnym nonce.                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.            |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Sygnowany znacznik czasu jest poza dozwolonym przesunięciem. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do fingerprintu klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalizacja klucza publicznego nie powiodły się. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisuj ładunek v2 zawierający nonce serwera.
- Wysyłaj ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól device/client/role/scopes/token/nonce.
- Starsze podpisy `v2` nadal są akceptowane dla zgodności, ale przypinanie metadanych
  sparowanego urządzenia nadal kontroluje politykę poleceń przy ponownym połączeniu.

## TLS + przypinanie

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypinać fingerprint certyfikatu gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` lub CLI `--tls-fingerprint`).

## Zakres

Ten protokół ujawnia **pełne API gateway** (status, kanały, modele, chat,
agent, sesje, Node, zatwierdzenia itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.

## Powiązane

- [Protokół Bridge](/pl/gateway/bridge-protocol)
- [Runbook Gateway](/pl/gateway)
