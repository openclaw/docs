---
read_when:
    - Chcesz jednego klucza API dla wielu LLM-ów
    - Potrzebujesz wskazówek konfiguracji Baidu Qianfan
summary: Używaj ujednoliconego API Qianfan, aby uzyskać dostęp do wielu modeli w OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-24T09:29:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 727236394f6581f5bdb2f557092c31ff7904e4a80b06f8adc07a1c51dcfb2ff1
    source_path: providers/qianfan.md
    workflow: 15
---

Qianfan to platforma MaaS Baidu, zapewniająca **ujednolicone API**, które kieruje żądania do wielu modeli za pojedynczym
punktem końcowym i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie base URL.

| Właściwość | Wartość                           |
| ---------- | --------------------------------- |
| Provider   | `qianfan`                         |
| Auth       | `QIANFAN_API_KEY`                 |
| API        | Zgodne z OpenAI                   |
| Base URL   | `https://qianfan.baidubce.com/v2` |

## Pierwsze kroki

<Steps>
  <Step title="Utwórz konto Baidu Cloud">
    Zarejestruj się lub zaloguj w [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) i upewnij się, że masz włączony dostęp do API Qianfan.
  </Step>
  <Step title="Wygeneruj klucz API">
    Utwórz nową aplikację lub wybierz istniejącą, a następnie wygeneruj klucz API. Format klucza to `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Zweryfikuj, że model jest dostępny">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Wbudowany katalog

| Ref modelu                           | Wejście     | Kontekst | Maks. wyjście | Reasoning | Uwagi          |
| ------------------------------------ | ----------- | -------- | ------------- | --------- | -------------- |
| `qianfan/deepseek-v3.2`              | tekst       | 98,304   | 32,768        | Tak       | Model domyślny |
| `qianfan/ernie-5.0-thinking-preview` | tekst, obraz | 119,000 | 64,000        | Tak       | Multimodalny   |

<Tip>
Domyślne dołączone odwołanie modelu to `qianfan/deepseek-v3.2`. `models.providers.qianfan` musisz nadpisać tylko wtedy, gdy potrzebujesz niestandardowego base URL lub metadanych modelu.
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
  <Accordion title="Transport i zgodność">
    Qianfan działa przez ścieżkę transportu zgodną z OpenAI, a nie przez natywne kształtowanie żądań OpenAI. Oznacza to, że standardowe funkcje SDK OpenAI działają, ale parametry specyficzne dla providera mogą nie być przekazywane dalej.
  </Accordion>

  <Accordion title="Katalog i nadpisania">
    Dołączony katalog zawiera obecnie `deepseek-v3.2` oraz `ernie-5.0-thinking-preview`. Dodawaj lub nadpisuj `models.providers.qianfan` tylko wtedy, gdy potrzebujesz niestandardowego base URL lub metadanych modelu.

    <Note>
    Odwołania modeli używają prefiksu `qianfan/` (na przykład `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Upewnij się, że Twój klucz API zaczyna się od `bce-v3/ALTAK-` i że dostęp do API Qianfan jest włączony w konsoli Baidu Cloud.
    - Jeśli modele nie są wyświetlane, potwierdź, że Twoje konto ma aktywowaną usługę Qianfan.
    - Domyślny base URL to `https://qianfan.baidubce.com/v2`. Zmieniaj go tylko wtedy, gdy używasz niestandardowego punktu końcowego lub proxy.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, odwołań modeli i zachowania failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji OpenClaw.
  </Card>
  <Card title="Konfiguracja agenta" href="/pl/concepts/agent" icon="robot">
    Konfigurowanie ustawień domyślnych agenta i przypisań modeli.
  </Card>
  <Card title="Dokumentacja API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Oficjalna dokumentacja API Qianfan.
  </Card>
</CardGroup>
