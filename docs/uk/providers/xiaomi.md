---
read_when:
    - Вам потрібні моделі Xiaomi MiMo в OpenClaw
    - Потрібна автентифікація Xiaomi MiMo або налаштування Token Plan
summary: Використовуйте моделі Xiaomi MiMo з оплатою за фактом використання та тарифним планом токенів з OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T18:15:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo — це API-платформа для моделей **MiMo**. OpenClaw містить вбудований Xiaomi Plugin із двома пресетами текстових провайдерів:

- `xiaomi` для ключів з оплатою за фактом використання (`sk-...`)
- `xiaomi-token-plan` для ключів Token Plan (`tp-...`) із пресетами регіональних endpoint

Той самий Plugin також реєструє мовленнєвого провайдера `xiaomi` (TTS).

| Властивість            | Значення                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ідентифікатори провайдера | `xiaomi` (оплата за фактом використання), `xiaomi-token-plan` (Token Plan)                                                                         |
| Plugin                 | вбудований, `enabledByDefault: true`                                                                                                               |
| Змінні середовища авторизації | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Прапорці онбордингу    | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Прямі прапорці CLI     | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| Контракти              | завершення чатів + `speechProviders`                                                                                                               |
| API                    | сумісний з OpenAI (`openai-completions`)                                                                                                           |
| Базові URL             | Оплата за фактом використання: `https://api.xiaomimimo.com/v1`; пресети Token Plan: `token-plan-{cn,sgp,ams}...`                                   |
| Моделі за замовчуванням | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS за замовчуванням   | `mimo-v2.5-tts`, голос `mimo_default`; модель voicedesign `mimo-v2.5-tts-voicedesign`                                                              |

## Початок роботи

<Steps>
  <Step title="Get the right key">
    Створіть ключ з оплатою за фактом використання в [консолі Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) або відкрийте сторінку своєї підписки Token Plan і скопіюйте регіональний базовий URL, сумісний з OpenAI, разом із відповідним ключем `tp-...`.
  </Step>

  <Step title="Run onboarding">
    Оплата за фактом використання:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Або передайте ключі напряму:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## Каталог з оплатою за фактом використання

| Посилання на модель     | Ввід        | Контекст  | Максимальний вивід | Reasoning | Нотатки                  |
| ----------------------- | ----------- | --------- | ------------------ | --------- | ------------------------ |
| `xiaomi/mimo-v2-flash`  | текст       | 262,144   | 8,192              | Ні        | Модель за замовчуванням  |
| `xiaomi/mimo-v2-pro`    | текст       | 1,048,576 | 32,000             | Так       | Великий контекст         |
| `xiaomi/mimo-v2-omni`   | текст, зображення | 262,144   | 32,000             | Так       | Мультимодальна           |

<Tip>
Посилання на модель за замовчуванням — `xiaomi/mimo-v2-flash`. Провайдер інжектується автоматично, коли встановлено `XIAOMI_API_KEY` або існує профіль авторизації.
</Tip>

## Каталог Token Plan

Виберіть варіант авторизації Token Plan, який відповідає регіональному базовому URL, показаному в інтерфейсі підписки Xiaomi:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| Посилання на модель                | Ввід        | Контекст  | Максимальний вивід | Reasoning | Нотатки                  |
| ---------------------------------- | ----------- | --------- | ------------------ | --------- | ------------------------ |
| `xiaomi-token-plan/mimo-v2.5-pro`  | текст       | 1,048,576 | 131,072            | Так       | Модель за замовчуванням  |
| `xiaomi-token-plan/mimo-v2.5`      | текст, зображення | 1,048,576 | 131,072            | Так       | Мультимодальна           |

<Tip>
Онбординг Token Plan перевіряє форму ключа й попереджає, коли ключ `tp-...` введено в шлях оплати за фактом використання або ключ `sk-...` введено в шлях Token Plan.
</Tip>

## Перетворення тексту на мовлення

Вбудований `xiaomi` Plugin також реєструє Xiaomi MiMo як мовленнєвого провайдера для
`messages.tts`. Він викликає TTS-контракт завершень чатів Xiaomi з текстом як
повідомленням `assistant` і необов’язковими стилістичними вказівками як повідомленням `user`.

| Властивість | Значення                                  |
| ----------- | ------------------------------------------ |
| TTS id      | `xiaomi` (псевдонім `mimo`)                |
| Авторизація | `XIAOMI_API_KEY`                           |
| API         | `POST /v1/chat/completions` з `audio`      |
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
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Підтримувані вбудовані голоси включають `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` і `Dean`. Моделі з пресетними голосами використовують `audio.voice`, тому
OpenClaw надсилає `speakerVoice` для `mimo-v2.5-tts` і `mimo-v2-tts`.

Модель voicedesign від Xiaomi, `mimo-v2.5-tts-voicedesign`, генерує голос
із підказки стилю природною мовою замість пресетного ідентифікатора голосу. Налаштуйте
`style` з бажаним описом голосу; OpenClaw надсилає його як повідомлення `user`,
надсилає озвучуваний текст як повідомлення `assistant` і пропускає
`audio.voice` для цієї моделі.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

Для цілей голосових нотаток, як-от Feishu і Telegram, OpenClaw перекодовує вивід Xiaomi
у 48 кГц Opus за допомогою `ffmpeg` перед доставленням.

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
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

Ціни та прапорці сумісності надходять із маніфесту вбудованого Plugin, тому приклад конфігурації пропускає `cost` і `compat`, щоб не розходитися з поведінкою runtime.

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Ціни надходять із вбудованого маніфесту (моделі Token Plan включають багаторівневі ціни на читання кешу), тому приклад конфігурації пропускає `cost`.

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    Провайдер `xiaomi` інжектується автоматично, коли `XIAOMI_API_KEY` встановлено у вашому середовищі або існує профіль авторизації. `xiaomi-token-plan` потребує регіонального базового URL, тому підтримуваний шлях — це вбудований вибір онбордингу Token Plan або явний конфігураційний блок `models.providers.xiaomi-token-plan`.
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** — легка й швидка модель, ідеальна для текстових завдань загального призначення. Без підтримки reasoning.
    - **mimo-v2-pro** — підтримує reasoning з контекстним вікном у 1 млн токенів для робочих навантажень із довгими документами.
    - **mimo-v2-omni** — мультимодальна модель із підтримкою reasoning, яка приймає і текстові, і графічні вводи.
    - **mimo-v2.5-pro** — модель Token Plan за замовчуванням із поточним стеком reasoning V2.5 від Xiaomi.
    - **mimo-v2.5** — мультимодальний маршрут V2.5 для Token Plan.

    <Note>
    Моделі з оплатою за фактом використання використовують префікс `xiaomi/`. Моделі Token Plan використовують префікс `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Якщо моделі не з’являються, переконайтеся, що відповідна змінна середовища ключа або профіль авторизації наявні й дійсні.
    - Для Token Plan переконайтеся, що вибраний регіон онбордингу відповідає базовому URL на сторінці підписки та що ключ починається з `tp-`.
    - Коли Gateway працює як демон, переконайтеся, що ключ доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).

    <Warning>
    Ключі, установлені лише у вашій інтерактивній оболонці, не видимі для процесів gateway, керованих демоном. Використовуйте конфігурацію `~/.openclaw/.env` або `env.shellEnv` для постійної доступності.
    </Warning>

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
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Панель керування Xiaomi MiMo та керування API-ключами.
  </Card>
</CardGroup>
