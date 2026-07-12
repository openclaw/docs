---
read_when:
    - Вы хотите использовать модели Amazon Bedrock с OpenClaw
    - Для вызовов модели необходимо настроить учетные данные AWS и регион
summary: Использование моделей Amazon Bedrock (Converse API) с OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T11:46:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw может использовать модели **Amazon Bedrock** через потоковый провайдер **Bedrock Converse**. Для аутентификации в Bedrock используется **стандартная цепочка учетных данных AWS SDK**, а не ключ API.

| Свойство | Значение                                                              |
| -------- | --------------------------------------------------------------------- |
| Провайдер | `amazon-bedrock`                                                       |
| API      | `bedrock-converse-stream`                                              |
| Аутентификация | Учетные данные AWS (переменные окружения, общая конфигурация или роль экземпляра) |
| Регион   | `AWS_REGION` или `AWS_DEFAULT_REGION` (по умолчанию: `us-east-1`)      |

## Начало работы

Выберите предпочтительный метод аутентификации и выполните шаги настройки.

<Tabs>
  <Tab title="Ключи доступа / переменные окружения">
    **Лучше всего подходит для:** компьютеров разработчиков, CI и хостов, на которых вы управляете учетными данными AWS напрямую.

    <Steps>
      <Step title="Задайте учетные данные AWS на хосте Gateway">
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
      <Step title="Добавьте провайдер и модель Bedrock в конфигурацию">
        `apiKey` не требуется. Настройте провайдер с параметром `auth: "aws-sdk"`:

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
      <Step title="Убедитесь, что модели доступны">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    При аутентификации по маркерам окружения (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` или `AWS_BEARER_TOKEN_BEDROCK`) OpenClaw автоматически включает неявный провайдер Bedrock для обнаружения моделей без дополнительной конфигурации.
    </Tip>

  </Tab>

  <Tab title="Роли экземпляров EC2 (IMDS)">
    **Лучше всего подходит для:** экземпляров EC2 с назначенной ролью IAM, использующих для аутентификации службу метаданных экземпляра.

    <Steps>
      <Step title="Явно включите обнаружение">
        При использовании IMDS OpenClaw не может определить наличие аутентификации AWS только по маркерам окружения, поэтому ее необходимо включить явно:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="При необходимости добавьте маркер окружения для автоматического режима">
        Если вы также хотите использовать автоматическое обнаружение по маркерам окружения, например в интерфейсах `openclaw status`:

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Поддельный ключ API **не** требуется.
      </Step>
      <Step title="Убедитесь, что модели обнаружены">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Роль IAM, назначенная экземпляру EC2, должна иметь следующие разрешения:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (для автоматического обнаружения)
    - `bedrock:ListInferenceProfiles` (для обнаружения профилей вывода)

    Либо назначьте управляемую политику `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    `AWS_PROFILE=default` требуется только в том случае, если вам нужен маркер окружения для автоматического режима или интерфейсов состояния. Фактический путь аутентификации среды выполнения Bedrock использует стандартную цепочку AWS SDK, поэтому аутентификация с помощью роли экземпляра IMDS работает и без маркеров окружения.
    </Note>

  </Tab>
</Tabs>

## Автоматическое обнаружение моделей

OpenClaw может автоматически обнаруживать модели Bedrock, поддерживающие **потоковую передачу**
и **текстовый вывод**. Для обнаружения используются `bedrock:ListFoundationModels` и
`bedrock:ListInferenceProfiles`, а результаты кэшируются (по умолчанию на 1 час).

Как включается неявный провайдер:

- Если `plugins.entries.amazon-bedrock.config.discovery.enabled` имеет значение `true`,
  OpenClaw попытается выполнить обнаружение, даже если маркер окружения AWS отсутствует.
- Если `plugins.entries.amazon-bedrock.config.discovery.enabled` не задан,
  OpenClaw автоматически добавляет
  неявный провайдер Bedrock только при наличии одного из следующих маркеров аутентификации AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` или `AWS_PROFILE`.
- Фактический путь аутентификации среды выполнения Bedrock по-прежнему использует стандартную цепочку AWS SDK, поэтому
  общая конфигурация, SSO и аутентификация с помощью роли экземпляра IMDS могут работать, даже если для включения
  обнаружения требовалось задать `enabled: true`.

<Note>
Для явных записей `models.providers["amazon-bedrock"]` OpenClaw по-прежнему может заранее определять аутентификацию Bedrock по маркерам окружения AWS, таким как `AWS_BEARER_TOKEN_BEDROCK`, не выполняя полную загрузку аутентификации среды выполнения. Фактический путь аутентификации при вызове модели по-прежнему использует стандартную цепочку AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Параметры конфигурации обнаружения">
    Параметры конфигурации находятся в `plugins.entries.amazon-bedrock.config.discovery`:

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

    | Параметр | По умолчанию | Описание |
    | ------ | ------- | ----------- |
    | `enabled` | автоматически | В автоматическом режиме OpenClaw включает неявный провайдер Bedrock только при наличии поддерживаемого маркера окружения AWS. Задайте `true`, чтобы принудительно включить обнаружение. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Регион AWS, используемый для вызовов API обнаружения. |
    | `providerFilter` | (все) | Сопоставляется с именами провайдеров Bedrock, например `anthropic` и `amazon`. |
    | `refreshInterval` | `3600` | Срок хранения кэша в секундах. Задайте `0`, чтобы отключить кэширование. |
    | `defaultContextWindow` | `32000` | Размер контекстного окна для обнаруженных моделей без известных ограничений токенов. Переопределите его, если вам известны ограничения модели. |
    | `defaultMaxTokens` | `4096` | Максимальное количество выходных токенов для обнаруженных моделей без известных ограничений токенов. Переопределите его, если вам известны ограничения модели. |

  </Accordion>

  <Accordion title="Контекстное окно и ограничения количества токенов">
    API Bedrock `ListFoundationModels` и `GetFoundationModel` не возвращают
    метаданные об ограничениях токенов — только идентификатор и имя модели, модальности и состояние
    жизненного цикла. OpenClaw поставляется с таблицей известных размеров контекстного окна и ограничений
    вывода для популярных моделей Bedrock (Claude, Nova, Llama, Mistral, DeepSeek
    и других), чтобы управление сеансами, пороговые значения Compaction и
    обнаружение переполнения контекста работали для этих моделей правильно.

    Для обнаруженных моделей, отсутствующих в таблице, используются резервные значения `defaultContextWindow`
    и `defaultMaxTokens`. Если для используемой вами модели отсутствуют точные ограничения,
    переопределите их с помощью явной записи
    `models.providers["amazon-bedrock"].models`.

  </Accordion>
</AccordionGroup>

## Быстрая настройка (путь AWS)

В этом пошаговом руководстве создается роль IAM, назначаются разрешения Bedrock, привязывается
профиль экземпляра и включается обнаружение OpenClaw на хосте EC2.

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

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Профили вывода">
    OpenClaw обнаруживает **региональные и глобальные профили вывода** вместе
    с базовыми моделями. Когда профиль сопоставляется с известной базовой моделью,
    он наследует возможности этой модели (контекстное окно, максимальное количество токенов,
    рассуждение, компьютерное зрение), а правильный регион запроса Bedrock подставляется
    автоматически. Благодаря этому межрегиональные профили Claude работают без ручного
    переопределения провайдера. Глобальные межрегиональные профили (`global.*`) отображаются
    первыми в `openclaw models list`, поскольку обычно обеспечивают большую доступную мощность
    и автоматическое переключение при сбое.

    Идентификаторы профилей вывода выглядят как `us.anthropic.claude-opus-4-6-v1:0` (региональный)
    или `anthropic.claude-opus-4-6-v1:0` (глобальный). Если базовая модель уже
    присутствует в результатах обнаружения, профиль наследует полный набор ее возможностей;
    в противном случае применяются безопасные значения по умолчанию.

    Дополнительная конфигурация не требуется. Если обнаружение включено, а субъект IAM
    имеет разрешение `bedrock:ListInferenceProfiles`, профили отображаются рядом
    с базовыми моделями в `openclaw models list`.

  </Accordion>

  <Accordion title="Уровень обслуживания">
    Некоторые модели Bedrock поддерживают параметр `service_tier` для оптимизации стоимости
    или задержки. Доступны следующие уровни:

    | Уровень | Описание |
    |------|-------------|
    | `default` | Стандартный уровень Bedrock |
    | `flex` | Обработка со скидкой для рабочих нагрузок, допускающих более длительную задержку |
    | `priority` | Приоритетная обработка для рабочих нагрузок, чувствительных к задержке |
    | `reserved` | Зарезервированная мощность для рабочих нагрузок с постоянной нагрузкой |

    Задайте `serviceTier` (или `service_tier`) через `agents.defaults.params` для
    запросов к моделям Bedrock либо отдельно для каждой модели в
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

    Допустимые значения: `default`, `flex`, `priority` и `reserved`. Claude
    Fable 5 и Sonnet 5 поддерживают только уровень `default`; OpenClaw выводит
    предупреждение и игнорирует `flex`, `priority` или `reserved`, запрошенные
    для этих моделей. Для других моделей также поддерживаются не все уровни:
    неподдерживаемый уровень приводит к ошибке проверки Bedrock, причём
    сообщение об ошибке может вводить в заблуждение (например, «Указан
    недопустимый идентификатор модели» вместо указания уровня как причины
    проблемы). Если вы видите эту ошибку, проверьте, поддерживает ли модель
    запрошенный уровень.

  </Accordion>

  <Accordion title="Температура Claude Opus 4.7 и 4.8">
    Bedrock отклоняет параметр `temperature` для Claude Opus 4.7 и Opus 4.8.
    OpenClaw автоматически исключает `temperature` для любой соответствующей
    ссылки Bedrock, включая идентификаторы базовых моделей, именованные профили
    логического вывода, профили логического вывода приложений, базовая модель
    которых определяется как Opus 4.7/4.8 через `bedrock:GetInferenceProfile`,
    а также варианты `opus-4.7`/`opus-4.8` с точечной нотацией и необязательными
    префиксами регионов (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Дополнительный параметр конфигурации не требуется; исключение
    применяется как к объекту параметров запроса, так и к полю `inferenceConfig`
    полезной нагрузки.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Используйте `amazon-bedrock/anthropic.claude-fable-5` в `us-east-1` или
    региональные идентификаторы логического вывода, например
    `us.anthropic.claude-fable-5`. OpenClaw применяет контекстное окно Fable
    размером 1 млн токенов, ограничение вывода в 128 тыс. токенов, постоянно
    включённое адаптивное мышление и поддерживаемое сопоставление уровней
    усилий. `/think off` и `/think minimal` соответствуют `low`; параметры
    температуры и принудительного выбора инструментов исключаются, как и в
    маршруте Opus 4.7/4.8. Потоковый вывод задерживается до получения от
    Bedrock конечного статуса, чтобы отказы во время потоковой передачи не
    раскрывали частичный текст.

    Прежде чем Fable станет доступен, AWS требует явного согласия
    `provider_data_share` на хранение данных. Запросы и результаты передаются
    Anthropic и хранятся до 30 дней в целях обеспечения доверия и безопасности.
    Перед включением модели ознакомьтесь с политикой
    [хранения данных Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    и настройте соответствующие параметры.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 доступен через Bedrock только для учётных записей,
    получивших необходимое разрешение на ограниченный доступ. OpenClaw
    распознаёт базовую модель `anthropic.claude-mythos-5`, а также региональные
    и глобальные профили логического вывода, например
    `us.anthropic.claude-mythos-5`.

    OpenClaw применяет контекстное окно размером 1 000 000 токенов, ограничение
    вывода в 128 000 токенов, ввод изображений, кэширование запросов, безопасную
    при отказах потоковую передачу и встроенные уровни усилий. Адаптивное
    мышление включено всегда: `/think off` и `/think minimal` соответствуют
    `low`, а `xhigh` и `max` остаются доступными. Пользовательские параметры
    сэмплирования и принудительного выбора инструментов исключаются.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    В документации AWS указана поддержка Sonnet 5 как для конечной точки
    [`bedrock-runtime`, так и для `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    OpenClaw распознаёт базовую модель Bedrock `anthropic.claude-sonnet-5` и
    региональные или глобальные профили логического вывода, например
    `us.anthropic.claude-sonnet-5`. Он применяет контекстное окно размером
    1 000 000 токенов, ограничение вывода в 128 000 токенов, ввод изображений,
    встроенные уровни усилий, кэширование запросов и безопасную при отказах
    потоковую передачу.

    Bedrock оставляет адаптивное мышление включённым для Sonnet 5. По умолчанию
    OpenClaw использует `high`; `/think off` и `/think minimal` соответствуют
    `low`, поскольку этот маршрут не позволяет отключить мышление.
    Пользовательские значения температуры и принудительного выбора инструментов
    исключаются, пока активно адаптивное мышление.

  </Accordion>

  <Accordion title="Защитные механизмы">
    Вы можете применять
    [защитные механизмы Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    ко всем вызовам моделей Bedrock, добавив объект `guardrail` в конфигурацию
    Plugin `amazon-bedrock`. Защитные механизмы позволяют применять фильтрацию
    содержимого, запрет тем, фильтры слов, фильтры конфиденциальной информации и
    проверки контекстной обоснованности.

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

    Параметры `guardrailIdentifier` и `guardrailVersion` обязательны.

    | Параметр | Описание |
    | ------ | ----------- |
    | `guardrailIdentifier` | Идентификатор защитного механизма (например, `abc123`) или полный ARN (например, `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Номер опубликованной версии или `"DRAFT"` для рабочего черновика. |
    | `streamProcessingMode` | `"sync"` или `"async"` для проверки защитным механизмом во время потоковой передачи. Если параметр не указан, Bedrock использует значение по умолчанию. |
    | `trace` | `"enabled"` или `"enabled_full"` для отладки; в рабочей среде не указывайте параметр или задайте `"disabled"`. |

    <Warning>
    Субъект IAM, используемый Gateway, должен иметь разрешение `bedrock:ApplyGuardrail` в дополнение к стандартным разрешениям на вызов.
    </Warning>

  </Accordion>

  <Accordion title="Векторные представления для поиска по памяти">
    Bedrock также может служить поставщиком векторных представлений для
    [поиска по памяти](/ru/concepts/memory-search). Он настраивается отдельно от
    поставщика логического вывода: задайте для
    `agents.defaults.memorySearch.provider` значение `"bedrock"`:

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

    Векторные представления Bedrock используют ту же цепочку учётных данных
    AWS SDK, что и логический вывод: роли экземпляров, SSO, ключи доступа, общую
    конфигурацию и веб-идентификацию. Ключ API не требуется.

    Поддерживаемые модели векторных представлений включают Amazon Titan Embed
    (v1, v2), Amazon Nova Embed, Cohere Embed (v3, v4) и TwelveLabs Marengo.
    Полный список моделей и варианты размерности приведены в
    [справочнике по настройке памяти — Bedrock](/ru/reference/memory-config#bedrock-embedding-config).

  </Accordion>

  <Accordion title="Примечания и предостережения">
    - Для Bedrock в вашей учётной записи и регионе AWS должен быть включён
      **доступ к моделям**.
    - Для автоматического обнаружения необходимы разрешения
      `bedrock:ListFoundationModels` и `bedrock:ListInferenceProfiles`.
    - Если вы используете автоматический режим, задайте на узле Gateway один из
      поддерживаемых маркеров переменных среды для аутентификации AWS. Если вы
      предпочитаете аутентификацию через IMDS или общую конфигурацию без
      маркеров переменных среды, задайте
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw отображает источник учётных данных в следующем порядке:
      `AWS_BEARER_TOKEN_BEDROCK`, затем `AWS_ACCESS_KEY_ID` +
      `AWS_SECRET_ACCESS_KEY`, затем `AWS_PROFILE`, после чего используется
      стандартная цепочка AWS SDK.
    - Поддержка рассуждений зависит от модели; актуальные возможности указаны
      в карточке модели Bedrock.
    - Если вы предпочитаете управляемую работу с ключами, можно также
      разместить перед Bedrock прокси-сервер, совместимый с OpenAI, и настроить
      его как поставщика OpenAI.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор поставщиков, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Поиск по памяти" href="/ru/concepts/memory-search" icon="magnifying-glass">
    Настройка векторных представлений Bedrock для поиска по памяти.
  </Card>
  <Card title="Справочник по настройке памяти" href="/ru/reference/memory-config#bedrock-embedding-config" icon="database">
    Полный список моделей векторных представлений Bedrock и варианты размерности.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общие рекомендации по устранению неполадок и часто задаваемые вопросы.
  </Card>
</CardGroup>
