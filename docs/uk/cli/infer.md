---
read_when:
    - Додавання або змінення команд `openclaw infer`
    - Проєктування стабільної headless-автоматизації можливостей
summary: CLI з пріоритетом виведення для робочих процесів моделей, зображень, аудіо, TTS, відео, вебу та вбудовувань на базі провайдера
title: CLI для інференсу
x-i18n:
    generated_at: "2026-07-01T08:30:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb63996dd1364bffba58d4b132849ac4157fb612555c009da795c963142f9368
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` — це канонічна headless-поверхня для inference-робочих процесів на базі провайдерів.

Вона навмисно відкриває сімейства можливостей, а не сирі назви Gateway RPC і не сирі ідентифікатори інструментів агента.

## Перетворіть infer на skill

Скопіюйте й вставте це агенту:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Хороший skill на базі infer має:

- зіставляти типові наміри користувача з правильним підкомандою infer
- містити кілька канонічних прикладів infer для робочих процесів, які він охоплює
- віддавати перевагу `openclaw infer ...` у прикладах і рекомендаціях
- не передокументувати всю поверхню infer всередині тіла skill

Типове покриття skill, зосередженого на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Навіщо використовувати infer

`openclaw infer` надає один узгоджений CLI для inference-завдань на базі провайдерів усередині OpenClaw.

Переваги:

- Використовуйте провайдерів і моделі, уже налаштовані в OpenClaw, замість створення одноразових обгорток для кожного бекенда.
- Тримайте робочі процеси для моделей, зображень, транскрибування аудіо, TTS, відео, вебу й embeddings в одному дереві команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентами.
- Віддавайте перевагу first-party поверхні OpenClaw, коли завдання по суті є "запустити inference".
- Використовуйте звичайний локальний шлях без потреби в Gateway для більшості команд infer.

Для наскрізних перевірок провайдера віддавайте перевагу `openclaw infer ...`, коли низькорівневі
тести провайдера вже зелені. Це перевіряє доставлений CLI, завантаження конфігурації,
розв’язання агента за замовчуванням, активацію bundled plugin і спільний runtime
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

Ця таблиця зіставляє поширені inference-завдання з відповідною командою infer.

| Завдання                      | Команда                                                                                       | Примітки                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Запустити текстовий/model prompt | `openclaw infer model run --prompt "..." --json`                                              | За замовчуванням використовує звичайний локальний шлях |
| Запустити model prompt на зображеннях | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Повторюйте `--file` для кількох вхідних зображень     |
| Згенерувати зображення        | `openclaw infer image generate --prompt "..." --json`                                         | Використовуйте `image edit`, коли починаєте з наявного файла |
| Описати файл зображення або URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` має бути image-capable `<provider/model>`   |
| Транскрибувати аудіо          | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` має бути `<provider/model>`                 |
| Синтезувати мовлення          | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` орієнтовано на Gateway                   |
| Згенерувати відео             | `openclaw infer video generate --prompt "..." --json`                                         | Підтримує підказки провайдера, як-от `--resolution`   |
| Описати відеофайл             | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` має бути `<provider/model>`                 |
| Шукати в інтернеті            | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Отримати вебсторінку          | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Створити embeddings           | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Поведінка

- `openclaw infer ...` є основною CLI-поверхнею для цих робочих процесів.
- Використовуйте `--json`, коли вивід споживатиметься іншою командою або скриптом.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Використовуйте `model run --thinking <level>`, щоб передати одноразовий рівень thinking/reasoning (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` або `max`), зберігаючи запуск сирим.
- Для `image describe`, `audio transcribe` і `video describe` `--model` має використовувати форму `<provider/model>`.
- Для `image describe` `--file` приймає локальні шляхи та HTTP(S) URL зображень. Віддалені URL використовують звичайну політику media-fetch SSRF.
- Для `image describe` явний `--model` спершу запускає цей провайдер/model, а потім пробує налаштовані `agents.defaults.imageModel.fallbacks`, коли виклик моделі завершується помилкою. Помилки підготовки введення, як-от відсутні файли або непідтримувані URL, завершуються помилкою до спроб fallback. Модель має бути image-capable у каталозі моделей або конфігурації провайдера. `codex/<model>` запускає обмежений Codex app-server хід розуміння зображення; `openai/<model>` використовує шлях провайдера OpenAI з автентифікацією через API-key або ChatGPT/Codex OAuth.
- Команди stateless-виконання за замовчуванням локальні.
- Команди стану, керованого Gateway, за замовчуванням використовують Gateway.
- Звичайний локальний шлях не вимагає запущеного Gateway.
- Локальний `model run` — це легке одноразове completion провайдера. Він розв’язує налаштовану модель агента й автентифікацію, але не запускає хід chat-agent, не завантажує інструменти й не відкриває bundled MCP servers.
- `model run --file` приймає файли зображень, визначає їхній MIME-тип і надсилає їх із наданим prompt до вибраної моделі. Повторюйте `--file` для кількох зображень.
- `model run --file` відхиляє вхідні дані, що не є зображеннями. Використовуйте `infer audio transcribe` для аудіофайлів і `infer video describe` для відеофайлів.
- `model run --gateway` перевіряє маршрутизацію Gateway, збережену автентифікацію, вибір провайдера й вбудований runtime, але все одно працює як сирий model probe: він надсилає наданий prompt і будь-які вкладення зображень без попереднього transcript сесії, bootstrap/AGENTS context, складання context-engine, інструментів або bundled MCP servers.
- `model run --gateway --model <provider/model>` потребує довірених облікових даних оператора Gateway, бо запит просить Gateway виконати одноразовий override провайдера/model.
- Локальний `model run --thinking` використовує легкий шлях provider-completion; специфічні для провайдера рівні, як-от `adaptive` і `max`, зіставляються з найближчим переносним рівнем simple-completion.

