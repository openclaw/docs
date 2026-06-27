---
read_when:
    - Вам потрібен єдиний API-ключ для багатьох LLMs
    - Ви хочете запускати моделі через Kilo Gateway в OpenClaw
summary: Використовуйте уніфікований API Kilo Gateway для доступу до багатьох моделей в OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-27T18:12:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway надає **уніфікований API**, який маршрутизує запити до багатьох моделей через одну
кінцеву точку та API-ключ. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після зміни базової URL-адреси.

| Властивість | Значення                           |
| ----------- | ---------------------------------- |
| Постачальник | `kilocode`                        |
| Автентифікація | `KILOCODE_API_KEY`              |
| API         | сумісний з OpenAI                  |
| Базова URL-адреса | `https://api.kilo.ai/api/gateway/` |

## Встановлення плагіна

Установіть офіційний плагін, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

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
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Стандартна модель

Стандартна модель — `kilocode/kilo/auto`, модель із розумною маршрутизацією,
якою керує постачальник через Kilo Gateway.

<Note>
OpenClaw розглядає `kilocode/kilo/auto` як стабільне стандартне посилання, але не
публікує підкріплене джерелами зіставлення завдань із upstream-моделями для цього маршруту. Точна
upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway, а не
жорстко закодована в OpenClaw.
</Note>

## Вбудований каталог

OpenClaw динамічно виявляє доступні моделі з Kilo Gateway під час запуску. Використовуйте
`/models kilocode`, щоб побачити повний список моделей, доступних у вашому обліковому записі.

Будь-яку модель, доступну на Gateway, можна використовувати з префіксом `kilocode/`:

| Посилання на модель                      | Нотатки                            |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | Стандартна — розумна маршрутизація |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic через Kilo               |
| `kilocode/openai/gpt-5.5`                | OpenAI через Kilo                  |
| `kilocode/google/gemini-3.1-pro-preview` | Google через Kilo                  |
| ...і багато інших                        | Використовуйте `/models kilocode`, щоб переглянути всі |

<Tip>
Під час запуску OpenClaw виконує запит `GET https://api.kilo.ai/api/gateway/models` і об’єднує
виявлені моделі перед статичним резервним каталогом. Статичний резервний каталог завжди
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
    proxy-стилі шляху, сумісному з OpenAI, замість нативного формування запитів OpenAI.

    - Посилання Kilo на базі Gemini залишаються на proxy-Gemini шляху, тому OpenClaw зберігає
      очищення thought-signature Gemini там без увімкнення нативної перевірки
      повторного відтворення Gemini або переписування bootstrap.
    - Kilo Gateway під капотом використовує Bearer-токен із вашим API-ключем.

  </Accordion>

  <Accordion title="Обгортка потоку та reasoning">
    Спільна обгортка потоку Kilo додає заголовок застосунку постачальника та нормалізує
    proxy reasoning payloads для підтримуваних конкретних посилань на моделі.

    <Warning>
    `kilocode/kilo/auto` та інші підказки, що не підтримують proxy-reasoning, пропускають
    ін’єкцію reasoning. Якщо вам потрібна підтримка reasoning, використовуйте конкретне посилання на модель, наприклад
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Якщо виявлення моделей під час запуску не вдається, OpenClaw повертається до статичного каталогу, що містить `kilocode/kilo/auto`.
    - Переконайтеся, що ваш API-ключ дійсний і що у вашому обліковому записі Kilo увімкнено потрібні моделі.
    - Коли Gateway працює як daemon, переконайтеся, що `KILOCODE_API_KEY` доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Панель керування Kilo Gateway, API-ключі та керування обліковим записом.
  </Card>
</CardGroup>
