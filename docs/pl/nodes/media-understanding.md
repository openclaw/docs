---
read_when:
    - Projektowanie lub refaktoryzacja rozumienia mediów
    - Dostrajanie przetwarzania wstępnego przychodzących materiałów audio/wideo/obrazów
sidebarTitle: Media understanding
summary: Rozumienie przychodzących obrazów/dźwięku/wideo (opcjonalne) z fallbackami dostawcy i CLI
title: Rozumienie multimediów
x-i18n:
    generated_at: "2026-06-28T10:04:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw może **podsumowywać przychodzące media** (obrazy/audio/wideo), zanim uruchomi się potok odpowiedzi. Automatycznie wykrywa, kiedy dostępne są narzędzia lokalne lub klucze dostawców, i można tę funkcję wyłączyć albo dostosować. Jeśli rozumienie jest wyłączone, modele nadal otrzymują oryginalne pliki/adresy URL jak zwykle.

Zachowanie mediów specyficzne dla dostawcy jest rejestrowane przez Pluginy dostawców, natomiast rdzeń OpenClaw odpowiada za współdzieloną konfigurację `tools.media`, kolejność fallbacków oraz integrację z potokiem odpowiedzi.

## Cele

- Opcjonalnie: wstępnie przetwarzaj przychodzące media na krótki tekst, aby przyspieszyć routing i poprawić parsowanie poleceń.
- Zawsze zachowuj dostarczenie oryginalnych mediów do modelu.
- Obsługuj **API dostawców** i **fallbacki CLI**.
- Pozwalaj na wiele modeli z uporządkowanym fallbackiem (błąd/rozmiar/timeout).

## Zachowanie wysokiego poziomu

