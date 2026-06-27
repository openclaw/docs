---
read_when:
    - Chcesz zmienić domyślne modele lub wyświetlić stan uwierzytelniania dostawcy
    - Chcesz przeskanować dostępne modele/dostawców i debugować profile uwierzytelniania
summary: Odwołanie CLI dla `openclaw models` (status/list/set/scan, aliasy, rozwiązania awaryjne, uwierzytelnianie)
title: Modele
x-i18n:
    generated_at: "2026-06-27T17:21:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Wykrywanie, skanowanie i konfiguracja modeli (model domyślny, mechanizmy awaryjne, profile uwierzytelniania).

Powiązane:

- Dostawcy + modele: [Modele](/pl/providers/models)
- Koncepcje wyboru modelu + polecenie ukośnikowe `/models`: [Koncepcja modeli](/pl/concepts/models)
- Konfiguracja uwierzytelniania dostawcy: [Pierwsze kroki](/pl/start/getting-started)

## Typowe polecenia

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` pokazuje rozwiązany model domyślny/mechanizmy awaryjne oraz przegląd uwierzytelniania.
Gdy dostępne są migawki użycia dostawców, sekcja statusu OAuth/klucza API obejmuje
okna użycia dostawców i migawki limitów.
Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI,
MiniMax, Xiaomi i z.ai. Uwierzytelnianie użycia pochodzi z haków specyficznych
dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw wraca do pasujących
poświadczeń OAuth/klucza API z profili uwierzytelniania, zmiennych środowiskowych lub konfiguracji.
W wyjściu `--json` `auth.providers` jest przeglądem dostawców świadomym
środowiska/konfiguracji/magazynu, a `auth.oauth` dotyczy tylko kondycji profili
w magazynie uwierzytelniania.
Dodaj `--probe`, aby uruchomić aktywne sondy uwierzytelniania względem każdego skonfigurowanego profilu dostawcy.
Sondy są rzeczywistymi żądaniami (mogą zużywać tokeny i wyzwalać limity szybkości).
Użyj `--agent <id>`, aby sprawdzić stan modelu/uwierzytelniania skonfigurowanego agenta. Gdy opcja jest pominięta,
polecenie używa `OPENCLAW_AGENT_DIR`, jeśli jest ustawione, w przeciwnym razie
skonfigurowanego agenta domyślnego.
Wiersze sond mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`.
Do rozwiązywania problemów z OAuth OpenAI ChatGPT/Codex `openclaw models status`,
`openclaw models auth list --provider openai` oraz
`openclaw config get agents.defaults.model --json` to najszybszy sposób, aby
potwierdzić, czy agent ma używalny profil OAuth `openai` dla
`openai/*` przez natywne środowisko uruchomieniowe Codex. Zobacz [konfigurację dostawcy OpenAI](/pl/providers/openai#check-and-recover-codex-oauth-routing).

Uwagi:

- `models set <model-or-alias>` akceptuje `provider/model` albo alias.
- `models list` jest tylko do odczytu: odczytuje konfigurację, profile uwierzytelniania, istniejący stan katalogu
  oraz wiersze katalogu należące do dostawcy, ale nie przepisuje
  `models.json`.
- Kolumna `Auth` jest na poziomie dostawcy i tylko do odczytu. Jest obliczana z lokalnych
  metadanych profili uwierzytelniania, znaczników środowiskowych, skonfigurowanych kluczy dostawców, znaczników
  dostawców lokalnych, znaczników środowiska/profilu AWS Bedrock oraz syntetycznych metadanych uwierzytelniania Plugin;
  nie ładuje środowiska uruchomieniowego dostawcy, nie odczytuje sekretów z pęku kluczy, nie wywołuje
  API dostawców ani nie potwierdza dokładnej gotowości wykonania dla poszczególnych modeli.
- `models list --all --provider <id>` może zawierać należące do dostawcy statyczne wiersze katalogu
  z manifestów Plugin lub metadanych katalogu wbudowanego dostawcy nawet wtedy, gdy
  nie uwierzytelniono się jeszcze u tego dostawcy. Te wiersze nadal są pokazywane jako
  niedostępne, dopóki nie zostanie skonfigurowane pasujące uwierzytelnianie.
- `models list` utrzymuje responsywność płaszczyzny sterowania, gdy wykrywanie katalogu dostawcy
  jest wolne. Widoki domyślne i skonfigurowane po krótkim oczekiwaniu wracają do skonfigurowanych lub
  syntetycznych wierszy modeli i pozwalają wykrywaniu dokończyć się w
  tle. Użyj `--all`, gdy potrzebujesz dokładnego pełnego wykrytego katalogu i
  możesz poczekać na wykrywanie dostawcy.
- Szerokie `models list --all` scala wiersze katalogu z manifestu nad wierszami rejestru
  bez ładowania haków uzupełniających środowiska uruchomieniowego dostawcy. Szybkie ścieżki manifestu filtrowane
  według dostawcy używają tylko dostawców oznaczonych jako `static`; dostawcy oznaczeni jako `refreshable`
  pozostają oparte na rejestrze/pamięci podręcznej i dodają wiersze manifestu jako uzupełnienia, a
  dostawcy oznaczeni jako `runtime` pozostają przy wykrywaniu rejestru/środowiska uruchomieniowego.
- `models list` rozdziela natywne metadane modelu i limity środowiska uruchomieniowego. W wyjściu tabelarycznym
  `Ctx` pokazuje `contextTokens/contextWindow`, gdy efektywny limit środowiska uruchomieniowego
  różni się od natywnego okna kontekstu; wiersze JSON zawierają `contextTokens`,
  gdy dostawca udostępnia ten limit.
- `models list --provider <id>` filtruje według identyfikatora dostawcy, takiego jak `moonshot` lub
  `openai`. Nie akceptuje etykiet wyświetlanych z interaktywnych
  selektorów dostawców, takich jak `Moonshot AI`.
- Odwołania do modeli są parsowane przez podział po **pierwszym** `/`. Jeśli identyfikator modelu zawiera `/` (w stylu OpenRouter), dołącz prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw rozwiązuje dane wejściowe jako alias, potem
  jako unikatowe dopasowanie skonfigurowanego dostawcy dla tego dokładnego identyfikatora modelu, a dopiero potem
  wraca do skonfigurowanego dostawcy domyślnego z ostrzeżeniem o przestarzałości.
  Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
  wraca do pierwszego skonfigurowanego dostawcy/modelu zamiast pokazywać
  nieaktualną wartość domyślną usuniętego dostawcy.
- `models status` może pokazywać `marker(<value>)` w wyjściu uwierzytelniania dla niesekretnych symboli zastępczych (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### Skanowanie modeli

`models scan` odczytuje publiczny katalog `:free` OpenRouter i szereguje kandydatów do
użycia jako mechanizmy awaryjne. Sam katalog jest publiczny, więc skanowania samych metadanych nie wymagają
klucza OpenRouter.

Domyślnie OpenClaw próbuje sondować obsługę narzędzi i obrazów za pomocą aktywnych wywołań modeli.
Jeśli nie skonfigurowano klucza OpenRouter, polecenie wraca do wyjścia
opartego tylko na metadanych i wyjaśnia, że modele `:free` nadal wymagają `OPENROUTER_API_KEY` do
sond i inferencji.

Opcje:

- `--no-probe` (tylko metadane; bez wyszukiwania konfiguracji/sekretów)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (żądanie katalogu i limit czasu na sondę)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` i `--set-image` wymagają aktywnych sond; wyniki skanowania
oparte tylko na metadanych mają charakter informacyjny i nie są stosowane do konfiguracji.

### Status modeli

Opcje:

- `--json`
- `--plain`
- `--check` (kod wyjścia 1=wygasłe/brakujące, 2=wygasające)
- `--probe` (aktywna sonda skonfigurowanych profili uwierzytelniania)
- `--probe-provider <name>` (sonduj jednego dostawcę)
- `--probe-profile <id>` (powtarzane lub rozdzielone przecinkami identyfikatory profili)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identyfikator skonfigurowanego agenta; zastępuje `OPENCLAW_AGENT_DIR`)

`--json` rezerwuje stdout dla ładunku JSON. Diagnostyka profili uwierzytelniania, dostawców
i uruchamiania jest kierowana do stderr, aby skrypty mogły przekazywać stdout bezpośrednio
do narzędzi takich jak `jq`.

Koszyki statusu sond:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Przypadki szczegółów/kodów przyczyn sond, których można oczekiwać:

- `excluded_by_auth_order`: zapisany profil istnieje, ale jawne
  `auth.order.<provider>` go pominęło, więc sonda zgłasza wykluczenie zamiast
  próbować go użyć.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil jest obecny, ale nie kwalifikuje się albo nie można go rozwiązać.
- `no_model`: uwierzytelnianie dostawcy istnieje, ale OpenClaw nie mógł rozwiązać
  kandydata modelu możliwego do sondowania dla tego dostawcy.

## Aliasy + mechanizmy awaryjne

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profile uwierzytelniania

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` to interaktywny pomocnik uwierzytelniania. Może uruchomić przepływ
uwierzytelniania dostawcy (OAuth/klucz API) albo poprowadzić do ręcznego wklejenia tokenu,
zależnie od wybranego dostawcy.

`models auth list` wyświetla zapisane profile uwierzytelniania dla wybranego agenta bez
drukowania tokenu, klucza API ani sekretnego materiału OAuth. Użyj `--provider <id>`, aby
odfiltrować do jednego dostawcy, takiego jak `openai`, oraz `--json` do skryptów.

`models auth login` uruchamia przepływ uwierzytelniania Plugin dostawcy (OAuth/klucz API). Użyj
`openclaw plugins list`, aby zobaczyć, którzy dostawcy są zainstalowani.
Użyj `openclaw models auth --agent <id> <subcommand>`, aby zapisać wyniki uwierzytelniania w
konkretnym magazynie skonfigurowanego agenta. Nadrzędna flaga `--agent` jest respektowana przez
`add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token` oraz
`login-github-copilot`.

Dla modeli OpenAI `--provider openai` domyślnie używa logowania konta ChatGPT/Codex.
Użyj `--method api-key` tylko wtedy, gdy chcesz dodać profil klucza API OpenAI,
zwykle jako kopię zapasową na limity subskrypcji Codex. Uruchom `openclaw doctor --fix`,
aby zmigrować starszy stan uwierzytelniania/profili ze starym prefiksem OpenAI Codex do `openai`.

Przykłady:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Uwagi:

- `login` akceptuje `--profile-id <id>` dla dostawców, którzy obsługują nazwane
  profile podczas logowania. Użyj tego, aby rozdzielić wiele logowań dla tego samego
  dostawcy.
- `paste-api-key` akceptuje klucze API wygenerowane gdzie indziej, pyta o wartość klucza
  i zapisuje ją pod domyślnym identyfikatorem profilu `<provider>:manual`, chyba że
  przekażesz `--profile-id`. W automatyzacji przekaż klucz na stdin, na przykład
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` i `paste-token` pozostają ogólnymi poleceniami tokenów dla dostawców,
  którzy udostępniają metody uwierzytelniania tokenem.
- `setup-token` wymaga interaktywnego TTY i uruchamia metodę uwierzytelniania tokenem
  dostawcy (domyślnie metodę `setup-token` tego dostawcy, gdy ją udostępnia).
- `paste-token` akceptuje ciąg tokenu wygenerowany gdzie indziej lub z automatyzacji.
- `paste-token` wymaga `--provider`, domyślnie pyta o wartość tokenu
  i zapisuje ją pod domyślnym identyfikatorem profilu `<provider>:manual`, chyba że przekażesz
  `--profile-id`.
- W automatyzacji przekaż token na stdin zamiast podawać go jako argument, aby
  poświadczenia dostawcy nie pojawiały się w historii powłoki ani na listach procesów.
- `paste-token --expires-in <duration>` zapisuje bezwzględny czas wygaśnięcia tokenu z
  względnego czasu trwania, takiego jak `365d` albo `12h`.
- Dla `openai` klucze API OpenAI i materiał tokenów ChatGPT/OAuth są
  różnymi kształtami uwierzytelniania. Użyj `paste-api-key` dla kluczy API OpenAI `sk-...` oraz
  `paste-token` tylko dla materiału uwierzytelniania tokenem.
- Uwaga Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Anthropic `setup-token` / `paste-token` pozostają dostępne jako obsługiwana ścieżka tokenów OpenClaw, ale OpenClaw obecnie preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modelu](/pl/concepts/model-failover)
