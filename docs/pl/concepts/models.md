---
read_when:
    - Dodawanie lub modyfikowanie CLI modeli (models list/set/scan/aliases/fallbacks)
    - Zmiana zachowania mechanizmu awaryjnego wyboru modelu lub UX wyboru
    - Aktualizowanie sond skanowania modeli (narzędzia/obrazy)
sidebarTitle: Models CLI
summary: 'CLI modeli: lista, ustawianie, aliasy, mechanizmy zapasowe, skanowanie, status'
title: Modele CLI
x-i18n:
    generated_at: "2026-05-05T01:45:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a1dcdb046b914d35513974d4b69fec03a415118d11860dd1c5107efc754ed4f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Awaryjne przełączanie modeli" href="/pl/concepts/model-failover">
    Rotacja profili uwierzytelniania, okresy wyciszenia i ich interakcja z rozwiązaniami awaryjnymi.
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

Odwołania do modeli wybierają dostawcę i model. Zwykle nie wybierają niskopoziomowego środowiska uruchomieniowego agenta. Na przykład `openai/gpt-5.5` może działać przez zwykłą ścieżkę dostawcy OpenAI albo przez środowisko uruchomieniowe serwera aplikacji Codex, zależnie od `agents.defaults.agentRuntime.id`. W trybie środowiska uruchomieniowego Codex odwołanie `openai/gpt-*` nie oznacza rozliczania kluczem API; uwierzytelnianie może pochodzić z konta Codex albo z profilu uwierzytelniania `openai-codex`. Zobacz [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes).

## Jak działa wybór modelu

OpenClaw wybiera modele w tej kolejności:

