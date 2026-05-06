---
read_when:
    - Вам потрібен єдиний ключ API для багатьох великих мовних моделей
    - Ви хочете запускати моделі через Kilo Gateway в OpenClaw
summary: Використовуйте уніфікований API Kilo Gateway для доступу до багатьох моделей в OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-06T16:17:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway надає **уніфікований API**, який маршрутизує запити до багатьох моделей через єдину
кінцеву точку й ключ API. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після зміни базової URL-адреси.

| Властивість | Значення                           |
| -------- | ---------------------------------- |
| Постачальник | `kilocode`                         |
| Автентифікація | `KILOCODE_API_KEY`                 |
| API      | Сумісний з OpenAI                  |
| Базова URL-адреса | `https://api.kilo.ai/api/gateway/` |

## Початок роботи

<Steps>
  <Step title="Створіть обліковий запис">
    Перейдіть на [app.kilo.ai](https://app.kilo.ai), увійдіть або створіть обліковий запис, потім перейдіть до API Keys і згенеруйте новий ключ.
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Або задайте змінну середовища безпосередньо:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Модель за замовчуванням

Модель за замовчуванням — `kilocode/kilo/auto`, модель розумної маршрутизації,
якою керує постачальник Kilo Gateway.

<Note>
OpenClaw розглядає `kilocode/kilo/auto` як стабільний ref за замовчуванням, але не
публікує підтверджене джерелами зіставлення завдань із вихідними upstream-моделями для цього маршруту. Точна
upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway, а не
жорстко закодована в OpenClaw.
</Note>

## Вбудований каталог

OpenClaw динамічно виявляє доступні моделі з Kilo Gateway під час запуску. Використовуйте
`/models kilocode`, щоб побачити повний список моделей, доступних для вашого облікового запису.

Будь-яку модель, доступну на Gateway, можна використовувати з префіксом `kilocode/`:

| Ref моделі                              | Примітки                           |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | За замовчуванням — розумна маршрутизація |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic через Kilo               |
| `kilocode/openai/gpt-5.5`              | OpenAI через Kilo                  |
| `kilocode/google/gemini-3-pro-preview` | Google через Kilo                  |
| ...і багато інших                      | Використовуйте `/models kilocode`, щоб перелічити всі |

<Tip>
Під час запуску OpenClaw запитує `GET https://api.kilo.ai/api/gateway/models` і об’єднує
виявлені моделі перед статичним резервним каталогом. Вбудований резервний каталог завжди
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
  <Accordion title="Транспорт і сумісність">
    Kilo Gateway задокументовано в джерелі як сумісний з OpenRouter, тому він залишається на
    proxy-стилі шляху, сумісного з OpenAI, замість нативного формування запитів OpenAI.

    - Kilo refs на основі Gemini залишаються на proxy-Gemini шляху, тому OpenClaw зберігає
      санітизацію thought-signature Gemini там без увімкнення нативної валідації
      повторного відтворення Gemini або переписування bootstrap.
    - Kilo Gateway приховано використовує Bearer token з вашим ключем API.

  </Accordion>

  <Accordion title="Обгортка потоку та reasoning">
    Спільна обгортка потоку Kilo додає заголовок застосунку постачальника й нормалізує
    proxy reasoning payloads для підтримуваних конкретних refs моделей.

    <Warning>
    `kilocode/kilo/auto` та інші підказки, що не підтримують proxy-reasoning, пропускають
    ін’єкцію reasoning. Якщо вам потрібна підтримка reasoning, використовуйте конкретний ref моделі, наприклад
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Якщо виявлення моделей під час запуску не вдається, OpenClaw повертається до вбудованого статичного каталогу, що містить `kilocode/kilo/auto`.
    - Переконайтеся, що ваш ключ API чинний і що для вашого облікового запису Kilo увімкнено потрібні моделі.
    - Коли Gateway працює як daemon, переконайтеся, що `KILOCODE_API_KEY` доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, refs моделей і поведінки failover.
  </Card>
  <Card title="Довідник з конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник з конфігурації OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Dashboard Kilo Gateway, ключі API та керування обліковим записом.
  </Card>
</CardGroup>
