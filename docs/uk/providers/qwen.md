---
read_when:
    - Ви хочете використовувати Qwen з OpenClaw
    - Ви раніше використовували Qwen OAuth
summary: Використання Qwen Cloud через bundled провайдер qwen OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-27T12:54:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2513c018dfefa9123891479482e53c26ac7297467b02de76842c32488b6eba6d
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth видалено.** Інтеграція OAuth безкоштовного рівня
(`qwen-portal`), яка використовувала endpoint `portal.qwen.ai`, більше недоступна.
Див. [Issue #49557](https://github.com/openclaw/openclaw/issues/49557), щоб дізнатися
передісторію.

</Warning>

Тепер OpenClaw розглядає Qwen як повноцінного bundled провайдера з канонічним id
`qwen`. Bundled провайдер націлений на endpoint Qwen Cloud / Alibaba DashScope і
Coding Plan та зберігає роботу застарілих id `modelstudio` як
псевдоніма сумісності.

- Провайдер: `qwen`
- Бажана env var: `QWEN_API_KEY`
- Також приймаються для сумісності: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Стиль API: сумісний з OpenAI

<Tip>
Якщо вам потрібен `qwen3.6-plus`, надавайте перевагу endpoint **Standard (pay-as-you-go)**.
Підтримка Coding Plan може відставати від публічного каталогу.
</Tip>

## Початок роботи

Виберіть тип плану та виконайте кроки налаштування.

<Tabs>
  <Tab title="Coding Plan (підписка)">
    **Найкраще для:** доступу за підпискою через Qwen Coding Plan.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key з [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустіть onboarding">
        Для endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Для endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Задайте модель за замовчуванням">
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
    Застарілі id `auth-choice` `modelstudio-*` і посилання на моделі `modelstudio/...` усе ще
    працюють як псевдоніми сумісності, але нові потоки налаштування мають використовувати канонічні
    id `auth-choice` сімейства `qwen-*` і посилання на моделі `qwen/...`. Якщо ви визначите точний
    власний запис `models.providers.modelstudio` з іншим значенням `api`, цей
    власний провайдер обслуговуватиме посилання `modelstudio/...` замість псевдоніма сумісності Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Найкраще для:** доступу з оплатою за використання через endpoint Standard Model Studio, включно з моделями на кшталт `qwen3.6-plus`, які можуть бути недоступні в Coding Plan.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key з [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустіть onboarding">
        Для endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Для endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Задайте модель за замовчуванням">
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
    Застарілі id `auth-choice` `modelstudio-*` і посилання на моделі `modelstudio/...` усе ще
    працюють як псевдоніми сумісності, але нові потоки налаштування мають використовувати канонічні
    id `auth-choice` сімейства `qwen-*` і посилання на моделі `qwen/...`. Якщо ви визначите точний
    власний запис `models.providers.modelstudio` з іншим значенням `api`, цей
    власний провайдер обслуговуватиме посилання `modelstudio/...` замість псевдоніма сумісності Qwen.
    </Note>

  </Tab>
</Tabs>

## Типи планів і endpoint

| План                       | Регіон | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (підписка)     | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (підписка)     | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Провайдер автоматично вибирає endpoint на основі вашого auth choice. Канонічні
варіанти використовують сімейство `qwen-*`; `modelstudio-*` залишається лише для сумісності.
Ви можете перевизначити це власним `baseUrl` у конфігурації.

<Tip>
**Керування ключами:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Документація:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Вбудований каталог

Зараз OpenClaw постачається з таким bundled каталогом Qwen. Налаштований каталог
враховує endpoint: конфігурації Coding Plan не включають моделі, які, як відомо, працюють
лише на endpoint Standard.

| Посилання на модель        | Вхідні дані | Контекст  | Примітки                                           |
| -------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`        | text, image | 1,000,000 | Модель за замовчуванням                            |
| `qwen/qwen3.6-plus`        | text, image | 1,000,000 | Вибирайте endpoint Standard, якщо вам потрібна ця модель |
| `qwen/qwen3-max-2026-01-23`| text        | 262,144   | Лінійка Qwen Max                                   |
| `qwen/qwen3-coder-next`    | text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`    | text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`        | text        | 1,000,000 | Thinking увімкнено                                 |
| `qwen/glm-5`               | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`             | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`           | text, image | 262,144   | Moonshot AI через Alibaba                          |

<Note>
Доступність усе ще може відрізнятися залежно від endpoint і тарифного плану, навіть коли модель
присутня у bundled каталозі.
</Note>

## Керування thinking

Для моделей Qwen Cloud із підтримкою reasoning bundled провайдер зіставляє рівні
thinking OpenClaw із прапорцем запиту верхнього рівня DashScope `enable_thinking`. Вимкнений
thinking надсилає `enable_thinking: false`; інші рівні thinking надсилають
`enable_thinking: true`.

## Мультимодальні доповнення

Plugin `qwen` також відкриває мультимодальні можливості на endpoint **Standard**
DashScope (не на endpoint Coding Plan):

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
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри tools, вибір провайдера та поведінку failover.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Розуміння зображень і відео">
    Bundled Plugin Qwen реєструє розуміння медіа для зображень і відео
    на endpoint **Standard** DashScope (не на endpoint Coding Plan).

    | Властивість   | Значення              |
    | ------------- | --------------------- |
    | Модель        | `qwen-vl-max-latest`  |
    | Підтримуваний вхід | Images, video     |

    Розуміння медіа автоматично визначається з налаштованого auth Qwen — додаткова
    конфігурація не потрібна. Переконайтеся, що ви використовуєте endpoint
    Standard (pay-as-you-go), щоб була підтримка розуміння медіа.

  </Accordion>

  <Accordion title="Доступність Qwen 3.6 Plus">
    `qwen3.6-plus` доступна на endpoint Model Studio
    Standard (pay-as-you-go):

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Якщо endpoint Coding Plan повертають помилку "unsupported model" для
    `qwen3.6-plus`, перейдіть на Standard (pay-as-you-go) замість endpoint/ключа
    Coding Plan.

  </Accordion>

  <Accordion title="План можливостей">
    Plugin `qwen` позиціонується як основний постачальник для всієї поверхні Qwen
    Cloud, а не лише для моделей coding/text.

    - **Text/chat models:** bundled уже зараз
    - **Виклик tools, структурований вивід, thinking:** успадковуються від transport, сумісного з OpenAI
    - **Генерація зображень:** запланована на рівні Plugin провайдера
    - **Розуміння зображень/відео:** bundled уже зараз на endpoint Standard
    - **Speech/audio:** заплановано на рівні Plugin провайдера
    - **Memory embeddings/reranking:** заплановано через поверхню адаптера embedding
    - **Генерація відео:** bundled уже зараз через спільну можливість генерації відео

  </Accordion>

  <Accordion title="Деталі генерації відео">
    Для генерації відео OpenClaw зіставляє налаштований регіон Qwen із відповідним
    хостом DashScope AIGC перед надсиланням завдання:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Це означає, що звичайний `models.providers.qwen.baseUrl`, який вказує або на
    хости Coding Plan, або на хости Standard Qwen, усе одно зберігає генерацію відео на правильному
    регіональному endpoint відео DashScope.

    Поточні обмеження bundled генерації відео Qwen:

    - До **1** вихідного відео на запит
    - До **1** вхідного зображення
    - До **4** вхідних відео
    - До **10 секунд** тривалості
    - Підтримує `size`, `aspectRatio`, `resolution`, `audio` і `watermark`
    - Режим опорного зображення/відео зараз вимагає **віддалених URL `http(s)`**. Локальні
      шляхи до файлів відхиляються одразу, оскільки endpoint відео DashScope не
      приймає завантажені локальні буфери для таких посилань.

  </Accordion>

  <Accordion title="Сумісність із використанням потокової передачі">
    Нативні endpoint Model Studio оголошують сумісність streaming usage на
    спільному transport `openai-completions`. Тепер OpenClaw визначає це за можливостями endpoint,
    тому власні id провайдера, сумісні з DashScope, що націлені на ті самі нативні хости,
    успадковують ту саму поведінку streaming usage замість того,
    щоб вимагати саме вбудований id провайдера `qwen`.

    Сумісність native-streaming usage застосовується і до хостів Coding Plan, і до
    хостів Standard DashScope-compatible:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Регіони мультимодальних endpoint">
    Мультимодальні поверхні (розуміння відео та генерація відео Wan) використовують
    endpoint **Standard** DashScope, а не endpoint Coding Plan:

    - Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Налаштування середовища та daemon">
    Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що `QWEN_API_KEY` доступна
    цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язані теми

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/uk/providers/alibaba" icon="cloud">
    Застарілий провайдер ModelStudio та примітки щодо міграції.
  </Card>
  <Card title="Усунення проблем" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення проблем і FAQ.
  </Card>
</CardGroup>
