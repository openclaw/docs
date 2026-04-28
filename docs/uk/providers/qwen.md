---
read_when:
    - Ви хочете використовувати Qwen з OpenClaw
    - Ви раніше використовували Qwen OAuth
summary: Використовуйте Qwen Cloud через вбудований у OpenClaw провайдер qwen
title: Qwen
x-i18n:
    generated_at: "2026-04-28T11:23:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898a7ef1f071c838f3bd877632dd06cf0e6112adfa2833895280f99642df56e6
    source_path: providers/qwen.md
    workflow: 16
---

<Warning>

**Qwen OAuth видалено.** Інтеграція OAuth безкоштовного рівня
(`qwen-portal`), яка використовувала кінцеві точки `portal.qwen.ai`, більше недоступна.
Див. [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) для
контексту.

</Warning>

OpenClaw тепер розглядає Qwen як першокласного вбудованого провайдера з канонічним ідентифікатором
`qwen`. Вбудований провайдер націлений на кінцеві точки Qwen Cloud / Alibaba DashScope і
Coding Plan та зберігає роботу застарілих ідентифікаторів `modelstudio` як
псевдоніма сумісності.

- Провайдер: `qwen`
- Бажана змінна середовища: `QWEN_API_KEY`
- Також приймається для сумісності: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Стиль API: сумісний з OpenAI

<Tip>
Якщо вам потрібен `qwen3.6-plus`, віддавайте перевагу кінцевій точці **Standard (оплата за використання)**.
Підтримка Coding Plan може відставати від публічного каталогу.
</Tip>

## Початок роботи

Виберіть тип плану та виконайте кроки налаштування.

