---
read_when:
    - Додавання або змінення команд `openclaw infer`
    - Проєктування стабільної безголової автоматизації можливостей
summary: Infer-first CLI для робочих процесів із моделями, зображеннями, аудіо, TTS, відео, вебом та вбудовуваннями на базі провайдерів
title: CLI Inference
x-i18n:
    generated_at: "2026-04-23T06:18:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57d2438d0da24e1ed880bbacd244ede4af56beba4ac1baa3f2a1e393e641c9c
    source_path: cli/infer.md
    workflow: 15
---

# CLI Inference

`openclaw infer` — це канонічна безголова поверхня для робочих процесів Inference на базі провайдерів.

Вона навмисно відкриває сімейства можливостей, а не сирі назви RPC Gateway і не сирі ідентифікатори інструментів агентів.

## Перетворіть infer на skill

Скопіюйте й вставте це агенту:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Хороший skill на основі infer має:

- зіставляти поширені наміри користувача з правильними підкомандами infer
- містити кілька канонічних прикладів infer для робочих процесів, які він охоплює
- віддавати перевагу `openclaw infer ...` у прикладах і рекомендаціях
- не дублювати повністю всю поверхню infer в тілі skill

Типове покриття skill, орієнтованого на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Чому варто використовувати infer

`openclaw infer` надає єдиний узгоджений CLI для завдань Inference на базі провайдерів в OpenClaw.

Переваги:

- Використовуйте провайдерів і моделі, уже налаштовані в OpenClaw, замість того щоб налаштовувати окремі одноразові обгортки для кожного бекенда.
- Тримайте робочі процеси для моделей, зображень, транскрибування аудіо, TTS, відео, вебу та вбудовувань у межах одного дерева команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентами.
- Віддавайте перевагу власній поверхні OpenClaw, коли завдання по суті полягає у «виконанні Inference».
- Використовуйте звичайний локальний шлях без потреби запускати gateway для більшості команд infer.

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

Ця таблиця зіставляє поширені завдання Inference з відповідною командою infer.

| Завдання                  | Команда                                                                | Примітки                                              |
| ------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Виконати текстовий/модельний запит | `openclaw infer model run --prompt "..." --json`                       | За замовчуванням використовує звичайний локальний шлях |
| Згенерувати зображення    | `openclaw infer image generate --prompt "..." --json`                  | Використовуйте `image edit`, якщо починаєте з наявного файлу |
| Описати файл зображення   | `openclaw infer image describe --file ./image.png --json`              | `--model` має бути `<provider/model>` із підтримкою зображень |
| Транскрибувати аудіо      | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` має бути `<provider/model>`                 |
| Синтезувати мовлення      | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` орієнтований на gateway                  |
| Згенерувати відео         | `openclaw infer video generate --prompt "..." --json`                  |                                                       |
| Описати відеофайл         | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` має бути `<provider/model>`                 |
| Шукати у вебі             | `openclaw infer web search --query "..." --json`                       |                                                       |
| Отримати вебсторінку      | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Створити вбудовування     | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Поведінка

- `openclaw infer ...` — основна поверхня CLI для цих робочих процесів.
- Використовуйте `--json`, коли вивід споживатиметься іншою командою або скриптом.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Для `image describe`, `audio transcribe` і `video describe` `--model` має використовувати форму `<provider/model>`.
- Для `image describe` явний `--model` запускає цю пару провайдер/модель безпосередньо. Модель має підтримувати зображення в каталозі моделей або конфігурації провайдера.
- Команди безстанового виконання за замовчуванням локальні.
- Команди для стану, яким керує gateway, за замовчуванням використовують gateway.
- Звичайний локальний шлях не вимагає, щоб gateway був запущений.

## Model

Використовуйте `model` для текстового Inference на базі провайдерів і перевірки моделі/провайдера.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.4 --json
```

Примітки:

- `model run` повторно використовує середовище виконання агента, тому перевизначення провайдера/моделі поводяться як у звичайному виконанні агента.
- `model auth login`, `model auth logout` і `model auth status` керують збереженим станом автентифікації провайдера.

## Image

Використовуйте `image` для генерації, редагування та опису.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Примітки:

- Використовуйте `image edit`, якщо починаєте з наявних вхідних файлів.
- Для `image describe` `--model` має бути `<provider/model>` із підтримкою зображень.
- Для локальних візуальних моделей Ollama спочатку завантажте модель і встановіть `OLLAMA_API_KEY` у будь-яке значення-заповнювач, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

## Audio

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

Використовуйте `tts` для синтезу мовлення та стану провайдера TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Примітки:

- `tts status` за замовчуванням використовує gateway, оскільки відображає стан TTS, яким керує gateway.
- Використовуйте `tts providers`, `tts voices` і `tts set-provider` для перевірки та налаштування поведінки TTS.

## Video

Використовуйте `video` для генерації та опису.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Примітки:

- Для `video describe` `--model` має бути `<provider/model>`.

## Web

Використовуйте `web` для робочих процесів пошуку та отримання даних.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Примітки:

- Використовуйте `web providers` для перевірки доступних, налаштованих і вибраних провайдерів.

## Embedding

Використовуйте `embedding` для створення векторів і перевірки провайдера вбудовувань.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Вивід JSON

Команди infer нормалізують вивід JSON у межах спільної оболонки:

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

Поля верхнього рівня є стабільними:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

## Поширені помилки

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

- `openclaw capability ...` є псевдонімом для `openclaw infer ...`.
