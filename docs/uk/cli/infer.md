---
read_when:
    - Додавання або змінення команд `openclaw infer`
    - Проєктування стабільної автоматизації можливостей без графічного інтерфейсу
summary: CLI з визначенням передусім для робочих процесів із моделями, зображеннями, аудіо, TTS, відео, вебом і ембедингами на основі провайдера
title: CLI для інференсу
x-i18n:
    generated_at: "2026-04-27T22:06:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 704f9ea60adb1b509f0b4f74ae79ffb70f12915a7e8a45d43ca28f5ac7d70af1
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` — це канонічна безграфічна поверхня для робочих процесів інференсу на основі провайдера.

Вона навмисно надає сімейства можливостей, а не сирі назви Gateway RPC і не сирі ідентифікатори інструментів агента.

## Перетворення infer на skill

Скопіюйте й вставте це агенту:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Хороший skill на основі infer має:

- зіставляти поширені наміри користувача з правильною підкомандою infer
- містити кілька канонічних прикладів infer для робочих процесів, які він охоплює
- надавати перевагу `openclaw infer ...` у прикладах і рекомендаціях
- уникати повторного документування всієї поверхні infer всередині тіла skill

Типове охоплення skill, зосередженого на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Чому варто використовувати infer

`openclaw infer` надає єдиний узгоджений CLI для завдань інференсу на основі провайдера всередині OpenClaw.

Переваги:

- Використовуйте провайдерів і моделі, уже налаштовані в OpenClaw, замість створення одноразових обгорток для кожного бекенда.
- Тримайте робочі процеси для моделей, зображень, транскрибування аудіо, TTS, відео, вебу та ембедингів в одному дереві команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентом.
- Надавайте перевагу першорядній поверхні OpenClaw, коли завдання за своєю суттю полягає в тому, щоб «виконати інференс».
- Використовуйте звичайний локальний шлях без потреби в Gateway для більшості команд infer.

Для наскрізних перевірок провайдера надавайте перевагу `openclaw infer ...`, коли тести провайдера нижчого рівня вже зелені. Це перевіряє постачений CLI, завантаження конфігурації, визначення агента за замовчуванням, активацію вбудованих плагінів, відновлення залежностей середовища виконання та спільне середовище виконання можливостей до того, як буде зроблено запит до провайдера.

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
| Запустити текстовий/модельний запит | `openclaw infer model run --prompt "..." --json`                       | За замовчуванням використовує звичайний локальний шлях |
| Згенерувати зображення  | `openclaw infer image generate --prompt "..." --json`                  | Використовуйте `image edit`, якщо починаєте з наявного файлу |
| Описати файл зображення | `openclaw infer image describe --file ./image.png --json`              | `--model` має бути зображувально-сумісним `<provider/model>` |
| Транскрибувати аудіо    | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` має бути `<provider/model>`                 |
| Синтезувати мовлення    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` орієнтовано на gateway                   |
| Згенерувати відео       | `openclaw infer video generate --prompt "..." --json`                  | Підтримує підказки провайдера, такі як `--resolution` |
| Описати відеофайл       | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` має бути `<provider/model>`                 |
| Шукати у вебі           | `openclaw infer web search --query "..." --json`                       |                                                       |
| Отримати вебсторінку    | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Створити ембединги      | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Поведінка

- `openclaw infer ...` є основною поверхнею CLI для цих робочих процесів.
- Використовуйте `--json`, коли вивід буде споживатися іншою командою або скриптом.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Для `image describe`, `audio transcribe` і `video describe` параметр `--model` має використовувати форму `<provider/model>`.
- Для `image describe` явний `--model` запускає цей provider/model безпосередньо. Модель має підтримувати зображення в каталозі моделей або конфігурації провайдера. `codex/<model>` запускає обмежений хід розуміння зображень через сервер застосунку Codex; `openai-codex/<model>` використовує шлях провайдера OpenAI Codex OAuth.
- Команди безстанового виконання за замовчуванням локальні.
- Команди керованого Gateway стану за замовчуванням використовують gateway.
- Звичайний локальний шлях не вимагає, щоб Gateway був запущений.
- Локальний `model run` — це легковагове одноразове завершення через провайдера. Він визначає налаштовану модель агента й автентифікацію, але не запускає хід chat-агента, не завантажує інструменти і не відкриває вбудовані MCP-сервери.
- `model run --gateway` усе ще використовує середовище виконання агента Gateway, тому може перевіряти той самий маршрутований шлях виконання, що й звичайний хід із підтримкою Gateway. MCP-сервери, відкриті через це середовище виконання, виводяться з експлуатації після відповіді, тож повторні виклики зі скриптів не залишають stdio MCP дочірні процеси активними.

## Model

Використовуйте `model` для текстового інференсу на основі провайдера та перевірки моделей/провайдерів.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Використовуйте повні посилання `<provider/model>`, щоб перевірити конкретного провайдера без запуску Gateway або завантаження всієї поверхні інструментів агента:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
```

Примітки:

- Локальний `model run` — це найвужча CLI-перевірка працездатності провайдера/моделі/автентифікації, оскільки він надсилає вибраній моделі лише наданий запит.
- Використовуйте `model run --gateway`, коли потрібно перевірити маршрутизацію Gateway, налаштування середовища виконання агента або стан провайдера, керований Gateway, замість спрощеного локального шляху завершення.
- `model auth login`, `model auth logout` і `model auth status` керують збереженим станом автентифікації провайдера.

## Image

Використовуйте `image` для генерації, редагування й опису.

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
- Використовуйте `--size`, `--aspect-ratio` або `--resolution` з `image edit` для провайдерів/моделей, які підтримують підказки геометрії під час редагування еталонних зображень.
- Використовуйте `--output-format png --background transparent` з `--model openai/gpt-image-1.5` для PNG-виводу OpenAI із прозорим тлом; `--openai-background` лишається доступним як OpenAI-специфічний псевдонім. Провайдери, які не оголошують підтримку тла, повідомляють про цю підказку як про проігнороване перевизначення.
- Використовуйте `image providers --json`, щоб перевірити, які вбудовані провайдери зображень можна виявити, налаштовано, вибрано, а також які можливості генерації/редагування надає кожен провайдер.
- Використовуйте `image generate --model <provider/model> --json` як найвужчу живу CLI-перевірку для змін генерації зображень. Приклад:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON-відповідь повідомляє `ok`, `provider`, `model`, `attempts` і шляхи записаних вихідних файлів. Якщо встановлено `--output`, фінальне розширення може відповідати MIME-типу, поверненому провайдером.

- Для `image describe` параметр `--model` має бути зображувально-сумісним `<provider/model>`.
- Для локальних візуальних моделей Ollama спочатку завантажте модель і встановіть `OLLAMA_API_KEY` на будь-яке значення-заповнювач, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

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

- `tts status` за замовчуванням використовує gateway, оскільки відображає стан TTS, керований gateway.
- Використовуйте `tts providers`, `tts voices` і `tts set-provider`, щоб перевіряти та налаштовувати поведінку TTS.

## Video

Використовуйте `video` для генерації й опису.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Примітки:

- `video generate` приймає `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` і `--timeout-ms` та передає їх у середовище виконання генерації відео.
- Для `video describe` параметр `--model` має бути `<provider/model>`.

## Web

Використовуйте `web` для робочих процесів пошуку та отримання даних.

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

Для команд генерації медіа `outputs` містить файли, записані OpenClaw. Використовуйте `path`, `mimeType`, `size` і будь-які специфічні для медіа розміри в цьому масиві для автоматизації замість аналізу придатного для читання людиною stdout.

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
