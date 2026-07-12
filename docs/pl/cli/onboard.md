---
read_when:
    - Chcesz skonfigurować inferencję, a następnie dokończyć konfigurację za pomocą Crestodian
summary: Dokumentacja CLI dla `openclaw onboard` (interaktywne wdrażanie)
title: Wdrażanie
x-i18n:
    generated_at: "2026-07-12T15:00:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Konfiguracja z przewodnikiem, która w pierwszej kolejności ustanawia wnioskowanie: wykrywa istniejący dostęp do AI, wymaga działającego uzupełnienia, zapisuje tylko działającą trasę, a następnie uruchamia Crestodian w celu skonfigurowania pozostałych elementów. `openclaw setup` jest tym samym punktem wejścia; `openclaw setup --baseline` zapisuje tylko konfigurację bazową i przestrzeń roboczą.

<CardGroup cols={2}>
  <Card title="Centrum wdrażania CLI" href="/pl/start/wizard" icon="rocket">
    Przewodnik po interaktywnym procesie CLI.
  </Card>
  <Card title="Omówienie wdrażania" href="/pl/start/onboarding-overview" icon="map">
    Jak poszczególne elementy wdrażania OpenClaw współdziałają ze sobą.
  </Card>
  <Card title="Dokumentacja konfiguracji CLI" href="/pl/start/wizard-cli-reference" icon="book">
    Dane wyjściowe, mechanizmy wewnętrzne i zachowanie poszczególnych kroków.
  </Card>
  <Card title="Automatyzacja CLI" href="/pl/start/wizard-cli-automation" icon="terminal">
    Flagi nieinteraktywne i konfiguracje skryptowe.
  </Card>
  <Card title="Wdrażanie aplikacji macOS" href="/pl/start/onboarding" icon="apple">
    Proces wdrażania aplikacji paska menu systemu macOS.
  </Card>
</CardGroup>

## Przykłady

```bash
openclaw onboard
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`: otwiera pełny kreator krok po kroku. Nie można jej łączyć z
  `--non-interactive`; w przypadku konfiguracji automatycznej pomiń `--classic`.
- `--flow quickstart`: otwiera klasyczny kreator z minimalną liczbą monitów i
  automatycznie generuje token Gateway.
- `--flow manual` (alias `advanced`): otwiera klasyczny kreator z pełnym zestawem monitów
  dotyczących portu, powiązania i uwierzytelniania.
- `--flow import`: uruchamia wykrytego dostawcę migracji (na przykład Hermes za pomocą `--import-from hermes`), wyświetla podgląd planu, a następnie stosuje go po potwierdzeniu. Import można uruchomić tylko w nowej konfiguracji OpenClaw — jeśli istnieje jakikolwiek stan, najpierw zresetuj konfigurację, dane uwierzytelniające, sesje i stan przestrzeni roboczej. Użyj [`openclaw migrate`](/pl/cli/migrate), aby uzyskać plany przebiegu próbnego, tryb nadpisywania, raporty i dokładne mapowania.
- `--modern` jest aliasem zgodności dla konwersacyjnego asystenta konfiguracji Crestodian.
  Korzysta z tej samej bramki aktywnego wnioskowania co `openclaw crestodian` i
  akceptuje tylko `--workspace`, `--accept-risk`,
  `--non-interactive` oraz `--json`. Inne flagi konfiguracji są odrzucane, zamiast
  być po cichu ignorowane.

## Proces z przewodnikiem

Samo polecenie `openclaw onboard` uruchamia proces z przewodnikiem. Wyświetla powiadomienie dotyczące bezpieczeństwa, wykrywa dostęp do AI już dostępny za pośrednictwem skonfigurowanych modeli, zmiennych środowiskowych kluczy API i obsługiwanych lokalnych interfejsów CLI, a następnie testuje zalecanego kandydata za pomocą rzeczywistego uzupełnienia. Jeśli ten kandydat nie zadziała, proces wdrażania wyświetla przyczynę i automatycznie próbuje użyć następnego dostępnego kandydata.

