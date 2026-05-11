---
read_when:
    - Вам потрібен єдиний API-ключ для багатьох LLM
    - Ви хочете запускати моделі через Kilo Gateway у OpenClaw
summary: Використовуйте уніфікований API Kilo Gateway для доступу до багатьох моделей в OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-11T20:54:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3de2d983a028082d0a897fdafa48ff1f2ad82f3aacec547763159db07adb00a2
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway надає **єдиний API**, який маршрутизує запити до багатьох моделей через одну
кінцеву точку й API-ключ. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після зміни базової URL-адреси.

| Властивість | Значення                           |
| -------- | ---------------------------------- |
| Провайдер | `kilocode`                         |
| Автентифікація | `KILOCODE_API_KEY`                 |
| API      | сумісний з OpenAI                  |
| Базова URL-адреса | `https://api.kilo.ai/api/gateway/` |

## Початок роботи

<Steps>
  <Step title="Create an account">
    Перейдіть на [app.kilo.ai](https://app.kilo.ai), увійдіть або створіть обліковий запис, потім перейдіть до API Keys і згенеруйте новий ключ.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Або задайте змінну середовища безпосередньо:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Модель за замовчуванням

Модель за замовчуванням — `kilocode/kilo/auto`, модель розумної маршрутизації,
якою керує провайдер Kilo Gateway.

<Note>
OpenClaw розглядає `kilocode/kilo/auto` як стабільне посилання за замовчуванням, але не
публікує зіставлення завдань із вихідними upstream-моделями для цього маршруту, підтверджене джерелами. Точна
upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway, а не
жорстко закодована в OpenClaw.
</Note>

## Вбудований каталог

OpenClaw динамічно виявляє доступні моделі з Kilo Gateway під час запуску. Використовуйте
`/models kilocode`, щоб побачити повний список моделей, доступних для вашого облікового запису.

Будь-яку модель, доступну на Gateway, можна використовувати з префіксом `kilocode/`:

| Посилання на модель                     | Примітки                           |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | За замовчуванням — розумна маршрутизація |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic через Kilo               |
| `kilocode/openai/gpt-5.5`                | OpenAI через Kilo                  |
| `kilocode/google/gemini-3.1-pro-preview` | Google через Kilo                  |
| ...і багато інших                        | Використовуйте `/models kilocode`, щоб перелічити всі |

<Tip>
Під час запуску OpenClaw виконує запит `GET https://api.kilo.ai/api/gateway/models` і об’єднує
виявлені моделі перед статичним резервним каталогом. Вбудований резервний варіант завжди
містить `kilocode/kilo/auto` (`Kilo Auto`) з `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` і `maxTokens: 128000`.
</Tip>

## Приклад конфігурації

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Kilo Gateway задокументовано в джерелі як сумісний з OpenRouter, тому він залишається на
    проксі-подібному шляху, сумісному з OpenAI, а не на нативному формуванні запитів OpenAI.

    - Kilo-посилання на базі Gemini залишаються на проксі-Gemini шляху, тому OpenClaw зберігає
      санітизацію thought-signature Gemini там, без увімкнення нативної
      перевірки відтворення Gemini або bootstrap-переписувань.
    - Kilo Gateway використовує Bearer token із вашим API-ключем під капотом.

  </Accordion>

  <Accordion title="Stream wrapper and reasoning">
    Спільна потокова обгортка Kilo додає заголовок застосунку провайдера й нормалізує
    проксі-навантаження reasoning для підтримуваних конкретних посилань на моделі.

    <Warning>
    `kilocode/kilo/auto` та інші підказки, що не підтримують proxy-reasoning, пропускають ін’єкцію reasoning.
    Якщо вам потрібна підтримка reasoning, використовуйте конкретне посилання на модель, наприклад
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Якщо виявлення моделей не вдається під час запуску, OpenClaw повертається до вбудованого статичного каталогу, що містить `kilocode/kilo/auto`.
    - Переконайтеся, що ваш API-ключ дійсний і що у вашому обліковому записі Kilo увімкнено потрібні моделі.
    - Коли Gateway працює як daemon, переконайтеся, що `KILOCODE_API_KEY` доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Панель керування Kilo Gateway, API-ключі та керування обліковим записом.
  </Card>
</CardGroup>
