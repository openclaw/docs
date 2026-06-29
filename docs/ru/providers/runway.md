---
read_when:
    - Вы хотите использовать генерацию видео Runway в OpenClaw
    - Вам нужна настройка API-ключа/переменной окружения Runway
    - Вы хотите сделать Runway видеопровайдером по умолчанию
summary: Настройка генерации видео Runway в OpenClaw
title: Запас времени
x-i18n:
    generated_at: "2026-06-28T23:39:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw поставляется со встроенным провайдером `runway` для размещенной генерации видео. Plugin включен по умолчанию и регистрирует провайдер `runway` для контракта `videoGenerationProviders`.

| Свойство                  | Значение                                                                  |
| ------------------------- | ------------------------------------------------------------------------- |
| Идентификатор провайдера  | `runway`                                                                  |
| Plugin                    | встроенный, `enabledByDefault: true`                                      |
| Переменные среды для auth | `RUNWAYML_API_SECRET` (каноническая) или `RUNWAY_API_KEY`                 |
| Флаг онбординга           | `--auth-choice runway-api-key`                                            |
| Прямой флаг CLI           | `--runway-api-key <key>`                                                  |
| API                       | Генерация видео Runway на основе задач (опрос `GET /v1/tasks/{id}`)       |
| Модель по умолчанию       | `runway/gen4.5`                                                           |

## Начало работы

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Set Runway as the default video provider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Generate a video">
    Попросите агента сгенерировать видео. Runway будет использован автоматически.
  </Step>
</Steps>

## Поддерживаемые режимы и модели

Провайдер предоставляет семь моделей Runway, разделенных на три режима. Один и тот же идентификатор модели может обслуживать более одного режима (например, `gen4.5` работает как для преобразования текста в видео, так и для преобразования изображения в видео).

| Режим                | Модели                                                                 | Входная ссылка                |
| -------------------- | ---------------------------------------------------------------------- | ----------------------------- |
| Текст в видео        | `gen4.5` (по умолчанию), `veo3.1`, `veo3.1_fast`, `veo3`               | Нет                           |
| Изображение в видео  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 локальное или удаленное изображение |
| Видео в видео        | `gen4_aleph`                                                           | 1 локальное или удаленное видео |

Локальные ссылки на изображения и видео поддерживаются через data URI.

| Соотношения сторон          | Допустимые значения                         |
| --------------------------- | ------------------------------------------- |
| Текст в видео               | `16:9`, `9:16`                              |
| Редактирование изображений и видео | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Для преобразования видео в видео сейчас требуется `runway/gen4_aleph`. Другие идентификаторы моделей Runway отклоняют входные ссылки на видео.
</Warning>

<Note>
  Выбор идентификатора модели Runway из неправильного столбца приводит к явной ошибке до того, как API-запрос покинет OpenClaw. Провайдер проверяет `model` по списку разрешенных значений режима (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) в `extensions/runway/video-generation-provider.ts`.
</Note>

## Конфигурация

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Environment variable aliases">
    OpenClaw распознает как `RUNWAYML_API_SECRET` (каноническую), так и `RUNWAY_API_KEY`.
    Любая из этих переменных аутентифицирует провайдер Runway.
  </Accordion>

  <Accordion title="Task polling">
    Runway использует API на основе задач. После отправки запроса на генерацию OpenClaw
    опрашивает `GET /v1/tasks/{id}`, пока видео не будет готово. Для поведения
    опроса дополнительная конфигурация не требуется.
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
