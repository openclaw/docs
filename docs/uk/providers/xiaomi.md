---
read_when:
    - Ви хочете використовувати моделі Xiaomi MiMo в OpenClaw
    - Потрібно налаштувати автентифікацію Xiaomi MiMo або тарифний план Token Plan
summary: Використовуйте моделі Xiaomi MiMo з оплатою за фактичне використання та за планом токенів разом з OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T13:44:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo — це API-платформа для моделей **MiMo**. Вбудований plugin `xiaomi`
(`enabledByDefault: true`, встановлення не потрібне) реєструє двох постачальників
текстових моделей і постачальника синтезу мовлення (TTS):

- `xiaomi` — ключі з оплатою за використання (`sk-...`)
- `xiaomi-token-plan` — ключі тарифного плану Token Plan (`tp-...`) із регіональними попередньо налаштованими кінцевими точками

| Властивість                 | Значення                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ідентифікатори постачальників | `xiaomi` (оплата за використання), `xiaomi-token-plan` (Token Plan)                                                                                |
| Змінні середовища автентифікації | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                  |
| Прапорці початкового налаштування | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Прямі прапорці CLI          | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                         | Сумісні з OpenAI завершення чату (`openai-completions`)                                                                                            |
| Контракт мовлення           | `speechProviders: ["xiaomi"]`                                                                                                                      |
| Базові URL-адреси           | Оплата за використання: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                  |
| Моделі за замовчуванням     | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS за замовчуванням        | `mimo-v2.5-tts`, голос `mimo_default`; модель конструювання голосу `mimo-v2.5-tts-voicedesign`                                                      |

## Початок роботи

<Steps>
  <Step title="Отримайте відповідний ключ">
    Створіть ключ з оплатою за використання в [консолі Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) або відкрийте сторінку підписки Token Plan і скопіюйте регіональну базову URL-адресу, сумісну з OpenAI, разом із відповідним ключем `tp-...`.
  </Step>

  <Step title="Запустіть початкове налаштування">
    Оплата за використання:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Або передайте ключі безпосередньо:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Перевірте доступність моделі">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
Під час початкового налаштування перевіряється формат ключа й виводиться попередження, якщо ключ `tp-...` введено в сценарії оплати за використання або ключ `sk-...` — у сценарії Token Plan.
</Tip>

## Каталог моделей з оплатою за використання

| Посилання на модель    | Вхідні дані    | Контекст | Максимальний вивід | Міркування | Примітки                     |
| ---------------------- | -------------- | -------- | ------------------- | ---------- | ---------------------------- |
| `xiaomi/mimo-v2-flash` | текст          | 262,144  | 8,192               | Ні         | Модель за замовчуванням      |
| `xiaomi/mimo-v2-pro`   | текст          | 1,048,576 | 32,000              | Так        | Великий контекст             |
| `xiaomi/mimo-v2-omni`  | текст, зображення | 262,144 | 32,000              | Так        | Мультимодальна               |

## Каталог Token Plan

Виберіть варіант автентифікації Token Plan, який відповідає регіональній базовій URL-адресі, зазначеній в інтерфейсі підписки Xiaomi:

| Варіант автентифікації  | Базова URL-адреса                          |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| Посилання на модель              | Вхідні дані       | Контекст  | Максимальний вивід | Міркування | Примітки                |
| -------------------------------- | ----------------- | --------- | ------------------- | ---------- | ----------------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | текст            | 1,048,576 | 131,072             | Так        | Модель за замовчуванням |
| `xiaomi-token-plan/mimo-v2.5`     | текст, зображення | 1,048,576 | 131,072             | Так        | Мультимодальна          |

Для визначення `xiaomi-token-plan` потрібна регіональна базова URL-адреса. Підтримуваний
варіант — вибір вбудованого початкового налаштування Token Plan або явний
блок конфігурації `models.providers.xiaomi-token-plan` із заданим `baseUrl`;
без одного з цих варіантів постачальник недоступний.

