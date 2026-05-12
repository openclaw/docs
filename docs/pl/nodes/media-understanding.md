---
read_when:
    - Projektowanie lub refaktoryzacja rozumienia multimediów
    - Dostrajanie wstępnego przetwarzania przychodzącego audio/wideo/obrazów
sidebarTitle: Media understanding
summary: Rozumienie przychodzących obrazów, dźwięku i wideo (opcjonalne) z mechanizmami awaryjnymi dostawcy i CLI
title: Rozumienie multimediów
x-i18n:
    generated_at: "2026-05-12T08:45:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d58141ac1591890a4eb2c5cdcbc1bf19727fb0c3a1d4d0a912c6bb19d3f3592
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw może **streszczać przychodzące multimedia** (obraz/audio/wideo), zanim uruchomi się potok odpowiedzi. Automatycznie wykrywa, kiedy dostępne są lokalne narzędzia lub klucze dostawców, i można to wyłączyć albo dostosować. Jeśli rozumienie jest wyłączone, modele nadal otrzymują oryginalne pliki/adresy URL jak zwykle.

Zachowanie multimediów specyficzne dla dostawców jest rejestrowane przez pluginy dostawców, natomiast rdzeń OpenClaw odpowiada za wspólną konfigurację `tools.media`, kolejność zapasową i integrację z potokiem odpowiedzi.

## Cele

- Opcjonalnie: wstępnie streścić przychodzące multimedia do krótkiego tekstu, aby przyspieszyć routing i poprawić analizę poleceń.
- Zachować oryginalne dostarczanie multimediów do modelu (zawsze).
- Obsługiwać **API dostawców** i **zapasowe CLI**.
- Umożliwić wiele modeli z uporządkowaną listą zapasową (błąd/rozmiar/limit czasu).

## Ogólne zachowanie

