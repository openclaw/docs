---
read_when:
    - Ви хочете використовувати розміщені в Bedrock Mantle OSS-моделі з OpenClaw
    - Вам потрібна сумісна з OpenAI кінцева точка Mantle для GPT-OSS, Qwen, Kimi або GLM
summary: Використовуйте моделі Amazon Bedrock Mantle (сумісні з OpenAI) з OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-06T00:47:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e5b33ede4067fb7de02a046f3e375cbd2af4bf68e7751c8dd687447f1a78c86
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw містить вбудованого постачальника **Amazon Bedrock Mantle**, який підключається до сумісної з OpenAI кінцевої точки Mantle. Mantle розміщує моделі з відкритим вихідним кодом і сторонні моделі (GPT-OSS, Qwen, Kimi, GLM та подібні) через стандартний інтерфейс `/v1/chat/completions`, що працює на інфраструктурі Bedrock.

## Що підтримує OpenClaw

- Постачальник: `amazon-bedrock-mantle`
- API: `openai-completions` (сумісний з OpenAI)
- Автентифікація: явний `AWS_BEARER_TOKEN_BEDROCK` або генерація bearer-токена з ланцюжка облікових даних IAM
- Регіон: `AWS_REGION` або `AWS_DEFAULT_REGION` (типово: `us-east-1`)

## Автоматичне виявлення моделей

Коли задано `AWS_BEARER_TOKEN_BEDROCK`, OpenClaw використовує його безпосередньо. Інакше OpenClaw намагається згенерувати bearer-токен Mantle з типового ланцюжка облікових даних AWS, зокрема зі спільних профілів credentials/config, SSO, web identity, а також ролей екземпляра або завдання. Потім він виявляє доступні моделі Mantle, надсилаючи запит до кінцевої точки `/v1/models` у відповідному регіоні. Результати виявлення кешуються на 1 годину, а bearer-токени, отримані з IAM, оновлюються щогодини.

Підтримувані регіони: `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`, `ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`, `eu-south-1`, `eu-north-1`, `sa-east-1`.

## Початкове налаштування

1. Виберіть один шлях автентифікації на **хості шлюзу**:

Явний bearer-токен:

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# Необов’язково (типово використовується us-east-1):
export AWS_REGION="us-west-2"
```

Облікові дані IAM:

```bash
# Тут працює будь-яке джерело автентифікації, сумісне з AWS SDK, наприклад:
export AWS_PROFILE="default"
export AWS_REGION="us-west-2"
```

2. Переконайтеся, що моделі виявлено:

```bash
openclaw models list
```

Виявлені моделі з’являться в постачальника `amazon-bedrock-mantle`. Додаткова конфігурація не потрібна, якщо тільки ви не хочете перевизначити типові значення.

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

## Примітки

- OpenClaw може створити для вас bearer-токен Mantle на основі облікових даних IAM, сумісних з AWS SDK, якщо `AWS_BEARER_TOKEN_BEDROCK` не задано.
- Bearer-токен — це той самий `AWS_BEARER_TOKEN_BEDROCK`, який використовується стандартним постачальником [Amazon Bedrock](/uk/providers/bedrock).
- Підтримка міркування визначається за ідентифікаторами моделей, що містять шаблони на кшталт `thinking`, `reasoner` або `gpt-oss-120b`.
- Якщо кінцева точка Mantle недоступна або не повертає моделей, постачальник тихо пропускається.
