---
read_when:
    - Создание или редактирование изображений с помощью агента
    - Настройка провайдеров и моделей для генерации изображений
    - Общие сведения о параметрах инструмента image_generate
sidebarTitle: Image generation
summary: Создавайте и редактируйте изображения с помощью image_generate через OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Генерация изображений
x-i18n:
    generated_at: "2026-07-13T18:49:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

Инструмент `image_generate` создаёт и редактирует изображения с помощью настроенных
провайдеров. В сеансах чата он работает асинхронно: OpenClaw регистрирует
фоновую задачу, немедленно возвращает её идентификатор и активирует агента,
когда провайдер завершает работу. Агент завершения использует обычный для сеанса
режим видимого ответа: автоматическую доставку итогового ответа, если она настроена,
или `message(action="send")`, если сеанс требует использования инструмента сообщений. Если
сеанс отправителя запроса неактивен или его активная активация завершается сбоем, OpenClaw
отправляет идемпотентный прямой резервный ответ со сгенерированными изображениями,
чтобы результат не был потерян.

<Note>
Инструмент отображается, только если доступен хотя бы один провайдер
генерации изображений. Если `image_generate` отсутствует среди инструментов вашего агента,
настройте `agents.defaults.imageGenerationModel`, задайте ключ API провайдера
или войдите с помощью OAuth OpenAI ChatGPT/Codex.
</Note>

## Быстрый старт

