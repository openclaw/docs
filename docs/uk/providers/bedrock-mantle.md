---
read_when:
    - Ви хочете використовувати розміщені в Bedrock Mantle OSS-моделі з OpenClaw
    - Вам потрібен сумісний з OpenAI endpoint Mantle для GPT-OSS, Qwen, Kimi або GLM
summary: Використання моделей Amazon Bedrock Mantle (сумісних з OpenAI) з OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T07:26:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a20e0abcd140b3c7115a9b0bbdf924e15962e0452ded676df252c753610e03ed
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw містить вбудований провайдер **Amazon Bedrock Mantle**, який підключається до
сумісного з OpenAI endpoint Mantle. Mantle розміщує open-source і
сторонні моделі (GPT-OSS, Qwen, Kimi, GLM та подібні) через стандартну
поверхню `/v1/chat/completions`, що працює на інфраструктурі Bedrock.

| Властивість    | Значення                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------- |
| ID провайдера  | `amazon-bedrock-mantle`                                                                      |
| API            | `openai-completions` (сумісний з OpenAI) або `anthropic-messages` (маршрут Anthropic Messages) |
| Автентифікація | Явний `AWS_BEARER_TOKEN_BEDROCK` або генерація bearer token через IAM credential chain       |
| Регіон за замовчуванням | `us-east-1` (перевизначається через `AWS_REGION` або `AWS_DEFAULT_REGION`)         |

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Явний bearer token">
    **Найкраще для:** середовищ, де у вас уже є bearer token Mantle.

    <Steps>
      <Step title="Задайте bearer token на хості Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        За бажанням задайте регіон (за замовчуванням `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі виявляються">
        ```bash
        openclaw models list
        ```

        Виявлені моделі з’являються під провайдером `amazon-bedrock-mantle`. Додаткова
        конфігурація не потрібна, якщо ви не хочете перевизначити значення за замовчуванням.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Найкраще для:** використання сумісних з AWS SDK облікових даних (shared config, SSO, web identity, ролі екземпляра або task).

    <Steps>
      <Step title="Налаштуйте облікові дані AWS на хості Gateway">
        Підійде будь-яке сумісне з AWS SDK джерело автентифікації:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі виявляються">
        ```bash
        openclaw models list
        ```

        OpenClaw автоматично генерує bearer token Mantle з credential chain.
      </Step>
    </Steps>

    <Tip>
    Якщо `AWS_BEARER_TOKEN_BEDROCK` не задано, OpenClaw самостійно випускає bearer token з AWS default credential chain, включно з shared credentials/config profiles, SSO, web identity, а також ролями екземпляра або task.
    </Tip>

  </Tab>
</Tabs>

## Автоматичне виявлення моделей

Коли задано `AWS_BEARER_TOKEN_BEDROCK`, OpenClaw використовує його напряму. Інакше
OpenClaw намагається згенерувати bearer token Mantle з AWS default
credential chain. Потім він виявляє доступні моделі Mantle, звертаючись до
endpoint `/v1/models` для відповідного регіону.

| Поведінка            | Деталі                     |
| -------------------- | -------------------------- |
| Кеш виявлення        | Результати кешуються на 1 годину |
| Оновлення IAM token  | Щогодини                   |

<Note>
Bearer token — це той самий `AWS_BEARER_TOKEN_BEDROCK`, який використовується стандартним провайдером [Amazon Bedrock](/uk/providers/bedrock).
</Note>

### Підтримувані регіони

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Ручна конфігурація

Якщо ви віддаєте перевагу явній конфігурації замість автовиявлення:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Додаткові примітки

<AccordionGroup>
  <Accordion title="Підтримка reasoning">
    Підтримка reasoning визначається за ID моделей, що містять шаблони на кшталт
    `thinking`, `reasoner` або `gpt-oss-120b`. OpenClaw автоматично задає `reasoning: true`
    для відповідних моделей під час виявлення.
  </Accordion>

  <Accordion title="Недоступність endpoint">
    Якщо endpoint Mantle недоступний або не повертає моделей, провайдер
    мовчки пропускається. OpenClaw не повертає помилку; інші налаштовані провайдери
    продовжують працювати як зазвичай.
  </Accordion>

  <Accordion title="Claude Opus 4.7 через маршрут Anthropic Messages">
    Mantle також надає маршрут Anthropic Messages, який передає моделі Claude через той самий шлях потокової передачі з bearer-автентифікацією. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) можна викликати через цей маршрут із потоковою передачею, що належить провайдеру, тому AWS bearer tokens не розглядаються як Anthropic API keys.

    Коли ви фіксуєте модель Anthropic Messages у провайдері Mantle, OpenClaw використовує для цієї моделі поверхню API `anthropic-messages` замість `openai-completions`. Автентифікація все одно надходить із `AWS_BEARER_TOKEN_BEDROCK` (або зі згенерованого IAM bearer token).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Зв’язок із провайдером Amazon Bedrock">
    Bedrock Mantle є окремим провайдером від стандартного
    провайдера [Amazon Bedrock](/uk/providers/bedrock). Mantle використовує
    сумісну з OpenAI поверхню `/v1`, тоді як стандартний провайдер Bedrock використовує
    нативний Bedrock API.

    Обидва провайдери використовують ті самі облікові дані `AWS_BEARER_TOKEN_BEDROCK`, якщо
    вони задані.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/uk/providers/bedrock" icon="cloud">
    Нативний провайдер Bedrock для Anthropic Claude, Titan та інших моделей.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, model ref і поведінка failover.
  </Card>
  <Card title="OAuth and auth" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх вирішення.
  </Card>
</CardGroup>
