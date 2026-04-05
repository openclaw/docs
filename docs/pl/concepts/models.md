---
read_when:
    - Dodawanie lub modyfikowanie CLI modeli (models list/set/scan/aliases/fallbacks)
    - Zmiana zachowania fallbacków modeli lub UX wyboru
    - Aktualizowanie sond skanowania modeli (narzędzia/obrazy)
summary: 'CLI modeli: list, set, aliasy, fallbacki, scan, status'
title: Models CLI
x-i18n:
    generated_at: "2026-04-05T13:51:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08f7e50da263895dae2bd2b8dc327972ea322615f8d1918ddbd26bb0fb24840
    source_path: concepts/models.md
    workflow: 15
---

# Models CLI

Zobacz [/concepts/model-failover](/concepts/model-failover), aby poznać rotację
profili uwierzytelniania, cooldowny i sposób, w jaki współgra to z fallbackami.
Szybki przegląd dostawców i przykłady: [/concepts/model-providers](/concepts/model-providers).

## Jak działa wybór modelu

OpenClaw wybiera modele w następującej kolejności:

1. **Główny** model (`agents.defaults.model.primary` lub `agents.defaults.model`).
2. **Fallbacki** w `agents.defaults.model.fallbacks` (w podanej kolejności).
3. **Failover uwierzytelniania dostawcy** odbywa się w obrębie dostawcy przed przejściem do
   kolejnego modelu.

Powiązane:

- `agents.defaults.models` to allowlista/katalog modeli, których OpenClaw może używać (wraz z aliasami).
- `agents.defaults.imageModel` jest używany **tylko wtedy**, gdy główny model nie może przyjmować obrazów.
- `agents.defaults.pdfModel` jest używany przez narzędzie `pdf`. Jeśli go pominięto, narzędzie
  przechodzi do `agents.defaults.imageModel`, a następnie do rozpoznanego modelu sesji/domyślnego.
- `agents.defaults.imageGenerationModel` jest używany przez współdzieloną funkcję generowania obrazów. Jeśli go pominięto, `image_generate` nadal może wywnioskować domyślny dostawca oparty na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, a następnie pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretny `provider/model`, skonfiguruj też uwierzytelnianie/klucz API tego dostawcy.
- `agents.defaults.videoGenerationModel` jest używany przez współdzieloną funkcję generowania wideo. W przeciwieństwie do generowania obrazów, obecnie nie wywnioskuje domyślnego dostawcy. Ustaw jawny `provider/model`, taki jak `qwen/wan2.6-t2v`, i skonfiguruj również uwierzytelnianie/klucz API tego dostawcy.
- Domyślne ustawienia per agent mogą zastępować `agents.defaults.model` przez `agents.list[].model` wraz z powiązaniami (zobacz [/concepts/multi-agent](/concepts/multi-agent)).

## Szybka polityka modeli

- Ustaw model główny na najmocniejszy dostępny dla Ciebie model najnowszej generacji.
- Używaj fallbacków dla zadań wrażliwych na koszt/opóźnienia i mniej istotnych rozmów.
- W przypadku agentów z włączonymi narzędziami lub niezaufanych danych wejściowych unikaj starszych/słabszych poziomów modeli.

## Onboarding (zalecane)

Jeśli nie chcesz ręcznie edytować konfiguracji, uruchom onboarding:

```bash
openclaw onboard
```

Może on skonfigurować model i uwierzytelnianie dla popularnych dostawców, w tym **subskrypcję OpenAI Code (Codex)**
(OAuth) i **Anthropic** (klucz API lub Claude CLI).

## Klucze konfiguracji (przegląd)