Jeśli automatyczne wykrywanie wyczerpie wszystkie możliwości, wybierz innego wykrytego kandydata lub wprowadź klucz API dostawcy w maskowanym monicie. Ręcznie podany klucz jest testowany za pomocą tej samej ścieżki aktywnego uzupełnienia. Wdrażanie z przewodnikiem nie oferuje Crestodian ani wyjścia z pominięciem AI, zanim kandydat nie przejdzie testu. OpenClaw zapisuje zweryfikowaną trasę modelu i jej dane uwierzytelniające dopiero po pomyślnym zakończeniu testu; kandydat, którego test się nie powiódł, nie zastępuje skonfigurowanego modelu ani nie zapisuje użytych danych uwierzytelniających. Konfiguracja przestrzeni roboczej i Gateway pozostaje niezmieniona do czasu uruchomienia Crestodian.

W trybie z przewodnikiem `--workspace <dir>` określa proponowaną przestrzeń roboczą Crestodian i izolowany kontekst wnioskowania. Nie jest ona zapisywana, dopóki nie zatwierdzisz propozycji konfiguracji Crestodian. Wdrażanie klasyczne i nieinteraktywne zapisuje przestrzeń roboczą w ramach standardowego procesu konfiguracji.

Po pomyślnym przejściu wnioskowania wdrażanie z przewodnikiem natychmiast uruchamia Crestodian ze zweryfikowanym modelem. Crestodian może następnie skonfigurować przestrzeń roboczą, Gateway, kanały, agentów, pluginy i inne opcjonalne funkcje. W Crestodian użyj `open channel wizard for <channel>`, aby przekazać gromadzenie danych uwierzytelniających kanału maskowanemu kreatorowi terminalowemu. Aby zmienić dostawcę modelu lub jego uwierzytelnianie, zamknij Crestodian i uruchom `openclaw onboard`; Crestodian nie otwiera procesów wyboru dostawcy w trybie z przewodnikiem ani klasycznym.

W skonfigurowanej instalacji ponowne uruchomienie `openclaw onboard` najpierw weryfikuje bieżący model domyślny, dlatego ten sam proces służy jako przebieg weryfikacji i naprawy. Jeśli sprawdzenie się nie powiedzie, skonfigurowany model nigdy nie jest zastępowany automatycznie — proces wdrażania zatrzymuje się i pyta, jak kontynuować. Sprawdzenie jest wykonywane poza przestrzenią roboczą, dlatego model udostępniany przez plugin przestrzeni roboczej może w tym miejscu nie przejść testu, mimo że nadal działa w agencie.
Użyj `openclaw onboard --classic` do uwierzytelniania specyficznego dla dostawcy, konfiguracji kanałów, Skills, zdalnego Gateway, importów lub pełnego sterowania Gateway. Aby przeprowadzić konwersacyjną konfigurację i naprawę niezwiązaną z wnioskowaniem, uruchom `openclaw crestodian`; `openclaw onboard --modern` jest aliasem zgodności korzystającym z tej samej bramki wnioskowania. Klasyczny kreator może opcjonalnie zweryfikować model domyślny za pomocą aktywnego uzupełnienia, ale Crestodian nie uruchomi się, dopóki jego własne sprawdzenie aktywnego wnioskowania nie zakończy się pomyślnie.

W interaktywnym terminalu samo polecenie `openclaw` (bez podpolecenia) wybiera ścieżkę na podstawie stanu konfiguracji:

- Jeśli aktywny plik konfiguracyjny nie istnieje lub nie zawiera ustawień utworzonych przez użytkownika (jest pusty albo zawiera tylko metadane), uruchamia wdrażanie z przewodnikiem.
- Jeśli plik konfiguracyjny istnieje, ale nie przechodzi walidacji, uruchamia klasyczną ścieżkę wdrażania ze wskazówkami dotyczącymi `openclaw doctor`. Crestodian wymaga działającego wnioskowania i nie służy do naprawiania tego stanu sprzed konfiguracji wnioskowania.
- Jeśli plik konfiguracyjny jest prawidłowy, otwiera standardowy interfejs TUI agenta. Osiągalny, skonfigurowany Gateway z agentem i modelem prowadzi bezpośrednio do tego interfejsu bez wdrażania ani Crestodian. W skonfigurowanej instalacji otwórz Crestodian za pomocą `/crestodian` w TUI lub polecenia `openclaw crestodian`.

