---
read_when:
    - Ви хочете використовувати Qwen з OpenClaw
    - Раніше ви використовували Qwen OAuth
summary: Використовуйте Qwen Cloud через bundled provider `qwen` в OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-23T21:07:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth видалено.** Інтеграція free-tier OAuth
(`qwen-portal`), яка використовувала endpoint-и `portal.qwen.ai`, більше недоступна.
Докладніше див. в [Issue #49557](https://github.com/openclaw/openclaw/issues/49557).

</Warning>

Тепер OpenClaw розглядає Qwen як першокласний bundled provider з канонічним ID
`qwen`. Bundled provider націлюється на endpoint-и Qwen Cloud / Alibaba DashScope і
Coding Plan та зберігає legacy ID `modelstudio` як alias сумісності.

- Provider: `qwen`
- Бажана env var: `QWEN_API_KEY`
- Також приймаються для сумісності: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Стиль API: OpenAI-compatible

<Tip>
Якщо вам потрібна `qwen3.6-plus`, віддавайте перевагу endpoint-у **Standard (pay-as-you-go)**.
Підтримка Coding Plan може відставати від публічного каталогу.
</Tip>

## Початок роботи

Виберіть тип свого тарифу й виконайте кроки налаштування.

<Tabs>
  <Tab title="Coding Plan (підписка)">
    **Найкраще підходить для:** доступу за підпискою через Qwen Coding Plan.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key на [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустіть onboarding">
        Для endpoint-а **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Для endpoint-а **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Задайте типову модель">
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
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Застарілі ID `modelstudio-*` для auth-choice і посилання на моделі `modelstudio/...` усе ще
    працюють як alias-и сумісності, але нові потоки налаштування мають віддавати перевагу канонічним
    ID `qwen-*` для auth-choice і посиланням на моделі `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Найкраще підходить для:** доступу pay-as-you-go через endpoint Standard Model Studio, зокрема до моделей на кшталт `qwen3.6-plus`, які можуть бути недоступними в Coding Plan.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key на [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустіть onboarding">
        Для endpoint-а **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Для endpoint-а **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Задайте типову модель">
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
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Застарілі ID `modelstudio-*` для auth-choice і посилання на моделі `modelstudio/...` усе ще
    працюють як alias-и сумісності, але нові потоки налаштування мають віддавати перевагу канонічним
    ID `qwen-*` для auth-choice і посиланням на моделі `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Типи тарифів і endpoint-и

| Тариф                     | Регіон | Auth choice                | Endpoint                                         |
| ------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)  | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)  | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (підписка)    | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (підписка)    | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Provider автоматично вибирає endpoint на основі вашого auth choice. Канонічні
варіанти використовують сімейство `qwen-*`; `modelstudio-*` залишається лише для сумісності.
Ви можете перевизначити це власним `baseUrl` у config.

<Tip>
**Керування ключами:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Документація:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Вбудований каталог

Наразі OpenClaw постачається з таким bundled-каталогом Qwen. Налаштований каталог
враховує endpoint: конфігурації Coding Plan не включають моделі, які, як відомо, працюють лише на
endpoint-і Standard.

