---
read_when:
    - Dodawanie lub modyfikowanie CLI modeli (models list/set/scan/aliases/fallbacks)
    - Zmiana zachowania awaryjnego wyboru modelu lub UX wyboru
    - Aktualizowanie sond skanowania modeli (narzędzia/obrazy)
sidebarTitle: Models CLI
summary: 'CLI modeli: lista, ustawianie, aliasy, mechanizmy rezerwowe, skanowanie, status'
title: CLI modeli
x-i18n:
    generated_at: "2026-06-27T17:27:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c7d4cbe1e0854a281f57f39dac9ac5f54c65f50da08cf37dfd298f8f1dd5536
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Przełączanie awaryjne modeli" href="/pl/concepts/model-failover">
    Rotacja profili uwierzytelniania, okresy wygaszania oraz ich interakcja z rezerwami.
  </Card>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers">
    Krótki przegląd dostawców i przykłady.
  </Card>
  <Card title="Środowiska uruchomieniowe agentów" href="/pl/concepts/agent-runtimes">
    OpenClaw, Codex i inne środowiska uruchomieniowe pętli agentów.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults">
    Klucze konfiguracji modeli.
  </Card>
</CardGroup>

Referencje modeli wybierają dostawcę i model. Zwykle nie wybierają niskopoziomowego środowiska uruchomieniowego agenta. Głównym wyjątkiem są referencje agentów OpenAI: `openai/gpt-5.5` domyślnie działa przez środowisko uruchomieniowe serwera aplikacji Codex u oficjalnego dostawcy OpenAI. Referencje subskrypcyjne Copilot (`github-copilot/*`) mogą dodatkowo zostać włączone do zewnętrznego pluginu środowiska uruchomieniowego agenta GitHub Copilot — ta ścieżka pozostaje jawna (bez rezerwowego `auto`). Jawne nadpisania środowiska uruchomieniowego należą do zasad dostawcy/modelu, a nie do całego agenta ani sesji. W trybie środowiska uruchomieniowego Codex referencja `openai/gpt-*` nie implikuje rozliczania kluczem API; uwierzytelnianie może pochodzić z konta Codex albo profilu OAuth `openai`. Zobacz [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes) i [Środowisko uruchomieniowe agenta GitHub Copilot](/pl/plugins/copilot).

## Jak działa wybór modelu

OpenClaw wybiera modele w tej kolejności:

