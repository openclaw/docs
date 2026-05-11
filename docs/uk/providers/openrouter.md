---
read_when:
    - Вам потрібен один API-ключ для багатьох великих мовних моделей
    - Ви хочете запускати моделі через OpenRouter у OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень
    - Ви хочете використовувати OpenRouter для генерації відео
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-11T20:55:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей через одну
кінцеву точку та ключ API. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після перемикання базової URL-адреси.

## Початок роботи

<Steps>
  <Step title="Get your API key">
    Створіть ключ API на [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
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

Приклади вбудованих резервних варіантів:

| Посилання на модель              | Примітки                              |
| -------------------------------- | ------------------------------------- |
| `openrouter/auto`                | Автоматична маршрутизація OpenRouter  |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI            |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 через MoonshotAI            |

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

OpenClaw надсилає запити на зображення до OpenRouter's chat completions image API з `modalities: ["image", "text"]`. Моделі зображень Gemini отримують підтримувані підказки `aspectRatio` і `resolution` через OpenRouter's `image_config`. Використовуйте `agents.defaults.imageGenerationModel.timeoutMs` для повільніших моделей зображень OpenRouter; параметр `timeoutMs` інструмента `image_generate` для окремого виклику все одно має пріоритет.

## Генерація відео

OpenRouter також може забезпечувати роботу інструмента `video_generate` через його асинхронний API `/videos`. Використовуйте відеомодель OpenRouter у `agents.defaults.videoGenerationModel`:

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
OpenRouter's `unsigned_urls` або задокументованої кінцевої точки вмісту завдання.
Еталонні зображення за замовчуванням надсилаються як зображення першого/останнього кадру; зображення,
позначені `reference_image`, надсилаються як вхідні посилання OpenRouter. Вбудований
стандартний варіант `google/veo-3.1-fast` оголошує поточно підтримувані тривалості 4/6/8
секунд, роздільності `720P`/`1080P` і співвідношення сторін `16:9`/`9:16`.
Video-to-video не зареєстровано для OpenRouter, оскільки upstream
API генерації відео наразі приймає текстові посилання та посилання на зображення.

## Перетворення тексту на мовлення

OpenRouter також можна використовувати як провайдера TTS через його OpenAI-сумісну
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

OpenRouter під капотом використовує Bearer-токен із вашим ключем API.

У реальних запитах OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані заголовки атрибуції застосунку OpenRouter:

| Заголовок                 | Значення                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Якщо ви перенаправите провайдера OpenRouter на інший проксі або базову URL-адресу, OpenClaw
**не** додаватиме ці специфічні для OpenRouter заголовки або маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Response caching">
    Кешування відповідей OpenRouter увімкнене за згодою. Увімкніть його для кожної моделі OpenRouter за допомогою
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

    Це окремо від кешування промптів провайдера та від маркерів Anthropic
    `cache_control` у OpenRouter. Застосовується лише на перевірених
    маршрутах `openrouter.ai`, а не на користувацьких базових URL-адресах проксі.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання кешу промптів у блоках системних/розробницьких промптів.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic з увімкненим reasoning
    відкидають кінцеві prefill-ходи асистента до того, як запит досягне OpenRouter,
    відповідно до вимоги Anthropic, щоб розмови з reasoning завершувалися ходом користувача.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking із
    payload-ами reasoning проксі OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають це впровадження reasoning. Hunter Alpha також пропускає
    proxy reasoning для застарілих налаштованих посилань на моделі, оскільки OpenRouter міг
    повертати текст фінальної відповіді в полях reasoning для цього виведеного з експлуатації маршруту.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    На перевірених маршрутах OpenRouter `openrouter/deepseek/deepseek-v4-flash` і
    `openrouter/deepseek/deepseek-v4-pro` заповнюють відсутній `reasoning_content` у
    відтворених ходах асистента, щоб розмови thinking/tool зберігали потрібну для DeepSeek V4
    форму продовження. OpenClaw надсилає підтримувані OpenRouter значення
    `reasoning_effort` для цих маршрутів; `xhigh` є найвищим оголошеним
    рівнем, а застарілі перевизначення `max` зіставляються з `xhigh`.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter і далі працює через проксі-стиль OpenAI-сумісного шляху, тому
    нативне форматування запитів лише для OpenAI, як-от `serviceTier`, Responses `store`,
    OpenAI reasoning-compat payload-и та підказки кешу промптів, не пересилається.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    Посилання OpenRouter, підкріплені Gemini, залишаються на шляху proxy-Gemini: OpenClaw зберігає
    там очищення thought-signature Gemini, але не вмикає нативну валідацію відтворення Gemini
    або bootstrap-перезаписи.
  </Accordion>

  <Accordion title="Provider routing metadata">
    Якщо ви передаєте маршрутизацію провайдера OpenRouter у параметрах моделі, OpenClaw пересилає
    її як метадані маршрутизації OpenRouter до запуску спільних обгорток stream.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
