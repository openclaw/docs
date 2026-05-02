---
read_when:
    - Dodawanie lub modyfikowanie CLI modeli (models list/set/scan/aliases/fallbacks)
    - Zmiana zachowania awaryjnego modelu lub UX wyboru
    - Aktualizowanie sond skanowania modelu (narzędzia/obrazy)
sidebarTitle: Models CLI
summary: 'CLI modeli: lista, ustawianie, aliasy, opcje awaryjne, skanowanie, status'
title: Modele CLI
x-i18n:
    generated_at: "2026-05-02T09:48:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d362c8cc41801b5e480560c8d34be53e1ada53a23c49af99adb7874e265ddb1f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Przełączanie awaryjne modeli" href="/pl/concepts/model-failover">
    Rotacja profili uwierzytelniania, okresy wyciszenia i interakcja z mechanizmami zapasowymi.
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

Odwołania do modeli wybierają dostawcę i model. Zwykle nie wybierają niskopoziomowego środowiska uruchomieniowego agenta. Na przykład `openai/gpt-5.5` może działać przez standardową ścieżkę dostawcy OpenAI albo przez środowisko uruchomieniowe serwera aplikacji Codex, zależnie od `agents.defaults.agentRuntime.id`. W trybie środowiska uruchomieniowego Codex odwołanie `openai/gpt-*` nie oznacza rozliczania za pomocą klucza API; uwierzytelnianie może pochodzić z konta Codex albo profilu uwierzytelniania `openai-codex`. Zobacz [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes).

## Jak działa wybór modelu

OpenClaw wybiera modele w następującej kolejności:

<Steps>
  <Step title="Model podstawowy">
    `agents.defaults.model.primary` (albo `agents.defaults.model`).
  </Step>
  <Step title="Modele zapasowe">
    `agents.defaults.model.fallbacks` (w kolejności).
  </Step>
  <Step title="Awaryjne przełączanie uwierzytelniania dostawcy">
    Awaryjne przełączanie uwierzytelniania odbywa się wewnątrz dostawcy przed przejściem do następnego modelu.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Powiązane powierzchnie modeli">
    - `agents.defaults.models` to lista dozwolonych/katalog modeli, których OpenClaw może używać (wraz z aliasami).
    - `agents.defaults.imageModel` jest używany **tylko wtedy**, gdy model podstawowy nie może przyjmować obrazów.
    - `agents.defaults.pdfModel` jest używany przez narzędzie `pdf`. Jeśli zostanie pominięty, narzędzie przechodzi awaryjnie do `agents.defaults.imageModel`, a następnie do rozwiązanego modelu sesji/domyślnego.
    - `agents.defaults.imageGenerationModel` jest używany przez współdzieloną funkcję generowania obrazów. Jeśli zostanie pominięty, `image_generate` nadal może wywnioskować domyślnego dostawcę z dostępnym uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
    - `agents.defaults.musicGenerationModel` jest używany przez współdzieloną funkcję generowania muzyki. Jeśli zostanie pominięty, `music_generate` nadal może wywnioskować domyślnego dostawcę z dostępnym uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
    - `agents.defaults.videoGenerationModel` jest używany przez współdzieloną funkcję generowania wideo. Jeśli zostanie pominięty, `video_generate` nadal może wywnioskować domyślnego dostawcę z dostępnym uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
    - Domyślne ustawienia poszczególnych agentów mogą nadpisać `agents.defaults.model` przez `agents.list[].model` oraz powiązania (zobacz [Routing wielu agentów](/pl/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Źródło wyboru i zachowanie mechanizmu zapasowego

To samo `provider/model` może oznaczać różne rzeczy zależnie od tego, skąd pochodzi:

- Skonfigurowane wartości domyślne (`agents.defaults.model.primary` i podstawowe modele specyficzne dla agentów) są normalnym punktem startowym i używają `agents.defaults.model.fallbacks`.
- Automatyczne wybory zapasowe są tymczasowym stanem odzyskiwania. Są przechowywane z `modelOverrideSource: "auto"`, dzięki czemu kolejne tury mogą nadal używać łańcucha zapasowego bez wcześniejszego sprawdzania znanego, niedziałającego modelu podstawowego.
- Wybory sesji użytkownika są dokładne. `/model`, selektor modelu, `session_status(model=...)` i `sessions.patch` zapisują `modelOverrideSource: "user"`; jeśli wybrany dostawca/model jest nieosiągalny, OpenClaw zgłasza widoczną awarię zamiast przechodzić do innego skonfigurowanego modelu.
- Cron `--model` / ładunek `model` to model podstawowy dla zadania. Nadal używa skonfigurowanych modeli zapasowych, chyba że zadanie dostarcza jawny ładunek `fallbacks` (użyj `fallbacks: []` dla ścisłego uruchomienia cron).
- Selektory domyślnego modelu CLI i listy dozwolonych respektują `models.mode: "replace"`, wyświetlając jawne `models.providers.*.models` zamiast ładowania pełnego wbudowanego katalogu.
- Selektor modelu w Control UI pyta Gateway o skonfigurowany widok modeli: `agents.defaults.models`, gdy jest obecne, w przeciwnym razie jawne `models.providers.*.models` oraz dostawców z używalnym uwierzytelnianiem. Pełny wbudowany katalog jest zarezerwowany dla jawnych widoków przeglądania, takich jak `models.list` z `view: "all"` albo `openclaw models list --all`.

## Szybka polityka modeli

- Ustaw model podstawowy na najsilniejszy model najnowszej generacji dostępny dla Ciebie.
- Używaj modeli zapasowych dla zadań wrażliwych na koszt/opóźnienia oraz rozmów o niższej wadze.
- W przypadku agentów z włączonymi narzędziami albo niezaufanych danych wejściowych unikaj starszych/słabszych poziomów modeli.

## Wdrażanie (zalecane)

Jeśli nie chcesz ręcznie edytować konfiguracji, uruchom wdrażanie:

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
- `agents.defaults.models` (lista dozwolonych + aliasy + parametry dostawcy)
- `models.providers` (niestandardowi dostawcy zapisani w `models.json`)

<Note>
Odwołania do modeli są normalizowane do małych liter. Aliasy dostawców takie jak `z.ai/*` normalizują się do `zai/*`.

Przykłady konfiguracji dostawców (w tym OpenCode) znajdują się w [OpenCode](/pl/providers/opencode).
</Note>

### Bezpieczne edycje listy dozwolonych

Używaj zapisów addytywnych podczas ręcznej aktualizacji `agents.defaults.models`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Reguły ochrony przed nadpisaniem">
    `openclaw config set` chroni mapy modeli/dostawców przed przypadkowym nadpisaniem. Proste przypisanie obiektu do `agents.defaults.models`, `models.providers` albo `models.providers.<id>.models` jest odrzucane, jeśli usunęłoby istniejące wpisy. Użyj `--merge` dla zmian addytywnych; użyj `--replace` tylko wtedy, gdy podana wartość ma stać się pełną wartością docelową.

    Interaktywna konfiguracja dostawcy oraz `openclaw configure --section model` także scalają wybory ograniczone do dostawcy z istniejącą listą dozwolonych, więc dodanie Codex, Ollama albo innego dostawcy nie usuwa niepowiązanych wpisów modeli. Konfigurator zachowuje istniejące `agents.defaults.model.primary`, gdy uwierzytelnianie dostawcy jest stosowane ponownie. Jawne polecenia ustawiania wartości domyślnej, takie jak `openclaw models auth login --provider <id> --set-default` i `openclaw models set <model>`, nadal zastępują `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## „Model nie jest dozwolony” (i dlaczego odpowiedzi się zatrzymują)

Jeśli `agents.defaults.models` jest ustawione, staje się **listą dozwolonych** dla `/model` oraz nadpisań sesji. Gdy użytkownik wybierze model, którego nie ma na tej liście dozwolonych, OpenClaw zwraca:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Dzieje się to **przed** wygenerowaniem normalnej odpowiedzi, więc komunikat może sprawiać wrażenie, że „nie odpowiedział”. Rozwiązaniem jest jedno z poniższych:

- Dodaj model do `agents.defaults.models`, albo
- Wyczyść listę dozwolonych (usuń `agents.defaults.models`), albo
- Wybierz model z `/model list`.

</Warning>

W przypadku modeli lokalnych/GGUF zapisz na liście dozwolonych pełne odwołanie z prefiksem dostawcy,
na przykład `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` albo
dokładny dostawca/model pokazany przez `openclaw models list --provider <provider>`.
Same lokalne nazwy plików albo nazwy wyświetlane nie wystarczą, gdy lista dozwolonych jest
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
    - `/model` (i `/model list`) to kompaktowy, numerowany selektor (rodzina modeli + dostępni dostawcy).
    - Na Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz krokiem przesłania.
    - Na Telegram wybory selektora `/models` są ograniczone do sesji; nie zmieniają trwałego domyślnego ustawienia agenta w `openclaw.json`.
    - `/models add` jest przestarzałe i teraz zwraca komunikat o wycofaniu zamiast rejestrować modele z czatu.
    - `/model <#>` wybiera z tego selektora.

  </Accordion>
  <Accordion title="Trwałość i przełączanie na żywo">
    - `/model` natychmiast utrwala nowy wybór sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie od razu użyje nowego modelu.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponowienia.
    - Jeśli aktywność narzędzi albo wynik odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia albo do następnej tury użytkownika.
    - Wybrane przez użytkownika odwołanie `/model` jest ścisłe dla tej sesji: jeśli wybrany dostawca/model jest nieosiągalny, odpowiedź kończy się widoczną awarią zamiast po cichu odpowiadać z `agents.defaults.model.fallbacks`. To różni się od skonfigurowanych wartości domyślnych i podstawowych modeli zadań cron, które nadal mogą używać łańcuchów zapasowych.
    - `/model status` to widok szczegółowy (kandydaci uwierzytelniania oraz, gdy skonfigurowano, punkt końcowy dostawcy `baseUrl` + tryb `api`).

  </Accordion>
  <Accordion title="Parsowanie odwołań">
    - Odwołania do modeli są parsowane przez podział na **pierwszym** `/`. Użyj `provider/model`, wpisując `/model <ref>`.
    - Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), musisz podać prefiks dostawcy (przykład: `/model openrouter/moonshotai/kimi-k2`).
    - Jeśli pominiesz dostawcę, OpenClaw rozwiązuje dane wejściowe w tej kolejności:
      1. dopasowanie aliasu
      2. unikalne dopasowanie skonfigurowanego dostawcy dla dokładnie tego nieprefiksowanego identyfikatora modelu
      3. przestarzałe przejście awaryjne do skonfigurowanego domyślnego dostawcy — jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw zamiast tego przechodzi awaryjnie do pierwszego skonfigurowanego dostawcy/modelu, aby uniknąć ujawniania nieaktualnej wartości domyślnej usuniętego dostawcy.
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

Domyślnie pokazuje modele skonfigurowane/dostępne przez uwierzytelnianie. Przydatne flagi:

<ParamField path="--all" type="boolean">
  Pełny katalog. Obejmuje dołączone, statyczne wiersze katalogu należące do dostawców przed skonfigurowaniem uwierzytelniania, dzięki czemu widoki służące wyłącznie do wykrywania mogą pokazywać modele niedostępne do czasu dodania pasujących danych uwierzytelniających dostawcy.
</ParamField>
<ParamField path="--local" type="boolean">
  Tylko dostawcy lokalni.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtruj według identyfikatora dostawcy, na przykład `moonshot`. Etykiety wyświetlane z interaktywnych selektorów nie są akceptowane.
</ParamField>
<ParamField path="--plain" type="boolean">
  Jeden model na wiersz.
</ParamField>
<ParamField path="--json" type="boolean">
  Dane wyjściowe czytelne maszynowo.
</ParamField>

### `models status`

Pokazuje rozpoznany model podstawowy, modele zapasowe, model obrazu oraz przegląd uwierzytelniania skonfigurowanych dostawców. Pokazuje także status wygaśnięcia OAuth dla profili znalezionych w magazynie uwierzytelniania (domyślnie ostrzega w ciągu 24 godzin). `--plain` wypisuje tylko rozpoznany model podstawowy.

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - Status OAuth jest zawsze pokazywany (i uwzględniany w danych wyjściowych `--json`). Jeśli skonfigurowany dostawca nie ma danych uwierzytelniających, `models status` wypisuje sekcję **Brak uwierzytelniania**.
    - JSON obejmuje `auth.oauth` (okno ostrzegania + profile) oraz `auth.providers` (efektywne uwierzytelnianie dla każdego dostawcy, w tym dane uwierzytelniające z env). `auth.oauth` dotyczy tylko kondycji profili z magazynu uwierzytelniania; dostawcy wyłącznie env nie pojawiają się tam.
    - Użyj `--check` do automatyzacji (kod zakończenia `1` przy braku lub wygaśnięciu, `2` przy zbliżającym się wygaśnięciu).
    - Użyj `--probe` do aktywnych sprawdzeń uwierzytelniania; wiersze sondowania mogą pochodzić z profili uwierzytelniania, danych uwierzytelniających env albo `models.json`.
    - Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sonda zgłasza `excluded_by_auth_order` zamiast próbować go użyć. Jeśli uwierzytelnianie istnieje, ale dla tego dostawcy nie można rozpoznać modelu możliwego do sondowania, sonda zgłasza `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Wybór uwierzytelniania zależy od dostawcy i konta. W przypadku zawsze aktywnych hostów Gateway klucze API są zwykle najbardziej przewidywalne; obsługiwane jest także ponowne użycie Claude CLI oraz istniejące profile OAuth/token Anthropic.
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
  Minimalny rozmiar parametrów (w miliardach).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Pomiń starsze modele.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtr prefiksu dostawcy.
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
Katalog OpenRouter `/models` jest publiczny, więc skany wyłącznie metadanych mogą wypisywać darmowych kandydatów bez klucza. Sondowanie i inferencja nadal wymagają klucza API OpenRouter (z profili uwierzytelniania albo `OPENROUTER_API_KEY`). Jeśli klucz nie jest dostępny, `openclaw models scan` przechodzi na dane wyjściowe wyłącznie metadanych i pozostawia konfigurację bez zmian. Użyj `--no-probe`, aby jawnie zażądać trybu wyłącznie metadanych.
</Note>

Wyniki skanowania są rankingowane według:

1. Obsługi obrazów
2. Opóźnienia narzędzi
3. Rozmiaru kontekstu
4. Liczby parametrów

Dane wejściowe:

- Lista OpenRouter `/models` (filtr `:free`)
- Aktywne sondy wymagają klucza API OpenRouter z profili uwierzytelniania albo `OPENROUTER_API_KEY` (zobacz [Zmienne środowiskowe](/pl/help/environment))
- Opcjonalne filtry: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Sterowanie żądaniami/sondowaniem: `--timeout`, `--concurrency`

Gdy aktywne sondy działają w TTY, możesz interaktywnie wybrać modele zapasowe. W trybie nieinteraktywnym przekaż `--yes`, aby zaakceptować wartości domyślne. Wyniki wyłącznie metadanych mają charakter informacyjny; `--set-default` i `--set-image` wymagają aktywnych sond, aby OpenClaw nie skonfigurował bezużytecznego modelu OpenRouter bez klucza.

## Rejestr modeli (`models.json`)

Niestandardowi dostawcy w `models.providers` są zapisywani do `models.json` w katalogu agenta (domyślnie `~/.openclaw/agents/<agentId>/agent/models.json`). Ten plik jest domyślnie scalany, chyba że `models.mode` ustawiono na `replace`.

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    Priorytet trybu scalania dla pasujących identyfikatorów dostawców:

    - Niepuste `baseUrl` już obecne w `models.json` agenta ma pierwszeństwo.
    - Niepusty `apiKey` w `models.json` agenta ma pierwszeństwo tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
    - Wartości `apiKey` dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródłowych (`ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec) zamiast utrwalania rozpoznanych sekretów.
    - Wartości nagłówków dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródłowych (`secretref-env:ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec).
    - Puste lub brakujące `apiKey`/`baseUrl` agenta wracają do `models.providers` z konfiguracji.
    - Inne pola dostawcy są odświeżane z konfiguracji i znormalizowanych danych katalogu.

  </Accordion>
</AccordionGroup>

<Note>
Utrwalanie znaczników jest autorytatywne względem źródła: OpenClaw zapisuje znaczniki z aktywnej migawki konfiguracji źródłowej (przed rozpoznaniem), a nie z rozpoznanych wartości sekretów środowiska wykonawczego. Dotyczy to każdego przypadku, gdy OpenClaw regeneruje `models.json`, w tym ścieżek wywoływanych poleceniami, takich jak `openclaw agent`.
</Note>

## Powiązane

- [Środowiska wykonawcze agentów](/pl/concepts/agent-runtimes) — PI, Codex i inne środowiska wykonawcze pętli agenta
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modeli
- [Generowanie obrazów](/pl/tools/image-generation) — konfiguracja modelu obrazu
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover) — łańcuchy zapasowe
- [Dostawcy modeli](/pl/concepts/model-providers) — routing dostawców i uwierzytelnianie
- [Generowanie muzyki](/pl/tools/music-generation) — konfiguracja modelu muzyki
- [Generowanie wideo](/pl/tools/video-generation) — konfiguracja modelu wideo
