---
read_when:
    - Centrum rozwiązywania problemów skierowało Cię tutaj w celu głębszej diagnostyki
    - Potrzebujesz stabilnych, opartych na objawach sekcji runbooka z dokładnymi poleceniami
sidebarTitle: Troubleshooting
summary: Szczegółowy runbook rozwiązywania problemów z Gateway, kanałami, automatyzacją, węzłami i przeglądarką
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-06-27T17:38:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ta strona to szczegółowy runbook. Zacznij od [/help/troubleshooting](/pl/help/troubleshooting), jeśli najpierw chcesz skorzystać z szybkiego przepływu triage.

## Drabina poleceń

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
- `openclaw channels status --probe` pokazuje bieżący status transportu dla każdego konta oraz, tam gdzie jest to obsługiwane, wyniki sondowania/audytu, takie jak `works` lub `audit ok`.

## Po aktualizacji

Użyj tego, gdy aktualizacja się zakończy, ale Gateway nie działa, kanały są puste albo
wywołania modeli zaczynają kończyć się błędami 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Sprawdź:

- `Update restart` w `openclaw status` / `openclaw status --all`. Oczekujące lub
  nieudane przekazania zawierają następne polecenie do uruchomienia.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  w sekcji Channels. Oznacza to, że konfiguracja kanału nadal istnieje, ale
  rejestracja pluginu nie powiodła się, zanim kanał mógł zostać załadowany.
- błędy 401 dostawcy po ponownym uwierzytelnieniu. `openclaw doctor --fix` sprawdza przestarzałe
  cienie uwierzytelnienia OAuth poszczególnych agentów i usuwa stare kopie, aby wszyscy agenci rozwiązywali
  bieżący współdzielony profil.

## Instalacje split brain i strażnik nowszej konfiguracji

Użyj tego, gdy usługa Gateway niespodziewanie zatrzymuje się po aktualizacji albo logi pokazują, że jeden plik binarny `openclaw` jest starszy niż wersja, która ostatnio zapisała `openclaw.json`.

OpenClaw oznacza zapisy konfiguracji polem `meta.lastTouchedVersion`. Polecenia tylko do odczytu nadal mogą sprawdzić konfigurację zapisaną przez nowszy OpenClaw, ale mutacje procesów i usług odmawiają kontynuowania ze starszego pliku binarnego. Blokowane działania obejmują uruchomienie, zatrzymanie, restart, odinstalowanie usługi Gateway, wymuszoną ponowną instalację usługi, uruchomienie Gateway w trybie usługi oraz czyszczenie portu przez `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Napraw `PATH`, aby `openclaw` wskazywał nowszą instalację, a następnie ponownie uruchom działanie.
  </Step>
  <Step title="Reinstall the gateway service">
    Ponownie zainstaluj zamierzoną usługę Gateway z nowszej instalacji:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Usuń przestarzały pakiet systemowy lub stare wpisy wrappera, które nadal wskazują stary plik binarny `openclaw`.
  </Step>
</Steps>

<Warning>
Tylko przy celowym obniżeniu wersji lub awaryjnym odzyskiwaniu ustaw `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` dla pojedynczego polecenia. Przy normalnym działaniu pozostaw tę zmienną nieustawioną.
</Warning>

## Niezgodność protokołu po rollbacku

Użyj tego, gdy logi nadal wypisują `protocol mismatch` po obniżeniu wersji lub wycofaniu OpenClaw. Oznacza to, że działa starszy Gateway, ale nowszy lokalny proces klienta nadal próbuje ponownie połączyć się z zakresem protokołu, którego starszy Gateway nie obsługuje.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Sprawdź:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` w logach Gateway.
- `Established clients:` w `openclaw gateway status --deep` lub `Gateway clients` w `openclaw doctor --deep`. To pokazuje aktywne klienty TCP połączone z portem Gateway, w tym PID-y i wiersze poleceń, gdy system operacyjny na to pozwala.
- Proces klienta, którego wiersz poleceń wskazuje nowszą instalację OpenClaw lub wrapper, z którego wykonano rollback.

Naprawa:

1. Zatrzymaj lub zrestartuj przestarzały proces klienta OpenClaw pokazany przez `gateway status --deep`.
2. Zrestartuj aplikacje lub wrappery osadzające OpenClaw, takie jak lokalne dashboardy, edytory, pomocniki serwera aplikacji albo długo działające powłoki `openclaw logs --follow`.
3. Uruchom ponownie `openclaw gateway status --deep` lub `openclaw doctor --deep` i potwierdź, że przestarzały PID klienta zniknął.

Nie sprawiaj, aby starszy Gateway akceptował nowszy niezgodny protokół. Podbicia protokołu chronią kontrakt przewodowy; odzyskiwanie po rollbacku jest problemem czyszczenia procesu/wersji.

## Pominięto symlink Skill jako wyjście poza ścieżkę