- `agents.defaults.model.primary` i `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` i `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` i `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` i `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` i `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlista + aliasy + parametry dostawców)
- `models.providers` (niestandardowi dostawcy zapisywani do `models.json`)

Referencje modeli są normalizowane do małych liter. Aliasy dostawców, takie jak `z.ai/*`, są normalizowane
do `zai/*`.

Przykłady konfiguracji dostawców (w tym OpenCode) znajdują się w
[/providers/opencode](/providers/opencode).

## „Model is not allowed” (i dlaczego odpowiedzi się zatrzymują)

Jeśli ustawiono `agents.defaults.models`, staje się ono **allowlistą** dla `/model` i dla
nadpisań sesji. Gdy użytkownik wybierze model, którego nie ma na tej allowliście,
OpenClaw zwraca:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Dzieje się to **przed** wygenerowaniem zwykłej odpowiedzi, więc wiadomość może sprawiać wrażenie,
jakby „nie było odpowiedzi”. Rozwiązanie polega na tym, aby:

- Dodać model do `agents.defaults.models`, albo
- Wyczyścić allowlistę (usunąć `agents.defaults.models`), albo
- Wybrać model z `/model list`.

Przykładowa konfiguracja allowlisty:

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

## Przełączanie modeli na czacie (`/model`)

Możesz przełączać modele dla bieżącej sesji bez restartowania:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Uwagi:

- `/model` (i `/model list`) to zwarty, numerowany selektor (rodzina modeli + dostępni dostawcy).
- Na Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawców i modeli oraz krokiem Submit.
- `/model <#>` wybiera z tego selektora.
- `/model` natychmiast zapisuje nowy wybór sesji.
- Jeśli agent jest bezczynny, następne uruchomienie od razu użyje nowego modelu.
- Jeśli uruchomienie już trwa, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponowienia.
- Jeśli aktywność narzędzi lub generowanie odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia lub następnej tury użytkownika.
- `/model status` to widok szczegółowy (kandydaci uwierzytelniania i, gdy skonfigurowano, `baseUrl` endpointu dostawcy oraz tryb `api`).
- Referencje modeli są parsowane przez podział według **pierwszego** `/`. Użyj `provider/model` podczas wpisywania `/model <ref>`.
- Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), musisz uwzględnić prefiks dostawcy (przykład: `/model openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw rozpoznaje dane wejściowe w tej kolejności:
  1. dopasowanie aliasu
  2. unikalne dopasowanie skonfigurowanego dostawcy dla tego dokładnego identyfikatora modelu bez prefiksu
  3. przestarzały fallback do skonfigurowanego domyślnego dostawcy
     Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
     zamiast tego przechodzi do pierwszego skonfigurowanego dostawcy/modelu, aby uniknąć
     prezentowania nieaktualnego domyślnego modelu z usuniętego dostawcy.

Pełne zachowanie poleceń/konfiguracja: [Polecenia slash](/tools/slash-commands).

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
- `--local`: tylko lokalni dostawcy
- `--provider <name>`: filtruj według dostawcy
- `--plain`: jeden model na linię
- `--json`: dane wyjściowe do odczytu maszynowego

### `models status`

Pokazuje rozpoznany model główny, fallbacki, model obrazu i przegląd uwierzytelniania
skonfigurowanych dostawców. Pokazuje też stan wygaśnięcia OAuth dla profili znalezionych
w magazynie uwierzytelniania (domyślnie ostrzega w ciągu 24 h). `--plain` wypisuje tylko
rozpoznany model główny.
Stan OAuth jest zawsze pokazywany (i uwzględniany w danych wyjściowych `--json`). Jeśli skonfigurowany
dostawca nie ma poświadczeń, `models status` wypisuje sekcję **Missing auth**.
JSON zawiera `auth.oauth` (okno ostrzeżenia + profile) oraz `auth.providers`
(skuteczne uwierzytelnianie dla dostawcy).
Użyj `--check` do automatyzacji (kod wyjścia `1` przy braku/wygasłym, `2` przy wygasającym).
Użyj `--probe` do aktywnych kontroli uwierzytelniania; wiersze sond mogą pochodzić z profili uwierzytelniania, poświadczeń env
lub `models.json`.
Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sonda zgłasza
`excluded_by_auth_order` zamiast próbować go użyć. Jeśli uwierzytelnianie istnieje, ale nie można rozpoznać modelu
możliwego do sondowania dla tego dostawcy, sonda zgłasza `status: no_model`.

Wybór uwierzytelniania zależy od dostawcy/konta. W przypadku hostów gateway działających stale klucze API
są zwykle najbardziej przewidywalne; ponowne użycie Claude CLI i istniejące profile
OAuth/token Anthropic są również obsługiwane.

Przykład (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Skanowanie (darmowe modele OpenRouter)

`openclaw models scan` sprawdza **katalog darmowych modeli** OpenRouter i może
opcjonalnie sondować modele pod kątem obsługi narzędzi i obrazów.

Najważniejsze flagi:

- `--no-probe`: pomiń aktywne sondy (tylko metadane)
- `--min-params <b>`: minimalna liczba parametrów (miliardy)
- `--max-age-days <days>`: pomiń starsze modele
- `--provider <name>`: filtr prefiksu dostawcy
- `--max-candidates <n>`: rozmiar listy fallbacków
- `--set-default`: ustaw `agents.defaults.model.primary` na pierwszy wybór
- `--set-image`: ustaw `agents.defaults.imageModel.primary` na pierwszy wybór obrazu

Sondowanie wymaga klucza API OpenRouter (z profili uwierzytelniania lub
`OPENROUTER_API_KEY`). Bez klucza użyj `--no-probe`, aby wyświetlić tylko kandydatów.

Wyniki skanowania są klasyfikowane według:

1. Obsługa obrazów
2. Opóźnienie narzędzi
3. Rozmiar kontekstu
4. Liczba parametrów

Dane wejściowe

- Lista OpenRouter `/models` (filtr `:free`)
- Wymaga klucza API OpenRouter z profili uwierzytelniania lub `OPENROUTER_API_KEY` (zobacz [/environment](/help/environment))
- Opcjonalne filtry: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Sterowanie sondami: `--timeout`, `--concurrency`

Po uruchomieniu w TTY możesz interaktywnie wybierać fallbacki. W trybie nieinteraktywnym
przekaż `--yes`, aby zaakceptować wartości domyślne.

## Rejestr modeli (`models.json`)

Niestandardowi dostawcy w `models.providers` są zapisywani do `models.json` w katalogu
agenta (domyślnie `~/.openclaw/agents/<agentId>/agent/models.json`). Ten plik
jest domyślnie scalany, chyba że `models.mode` ustawiono na `replace`.

Priorytet trybu scalania dla pasujących identyfikatorów dostawców:

- Niepuste `baseUrl` już obecne w `models.json` agenta ma pierwszeństwo.
- Niepuste `apiKey` w `models.json` agenta ma pierwszeństwo tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
- Wartości `apiKey` dostawców zarządzanych przez SecretRef są odświeżane na podstawie markerów źródła (`ENV_VAR_NAME` dla referencji env, `secretref-managed` dla referencji file/exec) zamiast utrwalać rozwiązane sekrety.
- Wartości nagłówków dostawców zarządzanych przez SecretRef są odświeżane na podstawie markerów źródła (`secretref-env:ENV_VAR_NAME` dla referencji env, `secretref-managed` dla referencji file/exec).
- Puste lub brakujące `apiKey`/`baseUrl` agenta przechodzą do konfiguracji `models.providers`.
- Inne pola dostawcy są odświeżane z konfiguracji i znormalizowanych danych katalogu.

Trwałość markerów jest źródłowo autorytatywna: OpenClaw zapisuje markery z aktywnej migawki konfiguracji źródłowej (przed rozwiązywaniem), a nie z rozwiązanych wartości sekretów środowiska uruchomieniowego.
Ma to zastosowanie zawsze, gdy OpenClaw regeneruje `models.json`, w tym w ścieżkach uruchamianych poleceniami, takich jak `openclaw agent`.

## Powiązane

- [Model Providers](/concepts/model-providers) — routing dostawców i uwierzytelnianie
- [Model Failover](/concepts/model-failover) — łańcuchy fallbacków
- [Image Generation](/tools/image-generation) — konfiguracja modelu obrazu
- [Configuration Reference](/gateway/configuration-reference#agent-defaults) — klucze konfiguracji modeli
