---
read_when:
    - Chcesz zmienić domyślne modele lub wyświetlić status uwierzytelniania dostawcy
    - Chcesz przeskanować dostępne modele/dostawców i debugować profile uwierzytelniania
summary: Dokumentacja referencyjna CLI dla `openclaw models` (status/list/set/scan, aliasy, mechanizmy zastępcze, uwierzytelnianie)
title: Modele
x-i18n:
    generated_at: "2026-04-30T09:44:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95e2361989b583f7f52947dad1faaaba44dc6a5f58719cc2e83c13fce7c33adc
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Wykrywanie, skanowanie i konfiguracja modeli (model domyślny, modele zastępcze, profile uwierzytelniania).

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

`openclaw models status` pokazuje rozstrzygnięty model domyślny/modele zastępcze oraz przegląd uwierzytelniania.
Gdy dostępne są migawki użycia dostawców, sekcja statusu OAuth/klucza API zawiera
okna użycia dostawców i migawki limitów.
Obecni dostawcy z oknami użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi i z.ai. Uwierzytelnianie użycia pochodzi z hooków właściwych
dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw przechodzi do pasujących
danych uwierzytelniających OAuth/klucza API z profili uwierzytelniania, env lub konfiguracji.
W wyjściu `--json` `auth.providers` to przegląd dostawców świadomy env/konfiguracji/magazynu,
natomiast `auth.oauth` to wyłącznie kondycja profili magazynu uwierzytelniania.
Dodaj `--probe`, aby uruchomić sondy uwierzytelniania na żywo wobec każdego skonfigurowanego profilu dostawcy.
Sondy są rzeczywistymi żądaniami (mogą zużywać tokeny i wyzwalać limity szybkości).
Użyj `--agent <id>`, aby sprawdzić stan modelu/uwierzytelniania skonfigurowanego agenta. Gdy pominięte,
polecenie używa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, jeśli są ustawione, a w przeciwnym razie
skonfigurowanego agenta domyślnego.
Wiersze sond mogą pochodzić z profili uwierzytelniania, danych uwierzytelniających env lub `models.json`.

Uwagi:

- `models set <model-or-alias>` akceptuje `provider/model` albo alias.
- `models list` jest tylko do odczytu: odczytuje konfigurację, profile uwierzytelniania, istniejący stan katalogu
  oraz wiersze katalogu należące do dostawcy, ale nie przepisuje
  `models.json`.
- Kolumna `Auth` jest na poziomie dostawcy i jest tylko do odczytu. Jest obliczana na podstawie lokalnych
  metadanych profilu uwierzytelniania, znaczników env, skonfigurowanych kluczy dostawcy, znaczników lokalnego dostawcy,
  znaczników env/profilu AWS Bedrock oraz syntetycznych metadanych uwierzytelniania Plugin;
  nie ładuje runtime dostawcy, nie odczytuje sekretów z keychain, nie wywołuje
  API dostawcy ani nie dowodzi dokładnej gotowości wykonania dla poszczególnych modeli.
- `models list --all --provider <id>` może obejmować statyczne wiersze katalogu należące do dostawcy
  z manifestów Plugin lub dołączonych metadanych katalogu dostawcy, nawet jeśli
  nie uwierzytelniono się jeszcze u tego dostawcy. Te wiersze nadal są pokazywane jako
  niedostępne, dopóki nie skonfiguruje się pasującego uwierzytelniania.
- Szerokie `models list --all` scala wiersze katalogu manifestu nad wierszami rejestru
  bez ładowania hooków uzupełniania runtime dostawcy. Szybkie ścieżki manifestu filtrowane po dostawcy
  używają tylko dostawców oznaczonych jako `static`; dostawcy oznaczeni jako `refreshable`
  pozostają oparte na rejestrze/pamięci podręcznej i dołączają wiersze manifestu jako uzupełnienia, natomiast
  dostawcy oznaczeni jako `runtime` pozostają przy wykrywaniu z rejestru/runtime.
