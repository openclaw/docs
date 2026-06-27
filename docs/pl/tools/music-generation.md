---
read_when:
    - Generowanie muzyki lub dźwięku za pośrednictwem agenta
    - Konfigurowanie dostawców i modeli generowania muzyki
    - Zrozumienie parametrów narzędzia music_generate
sidebarTitle: Music generation
summary: Generuj muzykę za pomocą music_generate w przepływach pracy ComfyUI, fal, Google Lyria, MiniMax i OpenRouter
title: Generowanie muzyki
x-i18n:
    generated_at: "2026-06-27T18:28:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

Narzędzie `music_generate` pozwala agentowi tworzyć muzykę lub audio za pomocą
wspólnej funkcji generowania muzyki ze skonfigurowanymi dostawcami — obecnie
ComfyUI, fal, Google, MiniMax i OpenRouter.

W przypadku uruchomień agenta opartych na sesji OpenClaw rozpoczyna generowanie
muzyki jako zadanie w tle, śledzi je w rejestrze zadań, a następnie ponownie
wybudza agenta, gdy utwór jest gotowy, aby agent mógł poinformować użytkownika
i załączyć gotowe audio. Agent obsługujący ukończenie działa zgodnie ze zwykłym
trybem widocznej odpowiedzi sesji: automatyczne dostarczenie odpowiedzi końcowej,
gdy jest skonfigurowane, albo `message(action="send")`, gdy sesja wymaga
narzędzia wiadomości. Jeśli sesja żądającego jest nieaktywna lub jej aktywne
wybudzenie się nie powiedzie, a w odpowiedzi końcowej nadal brakuje części
wygenerowanego audio, OpenClaw wysyła idempotentną bezpośrednią odpowiedź
awaryjną zawierającą tylko brakujące audio.

<Note>
Wbudowane narzędzie współdzielone pojawia się tylko wtedy, gdy dostępny jest co
najmniej jeden dostawca generowania muzyki. Jeśli nie widzisz `music_generate`
w narzędziach agenta, skonfiguruj `agents.defaults.musicGenerationModel` albo
ustaw klucz API dostawcy.
</Note>

## Szybki start

<Tabs>
  <Tab title="Wspólne, oparte na dostawcy">
    <Steps>
      <Step title="Skonfiguruj uwierzytelnianie">
        Ustaw klucz API dla co najmniej jednego dostawcy — na przykład
        `GEMINI_API_KEY` lub `MINIMAX_API_KEY`.
      </Step>
      <Step title="Wybierz domyślny model (opcjonalnie)">
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
      <Step title="Zapytaj agenta">
        _„Wygeneruj energiczny utwór synthpop o nocnej jeździe przez
        neonowe miasto.”_

        Agent automatycznie wywołuje `music_generate`. Nie trzeba dodawać
        narzędzia do listy dozwolonych.
      </Step>
    </Steps>

    W bezpośrednich kontekstach synchronicznych bez uruchomienia agenta opartego
    na sesji wbudowane narzędzie nadal przechodzi awaryjnie do generowania inline
    i zwraca końcową ścieżkę multimediów w wyniku narzędzia.

  </Tab>
  <Tab title="Przepływ pracy ComfyUI">
    <Steps>
      <Step title="Skonfiguruj przepływ pracy">
        Skonfiguruj `plugins.entries.comfy.config.music` z JSON przepływu pracy
        oraz węzłami promptu i wyjścia.
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

| Dostawca   | Model domyślny              | Dane referencyjne | Obsługiwane ustawienia                                | Uwierzytelnianie                       |
| ---------- | --------------------------- | ----------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                  | Do 1 obrazu       | Muzyka lub audio zdefiniowane przez przepływ pracy    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6` | Brak              | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` lub `FAL_API_KEY`            |
| Google     | `lyria-3-clip-preview`      | Do 10 obrazów     | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                 | Brak              | `lyrics`, `instrumental`, `format=mp3`                | `MINIMAX_API_KEY` lub OAuth MiniMax    |
| OpenRouter | `google/lyria-3-pro-preview` | Do 1 obrazu      | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### Macierz możliwości

Jawny kontrakt trybu używany przez `music_generate`, testy kontraktowe i
wspólny przegląd live:

