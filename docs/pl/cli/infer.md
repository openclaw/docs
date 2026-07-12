---
read_when:
    - Dodawanie lub modyfikowanie poleceń `openclaw infer`
    - Projektowanie stabilnej bezinterfejsowej automatyzacji funkcji
summary: CLI z podejściem „najpierw wnioskowanie” do obsługiwanych przez dostawców przepływów pracy z modelami, obrazami, dźwiękiem, TTS, wideo, internetem i osadzeniami
title: CLI wnioskowania
x-i18n:
    generated_at: "2026-07-12T14:59:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` jest kanonicznym bezinterfejsowym punktem dostępu do wnioskowania obsługiwanego przez dostawców. Udostępnia rodziny możliwości (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), a nie surowe nazwy RPC Gateway ani identyfikatory narzędzi agenta. `openclaw capability ...` jest aliasem tego samego drzewa poleceń.

Powody, dla których warto go używać zamiast jednorazowej otoczki dostawcy:

- Ponownie wykorzystuje dostawców i modele już skonfigurowane w OpenClaw.
- Zapewnia stabilną kopertę `--json` dla skryptów i automatyzacji sterowanej przez agenta (zobacz [Dane wyjściowe JSON](#json-output)).
- W przypadku większości podpoleceń uruchamia standardową ścieżkę lokalną bez Gateway.
- W przypadku kompleksowych testów dostawcy sprawdza dostarczany CLI, wczytywanie konfiguracji, rozpoznawanie domyślnego agenta, aktywację dołączonych pluginów oraz współdzielone środowisko wykonawcze możliwości przed wysłaniem żądania do dostawcy.

## Przekształcanie infer w Skills

Skopiuj poniższy tekst i wklej go agentowi:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Dobre Skills oparte na infer przypisują typowe intencje użytkownika do właściwego podpolecenia, zawierają kilka kanonicznych przykładów dla każdego przepływu pracy, preferują `openclaw infer ...` zamiast alternatyw niższego poziomu i nie dokumentują ponownie całego interfejsu infer w swojej treści.

## Drzewo poleceń

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    personas
    status
    enable
    disable
    set-provider
    set-persona

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

`infer list` / `infer inspect --name <capability>` przedstawiają to drzewo jako dane (identyfikator możliwości, transporty, opis).

## Typowe zadania

| Zadanie                         | Polecenie                                                                                     | Uwagi                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Uruchomienie promptu tekstowego/modelu | `openclaw infer model run --prompt "..." --json`                                              | Domyślnie lokalnie                                           |
| Uruchomienie promptu modelu na obrazach | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Powtórz `--file`, aby przekazać wiele obrazów                 |
| Wygenerowanie obrazu            | `openclaw infer image generate --prompt "..." --json`                                         | Użyj `image edit`, gdy zaczynasz od istniejącego pliku        |
| Opisanie pliku obrazu lub adresu URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` musi być modelem `<provider/model>` obsługującym obrazy |
| Transkrypcja dźwięku            | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` musi mieć postać `<provider/model>`                 |
| Synteza mowy                    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` działa tylko za pośrednictwem Gateway            |
| Wygenerowanie filmu             | `openclaw infer video generate --prompt "..." --json`                                         | Obsługuje wskazówki dla dostawcy, takie jak `--resolution`    |
| Opisanie pliku filmu            | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` musi mieć postać `<provider/model>`                 |
| Przeszukanie internetu          | `openclaw infer web search --query "..." --json`                                              |                                                              |
| Pobranie strony internetowej    | `openclaw infer web fetch --url https://example.com --json`                                   |                                                              |
| Utworzenie osadzeń              | `openclaw infer embedding create --text "..." --json`                                         |                                                              |

## Działanie

- Używaj `--json`, gdy dane wyjściowe są przekazywane do innego polecenia lub skryptu; w przeciwnym razie używaj danych tekstowych.
- Użyj `--provider` lub `--model provider/model`, aby wskazać konkretny backend.
- Użyj `model run --thinking <level>`, aby jednorazowo nadpisać poziom myślenia/rozumowania: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` lub `max`.
- W przypadku `image describe`, `audio transcribe` i `video describe` opcja `--model` musi mieć postać `<provider/model>`.
- W przypadku `image describe` opcja `--file` przyjmuje ścieżki lokalne i adresy URL HTTP(S); zdalne adresy URL podlegają standardowej polityce SSRF pobierania multimediów.
- Bezstanowe polecenia wykonawcze (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) są domyślnie lokalne. Polecenia stanu zarządzanego przez Gateway (`tts status`) domyślnie używają Gateway.
- Ścieżka lokalna nigdy nie wymaga uruchomionego Gateway.
- Lokalne `model run` to uproszczone, jednorazowe wywołanie uzupełniania przez dostawcę: rozpoznaje skonfigurowany model agenta i uwierzytelnianie, ale nie rozpoczyna tury agenta czatu, nie ładuje narzędzi ani nie otwiera dołączonych serwerów MCP.
- `model run --file` dołącza pliki obrazów (z automatycznie wykrywanym typem MIME) do promptu; powtórz `--file`, aby przekazać wiele obrazów. Pliki niebędące obrazami są odrzucane — zamiast tego użyj `infer audio transcribe` lub `infer video describe`.
- `model run --gateway` sprawdza trasowanie Gateway, zapisane dane uwierzytelniające, wybór dostawcy i osadzone środowisko wykonawcze, ale pozostaje surowym testem modelu: bez wcześniejszej transkrypcji sesji, kontekstu startowego/AGENTS, narzędzi ani dołączonych serwerów MCP.
- `model run --gateway --model <provider/model>` wymaga poświadczenia Gateway zaufanego operatora, ponieważ polecenie żąda od Gateway jednorazowego nadpisania dostawcy/modelu.

## Model

Wnioskowanie tekstowe oraz inspekcja modeli/dostawców.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Używaj pełnych odwołań `<provider/model>` z opcją `--local`, aby wykonać test dymny jednego dostawcy bez uruchamiania Gateway ani ładowania zestawu narzędzi agenta:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Uwagi:

- Lokalne `model run` jest najbardziej ukierunkowanym testem dymnym CLI dotyczącym kondycji dostawcy/modelu/uwierzytelniania: w przypadku dostawców innych niż ChatGPT-Codex wysyła wyłącznie podany prompt.
- Lokalne `model run --model <provider/model>` może rozpoznać dokładne wiersze dołączonego katalogu statycznego (te same, które pokazuje `openclaw models list --all`), zanim dany dostawca zostanie zapisany w konfiguracji. Uwierzytelnienie dostawcy jest nadal wymagane; brakujące dane uwierzytelniające powodują błędy uwierzytelniania, a nie `Unknown model`.
- W przypadku testów rozumowania Mistral Medium 3.5 pozostaw temperaturę nieustawioną/domyślną. Mistral odrzuca `reasoning_effort="high"` z `temperature: 0`; użyj domyślnej temperatury lub wartości niezerowej, takiej jak `0.7`.
- Lokalne testy OAuth OpenAI ChatGPT/Codex (API `openai-chatgpt-responses`) dodają minimalną instrukcję systemową, aby transport mógł wypełnić wymagane pole `instructions` — bez pełnego kontekstu agenta, narzędzi, pamięci ani transkrypcji sesji.
- `model run --file` dołącza zawartość obrazu bezpośrednio do pojedynczej wiadomości użytkownika. Typowe formaty (PNG, JPEG, WebP) działają, gdy typ MIME zostanie wykryty jako `image/*`; nieobsługiwane lub nierozpoznane pliki powodują błąd przed wywołaniem dostawcy. Użyj zamiast tego `infer image describe`, jeśli zamiast bezpośredniego testu modelu multimodalnego chcesz użyć trasowania modeli obrazowych i mechanizmów awaryjnych OpenClaw.
- Wybrany model musi obsługiwać dane wejściowe w postaci obrazów; modele wyłącznie tekstowe mogą odrzucić żądanie po stronie dostawcy.
- `model run --prompt` musi zawierać tekst składający się nie tylko z białych znaków; puste prompty są odrzucane przed wywołaniem dostawcy lub Gateway.
- Lokalne `model run` kończy działanie kodem różnym od zera, gdy dostawca nie zwróci tekstu, dzięki czemu nieosiągalni dostawcy i puste uzupełnienia nie wyglądają jak udane testy.
- Użyj `model run --gateway`, aby przetestować trasowanie Gateway lub konfigurację środowiska wykonawczego agenta przy zachowaniu surowych danych wejściowych modelu. Użyj `openclaw agent` lub interfejsu czatu, aby uzyskać pełny kontekst agenta, narzędzia, pamięć i transkrypcję sesji.
- `--thinking adaptive` jest mapowane na poziom środowiska wykonawczego uzupełniania `medium`; `--thinking max` jest mapowane na `max` dla modeli OpenAI obsługujących natywny maksymalny nakład rozumowania, a w pozostałych przypadkach na `xhigh`.
- `model auth login`, `model auth logout` i `model auth status` zarządzają zapisanym stanem uwierzytelniania dostawcy.

## Obraz

Generowanie, edycja i opis.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Uwagi:

- Użyj `image edit`, gdy zaczynasz od istniejących plików wejściowych; `--size`, `--aspect-ratio` lub `--resolution` dodają wskazówki dotyczące geometrii w przypadku dostawców/modeli, które je obsługują.
- `--output-format png --background transparent` z `--model openai/gpt-image-1.5` generuje za pomocą OpenAI plik PNG z przezroczystym tłem; `--openai-background` jest specyficznym dla OpenAI aliasem tej samej wskazówki. Dostawcy, którzy nie deklarują obsługi tła, zgłaszają ją jako zignorowane nadpisanie (zobacz `ignoredOverrides` w [obiekcie JSON](#json-output)).
- `--quality low|medium|high|auto` działa z dostawcami obsługującymi wskazówki dotyczące jakości obrazu, w tym z OpenAI. OpenAI akceptuje również `--openai-moderation low|auto`.
- `image providers --json` wyświetla, którzy dołączani dostawcy obrazów są wykrywalni, skonfigurowani i wybrani oraz jakie możliwości generowania/edycji udostępnia każdy z nich.
- `image generate --model <provider/model> --json` jest najbardziej ukierunkowanym testem dymnym na żywo dla zmian w generowaniu obrazów:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Odpowiedź zawiera `ok`, `provider`, `model`, `attempts` oraz ścieżki zapisanych plików wyjściowych. Gdy ustawiono `--output`, końcowe rozszerzenie może odpowiadać typowi MIME zwróconemu przez dostawcę.

- W przypadku `image describe` i `image describe-many` użyj `--prompt`, aby przekazać instrukcję dotyczącą konkretnego zadania (OCR, porównanie, inspekcja interfejsu, zwięzły opis).
- Użyj `--timeout-ms` w przypadku wolnych lokalnych modeli wizyjnych lub zimnego uruchamiania Ollama.
- W przypadku `image describe` jawnie określony `--model` (musi to być obsługujący obrazy `<provider/model>`) jest uruchamiany jako pierwszy, a następnie, jeśli to wywołanie się nie powiedzie, podejmowane są próby użycia skonfigurowanych `agents.defaults.imageModel.fallbacks`. Błędy przygotowania danych wejściowych (brak pliku, nieobsługiwany adres URL) powodują niepowodzenie przed jakąkolwiek próbą użycia modelu zapasowego, a model musi obsługiwać obrazy w katalogu modeli lub konfiguracji dostawcy.
- W przypadku lokalnych modeli wizyjnych Ollama najpierw pobierz model i ustaw `OLLAMA_API_KEY` na dowolną wartość zastępczą, na przykład `ollama-local`. Zobacz [Ollama](/pl/providers/ollama#vision-and-image-description).

## Dźwięk

Transkrypcja plików (bez zarządzania sesjami w czasie rzeczywistym).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` musi mieć postać `<provider/model>`.

## TTS

Synteza mowy oraz stan dostawcy/persony TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Uwagi:

- `tts status` obsługuje tylko `--gateway` (odzwierciedla stan TTS zarządzany przez Gateway).
- Użyj `tts providers`, `tts voices`, `tts personas`, `tts set-provider` i `tts set-persona`, aby sprawdzać i konfigurować działanie TTS.

## Wideo

Generowanie i opisywanie.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Uwagi:

- `video generate` przyjmuje `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` i `--timeout-ms`, które są przekazywane do środowiska wykonawczego generowania wideo.
- W przypadku `video describe` parametr `--model` musi mieć postać `<provider/model>`.

## Sieć

Wyszukiwanie i pobieranie.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` wyświetla dostępnych, skonfigurowanych i wybranych dostawców wyszukiwania i pobierania.

## Osadzanie

Tworzenie wektorów i sprawdzanie dostawców osadzania.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Dane wyjściowe JSON

Polecenia Infer normalizują dane wyjściowe JSON we wspólnym obiekcie:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Stabilne pola najwyższego poziomu:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (załączniki graficzne wysłane wraz z żądaniem, gdy ma to zastosowanie)
- `outputs`
- `ignoredOverrides` (klucze wskazówek nieobsługiwanych przez dostawcę, gdy ma to zastosowanie)
- `error`

W przypadku poleceń generujących multimedia `outputs` zawiera pliki zapisane przez OpenClaw. Do automatyzacji używaj wartości `path`, `mimeType`, `size` oraz wymiarów właściwych dla danego rodzaju multimediów z tej tablicy, zamiast analizować czytelne dla człowieka standardowe dane wyjściowe.

## Częste pułapki

```bash
# Źle
openclaw infer media image generate --prompt "friendly lobster"

# Dobrze
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Źle
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Dobrze
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Modele](/pl/concepts/models)
