---
read_when:
    - Ви хочете використовувати Qwen з OpenClaw
    - У вас є підписка на тарифний план токенів Alibaba Cloud
    - Ви раніше використовували OAuth Qwen
summary: Використовуйте Qwen Cloud через його плагін OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-12T13:38:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud — це офіційний зовнішній Plugin постачальника OpenClaw із канонічним ідентифікатором `qwen`. Він призначений для кінцевих точок Qwen Cloud / Alibaba DashScope Standard і Coding Plan, надає Token Plan як `qwen-token-plan`, зберігає `modelstudio` як псевдонім сумісності, незалежно керує задокументованим Alibaba ідентифікатором спеціального постачальника `bailian-token-plan` і надає потік токена Qwen Portal як [`qwen-oauth`](/uk/providers/qwen-oauth).

| Властивість                    | Значення                                   |
| ------------------------------ | ------------------------------------------ |
| Постачальник                   | `qwen`                                     |
| Постачальник Token Plan        | `qwen-token-plan`                          |
| Постачальник Portal            | [`qwen-oauth`](/uk/providers/qwen-oauth)      |
| Бажана змінна середовища       | `QWEN_API_KEY`                             |
| Змінна середовища Token Plan   | `QWEN_TOKEN_PLAN_API_KEY`                  |
| Також приймаються (сумісність) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| Стиль API                      | сумісний з OpenAI                          |

<Tip>
`qwen3.7-plus` і `qwen3.6-plus` працюють із кінцевими точками Coding Plan і Standard.
Для `qwen3.7-max` або `qwen3.6-flash` використовуйте кінцеву точку **Standard (оплата за використання)**.
</Tip>

## Установлення Plugin

`qwen` постачається як офіційний зовнішній Plugin і не входить до складу ядра. Установіть його та перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Початок роботи

Виберіть тип плану та виконайте кроки налаштування.

