---
read_when:
    - Додавання або змінення `openclaw infer` команд
    - Проєктування стабільної безінтерфейсної автоматизації можливостей
summary: CLI, орієнтований передусім на інференс, для робочих процесів із моделями, зображеннями, аудіо, TTS, відео, вебом і вбудовуваннями на базі провайдерів
title: CLI для інференсу
x-i18n:
    generated_at: "2026-05-11T20:28:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05496c5278650c30e5a52dceba105b703258040765f0a3f75268bb514270f15d
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` є канонічною headless-поверхнею для робочих процесів інференсу на базі провайдерів.

Вона навмисно надає сімейства можливостей, а не сирі назви Gateway RPC і не сирі ідентифікатори інструментів агента.

## Перетворення infer на навичку

Скопіюйте й вставте це агенту:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Хороша навичка на основі infer має:

- зіставляти типові наміри користувача з правильними підкомандами infer
- містити кілька канонічних прикладів infer для робочих процесів, які вона охоплює
- надавати перевагу `openclaw infer ...` у прикладах і пропозиціях
- уникати повторного документування всієї поверхні infer в тілі навички

Типове покриття навички, зосередженої на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Навіщо використовувати infer

`openclaw infer` надає один узгоджений CLI для завдань інференсу на базі провайдерів усередині OpenClaw.

Переваги:

- Використовуйте провайдерів і моделі, уже налаштовані в OpenClaw, замість створення разових обгорток для кожного бекенду.
- Тримайте робочі процеси для моделей, зображень, транскрибування аудіо, TTS, відео, вебу та embeddings в одному дереві команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентом.
- Надавайте перевагу першосторонній поверхні OpenClaw, коли завдання по суті полягає в "запуску інференсу".
- Використовуйте звичайний локальний шлях без потреби в Gateway для більшості команд infer.

Для наскрізних перевірок провайдерів надавайте перевагу `openclaw infer ...` після того, як низькорівневі
тести провайдера зелені. Це перевіряє поставлений CLI, завантаження конфігурації,
визначення агента за замовчуванням, активацію bundled Plugin і спільний runtime
можливостей до виконання запиту до провайдера.

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

| Завдання                     | Команда                                                                                       | Примітки                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Запустити текстовий/модельний prompt | `openclaw infer model run --prompt "..." --json`                                              | Типово використовує звичайний локальний шлях          |
| Запустити модельний prompt для зображень | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Повторіть `--file` для кількох вхідних зображень      |
| Згенерувати зображення       | `openclaw infer image generate --prompt "..." --json`                                         | Використовуйте `image edit`, коли починаєте з наявного файлу |
| Описати файл зображення      | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` має бути image-capable `<provider/model>`   |
| Транскрибувати аудіо         | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` має бути `<provider/model>`                 |
| Синтезувати мовлення         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` орієнтовано на Gateway                   |
| Згенерувати відео            | `openclaw infer video generate --prompt "..." --json`                                         | Підтримує підказки провайдера, як-от `--resolution`   |
| Описати відеофайл            | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` має бути `<provider/model>`                 |
| Шукати в інтернеті           | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Отримати вебсторінку         | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Створити embeddings          | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Поведінка

- `openclaw infer ...` є основною поверхнею CLI для цих робочих процесів.
- Використовуйте `--json`, коли вивід споживатиме інша команда або скрипт.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Використовуйте `model run --thinking <level>`, щоб передати одноразовий рівень thinking/reasoning (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` або `max`), зберігаючи запуск сирим.
- Для `image describe`, `audio transcribe` і `video describe` `--model` має використовувати форму `<provider/model>`.
- Для `image describe` явний `--model` запускає цей provider/model напряму. Модель має бути image-capable у каталозі моделей або конфігурації провайдера. `codex/<model>` запускає обмежений хід розуміння зображення через сервер застосунку Codex; `openai-codex/<model>` використовує шлях провайдера OpenAI Codex OAuth.
- Команди stateless-виконання типово локальні.
- Команди стану, керовані Gateway, типово використовують Gateway.
- Звичайний локальний шлях не потребує запущеного Gateway.
- Локальний `model run` є легким одноразовим provider completion. Він визначає налаштовану модель агента й автентифікацію, але не запускає chat-agent turn, не завантажує інструменти й не відкриває bundled MCP servers.
- `model run --file` приймає файли зображень, визначає їхній MIME-тип і надсилає їх із наданим prompt до вибраної моделі. Повторіть `--file` для кількох зображень.
- `model run --file` відхиляє вхідні дані, що не є зображеннями. Використовуйте `infer audio transcribe` для аудіофайлів і `infer video describe` для відеофайлів.
- `model run --gateway` перевіряє маршрутизацію Gateway, збережену автентифікацію, вибір провайдера та вбудований runtime, але все одно працює як сирий model probe: він надсилає наданий prompt і будь-які вкладення зображень без попереднього transcript сесії, контексту bootstrap/AGENTS, складання context-engine, інструментів або bundled MCP servers.
- `model run --gateway --model <provider/model>` потребує довірених облікових даних оператора Gateway, бо запит просить Gateway виконати одноразове перевизначення provider/model.
- Локальний `model run --thinking` використовує легкий шлях provider-completion; специфічні для провайдера рівні, як-от `adaptive` і `max`, зіставляються з найближчим портативним рівнем simple-completion.

## Модель

Використовуйте `model` для текстового інференсу на базі провайдерів і перевірки моделей/провайдерів.

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
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Примітки:

