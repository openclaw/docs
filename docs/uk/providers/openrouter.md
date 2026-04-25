---
read_when:
    - Вам потрібен один API-ключ для багатьох LLM.
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень.
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T17:33:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5396b0a022746cf3dfc90fa2d0974ffe9798af1ac790e93d13398a9e622eceff
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей через єдину
кінцеву точку та API-ключ. Він сумісний з OpenAI, тому більшість SDK OpenAI працюють після зміни базового URL.

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
  <Step title="(Необов’язково) Перемкніться на конкретну модель">
    Під час онбордингу за замовчуванням використовується `openrouter/auto`. Пізніше виберіть конкретну модель:

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
доступних provider-ів і моделей дивіться в [/concepts/model-providers](/uk/concepts/model-providers).
</Note>

Приклади вбудованого fallback:

| Посилання на модель                | Примітки                      |
| ---------------------------------- | ----------------------------- |
| `openrouter/auto`                  | Автоматична маршрутизація OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`  | Kimi K2.6 через MoonshotAI    |
| `openrouter/openrouter/healer-alpha` | Маршрут OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | Маршрут OpenRouter Hunter Alpha |

## Генерація зображень

OpenRouter також може бути джерелом для інструмента `image_generate`. Використовуйте модель зображень OpenRouter у `agents.defaults.imageGenerationModel`:

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

## Перетворення тексту на мовлення

OpenRouter також можна використовувати як TTS provider через його сумісну з OpenAI
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

Якщо `messages.tts.providers.openrouter.apiKey` не вказано, TTS повторно використовує
`models.providers.openrouter.apiKey`, а потім `OPENROUTER_API_KEY`.

## Автентифікація та заголовки

OpenRouter використовує Bearer token із вашим API-ключем на нижчому рівні.

Для реальних запитів OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані OpenRouter заголовки атрибуції застосунку:

| Заголовок                 | Значення              |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Якщо ви перенаправите provider OpenRouter на якийсь інший proxy або base URL, OpenClaw
**не** додаватиме ці специфічні для OpenRouter заголовки або маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Маркери кешу Anthropic">
    Для перевірених маршрутів OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання prompt-cache у блоках system/developer prompt.
  </Accordion>

  <Accordion title="Ін’єкція thinking / reasoning">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking з
    payload reasoning proxy OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають цю ін’єкцію reasoning.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter усе ще працює через сумісний з OpenAI шлях у стилі proxy, тому
    нативне формування запитів лише для OpenAI, таке як `serviceTier`, `store` у Responses,
    payload сумісності reasoning OpenAI та підказки prompt-cache, не пересилається.
  </Accordion>

  <Accordion title="Маршрути на базі Gemini">
    Посилання OpenRouter на базі Gemini залишаються на proxy-Gemini шляху: OpenClaw зберігає
    там очищення thought-signature Gemini, але не вмикає нативну
    перевірку повторного відтворення Gemini або bootstrap rewrites.
  </Accordion>

  <Accordion title="Метадані маршрутизації provider-а">
    Якщо ви передаєте маршрутизацію provider-а OpenRouter у параметрах моделі, OpenClaw пересилає
    її як метадані маршрутизації OpenRouter до запуску спільних обгорток потоків.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації для agents, моделей і provider-ів.
  </Card>
</CardGroup>
