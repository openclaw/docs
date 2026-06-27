---
read_when:
    - Ви хочете використовувати OSS-моделі, розміщені в Bedrock Mantle, з OpenClaw
    - Вам потрібна сумісна з OpenAI кінцева точка Mantle для GPT-OSS, Qwen, Kimi або GLM
summary: Використовуйте моделі Amazon Bedrock Mantle (сумісні з OpenAI) з OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-06-27T18:09:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw містить вбудований провайдер **Amazon Bedrock Mantle**, який підключається до
OpenAI-сумісної кінцевої точки Mantle. Mantle розміщує open-source і
сторонні моделі (GPT-OSS, Qwen, Kimi, GLM тощо) через стандартну
поверхню `/v1/chat/completions`, що працює на інфраструктурі Bedrock.

| Властивість       | Значення                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| ID провайдера    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (OpenAI-сумісний) або `anthropic-messages` (маршрут Anthropic Messages) |
| Автентифікація           | Явний `AWS_BEARER_TOKEN_BEDROCK` або генерація bearer-токена через ланцюжок облікових даних IAM         |
| Регіон за замовчуванням | `us-east-1` (перевизначте через `AWS_REGION` або `AWS_DEFAULT_REGION`)                            |

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Явний bearer-токен">
    **Найкраще для:** середовищ, де у вас уже є bearer-токен Mantle.

    <Steps>
      <Step title="Установіть bearer-токен на хості gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        За потреби встановіть регіон (за замовчуванням `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Увімкніть обмін даними провайдера для Claude Fable 5">
        Claude Fable 5 і моделі Bedrock класу Claude Mythos перед викликом потребують режиму Mantle Data Retention API `provider_data_share`. Це явне ввімкнення дозволяє Bedrock передавати запити й завершення Anthropic і зберігати їх до 30 днів для перевірки довіри та безпеки.

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        Використайте іншу модель Bedrock у конфігурації, якщо ви не можете прийняти цей режим зберігання.
      </Step>
      <Step title="Перевірте, що моделі виявлено">
        ```bash
        openclaw models list
        ```

        Виявлені моделі з'являться під провайдером `amazon-bedrock-mantle`. Додаткова
        конфігурація не потрібна, якщо ви не хочете перевизначити значення за замовчуванням.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Облікові дані IAM">
    **Найкраще для:** використання облікових даних, сумісних з AWS SDK (спільна конфігурація, SSO, web identity, ролі інстансу або завдання).

    <Steps>
      <Step title="Налаштуйте облікові дані AWS на хості gateway">
        Працює будь-яке джерело автентифікації, сумісне з AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Перевірте, що моделі виявлено">
        ```bash
        openclaw models list
        ```

        OpenClaw автоматично генерує bearer-токен Mantle з ланцюжка облікових даних.
      </Step>
    </Steps>

    <Tip>
    Коли `AWS_BEARER_TOKEN_BEDROCK` не встановлено, OpenClaw створює bearer-токен для вас із стандартного ланцюжка облікових даних AWS, включно зі спільними профілями облікових даних/конфігурації, SSO, web identity, а також ролями інстансу або завдання.
    </Tip>

  </Tab>
</Tabs>

## Автоматичне виявлення моделей

Коли `AWS_BEARER_TOKEN_BEDROCK` встановлено, OpenClaw використовує його напряму. Інакше
OpenClaw намагається згенерувати bearer-токен Mantle зі стандартного
ланцюжка облікових даних AWS. Потім він виявляє доступні моделі Mantle, запитуючи
кінцеву точку регіону `/v1/models`.

| Поведінка          | Деталі                    |
| ----------------- | ------------------------- |
| Кеш виявлення   | Результати кешуються на 1 годину |
| Оновлення IAM-токена | Щогодини                    |

Щоб залишити Plugin Mantle увімкненим, але вимкнути автоматичне виявлення та генерацію
IAM bearer-токена, вимкніть перемикач виявлення, яким володіє Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Bearer-токен збігається з `AWS_BEARER_TOKEN_BEDROCK`, який використовує стандартний провайдер [Amazon Bedrock](/uk/providers/bedrock).
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
  <Accordion title="Підтримка reasoning">
    Підтримка reasoning визначається з ID моделей, що містять шаблони на кшталт
    `thinking`, `reasoner` або `gpt-oss-120b`. OpenClaw автоматично встановлює `reasoning: true`
    для відповідних моделей під час виявлення.
  </Accordion>

  <Accordion title="Недоступність кінцевої точки">
    Якщо кінцева точка Mantle недоступна або не повертає моделей, провайдер
    безшумно пропускається. OpenClaw не видає помилку; інші налаштовані провайдери
    продовжують працювати нормально.
  </Accordion>

  <Accordion title="Claude Opus 4.7 через маршрут Anthropic Messages">
    Mantle також надає маршрут Anthropic Messages, який проводить моделі Claude через той самий streaming-шлях із bearer-автентифікацією. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) можна викликати через цей маршрут зі streaming, яким володіє провайдер, тому bearer-токени AWS не трактуються як API-ключі Anthropic.

    Коли ви закріплюєте модель Anthropic Messages за провайдером Mantle, OpenClaw використовує поверхню API `anthropic-messages` замість `openai-completions` для цієї моделі. Автентифікація все одно надходить із `AWS_BEARER_TOKEN_BEDROCK` (або згенерованого IAM bearer-токена).

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

  <Accordion title="Зв'язок із провайдером Amazon Bedrock">
    Bedrock Mantle є окремим провайдером від стандартного
    провайдера [Amazon Bedrock](/uk/providers/bedrock). Mantle використовує
    OpenAI-сумісну поверхню `/v1`, тоді як стандартний провайдер Bedrock використовує
    нативний Bedrock API.

    Обидва провайдери використовують ті самі облікові дані `AWS_BEARER_TOKEN_BEDROCK`, коли
    вони наявні.

  </Accordion>
</AccordionGroup>

## Пов'язане

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/uk/providers/bedrock" icon="cloud">
    Нативний провайдер Bedrock для Anthropic Claude, Titan та інших моделей.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Деталі автентифікації та правила повторного використання облікових даних.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх розв'язання.
  </Card>
</CardGroup>
