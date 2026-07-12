---
read_when:
    - Ви хочете використовувати розміщені в Bedrock Mantle моделі з відкритим кодом разом з OpenClaw
    - Вам потрібна сумісна з OpenAI кінцева точка Mantle для GPT-OSS, Qwen, Kimi або GLM
    - Ви хочете використовувати Claude Sonnet 5 або Mythos 5 через Amazon Bedrock Mantle
summary: Використання моделей Amazon Bedrock Mantle, сумісних з OpenAI, і Claude Messages з OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T13:40:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw містить вбудований провайдер **Amazon Bedrock Mantle**, який підключається до
сумісної з OpenAI кінцевої точки Mantle. Mantle надає моделі з відкритим кодом і
сторонні моделі (GPT-OSS, Qwen, Kimi, GLM та подібні) через стандартний
інтерфейс `/v1/chat/completions`, що працює на інфраструктурі Bedrock. Mantle також
надає моделі Anthropic Claude через маршрут Anthropic Messages.

| Властивість       | Значення                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Ідентифікатор провайдера    | `amazon-bedrock-mantle`                                                                |
| API            | `openai-completions` для виявлених моделей із відкритим кодом, `anthropic-messages` для моделей Claude |
| Автентифікація           | Явний `AWS_BEARER_TOKEN_BEDROCK` або створення токена-носія через ланцюжок облікових даних IAM    |
| Регіон за замовчуванням | `us-east-1` (перевизначте за допомогою `AWS_REGION` або `AWS_DEFAULT_REGION`)                       |

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Явний токен-носій">
    **Найкраще підходить для:** середовищ, де у вас уже є токен-носій Mantle.

    <Steps>
      <Step title="Установіть токен-носій на хості Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        За потреби задайте регіон (за замовчуванням — `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Перевірте, чи виявлено моделі">
        ```bash
        openclaw models list
        ```

        Виявлені моделі відображаються в провайдері `amazon-bedrock-mantle`. Жодна
        додаткова конфігурація не потрібна, якщо ви не хочете перевизначити стандартні значення.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Облікові дані IAM">
    **Найкраще підходить для:** використання сумісних з AWS SDK облікових даних (спільна конфігурація, SSO, вебідентифікація, ролі екземплярів або завдань).

    <Steps>
      <Step title="Налаштуйте облікові дані AWS на хості Gateway">
        Підійде будь-яке джерело автентифікації, сумісне з AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Перевірте, чи виявлено моделі">
        ```bash
        openclaw models list
        ```

        OpenClaw автоматично створює токен-носій Mantle із ланцюжка облікових даних.
      </Step>
    </Steps>

    <Tip>
    Якщо `AWS_BEARER_TOKEN_BEDROCK` не задано, OpenClaw створює токен-носій для вас зі стандартного ланцюжка облікових даних AWS, включно зі спільними обліковими даними й профілями конфігурації, SSO, вебідентифікацією та ролями екземплярів або завдань.
    </Tip>

  </Tab>
</Tabs>

## Автоматичне виявлення моделей

Якщо задано `AWS_BEARER_TOKEN_BEDROCK`, OpenClaw використовує його безпосередньо. Інакше
OpenClaw намагається створити токен-носій Mantle зі стандартного
ланцюжка облікових даних AWS. Потім він виявляє доступні моделі Mantle, надсилаючи запит до
кінцевої точки `/v1/models` відповідного регіону.

| Поведінка          | Докладно                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| Кеш виявлення   | Результати кешуються на 1 годину для кожного регіону; у разі помилки отримання повертається останній кешований результат |
| Оновлення токена IAM | Кожні 2 години, кешується для кожного регіону                                                     |

Щоб залишити Plugin Mantle увімкненим, але вимкнути автоматичне виявлення та
створення токена-носія IAM, вимкніть перемикач виявлення, що належить Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Це той самий токен-носій `AWS_BEARER_TOKEN_BEDROCK`, який використовує стандартний провайдер [Amazon Bedrock](/uk/providers/bedrock).
</Note>

