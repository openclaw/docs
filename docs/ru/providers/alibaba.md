---
read_when:
    - Вы хотите использовать генерацию видео Alibaba Wan в OpenClaw
    - Для генерации видео необходимо настроить API-ключ Model Studio или DashScope
summary: Генерация видео с помощью Alibaba Model Studio Wan в OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T11:45:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

Встроенный Plugin `alibaba` регистрирует провайдера генерации видео для моделей Wan в Alibaba Model Studio (международное название DashScope). Он включён по умолчанию; требуется только ключ API.

| Свойство                    | Значение                                                                        |
| --------------------------- | ------------------------------------------------------------------------------- |
| Идентификатор провайдера    | `alibaba`                                                                       |
| Plugin                      | встроенный, `enabledByDefault: true`                                             |
| Переменные окружения аутентификации | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (используется первое совпадение) |
| Флаг первоначальной настройки | `--auth-choice alibaba-model-studio-api-key`                                   |
| Прямой флаг CLI             | `--alibaba-model-studio-api-key <key>`                                           |
| Модель по умолчанию         | `alibaba/wan2.6-t2v`                                                             |
| Базовый URL по умолчанию    | `https://dashscope-intl.aliyuncs.com`                                            |

## Начало работы

<Steps>
  <Step title="Задайте ключ API">
    Сохраните ключ для провайдера `alibaba` при первоначальной настройке:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Или передайте ключ напрямую:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Либо экспортируйте одну из поддерживаемых переменных окружения перед запуском Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # или DASHSCOPE_API_KEY=...
    # или QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Задайте модель генерации видео по умолчанию">
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
  <Step title="Проверьте настройку провайдера">
    ```bash
    openclaw models list --provider alibaba
    ```

    Список включает все пять встроенных моделей Wan. Если значение `MODELSTUDIO_API_KEY` определить не удаётся, команда `openclaw models status --json` сообщает об отсутствующих учётных данных в `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Plugin Alibaba и [Plugin Qwen](/ru/providers/qwen) используют аутентификацию через DashScope и принимают частично совпадающие переменные окружения. Используйте идентификаторы моделей `alibaba/...` для специализированного интерфейса генерации видео Wan, а идентификаторы `qwen/...` — для чата Qwen, создания эмбеддингов или анализа медиаматериалов.
</Note>

## Встроенные модели Wan

| Ссылка на модель            | Режим                              |
| --------------------------- | ---------------------------------- |
| `alibaba/wan2.6-t2v`        | Текст в видео (по умолчанию)       |
| `alibaba/wan2.6-i2v`        | Изображение в видео                |
| `alibaba/wan2.6-r2v`        | Референс в видео                   |
| `alibaba/wan2.6-r2v-flash`  | Референс в видео (быстрый режим)   |
| `alibaba/wan2.7-r2v`        | Референс в видео                   |

## Возможности и ограничения

Во всех трёх режимах действуют одинаковые ограничения на количество и длительность видео в одном запросе; различается только формат входных данных.

| Режим              | Макс. выходных видео | Макс. входных изображений | Макс. входных видео | Макс. длительность | Поддерживаемые параметры                                    |
| ------------------ | -------------------- | ------------------------- | ------------------ | ------------------ | ----------------------------------------------------------- |
| Текст в видео      | 1                    | неприменимо                | неприменимо        | 10 с               | `size`, `aspectRatio`, `resolution`, `audio`, `watermark`   |
| Изображение в видео | 1                   | 1                         | неприменимо        | 10 с               | `size`, `aspectRatio`, `resolution`, `audio`, `watermark`   |
| Референс в видео   | 1                    | неприменимо                | 4                  | 10 с               | `size`, `aspectRatio`, `resolution`, `audio`, `watermark`   |

Если в запросе отсутствует `durationSeconds`, используется допустимое в DashScope значение по умолчанию — **5 секунд**. Чтобы увеличить длительность до 10 с, явно задайте `durationSeconds` в [инструменте генерации видео](/ru/tools/video-generation).

<Warning>
  Входные референсные изображения и видео должны быть доступны по удалённым URL-адресам `http(s)`; референсные режимы DashScope отклоняют пути к локальным файлам. Сначала загрузите файлы в объектное хранилище или воспользуйтесь сценарием [инструмента работы с медиа](/ru/tools/media-overview), который уже создаёт общедоступный URL.
</Warning>

## Расширенная настройка

<AccordionGroup>
  <Accordion title="Переопределите базовый URL DashScope">
    По умолчанию провайдер использует международную конечную точку DashScope. Чтобы использовать конечную точку китайского региона:

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

    Перед формированием URL задач AIGC провайдер удаляет завершающие косые черты.

  </Accordion>

  <Accordion title="Приоритет переменных окружения аутентификации">
    OpenClaw определяет ключ API Alibaba из переменных окружения в следующем порядке, используя первое непустое значение:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Настроенные записи `auth.profiles` (заданные с помощью `openclaw models auth login`) имеют приоритет над определением значения из переменных окружения. Сведения о ротации профилей, периоде ожидания и механизме переопределения см. в разделе [«Профили аутентификации» в ответах на вопросы о моделях](/ru/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them).

  </Accordion>

  <Accordion title="Связь с Plugin Qwen">
    Оба встроенных Plugin взаимодействуют с DashScope и принимают частично совпадающие ключи API. Используйте:

    - идентификаторы `alibaba/wan*.*` для специализированного провайдера видео Wan, описанного на этой странице;
    - идентификаторы `qwen/*` для чата Qwen, создания эмбеддингов и анализа медиаматериалов (см. [Qwen](/ru/providers/qwen)).

    Однократная настройка `MODELSTUDIO_API_KEY` обеспечивает аутентификацию обоих Plugin, поскольку списки переменных окружения аутентификации намеренно пересекаются; выполнять первоначальную настройку каждого Plugin отдельно не требуется.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента генерации видео и выбор провайдера.
  </Card>
  <Card title="Qwen" href="/ru/providers/qwen" icon="microchip">
    Настройка чата Qwen, создания эмбеддингов и анализа медиаматериалов с той же аутентификацией DashScope.
  </Card>
  <Card title="Справочник по настройке" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Настройки агентов по умолчанию и конфигурация моделей.
  </Card>
  <Card title="Ответы на вопросы о моделях" href="/ru/help/faq-models" icon="circle-question">
    Профили аутентификации, переключение моделей и устранение ошибок «профиль отсутствует».
  </Card>
</CardGroup>
