---
read_when:
    - Додавання або змінення `openclaw infer` команд
    - Проєктування стабільної безінтерфейсної автоматизації можливостей
summary: CLI, орієнтований насамперед на інференс, для робочих процесів моделей, зображень, аудіо, TTS, відео, вебу та ембедингів на базі провайдерів
title: CLI для інференсу
x-i18n:
    generated_at: "2026-04-28T11:07:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8a4d0805b88f08ba810dc8473c5c052ad6bfe1c8044c233376ac8aae9ea6c7e
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` — це канонічна headless-поверхня для inference-робочих процесів на основі провайдерів.

Вона навмисно відкриває сімейства можливостей, а не сирі назви Gateway RPC і не сирі ідентифікатори інструментів агента.

## Перетворення infer на Skill

Скопіюйте й вставте це в агента:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Добрий Skill на основі infer має:

- зіставляти поширені наміри користувача з правильним підкомандним infer
- містити кілька канонічних прикладів infer для робочих процесів, які він охоплює
- віддавати перевагу `openclaw infer ...` у прикладах і пропозиціях
- уникати повторного документування всієї поверхні infer у тілі Skill

Типове покриття Skill, зосередженого на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Навіщо використовувати infer

`openclaw infer` надає один узгоджений CLI для inference-завдань на основі провайдерів усередині OpenClaw.

Переваги:

- Використовуйте провайдерів і моделі, уже налаштовані в OpenClaw, замість створення одноразових обгорток для кожного бекенда.
- Тримайте робочі процеси для моделей, зображень, транскрипції аудіо, TTS, відео, вебу та embeddings в одному дереві команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентами.
- Віддавайте перевагу першосторонній поверхні OpenClaw, коли завдання за суттю є "запустити inference".
- Використовуйте звичайний локальний шлях без потреби в Gateway для більшості команд infer.

Для наскрізних перевірок провайдера віддавайте перевагу `openclaw infer ...`, коли нижчорівневі
тести провайдера вже зелені. Це перевіряє відвантажений CLI, завантаження конфігурації,
розв’язання агента за замовчуванням, активацію bundled Plugin, відновлення runtime-залежностей
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

Ця таблиця зіставляє поширені inference-завдання з відповідною командою infer.

| Завдання                | Команда                                                                  | Примітки                                              |
| ----------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| Запустити текстовий/модельний prompt | `openclaw infer model run --prompt "..." --json`                         | За замовчуванням використовує звичайний локальний шлях |
| Згенерувати зображення  | `openclaw infer image generate --prompt "..." --json`                    | Використовуйте `image edit`, коли починаєте з наявного файла |
| Описати файл зображення | `openclaw infer image describe --file ./image.png --prompt "..." --json` | `--model` має бути image-capable `<provider/model>` |
| Транскрибувати аудіо    | `openclaw infer audio transcribe --file ./memo.m4a --json`               | `--model` має бути `<provider/model>`                  |
| Синтезувати мовлення    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`   | `tts status` орієнтований на Gateway                  |
| Згенерувати відео       | `openclaw infer video generate --prompt "..." --json`                    | Підтримує підказки провайдера, як-от `--resolution`   |
| Описати відеофайл       | `openclaw infer video describe --file ./clip.mp4 --json`                 | `--model` має бути `<provider/model>`                  |
| Шукати в вебі           | `openclaw infer web search --query "..." --json`                         |                                                       |
| Отримати вебсторінку    | `openclaw infer web fetch --url https://example.com --json`              |                                                       |
| Створити embeddings     | `openclaw infer embedding create --text "..." --json`                    |                                                       |

## Поведінка

- `openclaw infer ...` є основною CLI-поверхнею для цих робочих процесів.
- Використовуйте `--json`, коли вивід споживатиме інша команда або скрипт.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Для `image describe`, `audio transcribe` і `video describe` `--model` має використовувати форму `<provider/model>`.
- Для `image describe` явний `--model` запускає цей провайдер/модель напряму. Модель має бути image-capable у каталозі моделей або конфігурації провайдера. `codex/<model>` запускає обмежений turn розуміння зображення через app-server Codex; `openai-codex/<model>` використовує шлях OpenAI Codex OAuth provider.
- Stateless-команди виконання за замовчуванням локальні.
- Команди стану, керованого Gateway, за замовчуванням використовують Gateway.
- Звичайний локальний шлях не потребує запущеного Gateway.
- Локальний `model run` — це легкий одноразовий provider completion. Він розв’язує налаштовану модель агента й auth, але не запускає turn chat-агента, не завантажує інструменти й не відкриває bundled MCP servers.
- `model run --gateway` перевіряє маршрутизацію Gateway, збережений auth, вибір провайдера та вбудований runtime, але все ще працює як сирий probe моделі: він надсилає наданий prompt без попереднього transcript сесії, bootstrap/AGENTS context, context-engine assembly, інструментів або bundled MCP servers.

