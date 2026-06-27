---
read_when:
    - Додавання або змінення `openclaw infer` команд
    - Проєктування стабільної безголової автоматизації можливостей
summary: CLI з пріоритетом інференсу для робочих процесів моделей, зображень, аудіо, TTS, відео, вебу та embeddings із підтримкою провайдерів
title: CLI інференсу
x-i18n:
    generated_at: "2026-06-27T17:20:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93ebb2a830bfbe6aad58cfa7aa2252cf016a6c9cb99b7592406593627e41fdd1
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` є канонічною безголовою поверхнею для робочих процесів інференсу з підтримкою провайдерів.

Він навмисно відкриває сімейства можливостей, а не сирі назви RPC Gateway і не сирі ідентифікатори інструментів агента.

## Перетворіть infer на skill

Скопіюйте та вставте це агенту:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Добрий skill на основі infer має:

- зіставляти типові наміри користувача з правильним підкомандою infer
- містити кілька канонічних прикладів infer для робочих процесів, які він охоплює
- надавати перевагу `openclaw infer ...` у прикладах і пропозиціях
- уникати повторного документування всієї поверхні infer у тілі skill

Типове покриття skill, зосередженого на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Навіщо використовувати infer

`openclaw infer` надає один узгоджений CLI для завдань інференсу з підтримкою провайдерів усередині OpenClaw.

Переваги:

- Використовуйте провайдерів і моделі, уже налаштовані в OpenClaw, замість створення одноразових обгорток для кожного бекенду.
- Тримайте робочі процеси для моделей, зображень, транскрибування аудіо, TTS, відео, вебу й embedding в одному дереві команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентом.
- Надавайте перевагу першокласній поверхні OpenClaw, коли завдання по суті полягає в «запуску інференсу».
- Використовуйте звичайний локальний шлях без потреби в gateway для більшості команд infer.

Для наскрізних перевірок провайдера надавайте перевагу `openclaw infer ...`, коли нижчерівневі
тести провайдера вже зелені. Це перевіряє поставлений CLI, завантаження конфігурації,
розв’язання агента за замовчуванням, активацію bundled plugin і спільний runtime
можливостей перед виконанням запиту до провайдера.

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

## Поширені завдання

Ця таблиця зіставляє поширені завдання інференсу з відповідною командою infer.

| Завдання                         | Команда                                                                                       | Примітки                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Запустити текстовий/модельний prompt       | `openclaw infer model run --prompt "..." --json`                                              | Типово використовує звичайний локальний шлях                 |
| Запустити модельний prompt для зображень  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Повторіть `--file` для кількох вхідних зображень             |
| Згенерувати зображення             | `openclaw infer image generate --prompt "..." --json`                                         | Використовуйте `image edit`, коли починаєте з наявного файлу  |
| Описати файл зображення або URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` має бути image-capable `<provider/model>` |
| Транскрибувати аудіо              | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` має бути `<provider/model>`                  |
| Синтезувати мовлення             | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` орієнтовано на gateway                      |
| Згенерувати відео              | `openclaw infer video generate --prompt "..." --json`                                         | Підтримує підказки провайдера, як-от `--resolution`        |
| Описати відеофайл         | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` має бути `<provider/model>`                  |
| Шукати в інтернеті                | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Отримати вебсторінку              | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Створити embeddings             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Поведінка

- `openclaw infer ...` є основною поверхнею CLI для цих робочих процесів.
- Використовуйте `--json`, коли вивід споживатиме інша команда або скрипт.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Використовуйте `model run --thinking <level>`, щоб передати одноразовий рівень мислення/міркування (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` або `max`), зберігаючи запуск raw.
- Для `image describe`, `audio transcribe` і `video describe` `--model` має використовувати форму `<provider/model>`.
- Для `image describe` `--file` приймає локальні шляхи та HTTP(S) URL зображень. Віддалені URL використовують звичайну SSRF-політику отримання медіа.
- Для `image describe` явний `--model` запускає цей провайдер/модель безпосередньо. Модель має бути image-capable у каталозі моделей або конфігурації провайдера. `codex/<model>` запускає обмежений крок розуміння зображення на app-server Codex; `openai/<model>` використовує шлях провайдера OpenAI з автентифікацією через API-ключ або ChatGPT/Codex OAuth.
- Команди stateless execution типово виконуються локально.
- Команди стану, керовані Gateway, типово використовують gateway.
- Звичайний локальний шлях не потребує запущеного gateway.
- Локальний `model run` є компактним одноразовим завершенням провайдера. Він розв’язує налаштовану модель агента й автентифікацію, але не запускає хід chat-agent, не завантажує інструменти й не відкриває bundled MCP servers.
- `model run --file` приймає файли зображень, визначає їхній MIME-тип і надсилає їх із наданим prompt до вибраної моделі. Повторіть `--file` для кількох зображень.
- `model run --file` відхиляє вхідні дані, що не є зображеннями. Використовуйте `infer audio transcribe` для аудіофайлів і `infer video describe` для відеофайлів.
- `model run --gateway` перевіряє маршрутизацію Gateway, збережену автентифікацію, вибір провайдера й embedded runtime, але все одно виконується як raw model probe: він надсилає наданий prompt і будь-які вкладення зображень без попереднього транскрипту сесії, контексту bootstrap/AGENTS, складання context-engine, інструментів або bundled MCP servers.
- `model run --gateway --model <provider/model>` потребує довірених облікових даних оператора gateway, бо запит просить Gateway виконати одноразове перевизначення провайдера/моделі.
- Локальний `model run --thinking` використовує компактний шлях завершення провайдера; специфічні для провайдера рівні, як-от `adaptive` і `max`, зіставляються з найближчим портативним рівнем simple-completion.