| Dostawca   | `generate` | `edit` | Limit edycji | Wspólne ścieżki live                                                       |
| ---------- | :--------: | :----: | ------------ | -------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 obraz      | Nie w wspólnym przeglądzie; pokryte przez `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Brak         | `generate`                                                                 |
| Google     |     ✓      |   ✓    | 10 obrazów   | `generate`, `edit`                                                         |
| MiniMax    |     ✓      |   —    | Brak         | `generate`                                                                 |
| OpenRouter |     ✓      |   ✓    | 1 obraz      | `generate`, `edit`                                                         |

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
  Opcjonalny tekst piosenki, gdy dostawca obsługuje jawne wejście tekstu.
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

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw nadal weryfikuje
twarde limity, takie jak liczby wejść, przed wysłaniem żądania. Gdy dostawca
obsługuje czas trwania, ale używa krótszego maksimum niż żądana wartość,
OpenClaw ogranicza ją do najbliższego obsługiwanego czasu trwania. Naprawdę
nieobsługiwane opcjonalne wskazówki są ignorowane z ostrzeżeniem, gdy wybrany
dostawca lub model nie może ich honorować. Wyniki narzędzia raportują
zastosowane ustawienia; `details.normalization` zapisuje każde mapowanie
z wartości żądanej na zastosowaną.
</Note>

Limity czasu żądań dostawcy są wyłącznie konfiguracją operatora. OpenClaw używa
`agents.defaults.musicGenerationModel.timeoutMs`, gdy jest skonfigurowane,
podnosi wartości poniżej 120000ms do 120000ms, a w przeciwnym razie domyślnie
ustawia żądania dostawcy na 300000ms.

## Zachowanie asynchroniczne

Generowanie muzyki oparte na sesji działa jako zadanie w tle:

- **Zadanie w tle:** `music_generate` tworzy zadanie w tle, natychmiast zwraca
  odpowiedź rozpoczęcia/zadania, a później publikuje gotowy utwór w kolejnej
  wiadomości agenta.
- **Zapobieganie duplikatom:** gdy zadanie ma stan `queued` lub `running`,
  późniejsze wywołania `music_generate` w tej samej sesji zwracają status
  zadania zamiast rozpoczynać kolejne generowanie. Użyj `action: "status"`,
  aby sprawdzić to jawnie.
- **Odczyt statusu:** `openclaw tasks list` lub `openclaw tasks show <taskId>`
  sprawdza statusy oczekujące, działające i końcowe.
- **Wybudzenie po ukończeniu:** OpenClaw wstrzykuje wewnętrzne zdarzenie
  ukończenia z powrotem do tej samej sesji, aby model mógł samodzielnie
  napisać widoczną dla użytkownika odpowiedź następczą.
- **Wskazówka promptu:** późniejsze tury użytkownika/ręczne w tej samej sesji
  otrzymują małą wskazówkę czasu działania, gdy zadanie muzyczne jest już
  w toku, aby model nie wywoływał bezrefleksyjnie `music_generate` ponownie.
- **Fallback bez sesji:** bezpośrednie/lokalne konteksty bez rzeczywistej
  sesji agenta działają inline i zwracają końcowy wynik audio w tej samej turze.

### Cykl życia zadania

| Stan        | Znaczenie                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Zadanie utworzone, czeka na przyjęcie przez dostawcę.                                          |
| `running`   | Dostawca przetwarza (zwykle od 30 sekund do 3 minut zależnie od dostawcy i czasu trwania).     |
| `succeeded` | Utwór gotowy; agent wybudza się i publikuje go w rozmowie.                                     |
| `failed`    | Błąd dostawcy lub limit czasu; agent wybudza się ze szczegółami błędu.                         |

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
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
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
4. Automatyczne wykrywanie tylko z użyciem domyślnych dostawców opartych na uwierzytelnianiu:
   - najpierw bieżący dostawca domyślny;
   - pozostali zarejestrowani dostawcy generowania muzyki w kolejności identyfikatorów dostawców.

Jeśli dostawca zawiedzie, automatycznie próbowany jest następny kandydat. Jeśli
wszyscy zawiodą, błąd zawiera szczegóły każdej próby.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, aby używać
tylko jawnych wpisów `model`, `primary` i `fallbacks`.

## Uwagi o dostawcach

<AccordionGroup>
  <Accordion title="ComfyUI">
    Oparte na przepływie pracy i zależne od skonfigurowanego grafu oraz mapowania
    węzłów dla pól promptu/wyjścia. Dołączony Plugin `comfy` podłącza się do
    wspólnego narzędzia `music_generate` przez rejestr dostawców generowania
    muzyki.
  </Accordion>
  <Accordion title="fal">
    Używa punktów końcowych modeli fal przez wspólną ścieżkę uwierzytelniania
    dostawcy. Dołączony dostawca domyślnie używa `fal-ai/minimax-music/v2.6`
    i udostępnia też `fal-ai/ace-step/prompt-to-audio` oraz
    `fal-ai/stable-audio-25/text-to-audio` dla żądań prompt-to-audio.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Używa generowania wsadowego Lyria 3. Bieżący dołączony przepływ obsługuje
    prompt, opcjonalny tekst piosenki i opcjonalne obrazy referencyjne.
  </Accordion>
  <Accordion title="MiniMax">
    Używa wsadowego punktu końcowego `music_generation`. Obsługuje prompt,
    opcjonalny tekst piosenki, tryb instrumentalny i wyjście mp3 przez
    uwierzytelnianie kluczem API `minimax` albo OAuth `minimax-portal`.
  </Accordion>
  <Accordion title="OpenRouter">
    Używa wyjścia audio z uzupełnień czatu OpenRouter z włączonym strumieniowaniem.
    Dołączony dostawca domyślnie używa `google/lyria-3-pro-preview` i udostępnia
    też `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Wybór właściwej ścieżki