- Локальний `model run` є найвужчим CLI smoke для стану provider/model/auth, бо для провайдерів, що не є Codex, він надсилає лише наданий prompt до вибраної моделі.
- Локальний `model run --model <provider/model>` може використовувати точні bundled static catalog rows з `models list --all` до того, як цей провайдер буде записано в конфігурацію. Автентифікація провайдера все одно потрібна; відсутні облікові дані завершуються помилками автентифікації, а не `Unknown model`.
- Для reasoning probes Mistral Medium 3.5 залиште temperature не встановленою/типовою. Mistral відхиляє `reasoning_effort="high"` плюс `temperature: 0`; використовуйте `mistral/mistral-medium-3-5` з типовою temperature або ненульовим значенням reasoning-mode, як-от `0.7`.
- Локальні probes `openai-codex/*` є вузьким винятком: OpenClaw додає мінімальну системну інструкцію, щоб транспорт Codex Responses міг заповнити своє обов’язкове поле `instructions`, без додавання повного контексту агента, інструментів, пам’яті або transcript сесії.
- Локальний `model run --file` зберігає цей легкий шлях і прикріплює вміст зображення напряму до одного повідомлення користувача. Типові файли зображень, як-от PNG, JPEG і WebP, працюють, коли їхній MIME-тип визначено як `image/*`; непідтримувані або нерозпізнані файли завершуються помилкою до виклику провайдера.
- `model run --file` найкраще підходить, коли потрібно протестувати вибрану multimodal text model напряму. Використовуйте `infer image describe`, коли потрібні вибір провайдера розуміння зображень OpenClaw і типова маршрутизація image-model.
- Вибрана модель має підтримувати вхідні зображення; text-only models можуть відхилити запит на рівні провайдера.
- `model run --prompt` має містити текст, що не складається лише з пробілів; порожні prompts відхиляються до виклику локальних провайдерів або Gateway.
- Локальний `model run` завершується з ненульовим кодом, коли провайдер не повертає текстовий вивід, тому недоступні локальні провайдери й порожні completions не виглядають як успішні probes.
- Використовуйте `model run --gateway`, коли потрібно протестувати маршрутизацію Gateway, налаштування agent-runtime або стан провайдера, керований Gateway, зберігаючи вхід моделі сирим. Використовуйте `openclaw agent` або chat-поверхні, коли потрібен повний контекст агента, інструменти, пам’ять і transcript сесії.
- `model auth login`, `model auth logout` і `model auth status` керують збереженим станом автентифікації провайдера.

## Зображення

Використовуйте `image` для генерації, редагування та опису.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Примітки:

- Використовуйте `image edit`, коли починаєте з наявних вхідних файлів.
- Використовуйте `--size`, `--aspect-ratio` або `--resolution` з `image edit` для
  провайдерів/моделей, які підтримують підказки геометрії під час редагування референсних зображень.
- Використовуйте `--output-format png --background transparent` з
  `--model openai/gpt-image-1.5` для виводу OpenAI PNG із прозорим тлом;
  `--openai-background` лишається доступним як псевдонім, специфічний для OpenAI. Провайдери,
  які не оголошують підтримку тла, повідомляють про підказку як про проігнороване перевизначення.
- Використовуйте `image providers --json`, щоб перевірити, які вбудовані провайдери зображень
  можна виявити, налаштувати, вибрати, а також які можливості генерації/редагування
  надає кожен провайдер.
- Використовуйте `image generate --model <provider/model> --json` як найвужчий живий
  CLI smoke для змін генерації зображень. Приклад:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Відповідь JSON повідомляє `ok`, `provider`, `model`, `attempts` і записані
  шляхи виводу. Коли задано `--output`, кінцеве розширення може відповідати
  MIME-типу, повернутому провайдером.

- Для `image describe` та `image describe-many` використовуйте `--prompt`, щоб дати моделі зору інструкцію для конкретного завдання, як-от OCR, порівняння, інспекція UI або стисле підписування.
- Використовуйте `--timeout-ms` з повільними локальними моделями зору або холодними запусками Ollama.
- Для `image describe` `--model` має бути моделлю `<provider/model>` з підтримкою зображень.
- Для локальних моделей зору Ollama спочатку завантажте модель і встановіть `OLLAMA_API_KEY` у будь-яке значення-заповнювач, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

## Аудіо

Використовуйте `audio` для транскрибування файлів.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Примітки:

- `audio transcribe` призначено для транскрибування файлів, а не для керування сеансами в реальному часі.
- `--model` має бути `<provider/model>`.

## TTS

Використовуйте `tts` для синтезу мовлення та стану TTS-провайдера.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Примітки:

- `tts status` за замовчуванням використовує Gateway, бо відображає стан TTS, керований Gateway.
- Використовуйте `tts providers`, `tts voices` і `tts set-provider`, щоб переглядати та налаштовувати поведінку TTS.

## Відео

Використовуйте `video` для генерації та опису.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Примітки:

- `video generate` приймає `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` і `--timeout-ms` та передає їх до середовища виконання генерації відео.
- `--model` має бути `<provider/model>` для `video describe`.

## Веб

Використовуйте `web` для робочих процесів пошуку та отримання.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Примітки:

- Використовуйте `web providers`, щоб переглянути доступних, налаштованих і вибраних провайдерів.

## Вбудовування

Використовуйте `embedding` для створення векторів та інспекції провайдерів вбудовувань.

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
для автоматизації замість парсингу читабельного для людини stdout.

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
