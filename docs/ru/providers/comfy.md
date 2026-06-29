---
read_when:
    - Вы хотите использовать локальные рабочие процессы ComfyUI с OpenClaw
    - Вы хотите использовать Comfy Cloud для рабочих процессов с изображениями, видео или музыкой
    - Вам нужны ключи конфигурации встроенного Plugin comfy
summary: Настройка генерации изображений, видео и музыки с помощью рабочих процессов ComfyUI в OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-06-28T23:35:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw поставляется со встроенным Plugin `comfy` для запусков ComfyUI на основе рабочих процессов. Plugin полностью управляется рабочими процессами, поэтому OpenClaw не пытается сопоставлять универсальные элементы управления `size`, `aspectRatio`, `resolution`, `durationSeconds` или элементы управления в стиле TTS с вашим графом.

| Свойство       | Детали                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| Провайдер      | `comfy`                                                                           |
| Модели         | `comfy/workflow`                                                                  |
| Общие поверхности | `image_generate`, `video_generate`, `music_generate`                              |
| Авторизация    | Не требуется для локального ComfyUI; `COMFY_API_KEY` или `COMFY_CLOUD_API_KEY` для Comfy Cloud |
| API            | ComfyUI `/prompt` / `/history` / `/view` и Comfy Cloud `/api/*`                   |

## Что поддерживается

- Генерация изображений из workflow JSON
- Редактирование изображений с 1 загруженным референсным изображением
- Генерация видео из workflow JSON
- Генерация видео с 1 загруженным референсным изображением
- Генерация музыки или аудио через общий инструмент `music_generate`
- Загрузка выходных данных из настроенного узла или всех подходящих выходных узлов

## Начало работы