## Модель

Використовуйте `model` для текстового inference на базі провайдера й інспекції model/provider.

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

- Локальний `model run` — це найвужчий CLI smoke для перевірки справності provider/model/auth, бо для провайдерів, що не є Codex, він надсилає лише наданий prompt до вибраної моделі.
- Локальний `model run --model <provider/model>` може використовувати точні bundled static catalog rows з `models list --all` до того, як цей провайдер буде записано в конфігурацію. Автентифікація провайдера все одно потрібна; відсутні облікові дані завершуються auth-помилками, а не `Unknown model`.
- Для reasoning probes Mistral Medium 3.5 залиште temperature unset/default. Mistral відхиляє `reasoning_effort="high"` плюс `temperature: 0`; використовуйте `mistral/mistral-medium-3-5` із default temperature або ненульовим reasoning-mode значенням, як-от `0.7`.
- Локальні probes Codex Responses — вузький виняток: OpenClaw додає мінімальну системну інструкцію, щоб transport міг заповнити обов’язкове поле `instructions`, не додаючи повного контексту агента, інструментів, пам’яті або transcript сесії.
- Локальний `model run --file` зберігає цей легкий шлях і прикріплює вміст зображення напряму до одного повідомлення користувача. Типові файли зображень, як-от PNG, JPEG і WebP, працюють, коли їхній MIME-тип визначено як `image/*`; непідтримувані або нерозпізнані файли завершуються помилкою до виклику провайдера.
- `model run --file` найкраще підходить, коли потрібно напряму протестувати вибрану мультимодальну текстову модель. Використовуйте `infer image describe`, коли потрібні вибір провайдера розуміння зображень OpenClaw і маршрутизація default image-model.
- Вибрана модель має підтримувати введення зображень; text-only моделі можуть відхилити запит на рівні провайдера.
- `model run --prompt` має містити текст із непробільними символами; порожні prompts відхиляються до виклику локальних провайдерів або Gateway.
- Локальний `model run` завершується з ненульовим кодом, коли провайдер не повертає текстового виводу, тож недосяжні локальні провайдери й порожні completions не виглядають як успішні probes.
- Використовуйте `model run --gateway`, коли потрібно протестувати маршрутизацію Gateway, налаштування agent-runtime або стан провайдера, керований Gateway, зберігаючи вхідні дані моделі сирими. Використовуйте `openclaw agent` або chat surfaces, коли потрібні повний контекст агента, інструменти, пам’ять і transcript сесії.
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
  провайдерів/моделей, які підтримують підказки геометрії під час редагування з референсним зображенням.
- Використовуйте `--output-format png --background transparent` з
  `--model openai/gpt-image-1.5` для PNG-виводу OpenAI з прозорим фоном;
  `--openai-background` залишається доступним як специфічний для OpenAI псевдонім. Провайдери,
  які не декларують підтримку фону, повідомляють цю підказку як проігнороване перевизначення.
- Використовуйте `--quality low|medium|high|auto` для провайдерів, які підтримують підказки
  якості зображення, зокрема OpenAI. OpenAI також приймає `--openai-moderation low|auto` для
  специфічної для провайдера підказки модерації.
- Використовуйте `image providers --json`, щоб перевірити, які вбудовані провайдери зображень
  доступні для виявлення, налаштовані, вибрані, а також які можливості генерації/редагування
  надає кожен провайдер.
- Використовуйте `image generate --model <provider/model> --json` як найвужчий живий
  CLI smoke для змін у генерації зображень. Приклад:

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
  MIME-типу, поверненому провайдером.

- Для `image describe` та `image describe-many` використовуйте `--prompt`, щоб дати моделі комп’ютерного зору інструкцію для конкретного завдання, як-от OCR, порівняння, перевірка UI або стислий підпис.
- Використовуйте `--timeout-ms` з повільними локальними моделями комп’ютерного зору або холодними запусками Ollama.
- Для `image describe` `--model` має бути здатною працювати із зображеннями `<provider/model>`.
  Коли його задано, OpenClaw спочатку пробує цю явну модель, а потім налаштовані
  резервні image-model, якщо виклик моделі не вдається.
- Для локальних моделей комп’ютерного зору Ollama спочатку завантажте модель і встановіть `OLLAMA_API_KEY` у будь-яке значення-заповнювач, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

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

Використовуйте `tts` для синтезу мовлення та стану провайдера TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Примітки:

- `tts status` за замовчуванням використовує Gateway, тому що відображає стан TTS, керований Gateway.
- Використовуйте `tts providers`, `tts voices` і `tts set-provider`, щоб перевіряти та налаштовувати поведінку TTS.

## Відео

Використовуйте `video` для генерації та опису.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Примітки:

- `video generate` приймає `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` і `--timeout-ms` та передає їх до runtime генерації відео.
- `--model` має бути `<provider/model>` для `video describe`.

## Web

Використовуйте `web` для workflow пошуку та отримання даних.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Примітки:

- Використовуйте `web providers`, щоб перевірити доступних, налаштованих і вибраних провайдерів.

## Embedding

Використовуйте `embedding` для створення векторів і перевірки провайдера embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Вивід JSON

Команди Infer нормалізують вивід JSON у спільному конверті:

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
для автоматизації замість розбору зрозумілого людині stdout.

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
