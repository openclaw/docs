---
read_when:
    - Chcesz używać modeli Mistral w OpenClaw
    - Chcesz transkrypcji w czasie rzeczywistym Voxtral dla połączenia głosowego
    - Potrzebujesz wdrożenia klucza API Mistral i odwołań do modeli
summary: Korzystaj z modeli Mistral i transkrypcji Voxtral w OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-12T15:33:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

Dołączony Plugin `mistral` rejestruje cztery kontrakty: uzupełnianie czatu, rozpoznawanie multimediów (transkrypcja wsadowa Voxtral), STT w czasie rzeczywistym dla połączeń głosowych (Voxtral Realtime) oraz osadzanie pamięci (`mistral-embed`).

| Właściwość            | Wartość                                          |
| --------------------- | ------------------------------------------------ |
| Identyfikator dostawcy | `mistral`                                       |
| Plugin                | dołączony, domyślnie włączony                    |
| Zmienna środowiskowa uwierzytelniania | `MISTRAL_API_KEY`                 |
| Flaga wdrażania       | `--auth-choice mistral-api-key`                  |
| Bezpośrednia flaga CLI | `--mistral-api-key <key>`                       |
| API                   | zgodne z OpenAI (`openai-completions`)           |
| Bazowy adres URL      | `https://api.mistral.ai/v1`                      |
| Model domyślny        | `mistral/mistral-large-latest`                   |
| Model osadzania       | `mistral-embed`                                  |
| Voxtral wsadowy       | `voxtral-mini-latest` (transkrypcja dźwięku)     |
| Voxtral w czasie rzeczywistym | `voxtral-mini-transcribe-realtime-2602`  |

## Pierwsze kroki

<Steps>
  <Step title="Get your API key">
    Utwórz klucz API w [konsoli Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Możesz też przekazać klucz bezpośrednio:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Set a default model">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Wbudowany katalog modeli LLM

| Odwołanie do modelu              | Dane wejściowe | Kontekst | Maks. wynik | Uwagi                                                   |
| -------------------------------- | -------------- | -------- | ----------- | ------------------------------------------------------- |
| `mistral/mistral-large-latest`   | tekst, obraz   | 262,144  | 16,384      | Model domyślny                                          |
| `mistral/mistral-medium-2508`    | tekst, obraz   | 262,144  | 8,192       | Mistral Medium 3.1                                      |
| `mistral/mistral-medium-3-5`     | tekst, obraz   | 262,144  | 8,192       | Mistral Medium 3.5; regulowane rozumowanie              |
| `mistral/mistral-small-latest`   | tekst, obraz   | 262,144  | 16,384      | najnowszy Mistral Small 4; regulowane `reasoning_effort` |
| `mistral/mistral-small-2603`     | tekst, obraz   | 262,144  | 16,384      | przypięty Mistral Small 4; regulowane `reasoning_effort` |
| `mistral/pixtral-large-latest`   | tekst, obraz   | 128,000  | 32,768      | Pixtral                                                 |
| `mistral/codestral-latest`       | tekst          | 256,000  | 4,096       | Programowanie                                           |
| `mistral/devstral-medium-latest` | tekst          | 262,144  | 32,768      | Devstral 2                                              |
| `mistral/magistral-small`        | tekst          | 128,000  | 40,000      | Z obsługą rozumowania                                   |

Przed zmianą konfiguracji przejrzyj odpowiedni wiersz dołączonego katalogu:

```bash
openclaw models list --all --provider mistral --plain
```

Wykonaj test dymny modelu bez uruchamiania Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## Transkrypcja dźwięku (Voxtral)

Użyj Voxtral do wsadowej transkrypcji dźwięku za pośrednictwem potoku rozpoznawania multimediów:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Ścieżka transkrypcji multimediów używa `/v1/audio/transcriptions`. Domyślnym modelem dźwięku Mistral jest `voxtral-mini-latest`.
</Tip>

## Strumieniowe STT dla połączeń głosowych

Dołączony Plugin `mistral` rejestruje Voxtral Realtime jako dostawcę strumieniowego STT dla połączeń głosowych.

| Ustawienie        | Ścieżka konfiguracji                                                   | Wartość domyślna                        |
| ----------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| Klucz API         | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Używa zastępczo `MISTRAL_API_KEY`       |
| Model             | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Kodowanie         | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Częstotliwość próbkowania | `...mistral.sampleRate`                                         | `8000`                                  |
| Docelowe opóźnienie | `...mistral.targetStreamingDelayMs`                                  | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw domyślnie ustawia kodowanie STT Mistral w czasie rzeczywistym na `pcm_mulaw` przy 8 kHz, aby połączenia głosowe mogły bezpośrednio przekazywać ramki multimedialne Twilio. Użyj `encoding: "pcm_s16le"` i odpowiedniej wartości `sampleRate` tylko wtedy, gdy strumień źródłowy jest już surowym strumieniem PCM.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Adjustable reasoning">
    Modele `mistral/mistral-small-latest`, `mistral/mistral-small-2603` i `mistral/mistral-medium-3-5` obsługują [regulowane rozumowanie](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) w API Chat Completions za pomocą parametru `reasoning_effort` (`none` ogranicza dodatkowe rozumowanie w wyniku; `high` ujawnia pełny przebieg rozumowania przed odpowiedzią końcową).

    OpenClaw odwzorowuje poziom **rozumowania** sesji na API Mistral:

    | Poziom rozumowania OpenClaw                                         | `reasoning_effort` Mistral |
    | ------------------------------------------------------------------- | -------------------------- |
    | **off** / **minimal**                                               | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`                     |

    <Warning>
    Unikaj łączenia trybu rozumowania Medium 3.5 z `temperature: 0`; według zgłoszeń API HTTP Mistral odrzuca połączenie `reasoning_effort="high"` i `temperature: 0` odpowiedzią 400. Nie ustawiaj temperatury albo wyłącz rozumowanie bądź ustaw je na poziom minimalny, aby OpenClaw wysyłał `reasoning_effort: "none"` przed ustawieniem niskiej temperatury.
    </Warning>

    Przykładowa konfiguracja rozumowania dla modelu Medium 3.5:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    Pozostałe modele z dołączonego katalogu Mistral nie używają tego parametru. Jeśli zależy Ci na natywnym zachowaniu Mistral stawiającym rozumowanie na pierwszym miejscu, nadal używaj modeli `magistral-*`.
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
    Mistral może udostępniać osadzanie pamięci za pośrednictwem `/v1/embeddings` (model domyślny: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Auth and base URL">
    - Uwierzytelnianie Mistral używa `MISTRAL_API_KEY` (nagłówek Bearer).
    - Bazowy adres URL dostawcy ma domyślną wartość `https://api.mistral.ai/v1` i przyjmuje standardowy format żądania uzupełniania czatu zgodny z OpenAI.
    - Domyślnym modelem podczas wdrażania jest `mistral/mistral-large-latest`.
    - Zastępuj bazowy adres URL w `models.providers.mistral.baseUrl` tylko wtedy, gdy Mistral wyraźnie opublikuje potrzebny Ci regionalny punkt końcowy.

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania awaryjnego.
  </Card>
  <Card title="Media understanding" href="/pl/nodes/media-understanding" icon="microphone">
    Konfiguracja transkrypcji dźwięku i wybór dostawcy.
  </Card>
</CardGroup>
