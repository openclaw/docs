---
read_when:
    - Uruchamianie Gateway z CLI (dewelopersko lub na serwerach)
    - Debugowanie uwierzytelniania Gateway, trybów powiązania i łączności
    - Wykrywanie Gateway przez Bonjour (lokalne + szerokoobszarowe DNS-SD)
summary: CLI Gateway OpenClaw (`openclaw gateway`) — uruchamianie, odpytywanie i wykrywanie Gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-24T09:02:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 011b8c8f86de6ecafbf17357a458956357ebe8285fe86e2bf875a4e2d87b5126
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Gateway to serwer WebSocket OpenClaw (kanały, Node, sesje, Hooki).

Podpolecenia na tej stronie są dostępne pod `openclaw gateway …`.

Powiązana dokumentacja:

- [/gateway/bonjour](/pl/gateway/bonjour)
- [/gateway/discovery](/pl/gateway/discovery)
- [/gateway/configuration](/pl/gateway/configuration)

## Uruchamianie Gateway

Uruchom lokalny proces Gateway:

```bash
openclaw gateway
```

Alias dla trybu pierwszoplanowego:

```bash
openclaw gateway run
```

Uwagi:

- Domyślnie Gateway odmawia uruchomienia, chyba że w `~/.openclaw/openclaw.json` ustawiono `gateway.mode=local`. Dla uruchomień ad hoc/deweloperskich użyj `--allow-unconfigured`.
- Oczekuje się, że `openclaw onboard --mode local` i `openclaw setup` zapiszą `gateway.mode=local`. Jeśli plik istnieje, ale brakuje `gateway.mode`, potraktuj to jako uszkodzoną lub nadpisaną konfigurację i napraw ją, zamiast niejawnie zakładać tryb lokalny.
- Jeśli plik istnieje i brakuje `gateway.mode`, Gateway traktuje to jako podejrzane uszkodzenie konfiguracji i odmawia „zgadywania trybu lokalnego” za użytkownika.
- Powiązanie poza local loopback bez uwierzytelniania jest blokowane (zabezpieczenie).
- `SIGUSR1` wywołuje restart w tym samym procesie, jeśli jest autoryzowany (`commands.restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby zablokować ręczny restart, przy czym narzędzia/config apply/update Gateway pozostają dozwolone).
- Procedury obsługi `SIGINT`/`SIGTERM` zatrzymują proces gateway, ale nie przywracają niestandardowego stanu terminala. Jeśli opakowujesz CLI przez TUI lub wejście w trybie raw, przywróć terminal przed zakończeniem.

### Opcje

- `--port <port>`: port WebSocket (domyślna wartość pochodzi z config/env; zwykle `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: tryb powiązania listenera.
- `--auth <token|password>`: nadpisanie trybu uwierzytelniania.
- `--token <token>`: nadpisanie tokenu (ustawia też `OPENCLAW_GATEWAY_TOKEN` dla procesu).
- `--password <password>`: nadpisanie hasła. Ostrzeżenie: hasła podane wprost mogą być widoczne w lokalnych listach procesów.
- `--password-file <path>`: odczytaj hasło Gateway z pliku.
- `--tailscale <off|serve|funnel>`: udostępnij Gateway przez Tailscale.
- `--tailscale-reset-on-exit`: zresetuj konfigurację Tailscale serve/funnel przy zamknięciu.
- `--allow-unconfigured`: zezwól na uruchomienie gateway bez `gateway.mode=local` w konfiguracji. To omija zabezpieczenie startowe tylko dla bootstrapu ad hoc/deweloperskiego; nie zapisuje ani nie naprawia pliku konfiguracji.
- `--dev`: utwórz konfigurację deweloperską + obszar roboczy, jeśli ich brakuje (pomija `BOOTSTRAP.md`).
- `--reset`: zresetuj konfigurację deweloperską + poświadczenia + sesje + obszar roboczy (wymaga `--dev`).
- `--force`: zabij istniejący listener na wybranym porcie przed uruchomieniem.
- `--verbose`: szczegółowe logi.
- `--cli-backend-logs`: pokazuj w konsoli tylko logi backendu CLI (i włącz stdout/stderr).
- `--ws-log <auto|full|compact>`: styl logów websocketów (domyślnie `auto`).
- `--compact`: alias dla `--ws-log compact`.
- `--raw-stream`: loguj surowe zdarzenia strumienia modelu do jsonl.
- `--raw-stream-path <path>`: ścieżka jsonl dla surowego strumienia.

Profilowanie uruchamiania:

- Ustaw `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, aby logować czasy faz podczas uruchamiania Gateway.
- Uruchom `pnpm test:startup:gateway -- --runs 5 --warmup 1`, aby benchmarkować uruchamianie Gateway. Benchmark rejestruje pierwsze wyjście procesu, `/healthz`, `/readyz` i czasy śledzenia uruchamiania.

## Odpytywanie działającego Gateway

Wszystkie polecenia zapytań używają WebSocket RPC.

Tryby wyjścia:

- Domyślny: czytelny dla człowieka (kolorowany w TTY).
- `--json`: JSON czytelny dla maszyn (bez stylizacji/spinnera).
- `--no-color` (lub `NO_COLOR=1`): wyłącz ANSI, zachowując układ dla człowieka.

Wspólne opcje (tam, gdzie obsługiwane):

- `--url <url>`: URL WebSocket Gateway.
- `--token <token>`: token Gateway.
- `--password <password>`: hasło Gateway.
- `--timeout <ms>`: limit czasu/budżet (zależy od polecenia).
- `--expect-final`: czekaj na odpowiedź „final” (wywołania agenta).

Uwaga: po ustawieniu `--url` CLI nie wraca do poświadczeń z konfiguracji ani środowiska.
Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Punkt końcowy HTTP `/healthz` jest sondą żywotności: zwraca odpowiedź, gdy serwer potrafi odpowiedzieć przez HTTP. Punkt końcowy HTTP `/readyz` jest bardziej rygorystyczny i pozostaje czerwony, dopóki sidecary startowe, kanały lub skonfigurowane Hooki nadal się stabilizują.

### `gateway usage-cost`

Pobierz podsumowania usage-cost z logów sesji.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Opcje:

- `--days <days>`: liczba dni do uwzględnienia (domyślnie `30`).

### `gateway stability`

Pobierz ostatni rejestrator stabilności diagnostycznej z działającego Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Opcje:

- `--limit <limit>`: maksymalna liczba ostatnich zdarzeń do uwzględnienia (domyślnie `25`, maks. `1000`).
- `--type <type>`: filtruj według typu zdarzenia diagnostycznego, takiego jak `payload.large` lub `diagnostic.memory.pressure`.
- `--since-seq <seq>`: uwzględnij tylko zdarzenia po numerze sekwencji diagnostycznej.
- `--bundle [path]`: odczytaj zapisany pakiet stabilności zamiast odpytywać działające Gateway. Użyj `--bundle latest` (lub po prostu `--bundle`) dla najnowszego pakietu w katalogu stanu albo przekaż bezpośrednio ścieżkę do JSON pakietu.
- `--export`: zapisz współdzielone archiwum zip z diagnostyką wsparcia zamiast wypisywać szczegóły stabilności.
- `--output <path>`: ścieżka wyjściowa dla `--export`.

Uwagi:

- Rekordy przechowują metadane operacyjne: nazwy zdarzeń, liczniki, rozmiary w bajtach, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/Pluginów oraz zredagowane podsumowania sesji. Nie przechowują tekstu czatu, treści Webhooków, wyjść narzędzi, surowych treści żądań ani odpowiedzi, tokenów, ciasteczek, wartości sekretów, nazw hostów ani surowych identyfikatorów sesji. Ustaw `diagnostics.enabled: false`, aby całkowicie wyłączyć rejestrator.
- Przy krytycznych wyjściach Gateway, timeoutach zamknięcia i błędach uruchamiania przy restarcie OpenClaw zapisuje ten sam zrzut diagnostyczny do `~/.openclaw/logs/stability/openclaw-stability-*.json`, gdy rejestrator ma zdarzenia. Sprawdź najnowszy pakiet przez `openclaw gateway stability --bundle latest`; `--limit`, `--type` i `--since-seq` także działają dla wyjścia pakietu.

### `gateway diagnostics export`

Zapisz lokalny plik zip z diagnostyką, przeznaczony do dołączenia do zgłoszeń błędów.
Model prywatności i zawartość pakietu opisano w [Eksport diagnostyki](/pl/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Opcje:

- `--output <path>`: ścieżka wyjściowa zip. Domyślnie eksport wsparcia w katalogu stanu.
- `--log-lines <count>`: maksymalna liczba zsanityzowanych linii logów do uwzględnienia (domyślnie `5000`).
- `--log-bytes <bytes>`: maksymalna liczba bajtów logów do przejrzenia (domyślnie `1000000`).
- `--url <url>`: URL WebSocket Gateway dla zrzutu health.
- `--token <token>`: token Gateway dla zrzutu health.
- `--password <password>`: hasło Gateway dla zrzutu health.
- `--timeout <ms>`: limit czasu zrzutu status/health (domyślnie `3000`).
- `--no-stability-bundle`: pomiń wyszukiwanie zapisanego pakietu stabilności.
- `--json`: wypisz zapisaną ścieżkę, rozmiar i manifest jako JSON.

Eksport zawiera manifest, podsumowanie Markdown, kształt konfiguracji, zsanityzowane szczegóły konfiguracji, zsanityzowane podsumowania logów, zsanityzowane zrzuty status/health Gateway oraz najnowszy pakiet stabilności, jeśli istnieje.

Jest przeznaczony do udostępniania. Zachowuje szczegóły operacyjne pomocne przy debugowaniu, takie jak bezpieczne pola logów OpenClaw, nazwy podsystemów, kody statusu, czasy trwania, skonfigurowane tryby, porty, identyfikatory Pluginów, identyfikatory dostawców, ustawienia funkcji niebędące sekretami oraz zredagowane komunikaty logów operacyjnych. Pomija lub redaguje tekst czatu, treści Webhooków, wyjścia narzędzi, poświadczenia, ciasteczka, identyfikatory kont/wiadomości, tekst promptów/instrukcji, nazwy hostów i wartości sekretów. Gdy komunikat w stylu LogTape wygląda na tekst ładunku użytkownika/czatu/narzędzia, eksport zachowuje tylko informację, że komunikat został pominięty, oraz jego rozmiar w bajtach.

### `gateway status`

`gateway status` pokazuje usługę Gateway (launchd/systemd/schtasks) oraz opcjonalną sondę łączności/możliwości uwierzytelniania.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opcje:

- `--url <url>`: dodaj jawny cel sondy. Skonfigurowane cele zdalne + localhost nadal są sprawdzane.
- `--token <token>`: uwierzytelnianie tokenem dla sondy.
- `--password <password>`: uwierzytelnianie hasłem dla sondy.
- `--timeout <ms>`: limit czasu sondy (domyślnie `10000`).
- `--no-probe`: pomiń sondę łączności (widok tylko usługi).
- `--deep`: skanuj także usługi na poziomie systemu.
- `--require-rpc`: podnieś domyślną sondę łączności do sondy odczytu i zakończ z kodem niezerowym, gdy sonda odczytu się nie powiedzie. Nie można łączyć z `--no-probe`.

Uwagi:

- `gateway status` pozostaje dostępne do diagnostyki nawet wtedy, gdy lokalna konfiguracja CLI jest nieobecna lub nieprawidłowa.
- Domyślne `gateway status` potwierdza stan usługi, połączenie WebSocket i możliwości uwierzytelniania widoczne w momencie handshake. Nie potwierdza operacji read/write/admin.
- `gateway status` w miarę możliwości rozwiązuje skonfigurowane SecretRef uwierzytelniania dla uwierzytelniania sondy.
- Jeśli wymagany auth SecretRef nie może zostać rozwiązany na tej ścieżce polecenia, `gateway status --json` zgłasza `rpc.authWarning`, gdy sonda łączności/auth się nie powiedzie; przekaż jawnie `--token`/`--password` lub najpierw rozwiąż źródło sekretu.
- Jeśli sonda się powiedzie, ostrzeżenia o nierozwiązanym auth-ref są ukrywane, aby uniknąć fałszywych alarmów.
- Używaj `--require-rpc` w skryptach i automatyzacji, gdy sama nasłuchująca usługa nie wystarcza i potrzebujesz także zdrowych wywołań RPC o zakresie odczytu.
- `--deep` dodaje best-effort skan w poszukiwaniu dodatkowych instalacji launchd/systemd/schtasks. Gdy wykryto wiele usług podobnych do gateway, wynik dla człowieka wypisuje wskazówki czyszczenia i ostrzega, że większość konfiguracji powinna uruchamiać jedno gateway na maszynę.
- Wyjście dla człowieka zawiera rozwiązaną ścieżkę logów pliku oraz zrzut ścieżek/poprawności konfiguracji CLI vs usługa, aby pomóc zdiagnozować dryf profilu lub katalogu stanu.
- W instalacjach Linux systemd kontrole dryfu uwierzytelniania odczytują zarówno wartości `Environment=`, jak i `EnvironmentFile=` z unitu (w tym `%h`, ścieżki w cudzysłowach, wiele plików oraz opcjonalne pliki `-`).
- Kontrole dryfu rozwiązują `gateway.auth.token` SecretRef przy użyciu scalanego środowiska uruchomieniowego (najpierw env polecenia usługi, następnie env procesu jako fallback).
- Jeśli uwierzytelnianie tokenem nie jest efektywnie aktywne (jawne `gateway.auth.mode` równe `password`/`none`/`trusted-proxy` albo nieustawiony tryb, gdy może wygrać hasło i nie może wygrać żaden kandydat tokenu), kontrole dryfu tokenu pomijają rozwiązywanie tokenu z konfiguracji.

### `gateway probe`

`gateway probe` to polecenie „debuguj wszystko”. Zawsze sonduje:

- skonfigurowane zdalne gateway (jeśli ustawione), oraz
- localhost (loopback) **nawet jeśli skonfigurowano zdalne**.

Jeśli przekażesz `--url`, ten jawny cel zostanie dodany przed oboma. Wyjście dla człowieka oznacza
cele jako:

- `URL (jawny)`
- `Remote (configured)` lub `Remote (configured, inactive)`
- `Local loopback`

Jeśli osiągalnych jest wiele gateway, wypisze wszystkie. Wiele gateway jest obsługiwanych, gdy używasz izolowanych profili/portów (np. bot ratunkowy), ale większość instalacji nadal uruchamia pojedyncze gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretacja:

- `Reachable: yes` oznacza, że co najmniej jeden cel zaakceptował połączenie WebSocket.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informuje, co sonda potrafiła udowodnić o uwierzytelnianiu. Jest to oddzielne od osiągalności.
- `Read probe: ok` oznacza, że szczegółowe wywołania RPC z zakresem odczytu (`health`/`status`/`system-presence`/`config.get`) również się powiodły.
- `Read probe: limited - missing scope: operator.read` oznacza, że połączenie się udało, ale RPC z zakresem odczytu są ograniczone. Jest to zgłaszane jako **zdegradowana** osiągalność, a nie pełna awaria.
- Kod wyjścia jest niezerowy tylko wtedy, gdy żaden sondowany cel nie jest osiągalny.

Uwagi dotyczące JSON (`--json`):

- Najwyższy poziom:
  - `ok`: co najmniej jeden cel jest osiągalny.
  - `degraded`: co najmniej jeden cel miał ograniczone zakresem szczegółowe RPC.
  - `capability`: najlepsza możliwość widziana wśród osiągalnych celów (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` lub `unknown`).
  - `primaryTargetId`: najlepszy cel traktowany jako aktywny zwycięzca w tej kolejności: jawny URL, tunel SSH, skonfigurowany zdalny, a następnie local loopback.
  - `warnings[]`: rekordy ostrzeżeń best-effort z `code`, `message` i opcjonalnie `targetIds`.
  - `network`: podpowiedzi URL local loopback/tailnet wyprowadzone z bieżącej konfiguracji i sieci hosta.
  - `discovery.timeoutMs` i `discovery.count`: rzeczywisty budżet/liczba wyników wykrywania użyte dla tego przebiegu sondy.
