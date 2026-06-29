---
read_when:
    - Вам нужны модели Xiaomi MiMo в OpenClaw
    - Требуется настроить аутентификацию Xiaomi MiMo или Token Plan
summary: Используйте модели Xiaomi MiMo с оплатой по мере использования и Token Plan в OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-28T23:41:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo — это API-платформа для моделей **MiMo**. OpenClaw включает встроенный Xiaomi plugin с двумя пресетами текстового провайдера:

- `xiaomi` для ключей с оплатой по мере использования (`sk-...`)
- `xiaomi-token-plan` для ключей Token Plan (`tp-...`) с региональными пресетами endpoint

Этот же plugin также регистрирует речевой провайдер `xiaomi` (TTS).

| Свойство          | Значение                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Идентификаторы провайдера | `xiaomi` (оплата по мере использования), `xiaomi-token-plan` (Token Plan)                                                                          |
| Plugin            | встроенный, `enabledByDefault: true`                                                                                                               |
| Переменные окружения для аутентификации | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Флаги onboarding  | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Прямые флаги CLI  | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| Контракты         | chat completions + `speechProviders`                                                                                                               |
| API               | OpenAI-совместимый (`openai-completions`)                                                                                                          |
| Базовые URL       | Оплата по мере использования: `https://api.xiaomimimo.com/v1`; пресеты Token Plan: `token-plan-{cn,sgp,ams}...`                                    |
| Модели по умолчанию | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS по умолчанию  | `mimo-v2.5-tts`, голос `mimo_default`; модель voicedesign `mimo-v2.5-tts-voicedesign`                                                              |

## Начало работы

<Steps>
  <Step title="Получите подходящий ключ">
    Создайте ключ с оплатой по мере использования в [консоли Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) или откройте страницу подписки Token Plan и скопируйте региональный OpenAI-совместимый базовый URL вместе с соответствующим ключом `tp-...`.
  </Step>

  <Step title="Запустите onboarding">
    Оплата по мере использования:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Или передайте ключи напрямую:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Проверьте, что модель доступна">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## Каталог с оплатой по мере использования

| Ссылка на модель        | Ввод        | Контекст  | Максимальный вывод | Рассуждение | Примечания              |
| ----------------------- | ----------- | --------- | ------------------ | ----------- | ----------------------- |
| `xiaomi/mimo-v2-flash`  | текст       | 262,144   | 8,192              | Нет         | Модель по умолчанию     |
| `xiaomi/mimo-v2-pro`    | текст       | 1,048,576 | 32,000             | Да          | Большой контекст        |
| `xiaomi/mimo-v2-omni`   | текст, изображение | 262,144   | 32,000             | Да          | Мультимодальная         |

<Tip>
Ссылка на модель по умолчанию — `xiaomi/mimo-v2-flash`. Провайдер внедряется автоматически, когда задан `XIAOMI_API_KEY` или существует профиль аутентификации.
</Tip>

## Каталог Token Plan

Выберите вариант аутентификации Token Plan, который соответствует региональному базовому URL, показанному в UI подписки Xiaomi:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| Ссылка на модель                  | Ввод        | Контекст  | Максимальный вывод | Рассуждение | Примечания              |
| --------------------------------- | ----------- | --------- | ------------------ | ----------- | ----------------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | текст       | 1,048,576 | 131,072            | Да          | Модель по умолчанию     |
| `xiaomi-token-plan/mimo-v2.5`     | текст, изображение | 1,048,576 | 131,072            | Да          | Мультимодальная         |

<Tip>
Onboarding Token Plan проверяет форму ключа и предупреждает, если ключ `tp-...` введен в путь с оплатой по мере использования или ключ `sk-...` введен в путь Token Plan.
</Tip>

## Преобразование текста в речь

Встроенный plugin `xiaomi` также регистрирует Xiaomi MiMo как речевой провайдер для
`messages.tts`. Он вызывает TTS-контракт chat completions Xiaomi, передавая текст как
сообщение `assistant`, а необязательные указания по стилю — как сообщение `user`.

| Свойство | Значение                                 |
| -------- | ---------------------------------------- |
| TTS id   | `xiaomi` (псевдоним `mimo`)              |
| Аутентификация | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` с `audio`    |
| По умолчанию | `mimo-v2.5-tts`, голос `mimo_default`    |
| Вывод    | MP3 по умолчанию; WAV при настройке      |

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

Поддерживаемые встроенные голоса включают `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` и `Dean`. Модели с предустановленными голосами используют `audio.voice`, поэтому
OpenClaw отправляет `speakerVoice` для `mimo-v2.5-tts` и `mimo-v2-tts`.

Модель voicedesign Xiaomi, `mimo-v2.5-tts-voicedesign`, генерирует голос
из промпта стиля на естественном языке вместо предустановленного идентификатора голоса. Настройте
`style` с нужным описанием голоса; OpenClaw отправляет его как сообщение `user`,
отправляет произносимый текст как сообщение `assistant` и опускает
`audio.voice` для этой модели.

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

Для целей голосовых заметок, таких как Feishu и Telegram, OpenClaw перекодирует вывод Xiaomi
в 48kHz Opus с помощью `ffmpeg` перед доставкой.

## Пример конфигурации

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

Цены и флаги совместимости берутся из встроенного манифеста plugin, поэтому в примере конфигурации `cost` и `compat` опущены, чтобы не расходиться с поведением runtime.

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

Цены берутся из встроенного манифеста (модели Token Plan включают многоуровневую цену чтения кэша), поэтому в примере конфигурации `cost` опущен.

<AccordionGroup>
  <Accordion title="Поведение автоматического внедрения">
    Провайдер `xiaomi` внедряется автоматически, когда `XIAOMI_API_KEY` задан в вашем окружении или существует профиль аутентификации. `xiaomi-token-plan` требует региональный базовый URL, поэтому поддерживаемый путь — встроенный вариант onboarding Token Plan или явный блок конфигурации `models.providers.xiaomi-token-plan`.
  </Accordion>

  <Accordion title="Сведения о моделях">
    - **mimo-v2-flash** — легкая и быстрая, идеальна для универсальных текстовых задач. Поддержки рассуждений нет.
    - **mimo-v2-pro** — поддерживает рассуждения с контекстным окном 1M токенов для рабочих нагрузок с длинными документами.
    - **mimo-v2-omni** — мультимодальная модель с поддержкой рассуждений, принимающая как текстовые, так и графические входные данные.
    - **mimo-v2.5-pro** — модель Token Plan по умолчанию с текущим стеком рассуждений Xiaomi V2.5.
    - **mimo-v2.5** — мультимодальный маршрут Token Plan V2.5.

    <Note>
    Модели с оплатой по мере использования используют префикс `xiaomi/`. Модели Token Plan используют префикс `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Устранение неполадок">
    - Если модели не появляются, убедитесь, что соответствующая переменная окружения с ключом или профиль аутентификации присутствует и действителен.
    - Для Token Plan убедитесь, что выбранный регион onboarding соответствует базовому URL на странице подписки и что ключ начинается с `tp-`.
    - Когда Gateway работает как daemon, убедитесь, что ключ доступен этому процессу (например, в `~/.openclaw/.env` или через `env.shellEnv`).

    <Warning>
    Ключи, заданные только в вашей интерактивной оболочке, не видны процессам Gateway, управляемым daemon. Используйте конфигурацию `~/.openclaw/.env` или `env.shellEnv` для постоянной доступности.
    </Warning>

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения failover.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по конфигурации OpenClaw.
  </Card>
  <Card title="Консоль Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Панель управления Xiaomi MiMo и управление API-ключами.
  </Card>
</CardGroup>
