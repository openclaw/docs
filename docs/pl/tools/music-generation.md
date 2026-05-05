---
read_when:
    - Generowanie muzyki lub dźwięku za pośrednictwem agenta
    - Konfigurowanie dostawców i modeli generowania muzyki
    - Opis parametrów narzędzia music_generate
sidebarTitle: Music generation
summary: Generuj muzykę za pomocą music_generate w przepływach pracy Google Lyria, MiniMax i ComfyUI
title: Generowanie muzyki
x-i18n:
    generated_at: "2026-05-05T06:19:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

Narzędzie `music_generate` pozwala agentowi tworzyć muzykę lub dźwięk za pomocą
wspólnej funkcji generowania muzyki ze skonfigurowanymi dostawcami — obecnie
Google, MiniMax i skonfigurowanym w przepływie pracy ComfyUI.

W przypadku uruchomień agenta opartych na sesji OpenClaw rozpoczyna generowanie muzyki jako
zadanie w tle, śledzi je w rejestrze zadań, a następnie ponownie wybudza agenta,
gdy utwór jest gotowy, aby agent mógł poinformować użytkownika i dołączyć
gotowy plik audio. W czatach grupowych/kanałowych, które używają widocznego
dostarczania wyłącznie przez narzędzie wiadomości, agent przekazuje wynik przez narzędzie wiadomości. Jeśli
agent kończący zapisze tylko prywatną odpowiedź końcową, OpenClaw używa awaryjnie
bezpośredniej wysyłki kanałem z wygenerowanymi multimediami. Wybudzenie po ukończeniu wyraźnie
ostrzega agenta, że zwykłe odpowiedzi końcowe są prywatne w tych ścieżkach.

<Note>
Wbudowane narzędzie współdzielone pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden
dostawca generowania muzyki. Jeśli nie widzisz `music_generate` w narzędziach
agenta, skonfiguruj `agents.defaults.musicGenerationModel` albo ustaw
klucz API dostawcy.
</Note>

## Szybki start

<Tabs>
  <Tab title="Wspólny z zapleczem dostawcy">
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
        _„Wygeneruj energiczny utwór synthpop o nocnej jeździe przez
        neonowe miasto.”_

        Agent automatycznie wywołuje `music_generate`. Nie jest potrzebna
        lista dozwolonych narzędzi.
      </Step>
    </Steps>

    W bezpośrednich kontekstach synchronicznych bez uruchomienia agenta opartego na sesji
    wbudowane narzędzie nadal używa awaryjnie generowania w wątku i zwraca
    końcową ścieżkę multimediów w wyniku narzędzia.

  </Tab>
  <Tab title="Przepływ pracy ComfyUI">
    <Steps>
      <Step title="Skonfiguruj przepływ pracy">
        Skonfiguruj `plugins.entries.comfy.config.music` z plikiem JSON
        przepływu pracy oraz węzłami promptu/wyjścia.
      </Step>
      <Step title="Uwierzytelnianie w chmurze (opcjonalnie)">
        Dla Comfy Cloud ustaw `COMFY_API_KEY` albo `COMFY_CLOUD_API_KEY`.
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

| Dostawca | Model domyślny        | Dane referencyjne | Obsługiwane kontrolki                                      | Uwierzytelnianie                       |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Do 1 obrazu      | Muzyka lub dźwięk zdefiniowane przez przepływ pracy       | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Do 10 obrazów    | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Brak             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` albo MiniMax OAuth   |

### Macierz możliwości

Jawny kontrakt trybu używany przez `music_generate`, testy kontraktowe i
wspólny przebieg testów live:

| Dostawca | `generate` | `edit` | Limit edycji | Wspólne ścieżki live                                                       |
| -------- | :--------: | :----: | ------------ | -------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 obraz      | Poza wspólnym przebiegiem; pokryte przez `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 obrazów   | `generate`, `edit`                                                         |
| MiniMax  |     ✓      |   —    | Brak         | `generate`                                                                 |

Użyj `action: "list"`, aby sprawdzić dostępnych wspólnych dostawców i modele
w czasie działania:

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
  Opcjonalne teksty utworu, gdy dostawca obsługuje jawne wejście tekstu utworu.
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
<ParamField path="timeoutMs" type="number">Opcjonalny limit czasu żądania do dostawcy w milisekundach. Wartości poniżej 10000ms są podnoszone do 10000ms i zgłaszane w wyniku narzędzia.</ParamField>

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw nadal waliduje twarde
limity, takie jak liczba danych wejściowych, przed przesłaniem. Gdy dostawca obsługuje
czas trwania, ale używa krótszego maksimum niż żądana wartość, OpenClaw
ogranicza ją do najbliższego obsługiwanego czasu trwania. Rzeczywiście nieobsługiwane opcjonalne wskazówki
są ignorowane z ostrzeżeniem, gdy wybrany dostawca lub model nie może ich
uwzględnić. Wyniki narzędzia zgłaszają zastosowane ustawienia; `details.normalization`
rejestruje każde mapowanie wartości żądanej na zastosowaną.
</Note>

## Zachowanie asynchroniczne

Generowanie muzyki oparte na sesji działa jako zadanie w tle:

- **Zadanie w tle:** `music_generate` tworzy zadanie w tle, natychmiast zwraca
  odpowiedź rozpoczęcia/zadania i publikuje ukończony utwór później w
  kolejnej wiadomości agenta.
- **Zapobieganie duplikatom:** gdy zadanie ma stan `queued` albo `running`, późniejsze
  wywołania `music_generate` w tej samej sesji zwracają status zadania zamiast
  rozpoczynać kolejne generowanie. Użyj `action: "status"`, aby sprawdzić to jawnie.
