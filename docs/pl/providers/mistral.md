---
read_when:
    - Chcesz używać modeli Mistral w OpenClaw
    - Potrzebujesz onboardingu klucza API Mistral i odwołań do modeli
summary: Używaj modeli Mistral i transkrypcji Voxtral z OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-21T10:00:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e87d04e3d45c04280c90821b1addd87dd612191249836747fba27cde48b9890f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw obsługuje Mistral zarówno do routowania modeli tekstowych/obrazowych (`mistral/...`), jak i
transkrypcji audio przez Voxtral w rozumieniu multimediów.
Mistral może być także używany do embeddingów pamięci (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Uwierzytelnianie: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Pierwsze kroki

<Steps>
  <Step title="Pobierz swój klucz API">
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
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Wbudowany katalog LLM

OpenClaw obecnie dostarcza ten dołączony katalog Mistral:

| Odwołanie modelu                 | Wejście      | Kontekst | Maks. wyjście | Uwagi                                                           |
| -------------------------------- | ------------ | -------- | ------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | tekst, obraz | 262,144  | 16,384        | Model domyślny                                                   |
| `mistral/mistral-medium-2508`    | tekst, obraz | 262,144  | 8,192         | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | tekst, obraz | 128,000  | 16,384        | Mistral Small 4; regulowane rozumowanie przez API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | tekst, obraz | 128,000  | 32,768        | Pixtral                                                          |
| `mistral/codestral-latest`       | tekst        | 256,000  | 4,096         | Kodowanie                                                        |
| `mistral/devstral-medium-latest` | tekst        | 262,144  | 32,768        | Devstral 2                                                       |
| `mistral/magistral-small`        | tekst        | 128,000  | 40,000        | Z obsługą rozumowania                                            |

## Transkrypcja audio (Voxtral)

Używaj Voxtral do transkrypcji audio przez potok rozumienia multimediów.

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
Ścieżka transkrypcji multimediów używa `/v1/audio/transcriptions`. Domyślnym modelem audio dla Mistral jest `voxtral-mini-latest`.
</Tip>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Regulowane rozumowanie (mistral-small-latest)">
    `mistral/mistral-small-latest` mapuje się na Mistral Small 4 i obsługuje [regulowane rozumowanie](https://docs.mistral.ai/capabilities/reasoning/adjustable) w API Chat Completions przez `reasoning_effort` (`none` minimalizuje dodatkowe myślenie w wyjściu; `high` pokazuje pełne ślady myślenia przed końcową odpowiedzią).

    OpenClaw mapuje poziom **thinking** sesji na API Mistral:

    | Poziom thinking w OpenClaw                     | Mistral `reasoning_effort` |
    | ---------------------------------------------- | -------------------------- |
    | **off** / **minimal**                          | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Inne modele z dołączonego katalogu Mistral nie używają tego parametru. Nadal używaj modeli `magistral-*`, gdy chcesz natywnego zachowania Mistral z rozumowaniem na pierwszym planie.
    </Note>

  </Accordion>

  <Accordion title="Embeddingi pamięci">
    Mistral może obsługiwać embeddingi pamięci przez `/v1/embeddings` (model domyślny: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Uwierzytelnianie i bazowy URL">
    - Uwierzytelnianie Mistral używa `MISTRAL_API_KEY`.
    - Bazowy URL provider domyślnie to `https://api.mistral.ai/v1`.
    - Domyślny model onboardingu to `mistral/mistral-large-latest`.
    - Z.AI używa uwierzytelniania Bearer z twoim kluczem API.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Rozumienie multimediów" href="/tools/media-understanding" icon="microphone">
    Konfiguracja transkrypcji audio i wybór providera.
  </Card>
</CardGroup>
