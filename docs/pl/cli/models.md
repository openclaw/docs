---
read_when:
    - Chcesz zmienić domyślne modele lub wyświetlić status uwierzytelniania dostawcy
    - Chcesz przeskanować dostępne modele/dostawców i debugować profile uwierzytelniania
summary: Dokumentacja referencyjna CLI dla `openclaw models` (status/list/set/scan, aliasy, mechanizmy zapasowe, uwierzytelnianie)
title: Modele
x-i18n:
    generated_at: "2026-05-06T19:35:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7749d97382529587d54ea96466edc880a731f2c2d39eed1677e4fbf129f11435
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

`openclaw models status` pokazuje rozstrzygnięte wartości domyślne/mechanizmy awaryjne oraz przegląd uwierzytelniania.
Gdy dostępne są migawki użycia dostawców, sekcja stanu OAuth/kluczy API zawiera
okna użycia dostawców i migawki limitów.
Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi i z.ai. Uwierzytelnianie użycia pochodzi z hooków
właściwych dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw wraca do
dopasowanych poświadczeń OAuth/kluczy API z profili uwierzytelniania, env lub
konfiguracji.
W wyjściu `--json` `auth.providers` to świadomy env/konfiguracji/magazynu
przegląd dostawców, a `auth.oauth` to wyłącznie kondycja profili w magazynie
uwierzytelniania.
Dodaj `--probe`, aby uruchomić sondy uwierzytelniania na żywo dla każdego
skonfigurowanego profilu dostawcy.
Sondy to rzeczywiste żądania (mogą zużywać tokeny i wywoływać limity szybkości).
Użyj `--agent <id>`, aby sprawdzić stan modelu/uwierzytelniania skonfigurowanego agenta. Gdy pominięte,
polecenie używa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, jeśli są ustawione, a w przeciwnym razie
skonfigurowanego domyślnego agenta.
Wiersze sond mogą pochodzić z profili uwierzytelniania, poświadczeń env lub `models.json`.
Przy diagnozowaniu OAuth dla Codex, `openclaw models status`,
`openclaw models auth list --provider openai-codex` oraz
`openclaw config get agents.defaults.model --json` to najszybszy sposób na
potwierdzenie, czy agent używa `openai-codex/*` przez PI, czy `openai/*`
przez natywne środowisko uruchomieniowe Codex. Zobacz [konfigurację dostawcy OpenAI](/pl/providers/openai#check-and-recover-codex-oauth-routing).

Uwagi:

- `models set <model-or-alias>` akceptuje `provider/model` albo alias.
- `models list` jest tylko do odczytu: odczytuje konfigurację, profile uwierzytelniania, istniejący stan katalogu
  oraz wiersze katalogu należące do dostawcy, ale nie przepisuje
  `models.json`.
- Kolumna `Auth` działa na poziomie dostawcy i jest tylko do odczytu. Jest obliczana na podstawie lokalnych
  metadanych profili uwierzytelniania, markerów env, skonfigurowanych kluczy dostawców, markerów dostawców lokalnych,
  markerów env/profili AWS Bedrock oraz syntetycznych metadanych uwierzytelniania Pluginów;
  nie ładuje środowiska uruchomieniowego dostawcy, nie odczytuje sekretów z keychain, nie wywołuje
  API dostawców ani nie dowodzi dokładnej gotowości wykonania dla każdego modelu.
- `models list --all --provider <id>` może zawierać statyczne wiersze katalogu należące do dostawcy
  z manifestów Pluginów lub metadanych katalogu dostawców dołączonych w pakiecie, nawet gdy
  nie uwierzytelniono się jeszcze u tego dostawcy. Te wiersze nadal są pokazywane jako
  niedostępne, dopóki nie zostanie skonfigurowane pasujące uwierzytelnianie.
- `models list` utrzymuje szybkość reakcji płaszczyzny sterowania, gdy wykrywanie katalogu dostawców
  jest wolne. Widoki domyślne i skonfigurowane wracają do skonfigurowanych lub
  syntetycznych wierszy modeli po krótkim oczekiwaniu i pozwalają, aby wykrywanie zakończyło się w
  tle. Użyj `--all`, gdy potrzebujesz dokładnego pełnego wykrytego katalogu i
  możesz poczekać na wykrywanie dostawcy.
- Szerokie `models list --all` scala wiersze katalogu manifestu nad wierszami rejestru
  bez ładowania hooków uzupełniających środowisko uruchomieniowe dostawcy. Szybkie ścieżki manifestu
  filtrowane według dostawcy używają tylko dostawców oznaczonych jako `static`; dostawcy oznaczeni
  jako `refreshable` pozostają oparte na rejestrze/cache i dołączają wiersze manifestu jako uzupełnienia, a
  dostawcy oznaczeni jako `runtime` pozostają przy wykrywaniu przez rejestr/środowisko uruchomieniowe.
- `models list` utrzymuje natywne metadane modelu i limity środowiska uruchomieniowego jako odrębne. W wyjściu tabeli
  `Ctx` pokazuje `contextTokens/contextWindow`, gdy efektywny limit środowiska uruchomieniowego
  różni się od natywnego okna kontekstu; wiersze JSON zawierają `contextTokens`,
  gdy dostawca udostępnia ten limit.
- `models list --provider <id>` filtruje według identyfikatora dostawcy, takiego jak `moonshot` lub
  `openai-codex`. Nie akceptuje etykiet wyświetlanych z interaktywnych
  selektorów dostawców, takich jak `Moonshot AI`.
- Odwołania do modeli są parsowane przez podział na **pierwszym** `/`. Jeśli identyfikator modelu zawiera `/` (styl OpenRouter), uwzględnij prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw rozstrzyga wejście jako alias, następnie
  jako unikatowe dopasowanie skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem
  wraca do skonfigurowanego domyślnego dostawcy z ostrzeżeniem o wycofaniu.
  Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
  wraca do pierwszego skonfigurowanego dostawcy/modelu zamiast zgłaszać
  nieaktualną wartość domyślną usuniętego dostawcy.
- `models status` może pokazywać `marker(<value>)` w wyjściu uwierzytelniania dla niesekretnych symboli zastępczych (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### Skanowanie modeli

`models scan` odczytuje publiczny katalog `:free` OpenRouter i szereguje kandydatów do
użycia jako mechanizmy awaryjne. Sam katalog jest publiczny, więc skanowanie tylko metadanych nie wymaga
klucza OpenRouter.

Domyślnie OpenClaw próbuje sondować obsługę narzędzi i obrazów za pomocą wywołań modeli na żywo.
Jeśli nie skonfigurowano klucza OpenRouter, polecenie wraca do wyjścia
tylko z metadanymi i wyjaśnia, że modele `:free` nadal wymagają `OPENROUTER_API_KEY` do
sond i inferencji.

Opcje:

- `--no-probe` (tylko metadane; bez wyszukiwania konfiguracji/sekretów)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (żądanie katalogu i limit czasu dla każdej sondy)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` i `--set-image` wymagają sond na żywo; wyniki skanowania
tylko metadanych są informacyjne i nie są stosowane do konfiguracji.

### Stan modeli

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

`--json` rezerwuje stdout dla ładunku JSON. Diagnostyka profilu uwierzytelniania, dostawcy
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

Przewidywane przypadki szczegółów/kodów przyczyn sond:

- `excluded_by_auth_order`: zapisany profil istnieje, ale jawne
  `auth.order.<provider>` go pominęło, więc sonda raportuje wykluczenie zamiast
  go próbować.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil jest obecny, ale nie kwalifikuje się/nie może zostać rozstrzygnięty.
- `no_model`: uwierzytelnianie dostawcy istnieje, ale OpenClaw nie mógł rozstrzygnąć sondowalnego
  kandydata modelu dla tego dostawcy.

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
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` to interaktywny pomocnik uwierzytelniania. Może uruchomić przepływ uwierzytelniania dostawcy
(OAuth/klucz API) albo przeprowadzić przez ręczne wklejenie tokenu, w zależności od
wybranego dostawcy.

`models auth list` wyświetla zapisane profile uwierzytelniania dla wybranego agenta bez
drukowania tokenu, klucza API ani tajnych materiałów OAuth. Użyj `--provider <id>`, aby
filtrować do jednego dostawcy, takiego jak `openai-codex`, oraz `--json` do skryptów.

`models auth login` uruchamia przepływ uwierzytelniania Pluginu dostawcy (OAuth/klucz API). Użyj
`openclaw plugins list`, aby zobaczyć, którzy dostawcy są zainstalowani.
Użyj `openclaw models auth --agent <id> <subcommand>`, aby zapisać wyniki uwierzytelniania w
konkretnym magazynie skonfigurowanego agenta. Flaga nadrzędna `--agent` jest honorowana przez
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
- `setup-token` wymaga interaktywnego TTY i uruchamia metodę uwierzytelniania tokenem
  dostawcy (domyślnie metodę `setup-token` tego dostawcy, gdy ją
  udostępnia).
- `paste-token` akceptuje ciąg tokenu wygenerowany gdzie indziej lub z automatyzacji.
- `paste-token` wymaga `--provider`, pyta o wartość tokenu i zapisuje
  ją do domyślnego identyfikatora profilu `<provider>:manual`, chyba że przekażesz
  `--profile-id`.
- `paste-token --expires-in <duration>` zapisuje bezwzględny termin wygaśnięcia tokenu z
  względnego czasu trwania, takiego jak `365d` lub `12h`.
- Uwaga Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Anthropic `setup-token` / `paste-token` pozostają dostępne jako wspierana ścieżka tokenów OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Powiązane

- [Referencja CLI](/pl/cli)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modelu](/pl/concepts/model-failover)
