---
read_when:
    - Centrum rozwiązywania problemów skierowało Cię tutaj w celu przeprowadzenia dokładniejszej diagnostyki
    - Potrzebujesz stabilnych sekcji runbooka opartych na objawach z dokładnymi poleceniami
sidebarTitle: Troubleshooting
summary: Szczegółowy runbook rozwiązywania problemów z Gateway, kanałami, automatyzacją, węzłami i przeglądarką
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-05-01T09:59:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a808dcfd8527b041f629cff24308550f961e9eeb4d7d4ce6f1ce84dff6bbef89
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ta strona to szczegółowy runbook. Zacznij od [/help/troubleshooting](/pl/help/troubleshooting), jeśli najpierw chcesz przejść szybką ścieżkę triage.

## Drabina poleceń

Uruchom je najpierw, w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Oczekiwane sygnały poprawnego działania:

- `openclaw gateway status` pokazuje `Runtime: running`, `Connectivity probe: ok` oraz wiersz `Capability: ...`.
- `openclaw doctor` nie zgłasza blokujących problemów z konfiguracją/usługą.
- `openclaw channels status --probe` pokazuje bieżący status transportu dla każdego konta oraz, tam gdzie jest to obsługiwane, wyniki sondy/audytu, takie jak `works` lub `audit ok`.

## Instalacje split brain i zabezpieczenie nowszej konfiguracji

Użyj tego, gdy usługa gateway nieoczekiwanie zatrzymuje się po aktualizacji albo logi pokazują, że jeden plik binarny `openclaw` jest starszy niż wersja, która ostatnio zapisała `openclaw.json`.