Użyj tego, gdy logi zawierają:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw traktuje każdy katalog główny skill jako granicę izolacji. Symlink w
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` lub
`~/.openclaw/skills` jest pomijany, gdy jego rzeczywisty cel rozwiązuje się poza tym katalogiem głównym,
chyba że cel jest jawnie zaufany.

Sprawdź link:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Jeśli cel jest zamierzony, skonfiguruj zarówno bezpośredni katalog główny skill, jak i
dozwolony cel symlinku:

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

Następnie uruchom nową sesję albo poczekaj, aż watcher Skills się odświeży. Zrestartuj
Gateway, jeśli działający proces poprzedza zmianę konfiguracji.

Nie używaj szerokich celów, takich jak `~`, `/` albo cały synchronizowany folder projektu.
Ogranicz `allowSymlinkTargets` do rzeczywistego katalogu głównego skill, który zawiera zaufane
katalogi `SKILL.md`.

Jeśli Skill Workshop apply ma także zapisywać przez te zaufane symlinkowane
ścieżki skill w workspace, włącz `skills.workshop.allowSymlinkTargetWrites`. Pozostaw
to wyłączone dla współdzielonych katalogów głównych skill tylko do odczytu.

Powiązane:

- [Konfiguracja Skills](/pl/tools/skills-config#symlinked-skill-roots)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429: wymagane dodatkowe użycie dla długiego kontekstu

Użyj tego, gdy logi/błędy zawierają: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Sprawdź:

- Wybrany model Anthropic to model 1M Claude 4.x zdolny do GA albo model ma starsze `params.context1m: true`.
- Bieżące poświadczenie Anthropic nie kwalifikuje się do użycia długiego kontekstu.
- Żądania nie udają się tylko w długich sesjach/uruchomieniach modeli, które wymagają ścieżki kontekstu 1M.

Opcje naprawy:

<Steps>
  <Step title="Use a standard context window">
    Przełącz na model ze standardowym oknem albo usuń starsze `context1m` ze starej
    konfiguracji modelu, która nie jest zdolna do GA dla kontekstu 1M.
  </Step>
  <Step title="Use an eligible credential">
    Użyj poświadczenia Anthropic kwalifikującego się do żądań długiego kontekstu albo przełącz się na klucz API Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Skonfiguruj modele fallback, aby uruchomienia były kontynuowane, gdy żądania długiego kontekstu Anthropic zostaną odrzucone.
  </Step>
</Steps>

Powiązane:

- [Anthropic](/pl/providers/anthropic)
- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Dlaczego widzę HTTP 429 z Anthropic?](/pl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Odpowiedzi blokowane przez upstream 403

Użyj tego, gdy nadrzędny dostawca LLM zwraca ogólny `403`, taki jak
`Your request was blocked`.

Nie zakładaj, że zawsze jest to problem konfiguracji OpenClaw. Odpowiedź może
pochodzić z nadrzędnej warstwy bezpieczeństwa, takiej jak CDN, WAF, reguła zarządzania botami lub
reverse proxy przed endpointem zgodnym z OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Sprawdź:

- wiele modeli u tego samego dostawcy zawodzi w ten sam sposób
- HTML albo ogólny tekst bezpieczeństwa zamiast normalnego błędu API dostawcy
- zdarzenia bezpieczeństwa po stronie dostawcy dla tego samego czasu żądania
- mała bezpośrednia sonda `curl` udaje się, gdy normalne żądania w kształcie SDK zawodzą

Najpierw napraw filtrowanie po stronie dostawcy, gdy dowody wskazują na blokadę
WAF/CDN. Preferuj wąsko ograniczoną regułę zezwolenia lub pominięcia dla ścieżki API używanej przez OpenClaw
i unikaj wyłączania ochrony dla całej witryny.

<Warning>
Udane minimalne `curl` nie gwarantuje, że rzeczywiste żądania w stylu SDK
przejdą przez tę samą nadrzędną warstwę bezpieczeństwa.
</Warning>

Powiązane:

- [Endpointy zgodne z OpenAI](/pl/gateway/configuration-reference#openai-compatible-endpoints)
- [Konfiguracja dostawcy](/pl/providers)
- [Logi](/pl/logging)

## Lokalny backend zgodny z OpenAI przechodzi bezpośrednie sondy, ale uruchomienia agenta zawodzą

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

Sprawdź:

- bezpośrednie małe wywołania się udają, ale uruchomienia OpenClaw zawodzą tylko przy większych promptach
- błędy `model_not_found` lub 404, mimo że bezpośrednie `/v1/chat/completions`
  działa z tym samym prostym identyfikatorem modelu
- błędy backendu o tym, że `messages[].content` oczekuje ciągu znaków
- sporadyczne ostrzeżenia `incomplete turn detected ... stopReason=stop payloads=0` z lokalnym backendem zgodnym z OpenAI
- awarie backendu, które pojawiają się tylko przy większej liczbie tokenów promptu lub pełnych promptach środowiska uruchomieniowego agenta

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` z lokalnym serwerem w stylu MLX/vLLM → sprawdź, czy `baseUrl` zawiera `/v1`, `api` to `"openai-completions"` dla backendów `/v1/chat/completions`, a `models.providers.<provider>.models[].id` jest prostym lokalnym identyfikatorem dostawcy. Wybierz go raz z prefiksem dostawcy, na przykład `mlx/mlx-community/Qwen3-30B-A3B-6bit`; pozostaw wpis katalogu jako `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend odrzuca strukturalne części treści Chat Completions. Naprawa: ustaw `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` lub dozwolone klucze wiadomości, takie jak `["role","content"]` → backend odrzuca metadane odtwarzania w stylu OpenAI w wiadomościach Chat Completions. Naprawa: ustaw `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend ukończył żądanie Chat Completions, ale nie zwrócił tekstu asystenta widocznego dla użytkownika w tej turze. OpenClaw ponawia puste, bezpieczne do odtworzenia tury zgodne z OpenAI jeden raz; trwałe awarie zwykle oznaczają, że backend emituje pustą/nietekstową treść albo tłumi tekst odpowiedzi końcowej.
    - bezpośrednie małe żądania się udają, ale uruchomienia agenta OpenClaw zawodzą awariami backendu/modelu (na przykład Gemma w niektórych buildach `inferrs`) → transport OpenClaw prawdopodobnie jest już poprawny; backend zawodzi na większym kształcie promptu środowiska uruchomieniowego agenta.
    - awarie zmniejszają się po wyłączeniu narzędzi, ale nie znikają → schematy narzędzi były częścią obciążenia, ale pozostały problem nadal dotyczy pojemności nadrzędnego modelu/serwera albo błędu backendu.

  </Accordion>
  <Accordion title="Fix options">
    1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions obsługujących tylko ciągi znaków.
    2. Ustaw `compat.strictMessageKeys: true` dla restrykcyjnych backendów Chat Completions, które akceptują tylko `role` i `content` w każdej wiadomości.
    3. Ustaw `compat.supportsTools: false` dla modeli/backendów, które nie potrafią niezawodnie obsłużyć powierzchni schematu narzędzi OpenClaw.
    4. Ogranicz obciążenie promptu tam, gdzie to możliwe: mniejszy bootstrap workspace, krótsza historia sesji, lżejszy model lokalny albo backend z mocniejszą obsługą długiego kontekstu.
    5. Jeśli małe bezpośrednie żądania nadal przechodzą, a tury agenta OpenClaw wciąż powodują awarię wewnątrz backendu, traktuj to jako ograniczenie nadrzędnego serwera/modelu i zgłoś tam repro z akceptowanym kształtem payloadu.
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

