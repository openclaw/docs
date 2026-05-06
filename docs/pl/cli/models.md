---
read_when:
    - Chcesz zmienić domyślne modele lub wyświetlić status uwierzytelniania dostawcy
    - Chcesz przeskanować dostępne modele/dostawców i diagnozować profile uwierzytelniania
summary: Dokumentacja referencyjna CLI dla `openclaw models` (status/list/set/scan, aliasy, mechanizmy awaryjne, uwierzytelnianie)
title: Modele
x-i18n:
    generated_at: "2026-05-06T09:05:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7a1cce7b1b21411540238b1858580a56b2271d54d0898e261b69bd21f88c0f5
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Wykrywanie, skanowanie i konfiguracja modeli (model domyślny, modele rezerwowe, profile uwierzytelniania).

Powiązane:

- Dostawcy i modele: [Modele](/pl/providers/models)
- Pojęcia wyboru modelu i polecenie ukośnikowe `/models`: [Pojęcie modeli](/pl/concepts/models)
- Konfiguracja uwierzytelniania dostawcy: [Pierwsze kroki](/pl/start/getting-started)

## Typowe polecenia

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` pokazuje ustalone wartości domyślne i rezerwowe oraz przegląd uwierzytelniania.
Gdy dostępne są migawki użycia dostawców, sekcja statusu OAuth/klucza API zawiera
okna użycia dostawców i migawki limitów.
Bieżący dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi i z.ai. Uwierzytelnianie użycia pochodzi z haków
specyficznych dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw przechodzi
na pasujące dane uwierzytelniające OAuth/klucza API z profili uwierzytelniania,
środowiska lub konfiguracji.
W wyjściu `--json` `auth.providers` to przegląd dostawców uwzględniający
środowisko/konfigurację/magazyn, a `auth.oauth` to wyłącznie kondycja profili
w magazynie uwierzytelniania.
Dodaj `--probe`, aby uruchomić testy uwierzytelniania na żywo dla każdego skonfigurowanego profilu dostawcy.
Testy to rzeczywiste żądania (mogą zużywać tokeny i wywołać limity częstotliwości).
Użyj `--agent <id>`, aby sprawdzić stan modelu/uwierzytelniania skonfigurowanego agenta. Jeśli pominięto,
polecenie używa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, gdy są ustawione, w przeciwnym razie
skonfigurowanego domyślnego agenta.
Wiersze testów mogą pochodzić z profili uwierzytelniania, danych uwierzytelniających środowiska lub `models.json`.

Uwagi:

- `models set <model-or-alias>` przyjmuje `provider/model` albo alias.
- `models list` jest tylko do odczytu: odczytuje konfigurację, profile uwierzytelniania, istniejący stan katalogu
  i wiersze katalogu należące do dostawcy, ale nie nadpisuje
  `models.json`.
- Kolumna `Auth` jest na poziomie dostawcy i tylko do odczytu. Jest obliczana z lokalnych
  metadanych profilu uwierzytelniania, znaczników środowiska, skonfigurowanych kluczy dostawców, znaczników
  lokalnych dostawców, znaczników środowiska/profilu AWS Bedrock oraz syntetycznych metadanych uwierzytelniania Plugin;
  nie ładuje środowiska uruchomieniowego dostawcy, nie odczytuje sekretów z pęku kluczy, nie wywołuje
  API dostawcy ani nie potwierdza dokładnej gotowości wykonania dla poszczególnych modeli.
- `models list --all --provider <id>` może zawierać statyczne wiersze katalogu należące do dostawcy
  z manifestów Plugin lub dołączonych metadanych katalogu dostawcy, nawet gdy
  nie uwierzytelniono się jeszcze u tego dostawcy. Te wiersze nadal są pokazywane jako
  niedostępne, dopóki nie zostanie skonfigurowane pasujące uwierzytelnianie.
- `models list` utrzymuje responsywność warstwy sterowania, gdy wykrywanie katalogu dostawcy
  jest powolne. Widoki domyślne i skonfigurowane po krótkim oczekiwaniu przechodzą na skonfigurowane
  lub syntetyczne wiersze modeli i pozwalają, aby wykrywanie zakończyło się w tle.
  Użyj `--all`, gdy potrzebujesz dokładnego, pełnego wykrytego katalogu i
  możesz poczekać na wykrywanie dostawcy.
- Szerokie `models list --all` scala wiersze katalogu manifestu nad wierszami rejestru
  bez ładowania haków uzupełniających środowiska uruchomieniowego dostawcy. Szybkie ścieżki manifestu filtrowane według dostawcy
  używają tylko dostawców oznaczonych jako `static`; dostawcy oznaczeni jako `refreshable`
  pozostają oparci na rejestrze/pamięci podręcznej i dołączają wiersze manifestu jako uzupełnienia, a
  dostawcy oznaczeni jako `runtime` pozostają przy wykrywaniu rejestru/środowiska uruchomieniowego.
- `models list` rozdziela natywne metadane modelu od ograniczeń środowiska uruchomieniowego. W wyjściu tabelarycznym
  `Ctx` pokazuje `contextTokens/contextWindow`, gdy efektywne ograniczenie środowiska uruchomieniowego
  różni się od natywnego okna kontekstu; wiersze JSON zawierają `contextTokens`,
  gdy dostawca udostępnia takie ograniczenie.
- `models list --provider <id>` filtruje według identyfikatora dostawcy, takiego jak `moonshot` lub
  `openai-codex`. Nie przyjmuje etykiet wyświetlanych w interaktywnych selektorach dostawców,
  takich jak `Moonshot AI`.
- Odwołania do modeli są analizowane przez podział po **pierwszym** `/`. Jeśli identyfikator modelu zawiera `/` (w stylu OpenRouter), dodaj prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw rozwiązuje dane wejściowe jako alias, potem
  jako unikatowe dopasowanie skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem
  przechodzi na skonfigurowanego dostawcę domyślnego z ostrzeżeniem o wycofaniu.
  Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
  przechodzi na pierwszego skonfigurowanego dostawcę/model zamiast zgłaszać
  nieaktualną wartość domyślną usuniętego dostawcy.
- `models status` może pokazywać `marker(<value>)` w wyjściu uwierzytelniania dla niesekretnych symboli zastępczych (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### Skanowanie modeli

`models scan` odczytuje publiczny katalog `:free` OpenRouter i szereguje kandydatów do
użycia jako modele rezerwowe. Sam katalog jest publiczny, więc skanowanie obejmujące tylko metadane nie wymaga
klucza OpenRouter.

Domyślnie OpenClaw próbuje testować obsługę narzędzi i obrazów za pomocą wywołań modeli na żywo.
Jeśli nie skonfigurowano klucza OpenRouter, polecenie przechodzi na wyjście obejmujące tylko metadane
i wyjaśnia, że modele `:free` nadal wymagają `OPENROUTER_API_KEY` do
testów i inferencji.

Opcje:

- `--no-probe` (tylko metadane; bez wyszukiwania konfiguracji/sekretów)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (limit czasu żądania katalogu i każdego testu)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` i `--set-image` wymagają testów na żywo; wyniki skanowania obejmujące tylko metadane
mają charakter informacyjny i nie są stosowane w konfiguracji.

