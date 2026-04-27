---
read_when:
    - Ви хочете використовувати Qwen з OpenClaw
    - Раніше ви використовували Qwen OAuth
summary: Використовуйте Qwen Cloud через вбудований провайдер qwen в OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-27T11:03:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56cb6fb38db4190c195c567112ca1be80877ae3836478276d8a9598a28b886d9
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth вилучено.** Інтеграція OAuth безкоштовного рівня
(`qwen-portal`), яка використовувала ендпоїнти `portal.qwen.ai`, більше недоступна.
Докладніше див. в [Issue #49557](https://github.com/openclaw/openclaw/issues/49557).

</Warning>

Тепер OpenClaw розглядає Qwen як повноцінного вбудованого провайдера з канонічним id
`qwen`. Вбудований провайдер націлений на ендпоїнти Qwen Cloud / Alibaba DashScope і
Coding Plan та зберігає застарілі id `modelstudio` як
псевдонім сумісності.

- Провайдер: `qwen`
- Бажана env var: `QWEN_API_KEY`
- Також приймаються для сумісності: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Стиль API: сумісний з OpenAI

<Tip>
Якщо вам потрібен `qwen3.6-plus`, віддавайте перевагу ендпоїнту **Standard (pay-as-you-go)**.
Підтримка Coding Plan може відставати від публічного каталогу.
</Tip>

## Початок роботи

Виберіть тип плану та виконайте кроки налаштування.

<Tabs>
  <Tab title="Coding Plan (підписка)">
    **Найкраще підходить для:** доступу за підпискою через Qwen Coding Plan.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть або скопіюйте API-ключ на [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустіть онбординг">
        Для ендпоїнту **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Для ендпоїнту **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Застарілі id `modelstudio-*` для auth-choice і посилання на моделі `modelstudio/...` усе ще
    працюють як псевдоніми сумісності, але нові потоки налаштування мають використовувати канонічні
    id auth-choice `qwen-*` і посилання на моделі `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Найкраще підходить для:** доступу з оплатою за використання через ендпоїнт Standard Model Studio, включно з моделями на кшталт `qwen3.6-plus`, які можуть бути недоступні в Coding Plan.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть або скопіюйте API-ключ на [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустіть онбординг">
        Для ендпоїнту **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Для ендпоїнту **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Застарілі id `modelstudio-*` для auth-choice і посилання на моделі `modelstudio/...` усе ще
    працюють як псевдоніми сумісності, але нові потоки налаштування мають використовувати канонічні
    id auth-choice `qwen-*` і посилання на моделі `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Типи планів та ендпоїнти

| План                       | Регіон | Auth choice                | Ендпоїнт                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (підписка)     | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (підписка)     | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Провайдер автоматично вибирає ендпоїнт на основі вашого auth choice. Канонічні
варіанти використовують сімейство `qwen-*`; `modelstudio-*` лишається лише для сумісності.
Ви можете перевизначити це через власний `baseUrl` у конфігурації.

<Tip>
**Керування ключами:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Документація:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Вбудований каталог

Наразі OpenClaw постачає цей вбудований каталог Qwen. Налаштований каталог
враховує ендпоїнт: конфігурації Coding Plan не містять моделей, про які відомо, що вони працюють
лише на ендпоїнті Standard.

| Model ref                   | Вхідні дані | Контекст  | Примітки                                           |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | текст, зображення | 1,000,000 | Модель за замовчуванням                            |
| `qwen/qwen3.6-plus`         | текст, зображення | 1,000,000 | Віддавайте перевагу ендпоїнтам Standard, якщо вам потрібна ця модель |
| `qwen/qwen3-max-2026-01-23` | текст       | 262,144   | Лінійка Qwen Max                                   |
| `qwen/qwen3-coder-next`     | текст       | 262,144   | Кодування                                          |
| `qwen/qwen3-coder-plus`     | текст       | 1,000,000 | Кодування                                          |
| `qwen/MiniMax-M2.5`         | текст       | 1,000,000 | Thinking увімкнено                                 |
| `qwen/glm-5`                | текст       | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | текст       | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | текст, зображення | 262,144   | Moonshot AI через Alibaba                          |

<Note>
Доступність усе одно може відрізнятися залежно від ендпоїнта та тарифного плану, навіть якщо модель
присутня у вбудованому каталозі.
</Note>

## Елементи керування Thinking

Для моделей Qwen Cloud з підтримкою reasoning вбудований провайдер зіставляє рівні
thinking OpenClaw із прапорцем запиту верхнього рівня `enable_thinking` у DashScope. Вимкнений
thinking надсилає `enable_thinking: false`; інші рівні thinking надсилають
`enable_thinking: true`.

## Мультимодальні доповнення

Plugin `qwen` також надає мультимодальні можливості на ендпоїнтах DashScope **Standard**
(не на ендпоїнтах Coding Plan):

- **Розуміння відео** через `qwen-vl-max-latest`
- **Генерація відео Wan** через `wan2.6-t2v` (за замовчуванням), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Щоб використовувати Qwen як провайдера відео за замовчуванням:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку failover.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Розуміння зображень і відео">
    Вбудований plugin Qwen реєструє розуміння медіа для зображень і відео
    на ендпоїнтах DashScope **Standard** (не на ендпоїнтах Coding Plan).

    | Властивість   | Значення             |
    | ------------- | -------------------- |
    | Модель        | `qwen-vl-max-latest` |
    | Підтримуваний ввід | Зображення, відео |

    Розуміння медіа автоматично визначається з налаштованої автентифікації Qwen — жодної
    додаткової конфігурації не потрібно. Переконайтеся, що ви використовуєте ендпоїнт
    Standard (pay-as-you-go), якщо вам потрібна підтримка розуміння медіа.

  </Accordion>

  <Accordion title="Доступність Qwen 3.6 Plus">
    `qwen3.6-plus` доступна на ендпоїнтах Model Studio Standard (pay-as-you-go):

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Якщо ендпоїнти Coding Plan повертають помилку "unsupported model" для
    `qwen3.6-plus`, перейдіть на Standard (pay-as-you-go) замість пари
    ендпоїнт/ключ для Coding Plan.

  </Accordion>

  <Accordion title="План можливостей">
    Plugin `qwen` позиціонується як домашній вендорний plugin для всієї поверхні
    Qwen Cloud, а не лише для моделей кодування/тексту.

    - **Текстові/chat-моделі:** уже вбудовано
    - **Виклик інструментів, структурований вивід, thinking:** успадковуються від сумісного з OpenAI транспорту
    - **Генерація зображень:** запланована на рівні plugin провайдера
    - **Розуміння зображень/відео:** уже вбудовано на ендпоїнті Standard
    - **Мовлення/аудіо:** заплановано на рівні plugin провайдера
    - **Memory embeddings/reranking:** заплановано через поверхню адаптера embeddings
    - **Генерація відео:** уже вбудовано через спільну можливість генерації відео

  </Accordion>

  <Accordion title="Деталі генерації відео">
    Для генерації відео OpenClaw зіставляє налаштований регіон Qwen із відповідним
    хостом DashScope AIGC перед надсиланням завдання:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Це означає, що звичайний `models.providers.qwen.baseUrl`, який вказує на хости
    Qwen Coding Plan або Standard, усе одно зберігає генерацію відео на правильному
    регіональному відеоендпоїнті DashScope.

    Поточні обмеження вбудованого Qwen для генерації відео:

    - До **1** вихідного відео на запит
    - До **1** вхідного зображення
    - До **4** вхідних відео
    - Тривалість до **10 секунд**
    - Підтримуються `size`, `aspectRatio`, `resolution`, `audio` і `watermark`
    - Режим опорного зображення/відео зараз вимагає **віддалених URL `http(s)`**. Локальні
      шляхи до файлів відхиляються одразу, оскільки відеоендпоїнт DashScope не
      приймає завантажені локальні буфери для таких посилань.

  </Accordion>

  <Accordion title="Сумісність streaming usage">
    Нативні ендпоїнти Model Studio оголошують сумісність streaming usage на
    спільному транспорті `openai-completions`. Тепер OpenClaw прив’язує це до можливостей
    ендпоїнта, тож сумісні з DashScope власні id провайдерів, націлені на ті самі
    нативні хости, успадковують таку саму поведінку streaming-usage замість
    необхідності використовувати саме вбудований id провайдера `qwen`.

    Сумісність native-streaming usage застосовується як до хостів Coding Plan, так і
    до сумісних зі Standard DashScope хостів:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Регіони мультимодальних ендпоїнтів">
    Мультимодальні поверхні (розуміння відео та генерація відео Wan) використовують
    ендпоїнти DashScope **Standard**, а не ендпоїнти Coding Plan:

    - Base URL Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - Base URL Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Налаштування середовища та демона">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `QWEN_API_KEY` є
    доступним для цього процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри відеоінструмента та вибір провайдера.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/uk/providers/alibaba" icon="cloud">
    Застарілий провайдер ModelStudio та примітки щодо міграції.
  </Card>
  <Card title="Усунення неполадок" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення неполадок і поширені запитання.
  </Card>
</CardGroup>
