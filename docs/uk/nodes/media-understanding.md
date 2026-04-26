---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідного аудіо/відео/зображень
sidebarTitle: Media understanding
summary: Вхідне розуміння зображень/аудіо/відео (необов’язково) з резервними варіантами через провайдера + CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-04-26T08:15:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ee170a7af523fd2ce4f5f7764638f510b135f94a7796325daf1c3e04147f90
    source_path: nodes/media-understanding.md
    workflow: 15
---

OpenClaw може **підсумовувати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично визначає, коли доступні локальні інструменти або ключі провайдера, і може бути вимкнений або налаштований. Якщо розуміння вимкнене, моделі, як і раніше, отримують оригінальні файли/URL.

Поведінка медіа, специфічна для постачальника, реєструється плагінами постачальників, тоді як ядро OpenClaw відповідає за спільну конфігурацію `tools.media`, порядок резервних варіантів і інтеграцію з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо зводити вхідні медіа до короткого тексту для швидшої маршрутизації та кращого розбору команд.
- Зберігати доставку оригінальних медіа до моделі (завжди).
- Підтримувати **API провайдерів** і **резервні варіанти CLI**.
- Дозволяти кілька моделей з упорядкованим резервуванням (помилка/розмір/тайм-аут).

## Поведінка на високому рівні

<Steps>
  <Step title="Збір вкладень">
    Збирає вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Вибір за можливістю">
    Для кожної ввімкненої можливості (зображення/аудіо/відео) вибирає вкладення згідно з політикою (типово: **перше**).
  </Step>
  <Step title="Вибір моделі">
    Вибирає перший придатний запис моделі (розмір + можливість + автентифікація).
  </Step>
  <Step title="Резервний варіант у разі збою">
    Якщо модель завершується з помилкою або медіа надто велике, **переходить до наступного запису**.
  </Step>
  <Step title="Застосування блоку успіху">
    У разі успіху:

    - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
    - Для аудіо встановлюється `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є, інакше — транскрипт.
    - Підписи зберігаються як `User text:` усередині блоку.

  </Step>
</Steps>

Якщо розуміння завершується невдачею або вимкнене, **потік відповіді продовжується** з початковим тілом і вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі**, а також перевизначення для окремих можливостей:

<AccordionGroup>
  <Accordion title="Ключі верхнього рівня">
    - `tools.media.models`: спільний список моделей (використовуйте `capabilities` для обмеження).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - перевизначення провайдера (`baseUrl`, `headers`, `providerOptions`)
      - параметри аудіо Deepgram через `tools.media.audio.providerOptions.deepgram`
      - параметри відлуння аудіотранскрипту (`echoTranscript`, типово `false`; `echoFormat`)
      - необов’язковий список `models` **для окремої можливості** (має пріоритет над спільними моделями)
      - політика `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (необов’язкове обмеження за каналом/chatType/ключем сесії)
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

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для зображень/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановите обмеження)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

<AccordionGroup>
  <Accordion title="Правила">
    - Якщо медіа перевищує `maxBytes`, ця модель пропускається і **використовується наступна модель**.
    - Аудіофайли менші за **1024 байти** вважаються порожніми/пошкодженими й пропускаються до транскрибування через provider/CLI; вхідний контекст відповіді отримує детермінований заповнювач транскрипту, щоб агент знав, що нотатка була надто малою.
    - Якщо модель повертає більше ніж `maxChars`, вивід обрізається.
    - `prompt` типово дорівнює простому "Describe the {media}." плюс вказівка `maxChars` (лише для зображення/відео).
    - Якщо активна основна модель для зображень уже нативно підтримує vision, OpenClaw пропускає блок підсумку `[Image]` і натомість передає оригінальне зображення в модель.
    - Якщо основна модель Gateway/WebChat є лише текстовою, вкладення зображень зберігаються як винесені посилання `media://inbound/*`, щоб інструменти зображень/PDF або налаштована модель зображень усе ще могли їх перевірити замість втрати вкладення.
    - Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони напряму запускають вказану provider/model із підтримкою зображень, включно з посиланнями Ollama, такими як `ollama/qwen2.5vl:7b`.
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
    Основні/резервні посилання `agents.defaults.imageModel` (лише для зображень).
  </Step>
  <Step title="Локальні CLI (лише аудіо)">
    Локальні CLI (якщо встановлені):

    - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny model)
    - `whisper` (Python CLI; автоматично завантажує моделі)

  </Step>
  <Step title="Gemini CLI">
    `gemini` з `read_many_files`.
  </Step>
  <Step title="Автентифікація провайдера">
    - Налаштовані записи `models.providers.*`, які підтримують цю можливість, пробуються до вбудованого порядку резервування.
    - Провайдери конфігурації лише для зображень із моделлю, що підтримує зображення, автоматично реєструються для розуміння медіа, навіть якщо вони не є вбудованим плагіном постачальника.
    - Розуміння зображень Ollama доступне за явного вибору, наприклад через `agents.defaults.imageModel` або `openclaw infer image describe --model ollama/<vision-model>`.

    Вбудований порядок резервування:

    - Аудіо: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - Зображення: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Відео: Google → Qwen → Moonshot

  </Step>
