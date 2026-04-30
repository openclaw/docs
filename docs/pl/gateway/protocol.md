---
read_when:
    - Implementowanie lub aktualizowanie klientów WS Gateway
    - Debugowanie niezgodności protokołu lub niepowodzeń połączenia
    - Regenerowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: uzgadnianie, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-04-30T09:55:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

Protokół WS Gateway jest **pojedynczą płaszczyzną sterowania + transportem węzłów** dla
OpenClaw. Wszyscy klienci (CLI, internetowy interfejs użytkownika, aplikacja macOS, węzły iOS/Android, węzły bez interfejsu)
łączą się przez WebSocket i deklarują swoją **rolę** + **zakres** podczas
uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki sprzed połączenia są ograniczone do 64 KiB. Po udanym uzgodnieniu połączenia klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Gdy diagnostyka jest włączona,
  zbyt duże ramki przychodzące i wolne bufory wychodzące emitują zdarzenia `payload.large`
  zanim gateway zamknie lub odrzuci dotkniętą ramkę. Te zdarzenia zachowują
  rozmiary, limity, powierzchnie i bezpieczne kody powodów. Nie zachowują treści
  wiadomości, zawartości załączników, surowej treści ramki, tokenów, cookies ani wartości sekretów.

## Uzgodnienie połączenia (connect)

Gateway → Klient (wyzwanie sprzed połączenia):

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

Gdy Gateway nadal kończy uruchamianie procesów pomocniczych, żądanie `connect` może
zwrócić ponawialny błąd `UNAVAILABLE` z `details.reason` ustawionym na
`"startup-sidecars"` oraz `retryAfterMs`. Klienci powinni ponowić taką odpowiedź
w ramach całkowitego budżetu połączenia, zamiast prezentować ją jako końcową
awarię uzgadniania połączenia.

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`src/gateway/protocol/schema/frames.ts`). `auth` również jest wymagane i zgłasza
wynegocjowaną rolę/zakresy. `canvasHostUrl` jest opcjonalne.

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

