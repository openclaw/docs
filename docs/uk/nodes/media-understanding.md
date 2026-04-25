---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідного аудіо/відео/зображень
summary: Розуміння вхідних зображень/аудіо/відео (необов’язково) з резервними варіантами через провайдера + CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-04-25T00:01:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 108a90f15f7c86539d01a880e601d2c43305029a2e29330778c60fddf79a4d32
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Розуміння медіа — вхідні дані (2026-01-17)

OpenClaw може **узагальнювати вхідні медіафайли** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично визначає, коли доступні локальні інструменти або ключі провайдера, і цю функцію можна вимкнути або налаштувати. Якщо розуміння вимкнено, моделі, як і раніше, отримують оригінальні файли/URL.

Поведінка медіа, специфічна для постачальника, реєструється через plugin постачальника, тоді як ядро OpenClaw керує спільною конфігурацією `tools.media`, порядком резервного перемикання та інтеграцією з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо зводити вхідні медіафайли до короткого тексту для швидшої маршрутизації + кращого розбору команд.
- Завжди зберігати доставку оригінального медіа до моделі.
- Підтримувати **API провайдерів** і **резервні варіанти CLI**.
- Дозволяти кілька моделей з упорядкованим резервним перемиканням (помилка/розмір/тайм-аут).

## Поведінка на високому рівні

1. Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Для кожної ввімкненої можливості (зображення/аудіо/відео) вибрати вкладення відповідно до політики (типово: **перше**).
3. Вибрати перший допустимий запис моделі (розмір + можливість + автентифікація).
4. Якщо модель не спрацьовує або медіафайл надто великий, **переключитися на наступний запис**.
5. У разі успіху:
   - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
   - Для аудіо встановлюється `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є, інакше — транскрипт.
   - Підписи зберігаються як `User text:` усередині блоку.

Якщо розуміння не спрацювало або вимкнене, **потік відповіді продовжується** з оригінальним тілом + вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі** плюс перевизначення для кожної можливості окремо:

- `tools.media.models`: спільний список моделей (використовуйте `capabilities` для обмеження).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - перевизначення провайдера (`baseUrl`, `headers`, `providerOptions`)
  - параметри аудіо Deepgram через `tools.media.audio.providerOptions.deepgram`
  - елементи керування ехо транскрипту аудіо (`echoTranscript`, типово `false`; `echoFormat`)
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
- `{{OutputDir}}` (тимчасовий каталог, створений для цього запуску)
- `{{OutputBase}}` (базовий шлях до тимчасового файла, без розширення)

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для зображень/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановите обмеження)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

Правила:

- Якщо медіафайл перевищує `maxBytes`, ця модель пропускається і **пробується наступна модель**.
- Аудіофайли менші за **1024 байти** вважаються порожніми/пошкодженими й пропускаються до транскрибування через provider/CLI.
- Якщо модель повертає більше, ніж `maxChars`, вивід обрізається.
- Типове значення `prompt` — просте “Describe the {media}.” плюс вказівка щодо `maxChars` (лише для зображення/відео).
- Якщо активна основна модель для зображень уже нативно підтримує зір, OpenClaw пропускає блок узагальнення `[Image]` і натомість передає оригінальне зображення в модель.
- Якщо основна модель Gateway/WebChat є лише текстовою, вкладення зображень зберігаються як винесені посилання `media://inbound/*`, щоб інструменти для зображень/PDF або налаштована модель для зображень усе ще могли їх аналізувати замість втрати вкладення.
- Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони напряму запускають указаного provider/model із підтримкою зображень, включно з посиланнями Ollama, такими як `ollama/qwen2.5vl:7b`.
- Якщо `<capability>.enabled: true`, але моделі не налаштовано, OpenClaw намагається використати **активну модель відповіді**, якщо її провайдер підтримує цю можливість.

### Автовизначення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не налаштували моделі, OpenClaw автоматично визначає у такому порядку і **зупиняється на першому робочому варіанті**:

1. **Активна модель відповіді**, якщо її провайдер підтримує цю можливість.
2. Основні/резервні посилання **`agents.defaults.imageModel`** (лише для зображень).
3. **Локальні CLI** (лише для аудіо; якщо встановлено)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny model)
   - `whisper` (Python CLI; автоматично завантажує моделі)
4. **Gemini CLI** (`gemini`) з використанням `read_many_files`
5. **Автентифікація провайдера**
   - Налаштовані записи `models.providers.*`, що підтримують цю можливість, пробуються до вбудованого порядку резервного перемикання.
   - Провайдери конфігурації лише для зображень із моделлю, що підтримує зображення, автоматично реєструються для розуміння медіа, навіть якщо вони не є вбудованим vendor plugin.
   - Розуміння зображень Ollama доступне за явного вибору, наприклад через `agents.defaults.imageModel` або `openclaw infer image describe --model ollama/<vision-model>`.
   - Вбудований порядок резервного перемикання:
     - Аудіо: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Зображення: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Відео: Google → Qwen → Moonshot

