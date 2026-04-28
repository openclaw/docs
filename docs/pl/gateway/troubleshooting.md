---
read_when:
    - Hub rozwiązywania problemów skierował Cię tutaj w celu głębszej diagnostyki
    - Potrzebujesz stabilnych sekcji podręcznika opartych na objawach z dokładnymi poleceniami
sidebarTitle: Troubleshooting
summary: Szczegółowy podręcznik rozwiązywania problemów dla Gateway, kanałów, automatyzacji, Node i przeglądarki
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-04-26T11:32:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc6b2a0e8522a761dcee0a3b9bc024eefbd7a5ab4118fc090401868a571bcf
    source_path: gateway/troubleshooting.md
    workflow: 15
---

Ta strona to szczegółowy podręcznik. Jeśli chcesz najpierw szybki przepływ triage, zacznij od [/help/troubleshooting](/pl/help/troubleshooting).

## Drabina poleceń

Najpierw uruchom te polecenia, w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Oczekiwane zdrowe sygnały:

- `openclaw gateway status` pokazuje `Runtime: running`, `Connectivity probe: ok` oraz wiersz `Capability: ...`.
- `openclaw doctor` nie zgłasza blokujących problemów konfiguracji/usługi.
- `openclaw channels status --probe` pokazuje aktywny stan transportu per konto oraz, tam gdzie jest to obsługiwane, wyniki probe/audytu, takie jak `works` lub `audit ok`.

## Rozdzielone instalacje i blokada nowszej konfiguracji

Użyj tego, gdy usługa Gateway niespodziewanie zatrzymuje się po aktualizacji albo logi pokazują, że jeden binarny `openclaw` jest starszy niż wersja, która ostatnio zapisała `openclaw.json`.

