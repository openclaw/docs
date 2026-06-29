---
read_when:
    - Вы хотите использовать генерацию видео PixVerse в OpenClaw
    - Нужна настройка API-ключа PixVerse и переменных окружения
    - Вы хотите сделать PixVerse видеопровайдером по умолчанию
summary: Настройка генерации видео PixVerse в OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-06-28T23:39:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw предоставляет `pixverse` как официальный внешний Plugin для размещенной генерации видео PixVerse. Plugin регистрирует провайдера `pixverse` в контракте `videoGenerationProviders`.

| Свойство                  | Значение                                                            |
| ------------------------- | ------------------------------------------------------------------- |
| Идентификатор провайдера  | `pixverse`                                                          |
| Пакет Plugin              | `@openclaw/pixverse-provider`                                       |
| Env-переменная авторизации | `PIXVERSE_API_KEY`                                                  |
| Флаг онбординга           | `--auth-choice pixverse-api-key`                                    |
| Прямой флаг CLI           | `--pixverse-api-key <key>`                                          |
| API                       | PixVerse Platform API v2 (отправка `video_id` и опрос результата)   |
| Модель по умолчанию       | `pixverse/v6`                                                       |
| Регион API по умолчанию   | Международный                                                       |

## Начало работы

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

    Мастер спрашивает, использовать ли международную конечную точку
    (`https://app-api.pixverse.ai/openapi/v2`) или конечную точку CN
    (`https://app-api.pixverseai.cn/openapi/v2`), прежде чем записать `region` и
    `baseUrl` в конфигурацию провайдера.

  </Step>
  <Step title="Set PixVerse as the default video provider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Generate a video">
    Попросите агента сгенерировать видео. PixVerse будет использоваться автоматически.
  </Step>
</Steps>

## Поддерживаемые режимы и модели

Провайдер предоставляет модели генерации PixVerse через общий видеоинструмент OpenClaw.

| Режим                    | Модели               | Входные ссылочные данные |
| ------------------------ | -------------------- | ------------------------ |
| Текст в видео            | `v6` (по умолчанию), `c1` | Нет                  |
| Изображение в видео      | `v6` (по умолчанию), `c1` | 1 локальное или удаленное изображение |

Локальные ссылки на изображения загружаются в PixVerse перед запросом преобразования изображения в видео. URL удаленных изображений передаются через конечную точку загрузки изображений PixVerse как `image_url`.

| Параметр             | Поддерживаемые значения                                                     |
| -------------------- | --------------------------------------------------------------------------- |
| Длительность         | 1-15 секунд                                                                 |
| Разрешение           | `360P`, `540P`, `720P`, `1080P`                                             |
| Соотношение сторон   | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` для текста в видео |
| Сгенерированное аудио | `audio: true`                                                              |

<Note>
Генерация шаблонов изображений PixVerse пока не доступна через `image_generate`. Этот API управляется идентификатором шаблона, тогда как общий контракт генерации изображений OpenClaw сейчас не имеет типизированного набора параметров, специфичного для PixVerse.
</Note>

## Параметры провайдера

Видеопровайдер принимает следующие необязательные ключи, специфичные для провайдера:

| Параметр                             | Тип    | Эффект                                  |
| ------------------------------------ | ------ | --------------------------------------- |
| `seed`                               | number | Детерминированное зерно, если поддерживается |
| `negativePrompt` / `negative_prompt` | string | Негативный промпт                       |
| `quality`                            | string | Качество PixVerse, например `720p`      |
| `motionMode` / `motion_mode`         | string | Режим движения для изображения в видео  |
| `cameraMovement` / `camera_movement` | string | Пресет движения камеры PixVerse         |
| `templateId` / `template_id`         | number | Активированный идентификатор шаблона PixVerse |

## Конфигурация

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

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="API region">
    OpenClaw по умолчанию использует международный API PixVerse. Задайте `models.providers.pixverse.region`
    вручную, если ваш ключ относится к определенному региону платформы PixVerse, или используйте
    `openclaw onboard --auth-choice pixverse-api-key`, чтобы выбрать регион в мастере настройки:

    | Значение региона | Базовый URL API PixVerse                    |
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
    Задавайте `models.providers.pixverse.baseUrl` только при маршрутизации через доверенный совместимый прокси.
    `baseUrl` имеет приоритет над `region`.

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
    PixVerse возвращает `video_id` из запроса генерации. OpenClaw опрашивает
    `/openapi/v2/video/result/{video_id}`, пока задача не завершится успешно, не завершится ошибкой
    или не истечет время ожидания.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Video generation" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента, выбор провайдера и асинхронное поведение.
  </Card>
  <Card title="Configuration reference" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Настройки агента по умолчанию, включая модель генерации видео.
  </Card>
</CardGroup>