- `models list` utrzymuje natywne metadane modelu i limity runtime oddzielnie. W wyjściu tabelarycznym
  `Ctx` pokazuje `contextTokens/contextWindow`, gdy efektywny limit runtime
  różni się od natywnego okna kontekstu; wiersze JSON zawierają `contextTokens`,
  gdy dostawca ujawnia ten limit.
- `models list --provider <id>` filtruje według identyfikatora dostawcy, takiego jak `moonshot` lub
  `openai-codex`. Nie akceptuje etykiet wyświetlanych z interaktywnych selektorów dostawców,
  takich jak `Moonshot AI`.
- Referencje modeli są analizowane przez podział przy **pierwszym** `/`. Jeśli identyfikator modelu zawiera `/` (w stylu OpenRouter), dołącz prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw rozstrzyga wejście jako alias, następnie
  jako unikalne dopasowanie skonfigurowanego dostawcy dla tego dokładnego identyfikatora modelu, a dopiero potem
  przechodzi do skonfigurowanego dostawcy domyślnego z ostrzeżeniem o wycofaniu.
  Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
  przechodzi do pierwszego skonfigurowanego dostawcy/modelu zamiast zgłaszać
  nieaktualny domyślny usuniętego dostawcy.
- `models status` może pokazywać `marker(<value>)` w wyjściu uwierzytelniania dla niesekretnych symboli zastępczych (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### Skanowanie modeli

`models scan` odczytuje publiczny katalog `:free` OpenRouter i szereguje kandydatów do
użycia jako modele zastępcze. Sam katalog jest publiczny, więc skanowanie samych metadanych nie wymaga
klucza OpenRouter.

Domyślnie OpenClaw próbuje sondować obsługę narzędzi i obrazów za pomocą wywołań modeli na żywo.
Jeśli nie skonfigurowano klucza OpenRouter, polecenie przechodzi do wyjścia zawierającego tylko metadane
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

`--set-default` i `--set-image` wymagają sond na żywo; wyniki skanowania zawierające
tylko metadane są informacyjne i nie są stosowane do konfiguracji.

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

`--json` rezerwuje stdout dla ładunku JSON. Diagnostyka profili uwierzytelniania, dostawcy
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

Oczekiwane przypadki szczegółów/kodów przyczyn sond:

- `excluded_by_auth_order`: zapisany profil istnieje, ale jawne
  `auth.order.<provider>` go pominęło, więc sonda zgłasza wykluczenie zamiast
  go próbować.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil jest obecny, ale nie kwalifikuje się/nie może zostać rozstrzygnięty.
- `no_model`: uwierzytelnianie dostawcy istnieje, ale OpenClaw nie mógł rozstrzygnąć kandydata modelu,
  którego można sondować dla tego dostawcy.

## Aliasy + modele zastępcze

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

`models auth add` to interaktywny pomocnik uwierzytelniania. Może uruchomić przepływ uwierzytelniania dostawcy
(OAuth/klucz API) albo poprowadzić do ręcznego wklejenia tokenu, zależnie od
wybranego dostawcy.

`models auth login` uruchamia przepływ uwierzytelniania Plugin dostawcy (OAuth/klucz API). Użyj
`openclaw plugins list`, aby zobaczyć, którzy dostawcy są zainstalowani.
Użyj `openclaw models auth --agent <id> <subcommand>`, aby zapisać wyniki uwierzytelniania w
magazynie konkretnego skonfigurowanego agenta. Flaga nadrzędna `--agent` jest respektowana przez
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
- `paste-token` akceptuje ciąg tokenu wygenerowany gdzie indziej lub z automatyzacji.
- `paste-token` wymaga `--provider`, pyta o wartość tokenu i zapisuje
  ją pod domyślnym identyfikatorem profilu `<provider>:manual`, chyba że przekażesz
  `--profile-id`.
- `paste-token --expires-in <duration>` zapisuje bezwzględny czas wygaśnięcia tokenu na podstawie
  względnego czasu trwania, takiego jak `365d` lub `12h`.
- Uwaga Anthropic: pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Anthropic `setup-token` / `paste-token` pozostają dostępne jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw obecnie preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modelu](/pl/concepts/model-failover)
