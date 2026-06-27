---
read_when:
    - Ви хочете використовувати генерацію відео PixVerse в OpenClaw
    - Потрібно налаштувати ключ API та змінні середовища PixVerse
    - Ви хочете зробити PixVerse типовим постачальником відео
summary: Налаштування генерації відео PixVerse в OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-06-27T18:13:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw надає `pixverse` як офіційний зовнішній Plugin для розміщеної генерації відео PixVerse. Plugin реєструє провайдера `pixverse` відповідно до контракту `videoGenerationProviders`.

| Властивість                 | Значення                                                             |
| --------------------------- | -------------------------------------------------------------------- |
| Ідентифікатор провайдера    | `pixverse`                                                           |
| Пакет Plugin                | `@openclaw/pixverse-provider`                                        |
| Змінна середовища автентифікації | `PIXVERSE_API_KEY`                                                   |
| Прапорець онбордингу        | `--auth-choice pixverse-api-key`                                     |
| Прямий прапорець CLI        | `--pixverse-api-key <key>`                                           |
| API                         | PixVerse Platform API v2 (надсилання `video_id` і опитування результату) |
| Модель за замовчуванням     | `pixverse/v6`                                                        |
| Регіон API за замовчуванням | International                                                        |

## Початок роботи

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    Майстер запитує, чи використовувати міжнародну кінцеву точку
    (`https://app-api.pixverse.ai/openapi/v2`) або кінцеву точку CN
    (`https://app-api.pixverseai.cn/openapi/v2`) перед записом `region` і
    `baseUrl` у конфігурацію провайдера.

  </Step>
  <Step title="Set PixVerse as the default video provider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Generate a video">
    Попросіть агента згенерувати відео. PixVerse буде використано автоматично.
  </Step>
</Steps>

## Підтримувані режими та моделі

Провайдер надає моделі генерації PixVerse через спільний відеоінструмент OpenClaw.

| Режим          | Моделі               | Вхідні дані посилання |
| -------------- | -------------------- | --------------------- |
| Текст у відео  | `v6` (за замовчуванням), `c1` | Немає                 |
| Зображення у відео | `v6` (за замовчуванням), `c1` | 1 локальне або віддалене зображення |

Локальні посилання на зображення завантажуються в PixVerse перед запитом зображення у відео. URL-адреси віддалених зображень передаються через кінцеву точку завантаження зображень PixVerse як `image_url`.

| Параметр          | Підтримувані значення                                                       |
| ----------------- | --------------------------------------------------------------------------- |
| Тривалість        | 1-15 секунд                                                                 |
| Роздільна здатність | `360P`, `540P`, `720P`, `1080P`                                             |
| Співвідношення сторін | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` для тексту у відео |
| Згенероване аудіо | `audio: true`                                                               |

<Note>
Генерація шаблонів зображень PixVerse ще не доступна через `image_generate`. Цей API керується ідентифікатором шаблону, тоді як спільний контракт генерації зображень OpenClaw наразі не має типізованого набору параметрів, специфічного для PixVerse.
</Note>

## Параметри провайдера

Відеопровайдер приймає такі необов’язкові ключі, специфічні для провайдера:

| Параметр                             | Тип    | Ефект                             |
| ------------------------------------ | ------ | --------------------------------- |
| `seed`                               | number | Детермінований seed, якщо підтримується |
| `negativePrompt` / `negative_prompt` | string | Негативний prompt                 |
| `quality`                            | string | Якість PixVerse, наприклад `720p` |
| `motionMode` / `motion_mode`         | string | Режим руху для зображення у відео |
| `cameraMovement` / `camera_movement` | string | Пресет руху камери PixVerse       |
| `templateId` / `template_id`         | number | Активований ідентифікатор шаблону PixVerse |

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
  <Accordion title="API region">
    OpenClaw за замовчуванням використовує міжнародний PixVerse API. Установіть `models.providers.pixverse.region`
    вручну, коли ваш ключ належить до конкретного регіону платформи PixVerse, або використайте
    `openclaw onboard --auth-choice pixverse-api-key`, щоб вибрати його в майстрі налаштування:

    | Значення регіону | Базова URL-адреса PixVerse API              |
    | ---------------- | ------------------------------------------- |
    | `international`  | `https://app-api.pixverse.ai/openapi/v2`    |
    | `cn`             | `https://app-api.pixverseai.cn/openapi/v2`  |

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Custom base URL">
    Установлюйте `models.providers.pixverse.baseUrl` лише під час маршрутизації через довірений сумісний проксі.
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

  <Accordion title="Task polling">
    PixVerse повертає `video_id` із запиту генерації. OpenClaw опитує
    `/openapi/v2/video/result/{video_id}`, доки завдання не завершиться успішно, не завершиться з помилкою
    або не перевищить час очікування.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Video generation" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента, вибір провайдера та асинхронна поведінка.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Стандартні налаштування агента, зокрема модель генерації відео.
  </Card>
</CardGroup>