## Модель

Використовуйте `model` для текстового інференсу з підтримкою провайдерів і перевірки моделей/провайдерів.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Використовуйте повні посилання `<provider/model>`, щоб smoke-test конкретного провайдера без
запуску Gateway або завантаження повної поверхні інструментів агента:

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

Примітки:

- Локальний `model run` є найвужчим smoke CLI для перевірки стану провайдера/моделі/автентифікації, бо для провайдерів, відмінних від Codex, він надсилає до вибраної моделі лише наданий prompt.
- Локальний `model run --model <provider/model>` може використовувати точні bundled static catalog rows з `models list --all` до запису цього провайдера в конфігурацію. Автентифікація провайдера все одно потрібна; відсутні облікові дані спричиняють помилки автентифікації, а не `Unknown model`.
- Для reasoning probes Mistral Medium 3.5 залиште температуру невстановленою/типовою. Mistral відхиляє `reasoning_effort="high"` плюс `temperature: 0`; використовуйте `mistral/mistral-medium-3-5` із типовою температурою або ненульовим значенням reasoning-mode, як-от `0.7`.
- Локальні probes Codex Responses є вузьким винятком: OpenClaw додає мінімальну системну інструкцію, щоб транспорт міг заповнити обов’язкове поле `instructions`, без додавання повного контексту агента, інструментів, пам’яті або транскрипту сесії.
- Локальний `model run --file` зберігає цей компактний шлях і прикріплює вміст зображення безпосередньо до єдиного повідомлення користувача. Типові файли зображень, як-от PNG, JPEG і WebP, працюють, коли їхній MIME-тип визначено як `image/*`; непідтримувані або нерозпізнані файли завершуються помилкою до виклику провайдера.
- `model run --file` найкраще підходить, коли ви хочете протестувати вибрану мультимодальну текстову модель безпосередньо. Використовуйте `infer image describe`, коли хочете скористатися вибором провайдера OpenClaw для розуміння зображень і типовою маршрутизацією image-model.
- Вибрана модель має підтримувати вхідні зображення; text-only models можуть відхилити запит на рівні провайдера.
- `model run --prompt` має містити текст, що не складається лише з пробілів; порожні prompts відхиляються до виклику локальних провайдерів або Gateway.
- Локальний `model run` завершується з ненульовим кодом, коли провайдер не повертає текстового виводу, тож недоступні локальні провайдери й порожні completions не виглядають як успішні probes.
- Використовуйте `model run --gateway`, коли потрібно протестувати маршрутизацію Gateway, налаштування agent-runtime або стан провайдера, керований Gateway, зберігаючи сирий вхід моделі. Використовуйте `openclaw agent` або chat surfaces, коли потрібен повний контекст агента, інструменти, пам’ять і транскрипт сесії.
- `model auth login`, `model auth logout` і `model auth status` керують збереженим станом автентифікації провайдера.