OpenClaw oznacza zapisy konfiguracji polem `meta.lastTouchedVersion`. Polecenia tylko do odczytu nadal mogą sprawdzać konfigurację zapisaną przez nowszą wersję OpenClaw, ale mutacje procesów i usług odmawiają kontynuacji ze starszego pliku binarnego. Blokowane działania obejmują uruchamianie, zatrzymywanie, restart, odinstalowanie usługi gateway, wymuszoną ponowną instalację usługi, uruchamianie gateway w trybie usługi oraz czyszczenie portu przez `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Popraw `PATH`, aby `openclaw` wskazywał nowszą instalację, a następnie ponownie uruchom działanie.
  </Step>
  <Step title="Reinstall the gateway service">
    Ponownie zainstaluj docelową usługę gateway z nowszej instalacji:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Usuń nieaktualny pakiet systemowy lub stare wpisy wrappera, które nadal wskazują stary plik binarny `openclaw`.
  </Step>
</Steps>

<Warning>
Tylko w przypadku celowego obniżenia wersji lub awaryjnego odzyskiwania ustaw `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` dla pojedynczego polecenia. Przy normalnym działaniu pozostaw tę zmienną nieustawioną.
</Warning>

## Anthropic 429 wymaga dodatkowego użycia dla długiego kontekstu

Użyj tego, gdy logi/błędy zawierają: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Szukaj:

- Wybrany model Anthropic Opus/Sonnet ma `params.context1m: true`.
- Bieżące poświadczenie Anthropic nie kwalifikuje się do użycia długiego kontekstu.
- Żądania zawodzą tylko w długich sesjach/uruchomieniach modelu, które potrzebują ścieżki beta 1M.

Opcje naprawy:

<Steps>
  <Step title="Disable context1m">
    Wyłącz `context1m` dla tego modelu, aby wrócić do normalnego okna kontekstu.
  </Step>
  <Step title="Use an eligible credential">
    Użyj poświadczenia Anthropic kwalifikującego się do żądań długiego kontekstu albo przełącz się na klucz API Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Skonfiguruj modele zapasowe, aby uruchomienia były kontynuowane, gdy żądania długiego kontekstu Anthropic zostaną odrzucone.
  </Step>
</Steps>

Powiązane:

- [Anthropic](/pl/providers/anthropic)
- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Dlaczego widzę HTTP 429 od Anthropic?](/pl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokalny backend zgodny z OpenAI przechodzi bezpośrednie sondy, ale uruchomienia agenta zawodzą

Użyj tego, gdy:

- `curl ... /v1/models` działa
- małe bezpośrednie wywołania `/v1/chat/completions` działają
- uruchomienia modeli OpenClaw zawodzą tylko podczas normalnych tur agenta

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
- błędy `model_not_found` lub 404, mimo że bezpośrednie `/v1/chat/completions`
  działa z tym samym prostym identyfikatorem modelu
- błędy backendu dotyczące `messages[].content`, które oczekuje ciągu znaków
- okresowe ostrzeżenia `incomplete turn detected ... stopReason=stop payloads=0` z lokalnym backendem zgodnym z OpenAI
- awarie backendu, które pojawiają się tylko przy większej liczbie tokenów promptu lub pełnych promptach środowiska wykonawczego agenta

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` z lokalnym serwerem w stylu MLX/vLLM → sprawdź, czy `baseUrl` zawiera `/v1`, `api` ma wartość `"openai-completions"` dla backendów `/v1/chat/completions`, a `models.providers.<provider>.models[].id` jest prostym lokalnym identyfikatorem dostawcy. Wybierz go raz z prefiksem dostawcy, na przykład `mlx/mlx-community/Qwen3-30B-A3B-6bit`; wpis w katalogu pozostaw jako `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend odrzuca ustrukturyzowane części treści Chat Completions. Naprawa: ustaw `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend ukończył żądanie Chat Completions, ale nie zwrócił widocznego dla użytkownika tekstu asystenta dla tej tury. OpenClaw ponawia puste tury zgodne z OpenAI, które można bezpiecznie odtworzyć, jeden raz; trwałe awarie zwykle oznaczają, że backend emituje pustą/nietekstową treść albo tłumi tekst końcowej odpowiedzi.
    - bezpośrednie małe żądania kończą się powodzeniem, ale uruchomienia agenta OpenClaw zawodzą z awariami backendu/modelu (na przykład Gemma w niektórych buildach `inferrs`) → transport OpenClaw prawdopodobnie jest już poprawny; backend zawodzi na większym kształcie promptu środowiska wykonawczego agenta.
    - awarie zmniejszają się po wyłączeniu narzędzi, ale nie znikają → schematy narzędzi były częścią presji, ale pozostały problem nadal dotyczy pojemności modelu/serwera upstream albo błędu backendu.

  </Accordion>
  <Accordion title="Fix options">
    1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions obsługujących tylko ciągi znaków.
    2. Ustaw `compat.supportsTools: false` dla modeli/backendów, które nie potrafią niezawodnie obsłużyć powierzchni schematu narzędzi OpenClaw.
    3. Zmniejsz presję promptu tam, gdzie to możliwe: mniejszy bootstrap workspace, krótsza historia sesji, lżejszy model lokalny albo backend z mocniejszą obsługą długiego kontekstu.
    4. Jeśli małe bezpośrednie żądania nadal przechodzą, a tury agenta OpenClaw wciąż powodują awarię wewnątrz backendu, potraktuj to jako ograniczenie serwera/modelu upstream i zgłoś tam reprodukcję z zaakceptowanym kształtem payloadu.
  </Accordion>
</AccordionGroup>

Powiązane:

- [Konfiguracja](/pl/gateway/configuration)
- [Modele lokalne](/pl/gateway/local-models)
- [Endpointy zgodne z OpenAI](/pl/gateway/configuration-reference#openai-compatible-endpoints)

## Brak odpowiedzi

Jeśli kanały działają, ale nic nie odpowiada, sprawdź routing i zasady, zanim cokolwiek ponownie połączysz.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Szukaj:

- Oczekujące parowanie dla nadawców DM.
- Bramka wzmianki w grupie (`requireMention`, `mentionPatterns`).
- Niezgodności allowlist kanału/grupy.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa ignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez zasady.

Powiązane:

- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Grupy](/pl/channels/groups)
- [Parowanie](/pl/channels/pairing)

## Łączność interfejsu sterowania dashboardu

Gdy dashboard/interfejs sterowania nie może się połączyć, zweryfikuj URL, tryb uwierzytelniania i założenia dotyczące bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Szukaj:

- Poprawny URL sondy i URL dashboardu.
- Niezgodność trybu/tokena uwierzytelniania między klientem a gateway.
- Użycie HTTP tam, gdzie wymagana jest tożsamość urządzenia.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → niezabezpieczony kontekst lub brak uwierzytelniania urządzenia.
    - `origin not allowed` → przeglądarkowy `Origin` nie znajduje się w `gateway.controlUi.allowedOrigins` (albo łączysz się z pochodzenia przeglądarki spoza loopback bez jawnej allowlist).
    - `device nonce required` / `device nonce mismatch` → klient nie kończy przepływu uwierzytelniania urządzenia opartego na wyzwaniu (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → klient podpisał niewłaściwy payload (albo nieaktualny znacznik czasu) dla bieżącego handshake.
    - `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną próbę ponowienia z buforowanym tokenem urządzenia.
    - Ta ponowna próba z buforowanym tokenem ponownie używa buforowanego zestawu zakresów zapisanego ze sparowanym tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują zamiast tego swój żądany zestaw zakresów.
    - Poza tą ścieżką ponawiania priorytet uwierzytelniania przy połączeniu to najpierw jawny współdzielony token/hasło, następnie jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrap.
    - Na asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego `{scope, ip}` są serializowane, zanim limiter zarejestruje awarię. Dwie błędne równoczesne próby ponowienia od tego samego klienta mogą więc zwrócić `retry later` przy drugiej próbie zamiast dwóch zwykłych niezgodności.
    - `too many failed authentication attempts (retry later)` od klienta przeglądarkowego z origin loopback → powtarzające się awarie z tego samego znormalizowanego `Origin` są tymczasowo blokowane; inny origin localhost używa osobnego koszyka.
    - powtarzające się `unauthorized` po tej ponownej próbie → rozjazd tokenu współdzielonego/tokenu urządzenia; odśwież konfigurację tokena i w razie potrzeby ponownie zatwierdź/obróć token urządzenia.
    - `gateway connect failed:` → nieprawidłowy host/port/docelowy URL.

  </Accordion>
</AccordionGroup>

### Szybka mapa kodów szczegółów uwierzytelniania

Użyj `error.details.code` z nieudanego response `connect`, aby wybrać następne działanie:

| Kod szczegółu                | Znaczenie                                                                                                                                                                                    | Zalecane działanie                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klient nie wysłał wymaganego tokenu współdzielonego.                                                                                                                                        | Wklej/ustaw token w kliencie i spróbuj ponownie. Dla ścieżek dashboardu: `openclaw config get gateway.auth.token`, a następnie wklej go w ustawieniach Control UI.                                                                                                                       |
| `AUTH_TOKEN_MISMATCH`        | Token współdzielony nie pasował do tokenu uwierzytelniania Gateway.                                                                                                                         | Jeśli `canRetryWithDeviceToken=true`, zezwól na jedną zaufaną próbę ponowienia. Ponowienia z tokenem z pamięci podręcznej używają zapisanych zatwierdzonych zakresów; wywołujący z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal się nie udaje, uruchom [listę kontrolną odzyskiwania dryfu tokenu](/pl/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per urządzenie z pamięci podręcznej jest nieaktualny lub cofnięty.                                                                                                                    | Obróć/ponownie zatwierdź token urządzenia za pomocą [devices CLI](/pl/cli/devices), a następnie połącz ponownie.                                                                                                                                                                             |
| `PAIRING_REQUIRED`           | Tożsamość urządzenia wymaga zatwierdzenia. Sprawdź `error.details.reason` pod kątem `not-paired`, `scope-upgrade`, `role-upgrade` lub `metadata-upgrade` i użyj `requestId` / `remediationHint`, gdy są obecne. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`. Ulepszenia zakresu/roli używają tego samego przepływu po przejrzeniu żądanego dostępu.                                                                                       |

<Note>
Bezpośrednie backendowe RPC przez loopback uwierzytelniane współdzielonym tokenem/hasłem Gateway nie powinny zależeć od bazowego zakresu sparowanego urządzenia z CLI. Jeśli subagenci lub inne wywołania wewnętrzne nadal kończą się niepowodzeniem z `scope-upgrade`, sprawdź, czy wywołujący używa `client.id: "gateway-client"` oraz `client.mode: "backend"` i nie wymusza jawnego `deviceIdentity` ani tokenu urządzenia.
</Note>

Kontrola migracji uwierzytelniania urządzeń v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jeśli logi pokazują błędy nonce/podpisu, zaktualizuj łączącego się klienta i zweryfikuj go:

<Steps>
  <Step title="Poczekaj na connect.challenge">
    Klient czeka na `connect.challenge` wystawione przez Gateway.
  </Step>
  <Step title="Podpisz payload">
    Klient podpisuje payload powiązany z wyzwaniem.
  </Step>
  <Step title="Wyślij nonce urządzenia">
    Klient wysyła `connect.params.device.nonce` z tym samym nonce wyzwania.
  </Step>
</Steps>

Jeśli `openclaw devices rotate` / `revoke` / `remove` jest niespodziewanie odrzucane:

- sesje tokenu sparowanego urządzenia mogą zarządzać tylko **własnym** urządzeniem, chyba że wywołujący ma też `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko zakresów operatora, które sesja wywołującego już posiada

Powiązane:

- [Konfiguracja](/pl/gateway/configuration) (tryby uwierzytelniania Gateway)
- [Control UI](/pl/web/control-ui)
- [Urządzenia](/pl/cli/devices)
- [Dostęp zdalny](/pl/gateway/remote)
- [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth)

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

- `Runtime: stopped` ze wskazówkami kodu zakończenia.
- Niezgodność konfiguracji usługi (`Config (cli)` kontra `Config (service)`).
- Konflikty portu/listenera.
- Dodatkowe instalacje launchd/systemd/schtasks, gdy użyto `--deep`.
- Wskazówki czyszczenia `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → lokalny tryb Gateway nie jest włączony albo plik konfiguracji został nadpisany i utracił `gateway.mode`. Poprawka: ustaw `gateway.mode="local"` w konfiguracji albo ponownie uruchom `openclaw onboard --mode local` / `openclaw setup`, aby odtworzyć oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślna ścieżka konfiguracji to `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → wiązanie inne niż loopback bez prawidłowej ścieżki uwierzytelniania Gateway (token/hasło albo zaufane proxy, gdy skonfigurowane).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflikt portu.
    - `Other gateway-like services detected (best effort)` → istnieją przestarzałe lub równoległe jednostki launchd/systemd/schtasks. Większość konfiguracji powinna utrzymywać jeden Gateway na maszynę; jeśli potrzebujesz więcej niż jednego, odizoluj porty + konfigurację/stan/przestrzeń roboczą. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` z doctor → istnieje jednostka systemowa systemd, podczas gdy brakuje usługi na poziomie użytkownika. Usuń lub wyłącz duplikat, zanim pozwolisz doctor zainstalować usługę użytkownika, albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, jeśli jednostka systemowa jest zamierzonym nadzorcą.
    - `Gateway service port does not match current gateway config` → zainstalowany nadzorca nadal przypina stary `--port`. Uruchom `openclaw doctor --fix` albo `openclaw gateway install --force`, a następnie zrestartuj usługę Gateway.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Exec w tle i narzędzie procesu](/pl/gateway/background-process)
