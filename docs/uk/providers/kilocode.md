---
read_when:
    - Вам потрібен єдиний ключ API для багатьох LLM
    - Ви хочете запускати моделі через Kilo Gateway в OpenClaw
summary: Використовуйте уніфікований API Kilo Gateway для доступу до багатьох моделей в OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-28T11:23:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: c51012b94d4b720795356b67c8482ae7ee0b37d401689e923be0b7732d77c4aa
    source_path: providers/kilocode.md
    workflow: 16
---

# Kilo Gateway

Kilo Gateway надає **уніфікований API**, який маршрутизує запити до багатьох моделей через єдину
кінцеву точку та API-ключ. Він сумісний з OpenAI, тож більшість OpenAI SDK працюють після зміни базової URL-адреси.

| Властивість | Значення                           |
| -------- | ---------------------------------- |
| Постачальник | `kilocode`                         |
| Автентифікація | `KILOCODE_API_KEY`                 |
| API      | OpenAI-сумісний                    |
| Базова URL-адреса | `https://api.kilo.ai/api/gateway/` |

## Початок роботи

<Steps>
  <Step title="Створіть обліковий запис">
    Перейдіть на [app.kilo.ai](https://app.kilo.ai), увійдіть або створіть обліковий запис, потім перейдіть до API-ключів і згенеруйте новий ключ.
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Або встановіть змінну середовища напряму:

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

## Стандартна модель

Стандартна модель — `kilocode/kilo/auto`, модель розумної маршрутизації,
керована постачальником Kilo Gateway.

<Note>
OpenClaw розглядає `kilocode/kilo/auto` як стабільне стандартне посилання, але не
публікує підтверджене джерелами зіставлення завдань із висхідними моделями для цього маршруту. Точна
висхідна маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway, а не
жорстко закодована в OpenClaw.
</Note>

## Вбудований каталог

OpenClaw динамічно виявляє доступні моделі з Kilo Gateway під час запуску. Використовуйте
`/models kilocode`, щоб переглянути повний список моделей, доступних у вашому обліковому записі.

Будь-яку модель, доступну на Gateway, можна використовувати з префіксом `kilocode/`:

| Посилання на модель                    | Примітки                           |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Стандартна — розумна маршрутизація |
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
    Kilo Gateway задокументовано у вихідному коді як сумісний з OpenRouter, тому він залишається на
    проксі-стилі OpenAI-сумісного шляху, а не на власному формуванні запитів OpenAI.

    - Посилання Kilo на основі Gemini залишаються на проксі-Gemini шляху, тому OpenClaw зберігає
      там очищення thought-signature Gemini без увімкнення власної перевірки повторного відтворення Gemini
      або переписування bootstrap.
    - Kilo Gateway використовує Bearer token з вашим API-ключем під капотом.

  </Accordion>

  <Accordion title="Обгортка потоку та reasoning">
    Спільна обгортка потоку Kilo додає заголовок застосунку постачальника та нормалізує
    проксі-навантаження reasoning для підтримуваних конкретних посилань на моделі.

    <Warning>
    `kilocode/kilo/auto` та інші підказки, що не підтримують proxy-reasoning, пропускають ін’єкцію reasoning.
    Якщо вам потрібна підтримка reasoning, використовуйте конкретне посилання на модель, наприклад
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Якщо виявлення моделей під час запуску не вдається, OpenClaw повертається до вбудованого статичного каталогу, що містить `kilocode/kilo/auto`.
    - Переконайтеся, що ваш API-ключ дійсний і що у вашому обліковому записі Kilo увімкнено потрібні моделі.
    - Коли Gateway працює як демон, переконайтеся, що `KILOCODE_API_KEY` доступний цьому процесу (наприклад у `~/.openclaw/.env` або через `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Панель керування Kilo Gateway, API-ключі та керування обліковим записом.
  </Card>
</CardGroup>
