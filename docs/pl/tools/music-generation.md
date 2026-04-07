---
read_when:
    - Generujesz muzykę lub audio przez agenta
    - Konfigurujesz dostawców i modele generowania muzyki
    - Chcesz zrozumieć parametry narzędzia music_generate
summary: Generuj muzykę za pomocą współdzielonych dostawców, w tym pluginów opartych na workflow
title: Generowanie muzyki
x-i18n:
    generated_at: "2026-04-07T09:51:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce8da8dfc188efe8593ca5cbec0927dd1d18d2861a1a828df89c8541ccf1cb25
    source_path: tools/music-generation.md
    workflow: 15
---

# Generowanie muzyki

Narzędzie `music_generate` pozwala agentowi tworzyć muzykę lub audio przez
współdzieloną możliwość generowania muzyki z użyciem skonfigurowanych dostawców, takich jak Google,
MiniMax i skonfigurowane przez workflow ComfyUI.

Dla sesji agentów opartych na współdzielonych dostawcach OpenClaw uruchamia generowanie muzyki jako
zadanie w tle, śledzi je w rejestrze zadań, a następnie ponownie wybudza agenta, gdy
utwór jest gotowy, aby agent mógł opublikować gotowe audio z powrotem w
oryginalnym kanale.

<Note>
Wbudowane współdzielone narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca generowania muzyki. Jeśli nie widzisz `music_generate` w narzędziach swojego agenta, skonfiguruj `agents.defaults.musicGenerationModel` lub ustaw klucz API dostawcy.
</Note>

## Szybki start

### Generowanie oparte na współdzielonym dostawcy

1. Ustaw klucz API dla co najmniej jednego dostawcy, na przykład `GEMINI_API_KEY` lub
   `MINIMAX_API_KEY`.
2. Opcjonalnie ustaw preferowany model:

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

3. Poproś agenta: _„Wygeneruj energiczny synthpopowy utwór o nocnej jeździe
   przez neonowe miasto.”_

Agent automatycznie wywoła `music_generate`. Nie trzeba dodawać narzędzia do allowlisty.

W bezpośrednich kontekstach synchronicznych bez uruchomienia agenta opartego na sesji wbudowane
narzędzie nadal przełącza się na generowanie inline i zwraca końcową ścieżkę do mediów w
wyniku narzędzia.

Przykładowe prompty:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Generowanie Comfy sterowane workflow

Bundlowany plugin `comfy` podłącza się do współdzielonego narzędzia `music_generate` przez
rejestr dostawców generowania muzyki.

1. Skonfiguruj `models.providers.comfy.music` z workflow JSON oraz
   węzłami promptu/wyjścia.
2. Jeśli używasz Comfy Cloud, ustaw `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY`.
3. Poproś agenta o muzykę lub wywołaj narzędzie bezpośrednio.

Przykład:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Obsługa współdzielonych bundlowanych dostawców

