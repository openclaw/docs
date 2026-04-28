---
read_when:
    - Chcesz używać modeli Mistral w OpenClaw.
    - Chcesz używać transkrypcji realtime Voxtral dla Voice Call.
    - Potrzebujesz onboardingu klucza API Mistral i odwołań do modeli.
summary: Używanie modeli Mistral i transkrypcji Voxtral z OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-24T09:28:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e1eb462f836f5ddc1afd0d01954080eee461230924368d77e2e57fef12caf1
    source_path: providers/mistral.md
    workflow: 15
---

OpenClaw obsługuje Mistral zarówno do routingu modeli tekstowych/obrazowych (`mistral/...`), jak i
do transkrypcji audio przez Voxtral w media understanding.
Mistral może być także używany do embeddingów pamięci (`memorySearch.provider = "mistral"`).

- Dostawca: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Pierwsze kroki

<Steps>
  <Step title="Pobierz klucz API">
    Utwórz klucz API w [Mistral Console](https://console.mistral.ai/).
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
  <Step title="Zweryfikuj dostępność modelu">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Wbudowany katalog LLM

OpenClaw obecnie dostarcza ten dołączony katalog Mistral:

| Odwołanie do modelu             | Wejście      | Kontekst | Maks. wyjście | Uwagi                                                           |
| ------------------------------- | ------------ | -------- | ------------- | --------------------------------------------------------------- |
| `mistral/mistral-large-latest`  | text, image  | 262,144  | 16,384        | Model domyślny                                                  |
| `mistral/mistral-medium-2508`   | text, image  | 262,144  | 8,192         | Mistral Medium 3.1                                              |
| `mistral/mistral-small-latest`  | text, image  | 128,000  | 16,384        | Mistral Small 4; regulowany reasoning przez API `reasoning_effort` |
| `mistral/pixtral-large-latest`  | text, image  | 128,000  | 32,768        | Pixtral                                                         |
| `mistral/codestral-latest`      | text         | 256,000  | 4,096         | Do kodowania                                                    |
| `mistral/devstral-medium-latest`| text         | 262,144  | 32,768        | Devstral 2                                                      |
| `mistral/magistral-small`       | text         | 128,000  | 40,000        | Z włączonym reasoning                                           |

## Transkrypcja audio (Voxtral)

Użyj Voxtral do batchowej transkrypcji audio przez pipeline media understanding.

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
Ścieżka transkrypcji mediów używa `/v1/audio/transcriptions`. Domyślny model audio dla Mistral to `voxtral-mini-latest`.
</Tip>

## Streaming STT dla Voice Call

Dołączony Plugin `mistral` rejestruje Voxtral Realtime jako dostawcę
streaming STT dla Voice Call.

| Ustawienie     | Ścieżka konfiguracji                                                     | Domyślnie                                |
| -------------- | ------------------------------------------------------------------------ | ---------------------------------------- |
| Klucz API      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey`   | Używa fallbacku do `MISTRAL_API_KEY`     |
| Model          | `...mistral.model`                                                       | `voxtral-mini-transcribe-realtime-2602`  |
| Kodowanie      | `...mistral.encoding`                                                    | `pcm_mulaw`                              |
| Częstotliwość próbkowania | `...mistral.sampleRate`                                         | `8000`                                   |
| Docelowe opóźnienie | `...mistral.targetStreamingDelayMs`                                  | `800`                                    |

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
OpenClaw domyślnie ustawia realtime STT Mistral na `pcm_mulaw` przy 8 kHz, aby Voice Call
mógł bezpośrednio przekazywać ramki mediów Twilio. Używaj `encoding: "pcm_s16le"` i
pasującego `sampleRate` tylko wtedy, gdy upstreamowy strumień jest już surowym PCM.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Regulowany reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` mapuje się na Mistral Small 4 i obsługuje [adjustable reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) w Chat Completions API przez `reasoning_effort` (`none` minimalizuje dodatkowe myślenie w wyjściu; `high` pokazuje pełne ślady myślenia przed ostateczną odpowiedzią).

    OpenClaw mapuje poziom sesyjny **thinking** na API Mistral:

    | Poziom thinking w OpenClaw                       | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Inne modele z dołączonego katalogu Mistral nie używają tego parametru. Nadal używaj modeli `magistral-*`, gdy chcesz natywnego zachowania Mistral typu reasoning-first.
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

  <Accordion title="Auth i base URL">
    - Auth Mistral używa `MISTRAL_API_KEY`.
    - Domyślny `baseUrl` dostawcy to `https://api.mistral.ai/v1`.
    - Domyślny model w onboardingu to `mistral/mistral-large-latest`.
    - z.ai używa auth Bearer z twoim kluczem API.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Media understanding" href="/pl/nodes/media-understanding" icon="microphone">
    Konfiguracja transkrypcji audio i wybór dostawcy.
  </Card>
</CardGroup>