- [Konfiguracja](/pl/gateway/configuration)
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
- Pliku `openclaw.json.clobbered.*` ze znacznikiem czasu obok aktywnej konfiguracji
- Zdarzenia systemowego głównego agenta, które zaczyna się od `Config recovery warning`

<AccordionGroup>
  <Accordion title="Co się stało">
    - Odrzucona konfiguracja nie przeszła walidacji podczas uruchamiania lub gorącego przeładowania.
    - OpenClaw zachował odrzucony payload jako `.clobbered.*`.
    - Aktywna konfiguracja została przywrócona z ostatniej zwalidowanej kopii last-known-good.
    - Następny przebieg głównego agenta otrzymuje ostrzeżenie, aby nie przepisywać odrzuconej konfiguracji na ślepo.
    - Jeśli wszystkie problemy walidacji znajdowały się pod `plugins.entries.<id>...`, OpenClaw nie przywróciłby całego pliku. Lokalne awarie Plugin pozostają widoczne, podczas gdy niezwiązane ustawienia użytkownika zostają w aktywnej konfiguracji.

  </Accordion>
  <Accordion title="Sprawdź i napraw">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Typowe sygnatury">
    - Istnieje `.clobbered.*` → zewnętrzna bezpośrednia edycja lub odczyt przy uruchamianiu zostały przywrócone.
    - Istnieje `.rejected.*` → zapis konfiguracji należący do OpenClaw nie przeszedł schematu lub kontroli nadpisania przed zatwierdzeniem.
    - `Config write rejected:` → zapis próbował usunąć wymaganą strukturę, gwałtownie zmniejszyć plik lub utrwalić nieprawidłową konfigurację.
    - `Rejected validation details:` → log odzyskiwania lub powiadomienie głównego agenta zawiera ścieżkę schematu, która spowodowała przywrócenie, taką jak `agents.defaults.execution` lub `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` lub `size-drop-vs-last-good:*` → uruchamianie potraktowało bieżący plik jako nadpisany, ponieważ utracił pola lub rozmiar w porównaniu z kopią zapasową last-known-good.
    - `Config last-known-good promotion skipped` → kandydat zawierał zredagowane placeholdery sekretów, takie jak `***`.

  </Accordion>
  <Accordion title="Opcje naprawy">
    1. Zachowaj przywróconą aktywną konfigurację, jeśli jest poprawna.
    2. Skopiuj tylko zamierzone klucze z `.clobbered.*` lub `.rejected.*`, a następnie zastosuj je za pomocą `openclaw config set` lub `config.patch`.
    3. Uruchom `openclaw config validate` przed restartem.
    4. Jeśli edytujesz ręcznie, zachowaj pełną konfigurację JSON5, a nie tylko częściowy obiekt, który chcesz zmienić.
  </Accordion>
