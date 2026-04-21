---
read_when:
    - Hub rozwiązywania problemów skierował Cię tutaj w celu głębszej diagnozy
    - Potrzebujesz stabilnych sekcji runbooka opartych na objawach z dokładnymi poleceniami
summary: Szczegółowy runbook rozwiązywania problemów dla Gateway, kanałów, automatyzacji, Node i browser
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-04-21T09:54:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: add7625785e3b78897c750b4785b7fe84a3d91c23c4175de750c4834272967f9
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z Gateway

Ta strona to szczegółowy runbook.
Jeśli najpierw chcesz przejść przez szybki przepływ triage, zacznij od [/help/troubleshooting](/pl/help/troubleshooting).

## Sekwencja poleceń

Najpierw uruchom te polecenia, w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Oczekiwane oznaki prawidłowego stanu:

- `openclaw gateway status` pokazuje `Runtime: running`, `Connectivity probe: ok` oraz linię `Capability: ...`.
- `openclaw doctor` nie zgłasza blokujących problemów z konfiguracją/usługą.
- `openclaw channels status --probe` pokazuje aktywny stan transportu dla każdego konta oraz,
  tam gdzie to obsługiwane, wyniki probe/audytu, takie jak `works` lub `audit ok`.

## Anthropic 429: wymagane dodatkowe użycie dla długiego kontekstu

Użyj tego, gdy logi/błędy zawierają:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Szukaj:

- Wybrany model Anthropic Opus/Sonnet ma ustawione `params.context1m: true`.
- Bieżące poświadczenie Anthropic nie kwalifikuje się do użycia długiego kontekstu.
- Żądania kończą się błędem tylko w długich sesjach/uruchomieniach modelu, które wymagają ścieżki beta 1M.

Możliwe poprawki:

1. Wyłącz `context1m` dla tego modelu, aby wrócić do normalnego okna kontekstu.
2. Użyj poświadczenia Anthropic, które kwalifikuje się do żądań długiego kontekstu, albo przełącz się na klucz API Anthropic.
3. Skonfiguruj modele zapasowe, aby uruchomienia były kontynuowane, gdy żądania długiego kontekstu Anthropic są odrzucane.

Powiązane:

- [/providers/anthropic](/pl/providers/anthropic)
- [/reference/token-use](/pl/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/pl/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokalny backend zgodny z OpenAI przechodzi bezpośrednie probe, ale uruchomienia agenta kończą się błędem

Użyj tego, gdy:

- `curl ... /v1/models` działa
- małe bezpośrednie wywołania `/v1/chat/completions` działają
- uruchomienia modeli OpenClaw kończą się błędem tylko przy zwykłych turach agenta

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Szukaj:

- małe bezpośrednie wywołania działają, ale uruchomienia OpenClaw kończą się błędem tylko przy większych promptach
- błędów backendu mówiących, że `messages[].content` oczekuje ciągu znaków
- awarii backendu pojawiających się tylko przy większej liczbie tokenów promptu lub pełnych
  promptach runtime agenta

Typowe sygnatury:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  odrzuca strukturalne części treści Chat Completions. Poprawka: ustaw
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- małe bezpośrednie żądania działają, ale uruchomienia agenta OpenClaw kończą się awariami backendu/modelu
  (na przykład Gemma w niektórych buildach `inferrs`) → transport OpenClaw jest
  prawdopodobnie już poprawny; backend nie radzi sobie z większym kształtem promptu runtime agenta.
- awarie zmniejszają się po wyłączeniu narzędzi, ale nie znikają → schematy narzędzi były
  częścią obciążenia, ale pozostały problem nadal leży po stronie upstream modelu/serwera
  albo jest błędem backendu.

Możliwe poprawki:

1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions obsługujących tylko ciągi znaków.
2. Ustaw `compat.supportsTools: false` dla modeli/backendów, które nie potrafią niezawodnie obsłużyć
   powierzchni schematów narzędzi OpenClaw.
3. W miarę możliwości zmniejsz obciążenie promptu: mniejszy bootstrap workspace, krótsza
   historia sesji, lżejszy model lokalny albo backend z lepszym wsparciem dla długiego kontekstu.
4. Jeśli małe bezpośrednie żądania nadal przechodzą, a tury agenta OpenClaw wciąż kończą się awarią
   wewnątrz backendu, potraktuj to jako ograniczenie upstream serwera/modelu i zgłoś tam
   reprodukcję z zaakceptowanym kształtem ładunku.

Powiązane:

- [/gateway/local-models](/pl/gateway/local-models)
- [/gateway/configuration](/pl/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/pl/gateway/configuration-reference#openai-compatible-endpoints)

## Brak odpowiedzi

Jeśli kanały działają, ale nic nie odpowiada, sprawdź routing i politykę, zanim ponownie połączysz cokolwiek.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Szukaj:

- Oczekującego parowania dla nadawców DM.
- Filtrowania wiadomości grupowych po wzmiankach (`requireMention`, `mentionPatterns`).
- Niezgodności list dozwolonych kanałów/grup.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa ignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez politykę.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/pairing](/pl/channels/pairing)
- [/channels/groups](/pl/channels/groups)

## Łączność dashboard/control UI

Gdy dashboard/control UI nie chce się połączyć, sprawdź URL, tryb uwierzytelniania i założenia dotyczące bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Szukaj:

- Poprawnego probe URL i dashboard URL.
- Niezgodności trybu uwierzytelniania/tokena między klientem a Gateway.
- Użycia HTTP tam, gdzie wymagana jest tożsamość urządzenia.

Typowe sygnatury:

- `device identity required` → niezabezpieczony kontekst albo brak uwierzytelniania urządzenia.
- `origin not allowed` → `Origin` przeglądarki nie znajduje się w `gateway.controlUi.allowedOrigins`
  (albo łączysz się z pochodzenia przeglądarki spoza loopback bez jawnej
  listy dozwolonych).
- `device nonce required` / `device nonce mismatch` → klient nie kończy
  przepływu uwierzytelniania urządzenia opartego na wyzwaniu (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klient podpisał niewłaściwy
  ładunek (albo użył przestarzałego znacznika czasu) dla bieżącego uzgadniania.
- `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną ponowną próbę z zapisanym tokenem urządzenia.
- Ta ponowna próba z zapisanym tokenem używa ponownie zapisanego zestawu zakresów powiązanego ze sparowanym
  tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują swój
  żądany zestaw zakresów.
- Poza tą ścieżką ponawiania priorytet uwierzytelniania połączenia to najpierw jawny
  współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia,
  a następnie token bootstrap.
- W asynchronicznej ścieżce Control UI przez Tailscale Serve nieudane próby dla tego samego
  `{scope, ip}` są serializowane, zanim limiter zarejestruje błąd. Dwie błędne współbieżne próby
  od tego samego klienta mogą więc skutkować komunikatem `retry later`
  przy drugiej próbie zamiast dwóch zwykłych niedopasowań.
- `too many failed authentication attempts (retry later)` z klienta loopback o pochodzeniu przeglądarki
  → powtarzające się nieudane próby z tego samego znormalizowanego `Origin` są tymczasowo
  blokowane; inne localhost origin używa osobnego koszyka.
- powtarzające się `unauthorized` po tej ponownej próbie → rozjazd współdzielonego tokena/tokena urządzenia; odśwież konfigurację tokena i w razie potrzeby ponownie zatwierdź/obróć token urządzenia.
- `gateway connect failed:` → błędny host/port/cel url.

### Szybka mapa kodów szczegółów auth

Użyj `error.details.code` z nieudanego wyniku `connect`, aby wybrać następne działanie:

| Kod szczegółu                | Znaczenie                                                                                                                                                                                    | Zalecane działanie                                                                                                                                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klient nie wysłał wymaganego współdzielonego tokena.                                                                                                                                         | Wklej/ustaw token w kliencie i spróbuj ponownie. Dla ścieżek dashboard: `openclaw config get gateway.auth.token`, a następnie wklej do ustawień Control UI.                                                                                                                       |
| `AUTH_TOKEN_MISMATCH`        | Współdzielony token nie zgadzał się z tokenem auth Gateway.                                                                                                                                 | Jeśli `canRetryWithDeviceToken=true`, zezwól na jedną zaufaną ponowną próbę. Ponowne próby z zapisanym tokenem ponownie używają zapisanych zatwierdzonych zakresów; wywołujący z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal nie działa, uruchom [checklistę odzyskiwania po rozjeździe tokenów](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Zapisany token per urządzenie jest nieaktualny albo został cofnięty.                                                                                                                         | Obróć/ponownie zatwierdź token urządzenia za pomocą [devices CLI](/cli/devices), a następnie połącz się ponownie.                                                                                                                                                                  |
| `PAIRING_REQUIRED`           | Tożsamość urządzenia wymaga zatwierdzenia. Sprawdź `error.details.reason` dla `not-paired`, `scope-upgrade`, `role-upgrade` albo `metadata-upgrade`, i użyj `requestId` / `remediationHint`, jeśli są obecne. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`. Aktualizacje zakresu/roli używają tego samego przepływu po sprawdzeniu żądanego dostępu.                                                                             |

Kontrola migracji do uwierzytelniania urządzeń v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jeśli logi pokazują błędy nonce/podpisu, zaktualizuj łączącego się klienta i sprawdź, czy:

1. czeka na `connect.challenge`
2. podpisuje ładunek powiązany z wyzwaniem
3. wysyła `connect.params.device.nonce` z tym samym nonce wyzwania

Jeśli `openclaw devices rotate` / `revoke` / `remove` jest niespodziewanie odrzucane:

- sesje tokenów sparowanych urządzeń mogą zarządzać tylko **własnym** urządzeniem, chyba że
  wywołujący ma też `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko zakresów operatora, które
  sesja wywołująca już posiada

Powiązane:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/pl/gateway/configuration) (tryby auth Gateway)
- [/gateway/trusted-proxy-auth](/pl/gateway/trusted-proxy-auth)
- [/gateway/remote](/pl/gateway/remote)
- [/cli/devices](/cli/devices)

## Usługa Gateway nie działa

Użyj tego, gdy usługa jest zainstalowana, ale proces nie utrzymuje się w działaniu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # sprawdź też usługi na poziomie systemu
```

Szukaj:

- `Runtime: stopped` z podpowiedziami dotyczącymi zakończenia.
- Niezgodności konfiguracji usługi (`Config (cli)` vs `Config (service)`).
- Konfliktów portów/listenerów.
- Dodatkowych instalacji launchd/systemd/schtasks przy użyciu `--deep`.
- Wskazówek czyszczenia `Other gateway-like services detected (best effort)`.

Typowe sygnatury:

- `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → lokalny tryb Gateway nie jest włączony albo plik konfiguracji został nadpisany i utracił `gateway.mode`. Poprawka: ustaw `gateway.mode="local"` w konfiguracji albo uruchom ponownie `openclaw onboard --mode local` / `openclaw setup`, aby ponownie zapisać oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślna ścieżka konfiguracji to `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → powiązanie spoza loopback bez prawidłowej ścieżki uwierzytelniania Gateway (token/hasło albo trusted-proxy, jeśli skonfigurowano).
- `another gateway instance is already listening` / `EADDRINUSE` → konflikt portów.
- `Other gateway-like services detected (best effort)` → istnieją stare lub równoległe jednostki launchd/systemd/schtasks. W większości konfiguracji należy utrzymywać jeden Gateway na maszynę; jeśli naprawdę potrzebujesz więcej niż jednego, rozdziel porty + konfigurację/stan/workspace. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).

Powiązane:

- [/gateway/background-process](/pl/gateway/background-process)
- [/gateway/configuration](/pl/gateway/configuration)
- [/gateway/doctor](/pl/gateway/doctor)

## Gateway przywrócił ostatnią znaną dobrą konfigurację

Użyj tego, gdy Gateway się uruchamia, ale logi mówią, że przywrócił `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Szukaj:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- pliku `openclaw.json.clobbered.*` z sygnaturą czasu obok aktywnej konfiguracji
- głównego zdarzenia systemowego agenta zaczynającego się od `Config recovery warning`

Co się stało:

- Odrzucona konfiguracja nie przeszła walidacji podczas uruchamiania lub hot reload.
- OpenClaw zachował odrzucony ładunek jako `.clobbered.*`.
- Aktywna konfiguracja została przywrócona z ostatniej zwalidowanej kopii last-known-good.
- Następna tura głównego agenta otrzymuje ostrzeżenie, aby nie przepisywać bezmyślnie odrzuconej konfiguracji.

Sprawdzanie i naprawa:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Typowe sygnatury:

- istnieje `.clobbered.*` → przywrócono zewnętrzną bezpośrednią edycję albo odczyt przy starcie.
- istnieje `.rejected.*` → zapis konfiguracji należący do OpenClaw nie przeszedł schematu albo kontroli nadpisania przed zatwierdzeniem.
- `Config write rejected:` → zapis próbował usunąć wymaganą strukturę, gwałtownie zmniejszyć plik albo zapisać nieprawidłową konfigurację.
- `Config last-known-good promotion skipped` → kandydat zawierał zamaskowane placeholdery sekretów, takie jak `***`.

Możliwe poprawki:

1. Zachowaj przywróconą aktywną konfigurację, jeśli jest poprawna.
2. Skopiuj tylko zamierzone klucze z `.clobbered.*` albo `.rejected.*`, a następnie zastosuj je za pomocą `openclaw config set` albo `config.patch`.
3. Uruchom `openclaw config validate` przed ponownym uruchomieniem.
4. Jeśli edytujesz ręcznie, zachowaj pełną konfigurację JSON5, a nie tylko częściowy obiekt, który chciałeś zmienić.

Powiązane:

- [/gateway/configuration#strict-validation](/pl/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/pl/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/pl/gateway/doctor)

## Ostrzeżenia probe Gateway

Użyj tego, gdy `openclaw gateway probe` dociera do celu, ale nadal wyświetla blok ostrzeżeń.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Szukaj:

- `warnings[].code` i `primaryTargetId` w wyjściu JSON.
- Czy ostrzeżenie dotyczy fallbacku SSH, wielu Gateway, brakujących zakresów czy nierozwiązanych odwołań auth.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal próbowało bezpośrednich skonfigurowanych/docelowych celów loopback.
- `multiple reachable gateways detected` → odpowiedział więcej niż jeden cel. Zwykle oznacza to celową konfigurację z wieloma Gateway albo stare/zduplikowane listenery.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie działa, ale szczegóły RPC są ograniczone przez zakresy; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- `Capability: pairing-pending` albo `gateway closed (1008): pairing required` → Gateway odpowiedział, ale ten klient nadal wymaga parowania/zatwierdzenia przed zwykłym dostępem operatora.
- nierozwiązane teksty ostrzeżeń `gateway.auth.*` / `gateway.remote.*` SecretRef → materiał auth był niedostępny w tej ścieżce polecenia dla nieudanego celu.

Powiązane:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host)
- [/gateway/remote](/pl/gateway/remote)

## Kanał połączony, ale wiadomości nie przepływają

Jeśli stan kanału pokazuje połączenie, ale przepływ wiadomości jest martwy, skup się na polityce, uprawnieniach i regułach dostarczania specyficznych dla kanału.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Szukaj:

- Polityki DM (`pairing`, `allowlist`, `open`, `disabled`).
- Listy dozwolonych grup i wymogów wzmianki.
- Brakujących uprawnień/scope'ów API kanału.

Typowe sygnatury:

- `mention required` → wiadomość zignorowana przez politykę wzmianki grupowej.
- `pairing` / ślady oczekującego zatwierdzenia → nadawca nie jest zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z auth/uprawnieniami kanału.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/whatsapp](/pl/channels/whatsapp)
- [/channels/telegram](/pl/channels/telegram)
- [/channels/discord](/pl/channels/discord)

## Dostarczanie Cron i Heartbeat

Jeśli Cron albo Heartbeat nie uruchomiły się lub nic nie dostarczyły, najpierw sprawdź stan harmonogramu, a potem cel dostarczania.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Szukaj:

- Włączonego Cron i obecnego następnego wybudzenia.
- Stanu historii uruchomień zadania (`ok`, `skipped`, `error`).
- Powodów pominięcia Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Typowe sygnatury:

- `cron: scheduler disabled; jobs will not run automatically` → Cron wyłączony.
- `cron: timer tick failed` → nie powiodł się tick harmonogramu; sprawdź błędy plików/logów/runtime.
- `heartbeat skipped` z `reason=quiet-hours` → poza oknem aktywnych godzin.
- `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste linie / nagłówki markdown, więc OpenClaw pomija wywołanie modelu.
- `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale w tym ticku żadne zadanie nie jest jeszcze należne.
- `heartbeat: unknown accountId` → nieprawidłowy account id dla celu dostarczania Heartbeat.
- `heartbeat skipped` z `reason=dm-blocked` → cel Heartbeat został rozwiązany do miejsca docelowego w stylu DM, podczas gdy `agents.defaults.heartbeat.directPolicy` (albo nadpisanie per agent) ma wartość `block`.

Powiązane:

- [/automation/cron-jobs#troubleshooting](/pl/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/pl/automation/cron-jobs)
- [/gateway/heartbeat](/pl/gateway/heartbeat)

## Sparowane narzędzie Node nie działa

Jeśli Node jest sparowany, ale narzędzia nie działają, odizoluj stan foreground, uprawnień i zatwierdzeń.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Szukaj:

- Czy Node jest online i ma oczekiwane możliwości.
- Nadanych przez system operacyjny uprawnień do kamery/mikrofonu/lokalizacji/ekranu.
- Stanu zatwierdzeń exec i listy dozwolonych.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja Node musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brak wymaganego uprawnienia systemowego.
- `SYSTEM_RUN_DENIED: approval required` → oczekujące zatwierdzenie exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez listę dozwolonych.

Powiązane:

- [/nodes/troubleshooting](/pl/nodes/troubleshooting)
- [/nodes/index](/pl/nodes/index)
- [/tools/exec-approvals](/pl/tools/exec-approvals)

## Narzędzie browser nie działa

Użyj tego, gdy działania narzędzia browser kończą się błędem, mimo że sam Gateway działa prawidłowo.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Szukaj:

- Czy ustawiono `plugins.allow` i czy zawiera `browser`.
- Prawidłowej ścieżki do pliku wykonywalnego przeglądarki.
- Osiągalności profilu CDP.
- Dostępności lokalnego Chrome dla profili `existing-session` / `user`.

Typowe sygnatury:

- `unknown command "browser"` albo `unknown command 'browser'` → wbudowany plugin browser jest wykluczony przez `plugins.allow`.
- brakujące / niedostępne narzędzie browser przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc plugin nigdy się nie załadował.
- `Failed to start Chrome CDP on port` → proces przeglądarki nie uruchomił się.
- `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
- `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` albo `ftp:`.
- `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma zły albo spoza zakresu port.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP `existing-session` nie mógł jeszcze podłączyć się do wybranego katalogu danych przeglądarki. Otwórz stronę inspect przeglądarki, włącz zdalne debugowanie, zostaw przeglądarkę otwartą, zatwierdź pierwszy monit o podłączenie, a potem spróbuj ponownie. Jeśli zalogowany stan nie jest wymagany, preferuj zarządzany profil `openclaw`.
- `No Chrome tabs found for profile="user"` → profil dołączania Chrome MCP nie ma otwartych lokalnych kart Chrome.
- `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny punkt końcowy CDP nie jest osiągalny z hosta Gateway.
- `Browser attachOnly is enabled ... not reachable` albo `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko-dołączania nie ma osiągalnego celu albo punkt końcowy HTTP odpowiedział, ale nadal nie udało się otworzyć WebSocket CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja Gateway nie zawiera pełnego pakietu Playwright; snapshoty ARIA i podstawowe zrzuty ekranu strony mogą nadal działać, ale nawigacja, snapshoty AI, zrzuty elementów po selektorze CSS i eksport PDF pozostają niedostępne.
- `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu połączyło `--full-page` z `--ref` albo `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwycenia strony albo `--ref` ze snapshotu, a nie CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooki przesyłania plików Chrome MCP wymagają odwołań snapshotu, a nie selektorów CSS.
- `existing-session file uploads currently support one file at a time.` → na profilach Chrome MCP wysyłaj jedno przesłanie na wywołanie.
- `existing-session dialog handling does not support timeoutMs.` → hooki okien dialogowych na profilach Chrome MCP nie obsługują nadpisania timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki albo surowego profilu CDP.
- nieaktualne nadpisania viewport / dark-mode / locale / offline na profilach tylko-dołączania albo zdalnych CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez restartowania całego Gateway.

Powiązane:

- [/tools/browser-linux-troubleshooting](/pl/tools/browser-linux-troubleshooting)
- [/tools/browser](/pl/tools/browser)

## Jeśli po aktualizacji coś nagle przestało działać

Większość problemów po aktualizacji to rozjazd konfiguracji albo egzekwowanie bardziej restrykcyjnych ustawień domyślnych.

### 1) Zmieniło się zachowanie auth i nadpisywania URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Na co zwrócić uwagę:

- Jeśli `gateway.mode=remote`, wywołania CLI mogą być kierowane zdalnie, mimo że Twoja lokalna usługa działa poprawnie.
- Jawne wywołania `--url` nie korzystają z zapisanych poświadczeń jako fallbacku.

Typowe sygnatury:

- `gateway connect failed:` → błędny docelowy URL.
- `unauthorized` → punkt końcowy jest osiągalny, ale auth jest nieprawidłowe.

### 2) Ograniczenia bind i auth są bardziej restrykcyjne

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Na co zwrócić uwagę:

- Powiązania spoza loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki auth Gateway: współdzielonego tokena/hasła albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` poza loopback.
- Starsze klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

Typowe sygnatury:

- `refusing to bind gateway ... without auth` → powiązanie spoza loopback bez prawidłowej ścieżki auth Gateway.
- `Connectivity probe: failed` mimo działającego runtime → Gateway działa, ale jest niedostępny przy bieżącym auth/url.

### 3) Zmienił się stan parowania i tożsamości urządzenia

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Na co zwrócić uwagę:

- Oczekujące zatwierdzenia urządzeń dla dashboard/Node.
- Oczekujące zatwierdzenia parowania DM po zmianach polityki albo tożsamości.

Typowe sygnatury:

- `device identity required` → uwierzytelnianie urządzenia nie zostało spełnione.
- `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

Jeśli konfiguracja usługi i runtime nadal się nie zgadzają po tych kontrolach, zainstaluj ponownie metadane usługi z tego samego katalogu profilu/stanu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane:

- [/gateway/pairing](/pl/gateway/pairing)
- [/gateway/authentication](/pl/gateway/authentication)
- [/gateway/background-process](/pl/gateway/background-process)