## Моделі з міркуванням

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5` і `mimo-v2.5-pro` підтримують
[директиву `/think`](/uk/tools/thinking) OpenClaw із рівнями `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` і `max` (за замовчуванням `high`).
`mimo-v2-flash` не підтримує міркування.

## Синтез мовлення

Вбудований plugin `xiaomi` також реєструє Xiaomi MiMo як постачальника мовлення
для `messages.tts`. Він викликає TTS-контракт завершень чату Xiaomi, передаючи
текст як повідомлення `assistant`, а необов’язкові настанови щодо стилю — як
повідомлення `user`.

| Властивість   | Значення                                  |
| ------------- | ----------------------------------------- |
| Ідентифікатор TTS | `xiaomi` (псевдонім `mimo`)           |
| Автентифікація | `XIAOMI_API_KEY`                          |
| API           | `POST /v1/chat/completions` з `audio`     |
| За замовчуванням | `mimo-v2.5-tts`, голос `mimo_default`  |
| Вивід         | MP3 за замовчуванням; WAV після налаштування |

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

Вбудовані голоси: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. Моделі з попередньо налаштованими голосами (`mimo-v2.5-tts`, `mimo-v2-tts`) використовують
`audio.voice`, тому OpenClaw надсилає `speakerVoice` для цих моделей.

Модель конструювання голосу `mimo-v2.5-tts-voicedesign` створює голос за
описом стилю природною мовою замість попередньо налаштованого ідентифікатора голосу. Укажіть у `style`
потрібний опис голосу; OpenClaw надсилає його як повідомлення `user`,
текст для озвучення — як повідомлення `assistant`, і не додає `audio.voice` для цієї
моделі.

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

Для каналів, які запитують цільовий формат синтезу голосових повідомлень (Discord, Feishu,
Matrix, Telegram і WhatsApp), OpenClaw перед доставленням перекодовує вивід Xiaomi
у монофонічний Opus із частотою 48 кГц за допомогою `ffmpeg`.

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

Ціни та прапорці сумісності надходять із маніфесту вбудованого plugin, тому в прикладі конфігурації немає `cost` і `compat`, щоб уникнути розбіжностей із поведінкою під час виконання.

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

Ціни надходять із вбудованого маніфесту (моделі Token Plan мають багаторівневі ціни на читання кешу), тому в прикладі конфігурації немає `cost`.

<AccordionGroup>
  <Accordion title="Поведінка автоматичного додавання">
    Постачальник `xiaomi` автоматично вмикається, коли у вашому середовищі задано `XIAOMI_API_KEY` або існує профіль автентифікації. Для `xiaomi-token-plan` потрібна регіональна базова URL-адреса, тому підтримуваний варіант — вибір вбудованого початкового налаштування Token Plan або явний блок конфігурації `models.providers.xiaomi-token-plan`.
  </Accordion>

  <Accordion title="Відомості про моделі">
    - **mimo-v2-flash** — легка та швидка модель, оптимальна для універсальних текстових завдань. Не підтримує міркування.
    - **mimo-v2-pro** — підтримує міркування з контекстним вікном на 1 млн токенів для опрацювання довгих документів.
    - **mimo-v2-omni** — мультимодальна модель із підтримкою міркування, яка приймає текст і зображення.
    - **mimo-v2.5-pro** — модель Token Plan за замовчуванням із поточним стеком міркування V2.5 від Xiaomi.
    - **mimo-v2.5** — мультимодальний маршрут V2.5 для Token Plan.

    <Note>
    Моделі з оплатою за використання мають префікс `xiaomi/`. Моделі Token Plan мають префікс `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Якщо моделі не відображаються, переконайтеся, що відповідна змінна середовища з ключем або профіль автентифікації наявні й дійсні.
    - Для Token Plan переконайтеся, що вибраний регіон початкового налаштування відповідає базовій URL-адресі на сторінці підписки, а ключ починається з `tp-`.
    - Коли Gateway працює як демон, переконайтеся, що ключ доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).

    <Warning>
    Ключі, задані лише в інтерактивній оболонці, недоступні процесам Gateway, якими керує демон. Для постійної доступності використовуйте конфігурацію `~/.openclaw/.env` або `env.shellEnv`.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Рівні міркування" href="/uk/tools/thinking" icon="brain">
    Синтаксис директиви `/think` і зіставлення рівнів.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації OpenClaw.
  </Card>
  <Card title="Консоль Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Панель керування Xiaomi MiMo й керування ключами API.
  </Card>
</CardGroup>
