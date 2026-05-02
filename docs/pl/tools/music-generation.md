---
read_when:
    - Generowanie muzyki lub dźwięku za pomocą agenta
    - Konfigurowanie dostawców i modeli do generowania muzyki
    - Zrozumienie parametrów narzędzia music_generate
sidebarTitle: Music generation
summary: Generuj muzykę za pomocą music_generate w przepływach pracy Google Lyria, MiniMax i ComfyUI
title: Generowanie muzyki
x-i18n:
    generated_at: "2026-05-02T10:05:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9199afe17b2641efb1a7523c651724af9c312c1415c7e60ca736341699f6bc26
    source_path: tools/music-generation.md
    workflow: 16
---

Narzędzie `music_generate` pozwala agentowi tworzyć muzykę lub dźwięk za pomocą
wspólnej funkcji generowania muzyki ze skonfigurowanymi dostawcami — obecnie
Google, MiniMax i skonfigurowanym przez workflow ComfyUI.

W przypadku uruchomień agenta opartych na sesji OpenClaw uruchamia generowanie muzyki jako
zadanie w tle, śledzi je w rejestrze zadań, a następnie ponownie budzi agenta,
gdy utwór jest gotowy, aby agent mógł opublikować gotowe audio z powrotem w
oryginalnym kanale.

<Note>
Wbudowane współdzielone narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden
dostawca generowania muzyki. Jeśli nie widzisz `music_generate` w narzędziach
swojego agenta, skonfiguruj `agents.defaults.musicGenerationModel` albo ustaw
klucz API dostawcy.
</Note>

## Szybki start

<Tabs>
  <Tab title="Oparte na współdzielonym dostawcy">
    <Steps>
      <Step title="Skonfiguruj uwierzytelnianie">
        Ustaw klucz API dla co najmniej jednego dostawcy — na przykład
        `GEMINI_API_KEY` lub `MINIMAX_API_KEY`.
      </Step>
      <Step title="Wybierz model domyślny (opcjonalnie)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Poproś agenta">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        Agent automatycznie wywołuje `music_generate`. Nie trzeba dodawać
        narzędzia do listy dozwolonych.
      </Step>
    </Steps>

    W bezpośrednich kontekstach synchronicznych bez uruchomienia agenta opartego na sesji
    wbudowane narzędzie nadal przechodzi na generowanie inline i zwraca
    końcową ścieżkę multimediów w wyniku narzędzia.

  </Tab>
  <Tab title="Workflow ComfyUI">
    <Steps>
      <Step title="Skonfiguruj workflow">
        Skonfiguruj `plugins.entries.comfy.config.music` z workflow
        JSON oraz węzłami promptu i wyjścia.
      </Step>
      <Step title="Uwierzytelnianie w chmurze (opcjonalnie)">
        Dla Comfy Cloud ustaw `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Wywołaj narzędzie">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Przykładowe prompty:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Obsługiwani dostawcy

| Dostawca | Model domyślny         | Dane referencyjne | Obsługiwane kontrolki                                  | Uwierzytelnianie                       |
| -------- | ---------------------- | ----------------- | ------------------------------------------------------ | -------------------------------------- |
| ComfyUI  | `workflow`             | Do 1 obrazu       | Muzyka lub dźwięk zdefiniowane przez workflow          | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Do 10 obrazów     | `lyrics`, `instrumental`, `format`                     | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Brak              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` lub OAuth MiniMax    |

### Macierz możliwości

Jawny kontrakt trybu używany przez `music_generate`, testy kontraktu i
wspólny live sweep:

