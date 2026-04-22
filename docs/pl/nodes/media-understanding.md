---
read_when:
    - Projektowanie lub refaktoryzacja rozumienia multimediów
    - Dostrajanie wstępnego przetwarzania przychodzącego audio/wideo/obrazów
summary: Rozumienie przychodzących obrazów/audio/wideo (opcjonalnie) z zapasowymi ścieżkami dostawcy i CLI
title: Rozumienie multimediów
x-i18n:
    generated_at: "2026-04-22T04:24:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d80c9bcd965b521c3c782a76b9dd31eb6e6c635d8a1cc6895b6ccfaf5f9492e
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Rozumienie multimediów - przychodzących (2026-01-17)

OpenClaw może **podsumowywać przychodzące multimedia** (obraz/audio/wideo), zanim uruchomi się pipeline odpowiedzi. Automatycznie wykrywa, kiedy dostępne są lokalne narzędzia lub klucze dostawców, i może zostać wyłączone albo dostosowane. Jeśli rozumienie jest wyłączone, modele nadal otrzymują oryginalne pliki/URL jak zwykle.

Zachowanie multimediów specyficzne dla dostawcy jest rejestrowane przez pluginy dostawców, podczas gdy
rdzeń OpenClaw odpowiada za współdzieloną konfigurację `tools.media`, kolejność fallback
i integrację z pipeline odpowiedzi.

## Cele

- Opcjonalnie: wstępne przetwarzanie przychodzących multimediów do krótkiego tekstu dla szybszego routingu i lepszego parsowania poleceń.
- Zachowanie dostarczania oryginalnych multimediów do modelu (zawsze).
- Obsługa **API dostawców** i **CLI fallback**.
- Umożliwienie użycia wielu modeli z uporządkowanym fallbackiem (błąd/rozmiar/timeout).

## Zachowanie na wysokim poziomie

