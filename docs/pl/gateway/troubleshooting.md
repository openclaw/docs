---
read_when:
    - Centrum rozwiązywania problemów skierowało Cię tutaj w celu dokładniejszej diagnostyki
    - Potrzebne są stabilne sekcje runbooka oparte na objawach z dokładnymi poleceniami
sidebarTitle: Troubleshooting
summary: Szczegółowa procedura rozwiązywania problemów z Gateway, kanałami, automatyzacją, węzłami i przeglądarką
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-05-02T09:52:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 815fbbca4d12b4b9c65b1172e07606d0eaf4c64df7fd6ca23a8f8d104b78c2a9
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ta strona to szczegółowy runbook. Zacznij od [/help/troubleshooting](/pl/help/troubleshooting), jeśli najpierw chcesz przejść przez szybki przepływ triage.

## Sekwencja poleceń

Uruchom najpierw te polecenia, w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Oczekiwane sygnały poprawnego działania:

- `openclaw gateway status` pokazuje `Runtime: running`, `Connectivity probe: ok` oraz wiersz `Capability: ...`.
- `openclaw doctor` nie zgłasza blokujących problemów z konfiguracją ani usługą.
- `openclaw channels status --probe` pokazuje bieżący status transportu dla każdego konta oraz, tam gdzie jest to obsługiwane, wyniki probe/audit, takie jak `works` lub `audit ok`.

## Instalacje split brain i zabezpieczenie nowszej konfiguracji

Użyj tego, gdy usługa Gateway niespodziewanie zatrzymuje się po aktualizacji albo logi pokazują, że jeden plik binarny `openclaw` jest starszy niż wersja, która ostatnio zapisała `openclaw.json`.

