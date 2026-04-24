---
read_when:
    - Generowanie muzyki lub dźwięku przez agenta
    - Konfigurowanie dostawców i modeli generowania muzyki
    - Zrozumienie parametrów narzędzia `music_generate`
summary: Generowanie muzyki za pomocą współdzielonych dostawców, w tym Pluginów opartych na przepływach pracy
title: Generowanie muzyki
x-i18n:
    generated_at: "2026-04-24T09:37:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5fe640c6b83f6f2cf5ad8e57294da147f241706c30eee0d0eb6f7d82cbbe0d3
    source_path: tools/music-generation.md
    workflow: 15
---

Narzędzie `music_generate` pozwala agentowi tworzyć muzykę lub dźwięk przez
współdzieloną możliwość generowania muzyki z użyciem skonfigurowanych dostawców, takich jak Google,
MiniMax i skonfigurowane przepływami pracy ComfyUI.

W przypadku sesji agentów opartych na współdzielonych dostawcach OpenClaw uruchamia generowanie muzyki jako
zadanie w tle, śledzi je w rejestrze zadań, a następnie ponownie wybudza agenta, gdy utwór jest gotowy, aby agent mógł opublikować gotowy dźwięk z powrotem w
oryginalnym kanale.

<Note>
Wbudowane współdzielone narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca generowania muzyki. Jeśli nie widzisz `music_generate` w narzędziach swojego agenta, skonfiguruj `agents.defaults.musicGenerationModel` albo ustaw klucz API dostawcy.
</Note>

## Szybki start

### Generowanie oparte na współdzielonych dostawcach

1. Ustaw klucz API dla co najmniej jednego dostawcy, na przykład `GEMINI_API_KEY` albo
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

3. Poproś agenta: _„Wygeneruj energetyczny utwór synthpop o nocnej jeździe
   przez neonowe miasto.”_

Agent automatycznie wywoła `music_generate`. Nie jest potrzebna allowlista narzędzi.

W bezpośrednich synchronicznych kontekstach bez uruchomienia agenta opartego na sesji wbudowane
narzędzie nadal awaryjnie przechodzi do generowania inline i zwraca końcową ścieżkę do pliku multimedialnego w
wyniku narzędzia.

Przykładowe prompty:

```text
Wygeneruj filmowy utwór fortepianowy z delikatnymi smyczkami i bez wokalu.
```

```text
Wygeneruj energiczną pętlę chiptune o starcie rakiety o wschodzie słońca.
```

### Generowanie Comfy sterowane przepływem pracy

Dołączony Plugin `comfy` podłącza się do współdzielonego narzędzia `music_generate` przez
rejestr dostawców generowania muzyki.

1. Skonfiguruj `models.providers.comfy.music` z JSON-em przepływu pracy oraz
   węzłami promptu/wyjścia.
2. Jeśli używasz Comfy Cloud, ustaw `COMFY_API_KEY` albo `COMFY_CLOUD_API_KEY`.
3. Poproś agenta o muzykę albo wywołaj narzędzie bezpośrednio.

Przykład:

```text
/tool music_generate prompt="Ciepła ambientowa pętla syntezatorowa z miękką teksturą taśmy"
```

## Obsługa współdzielonych dołączonych dostawców

