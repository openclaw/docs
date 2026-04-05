---
read_when:
    - Hub rozwiązywania problemów skierował Cię tutaj w celu głębszej diagnostyki
    - Potrzebujesz stabilnych sekcji runbooka opartych na objawach z dokładnymi poleceniami
summary: Szczegółowy runbook rozwiązywania problemów dla gateway, kanałów, automatyzacji, węzłów i przeglądarki
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-04-05T13:55:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 028226726e6adc45ca61d41510a953c4e21a3e85f3082af9e8085745c6ac3ec1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z Gateway

Ta strona to szczegółowy runbook.
Zacznij od [/help/troubleshooting](/help/troubleshooting), jeśli najpierw chcesz przejść szybki przepływ triage.

## Drabina poleceń

Uruchom najpierw te polecenia, w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Oczekiwane sygnały zdrowego stanu:

- `openclaw gateway status` pokazuje `Runtime: running` oraz `RPC probe: ok`.
- `openclaw doctor` nie zgłasza blokujących problemów z konfiguracją/usługą.
- `openclaw channels status --probe` pokazuje aktywny stan transportu dla poszczególnych kont oraz,
  tam gdzie to obsługiwane, wyniki probe/audytu, takie jak `works` lub `audit ok`.

## Anthropic 429 extra usage required for long context

Użyj tego, gdy logi/błędy zawierają:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Sprawdź:

- Wybrany model Anthropic Opus/Sonnet ma `params.context1m: true`.
- Bieżące poświadczenie Anthropic nie kwalifikuje się do użycia długiego kontekstu.
- Żądania kończą się błędem tylko w długich sesjach/uruchomieniach modelu, które wymagają ścieżki beta 1M.

Możliwe rozwiązania:

1. Wyłącz `context1m` dla tego modelu, aby wrócić do normalnego okna kontekstu.
2. Użyj klucza API Anthropic z rozliczaniem albo włącz Anthropic Extra Usage na koncie OAuth/subskrypcji Anthropic.
3. Skonfiguruj modele zapasowe, aby uruchomienia były kontynuowane, gdy żądania Anthropic z długim kontekstem są odrzucane.

Powiązane:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Brak odpowiedzi

Jeśli kanały działają, ale nic nie odpowiada, sprawdź routing i politykę, zanim ponownie połączysz cokolwiek.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Sprawdź:

- Oczekujące parowanie dla nadawców DM.
- Bramka wzmianek w grupach (`requireMention`, `mentionPatterns`).
- Niedopasowania list dozwolonych kanału/grupy.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa jest ignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez politykę.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/pairing](/pl/channels/pairing)
- [/channels/groups](/pl/channels/groups)

## Łączność dashboard/control UI

Gdy dashboard/control UI nie może się połączyć, sprawdź URL, tryb uwierzytelniania i założenia dotyczące bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Sprawdź:

- Poprawny probe URL i URL dashboardu.
- Niedopasowanie trybu uwierzytelniania/tokenu między klientem a gateway.
- Użycie HTTP tam, gdzie wymagana jest tożsamość urządzenia.

Typowe sygnatury:

- `device identity required` → niezabezpieczony kontekst lub brak uwierzytelnienia urządzenia.
- `origin not allowed` → `Origin` przeglądarki nie znajduje się w `gateway.controlUi.allowedOrigins`
  (albo łączysz się z origin przeglądarki spoza loopback bez jawnej
  listy dozwolonych).
