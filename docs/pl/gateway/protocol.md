---
read_when:
    - Implementowanie lub aktualizowanie klientów WS gateway
    - Debugowanie niezgodności protokołu lub błędów połączenia
    - Regenerowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: handshake, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-04-24T09:11:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6710cb1c620dc03b75421cab7953c412cb85e68c52fa9b504ea89b7302efb8
    source_path: gateway/protocol.md
    workflow: 15
---

# Protokół Gateway (WebSocket)

Protokół Gateway WS to **jedna płaszczyzna sterowania + transport Node** dla
OpenClaw. Wszyscy klienci (CLI, interfejs webowy, aplikacja macOS, Node iOS/Android, bezgłowe
Node) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres** w
momencie handshake.

## Transport

- WebSocket, ramki tekstowe z ładunkiem JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po udanym handshake klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Przy włączonej diagnostyce
  zbyt duże ramki przychodzące i powolne bufory wychodzące emitują zdarzenia `payload.large`
  zanim gateway zamknie połączenie albo odrzuci daną ramkę. Zdarzenia te zachowują
  rozmiary, limity, powierzchnie i bezpieczne kody przyczyn. Nie przechowują
  treści wiadomości, zawartości załączników, surowej treści ramki, tokenów, cookies ani wartości sekretów.

## Handshake (`connect`)

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
raportuje wynegocjowaną rolę/zakresy, gdy są dostępne, i zawiera `deviceToken`,
gdy gateway go wyda.

Gdy token urządzenia nie jest wydawany, `hello-ok.auth` może nadal raportować wynegocjowane
uprawnienia:

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

Podczas zaufanego przekazania bootstrap `hello-ok.auth` może także zawierać dodatkowe
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
`scopes: []`, a każdy przekazany token operatora pozostaje ograniczony do listy dozwolonych operatora bootstrap
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Sprawdzanie zakresów bootstrap pozostaje
poprzedzone prefiksem roli: wpisy operatora spełniają tylko żądania operatora, a role inne niż operator
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

Metody powodujące skutki uboczne wymagają **kluczy idempotencyjności** (zobacz schemat).

## Role + zakresy

### Role

- `operator` = klient control plane (CLI/UI/automatyzacja).
- `node` = host możliwości (`camera`/`screen`/`canvas`/`system.run`).

### Zakresy (`operator`)

Typowe zakresy:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` z `includeSecrets: true` wymaga `operator.talk.secrets`
(albo `operator.admin`).

Metody RPC Gateway zarejestrowane przez Plugin mogą żądać własnego zakresu operatora, ale
zastrzeżone główne prefiksy administracyjne (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze rozwiązują się do `operator.admin`.

Zakres metody to tylko pierwsza bramka. Niektóre polecenia slash osiągane przez
`chat.send` stosują dodatkowo bardziej restrykcyjne kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkowe sprawdzenie zakresu w momencie zatwierdzania ponad
bazowy zakres metody:

- żądania bez poleceń: `operator.pairing`
- żądania z poleceniami node innymi niż exec: `operator.pairing` + `operator.write`
- żądania zawierające `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (`node`)

Node deklarują roszczenia możliwości przy połączeniu:

- `caps`: wysokopoziomowe kategorie możliwości.
- `commands`: lista dozwolonych poleceń dla `invoke`.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i egzekwuje listy dozwolonych po stronie serwera.

## Presence

- `system-presence` zwraca wpisy kluczowane według tożsamości urządzenia.
- Wpisy presence zawierają `deviceId`, `roles` i `scopes`, aby interfejsy mogły pokazywać jeden wiersz na urządzenie,
  nawet gdy łączy się ono jednocześnie jako **operator** i **node**.

## Ograniczanie zakresu zdarzeń broadcast

Zdarzenia broadcast WebSocket wypychane przez serwer są ograniczane zakresem, tak aby sesje ograniczone do parowania albo tylko do node nie otrzymywały biernie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Broadcasty `plugin.*` zdefiniowane przez Plugin** są ograniczane do `operator.write` albo `operator.admin`, zależnie od sposobu ich rejestracji przez Plugin.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia połączenia/rozłączenia itd.) pozostają nieograniczone, aby stan zdrowia transportu pozostawał obserwowalny dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń broadcast** są domyślnie ograniczane zakresem (fail-closed), chyba że zarejestrowany handler jawnie to złagodzi.

