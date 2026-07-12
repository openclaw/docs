---
read_when:
    - Вы хотите использовать генерацию видео PixVerse в OpenClaw
    - Вам необходимо настроить ключ API PixVerse и переменные окружения
    - Вы хотите сделать PixVerse видеопровайдером по умолчанию
summary: Настройка генерации видео PixVerse в OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T11:47:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw предоставляет `pixverse` как официальный внешний plugin для размещённой генерации видео PixVerse. Plugin регистрирует провайдер `pixverse` в соответствии с контрактом `videoGenerationProviders`.

| Свойство               | Значение                                                                    |
| ---------------------- | --------------------------------------------------------------------------- |
| Идентификатор провайдера | `pixverse`                                                                  |
| Пакет plugin           | `@openclaw/pixverse-provider`                                               |
| Переменная среды аутентификации | `PIXVERSE_API_KEY`                                                  |
| Флаг первоначальной настройки | `--auth-choice pixverse-api-key`                                      |
| Прямой флаг CLI        | `--pixverse-api-key <key>`                                                  |
| API                    | PixVerse Platform API v2 (отправка `video_id` и опрос результата)           |
| Модель по умолчанию    | `pixverse/v6`                                                               |
| Регион API по умолчанию | Международный                                                              |

## Начало работы

<Steps>
  <Step title="Установите plugin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Задайте ключ API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    Перед записью `region` и `baseUrl` в конфигурацию провайдера мастер предлагает
    выбрать международную или китайскую конечную точку (см. раздел о регионе API
    ниже). При неинтерактивном запуске (ключ передаётся через `--pixverse-api-key`
    или `PIXVERSE_API_KEY`) по умолчанию выбирается международный регион.

    Первоначальная настройка также задаёт для
    `agents.defaults.videoGenerationModel.primary` значение `pixverse/v6`, если
    модель генерации видео по умолчанию ещё не настроена.

  </Step>
  <Step title="Смените существующий провайдер видео по умолчанию (необязательно)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Создайте видео">
    Попросите агента создать видео. PixVerse будет использован автоматически.
  </Step>
</Steps>

## Поддерживаемые режимы и модели

Провайдер предоставляет модели генерации PixVerse через общий инструмент OpenClaw для работы с видео.

| Режим              | Модели               | Входной референс                    |
| ------------------ | -------------------- | ----------------------------------- |
| Текст в видео      | `v6` (по умолчанию), `c1` | Нет                             |
| Изображение в видео | `v6` (по умолчанию), `c1` | 1 локальное или удалённое изображение |

Локальные изображения перед запросом на создание видео из изображения загружаются в PixVerse. URL удалённых изображений передаются в конечную точку загрузки изображений PixVerse как `image_url`.

| Параметр           | Поддерживаемые значения                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Длительность       | 1–15 секунд (по умолчанию 5)                                                                                                                       |
| Разрешение         | `360P`, `540P`, `720P`, `1080P` (по умолчанию `540P`; запросы `480P` преобразуются в `540P`)                                                       |
| Соотношение сторон | `16:9` (по умолчанию), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; только для преобразования текста в видео, при создании видео из изображения используется соотношение сторон исходного изображения |
| Создаваемое аудио  | `audio: true`                                                                                                                                      |

<Note>
Создание изображений по шаблонам PixVerse пока недоступно через `image_generate`. Этот API работает на основе идентификаторов шаблонов, а общий контракт OpenClaw для генерации изображений сейчас не содержит типизированного набора параметров, специфичного для PixVerse.
</Note>

## Параметры провайдера

Провайдер видео принимает следующие необязательные ключи, специфичные для провайдера:

| Параметр                             | Тип    | Действие                                                   |
| ------------------------------------ | ------ | ---------------------------------------------------------- |
| `seed`                               | число  | Детерминированное начальное значение от 0 до 2147483647    |
| `negativePrompt` / `negative_prompt` | строка | Негативный промпт                                          |
| `quality`                            | строка | Качество PixVerse, например `720p`                          |
| `motionMode` / `motion_mode`         | строка | Режим движения при создании видео из изображения (по умолчанию `normal`) |
| `cameraMovement` / `camera_movement` | строка | Предустановка движения камеры PixVerse                     |
| `templateId` / `template_id`         | число  | Идентификатор активированного шаблона PixVerse             |

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
  <Accordion title="Регион API">
    | Значение региона | Базовый URL API PixVerse                       |
    | ---------------- | ---------------------------------------------- |
    | `international`  | `https://app-api.pixverse.ai/openapi/v2`       |
    | `cn`             | `https://app-api.pixverseai.cn/openapi/v2`     |

    Задайте `models.providers.pixverse.region` вручную, если ваш ключ относится
    к определённому региону платформы PixVerse, или запустите
    `openclaw onboard --auth-choice pixverse-api-key`, чтобы выбрать регион в
    мастере настройки:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" или "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Пользовательский базовый URL">
    Задавайте `models.providers.pixverse.baseUrl` только при маршрутизации через доверенный совместимый прокси-сервер.
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

  <Accordion title="Опрос состояния задачи">
    PixVerse возвращает `video_id` в ответ на запрос генерации. OpenClaw опрашивает
    `/openapi/v2/video/result/{video_id}` каждые 5 секунд, пока задача не будет
    успешно завершена, не завершится с ошибкой или не истечёт время ожидания
    (по умолчанию 5 минут; его можно изменить с помощью
    `agents.defaults.videoGenerationModel.timeoutMs`).
  </Accordion>
</AccordionGroup>

## См. также

<CardGroup cols={2}>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента, выбор провайдера и асинхронное поведение.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Настройки агента по умолчанию, включая модель генерации видео.
  </Card>
</CardGroup>
