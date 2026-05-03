---
read_when:
    - Centrum rozwiązywania problemów skierowało cię tutaj w celu dokładniejszej diagnostyki
    - Potrzebujesz stabilnych sekcji procedury operacyjnej opartych na objawach, z dokładnymi poleceniami
sidebarTitle: Troubleshooting
summary: Szczegółowa procedura rozwiązywania problemów z Gateway, kanałami, automatyzacją, węzłami i przeglądarką
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-05-03T21:33:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19422615706ca09124b19dd3e21b2c13391d6daf2b1807e01b4ce2047d02e522
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ta strona to szczegółowy runbook. Zacznij od [/help/troubleshooting](/pl/help/troubleshooting), jeśli najpierw chcesz skorzystać z szybkiej ścieżki triage.

## Drabinka poleceń

Najpierw uruchom je w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Oczekiwane sygnały prawidłowego działania:

- `openclaw gateway status` pokazuje `Runtime: running`, `Connectivity probe: ok` oraz wiersz `Capability: ...`.
- `openclaw doctor` nie zgłasza blokujących problemów z konfiguracją ani usługą.
- `openclaw channels status --probe` pokazuje aktywny status transportu dla każdego konta oraz, tam gdzie jest to obsługiwane, wyniki sondy/audytu, takie jak `works` lub `audit ok`.

## Instalacje split brain i zabezpieczenie nowszej konfiguracji

Użyj tego, gdy usługa gateway nieoczekiwanie zatrzymuje się po aktualizacji albo logi pokazują, że jeden plik binarny `openclaw` jest starszy niż wersja, która ostatnio zapisała `openclaw.json`.

