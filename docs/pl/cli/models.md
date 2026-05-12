---
read_when:
    - Chcesz zmienić domyślne modele lub wyświetlić status uwierzytelniania dostawcy
    - Chcesz przeskanować dostępne modele/dostawców i debugować profile uwierzytelniania
summary: Dokumentacja referencyjna CLI dla `openclaw models` (status/list/set/scan, aliasy, mechanizmy zastępcze, uwierzytelnianie)
title: Modele
x-i18n:
    generated_at: "2026-05-12T00:58:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Wykrywanie, skanowanie i konfiguracja modeli (model domyślny, modele awaryjne, profile uwierzytelniania).

Powiązane:

- Dostawcy + modele: [Modele](/pl/providers/models)
- Koncepcje wyboru modelu + polecenie slash `/models`: [Koncepcja modeli](/pl/concepts/models)
- Konfiguracja uwierzytelniania dostawcy: [Pierwsze kroki](/pl/start/getting-started)

## Typowe polecenia

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` pokazuje rozwiązane ustawienia domyślne/awaryjne oraz przegląd uwierzytelniania.
Gdy dostępne są migawki użycia dostawcy, sekcja stanu OAuth/klucza API zawiera
okna użycia dostawcy i migawki limitów.
Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi i z.ai. Uwierzytelnianie użycia pochodzi z haków specyficznych
dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw wraca do pasujących
poświadczeń OAuth/klucza API z profili uwierzytelniania, zmiennych środowiskowych lub konfiguracji.
W wyjściu `--json` `auth.providers` jest przeglądem dostawców uwzględniającym
zmienne środowiskowe/konfigurację/magazyn, natomiast `auth.oauth` dotyczy wyłącznie kondycji profili w magazynie uwierzytelniania.
Dodaj `--probe`, aby uruchomić aktywne próby uwierzytelniania względem każdego skonfigurowanego profilu dostawcy.
Próby są rzeczywistymi żądaniami (mogą zużywać tokeny i wyzwalać limity szybkości).
Użyj `--agent <id>`, aby sprawdzić stan modelu/uwierzytelniania skonfigurowanego agenta. Gdy pominięte,
polecenie używa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, jeśli są ustawione, w przeciwnym razie
skonfigurowanego agenta domyślnego.
Wiersze prób mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`.
Do rozwiązywania problemów z OAuth dla Codex najszybszym sposobem potwierdzenia,
czy agent ma używalny profil uwierzytelniania `openai-codex` dla `openai/*`
przez natywny runtime Codex, są `openclaw models status`,
`openclaw models auth list --provider openai-codex` oraz
`openclaw config get agents.defaults.model --json`. Zobacz [Konfiguracja dostawcy OpenAI](/pl/providers/openai#check-and-recover-codex-oauth-routing).

Uwagi:

- `models set <model-or-alias>` akceptuje `provider/model` lub alias.
- `models list` jest tylko do odczytu: odczytuje konfigurację, profile uwierzytelniania, istniejący stan katalogu
  oraz wiersze katalogu należące do dostawców, ale nie nadpisuje
  `models.json`.
- Kolumna `Auth` jest na poziomie dostawcy i jest tylko do odczytu. Jest obliczana na podstawie lokalnych
  metadanych profilu uwierzytelniania, znaczników środowiskowych, skonfigurowanych kluczy dostawcy, znaczników dostawcy lokalnego,
  znaczników środowiska/profilu AWS Bedrock oraz metadanych syntetycznego uwierzytelniania Plugin;
  nie ładuje runtime dostawcy, nie odczytuje sekretów z keychaina, nie wywołuje
  API dostawców ani nie dowodzi dokładnej gotowości wykonania dla poszczególnych modeli.
- `models list --all --provider <id>` może obejmować należące do dostawcy statyczne wiersze katalogu
  z manifestów Plugin lub metadanych katalogu dostawców wbudowanych, nawet jeśli
  nie uwierzytelniono się jeszcze u tego dostawcy. Te wiersze nadal są wyświetlane jako
  niedostępne, dopóki nie zostanie skonfigurowane pasujące uwierzytelnianie.
- `models list` utrzymuje responsywność płaszczyzny sterowania, gdy wykrywanie katalogu dostawcy
  jest wolne. Widoki domyślne i skonfigurowane po krótkim oczekiwaniu wracają do skonfigurowanych lub
  syntetycznych wierszy modeli i pozwalają wykrywaniu zakończyć się w tle.
  Użyj `--all`, gdy potrzebujesz dokładnego, pełnego wykrytego katalogu i
  możesz poczekać na wykrywanie dostawcy.
- Szerokie `models list --all` scala wiersze katalogu z manifestu nad wierszami rejestru
  bez ładowania haków uzupełnień runtime dostawcy. Szybkie ścieżki manifestu filtrowane po dostawcy
  używają tylko dostawców oznaczonych jako `static`; dostawcy oznaczeni jako `refreshable`
  pozostają oparci na rejestrze/pamięci podręcznej i dołączają wiersze manifestu jako uzupełnienia, natomiast
  dostawcy oznaczeni jako `runtime` pozostają przy wykrywaniu rejestru/runtime.
- `models list` utrzymuje natywne metadane modelu i limity runtime jako osobne wartości. W wyjściu tabelarycznym
  `Ctx` pokazuje `contextTokens/contextWindow`, gdy efektywny limit runtime
  różni się od natywnego okna kontekstu; wiersze JSON zawierają `contextTokens`,
  gdy dostawca ujawnia ten limit.
- `models list --provider <id>` filtruje według identyfikatora dostawcy, takiego jak `moonshot` lub
  `openai-codex`. Nie akceptuje etykiet wyświetlanych z interaktywnych selektorów dostawców,
  takich jak `Moonshot AI`.
- Odwołania do modeli są parsowane przez podział po **pierwszym** `/`. Jeśli ID modelu zawiera `/` (styl OpenRouter), uwzględnij prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw rozwiązuje dane wejściowe jako alias, następnie
  jako unikalne dopasowanie skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem
  wraca do skonfigurowanego dostawcy domyślnego z ostrzeżeniem o przestarzałym użyciu.
  Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
  wraca do pierwszego skonfigurowanego dostawcy/modelu zamiast zgłaszać
  nieaktualną wartość domyślną usuniętego dostawcy.
- `models status` może pokazywać `marker(<value>)` w wyjściu uwierzytelniania dla niesekretnych symboli zastępczych (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### Skanowanie modeli

`models scan` odczytuje publiczny katalog `:free` OpenRouter i klasyfikuje kandydatów do
użycia awaryjnego. Sam katalog jest publiczny, więc skany wyłącznie metadanych nie wymagają
klucza OpenRouter.

Domyślnie OpenClaw próbuje sprawdzać obsługę narzędzi i obrazów za pomocą aktywnych wywołań modeli.
Jeśli nie skonfigurowano klucza OpenRouter, polecenie wraca do wyjścia wyłącznie metadanych
i wyjaśnia, że modele `:free` nadal wymagają `OPENROUTER_API_KEY` do
prób i inferencji.

Opcje:

- `--no-probe` (tylko metadane; bez wyszukiwania konfiguracji/sekretów)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (żądanie katalogu i limit czasu dla każdej próby)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` i `--set-image` wymagają aktywnych prób; wyniki skanu wyłącznie metadanych
mają charakter informacyjny i nie są stosowane do konfiguracji.

### Stan modeli

Opcje:

- `--json`
- `--plain`
- `--check` (kod wyjścia 1=wygasłe/brakujące, 2=wygasające)
- `--probe` (aktywna próba skonfigurowanych profili uwierzytelniania)
- `--probe-provider <name>` (próba jednego dostawcy)
- `--probe-profile <id>` (powtarzalne lub rozdzielone przecinkami identyfikatory profili)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (ID skonfigurowanego agenta; zastępuje `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` rezerwuje stdout dla ładunku JSON. Diagnostyka profilu uwierzytelniania, dostawcy
i uruchamiania jest kierowana do stderr, aby skrypty mogły przekazywać stdout bezpośrednio
do narzędzi takich jak `jq`.

Koszyki stanu prób:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Przypadki szczegółów prób/kodów przyczyn, których można oczekiwać:

- `excluded_by_auth_order`: zapisany profil istnieje, ale jawne
  `auth.order.<provider>` go pominęło, więc próba zgłasza wykluczenie zamiast
  próbować go użyć.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil jest obecny, ale nie kwalifikuje się albo nie można go rozwiązać.
- `no_model`: uwierzytelnianie dostawcy istnieje, ale OpenClaw nie mógł rozwiązać kandydata modelu
  nadającego się do próby dla tego dostawcy.

## Aliasy + modele awaryjne

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profile uwierzytelniania

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` to interaktywny pomocnik uwierzytelniania. Może uruchomić przepływ uwierzytelniania dostawcy
(OAuth/klucz API) albo poprowadzić do ręcznego wklejenia tokenu, w zależności od
wybranego dostawcy.

`models auth list` wyświetla zapisane profile uwierzytelniania dla wybranego agenta bez
drukowania tokenu, klucza API ani materiału sekretnego OAuth. Użyj `--provider <id>`, aby
filtrować do jednego dostawcy, takiego jak `openai-codex`, oraz `--json` do skryptów.

`models auth login` uruchamia przepływ uwierzytelniania Plugin dostawcy (OAuth/klucz API). Użyj
`openclaw plugins list`, aby zobaczyć, którzy dostawcy są zainstalowani.
Użyj `openclaw models auth --agent <id> <subcommand>`, aby zapisać wyniki uwierzytelniania w
konkretnym skonfigurowanym magazynie agenta. Nadrzędna flaga `--agent` jest respektowana przez
`add`, `list`, `login`, `setup-token`, `paste-token` oraz
`login-github-copilot`.

Dla modeli OpenAI `--provider openai` domyślnie używa logowania na konto ChatGPT/Codex.
Użyj `--method api-key` tylko wtedy, gdy chcesz dodać profil klucza API OpenAI,
zwykle jako zapas dla limitów subskrypcji Codex. Starsza pisownia
`--provider openai-codex` nadal działa dla istniejących skryptów.

Przykłady:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

Uwagi:

- `setup-token` i `paste-token` pozostają ogólnymi poleceniami tokenów dla dostawców,
  którzy udostępniają metody uwierzytelniania tokenem.
- `setup-token` wymaga interaktywnego TTY i uruchamia metodę uwierzytelniania tokenem dostawcy
  (domyślnie metodę `setup-token` tego dostawcy, gdy ją udostępnia).
- `paste-token` akceptuje ciąg tokenu wygenerowany gdzie indziej lub przez automatyzację.
- `paste-token` wymaga `--provider`, prosi o wartość tokenu i zapisuje
  ją do domyślnego identyfikatora profilu `<provider>:manual`, chyba że przekażesz
  `--profile-id`.
- `paste-token --expires-in <duration>` zapisuje bezwzględne wygaśnięcie tokenu na podstawie
  względnego czasu trwania, takiego jak `365d` lub `12h`.
- Uwaga dotycząca Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako sankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Anthropic `setup-token` / `paste-token` pozostają dostępne jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw teraz preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
