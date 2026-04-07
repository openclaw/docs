---
read_when:
    - Centrum rozwiązywania problemów skierowało Cię tutaj w celu głębszej diagnostyki
    - Potrzebujesz stabilnych sekcji podręcznika opartych na objawach z dokładnymi poleceniami
summary: Szczegółowy podręcznik rozwiązywania problemów dotyczących gateway, kanałów, automatyzacji, węzłów i przeglądarki
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-04-07T09:46:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0202e8858310a0bfc1c994cd37b01c3b2d6c73c8a74740094e92dc3c4c36729
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z gateway

Ta strona to szczegółowy podręcznik.
Zacznij od [/help/troubleshooting](/pl/help/troubleshooting), jeśli najpierw chcesz skorzystać z szybkiego przepływu triage.

## Drabina poleceń

Uruchom najpierw te polecenia, w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Oczekiwane sygnały zdrowego działania:

- `openclaw gateway status` pokazuje `Runtime: running` i `RPC probe: ok`.
- `openclaw doctor` nie zgłasza blokujących problemów z konfiguracją/usługą.
- `openclaw channels status --probe` pokazuje stan transportu dla każdego konta na żywo oraz,
  tam gdzie jest to obsługiwane, wyniki probe/audytu, takie jak `works` lub `audit ok`.

## Anthropic 429: dodatkowe użycie wymagane dla długiego kontekstu

Użyj tego, gdy logi/błędy zawierają:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Poszukaj:

- Wybrany model Anthropic Opus/Sonnet ma `params.context1m: true`.
- Bieżące poświadczenie Anthropic nie kwalifikuje się do użycia długiego kontekstu.
- Żądania zawodzą tylko w długich sesjach/uruchomieniach modelu, które wymagają ścieżki beta 1M.

Opcje naprawy:

1. Wyłącz `context1m` dla tego modelu, aby wrócić do zwykłego okna kontekstu.
2. Użyj poświadczenia Anthropic, które kwalifikuje się do żądań długiego kontekstu, albo przełącz się na klucz API Anthropic.
3. Skonfiguruj modele zapasowe, aby uruchomienia były kontynuowane, gdy żądania Anthropic dla długiego kontekstu są odrzucane.

Powiązane:

- [/providers/anthropic](/pl/providers/anthropic)
- [/reference/token-use](/pl/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/pl/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Brak odpowiedzi

Jeśli kanały działają, ale nic nie odpowiada, sprawdź routing i zasady przed ponownym łączeniem czegokolwiek.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Poszukaj:

- Oczekującego parowania dla nadawców DM.
- Bramek wzmianek w grupie (`requireMention`, `mentionPatterns`).
- Niezgodności list dozwolonych kanałów/grup.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa ignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez zasady.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/pairing](/pl/channels/pairing)
- [/channels/groups](/pl/channels/groups)

## Łączność dashboard/control UI

Gdy dashboard/control UI nie chce się połączyć, zweryfikuj URL, tryb auth i założenia dotyczące secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Poszukaj:

- Prawidłowego adresu probe i adresu dashboard.
- Niezgodności trybu auth/tokenu między klientem a gateway.
- Użycia HTTP tam, gdzie wymagana jest tożsamość urządzenia.

Typowe sygnatury:

- `device identity required` → niebezpieczny kontekst lub brak auth urządzenia.
- `origin not allowed` → `Origin` przeglądarki nie znajduje się w `gateway.controlUi.allowedOrigins`
  (albo łączysz się z pochodzenia przeglądarki innego niż loopback bez jawnej
  listy dozwolonych).