| Посилання на модель        | Вхід        | Контекст  | Примітки                                           |
| -------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`        | text, image | 1,000,000 | Типова модель                                      |
| `qwen/qwen3.6-plus`        | text, image | 1,000,000 | Віддавайте перевагу endpoint-ам Standard, якщо потрібна ця модель |
| `qwen/qwen3-max-2026-01-23`| text        | 262,144   | Лінійка Qwen Max                                   |
| `qwen/qwen3-coder-next`    | text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`    | text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`        | text        | 1,000,000 | Reasoning увімкнено                                |
| `qwen/glm-5`               | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`             | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`           | text, image | 262,144   | Moonshot AI через Alibaba                          |

<Note>
Доступність усе ще може відрізнятися залежно від endpoint-а й тарифного плану, навіть якщо модель
присутня в bundled-каталозі.
</Note>

## Мультимодальні доповнення

Plugin `qwen` також надає мультимодальні можливості на endpoint-ах **Standard**
DashScope (не на endpoint-ах Coding Plan):

- **Розуміння відео** через `qwen-vl-max-latest`
- **Генерація відео Wan** через `wan2.6-t2v` (за замовчуванням), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Щоб використовувати Qwen як типового provider-а відео:

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
Див. [Video Generation](/uk/tools/video-generation) щодо спільних параметрів tool-а, вибору provider-а та поведінки failover.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Розуміння зображень і відео">
    Bundled Plugin Qwen реєструє media understanding для зображень і відео
    на endpoint-ах **Standard** DashScope (не на endpoint-ах Coding Plan).

    | Властивість      | Значення              |
    | ---------------- | --------------------- |
    | Модель           | `qwen-vl-max-latest`  |
    | Підтримуваний вхід | Зображення, відео   |

    Media understanding автоматично розв’язується з налаштованої auth Qwen —
    додатковий config не потрібен. Переконайтеся, що ви використовуєте endpoint
    Standard (pay-as-you-go) для підтримки media understanding.

  </Accordion>

  <Accordion title="Доступність Qwen 3.6 Plus">
    `qwen3.6-plus` доступна на endpoint-ах Standard (pay-as-you-go) Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Якщо endpoint-и Coding Plan повертають помилку "unsupported model" для
    `qwen3.6-plus`, перейдіть на Standard (pay-as-you-go) замість endpoint-а/пари ключів
    Coding Plan.

  </Accordion>

  <Accordion title="План можливостей">
    Plugin `qwen` позиціонується як vendor home для всієї поверхні Qwen
    Cloud, а не лише для моделей coding/text.

    - **Моделі text/chat:** уже bundled
    - **Виклики tool-ів, structured output, thinking:** успадковуються від OpenAI-compatible transport
    - **Генерація зображень:** запланована на рівні provider Plugin-а
    - **Розуміння зображень/відео:** уже bundled на endpoint-і Standard
    - **Speech/audio:** заплановані на рівні provider Plugin-а
    - **Memory embeddings/reranking:** заплановані через поверхню embedding adapter
    - **Генерація відео:** уже bundled через спільну capability генерації відео

  </Accordion>

  <Accordion title="Подробиці генерації відео">
    Для генерації відео OpenClaw зіставляє налаштований регіон Qwen з відповідним
    хостом DashScope AIGC перед надсиланням завдання:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Це означає, що звичайний `models.providers.qwen.baseUrl`, який вказує або на
    хости Qwen Coding Plan, або на Standard, усе одно зберігає генерацію відео на правильному
    регіональному відео endpoint-і DashScope.

    Поточні bundled-обмеження генерації відео Qwen:

    - До **1** вихідного відео на запит
    - До **1** вхідного зображення
    - До **4** вхідних відео
    - Тривалість до **10 секунд**
    - Підтримує `size`, `aspectRatio`, `resolution`, `audio` і `watermark`
    - Режим reference image/video наразі вимагає **віддалених URL `http(s)`**. Локальні
      шляхи до файлів відхиляються одразу, оскільки відео endpoint DashScope не
      приймає завантажені локальні буфери для таких reference-ів.

  </Accordion>

  <Accordion title="Сумісність streaming usage">
    Нативні endpoint-и Model Studio повідомляють про сумісність streaming usage на
    спільному transport `openai-completions`. Тепер OpenClaw прив’язує це до можливостей
    endpoint-а, тому власні ID provider-ів, сумісні з DashScope та спрямовані на ті самі нативні
    хости, успадковують ту саму поведінку streaming-usage, замість
    вимоги саме до вбудованого ID provider-а `qwen`.

    Сумісність native-streaming usage застосовується як до хостів Coding Plan, так і
    до сумісних зі Standard DashScope хостів:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Регіони мультимодальних endpoint-ів">
    Мультимодальні поверхні (розуміння відео та генерація відео Wan) використовують
    endpoint-и **Standard** DashScope, а не endpoint-и Coding Plan:

    - Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Environment і налаштування daemon">
    Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що `QWEN_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Video generation" href="/uk/tools/video-generation" icon="video">
    Спільні параметри video tool-а та вибір provider-а.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/uk/providers/alibaba" icon="cloud">
    Застарілий provider ModelStudio і примітки щодо міграції.
  </Card>
  <Card title="Troubleshooting" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
