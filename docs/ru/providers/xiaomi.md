---
read_when:
    - Вы хотите использовать модели Xiaomi MiMo в OpenClaw
    - Вам необходимо настроить аутентификацию Xiaomi MiMo или тарифный план токенов
summary: Использование моделей Xiaomi MiMo с оплатой по мере использования и по тарифному плану Token Plan в OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T11:49:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo — это API-платформа для моделей **MiMo**. Встроенный plugin `xiaomi`
(`enabledByDefault: true`, установка не требуется) регистрирует двух
поставщиков текстовых моделей и поставщика синтеза речи (TTS):

- `xiaomi` — ключи с оплатой по факту использования (`sk-...`)
- `xiaomi-token-plan` — ключи Token Plan (`tp-...`) с предустановленными региональными конечными точками

| Свойство                  | Значение                                                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Идентификаторы поставщика | `xiaomi` (оплата по факту использования), `xiaomi-token-plan` (Token Plan)                                                                          |
| Переменные окружения аутентификации | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                              |
| Флаги первоначальной настройки | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Прямые флаги CLI          | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                       | Совместимые с OpenAI завершения чата (`openai-completions`)                                                                                        |
| Контракт синтеза речи     | `speechProviders: ["xiaomi"]`                                                                                                                      |
| Базовые URL               | Оплата по факту использования: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                            |
| Модели по умолчанию       | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS по умолчанию          | `mimo-v2.5-tts`, голос `mimo_default`; модель конструирования голоса `mimo-v2.5-tts-voicedesign`                                                    |

## Начало работы

<Steps>
  <Step title="Получите подходящий ключ">
    Создайте ключ с оплатой по факту использования в [консоли Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) или откройте страницу подписки Token Plan и скопируйте региональный базовый URL, совместимый с OpenAI, вместе с соответствующим ключом `tp-...`.
  </Step>

  <Step title="Запустите первоначальную настройку">
    Оплата по факту использования:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Ключи также можно передать напрямую:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Проверьте доступность модели">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
Во время первоначальной настройки проверяется формат ключа и выводится предупреждение, если ключ `tp-...` введён в сценарии оплаты по факту использования или ключ `sk-...` введён в сценарии Token Plan.
</Tip>

## Каталог с оплатой по факту использования

| Ссылка на модель         | Входные данные | Контекст  | Макс. вывод | Рассуждение | Примечания             |
| ------------------------ | -------------- | --------- | ------------ | ----------- | ---------------------- |
| `xiaomi/mimo-v2-flash`   | текст          | 262,144   | 8,192        | Нет         | Модель по умолчанию    |
| `xiaomi/mimo-v2-pro`     | текст          | 1,048,576 | 32,000       | Да          | Большой контекст       |
| `xiaomi/mimo-v2-omni`    | текст, изображение | 262,144 | 32,000       | Да          | Мультимодальная модель |

## Каталог Token Plan

Выберите вариант аутентификации Token Plan, соответствующий региональному базовому URL, указанному в интерфейсе подписки Xiaomi:

| Вариант аутентификации    | Базовый URL                                |
| ------------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`    | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp`   | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams`   | `https://token-plan-ams.xiaomimimo.com/v1` |

| Ссылка на модель                  | Входные данные | Контекст  | Макс. вывод | Рассуждение | Примечания             |
| --------------------------------- | -------------- | --------- | ------------ | ----------- | ---------------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | текст          | 1,048,576 | 131,072      | Да          | Модель по умолчанию    |
| `xiaomi-token-plan/mimo-v2.5`     | текст, изображение | 1,048,576 | 131,072  | Да          | Мультимодальная модель |

Для разрешения `xiaomi-token-plan` требуется региональный базовый URL.
Поддерживаемый способ — выбрать встроенный вариант первоначальной настройки
Token Plan или явно задать блок конфигурации
`models.providers.xiaomi-token-plan` со значением `baseUrl`; без одного из
этих вариантов поставщик не предлагается.