- `device nonce required` / `device nonce mismatch` → klient nie kończy
  przepływu auth urządzenia opartego na wyzwaniu (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klient podpisał niewłaściwy
  ładunek (albo użył nieaktualnego znacznika czasu) dla bieżącego handshake.
- `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną ponowną próbę z buforowanym tokenem urządzenia.
- Ta ponowna próba z buforowanym tokenem ponownie używa buforowanego zestawu zakresów przechowywanego z sparowanym
  tokenem urządzenia. Wywołania z jawnym `deviceToken` / jawnymi `scopes` zachowują
  swój żądany zestaw zakresów.
- Poza tą ścieżką ponownej próby kolejność auth przy połączeniu to najpierw jawny współdzielony
  token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia,
  a na końcu token bootstrap.
- W asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego
  `{scope, ip}` są serializowane, zanim limiter zarejestruje niepowodzenie. Dwie błędne
  równoczesne ponowne próby od tego samego klienta mogą więc skutkować komunikatem `retry later`
  przy drugiej próbie zamiast dwóch zwykłych niezgodności.
- `too many failed authentication attempts (retry later)` z klienta loopback
  o pochodzeniu przeglądarki → powtarzające się niepowodzenia z tego samego znormalizowanego `Origin` są tymczasowo blokowane; inne pochodzenie localhost używa oddzielnego bucketu.
- powtarzające się `unauthorized` po tej ponownej próbie → rozjazd współdzielonego tokenu/tokenu urządzenia; odśwież konfigurację tokenu i ponownie zatwierdź/obróć token urządzenia, jeśli to potrzebne.
- `gateway connect failed:` → nieprawidłowy host/port/docelowy URL.

### Szybka mapa kodów szczegółów auth

Użyj `error.details.code` z nieudanego response `connect`, aby wybrać następne działanie:

| Detail code                  | Meaning                                                     | Recommended action                                                                                                                                                                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klient nie wysłał wymaganego współdzielonego tokenu.        | Wklej/ustaw token w kliencie i spróbuj ponownie. Dla ścieżek dashboard: `openclaw config get gateway.auth.token`, a następnie wklej do ustawień Control UI.                                                                                                                               |
| `AUTH_TOKEN_MISMATCH`        | Współdzielony token nie pasował do tokenu auth gateway.     | Jeśli `canRetryWithDeviceToken=true`, pozwól na jedną zaufaną ponowną próbę. Ponowne próby z buforowanym tokenem używają zapisanych zatwierdzonych zakresów; wywołania z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal się nie udaje, uruchom [listę kontrolną odzyskiwania po rozjeździe tokenu](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Buforowany token per urządzenie jest nieaktualny lub cofnięty. | Obróć/ponownie zatwierdź token urządzenia za pomocą [CLI urządzeń](/cli/devices), a następnie połącz ponownie.                                                                                                                                                                             |
| `PAIRING_REQUIRED`           | Tożsamość urządzenia jest znana, ale niezatwierdzona dla tej roli. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`.                                                                                                                                                                                 |

Kontrola migracji auth urządzeń v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jeśli logi pokazują błędy nonce/signature, zaktualizuj klienta łączącego się i zweryfikuj, że:

1. czeka na `connect.challenge`
2. podpisuje ładunek związany z wyzwaniem
3. wysyła `connect.params.device.nonce` z tym samym nonce wyzwania

Jeśli `openclaw devices rotate` / `revoke` / `remove` jest nieoczekiwanie odrzucane:

- sesje tokenów sparowanych urządzeń mogą zarządzać tylko **własnym** urządzeniem, chyba że
  wywołujący ma również `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko takich zakresów operatora,
  które sesja wywołująca już posiada

Powiązane:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/pl/gateway/configuration) (tryby auth gateway)
- [/gateway/trusted-proxy-auth](/pl/gateway/trusted-proxy-auth)
- [/gateway/remote](/pl/gateway/remote)
- [/cli/devices](/cli/devices)

## Usługa gateway nie działa

Użyj tego, gdy usługa jest zainstalowana, ale proces nie utrzymuje się w działaniu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # skanuje też usługi na poziomie systemu
```

Poszukaj:

- `Runtime: stopped` ze wskazówkami dotyczącymi zakończenia.
- Niezgodności konfiguracji usługi (`Config (cli)` vs `Config (service)`).
- Konfliktów portów/listenerów.
- Dodatkowych instalacji launchd/systemd/schtasks, gdy użyto `--deep`.
- Wskazówek czyszczenia `Other gateway-like services detected (best effort)`.

Typowe sygnatury:

- `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → lokalny tryb gateway nie jest włączony albo plik konfiguracji został nadpisany i utracił `gateway.mode`. Naprawa: ustaw `gateway.mode="local"` w konfiguracji albo uruchom ponownie `openclaw onboard --mode local` / `openclaw setup`, aby ponownie zapisać oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślną ścieżką konfiguracji jest `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → powiązanie inne niż loopback bez prawidłowej ścieżki auth gateway (token/hasło lub trusted-proxy, jeśli skonfigurowano).
- `another gateway instance is already listening` / `EADDRINUSE` → konflikt portu.
- `Other gateway-like services detected (best effort)` → istnieją nieaktualne lub równoległe jednostki launchd/systemd/schtasks. Większość konfiguracji powinna utrzymywać jeden gateway na maszynę; jeśli rzeczywiście potrzebujesz więcej niż jednego, odizoluj porty + konfigurację/stan/workspace. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).

