---
read_when:
    - Chcesz używać modeli Mistral w OpenClaw
    - Chcesz transkrypcję Voxtral w czasie rzeczywistym dla połączenia głosowego
    - Potrzebujesz wdrażania klucza API Mistral i odwołań do modeli
summary: Używanie modeli Mistral i transkrypcji Voxtral z OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-06T09:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw zawiera dołączony Plugin Mistral, który rejestruje cztery kontrakty: uzupełnienia czatu, rozumienie multimediów (wsadowa transkrypcja Voxtral), STT w czasie rzeczywistym dla Voice Call (Voxtral Realtime) oraz embeddingi pamięci (`mistral-embed`).

| Właściwość             | Wartość                                     |
| ---------------------- | ------------------------------------------- |
| Identyfikator dostawcy | `mistral`                                   |
| Plugin                 | dołączony, `enabledByDefault: true`         |
| Zmienna env uwierzytelniania | `MISTRAL_API_KEY`                     |
| Flaga onboardingu      | `--auth-choice mistral-api-key`             |
| Bezpośrednia flaga CLI | `--mistral-api-key <key>`                   |
| API                    | zgodne z OpenAI (`openai-completions`)      |
| Bazowy URL             | `https://api.mistral.ai/v1`                 |
| Domyślny model         | `mistral/mistral-large-latest`              |
| Model embeddingów      | `mistral-embed`                             |
| Wsadowy Voxtral        | `voxtral-mini-latest` (transkrypcja audio)  |
| Voxtral w czasie rzeczywistym | `voxtral-mini-transcribe-realtime-2602` |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj swój klucz API">
    Utwórz klucz API w [konsoli Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Albo przekaż klucz bezpośrednio:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Ustaw domyślny model">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Wbudowany katalog LLM

OpenClaw obecnie dostarcza ten dołączony katalog Mistral:

| Odwołanie do modelu              | Wejście    | Kontekst | Maks. wyjście | Uwagi                                                            |
| -------------------------------- | ---------- | -------- | ------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | tekst, obraz | 262,144 | 16,384        | Domyślny model                                                   |
| `mistral/mistral-medium-2508`    | tekst, obraz | 262,144 | 8,192         | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | tekst, obraz | 128,000 | 16,384        | Mistral Small 4; dostosowywalne rozumowanie przez API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | tekst, obraz | 128,000 | 32,768        | Pixtral                                                          |
| `mistral/codestral-latest`       | tekst      | 256,000  | 4,096         | Kodowanie                                                        |
| `mistral/devstral-medium-latest` | tekst      | 262,144  | 32,768        | Devstral 2                                                       |
| `mistral/magistral-small`        | tekst      | 128,000  | 40,000        | Z włączonym rozumowaniem                                         |

## Transkrypcja audio (Voxtral)

Użyj Voxtral do wsadowej transkrypcji audio przez potok rozumienia multimediów.

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
Ścieżka transkrypcji multimediów używa `/v1/audio/transcriptions`. Domyślny model audio dla Mistral to `voxtral-mini-latest`.
</Tip>

## Strumieniowe STT Voice Call

Dołączony Plugin `mistral` rejestruje Voxtral Realtime jako dostawcę strumieniowego STT dla Voice Call.

| Ustawienie        | Ścieżka konfiguracji                                                | Domyślne                                |
| ----------------- | ------------------------------------------------------------------- | --------------------------------------- |
| Klucz API         | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Wraca do `MISTRAL_API_KEY`              |
| Model             | `...mistral.model`                                                  | `voxtral-mini-transcribe-realtime-2602` |
| Kodowanie         | `...mistral.encoding`                                               | `pcm_mulaw`                             |
| Częstotliwość próbkowania | `...mistral.sampleRate`                                      | `8000`                                  |
| Docelowe opóźnienie | `...mistral.targetStreamingDelayMs`                               | `800`                                   |

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
OpenClaw domyślnie ustawia STT Mistral w czasie rzeczywistym na `pcm_mulaw` przy 8 kHz, aby Voice Call mógł bezpośrednio przekazywać ramki multimediów Twilio. Używaj `encoding: "pcm_s16le"` i zgodnego `sampleRate` tylko wtedy, gdy strumień źródłowy jest już surowym PCM.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Dostosowywalne rozumowanie (mistral-small-latest)">
    `mistral/mistral-small-latest` mapuje się na Mistral Small 4 i obsługuje [dostosowywalne rozumowanie](https://docs.mistral.ai/capabilities/reasoning/adjustable) w API Chat Completions przez `reasoning_effort` (`none` minimalizuje dodatkowe myślenie w wyniku; `high` ujawnia pełne ślady myślenia przed końcową odpowiedzią).

    OpenClaw mapuje poziom **thinking** sesji na API Mistral:

    | Poziom thinking OpenClaw                          | `reasoning_effort` Mistral |
    | ------------------------------------------------- | -------------------------- |
    | **off** / **minimal**                             | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Inne modele z dołączonego katalogu Mistral nie używają tego parametru. Nadal używaj modeli `magistral-*`, gdy chcesz natywnego dla Mistral zachowania z rozumowaniem jako pierwszym etapem.
    </Note>

  </Accordion>

  <Accordion title="Embeddingi pamięci">
    Mistral może obsługiwać embeddingi pamięci przez `/v1/embeddings` (domyślny model: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Uwierzytelnianie i bazowy URL">
    - Uwierzytelnianie Mistral używa `MISTRAL_API_KEY` (nagłówek Bearer).
    - Bazowy URL dostawcy domyślnie to `https://api.mistral.ai/v1` i akceptuje standardowy, zgodny z OpenAI kształt żądania chat-completions.
    - Domyślny model onboardingu to `mistral/mistral-large-latest`.
    - Nadpisuj bazowy URL w `models.providers.mistral.baseUrl` tylko wtedy, gdy Mistral wyraźnie opublikuje potrzebny Ci regionalny punkt końcowy.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Rozumienie multimediów" href="/pl/nodes/media-understanding" icon="microphone">
    Konfiguracja transkrypcji audio i wybór dostawcy.
  </Card>
</CardGroup>
