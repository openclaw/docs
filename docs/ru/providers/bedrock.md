---
read_when:
    - Вы хотите использовать модели Amazon Bedrock с OpenClaw
    - Вам нужно настроить учетные данные и регион AWS для вызовов модели
summary: Используйте модели Amazon Bedrock (Converse API) с OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-28T23:35:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw может использовать модели **Amazon Bedrock** через свой потоковый провайдер **Bedrock Converse**. Аутентификация Bedrock использует **цепочку учетных данных по умолчанию AWS SDK**, а не API-ключ.

| Свойство | Значение                                                       |
| -------- | ----------------------------------------------------------- |
| Провайдер | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Аутентификация | учетные данные AWS (переменные окружения, общий config или роль инстанса) |
| Регион   | `AWS_REGION` или `AWS_DEFAULT_REGION` (по умолчанию: `us-east-1`) |

## Начало работы

Выберите предпочитаемый метод аутентификации и выполните шаги настройки.

<Tabs>
  <Tab title="Access keys / env vars">
    **Лучше всего подходит для:** машин разработчиков, CI или хостов, где вы напрямую управляете учетными данными AWS.

    <Steps>
      <Step title="Set AWS credentials on the gateway host">
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
      <Step title="Add a Bedrock provider and model to your config">
        `apiKey` не требуется. Настройте провайдер с `auth: "aws-sdk"`:

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
      <Step title="Verify models are available">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    При аутентификации через маркеры окружения (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` или `AWS_BEARER_TOKEN_BEDROCK`) OpenClaw автоматически включает неявный провайдер Bedrock для обнаружения моделей без дополнительного config.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **Лучше всего подходит для:** инстансов EC2 с привязанной ролью IAM, использующих службу метаданных инстанса для аутентификации.

    <Steps>
      <Step title="Enable discovery explicitly">
        При использовании IMDS OpenClaw не может определить аутентификацию AWS только по маркерам окружения, поэтому нужно явно включить ее:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        Если вы также хотите, чтобы путь автообнаружения по маркерам окружения работал (например, для поверхностей `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Фальшивый API-ключ **не** нужен.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Роль IAM, привязанная к вашему инстансу EC2, должна иметь следующие разрешения:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (для автоматического обнаружения)
    - `bedrock:ListInferenceProfiles` (для обнаружения профилей вывода)

    Или привяжите управляемую политику `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    `AWS_PROFILE=default` нужен только если вам явно нужен маркер окружения для автоматического режима или поверхностей состояния. Фактический путь аутентификации среды выполнения Bedrock использует цепочку по умолчанию AWS SDK, поэтому аутентификация через роль инстанса IMDS работает даже без маркеров окружения.
    </Note>

  </Tab>
</Tabs>

## Автоматическое обнаружение моделей

OpenClaw может автоматически обнаруживать модели Bedrock, поддерживающие **потоковую передачу** и **текстовый вывод**. Обнаружение использует `bedrock:ListFoundationModels` и `bedrock:ListInferenceProfiles`, а результаты кэшируются (по умолчанию: 1 час).

Как включается неявный провайдер:

- Если `plugins.entries.amazon-bedrock.config.discovery.enabled` равно `true`, OpenClaw попробует выполнить обнаружение даже без маркера окружения AWS.
- Если `plugins.entries.amazon-bedrock.config.discovery.enabled` не задано, OpenClaw автоматически добавляет неявный провайдер Bedrock только когда видит один из этих маркеров аутентификации AWS: `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` или `AWS_PROFILE`.
- Фактический путь аутентификации среды выполнения Bedrock по-прежнему использует цепочку по умолчанию AWS SDK, поэтому общий config, SSO и аутентификация через роль инстанса IMDS могут работать даже когда для обнаружения требовалось `enabled: true`.

<Note>
Для явных записей `models.providers["amazon-bedrock"]` OpenClaw все еще может заранее разрешать аутентификацию Bedrock по маркерам окружения из маркеров AWS, таких как `AWS_BEARER_TOKEN_BEDROCK`, без принудительной полной загрузки аутентификации среды выполнения. Фактический путь аутентификации вызова модели по-прежнему использует цепочку по умолчанию AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
    Параметры config находятся в `plugins.entries.amazon-bedrock.config.discovery`:

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
    | `enabled` | auto | В автоматическом режиме OpenClaw включает неявный провайдер Bedrock только когда видит поддерживаемый маркер окружения AWS. Установите `true`, чтобы принудительно включить обнаружение. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Регион AWS, используемый для вызовов API обнаружения. |
    | `providerFilter` | (все) | Сопоставляет имена провайдеров Bedrock (например, `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Длительность кэша в секундах. Установите `0`, чтобы отключить кэширование. |
    | `defaultContextWindow` | `32000` | Окно контекста, используемое для обнаруженных моделей (переопределите, если знаете лимиты своей модели). |
    | `defaultMaxTokens` | `4096` | Максимальное число выходных токенов, используемое для обнаруженных моделей (переопределите, если знаете лимиты своей модели). |

  </Accordion>
</AccordionGroup>

## Быстрая настройка (путь AWS)

Этот пошаговый пример создает роль IAM, привязывает разрешения Bedrock, связывает профиль инстанса и включает обнаружение OpenClaw на хосте EC2.

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
  <Accordion title="Inference profiles">
    OpenClaw обнаруживает **региональные и глобальные профили вывода** вместе с базовыми моделями. Когда профиль сопоставляется с известной базовой моделью, он наследует возможности этой модели (окно контекста, максимум токенов, reasoning, vision), а корректный регион запроса Bedrock подставляется автоматически. Это означает, что межрегиональные профили Claude работают без ручных переопределений провайдера.

    Идентификаторы профилей вывода выглядят как `us.anthropic.claude-opus-4-6-v1:0` (региональный) или `anthropic.claude-opus-4-6-v1:0` (глобальный). Если базовая модель уже есть в результатах обнаружения, профиль наследует полный набор ее возможностей; в противном случае применяются безопасные значения по умолчанию.

    Дополнительная конфигурация не требуется. Пока обнаружение включено, а principal IAM имеет `bedrock:ListInferenceProfiles`, профили появляются рядом с базовыми моделями в `openclaw models list`.

  </Accordion>

  <Accordion title="Service tier">
    Некоторые модели Bedrock поддерживают параметр `service_tier` для оптимизации по стоимости или задержке. Доступны следующие уровни:

    | Уровень | Описание |
    |------|-------------|
    | `default` | Стандартный уровень Bedrock |
    | `flex` | Обработка со скидкой для рабочих нагрузок, которые могут выдерживать более длительную задержку |
    | `priority` | Приоритетная обработка для рабочих нагрузок, чувствительных к задержке |
    | `reserved` | Зарезервированная емкость для стабильных рабочих нагрузок |

    Задайте `serviceTier` (или `service_tier`) через `agents.defaults.params` для запросов к моделям Bedrock или для отдельной модели в `agents.defaults.models["<model-key>"].params`:

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

    Допустимые значения: `default`, `flex`, `priority` и `reserved`. Не все модели поддерживают все уровни — если запрошен неподдерживаемый уровень, Bedrock вернет ошибку валидации. Примечание: сообщение об ошибке может вводить в заблуждение; оно может сказать "The provided model identifier is invalid" вместо указания неподдерживаемого уровня сервиса. Если вы видите эту ошибку, проверьте, поддерживает ли модель запрошенный уровень.

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock отклоняет параметр `temperature` для Claude Opus 4.7. OpenClaw автоматически опускает `temperature` для любого Bedrock ref Opus 4.7, включая идентификаторы базовых моделей, именованные профили вывода, прикладные профили вывода, чья базовая модель разрешается в Opus 4.7 через `bedrock:GetInferenceProfile`, и варианты с точечной записью `opus-4.7` с необязательными префиксами регионов (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`, `global.`). Ручка config не требуется, а опускание применяется как к объекту параметров запроса, так и к полю payload `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Используйте `amazon-bedrock/anthropic.claude-fable-5` в `us-east-1` или
    региональные идентификаторы вывода, например `us.anthropic.claude-fable-5`.
    OpenClaw применяет для Fable контекстное окно 1M, лимит вывода 128K, всегда включенное
    адаптивное мышление и поддерживаемое сопоставление усилия. `/think off` и
    `/think minimal` сопоставляются с `low`; неподдерживаемые элементы управления температурой и принудительным
    выбором инструмента опускаются. Потоковый вывод удерживается, пока Bedrock
    не вернет конечный статус, чтобы отказы в середине потока не раскрывали частичный текст.
    Fable поддерживает только стандартный уровень сервиса; OpenClaw игнорирует настроенные
    уровни `flex`, `priority` и `reserved` для этой модели.

    AWS требует явного согласия `provider_data_share` на хранение данных, прежде чем
    Fable станет доступна. Запросы и завершения передаются Anthropic и
    хранятся до 30 дней для доверия и безопасности. Изучите и настройте
    [хранение данных Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    перед включением модели.

  </Accordion>

  <Accordion title="Защитные ограничения">
    Вы можете применять [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    ко всем вызовам моделей Bedrock, добавив объект `guardrail` в конфигурацию
    plugin `amazon-bedrock`. Защитные ограничения позволяют применять фильтрацию контента,
    запрет тем, фильтры слов, фильтры конфиденциальной информации и проверки контекстного
    заземления.

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

    | Параметр | Обязателен | Описание |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Да | Идентификатор защитного ограничения (например, `abc123`) или полный ARN (например, `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Да | Номер опубликованной версии или `"DRAFT"` для рабочего черновика. |
    | `streamProcessingMode` | Нет | `"sync"` или `"async"` для оценки защитного ограничения во время потоковой передачи. Если опущено, Bedrock использует значение по умолчанию. |
    | `trace` | Нет | `"enabled"` или `"enabled_full"` для отладки; опустите или задайте `"disabled"` для production. |

    <Warning>
    Субъект IAM, используемый gateway, должен иметь разрешение `bedrock:ApplyGuardrail` в дополнение к стандартным разрешениям вызова.
    </Warning>

  </Accordion>

  <Accordion title="Встраивания для поиска в памяти">
    Bedrock также может служить поставщиком встраиваний для
    [поиска в памяти](/ru/concepts/memory-search). Это настраивается отдельно от
    поставщика вывода -- задайте `agents.defaults.memorySearch.provider` равным `"bedrock"`:

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

    Встраивания Bedrock используют ту же цепочку учетных данных AWS SDK, что и вывод (роли
    экземпляров, SSO, ключи доступа, общая конфигурация и веб-идентификация). API-ключ
    не требуется. Явно задайте `memorySearch.provider: "bedrock"`, чтобы использовать
    встраивания Bedrock.

    Поддерживаемые модели встраиваний включают Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) и TwelveLabs Marengo. См.
    [справочник по настройке памяти -- Bedrock](/ru/reference/memory-config#bedrock-embedding-config)
    для полного списка моделей и параметров размерности.

  </Accordion>

  <Accordion title="Примечания и ограничения">
    - Bedrock требует, чтобы в вашем аккаунте/регионе AWS был включен **доступ к модели**.
    - Для автоматического обнаружения нужны разрешения `bedrock:ListFoundationModels` и
      `bedrock:ListInferenceProfiles`.
    - Если вы полагаетесь на автоматический режим, задайте один из поддерживаемых маркеров env для аутентификации AWS на
      хосте gateway. Если вы предпочитаете аутентификацию IMDS/общей конфигурации без маркеров env, задайте
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw показывает источник учетных данных в таком порядке: `AWS_BEARER_TOKEN_BEDROCK`,
      затем `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, затем `AWS_PROFILE`, затем
      цепочка AWS SDK по умолчанию.
    - Поддержка рассуждений зависит от модели; проверьте карточку модели Bedrock для
      актуальных возможностей.
    - Если вы предпочитаете управляемый поток ключей, вы также можете разместить OpenAI-совместимый
      прокси перед Bedrock и настроить его как поставщика OpenAI.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор поставщиков, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Поиск в памяти" href="/ru/concepts/memory-search" icon="magnifying-glass">
    Встраивания Bedrock для настройки поиска в памяти.
  </Card>
  <Card title="Справочник по настройке памяти" href="/ru/reference/memory-config#bedrock-embedding-config" icon="database">
    Полный список моделей встраиваний Bedrock и параметры размерности.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общее устранение неполадок и FAQ.
  </Card>
</CardGroup>