OpenClaw oznacza zapisy konfiguracji przez `meta.lastTouchedVersion`. Polecenia tylko do odczytu nadal mogą sprawdzać konfigurację zapisaną przez nowszy OpenClaw, ale mutacje procesu i usługi odmawiają dalszego działania ze starszego binarium. Zablokowane działania obejmują uruchamianie, zatrzymywanie, restartowanie i odinstalowanie usługi Gateway, wymuszoną reinstalację usługi, uruchamianie Gateway w trybie usługi oraz czyszczenie portu przez `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Napraw PATH">
    Popraw `PATH`, aby `openclaw` rozwiązywał się do nowszej instalacji, a następnie ponów działanie.
  </Step>
  <Step title="Zainstaluj ponownie usługę Gateway">
    Zainstaluj ponownie właściwą usługę Gateway z nowszej instalacji:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Usuń nieaktualne wrappery">
    Usuń nieaktualne wpisy pakietu systemowego lub stare wrappery, które nadal wskazują na stary binarny `openclaw`.
  </Step>
</Steps>

<Warning>
Tylko w przypadku celowego obniżenia wersji lub awaryjnego odzyskiwania ustaw `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` dla pojedynczego polecenia. W normalnej pracy pozostaw tę zmienną nieustawioną.
</Warning>

## Anthropic 429: extra usage required for long context

Użyj tego, gdy logi/błędy zawierają: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Szukaj:

- Wybrany model Anthropic Opus/Sonnet ma `params.context1m: true`.
- Bieżące poświadczenie Anthropic nie kwalifikuje się do użycia długiego kontekstu.
- Żądania zawodzą tylko przy długich sesjach/uruchomieniach modeli, które wymagają ścieżki beta 1M.

Opcje naprawy:

<Steps>
  <Step title="Wyłącz context1m">
    Wyłącz `context1m` dla tego modelu, aby wrócić do zwykłego okna kontekstu.
  </Step>
  <Step title="Użyj kwalifikującego się poświadczenia">
    Użyj poświadczenia Anthropic, które kwalifikuje się do żądań długiego kontekstu, albo przełącz się na klucz API Anthropic.
  </Step>
  <Step title="Skonfiguruj fallbacki modeli">
    Skonfiguruj fallbacki modeli, aby uruchomienia były kontynuowane, gdy żądania długiego kontekstu Anthropic zostaną odrzucone.
  </Step>
</Steps>

Powiązane:

- [Anthropic](/pl/providers/anthropic)
- [Token use and costs](/pl/reference/token-use)
- [Why am I seeing HTTP 429 from Anthropic?](/pl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokalny backend zgodny z OpenAI przechodzi bezpośrednie sondy, ale uruchomienia agentów zawodzą

Użyj tego, gdy:

- `curl ... /v1/models` działa
- małe bezpośrednie wywołania `/v1/chat/completions` działają
- uruchomienia modeli OpenClaw zawodzą tylko przy zwykłych turach agenta

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Szukaj:

- bezpośrednie małe wywołania kończą się powodzeniem, ale uruchomienia OpenClaw zawodzą tylko przy większych promptach
- błędy backendu o `messages[].content`, które oczekuje ciągu znaków
- awarie backendu, które pojawiają się tylko przy większej liczbie tokenów promptu lub pełnych promptach środowiska uruchomieniowego agenta

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `messages[...].content: invalid type: sequence, expected a string` → backend odrzuca strukturalne części treści Chat Completions. Naprawa: ustaw `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - bezpośrednie małe żądania kończą się powodzeniem, ale uruchomienia agentów OpenClaw zawodzą z awariami backendu/modelu (na przykład Gemma w niektórych buildach `inferrs`) → transport OpenClaw jest prawdopodobnie już poprawny; backend zawodzi na większym kształcie promptu środowiska uruchomieniowego agenta.
    - błędy zmniejszają się po wyłączeniu narzędzi, ale nie znikają → schematy narzędzi były częścią obciążenia, ale pozostały problem nadal leży po stronie upstream modelu/serwera albo jest błędem backendu.

  </Accordion>
  <Accordion title="Opcje naprawy">
    1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions obsługujących wyłącznie ciągi.
    2. Ustaw `compat.supportsTools: false` dla modeli/backendów, które nie radzą sobie niezawodnie z powierzchnią schematu narzędzi OpenClaw.
    3. Gdzie to możliwe, zmniejsz obciążenie promptu: mniejszy bootstrap workspace, krótsza historia sesji, lżejszy model lokalny albo backend z lepszą obsługą długiego kontekstu.
    4. Jeśli małe bezpośrednie żądania nadal przechodzą, a tury agenta OpenClaw wciąż powodują awarię wewnątrz backendu, traktuj to jako ograniczenie upstream serwera/modelu i zgłoś tam reprodukcję z akceptowanym kształtem ładunku.
  </Accordion>
</AccordionGroup>

Powiązane:

