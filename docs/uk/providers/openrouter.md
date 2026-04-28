---
read_when:
    - Вам потрібен єдиний API-ключ для багатьох великих мовних моделей
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень
    - Ви хочете використовувати OpenRouter для генерації відео
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-28T11:23:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей через єдину
кінцеву точку та ключ API. Він сумісний з OpenAI, тому більшість SDK OpenAI працюють після зміни базового URL.

## Початок роботи

<Steps>
  <Step title="Отримайте ключ API">
    Створіть ключ API на [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Необов’язково) Перемкніться на конкретну модель">
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

Вбудовані приклади резервних варіантів:

| Посилання на модель              | Примітки                                |
| --------------------------------- | --------------------------------------- |
| `openrouter/auto`                 | Автоматична маршрутизація OpenRouter    |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI              |

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

OpenClaw надсилає запити зображень до API зображень chat completions OpenRouter з `modalities: ["image", "text"]`. Моделі зображень Gemini отримують підтримувані підказки `aspectRatio` і `resolution` через `image_config` OpenRouter. Використовуйте `agents.defaults.imageGenerationModel.timeoutMs` для повільніших моделей зображень OpenRouter; параметр `timeoutMs` для окремого виклику інструмента `image_generate` усе одно має пріоритет.

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

OpenClaw надсилає завдання text-to-video та image-to-video до OpenRouter, опитує
повернений `polling_url` і завантажує завершене відео з
`unsigned_urls` OpenRouter або задокументованої кінцевої точки вмісту завдання.
Референсні зображення за замовчуванням надсилаються як зображення першого/останнього кадру; зображення,
позначені `reference_image`, надсилаються як вхідні референси OpenRouter. Вбудоване
значення за замовчуванням `google/veo-3.1-fast` оголошує поточно підтримувані тривалості 4/6/8
секунд, роздільності `720P`/`1080P` і співвідношення сторін `16:9`/`9:16`.
Video-to-video не зареєстровано для OpenRouter, оскільки upstream
API генерації відео наразі приймає текст і референси зображень.

## Перетворення тексту на мовлення

OpenRouter також можна використовувати як провайдера TTS через його сумісну з OpenAI
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

| Заголовок                 | Значення              |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Якщо ви перенаправите провайдера OpenRouter на інший проксі або базовий URL, OpenClaw
**не** додаватиме ці специфічні для OpenRouter заголовки або маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання prompt-cache у блоках системних/розробницьких промптів.
  </Accordion>

  <Accordion title="Ін’єкція thinking / reasoning">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking із
    payload reasoning проксі OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають цю ін’єкцію reasoning. Hunter Alpha також пропускає
    proxy reasoning для застарілих налаштованих посилань на моделі, оскільки OpenRouter міг
    повертати текст фінальної відповіді в полях reasoning для цього вилученого маршруту.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter усе ще працює через проксі-стиль сумісного з OpenAI шляху, тому
    нативне формування запитів лише для OpenAI, як-от `serviceTier`, Responses `store`,
    payload сумісності reasoning OpenAI і підказки prompt-cache, не пересилається.
  </Accordion>

  <Accordion title="Маршрути на базі Gemini">
    Посилання OpenRouter на базі Gemini залишаються на проксі-Gemini шляху: OpenClaw зберігає
    там очищення thought-signature Gemini, але не вмикає нативну Gemini
    валідацію replay або bootstrap rewrites.
  </Accordion>

  <Accordion title="Метадані маршрутизації провайдера">
    Якщо ви передаєте маршрутизацію провайдера OpenRouter у параметрах моделі, OpenClaw пересилає
    її як метадані маршрутизації OpenRouter до запуску спільних обгорток потокового передавання.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
