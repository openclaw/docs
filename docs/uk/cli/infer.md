---
read_when:
    - Додавання або змінення команд `openclaw infer`
    - Проєктування стабільної безінтерфейсної автоматизації можливостей
summary: CLI з підходом infer-first для робочих процесів із моделями, зображеннями, аудіо, TTS, відео, вебом та ембедингами, що підтримуються провайдерами
title: CLI для інференсу
x-i18n:
    generated_at: "2026-04-28T20:11:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a154cf11a09f6c60117740f42937da3a0e6942931dde6eee6d902fb6e0ba461
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` є канонічною безголовою поверхнею для робочих процесів інференсу на основі провайдерів.

Вона навмисно відкриває сімейства можливостей, а не сирі назви Gateway RPC і не сирі ідентифікатори інструментів агента.

## Перетворіть infer на skill

Скопіюйте й вставте це в агент:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Якісний skill на основі infer має:

- зіставляти поширені наміри користувача з правильним підкомандним рядком infer
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

`openclaw infer` надає єдиний узгоджений CLI для завдань інференсу на основі провайдерів усередині OpenClaw.

Переваги:

- Використовуйте провайдери й моделі, уже налаштовані в OpenClaw, замість створення одноразових обгорток для кожного бекенда.
- Тримайте робочі процеси для моделей, зображень, транскрипції аудіо, TTS, відео, вебу та embeddings в одному дереві команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентами.
- Надавайте перевагу першосторонній поверхні OpenClaw, коли завдання по суті полягає в «запуску інференсу».
- Для більшості команд infer використовуйте звичайний локальний шлях без потреби в Gateway.

Для наскрізних перевірок провайдерів надавайте перевагу `openclaw infer ...`, коли нижчорівневі
тести провайдерів уже зелені. Це перевіряє відвантажений CLI, завантаження конфігурації,
розв’язання агента за замовчуванням, активацію вбудованого Plugin, відновлення залежностей виконання
і спільний runtime можливостей до виконання запиту до провайдера.

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
| Запустити текстовий/модельний prompt | `openclaw infer model run --prompt "..." --json`                                              | За замовчуванням використовує звичайний локальний шлях |
| Запустити модельний prompt для зображень | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Повторіть `--file` для кількох вхідних зображень      |
| Згенерувати зображення       | `openclaw infer image generate --prompt "..." --json`                                         | Використовуйте `image edit`, коли починаєте з наявного файлу |
| Описати файл зображення      | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` має бути моделлю з підтримкою зображень у форматі `<provider/model>` |
| Транскрибувати аудіо         | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` має бути `<provider/model>`                 |
| Синтезувати мовлення         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` орієнтовано на Gateway                   |
| Згенерувати відео            | `openclaw infer video generate --prompt "..." --json`                                         | Підтримує підказки провайдера, як-от `--resolution`   |
| Описати відеофайл            | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` має бути `<provider/model>`                 |
| Шукати в інтернеті           | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Отримати вебсторінку         | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Створити embeddings          | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Поведінка

- `openclaw infer ...` є основною CLI-поверхнею для цих робочих процесів.
- Використовуйте `--json`, коли вивід споживатиме інша команда або скрипт.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Для `image describe`, `audio transcribe` і `video describe` `--model` має використовувати форму `<provider/model>`.
- Для `image describe` явний `--model` запускає цей provider/model напряму. Модель має підтримувати зображення в каталозі моделей або конфігурації провайдера. `codex/<model>` запускає обмежений крок розуміння зображення через Codex app-server; `openai-codex/<model>` використовує шлях провайдера OpenAI Codex OAuth.
- Команди виконання без стану за замовчуванням використовують локальний режим.
- Команди стану, керованого Gateway, за замовчуванням використовують Gateway.
- Звичайний локальний шлях не потребує запущеного Gateway.
- Локальний `model run` — це легке одноразове завершення через провайдера. Він розв’язує налаштовану модель агента й авторизацію, але не запускає крок чат-агента, не завантажує інструменти й не відкриває вбудовані MCP-сервери.
- `model run --file` приймає файли зображень, визначає їхній MIME-тип і надсилає їх із наданим prompt до вибраної моделі. Повторіть `--file` для кількох зображень.
- `model run --file` відхиляє вхідні дані, що не є зображеннями. Використовуйте `infer audio transcribe` для аудіофайлів і `infer video describe` для відеофайлів.
- `model run --gateway` перевіряє маршрутизацію Gateway, збережену авторизацію, вибір провайдера й вбудований runtime, але все одно працює як сирий модельний пробник: він надсилає наданий prompt і будь-які вкладення зображень без попереднього transcript сесії, bootstrap/AGENTS-контексту, збирання context-engine, інструментів або вбудованих MCP-серверів.
- `model run --gateway --model <provider/model>` потребує довіреного операторського облікового запису Gateway, оскільки запит просить Gateway виконати одноразове перевизначення provider/model.

## Модель

Використовуйте `model` для текстового інференсу на основі провайдерів і перевірки моделей/провайдерів.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Використовуйте повні посилання `<provider/model>`, щоб smoke-тестувати конкретного провайдера без
запуску Gateway або завантаження повної поверхні інструментів агента:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Примітки:

- Локальний `model run` є найвужчим CLI-smoke для справності provider/model/auth, оскільки він надсилає вибраній моделі лише наданий prompt.
- Локальний `model run --file` зберігає цей легкий шлях і прикріплює вміст зображення напряму до єдиного повідомлення користувача. Поширені файли зображень, як-от PNG, JPEG і WebP, працюють, коли їхній MIME-тип визначено як `image/*`; непідтримувані або нерозпізнані файли зазнають помилки до виклику провайдера.
- `model run --file` найкраще підходить, коли потрібно напряму протестувати вибрану мультимодальну текстову модель. Використовуйте `infer image describe`, коли потрібні вибір провайдера розуміння зображень OpenClaw і маршрутизація до моделі зображень за замовчуванням.
- Вибрана модель має підтримувати вхідні зображення; текстові-only моделі можуть відхилити запит на рівні провайдера.
- `model run --prompt` має містити текст не лише з пробільних символів; порожні prompts відхиляються до виклику локальних провайдерів або Gateway.
- Локальний `model run` завершується з ненульовим кодом, коли провайдер не повертає текстового виводу, тому недосяжні локальні провайдери й порожні completions не виглядають як успішні проби.
- Використовуйте `model run --gateway`, коли потрібно протестувати маршрутизацію Gateway, налаштування agent-runtime або стан провайдера, керований Gateway, зберігаючи модельний вхід сирим. Використовуйте `openclaw agent` або чат-поверхні, коли потрібні повний контекст агента, інструменти, пам’ять і transcript сесії.
- `model auth login`, `model auth logout` і `model auth status` керують збереженим станом авторизації провайдера.

## Зображення

Використовуйте `image` для генерації, редагування й опису.

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
  `--model openai/gpt-image-1.5` для PNG-виводу OpenAI з прозорим фоном;
  `--openai-background` залишається доступним як специфічний для OpenAI alias. Провайдери,
  які не оголошують підтримку фону, повідомляють цю підказку як проігнороване перевизначення.
- Використовуйте `image providers --json`, щоб перевірити, які вбудовані провайдери зображень
  виявляються, налаштовані, вибрані та які можливості генерації/редагування
  надає кожен провайдер.
- Використовуйте `image generate --model <provider/model> --json` як найвужчий live
  CLI-smoke для змін генерації зображень. Приклад:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON-відповідь повідомляє `ok`, `provider`, `model`, `attempts` і шляхи
  записаних вихідних файлів. Коли задано `--output`, кінцеве розширення може відповідати
  MIME-типу, який повернув провайдер.

- Для `image describe` та `image describe-many` використовуйте `--prompt`, щоб надати моделі комп’ютерного зору інструкцію для конкретного завдання, як-от OCR, порівняння, перевірка UI або стислий підпис.
- Використовуйте `--timeout-ms` з повільними локальними моделями комп’ютерного зору або холодними запусками Ollama.
- Для `image describe` `--model` має бути моделлю `<provider/model>` із підтримкою зображень.
- Для локальних моделей комп’ютерного зору Ollama спочатку завантажте модель і задайте для `OLLAMA_API_KEY` будь-яке значення-заповнювач, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

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

- `tts status` за замовчуванням використовує Gateway, оскільки відображає стан TTS, керований Gateway.
- Використовуйте `tts providers`, `tts voices` і `tts set-provider`, щоб переглядати та налаштовувати поведінку TTS.

## Відео

Використовуйте `video` для генерування й опису.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Примітки:

- `video generate` приймає `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` і `--timeout-ms` та передає їх до середовища виконання генерування відео.
- `--model` має бути `<provider/model>` для `video describe`.

## Веб

Використовуйте `web` для робочих процесів пошуку й отримання даних.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Примітки:

- Використовуйте `web providers`, щоб переглянути доступних, налаштованих і вибраних провайдерів.

## Вбудовування

Використовуйте `embedding` для створення векторів і перевірки провайдера вбудовувань.

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

Для команд генерування медіа `outputs` містить файли, записані OpenClaw. Використовуйте
`path`, `mimeType`, `size` і будь-які медіаспецифічні розміри в цьому масиві
для автоматизації замість розбору зрозумілого для людини stdout.

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
