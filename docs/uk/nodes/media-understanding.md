---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідних аудіо/відео/зображень
summary: Вхідне розуміння зображень/аудіо/відео (необов’язково) із запасними варіантами для провайдера та CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-04-21T21:37:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d80c9bcd965b521c3c782a76b9dd31eb6e6c635d8a1cc6895b6ccfaf5f9492e
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Розуміння медіа — вхідне (2026-01-17)

OpenClaw може **узагальнювати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично визначає, коли доступні локальні інструменти або ключі провайдера, і може бути вимкнений або налаштований. Якщо розуміння вимкнене, моделі все одно отримують вихідні файли/URL-адреси як зазвичай.

Поведінка медіа, специфічна для постачальника, реєструється через плагіни постачальників, тоді як ядро OpenClaw володіє спільною конфігурацією `tools.media`, порядком запасних варіантів і інтеграцією з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо зводити вхідні медіа до короткого тексту для швидшої маршрутизації та кращого розбору команд.
- Завжди зберігати передавання оригінальних медіа до моделі.
- Підтримувати **API провайдерів** і **запасні варіанти через CLI**.
- Дозволяти кілька моделей з упорядкованим запасним переходом (помилка/розмір/тайм-аут).

## Поведінка на високому рівні

1. Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Для кожної ввімкненої можливості (зображення/аудіо/відео) вибрати вкладення згідно з політикою (типово: **перше**).
3. Вибрати перший придатний запис моделі (розмір + можливість + автентифікація).
4. Якщо модель завершується помилкою або медіа завелике, **перейти до наступного запису**.
5. У разі успіху:
   - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
   - Для аудіо встановлюється `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є, інакше — транскрипт.
   - Підписи зберігаються як `User text:` усередині блоку.

Якщо розуміння не вдається або вимкнене, **потік відповіді продовжується** з оригінальним тілом і вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі** та перевизначення для кожної можливості окремо:

- `tools.media.models`: спільний список моделей (використовуйте `capabilities` для обмеження).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - перевизначення провайдера (`baseUrl`, `headers`, `providerOptions`)
  - параметри Deepgram для аудіо через `tools.media.audio.providerOptions.deepgram`
  - параметри повторного виведення транскрипту аудіо (`echoTranscript`, типово `false`; `echoFormat`)
  - необов’язковий **список `models` для окремої можливості** (має пріоритет над спільними моделями)
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

Кожен запис у `models[]` може бути **provider** або **CLI**:

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
- `{{OutputBase}}` (базовий шлях тимчасового файла, без розширення)

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для зображень/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановите обмеження)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

Правила:

- Якщо медіа перевищує `maxBytes`, цю модель пропускають і **пробують наступну модель**.
- Аудіофайли менші за **1024 байти** вважаються порожніми/пошкодженими та пропускаються до транскрибування через provider/CLI.
- Якщо модель повертає більше ніж `maxChars`, вивід обрізається.
- Типове значення `prompt` — просте «Describe the {media}.» плюс вказівка щодо `maxChars` (лише для зображень/відео).
- Якщо активна основна модель для зображень уже нативно підтримує vision, OpenClaw пропускає блок зведення `[Image]` і натомість передає оригінальне зображення до моделі.
- Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони напряму запускають цей provider/model із підтримкою зображень, зокрема посилання Ollama, як-от `ollama/qwen2.5vl:7b`.
- Якщо `<capability>.enabled: true`, але моделі не налаштовані, OpenClaw намагається використати **активну модель відповіді**, якщо її провайдер підтримує цю можливість.

### Автовизначення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не налаштували моделі, OpenClaw автоматично визначає варіант у такому порядку і **зупиняється на першому робочому варіанті**:

1. **Активна модель відповіді**, якщо її провайдер підтримує цю можливість.
2. Основні/запасні посилання **`agents.defaults.imageModel`** (лише для зображень).
3. **Локальні CLI** (лише для аудіо; якщо встановлені)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
   - `whisper` (Python CLI; автоматично завантажує моделі)
4. **Gemini CLI** (`gemini`) з використанням `read_many_files`
5. **Автентифікація провайдера**
   - Налаштовані записи `models.providers.*`, що підтримують цю можливість, перевіряються раніше за вбудований порядок запасних варіантів.
   - Провайдери з конфігурації лише для зображень із моделлю, що підтримує зображення, автоматично реєструються для розуміння медіа, навіть якщо вони не є вбудованим плагіном постачальника.
   - Розуміння зображень Ollama доступне за явного вибору, наприклад через `agents.defaults.imageModel` або `openclaw infer image describe --model ollama/<vision-model>`.
   - Вбудований порядок запасних варіантів:
     - Аудіо: OpenAI → Groq → Deepgram → Google → Mistral
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

Примітка: виявлення бінарних файлів виконується за принципом best-effort у macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI-модель із повним шляхом до команди.

### Підтримка проксі-середовища (provider-моделі)

Коли ввімкнене розуміння медіа **audio** і **video** на основі провайдера, OpenClaw враховує стандартні змінні середовища вихідного проксі для HTTP-викликів до провайдера:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Якщо змінні середовища проксі не встановлені, розуміння медіа використовує прямий вихід у мережу.
Якщо значення проксі некоректно сформоване, OpenClaw записує попередження в журнал і повертається до прямого отримання.

## Можливості (необов’язково)

Якщо ви задаєте `capabilities`, запис запускається лише для цих типів медіа. Для спільних списків OpenClaw може виводити типові значення:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `deepgram`: **audio**
- Будь-який каталог `models.providers.<id>.models[]` із моделлю, що підтримує зображення: **image**

Для записів CLI **явно задавайте `capabilities`**, щоб уникнути неочікуваних збігів.
Якщо `capabilities` не вказано, запис придатний для списку, у якому він з’являється.

## Матриця підтримки провайдерів (інтеграції OpenClaw)

| Можливість | Інтеграція провайдера                                                                    | Примітки                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Зображення | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Плагіни постачальників реєструють підтримку зображень; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; config providers із підтримкою зображень реєструються автоматично. |
| Аудіо      | OpenAI, Groq, Deepgram, Google, Mistral                                                  | Транскрибування провайдера (Whisper/Deepgram/Gemini/Voxtral).                                                                           |
| Відео      | Google, Qwen, Moonshot                                                                   | Розуміння відео провайдером через плагіни постачальників; розуміння відео Qwen використовує стандартні кінцеві точки DashScope.       |

Примітка щодо MiniMax:

- Розуміння зображень `minimax` і `minimax-portal` походить із медіапровайдера `MiniMax-VL-01`, що належить плагіну.
- Вбудований текстовий каталог MiniMax усе ще починається лише з тексту; явні записи `models.providers.minimax` матеріалізують M2.7 chat refs із підтримкою зображень.

## Рекомендації щодо вибору моделі

- Віддавайте перевагу найсильнішій моделі останнього покоління, доступній для кожної медіаможливості, коли важливі якість і безпека.
- Для агентів з увімкненими інструментами, які обробляють недовірені вхідні дані, уникайте старіших/слабших медіамоделей.
- Тримайте принаймні один запасний варіант для кожної можливості задля доступності (якісна модель + швидша/дешевша модель).
- Запасні варіанти CLI (`whisper-cli`, `whisper`, `gemini`) корисні, коли API провайдерів недоступні.
- Примітка про `parakeet-mlx`: з `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не вказаний); формати, відмінні від `txt`, повертаються до stdout.