OpenClaw oznacza zapisy konfiguracji wartością `meta.lastTouchedVersion`. Polecenia tylko do odczytu nadal mogą sprawdzać konfigurację zapisaną przez nowszy OpenClaw, ale mutacje procesu i usługi odmawiają kontynuowania ze starszego pliku binarnego. Zablokowane akcje obejmują uruchomienie, zatrzymanie, restart, odinstalowanie usługi Gateway, wymuszoną ponowną instalację usługi, start Gateway w trybie usługi oraz czyszczenie portu przez `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Napraw `PATH`, aby `openclaw` wskazywał na nowszą instalację, a następnie uruchom akcję ponownie.
  </Step>
  <Step title="Reinstall the gateway service">
    Zainstaluj ponownie docelową usługę Gateway z nowszej instalacji:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Usuń nieaktualny pakiet systemowy lub stare wpisy wrapperów, które nadal wskazują na stary plik binarny `openclaw`.
  </Step>
</Steps>

<Warning>
Tylko w przypadku celowego przejścia na starszą wersję lub awaryjnego odzyskiwania ustaw `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` dla pojedynczego polecenia. Przy normalnej pracy pozostaw tę zmienną nieustawioną.
</Warning>

## Anthropic 429: wymagane dodatkowe użycie dla długiego kontekstu

Użyj tego, gdy logi lub błędy zawierają: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Sprawdź, czy:

- Wybrany model Anthropic Opus/Sonnet ma `params.context1m: true`.
- Bieżące dane uwierzytelniające Anthropic nie kwalifikują się do użycia długiego kontekstu.
- Żądania zawodzą tylko w długich sesjach lub uruchomieniach modeli, które wymagają ścieżki beta 1M.

Opcje naprawy:

<Steps>
  <Step title="Disable context1m">
    Wyłącz `context1m` dla tego modelu, aby wrócić do normalnego okna kontekstu.
  </Step>
  <Step title="Use an eligible credential">
    Użyj danych uwierzytelniających Anthropic kwalifikujących się do żądań długiego kontekstu albo przełącz się na klucz API Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Skonfiguruj modele awaryjne, aby uruchomienia były kontynuowane, gdy żądania długiego kontekstu Anthropic zostaną odrzucone.
  </Step>
</Steps>

Powiązane:

- [Anthropic](/pl/providers/anthropic)
- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Dlaczego widzę HTTP 429 z Anthropic?](/pl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokalny backend zgodny z OpenAI przechodzi bezpośrednie testy, ale uruchomienia agenta zawodzą

Użyj tego, gdy:

- `curl ... /v1/models` działa
- małe bezpośrednie wywołania `/v1/chat/completions` działają
- uruchomienia modeli OpenClaw zawodzą tylko przy normalnych turach agenta

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Sprawdź, czy:

- bezpośrednie małe wywołania kończą się powodzeniem, ale uruchomienia OpenClaw zawodzą tylko przy większych promptach
- pojawiają się błędy `model_not_found` lub 404, mimo że bezpośrednie `/v1/chat/completions`
  działa z tym samym prostym identyfikatorem modelu
- backend zgłasza błędy, że `messages[].content` oczekuje ciągu znaków
- pojawiają się sporadyczne ostrzeżenia `incomplete turn detected ... stopReason=stop payloads=0` z lokalnym backendem zgodnym z OpenAI
- awarie backendu pojawiają się tylko przy większej liczbie tokenów promptu lub pełnych promptach środowiska uruchomieniowego agenta

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` z lokalnym serwerem w stylu MLX/vLLM → sprawdź, czy `baseUrl` zawiera `/v1`, `api` ma wartość `"openai-completions"` dla backendów `/v1/chat/completions`, a `models.providers.<provider>.models[].id` jest prostym lokalnym identyfikatorem modelu po stronie providera. Wybierz go raz z prefiksem providera, na przykład `mlx/mlx-community/Qwen3-30B-A3B-6bit`; pozostaw wpis katalogu jako `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend odrzuca strukturalne części treści Chat Completions. Naprawa: ustaw `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend ukończył żądanie Chat Completions, ale nie zwrócił widocznego dla użytkownika tekstu asystenta dla tej tury. OpenClaw ponawia raz puste tury zgodne z OpenAI, które można bezpiecznie odtworzyć; trwałe błędy zwykle oznaczają, że backend emituje pustą lub nietekstową treść albo tłumi tekst końcowej odpowiedzi.
    - bezpośrednie małe żądania kończą się powodzeniem, ale uruchomienia agenta OpenClaw zawodzą z awariami backendu/modelu (na przykład Gemma w niektórych buildach `inferrs`) → transport OpenClaw prawdopodobnie jest już poprawny; backend zawodzi przy większym kształcie promptu środowiska uruchomieniowego agenta.
    - błędy zmniejszają się po wyłączeniu narzędzi, ale nie znikają → schematy narzędzi były częścią obciążenia, ale pozostały problem nadal dotyczy pojemności upstreamowego modelu/serwera albo błędu backendu.

  </Accordion>
  <Accordion title="Fix options">
    1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions obsługujących tylko ciągi znaków.
    2. Ustaw `compat.supportsTools: false` dla modeli/backendów, które nie potrafią niezawodnie obsłużyć powierzchni schematów narzędzi OpenClaw.
    3. Zmniejsz obciążenie promptu tam, gdzie to możliwe: mniejszy bootstrap przestrzeni roboczej, krótsza historia sesji, lżejszy model lokalny albo backend z lepszą obsługą długiego kontekstu.
    4. Jeśli małe bezpośrednie żądania nadal przechodzą, a tury agenta OpenClaw wciąż powodują awarię wewnątrz backendu, potraktuj to jako ograniczenie upstreamowego serwera/modelu i zgłoś tam odtworzenie problemu wraz z akceptowanym kształtem payloadu.
  </Accordion>
</AccordionGroup>

Powiązane:

- [Konfiguracja](/pl/gateway/configuration)
- [Modele lokalne](/pl/gateway/local-models)
- [Endpointy zgodne z OpenAI](/pl/gateway/configuration-reference#openai-compatible-endpoints)

## Brak odpowiedzi

Jeśli kanały działają, ale nic nie odpowiada, sprawdź routing i politykę przed ponownym łączeniem czegokolwiek.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Sprawdź, czy:

- Parowanie oczekuje dla nadawców wiadomości prywatnych.
- Ograniczanie wzmianek w grupach (`requireMention`, `mentionPatterns`).
- Niedopasowania allowlisty kanału/grupy.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa ignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez politykę.

Powiązane:

- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Grupy](/pl/channels/groups)
- [Parowanie](/pl/channels/pairing)

## Łączność interfejsu kontrolnego dashboardu

Gdy dashboard/interfejs kontrolny nie może się połączyć, zweryfikuj URL, tryb uwierzytelniania i założenia dotyczące bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Sprawdź, czy:

- URL probe i URL dashboardu są poprawne.
- Tryb uwierzytelniania/token różnią się między klientem a Gateway.
- Używany jest HTTP tam, gdzie wymagana jest tożsamość urządzenia.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → niezabezpieczony kontekst albo brak uwierzytelniania urządzenia.
    - `origin not allowed` → przeglądarkowy `Origin` nie znajduje się w `gateway.controlUi.allowedOrigins` (albo łączysz się z pochodzenia przeglądarki spoza loopback bez jawnej allowlisty).
    - `device nonce required` / `device nonce mismatch` → klient nie kończy przepływu uwierzytelniania urządzenia opartego na wyzwaniu (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → klient podpisał niewłaściwy payload (albo nieaktualny znacznik czasu) dla bieżącego uzgadniania.
    - `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną próbę ponowienia z tokenem urządzenia z pamięci podręcznej.
    - Ta próba ponowienia z tokenem z pamięci podręcznej używa zestawu zakresów z pamięci podręcznej przechowywanego ze sparowanym tokenem urządzenia. Wywołania z jawnym `deviceToken` / jawnymi `scopes` zachowują zamiast tego żądany zestaw zakresów.
    - Poza tą ścieżką ponowienia priorytet uwierzytelniania połączenia jest następujący: najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a następnie token bootstrap.
    - Na asynchronicznej ścieżce interfejsu kontrolnego Tailscale Serve nieudane próby dla tego samego `{scope, ip}` są serializowane, zanim limiter zapisze niepowodzenie. Dwie złe współbieżne próby ponowienia od tego samego klienta mogą więc na drugiej próbie zwrócić `retry later` zamiast dwóch zwykłych niedopasowań.
    - `too many failed authentication attempts (retry later)` z klienta loopback pochodzącego z przeglądarki → powtarzające się błędy z tego samego znormalizowanego `Origin` są tymczasowo blokowane; inne pochodzenie localhost używa osobnego kubełka.
    - powtarzające się `unauthorized` po tej próbie ponowienia → rozjazd współdzielonego tokenu/tokenu urządzenia; odśwież konfigurację tokenu i w razie potrzeby ponownie zatwierdź lub obróć token urządzenia.
    - `gateway connect failed:` → nieprawidłowy host/port/docelowy URL.

  </Accordion>
</AccordionGroup>

### Szybka mapa kodów szczegółów uwierzytelniania

Użyj `error.details.code` z nieudanej odpowiedzi `connect`, aby wybrać następną akcję:

| Kod szczegółowy              | Znaczenie                                                                                                                                                                                     | Zalecane działanie                                                                                                                                                                                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | Klient nie wysłał wymaganego wspólnego tokenu.                                                                                                                                                | Wklej/ustaw token w kliencie i spróbuj ponownie. Dla ścieżek panelu: `openclaw config get gateway.auth.token`, a następnie wklej go w ustawieniach Control UI.                                                                                                                                        |
| `AUTH_TOKEN_MISMATCH`        | Wspólny token nie pasował do tokenu uwierzytelniania Gateway.                                                                                                                                 | Jeśli `canRetryWithDeviceToken=true`, zezwól na jedną zaufaną ponowną próbę. Ponowne próby z tokenem z pamięci podręcznej używają zapisanych zatwierdzonych zakresów; wywołania z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal się nie udaje, uruchom [listę kontrolną odzyskiwania rozjazdu tokenu](/pl/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token dla urządzenia z pamięci podręcznej jest nieaktualny lub został odwołany.                                                                                                                | Obroć/zatwierdź ponownie token urządzenia przy użyciu [CLI urządzeń](/pl/cli/devices), a następnie połącz się ponownie.                                                                                                                                                                                   |
| `PAIRING_REQUIRED`           | Tożsamość urządzenia wymaga zatwierdzenia. Sprawdź `error.details.reason` pod kątem `not-paired`, `scope-upgrade`, `role-upgrade` lub `metadata-upgrade` i użyj `requestId` / `remediationHint`, gdy są obecne. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`. Podwyższenia zakresu/roli używają tego samego przepływu po sprawdzeniu żądanego dostępu.                                                                                                  |

<Note>
Bezpośrednie RPC zaplecza przez loopback, uwierzytelniane wspólnym tokenem/hasłem Gateway, nie powinny zależeć od bazowego zakresu sparowanego urządzenia CLI. Jeśli podagenci lub inne wywołania wewnętrzne nadal kończą się niepowodzeniem z `scope-upgrade`, sprawdź, czy wywołujący używa `client.id: "gateway-client"` i `client.mode: "backend"` oraz czy nie wymusza jawnego `deviceIdentity` ani tokenu urządzenia.
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
    Klient czeka na `connect.challenge` wydane przez Gateway.
  </Step>
  <Step title="Podpisz ładunek">
    Klient podpisuje ładunek powiązany z wyzwaniem.
  </Step>
  <Step title="Wyślij nonce urządzenia">
    Klient wysyła `connect.params.device.nonce` z tym samym nonce wyzwania.
  </Step>
</Steps>

Jeśli `openclaw devices rotate` / `revoke` / `remove` zostanie nieoczekiwanie odrzucone:

- sesje tokenów sparowanych urządzeń mogą zarządzać tylko **własnym** urządzeniem, chyba że wywołujący ma również `operator.admin`
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

Sprawdź:

- `Runtime: stopped` ze wskazówkami dotyczącymi kodu zakończenia.
- Niezgodność konfiguracji usługi (`Config (cli)` kontra `Config (service)`).
- Konflikty portu/listenera.
- Dodatkowe instalacje launchd/systemd/schtasks, gdy używane jest `--deep`.
- Wskazówki czyszczenia `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → lokalny tryb Gateway nie jest włączony albo plik konfiguracji został nadpisany i utracił `gateway.mode`. Naprawa: ustaw `gateway.mode="local"` w konfiguracji albo ponownie uruchom `openclaw onboard --mode local` / `openclaw setup`, aby ponownie ostemplować oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślna ścieżka konfiguracji to `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → wiązanie poza loopback bez prawidłowej ścieżki uwierzytelniania Gateway (token/hasło albo trusted-proxy tam, gdzie skonfigurowano).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflikt portu.
    - `Other gateway-like services detected (best effort)` → istnieją przestarzałe lub równoległe jednostki launchd/systemd/schtasks. Większość konfiguracji powinna utrzymywać jeden Gateway na maszynę; jeśli potrzebujesz więcej niż jednego, odizoluj porty oraz konfigurację/stan/przestrzeń roboczą. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` z doctor → istnieje jednostka systemd na poziomie systemu, podczas gdy brakuje usługi na poziomie użytkownika. Usuń lub wyłącz duplikat, zanim pozwolisz doctor zainstalować usługę użytkownika, albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, jeśli jednostka systemowa jest zamierzonym nadzorcą.
    - `Gateway service port does not match current gateway config` → zainstalowany nadzorca nadal przypina stary `--port`. Uruchom `openclaw doctor --fix` albo `openclaw gateway install --force`, a następnie zrestartuj usługę Gateway.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Wykonywanie w tle i narzędzie procesów](/pl/gateway/background-process)
- [Konfiguracja](/pl/gateway/configuration)
- [Doctor](/pl/gateway/doctor)

## Gateway przywrócił ostatnią znaną dobrą konfigurację

Użyj tego, gdy Gateway uruchamia się, ale logi mówią, że przywrócił `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Sprawdź:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Plik `openclaw.json.clobbered.*` ze znacznikiem czasu obok aktywnej konfiguracji
- Zdarzenie systemowe głównego agenta zaczynające się od `Config recovery warning`

<AccordionGroup>
  <Accordion title="Co się stało">
    - Odrzucona konfiguracja nie przeszła walidacji podczas uruchamiania lub przeładowania na gorąco.
    - OpenClaw zachował odrzucony ładunek jako `.clobbered.*`.
    - Aktywna konfiguracja została przywrócona z ostatniej zwalidowanej kopii last-known-good.
    - Następna tura głównego agenta otrzymuje ostrzeżenie, aby nie przepisywać odrzuconej konfiguracji bez zastanowienia.
    - Jeśli wszystkie problemy walidacji znajdowały się pod `plugins.entries.<id>...`, OpenClaw nie przywróciłby całego pliku. Lokalne awarie Plugin pozostają widoczne, a niepowiązane ustawienia użytkownika pozostają w aktywnej konfiguracji.

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
    - `.clobbered.*` istnieje → przywrócono zewnętrzną bezpośrednią edycję lub odczyt startowy.
    - `.rejected.*` istnieje → zapis konfiguracji należący do OpenClaw nie przeszedł kontroli schematu lub nadpisania przed zatwierdzeniem.
    - `Config write rejected:` → zapis próbował usunąć wymagany kształt, gwałtownie zmniejszyć plik lub utrwalić nieprawidłową konfigurację.
    - `Rejected validation details:` → log odzyskiwania lub powiadomienie głównego agenta zawiera ścieżkę schematu, która spowodowała przywrócenie, na przykład `agents.defaults.execution` lub `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` lub `size-drop-vs-last-good:*` → uruchamianie potraktowało bieżący plik jako nadpisany, ponieważ utracił pola lub rozmiar w porównaniu z kopią last-known-good.
    - `Config last-known-good promotion skipped` → kandydat zawierał zredagowane symbole zastępcze sekretów, takie jak `***`.

  </Accordion>
  <Accordion title="Opcje naprawy">
    1. Zachowaj przywróconą aktywną konfigurację, jeśli jest poprawna.
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

Użyj tego, gdy `openclaw gateway probe` dociera do czegoś, ale nadal wypisuje blok ostrzeżeń.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Sprawdź:

- `warnings[].code` i `primaryTargetId` w wyjściu JSON.
- Czy ostrzeżenie dotyczy awaryjnego użycia SSH, wielu Gateway, brakujących zakresów czy nierozwiązanych odwołań uwierzytelniania.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal spróbowało bezpośrednich skonfigurowanych/loopback celów.
- `multiple reachable gateways detected` → odpowiedział więcej niż jeden cel. Zwykle oznacza to zamierzoną konfigurację z wieloma Gateway albo przestarzałe/zduplikowane listenery.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie zadziałało, ale szczegółowe RPC jest ograniczone zakresem; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → połączenie zadziałało, ale pełny zestaw diagnostycznych RPC przekroczył limit czasu lub się nie powiódł. Traktuj to jako osiągalny Gateway z ograniczoną diagnostyką; porównaj `connect.ok` i `connect.rpcOk` w wyjściu `--json`.
- `Capability: pairing-pending` lub `gateway closed (1008): pairing required` → Gateway odpowiedział, ale ten klient nadal wymaga parowania/zatwierdzenia przed normalnym dostępem operatora.
- nierozwiązany tekst ostrzeżenia SecretRef `gateway.auth.*` / `gateway.remote.*` → materiał uwierzytelniania był niedostępny w tej ścieżce polecenia dla nieudanego celu.

Powiązane:

- [Gateway](/pl/cli/gateway)
- [Wiele Gateway na tym samym hoście](/pl/gateway#multiple-gateways-same-host)
- [Dostęp zdalny](/pl/gateway/remote)

## Kanał połączony, wiadomości nie przepływają

Jeśli stan kanału jest połączony, ale przepływ wiadomości nie działa, skup się na zasadach, uprawnieniach i regułach dostarczania specyficznych dla kanału.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Sprawdź:

- Zasady DM (`pairing`, `allowlist`, `open`, `disabled`).
- Lista dozwolonych grup i wymagania dotyczące wzmianek.
- Brakujące uprawnienia/zakresy API kanału.

Typowe sygnatury:

- `mention required` → wiadomość zignorowana przez zasady wzmianek grupowych.
- `pairing` / ślady oczekującego zatwierdzenia → nadawca nie jest zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z uwierzytelnianiem/uprawnieniami kanału.

Powiązane:

- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Discord](/pl/channels/discord)
- [Telegram](/pl/channels/telegram)
- [WhatsApp](/pl/channels/whatsapp)

## Dostarczanie przez Cron i Heartbeat

Jeśli Cron lub Heartbeat nie uruchomił się albo niczego nie dostarczył, najpierw zweryfikuj stan harmonogramu, a potem cel dostarczania.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Sprawdź:

- Cron jest włączony i istnieje następne wybudzenie.
- Stan historii uruchomień zadań (`ok`, `skipped`, `error`).
- Przyczyny pominięcia Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron wyłączony.
    - `cron: timer tick failed` → takt harmonogramu nie powiódł się; sprawdź błędy plików/logów/środowiska uruchomieniowego.
    - `heartbeat skipped` z `reason=quiet-hours` → poza oknem aktywnych godzin.
    - `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste wiersze / nagłówki Markdown, więc OpenClaw pomija wywołanie modelu.
    - `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne zadania nie przypadają na ten takt.
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

Sprawdź:

- Node online z oczekiwanymi możliwościami.
- Przyznane uprawnienia systemu operacyjnego do kamery/mikrofonu/lokalizacji/ekranu.
- Zatwierdzenia exec i stan listy dozwolonych.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja Node musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brakuje uprawnienia systemu operacyjnego.
- `SYSTEM_RUN_DENIED: approval required` → oczekuje zatwierdzenie exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez listę dozwolonych.

Powiązane:

- [Zatwierdzenia exec](/pl/tools/exec-approvals)
- [Rozwiązywanie problemów z Node](/pl/nodes/troubleshooting)
- [Node'y](/pl/nodes/index)

## Narzędzie przeglądarki zawodzi

Użyj tego, gdy akcje narzędzia przeglądarki zawodzą, mimo że sam Gateway działa prawidłowo.

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
    - brak narzędzia przeglądarki / niedostępne narzędzie przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc Plugin nigdy się nie załadował.
    - `Failed to start Chrome CDP on port` → nie udało się uruchomić procesu przeglądarki.
    - `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
    - `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` lub `ftp:`.
    - `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma błędny port lub port spoza zakresu.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja Gateway nie ma podstawowej zależności środowiska uruchomieniowego przeglądarki; zainstaluj ponownie lub zaktualizuj OpenClaw, a następnie uruchom ponownie Gateway. Migawki ARIA i podstawowe zrzuty stron nadal mogą działać, ale nawigacja, migawki AI, zrzuty elementów z selektorów CSS i eksport PDF pozostają niedostępne.

  </Accordion>
  <Accordion title="Sygnatury Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session nie mógł jeszcze dołączyć do wybranego katalogu danych przeglądarki. Otwórz stronę inspekcji przeglądarki, włącz zdalne debugowanie, zostaw przeglądarkę otwartą, zatwierdź pierwszy monit dołączenia, a potem spróbuj ponownie. Jeśli stan zalogowania nie jest wymagany, preferuj zarządzany profil `openclaw`.
    - `No Chrome tabs found for profile="user"` → profil dołączania Chrome MCP nie ma otwartych lokalnych kart Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny punkt końcowy CDP nie jest osiągalny z hosta Gateway.
    - `Browser attachOnly is enabled ... not reachable` lub `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko do dołączania nie ma osiągalnego celu albo punkt końcowy HTTP odpowiedział, ale WebSocket CDP nadal nie mógł zostać otwarty.

  </Accordion>
  <Accordion title="Sygnatury elementów / zrzutów ekranu / przesyłania">
    - `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu połączyło `--full-page` z `--ref` lub `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwycenia strony lub `--ref` z migawki, a nie CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooki przesyłania Chrome MCP wymagają odwołań z migawki, a nie selektorów CSS.
    - `existing-session file uploads currently support one file at a time.` → w profilach Chrome MCP wysyłaj jedno przesyłanie na wywołanie.
    - `existing-session dialog handling does not support timeoutMs.` → hooki okien dialogowych w profilach Chrome MCP nie obsługują nadpisań limitu czasu.
    - `existing-session type does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:type` w profilach `profile="user"` / Chrome MCP existing-session albo użyj zarządzanego/CDP profilu przeglądarki, gdy wymagany jest niestandardowy limit czasu.
    - `existing-session evaluate does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:evaluate` w profilach `profile="user"` / Chrome MCP existing-session albo użyj zarządzanego/CDP profilu przeglądarki, gdy wymagany jest niestandardowy limit czasu.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki lub surowego profilu CDP.
    - nieaktualne nadpisania obszaru widoku / trybu ciemnego / ustawień regionalnych / trybu offline w profilach attach-only lub zdalnych CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez ponownego uruchamiania całego Gateway.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Przeglądarka (zarządzana przez OpenClaw)](/pl/tools/browser)
- [Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting)

## Jeśli po aktualizacji coś nagle się zepsuło

Większość awarii po aktualizacji wynika z rozjazdu konfiguracji albo bardziej rygorystycznych wartości domyślnych, które są teraz egzekwowane.

<AccordionGroup>
  <Accordion title="1. Zachowanie uwierzytelniania i nadpisania URL się zmieniło">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Co sprawdzić:

    - Jeśli `gateway.mode=remote`, wywołania CLI mogą trafiać do zdalnego celu, mimo że lokalna usługa działa prawidłowo.
    - Jawne wywołania `--url` nie wracają do zapisanych poświadczeń.

    Typowe sygnatury:

    - `gateway connect failed:` → nieprawidłowy docelowy URL.
    - `unauthorized` → punkt końcowy osiągalny, ale błędne uwierzytelnianie.

  </Accordion>
  <Accordion title="2. Zabezpieczenia bindowania i uwierzytelniania są bardziej rygorystyczne">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Co sprawdzić:

    - Bindowania inne niż loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki uwierzytelniania Gateway: uwierzytelniania wspólnym tokenem/hasłem albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` innego niż loopback.
    - Stare klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

    Typowe sygnatury:

    - `refusing to bind gateway ... without auth` → bindowanie inne niż loopback bez prawidłowej ścieżki uwierzytelniania Gateway.
    - `Connectivity probe: failed`, gdy środowisko uruchomieniowe działa → Gateway żyje, ale jest niedostępny przy bieżącym uwierzytelnianiu/URL.

  </Accordion>
  <Accordion title="3. Stan parowania i tożsamości urządzenia się zmienił">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Co sprawdzić:

    - Oczekujące zatwierdzenia urządzeń dla panelu i Node'ów.
    - Oczekujące zatwierdzenia parowania DM po zmianach zasad lub tożsamości.

    Typowe sygnatury:

    - `device identity required` → uwierzytelnianie urządzenia nie zostało spełnione.
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
