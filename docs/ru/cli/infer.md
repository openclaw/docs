---
read_when:
    - Добавление или изменение команд `openclaw infer`
    - Проектирование стабильной автоматизации headless-возможностей
summary: CLI в стиле infer-first для рабочих процессов с моделями, изображениями, аудио, TTS, видео, вебом и embeddings при поддержке провайдеров
title: CLI инференса
x-i18n:
    generated_at: "2026-06-28T22:43:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93ebb2a830bfbe6aad58cfa7aa2252cf016a6c9cb99b7592406593627e41fdd1
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` — каноническая headless-поверхность для рабочих процессов инференса, поддерживаемых провайдерами.

Она намеренно раскрывает семейства возможностей, а не сырые имена RPC Gateway и не сырые идентификаторы инструментов агента.

## Превратите infer в skill

Скопируйте и вставьте это агенту:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Хороший skill на основе infer должен:

- сопоставлять распространенные намерения пользователя с правильной подкомандой infer
- включать несколько канонических примеров infer для рабочих процессов, которые он покрывает
- предпочитать `openclaw infer ...` в примерах и рекомендациях
- избегать повторного документирования всей поверхности infer внутри тела skill

Типичное покрытие skill, сфокусированного на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Зачем использовать infer

`openclaw infer` предоставляет единый согласованный CLI для задач инференса, поддерживаемых провайдерами внутри OpenClaw.

Преимущества:

- Используйте провайдеры и модели, уже настроенные в OpenClaw, вместо настройки одноразовых оберток для каждого backend.
- Держите рабочие процессы с моделями, изображениями, аудиотранскрибацией, TTS, видео, вебом и embeddings в одном дереве команд.
- Используйте стабильную форму вывода `--json` для скриптов, автоматизации и рабочих процессов, управляемых агентами.
- Предпочитайте первичную поверхность OpenClaw, когда задача по сути сводится к "запустить инференс".
- Используйте обычный локальный путь без необходимости Gateway для большинства команд infer.

Для сквозных проверок провайдера предпочитайте `openclaw infer ...`, когда низкоуровневые
тесты провайдера уже проходят. Это проверяет поставляемый CLI, загрузку конфигурации,
разрешение агента по умолчанию, активацию встроенного Plugin и общую среду выполнения
возможностей до отправки запроса провайдеру.

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
    status
    enable
    disable
    set-provider

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

## Распространенные задачи

Эта таблица сопоставляет распространенные задачи инференса с соответствующей командой infer.

| Задача                          | Команда                                                                                       | Примечания                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Запустить текстовый/model prompt | `openclaw infer model run --prompt "..." --json`                                              | По умолчанию использует обычный локальный путь             |
| Запустить model prompt на изображениях | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Повторите `--file` для нескольких входных изображений      |
| Сгенерировать изображение       | `openclaw infer image generate --prompt "..." --json`                                         | Используйте `image edit`, если начинаете с существующего файла |
| Описать файл изображения или URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` должен быть image-capable `<provider/model>`     |
| Транскрибировать аудио          | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` должен быть `<provider/model>`                   |
| Синтезировать речь              | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` ориентирован на Gateway                       |
| Сгенерировать видео             | `openclaw infer video generate --prompt "..." --json`                                         | Поддерживает подсказки провайдера, такие как `--resolution` |
| Описать видеофайл               | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` должен быть `<provider/model>`                   |
| Искать в вебе                   | `openclaw infer web search --query "..." --json`                                              |                                                            |
| Получить веб-страницу           | `openclaw infer web fetch --url https://example.com --json`                                   |                                                            |
| Создать embeddings              | `openclaw infer embedding create --text "..." --json`                                         |                                                            |

## Поведение