## Модели с рассуждением

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5` и `mimo-v2.5-pro` поддерживают
[директиву `/think`](/ru/tools/thinking) OpenClaw с уровнями `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` и `max` (по умолчанию `high`).
`mimo-v2-flash` не поддерживает рассуждение.

## Синтез речи

Встроенный plugin `xiaomi` также регистрирует Xiaomi MiMo как поставщика
синтеза речи для `messages.tts`. Он вызывает TTS-контракт завершений чата
Xiaomi, передавая текст как сообщение `assistant`, а необязательные указания
по стилю — как сообщение `user`.

| Свойство       | Значение                                  |
| -------------- | ----------------------------------------- |
| Идентификатор TTS | `xiaomi` (псевдоним `mimo`)            |
| Аутентификация | `XIAOMI_API_KEY`                          |
| API            | `POST /v1/chat/completions` с `audio`     |
| По умолчанию   | `mimo-v2.5-tts`, голос `mimo_default`     |
| Выходной формат | MP3 по умолчанию; WAV при соответствующей настройке |

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

Встроенные голоса: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. Модели с предустановленными голосами (`mimo-v2.5-tts`,
`mimo-v2-tts`) используют `audio.voice`, поэтому OpenClaw передаёт для них
`speakerVoice`.

Модель конструирования голоса `mimo-v2.5-tts-voicedesign` создаёт голос из
описания стиля на естественном языке вместо предустановленного идентификатора
голоса. Задайте в `style` желаемое описание голоса; OpenClaw передаст его как
сообщение `user`, произносимый текст — как сообщение `assistant`, а
`audio.voice` для этой модели будет опущен.

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

Для каналов, запрашивающих синтез голосового сообщения (Discord, Feishu,
Matrix, Telegram и WhatsApp), OpenClaw перед отправкой перекодирует вывод
Xiaomi в монофонический Opus 48 кГц с помощью `ffmpeg`.

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

Цены и флаги совместимости берутся из манифеста встроенного plugin, поэтому в примере конфигурации отсутствуют `cost` и `compat`, чтобы он не расходился с поведением среды выполнения.

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

Цены берутся из встроенного манифеста (модели Token Plan включают многоуровневую тарификацию чтения из кеша), поэтому в примере конфигурации отсутствует `cost`.

<AccordionGroup>
  <Accordion title="Поведение автоматического подключения">
    Поставщик `xiaomi` автоматически включается, если в окружении задана переменная `XIAOMI_API_KEY` или существует профиль аутентификации. Для `xiaomi-token-plan` требуется региональный базовый URL, поэтому поддерживаемый способ — выбрать встроенный вариант первоначальной настройки Token Plan или явно задать блок конфигурации `models.providers.xiaomi-token-plan`.
  </Accordion>

  <Accordion title="Сведения о моделях">
    - **mimo-v2-flash** — лёгкая и быстрая модель, идеально подходящая для универсальных текстовых задач. Рассуждение не поддерживается.
    - **mimo-v2-pro** — поддерживает рассуждение и контекстное окно на 1 млн токенов для работы с длинными документами.
    - **mimo-v2-omni** — мультимодальная модель с поддержкой рассуждения, принимающая текст и изображения.
    - **mimo-v2.5-pro** — модель Token Plan по умолчанию с текущим стеком рассуждения V2.5 от Xiaomi.
    - **mimo-v2.5** — мультимодальный маршрут V2.5 в Token Plan.

    <Note>
    Модели с оплатой по факту использования имеют префикс `xiaomi/`. Модели Token Plan имеют префикс `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Устранение неполадок">
    - Если модели не отображаются, убедитесь, что соответствующая переменная окружения с ключом или профиль аутентификации присутствует и действителен.
    - Для Token Plan убедитесь, что выбранный при первоначальной настройке регион соответствует базовому URL на странице подписки, а ключ начинается с `tp-`.
    - Если Gateway работает как демон, убедитесь, что ключ доступен этому процессу (например, через `~/.openclaw/.env` или `env.shellEnv`).

    <Warning>
    Ключи, заданные только в интерактивной оболочке, недоступны процессам Gateway, управляемым как демоны. Для постоянной доступности используйте `~/.openclaw/.env` или конфигурацию `env.shellEnv`.
    </Warning>

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор поставщиков, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Уровни рассуждения" href="/ru/tools/thinking" icon="brain">
    Синтаксис директивы `/think` и сопоставление уровней.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по конфигурации OpenClaw.
  </Card>
  <Card title="Консоль Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Панель управления Xiaomi MiMo и управление ключами API.
  </Card>
</CardGroup>