1. Zbierz przychodzące załączniki (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Dla każdej włączonej możliwości (obraz/audio/wideo) wybierz załączniki zgodnie z zasadą (domyślnie: **pierwszy**).
3. Wybierz pierwszy kwalifikujący się wpis modelu (rozmiar + możliwość + auth).
4. Jeśli model zawiedzie albo multimedia są zbyt duże, **przejdź do następnego wpisu**.
5. Przy powodzeniu:
   - `Body` staje się blokiem `[Image]`, `[Audio]` albo `[Video]`.
   - Audio ustawia `{{Transcript}}`; parsowanie poleceń używa tekstu podpisu, jeśli jest obecny,
     w przeciwnym razie transkrypcji.
   - Podpisy są zachowywane jako `User text:` wewnątrz bloku.

Jeśli rozumienie nie powiedzie się albo jest wyłączone, **przepływ odpowiedzi jest kontynuowany** z oryginalnym body + załącznikami.

## Omówienie konfiguracji

`tools.media` obsługuje **współdzielone modele** oraz nadpisania per możliwość:

- `tools.media.models`: współdzielona lista modeli (użyj `capabilities`, aby ograniczyć użycie).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - wartości domyślne (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - nadpisania dostawcy (`baseUrl`, `headers`, `providerOptions`)
  - opcje audio Deepgram przez `tools.media.audio.providerOptions.deepgram`
  - kontrolki echa transkrypcji audio (`echoTranscript`, domyślnie `false`; `echoFormat`)
  - opcjonalna lista `models` **per możliwość** (preferowana przed współdzielonymi modelami)
  - zasada `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (opcjonalne ograniczenie według channel/chatType/session key)
- `tools.media.concurrency`: maksymalna liczba równoległych uruchomień per możliwość (domyślnie **2**).

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

Każdy wpis `models[]` może być typu **provider** albo **cli**:

```json5
{
  type: "provider", // domyślnie, jeśli pominięto
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Opisz obraz w <= 500 znakach.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // opcjonalne, używane dla wpisów multimodalnych
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
    "Odczytaj multimedia pod adresem {{MediaPath}} i opisz je w <= {{MaxChars}} znakach.",
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

## Wartości domyślne i limity

Zalecane wartości domyślne:

- `maxChars`: **500** dla obrazu/wideo (krótkie, przyjazne dla poleceń)
- `maxChars`: **nieustawione** dla audio (pełna transkrypcja, chyba że ustawisz limit)
- `maxBytes`:
  - obraz: **10MB**
  - audio: **20MB**
  - wideo: **50MB**

Zasady:

- Jeśli multimedia przekraczają `maxBytes`, ten model jest pomijany i **próbowany jest następny model**.
- Pliki audio mniejsze niż **1024 bajty** są traktowane jako puste/uszkodzone i pomijane przed transkrypcją dostawcy/CLI.
- Jeśli model zwróci więcej niż `maxChars`, wynik jest przycinany.
- `prompt` domyślnie ma postać prostego „Opisz {media}.” plus wskazówki `maxChars` (tylko obraz/wideo).
- Jeśli aktywny główny model obrazu już natywnie obsługuje vision, OpenClaw
  pomija blok podsumowania `[Image]` i zamiast tego przekazuje do
  modelu oryginalny obraz.
- Jawne żądania `openclaw infer image describe --model <provider/model>` działają inaczej: uruchamiają bezpośrednio wskazany model dostawcy obsługujący obrazy, w tym
  referencje Ollama takie jak `ollama/qwen2.5vl:7b`.
- Jeśli `<capability>.enabled: true`, ale nie skonfigurowano żadnych modeli, OpenClaw próbuje użyć
  **aktywnego modelu odpowiedzi**, jeśli jego dostawca obsługuje tę możliwość.

### Automatyczne wykrywanie rozumienia multimediów (domyślne)

Jeśli `tools.media.<capability>.enabled` **nie** jest ustawione na `false` i nie skonfigurowano
modeli, OpenClaw wykrywa automatycznie w tej kolejności i **zatrzymuje się na pierwszej
działającej opcji**:

1. **Aktywny model odpowiedzi**, jeśli jego dostawca obsługuje tę możliwość.
2. Główne/zapasowe referencje **`agents.defaults.imageModel`** (tylko obraz).
3. **Lokalne CLI** (tylko audio; jeśli zainstalowane)
   - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; używa `WHISPER_CPP_MODEL` albo dołączonego małego modelu)
   - `whisper` (Python CLI; pobiera modele automatycznie)
4. **Gemini CLI** (`gemini`) z użyciem `read_many_files`
5. **Auth dostawcy**
   - Skonfigurowane wpisy `models.providers.*`, które obsługują daną możliwość, są
     próbowane przed dołączoną kolejnością fallback.
   - Dostawcy skonfigurowani tylko dla obrazu z modelem obsługującym obrazy są automatycznie rejestrowani dla
     rozumienia multimediów, nawet jeśli nie są dołączonym pluginem dostawcy.
   - Rozumienie obrazów Ollama jest dostępne po wybraniu jawnym, na
     przykład przez `agents.defaults.imageModel` albo
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Dołączona kolejność fallback:
     - Audio: OpenAI → Groq → Deepgram → Google → Mistral
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

Uwaga: wykrywanie binariów jest best-effort na macOS/Linux/Windows; upewnij się, że CLI znajduje się na `PATH` (rozwijamy `~`), albo ustaw jawny model CLI z pełną ścieżką polecenia.

### Obsługa środowiska proxy (modele dostawców)

Gdy oparte na dostawcach rozumienie multimediów **audio** i **wideo** jest włączone, OpenClaw
uwzględnia standardowe zmienne środowiskowe wychodzącego proxy dla wywołań HTTP dostawców:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jeśli nie ustawiono żadnych zmiennych środowiskowych proxy, rozumienie multimediów używa bezpośredniego egressu.
Jeśli wartość proxy jest nieprawidłowa, OpenClaw zapisuje ostrzeżenie w logach i wraca do bezpośredniego
fetch.

## Możliwości (opcjonalnie)

Jeśli ustawisz `capabilities`, wpis będzie uruchamiany tylko dla tych typów multimediów. Dla współdzielonych
list OpenClaw może wywnioskować wartości domyślne:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `deepgram`: **audio**
- Dowolny katalog `models.providers.<id>.models[]` z modelem obsługującym obrazy:
  **image**

Dla wpisów CLI **ustaw `capabilities` jawnie**, aby uniknąć zaskakujących dopasowań.
Jeśli pominiesz `capabilities`, wpis kwalifikuje się dla listy, w której się znajduje.

## Macierz obsługi dostawców (integracje OpenClaw)

| Możliwość | Integracja dostawcy                                                                   | Uwagi                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Obraz      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, dostawcy konfiguracyjni | Pluginy dostawców rejestrują obsługę obrazów; MiniMax i MiniMax OAuth używają `MiniMax-VL-01`; dostawcy konfiguracyjni obsługujący obrazy są rejestrowani automatycznie. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                | Transkrypcja dostawcy (Whisper/Deepgram/Gemini/Voxtral).                                                                                |
| Wideo      | Google, Qwen, Moonshot                                                                 | Rozumienie wideo przez dostawców za pomocą pluginów dostawców; rozumienie wideo Qwen używa standardowych endpointów DashScope.                         |

Uwaga MiniMax:

- Rozumienie obrazów `minimax` i `minimax-portal` pochodzi z należącego do pluginu
  dostawcy mediów `MiniMax-VL-01`.
- Dołączony katalog tekstowy MiniMax nadal zaczyna od trybu tylko tekstowego; jawne
  wpisy `models.providers.minimax` materializują referencje czatu M2.7 obsługujące obrazy.

## Wskazówki dotyczące wyboru modelu

- Preferuj najmocniejszy dostępny model najnowszej generacji dla każdej możliwości multimedialnej, gdy liczą się jakość i bezpieczeństwo.
- Dla agentów z narzędziami obsługujących niezaufane dane wejściowe unikaj starszych/słabszych modeli multimedialnych.
- Zachowaj co najmniej jeden fallback dla każdej możliwości w celu zapewnienia dostępności (model jakościowy + szybszy/tańszy model).
- Fallbacki CLI (`whisper-cli`, `whisper`, `gemini`) są przydatne, gdy API dostawców są niedostępne.
- Uwaga `parakeet-mlx`: z `--output-dir` OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy format wyjścia to `txt` (lub nie został określony); formaty inne niż `txt` wracają zapasowo do stdout.

## Zasady załączników

Per możliwość `attachments` kontroluje, które załączniki są przetwarzane:

- `mode`: `first` (domyślnie) albo `all`
- `maxAttachments`: limit liczby przetwarzanych załączników (domyślnie **1**)
- `prefer`: `first`, `last`, `path`, `url`

Gdy `mode: "all"`, wyniki są oznaczane jako `[Image 1/2]`, `[Audio 2/2]` itd.

Zachowanie ekstrakcji załączników plikowych:

- Wyekstrahowany tekst pliku jest opakowywany jako **niezaufana treść zewnętrzna**, zanim
  zostanie dołączony do promptu multimedialnego.
- Wstrzykiwany blok używa jawnych znaczników granic takich jak
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` i zawiera linię metadanych
  `Source: External`.
- Ta ścieżka ekstrakcji załączników celowo pomija długi
  baner `SECURITY NOTICE:`, aby nie rozdymać promptu multimedialnego; znaczniki
  granic i metadane pozostają jednak zachowane.
- Jeśli plik nie zawiera tekstu możliwego do wyekstrahowania, OpenClaw wstrzykuje `[No extractable text]`.
- Jeśli PDF w tej ścieżce wraca zapasowo do renderowanych obrazów stron, prompt multimedialny zachowuje
  placeholder `[PDF content rendered to images; images not forwarded to model]`,
  ponieważ ten krok ekstrakcji załączników przekazuje bloki tekstu, a nie renderowane obrazy PDF.

## Przykłady konfiguracji

### 1) Współdzielona lista modeli + nadpisania

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
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
            "Odczytaj multimedia pod adresem {{MediaPath}} i opisz je w <= {{MaxChars}} znakach.",
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

### 2) Tylko audio i wideo (obraz wyłączony)

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
              "Odczytaj multimedia pod adresem {{MediaPath}} i opisz je w <= {{MaxChars}} znakach.",
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
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Odczytaj multimedia pod adresem {{MediaPath}} i opisz je w <= {{MaxChars}} znakach.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Jeden wpis multimodalny (jawne capabilities)

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

Gdy działa rozumienie multimediów, `/status` zawiera krótki wiersz podsumowania:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Pokazuje to wyniki per możliwość oraz wybranego dostawcę/model, gdy ma to zastosowanie.

## Uwagi

- Rozumienie działa w trybie **best-effort**. Błędy nie blokują odpowiedzi.
- Załączniki są nadal przekazywane do modeli nawet wtedy, gdy rozumienie jest wyłączone.
- Użyj `scope`, aby ograniczyć miejsca, w których działa rozumienie (np. tylko DM).

## Powiązana dokumentacja

- [Konfiguracja](/pl/gateway/configuration)
- [Obsługa obrazów i multimediów](/pl/nodes/images)
