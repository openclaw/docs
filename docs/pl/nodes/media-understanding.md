---
read_when:
    - Projektujesz lub refaktoryzujesz rozumienie mediów
    - Dostrajasz wstępne przetwarzanie przychodzącego audio/wideo/obrazów
summary: Rozumienie przychodzących obrazów/audio/wideo (opcjonalne) z providerami i fallbackami CLI
title: Rozumienie mediów
x-i18n:
    generated_at: "2026-04-05T13:59:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe36bd42250d48d12f4ff549e8644afa7be8e42ee51f8aff4f21f81b7ff060f4
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Rozumienie mediów - przychodzące (2026-01-17)

OpenClaw może **podsumowywać przychodzące media** (obrazy/audio/wideo), zanim uruchomi się potok odpowiedzi. Automatycznie wykrywa, kiedy dostępne są lokalne narzędzia lub klucze providerów, i może być wyłączone albo dostosowane. Jeśli rozumienie jest wyłączone, modele nadal otrzymują oryginalne pliki/adresy URL jak zwykle.

Zachowanie mediów specyficzne dla dostawców jest rejestrowane przez pluginy dostawców, podczas gdy
core OpenClaw zarządza współdzieloną konfiguracją `tools.media`, kolejnością fallbacków i integracją z potokiem odpowiedzi.

## Cele

- Opcjonalnie: wstępnie przetwarzać przychodzące media do krótkiego tekstu dla szybszego routingu i lepszego parsowania poleceń.
- Zawsze zachowywać dostarczanie oryginalnych mediów do modelu.
- Obsługiwać **API providerów** i **fallbacki CLI**.
- Umożliwiać wiele modeli z uporządkowanym fallbackiem (błąd/rozmiar/timeout).

## Zachowanie na wysokim poziomie

