---
read_when:
    - Chcesz jednego klucza API dla wielu LLM-ów
    - Potrzebujesz wskazówek dotyczących konfiguracji Baidu Qianfan
summary: Użyj ujednoliconego API Qianfan, aby uzyskać dostęp do wielu modeli w OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-30T10:14:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan to platforma MaaS firmy Baidu, zapewniająca **ujednolicone API**, które kieruje żądania do wielu modeli za jednym
punktem końcowym i kluczem API. Jest zgodna z OpenAI, więc większość pakietów SDK OpenAI działa po zmianie bazowego URL-a.

| Właściwość | Wartość                           |
| ---------- | --------------------------------- |
| Dostawca   | `qianfan`                         |
| Uwierzytelnianie | `QIANFAN_API_KEY`           |
| API        | zgodne z OpenAI                   |
| Bazowy URL | `https://qianfan.baidubce.com/v2` |

## Pierwsze kroki

<Steps>
  <Step title="Utwórz konto Baidu Cloud">
    Zarejestruj się lub zaloguj w [konsoli Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) i upewnij się, że masz włączony dostęp do API Qianfan.
  </Step>
  <Step title="Wygeneruj klucz API">
    Utwórz nową aplikację lub wybierz istniejącą, a następnie wygeneruj klucz API. Format klucza to `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Wbudowany katalog

| Odwołanie do modelu                  | Wejście     | Kontekst | Maks. wyjście | Rozumowanie | Uwagi          |
| ------------------------------------ | ----------- | -------- | ------------- | ----------- | -------------- |
| `qianfan/deepseek-v3.2`              | tekst       | 98,304   | 32,768        | Tak         | Model domyślny |
| `qianfan/ernie-5.0-thinking-preview` | tekst, obraz | 119,000 | 64,000        | Tak         | Multimodalny   |

<Tip>
Domyślne wbudowane odwołanie do modelu to `qianfan/deepseek-v3.2`. Musisz nadpisać `models.providers.qianfan` tylko wtedy, gdy potrzebujesz niestandardowego bazowego URL-a lub metadanych modelu.
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
    Qianfan działa przez ścieżkę transportu zgodną z OpenAI, a nie przez natywne kształtowanie żądań OpenAI. Oznacza to, że standardowe funkcje pakietów SDK OpenAI działają, ale parametry specyficzne dla dostawcy mogą nie być przekazywane dalej.
  </Accordion>

  <Accordion title="Katalog i nadpisania">
    Wbudowany katalog obecnie obejmuje `deepseek-v3.2` i `ernie-5.0-thinking-preview`. Dodaj lub nadpisz `models.providers.qianfan` tylko wtedy, gdy potrzebujesz niestandardowego bazowego URL-a lub metadanych modelu.

    <Note>
    Odwołania do modeli używają prefiksu `qianfan/` (na przykład `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Upewnij się, że Twój klucz API zaczyna się od `bce-v3/ALTAK-` i ma włączony dostęp do API Qianfan w konsoli Baidu Cloud.
    - Jeśli modele nie są wyświetlane, potwierdź, że usługa Qianfan jest aktywowana na Twoim koncie.
    - Domyślny bazowy URL to `https://qianfan.baidubce.com/v2`. Zmień go tylko wtedy, gdy używasz niestandardowego punktu końcowego lub proxy.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji OpenClaw.
  </Card>
  <Card title="Konfiguracja agenta" href="/pl/concepts/agent" icon="robot">
    Konfigurowanie domyślnych ustawień agentów i przypisań modeli.
  </Card>
  <Card title="Dokumentacja API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Oficjalna dokumentacja API Qianfan.
  </Card>
</CardGroup>