## Модель

Використовуйте `model` для text inference на основі провайдера та інспекції моделей/провайдерів.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
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
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
```

Примітки:

- Локальний `model run` є найвужчим CLI smoke для стану провайдера/моделі/auth, бо надсилає вибраній моделі лише наданий prompt.
- `model run --prompt` має містити текст, що не складається лише з пробілів; порожні prompts відхиляються до виклику локальних провайдерів або Gateway.
- Локальний `model run` завершується з ненульовим кодом, коли провайдер не повертає текстовий вивід, тому недоступні локальні провайдери й порожні completions не виглядають як успішні probes.
- Використовуйте `model run --gateway`, коли потрібно протестувати маршрутизацію Gateway, налаштування agent-runtime або стан провайдера, керований Gateway, зберігаючи сирий ввід моделі. Використовуйте `openclaw agent` або chat-поверхні, коли потрібні повний context агента, інструменти, пам’ять і transcript сесії.
- `model auth login`, `model auth logout` і `model auth status` керують збереженим auth-станом провайдера.

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
  провайдерів/моделей, які підтримують geometry hints під час редагування reference-image.
- Використовуйте `--output-format png --background transparent` з
  `--model openai/gpt-image-1.5` для PNG-виводу OpenAI з прозорим фоном;
  `--openai-background` лишається доступним як специфічний для OpenAI alias. Провайдери,
  які не декларують підтримку фону, повідомляють цю підказку як ignored override.
- Використовуйте `image providers --json`, щоб перевірити, які bundled image providers є
  discoverable, configured, selected і які можливості generation/edit
  відкриває кожен провайдер.
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

  JSON-відповідь повідомляє `ok`, `provider`, `model`, `attempts` і записані
  шляхи виводу. Коли задано `--output`, фінальне розширення може відповідати
  MIME-типу, повернутому провайдером.

- Для `image describe` і `image describe-many` використовуйте `--prompt`, щоб дати vision model task-specific інструкцію, як-от OCR, comparison, UI inspection або concise captioning.
- Використовуйте `--timeout-ms` із повільними локальними vision models або холодними запусками Ollama.
- Для `image describe` `--model` має бути image-capable `<provider/model>`.
- Для локальних vision models Ollama спочатку завантажте модель і встановіть `OLLAMA_API_KEY` у будь-яке placeholder-значення, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

## Аудіо

Використовуйте `audio` для транскрипції файлів.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Примітки:

- `audio transcribe` призначений для транскрипції файлів, а не realtime session management.
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

- `tts status` за замовчуванням використовує Gateway, бо відображає TTS-стан, керований Gateway.
- Використовуйте `tts providers`, `tts voices` і `tts set-provider`, щоб інспектувати й налаштовувати поведінку TTS.

## Відео

Використовуйте `video` для генерації й опису.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Примітки:

- `video generate` приймає `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` і `--timeout-ms` та передає їх до середовища виконання генерації відео.
- `--model` має бути у форматі `<provider/model>` для `video describe`.

## Веб

Використовуйте `web` для робочих процесів пошуку й отримання.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Примітки:

- Використовуйте `web providers`, щоб переглянути доступних, налаштованих і вибраних провайдерів.

## Ембединг

Використовуйте `embedding` для створення векторів і перегляду провайдерів ембедингів.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Вивід JSON

Команди infer нормалізують JSON-вивід у спільній оболонці:

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

Для команд генерованих медіа `outputs` містить файли, записані OpenClaw. Використовуйте
`path`, `mimeType`, `size` і будь-які специфічні для медіа розміри в цьому масиві
для автоматизації замість парсингу stdout, призначеного для читання людиною.

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
