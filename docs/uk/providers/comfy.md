---
read_when:
    - Ви хочете використовувати локальні workflow ComfyUI з OpenClaw
    - Ви хочете використовувати Comfy Cloud з workflow для зображень, відео або музики
    - Вам потрібні ключі конфігурації вбудованого Plugin ComfyUI
summary: Налаштування генерування зображень, відео та музики через workflow ComfyUI в OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-23T21:05:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: d254334c4430bd01ef51fa231ccfbbb4ca18108806b9155c3f0a5d35d4422fd7
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw постачається з вбудованим Plugin `comfy` для запусків ComfyUI, керованих workflow. Plugin повністю керується workflow, тому OpenClaw не намагається відображати загальні `size`, `aspectRatio`, `resolution`, `durationSeconds` або елементи керування в стилі TTS на ваш graph.

| Властивість     | Деталі                                                                            |
| --------------- | --------------------------------------------------------------------------------- |
| Provider        | `comfy`                                                                           |
| Моделі          | `comfy/workflow`                                                                  |
| Спільні поверхні | `image_generate`, `video_generate`, `music_generate`                             |
| Auth            | Немає для локального ComfyUI; `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для Comfy Cloud |
| API             | ComfyUI `/prompt` / `/history` / `/view` і Comfy Cloud `/api/*`                  |

## Що підтримується

- Генерування зображень із workflow JSON
- Редагування зображень з 1 завантаженим reference image
- Генерування відео з workflow JSON
- Генерування відео з 1 завантаженим reference image
- Генерування музики або аудіо через спільний інструмент `music_generate`
- Завантаження вихідних даних із налаштованого node або з усіх відповідних output node

## Початок роботи

Виберіть між запуском ComfyUI на власній машині або використанням Comfy Cloud.

<Tabs>
  <Tab title="Локально">
    **Найкраще для:** запуску власного екземпляра ComfyUI на вашій машині або в LAN.

    <Steps>
      <Step title="Запустіть ComfyUI локально">
        Переконайтеся, що ваш локальний екземпляр ComfyUI запущений (типово `http://127.0.0.1:8188`).
      </Step>
      <Step title="Підготуйте ваш workflow JSON">
        Експортуйте або створіть файл workflow JSON для ComfyUI. Зверніть увагу на ID node для node введення prompt і output node, з якого OpenClaw має читати результат.
      </Step>
      <Step title="Налаштуйте provider">
        Установіть `mode: "local"` і вкажіть шлях до вашого workflow file. Ось мінімальний приклад для зображень:

        ```json5
        {
          models: {
            providers: {
              comfy: {
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
        }
        ```
      </Step>
      <Step title="Задайте типову модель">
        Спрямуйте OpenClaw на модель `comfy/workflow` для налаштованої можливості:

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
      <Step title="Перевірте">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Найкраще для:** запуску workflow в Comfy Cloud без керування локальними GPU-ресурсами.

    <Steps>
      <Step title="Отримайте ключ API">
        Зареєструйтеся на [comfy.org](https://comfy.org) і згенеруйте ключ API на панелі керування обліковим записом.
      </Step>
      <Step title="Задайте ключ API">
        Передайте ключ одним із цих способів:

        ```bash
        # Змінна середовища (рекомендовано)
        export COMFY_API_KEY="your-key"

        # Альтернативна змінна середовища
        export COMFY_CLOUD_API_KEY="your-key"

        # Або безпосередньо в конфігурації
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="Підготуйте ваш workflow JSON">
        Експортуйте або створіть файл workflow JSON для ComfyUI. Зверніть увагу на ID node для node введення prompt і output node.
      </Step>
      <Step title="Налаштуйте provider">
        Установіть `mode: "cloud"` і вкажіть шлях до вашого workflow file:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        У режимі cloud `baseUrl` типово має значення `https://cloud.comfy.org`. Задавати `baseUrl` потрібно лише тоді, коли ви використовуєте custom cloud endpoint.
        </Tip>
      </Step>
      <Step title="Задайте типову модель">
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
      <Step title="Перевірте">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Конфігурація

Comfy підтримує спільні top-level налаштування з’єднання та розділи workflow для кожної можливості (`image`, `video`, `music`):

```json5
{
  models: {
    providers: {
      comfy: {
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
}
```

### Спільні ключі

| Ключ                  | Тип                    | Опис                                                                                     |
| --------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| `mode`                | `"local"` або `"cloud"` | Режим з’єднання.                                                                         |
| `baseUrl`             | string                 | Типово `http://127.0.0.1:8188` для local або `https://cloud.comfy.org` для cloud.       |
| `apiKey`              | string                 | Необов’язковий inline key, альтернатива env vars `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Дозволити приватний/LAN `baseUrl` у режимі cloud.                                        |

### Ключі для кожної можливості

Ці ключі застосовуються всередині розділів `image`, `video` або `music`:

| Ключ                         | Обов’язковий | Типове значення | Опис                                                                          |
| ---------------------------- | ------------ | --------------- | ----------------------------------------------------------------------------- |
| `workflow` або `workflowPath` | Так         | --              | Шлях до workflow JSON file ComfyUI.                                           |
| `promptNodeId`               | Так          | --              | ID node, який отримує текстовий prompt.                                       |
| `promptInputName`            | Ні           | `"text"`        | Ім’я входу на prompt node.                                                    |
| `outputNodeId`               | Ні           | --              | ID node, з якого читати результат. Якщо не задано, використовуються всі відповідні output node. |
| `pollIntervalMs`             | Ні           | --              | Інтервал опитування в мілісекундах для завершення завдання.                   |
| `timeoutMs`                  | Ні           | --              | Timeout у мілісекундах для запуску workflow.                                  |

Розділи `image` і `video` також підтримують:

| Ключ                  | Обов’язковий                          | Типове значення | Опис                                                   |
| --------------------- | ------------------------------------ | --------------- | ------------------------------------------------------ |
| `inputImageNodeId`    | Так (коли передається reference image) | --            | ID node, який отримує завантажене reference image.     |
| `inputImageInputName` | Ні                                   | `"image"`       | Ім’я входу на image node.                              |

## Деталі workflow

<AccordionGroup>
  <Accordion title="Workflow зображень">
    Установіть типову модель зображень у `comfy/workflow`:

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

    **Приклад редагування з reference image:**

    Щоб увімкнути редагування зображення із завантаженим reference image, додайте `inputImageNodeId` до вашої конфігурації image:

    ```json5
    {
      models: {
        providers: {
          comfy: {
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
    }
    ```

  </Accordion>

  <Accordion title="Workflow відео">
    Установіть типову модель відео в `comfy/workflow`:

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

    Workflow відео Comfy підтримують text-to-video й image-to-video через налаштований graph.

    <Note>
    OpenClaw не передає вхідні відео у workflow Comfy. Як вхідні дані підтримуються лише текстові prompts і одиночні reference images.
    </Note>

  </Accordion>

  <Accordion title="Workflow музики">
    Вбудований Plugin реєструє provider для генерування музики через визначені workflow виходи аудіо або музики, які доступні через спільний інструмент `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Використовуйте розділ конфігурації `music`, щоб указати workflow JSON для аудіо та output node.

  </Accordion>

  <Accordion title="Зворотна сумісність">
    Наявна top-level конфігурація image (без вкладеного розділу `image`) усе ще працює:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
        },
      },
    }
    ```

    OpenClaw трактує цю legacy shape як конфігурацію workflow image. Негайна міграція не потрібна, але для нових налаштувань рекомендовано вкладені розділи `image` / `video` / `music`.

    <Tip>
    Якщо ви використовуєте лише генерування зображень, legacy flat config і новий вкладений розділ `image` функціонально еквівалентні.
    </Tip>

  </Accordion>

  <Accordion title="Live tests">
    Для вбудованого Plugin існує live-покриття з явним увімкненням:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Live-тест пропускає окремі сценарії image, video або music, якщо не налаштовано відповідний розділ workflow Comfy.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Image Generation" href="/uk/tools/image-generation" icon="image">
    Налаштування та використання інструмента генерування зображень.
  </Card>
  <Card title="Video Generation" href="/uk/tools/video-generation" icon="video">
    Налаштування та використання інструмента генерування відео.
  </Card>
  <Card title="Music Generation" href="/uk/tools/music-generation" icon="music">
    Налаштування інструмента генерування музики й аудіо.
  </Card>
  <Card title="Provider Directory" href="/uk/providers/index" icon="layers">
    Огляд усіх provider-ів і refs моделей.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference#agent-defaults" icon="gear">
    Повна довідка з конфігурації, включно з типовими значеннями агентів.
  </Card>
</CardGroup>
