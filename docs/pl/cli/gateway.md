---
read_when:
    - Uruchamianie Gateway z CLI (środowisko deweloperskie lub serwery)
    - Debugowanie uwierzytelniania Gateway, trybów wiązania i łączności
    - Wykrywanie instancji Gateway za pomocą Bonjour (lokalnego + szerokoobszarowego DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — uruchamianie, odpytywanie i wykrywanie instancji Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-12T12:50:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b19babe545895b8a5fc4b49bef5a0f9103091795f3e3c9bbcdf9ba9d7784538
    source_path: cli/gateway.md
    workflow: 16
---

Gateway to serwer WebSocket OpenClaw (kanały, węzły, sesje, hooki). Podpolecenia na tej stronie znajdują się pod `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Wykrywanie Bonjour" href="/pl/gateway/bonjour">
    Konfiguracja lokalnego mDNS i szerokoobszarowego DNS-SD.
  </Card>
  <Card title="Omówienie wykrywania" href="/pl/gateway/discovery">
    Jak OpenClaw ogłasza i znajduje gatewaye.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration">
    Najwyższego poziomu klucze konfiguracji gatewaya.
  </Card>
</CardGroup>

## Uruchamianie Gateway

Uruchom lokalny proces Gateway:

```bash
openclaw gateway
```

Alias pierwszoplanowy:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Zachowanie podczas uruchamiania">
    - Domyślnie Gateway odmawia uruchomienia, chyba że w `~/.openclaw/openclaw.json` ustawiono `gateway.mode=local`. Użyj `--allow-unconfigured` do doraźnych/deweloperskich uruchomień.
    - Oczekuje się, że `openclaw onboard --mode local` i `openclaw setup` zapiszą `gateway.mode=local`. Jeśli plik istnieje, ale brakuje `gateway.mode`, traktuj to jako uszkodzoną lub nadpisaną konfigurację i napraw ją, zamiast domyślnie zakładać tryb lokalny.
    - Jeśli plik istnieje, a brakuje `gateway.mode`, Gateway traktuje to jako podejrzane uszkodzenie konfiguracji i odmawia „odgadnięcia local” za Ciebie.
    - Bindowanie poza loopback bez uwierzytelnienia jest blokowane (bariera bezpieczeństwa).
    - `SIGUSR1` wyzwala restart wewnątrz procesu, gdy jest autoryzowany (`commands.restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby zablokować ręczny restart, podczas gdy stosowanie/aktualizowanie narzędzia i konfiguracji gatewaya pozostają dozwolone).
    - Handlery `SIGINT`/`SIGTERM` zatrzymują proces gatewaya, ale nie przywracają żadnego niestandardowego stanu terminala. Jeśli opakowujesz CLI za pomocą TUI lub wejścia w trybie raw, przywróć terminal przed zakończeniem.

  </Accordion>
</AccordionGroup>

### Opcje

