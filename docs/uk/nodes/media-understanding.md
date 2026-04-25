---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідного аудіо/відео/зображень
summary: Розуміння вхідних зображень/аудіо/відео (необов’язково) з резервними варіантами provider + CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-04-25T11:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 573883a2e0bf27fc04da1a5464e53ba41d006ecad5a04704c24467e77c8eda3d
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Розуміння медіа - Вхідні дані (2026-01-17)

OpenClaw може **узагальнювати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично визначає доступність, коли доступні локальні інструменти або ключі provider, і може бути вимкнений або налаштований. Якщо розуміння вимкнено, моделі, як і раніше, отримують оригінальні файли/URL.

Поведінка медіа для конкретних постачальників реєструється Plugin постачальників, тоді як
ядро OpenClaw відповідає за спільну конфігурацію `tools.media`, порядок резервних варіантів і
інтеграцію з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо обробляти вхідні медіа в короткий текст для швидшої маршрутизації та кращого розбору команд.
- Завжди зберігати доставлення оригінальних медіа до моделі.
- Підтримувати **API provider** і **резервні варіанти CLI**.
- Дозволяти кілька моделей з упорядкованим резервуванням (помилка/розмір/тайм-аут).

## Поведінка на високому рівні

1. Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Для кожної ввімкненої можливості (зображення/аудіо/відео) вибрати вкладення згідно з політикою (типово: **перше**).
3. Вибрати перший відповідний запис моделі (розмір + можливість + автентифікація).
4. Якщо модель завершується з помилкою або медіа надто велике, **перейти до наступного запису**.
5. У разі успіху:
   - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
   - Для аудіо встановлюється `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є,
     інакше — транскрипт.
   - Підписи зберігаються як `User text:` усередині блоку.

Якщо розуміння не вдається або воно вимкнене, **потік відповіді продовжується** з оригінальним тілом і вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі** плюс перевизначення для окремих можливостей:

- `tools.media.models`: спільний список моделей (використовуйте `capabilities` для обмеження).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - перевизначення provider (`baseUrl`, `headers`, `providerOptions`)
  - параметри аудіо Deepgram через `tools.media.audio.providerOptions.deepgram`
  - елементи керування echo транскрипту аудіо (`echoTranscript`, типово `false`; `echoFormat`)
  - необов’язковий список `models` **для окремої можливості** (має пріоритет над спільними моделями)
  - політика `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (необов’язкове обмеження за каналом/chatType/ключем сесії)
- `tools.media.concurrency`: максимальна кількість одночасних запусків можливостей (типово **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* спільний список */
      ],
      image: {
        /* необов’язкові перевизначення */
      },
      audio: {
        /* необов’язкові перевизначення */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* необов’язкові перевизначення */
      },
    },
  },
}
```

### Записи моделей

Кожен запис `models[]` може бути **provider** або **CLI**:

```json5
{
  type: "provider", // типово, якщо не вказано
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // необов’язково, використовується для мультимодальних записів
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
- `{{OutputBase}}` (базовий шлях тимчасового файла без розширення)

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для зображень/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановили обмеження)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

Правила:

- Якщо медіа перевищує `maxBytes`, цю модель пропускають і **пробують наступну модель**.
- Аудіофайли менші за **1024 байти** вважаються порожніми/пошкодженими і пропускаються до транскрибування provider/CLI.
- Якщо модель повертає більше ніж `maxChars`, вивід обрізається.
- Для `prompt` типовим є просте “Describe the {media}.” плюс вказівка `maxChars` (лише для зображень/відео).
- Якщо активна основна модель зображень уже нативно підтримує vision, OpenClaw
  пропускає блок підсумку `[Image]` і натомість передає оригінальне зображення в
  модель.
- Якщо основна модель Gateway/WebChat підтримує лише текст, вкладення зображень
  зберігаються як винесені посилання `media://inbound/*`, щоб інструменти для зображень/PDF або
  налаштована модель зображень усе ще могли їх переглядати, а вкладення не втрачалися.
- Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони запускають цей provider/модель з підтримкою зображень безпосередньо, зокрема
  посилання Ollama, як-от `ollama/qwen2.5vl:7b`.
- Якщо `<capability>.enabled: true`, але моделі не налаштовані, OpenClaw пробує
  **активну модель відповіді**, якщо її provider підтримує цю можливість.

### Автовизначення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не
налаштували моделі, OpenClaw автоматично визначає в такому порядку і **зупиняється на першому
робочому варіанті**:

1. **Активна модель відповіді**, якщо її provider підтримує цю можливість.
2. **`agents.defaults.imageModel`** посилання primary/fallback (лише для зображень).
3. **Локальні CLI** (лише для аудіо; якщо встановлені)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
   - `whisper` (Python CLI; автоматично завантажує моделі)
