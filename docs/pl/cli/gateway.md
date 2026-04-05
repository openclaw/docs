---
read_when:
    - Uruchamianie Gateway z CLI (dewelopersko lub na serwerach)
    - Debugowanie uwierzytelniania Gateway, trybów powiązania i łączności
    - Odkrywanie bram Gateway przez Bonjour (lokalne + szerokozasięgowe DNS-SD)
summary: OpenClaw Gateway CLI (`openclaw gateway`) — uruchamianie, wyszukiwanie i odkrywanie bram Gateway
title: gateway
x-i18n:
    generated_at: "2026-04-05T13:49:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: e311ded0dbad84b8212f0968f3563998d49c5e0eb292a0dc4b3bd3c22d4fa7f2
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Gateway to serwer WebSocket OpenClaw (kanały, węzły, sesje, hooki).

Podpolecenia na tej stronie są dostępne pod `openclaw gateway …`.

Powiązana dokumentacja:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Uruchamianie Gateway

Uruchom lokalny proces Gateway:

```bash
openclaw gateway
```

Alias uruchomienia na pierwszym planie:

```bash
openclaw gateway run
```

Uwagi:

- Domyślnie Gateway odmawia uruchomienia, jeśli w `~/.openclaw/openclaw.json` nie ustawiono `gateway.mode=local`. Użyj `--allow-unconfigured` do uruchomień ad hoc/deweloperskich.
- Oczekuje się, że `openclaw onboard --mode local` i `openclaw setup` zapiszą `gateway.mode=local`. Jeśli plik istnieje, ale brakuje `gateway.mode`, traktuj to jako uszkodzoną lub nadpisaną konfigurację i napraw ją zamiast domyślnie zakładać tryb lokalny.
- Jeśli plik istnieje i brakuje `gateway.mode`, Gateway traktuje to jako podejrzane uszkodzenie konfiguracji i odmawia „zgadywania local” za Ciebie.
- Powiązanie poza loopback bez uwierzytelniania jest blokowane (zabezpieczenie ochronne).
- `SIGUSR1` wywołuje restart w procesie, jeśli jest autoryzowany (`commands.restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby zablokować ręczny restart, podczas gdy narzędzie/config Gateway apply/update pozostają dozwolone).
- Procedury obsługi `SIGINT`/`SIGTERM` zatrzymują proces gateway, ale nie przywracają żadnego niestandardowego stanu terminala. Jeśli opakowujesz CLI za pomocą TUI lub wejścia w trybie raw, przywróć terminal przed zakończeniem.

### Opcje

- `--port <port>`: port WebSocket (domyślny pochodzi z config/env; zwykle `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: tryb powiązania nasłuchiwania.
- `--auth <token|password>`: nadpisanie trybu uwierzytelniania.
- `--token <token>`: nadpisanie tokenu (ustawia też `OPENCLAW_GATEWAY_TOKEN` dla procesu).
- `--password <password>`: nadpisanie hasła. Ostrzeżenie: hasła podane inline mogą być widoczne w lokalnych listach procesów.
- `--password-file <path>`: odczytaj hasło gateway z pliku.
- `--tailscale <off|serve|funnel>`: wystaw Gateway przez Tailscale.
- `--tailscale-reset-on-exit`: zresetuj konfigurację Tailscale serve/funnel przy zamknięciu.
- `--allow-unconfigured`: pozwól uruchomić gateway bez `gateway.mode=local` w konfiguracji. To omija zabezpieczenie uruchamiania tylko dla uruchomień bootstrap ad hoc/deweloperskich; nie zapisuje ani nie naprawia pliku konfiguracji.
- `--dev`: utwórz konfigurację deweloperską + workspace, jeśli brakuje (pomija `BOOTSTRAP.md`).
- `--reset`: zresetuj konfigurację deweloperską + poświadczenia + sesje + workspace (wymaga `--dev`).
- `--force`: zabij istniejący nasłuch na wybranym porcie przed uruchomieniem.
- `--verbose`: szczegółowe logi.
- `--cli-backend-logs`: pokazuj w konsoli tylko logi backendu CLI (i włącz stdout/stderr).
- `--claude-cli-logs`: przestarzały alias dla `--cli-backend-logs`.
- `--ws-log <auto|full|compact>`: styl logów websocket (domyślnie `auto`).
- `--compact`: alias dla `--ws-log compact`.
- `--raw-stream`: loguj surowe zdarzenia strumienia modelu do jsonl.
- `--raw-stream-path <path>`: ścieżka jsonl surowego strumienia.

## Wysyłanie zapytań do uruchomionej Gateway

Wszystkie polecenia zapytań używają WebSocket RPC.

Tryby wyjścia:

- Domyślny: czytelny dla człowieka (kolorowany w TTY).
- `--json`: JSON czytelny maszynowo (bez stylizacji/spinnera).
- `--no-color` (lub `NO_COLOR=1`): wyłącza ANSI przy zachowaniu układu dla ludzi.

Wspólne opcje (tam, gdzie są obsługiwane):

- `--url <url>`: adres URL WebSocket Gateway.
- `--token <token>`: token Gateway.
- `--password <password>`: hasło Gateway.
- `--timeout <ms>`: limit czasu/budżet (różni się w zależności od polecenia).
- `--expect-final`: czekaj na odpowiedź „final” (wywołania agentów).

Uwaga: po ustawieniu `--url` CLI nie używa już poświadczeń z konfiguracji ani ze środowiska.
Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway usage-cost`

Pobierz podsumowania kosztów użycia z logów sesji.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Opcje:

- `--days <days>`: liczba dni do uwzględnienia (domyślnie `30`).

### `gateway status`

`gateway status` pokazuje usługę Gateway (launchd/systemd/schtasks) oraz opcjonalną sondę RPC.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opcje:

- `--url <url>`: dodaj jawny cel sondy. Skonfigurowany zdalny adres i localhost nadal są sprawdzane.
- `--token <token>`: uwierzytelnianie tokenem dla sondy.
- `--password <password>`: uwierzytelnianie hasłem dla sondy.
- `--timeout <ms>`: limit czasu sondy (domyślnie `10000`).
- `--no-probe`: pomiń sondę RPC (widok tylko usługi).
- `--deep`: skanuj również usługi na poziomie systemu.
- `--require-rpc`: zwróć niezerowy kod zakończenia, gdy sonda RPC się nie powiedzie. Nie można łączyć z `--no-probe`.

Uwagi:

- `gateway status` pozostaje dostępne do diagnostyki nawet wtedy, gdy lokalna konfiguracja CLI jest nieobecna lub nieprawidłowa.
- `gateway status` rozwiązuje skonfigurowane auth SecretRef dla uwierzytelniania sondy, gdy to możliwe.
- Jeśli wymagany auth SecretRef nie zostanie rozwiązany na tej ścieżce polecenia, `gateway status --json` zgłasza `rpc.authWarning`, gdy zawiedzie łączność/uwierzytelnianie sondy; przekaż jawnie `--token`/`--password` lub najpierw rozwiąż źródło sekretu.
- Jeśli sonda powiedzie się, ostrzeżenia o nierozwiązanych auth-ref są ukrywane, aby uniknąć fałszywych alarmów.
- Używaj `--require-rpc` w skryptach i automatyzacji, gdy sama nasłuchująca usługa nie wystarcza i potrzebujesz, aby RPC Gateway rzeczywiście było zdrowe.
- `--deep` dodaje skanowanie best-effort w poszukiwaniu dodatkowych instalacji launchd/systemd/schtasks. Gdy wykryto wiele usług podobnych do gateway, wynik dla człowieka drukuje wskazówki dotyczące czyszczenia i ostrzega, że większość konfiguracji powinna uruchamiać jedną gateway na maszynę.
- Wynik dla człowieka zawiera rozwiązana ścieżkę logu pliku oraz migawkę ścieżek/poprawności konfiguracji CLI względem usługi, aby pomóc diagnozować dryf profilu lub katalogu stanu.
- W instalacjach Linux systemd sprawdzenia dryfu uwierzytelniania odczytują zarówno wartości `Environment=`, jak i `EnvironmentFile=` z jednostki (w tym `%h`, ścieżki w cudzysłowach, wiele plików oraz opcjonalne pliki `-`).
- Sprawdzenia dryfu rozwiązują SecretRef `gateway.auth.token` przy użyciu scalanego środowiska wykonawczego (najpierw środowisko polecenia usługi, potem awaryjnie środowisko procesu).
- Jeśli uwierzytelnianie tokenem nie jest faktycznie aktywne (jawne `gateway.auth.mode` ustawione na `password`/`none`/`trusted-proxy` albo tryb nieustawiony, gdzie może wygrać hasło i żaden kandydat na token nie może wygrać), sprawdzenia dryfu tokenu pomijają rozwiązywanie tokenu z konfiguracji.

### `gateway probe`

`gateway probe` to polecenie typu „debug everything”. Zawsze sonduje:

- skonfigurowaną zdalną gateway (jeśli ustawiona), oraz
- localhost (loopback) **nawet jeśli skonfigurowano zdalną**.

Jeśli przekażesz `--url`, ten jawny cel zostanie dodany przed obiema powyższymi pozycjami. Wynik dla człowieka oznacza
cele jako:

- `URL (explicit)`
- `Remote (configured)` lub `Remote (configured, inactive)`
- `Local loopback`

Jeśli dostępnych jest wiele gateway, wypisuje je wszystkie. Wiele gateway jest obsługiwanych, gdy używasz izolowanych profili/portów (np. rescue bot), ale większość instalacji nadal uruchamia pojedynczą gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretacja:

- `Reachable: yes` oznacza, że co najmniej jeden cel zaakceptował połączenie WebSocket.
- `RPC: ok` oznacza, że wywołania szczegółowego RPC (`health`/`status`/`system-presence`/`config.get`) również się powiodły.
- `RPC: limited - missing scope: operator.read` oznacza, że połączenie się powiodło, ale szczegółowe RPC ma ograniczony zakres. Jest to zgłaszane jako łączność **degraded**, a nie całkowita awaria.
- Kod zakończenia jest niezerowy tylko wtedy, gdy żaden sondowany cel nie jest dostępny.

Uwagi do JSON (`--json`):

- Poziom główny:
  - `ok`: co najmniej jeden cel jest dostępny.
  - `degraded`: co najmniej jeden cel miał ograniczone zakresem szczegółowe RPC.
  - `primaryTargetId`: najlepszy cel traktowany jako aktywny zwycięzca w tej kolejności: jawny URL, tunel SSH, skonfigurowany zdalny adres, następnie lokalny loopback.
  - `warnings[]`: rekordy ostrzeżeń best-effort z `code`, `message` i opcjonalnym `targetIds`.
  - `network`: wskazówki dotyczące adresów URL local loopback/tailnet wyprowadzone z bieżącej konfiguracji i sieci hosta.
  - `discovery.timeoutMs` i `discovery.count`: rzeczywisty budżet odkrywania/liczba wyników użyte dla tego przebiegu sondowania.
- Dla każdego celu (`targets[].connect`):
  - `ok`: osiągalność po połączeniu + klasyfikacja degraded.
  - `rpcOk`: pełny sukces szczegółowego RPC.
  - `scopeLimited`: szczegółowe RPC nie powiodło się z powodu braku zakresu operatora.

Typowe kody ostrzeżeń:

- `ssh_tunnel_failed`: konfiguracja tunelu SSH nie powiodła się; polecenie wróciło do bezpośrednich sond.
- `multiple_gateways`: więcej niż jeden cel był osiągalny; to nietypowe, chyba że celowo uruchamiasz izolowane profile, takie jak rescue bot.
- `auth_secretref_unresolved`: skonfigurowany auth SecretRef nie mógł zostać rozwiązany dla celu, który zakończył się niepowodzeniem.
- `probe_scope_limited`: połączenie WebSocket się powiodło, ale szczegółowe RPC było ograniczone przez brak `operator.read`.

#### Zdalnie przez SSH (zgodność z aplikacją Mac)

Tryb „Remote over SSH” w aplikacji macOS używa lokalnego przekierowania portu, dzięki czemu zdalna gateway (która może być powiązana tylko z loopback) staje się dostępna pod adresem `ws://127.0.0.1:<port>`.

Odpowiednik w CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opcje:

- `--ssh <target>`: `user@host` lub `user@host:port` (port domyślnie `22`).
- `--ssh-identity <path>`: plik tożsamości.
- `--ssh-auto`: wybierz pierwszy odkryty host gateway jako cel SSH z rozwiązanego punktu końcowego odkrywania (`local.` oraz skonfigurowana domena szerokozasięgowa, jeśli istnieje). Wskazówki tylko z TXT są ignorowane.

Konfiguracja (opcjonalna, używana jako domyślne wartości):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Niskopoziomowe narzędzie pomocnicze RPC.

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

- `--params` musi być prawidłowym JSON.
- `--expect-final` jest przeznaczone głównie dla RPC w stylu agentów, które wysyłają pośrednie zdarzenia przed końcowym ładunkiem.

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
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef nie jest rozwiązany, instalacja kończy się bezpieczną odmową zamiast zapisywać awaryjny token w postaci jawnego tekstu.
- W przypadku uwierzytelniania hasłem na `gateway run` preferuj `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` lub `gateway.auth.password` oparte na SecretRef zamiast inline `--password`.
- W trybie uwierzytelniania wywnioskowanego samo powłokowe `OPENCLAW_GATEWAY_PASSWORD` nie łagodzi wymagań tokenu przy instalacji; użyj trwałej konfiguracji (`gateway.auth.password` lub config `env`) podczas instalowania zarządzanej usługi.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja jest blokowana do czasu jawnego ustawienia trybu.
- Polecenia cyklu życia akceptują `--json` do użycia w skryptach.

## Odkrywanie bram Gateway (Bonjour)

`gateway discover` skanuje beacony Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): wybierz domenę (przykład: `openclaw.internal.`) i skonfiguruj split DNS + serwer DNS; zobacz [/gateway/bonjour](/gateway/bonjour)

