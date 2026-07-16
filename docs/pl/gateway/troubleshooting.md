---
read_when:
    - Centrum rozwiązywania problemów skierowało tutaj w celu przeprowadzenia dokładniejszej diagnostyki
    - Potrzebne są stabilne sekcje podręcznika operacyjnego oparte na objawach, zawierające dokładne polecenia
sidebarTitle: Troubleshooting
summary: Szczegółowy podręcznik rozwiązywania problemów z Gateway, kanałami, automatyzacją, węzłami i przeglądarką
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-07-16T18:39:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

To jest szczegółowy podręcznik operacyjny. Najpierw zacznij od [/help/troubleshooting](/pl/help/troubleshooting), aby przeprowadzić szybką diagnostykę.

## Sekwencja poleceń

Uruchom w następującej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sygnały prawidłowego działania:

- `openclaw gateway status` pokazuje `Runtime: running`, `Connectivity probe: ok` oraz wiersz `Capability: ...`.
- `openclaw doctor` nie zgłasza żadnych blokujących problemów z konfiguracją ani usługą.
- `openclaw channels status --probe` pokazuje bieżący stan transportu dla poszczególnych kont oraz, jeśli jest to obsługiwane, `works` lub `audit ok`.

## Po aktualizacji

Użyj, gdy aktualizacja została ukończona, ale Gateway nie działa, kanały są puste lub wywołania modeli kończą się błędami 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Sprawdź:

- `Update restart` w `openclaw status` / `openclaw status --all`. Oczekujące lub nieudane przekazania zawierają następne polecenie do uruchomienia.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` w sekcji Kanały: konfiguracja kanału nadal istnieje, ale rejestracja pluginu nie powiodła się przed załadowaniem kanału.
- Błędy 401 dostawcy po ponownym uwierzytelnieniu: `openclaw doctor --fix` sprawdza nieaktualne kopie uwierzytelniania OAuth poszczególnych agentów i usuwa stare kopie, aby wszyscy agenci korzystali z bieżącego profilu współdzielonego.

## Rozbieżne instalacje i zabezpieczenie przed nowszą konfiguracją

Użyj, gdy usługa Gateway nieoczekiwanie zatrzymuje się po aktualizacji lub dzienniki wskazują, że jeden plik binarny `openclaw` jest starszy niż wersja, która ostatnio zapisała `openclaw.json`.

OpenClaw oznacza zapisy konfiguracji za pomocą `meta.lastTouchedVersion`. Polecenia tylko do odczytu mogą sprawdzać konfigurację zapisaną przez nowszą wersję OpenClaw, ale operacje modyfikujące procesy i usługi nie mogą być wykonywane przez starszy plik binarny. Zablokowane działania: uruchamianie, zatrzymywanie, ponowne uruchamianie i odinstalowywanie usługi Gateway, wymuszona ponowna instalacja usługi, uruchamianie Gateway w trybie usługi oraz czyszczenie portu `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Napraw PATH">
    Popraw `PATH`, aby `openclaw` wskazywało nowszą instalację, a następnie ponownie wykonaj działanie.
  </Step>
  <Step title="Ponownie zainstaluj usługę Gateway">
    Ponownie zainstaluj właściwą usługę Gateway z nowszej instalacji:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Usuń nieaktualne skrypty opakowujące">
    Usuń nieaktualne wpisy pakietu systemowego lub starego skryptu opakowującego, które nadal wskazują stary plik binarny `openclaw`.
  </Step>
</Steps>

<Warning>
Wyłącznie na potrzeby zamierzonego obniżenia wersji lub awaryjnego odzyskiwania ustaw `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` dla pojedynczego polecenia. Podczas normalnego działania pozostaw tę wartość nieustawioną.
</Warning>

## Niezgodność protokołu po wycofaniu wersji

