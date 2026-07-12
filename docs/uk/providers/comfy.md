---
read_when:
    - Ви хочете використовувати локальні робочі процеси ComfyUI з OpenClaw
    - Ви хочете використовувати Comfy Cloud для робочих процесів із зображеннями, відео або музикою
    - Вам потрібні ключі конфігурації вбудованого Plugin comfy
summary: Налаштування робочого процесу ComfyUI для створення зображень, відео та музики в OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T13:35:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw постачається з вбудованим Plugin `comfy` для запусків ComfyUI на основі робочих процесів. Цей
Plugin повністю керується робочими процесами: OpenClaw не зіставляє загальні параметри `size`,
`aspectRatio`, `resolution`, `durationSeconds` або елементи керування в стилі TTS
із вашим графом.

| Властивість         | Відомості                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Постачальник        | `comfy`                                                                                     |
| Модель              | `comfy/workflow`                                                                            |
| Спільні інструменти | `image_generate`, `video_generate`, `music_generate`                                        |
| Автентифікація      | Не потрібна для локального ComfyUI; `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для Comfy Cloud |
| API                 | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*`                              |

## Що підтримується

- Генерування та редагування зображень із JSON робочого процесу (для редагування потрібне 1 завантажене еталонне зображення)
- Генерування відео з JSON робочого процесу: із тексту або зображення (1 еталонне зображення)
- Генерування музики й аудіо через спільний інструмент `music_generate` із необов’язковим 1 еталонним зображенням
- Завантаження результату з налаштованого вузла або з усіх відповідних вихідних вузлів, якщо жодного не налаштовано

## Початок роботи

Виберіть між запуском ComfyUI на власному комп’ютері та використанням Comfy Cloud.

