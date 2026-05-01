---
read_when:
    - Uruchamianie Gateway z poziomu CLI (środowisko deweloperskie lub serwery)
    - Debugowanie uwierzytelniania Gateway, trybów wiązania i łączności
    - Wykrywanie Gateway za pomocą Bonjour (lokalne + szerokoobszarowe DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — uruchamiaj, odpytuj i wykrywaj bramy Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-01T09:56:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 127a6ccb4baa1ad5e5051db0bc7ef0ed30d410c4c3d13f36356483a6e03dce4c
    source_path: cli/gateway.md
    workflow: 16
---

Gateway to serwer WebSocket OpenClaw (kanały, węzły, sesje, hooki). Podkomendy na tej stronie znajdują się pod `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Wykrywanie Bonjour" href="/pl/gateway/bonjour">
    Konfiguracja lokalnego mDNS + szerokoobszarowego DNS-SD.
  </Card>
  <Card title="Omówienie wykrywania" href="/pl/gateway/discovery">
    Jak OpenClaw rozgłasza i znajduje bramy.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration">
    Klucze konfiguracji gateway najwyższego poziomu.
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
    - Domyślnie Gateway odmawia uruchomienia, jeśli w `~/.openclaw/openclaw.json` nie ustawiono `gateway.mode=local`. Użyj `--allow-unconfigured` do uruchomień ad hoc/deweloperskich.
    - Oczekuje się, że `openclaw onboard --mode local` i `openclaw setup` zapiszą `gateway.mode=local`. Jeśli plik istnieje, ale brakuje `gateway.mode`, potraktuj to jako uszkodzoną lub nadpisaną konfigurację i napraw ją, zamiast zakładać niejawnie tryb lokalny.
    - Jeśli plik istnieje i brakuje `gateway.mode`, Gateway traktuje to jako podejrzane uszkodzenie konfiguracji i odmawia „zgadywania local” za Ciebie.
    - Bindowanie poza loopback bez uwierzytelniania jest blokowane (zabezpieczenie).
    - `SIGUSR1` wyzwala restart w procesie, gdy jest autoryzowany (`commands.restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby zablokować ręczny restart, podczas gdy zastosowanie/aktualizacja narzędzia i konfiguracji gateway pozostaną dozwolone).
    - Handlery `SIGINT`/`SIGTERM` zatrzymują proces gateway, ale nie przywracają żadnego niestandardowego stanu terminala. Jeśli opakowujesz CLI za pomocą TUI lub wejścia w trybie raw, przywróć terminal przed wyjściem.

  </Accordion>
</AccordionGroup>

### Opcje

