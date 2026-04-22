---
read_when:
    - Dodawanie lub modyfikowanie CLI modeli (models list/set/scan/aliases/fallbacks)
    - Zmiana zachowania fallbacków modeli lub UX wyboru modelu
    - Aktualizowanie testów modeli przy skanowaniu (narzędzia/obrazy)
summary: 'CLI modeli: lista, ustawianie, aliasy, fallbacki, skanowanie, status'
title: CLI modeli
x-i18n:
    generated_at: "2026-04-22T04:22:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf7a17a20bea66e5e8dce134ed08b483417bc70ed875e796609d850aa79280e
    source_path: concepts/models.md
    workflow: 15
---

# CLI modeli

Zobacz [/concepts/model-failover](/pl/concepts/model-failover), aby poznać rotację
profili uwierzytelniania, cooldowny oraz to, jak współgrają one z fallbackami.
Szybki przegląd dostawców + przykłady: [/concepts/model-providers](/pl/concepts/model-providers).

## Jak działa wybór modelu

OpenClaw wybiera modele w tej kolejności:

1. **Podstawowy** model (`agents.defaults.model.primary` lub `agents.defaults.model`).
2. **Fallbacki** w `agents.defaults.model.fallbacks` (w podanej kolejności).
3. **Failover uwierzytelniania dostawcy** zachodzi wewnątrz dostawcy przed przejściem do kolejnego modelu.

Powiązane:

- `agents.defaults.models` to allowlista/katalog modeli, których OpenClaw może używać (wraz z aliasami).
- `agents.defaults.imageModel` jest używane **tylko wtedy**, gdy podstawowy model nie potrafi przyjmować obrazów.
- `agents.defaults.pdfModel` jest używane przez narzędzie `pdf`. Jeśli nie jest ustawione, narzędzie przechodzi na `agents.defaults.imageModel`, a następnie na rozstrzygnięty model sesji/domyslny.
- `agents.defaults.imageGenerationModel` jest używane przez współdzieloną funkcję generowania obrazów. Jeśli nie jest ustawione, `image_generate` nadal może wywnioskować domyślny model dostawcy oparty na uwierzytelnieniu. Najpierw próbuje bieżącego domyślnego dostawcy, a następnie pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnienie/klucz API tego dostawcy.
- `agents.defaults.musicGenerationModel` jest używane przez współdzieloną funkcję generowania muzyki. Jeśli nie jest ustawione, `music_generate` nadal może wywnioskować domyślny model dostawcy oparty na uwierzytelnieniu. Najpierw próbuje bieżącego domyślnego dostawcy, a następnie pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnienie/klucz API tego dostawcy.
- `agents.defaults.videoGenerationModel` jest używane przez współdzieloną funkcję generowania wideo. Jeśli nie jest ustawione, `video_generate` nadal może wywnioskować domyślny model dostawcy oparty na uwierzytelnieniu. Najpierw próbuje bieżącego domyślnego dostawcy, a następnie pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnienie/klucz API tego dostawcy.
- Ustawienia domyślne per agent mogą nadpisywać `agents.defaults.model` przez `agents.list[].model` wraz z powiązaniami (zobacz [/concepts/multi-agent](/pl/concepts/multi-agent)).

## Szybka polityka modeli

- Ustaw model podstawowy na najmocniejszy model najnowszej generacji, do którego masz dostęp.
- Używaj fallbacków do zadań wrażliwych na koszt/opóźnienie i rozmów o mniejszej wadze.
- Dla agentów z włączonymi narzędziami lub przy niezaufanych danych wejściowych unikaj starszych/słabszych poziomów modeli.

## Onboarding (zalecane)

Jeśli nie chcesz ręcznie edytować konfiguracji, uruchom onboarding:

```bash
openclaw onboard
```

Może on skonfigurować model i uwierzytelnienie dla typowych dostawców, w tym **subskrypcję OpenAI Code (Codex)** (OAuth) oraz **Anthropic** (klucz API albo Claude CLI).

## Klucze konfiguracji (przegląd)