Każde połączenie klienta utrzymuje własny numer sekwencyjny per klient, dzięki czemu broadcasty zachowują monotoniczną kolejność na tym gnieździe, nawet gdy różni klienci widzą różne podzbiory strumienia zdarzeń filtrowane zakresem.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż powyższe przykłady handshake/auth. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` to konserwatywna
lista wykrywania zbudowana z `src/gateway/server-methods-list.ts` oraz załadowanych
eksportów metod Plugin/kanałów. Traktuj to jako wykrywanie funkcji, a nie pełne
wyliczenie `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` zwraca buforowany albo świeżo sondowany snapshot zdrowia gateway.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestr stabilności diagnostycznej. Przechowuje metadane operacyjne, takie jak nazwy zdarzeń, liczby, rozmiary bajtowe, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/Pluginów i identyfikatory sesji. Nie przechowuje tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, cookies ani wartości sekretów. Wymagany jest zakres odczytu operatora.
    - `status` zwraca podsumowanie gateway w stylu `/status`; pola wrażliwe są uwzględniane tylko dla klientów operatora z zakresem admin.
    - `gateway.identity.get` zwraca tożsamość urządzenia gateway używaną przez przepływy relay i pairing.
    - `system-presence` zwraca bieżący snapshot presence dla podłączonych urządzeń operator/node.
    - `system-event` dołącza zdarzenie systemowe i może aktualizować/rozgłaszać kontekst presence.
    - `last-heartbeat` zwraca najnowsze utrwalone zdarzenie Heartbeat.
    - `set-heartbeats` przełącza przetwarzanie Heartbeat w gateway.
  </Accordion>

  <Accordion title="Models and usage">
    - `models.list` zwraca katalog modeli dozwolonych w runtime.
    - `usage.status` zwraca podsumowania okien użycia providerów/pozostałych limitów.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
    - `doctor.memory.status` zwraca gotowość pamięci wektorowej / embeddingów dla aktywnego domyślnego obszaru roboczego agenta.
    - `sessions.usage` zwraca podsumowania użycia per sesja.
    - `sessions.usage.timeseries` zwraca szeregi czasowe użycia dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy logów użycia dla jednej sesji.
  </Accordion>

  <Accordion title="Channels and login helpers">
    - `channels.status` zwraca podsumowania statusu wbudowanych + dołączonych kanałów/Pluginów.
    - `channels.logout` wylogowuje określony kanał/konto tam, gdzie kanał obsługuje logout.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego providera kanału web obsługującego QR.
    - `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i przy sukcesie uruchamia kanał.
    - `push.test` wysyła testowy push APNs do zarejestrowanego Node iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słów wybudzających.
    - `voicewake.set` aktualizuje wyzwalacze słów wybudzających i rozgłasza zmianę.
  </Accordion>

  <Accordion title="Messaging and logs">
    - `send` to bezpośrednie RPC dostarczania wychodzącego dla wysyłek kierowanych do kanału/konta/wątku poza runnerem czatu.
    - `logs.tail` zwraca tail skonfigurowanego logu plikowego gateway z kontrolą kursora/limitu i maksymalnej liczby bajtów.
  </Accordion>

  <Accordion title="Talk and TTS">
    - `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (albo `operator.admin`).
    - `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów WebChat/Control UI.
    - `talk.speak` syntezuje mowę przez aktywnego providera mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego providera, providerów fallback i stan konfiguracji providera.
    - `tts.providers` zwraca widoczny inwentarz providerów TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego providera TTS.
    - `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.
  </Accordion>

  <Accordion title="Secrets, config, update, and wizard">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRefs i podmienia stan sekretów runtime tylko przy pełnym sukcesie.
    - `secrets.resolve` rozwiązuje przypisania sekretów docelowych dla poleceń dla określonego zestawu poleceń/celów.
    - `config.get` zwraca bieżący snapshot konfiguracji i hash.
    - `config.set` zapisuje zwalidowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji.
    - `config.apply` waliduje + zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca ładunek aktywnego schematu konfiguracji używany przez Control UI i narzędzia CLI: schemat, `uiHints`, wersję i metadane generowania, w tym metadane schematu Plugin + kanałów, gdy runtime może je załadować. Schemat zawiera metadane pól `title` / `description` pochodzące z tych samych etykiet i tekstów pomocy używanych przez UI, w tym dla zagnieżdżonych obiektów, wildcardów, elementów tablic i gałęzi złożeń `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pola.
    - `config.schema.lookup` zwraca ładunek lookup ograniczony do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę + `hintPath` oraz podsumowania bezpośrednich elementów podrzędnych do drążenia w UI/CLI. Węzły schematu lookup zachowują dokumentację widoczną dla użytkownika i typowe pola walidacyjne (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia numeryczne/ciągów/tablic/obiektów oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania elementów podrzędnych ujawniają `key`, znormalizowaną `path`, `type`, `required`, `hasChildren` oraz dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji gateway i planuje restart tylko wtedy, gdy sama aktualizacja się powiodła.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator onboardingu przez WS RPC.
  </Accordion>

  <Accordion title="Agent and workspace helpers">
    - `agents.list` zwraca skonfigurowane wpisy agentów.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów i połączeniami z obszarem roboczym.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami bootstrap obszaru roboczego udostępnionymi dla agenta.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcowy snapshot, gdy jest dostępny.
  </Accordion>

  <Accordion title="Session control">
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
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest znormalizowane do wyświetlania dla klientów UI: inline’owe tagi dyrektyw są usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w postaci zwykłego tekstu (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi) i wyciekłe tokeny sterujące modelu ASCII/full-width są usuwane, czyste wiersze asystenta z cichymi tokenami, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a zbyt duże wiersze mogą być zastępowane placeholderami.
  </Accordion>

  <Accordion title="Device pairing and device tokens">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresu.
    - `device.token.revoke` unieważnia token sparowanego urządzenia.
  </Accordion>

  <Accordion title="Node pairing, invoke, and pending work">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` i `node.pair.verify` obejmują parowanie Node i weryfikację bootstrap.
    - `node.list` i `node.describe` zwracają znany/podłączony stan Node.
    - `node.rename` aktualizuje etykietę sparowanego Node.
    - `node.invoke` przekazuje polecenie do podłączonego Node.
    - `node.invoke.result` zwraca wynik dla żądania invoke.
    - `node.event` przenosi zdarzenia pochodzące z Node z powrotem do gateway.
    - `node.canvas.capability.refresh` odświeża tokeny możliwości canvas ograniczone zakresem.
    - `node.pending.pull` i `node.pending.ack` to API kolejki dla podłączonych Node.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą dla offline’owych/rozłączonych Node.
  </Accordion>

  <Accordion title="Approval families">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia exec oraz wyszukiwanie/odtwarzanie oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedną oczekującą decyzję zatwierdzenia exec i zwraca ostateczną decyzję (albo `null` przy timeout).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają snapshotami polityki zatwierdzeń exec gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną dla Node polityką zatwierdzeń exec przez polecenia relay Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują przepływy zatwierdzeń zdefiniowane przez Plugin.
  </Accordion>

  <Accordion title="Automation, skills, and tools">
    - Automatyzacja: `wake` planuje natychmiastowe albo przy następnym Heartbeat wstrzyknięcie tekstu wybudzenia; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject` i inne zdarzenia czatu
  tylko dla transkryptu.
- `session.message` i `session.tool`: aktualizacje transkryptu/strumienia zdarzeń dla
  subskrybowanej sesji.
- `sessions.changed`: zmienił się indeks sesji albo metadane.
- `presence`: aktualizacje snapshotu system presence.
- `tick`: okresowe zdarzenie keepalive / liveness.
- `health`: aktualizacja snapshotu zdrowia gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania cron.
- `shutdown`: powiadomienie o zamknięciu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania Node.
- `node.invoke.request`: broadcast żądania invoke Node.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanych urządzeń.
- `voicewake.changed`: zmieniła się konfiguracja wyzwalaczy słów wybudzających.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia
  zatwierdzania exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia
  zatwierdzania Plugin.

### Metody pomocnicze Node

- Node mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych skill
  do sprawdzeń auto-allow.

### Metody pomocnicze operatora

- Operatorzy mogą wywoływać `commands.list` (`operator.read`), aby pobrać inwentarz poleceń runtime dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, do której powierzchni odnosi się podstawowa `name`:
    - `text` zwraca podstawowy token polecenia tekstowego bez początkowego `/`
    - `native` i domyślna ścieżka `both` zwracają nazwy natywne świadome providera, gdy są dostępne
  - `textAliases` przenosi dokładne aliasy slash, takie jak `/model` i `/m`.
  - `nativeName` przenosi nazwę natywną świadomą providera, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na nazewnictwo natywne oraz dostępność natywnych poleceń Plugin.
  - `includeArgs=false` pomija zserializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywoływać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi runtime dla
  agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel Plugin, gdy `source="plugin"`
  - `optional`: czy narzędzie Plugin jest opcjonalne
- Operatorzy mogą wywoływać `tools.effective` (`operator.read`), aby pobrać efektywny w runtime
  inwentarz narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst runtime z sesji po stronie serwera zamiast akceptować
    kontekst auth lub dostarczania podany przez wywołującego.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, czego aktywna rozmowa może używać w danym momencie,
    w tym narzędzi core, Plugin i kanałów.
- Operatorzy mogą wywoływać `skills.status` (`operator.read`), aby pobrać widoczny
  inwentarz skill dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź obejmuje kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz
    oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywoływać `skills.search` i `skills.detail` (`operator.read`) dla
  metadanych wykrywania ClawHub.
- Operatorzy mogą wywoływać `skills.install` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje
    folder skill do katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb instalatora Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście gateway.
- Operatorzy mogą wywoływać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug albo wszystkie śledzone instalacje ClawHub w
    domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji łata wartości `skills.entries.<skillKey>`, takie jak `enabled`,
    `apiKey` i `env`.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozwiązują to przez wywołanie `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node` `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazywane wywołania `node.invoke system.run` ponownie używają tego kanonicznego
  `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` między przygotowaniem a końcowym zatwierdzonym przekazaniem `system.run`,
  gateway odrzuca uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Fallback dostarczania agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczania wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe zachowanie: nierozwiązane albo tylko wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na fallback do wykonania tylko w sesji, gdy nie można rozwiązać żadnej zewnętrznej ścieżki dostarczania (na przykład sesje internal/webchat albo niejednoznaczne konfiguracje wielokanałowe).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niezgodności.
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
| Timeout żądania (na RPC)                | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout preauth / connect-challenge      | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Początkowy backoff ponownego połączenia  | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Maksymalny backoff ponownego połączenia  | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp szybkiej próby po zamknięciu device-token | `250` ms                                        | `src/gateway/client.ts`                                    |
| Grace force-stop przed `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Domyślny timeout `stopAndWait()`         | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Domyślny interwał tick (przed `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                    |
| Zamknięcie przy tick-timeout             | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                      | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Serwer ogłasza efektywne `policy.tickIntervalMs`, `policy.maxPayload`
i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości,
a nie domyślne ustawienia sprzed handshake.

## Uwierzytelnianie

- Uwierzytelnianie gateway współdzielonym sekretem używa `connect.params.auth.token` albo
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby przenoszące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) albo tryb inny niż loopback
  `gateway.auth.mode: "trusted-proxy"`, spełniają sprawdzenie uwierzytelniania `connect`
  na podstawie nagłówków żądania zamiast `connect.params.auth.*`.
- `gateway.auth.mode: "none"` dla prywatnego ingress pomija całkowicie uwierzytelnianie `connect` współdzielonym sekretem; nie wystawiaj tego trybu na publiczny/niezaufany ingress.
- Po parowaniu Gateway wydaje **token urządzenia** ograniczony do roli + zakresów połączenia. Jest zwracany w `hello-ok.auth.deviceToken` i powinien być utrwalany przez klienta do przyszłych połączeń.
- Klienci powinni utrwalać główny `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne połączenie z tym **zapisanym** tokenem urządzenia powinno również ponownie użyć zapisanego
  zatwierdzonego zestawu zakresów dla tego tokena. Zachowuje to dostęp do odczytu/probe/status,
  który został już przyznany, i zapobiega cichemu zawężeniu ponownych połączeń do
  węższego niejawnego zakresu tylko admin.
- Składanie uwierzytelniania `connect` po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest ortogonalne i zawsze jest przekazywane, gdy jest ustawione.
  - `auth.token` jest wypełniane według kolejności priorytetu: najpierw jawny współdzielony token,
    potem jawny `deviceToken`, a następnie zapisany token per urządzenie (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłane tylko wtedy, gdy żadna z powyższych ścieżek nie rozwiązała
    `auth.token`. Współdzielony token albo dowolny rozwiązany token urządzenia go tłumią.
  - Automatyczna promocja zapisanego tokena urządzenia przy jednorazowej
    próbie `AUTH_TOKEN_MISMATCH` jest ograniczona tylko do **zaufanych endpointów** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczny `wss://`
    bez pinningu się nie kwalifikuje.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` to tokeny przekazania bootstrap.
  Utrwalaj je tylko wtedy, gdy połączenie używało uwierzytelniania bootstrap przez zaufany transport,
  taki jak `wss://` albo loopback/local pairing.
- Jeśli klient poda **jawny** `deviceToken` albo jawne `scopes`, ten
  zestaw zakresów żądany przez wywołującego pozostaje autorytatywny; buforowane zakresy są
  ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokena per urządzenie.
- Tokeny urządzeń można rotować/unieważniać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- Wydawanie/rotacja tokenów pozostaje ograniczona do zatwierdzonego zestawu ról zapisanego w
  wpisie parowania tego urządzenia; rotacja tokena nie może rozszerzyć urządzenia do
  roli, której zatwierdzenie parowania nigdy nie przyznało.
- Dla sesji tokenów sparowanych urządzeń zarządzanie urządzeniami jest ograniczone do samego urządzenia, chyba że
  wywołujący ma także `operator.admin`: wywołujący bez uprawnień admin mogą usuwać/unieważniać/rotować
  tylko **własny** wpis urządzenia.
- `device.token.rotate` sprawdza także żądany zestaw zakresów operatora względem
  bieżących zakresów sesji wywołującego. Wywołujący bez uprawnień admin nie mogą rotować tokena do
  szerszego zestawu zakresów operatora, niż już posiadają.
- Błędy uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną próbę ponownego połączenia z buforowanym tokenem per urządzenie.
  - Jeśli ta próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać operatorowi wskazówki dotyczące dalszego działania.

## Tożsamość urządzenia + parowanie

- Node powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  fingerprintu pary kluczy.
- Gatewaye wydają tokeny per urządzenie + rola.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączono lokalne auto-zatwierdzanie.
- Auto-zatwierdzanie parowania koncentruje się na bezpośrednich lokalnych połączeniach loopback.
- OpenClaw ma także wąską ścieżkę samozłączenia backend/container-local dla
  zaufanych przepływów pomocniczych opartych na współdzielonym sekrecie.
- Połączenia tailnet lub LAN z tego samego hosta nadal są traktowane jako zdalne na potrzeby parowania i
  wymagają zatwierdzenia.
- Wszyscy klienci WS muszą dołączać tożsamość `device` podczas `connect` (operator + node).
  Control UI może ją pominąć tylko w tych trybach:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niezabezpieczonym HTTP tylko na localhost.
  - udane uwierzytelnienie operatora w Control UI przy `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (awaryjne, poważne obniżenie bezpieczeństwa).
- Wszystkie połączenia muszą podpisywać nonce `connect.challenge` dostarczony przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed challenge, `connect` zwraca teraz
kody szczegółowe `DEVICE_AUTH_*` w `error.details.code` ze stabilnym `error.details.reason`.

Typowe błędy migracji:

| Wiadomość                    | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (albo wysłał pustą wartość). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał starym/nieprawidłowym nonce.       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Czas podpisu jest poza dozwolonym odchyleniem.     |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do fingerprintu klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Nie powiodło się formatowanie/kanonizacja klucza publicznego. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisuj ładunek v2 zawierający nonce serwera.
- Wysyłaj ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól device/client/role/scopes/token/nonce.
- Starsze podpisy `v2` pozostają akceptowane dla zgodności, ale przypinanie metadanych sparowanych urządzeń nadal kontroluje politykę poleceń przy ponownym połączeniu.

## TLS + pinning

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypinać fingerprint certyfikatu gateway (zobacz konfigurację `gateway.tls` oraz `gateway.remote.tlsFingerprint` albo CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API gateway** (status, kanały, modele, czat,
agent, sesje, Node, zatwierdzenia itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.

## Powiązane

- [Bridge protocol](/pl/gateway/bridge-protocol)
- [Gateway runbook](/pl/gateway)