### Підтримувані регіони

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Ручне налаштування

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

Явний непорожній список `models` є визначальним і замінює всі
виявлені записи, включно із записами Claude нижче. Не вказуйте `models`, щоб зберегти
автоматичний каталог Mantle, або додайте повні записи моделей Claude, які
ви хочете використовувати.

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Підтримка міркування">
    Підтримка міркування визначається за ідентифікаторами моделей, що містять такі шаблони, як
    `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b` або
    `gpt-oss-safeguard-120b`. Під час виявлення OpenClaw автоматично встановлює
    `reasoning: true` для відповідних моделей.
  </Accordion>

  <Accordion title="Недоступність кінцевої точки">
    Якщо кінцева точка Mantle недоступна, не повертає моделей або не вдається
    визначити токен-носій, виявлення повертає порожній результат, а неявний
    провайдер пропускається. OpenClaw не повертає помилку; інші налаштовані провайдери
    продовжують працювати у звичайному режимі.
  </Accordion>

  <Accordion title="Claude через маршрут Anthropic Messages">
    Якщо список моделей контролюється автоматичним виявленням, після успішного пошуку OpenClaw додає чотири моделі
    Claude незалежно від того, що повертає `/v1/models`:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5),
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7) і
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5), а також
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (попередня версія Claude Mythos).
    Вони використовують інтерфейс API `anthropic-messages` і передають потокові дані через
    ту саму сумісну з Anthropic кінцеву точку з автентифікацією токеном-носієм
    (`<mantle-base>/anthropic`), тому токен-носій AWS не розглядається як
    ключ API Anthropic.

    Claude Sonnet 5 завжди використовує адаптивне міркування, а стандартний рівень
    зусиль — `high`. `/think off` і `/think minimal` зіставляються з `low`, оскільки маршрут Mantle
    не дає змоги вимкнути міркування. OpenClaw також не передає власне значення температури
    для запитів Sonnet 5.

    Доступ до Claude Mythos 5 обмежений. Він заявляє контекстне вікно на 1 000 000 токенів
    і обмеження виводу на 128 000 токенів, завжди використовує адаптивне міркування, зіставляє
    `/think off` і `/think minimal` з `low` та не передає вибрані викликачем
    параметри семплювання.

    Claude Mythos Preview завжди запитує міркування зі стандартним рівнем зусиль `high`,
    якщо рівень `/think` не задано (`xhigh`/`max` знижуються до
    `high`, а `minimal` підвищується до `low`). Opus 4.7 у Mantle передає потік без
    наданого моделлю міркування, а OpenClaw не передає його параметр `temperature`,
    оскільки Opus 4.7 не приймає перевизначення семплювання на цьому маршруті; Mythos
    Preview приймає перевизначення `temperature` у звичайному режимі.

    Непорожній явний список `models.providers["amazon-bedrock-mantle"].models`
    замінює весь виявлений каталог. Не вказуйте цей список, якщо хочете
    використовувати ці вбудовані записи Claude.

  </Accordion>

  <Accordion title="Зв’язок із провайдером Amazon Bedrock">
    Bedrock Mantle — це окремий провайдер, відмінний від стандартного
    провайдера [Amazon Bedrock](/uk/providers/bedrock). Mantle використовує
    сумісний з OpenAI інтерфейс `/v1` для свого каталогу моделей із відкритим кодом, тоді як стандартний
    провайдер Bedrock використовує нативний API Bedrock Converse.

    Обидва провайдери використовують ті самі облікові дані `AWS_BEARER_TOKEN_BEDROCK`, якщо
    їх задано.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/uk/providers/bedrock" icon="cloud">
    Нативний провайдер Bedrock для Anthropic Claude, Titan та інших моделей.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання після відмови.
  </Card>
  <Card title="OAuth та автентифікація" href="/uk/gateway/authentication" icon="key">
    Докладні відомості про автентифікацію та правила повторного використання облікових даних.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх вирішення.
  </Card>
</CardGroup>
