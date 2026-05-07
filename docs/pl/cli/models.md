---
read_when:
    - Chcesz zmienić domyślne modele lub wyświetlić status uwierzytelniania dostawcy
    - Chcesz przeskanować dostępne modele/dostawców i debugować profile uwierzytelniania
summary: Dokumentacja referencyjna CLI dla `openclaw models` (status/list/set/scan, aliasy, mechanizmy zastępcze, uwierzytelnianie)
title: Modele
x-i18n:
    generated_at: "2026-05-07T13:14:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e1a7a9304f9d03d11e38262487eae4f0cf8d7e0be7ca71bcc208030784728bf
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Wykrywanie, skanowanie i konfiguracja modeli (model domyślny, modele zapasowe, profile uwierzytelniania).

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

`openclaw models status` pokazuje rozwiązany model domyślny/modele zapasowe oraz przegląd uwierzytelniania.
Gdy migawki użycia dostawców są dostępne, sekcja statusu OAuth/klucza API zawiera
okna użycia dostawców oraz migawki limitów.
Bieżący dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi i z.ai. Uwierzytelnianie użycia pochodzi z haków specyficznych
dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw wraca do pasujących
poświadczeń OAuth/klucza API z profili uwierzytelniania, env lub konfiguracji.
W wyjściu `--json` `auth.providers` to uwzględniający env/konfigurację/magazyn
przegląd dostawców, a `auth.oauth` to wyłącznie kondycja profili magazynu uwierzytelniania.
Dodaj `--probe`, aby uruchomić sondy uwierzytelniania na żywo względem każdego skonfigurowanego profilu dostawcy.
Sondy to rzeczywiste żądania (mogą zużywać tokeny i uruchamiać limity szybkości).
Użyj `--agent <id>`, aby sprawdzić stan modelu/uwierzytelniania skonfigurowanego agenta. Jeśli pominięto,
polecenie używa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, jeśli są ustawione, w przeciwnym razie
skonfigurowanego agenta domyślnego.
Wiersze sond mogą pochodzić z profili uwierzytelniania, poświadczeń env lub `models.json`.
Do rozwiązywania problemów z OAuth dla Codex najszybszym sposobem potwierdzenia,
czy agent ma użyteczny profil uwierzytelniania `openai-codex` dla
`openai/*` przez natywne środowisko wykonawcze Codex, są `openclaw models status`,
`openclaw models auth list --provider openai-codex` oraz
`openclaw config get agents.defaults.model --json`. Zobacz [Konfiguracja dostawcy OpenAI](/pl/providers/openai#check-and-recover-codex-oauth-routing).

Uwagi:

- `models set <model-or-alias>` akceptuje `provider/model` lub alias.
- `models list` jest tylko do odczytu: odczytuje konfigurację, profile uwierzytelniania, istniejący stan katalogu
  i wiersze katalogu należące do dostawcy, ale nie przepisuje
  `models.json`.
- Kolumna `Auth` działa na poziomie dostawcy i jest tylko do odczytu. Jest obliczana z lokalnych
  metadanych profili uwierzytelniania, znaczników env, skonfigurowanych kluczy dostawców, znaczników
  dostawców lokalnych, znaczników env/profili AWS Bedrock oraz syntetycznych metadanych uwierzytelniania plugin;
  nie ładuje środowiska wykonawczego dostawcy, nie odczytuje sekretów z pęku kluczy, nie wywołuje
  interfejsów API dostawcy ani nie dowodzi dokładnej gotowości wykonywania dla poszczególnych modeli.
- `models list --all --provider <id>` może obejmować należące do dostawcy statyczne wiersze katalogu
  z manifestów plugin lub dołączonych metadanych katalogu dostawcy, nawet gdy
  nie uwierzytelniłeś się jeszcze u tego dostawcy. Te wiersze nadal są pokazywane jako
  niedostępne, dopóki nie zostanie skonfigurowane pasujące uwierzytelnianie.
- `models list` utrzymuje responsywność płaszczyzny sterowania, gdy wykrywanie katalogu dostawcy
  jest wolne. Widoki domyślne i skonfigurowane po krótkim oczekiwaniu wracają do skonfigurowanych lub
  syntetycznych wierszy modeli i pozwalają wykrywaniu dokończyć się w
  tle. Użyj `--all`, gdy potrzebujesz dokładnego pełnego wykrytego katalogu i
  jesteś gotów poczekać na wykrywanie dostawcy.
- Szerokie `models list --all` scala wiersze katalogu manifestu nad wierszami rejestru
  bez ładowania haków uzupełnień środowiska wykonawczego dostawcy. Szybkie ścieżki manifestu filtrowane według dostawcy
  używają tylko dostawców oznaczonych jako `static`; dostawcy oznaczeni jako `refreshable`
  pozostają oparte na rejestrze/pamięci podręcznej i dołączają wiersze manifestu jako uzupełnienia, a
  dostawcy oznaczeni jako `runtime` pozostają przy wykrywaniu rejestrowym/środowiska wykonawczego.
- `models list` rozdziela natywne metadane modelu i limity środowiska wykonawczego. W wyjściu tabelarycznym
  `Ctx` pokazuje `contextTokens/contextWindow`, gdy efektywny limit środowiska wykonawczego
  różni się od natywnego okna kontekstu; wiersze JSON zawierają `contextTokens`,
  gdy dostawca udostępnia ten limit.
- `models list --provider <id>` filtruje według identyfikatora dostawcy, takiego jak `moonshot` lub
  `openai-codex`. Nie akceptuje etykiet wyświetlanych z interaktywnych selektorów dostawców,
  takich jak `Moonshot AI`.
- Odwołania do modeli są analizowane przez podział przy **pierwszym** `/`. Jeśli identyfikator modelu zawiera `/` (styl OpenRouter), dołącz prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw rozwiązuje wejście jako alias, potem
  jako unikalne dopasowanie skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem
  wraca do skonfigurowanego dostawcy domyślnego z ostrzeżeniem o wycofaniu.
  Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
  wraca do pierwszego skonfigurowanego dostawcy/modelu zamiast zgłaszać
  nieaktualny domyślny wybór usuniętego dostawcy.
- `models status` może pokazywać `marker(<value>)` w wyjściu uwierzytelniania dla niesekretnych symboli zastępczych (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### Skanowanie modeli

`models scan` odczytuje publiczny katalog `:free` OpenRouter i klasyfikuje kandydatów do
użycia jako modele zapasowe. Sam katalog jest publiczny, więc skanowania tylko metadanych nie wymagają
klucza OpenRouter.

Domyślnie OpenClaw próbuje sondować obsługę narzędzi i obrazów za pomocą wywołań modeli na żywo.
Jeśli nie skonfigurowano klucza OpenRouter, polecenie wraca do wyjścia tylko z metadanymi
i wyjaśnia, że modele `:free` nadal wymagają `OPENROUTER_API_KEY` do
sond i wnioskowania.

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

`--set-default` i `--set-image` wymagają sond na żywo; wyniki skanowania
tylko metadanych są informacyjne i nie są stosowane do konfiguracji.

### Status modeli

Opcje:

- `--json`
- `--plain`
- `--check` (kod wyjścia 1=wygasłe/brakujące, 2=wygasające)
- `--probe` (sonda na żywo skonfigurowanych profili uwierzytelniania)
- `--probe-provider <name>` (sonduj jednego dostawcę)
- `--probe-profile <id>` (powtarzane lub rozdzielone przecinkami identyfikatory profili)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identyfikator skonfigurowanego agenta; zastępuje `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` rezerwuje stdout dla ładunku JSON. Diagnostyka profili uwierzytelniania, dostawców
i uruchamiania jest kierowana do stderr, dzięki czemu skrypty mogą przekazywać stdout bezpośrednio
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

Oczekiwane przypadki szczegółów/kodów przyczyny sondy:

- `excluded_by_auth_order`: zapisany profil istnieje, ale jawne
  `auth.order.<provider>` go pominęło, więc sonda zgłasza wykluczenie zamiast
  go próbować.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil jest obecny, ale nie kwalifikuje się/nie można go rozwiązać.
- `no_model`: uwierzytelnianie dostawcy istnieje, ale OpenClaw nie mógł rozwiązać kandydata
  modelu możliwego do sondowania dla tego dostawcy.

## Aliasy + modele zapasowe

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

`models auth add` to interaktywny pomocnik uwierzytelniania. Może uruchomić przepływ uwierzytelniania
dostawcy (OAuth/klucz API) albo poprowadzić cię do ręcznego wklejenia tokenu, zależnie od
wybranego dostawcy.

`models auth list` wypisuje zapisane profile uwierzytelniania dla wybranego agenta bez
drukowania tokenu, klucza API ani sekretnego materiału OAuth. Użyj `--provider <id>`, aby
odfiltrować do jednego dostawcy, takiego jak `openai-codex`, oraz `--json` do skryptów.

`models auth login` uruchamia przepływ uwierzytelniania plugin dostawcy (OAuth/klucz API). Użyj
`openclaw plugins list`, aby zobaczyć, którzy dostawcy są zainstalowani.
Użyj `openclaw models auth --agent <id> <subcommand>`, aby zapisać wyniki uwierzytelniania w
magazynie konkretnego skonfigurowanego agenta. Nadrzędna flaga `--agent` jest honorowana przez
`add`, `list`, `login`, `setup-token`, `paste-token` oraz
`login-github-copilot`.

Przykłady:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Uwagi:

- `setup-token` i `paste-token` pozostają generycznymi poleceniami tokenów dla dostawców,
  którzy udostępniają metody uwierzytelniania tokenem.
- `setup-token` wymaga interaktywnego TTY i uruchamia metodę uwierzytelniania tokenem dostawcy
  (domyślnie metodę `setup-token` tego dostawcy, gdy ją udostępnia).
- `paste-token` akceptuje ciąg tokenu wygenerowany gdzie indziej lub z automatyzacji.
- `paste-token` wymaga `--provider`, pyta o wartość tokenu i zapisuje
  ją do domyślnego identyfikatora profilu `<provider>:manual`, chyba że przekażesz
  `--profile-id`.
- `paste-token --expires-in <duration>` zapisuje bezwzględny termin wygaśnięcia tokenu z
  względnego czasu trwania, takiego jak `365d` lub `12h`.
- Uwaga Anthropic: pracownicy Anthropic powiedzieli nam, że użycie w stylu OpenClaw z Claude CLI jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Anthropic `setup-token` / `paste-token` pozostają dostępne jako obsługiwana ścieżka tokenów OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