<Steps>
  <Step title="Настройте аутентификацию">
    Задайте ключ API хотя бы для одного провайдера (например, `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) или войдите с помощью OAuth OpenAI Codex.
  </Step>
  <Step title="Выберите модель по умолчанию (необязательно)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    OAuth ChatGPT/Codex использует ту же ссылку на модель `openai/gpt-image-2`. Если настроен
    профиль OAuth `openai`, OpenClaw направляет запросы изображений
    через этот профиль OAuth вместо первоначальной попытки использовать `OPENAI_API_KEY`.
    Явная конфигурация `models.providers.openai` (ключ API, пользовательский или Azure URL базы)
    снова включает прямой маршрут через OpenAI Images API.

  </Step>
  <Step title="Обратитесь к агенту">
    _«Создай изображение дружелюбного робота-талисмана»._

    Агент автоматически вызывает `image_generate`. Добавлять инструмент в список разрешённых
    не требуется — он включён по умолчанию, когда доступен провайдер. Инструмент
    возвращает идентификатор фоновой задачи, а затем агент завершения отправляет
    созданное вложение через инструмент `message`, когда оно будет готово.

  </Step>
</Steps>

<Warning>
Для совместимых с OpenAI конечных точек локальной сети, таких как LocalAI, сохраните пользовательский
`models.providers.openai.baseUrl` и явно разрешите их с помощью
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Частные и
внутренние конечные точки изображений по умолчанию остаются заблокированными.
</Warning>

## Распространённые маршруты

| Цель                                                 | Ссылка на модель                                   | Аутентификация                         |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Генерация изображений OpenAI с оплатой через API     | `openai/gpt-image-2`                                 | `OPENAI_API_KEY`                     |
| Генерация изображений OpenAI с аутентификацией по подписке Codex | `openai/gpt-image-2`                       | OAuth OpenAI ChatGPT/Codex             |
| PNG/WebP OpenAI с прозрачным фоном                   | `openai/gpt-image-1.5`                                 | `OPENAI_API_KEY` или OAuth OpenAI Codex |
| Генерация изображений DeepInfra                      | `deepinfra/black-forest-labs/FLUX-1-schnell`                                 | `DEEPINFRA_API_KEY`                     |
| Выразительная генерация Krea 2 в fal с управлением стилем | `fal/krea/v2/medium/text-to-image`                            | `FAL_KEY`                     |
| Генерация изображений OpenRouter                     | `openrouter/google/gemini-3.1-flash-image-preview`                                 | `OPENROUTER_API_KEY`                     |
| Генерация изображений LiteLLM                        | `litellm/gpt-image-2`                                 | `LITELLM_API_KEY`                     |
| Генерация изображений Microsoft Foundry MAI          | `microsoft-foundry/<deployment-name>`                                 | `AZURE_OPENAI_API_KEY` или Entra ID        |
| Генерация изображений Google Gemini                  | `google/gemini-3.1-flash-image-preview`                                 | `GEMINI_API_KEY` или `GOOGLE_API_KEY` |

Один и тот же инструмент выполняет генерацию изображений по тексту и редактирование
по эталонному изображению. Используйте `image` для одного эталона или
`images` для нескольких. Для моделей Krea 2 в fal эти эталоны
передаются как стилевые референсы, а не как входные данные для редактирования.
Поддерживаемые провайдером указания для вывода, такие как `quality`,
`outputFormat` и `background`, передаются при наличии поддержки, а если
провайдер не заявляет о ней, помечаются как проигнорированные. Встроенная поддержка
прозрачного фона специфична для OpenAI; другие провайдеры также могут сохранять
альфа-канал PNG, если он создаётся их серверной частью.

## Поддерживаемые провайдеры

| Провайдер         | Модель по умолчанию                     | Поддержка редактирования            | Аутентификация                                        |
| ----------------- | --------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                      | Да (1 изображение, настраивается рабочим процессом) | `COMFY_API_KEY` или `COMFY_CLOUD_API_KEY` для облака |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`                      | Да (1 изображение)                  | `DEEPINFRA_API_KEY`                                    |
| fal               | `fal-ai/flux/dev`                      | Да (ограничения зависят от модели)  | `FAL_KEY`                                    |
| Google            | `gemini-3.1-flash-image-preview`                      | Да (до 5 изображений)               | `GEMINI_API_KEY` или `GOOGLE_API_KEY`             |
| LiteLLM           | `gpt-image-2`                      | Да (до 5 входных изображений)       | `LITELLM_API_KEY`                                    |
| Microsoft Foundry | `<deployment-name>`                      | Да (только модели MAI-Image-2.5)    | `AZURE_OPENAI_API_KEY` или Entra ID (`az login`)  |
| MiniMax           | `image-01`                      | Да (эталон объекта)                 | `MINIMAX_API_KEY` или OAuth MiniMax (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                      | Да (до 5 изображений)               | `OPENAI_API_KEY` или OAuth OpenAI ChatGPT/Codex     |
| OpenRouter        | `google/gemini-3.1-flash-image-preview`                      | Да (до 5 входных изображений)       | `OPENROUTER_API_KEY`                                    |
| Vydra             | `grok-imagine`                      | Нет                                 | `VYDRA_API_KEY`                                    |
| xAI               | `grok-imagine-image`                      | Да (до 3 изображений)               | `XAI_API_KEY`                                    |

Используйте `action: "list"`, чтобы просмотреть доступные провайдеры и модели во время выполнения:

```text
/tool image_generate action=list
```

Используйте `action: "status"`, чтобы просмотреть активную задачу генерации изображений для
текущего сеанса:

```text
/tool image_generate action=status
```

## Возможности провайдеров

| Возможность           | ComfyUI                 | DeepInfra    | fal                                                    | Google          | Microsoft Foundry | MiniMax                    | OpenAI          | Vydra | xAI             |
| --------------------- | ----------------------- | ------------ | ------------------------------------------------------ | --------------- | ----------------- | -------------------------- | --------------- | ----- | --------------- |
| Генерация (макс. количество) | 1                 | 4            | 4                                                      | 4               | 1                 | 9                          | 4               | 1     | 4               |
| Редактирование / эталон | 1 изображение (рабочий процесс) | 1 изображение | Flux: 1; GPT: 10; стилевые референсы Krea: 10; NB2: 14 | До 5 изображений | 1 изображение     | 1 изображение (эталон объекта) | До 5 изображений | -     | До 3 изображений |
| Управление размером   | -                       | ✓            | ✓                                                      | ✓               | ✓                 | -                          | До 4K           | -     | -               |
| Соотношение сторон    | -                       | -            | ✓                                                      | ✓               | -                 | ✓                          | -               | -     | ✓               |
| Разрешение (1K/2K/4K) | -                       | -            | ✓                                                      | ✓               | -                 | -                          | -               | -     | 1K, 2K          |

## Параметры инструмента

<ParamField path="prompt" type="string" required>
  Запрос для генерации изображения. Обязателен для `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Используйте `"status"`, чтобы просмотреть активную задачу сеанса, или
  `"list"`, чтобы просмотреть доступные провайдеры и модели во время выполнения.
</ParamField>
<ParamField path="model" type="string">
  Переопределение провайдера/модели (например, `openai/gpt-image-2`). Используйте
  `openai/gpt-image-1.5` для прозрачного фона OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Путь или URL одного эталонного изображения для режима редактирования.
</ParamField>
<ParamField path="images" type="string[]">
  Несколько эталонных изображений для режима редактирования или моделей со стилевыми
  референсами (до 14 через общий инструмент; ограничения конкретного провайдера
  по-прежнему применяются).
</ParamField>
<ParamField path="size" type="string">
  Указание размера: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Соотношение сторон: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`. Провайдеры проверяют допустимое подмножество для конкретной модели.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Указание разрешения.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Указание качества, если провайдер его поддерживает.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Указание формата вывода, если провайдер его поддерживает.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Указание фона, если провайдер его поддерживает. Используйте `transparent` с
  `outputFormat: "png"` или `"webp"` для провайдеров с поддержкой прозрачности.
</ParamField>
<ParamField path="count" type="number">Количество создаваемых изображений (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Необязательный тайм-аут запроса к провайдеру в миллисекундах. Когда Codex вызывает
  `image_generate` через динамические инструменты, это значение для отдельного вызова
  по-прежнему переопределяет настроенное значение по умолчанию и ограничивается 600000 мс.
</ParamField>
<ParamField path="filename" type="string">Предлагаемое имя выходного файла.</ParamField>
<ParamField path="openai" type="object">
  Указания только для OpenAI: `background`, `moderation`, `outputCompression` и `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Управление творческой свободой Krea 2 в fal. Значение по умолчанию — `medium`.
</ParamField>

<Note>
Не все провайдеры поддерживают все параметры. Если резервный провайдер вместо
точно запрошенного геометрического параметра поддерживает близкий вариант, OpenClaw
перед отправкой сопоставляет его с ближайшим поддерживаемым размером, соотношением
сторон или разрешением. Неподдерживаемые указания вывода отбрасываются для провайдеров,
которые не заявляют об их поддержке, и указываются в результате инструмента.
Результаты инструмента содержат применённые настройки; `details.normalization` фиксирует
любое преобразование запрошенных значений в применённые.
</Note>

## Конфигурация

### Выбор модели

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Порядок выбора провайдеров

OpenClaw пробует провайдеров в следующем порядке:

1. Параметр **`model`** из вызова инструмента (если агент его указывает).
2. **`imageGenerationModel.primary`** из конфигурации.
3. **`imageGenerationModel.fallbacks`** по порядку.
4. **Автоматическое обнаружение** — только значения провайдеров по умолчанию, для которых настроена аутентификация:
   - сначала текущий провайдер по умолчанию;
   - затем остальные зарегистрированные провайдеры генерации изображений в порядке идентификаторов провайдеров.

Если провайдер завершается с ошибкой (ошибка аутентификации, ограничение частоты запросов и т. д.), автоматически
пробуется следующий настроенный кандидат. Если все попытки завершаются неудачно, ошибка содержит подробности
каждой попытки.

<AccordionGroup>
  <Accordion title="Переопределения модели для отдельных вызовов применяются точно">
    Переопределение `model` для отдельного вызова пробует только указанные провайдер и модель и
    не переходит к настроенным основной/резервным или автоматически обнаруженным провайдерам.
  </Accordion>
  <Accordion title="Автоматическое обнаружение учитывает аутентификацию">
    Значение провайдера по умолчанию включается в список кандидатов, только если OpenClaw может
    фактически пройти аутентификацию у этого провайдера. Задайте
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, чтобы использовать только
    явно указанные записи `model`, `primary` и `fallbacks`.
  </Accordion>
  <Accordion title="Тайм-ауты">
    Задайте `agents.defaults.imageGenerationModel.timeoutMs` для медленных серверных систем
    обработки изображений. Параметр инструмента `timeoutMs` для отдельного вызова переопределяет настроенное
    значение по умолчанию, а настроенные значения по умолчанию переопределяют значения провайдеров
    по умолчанию, заданные плагином. Для размещённых у Google и OpenRouter провайдеров изображений по умолчанию
    используется 180 секунд; для генерации изображений Microsoft Foundry MAI, xAI и Azure OpenAI —
    600 секунд. Вызовы динамических инструментов Codex используют значение моста `image_generate`
    по умолчанию, равное 120 секундам, и при наличии настройки соблюдают тот же бюджет тайм-аута, ограниченный
    максимальным значением моста динамических инструментов OpenClaw в 600000 мс.
  </Accordion>
  <Accordion title="Проверка во время выполнения">
    Используйте `action: "list"`, чтобы просмотреть зарегистрированных в данный момент провайдеров,
    их модели по умолчанию и подсказки по переменным окружения для аутентификации.
  </Accordion>
</AccordionGroup>

### Редактирование изображений

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI и xAI поддерживают редактирование эталонных изображений. Модели Krea 2 в fal используют
те же поля `image` / `images` как стилевые референсы, а не входные данные для
редактирования. Передайте путь или URL эталонного изображения:

```text
"Создай акварельную версию этой фотографии" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter и Google поддерживают до 5 эталонных изображений через
параметр `images`; xAI поддерживает до 3. fal поддерживает 1 эталонное изображение для
преобразования изображений Flux, до 10 для редактирования GPT Image 2, до 10 стилевых референсов
для Krea 2 и до 14 для редактирования Nano Banana 2. Microsoft Foundry, MiniMax
и ComfyUI поддерживают 1.

## Подробный обзор провайдеров

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (и gpt-image-1.5)">
    Для генерации изображений OpenAI по умолчанию используется `openai/gpt-image-2`. Если настроен
    OAuth-профиль `openai`, OpenClaw повторно использует тот же
    OAuth-профиль, который применяется моделями чата подписки Codex, и отправляет
    запрос изображения через серверную систему Codex Responses. Устаревшие базовые
    URL Codex, такие как `https://chatgpt.com/backend-api`, приводятся к каноническому виду
    `https://chatgpt.com/backend-api/codex` для запросов изображений. OpenClaw
    **не** переключается незаметно на `OPENAI_API_KEY` для такого запроса —
    чтобы принудительно направить запрос напрямую в OpenAI Images API, явно настройте
    `models.providers.openai` с ключом API, пользовательским базовым URL
    или конечной точкой Azure.

    Модели `openai/gpt-image-1.5`, `openai/gpt-image-1` и
    `openai/gpt-image-1-mini` по-прежнему можно выбирать явно. Используйте
    `gpt-image-1.5` для вывода PNG/WebP с прозрачным фоном; текущий
    API `gpt-image-2` отклоняет `background: "transparent"`.

    `gpt-image-2` поддерживает как генерацию изображений из текста, так и
    редактирование эталонных изображений через один и тот же инструмент `image_generate`.
    OpenClaw передаёт OpenAI `prompt`, `count`, `size`, `quality`, `outputFormat`
    и эталонные изображения. OpenAI **не** получает
    `aspectRatio` или `resolution` напрямую; когда это возможно, OpenClaw сопоставляет
    их с поддерживаемым `size`, иначе инструмент сообщает о них как
    о проигнорированных переопределениях.

    Специальные параметры OpenAI находятся в объекте `openai`:

    ```json
    {
      "quality": "low",
      "outputFormat": "jpeg",
      "openai": {
        "background": "opaque",
        "moderation": "low",
        "outputCompression": 60,
        "user": "end-user-42"
      }
    }
    ```

    `openai.background` принимает `transparent`, `opaque` или `auto`;
    для вывода с прозрачностью требуется `outputFormat` `png` или `webp` и
    модель изображений OpenAI с поддержкой прозрачности. OpenClaw направляет стандартные
    запросы `gpt-image-2` с прозрачным фоном в `gpt-image-1.5`.
    `openai.outputCompression` применяется к выводу JPEG/WebP и игнорируется
    для вывода PNG.

    Подсказка верхнего уровня `background` не зависит от провайдера и в настоящее время сопоставляется
    с тем же полем запроса OpenAI `background`, когда выбран провайдер OpenAI.
    Провайдеры, которые не заявляют поддержку фона, возвращают её
    в `ignoredOverrides`, а не получают неподдерживаемый параметр.

    Чтобы направить генерацию изображений OpenAI через развёртывание Azure OpenAI
    вместо `api.openai.com`, см.
    [конечные точки Azure OpenAI](/ru/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Модели изображений Microsoft Foundry MAI">
    Генерация изображений Microsoft Foundry использует имена развёрнутых моделей изображений MAI
    с префиксом провайдера `microsoft-foundry/`. Модели по умолчанию на уровне провайдера
    нет, поскольку API MAI ожидает имя вашего развёртывания в поле
    `model`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    Провайдер использует API MAI Microsoft Foundry, а не OpenAI Images API:

    - Конечная точка генерации: `/mai/v1/images/generations`
    - Конечная точка редактирования: `/mai/v1/images/edits`
    - Аутентификация: `AZURE_OPENAI_API_KEY` / ключ API провайдера или Entra ID через `az login`
    - Вывод: одно изображение PNG
    - Размер: по умолчанию `1024x1024`; ширина и высота должны быть не менее 768 пикселей каждая,
      а общее количество пикселей не должно превышать 1 048 576
    - Редактирование: одно эталонное изображение PNG или JPEG, поддерживается только
      развёртываниями `MAI-Image-2.5-Flash` и `MAI-Image-2.5`

    Для генерации только по текстовому запросу можно использовать пользовательское имя развёртывания, настроив лишь
    конечную точку Foundry. Для редактирования с пользовательскими именами развёртываний требуются
    метаданные первоначальной настройки/модели, чтобы OpenClaw мог проверить, что развёртывание
    основано на `MAI-Image-2.5-Flash` или `MAI-Image-2.5`.

    Текущие модели изображений MAI: `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` и `MAI-Image-2`. Инструкции по настройке
    и описание поведения моделей чата см. в разделе [Плагин Microsoft Foundry](/ru/plugins/reference/microsoft-foundry).

  </Accordion>
  <Accordion title="Модели изображений OpenRouter">
    Генерация изображений OpenRouter использует тот же `OPENROUTER_API_KEY` и
    направляет запросы через API изображений в завершениях чата OpenRouter. Выбирайте
    модели изображений OpenRouter с префиксом `openrouter/`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openrouter/google/gemini-3.1-flash-image-preview",
          },
        },
      },
    }
    ```

    OpenClaw передаёт OpenRouter `prompt`, `count`, эталонные изображения и
    совместимые с Gemini подсказки `aspectRatio` / `resolution`.
    Текущие встроенные сокращения моделей изображений OpenRouter включают
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` и `openai/gpt-5.4-image-2`. Используйте
    `action: "list"`, чтобы узнать, что предоставляет настроенный плагин.

  </Accordion>
  <Accordion title="fal Krea 2">
    Модели Krea 2 в fal используют собственную схему Krea от fal вместо общей
    схемы `image_size`, используемой Flux. OpenClaw отправляет:

    - `aspect_ratio` для подсказок соотношения сторон
    - `creativity`, по умолчанию `medium`
    - `image_style_references`, когда переданы `image` или `images`

    Выбирайте Krea 2 Medium для более быстрой выразительной иллюстрации, а Krea 2 Large —
    для более медленного создания более детализированных фотореалистичных и текстурированных изображений:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    В настоящее время Krea 2 возвращает одно изображение на запрос. Для
    Krea предпочтительно использовать `aspectRatio`; OpenClaw сопоставляет `size` с ближайшим поддерживаемым Krea соотношением сторон и
    отклоняет `resolution` для Krea, а не отбрасывает его. Используйте `fal.creativity`,
    если нужен собственный уровень креативности Krea:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "Портрет в стиле киберзина с текстурой ризографии",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="Двойная аутентификация MiniMax">
    Генерация изображений MiniMax доступна через оба встроенных пути
    аутентификации MiniMax:

    - `minimax/image-01` для конфигураций с ключом API
    - `minimax-portal/image-01` для конфигураций OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Встроенный провайдер xAI использует `/v1/images/generations` для запросов
    только с текстовым описанием и `/v1/images/edits`, когда присутствует `image` или `images`.

    - Модели: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Количество: до 4
    - Референсы: один `image` или до трёх `images`
    - Соотношения сторон: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Разрешения: `1K`, `2K`
    - Вывод: возвращается в виде вложений изображений, управляемых OpenClaw

    OpenClaw намеренно не предоставляет собственные параметры xAI `quality`, `mask`,
    `user` или соотношение сторон `auto`, пока эти элементы управления не появятся в общем
    межпровайдерном контракте `image_generate`.

  </Accordion>
