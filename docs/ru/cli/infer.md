---
read_when:
    - Добавление или изменение команд `openclaw infer`
    - Проектирование стабильной автоматизации возможностей в безголовом режиме
summary: CLI с приоритетом автоматического определения для рабочих процессов с моделями, изображениями, аудио, TTS, видео, вебом и эмбеддингами на базе провайдеров
title: CLI для инференса
x-i18n:
    generated_at: "2026-07-13T17:58:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` — канонический безголовый интерфейс для инференса через провайдеров. Он предоставляет семейства возможностей (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), а не необработанные имена RPC Gateway или идентификаторы инструментов агента. `openclaw capability ...` — псевдоним того же дерева команд.

Причины предпочесть его одноразовой обёртке провайдера:

- Повторно использует провайдеров и модели, уже настроенные в OpenClaw.
- Стабильная оболочка `--json` для скриптов и автоматизации под управлением агентов (см. [Вывод JSON](#json-output)).
- Для большинства подкоманд выполняет обычный локальный путь без Gateway.
- При сквозных проверках провайдеров задействует поставляемый CLI, загрузку конфигурации, разрешение агента по умолчанию, активацию встроенных плагинов и общую среду выполнения возможностей до отправки запроса провайдеру.

## Превращение infer в навык

Скопируйте и вставьте это агенту:

```text
Прочитай https://docs.openclaw.ai/cli/infer, затем создай навык, который направляет мои типичные рабочие процессы в `openclaw infer`.
Сосредоточься на запусках моделей, генерации изображений, генерации видео, транскрибировании аудио, TTS, веб-поиске и эмбеддингах.
```

Хороший навык на основе infer сопоставляет типичные намерения пользователя с подходящей подкомандой, содержит несколько канонических примеров для каждого рабочего процесса, предпочитает `openclaw infer ...` низкоуровневым альтернативам и не дублирует в теле навыка документацию всей поверхности infer.

## Дерево команд

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    personas
    status
    enable
    disable
    set-provider
    set-persona

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

`infer list` / `infer inspect --name <capability>` отображают это дерево в виде данных (идентификатор возможности, транспорты, описание).

## Типичные задачи

| Задача                        | Команда                                                                                       | Примечания                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Выполнить текстовый запрос к модели | `openclaw infer model run --prompt "..." --json`                                              | По умолчанию локально                                 |
| Выполнить запрос к модели с изображениями | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Повторите `--file` для нескольких изображений        |
| Создать изображение           | `openclaw infer image generate --prompt "..." --json`                                         | При использовании существующего файла укажите `image edit` |
| Описать файл изображения или URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` должен быть поддерживающим изображения `<provider/model>` |
| Транскрибировать аудио        | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` должен быть `<provider/model>`              |
| Синтезировать речь            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` выполняется только через Gateway          |
| Создать видео                 | `openclaw infer video generate --prompt "..." --json`                                         | Поддерживает подсказки провайдера, такие как `--resolution` |
| Описать видеофайл             | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` должен быть `<provider/model>`              |
| Выполнить веб-поиск           | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Получить веб-страницу         | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Создать эмбеддинги            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Поведение

- Используйте `--json`, когда вывод передаётся другой команде или скрипту; в остальных случаях используйте текстовый вывод.
- Используйте `--provider` или `--model provider/model`, чтобы зафиксировать конкретный бэкенд.
- Используйте `model run --thinking <level>` для разового переопределения режима размышления/рассуждения: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` или `max`.
- Для `image describe`, `audio transcribe` и `video describe` значение `--model` должно иметь вид `<provider/model>`.
- Для `image describe` параметр `--file` принимает локальные пути и URL HTTP(S); удалённые URL обрабатываются согласно обычной политике защиты от SSRF при получении медиафайлов.
- Команды выполнения без сохранения состояния (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) по умолчанию выполняются локально. Команды состояния под управлением Gateway (`tts status`) по умолчанию выполняются через Gateway.
- Для локального пути работающий Gateway не требуется.
- Локальный `model run` выполняет облегчённое одноразовое дополнение через провайдера: он разрешает настроенную модель и аутентификацию агента, но не начинает ход агента чата, не загружает инструменты и не открывает встроенные серверы MCP.
- `model run --file` прикрепляет файлы изображений (с автоматически определяемым MIME-типом) к запросу; повторите `--file` для нескольких изображений. Файлы, не являющиеся изображениями, отклоняются — вместо этого используйте `infer audio transcribe` или `infer video describe`.
- `model run --gateway` проверяет маршрутизацию Gateway, сохранённую аутентификацию, выбор провайдера и встроенную среду выполнения, но остаётся необработанной проверкой модели: без предыдущей расшифровки сеанса, контекста начальной загрузки/AGENTS, инструментов и встроенных серверов MCP.
- `model run --gateway --model <provider/model>` требует учётных данных Gateway доверенного оператора, поскольку запрашивает у Gateway одноразовое переопределение провайдера/модели.

## Модель

Текстовый инференс и проверка моделей/провайдеров.

```bash
openclaw infer model run --prompt "Ответь в точности: smoke-ok" --json
openclaw infer model run --prompt "Кратко изложи эту запись журнала изменений" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Опиши это изображение одним предложением" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Используй здесь более глубокие рассуждения" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Используйте полные ссылки `<provider/model>` с `--local`, чтобы выполнить быструю проверку одного провайдера без запуска Gateway или загрузки поверхности инструментов агента:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Ответь в точности: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Ответь в точности: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Ответь в точности: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Ответь в точности: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Ответь в точности: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Ответь в точности: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Ответь в точности: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Опиши это изображение." --file ./photo.jpg --json
```

Примечания:

- Локальный `model run` — наиболее узкая быстрая проверка CLI для работоспособности провайдера, модели и аутентификации: для провайдеров, отличных от ChatGPT-Codex, он отправляет только указанный запрос.
- Локальный `model run --model <provider/model>` может разрешать точные строки встроенного статического каталога (те же строки, которые показывает `openclaw models list --all`) до записи этого провайдера в конфигурацию. Аутентификация провайдера всё равно обязательна; отсутствие учётных данных приводит к ошибкам аутентификации, а не к `Unknown model`.
- При проверках рассуждения Mistral Medium 3.5 не задавайте температуру и оставьте значение по умолчанию. Mistral отклоняет `reasoning_effort="high"` с `temperature: 0`; используйте температуру по умолчанию или ненулевое значение, например `0.7`.
- Локальные проверки OpenAI ChatGPT/Codex OAuth (API `openai-chatgpt-responses`) добавляют минимальную системную инструкцию, чтобы транспорт мог заполнить обязательное поле `instructions`, — без полного контекста агента, инструментов, памяти или расшифровки сеанса.
- `model run --file` прикрепляет содержимое изображения непосредственно к единственному сообщению пользователя. Распространённые форматы (PNG, JPEG, WebP) работают, если MIME-тип определён как `image/*`; неподдерживаемые или нераспознанные файлы отклоняются до вызова провайдера. Используйте вместо этого `infer image describe`, если вам нужны маршрутизация моделей изображений и резервные варианты OpenClaw, а не прямая проверка мультимодальной модели.
- Выбранная модель должна поддерживать ввод изображений; модели только для текста могут отклонить запрос на уровне провайдера.
- `model run --prompt` должен содержать текст, состоящий не только из пробельных символов; пустые запросы отклоняются до любого вызова провайдера или Gateway.
- Локальный `model run` завершается с ненулевым кодом, если провайдер не возвращает текстовый вывод, поэтому недоступные провайдеры и пустые дополнения не выглядят как успешные проверки.
- Используйте `model run --gateway` для проверки маршрутизации Gateway или настройки среды выполнения агента, сохраняя ввод модели необработанным. Используйте `openclaw agent` или интерфейс чата для полного контекста агента, инструментов, памяти и расшифровки сеанса.
- `--thinking adaptive` соответствует уровню среды выполнения дополнения `medium`; `--thinking max` соответствует `max` для моделей OpenAI, поддерживающих встроенное максимальное усилие, а иначе — `xhigh`.
- `model auth login`, `model auth logout` и `model auth status` управляют сохранённым состоянием аутентификации провайдера.

## Изображение

Генерация, редактирование и описание.

```bash
openclaw infer image generate --prompt "дружелюбная иллюстрация лобстера" --json
openclaw infer image generate --prompt "кинематографичная предметная фотография наушников" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "простая наклейка в виде красного круга на прозрачном фоне" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "недорогой черновик плаката" --json
openclaw infer image generate --prompt "медленный бэкенд изображений" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "сохрани логотип, удали фон" --json
openclaw infer image edit --file ./poster.png --prompt "преврати это в вертикальную рекламу для историй" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Извлеки продавца, дату и итоговую сумму" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Сравни снимки экрана и перечисли видимые изменения интерфейса" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Опиши изображение одним предложением" --timeout-ms 300000 --json
```

Примечания:

- Используйте `image edit` при работе с существующими входными файлами; `--size`, `--aspect-ratio` или `--resolution` добавляют подсказки по геометрии для поддерживающих их провайдеров и моделей.
- `--output-format png --background transparent` вместе с `--model openai/gpt-image-1.5` создаёт PNG-изображение OpenAI с прозрачным фоном; `--openai-background` — специфичный для OpenAI псевдоним той же подсказки. Провайдеры, которые не заявляют поддержку фона, указывают её как проигнорированное переопределение (см. `ignoredOverrides` в [оболочке JSON](#json-output)).
- `--quality low|medium|high|auto` работает с провайдерами, поддерживающими подсказки по качеству изображения, включая OpenAI. OpenAI также принимает `--openai-moderation low|auto`.
- `image providers --json` показывает, какие встроенные провайдеры изображений обнаружены, настроены и выбраны, а также какие возможности генерации и редактирования предоставляет каждый из них.
- `image generate --model <provider/model> --json` — наиболее узкая живая дымовая проверка изменений генерации изображений:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Минималистичное плоское тестовое изображение: один синий квадрат на белом фоне, без текста." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Ответ содержит `ok`, `provider`, `model`, `attempts` и пути записанных выходных файлов. Если задан `--output`, итоговое расширение может соответствовать типу MIME, возвращённому провайдером.

- Для `image describe` и `image describe-many` используйте `--prompt`, чтобы задать инструкцию для конкретной задачи (OCR, сравнение, проверка интерфейса, краткое описание).
- Используйте `--timeout-ms` для медленных локальных моделей компьютерного зрения или холодного запуска Ollama.
- Для `image describe` сначала запускается явно указанная `--model` (это должна быть поддерживающая изображения `<provider/model>`), а при сбое этого вызова выполняется попытка использовать настроенные `agents.defaults.imageModel.fallbacks`. Ошибки подготовки входных данных (отсутствующий файл, неподдерживаемый URL) приводят к сбою до любой попытки резервного перехода, а модель должна поддерживать изображения согласно каталогу моделей или конфигурации провайдера.
- Для локальных моделей компьютерного зрения Ollama сначала загрузите модель и задайте для `OLLAMA_API_KEY` любое значение-заполнитель, например `ollama-local`. См. [Ollama](/ru/providers/ollama#vision-and-image-description).

## Аудио

Транскрибирование файлов (не управление сеансами в реальном времени).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Сосредоточьтесь на именах и пунктах действий" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` должен быть `<provider/model>`.

## TTS

Синтез речи и состояние провайдера/персоны TTS.

```bash
openclaw infer tts convert --text "привет от openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Сборка завершена" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Примечания:

- `tts status` поддерживает только `--gateway` (он отражает состояние TTS, управляемое Gateway).
- Используйте `tts providers`, `tts voices`, `tts personas`, `tts set-provider` и `tts set-persona` для проверки и настройки поведения TTS.

## Видео

Генерация и описание.

```bash
openclaw infer video generate --prompt "кинематографичный закат над океаном" --json
openclaw infer video generate --prompt "медленный пролёт дрона над лесным озером" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Примечания:

- `video generate` принимает `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` и `--timeout-ms`, которые передаются среде выполнения генерации видео.
- `--model` должен быть `<provider/model>` для `video describe`.

## Веб

Поиск и получение данных.

```bash
openclaw infer web search --query "Документация OpenClaw" --json
openclaw infer web search --query "Провайдеры OpenClaw infer web" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` показывает доступных, настроенных и выбранных провайдеров для поиска и получения данных.

## Векторные представления

Создание векторов и проверка провайдеров векторных представлений.

```bash
openclaw infer embedding create --text "дружелюбный лобстер" --json
openclaw infer embedding create --text "обращение в службу поддержки: задержка доставки" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Вывод JSON

Команды Infer нормализуют вывод JSON с помощью общей оболочки:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Стабильные поля верхнего уровня:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (вложения изображений, отправленные с запросом, если применимо)
- `outputs`
- `ignoredOverrides` (ключи подсказок, которые провайдер не поддерживает, если применимо)
- `error`

Для команд генерации медиа `outputs` содержит файлы, записанные OpenClaw. Для автоматизации используйте `path`, `mimeType`, `size` и все специфичные для медиа размеры из этого массива вместо разбора удобочитаемого вывода stdout.

## Распространённые ошибки

```bash
# Неправильно
openclaw infer media image generate --prompt "дружелюбный лобстер"

# Правильно
openclaw infer image generate --prompt "дружелюбный лобстер"
```

```bash
# Неправильно
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Правильно
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Модели](/ru/concepts/models)