| Dostawca | Model domyślny | Wejścia referencyjne | Obsługiwane kontrolki | Klucz API |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Maksymalnie 1 obraz | Muzyka lub dźwięk zdefiniowane przez workflow | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Maksymalnie 10 obrazów | `lyrics`, `instrumental`, `format` | `GEMINI_API_KEY`, `GOOGLE_API_KEY` |
| MiniMax  | `music-2.5+`           | Brak | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` |

### Zadeklarowana macierz możliwości

To jawny kontrakt trybów używany przez `music_generate`, testy kontraktowe
i współdzielony live sweep.

| Dostawca | `generate` | `edit` | Limit edycji | Współdzielone lane’y live |
| -------- | ---------- | ------ | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  | Tak        | Tak    | 1 obraz    | Nie wchodzi do współdzielonego sweepa; pokrywane przez `extensions/comfy/comfy.live.test.ts` |
| Google   | Tak        | Tak    | 10 obrazów  | `generate`, `edit` |
| MiniMax  | Tak        | Nie     | Brak       | `generate` |

Użyj `action: "list"`, aby sprawdzić dostępnych współdzielonych dostawców i modele
w czasie działania:

```text
/tool music_generate action=list
```

Użyj `action: "status"`, aby sprawdzić aktywne zadanie muzyczne bieżącej sesji opartej na sesji:

```text
/tool music_generate action=status
```

Przykład bezpośredniego generowania:

```text
/tool music_generate prompt="Marzycielski lo-fi hip hop z winylową teksturą i delikatnym deszczem" instrumental=true
```

## Parametry wbudowanego narzędzia

| Parametr | Typ | Opis |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `prompt` | string | Prompt generowania muzyki (wymagany dla `action: "generate"`) |
| `action` | string | `"generate"` (domyślnie), `"status"` dla bieżącego zadania sesji lub `"list"` do sprawdzania dostawców |
| `model` | string | Nadpisanie dostawcy/modelu, np. `google/lyria-3-pro-preview` albo `comfy/workflow` |
| `lyrics` | string | Opcjonalny tekst utworu, gdy dostawca obsługuje jawne wejście tekstu |
| `instrumental` | boolean | Żądanie wyjścia wyłącznie instrumentalnego, gdy dostawca to obsługuje |
| `image` | string | Ścieżka lub URL pojedynczego obrazu referencyjnego |
| `images` | string[] | Wiele obrazów referencyjnych (maksymalnie 10) |
| `durationSeconds` | number | Docelowy czas trwania w sekundach, gdy dostawca obsługuje wskazówki czasu trwania |
| `timeoutMs` | number | Opcjonalny limit czasu żądania do dostawcy w milisekundach |
| `format` | string | Wskazówka formatu wyjściowego (`mp3` lub `wav`), gdy dostawca to obsługuje |
| `filename` | string | Wskazówka nazwy pliku wyjściowego |

Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw nadal waliduje twarde limity,
takie jak liczba wejść, przed wysłaniem. Gdy dostawca obsługuje czas trwania, ale
używa krótszej wartości maksymalnej niż żądana, OpenClaw automatycznie ogranicza go
do najbliższego obsługiwanego czasu trwania. Rzeczywiście nieobsługiwane opcjonalne wskazówki są ignorowane
z ostrzeżeniem, gdy wybrany dostawca lub model nie może ich uwzględnić.

Wyniki narzędzia raportują zastosowane ustawienia. Gdy OpenClaw ogranicza czas trwania podczas awaryjnego przejścia między dostawcami, zwrócone `durationSeconds` odzwierciedla wysłaną wartość, a `details.normalization.durationSeconds` pokazuje mapowanie od żądanej do zastosowanej wartości.

## Zachowanie asynchroniczne dla ścieżki opartej na współdzielonych dostawcach

- Uruchomienia agentów oparte na sesji: `music_generate` tworzy zadanie w tle, natychmiast zwraca odpowiedź typu started/task i publikuje gotowy utwór później w kolejnej wiadomości agenta.
- Zapobieganie duplikatom: dopóki to zadanie w tle ma stan `queued` albo `running`, późniejsze wywołania `music_generate` w tej samej sesji zwracają stan zadania zamiast uruchamiać nowe generowanie.
- Sprawdzanie stanu: użyj `action: "status"`, aby sprawdzić aktywne zadanie muzyczne bieżącej sesji bez uruchamiania nowego.
- Śledzenie zadań: użyj `openclaw tasks list` albo `openclaw tasks show <taskId>`, aby sprawdzić stan `queued`, `running` i końcowy dla generowania.
- Wybudzenie po ukończeniu: OpenClaw wstrzykuje wewnętrzne zdarzenie ukończenia z powrotem do tej samej sesji, aby model mógł sam napisać wiadomość skierowaną do użytkownika.
- Wskazówka w promcie: późniejsze tury użytkownika/ręczne w tej samej sesji dostają małą wskazówkę środowiska uruchomieniowego, gdy zadanie muzyczne jest już w toku, aby model nie wywoływał ślepo `music_generate` ponownie.
- Awaryjne przejście bez sesji: bezpośrednie/lokalne konteksty bez rzeczywistej sesji agenta nadal działają inline i zwracają końcowy wynik audio w tej samej turze.

### Cykl życia zadania

Każde żądanie `music_generate` przechodzi przez cztery stany:

1. **queued** -- zadanie utworzone, oczekuje na zaakceptowanie przez dostawcę.
2. **running** -- dostawca przetwarza (zwykle od 30 sekund do 3 minut zależnie od dostawcy i czasu trwania).
3. **succeeded** -- utwór gotowy; agent budzi się i publikuje go w rozmowie.
4. **failed** -- błąd dostawcy albo timeout; agent budzi się ze szczegółami błędu.

Sprawdzanie stanu z CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Zapobieganie duplikatom: jeśli zadanie muzyczne dla bieżącej sesji ma już stan `queued` albo `running`, `music_generate` zwraca stan istniejącego zadania zamiast uruchamiać nowe. Użyj `action: "status"`, aby sprawdzić to jawnie bez wyzwalania nowego generowania.

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

1. parametr `model` z wywołania narzędzia, jeśli agent go poda
2. `musicGenerationModel.primary` z konfiguracji
3. `musicGenerationModel.fallbacks` po kolei
4. Automatyczne wykrywanie z użyciem tylko domyślnych ustawień dostawców opartych na uwierzytelnianiu:
   - najpierw bieżący domyślny dostawca
   - potem pozostali zarejestrowani dostawcy generowania muzyki w kolejności identyfikatorów dostawców

Jeśli dostawca zawiedzie, automatycznie próbowany jest następny kandydat. Jeśli wszystkie zawiodą,
błąd zawiera szczegóły każdej próby.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, jeśli chcesz,
aby generowanie muzyki używało tylko jawnych wpisów `model`, `primary` i `fallbacks`.

## Uwagi o dostawcach

- Google używa wsadowego generowania Lyria 3. Obecny dołączony przepływ obsługuje
  prompt, opcjonalny tekst `lyrics` i opcjonalne obrazy referencyjne.
- MiniMax używa wsadowego endpointu `music_generation`. Obecny dołączony przepływ
  obsługuje prompt, opcjonalne `lyrics`, tryb instrumentalny, sterowanie czasem trwania oraz
  wyjście mp3.
- Obsługa ComfyUI jest sterowana workflow i zależy od skonfigurowanego grafu oraz
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
`supportsFormat`, nie wystarczają do ogłoszenia obsługi edycji. Dostawcy powinni
jawnie deklarować `generate` i `edit`, aby testy live, testy kontraktowe i
współdzielone narzędzie `music_generate` mogły deterministycznie walidować obsługę trybów.

## Wybór właściwej ścieżki

- Użyj ścieżki opartej na współdzielonych dostawcach, gdy chcesz wyboru modelu, failoveru dostawców i wbudowanego asynchronicznego przepływu zadań/statusu.
- Użyj ścieżki Pluginu, takiej jak ComfyUI, gdy potrzebujesz niestandardowego grafu przepływu pracy lub dostawcy, który nie jest częścią współdzielonej dołączonej możliwości generowania muzyki.
- Jeśli debugujesz zachowanie specyficzne dla ComfyUI, zobacz [ComfyUI](/pl/providers/comfy). Jeśli debugujesz zachowanie współdzielonych dostawców, zacznij od [Google (Gemini)](/pl/providers/google) albo [MiniMax](/pl/providers/minimax).

## Testy live

Pokrycie live typu opt-in dla współdzielonych dołączonych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper repozytorium:

```bash
pnpm test:live:media music
```

Ten plik live ładuje brakujące zmienne środowiskowe dostawców z `~/.profile`, domyślnie preferuje
klucze API live/env przed zapisanymi profilami uwierzytelniania i uruchamia zarówno
pokrycie `generate`, jak i zadeklarowane `edit`, gdy dostawca włącza tryb edycji.

Obecnie oznacza to:

- `google`: `generate` plus `edit`
- `minimax`: tylko `generate`
- `comfy`: osobne pokrycie live Comfy, nie współdzielony sweep dostawców

Pokrycie live typu opt-in dla dołączonej ścieżki muzycznej ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Plik live Comfy obejmuje także workflow obrazu i wideo Comfy, gdy te
sekcje są skonfigurowane.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) - śledzenie zadań dla odłączonych uruchomień `music_generate`
- [Informacje o konfiguracji](/pl/gateway/config-agents#agent-defaults) - konfiguracja `musicGenerationModel`
- [ComfyUI](/pl/providers/comfy)
- [Google (Gemini)](/pl/providers/google)
- [MiniMax](/pl/providers/minimax)
- [Modele](/pl/concepts/models) - konfiguracja modeli i failover
- [Przegląd narzędzi](/pl/tools)
