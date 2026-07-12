---
read_when:
    - Вам потрібен один API-ключ для багатьох великих мовних моделей
    - Ви хочете запускати моделі через Kilo Gateway в OpenClaw
summary: Використовуйте уніфікований API Kilo Gateway для доступу до багатьох моделей в OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-12T13:37:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway спрямовує запити до багатьох моделей через єдину сумісну з OpenAI кінцеву точку та ключ API.

| Властивість | Значення                           |
| ------------ | ---------------------------------- |
| Провайдер    | `kilocode`                         |
| Автентифікація | `KILOCODE_API_KEY`               |
| API          | Сумісний з OpenAI                  |
| Базова URL-адреса | `https://api.kilo.ai/api/gateway/` |

## Установлення Plugin

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Налаштування

<Steps>
  <Step title="Створіть обліковий запис">
    Перейдіть на [app.kilo.ai](https://app.kilo.ai), увійдіть або створіть обліковий запис, а потім згенеруйте ключ API.
  </Step>
  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Або задайте змінну середовища безпосередньо:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Перевірте доступність моделі">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Типова модель і каталог

Типова модель — `kilocode/kilo/auto`, модель інтелектуальної маршрутизації, якою керує провайдер. OpenClaw не
публікує для неї зіставлення завдань із моделями вищого рівня; маршрутизацією за `kilo/auto` керує Kilo Gateway.

Під час запуску OpenClaw виконує запит `GET https://api.kilo.ai/api/gateway/models` і додає виявлені моделі
перед статичним резервним каталогом. Статичний резервний каталог містить лише `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`).

До будь-якої моделі на Gateway можна звертатися як до `kilocode/<upstream-id>` (наприклад,
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Виконайте `/models kilocode` або
`openclaw models list --provider kilocode`, щоб переглянути повний список виявлених моделей.

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

## Примітки щодо поведінки

<AccordionGroup>
  <Accordion title="Транспорт і сумісність">
    Kilo Gateway сумісний з OpenRouter, тому використовує проксі-шлях запитів, сумісний з OpenAI,
    замість нативного формування запитів OpenAI (без `store` і без даних рівня інтенсивності міркування OpenAI).

    - Посилання Kilo на базі Gemini залишаються на проксі-шляху Gemini: OpenClaw очищує там
      сигнатури міркувань Gemini, але не вмикає нативну перевірку відтворення Gemini чи перезапис початкового завантаження.
    - Запити використовують токен Bearer, створений із вашого ключа API.

  </Accordion>

  <Accordion title="Обгортка потоку та міркування">
    Обгортка потоку Kilo додає до запиту заголовок `X-KILOCODE-FEATURE` (типово `openclaw`,
    можна перевизначити змінною середовища `KILOCODE_FEATURE`) і нормалізує дані рівня інтенсивності міркування для
    моделей, які це підтримують.

    <Warning>
    Посилання `kilocode/kilo/auto` і `x-ai/*` пропускають додавання рівня інтенсивності міркування. Якщо вам потрібна підтримка міркування,
    використовуйте посилання на конкретну модель, наприклад `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Якщо під час запуску не вдається виявити моделі, OpenClaw використовує резервний статичний каталог, що містить `kilocode/kilo/auto`.
    - Переконайтеся, що ваш ключ API дійсний і що у вашому обліковому записі Kilo ввімкнено потрібні моделі.
    - Коли Gateway працює як демон, переконайтеся, що `KILOCODE_API_KEY` доступна цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання після відмови.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Панель керування Kilo Gateway, ключі API та керування обліковим записом.
  </Card>
</CardGroup>