Выберите между запуском ComfyUI на собственной машине и использованием Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Лучше всего подходит для:** запуска собственного экземпляра ComfyUI на вашей машине или в LAN.

    <Steps>
      <Step title="Start ComfyUI locally">
        Убедитесь, что ваш локальный экземпляр ComfyUI запущен (по умолчанию `http://127.0.0.1:8188`).
      </Step>
      <Step title="Prepare your workflow JSON">
        Экспортируйте или создайте JSON-файл рабочего процесса ComfyUI. Запомните идентификаторы узлов для узла ввода промпта и выходного узла, из которого OpenClaw должен читать данные.
      </Step>
      <Step title="Configure the provider">
        Установите `mode: "local"` и укажите файл рабочего процесса. Минимальный пример для изображения:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Set the default model">
        Направьте OpenClaw на модель `comfy/workflow` для настроенной возможности:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Лучше всего подходит для:** запуска рабочих процессов в Comfy Cloud без управления локальными ресурсами GPU.

    <Steps>
      <Step title="Get an API key">
        Зарегистрируйтесь на [comfy.org](https://comfy.org) и сгенерируйте API-ключ в панели управления своей учетной записи.
      </Step>
      <Step title="Set the API key">
        Передайте ключ одним из этих способов:

        ```bash
        # Environment variable (preferred)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Prepare your workflow JSON">
        Экспортируйте или создайте JSON-файл рабочего процесса ComfyUI. Запомните идентификаторы узлов для узла ввода промпта и выходного узла.
      </Step>
      <Step title="Configure the provider">
        Установите `mode: "cloud"` и укажите файл рабочего процесса:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        В облачном режиме `baseUrl` по умолчанию равен `https://cloud.comfy.org`. Задавать `baseUrl` нужно только при использовании пользовательской облачной конечной точки.
        </Tip>
      </Step>
      <Step title="Set the default model">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Конфигурация

Comfy поддерживает общие настройки подключения верхнего уровня, а также разделы рабочих процессов для каждой возможности (`image`, `video`, `music`):

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
          mode: "local",
          baseUrl: "http://127.0.0.1:8188",
          image: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
          video: {
            workflowPath: "./workflows/video-api.json",
            promptNodeId: "12",
            outputNodeId: "21",
          },
          music: {
            workflowPath: "./workflows/music-api.json",
            promptNodeId: "3",
            outputNodeId: "18",
          },
        },
      },
    },
  },
}
```

### Общие ключи

| Ключ                  | Тип                    | Описание                                                                              |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` или `"cloud"` | Режим подключения.                                                                    |
| `baseUrl`             | строка                 | По умолчанию `http://127.0.0.1:8188` для локального режима или `https://cloud.comfy.org` для облачного. |
| `apiKey`              | строка                 | Необязательный встроенный ключ, альтернатива переменным окружения `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Разрешить частный/LAN `baseUrl` в облачном режиме.                                    |

### Ключи для каждой возможности

Эти ключи применяются внутри разделов `image`, `video` или `music`:

| Ключ                         | Обязателен | По умолчанию | Описание                                                                     |
| ---------------------------- | ---------- | ------------ | ----------------------------------------------------------------------------- |
| `workflow` или `workflowPath` | Да         | --           | Путь к JSON-файлу рабочего процесса ComfyUI.                                  |
| `promptNodeId`               | Да         | --           | Идентификатор узла, который получает текстовый промпт.                        |
| `promptInputName`            | Нет        | `"text"`     | Имя входа на узле промпта.                                                    |
| `outputNodeId`               | Нет        | --           | Идентификатор узла, из которого читаются выходные данные. Если опущен, используются все подходящие выходные узлы. |
| `pollIntervalMs`             | Нет        | --           | Интервал опроса в миллисекундах для завершения задания.                       |
| `timeoutMs`                  | Нет        | --           | Тайм-аут в миллисекундах для запуска рабочего процесса.                       |

Разделы `image` и `video` также поддерживают:

| Ключ                  | Обязателен                                      | По умолчанию | Описание                                                         |
| --------------------- | ----------------------------------------------- | ------------ | ----------------------------------------------------------------- |
| `inputImageNodeId`    | Да (при передаче референсного изображения)      | --           | Идентификатор узла, который получает загруженное референсное изображение. |
| `inputImageInputName` | Нет                                             | `"image"`    | Имя входа на узле изображения.                                   |

## Детали рабочих процессов

<AccordionGroup>
  <Accordion title="Image workflows">
    Установите модель изображения по умолчанию на `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **Пример редактирования с референсным изображением:**

    Чтобы включить редактирование изображения с загруженным референсным изображением, добавьте `inputImageNodeId` в конфигурацию изображения:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              image: {
                workflowPath: "./workflows/edit-api.json",
                promptNodeId: "6",
                inputImageNodeId: "7",
                inputImageInputName: "image",
                outputNodeId: "9",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Video workflows">
    Установите модель видео по умолчанию на `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Видеорабочие процессы Comfy поддерживают text-to-video и image-to-video через настроенный граф.

    <Note>
    OpenClaw не передает входные видео в рабочие процессы Comfy. В качестве входных данных поддерживаются только текстовые промпты и одиночные референсные изображения.
    </Note>

  </Accordion>

  <Accordion title="Music workflows">
    Встроенный Plugin регистрирует провайдера генерации музыки для аудио- или музыкальных выходных данных, определенных рабочим процессом, доступных через общий инструмент `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Используйте раздел конфигурации `music`, чтобы указать JSON-файл аудиорабочего процесса и выходной узел.

  </Accordion>

  <Accordion title="Backward compatibility">
    Существующая конфигурация изображения верхнего уровня (без вложенного раздела `image`) по-прежнему работает:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw рассматривает эту устаревшую форму как конфигурацию рабочего процесса изображения. Немедленно мигрировать не нужно, но вложенные разделы `image` / `video` / `music` рекомендуются для новых настроек.

    <Tip>
    Если вы используете только генерацию изображений, устаревшая плоская конфигурация и новый вложенный раздел `image` функционально эквивалентны.
    </Tip>

  </Accordion>

  <Accordion title="Live tests">
    Для встроенного Plugin доступно подключаемое live-покрытие:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Live-тест пропускает отдельные случаи для изображений, видео или музыки, если соответствующий раздел рабочего процесса Comfy не настроен.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Генерация изображений" href="/ru/tools/image-generation" icon="image">
    Настройка и использование инструмента генерации изображений.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Настройка и использование инструмента генерации видео.
  </Card>
  <Card title="Генерация музыки" href="/ru/tools/music-generation" icon="music">
    Настройка инструмента генерации музыки и аудио.
  </Card>
  <Card title="Каталог провайдеров" href="/ru/providers/index" icon="layers">
    Обзор всех провайдеров и ссылок на модели.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Полный справочник по конфигурации, включая настройки агентов по умолчанию.
  </Card>
</CardGroup>
