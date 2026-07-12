---
read_when:
    - Создание или редактирование изображений с помощью агента
    - Настройка провайдеров и моделей генерации изображений
    - Понимание параметров инструмента image_generate
sidebarTitle: Image generation
summary: Создавайте и редактируйте изображения с помощью image_generate в OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI и Vydra
title: Генерация изображений
x-i18n:
    generated_at: "2026-07-12T11:55:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

Инструмент `image_generate` создаёт и редактирует изображения через настроенных
поставщиков. В сеансах чата он работает асинхронно: OpenClaw регистрирует
фоновую задачу, немедленно возвращает её идентификатор и пробуждает агента,
когда поставщик завершает работу. Агент завершения использует обычный для
сеанса режим видимых ответов: автоматическую доставку итогового ответа, если
она настроена, или `message(action="send")`, если сеанс требует использования
инструмента сообщений. Если сеанс отправителя неактивен или его активное
пробуждение завершается неудачей, OpenClaw выполняет идемпотентную прямую
резервную отправку созданных изображений, чтобы результат не был потерян.

<Note>
Инструмент отображается, только когда доступен хотя бы один поставщик генерации
изображений. Если `image_generate` отсутствует среди инструментов вашего агента,
настройте `agents.defaults.imageGenerationModel`, задайте ключ API поставщика
или войдите через OAuth OpenAI ChatGPT/Codex.
</Note>

## Быстрый старт

