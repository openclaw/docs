---
read_when:
    - Chcesz zmienić domyślne modele lub wyświetlić stan uwierzytelniania dostawcy
    - Chcesz przeskanować dostępne modele/dostawców i debugować profile uwierzytelniania
summary: Dokumentacja referencyjna CLI dla `openclaw models` (status/list/set/scan, aliasy, mechanizmy rezerwowe, uwierzytelnianie)
title: Modele
x-i18n:
    generated_at: "2026-05-01T09:56:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 538d3e4808329737fdc044dc6e14e5c7c78052e75d8a8b3b257b1ebd821c84d1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Wykrywanie, skanowanie i konfiguracja modeli (model domyślny, modele awaryjne, profile uwierzytelniania).

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

`openclaw models status` pokazuje rozwiązany model domyślny/modele awaryjne oraz przegląd uwierzytelniania.
Gdy dostępne są migawki użycia dostawcy, sekcja stanu OAuth/klucza API zawiera
okna użycia dostawcy i migawki limitów.
Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi i z.ai. Uwierzytelnianie użycia pochodzi z haków specyficznych
dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw wraca do pasujących
poświadczeń OAuth/klucza API z profili uwierzytelniania, środowiska lub konfiguracji.
W wyjściu `--json` `auth.providers` jest przeglądem dostawców świadomym
środowiska/konfiguracji/magazynu, natomiast `auth.oauth` obejmuje tylko kondycję
profili magazynu uwierzytelniania.
Dodaj `--probe`, aby uruchomić sondy uwierzytelniania na żywo względem każdego skonfigurowanego profilu dostawcy.
Sondy to rzeczywiste żądania (mogą zużywać tokeny i wyzwalać limity szybkości).
Użyj `--agent <id>`, aby sprawdzić stan modelu/uwierzytelniania skonfigurowanego agenta. Gdy pominięto,
polecenie używa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, jeśli są ustawione, w przeciwnym razie
skonfigurowanego agenta domyślnego.
Wiersze sond mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`.

Uwagi:

- `models set <model-or-alias>` przyjmuje `provider/model` lub alias.
- `models list` jest tylko do odczytu: odczytuje konfigurację, profile uwierzytelniania, istniejący stan
  katalogu i wiersze katalogu należące do dostawcy, ale nie przepisuje
  `models.json`.
- Kolumna `Auth` jest na poziomie dostawcy i jest tylko do odczytu. Jest obliczana z lokalnych
  metadanych profilu uwierzytelniania, znaczników środowiska, skonfigurowanych kluczy dostawcy, znaczników
  lokalnego dostawcy, znaczników środowiska/profilu AWS Bedrock oraz metadanych syntetycznego uwierzytelniania pluginu;
  nie ładuje środowiska uruchomieniowego dostawcy, nie odczytuje sekretów z keychaina, nie wywołuje API dostawcy
  ani nie potwierdza dokładnej gotowości wykonania dla pojedynczego modelu.
- `models list --all --provider <id>` może zawierać należące do dostawcy statyczne wiersze katalogu
  z manifestów pluginów lub dołączonych metadanych katalogu dostawcy, nawet gdy
  nie uwierzytelniłeś się jeszcze u tego dostawcy. Te wiersze nadal są pokazywane jako
  niedostępne, dopóki nie zostanie skonfigurowane pasujące uwierzytelnianie.
- `models list` utrzymuje responsywność płaszczyzny sterowania, gdy odkrywanie katalogu dostawcy
  jest wolne. Widoki domyślne i skonfigurowane wracają do skonfigurowanych lub
  syntetycznych wierszy modeli po krótkim oczekiwaniu i pozwalają odkrywaniu zakończyć się w
  tle. Użyj `--all`, gdy potrzebujesz dokładnego pełnego odkrytego katalogu i
  chcesz zaczekać na odkrywanie dostawcy.
- Szerokie `models list --all` scala wiersze katalogu z manifestu nad wierszami rejestru
  bez ładowania haków uzupełniających środowiska uruchomieniowego dostawcy. Szybkie ścieżki manifestu filtrowane według dostawcy
  używają tylko dostawców oznaczonych jako `static`; dostawcy oznaczeni jako `refreshable`
  pozostają oparte na rejestrze/pamięci podręcznej i dołączają wiersze manifestu jako uzupełnienia, natomiast
  dostawcy oznaczeni jako `runtime` pozostają przy odkrywaniu z rejestru/środowiska uruchomieniowego.
- `models list` utrzymuje natywne metadane modelu i limity środowiska uruchomieniowego jako osobne wartości. W wyjściu tabelarycznym
  `Ctx` pokazuje `contextTokens/contextWindow`, gdy efektywny limit środowiska uruchomieniowego
  różni się od natywnego okna kontekstu; wiersze JSON zawierają `contextTokens`,
  gdy dostawca udostępnia ten limit.
- `models list --provider <id>` filtruje według identyfikatora dostawcy, takiego jak `moonshot` lub
  `openai-codex`. Nie przyjmuje etykiet wyświetlanych z interaktywnych
  selektorów dostawców, takich jak `Moonshot AI`.
- Referencje modeli są parsowane przez podział na **pierwszym** `/`. Jeśli ID modelu zawiera `/` (w stylu OpenRouter), dołącz prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw rozwiązuje dane wejściowe najpierw jako alias, potem
  jako unikalne dopasowanie skonfigurowanego dostawcy dla dokładnego identyfikatora modelu, a dopiero potem
  wraca do skonfigurowanego dostawcy domyślnego z ostrzeżeniem o wycofaniu.
  Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
  wraca do pierwszej skonfigurowanej pary dostawca/model zamiast pokazywać
  nieaktualny domyślny wybór usuniętego dostawcy.
- `models status` może pokazywać `marker(<value>)` w wyjściu uwierzytelniania dla niesekretnych symboli zastępczych (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### Skanowanie modeli

`models scan` odczytuje publiczny katalog `:free` OpenRouter i klasyfikuje kandydatów do
użycia awaryjnego. Sam katalog jest publiczny, więc skanowania samych metadanych nie wymagają
klucza OpenRouter.

Domyślnie OpenClaw próbuje sondować obsługę narzędzi i obrazów za pomocą wywołań modelu na żywo.
Jeśli nie skonfigurowano klucza OpenRouter, polecenie wraca do wyjścia zawierającego tylko metadane
i wyjaśnia, że modele `:free` nadal wymagają `OPENROUTER_API_KEY` do
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

`--set-default` i `--set-image` wymagają sond na żywo; wyniki skanowania tylko metadanych
mają charakter informacyjny i nie są stosowane do konfiguracji.

### Stan modeli

Opcje:

- `--json`
- `--plain`
- `--check` (kod wyjścia 1=wygasłe/brakujące, 2=wygasające)
- `--probe` (sonda na żywo skonfigurowanych profili uwierzytelniania)
- `--probe-provider <name>` (sonduj jednego dostawcę)
- `--probe-profile <id>` (powtarzalne lub rozdzielone przecinkami identyfikatory profili)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identyfikator skonfigurowanego agenta; zastępuje `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` rezerwuje stdout dla ładunku JSON. Diagnostyka profili uwierzytelniania, dostawcy
i uruchamiania jest kierowana do stderr, aby skrypty mogły przekazywać stdout bezpośrednio
do narzędzi takich jak `jq`.

Koszyki stanu sond:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Oczekiwane przypadki szczegółów/kodów przyczyny sondy:

- `excluded_by_auth_order`: zapisany profil istnieje, ale jawne
  `auth.order.<provider>` go pominęło, więc sonda zgłasza wykluczenie zamiast
  próbować go użyć.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil jest obecny, ale nie kwalifikuje się lub nie da się go rozwiązać.
- `no_model`: uwierzytelnianie dostawcy istnieje, ale OpenClaw nie mógł rozwiązać kandydata
  modelu możliwego do sondowania dla tego dostawcy.

## Aliasy + modele awaryjne

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profile uwierzytelniania

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` to interaktywny pomocnik uwierzytelniania. Może uruchomić przepływ uwierzytelniania
dostawcy (OAuth/klucz API) albo poprowadzić Cię przez ręczne wklejenie tokenu, zależnie od
wybranego dostawcy.

