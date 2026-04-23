---
read_when:
    - Ви хочете один API key для багатьох LLM-ів
    - Ви хочете запускати моделі через Kilo Gateway в OpenClaw
summary: Використовуйте єдиний API Kilo Gateway для доступу до багатьох моделей в OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-23T21:06:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 413366f6d9668beffea4c799f18fa81e3cf2ed44e9ba08e105791417f6a275b4
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway надає **єдиний API**, який маршрутизує запити до багатьох моделей через одну
кінцеву точку та один API key. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють, якщо змінити base URL.

| Властивість | Значення                           |
| ----------- | ---------------------------------- |
| Provider    | `kilocode`                         |
| Auth        | `KILOCODE_API_KEY`                 |
| API         | OpenAI-compatible                  |
| Base URL    | `https://api.kilo.ai/api/gateway/` |

## Початок роботи

<Steps>
  <Step title="Створіть обліковий запис">
    Перейдіть на [app.kilo.ai](https://app.kilo.ai), увійдіть або створіть обліковий запис, потім перейдіть до API Keys і згенеруйте новий ключ.
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Або задайте змінну середовища напряму:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Типова модель

Типова модель — `kilocode/kilo/auto`, модель smart-routing, якою керує
сам Kilo Gateway.

<Note>
OpenClaw вважає `kilocode/kilo/auto` стабільним типовим посиланням, але не
публікує прив’язку завдання до upstream-моделі, підтверджену джерелом, для цього маршруту. Точна
маршрутизація upstream за `kilocode/kilo/auto` належить Kilo Gateway, а не
жорстко закодована в OpenClaw.
</Note>

## Доступні моделі

OpenClaw динамічно виявляє доступні моделі з Kilo Gateway під час запуску. Використовуйте
`/models kilocode`, щоб побачити повний список моделей, доступних для вашого облікового запису.

Будь-яку модель, доступну через gateway, можна використовувати з префіксом `kilocode/`:

| Посилання на модель                    | Примітки                           |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Типове — smart routing            |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic через Kilo              |
| `kilocode/openai/gpt-5.5`              | OpenAI через Kilo                 |
| `kilocode/google/gemini-3-pro-preview` | Google через Kilo                 |
| ...і багато інших                      | Використовуйте `/models kilocode`, щоб побачити повний список |

<Tip>
Під час запуску OpenClaw виконує запит `GET https://api.kilo.ai/api/gateway/models` і об’єднує
виявлені моделі перед статичним fallback-каталогом. Bundled fallback завжди
включає `kilocode/kilo/auto` (`Kilo Auto`) з `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` і `maxTokens: 128000`.
</Tip>

## Приклад config

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
  <Accordion title="Transport і сумісність">
    Kilo Gateway у вихідному коді задокументований як сумісний з OpenRouter, тому він залишається на
    proxy-style OpenAI-compatible шляху замість нативного shaping запитів OpenAI.

    - Посилання Kilo на основі Gemini залишаються на шляху proxy-Gemini, тому OpenClaw зберігає
      там sanitation thought-signature Gemini без увімкнення нативної
      replay-валідації Gemini або bootstrap-переписування.
    - Kilo Gateway під капотом використовує Bearer token з вашим API key.

  </Accordion>

  <Accordion title="Wrapper stream і reasoning">
    Спільний wrapper stream Kilo додає заголовок provider app і нормалізує
    proxy reasoning payload-и для підтримуваних конкретних посилань на моделі.

    <Warning>
    `kilocode/kilo/auto` та інші підказки, де proxy reasoning не підтримується, пропускають ін’єкцію reasoning.
    Якщо вам потрібна підтримка reasoning, використовуйте конкретне посилання на модель, наприклад
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Якщо виявлення моделей під час запуску завершується помилкою, OpenClaw повертається до bundled статичного каталогу, що містить `kilocode/kilo/auto`.
    - Підтвердьте, що ваш API key чинний і що у вашому обліковому записі Kilo ввімкнені потрібні моделі.
    - Коли Gateway працює як daemon, переконайтеся, що `KILOCODE_API_KEY` доступний цьому процесу (наприклад у `~/.openclaw/.env` або через `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Панель Kilo Gateway, API key і керування обліковим записом.
  </Card>
</CardGroup>
