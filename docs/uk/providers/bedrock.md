---
read_when:
    - Ви хочете використовувати моделі Amazon Bedrock з OpenClaw
    - Вам потрібно налаштувати облікові дані/регіон AWS для викликів моделі
summary: Використовуйте моделі Amazon Bedrock (Converse API) з OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T18:09:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw може використовувати моделі **Amazon Bedrock** через свого потокового провайдера **Bedrock Converse**. Автентифікація Bedrock використовує **ланцюжок облікових даних за замовчуванням AWS SDK**, а не ключ API.

| Властивість | Значення                                                   |
| ----------- | ---------------------------------------------------------- |
| Провайдер   | `amazon-bedrock`                                           |
| API         | `bedrock-converse-stream`                                  |
| Автентифікація | облікові дані AWS (змінні середовища, спільна конфігурація або роль інстансу) |
| Регіон      | `AWS_REGION` або `AWS_DEFAULT_REGION` (за замовчуванням: `us-east-1`) |

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключі доступу / змінні середовища">
    **Найкраще для:** машин розробників, CI або хостів, де ви керуєте обліковими даними AWS напряму.

    <Steps>
      <Step title="Установіть облікові дані AWS на хості gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
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
      <Step title="Перевірте, що моделі доступні">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    З автентифікацією через маркери середовища (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` або `AWS_BEARER_TOKEN_BEDROCK`) OpenClaw автоматично вмикає неявного провайдера Bedrock для виявлення моделей без додаткової конфігурації.
    </Tip>

  </Tab>

  <Tab title="Ролі інстансів EC2 (IMDS)">
    **Найкраще для:** інстансів EC2 із прив’язаною роллю IAM, які використовують службу метаданих інстансу для автентифікації.

    <Steps>
      <Step title="Увімкніть виявлення явно">
        Під час використання IMDS OpenClaw не може виявити автентифікацію AWS лише за маркерами середовища, тому потрібно явно ввімкнути це:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="За бажанням додайте маркер середовища для автоматичного режиму">
        Якщо ви також хочете, щоб шлях автоматичного виявлення маркерів середовища працював (наприклад, для поверхонь `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Вам **не** потрібен фіктивний ключ API.
      </Step>
      <Step title="Перевірте, що моделі виявляються">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Роль IAM, прив’язана до вашого інстансу EC2, повинна мати такі дозволи:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (для автоматичного виявлення)
    - `bedrock:ListInferenceProfiles` (для виявлення inference profile)

    Або прив’яжіть керовану політику `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    `AWS_PROFILE=default` потрібен лише якщо вам спеціально потрібен маркер середовища для автоматичного режиму або поверхонь status. Фактичний шлях автентифікації runtime Bedrock використовує ланцюжок за замовчуванням AWS SDK, тож автентифікація через роль інстансу IMDS працює навіть без маркерів середовища.
    </Note>

  </Tab>
</Tabs>

## Автоматичне виявлення моделей

OpenClaw може автоматично виявляти моделі Bedrock, які підтримують **потокову передачу**
та **текстовий вивід**. Виявлення використовує `bedrock:ListFoundationModels` і
`bedrock:ListInferenceProfiles`, а результати кешуються (за замовчуванням: 1 година).

Як вмикається неявний провайдер:

- Якщо `plugins.entries.amazon-bedrock.config.discovery.enabled` має значення `true`,
  OpenClaw спробує виконати виявлення навіть тоді, коли немає маркера середовища AWS.
- Якщо `plugins.entries.amazon-bedrock.config.discovery.enabled` не задано,
  OpenClaw автоматично додає
  неявного провайдера Bedrock лише тоді, коли бачить один із цих маркерів автентифікації AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` або `AWS_PROFILE`.
- Фактичний шлях автентифікації runtime Bedrock усе одно використовує ланцюжок за замовчуванням AWS SDK, тому
  спільна конфігурація, SSO та автентифікація через роль інстансу IMDS можуть працювати навіть тоді, коли для виявлення
  потрібно було `enabled: true`, щоб явно ввімкнути його.

<Note>
Для явних записів `models.providers["amazon-bedrock"]` OpenClaw усе ще може рано визначати автентифікацію Bedrock через маркери середовища AWS, як-от `AWS_BEARER_TOKEN_BEDROCK`, без примусового завантаження повної runtime-автентифікації. Фактичний шлях автентифікації виклику моделі все одно використовує ланцюжок за замовчуванням AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Параметри конфігурації виявлення">
    Параметри конфігурації розміщені в `plugins.entries.amazon-bedrock.config.discovery`:

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

    | Параметр | За замовчуванням | Опис |
    | -------- | ---------------- | ---- |
    | `enabled` | auto | В автоматичному режимі OpenClaw вмикає неявного провайдера Bedrock лише тоді, коли бачить підтримуваний маркер середовища AWS. Установіть `true`, щоб примусово ввімкнути виявлення. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Регіон AWS, який використовується для викликів API виявлення. |
    | `providerFilter` | (усі) | Зіставляє імена провайдерів Bedrock (наприклад, `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Тривалість кешування в секундах. Установіть `0`, щоб вимкнути кешування. |
    | `defaultContextWindow` | `32000` | Контекстне вікно, що використовується для виявлених моделей (перевизначте, якщо знаєте обмеження своєї моделі). |
    | `defaultMaxTokens` | `4096` | Максимальна кількість токенів виводу, що використовується для виявлених моделей (перевизначте, якщо знаєте обмеження своєї моделі). |

  </Accordion>
</AccordionGroup>

## Швидке налаштування (шлях AWS)

Цей покроковий посібник створює роль IAM, прив’язує дозволи Bedrock, пов’язує
профіль інстансу та вмикає виявлення OpenClaw на хості EC2.

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

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Inference profiles">
    OpenClaw виявляє **регіональні та глобальні inference profiles** разом із
    foundation models. Коли профіль зіставляється з відомою foundation model,
    профіль успадковує можливості цієї моделі (контекстне вікно, максимальні токени,
    reasoning, vision), а правильний регіон запиту Bedrock підставляється
    автоматично. Це означає, що міжрегіональні профілі Claude працюють без ручних
    перевизначень провайдера.

    ID inference profile мають вигляд `us.anthropic.claude-opus-4-6-v1:0` (регіональний)
    або `anthropic.claude-opus-4-6-v1:0` (глобальний). Якщо базова модель уже
    є в результатах виявлення, профіль успадковує повний набір її можливостей;
    інакше застосовуються безпечні значення за замовчуванням.

    Додаткова конфігурація не потрібна. Поки виявлення ввімкнене, а принципал IAM
    має `bedrock:ListInferenceProfiles`, профілі з’являються поруч із
    foundation models у `openclaw models list`.

  </Accordion>

  <Accordion title="Рівень сервісу">
    Деякі моделі Bedrock підтримують параметр `service_tier` для оптимізації вартості
    або затримки. Доступні такі рівні:

    | Рівень | Опис |
    |------|-------------|
    | `default` | Стандартний рівень Bedrock |
    | `flex` | Обробка зі знижкою для навантажень, які можуть допускати більшу затримку |
    | `priority` | Пріоритетна обробка для чутливих до затримки навантажень |
    | `reserved` | Зарезервована місткість для стабільних навантажень |

    Установіть `serviceTier` (або `service_tier`) через `agents.defaults.params` для
    запитів до моделей Bedrock або окремо для моделі в
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    Допустимі значення: `default`, `flex`, `priority` і `reserved`. Не всі
    моделі підтримують усі рівні — якщо запитано непідтримуваний рівень, Bedrock
    поверне помилку валідації. Примітка: повідомлення про помилку дещо оманливе;
    воно може казати "The provided model identifier is invalid", а не вказувати
    на непідтримуваний рівень сервісу. Якщо ви бачите цю помилку, перевірте, чи модель
    підтримує запитаний рівень.

  </Accordion>

  <Accordion title="Температура Claude Opus 4.7">
    Bedrock відхиляє параметр `temperature` для Claude Opus 4.7. OpenClaw
    автоматично пропускає `temperature` для будь-якого Bedrock ref Opus 4.7, включно з
    ID foundation model, іменованими inference profiles, inference profiles застосунків,
    базова модель яких через `bedrock:GetInferenceProfile` визначається як Opus 4.7,
    а також варіантами з крапками `opus-4.7` з необов’язковими префіксами регіонів
    (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Ручка конфігурації не потрібна, а пропуск застосовується як до
    об’єкта параметрів запиту, так і до поля payload `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Використовуйте `amazon-bedrock/anthropic.claude-fable-5` у `us-east-1` або
    регіональні ідентифікатори інференсу, як-от `us.anthropic.claude-fable-5`.
    OpenClaw застосовує контекстне вікно Fable на 1 млн токенів, ліміт виводу 128K,
    завжди ввімкнене адаптивне мислення та підтримуване зіставлення рівнів зусиль. `/think off` і
    `/think minimal` зіставляються з `low`; непідтримувані параметри температури та примусового
    вибору інструмента пропускаються. Потоковий вивід утримується, доки Bedrock
    не поверне кінцевий статус, щоб відмови посеред потоку не розкривали частковий текст.
    Fable підтримує лише стандартний рівень сервісу; OpenClaw ігнорує налаштовані
    рівні `flex`, `priority` і `reserved` для цієї моделі.

    AWS вимагає явної згоди `provider_data_share` на збереження даних, перш ніж
    Fable стане доступною. Запити й завершення передаються Anthropic і
    зберігаються до 30 днів для довіри та безпеки. Перегляньте й налаштуйте
    [збереження даних Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    перед увімкненням моделі.

  </Accordion>

  <Accordion title="Захисні правила">
    Ви можете застосувати [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    до всіх викликів моделей Bedrock, додавши об'єкт `guardrail` до
    конфігурації Plugin `amazon-bedrock`. Захисні правила дають змогу застосовувати фільтрацію вмісту,
    заборону тем, фільтри слів, фільтри конфіденційної інформації та перевірки
    контекстного обґрунтування.

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

    | Параметр | Обов'язково | Опис |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Так | Ідентифікатор захисного правила (наприклад, `abc123`) або повний ARN (наприклад, `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Так | Номер опублікованої версії або `"DRAFT"` для робочої чернетки. |
    | `streamProcessingMode` | Ні | `"sync"` або `"async"` для оцінювання захисного правила під час потокової передачі. Якщо пропущено, Bedrock використовує своє значення за замовчуванням. |
    | `trace` | Ні | `"enabled"` або `"enabled_full"` для налагодження; пропустіть або встановіть `"disabled"` для продакшену. |

    <Warning>
    Суб'єкт IAM, який використовує Gateway, повинен мати дозвіл `bedrock:ApplyGuardrail` на додачу до стандартних дозволів на виклик.
    </Warning>

  </Accordion>

  <Accordion title="Ембеддинги для пошуку в пам'яті">
    Bedrock також може бути постачальником ембеддингів для
    [пошуку в пам'яті](/uk/concepts/memory-search). Це налаштовується окремо від
    постачальника інференсу -- установіть `agents.defaults.memorySearch.provider` у `"bedrock"`:

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

    Ембеддинги Bedrock використовують той самий ланцюжок облікових даних AWS SDK, що й інференс (ролі
    інстансів, SSO, ключі доступу, спільну конфігурацію та веб-ідентичність). API-ключ
    не потрібен. Явно встановіть `memorySearch.provider: "bedrock"`, щоб використовувати
    ембеддинги Bedrock.

    Підтримувані моделі ембеддингів включають Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) і TwelveLabs Marengo. Див.
    [довідник конфігурації пам'яті -- Bedrock](/uk/reference/memory-config#bedrock-embedding-config)
    для повного списку моделей і параметрів розмірності.

  </Accordion>

  <Accordion title="Примітки та застереження">
    - Bedrock вимагає ввімкненого **доступу до моделі** у вашому обліковому записі/регіоні AWS.
    - Для автоматичного виявлення потрібні дозволи `bedrock:ListFoundationModels` і
      `bedrock:ListInferenceProfiles`.
    - Якщо ви покладаєтеся на автоматичний режим, установіть один із підтримуваних маркерів середовища автентифікації AWS на
      хості Gateway. Якщо ви віддаєте перевагу автентифікації IMDS/спільної конфігурації без маркерів середовища, установіть
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw показує джерело облікових даних у такому порядку: `AWS_BEARER_TOKEN_BEDROCK`,
      потім `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, потім `AWS_PROFILE`, потім
      стандартний ланцюжок AWS SDK.
    - Підтримка міркування залежить від моделі; перевірте картку моделі Bedrock щодо
      поточних можливостей.
    - Якщо ви віддаєте перевагу керованому потоку ключів, ви також можете розмістити OpenAI-сумісний
      проксі перед Bedrock і налаштувати його як постачальника OpenAI.
  </Accordion>
</AccordionGroup>

## Пов'язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="Пошук у пам'яті" href="/uk/concepts/memory-search" icon="magnifying-glass">
    Ембеддинги Bedrock для конфігурації пошуку в пам'яті.
  </Card>
  <Card title="Довідник конфігурації пам'яті" href="/uk/reference/memory-config#bedrock-embedding-config" icon="database">
    Повний список моделей ембеддингів Bedrock і параметри розмірності.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
