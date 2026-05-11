---
read_when:
    - Centrum rozwiązywania problemów skierowało Cię tutaj w celu dokładniejszej diagnostyki
    - Potrzebne są stabilne sekcje podręcznika operacyjnego oparte na objawach, z dokładnymi poleceniami
sidebarTitle: Troubleshooting
summary: Szczegółowa procedura rozwiązywania problemów z Gateway, kanałami, automatyzacją, węzłami i przeglądarką
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-05-11T20:31:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ta strona to szczegółowy runbook. Zacznij od [/help/troubleshooting](/pl/help/troubleshooting), jeśli najpierw chcesz przejść szybki przepływ triage.

## Drabina poleceń

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
- `openclaw channels status --probe` pokazuje bieżący status transportu dla każdego konta oraz, tam gdzie jest to obsługiwane, wyniki probe/audytu, takie jak `works` lub `audit ok`.

## Instalacje split brain i ochrona nowszej konfiguracji

Użyj tego, gdy usługa gateway niespodziewanie zatrzyma się po aktualizacji albo logi pokazują, że jeden plik binarny `openclaw` jest starszy niż wersja, która ostatnio zapisała `openclaw.json`.

OpenClaw oznacza zapisy konfiguracji polem `meta.lastTouchedVersion`. Polecenia tylko do odczytu nadal mogą sprawdzać konfigurację zapisaną przez nowszy OpenClaw, ale mutacje procesu i usługi odmawiają kontynuacji ze starszego pliku binarnego. Zablokowane działania obejmują uruchomienie, zatrzymanie, restart, odinstalowanie usługi gateway, wymuszoną reinstalację usługi, uruchomienie gateway w trybie usługi oraz czyszczenie portu przez `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Napraw PATH">
    Napraw `PATH`, aby `openclaw` wskazywał nowszą instalację, a następnie ponownie uruchom działanie.
  </Step>
  <Step title="Zainstaluj ponownie usługę gateway">
    Zainstaluj ponownie zamierzoną usługę gateway z nowszej instalacji:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Usuń nieaktualne wrappery">
    Usuń nieaktualny pakiet systemowy lub stare wpisy wrapperów, które nadal wskazują stary plik binarny `openclaw`.
  </Step>
</Steps>

<Warning>
Tylko w przypadku celowego downgrade'u lub awaryjnego odzyskiwania ustaw `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` dla pojedynczego polecenia. Przy normalnym działaniu pozostaw to nieustawione.
</Warning>

## Pominięto dowiązanie symboliczne Skills jako wyjście poza ścieżkę

Użyj tego, gdy logi zawierają:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw traktuje każdy katalog główny Skills jako granicę izolacji. Dowiązanie symboliczne w
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` lub
`~/.openclaw/skills` jest pomijane, gdy jego rzeczywisty cel rozwiązuje się poza ten katalog główny,
chyba że cel jest jawnie zaufany.

Sprawdź link:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Jeśli cel jest zamierzony, skonfiguruj zarówno bezpośredni katalog główny Skills, jak i
dozwolony cel dowiązania symbolicznego:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Następnie rozpocznij nową sesję lub poczekaj, aż obserwator Skills się odświeży. Zrestartuj
gateway, jeśli działający proces pochodzi sprzed zmiany konfiguracji.

Nie używaj szerokich celów, takich jak `~`, `/` ani cały zsynchronizowany folder projektu.
Ogranicz `allowSymlinkTargets` do rzeczywistego katalogu głównego Skills, który zawiera zaufane
katalogi `SKILL.md`.

Powiązane:

- [Konfiguracja Skills](/pl/tools/skills-config#symlinked-sibling-repos)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 wymaga dodatkowego użycia dla długiego kontekstu

Użyj tego, gdy logi/błędy zawierają: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Sprawdź, czy:

- Wybrany model Anthropic Opus/Sonnet ma `params.context1m: true`.
- Bieżące poświadczenie Anthropic nie kwalifikuje się do użycia długiego kontekstu.
- Żądania zawodzą tylko w długich sesjach/uruchomieniach modelu, które potrzebują ścieżki beta 1M.

Opcje naprawy:

<Steps>
  <Step title="Wyłącz context1m">
    Wyłącz `context1m` dla tego modelu, aby wrócić do normalnego okna kontekstu.
  </Step>
  <Step title="Użyj kwalifikującego się poświadczenia">
    Użyj poświadczenia Anthropic kwalifikującego się do żądań długiego kontekstu albo przełącz się na klucz API Anthropic.
  </Step>
  <Step title="Skonfiguruj modele zapasowe">
    Skonfiguruj modele zapasowe, aby uruchomienia były kontynuowane, gdy żądania długiego kontekstu Anthropic zostaną odrzucone.
  </Step>
</Steps>

Powiązane:

- [Anthropic](/pl/providers/anthropic)
- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Dlaczego widzę HTTP 429 z Anthropic?](/pl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokalny backend zgodny z OpenAI przechodzi bezpośrednie probe, ale uruchomienia agenta zawodzą

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

- bezpośrednie małe wywołania się udają, ale uruchomienia OpenClaw zawodzą tylko przy większych promptach
- błędy `model_not_found` lub 404 występują mimo że bezpośrednie `/v1/chat/completions`
  działa z tym samym surowym identyfikatorem modelu
- błędy backendu mówią, że `messages[].content` oczekuje stringa
- okresowe ostrzeżenia `incomplete turn detected ... stopReason=stop payloads=0` z lokalnym backendem zgodnym z OpenAI
- awarie backendu pojawiające się tylko przy większych liczbach tokenów promptu lub pełnych promptach środowiska uruchomieniowego agenta

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `model_not_found` z lokalnym serwerem w stylu MLX/vLLM → sprawdź, czy `baseUrl` zawiera `/v1`, `api` to `"openai-completions"` dla backendów `/v1/chat/completions`, a `models.providers.<provider>.models[].id` jest surowym identyfikatorem lokalnym dla dostawcy. Wybierz go raz z prefiksem dostawcy, na przykład `mlx/mlx-community/Qwen3-30B-A3B-6bit`; pozostaw wpis katalogu jako `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend odrzuca strukturalne części treści Chat Completions. Naprawa: ustaw `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` lub dozwolone klucze wiadomości, takie jak `["role","content"]` → backend odrzuca metadane odtwarzania w stylu OpenAI w wiadomościach Chat Completions. Naprawa: ustaw `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend ukończył żądanie Chat Completions, ale nie zwrócił tekstu asystenta widocznego dla użytkownika w tej turze. OpenClaw ponawia puste tury zgodne z OpenAI, bezpieczne do odtworzenia, jeden raz; trwałe awarie zwykle oznaczają, że backend emituje pustą/nietekstową treść albo tłumi tekst odpowiedzi końcowej.
    - bezpośrednie małe żądania się udają, ale uruchomienia agentów OpenClaw zawodzą awariami backendu/modelu (na przykład Gemma w niektórych buildach `inferrs`) → transport OpenClaw prawdopodobnie jest już poprawny; backend zawodzi na większym kształcie promptu środowiska uruchomieniowego agenta.
    - awarie maleją po wyłączeniu narzędzi, ale nie znikają → schematy narzędzi były częścią obciążenia, lecz pozostały problem nadal dotyczy przepustowości modelu/serwera upstream albo błędu backendu.

  </Accordion>
  <Accordion title="Opcje naprawy">
    1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions akceptujących tylko stringi.
    2. Ustaw `compat.strictMessageKeys: true` dla rygorystycznych backendów Chat Completions, które w każdej wiadomości akceptują tylko `role` i `content`.
    3. Ustaw `compat.supportsTools: false` dla modeli/backendów, które nie potrafią niezawodnie obsłużyć powierzchni schematów narzędzi OpenClaw.
    4. Zmniejsz obciążenie promptu tam, gdzie to możliwe: mniejszy bootstrap workspace, krótsza historia sesji, lżejszy model lokalny albo backend z mocniejszą obsługą długiego kontekstu.
    5. Jeśli małe bezpośrednie żądania nadal przechodzą, a tury agenta OpenClaw wciąż powodują awarię wewnątrz backendu, potraktuj to jako ograniczenie serwera/modelu upstream i zgłoś tam reprodukcję z akceptowanym kształtem payloadu.
  </Accordion>
</AccordionGroup>

Powiązane:

- [Konfiguracja](/pl/gateway/configuration)
- [Modele lokalne](/pl/gateway/local-models)
- [Endpointy zgodne z OpenAI](/pl/gateway/configuration-reference#openai-compatible-endpoints)

## Brak odpowiedzi

Jeśli kanały działają, ale nic nie odpowiada, sprawdź routing i politykę przed ponownym podłączaniem czegokolwiek.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Sprawdź, czy:

- Pairing oczekuje dla nadawców DM.
- Bramka wzmianki w grupie (`requireMention`, `mentionPatterns`).
- Niezgodności listy dozwolonych kanałów/grup.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa ignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez politykę.

Powiązane:

- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Grupy](/pl/channels/groups)
- [Pairing](/pl/channels/pairing)

## Łączność interfejsu sterowania dashboard

Gdy dashboard/interfejs sterowania nie może się połączyć, zweryfikuj URL, tryb uwierzytelniania i założenia bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Sprawdź:

- Poprawny URL probe i URL dashboard.
- Niezgodność trybu/tokena uwierzytelniania między klientem a gateway.
- Użycie HTTP tam, gdzie wymagana jest tożsamość urządzenia.

<AccordionGroup>
  <Accordion title="Sygnatury połączenia / uwierzytelniania">
    - `device identity required` → niezabezpieczony kontekst lub brak uwierzytelniania urządzenia.
    - `origin not allowed` → `Origin` przeglądarki nie znajduje się w `gateway.controlUi.allowedOrigins` (albo łączysz się z origin przeglądarki innym niż loopback bez jawnej listy dozwolonych).
    - `device nonce required` / `device nonce mismatch` → klient nie kończy przepływu uwierzytelniania urządzenia opartego na wyzwaniu (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → klient podpisał niewłaściwy payload (albo nieaktualny znacznik czasu) dla bieżącego handshake.
    - `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną ponowną próbę z buforowanym tokenem urządzenia.
    - Ta ponowna próba z buforowanym tokenem używa buforowanego zestawu zakresów zapisanego z powiązanym tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują zamiast tego żądany zestaw zakresów.
    - `AUTH_SCOPE_MISMATCH` → token urządzenia został rozpoznany, ale jego zatwierdzone zakresy nie obejmują tego żądania połączenia; wykonaj ponowny pair albo zatwierdź żądany kontrakt zakresu zamiast rotować współdzielony token gateway.
    - Poza tą ścieżką ponownej próby pierwszeństwo uwierzytelniania połączenia to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a następnie token bootstrap.
    - Na asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego `{scope, ip}` są serializowane, zanim limiter zapisze niepowodzenie. Dwie złe równoległe ponowne próby z tego samego klienta mogą więc pokazać `retry later` przy drugiej próbie zamiast dwóch zwykłych niezgodności.
    - `too many failed authentication attempts (retry later)` z klienta przeglądarki pochodzącego z loopback → powtarzające się niepowodzenia z tego samego znormalizowanego `Origin` są tymczasowo blokowane; inny origin localhost używa osobnego koszyka.
    - powtarzające się `unauthorized` po tej ponownej próbie → rozjazd współdzielonego tokena/tokenu urządzenia; odśwież konfigurację tokena i w razie potrzeby ponownie zatwierdź/rotuj token urządzenia.
    - `gateway connect failed:` → niewłaściwy host/port/docelowy url.

  </Accordion>
</AccordionGroup>

### Szybka mapa kodów szczegółów uwierzytelniania

Użyj `error.details.code` z nieudanego response `connect`, aby wybrać następne działanie:

| Kod szczegółu                | Znaczenie                                                                                                                                                                                         | Zalecane działanie                                                                                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klient nie wysłał wymaganego wspólnego tokenu.                                                                                                                                                    | Wklej/ustaw token w kliencie i spróbuj ponownie. Dla ścieżek panelu: `openclaw config get gateway.auth.token`, a następnie wklej go w ustawieniach interfejsu Control UI.                                                                                                               |
| `AUTH_TOKEN_MISMATCH`        | Wspólny token nie pasował do tokenu uwierzytelniania Gateway.                                                                                                                                     | Jeśli `canRetryWithDeviceToken=true`, zezwól na jedną zaufaną ponowną próbę. Ponowne próby z tokenem z pamięci podręcznej ponownie używają zapisanych zatwierdzonych zakresów; wywołujący z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal się nie udaje, uruchom [listę kontrolną odzyskiwania rozjazdu tokenów](/pl/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token z pamięci podręcznej przypisany do urządzenia jest nieaktualny lub został unieważniony.                                                                                                     | Obróć/ponownie zatwierdź token urządzenia za pomocą [CLI urządzeń](/pl/cli/devices), a następnie połącz ponownie.                                                                                                                                                                          |
| `AUTH_SCOPE_MISMATCH`        | Token urządzenia jest prawidłowy, ale jego zatwierdzona rola/zakresy nie obejmują tego żądania połączenia.                                                                                        | Sparuj urządzenie ponownie albo zatwierdź żądany kontrakt zakresu; nie traktuj tego jako rozjazdu wspólnego tokenu.                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Tożsamość urządzenia wymaga zatwierdzenia. Sprawdź `error.details.reason` pod kątem `not-paired`, `scope-upgrade`, `role-upgrade` lub `metadata-upgrade` i użyj `requestId` / `remediationHint`, gdy są obecne. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`. Ulepszenia zakresu/roli używają tego samego przepływu po przejrzeniu żądanego dostępu.                                                                                       |

<Note>
Bezpośrednie backendowe RPC przez loopback uwierzytelniane współdzielonym tokenem/hasłem Gateway nie powinny zależeć od bazowego zakresu sparowanych urządzeń CLI. Jeśli subagenci lub inne wywołania wewnętrzne nadal kończą się niepowodzeniem z `scope-upgrade`, sprawdź, czy wywołujący używa `client.id: "gateway-client"` oraz `client.mode: "backend"` i nie wymusza jawnego `deviceIdentity` ani tokenu urządzenia.
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

- sesje tokenu sparowanego urządzenia mogą zarządzać tylko **własnym** urządzeniem, chyba że wywołujący ma także `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko zakresów operatora, które sesja wywołującego już posiada

Powiązane:

- [Konfiguracja](/pl/gateway/configuration) (tryby uwierzytelniania Gateway)
- [Interfejs Control UI](/pl/web/control-ui)
- [Urządzenia](/pl/cli/devices)
- [Dostęp zdalny](/pl/gateway/remote)
- [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth)

## Usługa Gateway nie działa

Użyj tego, gdy usługa jest zainstalowana, ale proces nie utrzymuje się uruchomiony.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Szukaj:

- `Runtime: stopped` ze wskazówkami dotyczącymi kodu wyjścia.
- Niezgodności konfiguracji usługi (`Config (cli)` vs `Config (service)`).
- Konfliktów portu/nasłuchu.
- Dodatkowych instalacji launchd/systemd/schtasks, gdy użyto `--deep`.
- Wskazówek czyszczenia `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → lokalny tryb Gateway nie jest włączony albo plik konfiguracyjny został nadpisany i utracił `gateway.mode`. Poprawka: ustaw `gateway.mode="local"` w konfiguracji albo uruchom ponownie `openclaw onboard --mode local` / `openclaw setup`, aby ponownie nadać oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślna ścieżka konfiguracji to `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → wiązanie poza loopback bez prawidłowej ścieżki uwierzytelniania Gateway (token/hasło albo trusted-proxy tam, gdzie skonfigurowano).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflikt portu.
    - `Other gateway-like services detected (best effort)` → istnieją przestarzałe lub równoległe jednostki launchd/systemd/schtasks. Większość konfiguracji powinna mieć jeden Gateway na maszynę; jeśli potrzebujesz więcej niż jednego, odizoluj porty oraz konfigurację/stan/przestrzeń roboczą. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` z doctor → istnieje systemowa jednostka systemd, a brakuje usługi na poziomie użytkownika. Usuń lub wyłącz duplikat przed zezwoleniem doctor na instalację usługi użytkownika albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, jeśli jednostka systemowa jest zamierzonym nadzorcą.
    - `Gateway service port does not match current gateway config` → zainstalowany nadzorca nadal przypina stary `--port`. Uruchom `openclaw doctor --fix` albo `openclaw gateway install --force`, a następnie zrestartuj usługę Gateway.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Wykonywanie w tle i narzędzie procesu](/pl/gateway/background-process)
- [Konfiguracja](/pl/gateway/configuration)
- [Doctor](/pl/gateway/doctor)

## Gateway odrzucił nieprawidłową konfigurację

Użyj tego, gdy uruchomienie Gateway kończy się niepowodzeniem z `Invalid config` albo logi przeładowania na gorąco mówią,
że pominięto nieprawidłową edycję.

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
    - Konfiguracja nie przeszła walidacji podczas uruchamiania, przeładowania na gorąco albo zapisu należącego do OpenClaw.
    - Uruchomienie Gateway kończy się niepowodzeniem w trybie zamkniętym zamiast przepisywać `openclaw.json`.
    - Przeładowanie na gorąco pomija nieprawidłowe zewnętrzne edycje i utrzymuje aktywną bieżącą konfigurację runtime.
    - Zapisy należące do OpenClaw odrzucają nieprawidłowe/destrukcyjne ładunki przed zatwierdzeniem i zapisują `.rejected.*`.
    - `openclaw doctor --fix` odpowiada za naprawę. Może usunąć prefiksy spoza JSON albo przywrócić ostatnią znaną dobrą kopię, zachowując odrzucony ładunek jako `.clobbered.*`.

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
    - `.clobbered.*` istnieje → doctor zachował uszkodzoną zewnętrzną edycję podczas naprawy aktywnej konfiguracji.
    - `.rejected.*` istnieje → zapis konfiguracji należący do OpenClaw nie przeszedł schematu lub kontroli nadpisania przed zatwierdzeniem.
    - `Config write rejected:` → zapis próbował usunąć wymaganą strukturę, gwałtownie zmniejszyć plik albo utrwalić nieprawidłową konfigurację.
    - `config reload skipped (invalid config):` → bezpośrednia edycja nie przeszła walidacji i została zignorowana przez działający Gateway.
    - `Invalid config at ...` → uruchomienie nie powiodło się przed startem usług Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` lub `size-drop-vs-last-good:*` → zapis należący do OpenClaw został odrzucony, ponieważ utracił pola lub rozmiar względem ostatniej znanej dobrej kopii zapasowej.
    - `Config last-known-good promotion skipped` → kandydat zawierał zredagowane placeholdery sekretów, takie jak `***`.

  </Accordion>
  <Accordion title="Opcje naprawy">
    1. Uruchom `openclaw doctor --fix`, aby doctor naprawił konfigurację z prefiksem/nadpisaną albo przywrócił ostatnią znaną dobrą.
    2. Skopiuj tylko zamierzone klucze z `.clobbered.*` lub `.rejected.*`, a następnie zastosuj je przez `openclaw config set` albo `config.patch`.
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

Szukaj:

- `warnings[].code` i `primaryTargetId` w danych wyjściowych JSON.
- Tego, czy ostrzeżenie dotyczy awaryjnego SSH, wielu Gateway, brakujących zakresów czy nierozwiązanych odwołań uwierzytelniania.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal spróbowało bezpośrednich skonfigurowanych/celów loopback.
- `multiple reachable gateways detected` → odpowiedział więcej niż jeden cel. Zwykle oznacza to zamierzoną konfigurację wielu Gateway albo przestarzałe/zduplikowane nasłuchy.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie zadziałało, ale szczegółowe RPC jest ograniczone zakresem; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → połączenie zadziałało, ale pełny zestaw diagnostycznych RPC przekroczył limit czasu lub zakończył się niepowodzeniem. Traktuj to jako osiągalny Gateway ze zdegradowaną diagnostyką; porównaj `connect.ok` i `connect.rpcOk` w danych wyjściowych `--json`.
- `Capability: pairing-pending` lub `gateway closed (1008): pairing required` → Gateway odpowiedział, ale ten klient nadal wymaga parowania/zatwierdzenia przed normalnym dostępem operatora.
- nierozwiązany tekst ostrzeżenia `gateway.auth.*` / `gateway.remote.*` SecretRef → materiał uwierzytelniający był niedostępny w tej ścieżce polecenia dla celu, który zakończył się niepowodzeniem.

Powiązane:

- [Gateway](/pl/cli/gateway)
- [Wiele Gateway na tym samym hoście](/pl/gateway#multiple-gateways-same-host)
- [Dostęp zdalny](/pl/gateway/remote)

## Kanał połączony, wiadomości nie są przesyłane

Jeśli stan kanału to połączony, ale przepływ wiadomości nie działa, skup się na zasadach, uprawnieniach i regułach dostarczania specyficznych dla kanału.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Sprawdź:

- Zasady DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlistę grup i wymagania dotyczące wzmianki.
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

Jeśli Cron lub Heartbeat nie uruchomił się albo nie dostarczył wiadomości, najpierw zweryfikuj stan harmonogramu, a następnie cel dostarczenia.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Sprawdź:

- Cron jest włączony i istnieje następne wybudzenie.
- Stan historii uruchomień zadania (`ok`, `skipped`, `error`).
- Powody pominięcia Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron wyłączony.
    - `cron: timer tick failed` → takt harmonogramu nie powiódł się; sprawdź błędy plików/logów/środowiska uruchomieniowego.
    - `heartbeat skipped` with `reason=quiet-hours` → poza oknem aktywnych godzin.
    - `heartbeat skipped` with `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste wiersze / nagłówki markdown, więc OpenClaw pomija wywołanie modelu.
    - `heartbeat skipped` with `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne zadania nie są wymagalne w tym takcie.
    - `heartbeat: unknown accountId` → nieprawidłowy identyfikator konta dla celu dostarczania Heartbeat.
    - `heartbeat skipped` with `reason=dm-blocked` → cel Heartbeat został rozpoznany jako miejsce docelowe typu DM, podczas gdy `agents.defaults.heartbeat.directPolicy` (lub nadpisanie dla agenta) ma wartość `block`.

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
- Zatwierdzenia wykonywania i stan allowlisty.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja Node musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brakujące uprawnienie systemu operacyjnego.
- `SYSTEM_RUN_DENIED: approval required` → oczekuje zatwierdzenie wykonywania.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez allowlistę.

Powiązane:

- [Zatwierdzenia wykonywania](/pl/tools/exec-approvals)
- [Rozwiązywanie problemów z Node](/pl/nodes/troubleshooting)
- [Node](/pl/nodes/index)

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

- Czy `plugins.allow` jest ustawione i zawiera `browser`.
- Prawidłową ścieżkę do pliku wykonywalnego przeglądarki.
- Osiągalność profilu CDP.
- Dostępność lokalnego Chrome dla profili `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` or `unknown command 'browser'` → wbudowany plugin przeglądarki jest wykluczony przez `plugins.allow`.
    - narzędzie przeglądarki brakujące / niedostępne przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc plugin nigdy się nie załadował.
    - `Failed to start Chrome CDP on port` → nie udało się uruchomić procesu przeglądarki.
    - `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
    - `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` lub `ftp:`.
    - `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma błędny port lub port spoza zakresu.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja Gateway nie ma podstawowej zależności środowiska uruchomieniowego przeglądarki; zainstaluj ponownie lub zaktualizuj OpenClaw, a następnie uruchom ponownie Gateway. Migawki ARIA i podstawowe zrzuty ekranu stron mogą nadal działać, ale nawigacja, migawki AI, zrzuty ekranu elementów z selektorem CSS i eksport PDF pozostają niedostępne.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → istniejąca sesja Chrome MCP nie mogła jeszcze podłączyć się do wybranego katalogu danych przeglądarki. Otwórz stronę inspekcji przeglądarki, włącz zdalne debugowanie, pozostaw przeglądarkę otwartą, zatwierdź pierwszy monit o podłączenie, a następnie spróbuj ponownie. Jeśli stan zalogowania nie jest wymagany, preferuj zarządzany profil `openclaw`.
    - `No Chrome tabs found for profile="user"` → profil podłączenia Chrome MCP nie ma otwartych lokalnych kart Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny punkt końcowy CDP nie jest osiągalny z hosta Gateway.
    - `Browser attachOnly is enabled ... not reachable` or `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko do podłączania nie ma osiągalnego celu albo punkt końcowy HTTP odpowiedział, ale nadal nie udało się otworzyć WebSocket CDP.

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu połączyło `--full-page` z `--ref` lub `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwytywania strony albo `--ref` z migawki, a nie CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → haki przesyłania Chrome MCP wymagają referencji migawek, a nie selektorów CSS.
    - `existing-session file uploads currently support one file at a time.` → wysyłaj jedno przesłanie na wywołanie w profilach Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → haki dialogów w profilach Chrome MCP nie obsługują nadpisań limitu czasu.
    - `existing-session type does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:type` w `profile="user"` / profilach istniejących sesji Chrome MCP albo użyj zarządzanego profilu przeglądarki/CDP, gdy wymagany jest niestandardowy limit czasu.
    - `existing-session evaluate does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:evaluate` w `profile="user"` / profilach istniejących sesji Chrome MCP albo użyj zarządzanego profilu przeglądarki/CDP, gdy wymagany jest niestandardowy limit czasu.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki albo surowego profilu CDP.
    - przestarzałe nadpisania viewportu / trybu ciemnego / locale / offline w profilach tylko do podłączania albo zdalnych CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez ponownego uruchamiania całego Gateway.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Przeglądarka (zarządzana przez OpenClaw)](/pl/tools/browser)
- [Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting)

## Jeśli po aktualizacji coś nagle przestało działać

Większość awarii po aktualizacji wynika z dryfu konfiguracji albo z egzekwowania bardziej rygorystycznych wartości domyślnych.

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

    - `gateway connect failed:` → błędny docelowy URL.
    - `unauthorized` → punkt końcowy osiągalny, ale uwierzytelnianie nieprawidłowe.

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

    - Powiązania spoza loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki uwierzytelniania Gateway: uwierzytelniania współdzielonym tokenem/hasłem albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` spoza loopback.
    - Stare klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

    Typowe sygnatury:

    - `refusing to bind gateway ... without auth` → powiązanie spoza loopback bez prawidłowej ścieżki uwierzytelniania Gateway.
    - `Connectivity probe: failed` gdy środowisko uruchomieniowe działa → Gateway żyje, ale jest niedostępny z bieżącym uwierzytelnianiem/URL.

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Co sprawdzić:

    - Oczekujące zatwierdzenia urządzeń dla panelu/nodów.
    - Oczekujące zatwierdzenia parowania DM po zmianach zasad lub tożsamości.

    Typowe sygnatury:

    - `device identity required` → uwierzytelnianie urządzenia niespełnione.
    - `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

  </Accordion>
</AccordionGroup>

Jeśli konfiguracja usługi i środowisko uruchomieniowe nadal się nie zgadzają po sprawdzeniach, zainstaluj ponownie metadane usługi z tego samego katalogu profilu/stanu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane:

- [Uwierzytelnianie](/pl/gateway/authentication)
- [Wykonywanie w tle i narzędzie procesu](/pl/gateway/background-process)
- [Parowanie zarządzane przez Gateway](/pl/gateway/pairing)

## Powiązane

- [Doctor](/pl/gateway/doctor)
- [FAQ](/pl/help/faq)
- [Runbook Gateway](/pl/gateway)