Zwróć uwagę na:

- Oczekujące parowanie dla nadawców DM.
- Bramkowanie wzmianek w grupie (`requireMention`, `mentionPatterns`).
- Niezgodności listy dozwolonych kanałów/grup.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa ignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez zasady.

Powiązane:

- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Grupy](/pl/channels/groups)
- [Parowanie](/pl/channels/pairing)

## Łączność interfejsu sterowania panelu

Gdy panel/interfejs sterowania nie chce się połączyć, sprawdź URL, tryb uwierzytelniania i założenia dotyczące bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Zwróć uwagę na:

- Poprawny URL sondy i URL panelu.
- Niezgodność trybu/tokena uwierzytelniania między klientem a gatewayem.
- Użycie HTTP tam, gdzie wymagana jest tożsamość urządzenia.

Jeśli lokalna przeglądarka nie może połączyć się z `127.0.0.1:18789` po aktualizacji, najpierw
przywróć lokalną usługę Gateway i potwierdź, że serwuje panel:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Jeśli `curl` zwraca HTML OpenClaw, Gateway działa, a pozostały problem
to prawdopodobnie pamięć podręczna przeglądarki, stary głęboki link albo nieaktualny stan karty. Otwórz
`http://127.0.0.1:18789` bezpośrednio i przejdź dalej z panelu. Jeśli restart
nie zostawia usługi uruchomionej, uruchom `openclaw gateway start` i ponownie sprawdź
`openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → niezabezpieczony kontekst lub brak uwierzytelniania urządzenia.
    - `origin not allowed` → przeglądarkowy `Origin` nie znajduje się w `gateway.controlUi.allowedOrigins` (albo łączysz się z przeglądarkowego originu spoza loopback bez jawnej listy dozwolonych).
    - `device nonce required` / `device nonce mismatch` → klient nie kończy opartego na wyzwaniu przepływu uwierzytelniania urządzenia (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → klient podpisał niewłaściwy payload (albo nieaktualny znacznik czasu) dla bieżącego handshake'u.
    - `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną ponowną próbę z buforowanym tokenem urządzenia.
    - Ta ponowna próba z buforowanym tokenem używa ponownie buforowanego zestawu zakresów przechowywanego ze sparowanym tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują zamiast tego swój żądany zestaw zakresów.
    - `AUTH_SCOPE_MISMATCH` → token urządzenia został rozpoznany, ale jego zatwierdzone zakresy nie obejmują tego żądania połączenia; sparuj ponownie albo zatwierdź żądany kontrakt zakresu zamiast rotować współdzielony token gatewaya.
    - Poza tą ścieżką ponownej próby priorytet uwierzytelniania połączenia to najpierw jawny token współdzielony/hasło, następnie jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrap.
    - W asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego `{scope, ip}` są serializowane, zanim limiter zarejestruje niepowodzenie. Dlatego dwie złe równoczesne ponowne próby od tego samego klienta mogą ujawnić `retry later` przy drugiej próbie zamiast dwóch zwykłych niezgodności.
    - `too many failed authentication attempts (retry later)` od klienta loopback z originu przeglądarki → powtarzające się niepowodzenia z tego samego znormalizowanego `Origin` są tymczasowo blokowane; inny origin localhost używa osobnego koszyka.
    - powtarzające się `unauthorized` po tej ponownej próbie → rozjazd tokena współdzielonego/tokena urządzenia; odśwież konfigurację tokena i w razie potrzeby ponownie zatwierdź/obróć token urządzenia.
    - `gateway connect failed:` → niewłaściwy host/port/docelowy URL.

  </Accordion>
