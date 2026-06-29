---
read_when:
    - Генерация музыки или аудио через агента
    - Настройка провайдеров и моделей для генерации музыки
    - Понимание параметров инструмента music_generate
sidebarTitle: Music generation
summary: Генерируйте музыку через music_generate в рабочих процессах ComfyUI, fal, Google Lyria, MiniMax и OpenRouter
title: Генерация музыки
x-i18n:
    generated_at: "2026-06-28T23:53:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

Инструмент `music_generate` позволяет агенту создавать музыку или аудио через
общую возможность генерации музыки с настроенными провайдерами — сейчас это
ComfyUI, fal, Google, MiniMax и OpenRouter.

Для запусков агента с поддержкой сессии OpenClaw запускает генерацию музыки как
фоновую задачу, отслеживает ее в журнале задач, а затем снова пробуждает агента,
когда трек готов, чтобы агент мог сообщить пользователю и прикрепить
готовое аудио. Агент завершения следует обычному режиму видимых ответов сессии:
автоматическая доставка финального ответа, если она настроена, или `message(action="send")`,
если сессия требует инструмент сообщений. Если сессия запрашивающего
неактивна или ее активное пробуждение завершается неудачно, а часть сгенерированного
аудио все еще отсутствует в ответе завершения, OpenClaw отправляет идемпотентный
прямой резервный ответ только с недостающим аудио.

<Note>
Встроенный общий инструмент появляется только тогда, когда доступен хотя бы один
провайдер генерации музыки. Если вы не видите `music_generate` среди инструментов
вашего агента, настройте `agents.defaults.musicGenerationModel` или добавьте
API-ключ провайдера.
</Note>

## Быстрый старт

<Tabs>
  <Tab title="На основе общего провайдера">
    <Steps>
      <Step title="Настройте аутентификацию">
        Задайте API-ключ хотя бы для одного провайдера — например
        `GEMINI_API_KEY` или `MINIMAX_API_KEY`.
      </Step>
      <Step title="Выберите модель по умолчанию (необязательно)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Попросите агента">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        Агент автоматически вызывает `music_generate`. Список разрешенных
        инструментов не требуется.
      </Step>
    </Steps>

    Для прямых синхронных контекстов без запуска агента с поддержкой сессии
    встроенный инструмент все равно возвращается к встроенной генерации и
    возвращает итоговый путь к медиафайлу в результате инструмента.

  </Tab>
  <Tab title="Рабочий процесс ComfyUI">
    <Steps>
      <Step title="Настройте рабочий процесс">
        Настройте `plugins.entries.comfy.config.music` с JSON рабочего процесса
        и узлами prompt/output.
      </Step>
      <Step title="Облачная аутентификация (необязательно)">
        Для Comfy Cloud задайте `COMFY_API_KEY` или `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Вызовите инструмент">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Примеры запросов:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Поддерживаемые провайдеры

| Провайдер  | Модель по умолчанию          | Эталонные входные данные | Поддерживаемые элементы управления                  | Аутентификация                        |
| ---------- | ---------------------------- | ------------------------ | --------------------------------------------------- | ------------------------------------- |
| ComfyUI    | `workflow`                   | До 1 изображения         | Музыка или аудио, определенные рабочим процессом    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Нет                      | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` или `FAL_API_KEY`           |
| Google     | `lyria-3-clip-preview`       | До 10 изображений        | `lyrics`, `instrumental`, `format`                  | `GEMINI_API_KEY`, `GOOGLE_API_KEY`    |
| MiniMax    | `music-2.6`                  | Нет                      | `lyrics`, `instrumental`, `format=mp3`              | `MINIMAX_API_KEY` или MiniMax OAuth   |
| OpenRouter | `google/lyria-3-pro-preview` | До 1 изображения         | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                  |

### Матрица возможностей

Явный контракт режимов, используемый `music_generate`, контрактными тестами и
общим live sweep:

| Провайдер  | `generate` | `edit` | Ограничение редактирования | Общие live-линии                                                        |
| ---------- | :--------: | :----: | --------------------------- | ----------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 изображение               | Не входит в общий sweep; покрывается `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Нет                         | `generate`                                                              |
| Google     |     ✓      |   ✓    | 10 изображений              | `generate`, `edit`                                                      |
| MiniMax    |     ✓      |   —    | Нет                         | `generate`                                                              |
| OpenRouter |     ✓      |   ✓    | 1 изображение               | `generate`, `edit`                                                      |

Используйте `action: "list"`, чтобы во время выполнения просмотреть доступных
общих провайдеров и модели:

```text
/tool music_generate action=list
```

Используйте `action: "status"`, чтобы просмотреть активную задачу генерации
музыки с поддержкой сессии:

```text
/tool music_generate action=status
```

Пример прямой генерации:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Параметры инструмента

<ParamField path="prompt" type="string" required>
  Запрос для генерации музыки. Требуется для `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` возвращает текущую задачу сессии; `"list"` проверяет провайдеров.
</ParamField>
<ParamField path="model" type="string">
  Переопределение провайдера/модели (например, `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Необязательный текст песни, когда провайдер поддерживает явный ввод текста.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Запрашивает вывод только инструментальной версии, когда провайдер это поддерживает.
</ParamField>
<ParamField path="image" type="string">
  Путь или URL одного эталонного изображения.
</ParamField>
<ParamField path="images" type="string[]">
  Несколько эталонных изображений (до 10 у поддерживающих провайдеров).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Целевая длительность в секундах, когда провайдер поддерживает подсказки длительности.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Подсказка формата вывода, когда провайдер это поддерживает.
</ParamField>
<ParamField path="filename" type="string">Подсказка имени выходного файла.</ParamField>

<Note>
Не все провайдеры поддерживают все параметры. OpenClaw все равно проверяет
жесткие ограничения, такие как количество входных данных, перед отправкой.
Когда провайдер поддерживает длительность, но использует более короткий максимум,
чем запрошенное значение, OpenClaw ограничивает ее ближайшей поддерживаемой
длительностью. Действительно неподдерживаемые необязательные подсказки
игнорируются с предупреждением, когда выбранный провайдер или модель не может
их выполнить. Результаты инструмента сообщают примененные настройки;
`details.normalization` фиксирует любое сопоставление запрошенного с примененным.
</Note>

Тайм-ауты запросов к провайдеру являются только операторской конфигурацией.
OpenClaw использует `agents.defaults.musicGenerationModel.timeoutMs`, когда он
настроен, повышает значения ниже 120000ms до 120000ms, а в остальных случаях
по умолчанию задает для запросов к провайдеру 300000ms.

## Асинхронное поведение

Генерация музыки с поддержкой сессии выполняется как фоновая задача:

- **Фоновая задача:** `music_generate` создает фоновую задачу, сразу возвращает
  ответ о запуске/задаче и позже публикует готовый трек в последующем сообщении
  агента.
- **Предотвращение дубликатов:** пока задача находится в состоянии `queued` или
  `running`, последующие вызовы `music_generate` в той же сессии возвращают
  статус задачи вместо запуска другой генерации. Используйте `action: "status"`
  для явной проверки.
- **Просмотр статуса:** `openclaw tasks list` или `openclaw tasks show <taskId>`
  проверяет статусы в очереди, выполнения и терминальные статусы.
- **Пробуждение при завершении:** OpenClaw внедряет внутреннее событие завершения
  обратно в ту же сессию, чтобы модель могла сама написать пользовательское
  последующее сообщение.
- **Подсказка запроса:** последующие пользовательские/ручные ходы в той же сессии
  получают небольшую runtime-подсказку, когда музыкальная задача уже выполняется,
  чтобы модель не вызывала `music_generate` повторно вслепую.
- **Резерв без сессии:** прямые/локальные контексты без реальной сессии агента
  выполняются встроенно и возвращают итоговый результат аудио в том же ходе.

### Жизненный цикл задачи

| Состояние   | Значение                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Задача создана и ожидает, пока провайдер ее примет.                                           |
| `running`   | Провайдер обрабатывает запрос (обычно от 30 секунд до 3 минут в зависимости от провайдера и длительности). |
| `succeeded` | Трек готов; агент пробуждается и публикует его в беседе.                                      |
| `failed`    | Ошибка провайдера или тайм-аут; агент пробуждается с подробностями ошибки.                    |

Проверьте статус из CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Конфигурация

### Выбор модели

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### Порядок выбора провайдера

OpenClaw пробует провайдеров в следующем порядке:

1. Параметр `model` из вызова инструмента (если агент его указывает).
2. `musicGenerationModel.primary` из конфигурации.
3. `musicGenerationModel.fallbacks` по порядку.
4. Автообнаружение только с использованием значений провайдеров по умолчанию,
   подкрепленных аутентификацией:
   - текущий провайдер по умолчанию первым;
   - остальные зарегистрированные провайдеры генерации музыки в порядке id провайдера.

Если провайдер завершается ошибкой, следующий кандидат пробуется автоматически.
Если завершаются ошибкой все, ошибка включает подробности каждой попытки.

