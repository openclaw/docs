---
read_when:
    - Додавання або змінення команд `openclaw infer`
    - Проєктування стабільної автоматизації можливостей без графічного інтерфейсу
summary: CLI з пріоритетним визначенням для робочих процесів моделі, зображень, аудіо, TTS, відео, вебу та ембедингів із підтримкою провайдера
title: CLI для inference
x-i18n:
    generated_at: "2026-04-25T08:04:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bd8179425f47a991a4577607db93b51724ac10b90b438397de4394a279d4eb8
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` — це канонічна безголова поверхня для робочих процесів inference із підтримкою провайдера.

Вона навмисно надає сімейства можливостей, а не сирі назви gateway RPC і не сирі ідентифікатори інструментів агента.

## Перетворення infer на skill

Скопіюйте й вставте це агенту:

```text
Прочитай https://docs.openclaw.ai/cli/infer, а потім створи skill, який спрямовує мої типові робочі процеси до `openclaw infer`.
Зосередься на запусках моделей, генерації зображень, генерації відео, транскрибуванні аудіо, TTS, вебпошуку та ембедингах.
```

Хороший skill на основі infer має:

- зіставляти типові наміри користувача з правильним підкомандним рядком infer
- містити кілька канонічних прикладів infer для робочих процесів, які він охоплює
- надавати перевагу `openclaw infer ...` у прикладах і пропозиціях
- уникати повторного документування всієї поверхні infer всередині тіла skill

Типове охоплення skill, зосередженого на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Навіщо використовувати infer

`openclaw infer` надає єдиний узгоджений CLI для завдань inference із підтримкою провайдера в OpenClaw.

Переваги:

- Використовуйте провайдери та моделі, уже налаштовані в OpenClaw, замість підключення окремих одноразових обгорток для кожного бекенда.
- Тримайте робочі процеси моделей, зображень, транскрибування аудіо, TTS, відео, вебу та ембедингів в одному дереві команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентом.
- Віддавайте перевагу власній поверхні OpenClaw, якщо завдання за своєю суттю полягає у «виконанні inference».
- Використовуйте звичайний локальний шлях без потреби в gateway для більшості команд infer.

Для наскрізних перевірок провайдера віддавайте перевагу `openclaw infer ...`, коли тести провайдера нижчого рівня вже зелені. Це перевіряє постачуваний CLI, завантаження конфігурації, визначення агента за замовчуванням, активацію вбудованого Plugin, відновлення залежностей середовища виконання та спільне середовище виконання можливостей до того, як буде зроблено запит до провайдера.

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

Ця таблиця зіставляє типові завдання inference з відповідною командою infer.

| Завдання                | Команда                                                                | Примітки                                              |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Виконати текстовий запит/запит до моделі | `openclaw infer model run --prompt "..." --json`                       | За замовчуванням використовує звичайний локальний шлях |
| Згенерувати зображення  | `openclaw infer image generate --prompt "..." --json`                  | Використовуйте `image edit`, якщо починаєте з наявного файлу |
| Описати файл зображення | `openclaw infer image describe --file ./image.png --json`              | `--model` має бути зображувально-сумісною у форматі `<provider/model>` |
| Транскрибувати аудіо    | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` має бути у форматі `<provider/model>`       |
| Синтезувати мовлення    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` орієнтований на gateway                  |
| Згенерувати відео       | `openclaw infer video generate --prompt "..." --json`                  |                                                       |
| Описати відеофайл       | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` має бути у форматі `<provider/model>`       |
| Шукати у вебі           | `openclaw infer web search --query "..." --json`                       |                                                       |
| Отримати вебсторінку    | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Створити ембединги      | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Поведінка

- `openclaw infer ...` — основна поверхня CLI для цих робочих процесів.
- Використовуйте `--json`, коли вивід споживатиметься іншою командою або скриптом.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Для `image describe`, `audio transcribe` і `video describe` параметр `--model` має використовувати форму `<provider/model>`.
- Для `image describe` явний `--model` напряму запускає цю пару провайдер/модель. Модель має підтримувати зображення в каталозі моделей або конфігурації провайдера. `codex/<model>` запускає обмежений turn розуміння зображень Codex app-server; `openai-codex/<model>` використовує шлях провайдера OpenAI Codex OAuth.
- Команди безстанового виконання за замовчуванням локальні.
- Команди стану, керованого gateway, за замовчуванням використовують gateway.
- Звичайний локальний шлях не вимагає, щоб gateway був запущений.
- `model run` — одноразовий запуск. MCP-сервери, відкриті через середовище виконання агента для цієї команди, завершуються після відповіді як для локального виконання, так і для `--gateway`, тому повторні скриптові виклики не залишають живими дочірні stdio MCP-процеси.

## Model

Використовуйте `model` для текстового inference із підтримкою провайдера та перевірки моделі/провайдера.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Примітки:

- `model run` повторно використовує середовище виконання агента, тому перевизначення провайдера/моделі поводяться як у звичайному виконанні агента.
- Оскільки `model run` призначений для безголової автоматизації, він не зберігає вбудовані MCP-середовища виконання на сесію після завершення команди.
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
- Використовуйте `image providers --json`, щоб перевірити, які вбудовані провайдери зображень можна виявити, налаштувати, вибрати та які можливості генерації/редагування надає кожен провайдер.
- Використовуйте `image generate --model <provider/model> --json` як найвужчу живу CLI smoke-перевірку для змін генерації зображень. Приклад:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Відповідь JSON повідомляє `ok`, `provider`, `model`, `attempts` і записані шляхи виводу. Якщо задано `--output`, кінцеве розширення може відповідати MIME-типу, який повернув провайдер.

- Для `image describe` параметр `--model` має бути зображувально-сумісною моделлю у форматі `<provider/model>`.
- Для локальних моделей Ollama з підтримкою зору спочатку завантажте модель і встановіть `OLLAMA_API_KEY` у будь-яке заповнювальне значення, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

## Audio

Використовуйте `audio` для транскрибування файлів.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Примітки:

- `audio transcribe` призначений для транскрибування файлів, а не для керування сесіями в реальному часі.
- `--model` має бути у форматі `<provider/model>`.

## TTS

Використовуйте `tts` для синтезу мовлення та стану провайдера TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Примітки:

- `tts status` за замовчуванням використовує gateway, оскільки відображає стан TTS, керований gateway.
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

- Для `video describe` параметр `--model` має бути у форматі `<provider/model>`.

## Web

Використовуйте `web` для робочих процесів пошуку та отримання сторінок.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Примітки:

- Використовуйте `web providers`, щоб перевірити доступних, налаштованих і вибраних провайдерів.

## Embedding

Використовуйте `embedding` для створення векторів і перевірки провайдерів ембедингів.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Вивід JSON

Команди infer нормалізують вивід JSON у спільний контейнер:

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

Для команд генерації медіа `outputs` містить файли, записані OpenClaw. Використовуйте `path`, `mimeType`, `size` і будь-які специфічні для медіа розміри в цьому масиві для автоматизації замість розбору людиночитного stdout.

## Типові помилки

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

- `openclaw capability ...` — псевдонім для `openclaw infer ...`.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Моделі](/uk/concepts/models)