## Зображення

Використовуйте `image` для генерації, редагування й опису.

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

Примітки:

- Використовуйте `image edit`, коли починаєте з наявних вхідних файлів.
- Використовуйте `--size`, `--aspect-ratio` або `--resolution` з `image edit` для
  постачальників/моделей, які підтримують підказки геометрії під час редагування еталонних зображень.
- Використовуйте `--output-format png --background transparent` з
  `--model openai/gpt-image-1.5` для PNG-виводу OpenAI з прозорим тлом;
  `--openai-background` лишається доступним як псевдонім, специфічний для OpenAI. Постачальники,
  які не оголошують підтримку тла, повідомляють цю підказку як проігнороване перевизначення.
- Використовуйте `--quality low|medium|high|auto` для постачальників, які підтримують підказки
  якості зображення, зокрема OpenAI. OpenAI також приймає `--openai-moderation low|auto` для
  підказки модерації, специфічної для постачальника.
- Використовуйте `image providers --json`, щоб перевірити, які вбудовані постачальники зображень є
  доступними для виявлення, налаштованими, вибраними, а також які можливості генерації/редагування
  надає кожен постачальник.
- Використовуйте `image generate --model <provider/model> --json` як найвужчий живий
  CLI smoke-тест для змін генерації зображень. Приклад:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON-відповідь повідомляє `ok`, `provider`, `model`, `attempts` і записані
  шляхи виводу. Коли задано `--output`, кінцеве розширення може відповідати
  MIME-типу, поверненому постачальником.

- Для `image describe` і `image describe-many` використовуйте `--prompt`, щоб дати моделі зору інструкцію для конкретного завдання, як-от OCR, порівняння, інспекція UI або стисле підписування.
- Використовуйте `--timeout-ms` із повільними локальними моделями зору або холодними запусками Ollama.
- Для `image describe` `--model` має бути `<provider/model>` із підтримкою зображень.
- Для локальних моделей зору Ollama спочатку завантажте модель і встановіть `OLLAMA_API_KEY` у будь-яке значення-заповнювач, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

## Аудіо

Використовуйте `audio` для транскрибування файлів.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Примітки:

- `audio transcribe` призначено для транскрибування файлів, а не для керування сесіями в реальному часі.
- `--model` має бути `<provider/model>`.

## TTS

Використовуйте `tts` для синтезу мовлення та стану постачальника TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Примітки:

- `tts status` за замовчуванням використовує Gateway, оскільки відображає стан TTS, керований Gateway.
- Використовуйте `tts providers`, `tts voices` і `tts set-provider`, щоб перевіряти й налаштовувати поведінку TTS.

## Відео

Використовуйте `video` для генерації та опису.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Примітки:

- `video generate` приймає `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` і `--timeout-ms` та передає їх у runtime генерації відео.
- `--model` має бути `<provider/model>` для `video describe`.

## Веб

Використовуйте `web` для робочих процесів пошуку й отримання.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Примітки:

- Використовуйте `web providers`, щоб перевірити доступних, налаштованих і вибраних постачальників.

## Вбудовування

Використовуйте `embedding` для створення векторів і перевірки постачальників вбудовувань.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Вивід JSON

Команди infer нормалізують вивід JSON у спільній оболонці:

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

Поля верхнього рівня стабільні:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Для команд згенерованих медіа `outputs` містить файли, записані OpenClaw. Використовуйте
`path`, `mimeType`, `size` і будь-які специфічні для медіа розміри в цьому масиві
для автоматизації замість розбору stdout, призначеного для читання людиною.

## Поширені помилки

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

## Примітки

- `openclaw capability ...` є псевдонімом для `openclaw infer ...`.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Моделі](/uk/concepts/models)
