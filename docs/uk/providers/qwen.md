---
read_when:
    - Ви хочете використовувати Qwen з OpenClaw
    - Ви раніше використовували Qwen OAuth
summary: Використовуйте Qwen Cloud через вбудований провайдер qwen в OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-05T22:37:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f175793693ab6a4c3f1f4d42040e673c15faf7603a500757423e9e06977c989d
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth було видалено.** Інтеграція OAuth безкоштовного рівня
(`qwen-portal`), яка використовувала кінцеві точки `portal.qwen.ai`, більше недоступна.
Див. [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) для
довідки.

</Warning>

## Рекомендовано: Qwen Cloud

Тепер OpenClaw розглядає Qwen як першокласного вбудованого провайдера з канонічним ідентифікатором
`qwen`. Вбудований провайдер націлений на кінцеві точки Qwen Cloud / Alibaba DashScope та
Coding Plan і зберігає роботу застарілих ідентифікаторів `modelstudio` як
псевдонім сумісності.

- Провайдер: `qwen`
- Бажана змінна середовища: `QWEN_API_KEY`
- Також приймаються для сумісності: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Стиль API: сумісний з OpenAI

Якщо вам потрібен `qwen3.6-plus`, надавайте перевагу кінцевій точці **Standard (pay-as-you-go)**.
Підтримка Coding Plan може відставати від публічного каталогу.

```bash
# Глобальна кінцева точка Coding Plan
openclaw onboard --auth-choice qwen-api-key

# Китайська кінцева точка Coding Plan
openclaw onboard --auth-choice qwen-api-key-cn

# Глобальна кінцева точка Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key

# Китайська кінцева точка Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Застарілі ідентифікатори `auth-choice` у форматі `modelstudio-*` і посилання на моделі `modelstudio/...` усе ще
працюють як псевдоніми сумісності, але в нових потоках налаштування слід надавати перевагу канонічним
ідентифікаторам `auth-choice` у форматі `qwen-*` і посиланням на моделі `qwen/...`.

Після онбордингу встановіть модель за замовчуванням:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Типи планів і кінцеві точки

| План                       | Регіон | Вибір автентифікації       | Кінцева точка                                    |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Провайдер автоматично вибирає кінцеву точку на основі вашого вибору автентифікації. Канонічні
варіанти використовують сімейство `qwen-*`; `modelstudio-*` залишається лише для сумісності.
Ви можете перевизначити це за допомогою власного `baseUrl` у конфігурації.

Нативні кінцеві точки Model Studio оголошують сумісність використання потокового передавання на
спільному транспорті `openai-completions`. Тепер OpenClaw прив’язує це до можливостей кінцевої точки, тож
користувацькі ідентифікатори провайдера, сумісні з DashScope, які націлені на ті самі нативні хости,
успадковують ту саму поведінку потокового використання замість того,
щоб вимагати саме вбудований ідентифікатор провайдера `qwen`.

## Отримайте свій ключ API

- **Керування ключами**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Документація**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Вбудований каталог

Наразі OpenClaw постачається з таким вбудованим каталогом Qwen:

| Посилання на модель         | Вхідні дані | Контекст  | Примітки                                           |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Модель за замовчуванням                            |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Надавайте перевагу кінцевим точкам Standard, коли потрібна ця модель |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Лінійка Qwen Max                                   |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Для кодування                                      |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Для кодування                                      |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Увімкнено міркування                               |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI через Alibaba                          |

Доступність усе ще може відрізнятися залежно від кінцевої точки та тарифного плану, навіть якщо модель
є у вбудованому каталозі.

Сумісність використання нативного потокового передавання застосовується як до хостів Coding Plan, так і
до сумісних із DashScope хостів Standard:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Доступність Qwen 3.6 Plus

`qwen3.6-plus` доступна на кінцевих точках Model Studio Standard (pay-as-you-go):

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Якщо кінцеві точки Coding Plan повертають помилку "unsupported model" для
`qwen3.6-plus`, перейдіть на Standard (pay-as-you-go) замість пари
кінцевої точки/ключа Coding Plan.

## План можливостей

Розширення `qwen` позиціонується як дім постачальника для повної поверхні Qwen
Cloud, а не лише для моделей кодування/тексту.

- Текстові/чат-моделі: уже вбудовано
- Виклик інструментів, структурований вивід, міркування: успадковано від транспорту, сумісного з OpenAI
- Генерація зображень: заплановано на рівні плагіна провайдера
- Розуміння зображень/відео: уже вбудовано на кінцевій точці Standard
- Мовлення/аудіо: заплановано на рівні плагіна провайдера
- Вбудовування пам’яті/переранжування: заплановано через поверхню адаптера embeddings
- Генерація відео: уже вбудовано через спільну можливість генерації відео

## Мультимодальні доповнення

Тепер розширення `qwen` також надає:

- Розуміння відео через `qwen-vl-max-latest`
- Генерацію відео Wan через:
  - `wan2.6-t2v` (за замовчуванням)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Ці мультимодальні поверхні використовують кінцеві точки DashScope **Standard**, а не
кінцеві точки Coding Plan.

- Базовий URL Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Базовий URL Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Для генерації відео OpenClaw зіставляє налаштований регіон Qwen із відповідним
хостом DashScope AIGC перед надсиланням завдання:

- Global/Intl: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

Це означає, що звичайний `models.providers.qwen.baseUrl`, який вказує на будь-який із
хостів Qwen для Coding Plan або Standard, усе одно зберігає генерацію відео на правильній
регіональній кінцевій точці відео DashScope.

Для генерації відео явно встановіть модель за замовчуванням:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Поточні обмеження вбудованої генерації відео Qwen:

- До **1** вихідного відео на запит
- До **1** вхідного зображення
- До **4** вхідних відео
- Тривалість до **10 секунд**
- Підтримуються `size`, `aspectRatio`, `resolution`, `audio` і `watermark`
- Режим еталонного зображення/відео наразі потребує **віддалених URL-адрес http(s)**. Локальні
  шляхи до файлів відхиляються одразу, оскільки кінцева точка відео DashScope не
  приймає завантажені локальні буфери для цих еталонів.

Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри
інструмента, вибір провайдера та поведінку failover.

## Примітка щодо середовища

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `QWEN_API_KEY`
доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