Użyj, gdy po obniżeniu lub wycofaniu wersji dzienniki nadal wyświetlają `protocol mismatch`. Działa starszy Gateway, ale nowszy lokalny proces klienta nadal ponownie się łączy, używając zakresu protokołu, którego starszy Gateway nie obsługuje.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Sprawdź:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` w dziennikach Gateway.
- `Established clients:` w `openclaw gateway status --deep` lub `Gateway clients` w `openclaw doctor --deep`: aktywni klienci TCP połączeni z portem Gateway, wraz z identyfikatorami PID i wierszami poleceń, jeśli system operacyjny na to pozwala.
- Proces klienta, którego wiersz polecenia wskazuje nowszą instalację OpenClaw lub skrypt opakowujący sprzed wycofania wersji.

Rozwiązanie:

1. Zatrzymaj lub ponownie uruchom nieaktualny proces klienta OpenClaw wskazany przez `gateway status --deep`.
2. Ponownie uruchom aplikacje lub skrypty opakowujące zawierające OpenClaw: lokalne pulpity, edytory, narzędzia pomocnicze serwera aplikacji lub długotrwale działające powłoki `openclaw logs --follow`.
3. Ponownie uruchom `openclaw gateway status --deep` lub `openclaw doctor --deep` i potwierdź, że identyfikator PID nieaktualnego klienta zniknął.

Nie konfiguruj starszego Gateway tak, aby akceptował nowszy, niezgodny protokół. Zmiany wersji protokołu chronią kontrakt komunikacyjny; odzyskiwanie po wycofaniu wersji wymaga uporządkowania procesów i wersji.

## Pominięto dowiązanie symboliczne umiejętności jako wyjście poza ścieżkę

Użyj, gdy dzienniki zawierają:

```text
Pomijanie ścieżki umiejętności wychodzącej poza skonfigurowany katalog główny: ... reason=symlink-escape
```

Każdy katalog główny umiejętności stanowi granicę zawierania. Dowiązanie symboliczne w `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` lub `~/.openclaw/skills` jest pomijane, gdy jego rzeczywisty cel znajduje się poza tym katalogiem głównym, chyba że cel został jawnie oznaczony jako zaufany.

Sprawdź dowiązanie:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Jeśli cel jest zamierzony, skonfiguruj zarówno bezpośredni katalog główny umiejętności, jak i dozwolony cel dowiązania symbolicznego:

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

Następnie rozpocznij nową sesję lub zaczekaj na odświeżenie przez mechanizm monitorujący umiejętności. Uruchom Gateway ponownie, jeśli działający proces został uruchomiony przed zmianą konfiguracji.

Nie używaj szerokich celów, takich jak `~`, `/` ani cały synchronizowany folder projektu. Ogranicz `allowSymlinkTargets` do rzeczywistego katalogu głównego umiejętności zawierającego zaufane katalogi `SKILL.md`.

Jeśli zastosowanie zmian z warsztatu umiejętności ma również zapisywać dane za pośrednictwem tych zaufanych, dowiązanych symbolicznie ścieżek umiejętności obszaru roboczego, włącz `skills.workshop.allowSymlinkTargetWrites`. Pozostaw tę opcję wyłączoną dla współdzielonych katalogów głównych umiejętności przeznaczonych tylko do odczytu.

Powiązane:

- [Konfiguracja Skills](/pl/tools/skills-config#symlinked-skill-roots)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Błąd Anthropic 429 wymagający dodatkowego użycia dla długiego kontekstu

Użyj, gdy dzienniki lub błędy zawierają: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Sprawdź:

- Wybrany model Anthropic to model Claude 4.x w ogólnej dostępności, obsługujący kontekst 1M (Opus 4.6/4.7/4.8, Sonnet 4.6), albo konfiguracja modelu nadal zawiera starsze `params.context1m: true`.
- Bieżące dane uwierzytelniające Anthropic nie uprawniają do używania długiego kontekstu.
- Żądania kończą się niepowodzeniem tylko podczas długich sesji lub uruchomień modeli wymagających ścieżki kontekstu 1M.

Możliwe rozwiązania:

<Steps>
  <Step title="Użyj standardowego okna kontekstu">
    Przełącz się na model ze standardowym oknem albo usuń starsze `context1m` ze starszej
    konfiguracji modelu, który nie obsługuje kontekstu 1M w ramach ogólnej dostępności.
  </Step>
  <Step title="Użyj odpowiednich danych uwierzytelniających">
    Użyj danych uwierzytelniających Anthropic uprawniających do żądań z długim kontekstem albo przełącz się na klucz API Anthropic.
  </Step>
  <Step title="Skonfiguruj modele zapasowe">
    Skonfiguruj modele zapasowe, aby uruchomienia były kontynuowane po odrzuceniu przez Anthropic żądań z długim kontekstem.
  </Step>
</Steps>

Powiązane:

- [Anthropic](/pl/providers/anthropic)
- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Dlaczego widzę błąd HTTP 429 od Anthropic?](/pl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Odpowiedzi 403 blokowane przez usługę nadrzędną

Użyj, gdy nadrzędny dostawca LLM zwraca ogólny błąd `403`, taki jak `Your request was blocked`.

Nie zakładaj, że zawsze jest to problem z konfiguracją OpenClaw. Odpowiedź może pochodzić z nadrzędnej warstwy zabezpieczeń, takiej jak CDN, WAF, reguła zarządzania botami lub odwrotne proxy przed punktem końcowym zgodnym z OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Sprawdź:

- Wiele modeli tego samego dostawcy kończy się niepowodzeniem w taki sam sposób.
- Tekst HTML lub ogólny komunikat zabezpieczeń zamiast zwykłego błędu API dostawcy.
- Zdarzenia zabezpieczeń po stronie dostawcy z czasu tego samego żądania.
- Powodzenie niewielkiego bezpośredniego testu `curl`, podczas gdy zwykłe żądania o strukturze SDK kończą się niepowodzeniem.

Jeśli dowody wskazują na blokadę WAF/CDN, najpierw popraw filtrowanie po stronie dostawcy. Preferuj precyzyjnie ograniczoną regułę zezwalającą lub pomijającą dla ścieżki API używanej przez OpenClaw i unikaj wyłączania ochrony całej witryny.

<Warning>
Powodzenie minimalnego `curl` nie gwarantuje, że rzeczywiste żądania w stylu SDK przejdą przez tę samą nadrzędną warstwę zabezpieczeń.
</Warning>

Powiązane:

- [Punkty końcowe zgodne z OpenAI](/pl/gateway/configuration-reference#openai-compatible-endpoints)
- [Konfiguracja dostawcy](/pl/providers)
- [Dzienniki](/pl/logging)

## Lokalny backend zgodny z OpenAI przechodzi testy bezpośrednie, ale uruchomienia agenta kończą się niepowodzeniem

Użyj, gdy:

- `curl ... /v1/models` działa.
- Niewielkie bezpośrednie wywołania `/v1/chat/completions` działają.
- Uruchomienia modeli OpenClaw kończą się niepowodzeniem tylko podczas zwykłych tur agenta.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Sprawdź:

- Niewielkie wywołania bezpośrednie kończą się powodzeniem, ale uruchomienia OpenClaw zawodzą tylko przy większych promptach.
- Błędy `model_not_found` lub 404, mimo że bezpośrednie `/v1/chat/completions` działa z tym samym identyfikatorem modelu bez prefiksu.
- Błędy backendu informujące, że `messages[].content` oczekuje ciągu znaków.
- Sporadyczne ostrzeżenia `incomplete turn detected ... stopReason=stop payloads=0` z lokalnym backendem zgodnym z OpenAI.
- Awarie backendu występujące tylko przy większej liczbie tokenów promptu lub pełnych promptach środowiska wykonawczego agenta.

<AccordionGroup>
  <Accordion title="Typowe objawy">
    - `model_not_found` z lokalnym serwerem w stylu MLX/vLLM: sprawdź, czy `baseUrl` zawiera `/v1`, `api` ma wartość `"openai-completions"` dla backendów `/v1/chat/completions`, a `models.providers.<provider>.models[].id` jest lokalnym identyfikatorem dostawcy bez prefiksu. Wybierz go jednorazowo z prefiksem dostawcy, na przykład `mlx/mlx-community/Qwen3-30B-A3B-6bit`; pozostaw wpis katalogu jako `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string`: backend odrzuca ustrukturyzowane części zawartości Chat Completions. Rozwiązanie: ustaw `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` lub dozwolone klucze wiadomości, takie jak `["role","content"]`: backend odrzuca metadane odtwarzania w stylu OpenAI w wiadomościach Chat Completions. Rozwiązanie: ustaw `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0`: backend ukończył żądanie Chat Completions, ale w tej turze nie zwrócił tekstu asystenta widocznego dla użytkownika. OpenClaw jednokrotnie ponawia bezpieczne do odtworzenia, puste tury zgodne z OpenAI; utrzymujące się błędy zwykle oznaczają, że backend emituje pustą lub nietekstową zawartość albo pomija tekst końcowej odpowiedzi.
    - Niewielkie żądania bezpośrednie kończą się powodzeniem, ale uruchomienia agenta OpenClaw kończą się awariami backendu lub modelu (na przykład Gemma w niektórych kompilacjach `inferrs`): transport OpenClaw prawdopodobnie jest już poprawny; backend nie radzi sobie z większą strukturą promptu środowiska wykonawczego agenta.
    - Po wyłączeniu narzędzi liczba błędów maleje, ale nie znikają one całkowicie: schematy narzędzi były częścią obciążenia, lecz pozostałym problemem nadal jest wydajność nadrzędnego modelu lub serwera albo błąd backendu.

  </Accordion>
  <Accordion title="Możliwe rozwiązania">
    1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions obsługujących wyłącznie ciągi znaków.
    2. Ustaw `compat.strictMessageKeys: true` dla rygorystycznych backendów Chat Completions, które w każdej wiadomości akceptują wyłącznie `role` i `content`.
    3. Ustaw `compat.supportsTools: false` dla modeli lub backendów, które nie są w stanie niezawodnie obsługiwać zestawu schematów narzędzi OpenClaw.
    4. W miarę możliwości zmniejsz obciążenie promptu: mniejsza inicjalizacja obszaru roboczego, krótsza historia sesji, lżejszy model lokalny lub backend z lepszą obsługą długiego kontekstu.
    5. Jeśli niewielkie żądania bezpośrednie nadal działają, ale tury agenta OpenClaw wciąż powodują awarię backendu, potraktuj to jako ograniczenie nadrzędnego serwera lub modelu i zgłoś tam przypadek reprodukcyjny z akceptowaną strukturą ładunku.
  </Accordion>
</AccordionGroup>

Powiązane:

- [Konfiguracja](/pl/gateway/configuration)
- [Modele lokalne](/pl/gateway/local-models)
- [Punkty końcowe zgodne z OpenAI](/pl/gateway/configuration-reference#openai-compatible-endpoints)

## Brak odpowiedzi

Jeśli kanały działają, ale nic nie odpowiada, przed ponownym łączeniem czegokolwiek należy sprawdzić routing i zasady.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Należy sprawdzić:

- Oczekujące parowanie nadawców wiadomości bezpośrednich.
- Ograniczenie odpowiedzi w grupie do wzmianek (`requireMention`, `mentionPatterns`).
- Niezgodności list dozwolonych kanałów/grup.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa jest ignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez zasady.

Powiązane:

- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Grupy](/pl/channels/groups)
- [Parowanie](/pl/channels/pairing)

## Łączność interfejsu sterowania panelu

Jeśli panel/interfejs sterowania nie może się połączyć, należy zweryfikować adres URL, tryb uwierzytelniania i założenia dotyczące bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Należy sprawdzić:

- Poprawny adres URL sondy i adres URL panelu.
- Niezgodność trybu uwierzytelniania/tokena między klientem a gatewayem.
- Użycie protokołu HTTP tam, gdzie wymagana jest tożsamość urządzenia.

Jeśli po aktualizacji lokalna przeglądarka nie może połączyć się z `127.0.0.1:18789`, najpierw należy przywrócić lokalną usługę Gateway i potwierdzić, że udostępnia panel:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Jeśli `curl` zwraca kod HTML OpenClaw, Gateway działa, a pozostały problem prawdopodobnie dotyczy pamięci podręcznej przeglądarki, starego łącza bezpośredniego lub nieaktualnego stanu karty. Należy otworzyć bezpośrednio `http://127.0.0.1:18789` i przejść dalej z panelu. Jeśli po ponownym uruchomieniu usługa nie pozostaje uruchomiona, należy wykonać `openclaw gateway start` i ponownie sprawdzić `openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Sygnatury połączenia / uwierzytelniania">
    - `device identity required` → niezabezpieczony kontekst lub brak uwierzytelniania urządzenia.
    - `origin not allowed` → `Origin` przeglądarki nie znajduje się w `gateway.controlUi.allowedOrigins` (lub połączenie pochodzi z przeglądarki o źródle innym niż loopback bez jawnej listy dozwolonych).
    - `device nonce required` / `device nonce mismatch` → klient nie kończy przepływu uwierzytelniania urządzenia opartego na wyzwaniu (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → klient podpisał nieprawidłowy ładunek (lub użył nieaktualnego znacznika czasu) dla bieżącego uzgadniania.
    - `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną ponowną próbę z użyciem tokena urządzenia z pamięci podręcznej.
    - Ta ponowna próba z tokenem z pamięci podręcznej wykorzystuje ponownie zestaw zakresów zapisany wraz z tokenem sparowanego urządzenia. Wywołujący jawnie używający `deviceToken` / `scopes` zachowują zamiast tego żądany zestaw zakresów.
    - `AUTH_SCOPE_MISMATCH` → token urządzenia został rozpoznany, ale jego zatwierdzone zakresy nie obejmują tego żądania połączenia; zamiast zmieniać współdzielony token gatewaya, należy ponownie sparować urządzenie lub zatwierdzić żądany kontrakt zakresów.
    - Poza tą ścieżką ponownej próby kolejność pierwszeństwa uwierzytelniania połączenia jest następująca: najpierw jawny współdzielony token/hasło, następnie jawne `deviceToken`, potem zapisany token urządzenia, a na końcu token rozruchowy.
    - W asynchronicznej ścieżce interfejsu sterowania Tailscale Serve nieudane próby dla tego samego `{scope, ip}` są serializowane, zanim ogranicznik zarejestruje niepowodzenie. Dlatego dwie równoczesne nieudane ponowne próby tego samego klienta mogą przy drugiej próbie zwrócić `retry later` zamiast dwóch zwykłych niezgodności.
    - `too many failed authentication attempts (retry later)` od klienta loopback pochodzącego z przeglądarki → powtarzające się niepowodzenia z tego samego znormalizowanego `Origin` są tymczasowo blokowane; inne źródło localhost używa osobnego zasobnika.
    - Powtarzające się `unauthorized` po tej ponownej próbie → rozbieżność współdzielonego tokena/tokena urządzenia; należy odświeżyć konfigurację tokena i w razie potrzeby ponownie zatwierdzić lub zmienić token urządzenia.
    - `gateway connect failed:` → nieprawidłowy host/port/docelowy adres URL.

  </Accordion>
</AccordionGroup>

### Skrócona mapa kodów szczegółów uwierzytelniania

Aby wybrać następną czynność, należy użyć `error.details.code` z nieudanej odpowiedzi `connect`:

| Kod szczegółów               | Znaczenie                                                                                                                                                                                    | Zalecane działanie                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klient nie wysłał wymaganego współdzielonego tokena.                                                                                                                                         | Wkleić/ustawić token w kliencie i ponowić próbę. W przypadku ścieżek panelu: `openclaw config get gateway.auth.token`, a następnie wkleić go w ustawieniach interfejsu sterowania.                                                                                                          |
| `AUTH_TOKEN_MISMATCH`        | Współdzielony token nie odpowiadał tokenowi uwierzytelniania gatewaya.                                                                                                                        | Jeśli `canRetryWithDeviceToken=true`, zezwolić na jedną zaufaną ponowną próbę. Ponowne próby z tokenem z pamięci podręcznej używają zapisanych zatwierdzonych zakresów; wywołujący jawnie używający `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli problem nadal występuje, wykonać [listę kontrolną odzyskiwania po rozbieżności tokenów](/pl/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token przypisany do urządzenia, przechowywany w pamięci podręcznej, jest nieaktualny lub został unieważniony.                                                                                  | Zmienić/ponownie zatwierdzić token urządzenia za pomocą [CLI urządzeń](/pl/cli/devices), a następnie połączyć się ponownie.                                                                                                                                                                  |
| `AUTH_SCOPE_MISMATCH`        | Token urządzenia jest prawidłowy, ale jego zatwierdzona rola/zakresy nie obejmują tego żądania połączenia.                                                                                     | Ponownie sparować urządzenie lub zatwierdzić żądany kontrakt zakresów; nie traktować tego jako rozbieżności współdzielonego tokena.                                                                                                                                                       |
| `PAIRING_REQUIRED`           | Tożsamość urządzenia wymaga zatwierdzenia. Sprawdzić `error.details.reason` pod kątem `not-paired`, `scope-upgrade`, `role-upgrade` lub `metadata-upgrade` oraz użyć `requestId` / `remediationHint`, jeśli są dostępne. | Zatwierdzić oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`. Uaktualnienia zakresu/roli korzystają z tego samego przepływu po sprawdzeniu żądanego dostępu.                                                                                  |

<Note>
Bezpośrednie wywołania RPC zaplecza przez loopback, uwierzytelnione przy użyciu współdzielonego tokena/hasła gatewaya, nie powinny zależeć od bazowego zestawu zakresów sparowanego urządzenia w CLI. Jeśli subagenci lub inne wywołania wewnętrzne nadal kończą się niepowodzeniem z `scope-upgrade`, należy sprawdzić, czy wywołujący używa `client.id: "gateway-client"` i `client.mode: "backend"` oraz nie wymusza jawnego `deviceIdentity` ani tokena urządzenia.
</Note>

Kontrola migracji uwierzytelniania urządzeń v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jeśli dzienniki zawierają błędy wartości jednorazowej/podpisu, należy zaktualizować łączącego się klienta i zweryfikować go:

<Steps>
  <Step title="Oczekiwanie na connect.challenge">
    Klient oczekuje na wydane przez gateway `connect.challenge`.
  </Step>
  <Step title="Podpisanie ładunku">
    Klient podpisuje ładunek powiązany z wyzwaniem.
  </Step>
  <Step title="Wysłanie wartości jednorazowej urządzenia">
    Klient wysyła `connect.params.device.nonce` z tą samą wartością jednorazową wyzwania.
  </Step>
</Steps>

Jeśli `openclaw devices rotate` / `revoke` / `remove` zostanie nieoczekiwanie odrzucone:

- Sesje z tokenem sparowanego urządzenia mogą zarządzać tylko **własnym** urządzeniem, chyba że wywołujący ma również `operator.admin`.
- `openclaw devices rotate --scope ...` może żądać tylko tych zakresów operatora, które już posiada sesja wywołującego.

Powiązane:

- [Konfiguracja](/pl/gateway/configuration) (tryby uwierzytelniania gatewaya)
- [Interfejs sterowania](/pl/web/control-ui)
- [Urządzenia](/pl/cli/devices)
- [Dostęp zdalny](/pl/gateway/remote)
- [Uwierzytelnianie zaufanego serwera proxy](/pl/gateway/trusted-proxy-auth)

## Usługa Gateway nie jest uruchomiona

Należy użyć, gdy usługa jest zainstalowana, ale proces nie pozostaje uruchomiony.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # skanuje również usługi na poziomie systemu
```

Należy sprawdzić:

- `Runtime: stopped` ze wskazówkami dotyczącymi zakończenia.
- Niezgodność konfiguracji usługi (`Config (cli)` a `Config (service)`).
- Konflikty portów/procesów nasłuchujących.
- Dodatkowe instalacje launchd/systemd/schtasks w przypadku użycia `--deep`.
- Wskazówki dotyczące czyszczenia `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → lokalny tryb gatewaya nie jest włączony albo plik konfiguracyjny został nadpisany i utracił `gateway.mode`. Rozwiązanie: ustawić `gateway.mode="local"` w konfiguracji albo ponownie wykonać `openclaw onboard --mode local` / `openclaw setup`, aby ponownie zapisać oczekiwaną konfigurację trybu lokalnego. Jeśli OpenClaw działa za pośrednictwem Podman, domyślna ścieżka konfiguracji to `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → powiązanie inne niż loopback bez prawidłowej ścieżki uwierzytelniania gatewaya (token/hasło lub skonfigurowany zaufany serwer proxy).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflikt portów.
    - `Other gateway-like services detected (best effort)` → istnieją nieaktualne lub równoległe jednostki launchd/systemd/schtasks. W większości konfiguracji powinien działać jeden gateway na komputer; jeśli potrzebny jest więcej niż jeden, należy odizolować porty oraz konfigurację/stan/obszar roboczy. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` z doctora → istnieje jednostka systemowa systemd, podczas gdy brakuje usługi na poziomie użytkownika. Przed zezwoleniem doctorowi na zainstalowanie usługi użytkownika należy usunąć lub wyłączyć duplikat albo ustawić `OPENCLAW_SERVICE_REPAIR_POLICY=external`, jeśli jednostka systemowa ma być zamierzonym nadzorcą.
    - `Gateway service port does not match current gateway config` → zainstalowany nadzorca nadal wskazuje stary `--port`. Należy wykonać `openclaw doctor --fix` lub `openclaw gateway install --force`, a następnie ponownie uruchomić usługę gatewaya.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Wykonywanie w tle i narzędzie procesów](/pl/gateway/background-process)
- [Konfiguracja](/pl/gateway/configuration)
- [Doctor](/pl/gateway/doctor)

## Gateway w systemie macOS po cichu przestaje odpowiadać, a następnie wznawia działanie po użyciu panelu

Użyj tego rozwiązania, gdy kanały (Telegram, WhatsApp itp.) na hoście macOS przestają odpowiadać na okres od kilku minut do kilku godzin, a Gateway zdaje się wracać do działania w chwili otwarcia interfejsu Control UI, połączenia przez SSH lub innej interakcji z hostem. Zwykle nie ma żadnego oczywistego objawu w `openclaw status`, ponieważ zanim zostanie to sprawdzone, Gateway znów działa.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Należy szukać:

- Co najmniej jednego pakietu `*-uncaught_exception.json` w `~/.openclaw/logs/stability/`, w którym `error.code` ustawiono na przejściowy kod sieciowy, taki jak `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` lub `ECONNREFUSED`.
- Wierszy `pmset -g log`, takich jak `Entering Sleep state due to 'Maintenance Sleep'` lub `en0 driver is slow (msg: WillChangeState to 0)`, zbieżnych czasowo ze znacznikami awarii. Power Nap / Maintenance Sleep na krótko przełącza sterownik Wi-Fi w stan 0; każde wychodzące `connect()`, które trafi w to okno, może zakończyć się błędem `ENETDOWN` nawet na hoście, który poza tym ma pełną łączność sieciową.
- Danych wyjściowych `launchctl print` wskazujących `state = not running` z wieloma niedawnymi `runs` i kodem wyjścia, szczególnie gdy przerwa między awarią a następnym uruchomieniem wynosi około godziny, a nie kilka sekund. Po serii awarii launchd w systemie macOS stosuje nieudokumentowaną blokadę ochronną ponownego uruchamiania, przez którą może przestać respektować `KeepAlive=true`, dopóki zewnętrzny wyzwalacz, taki jak interaktywne logowanie, połączenie z panelem lub `launchctl kickstart`, nie uzbroi jej ponownie.

Typowe oznaki:

- Pakiet stabilności, którego `error.code` to `ENETDOWN` lub pokrewny kod, a stos wywołań wskazuje na `net` `lookupAndConnect` / `Socket.connect` środowiska Node. OpenClaw `2026.5.26` i nowsze wersje klasyfikują je jako niegroźne, przejściowe błędy sieciowe, dzięki czemu nie są już przekazywane do najwyższego poziomu obsługi nieprzechwyconych błędów; w przypadku starszej wersji należy najpierw przeprowadzić aktualizację.
- Długie okresy braku aktywności, które kończą się natychmiast po połączeniu z interfejsem Control UI lub hostem przez SSH: to aktywność widoczna dla użytkownika ponownie uzbraja blokadę ponownego uruchamiania launchd, a nie jakiekolwiek działanie panelu wobec Gateway.
- Licznik `runs` zwiększający się w ciągu dnia bez odpowiadającego mu wiersza `received SIG*; shutting down` w `~/Library/Logs/openclaw/gateway.log`: prawidłowe zamknięcia zapisują sygnał w dzienniku, natomiast przejściowe awarie tego nie robią.

Co zrobić:

1. **Zaktualizuj Gateway**, jeśli używana wersja jest starsza niż `2026.5.26`. Po aktualizacji przyszłe błędy `ENETDOWN` będą rejestrowane jako ostrzeżenia zamiast kończyć proces.
2. **Ogranicz aktywność uśpienia konserwacyjnego** na hostach Mac mini / komputerach stacjonarnych przeznaczonych do pracy jako stale dostępne serwery:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Znacznie ogranicza to podstawowy problem z krótkotrwałym zanikiem działania sterownika, ale nie eliminuje go całkowicie. Niezależnie od tych flag system nadal może przeprowadzać niektóre uśpienia konserwacyjne na potrzeby podtrzymywania połączeń TCP i obsługi mDNS.

3. **Dodaj mechanizm nadzoru żywotności**, aby przyszła seria awarii zatrzymana przez launchd została szybko wykryta:

   ```bash
   # Przykładowe sprawdzenie żywotności uwzględniające launchd, odpowiednie dla Cron lub LaunchAgent uruchamianego co 5 minut
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Celem jest zewnętrzne ponowne uzbrojenie blokady ponownego uruchamiania; samo `KeepAlive=true` nie wystarcza w systemie macOS po serii awarii.

Powiązane:

- [Uwagi dotyczące platformy macOS](/pl/platforms/macos)
- [Rejestrowanie](/pl/logging)
- [Doctor](/pl/gateway/doctor)

## Pętla nadzorcy launchd w systemie macOS z powielonymi agentami LaunchAgent Gateway/Node

Użyj tego rozwiązania, gdy instalacja w systemie macOS uruchamia się ponownie co kilka sekund, testy kondycji `openclaw`
naprzemiennie wskazują dostępność i niedostępność, a wysyłanie przez kanały zatrzymuje się,
mimo że usługa wydaje się działać.

Zaobserwowano to w starszych instalacjach, w których jednocześnie aktywne były agenty LaunchAgent `ai.openclaw.gateway` i
`ai.openclaw.node`, a każdy z nich wstrzykiwał
`OPENCLAW_LAUNCHD_LABEL`. W takim stanie OpenClaw może wykryć nadzór launchd,
spróbować przekazać ponowne uruchomienie z powrotem do launchd i wpaść w szybką
pętlę `EADDRINUSE`/ponownego uruchamiania zamiast utrzymywać jeden stabilny proces Gateway.

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

Należy szukać:

- Więcej niż jednego identyfikatora PID Gateway w 30-sekundowej próbce zamiast jednego stabilnego
  procesu.
- `EADDRINUSE`, `another gateway instance is already listening` lub powtarzających się
  wierszy ponownego uruchamiania/przekazywania w `gateway.log`.
- Jednoczesnego załadowania `~/Library/LaunchAgents/ai.openclaw.gateway.plist` i
  `~/Library/LaunchAgents/ai.openclaw.node.plist` na
  hoście, na którym powinna działać tylko jedna zarządzana usługa Gateway.

Co zrobić:

1. Jeśli na tym hoście powinna działać wyłącznie usługa Gateway, usuń zarządzaną usługę Node
   za pośrednictwem OpenClaw. **Pomiń ten krok**, jeśli usługa Node jest aktywnie wykorzystywana
   do zdalnych funkcji Node; jej odinstalowanie zatrzyma te funkcje na
   tym hoście:

   ```bash
   openclaw node uninstall
   ```

2. Zainstaluj trwały skrypt opakowujący Gateway, który przed uruchomieniem OpenClaw wyczyści odziedziczone
   znaczniki launchd. Użyj obsługiwanej opcji `--wrapper`; nie
   edytuj wygenerowanego pliku w `~/.openclaw/service-env/`, ponieważ ponowna instalacja
   usługi, aktualizacja i naprawa przez Doctor ponownie generują ten plik:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` zachowuje ścieżkę skryptu opakowującego podczas wymuszonych ponownych instalacji,
   aktualizacji i napraw przez Doctor.

3. Sprawdź, czy Gateway działa stabilnie i obsługuje RPC, a nie tylko nasłuchuje:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   Próbka PID powinna wskazywać jeden stabilny proces zamiast zmieniającego się zestawu
   identyfikatorów PID, a obsługa przychodzących wiadomości kanałów powinna zostać wznowiona.

4. Po aktualizacji do wersji, w której naprawiono podstawową pętlę dwóch agentów LaunchAgent,
   usuń obejście i ponownie zainstaluj standardową zarządzaną usługę:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

Powiązane:

- [Uwagi dotyczące platformy macOS](/pl/platforms/mac/bundled-gateway)
- [Doctor](/pl/gateway/doctor)
- [CLI Gateway](/pl/cli/gateway)

## Gateway kończy działanie podczas dużego użycia pamięci

Użyj tego rozwiązania, gdy Gateway znika pod obciążeniem, nadzorca zgłasza ponowne uruchomienie w stylu OOM lub dzienniki zawierają wzmiankę o `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Należy szukać:

- `Reason: diagnostic.memory.pressure.critical` w najnowszym pakiecie stabilności.
- `Memory pressure:` z `critical/rss_threshold`, `critical/heap_threshold` lub `critical/rss_growth`.
- Wartości `V8 heap:` zbliżonych do limitu sterty.
- Wpisów `Largest session files:`, takich jak `agents/<agent>/sessions/<session>.jsonl` lub `sessions/<session>.jsonl`.
- Liczników pamięci cgroup systemu Linux, gdy Gateway działa wewnątrz kontenera lub usługi z ograniczoną pamięcią.

Typowe oznaki:

- `critical memory pressure bundle written` pojawia się krótko przed ponownym uruchomieniem → OpenClaw przechwycił pakiet stabilności sprzed OOM. Sprawdź go za pomocą `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` pojawia się w dziennikach Gateway → OpenClaw wykrył krytyczną presję pamięci, ale migawka stabilności sprzed OOM jest wyłączona.
- `Largest session files:` wskazuje bardzo dużą, zanonimizowaną ścieżkę transkrypcji → ogranicz zachowywaną historię sesji, sprawdź przyrost sesji lub przenieś stare transkrypcje poza aktywny magazyn przed ponownym uruchomieniem.
- Liczba używanych bajtów `V8 heap:` jest zbliżona do limitu sterty → zmniejsz obciążenie związane z promptami/sesjami, ogranicz liczbę jednoczesnych zadań lub zwiększ limit sterty Node dopiero po potwierdzeniu, że obciążenie jest oczekiwane.
- `Memory pressure: critical/rss_growth` → użycie pamięci szybko wzrosło w obrębie jednego okna próbkowania. Sprawdź najnowsze dzienniki pod kątem dużego importu, niekontrolowanych danych wyjściowych narzędzia, powtarzanych ponowień lub partii zakolejkowanych zadań agenta.
- Krytyczna presja pamięci pojawia się w dziennikach, ale nie istnieje żaden pakiet → jest to ustawienie domyślne. Ustaw `diagnostics.memoryPressureSnapshot: true`, aby podczas przyszłych zdarzeń krytycznej presji pamięci przechwytywać pakiet stabilności sprzed OOM.

Pakiet stabilności nie zawiera ładunku. Obejmuje operacyjne dane dotyczące pamięci i zanonimizowane względne ścieżki plików, ale nie tekst wiadomości, treści Webhooków, dane uwierzytelniające, tokeny, pliki cookie ani surowe identyfikatory sesji. Do zgłoszeń błędów należy dołączać eksport diagnostyczny zamiast kopiować surowe dzienniki.

Powiązane:

- [Kondycja Gateway](/pl/gateway/health)
- [Eksport diagnostyczny](/pl/gateway/diagnostics)
- [Sesje](/pl/cli/sessions)

## Gateway odrzucił nieprawidłową konfigurację

Użyj tego rozwiązania, gdy uruchomienie Gateway kończy się niepowodzeniem z komunikatem `Invalid config` lub dzienniki przeładowania na gorąco informują o pominięciu nieprawidłowej edycji.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Należy szukać:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Pliku `openclaw.json.rejected.*` ze znacznikiem czasu obok aktywnej konfiguracji.
- Pliku `openclaw.json.clobbered.*` ze znacznikiem czasu, jeśli `doctor --fix` naprawił uszkodzoną bezpośrednią edycję.
- OpenClaw zachowuje 32 najnowsze pliki `.clobbered.*` dla każdej ścieżki konfiguracji i rotuje starsze.

<AccordionGroup>
  <Accordion title="Co się stało">
    - Konfiguracja nie przeszła walidacji podczas uruchamiania, przeładowania na gorąco lub zapisu wykonywanego przez OpenClaw.
    - Uruchomienie Gateway kończy się bezpiecznie niepowodzeniem zamiast ponownie zapisywać `openclaw.json`.
    - Przeładowanie na gorąco pomija nieprawidłowe zewnętrzne edycje i pozostawia aktywną bieżącą konfigurację środowiska wykonawczego.
    - Zapisy wykonywane przez OpenClaw odrzucają nieprawidłowe/destrukcyjne ładunki przed zatwierdzeniem i zapisują `.rejected.*`.
    - `openclaw doctor --fix` odpowiada za naprawę. Może usuwać prefiksy niebędące JSON-em lub przywracać ostatnią znaną prawidłową kopię, zachowując odrzucony ładunek jako `.clobbered.*`.
    - Gdy dla jednej ścieżki konfiguracji przeprowadzanych jest wiele napraw, OpenClaw rotuje starsze pliki `.clobbered.*`, aby najnowszy naprawiony ładunek pozostał dostępny.

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
    - `.clobbered.*` istnieje → doctor zachował uszkodzoną zmianę zewnętrzną podczas naprawiania aktywnej konfiguracji.
    - `.rejected.*` istnieje → zapis konfiguracji należący do OpenClaw nie przeszedł kontroli schematu lub nadpisania przed zatwierdzeniem.
    - `Config write rejected:` → zapis próbował usunąć wymaganą strukturę, znacznie zmniejszyć plik lub utrwalić nieprawidłową konfigurację.
    - `config reload skipped (invalid config):` → bezpośrednia edycja nie przeszła walidacji i została zignorowana przez działający Gateway.
    - `Invalid config at ...` → uruchamianie nie powiodło się przed uruchomieniem usług Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` lub `size-drop-vs-last-good:*` → zapis należący do OpenClaw został odrzucony, ponieważ utracił pola lub zmniejszył rozmiar względem ostatniej znanej prawidłowej kopii zapasowej.
    - `Config last-known-good promotion skipped` → kandydat zawierał zredagowane symbole zastępcze sekretów, takie jak `***`.

  </Accordion>
  <Accordion title="Opcje naprawy">
    1. Uruchom `openclaw doctor --fix`, aby doctor naprawił konfigurację z prefiksem lub nadpisaną albo przywrócił ostatnią znaną prawidłową wersję.
    2. Skopiuj tylko zamierzone klucze z `.clobbered.*` lub `.rejected.*`, a następnie zastosuj je za pomocą `openclaw config set` lub `config.patch`.
    3. Przed ponownym uruchomieniem wykonaj `openclaw config validate`.
    4. W przypadku ręcznej edycji zachowaj pełną konfigurację JSON5, a nie tylko częściowy obiekt przeznaczony do zmiany.
  </Accordion>
</AccordionGroup>

Powiązane:

- [Konfiguracja](/pl/cli/config)
- [Konfiguracja: przeładowywanie na gorąco](/pl/gateway/configuration#config-hot-reload)
- [Konfiguracja: ścisła walidacja](/pl/gateway/configuration#strict-validation)
- [Doctor](/pl/gateway/doctor)

## Ostrzeżenia sondy Gateway

Użyj, gdy `openclaw gateway probe` nawiązuje z czymś połączenie, ale nadal wyświetla blok ostrzeżeń.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Sprawdź:

- `warnings[].code` i `primaryTargetId` w danych wyjściowych JSON.
- Czy ostrzeżenie dotyczy rozwiązania awaryjnego SSH, wielu instancji Gateway, brakujących zakresów czy nierozwiązanych odwołań uwierzytelniania.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal próbowało użyć bezpośrednich skonfigurowanych celów lub celów pętli zwrotnej.
- `multiple reachable gateway identities detected` → odpowiedziały odrębne instancje Gateway albo OpenClaw nie mógł potwierdzić, że osiągalne cele są tą samą instancją Gateway. Tunel SSH, adres URL serwera proxy lub skonfigurowany zdalny adres URL prowadzący do tej samej instancji Gateway są traktowane jako jedna instancja Gateway z wieloma transportami, nawet gdy porty transportów są różne.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie zadziałało, ale szczegółowe RPC jest ograniczone zakresem; sparuj tożsamość urządzenia lub użyj poświadczeń z `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → połączenie zadziałało, ale pełny zestaw diagnostycznych RPC przekroczył limit czasu lub zakończył się niepowodzeniem. Należy traktować to jako osiągalny Gateway z ograniczoną diagnostyką; porównaj `connect.ok` i `connect.rpcOk` w danych wyjściowych `--json`.
- `Capability: pairing-pending` lub `gateway closed (1008): pairing required` → Gateway odpowiedział, ale ten klient nadal wymaga sparowania lub zatwierdzenia przed uzyskaniem zwykłego dostępu operatora.
- Tekst ostrzeżenia o nierozwiązanym SecretRef `gateway.auth.*` / `gateway.remote.*` → materiały uwierzytelniające były niedostępne w tej ścieżce polecenia dla celu, którego obsługa nie powiodła się.

Powiązane:

- [Gateway](/pl/cli/gateway)
- [Wiele instancji Gateway na tym samym hoście](/pl/gateway#multiple-gateways-same-host)
- [Dostęp zdalny](/pl/gateway/remote)

## Kanał jest połączony, ale wiadomości nie przepływają

Jeśli stan kanału wskazuje połączenie, ale przepływ wiadomości nie działa, należy skupić się na zasadach, uprawnieniach i regułach dostarczania właściwych dla kanału.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Sprawdź:

- Zasady wiadomości prywatnych (`pairing`, `allowlist`, `open`, `disabled`).
- Listę dozwolonych grup i wymagania dotyczące wzmianek.
- Brakujące uprawnienia lub zakresy interfejsu API kanału.

Typowe sygnatury:

- `mention required` → wiadomość została zignorowana przez zasady wzmianek grupowych.
- `pairing` / ślady oczekującego zatwierdzenia → nadawca nie został zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z uwierzytelnianiem lub uprawnieniami kanału.

Powiązane:

- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Discord](/pl/channels/discord)
- [Telegram](/pl/channels/telegram)
- [WhatsApp](/pl/channels/whatsapp)

## Dostarczanie Cron i Heartbeat

Jeśli Cron lub Heartbeat nie został wykonany albo nie dostarczył wiadomości, najpierw sprawdź stan harmonogramu, a następnie cel dostarczania.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Sprawdź:

- Czy Cron jest włączony i czy wskazano następne wybudzenie.
- Stan historii uruchomień zadania (`ok`, `skipped`, `error`).
- Przyczyny pominięcia Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Typowe sygnatury">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron jest wyłączony.
    - `cron: timer tick failed` → takt harmonogramu nie powiódł się; sprawdź błędy plików, dziennika lub środowiska wykonawczego.
    - `heartbeat skipped` z `reason=quiet-hours` → poza przedziałem aktywnych godzin.
    - `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste elementy, komentarze, nagłówki, ogrodzenia lub szkielet pustej listy kontrolnej, dlatego OpenClaw pomija wywołanie modelu.
    - `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne z zadań nie jest jeszcze wymagane w tym takcie.
    - `heartbeat: unknown accountId` → nieprawidłowy identyfikator konta dla celu dostarczania Heartbeat.
    - `heartbeat skipped` z `reason=dm-blocked` → cel Heartbeat został rozpoznany jako miejsce docelowe typu wiadomości prywatnej, podczas gdy `agents.defaults.heartbeat.directPolicy` (lub nadpisanie dla agenta) ma wartość `block`.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Heartbeat](/pl/gateway/heartbeat)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
- [Zaplanowane zadania: rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting)

## Node jest sparowany, ale narzędzie nie działa

Jeśli Node jest sparowany, ale narzędzia nie działają, należy odizolować stan pierwszego planu, uprawnień i zatwierdzeń.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Sprawdź:

- Czy Node jest online i ma oczekiwane możliwości.
- Przyznane uprawnienia systemu operacyjnego do kamery, mikrofonu, lokalizacji i ekranu.
- Stan zatwierdzeń wykonywania poleceń i listy dozwolonych elementów.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja Node musi działać na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brak uprawnienia systemu operacyjnego.
- `SYSTEM_RUN_DENIED: approval required` → zatwierdzenie wykonania oczekuje.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zostało zablokowane przez listę dozwolonych elementów.

Powiązane:

- [Zatwierdzenia wykonywania poleceń](/pl/tools/exec-approvals)
- [Rozwiązywanie problemów z Node](/pl/nodes/troubleshooting)
- [Node](/pl/nodes/index)

## Narzędzie przeglądarki nie działa

Użyj, gdy działania narzędzia przeglądarki kończą się niepowodzeniem, mimo że sam Gateway działa prawidłowo.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Sprawdź:

- Czy ustawiono `plugins.allow` i czy zawiera `browser`.
- Prawidłową ścieżkę do pliku wykonywalnego przeglądarki.
- Osiągalność profilu CDP.
- Dostępność lokalnej przeglądarki Chrome dla profili `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Sygnatury Pluginu / pliku wykonywalnego">
    - `unknown command "browser"` lub `unknown command 'browser'` → dołączony Plugin przeglądarki został wykluczony przez `plugins.allow`.
    - Brak lub niedostępność narzędzia przeglądarki przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, dlatego Plugin nigdy nie został załadowany.
    - `Failed to start Chrome CDP on port` → nie udało się uruchomić procesu przeglądarki.
    - `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
    - `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany adres URL CDP używa nieobsługiwanego schematu, takiego jak `file:` lub `ftp:`.
    - `browser.cdpUrl has invalid port` → skonfigurowany adres URL CDP ma nieprawidłowy port lub port spoza zakresu.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja Gateway nie zawiera podstawowej zależności środowiska wykonawczego przeglądarki; ponownie zainstaluj lub zaktualizuj OpenClaw, a następnie uruchom ponownie Gateway. Migawki ARIA i podstawowe zrzuty ekranu stron mogą nadal działać, ale nawigacja, migawki AI, zrzuty ekranu elementów wskazanych selektorami CSS oraz eksport do PDF pozostają niedostępne.

  </Accordion>
  <Accordion title="Sygnatury Chrome MCP / istniejącej sesji">
    - `Could not find DevToolsActivePort for chrome` → istniejąca sesja Chrome MCP nie mogła jeszcze dołączyć do wybranego katalogu danych przeglądarki. Otwórz stronę inspekcji przeglądarki, włącz zdalne debugowanie, pozostaw przeglądarkę otwartą, zatwierdź pierwszy monit o dołączenie, a następnie spróbuj ponownie. Jeśli stan zalogowania nie jest wymagany, zalecany jest zarządzany profil `openclaw`.
    - `No browser tabs found for profile="user"` → profil dołączania Chrome MCP nie ma żadnych otwartych lokalnych kart Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny punkt końcowy CDP nie jest osiągalny z hosta Gateway.
    - `Browser attachOnly is enabled ... not reachable` lub `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko do dołączania nie ma osiągalnego celu albo punkt końcowy HTTP odpowiedział, ale nadal nie udało się otworzyć WebSocketu CDP.

  </Accordion>
  <Accordion title="Sygnatury elementów / zrzutów ekranu / przesyłania">
    - `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu połączyło `--full-page` z `--ref` lub `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwytywania strony lub `--ref` migawki, a nie `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → punkty zaczepienia przesyłania Chrome MCP wymagają odwołań do migawek, a nie selektorów CSS.
    - `existing-session file uploads currently support one file at a time.` → w profilach Chrome MCP wysyłaj jedno przesłanie na wywołanie.
    - `existing-session dialog handling does not support timeoutMs.` → punkty zaczepienia okien dialogowych w profilach Chrome MCP nie obsługują nadpisywania limitów czasu.
    - `existing-session type does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:type` w profilach `profile="user"` / istniejącej sesji Chrome MCP albo użyj zarządzanego profilu przeglądarki lub profilu CDP, gdy wymagany jest niestandardowy limit czasu.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki lub surowego profilu CDP.
    - Nieaktualne nadpisania obszaru roboczego, trybu ciemnego, ustawień regionalnych lub trybu offline w profilach tylko do dołączania albo zdalnych profilach CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez ponownego uruchamiania całego Gateway.

  </Accordion>
</AccordionGroup>

Powiązane:

- [Przeglądarka (zarządzana przez OpenClaw)](/pl/tools/browser)
- [Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting)

## Jeśli po aktualizacji coś nagle przestało działać

Większość problemów po aktualizacji wynika z rozbieżności konfiguracji lub egzekwowania teraz bardziej rygorystycznych ustawień domyślnych.

<AccordionGroup>
  <Accordion title="1. Zmieniono uwierzytelnianie i zachowanie nadpisywania adresu URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Co sprawdzić:

    - Jeśli `gateway.mode=remote`, wywołania CLI mogą być kierowane do zdalnej usługi, mimo że lokalna usługa działa prawidłowo.
    - Jawne wywołania `--url` nie korzystają awaryjnie z zapisanych danych uwierzytelniających.

    Typowe objawy:

    - `gateway connect failed:` → nieprawidłowy docelowy adres URL.
    - `unauthorized` → punkt końcowy jest osiągalny, ale uwierzytelnianie jest nieprawidłowe.

  </Accordion>
  <Accordion title="2. Ograniczenia dotyczące powiązania i uwierzytelniania są bardziej rygorystyczne">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Co sprawdzić:

    - Powiązania spoza interfejsu loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki uwierzytelniania Gateway: uwierzytelniania za pomocą współdzielonego tokenu/hasła albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` spoza interfejsu loopback.
    - Stare klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

    Typowe objawy:

    - `refusing to bind gateway ... without auth` → powiązanie spoza interfejsu loopback bez prawidłowej ścieżki uwierzytelniania Gateway.
    - `Connectivity probe: failed`, gdy środowisko uruchomieniowe działa → Gateway działa, ale jest niedostępny przy bieżących ustawieniach uwierzytelniania/adresu URL.

  </Accordion>
  <Accordion title="3. Zmieniono stan parowania i tożsamości urządzenia">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Co sprawdzić:

    - Oczekujące zatwierdzenia urządzeń dla panelu/nodów.
    - Oczekujące zatwierdzenia parowania wiadomości bezpośrednich po zmianach zasad lub tożsamości.

    Typowe objawy:

    - `device identity required` → wymagania uwierzytelniania urządzenia nie zostały spełnione.
    - `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

  </Accordion>
</AccordionGroup>

Jeśli po wykonaniu tych kontroli konfiguracja usługi i środowisko uruchomieniowe nadal są niespójne, należy ponownie zainstalować metadane usługi z tego samego profilu/katalogu stanu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane materiały:

- [Uwierzytelnianie](/pl/gateway/authentication)
- [Wykonywanie w tle i narzędzie procesów](/pl/gateway/background-process)
- [Parowanie nodów](/pl/gateway/pairing)

## Powiązane materiały

- [Doctor](/pl/gateway/doctor)
- [Często zadawane pytania](/pl/help/faq)
- [Procedura operacyjna Gateway](/pl/gateway)
