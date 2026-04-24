---
read_when:
    - Projektowanie lub refaktoryzacja rozumienia multimediów
    - Dostrajanie wstępnego przetwarzania przychodzącego audio/wideo/obrazu
summary: Rozumienie przychodzących obrazów/audio/wideo (opcjonalne) z fallbackami providera + CLI
title: Rozumienie multimediów
x-i18n:
    generated_at: "2026-04-24T09:19:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9eb9449fbc1bed170bbef213aa43d71d4146edbc0dd626ef50af9e044a8e299
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Rozumienie multimediów — przychodzące (2026-01-17)

OpenClaw może **podsumowywać przychodzące multimedia** (obraz/audio/wideo) przed uruchomieniem potoku odpowiedzi. Automatycznie wykrywa dostępność lokalnych narzędzi lub kluczy providera i może zostać wyłączone albo dostosowane. Jeśli rozumienie jest wyłączone, modele nadal otrzymują oryginalne pliki/URL-e jak zwykle.

Zachowanie multimediów specyficzne dla vendora jest rejestrowane przez Pluginy vendora, podczas gdy rdzeń OpenClaw zarządza współdzieloną konfiguracją `tools.media`, kolejnością fallbacków i integracją z potokiem odpowiedzi.

## Cele

- Opcjonalność: wstępne przetrawienie przychodzących multimediów do krótkiego tekstu dla szybszego routingu + lepszego parsowania poleceń.
- Zawsze zachowywać dostarczanie oryginalnych multimediów do modelu.
- Obsługa **API providerów** i **fallbacków CLI**.
- Umożliwienie wielu modeli z uporządkowanym fallbackiem (błąd/rozmiar/timeout).

## Zachowanie na wysokim poziomie

