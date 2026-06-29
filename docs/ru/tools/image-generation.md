---
read_when:
    - Создание или редактирование изображений через агента
    - Настройка провайдеров и моделей генерации изображений
    - Понимание параметров инструмента image_generate
sidebarTitle: Image generation
summary: Генерируйте и редактируйте изображения с помощью image_generate в OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Генерация изображений
x-i18n:
    generated_at: "2026-06-28T23:53:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

Инструмент `image_generate` позволяет агенту создавать и редактировать изображения с помощью настроенных вами провайдеров. В чат-сессиях генерация изображений выполняется асинхронно: OpenClaw регистрирует фоновую задачу, сразу возвращает идентификатор задачи и пробуждает агента, когда провайдер завершает работу. Агент завершения следует обычному для сессии режиму видимого ответа: автоматическая доставка финального ответа, если она настроена, или `message(action="send")`, когда сессия требует инструмент сообщений. Если сессия инициатора неактивна или ее активное пробуждение не удалось, а часть сгенерированных изображений все еще отсутствует в ответе завершения, OpenClaw отправляет идемпотентный прямой запасной ответ только с недостающими изображениями.

<Note>
Инструмент появляется только тогда, когда доступен хотя бы один провайдер генерации изображений. Если вы не видите `image_generate` среди инструментов своего агента, настройте `agents.defaults.imageGenerationModel`, задайте API-ключ провайдера или войдите через OpenAI ChatGPT/Codex OAuth.
</Note>

## Быстрый старт

