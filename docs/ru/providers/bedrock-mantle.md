---
read_when:
    - Вы хотите использовать размещённые в Bedrock Mantle модели с открытым исходным кодом вместе с OpenClaw
    - Вам нужна совместимая с OpenAI конечная точка Mantle для GPT-OSS, Qwen, Kimi или GLM
    - Вы хотите использовать Claude Sonnet 5 или Mythos 5 через Amazon Bedrock Mantle
summary: Использование совместимых с OpenAI моделей и моделей Claude Messages из Amazon Bedrock Mantle с OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-13T18:39:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw включает встроенный провайдер **Amazon Bedrock Mantle**, который подключается к
совместимой с OpenAI конечной точке Mantle. Mantle предоставляет модели с открытым исходным
кодом и сторонние модели (GPT-OSS, Qwen, Kimi, GLM и аналогичные) через стандартный
интерфейс `/v1/chat/completions` на базе инфраструктуры Bedrock. Mantle также
предоставляет модели Anthropic Claude через маршрут Anthropic Messages.

| Свойство          | Значение                                                                               |
| ----------------- | -------------------------------------------------------------------------------------- |
| Идентификатор провайдера | `amazon-bedrock-mantle`                                                                |
| API               | `openai-completions` для обнаруженных OSS-моделей, `anthropic-messages` для моделей Claude |
| Аутентификация    | Явный `AWS_BEARER_TOKEN_BEDROCK` или создание токена-носителя через цепочку учётных данных IAM    |
| Регион по умолчанию | `us-east-1` (переопределяется с помощью `AWS_REGION` или `AWS_DEFAULT_REGION`)                       |

## Начало работы

Выберите предпочтительный метод аутентификации и выполните шаги настройки.

<Tabs>
  <Tab title="Явный токен-носитель">
    **Лучше всего подходит для:** сред, где у вас уже есть токен-носитель Mantle.

    <Steps>
      <Step title="Задайте токен-носитель на хосте Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        При необходимости задайте регион (по умолчанию — `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Убедитесь, что модели обнаружены">
        ```bash
        openclaw models list
        ```

        Обнаруженные модели отображаются у провайдера `amazon-bedrock-mantle`. Дополнительная
        конфигурация не требуется, если вы не хотите переопределить значения по умолчанию.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Учётные данные IAM">
    **Лучше всего подходит для:** использования учётных данных, совместимых с AWS SDK (общая конфигурация, SSO, веб-идентификация, роли экземпляров или задач).

    <Steps>
      <Step title="Настройте учётные данные AWS на хосте Gateway">
        Подойдёт любой источник аутентификации, совместимый с AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Убедитесь, что модели обнаружены">
        ```bash
        openclaw models list
        ```

        OpenClaw автоматически создаёт токен-носитель Mantle из цепочки учётных данных.
      </Step>
    </Steps>

    <Tip>
    Если `AWS_BEARER_TOKEN_BEDROCK` не задан, OpenClaw создаёт для вас токен-носитель из стандартной цепочки учётных данных AWS, включая общие учётные данные и профили конфигурации, SSO, веб-идентификацию, а также роли экземпляров или задач.
    </Tip>

  </Tab>
</Tabs>

## Автоматическое обнаружение моделей

Если `AWS_BEARER_TOKEN_BEDROCK` задан, OpenClaw использует его напрямую. В противном случае
OpenClaw пытается создать токен-носитель Mantle из стандартной цепочки
учётных данных AWS. Затем он обнаруживает доступные модели Mantle, обращаясь к
региональной конечной точке `/v1/models`.

| Поведение              | Подробности                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------ |
| Кэш обнаружения        | Результаты кэшируются на 1 час для каждого региона; при сбое запроса возвращается последний кэшированный результат |
| Обновление токена IAM  | Каждые 2 часа, кэшируется отдельно для каждого региона                               |

Чтобы оставить плагин Mantle включённым, но отключить автоматическое обнаружение и
создание токена-носителя IAM, отключите принадлежащий плагину переключатель обнаружения:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Используется тот же токен-носитель `AWS_BEARER_TOKEN_BEDROCK`, что и стандартным провайдером [Amazon Bedrock](/ru/providers/bedrock).
</Note>