<Steps>
  <Step title="Model podstawowy">
    `agents.defaults.model.primary` (albo `agents.defaults.model`).
  </Step>
  <Step title="Rezerwy">
    `agents.defaults.model.fallbacks` (w kolejności).
  </Step>
  <Step title="Przełączanie awaryjne uwierzytelniania dostawcy">
    Przełączanie awaryjne uwierzytelniania odbywa się wewnątrz dostawcy przed przejściem do następnego modelu.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Powiązane powierzchnie modeli">
    - `agents.defaults.models` to lista dozwolonych/katalog modeli, których OpenClaw może używać (plus aliasy). Użyj wpisów `provider/*`, aby ograniczyć widocznych dostawców, zachowując dynamiczne wykrywanie dostawców.
    - `agents.defaults.imageModel` jest używany **tylko wtedy, gdy** model podstawowy nie może przyjmować obrazów.
    - `agents.defaults.pdfModel` jest używany przez narzędzie `pdf`. Jeśli zostanie pominięty, narzędzie przechodzi rezerwowo do `agents.defaults.imageModel`, a następnie do rozwiązanego modelu sesji/domyślnego.
    - `agents.defaults.imageGenerationModel` jest używany przez współdzieloną funkcję generowania obrazów. Jeśli zostanie pominięty, `image_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj też uwierzytelnianie/klucz API tego dostawcy.
    - `agents.defaults.musicGenerationModel` jest używany przez współdzieloną funkcję generowania muzyki. Jeśli zostanie pominięty, `music_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj też uwierzytelnianie/klucz API tego dostawcy.
    - `agents.defaults.videoGenerationModel` jest używany przez współdzieloną funkcję generowania wideo. Jeśli zostanie pominięty, `video_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj też uwierzytelnianie/klucz API tego dostawcy.
    - Domyślne ustawienia poszczególnych agentów mogą nadpisać `agents.defaults.model` przez `agents.list[].model` oraz powiązania (zobacz [Routing wielu agentów](/pl/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Źródło wyboru i zachowanie rezerwowe

Ten sam `provider/model` może oznaczać różne rzeczy w zależności od tego, skąd pochodzi:

- Skonfigurowane wartości domyślne (`agents.defaults.model.primary` oraz podstawowe modele specyficzne dla agentów) są normalnym punktem startowym i używają `agents.defaults.model.fallbacks`.
- Automatyczne wybory rezerwowe są tymczasowym stanem odzyskiwania. Są przechowywane z `modelOverrideSource: "auto"`, aby kolejne tury mogły nadal używać łańcucha rezerwowego bez każdorazowego sprawdzania znanego jako wadliwy modelu podstawowego; OpenClaw okresowo ponownie sprawdza pierwotny model podstawowy, czyści automatyczny wybór po jego odzyskaniu i ogłasza przejścia na rezerwę/odzyskanie raz na zmianę stanu.
- Wybory sesji użytkownika są dokładne. `/model`, selektor modelu, `session_status(model=...)` i `sessions.patch` zapisują `modelOverrideSource: "user"`; jeśli wybrany dostawca/model jest nieosiągalny, OpenClaw zgłasza widoczną awarię zamiast przechodzić do innego skonfigurowanego modelu.
- Zmiana `agents.defaults.model.primary` nie przepisuje istniejących wyborów sesji. Jeśli status mówi `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, wyczyść wybór bieżącej sesji przez `/model default`, aby znów dziedziczyła skonfigurowany model podstawowy.
- Cron `--model` / ładunek `model` jest modelem podstawowym dla zadania. Nadal używa skonfigurowanych rezerw, chyba że zadanie dostarcza jawne `fallbacks` w ładunku (użyj `fallbacks: []` dla ścisłego uruchomienia Cron).
- Selektory domyślnego modelu CLI i listy dozwolonych respektują `models.mode: "replace"`, wyświetlając jawne `models.providers.*.models` zamiast ładować pełny wbudowany katalog.
- Selektor modeli w Control UI pyta Gateway o skonfigurowany widok modeli: `agents.defaults.models`, gdy jest obecne, w tym wpisy całych dostawców `provider/*`, w przeciwnym razie jawne `models.providers.*.models` plus dostawców z użytecznym uwierzytelnianiem. Pełny wbudowany katalog jest zarezerwowany dla jawnych widoków przeglądania, takich jak `models.list` z `view: "all"` albo `openclaw models list --all`.

## Szybka polityka modeli

- Ustaw model podstawowy na najsilniejszy dostępny dla Ciebie model najnowszej generacji.
- Używaj rezerw dla zadań wrażliwych na koszt/opóźnienia oraz rozmów o niższej wadze.
- W przypadku agentów z narzędziami lub niezaufanych danych wejściowych unikaj starszych/słabszych poziomów modeli.

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
- `agents.defaults.models` (lista dozwolonych + aliasy + parametry dostawcy + dynamiczne wpisy dostawców `provider/*`)
- `models.providers` (niestandardowi dostawcy zapisani w `models.json`)

