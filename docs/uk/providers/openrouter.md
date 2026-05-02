---
read_when:
    - Вам потрібен єдиний API-ключ для багатьох LLM
    - Ви хочете запускати моделі через OpenRouter у OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень
    - Ви хочете використовувати OpenRouter для генерації відео
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T05:53:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f7c6f9c77e2a62866fdeaa65667d3871930be2ce22a638accdb8baa76220fd
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей через єдину
кінцеву точку та API-ключ. Він сумісний з OpenAI, тож більшість OpenAI SDK працюють після зміни базового URL.

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
    Онбординг за замовчуванням використовує `openrouter/auto`. Пізніше виберіть конкретну модель:

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

| Посилання на модель              | Примітки                         |
| -------------------------------- | -------------------------------- |
| `openrouter/auto`                | Автоматична маршрутизація OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI       |

## Генерація зображень

OpenRouter також може підтримувати інструмент `image_generate`. Використайте модель зображень OpenRouter у `agents.defaults.imageGenerationModel`:

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

OpenClaw надсилає запити зображень до OpenRouter API зображень chat completions із `modalities: ["image", "text"]`. Моделі зображень Gemini отримують підтримувані підказки `aspectRatio` і `resolution` через `image_config` OpenRouter. Використовуйте `agents.defaults.imageGenerationModel.timeoutMs` для повільніших моделей зображень OpenRouter; параметр `timeoutMs` інструмента `image_generate` для окремого виклику все одно має пріоритет.

## Генерація відео

OpenRouter також може підтримувати інструмент `video_generate` через свій асинхронний API `/videos`. Використайте відеомодель OpenRouter у `agents.defaults.videoGenerationModel`:

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
Еталонні зображення за замовчуванням надсилаються як зображення першого/останнього кадру; зображення
з тегом `reference_image` надсилаються як вхідні посилання OpenRouter. Вбудоване
значення за замовчуванням `google/veo-3.1-fast` оголошує поточно підтримувані тривалості 4/6/8
секунд, роздільності `720P`/`1080P` і співвідношення сторін `16:9`/`9:16`.
Video-to-video не зареєстровано для OpenRouter, оскільки upstream
API генерації відео наразі приймає текст і посилання на зображення.

## Text-to-speech

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

OpenRouter під капотом використовує Bearer-токен із вашим API-ключем.

У реальних запитах OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані заголовки атрибуції застосунку OpenRouter:

| Заголовок                 | Значення              |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Якщо ви перенаправите провайдера OpenRouter на інший проксі або базовий URL, OpenClaw
**не** вставляє ці специфічні для OpenRouter заголовки або маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання кешу промптів у блоках системних/розробницьких промптів.
  </Accordion>

  <Accordion title="Попереднє заповнення міркувань Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic з увімкненими міркуваннями
    видаляють кінцеві ходи попереднього заповнення асистента перед тим, як запит досягне OpenRouter,
    відповідно до вимоги Anthropic, щоб розмови з міркуваннями завершувалися ходом користувача.
  </Accordion>

  <Accordion title="Вставлення мислення / міркувань">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень мислення з
    payload міркувань проксі OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають це вставлення міркувань. Hunter Alpha також пропускає
    проксі-міркування для застарілих налаштованих посилань на моделі, оскільки OpenRouter міг
    повертати текст фінальної відповіді в полях міркувань для цього вилученого маршруту.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter усе ще проходить через проксі-стиль OpenAI-сумісного шляху, тому
    нативне формування запитів лише для OpenAI, як-от `serviceTier`, Responses `store`,
    payload сумісності міркувань OpenAI і підказки кешу промптів, не пересилається.
  </Accordion>

  <Accordion title="Маршрути на базі Gemini">
    Посилання OpenRouter на базі Gemini залишаються на проксі-Gemini шляху: OpenClaw зберігає
    там очищення підписів думок Gemini, але не вмикає нативну перевірку відтворення Gemini
    або переписування bootstrap.
  </Accordion>

  <Accordion title="Метадані маршрутизації провайдера">
    Якщо ви передаєте маршрутизацію провайдера OpenRouter у параметрах моделі, OpenClaw пересилає
    її як метадані маршрутизації OpenRouter перед запуском спільних обгорток потоку.
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