1. Zbierz przychodzące załączniki (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Dla każdej włączonej możliwości (obraz/audio/wideo) wybierz załączniki zgodnie z polityką (domyślnie: **pierwszy**).
3. Wybierz pierwszy kwalifikujący się wpis modelu (rozmiar + możliwość + auth).
4. Jeśli model zawiedzie lub medium jest zbyt duże, **przejdź do następnego wpisu**.
5. Po sukcesie:
   - `Body` staje się blokiem `[Image]`, `[Audio]` lub `[Video]`.
   - Audio ustawia `{{Transcript}}`; parsowanie poleceń używa tekstu podpisu, jeśli istnieje,
     w przeciwnym razie transkryptu.
   - Podpisy są zachowywane jako `User text:` wewnątrz bloku.

Jeśli rozumienie się nie powiedzie lub jest wyłączone, **przepływ odpowiedzi jest kontynuowany** z oryginalnym body i załącznikami.

## Przegląd konfiguracji

`tools.media` obsługuje **współdzielone modele** oraz nadpisania per możliwość:

- `tools.media.models`: współdzielona lista modeli (użyj `capabilities` do ograniczania).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - ustawienia domyślne (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - nadpisania providerów (`baseUrl`, `headers`, `providerOptions`)
  - opcje audio Deepgram przez `tools.media.audio.providerOptions.deepgram`
  - ustawienia echo transkryptu audio (`echoTranscript`, domyślnie `false`; `echoFormat`)
  - opcjonalna **lista `models` per możliwość** (preferowana przed współdzielonymi modelami)
  - polityka `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (opcjonalne ograniczanie według kanału/chatType/klucza sesji)
- `tools.media.concurrency`: maksymalna liczba równoległych przebiegów dla możliwości (domyślnie **2**).

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
  type: "provider", // domyślnie, jeśli pominięto
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // opcjonalne, używane dla wpisów multi-modal
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

- `{{MediaDir}}` (katalog zawierający plik mediów)
- `{{OutputDir}}` (katalog roboczy utworzony dla tego przebiegu)
- `{{OutputBase}}` (bazowa ścieżka pliku roboczego, bez rozszerzenia)

## Wartości domyślne i limity

Zalecane wartości domyślne:

- `maxChars`: **500** dla obrazów/wideo (krótkie, przyjazne dla poleceń)
- `maxChars`: **nieustawione** dla audio (pełny transkrypt, chyba że ustawisz limit)
- `maxBytes`:
  - obraz: **10MB**
  - audio: **20MB**
  - wideo: **50MB**

Zasady:

- Jeśli medium przekracza `maxBytes`, ten model jest pomijany i **próbowany jest następny model**.
- Pliki audio mniejsze niż **1024 bajty** są traktowane jako puste/uszkodzone i pomijane przed transkrypcją provider/CLI.
- Jeśli model zwróci więcej niż `maxChars`, wynik jest przycinany.
- `prompt` domyślnie ma prostą postać „Describe the {media}.” plus wskazówkę `maxChars` (tylko dla obrazów/wideo).
- Jeśli aktywny główny model obrazu już natywnie obsługuje vision, OpenClaw
  pomija blok podsumowania `[Image]` i zamiast tego przekazuje do
  modelu oryginalny obraz.
- Jeśli ustawiono `<capability>.enabled: true`, ale nie skonfigurowano modeli, OpenClaw próbuje użyć
  **aktywnego modelu odpowiedzi**, jeśli jego provider obsługuje tę możliwość.

### Automatyczne wykrywanie rozumienia mediów (domyślne)

Jeśli `tools.media.<capability>.enabled` **nie** jest ustawione na `false` i nie
skonfigurowano modeli, OpenClaw wykrywa automatycznie w tej kolejności i **zatrzymuje się na pierwszej
działającej opcji**:

1. **Aktywny model odpowiedzi**, jeśli jego provider obsługuje tę możliwość.
2. **`agents.defaults.imageModel`** primary/fallback refs (tylko obraz).
3. **Lokalne CLI** (tylko audio; jeśli zainstalowane)
   - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; używa `WHISPER_CPP_MODEL` lub bundlowanego modelu tiny)
   - `whisper` (Python CLI; pobiera modele automatycznie)
4. **Gemini CLI** (`gemini`) używające `read_many_files`
5. **Auth providera**
   - Skonfigurowane wpisy `models.providers.*`, które obsługują daną możliwość, są
     próbowane przed bundlowaną kolejnością fallbacków.
   - Providery skonfigurowane tylko dla obrazów z modelem obsługującym obraz rejestrują się automatycznie dla
     rozumienia mediów nawet wtedy, gdy nie są bundlowanym pluginem dostawcy.
   - Bundlowana kolejność fallbacków:
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

Uwaga: wykrywanie binarek działa best-effort na macOS/Linux/Windows; upewnij się, że CLI znajduje się w `PATH` (rozwijamy `~`), albo ustaw jawny model CLI z pełną ścieżką polecenia.

### Obsługa środowiska proxy (modele providerów)

Gdy włączone jest oparte na providerach rozumienie mediów dla **audio** i **wideo**, OpenClaw
uwzględnia standardowe zmienne środowiskowe wychodzącego proxy dla wywołań HTTP providerów:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jeśli nie ustawiono żadnych zmiennych env proxy, rozumienie mediów używa bezpośredniego wyjścia do sieci.
Jeśli wartość proxy jest nieprawidłowa, OpenClaw zapisuje ostrzeżenie i wraca do bezpośredniego
pobierania.

## Możliwości (opcjonalne)

Jeśli ustawisz `capabilities`, wpis będzie działał tylko dla tych typów mediów. Dla współdzielonych
list OpenClaw może wnioskować wartości domyślne:

- `openai`, `anthropic`, `minimax`: **obraz**
- `minimax-portal`: **obraz**
- `moonshot`: **obraz + wideo**
- `openrouter`: **obraz**
- `google` (Gemini API): **obraz + audio + wideo**
- `qwen`: **obraz + wideo**
- `mistral`: **audio**
- `zai`: **obraz**
- `groq`: **audio**
- `deepgram`: **audio**
- Dowolny katalog `models.providers.<id>.models[]` z modelem obsługującym obraz:
  **obraz**

Dla wpisów CLI **ustaw `capabilities` jawnie**, aby uniknąć zaskakujących dopasowań.
Jeśli pominiesz `capabilities`, wpis kwalifikuje się dla listy, w której się znajduje.

## Macierz obsługi providerów (integracje OpenClaw)

| Możliwość | Integracja providera                                                                  | Uwagi                                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Obraz      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Pluginy dostawców rejestrują obsługę obrazów; MiniMax i MiniMax OAuth używają `MiniMax-VL-01`; providery config obsługujące obraz rejestrują się automatycznie. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                | Transkrypcja providerów (Whisper/Deepgram/Gemini/Voxtral).                                                                                 |
| Wideo      | Google, Qwen, Moonshot                                                                 | Rozumienie wideo providerów przez pluginy dostawców; rozumienie wideo Qwen używa standardowych endpointów DashScope.                      |

Uwaga dotycząca MiniMax:

- Rozumienie obrazów `minimax` i `minimax-portal` pochodzi z należącego do pluginu
  providera mediów `MiniMax-VL-01`.
- Bundlowany katalog tekstowy MiniMax nadal zaczyna się jako wyłącznie tekstowy; jawne
  wpisy `models.providers.minimax` materializują referencje czatu M2.7 obsługujące obrazy.

## Wskazówki dotyczące wyboru modeli

- Preferuj najmocniejszy model najnowszej generacji dostępny dla każdej możliwości mediów, gdy liczy się jakość i bezpieczeństwo.
- Dla agentów z włączonymi narzędziami obsługujących niezaufane dane wejściowe unikaj starszych/słabszych modeli mediów.
- Zachowaj przynajmniej jeden fallback na możliwość dla dostępności (model jakościowy + model szybszy/tańszy).
- Fallbacki CLI (`whisper-cli`, `whisper`, `gemini`) są przydatne, gdy API providerów są niedostępne.
- Uwaga dotycząca `parakeet-mlx`: z `--output-dir` OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy format wyjściowy to `txt` (lub nie został określony); formaty inne niż `txt` wracają do stdout.

## Polityka załączników

`attachments` per możliwość kontroluje, które załączniki są przetwarzane:

- `mode`: `first` (domyślnie) lub `all`
- `maxAttachments`: limit liczby przetwarzanych elementów (domyślnie **1**)
- `prefer`: `first`, `last`, `path`, `url`

Gdy `mode: "all"`, wyniki są oznaczane jako `[Image 1/2]`, `[Audio 2/2]` itd.

Zachowanie ekstrakcji załączników plikowych:

- Wyekstrahowany tekst pliku jest opakowywany jako **niezaufana treść zewnętrzna**, zanim
  zostanie dołączony do promptu mediów.
- Wstrzykiwany blok używa jawnych znaczników granicznych, takich jak
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, i zawiera linię metadanych
  `Source: External`.
- Ta ścieżka ekstrakcji załączników celowo pomija długi baner
  `SECURITY NOTICE:`, aby nie rozdymac promptu mediów; znaczniki graniczne
  i metadane nadal pozostają.
- Jeśli plik nie ma tekstu możliwego do wyekstrahowania, OpenClaw wstrzykuje `[No extractable text]`.
- Jeśli PDF na tej ścieżce wraca do renderowanych obrazów stron, prompt mediów zachowuje
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
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Pojedynczy wpis multi-modal (jawne capabilities)

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

## Wynik statusu

Gdy działa rozumienie mediów, `/status` zawiera krótką linię podsumowania:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Pokazuje to wyniki per możliwość oraz wybranego provider/model, gdy ma to zastosowanie.

## Uwagi

- Rozumienie działa w trybie **best‑effort**. Błędy nie blokują odpowiedzi.
- Załączniki są nadal przekazywane do modeli nawet wtedy, gdy rozumienie jest wyłączone.
- Użyj `scope`, aby ograniczyć miejsca działania rozumienia (np. tylko do DM).

## Powiązana dokumentacja

- [Configuration](/gateway/configuration)
- [Image & Media Support](/nodes/images)
