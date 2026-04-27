---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідного аудіо/відео/зображень
sidebarTitle: Media understanding
summary: Розуміння вхідних зображень/аудіо/відео (необов’язково) з резервними варіантами через провайдера та CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-04-27T14:47:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79774578e0abb8b9646c5850d502e1a2f34b1f6f2253a5e6fec0983333d56009
    source_path: nodes/media-understanding.md
    workflow: 15
---

OpenClaw може **підсумовувати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично визначає, коли доступні локальні інструменти або ключі провайдера, і його можна вимкнути або налаштувати. Якщо розуміння вимкнене, моделі, як і раніше, отримують вихідні файли/URL.

Специфічна для постачальника поведінка медіа реєструється плагінами постачальників, тоді як ядро OpenClaw відповідає за спільну конфігурацію `tools.media`, порядок резервного переходу та інтеграцію з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо зводити вхідні медіа до короткого тексту для швидшої маршрутизації та кращого розбору команд.
- Завжди зберігати доставку оригінальних медіа до моделі.
- Підтримувати **API провайдерів** і **резервні варіанти через CLI**.
- Дозволяти кілька моделей з упорядкованим резервним переходом (помилка/розмір/тайм-аут).

## Поведінка на високому рівні

<Steps>
  <Step title="Зібрати вкладення">
    Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Вибрати за можливістю">
    Для кожної ввімкненої можливості (зображення/аудіо/відео) вибрати вкладення згідно з політикою (типово: **перше**).
  </Step>
  <Step title="Вибрати модель">
    Вибрати перший придатний запис моделі (розмір + можливість + автентифікація).
  </Step>
  <Step title="Резервний перехід у разі збою">
    Якщо модель завершується з помилкою або медіа надто велике, **перейти до наступного запису**.
  </Step>
  <Step title="Застосувати блок успіху">
    У разі успіху:

    - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
    - Для аудіо задається `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є, інакше — транскрипт.
    - Підписи зберігаються як `User text:` усередині блоку.

  </Step>
</Steps>

Якщо розуміння не вдається або вимкнене, **потік відповіді продовжується** з вихідним тілом + вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі** плюс перевизначення для кожної можливості:

<AccordionGroup>
  <Accordion title="Ключі верхнього рівня">
    - `tools.media.models`: спільний список моделей (використовуйте `capabilities` для обмеження).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - значення за замовчуванням (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - перевизначення провайдера (`baseUrl`, `headers`, `providerOptions`)
      - параметри аудіо Deepgram через `tools.media.audio.providerOptions.deepgram`
      - елементи керування відлунням транскрипту аудіо (`echoTranscript`, типово `false`; `echoFormat`)
      - необов’язковий список **`models` для конкретної можливості** (має пріоритет над спільними моделями)
      - політика `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (необов’язкове обмеження за channel/chatType/session key)
    - `tools.media.concurrency`: максимальна кількість одночасних запусків можливостей (типово **2**).
  </Accordion>
</AccordionGroup>

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

<Tabs>
  <Tab title="Запис provider">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="Запис CLI">
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

  </Tab>
</Tabs>

## Значення за замовчуванням і обмеження

Рекомендовані значення за замовчуванням:

- `maxChars`: **500** для зображень/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановите обмеження)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

