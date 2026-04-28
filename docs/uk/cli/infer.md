---
read_when:
    - Додавання або змінення `openclaw infer` команд
    - Проєктування стабільної автоматизації можливостей без інтерфейсу
summary: CLI, орієнтований насамперед на інференс, для робочих процесів із моделями, зображеннями, аудіо, TTS, відео, вебом та ембедингами на базі провайдерів
title: CLI для інференсу
x-i18n:
    generated_at: "2026-04-28T17:56:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b284a884605ee7c0095652bf1b947dbc2ce78ef70532a161d97553379f348f6b
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` — це канонічна headless-поверхня для робочих процесів інференсу на базі провайдерів.

Вона навмисно надає сімейства можливостей, а не сирі назви RPC Gateway і не сирі ідентифікатори інструментів агента.

## Перетворіть infer на навичку

Скопіюйте та вставте це в агента:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Добра навичка на основі infer має:

- зіставляти типові наміри користувача з правильной підкомандою infer
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

- Використовуйте провайдерів і моделі, уже налаштовані в OpenClaw, замість створення одноразових обгорток для кожного бекенда.
- Тримайте робочі процеси для моделей, зображень, транскрибування аудіо, TTS, відео, вебу та embeddings в одному дереві команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентом.
- Надавайте перевагу першосторонній поверхні OpenClaw, коли завдання по суті є «запустити інференс».
- Для більшості команд infer використовуйте звичайний локальний шлях без вимоги Gateway.

Для наскрізних перевірок провайдерів надавайте перевагу `openclaw infer ...`, коли нижчорівневі
тести провайдера вже зелені. Це перевіряє поставлений CLI, завантаження конфігурації,
розв’язання агента за замовчуванням, активацію вбудованого Plugin, відновлення runtime-залежностей
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

## Типові завдання

Ця таблиця зіставляє типові завдання інференсу з відповідною командою infer.

| Завдання                     | Команда                                                                                       | Примітки                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Запустити текстовий/модельний prompt | `openclaw infer model run --prompt "..." --json`                                              | За замовчуванням використовує звичайний локальний шлях |
| Запустити модельний prompt із зображеннями | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Повторіть `--file` для кількох вхідних зображень      |
| Згенерувати зображення       | `openclaw infer image generate --prompt "..." --json`                                         | Використовуйте `image edit`, коли починаєте з наявного файла |
| Описати файл зображення      | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` має бути моделлю з підтримкою зображень у формі `<provider/model>` |
| Транскрибувати аудіо         | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` має бути `<provider/model>`                  |
| Синтезувати мовлення         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` орієнтовано на Gateway                    |
| Згенерувати відео            | `openclaw infer video generate --prompt "..." --json`                                         | Підтримує підказки провайдера, як-от `--resolution`   |
| Описати відеофайл            | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` має бути `<provider/model>`                  |
| Шукати в інтернеті           | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Отримати вебсторінку         | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Створити embeddings          | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Поведінка

- `openclaw infer ...` — основна поверхня CLI для цих робочих процесів.
- Використовуйте `--json`, коли вивід споживатиме інша команда або скрипт.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Для `image describe`, `audio transcribe` і `video describe` `--model` має використовувати форму `<provider/model>`.
- Для `image describe` явний `--model` запускає цей provider/model напряму. Модель має підтримувати зображення в каталозі моделей або конфігурації провайдера. `codex/<model>` запускає обмежений хід Codex app-server для розуміння зображень; `openai-codex/<model>` використовує шлях OpenAI Codex OAuth provider.
- Команди виконання без стану за замовчуванням локальні.
- Команди стану, керованого Gateway, за замовчуванням використовують Gateway.
- Звичайний локальний шлях не потребує запущеного Gateway.
- Локальний `model run` — це компактне одноразове завершення провайдера. Він розв’язує налаштовану модель агента й автентифікацію, але не запускає хід chat-agent, не завантажує інструменти й не відкриває вбудовані MCP-сервери.
- `model run --file` приймає файли зображень, визначає їхній MIME-тип і надсилає їх із наданим prompt до вибраної моделі. Повторіть `--file` для кількох зображень.
- `model run --file` відхиляє вхідні дані, що не є зображеннями. Використовуйте `infer audio transcribe` для аудіофайлів і `infer video describe` для відеофайлів.
- `model run --gateway` перевіряє маршрутизацію Gateway, збережену автентифікацію, вибір провайдера та вбудований runtime, але все одно працює як сирий модельний probe: він надсилає наданий prompt і будь-які вкладення зображень без попереднього transcript сеансу, bootstrap/AGENTS context, складання context-engine, інструментів або вбудованих MCP-серверів.

## Модель

Використовуйте `model` для текстового інференсу на базі провайдерів і перевірки моделей/провайдерів.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Використовуйте повні посилання `<provider/model>`, щоб виконати smoke-test конкретного провайдера без
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

- Локальний `model run` — це найвужчий CLI smoke для перевірки стану provider/model/auth, бо він надсилає лише наданий prompt до вибраної моделі.
- Локальний `model run --file` зберігає цей компактний шлях і додає вміст зображення безпосередньо до одного повідомлення користувача. Поширені файли зображень, як-от PNG, JPEG і WebP, працюють, коли їхній MIME-тип визначено як `image/*`; непідтримувані або нерозпізнані файли завершуються помилкою до виклику провайдера.
- `model run --file` найкраще підходить, коли ви хочете напряму протестувати вибрану мультимодальну текстову модель. Використовуйте `infer image describe`, коли вам потрібні вибір провайдера розуміння зображень OpenClaw і маршрутизація image-model за замовчуванням.
- Вибрана модель має підтримувати вхідні зображення; моделі лише для тексту можуть відхилити запит на рівні провайдера.
- `model run --prompt` має містити текст не лише з пробілів; порожні prompts відхиляються до виклику локальних провайдерів або Gateway.
- Локальний `model run` завершується з ненульовим кодом, коли провайдер не повертає текстового виводу, тож недосяжні локальні провайдери й порожні завершення не виглядають як успішні probes.
- Використовуйте `model run --gateway`, коли потрібно протестувати маршрутизацію Gateway, налаштування agent-runtime або стан провайдера, керований Gateway, зберігаючи вхідні дані моделі сирими. Використовуйте `openclaw agent` або chat-поверхні, коли потрібні повний контекст агента, інструменти, пам’ять і transcript сеансу.
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
  провайдерів/моделей, що підтримують геометричні підказки під час редагування reference-image.
- Використовуйте `--output-format png --background transparent` з
  `--model openai/gpt-image-1.5` для PNG-виводу OpenAI з прозорим фоном;
  `--openai-background` залишається доступним як специфічний для OpenAI псевдонім. Провайдери,
  які не оголошують підтримку фону, повідомляють підказку як проігнороване перевизначення.
- Використовуйте `image providers --json`, щоб перевірити, які вбудовані провайдери зображень
  можна виявити, налаштовано, вибрано, і які можливості генерації/редагування
  надає кожен провайдер.
- Використовуйте `image generate --model <provider/model> --json` як найвужчий live
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
  MIME-типу, поверненому постачальником.

- Для `image describe` і `image describe-many` використовуйте `--prompt`, щоб надати візійній моделі інструкцію для конкретного завдання, наприклад OCR, порівняння, перевірку UI або стислий підпис.
- Використовуйте `--timeout-ms` із повільними локальними візійними моделями або холодними запусками Ollama.
- Для `image describe` `--model` має бути моделлю `<provider/model>` із підтримкою зображень.
- Для локальних візійних моделей Ollama спершу завантажте модель і задайте для `OLLAMA_API_KEY` будь-яке значення-заповнювач, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

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

Використовуйте `tts` для синтезу мовлення та стану постачальника TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Примітки:

- `tts status` за замовчуванням використовує gateway, оскільки відображає стан TTS, керований gateway.
- Використовуйте `tts providers`, `tts voices` і `tts set-provider`, щоб переглядати й налаштовувати поведінку TTS.

## Відео

Використовуйте `video` для генерації та опису.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Примітки:

- `video generate` приймає `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` і `--timeout-ms` та передає їх у середовище виконання генерації відео.
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

- Використовуйте `web providers`, щоб переглядати доступних, налаштованих і вибраних постачальників.

## Embedding

Використовуйте `embedding` для створення векторів і перегляду постачальника embeddings.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Вивід JSON

Команди infer нормалізують вивід JSON у спільній обгортці:

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

Для команд генерації медіа `outputs` містить файли, записані OpenClaw. Використовуйте
`path`, `mimeType`, `size` і будь-які специфічні для медіа розміри в цьому масиві
для автоматизації замість аналізу stdout, призначеного для читання людиною.

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