Щоб вимкнути автовизначення, встановіть:

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

Примітка: виявлення бінарних файлів є best-effort на macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну модель CLI з повним шляхом до команди.

### Підтримка проксі через середовище (моделі provider)

Коли ввімкнено розуміння медіа **аудіо** та **відео** на основі провайдера, OpenClaw враховує стандартні змінні середовища вихідного проксі для HTTP-викликів провайдера:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Якщо змінні середовища проксі не задано, розуміння медіа використовує прямий вихідний трафік.
Якщо значення проксі має неправильний формат, OpenClaw записує попередження в журнал і повертається до прямого отримання.

## Можливості (необов’язково)

Якщо ви задаєте `capabilities`, запис запускається лише для цих типів медіа. Для спільних списків OpenClaw може вивести типові значення:

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
- Будь-який каталог `models.providers.<id>.models[]` з моделлю, що підтримує зображення: **image**

Для записів CLI **явно задавайте `capabilities`**, щоб уникнути неочікуваних збігів.
Якщо ви опускаєте `capabilities`, запис вважається допустимим для того списку, в якому він з’являється.

## Матриця підтримки провайдерів (інтеграції OpenClaw)

| Capability | Provider integration                                                                                                         | Notes                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Vendor plugins register image support; `openai-codex/*` uses OAuth provider plumbing; `codex/*` uses a bounded Codex app-server turn; MiniMax and MiniMax OAuth both use `MiniMax-VL-01`; image-capable config providers auto-register. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                                                      | Provider transcription (Whisper/Deepgram/Gemini/Voxtral).                                                                                                                                                                               |
| Video      | Google, Qwen, Moonshot                                                                                                       | Provider video understanding via vendor plugins; Qwen video understanding uses the Standard DashScope endpoints.                                                                                                                        |

Примітка щодо MiniMax:

- `minimax` і `minimax-portal` для розуміння зображень походять із media provider `MiniMax-VL-01`, яким керує plugin.
- Вбудований текстовий каталог MiniMax, як і раніше, спочатку є лише текстовим; явні записи `models.providers.minimax` матеріалізують chat-посилання M2.7 із підтримкою зображень.

## Рекомендації щодо вибору моделі

- Надавайте перевагу найсильнішій моделі останнього покоління, доступній для кожної медіаможливості, коли важливі якість і безпека.
- Для агентів з увімкненими інструментами, які обробляють недовірені вхідні дані, уникайте старіших/слабших медіамоделей.
- Тримайте принаймні один резервний варіант для кожної можливості на випадок недоступності (якісна модель + швидша/дешевша модель).
- Резервні варіанти CLI (`whisper-cli`, `whisper`, `gemini`) корисні, коли API провайдерів недоступні.
- Примітка щодо `parakeet-mlx`: з `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не вказаний); формати, відмінні від `txt`, повертаються до stdout.

## Політика вкладень

`attachments` для конкретної можливості керує тим, які вкладення обробляються:

- `mode`: `first` (типово) або `all`
- `maxAttachments`: обмеження кількості оброблюваних вкладень (типово **1**)
- `prefer`: `first`, `last`, `path`, `url`

Коли `mode: "all"`, результати позначаються як `[Image 1/2]`, `[Audio 2/2]` тощо.

Поведінка вилучення тексту з файлових вкладень:

- Вилучений текст файла обгортається як **недовірений зовнішній вміст**, перш ніж його буде додано до media prompt.
- Вставлений блок використовує явні маркери меж, такі як `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить рядок метаданих `Source: External`.
- Цей шлях вилучення вкладень навмисно опускає довгий банер `SECURITY NOTICE:`, щоб не роздувати media prompt; маркери меж і метадані при цьому все одно зберігаються.
- Якщо файл не містить тексту, який можна вилучити, OpenClaw вставляє `[No extractable text]`.
- Якщо PDF у цьому шляху повертається до рендерингу сторінок як зображень, media prompt зберігає заповнювач `[PDF content rendered to images; images not forwarded to model]`, оскільки цей крок вилучення вкладень передає текстові блоки, а не відрендерені PDF-зображення.

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

### 4) Один multimodal-запис (явні можливості)

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

Коли запускається розуміння медіа, `/status` містить короткий підсумковий рядок:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Це показує результати для кожної можливості та вибраного provider/model, якщо застосовно.

## Примітки

- Розуміння є **best-effort**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнено.
- Використовуйте `scope`, щоб обмежити, де запускається розуміння (наприклад, лише в DM).

## Пов’язані документи

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
