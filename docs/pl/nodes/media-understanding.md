---
read_when:
    - Projektowanie lub refaktoryzacja rozumienia multimediów
    - Dostrajanie wstępnego przetwarzania przychodzącego dźwięku, obrazu wideo i obrazów
sidebarTitle: Media understanding
summary: Rozpoznawanie przychodzących obrazów, dźwięku i wideo (opcjonalne) z użyciem dostawcy i mechanizmów rezerwowych CLI
title: Rozumienie multimediów
x-i18n:
    generated_at: "2026-07-12T15:18:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw może podsumowywać przychodzące multimedia (obrazy/dźwięk/wideo) przed uruchomieniem potoku odpowiedzi, dzięki czemu analizowanie poleceń i trasowanie działają na krótkim tekście zamiast na nieprzetworzonych bajtach. Mechanizm rozumienia automatycznie wykrywa lokalne narzędzia lub klucze dostawców; można też skonfigurować konkretne modele. Oryginalne multimedia są zawsze jak zwykle przekazywane do modelu; gdy mechanizm rozumienia zawiedzie lub jest wyłączony, przepływ odpowiedzi jest kontynuowany bez zmian.

Pluginy dostawców rejestrują metadane możliwości (który dostawca obsługuje dany typ multimediów, model domyślny i priorytet). Rdzeń OpenClaw odpowiada za współdzieloną konfigurację `tools.media`, kolejność mechanizmów rezerwowych oraz integrację z potokiem odpowiedzi.

## Jak to działa

