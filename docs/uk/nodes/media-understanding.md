---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідного аудіо/відео/зображень
summary: Вхідне розуміння зображень/аудіо/відео (необов’язково) з резервними варіантами через провайдера та CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-04-24T01:43:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9eb9449fbc1bed170bbef213aa43d71d4146edbc0dd626ef50af9e044a8e299
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Розуміння медіа — вхідне (2026-01-17)

OpenClaw може **узагальнювати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично визначає, коли доступні локальні інструменти або ключі провайдерів, і цю функцію можна вимкнути або налаштувати. Якщо розуміння вимкнено, моделі, як і раніше, отримують оригінальні файли/URL.

Поведінка медіа, специфічна для вендора, реєструється плагінами вендорів, тоді як ядро OpenClaw володіє спільною конфігурацією `tools.media`, порядком резервного переходу та інтеграцією з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо перетворювати вхідні медіа на короткий текст для швидшої маршрутизації та кращого розбору команд.
- Завжди зберігати доставку оригінальних медіа до моделі.
- Підтримувати **API провайдерів** і **резервні варіанти через CLI**.
- Дозволяти кілька моделей з упорядкованим резервним переходом (помилка/розмір/тайм-аут).

## Поведінка на високому рівні

1. Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Для кожної увімкненої можливості (зображення/аудіо/відео) вибрати вкладення згідно з політикою (типово: **перше**).
3. Вибрати перший придатний запис моделі (розмір + можливість + автентифікація).
4. Якщо модель не спрацювала або медіа надто велике, **перейти до наступного запису**.
5. У разі успіху:
   - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
   - Для аудіо встановлюється `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є, інакше — транскрипт.
   - Підписи зберігаються як `User text:` усередині блоку.

Якщо розуміння не вдалося або його вимкнено, **потік відповіді продовжується** з оригінальним тілом і вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі** та перевизначення для окремих можливостей:

- `tools.media.models`: список спільних моделей (використовуйте `capabilities` для обмеження).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - перевизначення провайдера (`baseUrl`, `headers`, `providerOptions`)
  - аудіоопції Deepgram через `tools.media.audio.providerOptions.deepgram`
  - елементи керування відображенням транскрипту аудіо (`echoTranscript`, типово `false`; `echoFormat`)
  - необов’язковий список `models` **для окремої можливості** (має пріоритет над спільними моделями)
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
- `{{OutputDir}}` (робочий каталог, створений для цього запуску)
- `{{OutputBase}}` (базовий шлях робочого файла без розширення)

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для зображень/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановите обмеження)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

Правила:

- Якщо медіа перевищує `maxBytes`, ця модель пропускається і **робиться спроба з наступною моделлю**.
- Аудіофайли менші за **1024 байти** вважаються порожніми/пошкодженими й пропускаються до транскрибування через провайдера/CLI.
- Якщо модель повертає більше ніж `maxChars`, вивід обрізається.
- `prompt` типово має простий вигляд “Describe the {media}.” плюс підказка щодо `maxChars` (лише для зображень/відео).
- Якщо активна основна модель зображень уже нативно підтримує vision, OpenClaw пропускає блок підсумку `[Image]` і натомість передає оригінальне зображення в модель.
- Якщо основна модель Gateway/WebChat підтримує лише текст, вкладення зображень зберігаються як вивантажені посилання `media://inbound/*`, щоб інструмент зображень або налаштована модель зображень усе ще могли їх перевірити замість втрати вкладення.
- Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони запускають цей provider/model з підтримкою зображень напряму, зокрема посилання Ollama на кшталт `ollama/qwen2.5vl:7b`.
- Якщо `<capability>.enabled: true`, але моделі не налаштовано, OpenClaw пробує **активну модель відповіді**, якщо її провайдер підтримує цю можливість.

### Автовизначення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не налаштували моделі, OpenClaw виконує автовизначення в такому порядку і **зупиняється на першому робочому варіанті**:

1. **Активна модель відповіді**, якщо її провайдер підтримує цю можливість.
2. Основні/резервні посилання **`agents.defaults.imageModel`** (лише для зображень).
3. **Локальні CLI** (лише для аудіо; якщо встановлено)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny model)
   - `whisper` (Python CLI; автоматично завантажує моделі)
4. **Gemini CLI** (`gemini`) з використанням `read_many_files`
5. **Автентифікація провайдера**
   - Налаштовані записи `models.providers.*`, які підтримують цю можливість, пробуються до вбудованого порядку резервного переходу.
   - Провайдери з конфігурації лише для зображень із моделлю, що підтримує зображення, автоматично реєструються для розуміння медіа, навіть якщо вони не є вбудованим плагіном вендора.
   - Розуміння зображень через Ollama доступне за явного вибору, наприклад через `agents.defaults.imageModel` або `openclaw infer image describe --model ollama/<vision-model>`.
   - Вбудований порядок резервного переходу:
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