<Steps>
  <Step title="Настройте аутентификацию">
    Задайте API-ключ как минимум для одного провайдера (например, `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) или войдите через OpenAI Codex OAuth.
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

    ChatGPT/Codex OAuth использует ту же ссылку на модель `openai/gpt-image-2`. Когда настроен OAuth-профиль `openai`, OpenClaw направляет запросы изображений через этот OAuth-профиль вместо того, чтобы сначала пробовать `OPENAI_API_KEY`. Явная конфигурация `models.providers.openai` (API-ключ, пользовательский/Azure базовый URL) снова выбирает прямой маршрут OpenAI Images API.

  </Step>
  <Step title="Попросите агента">
    _"Generate an image of a friendly robot mascot."_

    Агент автоматически вызывает `image_generate`. Список разрешенных инструментов не нужен - он включен по умолчанию, когда доступен провайдер. Инструмент возвращает идентификатор фоновой задачи, а затем агент завершения отправляет сгенерированное вложение через инструмент `message`, когда оно будет готово.

  </Step>
</Steps>

<Warning>
Для OpenAI-совместимых LAN-эндпоинтов, таких как LocalAI, сохраняйте пользовательский `models.providers.openai.baseUrl` и явно включайте его с помощью `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Частные и внутренние эндпоинты изображений по умолчанию остаются заблокированными.
</Warning>

## Распространенные маршруты

| Цель                                                 | Ссылка на модель                                  | Аутентификация                         |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Генерация изображений OpenAI с оплатой через API     | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Генерация изображений OpenAI с аутентификацией подписки Codex | `openai/gpt-image-2`                       | OpenAI ChatGPT/Codex OAuth             |
| PNG/WebP OpenAI с прозрачным фоном                   | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` или OpenAI Codex OAuth |
| Генерация изображений DeepInfra                      | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Выразительная/стилевая генерация fal Krea 2          | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| Генерация изображений OpenRouter                     | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Генерация изображений LiteLLM                        | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Генерация изображений Microsoft Foundry MAI          | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` или Entra ID    |
| Генерация изображений Google Gemini                  | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` или `GOOGLE_API_KEY`  |

Тот же инструмент `image_generate` обрабатывает преобразование текста в изображение и редактирование по референсному изображению. Используйте `image` для одного референса или `images` для нескольких референсов. Для моделей Krea 2 на fal эти референсы отправляются как стилевые референсы, а не как входные данные для редактирования.
Поддерживаемые провайдером подсказки вывода, такие как `quality`, `outputFormat` и `background`, передаются, когда доступны, и сообщаются как проигнорированные, когда провайдер их не поддерживает. Встроенная поддержка прозрачного фона специфична для OpenAI; другие провайдеры все же могут сохранять альфа-канал PNG, если их бэкенд его выдает.

## Поддерживаемые провайдеры

| Провайдер         | Модель по умолчанию                     | Поддержка редактирования            | Аутентификация                                      |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Да (1 изображение, настроено workflow) | `COMFY_API_KEY` или `COMFY_CLOUD_API_KEY` для облака |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Да (1 изображение)                 | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Да (лимиты зависят от модели)      | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Да                                 | `GEMINI_API_KEY` или `GOOGLE_API_KEY`                 |
| LiteLLM           | `gpt-image-2`                           | Да (до 5 входных изображений)      | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Да (только модели MAI-Image-2.5)   | `AZURE_OPENAI_API_KEY` или Entra ID (`az login`)      |
| MiniMax           | `image-01`                              | Да (референс объекта)              | `MINIMAX_API_KEY` или MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Да (до 4 изображений)              | `OPENAI_API_KEY` или OpenAI ChatGPT/Codex OAuth       |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Да (до 5 входных изображений)      | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Нет                                | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Да (до 5 изображений)              | `XAI_API_KEY`                                         |

Используйте `action: "list"`, чтобы проверить доступных провайдеров и модели во время выполнения:

```text
/tool image_generate action=list
```

Используйте `action: "status"`, чтобы проверить активную задачу генерации изображений для текущей сессии:

```text
/tool image_generate action=status
```

## Возможности провайдеров

| Возможность           | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| Генерация (макс. число) | Определяется workflow | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| Редактирование / референс | 1 изображение (workflow) | 1 изображение | Flux: 1; GPT: 10; стилевые референсы Krea: 10; NB2: 14 | До 5 изображений | 1 изображение | 1 изображение (референс объекта) | До 5 изображений | - | До 5 изображений |
| Управление размером   | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | До 4K          | -     | -              |
| Соотношение сторон    | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| Разрешение (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## Параметры инструмента

<ParamField path="prompt" type="string" required>
  Промпт генерации изображения. Требуется для `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Используйте `"status"`, чтобы проверить активную задачу сессии, или `"list"`, чтобы проверить доступных провайдеров и модели во время выполнения.
</ParamField>
<ParamField path="model" type="string">
  Переопределение провайдера/модели (например, `openai/gpt-image-2`). Используйте `openai/gpt-image-1.5` для прозрачных фонов OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Путь или URL одного референсного изображения для режима редактирования.
</ParamField>
<ParamField path="images" type="string[]">
  Несколько референсных изображений для режима редактирования или моделей со стилевыми референсами (до 10 через общий инструмент; лимиты конкретных провайдеров все равно применяются).
</ParamField>
<ParamField path="size" type="string">
  Подсказка размера: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Соотношение сторон: `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`,
  `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8`. Провайдеры проверяют свой поднабор, зависящий от модели.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Подсказка разрешения.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Подсказка качества, когда провайдер ее поддерживает.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Подсказка формата вывода, когда провайдер ее поддерживает.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Подсказка фона, когда провайдер ее поддерживает. Используйте `transparent` с `outputFormat: "png"` или `"webp"` для провайдеров, поддерживающих прозрачность.
</ParamField>
<ParamField path="count" type="number">Количество изображений для генерации (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Необязательный тайм-аут запроса к провайдеру в миллисекундах. Когда Codex вызывает `image_generate` через динамические инструменты, это значение для конкретного вызова все равно переопределяет настроенное значение по умолчанию и ограничивается 600000 мс.
</ParamField>
<ParamField path="filename" type="string">Подсказка имени выходного файла.</ParamField>
<ParamField path="openai" type="object">
  Подсказки только для OpenAI: `background`, `moderation`, `outputCompression` и `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Управление креативностью fal Krea 2. По умолчанию `medium`.
</ParamField>

<Note>
Не все провайдеры поддерживают все параметры. Когда запасной провайдер поддерживает близкий вариант геометрии вместо точно запрошенного, OpenClaw перед отправкой переназначает запрос на ближайший поддерживаемый размер, соотношение сторон или разрешение. Неподдерживаемые подсказки вывода отбрасываются для провайдеров, которые не заявляют поддержку, и указываются в результате инструмента. Результаты инструмента сообщают примененные настройки; `details.normalization` фиксирует любое преобразование из запрошенного в примененное.
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

### Порядок выбора провайдера

OpenClaw пробует провайдеров в следующем порядке:

1. **Параметр `model`** из вызова инструмента (если агент его указывает).
2. **`imageGenerationModel.primary`** из конфигурации.
3. **`imageGenerationModel.fallbacks`** по порядку.
4. **Автообнаружение** - только значения по умолчанию провайдеров с доступной аутентификацией:
   - сначала текущий провайдер по умолчанию;
   - затем остальные зарегистрированные провайдеры генерации изображений в порядке идентификаторов провайдеров.

Если провайдер завершается ошибкой (ошибка аутентификации, ограничение скорости и т. д.), следующий настроенный
кандидат пробуется автоматически. Если все попытки завершаются неудачно, ошибка включает сведения
по каждой попытке.

<AccordionGroup>
  <Accordion title="Переопределения модели для отдельного вызова точны">
    Переопределение `model` для отдельного вызова пробует только этого провайдера/модель и
    не переходит к настроенным primary/fallback или автообнаруженным провайдерам.
  </Accordion>
  <Accordion title="Автообнаружение учитывает аутентификацию">
    Значение провайдера по умолчанию попадает в список кандидатов только тогда, когда OpenClaw может
    фактически аутентифицироваться у этого провайдера. Установите
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, чтобы использовать только
    явные записи `model`, `primary` и `fallbacks`.
  </Accordion>
  <Accordion title="Тайм-ауты">
    Установите `agents.defaults.imageGenerationModel.timeoutMs` для медленных бэкендов
    изображений. Параметр инструмента `timeoutMs` для отдельного вызова переопределяет настроенное
    значение по умолчанию, а настроенные значения по умолчанию переопределяют значения провайдера
    по умолчанию, заданные плагином. Размещенные у Google и OpenRouter провайдеры изображений используют значения
    по умолчанию в 180 секунд; генерация изображений Microsoft Foundry MAI, xAI и Azure OpenAI использует
    600 секунд. Вызовы динамических инструментов Codex используют 120-секундное значение по умолчанию
    моста `image_generate` и соблюдают тот же бюджет тайм-аута при настройке, ограниченный
    максимальным значением 600000 мс для моста динамических инструментов OpenClaw.
  </Accordion>
  <Accordion title="Проверка во время выполнения">
    Используйте `action: "list"`, чтобы проверить текущих зарегистрированных провайдеров,
    их модели по умолчанию и подсказки по env-переменным аутентификации.
  </Accordion>
</AccordionGroup>

### Редактирование изображений

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI и xAI поддерживают редактирование эталонных изображений. Модели Krea 2 на fal используют
те же поля `image` / `images` как стилевые референсы, а не входные данные для редактирования. Передайте
путь к эталонному изображению или URL:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google и xAI поддерживают до 5 эталонных изображений через параметр
`images`. fal поддерживает 1 эталонное изображение для Flux image-to-image, до
10 для редактирования GPT Image 2, до 10 стилевых референсов для Krea 2 и до
14 для редактирования Nano Banana 2. Microsoft Foundry, MiniMax и ComfyUI поддерживают 1.

## Подробный разбор провайдеров

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (и gpt-image-1.5)">
    Генерация изображений OpenAI по умолчанию использует `openai/gpt-image-2`. Если
    настроен OAuth-профиль `openai`, OpenClaw повторно использует тот же
    OAuth-профиль, который применяется моделями чата Codex по подписке, и отправляет
    запрос изображения через бэкенд Codex Responses. Устаревшие базовые URL Codex,
    такие как `https://chatgpt.com/backend-api`, канонизируются в
    `https://chatgpt.com/backend-api/codex` для запросов изображений. OpenClaw
    **не** выполняет тихий fallback к `OPENAI_API_KEY` для такого запроса -
    чтобы принудительно направлять запросы напрямую в OpenAI Images API, настройте
    `models.providers.openai` явно с API-ключом, пользовательским базовым URL
    или конечной точкой Azure.

    Модели `openai/gpt-image-1.5`, `openai/gpt-image-1` и
    `openai/gpt-image-1-mini` по-прежнему можно выбрать явно. Используйте
    `gpt-image-1.5` для вывода PNG/WebP с прозрачным фоном; текущий
    API `gpt-image-2` отклоняет `background: "transparent"`.

    `gpt-image-2` поддерживает как генерацию text-to-image, так и
    редактирование эталонных изображений через один и тот же инструмент `image_generate`.
    OpenClaw передает в OpenAI `prompt`, `count`, `size`, `quality`, `outputFormat`
    и эталонные изображения. OpenAI **не** получает
    `aspectRatio` или `resolution` напрямую; когда возможно, OpenClaw преобразует
    их в поддерживаемый `size`, иначе инструмент сообщает о них как о
    проигнорированных переопределениях.

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
    прозрачный вывод требует `outputFormat` `png` или `webp` и
    модель изображений OpenAI с поддержкой прозрачности. OpenClaw направляет запросы
    прозрачного фона для `gpt-image-2` по умолчанию в `gpt-image-1.5`.
    `openai.outputCompression` применяется к выводу JPEG/WebP и игнорируется
    для вывода PNG.

    Подсказка верхнего уровня `background` не зависит от провайдера и сейчас сопоставляется
    с тем же полем запроса OpenAI `background`, когда выбран провайдер OpenAI.
    Провайдеры, которые не объявляют поддержку фона, возвращают
    ее в `ignoredOverrides` вместо получения неподдерживаемого параметра.

    Чтобы направить генерацию изображений OpenAI через развертывание Azure OpenAI
    вместо `api.openai.com`, см.
    [конечные точки Azure OpenAI](/ru/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Модели изображений Microsoft Foundry MAI">
    Генерация изображений Microsoft Foundry использует имена развернутых развертываний изображений MAI
    под префиксом провайдера `microsoft-foundry/`. Значения модели по умолчанию на уровне провайдера
    нет, потому что MAI API ожидает имя вашего развертывания в поле
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

    Провайдер использует MAI API Microsoft Foundry, а не OpenAI Images API:

    - Конечная точка генерации: `/mai/v1/images/generations`
    - Конечная точка редактирования: `/mai/v1/images/edits`
    - Аутентификация: `AZURE_OPENAI_API_KEY` / API-ключ провайдера или Entra ID через `az login`
    - Вывод: одно изображение PNG
    - Размер: по умолчанию `1024x1024`; ширина и высота должны быть не менее 768 px каждая,
      а общее число пикселей должно быть не более 1 048 576
    - Редактирование: одно эталонное изображение PNG или JPEG, поддерживается только
      развертываниями `MAI-Image-2.5-Flash` и `MAI-Image-2.5`

    Генерация только по промпту может использовать пользовательское имя развертывания при наличии
    только настроенной конечной точки Foundry. Для редактирования с пользовательскими именами развертываний нужны
    onboarding/метаданные модели, чтобы OpenClaw мог проверить, что развертывание
    основано на `MAI-Image-2.5-Flash` или `MAI-Image-2.5`.

    Текущие модели изображений MAI: `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` и `MAI-Image-2`. См.
    [Plugin Microsoft Foundry](/ru/plugins/reference/microsoft-foundry) для настройки
    и поведения чат-моделей.

  </Accordion>
  <Accordion title="Модели изображений OpenRouter">
    Генерация изображений OpenRouter использует тот же `OPENROUTER_API_KEY` и
    направляет запросы через image API для chat completions OpenRouter. Выбирайте
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

    OpenClaw передает в OpenRouter `prompt`, `count`, эталонные изображения и
    совместимые с Gemini подсказки `aspectRatio` / `resolution`.
    Текущие встроенные сокращения моделей изображений OpenRouter включают
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` и `openai/gpt-5.4-image-2`. Используйте
    `action: "list"`, чтобы увидеть, что предоставляет ваш настроенный Plugin.

  </Accordion>
  <Accordion title="fal Krea 2">
    Модели Krea 2 на fal используют нативную схему Krea от fal вместо универсальной
    схемы `image_size`, используемой Flux. OpenClaw отправляет:

    - `aspect_ratio` для подсказок соотношения сторон
    - `creativity`, по умолчанию `medium`
    - `image_style_references`, когда переданы `image` или `images`

    Выбирайте Krea 2 Medium для более быстрой выразительной иллюстрации и Krea 2 Large
    для более медленного, детализированного фотореалистичного и текстурированного результата:

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

    Сейчас Krea 2 возвращает одно изображение на запрос. Для Krea предпочитайте `aspectRatio`;
    OpenClaw сопоставляет `size` с ближайшим поддерживаемым соотношением сторон Krea и
    отклоняет `resolution` для Krea, а не просто отбрасывает его. Используйте `fal.creativity`,
    когда нужен нативный уровень креативности Krea:

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
  <Accordion title="Двойная аутентификация MiniMax">
    Генерация изображений MiniMax доступна через оба встроенных пути
    аутентификации MiniMax:

    - `minimax/image-01` для настроек с API-ключом
    - `minimax-portal/image-01` для настроек с OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Встроенный провайдер xAI использует `/v1/images/generations` для запросов
    только по промпту и `/v1/images/edits`, когда присутствует `image` или `images`.

    - Модели: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Количество: до 4
    - Референсы: один `image` или до пяти `images`
    - Соотношения сторон: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Разрешения: `1K`, `2K`
    - Вывод: возвращается как вложения изображений, управляемые OpenClaw

    OpenClaw намеренно не предоставляет нативные для xAI `quality`, `mask`,
    `user` или дополнительные нативные соотношения сторон, пока эти элементы управления
    не появятся в общем межпровайдерном контракте `image_generate`.

  </Accordion>
</AccordionGroup>

## Примеры

<Tabs>
  <Tab title="Генерация (альбомная 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Генерация (прозрачный PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Эквивалентная CLI-команда:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Генерация (низкое качество OpenAI)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

Эквивалентная CLI-команда:

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
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Редактирование (один референс)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Редактирование (несколько референсов)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Референсы стиля Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Те же флаги `--output-format`, `--background`, `--quality` и
`--openai-moderation` доступны в `openclaw infer image edit`;
`--openai-background` остается псевдонимом, специфичным для OpenAI. Встроенные провайдеры,
кроме OpenAI, сейчас не объявляют явное управление фоном, поэтому
`background: "transparent"` для них сообщается как проигнорированный.

## Связанные материалы

- [Обзор инструментов](/ru/tools) - все доступные инструменты агента
- [ComfyUI](/ru/providers/comfy) - настройка локального ComfyUI и рабочего процесса Comfy Cloud
- [fal](/ru/providers/fal) - настройка провайдера изображений и видео fal
- [Google (Gemini)](/ru/providers/google) - настройка провайдера изображений Gemini
- [Plugin Microsoft Foundry](/ru/plugins/reference/microsoft-foundry) - настройка чата Microsoft Foundry и изображений MAI
- [MiniMax](/ru/providers/minimax) - настройка провайдера изображений MiniMax
- [OpenAI](/ru/providers/openai) - настройка провайдера OpenAI Images
- [Vydra](/ru/providers/vydra) - настройка изображений, видео и речи Vydra
- [xAI](/ru/providers/xai) - настройка изображений, видео, поиска, выполнения кода и TTS Grok
- [Справочник конфигурации](/ru/gateway/config-agents#agent-defaults) - конфигурация `imageGenerationModel`
- [Модели](/ru/concepts/models) - конфигурация моделей и аварийное переключение
