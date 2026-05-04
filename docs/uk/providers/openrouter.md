---
read_when:
    - Вам потрібен єдиний ключ API для багатьох LLM
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень
    - Ви хочете використовувати OpenRouter для генерації відео
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T00:07:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c262c43c2b8835f85f8e556b081bad8504a8c9b3b876f46e6decbab561e9be0e
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей через одну
кінцеву точку та API-ключ. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після зміни базової URL-адреси.

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ на [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Необов’язково) Перейдіть на конкретну модель">
    За замовчуванням під час початкового налаштування використовується `openrouter/auto`. Пізніше виберіть конкретну модель:

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

OpenClaw надсилає запити на зображення до API зображень чат-завершень OpenRouter з `modalities: ["image", "text"]`. Моделі зображень Gemini отримують підтримувані підказки `aspectRatio` і `resolution` через `image_config` OpenRouter. Використовуйте `agents.defaults.imageGenerationModel.timeoutMs` для повільніших моделей зображень OpenRouter; параметр `timeoutMs` для окремого виклику інструмента `image_generate` все одно має пріоритет.

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
`unsigned_urls` OpenRouter або документованої кінцевої точки вмісту завдання.
Еталонні зображення за замовчуванням надсилаються як зображення першого/останнього кадру; зображення
з тегом `reference_image` надсилаються як вхідні посилання OpenRouter. Вбудований
стандартний варіант `google/veo-3.1-fast` оголошує поточно підтримувані тривалості 4/6/8
секунд, роздільні здатності `720P`/`1080P` і співвідношення сторін `16:9`/`9:16`.
Video-to-video не зареєстровано для OpenRouter, оскільки upstream
API генерації відео наразі приймає текст і посилання на зображення.

## Text-to-speech

OpenRouter також можна використовувати як TTS-провайдера через його сумісну з OpenAI
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

## Автентифікація та заголовки

OpenRouter використовує Bearer-токен із вашим API-ключем під капотом.

У реальних запитах OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
документовані заголовки атрибуції застосунку OpenRouter:

| Заголовок                 | Значення              |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Якщо ви перенаправите провайдера OpenRouter на інший proxy або базову URL-адресу, OpenClaw
**не** вставлятиме ці специфічні для OpenRouter заголовки чи маркери кешу Anthropic.
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

    Це окремо від кешування промптів провайдера та від маркерів
    Anthropic `cache_control` OpenRouter. Воно застосовується лише на перевірених
    маршрутах `openrouter.ai`, а не на користувацьких базових URL proxy.

  </Accordion>

  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання кешу промптів у блоках системних/розробницьких промптів.
  </Accordion>

  <Accordion title="Попереднє заповнення міркувань Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic з увімкненими міркуваннями
    відкидають кінцеві ходи попереднього заповнення асистента до того, як запит потрапить до OpenRouter,
    відповідно до вимоги Anthropic, що розмови з міркуваннями мають завершуватися ходом користувача.
  </Accordion>

  <Accordion title="Вставлення мислення / міркувань">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень мислення з
    payload міркувань proxy OpenRouter. Непідтримувані підказки моделі та
    `openrouter/auto` пропускають це вставлення міркувань. Hunter Alpha також пропускає
    proxy-міркування для застарілих налаштованих посилань на моделі, оскільки OpenRouter міг
    повертати текст фінальної відповіді в полях міркувань для цього вилученого маршруту.
  </Accordion>

  <Accordion title="Повторення міркувань DeepSeek V4">
    На перевірених маршрутах OpenRouter `openrouter/deepseek/deepseek-v4-flash` і
    `openrouter/deepseek/deepseek-v4-pro` заповнюють відсутній `reasoning_content` у
    повторених ходах асистента, щоб розмови з мисленням/інструментами зберігали потрібну для DeepSeek V4
    форму продовження.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter усе ще проходить через proxy-style шлях, сумісний з OpenAI, тому
    нативне формування запитів лише для OpenAI, як-от `serviceTier`, Responses `store`,
    payload сумісності з міркуваннями OpenAI та підказки кешу промптів, не пересилається.
  </Accordion>

  <Accordion title="Маршрути на основі Gemini">
    Посилання OpenRouter на основі Gemini залишаються на proxy-Gemini шляху: OpenClaw зберігає
    там очищення сигнатур мислення Gemini, але не вмикає нативну валідацію повторення Gemini
    або bootstrap-переписування.
  </Accordion>

  <Accordion title="Метадані маршрутизації провайдера">
    Якщо ви передаєте маршрутизацію провайдера OpenRouter у параметрах моделі, OpenClaw пересилає
    її як метадані маршрутизації OpenRouter до запуску спільних обгорток stream.
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
