---
read_when:
    - Centrum rozwiązywania problemów skierowało Cię tutaj po głębszą diagnostykę
    - Potrzebujesz stabilnych sekcji procedury opartych na objawach z dokładnymi poleceniami
summary: Dogłębna procedura rozwiązywania problemów dla Gateway, kanałów, automatyzacji, Node i przeglądarki
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-04-24T09:12:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20066bdab03f05304b3a620fbadc38e4dc74b740da151c58673dcf5196e5f1e1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z Gateway

Ta strona to dogłębna procedura.
Jeśli najpierw chcesz zobaczyć szybki przepływ triage, zacznij od [/help/troubleshooting](/pl/help/troubleshooting).

## Drabinka poleceń

Uruchom najpierw te polecenia, w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Oczekiwane sygnały zdrowego działania:

- `openclaw gateway status` pokazuje `Runtime: running`, `Connectivity probe: ok` i wiersz `Capability: ...`.
- `openclaw doctor` nie zgłasza blokujących problemów z konfiguracją/usługą.
- `openclaw channels status --probe` pokazuje aktywny status transportu per account oraz,
  tam gdzie jest to obsługiwane, wyniki probe/audytu takie jak `works` lub `audit ok`.

## Anthropic 429: extra usage required for long context

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
- Żądania zawodzą tylko w długich sesjach/uruchomieniach modeli, które potrzebują ścieżki beta 1M.

Opcje naprawy:

1. Wyłącz `context1m` dla tego modelu, aby wrócić do zwykłego okna kontekstu.
2. Użyj poświadczenia Anthropic, które kwalifikuje się do żądań długiego kontekstu, albo przełącz się na klucz API Anthropic.
3. Skonfiguruj modele awaryjne, aby uruchomienia były kontynuowane, gdy żądania długiego kontekstu Anthropic są odrzucane.

Powiązane:

- [/providers/anthropic](/pl/providers/anthropic)
- [/reference/token-use](/pl/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/pl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokalny backend zgodny z OpenAI przechodzi bezpośrednie probe, ale uruchomienia agenta zawodzą

Użyj tego, gdy:

- `curl ... /v1/models` działa
- małe bezpośrednie wywołania `/v1/chat/completions` działają
- uruchomienia modeli OpenClaw zawodzą tylko podczas zwykłych tur agenta

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Szukaj:

- małe bezpośrednie wywołania kończą się powodzeniem, ale uruchomienia OpenClaw zawodzą tylko przy większych promptach
- błędy backendu o `messages[].content` oczekującym ciągu znaków
- awarie backendu pojawiające się tylko przy większej liczbie tokenów promptu lub pełnych promptach środowiska uruchomieniowego agenta

Typowe sygnatury:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  odrzuca ustrukturyzowane części zawartości Chat Completions. Naprawa: ustaw
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- małe bezpośrednie żądania kończą się powodzeniem, ale uruchomienia agentów OpenClaw zawodzą z awariami backendu/modelu
  (na przykład Gemma na niektórych kompilacjach `inferrs`) → transport OpenClaw
  jest prawdopodobnie już poprawny; backend nie radzi sobie z większym kształtem promptu środowiska uruchomieniowego agenta.
- awarie zmniejszają się po wyłączeniu narzędzi, ale nie znikają → schematy narzędzi
  były częścią obciążenia, ale pozostały problem nadal leży po stronie upstream modelu/serwera
  lub jest błędem backendu.

Opcje naprawy:

1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions akceptujących tylko ciągi znaków.
2. Ustaw `compat.supportsTools: false` dla modeli/backendów, które nie potrafią
   niezawodnie obsłużyć powierzchni schematu narzędzi OpenClaw.
3. Ogranicz obciążenie promptów tam, gdzie to możliwe: mniejszy bootstrap obszaru roboczego, krótsza
   historia sesji, lżejszy model lokalny lub backend z lepszym wsparciem dla długiego kontekstu.
4. Jeśli małe bezpośrednie żądania nadal przechodzą, a tury agenta OpenClaw wciąż powodują awarie
   wewnątrz backendu, potraktuj to jako ograniczenie serwera/modelu upstream i zgłoś tam repro
   z zaakceptowanym kształtem ładunku.

Powiązane:

- [/gateway/local-models](/pl/gateway/local-models)
- [/gateway/configuration](/pl/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/pl/gateway/configuration-reference#openai-compatible-endpoints)

## Brak odpowiedzi

Jeśli kanały działają, ale nic nie odpowiada, sprawdź routing i politykę przed ponownym łączeniem czegokolwiek.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Szukaj:

- Oczekującego Pairing dla nadawców DM.
- Wymagania wzmianki w grupach (`requireMention`, `mentionPatterns`).
- Niedopasowań allowlist kanału/grupy.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa została zignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez politykę.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/pairing](/pl/channels/pairing)
- [/channels/groups](/pl/channels/groups)

## Łączność dashboard / Control UI

Gdy dashboard / Control UI nie chce się połączyć, zweryfikuj URL, tryb auth i założenia bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Szukaj:

- Poprawnego probe URL i dashboard URL.
- Niedopasowania trybu auth/tokenu między klientem a gateway.
- Użycia HTTP tam, gdzie wymagana jest tożsamość urządzenia.

Typowe sygnatury:

- `device identity required` → niezabezpieczony kontekst lub brak auth urządzenia.
- `origin not allowed` → przeglądarkowy `Origin` nie znajduje się w `gateway.controlUi.allowedOrigins`
  (albo łączysz się z przeglądarkowego originu spoza loopback bez jawnej
  allowlisty).
- `device nonce required` / `device nonce mismatch` → klient nie kończy
  przepływu auth urządzenia opartego na wyzwaniu (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klient podpisał niewłaściwy
  ładunek (albo użył nieaktualnego znacznika czasu) dla bieżącego handshake.
- `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną próbę ponowną z buforowanym tokenem urządzenia.
- Ta próba z buforowanym tokenem ponownie używa buforowanego zestawu zakresów zapisanego z sparowanym
  tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują
  żądany zestaw zakresów.
- Poza tą ścieżką ponownej próby priorytet auth połączenia wygląda tak: jawny współdzielony
  token/hasło najpierw, potem jawny `deviceToken`, potem zapisany token urządzenia,
  a na końcu token bootstrap.
- Na asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego
  `{scope, ip}` są serializowane, zanim limiter zapisze niepowodzenie. Dwie błędne
  współbieżne próby ponowne od tego samego klienta mogą więc skutkować `retry later`
  przy drugiej próbie zamiast dwóch zwykłych niedopasowań.
- `too many failed authentication attempts (retry later)` od klienta loopback o pochodzeniu przeglądarkowym
  → powtarzane niepowodzenia od tego samego znormalizowanego `Origin` są tymczasowo blokowane;
  inny localhost origin używa osobnego bucketu.
- powtarzające się `unauthorized` po tej próbie ponownej → dryf współdzielonego tokenu / tokenu urządzenia; odśwież konfigurację tokenu i ponownie zatwierdź / obróć token urządzenia, jeśli to potrzebne.
- `gateway connect failed:` → błędny host/port/cel URL.

### Szybka mapa kodów szczegółów auth

Użyj `error.details.code` z nieudanego `connect`, aby wybrać kolejny krok:

| Kod szczegółowy             | Znaczenie                                                                                                                                                                                   | Zalecane działanie                                                                                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Klient nie wysłał wymaganego współdzielonego tokenu.                                                                                                                                        | Wklej/ustaw token w kliencie i spróbuj ponownie. Dla ścieżek dashboard: `openclaw config get gateway.auth.token`, a następnie wklej do ustawień Control UI.                                                                                                                            |
| `AUTH_TOKEN_MISMATCH`       | Współdzielony token nie pasuje do tokenu auth gateway.                                                                                                                                      | Jeśli `canRetryWithDeviceToken=true`, zezwól na jedną zaufaną próbę ponowną. Próby z buforowanym tokenem ponownie używają zapisanych zatwierdzonych zakresów; wywołujący z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal się nie powiedzie, uruchom [checklistę odzyskiwania po dryfie tokenu](/pl/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Buforowany token per device jest nieaktualny lub cofnięty.                                                                                                                                 | Obróć / ponownie zatwierdź token urządzenia za pomocą [CLI urządzeń](/pl/cli/devices), a następnie połącz się ponownie.                                                                                                                                                                    |
| `PAIRING_REQUIRED`          | Tożsamość urządzenia wymaga zatwierdzenia. Sprawdź `error.details.reason` pod kątem `not-paired`, `scope-upgrade`, `role-upgrade` lub `metadata-upgrade`, i użyj `requestId` / `remediationHint`, jeśli są obecne. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`. Ulepszenia zakresu/roli używają tego samego przepływu po przejrzeniu żądanego dostępu.                                                                                     |

Kontrola migracji device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jeśli logi pokazują błędy nonce/signature, zaktualizuj klienta łączącego się i sprawdź, czy:

1. czeka na `connect.challenge`
2. podpisuje ładunek powiązany z wyzwaniem
3. wysyła `connect.params.device.nonce` z tym samym nonce wyzwania

Jeśli `openclaw devices rotate` / `revoke` / `remove` są nieoczekiwanie odrzucane:

- sesje tokenów sparowanych urządzeń mogą zarządzać tylko **własnym**
  urządzeniem, chyba że wywołujący ma też `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko zakresów operatora,
  które sesja wywołująca już posiada

Powiązane:

- [/web/control-ui](/pl/web/control-ui)
- [/gateway/configuration](/pl/gateway/configuration) (tryby auth gateway)
- [/gateway/trusted-proxy-auth](/pl/gateway/trusted-proxy-auth)
- [/gateway/remote](/pl/gateway/remote)
- [/cli/devices](/pl/cli/devices)

## Usługa Gateway nie działa

Użyj tego, gdy usługa jest zainstalowana, ale proces nie pozostaje uruchomiony.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Szukaj:

- `Runtime: stopped` ze wskazówkami dotyczącymi wyjścia.
- Niedopasowania konfiguracji usługi (`Config (cli)` vs `Config (service)`).
- Konfliktów portów/listenerów.
- Dodatkowych instalacji launchd/systemd/schtasks przy użyciu `--deep`.
- Wskazówek czyszczenia `Other gateway-like services detected (best effort)`.

Typowe sygnatury:

- `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → lokalny tryb gateway nie jest włączony albo plik konfiguracyjny został nadpisany i utracił `gateway.mode`. Naprawa: ustaw `gateway.mode="local"` w konfiguracji albo ponownie uruchom `openclaw onboard --mode local` / `openclaw setup`, aby ponownie zapisać oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślna ścieżka konfiguracji to `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → powiązanie poza loopback bez prawidłowej ścieżki auth gateway (token/hasło albo trusted-proxy, jeśli skonfigurowano).
- `another gateway instance is already listening` / `EADDRINUSE` → konflikt portów.
- `Other gateway-like services detected (best effort)` → istnieją nieaktualne lub równoległe jednostki launchd/systemd/schtasks. Większość konfiguracji powinna utrzymywać jeden gateway na maszynę; jeśli jednak potrzebujesz więcej niż jednego, odizoluj porty + konfigurację/stan/obszar roboczy. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).

Powiązane:

- [/gateway/background-process](/pl/gateway/background-process)
- [/gateway/configuration](/pl/gateway/configuration)
- [/gateway/doctor](/pl/gateway/doctor)

## Gateway przywrócił ostatnią znaną dobrą konfigurację

Użyj tego, gdy Gateway się uruchamia, ale logi mówią, że przywrócono `openclaw.json`.

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
- Pliku `openclaw.json.clobbered.*` ze znacznikiem czasu obok aktywnej konfiguracji
- Zdarzenia systemowego głównego agenta zaczynającego się od `Config recovery warning`

Co się stało:

- Odrzucona konfiguracja nie przeszła walidacji podczas startu lub hot reload.
- OpenClaw zachował odrzucony ładunek jako `.clobbered.*`.
- Aktywna konfiguracja została przywrócona z ostatniej zwalidowanej kopii last-known-good.
- Następna tura głównego agenta otrzyma ostrzeżenie, by nie przepisywać bezmyślnie odrzuconej konfiguracji.

Inspekcja i naprawa:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Typowe sygnatury:

- istnieje `.clobbered.*` → zewnętrzna bezpośrednia edycja lub odczyt przy starcie zostały przywrócone.
- istnieje `.rejected.*` → zapis konfiguracji należący do OpenClaw nie przeszedł sprawdzeń schematu lub clobber przed commit.
- `Config write rejected:` → zapis próbował usunąć wymagany kształt, gwałtownie zmniejszyć plik lub zapisać nieprawidłową konfigurację.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` lub `size-drop-vs-last-good:*` → przy starcie bieżący plik został potraktowany jako clobbered, ponieważ utracił pola lub rozmiar względem kopii last-known-good.
- `Config last-known-good promotion skipped` → kandydat zawierał zredagowane symbole zastępcze sekretów, takie jak `***`.

Opcje naprawy:

1. Zachowaj przywróconą aktywną konfigurację, jeśli jest poprawna.
2. Skopiuj tylko zamierzone klucze z `.clobbered.*` lub `.rejected.*`, a następnie zastosuj je przez `openclaw config set` lub `config.patch`.
3. Uruchom `openclaw config validate` przed restartem.
4. Jeśli edytujesz ręcznie, zachowaj pełną konfigurację JSON5, a nie tylko częściowy obiekt, który chciałeś zmienić.

Powiązane:

- [/gateway/configuration#strict-validation](/pl/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/pl/gateway/configuration#config-hot-reload)
- [/cli/config](/pl/cli/config)
- [/gateway/doctor](/pl/gateway/doctor)

## Ostrzeżenia probe Gateway

Użyj tego, gdy `openclaw gateway probe` dociera do czegoś, ale nadal wypisuje blok ostrzeżenia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Szukaj:

- `warnings[].code` i `primaryTargetId` w danych wyjściowych JSON.
- Czy ostrzeżenie dotyczy awaryjnego przejścia na SSH, wielu gateway, brakujących zakresów czy nierozwiązanych odwołań auth.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal próbowało bezpośrednich skonfigurowanych/callbackowych celów.
- `multiple reachable gateways detected` → odpowiedział więcej niż jeden cel. Zwykle oznacza to celową konfigurację multi-gateway albo nieaktualne/zduplikowane listenery.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie się udało, ale szczegółowy RPC ma ograniczone zakresy; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- `Capability: pairing-pending` lub `gateway closed (1008): pairing required` → gateway odpowiedział, ale ten klient nadal wymaga Pairing/zatwierdzenia przed uzyskaniem zwykłego dostępu operatora.
- nierozwiązane ostrzeżenie SecretRef `gateway.auth.*` / `gateway.remote.*` → materiał auth był niedostępny w tej ścieżce polecenia dla nieudanego celu.

Powiązane:

- [/cli/gateway](/pl/cli/gateway)
- [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host)
- [/gateway/remote](/pl/gateway/remote)

## Kanał połączony, ale wiadomości nie płyną

Jeśli stan kanału to connected, ale przepływ wiadomości nie działa, skup się na polityce, uprawnieniach i regułach dostarczania specyficznych dla kanału.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Szukaj:

- Polityki DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlisty grupowej i wymagań wzmianki.
- Brakujących uprawnień/zakresów API kanału.

Typowe sygnatury:

- `mention required` → wiadomość została zignorowana przez politykę wzmianki grupowej.
- ślady `pairing` / oczekującego zatwierdzenia → nadawca nie jest zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z auth/uprawnieniami kanału.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/whatsapp](/pl/channels/whatsapp)
- [/channels/telegram](/pl/channels/telegram)
- [/channels/discord](/pl/channels/discord)

## Dostarczanie Cron i Heartbeat

Jeśli Cron lub Heartbeat nie uruchomił się albo nic nie dostarczył, najpierw zweryfikuj stan harmonogramu, a potem cel dostarczenia.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Szukaj:

- Włączonego Cron i obecności następnego wybudzenia.
- Statusu historii uruchomień zadania (`ok`, `skipped`, `error`).
- Przyczyn pominięcia Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Typowe sygnatury:

- `cron: scheduler disabled; jobs will not run automatically` → Cron wyłączony.
- `cron: timer tick failed` → takt harmonogramu nie powiódł się; sprawdź błędy plików/logów/środowiska uruchomieniowego.
- `heartbeat skipped` z `reason=quiet-hours` → poza oknem aktywnych godzin.
- `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste linie / nagłówki markdown, więc OpenClaw pomija wywołanie modelu.
- `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne zadania nie są należne przy tym takcie.
- `heartbeat: unknown accountId` → nieprawidłowy account id dla celu dostarczania Heartbeat.
- `heartbeat skipped` z `reason=dm-blocked` → cel Heartbeat został rozwiązany do miejsca docelowego w stylu DM, podczas gdy `agents.defaults.heartbeat.directPolicy` (lub nadpisanie per-agent) jest ustawione na `block`.

Powiązane:

- [/automation/cron-jobs#troubleshooting](/pl/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/pl/automation/cron-jobs)
- [/gateway/heartbeat](/pl/gateway/heartbeat)

## Narzędzie sparowanego Node kończy się błędem

Jeśli Node jest sparowany, ale narzędzia zawodzą, wyizoluj stan pierwszego planu, uprawnień i zatwierdzeń.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Szukaj:

- Czy Node jest online i ma oczekiwane możliwości.
- Przyznanych uprawnień systemowych dla kamery/mikrofonu/lokalizacji/ekranu.
- Zatwierdzeń exec i stanu allowlisty.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja Node musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brak wymaganego uprawnienia systemowego.
- `SYSTEM_RUN_DENIED: approval required` → oczekujące zatwierdzenie exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez allowlistę.

Powiązane:

- [/nodes/troubleshooting](/pl/nodes/troubleshooting)
- [/nodes/index](/pl/nodes/index)
- [/tools/exec-approvals](/pl/tools/exec-approvals)

## Narzędzie przeglądarki kończy się błędem

Użyj tego, gdy działania narzędzia przeglądarki zawodzą, mimo że sam gateway jest zdrowy.

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

- `unknown command "browser"` lub `unknown command 'browser'` → dołączony Plugin przeglądarki jest wykluczony przez `plugins.allow`.
- brak / niedostępne narzędzie przeglądarki przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc Plugin nigdy się nie załadował.
- `Failed to start Chrome CDP on port` → proces przeglądarki nie uruchomił się.
- `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
- `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` lub `ftp:`.
- `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma nieprawidłowy lub spoza zakresu port.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session nie mógł jeszcze dołączyć do wybranego katalogu danych przeglądarki. Otwórz stronę inspect przeglądarki, włącz zdalne debugowanie, pozostaw przeglądarkę otwartą, zatwierdź pierwszy prompt dołączenia, a następnie spróbuj ponownie. Jeśli zalogowany stan nie jest wymagany, preferuj zarządzany profil `openclaw`.
- `No Chrome tabs found for profile="user"` → profil dołączania Chrome MCP nie ma otwartych lokalnych kart Chrome.
- `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny punkt końcowy CDP jest nieosiągalny z hosta gateway.
- `Browser attachOnly is enabled ... not reachable` lub `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko-do-dołączenia nie ma osiągalnego celu albo punkt końcowy HTTP odpowiedział, ale nadal nie udało się otworzyć WebSocket CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja gateway nie ma dołączonej zależności środowiska uruchomieniowego `playwright-core` Plugin przeglądarki; uruchom `openclaw doctor --fix`, a następnie zrestartuj gateway. Migawki ARIA i podstawowe zrzuty stron nadal mogą działać, ale nawigacja, migawki AI, zrzuty elementów według selektora CSS i eksport PDF pozostaną niedostępne.
- `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu połączyło `--full-page` z `--ref` lub `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwycenia strony lub `--ref` z migawki, a nie CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooki przesyłania plików Chrome MCP wymagają odwołań do migawek, a nie selektorów CSS.
- `existing-session file uploads currently support one file at a time.` → w profilach Chrome MCP wysyłaj jedno przesłanie na jedno wywołanie.
- `existing-session dialog handling does not support timeoutMs.` → hooki dialogów w profilach Chrome MCP nie obsługują nadpisania limitu czasu.
- `existing-session type does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:type` w profilach `profile="user"` / Chrome MCP existing-session albo użyj zarządzanego/profilu przeglądarki CDP, gdy wymagany jest niestandardowy limit czasu.
- `existing-session evaluate does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:evaluate` w profilach `profile="user"` / Chrome MCP existing-session albo użyj zarządzanego/profilu przeglądarki CDP, gdy wymagany jest niestandardowy limit czasu.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki lub surowego profilu CDP.
- nieaktualne nadpisania viewport / dark-mode / locale / offline w profilach attach-only lub zdalnych CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez restartu całego gateway.

Powiązane:

- [/tools/browser-linux-troubleshooting](/pl/tools/browser-linux-troubleshooting)
- [/tools/browser](/pl/tools/browser)

## Jeśli po aktualizacji coś nagle się zepsuło

Większość usterek po aktualizacji to dryf konfiguracji albo wymuszanie bardziej rygorystycznych ustawień domyślnych.

### 1) Zmieniło się zachowanie auth i nadpisywania URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Co sprawdzić:

- Jeśli `gateway.mode=remote`, wywołania CLI mogą kierować ruch zdalnie, podczas gdy lokalna usługa działa poprawnie.
- Jawne wywołania `--url` nie wracają do zapisanych poświadczeń.

Typowe sygnatury:

- `gateway connect failed:` → błędny docelowy URL.
- `unauthorized` → punkt końcowy jest osiągalny, ale auth jest nieprawidłowe.

### 2) Guardraile bind i auth są bardziej rygorystyczne

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Co sprawdzić:

- Powiązania poza loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki auth gateway: uwierzytelniania współdzielonym tokenem/hasłem albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` poza loopback.
- Starsze klucze takie jak `gateway.token` nie zastępują `gateway.auth.token`.

Typowe sygnatury:

- `refusing to bind gateway ... without auth` → powiązanie poza loopback bez prawidłowej ścieżki auth gateway.
- `Connectivity probe: failed` przy działającym runtime → gateway żyje, ale jest niedostępny przy bieżącym auth/url.

### 3) Zmienił się stan Pairing i tożsamości urządzenia

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Co sprawdzić:

- Oczekujące zatwierdzenia urządzeń dla dashboard/Node.
- Oczekujące zatwierdzenia Pairing DM po zmianach polityki lub tożsamości.

Typowe sygnatury:

- `device identity required` → auth urządzenia nie zostało spełnione.
- `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

Jeśli konfiguracja usługi i runtime nadal się nie zgadzają po wykonaniu kontroli, zainstaluj ponownie metadane usługi z tego samego katalogu profile/state:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane:

- [/gateway/pairing](/pl/gateway/pairing)
- [/gateway/authentication](/pl/gateway/authentication)
- [/gateway/background-process](/pl/gateway/background-process)

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Doctor](/pl/gateway/doctor)
- [FAQ](/pl/help/faq)
