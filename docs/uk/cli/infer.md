---
read_when:
    - Додавання або змінення команд `openclaw infer`
    - Проєктування стабільної автоматизації headless-можливостей
summary: CLI з автоматичним визначенням спочатку для робочих процесів моделей, зображень, аудіо, TTS, відео, вебу та ембедингів, що використовують провайдерів
title: CLI для інференсу
x-i18n:
    generated_at: "2026-04-27T22:22:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9dc003af66692fe85d11c74ef952b72668aa7c715090b92ca5511f680a963d
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` — це канонічна headless-поверхня для робочих процесів інференсу, що використовують провайдерів.

Вона навмисно відкриває сімейства можливостей, а не сирі назви Gateway RPC і не сирі ідентифікатори інструментів агента.

## Перетворення infer на skill

Скопіюйте й вставте це агенту:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Хороший skill на основі infer має:

- зіставляти поширені наміри користувача з правильним підкомандним рядком infer
- містити кілька канонічних прикладів infer для робочих процесів, які він охоплює
- віддавати перевагу `openclaw infer ...` у прикладах і підказках
- уникати повторного документування всієї поверхні infer всередині тіла skill

Типове охоплення skill, зосередженого на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Навіщо використовувати infer

`openclaw infer` надає єдиний узгоджений CLI для завдань інференсу, що використовують провайдерів, всередині OpenClaw.

Переваги:

- Використовуйте провайдерів і моделі, уже налаштовані в OpenClaw, замість створення одноразових обгорток для кожного бекенда.
- Тримайте робочі процеси моделей, зображень, транскрибування аудіо, TTS, відео, вебу та ембедингів під одним деревом команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентом.
- Віддавайте перевагу first-party поверхні OpenClaw, коли завдання по суті полягає в тому, щоб «виконати інференс».
- Використовуйте звичайний локальний шлях без потреби в Gateway для більшості команд infer.

Для наскрізних перевірок провайдерів віддавайте перевагу `openclaw infer ...`, коли нижчорівневі тести провайдерів уже зелені. Це перевіряє поставлений CLI, завантаження конфігурації, визначення агента за замовчуванням, активацію вбудованих Plugin, відновлення залежностей середовища виконання та спільне середовище можливостей до виконання запиту до провайдера.

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

| Завдання                | Команда                                                                | Примітки                                              |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Виконати текстовий/модельний запит | `openclaw infer model run --prompt "..." --json`                       | За замовчуванням використовує звичайний локальний шлях |
| Згенерувати зображення  | `openclaw infer image generate --prompt "..." --json`                  | Використовуйте `image edit`, якщо починаєте з наявного файла |
| Описати файл зображення | `openclaw infer image describe --file ./image.png --json`              | `--model` має бути image-capable у форматі `<provider/model>` |
| Транскрибувати аудіо    | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` має бути у форматі `<provider/model>`       |
| Синтезувати мовлення    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` орієнтовано на gateway                   |
| Згенерувати відео       | `openclaw infer video generate --prompt "..." --json`                  | Підтримує підказки для провайдерів, такі як `--resolution` |
| Описати відеофайл       | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` має бути у форматі `<provider/model>`       |
| Виконати пошук у вебі   | `openclaw infer web search --query "..." --json`                       |                                                       |
| Отримати вебсторінку    | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Створити ембединги      | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Поведінка