<ParamField path="--port <port>" type="number">
  Port WebSocket (domyślnie pochodzi z konfiguracji/env; zwykle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Tryb bindowania listenera.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Nadpisanie trybu uwierzytelniania.
</ParamField>
<ParamField path="--token <token>" type="string">
  Nadpisanie tokenu (ustawia także `OPENCLAW_GATEWAY_TOKEN` dla procesu).
</ParamField>
<ParamField path="--password <password>" type="string">
  Nadpisanie hasła.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Odczytaj hasło gateway z pliku.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Udostępnij Gateway przez Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Zresetuj konfigurację Tailscale serve/funnel przy zamykaniu.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Zezwól na start gateway bez `gateway.mode=local` w konfiguracji. Omija zabezpieczenie startowe wyłącznie dla bootstrapu ad hoc/deweloperskiego; nie zapisuje ani nie naprawia pliku konfiguracji.
</ParamField>
<ParamField path="--dev" type="boolean">
  Utwórz konfigurację deweloperską + workspace, jeśli ich brakuje (pomija BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Zresetuj konfigurację deweloperską + poświadczenia + sesje + workspace (wymaga `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Zabij dowolny istniejący listener na wybranym porcie przed startem.
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

<Warning>
Wbudowane `--password` może zostać ujawnione w lokalnych listach procesów. Preferuj `--password-file`, env albo `gateway.auth.password` oparte na SecretRef.
</Warning>

### Profilowanie uruchamiania

- Ustaw `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, aby logować czasy faz podczas startu Gateway, w tym opóźnienie `eventLoopMax` dla każdej fazy oraz czasy tabel wyszukiwania pluginów dla installed-index, rejestru manifestów, planowania startu i pracy owner-map.
- Ustaw `OPENCLAW_DIAGNOSTICS=timeline` z `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, aby zapisać best-effort oś czasu diagnostyki startu JSONL dla zewnętrznych harnessów QA. Możesz też włączyć flagę przez `diagnostics.flags: ["timeline"]` w konfiguracji; ścieżka nadal jest dostarczana przez env. Dodaj `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, aby uwzględnić próbki event-loop.
- Uruchom `pnpm test:startup:gateway -- --runs 5 --warmup 1`, aby wykonać benchmark startu Gateway. Benchmark rejestruje pierwsze wyjście procesu, `/healthz`, `/readyz`, czasy śladu startu, opóźnienie event-loop oraz szczegóły czasów tabel wyszukiwania pluginów.

## Odpytywanie działającego Gateway

Wszystkie komendy zapytań używają RPC przez WebSocket.

<Tabs>
  <Tab title="Tryby wyjścia">
    - Domyślnie: czytelne dla człowieka (kolorowe w TTY).
    - `--json`: JSON czytelny maszynowo (bez stylowania/spinnera).
    - `--no-color` (lub `NO_COLOR=1`): wyłącza ANSI, zachowując układ czytelny dla człowieka.

  </Tab>
  <Tab title="Opcje wspólne">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: hasło Gateway.
    - `--timeout <ms>`: timeout/budżet (różni się w zależności od komendy).
    - `--expect-final`: czekaj na odpowiedź „final” (wywołania agenta).

  </Tab>
</Tabs>

<Note>
Gdy ustawisz `--url`, CLI nie wraca do konfiguracji ani poświadczeń środowiskowych. Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` jest sondą żywotności: zwraca odpowiedź, gdy serwer może odpowiadać przez HTTP. Endpoint HTTP `/readyz` jest bardziej rygorystyczny i pozostaje czerwony, dopóki zależności runtime pluginów startowych, sidecary, kanały lub skonfigurowane hooki nadal się stabilizują. Lokalne lub uwierzytelnione szczegółowe odpowiedzi gotowości zawierają blok diagnostyczny `eventLoop` z opóźnieniem event-loop, wykorzystaniem event-loop, współczynnikiem rdzeni CPU i flagą `degraded`.

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
    - Rekordy zachowują metadane operacyjne: nazwy zdarzeń, liczby, rozmiary bajtów, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów i zredagowane podsumowania sesji. Nie zachowują tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, cookies, wartości sekretów, nazw hostów ani surowych identyfikatorów sesji. Ustaw `diagnostics.enabled: false`, aby całkowicie wyłączyć rejestrator.
    - Przy krytycznych wyjściach Gateway, timeoutach zamykania i niepowodzeniach startu po restarcie OpenClaw zapisuje ten sam snapshot diagnostyczny do `~/.openclaw/logs/stability/openclaw-stability-*.json`, gdy rejestrator ma zdarzenia. Sprawdź najnowszy pakiet przez `openclaw gateway stability --bundle latest`; `--limit`, `--type` i `--since-seq` mają zastosowanie także do wyjścia pakietu.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Zapisz lokalny zip diagnostyki zaprojektowany do dołączania do zgłoszeń błędów. Model prywatności i zawartość pakietu opisuje [Eksport diagnostyki](/pl/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ścieżka wyjściowa zip. Domyślnie eksport wsparcia w katalogu stanu.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maksymalna liczba oczyszczonych linii logów do uwzględnienia.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maksymalna liczba bajtów logów do sprawdzenia.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway dla snapshotu zdrowia.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway dla snapshotu zdrowia.
</ParamField>
<ParamField path="--password <password>" type="string">
  Hasło Gateway dla snapshotu zdrowia.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout snapshotu statusu/zdrowia.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Pomiń wyszukiwanie utrwalonego pakietu stabilności.
</ParamField>
<ParamField path="--json" type="boolean">
  Wypisz zapisaną ścieżkę, rozmiar i manifest jako JSON.
</ParamField>

Eksport zawiera manifest, podsumowanie Markdown, kształt konfiguracji, oczyszczone szczegóły konfiguracji, oczyszczone podsumowania logów, oczyszczone snapshoty statusu/zdrowia Gateway oraz najnowszy pakiet stabilności, jeśli istnieje.

Jest przeznaczony do udostępniania. Zachowuje szczegóły operacyjne pomagające w debugowaniu, takie jak bezpieczne pola logów OpenClaw, nazwy podsystemów, kody statusu, czasy trwania, skonfigurowane tryby, porty, identyfikatory pluginów, identyfikatory dostawców, niesekretne ustawienia funkcji i zredagowane operacyjne komunikaty logów. Pomija lub redaguje tekst czatu, treści webhooków, wyniki narzędzi, poświadczenia, cookies, identyfikatory kont/wiadomości, tekst promptów/instrukcji, nazwy hostów i wartości sekretów. Gdy komunikat w stylu LogTape wygląda jak tekst payloadu użytkownika/czatu/narzędzia, eksport zachowuje tylko informację, że komunikat został pominięty, oraz jego liczbę bajtów.

### `gateway status`

`gateway status` pokazuje usługę Gateway (launchd/systemd/schtasks) oraz opcjonalną sondę łączności/możliwości uwierzytelniania.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Dodaj jawny cel sondy. Skonfigurowany zdalny + localhost nadal są sondowane.
</ParamField>
<ParamField path="--token <token>" type="string">
  Uwierzytelnianie tokenem dla sondy.
</ParamField>
<ParamField path="--password <password>" type="string">
  Uwierzytelnianie hasłem dla sondy.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Timeout sondy.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Pomiń sondę łączności (widok tylko usługi).
</ParamField>
<ParamField path="--deep" type="boolean">
  Skanuj także usługi na poziomie systemu.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Ulepsz domyślną sondę łączności do sondy odczytu i zakończ z kodem niezerowym, gdy ta sonda odczytu się nie powiedzie. Nie można łączyć z `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantyka statusu">
    - `gateway status` pozostaje dostępne do diagnostyki nawet wtedy, gdy lokalna konfiguracja CLI jest brakująca lub nieprawidłowa.
    - Domyślne `gateway status` potwierdza stan usługi, połączenie WebSocket oraz możliwość uwierzytelniania widoczną w czasie uzgadniania połączenia. Nie potwierdza operacji odczytu/zapisu/administracyjnych.
    - Próby diagnostyczne nie modyfikują stanu przy pierwszym uwierzytelnieniu urządzenia: ponownie używają istniejącego buforowanego tokenu urządzenia, jeśli taki istnieje, ale nie tworzą nowej tożsamości urządzenia CLI ani rekordu parowania urządzenia tylko do odczytu wyłącznie po to, aby sprawdzić status.
    - `gateway status` rozwiązuje skonfigurowane SecretRefs uwierzytelniania na potrzeby uwierzytelnienia próby, gdy jest to możliwe.
    - Jeśli wymagany SecretRef uwierzytelniania nie zostanie rozwiązany w tej ścieżce polecenia, `gateway status --json` zgłasza `rpc.authWarning`, gdy łączność/uwierzytelnienie próby zawiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
    - Jeśli próba się powiedzie, ostrzeżenia o nierozwiązanych odwołaniach uwierzytelniania są pomijane, aby uniknąć fałszywych alarmów.
    - Używaj `--require-rpc` w skryptach i automatyzacji, gdy nasłuchująca usługa nie wystarcza i potrzebujesz także sprawnych wywołań RPC z zakresem odczytu.
    - `--deep` dodaje najlepszą możliwą próbę skanowania dodatkowych instalacji launchd/systemd/schtasks. Gdy wykryto wiele usług podobnych do Gateway, wynik dla człowieka wypisuje wskazówki czyszczenia i ostrzega, że większość konfiguracji powinna uruchamiać jeden gateway na maszynę.
    - Wynik dla człowieka zawiera rozwiązaną ścieżkę pliku dziennika oraz migawkę ścieżek/ważności konfiguracji CLI względem usługi, aby pomóc diagnozować rozjazd profilu lub katalogu stanu.

  </Accordion>
  <Accordion title="Kontrole rozjazdu uwierzytelniania w Linux systemd">
    - W instalacjach Linux systemd kontrole rozjazdu uwierzytelniania usługi odczytują zarówno wartości `Environment=`, jak i `EnvironmentFile=` z jednostki (w tym `%h`, ścieżki w cudzysłowach, wiele plików oraz opcjonalne pliki `-`).
    - Kontrole rozjazdu rozwiązują SecretRefs `gateway.auth.token` przy użyciu scalonego środowiska runtime (najpierw środowisko polecenia usługi, następnie awaryjnie środowisko procesu).
    - Jeśli uwierzytelnianie tokenem nie jest efektywnie aktywne (jawny `gateway.auth.mode` o wartości `password`/`none`/`trusted-proxy` albo brak ustawionego trybu, gdy hasło może wygrać i żaden kandydat na token nie może wygrać), kontrole rozjazdu tokenu pomijają rozwiązywanie tokenu konfiguracji.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` to polecenie „debugowania wszystkiego”. Zawsze sprawdza:

- skonfigurowany zdalny gateway (jeśli ustawiony), oraz
- localhost (local loopback) **nawet jeśli zdalny jest skonfigurowany**.

Jeśli przekażesz `--url`, ten jawny cel zostanie dodany przed oboma pozostałymi. Wynik dla człowieka oznacza cele jako:

- `URL (explicit)`
- `Remote (configured)` lub `Remote (configured, inactive)`
- `Local loopback`

<Note>
Jeśli osiągalnych jest wiele gateways, wypisuje je wszystkie. Wiele gateways jest obsługiwanych, gdy używasz izolowanych profili/portów (np. bota ratunkowego), ale większość instalacji nadal uruchamia pojedynczy gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretacja">
    - `Reachable: yes` oznacza, że co najmniej jeden cel zaakceptował połączenie WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` zgłasza, co próba zdołała potwierdzić w zakresie uwierzytelniania. Jest to oddzielne od osiągalności.
    - `Read probe: ok` oznacza, że wywołania RPC szczegółów z zakresem odczytu (`health`/`status`/`system-presence`/`config.get`) również się powiodły.
    - `Read probe: limited - missing scope: operator.read` oznacza, że połączenie się powiodło, ale RPC z zakresem odczytu jest ograniczone. Jest to zgłaszane jako **zdegradowana** osiągalność, nie pełna awaria.
    - `Read probe: failed` po `Connect: ok` oznacza, że Gateway zaakceptował połączenie WebSocket, ale kolejne diagnostyki odczytu przekroczyły limit czasu lub zawiodły. To również jest **zdegradowana** osiągalność, nie nieosiągalny Gateway.
    - Podobnie jak `gateway status`, probe ponownie używa istniejącego buforowanego uwierzytelniania urządzenia, ale nie tworzy pierwszej tożsamości urządzenia ani stanu parowania.
    - Kod wyjścia jest niezerowy tylko wtedy, gdy żaden sprawdzany cel nie jest osiągalny.

  </Accordion>
  <Accordion title="Wynik JSON">
    Najwyższy poziom:

    - `ok`: co najmniej jeden cel jest osiągalny.
    - `degraded`: co najmniej jeden cel zaakceptował połączenie, ale nie ukończył pełnej diagnostyki szczegółowej RPC.
    - `capability`: najlepsza możliwość widziana wśród osiągalnych celów (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` lub `unknown`).
    - `primaryTargetId`: najlepszy cel do potraktowania jako aktywnego zwycięzcę w tej kolejności: jawny URL, tunel SSH, skonfigurowany zdalny, następnie local loopback.
    - `warnings[]`: rekordy ostrzeżeń typu best-effort z `code`, `message` i opcjonalnymi `targetIds`.
    - `network`: wskazówki URL local loopback/tailnet pochodzące z bieżącej konfiguracji i sieci hosta.
    - `discovery.timeoutMs` i `discovery.count`: rzeczywisty budżet wykrywania/liczba wyników użyte dla tego przebiegu próby.

    Dla celu (`targets[].connect`):

    - `ok`: osiągalność po połączeniu + klasyfikacja zdegradowania.
    - `rpcOk`: pełny sukces szczegółowego RPC.
    - `scopeLimited`: szczegółowe RPC nie powiodło się z powodu brakującego zakresu operatora.

    Dla celu (`targets[].auth`):

    - `role`: rola uwierzytelniania zgłoszona w `hello-ok`, gdy dostępna.
    - `scopes`: przyznane zakresy zgłoszone w `hello-ok`, gdy dostępne.
    - `capability`: ujawniona klasyfikacja możliwości uwierzytelniania dla tego celu.

  </Accordion>
  <Accordion title="Typowe kody ostrzeżeń">
    - `ssh_tunnel_failed`: konfiguracja tunelu SSH nie powiodła się; polecenie wróciło do bezpośrednich prób.
    - `multiple_gateways`: osiągalny był więcej niż jeden cel; jest to nietypowe, chyba że celowo uruchamiasz izolowane profile, takie jak bot ratunkowy.
    - `auth_secretref_unresolved`: skonfigurowany SecretRef uwierzytelniania nie mógł zostać rozwiązany dla celu, który zawiódł.
    - `probe_scope_limited`: połączenie WebSocket się powiodło, ale próba odczytu została ograniczona przez brakujące `operator.read`.

  </Accordion>
</AccordionGroup>

#### Zdalnie przez SSH (parytet aplikacji Mac)

Tryb aplikacji macOS „Remote over SSH” używa lokalnego przekierowania portu, dzięki czemu zdalny gateway (który może być przypisany tylko do loopback) staje się osiągalny pod `ws://127.0.0.1:<port>`.

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
  Wybierz pierwszy wykryty host gateway jako cel SSH z rozwiązanego punktu końcowego wykrywania (`local.` plus skonfigurowana domena rozległa, jeśli istnieje). Wskazówki tylko TXT są ignorowane.
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
  Ciąg obiektu JSON dla parametrów.
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
  Wynik JSON czytelny maszynowo.
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

Użyj `--wrapper`, gdy zarządzana usługa musi wystartować przez inny plik wykonywalny, na przykład shim menedżera sekretów albo pomocnik uruchamiania jako inny użytkownik. Wrapper otrzymuje normalne argumenty Gateway i odpowiada za ostateczne wykonanie `openclaw` albo Node z tymi argumentami.

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

Możesz też ustawić wrapper przez środowisko. `gateway install` sprawdza, czy ścieżka jest plikiem wykonywalnym, zapisuje wrapper w `ProgramArguments` usługi oraz utrwala `OPENCLAW_WRAPPER` w środowisku usługi na potrzeby późniejszych wymuszonych reinstalacji, aktualizacji i napraw doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Aby usunąć utrwalony wrapper, wyczyść `OPENCLAW_WRAPPER` podczas reinstalacji:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opcje poleceń">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Zachowanie cyklu życia">
    - Użyj `gateway restart`, aby zrestartować zarządzaną usługę. Nie łącz `gateway stop` i `gateway start` jako substytutu restartu; w macOS `gateway stop` celowo wyłącza LaunchAgent przed jego zatrzymaniem.
    - Polecenia cyklu życia akceptują `--json` do skryptów.

  </Accordion>
  <Accordion title="Uwierzytelnianie i SecretRefs podczas instalacji">
    - Gdy uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, `gateway install` sprawdza, czy SecretRef da się rozwiązać, ale nie utrwala rozwiązanego tokenu w metadanych środowiska usługi.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, instalacja kończy się bezpieczną odmową zamiast utrwalać awaryjny tekst jawny.
    - Dla uwierzytelniania hasłem w `gateway run` preferuj `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` albo `gateway.auth.password` wspierane przez SecretRef zamiast wbudowanego `--password`.
    - W wywnioskowanym trybie uwierzytelniania wyłącznie powłokowe `OPENCLAW_GATEWAY_PASSWORD` nie rozluźnia wymagań tokenu instalacji; użyj trwałej konfiguracji (`gateway.auth.password` lub `env` konfiguracji) podczas instalowania zarządzanej usługi.
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja jest blokowana do czasu jawnego ustawienia trybu.

  </Accordion>
</AccordionGroup>

## Wykrywanie gateways (Bonjour)

`gateway discover` skanuje beacony Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): wybierz domenę (przykład: `openclaw.internal.`) i skonfiguruj split DNS + serwer DNS; zobacz [Bonjour](/pl/gateway/bonjour).

Tylko gateways z włączonym wykrywaniem Bonjour (domyślnie) reklamują beacon.

Rekordy wykrywania Wide-Area zawierają (TXT):

- `role` (wskazówka roli gateway)
- `transport` (wskazówka transportu, np. `gateway`)
- `gatewayPort` (port WebSocket, zwykle `18789`)
- `sshPort` (opcjonalny; klienci domyślnie ustawiają cele SSH na `22`, gdy go nie ma)
- `tailnetDns` (nazwa hosta MagicDNS, gdy dostępna)
- `gatewayTls` / `gatewayTlsSha256` (TLS włączony + odcisk certyfikatu)
- `cliPath` (wskazówka instalacji zdalnej zapisywana w strefie rozległej)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Limit czasu dla polecenia (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Wynik czytelny maszynowo (wyłącza też stylizację/spinner).
</ParamField>

Przykłady:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI skanuje `local.` oraz skonfigurowaną domenę sieci rozległej, gdy jest włączona.
- `wsUrl` w wyjściu JSON jest wyprowadzany z rozpoznanego punktu końcowego usługi, a nie z podpowiedzi wyłącznie TXT, takich jak `lanHost` lub `tailnetDns`.
- W mDNS `local.` wartości `sshPort` i `cliPath` są rozgłaszane tylko wtedy, gdy `discovery.mdns.mode` ma wartość `full`. DNS-SD w sieci rozległej nadal zapisuje `cliPath`; `sshPort` również tam pozostaje opcjonalne.

</Note>

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Procedura operacyjna Gateway](/pl/gateway)