<Note>
Referencje modeli są normalizowane do małych liter. Identyfikatory dostawców poza tym są dokładne; użyj
identyfikatora dostawcy reklamowanego przez plugin.

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

    Interaktywna konfiguracja dostawcy oraz `openclaw configure --section model` również scalają wybory ograniczone do dostawcy z istniejącą listą dozwolonych, więc dodanie Codex, Ollama albo innego dostawcy nie usuwa niepowiązanych wpisów modeli. Configure zachowuje istniejące `agents.defaults.model.primary`, gdy uwierzytelnianie dostawcy jest stosowane ponownie. Jawne polecenia ustawiania wartości domyślnej, takie jak `openclaw models auth login --provider <id> --set-default` i `openclaw models set <model>`, nadal zastępują `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## „Model jest niedozwolony” (i dlaczego odpowiedzi się zatrzymują)

Jeśli `agents.defaults.models` jest ustawione, staje się **listą dozwolonych** dla `/model` oraz nadpisań sesji. Gdy użytkownik wybierze model, którego nie ma na tej liście dozwolonych, OpenClaw zwraca:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Dzieje się to **zanim** zostanie wygenerowana normalna odpowiedź, więc komunikat może sprawiać wrażenie, że „nie odpowiedział”. Rozwiązaniem jest jedno z poniższych:

- Dodaj model do `agents.defaults.models`, albo
- Wyczyść listę dozwolonych (usuń `agents.defaults.models`), albo
- Wybierz model z `/model list`.

</Warning>

Gdy odrzucone polecenie zawierało nadpisanie środowiska uruchomieniowego, takie jak `/model openai/gpt-5.5 --runtime codex`, najpierw napraw listę dozwolonych, a następnie ponów to samo polecenie `/model ... --runtime ...`. W przypadku natywnego wykonywania Codex wybrany model nadal ma postać `openai/gpt-5.5`; środowisko uruchomieniowe `codex` wybiera uprząż i osobno używa uwierzytelniania Codex.

W przypadku modeli lokalnych/GGUF przechowuj na liście dozwolonych pełną referencję z prefiksem dostawcy,
na przykład `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` albo
dokładny dostawca/model pokazany przez `openclaw models list --provider <provider>`.
Same lokalne nazwy plików albo nazwy wyświetlane nie wystarczą, gdy lista dozwolonych jest
aktywna.

Jeśli chcesz ograniczyć dostawców bez ręcznego wypisywania każdego modelu, dodaj
wpisy `provider/*` do `agents.defaults.models`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Przy takiej polityce `/model`, `/models` i selektory modeli pokazują wykryty
katalog tylko dla tych dostawców. Nowe modele od wybranych dostawców mogą
pojawiać się bez edytowania listy dozwolonych. Dokładne wpisy `provider/model` można mieszać
z wpisami `provider/*`, gdy potrzebujesz jednego konkretnego modelu od innego dostawcy.

Przykładowa konfiguracja listy dozwolonych:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
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
/model default
/model status
```

<AccordionGroup>
  <Accordion title="Zachowanie selektora">
    - `/model` (i `/model list`) to kompaktowy, numerowany selektor (rodzina modeli + dostępni dostawcy).
    - W Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawców i modeli oraz krokiem Submit.
    - W Telegram wybory selektora `/models` są ograniczone do sesji; nie zmieniają trwałej wartości domyślnej agenta w `openclaw.json`.
    - `/models add` jest przestarzałe i teraz zwraca komunikat o przestarzałości zamiast rejestrować modele z czatu.
    - `/model <#>` wybiera z tego selektora.

  </Accordion>
  <Accordion title="Trwałość i przełączanie na żywo">
    - `/model` natychmiast zapisuje nowy wybór sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie od razu użyje nowego modelu.
    - Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i uruchamia ponownie z nowym modelem dopiero w czystym punkcie ponowienia.
    - Jeśli aktywność narzędzi lub generowanie odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia albo do następnej tury użytkownika.
    - `/model default` czyści wybór sesji i przywraca sesję do skonfigurowanego modelu domyślnego.
    - Wybrany przez użytkownika ref `/model` jest ścisły dla tej sesji: jeśli wybrany dostawca/model jest nieosiągalny, odpowiedź kończy się widocznym błędem zamiast po cichu odpowiadać z `agents.defaults.model.fallbacks`. Różni się to od skonfigurowanych wartości domyślnych i głównych modeli zadań Cron, które nadal mogą używać łańcuchów zapasowych.
    - `/model status` to widok szczegółowy (kandydaci uwierzytelniania oraz, gdy skonfigurowano, endpoint dostawcy `baseUrl` + tryb `api`).

  </Accordion>
  <Accordion title="Parsowanie refów">
    - Refy modeli są parsowane przez podział przy **pierwszym** `/`. Używaj `provider/model` podczas wpisywania `/model <ref>`.
    - Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), musisz dołączyć prefiks dostawcy (przykład: `/model openrouter/moonshotai/kimi-k2`).
    - Jeśli pominiesz dostawcę, OpenClaw rozwiązuje dane wejściowe w tej kolejności:
      1. dopasowanie aliasu
      2. unikalne dopasowanie skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu bez prefiksu
      3. przestarzały fallback do skonfigurowanego domyślnego dostawcy — jeśli ten dostawca nie udostępnia już skonfigurowanego domyślnego modelu, OpenClaw zamiast tego wraca do pierwszego skonfigurowanego dostawcy/modelu, aby uniknąć pokazywania nieaktualnej wartości domyślnej usuniętego dostawcy.
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

`openclaw models` (bez podpolecenia) to skrót dla `models status`.

### `models list`

Domyślnie pokazuje skonfigurowane/dostępne po uwierzytelnieniu modele. Przydatne flagi:

<ParamField path="--all" type="boolean">
  Pełny katalog. Obejmuje wbudowane statyczne wiersze katalogu należące do dostawcy przed skonfigurowaniem uwierzytelniania, dzięki czemu widoki tylko do wykrywania mogą pokazywać modele niedostępne, dopóki nie dodasz pasujących poświadczeń dostawcy.
</ParamField>
<ParamField path="--local" type="boolean">
  Tylko lokalni dostawcy.
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

Pokazuje rozwiązany model główny, modele zapasowe, model obrazu oraz przegląd uwierzytelniania skonfigurowanych dostawców. Pokazuje także status wygaśnięcia OAuth dla profili znalezionych w magazynie uwierzytelniania (domyślnie ostrzega w ciągu 24 godzin). `--plain` wypisuje tylko rozwiązany model główny.

<AccordionGroup>
  <Accordion title="Zachowanie uwierzytelniania i sondowania">
    - Status OAuth jest zawsze pokazywany (i dołączany do danych wyjściowych `--json`). Jeśli skonfigurowany dostawca nie ma poświadczeń, `models status` wypisuje sekcję **Brak uwierzytelniania**.
    - JSON zawiera `auth.oauth` (okno ostrzegania + profile) i `auth.providers` (efektywne uwierzytelnianie na dostawcę, w tym poświadczenia oparte na zmiennych środowiskowych). `auth.oauth` to wyłącznie stan profili magazynu uwierzytelniania; dostawcy tylko ze zmiennych środowiskowych nie pojawiają się tam.
    - Użyj `--check` do automatyzacji (kod wyjścia `1`, gdy brakuje lub wygasło, `2`, gdy wkrótce wygaśnie).
    - Użyj `--probe` do sprawdzania uwierzytelniania na żywo; wiersze sondowania mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`.
    - Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sonda zgłasza `excluded_by_auth_order` zamiast go próbować. Jeśli uwierzytelnianie istnieje, ale dla tego dostawcy nie można rozwiązać żadnego modelu nadającego się do sondowania, sonda zgłasza `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Wybór uwierzytelniania zależy od dostawcy/konta. Dla zawsze włączonych hostów Gateway klucze API są zwykle najbardziej przewidywalne; obsługiwane jest także ponowne użycie Claude CLI oraz istniejące profile OAuth/tokenów Anthropic.
</Note>

Przykład (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Skanowanie (darmowe modele OpenRouter)

`openclaw models scan` sprawdza **katalog darmowych modeli** OpenRouter i opcjonalnie może sondować modele pod kątem obsługi narzędzi i obrazów.

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
  Rozmiar listy modeli zapasowych.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Ustaw `agents.defaults.model.primary` na pierwszy wybór.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Ustaw `agents.defaults.imageModel.primary` na pierwszy wybór obrazu.
</ParamField>

<Note>
Katalog OpenRouter `/models` jest publiczny, więc skany wyłącznie metadanych mogą listować darmowych kandydatów bez klucza. Sondowanie i inferencja nadal wymagają klucza API OpenRouter (z profili uwierzytelniania lub `OPENROUTER_API_KEY`). Jeśli klucz nie jest dostępny, `openclaw models scan` wraca do danych wyjściowych tylko z metadanymi i pozostawia konfigurację bez zmian. Użyj `--no-probe`, aby jawnie zażądać trybu wyłącznie metadanych.
</Note>

Wyniki skanowania są klasyfikowane według:

1. Obsługi obrazów
2. Opóźnienia narzędzi
3. Rozmiaru kontekstu
4. Liczby parametrów

Dane wejściowe:

- Lista OpenRouter `/models` (filtr `:free`)
- Sondy na żywo wymagają klucza API OpenRouter z profili uwierzytelniania lub `OPENROUTER_API_KEY` (zobacz [Zmienne środowiskowe](/pl/help/environment))
- Opcjonalne filtry: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrole żądań/sond: `--timeout`, `--concurrency`

Gdy sondy na żywo działają w TUI, możesz interaktywnie wybrać modele zapasowe. W trybie nieinteraktywnym przekaż `--yes`, aby zaakceptować wartości domyślne. Wyniki wyłącznie metadanych mają charakter informacyjny; `--set-default` i `--set-image` wymagają sond na żywo, aby OpenClaw nie skonfigurował bezużytecznego modelu OpenRouter bez klucza.

## Rejestr modeli (`models.json`)

Niestandardowi dostawcy w `models.providers` są zapisywani do `models.json` w katalogu agenta (domyślnie `~/.openclaw/agents/<agentId>/agent/models.json`). Katalogi dostawców-pluginów są przechowywane jako wygenerowane fragmenty katalogu należące do pluginu w stanie pluginu agenta i ładowane automatycznie. Ten plik jest domyślnie scalany, chyba że `models.mode` jest ustawione na `replace`.

<AccordionGroup>
  <Accordion title="Priorytet trybu scalania">
    Priorytet trybu scalania dla pasujących identyfikatorów dostawców:

    - Niepuste `baseUrl` już obecne w `models.json` agenta wygrywa.
    - Niepuste `apiKey` w `models.json` agenta wygrywa tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
    - Wartości `apiKey` dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródła (`ENV_VAR_NAME` dla refów środowiskowych, `secretref-managed` dla refów plik/exec) zamiast utrwalać rozwiązane sekrety.
    - Wartości nagłówków dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródła (`secretref-env:ENV_VAR_NAME` dla refów środowiskowych, `secretref-managed` dla refów plik/exec).
    - Puste lub brakujące `apiKey`/`baseUrl` agenta wracają do konfiguracji `models.providers`.
    - Inne pola dostawcy są odświeżane z konfiguracji i znormalizowanych danych katalogu.

  </Accordion>
</AccordionGroup>

<Note>
Utrwalanie znaczników jest autorytatywne względem źródła: OpenClaw zapisuje znaczniki z aktywnej migawki konfiguracji źródłowej (przed rozwiązaniem), a nie z rozwiązanych wartości sekretów w czasie wykonywania. Ma to zastosowanie zawsze, gdy OpenClaw regeneruje `models.json`, w tym w ścieżkach uruchamianych poleceniami, takich jak `openclaw agent`.
</Note>

## Powiązane

- [Środowiska wykonawcze agentów](/pl/concepts/agent-runtimes) — OpenClaw, Codex i inne środowiska wykonawcze pętli agentów
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modeli
- [Generowanie obrazów](/pl/tools/image-generation) — konfiguracja modelu obrazów
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover) — łańcuchy zapasowe
- [Dostawcy modeli](/pl/concepts/model-providers) — routing dostawców i uwierzytelnianie
- [Generowanie muzyki](/pl/tools/music-generation) — konfiguracja modelu muzyki
- [Generowanie wideo](/pl/tools/video-generation) — konfiguracja modelu wideo
