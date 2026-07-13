---
read_when:
    - Вы хотите использовать генерацию видео PixVerse в OpenClaw
    - Вам нужно настроить API-ключ PixVerse и переменную окружения
    - Вы хотите сделать PixVerse поставщиком видео по умолчанию
summary: Настройка генерации видео PixVerse в OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-13T18:30:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw предоставляет `pixverse` как официальный внешний плагин для генерации видео PixVerse в облаке. Плагин регистрирует провайдера `pixverse` в соответствии с контрактом `videoGenerationProviders`.

| Свойство             | Значение                                                                |
| -------------------- | ----------------------------------------------------------------------- |
| Идентификатор провайдера | `pixverse`                                                   |
| Пакет плагина        | `@openclaw/pixverse-provider`                                                       |
| Переменная окружения для аутентификации | `PIXVERSE_API_KEY`                                    |
| Флаг первоначальной настройки | `--auth-choice pixverse-api-key`                                             |
| Прямой флаг CLI      | `--pixverse-api-key <key>`                                                       |
| API                  | PixVerse Platform API v2 (отправка через `video_id` с последующим опросом результата) |
| Модель по умолчанию  | `pixverse/v6`                                                       |
| Регион API по умолчанию | Международный                                                        |

## Начало работы

<Steps>
  <Step title="Установите плагин">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Задайте ключ API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    Перед записью `region` и `baseUrl` в конфигурацию провайдера
    мастер предлагает выбрать международную или китайскую конечную точку (см. раздел
    «Регион API» ниже). При неинтерактивном запуске (ключ из `--pixverse-api-key`
    или `PIXVERSE_API_KEY`) по умолчанию используется международная конечная точка.

    Первоначальная настройка также задаёт `agents.defaults.videoGenerationModel.primary` значение
    `pixverse/v6`, если модель генерации видео по умолчанию ещё не настроена.

  </Step>
  <Step title="Смените существующего провайдера генерации видео по умолчанию (необязательно)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Создайте видео">
    Попросите агента создать видео. PixVerse будет использован автоматически.
  </Step>
</Steps>

## Поддерживаемые режимы и модели

Провайдер предоставляет модели генерации PixVerse через общий видеоинструмент OpenClaw.

| Режим                 | Модели                                      | Входные референсы                  |
| --------------------- | ------------------------------------------- | ---------------------------------- |
| Текст в видео         | `v6` (по умолчанию), `c1` | Нет                     |
| Изображение в видео   | `v6` (по умолчанию), `c1` | 1 локальное или удалённое изображение |

Перед запросом преобразования изображения в видео локальные изображения загружаются в PixVerse. URL удалённых изображений передаются конечной точке загрузки изображений PixVerse как `image_url`.

| Параметр               | Поддерживаемые значения                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Длительность           | 1–15 секунд (по умолчанию 5)                                                                                                    |
| Разрешение             | `360P`, `540P`, `720P`, `1080P` (по умолчанию `540P`; запросы `480P` преобразуются в `540P`) |
| Соотношение сторон     | `16:9` (по умолчанию), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; только для преобразования текста в видео, при преобразовании изображения в видео используется соотношение сторон исходного изображения |
| Генерируемый звук      | `audio: true`                                                                                                               |

<Note>
Генерация по шаблонам изображений PixVerse пока не предоставляется через `image_generate`. Этот API управляется идентификаторами шаблонов, тогда как общий контракт генерации изображений OpenClaw в настоящее время не содержит типизированного набора параметров, специфичного для PixVerse.
</Note>

## Параметры провайдера

Видеопровайдер принимает следующие необязательные ключи, специфичные для провайдера:

| Параметр                             | Тип    | Назначение                                      |
| ------------------------------------ | ------ | ----------------------------------------------- |
| `seed`                   | number | Детерминированное начальное значение от 0 до 2147483647 |
| `negativePrompt` / `negative_prompt` | string | Негативный промпт                          |
| `quality`                   | string | Качество PixVerse, например `720p`  |
| `motionMode` / `motion_mode` | string | Режим движения для преобразования изображения в видео (по умолчанию `normal`) |
| `cameraMovement` / `camera_movement` | string | Предустановка движения камеры PixVerse     |
| `templateId` / `template_id` | number | Идентификатор активированного шаблона PixVerse |

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
    | Значение региона        | Базовый URL API PixVerse                       |
    | ----------------------- | ---------------------------------------------- |
    | `international`      | `https://app-api.pixverse.ai/openapi/v2`                             |
    | `cn`      | `https://app-api.pixverseai.cn/openapi/v2`                             |

    Задайте `models.providers.pixverse.region` вручную, если ваш ключ относится к
    определённому региону платформы PixVerse, либо выполните
    `openclaw onboard --auth-choice pixverse-api-key`, чтобы выбрать регион в
    мастере настройки:

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
    `/openapi/v2/video/result/{video_id}` каждые 5 секунд, пока задача
    не завершится успешно, не завершится с ошибкой или не истечёт время ожидания (по умолчанию 5 минут; можно переопределить с помощью
    `agents.defaults.videoGenerationModel.timeoutMs`).
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента, выбор провайдера и асинхронное поведение.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Настройки агента по умолчанию, включая модель генерации видео.
  </Card>
</CardGroup>
