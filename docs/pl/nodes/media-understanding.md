---
read_when:
    - Projektowanie lub refaktoryzacja rozumienia mediów
    - Dostrajanie wstępnego przetwarzania przychodzącego audio/wideo/obrazu
sidebarTitle: Media understanding
summary: Rozumienie przychodzących obrazów/audio/wideo (opcjonalnie) z fallbackami dostawcy i CLI
title: Rozumienie multimediów
x-i18n:
    generated_at: "2026-06-27T17:45:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4724578632b0210290d1b32077d2c0ccf7fdfa6b96160f76bf3eff591df7b92e
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw może **podsumowywać przychodzące multimedia** (obrazy/audio/wideo), zanim uruchomi się potok odpowiedzi. Automatycznie wykrywa dostępność narzędzi lokalnych lub kluczy dostawców i można to wyłączyć albo dostosować. Jeśli rozumienie jest wyłączone, modele nadal otrzymują oryginalne pliki/adresy URL jak zwykle.

Zachowanie multimediów specyficzne dla dostawcy jest rejestrowane przez Pluginy dostawców, a rdzeń OpenClaw odpowiada za wspólną konfigurację `tools.media`, kolejność fallbacków i integrację z potokiem odpowiedzi.

## Cele

- Opcjonalnie: wstępnie streszczaj przychodzące multimedia do krótkiego tekstu, aby przyspieszyć routing i poprawić parsowanie poleceń.
- Zachowuj oryginalne przekazanie multimediów do modelu (zawsze).
- Obsługuj **API dostawców** i **fallbacki CLI**.
- Pozwalaj na wiele modeli z uporządkowanym fallbackiem (błąd/rozmiar/timeout).

## Zachowanie wysokiego poziomu

