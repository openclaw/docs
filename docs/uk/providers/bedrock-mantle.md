---
read_when:
    - Ви хочете використовувати OSS-моделі, розміщені в Bedrock Mantle, з OpenClaw
    - Вам потрібна OpenAI-сумісна кінцева точка Mantle для GPT-OSS, Qwen, Kimi або GLM
summary: Використовуйте моделі Amazon Bedrock Mantle (сумісні з OpenAI) з OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-05-11T20:53:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 721eef5b7ff606b8c5e02234dae1b8d846b43ff9f3d7bf871f701bb3136fec0e
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw містить вбудований провайдер **Amazon Bedrock Mantle**, який підключається до
OpenAI-сумісної кінцевої точки Mantle. Mantle розміщує моделі з відкритим кодом і
сторонні моделі (GPT-OSS, Qwen, Kimi, GLM та подібні) через стандартну
поверхню `/v1/chat/completions`, підтримувану інфраструктурою Bedrock.

| Властивість       | Значення                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| ID провайдера    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (OpenAI-сумісний) або `anthropic-messages` (маршрут Anthropic Messages) |
| Автентифікація           | Явний `AWS_BEARER_TOKEN_BEDROCK` або генерація bearer-токена через ланцюжок IAM-облікових даних         |
| Регіон за замовчуванням | `us-east-1` (перевизначте за допомогою `AWS_REGION` або `AWS_DEFAULT_REGION`)                            |

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Explicit bearer token">
    **Найкраще для:** середовищ, де у вас уже є bearer-токен Mantle.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        За бажанням задайте регіон (за замовчуванням `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        Виявлені моделі з’являються під провайдером `amazon-bedrock-mantle`. Жодна
        додаткова конфігурація не потрібна, якщо ви не хочете перевизначити значення за замовчуванням.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Найкраще для:** використання облікових даних, сумісних з AWS SDK (спільна конфігурація, SSO, web identity, ролі інстанса або завдання).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        Працює будь-яке джерело автентифікації, сумісне з AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw автоматично генерує bearer-токен Mantle з ланцюжка облікових даних.
      </Step>
    </Steps>

    <Tip>
    Коли `AWS_BEARER_TOKEN_BEDROCK` не задано, OpenClaw створює bearer-токен для вас із ланцюжка облікових даних AWS за замовчуванням, зокрема зі спільних профілів облікових даних/конфігурації, SSO, web identity, а також ролей інстанса або завдання.
    </Tip>

  </Tab>
</Tabs>

## Автоматичне виявлення моделей

Коли `AWS_BEARER_TOKEN_BEDROCK` задано, OpenClaw використовує його напряму. Інакше
OpenClaw намагається згенерувати bearer-токен Mantle з ланцюжка облікових даних
AWS за замовчуванням. Потім він виявляє доступні моделі Mantle, запитуючи
кінцеву точку `/v1/models` регіону.

| Поведінка          | Подробиці                    |
| ----------------- | ------------------------- |
| Кеш виявлення   | Результати кешуються на 1 годину |
| Оновлення IAM-токена | Щогодини                    |

Щоб залишити Plugin Mantle увімкненим, але вимкнути автоматичне виявлення та
генерацію IAM bearer-токена, вимкніть перемикач виявлення, що належить Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Bearer-токен є тим самим `AWS_BEARER_TOKEN_BEDROCK`, який використовується стандартним провайдером [Amazon Bedrock](/uk/providers/bedrock).
</Note>

### Підтримувані регіони

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Ручна конфігурація

Якщо ви віддаєте перевагу явній конфігурації замість автоматичного виявлення:

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
  <Accordion title="Reasoning support">
    Підтримка міркування визначається з ID моделей, що містять шаблони на кшталт
    `thinking`, `reasoner` або `gpt-oss-120b`. OpenClaw автоматично задає
    `reasoning: true` для відповідних моделей під час виявлення.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Якщо кінцева точка Mantle недоступна або не повертає моделей, провайдер
    мовчки пропускається. OpenClaw не видає помилку; інші налаштовані провайдери
    продовжують працювати нормально.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    Mantle також надає маршрут Anthropic Messages, який передає моделі Claude через той самий потоковий шлях з автентифікацією bearer-токеном. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) можна викликати через цей маршрут із потоковою передачею, що належить провайдеру, тому bearer-токени AWS не трактуються як API-ключі Anthropic.

    Коли ви закріплюєте модель Anthropic Messages у провайдері Mantle, OpenClaw використовує для цієї моделі поверхню API `anthropic-messages` замість `openai-completions`. Автентифікація й надалі надходить із `AWS_BEARER_TOKEN_BEDROCK` (або створеного IAM bearer-токена).

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

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle є окремим провайдером від стандартного
    провайдера [Amazon Bedrock](/uk/providers/bedrock). Mantle використовує
    OpenAI-сумісну поверхню `/v1`, тоді як стандартний провайдер Bedrock використовує
    нативний API Bedrock.

    Обидва провайдери спільно використовують ті самі облікові дані `AWS_BEARER_TOKEN_BEDROCK`,
    коли вони наявні.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/uk/providers/bedrock" icon="cloud">
    Нативний провайдер Bedrock для Anthropic Claude, Titan та інших моделей.
  </Card>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="OAuth and auth" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
  <Card title="Troubleshooting" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх вирішення.
  </Card>
</CardGroup>