1. Zbierz przychodzące załączniki (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Dla każdej włączonej możliwości (obraz/audio/wideo) wybierz załączniki zgodnie z polityką (domyślnie: **pierwszy**).
3. Wybierz pierwszy kwalifikujący się wpis modelu (rozmiar + możliwość + auth).
4. Jeśli model zakończy się błędem lub multimedia są zbyt duże, następuje **fallback do następnego wpisu**.
5. Po sukcesie:
   - `Body` staje się blokiem `[Image]`, `[Audio]` lub `[Video]`.
   - Audio ustawia `{{Transcript}}`; parsowanie poleceń używa tekstu podpisu, jeśli jest obecny,
     w przeciwnym razie transkryptu.
   - Podpisy są zachowywane jako `User text:` wewnątrz bloku.

Jeśli rozumienie zakończy się błędem lub jest wyłączone, **przepływ odpowiedzi jest kontynuowany** z oryginalnym body + załącznikami.

## Przegląd konfiguracji

`tools.media` obsługuje **współdzielone modele** oraz nadpisania per możliwość:

- `tools.media.models`: współdzielona lista modeli (użyj `capabilities` do bramkowania).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - wartości domyślne (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - nadpisania providera (`baseUrl`, `headers`, `providerOptions`)
  - opcje audio Deepgram przez `tools.media.audio.providerOptions.deepgram`
  - kontrolki echa transkryptu audio (`echoTranscript`, domyślnie `false`; `echoFormat`)
  - opcjonalna **lista `models` per możliwość** (preferowana przed modelami współdzielonymi)
  - polityka `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (opcjonalne bramkowanie przez kanał/chatType/klucz sesji)
- `tools.media.concurrency`: maksymalna liczba równoległych uruchomień możliwości (domyślnie **2**).

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

Każdy wpis `models[]` może być typu **provider** albo **CLI**:

```json5
{
  type: "provider", // domyślnie, jeśli pominięte
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // opcjonalne, używane dla wpisów wielomodalnych
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

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

Szablony CLI mogą także używać:

- `{{MediaDir}}` (katalog zawierający plik multimediów)
- `{{OutputDir}}` (katalog scratch utworzony dla tego uruchomienia)
- `{{OutputBase}}` (podstawowa ścieżka pliku scratch, bez rozszerzenia)

## Wartości domyślne i limity

Zalecane wartości domyślne:

- `maxChars`: **500** dla obrazu/wideo (krótkie, przyjazne dla poleceń)
- `maxChars`: **nieustawione** dla audio (pełny transkrypt, chyba że ustawisz limit)
- `maxBytes`:
  - obraz: **10 MB**
  - audio: **20 MB**
  - wideo: **50 MB**

Reguły:

- Jeśli multimedia przekraczają `maxBytes`, ten model jest pomijany i **próbowany jest następny model**.
- Pliki audio mniejsze niż **1024 bajty** są traktowane jako puste/uszkodzone i pomijane przed transkrypcją provider/CLI.
- Jeśli model zwróci więcej niż `maxChars`, dane wyjściowe są przycinane.
- `prompt` domyślnie przyjmuje prostą postać „Describe the {media}.” wraz ze wskazówką `maxChars` (tylko obraz/wideo).
- Jeśli aktywny podstawowy model obrazu natywnie obsługuje vision, OpenClaw
  pomija blok podsumowania `[Image]` i zamiast tego przekazuje oryginalny obraz do
  modelu.
- Jeśli podstawowy model Gateway/WebChat jest tylko tekstowy, załączniki obrazów są
  zachowywane jako odciążone odwołania `media://inbound/*`, dzięki czemu narzędzie obrazu lub skonfigurowany
  model obrazu nadal mogą je sprawdzić zamiast utracić załącznik.
- Jawne żądania `openclaw infer image describe --model <provider/model>`
  są inne: uruchamiają bezpośrednio ten provider/model obsługujący obrazy, w tym
  odwołania Ollama takie jak `ollama/qwen2.5vl:7b`.
- Jeśli `<capability>.enabled: true`, ale nie skonfigurowano modeli, OpenClaw próbuje
  użyć **aktywnego modelu odpowiedzi**, jeśli provider go obsługuje.

### Automatyczne wykrywanie rozumienia multimediów (domyślnie)

Jeśli `tools.media.<capability>.enabled` **nie** jest ustawione na `false` i nie
skonfigurowałeś modeli, OpenClaw wykrywa automatycznie w tej kolejności i **zatrzymuje się na pierwszej
działającej opcji**:

1. **Aktywny model odpowiedzi**, jeśli jego provider obsługuje daną możliwość.
2. **Podstawowe/zapasowe odwołania `agents.defaults.imageModel`** (tylko obraz).
3. **Lokalne CLI** (tylko audio; jeśli zainstalowane)
   - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; używa `WHISPER_CPP_MODEL` lub dołączonego modelu tiny)
   - `whisper` (Python CLI; pobiera modele automatycznie)
4. **Gemini CLI** (`gemini`) używające `read_many_files`
5. **Auth providera**
   - Skonfigurowane wpisy `models.providers.*`, które obsługują daną możliwość, są
     próbowane przed dołączoną kolejnością fallbacków.
   - Providerzy konfiguracji tylko obrazów z modelem obsługującym obrazy automatycznie rejestrują się do
     rozumienia multimediów, nawet jeśli nie są dołączonym Pluginem vendora.
   - Rozumienie obrazów Ollama jest dostępne po jawnym wybraniu, na
     przykład przez `agents.defaults.imageModel` albo
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Dołączona kolejność fallbacków:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Obraz: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Wideo: Google → Qwen → Moonshot

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

Uwaga: wykrywanie binariów jest best-effort na macOS/Linux/Windows; upewnij się, że CLI jest w `PATH` (rozwijamy `~`), albo ustaw jawny model CLI z pełną ścieżką polecenia.

### Obsługa środowiska proxy (modele providerów)

Gdy włączone jest rozumienie multimediów **audio** i **wideo** oparte na providerach, OpenClaw
honoruje standardowe zmienne środowiskowe wychodzącego proxy dla wywołań HTTP providera:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jeśli nie ustawiono żadnych zmiennych środowiskowych proxy, rozumienie multimediów używa bezpośredniego wyjścia.
Jeśli wartość proxy jest nieprawidłowa, OpenClaw zapisuje ostrzeżenie i wraca do bezpośredniego
pobierania.

## Możliwości (opcjonalne)

Jeśli ustawisz `capabilities`, wpis będzie uruchamiany tylko dla tych typów multimediów. Dla list
współdzielonych OpenClaw może wywnioskować wartości domyślne:

- `openai`, `anthropic`, `minimax`: **obraz**
- `minimax-portal`: **obraz**
- `moonshot`: **obraz + wideo**
- `openrouter`: **obraz**
- `google` (Gemini API): **obraz + audio + wideo**
- `qwen`: **obraz + wideo**
- `mistral`: **audio**
- `zai`: **obraz**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Dowolny katalog `models.providers.<id>.models[]` z modelem obsługującym obrazy:
  **obraz**

Dla wpisów CLI **ustaw `capabilities` jawnie**, aby uniknąć zaskakujących dopasowań.
Jeśli pominiesz `capabilities`, wpis kwalifikuje się dla listy, w której się znajduje.

## Macierz obsługi providerów (integracje OpenClaw)

| Możliwość | Integracja providera                                                                                                         | Uwagi                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Obraz      | OpenAI, OpenAI Codex OAuth, serwer aplikacji Codex, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, providerzy konfiguracji | Pluginy vendora rejestrują obsługę obrazów; `openai-codex/*` używa mechanizmu providera OAuth; `codex/*` używa ograniczonej tury serwera aplikacji Codex; MiniMax i MiniMax OAuth używają `MiniMax-VL-01`; providerzy konfiguracji obsługujący obrazy rejestrują się automatycznie. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                                                      | Transkrypcja providera (Whisper/Deepgram/Gemini/Voxtral).                                                                                                                                                                               |
| Wideo      | Google, Qwen, Moonshot                                                                                                       | Rozumienie wideo providera przez Pluginy vendora; rozumienie wideo Qwen używa standardowych punktów końcowych DashScope.                                                                                                               |

Uwaga o MiniMax:

- Rozumienie obrazów `minimax` i `minimax-portal` pochodzi z należącego do Pluginu
  providera mediów `MiniMax-VL-01`.
- Dołączony katalog tekstowy MiniMax nadal zaczyna się od modeli tylko tekstowych; jawne
  wpisy `models.providers.minimax` materializują odwołania czatu M2.7 obsługujące obrazy.

## Wskazówki dotyczące wyboru modeli

- Preferuj najsilniejszy model najnowszej generacji dostępny dla każdej możliwości multimedialnej, gdy liczy się jakość i bezpieczeństwo.
- Dla agentów z włączonymi narzędziami obsługujących nieufne wejścia unikaj starszych/słabszych modeli multimedialnych.
- Zachowaj co najmniej jeden fallback per możliwość dla dostępności (model jakościowy + szybszy/tańszy model).
- Fallbacki CLI (`whisper-cli`, `whisper`, `gemini`) są przydatne, gdy API providerów są niedostępne.
- Uwaga o `parakeet-mlx`: z `--output-dir` OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy format wyjściowy to `txt` (lub nie został określony); formaty inne niż `txt` wracają do stdout.

## Polityka załączników

Per możliwość `attachments` kontroluje, które załączniki są przetwarzane:

- `mode`: `first` (domyślnie) lub `all`
- `maxAttachments`: ogranicza liczbę przetwarzanych załączników (domyślnie **1**)
- `prefer`: `first`, `last`, `path`, `url`

Gdy `mode: "all"`, dane wyjściowe są oznaczane jako `[Image 1/2]`, `[Audio 2/2]` itd.

Zachowanie ekstrakcji załączników plikowych:

- Wyodrębniony tekst pliku jest opakowywany jako **nieufna treść zewnętrzna** przed
  dołączeniem do promptu multimediów.
- Wstrzyknięty blok używa jawnych znaczników granicznych takich jak
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` i zawiera linię metadanych
  `Source: External`.
- Ta ścieżka ekstrakcji załączników celowo pomija długi
  banner `SECURITY NOTICE:`, aby nie rozdymać promptu multimediów; znaczniki
  graniczne i metadane nadal pozostają.
- Jeśli plik nie ma tekstu możliwego do wyodrębnienia, OpenClaw wstrzykuje `[No extractable text]`.
- Jeśli PDF w tej ścieżce wraca do renderowanych obrazów stron, prompt multimediów zachowuje
  placeholder `[PDF content rendered to images; images not forwarded to model]`,
  ponieważ ten krok ekstrakcji załączników przekazuje bloki tekstowe, a nie renderowane obrazy PDF.

## Przykłady konfiguracji

### 1) Współdzielona lista modeli + nadpisania

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

### 2) Tylko audio + wideo (obraz wyłączony)

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

### 3) Opcjonalne rozumienie obrazów

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

### 4) Pojedynczy wpis multimodalny (jawne capabilities)

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

## Dane wyjściowe statusu

Gdy uruchamia się rozumienie multimediów, `/status` zawiera krótką linię podsumowania:

```
📎 Multimedia: obraz ok (openai/gpt-5.4) · audio pominięte (maxBytes)
```

To pokazuje wyniki per możliwość oraz wybranego providera/model, jeśli ma to zastosowanie.

## Uwagi

- Rozumienie działa w trybie **best-effort**. Błędy nie blokują odpowiedzi.
- Załączniki są nadal przekazywane do modeli, nawet gdy rozumienie jest wyłączone.
- Użyj `scope`, aby ograniczyć miejsca, w których uruchamia się rozumienie (np. tylko wiadomości bezpośrednie).

## Powiązana dokumentacja

- [Konfiguracja](/pl/gateway/configuration)
- [Obsługa obrazów i multimediów](/pl/nodes/images)