OpenClaw oznacza zapisy konfiguracji polem `meta.lastTouchedVersion`. Polecenia tylko do odczytu nadal mogą sprawdzać konfigurację zapisaną przez nowszy OpenClaw, ale mutacje procesów i usług odmawiają kontynuacji ze starszego pliku binarnego. Zablokowane działania obejmują uruchamianie, zatrzymywanie, restartowanie i odinstalowywanie usługi gateway, wymuszoną reinstalację usługi, uruchamianie gateway w trybie usługi oraz czyszczenie portów przez `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Napraw PATH">
    Napraw `PATH`, aby `openclaw` wskazywał na nowszą instalację, a następnie ponownie uruchom działanie.
  </Step>
  <Step title="Zainstaluj ponownie usługę gateway">
    Zainstaluj ponownie zamierzoną usługę gateway z nowszej instalacji:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Usuń nieaktualne wrappery">
    Usuń nieaktualne pakiety systemowe lub stare wpisy wrapperów, które nadal wskazują na stary plik binarny `openclaw`.
  </Step>
</Steps>

<Warning>
Tylko w przypadku celowego downgrade'u albo awaryjnego odzyskiwania ustaw `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` dla pojedynczego polecenia. Przy normalnym działaniu pozostaw tę zmienną nieustawioną.
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
- Bieżące dane uwierzytelniające Anthropic nie kwalifikują się do użycia długiego kontekstu.
- Żądania zawodzą tylko w długich sesjach/uruchomieniach modeli, które wymagają ścieżki beta 1M.

Opcje naprawy:

<Steps>
  <Step title="Wyłącz context1m">
    Wyłącz `context1m` dla tego modelu, aby wrócić do normalnego okna kontekstu.
  </Step>
  <Step title="Użyj kwalifikujących się danych uwierzytelniających">
    Użyj danych uwierzytelniających Anthropic kwalifikujących się do żądań z długim kontekstem albo przełącz się na klucz API Anthropic.
  </Step>
  <Step title="Skonfiguruj modele zastępcze">
    Skonfiguruj modele zastępcze, aby uruchomienia były kontynuowane, gdy żądania długiego kontekstu Anthropic zostaną odrzucone.
  </Step>
</Steps>

Powiązane:

- [Anthropic](/pl/providers/anthropic)
- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Dlaczego widzę HTTP 429 od Anthropic?](/pl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokalny backend zgodny z OpenAI przechodzi bezpośrednie sondy, ale uruchomienia agentów zawodzą

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

- bezpośrednie małe wywołania się udają, ale uruchomienia OpenClaw zawodzą tylko przy większych promptach
- błędy `model_not_found` lub 404, mimo że bezpośrednie `/v1/chat/completions`
  działa z tym samym nieprefiksowanym identyfikatorem modelu
- błędy backendu dotyczące tego, że `messages[].content` oczekuje ciągu znaków
- sporadyczne ostrzeżenia `incomplete turn detected ... stopReason=stop payloads=0` z lokalnym backendem zgodnym z OpenAI
- awarie backendu, które pojawiają się tylko przy większej liczbie tokenów promptu albo pełnych promptach środowiska uruchomieniowego agenta

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `model_not_found` z lokalnym serwerem w stylu MLX/vLLM → sprawdź, czy `baseUrl` zawiera `/v1`, `api` ma wartość `"openai-completions"` dla backendów `/v1/chat/completions`, a `models.providers.<provider>.models[].id` jest nieprefiksowanym lokalnym identyfikatorem dostawcy. Wybierz go raz z prefiksem dostawcy, na przykład `mlx/mlx-community/Qwen3-30B-A3B-6bit`; zachowaj wpis katalogu jako `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend odrzuca strukturalne części treści Chat Completions. Naprawa: ustaw `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend zakończył żądanie Chat Completions, ale nie zwrócił widocznego dla użytkownika tekstu asystenta dla tej tury. OpenClaw jednokrotnie ponawia bezpieczne do odtworzenia puste tury zgodne z OpenAI; utrzymujące się awarie zwykle oznaczają, że backend emituje pustą/nietekstową treść albo tłumi tekst końcowej odpowiedzi.
    - bezpośrednie małe żądania się udają, ale uruchomienia agentów OpenClaw zawodzą przez awarie backendu/modelu (na przykład Gemma w niektórych kompilacjach `inferrs`) → transport OpenClaw najpewniej jest już poprawny; backend zawodzi na większym kształcie promptu środowiska uruchomieniowego agenta.
    - awarie zmniejszają się po wyłączeniu narzędzi, ale nie znikają → schematy narzędzi były częścią obciążenia, ale pozostały problem nadal dotyczy wydajności upstreamowego modelu/serwera albo błędu backendu.

  </Accordion>
  <Accordion title="Opcje naprawy">
    1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions obsługujących tylko ciągi znaków.
    2. Ustaw `compat.supportsTools: false` dla modeli/backendów, które nie obsługują niezawodnie powierzchni schematów narzędzi OpenClaw.
    3. Gdzie to możliwe, obniż obciążenie promptu: mniejszy bootstrap przestrzeni roboczej, krótsza historia sesji, lżejszy model lokalny albo backend z lepszą obsługą długiego kontekstu.
    4. Jeśli małe bezpośrednie żądania nadal przechodzą, a tury agentów OpenClaw wciąż powodują awarie wewnątrz backendu, traktuj to jako ograniczenie upstreamowego serwera/modelu i zgłoś tam reprodukcję z zaakceptowanym kształtem payloadu.
  </Accordion>
</AccordionGroup>

Powiązane:

- [Konfiguracja](/pl/gateway/configuration)
- [Modele lokalne](/pl/gateway/local-models)
- [Endpointy zgodne z OpenAI](/pl/gateway/configuration-reference#openai-compatible-endpoints)

## Brak odpowiedzi

Jeśli kanały działają, ale nic nie odpowiada, przed ponownym łączeniem czegokolwiek sprawdź routing i zasady.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Szukaj:

- Oczekujące parowanie dla nadawców DM.
- Bramkowanie wzmianek w grupie (`requireMention`, `mentionPatterns`).
- Niezgodności list dozwolonych kanałów/grup.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa jest ignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez zasady.

Powiązane:

- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Grupy](/pl/channels/groups)
- [Parowanie](/pl/channels/pairing)

## Łączność interfejsu sterowania dashboardu

Gdy dashboard/interfejs sterowania nie może się połączyć, sprawdź adres URL, tryb uwierzytelniania i założenia dotyczące bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Szukaj:

- Poprawny adres URL sondy i adres URL dashboardu.
- Niezgodność trybu uwierzytelniania/tokenu między klientem a gateway.
- Użycie HTTP tam, gdzie wymagana jest tożsamość urządzenia.

<AccordionGroup>
  <Accordion title="Sygnatury połączenia / uwierzytelniania">
    - `device identity required` → niezabezpieczony kontekst albo brak uwierzytelniania urządzenia.
    - `origin not allowed` → przeglądarkowy `Origin` nie znajduje się w `gateway.controlUi.allowedOrigins` (albo łączysz się z pochodzenia przeglądarki innego niż local loopback bez jawnej listy dozwolonych).
    - `device nonce required` / `device nonce mismatch` → klient nie kończy przepływu uwierzytelniania urządzenia opartego na wyzwaniu (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → klient podpisał niewłaściwy payload (albo nieaktualny znacznik czasu) dla bieżącego handshake'u.
    - `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną próbę ponowienia z buforowanym tokenem urządzenia.
    - Ta próba ponowienia z buforowanym tokenem używa buforowanego zestawu zakresów zapisanego ze sparowanym tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują zamiast tego swój żądany zestaw zakresów.
    - Poza tą ścieżką ponowienia pierwszeństwo uwierzytelniania połączenia to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a następnie token bootstrapu.
    - Na asynchronicznej ścieżce interfejsu sterowania Tailscale Serve nieudane próby dla tego samego `{scope, ip}` są serializowane, zanim limiter zapisze niepowodzenie. Dwie złe równoczesne próby ponowienia z tego samego klienta mogą więc pokazać `retry later` przy drugiej próbie zamiast dwóch zwykłych niezgodności.
    - `too many failed authentication attempts (retry later)` z klienta przeglądarkowego pochodzącego z local loopback → powtarzające się niepowodzenia z tego samego znormalizowanego `Origin` są tymczasowo blokowane; inne pochodzenie localhost używa osobnego zasobnika.
    - powtarzające się `unauthorized` po tej próbie ponowienia → rozjazd współdzielonego tokenu/tokenu urządzenia; odśwież konfigurację tokenu i w razie potrzeby ponownie zatwierdź/obróć token urządzenia.
    - `gateway connect failed:` → niewłaściwy host/port/docelowy adres URL.

  </Accordion>
