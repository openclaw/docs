---
read_when:
    - Generowanie muzyki lub dźwięku za pomocą agenta
    - Konfigurowanie dostawców i modeli generowania muzyki
    - Opis parametrów narzędzia music_generate
sidebarTitle: Music generation
summary: Generowanie muzyki za pomocą music_generate w przepływach pracy ComfyUI, fal, Google Lyria, MiniMax i OpenRouter
title: Generowanie muzyki
x-i18n:
    generated_at: "2026-07-12T15:43:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

Narzędzie `music_generate` tworzy muzykę lub dźwięk za pośrednictwem współdzielonej
funkcji generowania muzyki, obsługiwanej przez ComfyUI, fal, Google, MiniMax i
OpenRouter.

<Note>
`music_generate` pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden
dostawca generowania muzyki: jawna konfiguracja
`agents.defaults.musicGenerationModel` lub dostawca ze skonfigurowanym
uwierzytelnianiem (na przykład z ustawionym kluczem API).
</Note>

W przypadku uruchomień agenta opartych na sesji `music_generate` rozpoczyna
zadanie w tle, śledzi postęp w rejestrze zadań, a następnie wybudza agenta, gdy
utwór jest gotowy, aby mógł powiadomić użytkownika i dołączyć gotowy plik
dźwiękowy. Agent kończący zadanie przestrzega kontraktu widocznej odpowiedzi
sesji: automatycznej odpowiedzi końcowej, jeśli jest skonfigurowana, albo
`message(action="send")`, gdy sesja wymaga narzędzia do wysyłania wiadomości.
Jeśli sesja inicjatora jest nieaktywna lub jej wybudzenie się nie powiedzie,
a wygenerowanego dźwięku nadal brakuje w odpowiedzi, OpenClaw wysyła
idempotentną bezpośrednią wiadomość awaryjną zawierającą wyłącznie brakujący
dźwięk.

## Szybki start

<Tabs>
  <Tab title="Współdzielony, obsługiwany przez dostawcę">
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
        _„Wygeneruj energiczny utwór synthpop o nocnej przejażdżce przez
        neonowe miasto.”_

        Agent automatycznie wywoła `music_generate`. Nie trzeba dodawać
        narzędzia do listy dozwolonych.
      </Step>
    </Steps>

    Bez uruchomienia agenta opartego na sesji (w kontekstach
    bezpośrednich/lokalnych) narzędzie działa synchronicznie i zwraca ścieżkę
    do gotowego pliku multimedialnego w tym samym wyniku narzędzia.

  </Tab>
  <Tab title="Przepływ pracy ComfyUI">
    <Steps>
      <Step title="Skonfiguruj przepływ pracy">
        Skonfiguruj `plugins.entries.comfy.config.music`, podając plik JSON
        przepływu pracy oraz węzły monitu i wyjścia.
      </Step>
      <Step title="Uwierzytelnianie w chmurze (opcjonalnie)">
        W przypadku Comfy Cloud ustaw `COMFY_API_KEY` lub
        `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Wywołaj narzędzie">
        ```text
        /tool music_generate prompt="Ciepła ambientowa pętla syntezatorowa z delikatną fakturą taśmy"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Przykładowe monity:

```text
Wygeneruj filmowy utwór fortepianowy z delikatnymi smyczkami i bez wokalu.
```

```text
Wygeneruj energiczną pętlę chiptune o wystrzeleniu rakiety o wschodzie słońca.
```

Użyj `action: "list"`, aby sprawdzić dostępnych dostawców i modele, oraz
`action: "status"`, aby sprawdzić aktywne zadanie muzyczne oparte na sesji:

```text
/tool music_generate action=list
/tool music_generate action=status
```

Przykład generowania bezpośredniego:

```text
/tool music_generate prompt="Marzycielski lo-fi hip-hop z fakturą winylu i łagodnym deszczem" instrumental=true
```

## Obsługiwani dostawcy