4. **Gemini CLI** (`gemini`) з використанням `read_many_files`
5. **Автентифікація provider**
   - Налаштовані записи `models.providers.*`, які підтримують цю можливість,
     пробуються перед вбудованим порядком резервних варіантів.
   - Provider конфігурації лише для зображень із моделлю, що підтримує зображення, автоматично реєструються для
     розуміння медіа, навіть якщо вони не є вбудованим Plugin постачальника.
   - Розуміння зображень Ollama доступне, якщо його вибрано явно, наприклад через `agents.defaults.imageModel` або
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Порядок вбудованого резервного варіанта:
     - Аудіо: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
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

Примітка: Визначення бінарних файлів виконується за принципом best-effort у macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI-модель із повним шляхом до команди.

### Підтримка proxy через середовище (моделі provider)

Коли ввімкнено розуміння медіа **аудіо** та **відео** на основі provider, OpenClaw
підтримує стандартні змінні середовища вихідного proxy для HTTP-викликів provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Якщо змінні середовища proxy не задано, для розуміння медіа використовується прямий вихідний трафік.
Якщо значення proxy некоректне, OpenClaw записує попередження в журнал і повертається до прямого
отримання.

## Можливості (необов’язково)

Якщо ви встановлюєте `capabilities`, запис виконується лише для цих типів медіа. Для спільних
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
- Будь-який каталог `models.providers.<id>.models[]` із моделлю, що підтримує зображення:
  **image**

Для записів CLI **явно задавайте `capabilities`**, щоб уникнути неочікуваних збігів.
Якщо ви не задаєте `capabilities`, запис вважається придатним для того списку, у якому він розміщений.

## Матриця підтримки provider (інтеграції OpenClaw)

| Можливість | Інтеграція provider                                                                                                         | Примітки                                                                                                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Зображення | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Plugins постачальників реєструють підтримку зображень; `openai-codex/*` використовує механізм OAuth provider; `codex/*` використовує обмежений хід Codex app-server; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; provider конфігурації з підтримкою зображень реєструються автоматично. |
| Аудіо      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Транскрибування provider (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                               |
| Відео      | Google, Qwen, Moonshot                                                                                                       | Розуміння відео provider через Plugins постачальників; розуміння відео Qwen використовує стандартні кінцеві точки DashScope.                                                                                                        |

Примітка про MiniMax:

- Розуміння зображень `minimax` і `minimax-portal` походить із керованого Plugin
  медіаprovider `MiniMax-VL-01`.
- Вбудований текстовий каталог MiniMax усе ще починається як лише текстовий; явні
  записи `models.providers.minimax` матеріалізують chat-посилання M2.7 з підтримкою зображень.

## Рекомендації щодо вибору моделі

- Віддавайте перевагу найсильнішій доступній моделі останнього покоління для кожної медіаможливості, коли важливі якість і безпека.
- Для агентів з увімкненими інструментами, які обробляють недовірені вхідні дані, уникайте старіших/слабших медіамоделей.
- Тримайте щонайменше один резервний варіант для кожної можливості для доступності (якісна модель + швидша/дешевша модель).
- Резервні CLI (`whisper-cli`, `whisper`, `gemini`) корисні, коли API provider недоступні.
- Примітка щодо `parakeet-mlx`: з `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не вказано); формати, відмінні від `txt`, повертаються до розбору stdout.

## Політика вкладень

Для кожної можливості `attachments` керує тим, які вкладення обробляються:

- `mode`: `first` (типово) або `all`
- `maxAttachments`: обмеження кількості оброблюваних елементів (типово **1**)
- `prefer`: `first`, `last`, `path`, `url`

Коли `mode: "all"`, результати позначаються як `[Image 1/2]`, `[Audio 2/2]` тощо.

Поведінка витягування вмісту з файлових вкладень:

- Витягнутий текст файла обгортається як **недовірений зовнішній вміст**, перш ніж його
  буде додано до медіапідказки.
- Вставлений блок використовує явні маркери меж, як-от
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить рядок метаданих
  `Source: External`.
- Цей шлях витягування вкладень навмисно не містить довгий банер
  `SECURITY NOTICE:`, щоб не роздувати медіапідказку; маркери меж
  і метадані все одно зберігаються.
- Якщо файл не має тексту, який можна витягти, OpenClaw вставляє `[No extractable text]`.
- Якщо PDF у цьому шляху повертається до рендерингу зображень сторінок, медіапідказка зберігає
  заповнювач `[PDF content rendered to images; images not forwarded to model]`,
  оскільки цей етап витягування вкладень передає текстові блоки, а не відрендерені зображення PDF.

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

## Вивід статусу

Коли запускається розуміння медіа, `/status` містить короткий підсумковий рядок:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Він показує результати для кожної можливості та вибраний provider/модель, якщо застосовно.

## Примітки

- Розуміння виконується за принципом **best-effort**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнено.
- Використовуйте `scope`, щоб обмежити, де запускається розуміння (наприклад, лише в DM).

## Пов’язана документація

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
