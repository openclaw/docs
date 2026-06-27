---
read_when:
    - Dodawanie lub modyfikowanie poleceń `openclaw infer`
    - Projektowanie stabilnej automatyzacji możliwości bez interfejsu graficznego
summary: CLI infer-first dla przepływów pracy modeli, obrazów, audio, TTS, wideo, sieci i embeddingów obsługiwanych przez dostawców
title: CLI wnioskowania
x-i18n:
    generated_at: "2026-06-27T17:20:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93ebb2a830bfbe6aad58cfa7aa2252cf016a6c9cb99b7592406593627e41fdd1
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` jest kanonicznym bezinterfejsowym interfejsem dla przepływów pracy inferencji opartych na dostawcach.

Celowo eksponuje rodziny możliwości, a nie surowe nazwy RPC Gateway ani surowe identyfikatory narzędzi agenta.

## Zamień infer w skill

Skopiuj i wklej to do agenta:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Dobry skill oparty na infer powinien:

- mapować typowe intencje użytkownika na właściwe podpolecenie infer
- zawierać kilka kanonicznych przykładów infer dla obsługiwanych przepływów pracy
- preferować `openclaw infer ...` w przykładach i sugestiach
- unikać ponownego dokumentowania całej powierzchni infer w treści skilla

Typowy zakres skilla skupionego na infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Dlaczego używać infer

`openclaw infer` zapewnia jedno spójne CLI dla zadań inferencji opartych na dostawcach w OpenClaw.

Korzyści:

- Używaj dostawców i modeli już skonfigurowanych w OpenClaw zamiast tworzyć jednorazowe wrappery dla każdego backendu.
- Utrzymuj przepływy pracy dla modeli, obrazów, transkrypcji audio, TTS, wideo, sieci Web i osadzeń w jednym drzewie poleceń.
- Używaj stabilnego kształtu wyjścia `--json` dla skryptów, automatyzacji i przepływów pracy sterowanych przez agentów.
- Preferuj natywną powierzchnię OpenClaw, gdy zadanie zasadniczo oznacza „uruchom inferencję”.
- Używaj normalnej ścieżki lokalnej bez wymagania Gateway dla większości poleceń infer.

W przypadku kompleksowych kontroli dostawcy preferuj `openclaw infer ...`, gdy testy dostawcy niższego poziomu są zielone. Sprawdza ono dostarczane CLI, ładowanie konfiguracji, rozwiązywanie domyślnego agenta, aktywację dołączonego Pluginu oraz współdzielone środowisko uruchomieniowe możliwości przed wykonaniem żądania do dostawcy.

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
    status
    enable
    disable
    set-provider

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

## Typowe zadania

Ta tabela mapuje typowe zadania inferencji na odpowiadające im polecenia infer.

| Zadanie                       | Polecenie                                                                                     | Uwagi                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Uruchom prompt tekstu/modelu  | `openclaw infer model run --prompt "..." --json`                                              | Domyślnie używa normalnej ścieżki lokalnej            |
| Uruchom prompt modelu na obrazach | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Powtórz `--file` dla wielu wejść obrazów              |
| Wygeneruj obraz               | `openclaw infer image generate --prompt "..." --json`                                         | Użyj `image edit`, gdy zaczynasz od istniejącego pliku |
| Opisz plik obrazu lub URL     | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` musi być modelem obsługującym obrazy w formie `<provider/model>` |
| Transkrybuj audio             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` musi mieć formę `<provider/model>`          |
| Zsyntetyzuj mowę              | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` jest zorientowane na Gateway             |
| Wygeneruj wideo               | `openclaw infer video generate --prompt "..." --json`                                         | Obsługuje wskazówki dostawcy, takie jak `--resolution` |
| Opisz plik wideo              | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` musi mieć formę `<provider/model>`          |
| Przeszukaj sieć Web           | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Pobierz stronę WWW            | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Utwórz osadzenia              | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Zachowanie

- `openclaw infer ...` jest podstawową powierzchnią CLI dla tych przepływów pracy.
- Używaj `--json`, gdy wyjście będzie używane przez inne polecenie lub skrypt.
- Używaj `--provider` albo `--model provider/model`, gdy wymagany jest konkretny backend.
- Używaj `model run --thinking <level>`, aby przekazać jednorazowy poziom thinking/reasoning (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` albo `max`) przy zachowaniu surowego uruchomienia.
- Dla `image describe`, `audio transcribe` i `video describe` opcja `--model` musi używać formy `<provider/model>`.
- Dla `image describe` opcja `--file` akceptuje ścieżki lokalne i adresy URL obrazów HTTP(S). Zdalne adresy URL używają normalnej polityki SSRF pobierania multimediów.
- Dla `image describe` jawne `--model` uruchamia bezpośrednio tego dostawcę/model. Model musi obsługiwać obrazy w katalogu modeli lub konfiguracji dostawcy. `codex/<model>` uruchamia ograniczoną turę rozumienia obrazu przez serwer aplikacji Codex; `openai/<model>` używa ścieżki dostawcy OpenAI z uwierzytelnianiem przez klucz API albo OAuth ChatGPT/Codex.
- Bezstanowe polecenia wykonawcze domyślnie działają lokalnie.
- Polecenia stanu zarządzanego przez Gateway domyślnie używają Gateway.
- Normalna ścieżka lokalna nie wymaga działającego Gateway.
- Lokalne `model run` jest lekkim, jednorazowym uzupełnieniem dostawcy. Rozwiązuje skonfigurowany model agenta i uwierzytelnianie, ale nie uruchamia tury agenta czatu, nie ładuje narzędzi ani nie otwiera dołączonych serwerów MCP.
- `model run --file` akceptuje pliki obrazów, wykrywa ich typ MIME i wysyła je wraz z podanym promptem do wybranego modelu. Powtórz `--file` dla wielu obrazów.
- `model run --file` odrzuca wejścia inne niż obrazy. Użyj `infer audio transcribe` dla plików audio i `infer video describe` dla plików wideo.
- `model run --gateway` sprawdza routing Gateway, zapisane uwierzytelnianie, wybór dostawcy i osadzone środowisko uruchomieniowe, ale nadal działa jako surowa próba modelu: wysyła podany prompt i wszelkie załączniki obrazów bez wcześniejszego transkryptu sesji, kontekstu bootstrap/AGENTS, składania przez silnik kontekstu, narzędzi ani dołączonych serwerów MCP.
- `model run --gateway --model <provider/model>` wymaga zaufanych danych uwierzytelniających operatora Gateway, ponieważ żądanie prosi Gateway o uruchomienie jednorazowego nadpisania dostawcy/modelu.
- Lokalne `model run --thinking` używa lekkiej ścieżki uzupełniania dostawcy; poziomy specyficzne dla dostawcy, takie jak `adaptive` i `max`, są mapowane na najbliższy przenośny poziom prostego uzupełniania.