### Поддерживаемые регионы

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Ручная настройка

Если вы предпочитаете явную конфигурацию автоматическому обнаружению:

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

Явный непустой список `models` является определяющим и заменяет все
обнаруженные строки, включая строки Claude ниже. Не указывайте `models`, чтобы сохранить
автоматический каталог Mantle, либо включите полные записи моделей Claude, которые
хотите использовать.

## Расширенная настройка

<AccordionGroup>
  <Accordion title="Поддержка рассуждений">
    Поддержка рассуждений определяется по наличию в идентификаторах моделей таких шаблонов, как
    `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b` или
    `gpt-oss-safeguard-120b`. Во время обнаружения OpenClaw автоматически задаёт
    `reasoning: true` для соответствующих моделей.
  </Accordion>

  <Accordion title="Недоступность конечной точки">
    Если конечная точка Mantle недоступна, не возвращает моделей либо не удаётся
    получить токен-носитель, обнаружение возвращает пустой результат, а неявный
    провайдер пропускается. OpenClaw не сообщает об ошибке; другие настроенные провайдеры
    продолжают работать в обычном режиме.
  </Accordion>

  <Accordion title="Claude через маршрут Anthropic Messages">
    Когда список моделей определяется автоматическим обнаружением, после успешного поиска OpenClaw добавляет четыре модели
    Claude независимо от того, что возвращает `/v1/models`:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5),
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7) и
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5), а также
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (предварительная версия Claude Mythos).
    Они используют интерфейс API `anthropic-messages` и передают потоковые данные через
    ту же совместимую с Anthropic конечную точку с аутентификацией по токену-носителю
    (`<mantle-base>/anthropic`), поэтому токен-носитель AWS не рассматривается как
    ключ API Anthropic.

    Claude Sonnet 5 всегда использует адаптивное мышление и по умолчанию задаёт усилие
    `high`. `/think off` и `/think minimal` сопоставляются с `low`, поскольку маршрут Mantle
    не позволяет отключить мышление. OpenClaw также не передаёт пользовательскую температуру в
    запросах Sonnet 5.

    Доступ к Claude Mythos 5 ограничен. Для него заявлены контекстное окно на 1 000 000 токенов
    и ограничение вывода в 128 000 токенов; он всегда использует адаптивное мышление, сопоставляет
    `/think off` и `/think minimal` с `low` и не передаёт выбранные вызывающей стороной
    параметры сэмплирования.

    Claude Mythos Preview всегда запрашивает рассуждения, по умолчанию используя усилие `high`,
    если уровень `/think` не задан (`xhigh`/`max` понижаются до
    `high`, а `minimal` повышается до `low`). Opus 4.7 в Mantle передаёт потоковые данные без
    предоставляемых моделью рассуждений, а OpenClaw не передаёт его параметр `temperature`,
    поскольку Opus 4.7 не принимает переопределения параметров сэмплирования на этом маршруте; Mythos
    Preview принимает переопределение `temperature` в обычном режиме.

    Непустой явный список `models.providers["amazon-bedrock-mantle"].models`
    заменяет весь обнаруженный каталог. Не указывайте этот список, если
    хотите использовать эти встроенные строки Claude.

  </Accordion>

  <Accordion title="Связь с провайдером Amazon Bedrock">
    Bedrock Mantle — отдельный провайдер, отличный от стандартного
    провайдера [Amazon Bedrock](/ru/providers/bedrock). Mantle использует совместимый с
    OpenAI интерфейс `/v1` для своего каталога OSS, тогда как стандартный
    провайдер Bedrock использует нативный API Bedrock Converse.

    Оба провайдера совместно используют одни и те же учётные данные `AWS_BEARER_TOKEN_BEDROCK`, если
    они доступны.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ru/providers/bedrock" icon="cloud">
    Нативный провайдер Bedrock для Anthropic Claude, Titan и других моделей.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="OAuth и аутентификация" href="/ru/gateway/authentication" icon="key">
    Сведения об аутентификации и правила повторного использования учётных данных.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Распространённые проблемы и способы их устранения.
  </Card>
</CardGroup>
