---
read_when:
    - Uruchamianie Gateway z CLI (środowisko deweloperskie lub serwery)
    - Debugowanie uwierzytelniania Gateway, trybów wiązania i łączności
    - Wykrywanie Gateway za pomocą Bonjour (lokalne + szerokoobszarowe DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — uruchamiaj, odpytuj i wykrywaj instancje Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-02T22:17:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7f948a8f0ee6e065afa02f354e690ad5cc4f71bdb8b8674f1b0396c439ab242
    source_path: cli/gateway.md
    workflow: 16
---

Gateway to serwer WebSocket OpenClaw (kanały, węzły, sesje, hooki). Podpolecenia na tej stronie znajdują się pod `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Odnajdywanie Bonjour" href="/pl/gateway/bonjour">
    Lokalna konfiguracja mDNS + szerokoobszarowa DNS-SD.
  </Card>
  <Card title="Omówienie odnajdywania" href="/pl/gateway/discovery">
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
    - Domyślnie Gateway odmawia uruchomienia, jeśli `gateway.mode=local` nie jest ustawione w `~/.openclaw/openclaw.json`. Użyj `--allow-unconfigured` do doraźnych/deweloperskich uruchomień.
    - Oczekuje się, że `openclaw onboard --mode local` i `openclaw setup` zapiszą `gateway.mode=local`. Jeśli plik istnieje, ale brakuje `gateway.mode`, traktuj to jako uszkodzoną lub nadpisaną konfigurację i napraw ją zamiast zakładać tryb lokalny niejawnie.
    - Jeśli plik istnieje, a brakuje `gateway.mode`, Gateway traktuje to jako podejrzane uszkodzenie konfiguracji i odmawia „zgadywania local” za Ciebie.
    - Wiązanie poza loopback bez uwierzytelniania jest blokowane (bariera bezpieczeństwa).
    - `SIGUSR1` wyzwala restart w obrębie procesu, gdy jest autoryzowany (`commands.restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby zablokować ręczny restart, podczas gdy zastosowanie/aktualizacja przez narzędzie/konfigurację gatewaya pozostaną dozwolone).
    - Handlery `SIGINT`/`SIGTERM` zatrzymują proces gatewaya, ale nie przywracają żadnego niestandardowego stanu terminala. Jeśli opakowujesz CLI za pomocą TUI lub wejścia w trybie raw, przywróć terminal przed zakończeniem.

  </Accordion>
</AccordionGroup>

### Opcje