<Tabs>
  <Tab title="Coding Plan (передплата)">
    **Найкраще підходить для:** доступу за передплатою через Qwen Coding Plan.

    <Steps>
      <Step title="Отримайте ключ API">
        Створіть або скопіюйте ключ API на сторінці [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустіть початкове налаштування">
        Для **глобальної** кінцевої точки:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Для кінцевої точки в **Китаї**:

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
      <Step title="Перевірте доступність моделі">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Застарілі ідентифікатори вибору автентифікації `modelstudio-*` і посилання на моделі `modelstudio/...` досі
    працюють як псевдоніми сумісності, але в нових потоках налаштування слід віддавати перевагу канонічним
    ідентифікаторам вибору автентифікації `qwen-*` і посиланням на моделі `qwen/...`. Якщо ви визначите точний
    спеціальний запис `models.providers.modelstudio` з іншим значенням `api`, цей
    спеціальний постачальник керуватиме посиланнями `modelstudio/...` замість псевдоніма сумісності
    Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (оплата за використання)">
    **Найкраще підходить для:** доступу з оплатою за використання через кінцеву точку Standard Model Studio, зокрема до `qwen3.7-max` і `qwen3.6-flash`, які недоступні в Coding Plan.

    <Steps>
      <Step title="Отримайте ключ API">
        Створіть або скопіюйте ключ API на сторінці [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустіть початкове налаштування">
        Для **глобальної** кінцевої точки:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Для кінцевої точки в **Китаї**:

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
      <Step title="Перевірте доступність моделі">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Застарілі ідентифікатори вибору автентифікації `modelstudio-*` і посилання на моделі `modelstudio/...` досі
    працюють як псевдоніми сумісності, але в нових потоках налаштування слід віддавати перевагу канонічним
    ідентифікаторам вибору автентифікації `qwen-*` і посиланням на моделі `qwen/...`. Якщо ви визначите точний
    спеціальний запис `models.providers.modelstudio` з іншим значенням `api`, цей
    спеціальний постачальник керуватиме посиланнями `modelstudio/...` замість псевдоніма сумісності
    Qwen.
    </Note>

  </Tab>

  <Tab title="Token Plan (командна редакція)">
    **Найкраще підходить для:** командного доступу за передплатою на основі кредитів до Qwen і підтримуваних сторонніх моделей через Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Отримайте виділений ключ">
        Призначте місце Token Plan і створіть для нього виділений ключ `sk-sp-...`. Ключі Token Plan, Coding Plan і ключі з оплатою за використання не є взаємозамінними. Див. [огляд глобального Token Plan](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) або [огляд Token Plan для Китаю](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Запустіть початкове налаштування">
        Для **глобальної / міжнародної** кінцевої точки в Сінгапурі:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Для кінцевої точки в **Китаї**, розташованої в Пекіні:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Перевірте постачальника">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    У посібнику Alibaba з OpenClaw використовується `bailian-token-plan` для вручну налаштованого спеціального
    постачальника. Plugin реєструє цей ідентифікатор як власник сумісності, але в нових
    конфігураціях слід використовувати `qwen-token-plan`. Точний спеціальний
    запис `models.providers.bailian-token-plan` зберігає керування налаштованими
    транспортом і каталогом; він ніколи не об’єднується з канонічним каталогом OpenAI.
    </Note>

    <Warning>
    Використовуйте Token Plan лише для інтерактивних сеансів OpenClaw. Не вибирайте його для
    завдань Cron, автоматичних сценаріїв або серверних компонентів застосунків. Alibaba зазначає, що
    неінтерактивне використання може призвести до призупинення передплати або відкликання її ключа API.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Найкраще підходить для:** токена Qwen Portal для `https://portal.qwen.ai/v1`.

    Див. окрему сторінку постачальника [Qwen OAuth / Portal](/uk/providers/qwen-oauth)
    і примітки щодо міграції.

    <Steps>
      <Step title="Надайте токен Portal">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
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
      <Step title="Перевірте доступність моделі">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` використовує ту саму назву змінної середовища `QWEN_API_KEY`, що й постачальник
    Qwen Cloud, але під час налаштування через початкове налаштування OpenClaw зберігає дані автентифікації
    під ідентифікатором постачальника `qwen-oauth`.
    </Note>

  </Tab>
</Tabs>

## Типи планів і кінцеві точки

| План                              | Регіон     | Вибір автентифікації       | Кінцева точка                                                     |
| --------------------------------- | ---------- | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (передплата)          | Китай      | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (передплата)          | Глобальний | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                       | Глобальний | `qwen-oauth`               | `portal.qwen.ai/v1`                                              |
| Standard (оплата за використання) | Китай      | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (оплата за використання) | Глобальний | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (командна редакція)    | Китай      | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (командна редакція)    | Глобальний | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

Постачальник автоматично вибирає кінцеву точку на основі вашого вибору автентифікації. Канонічні
варіанти належать до сімейства `qwen-*`; `modelstudio-*` зберігається лише для сумісності.
Перевизначте це за допомогою спеціального `baseUrl` у конфігурації.

<Tip>
**Керування ключами:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Документація:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Вбудований каталог

OpenClaw постачає цей статичний каталог Qwen. Каталог враховує кінцеву точку: конфігурації Coding
Plan не містять моделей, які працюють лише з кінцевою точкою Standard.

| Посилання на модель         | Вхідні дані         | Контекст  | Примітки                          |
| --------------------------- | ------------------- | --------- | --------------------------------- |
| `qwen/qwen3.5-plus`         | текст, зображення   | 1,000,000 | Модель за замовчуванням           |
| `qwen/qwen3.6-flash`        | текст, зображення   | 1,000,000 | Лише кінцеві точки Standard       |
| `qwen/qwen3.6-plus`         | текст, зображення   | 1,000,000 | Coding Plan + Standard            |
| `qwen/qwen3.7-max`          | текст               | 1,000,000 | Лише кінцеві точки Standard       |
| `qwen/qwen3.7-plus`         | текст, зображення   | 1,000,000 | Coding Plan + Standard            |
| `qwen/qwen3-max-2026-01-23` | текст               | 262,144   | Лінійка Qwen Max                  |
| `qwen/qwen3-coder-next`     | текст               | 262,144   | Програмування                     |
| `qwen/qwen3-coder-plus`     | текст               | 1,000,000 | Програмування                     |
| `qwen/MiniMax-M2.5`         | текст               | 1,000,000 | Міркування ввімкнено              |
| `qwen/glm-5`                | текст               | 202,752   | GLM                               |
| `qwen/glm-4.7`              | текст               | 202,752   | GLM                               |
| `qwen/kimi-k2.5`            | текст, зображення   | 262,144   | Moonshot AI через Alibaba         |
| `qwen-oauth/qwen3.5-plus`   | текст, зображення   | 1,000,000 | Типова модель Qwen Portal         |

<Note>
Доступність може відрізнятися залежно від кінцевої точки та тарифного плану, навіть якщо модель
наявна у статичному каталозі.
</Note>

### Каталог Token Plan

Token Plan використовує окремий список дозволених точних рядків. Моделі плану, призначені лише
для генерування зображень, тут не наведено, оскільки вони використовують інші API.

| Посилання на модель                 | Вхідні дані       | Контекст  |
| ----------------------------------- | ----------------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | текст             | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | текст, зображення | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | текст, зображення | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | текст, зображення | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | текст             | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | текст             | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | текст             | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | текст, зображення | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | текст, зображення | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | текст, зображення | 262,144   |
| `qwen-token-plan/glm-5.2`           | текст             | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | текст             | 202,752   |
| `qwen-token-plan/glm-5`             | текст             | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | текст             | 196,608   |

## Керування міркуванням

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` і `qwen3.6-plus` мають
підтримку міркування у вбудованому каталозі. Для моделей із міркуванням сімейства
`qwen` провайдер зіставляє рівні мислення OpenClaw із прапорцем запиту верхнього
рівня `enable_thinking` у DashScope: вимкнене мислення надсилає `enable_thinking: false`,
а будь-який інший рівень — `enable_thinking: true`. Власні моделі можуть використовувати
альтернативне корисне навантаження мислення для шаблону чату, якщо в записі моделі
встановити `compat.thinkingFormat: "qwen-chat-template"`.

Моделі Token Plan також позначено як такі, що підтримують міркування. `kimi-k2.7-code` і
`MiniMax-M2.5` працюють лише з мисленням, тому OpenClaw залишає мислення ввімкненим,
навіть коли сеанс запитує `/think off`. Для DeepSeek V4 рівні від `minimal` до `high`
зіставляються з рівнем зусиль `high` сервісу, а `xhigh` або `max` — із `max`. GLM 5.2
підтримує весь діапазон від `minimal` до `max`; GLM 5.1 і GLM 5 підтримують рівні до
`xhigh`, а типовим рівнем для всіх трьох є `high`. Інші гібридні моделі дотримуються
запитаного стану ввімкнення або вимкнення.

## Мультимодальні доповнення

Plugin `qwen` надає мультимодальні можливості лише на кінцевих точках DashScope
**Standard**, але не на кінцевих точках Coding Plan:

- **Розпізнавання зображень і відео** через `qwen-vl-max-latest`
- **Генерування відео Wan** через `wan2.6-t2v` (типово), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Розпізнавання медіафайлів автоматично налаштовується на основі сконфігурованої
автентифікації Qwen; додаткова конфігурація не потрібна. Щоб розпізнавання
медіафайлів працювало, переконайтеся, що використовуєте кінцеву точку Standard
(з оплатою за використання).

Щоб зробити Qwen типовим провайдером відео:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Обмеження генерування відео: 1 вихідне відео на запит, до 1 вхідного зображення
(перетворення зображення на відео), до 4 вхідних відео (перетворення відео на відео),
максимальна тривалість — 10 секунд. Підтримуються `size`, `aspectRatio`, `resolution`,
`audio` і `watermark`. Для вхідних еталонних зображень і відео потрібні віддалені
URL-адреси http(s); локальні шляхи до файлів відхиляються заздалегідь, оскільки
кінцева точка відео DashScope не приймає завантажені локальні буфери для таких
еталонних матеріалів.

<Note>
Відомості про спільні параметри інструмента, вибір провайдера та поведінку резервного перемикання див. у розділі [Генерування відео](/uk/tools/video-generation).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Доступність Qwen 3.6 і 3.7">
    `qwen3.7-plus` і `qwen3.6-plus` доступні на кінцевих точках Coding Plan і Standard. `qwen3.7-max` і `qwen3.6-flash` доступні лише на Standard. Кінцеві точки Standard (з оплатою за використання):

    - Китай: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Глобальна: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw не включає `qwen3.7-max` і `qwen3.6-flash` до каталогів Coding Plan.
    Якщо кінцева точка Coding Plan повертає помилку «модель не підтримується» для
    будь-якої з них, перейдіть на відповідну кінцеву точку Standard і ключ.

  </Accordion>

  <Accordion title="Регіональна маршрутизація генерування відео">
    Перед надсиланням завдання генерування відео OpenClaw зіставляє налаштований
    регіон Qwen із відповідним хостом DashScope AIGC:

    - Глобальний/міжнародний: `https://dashscope-intl.aliyuncs.com`
    - Китай: `https://dashscope.aliyuncs.com`

    Звичайне значення `models.providers.qwen.baseUrl`, що вказує на хост Qwen
    Coding Plan або Standard, усе одно спрямовує генерування відео до відповідної
    регіональної кінцевої точки відео DashScope.

  </Accordion>

  <Accordion title="Сумісність використання потокового передавання">
    Власні кінцеві точки Qwen оголошують сумісність обліку використання під час
    потокового передавання у спільному транспорті `openai-completions`, тому власні
    ідентифікатори провайдерів, сумісних із DashScope і націлених на ті самі власні
    хости, успадковують таку саму поведінку без обов’язкової прив’язки саме до
    вбудованого ідентифікатора провайдера `qwen`. Це стосується кінцевих точок
    Coding Plan, Standard і Token Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="План можливостей">
    Plugin `qwen` позиціонується як основне місце провайдера для всієї поверхні
    Qwen Cloud, а не лише для моделей програмування й тексту.

    - **Моделі тексту/чату:** доступні через Plugin
    - **Виклики інструментів, структурований вивід, мислення:** успадковуються від транспорту, сумісного з OpenAI
    - **Генерування зображень:** заплановано на рівні Plugin провайдера
    - **Розпізнавання зображень і відео:** доступне через Plugin на кінцевій точці Standard
    - **Мовлення/аудіо:** заплановано на рівні Plugin провайдера
    - **Векторні подання пам’яті/повторне ранжування:** заплановано через поверхню адаптера векторних подань
    - **Генерування відео:** доступне через Plugin завдяки спільній можливості генерування відео

  </Accordion>

  <Accordion title="Налаштування середовища й фонової служби">
    Якщо Gateway працює як фонова служба (launchd/systemd), переконайтеся, що
    `QWEN_API_KEY` або `QWEN_TOKEN_PLAN_API_KEY` доступна цьому процесу
    (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Генерування відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="Alibaba Model Studio" href="/uk/providers/alibaba" icon="cloud">
    Вбудований провайдер генерування відео Wan на тій самій платформі DashScope.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальні відомості про усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