- [Configuration](/pl/gateway/configuration)
- [Local models](/pl/gateway/local-models)
- [OpenAI-compatible endpoints](/pl/gateway/configuration-reference#openai-compatible-endpoints)

## Brak odpowiedzi

Jeśli kanały działają, ale nic nie odpowiada, sprawdź routowanie i politykę, zanim ponownie połączysz cokolwiek.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Szukaj:

- Oczekującego parowania dla nadawców DM.
- Blokowania wzmianek grupowych (`requireMention`, `mentionPatterns`).
- Niezgodności allowlisty kanału/grupy.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa ignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez politykę.

Powiązane:

- [Channel troubleshooting](/pl/channels/troubleshooting)
- [Groups](/pl/channels/groups)
- [Pairing](/pl/channels/pairing)

## Łączność dashboard / Control UI

Gdy dashboard/Control UI nie chce się połączyć, zweryfikuj URL, tryb uwierzytelniania i założenia bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Szukaj:

- Poprawnego URL sondy i URL dashboardu.
- Niezgodności trybu uwierzytelniania/tokena między klientem a Gateway.
- Użycia HTTP tam, gdzie wymagana jest tożsamość urządzenia.

<AccordionGroup>
  <Accordion title="Sygnatury połączenia / auth">
    - `device identity required` → niezabezpieczony kontekst albo brak uwierzytelniania urządzenia.
    - `origin not allowed` → `Origin` przeglądarki nie znajduje się w `gateway.controlUi.allowedOrigins` (albo łączysz się z originu przeglądarki spoza loopback bez jawnej allowlisty).
    - `device nonce required` / `device nonce mismatch` → klient nie kończy opartego na challenge przepływu uwierzytelniania urządzenia (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → klient podpisał niewłaściwy ładunek (albo użył starego znacznika czasu) dla bieżącego uzgadniania.
    - `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedno zaufane ponowienie z użyciem buforowanego tokena urządzenia.
    - To ponowienie z buforowanym tokenem ponownie wykorzystuje zapisany zestaw zakresów przechowywany wraz ze sparowanym tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują zamiast tego własny żądany zestaw zakresów.
    - Poza tą ścieżką ponowienia priorytet uwierzytelniania połączenia wygląda tak: najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrap.
    - Na asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego `{scope, ip}` są serializowane, zanim limiter zapisze niepowodzenie. Dwie równoległe błędne próby od tego samego klienta mogą więc pokazać `retry later` przy drugiej próbie zamiast dwóch zwykłych niedopasowań.
    - `too many failed authentication attempts (retry later)` od klienta loopback z origin przeglądarki → powtarzające się błędy z tego samego znormalizowanego `Origin` są tymczasowo blokowane; inny origin localhost używa osobnego koszyka.
    - powtarzające się `unauthorized` po tym ponowieniu → dryf współdzielonego tokena/tokena urządzenia; odśwież konfigurację tokena i w razie potrzeby ponownie zatwierdź/obróć token urządzenia.
    - `gateway connect failed:` → błędny host/port/docelowy URL.

  </Accordion>
</AccordionGroup>

### Szybka mapa szczegółowych kodów auth

Użyj `error.details.code` z nieudanego połączenia `connect`, aby wybrać następne działanie:

| Kod szczegółowy              | Znaczenie                                                                                                                                                                                     | Zalecane działanie                                                                                                                                                                                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | Klient nie wysłał wymaganego współdzielonego tokena.                                                                                                                                          | Wklej/ustaw token w kliencie i ponów próbę. Dla ścieżek dashboardu: `openclaw config get gateway.auth.token`, a następnie wklej go w ustawieniach Control UI.                                                                                                                            |
| `AUTH_TOKEN_MISMATCH`        | Współdzielony token nie pasował do tokena uwierzytelniania Gateway.                                                                                                                           | Jeśli `canRetryWithDeviceToken=true`, pozwól na jedno zaufane ponowienie. Ponowienia z buforowanym tokenem ponownie używają zapisanych zatwierdzonych zakresów; wywołujący z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli problem pozostaje, uruchom [token drift recovery checklist](/pl/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Buforowany token per urządzenie jest nieaktualny albo unieważniony.                                                                                                                           | Obróć/ponownie zatwierdź token urządzenia przy użyciu [devices CLI](/pl/cli/devices), a następnie połącz się ponownie.                                                                                                                                                                      |
| `PAIRING_REQUIRED`           | Tożsamość urządzenia wymaga zatwierdzenia. Sprawdź `error.details.reason` dla `not-paired`, `scope-upgrade`, `role-upgrade` albo `metadata-upgrade` i użyj `requestId` / `remediationHint`, jeśli są obecne. | Zatwierdź oczekującą prośbę: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`. Rozszerzenia zakresu/roli używają tego samego przepływu po sprawdzeniu żądanego dostępu.                                                                                      |

<Note>
Bezpośrednie wywołania backend RPC na loopback uwierzytelniane współdzielonym tokenem/hasłem Gateway nie powinny zależeć od bazowego zakresu sparowanego urządzenia CLI. Jeśli subagenci lub inne wewnętrzne wywołania nadal kończą się błędem `scope-upgrade`, sprawdź, czy wywołujący używa `client.id: "gateway-client"` i `client.mode: "backend"` oraz czy nie wymusza jawnego `deviceIdentity` ani tokena urządzenia.
</Note>

Kontrola migracji device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jeśli logi pokazują błędy nonce/podpisu, zaktualizuj łączącego się klienta i zweryfikuj go:

<Steps>
  <Step title="Poczekaj na connect.challenge">
    Klient czeka na wydane przez Gateway `connect.challenge`.
  </Step>
  <Step title="Podpisz ładunek">
    Klient podpisuje ładunek powiązany z challenge.
  </Step>
  <Step title="Wyślij nonce urządzenia">
    Klient wysyła `connect.params.device.nonce` z tym samym nonce challenge.
  </Step>
</Steps>

Jeśli `openclaw devices rotate` / `revoke` / `remove` jest niespodziewanie odrzucane:

- sesje tokena sparowanego urządzenia mogą zarządzać tylko **własnym** urządzeniem, chyba że wywołujący ma także `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko takich zakresów operatora, które sesja wywołująca już posiada

Powiązane:

- [Configuration](/pl/gateway/configuration) (tryby uwierzytelniania Gateway)
- [Control UI](/pl/web/control-ui)
- [Devices](/pl/cli/devices)
- [Remote access](/pl/gateway/remote)
- [Trusted proxy auth](/pl/gateway/trusted-proxy-auth)

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

- `Runtime: stopped` wraz ze wskazówkami wyjścia.
- Niezgodności konfiguracji usługi (`Config (cli)` vs `Config (service)`).
- Konfliktów portów/listenerów.
- Dodatkowych instalacji launchd/systemd/schtasks przy użyciu `--deep`.
- Wskazówek czyszczenia `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → lokalny tryb Gateway nie jest włączony albo plik konfiguracji został nadpisany i utracił `gateway.mode`. Naprawa: ustaw `gateway.mode="local"` w swojej konfiguracji albo uruchom ponownie `openclaw onboard --mode local` / `openclaw setup`, aby ponownie odcisnąć oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślna ścieżka konfiguracji to `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → wiązanie inne niż loopback bez prawidłowej ścieżki uwierzytelniania Gateway (token/hasło albo trusted-proxy tam, gdzie skonfigurowano).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflikt portu.
    - `Other gateway-like services detected (best effort)` → istnieją nieaktualne lub równoległe jednostki launchd/systemd/schtasks. W większości konfiguracji należy utrzymywać jeden Gateway na maszynę; jeśli rzeczywiście potrzebujesz więcej niż jednego, odizoluj porty + config/state/workspace. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).

  </Accordion>
</AccordionGroup>

Powiązane:

- [Background exec and process tool](/pl/gateway/background-process)
- [Configuration](/pl/gateway/configuration)
- [Doctor](/pl/gateway/doctor)

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
- Pliku `openclaw.json.clobbered.*` z oznaczeniem czasu obok aktywnej konfiguracji
- Zdarzenia systemowego głównego agenta zaczynającego się od `Config recovery warning`

<AccordionGroup>
  <Accordion title="Co się stało">
    - Odrzucona konfiguracja nie przeszła walidacji podczas uruchamiania albo hot reload.
    - OpenClaw zachował odrzucony ładunek jako `.clobbered.*`.
    - Aktywna konfiguracja została przywrócona z ostatniej zwalidowanej kopii last-known-good.
    - Następna tura głównego agenta otrzymuje ostrzeżenie, aby nie nadpisywać bezmyślnie odrzuconej konfiguracji.
    - Jeśli wszystkie problemy walidacji były w `plugins.entries.<id>...`, OpenClaw nie przywróciłby całego pliku. Błędy lokalne dla Plugin pozostają głośne, podczas gdy niezwiązane ustawienia użytkownika pozostają w aktywnej konfiguracji.

  </Accordion>
  <Accordion title="Sprawdzenie i naprawa">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Typowe sygnatury">
    - istnieje `.clobbered.*` → zewnętrzna bezpośrednia edycja albo odczyt podczas startu zostały przywrócone.
    - istnieje `.rejected.*` → zapis konfiguracji zarządzany przez OpenClaw nie przeszedł kontroli schematu lub nadpisania przed zatwierdzeniem.
    - `Config write rejected:` → zapis próbował usunąć wymagany kształt, gwałtownie zmniejszyć plik albo utrwalić nieprawidłową konfigurację.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` lub `size-drop-vs-last-good:*` → podczas uruchamiania bieżący plik został potraktowany jako nadpisany, ponieważ utracił pola albo rozmiar względem kopii last-known-good.
    - `Config last-known-good promotion skipped` → kandydat zawierał zamaskowane symbole sekretów, takie jak `***`.

  </Accordion>
  <Accordion title="Opcje naprawy">
    1. Zachowaj przywróconą aktywną konfigurację, jeśli jest poprawna.
    2. Skopiuj tylko zamierzone klucze z `.clobbered.*` lub `.rejected.*`, a następnie zastosuj je przez `openclaw config set` lub `config.patch`.
    3. Uruchom `openclaw config validate` przed restartem.
    4. Jeśli edytujesz ręcznie, zachowaj pełną konfigurację JSON5, a nie tylko częściowy obiekt, który chcesz zmienić.
  </Accordion>
</AccordionGroup>

Powiązane:

- [Config](/pl/cli/config)
- [Configuration: hot reload](/pl/gateway/configuration#config-hot-reload)
- [Configuration: strict validation](/pl/gateway/configuration#strict-validation)
- [Doctor](/pl/gateway/doctor)

## Ostrzeżenia sondy Gateway

Użyj tego, gdy `openclaw gateway probe` dociera do celu, ale nadal wypisuje blok ostrzeżeń.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Szukaj:

- `warnings[].code` i `primaryTargetId` w wyjściu JSON.
- Czy ostrzeżenie dotyczy fallbacku SSH, wielu Gateway, brakujących zakresów czy nierozwiązanych odwołań auth.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal próbowało bezpośrednich skonfigurowanych/docelowych loopback.
- `multiple reachable gateways detected` → odpowiedział więcej niż jeden cel. Zwykle oznacza to celową konfigurację multi-Gateway albo nieaktualne/zduplikowane listenery.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie zadziałało, ale szczegółowy RPC jest ograniczony zakresem; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- `Capability: pairing-pending` lub `gateway closed (1008): pairing required` → Gateway odpowiedział, ale ten klient nadal wymaga parowania/zatwierdzenia przed zwykłym dostępem operatora.
- nierozwiązany tekst ostrzeżenia `gateway.auth.*` / `gateway.remote.*` SecretRef → materiał uwierzytelniający nie był dostępny na tej ścieżce polecenia dla nieudanego celu.

Powiązane:

- [Gateway](/pl/cli/gateway)
- [Multiple gateways on the same host](/pl/gateway#multiple-gateways-same-host)
- [Remote access](/pl/gateway/remote)

## Kanał połączony, ale wiadomości nie płyną

Jeśli stan kanału to połączony, ale przepływ wiadomości nie działa, skup się na polityce, uprawnieniach i zasadach dostarczania specyficznych dla kanału.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Szukaj:

- Polityki DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlisty grup i wymagań dotyczących wzmianek.
- Brakujących uprawnień/zakresów API kanału.

Typowe sygnatury:

- `mention required` → wiadomość zignorowana przez politykę wzmianki grupowej.
- `pairing` / ślady oczekującego zatwierdzenia → nadawca nie został zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z uwierzytelnianiem/uprawnieniami kanału.

Powiązane:

- [Channel troubleshooting](/pl/channels/troubleshooting)
- [Discord](/pl/channels/discord)
- [Telegram](/pl/channels/telegram)
- [WhatsApp](/pl/channels/whatsapp)

## Dostarczanie Cron i Heartbeat

Jeśli Cron albo Heartbeat się nie uruchomił lub niczego nie dostarczył, najpierw zweryfikuj stan planisty, a potem cel dostarczania.

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

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron wyłączony.
    - `cron: timer tick failed` → tick planisty nie powiódł się; sprawdź błędy plików/logów/środowiska uruchomieniowego.
    - `heartbeat skipped` z `reason=quiet-hours` → poza oknem aktywnych godzin.
    - `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste wiersze / nagłówki Markdown, więc OpenClaw pomija wywołanie modelu.
    - `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne zadanie nie jest należne w tym ticku.
    - `heartbeat: unknown accountId` → nieprawidłowy identyfikator konta dla celu dostarczania Heartbeat.
    - `heartbeat skipped` z `reason=dm-blocked` → cel Heartbeat został rozwiązany do miejsca typu DM, podczas gdy `agents.defaults.heartbeat.directPolicy` (albo nadpisanie per agent) ma wartość `block`.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Heartbeat](/pl/gateway/heartbeat)
- [Scheduled tasks](/pl/automation/cron-jobs)
- [Scheduled tasks: troubleshooting](/pl/automation/cron-jobs#troubleshooting)

## Node sparowany, ale narzędzie nie działa

Jeśli Node jest sparowany, ale narzędzia zawodzą, odizoluj stan pierwszego planu, uprawnień i zatwierdzeń.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Szukaj:

- Node online z oczekiwanymi możliwościami.
- Przyznanych uprawnień systemu operacyjnego do kamery/mikrofonu/lokalizacji/ekranu.
- Stanu zatwierdzeń exec i allowlisty.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja Node musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brakujące uprawnienie systemu operacyjnego.
- `SYSTEM_RUN_DENIED: approval required` → oczekujące zatwierdzenie exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez allowlistę.

Powiązane:

- [Exec approvals](/pl/tools/exec-approvals)
- [Node troubleshooting](/pl/nodes/troubleshooting)
- [Nodes](/pl/nodes/index)

## Narzędzie przeglądarki nie działa

Użyj tego, gdy działania narzędzia przeglądarki zawodzą, mimo że sam Gateway jest zdrowy.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Szukaj:

- Czy ustawiono `plugins.allow` i czy zawiera `browser`.
- Prawidłowej ścieżki wykonywalnej przeglądarki.
- Osiągalności profilu CDP.
- Dostępności lokalnego Chrome dla profili `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Sygnatury Plugin / pliku wykonywalnego">
    - `unknown command "browser"` lub `unknown command 'browser'` → bundled browser Plugin jest wykluczony przez `plugins.allow`.
    - brak / niedostępność narzędzia przeglądarki przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc Plugin nigdy się nie załadował.
    - `Failed to start Chrome CDP on port` → nie udało się uruchomić procesu przeglądarki.
    - `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
    - `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` albo `ftp:`.
    - `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma nieprawidłowy port albo port spoza zakresu.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja Gateway nie ma bundled zależności środowiska uruchomieniowego `playwright-core` dla browser Plugin; uruchom `openclaw doctor --fix`, a następnie zrestartuj Gateway. Snapshoty ARIA i podstawowe zrzuty ekranu strony mogą nadal działać, ale nawigacja, snapshoty AI, zrzuty ekranu elementów przez selektor CSS i eksport PDF pozostaną niedostępne.

  </Accordion>
  <Accordion title="Sygnatury Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session nie mógł jeszcze podłączyć się do wybranego katalogu danych przeglądarki. Otwórz stronę inspect przeglądarki, włącz zdalne debugowanie, pozostaw przeglądarkę otwartą, zatwierdź pierwszy prompt podłączenia, a następnie spróbuj ponownie. Jeśli stan zalogowania nie jest wymagany, preferuj zarządzany profil `openclaw`.
    - `No Chrome tabs found for profile="user"` → profil podłączenia Chrome MCP nie ma otwartych lokalnych kart Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny endpoint CDP nie jest osiągalny z hosta Gateway.
    - `Browser attachOnly is enabled ... not reachable` albo `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko-do-podłączenia nie ma osiągalnego celu albo endpoint HTTP odpowiedział, ale nadal nie udało się otworzyć WebSocket CDP.

  </Accordion>
  <Accordion title="Sygnatury elementów / zrzutów ekranu / uploadu">
    - `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu połączyło `--full-page` z `--ref` albo `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutu ekranu Chrome MCP / `existing-session` muszą używać przechwycenia strony albo `--ref` ze snapshotu, a nie CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooki uploadu Chrome MCP wymagają refów snapshotu, a nie selektorów CSS.
    - `existing-session file uploads currently support one file at a time.` → w profilach Chrome MCP wysyłaj jeden upload na wywołanie.
    - `existing-session dialog handling does not support timeoutMs.` → hooki okien dialogowych w profilach Chrome MCP nie obsługują nadpisań limitu czasu.
    - `existing-session type does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:type` w profilach `profile="user"` / Chrome MCP existing-session albo użyj zarządzanego/profilu przeglądarki CDP, gdy wymagany jest niestandardowy limit czasu.
    - `existing-session evaluate does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:evaluate` w profilach `profile="user"` / Chrome MCP existing-session albo użyj zarządzanego/profilu przeglądarki CDP, gdy wymagany jest niestandardowy limit czasu.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki albo surowego profilu CDP.
    - nieaktualne nadpisania viewport / dark mode / locale / offline w profilach attach-only lub zdalnego CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez restartowania całego Gateway.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Browser (OpenClaw-managed)](/pl/tools/browser)
- [Browser troubleshooting](/pl/tools/browser-linux-troubleshooting)

## Jeśli po aktualizacji coś nagle przestało działać

Większość problemów po aktualizacji to dryf konfiguracji albo bardziej rygorystyczne wartości domyślne, które są teraz egzekwowane.

<AccordionGroup>
  <Accordion title="1. Zmieniło się zachowanie auth i nadpisywania URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Co sprawdzić:

    - Jeśli `gateway.mode=remote`, wywołania CLI mogą trafiać do zdalnego celu, mimo że lokalna usługa działa poprawnie.
    - Jawne wywołania `--url` nie wracają do zapisanych poświadczeń.

    Typowe sygnatury:

    - `gateway connect failed:` → błędny docelowy URL.
    - `unauthorized` → endpoint jest osiągalny, ale auth jest nieprawidłowe.

  </Accordion>
  <Accordion title="2. Guardraile bind i auth są bardziej rygorystyczne">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Co sprawdzić:

    - Wiązania inne niż loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki auth Gateway: współdzielonego tokena/hasła albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` spoza loopback.
    - Starsze klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

    Typowe sygnatury:

    - `refusing to bind gateway ... without auth` → wiązanie inne niż loopback bez prawidłowej ścieżki auth Gateway.
    - `Connectivity probe: failed` przy działającym środowisku uruchomieniowym → Gateway działa, ale jest niedostępny przy bieżącym auth/url.

  </Accordion>
  <Accordion title="3. Zmienił się stan parowania i tożsamości urządzenia">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Co sprawdzić:

    - Oczekujące zatwierdzenia urządzeń dla dashboardu/Node.
    - Oczekujące zatwierdzenia parowania DM po zmianach polityki lub tożsamości.

    Typowe sygnatury:

    - `device identity required` → auth urządzenia nie jest spełnione.
    - `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

  </Accordion>
</AccordionGroup>

Jeśli konfiguracja usługi i środowisko uruchomieniowe nadal się nie zgadzają po sprawdzeniach, zainstaluj ponownie metadane usługi z tego samego katalogu profilu/stanu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane:

- [Authentication](/pl/gateway/authentication)
- [Background exec and process tool](/pl/gateway/background-process)
- [Gateway-owned pairing](/pl/gateway/pairing)

## Powiązane

- [Doctor](/pl/gateway/doctor)
- [FAQ](/pl/help/faq)
- [Gateway runbook](/pl/gateway)