</Steps>

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

<Note>
Визначення двійкових файлів виконується за принципом best-effort у macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI-модель із повним шляхом до команди.
</Note>

### Підтримка проксі-середовища (моделі provider)

Коли ввімкнено розуміння медіа **audio** та **video** на основі provider, OpenClaw враховує стандартні змінні середовища вихідного проксі для HTTP-викликів до провайдера:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Якщо жодні змінні середовища проксі не встановлені, розуміння медіа використовує прямий вихідний трафік. Якщо значення проксі некоректне, OpenClaw записує попередження в журнал і повертається до прямого отримання.

## Можливості (необов’язково)

Якщо ви встановите `capabilities`, запис виконуватиметься лише для цих типів медіа. Для спільних списків OpenClaw може вивести типові значення:

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
- Будь-який каталог `models.providers.<id>.models[]` із моделлю, що підтримує зображення: **image**

Для записів CLI **явно задавайте `capabilities`**, щоб уникнути неочікуваних збігів. Якщо ви не вкажете `capabilities`, запис придатний для списку, у якому він знаходиться.

## Матриця підтримки provider (інтеграції OpenClaw)

| Можливість | Інтеграція provider                                                                                                          | Примітки                                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Зображення | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Плагіни постачальників реєструють підтримку зображень; `openai-codex/*` використовує механіку OAuth-провайдера; `codex/*` використовує обмежений хід Codex app-server; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; config providers із підтримкою зображень реєструються автоматично. |
| Аудіо      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Транскрибування через provider (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                            |
| Відео      | Google, Qwen, Moonshot                                                                                                       | Розуміння відео через provider за допомогою плагінів постачальників; розуміння відео Qwen використовує стандартні кінцеві точки DashScope.                                                                                             |

<Note>
**Примітка щодо MiniMax**

- Розуміння зображень `minimax` і `minimax-portal` походить від провайдера медіа `MiniMax-VL-01`, що належить плагіну.
- Вбудований текстовий каталог MiniMax усе ще починається як лише текстовий; явні записи `models.providers.minimax` матеріалізують чат-посилання M2.7 із підтримкою зображень.
  </Note>

## Рекомендації щодо вибору моделі

- Віддавайте перевагу найсильнішій доступній моделі останнього покоління для кожної медіаможливості, коли важливі якість і безпека.
- Для агентів з увімкненими інструментами, що обробляють недовірені вхідні дані, уникайте старіших/слабших медіамоделей.
- Зберігайте принаймні один резервний варіант на можливість для доступності (якісна модель + швидша/дешевша модель).
- Резервні варіанти CLI (`whisper-cli`, `whisper`, `gemini`) корисні, коли API провайдерів недоступні.
- Примітка щодо `parakeet-mlx`: з `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не вказаний); формати, відмінні від `txt`, повертаються до stdout.

## Політика вкладень

Параметр `attachments` для окремої можливості керує тим, які вкладення обробляються:

<ParamField path="mode" type='"first" | "all"' default="first">
  Чи обробляти перше вибране вкладення або всі.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Обмежує кількість оброблених вкладень.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Перевага вибору серед кандидатів на вкладення.
</ParamField>

Коли `mode: "all"`, результати позначаються як `[Image 1/2]`, `[Audio 2/2]` тощо.

<AccordionGroup>
  <Accordion title="Поведінка вилучення тексту з файлових вкладень">
    - Вилучений текст файла обгортається як **недовірений зовнішній вміст** перед додаванням до запиту медіа.
    - Вставлений блок використовує явні маркери меж, такі як `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить рядок метаданих `Source: External`.
    - Цей шлях вилучення з вкладень навмисно не містить довгий банер `SECURITY NOTICE:`, щоб уникнути роздуття запиту медіа; маркери меж і метадані при цьому зберігаються.
    - Якщо файл не має тексту, який можна вилучити, OpenClaw вставляє `[No extractable text]`.
    - Якщо PDF у цьому шляху повертається до відрендерених зображень сторінок, запит медіа зберігає заповнювач `[PDF content rendered to images; images not forwarded to model]`, оскільки цей крок вилучення з вкладень передає текстові блоки, а не відрендерені зображення PDF.
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
  <Tab title="Мультимодальний одиночний запис">
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

Коли розуміння медіа виконується, `/status` містить короткий підсумковий рядок:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Це показує результати для кожної можливості та вибрані provider/model, коли це застосовно.

## Примітки

- Розуміння виконується за принципом **best-effort**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнене.
- Використовуйте `scope`, щоб обмежити, де запускається розуміння (наприклад, лише в приватних повідомленнях).

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
