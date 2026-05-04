---
read_when:
    - Вам потрібен єдиний ключ API для багатьох LLM
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень
    - Ви хочете використовувати OpenRouter для генерації відео
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T21:16:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей за одним
endpoint і API-ключем. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після перемикання базового URL.

## Початок роботи

<Steps>
  <Step title="Get your API key">
    Створіть API-ключ на [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
    Початкове налаштування типово використовує `openrouter/auto`. Пізніше виберіть конкретну модель:

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

Приклади вбудованого резервного варіанта:

| Посилання на модель              | Примітки                           |
| --------------------------------- | ---------------------------------- |
| `openrouter/auto`                 | Автоматична маршрутизація OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI         |

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

OpenClaw надсилає запити зображень до OpenRouter chat completions image API з `modalities: ["image", "text"]`. Моделі зображень Gemini отримують підтримувані підказки `aspectRatio` і `resolution` через `image_config` OpenRouter. Використовуйте `agents.defaults.imageGenerationModel.timeoutMs` для повільніших моделей зображень OpenRouter; параметр `timeoutMs` інструмента `image_generate` для окремого виклику все одно має пріоритет.

## Генерація відео

OpenRouter також може забезпечувати роботу інструмента `video_generate` через свій асинхронний API `/videos`. Використовуйте модель відео OpenRouter у `agents.defaults.videoGenerationModel`:

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
`unsigned_urls` OpenRouter або задокументованого endpoint вмісту завдання.
Еталонні зображення типово надсилаються як зображення першого/останнього кадру; зображення,
позначені `reference_image`, надсилаються як вхідні посилання OpenRouter. Вбудоване
типове значення `google/veo-3.1-fast` оголошує поточно підтримувані тривалості 4/6/8
секунд, роздільності `720P`/`1080P` і співвідношення сторін `16:9`/`9:16`.
Video-to-video не зареєстровано для OpenRouter, тому що upstream
API генерації відео наразі приймає текст і посилання на зображення.

## Перетворення тексту на мовлення

OpenRouter також можна використовувати як провайдера TTS через його сумісний з OpenAI
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

OpenRouter використовує Bearer token із вашим API-ключем під капотом.

У реальних запитах OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані заголовки атрибуції застосунку OpenRouter:

| Заголовок                 | Значення                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Якщо ви перенаправите провайдера OpenRouter на інший proxy або базовий URL, OpenClaw
**не** вставляє ці специфічні для OpenRouter заголовки або маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Response caching">
    Кешування відповідей OpenRouter вмикається явно. Увімкніть його для кожної моделі OpenRouter через
    параметри моделі:

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
    поточний запит і зберігає замінну відповідь. Також приймаються snake_case aliases
    (`response_cache`, `response_cache_ttl_seconds` і
    `response_cache_clear`).

    Це окремо від кешування prompt провайдера та від маркерів Anthropic
    `cache_control` OpenRouter. Воно застосовується лише на перевірених
    маршрутах `openrouter.ai`, а не на базових URL користувацьких proxy.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання prompt-cache у блоках system/developer prompt.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic з увімкненим reasoning
    відкидають кінцеві попередньо заповнені ходи assistant до того, як запит досягне OpenRouter,
    відповідно до вимоги Anthropic, що reasoning-розмови мають завершуватися ходом user.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking із
    payload reasoning proxy OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають це вставлення reasoning. Hunter Alpha також пропускає
    proxy reasoning для застарілих налаштованих посилань на модель, тому що OpenRouter міг
    повертати текст фінальної відповіді в полях reasoning для цього виведеного з використання маршруту.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    На перевірених маршрутах OpenRouter `openrouter/deepseek/deepseek-v4-flash` і
    `openrouter/deepseek/deepseek-v4-pro` заповнюють відсутній `reasoning_content` у
    повторно відтворених ходах assistant, щоб розмови thinking/tool зберігали
    потрібну для DeepSeek V4 форму подальшого продовження. OpenClaw надсилає підтримувані OpenRouter
    значення `reasoning_effort` для цих маршрутів; `xhigh` є найвищим оголошеним
    рівнем, а застарілі перевизначення `max` зіставляються з `xhigh`.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter усе ще працює через proxy-style OpenAI-compatible шлях, тому
    нативне формування запитів лише для OpenAI, як-от `serviceTier`, Responses `store`,
    payload для сумісності reasoning OpenAI і підказки prompt-cache, не передається далі.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    Посилання OpenRouter на базі Gemini залишаються на proxy-Gemini шляху: OpenClaw зберігає
    очищення thought-signature Gemini там, але не вмикає нативну валідацію replay Gemini
    або bootstrap rewrites.
  </Accordion>

  <Accordion title="Provider routing metadata">
    Якщо ви передаєте маршрутизацію провайдера OpenRouter у параметрах моделі, OpenClaw пересилає
    її як routing metadata OpenRouter перед запуском спільних stream wrappers.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для agents, models і providers.
  </Card>
</CardGroup>
