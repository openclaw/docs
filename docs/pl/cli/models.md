---
read_when:
    - Chcesz zmienić domyślne modele lub sprawdzić stan uwierzytelniania dostawcy
    - Chcesz przeskanować dostępne modele/dostawców i debugować profile uwierzytelniania
summary: Dokumentacja CLI dla `openclaw models` (status/list/set/scan, aliasy, fallbacki, uwierzytelnianie)
title: models
x-i18n:
    generated_at: "2026-04-05T13:49:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ba33181d49b6bbf3b5d5fa413aa6b388c9f29fb9d4952055d68c79f7bcfea0
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Wykrywanie modeli, skanowanie i konfiguracja (model domyślny, fallbacki, profile uwierzytelniania).

Powiązane:

- Dostawcy + modele: [Models](/providers/models)
- Konfiguracja uwierzytelniania dostawcy: [Pierwsze kroki](/start/getting-started)

## Typowe polecenia

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` pokazuje rozwiązany model domyślny/fallbacki oraz przegląd uwierzytelniania.
Gdy dostępne są migawki użycia dostawców, sekcja stanu OAuth/klucza API zawiera
okna użycia dostawców i migawki limitów.
Bieżący dostawcy z oknami użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi i z.ai. Uwierzytelnianie użycia pochodzi z hooków
specyficznych dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw
przechodzi do dopasowywania poświadczeń OAuth/klucza API z profili
uwierzytelniania, env lub konfiguracji.
Dodaj `--probe`, aby uruchomić aktywne sondy uwierzytelniania dla każdego skonfigurowanego profilu dostawcy.
Sondy to rzeczywiste żądania (mogą zużywać tokeny i wywoływać limity szybkości).
Użyj `--agent <id>`, aby sprawdzić stan modelu/uwierzytelniania skonfigurowanego agenta. Gdy pominięto,
polecenie używa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, jeśli są ustawione, w przeciwnym razie
skonfigurowanego domyślnego agenta.
Wiersze sond mogą pochodzić z profili uwierzytelniania, poświadczeń env lub `models.json`.

Uwagi:

- `models set <model-or-alias>` akceptuje `provider/model` lub alias.
- Odwołania do modeli są parsowane przez podział według **pierwszego** `/`. Jeśli identyfikator modelu zawiera `/` (styl OpenRouter), uwzględnij prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw rozpoznaje dane wejściowe jako alias, następnie
  jako unikalne dopasowanie skonfigurowanego dostawcy dla tego dokładnego identyfikatora modelu, a dopiero potem
  przechodzi do skonfigurowanego domyślnego dostawcy z ostrzeżeniem o wycofaniu.
  Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
  przechodzi do pierwszego skonfigurowanego dostawcy/modelu zamiast zwracać
  nieaktualny domyślny model z usuniętego dostawcy.
- `models status` może pokazywać `marker(<value>)` w danych wyjściowych uwierzytelniania dla niebędących sekretami placeholderów (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### `models status`

Opcje:

- `--json`
- `--plain`
- `--check` (kod wyjścia 1=brak/wygasło, 2=wygasa)
- `--probe` (aktywna sonda skonfigurowanych profili uwierzytelniania)
- `--probe-provider <name>` (sonda jednego dostawcy)
- `--probe-profile <id>` (powtarzane lub rozdzielane przecinkami identyfikatory profili)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identyfikator skonfigurowanego agenta; zastępuje `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Kategorie stanu sond:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Przypadki szczegółów/kodów przyczyn sond, których można się spodziewać:

- `excluded_by_auth_order`: zapisany profil istnieje, ale jawne
  `auth.order.<provider>` go pominęło, więc sonda zgłasza wykluczenie zamiast
  próbować go użyć.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil jest obecny, ale nie kwalifikuje się / nie da się go rozwiązać.
- `no_model`: uwierzytelnianie dostawcy istnieje, ale OpenClaw nie mógł rozpoznać
  kandydata modelu możliwego do sondowania dla tego dostawcy.

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
(OAuth/klucz API) albo poprowadzić Cię do ręcznego wklejenia tokenu, zależnie od
wybranego dostawcy.

`models auth login` uruchamia przepływ uwierzytelniania pluginu dostawcy (OAuth/klucz API). Użyj
`openclaw plugins list`, aby zobaczyć, którzy dostawcy są zainstalowani.

Przykłady:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
openclaw models auth login --provider openai-codex --set-default
```

Uwagi:

- `login --provider anthropic --method cli --set-default` ponownie używa lokalnego logowania Claude
  CLI i przepisuje główną ścieżkę domyślnego modelu Anthropic do kanonicznego
  odwołania `claude-cli/claude-*`.
- `setup-token` i `paste-token` pozostają ogólnymi poleceniami tokenów dla dostawców,
  którzy udostępniają metody uwierzytelniania tokenem.
- `setup-token` wymaga interaktywnego TTY i uruchamia metodę uwierzytelniania tokenem dostawcy
  (domyślnie używając metody `setup-token` tego dostawcy, jeśli ją udostępnia).
- `paste-token` akceptuje ciąg tokenu wygenerowany gdzie indziej lub przez automatyzację.
- `paste-token` wymaga `--provider`, prosi o wartość tokenu i zapisuje
  ją do domyślnego identyfikatora profilu `<provider>:manual`, chyba że przekażesz
  `--profile-id`.
- `paste-token --expires-in <duration>` zapisuje bezwzględny czas wygaśnięcia tokenu na podstawie
  względnego czasu trwania, takiego jak `365d` lub `12h`.
- Uwaga dotycząca rozliczeń Anthropic: Uważamy, że fallback Claude Code CLI jest prawdopodobnie dozwolony w przypadku lokalnej automatyzacji zarządzanej przez użytkownika na podstawie publicznej dokumentacji CLI Anthropic. Mimo to polityka Anthropic dotycząca zewnętrznych harnessów tworzy wystarczająco dużo niejasności wokół użycia opartego na subskrypcji w produktach zewnętrznych, że nie zalecamy tego do zastosowań produkcyjnych. Anthropic powiadomił również użytkowników OpenClaw **4 kwietnia 2026 o 12:00 PM PT / 8:00 PM BST**, że ścieżka logowania Claude w **OpenClaw** jest traktowana jako użycie zewnętrznego harnessu i wymaga **Extra Usage** rozliczanego oddzielnie od subskrypcji.
- Anthropic `setup-token` / `paste-token` są ponownie dostępne jako starsza/ręczna ścieżka OpenClaw. Używaj ich z założeniem, że Anthropic poinformował użytkowników OpenClaw, że ta ścieżka wymaga **Extra Usage**.