| Dostawca | `generate` | `edit` | Limit edycji | Wspólne lane’y live                                                       |
| -------- | :--------: | :----: | ------------ | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 obraz      | Nie we wspólnym sweepie; objęte przez `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 obrazów   | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Brak         | `generate`                                                                |

Użyj `action: "list"`, aby sprawdzić dostępnych współdzielonych dostawców i modele w
czasie działania:

```text
/tool music_generate action=list
```

Użyj `action: "status"`, aby sprawdzić aktywne zadanie muzyczne oparte na sesji:

```text
/tool music_generate action=status
```

Przykład bezpośredniego generowania:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parametry narzędzia

<ParamField path="prompt" type="string" required>
  Prompt generowania muzyki. Wymagany dla `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` zwraca bieżące zadanie sesji; `"list"` sprawdza dostawców.
</ParamField>
<ParamField path="model" type="string">
  Nadpisanie dostawcy/modelu (np. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Opcjonalne słowa utworu, gdy dostawca obsługuje jawne wejście tekstu utworu.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Zażądaj wyjścia wyłącznie instrumentalnego, gdy dostawca je obsługuje.
</ParamField>
<ParamField path="image" type="string">
  Pojedyncza ścieżka lub URL obrazu referencyjnego.
</ParamField>
<ParamField path="images" type="string[]">
  Wiele obrazów referencyjnych (do 10 u obsługujących dostawców).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Docelowy czas trwania w sekundach, gdy dostawca obsługuje wskazówki czasu trwania.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Wskazówka formatu wyjściowego, gdy dostawca ją obsługuje.
</ParamField>
<ParamField path="filename" type="string">Wskazówka nazwy pliku wyjściowego.</ParamField>
<ParamField path="timeoutMs" type="number">Opcjonalny limit czasu żądania do dostawcy w milisekundach. Wartości poniżej 10000ms są podnoszone do 10000ms i raportowane w wyniku narzędzia.</ParamField>

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw nadal waliduje twarde
limity, takie jak liczba danych wejściowych, przed wysłaniem. Gdy dostawca obsługuje
czas trwania, ale używa krótszego maksimum niż żądana wartość, OpenClaw
ogranicza ją do najbliższego obsługiwanego czasu trwania. Naprawdę nieobsługiwane opcjonalne wskazówki
są ignorowane z ostrzeżeniem, gdy wybrany dostawca lub model nie może ich
honorować. Wyniki narzędzia raportują zastosowane ustawienia; `details.normalization`
przechwytuje każde mapowanie żądane-do-zastosowanego.
</Note>

## Zachowanie asynchroniczne

Generowanie muzyki oparte na sesji działa jako zadanie w tle:

- **Zadanie w tle:** `music_generate` tworzy zadanie w tle, natychmiast zwraca
  odpowiedź uruchomiono/zadanie i później publikuje gotowy utwór w
  kolejnej wiadomości agenta.
- **Zapobieganie duplikatom:** gdy zadanie ma stan `queued` lub `running`, kolejne
  wywołania `music_generate` w tej samej sesji zwracają status zadania zamiast
  uruchamiać kolejne generowanie. Użyj `action: "status"`, aby sprawdzić to jawnie.
- **Sprawdzanie statusu:** `openclaw tasks list` lub `openclaw tasks show <taskId>`
  sprawdza status oczekujący, uruchomiony i końcowy.
- **Wybudzenie po ukończeniu:** OpenClaw wstrzykuje wewnętrzne zdarzenie ukończenia z powrotem
  do tej samej sesji, aby model mógł samodzielnie napisać kolejną wiadomość
  widoczną dla użytkownika.
- **Wskazówka promptu:** późniejsze tury użytkownika/ręczne w tej samej sesji dostają małą
  wskazówkę czasu działania, gdy zadanie muzyczne jest już w toku, aby model
  nie wywołał ślepo `music_generate` ponownie.
- **Fallback bez sesji:** bezpośrednie/lokalne konteksty bez rzeczywistej sesji agenta
  działają inline i zwracają końcowy wynik audio w tej samej turze.

### Cykl życia zadania

| Stan        | Znaczenie                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Zadanie utworzone, czeka na zaakceptowanie przez dostawcę.                                     |
| `running`   | Dostawca przetwarza (zwykle od 30 sekund do 3 minut, zależnie od dostawcy i czasu trwania).   |
| `succeeded` | Utwór gotowy; agent budzi się i publikuje go w rozmowie.                                      |
| `failed`    | Błąd dostawcy lub przekroczenie limitu czasu; agent budzi się ze szczegółami błędu.           |

Sprawdź status z CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Konfiguracja

### Wybór modelu

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Kolejność wyboru dostawcy

OpenClaw próbuje dostawców w tej kolejności:

1. Parametr `model` z wywołania narzędzia (jeśli agent go określi).
2. `musicGenerationModel.primary` z konfiguracji.
3. `musicGenerationModel.fallbacks` po kolei.
4. Automatyczne wykrywanie wyłącznie z użyciem domyślnych dostawców opartych na uwierzytelnianiu:
   - najpierw bieżący dostawca domyślny;
   - pozostali zarejestrowani dostawcy generowania muzyki w kolejności identyfikatorów dostawcy.

Jeśli dostawca zawiedzie, następny kandydat jest próbowany automatycznie. Jeśli wszyscy
zawiodą, błąd zawiera szczegóły z każdej próby.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, aby używać tylko
jawnych wpisów `model`, `primary` i `fallbacks`.

## Uwagi o dostawcach

<AccordionGroup>
  <Accordion title="ComfyUI">
    Sterowane workflow i zależne od skonfigurowanego grafu oraz mapowania węzłów
    dla pól promptu/wyjścia. Dołączony Plugin `comfy` podłącza się do
    współdzielonego narzędzia `music_generate` przez rejestr dostawców
    generowania muzyki.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Używa generowania wsadowego Lyria 3. Bieżący dołączony przepływ obsługuje
    prompt, opcjonalny tekst słów utworu i opcjonalne obrazy referencyjne.
  </Accordion>
  <Accordion title="MiniMax">
    Używa wsadowego endpointu `music_generation`. Obsługuje prompt, opcjonalne
    słowa utworu, tryb instrumentalny, sterowanie czasem trwania i wyjście mp3 przez
    uwierzytelnianie kluczem API `minimax` albo OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Wybór właściwej ścieżki

- **Oparte na współdzielonym dostawcy** gdy chcesz wyboru modelu, przełączania awaryjnego dostawców
  oraz wbudowanego asynchronicznego przepływu zadań/statusu.
- **Ścieżka Plugin (ComfyUI)** gdy potrzebujesz niestandardowego grafu workflow albo
  dostawcy, który nie jest częścią współdzielonej dołączonej funkcji muzycznej.

Jeśli debugujesz zachowanie specyficzne dla ComfyUI, zobacz
[ComfyUI](/pl/providers/comfy). Jeśli debugujesz zachowanie współdzielonego dostawcy,
zacznij od [Google (Gemini)](/pl/providers/google) lub
[MiniMax](/pl/providers/minimax).

## Tryby możliwości dostawcy

Wspólny kontrakt generowania muzyki obsługuje jawne deklaracje trybów:

- `generate` dla generowania wyłącznie z promptu.
- `edit`, gdy żądanie zawiera co najmniej jeden obraz referencyjny.

Nowe implementacje dostawców powinny preferować jawne bloki trybów:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Starsze płaskie pola, takie jak `maxInputImages`, `supportsLyrics` i
`supportsFormat`, **nie** wystarczają do reklamowania obsługi edycji. Dostawcy
powinni jawnie deklarować `generate` i `edit`, aby testy live, testy kontraktu
oraz współdzielone narzędzie `music_generate` mogły deterministycznie walidować obsługę trybów.

## Testy live

Opcjonalne pokrycie live dla współdzielonych dołączonych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper repozytorium:

```bash
pnpm test:live:media music
```

Ten plik live ładuje brakujące zmienne env dostawcy z `~/.profile`, domyślnie preferuje
klucze API live/env przed zapisanymi profilami uwierzytelniania i uruchamia zarówno
pokrycie `generate`, jak i zadeklarowane `edit`, gdy dostawca włącza tryb edycji.
Dzisiejsze pokrycie:

- `google`: `generate` oraz `edit`
- `minimax`: tylko `generate`
- `comfy`: oddzielne pokrycie live Comfy, nie wspólny sweep dostawców

Opcjonalne pokrycie live dla dołączonej ścieżki muzycznej ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Plik live Comfy obejmuje również przepływy pracy obrazów i wideo Comfy, gdy te
sekcje są skonfigurowane.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) — śledzenie zadań dla odłączonych uruchomień `music_generate`
- [ComfyUI](/pl/providers/comfy)
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — konfiguracja `musicGenerationModel`
- [Google (Gemini)](/pl/providers/google)
- [MiniMax](/pl/providers/minimax)
- [Modele](/pl/concepts/models) — konfiguracja modeli i przełączanie awaryjne
- [Przegląd narzędzi](/pl/tools)
