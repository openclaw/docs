---
read_when:
    - Uruchamianie Gateway z poziomu CLI (środowisko deweloperskie lub serwery)
    - Debugowanie uwierzytelniania Gateway, trybów wiązania i łączności
    - Wykrywanie Gateway przez Bonjour (lokalne + szerokoobszarowe DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — uruchamiaj, odpytuj i wykrywaj Gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-30T09:43:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe53f1ec289bf463766634a9b03bc234e109fdddf35b3fa3958fb8c5255c81a9
    source_path: cli/gateway.md
    workflow: 16
---

Gateway jest serwerem WebSocket OpenClaw (kanały, węzły, sesje, hooki). Podkomendy na tej stronie znajdują się pod `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/pl/gateway/bonjour">
    Lokalna konfiguracja mDNS + szerokoobszarowego DNS-SD.
  </Card>
  <Card title="Discovery overview" href="/pl/gateway/discovery">
    Jak OpenClaw ogłasza i znajduje Gateway.
  </Card>
  <Card title="Configuration" href="/pl/gateway/configuration">
    Klucze konfiguracji Gateway najwyższego poziomu.
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
  <Accordion title="Startup behavior">
    - Domyślnie Gateway odmawia uruchomienia, jeśli `gateway.mode=local` nie jest ustawione w `~/.openclaw/openclaw.json`. Użyj `--allow-unconfigured` do jednorazowych/deweloperskich uruchomień.
    - Oczekuje się, że `openclaw onboard --mode local` i `openclaw setup` zapiszą `gateway.mode=local`. Jeśli plik istnieje, ale brakuje `gateway.mode`, traktuj to jako uszkodzoną lub nadpisaną konfigurację i napraw ją, zamiast niejawnie zakładać tryb lokalny.
    - Jeśli plik istnieje i brakuje `gateway.mode`, Gateway traktuje to jako podejrzane uszkodzenie konfiguracji i odmawia „zgadywania local” za Ciebie.
    - Bindowanie poza loopback bez uwierzytelniania jest blokowane (zabezpieczenie).
    - `SIGUSR1` wyzwala ponowne uruchomienie w ramach procesu, gdy jest autoryzowane (`commands.restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby zablokować ręczny restart, podczas gdy zastosowanie/aktualizacja narzędzi i konfiguracji Gateway pozostają dozwolone).
    - Handlery `SIGINT`/`SIGTERM` zatrzymują proces Gateway, ale nie przywracają żadnego niestandardowego stanu terminala. Jeśli opakowujesz CLI za pomocą TUI lub wejścia w trybie raw, przywróć terminal przed wyjściem.

  </Accordion>
</AccordionGroup>

### Opcje