<ParamField path="--port <port>" type="number">
  Port WebSocket (wartość domyślna pochodzi z konfiguracji/środowiska; zwykle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Tryb bindowania nasłuchiwacza.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Nadpisanie trybu uwierzytelniania.
</ParamField>
<ParamField path="--token <token>" type="string">
  Nadpisanie tokenu (ustawia też `OPENCLAW_GATEWAY_TOKEN` dla procesu).
</ParamField>
<ParamField path="--password <password>" type="string">
  Nadpisanie hasła.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Odczytaj hasło gatewaya z pliku.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Udostępnij Gateway przez Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Zresetuj konfigurację Tailscale serve/funnel podczas wyłączania.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Zezwól na uruchomienie gatewaya bez `gateway.mode=local` w konfiguracji. Pomija strażnika uruchamiania wyłącznie dla doraźnego/deweloperskiego bootstrapu; nie zapisuje ani nie naprawia pliku konfiguracji.
</ParamField>
<ParamField path="--dev" type="boolean">
  Utwórz konfigurację deweloperską i workspace, jeśli ich brakuje (pomija BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Zresetuj konfigurację deweloperską, poświadczenia, sesje i workspace (wymaga `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Zabij istniejącego nasłuchiwacza na wybranym porcie przed uruchomieniem.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Szczegółowe logi.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Pokazuj w konsoli tylko logi backendu CLI (i włącz stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Styl logów WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias dla `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Loguj surowe zdarzenia strumienia modelu do jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ścieżka surowego strumienia jsonl.
</ParamField>

## Restartowanie Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` prosi działający Gateway o wstępne sprawdzenie aktywnej pracy OpenClaw przed restartem. Jeśli aktywne są operacje w kolejce, dostarczanie odpowiedzi, uruchomienia osadzone lub uruchomienia zadań, Gateway zgłasza blokady, scala zduplikowane żądania bezpiecznego restartu i restartuje się, gdy aktywna praca zostanie opróżniona. Zwykłe `restart` zachowuje dotychczasowe działanie menedżera usług dla zgodności. Używaj `--force` tylko wtedy, gdy wyraźnie chcesz ścieżkę natychmiastowego nadpisania.

`openclaw gateway restart --safe --skip-deferral` uruchamia ten sam skoordynowany restart świadomy OpenClaw co `--safe`, ale pomija bramkę odroczenia aktywnej pracy, więc Gateway emituje restart natychmiast nawet wtedy, gdy zgłoszono blokady. Używaj tego jako awaryjnego wyjścia operatora, gdy odroczenie zostało zablokowane przez zacięte uruchomienie zadania, a samo `--safe` czekałoby bez końca. `--skip-deferral` wymaga `--safe`.

<Warning>
Wbudowane `--password` może zostać ujawnione w lokalnych listach procesów. Preferuj `--password-file`, zmienne środowiskowe lub `gateway.auth.password` oparte na SecretRef.
</Warning>

### Profilowanie uruchamiania

- Ustaw `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, aby logować czasy faz podczas uruchamiania Gateway, w tym opóźnienie `eventLoopMax` dla każdej fazy oraz czasy tabel wyszukiwania Plugin dla indeksu zainstalowanych elementów, rejestru manifestów, planowania uruchomienia i pracy mapy właścicieli.
- Ustaw `OPENCLAW_DIAGNOSTICS=timeline` z `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, aby zapisać best-effort oś czasu diagnostyki uruchamiania JSONL dla zewnętrznych harnessów QA. Możesz też włączyć flagę przez `diagnostics.flags: ["timeline"]` w konfiguracji; ścieżka nadal jest dostarczana przez środowisko. Dodaj `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, aby uwzględnić próbki pętli zdarzeń.
- Uruchom `pnpm test:startup:gateway -- --runs 5 --warmup 1`, aby wykonać benchmark uruchamiania Gateway. Benchmark rejestruje pierwsze wyjście procesu, `/healthz`, `/readyz`, czasy trace uruchamiania, opóźnienie pętli zdarzeń oraz szczegóły czasów tabel wyszukiwania Plugin.

## Odpytywanie działającego Gateway

Wszystkie polecenia zapytań używają RPC WebSocket.

<Tabs>
  <Tab title="Tryby wyjścia">
    - Domyślnie: czytelne dla człowieka (kolorowane w TTY).
    - `--json`: JSON czytelny maszynowo (bez stylowania/spinnera).
    - `--no-color` (lub `NO_COLOR=1`): wyłącz ANSI, zachowując układ czytelny dla człowieka.

  </Tab>
  <Tab title="Opcje współdzielone">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: hasło Gateway.
    - `--timeout <ms>`: timeout/budżet (różni się zależnie od polecenia).
    - `--expect-final`: czekaj na odpowiedź „final” (wywołania agenta).

  </Tab>
</Tabs>

<Note>
Gdy ustawisz `--url`, CLI nie wraca do poświadczeń z konfiguracji ani środowiska. Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` jest sondą żywotności: zwraca odpowiedź, gdy serwer może odpowiadać HTTP. Endpoint HTTP `/readyz` jest bardziej rygorystyczny i pozostaje czerwony, dopóki startupowe sidecary Plugin, kanały lub skonfigurowane hooki nadal się stabilizują. Lokalne lub uwierzytelnione szczegółowe odpowiedzi gotowości zawierają blok diagnostyczny `eventLoop` z opóźnieniem pętli zdarzeń, wykorzystaniem pętli zdarzeń, proporcją rdzeni CPU i flagą `degraded`.

### `gateway usage-cost`

Pobierz podsumowania kosztów użycia z logów sesji.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Liczba dni do uwzględnienia.
</ParamField>

### `gateway stability`

Pobierz ostatni rejestrator stabilności diagnostycznej z działającego Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maksymalna liczba ostatnich zdarzeń do uwzględnienia (maks. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtruj według typu zdarzenia diagnostycznego, takiego jak `payload.large` lub `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Uwzględnij tylko zdarzenia po numerze sekwencji diagnostycznej.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Odczytaj utrwalony pakiet stabilności zamiast wywoływać działający Gateway. Użyj `--bundle latest` (lub po prostu `--bundle`) dla najnowszego pakietu w katalogu stanu albo przekaż bezpośrednio ścieżkę JSON pakietu.
</ParamField>
<ParamField path="--export" type="boolean">
  Zapisz udostępnialny zip diagnostyki wsparcia zamiast wypisywać szczegóły stabilności.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ścieżka wyjściowa dla `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Prywatność i zachowanie pakietu">
    - Rekordy przechowują metadane operacyjne: nazwy zdarzeń, liczniki, rozmiary w bajtach, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/Plugin oraz zredagowane podsumowania sesji. Nie przechowują tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań lub odpowiedzi, tokenów, ciasteczek, wartości sekretów, nazw hostów ani surowych identyfikatorów sesji. Ustaw `diagnostics.enabled: false`, aby całkowicie wyłączyć rejestrator.
    - Przy krytycznych wyjściach Gateway, timeoutach wyłączania i błędach uruchomienia po restarcie OpenClaw zapisuje tę samą migawkę diagnostyczną do `~/.openclaw/logs/stability/openclaw-stability-*.json`, gdy rejestrator ma zdarzenia. Sprawdź najnowszy pakiet za pomocą `openclaw gateway stability --bundle latest`; `--limit`, `--type` i `--since-seq` mają także zastosowanie do wyjścia pakietu.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Zapisz lokalny zip diagnostyki przeznaczony do dołączania do zgłoszeń błędów. Model prywatności i zawartość pakietu opisuje [Eksport diagnostyki](/pl/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ścieżka wyjściowa zip. Domyślnie jest to eksport wsparcia w katalogu stanu.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maksymalna liczba oczyszczonych linii logów do uwzględnienia.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maksymalna liczba bajtów logów do sprawdzenia.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway dla migawki stanu.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway dla migawki stanu.
</ParamField>
<ParamField path="--password <password>" type="string">
  Hasło Gateway dla migawki stanu.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout migawki statusu/zdrowia.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Pomiń wyszukiwanie utrwalonego pakietu stabilności.
</ParamField>
<ParamField path="--json" type="boolean">
  Wypisz zapisaną ścieżkę, rozmiar i manifest jako JSON.
</ParamField>

Eksport zawiera manifest, podsumowanie Markdown, kształt konfiguracji, oczyszczone szczegóły konfiguracji, oczyszczone podsumowania logów, oczyszczone migawki statusu/zdrowia Gateway oraz najnowszy pakiet stabilności, jeśli istnieje.

Jest przeznaczony do udostępniania. Zachowuje szczegóły operacyjne pomagające w debugowaniu, takie jak bezpieczne pola logów OpenClaw, nazwy podsystemów, kody statusu, czasy trwania, skonfigurowane tryby, porty, identyfikatory Plugin, identyfikatory providerów, niebędące sekretami ustawienia funkcji oraz zredagowane operacyjne komunikaty logów. Pomija lub redaguje tekst czatu, treści webhooków, wyniki narzędzi, poświadczenia, ciasteczka, identyfikatory kont/wiadomości, tekst promptów/instrukcji, nazwy hostów i wartości sekretów. Gdy komunikat w stylu LogTape wygląda jak tekst payloadu użytkownika/czatu/narzędzia, eksport zachowuje tylko informację, że komunikat został pominięty, oraz jego liczbę bajtów.

### `gateway status`

`gateway status` pokazuje usługę Gateway (launchd/systemd/schtasks) oraz opcjonalną sondę łączności/możliwości uwierzytelniania.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Dodaj jawny cel sondowania. Skonfigurowany zdalny cel + localhost nadal są sondowane.
</ParamField>
<ParamField path="--token <token>" type="string">
  Uwierzytelnianie tokenem dla sondowania.
</ParamField>
<ParamField path="--password <password>" type="string">
  Uwierzytelnianie hasłem dla sondowania.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Limit czasu sondowania.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Pomiń sondowanie łączności (widok tylko usługi).
</ParamField>
<ParamField path="--deep" type="boolean">
  Skanuj także usługi na poziomie systemu.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Ulepsz domyślne sondowanie łączności do sondowania odczytu i zakończ z kodem niezerowym, gdy to sondowanie odczytu się nie powiedzie. Nie można łączyć z `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantyka statusu">
    - `gateway status` pozostaje dostępne do diagnostyki nawet wtedy, gdy lokalna konfiguracja CLI jest nieobecna lub nieprawidłowa.
    - Domyślne `gateway status` potwierdza stan usługi, połączenie WebSocket i możliwość uwierzytelniania widoczną w momencie uzgadniania. Nie potwierdza operacji odczytu/zapisu/administracyjnych.
    - Sondowania diagnostyczne nie modyfikują uwierzytelniania urządzenia przy pierwszym użyciu: używają ponownie istniejącego buforowanego tokenu urządzenia, jeśli istnieje, ale nie tworzą nowej tożsamości urządzenia CLI ani rekordu parowania urządzenia tylko do odczytu wyłącznie w celu sprawdzenia statusu.
    - `gateway status` rozwiązuje skonfigurowane auth SecretRefs na potrzeby uwierzytelniania sondowania, gdy to możliwe.
    - Jeśli wymagany auth SecretRef nie zostanie rozwiązany w tej ścieżce polecenia, `gateway status --json` zgłasza `rpc.authWarning`, gdy łączność/uwierzytelnianie sondowania zawiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
    - Jeśli sondowanie się powiedzie, ostrzeżenia o nierozwiązanych auth-ref są ukrywane, aby uniknąć fałszywych alarmów.
    - Używaj `--require-rpc` w skryptach i automatyzacji, gdy nasłuchująca usługa nie wystarcza i potrzebujesz także sprawnych wywołań RPC z zakresem odczytu.
    - `--deep` dodaje best-effort skanowanie dodatkowych instalacji launchd/systemd/schtasks. Gdy wykrytych zostanie wiele usług podobnych do Gateway, wyjście dla człowieka drukuje wskazówki czyszczenia i ostrzega, że większość konfiguracji powinna uruchamiać jeden Gateway na maszynę.
    - `--deep` zgłasza także niedawne przekazanie restartu nadzorcy Gateway, gdy proces usługi zakończył się poprawnie na potrzeby restartu przez zewnętrznego nadzorcę.
    - `--deep` uruchamia walidację konfiguracji w trybie świadomym Plugin (`pluginValidation: "full"`) i pokazuje ostrzeżenia manifestu skonfigurowanego Plugin (na przykład brak metadanych konfiguracji kanału), aby kontrole dymne instalacji i aktualizacji je wykrywały. Domyślne `gateway status` zachowuje szybką ścieżkę tylko do odczytu, która pomija walidację Plugin.
    - Wyjście dla człowieka zawiera rozwiązaną ścieżkę dziennika plikowego oraz migawkę ścieżek konfiguracji/ważności CLI względem usługi, aby pomóc diagnozować rozjazd profilu lub katalogu stanu.

  </Accordion>
  <Accordion title="Kontrole dryfu uwierzytelniania Linux systemd">
    - W instalacjach Linux systemd kontrole dryfu uwierzytelniania usługi odczytują wartości `Environment=` i `EnvironmentFile=` z jednostki (w tym `%h`, ścieżki w cudzysłowach, wiele plików i opcjonalne pliki `-`).
    - Kontrole dryfu rozwiązują `gateway.auth.token` SecretRefs przy użyciu scalonego środowiska wykonawczego (najpierw środowisko polecenia usługi, potem awaryjnie środowisko procesu).
    - Jeśli uwierzytelnianie tokenem nie jest efektywnie aktywne (jawny `gateway.auth.mode` równy `password`/`none`/`trusted-proxy` albo brak ustawionego trybu, gdy hasło może wygrać i żaden kandydat tokenu nie może wygrać), kontrole dryfu tokenu pomijają rozwiązywanie tokenu konfiguracji.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` to polecenie „debuguj wszystko”. Zawsze sonduje:

- Twój skonfigurowany zdalny Gateway (jeśli ustawiony), oraz
- localhost (loopback) **nawet jeśli zdalny cel jest skonfigurowany**.

Jeśli przekażesz `--url`, ten jawny cel zostanie dodany przed oboma. Wyjście dla człowieka etykietuje cele jako:

- `URL (jawny)`
- `Zdalny (skonfigurowany)` lub `Zdalny (skonfigurowany, nieaktywny)`
- `Local loopback`

<Note>
Jeśli osiągalnych jest wiele Gateway, drukuje je wszystkie. Wiele Gateway jest obsługiwanych, gdy używasz izolowanych profili/portów (np. bota ratunkowego), ale większość instalacji nadal uruchamia jeden Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretacja">
    - `Reachable: yes` oznacza, że co najmniej jeden cel zaakceptował połączenie WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` zgłasza, co sondowanie mogło potwierdzić w zakresie uwierzytelniania. Jest to oddzielne od osiągalności.
    - `Read probe: ok` oznacza, że wywołania RPC szczegółów z zakresem odczytu (`health`/`status`/`system-presence`/`config.get`) także się powiodły.
    - `Read probe: limited - missing scope: operator.read` oznacza, że połączenie się powiodło, ale RPC z zakresem odczytu jest ograniczone. Jest to zgłaszane jako **zdegradowana** osiągalność, a nie pełna awaria.
    - `Read probe: failed` po `Connect: ok` oznacza, że Gateway zaakceptował połączenie WebSocket, ale kolejne diagnostyki odczytu przekroczyły limit czasu lub się nie powiodły. To także **zdegradowana** osiągalność, a nie nieosiągalny Gateway.
    - Podobnie jak `gateway status`, sondowanie używa ponownie istniejącego buforowanego uwierzytelniania urządzenia, ale nie tworzy pierwszej tożsamości urządzenia ani stanu parowania.
    - Kod wyjścia jest niezerowy tylko wtedy, gdy żaden sondowany cel nie jest osiągalny.

  </Accordion>
  <Accordion title="Wyjście JSON">
    Poziom główny:

    - `ok`: co najmniej jeden cel jest osiągalny.
    - `degraded`: co najmniej jeden cel zaakceptował połączenie, ale nie ukończył pełnej diagnostyki RPC szczegółów.
    - `capability`: najlepsza możliwość zaobserwowana wśród osiągalnych celów (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` lub `unknown`).
    - `primaryTargetId`: najlepszy cel traktowany jako aktywny zwycięzca w tej kolejności: jawny URL, tunel SSH, skonfigurowany zdalny cel, a potem local loopback.
    - `warnings[]`: rekordy ostrzeżeń best-effort z `code`, `message` i opcjonalnym `targetIds`.
    - `network`: podpowiedzi URL local loopback/tailnet wyprowadzone z bieżącej konfiguracji i sieci hosta.
    - `discovery.timeoutMs` i `discovery.count`: rzeczywisty budżet/wynik wykrywania użyty dla tego przebiegu sondowania.

    Dla każdego celu (`targets[].connect`):

    - `ok`: osiągalność po połączeniu + klasyfikacja degradacji.
    - `rpcOk`: pełny sukces RPC szczegółów.
    - `scopeLimited`: RPC szczegółów nie powiodło się z powodu brakującego zakresu operatora.

    Dla każdego celu (`targets[].auth`):

    - `role`: rola uwierzytelniania zgłoszona w `hello-ok`, gdy dostępna.
    - `scopes`: przyznane zakresy zgłoszone w `hello-ok`, gdy dostępne.
    - `capability`: ujawniona klasyfikacja możliwości uwierzytelniania dla tego celu.

  </Accordion>
  <Accordion title="Typowe kody ostrzeżeń">
    - `ssh_tunnel_failed`: konfiguracja tunelu SSH nie powiodła się; polecenie wróciło do bezpośrednich sondowań.
    - `multiple_gateways`: osiągalny był więcej niż jeden cel; to nietypowe, chyba że celowo uruchamiasz izolowane profile, takie jak bot ratunkowy.
    - `auth_secretref_unresolved`: skonfigurowany auth SecretRef nie mógł zostać rozwiązany dla celu, który się nie powiódł.
    - `probe_scope_limited`: połączenie WebSocket się powiodło, ale sondowanie odczytu było ograniczone przez brak `operator.read`.

  </Accordion>
</AccordionGroup>

#### Zdalnie przez SSH (parytet z aplikacją na Maca)

Tryb „Zdalnie przez SSH” aplikacji macOS używa lokalnego przekierowania portu, dzięki czemu zdalny Gateway (który może być powiązany tylko z loopback) staje się osiągalny pod `ws://127.0.0.1:<port>`.

Odpowiednik CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` lub `user@host:port` (port domyślnie `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Plik tożsamości.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Wybierz pierwszy wykryty host Gateway jako cel SSH z rozwiązanego punktu końcowego wykrywania (`local.` plus skonfigurowana domena rozległa, jeśli istnieje). Podpowiedzi tylko TXT są ignorowane.
</ParamField>

Konfiguracja (opcjonalna, używana jako wartości domyślne):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Niskopoziomowy pomocnik RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Łańcuch obiektu JSON dla parametrów.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Hasło Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Budżet limitu czasu.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Głównie dla RPC w stylu agentów, które strumieniują zdarzenia pośrednie przed końcowym ładunkiem.
</ParamField>
<ParamField path="--json" type="boolean">
  Wyjście JSON czytelne maszynowo.
</ParamField>

<Note>
`--params` musi być prawidłowym JSON.
</Note>

## Zarządzanie usługą Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Instalacja z wrapperem

Użyj `--wrapper`, gdy zarządzana usługa musi wystartować przez inny plik wykonywalny, na przykład
shim menedżera sekretów lub pomocnik uruchamiania jako inny użytkownik. Wrapper otrzymuje normalne argumenty Gateway i jest
odpowiedzialny za ostateczne wykonanie `openclaw` albo Node z tymi argumentami.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

Możesz też ustawić wrapper przez środowisko. `gateway install` sprawdza, czy ścieżka jest
plikiem wykonywalnym, zapisuje wrapper do `ProgramArguments` usługi i utrwala
`OPENCLAW_WRAPPER` w środowisku usługi na potrzeby późniejszych wymuszonych reinstalacji, aktualizacji i napraw doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Aby usunąć utrwalony wrapper, wyczyść `OPENCLAW_WRAPPER` podczas ponownej instalacji:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opcje poleceń">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Zachowanie cyklu życia">
    - Użyj `gateway restart`, aby ponownie uruchomić usługę zarządzaną. Nie łącz `gateway stop` i `gateway start` jako zamiennika ponownego uruchomienia.
    - W systemie macOS `gateway stop` domyślnie używa `launchctl bootout`, co usuwa LaunchAgent z bieżącej sesji rozruchowej bez trwałego wyłączenia — automatyczne odzyskiwanie KeepAlive pozostaje aktywne dla przyszłych awarii, a `gateway start` ponownie włącza usługę w czysty sposób bez ręcznego `launchctl enable`. Przekaż `--disable`, aby trwale wyciszyć KeepAlive i RunAtLoad, tak aby gateway nie uruchamiał się ponownie aż do następnego jawnego `gateway start`; użyj tego, gdy ręczne zatrzymanie ma przetrwać ponowne uruchomienia systemu.
    - `gateway restart --safe` prosi działający Gateway o wstępne sprawdzenie aktywnej pracy OpenClaw i odroczenie ponownego uruchomienia do czasu opróżnienia dostarczania odpowiedzi, osadzonych uruchomień i uruchomień zadań. `--safe` nie można łączyć z `--force` ani `--wait`.
    - `gateway restart --wait 30s` zastępuje skonfigurowany budżet opróżniania przed ponownym uruchomieniem dla tego ponownego uruchomienia. Same liczby oznaczają milisekundy; akceptowane są jednostki takie jak `s`, `m` i `h`. `--wait 0` czeka bezterminowo.
    - `gateway restart --safe --skip-deferral` wykonuje bezpieczne ponowne uruchomienie świadome OpenClaw, ale pomija bramkę odroczenia, więc Gateway emituje ponowne uruchomienie natychmiast nawet wtedy, gdy zgłoszono blokady. Awaryjne wyjście operatora dla odroczeń zablokowanych uruchomień zadań; wymaga `--safe`.
    - `gateway restart --force` pomija opróżnianie aktywnej pracy i uruchamia ponownie natychmiast. Użyj tego, gdy operator już sprawdził wymienione blokady zadań i chce przywrócić gateway od razu.
    - Polecenia cyklu życia akceptują `--json` do skryptów.

  </Accordion>
  <Accordion title="Auth i SecretRefs podczas instalacji">
    - Gdy token auth wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, `gateway install` sprawdza, czy SecretRef da się rozwiązać, ale nie utrwala rozwiązanego tokenu w metadanych środowiska usługi.
    - Jeśli token auth wymaga tokenu, a skonfigurowany token SecretRef jest nierozwiązany, instalacja kończy się niepowodzeniem w trybie zamkniętym zamiast utrwalać zastępczy tekst jawny.
    - Dla password auth w `gateway run` preferuj `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` lub `gateway.auth.password` oparte na SecretRef zamiast wbudowanego `--password`.
    - W trybie auth wnioskowanym wyłącznie powłokowe `OPENCLAW_GATEWAY_PASSWORD` nie rozluźnia wymagań instalacyjnych dotyczących tokenu; użyj trwałej konfiguracji (`gateway.auth.password` lub konfiguracji `env`) podczas instalowania usługi zarządzanej.
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja jest blokowana do czasu jawnego ustawienia trybu.

  </Accordion>
</AccordionGroup>

## Wykrywanie Gateway (Bonjour)

`gateway discover` skanuje sygnały nawigacyjne Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): wybierz domenę (przykład: `openclaw.internal.`) i skonfiguruj split DNS + serwer DNS; zobacz [Bonjour](/pl/gateway/bonjour).

Tylko Gateway z włączonym wykrywaniem Bonjour (domyślnie) rozgłaszają sygnał nawigacyjny.

Rekordy wykrywania wide-area mogą zawierać te podpowiedzi TXT:

- `role` (podpowiedź roli gateway)
- `transport` (podpowiedź transportu, np. `gateway`)
- `gatewayPort` (port WebSocket, zwykle `18789`)
- `sshPort` (tylko tryb pełnego wykrywania; klienci domyślnie ustawiają cele SSH na `22`, gdy go nie ma)
- `tailnetDns` (nazwa hosta MagicDNS, gdy jest dostępna)
- `gatewayTls` / `gatewayTlsSha256` (włączony TLS + odcisk certyfikatu)
- `cliPath` (tylko tryb pełnego wykrywania)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Limit czasu dla polecenia (przeglądanie/rozwiązywanie).
</ParamField>
<ParamField path="--json" type="boolean">
  Dane wyjściowe czytelne maszynowo (wyłącza też stylowanie/spinner).
</ParamField>

Przykłady:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI skanuje `local.` oraz skonfigurowaną domenę wide-area, gdy jest włączona.
- `wsUrl` w danych wyjściowych JSON pochodzi z rozwiązanego punktu końcowego usługi, a nie z podpowiedzi wyłącznie TXT, takich jak `lanHost` czy `tailnetDns`.
- W `local.` mDNS i wide-area DNS-SD `sshPort` oraz `cliPath` są publikowane tylko wtedy, gdy `discovery.mdns.mode` ma wartość `full`.

</Note>

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
