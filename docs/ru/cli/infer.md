---
read_when:
    - Добавление или изменение команд `openclaw infer`
    - Проектирование стабильной автоматизации возможностей в безголовом режиме
summary: CLI с приоритетом автоматического определения для рабочих процессов с моделями, изображениями, аудио, TTS, видео, веб-доступом и эмбеддингами на базе провайдеров
title: CLI для логического вывода
x-i18n:
    generated_at: "2026-07-12T11:16:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` — канонический интерфейс без графической оболочки для выполнения инференса через провайдеров. Он предоставляет семейства возможностей (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), а не необработанные имена RPC Gateway или идентификаторы инструментов агента. `openclaw capability ...` — псевдоним для того же дерева команд.

Почему стоит предпочесть его одноразовой обёртке для провайдера:

- Повторно использует провайдеров и модели, уже настроенные в OpenClaw.
- Предоставляет стабильную оболочку `--json` для скриптов и автоматизации, управляемой агентами (см. [Вывод JSON](#json-output)).
- Для большинства подкоманд выполняется по обычному локальному пути без Gateway.
- При сквозных проверках провайдера задействует поставляемый CLI, загрузку конфигурации, определение агента по умолчанию, активацию встроенных плагинов и общую среду выполнения возможностей до отправки запроса провайдеру.

## Превращение infer в Skills

Скопируйте и вставьте следующий текст агенту:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Хороший Skill на основе infer сопоставляет распространённые намерения пользователя с подходящей подкомандой, содержит несколько канонических примеров для каждого рабочего процесса, предпочитает `openclaw infer ...` низкоуровневым альтернативам и не дублирует в тексте Skill документацию по всему интерфейсу infer.

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

## Распространённые задачи

| Задача                                        | Команда                                                                                       | Примечания                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Выполнить текстовый запрос к модели           | `openclaw infer model run --prompt "..." --json`                                              | По умолчанию локально                                             |
| Выполнить запрос к модели с изображениями     | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Повторите `--file` для нескольких изображений                     |
| Создать изображение                           | `openclaw infer image generate --prompt "..." --json`                                         | При работе с существующим файлом используйте `image edit`         |
| Описать файл изображения или URL              | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` должна указывать поддерживающую изображения модель `<provider/model>` |
| Транскрибировать аудио                         | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` должна иметь вид `<provider/model>`                      |
| Синтезировать речь                            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` выполняется только через Gateway                     |
| Создать видео                                 | `openclaw infer video generate --prompt "..." --json`                                         | Поддерживает подсказки провайдеру, например `--resolution`        |
| Описать видеофайл                             | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` должна иметь вид `<provider/model>`                      |
| Выполнить поиск в интернете                   | `openclaw infer web search --query "..." --json`                                              |                                                                   |
| Получить веб-страницу                         | `openclaw infer web fetch --url https://example.com --json`                                   |                                                                   |
| Создать эмбеддинги                            | `openclaw infer embedding create --text "..." --json`                                         |                                                                   |

## Поведение

- Используйте `--json`, когда вывод передаётся другой команде или скрипту; в остальных случаях используйте текстовый вывод.
- Используйте `--provider` или `--model provider/model`, чтобы закрепить конкретный бэкенд.
- Используйте `model run --thinking <level>` для однократного переопределения уровня обдумывания/рассуждения: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` или `max`.
- Для `image describe`, `audio transcribe` и `video describe` значение `--model` должно иметь вид `<provider/model>`.
- Для `image describe` параметр `--file` принимает локальные пути и URL HTTP(S); удалённые URL обрабатываются в соответствии с обычной политикой защиты от SSRF при получении медиаданных.
- Команды выполнения без сохранения состояния (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) по умолчанию выполняются локально. Команды состояния под управлением Gateway (`tts status`) по умолчанию выполняются через Gateway.
- Для локального пути работающий Gateway не требуется.
- Локальный `model run` — облегчённое однократное обращение к провайдеру: команда определяет настроенную модель агента и данные аутентификации, но не запускает ход чат-агента, не загружает инструменты и не открывает встроенные серверы MCP.
- `model run --file` прикрепляет к запросу файлы изображений с автоматическим определением MIME-типа; повторите `--file` для нескольких изображений. Файлы, не являющиеся изображениями, отклоняются — вместо этого используйте `infer audio transcribe` или `infer video describe`.
- `model run --gateway` проверяет маршрутизацию Gateway, сохранённые данные аутентификации, выбор провайдера и встроенную среду выполнения, но остаётся непосредственной проверкой модели: без предыдущей расшифровки сеанса, контекста начальной загрузки/AGENTS, инструментов и встроенных серверов MCP.
- Для `model run --gateway --model <provider/model>` требуются учётные данные доверенного оператора Gateway, поскольку эта команда запрашивает у Gateway однократное переопределение провайдера/модели.

## Модель

Текстовый инференс и просмотр сведений о моделях и провайдерах.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Используйте полные ссылки `<provider/model>` с `--local`, чтобы выполнить быструю проверку одного провайдера без запуска Gateway или загрузки интерфейса инструментов агента:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Примечания:

- Локальный `model run` — наиболее узкая быстрая проверка работоспособности провайдера, модели и аутентификации в CLI: для провайдеров, отличных от ChatGPT-Codex, передаётся только указанный запрос.
- Локальный `model run --model <provider/model>` может находить точные строки встроенного статического каталога — те же строки, которые показывает `openclaw models list --all`, — до записи этого провайдера в конфигурацию. Аутентификация у провайдера по-прежнему обязательна; при отсутствии учётных данных возвращается ошибка аутентификации, а не `Unknown model`.
- При проверке рассуждений Mistral Medium 3.5 не задавайте температуру и оставьте значение по умолчанию. Mistral отклоняет `reasoning_effort="high"` при `temperature: 0`; используйте температуру по умолчанию или ненулевое значение, например `0.7`.
- Локальные проверки OpenAI ChatGPT/Codex OAuth через API `openai-chatgpt-responses` добавляют минимальную системную инструкцию, чтобы транспорт мог заполнить обязательное поле `instructions`, — без полного контекста агента, инструментов, памяти или расшифровки сеанса.
- `model run --file` прикрепляет содержимое изображения непосредственно к единственному сообщению пользователя. Распространённые форматы (PNG, JPEG, WebP) работают, если MIME-тип определяется как `image/*`; неподдерживаемые или нераспознанные файлы отклоняются до обращения к провайдеру. Используйте вместо этого `infer image describe`, если требуется маршрутизация по моделям изображений и резервные варианты OpenClaw, а не непосредственная проверка мультимодальной модели.
- Выбранная модель должна поддерживать ввод изображений; модели, работающие только с текстом, могут отклонить запрос на уровне провайдера.
- `model run --prompt` должен содержать текст, состоящий не только из пробельных символов; пустые запросы отклоняются до обращения к провайдеру или Gateway.
- Локальный `model run` завершается с ненулевым кодом, если провайдер не возвращает текстовый результат, поэтому недоступные провайдеры и пустые ответы не выглядят как успешные проверки.
- Используйте `model run --gateway` для проверки маршрутизации Gateway или настройки среды выполнения агента при сохранении необработанного ввода модели. Для полного контекста агента, инструментов, памяти и расшифровки сеанса используйте `openclaw agent` или интерфейс чата.
- `--thinking adaptive` соответствует уровню `medium` среды выполнения завершений; `--thinking max` соответствует `max` для моделей OpenAI, поддерживающих нативный максимальный уровень усилий, а для остальных — `xhigh`.
- `model auth login`, `model auth logout` и `model auth status` управляют сохранённым состоянием аутентификации провайдера.

## Изображения

Создание, редактирование и описание.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Примечания:

- Используйте `image edit`, если начинаете с существующих входных файлов; `--size`, `--aspect-ratio` или `--resolution` добавляют подсказки о геометрии для поддерживающих их провайдеров и моделей.
- `--output-format png --background transparent` с `--model openai/gpt-image-1.5` создаёт PNG-изображение OpenAI с прозрачным фоном; `--openai-background` — специфичный для OpenAI псевдоним той же подсказки. Провайдеры, которые не заявляют поддержку фона, сообщают о ней как о проигнорированном переопределении (см. `ignoredOverrides` в [оболочке JSON](#json-output)).
- `--quality low|medium|high|auto` работает с провайдерами, поддерживающими подсказки о качестве изображения, включая OpenAI. OpenAI также принимает `--openai-moderation low|auto`.
- `image providers --json` показывает, какие встроенные провайдеры изображений обнаружены, настроены и выбраны, а также какие возможности генерации и редактирования предоставляет каждый из них.
- `image generate --model <provider/model> --json` — наиболее узкая оперативная дымовая проверка изменений генерации изображений:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Ответ содержит `ok`, `provider`, `model`, `attempts` и пути записанных выходных файлов. Если указан `--output`, итоговое расширение может соответствовать MIME-типу, возвращённому провайдером.

- Для `image describe` и `image describe-many` используйте `--prompt`, чтобы задать инструкцию для конкретной задачи (OCR, сравнение, проверка интерфейса, краткое описание).
- Используйте `--timeout-ms` для медленных локальных моделей компьютерного зрения или холодного запуска Ollama.
- Для `image describe` сначала запускается явно заданная через `--model` модель (это должна быть поддерживающая изображения модель `<provider/model>`), а при сбое вызова перебираются настроенные резервные модели из `agents.defaults.imageModel.fallbacks`. Ошибки подготовки входных данных (отсутствующий файл, неподдерживаемый URL) приводят к сбою до попыток использовать резервные модели, а модель должна поддерживать изображения согласно каталогу моделей или конфигурации провайдера.
- Для локальных моделей компьютерного зрения Ollama сначала загрузите модель и задайте для `OLLAMA_API_KEY` любое значение-заполнитель, например `ollama-local`. См. [Ollama](/ru/providers/ollama#vision-and-image-description).

## Аудио

Транскрибирование файлов (не управление сеансами в реальном времени).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Значение `--model` должно иметь вид `<provider/model>`.

## TTS

Синтез речи и состояние провайдера/персоны TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Примечания:

- `tts status` поддерживает только `--gateway` (команда отражает состояние TTS, управляемое Gateway).
- Используйте `tts providers`, `tts voices`, `tts personas`, `tts set-provider` и `tts set-persona` для просмотра и настройки поведения TTS.

## Видео

Генерация и описание.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Примечания:

- `video generate` принимает `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` и `--timeout-ms`, которые передаются среде выполнения генерации видео.
- Для `video describe` значение `--model` должно иметь вид `<provider/model>`.

## Веб

Поиск и получение данных.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` показывает доступных, настроенных и выбранных провайдеров для поиска и получения данных.

## Векторные представления

Создание векторов и просмотр провайдеров векторных представлений.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
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

Для команд генерации медиаданных `outputs` содержит файлы, записанные OpenClaw. Для автоматизации используйте значения `path`, `mimeType`, `size` и любые относящиеся к конкретному типу медиаданных размеры из этого массива вместо анализа предназначенного для чтения человеком стандартного вывода.

## Распространённые ошибки

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Модели](/ru/concepts/models)