</AccordionGroup>

## Примеры

<Tabs>
  <Tab title="Генерация (альбомное изображение 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Лаконичный редакционный плакат для генерации изображений OpenClaw" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Генерация (прозрачный PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="Простая наклейка в виде красного круга на прозрачном фоне" outputFormat=png background=transparent
```

Эквивалентная команда CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Простая наклейка в виде красного круга на прозрачном фоне" \
  --json
```

  </Tab>
  <Tab title="Генерация (низкое качество OpenAI)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Недорогой черновой плакат для спокойного приложения для продуктивности" quality=low openai='{"moderation":"low"}'
```

Эквивалентная команда CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Недорогой черновой плакат для приложения, помогающего спокойно повышать продуктивность" \
  --json
```

  </Tab>
  <Tab title="Генерация (два квадратных изображения)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Два визуальных направления для значка приложения, помогающего спокойно повышать продуктивность" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Редактирование (одно референсное изображение)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Сохранить объект, заменив фон на яркую студийную обстановку" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Редактирование (несколько референсных изображений)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Объединить образ персонажа из первого изображения с цветовой палитрой из второго" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Стилевые референсы Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="Выразительный редакционный портрет с использованием этой цветовой палитры и печатной текстуры" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Те же флаги `--output-format`, `--background`, `--quality` и
`--openai-moderation` доступны для `openclaw infer image edit`;
`--openai-background` остаётся псевдонимом, специфичным для OpenAI. Встроенные провайдеры,
кроме OpenAI, сейчас не объявляют явное управление фоном, поэтому
`background: "transparent"` для них указывается как проигнорированный.

## Связанные материалы

- [Обзор инструментов](/ru/tools) — все доступные инструменты агента
- [ComfyUI](/ru/providers/comfy) — настройка локальных рабочих процессов ComfyUI и Comfy Cloud
- [fal](/ru/providers/fal) — настройка провайдера изображений и видео fal
- [Google (Gemini)](/ru/providers/google) — настройка провайдера изображений Gemini
- [Плагин Microsoft Foundry](/ru/plugins/reference/microsoft-foundry) — настройка чата Microsoft Foundry и изображений MAI
- [MiniMax](/ru/providers/minimax) — настройка провайдера изображений MiniMax
- [OpenAI](/ru/providers/openai) — настройка провайдера OpenAI Images
- [Vydra](/ru/providers/vydra) — настройка изображений, видео и речи Vydra
- [xAI](/ru/providers/xai) — настройка изображений, видео, поиска, выполнения кода и TTS Grok
- [Справочник по конфигурации](/ru/gateway/config-agents#agent-defaults) — конфигурация `imageGenerationModel`
- [Модели](/ru/concepts/models) — конфигурация моделей и аварийное переключение
