---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідних аудіо/відео/зображень
summary: Розуміння вхідних зображень/аудіо/відео (необов’язково) з резервними варіантами через provider і CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-04-23T20:59:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7aedf3a080c4b1ab627e563c120cdee9b05c6ef9dac776843bb60b276ada8786
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Розуміння медіа - вхідні (2026-01-17)

OpenClaw може **підсумовувати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично визначає, коли доступні локальні інструменти або ключі provider, і його можна вимкнути або налаштувати. Якщо розуміння вимкнено, моделі все одно отримують вихідні файли/URL як зазвичай.

Поведінка медіа для конкретних vendor реєструється plugins vendor, тоді як core OpenClaw
керує спільною конфігурацією `tools.media`, порядком резервних варіантів і інтеграцією з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо перетворювати вхідні медіа на короткий текст для швидшої маршрутизації та кращого розбору команд.
- Завжди зберігати доставку вихідних медіа до моделі.
- Підтримувати **API provider** і **резервні варіанти CLI**.
- Дозволяти кілька моделей з упорядкованим резервним переходом (помилка/розмір/timeout).

## Поведінка на високому рівні

1. Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Для кожної ввімкненої можливості (зображення/аудіо/відео) вибрати вкладення згідно з політикою (типово: **перше**).
3. Вибрати перший придатний запис моделі (розмір + можливість + auth).
4. Якщо модель не спрацьовує або медіа завелике, **перейти до наступного запису**.
5. У разі успіху:
   - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
   - Для аудіо встановлюється `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є,
     інакше — транскрипт.
   - Підписи зберігаються як `User text:` усередині блока.

Якщо розуміння не вдається або його вимкнено, **потік відповіді продовжується** з вихідним body + вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі** плюс перевизначення для кожної можливості:

- `tools.media.models`: спільний список моделей (використовуйте `capabilities` для обмеження).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - перевизначення provider (`baseUrl`, `headers`, `providerOptions`)
  - параметри аудіо Deepgram через `tools.media.audio.providerOptions.deepgram`
  - параметри відображення транскрипту аудіо (`echoTranscript`, типово `false`; `echoFormat`)
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
  model: "gpt-5.5",
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
- `{{OutputDir}}` (scratch-каталог, створений для цього запуску)
- `{{OutputBase}}` (базовий шлях scratch-файла без розширення)

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для зображень/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановите ліміт)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

Правила:

- Якщо медіа перевищує `maxBytes`, цю модель пропускають і **пробують наступну модель**.
- Аудіофайли менші за **1024 байти** вважаються порожніми/пошкодженими й пропускаються до транскрипції через provider/CLI.
- Якщо модель повертає більше за `maxChars`, результат обрізається.
- `prompt` типово має простий вигляд “Describe the {media}.” плюс підказка `maxChars` (лише для зображень/відео).
- Якщо активна основна модель для зображень уже нативно підтримує vision, OpenClaw
  пропускає блок підсумку `[Image]` і натомість передає моделі вихідне зображення.
- Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони запускають цей provider/model із підтримкою зображень напряму, включно з посиланнями Ollama на кшталт `ollama/qwen2.5vl:7b`.
- Якщо `<capability>.enabled: true`, але моделі не налаштовані, OpenClaw пробує
  **активну модель відповіді**, якщо її provider підтримує цю можливість.

### Автовизначення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не
налаштували моделі, OpenClaw виконує автовизначення в такому порядку і **зупиняється на першому
працездатному варіанті**:

1. **Активна модель відповіді**, якщо її provider підтримує цю можливість.
2. **Основні/резервні посилання `agents.defaults.imageModel`** (лише зображення).
3. **Локальні CLI** (лише аудіо; якщо встановлено)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
   - `whisper` (Python CLI; автоматично завантажує моделі)
4. **Gemini CLI** (`gemini`) з використанням `read_many_files`
5. **Auth provider**
   - Налаштовані записи `models.providers.*`, що підтримують цю можливість,
     пробуються до вбудованого порядку резервних варіантів.
   - Provider із конфігурації лише для зображень із моделлю, що підтримує зображення, автоматично реєструються для розуміння медіа, навіть якщо вони не є вбудованим vendor plugin.
   - Розуміння зображень Ollama доступне за явного вибору, наприклад через `agents.defaults.imageModel` або
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Вбудований порядок резервних варіантів:
     - Аудіо: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Зображення: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Відео: Google → Qwen → Moonshot

Щоб вимкнути автовизначення, задайте:

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

Примітка: виявлення бінарників працює в режимі best-effort на macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI-модель із повним шляхом до команди.

### Підтримка proxy environment (моделі provider)

Коли ввімкнено розуміння медіа **аудіо** і **відео** на основі provider, OpenClaw
враховує стандартні змінні середовища вихідного proxy для HTTP-викликів provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Якщо змінні proxy env не задано, розуміння медіа використовує прямий вихідний трафік.
Якщо значення proxy некоректне, OpenClaw записує попередження в журнал і повертається до прямого
отримання.

## Можливості (необов’язково)

Якщо ви задаєте `capabilities`, запис запускається лише для цих типів медіа. Для спільних
списків OpenClaw може виводити типові значення:

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
- Будь-який каталог `models.providers.<id>.models[]` із моделлю, що підтримує зображення:
  **image**

Для записів CLI **явно задавайте `capabilities`**, щоб уникнути неочікуваних збігів.
Якщо `capabilities` не задано, запис придатний для списку, у якому він розміщений.

## Матриця підтримки provider (інтеграції OpenClaw)

| Можливість | Інтеграція provider                                                                   | Примітки                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Зображення | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Vendor plugins реєструють підтримку зображень; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; config providers із підтримкою зображень реєструються автоматично. |
| Аудіо      | OpenAI, Groq, Deepgram, Google, Mistral                                                | Транскрипція через provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                |
| Відео      | Google, Qwen, Moonshot                                                                 | Розуміння відео через provider за допомогою vendor plugins; розуміння відео Qwen використовує стандартні ендпоінти DashScope.                         |

Примітка щодо MiniMax:

- Розуміння зображень `minimax` і `minimax-portal` походить із
  `MiniMax-VL-01` media provider, яким володіє plugin.
- Вбудований текстовий каталог MiniMax як і раніше починається лише з тексту; явні
  записи `models.providers.minimax` матеріалізують chat-посилання M2.7 із підтримкою зображень.

## Рекомендації щодо вибору моделі

- Для кожної можливості медіа надавайте перевагу найсильнішій моделі останнього покоління, коли важливі якість і безпека.
- Для агентів з увімкненими інструментами, які обробляють недовірені вхідні дані, уникайте старіших/слабших медіамоделей.
- Залишайте принаймні один резервний варіант для кожної можливості з міркувань доступності (якісна модель + швидша/дешевша модель).
- Резервні варіанти CLI (`whisper-cli`, `whisper`, `gemini`) корисні, коли API provider недоступні.
- Примітка щодо `parakeet-mlx`: з `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу `txt` (або не задано); формати не `txt` повертаються до stdout.