## Model

Używaj `model` do inferencji tekstu opartej na dostawcach oraz inspekcji modeli/dostawców.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Używaj pełnych referencji `<provider/model>`, aby wykonać test dymny konkretnego dostawcy bez uruchamiania Gateway ani ładowania pełnej powierzchni narzędzi agenta:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Uwagi:

- Lokalne `model run` jest najwęższym testem dymnym CLI dla kondycji dostawcy/modelu/uwierzytelniania, ponieważ dla dostawców innych niż Codex wysyła tylko podany prompt do wybranego modelu.
- Lokalne `model run --model <provider/model>` może używać dokładnych dołączonych statycznych wierszy katalogu z `models list --all`, zanim ten dostawca zostanie zapisany w konfiguracji. Uwierzytelnianie dostawcy nadal jest wymagane; brakujące dane uwierzytelniające kończą się błędami uwierzytelniania, a nie `Unknown model`.
- Dla prób reasoning Mistral Medium 3.5 pozostaw temperaturę nieustawioną/domyślną. Mistral odrzuca `reasoning_effort="high"` razem z `temperature: 0`; użyj `mistral/mistral-medium-3-5` z domyślną temperaturą albo niezerową wartością trybu reasoning, taką jak `0.7`.
- Lokalne próby Codex Responses są wąskim wyjątkiem: OpenClaw dodaje minimalną instrukcję systemową, aby transport mógł wypełnić wymagane pole `instructions`, bez dodawania pełnego kontekstu agenta, narzędzi, pamięci ani transkryptu sesji.
- Lokalne `model run --file` zachowuje tę lekką ścieżkę i dołącza treść obrazu bezpośrednio do pojedynczej wiadomości użytkownika. Typowe pliki obrazów, takie jak PNG, JPEG i WebP, działają, gdy ich typ MIME zostanie wykryty jako `image/*`; nieobsługiwane lub nierozpoznane pliki kończą się niepowodzeniem przed wywołaniem dostawcy.
- `model run --file` jest najlepsze, gdy chcesz bezpośrednio przetestować wybrany multimodalny model tekstowy. Użyj `infer image describe`, gdy chcesz skorzystać z wyboru dostawcy rozumienia obrazu w OpenClaw i domyślnego routingu modelu obrazowego.
- Wybrany model musi obsługiwać wejście obrazu; modele tekstowe mogą odrzucić żądanie na warstwie dostawcy.
- `model run --prompt` musi zawierać tekst inny niż białe znaki; puste prompty są odrzucane przed wywołaniem lokalnych dostawców lub Gateway.
- Lokalne `model run` kończy się z niezerowym kodem, gdy dostawca nie zwróci żadnego tekstu, więc niedostępni lokalni dostawcy i puste uzupełnienia nie wyglądają jak udane próby.
- Użyj `model run --gateway`, gdy musisz przetestować routing Gateway, konfigurację środowiska uruchomieniowego agenta albo stan dostawcy zarządzany przez Gateway przy zachowaniu surowego wejścia modelu. Użyj `openclaw agent` albo powierzchni czatu, gdy chcesz pełnego kontekstu agenta, narzędzi, pamięci i transkryptu sesji.
- `model auth login`, `model auth logout` i `model auth status` zarządzają zapisanym stanem uwierzytelniania dostawcy.