<Tabs>
  <Tab title="Coding Plan (підписка)">
    **Найкраще для:** доступу на основі підписки через Qwen Coding Plan.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть або скопіюйте API-ключ із [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустіть onboarding">
        Для кінцевої точки **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Для кінцевої точки **China**:

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
    Застарілі ідентифікатори auth-choice `modelstudio-*` і посилання на моделі `modelstudio/...` досі
    працюють як псевдоніми сумісності, але нові потоки налаштування мають віддавати перевагу канонічним
    ідентифікаторам auth-choice `qwen-*` і посиланням на моделі `qwen/...`. Якщо ви визначите точний
    користувацький запис `models.providers.modelstudio` з іншим значенням `api`, цей
    користувацький провайдер володітиме посиланнями `modelstudio/...` замість псевдоніма сумісності
    Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (оплата за використання)">
    **Найкраще для:** доступу з оплатою за використання через кінцеву точку Standard Model Studio, включно з моделями на кшталт `qwen3.6-plus`, які можуть бути недоступні в Coding Plan.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть або скопіюйте API-ключ із [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустіть onboarding">
        Для кінцевої точки **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Для кінцевої точки **China**:

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
    Застарілі ідентифікатори auth-choice `modelstudio-*` і посилання на моделі `modelstudio/...` досі
    працюють як псевдоніми сумісності, але нові потоки налаштування мають віддавати перевагу канонічним
    ідентифікаторам auth-choice `qwen-*` і посиланням на моделі `qwen/...`. Якщо ви визначите точний
    користувацький запис `models.providers.modelstudio` з іншим значенням `api`, цей
    користувацький провайдер володітиме посиланнями `modelstudio/...` замість псевдоніма сумісності
    Qwen.
    </Note>

  </Tab>
</Tabs>

## Типи планів і кінцеві точки

| План                       | Регіон | Вибір автентифікації       | Кінцева точка                                   |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (оплата за використання) | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (оплата за використання) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (підписка) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (підписка) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Провайдер автоматично вибирає кінцеву точку на основі вашого вибору автентифікації. Канонічні
варіанти використовують сімейство `qwen-*`; `modelstudio-*` залишається лише для сумісності.
Ви можете перевизначити це за допомогою користувацького `baseUrl` у конфігурації.

<Tip>
**Керування ключами:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Документація:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Вбудований каталог

OpenClaw наразі постачає цей вбудований каталог Qwen. Налаштований каталог
враховує кінцеву точку: конфігурації Coding Plan не включають моделі, про які відомо, що вони працюють лише на
кінцевій точці Standard.

| Посилання на модель         | Вхід        | Контекст  | Примітки                                           |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | текст, зображення | 1,000,000 | Модель за замовчуванням                            |
| `qwen/qwen3.6-plus`         | текст, зображення | 1,000,000 | Віддавайте перевагу кінцевим точкам Standard, коли потрібна ця модель |
| `qwen/qwen3-max-2026-01-23` | текст        | 262,144   | Лінійка Qwen Max                                   |
| `qwen/qwen3-coder-next`     | текст        | 262,144   | Кодування                                          |
| `qwen/qwen3-coder-plus`     | текст        | 1,000,000 | Кодування                                          |
| `qwen/MiniMax-M2.5`         | текст        | 1,000,000 | Увімкнено reasoning                                |
| `qwen/glm-5`                | текст        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | текст        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | текст, зображення | 262,144   | Moonshot AI через Alibaba                          |

<Note>
Доступність усе ще може відрізнятися залежно від кінцевої точки й тарифного плану, навіть коли модель
наявна у вбудованому каталозі.
</Note>

## Елементи керування мисленням

Для моделей Qwen Cloud із увімкненим reasoning вбудований провайдер зіставляє рівні
мислення OpenClaw із прапорцем запиту верхнього рівня DashScope `enable_thinking`. Вимкнене
мислення надсилає `enable_thinking: false`; інші рівні мислення надсилають
`enable_thinking: true`.

## Мультимодальні доповнення

Plugin `qwen` також надає мультимодальні можливості на кінцевих точках DashScope **Standard**
(не на кінцевих точках Coding Plan):

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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Розуміння зображень і відео">
    Вбудований Plugin Qwen реєструє розуміння медіа для зображень і відео
    на кінцевих точках DashScope **Standard** (не на кінцевих точках Coding Plan).

    | Властивість  | Значення              |
    | ------------- | --------------------- |
    | Модель        | `qwen-vl-max-latest`  |
    | Підтримуваний вхід | Зображення, відео |

    Розуміння медіа автоматично визначається з налаштованої автентифікації Qwen — додаткова
    конфігурація не потрібна. Переконайтеся, що ви використовуєте кінцеву точку Standard (оплата за використання)
    для підтримки розуміння медіа.

  </Accordion>

  <Accordion title="Доступність Qwen 3.6 Plus">
    `qwen3.6-plus` доступна на кінцевих точках Standard (оплата за використання) Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Якщо кінцеві точки Coding Plan повертають помилку "unsupported model" для
    `qwen3.6-plus`, перейдіть на Standard (оплата за використання) замість пари кінцева точка/ключ
    Coding Plan.

    Вбудований каталог Qwen в OpenClaw не рекламує `qwen3.6-plus` на кінцевих точках Coding
    Plan, але явно налаштовані записи `qwen/qwen3.6-plus` у
    `models.providers.qwen.models` поважаються на baseUrls Coding Plan, тож ви
    можете ввімкнути цю модель, якщо Aliyun увімкне її для вашої підписки. Вищестоящий
    API усе одно вирішує, чи буде виклик успішним.

  </Accordion>

  <Accordion title="План можливостей">
    Plugin `qwen` позиціонується як домівка постачальника для всієї поверхні Qwen
    Cloud, а не лише для моделей кодування/тексту.

    - **Текстові/чат-моделі:** вбудовано зараз
    - **Виклики інструментів, структурований вивід, мислення:** успадковано від сумісного з OpenAI транспорту
    - **Генерація зображень:** заплановано на рівні provider-plugin
    - **Розуміння зображень/відео:** вбудовано зараз на кінцевій точці Standard
    - **Мовлення/аудіо:** заплановано на рівні provider-plugin
    - **Ембеддинги пам'яті/переранжування:** заплановано через поверхню адаптера ембеддингів
    - **Генерація відео:** вбудовано зараз через спільну можливість генерації відео

  </Accordion>

  <Accordion title="Деталі генерації відео">
    Для генерації відео OpenClaw зіставляє налаштований регіон Qwen із відповідним
    хостом DashScope AIGC перед надсиланням завдання:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Це означає, що звичайний `models.providers.qwen.baseUrl`, який указує або на хости
    Coding Plan, або Standard Qwen, усе одно тримає генерацію відео на правильній
    регіональній кінцевій точці відео DashScope.

    Поточні вбудовані обмеження генерації відео Qwen:

    - До **1** вихідного відео на запит
    - До **1** вхідного зображення
    - До **4** вхідних відео
    - Тривалість до **10 секунд**
    - Підтримує `size`, `aspectRatio`, `resolution`, `audio` і `watermark`
    - Режим референсних зображень/відео наразі вимагає **віддалені URL-адреси http(s)**. Локальні
      шляхи до файлів відхиляються заздалегідь, оскільки кінцева точка відео DashScope не
      приймає завантажені локальні буфери для таких референсів.

  </Accordion>

  <Accordion title="Сумісність використання streaming">
    Нативні кінцеві точки Model Studio оголошують сумісність використання streaming у
    спільному транспорті `openai-completions`. OpenClaw тепер прив'язує це до можливостей
    кінцевої точки, тому користувацькі ідентифікатори провайдерів, сумісні з DashScope і націлені на
    ті самі нативні хости, успадковують таку саму поведінку streaming-usage замість
    вимоги саме вбудованого ідентифікатора провайдера `qwen`.

    Сумісність native-streaming usage застосовується і до хостів Coding Plan, і
    до сумісних із DashScope хостів Standard:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Регіони мультимодальних кінцевих точок">
    Мультимодальні поверхні (розуміння відео та генерація відео Wan) використовують кінцеві точки DashScope
    **Standard**, а не кінцеві точки Coding Plan:

    - Базовий URL Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - Базовий URL Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Налаштування середовища та демона">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `QWEN_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/uk/providers/alibaba" icon="cloud">
    Застарілий провайдер ModelStudio і примітки щодо міграції.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
