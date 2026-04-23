---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідних аудіо/відео/зображень
summary: Вхідне розуміння зображень/аудіо/відео (необов’язково) з резервними варіантами provider + CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-04-23T00:07:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bb2d0eab59d857c2849f329435f8fad3eeff427f7984d011bd5b7d9fd7bf51c
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Розуміння медіа — вхідне (2026-01-17)

OpenClaw може **узагальнювати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично визначає, коли доступні локальні інструменти або ключі provider, і може бути вимкнений або налаштований. Якщо розуміння вимкнено, моделі, як і раніше, отримують оригінальні файли/URL.

Поведінка медіа, специфічна для постачальника, реєструється plugin постачальника, тоді як
ядро OpenClaw відповідає за спільну конфігурацію `tools.media`, порядок резервного вибору та інтеграцію з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо перетворювати вхідні медіа на короткий текст для швидшої маршрутизації та кращого розбору команд.
- Завжди зберігати доставку оригінальних медіа до моделі.
- Підтримувати **API provider** і **резервні варіанти CLI**.
- Дозволяти кілька моделей з упорядкованим резервним вибором (помилка/розмір/тайм-аут).

## Поведінка на високому рівні

1. Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Для кожної ввімкненої можливості (зображення/аудіо/відео) вибрати вкладення згідно з політикою (типово: **перше**).
3. Вибрати перший придатний запис моделі (розмір + можливість + автентифікація).
4. Якщо модель не спрацьовує або медіа завелике, **перейти до наступного запису**.
5. У разі успіху:
   - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
   - Для аудіо встановлюється `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є, інакше — транскрипт.
   - Підписи зберігаються як `User text:` усередині блоку.

Якщо розуміння не вдається або воно вимкнене, **потік відповіді продовжується** з початковим body + вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі** плюс перевизначення для кожної можливості:

- `tools.media.models`: спільний список моделей (використовуйте `capabilities` для обмеження).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - перевизначення provider (`baseUrl`, `headers`, `providerOptions`)
  - параметри аудіо Deepgram через `tools.media.audio.providerOptions.deepgram`
  - керування відлунням аудіотранскрипту (`echoTranscript`, типово `false`; `echoFormat`)
  - необов’язковий список `models` **для конкретної можливості** (має пріоритет над спільними моделями)
  - політика `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (необов’язкове обмеження за channel/chatType/session key)