Zaufani klienci backendu w tym samym procesie (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogą pominąć `device` w bezpośrednich połączeniach loopback,
gdy uwierzytelniają się współdzielonym tokenem/hasłem gateway. Ta ścieżka jest zarezerwowana
dla wewnętrznych RPC płaszczyzny sterowania i sprawia, że nieaktualne bazowe powiązania CLI/urządzenia
nie blokują lokalnej pracy backendu, takiej jak aktualizacje sesji subagentów. Klienci zdalni,
klienci pochodzący z przeglądarki, klienci węzłów oraz jawni klienci z tokenem urządzenia/tożsamością urządzenia
nadal używają zwykłych kontroli parowania i podnoszenia zakresu.

Gdy wydano token urządzenia, `hello-ok` zawiera także:

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

Dla wbudowanego przepływu bootstrapu węzła/operatora podstawowy token węzła pozostaje
`scopes: []`, a każdy przekazany token operatora pozostaje ograniczony do listy dozwolonej operatora
bootstrapu (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kontrole zakresu bootstrapu pozostają
prefiksowane rolą: wpisy operatora spełniają tylko żądania operatora, a role inne niż operator
nadal potrzebują zakresów z własnym prefiksem roli.

### Przykład węzła

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

Metody powodujące skutki uboczne wymagają **kluczy idempotencji** (zobacz schemat).

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

Metody RPC Gateway rejestrowane przez Plugin mogą żądać własnego zakresu operatora, ale
zarezerwowane prefiksy administracyjne rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze są rozwiązywane do `operator.admin`.

Zakres metody jest tylko pierwszą bramką. Niektóre polecenia ukośnikowe dostępne przez
`chat.send` nakładają dodatkowo ostrzejsze kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w czasie zatwierdzania, ponad
bazowy zakres metody:

- żądania bez polecenia: `operator.pairing`
- żądania z poleceniami węzła innymi niż exec: `operator.pairing` + `operator.write`
- żądania obejmujące `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Możliwości/polecenia/uprawnienia (węzeł)

Węzły deklarują roszczenia możliwości w czasie łączenia:

- `caps`: kategorie możliwości wysokiego poziomu.
- `commands`: lista dozwolonych poleceń dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i egzekwuje listy dozwolone po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy obecności zawierają `deviceId`, `roles` i `scopes`, aby interfejsy użytkownika mogły pokazać jeden wiersz na urządzenie
  nawet gdy łączy się ono zarówno jako **operator**, jak i **węzeł**.
- `node.list` zawiera opcjonalne pola `lastSeenAtMs` i `lastSeenReason`. Połączone węzły zgłaszają
  swój bieżący czas połączenia jako `lastSeenAtMs` z powodem `connect`; sparowane węzły mogą także zgłaszać
  trwałą obecność w tle, gdy zaufane zdarzenie węzła aktualizuje ich metadane parowania.

### Zdarzenie aktywności węzła w tle

Węzły mogą wywołać `node.event` z `event: "node.presence.alive"`, aby zapisać, że sparowany węzeł był
aktywny podczas wybudzenia w tle bez oznaczania go jako połączonego.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` jest zamkniętym wyliczeniem: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` lub `connect`. Nieznane ciągi wyzwalacza są normalizowane do
`background` przez gateway przed utrwaleniem. Zdarzenie jest trwałe tylko dla uwierzytelnionych sesji urządzeń
węzłów; sesje bez urządzenia lub niesparowane zwracają `handled: false`.

Pomyślne gateway zwracają ustrukturyzowany wynik:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Starsze gateway mogą nadal zwracać `{ "ok": true }` dla `node.event`; klienci powinni traktować to jako
potwierdzone RPC, nie jako trwałe utrwalenie obecności.

## Zakresowanie zdarzeń broadcast

Wypychanie przez serwer zdarzeń broadcast WebSocket jest bramkowane zakresem, aby sesje ograniczone do parowania lub tylko do węzła nie odbierały pasywnie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Zdefiniowane przez Plugin broadcasty `plugin.*`** są bramkowane do `operator.write` lub `operator.admin`, zależnie od tego, jak zarejestrował je Plugin.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia połączenia/rozłączenia itd.) pozostają nieograniczone, aby stan transportu był widoczny dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń broadcast** są domyślnie bramkowane zakresem (fail-closed), chyba że zarejestrowany handler jawnie je poluzuje.

Każde połączenie klienta utrzymuje własny numer sekwencyjny dla klienta, więc broadcasty zachowują monotoniczną kolejność na tym gnieździe nawet wtedy, gdy różni klienci widzą różne, filtrowane zakresem podzbiory strumienia zdarzeń.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż powyższe przykłady uzgadniania połączenia/uwierzytelniania. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` to konserwatywna
lista odkrywania zbudowana z `src/gateway/server-methods-list.ts` oraz załadowanych
eksportów metod plugin/kanału. Traktuj ją jako odkrywanie funkcji, nie pełne
wyliczenie `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System i tożsamość">
    - `health` zwraca buforowany lub świeżo sprawdzony snapshot stanu gateway.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestrator stabilności diagnostycznej. Przechowuje metadane operacyjne, takie jak nazwy zdarzeń, liczby, rozmiary w bajtach, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów i identyfikatory sesji. Nie przechowuje tekstu czatu, treści webhook, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, cookies ani wartości sekretów. Wymagany jest zakres odczytu operatora.
    - `status` zwraca podsumowanie gateway w stylu `/status`; pola wrażliwe są uwzględniane tylko dla klientów operatora z zakresem administratora.
    - `gateway.identity.get` zwraca tożsamość urządzenia gateway używaną przez przepływy relay i parowania.
    - `system-presence` zwraca bieżący snapshot obecności dla połączonych urządzeń operatora/węzła.
    - `system-event` dopisuje zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
    - `last-heartbeat` zwraca ostatnie utrwalone zdarzenie heartbeat.
    - `set-heartbeats` przełącza przetwarzanie heartbeat w gateway.

  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolonych w runtime. Przekaż `{ "view": "configured" }` dla skonfigurowanych modeli w rozmiarze selektora (`agents.defaults.models` najpierw, potem `models.providers.*.models`) albo `{ "view": "all" }` dla pełnego katalogu.
    - `usage.status` zwraca okna użycia dostawcy oraz podsumowania pozostałego limitu.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
    - `doctor.memory.status` zwraca gotowość pamięci wektorowej / buforowanych osadzeń dla aktywnego domyślnego obszaru roboczego agenta. Przekaż `{ "probe": true }` lub `{ "deep": true }` tylko wtedy, gdy wywołujący jawnie chce sprawdzenia dostępności dostawcy osadzeń na żywo.
    - `doctor.memory.remHarness` zwraca ograniczony, tylko do odczytu podgląd harnessu REM dla zdalnych klientów płaszczyzny sterowania. Może zawierać ścieżki obszaru roboczego, fragmenty pamięci, wyrenderowany ugruntowany Markdown i kandydatów do głębokiej promocji, więc wywołujący potrzebują `operator.read`.
    - `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji.
    - `sessions.usage.timeseries` zwraca szeregi czasowe użycia dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

  </Accordion>

  <Accordion title="Kanały i pomocnicze logowanie">
    - `channels.status` zwraca podsumowania statusu wbudowanych oraz dołączonych kanałów/Pluginów.
    - `channels.logout` wylogowuje określony kanał/konto tam, gdzie kanał obsługuje wylogowanie.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i po powodzeniu uruchamia kanał.
    - `push.test` wysyła testowe powiadomienie push APNs do zarejestrowanego węzła iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słowa aktywującego.
    - `voicewake.set` aktualizuje wyzwalacze słowa aktywującego i rozgłasza zmianę.

  </Accordion>

  <Accordion title="Wiadomości i dzienniki">
    - `send` to bezpośrednie RPC dostarczania wychodzącego dla wysyłek ukierunkowanych na kanał/konto/wątek poza runnerem czatu.
    - `logs.tail` zwraca skonfigurowany ogon pliku dziennika Gateway z kontrolkami kursora/limitu i maksymalnej liczby bajtów.

  </Accordion>

  <Accordion title="Talk i TTS">
    - `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (lub `operator.admin`).
    - `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów WebChat/Control UI.
    - `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców awaryjnych i stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny spis dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRefy i podmienia stan sekretów runtime tylko przy pełnym powodzeniu.
    - `secrets.resolve` rozwiązuje przypisania sekretów docelowych dla polecenia dla określonego zestawu poleceń/celów.
    - `config.get` zwraca bieżącą migawkę konfiguracji i hash.
    - `config.set` zapisuje zwalidowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji.
    - `config.apply` waliduje i zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca aktywny ładunek schematu konfiguracji używany przez narzędzia Control UI i CLI: schemat, `uiHints`, wersję i metadane generowania, w tym metadane schematów Pluginów i kanałów, gdy runtime może je załadować. Schemat obejmuje metadane pól `title` / `description` pochodzące z tych samych etykiet i tekstu pomocy, których używa UI, w tym zagnieżdżone obiekty, wildcardy, elementy tablic oraz gałęzie kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pola.
    - `config.schema.lookup` zwraca ładunek wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę + `hintPath` oraz podsumowania bezpośrednich dzieci do zagłębiania się w UI/CLI. Węzły schematu wyszukiwania zachowują dokumentację widoczną dla użytkownika i typowe pola walidacyjne (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ograniczenia liczb/ciągów/tablic/obiektów oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania dzieci udostępniają `key`, znormalizowaną `path`, `type`, `required`, `hasChildren` oraz dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji Gateway i planuje restart tylko wtedy, gdy sama aktualizacja się powiedzie.
    - `update.status` zwraca najnowszy zapisany sentinel restartu aktualizacji, w tym działającą wersję po restarcie, gdy jest dostępna.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator wdrożeniowy przez WS RPC.

  </Accordion>

  <Accordion title="Pomocniki agenta i obszaru roboczego">
    - `agents.list` zwraca skonfigurowane wpisy agentów, w tym efektywny model i metadane runtime.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów oraz powiązaniami obszaru roboczego.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami startowymi obszaru roboczego udostępnionymi agentowi.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcową migawkę, gdy jest dostępna.

  </Accordion>

  <Accordion title="Kontrola sesji">
    - `sessions.list` zwraca bieżący indeks sesji, w tym metadane `agentRuntime` dla każdego wiersza, gdy skonfigurowany jest backend runtime agenta.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmiany sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkryptu/wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkryptów dla określonych kluczy sesji.
    - `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant przerwania i sterowania dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji. Wywołujący może przekazać `key` plus opcjonalny `runId` albo przekazać sam `runId` dla aktywnych uruchomień, które Gateway może rozwiązać do sesji.
    - `sessions.patch` aktualizuje metadane/nadpisania sesji i zgłasza rozwiązany model kanoniczny oraz efektywny `agentRuntime`.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest znormalizowane do wyświetlania dla klientów UI: znaczniki dyrektyw inline są usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w zwykłym tekście (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` i ucięte bloki wywołań narzędzi) oraz ujawnione tokeny sterujące modelu ASCII/pełnej szerokości są usuwane, czyste wiersze asystenta z cichymi tokenami, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a zbyt duże wiersze mogą zostać zastąpione placeholderami.

  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` rotuje token sparowanego urządzenia w granicach zatwierdzonej roli i zakresu wywołującego.
    - `device.token.revoke` unieważnia token sparowanego urządzenia w granicach zatwierdzonej roli i zakresu wywołującego.

  </Accordion>

  <Accordion title="Parowanie węzłów, wywoływanie i oczekująca praca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` i `node.pair.verify` obejmują parowanie węzłów i weryfikację startową.
    - `node.list` i `node.describe` zwracają stan znanych/połączonych węzłów.
    - `node.rename` aktualizuje etykietę sparowanego węzła.
    - `node.invoke` przekazuje polecenie do połączonego węzła.
    - `node.invoke.result` zwraca wynik żądania wywołania.
    - `node.event` przenosi zdarzenia pochodzące z węzła z powrotem do Gateway.
    - `node.canvas.capability.refresh` odświeża tokeny możliwości canvas ograniczone zakresem.
    - `node.pending.pull` i `node.pending.ack` to API kolejki połączonego węzła.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą dla węzłów offline/rozłączonych.

  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia exec oraz wyszukiwanie/odtwarzanie oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie exec i zwraca ostateczną decyzję (lub `null` po przekroczeniu limitu czasu).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają migawkami zasad zatwierdzania exec Gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną dla węzła zasadą zatwierdzania exec przez polecenia przekaźnika węzła.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują przepływy zatwierdzania zdefiniowane przez Plugin.

  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe lub przy następnym Heartbeat wstrzyknięcie tekstu wybudzającego; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject` i inne zdarzenia czatu
  obejmujące tylko transkrypt.
- `session.message` i `session.tool`: aktualizacje transkryptu/strumienia zdarzeń dla
  subskrybowanej sesji.
- `sessions.changed`: indeks sesji lub metadane uległy zmianie.
- `presence`: aktualizacje migawki obecności systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja migawki kondycji Gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania Cron.
- `shutdown`: powiadomienie o zamknięciu Gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania węzła.
- `node.invoke.request`: rozgłoszenie żądania wywołania węzła.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: konfiguracja wyzwalacza słowa aktywującego uległa zmianie.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia zatwierdzenia exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzenia Pluginu.

### Metody pomocnicze węzła

- Węzły mogą wywołać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych Skills
  do kontroli automatycznego zezwalania.

### Metody pomocnicze operatora

- Operatorzy mogą wywołać `commands.list` (`operator.read`), aby pobrać spis poleceń środowiska wykonawczego dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - `scope` kontroluje, do której powierzchni kieruje główne `name`:
    - `text` zwraca główny token polecenia tekstowego bez początkowego `/`
    - `native` oraz domyślna ścieżka `both` zwracają natywne nazwy uwzględniające dostawcę, gdy są dostępne
  - `textAliases` przenosi dokładne aliasy z ukośnikiem, takie jak `/model` i `/m`.
  - `nativeName` przenosi natywną nazwę polecenia uwzględniającą dostawcę, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na nazewnictwo natywne oraz dostępność natywnych poleceń pluginów.
  - `includeArgs=false` pomija serializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywołać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi środowiska wykonawczego dla agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel pluginu, gdy `source="plugin"`
  - `optional`: czy narzędzie pluginu jest opcjonalne
- Operatorzy mogą wywołać `tools.effective` (`operator.read`), aby pobrać efektywny w środowisku wykonawczym spis narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst środowiska wykonawczego z sesji po stronie serwera, zamiast akceptować uwierzytelnianie lub kontekst dostarczenia podany przez wywołującego.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, czego aktywna konwersacja może używać w tej chwili, w tym narzędzia core, pluginów i kanałów.
- Operatorzy mogą wywołać `skills.status` (`operator.read`), aby pobrać widoczny spis umiejętności dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz oczyszczone opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywołać `skills.search` i `skills.detail` (`operator.read`) dla metadanych odkrywania ClawHub.
- Operatorzy mogą wywołać `skills.install` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje folder umiejętności w katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb instalatora Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście Gateway.
- Operatorzy mogą wywołać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug albo wszystkie śledzone instalacje ClawHub w domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji aktualizuje wartości `skills.entries.<skillKey>`, takie jak `enabled`, `apiKey` i `env`.

### Widoki `models.list`

`models.list` przyjmuje opcjonalny parametr `view`:

- Pominięty lub `"default"`: bieżące zachowanie środowiska wykonawczego. Jeśli skonfigurowano `agents.defaults.models`, odpowiedzią jest dozwolony katalog; w przeciwnym razie odpowiedzią jest pełny katalog Gateway.
- `"configured"`: zachowanie o rozmiarze selektora. Jeśli skonfigurowano `agents.defaults.models`, nadal ma pierwszeństwo. W przeciwnym razie odpowiedź używa jawnych wpisów `models.providers.*.models`, z powrotem do pełnego katalogu tylko wtedy, gdy nie istnieją żadne skonfigurowane wiersze modeli.
- `"all"`: pełny katalog Gateway, z pominięciem `agents.defaults.models`. Używaj tego do diagnostyki i interfejsów odkrywania, nie do zwykłych selektorów modeli.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, Gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozstrzygają je, wywołując `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node` żądanie `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane dalej wywołania `node.invoke system.run` ponownie używają tego kanonicznego `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmodyfikuje `command`, `rawCommand`, `cwd`, `agentId` lub `sessionKey` między przygotowaniem a końcowym zatwierdzonym przekazaniem `system.run`, Gateway odrzuca uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Awaryjne dostarczanie agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczenia wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe działanie: nierozwiązane albo tylko wewnętrzne cele dostarczenia zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na powrót do wykonania tylko w sesji, gdy nie da się rozwiązać zewnętrznej dostarczalnej trasy (na przykład sesje wewnętrzne/webchat albo niejednoznaczne konfiguracje wielokanałowe).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niezgodności.
- Schematy i modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości są stabilne w protokole v3 i stanowią oczekiwany punkt odniesienia dla klientów zewnętrznych.

| Stała                                    | Domyślnie                                             | Źródło                                                                                    |
| --------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                      | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                         |
| Limit czasu żądania (na RPC)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                              |
| Limit czasu preauth / connect-challenge | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env może zwiększyć sparowany budżet serwera/klienta) |
| Początkowe opóźnienie ponownego łączenia | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                     |
| Maks. opóźnienie ponownego łączenia     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                             |
| Ograniczenie szybkiej ponownej próby po zamknięciu tokenu urządzenia | `250` ms                       | `src/gateway/client.ts`                                                                   |
| Okres karencji wymuszonego zatrzymania przed `terminate()` | `250` ms                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                           |
| Domyślny limit czasu `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                |
| Domyślny interwał tick (przed `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                                                   |
| Zamknięcie z powodu limitu czasu tick   | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                   |
| `MAX_PAYLOAD_BYTES`                     | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                         |

Serwer ogłasza efektywne `policy.tickIntervalMs`, `policy.maxPayload` i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości zamiast domyślnych wartości sprzed uzgadniania.

## Uwierzytelnianie

- Uwierzytelnianie Gateway za pomocą współdzielonego sekretu używa `connect.params.auth.token` lub `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby przenoszące tożsamość, takie jak Tailscale Serve (`gateway.auth.allowTailscale: true`) albo nie-loopback `gateway.auth.mode: "trusted-proxy"`, spełniają kontrolę uwierzytelniania połączenia na podstawie nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatne wejście `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie połączenia współdzielonym sekretem; nie wystawiaj tego trybu na publiczne/niezaufane wejście.
- Po parowaniu Gateway wydaje **token urządzenia** ograniczony do roli połączenia + zakresów. Jest zwracany w `hello-ok.auth.deviceToken` i powinien zostać utrwalony przez klienta do przyszłych połączeń.
- Klienci powinni utrwalać główne `hello-ok.auth.deviceToken` po każdym udanym połączeniu.
- Ponowne łączenie z użyciem tego **zapisanego** tokenu urządzenia powinno także ponownie używać zapisanego zatwierdzonego zestawu zakresów dla tego tokenu. Zachowuje to dostęp do odczytu/sondowania/statusu, który został już przyznany, i zapobiega cichemu zawężeniu ponownych połączeń do węższego, niejawnego zakresu tylko administracyjnego.
- Składanie uwierzytelniania połączenia po stronie klienta (`selectConnectAuth` w `src/gateway/client.ts`):
  - `auth.password` jest ortogonalne i zawsze jest przekazywane, gdy jest ustawione.
  - `auth.token` jest wypełniane według priorytetu: najpierw jawny token współdzielony, potem jawny `deviceToken`, a następnie zapisany token dla urządzenia (kluczowany przez `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłane tylko wtedy, gdy żadne z powyższych nie rozwiązało `auth.token`. Token współdzielony albo dowolny rozwiązany token urządzenia go wycisza.
  - Automatyczne promowanie zapisanego tokenu urządzenia przy jednorazowej ponownej próbie `AUTH_TOKEN_MISMATCH` jest ograniczone tylko do **zaufanych punktów końcowych** — loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://` bez przypięcia się nie kwalifikuje.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` są tokenami przekazania bootstrap. Utrwalaj je tylko wtedy, gdy połączenie używało uwierzytelniania bootstrap na zaufanym transporcie, takim jak `wss://` albo parowanie loopback/lokalne.
- Jeśli klient podaje **jawny** `deviceToken` albo jawne `scopes`, zestaw zakresów żądany przez wywołującego pozostaje autorytatywny; zakresy z pamięci podręcznej są ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokenu dla urządzenia.
- Tokeny urządzeń można rotować/odwoływać za pomocą `device.token.rotate` i `device.token.revoke` (wymaga zakresu `operator.pairing`).
- `device.token.rotate` zwraca metadane rotacji. Zwraca zastępczy token bearer tylko dla wywołań z tego samego urządzenia, które są już uwierzytelnione tym tokenem urządzenia, aby klienci używający wyłącznie tokenu mogli utrwalić zamiennik przed ponownym połączeniem. Rotacje współdzielone/administracyjne nie zwracają tokenu bearer.
- Wydawanie, rotacja i odwoływanie tokenów pozostają ograniczone do zatwierdzonego zestawu ról zapisanego we wpisie parowania tego urządzenia; mutacja tokenu nie może rozszerzyć ani wskazać roli urządzenia, której zatwierdzenie parowania nigdy nie przyznało.
- Dla sesji tokenu sparowanego urządzenia zarządzanie urządzeniem jest ograniczone do samego siebie, chyba że wywołujący ma także `operator.admin`: wywołujący niebędący administratorem mogą usuwać/odwoływać/rotować tylko wpis **własnego** urządzenia.
- `device.token.rotate` i `device.token.revoke` sprawdzają także docelowy zestaw zakresów tokenu operatora względem bieżących zakresów sesji wywołującego. Wywołujący niebędący administratorem nie mogą rotować ani odwoływać szerszego tokenu operatora niż ten, który już posiadają.
- Niepowodzenia uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z tokenem z pamięci podręcznej dla urządzenia.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać wskazówki działań operatora.

## Tożsamość urządzenia + parowanie

- Węzły powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  odcisku palca pary kluczy.
- Gateway wydają tokeny na urządzenie + rolę.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że
  włączone jest lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania koncentruje się na bezpośrednich połączeniach local loopback.
- OpenClaw ma też wąską ścieżkę samopołączenia lokalną dla backendu/kontenera dla
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia z tego samego hosta przez tailnet lub LAN nadal są traktowane jako zdalne przy parowaniu i
  wymagają zatwierdzenia.
- Klienty WS zwykle dołączają tożsamość `device` podczas `connect` (operator +
  węzeł). Jedyne wyjątki operatora bez urządzenia to jawne ścieżki zaufania:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności niezabezpieczonego HTTP tylko na localhost.
  - pomyślne uwierzytelnienie operatora Control UI `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (awaryjne obejście, poważne obniżenie bezpieczeństwa).
  - RPC backendu `gateway-client` przez direct-loopback uwierzytelnione współdzielonym
    tokenem/hasłem Gateway.
- Wszystkie połączenia muszą podpisać nonce `connect.challenge` dostarczony przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed wyzwania, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` w `error.details.code` ze stabilnym `error.details.reason`.

Typowe błędy migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (lub wysłał pustą wartość). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał przy użyciu nieaktualnego/nieprawidłowego nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Podpisany znacznik czasu jest poza dozwolonym odchyleniem. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do odcisku palca klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalizacja klucza publicznego nie powiodła się. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisz ładunek v2 zawierający nonce serwera.
- Wyślij ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól urządzenia/klienta/roli/zakresów/tokenu/nonce.
- Starsze podpisy `v2` pozostają akceptowane dla zgodności, ale przypięcie metadanych
  sparowanego urządzenia nadal kontroluje politykę poleceń przy ponownym połączeniu.

## TLS + przypinanie

- TLS jest obsługiwany dla połączeń WS.
- Klienty mogą opcjonalnie przypiąć odcisk palca certyfikatu Gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` lub CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API Gateway** (status, kanały, modele, czat,
agent, sesje, węzły, zatwierdzenia itd.). Dokładny zakres jest zdefiniowany przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.

## Powiązane

- [Protokół mostu](/pl/gateway/bridge-protocol)
- [Instrukcja operacyjna Gateway](/pl/gateway)