`models auth login` uruchamia przepływ uwierzytelniania pluginu dostawcy (OAuth/klucz API). Użyj
`openclaw plugins list`, aby zobaczyć, którzy dostawcy są zainstalowani.
Użyj `openclaw models auth --agent <id> <subcommand>`, aby zapisać wyniki uwierzytelniania do
magazynu konkretnego skonfigurowanego agenta. Flaga nadrzędna `--agent` jest respektowana przez
`add`, `login`, `setup-token`, `paste-token` i `login-github-copilot`.

Przykłady:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Uwagi:

- `setup-token` i `paste-token` pozostają ogólnymi poleceniami tokenów dla dostawców,
  którzy udostępniają metody uwierzytelniania tokenem.
- `setup-token` wymaga interaktywnego TTY i uruchamia metodę uwierzytelniania tokenem dostawcy
  (domyślnie metodę `setup-token` tego dostawcy, gdy ją udostępnia).
- `paste-token` przyjmuje ciąg tokenu wygenerowany gdzie indziej lub z automatyzacji.
- `paste-token` wymaga `--provider`, prosi o wartość tokenu i zapisuje
  ją do domyślnego identyfikatora profilu `<provider>:manual`, chyba że przekażesz
  `--profile-id`.
- `paste-token --expires-in <duration>` zapisuje bezwzględny czas wygaśnięcia tokenu na podstawie
  względnego czasu trwania, takiego jak `365d` lub `12h`.
- Uwaga Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Anthropic `setup-token` / `paste-token` pozostają dostępne jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
