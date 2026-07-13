---
read_when:
    - Вы хотите использовать модели Amazon Bedrock с OpenClaw
    - Для вызовов модели необходимо настроить учетные данные и регион AWS
summary: Использование моделей Amazon Bedrock (Converse API) с OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-13T20:11:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw может использовать модели **Amazon Bedrock** через свой потоковый провайдер **Bedrock Converse**.
Для аутентификации Bedrock используется **стандартная цепочка учётных данных AWS SDK**,
а не ключ API.

| Свойство | Значение                                                       |
| -------- | ----------------------------------------------------------- |
| Провайдер | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Аутентификация     | Учётные данные AWS (переменные окружения, общий файл конфигурации или роль экземпляра) |
| Регион   | `AWS_REGION` или `AWS_DEFAULT_REGION` (по умолчанию: `us-east-1`) |

## Начало работы

Выберите предпочтительный метод аутентификации и выполните шаги настройки.

<Tabs>
  <Tab title="Ключи доступа / переменные окружения">
    **Лучше всего подходит для:** компьютеров разработчиков, CI или хостов, на которых вы управляете учётными данными AWS напрямую.

    <Steps>
      <Step title="Задайте учётные данные AWS на хосте Gateway">
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
        `apiKey` не требуется. Настройте провайдер с помощью `auth: "aws-sdk"`:

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
    **Лучше всего подходит для:** экземпляров EC2 с назначенной ролью IAM, использующих службу метаданных экземпляра для аутентификации.

    <Steps>
      <Step title="Явно включите обнаружение">
        При использовании IMDS OpenClaw не может определить аутентификацию AWS только по маркерам окружения, поэтому её необходимо включить явно:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="При необходимости добавьте маркер окружения для автоматического режима">
        Если вы также хотите, чтобы работал путь автоматического обнаружения по маркеру окружения (например, для поверхностей `openclaw status`):

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
    Роль IAM, назначенная вашему экземпляру EC2, должна иметь следующие разрешения:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (для автоматического обнаружения)
    - `bedrock:ListInferenceProfiles` (для обнаружения профилей вывода)

    Или назначьте управляемую политику `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    `AWS_PROFILE=default` требуется только в том случае, если вам нужен маркер окружения для автоматического режима или поверхностей состояния. Фактический путь аутентификации среды выполнения Bedrock использует стандартную цепочку AWS SDK, поэтому аутентификация через роль экземпляра IMDS работает даже без маркеров окружения.
    </Note>

  </Tab>
</Tabs>

## Автоматическое обнаружение моделей

OpenClaw может автоматически обнаруживать модели Bedrock, поддерживающие **потоковую передачу**
и **текстовый вывод**. Для обнаружения используются `bedrock:ListFoundationModels` и
`bedrock:ListInferenceProfiles`, а результаты кэшируются (по умолчанию: 1 час).

Как включается неявный провайдер:

- Если `plugins.entries.amazon-bedrock.config.discovery.enabled` имеет значение `true`,
  OpenClaw попытается выполнить обнаружение, даже если маркер окружения AWS отсутствует.
- Если `plugins.entries.amazon-bedrock.config.discovery.enabled` не задан,
  OpenClaw автоматически добавляет
  неявный провайдер Bedrock, только если обнаружен один из следующих маркеров аутентификации AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` или `AWS_PROFILE`.
- Фактический путь аутентификации среды выполнения Bedrock по-прежнему использует стандартную цепочку AWS SDK, поэтому
  общий файл конфигурации, SSO и аутентификация через роль экземпляра IMDS могут работать, даже если для обнаружения
  потребовался `enabled: true`, чтобы включить его явно.