Nieszyfrowany protokół `ws://` jest akceptowany w przypadku local loopback, prywatnych literałów adresów IP, domen `.local` oraz adresów URL Gateway w Tailnet `*.ts.net`. W przypadku innych zaufanych nazw prywatnego DNS ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w środowisku procesu wdrażania.

## Resetowanie

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` usuwa stan przed uruchomieniem konfiguracji. `--reset-scope` określa zakres usuwania: `config` (tylko konfiguracja), `config+creds+sessions` (wartość domyślna, gdy przekazano `--reset` bez zakresu) lub `full` (resetuje również przestrzeń roboczą). Reset przestrzeni roboczej następuje tylko w przypadku użycia `--reset-scope full`.

## Ustawienia regionalne

Interaktywne wdrażanie używa ustawień regionalnych kreatora CLI dla stałych tekstów konfiguracji. Kolejność rozpoznawania:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Awaryjnie język angielski

Obsługiwane ustawienia regionalne kreatora to `en`, `zh-CN` oraz `zh-TW`. Wartości ustawień regionalnych mogą używać znaków podkreślenia lub przyrostków POSIX, takich jak `zh_CN.UTF-8`. Nazwy produktów, nazwy poleceń, klucze konfiguracji, adresy URL, identyfikatory dostawców, identyfikatory modeli oraz etykiety pluginów i kanałów pozostają bez zmian.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## Konfiguracja nieinteraktywna

`--non-interactive` wymaga `--accept-risk` (potwierdzenia, że agenci mają duże możliwości, a pełny dostęp do systemu wiąże się z ryzykiem). Domyślną wartością `--mode` jest `local`.

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` jest opcjonalna; jeśli ją pominięto, proces wdrażania sprawdza zmienną środowiskową `CUSTOM_API_KEY`. OpenClaw automatycznie oznacza popularne identyfikatory modeli wizyjnych (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral i podobne) jako obsługujące obrazy. Przekaż `--custom-image-input` w przypadku nieznanych niestandardowych identyfikatorów modeli wizyjnych albo `--custom-text-input`, aby wymusić metadane trybu wyłącznie tekstowego. Użyj `--custom-compatibility openai-responses` dla punktów końcowych zgodnych z OpenAI, które obsługują `/v1/responses`, ale nie `/v1/chat/completions`; prawidłowe wartości to `openai` (domyślna), `openai-responses`, `anthropic`.

LM Studio ma również flagę klucza specyficzną dla dostawcy:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Nieinteraktywna konfiguracja Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

Domyślną wartością `--custom-base-url` jest `http://127.0.0.1:11434`. `--custom-model-id` jest opcjonalna; jeśli ją pominięto, proces wdrażania używa sugerowanych wartości domyślnych Ollama. Identyfikatory modeli chmurowych, takie jak `kimi-k2.5:cloud`, również działają w tym miejscu.

Przechowuj klucze dostawcy jako odwołania zamiast zwykłego tekstu:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