</AccordionGroup>

### Szybka mapa kodów szczegółów uwierzytelniania

Użyj `error.details.code` z nieudanego `connect`, aby wybrać następne działanie:

| Kod szczegółowy              | Znaczenie                                                                                                                                                                                   | Zalecane działanie                                                                                                                                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klient nie wysłał wymaganego współdzielonego tokenu.                                                                                                                                        | Wklej/ustaw token w kliencie i spróbuj ponownie. Dla ścieżek panelu: `openclaw config get gateway.auth.token`, a następnie wklej go w ustawieniach Control UI.                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Współdzielony token nie pasował do tokenu uwierzytelniania Gateway.                                                                                                                         | Jeśli `canRetryWithDeviceToken=true`, zezwól na jedną zaufaną ponowną próbę. Ponowne próby z buforowanym tokenem używają zapisanych zatwierdzonych zakresów; jawni wywołujący z `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal się nie udaje, uruchom [listę kontrolną odzyskiwania po dryfcie tokenu](/pl/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Buforowany token dla urządzenia jest nieaktualny lub cofnięty.                                                                                                                              | Obróć/ponownie zatwierdź token urządzenia za pomocą [CLI urządzeń](/pl/cli/devices), a następnie połącz ponownie.                                                                                                                                                                                |
| `PAIRING_REQUIRED`           | Tożsamość urządzenia wymaga zatwierdzenia. Sprawdź `error.details.reason` pod kątem `not-paired`, `scope-upgrade`, `role-upgrade` lub `metadata-upgrade` i użyj `requestId` / `remediationHint`, gdy są obecne. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`. Ulepszenia zakresu/roli używają tego samego przepływu po sprawdzeniu żądanego dostępu.                                                                                           |

<Note>
Bezpośrednie wywołania RPC backendu przez loopback, uwierzytelnione współdzielonym tokenem/hasłem Gateway, nie powinny zależeć od bazowego zakresu sparowanego urządzenia w CLI. Jeśli subagenci lub inne wywołania wewnętrzne nadal kończą się niepowodzeniem z `scope-upgrade`, sprawdź, czy wywołujący używa `client.id: "gateway-client"` i `client.mode: "backend"` oraz nie wymusza jawnego `deviceIdentity` ani tokenu urządzenia.
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
  <Step title="Podpisz ładunek">
    Klient podpisuje ładunek powiązany z wyzwaniem.
  </Step>
  <Step title="Wyślij nonce urządzenia">
    Klient wysyła `connect.params.device.nonce` z tym samym nonce wyzwania.
  </Step>