- Per cel (`targets[].connect`):
  - `ok`: osiągalność po połączeniu + klasyfikacja zdegradowania.
  - `rpcOk`: pełny sukces szczegółowego RPC.
  - `scopeLimited`: szczegółowe RPC nie powiodło się z powodu braku zakresu operatora.
- Per cel (`targets[].auth`):
  - `role`: rola uwierzytelniania zgłoszona w `hello-ok`, gdy jest dostępna.
  - `scopes`: przyznane zakresy zgłoszone w `hello-ok`, gdy są dostępne.
  - `capability`: ujawniona klasyfikacja możliwości uwierzytelniania dla tego celu.

Typowe kody ostrzeżeń:

- `ssh_tunnel_failed`: nie udało się skonfigurować tunelu SSH; polecenie wróciło do bezpośrednich sond.
- `multiple_gateways`: osiągalny był więcej niż jeden cel; to nietypowe, chyba że celowo uruchamiasz izolowane profile, na przykład bota ratunkowego.
- `auth_secretref_unresolved`: nie udało się rozwiązać skonfigurowanego auth SecretRef dla celu, który zakończył się niepowodzeniem.
- `probe_scope_limited`: połączenie WebSocket się udało, ale sonda odczytu była ograniczona przez brak `operator.read`.

#### Zdalnie przez SSH (zgodność z aplikacją Mac)

