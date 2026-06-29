---
read_when:
    - Вы хотите использовать генерацию видео Alibaba Wan в OpenClaw
    - Для генерации видео необходимо настроить API-ключ Model Studio или DashScope
summary: Генерация видео Alibaba Model Studio Wan в OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-06-28T23:34:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
---

OpenClaw поставляется со встроенным plugin `alibaba`, который регистрирует провайдера генерации видео для моделей Wan в Alibaba Model Studio (международное название DashScope). Plugin включен по умолчанию; вам нужно только задать API-ключ.

| Свойство               | Значение                                                                        |
| ---------------------- | ------------------------------------------------------------------------------- |
| Идентификатор провайдера | `alibaba`                                                                       |
| Plugin                 | встроенный, `enabledByDefault: true`                                            |
| Env vars для авторизации | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (используется первое совпадение) |
| Флаг онбординга        | `--auth-choice alibaba-model-studio-api-key`                                    |
| Прямой флаг CLI        | `--alibaba-model-studio-api-key <key>`                                          |
| Модель по умолчанию    | `alibaba/wan2.6-t2v`                                                            |
| Базовый URL по умолчанию | `https://dashscope-intl.aliyuncs.com`                                           |

## Начало работы

<Steps>
  <Step title="Set an API key">
    Используйте онбординг, чтобы сохранить ключ для провайдера `alibaba`:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Или передайте ключ напрямую во время установки/онбординга:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Или экспортируйте любую из поддерживаемых env vars перед запуском Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Set a default video model">
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
  <Step title="Verify the provider is configured">
    ```bash
    openclaw models list --provider alibaba
    ```

    Список должен включать все пять встроенных моделей Wan. Если `MODELSTUDIO_API_KEY` не разрешается, `openclaw models status --json` сообщает об отсутствующих учетных данных в `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Plugin Alibaba и [Plugin Qwen](/ru/providers/qwen) оба проходят авторизацию через DashScope и принимают пересекающиеся env vars. Используйте идентификаторы моделей `alibaba/...` для выделенной поверхности видео Wan; используйте идентификаторы `qwen/...`, когда вам нужна поверхность чата, эмбеддингов или понимания медиа Qwen.
</Note>

## Встроенные модели Wan

| Ссылка на модель          | Режим                     |
| ------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`      | Текст-в-видео (по умолчанию) |
| `alibaba/wan2.6-i2v`      | Изображение-в-видео       |
| `alibaba/wan2.6-r2v`      | Референс-в-видео          |
| `alibaba/wan2.6-r2v-flash` | Референс-в-видео (быстро) |
| `alibaba/wan2.7-r2v`      | Референс-в-видео          |

## Возможности и ограничения

Встроенный провайдер отражает ограничения видео API Wan в DashScope. У всех трех режимов одинаковые лимиты количества видео и длительности на запрос; отличается только форма входных данных.

| Режим              | Макс. выходных видео | Макс. входных изображений | Макс. входных видео | Макс. длительность | Поддерживаемые элементы управления                         |
| ------------------ | -------------------- | -------------------------- | ------------------- | ------------------ | ---------------------------------------------------------- |
| Текст-в-видео      | 1                    | n/a                        | n/a                 | 10 s               | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Изображение-в-видео | 1                    | 1                          | n/a                 | 10 s               | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Референс-в-видео   | 1                    | n/a                        | 4                   | 10 s               | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Когда в запросе не указано `durationSeconds`, провайдер отправляет принятое в DashScope значение по умолчанию — **5 секунд**. Задайте `durationSeconds` явно в [инструменте генерации видео](/ru/tools/video-generation), чтобы увеличить длительность до 10 s.

<Warning>
  Входные референсные изображения и видео должны быть удаленными URL `http(s)`. Локальные пути к файлам не принимаются референсными режимами DashScope; сначала загрузите их в объектное хранилище или используйте поток [инструмента медиа](/ru/tools/media-overview), который уже создает публичный URL.
</Warning>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Override the DashScope base URL">
    По умолчанию провайдер использует международный endpoint DashScope. Чтобы выбрать endpoint региона China, задайте:

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

    Провайдер удаляет завершающие косые черты перед построением URL задач AIGC.

  </Accordion>

  <Accordion title="Auth env priority">
    OpenClaw разрешает API-ключ Alibaba из переменных окружения в таком порядке, выбирая первое непустое значение:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Настроенные записи `auth.profiles` (заданные через `openclaw models auth login`) переопределяют разрешение env-var. См. [профили авторизации в FAQ по моделям](/ru/help/faq-models#what-is-an-auth-profile) для механики ротации профилей, cooldown и переопределения.

  </Accordion>

  <Accordion title="Relationship to the Qwen plugin">
    Оба встроенных plugin взаимодействуют с DashScope и принимают пересекающиеся API-ключи. Используйте:

    - идентификаторы `alibaba/wan*.*` для выделенного провайдера видео Wan, описанного на этой странице.
    - идентификаторы `qwen/*` для чата, эмбеддингов и понимания медиа Qwen (см. [Qwen](/ru/providers/qwen)).

    Однократная настройка `MODELSTUDIO_API_KEY` авторизует оба plugin, потому что список auth env var намеренно пересекается; вам не нужно выполнять онбординг каждого plugin отдельно.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Video generation" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента видео и выбор провайдера.
  </Card>
  <Card title="Qwen" href="/ru/providers/qwen" icon="microchip">
    Настройка чата, эмбеддингов и понимания медиа Qwen с той же авторизацией DashScope.
  </Card>
  <Card title="Configuration reference" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Значения агентов по умолчанию и конфигурация моделей.
  </Card>
  <Card title="Models FAQ" href="/ru/help/faq-models" icon="circle-question">
    Профили авторизации, переключение моделей и устранение ошибок "no profile".
  </Card>
</CardGroup>