</Steps>

Jeśli `openclaw devices rotate` / `revoke` / `remove` zostanie nieoczekiwanie odrzucone:

- sesje z tokenem sparowanego urządzenia mogą zarządzać tylko **własnym** urządzeniem, chyba że wywołujący ma także `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko zakresów operatora, które sesja wywołującego już posiada

Powiązane:

- [Konfiguracja](/pl/gateway/configuration) (tryby uwierzytelniania Gateway)
- [Control UI](/pl/web/control-ui)
- [Urządzenia](/pl/cli/devices)
- [Zdalny dostęp](/pl/gateway/remote)
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

- `Runtime: stopped` ze wskazówkami dotyczącymi kodu zakończenia.
- Niezgodności konfiguracji usługi (`Config (cli)` vs `Config (service)`).
- Konfliktów portu/nasłuchiwania.
- Dodatkowych instalacji launchd/systemd/schtasks, gdy używane jest `--deep`.
- Wskazówek czyszczenia `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → lokalny tryb Gateway nie jest włączony albo plik konfiguracji został nadpisany i utracił `gateway.mode`. Poprawka: ustaw `gateway.mode="local"` w konfiguracji albo ponownie uruchom `openclaw onboard --mode local` / `openclaw setup`, aby ponownie ostemplować oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślna ścieżka konfiguracji to `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → wiązanie poza loopback bez prawidłowej ścieżki uwierzytelniania Gateway (token/hasło albo zaufane proxy, jeśli skonfigurowane).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflikt portu.
    - `Other gateway-like services detected (best effort)` → istnieją nieaktualne lub równoległe jednostki launchd/systemd/schtasks. Większość konfiguracji powinna utrzymywać jeden Gateway na maszynę; jeśli potrzebujesz więcej niż jednego, odizoluj porty oraz konfigurację/stan/przestrzeń roboczą. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` z doctor → istnieje systemowa jednostka systemd, gdy brakuje usługi na poziomie użytkownika. Usuń lub wyłącz duplikat przed zezwoleniem doctor na instalację usługi użytkownika albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, jeśli jednostka systemowa jest zamierzonym nadzorcą.
    - `Gateway service port does not match current gateway config` → zainstalowany nadzorca nadal przypina stary `--port`. Uruchom `openclaw doctor --fix` albo `openclaw gateway install --force`, a następnie zrestartuj usługę Gateway.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Wykonywanie w tle i narzędzie procesów](/pl/gateway/background-process)
- [Konfiguracja](/pl/gateway/configuration)
- [Doctor](/pl/gateway/doctor)

## Gateway odrzucił nieprawidłową konfigurację

Użyj tego, gdy uruchomienie Gateway kończy się niepowodzeniem z `Invalid config` albo logi przeładowania na gorąco mówią, że pominięto nieprawidłową edycję.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Szukaj:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Pliku `openclaw.json.rejected.*` ze znacznikiem czasu obok aktywnej konfiguracji
- Pliku `openclaw.json.clobbered.*` ze znacznikiem czasu, jeśli `doctor --fix` naprawił uszkodzoną bezpośrednią edycję

