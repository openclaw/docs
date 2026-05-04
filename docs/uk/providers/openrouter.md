---
read_when:
    - Вам потрібен єдиний API-ключ для багатьох LLM
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень
    - Ви хочете використовувати OpenRouter для генерації відео
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T00:14:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6b7299408aa0de7530e2248c7fa5dae8c09095e2d20a0e9d12a64cab83966fc
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter надає **уніфікований API**, який спрямовує запити до багатьох моделей через одну
кінцеву точку й ключ API. Він сумісний з OpenAI, тому більшість SDK OpenAI працюють після зміни базової URL-адреси.

## Початок роботи

<Steps>
  <Step title="Отримайте свій ключ API">
    Створіть ключ API на [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Необов’язково) Перейдіть на конкретну модель">
    Onboarding за замовчуванням використовує `openrouter/auto`. Виберіть конкретну модель пізніше:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Приклад конфігурації

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Посилання на моделі

<Note>
Посилання на моделі мають шаблон `openrouter/<provider>/<model>`. Повний список
доступних провайдерів і моделей див. у [/concepts/model-providers](/uk/concepts/model-providers).
</Note>

Вбудовані приклади fallback:

| Посилання на модель              | Примітки                              |
| --------------------------------- | ------------------------------------- |
| `openrouter/auto`                 | Автоматична маршрутизація OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI           |

## Генерація зображень

OpenRouter також може забезпечувати інструмент `image_generate`. Використовуйте модель зображень OpenRouter у `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw надсилає запити зображень до image API чат-завершень OpenRouter із `modalities: ["image", "text"]`. Моделі зображень Gemini отримують підтримувані підказки `aspectRatio` і `resolution` через `image_config` OpenRouter. Використовуйте `agents.defaults.imageGenerationModel.timeoutMs` для повільніших моделей зображень OpenRouter; параметр `timeoutMs` інструмента `image_generate` для окремого виклику все одно має пріоритет.

## Генерація відео

OpenRouter також може забезпечувати інструмент `video_generate` через свій асинхронний API `/videos`. Використовуйте відеомодель OpenRouter у `agents.defaults.videoGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw надсилає до OpenRouter завдання text-to-video та image-to-video, опитує
повернений `polling_url` і завантажує завершене відео з
`unsigned_urls` OpenRouter або задокументованої кінцевої точки вмісту завдання.
Еталонні зображення за замовчуванням надсилаються як зображення першого/останнього кадру; зображення,
позначені `reference_image`, надсилаються як вхідні посилання OpenRouter. Вбудований
типовий варіант `google/veo-3.1-fast` оголошує поточно підтримувані тривалості 4/6/8
секунд, роздільності `720P`/`1080P` і співвідношення сторін `16:9`/`9:16`.
Video-to-video не зареєстровано для OpenRouter, оскільки upstream
API генерації відео наразі приймає текст і посилання на зображення.

## Перетворення тексту на мовлення

OpenRouter також можна використовувати як провайдер TTS через його сумісну з OpenAI
кінцеву точку `/audio/speech`.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Якщо `messages.tts.providers.openrouter.apiKey` пропущено, TTS повторно використовує
`models.providers.openrouter.apiKey`, а потім `OPENROUTER_API_KEY`.

## Автентифікація та заголовки

OpenRouter внутрішньо використовує Bearer-токен із вашим ключем API.

У реальних запитах OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані OpenRouter заголовки атрибуції застосунку:

| Заголовок                 | Значення                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Якщо ви перенаправите провайдер OpenRouter на інший проксі або базову URL-адресу, OpenClaw
**не** вставлятиме ці специфічні для OpenRouter заголовки або маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Кешування відповідей">
    Кешування відповідей OpenRouter вмикається явно. Увімкніть його для окремої моделі OpenRouter за допомогою
    параметрів моделі:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw надсилає `X-OpenRouter-Cache: true` і, коли налаштовано,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` примусово оновлює
    поточний запит і зберігає замінну відповідь. Також приймаються псевдоніми snake_case
    (`response_cache`, `response_cache_ttl_seconds` і
    `response_cache_clear`).

    Це окремо від кешування промптів провайдера та від маркерів
    Anthropic `cache_control` OpenRouter. Застосовується лише на перевірених
    маршрутах `openrouter.ai`, а не на користувацьких базових URL проксі.

  </Accordion>

  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання кешу промптів у блоках системних/розробницьких промптів.
  </Accordion>

  <Accordion title="Попереднє заповнення міркування Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic з увімкненим міркуванням
    відкидають кінцеві ходи попереднього заповнення асистента до того, як запит досягне OpenRouter,
    відповідно до вимоги Anthropic, щоб розмови з міркуванням завершувалися ходом користувача.
  </Accordion>

  <Accordion title="Ін’єкція thinking / reasoning">
    На підтримуваних не-`auto` маршрутах OpenClaw зіставляє вибраний рівень thinking із
    payloads reasoning проксі OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають цю ін’єкцію reasoning. Hunter Alpha також пропускає
    reasoning проксі для застарілих налаштованих посилань на моделі, оскільки OpenRouter міг
    повертати текст остаточної відповіді в полях reasoning для цього вилученого маршруту.
  </Accordion>

  <Accordion title="Повтор reasoning DeepSeek V4">
    На перевірених маршрутах OpenRouter `openrouter/deepseek/deepseek-v4-flash` і
    `openrouter/deepseek/deepseek-v4-pro` заповнюють відсутній `reasoning_content` у
    повторно відтворених ходах асистента, щоб розмови thinking/tool зберігали потрібну для DeepSeek V4
    форму продовження.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter усе ще проходить шлях OpenAI-сумісного проксі-стилю, тому
    нативне формування запитів лише для OpenAI, як-от `serviceTier`, Responses `store`,
    payloads сумісності reasoning OpenAI і підказки кешу промптів, не пересилається.
  </Accordion>

  <Accordion title="Маршрути на базі Gemini">
    Посилання OpenRouter на базі Gemini залишаються на proxy-Gemini шляху: OpenClaw зберігає
    очищення thought-signature Gemini там, але не вмикає нативну валідацію повтору Gemini
    або bootstrap-переписування.
  </Accordion>

  <Accordion title="Метадані маршрутизації провайдера">
    Якщо ви передаєте маршрутизацію провайдера OpenRouter у параметрах моделі, OpenClaw пересилає
    її як метадані маршрутизації OpenRouter до запуску спільних обгорток потоку.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
