---
read_when:
    - Dodawanie lub modyfikowanie CLI dla modeli (models list/set/scan/aliases/fallbacks)
    - Zmiana zachowania awaryjnego przełączania modelu lub interfejsu wyboru
    - Aktualizowanie sond skanowania modeli (narzędzia/obrazy)
sidebarTitle: Models CLI
summary: 'CLI modeli: list, set, aliases, fallbacks, scan, status'
title: CLI modeli
x-i18n:
    generated_at: "2026-05-10T19:32:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b4d473b9b437e213f8cd2b40cf0ae6000d8fb4a8fa3522813e14659cecc5450
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Przełączanie awaryjne modelu" href="/pl/concepts/model-failover">
    Rotacja profili uwierzytelniania, okresy wyciszenia i ich interakcja z rozwiązaniami fallback.
  </Card>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers">
    Krótki przegląd dostawców i przykłady.
  </Card>
  <Card title="Środowiska uruchomieniowe agentów" href="/pl/concepts/agent-runtimes">
    PI, Codex i inne środowiska uruchomieniowe pętli agenta.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults">
    Klucze konfiguracji modeli.
  </Card>
</CardGroup>

Referencje modeli wybierają dostawcę i model. Zwykle nie wybierają niskopoziomowego środowiska uruchomieniowego agenta. Referencje agentów OpenAI są głównym wyjątkiem: `openai/gpt-5.5` domyślnie działa przez środowisko uruchomieniowe serwera aplikacji Codex u oficjalnego dostawcy OpenAI. Jawne nadpisania środowiska uruchomieniowego należą do polityki dostawcy/modelu, a nie do całego agenta lub sesji. W trybie środowiska uruchomieniowego Codex referencja `openai/gpt-*` nie oznacza rozliczania kluczem API; uwierzytelnianie może pochodzić z konta Codex lub profilu uwierzytelniania `openai-codex`. Zobacz [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes).

## Jak działa wybór modelu

OpenClaw wybiera modele w tej kolejności:

<Steps>
  <Step title="Model podstawowy">
    `agents.defaults.model.primary` (lub `agents.defaults.model`).
  </Step>
  <Step title="Fallbacki">
    `agents.defaults.model.fallbacks` (w kolejności).
  </Step>
  <Step title="Przełączanie awaryjne uwierzytelniania dostawcy">
    Przełączanie awaryjne uwierzytelniania odbywa się wewnątrz dostawcy przed przejściem do następnego modelu.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Powiązane powierzchnie modeli">
    - `agents.defaults.models` to allowlista/katalog modeli, których OpenClaw może używać (oraz aliasy). Użyj wpisów `provider/*`, aby ograniczyć widocznych dostawców, zachowując dynamiczne wykrywanie dostawców.
    - `agents.defaults.imageModel` jest używany **tylko wtedy**, gdy model podstawowy nie może przyjmować obrazów.
    - `agents.defaults.pdfModel` jest używany przez narzędzie `pdf`. Jeśli zostanie pominięty, narzędzie użyje kolejno `agents.defaults.imageModel`, a następnie rozwiązanego modelu sesji/domyślnego.
    - `agents.defaults.imageGenerationModel` jest używany przez współdzieloną funkcję generowania obrazów. Jeśli zostanie pominięty, `image_generate` nadal może wywnioskować domyślnego dostawcę z działającym uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
    - `agents.defaults.musicGenerationModel` jest używany przez współdzieloną funkcję generowania muzyki. Jeśli zostanie pominięty, `music_generate` nadal może wywnioskować domyślnego dostawcę z działającym uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
    - `agents.defaults.videoGenerationModel` jest używany przez współdzieloną funkcję generowania wideo. Jeśli zostanie pominięty, `video_generate` nadal może wywnioskować domyślnego dostawcę z działającym uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
    - Domyślne ustawienia poszczególnych agentów mogą nadpisywać `agents.defaults.model` przez `agents.list[].model` oraz powiązania (zobacz [Routing wieloagentowy](/pl/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Źródło wyboru i zachowanie fallback

To samo `provider/model` może oznaczać różne rzeczy w zależności od tego, skąd pochodzi:

- Skonfigurowane wartości domyślne (`agents.defaults.model.primary` i podstawowe modele specyficzne dla agentów) są normalnym punktem wyjścia i używają `agents.defaults.model.fallbacks`.
- Automatyczne wybory fallback są tymczasowym stanem odzyskiwania. Są przechowywane z `modelOverrideSource: "auto"`, aby kolejne tury mogły nadal używać łańcucha fallback bez wcześniejszego sprawdzania znanego niedziałającego modelu podstawowego.
- Wybory sesji użytkownika są dokładne. `/model`, selektor modelu, `session_status(model=...)` i `sessions.patch` zapisują `modelOverrideSource: "user"`; jeśli wybrany dostawca/model jest nieosiągalny, OpenClaw zgłosi widoczną awarię zamiast przejść do innego skonfigurowanego modelu.
- Cron `--model` / ładunek `model` jest podstawowym modelem dla danego zadania. Nadal używa skonfigurowanych fallbacków, chyba że zadanie dostarczy jawne `fallbacks` w ładunku (użyj `fallbacks: []` dla ścisłego uruchomienia cron).
- Selektory domyślnego modelu CLI i allowlisty respektują `models.mode: "replace"`, wyświetlając jawne `models.providers.*.models` zamiast ładować pełny wbudowany katalog.
- Selektor modeli w interfejsie Control pyta Gateway o skonfigurowany widok modeli: `agents.defaults.models`, jeśli istnieje, w tym wpisy całego dostawcy `provider/*`, w przeciwnym razie jawne `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnianiem. Pełny wbudowany katalog jest zarezerwowany dla jawnych widoków przeglądania, takich jak `models.list` z `view: "all"` lub `openclaw models list --all`.

## Szybka polityka modeli

- Ustaw model podstawowy na najsilniejszy dostępny Ci model najnowszej generacji.
- Używaj fallbacków do zadań wrażliwych na koszt/opóźnienia i rozmów o niższym ryzyku.
- W przypadku agentów z narzędziami lub niezaufanych danych wejściowych unikaj starszych/słabszych poziomów modeli.

## Onboarding (zalecane)

Jeśli nie chcesz ręcznie edytować konfiguracji, uruchom onboarding:

```bash
openclaw onboard
```

Może skonfigurować model i uwierzytelnianie dla typowych dostawców, w tym **subskrypcję OpenAI Code (Codex)** (OAuth) oraz **Anthropic** (klucz API lub Claude CLI).

## Klucze konfiguracji (przegląd)

- `agents.defaults.model.primary` i `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` i `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` i `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` i `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` i `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlista + aliasy + parametry dostawcy + dynamiczne wpisy dostawców `provider/*`)
- `models.providers` (niestandardowi dostawcy zapisani w `models.json`)

<Note>
Referencje modeli są normalizowane do małych liter. Aliasy dostawców, takie jak `z.ai/*`, normalizują się do `zai/*`.

Przykłady konfiguracji dostawców (w tym OpenCode) znajdują się w [OpenCode](/pl/providers/opencode).
</Note>

### Bezpieczne edycje allowlisty

Używaj zapisów addytywnych, gdy ręcznie aktualizujesz `agents.defaults.models`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Reguły ochrony przed nadpisaniem">
    `openclaw config set` chroni mapy modeli/dostawców przed przypadkowym nadpisaniem. Zwykłe przypisanie obiektu do `agents.defaults.models`, `models.providers` lub `models.providers.<id>.models` jest odrzucane, gdy usunęłoby istniejące wpisy. Użyj `--merge` dla zmian addytywnych; użyj `--replace` tylko wtedy, gdy podana wartość ma stać się kompletną wartością docelową.

    Interaktywna konfiguracja dostawcy oraz `openclaw configure --section model` również scalają wybory zakresu dostawcy z istniejącą allowlistą, więc dodanie Codex, Ollama lub innego dostawcy nie usuwa niepowiązanych wpisów modeli. Konfiguracja zachowuje istniejący `agents.defaults.model.primary`, gdy uwierzytelnianie dostawcy jest stosowane ponownie. Jawne polecenia ustawiania wartości domyślnej, takie jak `openclaw models auth login --provider <id> --set-default` i `openclaw models set <model>`, nadal zastępują `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## „Model is not allowed” (i dlaczego odpowiedzi się zatrzymują)

Jeśli `agents.defaults.models` jest ustawione, staje się **allowlistą** dla `/model` i nadpisań sesji. Gdy użytkownik wybierze model, którego nie ma na tej allowliście, OpenClaw zwraca:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Dzieje się to **zanim** zostanie wygenerowana normalna odpowiedź, więc wiadomość może sprawiać wrażenie, że system „nie odpowiedział”. Rozwiązaniem jest:

- Dodanie modelu do `agents.defaults.models`, lub
- Wyczyszczenie allowlisty (usunięcie `agents.defaults.models`), lub
- Wybranie modelu z `/model list`.

</Warning>

Gdy odrzucone polecenie zawierało nadpisanie środowiska uruchomieniowego, takie jak `/model openai/gpt-5.5 --runtime codex`, najpierw napraw allowlistę, a potem ponów to samo polecenie `/model ... --runtime ...`. W przypadku natywnego wykonywania Codex wybranym modelem nadal jest `openai/gpt-5.5`; środowisko uruchomieniowe `codex` wybiera harness i osobno używa uwierzytelniania Codex.

W przypadku modeli lokalnych/GGUF zapisz w allowliście pełną referencję z prefiksem dostawcy,
na przykład `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` albo
dokładne provider/model pokazane przez `openclaw models list --provider <provider>`.
Same lokalne nazwy plików lub nazwy wyświetlane nie wystarczą, gdy allowlista jest
aktywna.

Jeśli chcesz ograniczyć dostawców bez ręcznego wypisywania każdego modelu, dodaj
wpisy `provider/*` do `agents.defaults.models`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai-codex/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Przy takiej polityce `/model`, `/models` i selektory modeli pokazują wykryty
katalog tylko dla tych dostawców. Nowe modele od wybranych dostawców mogą
pojawiać się bez edytowania allowlisty. Dokładne wpisy `provider/model` można mieszać
z wpisami `provider/*`, gdy potrzebujesz jednego konkretnego modelu od innego dostawcy.

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

Możesz przełączać modele dla bieżącej sesji bez restartowania:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Zachowanie selektora">
    - `/model` (i `/model list`) to zwięzły, numerowany selektor (rodzina modeli + dostępni dostawcy).
    - W Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
    - W Telegram wybory selektora `/models` są ograniczone do sesji; nie zmieniają trwałej wartości domyślnej agenta w `openclaw.json`.
    - `/models add` jest przestarzałe i teraz zwraca komunikat o przestarzałości zamiast rejestrować modele z czatu.
    - `/model <#>` wybiera z tego selektora.

  </Accordion>
  <Accordion title="Utrwalanie i przełączanie na żywo">
    - `/model` natychmiast utrwala nowy wybór sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie od razu używa nowego modelu.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponowienia.
    - Jeśli aktywność narzędzia lub wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia albo do następnej tury użytkownika.
    - Wybrana przez użytkownika referencja `/model` jest ścisła dla tej sesji: jeśli wybrany dostawca/model jest nieosiągalny, odpowiedź zakończy się widoczną awarią zamiast po cichu odpowiedzieć z `agents.defaults.model.fallbacks`. Różni się to od skonfigurowanych wartości domyślnych i podstawowych modeli zadań cron, które nadal mogą używać łańcuchów fallback.
    - `/model status` to widok szczegółowy (kandydaci uwierzytelniania oraz, gdy skonfigurowano, punkt końcowy dostawcy `baseUrl` + tryb `api`).

  </Accordion>
  <Accordion title="Analiza refów">
    - Refy modeli są analizowane przez podział przy **pierwszym** `/`. Użyj `provider/model`, gdy wpisujesz `/model <ref>`.
    - Jeśli sam identyfikator modelu zawiera `/` (w stylu OpenRouter), musisz dołączyć prefiks dostawcy (przykład: `/model openrouter/moonshotai/kimi-k2`).
    - Jeśli pominiesz dostawcę, OpenClaw rozwiązuje dane wejściowe w tej kolejności:
      1. dopasowanie aliasu
      2. unikalne dopasowanie skonfigurowanego dostawcy dla dokładnie tego nieprefiksowanego identyfikatora modelu
      3. przestarzały fallback do skonfigurowanego domyślnego dostawcy — jeśli ten dostawca nie udostępnia już skonfigurowanego domyślnego modelu, OpenClaw zamiast tego cofa się do pierwszego skonfigurowanego dostawcy/modelu, aby nie pokazywać nieaktualnej wartości domyślnej usuniętego dostawcy.
  </Accordion>
</AccordionGroup>

Pełne zachowanie poleceń/konfiguracja: [Polecenia ukośnikowe](/pl/tools/slash-commands).

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

Domyślnie pokazuje skonfigurowane modele oraz modele dostępne po uwierzytelnieniu. Przydatne flagi:

<ParamField path="--all" type="boolean">
  Pełny katalog. Zawiera statyczne wiersze katalogu należące do dołączonego dostawcy przed skonfigurowaniem uwierzytelniania, dzięki czemu widoki służące tylko do odkrywania mogą pokazywać modele niedostępne do czasu dodania pasujących danych uwierzytelniających dostawcy.
</ParamField>
<ParamField path="--local" type="boolean">
  Tylko lokalni dostawcy.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtruj według identyfikatora dostawcy, na przykład `moonshot`. Etykiety wyświetlane w interaktywnych selektorach nie są akceptowane.
</ParamField>
<ParamField path="--plain" type="boolean">
  Jeden model na wiersz.
</ParamField>
<ParamField path="--json" type="boolean">
  Dane wyjściowe czytelne maszynowo.
</ParamField>

### `models status`

Pokazuje rozwiązany model podstawowy, fallbacki, model obrazu oraz przegląd uwierzytelniania skonfigurowanych dostawców. Pokazuje też status wygaśnięcia OAuth dla profili znalezionych w magazynie uwierzytelniania (domyślnie ostrzega w ciągu 24 godz.). `--plain` wypisuje tylko rozwiązany model podstawowy.

<AccordionGroup>
  <Accordion title="Zachowanie uwierzytelniania i sondowania">
    - Status OAuth jest zawsze pokazywany (i uwzględniany w danych wyjściowych `--json`). Jeśli skonfigurowany dostawca nie ma danych uwierzytelniających, `models status` wypisuje sekcję **Brak uwierzytelniania**.
    - JSON zawiera `auth.oauth` (okno ostrzegania + profile) oraz `auth.providers` (efektywne uwierzytelnianie dla każdego dostawcy, w tym dane uwierzytelniające oparte na zmiennych środowiskowych). `auth.oauth` dotyczy tylko kondycji profilu w magazynie uwierzytelniania; dostawcy działający wyłącznie na podstawie zmiennych środowiskowych nie pojawiają się tam.
    - Użyj `--check` do automatyzacji (kod wyjścia `1` przy braku/wygaśnięciu, `2` przy zbliżającym się wygaśnięciu).
    - Użyj `--probe` do sprawdzania uwierzytelniania na żywo; wiersze sondowania mogą pochodzić z profili uwierzytelniania, danych uwierzytelniających ze zmiennych środowiskowych lub `models.json`.
    - Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sonda zgłasza `excluded_by_auth_order` zamiast próbować go użyć. Jeśli uwierzytelnianie istnieje, ale nie można rozwiązać żadnego możliwego do sondowania modelu dla tego dostawcy, sonda zgłasza `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Wybór uwierzytelniania zależy od dostawcy/konta. W przypadku zawsze włączonych hostów Gateway klucze API są zwykle najbardziej przewidywalne; obsługiwane jest również ponowne użycie Claude CLI oraz istniejące profile OAuth/tokenów Anthropic.
</Note>

Przykład (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Skanowanie (bezpłatne modele OpenRouter)

`openclaw models scan` sprawdza **katalog bezpłatnych modeli** OpenRouter i może opcjonalnie sondować modele pod kątem obsługi narzędzi i obrazów.

<ParamField path="--no-probe" type="boolean">
  Pomiń sondy na żywo (tylko metadane).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Minimalny rozmiar parametrów (w miliardach).
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
Katalog `/models` OpenRouter jest publiczny, więc skanowania tylko metadanych mogą wypisywać bezpłatnych kandydatów bez klucza. Sondowanie i inferencja nadal wymagają klucza API OpenRouter (z profili uwierzytelniania lub `OPENROUTER_API_KEY`). Jeśli klucz nie jest dostępny, `openclaw models scan` cofa się do danych wyjściowych tylko metadanych i pozostawia konfigurację bez zmian. Użyj `--no-probe`, aby jawnie zażądać trybu tylko metadanych.
</Note>

Wyniki skanowania są oceniane według:

1. Obsługi obrazów
2. Opóźnienia narzędzi
3. Rozmiaru kontekstu
4. Liczby parametrów

Dane wejściowe:

- Lista `/models` OpenRouter (filtr `:free`)
- Sondy na żywo wymagają klucza API OpenRouter z profili uwierzytelniania lub `OPENROUTER_API_KEY` (zobacz [Zmienne środowiskowe](/pl/help/environment))
- Opcjonalne filtry: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Elementy sterujące żądaniem/sondą: `--timeout`, `--concurrency`

Gdy sondy na żywo działają w TTY, możesz interaktywnie wybrać fallbacki. W trybie nieinteraktywnym przekaż `--yes`, aby zaakceptować wartości domyślne. Wyniki tylko metadanych mają charakter informacyjny; `--set-default` i `--set-image` wymagają sond na żywo, aby OpenClaw nie skonfigurował nieużywalnego modelu OpenRouter bez klucza.

## Rejestr modeli (`models.json`)

Niestandardowi dostawcy w `models.providers` są zapisywani do `models.json` w katalogu agenta (domyślnie `~/.openclaw/agents/<agentId>/agent/models.json`). Ten plik jest domyślnie scalany, chyba że `models.mode` jest ustawione na `replace`.

<AccordionGroup>
  <Accordion title="Priorytet trybu scalania">
    Priorytet trybu scalania dla pasujących identyfikatorów dostawców:

    - Niepusty `baseUrl`, który jest już obecny w `models.json` agenta, wygrywa.
    - Niepusty `apiKey` w `models.json` agenta wygrywa tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
    - Wartości `apiKey` dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródłowych (`ENV_VAR_NAME` dla referencji env, `secretref-managed` dla referencji file/exec) zamiast utrwalania rozwiązanych sekretów.
    - Wartości nagłówków dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródłowych (`secretref-env:ENV_VAR_NAME` dla referencji env, `secretref-managed` dla referencji file/exec).
    - Puste lub brakujące `apiKey`/`baseUrl` agenta cofają się do `models.providers` z konfiguracji.
    - Pozostałe pola dostawcy są odświeżane z konfiguracji i znormalizowanych danych katalogu.

  </Accordion>
</AccordionGroup>

<Note>
Utrwalanie znaczników jest autorytatywne względem źródła: OpenClaw zapisuje znaczniki z aktywnej migawki konfiguracji źródłowej (przed rozwiązaniem), a nie z rozwiązanych wartości sekretów w czasie działania. Dotyczy to każdej regeneracji `models.json` przez OpenClaw, w tym ścieżek uruchamianych poleceniami, takich jak `openclaw agent`.
</Note>

## Powiązane

- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes) — PI, Codex i inne środowiska uruchomieniowe pętli agentów
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modelu
- [Generowanie obrazów](/pl/tools/image-generation) — konfiguracja modelu obrazu
- [Przełączanie awaryjne modelu](/pl/concepts/model-failover) — łańcuchy fallbacków
- [Dostawcy modeli](/pl/concepts/model-providers) — routing dostawców i uwierzytelnianie
- [Generowanie muzyki](/pl/tools/music-generation) — konfiguracja modelu muzyki
- [Generowanie wideo](/pl/tools/video-generation) — konfiguracja modelu wideo