<ParamField path="--port <port>" type="number">
  Port WebSocket (wartość domyślna pochodzi z konfiguracji/środowiska; zwykle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Tryb wiązania nasłuchiwacza.
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
  Resetuj konfigurację Tailscale serve/funnel przy wyłączaniu.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Zezwól na uruchomienie gatewaya bez `gateway.mode=local` w konfiguracji. Obchodzi zabezpieczenie startowe wyłącznie na potrzeby doraźnego/deweloperskiego bootstrapu; nie zapisuje ani nie naprawia pliku konfiguracji.
</ParamField>
<ParamField path="--dev" type="boolean">
  Utwórz konfigurację deweloperską + workspace, jeśli ich brakuje (pomija BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Resetuj konfigurację deweloperską + dane uwierzytelniające + sesje + workspace (wymaga `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Zabij istniejący nasłuchiwacz na wybranym porcie przed uruchomieniem.
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
Wbudowane `--password` może zostać ujawnione w lokalnych listach procesów. Preferuj `--password-file`, zmienne środowiskowe albo `gateway.auth.password` oparte na SecretRef.
</Warning>

### Profilowanie uruchamiania

- Ustaw `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, aby logować czasy faz podczas uruchamiania Gateway, w tym opóźnienie `eventLoopMax` dla każdej fazy oraz czasy tablic wyszukiwania pluginów dla zainstalowanego indeksu, rejestru manifestów, planowania uruchamiania i pracy nad mapą właścicieli.
- Ustaw `OPENCLAW_DIAGNOSTICS=timeline` z `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, aby zapisać best-effort oś czasu diagnostyki uruchamiania JSONL dla zewnętrznych harnessów QA. Możesz też włączyć flagę przez `diagnostics.flags: ["timeline"]` w konfiguracji; ścieżka nadal jest podawana przez środowisko. Dodaj `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, aby uwzględnić próbki pętli zdarzeń.
- Uruchom `pnpm test:startup:gateway -- --runs 5 --warmup 1`, aby zmierzyć uruchamianie Gateway. Benchmark rejestruje pierwsze wyjście procesu, `/healthz`, `/readyz`, czasy śladu uruchamiania, opóźnienie pętli zdarzeń oraz szczegóły czasów tablic wyszukiwania pluginów.

## Zapytania do działającego Gateway

Wszystkie polecenia zapytań używają RPC przez WebSocket.

<Tabs>
  <Tab title="Tryby wyjścia">
    - Domyślnie: czytelne dla człowieka (kolorowane w TTY).
    - `--json`: JSON czytelny maszynowo (bez stylowania/spinnera).
    - `--no-color` (lub `NO_COLOR=1`): wyłącz ANSI, zachowując układ dla człowieka.

  </Tab>
  <Tab title="Opcje wspólne">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: hasło Gateway.
    - `--timeout <ms>`: limit czasu/budżet (różni się w zależności od polecenia).
    - `--expect-final`: czekaj na odpowiedź „final” (wywołania agenta).

  </Tab>
</Tabs>

<Note>
Gdy ustawisz `--url`, CLI nie wraca do danych uwierzytelniających z konfiguracji ani środowiska. Przekaż jawnie `--token` albo `--password`. Brak jawnych danych uwierzytelniających jest błędem.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` jest sondą żywotności: zwraca odpowiedź, gdy serwer może odpowiadać przez HTTP. Endpoint HTTP `/readyz` jest bardziej rygorystyczny i pozostaje czerwony, dopóki sidecary pluginów uruchomieniowych, kanały lub skonfigurowane hooki nadal się stabilizują. Lokalne lub uwierzytelnione szczegółowe odpowiedzi gotowości zawierają blok diagnostyczny `eventLoop` z opóźnieniem pętli zdarzeń, wykorzystaniem pętli zdarzeń, stosunkiem rdzeni CPU oraz flagą `degraded`.

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
  Zapisz udostępnialny plik zip diagnostyki wsparcia zamiast drukować szczegóły stabilności.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ścieżka wyjściowa dla `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Prywatność i zachowanie pakietu">
    - Rekordy przechowują metadane operacyjne: nazwy zdarzeń, liczniki, rozmiary w bajtach, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów oraz zredagowane podsumowania sesji. Nie przechowują tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, cookies, wartości sekretów, nazw hostów ani surowych identyfikatorów sesji. Ustaw `diagnostics.enabled: false`, aby całkowicie wyłączyć rejestrator.
    - Przy krytycznych wyjściach Gateway, timeoutach wyłączania i niepowodzeniach uruchamiania po restarcie OpenClaw zapisuje tę samą migawkę diagnostyczną do `~/.openclaw/logs/stability/openclaw-stability-*.json`, gdy rejestrator ma zdarzenia. Sprawdź najnowszy pakiet przez `openclaw gateway stability --bundle latest`; `--limit`, `--type` i `--since-seq` mają też zastosowanie do wyjścia pakietu.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Zapisz lokalny plik zip diagnostyki zaprojektowany do dołączania do zgłoszeń błędów. Model prywatności i zawartość pakietu opisuje [Eksport diagnostyki](/pl/gateway/diagnostics).

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
  URL WebSocket Gateway dla migawki zdrowia.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway dla migawki zdrowia.
</ParamField>
<ParamField path="--password <password>" type="string">
  Hasło Gateway dla migawki zdrowia.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Limit czasu migawki statusu/zdrowia.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Pomiń wyszukiwanie utrwalonego pakietu stabilności.
</ParamField>
<ParamField path="--json" type="boolean">
  Wydrukuj zapisaną ścieżkę, rozmiar i manifest jako JSON.
</ParamField>

Eksport zawiera manifest, podsumowanie Markdown, kształt konfiguracji, oczyszczone szczegóły konfiguracji, oczyszczone podsumowania logów, oczyszczone migawki statusu/zdrowia Gateway oraz najnowszy pakiet stabilności, jeśli istnieje.

Jest przeznaczony do udostępniania. Zachowuje szczegóły operacyjne pomocne w debugowaniu, takie jak bezpieczne pola logów OpenClaw, nazwy podsystemów, kody statusu, czasy trwania, skonfigurowane tryby, porty, identyfikatory pluginów, identyfikatory dostawców, niesekretne ustawienia funkcji oraz zredagowane operacyjne komunikaty logów. Pomija lub redaguje tekst czatu, treści webhooków, wyniki narzędzi, dane uwierzytelniające, cookies, identyfikatory kont/wiadomości, tekst promptów/instrukcji, nazwy hostów i wartości sekretów. Gdy komunikat w stylu LogTape wygląda jak tekst payloadu użytkownika/czatu/narzędzia, eksport zachowuje tylko informację, że komunikat został pominięty, oraz jego liczbę bajtów.

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
  Limit czasu sondy.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Pomiń sondę łączności (widok tylko usługi).
</ParamField>
<ParamField path="--deep" type="boolean">
  Skanuj także usługi na poziomie systemu.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Podnieś domyślną sondę łączności do sondy odczytu i zakończ z kodem różnym od zera, gdy ta sonda odczytu się nie powiedzie. Nie można łączyć z `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantyka statusu">
    - `gateway status` pozostaje dostępne do diagnostyki nawet wtedy, gdy lokalna konfiguracja CLI jest brakująca lub nieprawidłowa.
    - Domyślne `gateway status` potwierdza stan usługi, połączenie WebSocket oraz funkcję uwierzytelniania widoczną w momencie uzgadniania połączenia. Nie potwierdza operacji odczytu/zapisu/administracyjnych.
    - Sondy diagnostyczne nie modyfikują uwierzytelniania urządzenia przy pierwszym użyciu: ponownie używają istniejącego buforowanego tokena urządzenia, jeśli istnieje, ale nie tworzą nowej tożsamości urządzenia CLI ani rekordu parowania urządzenia tylko do odczytu wyłącznie po to, aby sprawdzić status.
    - `gateway status` rozwiązuje skonfigurowane SecretRefs uwierzytelniania na potrzeby uwierzytelniania sondy, gdy jest to możliwe.
    - Jeśli wymagany SecretRef uwierzytelniania nie zostanie rozwiązany w tej ścieżce polecenia, `gateway status --json` zgłasza `rpc.authWarning`, gdy łączność/uwierzytelnianie sondy zawiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
    - Jeśli sonda się powiedzie, ostrzeżenia o nierozwiązanych odwołaniach uwierzytelniania są ukrywane, aby uniknąć fałszywych alarmów.
    - Używaj `--require-rpc` w skryptach i automatyzacji, gdy nasłuchująca usługa nie wystarcza i potrzebujesz także sprawnych wywołań RPC z zakresem odczytu.
    - `--deep` dodaje najlepszą możliwą próbę skanowania dodatkowych instalacji launchd/systemd/schtasks. Gdy wykryto wiele usług podobnych do Gateway, wyjście dla człowieka drukuje wskazówki czyszczenia i ostrzega, że większość konfiguracji powinna uruchamiać jeden Gateway na maszynę.
    - Wyjście dla człowieka zawiera rozwiązaną ścieżkę pliku dziennika oraz migawkę ścieżek/poprawności konfiguracji CLI względem usługi, aby pomóc diagnozować rozjazdy profilu lub katalogu stanu.

  </Accordion>
  <Accordion title="Kontrole dryfu uwierzytelniania w Linux systemd">
    - W instalacjach Linux systemd kontrole dryfu uwierzytelniania usługi odczytują z jednostki zarówno wartości `Environment=`, jak i `EnvironmentFile=` (w tym `%h`, ścieżki w cudzysłowach, wiele plików oraz opcjonalne pliki `-`).
    - Kontrole dryfu rozwiązują SecretRefs `gateway.auth.token` przy użyciu scalonego środowiska uruchomieniowego (najpierw środowisko polecenia usługi, potem awaryjnie środowisko procesu).
    - Jeśli uwierzytelnianie tokenem nie jest faktycznie aktywne (jawny `gateway.auth.mode` ustawiony na `password`/`none`/`trusted-proxy` albo brak ustawionego trybu, gdy hasło może wygrać i żaden kandydat na token nie może wygrać), kontrole dryfu tokena pomijają rozwiązywanie tokena konfiguracji.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` to polecenie „debuguj wszystko”. Zawsze sonduje:

- skonfigurowany zdalny Gateway (jeśli ustawiony) oraz
- localhost (loopback) **nawet jeśli zdalny jest skonfigurowany**.

Jeśli przekażesz `--url`, ten jawny cel zostanie dodany przed oboma. Wyjście dla człowieka oznacza cele jako:

- `URL (explicit)`
- `Remote (configured)` lub `Remote (configured, inactive)`
- `Local loopback`

<Note>
Jeśli osiągalnych jest wiele Gateway, wypisuje je wszystkie. Wiele Gateway jest obsługiwanych, gdy używasz odizolowanych profili/portów (np. bota ratunkowego), ale większość instalacji nadal uruchamia pojedynczy Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretacja">
    - `Reachable: yes` oznacza, że co najmniej jeden cel zaakceptował połączenie WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` zgłasza, co sonda mogła potwierdzić w zakresie uwierzytelniania. Jest to niezależne od osiągalności.
    - `Read probe: ok` oznacza, że wywołania RPC szczegółów z zakresem odczytu (`health`/`status`/`system-presence`/`config.get`) również się powiodły.
    - `Read probe: limited - missing scope: operator.read` oznacza, że połączenie się powiodło, ale RPC z zakresem odczytu jest ograniczone. Jest to zgłaszane jako **zdegradowana** osiągalność, a nie pełna awaria.
    - `Read probe: failed` po `Connect: ok` oznacza, że Gateway zaakceptował połączenie WebSocket, ale późniejsza diagnostyka odczytu przekroczyła limit czasu lub zawiodła. To również jest **zdegradowana** osiągalność, a nie nieosiągalny Gateway.
    - Podobnie jak `gateway status`, sonda ponownie używa istniejącego buforowanego uwierzytelniania urządzenia, ale nie tworzy tożsamości urządzenia przy pierwszym użyciu ani stanu parowania.
    - Kod wyjścia jest niezerowy tylko wtedy, gdy żaden sondowany cel nie jest osiągalny.

  </Accordion>
  <Accordion title="Wyjście JSON">
    Najwyższy poziom:

    - `ok`: co najmniej jeden cel jest osiągalny.
    - `degraded`: co najmniej jeden cel zaakceptował połączenie, ale nie ukończył pełnej diagnostyki szczegółów RPC.
    - `capability`: najlepsza funkcja widziana we wszystkich osiągalnych celach (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` lub `unknown`).
    - `primaryTargetId`: najlepszy cel do traktowania jako aktywnego zwycięzcę w tej kolejności: jawny URL, tunel SSH, skonfigurowany zdalny, potem local loopback.
    - `warnings[]`: rekordy ostrzeżeń najlepszym wysiłkiem z `code`, `message` i opcjonalnym `targetIds`.
    - `network`: wskazówki URL local loopback/tailnet wyprowadzone z bieżącej konfiguracji i sieci hosta.
    - `discovery.timeoutMs` i `discovery.count`: rzeczywisty budżet wykrywania/liczba wyników użyte dla tego przebiegu sondy.

    Dla celu (`targets[].connect`):

    - `ok`: osiągalność po klasyfikacji połączenia i degradacji.
    - `rpcOk`: pełny sukces RPC szczegółów.
    - `scopeLimited`: RPC szczegółów nie powiodło się z powodu brakującego zakresu operatora.

    Dla celu (`targets[].auth`):

    - `role`: rola uwierzytelniania zgłoszona w `hello-ok`, gdy jest dostępna.
    - `scopes`: przyznane zakresy zgłoszone w `hello-ok`, gdy są dostępne.
    - `capability`: ujawniona klasyfikacja funkcji uwierzytelniania dla tego celu.

  </Accordion>
  <Accordion title="Typowe kody ostrzeżeń">
    - `ssh_tunnel_failed`: konfiguracja tunelu SSH nie powiodła się; polecenie wróciło do bezpośrednich sond.
    - `multiple_gateways`: osiągalny był więcej niż jeden cel; jest to nietypowe, chyba że celowo uruchamiasz odizolowane profile, takie jak bot ratunkowy.
    - `auth_secretref_unresolved`: skonfigurowany SecretRef uwierzytelniania nie mógł zostać rozwiązany dla celu, który zawiódł.
    - `probe_scope_limited`: połączenie WebSocket się powiodło, ale sonda odczytu była ograniczona przez brakujące `operator.read`.

  </Accordion>
</AccordionGroup>

#### Zdalnie przez SSH (parytet z aplikacją na Maca)

Tryb „Zdalnie przez SSH” aplikacji macOS używa lokalnego przekierowania portu, dzięki czemu zdalny Gateway (który może być przypisany tylko do loopback) staje się osiągalny pod `ws://127.0.0.1:<port>`.

Odpowiednik CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` lub `user@host:port` (port domyślnie to `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Plik tożsamości.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Wybiera pierwszy wykryty host Gateway jako cel SSH z rozwiązanego punktu końcowego wykrywania (`local.` plus skonfigurowana domena rozległa, jeśli istnieje). Wskazówki wyłącznie TXT są ignorowane.
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
  Głównie dla RPC w stylu agenta, które strumieniują zdarzenia pośrednie przed końcowym ładunkiem.
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

Użyj `--wrapper`, gdy zarządzana usługa musi uruchamiać się przez inny plik wykonywalny, na przykład podkładkę menedżera sekretów albo pomocnik uruchamiania jako inny użytkownik. Wrapper otrzymuje normalne argumenty Gateway i odpowiada za ostateczne wykonanie `openclaw` lub Node z tymi argumentami.

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

Możesz także ustawić wrapper przez środowisko. `gateway install` sprawdza, czy ścieżka jest plikiem wykonywalnym, zapisuje wrapper w `ProgramArguments` usługi i utrwala `OPENCLAW_WRAPPER` w środowisku usługi na potrzeby późniejszych wymuszonych reinstalacji, aktualizacji i napraw doctor.

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
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Zachowanie cyklu życia">
    - Użyj `gateway restart`, aby ponownie uruchomić zarządzaną usługę. Nie łącz `gateway stop` i `gateway start` jako zamiennika restartu; w macOS `gateway stop` celowo wyłącza LaunchAgent przed jego zatrzymaniem.
    - `gateway restart --wait 30s` nadpisuje skonfigurowany budżet wygaszania restartu dla tego restartu. Same liczby oznaczają milisekundy; akceptowane są jednostki takie jak `s`, `m` i `h`. `--wait 0` czeka bezterminowo.
    - `gateway restart --force` pomija wygaszanie aktywnej pracy i restartuje natychmiast. Użyj tego, gdy operator już sprawdził wymienione blokady zadań i chce natychmiast przywrócić Gateway.
    - Polecenia cyklu życia akceptują `--json` na potrzeby skryptów.

  </Accordion>
  <Accordion title="Uwierzytelnianie i SecretRefs podczas instalacji">
    - Gdy uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzane przez SecretRef, `gateway install` sprawdza, czy SecretRef można rozwiązać, ale nie utrwala rozwiązanego tokena w metadanych środowiska usługi.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena jest nierozwiązany, instalacja kończy się zamkniętą porażką zamiast utrwalać awaryjny tekst jawny.
    - Dla uwierzytelniania hasłem w `gateway run` preferuj `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` lub `gateway.auth.password` oparte na SecretRef zamiast wbudowanego `--password`.
    - W trybie wnioskowanego uwierzytelniania wyłącznie powłokowe `OPENCLAW_GATEWAY_PASSWORD` nie luzuje wymagań tokena instalacji; użyj trwałej konfiguracji (`gateway.auth.password` lub konfiguracji `env`) podczas instalowania zarządzanej usługi.
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` jest nieustawiony, instalacja jest blokowana do momentu jawnego ustawienia trybu.

  </Accordion>
</AccordionGroup>

## Wykrywanie Gateway (Bonjour)

`gateway discover` skanuje beacony Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): wybierz domenę (przykład: `openclaw.internal.`) i skonfiguruj split DNS oraz serwer DNS; zobacz [Bonjour](/pl/gateway/bonjour).

Tylko Gateway z włączonym wykrywaniem Bonjour (domyślnie) reklamują beacon.

Rekordy wykrywania Wide-Area obejmują (TXT):

- `role` (wskazówka roli Gateway)
- `transport` (wskazówka transportu, np. `gateway`)
- `gatewayPort` (port WebSocket, zwykle `18789`)
- `sshPort` (opcjonalny; klienci domyślnie ustawiają cele SSH na `22`, gdy go nie ma)
- `tailnetDns` (nazwa hosta MagicDNS, gdy jest dostępna)
- `gatewayTls` / `gatewayTlsSha256` (włączony TLS + odcisk certyfikatu)
- `cliPath` (wskazówka instalacji zdalnej zapisana w strefie rozległej)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Limit czasu dla polecenia (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Dane wyjściowe czytelne maszynowo (wyłącza też stylizowanie/spinner).
</ParamField>

Przykłady:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI skanuje `local.` oraz skonfigurowaną domenę rozległą, gdy jest włączona.
- `wsUrl` w danych wyjściowych JSON pochodzi z rozwiązanego punktu końcowego usługi, a nie z podpowiedzi tylko TXT, takich jak `lanHost` lub `tailnetDns`.
- W `local.` mDNS wartości `sshPort` i `cliPath` są rozgłaszane tylko wtedy, gdy `discovery.mdns.mode` ma wartość `full`. Rozległy DNS-SD nadal zapisuje `cliPath`; `sshPort` również tam pozostaje opcjonalny.

</Note>

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