<AccordionGroup>
  <Accordion title="Co się stało">
    - Konfiguracja nie przeszła walidacji podczas uruchamiania, przeładowania na gorąco lub zapisu wykonywanego przez OpenClaw.
    - Uruchomienie Gateway kończy się zamknięciem zamiast przepisania `openclaw.json`.
    - Przeładowanie na gorąco pomija nieprawidłowe edycje zewnętrzne i utrzymuje aktywną bieżącą konfigurację środowiska uruchomieniowego.
    - Zapisy wykonywane przez OpenClaw odrzucają nieprawidłowe/destrukcyjne ładunki przed zatwierdzeniem i zapisują `.rejected.*`.
    - `openclaw doctor --fix` odpowiada za naprawę. Może usunąć prefiksy niebędące JSON-em albo przywrócić ostatnią znaną dobrą kopię, zachowując odrzucony ładunek jako `.clobbered.*`.

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
    - `.clobbered.*` istnieje → doctor zachował uszkodzoną edycję zewnętrzną podczas naprawy aktywnej konfiguracji.
    - `.rejected.*` istnieje → zapis konfiguracji wykonywany przez OpenClaw nie przeszedł sprawdzeń schematu lub nadpisania przed zatwierdzeniem.
    - `Config write rejected:` → zapis próbował usunąć wymagany kształt, gwałtownie zmniejszyć plik albo utrwalić nieprawidłową konfigurację.
    - `config reload skipped (invalid config):` → bezpośrednia edycja nie przeszła walidacji i została zignorowana przez działający Gateway.
    - `Invalid config at ...` → uruchomienie nie powiodło się, zanim usługi Gateway zostały uruchomione.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` lub `size-drop-vs-last-good:*` → zapis wykonywany przez OpenClaw został odrzucony, ponieważ utracił pola lub rozmiar względem ostatniej znanej dobrej kopii zapasowej.
    - `Config last-known-good promotion skipped` → kandydat zawierał zredagowane symbole zastępcze sekretów, takie jak `***`.

  </Accordion>
  <Accordion title="Opcje naprawy">
    1. Uruchom `openclaw doctor --fix`, aby doctor naprawił konfigurację z prefiksem/nadpisaną albo przywrócił ostatnią znaną dobrą.
    2. Skopiuj tylko zamierzone klucze z `.clobbered.*` lub `.rejected.*`, a następnie zastosuj je za pomocą `openclaw config set` albo `config.patch`.
    3. Uruchom `openclaw config validate` przed restartem.
    4. Jeśli edytujesz ręcznie, zachowaj pełną konfigurację JSON5, nie tylko częściowy obiekt, który chcesz zmienić.
  </Accordion>
</AccordionGroup>

Powiązane:

- [Config](/pl/cli/config)
- [Konfiguracja: przeładowanie na gorąco](/pl/gateway/configuration#config-hot-reload)
- [Konfiguracja: ścisła walidacja](/pl/gateway/configuration#strict-validation)
- [Doctor](/pl/gateway/doctor)

## Ostrzeżenia sondy Gateway

Użyj tego, gdy `openclaw gateway probe` dociera do czegoś, ale nadal drukuje blok ostrzeżeń.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Szukaj:

- `warnings[].code` i `primaryTargetId` w wyjściu JSON.
- Czy ostrzeżenie dotyczy awaryjnego użycia SSH, wielu Gateway, brakujących zakresów lub nierozwiązanych odwołań uwierzytelniania.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal próbowało bezpośrednich skonfigurowanych/docelowych loopback.
- `multiple reachable gateways detected` → odpowiedział więcej niż jeden cel. Zwykle oznacza to zamierzoną konfigurację z wieloma Gateway albo nieaktualne/zduplikowane nasłuchujące procesy.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie zadziałało, ale szczegółowe RPC jest ograniczone zakresem; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → połączenie zadziałało, ale pełny zestaw diagnostycznych RPC przekroczył limit czasu lub nie powiódł się. Traktuj to jako osiągalny Gateway z ograniczoną diagnostyką; porównaj `connect.ok` i `connect.rpcOk` w wyjściu `--json`.
- `Capability: pairing-pending` lub `gateway closed (1008): pairing required` → Gateway odpowiedział, ale ten klient nadal wymaga parowania/zatwierdzenia przed normalnym dostępem operatora.
- nierozwiązany tekst ostrzeżenia SecretRef `gateway.auth.*` / `gateway.remote.*` → materiał uwierzytelniania był niedostępny w tej ścieżce polecenia dla nieudanego celu.

Powiązane:

- [Gateway](/pl/cli/gateway)
- [Wiele Gateway na tym samym hoście](/pl/gateway#multiple-gateways-same-host)
- [Zdalny dostęp](/pl/gateway/remote)

## Kanał połączony, wiadomości nie przepływają

Jeśli stan kanału jest połączony, ale przepływ wiadomości nie działa, skup się na zasadach, uprawnieniach i regułach dostarczania specyficznych dla kanału.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Szukaj:

- Zasady DM (`pairing`, `allowlist`, `open`, `disabled`).
- Lista dozwolonych grup i wymagania dotyczące wzmianki.
- Brakujące uprawnienia/zakresy API kanału.

Typowe sygnatury:

- `mention required` → wiadomość zignorowana przez zasady wzmianki w grupie.
- `pairing` / ślady oczekującego zatwierdzenia → nadawca nie jest zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z uwierzytelnianiem/uprawnieniami kanału.

Powiązane:

- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Discord](/pl/channels/discord)
- [Telegram](/pl/channels/telegram)
- [WhatsApp](/pl/channels/whatsapp)

## Dostarczanie Cron i Heartbeat

Jeśli Cron lub Heartbeat nie został uruchomiony albo niczego nie dostarczył, najpierw sprawdź stan harmonogramu, a potem cel dostarczenia.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Sprawdź:

- Cron jest włączony i dostępne jest następne wybudzenie.
- Status historii uruchomień zadania (`ok`, `skipped`, `error`).
- Powody pominięcia Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron wyłączony.
    - `cron: timer tick failed` → takt harmonogramu nie powiódł się; sprawdź błędy plików/logów/środowiska uruchomieniowego.
    - `heartbeat skipped` z `reason=quiet-hours` → poza oknem aktywnych godzin.
    - `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste wiersze / nagłówki markdown, więc OpenClaw pomija wywołanie modelu.
    - `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne zadania nie są wymagalne w tym takcie.
    - `heartbeat: unknown accountId` → nieprawidłowy identyfikator konta dla celu dostarczenia Heartbeat.
    - `heartbeat skipped` z `reason=dm-blocked` → cel Heartbeat został rozwiązany jako miejsce docelowe typu DM, gdy `agents.defaults.heartbeat.directPolicy` (lub nadpisanie dla agenta) jest ustawione na `block`.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Heartbeat](/pl/gateway/heartbeat)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
- [Zaplanowane zadania: rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting)

## Node sparowany, narzędzie nie działa

Jeśli Node jest sparowany, ale narzędzia nie działają, wyizoluj stan pierwszego planu, uprawnień i zatwierdzeń.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Sprawdź:

- Node online z oczekiwanymi możliwościami.
- Uprawnienia systemu operacyjnego do kamery/mikrofonu/lokalizacji/ekranu.
- Zatwierdzenia exec i stan listy dozwolonych.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja Node musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brakuje uprawnienia systemu operacyjnego.
- `SYSTEM_RUN_DENIED: approval required` → oczekujące zatwierdzenie exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez listę dozwolonych.

Powiązane:

- [Zatwierdzenia exec](/pl/tools/exec-approvals)
- [Rozwiązywanie problemów z Node](/pl/nodes/troubleshooting)
- [Nodes](/pl/nodes/index)

## Narzędzie przeglądarki nie działa

Użyj tego, gdy działania narzędzia przeglądarki nie działają, mimo że sam Gateway jest zdrowy.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Sprawdź:

- Czy `plugins.allow` jest ustawione i obejmuje `browser`.
- Prawidłową ścieżkę do pliku wykonywalnego przeglądarki.
- Osiągalność profilu CDP.
- Dostępność lokalnego Chrome dla profili `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Sygnatury Plugin / pliku wykonywalnego">
    - `unknown command "browser"` lub `unknown command 'browser'` → dołączony Plugin przeglądarki jest wykluczony przez `plugins.allow`.
    - brakuje narzędzia przeglądarki / jest niedostępne, gdy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc Plugin nigdy się nie załadował.
    - `Failed to start Chrome CDP on port` → nie udało się uruchomić procesu przeglądarki.
    - `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
    - `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` lub `ftp:`.
    - `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma nieprawidłowy port lub port spoza zakresu.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja Gateway nie ma głównej zależności środowiska uruchomieniowego przeglądarki; zainstaluj ponownie lub zaktualizuj OpenClaw, a potem uruchom ponownie Gateway. Migawki ARIA i podstawowe zrzuty ekranu stron nadal mogą działać, ale nawigacja, migawki AI, zrzuty ekranu elementów przez selektory CSS i eksport PDF pozostają niedostępne.

  </Accordion>
  <Accordion title="Sygnatury Chrome MCP / istniejącej sesji">
    - `Could not find DevToolsActivePort for chrome` → istniejąca sesja Chrome MCP nie mogła jeszcze podłączyć się do wybranego katalogu danych przeglądarki. Otwórz stronę inspekcji przeglądarki, włącz zdalne debugowanie, pozostaw przeglądarkę otwartą, zatwierdź pierwszy monit podłączenia, a potem spróbuj ponownie. Jeśli stan zalogowania nie jest wymagany, preferuj zarządzany profil `openclaw`.
    - `No Chrome tabs found for profile="user"` → profil podłączenia Chrome MCP nie ma otwartych lokalnych kart Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny punkt końcowy CDP nie jest osiągalny z hosta Gateway.
    - `Browser attachOnly is enabled ... not reachable` lub `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko do podłączania nie ma osiągalnego celu albo punkt końcowy HTTP odpowiedział, ale WebSocket CDP nadal nie mógł zostać otwarty.

  </Accordion>
  <Accordion title="Sygnatury elementu / zrzutu ekranu / przesyłania">
    - `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu połączyło `--full-page` z `--ref` lub `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutu ekranu Chrome MCP / `existing-session` muszą używać przechwytywania strony albo `--ref` z migawki, a nie CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → haki przesyłania Chrome MCP potrzebują referencji z migawek, a nie selektorów CSS.
    - `existing-session file uploads currently support one file at a time.` → wysyłaj jedno przesyłanie na wywołanie w profilach Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → haki okien dialogowych w profilach Chrome MCP nie obsługują nadpisań limitu czasu.
    - `existing-session type does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:type` w profilach `profile="user"` / istniejącej sesji Chrome MCP albo użyj zarządzanego/CDP profilu przeglądarki, gdy wymagany jest niestandardowy limit czasu.
    - `existing-session evaluate does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:evaluate` w profilach `profile="user"` / istniejącej sesji Chrome MCP albo użyj zarządzanego/CDP profilu przeglądarki, gdy wymagany jest niestandardowy limit czasu.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki albo surowego profilu CDP.
    - nieaktualne nadpisania widoku / trybu ciemnego / ustawień regionalnych / offline w profilach tylko do podłączania lub zdalnych profilach CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez restartowania całego Gateway.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Przeglądarka (zarządzana przez OpenClaw)](/pl/tools/browser)
- [Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting)

## Jeśli po aktualizacji coś nagle przestało działać

Większość awarii po aktualizacji wynika z dryfu konfiguracji albo z egzekwowania teraz bardziej rygorystycznych wartości domyślnych.

<AccordionGroup>
  <Accordion title="1. Zmieniło się zachowanie uwierzytelniania i nadpisywania URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Co sprawdzić:

    - Jeśli `gateway.mode=remote`, wywołania CLI mogą trafiać do zdalnego celu, mimo że lokalna usługa działa poprawnie.
    - Jawne wywołania `--url` nie wracają awaryjnie do zapisanych poświadczeń.

    Typowe sygnatury:

    - `gateway connect failed:` → niewłaściwy docelowy URL.
    - `unauthorized` → punkt końcowy osiągalny, ale uwierzytelnianie nieprawidłowe.

  </Accordion>
  <Accordion title="2. Zabezpieczenia powiązania i uwierzytelniania są bardziej rygorystyczne">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Co sprawdzić:

    - Powiązania inne niż loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki uwierzytelniania Gateway: uwierzytelniania współdzielonym tokenem/hasłem albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` poza loopback.
    - Stare klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

    Typowe sygnatury:

    - `refusing to bind gateway ... without auth` → powiązanie inne niż loopback bez prawidłowej ścieżki uwierzytelniania Gateway.
    - `Connectivity probe: failed`, gdy środowisko uruchomieniowe działa → Gateway żyje, ale jest niedostępny przy bieżącym uwierzytelnianiu/URL.

  </Accordion>
  <Accordion title="3. Zmienił się stan parowania i tożsamości urządzenia">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Co sprawdzić:

    - Oczekujące zatwierdzenia urządzeń dla panelu/nodes.
    - Oczekujące zatwierdzenia parowania DM po zmianach zasad lub tożsamości.

    Typowe sygnatury:

    - `device identity required` → uwierzytelnianie urządzenia nie jest spełnione.
    - `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

  </Accordion>
</AccordionGroup>

Jeśli konfiguracja usługi i środowisko uruchomieniowe nadal się nie zgadzają po sprawdzeniach, zainstaluj ponownie metadane usługi z tego samego profilu/katalogu stanu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane:

- [Uwierzytelnianie](/pl/gateway/authentication)
- [Exec w tle i narzędzie procesu](/pl/gateway/background-process)
- [Parowanie zarządzane przez Gateway](/pl/gateway/pairing)

## Powiązane

- [Doctor](/pl/gateway/doctor)
- [FAQ](/pl/help/faq)
- [Runbook Gateway](/pl/gateway)