- `tools.media.concurrency`: максимальна кількість одночасних запусків можливостей (типово **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Записи моделей

Кожен запис `models[]` може бути **provider** або **CLI**:

```json5
{
  type: "provider", // default if omitted
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi‑modal entries
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

Шаблони CLI також можуть використовувати:

- `{{MediaDir}}` (каталог, що містить медіафайл)
- `{{OutputDir}}` (тимчасовий каталог, створений для цього запуску)
- `{{OutputBase}}` (базовий шлях до тимчасового файла без розширення)

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для зображень/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановите обмеження)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

Правила:

- Якщо медіа перевищує `maxBytes`, ця модель пропускається і **пробується наступна модель**.
- Аудіофайли, менші за **1024 bytes**, вважаються порожніми/пошкодженими й пропускаються до транскрибування через provider/CLI.
- Якщо модель повертає більше, ніж `maxChars`, вивід обрізається.
- Типове значення `prompt` — просте “Describe the {media}.” плюс вказівка щодо `maxChars` (лише для зображень/відео).
- Якщо активна основна модель для зображень уже нативно підтримує vision, OpenClaw
  пропускає блок підсумку `[Image]` і натомість передає оригінальне зображення в
  модель.
- Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони запускають безпосередньо цей provider/model із підтримкою зображень, включно з посиланнями Ollama, такими як `ollama/qwen2.5vl:7b`.
- Якщо `<capability>.enabled: true`, але моделі не налаштовані, OpenClaw пробує
  **активну модель відповіді**, якщо її provider підтримує цю можливість.

### Автовизначення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не налаштували моделі, OpenClaw автовизначає у такому порядку й **зупиняється на першому працездатному варіанті**:

1. **Активна модель відповіді**, якщо її provider підтримує цю можливість.
2. Основне/резервне посилання `agents.defaults.imageModel` (лише для зображень).
3. **Локальні CLI** (лише аудіо; якщо встановлено)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny model)
   - `whisper` (Python CLI; автоматично завантажує моделі)
4. **Gemini CLI** (`gemini`) з використанням `read_many_files`
5. **Автентифікація provider**
   - Налаштовані записи `models.providers.*`, що підтримують цю можливість,
     пробуються до вбудованого порядку резервного вибору.
   - Provider конфігурації лише для зображень із моделлю, що підтримує зображення, автоматично реєструються для
     розуміння медіа, навіть якщо вони не є вбудованим plugin постачальника.
   - Розуміння зображень Ollama доступне за явного вибору, наприклад через `agents.defaults.imageModel` або
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Вбудований порядок резервного вибору:
     - Аудіо: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Зображення: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Відео: Google → Qwen → Moonshot

Щоб вимкнути автовизначення, установіть:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Примітка: виявлення бінарних файлів виконується за принципом best-effort на macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну модель CLI з повним шляхом до команди.

### Підтримка проксі-середовища (моделі provider)

Коли ввімкнено розуміння медіа **аудіо** та **відео** на основі provider, OpenClaw
враховує стандартні змінні середовища вихідного проксі для HTTP-викликів provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Якщо змінні середовища проксі не задані, розуміння медіа використовує прямий вихідний трафік.
Якщо значення проксі має неправильний формат, OpenClaw журналює попередження і повертається до прямого
отримання.

## Можливості (необов’язково)

Якщо ви задаєте `capabilities`, запис запускається лише для цих типів медіа. Для спільних
списків OpenClaw може визначати типові значення:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Будь-який каталог `models.providers.<id>.models[]` з моделлю, що підтримує зображення:
  **image**

Для записів CLI **задавайте `capabilities` явно**, щоб уникнути неочікуваних збігів.
Якщо ви не задасте `capabilities`, запис придатний для списку, у якому він з’являється.

## Матриця підтримки provider (інтеграції OpenClaw)

| Можливість | Інтеграція provider                                                                   | Примітки                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Зображення | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Plugin постачальника реєструють підтримку зображень; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; config providers із підтримкою зображень реєструються автоматично. |
| Аудіо      | OpenAI, Groq, Deepgram, Google, Mistral                                                | Транскрибування provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                |
| Відео      | Google, Qwen, Moonshot                                                                 | Розуміння відео через provider за допомогою plugin постачальника; розуміння відео Qwen використовує стандартні кінцеві точки DashScope.                         |

Примітка щодо MiniMax:

- Розуміння зображень `minimax` і `minimax-portal` походить від plugin-власного
  медіа provider `MiniMax-VL-01`.
- Вбудований текстовий каталог MiniMax усе ще починається лише з тексту; явні
  записи `models.providers.minimax` матеріалізують чат-посилання M2.7 із підтримкою зображень.

## Настанови щодо вибору моделі

- Віддавайте перевагу найсильнішій моделі останнього покоління, доступній для кожної медіаможливості, коли важливі якість і безпека.
- Для агентів з увімкненими інструментами, які працюють із недовіреними вхідними даними, уникайте старіших/слабших медіамоделей.
- Тримайте щонайменше один резервний варіант для кожної можливості заради доступності (якісна модель + швидша/дешевша модель).
- Резервні варіанти CLI (`whisper-cli`, `whisper`, `gemini`) корисні, коли API provider недоступні.
- Примітка щодо `parakeet-mlx`: з `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не заданий); формати, відмінні від `txt`, повертаються до stdout.

## Політика вкладень

`attachments` для кожної можливості керує тим, які вкладення обробляються:

- `mode`: `first` (типово) або `all`
- `maxAttachments`: обмеження кількості оброблюваних вкладень (типово **1**)
- `prefer`: `first`, `last`, `path`, `url`

Коли `mode: "all"`, результати позначаються як `[Image 1/2]`, `[Audio 2/2]` тощо.

Поведінка вилучення тексту з файлових вкладень:

- Вилучений текст файла обгортається як **недовірений зовнішній вміст** перед тим, як
  додається до prompt медіа.
- Вставлений блок використовує явні маркери меж на кшталт
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` і містить рядок метаданих
  `Source: External`.
- Цей шлях вилучення вкладень навмисно не містить довгий банер
  `SECURITY NOTICE:`, щоб не роздувати prompt медіа; маркери меж і
  метадані при цьому зберігаються.
- Якщо файл не має тексту, який можна вилучити, OpenClaw вставляє `[No extractable text]`.
- Якщо PDF у цьому шляху повертається до рендерингу сторінок як зображень, prompt медіа зберігає
  заповнювач `[PDF content rendered to images; images not forwarded to model]`,
  оскільки цей крок вилучення вкладень передає текстові блоки, а не відрендерені зображення PDF.

## Приклади конфігурації

### 1) Спільний список моделей + перевизначення

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Лише аудіо + відео (зображення вимкнено)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Необов’язкове розуміння зображень

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Одномодальний запис для кількох типів медіа (явні capabilities)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Вивід статусу

Коли працює розуміння медіа, `/status` містить короткий рядок підсумку:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Тут показано результати для кожної можливості та вибраний provider/model, де це доречно.

## Примітки

- Розуміння виконується у режимі **best-effort**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнене.
- Використовуйте `scope`, щоб обмежити, де працює розуміння (наприклад, лише в особистих повідомленнях).

## Пов’язана документація

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
