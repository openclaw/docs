---
read_when:
    - Chcesz używać modeli Mistral w OpenClaw
    - Chcesz transkrypcji Voxtral w czasie rzeczywistym dla połączenia głosowego
    - Potrzebujesz wdrożenia klucza API Mistral i odwołań do modeli
summary: Używaj modeli Mistral i transkrypcji Voxtral z OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-10T19:52:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c4caa86d4a3eb873d8b6a1cc639edbad3dd7478f401e2ca53f704de095f829
    source_path: providers/mistral.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw zawiera dołączony Plugin Mistral, który rejestruje cztery kontrakty: uzupełnianie czatu, rozumienie multimediów (transkrypcja wsadowa Voxtral), STT czasu rzeczywistego dla Voice Call (Voxtral Realtime) oraz embeddingi pamięci (`mistral-embed`).

| Właściwość       | Wartość                                     |
| ---------------- | ------------------------------------------- |
| Identyfikator providera | `mistral`                            |
| Plugin           | dołączony, `enabledByDefault: true`         |
| Zmienna env uwierzytelniania | `MISTRAL_API_KEY`              |
| Flaga onboardingu | `--auth-choice mistral-api-key`            |
| Bezpośrednia flaga CLI | `--mistral-api-key <key>`              |
| API              | zgodne z OpenAI (`openai-completions`)      |
| Bazowy URL       | `https://api.mistral.ai/v1`                 |
| Domyślny model   | `mistral/mistral-large-latest`              |
| Model embeddingów | `mistral-embed`                            |
| Wsadowy Voxtral  | `voxtral-mini-latest` (transkrypcja audio)  |
| Voxtral realtime | `voxtral-mini-transcribe-realtime-2602`     |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
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

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04)
to bieżący, mieszany model Medium w dołączonym katalogu: 128B gęstych wag,
wejście tekstowe i obrazowe, kontekst 256K, wywoływanie funkcji, dane wyjściowe strukturalne, programowanie
oraz regulowane rozumowanie przez Chat Completions API. Użyj
`mistral/mistral-medium-3-5`, gdy chcesz użyć nowszego zunifikowanego
modelu agentowego/programistycznego Mistral zamiast domyślnego `mistral/mistral-large-latest`.

OpenClaw obecnie dostarcza ten dołączony katalog Mistral:

| Ref modelu                        | Wejście       | Kontekst | Maks. wyjście | Uwagi                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | tekst, obraz | 262,144 | 16,384     | Domyślny model                                                   |
| `mistral/mistral-medium-2508`    | tekst, obraz | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-medium-3-5`     | tekst, obraz | 262,144 | 8,192      | Mistral Medium 3.5; regulowane rozumowanie                       |
| `mistral/mistral-small-latest`   | tekst, obraz | 128,000 | 16,384     | Mistral Small 4; regulowane rozumowanie przez API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | tekst, obraz | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | tekst        | 256,000 | 4,096      | Programowanie                                                    |
| `mistral/devstral-medium-latest` | tekst        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | tekst        | 128,000 | 40,000     | Z włączonym rozumowaniem                                         |

Po onboardingu wykonaj smoke test Medium 3.5 bez uruchamiania Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

Aby przejrzeć wiersz dołączonego katalogu przed zmianą konfiguracji:

```bash
openclaw models list --all --provider mistral --plain
```

## Transkrypcja audio (Voxtral)

Użyj Voxtral do wsadowej transkrypcji audio przez pipeline rozumienia
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

## Strumieniowe STT dla Voice Call

Dołączony Plugin `mistral` rejestruje Voxtral Realtime jako providera
strumieniowego STT dla Voice Call.

| Ustawienie    | Ścieżka konfiguracji                                                  | Domyślnie                               |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| Klucz API     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Używa awaryjnie `MISTRAL_API_KEY`       |
| Model        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Kodowanie    | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Częstotliwość próbkowania | `...mistral.sampleRate`                                     | `8000`                                  |
| Docelowe opóźnienie | `...mistral.targetStreamingDelayMs`                              | `800`                                   |

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
OpenClaw domyślnie ustawia STT czasu rzeczywistego Mistral na `pcm_mulaw` przy 8 kHz, aby Voice Call
mógł przekazywać ramki multimediów Twilio bezpośrednio. Użyj `encoding: "pcm_s16le"` oraz
pasującego `sampleRate` tylko wtedy, gdy strumień nadrzędny jest już surowym PCM.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Regulowane rozumowanie">
    `mistral/mistral-small-latest` (Mistral Small 4) i `mistral/mistral-medium-3-5` obsługują [regulowane rozumowanie](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) w Chat Completions API przez `reasoning_effort` (`none` minimalizuje dodatkowe myślenie w wyniku; `high` pokazuje pełne ślady myślenia przed końcową odpowiedzią). Mistral zaleca `reasoning_effort="high"` dla przypadków użycia agentowego i kodu w Medium 3.5.

    OpenClaw mapuje poziom **thinking** sesji na API Mistral:

    | Poziom thinking OpenClaw                          | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Warning>
    Nie łącz trybu rozumowania Medium 3.5 z `temperature: 0`. HTTP API Mistral
    odrzuca `reasoning_effort="high"` plus `temperature: 0` odpowiedzią 400.
    Pozostaw temperaturę nieustawioną, aby Mistral użył wartości domyślnej, albo zastosuj
    [zalecane ustawienia Medium 3.5](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)
    i użyj `temperature: 0.7` dla wysokiego rozumowania. Aby uzyskać deterministyczne bezpośrednie
    odpowiedzi, wyłącz thinking lub ustaw go na minimalny, aby OpenClaw wysłał
    `reasoning_effort: "none"` przed obniżeniem temperatury.
    </Warning>

    Przykładowa konfiguracja zakresu modelu dla rozumowania Medium 3.5:

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
    Inne dołączone modele katalogu Mistral nie używają tego parametru. Nadal używaj modeli `magistral-*`, gdy chcesz natywne, zorientowane najpierw na rozumowanie zachowanie Mistral.
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
    - Bazowy URL providera domyślnie to `https://api.mistral.ai/v1` i akceptuje standardowy, zgodny z OpenAI kształt żądania chat-completions.
    - Domyślny model onboardingu to `mistral/mistral-large-latest`.
    - Nadpisuj bazowy URL w `models.providers.mistral.baseUrl` tylko wtedy, gdy Mistral jawnie opublikuje regionalny endpoint, którego potrzebujesz.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie providerów, refów modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Rozumienie multimediów" href="/pl/nodes/media-understanding" icon="microphone">
    Konfiguracja transkrypcji audio i wybór providera.
  </Card>
</CardGroup>
