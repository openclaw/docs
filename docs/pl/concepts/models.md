---
read_when:
    - Dodawanie lub modyfikowanie CLI modeli (models list/set/scan/aliases/fallbacks)
    - Zmiana zachowania fallbacków modeli lub UX wyboru modelu
    - Aktualizowanie probe skanowania modeli (narzędzia/obrazy)
summary: 'CLI modeli: list, set, aliasy, fallbacki, scan, status'
title: CLI modeli
x-i18n:
    generated_at: "2026-04-24T09:06:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12f784984c87b33e645ec296f7f93ec3acc2a91efa3b63d3a912a6b09b90e048
    source_path: concepts/models.md
    workflow: 15
---

Zobacz [/concepts/model-failover](/pl/concepts/model-failover), aby poznać rotację profili uwierzytelniania,
cooldowny i ich interakcję z fallbackami.
Szybki przegląd dostawców + przykłady: [/concepts/model-providers](/pl/concepts/model-providers).

## Jak działa wybór modelu

OpenClaw wybiera modele w tej kolejności:

1. Model **główny** (`agents.defaults.model.primary` lub `agents.defaults.model`).
2. **Fallbacki** w `agents.defaults.model.fallbacks` (po kolei).
3. **Failover uwierzytelniania dostawcy** następuje wewnątrz dostawcy przed przejściem do
   następnego modelu.

Powiązane:

- `agents.defaults.models` to lista dozwolonych/katalog modeli, których OpenClaw może używać (plus aliasy).
- `agents.defaults.imageModel` jest używane **tylko wtedy**, gdy model główny nie może przyjmować obrazów.
- `agents.defaults.pdfModel` jest używane przez narzędzie `pdf`. Jeśli jest pominięte, narzędzie
  używa fallbacku do `agents.defaults.imageModel`, a następnie do rozstrzygniętego modelu sesji/dom yślnego.
- `agents.defaults.imageGenerationModel` jest używane przez współdzieloną funkcję generowania obrazów. Jeśli jest pominięte, `image_generate` nadal może wywnioskować domyślny dostawca oparty na uwierzytelnianiu. Najpierw próbuje bieżącego dostawcy domyślnego, a następnie pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretny dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
- `agents.defaults.musicGenerationModel` jest używane przez współdzieloną funkcję generowania muzyki. Jeśli jest pominięte, `music_generate` nadal może wywnioskować domyślny dostawca oparty na uwierzytelnianiu. Najpierw próbuje bieżącego dostawcy domyślnego, a następnie pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretny dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
- `agents.defaults.videoGenerationModel` jest używane przez współdzieloną funkcję generowania wideo. Jeśli jest pominięte, `video_generate` nadal może wywnioskować domyślny dostawca oparty na uwierzytelnianiu. Najpierw próbuje bieżącego dostawcy domyślnego, a następnie pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretny dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
- Ustawienia domyślne per agent mogą nadpisywać `agents.defaults.model` przez `agents.list[].model` wraz z bindings (zobacz [/concepts/multi-agent](/pl/concepts/multi-agent)).

## Szybka polityka modeli

- Ustaw model główny na najmocniejszy model najnowszej generacji, do którego masz dostęp.
- Używaj fallbacków dla zadań wrażliwych na koszt/opóźnienie i rozmów o niższej stawce.
- Dla agentów z włączonymi narzędziami lub niezaufanych danych wejściowych unikaj starszych/słabszych klas modeli.

## Onboarding (zalecane)

Jeśli nie chcesz ręcznie edytować konfiguracji, uruchom onboarding:

```bash
openclaw onboard
```

Może skonfigurować model + uwierzytelnianie dla popularnych dostawców, w tym **subskrypcję
OpenAI Code (Codex)** (OAuth) i **Anthropic** (klucz API lub Claude CLI).

## Klucze konfiguracji (przegląd)

