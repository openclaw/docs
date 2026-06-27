---
read_when:
    - Ви хочете використовувати Qwen з OpenClaw
    - Ви раніше використовували Qwen OAuth
summary: Використовуйте Qwen Cloud через його Plugin OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-06-27T18:13:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw тепер розглядає Qwen як повноцінний Plugin провайдера з канонічним id
`qwen`. Plugin провайдера орієнтований на кінцеві точки Qwen Cloud / Alibaba DashScope і
Coding Plan, зберігає працездатність застарілих id `modelstudio` як сумісного
псевдоніма, а також надає потік токенів Qwen Portal як провайдера `qwen-oauth`.

- Провайдер: `qwen`
- Провайдер Portal: [`qwen-oauth`](/uk/providers/qwen-oauth)
- Бажана змінна середовища: `QWEN_API_KEY`
- Також приймаються для сумісності: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Стиль API: сумісний з OpenAI

<Tip>
Якщо вам потрібен `qwen3.6-plus`, надавайте перевагу кінцевій точці **Standard (pay-as-you-go)**.
Підтримка Coding Plan може відставати від публічного каталогу.
</Tip>

## Установлення плагіна

Установіть офіційний плагін, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Початок роботи

Виберіть тип плану й виконайте кроки налаштування.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **Найкраще для:** доступу на основі підписки через Qwen Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Створіть або скопіюйте ключ API з [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Для кінцевої точки **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Для кінцевої точки **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Застарілі id auth-choice `modelstudio-*` і посилання на моделі `modelstudio/...` досі
    працюють як сумісні псевдоніми, але нові потоки налаштування мають надавати перевагу канонічним
    id auth-choice `qwen-*` і посиланням на моделі `qwen/...`. Якщо ви визначаєте точний
    користувацький запис `models.providers.modelstudio` з іншим значенням `api`, цей
    користувацький провайдер володіє посиланнями `modelstudio/...` замість сумісного
    псевдоніма Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Найкраще для:** доступу з оплатою за використання через кінцеву точку Standard Model Studio, зокрема до моделей на кшталт `qwen3.6-plus`, які можуть бути недоступні в Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Створіть або скопіюйте ключ API з [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Для кінцевої точки **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Для кінцевої точки **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Застарілі id auth-choice `modelstudio-*` і посилання на моделі `modelstudio/...` досі
    працюють як сумісні псевдоніми, але нові потоки налаштування мають надавати перевагу канонічним
    id auth-choice `qwen-*` і посиланням на моделі `qwen/...`. Якщо ви визначаєте точний
    користувацький запис `models.providers.modelstudio` з іншим значенням `api`, цей
    користувацький провайдер володіє посиланнями `modelstudio/...` замість сумісного
    псевдоніма Qwen.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Найкраще для:** токена Qwen Portal для `https://portal.qwen.ai/v1`.

    Див. [Qwen OAuth / Portal](/uk/providers/qwen-oauth), щоб перейти до окремої сторінки
    провайдера й приміток щодо міграції.

    <Steps>
      <Step title="Provide your portal token">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` використовує ту саму назву змінної середовища `QWEN_API_KEY`, що й провайдер
    DashScope, але зберігає автентифікацію під id провайдера `qwen-oauth`, коли її налаштовано
    через onboarding OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Типи планів і кінцеві точки

| План                       | Регіон | Вибір автентифікації       | Кінцева точка                                    |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

Провайдер автоматично вибирає кінцеву точку на основі вашого вибору автентифікації. Канонічні
варіанти використовують сімейство `qwen-*`; `modelstudio-*` залишається лише для сумісності.
Ви можете перевизначити це за допомогою користувацького `baseUrl` у конфігурації.

<Tip>
**Керування ключами:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Документація:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Вбудований каталог

OpenClaw наразі постачає цей статичний каталог Qwen. Налаштований каталог
враховує кінцеву точку: конфігурації Coding Plan пропускають моделі, про які відомо, що вони працюють лише на
кінцевій точці Standard.

| Посилання на модель         | Вхідні дані       | Контекст  | Примітки                                             |
| --------------------------- | ----------------- | --------- | ---------------------------------------------------- |
| `qwen/qwen3.5-plus`         | текст, зображення | 1,000,000 | Модель за замовчуванням                              |
| `qwen/qwen3.6-plus`         | текст, зображення | 1,000,000 | Надавайте перевагу кінцевим точкам Standard, коли вам потрібна ця модель |
| `qwen/qwen3-max-2026-01-23` | текст             | 262,144   | Лінійка Qwen Max                                     |
| `qwen/qwen3-coder-next`     | текст             | 262,144   | Coding                                               |
| `qwen/qwen3-coder-plus`     | текст             | 1,000,000 | Coding                                               |
| `qwen/MiniMax-M2.5`         | текст             | 1,000,000 | Reasoning увімкнено                                  |
| `qwen/glm-5`                | текст             | 202,752   | GLM                                                  |
| `qwen/glm-4.7`              | текст             | 202,752   | GLM                                                  |
| `qwen/kimi-k2.5`            | текст, зображення | 262,144   | Moonshot AI через Alibaba                            |
| `qwen-oauth/qwen3.5-plus`   | текст, зображення | 1,000,000 | Типове значення Qwen Portal                          |

<Note>
Доступність усе ще може відрізнятися залежно від кінцевої точки та плану оплати, навіть якщо модель
присутня в статичному каталозі.
</Note>

## Елементи керування Thinking

Для моделей Qwen Cloud із підтримкою reasoning провайдер зіставляє рівні
thinking OpenClaw із прапорцем запиту верхнього рівня DashScope `enable_thinking`. Вимкнене
thinking надсилає `enable_thinking: false`; інші рівні thinking надсилають
`enable_thinking: true`.

## Мультимодальні доповнення

Плагін `qwen` також надає мультимодальні можливості на кінцевих точках DashScope **Standard**
(не на кінцевих точках Coding Plan):

- **Розуміння відео** через `qwen-vl-max-latest`
- **Генерація відео Wan** через `wan2.6-t2v` (за замовчуванням), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Щоб використовувати Qwen як стандартного провайдера відео:

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
  <Accordion title="Image and video understanding">
    Плагін Qwen реєструє розуміння медіа для зображень і відео
    на кінцевих точках DashScope **Standard** (не на кінцевих точках Coding Plan).

    | Властивість   | Значення              |
    | ------------- | --------------------- |
    | Модель        | `qwen-vl-max-latest`  |
    | Підтримувані вхідні дані | зображення, відео |

    Розуміння медіа автоматично визначається з налаштованої автентифікації Qwen — додаткова
    конфігурація не потрібна. Переконайтеся, що ви використовуєте кінцеву точку Standard (pay-as-you-go)
    для підтримки розуміння медіа.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` доступна на кінцевих точках Standard (pay-as-you-go) Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Якщо кінцеві точки Coding Plan повертають помилку "unsupported model" для
    `qwen3.6-plus`, перейдіть на Standard (pay-as-you-go) замість пари кінцева точка/ключ
    Coding Plan.

    Статичний каталог Qwen в OpenClaw не оголошує `qwen3.6-plus` на кінцевих точках Coding
    Plan, але явно налаштовані записи `qwen/qwen3.6-plus` у
    `models.providers.qwen.models` враховуються на baseUrl Coding Plan, тож ви
    можете ввімкнути цю модель, якщо Aliyun увімкне її у вашій підписці. Вихідний
    API все одно вирішує, чи буде виклик успішним.

  </Accordion>

  <Accordion title="Capability plan">
    Плагін `qwen` позиціонується як домівка постачальника для всієї поверхні Qwen
    Cloud, а не лише для моделей coding/text.

    - **Текстові/чат-моделі:** доступні через плагін
    - **Виклики інструментів, структурований вивід, thinking:** успадковуються від транспорту, сумісного з OpenAI
    - **Генерація зображень:** заплановано на рівні плагіна провайдера
    - **Розуміння зображень/відео:** доступне через плагін на кінцевій точці Standard
    - **Мовлення/аудіо:** заплановано на рівні плагіна провайдера
    - **Ембеддинги пам’яті/повторне ранжування:** заплановано через поверхню адаптера ембеддингів
    - **Генерація відео:** доступна через плагін через спільну можливість генерації відео

  </Accordion>

  <Accordion title="Video generation details">
    Для генерації відео OpenClaw зіставляє налаштований регіон Qwen із відповідним
    хостом DashScope AIGC перед надсиланням завдання:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Це означає, що звичайний `models.providers.qwen.baseUrl`, який вказує або на хости
    Coding Plan, або на хости Standard Qwen, усе одно утримує генерацію відео на правильній
    регіональній кінцевій точці відео DashScope.

    Поточні обмеження генерації відео Qwen:

    - До **1** вихідного відео на запит
    - До **1** вхідного зображення
    - До **4** вхідних відео
    - Тривалість до **10 секунд**
    - Підтримує `size`, `aspectRatio`, `resolution`, `audio` і `watermark`
    - Режим референсного зображення/відео наразі вимагає **віддалених URL http(s)**. Локальні
      шляхи до файлів відхиляються заздалегідь, оскільки кінцева точка відео DashScope не
      приймає завантажені локальні буфери для таких референсів.

  </Accordion>

  <Accordion title="Сумісність використання потокового передавання">
    Нативні кінцеві точки Model Studio оголошують сумісність використання потокового
    передавання на спільному транспорті `openai-completions`. Тепер OpenClaw
    визначає це за можливостями кінцевої точки, тож сумісні з DashScope
    ідентифікатори користувацьких провайдерів, націлені на ті самі нативні хости,
    успадковують ту саму поведінку використання потокового передавання замість
    вимоги використовувати саме вбудований ідентифікатор провайдера `qwen`.

    Сумісність використання нативного потокового передавання застосовується як до
    хостів Coding Plan, так і до стандартних сумісних із DashScope хостів:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Регіони мультимодальних кінцевих точок">
    Мультимодальні поверхні (розуміння відео та генерація відео Wan) використовують
    **стандартні** кінцеві точки DashScope, а не кінцеві точки Coding Plan:

    - Глобальна/міжнародна стандартна базова URL-адреса: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - Китайська стандартна базова URL-адреса: `https://dashscope.aliyuncs.com/compatible-mode/v1`

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
    Спільні параметри відеоінструмента та вибір провайдера.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/uk/providers/alibaba" icon="cloud">
    Застарілий провайдер ModelStudio та нотатки щодо міграції.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