## Obraz

Używaj `image` do generowania, edycji i opisu.

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

- Użyj `image edit`, gdy zaczynasz od istniejących plików wejściowych.
- Użyj `--size`, `--aspect-ratio` lub `--resolution` z `image edit` dla
  dostawców/modeli, które obsługują wskazówki dotyczące geometrii przy edycjach obrazów referencyjnych.
- Użyj `--output-format png --background transparent` z
  `--model openai/gpt-image-1.5` dla wyjścia OpenAI PNG z przezroczystym tłem;
  `--openai-background` pozostaje dostępne jako alias specyficzny dla OpenAI. Dostawcy,
  którzy nie deklarują obsługi tła, zgłaszają tę wskazówkę jako zignorowane nadpisanie.
- Użyj `--quality low|medium|high|auto` dla dostawców, którzy obsługują wskazówki
  dotyczące jakości obrazu, w tym OpenAI. OpenAI akceptuje także `--openai-moderation low|auto` dla
  wskazówki moderacji specyficznej dla dostawcy.
- Użyj `image providers --json`, aby sprawdzić, którzy wbudowani dostawcy obrazów są
  wykrywalni, skonfigurowani, wybrani oraz jakie możliwości generowania/edycji
  udostępnia każdy dostawca.
- Użyj `image generate --model <provider/model> --json` jako najwęższego testu smoke live
  CLI dla zmian w generowaniu obrazów. Przykład:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Odpowiedź JSON raportuje `ok`, `provider`, `model`, `attempts` oraz zapisane
  ścieżki wyjściowe. Gdy ustawiono `--output`, końcowe rozszerzenie może odpowiadać
  typowi MIME zwróconemu przez dostawcę.

- Dla `image describe` i `image describe-many` użyj `--prompt`, aby przekazać modelowi wizyjnemu instrukcję właściwą dla zadania, taką jak OCR, porównanie, inspekcja UI lub zwięzły podpis.
- Użyj `--timeout-ms` z wolnymi lokalnymi modelami wizyjnymi lub zimnym startem Ollama.
- Dla `image describe` `--model` musi być obsługującym obrazy `<provider/model>`.
- Dla lokalnych modeli wizyjnych Ollama najpierw pobierz model i ustaw `OLLAMA_API_KEY` na dowolną wartość zastępczą, na przykład `ollama-local`. Zobacz [Ollama](/pl/providers/ollama#vision-and-image-description).

## Audio

Użyj `audio` do transkrypcji plików.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Uwagi:

- `audio transcribe` służy do transkrypcji plików, a nie do zarządzania sesją w czasie rzeczywistym.
- `--model` musi mieć postać `<provider/model>`.

## TTS

Użyj `tts` do syntezy mowy i stanu dostawcy TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Uwagi:

- `tts status` domyślnie używa Gateway, ponieważ odzwierciedla stan TTS zarządzany przez Gateway.
- Użyj `tts providers`, `tts voices` i `tts set-provider`, aby sprawdzić i skonfigurować zachowanie TTS.

## Wideo

Użyj `video` do generowania i opisu.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Uwagi:

- `video generate` akceptuje `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` i `--timeout-ms` oraz przekazuje je do środowiska wykonawczego generowania wideo.
- `--model` musi mieć postać `<provider/model>` dla `video describe`.

## Web

Użyj `web` do przepływów wyszukiwania i pobierania.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Uwagi:

- Użyj `web providers`, aby sprawdzić dostępnych, skonfigurowanych i wybranych dostawców.

## Embedding

Użyj `embedding` do tworzenia wektorów i inspekcji dostawcy embeddingów.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Wyjście JSON

Polecenia Infer normalizują wyjście JSON w ramach wspólnej koperty:

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

Pola najwyższego poziomu są stabilne:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Dla poleceń generowania multimediów `outputs` zawiera pliki zapisane przez OpenClaw. Używaj
`path`, `mimeType`, `size` oraz wszelkich wymiarów specyficznych dla mediów w tej tablicy
do automatyzacji zamiast parsowania czytelnego dla człowieka stdout.

## Typowe pułapki

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Uwagi

- `openclaw capability ...` jest aliasem dla `openclaw infer ...`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Modele](/pl/concepts/models)
