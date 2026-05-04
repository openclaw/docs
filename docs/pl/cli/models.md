---
read_when:
    - Chcesz zmienić modele domyślne lub wyświetlić stan uwierzytelniania dostawcy
    - Chcesz przeskanować dostępne modele/dostawców i debugować profile uwierzytelniania
summary: Dokumentacja referencyjna CLI dla `openclaw models` (status/list/set/scan, aliasy, mechanizmy awaryjne, uwierzytelnianie)
title: Modele
x-i18n:
    generated_at: "2026-05-04T18:23:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc7842f02e29aa0ac2ae88f3d42bba71f1890a58ab22d818dbee0585bc562fea
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

`openclaw models status` pokazuje rozstrzygnięty model domyślny/modele awaryjne oraz przegląd uwierzytelniania.
Gdy dostępne są migawki użycia dostawców, sekcja statusu OAuth/klucza API zawiera
okna użycia dostawców i migawki limitów.
Bieżący dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi i z.ai. Uwierzytelnianie użycia pochodzi z hooków specyficznych dla dostawcy,
gdy są dostępne; w przeciwnym razie OpenClaw wraca do pasujących poświadczeń
OAuth/klucza API z profili uwierzytelniania, zmiennych środowiskowych lub konfiguracji.
W wyjściu `--json` `auth.providers` jest przeglądem dostawców świadomym
środowiska/konfiguracji/magazynu, a `auth.oauth` pokazuje tylko kondycję profili
w magazynie uwierzytelniania.
Dodaj `--probe`, aby uruchomić sondy uwierzytelniania na żywo wobec każdego skonfigurowanego profilu dostawcy.
Sondy to rzeczywiste żądania (mogą zużywać tokeny i wywoływać limity szybkości).
Użyj `--agent <id>`, aby sprawdzić stan modelu/uwierzytelniania skonfigurowanego agenta. Jeśli pominięto,
polecenie używa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, jeśli są ustawione, w przeciwnym razie
skonfigurowanego domyślnego agenta.
Wiersze sond mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`.

Uwagi:

- `models set <model-or-alias>` akceptuje `provider/model` albo alias.
- `models list` jest tylko do odczytu: odczytuje konfigurację, profile uwierzytelniania, istniejący stan katalogu
  oraz wiersze katalogu należące do dostawców, ale nie nadpisuje
  `models.json`.
- Kolumna `Auth` działa na poziomie dostawcy i jest tylko do odczytu. Jest obliczana na podstawie lokalnych
  metadanych profili uwierzytelniania, znaczników środowiska, skonfigurowanych kluczy dostawców, znaczników dostawców lokalnych,
  znaczników środowiska/profilu AWS Bedrock oraz syntetycznych metadanych uwierzytelniania Plugin;
  nie ładuje runtime dostawcy, nie odczytuje sekretów z keychaina, nie wywołuje API dostawcy
  ani nie potwierdza dokładnej gotowości wykonywania dla poszczególnych modeli.
- `models list --all --provider <id>` może zawierać należące do dostawcy statyczne wiersze katalogu
  z manifestów Plugin lub metadanych katalogu dołączonego dostawcy, nawet gdy
  nie uwierzytelniłeś się jeszcze u tego dostawcy. Te wiersze nadal będą widoczne jako
  niedostępne, dopóki nie zostanie skonfigurowane pasujące uwierzytelnianie.
- `models list` utrzymuje responsywność płaszczyzny sterowania, gdy wykrywanie katalogu dostawcy
  jest wolne. Widoki domyślne i skonfigurowane wracają do skonfigurowanych lub
  syntetycznych wierszy modeli po krótkim oczekiwaniu i pozwalają wykrywaniu zakończyć się
  w tle. Użyj `--all`, gdy potrzebujesz dokładnego, pełnego wykrytego katalogu i
  możesz poczekać na wykrywanie dostawców.
- Szerokie `models list --all` scala wiersze katalogu manifestu ponad wierszami rejestru
  bez ładowania hooków uzupełniających runtime dostawcy. Szybkie ścieżki manifestu filtrowane według dostawcy
  używają tylko dostawców oznaczonych jako `static`; dostawcy oznaczeni jako `refreshable`
  pozostają oparte na rejestrze/pamięci podręcznej i dołączają wiersze manifestu jako uzupełnienia, a
  dostawcy oznaczeni jako `runtime` pozostają przy wykrywaniu przez rejestr/runtime.
- `models list` rozdziela natywne metadane modelu i limity runtime. W wyjściu tabelarycznym
  `Ctx` pokazuje `contextTokens/contextWindow`, gdy efektywny limit runtime
  różni się od natywnego okna kontekstu; wiersze JSON zawierają `contextTokens`,
  gdy dostawca ujawnia ten limit.
- `models list --provider <id>` filtruje według identyfikatora dostawcy, takiego jak `moonshot` lub
  `openai-codex`. Nie akceptuje etykiet wyświetlanych z interaktywnych selektorów dostawców,
  takich jak `Moonshot AI`.
- Referencje modeli są parsowane przez podział przy **pierwszym** `/`. Jeśli ID modelu zawiera `/` (styl OpenRouter), podaj prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw rozstrzyga dane wejściowe jako alias, potem
  jako unikalne dopasowanie skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem
  wraca do skonfigurowanego domyślnego dostawcy z ostrzeżeniem o przestarzałym użyciu.
  Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
  wraca do pierwszej skonfigurowanej pary dostawca/model zamiast pokazywać
  nieaktualny domyślny model usuniętego dostawcy.
- `models status` może pokazywać `marker(<value>)` w wyjściu uwierzytelniania dla niesekretnych placeholderów (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### Skanowanie modeli

`models scan` odczytuje publiczny katalog `:free` OpenRouter i szereguje kandydatów do
użycia awaryjnego. Sam katalog jest publiczny, więc skany wyłącznie metadanych nie wymagają
klucza OpenRouter.

Domyślnie OpenClaw próbuje sondować obsługę narzędzi i obrazów za pomocą wywołań modeli na żywo.
Jeśli nie skonfigurowano klucza OpenRouter, polecenie wraca do wyjścia wyłącznie metadanych
i wyjaśnia, że modele `:free` nadal wymagają `OPENROUTER_API_KEY` do
sond i inferencji.

Opcje:

- `--no-probe` (tylko metadane; bez wyszukiwania konfiguracji/sekretów)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (żądanie katalogu i limit czasu każdej sondy)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` i `--set-image` wymagają sond na żywo; wyniki skanu wyłącznie metadanych
mają charakter informacyjny i nie są stosowane do konfiguracji.