Tylko gateway z włączonym odkrywaniem Bonjour (domyślnie włączone) reklamują beacon.

Rekordy odkrywania Wide-Area zawierają (TXT):

- `role` (wskazówka roli gateway)
- `transport` (wskazówka transportu, np. `gateway`)
- `gatewayPort` (port WebSocket, zwykle `18789`)
- `sshPort` (opcjonalnie; klienci domyślnie ustawiają cele SSH na `22`, gdy go nie ma)
- `tailnetDns` (nazwa hosta MagicDNS, jeśli dostępna)
- `gatewayTls` / `gatewayTlsSha256` (włączony TLS + fingerprint certyfikatu)
- `cliPath` (wskazówka zdalnej instalacji zapisana do strefy szerokozasięgowej)

### `gateway discover`

```bash
openclaw gateway discover
```

Opcje:

- `--timeout <ms>`: limit czasu na polecenie (browse/resolve); domyślnie `2000`.
- `--json`: wynik czytelny maszynowo (wyłącza też stylizację/spinner).

Przykłady:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Uwagi:

- CLI skanuje `local.` oraz skonfigurowaną domenę szerokozasięgową, gdy jest włączona.
- `wsUrl` w wyniku JSON jest wyprowadzany z rozwiązanego punktu końcowego usługi, a nie z samych wskazówek TXT, takich jak `lanHost` czy `tailnetDns`.
- W mDNS `local.` wartości `sshPort` i `cliPath` są rozgłaszane tylko wtedy, gdy
  `discovery.mdns.mode` ma wartość `full`. Wide-Area DNS-SD nadal zapisuje `cliPath`; `sshPort`
  również tam pozostaje opcjonalny.
