---
read_when:
    - Вам потрібен єдиний API-ключ для багатьох LLM
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень
    - Ви хочете використовувати OpenRouter для генерації відео
summary: Використовуйте уніфікований API OpenRouter, щоб отримати доступ до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T09:53:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей за одним
endpoint і API-ключем. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після зміни базової URL-адреси.

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ на [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Необов’язково) Перейдіть на конкретну модель">
    За замовчуванням onboarding використовує `openrouter/auto`. Виберіть конкретну модель пізніше:

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
доступних провайдерів і моделей дивіться в [/concepts/model-providers](/uk/concepts/model-providers).
</Note>

Вбудовані приклади резервних варіантів:

| Посилання на модель               | Примітки                         |
| --------------------------------- | -------------------------------- |
| `openrouter/auto`                 | Автоматична маршрутизація OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI       |

## Генерація зображень

OpenRouter також може забезпечувати роботу інструмента `image_generate`. Використовуйте модель зображень OpenRouter у `agents.defaults.imageGenerationModel`:

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

OpenClaw надсилає запити на зображення до API зображень chat completions OpenRouter з `modalities: ["image", "text"]`. Моделі зображень Gemini отримують підтримувані підказки `aspectRatio` і `resolution` через `image_config` OpenRouter. Використовуйте `agents.defaults.imageGenerationModel.timeoutMs` для повільніших моделей зображень OpenRouter; параметр `timeoutMs` для окремого виклику інструмента `image_generate` усе одно має пріоритет.

## Генерація відео

OpenRouter також може забезпечувати роботу інструмента `video_generate` через свій асинхронний API `/videos`. Використовуйте відеомодель OpenRouter у `agents.defaults.videoGenerationModel`:

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

OpenClaw надсилає в OpenRouter завдання text-to-video та image-to-video, опитує
повернений `polling_url` і завантажує готове відео з
`unsigned_urls` OpenRouter або задокументованого endpoint вмісту завдання.
Еталонні зображення за замовчуванням надсилаються як зображення першого/останнього кадру; зображення,
позначені `reference_image`, надсилаються як вхідні посилання OpenRouter. Вбудований
типовий варіант `google/veo-3.1-fast` оголошує наразі підтримувані тривалості 4/6/8
секунд, роздільні здатності `720P`/`1080P` і співвідношення сторін `16:9`/`9:16`.
Video-to-video не зареєстровано для OpenRouter, оскільки upstream
API генерації відео наразі приймає текст і посилання на зображення.

## Text-to-speech

OpenRouter також можна використовувати як TTS-провайдера через його сумісний з OpenAI
endpoint `/audio/speech`.

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

OpenRouter під капотом використовує Bearer-токен із вашим API-ключем.

Для реальних запитів OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані заголовки атрибуції застосунку OpenRouter:

| Заголовок                 | Значення              |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Якщо ви перенаправите провайдера OpenRouter на інший проксі або базову URL-адресу, OpenClaw
**не** вставляє ці специфічні для OpenRouter заголовки або маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання кешу промптів у блоках системних/розробницьких промптів.
  </Accordion>

  <Accordion title="Попереднє заповнення reasoning Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic з увімкненим reasoning
    вилучають кінцеві ходи попереднього заповнення assistant до того, як запит потрапляє в OpenRouter,
    відповідно до вимоги Anthropic, щоб reasoning-розмови завершувалися ходом користувача.
  </Accordion>

  <Accordion title="Ін’єкція thinking / reasoning">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking з
    reasoning-навантаженнями проксі OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають цю reasoning-ін’єкцію. Hunter Alpha також пропускає
    reasoning проксі для застарілих налаштованих посилань на моделі, оскільки OpenRouter міг
    повертати текст фінальної відповіді в reasoning-полях для цього вилученого маршруту.
  </Accordion>

  <Accordion title="Повторне відтворення reasoning DeepSeek V4">
    На перевірених маршрутах OpenRouter `openrouter/deepseek/deepseek-v4-flash` і
    `openrouter/deepseek/deepseek-v4-pro` заповнюють відсутній `reasoning_content` у
    повторно відтворених ходах assistant, щоб розмови thinking/tool зберігали потрібну
    форму подальших відповідей DeepSeek V4.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter усе ще працює через проксі-стиль сумісного з OpenAI шляху, тому
    нативне формування запитів лише для OpenAI, як-от `serviceTier`, Responses `store`,
    reasoning-сумісні навантаження OpenAI і підказки кешу промптів, не пересилаються.
  </Accordion>

  <Accordion title="Маршрути на базі Gemini">
    Посилання OpenRouter на базі Gemini залишаються на шляху proxy-Gemini: OpenClaw зберігає
    там очищення thought-signature Gemini, але не вмикає нативну валідацію повторного відтворення Gemini
    або переписування bootstrap.
  </Accordion>

  <Accordion title="Метадані маршрутизації провайдера">
    Якщо ви передаєте маршрутизацію провайдера OpenRouter у параметрах моделі, OpenClaw пересилає
    її як метадані маршрутизації OpenRouter до запуску спільних stream-обгорток.
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