Powiązane:

- [/gateway/background-process](/pl/gateway/background-process)
- [/gateway/configuration](/pl/gateway/configuration)
- [/gateway/doctor](/pl/gateway/doctor)

## Ostrzeżenia probe gateway

Użyj tego, gdy `openclaw gateway probe` do czegoś dociera, ale nadal wyświetla blok ostrzeżenia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Poszukaj:

- `warnings[].code` i `primaryTargetId` w wyjściu JSON.
- Czy ostrzeżenie dotyczy zapasowej ścieżki SSH, wielu gateway, brakujących zakresów czy nierozwiązanych odwołań auth.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal próbowało bezpośrednich skonfigurowanych/docelowych loopback.
- `multiple reachable gateways detected` → odpowiedziało więcej niż jedno miejsce docelowe. Zwykle oznacza to zamierzoną konfigurację wielu gateway albo nieaktualne/zduplikowane listenery.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie działa, ale szczegóły RPC są ograniczone zakresem; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- nierozwiązany tekst ostrzeżenia `gateway.auth.*` / `gateway.remote.*` SecretRef → materiał auth był niedostępny w tej ścieżce polecenia dla nieudanego celu.

Powiązane:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host)
- [/gateway/remote](/pl/gateway/remote)

## Kanał jest połączony, ale wiadomości nie płyną

Jeśli stan kanału pokazuje połączenie, ale przepływ wiadomości nie działa, skup się na zasadach, uprawnieniach i regułach dostarczania specyficznych dla kanału.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Poszukaj:

- Zasad DM (`pairing`, `allowlist`, `open`, `disabled`).
- Listy dozwolonych grup i wymagań wzmianek.
- Brakujących uprawnień/zakresów API kanału.

Typowe sygnatury:

- `mention required` → wiadomość zignorowana przez zasady wzmianek grupowych.
- ślady `pairing` / oczekującego zatwierdzenia → nadawca nie jest zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z auth/uprawnieniami kanału.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/whatsapp](/pl/channels/whatsapp)
- [/channels/telegram](/pl/channels/telegram)
- [/channels/discord](/pl/channels/discord)

## Dostarczanie cron i heartbeat

Jeśli cron lub heartbeat nie uruchomiły się albo nic nie dostarczyły, najpierw zweryfikuj stan harmonogramu, a potem cel dostarczania.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Poszukaj:

- Włączonego cron i obecności następnego wybudzenia.
- Statusu historii uruchomień zadania (`ok`, `skipped`, `error`).
- Powodów pominięcia heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Typowe sygnatury:

- `cron: scheduler disabled; jobs will not run automatically` → cron wyłączony.
- `cron: timer tick failed` → tick harmonogramu nie powiódł się; sprawdź błędy pliku/logów/runtime.
- `heartbeat skipped` z `reason=quiet-hours` → poza oknem aktywnych godzin.
- `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste linie / nagłówki markdown, więc OpenClaw pomija wywołanie modelu.
- `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne zadania nie są należne przy tym ticku.
- `heartbeat: unknown accountId` → nieprawidłowy account id dla celu dostarczania heartbeat.
- `heartbeat skipped` z `reason=dm-blocked` → cel heartbeat został rozwiązany do miejsca docelowego w stylu DM, podczas gdy `agents.defaults.heartbeat.directPolicy` (lub nadpisanie per agent) ma wartość `block`.

Powiązane:

- [/automation/cron-jobs#troubleshooting](/pl/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/pl/automation/cron-jobs)
- [/gateway/heartbeat](/pl/gateway/heartbeat)

## Narzędzie sparowanego węzła nie działa

Jeśli węzeł jest sparowany, ale narzędzia nie działają, odizoluj stan pierwszego planu, uprawnień i zatwierdzeń.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Poszukaj:

- Czy węzeł jest online i ma oczekiwane możliwości.
- Czy przyznano uprawnienia systemu operacyjnego do kamery/mikrofonu/lokalizacji/ekranu.
- Stanu zatwierdzeń exec i listy dozwolonych.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja węzła musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brak wymaganego uprawnienia systemowego.
- `SYSTEM_RUN_DENIED: approval required` → oczekujące zatwierdzenie exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez listę dozwolonych.

Powiązane:

- [/nodes/troubleshooting](/pl/nodes/troubleshooting)
- [/nodes/index](/pl/nodes/index)
- [/tools/exec-approvals](/pl/tools/exec-approvals)

## Narzędzie przeglądarki nie działa

Użyj tego, gdy działania narzędzia przeglądarki zawodzą, mimo że sam gateway działa poprawnie.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Poszukaj:

- Czy `plugins.allow` jest ustawione i zawiera `browser`.
- Prawidłowej ścieżki do pliku wykonywalnego przeglądarki.
- Osiągalności profilu CDP.
- Dostępności lokalnego Chrome dla profili `existing-session` / `user`.

Typowe sygnatury:

- `unknown command "browser"` lub `unknown command 'browser'` → dołączony plugin przeglądarki jest wykluczony przez `plugins.allow`.
- brak / niedostępność narzędzia przeglądarki przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc plugin nigdy się nie załadował.
- `Failed to start Chrome CDP on port` → proces przeglądarki nie uruchomił się.
- `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
- `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` lub `ftp:`.
- `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma błędny lub spoza zakresu port.
- `No Chrome tabs found for profile="user"` → profil dołączania Chrome MCP nie ma otwartych lokalnych kart Chrome.
- `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny endpoint CDP jest nieosiągalny z hosta gateway.
- `Browser attachOnly is enabled ... not reachable` lub `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko-do-dołączenia nie ma osiągalnego celu albo endpoint HTTP odpowiedział, ale nadal nie udało się otworzyć WebSocket CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja gateway nie zawiera pełnego pakietu Playwright; migawki ARIA i podstawowe zrzuty ekranu strony nadal mogą działać, ale nawigacja, migawki AI, zrzuty ekranu elementów według selektorów CSS i eksport PDF pozostają niedostępne.
- `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu połączyło `--full-page` z `--ref` lub `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwycenia strony albo `--ref` z migawki, a nie CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooki przesyłania plików Chrome MCP wymagają odwołań do migawek, a nie selektorów CSS.
- `existing-session file uploads currently support one file at a time.` → w profilach Chrome MCP wysyłaj jedno przesłanie na wywołanie.
- `existing-session dialog handling does not support timeoutMs.` → hooki dialogów w profilach Chrome MCP nie obsługują nadpisania timeoutów.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki albo surowego profilu CDP.
- nieaktualne nadpisania viewport / dark-mode / locale / offline w profilach tylko-do-dołączenia lub zdalnego CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez restartowania całego gateway.

Powiązane:

- [/tools/browser-linux-troubleshooting](/pl/tools/browser-linux-troubleshooting)
- [/tools/browser](/pl/tools/browser)

## Jeśli po aktualizacji coś nagle przestało działać

Większość problemów po aktualizacji wynika z rozjazdu konfiguracji albo z bardziej rygorystycznie egzekwowanych wartości domyślnych.

### 1) Zmieniło się zachowanie auth i nadpisywania URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Co sprawdzić:

- Jeśli `gateway.mode=remote`, wywołania CLI mogą trafiać zdalnie, mimo że lokalna usługa działa poprawnie.
- Jawne wywołania `--url` nie wracają do zapisanych poświadczeń.

Typowe sygnatury:

- `gateway connect failed:` → nieprawidłowy docelowy URL.
- `unauthorized` → endpoint jest osiągalny, ale auth jest błędne.

### 2) Guardraile bind i auth są bardziej rygorystyczne

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Co sprawdzić:

- Powiązania inne niż loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki auth gateway: współdzielonego auth tokenem/hasłem albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` bez loopback.
- Stare klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

Typowe sygnatury:

- `refusing to bind gateway ... without auth` → powiązanie inne niż loopback bez prawidłowej ścieżki auth gateway.
- `RPC probe: failed` mimo że runtime działa → gateway działa, ale jest niedostępny przy bieżącym auth/url.

### 3) Zmienił się stan parowania i tożsamości urządzenia

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Co sprawdzić:

- Oczekujące zatwierdzenia urządzeń dla dashboard/węzłów.
- Oczekujące zatwierdzenia parowania DM po zmianach zasad lub tożsamości.

Typowe sygnatury:

- `device identity required` → auth urządzenia nie jest spełnione.
- `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

Jeśli po sprawdzeniu konfiguracja usługi i runtime nadal się nie zgadzają, zainstaluj ponownie metadane usługi z tego samego katalogu profilu/stanu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane:

- [/gateway/pairing](/pl/gateway/pairing)
- [/gateway/authentication](/pl/gateway/authentication)
- [/gateway/background-process](/pl/gateway/background-process)
