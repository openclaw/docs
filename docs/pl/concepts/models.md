---
read_when:
    - Dodawanie lub modyfikowanie CLI modeli (`models list`/`set`/`scan`/`aliases`/`fallbacks`)
    - Zmiana zachowania fallbacków modeli lub UX wyboru modelu
    - Aktualizowanie prób skanowania modeli (narzędzia/obrazy)
sidebarTitle: Models CLI
summary: 'CLI modeli: list, set, aliasy, fallbacki, scan, status'
title: CLI modeli
x-i18n:
    generated_at: "2026-04-26T11:27:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70dfb3f69532c6bfff5d8854ee7a5db3134e5ede3e1875410cea95072ca42a0
    source_path: concepts/models.md
    workflow: 15
---

<CardGroup cols={2}>
  <Card title="Failover modeli" href="/pl/concepts/model-failover">
    Rotacja profili uwierzytelniania, cooldowny i ich interakcja z fallbackami.
  </Card>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers">
    Krótki przegląd dostawców i przykłady.
  </Card>
  <Card title="Środowiska uruchomieniowe agentów" href="/pl/concepts/agent-runtimes">
    PI, Codex i inne środowiska uruchomieniowe pętli agentów.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults">
    Klucze konfiguracji modeli.
  </Card>
</CardGroup>

Odwołania do modeli wybierają dostawcę i model. Zwykle nie wybierają niskopoziomowego środowiska uruchomieniowego agenta. Na przykład `openai/gpt-5.5` może działać przez zwykłą ścieżkę dostawcy OpenAI albo przez środowisko uruchomieniowe serwera aplikacji Codex, zależnie od `agents.defaults.agentRuntime.id`. Zobacz [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes).

## Jak działa wybór modelu

OpenClaw wybiera modele w tej kolejności:

<Steps>
  <Step title="Model główny">
    `agents.defaults.model.primary` (lub `agents.defaults.model`).
  </Step>
  <Step title="Fallbacki">
    `agents.defaults.model.fallbacks` (w kolejności).
  </Step>
  <Step title="Failover uwierzytelniania dostawcy">
    Failover uwierzytelniania zachodzi wewnątrz dostawcy przed przejściem do następnego modelu.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Powiązane powierzchnie modeli">
    - `agents.defaults.models` to allowlista/katalog modeli, których OpenClaw może używać (plus aliasy).
    - `agents.defaults.imageModel` jest używany **tylko wtedy**, gdy model główny nie może przyjmować obrazów.
    - `agents.defaults.pdfModel` jest używany przez narzędzie `pdf`. Jeśli nie jest ustawiony, narzędzie przechodzi kolejno do `agents.defaults.imageModel`, a potem do rozwiązanego modelu sesji/domślnego.
    - `agents.defaults.imageGenerationModel` jest używany przez współdzieloną funkcję generowania obrazów. Jeśli nie jest ustawiony, `image_generate` nadal może wywnioskować domyślny dostawca oparty na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, potem pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj też uwierzytelnianie/klucz API tego dostawcy.
    - `agents.defaults.musicGenerationModel` jest używany przez współdzieloną funkcję generowania muzyki. Jeśli nie jest ustawiony, `music_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, potem pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj też uwierzytelnianie/klucz API tego dostawcy.
    - `agents.defaults.videoGenerationModel` jest używany przez współdzieloną funkcję generowania wideo. Jeśli nie jest ustawiony, `video_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, potem pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj też uwierzytelnianie/klucz API tego dostawcy.
    - Domyślne ustawienia per agent mogą nadpisywać `agents.defaults.model` przez `agents.list[].model` wraz z powiązaniami (zobacz [Multi-agent routing](/pl/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Szybka polityka modeli

- Ustaw model główny na najsilniejszy model najnowszej generacji, do którego masz dostęp.
- Używaj fallbacków do zadań wrażliwych na koszt/opóźnienia i do czatu o mniejszej wadze.
- W przypadku agentów z włączonymi narzędziami lub niezaufanych danych wejściowych unikaj starszych/słabszych klas modeli.

## Wdrożenie początkowe (zalecane)

Jeśli nie chcesz ręcznie edytować konfiguracji, uruchom onboarding:

```bash
openclaw onboard
```

Może skonfigurować model + uwierzytelnianie dla popularnych dostawców, w tym **subskrypcję OpenAI Code (Codex)** (OAuth) oraz **Anthropic** (klucz API albo Claude CLI).

## Klucze konfiguracji (przegląd)

- `agents.defaults.model.primary` i `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` i `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` i `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` i `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` i `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlista + aliasy + parametry dostawcy)
- `models.providers` (dostawcy niestandardowi zapisani w `models.json`)

<Note>
Odwołania do modeli są normalizowane do małych liter. Aliasy dostawców, takie jak `z.ai/*`, są normalizowane do `zai/*`.

Przykłady konfiguracji dostawców (w tym OpenCode) znajdują się w [OpenCode](/pl/providers/opencode).
</Note>

### Bezpieczne edycje allowlisty

Podczas ręcznego aktualizowania `agents.defaults.models` używaj zapisów addytywnych:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Zasady ochrony przed nadpisaniem">
    `openclaw config set` chroni mapy modeli/dostawców przed przypadkowym nadpisaniem. Zwykłe przypisanie obiektu do `agents.defaults.models`, `models.providers` lub `models.providers.<id>.models` jest odrzucane, jeśli usunęłoby istniejące wpisy. Używaj `--merge` do zmian addytywnych; `--replace` stosuj tylko wtedy, gdy podana wartość ma stać się pełną wartością docelową.

    Interaktywna konfiguracja dostawcy i `openclaw configure --section model` również scalają wybory w zakresie dostawcy z istniejącą allowlistą, więc dodanie Codex, Ollama lub innego dostawcy nie usuwa niezwiązanych wpisów modeli. Configure zachowuje istniejące `agents.defaults.model.primary`, gdy uwierzytelnianie dostawcy jest stosowane ponownie. Jawne polecenia ustawiające wartość domyślną, takie jak `openclaw models auth login --provider <id> --set-default` i `openclaw models set <model>`, nadal zastępują `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## „Model is not allowed” (i dlaczego odpowiedzi się zatrzymują)

Jeśli `agents.defaults.models` jest ustawione, staje się **allowlistą** dla `/model` i dla nadpisań sesji. Gdy użytkownik wybierze model, którego nie ma na tej allowliście, OpenClaw zwraca:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Dzieje się to **przed** wygenerowaniem zwykłej odpowiedzi, więc może sprawiać wrażenie, że wiadomość „nie dostała odpowiedzi”. Naprawa polega na jednym z poniższych działań:

- Dodaniu modelu do `agents.defaults.models`, albo
- Wyczyszczeniu allowlisty (usunięciu `agents.defaults.models`), albo
- Wybraniu modelu z `/model list`.

</Warning>

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

## Przełączanie modeli w czacie (`/model`)

Możesz przełączać modele dla bieżącej sesji bez restartu:

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Zachowanie selektora">
    - `/model` (i `/model list`) to zwarty, numerowany selektor (rodzina modeli + dostępni dostawcy).
    - Na Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
    - `/models add` jest wycofane i teraz zwraca komunikat o wycofaniu zamiast rejestrować modele z czatu.
    - `/model <#>` wybiera z tego selektora.

  </Accordion>
  <Accordion title="Trwałość i przełączanie na żywo">
    - `/model` natychmiast zapisuje nowy wybór sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie od razu użyje nowego modelu.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje się do nowego modelu dopiero w czystym punkcie ponowienia.
    - Jeśli aktywność narzędzia lub generowanie odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia albo do następnej tury użytkownika.
    - `/model status` to widok szczegółowy (kandydaci uwierzytelniania oraz, gdy skonfigurowano, `baseUrl` endpointu dostawcy + tryb `api`).

  </Accordion>
  <Accordion title="Parsowanie odwołań">
    - Odwołania do modeli są parsowane przez podział po **pierwszym** `/`. Używaj `provider/model` przy wpisywaniu `/model <ref>`.
    - Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), musisz dołączyć prefiks dostawcy (przykład: `/model openrouter/moonshotai/kimi-k2`).
    - Jeśli pominiesz dostawcę, OpenClaw rozwiązuje dane wejściowe w tej kolejności:
      1. dopasowanie aliasu
      2. unikalne dopasowanie skonfigurowanego dostawcy dla dokładnego nieprefiksowanego identyfikatora modelu
      3. wycofany fallback do skonfigurowanego domyślnego dostawcy — jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw zamiast tego wraca do pierwszego skonfigurowanego dostawcy/modelu, aby nie pokazywać nieaktualnej wartości domyślnej usuniętego dostawcy.
  </Accordion>
</AccordionGroup>

Pełne zachowanie/config polecenia: [Slash commands](/pl/tools/slash-commands).

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

<ParamField path="--all" type="boolean">
  Pełny katalog. Obejmuje statyczne wiersze katalogu dostawców bundled przed skonfigurowaniem uwierzytelniania, dzięki czemu widoki tylko do wykrywania mogą pokazywać modele niedostępne do czasu dodania pasujących poświadczeń dostawcy.
</ParamField>
<ParamField path="--local" type="boolean">
  Tylko dostawcy lokalni.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtruj według identyfikatora dostawcy, na przykład `moonshot`. Etykiety wyświetlane w interaktywnych selektorach nie są akceptowane.
</ParamField>
<ParamField path="--plain" type="boolean">
  Jeden model w wierszu.
</ParamField>
<ParamField path="--json" type="boolean">
  Wyjście czytelne maszynowo.
</ParamField>

### `models status`

Pokazuje rozwiązany model główny, fallbacki, model obrazu oraz przegląd uwierzytelniania skonfigurowanych dostawców. Pokazuje też stan wygaśnięcia OAuth dla profili znalezionych w magazynie uwierzytelniania (domyślnie ostrzega w ciągu 24 h). `--plain` wypisuje tylko rozwiązany model główny.

<AccordionGroup>
  <Accordion title="Zachowanie uwierzytelniania i prób">
    - Stan OAuth jest zawsze pokazywany (i uwzględniany w wyjściu `--json`). Jeśli skonfigurowany dostawca nie ma poświadczeń, `models status` wypisuje sekcję **Missing auth**.
    - JSON zawiera `auth.oauth` (okno ostrzeżenia + profile) oraz `auth.providers` (efektywne uwierzytelnianie dla każdego dostawcy, w tym poświadczenia oparte na env). `auth.oauth` dotyczy tylko kondycji profili w magazynie uwierzytelniania; dostawcy tylko z env nie pojawiają się tam.
    - Użyj `--check` do automatyzacji (kod wyjścia `1` przy braku/wygaśnięciu, `2` przy zbliżającym się wygaśnięciu).
    - Użyj `--probe` do aktywnych kontroli uwierzytelniania; wiersze prób mogą pochodzić z profili uwierzytelniania, poświadczeń env lub `models.json`.
    - Jeśli jawne `auth.order.<provider>` pomija zapisany profil, próba raportuje `excluded_by_auth_order` zamiast go testować. Jeśli uwierzytelnianie istnieje, ale nie da się rozwiązać modelu możliwego do sondowania dla tego dostawcy, próba raportuje `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Wybór uwierzytelniania zależy od dostawcy/konta. W przypadku hostów Gateway działających stale klucze API są zwykle najbardziej przewidywalne; obsługiwane jest również ponowne użycie Claude CLI oraz istniejące profile Anthropic OAuth/token.
</Note>

Przykład (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Skanowanie (darmowe modele OpenRouter)

`openclaw models scan` sprawdza **katalog darmowych modeli** OpenRouter i może opcjonalnie sondować modele pod kątem obsługi narzędzi i obrazów.

<ParamField path="--no-probe" type="boolean">
  Pomiń aktywne sondy (tylko metadane).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Minimalny rozmiar parametrów (miliardy).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Pomiń starsze modele.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtr prefiksu dostawcy.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Rozmiar listy fallbacków.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Ustaw `agents.defaults.model.primary` na pierwszy wybór.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Ustaw `agents.defaults.imageModel.primary` na pierwszy wybór obrazu.
</ParamField>

<Note>
Katalog OpenRouter `/models` jest publiczny, więc skany tylko metadanych mogą wyświetlać darmowych kandydatów bez klucza. Sondowanie i inferencja nadal wymagają klucza API OpenRouter (z profili uwierzytelniania lub `OPENROUTER_API_KEY`). Jeśli żaden klucz nie jest dostępny, `openclaw models scan` wraca do wyjścia tylko z metadanymi i nie zmienia konfiguracji. Użyj `--no-probe`, aby jawnie zażądać trybu tylko metadanych.
</Note>

Wyniki skanowania są rankingowane według:

1. Obsługa obrazów
2. Opóźnienie narzędzi
3. Rozmiar kontekstu
4. Liczba parametrów

Dane wejściowe:

- Lista OpenRouter `/models` (filtr `:free`)
- Aktywne sondy wymagają klucza API OpenRouter z profili uwierzytelniania lub `OPENROUTER_API_KEY` (zobacz [Environment variables](/pl/help/environment))
- Opcjonalne filtry: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrola żądań/sond: `--timeout`, `--concurrency`

Gdy aktywne sondy działają w TTY, możesz interaktywnie wybierać fallbacki. W trybie nieinteraktywnym przekaż `--yes`, aby zaakceptować wartości domyślne. Wyniki tylko z metadanymi mają charakter informacyjny; `--set-default` i `--set-image` wymagają aktywnych sond, aby OpenClaw nie skonfigurował bezużytecznego modelu OpenRouter bez klucza.

## Rejestr modeli (`models.json`)

Niestandardowi dostawcy w `models.providers` są zapisywani do `models.json` w katalogu agenta (domyślnie `~/.openclaw/agents/<agentId>/agent/models.json`). Ten plik jest domyślnie scalany, chyba że `models.mode` ustawiono na `replace`.

<AccordionGroup>
  <Accordion title="Priorytet w trybie scalania">
    Priorytet trybu scalania dla pasujących identyfikatorów dostawców:

    - Niepuste `baseUrl` już obecne w `models.json` agenta ma pierwszeństwo.
    - Niepuste `apiKey` w `models.json` agenta ma pierwszeństwo tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
    - Wartości `apiKey` dostawców zarządzanych przez SecretRef są odświeżane ze znaczników źródła (`ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec) zamiast utrwalać rozwiązane sekrety.
    - Wartości nagłówków dostawców zarządzanych przez SecretRef są odświeżane ze znaczników źródła (`secretref-env:ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec).
    - Puste lub brakujące `apiKey`/`baseUrl` agenta przechodzą do konfiguracji `models.providers`.
    - Inne pola dostawcy są odświeżane z konfiguracji i znormalizowanych danych katalogowych.

  </Accordion>
</AccordionGroup>

<Note>
Utrwalanie znaczników jest autorytatywne względem źródła: OpenClaw zapisuje znaczniki z aktywnej migawki konfiguracji źródłowej (przed rozwiązaniem), a nie z rozwiązanych wartości sekretów środowiska uruchomieniowego. Dotyczy to każdej sytuacji, w której OpenClaw regeneruje `models.json`, w tym ścieżek sterowanych poleceniami takich jak `openclaw agent`.
</Note>

## Powiązane

- [Agent runtimes](/pl/concepts/agent-runtimes) — PI, Codex i inne środowiska uruchomieniowe pętli agentów
- [Configuration reference](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modeli
- [Image generation](/pl/tools/image-generation) — konfiguracja modelu obrazu
- [Model failover](/pl/concepts/model-failover) — łańcuchy fallbacków
- [Model providers](/pl/concepts/model-providers) — routowanie dostawców i uwierzytelnianie
- [Music generation](/pl/tools/music-generation) — konfiguracja modelu muzyki
- [Video generation](/pl/tools/video-generation) — konfiguracja modelu wideo
