---
read_when:
    - Ви хочете використовувати генерацію відео Alibaba Wan в OpenClaw
    - Для створення відео потрібно налаштувати ключ API Model Studio або DashScope
summary: Генерування відео за допомогою Alibaba Model Studio Wan в OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T13:35:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

Вбудований plugin `alibaba` реєструє провайдера генерації відео для моделей Wan в Alibaba Model Studio (міжнародна назва DashScope). Його ввімкнено за замовчуванням; потрібен лише ключ API.

| Властивість                    | Значення                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------- |
| Ідентифікатор провайдера       | `alibaba`                                                                       |
| Plugin                         | вбудований, `enabledByDefault: true`                                             |
| Змінні середовища автентифікації | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (використовується перший збіг) |
| Прапорець початкового налаштування | `--auth-choice alibaba-model-studio-api-key`                                  |
| Прямий прапорець CLI           | `--alibaba-model-studio-api-key <key>`                                          |
| Модель за замовчуванням        | `alibaba/wan2.6-t2v`                                                            |
| Базова URL-адреса за замовчуванням | `https://dashscope-intl.aliyuncs.com`                                       |

## Початок роботи

<Steps>
  <Step title="Задайте ключ API">
    Збережіть ключ для провайдера `alibaba` під час початкового налаштування:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Або передайте ключ безпосередньо:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Або експортуйте одну з прийнятних змінних середовища перед запуском Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # або DASHSCOPE_API_KEY=...
    # або QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Задайте модель відео за замовчуванням">
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
  <Step title="Перевірте налаштування провайдера">
    ```bash
    openclaw models list --provider alibaba
    ```

    Список містить усі п’ять вбудованих моделей Wan. Якщо значення `MODELSTUDIO_API_KEY` не вдається визначити, `openclaw models status --json` повідомляє про відсутні облікові дані в `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Plugin Alibaba та [plugin Qwen](/uk/providers/qwen) автентифікуються через DashScope і приймають змінні середовища, що частково збігаються. Використовуйте ідентифікатори моделей `alibaba/...` для спеціалізованого інтерфейсу відео Wan; використовуйте ідентифікатори `qwen/...` для чату Qwen, вбудовувань або розпізнавання медіаданих.
</Note>

## Вбудовані моделі Wan

| Посилання на модель        | Режим                                  |
| -------------------------- | -------------------------------------- |
| `alibaba/wan2.6-t2v`       | Текст у відео (за замовчуванням)       |
| `alibaba/wan2.6-i2v`       | Зображення у відео                     |
| `alibaba/wan2.6-r2v`       | Референс у відео                       |
| `alibaba/wan2.6-r2v-flash` | Референс у відео (швидкий режим)       |
| `alibaba/wan2.7-r2v`       | Референс у відео                       |

## Можливості та обмеження

Усі три режими мають однакові обмеження кількості та тривалості відео на запит; відрізняється лише структура вхідних даних.

| Режим             | Макс. вихідних відео | Макс. вхідних зображень | Макс. вхідних відео | Макс. тривалість | Підтримувані параметри керування                          |
| ----------------- | -------------------- | ----------------------- | -------------------- | ---------------- | --------------------------------------------------------- |
| Текст у відео     | 1                    | не застосовується        | не застосовується     | 10 с             | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Зображення у відео | 1                   | 1                       | не застосовується     | 10 с             | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Референс у відео  | 1                    | не застосовується        | 4                    | 10 с             | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Для запиту без `durationSeconds` використовується прийнятне для DashScope стандартне значення — **5 секунд**. Явно задайте `durationSeconds` в [інструменті генерації відео](/uk/tools/video-generation), щоб збільшити тривалість до 10 с.

<Warning>
  Вхідні референсні зображення та відео мають бути віддаленими URL-адресами `http(s)`; референсні режими DashScope відхиляють локальні шляхи до файлів. Спочатку завантажте файли до об’єктного сховища або скористайтеся процесом [інструмента для роботи з медіаданими](/uk/tools/media-overview), який уже створює загальнодоступну URL-адресу.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Перевизначте базову URL-адресу DashScope">
    За замовчуванням провайдер використовує міжнародну кінцеву точку DashScope. Щоб використовувати кінцеву точку китайського регіону:

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

    Перед формуванням URL-адрес завдань AIGC провайдер видаляє кінцеві скісні риски.

  </Accordion>

  <Accordion title="Пріоритет змінних середовища автентифікації">
    OpenClaw визначає ключ API Alibaba зі змінних середовища в такому порядку, використовуючи перше непорожнє значення:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Налаштовані записи `auth.profiles` (задані за допомогою `openclaw models auth login`) мають пріоритет над визначенням через змінні середовища. Докладніше про ротацію профілів, період очікування та механізми перевизначення див. в розділі [Профілі автентифікації в поширених запитаннях про моделі](/uk/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them).

  </Accordion>

  <Accordion title="Зв’язок із plugin Qwen">
    Обидва вбудовані plugins взаємодіють із DashScope і приймають ключі API, що частково збігаються. Використовуйте:

    - Ідентифікатори `alibaba/wan*.*` для спеціалізованого провайдера відео Wan, описаного на цій сторінці.
    - Ідентифікатори `qwen/*` для чату Qwen, вбудовувань і розпізнавання медіаданих (див. [Qwen](/uk/providers/qwen)).

    Одноразове встановлення `MODELSTUDIO_API_KEY` автентифікує обидва plugins, оскільки списки змінних середовища автентифікації навмисно перетинаються; окреме початкове налаштування кожного plugin не потрібне.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента для роботи з відео та вибір провайдера.
  </Card>
  <Card title="Qwen" href="/uk/providers/qwen" icon="microchip">
    Налаштування чату Qwen, вбудовувань і розпізнавання медіаданих із тією самою автентифікацією DashScope.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Параметри агентів за замовчуванням і конфігурація моделей.
  </Card>
  <Card title="Поширені запитання про моделі" href="/uk/help/faq-models" icon="circle-question">
    Профілі автентифікації, перемикання моделей і усунення помилок «немає профілю».
  </Card>
</CardGroup>