## Політика вкладень

`attachments` для кожної можливості визначає, які вкладення обробляються:

- `mode`: `first` (типово) або `all`
- `maxAttachments`: обмежує кількість оброблюваних елементів (типово **1**)
- `prefer`: `first`, `last`, `path`, `url`

Коли `mode: "all"`, результати позначаються як `[Image 1/2]`, `[Audio 2/2]` тощо.

Поведінка вилучення з файлових вкладень:

- Вилучений текст файла обгортається як **недовірений зовнішній вміст**, перш ніж його буде додано до запиту медіа.
- Впроваджений блок використовує явні маркери меж, такі як `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить рядок метаданих `Source: External`.
- Цей шлях вилучення вкладень навмисно не включає довгий банер `SECURITY NOTICE:`, щоб не роздувати запит медіа; маркери меж і метадані все одно зберігаються.
- Якщо файл не має тексту, придатного до вилучення, OpenClaw вставляє `[No extractable text]`.
- Якщо PDF на цьому шляху повертається до зображень відрендерених сторінок, запит медіа зберігає заповнювач `[PDF content rendered to images; images not forwarded to model]`, оскільки цей крок вилучення вкладень передає текстові блоки, а не відрендерені зображення PDF.

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

### 4) Один мультимодальний запис (явні можливості)

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

Коли виконується розуміння медіа, `/status` містить короткий рядок зведення:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Тут показано результат для кожної можливості та вибраний provider/model, якщо застосовно.

## Примітки

- Розуміння виконується **за принципом best-effort**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнене.
- Використовуйте `scope`, щоб обмежити, де запускається розуміння (наприклад, лише в особистих повідомленнях).

## Пов’язані документи

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
