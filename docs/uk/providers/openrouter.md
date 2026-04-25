---
read_when:
    - Вам потрібен один API-ключ для багатьох LLM
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T03:44:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0dfbe92fbe229b3d0c22fa7997adc1906609bc3ee63c780b1f66f545d327f49
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей через одну
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
Посилання на моделі мають шаблон `openrouter/<provider>/<model>`. Повний список
доступних провайдерів і моделей дивіться в [/concepts/model-providers](/uk/concepts/model-providers).
</Note>

Приклади вбудованих резервних варіантів:

| Model ref                            | Примітки                     |
| ------------------------------------ | ---------------------------- |
| `openrouter/auto`                    | Автоматична маршрутизація OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 через MoonshotAI   |
| `openrouter/openrouter/healer-alpha` | Маршрут OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | Маршрут OpenRouter Hunter Alpha |

## Генерація зображень

OpenRouter також може використовуватися для інструмента `image_generate`. Використовуйте модель OpenRouter для зображень у `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw надсилає запити на зображення до API зображень chat completions OpenRouter з `modalities: ["image", "text"]`. Моделі зображень Gemini отримують підтримувані підказки `aspectRatio` і `resolution` через `image_config` OpenRouter.

## Перетворення тексту на мовлення

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

Якщо `messages.tts.providers.openrouter.apiKey` не вказано, TTS повторно використовує
`models.providers.openrouter.apiKey`, а потім `OPENROUTER_API_KEY`.

## Автентифікація та заголовки

OpenRouter під капотом використовує Bearer token з вашим API-ключем.

Для справжніх запитів OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані OpenRouter заголовки атрибуції застосунку:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Якщо ви перенаправите провайдера OpenRouter на якийсь інший проксі або базовий URL, OpenClaw
**не** додає ці специфічні для OpenRouter заголовки або маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання кешу промптів у блоках системних/розробницьких промптів.
  </Accordion>

  <Accordion title="Ін’єкція thinking / reasoning">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking із
    проксі-пейлоадами reasoning OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають цю ін’єкцію reasoning.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter усе ще працює через сумісний із OpenAI шлях у стилі проксі, тому
    власне OpenAI-специфічне формування запитів, як-от `serviceTier`, `store` у Responses,
    пейлоади сумісності reasoning OpenAI та підказки кешу промптів, не пересилаються далі.
  </Accordion>

  <Accordion title="Маршрути на базі Gemini">
    Посилання OpenRouter на базі Gemini залишаються на проксі-шляху Gemini: OpenClaw зберігає
    там санітизацію thought-signature Gemini, але не вмикає нативну перевірку повторного відтворення Gemini
    або bootstrap-перезаписи.
  </Accordion>

  <Accordion title="Метадані маршрутизації провайдера">
    Якщо ви передаєте маршрутизацію провайдера OpenRouter у параметрах моделі, OpenClaw пересилає
    її як метадані маршрутизації OpenRouter до запуску спільних обгорток потоку.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Довідник з конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник з конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
