---
read_when:
    - Ви хочете використовувати моделі Mistral в OpenClaw
    - Вам потрібні онбординг ключа API Mistral і посилання на моделі
summary: Використовуйте моделі Mistral і транскрипцію Voxtral з OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-12T10:33:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0474f55587909ce9bbdd47b881262edbeb1b07eb3ed52de1090a8ec4d260c97b
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw підтримує Mistral як для маршрутизації текстових/зображувальних моделей (`mistral/...`), так і для транскрипції аудіо через Voxtral у media understanding.
Mistral також можна використовувати для ембедингів пам’яті (`memorySearch.provider = "mistral"`).

- Провайдер: `mistral`
- Автентифікація: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Початок роботи

<Steps>
  <Step title="Отримайте свій ключ API">
    Створіть ключ API в [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Або передайте ключ безпосередньо:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Установіть модель за замовчуванням">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Вбудований каталог LLM

Наразі OpenClaw постачається з таким вбудованим каталогом Mistral:

| Посилання на модель               | Вхідні дані | Контекст | Макс. вивід | Примітки                                                         |
| --------------------------------- | ----------- | -------- | ----------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144  | 16,384      | Модель за замовчуванням                                          |
| `mistral/mistral-medium-2508`    | text, image | 262,144  | 8,192       | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000  | 16,384      | Mistral Small 4; регульоване міркування через API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | text, image | 128,000  | 32,768      | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000  | 4,096       | Програмування                                                    |
| `mistral/devstral-medium-latest` | text        | 262,144  | 32,768      | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000  | 40,000      | З увімкненим міркуванням                                         |

## Транскрипція аудіо (Voxtral)

Використовуйте Voxtral для транскрипції аудіо через конвеєр media understanding.

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
Шлях транскрипції медіа використовує `/v1/audio/transcriptions`. Моделлю аудіо за замовчуванням для Mistral є `voxtral-mini-latest`.
</Tip>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Регульоване міркування (mistral-small-latest)">
    `mistral/mistral-small-latest` відповідає Mistral Small 4 і підтримує [регульоване міркування](https://docs.mistral.ai/capabilities/reasoning/adjustable) в API Chat Completions через `reasoning_effort` (`none` мінімізує додаткове міркування у виводі; `high` показує повні сліди міркування перед фінальною відповіддю).

    OpenClaw зіставляє рівень **thinking** сесії з API Mistral:

    | Рівень thinking в OpenClaw                    | Mistral `reasoning_effort` |
    | --------------------------------------------- | -------------------------- |
    | **off** / **minimal**                         | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** | `high`             |

    <Note>
    Інші моделі у вбудованому каталозі Mistral не використовують цей параметр. Продовжуйте використовувати моделі `magistral-*`, якщо вам потрібна нативна поведінка Mistral, орієнтована насамперед на міркування.
    </Note>

  </Accordion>

  <Accordion title="Ембединги пам’яті">
    Mistral може надавати ембединги пам’яті через `/v1/embeddings` (модель за замовчуванням: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Автентифікація та базовий URL">
    - Автентифікація Mistral використовує `MISTRAL_API_KEY`.
    - Базовий URL провайдера за замовчуванням: `https://api.mistral.ai/v1`.
    - Модель онбордингу за замовчуванням — `mistral/mistral-large-latest`.
    - Z.AI використовує Bearer-автентифікацію з вашим ключем API.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Media understanding" href="/tools/media-understanding" icon="microphone">
    Налаштування транскрипції аудіо та вибір провайдера.
  </Card>
</CardGroup>