- `openclaw infer ...` — основная поверхность CLI для этих рабочих процессов.
- Используйте `--json`, когда вывод будет потребляться другой командой или скриптом.
- Используйте `--provider` или `--model provider/model`, когда требуется конкретный backend.
- Используйте `model run --thinking <level>`, чтобы передать одноразовый уровень thinking/reasoning (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` или `max`), сохранив запуск сырым.
- Для `image describe`, `audio transcribe` и `video describe` `--model` должен использовать форму `<provider/model>`.
- Для `image describe` `--file` принимает локальные пути и HTTP(S) URL изображений. Удаленные URL используют обычную SSRF-политику получения медиа.
- Для `image describe` явный `--model` запускает этот provider/model напрямую. Модель должна быть image-capable в каталоге моделей или конфигурации провайдера. `codex/<model>` запускает ограниченный ход понимания изображений через app-server Codex; `openai/<model>` использует путь провайдера OpenAI с аутентификацией через API-key или ChatGPT/Codex OAuth.
- Команды stateless-выполнения по умолчанию локальные.
- Команды состояния, управляемого Gateway, по умолчанию используют Gateway.
- Обычный локальный путь не требует запущенного Gateway.
- Локальный `model run` — компактное одноразовое completion провайдера. Он разрешает настроенную модель агента и auth, но не запускает ход chat-agent, не загружает инструменты и не открывает встроенные MCP-серверы.
- `model run --file` принимает файлы изображений, определяет их MIME type и отправляет их вместе с переданным prompt в выбранную модель. Повторите `--file` для нескольких изображений.
- `model run --file` отклоняет входные данные, не являющиеся изображениями. Используйте `infer audio transcribe` для аудиофайлов и `infer video describe` для видеофайлов.
- `model run --gateway` проверяет маршрутизацию Gateway, сохраненную auth, выбор провайдера и встроенную среду выполнения, но все равно выполняется как сырой пробный запуск модели: он отправляет переданный prompt и любые вложения изображений без предыдущего transcript сеанса, bootstrap/AGENTS context, сборки context-engine, инструментов или встроенных MCP-серверов.
- `model run --gateway --model <provider/model>` требует доверенные учетные данные оператора Gateway, потому что запрос просит Gateway выполнить одноразовое переопределение provider/model.
- Локальный `model run --thinking` использует компактный путь provider-completion; специфичные для провайдера уровни, такие как `adaptive` и `max`, сопоставляются с ближайшим переносимым уровнем simple-completion.

## Модель

Используйте `model` для текстового инференса, поддерживаемого провайдерами, и инспекции модели/провайдера.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Используйте полные ссылки `<provider/model>`, чтобы выполнить smoke-test конкретного провайдера без
запуска Gateway или загрузки полной поверхности инструментов агента:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Примечания:

- Локальный `model run` — самый узкий CLI smoke для проверки работоспособности provider/model/auth, потому что для не-Codex провайдеров он отправляет только переданный prompt в выбранную модель.
- Локальный `model run --model <provider/model>` может использовать точные встроенные статические строки каталога из `models list --all` до того, как этот провайдер записан в конфигурацию. Auth провайдера все равно требуется; отсутствующие учетные данные завершаются ошибками auth, а не `Unknown model`.
- Для reasoning-проб Mistral Medium 3.5 оставьте temperature неустановленной/по умолчанию. Mistral отклоняет `reasoning_effort="high"` плюс `temperature: 0`; используйте `mistral/mistral-medium-3-5` с temperature по умолчанию или ненулевым значением reasoning-mode, например `0.7`.
- Локальные пробы Codex Responses — узкое исключение: OpenClaw добавляет минимальную системную инструкцию, чтобы транспорт мог заполнить обязательное поле `instructions`, не добавляя полный контекст агента, инструменты, память или transcript сеанса.
- Локальный `model run --file` сохраняет этот компактный путь и прикрепляет содержимое изображения напрямую к единственному сообщению пользователя. Распространенные файлы изображений, такие как PNG, JPEG и WebP, работают, когда их MIME type определяется как `image/*`; неподдерживаемые или нераспознанные файлы завершаются ошибкой до вызова провайдера.
- `model run --file` лучше всего подходит, когда вы хотите напрямую протестировать выбранную multimodal text model. Используйте `infer image describe`, когда вам нужны выбор OpenClaw провайдера для понимания изображений и маршрутизация image-model по умолчанию.
- Выбранная модель должна поддерживать ввод изображений; text-only модели могут отклонить запрос на уровне провайдера.
- `model run --prompt` должен содержать непустой не-whitespace текст; пустые prompts отклоняются до вызова локальных провайдеров или Gateway.
- Локальный `model run` завершается с ненулевым кодом, когда провайдер не возвращает текстовый вывод, поэтому недоступные локальные провайдеры и пустые completions не выглядят как успешные пробы.
- Используйте `model run --gateway`, когда нужно протестировать маршрутизацию Gateway, настройку agent-runtime или состояние провайдера, управляемое Gateway, сохраняя при этом сырой ввод модели. Используйте `openclaw agent` или chat-поверхности, когда нужен полный контекст агента, инструменты, память и transcript сеанса.
- `model auth login`, `model auth logout` и `model auth status` управляют сохраненным состоянием auth провайдера.

## Изображение

Используйте `image` для генерации, редактирования и описания.

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

- Используйте `image edit`, когда начинаете с существующих входных файлов.
- Используйте `--size`, `--aspect-ratio` или `--resolution` с `image edit` для
  провайдеров/моделей, которые поддерживают подсказки геометрии при редактировании по эталонным изображениям.
- Используйте `--output-format png --background transparent` с
  `--model openai/gpt-image-1.5` для вывода OpenAI PNG с прозрачным фоном;
  `--openai-background` остается доступным как специфичный для OpenAI псевдоним. Провайдеры,
  которые не заявляют поддержку фона, сообщают подсказку как проигнорированное переопределение.
- Используйте `--quality low|medium|high|auto` для провайдеров, которые поддерживают подсказки
  качества изображения, включая OpenAI. OpenAI также принимает `--openai-moderation low|auto` для
  специфичной для провайдера подсказки модерации.
- Используйте `image providers --json`, чтобы проверить, какие встроенные провайдеры изображений
  обнаруживаются, настроены, выбраны и какие возможности генерации/редактирования
  предоставляет каждый провайдер.
- Используйте `image generate --model <provider/model> --json` как самый узкий живой
  CLI smoke для изменений генерации изображений. Пример:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON-ответ сообщает `ok`, `provider`, `model`, `attempts` и записанные
  пути вывода. Когда задан `--output`, итоговое расширение может соответствовать
  MIME-типу, возвращенному провайдером.

- Для `image describe` и `image describe-many` используйте `--prompt`, чтобы дать модели зрения инструкцию для конкретной задачи, например OCR, сравнение, инспекцию UI или краткую подпись.
- Используйте `--timeout-ms` с медленными локальными моделями зрения или холодными запусками Ollama.
- Для `image describe` `--model` должен быть моделью `<provider/model>` с поддержкой изображений.
- Для локальных моделей зрения Ollama сначала загрузите модель и задайте `OLLAMA_API_KEY` любым значением-заполнителем, например `ollama-local`. См. [Ollama](/ru/providers/ollama#vision-and-image-description).

## Аудио

Используйте `audio` для транскрибации файлов.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Примечания:

- `audio transcribe` предназначен для транскрибации файлов, а не для управления сеансами в реальном времени.
- `--model` должен быть `<provider/model>`.

## TTS

Используйте `tts` для синтеза речи и состояния провайдера TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Примечания:

- `tts status` по умолчанию использует Gateway, потому что отражает состояние TTS, управляемое Gateway.
- Используйте `tts providers`, `tts voices` и `tts set-provider`, чтобы просматривать и настраивать поведение TTS.

## Видео

Используйте `video` для генерации и описания.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Примечания:

- `video generate` принимает `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` и `--timeout-ms` и передает их среде выполнения генерации видео.
- `--model` должен быть `<provider/model>` для `video describe`.

## Веб

Используйте `web` для рабочих процессов поиска и получения данных.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Примечания:

- Используйте `web providers`, чтобы просмотреть доступных, настроенных и выбранных провайдеров.

## Эмбеддинг

Используйте `embedding` для создания векторов и инспекции провайдера эмбеддингов.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Вывод JSON

Команды Infer нормализуют вывод JSON в общей оболочке:

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

Поля верхнего уровня стабильны:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Для команд генерации медиа `outputs` содержит файлы, записанные OpenClaw. Используйте
`path`, `mimeType`, `size` и любые специфичные для медиа размеры в этом массиве
для автоматизации вместо разбора человекочитаемого stdout.

## Распространенные ошибки

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

## Примечания

- `openclaw capability ...` — псевдоним для `openclaw infer ...`.

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Модели](/ru/concepts/models)
