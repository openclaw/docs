---
read_when:
    - Ви хочете використовувати розміщені в Bedrock Mantle OSS-моделі з OpenClaw
    - Вам потрібен сумісний з OpenAI ендпоінт Mantle для GPT-OSS, Qwen, Kimi або GLM
summary: Використання моделей Amazon Bedrock Mantle (сумісних з OpenAI) з OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T21:05:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

OpenClaw містить вбудований провайдер **Amazon Bedrock Mantle**, який підключається до
сумісного з OpenAI ендпоінта Mantle. Mantle розміщує open-source і
сторонні моделі (GPT-OSS, Qwen, Kimi, GLM та подібні) через стандартну
поверхню `/v1/chat/completions`, що працює на інфраструктурі Bedrock.

| Властивість    | Значення                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------- |
| ID провайдера  | `amazon-bedrock-mantle`                                                                      |
| API            | `openai-completions` (сумісний з OpenAI) або `anthropic-messages` (маршрут Anthropic Messages) |
| Auth           | Явний `AWS_BEARER_TOKEN_BEDROCK` або генерація bearer token через IAM credential chain       |
| Типовий регіон | `us-east-1` (перевизначається через `AWS_REGION` або `AWS_DEFAULT_REGION`)                  |

## Початок роботи

Виберіть бажаний метод auth і виконайте кроки налаштування.

<Tabs>
  <Tab title="Явний bearer token">
    **Найкраще для:** середовищ, де у вас уже є bearer token Mantle.

    <Steps>
      <Step title="Задайте bearer token на хості gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        За бажанням задайте регіон (типово `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі виявлено">
        ```bash
        openclaw models list
        ```

        Виявлені моделі з’являться під провайдером `amazon-bedrock-mantle`. Додаткова
        конфігурація не потрібна, якщо ви не хочете перевизначити типові значення.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Найкраще для:** використання credentials, сумісних з AWS SDK (shared config, SSO, web identity, ролі екземпляра або task).

    <Steps>
      <Step title="Налаштуйте AWS credentials на хості gateway">
        Працює будь-яке джерело auth, сумісне з AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі виявлено">
        ```bash
        openclaw models list
        ```

        OpenClaw автоматично генерує bearer token Mantle з credential chain.
      </Step>
    </Steps>

    <Tip>
    Коли `AWS_BEARER_TOKEN_BEDROCK` не задано, OpenClaw випускає bearer token за вас із типового credential chain AWS, включно з shared credentials/config profiles, SSO, web identity, а також ролями екземпляра або task.
    </Tip>

  </Tab>
</Tabs>

## Автоматичне виявлення моделей

Коли задано `AWS_BEARER_TOKEN_BEDROCK`, OpenClaw використовує його напряму. Інакше
OpenClaw намагається згенерувати bearer token Mantle із типового
credential chain AWS. Потім він виявляє доступні моделі Mantle, опитуючи
ендпоінт `/v1/models` у відповідному регіоні.

| Поведінка          | Деталі                    |
| ------------------ | ------------------------- |
| Кеш виявлення      | Результати кешуються на 1 годину |
| Оновлення IAM token | Щогодини                 |

<Note>
Bearer token — це той самий `AWS_BEARER_TOKEN_BEDROCK`, який використовує стандартний провайдер [Amazon Bedrock](/uk/providers/bedrock).
</Note>

### Підтримувані регіони

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Ручна конфігурація

Якщо ви віддаєте перевагу явній config замість автоматичного виявлення:

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

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Підтримка reasoning">
    Підтримка reasoning виводиться з ID моделей, які містять шаблони на кшталт
    `thinking`, `reasoner` або `gpt-oss-120b`. OpenClaw автоматично встановлює `reasoning: true`
    для відповідних моделей під час виявлення.
  </Accordion>

  <Accordion title="Недоступність ендпоінта">
    Якщо ендпоінт Mantle недоступний або не повертає моделей, провайдер
    тихо пропускається. OpenClaw не генерує помилку; інші налаштовані провайдери
    продовжують працювати у звичайному режимі.
  </Accordion>

  <Accordion title="Claude Opus 4.7 через маршрут Anthropic Messages">
    Mantle також надає маршрут Anthropic Messages, який пропускає моделі Claude через той самий bearer-authenticated streaming path. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) можна викликати через цей маршрут із потоковою передачею, якою володіє провайдер, тож AWS bearer tokens не трактуються як Anthropic API keys.

    Коли ви фіксуєте модель Anthropic Messages у провайдера Mantle, OpenClaw використовує для цієї моделі поверхню API `anthropic-messages` замість `openai-completions`. Auth і далі надходить із `AWS_BEARER_TOKEN_BEDROCK` (або згенерованого bearer token IAM).

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
    Bedrock Mantle — це окремий провайдер від стандартного
    провайдера [Amazon Bedrock](/uk/providers/bedrock). Mantle використовує
    сумісну з OpenAI поверхню `/v1`, тоді як стандартний провайдер Bedrock використовує
    нативний API Bedrock.

    Обидва провайдери використовують ті самі credentials `AWS_BEARER_TOKEN_BEDROCK`, коли
    вони присутні.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/uk/providers/bedrock" icon="cloud">
    Нативний провайдер Bedrock для Anthropic Claude, Titan та інших моделей.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="OAuth і auth" href="/uk/gateway/authentication" icon="key">
    Деталі auth і правила повторного використання credentials.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Типові проблеми та способи їх вирішення.
  </Card>
</CardGroup>