</AccordionGroup>

Powiązane:

- [Config](/pl/cli/config)
- [Konfiguracja: gorące przeładowanie](/pl/gateway/configuration#config-hot-reload)
- [Konfiguracja: ścisła walidacja](/pl/gateway/configuration#strict-validation)
- [Doctor](/pl/gateway/doctor)

## Ostrzeżenia sondy Gateway

Użyj tego, gdy `openclaw gateway probe` dociera do czegoś, ale nadal wypisuje blok ostrzeżenia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Szukaj:

- `warnings[].code` i `primaryTargetId` w wyjściu JSON.
- Czy ostrzeżenie dotyczy awaryjnego SSH, wielu Gateway, brakujących zakresów czy nierozwiązanych odwołań uwierzytelniania.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal spróbowało bezpośrednich skonfigurowanych/celów loopback.
- `multiple reachable gateways detected` → odpowiedział więcej niż jeden cel. Zwykle oznacza to zamierzoną konfigurację z wieloma Gateway albo przestarzałe/zduplikowane listenery.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie zadziałało, ale szczegółowe RPC jest ograniczone zakresem; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → połączenie zadziałało, ale pełny zestaw diagnostycznych RPC przekroczył limit czasu lub zakończył się niepowodzeniem. Traktuj to jako osiągalny Gateway z ograniczoną diagnostyką; porównaj `connect.ok` i `connect.rpcOk` w wyjściu `--json`.
- `Capability: pairing-pending` lub `gateway closed (1008): pairing required` → Gateway odpowiedział, ale ten klient nadal wymaga parowania/zatwierdzenia przed normalnym dostępem operatora.
- nierozwiązany tekst ostrzeżenia SecretRef `gateway.auth.*` / `gateway.remote.*` → materiał uwierzytelniania był niedostępny w tej ścieżce polecenia dla nieudanego celu.

Powiązane:

- [Gateway](/pl/cli/gateway)
- [Wiele Gateway na tym samym hoście](/pl/gateway#multiple-gateways-same-host)
- [Dostęp zdalny](/pl/gateway/remote)

## Kanał połączony, wiadomości nie przepływają

Jeśli stan kanału to połączony, ale przepływ wiadomości nie działa, skup się na polityce, uprawnieniach i regułach dostarczania specyficznych dla kanału.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Szukaj:

- Zasady wiadomości prywatnych (`pairing`, `allowlist`, `open`, `disabled`).
- Lista dozwolonych grup i wymagania dotyczące wzmianki.
- Brakujące uprawnienia/zakresy API kanału.

Typowe sygnatury:

- `mention required` → wiadomość zignorowana przez zasady wzmianek w grupie.
- `pairing` / ślady oczekującego zatwierdzenia → nadawca nie jest zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z uwierzytelnianiem/uprawnieniami kanału.

Powiązane:

- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Discord](/pl/channels/discord)
- [Telegram](/pl/channels/telegram)
- [WhatsApp](/pl/channels/whatsapp)

## Dostarczanie Cron i Heartbeat

Jeśli Cron lub Heartbeat nie uruchomił się albo nie dostarczył wiadomości, najpierw sprawdź stan harmonogramu, a potem cel dostarczania.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Szukaj:

- Włączony Cron i obecne następne wybudzenie.
- Status historii uruchomień zadania (`ok`, `skipped`, `error`).
- Powody pominięcia Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron wyłączony.
    - `cron: timer tick failed` → takt harmonogramu nie powiódł się; sprawdź błędy plików/logów/środowiska uruchomieniowego.
    - `heartbeat skipped` z `reason=quiet-hours` → poza oknem godzin aktywności.
    - `heartbeat skipped` z `reason=empty-heartbeat-file` → plik `HEARTBEAT.md` istnieje, ale zawiera tylko puste wiersze / nagłówki Markdown, więc OpenClaw pomija wywołanie modelu.
    - `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne zadania nie są należne w tym takcie.
    - `heartbeat: unknown accountId` → nieprawidłowy identyfikator konta dla celu dostarczania Heartbeat.
    - `heartbeat skipped` z `reason=dm-blocked` → cel Heartbeat został rozpoznany jako miejsce docelowe typu DM, gdy `agents.defaults.heartbeat.directPolicy` (lub nadpisanie dla agenta) jest ustawione na `block`.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Heartbeat](/pl/gateway/heartbeat)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
- [Zaplanowane zadania: rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting)

## Node sparowany, narzędzie zawodzi

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
- Przyznane uprawnienia systemu operacyjnego do kamery/mikrofonu/lokalizacji/ekranu.
- Zatwierdzenia wykonywania poleceń i stan listy dozwolonych.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja Node musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brakuje uprawnienia systemu operacyjnego.
- `SYSTEM_RUN_DENIED: approval required` → oczekuje zatwierdzenie wykonania polecenia.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez listę dozwolonych.

Powiązane:

- [Zatwierdzenia wykonywania poleceń](/pl/tools/exec-approvals)
- [Rozwiązywanie problemów z Node](/pl/nodes/troubleshooting)
- [Nodes](/pl/nodes/index)

## Narzędzie przeglądarki zawodzi

Użyj tego, gdy akcje narzędzia przeglądarki zawodzą, mimo że sam Gateway działa prawidłowo.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Szukaj:

- Czy `plugins.allow` jest ustawione i zawiera `browser`.
- Prawidłowa ścieżka do pliku wykonywalnego przeglądarki.
- Osiągalność profilu CDP.
- Dostępność lokalnego Chrome dla profili `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` lub `unknown command 'browser'` → dołączony Plugin przeglądarki jest wykluczony przez `plugins.allow`.
    - brakujące / niedostępne narzędzie przeglądarki przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc Plugin nigdy się nie załadował.
    - `Failed to start Chrome CDP on port` → nie udało się uruchomić procesu przeglądarki.
    - `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
    - `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` lub `ftp:`.
    - `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma nieprawidłowy port albo port spoza zakresu.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja Gateway nie ma zależności środowiska uruchomieniowego `playwright-core` dołączonego Pluginu przeglądarki; uruchom `openclaw doctor --fix`, a potem zrestartuj Gateway. Migawki ARIA i podstawowe zrzuty ekranu stron nadal mogą działać, ale nawigacja, migawki AI, zrzuty ekranu elementów według selektorów CSS i eksport PDF pozostają niedostępne.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → istniejąca sesja Chrome MCP nie mogła jeszcze dołączyć do wybranego katalogu danych przeglądarki. Otwórz stronę inspekcji przeglądarki, włącz zdalne debugowanie, pozostaw przeglądarkę otwartą, zatwierdź pierwszy monit dołączenia, a potem spróbuj ponownie. Jeśli stan zalogowania nie jest wymagany, wybierz zarządzany profil `openclaw`.
    - `No Chrome tabs found for profile="user"` → profil dołączania Chrome MCP nie ma otwartych lokalnych kart Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny punkt końcowy CDP nie jest osiągalny z hosta Gateway.
    - `Browser attachOnly is enabled ... not reachable` lub `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko do dołączania nie ma osiągalnego celu albo punkt końcowy HTTP odpowiedział, ale WebSocket CDP nadal nie mógł zostać otwarty.

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu połączyło `--full-page` z `--ref` lub `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwytywania strony lub `--ref` z migawki, a nie CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → haki przesyłania Chrome MCP potrzebują odwołań z migawek, a nie selektorów CSS.
    - `existing-session file uploads currently support one file at a time.` → wysyłaj jedno przesłanie na wywołanie w profilach Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → haki okien dialogowych w profilach Chrome MCP nie obsługują nadpisań limitu czasu.
    - `existing-session type does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:type` w profilach `profile="user"` / istniejących sesjach Chrome MCP albo użyj zarządzanego profilu przeglądarki/CDP, gdy wymagany jest niestandardowy limit czasu.
    - `existing-session evaluate does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:evaluate` w profilach `profile="user"` / istniejących sesjach Chrome MCP albo użyj zarządzanego profilu przeglądarki/CDP, gdy wymagany jest niestandardowy limit czasu.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki lub surowego profilu CDP.
    - nieaktualne nadpisania widoku / trybu ciemnego / ustawień regionalnych / trybu offline w profilach tylko do dołączania lub zdalnych profilach CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez restartowania całego Gateway.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Przeglądarka (zarządzana przez OpenClaw)](/pl/tools/browser)
- [Rozwiązywanie problemów z przeglądarką w systemie Linux](/pl/tools/browser-linux-troubleshooting)

## Jeśli po aktualizacji coś nagle przestało działać

Większość awarii po aktualizacji wynika z dryfu konfiguracji albo ze ściślejszego egzekwowania wartości domyślnych.

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Co sprawdzić:

    - Jeśli `gateway.mode=remote`, wywołania CLI mogą trafiać do zdalnego celu, podczas gdy lokalna usługa działa prawidłowo.
    - Jawne wywołania `--url` nie wracają do zapisanych poświadczeń.

    Typowe sygnatury:

    - `gateway connect failed:` → nieprawidłowy docelowy URL.
    - `unauthorized` → punkt końcowy osiągalny, ale uwierzytelnianie jest nieprawidłowe.

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Co sprawdzić:

    - Bindowania inne niż loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki uwierzytelniania Gateway: uwierzytelniania współdzielonym tokenem/hasłem albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` bez loopback.
    - Stare klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

    Typowe sygnatury:

    - `refusing to bind gateway ... without auth` → bindowanie inne niż loopback bez prawidłowej ścieżki uwierzytelniania Gateway.
    - `Connectivity probe: failed` podczas działania środowiska uruchomieniowego → Gateway działa, ale jest niedostępny przy bieżącym uwierzytelnianiu/adresie URL.

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Co sprawdzić:

    - Oczekujące zatwierdzenia urządzeń dla panelu i węzłów.
    - Oczekujące zatwierdzenia parowania DM po zmianach zasad lub tożsamości.

    Typowe sygnatury:

    - `device identity required` → uwierzytelnianie urządzenia nie jest spełnione.
    - `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

  </Accordion>
</AccordionGroup>

Jeśli po tych kontrolach konfiguracja usługi i środowisko uruchomieniowe nadal się nie zgadzają, zainstaluj ponownie metadane usługi z tego samego katalogu profilu/stanu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane:

- [Uwierzytelnianie](/pl/gateway/authentication)
- [Wykonywanie poleceń w tle i narzędzie procesów](/pl/gateway/background-process)
- [Parowanie zarządzane przez Gateway](/pl/gateway/pairing)

## Powiązane

- [Doctor](/pl/gateway/doctor)
- [FAQ](/pl/help/faq)
- [Runbook Gateway](/pl/gateway)