## Політика вкладень

`attachments` для кожної можливості керує тим, які вкладення обробляються:

- `mode`: `first` (типово) або `all`
- `maxAttachments`: обмеження кількості оброблюваних вкладень (типово **1**)
- `prefer`: `first`, `last`, `path`, `url`

Коли `mode: "all"`, результати позначаються як `[Image 1/2]`, `[Audio 2/2]` тощо.

Поведінка витягування файлів-вкладень:

- Витягнутий текст файла обгортається як **недовірений зовнішній вміст** перед
  додаванням до prompt медіа.
- Ін’єктований блок використовує явні маркери меж, наприклад
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` і включає рядок метаданих
  `Source: External`.
- Цей шлях витягування вкладень навмисно пропускає довгий
  банер `SECURITY NOTICE:`, щоб не роздувати prompt медіа; маркери меж
  і метадані при цьому все одно зберігаються.
- Якщо файл не має тексту, який можна витягнути, OpenClaw ін’єктує `[No extractable text]`.
- Якщо PDF у цьому шляху повертається до візуалізації сторінок у вигляді зображень, prompt медіа зберігає
  заповнювач `[PDF content rendered to images; images not forwarded to model]`,
  оскільки цей крок витягування вкладень передає текстові блоки, а не візуалізовані зображення PDF.

## Приклади конфігурації

### 1) Спільний список моделей + перевизначення

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
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
          { provider: "openai", model: "gpt-5.5" },
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

### 4) Один мультимодальний запис (явні capabilities)

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

## Вивід стану

Коли виконується розуміння медіа, `/status` містить короткий рядок зведення:

```
📎 Media: image ok (openai/gpt-5.5) · audio skipped (maxBytes)
```

Це показує результати для кожної можливості та вибраний provider/model, коли застосовно.

## Примітки

- Розуміння працює в режимі **best-effort**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнено.
- Використовуйте `scope`, щоб обмежити, де запускається розуміння (наприклад, лише DM).

## Пов’язана документація

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