Задайте `agents.defaults.mediaGenerationAutoProviderFallback: false`, чтобы
использовать только явные записи `model`, `primary` и `fallbacks`.

## Примечания о провайдерах

<AccordionGroup>
  <Accordion title="ComfyUI">
    Управляется рабочим процессом и зависит от настроенного графа, а также
    сопоставления узлов для полей prompt/output. Встроенный Plugin `comfy`
    подключается к общему инструменту `music_generate` через реестр провайдеров
    генерации музыки.
  </Accordion>
  <Accordion title="fal">
    Использует конечные точки моделей fal через общий путь аутентификации
    провайдера. Встроенный провайдер по умолчанию использует
    `fal-ai/minimax-music/v2.6`, а также предоставляет
    `fal-ai/ace-step/prompt-to-audio` и
    `fal-ai/stable-audio-25/text-to-audio` для запросов prompt-to-audio.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Использует пакетную генерацию Lyria 3. Текущий встроенный поток поддерживает
    запрос, необязательный текст песни и необязательные эталонные изображения.
  </Accordion>
  <Accordion title="MiniMax">
    Использует пакетную конечную точку `music_generation`. Поддерживает запрос,
    необязательный текст песни, инструментальный режим и вывод mp3 через
    аутентификацию по API-ключу `minimax` или OAuth `minimax-portal`.
  </Accordion>
  <Accordion title="OpenRouter">
    Использует аудиовывод chat completions OpenRouter с включенной потоковой
    передачей. Встроенный провайдер по умолчанию использует
    `google/lyria-3-pro-preview`, а также предоставляет
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Выбор правильного пути

- **На основе общего провайдера**, когда вам нужен выбор модели, переключение
  при сбое провайдера и встроенный асинхронный поток задач/статусов.
- **Путь Plugin (ComfyUI)**, когда вам нужен пользовательский граф рабочего
  процесса или провайдер, который не является частью общей встроенной
  возможности генерации музыки.

Если вы отлаживаете поведение, специфичное для ComfyUI, см.
[ComfyUI](/ru/providers/comfy). Если вы отлаживаете общее поведение
провайдеров, начните с [fal](/ru/providers/fal), [Google (Gemini)](/ru/providers/google),
[MiniMax](/ru/providers/minimax) или [OpenRouter](/ru/providers/openrouter).

## Режимы возможностей провайдера

Общий контракт генерации музыки поддерживает явные объявления режимов:

- `generate` для генерации только по промпту.
- `edit`, когда запрос включает одно или несколько референсных изображений.

Новые реализации провайдеров должны предпочитать явные блоки режимов:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Устаревших плоских полей, таких как `maxInputImages`, `supportsLyrics` и
`supportsFormat`, **недостаточно**, чтобы заявить поддержку редактирования.
Провайдерам следует явно объявлять `generate` и `edit`, чтобы тесты с реальными
сервисами, контрактные тесты и общий инструмент `music_generate` могли
детерминированно проверять поддержку режимов.

## Тесты с реальными сервисами

Покрытие тестами с реальными сервисами для общих встроенных провайдеров
включается явно:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Обертка репозитория:

```bash
pnpm test:live:media music
```

Этот файл тестов с реальными сервисами по умолчанию использует уже
экспортированные env vars провайдера перед сохраненными профилями
аутентификации и запускает покрытие как для `generate`, так и для объявленного
`edit`, когда провайдер включает режим редактирования. Текущее покрытие:

- `google`: `generate` плюс `edit`
- `fal`: только `generate`
- `minimax`: только `generate`
- `openrouter`: `generate` плюс `edit`
- `comfy`: отдельное покрытие тестами Comfy с реальными сервисами, не общий обход провайдеров

Покрытие тестами с реальными сервисами для встроенного музыкального пути ComfyUI
включается явно:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Файл тестов Comfy с реальными сервисами также покрывает рабочие процессы comfy
для изображений и видео, когда эти разделы настроены.

## Связанные материалы

- [Фоновые задачи](/ru/automation/tasks) — отслеживание задач для отсоединенных запусков `music_generate`
- [ComfyUI](/ru/providers/comfy)
- [Справочник конфигурации](/ru/gateway/config-agents#agent-defaults) — конфигурация `musicGenerationModel`
- [Google (Gemini)](/ru/providers/google)
- [MiniMax](/ru/providers/minimax)
- [Модели](/ru/concepts/models) — конфигурация моделей и отработка отказа
- [Обзор инструментов](/ru/tools)
