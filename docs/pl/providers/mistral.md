---
read_when:
    - Chcesz używać modeli Mistral w OpenClaw
    - Chcesz transkrypcji Voxtral w czasie rzeczywistym dla połączenia głosowego
    - Potrzebujesz wdrożenia klucza API Mistral i odwołań do modeli
summary: Korzystanie z modeli Mistral i transkrypcji Voxtral w OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-30T10:14:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw obsługuje Mistral zarówno do routingu modeli tekstu/obrazu (`mistral/...`), jak i
transkrypcji audio przez Voxtral w rozumieniu multimediów.
Mistral może być także używany do osadzeń pamięci (`memorySearch.provider = "mistral"`).

- Dostawca: `mistral`
- Uwierzytelnianie: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
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
  <Step title="Ustaw model domyślny">
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

| Ref modelu                       | Wejście     | Kontekst | Maks. wyjście | Uwagi                                                                  |
| -------------------------------- | ----------- | -------- | ------------- | ---------------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | tekst, obraz | 262,144 | 16,384        | Model domyślny                                                         |
| `mistral/mistral-medium-2508`    | tekst, obraz | 262,144 | 8,192         | Mistral Medium 3.1                                                     |
| `mistral/mistral-small-latest`   | tekst, obraz | 128,000 | 16,384        | Mistral Small 4; regulowane rozumowanie przez API `reasoning_effort`   |
| `mistral/pixtral-large-latest`   | tekst, obraz | 128,000 | 32,768        | Pixtral                                                                |
| `mistral/codestral-latest`       | tekst        | 256,000 | 4,096         | Programowanie                                                          |
| `mistral/devstral-medium-latest` | tekst        | 262,144 | 32,768        | Devstral 2                                                             |
| `mistral/magistral-small`        | tekst        | 128,000 | 40,000        | Z włączonym rozumowaniem                                               |

## Transkrypcja audio (Voxtral)

Użyj Voxtral do wsadowej transkrypcji audio przez potok rozumienia
multimediów.

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

## Strumieniowy STT dla Voice Call

Dołączony Plugin `mistral` rejestruje Voxtral Realtime jako dostawcę
strumieniowego STT dla Voice Call.

| Ustawienie       | Ścieżka konfiguracji                                                  | Domyślnie                               |
| ---------------- | --------------------------------------------------------------------- | --------------------------------------- |
| Klucz API        | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Wraca do `MISTRAL_API_KEY`              |
| Model            | `...mistral.model`                                                    | `voxtral-mini-transcribe-realtime-2602` |
| Kodowanie        | `...mistral.encoding`                                                 | `pcm_mulaw`                             |
| Częstotliwość próbkowania | `...mistral.sampleRate`                                        | `8000`                                  |
| Opóźnienie docelowe | `...mistral.targetStreamingDelayMs`                                 | `800`                                   |

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
OpenClaw domyślnie ustawia Mistral realtime STT na `pcm_mulaw` przy 8 kHz, aby Voice Call
mógł przekazywać ramki multimediów Twilio bezpośrednio. Użyj `encoding: "pcm_s16le"` i
pasującego `sampleRate` tylko wtedy, gdy strumień nadrzędny jest już surowym PCM.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Regulowane rozumowanie (mistral-small-latest)">
    `mistral/mistral-small-latest` mapuje się na Mistral Small 4 i obsługuje [regulowane rozumowanie](https://docs.mistral.ai/capabilities/reasoning/adjustable) w API Chat Completions przez `reasoning_effort` (`none` minimalizuje dodatkowe myślenie w wyjściu; `high` pokazuje pełne ślady myślenia przed końcową odpowiedzią).

    OpenClaw mapuje poziom **thinking** sesji na API Mistral:

    | Poziom thinking w OpenClaw                       | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Inne dołączone modele katalogu Mistral nie używają tego parametru. Nadal używaj modeli `magistral-*`, gdy chcesz natywnego zachowania Mistral nastawionego najpierw na rozumowanie.
    </Note>

  </Accordion>

  <Accordion title="Osadzenia pamięci">
    Mistral może udostępniać osadzenia pamięci przez `/v1/embeddings` (model domyślny: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Uwierzytelnianie i bazowy URL">
    - Uwierzytelnianie Mistral używa `MISTRAL_API_KEY`.
    - Bazowy URL dostawcy domyślnie to `https://api.mistral.ai/v1`.
    - Domyślny model onboardingu to `mistral/mistral-large-latest`.
    - Z.AI używa uwierzytelniania Bearer z Twoim kluczem API.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, refów modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Rozumienie multimediów" href="/pl/nodes/media-understanding" icon="microphone">
    Konfiguracja transkrypcji audio i wybór dostawcy.
  </Card>
</CardGroup>
