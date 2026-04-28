---
read_when:
    - Projektowanie lub refaktoryzacja rozumienia multimediów
    - Dostrajanie przetwarzania wstępnego przychodzących audio/wideo/obrazów
sidebarTitle: Media understanding
summary: Rozumienie przychodzących obrazów/audio/wideo (opcjonalne) z fallbackami dostawców + CLI
title: Rozumienie multimediów
x-i18n:
    generated_at: "2026-04-26T11:35:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ee170a7af523fd2ce4f5f7764638f510b135f94a7796325daf1c3e04147f90
    source_path: nodes/media-understanding.md
    workflow: 15
---

OpenClaw może **podsumowywać przychodzące multimedia** (obraz/audio/wideo) przed uruchomieniem pipeline odpowiedzi. Automatycznie wykrywa, kiedy dostępne są lokalne narzędzia lub klucze dostawców, i można to wyłączyć lub dostosować. Jeśli rozumienie jest wyłączone, modele nadal otrzymują oryginalne pliki/URL-e jak zwykle.

Zachowanie multimediów specyficzne dla dostawcy jest rejestrowane przez pluginy dostawców, podczas gdy rdzeń OpenClaw zarządza współdzieloną konfiguracją `tools.media`, kolejnością fallback i integracją z pipeline odpowiedzi.

## Cele

- Opcjonalność: wstępne przetworzenie przychodzących multimediów do krótkiego tekstu dla szybszego routingu + lepszego parsowania poleceń.
- Zachowanie dostarczenia oryginalnych multimediów do modelu (zawsze).
- Obsługa **API dostawców** i **fallbacków CLI**.
- Umożliwienie wielu modeli z uporządkowanym fallbackiem (błąd/rozmiar/timeout).

## Zachowanie na wysokim poziomie

