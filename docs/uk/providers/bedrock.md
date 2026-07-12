---
read_when:
    - Ви хочете використовувати моделі Amazon Bedrock з OpenClaw
    - Для викликів моделі потрібно налаштувати облікові дані та регіон AWS
summary: Використання моделей Amazon Bedrock (Converse API) з OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T13:40:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw може використовувати моделі **Amazon Bedrock** через свого потокового провайдера **Bedrock Converse**. Автентифікація Bedrock використовує **стандартний ланцюжок облікових даних AWS SDK**, а не ключ API.

| Властивість | Значення                                                            |
| ----------- | ------------------------------------------------------------------- |
| Провайдер   | `amazon-bedrock`                                                     |
| API         | `bedrock-converse-stream`                                            |
| Автентифікація | облікові дані AWS (змінні середовища, спільна конфігурація або роль екземпляра) |
| Регіон      | `AWS_REGION` або `AWS_DEFAULT_REGION` (типово: `us-east-1`)          |

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключі доступу / змінні середовища">
    **Найкраще підходить для:** комп’ютерів розробників, CI або хостів, де ви безпосередньо керуєте обліковими даними AWS.

    <Steps>
      <Step title="Задайте облікові дані AWS на хості Gateway">
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
      <Step title="Додайте провайдера й модель Bedrock до конфігурації">
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
      <Step title="Перевірте доступність моделей">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    За автентифікації через маркери середовища (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` або `AWS_BEARER_TOKEN_BEDROCK`) OpenClaw автоматично вмикає неявного провайдера Bedrock для виявлення моделей без додаткової конфігурації.
    </Tip>

  </Tab>

  <Tab title="Ролі екземплярів EC2 (IMDS)">
    **Найкраще підходить для:** екземплярів EC2 із прив’язаною роллю IAM, які використовують службу метаданих екземпляра для автентифікації.

    <Steps>
      <Step title="Явно ввімкніть виявлення">
        Під час використання IMDS OpenClaw не може визначити автентифікацію AWS лише за маркерами середовища, тому її потрібно ввімкнути явно:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="За потреби додайте маркер середовища для автоматичного режиму">
        Якщо ви також хочете, щоб працював шлях автоматичного виявлення за маркерами середовища (наприклад, для інтерфейсів `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Підроблений ключ API **не** потрібен.
      </Step>
      <Step title="Перевірте виявлення моделей">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Роль IAM, прив’язана до вашого екземпляра EC2, повинна мати такі дозволи:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (для автоматичного виявлення)
    - `bedrock:ListInferenceProfiles` (для виявлення профілів інференсу)

    Або прив’яжіть керовану політику `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    `AWS_PROFILE=default` потрібен лише тоді, коли вам потрібен маркер середовища саме для автоматичного режиму або інтерфейсів стану. Фактичний шлях автентифікації середовища виконання Bedrock використовує стандартний ланцюжок AWS SDK, тому автентифікація через роль екземпляра IMDS працює навіть без маркерів середовища.
    </Note>

  </Tab>
</Tabs>

## Автоматичне виявлення моделей

OpenClaw може автоматично виявляти моделі Bedrock, які підтримують **потокове передавання**
та **текстовий вивід**. Для виявлення використовуються `bedrock:ListFoundationModels` і
`bedrock:ListInferenceProfiles`, а результати кешуються (типово: 1 година).

Як вмикається неявний провайдер:

- Якщо `plugins.entries.amazon-bedrock.config.discovery.enabled` має значення `true`,
  OpenClaw спробує виконати виявлення, навіть якщо маркера середовища AWS немає.
- Якщо `plugins.entries.amazon-bedrock.config.discovery.enabled` не задано,
  OpenClaw автоматично додає
  неявного провайдера Bedrock лише тоді, коли бачить один із таких маркерів автентифікації AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` або `AWS_PROFILE`.
- Фактичний шлях автентифікації середовища виконання Bedrock усе одно використовує стандартний ланцюжок AWS SDK, тому
  спільна конфігурація, SSO й автентифікація через роль екземпляра IMDS можуть працювати, навіть якщо для виявлення
  потрібно було явно встановити `enabled: true`.

<Note>
Для явних записів `models.providers["amazon-bedrock"]` OpenClaw усе одно може завчасно визначити автентифікацію Bedrock за маркерами середовища AWS, як-от `AWS_BEARER_TOKEN_BEDROCK`, не примушуючи завантажувати повну автентифікацію середовища виконання. Фактичний шлях автентифікації викликів моделей усе одно використовує стандартний ланцюжок AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Параметри конфігурації виявлення">
    Параметри конфігурації розміщено в `plugins.entries.amazon-bedrock.config.discovery`:

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

    | Параметр | Типове значення | Опис |
    | -------- | --------------- | ---- |
    | `enabled` | автоматично | В автоматичному режимі OpenClaw вмикає неявного провайдера Bedrock лише тоді, коли бачить підтримуваний маркер середовища AWS. Установіть `true`, щоб примусово виконувати виявлення. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Регіон AWS, який використовується для викликів API виявлення. |
    | `providerFilter` | (усі) | Зіставляє назви провайдерів Bedrock (наприклад, `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Тривалість кешування в секундах. Установіть `0`, щоб вимкнути кешування. |
    | `defaultContextWindow` | `32000` | Контекстне вікно для виявлених моделей без відомих обмежень токенів (перевизначте, якщо знаєте обмеження своєї моделі). |
    | `defaultMaxTokens` | `4096` | Максимальна кількість вихідних токенів для виявлених моделей без відомих обмежень токенів (перевизначте, якщо знаєте обмеження своєї моделі). |

  </Accordion>

  <Accordion title="Контекстне вікно й обмеження максимальної кількості токенів">
    API Bedrock `ListFoundationModels` і `GetFoundationModel` не повертають
    метаданих про обмеження токенів — лише ідентифікатор моделі, назву, модальності та
    стан життєвого циклу. OpenClaw містить таблицю відповідностей відомих контекстних вікон і
    обмежень виводу для популярних моделей Bedrock (Claude, Nova, Llama, Mistral, DeepSeek
    та інших), щоб керування сеансами, пороги Compaction і
    виявлення переповнення контексту правильно працювали для цих моделей.

    Для виявлених моделей, яких немає в таблиці, використовуються резервні значення `defaultContextWindow`
    і `defaultMaxTokens`. Якщо для використовуваної вами моделі немає точних обмежень,
    перевизначте їх явним записом
    `models.providers["amazon-bedrock"].models`.

  </Accordion>
</AccordionGroup>

## Швидке налаштування (шлях AWS)

Ця покрокова інструкція створює роль IAM, прив’язує дозволи Bedrock, пов’язує
профіль екземпляра та вмикає виявлення OpenClaw на хості EC2.

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
  <Accordion title="Профілі інференсу">
    OpenClaw виявляє **регіональні та глобальні профілі інференсу** разом із
    базовими моделями. Коли профіль зіставлено з відомою базовою моделлю,
    він успадковує можливості цієї моделі (контекстне вікно, максимальну кількість токенів,
    міркування, комп’ютерний зір), а правильний регіон запиту Bedrock підставляється
    автоматично. Завдяки цьому міжрегіональні профілі Claude працюють без ручного
    перевизначення провайдера. Глобальні міжрегіональні профілі (`global.*`) відображаються
    першими в `openclaw models list`, оскільки зазвичай забезпечують більшу пропускну здатність
    і автоматичне перемикання після відмови.

    Ідентифікатори профілів інференсу мають вигляд `us.anthropic.claude-opus-4-6-v1:0` (регіональний)
    або `anthropic.claude-opus-4-6-v1:0` (глобальний). Якщо базова модель уже
    є в результатах виявлення, профіль успадковує повний набір її можливостей;
    інакше застосовуються безпечні типові значення.

    Додаткова конфігурація не потрібна. Якщо виявлення ввімкнено, а суб’єкт IAM
    має дозвіл `bedrock:ListInferenceProfiles`, профілі відображаються поруч із
    базовими моделями в `openclaw models list`.

  </Accordion>

  <Accordion title="Рівень обслуговування">
    Деякі моделі Bedrock підтримують параметр `service_tier` для оптимізації вартості
    або затримки. Доступні такі рівні:

    | Рівень | Опис |
    |--------|------|
    | `default` | Стандартний рівень Bedrock |
    | `flex` | Обробка зі знижкою для навантажень, які допускають більшу затримку |
    | `priority` | Пріоритетна обробка для навантажень, чутливих до затримки |
    | `reserved` | Зарезервована потужність для сталих навантажень |

    Задайте `serviceTier` (або `service_tier`) через `agents.defaults.params` для
    запитів до моделей Bedrock або окремо для кожної моделі в
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

    Допустимі значення: `default`, `flex`, `priority` і `reserved`. Claude
    Fable 5 і Sonnet 5 підтримують лише рівень `default`; OpenClaw попереджає та
    ігнорує `flex`, `priority` або `reserved`, запитані для цих моделей. Для
    інших моделей не кожна модель підтримує кожен рівень — непідтримуваний рівень
    спричиняє помилку перевірки Bedrock, а повідомлення про помилку може вводити
    в оману (наприклад, «Наданий ідентифікатор моделі недійсний»
    замість зазначення рівня як причини проблеми). Якщо ви бачите цю помилку, перевірте,
    чи підтримує модель запитаний рівень.

  </Accordion>

  <Accordion title="Claude Opus 4.7 and 4.8 temperature">
    Bedrock відхиляє параметр `temperature` для Claude Opus 4.7 і Opus
    4.8. OpenClaw автоматично не додає `temperature` для будь-якого відповідного посилання Bedrock,
    зокрема ідентифікаторів базових моделей, іменованих профілів інференсу, прикладних
    профілів інференсу, базова модель яких визначається як Opus 4.7/4.8 через
    `bedrock:GetInferenceProfile`, і варіантів `opus-4.7`/`opus-4.8` із крапками
    та необов’язковими префіксами регіонів (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Додатковий параметр конфігурації не потрібен, а пропуск застосовується як до
    об’єкта параметрів запиту, так і до поля `inferenceConfig` корисного навантаження.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Використовуйте `amazon-bedrock/anthropic.claude-fable-5` у `us-east-1` або
    регіональні ідентифікатори інференсу, як-от `us.anthropic.claude-fable-5`.
    OpenClaw застосовує контекстне вікно Fable на 1 млн токенів, обмеження виведення у 128 тис. токенів,
    завжди активне адаптивне мислення та підтримуване зіставлення рівнів зусиль. `/think off` і
    `/think minimal` зіставляються з `low`; параметри температури та примусового вибору інструмента
    не додаються, як і в маршруті Opus 4.7/4.8. Потокове виведення утримується,
    доки Bedrock не поверне кінцевий стан, щоб відмови під час потоку не
    розкривали частковий текст.

    AWS вимагає явної згоди `provider_data_share` на зберігання даних, перш ніж
    Fable стане доступною. Запити й завершення передаються Anthropic і
    зберігаються до 30 днів для забезпечення довіри та безпеки. Перегляньте й налаштуйте
    [зберігання даних Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html),
    перш ніж вмикати модель.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 доступна через Bedrock лише для облікових записів із
    необхідним схваленням обмеженого доступу. OpenClaw розпізнає базову модель
    `anthropic.claude-mythos-5` і регіональні або глобальні профілі інференсу,
    як-от `us.anthropic.claude-mythos-5`.

    OpenClaw застосовує контекстне вікно на 1 000 000 токенів, обмеження виведення
    у 128 000 токенів, введення зображень, кешування запитів, безпечне щодо відмов
    потокове передавання та нативні рівні зусиль. Адаптивне мислення завжди ввімкнено: `/think off` і
    `/think minimal` зіставляються з `low`, тоді як `xhigh` і `max` залишаються доступними.
    Користувацькі значення семплювання та примусового вибору інструмента не додаються.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS документує Sonnet 5 для обох кінцевих точок:
    [`bedrock-runtime` і `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    OpenClaw розпізнає базову модель Bedrock
    `anthropic.claude-sonnet-5` і регіональні або глобальні профілі інференсу,
    як-от `us.anthropic.claude-sonnet-5`. Він застосовує контекстне вікно
    на 1 000 000 токенів, обмеження виведення у 128 000 токенів, введення зображень, нативні рівні зусиль,
    кешування запитів і безпечне щодо відмов потокове передавання.

    Bedrock залишає адаптивне мислення ввімкненим для Sonnet 5. OpenClaw за замовчуванням використовує
    `high`; `/think off` і `/think minimal` зіставляються з `low`, оскільки цей маршрут
    не може вимкнути мислення. Користувацькі значення температури та примусового вибору інструмента
    не додаються, доки адаптивне мислення активне.

  </Accordion>

  <Accordion title="Guardrails">
    Ви можете застосувати [захисні обмеження Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    до всіх викликів моделей Bedrock, додавши об’єкт `guardrail` до
    конфігурації плагіна `amazon-bedrock`. Захисні обмеження дають змогу примусово застосовувати фільтрацію вмісту,
    блокування тем, фільтри слів, фільтри конфіденційної інформації та перевірки
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

    `guardrailIdentifier` і `guardrailVersion` є обов’язковими.

    | Параметр | Опис |
    | ------ | ----------- |
    | `guardrailIdentifier` | Ідентифікатор захисного обмеження (наприклад, `abc123`) або повний ARN (наприклад, `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Номер опублікованої версії або `"DRAFT"` для робочої чернетки. |
    | `streamProcessingMode` | `"sync"` або `"async"` для оцінювання захисного обмеження під час потокового передавання. Якщо не вказано, Bedrock використовує значення за замовчуванням. |
    | `trace` | `"enabled"` або `"enabled_full"` для налагодження; не вказуйте або задайте `"disabled"` для робочого середовища. |

    <Warning>
    Суб’єкт IAM, який використовує Gateway, повинен мати дозвіл `bedrock:ApplyGuardrail` на додачу до стандартних дозволів на виклик.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    Bedrock також можна використовувати як постачальника векторних представлень для
    [пошуку в пам’яті](/uk/concepts/memory-search). Це налаштовується окремо від
    постачальника інференсу — задайте для `agents.defaults.memorySearch.provider` значення `"bedrock"`:

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

    Векторні представлення Bedrock використовують той самий ланцюжок облікових даних AWS SDK, що й інференс (ролі
    екземплярів, SSO, ключі доступу, спільна конфігурація та вебідентичність). Ключ API
    не потрібен.

    Підтримувані моделі векторних представлень включають Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) і TwelveLabs Marengo. Повний перелік моделей
    і параметри розмірності наведено в
    [довіднику з конфігурації пам’яті — Bedrock](/uk/reference/memory-config#bedrock-embedding-config).

  </Accordion>

  <Accordion title="Notes and caveats">
    - Bedrock вимагає ввімкненого **доступу до моделі** у вашому обліковому записі/регіоні AWS.
    - Для автоматичного виявлення потрібні дозволи `bedrock:ListFoundationModels` і
      `bedrock:ListInferenceProfiles`.
    - Якщо ви покладаєтеся на автоматичний режим, задайте один із підтримуваних маркерів середовища автентифікації AWS на
      хості Gateway. Якщо ви віддаєте перевагу автентифікації IMDS/спільної конфігурації без маркерів середовища, задайте
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw показує джерело облікових даних у такому порядку: `AWS_BEARER_TOKEN_BEDROCK`,
      потім `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, потім `AWS_PROFILE`, а далі
      стандартний ланцюжок AWS SDK.
    - Підтримка міркування залежить від моделі; перевіряйте актуальні можливості
      в картці моделі Bedrock.
    - Якщо ви віддаєте перевагу керованому процесу роботи з ключами, також можна розмістити сумісний з OpenAI
      проксі перед Bedrock і натомість налаштувати його як постачальника OpenAI.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки перемикання після відмови.
  </Card>
  <Card title="Memory search" href="/uk/concepts/memory-search" icon="magnifying-glass">
    Векторні представлення Bedrock для налаштування пошуку в пам’яті.
  </Card>
  <Card title="Memory config reference" href="/uk/reference/memory-config#bedrock-embedding-config" icon="database">
    Повний перелік моделей векторних представлень Bedrock і параметри розмірності.
  </Card>
  <Card title="Troubleshooting" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