W przypadku `--secret-input-mode ref` proces wdrażania zapisuje odwołania oparte na zmiennych środowiskowych zamiast wartości kluczy w postaci zwykłego tekstu: w przypadku dostawców opartych na profilach uwierzytelniania zapisuje `keyRef: { source: "env", provider: "default", id: <envVar> }`; w przypadku dostawców niestandardowych w ten sam sposób zapisuje `models.providers.<id>.apiKey` (na przykład `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Kontrakt: ustaw zmienną środowiskową dostawcy w środowisku procesu wdrażania (na przykład `OPENAI_API_KEY`) i nie przekazuj jednocześnie flagi klucza w wierszu poleceń, chyba że ta zmienna środowiskowa jest ustawiona — wartość flagi bez odpowiadającej jej zmiennej środowiskowej powoduje natychmiastowe niepowodzenie ze wskazówkami.

### Uwierzytelnianie Gateway (tryb nieinteraktywny)

- `--gateway-auth token --gateway-token <token>` przechowuje token w postaci zwykłego tekstu. `token` jest domyślnym trybem uwierzytelniania.
- `--gateway-auth token --gateway-token-ref-env <name>` przechowuje `gateway.auth.token` jako odwołanie SecretRef do zmiennej środowiskowej. Wymaga niepustej zmiennej środowiskowej o tej nazwie w środowisku procesu wdrażania.
- `--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.
- W przypadku `--install-daemon`: zarządzany przez SecretRef `gateway.auth.token` jest walidowany, ale jego rozpoznana wartość w postaci zwykłego tekstu nie jest zapisywana w metadanych środowiska usługi nadzorującej; jeśli odwołania nie można rozpoznać, instalacja zostaje bezpiecznie przerwana ze wskazówkami dotyczącymi rozwiązania problemu. Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja jest blokowana do czasu jawnego ustawienia trybu.
- Lokalne wdrażanie zapisuje `gateway.mode="local"` w konfiguracji. Późniejszy brak `gateway.mode` w pliku konfiguracyjnym oznacza uszkodzenie konfiguracji lub nieukończoną ręczną edycję, a nie prawidłowy skrót trybu lokalnego.
- Lokalne wdrażanie instaluje pluginy dostępne do pobrania, których wymaga wybrana ścieżka konfiguracji (na przykład plugin środowiska wykonawczego Codex lub Copilot dla odpowiadających im metod uwierzytelniania). Wdrażanie zdalne zapisuje tylko informacje o połączeniu ze zdalnym Gateway — nigdy nie instaluje lokalnych pakietów pluginów.
- `--allow-unconfigured` jest osobnym mechanizmem awaryjnym polecenia `openclaw gateway run`; nie pozwala procesowi wdrażania pominąć `gateway.mode`.

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### Stan lokalnego Gateway

- O ile nie przekażesz `--skip-health`, proces wdrażania przed pomyślnym zakończeniem oczekuje na osiągalny lokalny Gateway.
- `--install-daemon` najpierw uruchamia ścieżkę instalacji zarządzanego Gateway. Bez tej flagi lokalny Gateway musi już działać (na przykład uruchomiony przez `openclaw gateway run`).
- `--skip-health` pomija oczekiwanie, jeśli w automatyzacji chcesz jedynie zapisać konfigurację, przestrzeń roboczą i pliki inicjalizacyjne.
- `--skip-bootstrap` ustawia `agents.defaults.skipBootstrap: true` i pomija tworzenie plików `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oraz `BOOTSTRAP.md`.
- W natywnym systemie Windows opcja `--install-daemon` najpierw próbuje użyć Harmonogramu zadań, a jeśli utworzenie zadania zostanie odrzucone, przełącza się na element logowania w folderze Autostart danego użytkownika.

### Interaktywny tryb odwołań

- Po wyświetleniu monitu wybierz **Use secret reference**, a następnie **Environment variable** lub skonfigurowanego dostawcę sekretów (`file` albo `exec`).
- Przed zapisaniem odwołania proces wdrażania przeprowadza szybką walidację wstępną, a w razie niepowodzenia umożliwia ponowienie próby.

### Opcje punktu końcowego Z.AI

<Note>
`--auth-choice zai-api-key` automatycznie wykrywa najlepszy punkt końcowy i model Z.AI dla Twojego klucza: punkty końcowe Coding Plan preferują `zai/glm-5.2` (z przełączeniem na `glm-5.1`, jeśli jest niedostępny); ogólne punkty końcowe API domyślnie używają `zai/glm-5.1`. Aby wymusić punkt końcowy Coding Plan, wybierz bezpośrednio `zai-coding-global` lub `zai-coding-cn`.
</Note>

```bash
# Wybór punktu końcowego bez monitów
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Inne opcje punktów końcowych Z.AI: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Dodatkowe flagi trybu nieinteraktywnego

Uwierzytelnianie modelu za pomocą tokenu (używane z `--auth-choice token`):

| Flaga                           | Opis                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | Identyfikator dostawcy tokenu, który wydał token                                                                                                              |
| `--token <token>`               | Wartość tokenu do uwierzytelniania modelu                                                                                                                     |
| `--token-profile-id <id>`       | Identyfikator profilu uwierzytelniania (domyślnie `<provider>:manual`; niektóre przepływy należące do dostawców używają własnej wartości domyślnej, np. `anthropic:default`) |
| `--token-expires-in <duration>` | Opcjonalny okres ważności tokenu (np. `365d`, `12h`)                                                                                                          |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Sterowanie instalacją demona: `--no-install-daemon` / `--skip-daemon` (aliasy; pomijają instalację usługi Gateway), `--daemon-runtime <node|bun>`.

Skills: `--node-manager <npm|pnpm|bun>` (domyślnie `npm`), `--skip-skills`.

Konfiguracja interfejsu i hooków: `--skip-ui` (pomija monity Control UI/TUI), `--skip-hooks` (pomija konfigurację webhooków/hooków), `--skip-channels`, `--skip-search`.

Dane wyjściowe: `--suppress-gateway-token-output` pomija dane wyjściowe Gateway/interfejsu zawierające token (wskazówki dotyczące tokenu, adres URL automatycznego logowania z osadzonym tokenem oraz automatyczne uruchomienie Control UI) — przydatne we współdzielonych terminalach i CI.

<Note>
`--json` nie włącza trybu nieinteraktywnego podczas wdrażania z przewodnikiem ani klasycznego.
W połączeniu z `--modern` format JSON przedstawia jednorazowy przegląd Crestodian, po czym program kończy działanie po zwróceniu tego pojedynczego wyniku. W innych skryptach użyj `--non-interactive`.
</Note>

## Wstępne filtrowanie dostawców

Gdy wybór metody uwierzytelniania wskazuje preferowanego dostawcę, proces wdrażania wstępnie filtruje selektory modelu domyślnego i listy dozwolonych modeli, ograniczając je do modeli tego dostawcy. Filtr uwzględnia także innych dostawców należących do tego samego pluginu, co obejmuje warianty planów programistycznych, takie jak `volcengine`/`volcengine-plan` i `byteplus`/`byteplus-plan`. Jeśli filtr preferowanego dostawcy nie zwróci żadnych załadowanych modeli, proces wdrażania użyje niefiltrowanego katalogu zamiast pozostawiać selektor pusty.

## Dodatkowe monity wyszukiwania w sieci

Niektórzy dostawcy wyszukiwania w sieci wyświetlają podczas wdrażania dodatkowe monity specyficzne dla danego dostawcy:

- **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym uwierzytelnianiem xAI oraz wybór modelu `x_search`.
- **Kimi** może poprosić o wybór regionu API Moonshot (`api.moonshot.ai` lub `api.moonshot.cn`) oraz domyślnego modelu wyszukiwania w sieci Kimi.

## Inne zachowania

- Zachowanie zakresu wiadomości prywatnych podczas lokalnego wdrażania: [dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals).
- Najszybszy sposób na rozpoczęcie pierwszego czatu: `openclaw dashboard` (Control UI, bez konfiguracji kanału).
- Niestandardowy dostawca: połącz dowolny punkt końcowy zgodny z OpenAI lub Anthropic, w tym niewymienionych dostawców hostowanych. Użyj zgodności **Nieznany**, aby przeprowadzić automatyczne wykrywanie za pomocą sondy na żywo.
- Jeśli zostanie wykryty stan Hermes, proces wdrażania zaoferuje migrację (zobacz `--flow import` powyżej).

## Typowe polecenia wykonywane później

Użyj później `openclaw configure`, aby wprowadzić ukierunkowane zmiany niezwiązane z inferencją, oraz `openclaw
channels add`, aby skonfigurować wyłącznie kanał. Aby zmienić dostawcę modelu lub ścieżkę uwierzytelniania,
uruchom zamiast tego `openclaw onboard`.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