</AccordionGroup>

### Szybka mapa kodów szczegółów uwierzytelniania

Użyj `error.details.code` z nieudanego wyniku `connect`, aby wybrać następną czynność:

| Kod szczegółów               | Znaczenie                                                                                                                                                                                    | Zalecane działanie                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klient nie wysłał wymaganego tokena współdzielonego.                                                                                                                                         | Wklej/ustaw token w kliencie i ponów próbę. Dla ścieżek panelu: `openclaw config get gateway.auth.token`, a następnie wklej w ustawieniach Control UI.                                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | Token współdzielony nie pasował do tokena uwierzytelniania gatewaya.                                                                                                                         | Jeśli `canRetryWithDeviceToken=true`, zezwól na jedną zaufaną ponowną próbę. Ponowne próby z buforowanym tokenem używają zapisanych zatwierdzonych zakresów; wywołujący z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal się nie udaje, uruchom [listę kontrolną odzyskiwania po rozjeździe tokena](/pl/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Buforowany token per urządzenie jest nieaktualny lub unieważniony.                                                                                                                           | Obróć/ponownie zatwierdź token urządzenia za pomocą [CLI urządzeń](/pl/cli/devices), a następnie połącz ponownie.                                                                                                                                                                           |
| `AUTH_SCOPE_MISMATCH`        | Token urządzenia jest prawidłowy, ale jego zatwierdzona rola/zakresy nie obejmują tego żądania połączenia.                                                                                   | Sparuj urządzenie ponownie albo zatwierdź żądany kontrakt zakresu; nie traktuj tego jako rozjazdu tokena współdzielonego.                                                                                                                                                                |
| `PAIRING_REQUIRED`           | Tożsamość urządzenia wymaga zatwierdzenia. Sprawdź `error.details.reason` pod kątem `not-paired`, `scope-upgrade`, `role-upgrade` lub `metadata-upgrade`, i użyj `requestId` / `remediationHint`, gdy są obecne. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`. Ulepszenia zakresu/roli używają tego samego przepływu po sprawdzeniu żądanego dostępu.                                                                                       |

<Note>
Bezpośrednie backendowe RPC przez loopback uwierzytelniane współdzielonym tokenem/hasłem gatewaya nie powinny zależeć od bazowej linii zakresów sparowanego urządzenia z CLI. Jeśli podagenci lub inne wywołania wewnętrzne nadal kończą się niepowodzeniem z `scope-upgrade`, sprawdź, czy wywołujący używa `client.id: "gateway-client"` i `client.mode: "backend"` oraz nie wymusza jawnego `deviceIdentity` ani tokena urządzenia.
</Note>

Kontrola migracji uwierzytelniania urządzeń v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jeśli logi pokazują błędy nonce/podpisu, zaktualizuj łączącego się klienta i go zweryfikuj:

<Steps>
  <Step title="Wait for connect.challenge">
    Klient czeka na wydane przez gateway `connect.challenge`.
  </Step>
  <Step title="Sign the payload">
    Klient podpisuje payload powiązany z wyzwaniem.
  </Step>
  <Step title="Send the device nonce">
    Klient wysyła `connect.params.device.nonce` z tym samym nonce wyzwania.
  </Step>
</Steps>

Jeśli `openclaw devices rotate` / `revoke` / `remove` zostaje nieoczekiwanie odrzucone:

- sesje tokenów sparowanych urządzeń mogą zarządzać tylko **własnym** urządzeniem, chyba że wywołujący ma też `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko zakresów operatora, które sesja wywołującego już posiada

Powiązane:

- [Konfiguracja](/pl/gateway/configuration) (tryby uwierzytelniania gatewaya)
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

Zwróć uwagę na:

- `Runtime: stopped` ze wskazówkami wyjścia.
- Niezgodność konfiguracji usługi (`Config (cli)` vs `Config (service)`).
- Konflikty portu/listenera.
- Dodatkowe instalacje launchd/systemd/schtasks przy użyciu `--deep`.
- Wskazówki czyszczenia `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → lokalny tryb gatewaya nie jest włączony albo plik konfiguracji został nadpisany i utracił `gateway.mode`. Poprawka: ustaw `gateway.mode="local"` w konfiguracji albo ponownie uruchom `openclaw onboard --mode local` / `openclaw setup`, aby ponownie oznaczyć oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślna ścieżka konfiguracji to `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind spoza loopback bez prawidłowej ścieżki uwierzytelniania gatewaya (token/hasło albo zaufane proxy tam, gdzie skonfigurowano).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflikt portu.
    - `Other gateway-like services detected (best effort)` → istnieją nieaktualne lub równoległe jednostki launchd/systemd/schtasks. Większość konfiguracji powinna utrzymywać jeden gateway na maszynę; jeśli potrzebujesz więcej niż jednego, odizoluj porty + konfigurację/stan/przestrzeń roboczą. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` z doctor → istnieje jednostka systemowa systemd, podczas gdy brakuje usługi na poziomie użytkownika. Usuń lub wyłącz duplikat, zanim pozwolisz doctor zainstalować usługę użytkownika, albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, jeśli jednostka systemowa jest zamierzonym nadzorcą.
    - `Gateway service port does not match current gateway config` → zainstalowany nadzorca nadal przypina stary `--port`. Uruchom `openclaw doctor --fix` albo `openclaw gateway install --force`, a następnie zrestartuj usługę gatewaya.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Wykonywanie w tle i narzędzie procesów](/pl/gateway/background-process)
- [Konfiguracja](/pl/gateway/configuration)
- [Doctor](/pl/gateway/doctor)

## Gateway na macOS po cichu przestaje odpowiadać, a potem wznawia działanie, gdy dotkniesz panelu

Użyj tego, gdy kanały (Telegram, WhatsApp itd.) na hoście macOS milkną na minuty lub godziny naraz, a gateway wydaje się wracać w chwili, gdy otworzysz Control UI, połączysz się przez SSH albo w inny sposób wejdziesz w interakcję z hostem. Zwykle nie ma oczywistego objawu w `openclaw status`, ponieważ zanim sprawdzisz, gateway znów działa.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Szukaj:

- Jednego lub więcej pakietów `*-uncaught_exception.json` w `~/.openclaw/logs/stability/` z `error.code` ustawionym na przejściowy kod sieciowy, taki jak `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` lub `ECONNREFUSED`.
- Wierszy `pmset -g log`, takich jak `Entering Sleep state due to 'Maintenance Sleep'` lub `en0 driver is slow (msg: WillChangeState to 0)`, zbieżnych ze znacznikami czasu awarii. Power Nap / Maintenance Sleep na krótko przełącza sterownik Wi-Fi w stan 0; każde wychodzące `connect()`, które trafi w to okno, może zakończyć się błędem `ENETDOWN` nawet na hoście, który poza tym ma pełną łączność sieciową.
- Wyniku `launchctl print` pokazującego `state = not running` z wieloma niedawnymi `runs` i kodem wyjścia, zwłaszcza gdy odstęp między awarią a następnym uruchomieniem jest rzędu godziny, a nie sekund. macOS launchd stosuje nieudokumentowaną bramkę ochrony przed ponownym uruchamianiem po serii awarii, która może przestać respektować `KeepAlive=true`, dopóki zewnętrzny wyzwalacz, taki jak interaktywne logowanie, połączenie z dashboardem lub `launchctl kickstart`, nie uzbroi jej ponownie.

Typowe sygnatury:

- Pakiet stabilności, którego `error.code` to `ENETDOWN` lub pokrewny kod, ze stosem wywołań wskazującym na Node `net` `lookupAndConnect` / `Socket.connect`. OpenClaw `2026.5.26` i nowsze klasyfikują je jako niegroźne przejściowe błędy sieciowe, więc nie propagują się już do najwyższego poziomu obsługi nieprzechwyconych wyjątków; jeśli używasz starszego wydania, najpierw zaktualizuj.
- Długie ciche okresy, które kończą się dokładnie w chwili połączenia z Control UI lub SSH do hosta: widoczna dla użytkownika aktywność ponownie uzbraja bramkę ponownego uruchamiania launchd, a nie jakiekolwiek działanie dashboardu wobec Gateway.
- Licznik `runs` rosnący w ciągu dnia bez odpowiadającego mu wiersza `received SIG*; shutting down` w `~/Library/Logs/openclaw/gateway.log`: czyste zamknięcia zapisują sygnał w logu; przejściowe awarie nie.

Co zrobić:

1. **Zaktualizuj Gateway**, jeśli używasz wydania sprzed `2026.5.26`. Po aktualizacji przyszłe błędy `ENETDOWN` będą logowane jako ostrzeżenia zamiast kończyć proces.
2. **Ogranicz aktywność Maintenance Sleep** na hostach Mac mini / desktop, które mają działać jako stale włączone serwery:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   To znacząco ogranicza, ale nie eliminuje całkowicie, bazowego przełączenia sterownika. System nadal może wykonywać niektóre uśpienia konserwacyjne na potrzeby TCP keepalive i utrzymania mDNS niezależnie od tych flag.

3. **Dodaj watchdog żywotności**, aby przyszła seria awarii zatrzymana przez launchd została szybko wykryta:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Celem jest zewnętrzne ponowne uzbrojenie bramki ponownego uruchamiania; samo `KeepAlive=true` nie wystarcza w macOS po serii awarii.

Powiązane:

- [Uwagi dotyczące platformy macOS](/pl/platforms/macos)
- [Logowanie](/pl/logging)
- [Doctor](/pl/gateway/doctor)

## Gateway kończy działanie podczas wysokiego użycia pamięci

Użyj tego, gdy Gateway znika pod obciążeniem, nadzorca zgłasza ponowne uruchomienie w stylu OOM albo logi wspominają `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Szukaj:

- `Reason: diagnostic.memory.pressure.critical` w najnowszym pakiecie stabilności.
- `Memory pressure:` z `critical/rss_threshold`, `critical/heap_threshold` lub `critical/rss_growth`.
- Wartości `V8 heap:` bliskich limitu sterty.
- Wpisów `Largest session files:`, takich jak `agents/<agent>/sessions/<session>.jsonl` lub `sessions/<session>.jsonl`.
- Liczników pamięci cgroup Linuksa, gdy gateway działa w kontenerze lub usłudze z limitem pamięci.

Typowe sygnatury:

- `critical memory pressure bundle written` pojawia się krótko przed ponownym uruchomieniem → OpenClaw przechwycił pakiet stabilności sprzed OOM. Sprawdź go poleceniem `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` pojawia się w logach gatewaya → OpenClaw wykrył krytyczną presję pamięci, ale migawka stabilności sprzed OOM jest wyłączona.
- `Largest session files:` wskazuje na bardzo dużą zredagowaną ścieżkę transkrypcji → ogranicz zachowywaną historię sesji, sprawdź wzrost sesji albo przenieś stare transkrypcje poza aktywny magazyn przed ponownym uruchomieniem.
- Użyte bajty `V8 heap:` są blisko limitu sterty → zmniejsz presję promptów/sesji, ogranicz współbieżną pracę albo zwiększ limit sterty Node dopiero po potwierdzeniu, że obciążenie jest oczekiwane.
- `Memory pressure: critical/rss_growth` → pamięć szybko wzrosła w jednym oknie próbkowania. Sprawdź najnowsze logi pod kątem dużego importu, niekontrolowanego wyjścia narzędzia, powtarzanych ponowień lub partii zakolejkowanej pracy agenta.
- Krytyczna presja pamięci pojawia się w logach, ale nie istnieje żaden pakiet → to ustawienie domyślne. Ustaw `diagnostics.memoryPressureSnapshot: true`, aby przy przyszłych krytycznych zdarzeniach presji pamięci przechwytywać pakiet stabilności sprzed OOM.

Pakiet stabilności nie zawiera payloadów. Obejmuje operacyjne dowody pamięci i zredagowane względne ścieżki plików, a nie tekst wiadomości, treści webhooków, poświadczenia, tokeny, cookies ani surowe identyfikatory sesji. Dołącz eksport diagnostyki do zgłoszeń błędów zamiast kopiować surowe logi.

Powiązane:

- [Kondycja Gateway](/pl/gateway/health)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Sesje](/pl/cli/sessions)