<ParamField path="--port <port>" type="number">
  Port WebSocket (wartość domyślna pochodzi z konfiguracji/env; zwykle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Tryb bindowania nasłuchu.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Nadpisanie trybu uwierzytelniania.
</ParamField>
<ParamField path="--token <token>" type="string">
  Nadpisanie tokena (ustawia też `OPENCLAW_GATEWAY_TOKEN` dla procesu).
</ParamField>
<ParamField path="--password <password>" type="string">
  Nadpisanie hasła.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Odczytaj hasło Gateway z pliku.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Udostępnij Gateway przez Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Resetuj konfigurację serve/funnel Tailscale przy wyłączaniu.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Zezwól na start Gateway bez `gateway.mode=local` w konfiguracji. Omija zabezpieczenie startowe tylko dla jednorazowego/deweloperskiego bootstrapu; nie zapisuje ani nie naprawia pliku konfiguracji.
</ParamField>
<ParamField path="--dev" type="boolean">
  Utwórz konfigurację deweloperską + przestrzeń roboczą, jeśli ich brakuje (pomija BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Resetuj konfigurację deweloperską + dane uwierzytelniające + sesje + przestrzeń roboczą (wymaga `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Zabij każdy istniejący nasłuch na wybranym porcie przed uruchomieniem.
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
  Ścieżka jsonl surowego strumienia.
</ParamField>

<Warning>
Wbudowane `--password` może być widoczne w lokalnych listach procesów. Preferuj `--password-file`, env albo `gateway.auth.password` oparte na SecretRef.
</Warning>

### Profilowanie startu

- Ustaw `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, aby logować czasy faz podczas startu Gateway, w tym opóźnienie `eventLoopMax` dla każdej fazy oraz czasy tabel wyszukiwania pluginów dla zainstalowanego indeksu, rejestru manifestów, planowania startu i pracy nad owner-map.
- Ustaw `OPENCLAW_DIAGNOSTICS=timeline` z `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, aby zapisać best-effort oś czasu diagnostyki startu JSONL dla zewnętrznych harnessów QA. Możesz też włączyć flagę przez `diagnostics.flags: ["timeline"]` w konfiguracji; ścieżka nadal jest podawana przez env. Dodaj `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`, aby uwzględnić próbki pętli zdarzeń.
- Uruchom `pnpm test:startup:gateway -- --runs 5 --warmup 1`, aby zmierzyć wydajność startu Gateway. Benchmark rejestruje pierwsze wyjście procesu, `/healthz`, `/readyz`, czasy śladu startu, opóźnienie pętli zdarzeń oraz szczegóły czasów tabel wyszukiwania pluginów.

## Odpytywanie działającego Gateway

Wszystkie polecenia zapytań używają RPC WebSocket.

<Tabs>
  <Tab title="Output modes">
    - Domyślnie: czytelne dla człowieka (kolorowane w TTY).
    - `--json`: czytelny maszynowo JSON (bez stylowania/spinnera).
    - `--no-color` (lub `NO_COLOR=1`): wyłącz ANSI, zachowując układ dla człowieka.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: hasło Gateway.
    - `--timeout <ms>`: limit czasu/budżet (różni się zależnie od polecenia).
    - `--expect-final`: czekaj na odpowiedź „final” (wywołania agenta).

  </Tab>
</Tabs>

<Note>
Gdy ustawiasz `--url`, CLI nie wraca do danych uwierzytelniających z konfiguracji ani środowiska. Przekaż jawnie `--token` lub `--password`. Brak jawnych danych uwierzytelniających jest błędem.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` jest sondą żywotności: zwraca odpowiedź, gdy serwer może odpowiadać przez HTTP. Endpoint HTTP `/readyz` jest bardziej rygorystyczny i pozostaje czerwony, dopóki sidecary startowe, kanały lub skonfigurowane hooki wciąż się stabilizują. Lokalne lub uwierzytelnione szczegółowe odpowiedzi gotowości zawierają blok diagnostyczny `eventLoop` z opóźnieniem pętli zdarzeń, wykorzystaniem pętli zdarzeń, stosunkiem rdzeni CPU oraz flagą `degraded`.

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

Pobierz najnowszy rejestrator stabilności diagnostycznej z działającego Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maksymalna liczba najnowszych zdarzeń do uwzględnienia (maks. `1000`).
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
  <Accordion title="Privacy and bundle behavior">
    - Rekordy zachowują metadane operacyjne: nazwy zdarzeń, liczby, rozmiary bajtów, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów oraz zredagowane podsumowania sesji. Nie przechowują tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, ciasteczek, wartości sekretów, nazw hostów ani surowych identyfikatorów sesji. Ustaw `diagnostics.enabled: false`, aby całkowicie wyłączyć rejestrator.
    - Przy krytycznych wyjściach Gateway, timeoutach zamykania i niepowodzeniach startu po restarcie OpenClaw zapisuje tę samą migawkę diagnostyczną do `~/.openclaw/logs/stability/openclaw-stability-*.json`, gdy rejestrator ma zdarzenia. Sprawdź najnowszy pakiet poleceniem `openclaw gateway stability --bundle latest`; `--limit`, `--type` i `--since-seq` mają też zastosowanie do wyjścia pakietu.

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
  URL WebSocket Gateway dla migawki zdrowia.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway dla migawki zdrowia.
</ParamField>
<ParamField path="--password <password>" type="string">
  Hasło Gateway dla migawki zdrowia.
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

Jest przeznaczony do udostępniania. Zachowuje szczegóły operacyjne pomagające w debugowaniu, takie jak bezpieczne pola logów OpenClaw, nazwy podsystemów, kody statusu, czasy trwania, skonfigurowane tryby, porty, identyfikatory pluginów, identyfikatory providerów, niesekretne ustawienia funkcji i zredagowane operacyjne komunikaty logów. Pomija lub redaguje tekst czatu, treści webhooków, wyniki narzędzi, dane uwierzytelniające, ciasteczka, identyfikatory kont/wiadomości, tekst promptów/instrukcji, nazwy hostów i wartości sekretów. Gdy komunikat w stylu LogTape wygląda jak tekst payloadu użytkownika/czatu/narzędzia, eksport zachowuje tylko informację, że komunikat został pominięty, oraz liczbę jego bajtów.

### `gateway status`

`gateway status` pokazuje usługę Gateway (launchd/systemd/schtasks) oraz opcjonalną sondę łączności/możliwości uwierzytelnienia.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Dodaj jawny cel sondowania. Skonfigurowane zdalne + localhost nadal są sondowane.
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
  Skanuj również usługi systemowe.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Podnieś domyślną sondę łączności do sondy odczytu i zakończ z kodem niezerowym, gdy ta sonda odczytu się nie powiedzie. Nie można łączyć z `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` pozostaje dostępne do diagnostyki nawet wtedy, gdy lokalna konfiguracja CLI jest brakująca lub nieprawidłowa.
    - Domyślne `gateway status` potwierdza stan usługi, połączenie WebSocket oraz możliwość uwierzytelniania widoczną w czasie uzgadniania. Nie potwierdza operacji odczytu/zapisu/administrowania.
    - Sondy diagnostyczne nie modyfikują stanu przy pierwszym uwierzytelnianiu urządzenia: używają ponownie istniejącego tokenu urządzenia z pamięci podręcznej, jeśli taki istnieje, ale nie tworzą nowej tożsamości urządzenia CLI ani rekordu parowania urządzenia tylko do odczytu wyłącznie po to, aby sprawdzić status.
    - `gateway status` w miarę możliwości rozwiązuje skonfigurowane SecretRefs uwierzytelniania na potrzeby uwierzytelniania sondy.
    - Jeśli wymagany SecretRef uwierzytelniania nie zostanie rozwiązany w tej ścieżce polecenia, `gateway status --json` zgłasza `rpc.authWarning`, gdy łączność/uwierzytelnianie sondy się nie powiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
    - Jeśli sonda powiedzie się, ostrzeżenia o nierozwiązanych odwołaniach uwierzytelniania są pomijane, aby uniknąć fałszywych alarmów.
    - Używaj `--require-rpc` w skryptach i automatyzacji, gdy nasłuchująca usługa nie wystarcza i wywołania RPC z zakresem odczytu także muszą być sprawne.
    - `--deep` dodaje best-effort skanowanie dodatkowych instalacji launchd/systemd/schtasks. Gdy wykryto wiele usług podobnych do Gateway, wynik dla człowieka wypisuje wskazówki dotyczące czyszczenia i ostrzega, że większość konfiguracji powinna uruchamiać jeden Gateway na maszynę.
    - Wynik dla człowieka obejmuje rozwiązaną ścieżkę pliku dziennika oraz migawkę ścieżek konfiguracji/ważności CLI względem usługi, aby pomóc diagnozować dryf profilu lub katalogu stanu.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - W instalacjach Linux systemd kontrole dryfu uwierzytelniania usługi odczytują z jednostki zarówno wartości `Environment=`, jak i `EnvironmentFile=` (w tym `%h`, ścieżki w cudzysłowach, wiele plików oraz opcjonalne pliki `-`).
    - Kontrole dryfu rozwiązują SecretRefs `gateway.auth.token` z użyciem scalonego środowiska uruchomieniowego (najpierw środowisko polecenia usługi, potem rezerwowo środowisko procesu).
    - Jeśli uwierzytelnianie tokenem nie jest faktycznie aktywne (jawne `gateway.auth.mode` równe `password`/`none`/`trusted-proxy` albo tryb nieustawiony, gdy hasło może wygrać i żaden kandydat tokenu nie może wygrać), kontrole dryfu tokenu pomijają rozwiązywanie tokenu konfiguracji.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` to polecenie „debuguj wszystko”. Zawsze sonduje:

- skonfigurowany zdalny Gateway (jeśli ustawiony) oraz
- localhost (loopback) **nawet jeśli skonfigurowano zdalny Gateway**.

Jeśli przekażesz `--url`, ten jawny cel zostanie dodany przed oboma powyższymi. Wynik dla człowieka oznacza cele jako:

- `URL (explicit)`
- `Remote (configured)` albo `Remote (configured, inactive)`
- `Local loopback`

<Note>
Jeśli dostępnych jest wiele Gateway, polecenie wypisuje je wszystkie. Wiele Gateway jest obsługiwanych, gdy używasz izolowanych profili/portów (np. bota ratunkowego), ale większość instalacji nadal uruchamia pojedynczy Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` oznacza, że co najmniej jeden cel zaakceptował połączenie WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` zgłasza, co sonda mogła potwierdzić o uwierzytelnianiu. Jest to oddzielne od osiągalności.
    - `Read probe: ok` oznacza, że szczegółowe wywołania RPC z zakresem odczytu (`health`/`status`/`system-presence`/`config.get`) również się powiodły.
    - `Read probe: limited - missing scope: operator.read` oznacza, że połączenie się powiodło, ale RPC z zakresem odczytu jest ograniczone. Jest to zgłaszane jako **zdegradowana** osiągalność, a nie pełna awaria.
    - `Read probe: failed` po `Connect: ok` oznacza, że Gateway zaakceptował połączenie WebSocket, ale kolejne diagnostyki odczytu przekroczyły limit czasu albo się nie powiodły. To także jest **zdegradowana** osiągalność, a nie nieosiągalny Gateway.
    - Podobnie jak `gateway status`, sonda używa ponownie istniejącego uwierzytelniania urządzenia z pamięci podręcznej, ale nie tworzy pierwszej tożsamości urządzenia ani stanu parowania.
    - Kod wyjścia jest niezerowy tylko wtedy, gdy żaden sondowany cel nie jest osiągalny.

  </Accordion>
  <Accordion title="JSON output">
    Poziom główny:

    - `ok`: co najmniej jeden cel jest osiągalny.
    - `degraded`: co najmniej jeden cel zaakceptował połączenie, ale nie ukończył pełnej szczegółowej diagnostyki RPC.
    - `capability`: najlepsza możliwość widziana we wszystkich osiągalnych celach (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` albo `unknown`).
    - `primaryTargetId`: najlepszy cel do traktowania jako aktywnego zwycięzcę w tej kolejności: jawny URL, tunel SSH, skonfigurowany zdalny cel, a następnie local loopback.
    - `warnings[]`: best-effort rekordy ostrzeżeń z `code`, `message` i opcjonalnym `targetIds`.
    - `network`: wskazówki URL local loopback/tailnet wyprowadzone z bieżącej konfiguracji i sieci hosta.
    - `discovery.timeoutMs` i `discovery.count`: rzeczywisty budżet wykrywania/liczba wyników użyte w tym przebiegu sondy.

    Dla celu (`targets[].connect`):

    - `ok`: osiągalność po połączeniu + klasyfikacja zdegradowania.
    - `rpcOk`: pełny sukces szczegółowego RPC.
    - `scopeLimited`: szczegółowe RPC nie powiodło się z powodu brakującego zakresu operatora.

    Dla celu (`targets[].auth`):

    - `role`: rola uwierzytelniania zgłoszona w `hello-ok`, gdy dostępna.
    - `scopes`: przyznane zakresy zgłoszone w `hello-ok`, gdy dostępne.
    - `capability`: udostępniona klasyfikacja możliwości uwierzytelniania dla tego celu.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: konfiguracja tunelu SSH nie powiodła się; polecenie wróciło do bezpośrednich sond.
    - `multiple_gateways`: więcej niż jeden cel był osiągalny; to nietypowe, chyba że celowo uruchamiasz izolowane profile, takie jak bot ratunkowy.
    - `auth_secretref_unresolved`: skonfigurowany SecretRef uwierzytelniania nie mógł zostać rozwiązany dla celu, który się nie powiódł.
    - `probe_scope_limited`: połączenie WebSocket się powiodło, ale sonda odczytu była ograniczona przez brakujący `operator.read`.

  </Accordion>
</AccordionGroup>

#### Zdalnie przez SSH (parzystość aplikacji Mac)

Tryb „Remote over SSH” w aplikacji macOS używa lokalnego przekierowania portu, dzięki czemu zdalny Gateway (który może być powiązany tylko z loopback) staje się osiągalny pod `ws://127.0.0.1:<port>`.

Odpowiednik CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` albo `user@host:port` (port domyślnie `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Plik tożsamości.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Wybierz pierwszy wykryty host Gateway jako cel SSH z rozwiązanego punktu końcowego wykrywania (`local.` plus skonfigurowana domena rozległa, jeśli istnieje). Wskazówki tylko TXT są ignorowane.
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

Użyj `--wrapper`, gdy zarządzana usługa musi startować przez inny plik wykonywalny, na przykład shim menedżera sekretów albo pomocnik run-as. Wrapper otrzymuje normalne argumenty Gateway i odpowiada za to, aby ostatecznie wykonać `openclaw` albo Node z tymi argumentami.

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

Wrapper można też ustawić przez środowisko. `gateway install` sprawdza, czy ścieżka jest plikiem wykonywalnym, zapisuje wrapper w `ProgramArguments` usługi i utrwala `OPENCLAW_WRAPPER` w środowisku usługi na potrzeby późniejszych wymuszonych reinstalacji, aktualizacji i napraw doctor.

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
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Użyj `gateway restart`, aby ponownie uruchomić zarządzaną usługę. Nie łącz `gateway stop` i `gateway start` jako zamiennika restartu; w macOS `gateway stop` celowo wyłącza LaunchAgent przed jego zatrzymaniem.
    - Polecenia cyklu życia akceptują `--json` na potrzeby skryptów.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Gdy uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, `gateway install` sprawdza, czy SecretRef można rozwiązać, ale nie utrwala rozwiązanego tokenu w metadanych środowiska usługi.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, instalacja kończy się zamkniętą awarią zamiast utrwalać rezerwowy tekst jawny.
    - Dla uwierzytelniania hasłem w `gateway run` preferuj `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` albo `gateway.auth.password` oparte na SecretRef zamiast wbudowanego `--password`.
    - W wywnioskowanym trybie uwierzytelniania `OPENCLAW_GATEWAY_PASSWORD` ustawione tylko w powłoce nie rozluźnia wymagań tokenu przy instalacji; podczas instalowania zarządzanej usługi użyj trwałej konfiguracji (`gateway.auth.password` albo `env` konfiguracji).
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` jest nieustawione, instalacja jest blokowana do czasu jawnego ustawienia trybu.

  </Accordion>
</AccordionGroup>

## Wykrywanie Gateway (Bonjour)

`gateway discover` skanuje sygnały nawigacyjne Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): wybierz domenę (przykład: `openclaw.internal.`) i skonfiguruj split DNS + serwer DNS; zobacz [Bonjour](/pl/gateway/bonjour).

Tylko Gateway z włączonym wykrywaniem Bonjour (domyślnie) ogłaszają sygnał nawigacyjny.

Rekordy wykrywania Wide-Area obejmują (TXT):

- `role` (wskazówka roli Gateway)
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
  Wynik czytelny maszynowo (wyłącza również stylowanie/spinner).
</ParamField>

Przykłady:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI skanuje `local.` oraz skonfigurowaną domenę rozległą, gdy jest włączona.
- `wsUrl` w danych wyjściowych JSON jest wyprowadzany z rozwiązanego punktu końcowego usługi, a nie ze wskazówek wyłącznie TXT, takich jak `lanHost` lub `tailnetDns`.
- W mDNS `local.` wartości `sshPort` i `cliPath` są rozgłaszane tylko wtedy, gdy `discovery.mdns.mode` ma wartość `full`. DNS-SD w sieci rozległej nadal zapisuje `cliPath`; `sshPort` również pozostaje tam opcjonalne.

</Note>

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