<Steps>
  <Step title="Zbierz załączniki">
    Zbierz przychodzące załączniki (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Wybierz według możliwości">
    Dla każdej włączonej możliwości (obraz/audio/wideo) wybierz załączniki zgodnie z polityką (domyślnie: **pierwszy**).
  </Step>
  <Step title="Wybierz model">
    Wybierz pierwszy kwalifikujący się wpis modelu (rozmiar + możliwość + uwierzytelnianie).
  </Step>
  <Step title="Fallback przy niepowodzeniu">
    Jeśli model zawiedzie lub media są zbyt duże, **przejdź awaryjnie do następnego wpisu**.
  </Step>
  <Step title="Zastosuj blok sukcesu">
    Po powodzeniu:

    - `Body` staje się blokiem `[Image]`, `[Audio]` lub `[Video]`.
    - Audio ustawia `{{Transcript}}`; parsowanie poleceń używa tekstu podpisu, gdy jest obecny, w przeciwnym razie transkrypcji.
    - Podpisy są zachowywane jako `User text:` wewnątrz bloku.

  </Step>
</Steps>

Jeśli rozumienie zawiedzie albo jest wyłączone, **przepływ odpowiedzi jest kontynuowany** z oryginalną treścią i załącznikami.

## Przegląd konfiguracji

`tools.media` obsługuje **modele współdzielone** oraz nadpisania dla poszczególnych możliwości:

<AccordionGroup>
  <Accordion title="Klucze najwyższego poziomu">
    - `tools.media.models`: lista modeli współdzielonych (użyj `capabilities` do bramkowania).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - wartości domyślne (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - nadpisania dostawcy (`baseUrl`, `headers`, `providerOptions`)
      - opcje audio Deepgram przez `tools.media.audio.providerOptions.deepgram`
      - kontrolki echa transkrypcji audio (`echoTranscript`, domyślnie `false`; `echoFormat`)
      - opcjonalna **lista `models` dla danej możliwości** (preferowana przed modelami współdzielonymi)
      - polityka `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (opcjonalne bramkowanie według kanału/chatType/klucza sesji)
    - `tools.media.concurrency`: maksymalna liczba współbieżnych uruchomień możliwości (domyślnie **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Wpisy modeli

Każdy wpis `models[]` może być typu **dostawca** albo **CLI**:

<Tabs>
  <Tab title="Wpis dostawcy">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="Wpis CLI">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    Szablony CLI mogą również używać:

    - `{{MediaDir}}` (katalog zawierający plik mediów)
    - `{{OutputDir}}` (katalog roboczy utworzony dla tego uruchomienia)
    - `{{OutputBase}}` (bazowa ścieżka pliku roboczego, bez rozszerzenia)

  </Tab>
</Tabs>

### Dane uwierzytelniające dostawcy (`apiKey`)

Rozumienie mediów przez dostawcę używa tego samego rozwiązywania uwierzytelniania dostawcy co zwykłe wywołania modeli: profili uwierzytelniania, zmiennych środowiskowych, a następnie `models.providers.<providerId>.apiKey`.

Wpisy `tools.media.*.models[]` nie akceptują pola inline `apiKey`. Wartość `provider` we wpisie modelu mediów, taka jak `openai` lub `moonshot`, musi mieć dane uwierzytelniające dostępne przez jedno ze standardowych źródeł uwierzytelniania dostawcy.

Minimalny przykład:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Pełne informacje o uwierzytelnianiu dostawców, w tym profile, zmienne środowiskowe i niestandardowe bazowe adresy URL, znajdziesz w [Narzędziach i niestandardowych dostawcach](/pl/gateway/config-tools).

## Wartości domyślne i limity

Zalecane wartości domyślne:

- `maxChars`: **500** dla obrazu/wideo (krótkie, przyjazne poleceniom)
- `maxChars`: **nieustawione** dla audio (pełna transkrypcja, chyba że ustawisz limit)
- `maxBytes`:
  - obraz: **10MB**
  - audio: **20MB**
  - wideo: **50MB**

<AccordionGroup>
  <Accordion title="Reguły">
    - Jeśli media przekraczają `maxBytes`, ten model jest pomijany i **próbowany jest następny model**.
    - Pliki audio mniejsze niż **1024 bajty** są traktowane jako puste/uszkodzone i pomijane przed transkrypcją przez dostawcę/CLI; przychodzący kontekst odpowiedzi otrzymuje deterministyczny zastępczy tekst transkrypcji, aby agent wiedział, że notatka była zbyt mała.
    - Jeśli model zwróci więcej niż `maxChars`, wynik zostanie przycięty.
    - `prompt` domyślnie to proste „Describe the {media}.” oraz wskazówka `maxChars` (tylko obraz/wideo).
    - Jeśli aktywny główny model obrazu już natywnie obsługuje wizję, OpenClaw pomija blok podsumowania `[Image]` i zamiast tego przekazuje oryginalny obraz do modelu.
    - Jeśli główny model Gateway/WebChat jest wyłącznie tekstowy, załączniki obrazów są zachowywane jako odciążone odwołania `media://inbound/*`, aby narzędzia obrazów/PDF lub skonfigurowany model obrazu nadal mogły je zbadać, zamiast utracić załącznik.
    - Jawne żądania `openclaw infer image describe --model <provider/model>` są inne: uruchamiają bezpośrednio tego dostawcę/model obsługujący obraz, w tym odwołania Ollama takie jak `ollama/qwen2.5vl:7b`.
    - Jeśli `<capability>.enabled: true`, ale nie skonfigurowano modeli, OpenClaw próbuje użyć **aktywnego modelu odpowiedzi**, gdy jego dostawca obsługuje daną możliwość.

  </Accordion>
</AccordionGroup>

### Automatyczne wykrywanie rozumienia mediów (domyślnie)

Jeśli `tools.media.<capability>.enabled` **nie** jest ustawione na `false` i nie skonfigurowano modeli, OpenClaw wykrywa automatycznie w tej kolejności i **zatrzymuje się na pierwszej działającej opcji**:

<Steps>
  <Step title="Aktywny model odpowiedzi">
    Aktywny model odpowiedzi, gdy jego dostawca obsługuje daną możliwość.
  </Step>
  <Step title="agents.defaults.imageModel">
    Główne/fallbackowe odwołania `agents.defaults.imageModel` (tylko obraz).
    Preferuj odwołania `provider/model`. Nagie odwołania są kwalifikowane z wpisów skonfigurowanych modeli dostawców obsługujących obraz tylko wtedy, gdy dopasowanie jest jednoznaczne.
  </Step>
  <Step title="Lokalne CLI (tylko audio)">
    Lokalne CLI (jeśli zainstalowane):

    - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; używa `WHISPER_CPP_MODEL` lub dołączonego modelu tiny)
    - `whisper` (Python CLI; pobiera modele automatycznie)

  </Step>
  <Step title="Gemini CLI">
    `gemini` używające `read_many_files`.
  </Step>
  <Step title="Uwierzytelnianie dostawcy">
    - Skonfigurowane wpisy `models.providers.*`, które obsługują daną możliwość, są próbowane przed dołączoną kolejnością fallbacków.
    - Dostawcy skonfigurowani tylko dla obrazów z modelem obsługującym obraz automatycznie rejestrują się do rozumienia mediów, nawet gdy nie są dołączonym Pluginem dostawcy.
    - Rozumienie obrazów Ollama jest dostępne po jawnym wybraniu, na przykład przez `agents.defaults.imageModel` lub `openclaw infer image describe --model ollama/<vision-model>`.

    Dołączona kolejność fallbacków:

    - Audio: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - Obraz: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Wideo: Google → Qwen → Moonshot

  </Step>
</Steps>

Aby wyłączyć automatyczne wykrywanie, ustaw:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
Wykrywanie binariów działa na zasadzie best-effort w macOS/Linux/Windows; upewnij się, że CLI znajduje się w `PATH` (rozwijamy `~`) albo ustaw jawny model CLI z pełną ścieżką polecenia.
</Note>

### Obsługa środowiska proxy (modele dostawców)

Gdy włączone jest rozumienie mediów oparte na dostawcy dla **audio** i **wideo**, OpenClaw honoruje standardowe wychodzące zmienne środowiskowe proxy dla wywołań HTTP dostawcy:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Jeśli nie ustawiono żadnych zmiennych środowiskowych proxy, rozumienie mediów używa bezpośredniego wyjścia. Jeśli wartość proxy jest nieprawidłowo sformułowana, OpenClaw zapisuje ostrzeżenie w logu i wraca do bezpośredniego pobierania.

## Możliwości (opcjonalnie)

Jeśli ustawisz `capabilities`, wpis uruchamia się tylko dla tych typów mediów. Dla list współdzielonych OpenClaw może wywnioskować wartości domyślne:

- `openai`, `anthropic`, `minimax`: **obraz**
- `minimax-portal`: **obraz**
- `moonshot`: **obraz + wideo**
- `openrouter`: **obraz + audio**
- `google` (Gemini API): **obraz + audio + wideo**
- `qwen`: **obraz + wideo**
- `mistral`: **audio**
- `zai`: **obraz**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Dowolny katalog `models.providers.<id>.models[]` z modelem obsługującym obraz: **obraz**

Dla wpisów CLI **ustaw `capabilities` jawnie**, aby uniknąć zaskakujących dopasowań. Jeśli pominiesz `capabilities`, wpis kwalifikuje się dla listy, w której się znajduje.

## Macierz obsługi dostawców (integracje OpenClaw)

| Możliwość | Integracja dostawcy                                                                                                         | Uwagi                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Obraz      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, dostawcy z konfiguracji | Pluginy dostawców rejestrują obsługę obrazów; `openai/*` może używać routingu przez klucz API lub Codex OAuth; `codex/*` używa ograniczonego przebiegu Codex app-server; MiniMax i MiniMax OAuth używają `MiniMax-VL-01`; dostawcy z konfiguracji obsługujący obraz rejestrują się automatycznie. |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Transkrypcja dostawcy (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| Wideo      | Google, Qwen, Moonshot                                                                                                       | Rozumienie wideo przez dostawcę za pośrednictwem Pluginów dostawców; rozumienie wideo Qwen używa punktów końcowych Standard DashScope.                                                                                                                            |

<Note>
**Uwaga MiniMax**

- Rozumienie obrazów dla `minimax`, `minimax-cn`, `minimax-portal` i `minimax-portal-cn` pochodzi z należącego do pluginu dostawcy multimediów `MiniMax-VL-01`.
- Automatyczne routowanie obrazów nadal używa `MiniMax-VL-01`, nawet jeśli starsze metadane czatu MiniMax M2.x deklarują wejście obrazu.

</Note>

## Wskazówki dotyczące wyboru modelu

- Preferuj najsilniejszy dostępny model najnowszej generacji dla każdej funkcji multimedialnej, gdy liczą się jakość i bezpieczeństwo.
- W przypadku agentów z włączonymi narzędziami, obsługujących niezaufane dane wejściowe, unikaj starszych/słabszych modeli multimedialnych.
- Zachowaj co najmniej jeden model zapasowy dla każdej funkcji, aby zapewnić dostępność (model jakościowy + szybszy/tańszy model).
- Modele zapasowe CLI (`whisper-cli`, `whisper`, `gemini`) są przydatne, gdy API dostawców są niedostępne.
- Uwaga dotycząca `parakeet-mlx`: z `--output-dir` OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy format wyjściowy to `txt` (lub nie został określony); formaty inne niż `txt` wracają do stdout.

## Zasady załączników

`attachments` dla poszczególnych funkcji kontroluje, które załączniki są przetwarzane:

<ParamField path="mode" type='"first" | "all"' default="first">
  Czy przetwarzać pierwszy wybrany załącznik, czy wszystkie.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Ogranicza liczbę przetwarzanych załączników.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferencja wyboru spośród kandydujących załączników.
</ParamField>

Gdy `mode: "all"`, wyjścia są oznaczane jako `[Image 1/2]`, `[Audio 2/2]` itd.

<AccordionGroup>
  <Accordion title="Zachowanie wyodrębniania załączników plikowych">
    - Wyodrębniony tekst pliku jest opakowywany jako **niezaufana treść zewnętrzna**, zanim zostanie dołączony do promptu multimedialnego.
    - Wstrzyknięty blok używa jawnych znaczników granicznych, takich jak `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, i zawiera wiersz metadanych `Source: External`.
    - Ta ścieżka wyodrębniania załączników celowo pomija długi baner `SECURITY NOTICE:`, aby uniknąć rozrastania promptu multimedialnego; znaczniki graniczne i metadane nadal pozostają.
    - Jeśli plik nie ma tekstu możliwego do wyodrębnienia, OpenClaw wstrzykuje `[No extractable text]`.
    - Jeśli PDF wraca do renderowanych obrazów stron w tej ścieżce, OpenClaw przekazuje te obrazy stron do modeli odpowiedzi obsługujących widzenie i zachowuje placeholder `[PDF content rendered to images]` w bloku pliku.

  </Accordion>
</AccordionGroup>

## Przykłady konfiguracji

<Tabs>
  <Tab title="Modele współdzielone + nadpisania">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Tylko audio + wideo">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Tylko obraz">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-6" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Pojedynczy wpis multimodalny">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Wynik statusu

Gdy działa rozumienie multimediów, `/status` zawiera krótki wiersz podsumowania:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Pokazuje to wyniki dla poszczególnych funkcji oraz wybranego dostawcę/model, gdy ma to zastosowanie.

## Uwagi

- Rozumienie działa na zasadzie **best-effort**. Błędy nie blokują odpowiedzi.
- Załączniki nadal są przekazywane do modeli, nawet gdy rozumienie jest wyłączone.
- Użyj `scope`, aby ograniczyć miejsca, w których działa rozumienie (np. tylko DM-y).

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Obsługa obrazów i multimediów](/pl/nodes/images)