<Note>
Для явных записей `models.providers["amazon-bedrock"]` OpenClaw по-прежнему может на раннем этапе определять аутентификацию Bedrock по маркерам окружения AWS, таким как `AWS_BEARER_TOKEN_BEDROCK`, не загружая принудительно полную аутентификацию среды выполнения. Фактический путь аутентификации вызовов модели по-прежнему использует стандартную цепочку AWS SDK.
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
    | `enabled` | auto | В автоматическом режиме OpenClaw включает неявный провайдер Bedrock, только если обнаружен поддерживаемый маркер окружения AWS. Установите `true`, чтобы принудительно включить обнаружение. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Регион AWS, используемый для вызовов API обнаружения. |
    | `providerFilter` | (все) | Соответствует именам провайдеров Bedrock (например, `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Время хранения кэша в секундах. Установите `0`, чтобы отключить кэширование. |
    | `defaultContextWindow` | `32000` | Размер контекстного окна для обнаруженных моделей без известных ограничений токенов (переопределите, если знаете ограничения своей модели). |
    | `defaultMaxTokens` | `4096` | Максимальное количество выходных токенов для обнаруженных моделей без известных ограничений токенов (переопределите, если знаете ограничения своей модели). |

  </Accordion>

  <Accordion title="Контекстное окно и ограничения максимального количества токенов">
    API Bedrock `ListFoundationModels` и `GetFoundationModel` не возвращают
    метаданные об ограничениях токенов, а только идентификатор и имя модели, модальности и состояние
    жизненного цикла. OpenClaw поставляется с таблицей соответствий известных размеров контекстных окон и ограничений
    вывода для популярных моделей Bedrock (Claude, Nova, Llama, Mistral, DeepSeek
    и других), чтобы управление сеансами, пороговые значения Compaction и
    обнаружение переполнения контекста работали для этих моделей корректно.

    Для обнаруженных моделей, отсутствующих в таблице, используются резервные значения `defaultContextWindow`
    и `defaultMaxTokens`. Если для используемой вами модели отсутствуют точные ограничения,
    переопределите их с помощью явной записи
    `models.providers["amazon-bedrock"].models`.

  </Accordion>
</AccordionGroup>

## Быстрая настройка (путь AWS)

В этом пошаговом руководстве создаётся роль IAM, назначаются разрешения Bedrock, связывается
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
    OpenClaw обнаруживает **региональные и глобальные профили вывода** вместе с
    базовыми моделями. Когда профиль сопоставлен с известной базовой моделью,
    он наследует возможности этой модели (контекстное окно, максимальное количество токенов,
    рассуждение, компьютерное зрение), а правильный регион запроса Bedrock подставляется
    автоматически. Благодаря этому межрегиональные профили Claude работают без ручного
    переопределения провайдера. Глобальные межрегиональные профили (`global.*`) отображаются
    первыми в `openclaw models list`, поскольку обычно обеспечивают большую пропускную способность
    и автоматическое переключение при сбое.

    Идентификаторы профилей вывода выглядят как `us.anthropic.claude-opus-4-6-v1:0` (региональный)
    или `anthropic.claude-opus-4-6-v1:0` (глобальный). Если базовая модель уже присутствует
    в результатах обнаружения, профиль наследует полный набор её возможностей;
    в противном случае применяются безопасные значения по умолчанию.

    Дополнительная настройка не требуется. Если обнаружение включено и субъект IAM
    имеет разрешение `bedrock:ListInferenceProfiles`, профили отображаются вместе с
    базовыми моделями в `openclaw models list`.

  </Accordion>

  <Accordion title="Уровень обслуживания">
    Некоторые модели Bedrock поддерживают параметр `service_tier` для оптимизации стоимости
    или задержки. Доступны следующие уровни:

    | Уровень | Описание |
    |------|-------------|
    | `default` | Стандартный уровень Bedrock |
    | `flex` | Обработка со скидкой для рабочих нагрузок, допускающих более высокую задержку |
    | `priority` | Приоритетная обработка для рабочих нагрузок, чувствительных к задержке |
    | `reserved` | Зарезервированная мощность для рабочих нагрузок в установившемся режиме |

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
    Fable 5 и Sonnet 5 поддерживают только уровень `default`; OpenClaw выводит предупреждение и
    игнорирует `flex`, `priority` или `reserved`, запрошенные для этих моделей. Для
    других моделей поддерживаются не все уровни — неподдерживаемый уровень
    приводит к ошибке проверки Bedrock, при этом сообщение об ошибке может
    вводить в заблуждение (например, «The provided model identifier is invalid»
    вместо указания уровня как причины проблемы). Если вы видите эту ошибку, проверьте,
    поддерживает ли модель запрошенный уровень.

  </Accordion>

  <Accordion title="Температура Claude Opus 4.7 и 4.8">
    Bedrock отклоняет параметр `temperature` для Claude Opus 4.7 и Opus
    4.8. OpenClaw автоматически исключает `temperature` для любой соответствующей ссылки Bedrock,
    включая идентификаторы базовых моделей, именованные профили вывода, прикладные
    профили вывода, базовая модель которых через
    `bedrock:GetInferenceProfile` разрешается в Opus 4.7/4.8, а также варианты с точечной записью
    `opus-4.7`/`opus-4.8` и необязательными префиксами регионов (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Дополнительный параметр конфигурации не требуется, и исключение применяется как к
    объекту параметров запроса, так и к полю полезной нагрузки `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Используйте `amazon-bedrock/anthropic.claude-fable-5` в `us-east-1` или
    региональные идентификаторы вывода, например `us.anthropic.claude-fable-5`.
    OpenClaw применяет окно контекста Fable размером 1M, ограничение вывода 128K, постоянно включённое
    адаптивное мышление и поддерживаемое сопоставление уровней усилий. `/think off` и
    `/think minimal` сопоставляются с `low`; температура и элементы управления принудительным выбором инструмента
    исключаются, как и в маршруте Opus 4.7/4.8. Потоковый вывод удерживается
    до получения от Bedrock конечного статуса, чтобы отказы в середине потока не
    раскрывали частичный текст.

    Прежде чем Fable станет доступна, AWS требует явно согласиться на хранение данных
    с помощью `provider_data_share`. Запросы и ответы передаются Anthropic и
    хранятся до 30 дней в целях обеспечения доверия и безопасности. Ознакомьтесь с
    [хранением данных Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    и настройте его перед включением модели.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 доступна через Bedrock только для учётных записей,
    получивших необходимое разрешение на ограниченный доступ. OpenClaw распознаёт базовую модель
    `anthropic.claude-mythos-5` и региональные или глобальные профили вывода, например
    `us.anthropic.claude-mythos-5`.

    OpenClaw применяет окно контекста на 1,000,000 токенов, ограничение вывода
    на 128,000 токенов, ввод изображений, кэширование запросов, безопасную при отказах потоковую передачу
    и встроенные уровни усилий. Адаптивное мышление включено всегда: `/think off` и
    `/think minimal` сопоставляются с `low`, а `xhigh` и `max` остаются доступными.
    Пользовательские значения сэмплирования и принудительного выбора инструмента исключаются.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    В документации AWS Sonnet 5 указана для обеих
    [конечных точек `bedrock-runtime` и `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    OpenClaw распознаёт базовую модель Bedrock
    `anthropic.claude-sonnet-5` и региональные или глобальные профили вывода, например
    `us.anthropic.claude-sonnet-5`. Он применяет окно контекста на 1,000,000 токенов,
    ограничение вывода на 128,000 токенов, ввод изображений, встроенные уровни усилий,
    кэширование запросов и безопасную при отказах потоковую передачу.

    Bedrock сохраняет адаптивное мышление включённым для Sonnet 5. По умолчанию OpenClaw использует
    `high`; `/think off` и `/think minimal` сопоставляются с `low`, поскольку этот маршрут
    не позволяет отключить мышление. Пользовательские значения температуры и принудительного выбора инструмента
    исключаются, пока адаптивное мышление активно.

  </Accordion>

  <Accordion title="Защитные механизмы">
    Вы можете применять [защитные механизмы Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    ко всем вызовам моделей Bedrock, добавив объект `guardrail` в
    конфигурацию плагина `amazon-bedrock`. Защитные механизмы позволяют применять фильтрацию содержимого,
    блокировку тем, фильтры слов, фильтры конфиденциальной информации и проверки
    контекстной обоснованности.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // идентификатор защитного механизма или полный ARN
                guardrailVersion: "1", // номер версии или "DRAFT"
                streamProcessingMode: "sync", // необязательно: "sync" или "async"
                trace: "enabled", // необязательно: "enabled", "disabled" или "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    `guardrailIdentifier` и `guardrailVersion` обязательны.

    | Параметр | Описание |
    | ------ | ----------- |
    | `guardrailIdentifier` | Идентификатор защитного механизма (например, `abc123`) или полный ARN (например, `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Номер опубликованной версии или `"DRAFT"` для рабочего черновика. |
    | `streamProcessingMode` | `"sync"` или `"async"` для оценки защитного механизма во время потоковой передачи. Если параметр не указан, Bedrock использует значение по умолчанию. |
    | `trace` | `"enabled"` или `"enabled_full"` для отладки; в рабочей среде не указывайте параметр или задайте `"disabled"`. |

    <Warning>
    Субъект IAM, используемый Gateway, должен иметь разрешение `bedrock:ApplyGuardrail` в дополнение к стандартным разрешениям на вызов.
    </Warning>

  </Accordion>

  <Accordion title="Векторные представления для поиска по памяти">
    Bedrock также можно использовать как поставщика векторных представлений для
    [поиска по памяти](/ru/concepts/memory-search). Он настраивается отдельно от
    поставщика вывода — задайте для `agents.defaults.memorySearch.provider` значение `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // по умолчанию
          },
        },
      },
    }
    ```

    Векторные представления Bedrock используют ту же цепочку учётных данных AWS SDK, что и вывод (роли
    экземпляров, SSO, ключи доступа, общую конфигурацию и веб-идентификацию). Ключ API
    не требуется.

    Поддерживаемые модели векторных представлений включают Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) и TwelveLabs Marengo. Полный список моделей
    и варианты размерности см. в разделе
    [Справочник по конфигурации памяти — Bedrock](/ru/reference/memory-config#bedrock-embedding-config).

  </Accordion>

  <Accordion title="Примечания и ограничения">
    - Для Bedrock необходимо включить **доступ к моделям** в вашей учётной записи/регионе AWS.
    - Для автоматического обнаружения необходимы разрешения `bedrock:ListFoundationModels` и
      `bedrock:ListInferenceProfiles`.
    - Если вы используете автоматический режим, задайте один из поддерживаемых маркеров переменных среды аутентификации AWS на
      хосте Gateway. Если вы предпочитаете аутентификацию IMDS/общей конфигурации без маркеров переменных среды, задайте
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw отображает источник учётных данных в следующем порядке: `AWS_BEARER_TOKEN_BEDROCK`,
      затем `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, затем `AWS_PROFILE`, после чего —
      стандартная цепочка AWS SDK.
    - Поддержка рассуждений зависит от модели; актуальные возможности
      см. в карточке модели Bedrock.
    - Если вы предпочитаете управляемую работу с ключами, можно также разместить перед Bedrock
      прокси-сервер, совместимый с OpenAI, и настроить его как поставщика OpenAI.
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
  <Card title="Справочник по конфигурации памяти" href="/ru/reference/memory-config#bedrock-embedding-config" icon="database">
    Полный список моделей векторных представлений Bedrock и варианты размерности.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общие сведения об устранении неполадок и часто задаваемые вопросы.
  </Card>
</CardGroup>
