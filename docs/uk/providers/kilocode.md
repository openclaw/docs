---
read_when:
    - Вам потрібен один API-ключ для багатьох LLM
    - Ви хочете запускати моделі через Kilo Gateway в OpenClaw
summary: Використовуйте уніфікований API Kilo Gateway для доступу до багатьох моделей в OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-12T10:42:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32946f2187f3933115341cbe81006718b10583abc4deea7440b5e56366025f4a
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway надає **уніфікований API**, який маршрутизує запити до багатьох моделей через одну
кінцеву точку та API-ключ. Він сумісний з OpenAI, тож більшість OpenAI SDK працюють, якщо змінити базовий URL.

| Властивість | Значення                           |
| ----------- | ---------------------------------- |
| Постачальник | `kilocode`                         |
| Автентифікація | `KILOCODE_API_KEY`                 |
| API         | Сумісний з OpenAI                  |
| Базовий URL | `https://api.kilo.ai/api/gateway/` |

## Початок роботи

<Steps>
  <Step title="Створіть обліковий запис">
    Перейдіть на [app.kilo.ai](https://app.kilo.ai), увійдіть або створіть обліковий запис, потім перейдіть до API Keys і згенеруйте новий ключ.
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Або встановіть змінну середовища безпосередньо:

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

Моделлю за замовчуванням є `kilocode/kilo/auto`, модель із розумною маршрутизацією, що належить постачальнику
та керується Kilo Gateway.

<Note>
OpenClaw розглядає `kilocode/kilo/auto` як стабільне посилання за замовчуванням, але не
публікує підтверджене джерелами зіставлення завдань із висхідними моделями для цього маршруту. Точна
висхідна маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway, а не
жорстко закодована в OpenClaw.
</Note>

## Доступні моделі

OpenClaw динамічно виявляє доступні моделі з Kilo Gateway під час запуску. Використовуйте
`/models kilocode`, щоб побачити повний список моделей, доступних для вашого облікового запису.

Будь-яку модель, доступну в Gateway, можна використовувати з префіксом `kilocode/`:

| Посилання на модель                   | Примітки                           |
| ------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                  | За замовчуванням — розумна маршрутизація |
| `kilocode/anthropic/claude-sonnet-4`  | Anthropic через Kilo               |
| `kilocode/openai/gpt-5.4`             | OpenAI через Kilo                  |
| `kilocode/google/gemini-3-pro-preview` | Google через Kilo                  |
| ...та багато інших                    | Використовуйте `/models kilocode`, щоб переглянути всі |

<Tip>
Під час запуску OpenClaw виконує запит `GET https://api.kilo.ai/api/gateway/models` і об’єднує
виявлені моделі перед статичним резервним каталогом. Убудований резервний варіант завжди
включає `kilocode/kilo/auto` (`Kilo Auto`) з `input: ["text", "image"]`,
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
    шляху сумісності з OpenAI у проксі-стилі, а не використовує нативне формування запитів OpenAI.

    - Посилання Kilo на основі Gemini залишаються на проксі-шляху Gemini, тому OpenClaw зберігає
      там санітизацію thought-signature Gemini без увімкнення нативної перевірки
      повторного відтворення Gemini або переписування bootstrap.
    - Kilo Gateway під капотом використовує Bearer token з вашим API-ключем.

  </Accordion>

  <Accordion title="Обгортка потоку та reasoning">
    Спільна обгортка потоку Kilo додає заголовок застосунку постачальника та нормалізує
    проксі-пейлоади reasoning для підтримуваних конкретних посилань на моделі.

    <Warning>
    `kilocode/kilo/auto` та інші підказки, що не підтримують proxy-reasoning, пропускають ін’єкцію reasoning. Якщо вам потрібна підтримка reasoning, використовуйте конкретне посилання на модель, наприклад
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Усунення неполадок">
    - Якщо виявлення моделей не вдається під час запуску, OpenClaw повертається до вбудованого статичного каталогу, що містить `kilocode/kilo/auto`.
    - Переконайтеся, що ваш API-ключ дійсний і що у вашому обліковому записі Kilo увімкнено потрібні моделі.
    - Коли Gateway працює як демон, переконайтеся, що `KILOCODE_API_KEY` доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Довідник з конфігурації" href="/uk/gateway/configuration" icon="gear">
    Повний довідник з конфігурації OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Інформаційна панель Kilo Gateway, API-ключі та керування обліковим записом.
  </Card>
</CardGroup>