Примітка: визначення бінарних файлів є best-effort у macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI-модель з повним шляхом до команди.

### Підтримка середовища проксі (моделі провайдерів)

Коли увімкнено розуміння медіа **audio** і **video** на основі провайдера, OpenClaw враховує стандартні змінні середовища вихідного проксі для HTTP-викликів провайдера:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Якщо змінні середовища проксі не задані, розуміння медіа використовує прямий вихідний трафік.
Якщо значення проксі некоректне, OpenClaw записує попередження в журнал і повертається до прямого отримання.

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

Для записів CLI **задавайте `capabilities` явно**, щоб уникнути неочікуваних збігів.
Якщо ви пропускаєте `capabilities`, запис придатний для списку, у якому він з’являється.

## Матриця підтримки провайдерів (інтеграції OpenClaw)

| Можливість | Інтеграція провайдера                                                                                                        | Примітки                                                                                                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Зображення | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Плагіни вендорів реєструють підтримку зображень; `openai-codex/*` використовує механізм OAuth-провайдера; `codex/*` використовує обмежений хід Codex app-server; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; провайдери конфігурації з підтримкою зображень реєструються автоматично. |
| Аудіо      | OpenAI, Groq, Deepgram, Google, Mistral                                                                                      | Транскрибування через провайдера (Whisper/Deepgram/Gemini/Voxtral).                                                                                                                                                                  |
| Відео      | Google, Qwen, Moonshot                                                                                                       | Розуміння відео через провайдера за допомогою плагінів вендорів; розуміння відео Qwen використовує Standard DashScope endpoints.                                                                                                    |

Примітка щодо MiniMax:

- Розуміння зображень через `minimax` і `minimax-portal` походить із провайдера медіа `MiniMax-VL-01`, що належить плагіну.
- Вбудований текстовий каталог MiniMax, як і раніше, починається з режиму лише тексту; явні записи `models.providers.minimax` матеріалізують посилання чату M2.7 з підтримкою зображень.

## Рекомендації щодо вибору моделі

- Віддавайте перевагу найсильнішій моделі останнього покоління, доступній для кожної медіаможливості, коли важливі якість і безпека.
- Для агентів з увімкненими інструментами, які працюють із недовіреними вхідними даними, уникайте старіших/слабших медіамоделей.
- Тримайте принаймні один резервний варіант для кожної можливості з міркувань доступності (якісна модель + швидша/дешевша модель).
- Резервні варіанти CLI (`whisper-cli`, `whisper`, `gemini`) корисні, коли API провайдерів недоступні.
- Примітка щодо `parakeet-mlx`: із `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не заданий); для форматів, відмінних від `txt`, використовується stdout.

## Політика вкладень

Параметр `attachments` для окремої можливості керує тим, які вкладення обробляються:

- `mode`: `first` (типово) або `all`
- `maxAttachments`: обмеження кількості оброблюваних вкладень (типово **1**)
- `prefer`: `first`, `last`, `path`, `url`

Коли `mode: "all"`, результати позначаються як `[Image 1/2]`, `[Audio 2/2]` тощо.

Поведінка витягування з файлових вкладень:

- Витягнутий текст файлу обгортається як **недовірений зовнішній вміст** перед додаванням до підказки медіа.
- Вставлений блок використовує явні маркери меж на кшталт `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` і містить рядок метаданих `Source: External`.
- Цей шлях витягування вкладень навмисно пропускає довгий банер `SECURITY NOTICE:`, щоб не роздувати підказку медіа; маркери меж і метадані при цьому все одно зберігаються.
- Якщо файл не містить тексту, який можна витягнути, OpenClaw вставляє `[No extractable text]`.
- Якщо PDF у цьому шляху повертається до відтворених зображень сторінок, підказка медіа зберігає заповнювач `[PDF content rendered to images; images not forwarded to model]`, тому що цей крок витягування вкладень пересилає текстові блоки, а не відтворені зображення PDF.

## Приклади конфігурації

### 1) Список спільних моделей + перевизначення

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

### 4) Один мультимодальний запис (явно вказані можливості)

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

Коли виконується розуміння медіа, `/status` містить короткий рядок підсумку:

```
📎 Медіа: зображення ok (openai/gpt-5.4) · аудіо пропущено (maxBytes)
```

Тут показуються результати для кожної можливості та вибраний provider/model, якщо застосовно.

## Примітки

- Розуміння є **best-effort**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнено.
- Використовуйте `scope`, щоб обмежити, де запускається розуміння (наприклад, лише в особистих повідомленнях).

## Пов’язана документація

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