- **Wyszukiwanie statusu:** `openclaw tasks list` albo `openclaw tasks show <taskId>`
  sprawdza status kolejki, działania i stany końcowe.
- **Wybudzenie po ukończeniu:** OpenClaw wstrzykuje wewnętrzne zdarzenie ukończenia z powrotem
  do tej samej sesji, aby model mógł samodzielnie napisać widoczną dla użytkownika odpowiedź uzupełniającą.
- **Wskazówka promptu:** późniejsze tury użytkownika/ręczne w tej samej sesji otrzymują małą
  wskazówkę czasu działania, gdy zadanie muzyczne jest już w toku, aby model
  nie wywoływał ślepo `music_generate` ponownie.
- **Awaryjne działanie bez sesji:** bezpośrednie/lokalne konteksty bez rzeczywistej sesji
  agenta działają w wątku i zwracają końcowy wynik audio w tej samej turze.

### Cykl życia zadania

| Stan        | Znaczenie                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Zadanie utworzone, czeka na zaakceptowanie przez dostawcę.                                      |
| `running`   | Dostawca przetwarza (zwykle od 30 sekund do 3 minut w zależności od dostawcy i czasu trwania). |
| `succeeded` | Utwór gotowy; agent wybudza się i publikuje go w rozmowie.                                     |
| `failed`    | Błąd dostawcy albo limit czasu; agent wybudza się ze szczegółami błędu.                         |

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
3. `musicGenerationModel.fallbacks` w kolejności.
4. Automatyczne wykrywanie wyłącznie przy użyciu domyślnych dostawców z uwierzytelnianiem:
   - najpierw bieżący domyślny dostawca;
   - pozostali zarejestrowani dostawcy generowania muzyki w kolejności identyfikatorów dostawców.

Jeśli dostawca zawiedzie, następny kandydat jest wypróbowywany automatycznie. Jeśli wszyscy
zawiodą, błąd zawiera szczegóły każdej próby.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, aby używać tylko
jawnych wpisów `model`, `primary` i `fallbacks`.

## Uwagi o dostawcach

<AccordionGroup>
  <Accordion title="ComfyUI">
    Sterowany przepływem pracy i zależny od skonfigurowanego grafu oraz mapowania węzłów
    dla pól promptu/wyjścia. Dołączony Plugin `comfy` podłącza się do
    wspólnego narzędzia `music_generate` przez rejestr dostawców
    generowania muzyki.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Używa generowania wsadowego Lyria 3. Bieżący dołączony przepływ obsługuje
    prompt, opcjonalny tekst utworu i opcjonalne obrazy referencyjne.
  </Accordion>
  <Accordion title="MiniMax">
    Używa wsadowego punktu końcowego `music_generation`. Obsługuje prompt, opcjonalny
    tekst utworu, tryb instrumentalny, sterowanie czasem trwania i wyjście mp3 przez
    uwierzytelnianie kluczem API `minimax` albo OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Wybór właściwej ścieżki

- **Wspólny z zapleczem dostawcy**, gdy potrzebujesz wyboru modelu, przełączania awaryjnego
  dostawcy oraz wbudowanego asynchronicznego przepływu zadań/statusu.
- **Ścieżka Plugin (ComfyUI)**, gdy potrzebujesz niestandardowego grafu przepływu pracy albo
  dostawcy, który nie jest częścią wspólnej dołączonej funkcji muzycznej.

Jeśli debugujesz zachowanie specyficzne dla ComfyUI, zobacz
[ComfyUI](/pl/providers/comfy). Jeśli debugujesz wspólne zachowanie dostawców,
zacznij od [Google (Gemini)](/pl/providers/google) albo
[MiniMax](/pl/providers/minimax).

## Tryby możliwości dostawcy

Wspólny kontrakt generowania muzyki obsługuje jawne deklaracje trybu:

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
powinni jawnie deklarować `generate` i `edit`, aby testy live, testy kontraktowe
oraz wspólne narzędzie `music_generate` mogły deterministycznie walidować obsługę trybów.

## Testy live

Opcjonalne pokrycie live dla wspólnych dołączonych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper repozytorium:

```bash
pnpm test:live:media music
```

Ten plik live wczytuje brakujące zmienne środowiskowe dostawców z `~/.profile`, domyślnie preferuje
klucze API live/ze środowiska przed zapisanymi profilami uwierzytelniania i uruchamia zarówno
pokrycie `generate`, jak i zadeklarowane `edit`, gdy dostawca włącza tryb edycji. Dzisiejsze pokrycie:

- `google`: `generate` oraz `edit`
- `minimax`: tylko `generate`
- `comfy`: osobne pokrycie testami na żywo Comfy, poza wspólnym przeglądem dostawców

Opcjonalne pokrycie testami na żywo dla dołączonej ścieżki muzycznej ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Plik testów na żywo Comfy obejmuje też przepływy pracy obrazów i wideo Comfy, gdy te
sekcje są skonfigurowane.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) — śledzenie zadań dla odłączonych uruchomień `music_generate`
- [ComfyUI](/pl/providers/comfy)
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/config-agents#agent-defaults) — konfiguracja `musicGenerationModel`
- [Google (Gemini)](/pl/providers/google)
- [MiniMax](/pl/providers/minimax)
- [Modele](/pl/concepts/models) — konfiguracja modeli i przełączanie awaryjne
- [Przegląd narzędzi](/pl/tools)
