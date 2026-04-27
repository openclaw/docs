---
read_when:
    - Вам потрібен один API-ключ для багатьох LLM
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-27T12:54:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fcbad5f5b303d3e5eb8a855cd8b3234e7d4a5460e07c7b27c407524ea9540fc
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей через єдину
кінцеву точку та API-ключ. Він сумісний з OpenAI, тому більшість SDK OpenAI працюють, якщо змінити base URL.

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
    Onboarding типово використовує `openrouter/auto`. Пізніше виберіть конкретну модель:

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
Посилання на моделі мають формат `openrouter/<provider>/<model>`. Повний список
доступних провайдерів і моделей див. у [/concepts/model-providers](/uk/concepts/model-providers).
</Note>

Приклади комплектних резервних варіантів:

| Посилання на модель              | Примітки                     |
| -------------------------------- | ---------------------------- |
| `openrouter/auto`                | Автоматична маршрутизація OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI  |

## Генерація зображень

OpenRouter також може бути основою для інструмента `image_generate`. Використовуйте модель зображень OpenRouter у `agents.defaults.imageGenerationModel`:

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

OpenClaw надсилає запити на зображення до image API chat completions OpenRouter з `modalities: ["image", "text"]`. Моделі зображень Gemini отримують підтримувані підказки `aspectRatio` і `resolution` через `image_config` OpenRouter. Використовуйте `agents.defaults.imageGenerationModel.timeoutMs` для повільніших моделей зображень OpenRouter; параметр `timeoutMs` для окремого виклику інструмента `image_generate` усе одно має пріоритет.

## Синтез мовлення

OpenRouter також можна використовувати як провайдера TTS через його OpenAI-compatible
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

OpenRouter під капотом використовує Bearer token з вашим API-ключем.

Для реальних запитів OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані заголовки attribution застосунку OpenRouter:

| Заголовок                | Значення              |
| ------------------------ | --------------------- |
| `HTTP-Referer`           | `https://openclaw.ai` |
| `X-OpenRouter-Title`     | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`          |

<Warning>
Якщо ви перенаправите провайдера OpenRouter на якийсь інший proxy або base URL, OpenClaw
**не** додаватиме ці специфічні для OpenRouter заголовки чи маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери `cache_control` Anthropic, які OpenClaw використовує для
    кращого повторного використання кешу prompt для блоків system/developer prompt.
  </Accordion>

  <Accordion title="Ін’єкція thinking / reasoning">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking із
    payload reasoning proxy OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають цю ін’єкцію reasoning. Hunter Alpha також пропускає
    proxy reasoning для застарілих налаштованих посилань на моделі, оскільки OpenRouter міг
    повертати текст фінальної відповіді в полях reasoning для цього знятого з використання маршруту.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter усе ще працює через шлях proxy-стилю OpenAI-compatible, тому
    нативне формування запитів лише для OpenAI, таке як `serviceTier`, `store` у Responses,
    payload сумісності reasoning OpenAI та підказки кешу prompt, не пересилається.
  </Accordion>

  <Accordion title="Маршрути на базі Gemini">
    Посилання OpenRouter на базі Gemini залишаються на шляху proxy-Gemini: OpenClaw зберігає
    там санітизацію thought-signature Gemini, але не вмикає нативну валідацію повтору Gemini
    чи переписування bootstrap.
  </Accordion>

  <Accordion title="Метадані маршрутизації провайдера">
    Якщо ви передасте маршрутизацію провайдера OpenRouter у параметрах моделі, OpenClaw переспрямує
    її як метадані маршрутизації OpenRouter перед запуском спільних обгорток потоку.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінка failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