- **Wspólne, oparte na dostawcy**, gdy potrzebujesz wyboru modelu, przełączania
  awaryjnego dostawcy oraz wbudowanego asynchronicznego przepływu zadań/statusu.
- **Ścieżka Plugin (ComfyUI)**, gdy potrzebujesz własnego grafu przepływu pracy
  albo dostawcy, który nie jest częścią wspólnej dołączonej funkcji muzycznej.

Jeśli debugujesz zachowanie specyficzne dla ComfyUI, zobacz
[ComfyUI](/pl/providers/comfy). Jeśli debugujesz wspólne zachowanie dostawców,
zacznij od [fal](/pl/providers/fal), [Google (Gemini)](/pl/providers/google),
[MiniMax](/pl/providers/minimax) lub [OpenRouter](/pl/providers/openrouter).

## Tryby możliwości dostawcy

Wspólny kontrakt generowania muzyki obsługuje jawne deklaracje trybów:

- `generate` do generowania wyłącznie na podstawie promptu.
- `edit`, gdy żądanie zawiera jeden lub więcej obrazów referencyjnych.

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
`supportsFormat`, **nie** wystarczają do deklarowania obsługi edycji. Dostawcy
powinni jawnie deklarować `generate` i `edit`, aby testy live, testy kontraktu
i współdzielone narzędzie `music_generate` mogły deterministycznie weryfikować
obsługę trybów.

## Testy live

Opcjonalne pokrycie live dla wspólnych wbudowanych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper repozytorium:

```bash
pnpm test:live:media music
```

Ten plik live domyślnie używa już eksportowanych zmiennych środowiskowych
dostawców przed zapisanymi profilami uwierzytelniania i uruchamia pokrycie
zarówno `generate`, jak i zadeklarowanego `edit`, gdy dostawca włącza tryb
edycji. Obecne pokrycie:

- `google`: `generate` oraz `edit`
- `fal`: tylko `generate`
- `minimax`: tylko `generate`
- `openrouter`: `generate` oraz `edit`
- `comfy`: osobne pokrycie live Comfy, nie wspólny przegląd dostawców

Opcjonalne pokrycie live dla wbudowanej ścieżki muzycznej ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Plik live Comfy obejmuje także przepływy pracy obrazów i wideo comfy, gdy te
sekcje są skonfigurowane.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) — śledzenie zadań dla odłączonych uruchomień `music_generate`
- [ComfyUI](/pl/providers/comfy)
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — konfiguracja `musicGenerationModel`
- [Google (Gemini)](/pl/providers/google)
- [MiniMax](/pl/providers/minimax)
- [Modele](/pl/concepts/models) — konfiguracja modeli i przełączanie awaryjne
- [Przegląd narzędzi](/pl/tools)
