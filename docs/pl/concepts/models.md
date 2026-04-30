---
read_when:
    - Dodawanie lub modyfikowanie CLI dla modeli (models list/set/scan/aliases/fallbacks)
    - Zmiana zachowania awaryjnego przełączania modeli lub UX wyboru modelu
    - Aktualizowanie sond skanowania modeli (narzędzia/obrazy)
sidebarTitle: Models CLI
summary: 'CLI modeli: lista, ustawianie, aliasy, mechanizmy awaryjne, skanowanie, status'
title: Modele CLI
x-i18n:
    generated_at: "2026-04-30T09:48:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64b97ddfcc6f804044580dfc9a441d426f737e9e7d007d78b0b045a52068b34f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Przełączanie awaryjne modeli" href="/pl/concepts/model-failover">
    Rotacja profili uwierzytelniania, okresy cooldown i ich interakcja z mechanizmami zapasowymi.
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
    `agents.defaults.model.primary` (albo `agents.defaults.model`).
  </Step>
  <Step title="Modele zapasowe">
    `agents.defaults.model.fallbacks` (w kolejności).
  </Step>
  <Step title="Przełączanie awaryjne uwierzytelniania dostawcy">
    Przełączanie awaryjne uwierzytelniania odbywa się wewnątrz dostawcy przed przejściem do następnego modelu.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Powiązane powierzchnie modeli">
    - `agents.defaults.models` to allowlista/katalog modeli, których OpenClaw może używać (plus aliasy).
    - `agents.defaults.imageModel` jest używany **tylko wtedy, gdy** model główny nie może przyjmować obrazów.
    - `agents.defaults.pdfModel` jest używany przez narzędzie `pdf`. Jeśli zostanie pominięty, narzędzie przechodzi awaryjnie na `agents.defaults.imageModel`, a potem na rozpoznany model sesji/domyślny.
    - `agents.defaults.imageGenerationModel` jest używany przez współdzieloną funkcję generowania obrazów. Jeśli zostanie pominięty, `image_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, a następnie pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
    - `agents.defaults.musicGenerationModel` jest używany przez współdzieloną funkcję generowania muzyki. Jeśli zostanie pominięty, `music_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, a następnie pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
    - `agents.defaults.videoGenerationModel` jest używany przez współdzieloną funkcję generowania wideo. Jeśli zostanie pominięty, `video_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, a następnie pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
    - Domyślne ustawienia poszczególnych agentów mogą nadpisywać `agents.defaults.model` przez `agents.list[].model` oraz powiązania (zobacz [Routing wielu agentów](/pl/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Źródło wyboru i zachowanie awaryjne

To samo `provider/model` może oznaczać różne rzeczy zależnie od tego, skąd pochodzi:

- Skonfigurowane ustawienia domyślne (`agents.defaults.model.primary` i modele główne właściwe dla agentów) są zwykłym punktem startowym i używają `agents.defaults.model.fallbacks`.
- Automatyczne wybory awaryjne są tymczasowym stanem odzyskiwania. Są przechowywane z `modelOverrideSource: "auto"`, aby kolejne tury mogły nadal używać łańcucha awaryjnego bez wcześniejszego sprawdzania znanego wadliwego modelu głównego.
- Wybory użytkownika w sesji są dokładne. `/model`, selektor modelu, `session_status(model=...)` i `sessions.patch` zapisują `modelOverrideSource: "user"`; jeśli wybrany dostawca/model jest nieosiągalny, OpenClaw zgłasza widoczną awarię zamiast przechodzić do innego skonfigurowanego modelu.
- Cron `--model` / `model` w ładunku to model główny dla danego zadania. Nadal używa skonfigurowanych modeli zapasowych, chyba że zadanie podaje jawne `fallbacks` w ładunku (użyj `fallbacks: []` dla ścisłego uruchomienia cron).
- Selektory domyślnego modelu i allowlisty w CLI respektują `models.mode: "replace"`, wypisując jawne `models.providers.*.models` zamiast ładować pełny wbudowany katalog.
- Selektor modelu w Control UI pyta Gateway o skonfigurowany widok modeli: `agents.defaults.models`, gdy jest obecne, w przeciwnym razie jawne `models.providers.*.models` plus dostawców z działającym uwierzytelnianiem. Pełny wbudowany katalog jest zarezerwowany dla jawnych widoków przeglądania, takich jak `models.list` z `view: "all"` albo `openclaw models list --all`.

## Krótka polityka modeli

- Ustaw model główny na najsilniejszy model najnowszej generacji, do którego masz dostęp.
- Używaj modeli zapasowych dla zadań wrażliwych na koszt/opóźnienia oraz czatu o niższej wadze.
- Dla agentów z włączonymi narzędziami albo niezaufanych danych wejściowych unikaj starszych/słabszych warstw modeli.

## Onboarding (zalecane)

Jeśli nie chcesz ręcznie edytować konfiguracji, uruchom onboarding:

```bash
openclaw onboard
```

Może skonfigurować model i uwierzytelnianie dla typowych dostawców, w tym **subskrypcję OpenAI Code (Codex)** (OAuth) oraz **Anthropic** (klucz API albo Claude CLI).

## Klucze konfiguracji (przegląd)

- `agents.defaults.model.primary` i `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` i `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` i `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` i `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` i `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlista + aliasy + parametry dostawców)
- `models.providers` (niestandardowi dostawcy zapisani w `models.json`)

