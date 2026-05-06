---
read_when:
    - Вам потрібні моделі Xiaomi MiMo в OpenClaw
    - Потрібно налаштувати XIAOMI_API_KEY
summary: Використання моделей Xiaomi MiMo з OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-05-06T00:38:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7bb33bf107cb44414b0f3a6140d60fdfecb3b7154c3197e7cbed982d9a6450b
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo — це API-платформа для моделей **MiMo**. OpenClaw містить вбудований Plugin `xiaomi`, який реєструє як OpenAI-сумісного постачальника чату, так і постачальника мовлення (TTS) для того самого `XIAOMI_API_KEY`.

| Властивість         | Значення                                  |
| ------------------- | ----------------------------------------- |
| ID постачальника    | `xiaomi`                                  |
| Plugin              | вбудований, `enabledByDefault: true`      |
| Змінна env для auth | `XIAOMI_API_KEY`                          |
| Прапорець onboarding | `--auth-choice xiaomi-api-key`           |
| Прямий прапорець CLI | `--xiaomi-api-key <key>`                 |
| Контракти           | завершення чату + `speechProviders`       |
| API                 | OpenAI-сумісний (`openai-completions`)    |
| Базова URL-адреса   | `https://api.xiaomimimo.com/v1`           |
| Модель за замовчуванням | `xiaomi/mimo-v2-flash`               |
| TTS за замовчуванням | `mimo-v2.5-tts`, голос `mimo_default`    |

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ у [консолі Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Або передайте ключ напряму:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Вбудований каталог

| Посилання на модель  | Вхідні дані | Контекст  | Макс. вихід | Міркування | Примітки                    |
| -------------------- | ----------- | --------- | ----------- | ---------- | --------------------------- |
| `xiaomi/mimo-v2-flash` | текст      | 262,144   | 8,192       | Ні         | Модель за замовчуванням     |
| `xiaomi/mimo-v2-pro` | текст       | 1,048,576 | 32,000      | Так        | Великий контекст            |
| `xiaomi/mimo-v2-omni` | текст, зображення | 262,144 | 32,000  | Так        | Мультимодальна              |

<Tip>
Посилання на модель за замовчуванням — `xiaomi/mimo-v2-flash`. Постачальник впроваджується автоматично, коли встановлено `XIAOMI_API_KEY` або існує auth-профіль.
</Tip>

## Перетворення тексту на мовлення

Вбудований Plugin `xiaomi` також реєструє Xiaomi MiMo як постачальника мовлення для
`messages.tts`. Він викликає TTS-контракт Xiaomi для завершень чату з текстом як
повідомленням `assistant` і необов’язковими вказівками стилю як повідомленням `user`.

| Властивість | Значення                                 |
| ----------- | ---------------------------------------- |
| ID TTS      | `xiaomi` (псевдонім `mimo`)              |
| Auth        | `XIAOMI_API_KEY`                         |
| API         | `POST /v1/chat/completions` з `audio`    |
| За замовчуванням | `mimo-v2.5-tts`, голос `mimo_default` |
| Вихід       | MP3 за замовчуванням; WAV, якщо налаштовано |

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

Підтримувані вбудовані голоси включають `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` і `Dean`. `mimo-v2-tts` підтримується для старіших облікових записів MiMo
TTS; за замовчуванням використовується поточна модель MiMo-V2.5 TTS. Для цільових
голосових нотаток, як-от Feishu і Telegram, OpenClaw транскодує вихід Xiaomi у 48 кГц
Opus за допомогою `ffmpeg` перед доставленням.

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
  <Accordion title="Поведінка автоін’єкції">
    Постачальник `xiaomi` впроваджується автоматично, коли `XIAOMI_API_KEY` встановлено у вашому середовищі або існує auth-профіль. Вам не потрібно налаштовувати постачальника вручну, якщо ви не хочете перевизначити метадані моделі або базову URL-адресу.
  </Accordion>

  <Accordion title="Відомості про моделі">
    - **mimo-v2-flash** — легка й швидка, ідеальна для текстових завдань загального призначення. Без підтримки міркування.
    - **mimo-v2-pro** — підтримує міркування з контекстним вікном на 1 млн токенів для робочих навантажень із довгими документами.
    - **mimo-v2-omni** — мультимодальна модель із підтримкою міркування, яка приймає як текстові, так і графічні вхідні дані.

    <Note>
    Усі моделі використовують префікс `xiaomi/` (наприклад, `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Якщо моделі не з’являються, переконайтеся, що `XIAOMI_API_KEY` встановлено й він дійсний.
    - Коли Gateway працює як daemon, переконайтеся, що ключ доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).

    <Warning>
    Ключі, встановлені лише у вашій інтерактивній оболонці, невидимі для процесів gateway, якими керує daemon. Використовуйте `~/.openclaw/.env` або конфігурацію `env.shellEnv` для постійної доступності.
    </Warning>

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
  <Card title="Консоль Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Панель керування Xiaomi MiMo та керування API-ключами.
  </Card>
</CardGroup>