## Gateway odrzucił nieprawidłową konfigurację

Użyj tego, gdy uruchomienie Gateway kończy się błędem `Invalid config` albo logi hot reload mówią,
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
- OpenClaw zachowuje najnowsze 32 pliki `.clobbered.*` dla każdej ścieżki konfiguracji i rotuje starsze

<AccordionGroup>
  <Accordion title="Co się stało">
    - Konfiguracja nie przeszła walidacji podczas uruchamiania, hot reload lub zapisu należącego do OpenClaw.
    - Uruchamianie Gateway kończy się błędem zamiast przepisywać `openclaw.json`.
    - Hot reload pomija nieprawidłowe zewnętrzne edycje i utrzymuje aktywną bieżącą konfigurację runtime.
    - Zapisy należące do OpenClaw odrzucają nieprawidłowe/destrukcyjne payloady przed zatwierdzeniem i zapisują `.rejected.*`.
    - `openclaw doctor --fix` odpowiada za naprawę. Może usunąć prefiksy niebędące JSON albo przywrócić ostatnią znaną dobrą kopię, zachowując odrzucony payload jako `.clobbered.*`.
    - Gdy dla jednej ścieżki konfiguracji dochodzi do wielu napraw, OpenClaw rotuje starsze pliki `.clobbered.*`, aby najnowszy naprawiony payload nadal był dostępny.

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
    - `Config write rejected:` → zapis próbował usunąć wymagany kształt, gwałtownie zmniejszyć plik albo utrwalić nieprawidłową konfigurację.
    - `config reload skipped (invalid config):` → bezpośrednia edycja nie przeszła walidacji i została zignorowana przez działający Gateway.
    - `Invalid config at ...` → uruchomienie nie powiodło się, zanim usługi Gateway wystartowały.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` lub `size-drop-vs-last-good:*` → zapis należący do OpenClaw został odrzucony, ponieważ utracił pola lub rozmiar w porównaniu z ostatnią znaną dobrą kopią zapasową.
    - `Config last-known-good promotion skipped` → kandydat zawierał zredagowane placeholdery sekretów, takie jak `***`.

  </Accordion>
  <Accordion title="Opcje naprawy">
    1. Uruchom `openclaw doctor --fix`, aby doctor naprawił konfigurację z prefiksem/nadpisaną albo przywrócił ostatnią znaną dobrą.
    2. Skopiuj tylko zamierzone klucze z `.clobbered.*` lub `.rejected.*`, a następnie zastosuj je przez `openclaw config set` lub `config.patch`.
    3. Uruchom `openclaw config validate` przed ponownym uruchomieniem.
    4. Jeśli edytujesz ręcznie, zachowaj pełną konfigurację JSON5, a nie tylko częściowy obiekt, który chcesz zmienić.
  </Accordion>
</AccordionGroup>

Powiązane:

- [Konfiguracja](/pl/cli/config)
- [Konfiguracja: hot reload](/pl/gateway/configuration#config-hot-reload)
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

- `warnings[].code` i `primaryTargetId` w wyniku JSON.
- Czy ostrzeżenie dotyczy fallbacku SSH, wielu gatewayów, brakujących zakresów czy nierozwiązanych odwołań auth.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal próbowało bezpośrednich skonfigurowanych/celów loopback.
- `multiple reachable gateway identities detected` → odpowiedziały różne gatewaye albo OpenClaw nie mógł udowodnić, że osiągalne cele są tym samym gatewayem. Tunel SSH, URL proxy lub skonfigurowany zdalny URL do tego samego gatewaya jest traktowany jako jeden gateway z wieloma transportami, nawet gdy porty transportu się różnią.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie zadziałało, ale szczegółowe RPC jest ograniczone zakresem; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → połączenie zadziałało, ale pełny zestaw diagnostycznych RPC przekroczył limit czasu lub nie powiódł się. Traktuj to jako osiągalny Gateway z pogorszoną diagnostyką; porównaj `connect.ok` i `connect.rpcOk` w wyniku `--json`.
- `Capability: pairing-pending` lub `gateway closed (1008): pairing required` → gateway odpowiedział, ale ten klient nadal wymaga parowania/zatwierdzenia przed normalnym dostępem operatora.
- nierozwiązany tekst ostrzeżenia `gateway.auth.*` / `gateway.remote.*` SecretRef → materiał auth był niedostępny w tej ścieżce polecenia dla nieudanego celu.

Powiązane:

- [Gateway](/pl/cli/gateway)
- [Wiele gatewayów na tym samym hoście](/pl/gateway#multiple-gateways-same-host)
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

- Polityki DM (`pairing`, `allowlist`, `open`, `disabled`).
- Listy dozwolonych grup i wymagań dotyczących wzmianek.
- Brakujących uprawnień/zakresów API kanału.

Typowe sygnatury:

- `mention required` → wiadomość zignorowana przez politykę wzmianek w grupie.
- Ślady `pairing` / oczekującego zatwierdzenia → nadawca nie jest zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z auth/uprawnieniami kanału.

Powiązane:

- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Discord](/pl/channels/discord)
- [Telegram](/pl/channels/telegram)
- [WhatsApp](/pl/channels/whatsapp)

## Dostarczanie Cron i Heartbeat

Jeśli cron lub heartbeat nie uruchomił się albo nie dostarczył wiadomości, najpierw zweryfikuj stan harmonogramu, a potem cel dostarczania.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Sprawdź:

- Cron jest włączony i obecny jest następny czas wybudzenia.
- Status historii uruchomień zadań (`ok`, `skipped`, `error`).
- Powody pominięcia Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `cron: scheduler disabled; jobs will not run automatically` → cron wyłączony.
    - `cron: timer tick failed` → takt harmonogramu nie powiódł się; sprawdź błędy plików, logów lub runtime.
    - `heartbeat skipped` z `reason=quiet-hours` → poza oknem aktywnych godzin.
    - `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste miejsce, komentarz, nagłówek, blok kodu lub pusty szkielet listy kontrolnej, więc OpenClaw pomija wywołanie modelu.
    - `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne zadania nie są należne w tym takcie.
    - `heartbeat: unknown accountId` → nieprawidłowy identyfikator konta dla celu dostarczania Heartbeat.
    - `heartbeat skipped` z `reason=dm-blocked` → cel Heartbeat został rozpoznany jako miejsce docelowe typu DM, gdy `agents.defaults.heartbeat.directPolicy` (lub nadpisanie per-agent) ma wartość `block`.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Heartbeat](/pl/gateway/heartbeat)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
- [Zaplanowane zadania: rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting)

## Node sparowany, narzędzie zawodzi

Jeśli node jest sparowany, ale narzędzia zawodzą, odizoluj stan pierwszego planu, uprawnień i zatwierdzeń.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Sprawdź:

- Node jest online z oczekiwanymi możliwościami.
- Nadania uprawnień systemu operacyjnego do kamery, mikrofonu, lokalizacji i ekranu.
- Stan zatwierdzeń exec i listy dozwolonych.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja node musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brakuje uprawnienia systemu operacyjnego.
- `SYSTEM_RUN_DENIED: approval required` → oczekuje zatwierdzenie exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez listę dozwolonych.

Powiązane:

- [Zatwierdzenia exec](/pl/tools/exec-approvals)
- [Rozwiązywanie problemów z Node](/pl/nodes/troubleshooting)
- [Nodes](/pl/nodes/index)

## Narzędzie przeglądarki zawodzi

Użyj tego, gdy akcje narzędzia przeglądarki zawodzą, mimo że sam Gateway jest zdrowy.

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
  <Accordion title="Sygnatury Plugin / pliku wykonywalnego">
    - `unknown command "browser"` lub `unknown command 'browser'` → dołączony Plugin przeglądarki jest wykluczony przez `plugins.allow`.
    - brakujące / niedostępne narzędzie przeglądarki przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc Plugin nigdy się nie załadował.
    - `Failed to start Chrome CDP on port` → nie udało się uruchomić procesu przeglądarki.
    - `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
    - `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` lub `ftp:`.
    - `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma nieprawidłowy lub spoza zakresu port.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja Gateway nie ma podstawowej zależności runtime przeglądarki; zainstaluj ponownie lub zaktualizuj OpenClaw, a następnie uruchom ponownie Gateway. Zrzuty ARIA i podstawowe zrzuty ekranu stron nadal mogą działać, ale nawigacja, zrzuty AI, zrzuty ekranu elementów z selektorem CSS i eksport PDF pozostają niedostępne.

  </Accordion>
  <Accordion title="Sygnatury Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session nie mógł jeszcze dołączyć do wybranego katalogu danych przeglądarki. Otwórz stronę inspekcji przeglądarki, włącz zdalne debugowanie, zostaw przeglądarkę otwartą, zatwierdź pierwszy monit o dołączenie, a potem spróbuj ponownie. Jeśli stan zalogowania nie jest wymagany, preferuj zarządzany profil `openclaw`.
    - `No Chrome tabs found for profile="user"` → profil dołączania Chrome MCP nie ma otwartych lokalnych kart Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny punkt końcowy CDP nie jest osiągalny z hosta Gateway.
    - `Browser attachOnly is enabled ... not reachable` lub `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko do dołączania nie ma osiągalnego celu albo punkt końcowy HTTP odpowiedział, ale WebSocket CDP nadal nie mógł zostać otwarty.

  </Accordion>
  <Accordion title="Sygnatury elementu / zrzutu ekranu / przesyłania">
    - `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu połączyło `--full-page` z `--ref` lub `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwytywania strony lub `--ref` ze zrzutu, a nie CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → haki przesyłania Chrome MCP wymagają referencji ze zrzutu, a nie selektorów CSS.
    - `existing-session file uploads currently support one file at a time.` → wysyłaj jedno przesłanie na wywołanie w profilach Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → haki okien dialogowych w profilach Chrome MCP nie obsługują nadpisań limitu czasu.
    - `existing-session type does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:type` w profilach `profile="user"` / Chrome MCP existing-session albo użyj zarządzanego profilu przeglądarki/CDP, gdy wymagany jest niestandardowy limit czasu.
    - `existing-session evaluate does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:evaluate` w profilach `profile="user"` / Chrome MCP existing-session albo użyj zarządzanego profilu przeglądarki/CDP, gdy wymagany jest niestandardowy limit czasu.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki lub surowego profilu CDP.
    - nieaktualne nadpisania viewportu / trybu ciemnego / ustawień regionalnych / trybu offline w profilach attach-only lub zdalnych CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez ponownego uruchamiania całego Gateway.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Przeglądarka (zarządzana przez OpenClaw)](/pl/tools/browser)