<Note>
Odwołania do modeli są normalizowane do małych liter. Aliasy dostawców takie jak `z.ai/*` normalizują się do `zai/*`.

Przykłady konfiguracji dostawców (w tym OpenCode) znajdują się w [OpenCode](/pl/providers/opencode).
</Note>

### Bezpieczne edycje allowlisty

Używaj zapisów addytywnych podczas ręcznego aktualizowania `agents.defaults.models`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Reguły ochrony przed nadpisaniem">
    `openclaw config set` chroni mapy modeli/dostawców przed przypadkowym nadpisaniem. Proste przypisanie obiektu do `agents.defaults.models`, `models.providers` albo `models.providers.<id>.models` jest odrzucane, gdy usunęłoby istniejące wpisy. Użyj `--merge` dla zmian addytywnych; użyj `--replace` tylko wtedy, gdy podana wartość ma stać się pełną wartością docelową.

    Interaktywna konfiguracja dostawcy oraz `openclaw configure --section model` także scalają wybory ograniczone do dostawcy z istniejącą allowlistą, więc dodanie Codex, Ollama albo innego dostawcy nie usuwa niepowiązanych wpisów modeli. Konfiguracja zachowuje istniejący `agents.defaults.model.primary`, gdy uwierzytelnianie dostawcy zostaje ponownie zastosowane. Jawne polecenia ustawiania domyślnego modelu, takie jak `openclaw models auth login --provider <id> --set-default` i `openclaw models set <model>`, nadal zastępują `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## „Model is not allowed” (i dlaczego odpowiedzi się zatrzymują)

Jeśli `agents.defaults.models` jest ustawione, staje się **allowlistą** dla `/model` i nadpisań sesji. Gdy użytkownik wybierze model, którego nie ma na tej allowliście, OpenClaw zwraca:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Dzieje się to **zanim** zostanie wygenerowana zwykła odpowiedź, więc wiadomość może sprawiać wrażenie, że „nie odpowiedziała”. Rozwiązaniem jest jedno z poniższych:

- Dodaj model do `agents.defaults.models`, albo
- Wyczyść allowlistę (usuń `agents.defaults.models`), albo
- Wybierz model z `/model list`.

</Warning>

Dla modeli lokalnych/GGUF przechowuj w allowliście pełne odwołanie z prefiksem dostawcy,
na przykład `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` albo
dokładny dostawca/model pokazany przez `openclaw models list --provider <provider>`.
Same lokalne nazwy plików albo nazwy wyświetlane nie wystarczą, gdy allowlista jest
aktywna.

Przykład konfiguracji allowlisty:

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
    - `/model` (oraz `/model list`) to kompaktowy, numerowany selektor (rodzina modelu + dostępni dostawcy).
    - W Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
    - `/models add` jest przestarzałe i teraz zwraca komunikat o przestarzałości zamiast rejestrować modele z czatu.
    - `/model <#>` wybiera z tego selektora.

  </Accordion>
  <Accordion title="Trwałość i przełączanie na żywo">
    - `/model` natychmiast utrwala nowy wybór sesji.
    - Jeśli agent jest bezczynny, następne uruchomienie od razu używa nowego modelu.
    - Jeśli uruchomienie już trwa, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponownej próby.
    - Jeśli aktywność narzędzi albo generowanie odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponownej próby albo do następnej tury użytkownika.
    - Wybrane przez użytkownika odwołanie `/model` jest ścisłe dla tej sesji: jeśli wybrany dostawca/model jest nieosiągalny, odpowiedź kończy się widoczną awarią zamiast cicho odpowiadać z `agents.defaults.model.fallbacks`. Różni się to od skonfigurowanych ustawień domyślnych i modeli głównych zadań cron, które nadal mogą używać łańcuchów awaryjnych.
    - `/model status` to widok szczegółowy (kandydaci uwierzytelniania oraz, gdy skonfigurowano, punkt końcowy dostawcy `baseUrl` + tryb `api`).

  </Accordion>
  <Accordion title="Parsowanie odwołań">
    - Odwołania do modeli są parsowane przez podział na **pierwszym** `/`. Używaj `provider/model` podczas wpisywania `/model <ref>`.
    - Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), musisz podać prefiks dostawcy (przykład: `/model openrouter/moonshotai/kimi-k2`).
    - Jeśli pominiesz dostawcę, OpenClaw rozpoznaje dane wejściowe w tej kolejności:
      1. dopasowanie aliasu
      2. unikalne dopasowanie skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu bez prefiksu
      3. przestarzałe przejście awaryjne do skonfigurowanego dostawcy domyślnego — jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw zamiast tego przechodzi awaryjnie do pierwszego skonfigurowanego dostawcy/modelu, aby uniknąć pokazywania nieaktualnego domyślnego dostawcy, który został usunięty.
  </Accordion>