Tryb „Remote over SSH” w aplikacji macOS używa lokalnego przekierowania portu, aby zdalne gateway (które może być powiązane tylko z loopback) stało się osiągalne pod `ws://127.0.0.1:<port>`.

Odpowiednik CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opcje:

- `--ssh <target>`: `user@host` lub `user@host:port` (port domyślnie `22`).
- `--ssh-identity <path>`: plik tożsamości.
- `--ssh-auto`: wybierz pierwszy wykryty host gateway jako cel SSH z rozwiązanego
  punktu końcowego wykrywania (`local.` plus skonfigurowana domena szerokoobszarowa, jeśli istnieje). Podpowiedzi tylko TXT
  są ignorowane.

Konfiguracja (opcjonalna, używana jako wartości domyślne):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Niskopoziomowy pomocnik RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Opcje:

- `--params <json>`: ciąg obiektu JSON dla parametrów (domyślnie `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Uwagi:

- `--params` musi być prawidłowym JSON-em.
- `--expect-final` jest przeznaczone głównie dla RPC w stylu agentów, które strumieniują zdarzenia pośrednie przed końcowym ładunkiem.

## Zarządzanie usługą Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Opcje poleceń:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Uwagi:

- `gateway install` obsługuje `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Gdy uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, `gateway install` sprawdza, czy SecretRef da się rozwiązać, ale nie zapisuje rozwiązanego tokenu w metadanych środowiska usługi.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef nie jest rozwiązany, instalacja kończy się bezpieczną odmową zamiast zapisywać zapasowy token jawnym tekstem.
- Dla uwierzytelniania hasłem w `gateway run` preferuj `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` lub oparte na SecretRef `gateway.auth.password` zamiast podawanego inline `--password`.
- W wywnioskowanym trybie uwierzytelniania samo powłokowe `OPENCLAW_GATEWAY_PASSWORD` nie łagodzi wymagań tokenu przy instalacji; przy instalowaniu zarządzanej usługi używaj trwałej konfiguracji (`gateway.auth.password` lub config `env`).
- Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja jest blokowana, dopóki tryb nie zostanie jawnie ustawiony.
- Polecenia cyklu życia akceptują `--json` do skryptów.

## Wykrywanie Gateway (Bonjour)

`gateway discover` skanuje w poszukiwaniu beaconów Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): wybierz domenę (przykład: `openclaw.internal.`) i skonfiguruj split DNS + serwer DNS; zobacz [/gateway/bonjour](/pl/gateway/bonjour)