### Status modeli

Opcje:

- `--json`
- `--plain`
- `--check` (kod wyjścia 1=wygasłe/brakujące, 2=wygasające)
- `--probe` (test na żywo skonfigurowanych profili uwierzytelniania)
- `--probe-provider <name>` (test jednego dostawcy)
- `--probe-profile <id>` (powtarzalne albo rozdzielone przecinkami identyfikatory profili)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identyfikator skonfigurowanego agenta; zastępuje `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` zachowuje stdout wyłącznie dla ładunku JSON. Diagnostyka profili uwierzytelniania, dostawcy
i uruchamiania jest kierowana do stderr, aby skrypty mogły przekazywać stdout bezpośrednio
do narzędzi takich jak `jq`.

Kategorie statusu testu:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Oczekiwane przypadki szczegółów/kodów przyczyny testu:

- `excluded_by_auth_order`: zapisany profil istnieje, ale jawne
  `auth.order.<provider>` go pominęło, więc test zgłasza wykluczenie zamiast
  go próbować.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil jest obecny, ale nie kwalifikuje się / nie można go rozwiązać.
- `no_model`: uwierzytelnianie dostawcy istnieje, ale OpenClaw nie mógł rozwiązać kandydata modelu
  możliwego do przetestowania dla tego dostawcy.

## Aliasy i modele rezerwowe

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
(OAuth/klucz API) albo poprowadzić Cię przez ręczne wklejenie tokenu, zależnie od
wybranego dostawcy.

`models auth list` wyświetla zapisane profile uwierzytelniania dla wybranego agenta bez
drukowania tokenu, klucza API ani tajnych materiałów OAuth. Użyj `--provider <id>`, aby
filtrować do jednego dostawcy, takiego jak `openai-codex`, oraz `--json` do skryptów.

`models auth login` uruchamia przepływ uwierzytelniania Plugin dostawcy (OAuth/klucz API). Użyj
`openclaw plugins list`, aby zobaczyć, którzy dostawcy są zainstalowani.
Użyj `openclaw models auth --agent <id> <subcommand>`, aby zapisać wyniki uwierzytelniania w
magazynie konkretnego skonfigurowanego agenta. Nadrzędna flaga `--agent` jest honorowana przez
`add`, `list`, `login`, `setup-token`, `paste-token` i
`login-github-copilot`.

Przykłady:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Uwagi:

- `setup-token` i `paste-token` pozostają ogólnymi poleceniami tokenów dla dostawców,
  którzy udostępniają metody uwierzytelniania tokenem.
- `setup-token` wymaga interaktywnego TTY i uruchamia metodę uwierzytelniania tokenem dostawcy
  (domyślnie metodę `setup-token` tego dostawcy, gdy ją udostępnia).
- `paste-token` przyjmuje ciąg tokenu wygenerowany gdzie indziej albo przez automatyzację.
- `paste-token` wymaga `--provider`, pyta o wartość tokenu i zapisuje
  ją pod domyślnym identyfikatorem profilu `<provider>:manual`, chyba że przekażesz
  `--profile-id`.
- `paste-token --expires-in <duration>` zapisuje bezwzględny czas wygaśnięcia tokenu z
  względnego czasu trwania, takiego jak `365d` lub `12h`.
- Uwaga Anthropic: pracownicy Anthropic przekazali nam, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako dopuszczone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Anthropic `setup-token` / `paste-token` pozostają dostępne jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modelu](/pl/concepts/model-failover)