<AccordionGroup>
  <Accordion title="Правила">
    - Якщо медіа перевищує `maxBytes`, цю модель буде пропущено, і **буде спробувано наступну модель**.
    - Аудіофайли менші за **1024 байти** вважаються порожніми/пошкодженими й пропускаються до транскрибування через provider/CLI; вхідний контекст відповіді отримує детермінований транскрипт-заповнювач, щоб агент знав, що нотатка була надто малою.
    - Якщо модель повертає більше ніж `maxChars`, вивід обрізається.
    - `prompt` типово дорівнює простому "Describe the {media}." плюс вказівка `maxChars` (лише для зображень/відео).
    - Якщо активна основна модель зображень уже нативно підтримує vision, OpenClaw пропускає блок підсумку `[Image]` і натомість передає оригінальне зображення безпосередньо моделі.
    - Якщо основна модель Gateway/WebChat є лише текстовою, вкладення зображень зберігаються як виносні посилання `media://inbound/*`, щоб інструменти зображень/PDF або налаштована модель зображень усе ще могли їх перевіряти, а вкладення не втрачалося.
    - Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони запускають вказаний provider/model із підтримкою зображень напряму, зокрема посилання Ollama, як-от `ollama/qwen2.5vl:7b`.
    - Якщо `<capability>.enabled: true`, але моделі не налаштовані, OpenClaw пробує **активну модель відповіді**, якщо її провайдер підтримує цю можливість.
  </Accordion>
</AccordionGroup>

### Автовизначення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не налаштували моделі, OpenClaw автоматично визначає в такому порядку і **зупиняється на першому робочому варіанті**:

<Steps>
  <Step title="Активна модель відповіді">
    Активна модель відповіді, якщо її провайдер підтримує цю можливість.
  </Step>
  <Step title="agents.defaults.imageModel">
    Основні/резервні посилання `agents.defaults.imageModel` (лише зображення).
  </Step>
  <Step title="Локальні CLI (лише аудіо)">
    Локальні CLI (якщо встановлено):

    - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny model)
    - `whisper` (Python CLI; автоматично завантажує моделі)

  </Step>
  <Step title="Gemini CLI">
    `gemini` з використанням `read_many_files`.
  </Step>
  <Step title="Автентифікація провайдера">
    - Налаштовані записи `models.providers.*`, які підтримують цю можливість, пробуються до вбудованого порядку резервного переходу.
    - Провайдери конфігурації лише для зображень із моделлю, що підтримує зображення, автоматично реєструються для розуміння медіа, навіть якщо вони не є вбудованим плагіном постачальника.
    - Розуміння зображень Ollama доступне за явного вибору, наприклад через `agents.defaults.imageModel` або `openclaw infer image describe --model ollama/<vision-model>`.

    Вбудований порядок резервного переходу:

    - Аудіо: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - Зображення: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Відео: Google → Qwen → Moonshot

  </Step>
</Steps>

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

<Note>
Виявлення бінарних файлів виконується за принципом best-effort у macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну модель CLI з повним шляхом до команди.
</Note>

### Підтримка проксі-середовища (моделі provider)

Коли ввімкнено розуміння медіа **audio** і **video** на основі провайдера, OpenClaw враховує стандартні змінні середовища вихідного проксі для HTTP-викликів провайдера:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Якщо змінні середовища проксі не задані, розуміння медіа використовує прямий вихідний трафік. Якщо значення проксі некоректне, OpenClaw записує попередження в журнал і повертається до прямого отримання.

## Можливості (необов’язково)

Якщо ви задаєте `capabilities`, запис запускається лише для цих типів медіа. Для спільних списків OpenClaw може визначати типові значення:

- `openai`, `anthropic`, `minimax`: **зображення**
- `minimax-portal`: **зображення**
- `moonshot`: **зображення + відео**
- `openrouter`: **зображення**
- `google` (Gemini API): **зображення + аудіо + відео**
- `qwen`: **зображення + відео**
- `mistral`: **аудіо**
- `zai`: **зображення**
- `groq`: **аудіо**
- `xai`: **аудіо**
- `deepgram`: **аудіо**
- Будь-який каталог `models.providers.<id>.models[]` із моделлю, що підтримує зображення: **зображення**

Для записів CLI **задавайте `capabilities` явно**, щоб уникнути неочікуваних збігів. Якщо ви не задаєте `capabilities`, запис придатний для списку, у якому він з’являється.

## Матриця підтримки провайдерів (інтеграції OpenClaw)