| Dostawca | Model domyślny         | Wejścia referencyjne | Obsługiwane ustawienia                                   | Klucz API                               |
| -------- | ---------------------- | -------------------- | -------------------------------------------------------- | --------------------------------------- |
| ComfyUI  | `workflow`             | Do 1 obrazu          | Muzyka lub audio zdefiniowane przez workflow             | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Do 10 obrazów        | `lyrics`, `instrumental`, `format`                       | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.5+`           | Brak                 | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                    |

### Zadeklarowana macierz możliwości

To jest jawny kontrakt trybów używany przez `music_generate`, testy kontraktowe
i współdzielony live sweep.

| Dostawca | `generate` | `edit` | Limit edycji | Współdzielone ścieżki live                                                 |
| -------- | ---------- | ------ | ------------ | -------------------------------------------------------------------------- |
| ComfyUI  | Tak        | Tak    | 1 obraz      | Nie wchodzi w skład współdzielonego sweep; objęte przez `extensions/comfy/comfy.live.test.ts` |
| Google   | Tak        | Tak    | 10 obrazów   | `generate`, `edit`                                                         |
| MiniMax  | Tak        | Nie    | Brak         | `generate`                                                                 |

Użyj `action: "list"`, aby sprawdzić dostępnych współdzielonych dostawców i modele w
runtime:

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

## Parametry wbudowanego narzędzia

| Parametr          | Typ      | Opis                                                                                          |
| ----------------- | -------- | --------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt do generowania muzyki (wymagany dla `action: "generate"`)                              |
| `action`          | string   | `"generate"` (domyślnie), `"status"` dla bieżącego zadania sesji lub `"list"` do sprawdzenia dostawców |
| `model`           | string   | Nadpisanie `provider/model`, np. `google/lyria-3-pro-preview` lub `comfy/workflow`           |
| `lyrics`          | string   | Opcjonalny tekst piosenki, gdy dostawca obsługuje jawne wejście tekstu piosenki              |
| `instrumental`    | boolean  | Żądanie wyjścia instrumentalnego, gdy dostawca to obsługuje                                  |
| `image`           | string   | Ścieżka lub URL pojedynczego obrazu referencyjnego                                            |
| `images`          | string[] | Wiele obrazów referencyjnych (do 10)                                                          |
| `durationSeconds` | number   | Docelowy czas trwania w sekundach, gdy dostawca obsługuje wskazówki dotyczące długości       |
| `format`          | string   | Wskazówka formatu wyjściowego (`mp3` lub `wav`), gdy dostawca to obsługuje                   |
| `filename`        | string   | Wskazówka nazwy pliku                                                                          |

Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw nadal waliduje twarde limity,
takie jak liczba wejść, przed wysłaniem. Gdy dostawca obsługuje długość, ale
używa krótszego maksimum niż żądana wartość, OpenClaw automatycznie ogranicza ją
do najbliższej obsługiwanej długości. Naprawdę nieobsługiwane opcjonalne wskazówki są ignorowane
z ostrzeżeniem, gdy wybrany dostawca lub model nie może ich uwzględnić.

Wyniki narzędzia raportują zastosowane ustawienia. Gdy OpenClaw ogranicza długość podczas fallbacku dostawcy, zwrócone `durationSeconds` odzwierciedla przesłaną wartość, a `details.normalization.durationSeconds` pokazuje mapowanie wartości żądanej na zastosowaną.

## Zachowanie asynchroniczne dla ścieżki opartej na współdzielonym dostawcy

- Uruchomienia agentów oparte na sesji: `music_generate` tworzy zadanie w tle, natychmiast zwraca odpowiedź o rozpoczęciu/zadaniu, a gotowy utwór publikuje później w kolejnej wiadomości agenta.
- Zapobieganie duplikatom: dopóki zadanie w tle ma stan `queued` lub `running`, późniejsze wywołania `music_generate` w tej samej sesji zwracają stan zadania zamiast rozpoczynać nowe generowanie.
- Sprawdzanie statusu: użyj `action: "status"`, aby sprawdzić aktywne zadanie muzyczne oparte na sesji bez rozpoczynania nowego.
- Śledzenie zadań: użyj `openclaw tasks list` lub `openclaw tasks show <taskId>`, aby sprawdzić stan `queued`, `running` i końcowy status generowania.
- Wybudzenie po zakończeniu: OpenClaw wstrzykuje wewnętrzne zdarzenie zakończenia z powrotem do tej samej sesji, aby model mógł sam napisać widoczną dla użytkownika wiadomość uzupełniającą.
- Wskazówka dla promptu: późniejsze tury użytkownika/ręczne w tej samej sesji dostają małą wskazówkę runtime, gdy zadanie muzyczne jest już w toku, aby model nie wywoływał ślepo `music_generate` ponownie.
- Fallback bez sesji: bezpośrednie/lokalne konteksty bez rzeczywistej sesji agenta nadal działają inline i zwracają końcowy wynik audio w tej samej turze.

### Cykl życia zadania

Każde żądanie `music_generate` przechodzi przez cztery stany:

1. **queued** -- zadanie utworzone, oczekuje na przyjęcie przez dostawcę.
2. **running** -- dostawca przetwarza zadanie (zwykle od 30 sekund do 3 minut, zależnie od dostawcy i długości).
3. **succeeded** -- utwór gotowy; agent budzi się i publikuje go w rozmowie.
4. **failed** -- błąd dostawcy lub timeout; agent budzi się ze szczegółami błędu.

Sprawdź status z CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Zapobieganie duplikatom: jeśli zadanie muzyczne ma już stan `queued` lub `running` dla bieżącej sesji, `music_generate` zwraca stan istniejącego zadania zamiast rozpoczynać nowe. Użyj `action: "status"`, aby sprawdzić to jawnie bez wywoływania nowego generowania.

## Konfiguracja

### Wybór modelu

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Kolejność wyboru dostawców

Podczas generowania muzyki OpenClaw próbuje dostawców w tej kolejności:

1. parametr `model` z wywołania narzędzia, jeśli agent go określi
2. `musicGenerationModel.primary` z konfiguracji
3. `musicGenerationModel.fallbacks` w podanej kolejności
4. automatyczne wykrywanie przy użyciu tylko domyślnych dostawców opartych na auth:
   - najpierw bieżący domyślny dostawca
   - potem pozostali zarejestrowani dostawcy generowania muzyki w kolejności identyfikatorów dostawców

Jeśli dostawca zawiedzie, automatycznie próbowany jest kolejny kandydat. Jeśli zawiodą wszyscy,
błąd zawiera szczegóły każdej próby.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, jeśli chcesz,
aby generowanie muzyki używało tylko jawnych wpisów `model`, `primary` i `fallbacks`.

## Uwagi dotyczące dostawców

- Google używa wsadowego generowania Lyria 3. Bieżący bundlowany przepływ obsługuje
  prompt, opcjonalny tekst piosenki i opcjonalne obrazy referencyjne.
- MiniMax używa wsadowego endpointu `music_generation`. Bieżący bundlowany przepływ
  obsługuje prompt, opcjonalny tekst piosenki, tryb instrumentalny, sterowanie długością i
  wyjście mp3.
- Obsługa ComfyUI jest sterowana przez workflow i zależy od skonfigurowanego grafu oraz
  mapowania węzłów dla pól promptu/wyjścia.

## Tryby możliwości dostawców

Współdzielony kontrakt generowania muzyki obsługuje teraz jawne deklaracje trybów:

- `generate` dla generowania wyłącznie z promptu
- `edit`, gdy żądanie zawiera jeden lub więcej obrazów referencyjnych

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
`supportsFormat`, nie wystarczają do reklamowania obsługi edycji. Dostawcy powinni
jawnie deklarować `generate` i `edit`, aby testy live, testy kontraktowe i
współdzielone narzędzie `music_generate` mogły deterministycznie walidować obsługę trybów.

## Wybór właściwej ścieżki

- Użyj ścieżki opartej na współdzielonym dostawcy, jeśli chcesz mieć wybór modelu, failover dostawców i wbudowany asynchroniczny przepływ zadanie/status.
- Użyj ścieżki pluginu, takiej jak ComfyUI, jeśli potrzebujesz niestandardowego grafu workflow albo dostawcy, który nie jest częścią współdzielonej bundlowanej możliwości generowania muzyki.
- Jeśli debugujesz zachowanie specyficzne dla ComfyUI, zobacz [ComfyUI](/pl/providers/comfy). Jeśli debugujesz zachowanie współdzielonego dostawcy, zacznij od [Google (Gemini)](/pl/providers/google) lub [MiniMax](/pl/providers/minimax).

## Testy live

Testy live opt-in dla współdzielonych bundlowanych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo wrapper:

```bash
pnpm test:live:media music
```

Ten plik live ładuje brakujące zmienne env dostawców z `~/.profile`, domyślnie preferuje
klucze API live/env przed zapisanymi profilami auth i uruchamia pokrycie zarówno
`generate`, jak i zadeklarowanego `edit`, gdy dostawca włącza tryb edycji.

Obecnie oznacza to:

- `google`: `generate` oraz `edit`
- `minimax`: tylko `generate`
- `comfy`: osobne testy live Comfy, bez współdzielonego sweep dostawców

Testy live opt-in dla bundlowanej ścieżki muzycznej ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Plik live Comfy obejmuje także workflow obrazów i wideo Comfy, gdy te
sekcje są skonfigurowane.

## Powiązane

- [Background Tasks](/pl/automation/tasks) - śledzenie zadań dla odłączonych uruchomień `music_generate`
- [Configuration Reference](/pl/gateway/configuration-reference#agent-defaults) - konfiguracja `musicGenerationModel`
- [ComfyUI](/pl/providers/comfy)
- [Google (Gemini)](/pl/providers/google)
- [MiniMax](/pl/providers/minimax)
- [Models](/pl/concepts/models) - konfiguracja modeli i failover
- [Tools Overview](/pl/tools)
