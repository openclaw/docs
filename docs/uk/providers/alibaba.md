---
read_when:
    - Ви хочете використовувати генерацію відео Alibaba Wan в OpenClaw
    - Для генерації відео потрібно налаштувати API-ключ Model Studio або DashScope
summary: Генерація відео Alibaba Model Studio Wan в OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-05T23:43:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
---

OpenClaw постачається з вбудованим Plugin `alibaba`, який реєструє провайдера генерації відео для моделей Wan в Alibaba Model Studio (міжнародна назва DashScope). Plugin увімкнено за замовчуванням; потрібно лише встановити API-ключ.

| Властивість         | Значення                                                                        |
| ------------------- | ------------------------------------------------------------------------------- |
| ID провайдера       | `alibaba`                                                                       |
| Plugin              | вбудований, `enabledByDefault: true`                                            |
| Змінні env для auth | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (перемагає перший збіг) |
| Прапорець onboarding | `--auth-choice alibaba-model-studio-api-key`                                   |
| Прямий прапорець CLI | `--alibaba-model-studio-api-key <key>`                                         |
| Модель за замовчуванням | `alibaba/wan2.6-t2v`                                                        |
| Базовий URL за замовчуванням | `https://dashscope-intl.aliyuncs.com`                                  |

## Початок роботи

<Steps>
  <Step title="Установіть API-ключ">
    Використайте onboarding, щоб зберегти ключ для провайдера `alibaba`:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Або передайте ключ напряму під час встановлення/onboarding:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Або експортуйте будь-яку з прийнятих змінних env перед запуском Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Установіть модель відео за замовчуванням">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Перевірте, що провайдера налаштовано">
    ```bash
    openclaw models list --provider alibaba
    ```

    Список має містити всі п’ять вбудованих моделей Wan. Якщо `MODELSTUDIO_API_KEY` не вдалося розв’язати, `openclaw models status --json` повідомить про відсутні облікові дані в `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Plugin Alibaba і [Plugin Qwen](/uk/providers/qwen) обидва автентифікуються через DashScope і приймають змінні env, що перетинаються. Використовуйте ID моделей `alibaba/...` для керування спеціалізованою відеоповерхнею Wan; використовуйте ID `qwen/...`, коли потрібна поверхня Qwen для чату, embedding або розуміння медіа.
</Note>

## Вбудовані моделі Wan

| Посилання на модель        | Режим                     |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Текст-у-відео (за замовчуванням) |
| `alibaba/wan2.6-i2v`       | Зображення-у-відео        |
| `alibaba/wan2.6-r2v`       | Референс-у-відео          |
| `alibaba/wan2.6-r2v-flash` | Референс-у-відео (швидкий) |
| `alibaba/wan2.7-r2v`       | Референс-у-відео          |

## Можливості й обмеження

Вбудований провайдер віддзеркалює обмеження відео API Wan у DashScope. Усі три режими мають однакові обмеження на кількість відео в одному запиті та тривалість; відрізняється лише форма вхідних даних.

| Режим              | Макс. вихідних відео | Макс. вхідних зображень | Макс. вхідних відео | Макс. тривалість | Підтримувані елементи керування                          |
| ------------------ | -------------------- | ------------------------ | ------------------- | ---------------- | --------------------------------------------------------- |
| Текст-у-відео      | 1                    | n/a                      | n/a                 | 10 с             | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Зображення-у-відео | 1                    | 1                        | n/a                 | 10 с             | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Референс-у-відео   | 1                    | n/a                      | 4                   | 10 с             | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Коли запит не містить `durationSeconds`, провайдер надсилає прийняте в DashScope значення за замовчуванням — **5 секунд**. Установіть `durationSeconds` явно в [інструменті генерації відео](/uk/tools/video-generation), щоб збільшити тривалість до 10 с.

<Warning>
  Вхідні референсні зображення та відео мають бути віддаленими URL `http(s)`. Локальні шляхи до файлів не приймаються референсними режимами DashScope; спершу завантажте їх в об’єктне сховище або використайте потік [інструмента медіа](/uk/tools/media-overview), який уже створює публічний URL.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Перевизначення базового URL DashScope">
    Провайдер за замовчуванням використовує міжнародний endpoint DashScope. Щоб націлитися на endpoint китайського регіону, установіть:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    Провайдер видаляє кінцеві скісні риски перед побудовою URL завдань AIGC.

  </Accordion>

  <Accordion title="Пріоритет env для auth">
    OpenClaw розв’язує API-ключ Alibaba зі змінних середовища в такому порядку, беручи перше непорожнє значення:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Налаштовані записи `auth.profiles` (установлені через `openclaw models auth login`) перевизначають розв’язання змінних env. Див. [Auth profiles у FAQ моделей](/uk/help/faq-models#what-is-an-auth-profile), щоб дізнатися про ротацію профілів, cooldown і механіку перевизначення.

  </Accordion>

  <Accordion title="Зв’язок із Plugin Qwen">
    Обидва вбудовані plugins взаємодіють із DashScope і приймають API-ключі, що перетинаються. Використовуйте:

    - ID `alibaba/wan*.*` для керування спеціалізованим провайдером відео Wan, задокументованим на цій сторінці.
    - ID `qwen/*` для чату Qwen, embedding і розуміння медіа (див. [Qwen](/uk/providers/qwen)).

    Одного встановлення `MODELSTUDIO_API_KEY` достатньо для автентифікації обох plugins, оскільки список змінних env для auth навмисно перетинається; проходити onboarding для кожного Plugin окремо не потрібно.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="Qwen" href="/uk/providers/qwen" icon="microchip">
    Налаштування чату Qwen, embedding і розуміння медіа з тією самою auth DashScope.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Налаштування за замовчуванням для агентів і конфігурація моделей.
  </Card>
  <Card title="FAQ моделей" href="/uk/help/faq-models" icon="circle-question">
    Auth profiles, перемикання моделей і розв’язання помилок "no profile".
  </Card>
</CardGroup>