| Можливість | Інтеграція провайдера                                                                                                        | Примітки                                                                                                                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Зображення | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Плагіни постачальників реєструють підтримку зображень; `openai-codex/*` використовує механізм OAuth-провайдера; `codex/*` використовує обмежений хід Codex app-server; і MiniMax, і MiniMax OAuth використовують `MiniMax-VL-01`; провайдери конфігурації з підтримкою зображень автоматично реєструються. |
| Аудіо      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Транскрибування провайдером (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                          |
| Відео      | Google, Qwen, Moonshot                                                                                                       | Розуміння відео провайдером через плагіни постачальників; розуміння відео Qwen використовує стандартні кінцеві точки DashScope.                                                                                                  |

<Note>
**Примітка щодо MiniMax**

- Розуміння зображень `minimax` і `minimax-portal` надається через медіапровайдера `MiniMax-VL-01`, що належить плагіну.
- Вбудований текстовий каталог MiniMax усе ще починається лише з текстового режиму; явні записи `models.providers.minimax` матеріалізують посилання чату M2.7 із підтримкою зображень.
  </Note>

## Вказівки щодо вибору моделей

- Надавайте перевагу найсильнішій моделі останнього покоління, доступній для кожної медіаможливості, коли важливі якість і безпека.
- Для агентів з увімкненими інструментами, які працюють із недовіреними вхідними даними, уникайте старіших/слабших медіамоделей.
- Тримайте щонайменше один резервний варіант для кожної можливості для доступності (якісна модель + швидша/дешевша модель).
- Резервні варіанти CLI (`whisper-cli`, `whisper`, `gemini`) корисні, коли API провайдерів недоступні.
- Примітка щодо `parakeet-mlx`: із `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не заданий); для форматів, відмінних від `txt`, використовується резервний вивід у stdout.

## Політика вкладень

`attachments` для конкретної можливості керує тим, які вкладення обробляються:

<ParamField path="mode" type='"first" | "all"' default="first">
  Чи обробляти перше вибране вкладення, чи всі.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Обмежує кількість оброблюваних.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Перевага вибору серед кандидатів на вкладення.
</ParamField>

Коли `mode: "all"`, результати позначаються як `[Image 1/2]`, `[Audio 2/2]` тощо.

<AccordionGroup>
  <Accordion title="Поведінка вилучення вкладених файлів">
    - Вилучений текст файлу обгортається як **ненадійний зовнішній вміст** перед додаванням до медіапідказки.
    - Вставлений блок використовує явні маркери меж, як-от `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить рядок метаданих `Source: External`.
    - Цей шлях вилучення вкладень навмисно не включає довгий банер `SECURITY NOTICE:`, щоб не роздувати медіапідказку; маркери меж і метадані при цьому все одно зберігаються.
    - Якщо файл не має тексту, який можна вилучити, OpenClaw вставляє `[No extractable text]`.
    - Якщо PDF у цьому шляху переходить до резервного рендерингу сторінок у зображення, медіапідказка зберігає заповнювач `[PDF content rendered to images; images not forwarded to model]`, оскільки цей крок вилучення вкладень передає текстові блоки, а не відрендерені зображення PDF.
  </Accordion>
</AccordionGroup>

## Приклади конфігурації

<Tabs>
  <Tab title="Спільні моделі + перевизначення">
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
  </Tab>
  <Tab title="Лише аудіо + відео">
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
  </Tab>
  <Tab title="Лише зображення">
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
  </Tab>
  <Tab title="Однозаписовий мультимодальний варіант">
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
  </Tab>
</Tabs>

## Вивід стану

Коли працює розуміння медіа, `/status` містить короткий підсумковий рядок:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Тут показано результати для кожної можливості та вибраний provider/model, де це доречно.

## Примітки

- Розуміння працює за принципом **best-effort**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнене.
- Використовуйте `scope`, щоб обмежити місця, де працює розуміння (наприклад, лише приватні повідомлення).

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