Tylko gateway z włączonym wykrywaniem Bonjour (domyślnie) rozgłaszają beacon.

Rekordy wykrywania szerokoobszarowego zawierają (TXT):

- `role` (wskazówka roli gateway)
- `transport` (wskazówka transportu, np. `gateway`)
- `gatewayPort` (port WebSocket, zwykle `18789`)
- `sshPort` (opcjonalny; klienci domyślnie ustawiają cele SSH na `22`, gdy go brak)
- `tailnetDns` (nazwa hosta MagicDNS, gdy dostępna)
- `gatewayTls` / `gatewayTlsSha256` (włączony TLS + odcisk certyfikatu)
- `cliPath` (wskazówka zdalnej instalacji zapisana do strefy szerokoobszarowej)

### `gateway discover`

```bash
openclaw gateway discover
```

Opcje:

- `--timeout <ms>`: limit czasu per polecenie (browse/resolve); domyślnie `2000`.
- `--json`: wyjście czytelne maszynowo (wyłącza też stylizację/spinner).

Przykłady:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Uwagi:

- CLI skanuje `local.` oraz skonfigurowaną domenę szerokoobszarową, gdy jest włączona.
- `wsUrl` w wyjściu JSON jest wyprowadzany z rozwiązanego punktu końcowego usługi, a nie z podpowiedzi
  tylko TXT, takich jak `lanHost` lub `tailnetDns`.
- W `local.` mDNS `sshPort` i `cliPath` są rozgłaszane tylko wtedy, gdy
  `discovery.mdns.mode` ma wartość `full`. Wide-Area DNS-SD nadal zapisuje `cliPath`; `sshPort`
  również tam pozostaje opcjonalny.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Instrukcja operacyjna Gateway](/pl/gateway)