- `device nonce required` / `device nonce mismatch` → klient nie kończy
  przepływu uwierzytelniania urządzenia opartego na wyzwaniu (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klient podpisał niewłaściwy
  ładunek (albo użył nieaktualnego znacznika czasu) dla bieżącego handshake.
- `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną ponowną próbę z buforowanym tokenem urządzenia.
- Ta ponowna próba z użyciem buforowanego tokenu wykorzystuje ponownie zestaw zakresów zapisany z zatwierdzonym
  tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują
  żądany zestaw zakresów.
- Poza tą ścieżką ponownej próby pierwszeństwo uwierzytelniania przy połączeniu jest następujące: jawny współdzielony
  token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia,
  potem token bootstrap.
- Na asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego
  `{scope, ip}` są serializowane, zanim limiter zarejestruje błąd. Dwie błędne
  równoczesne ponowne próby od tego samego klienta mogą więc spowodować `retry later`
  przy drugiej próbie zamiast dwóch zwykłych niedopasowań.
- `too many failed authentication attempts (retry later)` od klienta loopback pochodzącego z origin przeglądarki
  → powtarzane nieudane próby z tego samego znormalizowanego `Origin` są tymczasowo blokowane; inny localhost origin używa osobnego bucket.
- powtarzające się `unauthorized` po tej ponownej próbie → rozjechanie współdzielonego tokenu/tokenu urządzenia; odśwież konfigurację tokenu i ponownie zatwierdź/obróć token urządzenia, jeśli potrzeba.
- `gateway connect failed:` → zły cel hosta/portu/URL.

### Szybka mapa kodów szczegółów auth

Użyj `error.details.code` z nieudanego `connect`, aby wybrać następne działanie:

| Kod szczegółu                | Znaczenie                                              | Zalecane działanie                                                                                                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | Klient nie wysłał wymaganego współdzielonego tokenu.   | Wklej/ustaw token w kliencie i spróbuj ponownie. Dla ścieżek dashboardu: `openclaw config get gateway.auth.token`, a następnie wklej go do ustawień Control UI.                                                                                                                        |
| `AUTH_TOKEN_MISMATCH`        | Współdzielony token nie pasował do tokenu auth gateway. | Jeśli `canRetryWithDeviceToken=true`, pozwól na jedną zaufaną ponowną próbę. Ponowne próby z buforowanym tokenem wykorzystują zapisane zatwierdzone zakresy; wywołujący z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal występuje błąd, uruchom [checklistę odzyskiwania po rozjechaniu tokenów](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Buforowany token per urządzenie jest nieaktualny lub unieważniony. | Obróć/ponownie zatwierdź token urządzenia za pomocą [devices CLI](/cli/devices), a następnie połącz się ponownie.                                                                                                                                                                         |
| `PAIRING_REQUIRED`           | Tożsamość urządzenia jest znana, ale niezatwierdzona dla tej roli. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`.                                                                                                                                                                               |

Sprawdzenie migracji device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jeśli logi pokazują błędy nonce/podpisu, zaktualizuj łączącego się klienta i sprawdź, czy:

1. czeka na `connect.challenge`
2. podpisuje ładunek powiązany z wyzwaniem
3. wysyła `connect.params.device.nonce` z tym samym nonce wyzwania

Jeśli `openclaw devices rotate` / `revoke` / `remove` jest nieoczekiwanie odrzucane:

- sesje tokenów sparowanych urządzeń mogą zarządzać tylko **własnym** urządzeniem, chyba że
  wywołujący ma także `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko takich zakresów operatora,
  które sesja wywołująca już posiada

Powiązane:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/gateway/configuration) (tryby uwierzytelniania gateway)
- [/gateway/trusted-proxy-auth](/gateway/trusted-proxy-auth)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Usługa Gateway nie działa

Użyj tego, gdy usługa jest zainstalowana, ale proces nie pozostaje uruchomiony.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # skanuj też usługi na poziomie systemu
```

Sprawdź:

- `Runtime: stopped` ze wskazówkami dotyczącymi wyjścia.
- Niedopasowanie konfiguracji usługi (`Config (cli)` vs `Config (service)`).
- Konflikty portów/listenerów.
- Dodatkowe instalacje launchd/systemd/schtasks przy użyciu `--deep`.
- Wskazówki czyszczenia `Other gateway-like services detected (best effort)`.

Typowe sygnatury:

- `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → lokalny tryb gateway nie jest włączony albo plik konfiguracji został nadpisany i utracił `gateway.mode`. Naprawa: ustaw `gateway.mode="local"` w konfiguracji albo ponownie uruchom `openclaw onboard --mode local` / `openclaw setup`, aby ponownie zapisać oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślną ścieżką konfiguracji jest `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → powiązanie spoza loopback bez prawidłowej ścieżki uwierzytelniania gateway (token/hasło albo trusted-proxy tam, gdzie skonfigurowano).
- `another gateway instance is already listening` / `EADDRINUSE` → konflikt portów.
- `Other gateway-like services detected (best effort)` → istnieją nieaktualne lub równoległe jednostki launchd/systemd/schtasks. W większości konfiguracji powinna działać jedna gateway na maszynę; jeśli rzeczywiście potrzebujesz więcej niż jednej, odizoluj porty + config/state/workspace. Zobacz [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host).

Powiązane:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Ostrzeżenia probe Gateway

Użyj tego, gdy `openclaw gateway probe` dociera do celu, ale nadal wypisuje blok ostrzeżenia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Sprawdź:

- `warnings[].code` i `primaryTargetId` w danych wyjściowych JSON.
- Czy ostrzeżenie dotyczy awaryjnego przejścia na SSH, wielu gateway, brakujących zakresów czy nierozwiązanych auth ref.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH się nie powiodła, ale polecenie nadal próbowało bezpośrednich skonfigurowanych/celów loopback.
- `multiple reachable gateways detected` → odpowiedział więcej niż jeden cel. Zwykle oznacza to celową konfigurację wielu gateway albo nieaktualne/zduplikowane listenery.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie się udało, ale szczegółowe RPC ma ograniczony zakres; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- nierozwiązany tekst ostrzeżenia `gateway.auth.*` / `gateway.remote.*` SecretRef → materiał uwierzytelniający był niedostępny na tej ścieżce polecenia dla nieudanego celu.

Powiązane:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)
- [/gateway/remote](/gateway/remote)

