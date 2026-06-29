---
read_when:
    - Вы хотите использовать размещенные в Bedrock Mantle модели OSS с OpenClaw
    - Вам нужна OpenAI-совместимая конечная точка Mantle для GPT-OSS, Qwen, Kimi или GLM
summary: Использование моделей Amazon Bedrock Mantle (совместимых с OpenAI) с OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-06-28T23:35:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw включает встроенный провайдер **Amazon Bedrock Mantle**, который подключается к
OpenAI-совместимой конечной точке Mantle. Mantle размещает модели с открытым
исходным кодом и сторонние модели (GPT-OSS, Qwen, Kimi, GLM и похожие) через стандартную
поверхность `/v1/chat/completions` на базе инфраструктуры Bedrock.

| Свойство             | Значение                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| ID провайдера        | `amazon-bedrock-mantle`                                                                          |
| API                  | `openai-completions` (OpenAI-совместимый) или `anthropic-messages` (маршрут Anthropic Messages) |
| Аутентификация       | Явный `AWS_BEARER_TOKEN_BEDROCK` или генерация bearer-токена через цепочку учетных данных IAM    |
| Регион по умолчанию  | `us-east-1` (переопределяется через `AWS_REGION` или `AWS_DEFAULT_REGION`)                       |

## Начало работы

Выберите предпочтительный способ аутентификации и выполните шаги настройки.

<Tabs>
  <Tab title="Явный bearer-токен">
    **Лучше всего для:** сред, где у вас уже есть bearer-токен Mantle.

    <Steps>
      <Step title="Установите bearer-токен на хосте Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        При необходимости задайте регион (по умолчанию `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Включите передачу данных провайдеру для Claude Fable 5">
        Claude Fable 5 и модели Bedrock класса Claude Mythos требуют режим Mantle Data Retention API `provider_data_share` перед вызовом. Это явное согласие позволяет Bedrock передавать промпты и завершения в Anthropic и хранить их до 30 дней для проверки доверия и безопасности.

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        Используйте другую модель Bedrock в конфигурации, если вы не можете принять этот режим хранения.
      </Step>
      <Step title="Проверьте, что модели обнаруживаются">
        ```bash
        openclaw models list
        ```

        Обнаруженные модели появляются в провайдере `amazon-bedrock-mantle`. Дополнительная
        конфигурация не требуется, если вы не хотите переопределить значения по умолчанию.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Учетные данные IAM">
    **Лучше всего для:** использования учетных данных, совместимых с AWS SDK (общая конфигурация, SSO, web identity, роли инстанса или задачи).

    <Steps>
      <Step title="Настройте учетные данные AWS на хосте Gateway">
        Подходит любой источник аутентификации, совместимый с AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Проверьте, что модели обнаруживаются">
        ```bash
        openclaw models list
        ```

        OpenClaw автоматически генерирует bearer-токен Mantle из цепочки учетных данных.
      </Step>
    </Steps>

    <Tip>
    Когда `AWS_BEARER_TOKEN_BEDROCK` не задан, OpenClaw выпускает bearer-токен за вас из стандартной цепочки учетных данных AWS, включая общие профили учетных данных/конфигурации, SSO, web identity, а также роли инстанса или задачи.
    </Tip>

  </Tab>
</Tabs>

## Автоматическое обнаружение моделей

Когда `AWS_BEARER_TOKEN_BEDROCK` задан, OpenClaw использует его напрямую. В противном случае
OpenClaw пытается сгенерировать bearer-токен Mantle из стандартной
цепочки учетных данных AWS. Затем он обнаруживает доступные модели Mantle, запрашивая
региональную конечную точку `/v1/models`.

| Поведение          | Подробности                       |
| ------------------ | --------------------------------- |
| Кэш обнаружения    | Результаты кэшируются на 1 час    |
| Обновление токена IAM | Ежечасно                       |

Чтобы оставить Plugin Mantle включенным, но отключить автоматическое обнаружение и генерацию
bearer-токена IAM, отключите принадлежащий Plugin переключатель обнаружения:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Bearer-токен — это тот же `AWS_BEARER_TOKEN_BEDROCK`, который используется стандартным провайдером [Amazon Bedrock](/ru/providers/bedrock).
</Note>

### Поддерживаемые регионы

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Ручная конфигурация

Если вы предпочитаете явную конфигурацию вместо автообнаружения:

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

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Поддержка рассуждений">
    Поддержка рассуждений выводится из ID моделей, содержащих шаблоны вроде
    `thinking`, `reasoner` или `gpt-oss-120b`. OpenClaw автоматически устанавливает `reasoning: true`
    для подходящих моделей во время обнаружения.
  </Accordion>

  <Accordion title="Недоступность конечной точки">
    Если конечная точка Mantle недоступна или не возвращает моделей, провайдер
    тихо пропускается. OpenClaw не выдает ошибку; другие настроенные провайдеры
    продолжают работать как обычно.
  </Accordion>

  <Accordion title="Claude Opus 4.7 через маршрут Anthropic Messages">
    Mantle также предоставляет маршрут Anthropic Messages, который передает модели Claude через тот же потоковый путь с bearer-аутентификацией. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) можно вызывать через этот маршрут с потоковой передачей, принадлежащей провайдеру, поэтому bearer-токены AWS не обрабатываются как API-ключи Anthropic.

    Когда вы закрепляете модель Anthropic Messages за провайдером Mantle, OpenClaw использует поверхность API `anthropic-messages` вместо `openai-completions` для этой модели. Аутентификация по-прежнему берется из `AWS_BEARER_TOKEN_BEDROCK` (или выпущенного bearer-токена IAM).

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

  <Accordion title="Связь с провайдером Amazon Bedrock">
    Bedrock Mantle — это отдельный провайдер относительно стандартного
    провайдера [Amazon Bedrock](/ru/providers/bedrock). Mantle использует
    OpenAI-совместимую поверхность `/v1`, а стандартный провайдер Bedrock использует
    нативный API Bedrock.

    Оба провайдера используют одни и те же учетные данные `AWS_BEARER_TOKEN_BEDROCK`,
    когда они присутствуют.

  </Accordion>
</AccordionGroup>

## Связанное

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ru/providers/bedrock" icon="cloud">
    Нативный провайдер Bedrock для Anthropic Claude, Titan и других моделей.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="OAuth и аутентификация" href="/ru/gateway/authentication" icon="key">
    Подробности аутентификации и правила повторного использования учетных данных.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Распространенные проблемы и способы их решения.
  </Card>
</CardGroup>
