---
read_when:
    - Додавання або змінення команд `openclaw infer`
    - Проєктування стабільної безінтерфейсної автоматизації можливостей
summary: CLI із пріоритетом автоматичного визначення для робочих процесів із моделями, зображеннями, аудіо, TTS, відео, вебресурсами та вбудовуваннями на основі провайдерів
title: CLI виведення
x-i18n:
    generated_at: "2026-07-12T13:04:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` — це канонічний безголовий інтерфейс для інференсу через провайдерів. Він надає сімейства можливостей (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), а не необроблені назви RPC Gateway чи ідентифікатори інструментів агента. `openclaw capability ...` — це псевдонім для того самого дерева команд.

Чому варто віддати йому перевагу над одноразовою обгорткою провайдера:

- Повторно використовує провайдерів і моделі, уже налаштовані в OpenClaw.
- Стабільна оболонка `--json` для скриптів і керованої агентами автоматизації (див. [Виведення JSON](#json-output)).
- Для більшості підкоманд виконує звичайний локальний шлях без Gateway.
- Для наскрізних перевірок провайдера він задіює випущений CLI, завантаження конфігурації, визначення типового агента, активацію вбудованих плагінів і спільне середовище виконання можливостей перед надсиланням запиту провайдеру.

## Перетворення infer на Skills

Скопіюйте та вставте це агенту:

```text
Прочитай https://docs.openclaw.ai/cli/infer, а потім створи Skills, що спрямовуватиме мої типові робочі процеси до `openclaw infer`.
Зосередься на запусках моделей, генеруванні зображень, генеруванні відео, транскрибуванні аудіо, TTS, вебпошуку та вбудовуваннях.
```

Якісні Skills на основі infer зіставляють типові наміри користувача з відповідною підкомандою, містять кілька канонічних прикладів для кожного робочого процесу, віддають перевагу `openclaw infer ...` над низькорівневими альтернативами та не документують повторно весь інтерфейс infer у тілі Skills.

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
    personas
    status
    enable
    disable
    set-provider
    set-persona

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

`infer list` / `infer inspect --name <capability>` показують це дерево як дані (ідентифікатор можливості, транспорти, опис).

## Типові завдання

| Завдання                              | Команда                                                                                       | Примітки                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Виконати текстовий запит до моделі    | `openclaw infer model run --prompt "..." --json`                                              | Типово виконується локально                                  |
| Виконати запит до моделі із зображеннями | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Повторіть `--file` для кількох зображень                      |
| Згенерувати зображення                | `openclaw infer image generate --prompt "..." --json`                                         | Використовуйте `image edit`, починаючи з наявного файлу      |
| Описати файл зображення або URL       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` має бути моделлю `<provider/model>` із підтримкою зображень |
| Транскрибувати аудіо                  | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` має бути у форматі `<provider/model>`               |
| Синтезувати мовлення                  | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` виконується лише через Gateway                  |
| Згенерувати відео                     | `openclaw infer video generate --prompt "..." --json`                                         | Підтримує підказки провайдера, як-от `--resolution`           |
| Описати відеофайл                     | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` має бути у форматі `<provider/model>`               |
| Виконати пошук у вебі                 | `openclaw infer web search --query "..." --json`                                              |                                                              |
| Отримати вебсторінку                  | `openclaw infer web fetch --url https://example.com --json`                                   |                                                              |
| Створити вбудовування                 | `openclaw infer embedding create --text "..." --json`                                         |                                                              |

## Поведінка

- Використовуйте `--json`, коли виведення передається іншій команді чи скрипту; в інших випадках використовуйте текстове виведення.
- Використовуйте `--provider` або `--model provider/model`, щоб зафіксувати конкретний бекенд.
- Використовуйте `model run --thinking <level>` для одноразового перевизначення рівня обмірковування/міркування: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` або `max`.
- Для `image describe`, `audio transcribe` і `video describe` параметр `--model` має використовувати формат `<provider/model>`.
- Для `image describe` параметр `--file` приймає локальні шляхи й URL-адреси HTTP(S); віддалені URL-адреси проходять через звичайну політику SSRF для отримання медіафайлів.
- Команди виконання без стану (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) типово виконуються локально. Команди стану, керованого Gateway (`tts status`), типово виконуються через Gateway.
- Локальний шлях ніколи не вимагає запущеного Gateway.
- Локальний `model run` — це полегшене одноразове звернення до провайдера: він визначає налаштовану модель агента й дані автентифікації, але не запускає хід чат-агента, не завантажує інструменти й не відкриває вбудовані сервери MCP.
- `model run --file` додає до запиту файли зображень (тип MIME визначається автоматично); повторіть `--file` для кількох зображень. Файли, що не є зображеннями, відхиляються — натомість використовуйте `infer audio transcribe` або `infer video describe`.
- `model run --gateway` перевіряє маршрутизацію Gateway, збережені дані автентифікації, вибір провайдера та вбудоване середовище виконання, але залишається необробленою перевіркою моделі: без попереднього журналу сеансу, контексту початкового завантаження/AGENTS, інструментів чи вбудованих серверів MCP.
- `model run --gateway --model <provider/model>` вимагає облікових даних Gateway довіреного оператора, оскільки просить Gateway виконати одноразове перевизначення провайдера/моделі.

## Модель

Текстовий інференс і перевірка моделі/провайдера.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Використовуйте повні посилання `<provider/model>` із `--local`, щоб виконати базову перевірку одного провайдера без запуску Gateway чи завантаження інтерфейсу інструментів агента:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Примітки:

- Локальний `model run` — це найвужча базова перевірка CLI для працездатності провайдера/моделі/автентифікації: для провайдерів, відмінних від ChatGPT-Codex, він надсилає лише вказаний запит.
- Локальний `model run --model <provider/model>` може визначати точні рядки вбудованого статичного каталогу (ті самі рядки, які показує `openclaw models list --all`) до запису цього провайдера в конфігурацію. Автентифікація провайдера все одно потрібна; відсутні облікові дані спричиняють помилки автентифікації, а не `Unknown model`.
- Для перевірок міркування Mistral Medium 3.5 залиште температуру невстановленою/типовою. Mistral відхиляє `reasoning_effort="high"` із `temperature: 0`; використовуйте типову температуру або ненульове значення, як-от `0.7`.
- Локальні перевірки OAuth OpenAI ChatGPT/Codex (API `openai-chatgpt-responses`) додають мінімальну системну інструкцію, щоб транспорт міг заповнити обов’язкове поле `instructions` — без повного контексту агента, інструментів, пам’яті чи журналу сеансу.
- `model run --file` додає вміст зображення безпосередньо до єдиного повідомлення користувача. Поширені формати (PNG, JPEG, WebP) працюють, коли тип MIME визначено як `image/*`; непідтримувані або нерозпізнані файли спричиняють помилку до виклику провайдера. Натомість використовуйте `infer image describe`, якщо потрібні маршрутизація й резервні варіанти моделей зображень OpenClaw, а не безпосередня перевірка мультимодальної моделі.
- Вибрана модель має підтримувати введення зображень; моделі лише для тексту можуть відхилити запит на рівні провайдера.
- `model run --prompt` має містити текст, відмінний від пробільних символів; порожні запити відхиляються до будь-якого виклику провайдера чи Gateway.
- Локальний `model run` завершується з ненульовим кодом, коли провайдер не повертає текстового виведення, тож недоступні провайдери й порожні завершення не виглядають як успішні перевірки.
- Використовуйте `model run --gateway`, щоб перевірити маршрутизацію Gateway або налаштування середовища виконання агента, зберігаючи введення моделі необробленим. Використовуйте `openclaw agent` або інтерфейс чату для повного контексту агента, інструментів, пам’яті й журналу сеансу.
- `--thinking adaptive` зіставляється з рівнем середовища виконання завершень `medium`; `--thinking max` зіставляється з `max` для моделей OpenAI, які підтримують власний максимальний рівень зусиль, а в інших випадках — із `xhigh`.
- `model auth login`, `model auth logout` і `model auth status` керують збереженим станом автентифікації провайдера.

## Зображення

Генерування, редагування й опис.

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

- Використовуйте `image edit`, коли починаєте з наявних вхідних файлів; `--size`, `--aspect-ratio` або `--resolution` додають підказки щодо геометрії для провайдерів і моделей, які їх підтримують.
- `--output-format png --background transparent` разом із `--model openai/gpt-image-1.5` створює PNG-зображення OpenAI із прозорим тлом; `--openai-background` — специфічний для OpenAI псевдонім тієї самої підказки. Провайдери, які не заявляють про підтримку тла, повідомляють про неї як про проігнороване перевизначення (див. `ignoredOverrides` в [оболонці JSON](#json-output)).
- `--quality low|medium|high|auto` працює для провайдерів, які підтримують підказки щодо якості зображення, зокрема OpenAI. OpenAI також приймає `--openai-moderation low|auto`.
- `image providers --json` перелічує, які вбудовані провайдери зображень доступні для виявлення, налаштовані й вибрані, а також які можливості генерування та редагування надає кожен із них.
- `image generate --model <provider/model> --json` — найвужча оперативна димова перевірка змін у генеруванні зображень:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Відповідь містить `ok`, `provider`, `model`, `attempts` і шляхи до записаних вихідних файлів. Коли задано `--output`, остаточне розширення може відповідати типу MIME, поверненому провайдером.

- Для `image describe` та `image describe-many` використовуйте `--prompt` для інструкції, специфічної для завдання (OCR, порівняння, перевірка інтерфейсу, стислий опис).
- Використовуйте `--timeout-ms` для повільних локальних моделей комп’ютерного зору або холодного запуску Ollama.
- Для `image describe` явно задана модель через `--model` (має бути моделлю `<provider/model>` із підтримкою зображень) запускається першою, а якщо цей виклик завершується невдало, виконуються спроби з налаштованими `agents.defaults.imageModel.fallbacks`. Помилки підготовки вхідних даних (відсутній файл, непідтримувана URL-адреса) спричиняють збій до будь-якої резервної спроби, а модель має підтримувати зображення в каталозі моделей або конфігурації провайдера.
- Для локальних моделей комп’ютерного зору Ollama спочатку завантажте модель і встановіть для `OLLAMA_API_KEY` будь-яке значення-заповнювач, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

## Аудіо

Транскрибування файлів (не керування сеансами в реальному часі).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` має бути у форматі `<provider/model>`.

## TTS

Синтез мовлення та стан провайдера й персони TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Примітки:

- `tts status` підтримує лише `--gateway` (команда відображає стан TTS, керований Gateway).
- Використовуйте `tts providers`, `tts voices`, `tts personas`, `tts set-provider` і `tts set-persona`, щоб переглядати та налаштовувати поведінку TTS.

## Відео

Генерування й опис.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Примітки:

- `video generate` приймає `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` і `--timeout-ms`, які передаються середовищу виконання генерування відео.
- Для `video describe` значення `--model` має бути у форматі `<provider/model>`.

## Веб

Пошук і отримання даних.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` перелічує доступних, налаштованих і вибраних провайдерів для пошуку й отримання даних.

## Вбудовування

Створення векторів і перегляд провайдерів вбудовувань.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Виведення JSON

Команди Infer нормалізують виведення JSON у спільній оболонці:

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

Стабільні поля верхнього рівня:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (вкладення зображень, надіслані із запитом, якщо застосовно)
- `outputs`
- `ignoredOverrides` (ключі підказок, які провайдер не підтримує, якщо застосовно)
- `error`

Для команд генерування медіафайлів `outputs` містить файли, записані OpenClaw. Для автоматизації використовуйте `path`, `mimeType`, `size` і всі специфічні для медіа розміри в цьому масиві замість аналізу зручного для читання виведення stdout.

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

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Моделі](/uk/concepts/models)