## Kanał połączony, ale wiadomości nie przepływają

Jeśli stan kanału jest połączony, ale przepływ wiadomości nie działa, skup się na polityce, uprawnieniach i regułach dostarczania specyficznych dla kanału.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Sprawdź:

- Politykę DM (`pairing`, `allowlist`, `open`, `disabled`).
- Listę dozwolonych grup i wymagania dotyczące wzmianek.
- Brakujące uprawnienia/zakresy API kanału.

Typowe sygnatury:

- `mention required` → wiadomość ignorowana przez politykę wymuszającą wzmiankę w grupie.
- `pairing` / ślady oczekującego zatwierdzenia → nadawca nie jest zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z uwierzytelnianiem/uprawnieniami kanału.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/whatsapp](/pl/channels/whatsapp)
- [/channels/telegram](/pl/channels/telegram)
- [/channels/discord](/pl/channels/discord)

## Dostarczanie cron i heartbeat

Jeśli cron lub heartbeat nie uruchomił się albo nie dostarczył wiadomości, najpierw sprawdź stan harmonogramu, a potem cel dostarczenia.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Sprawdź:

- Czy cron jest włączony i czy istnieje następne wybudzenie.
- Status historii uruchomień zadania (`ok`, `skipped`, `error`).
- Powody pominięcia heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Typowe sygnatury:

- `cron: scheduler disabled; jobs will not run automatically` → cron jest wyłączony.
- `cron: timer tick failed` → błąd tyknięcia harmonogramu; sprawdź błędy plików/logów/runtime.
- `heartbeat skipped` z `reason=quiet-hours` → poza oknem aktywnych godzin.
- `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste linie / nagłówki markdown, więc OpenClaw pomija wywołanie modelu.
- `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne zadanie nie jest należne przy tym tyknięciu.
- `heartbeat: unknown accountId` → nieprawidłowy account id dla celu dostarczania heartbeat.
- `heartbeat skipped` z `reason=dm-blocked` → cel heartbeat został rozwiązany do miejsca docelowego w stylu DM, podczas gdy `agents.defaults.heartbeat.directPolicy` (lub nadpisanie per agent) jest ustawione na `block`.

Powiązane:

- [/automation/cron-jobs#troubleshooting](/pl/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/pl/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## Narzędzie sparowanego węzła kończy się błędem

Jeśli węzeł jest sparowany, ale narzędzia kończą się błędem, wyizoluj stan pierwszego planu, uprawnienia i zatwierdzenia.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Sprawdź:

- Czy węzeł jest online i ma oczekiwane możliwości.
- Przyznane przez system operacyjny uprawnienia do kamery/mikrofonu/lokalizacji/ekranu.
- Stan zatwierdzeń exec i listy dozwolonych.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja węzła musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brak uprawnienia systemowego.
- `SYSTEM_RUN_DENIED: approval required` → oczekujące zatwierdzenie exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez listę dozwolonych.

Powiązane:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## Narzędzie przeglądarki kończy się błędem

Użyj tego, gdy działania narzędzia przeglądarki kończą się błędem, mimo że sama gateway działa poprawnie.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Sprawdź:

- Czy `plugins.allow` jest ustawione i zawiera `browser`.
- Prawidłową ścieżkę do pliku wykonywalnego przeglądarki.
- Osiągalność profilu CDP.
- Dostępność lokalnego Chrome dla profili `existing-session` / `user`.

Typowe sygnatury:

- `unknown command "browser"` lub `unknown command 'browser'` → bundlowany plugin przeglądarki jest wykluczony przez `plugins.allow`.
- brak/nieobecność narzędzia przeglądarki przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc plugin nigdy się nie załadował.
- `Failed to start Chrome CDP on port` → proces przeglądarki nie uruchomił się.
- `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
- `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` lub `ftp:`.
- `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma nieprawidłowy lub wykraczający poza zakres port.
- `No Chrome tabs found for profile="user"` → profil dołączenia Chrome MCP nie ma otwartych lokalnych kart Chrome.
- `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny endpoint CDP nie jest osiągalny z hosta gateway.
- `Browser attachOnly is enabled ... not reachable` lub `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko-dołączenie nie ma osiągalnego celu albo endpoint HTTP odpowiedział, ale nadal nie udało się otworzyć WebSocketu CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja gateway nie zawiera pełnego pakietu Playwright; snapshoty ARIA i podstawowe zrzuty ekranu stron mogą nadal działać, ale nawigacja, snapshoty AI, zrzuty elementów według selektorów CSS i eksport PDF pozostają niedostępne.
- `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu połączyło `--full-page` z `--ref` lub `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwycenia strony albo `--ref` ze snapshotu, a nie CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooki przesyłania plików Chrome MCP wymagają ref ze snapshotu, a nie selektorów CSS.
- `existing-session file uploads currently support one file at a time.` → wysyłaj jeden upload na wywołanie w profilach Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hooki dialogów w profilach Chrome MCP nie obsługują nadpisań timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki albo surowego profilu CDP.
- nieaktualne nadpisania viewport/dark-mode/locale/offline w profilach tylko-dołączenie lub zdalnych profilach CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez restartowania całej gateway.

Powiązane:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## Jeśli po aktualizacji coś nagle się zepsuło

Większość problemów po aktualizacji wynika z dryfu konfiguracji albo z bardziej rygorystycznych ustawień domyślnych, które są teraz egzekwowane.

### 1) Zmieniło się zachowanie auth i nadpisywania URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Co sprawdzić:

- Jeśli `gateway.mode=remote`, wywołania CLI mogą trafiać do zdalnego celu, podczas gdy lokalna usługa działa poprawnie.
- Jawne wywołania `--url` nie wracają do zapisanych poświadczeń.

Typowe sygnatury:

- `gateway connect failed:` → zły URL docelowy.
- `unauthorized` → endpoint jest osiągalny, ale uwierzytelnienie jest błędne.

### 2) Guardrails dla bind i auth są bardziej rygorystyczne

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Co sprawdzić:

- Powiązania spoza loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki uwierzytelniania gateway: współdzielonego uwierzytelniania tokenem/hasłem albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` spoza loopback.
- Starsze klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

Typowe sygnatury:

- `refusing to bind gateway ... without auth` → powiązanie spoza loopback bez prawidłowej ścieżki auth gateway.
- `RPC probe: failed` przy działającym runtime → gateway działa, ale jest niedostępna przy bieżącym auth/url.

### 3) Zmienił się stan parowania i tożsamości urządzenia

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Co sprawdzić:

- Oczekujące zatwierdzenia urządzeń dla dashboardu/węzłów.
- Oczekujące zatwierdzenia parowania DM po zmianach polityki lub tożsamości.

Typowe sygnatury:

- `device identity required` → uwierzytelnianie urządzenia nie zostało spełnione.
- `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

Jeśli konfiguracja usługi i runtime nadal się różnią po tych sprawdzeniach, zainstaluj ponownie metadane usługi z tego samego katalogu profilu/stanu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