<Steps>
  <Step title="Zbierz załączniki">
    Zbierz przychodzące załączniki (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Wybierz dla każdej możliwości">
    Dla każdej włączonej możliwości (obraz/audio/wideo) wybierz załączniki według polityki (domyślnie: **pierwszy**).
  </Step>
  <Step title="Wybierz model">
    Wybierz pierwszy kwalifikujący się wpis modelu (rozmiar + możliwość + uwierzytelnienie).
  </Step>
  <Step title="Przejdź do opcji zapasowej po niepowodzeniu">
    Jeśli model zawiedzie lub multimedia są zbyt duże, **przejdź do następnego wpisu**.
  </Step>
  <Step title="Zastosuj blok powodzenia">
    Po powodzeniu:

    - `Body` staje się blokiem `[Image]`, `[Audio]` lub `[Video]`.
    - Audio ustawia `{{Transcript}}`; analiza poleceń używa tekstu podpisu, gdy jest obecny, w przeciwnym razie transkrypcji.
    - Podpisy są zachowywane jako `User text:` wewnątrz bloku.

  </Step>
</Steps>

Jeśli rozumienie zawiedzie lub jest wyłączone, **przepływ odpowiedzi jest kontynuowany** z oryginalną treścią + załącznikami.

## Przegląd konfiguracji

`tools.media` obsługuje **wspólne modele** oraz nadpisania dla poszczególnych możliwości:

<AccordionGroup>
  <Accordion title="Klucze najwyższego poziomu">
    - `tools.media.models`: wspólna lista modeli (użyj `capabilities` do ograniczania).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - wartości domyślne (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - nadpisania dostawcy (`baseUrl`, `headers`, `providerOptions`)
      - opcje audio Deepgram przez `tools.media.audio.providerOptions.deepgram`
      - sterowanie echem transkrypcji audio (`echoTranscript`, domyślnie `false`; `echoFormat`)
      - opcjonalna **lista `models` dla danej możliwości** (preferowana przed wspólnymi modelami)
      - polityka `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (opcjonalne ograniczanie według kanału/chatType/klucza sesji)
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

    Szablony CLI mogą też używać:

    - `{{MediaDir}}` (katalog zawierający plik multimedialny)
    - `{{OutputDir}}` (katalog roboczy utworzony dla tego uruchomienia)
    - `{{OutputBase}}` (bazowa ścieżka pliku roboczego, bez rozszerzenia)

  </Tab>
</Tabs>

## Wartości domyślne i limity

Zalecane wartości domyślne:

- `maxChars`: **500** dla obrazu/wideo (krótko, przyjaźnie dla poleceń)
- `maxChars`: **nieustawione** dla audio (pełna transkrypcja, chyba że ustawisz limit)
- `maxBytes`:
  - obraz: **10MB**
  - audio: **20MB**
  - wideo: **50MB**

<AccordionGroup>
  <Accordion title="Reguły">
    - Jeśli multimedia przekraczają `maxBytes`, ten model jest pomijany i próbowany jest **następny model**.
    - Pliki audio mniejsze niż **1024 bajty** są traktowane jako puste/uszkodzone i pomijane przed transkrypcją dostawcy/CLI; kontekst odpowiedzi przychodzącej otrzymuje deterministyczną transkrypcję zastępczą, aby agent wiedział, że notatka była zbyt mała.
    - Jeśli model zwróci więcej niż `maxChars`, wynik zostanie przycięty.
    - `prompt` domyślnie to proste "Opisz {media}." oraz wskazówki `maxChars` (tylko obraz/wideo).
    - Jeśli aktywny podstawowy model obrazu już natywnie obsługuje widzenie, OpenClaw pomija blok podsumowania `[Image]` i zamiast tego przekazuje do modelu oryginalny obraz.
    - Jeśli podstawowy model Gateway/WebChat jest tylko tekstowy, załączniki obrazów są zachowywane jako odłożone referencje `media://inbound/*`, aby narzędzia obrazów/PDF lub skonfigurowany model obrazu nadal mogły je sprawdzić zamiast utracić załącznik.
    - Jawne żądania `openclaw infer image describe --model <provider/model>` są inne: uruchamiają bezpośrednio tego dostawcę/model z obsługą obrazów, w tym referencje Ollama takie jak `ollama/qwen2.5vl:7b`.
    - Jeśli `<capability>.enabled: true`, ale nie skonfigurowano żadnych modeli, OpenClaw próbuje użyć **aktywnego modelu odpowiedzi**, gdy jego dostawca obsługuje tę możliwość.

  </Accordion>
</AccordionGroup>

### Automatyczne wykrywanie rozumienia multimediów (domyślnie)

Jeśli `tools.media.<capability>.enabled` **nie** jest ustawione na `false` i nie skonfigurowano modeli, OpenClaw automatycznie wykrywa w tej kolejności i **zatrzymuje się na pierwszej działającej opcji**:

<Steps>
  <Step title="Aktywny model odpowiedzi">
    Aktywny model odpowiedzi, gdy jego dostawca obsługuje tę możliwość.
  </Step>
  <Step title="agents.defaults.imageModel">
    Podstawowe/zapasowe referencje `agents.defaults.imageModel` (tylko obraz).
    Preferuj referencje `provider/model`. Niekwalifikowane referencje są kwalifikowane z wpisów modeli dostawcy skonfigurowanych z obsługą obrazów tylko wtedy, gdy dopasowanie jest unikalne.
  </Step>
  <Step title="Lokalne CLI (tylko audio)">
    Lokalne CLI (jeśli zainstalowane):

    - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z enkoderem/dekoderem/joinerem/tokenami)
    - `whisper-cli` (`whisper-cpp`; używa `WHISPER_CPP_MODEL` lub dołączonego modelu tiny)
    - `whisper` (CLI Pythona; automatycznie pobiera modele)

  </Step>
  <Step title="Gemini CLI">
    `gemini` z użyciem `read_many_files`.
  </Step>
  <Step title="Uwierzytelnianie dostawcy">
    - Skonfigurowane wpisy `models.providers.*`, które obsługują tę możliwość, są próbowane przed dołączoną kolejnością zapasową.
    - Dostawcy konfiguracji tylko dla obrazów z modelem obsługującym obrazy rejestrują się automatycznie do rozumienia multimediów, nawet gdy nie są dołączonym pluginem dostawcy.
    - Rozumienie obrazów Ollama jest dostępne po jawnym wybraniu, na przykład przez `agents.defaults.imageModel` albo `openclaw infer image describe --model ollama/<vision-model>`.

    Dołączona kolejność zapasowa:

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
Wykrywanie binariów jest realizowane w miarę możliwości w systemach macOS/Linux/Windows; upewnij się, że CLI znajduje się w `PATH` (rozwijamy `~`), albo ustaw jawny model CLI z pełną ścieżką polecenia.
</Note>

### Obsługa środowiska proxy (modele dostawców)

Gdy włączone jest rozumienie multimediów **audio** i **wideo** oparte na dostawcach, OpenClaw respektuje standardowe zmienne środowiskowe wychodzącego proxy dla wywołań HTTP do dostawców:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Jeśli nie ustawiono żadnych zmiennych środowiskowych proxy, rozumienie multimediów używa bezpośredniego wyjścia sieciowego. Jeśli wartość proxy jest nieprawidłowa, OpenClaw loguje ostrzeżenie i wraca do bezpośredniego pobierania.

## Możliwości (opcjonalne)

Jeśli ustawisz `capabilities`, wpis uruchamia się tylko dla tych typów multimediów. Dla wspólnych list OpenClaw może wywnioskować wartości domyślne:

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

Dla wpisów CLI **ustaw `capabilities` jawnie**, aby uniknąć zaskakujących dopasowań. Jeśli pominiesz `capabilities`, wpis kwalifikuje się do listy, w której się znajduje.

## Macierz obsługi dostawców (integracje OpenClaw)

| Możliwość | Integracja dostawcy                                                                                                         | Uwagi                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Obraz      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, dostawcy z konfiguracji | Pluginy dostawców rejestrują obsługę obrazów; `openai-codex/*` używa mechanizmów dostawcy OAuth; `codex/*` używa ograniczonej tury Codex app-server; MiniMax i MiniMax OAuth używają `MiniMax-VL-01`; dostawcy z konfiguracji obsługujący obrazy rejestrują się automatycznie. |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Transkrypcja po stronie dostawcy (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                     |
| Wideo      | Google, Qwen, Moonshot                                                                                                       | Rozumienie wideo po stronie dostawcy przez pluginy dostawców; rozumienie wideo Qwen używa punktów końcowych Standard DashScope.                                                                                                                        |

<Note>
**Uwaga o MiniMax**

- Rozumienie obrazów `minimax` i `minimax-portal` pochodzi z zarządzanego przez plugin dostawcy multimediów `MiniMax-VL-01`.
- Dołączony tekstowy katalog MiniMax nadal zaczyna jako tylko tekstowy; jawne wpisy `models.providers.minimax` tworzą referencje czatu M2.7 z obsługą obrazów.

</Note>

## Wskazówki dotyczące wyboru modelu

- Preferuj najsilniejszy dostępny model najnowszej generacji dla każdej możliwości multimediów, gdy jakość i bezpieczeństwo mają znaczenie.
- Dla agentów z włączonymi narzędziami, którzy obsługują niezaufane dane wejściowe, unikaj starszych/słabszych modeli multimedialnych.
- Zachowaj co najmniej jeden model zapasowy dla każdej możliwości, aby zapewnić dostępność (model o wyższej jakości + szybszy/tańszy model).
- Zapasowe opcje CLI (`whisper-cli`, `whisper`, `gemini`) są przydatne, gdy API dostawców są niedostępne.
- Uwaga `parakeet-mlx`: z `--output-dir` OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy format wyjściowy to `txt` (lub nie został określony); formaty inne niż `txt` używają zapasowo stdout.

## Polityka załączników

Parametr `attachments` dla każdej możliwości kontroluje, które załączniki są przetwarzane:

<ParamField path="mode" type='"first" | "all"' default="first">
  Czy przetwarzać pierwszy wybrany załącznik, czy wszystkie.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Ogranicza liczbę przetwarzanych elementów.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferencja wyboru spośród kandydatów na załączniki.
</ParamField>

Gdy `mode: "all"`, dane wyjściowe są oznaczane jako `[Image 1/2]`, `[Audio 2/2]` itd.

<AccordionGroup>
  <Accordion title="Zachowanie wyodrębniania załączników plikowych">
    - Wyodrębniony tekst pliku jest opakowywany jako **niezaufana treść zewnętrzna**, zanim zostanie dołączony do promptu multimedialnego.
    - Wstrzyknięty blok używa jawnych znaczników granic, takich jak `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, i zawiera wiersz metadanych `Source: External`.
    - Ta ścieżka wyodrębniania załączników celowo pomija długi baner `SECURITY NOTICE:`, aby nie rozdymać promptu multimedialnego; znaczniki granic i metadane nadal pozostają.
    - Jeśli plik nie ma tekstu możliwego do wyodrębnienia, OpenClaw wstrzykuje `[No extractable text]`.
    - Jeśli w tej ścieżce PDF przełącza się awaryjnie na wyrenderowane obrazy stron, prompt multimedialny zachowuje symbol zastępczy `[PDF content rendered to images; images not forwarded to model]`, ponieważ ten krok wyodrębniania załącznika przekazuje bloki tekstu, a nie wyrenderowane obrazy PDF.

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
  <Tab title="Tylko obrazy">
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
  <Tab title="Pojedynczy wpis wielomodalny">
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

## Dane wyjściowe statusu

Gdy działa rozumienie multimediów, `/status` zawiera krótki wiersz podsumowania:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Pokazuje to wyniki dla każdej możliwości oraz wybranego dostawcę/model, gdy ma to zastosowanie.

## Uwagi

- Rozumienie działa na zasadzie **best-effort**. Błędy nie blokują odpowiedzi.
- Załączniki nadal są przekazywane do modeli, nawet gdy rozumienie jest wyłączone.
- Użyj `scope`, aby ograniczyć miejsca, w których działa rozumienie (np. tylko wiadomości prywatne).

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Obsługa obrazów i multimediów](/pl/nodes/images)