| Dostawca   | Model domyślny               | Dane referencyjne | Obsługiwane parametry sterujące                        | Uwierzytelnianie                        |
| ---------- | ---------------------------- | ----------------- | ------------------------------------------------------ | --------------------------------------- |
| ComfyUI    | `workflow`                   | Do 1 obrazu       | Muzyka lub dźwięk zdefiniowane przez przepływ pracy    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY`  |
| fal        | `fal-ai/minimax-music/v2.6`  | Brak              | `lyrics`, `instrumental`, `durationSeconds`, `format`  | `FAL_KEY` lub `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | Do 10 obrazów     | `lyrics`, `instrumental`, `format`                     | `GEMINI_API_KEY`, `GOOGLE_API_KEY`      |
| MiniMax    | `music-2.6`                  | Brak              | `lyrics`, `instrumental`, `format` (tylko mp3)         | `MINIMAX_API_KEY` lub OAuth MiniMax     |
| OpenRouter | `google/lyria-3-pro-preview` | Do 1 obrazu       | `lyrics`, `instrumental`, `durationSeconds`, `format`  | `OPENROUTER_API_KEY`                    |

MiniMax rejestruje dwa identyfikatory dostawcy współdzielące te same modele:
`minimax` dla uwierzytelniania kluczem API oraz `minimax-portal` dla OAuth.
Odwołania do modeli odpowiadają ścieżce uwierzytelniania
(`minimax/music-2.6` w porównaniu z `minimax-portal/music-2.6`); zobacz
[MiniMax](/pl/providers/minimax#music-generation).

Oprócz domyślnego modelu opartego na MiniMax fal udostępnia także
`fal-ai/ace-step/prompt-to-audio` (wav, bez tekstu utworu i bez przełącznika
trybu instrumentalnego) oraz `fal-ai/stable-audio-25/text-to-audio` (wav,
tylko monit). Domyślny model Google `lyria-3-clip-preview` generuje wyłącznie
mp3; `lyria-3-pro-preview` obsługuje również wav. MiniMax udostępnia także
`music-2.6-free`, `music-cover` i `music-cover-free`. OpenRouter udostępnia
również `google/lyria-3-clip-preview`.

### Macierz możliwości

Jawny kontrakt trybów używany przez `music_generate`, testy kontraktowe i
współdzielony przebieg testów na żywo:

| Dostawca   | `generate` | `edit` | Limit edycji | Współdzielone ścieżki testów na żywo                                      |
| ---------- | :--------: | :----: | ------------ | -------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 obraz      | Poza współdzielonym przebiegiem; objęty `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Brak         | `generate`                                                                 |
| Google     |     ✓      |   ✓    | 10 obrazów   | `generate`, `edit`                                                         |
| MiniMax    |     ✓      |   —    | Brak         | `generate`                                                                 |
| OpenRouter |     ✓      |   ✓    | 1 obraz      | `generate`, `edit`                                                         |

## Parametry narzędzia

<ParamField path="prompt" type="string" required>
  Monit generowania muzyki. Wymagany dla `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` zwraca bieżące zadanie sesji; `"list"` wyświetla dostawców.
</ParamField>
<ParamField path="model" type="string">
  Nadpisanie dostawcy/modelu (np. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Opcjonalny tekst utworu, gdy dostawca obsługuje jawne przekazywanie tekstu.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Żądanie wyjścia wyłącznie instrumentalnego, gdy dostawca je obsługuje.
</ParamField>
<ParamField path="image" type="string">
  Ścieżka lub adres URL pojedynczego obrazu referencyjnego.
</ParamField>
<ParamField path="images" type="string[]">
  Wiele obrazów referencyjnych (do 10 u obsługujących je dostawców).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Docelowy czas trwania w sekundach, gdy dostawca obsługuje wskazówki
  dotyczące czasu trwania.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Wskazówka dotycząca formatu wyjściowego, gdy dostawca go obsługuje.
</ParamField>
<ParamField path="filename" type="string">Wskazówka dotycząca nazwy pliku wyjściowego.</ParamField>

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw nadal sprawdza
nieprzekraczalne limity, takie jak liczba danych wejściowych, przed wysłaniem
żądania. Gdy dostawca obsługuje czas trwania, ale ma krótszy maksymalny czas
niż żądana wartość, OpenClaw ogranicza ją do najbliższego obsługiwanego czasu.
Opcjonalne wskazówki, które rzeczywiście nie są obsługiwane, są ignorowane
z ostrzeżeniem, gdy wybrany dostawca lub model nie może ich uwzględnić.
Wyniki narzędzia zawierają zastosowane ustawienia; `details.normalization`
rejestruje każde odwzorowanie wartości żądanej na zastosowaną.
</Note>

Limity czasu żądań do dostawcy są wyłącznie konfiguracją operatora. OpenClaw
używa `agents.defaults.musicGenerationModel.timeoutMs`, gdy ta wartość jest
skonfigurowana, podnosi wartości poniżej 120000ms do 120000ms, a w pozostałych
przypadkach domyślnie ustawia limit żądań do dostawcy na 300000ms.

## Działanie asynchroniczne

Generowanie muzyki oparte na sesji działa jako zadanie w tle:

- **Zadanie w tle:** `music_generate` tworzy zadanie w tle, natychmiast zwraca
  odpowiedź o rozpoczęciu wraz z informacjami o zadaniu, a później publikuje
  gotowy utwór w kolejnej wiadomości agenta.
- **Zapobieganie duplikatom:** gdy zadanie ma stan `queued` lub `running`,
  kolejne wywołania `music_generate` w tej samej sesji zwracają stan zadania
  zamiast rozpoczynać następne generowanie. Użyj `action: "status"`, aby
  sprawdzić go jawnie. Niedawno ukończone pasujące żądanie jest również
  deduplikowane przez 2 minuty.
- **Sprawdzanie stanu:** `openclaw tasks list` lub
  `openclaw tasks show <taskId>` pozwala sprawdzić stan oczekujący, aktywny
  i końcowy.
- **Wybudzenie po zakończeniu:** OpenClaw wprowadza wewnętrzne zdarzenie
  zakończenia z powrotem do tej samej sesji, aby model mógł samodzielnie
  napisać dalszą odpowiedź przeznaczoną dla użytkownika.
- **Wskazówka w monicie:** kolejne tury użytkownika lub ręczne w tej samej
  sesji otrzymują krótką wskazówkę środowiska wykonawczego, gdy zadanie
  muzyczne jest już w toku, dzięki czemu model nie wywołuje ponownie
  `music_generate` bez sprawdzenia.
- **Tryb awaryjny bez sesji:** konteksty bezpośrednie/lokalne bez rzeczywistej
  sesji agenta działają synchronicznie i zwracają końcowy wynik dźwiękowy
  w tej samej turze.

### Cykl życia zadania

Zadanie muzyczne udostępnia te same stany co ogólny rejestr zadań (pełny
automat stanów, w tym `timed_out`, `cancelled` i `lost`, opisano w sekcji
[Zadania w tle](/pl/automation/tasks#task-lifecycle)). Większość zadań
muzycznych przechodzi przez następujące stany:

| Stan        | Znaczenie                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------- |
| `queued`    | Zadanie utworzono i oczekuje ono na przyjęcie przez dostawcę.                                      |
| `running`   | Dostawca przetwarza zadanie (zwykle od 30 sekund do 3 minut, zależnie od dostawcy i czasu trwania). |
| `succeeded` | Utwór jest gotowy; agent zostaje wybudzony i publikuje go w rozmowie.                              |
| `failed`    | Błąd dostawcy lub przekroczenie limitu czasu; agent zostaje wybudzony ze szczegółami błędu.         |

Sprawdź stan z poziomu CLI:

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

OpenClaw próbuje dostawców w następującej kolejności:

1. Parametr `model` z wywołania narzędzia (jeśli agent go określi).
2. `musicGenerationModel.primary` z konfiguracji.
3. Wpisy `musicGenerationModel.fallbacks` w podanej kolejności.
4. Automatyczne wykrywanie wyłącznie na podstawie domyślnych dostawców
   z uwierzytelnianiem:
   - najpierw bieżący domyślny dostawca modelu tekstowego, jeśli oferuje
     również generowanie muzyki;
   - pozostali zarejestrowani dostawcy generowania muzyki, alfabetycznie
     według identyfikatora dostawcy.

Jeśli dostawca zawiedzie, automatycznie podejmowana jest próba użycia
następnego kandydata. Jeśli wszystkie próby się nie powiodą, błąd zawiera
szczegóły każdej z nich.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, aby
używać wyłącznie jawnych wpisów `model`, `primary` i `fallbacks`.

## Uwagi dotyczące dostawców

<AccordionGroup>
  <Accordion title="ComfyUI">
    Sterowany przepływem pracy i zależny od skonfigurowanego grafu oraz mapowania węzłów
    dla pól polecenia i danych wyjściowych. Dołączony plugin `comfy` integruje się ze
    współdzielonym narzędziem `music_generate` za pośrednictwem rejestru dostawców
    generowania muzyki.
  </Accordion>
  <Accordion title="fal">
    Używa punktów końcowych modeli fal za pośrednictwem współdzielonej ścieżki uwierzytelniania dostawcy. Dołączony
    dostawca domyślnie używa `fal-ai/minimax-music/v2.6`, a także udostępnia
    `fal-ai/ace-step/prompt-to-audio` oraz
    `fal-ai/stable-audio-25/text-to-audio` na potrzeby żądań generowania dźwięku z polecenia.
    Tekst utworu i tryb instrumentalny są dostępne wyłącznie dla modelu MiniMax; pozostałe dwa
    modele obsługują tylko polecenia.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Używa wsadowego generowania Lyria 3. Obecnie dołączony przepływ obsługuje
    polecenie, opcjonalny tekst utworu oraz opcjonalne obrazy referencyjne. Domyślny
    model `lyria-3-clip-preview` generuje wyłącznie pliki mp3; model
    `lyria-3-pro-preview` obsługuje również format wav.
  </Accordion>
  <Accordion title="MiniMax">
    Używa wsadowego punktu końcowego `music_generation`. Obsługuje polecenie, opcjonalny
    tekst utworu, tryb instrumentalny i dane wyjściowe mp3 przy użyciu uwierzytelniania kluczem API
    `minimax` albo OAuth `minimax-portal`. Udostępnia również modele `music-2.6-free`,
    `music-cover` i `music-cover-free`.
  </Accordion>
  <Accordion title="OpenRouter">
    Używa danych wyjściowych audio uzupełnień czatu OpenRouter z włączonym strumieniowaniem. Dołączony
    dostawca domyślnie używa `google/lyria-3-pro-preview`, a także udostępnia
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Wybór właściwej ścieżki

- **Współdzielona ścieżka oparta na dostawcy**, gdy potrzebujesz wyboru modelu, przełączania
  awaryjnego między dostawcami i wbudowanego asynchronicznego przepływu zadań i statusów.
- **Ścieżka pluginu (ComfyUI)**, gdy potrzebujesz niestandardowego grafu przepływu pracy lub
  dostawcy, który nie jest częścią współdzielonej, dołączonej funkcji muzycznej.

Jeśli debugujesz zachowanie specyficzne dla ComfyUI, zobacz
[ComfyUI](/pl/providers/comfy). Jeśli debugujesz zachowanie współdzielonego dostawcy,
zacznij od [fal](/pl/providers/fal), [Google (Gemini)](/pl/providers/google),
[MiniMax](/pl/providers/minimax) lub [OpenRouter](/pl/providers/openrouter).

## Tryby możliwości dostawcy

Współdzielony kontrakt generowania muzyki obsługuje jawne deklaracje trybów:

- `generate` do generowania wyłącznie na podstawie polecenia.
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
`supportsFormat`, **nie** wystarczają do zadeklarowania obsługi edycji. Dostawcy
powinni jawnie deklarować `generate` i `edit`, aby testy na żywo, testy
kontraktowe oraz współdzielone narzędzie `music_generate` mogły deterministycznie
weryfikować obsługę trybów.

## Testy na żywo

Opcjonalne testy na żywo współdzielonych, dołączonych dostawców (fal, Google, MiniMax,
OpenRouter):

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Równoważne repozytoryjne polecenie opakowujące, które uruchamia ten sam plik testowy:

```bash
pnpm test:live:media:music
```

Ten plik testów na żywo domyślnie używa już wyeksportowanych zmiennych środowiskowych dostawcy
przed zapisanymi profilami uwierzytelniania i uruchamia testy zarówno dla `generate`, jak i
zadeklarowanego `edit`, gdy dostawca włącza tryb edycji. Obecny zakres:

- `google`: `generate` oraz `edit`
- `fal`: tylko `generate`
- `minimax`: tylko `generate`
- `openrouter`: `generate` oraz `edit`
- `comfy`: oddzielne testy Comfy na żywo, poza współdzielonym zestawem testów dostawców

Opcjonalne testy na żywo dołączonej ścieżki muzycznej ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Plik testów Comfy na żywo obejmuje również przepływy pracy obrazów i filmów Comfy, gdy odpowiednie
sekcje są skonfigurowane.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) — śledzenie zadań dla odłączonych uruchomień `music_generate`
- [ComfyUI](/pl/providers/comfy)
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — konfiguracja `musicGenerationModel`
- [Google (Gemini)](/pl/providers/google)
- [MiniMax](/pl/providers/minimax)
- [Modele](/pl/concepts/models) — konfiguracja modeli i przełączanie awaryjne
- [Przegląd narzędzi](/pl/tools)