<Steps>
  <Step title="Zbierz załączniki">
    Zbierz przychodzące załączniki (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Wybierz według możliwości">
    Dla każdej włączonej możliwości (obraz/audio/wideo) wybierz załączniki zgodnie z zasadą (domyślnie: **pierwszy**).
  </Step>
  <Step title="Wybierz model">
    Wybierz pierwszy kwalifikujący się wpis modelu (rozmiar + możliwość + uwierzytelnienie).
  </Step>
  <Step title="Fallback po niepowodzeniu">
    Jeśli model zawiedzie albo multimedia są za duże, **przejdź fallbackiem do następnego wpisu**.
  </Step>
  <Step title="Zastosuj blok sukcesu">
    Po sukcesie:

    - `Body` staje się blokiem `[Image]`, `[Audio]` lub `[Video]`.
    - Audio ustawia `{{Transcript}}`; parsowanie poleceń używa tekstu podpisu, jeśli jest obecny, w przeciwnym razie transkrypcji.
    - Podpisy są zachowywane jako `User text:` wewnątrz bloku.

  </Step>
</Steps>

Jeśli rozumienie zawiedzie albo jest wyłączone, **przepływ odpowiedzi jest kontynuowany** z oryginalną treścią + załącznikami.

## Omówienie konfiguracji

`tools.media` obsługuje **wspólne modele** oraz nadpisania dla poszczególnych możliwości:

<AccordionGroup>
  <Accordion title="Klucze najwyższego poziomu">
    - `tools.media.models`: wspólna lista modeli (użyj `capabilities` do bramkowania).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - wartości domyślne (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - nadpisania dostawcy (`baseUrl`, `headers`, `providerOptions`)
      - opcje audio Deepgram przez `tools.media.audio.providerOptions.deepgram`
      - kontrolki echa transkrypcji audio (`echoTranscript`, domyślnie `false`; `echoFormat`)
      - opcjonalna **lista `models` dla danej możliwości** (preferowana przed modelami wspólnymi)
      - zasada `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (opcjonalne bramkowanie według kanału/chatType/klucza sesji)
    - `tools.media.concurrency`: maksymalna liczba równoczesnych uruchomień możliwości (domyślnie **2**).

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

    Szablony CLI mogą też używać:

    - `{{MediaDir}}` (katalog zawierający plik multimedialny)
    - `{{OutputDir}}` (katalog roboczy utworzony dla tego uruchomienia)
    - `{{OutputBase}}` (ścieżka bazowa pliku roboczego, bez rozszerzenia)

  </Tab>
</Tabs>

### Dane uwierzytelniające dostawcy (`apiKey`)

Rozumienie multimediów przez dostawcę używa tego samego mechanizmu rozwiązywania uwierzytelnienia dostawcy co zwykłe
wywołania modelu: profile uwierzytelnienia, zmienne środowiskowe, a następnie
`models.providers.<providerId>.apiKey`.

Wpisy `tools.media.*.models[]` nie akceptują wbudowanego pola `apiKey`. Wartość
`provider` we wpisie modelu multimedialnego, taka jak `openai` lub `moonshot`, musi
mieć dostępne dane uwierzytelniające przez jedno ze standardowych źródeł uwierzytelnienia dostawcy.

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

Pełny opis uwierzytelniania dostawców, w tym profile, zmienne środowiskowe
i niestandardowe bazowe adresy URL, znajdziesz w [Narzędzia i dostawcy niestandardowi](/pl/gateway/config-tools).

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
    - Jeśli multimedia przekraczają `maxBytes`, ten model jest pomijany i **próbowany jest następny model**.
    - Pliki audio mniejsze niż **1024 bajty** są traktowane jako puste/uszkodzone i pomijane przed transkrypcją przez dostawcę/CLI; kontekst odpowiedzi przychodzącej otrzymuje deterministyczny zastępczy tekst transkrypcji, aby agent wiedział, że notatka była za mała.
    - Jeśli model zwróci więcej niż `maxChars`, wynik jest przycinany.
    - `prompt` domyślnie ma prostą postać „Describe the {media}.” plus wskazówkę `maxChars` (tylko obraz/wideo).
    - Jeśli aktywny podstawowy model obrazu obsługuje już natywnie widzenie, OpenClaw pomija blok podsumowania `[Image]` i zamiast tego przekazuje oryginalny obraz do modelu.
    - Jeśli podstawowy model Gateway/WebChat jest tylko tekstowy, załączniki obrazów są zachowywane jako odciążone referencje `media://inbound/*`, aby narzędzia obrazów/PDF albo skonfigurowany model obrazu nadal mogły je sprawdzić zamiast utraty załącznika.
    - Jawne żądania `openclaw infer image describe --model <provider/model>` są inne: uruchamiają bezpośrednio tego dostawcę/model obsługujący obrazy, w tym referencje Ollama takie jak `ollama/qwen2.5vl:7b`.
    - Jeśli `<capability>.enabled: true`, ale nie skonfigurowano żadnych modeli, OpenClaw próbuje użyć **aktywnego modelu odpowiedzi**, gdy jego dostawca obsługuje daną możliwość.

  </Accordion>
</AccordionGroup>

### Automatyczne wykrywanie rozumienia multimediów (domyślne)

Jeśli `tools.media.<capability>.enabled` **nie** jest ustawione na `false` i nie skonfigurowano modeli, OpenClaw wykrywa automatycznie w tej kolejności i **zatrzymuje się na pierwszej działającej opcji**:

<Steps>
  <Step title="Aktywny model odpowiedzi">
    Aktywny model odpowiedzi, gdy jego dostawca obsługuje daną możliwość.
  </Step>
  <Step title="agents.defaults.imageModel">
    Podstawowe/fallbackowe referencje `agents.defaults.imageModel` (tylko obraz).
    Preferuj referencje `provider/model`. Gołe referencje są kwalifikowane ze skonfigurowanych wpisów modeli dostawców obsługujących obrazy tylko wtedy, gdy dopasowanie jest unikalne.
  </Step>
  <Step title="Lokalne CLI (tylko audio)">
    Lokalne CLI (jeśli zainstalowane):

    - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; używa `WHISPER_CPP_MODEL` albo dołączonego modelu tiny)
    - `whisper` (Python CLI; automatycznie pobiera modele)

  </Step>
  <Step title="Gemini CLI">
    `gemini` używające `read_many_files`.
  </Step>
  <Step title="Uwierzytelnienie dostawcy">
    - Skonfigurowane wpisy `models.providers.*`, które obsługują daną możliwość, są próbowane przed dołączoną kolejnością fallbacków.
    - Dostawcy konfiguracji tylko dla obrazów z modelem obsługującym obrazy automatycznie rejestrują się do rozumienia multimediów, nawet jeśli nie są dołączonym Pluginem dostawcy.
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
Wykrywanie binariów działa na zasadzie best effort w macOS/Linux/Windows; upewnij się, że CLI jest w `PATH` (rozwijamy `~`), albo ustaw jawny model CLI z pełną ścieżką polecenia.
</Note>

### Obsługa środowiska proxy (modele dostawców)

Gdy włączone jest rozumienie multimediów **audio** i **wideo** oparte na dostawcy, OpenClaw respektuje standardowe zmienne środowiskowe proxy dla wychodzących wywołań HTTP dostawców:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Jeśli nie ustawiono zmiennych środowiskowych proxy, rozumienie multimediów używa bezpośredniego wyjścia. Jeśli wartość proxy jest nieprawidłowa, OpenClaw zapisuje ostrzeżenie w logach i wraca do bezpośredniego pobierania.

## Możliwości (opcjonalne)

Jeśli ustawisz `capabilities`, wpis działa tylko dla tych typów multimediów. Dla list wspólnych OpenClaw może wywnioskować wartości domyślne:

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
- Dowolny katalog `models.providers.<id>.models[]` z modelem obsługującym obrazy: **obraz**

Dla wpisów CLI **ustaw `capabilities` jawnie**, aby uniknąć zaskakujących dopasowań. Jeśli pominiesz `capabilities`, wpis kwalifikuje się dla listy, w której występuje.

## Macierz obsługi dostawców (integracje OpenClaw)

| Możliwość | Integracja dostawcy                                                                                                         | Uwagi                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Obraz      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, dostawcy konfiguracji | Pluginy dostawców rejestrują obsługę obrazów; `openai/*` może używać routingu przez klucz API albo Codex OAuth; `codex/*` używa ograniczonej tury Codex app-server; MiniMax i MiniMax OAuth używają `MiniMax-VL-01`; dostawcy konfiguracji obsługujący obrazy rejestrują się automatycznie. |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Transkrypcja dostawcy (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| Wideo      | Google, Qwen, Moonshot                                                                                                       | Rozumienie wideo przez dostawcę za pośrednictwem Pluginów dostawców; rozumienie wideo Qwen używa standardowych punktów końcowych DashScope.                                                                                                                            |

<Note>
**Uwaga dotycząca MiniMax**

- Rozumienie obrazów dla `minimax`, `minimax-cn`, `minimax-portal` i `minimax-portal-cn` pochodzi z należącego do Plugin dostawcy mediów `MiniMax-VL-01`.
- Automatyczne routowanie obrazów nadal używa `MiniMax-VL-01`, nawet jeśli starsze metadane czatu MiniMax M2.x deklarują wejście obrazowe.

</Note>

## Wskazówki dotyczące wyboru modelu

- Preferuj najsilniejszy dostępny model najnowszej generacji dla każdej funkcji multimedialnej, gdy jakość i bezpieczeństwo mają znaczenie.
- W przypadku agentów z narzędziami obsługujących niezaufane dane wejściowe unikaj starszych/słabszych modeli multimedialnych.
- Zachowaj co najmniej jeden mechanizm rezerwowy dla każdej funkcji, aby zapewnić dostępność (model jakościowy + szybszy/tańszy model).
- Mechanizmy rezerwowe CLI (`whisper-cli`, `whisper`, `gemini`) są przydatne, gdy interfejsy API dostawców są niedostępne.
- Uwaga dotycząca `parakeet-mlx`: z `--output-dir` OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy format wyjściowy to `txt` (lub nie został określony); formaty inne niż `txt` wracają do stdout.

## Zasady dotyczące załączników

`attachments` dla poszczególnych funkcji kontroluje, które załączniki są przetwarzane:

<ParamField path="mode" type='"first" | "all"' default="first">
  Czy przetwarzać pierwszy wybrany załącznik, czy wszystkie.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Ogranicza liczbę przetwarzanych elementów.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferencja wyboru spośród kandydatów na załączniki.
</ParamField>

Gdy `mode: "all"`, wyniki są oznaczane jako `[Image 1/2]`, `[Audio 2/2]` itd.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - Wyodrębniony tekst pliku jest opakowywany jako **niezaufana treść zewnętrzna**, zanim zostanie dołączony do promptu multimedialnego.
    - Wstrzyknięty blok używa jawnych znaczników granic, takich jak `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, i zawiera wiersz metadanych `Source: External`.
    - Ta ścieżka wyodrębniania załączników celowo pomija długi baner `SECURITY NOTICE:`, aby nie rozdymać promptu multimedialnego; znaczniki granic i metadane nadal pozostają.
    - Jeśli plik nie ma możliwego do wyodrębnienia tekstu, OpenClaw wstrzykuje `[No extractable text]`.
    - Jeśli PDF w tej ścieżce wraca do renderowanych obrazów stron, prompt multimedialny zachowuje placeholder `[PDF content rendered to images; images not forwarded to model]`, ponieważ ten krok wyodrębniania załączników przekazuje bloki tekstowe, a nie renderowane obrazy PDF.

  </Accordion>
</AccordionGroup>

## Przykłady konfiguracji

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Audio + video only">
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
  <Tab title="Image-only">
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
  <Tab title="Multi-modal single entry">
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

## Dane wyjściowe stanu

Gdy działa rozumienie multimediów, `/status` zawiera krótki wiersz podsumowania:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Pokazuje to wyniki dla poszczególnych funkcji oraz wybranego dostawcę/model, gdy ma to zastosowanie.

## Uwagi

- Rozumienie działa na zasadzie **najlepszego starania**. Błędy nie blokują odpowiedzi.
- Załączniki nadal są przekazywane do modeli, nawet gdy rozumienie jest wyłączone.
- Użyj `scope`, aby ograniczyć miejsca uruchamiania rozumienia (np. tylko wiadomości prywatne).

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Obsługa obrazów i multimediów](/pl/nodes/images)