<Steps>
  <Step title="Настройте аутентификацию">
    Задайте ключ API хотя бы для одного поставщика (например, `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) или войдите через OAuth OpenAI Codex.
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

    OAuth ChatGPT/Codex использует ту же ссылку на модель `openai/gpt-image-2`.
    Если настроен профиль OAuth `openai`, OpenClaw направляет запросы изображений
    через этот профиль OAuth, не пытаясь сначала использовать `OPENAI_API_KEY`.
    Явная конфигурация `models.providers.openai` (ключ API, пользовательский
    базовый URL или базовый URL Azure) снова включает прямой маршрут через API
    OpenAI Images.

  </Step>
  <Step title="Попросите агента">
    _«Создай изображение дружелюбного робота-талисмана»._

    Агент автоматически вызывает `image_generate`. Добавлять инструмент в список
    разрешённых не требуется — он включён по умолчанию, когда доступен поставщик.
    Инструмент возвращает идентификатор фоновой задачи, а затем, когда вложение
    готово, агент завершения отправляет его через инструмент `message`.

  </Step>
</Steps>

<Warning>
Для совместимых с OpenAI конечных точек в локальной сети, таких как LocalAI,
сохраните пользовательское значение `models.providers.openai.baseUrl` и явно
разрешите доступ с помощью
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Частные и внутренние
конечные точки изображений по умолчанию остаются заблокированными.
</Warning>

## Распространённые маршруты

| Цель                                                   | Ссылка на модель                                   | Аутентификация                        |
| ------------------------------------------------------ | -------------------------------------------------- | ------------------------------------- |
| Генерация изображений OpenAI с оплатой через API       | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                      |
| Генерация изображений OpenAI по подписке Codex         | `openai/gpt-image-2`                               | OAuth OpenAI ChatGPT/Codex            |
| PNG/WebP OpenAI с прозрачным фоном                     | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` или OAuth OpenAI Codex |
| Генерация изображений DeepInfra                        | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                   |
| Выразительная или управляемая стилем генерация fal Krea 2 | `fal/krea/v2/medium/text-to-image`              | `FAL_KEY`                             |
| Генерация изображений OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                  |
| Генерация изображений LiteLLM                          | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                     |
| Генерация изображений Microsoft Foundry MAI            | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` или Entra ID   |
| Генерация изображений Google Gemini                    | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` или `GOOGLE_API_KEY` |

Один и тот же инструмент выполняет генерацию изображения по тексту и
редактирование по изображениям-образцам. Используйте `image` для одного образца
или `images` для нескольких. Для моделей Krea 2 в fal эти изображения
передаются как стилевые образцы, а не как входные данные для редактирования.
Поддерживаемые поставщиком подсказки для вывода, такие как `quality`,
`outputFormat` и `background`, передаются при наличии поддержки; если поставщик
не заявляет их поддержку, они помечаются как проигнорированные. Встроенная
поддержка прозрачного фона предназначена только для OpenAI; другие поставщики
также могут сохранять альфа-канал PNG, если его создаёт их серверная часть.

## Поддерживаемые поставщики

| Поставщик         | Модель по умолчанию                     | Поддержка редактирования                  | Аутентификация                                        |
| ----------------- | --------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Да (1 изображение, настраивается процессом) | `COMFY_API_KEY` или `COMFY_CLOUD_API_KEY` для облака |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Да (1 изображение)                        | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Да (ограничения зависят от модели)        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Да (до 5 изображений)                     | `GEMINI_API_KEY` или `GOOGLE_API_KEY`                 |
| LiteLLM           | `gpt-image-2`                           | Да (до 5 входных изображений)             | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Да (только модели MAI-Image-2.5)          | `AZURE_OPENAI_API_KEY` или Entra ID (`az login`)      |
| MiniMax           | `image-01`                              | Да (образец объекта)                      | `MINIMAX_API_KEY` или OAuth MiniMax (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Да (до 5 изображений)                     | `OPENAI_API_KEY` или OAuth OpenAI ChatGPT/Codex       |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Да (до 5 входных изображений)             | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Нет                                       | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Да (до 3 изображений)                     | `XAI_API_KEY`                                         |

Используйте `action: "list"`, чтобы во время выполнения просмотреть доступных
поставщиков и модели:

```text
/tool image_generate action=list
```

Используйте `action: "status"`, чтобы просмотреть активную задачу генерации
изображений для текущего сеанса:

```text
/tool image_generate action=status
```

## Возможности поставщиков

| Возможность                  | ComfyUI                 | DeepInfra     | fal                                             | Google            | Microsoft Foundry | MiniMax                       | OpenAI            | Vydra | xAI               |
| ---------------------------- | ----------------------- | ------------- | ----------------------------------------------- | ----------------- | ----------------- | ----------------------------- | ----------------- | ----- | ----------------- |
| Генерация (макс. количество) | 1                       | 4             | 4                                               | 4                 | 1                 | 9                             | 4                 | 1     | 4                 |
| Редактирование / образец     | 1 изображение (процесс) | 1 изображение | Flux: 1; GPT: 10; стилевые образцы Krea: 10; NB2: 14 | До 5 изображений | 1 изображение     | 1 изображение (образец объекта) | До 5 изображений | -     | До 3 изображений |
| Управление размером          | -                       | ✓             | ✓                                               | ✓                 | ✓                 | -                             | До 4K             | -     | -                 |
| Соотношение сторон           | -                       | -             | ✓                                               | ✓                 | -                 | ✓                             | -                 | -     | ✓                 |
| Разрешение (1K/2K/4K)        | -                       | -             | ✓                                               | ✓                 | -                 | -                             | -                 | -     | 1K, 2K            |

## Параметры инструмента

<ParamField path="prompt" type="string" required>
  Запрос на генерацию изображения. Обязателен для `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Используйте `"status"` для просмотра активной задачи сеанса или `"list"` для
  просмотра доступных поставщиков и моделей во время выполнения.
</ParamField>
<ParamField path="model" type="string">
  Переопределение поставщика или модели (например, `openai/gpt-image-2`).
  Используйте `openai/gpt-image-1.5` для прозрачного фона OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Путь или URL одного изображения-образца для режима редактирования.
</ParamField>
<ParamField path="images" type="string[]">
  Несколько изображений-образцов для режима редактирования или моделей со
  стилевыми образцами (до 14 через общий инструмент; ограничения конкретного
  поставщика по-прежнему применяются).
</ParamField>
<ParamField path="size" type="string">
  Подсказка размера: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Соотношение сторон: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`. Поставщики проверяют подмножество, поддерживаемое
  конкретной моделью.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Подсказка разрешения.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Подсказка качества, если поставщик её поддерживает.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Подсказка формата вывода, если поставщик её поддерживает.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Подсказка фона, если поставщик её поддерживает. Используйте `transparent`
  вместе с `outputFormat: "png"` или `"webp"` для поставщиков, поддерживающих
  прозрачность.
</ParamField>
<ParamField path="count" type="number">Количество создаваемых изображений (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Необязательный тайм-аут запроса к поставщику в миллисекундах. Когда Codex
  вызывает `image_generate` через динамические инструменты, это значение для
  отдельного вызова по-прежнему переопределяет настроенное значение по умолчанию
  и ограничивается 600000 мс.
</ParamField>
<ParamField path="filename" type="string">Подсказка имени выходного файла.</ParamField>
<ParamField path="openai" type="object">
  Подсказки только для OpenAI: `background`, `moderation`, `outputCompression`
  и `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Управление творческой свободой fal Krea 2. Значение по умолчанию — `medium`.
</ParamField>

<Note>
Не все поставщики поддерживают все параметры. Если резервный поставщик
поддерживает близкий вариант геометрии вместо точно запрошенного, OpenClaw
перед отправкой сопоставляет запрос с ближайшим поддерживаемым размером,
соотношением сторон или разрешением. Неподдерживаемые подсказки вывода
отбрасываются для поставщиков, которые не заявляют их поддержку, и указываются
в результате работы инструмента. Результаты инструмента содержат применённые
настройки; `details.normalization` описывает любое преобразование запрошенных
значений в применённые.
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

### Порядок выбора поставщиков

OpenClaw пробует поставщиков в следующем порядке:

1. Параметр **`model`** из вызова инструмента (если агент его указывает).
2. **`imageGenerationModel.primary`** из конфигурации.
3. **`imageGenerationModel.fallbacks`** по порядку.
4. **Автоматическое определение** — только значения по умолчанию для провайдеров с настроенной аутентификацией:
   - сначала текущий провайдер по умолчанию;
   - затем остальные зарегистрированные провайдеры генерации изображений в порядке идентификаторов провайдеров.

Если провайдер завершается с ошибкой (ошибка аутентификации, ограничение частоты запросов и т. д.), автоматически выполняется попытка использовать следующего настроенного
кандидата. Если все попытки завершаются неудачно, ошибка содержит подробные сведения
о каждой из них.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Переопределение `model` для отдельного вызова задействует только указанные провайдер и модель и
    не переходит к настроенным основному или резервным провайдерам либо автоматически определённым провайдерам.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    Модель провайдера по умолчанию включается в список кандидатов, только если OpenClaw
    действительно может пройти аутентификацию у этого провайдера. Установите
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, чтобы использовать только
    явно заданные записи `model`, `primary` и `fallbacks`.
  </Accordion>
  <Accordion title="Timeouts">
    Для медленных серверных систем генерации изображений задайте `agents.defaults.imageGenerationModel.timeoutMs`.
    Параметр инструмента `timeoutMs` для отдельного вызова переопределяет настроенное
    значение по умолчанию, а настроенные значения по умолчанию переопределяют значения провайдера
    по умолчанию, заданные Plugin. Для провайдеров изображений Google и OpenRouter
    по умолчанию используется 180 секунд; для генерации изображений Microsoft Foundry MAI,
    xAI и Azure OpenAI — 600 секунд. Вызовы динамических инструментов Codex используют
    значение по умолчанию 120 секунд для моста `image_generate` и при наличии настройки соблюдают
    тот же бюджет времени ожидания, ограниченный максимальным значением моста динамических
    инструментов OpenClaw в 600000 мс.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Используйте `action: "list"`, чтобы просмотреть зарегистрированных в данный момент провайдеров,
    их модели по умолчанию и подсказки по переменным среды для аутентификации.
  </Accordion>
</AccordionGroup>

### Редактирование изображений

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI и xAI поддерживают редактирование исходных изображений. Модели Krea 2 в fal используют
те же поля `image` / `images` в качестве стилевых референсов, а не входных данных
для редактирования. Передайте путь или URL исходного изображения:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter и Google поддерживают до 5 исходных изображений через
параметр `images`; xAI поддерживает до 3. fal поддерживает 1 исходное изображение для
преобразования изображения в изображение с Flux, до 10 для редактирования с GPT Image 2, до 10 стилевых референсов
для Krea 2 и до 14 для редактирования с Nano Banana 2. Microsoft Foundry, MiniMax
и ComfyUI поддерживают 1.

## Подробный обзор провайдеров

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    Для генерации изображений OpenAI по умолчанию используется `openai/gpt-image-2`. Если настроен
    профиль OAuth `openai`, OpenClaw повторно использует тот же
    профиль OAuth, который применяется моделями чата подписки Codex, и отправляет
    запрос изображения через серверную систему Codex Responses. Устаревшие базовые
    URL Codex, например `https://chatgpt.com/backend-api`, канонизируются в
    `https://chatgpt.com/backend-api/codex` для запросов изображений. OpenClaw
    **не** переключается незаметно на `OPENAI_API_KEY` для такого запроса —
    чтобы принудительно направить запрос непосредственно в OpenAI Images API, явно настройте
    `models.providers.openai` с ключом API, пользовательским базовым URL
    или конечной точкой Azure.

    Модели `openai/gpt-image-1.5`, `openai/gpt-image-1` и
    `openai/gpt-image-1-mini` по-прежнему можно выбирать явно. Используйте
    `gpt-image-1.5` для вывода PNG/WebP с прозрачным фоном; текущий
    API `gpt-image-2` отклоняет `background: "transparent"`.

    `gpt-image-2` поддерживает как генерацию изображений по тексту, так и
    редактирование исходных изображений через один и тот же инструмент `image_generate`.
    OpenClaw передаёт в OpenAI параметры `prompt`, `count`, `size`, `quality`, `outputFormat`
    и исходные изображения. OpenAI **не** получает напрямую
    `aspectRatio` или `resolution`; когда это возможно, OpenClaw преобразует
    их в поддерживаемый параметр `size`, иначе инструмент сообщает о них как
    об проигнорированных переопределениях.

    Параметры, специфичные для OpenAI, находятся в объекте `openai`:

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
    для вывода с прозрачностью требуется `outputFormat` со значением `png` или `webp` и
    модель изображений OpenAI, поддерживающая прозрачность. OpenClaw направляет запросы
    к `gpt-image-2` по умолчанию с прозрачным фоном в `gpt-image-1.5`.
    `openai.outputCompression` применяется к выводу JPEG/WebP и игнорируется
    для вывода PNG.

    Подсказка верхнего уровня `background` не зависит от провайдера и в настоящее время
    сопоставляется с тем же полем запроса OpenAI `background`, когда выбран провайдер
    OpenAI. Провайдеры, которые не заявляют о поддержке фона, возвращают
    её в `ignoredOverrides`, не получая неподдерживаемый параметр.

    Чтобы направить генерацию изображений OpenAI через развёртывание Azure OpenAI
    вместо `api.openai.com`, см.
    [конечные точки Azure OpenAI](/ru/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    Генерация изображений Microsoft Foundry использует имена развёртываний изображений MAI
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
    - Аутентификация: `AZURE_OPENAI_API_KEY` / ключ API провайдера либо Entra ID через `az login`
    - Вывод: одно изображение PNG
    - Размер: по умолчанию `1024x1024`; ширина и высота должны быть не менее 768 пикселей каждая,
      а общее количество пикселей — не более 1 048 576
    - Редактирование: одно исходное изображение PNG или JPEG; поддерживается только
      развёртываниями `MAI-Image-2.5-Flash` и `MAI-Image-2.5`

    Для генерации только по запросу можно использовать пользовательское имя развёртывания, настроив лишь
    конечную точку Foundry. Для редактирования с пользовательскими именами развёртываний необходимы
    метаданные начальной настройки или модели, чтобы OpenClaw мог проверить, что развёртывание
    основано на `MAI-Image-2.5-Flash` или `MAI-Image-2.5`.

    Текущие модели изображений MAI: `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` и `MAI-Image-2`. Инструкции по настройке
    и описание поведения моделей чата см. в разделе
    [Plugin Microsoft Foundry](/ru/plugins/reference/microsoft-foundry).

  </Accordion>
  <Accordion title="OpenRouter image models">
    Генерация изображений OpenRouter использует тот же `OPENROUTER_API_KEY` и
    направляет запросы через API изображений завершений чата OpenRouter. Выбирайте
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

    OpenClaw передаёт в OpenRouter `prompt`, `count`, исходные изображения и
    совместимые с Gemini подсказки `aspectRatio` / `resolution`.
    Текущие встроенные сокращения моделей изображений OpenRouter включают
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` и `openai/gpt-5.4-image-2`. Используйте
    `action: "list"`, чтобы увидеть, что предоставляет настроенный Plugin.

  </Accordion>
  <Accordion title="fal Krea 2">
    Модели Krea 2 в fal используют собственную схему Krea от fal вместо общей
    схемы `image_size`, применяемой Flux. OpenClaw отправляет:

    - `aspect_ratio` для подсказок соотношения сторон
    - `creativity`, по умолчанию `medium`
    - `image_style_references`, когда переданы `image` или `images`

    Выберите Krea 2 Medium для более быстрой выразительной иллюстрации, а Krea 2 Large —
    для более медленных, детализированных фотореалистичных и текстурных изображений:

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

    В настоящее время Krea 2 возвращает одно изображение на запрос. Для Krea предпочтительно использовать `aspectRatio`;
    OpenClaw сопоставляет `size` с ближайшим поддерживаемым Krea соотношением сторон и
    отклоняет `resolution` для Krea, а не отбрасывает его. Используйте `fal.creativity`,
    если требуется собственный уровень креативности Krea:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    Генерация изображений MiniMax доступна через оба встроенных
    способа аутентификации MiniMax:

    - `minimax/image-01` для настроек с ключом API
    - `minimax-portal/image-01` для настроек OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Встроенный провайдер xAI использует `/v1/images/generations` для запросов
    только с текстовым описанием и `/v1/images/edits`, когда присутствует `image` или `images`.

    - Модели: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Количество: до 4
    - Референсы: одно `image` или до трёх `images`
    - Соотношения сторон: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Разрешения: `1K`, `2K`
    - Вывод: возвращается в виде вложений изображений, управляемых OpenClaw

    OpenClaw намеренно не предоставляет собственные параметры xAI `quality`, `mask`,
    `user` и соотношение сторон `auto`, пока эти элементы управления не появятся в общем
    межпровайдерном контракте `image_generate`.

  </Accordion>
</AccordionGroup>

## Примеры

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Эквивалентная команда CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Generate (OpenAI low quality)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

Эквивалентная команда CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Генерация (два квадратных изображения)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Два визуальных направления для значка приложения для спокойной продуктивной работы" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Редактирование (одно референсное изображение)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Сохранить объект, заменить фон на яркую студийную обстановку" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Редактирование (несколько референсных изображений)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Объединить образ персонажа из первого изображения с цветовой палитрой из второго" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Стилевые референсы Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="Выразительный редакционный портрет с использованием этой цветовой палитры и текстуры печати" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Те же флаги `--output-format`, `--background`, `--quality` и
`--openai-moderation` доступны для `openclaw infer image edit`;
`--openai-background` остаётся псевдонимом, специфичным для OpenAI. В настоящее
время встроенные провайдеры, кроме OpenAI, не заявляют явное управление фоном,
поэтому для них параметр `background: "transparent"` помечается как
проигнорированный.

## Связанные материалы

- [Обзор инструментов](/ru/tools) — все доступные инструменты агента
- [ComfyUI](/ru/providers/comfy) — настройка локальных рабочих процессов ComfyUI и Comfy Cloud
- [fal](/ru/providers/fal) — настройка провайдера изображений и видео fal
- [Google (Gemini)](/ru/providers/google) — настройка провайдера изображений Gemini
- [Plugin Microsoft Foundry](/ru/plugins/reference/microsoft-foundry) — настройка чата Microsoft Foundry и изображений MAI
- [MiniMax](/ru/providers/minimax) — настройка провайдера изображений MiniMax
- [OpenAI](/ru/providers/openai) — настройка провайдера OpenAI Images
- [Vydra](/ru/providers/vydra) — настройка изображений, видео и речи Vydra
- [xAI](/ru/providers/xai) — настройка изображений, видео, поиска, выполнения кода и синтеза речи Grok
- [Справочник по конфигурации](/ru/gateway/config-agents#agent-defaults) — конфигурация `imageGenerationModel`
- [Модели](/ru/concepts/models) — конфигурация моделей и аварийное переключение