### Status modeli

Opcje:

- `--json`
- `--plain`
- `--check` (kod wyjścia 1=wygasłe/brakujące, 2=wygasające)
- `--probe` (sonda na żywo skonfigurowanych profili uwierzytelniania)
- `--probe-provider <name>` (sonduj jednego dostawcę)
- `--probe-profile <id>` (powtarzalne lub oddzielone przecinkami identyfikatory profili)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identyfikator skonfigurowanego agenta; zastępuje `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` rezerwuje stdout dla ładunku JSON. Diagnostyka profilu uwierzytelniania, dostawcy
i uruchamiania jest kierowana do stderr, aby skrypty mogły przekazywać stdout bezpośrednio
do narzędzi takich jak `jq`.

Koszyki statusu sondy:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Przypadki szczegółów/kodów przyczyny sondy, których można się spodziewać:

- `excluded_by_auth_order`: istnieje zapisany profil, ale jawne
  `auth.order.<provider>` go pominęło, więc sonda zgłasza wykluczenie zamiast
  go próbować.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil jest obecny, ale nie kwalifikuje się lub nie da się go rozstrzygnąć.
- `no_model`: uwierzytelnianie dostawcy istnieje, ale OpenClaw nie mógł rozstrzygnąć
  kandydata na model możliwy do sondowania dla tego dostawcy.

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
(OAuth/klucz API) lub poprowadzić do ręcznego wklejenia tokena, zależnie od
wybranego dostawcy.

`models auth list` wyświetla zapisane profile uwierzytelniania dla wybranego agenta bez
drukowania tokena, klucza API ani tajnych materiałów OAuth. Użyj `--provider <id>`, aby
odfiltrować do jednego dostawcy, takiego jak `openai-codex`, oraz `--json` do skryptów.

`models auth login` uruchamia przepływ uwierzytelniania Plugin dostawcy (OAuth/klucz API). Użyj
`openclaw plugins list`, aby zobaczyć, którzy dostawcy są zainstalowani.
Użyj `openclaw models auth --agent <id> <subcommand>`, aby zapisać wyniki uwierzytelniania do
magazynu konkretnego skonfigurowanego agenta. Flaga nadrzędna `--agent` jest respektowana przez
`add`, `list`, `login`, `setup-token`, `paste-token` oraz
`login-github-copilot`.

Przykłady:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Uwagi:

- `setup-token` i `paste-token` pozostają ogólnymi poleceniami tokenów dla dostawców,
  którzy udostępniają metody uwierzytelniania tokenem.
- `setup-token` wymaga interaktywnego TTY i uruchamia metodę token-auth dostawcy
  (domyślnie metodę `setup-token` tego dostawcy, gdy ją udostępnia).
- `paste-token` akceptuje ciąg tokena wygenerowany gdzie indziej lub z automatyzacji.
- `paste-token` wymaga `--provider`, pyta o wartość tokena i zapisuje
  ją pod domyślnym identyfikatorem profilu `<provider>:manual`, chyba że podasz
  `--profile-id`.
- `paste-token --expires-in <duration>` zapisuje bezwzględny czas wygaśnięcia tokena na podstawie
  względnego czasu trwania, takiego jak `365d` lub `12h`.
- Uwaga Anthropic: pracownicy Anthropic przekazali nam, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako dozwolone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Anthropic `setup-token` / `paste-token` pozostają dostępne jako obsługiwana ścieżka tokena OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