<Steps>
  <Step title="Model główny">
    `agents.defaults.model.primary` (albo `agents.defaults.model`).
  </Step>
  <Step title="Modele awaryjne">
    `agents.defaults.model.fallbacks` (w kolejności).
  </Step>
  <Step title="Awaryjne przełączanie uwierzytelniania dostawcy">
    Awaryjne przełączanie uwierzytelniania zachodzi wewnątrz dostawcy przed przejściem do następnego modelu.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Powiązane powierzchnie modeli">
    - `agents.defaults.models` to lista dozwolonych/katalog modeli, których OpenClaw może używać (plus aliasy).
    - `agents.defaults.imageModel` jest używany **tylko wtedy, gdy** model główny nie obsługuje obrazów.
    - `agents.defaults.pdfModel` jest używany przez narzędzie `pdf`. Jeśli go pominięto, narzędzie wraca do `agents.defaults.imageModel`, a następnie do rozwiązanego modelu sesji/domyślnego.
    - `agents.defaults.imageGenerationModel` jest używany przez współdzieloną funkcję generowania obrazów. Jeśli go pominięto, `image_generate` nadal może wywnioskować domyślnego dostawcę z uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj też uwierzytelnianie/klucz API tego dostawcy.
    - `agents.defaults.musicGenerationModel` jest używany przez współdzieloną funkcję generowania muzyki. Jeśli go pominięto, `music_generate` nadal może wywnioskować domyślnego dostawcę z uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj też uwierzytelnianie/klucz API tego dostawcy.
    - `agents.defaults.videoGenerationModel` jest używany przez współdzieloną funkcję generowania wideo. Jeśli go pominięto, `video_generate` nadal może wywnioskować domyślnego dostawcę z uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj też uwierzytelnianie/klucz API tego dostawcy.
    - Domyślne ustawienia poszczególnych agentów mogą nadpisywać `agents.defaults.model` przez `agents.list[].model` plus powiązania (zobacz [Routing wieloagentowy](/pl/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Źródło wyboru i zachowanie awaryjne

To samo `provider/model` może oznaczać różne rzeczy zależnie od tego, skąd pochodzi:

- Skonfigurowane ustawienia domyślne (`agents.defaults.model.primary` i modele główne specyficzne dla agentów) są normalnym punktem startowym i używają `agents.defaults.model.fallbacks`.
- Automatyczne wybory awaryjne są tymczasowym stanem odzyskiwania. Są przechowywane z `modelOverrideSource: "auto"`, aby kolejne tury mogły nadal używać łańcucha awaryjnego bez wcześniejszego sprawdzania znanego wadliwego modelu głównego.
- Wybory sesji użytkownika są dokładne. `/model`, selektor modelu, `session_status(model=...)` i `sessions.patch` zapisują `modelOverrideSource: "user"`; jeśli wybrany dostawca/model jest nieosiągalny, OpenClaw zgłasza widoczny błąd zamiast przechodzić do innego skonfigurowanego modelu.
- Cron `--model` / `model` w ładunku to model główny dla pojedynczego zadania. Nadal używa skonfigurowanych modeli awaryjnych, chyba że zadanie dostarcza jawne `fallbacks` w ładunku (użyj `fallbacks: []` dla ścisłego uruchomienia Cron).
- Selektory domyślnego modelu i listy dozwolonych w CLI respektują `models.mode: "replace"`, pokazując jawne `models.providers.*.models` zamiast ładować pełny wbudowany katalog.
- Selektor modelu w interfejsie Control UI pyta Gateway o jego skonfigurowany widok modeli: `agents.defaults.models`, jeśli jest obecne, w przeciwnym razie jawne `models.providers.*.models` plus dostawcy z użytecznym uwierzytelnianiem. Pełny wbudowany katalog jest zarezerwowany dla jawnych widoków przeglądania, takich jak `models.list` z `view: "all"` albo `openclaw models list --all`.

## Szybka polityka modeli

- Ustaw model główny na najsilniejszy dostępny dla Ciebie model najnowszej generacji.
- Używaj modeli awaryjnych do zadań wrażliwych na koszt/opóźnienia i rozmów o niższej stawce.
- Dla agentów z narzędziami lub niezaufanych danych wejściowych unikaj starszych/słabszych klas modeli.

## Onboarding (zalecane)

Jeśli nie chcesz ręcznie edytować konfiguracji, uruchom onboarding:

```bash
openclaw onboard
```

Może skonfigurować model i uwierzytelnianie dla typowych dostawców, w tym **subskrypcję OpenAI Code (Codex)** (OAuth) i **Anthropic** (klucz API albo Claude CLI).

## Klucze konfiguracji (przegląd)

- `agents.defaults.model.primary` i `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` i `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` i `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` i `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` i `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista dozwolonych + aliasy + parametry dostawcy)
- `models.providers` (niestandardowi dostawcy zapisani w `models.json`)

<Note>
Odwołania do modeli są normalizowane do małych liter. Aliasy dostawców, takie jak `z.ai/*`, normalizują się do `zai/*`.

Przykłady konfiguracji dostawców (w tym OpenCode) znajdują się w [OpenCode](/pl/providers/opencode).
</Note>

### Bezpieczne edycje listy dozwolonych

Używaj zapisów addytywnych podczas ręcznego aktualizowania `agents.defaults.models`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Reguły ochrony przed nadpisaniem">
    `openclaw config set` chroni mapy modeli/dostawców przed przypadkowym nadpisaniem. Zwykłe przypisanie obiektu do `agents.defaults.models`, `models.providers` albo `models.providers.<id>.models` jest odrzucane, gdy usunęłoby istniejące wpisy. Użyj `--merge` dla zmian addytywnych; użyj `--replace` tylko wtedy, gdy podana wartość ma stać się pełną wartością docelową.

    Interaktywna konfiguracja dostawcy i `openclaw configure --section model` także scalają wybory w zakresie dostawcy z istniejącą listą dozwolonych, więc dodanie Codex, Ollama albo innego dostawcy nie usuwa niepowiązanych wpisów modeli. Configure zachowuje istniejące `agents.defaults.model.primary`, gdy uwierzytelnianie dostawcy jest stosowane ponownie. Jawne polecenia ustawiające domyślne wartości, takie jak `openclaw models auth login --provider <id> --set-default` i `openclaw models set <model>`, nadal zastępują `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## „Model is not allowed” (i dlaczego odpowiedzi się zatrzymują)

Jeśli `agents.defaults.models` jest ustawione, staje się **listą dozwolonych** dla `/model` i nadpisań sesji. Gdy użytkownik wybierze model, którego nie ma na tej liście dozwolonych, OpenClaw zwraca:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Dzieje się to **zanim** zostanie wygenerowana normalna odpowiedź, więc wiadomość może sprawiać wrażenie, jakby „nie odpowiedział”. Rozwiązaniem jest jedno z poniższych:

- Dodaj model do `agents.defaults.models`, albo
- Wyczyść listę dozwolonych (usuń `agents.defaults.models`), albo
- Wybierz model z `/model list`.

</Warning>

Gdy odrzucone polecenie zawierało nadpisanie środowiska uruchomieniowego, takie jak `/model openai/gpt-5.5 --runtime codex`, najpierw napraw listę dozwolonych, a potem ponów to samo polecenie `/model ... --runtime ...`. Dla natywnego wykonywania Codex wybrany model nadal jest `openai/gpt-5.5`; środowisko uruchomieniowe `codex` wybiera harness i osobno używa uwierzytelniania Codex.

Dla modeli lokalnych/GGUF zapisz pełne odwołanie z prefiksem dostawcy na liście dozwolonych,
na przykład `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` albo
dokładny dostawca/model pokazany przez `openclaw models list --provider <provider>`.
Same lokalne nazwy plików lub nazwy wyświetlane nie wystarczą, gdy lista dozwolonych jest
aktywna.

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

## Przełączanie modeli na czacie (`/model`)

Możesz przełączać modele dla bieżącej sesji bez ponownego uruchamiania:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Zachowanie selektora">
    - `/model` (i `/model list`) to kompaktowy, numerowany selektor (rodzina modelu + dostępni dostawcy).
    - W Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
    - W Telegram wybory selektora `/models` są ograniczone do sesji; nie zmieniają trwałej wartości domyślnej agenta w `openclaw.json`.
    - `/models add` jest przestarzałe i teraz zwraca komunikat o przestarzałości zamiast rejestrować modele z czatu.
    - `/model <#>` wybiera z tego selektora.

  </Accordion>
  <Accordion title="Trwałość i przełączanie na żywo">
    - `/model` natychmiast zapisuje nowy wybór sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie od razu używa nowego modelu.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponownej próby.
    - Jeśli aktywność narzędzi lub wysyłanie odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponownej próby albo do następnej tury użytkownika.
    - Wybrane przez użytkownika odwołanie `/model` jest ścisłe dla tej sesji: jeśli wybrany dostawca/model jest nieosiągalny, odpowiedź kończy się widocznym błędem zamiast cicho odpowiadać z `agents.defaults.model.fallbacks`. Różni się to od skonfigurowanych ustawień domyślnych i modeli głównych zadań Cron, które nadal mogą używać łańcuchów awaryjnych.
    - `/model status` to widok szczegółowy (kandydaci uwierzytelniania oraz, gdy skonfigurowano, endpoint dostawcy `baseUrl` + tryb `api`).

  </Accordion>
  <Accordion title="Parsowanie odwołań">
    - Odwołania do modeli są parsowane przez podział na **pierwszym** `/`. Użyj `provider/model`, wpisując `/model <ref>`.
    - Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), musisz uwzględnić prefiks dostawcy (przykład: `/model openrouter/moonshotai/kimi-k2`).
    - Jeśli pominiesz dostawcę, OpenClaw rozwiązuje dane wejściowe w tej kolejności:
      1. dopasowanie aliasu
      2. unikalne dopasowanie skonfigurowanego dostawcy dla dokładnie tego nieprefiksowanego identyfikatora modelu
      3. przestarzały powrót do skonfigurowanego domyślnego dostawcy — jeśli ten dostawca nie udostępnia już skonfigurowanego domyślnego modelu, OpenClaw zamiast tego wraca do pierwszego skonfigurowanego dostawcy/modelu, aby uniknąć ujawnienia nieaktualnego domyślnego dostawcy, który został usunięty.
  </Accordion>
</AccordionGroup>

Pełne zachowanie/konfiguracja polecenia: [Polecenia z ukośnikiem](/pl/tools/slash-commands).

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

`openclaw models` (bez podpolecenia) jest skrótem do `models status`.

### `models list`

Domyślnie pokazuje skonfigurowane modele i modele dostępne po uwierzytelnieniu. Przydatne flagi:

<ParamField path="--all" type="boolean">
  Pełny katalog. Obejmuje statyczne wiersze katalogu dostarczane z pakietem i należące do providera jeszcze przed skonfigurowaniem uwierzytelniania, dzięki czemu widoki wyłącznie do odkrywania mogą pokazywać modele niedostępne do czasu dodania odpowiednich danych uwierzytelniających providera.
</ParamField>
<ParamField path="--local" type="boolean">
  Tylko lokalni providerzy.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtruj według identyfikatora providera, na przykład `moonshot`. Etykiety wyświetlane w interaktywnych selektorach nie są akceptowane.
</ParamField>
<ParamField path="--plain" type="boolean">
  Jeden model na wiersz.
</ParamField>
<ParamField path="--json" type="boolean">
  Dane wyjściowe czytelne maszynowo.
</ParamField>

### `models status`

Pokazuje rozwiązany model główny, modele zapasowe, model obrazu oraz przegląd uwierzytelniania skonfigurowanych providerów. Pokazuje także status wygaśnięcia OAuth dla profili znalezionych w magazynie uwierzytelniania (domyślnie ostrzega w ciągu 24 godz.). `--plain` wypisuje tylko rozwiązany model główny.

<AccordionGroup>
  <Accordion title="Zachowanie uwierzytelniania i sondowania">
    - Status OAuth jest zawsze pokazywany (i uwzględniany w danych wyjściowych `--json`). Jeśli skonfigurowany provider nie ma danych uwierzytelniających, `models status` wypisuje sekcję **Brak uwierzytelniania**.
    - JSON zawiera `auth.oauth` (okno ostrzeżeń + profile) oraz `auth.providers` (efektywne uwierzytelnianie dla każdego providera, w tym dane uwierzytelniające z env). `auth.oauth` obejmuje tylko kondycję profili z magazynu uwierzytelniania; providerzy wyłącznie z env nie pojawiają się tam.
    - Użyj `--check` do automatyzacji (kod wyjścia `1`, gdy brakuje uwierzytelniania lub wygasło, `2`, gdy wkrótce wygaśnie).
    - Użyj `--probe` do sprawdzeń uwierzytelniania na żywo; wiersze sondowania mogą pochodzić z profili uwierzytelniania, danych uwierzytelniających env lub `models.json`.
    - Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sondowanie zgłasza `excluded_by_auth_order` zamiast próbować go użyć. Jeśli uwierzytelnianie istnieje, ale dla tego providera nie można rozwiązać modelu nadającego się do sondowania, sondowanie zgłasza `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Wybór uwierzytelniania zależy od providera/konta. Dla hostów Gateway działających stale klucze API są zwykle najbardziej przewidywalne; obsługiwane jest także ponowne użycie Claude CLI oraz istniejące profile Anthropic OAuth/token.
</Note>

Przykład (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Skanowanie (darmowe modele OpenRouter)

`openclaw models scan` sprawdza **katalog darmowych modeli** OpenRouter i może opcjonalnie sondować modele pod kątem obsługi narzędzi i obrazów.

<ParamField path="--no-probe" type="boolean">
  Pomiń sondowania na żywo (tylko metadane).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Minimalny rozmiar parametrów (w miliardach).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Pomiń starsze modele.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtr prefiksu providera.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Rozmiar listy zapasowej.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Ustaw `agents.defaults.model.primary` na pierwszy wybór.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Ustaw `agents.defaults.imageModel.primary` na pierwszy wybór obrazu.
</ParamField>

<Note>
Katalog OpenRouter `/models` jest publiczny, więc skanowania tylko metadanych mogą wyświetlać darmowych kandydatów bez klucza. Sondowanie i inferencja nadal wymagają klucza API OpenRouter (z profili uwierzytelniania lub `OPENROUTER_API_KEY`). Jeśli klucz nie jest dostępny, `openclaw models scan` wraca do danych wyjściowych tylko z metadanymi i pozostawia konfigurację bez zmian. Użyj `--no-probe`, aby jawnie zażądać trybu tylko metadanych.
</Note>

Wyniki skanowania są klasyfikowane według:

1. Obsługi obrazów
2. Opóźnienia narzędzi
3. Rozmiaru kontekstu
4. Liczby parametrów

Dane wejściowe:

- Lista OpenRouter `/models` (filtr `:free`)
- Sondowania na żywo wymagają klucza API OpenRouter z profili uwierzytelniania lub `OPENROUTER_API_KEY` (zobacz [Zmienne środowiskowe](/pl/help/environment))
- Opcjonalne filtry: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Sterowanie żądaniami/sondowaniem: `--timeout`, `--concurrency`

Gdy sondowania na żywo działają w TTY, możesz interaktywnie wybrać modele zapasowe. W trybie nieinteraktywnym przekaż `--yes`, aby zaakceptować wartości domyślne. Wyniki tylko z metadanymi mają charakter informacyjny; `--set-default` i `--set-image` wymagają sondowań na żywo, aby OpenClaw nie skonfigurował bezużytecznego modelu OpenRouter bez klucza.

## Rejestr modeli (`models.json`)

Niestandardowi providerzy w `models.providers` są zapisywani do `models.json` w katalogu agenta (domyślnie `~/.openclaw/agents/<agentId>/agent/models.json`). Ten plik jest domyślnie scalany, chyba że `models.mode` jest ustawione na `replace`.

<AccordionGroup>
  <Accordion title="Priorytet trybu scalania">
    Priorytet trybu scalania dla pasujących identyfikatorów providerów:

    - Niepusty `baseUrl` już obecny w `models.json` agenta ma pierwszeństwo.
    - Niepusty `apiKey` w `models.json` agenta ma pierwszeństwo tylko wtedy, gdy ten provider nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
    - Wartości `apiKey` providera zarządzanego przez SecretRef są odświeżane ze znaczników źródłowych (`ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec) zamiast utrwalania rozwiązanych sekretów.
    - Wartości nagłówków providera zarządzanego przez SecretRef są odświeżane ze znaczników źródłowych (`secretref-env:ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec).
    - Pusty lub brakujący `apiKey`/`baseUrl` agenta wraca do `models.providers` z konfiguracji.
    - Inne pola providera są odświeżane z konfiguracji i znormalizowanych danych katalogu.

  </Accordion>
</AccordionGroup>

<Note>
Utrwalanie znaczników jest autorytatywne względem źródła: OpenClaw zapisuje znaczniki z aktywnego snapshotu konfiguracji źródłowej (przed rozwiązaniem), a nie z rozwiązanych wartości sekretów w czasie wykonywania. Ma to zastosowanie zawsze, gdy OpenClaw regeneruje `models.json`, w tym w ścieżkach sterowanych poleceniami, takich jak `openclaw agent`.
</Note>

## Powiązane

- [Środowiska wykonawcze agentów](/pl/concepts/agent-runtimes) — PI, Codex i inne środowiska wykonawcze pętli agenta
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modeli
- [Generowanie obrazów](/pl/tools/image-generation) — konfiguracja modelu obrazu
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover) — łańcuchy modeli zapasowych
- [Providerzy modeli](/pl/concepts/model-providers) — routing providerów i uwierzytelnianie
- [Generowanie muzyki](/pl/tools/music-generation) — konfiguracja modelu muzyki
- [Generowanie wideo](/pl/tools/video-generation) — konfiguracja modelu wideo
