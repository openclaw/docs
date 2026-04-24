---
read_when:
    - Chcesz zmienić modele domyślne lub sprawdzić stan uwierzytelniania dostawcy
    - Chcesz przeskanować dostępne modele/dostawców i debugować profile uwierzytelniania
summary: Odwołanie CLI dla `openclaw models` (status/list/set/scan, aliasy, fallbacki, uwierzytelnianie)
title: Modele
x-i18n:
    generated_at: "2026-04-24T09:03:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e04342ef240bf7a1f60c4d4e2667d17c9a97e985c1b170db8538c890dc8119
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Wykrywanie modeli, skanowanie i konfiguracja (model domyślny, fallbacki, profile uwierzytelniania).

Powiązane:

- Dostawcy + modele: [Models](/pl/providers/models)
- Koncepcje wyboru modelu + polecenie slash `/models`: [Models concept](/pl/concepts/models)
- Konfiguracja uwierzytelniania dostawcy: [Getting started](/pl/start/getting-started)

## Typowe polecenia

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` pokazuje rozstrzygnięty model domyślny/fallbacki oraz przegląd uwierzytelniania.
Gdy dostępne są migawki użycia dostawcy, sekcja stanu OAuth/klucza API zawiera
okna użycia dostawcy i migawki limitów.
Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi i z.ai. Uwierzytelnianie użycia pochodzi z hooków
specyficznych dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw używa fallbacku, dopasowując poświadczenia OAuth/klucza API
z profili uwierzytelniania, środowiska lub konfiguracji.
W wyjściu `--json` `auth.providers` to przegląd dostawców
uwzględniający środowisko/konfigurację/magazyn, natomiast `auth.oauth` to tylko stan kondycji profili w magazynie uwierzytelniania.
Dodaj `--probe`, aby uruchomić aktywne probowanie uwierzytelniania dla każdego skonfigurowanego profilu dostawcy.
Proby to rzeczywiste żądania (mogą zużywać tokeny i wywoływać limity szybkości).
Użyj `--agent <id>`, aby sprawdzić stan modelu/uwierzytelniania skonfigurowanego agenta. Gdy pominięto,
polecenie używa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, jeśli są ustawione, w przeciwnym razie
skonfigurowanego agenta domyślnego.
Wiersze probe mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`.

Uwagi:

- `models set <model-or-alias>` akceptuje `provider/model` lub alias.
- `models list` jest tylko do odczytu: odczytuje konfigurację, profile uwierzytelniania, istniejący stan katalogu
  i wiersze katalogu należące do dostawcy, ale nie przepisuje
  `models.json`.
- `models list --all` obejmuje dołączone statyczne wiersze katalogu należące do dostawcy nawet wtedy,
  gdy nie uwierzytelniłeś się jeszcze u tego dostawcy. Te wiersze nadal będą wyświetlane
  jako niedostępne, dopóki nie zostanie skonfigurowane pasujące uwierzytelnianie.
- `models list --provider <id>` filtruje według identyfikatora dostawcy, takiego jak `moonshot` lub
  `openai-codex`. Nie akceptuje etykiet wyświetlanych z interaktywnych
  selektorów dostawców, takich jak `Moonshot AI`.
- Referencje modeli są parsowane przez podział po **pierwszym** `/`. Jeśli identyfikator modelu zawiera `/` (styl OpenRouter), dołącz prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw rozstrzyga dane wejściowe jako alias, następnie
  jako unikalne dopasowanie dokładnego identyfikatora modelu wśród skonfigurowanych dostawców, a dopiero potem
  używa fallbacku do skonfigurowanego dostawcy domyślnego z ostrzeżeniem o wycofaniu.
  Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
  używa fallbacku do pierwszego skonfigurowanego dostawcy/modelu zamiast pokazywać
  nieaktualny domyślny model usuniętego dostawcy.
- `models status` może pokazywać `marker(<value>)` w wyjściu uwierzytelniania dla placeholderów niebędących sekretami (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### `models status`

Opcje:

- `--json`
- `--plain`
- `--check` (kod wyjścia 1=expired/missing, 2=expiring)
- `--probe` (aktywne probowanie skonfigurowanych profili uwierzytelniania)
- `--probe-provider <name>` (probowanie jednego dostawcy)
- `--probe-profile <id>` (powtarzane lub identyfikatory profili rozdzielone przecinkami)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identyfikator skonfigurowanego agenta; nadpisuje `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Koszyki stanu probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Przypadki szczegółów/kodów powodów probe, których można się spodziewać:

- `excluded_by_auth_order`: istnieje zapisany profil, ale jawne
  `auth.order.<provider>` go pominęło, więc probe zgłasza wykluczenie zamiast
  go próbować.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil jest obecny, ale nie kwalifikuje się / nie da się go rozstrzygnąć.
- `no_model`: istnieje uwierzytelnianie dostawcy, ale OpenClaw nie mógł rozstrzygnąć
  kandydata modelu możliwego do probowania dla tego dostawcy.

## Aliasy + fallbacki

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
(OAuth/klucz API) lub poprowadzić Cię do ręcznego wklejenia tokenu, zależnie od
wybranego dostawcy.

`models auth login` uruchamia przepływ uwierzytelniania Pluginu dostawcy (OAuth/klucz API). Użyj
`openclaw plugins list`, aby zobaczyć, którzy dostawcy są zainstalowani.

Przykłady:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Uwagi:

- `setup-token` i `paste-token` pozostają ogólnymi poleceniami tokenów dla dostawców,
  którzy udostępniają metody uwierzytelniania tokenem.
- `setup-token` wymaga interaktywnego TTY i uruchamia metodę uwierzytelniania tokenem dostawcy
  (domyślnie metodę `setup-token` tego dostawcy, gdy ją udostępnia).
- `paste-token` akceptuje ciąg tokenu wygenerowany gdzie indziej lub przez automatyzację.
- `paste-token` wymaga `--provider`, pyta o wartość tokenu i zapisuje
  ją do domyślnego identyfikatora profilu `<provider>:manual`, chyba że przekażesz
  `--profile-id`.
- `paste-token --expires-in <duration>` zapisuje bezwzględny czas wygaśnięcia tokenu na podstawie
  czasu względnego, takiego jak `365d` lub `12h`.
- Uwaga dotycząca Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako dozwolone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Anthropic `setup-token` / `paste-token` pozostają dostępną, obsługiwaną ścieżką tokenu OpenClaw, ale OpenClaw teraz preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Powiązane

- [Odwołanie CLI](/pl/cli)
- [Wybór modelu](/pl/concepts/model-providers)
- [Model failover](/pl/concepts/model-failover)