<Steps>
  <Step title="Zbierz załączniki">
    Zbierz przychodzące załączniki (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Wybierz per możliwość">
    Dla każdej włączonej możliwości (obraz/audio/wideo) wybierz załączniki zgodnie z polityką (domyślnie: **pierwszy**).
  </Step>
  <Step title="Wybierz model">
    Wybierz pierwszy kwalifikujący się wpis modelu (rozmiar + możliwość + uwierzytelnianie).
  </Step>
  <Step title="Przełącz awaryjnie przy błędzie">
    Jeśli model zawiedzie albo multimedia są zbyt duże, **przełącz awaryjnie do następnego wpisu**.
  </Step>
  <Step title="Zastosuj blok sukcesu">
    Przy sukcesie:

    - `Body` staje się blokiem `[Image]`, `[Audio]` lub `[Video]`.
    - Dla audio ustawiane jest `{{Transcript}}`; parsowanie poleceń używa tekstu podpisu, jeśli istnieje, w przeciwnym razie transkryptu.
    - Podpisy są zachowywane jako `User text:` wewnątrz bloku.

  </Step>
</Steps>

Jeśli rozumienie zawiedzie albo jest wyłączone, **przepływ odpowiedzi jest kontynuowany** z oryginalnym body + załącznikami.

## Przegląd konfiguracji

`tools.media` obsługuje **współdzielone modele** oraz nadpisania per możliwość:

<AccordionGroup>
  <Accordion title="Klucze najwyższego poziomu">
    - `tools.media.models`: współdzielona lista modeli (użyj `capabilities` do bramkowania).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - ustawienia domyślne (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - nadpisania dostawcy (`baseUrl`, `headers`, `providerOptions`)
      - opcje audio Deepgram przez `tools.media.audio.providerOptions.deepgram`
      - kontrolki echa transkryptu audio (`echoTranscript`, domyślnie `false`; `echoFormat`)
      - opcjonalna **lista `models` per możliwość** (preferowana przed modelami współdzielonymi)
      - polityka `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (opcjonalne bramkowanie według channel/chatType/session key)
    - `tools.media.concurrency`: maksymalna liczba równoczesnych uruchomień możliwości (domyślnie **2**).
  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* współdzielona lista */
      ],
      image: {
        /* opcjonalne nadpisania */
      },
      audio: {
        /* opcjonalne nadpisania */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* opcjonalne nadpisania */
      },
    },
  },
}
```

### Wpisy modeli

Każdy wpis `models[]` może być typu **provider** lub **CLI**:

<Tabs>
  <Tab title="Wpis dostawcy">
    ```json5
    {
      type: "provider", // domyślnie, jeśli pominięte
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Opisz obraz w <= 500 znakach.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // opcjonalne, używane dla wpisów multimodalnych
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
        "Odczytaj multimedia z {{MediaPath}} i opisz je w <= {{MaxChars}} znakach.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    Szablony CLI mogą również używać:

    - `{{MediaDir}}` (katalog zawierający plik multimedialny)
    - `{{OutputDir}}` (katalog scratch utworzony dla tego uruchomienia)
    - `{{OutputBase}}` (ścieżka bazowa pliku scratch bez rozszerzenia)

  </Tab>
</Tabs>

## Ustawienia domyślne i limity

Zalecane ustawienia domyślne:

- `maxChars`: **500** dla obrazów/wideo (krótkie, przyjazne dla poleceń)
- `maxChars`: **nieustawione** dla audio (pełny transkrypt, chyba że ustawisz limit)
- `maxBytes`:
  - obraz: **10MB**
  - audio: **20MB**
  - wideo: **50MB**

<AccordionGroup>
  <Accordion title="Reguły">
    - Jeśli multimedia przekraczają `maxBytes`, ten model jest pomijany i **próbowany jest następny model**.
    - Pliki audio mniejsze niż **1024 bajty** są traktowane jako puste/uszkodzone i pomijane przed transkrypcją przez dostawcę/CLI; przychodzący kontekst odpowiedzi otrzymuje deterministyczny placeholder transkryptu, aby agent wiedział, że notatka była zbyt mała.
    - Jeśli model zwraca więcej niż `maxChars`, wynik jest przycinany.
    - `prompt` domyślnie przyjmuje prostą postać „Opisz {media}.” plus wskazówki `maxChars` (tylko obraz/wideo).
    - Jeśli aktywny primary image model natywnie obsługuje vision, OpenClaw pomija blok podsumowania `[Image]` i zamiast tego przekazuje oryginalny obraz do modelu.
    - Jeśli primary model Gateway/WebChat jest tylko tekstowy, załączniki obrazów są zachowywane jako referencje offloaded `media://inbound/*`, aby narzędzia obraz/PDF lub skonfigurowany image model nadal mogły je sprawdzić zamiast tracić załącznik.
    - Jawne żądania `openclaw infer image describe --model <provider/model>` są inne: uruchamiają bezpośrednio ten dostawcę/model zdolny do obsługi obrazów, w tym referencje Ollama takie jak `ollama/qwen2.5vl:7b`.
    - Jeśli `<capability>.enabled: true`, ale nie skonfigurowano modeli, OpenClaw próbuje **aktywnego modelu odpowiedzi**, gdy dostawca obsługuje tę możliwość.
  </Accordion>
</AccordionGroup>

### Automatyczne wykrywanie rozumienia multimediów (domyślne)

Jeśli `tools.media.<capability>.enabled` **nie** jest ustawione na `false` i nie skonfigurowano modeli, OpenClaw automatycznie wykrywa w tej kolejności i **zatrzymuje się na pierwszej działającej opcji**:

<Steps>
  <Step title="Aktywny model odpowiedzi">
    Aktywny model odpowiedzi, gdy jego dostawca obsługuje tę możliwość.
  </Step>
  <Step title="agents.defaults.imageModel">
    Referencje primary/fallback `agents.defaults.imageModel` (tylko obraz).
  </Step>
  <Step title="Lokalne CLI (tylko audio)">
    Lokalne CLI (jeśli zainstalowane):

    - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; używa `WHISPER_CPP_MODEL` lub dołączonego tiny model)
    - `whisper` (Python CLI; automatycznie pobiera modele)

  </Step>
  <Step title="Gemini CLI">
    `gemini` używające `read_many_files`.
  </Step>
  <Step title="Uwierzytelnianie dostawcy">
    - Skonfigurowane wpisy `models.providers.*` obsługujące daną możliwość są próbowane przed dołączoną kolejnością fallback.
    - Dostawcy skonfigurowani tylko dla obrazów z modelem zdolnym do obsługi obrazów automatycznie rejestrują się do rozumienia multimediów, nawet gdy nie są dołączonym pluginem dostawcy.
    - Rozumienie obrazów Ollama jest dostępne, gdy zostanie jawnie wybrane, na przykład przez `agents.defaults.imageModel` lub `openclaw infer image describe --model ollama/<vision-model>`.

    Dołączona kolejność fallback:

    - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
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
Wykrywanie binariów działa best-effort na macOS/Linux/Windows; upewnij się, że CLI jest na `PATH` (rozwijamy `~`), albo ustaw jawny model CLI z pełną ścieżką polecenia.
</Note>

### Obsługa środowiska proxy (modele dostawców)

Gdy rozumienie multimediów **audio** i **wideo** oparte na dostawcach jest włączone, OpenClaw respektuje standardowe zmienne środowiskowe wychodzącego proxy dla wywołań HTTP do dostawców:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jeśli nie ustawiono żadnych zmiennych env proxy, rozumienie multimediów używa bezpośredniego egress. Jeśli wartość proxy jest nieprawidłowa, OpenClaw loguje ostrzeżenie i wraca do bezpośredniego pobierania.

## Możliwości (opcjonalnie)

Jeśli ustawisz `capabilities`, wpis uruchomi się tylko dla tych typów multimediów. Dla list współdzielonych OpenClaw potrafi wywnioskować ustawienia domyślne:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Każdy katalog `models.providers.<id>.models[]` z modelem zdolnym do obsługi obrazów: **image**

Dla wpisów CLI **ustaw `capabilities` jawnie**, aby uniknąć zaskakujących dopasowań. Jeśli pominiesz `capabilities`, wpis kwalifikuje się do listy, w której się znajduje.

## Macierz obsługi dostawców (integracje OpenClaw)

| Możliwość | Integracja dostawcy                                                                                                          | Uwagi                                                                                                                                                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Obraz     | OpenAI, OpenAI Codex OAuth, app-server Codex, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Pluginy dostawców rejestrują obsługę obrazów; `openai-codex/*` używa mechaniki dostawcy OAuth; `codex/*` używa ograniczonej tury app-server Codex; MiniMax i MiniMax OAuth używają `MiniMax-VL-01`; config providers zdolni do obsługi obrazów rejestrują się automatycznie. |
| Audio     | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Transkrypcja przez dostawcę (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                             |
| Wideo     | Google, Qwen, Moonshot                                                                                                       | Rozumienie wideo przez dostawcę przez pluginy dostawców; rozumienie wideo Qwen używa standardowych punktów końcowych DashScope.                                                                                                      |

<Note>
**Uwaga o MiniMax**

- Rozumienie obrazów `minimax` i `minimax-portal` pochodzi z dostawcy multimediów `MiniMax-VL-01` należącego do pluginu.
- Dołączony katalog tekstowy MiniMax nadal zaczyna jako tylko tekstowy; jawne wpisy `models.providers.minimax` materializują referencje czatu M2.7 zdolne do obsługi obrazów.
</Note>

## Wskazówki dotyczące wyboru modeli

- Preferuj najsilniejszy model najnowszej generacji dostępny dla każdej możliwości multimedialnej, gdy liczą się jakość i bezpieczeństwo.
- Dla agentów z włączonymi narzędziami obsługujących niezaufane dane wejściowe unikaj starszych/słabszych modeli multimedialnych.
- Zachowaj co najmniej jeden fallback na możliwość dla dostępności (model jakościowy + szybszy/tańszy model).
- Fallbacki CLI (`whisper-cli`, `whisper`, `gemini`) są przydatne, gdy API dostawców są niedostępne.
- Uwaga o `parakeet-mlx`: przy `--output-dir` OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy format wyjściowy to `txt` (lub nieokreślony); formaty inne niż `txt` wracają do stdout.

## Polityka załączników

Per możliwość `attachments` kontroluje, które załączniki są przetwarzane:

<ParamField path="mode" type='"first" | "all"' default="first">
  Czy przetwarzać pierwszy wybrany załącznik, czy wszystkie.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Ogranicza liczbę przetwarzanych.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferencja wyboru wśród kandydatów na załączniki.
</ParamField>

Gdy `mode: "all"`, wyniki są oznaczane jako `[Image 1/2]`, `[Audio 2/2]` itd.

<AccordionGroup>
  <Accordion title="Zachowanie ekstrakcji załączników plikowych">
    - Wyodrębniony tekst pliku jest opakowywany jako **niezaufana zawartość zewnętrzna**, zanim zostanie dołączony do promptu multimedialnego.
    - Wstrzyknięty blok używa jawnych znaczników granic, takich jak `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, i zawiera wiersz metadanych `Source: External`.
    - Ta ścieżka ekstrakcji załączników celowo pomija długi baner `SECURITY NOTICE:`, aby nie rozdymać promptu multimedialnego; znaczniki granic i metadane nadal jednak pozostają.
    - Jeśli plik nie ma tekstu nadającego się do wyodrębnienia, OpenClaw wstrzykuje `[No extractable text]`.
    - Jeśli PDF na tej ścieżce przechodzi awaryjnie do renderowanych obrazów stron, prompt multimedialny zachowuje placeholder `[PDF content rendered to images; images not forwarded to model]`, ponieważ ten krok ekstrakcji załączników przekazuje bloki tekstowe, a nie renderowane obrazy PDF.
  </Accordion>
</AccordionGroup>

## Przykłady konfiguracji

<Tabs>
  <Tab title="Współdzielone modele + nadpisania">
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
                "Odczytaj multimedia z {{MediaPath}} i opisz je w <= {{MaxChars}} znakach.",
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
                  "Odczytaj multimedia z {{MediaPath}} i opisz je w <= {{MaxChars}} znakach.",
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
                  "Odczytaj multimedia z {{MediaPath}} i opisz je w <= {{MaxChars}} znakach.",
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

Pokazuje to wyniki per możliwość oraz wybranego dostawcę/model, gdy ma to zastosowanie.

## Uwagi

- Rozumienie działa w trybie **best-effort**. Błędy nie blokują odpowiedzi.
- Załączniki są nadal przekazywane do modeli nawet wtedy, gdy rozumienie jest wyłączone.
- Użyj `scope`, aby ograniczyć miejsca, w których działa rozumienie (np. tylko DM).

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Obsługa obrazów i multimediów](/pl/nodes/images)