- [Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting)

## Jeśli po aktualizacji coś nagle przestało działać

Większość awarii po aktualizacji to dryf konfiguracji albo egzekwowanie bardziej rygorystycznych wartości domyślnych.

<AccordionGroup>
  <Accordion title="1. Zmieniło się zachowanie uwierzytelniania i nadpisania URL">
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

    - `gateway connect failed:` → nieprawidłowy docelowy URL.
    - `unauthorized` → punkt końcowy osiągalny, ale uwierzytelnianie nieprawidłowe.

  </Accordion>
  <Accordion title="2. Zabezpieczenia bind i auth są bardziej rygorystyczne">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Co sprawdzić:

    - Powiązania inne niż local loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki auth Gateway: uwierzytelniania tokenem współdzielonym/hasłem albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` bez local loopback.
    - Stare klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

    Typowe sygnatury:

    - `refusing to bind gateway ... without auth` → powiązanie inne niż local loopback bez prawidłowej ścieżki auth Gateway.
    - `Connectivity probe: failed`, gdy runtime działa → Gateway żyje, ale jest niedostępny przy bieżącym auth/url.

  </Accordion>
  <Accordion title="3. Zmienił się stan parowania i tożsamości urządzenia">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Co sprawdzić:

    - Oczekujące zatwierdzenia urządzeń dla dashboard/nodes.
    - Oczekujące zatwierdzenia parowania DM po zmianach zasad lub tożsamości.

    Typowe sygnatury:

    - `device identity required` → auth urządzenia nie jest spełnione.
    - `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

  </Accordion>
</AccordionGroup>

Jeśli konfiguracja usługi i runtime nadal się nie zgadzają po sprawdzeniach, zainstaluj ponownie metadane usługi z tego samego katalogu profilu/stanu:

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