</AccordionGroup>

Pełne zachowanie/konfiguracja poleceń: [Polecenia slash](/pl/tools/slash-commands).

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

Domyślnie pokazuje modele skonfigurowane/dostępne dzięki uwierzytelnianiu. Przydatne flagi:

<ParamField path="--all" type="boolean">
  Pełny katalog. Obejmuje wiersze wbudowanego statycznego katalogu należącego do dostawców przed skonfigurowaniem uwierzytelniania, więc widoki służące tylko do odkrywania mogą pokazywać modele niedostępne do czasu dodania pasujących poświadczeń dostawcy.
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

Pokazuje rozpoznany model podstawowy, modele rezerwowe, model obrazów oraz przegląd uwierzytelniania skonfigurowanych dostawców. Pokazuje też stan wygaśnięcia OAuth dla profili znalezionych w magazynie uwierzytelniania (domyślnie ostrzega w ciągu 24 h). `--plain` wypisuje tylko rozpoznany model podstawowy.

<AccordionGroup>
  <Accordion title="Zachowanie uwierzytelniania i sondowania">
    - Stan OAuth jest zawsze pokazywany (i uwzględniany w wyjściu `--json`). Jeśli skonfigurowany dostawca nie ma poświadczeń, `models status` wypisuje sekcję **Brak uwierzytelniania**.
    - JSON zawiera `auth.oauth` (okno ostrzegania + profile) i `auth.providers` (efektywne uwierzytelnianie dla każdego dostawcy, w tym poświadczenia oparte na zmiennych środowiskowych). `auth.oauth` dotyczy tylko kondycji profili z magazynu uwierzytelniania; dostawcy działający wyłącznie przez zmienne środowiskowe nie pojawiają się tam.
    - Użyj `--check` do automatyzacji (kod wyjścia `1`, gdy brakuje uwierzytelniania albo wygasło, `2`, gdy wkrótce wygaśnie).
    - Użyj `--probe` do sprawdzania uwierzytelniania na żywo; wiersze sondowania mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych albo `models.json`.
    - Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sondowanie zgłasza `excluded_by_auth_order` zamiast próbować go użyć. Jeśli uwierzytelnianie istnieje, ale dla tego dostawcy nie da się rozpoznać modelu możliwego do sondowania, sondowanie zgłasza `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Wybór uwierzytelniania zależy od dostawcy/konta. Dla stale działających hostów Gateway klucze API są zwykle najbardziej przewidywalne; obsługiwane jest też ponowne użycie Claude CLI oraz istniejące profile Anthropic OAuth/token.
</Note>

Przykład (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Skanowanie (darmowe modele OpenRouter)

`openclaw models scan` sprawdza **katalog darmowych modeli** OpenRouter i może opcjonalnie sondować modele pod kątem obsługi narzędzi i obrazów.

<ParamField path="--no-probe" type="boolean">
  Pomija sondowania na żywo (tylko metadane).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Minimalny rozmiar parametrów (w miliardach).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Pomija starsze modele.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtr prefiksu dostawcy.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Rozmiar listy modeli rezerwowych.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Ustawia `agents.defaults.model.primary` na pierwszy wybór.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Ustawia `agents.defaults.imageModel.primary` na pierwszy wybór obrazu.
</ParamField>

<Note>
Katalog OpenRouter `/models` jest publiczny, więc skany obejmujące tylko metadane mogą wypisywać darmowych kandydatów bez klucza. Sondowanie i inferencja nadal wymagają klucza API OpenRouter (z profili uwierzytelniania albo `OPENROUTER_API_KEY`). Jeśli klucz nie jest dostępny, `openclaw models scan` przechodzi na wyjście obejmujące tylko metadane i pozostawia konfigurację bez zmian. Użyj `--no-probe`, aby jawnie zażądać trybu obejmującego tylko metadane.
</Note>

Wyniki skanowania są klasyfikowane według:

1. Obsługi obrazów
2. Opóźnienia narzędzi
3. Rozmiaru kontekstu
4. Liczby parametrów

Dane wejściowe:

- Lista OpenRouter `/models` (filtr `:free`)
- Sondowania na żywo wymagają klucza API OpenRouter z profili uwierzytelniania albo `OPENROUTER_API_KEY` (zobacz [Zmienne środowiskowe](/pl/help/environment))
- Opcjonalne filtry: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrola żądań/sondowania: `--timeout`, `--concurrency`

Gdy sondowania na żywo działają w TTY, możesz wybierać modele rezerwowe interaktywnie. W trybie nieinteraktywnym przekaż `--yes`, aby zaakceptować wartości domyślne. Wyniki obejmujące tylko metadane są informacyjne; `--set-default` i `--set-image` wymagają sondowań na żywo, aby OpenClaw nie skonfigurował nieużywalnego modelu OpenRouter bez klucza.

## Rejestr modeli (`models.json`)

Niestandardowi dostawcy w `models.providers` są zapisywani do `models.json` w katalogu agenta (domyślnie `~/.openclaw/agents/<agentId>/agent/models.json`). Ten plik jest domyślnie scalany, chyba że `models.mode` jest ustawione na `replace`.

<AccordionGroup>
  <Accordion title="Priorytet trybu scalania">
    Priorytet trybu scalania dla pasujących identyfikatorów dostawców:

    - Niepuste `baseUrl` już obecne w `models.json` agenta wygrywa.
    - Niepuste `apiKey` w `models.json` agenta wygrywa tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
    - Wartości `apiKey` dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródła (`ENV_VAR_NAME` dla odwołań środowiskowych, `secretref-managed` dla odwołań do pliku/wykonania), zamiast utrwalać rozpoznane sekrety.
    - Wartości nagłówków dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródła (`secretref-env:ENV_VAR_NAME` dla odwołań środowiskowych, `secretref-managed` dla odwołań do pliku/wykonania).
    - Puste lub brakujące `apiKey`/`baseUrl` agenta używają awaryjnie `models.providers` z konfiguracji.
    - Pozostałe pola dostawcy są odświeżane z konfiguracji i znormalizowanych danych katalogu.

  </Accordion>
</AccordionGroup>

<Note>
Utrwalanie znaczników jest autorytatywne względem źródła: OpenClaw zapisuje znaczniki z aktywnego zrzutu konfiguracji źródłowej (przed rozpoznaniem), a nie z rozpoznanych wartości sekretów w czasie działania. Dotyczy to każdego ponownego generowania `models.json` przez OpenClaw, w tym ścieżek uruchamianych poleceniami, takich jak `openclaw agent`.
</Note>

## Powiązane

- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes) — PI, Codex i inne środowiska uruchomieniowe pętli agentów
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modeli
- [Generowanie obrazów](/pl/tools/image-generation) — konfiguracja modelu obrazów
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover) — łańcuchy modeli rezerwowych
- [Dostawcy modeli](/pl/concepts/model-providers) — routing i uwierzytelnianie dostawców
- [Generowanie muzyki](/pl/tools/music-generation) — konfiguracja modelu muzyki
- [Generowanie wideo](/pl/tools/video-generation) — konfiguracja modelu wideo
