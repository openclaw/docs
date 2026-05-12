---
read_when:
    - Вам потрібен єдиний API-ключ для багатьох великих мовних моделей
    - Ви хочете запускати моделі через OpenRouter у OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень
    - Ви хочете використовувати OpenRouter для генерації відео
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей у OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-12T08:46:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbf2b5a69636eb18471dd7d1dcf05ee30da931e2e3b5c9ae5d44a20d3e46f78
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей через одну
кінцеву точку й API-ключ. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після зміни базового URL.

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ на [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Необов’язково) Перейдіть на конкретну модель">
    Онбординг за замовчуванням використовує `openrouter/auto`. Виберіть конкретну модель пізніше:

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
Посилання на моделі відповідають шаблону `openrouter/<provider>/<model>`. Повний список
доступних провайдерів і моделей див. у [/concepts/model-providers](/uk/concepts/model-providers).
</Note>

Вбудовані приклади резервних варіантів:

| Посилання на модель              | Примітки                         |
| -------------------------------- | -------------------------------- |
| `openrouter/auto`                | Автоматична маршрутизація OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI       |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 через MoonshotAI       |

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

OpenClaw надсилає запити зображень до API зображень chat completions OpenRouter із `modalities: ["image", "text"]`. Моделі зображень Gemini отримують підтримувані підказки `aspectRatio` і `resolution` через `image_config` OpenRouter. Використовуйте `agents.defaults.imageGenerationModel.timeoutMs` для повільніших моделей зображень OpenRouter; параметр `timeoutMs` інструмента `image_generate` для окремого виклику все одно має пріоритет.

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
повернений `polling_url` і завантажує готове відео з
`unsigned_urls` OpenRouter або задокументованої кінцевої точки вмісту завдання.
Еталонні зображення за замовчуванням надсилаються як зображення першого/останнього кадру; зображення,
позначені `reference_image`, надсилаються як вхідні посилання OpenRouter. Вбудований
стандартний варіант `google/veo-3.1-fast` оголошує поточно підтримувані тривалості 4/6/8
секунд, роздільні здатності `720P`/`1080P` і співвідношення сторін `16:9`/`9:16`.
Video-to-video не зареєстровано для OpenRouter, оскільки upstream
API генерації відео наразі приймає текст і посилання на зображення.

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

Якщо `messages.tts.providers.openrouter.apiKey` опущено, TTS повторно використовує
`models.providers.openrouter.apiKey`, а потім `OPENROUTER_API_KEY`.

## Перетворення мовлення на текст (вхідне аудіо)

OpenRouter може транскрибувати вхідні голосові/аудіовкладення через спільний
шлях `tools.media.audio`, використовуючи свою кінцеву точку STT (`/audio/transcriptions`).
Це застосовується до будь-якого канального plugin, який передає вхідний голос/аудіо до
попередньої перевірки розуміння медіа.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw надсилає STT-запити OpenRouter як JSON з аудіо base64 у
`input_audio` (контракт STT OpenRouter), а не як multipart-завантаження форми OpenAI.

## Автентифікація та заголовки

OpenRouter використовує Bearer-токен із вашим API-ключем під капотом.

У реальних запитах OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані OpenRouter заголовки атрибуції застосунку:

| Заголовок                 | Значення                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Якщо ви перенаправите провайдера OpenRouter на інший проксі або базовий URL, OpenClaw
**не** додає ці специфічні для OpenRouter заголовки або маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Кешування відповідей">
    Кешування відповідей OpenRouter вмикається явно. Увімкніть його для кожної моделі OpenRouter за допомогою
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

    OpenClaw надсилає `X-OpenRouter-Cache: true` і, якщо налаштовано,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` примусово оновлює
    поточний запит і зберігає замінну відповідь. Також приймаються snake_case-псевдоніми
    (`response_cache`, `response_cache_ttl_seconds` і
    `response_cache_clear`).

    Це окремо від кешування промптів провайдера та від маркерів Anthropic
    `cache_control` OpenRouter. Воно застосовується лише на перевірених
    маршрутах `openrouter.ai`, а не на базових URL користувацьких проксі.

  </Accordion>

  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання кешу промптів у блоках системних/розробницьких промптів.
  </Accordion>

  <Accordion title="Попереднє заповнення reasoning Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic з увімкненим reasoning
    відкидають завершальні ходи попереднього заповнення асистента перед тим, як запит потрапить до OpenRouter,
    відповідно до вимоги Anthropic, щоб розмови reasoning завершувалися ходом користувача.
  </Accordion>

  <Accordion title="Ін’єкція thinking / reasoning">
    На підтримуваних не-`auto` маршрутах OpenClaw відображає вибраний рівень thinking на
    payload reasoning проксі OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають цю ін’єкцію reasoning. Hunter Alpha також пропускає
    proxy reasoning для застарілих налаштованих посилань на моделі, оскільки OpenRouter міг
    повертати текст остаточної відповіді в полях reasoning для цього вилученого маршруту.
  </Accordion>

  <Accordion title="Відтворення reasoning DeepSeek V4">
    На перевірених маршрутах OpenRouter `openrouter/deepseek/deepseek-v4-flash` і
    `openrouter/deepseek/deepseek-v4-pro` заповнюють відсутній `reasoning_content` у
    відтворених ходах асистента, щоб розмови thinking/tool зберігали потрібну для DeepSeek V4
    форму подальшого ходу. OpenClaw надсилає підтримувані OpenRouter
    значення `reasoning_effort` для цих маршрутів; `xhigh` є найвищим оголошеним
    рівнем, а застарілі перевизначення `max` відображаються на `xhigh`.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter усе ще проходить через proxy-style сумісний з OpenAI шлях, тому
    нативне формування запитів лише для OpenAI, як-от `serviceTier`, Responses `store`,
    OpenAI reasoning-compat payloads і підказки кешу промптів, не пересилається.
  </Accordion>

  <Accordion title="Маршрути на базі Gemini">
    Посилання OpenRouter на базі Gemini залишаються на шляху proxy-Gemini: OpenClaw зберігає
    там очищення thought-signature Gemini, але не вмикає нативну валідацію
    відтворення Gemini або bootstrap-переписування.
  </Accordion>

  <Accordion title="Метадані маршрутизації провайдера">
    Якщо ви передаєте маршрутизацію провайдера OpenRouter у параметрах моделі, OpenClaw пересилає
    її як метадані маршрутизації OpenRouter до запуску спільних stream wrappers.
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