- `agents.defaults.model.primary` i `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` i `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` i `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` i `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` i `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista dozwolonych + aliasy + parametry dostawcy)
- `models.providers` (niestandardowi dostawcy zapisani do `models.json`)

Referencje modeli są normalizowane do małych liter. Aliasy dostawców, takie jak `z.ai/*`, są normalizowane
do `zai/*`.

Przykłady konfiguracji dostawców (w tym OpenCode) znajdują się w
[/providers/opencode](/pl/providers/opencode).

### Bezpieczne edycje listy dozwolonych

Przy ręcznym aktualizowaniu `agents.defaults.models` używaj zapisów addytywnych:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` chroni mapy modeli/dostawców przed przypadkowym nadpisaniem. Zwykłe
przypisanie obiektu do `agents.defaults.models`, `models.providers` lub
`models.providers.<id>.models` jest odrzucane, gdy usunęłoby istniejące
wpisy. Używaj `--merge` do zmian addytywnych; używaj `--replace` tylko wtedy, gdy
podana wartość ma stać się pełną wartością docelową.

Interaktywna konfiguracja dostawcy i `openclaw configure --section model` także scalają
wybory ograniczone do dostawcy z istniejącą listą dozwolonych, więc dodanie Codex,
Ollama lub innego dostawcy nie usuwa niezwiązanych wpisów modeli.

## „Model is not allowed” (i dlaczego odpowiedzi się zatrzymują)

Jeśli ustawiono `agents.defaults.models`, staje się ono **listą dozwolonych** dla `/model` oraz
nadpisań sesji. Gdy użytkownik wybierze model, którego nie ma na tej liście,
OpenClaw zwraca:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Dzieje się to **przed** wygenerowaniem normalnej odpowiedzi, więc wiadomość może sprawiać wrażenie,
jakby „nie odpowiedziała”. Rozwiązaniem jest:

- Dodanie modelu do `agents.defaults.models`, albo
- Wyczyszczenie listy dozwolonych (usunięcie `agents.defaults.models`), albo
- Wybranie modelu z `/model list`.

Przykładowa konfiguracja listy dozwolonych:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Przełączanie modeli w czacie (`/model`)

Możesz przełączać modele dla bieżącej sesji bez restartu:

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Uwagi:

- `/model` (i `/model list`) to kompaktowy, numerowany selektor (rodzina modeli + dostępni dostawcy).
- W Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
- `/models add` jest domyślnie dostępne i można je wyłączyć przez `commands.modelsWrite=false`.
- Gdy jest włączone, `/models add <provider> <modelId>` to najszybsza ścieżka; samo `/models add` uruchamia wspierany przepływ prowadzony najpierw według dostawcy.
- Po `/models add` nowy model staje się dostępny w `/models` i `/model` bez restartu Gateway.
- `/model <#>` wybiera z tego selektora.
- `/model` natychmiast utrwala nowy wybór sesji.
- Jeśli agent jest bezczynny, następne uruchomienie od razu użyje nowego modelu.
- Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponownej próby.
- Jeśli aktywność narzędzi lub wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponownej próby lub następnej tury użytkownika.
- `/model status` to widok szczegółowy (kandydaci uwierzytelniania i, jeśli skonfigurowano, `baseUrl` punktu końcowego dostawcy + tryb `api`).
- Referencje modeli są parsowane przez podział po **pierwszym** `/`. Używaj `provider/model` przy wpisywaniu `/model <ref>`.
- Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), musisz dołączyć prefiks dostawcy (przykład: `/model openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw rozstrzyga dane wejściowe w tej kolejności:
  1. dopasowanie aliasu
  2. unikalne dopasowanie dokładnego nieprefiksowanego identyfikatora modelu wśród skonfigurowanych dostawców
  3. wycofywany fallback do skonfigurowanego dostawcy domyślnego
     Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
     zamiast tego używa fallbacku do pierwszego skonfigurowanego dostawcy/modelu, aby
     uniknąć pokazywania nieaktualnego domyślnego modelu usuniętego dostawcy.

Pełne zachowanie poleceń/konfiguracji: [Slash commands](/pl/tools/slash-commands).

Przykłady:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## Polecenia CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (bez podpolecenia) to skrót dla `models status`.

### `models list`

Domyślnie pokazuje skonfigurowane modele. Przydatne flagi:

- `--all`: pełny katalog
- `--local`: tylko dostawcy lokalni
- `--provider <id>`: filtr według identyfikatora dostawcy, na przykład `moonshot`; etykiety wyświetlane z interaktywnych selektorów nie są akceptowane
- `--plain`: jeden model na wiersz
- `--json`: wyjście czytelne maszynowo

`--all` obejmuje dołączone statyczne wiersze katalogu należące do dostawcy przed
skonfigurowaniem uwierzytelniania, więc widoki tylko do wykrywania mogą pokazywać modele niedostępne do czasu dodania pasujących poświadczeń dostawcy.

### `models status`

Pokazuje rozstrzygnięty model główny, fallbacki, model obrazu oraz przegląd uwierzytelniania
skonfigurowanych dostawców. Pokazuje także stan wygaśnięcia OAuth dla profili znalezionych
w magazynie uwierzytelniania (domyślnie ostrzega w ciągu 24 godzin). `--plain` wypisuje tylko
rozstrzygnięty model główny.
Stan OAuth jest zawsze pokazywany (i zawarty w wyjściu `--json`). Jeśli skonfigurowany
dostawca nie ma poświadczeń, `models status` wypisuje sekcję **Missing auth**.
JSON zawiera `auth.oauth` (okno ostrzegania + profile) i `auth.providers`
(efektywne uwierzytelnianie per dostawca, w tym poświadczenia oparte na środowisku). `auth.oauth`
to tylko stan kondycji profili w magazynie uwierzytelniania; dostawcy tylko ze środowiska się tam nie pojawiają.
Użyj `--check` do automatyzacji (kod wyjścia `1` przy missing/expired, `2` przy expiring).
Użyj `--probe` do aktywnych kontroli uwierzytelniania; wiersze probe mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`.
Jeśli jawne `auth.order.<provider>` pomija zapisany profil, probe zgłasza
`excluded_by_auth_order` zamiast go próbować. Jeśli uwierzytelnianie istnieje, ale nie można rozstrzygnąć modelu możliwego do probowania dla tego dostawcy, probe zgłasza `status: no_model`.

Wybór uwierzytelniania zależy od dostawcy/konta. W przypadku hostów Gateway działających stale klucze API
są zwykle najbardziej przewidywalne; obsługiwane jest także ponowne użycie Claude CLI oraz istniejących profili OAuth/token Anthropic.

Przykład (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Skanowanie (darmowe modele OpenRouter)

`openclaw models scan` sprawdza **katalog darmowych modeli** OpenRouter i może
opcjonalnie probować modele pod kątem obsługi narzędzi i obrazów.

Kluczowe flagi:

- `--no-probe`: pomiń aktywne proby (tylko metadane)
- `--min-params <b>`: minimalny rozmiar parametrów (miliardy)
- `--max-age-days <days>`: pomiń starsze modele
- `--provider <name>`: filtr prefiksu dostawcy
- `--max-candidates <n>`: rozmiar listy fallbacków
- `--set-default`: ustaw `agents.defaults.model.primary` na pierwszy wybór
- `--set-image`: ustaw `agents.defaults.imageModel.primary` na pierwszy wybór obrazu

Probing wymaga klucza API OpenRouter (z profili uwierzytelniania lub
`OPENROUTER_API_KEY`). Bez klucza użyj `--no-probe`, aby tylko wyświetlić kandydatów.

Wyniki skanowania są klasyfikowane według:

1. Obsługi obrazów
2. Opóźnienia narzędzi
3. Rozmiaru kontekstu
4. Liczby parametrów

Dane wejściowe

- Lista OpenRouter `/models` (filtr `:free`)
- Wymaga klucza API OpenRouter z profili uwierzytelniania lub `OPENROUTER_API_KEY` (zobacz [/environment](/pl/help/environment))
- Opcjonalne filtry: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Sterowanie probe: `--timeout`, `--concurrency`

Po uruchomieniu w TTY możesz interaktywnie wybrać fallbacki. W trybie nieinteraktywnym
przekaż `--yes`, aby zaakceptować ustawienia domyślne.

## Rejestr modeli (`models.json`)

Niestandardowi dostawcy w `models.providers` są zapisywani do `models.json` w
katalogu agenta (domyślnie `~/.openclaw/agents/<agentId>/agent/models.json`). Ten plik
jest domyślnie scalany, chyba że `models.mode` jest ustawione na `replace`.

Pierwszeństwo trybu scalania dla pasujących identyfikatorów dostawców:

- Niepuste `baseUrl` już obecne w `models.json` agenta ma pierwszeństwo.
- Niepuste `apiKey` w `models.json` agenta ma pierwszeństwo tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
- Wartości `apiKey` dostawców zarządzanych przez SecretRef są odświeżane z markerów źródła (`ENV_VAR_NAME` dla referencji env, `secretref-managed` dla referencji file/exec) zamiast utrwalania rozstrzygniętych sekretów.
- Wartości nagłówków dostawców zarządzanych przez SecretRef są odświeżane z markerów źródła (`secretref-env:ENV_VAR_NAME` dla referencji env, `secretref-managed` dla referencji file/exec).
- Puste lub brakujące `apiKey`/`baseUrl` agenta używają fallbacku do konfiguracji `models.providers`.
- Inne pola dostawców są odświeżane z konfiguracji i znormalizowanych danych katalogu.

Utrwalanie markerów jest autorytatywne względem źródła: OpenClaw zapisuje markery z migawki aktywnej konfiguracji źródłowej (przed rozstrzyganiem), a nie z rozstrzygniętych wartości sekretów w czasie działania.
Dotyczy to każdej sytuacji, gdy OpenClaw regeneruje `models.json`, w tym ścieżek wywoływanych poleceniami, takich jak `openclaw agent`.

## Powiązane

- [Model Providers](/pl/concepts/model-providers) — routing dostawców i uwierzytelnianie
- [Model Failover](/pl/concepts/model-failover) — łańcuchy fallbacków
- [Image Generation](/pl/tools/image-generation) — konfiguracja modelu obrazu
- [Music Generation](/pl/tools/music-generation) — konfiguracja modelu muzyki
- [Video Generation](/pl/tools/video-generation) — konfiguracja modelu wideo
- [Configuration Reference](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modelu