<Tabs>
  <Tab title="Локально">
    **Найкраще підходить для:** запуску власного екземпляра ComfyUI на вашому комп’ютері або в локальній мережі.

    <Steps>
      <Step title="Запустіть ComfyUI локально">
        Переконайтеся, що локальний екземпляр ComfyUI працює (типова адреса — `http://127.0.0.1:8188`).
      </Step>
      <Step title="Підготуйте JSON робочого процесу">
        Експортуйте або створіть JSON-файл робочого процесу ComfyUI. Занотуйте ідентифікатори вузла введення запиту та вихідного вузла, з якого OpenClaw має зчитувати результат.
      </Step>
      <Step title="Налаштуйте постачальника">
        Установіть `mode: "local"` і вкажіть файл робочого процесу. Мінімальний приклад для зображень:

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
      <Step title="Установіть типову модель">
        Укажіть для OpenClaw модель `comfy/workflow` для налаштованої можливості:

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
    **Найкраще підходить для:** запуску робочих процесів у Comfy Cloud без керування локальними ресурсами GPU.

    <Steps>
      <Step title="Отримайте ключ API">
        Зареєструйтеся на [comfy.org](https://comfy.org) і створіть ключ API на панелі керування свого облікового запису.
      </Step>
      <Step title="Установіть ключ API">
        Надайте ключ одним із наведених способів:

        ```bash
        # Onboarding flag
        openclaw onboard --comfy-api-key "your-key"

        # Environment variable (preferred for daemons)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Підготуйте JSON робочого процесу">
        Експортуйте або створіть JSON-файл робочого процесу ComfyUI. Занотуйте ідентифікатори вузла введення запиту та вихідного вузла.
      </Step>
      <Step title="Налаштуйте постачальника">
        Установіть `mode: "cloud"` і вкажіть файл робочого процесу:

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
        У хмарному режимі типовим значенням `baseUrl` є `https://cloud.comfy.org`. Установлюйте `baseUrl` лише для власної хмарної кінцевої точки.
        </Tip>
      </Step>
      <Step title="Установіть типову модель">
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

Comfy підтримує спільні параметри підключення верхнього рівня та окремі розділи робочих процесів для кожної можливості (`image`, `video`, `music`):

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

### Спільні ключі

| Ключ                  | Тип                         | Опис                                                                                                        |
| --------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `mode`                | `"local"` або `"cloud"`     | Режим підключення. Типове значення — `"local"`.                                                             |
| `baseUrl`             | рядок                       | Типове значення — `http://127.0.0.1:8188` для локального режиму або `https://cloud.comfy.org` для хмарного. |
| `apiKey`              | рядок                       | Необов’язковий вбудований ключ, альтернатива змінним середовища `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`.     |
| `allowPrivateNetwork` | логічне значення            | Дозволяє приватну або локальну `baseUrl` у хмарному режимі чи локальне повне доменне ім’я приватного DNS.    |

<Note>
У режимі `local` літерали loopback- або приватних IP-адрес і однокомпонентні імена служб, як-от `http://comfyui:8188`, працюють без `allowPrivateNetwork`. Схожі на публічні повні доменні імена приватного DNS, як-от `https://comfy.local.example.com`, потребують `allowPrivateNetwork: true`. Довіра до приватного джерела обмежується налаштованою схемою, іменем хоста та портом; локальні переспрямування не можуть залишати налаштоване ім’я хоста, тоді як хмарні переспрямування до публічних CDN перевіряються за типовою політикою SSRF.
</Note>

### Ключі окремих можливостей

Ці ключі застосовуються всередині розділів `image`, `video` або `music`:

| Ключ                         | Обов’язковий | Типове значення | Опис                                                                                               |
| ---------------------------- | ------------ | --------------- | -------------------------------------------------------------------------------------------------- |
| `workflow` або `workflowPath` | Так          | --              | Вбудований JSON робочого процесу або шлях до JSON-файлу робочого процесу ComfyUI.                  |
| `promptNodeId`               | Так          | --              | Ідентифікатор вузла, який отримує текстовий запит.                                                 |
| `promptInputName`            | Ні           | `"text"`        | Назва входу у вузлі запиту.                                                                        |
| `outputNodeId`               | Ні           | --              | Ідентифікатор вузла, з якого зчитується результат. Якщо не вказано, використовуються всі відповідні вихідні вузли. |
| `pollIntervalMs`             | Ні           | `1500`          | Інтервал опитування завершення завдання в мілісекундах.                                            |
| `timeoutMs`                  | Ні           | `300000`        | Час очікування запуску робочого процесу в мілісекундах.                                            |

Розділи `image` і `video` також підтримують вузол введення еталонного зображення:

| Ключ                   | Обов’язковий                                | Типове значення | Опис                                                        |
| ---------------------- | ------------------------------------------- | --------------- | ----------------------------------------------------------- |
| `inputImageNodeId`     | Так (під час передавання еталонного зображення) | --          | Ідентифікатор вузла, який отримує завантажене еталонне зображення. |
| `inputImageInputName`  | Ні                                          | `"image"`       | Назва входу у вузлі зображення.                             |

`apiKey` приймає або буквальний рядок, або об’єкт [посилання на секрет](/uk/gateway/configuration-reference#secrets).

## Відомості про робочі процеси

<AccordionGroup>
  <Accordion title="Робочі процеси зображень">
    Установіть типовою моделлю зображень `comfy/workflow`:

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

    **Приклад редагування з еталонним зображенням:**

    Щоб увімкнути редагування зображення із завантаженим еталонним зображенням, додайте `inputImageNodeId` до конфігурації зображень:

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

  <Accordion title="Робочі процеси відео">
    Установіть типовою моделлю відео `comfy/workflow`:

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

    Робочі процеси відео Comfy підтримують створення відео з тексту та зображення через налаштований граф.

    <Note>
    OpenClaw не передає вхідні відео до робочих процесів Comfy. Як вхідні дані підтримуються лише текстові запити та одиночні еталонні зображення.
    </Note>

  </Accordion>

  <Accordion title="Робочі процеси музики">
    Вбудований Plugin реєструє постачальника генерування музики для визначених робочим процесом аудіо- або музичних результатів, доступного через спільний інструмент `music_generate`. Він приймає необов’язкове еталонне зображення (не більше 1):

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Використовуйте розділ конфігурації `music`, щоб указати JSON аудіоробочого процесу та вихідний вузол.

  </Accordion>

  <Accordion title="Зворотна сумісність">
    Наявна конфігурація зображень верхнього рівня (без вкладеного розділу `image`) усе ще працює:

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

    OpenClaw розглядає цю застарілу структуру як конфігурацію робочого процесу зображень. Вам не потрібно виконувати міграцію негайно, але для нових конфігурацій рекомендовано використовувати вкладені розділи `image` / `video` / `music`. Якщо ви використовуєте лише генерування зображень, застаріла пласка конфігурація та новий вкладений розділ `image` функціонально рівноцінні.

  </Accordion>

  <Accordion title="Тести в реальному середовищі">
    Для вбудованого Plugin доступне необов’язкове тестове покриття в реальному середовищі:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Інтерактивний тест пропускає окремі випадки із зображеннями, відео або музикою, якщо не налаштовано відповідний розділ робочого процесу Comfy.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Генерування зображень" href="/uk/tools/image-generation" icon="image">
    Налаштування та використання засобу генерування зображень.
  </Card>
  <Card title="Генерування відео" href="/uk/tools/video-generation" icon="video">
    Налаштування та використання засобу генерування відео.
  </Card>
  <Card title="Генерування музики" href="/uk/tools/music-generation" icon="music">
    Налаштування засобу генерування музики й аудіо.
  </Card>
  <Card title="Каталог постачальників" href="/uk/providers/index" icon="layers">
    Огляд усіх постачальників і посилань на моделі.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Повний довідник із конфігурації, зокрема типові налаштування агентів.
  </Card>
</CardGroup>
