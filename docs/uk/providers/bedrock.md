---
read_when:
    - Ви хочете використовувати моделі Amazon Bedrock з OpenClaw
    - Вам потрібно налаштувати AWS credentials/region для викликів моделей
summary: Використання моделей Amazon Bedrock (Converse API) з OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-23T21:05:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e37aaead5c9bd730b4dd1f2878ff63bebf5537d75ff9df786813c58b1ac2fc0
    source_path: providers/bedrock.md
    workflow: 15
---

OpenClaw може використовувати моделі **Amazon Bedrock** через потокового провайдера **Bedrock Converse**
з pi-ai. Автентифікація Bedrock використовує **ланцюжок типових облікових даних AWS SDK**,
а не API key.

| Property | Value                                                       |
| -------- | ----------------------------------------------------------- |
| Provider | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Auth     | AWS credentials (env vars, shared config, або instance role) |
| Region   | `AWS_REGION` або `AWS_DEFAULT_REGION` (типово: `us-east-1`) |

## Початок роботи

Виберіть бажаний метод автентифікації й виконайте кроки налаштування.

<Tabs>
  <Tab title="Access keys / env vars">
    **Найкраще для:** машин розробників, CI або хостів, де ви напряму керуєте AWS credentials.

    <Steps>
      <Step title="Задайте AWS credentials на хості Gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Додайте провайдера Bedrock і модель до своєї конфігурації">
        `apiKey` не потрібен. Налаштуйте провайдера з `auth: "aws-sdk"`:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Переконайтеся, що моделі доступні">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    За автентифікації через env-marker (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` або `AWS_BEARER_TOKEN_BEDROCK`) OpenClaw автоматично вмикає неявного провайдера Bedrock для виявлення моделей без додаткової конфігурації.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **Найкраще для:** EC2-екземплярів із прикріпленою IAM role, які використовують service instance metadata для автентифікації.

    <Steps>
      <Step title="Явно ввімкніть discovery">
        Під час використання IMDS OpenClaw не може виявити AWS auth лише за env-marker-ами, тому потрібно явно ввімкнути це:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="За бажанням додайте env marker для auto mode">
        Якщо ви також хочете, щоб працював шлях auto-detection через env-marker (наприклад для поверхонь `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Вам **не** потрібен фальшивий API key.
      </Step>
      <Step title="Переконайтеся, що моделі виявляються">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    IAM role, прикріплена до вашого EC2-екземпляра, має мати такі дозволи:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (для автоматичного discovery)
    - `bedrock:ListInferenceProfiles` (для discovery inference profile)

    Або прикріпіть керовану policy `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    `AWS_PROFILE=default` потрібен лише якщо вам спеціально потрібен env marker для auto mode або поверхонь status. Фактичний шлях runtime auth для Bedrock використовує типовий ланцюжок AWS SDK, тому автентифікація через IMDS instance-role працює навіть без env marker-ів.
    </Note>

  </Tab>
</Tabs>

## Автоматичне виявлення моделей

OpenClaw може автоматично виявляти моделі Bedrock, які підтримують **streaming**
і **text output**. Discovery використовує `bedrock:ListFoundationModels` і
`bedrock:ListInferenceProfiles`, а результати кешуються (типово: 1 година).

Як вмикається неявний провайдер:

- Якщо `plugins.entries.amazon-bedrock.config.discovery.enabled` дорівнює `true`,
  OpenClaw спробує виконати discovery навіть без AWS env marker.
- Якщо `plugins.entries.amazon-bedrock.config.discovery.enabled` не задано,
  OpenClaw автоматично додає
  неявного провайдера Bedrock лише коли бачить один із таких маркерів AWS auth:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` або `AWS_PROFILE`.
- Фактичний шлях runtime auth для Bedrock усе одно використовує типовий ланцюжок AWS SDK, тож
  shared config, SSO та IMDS instance-role auth можуть працювати навіть тоді, коли для discovery
  потрібно було явно ввімкнути `enabled: true`.

<Note>
Для явних записів `models.providers["amazon-bedrock"]` OpenClaw усе одно може рано розв’язувати Bedrock env-marker auth з AWS env marker-ів, таких як `AWS_BEARER_TOKEN_BEDROCK`, не примушуючи повне завантаження runtime auth. Фактичний шлях автентифікації викликів моделі все одно використовує типовий ланцюжок AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Параметри конфігурації discovery">
    Параметри конфігурації містяться в `plugins.entries.amazon-bedrock.config.discovery`:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | Option | Default | Description |
    | ------ | ------- | ----------- |
    | `enabled` | auto | У режимі auto OpenClaw вмикає неявного провайдера Bedrock лише коли бачить підтримуваний AWS env marker. Задайте `true`, щоб примусово ввімкнути discovery. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | AWS region, що використовується для API-викликів discovery. |
    | `providerFilter` | (усі) | Зіставляється з іменами провайдерів Bedrock (наприклад `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Тривалість кешу в секундах. Задайте `0`, щоб вимкнути кешування. |
    | `defaultContextWindow` | `32000` | Контекстне вікно, яке використовується для виявлених моделей (перевизначте, якщо знаєте ліміти своєї моделі). |
    | `defaultMaxTokens` | `4096` | Максимальна кількість output token-ів, що використовується для виявлених моделей (перевизначте, якщо знаєте ліміти своєї моделі). |

  </Accordion>
</AccordionGroup>

## Швидке налаштування (шлях AWS)

Цей сценарій створює IAM role, прикріплює дозволи Bedrock, асоціює
instance profile і вмикає discovery OpenClaw на хості EC2.

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Inference profiles">
    OpenClaw виявляє **регіональні та глобальні inference profile** разом із
    foundation-моделями. Коли profile зіставляється з відомою foundation-моделлю, цей
    profile успадковує можливості моделі (контекстне вікно, max tokens,
    reasoning, vision), а правильний регіон запиту Bedrock автоматично інжектується.
    Це означає, що міжрегіональні profile Claude працюють без ручних provider override.

    ID inference profile мають вигляд `us.anthropic.claude-opus-4-6-v1:0` (регіональний)
    або `anthropic.claude-opus-4-6-v1:0` (глобальний). Якщо базова модель уже є
    в результатах discovery, profile успадковує весь її набір можливостей;
    інакше застосовуються безпечні типові значення.

    Додаткова конфігурація не потрібна. Поки discovery увімкнено і IAM
    principal має `bedrock:ListInferenceProfiles`, profile з’являються поруч із
    foundation-моделями в `openclaw models list`.

  </Accordion>

  <Accordion title="Guardrails">
    Ви можете застосовувати [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    до всіх викликів моделей Bedrock, додавши об’єкт `guardrail` до
    конфігурації plugin `amazon-bedrock`. Guardrails дають змогу застосовувати фільтрацію контенту,
    заборону тем, фільтри слів, фільтри чутливої інформації та перевірки
    контекстного заземлення.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Option | Required | Description |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Так | ID Guardrail (наприклад `abc123`) або повний ARN (наприклад `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Так | Номер опублікованої версії або `"DRAFT"` для робочої чернетки. |
    | `streamProcessingMode` | Ні | `"sync"` або `"async"` для оцінки guardrail під час streaming. Якщо не задано, Bedrock використовує своє типове значення. |
    | `trace` | Ні | `"enabled"` або `"enabled_full"` для налагодження; пропустіть або задайте `"disabled"` для production. |

    <Warning>
    IAM principal, який використовує Gateway, має мати дозвіл `bedrock:ApplyGuardrail` на додачу до стандартних дозволів invoke.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings для пошуку в пам’яті">
    Bedrock також може слугувати embedding-провайдером для
    [пошуку в пам’яті](/uk/concepts/memory-search). Це налаштовується окремо від
    inference-провайдера — задайте `agents.defaults.memorySearch.provider` як `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Embeddings Bedrock використовують той самий ланцюжок credentials AWS SDK, що й inference (instance
    roles, SSO, access keys, shared config і web identity). API key
    не потрібен. Коли `provider` має значення `"auto"`, Bedrock визначається автоматично, якщо цей
    ланцюжок credentials успішно розв’язується.

    Підтримувані embedding-моделі включають Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) і TwelveLabs Marengo. Див.
    [довідник конфігурації пам’яті -- Bedrock](/uk/reference/memory-config#bedrock-embedding-config)
    для повного списку моделей і параметрів розмірності.

  </Accordion>

  <Accordion title="Примітки та застереження">
    - Bedrock потребує **увімкненого доступу до моделі** у вашому AWS account/region.
    - Автоматичне discovery потребує дозволів `bedrock:ListFoundationModels` і
      `bedrock:ListInferenceProfiles`.
    - Якщо ви покладаєтеся на auto mode, задайте один із підтримуваних AWS auth env marker-ів на
      хості Gateway. Якщо ви віддаєте перевагу IMDS/shared-config auth без env marker-ів, задайте
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw відображає джерело credentials у такому порядку: `AWS_BEARER_TOKEN_BEDROCK`,
      потім `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, потім `AWS_PROFILE`, а потім
      типовий ланцюжок AWS SDK.
    - Підтримка reasoning залежить від моделі; перевіряйте картку моделі Bedrock, щоб побачити
      актуальні можливості.
    - Якщо ви віддаєте перевагу керованому потоку ключів, ви також можете поставити OpenAI-compatible
      proxy перед Bedrock і натомість налаштувати його як OpenAI provider.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, model ref і поведінки failover.
  </Card>
  <Card title="Пошук у пам’яті" href="/uk/concepts/memory-search" icon="magnifying-glass">
    Конфігурація Bedrock embeddings для пошуку в пам’яті.
  </Card>
  <Card title="Довідник конфігурації пам’яті" href="/uk/reference/memory-config#bedrock-embedding-config" icon="database">
    Повний список embedding-моделей Bedrock і параметрів розмірності.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
