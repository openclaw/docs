---
read_when:
    - Додавання або зміна команд `openclaw infer`
    - Проєктування стабільної headless-автоматизації можливостей
summary: 'Infer-first CLI для workflow, керованих provider-ом: моделей, зображень, аудіо, TTS, відео, web та embedding'
title: CLI inference
x-i18n:
    generated_at: "2026-04-23T20:47:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a93edb109474a0f2d72609c93563caf21b26adda033cb1ecd3fa646de0d304f
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` — це канонічна headless-поверхня для workflow inference, керованих provider-ом.

Вона навмисно відкриває сімейства можливостей, а не сирі RPC-імена gateway і не сирі id інструментів агента.

## Перетворіть infer на skill

Скопіюйте й вставте це агенту:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Хороший skill на основі infer має:

- зіставляти типові наміри користувача з правильною підкомандою infer
- містити кілька канонічних прикладів infer для workflow, які він охоплює
- віддавати перевагу `openclaw infer ...` у прикладах і підказках
- не дублювати всю поверхню infer в тілі skill

Типове охоплення skill, зосередженого на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Навіщо використовувати infer

`openclaw infer` надає єдиний узгоджений CLI для завдань inference, керованих provider-ом, у межах OpenClaw.

Переваги:

- Використовуйте providers і моделі, уже налаштовані в OpenClaw, замість підключення одноразових обгорток для кожного backend.
- Тримайте workflow моделей, зображень, транскрибування аудіо, TTS, відео, web та embedding під одним деревом команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та workflow, керованих агентом.
- Віддавайте перевагу first-party поверхні OpenClaw, коли завдання по суті є "запустити inference".
- Використовуйте звичайний локальний шлях без потреби в gateway для більшості команд infer.

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

Ця таблиця зіставляє типові завдання inference з відповідною командою infer.

| Завдання                | Команда                                                                | Примітки                                              |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Запустити текстовий/model prompt | `openclaw infer model run --prompt "..." --json`              | Типово використовує звичайний локальний шлях          |
| Згенерувати зображення  | `openclaw infer image generate --prompt "..." --json`                  | Використовуйте `image edit`, якщо починаєте з наявного файлу |
| Описати файл зображення | `openclaw infer image describe --file ./image.png --json`              | `--model` має бути `<provider/model>`, здатною до роботи із зображеннями |
| Транскрибувати аудіо    | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` має бути `<provider/model>`                 |
| Синтезувати мовлення    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` орієнтований на gateway                  |
| Згенерувати відео       | `openclaw infer video generate --prompt "..." --json`                  |                                                       |
| Описати відеофайл       | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` має бути `<provider/model>`                 |
| Шукати у web            | `openclaw infer web search --query "..." --json`                       |                                                       |
| Отримати web-сторінку   | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Створити embeddings     | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Поведінка

- `openclaw infer ...` — основна CLI-поверхня для цих workflow.
- Використовуйте `--json`, коли вивід буде споживатися іншою командою або скриптом.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний backend.
- Для `image describe`, `audio transcribe` і `video describe` `--model` має використовувати форму `<provider/model>`.
- Для `image describe` явний `--model` запускає цей provider/model напряму. Модель має підтримувати зображення в каталозі моделей або конфігурації provider-а.
- Команди безстанового виконання типово локальні.
- Команди стану, керованого gateway, типово використовують gateway.
- Звичайний локальний шлях не вимагає запущеного gateway.

## Model

Використовуйте `model` для текстового inference, керованого provider-ом, і перевірки model/provider.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Примітки:

- `model run` повторно використовує runtime агента, тому перевизначення provider/model поводяться як звичайне виконання агента.
- `model auth login`, `model auth logout` і `model auth status` керують збереженим станом автентифікації provider-а.

## Image

Використовуйте `image` для генерування, редагування й опису.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Примітки:

- Використовуйте `image edit`, якщо починаєте з наявних вхідних файлів.
- Для `image describe` `--model` має бути `<provider/model>`, здатною до роботи із зображеннями.
- Для локальних моделей vision Ollama спочатку завантажте модель і задайте `OLLAMA_API_KEY` будь-яким заповнювачем, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

## Audio

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

Використовуйте `tts` для синтезу мовлення й стану TTS provider-а.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Примітки:

- `tts status` типово використовує gateway, оскільки відображає стан TTS, керований gateway.
- Використовуйте `tts providers`, `tts voices` і `tts set-provider` для перевірки й налаштування поведінки TTS.

## Video

Використовуйте `video` для генерування й опису.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Примітки:

- Для `video describe` `--model` має бути `<provider/model>`.

## Web

Використовуйте `web` для workflow пошуку й отримання даних.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Примітки:

- Використовуйте `web providers` для перевірки доступних, налаштованих і вибраних providers.

## Embedding

Використовуйте `embedding` для створення векторів і перевірки provider-а embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Вивід JSON

Команди infer нормалізують вивід JSON у спільну обгортку:

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

## Типові помилки

```bash
# Погано
openclaw infer media image generate --prompt "friendly lobster"

# Добре
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Погано
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Добре
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Примітки

- `openclaw capability ...` — це псевдонім для `openclaw infer ...`.
