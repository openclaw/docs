---
read_when:
    - Chcesz zmienić domyślne modele lub wyświetlić stan uwierzytelniania dostawcy
    - Chcesz przeglądać dostępne modele/dostawców i debugować profile uwierzytelniania
summary: Dokumentacja CLI dla `openclaw models` (status/list/set/scan, aliasy, mechanizmy zastępcze, uwierzytelnianie)
title: Modele
x-i18n:
    generated_at: "2026-07-16T18:13:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Wykrywanie, skanowanie i konfiguracja modeli (model domyślny, modele rezerwowe, profile uwierzytelniania).

Powiązane:

- Dostawcy i modele: [Modele](/pl/providers/models)
- Pojęcia dotyczące wyboru modelu i polecenie z ukośnikiem `/models`: [Pojęcie modeli](/pl/concepts/models)
- Konfiguracja uwierzytelniania dostawcy: [Pierwsze kroki](/pl/start/getting-started)

## Typowe polecenia

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

Podpolecenia `status` i `auth` przyjmują `--agent <id>`, aby wskazać skonfigurowanego agenta; `list`, `scan`, `aliases` oraz `fallbacks`/`image-fallbacks` zawsze używają skonfigurowanego agenta domyślnego, a `set`/`set-image` bezwarunkowo odrzucają `--agent`. Jeśli parametr zostanie pominięty, polecenia obsługujące `--agent` używają `OPENCLAW_AGENT_DIR`, jeśli jest ustawione, a w przeciwnym razie skonfigurowanego agenta domyślnego.

### Stan

`openclaw models status` wyświetla rozpoznany model domyślny i modele rezerwowe oraz przegląd uwierzytelniania. Gdy dostępne są migawki wykorzystania dostawcy, sekcja stanu OAuth/klucza API zawiera okna wykorzystania dostawcy i migawki limitów. Dostawcy obecnie obsługujący okna wykorzystania: Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi i z.ai. Dane uwierzytelniające do sprawdzania wykorzystania pochodzą z haków właściwych dla dostawcy, jeśli są dostępne; w przeciwnym razie OpenClaw używa pasujących poświadczeń OAuth/klucza API z profili uwierzytelniania, środowiska lub konfiguracji.

W danych wyjściowych `--json` element `auth.providers` jest przeglądem dostawcy uwzględniającym środowisko, konfigurację i magazyn, natomiast `auth.oauth` przedstawia wyłącznie stan profili w magazynie uwierzytelniania.

Opcje:

| Flaga                     | Działanie                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--json`                  | Dane wyjściowe JSON; diagnostyka profili uwierzytelniania, dostawcy i uruchamiania trafia do stderr, dzięki czemu stdout można przekazać potokiem do `jq`. |
| `--plain`                 | Dane wyjściowe w postaci zwykłego tekstu.                                                                     |
| `--check`                 | Zakończenie z kodem różnym od zera, jeśli uwierzytelnianie wygasa lub wygasło: `1` = wygasłe/brakujące, `2` = wygasające. |
| `--probe`                 | Aktywne sprawdzenie skonfigurowanych profili uwierzytelniania. Wykonuje rzeczywiste żądania; może zużywać tokeny i powodować ograniczenie szybkości. |
| `--probe-provider <name>` | Sprawdzenie tylko jednego dostawcy.                                                                           |
| `--probe-profile <id>`    | Sprawdzenie określonych identyfikatorów profili uwierzytelniania (powtórzonych lub rozdzielonych przecinkami). |
| `--probe-timeout <ms>`    | Limit czasu pojedynczego sprawdzenia.                                                                         |
| `--probe-concurrency <n>` | Równoczesne sprawdzenia.                                                                                      |
| `--probe-max-tokens <n>`  | Maksymalna liczba tokenów sprawdzenia (w miarę możliwości).                                                    |
| `--agent <id>`            | Identyfikator skonfigurowanego agenta; zastępuje `OPENCLAW_AGENT_DIR`.                                         |

Wiersze sprawdzeń mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`. Kategorie stanów sprawdzenia: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Kody szczegółów/przyczyn, których można oczekiwać, gdy sprawdzenie nigdy nie dociera do wywołania modelu:

- `excluded_by_auth_order`: zapisany profil istnieje, ale jawne `auth.order.<provider>` go pominęło, dlatego sprawdzenie zgłasza wykluczenie zamiast podejmować próbę jego użycia.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: profil istnieje, ale nie kwalifikuje się do użycia lub nie można go rozpoznać.
- `ineligible_profile`: profil jest niezgodny z konfiguracją dostawcy z innego powodu.
- `no_model`: uwierzytelnianie dostawcy istnieje, ale OpenClaw nie mógł rozpoznać kandydata na model, którego można sprawdzić dla tego dostawcy.

Podczas rozwiązywania problemów z OAuth OpenAI ChatGPT/Codex `openclaw models status`, `openclaw models auth list --provider openai` i `openclaw config get agents.defaults.model --json` pozwalają najszybciej potwierdzić, czy agent ma użyteczny profil OAuth `openai` dla `openai/*` za pośrednictwem natywnego środowiska uruchomieniowego Codex. Zobacz [Konfiguracja dostawcy OpenAI](/pl/providers/openai#check-and-recover-codex-oauth-routing).

### Lista

`openclaw models list` działa tylko do odczytu: odczytuje konfigurację, profile uwierzytelniania, istniejący stan katalogu i należące do dostawcy wiersze katalogu, ale nigdy nie nadpisuje `models.json`.

Opcje: `--all` (pełny katalog), `--local` (filtrowanie do modeli lokalnych), `--provider <id>`, `--json`, `--plain`.

Uwagi:

- Kolumna `Auth` jest tylko do odczytu. W przypadku tras modeli należących do dostawcy, takich jak OpenAI, dopasowuje trasę API/bazowego adresu URL każdego wiersza do kwalifikujących się profili w efektywnym `auth.order`, poświadczeń środowiskowych/konfiguracyjnych oraz rozpoznanych obiektów SecretRef o zakresie polecenia. Konkretny wiersz OpenAI zachowuje nieznany stan, gdy jego zasady trasowania są niedostępne, zamiast przejmować uwierzytelnianie na poziomie dostawcy; starsze kontrole dotyczące wyłącznie dostawcy oraz inni dostawcy zachowują działanie na poziomie dostawcy. Metadane syntetycznego uwierzytelniania Pluginu są jedynie wskazówką dotyczącą możliwości środowiska uruchomieniowego, a nie dowodem natywnego uwierzytelnienia konta, dlatego trasy zależne od konta zachowują nieznany stan bez pozytywnego potwierdzenia w rejestrze. Polecenie nie ładuje środowiska uruchomieniowego dostawcy, nie odczytuje sekretów z pęku kluczy, nie wywołuje interfejsów API dostawcy ani nie potwierdza dokładnej gotowości do wykonania.
- `models list --all --provider <id>` może zawierać należące do dostawcy statyczne wiersze katalogu z manifestów Pluginów lub dołączonych metadanych katalogu dostawcy, nawet jeśli uwierzytelnianie u tego dostawcy nie zostało jeszcze przeprowadzone. Te wiersze nadal są wyświetlane jako niedostępne, dopóki nie zostanie skonfigurowane pasujące uwierzytelnianie.
- `models list` zapewnia responsywność płaszczyzny sterowania, gdy wykrywanie katalogu dostawcy przebiega wolno. Widoki domyślny i skonfigurowany po krótkim oczekiwaniu przełączają się na skonfigurowane lub syntetyczne wiersze modeli i pozwalają na dokończenie wykrywania w tle. Użyj `--all`, gdy potrzebny jest dokładny, pełny wykryty katalog i można zaczekać na wykrywanie po stronie dostawcy.
- Ogólne `models list --all` scala wiersze katalogu manifestu z wierszami rejestru, nadając pierwszeństwo manifestowi, bez ładowania uzupełniających haków środowiska uruchomieniowego dostawcy. Szybkie ścieżki manifestu filtrowane według dostawcy używają tylko dostawców oznaczonych jako `static`; dostawcy oznaczeni jako `refreshable` nadal korzystają z rejestru/pamięci podręcznej i dołączają wiersze manifestu jako uzupełnienie, natomiast dostawcy oznaczeni jako `runtime` nadal korzystają z wykrywania przez rejestr/środowisko uruchomieniowe.
- `models list` rozdziela natywne metadane modelu od limitów środowiska uruchomieniowego. W danych tabelarycznych `Ctx` wyświetla `contextTokens/contextWindow`, gdy efektywny limit środowiska uruchomieniowego różni się od natywnego okna kontekstu; wiersze JSON zawierają `contextTokens`, gdy dostawca udostępnia taki limit.
- W przypadku tras należących do dostawcy `models list` odwzorowuje jeden logiczny wiersz dostawcy/modelu na wybraną trasę. `Input` i `Ctx` pochodzą wyłącznie z dokładnego wiersza katalogu trasy fizycznej, a jawnie skonfigurowane logiczne nadpisania są stosowane na końcu; nierozpoznany wybór trasy wyświetla nieznane pola możliwości zamiast przejmować metadane z trasy równorzędnej.
- `models list --provider <id>` filtruje według identyfikatora dostawcy, takiego jak `moonshot` lub `openai`. Nie przyjmuje etykiet wyświetlanych przez interaktywne selektory dostawców, takich jak `Moonshot AI`.
- Odwołania do modeli są analizowane przez podział przy **pierwszym** `/`. Jeśli identyfikator modelu zawiera `/` (w stylu OpenRouter), należy podać prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli dostawca zostanie pominięty, OpenClaw najpierw rozpoznaje dane wejściowe jako alias, następnie jako unikatowe dopasowanie skonfigurowanego dostawcy dla tego dokładnego identyfikatora modelu, a dopiero potem przechodzi do skonfigurowanego dostawcy domyślnego z ostrzeżeniem o wycofaniu. Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw przechodzi do pierwszej skonfigurowanej pary dostawca/model zamiast zgłaszać nieaktualny domyślny model usuniętego dostawcy.
- `models status` może wyświetlać `marker(<value>)` w danych uwierzytelniania dla symboli zastępczych niebędących sekretami (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### Ustawianie modelu domyślnego / modelu obrazów

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` zapisuje `agents.defaults.model.primary`; `set-image` zapisuje `agents.defaults.imageModel.primary`. Oba przyjmują `provider/model` lub skonfigurowany alias. `set` naprawia również instalacje Pluginów środowiska uruchomieniowego Codex/Copilot, gdy nowo wybrany model ich wymaga; `set-image` tego nie robi. Żadne z tych poleceń nie przyjmuje `--agent`; zawsze zapisują ustawienia domyślne agenta.

### Skanowanie

`models scan` odczytuje publiczny katalog `:free` usługi OpenRouter i klasyfikuje kandydatów do użycia jako modele rezerwowe. Sam katalog jest publiczny, dlatego skanowanie wyłącznie metadanych nie wymaga klucza OpenRouter.

Domyślnie OpenClaw próbuje sprawdzać obsługę narzędzi i obrazów za pomocą aktywnych wywołań modeli. Jeśli nie skonfigurowano klucza OpenRouter, polecenie przechodzi do danych wyjściowych zawierających wyłącznie metadane i wyjaśnia, że modele `:free` nadal wymagają `OPENROUTER_API_KEY` do sprawdzania i wnioskowania.

Opcje:

- `--no-probe` (tylko metadane; bez odczytu konfiguracji/sekretów)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (limit czasu żądania katalogu i każdego sprawdzenia)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` i `--set-image` wymagają aktywnych sprawdzeń; wyniki skanowania wyłącznie metadanych mają charakter informacyjny i nie są stosowane do konfiguracji.

## Aliasy

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Aliasy są przechowywane dla poszczególnych wpisów modeli jako `agents.defaults.models.<key>.alias`. `add` najpierw rozpoznaje `<model-or-alias>` do kanonicznego klucza dostawcy/modelu, dlatego przypisanie aliasu do aliasu przekierowuje go, zamiast tworzyć łańcuch.

## Modele rezerwowe

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

Zarządza `agents.defaults.model.fallbacks`. `openclaw models image-fallbacks list|add|remove|clear` zarządza równoległą listą `agents.defaults.imageModel.fallbacks` przy użyciu takiej samej struktury podpoleceń.

## Profile uwierzytelniania

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add` jest interaktywnym narzędziem pomocniczym uwierzytelniania. Może uruchomić proces uwierzytelniania dostawcy (OAuth/klucz API) lub przeprowadzić przez ręczne wklejanie tokenu, zależnie od wybranego dostawcy.

`models auth list` wyświetla zapisane profile uwierzytelniania dla wybranego agenta bez ujawniania tokenów, kluczy API ani tajnych danych OAuth. Użyj `--provider <id>`, aby ograniczyć wyniki do jednego dostawcy, na przykład `openai`, oraz `--json` w skryptach.

`models auth login` uruchamia przepływ uwierzytelniania Pluginu dostawcy (OAuth/klucz API). Użyj `openclaw plugins list`, aby sprawdzić, którzy dostawcy są zainstalowani. `login` przyjmuje `--profile-id <id>` w przypadku dostawców obsługujących nazwane profile podczas logowania (pozwala to rozdzielić wiele loginów tego samego dostawcy), `--method <id>` do wyboru konkretnej metody uwierzytelniania, `--device-code` jako skrót dla `--method device-code`, `--set-default` do zastosowania zalecanego przez dostawcę modelu domyślnego oraz `--force` do uprzedniego usunięcia istniejących profili tego dostawcy (należy użyć, gdy profil OAuth w pamięci podręcznej się zablokował lub wymagane jest przełączenie konta).

`models auth login-github-copilot` jest skrótem dla `models auth login --provider github-copilot --method device` (przepływ urządzenia GitHub); przyjmuje `--yes`, aby zastąpić istniejący profil bez wyświetlania monitu.

Użyj `openclaw models auth --agent <id> <subcommand>`, aby zapisać wyniki uwierzytelniania w magazynie konkretnego skonfigurowanego agenta. Nadrzędna flaga `--agent` jest uwzględniana przez `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot` oraz `order get`/`set`/`clear`.

W przypadku modeli OpenAI `--provider openai` domyślnie korzysta z logowania na konto ChatGPT/Codex. Użyj `--method api-key` tylko wtedy, gdy wymagane jest dodanie profilu klucza API OpenAI, zwykle jako rozwiązania zapasowego na wypadek limitów subskrypcji Codex. Uruchom `openclaw doctor --fix`, aby przenieść starszy, przestarzały stan uwierzytelniania/profilu z prefiksem OpenAI Codex do `openai`.

Przykłady:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Uwagi:

- `paste-api-key` przyjmuje klucze API wygenerowane w innym miejscu, wyświetla monit o wartość klucza i zapisuje ją pod domyślnym identyfikatorem profilu `<provider>:manual`, chyba że przekazano `--profile-id`. W automatyzacji należy przekazać klucz potokiem na standardowe wejście, na przykład `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` i `paste-token` pozostają ogólnymi poleceniami tokenów dla dostawców udostępniających metody uwierzytelniania za pomocą tokena.
- `setup-token` wymaga interaktywnego terminala TTY i uruchamia metodę uwierzytelniania tokenem dostawcy (domyślnie metodę `setup-token` tego dostawcy, jeśli jest udostępniana).
- `paste-token` wymaga `--provider`, domyślnie wyświetla monit o wartość tokena i zapisuje ją pod domyślnym identyfikatorem profilu `<provider>:manual`, chyba że przekazano `--profile-id`. W automatyzacji należy przekazać token potokiem na standardowe wejście zamiast podawać go jako argument, aby dane uwierzytelniające dostawcy nie pojawiały się w historii powłoki ani na listach procesów.
- `paste-token --expires-in <duration>` zapisuje bezwzględny czas wygaśnięcia tokena na podstawie względnego okresu, takiego jak `365d` lub `12h`.
- W przypadku `openai` klucze API OpenAI oraz dane tokenów ChatGPT/OAuth mają różne struktury uwierzytelniania. Użyj `paste-api-key` dla kluczy API OpenAI `sk-...`, a `paste-token` tylko dla danych uwierzytelniania tokenem.
- Anthropic: `setup-token`/`paste-token` są obsługiwanymi przez OpenClaw ścieżkami uwierzytelniania dla `anthropic`, ale OpenClaw preferuje ponowne wykorzystanie CLI Claude (`claude -p`) na hoście, gdy jest ono dostępne.
- `auth order get/set/clear` zarządza nadpisaniem kolejności profili uwierzytelniania dla jednego dostawcy na poziomie agenta, zapisanym w `auth-state.json` (niezależnie od klucza konfiguracji `auth.order.<provider>`). `set` przyjmuje co najmniej jeden identyfikator profilu w kolejności priorytetów; `clear` korzysta awaryjnie z kolejności określonej w konfiguracji lub cyklicznej.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wybór modelu](/pl/concepts/model-providers)
- [Awaryjne przełączanie modeli](/pl/concepts/model-failover)
