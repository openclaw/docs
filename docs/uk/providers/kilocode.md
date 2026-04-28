---
read_when:
    - Вам потрібен один API key для багатьох LLM
    - Ви хочете запускати моделі через Kilo Gateway в OpenClaw
summary: Використовуйте уніфікований API Kilo Gateway для доступу до багатьох моделей в OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-23T23:05:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa3c29e7b39b1dfb049444c7ef2759555bb3f94479622d58fa2aa8fd6389d01f
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway надає **уніфікований API**, який маршрутизує запити до багатьох моделей через єдиний
endpoint і API key. Він сумісний з OpenAI, тому більшість SDK OpenAI працюють після зміни base URL.

| Властивість | Значення                            |
| ----------- | ----------------------------------- |
| Провайдер   | `kilocode`                          |
| Auth        | `KILOCODE_API_KEY`                  |
| API         | OpenAI-compatible                   |
| Base URL    | `https://api.kilo.ai/api/gateway/`  |

## Початок роботи

<Steps>
  <Step title="Створіть обліковий запис">
    Перейдіть на [app.kilo.ai](https://app.kilo.ai), увійдіть або створіть обліковий запис, потім відкрийте API Keys і згенеруйте новий ключ.
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Або задайте environment variable безпосередньо:

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

## Стандартна модель

Стандартна модель — `kilocode/kilo/auto`, модель із розумною маршрутизацією,
якою керує сам провайдер Kilo Gateway.

<Note>
OpenClaw вважає `kilocode/kilo/auto` стабільним стандартним ref, але не
публікує відображення завдань у висхідні моделі для цього маршруту, підтвердженого джерелом. Точна
висхідна маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway, а не
жорстко закодована в OpenClaw.
</Note>

## Вбудований каталог

OpenClaw динамічно виявляє доступні моделі з Kilo Gateway під час запуску. Використовуйте
`/models kilocode`, щоб побачити повний список моделей, доступних для вашого облікового запису.

Будь-яку модель, доступну через gateway, можна використовувати з префіксом `kilocode/`:

| Посилання на модель                    | Примітки                           |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Стандартна — розумна маршрутизація |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic через Kilo               |
| `kilocode/openai/gpt-5.5`              | OpenAI через Kilo                  |
| `kilocode/google/gemini-3-pro-preview` | Google через Kilo                  |
| ...and many more                       | Використовуйте `/models kilocode`, щоб переглянути всі |

<Tip>
Під час запуску OpenClaw виконує запит `GET https://api.kilo.ai/api/gateway/models` і об’єднує
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
    У вихідному коді Kilo Gateway задокументовано як сумісний з OpenRouter, тому він залишається на
    proxy-style шляху, сумісному з OpenAI, а не використовує нативне формування запитів OpenAI.

    - Посилання Kilo на базі Gemini залишаються на proxy-Gemini шляху, тому OpenClaw зберігає
      там очищення thought-signature Gemini без увімкнення нативної
      валідації replay Gemini або переписування bootstrap.
    - Kilo Gateway під капотом використовує Bearer token з вашим API key.

  </Accordion>

  <Accordion title="Обгортка stream і reasoning">
    Спільна обгортка stream Kilo додає заголовок застосунку провайдера й нормалізує
    payload reasoning через proxy для підтримуваних конкретних ref моделей.

    <Warning>
    `kilocode/kilo/auto` та інші підказки, які не підтримують reasoning через proxy, пропускають вставлення reasoning.
    Якщо вам потрібна підтримка reasoning, використовуйте конкретне посилання на модель, наприклад
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Якщо виявлення моделей не вдається під час запуску, OpenClaw переходить до вбудованого статичного каталогу, що містить `kilocode/kilo/auto`.
    - Переконайтеся, що ваш API key дійсний і що у вашому обліковому записі Kilo ввімкнено потрібні моделі.
    - Коли Gateway працює як демон, переконайтеся, що `KILOCODE_API_KEY` доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник з конфігурації OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Панель Kilo Gateway, API keys і керування обліковим записом.
  </Card>
</CardGroup>
