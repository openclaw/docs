---
read_when:
    - Вы хотите использовать генерацию видео Alibaba Wan в OpenClaw
    - Для генерации видео необходимо настроить ключ API Model Studio или DashScope
summary: Генерация видео Alibaba Model Studio Wan в OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-13T18:28:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

Встроенный плагин `alibaba` регистрирует провайдера генерации видео для моделей Wan в Alibaba Model Studio (международное название DashScope). Он включён по умолчанию; требуется только ключ API.

| Свойство                  | Значение                                                                        |
| ------------------------- | ------------------------------------------------------------------------------- |
| Идентификатор провайдера  | `alibaba`                                                              |
| Плагин                    | встроенный, `enabledByDefault: true`                                                  |
| Переменные среды для аутентификации | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (используется первое совпадение) |
| Флаг первоначальной настройки | `--auth-choice alibaba-model-studio-api-key`                                                          |
| Прямой флаг CLI           | `--alibaba-model-studio-api-key <key>`                                                              |
| Модель по умолчанию       | `alibaba/wan2.6-t2v`                                                              |
| Базовый URL по умолчанию  | `https://dashscope-intl.aliyuncs.com`                                                              |

## Начало работы

<Steps>
  <Step title="Задайте ключ API">
    Сохраните ключ для провайдера `alibaba` в процессе первоначальной настройки:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Или передайте ключ напрямую:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Либо экспортируйте одну из поддерживаемых переменных среды перед запуском Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # или DASHSCOPE_API_KEY=...
    # или QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Задайте модель видео по умолчанию">
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
  <Step title="Убедитесь, что провайдер настроен">
    ```bash
    openclaw models list --provider alibaba
    ```

    Список включает все пять встроенных моделей Wan. Если не удаётся разрешить `MODELSTUDIO_API_KEY`, `openclaw models status --json` сообщает об отсутствующих учётных данных в разделе `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Плагин Alibaba и [плагин Qwen](/ru/providers/qwen) выполняют аутентификацию через DashScope и принимают частично совпадающие переменные среды. Используйте идентификаторы моделей `alibaba/...` для специализированного интерфейса генерации видео Wan; идентификаторы `qwen/...` — для чата Qwen, векторных представлений и анализа медиаданных.
</Note>

## Встроенные модели Wan

| Ссылка на модель           | Режим                         |
| -------------------------- | ----------------------------- |
| `alibaba/wan2.6-t2v`         | Текст в видео (по умолчанию)  |
| `alibaba/wan2.6-i2v`         | Изображение в видео           |
| `alibaba/wan2.6-r2v`         | Референс в видео              |
| `alibaba/wan2.6-r2v-flash`         | Референс в видео (быстро)     |
| `alibaba/wan2.7-r2v`         | Референс в видео              |

## Возможности и ограничения

Для всех трёх режимов действуют одинаковые ограничения на количество и длительность видео в одном запросе; различается только формат входных данных.

| Режим              | Макс. выходных видео | Макс. входных изображений | Макс. входных видео | Макс. длительность | Поддерживаемые параметры управления                         |
| ------------------ | -------------------- | ------------------------- | ------------------ | ------------------ | ----------------------------------------------------------- |
| Текст в видео      | 1                    | неприменимо                | неприменимо        | 10 с               | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Изображение в видео | 1                   | 1                         | неприменимо        | 10 с               | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Референс в видео   | 1                    | неприменимо                | 4                  | 10 с               | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Если в запросе не указан `durationSeconds`, используется принимаемое DashScope значение по умолчанию — **5 секунд**. Явно задайте `durationSeconds` в [инструменте генерации видео](/ru/tools/video-generation), чтобы увеличить длительность до 10 с.

<Warning>
  Входные референсные изображения и видео должны быть доступны по удалённым URL-адресам `http(s)`; режимы работы с референсами в DashScope отклоняют локальные пути к файлам. Сначала загрузите файлы в объектное хранилище или используйте процесс [инструмента для работы с медиаданными](/ru/tools/media-overview), который уже создаёт общедоступный URL.
</Warning>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Переопределение базового URL DashScope">
    По умолчанию провайдер использует международную конечную точку DashScope. Чтобы использовать конечную точку региона Китая:

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

    Провайдер удаляет завершающие косые черты перед формированием URL-адресов задач AIGC.

  </Accordion>

  <Accordion title="Приоритет переменных среды для аутентификации">
    OpenClaw получает ключ API Alibaba из переменных среды в следующем порядке, выбирая первое непустое значение:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Настроенные записи `auth.profiles` (заданные через `openclaw models auth login`) имеют приоритет над разрешением переменных среды. Сведения о ротации профилей, периоде ожидания и механизме переопределения см. в разделе [«Профили аутентификации» в FAQ по моделям](/ru/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them).

  </Accordion>

  <Accordion title="Связь с плагином Qwen">
    Оба встроенных плагина взаимодействуют с DashScope и принимают частично совпадающие ключи API. Используйте:

    - `alibaba/wan*.*` — идентификаторы специализированного провайдера видео Wan, описанного на этой странице.
    - `qwen/*` — идентификаторы чата Qwen, векторных представлений и анализа медиаданных (см. [Qwen](/ru/providers/qwen)).

    Однократная настройка `MODELSTUDIO_API_KEY` обеспечивает аутентификацию для обоих плагинов, поскольку списки переменных среды для аутентификации намеренно пересекаются; выполнять первоначальную настройку каждого плагина отдельно не требуется.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента для работы с видео и выбор провайдера.
  </Card>
  <Card title="Qwen" href="/ru/providers/qwen" icon="microchip">
    Настройка чата Qwen, векторных представлений и анализа медиаданных с использованием той же аутентификации DashScope.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Значения агентов по умолчанию и конфигурация моделей.
  </Card>
  <Card title="FAQ по моделям" href="/ru/help/faq-models" icon="circle-question">
    Профили аутентификации, переключение моделей и устранение ошибок «нет профиля».
  </Card>
</CardGroup>
