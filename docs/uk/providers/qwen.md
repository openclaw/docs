---
read_when:
    - Ви хочете використовувати Qwen з OpenClaw
    - Ви раніше використовували Qwen OAuth
summary: Використовуйте Qwen Cloud через вбудованого провайдера qwen в OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-09T00:06:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4786df2cb6ec1ab29d191d012c61dcb0e5468bf0f8561fbbb50eed741efad325
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

Тепер OpenClaw розглядає Qwen як повноцінного вбудованого провайдера з канонічним id
`qwen`. Вбудований провайдер націлений на кінцеві точки Qwen Cloud / Alibaba DashScope і
Coding Plan та зберігає роботу застарілих id `modelstudio` як
аліаса сумісності.

- Провайдер: `qwen`
- Бажана змінна середовища: `QWEN_API_KEY`
- Також приймаються для сумісності: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Стиль API: сумісний з OpenAI

Якщо вам потрібен `qwen3.6-plus`, віддавайте перевагу кінцевій точці **Standard (оплата за використання)**.
Підтримка Coding Plan може відставати від публічного каталогу.

```bash
# Global Coding Plan endpoint
openclaw onboard --auth-choice qwen-api-key

# China Coding Plan endpoint
openclaw onboard --auth-choice qwen-api-key-cn

# Global Standard (pay-as-you-go) endpoint
openclaw onboard --auth-choice qwen-standard-api-key

# China Standard (pay-as-you-go) endpoint
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Застарілі id `modelstudio-*` для `auth-choice` і посилання на моделі `modelstudio/...` досі
працюють як аліаси сумісності, але в нових сценаріях налаштування слід віддавати перевагу канонічним
id `qwen-*` для `auth-choice` і посиланням на моделі `qwen/...`.

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

| План                       | Регіон | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (оплата за використання)   | Китай  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (оплата за використання)   | Глобально | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (підписка) | Китай  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (підписка) | Глобально | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Провайдер автоматично вибирає кінцеву точку на основі вашого auth choice. Канонічні
варіанти використовують сімейство `qwen-*`; `modelstudio-*` залишається лише для сумісності.
Ви можете перевизначити це за допомогою власного `baseUrl` у конфігурації.

Власні кінцеві точки Model Studio оголошують сумісність використання потокової передачі на
спільному транспорті `openai-completions`. OpenClaw тепер визначає це за можливостями
кінцевої точки, тому сумісні з DashScope власні id провайдерів, що націлені на ті самі
власні хости, успадковують таку саму поведінку потокового використання замість
того, щоб вимагати саме вбудований id провайдера `qwen`.

## Отримайте свій API-ключ

- **Керування ключами**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Документація**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Вбудований каталог

Наразі OpenClaw постачається з таким вбудованим каталогом Qwen. Налаштований каталог
залежить від кінцевої точки: конфігурації Coding Plan не містять моделі, які, як відомо,
працюють лише на кінцевій точці Standard.

| Посилання на модель         | Вхідні дані | Контекст  | Примітки                                           |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | текст, зображення | 1,000,000 | Модель за замовчуванням                            |
| `qwen/qwen3.6-plus`         | текст, зображення | 1,000,000 | Віддавайте перевагу кінцевим точкам Standard, якщо вам потрібна ця модель |
| `qwen/qwen3-max-2026-01-23` | текст        | 262,144   | Лінійка Qwen Max                                   |
| `qwen/qwen3-coder-next`     | текст        | 262,144   | Кодування                                           |
| `qwen/qwen3-coder-plus`     | текст        | 1,000,000 | Кодування                                           |
| `qwen/MiniMax-M2.5`         | текст        | 1,000,000 | Увімкнено міркування                               |
| `qwen/glm-5`                | текст        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | текст        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | текст, зображення | 262,144   | Moonshot AI через Alibaba                          |

Доступність усе ще може відрізнятися залежно від кінцевої точки та тарифного плану, навіть якщо модель
присутня у вбудованому каталозі.

Сумісність використання власної потокової передачі застосовується як до хостів Coding Plan,
так і до сумісних з DashScope хостів Standard:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Доступність Qwen 3.6 Plus

`qwen3.6-plus` доступна на кінцевих точках Model Studio Standard (оплата за використання):

- Китай: `dashscope.aliyuncs.com/compatible-mode/v1`
- Глобально: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Якщо кінцеві точки Coding Plan повертають помилку "unsupported model" для
`qwen3.6-plus`, перейдіть на Standard (оплата за використання) замість пари
кінцева точка/ключ Coding Plan.

## План можливостей

Розширення `qwen` позиціонується як домашня база постачальника для всієї поверхні Qwen
Cloud, а не лише для моделей кодування/тексту.

- Текстові/чат-моделі: уже вбудовано
- Виклик інструментів, структурований вивід, міркування: успадковуються від сумісного з OpenAI транспорту
- Генерація зображень: заплановано на рівні плагіна провайдера
- Розуміння зображень/відео: уже вбудовано на кінцевій точці Standard
- Мовлення/аудіо: заплановано на рівні плагіна провайдера
- Вбудовування пам'яті/переранжування: заплановано через поверхню адаптера вбудовувань
- Генерація відео: уже вбудовано через спільну можливість генерації відео

## Мультимодальні доповнення

Розширення `qwen` тепер також надає:

- Розуміння відео через `qwen-vl-max-latest`
- Генерацію відео Wan через:
  - `wan2.6-t2v` (за замовчуванням)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Ці мультимодальні поверхні використовують кінцеві точки DashScope **Standard**, а не
кінцеві точки Coding Plan.

- Базовий URL Global/Intl Standard: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Базовий URL China Standard: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Для генерації відео OpenClaw зіставляє налаштований регіон Qwen з відповідним
хостом DashScope AIGC перед надсиланням завдання:

- Global/Intl: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

Це означає, що звичайний `models.providers.qwen.baseUrl`, який вказує на будь-який із
хостів Qwen Coding Plan або Standard, усе одно забезпечує генерацію відео на правильній
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
- Підтримує `size`, `aspectRatio`, `resolution`, `audio` і `watermark`
- Режим еталонного зображення/відео наразі вимагає **віддалених URL `http(s)`**. Локальні
  шляхи до файлів відхиляються одразу, оскільки кінцева точка відео DashScope не
  приймає завантажені локальні буфери для цих посилань.

Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри
інструмента, вибір провайдера та поведінку аварійного перемикання.

## Примітка щодо середовища

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `QWEN_API_KEY`
доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