- `agents.defaults.model.primary` i `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` i `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` i `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` i `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` i `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlista + aliasy + parametry dostawcy)
- `models.providers` (niestandardowi dostawcy zapisywani do `models.json`)

Referencje modeli są normalizowane do małych liter. Aliasy dostawców, takie jak `z.ai/*`, są normalizowane
do `zai/*`.

Przykłady konfiguracji dostawców (w tym OpenCode) znajdują się w
[/providers/opencode](/pl/providers/opencode).

## „Model is not allowed” (i dlaczego odpowiedzi się zatrzymują)

Jeśli ustawiono `agents.defaults.models`, staje się ono **allowlistą** dla `/model` oraz dla
nadpisań sesji. Gdy użytkownik wybierze model, którego nie ma na tej allowliście,
OpenClaw zwraca:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Dzieje się to **przed** wygenerowaniem normalnej odpowiedzi, więc wiadomość może sprawiać wrażenie,
jakby „nie odpowiedziała”. Rozwiązaniem jest:

- dodać model do `agents.defaults.models`, albo
- wyczyścić allowlistę (usunąć `agents.defaults.models`), albo
- wybrać model z `/model list`.

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

Możesz przełączać modele dla bieżącej sesji bez restartu:

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
- Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje się do nowego modelu dopiero w czystym punkcie ponownej próby.
- Jeśli aktywność narzędzi lub generowanie odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponownej próby albo do następnej tury użytkownika.
- `/model status` to widok szczegółowy (kandydaci uwierzytelniania oraz, jeśli skonfigurowano, `baseUrl` punktu końcowego dostawcy + tryb `api`).
- Referencje modeli są parsowane przez podział przy **pierwszym** `/`. Przy wpisywaniu `/model <ref>` używaj `provider/model`.
- Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), musisz podać prefiks dostawcy (przykład: `/model openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw rozstrzyga dane wejściowe w tej kolejności:
  1. dopasowanie aliasu
  2. unikalne dopasowanie dokładnego nieprefiksowanego identyfikatora modelu do skonfigurowanego dostawcy
  3. przestarzały fallback do skonfigurowanego domyślnego dostawcy
     Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
     zamiast tego przechodzi na pierwszy skonfigurowany model/dostawcę, aby uniknąć
     prezentowania nieaktualnego domyślnego modelu usuniętego dostawcy.

Pełne zachowanie/polecenie konfiguracji: [Polecenia ukośnikowe](/pl/tools/slash-commands).

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

`openclaw models` (bez podpolecenia) to skrót do `models status`.

### `models list`

Domyślnie pokazuje skonfigurowane modele. Przydatne flagi:

- `--all`: pełny katalog
- `--local`: tylko lokalni dostawcy
- `--provider <name>`: filtrowanie po dostawcy
- `--plain`: jeden model na linię
- `--json`: dane wyjściowe do odczytu maszynowego

`--all` obejmuje wiersze statycznego katalogu dołączonego i posiadanego przez dostawcę jeszcze przed
skonfigurowaniem uwierzytelniania, więc widoki służące tylko do odkrywania mogą pokazywać modele,
które są niedostępne, dopóki nie dodasz pasujących poświadczeń dostawcy.

### `models status`

Pokazuje rozstrzygnięty model podstawowy, fallbacki, model obrazów oraz przegląd uwierzytelniania
skonfigurowanych dostawców. Pokazuje też stan wygaśnięcia OAuth dla profili znalezionych
w magazynie uwierzytelniania (domyślnie ostrzega w ciągu 24 h). `--plain` wypisuje tylko
rozstrzygnięty model podstawowy.
Stan OAuth jest zawsze pokazywany (i uwzględniany w wyjściu `--json`). Jeśli skonfigurowany
dostawca nie ma poświadczeń, `models status` wypisuje sekcję **Missing auth**.
JSON zawiera `auth.oauth` (okno ostrzegania + profile) oraz `auth.providers`
(efektywne uwierzytelnianie per dostawca, w tym poświadczenia z env). `auth.oauth`
dotyczy wyłącznie kondycji profili w magazynie uwierzytelniania; dostawcy wyłącznie z env nie pojawiają się tam.
Użyj `--check` do automatyzacji (kod wyjścia `1` dla brakujących/wygasłych, `2` dla wygasających).
Użyj `--probe` do testów uwierzytelniania na żywo; wiersze testów mogą pochodzić z profili uwierzytelniania, poświadczeń env
lub `models.json`.
Jeśli jawne `auth.order.<provider>` pomija przechowywany profil, test zgłasza
`excluded_by_auth_order` zamiast go próbować. Jeśli uwierzytelnienie istnieje, ale nie można rozstrzygnąć
żadnego modelu możliwego do testowania dla tego dostawcy, test zgłasza `status: no_model`.

Wybór uwierzytelniania zależy od dostawcy/konta. Dla hostów Gateway działających stale klucze API
są zwykle najbardziej przewidywalne; obsługiwane jest również ponowne użycie Claude CLI oraz istniejące profile/tokenu OAuth Anthropic.

Przykład (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Skanowanie (darmowe modele OpenRouter)

`openclaw models scan` sprawdza **katalog darmowych modeli** OpenRouter i może
opcjonalnie testować modele pod kątem obsługi narzędzi i obrazów.

Najważniejsze flagi:

- `--no-probe`: pomiń testy na żywo (tylko metadane)
- `--min-params <b>`: minimalny rozmiar parametrów (miliardy)
- `--max-age-days <days>`: pomiń starsze modele
- `--provider <name>`: filtr prefiksu dostawcy
- `--max-candidates <n>`: rozmiar listy fallbacków
- `--set-default`: ustaw `agents.defaults.model.primary` na pierwszy wybór
- `--set-image`: ustaw `agents.defaults.imageModel.primary` na pierwszy wybór obrazu

Testowanie wymaga klucza API OpenRouter (z profili uwierzytelniania albo
`OPENROUTER_API_KEY`). Bez klucza użyj `--no-probe`, aby tylko wyświetlić kandydatów.

Wyniki skanowania są klasyfikowane według:

1. Obsługa obrazów
2. Opóźnienie narzędzi
3. Rozmiar kontekstu
4. Liczba parametrów

Dane wejściowe

- Lista OpenRouter `/models` (filtr `:free`)
- Wymaga klucza API OpenRouter z profili uwierzytelniania albo `OPENROUTER_API_KEY` (zobacz [/environment](/pl/help/environment))
- Opcjonalne filtry: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Sterowanie testami: `--timeout`, `--concurrency`

Po uruchomieniu w TTY możesz interaktywnie wybrać fallbacki. W trybie nieinteraktywnym
przekaż `--yes`, aby zaakceptować wartości domyślne.

## Rejestr modeli (`models.json`)

Niestandardowi dostawcy w `models.providers` są zapisywani do `models.json` w katalogu
agenta (domyślnie `~/.openclaw/agents/<agentId>/agent/models.json`). Ten plik
jest domyślnie scalany, chyba że `models.mode` ustawiono na `replace`.

Pierwszeństwo trybu scalania dla pasujących identyfikatorów dostawców:

- Niepuste `baseUrl` już obecne w `models.json` agenta ma pierwszeństwo.
- Niepuste `apiKey` w `models.json` agenta ma pierwszeństwo tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
- Wartości `apiKey` dostawcy zarządzanego przez SecretRef są odświeżane na podstawie znaczników źródła (`ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec) zamiast utrwalania rozstrzygniętych sekretów.
- Wartości nagłówków dostawcy zarządzanego przez SecretRef są odświeżane na podstawie znaczników źródła (`secretref-env:ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec).
- Puste lub brakujące `apiKey`/`baseUrl` agenta przechodzą awaryjnie na konfigurację `models.providers`.
- Pozostałe pola dostawcy są odświeżane z konfiguracji i znormalizowanych danych katalogowych.

Utrwalanie znaczników jest źródłowo autorytatywne: OpenClaw zapisuje znaczniki z aktywnej migawki konfiguracji źródłowej (przed rozstrzygnięciem), a nie z rozstrzygniętych wartości sekretów w runtime.
Dotyczy to każdej sytuacji, w której OpenClaw regeneruje `models.json`, w tym ścieżek wywoływanych poleceniami, takich jak `openclaw agent`.

## Powiązane

- [Dostawcy modeli](/pl/concepts/model-providers) — routing dostawców i uwierzytelnianie
- [Failover modeli](/pl/concepts/model-failover) — łańcuchy fallbacków
- [Generowanie obrazów](/pl/tools/image-generation) — konfiguracja modelu obrazów
- [Generowanie muzyki](/pl/tools/music-generation) — konfiguracja modelu muzyki
- [Generowanie wideo](/pl/tools/video-generation) — konfiguracja modelu wideo
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#agent-defaults) — klucze konfiguracji modeli