<Steps>
  <Step title="Zbieranie załączników">
    Zbierz przychodzące załączniki (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Wybór dla każdej możliwości">
    Dla każdej włączonej możliwości (obraz/dźwięk/wideo) wybierz załączniki zgodnie z zasadami `attachments` (domyślnie: tylko pierwszy załącznik).
  </Step>
  <Step title="Wybór modelu">
    Wybierz pierwszy odpowiedni wpis modelu (dostępny rozmiar, możliwość i uwierzytelnianie).
  </Step>
  <Step title="Użycie mechanizmu rezerwowego w razie niepowodzenia">
    Jeśli model zwróci błąd, przekroczy limit czasu lub multimedia przekroczą `maxBytes`, wypróbuj następny wpis.
  </Step>
  <Step title="Zastosowanie po powodzeniu">
    `Body` staje się blokiem `[Image]`, `[Audio]` lub `[Video]`. Dźwięk ustawia również `{{Transcript}}`; analizowanie poleceń używa tekstu podpisu, jeśli jest dostępny, a w przeciwnym razie transkrypcji. Podpisy są zachowywane w bloku jako `User text:`.
  </Step>
</Steps>

## Konfiguracja

`tools.media` zawiera współdzieloną listę modeli oraz ustawienia zastępujące dla poszczególnych możliwości:

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

Klucze poszczególnych możliwości (`image`/`audio`/`video`):

| Klucz                                           | Typ       | Wartość domyślna                                     | Uwagi                                                                                          |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | automatycznie (`false` wyłącza)                      | Ustaw `false`, aby wyłączyć automatyczne wykrywanie tej możliwości                             |
| `models`                                        | tablica   | brak                                                 | Preferowane przed współdzieloną listą `tools.media.models`                                     |
| `prompt`                                        | `string`  | `"Describe the {media}."` (+ wskazówki `maxChars`)   | Domyślnie tylko dla obrazu/wideo                                                               |
| `maxChars`                                      | `number`  | `500` (obraz/wideo), nieustawione (dźwięk)           | Dane wyjściowe są skracane, jeśli model zwróci ich więcej                                      |
| `maxBytes`                                      | `number`  | obraz `10485760`, dźwięk `20971520`, wideo `52428800` | Zbyt duże multimedia powodują przejście do następnego modelu                                   |
| `timeoutSeconds`                                | `number`  | `60` (obraz/dźwięk), `120` (wideo)                   |                                                                                                |
| `language`                                      | `string`  | nieustawione                                         | Wskazówka dotycząca języka transkrypcji dźwięku                                                |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | Ustawienia zastępujące żądania dostawcy; zobacz [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools) |
| `attachments`                                   | obiekt    | `{ mode: "first", maxAttachments: 1 }`               | Zobacz [Zasady dotyczące załączników](#attachment-policy)                                      |
| `scope`                                         | obiekt    | nieustawione                                         | Ograniczenie według kanału/`chatType`/`keyPrefix`                                              |
| `echoTranscript`                                | `boolean` | `false`                                              | Tylko dźwięk: odeślij transkrypcję do czatu przed przetwarzaniem przez agenta                   |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | Tylko dźwięk: symbol zastępczy `{transcript}`                                                   |

Opcje specyficzne dla Deepgram należy umieszczać w `providerOptions.deepgram` (pole najwyższego poziomu `deepgram: { detectLanguage, punctuate, smartFormat }` jest przestarzałe, ale nadal odczytywane).

### Wpisy modeli

Każdy wpis `models[]` jest wpisem **dostawcy** (domyślnie) albo wpisem **CLI**:

<Tabs>
  <Tab title="Wpis dostawcy">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, for multi-modal shared entries
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

    Szablony CLI mogą również używać `{{MediaDir}}` (katalog zawierający plik multimedialny), `{{OutputDir}}` (katalog roboczy utworzony na potrzeby tego uruchomienia) oraz `{{OutputBase}}` (bazowa ścieżka pliku roboczego, bez rozszerzenia).

  </Tab>
</Tabs>

### Dane uwierzytelniające dostawcy

Mechanizm rozumienia multimediów dostawcy korzysta z tego samego sposobu ustalania uwierzytelniania co zwykłe wywołania modeli: profile uwierzytelniania, zmienne środowiskowe, a następnie `models.providers.<providerId>.apiKey`. Wpisy `tools.media.*.models[]` nie przyjmują pola `apiKey` bezpośrednio we wpisie.

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

Informacje o profilach, zmiennych środowiskowych i niestandardowych bazowych adresach URL zawiera sekcja [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).

## Reguły i zachowanie

- Multimedia przekraczające `maxBytes` powodują pominięcie danego modelu i wypróbowanie następnego.
- Pliki dźwiękowe mniejsze niż 1024 bajty są uznawane za puste lub uszkodzone i pomijane przed transkrypcją; agent otrzymuje zamiast tego deterministyczny tekst zastępczy transkrypcji.
- Jeśli aktywny podstawowy model obrazu już natywnie obsługuje widzenie, OpenClaw pomija blok podsumowania `[Image]` i przekazuje oryginalny obraz bezpośrednio do modelu. MiniMax stanowi wyjątek: `minimax`, `minimax-cn`, `minimax-portal` i `minimax-portal-cn` zawsze kierują rozumienie obrazu przez należącego do Pluginu dostawcę multimediów `MiniMax-VL-01`, nawet jeśli starsze metadane czatu MiniMax M2.x deklarują obsługę obrazów wejściowych (za natywnie obsługujące widzenie uznawane są tylko `MiniMax-M3` i nowsze).
- Jeśli podstawowy model Gateway/WebChat obsługuje tylko tekst, załączniki graficzne są zachowywane jako przeniesione odwołania `media://inbound/*`, aby narzędzia obrazów/PDF lub skonfigurowany model obrazu nadal mogły je sprawdzić, zamiast utracić załącznik.
- Jawne polecenie `openclaw infer image describe --file <path> --model <provider/model>` (alias: `openclaw capability image describe`) uruchamia bezpośrednio dostawcę/model obsługujący obrazy, w tym odwołania Ollama, takie jak `ollama/qwen2.5vl:7b`, gdy odpowiedni model obsługujący obrazy jest skonfigurowany w `models.providers.ollama.models[]`.
- Jeśli `<capability>.enabled` nie ma wartości `false`, ale nie skonfigurowano żadnych modeli, OpenClaw próbuje użyć aktywnego modelu odpowiedzi, jeśli jego dostawca obsługuje daną możliwość.

### Automatyczne wykrywanie (domyślne)

Gdy `tools.media.<capability>.enabled` nie ma wartości `false` i nie skonfigurowano żadnych modeli, OpenClaw wypróbowuje kolejno poniższe opcje i zatrzymuje się na pierwszej działającej:

<Steps>
  <Step title="Skonfigurowany model obrazu (tylko obraz)">
    Podstawowe i rezerwowe odwołania `agents.defaults.imageModel`, chyba że aktywny model odpowiedzi już natywnie obsługuje widzenie. Preferowane są odwołania `provider/model`; odwołania bez dostawcy są uzupełniane na podstawie skonfigurowanych wpisów modeli dostawców obsługujących obrazy tylko wtedy, gdy dopasowanie jest jednoznaczne.
  </Step>
  <Step title="Aktywny model odpowiedzi">
    Aktywny model odpowiedzi, jeśli jego dostawca obsługuje daną możliwość.
  </Step>
  <Step title="Uwierzytelnianie dostawcy (tylko dźwięk, przed lokalnymi CLI)">
    Skonfigurowane wpisy `models.providers.*` obsługujące dźwięk są wypróbowywane przed lokalnymi CLI. Kolejność priorytetów dostawców w pakiecie (remisy rozstrzyga alfabetyczna kolejność identyfikatora dostawcy): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="Lokalne CLI (tylko dźwięk)">
    Gotowe lokalne pliki wykonywalne tworzą uporządkowaną listę mechanizmów rezerwowych:
    - `whisper-cli` jako pierwszy tylko wtedy, gdy wcześniejsze wywołanie modelu w bieżącym procesie wykryło Metal lub CUDA
    - domyślny dla CPU `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z plikami `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`)
    - `whisper-cli`, gdy obsługa akceleracji wynika jedynie z możliwości kompilacji lub nie została wykryta
    - `parakeet-mlx` na Apple Silicon (obsługa MLX, użycie urządzenia niewykryte)
    - `whisper` (CLI w Pythonie; domyślnie używa modelu `turbo`, pobieranego automatycznie)

    Sprawdzanie możliwości zaplecza jest buforowane i nie powoduje ładowania modelu. Możliwości kompilacji, żądane flagi zaplecza i zaplecze wykryte podczas rzeczywistego wywołania pozostają rozdzielone. Automatycznie wykryty whisper.cpp pozostawia włączone dzienniki uruchamiania modelu, aby można było zarejestrować wiersz wybranego zaplecza pochodzący z projektu nadrzędnego. Jawne wpisy CLI zachowują skonfigurowaną kolejność, flagi zaplecza i flagi wyjściowe.

  </Step>
  <Step title="Uwierzytelnianie dostawcy (obraz/wideo)">
    Skonfigurowane wpisy `models.providers.*` obsługujące daną możliwość są wypróbowywane przed kolejnością mechanizmów rezerwowych w pakiecie. Dostawcy skonfigurowani tylko dla obrazów, którzy mają model obsługujący obrazy, automatycznie rejestrują się na potrzeby rozumienia multimediów, nawet jeśli nie są Pluginem dostawcy w pakiecie.

    Kolejność priorytetów dostawców w pakiecie (remisy rozstrzyga alfabetyczna kolejność identyfikatora dostawcy):
    - Obraz: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - Wideo: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="CLI Antigravity (tylko obraz/wideo)">
    Pierwszy zainstalowany plik wykonywalny `agy` lub `antigravity` (można zastąpić za pomocą `OPENCLAW_ANTIGRAVITY_CLI`), uruchamiany w piaskownicy ograniczonej do katalogu multimediów.
  </Step>
</Steps>

Aby wyłączyć automatyczne wykrywanie dla danej możliwości:

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
Wykrywanie plików wykonywalnych w systemach macOS/Linux/Windows odbywa się na zasadzie najlepszych starań; upewnij się, że CLI znajduje się w `PATH` (`~` jest rozwijane), albo ustaw jawny wpis modelu CLI z pełną ścieżką polecenia.
</Note>

### Obsługa serwera proxy (wywołania dostawcy dla dźwięku/wideo)

Oparte na dostawcy rozumienie **dźwięku** i **wideo** respektuje standardowe zmienne środowiskowe wychodzącego serwera proxy, w tym reguły pomijania `NO_PROXY`/`no_proxy`: `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`. Zmienne pisane małymi literami mają pierwszeństwo przed zmiennymi pisanymi wielkimi literami. Jeśli żadna nie jest ustawiona, mechanizm rozumienia multimediów korzysta z bezpośredniego połączenia wychodzącego; jeśli wartość serwera proxy jest nieprawidłowa, OpenClaw rejestruje ostrzeżenie i przechodzi na pobieranie bezpośrednie. Rozumienie obrazu nie korzysta z tej ścieżki serwera proxy.

## Możliwości

Ustaw `capabilities` we wpisie `models[]`, aby ograniczyć go do określonych typów multimediów. W przypadku list współdzielonych OpenClaw ustala wartości domyślne dla poszczególnych dostawców w pakiecie:

| Dostawca                                                                 | Możliwości           |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | obraz                 |
| `minimax-portal`                                                         | obraz                 |
| `moonshot`                                                               | obraz + wideo         |
| `openrouter`                                                             | obraz + dźwięk        |
| `google` (Gemini API)                                                    | obraz + dźwięk + wideo |
| `qwen`                                                                   | obraz + wideo         |
| `deepinfra`                                                              | obraz + dźwięk        |
| `mistral`                                                                | dźwięk                |
| `zai`                                                                    | obraz                 |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | dźwięk                |
| Dowolny katalog `models.providers.<id>.models[]` z modelem obsługującym obrazy | obraz                 |

W przypadku wpisów CLI ustaw `capabilities` jawnie, aby uniknąć nieoczekiwanych dopasowań; jeśli to pole zostanie pominięte, wpis kwalifikuje się do każdej listy możliwości, na której występuje.

## Macierz obsługi dostawców

| Możliwość | Dostawcy                                                                                                                                               | Uwagi                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Obraz      | Anthropic, Codex app-server, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, dostawcy konfiguracji | Pluginy dostawców rejestrują obsługę obrazów; `openai/*` może korzystać z trasowania za pomocą klucza API lub Codex OAuth; `codex/*` używa ograniczonej tury Codex app-server; dostawcy konfiguracji obsługujący obrazy są rejestrowani automatycznie. |
| Dźwięk     | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | Transkrypcja dostawcy (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                     |
| Wideo      | Google, Moonshot, Qwen                                                                                                                                  | Rozumienie wideo przez Pluginy dostawców; rozumienie wideo przez Qwen korzysta ze standardowych punktów końcowych DashScope.                                                                        |

<Note>
**Uwaga dotycząca MiniMax**: rozumienie obrazów przez `minimax`, `minimax-cn`, `minimax-portal` i `minimax-portal-cn` zawsze zapewnia należący do Pluginu dostawca multimediów `MiniMax-VL-01`, nawet jeśli starsze metadane czatu MiniMax M2.x deklarują obsługę obrazów wejściowych.
</Note>

## Wskazówki dotyczące wyboru modelu

- Gdy jakość i bezpieczeństwo mają znaczenie, dla każdej możliwości multimedialnej wybieraj najsilniejszy model bieżącej generacji.
- W przypadku agentów z dostępem do narzędzi, które przetwarzają niezaufane dane wejściowe, unikaj starszych lub słabszych modeli multimedialnych.
- Zachowaj co najmniej jeden model rezerwowy dla każdej możliwości, aby zapewnić dostępność (model wysokiej jakości + szybszy/tańszy model).
- Rezerwowe narzędzia CLI (`whisper-cli`, `whisper`, `gemini`) pomagają, gdy API dostawców są niedostępne.
- Znane tryby zapisu do pliku są rozstrzygające: pusty lub brakujący wywnioskowany plik transkrypcji oznacza brak transkrypcji zamiast użycia wyjścia postępu CLI jako rozwiązania rezerwowego.
- `parakeet-mlx`: użyj `--output-format txt` (lub `all`) wraz z `--output-dir` oraz domyślnym szablonem wyjściowym `{filename}`. Obsługiwane są również zmienne środowiskowe projektu nadrzędnego `PARAKEET_OUTPUT_FORMAT` i `PARAKEET_OUTPUT_TEMPLATE`. OpenClaw odczytuje `<output-dir>/<media-basename>.txt`; domyślny format `srt`, inne formaty oraz niestandardowe szablony wyjściowe nadal korzystają ze standardowego wyjścia.

## Zasady dotyczące załączników

Pole `attachments` dla poszczególnych możliwości określa, które załączniki są przetwarzane:

<ParamField path="mode" type='"first" | "all"' default="first">
  Przetwarzaj tylko pierwszy wybrany załącznik albo wszystkie.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Ogranicz liczbę przetwarzanych załączników.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferencja wyboru spośród kandydujących załączników.
</ParamField>

Gdy ustawiono `mode: "all"`, wyniki są oznaczane jako `[Obraz 1/2]`, `[Dźwięk 2/2]` itd.

### Wyodrębnianie zawartości załączonych plików

- Tekst wyodrębniony z pliku jest opakowywany jako niezaufana zawartość zewnętrzna przed dołączeniem do promptu multimedialnego. Stosowane są znaczniki graniczne, takie jak `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, oraz wiersz metadanych `Source: External`.
- Ta ścieżka celowo pomija długi baner `SECURITY NOTICE:`, aby prompt multimedialny pozostał krótki; znaczniki graniczne i metadane nadal mają zastosowanie.
- Plik bez tekstu możliwego do wyodrębnienia otrzymuje oznaczenie `[Brak tekstu możliwego do wyodrębnienia]`.
- Jeśli dla pliku PDF zostanie użyte rezerwowe renderowanie stron jako obrazów, OpenClaw przekazuje te obrazy modelom odpowiedzi obsługującym analizę obrazu i zachowuje symbol zastępczy `[Zawartość PDF wyrenderowana jako obrazy]` w bloku pliku.

## Przykłady konfiguracji

<Tabs>
  <Tab title="Shared models + overrides">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
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
  <Tab title="Image only">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.6-sol" },
              { provider: "anthropic", model: "claude-opus-4-8" },
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

Gdy działa rozumienie multimediów, `/status` zawiera wiersz podsumowania dla każdej możliwości:

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

Aby wstępnie sprawdzić dostępne zasoby, uruchom `openclaw capability audio providers`. Wiersze lokalne pokazują zwycięskie lokalne rozwiązanie rezerwowe oddzielnie od globalnego wyboru dostawcy, gotowości oraz osobnych pól obsługiwanego, żądanego i zaobserwowanego zaplecza. Ten sam wybór lokalny jest dostępny jako informacyjny wynik diagnostyczny:

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## Uwagi

- Rozumienie działa na zasadzie dołożenia wszelkich starań. Błędy nie blokują odpowiedzi.
- Załączniki są nadal przekazywane modelom, nawet gdy rozumienie jest wyłączone.
- Użyj `scope`, aby ograniczyć miejsca, w których działa rozumienie (na przykład tylko do wiadomości prywatnych).

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Obsługa obrazów i multimediów](/pl/nodes/images)
