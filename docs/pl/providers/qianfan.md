---
read_when:
    - Chcesz używać jednego klucza API do wielu modeli LLM
    - Potrzebujesz wskazówek dotyczących konfiguracji Baidu Qianfan
summary: Używaj ujednoliconego API Qianfan, aby uzyskać dostęp do wielu modeli w OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-07-12T15:31:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan to platforma MaaS firmy Baidu: ujednolicone API zgodne z OpenAI, które kieruje żądania do wielu modeli za pośrednictwem jednego punktu końcowego i klucza API. OpenClaw udostępnia ją jako oficjalny zewnętrzny Plugin `@openclaw/qianfan-provider`.

| Właściwość    | Wartość                                  |
| ------------- | ---------------------------------------- |
| Dostawca      | `qianfan`                                |
| Uwierzytelnianie | `QIANFAN_API_KEY`                     |
| API           | Zgodne z OpenAI (`openai-completions`)   |
| Bazowy adres URL | `https://qianfan.baidubce.com/v2`     |
| Domyślny model | `qianfan/deepseek-v3.2`                 |

## Instalacja Pluginu

Zainstaluj oficjalny Plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Pierwsze kroki

<Steps>
  <Step title="Utwórz konto Baidu Cloud">
    Zarejestruj się lub zaloguj w [konsoli Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) i upewnij się, że masz włączony dostęp do API Qianfan.
  </Step>
  <Step title="Wygeneruj klucz API">
    Utwórz nową aplikację lub wybierz istniejącą, a następnie wygeneruj klucz API. Klucze Baidu Cloud mają format `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Uruchom konfigurację początkową">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    W trybie nieinteraktywnym klucz jest odczytywany z `--qianfan-api-key <key>` lub
    `QIANFAN_API_KEY`. Konfiguracja początkowa zapisuje konfigurację dostawcy, dodaje
    alias `QIANFAN` dla domyślnego modelu i ustawia `qianfan/deepseek-v3.2`
    jako model domyślny, jeśli nie skonfigurowano żadnego modelu.

  </Step>
  <Step title="Sprawdź dostępność modelu">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Wbudowany katalog

| Odwołanie do modelu                  | Dane wejściowe | Kontekst | Maks. dane wyjściowe | Rozumowanie | Uwagi             |
| ------------------------------------ | -------------- | -------- | -------------------- | ----------- | ----------------- |
| `qianfan/deepseek-v3.2`              | tekst          | 98,304   | 32,768               | Tak         | Domyślny model    |
| `qianfan/ernie-5.0-thinking-preview` | tekst, obraz   | 119,000  | 64,000               | Tak         | Wielomodalny      |

Katalog jest statyczny; modele nie są wykrywane na żywo.

<Tip>
Wartość `models.providers.qianfan` trzeba nadpisać tylko wtedy, gdy potrzebujesz niestandardowego bazowego adresu URL lub metadanych modelu.
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

<Note>
Odwołania do modeli używają prefiksu `qianfan/` (na przykład `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="Transport i zgodność">
    Qianfan korzysta ze ścieżki transportu zgodnej z OpenAI, a nie z natywnego formatowania żądań OpenAI. Standardowe funkcje zestawu SDK OpenAI działają, ale parametry specyficzne dla dostawcy mogą nie być przekazywane.
  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Upewnij się, że klucz API zaczyna się od `bce-v3/ALTAK-` i ma włączony dostęp do API Qianfan w konsoli Baidu Cloud.
    - Jeśli modele nie są wyświetlane, sprawdź, czy usługa Qianfan jest aktywowana na Twoim koncie.
    - Zmieniaj bazowy adres URL tylko wtedy, gdy używasz niestandardowego punktu końcowego lub serwera proxy.

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu działania przełączania awaryjnego.
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
