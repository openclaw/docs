---
read_when:
    - Chcesz jednego klucza API do wielu LLM-ów
    - Potrzebujesz wskazówek dotyczących konfiguracji Baidu Qianfan
summary: Użyj ujednoliconego API Qianfan, aby uzyskać dostęp do wielu modeli w OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-06-27T18:14:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan to platforma MaaS firmy Baidu, udostępniająca **ujednolicony interfejs API**, który kieruje żądania do wielu modeli za jednym
endpointem i kluczem API. Jest zgodna z OpenAI, więc większość zestawów SDK OpenAI działa po zmianie bazowego adresu URL.

| Właściwość | Wartość                          |
| ---------- | -------------------------------- |
| Dostawca   | `qianfan`                        |
| Uwierzytelnianie | `QIANFAN_API_KEY`          |
| API        | Zgodne z OpenAI                  |
| Bazowy adres URL | `https://qianfan.baidubce.com/v2` |

## Zainstaluj Plugin

Zainstaluj oficjalny Plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Pierwsze kroki

<Steps>
  <Step title="Create a Baidu Cloud account">
    Zarejestruj się lub zaloguj w [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) i upewnij się, że masz włączony dostęp do API Qianfan.
  </Step>
  <Step title="Generate an API key">
    Utwórz nową aplikację lub wybierz istniejącą, a następnie wygeneruj klucz API. Format klucza to `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Wbudowany katalog

| Odwołanie do modelu                  | Dane wejściowe | Kontekst | Maks. dane wyjściowe | Rozumowanie | Uwagi             |
| ------------------------------------ | -------------- | -------- | -------------------- | ----------- | ----------------- |
| `qianfan/deepseek-v3.2`              | tekst          | 98,304   | 32,768               | Tak         | Model domyślny    |
| `qianfan/ernie-5.0-thinking-preview` | tekst, obraz   | 119,000  | 64,000               | Tak         | Multimodalny      |

<Tip>
Domyślne odwołanie do modelu to `qianfan/deepseek-v3.2`. Musisz nadpisać `models.providers.qianfan` tylko wtedy, gdy potrzebujesz niestandardowego bazowego adresu URL lub metadanych modelu.
</Tip>

## Przykład konfiguracji

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Qianfan działa przez ścieżkę transportu zgodną z OpenAI, a nie przez natywne kształtowanie żądań OpenAI. Oznacza to, że standardowe funkcje SDK OpenAI działają, ale parametry specyficzne dla dostawcy mogą nie być przekazywane dalej.
  </Accordion>

  <Accordion title="Catalog and overrides">
    Statyczny katalog obejmuje obecnie `deepseek-v3.2` i `ernie-5.0-thinking-preview`. Dodawaj lub nadpisuj `models.providers.qianfan` tylko wtedy, gdy potrzebujesz niestandardowego bazowego adresu URL lub metadanych modelu.

    <Note>
    Odwołania do modeli używają prefiksu `qianfan/` (na przykład `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Upewnij się, że klucz API zaczyna się od `bce-v3/ALTAK-` i ma włączony dostęp do API Qianfan w konsoli Baidu Cloud.
    - Jeśli modele nie są wyświetlane, potwierdź, że usługa Qianfan jest aktywowana na Twoim koncie.
    - Domyślny bazowy adres URL to `https://qianfan.baidubce.com/v2`. Zmień go tylko wtedy, gdy używasz niestandardowego endpointu lub serwera proxy.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Configuration reference" href="/pl/gateway/configuration-reference" icon="gear">
    Pełne odniesienie konfiguracji OpenClaw.
  </Card>
  <Card title="Agent setup" href="/pl/concepts/agent" icon="robot">
    Konfigurowanie domyślnych ustawień agentów i przypisań modeli.
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Oficjalna dokumentacja API Qianfan.
  </Card>
</CardGroup>