- `openclaw infer ...` — основна CLI-поверхня для цих робочих процесів.
- Використовуйте `--json`, коли вивід споживатиметься іншою командою або скриптом.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Для `image describe`, `audio transcribe` і `video describe` параметр `--model` має використовувати форму `<provider/model>`.
- Для `image describe` явний `--model` запускає цей provider/model безпосередньо. Модель має підтримувати роботу із зображеннями в каталозі моделей або конфігурації провайдера. `codex/<model>` запускає обмежений поворот app-server Codex для розуміння зображень; `openai-codex/<model>` використовує шлях провайдера OpenAI Codex OAuth.
- Команди stateless-виконання за замовчуванням локальні.
- Команди стану, керованого Gateway, за замовчуванням використовують gateway.
- Звичайний локальний шлях не вимагає, щоб gateway був запущений.
- Локальний `model run` — це легкий одноразовий provider completion. Він визначає налаштовану модель агента та auth, але не запускає поворот chat-agent, не завантажує інструменти й не відкриває вбудовані MCP-сервери.
- `model run --gateway` усе одно використовує середовище агента Gateway, щоб перевіряти той самий маршрутизований шлях виконання, що й звичайний поворот із підтримкою Gateway. MCP-сервери, відкриті через це середовище виконання, завершуються після відповіді, тому повторні скриптові виклики не залишають stdio MCP дочірні процеси активними.

## Model

Використовуйте `model` для текстового інференсу через провайдерів та перевірки моделей/провайдерів.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Використовуйте повні посилання `<provider/model>`, щоб виконати smoke-тест конкретного провайдера без запуску Gateway або завантаження повної поверхні інструментів агента:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
```

Примітки:

- Локальний `model run` — це найвужчий CLI smoke для перевірки стану провайдера/моделі/auth, оскільки він надсилає вибраній моделі лише переданий запит.
- Локальний `model run` завершується з ненульовим кодом, коли провайдер не повертає текстовий результат, щоб недоступні локальні провайдери та порожні completion не виглядали як успішні перевірки.
- Використовуйте `model run --gateway`, коли потрібно протестувати маршрутизацію Gateway, налаштування середовища агента або стан провайдера, керований Gateway, а не легкий локальний шлях completion.
- `model auth login`, `model auth logout` і `model auth status` керують збереженим станом auth провайдера.

## Image

Використовуйте `image` для генерації, редагування та опису.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Примітки:

- Використовуйте `image edit`, якщо починаєте з наявних вхідних файлів.
- Використовуйте `--size`, `--aspect-ratio` або `--resolution` з `image edit` для провайдерів/моделей, які підтримують підказки геометрії під час редагування за еталонним зображенням.
- Використовуйте `--output-format png --background transparent` з `--model openai/gpt-image-1.5` для прозорого фону в PNG-виводі OpenAI; `--openai-background` залишається доступним як OpenAI-специфічний псевдонім. Провайдери, які не декларують підтримку фону, повідомляють про цю підказку як про проігнороване перевизначення.
- Використовуйте `image providers --json`, щоб перевірити, які вбудовані провайдери зображень можна виявити, які налаштовано, які вибрано та які можливості генерації/редагування надає кожен провайдер.
- Використовуйте `image generate --model <provider/model> --json` як найвужчий live CLI smoke для змін у генерації зображень. Приклад:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Відповідь JSON повідомляє `ok`, `provider`, `model`, `attempts` і шляхи записаного виводу. Якщо встановлено `--output`, остаточне розширення може відповідати MIME-типу, повернутому провайдером.

- Для `image describe` параметр `--model` має бути image-capable у форматі `<provider/model>`.
- Для локальних vision-моделей Ollama спочатку завантажте модель і встановіть `OLLAMA_API_KEY` у будь-яке заповнювальне значення, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

## Audio

Використовуйте `audio` для транскрибування файлів.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Примітки:

- `audio transcribe` призначено для транскрибування файлів, а не для керування сеансами в реальному часі.
- `--model` має бути у форматі `<provider/model>`.

## TTS

Використовуйте `tts` для синтезу мовлення та стану TTS-провайдера.

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
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Примітки:

- `video generate` приймає `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` і `--timeout-ms` та передає їх у середовище виконання генерації відео.
- Для `video describe` параметр `--model` має бути у форматі `<provider/model>`.

## Web

Використовуйте `web` для робочих процесів пошуку та отримання вмісту.

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

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Моделі](/uk/concepts/models)
