---
read_when:
    - Ви хочете використовувати генерацію відео PixVerse в OpenClaw
    - Вам потрібно налаштувати ключ API PixVerse та змінні середовища
    - Ви хочете зробити PixVerse постачальником відео за замовчуванням
summary: Налаштування генерації відео PixVerse в OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T13:38:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw надає `pixverse` як офіційний зовнішній плагін для хмарної генерації відео PixVerse. Плагін реєструє провайдера `pixverse` відповідно до контракту `videoGenerationProviders`.

| Властивість              | Значення                                                                  |
| ------------------------ | ------------------------------------------------------------------------- |
| Ідентифікатор провайдера | `pixverse`                                                                |
| Пакет плагіна            | `@openclaw/pixverse-provider`                                             |
| Змінна середовища автентифікації | `PIXVERSE_API_KEY`                                                |
| Прапорець початкового налаштування | `--auth-choice pixverse-api-key`                                  |
| Прямий прапорець CLI     | `--pixverse-api-key <key>`                                                |
| API                      | PixVerse Platform API v2 (надсилання `video_id` та опитування результату) |
| Модель за замовчуванням  | `pixverse/v6`                                                             |
| Регіон API за замовчуванням | Міжнародний                                                            |

## Початок роботи

<Steps>
  <Step title="Установіть плагін">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Установіть ключ API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    Майстер пропонує вибрати міжнародну або китайську кінцеву точку (див. розділ про регіон API
    нижче), перш ніж записати `region` і `baseUrl` у конфігурацію провайдера.
    Для неінтерактивних запусків (ключ із `--pixverse-api-key` або `PIXVERSE_API_KEY`)
    за замовчуванням використовується міжнародний регіон.

    Початкове налаштування також задає для `agents.defaults.videoGenerationModel.primary`
    значення `pixverse/v6`, якщо модель відео за замовчуванням ще не налаштована.

  </Step>
  <Step title="Змініть наявного провайдера відео за замовчуванням (необов’язково)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Згенеруйте відео">
    Попросіть агента згенерувати відео. PixVerse буде використано автоматично.
  </Step>
</Steps>

## Підтримувані режими та моделі

Провайдер надає доступ до моделей генерації PixVerse через спільний інструмент відео OpenClaw.

| Режим              | Моделі               | Вхідні довідкові дані           |
| ------------------ | -------------------- | ------------------------------- |
| Текст у відео      | `v6` (за замовчуванням), `c1` | Немає                  |
| Зображення у відео | `v6` (за замовчуванням), `c1` | 1 локальне або віддалене зображення |

Локальні зображення завантажуються до PixVerse перед запитом на перетворення зображення у відео. URL-адреси віддалених зображень передаються через кінцеву точку завантаження зображень PixVerse як `image_url`.

| Параметр          | Підтримувані значення                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Тривалість        | 1–15 секунд (за замовчуванням 5)                                                                                                       |
| Роздільна здатність | `360P`, `540P`, `720P`, `1080P` (за замовчуванням `540P`; запити `480P` зіставляються з `540P`)                                       |
| Співвідношення сторін | `16:9` (за замовчуванням), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; лише для перетворення тексту у відео, перетворення зображення у відео використовує пропорції вихідного зображення |
| Згенерований звук | `audio: true`                                                                                                                           |

<Note>
Генерація зображень за шаблонами PixVerse ще не доступна через `image_generate`. Цей API керується ідентифікатором шаблону, тоді як спільний контракт генерації зображень OpenClaw наразі не має типізованого набору параметрів, специфічного для PixVerse.
</Note>

## Параметри провайдера

Провайдер відео приймає такі необов’язкові специфічні для нього ключі:

| Параметр                             | Тип    | Ефект                                                |
| ------------------------------------ | ------ | ---------------------------------------------------- |
| `seed`                               | число  | Детерміноване початкове значення від 0 до 2147483647 |
| `negativePrompt` / `negative_prompt` | рядок  | Негативний промпт                                    |
| `quality`                            | рядок  | Якість PixVerse, наприклад `720p`                    |
| `motionMode` / `motion_mode`         | рядок  | Режим руху для перетворення зображення у відео (за замовчуванням `normal`) |
| `cameraMovement` / `camera_movement` | рядок  | Попередньо заданий рух камери PixVerse               |
| `templateId` / `template_id`         | число  | Ідентифікатор активованого шаблону PixVerse          |

## Конфігурація

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Регіон API">
    | Значення регіону | Базова URL-адреса API PixVerse              |
    | ---------------- | -------------------------------------------- |
    | `international`  | `https://app-api.pixverse.ai/openapi/v2`     |
    | `cn`             | `https://app-api.pixverseai.cn/openapi/v2`   |

    Задайте `models.providers.pixverse.region` вручну, якщо ваш ключ належить до
    певного регіону платформи PixVerse, або виконайте
    `openclaw onboard --auth-choice pixverse-api-key`, щоб вибрати його в
    майстрі налаштування:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" або "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Власна базова URL-адреса">
    Задавайте `models.providers.pixverse.baseUrl` лише під час маршрутизації через надійний сумісний проксі-сервер.
    `baseUrl` має пріоритет над `region`.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Опитування завдання">
    PixVerse повертає `video_id` у відповідь на запит генерації. OpenClaw опитує
    `/openapi/v2/video/result/{video_id}` кожні 5 секунд, доки завдання не
    завершиться успішно, не завершиться помилкою або не сплине час очікування (за замовчуванням 5 хвилин; змінити можна за допомогою
    `agents.defaults.videoGenerationModel.timeoutMs`).
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента, вибір провайдера та асинхронна поведінка.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Параметри агента за замовчуванням, зокрема модель генерації відео.
  </Card>
</CardGroup>
