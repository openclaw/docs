---
read_when:
    - Ви хочете моделі Xiaomi MiMo в OpenClaw
    - Вам потрібно налаштувати `XIAOMI_API_KEY`
summary: Використовуйте моделі Xiaomi MiMo з OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-25T08:51:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo — це API-платформа для моделей **MiMo**. OpenClaw використовує сумісний з OpenAI endpoint Xiaomi з автентифікацією за API-ключем.

| Властивість | Значення                       |
| ----------- | ------------------------------ |
| Постачальник | `xiaomi`                       |
| Автентифікація | `XIAOMI_API_KEY`             |
| API         | Сумісне з OpenAI               |
| Базова URL-адреса | `https://api.xiaomimimo.com/v1` |

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ у [консолі Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Або передайте ключ напряму:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Вбудований каталог

| Посилання на модель     | Вхідні дані | Контекст  | Макс. вивід | Міркування | Примітки      |
| ----------------------- | ----------- | --------- | ----------- | ---------- | ------------- |
| `xiaomi/mimo-v2-flash`  | текст       | 262,144   | 8,192       | Ні         | Модель за замовчуванням |
| `xiaomi/mimo-v2-pro`    | текст       | 1,048,576 | 32,000      | Так        | Великий контекст |
| `xiaomi/mimo-v2-omni`   | текст, зображення | 262,144 | 32,000      | Так        | Мультимодальна |

<Tip>
Посилання на модель за замовчуванням — `xiaomi/mimo-v2-flash`. Постачальник додається автоматично, коли встановлено `XIAOMI_API_KEY` або існує профіль автентифікації.
</Tip>

## Text-to-speech

У комплектний plugin `xiaomi` також входить реєстрація Xiaomi MiMo як постачальника мовлення для `messages.tts`. Він викликає TTS-контракт chat-completions Xiaomi з текстом як повідомленням `assistant` і необов’язковими вказівками щодо стилю як повідомленням `user`.

| Властивість | Значення                               |
| ----------- | -------------------------------------- |
| Ідентифікатор TTS | `xiaomi` (`mimo` alias)          |
| Автентифікація | `XIAOMI_API_KEY`                    |
| API         | `POST /v1/chat/completions` з `audio` |
| За замовчуванням | `mimo-v2.5-tts`, голос `mimo_default` |
| Вивід       | MP3 за замовчуванням; WAV, якщо налаштовано |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Серед підтримуваних вбудованих голосів: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`, `Milo` і `Dean`. `mimo-v2-tts` підтримується для старіших облікових записів MiMo TTS; за замовчуванням використовується поточна модель MiMo-V2.5 TTS. Для цілей голосових повідомлень, таких як Feishu і Telegram, OpenClaw перекодовує вивід Xiaomi у 48 кГц Opus за допомогою `ffmpeg` перед доставкою.

## Приклад конфігурації

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Поведінка автоматичного додавання">
    Постачальник `xiaomi` додається автоматично, коли `XIAOMI_API_KEY` встановлено у вашому середовищі або існує профіль автентифікації. Вам не потрібно вручну налаштовувати постачальника, якщо тільки ви не хочете перевизначити метадані моделі або базову URL-адресу.
  </Accordion>

  <Accordion title="Відомості про моделі">
    - **mimo-v2-flash** — легка й швидка модель, ідеальна для текстових завдань загального призначення. Підтримка міркування відсутня.
    - **mimo-v2-pro** — підтримує міркування з контекстним вікном на 1M токенів для навантажень із довгими документами.
    - **mimo-v2-omni** — мультимодальна модель із підтримкою міркування, яка приймає як текстові, так і графічні вхідні дані.

    <Note>
    Усі моделі використовують префікс `xiaomi/` (наприклад, `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Якщо моделі не з’являються, переконайтеся, що `XIAOMI_API_KEY` встановлено й він дійсний.
    - Коли Gateway працює як демон, переконайтеся, що ключ доступний для цього процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).

    <Warning>
    Ключі, встановлені лише у вашій інтерактивній оболонці, не видимі для процесів Gateway, якими керує демон. Для постійної доступності використовуйте `~/.openclaw/.env` або конфігурацію `env.shellEnv`.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації OpenClaw.
  </Card>
  <Card title="Консоль Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Панель керування Xiaomi MiMo та керування API-ключами.
  </Card>
</CardGroup>
