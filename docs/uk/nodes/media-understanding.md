---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідних аудіо, відео та зображень
sidebarTitle: Media understanding
summary: Розуміння вхідних зображень/аудіо/відео (необов’язково) з резервними варіантами провайдера + CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-06-27T17:44:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4724578632b0210290d1b32077d2c0ccf7fdfa6b96160f76bf3eff591df7b92e
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw може **узагальнювати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично визначає, коли доступні локальні інструменти або ключі провайдерів, і його можна вимкнути або налаштувати. Якщо розуміння вимкнене, моделі все одно отримують оригінальні файли/URL, як зазвичай.

Поведінка медіа, специфічна для постачальника, реєструється Plugin постачальників, тоді як ядро OpenClaw відповідає за спільну конфігурацію `tools.media`, порядок резервного переходу та інтеграцію з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо перетворювати вхідні медіа на короткий текст для швидшої маршрутизації + кращого розбору команд.
- Зберігати доставку оригінальних медіа до моделі (завжди).
- Підтримувати **API провайдерів** і **резервні варіанти CLI**.
- Дозволяти кілька моделей із впорядкованим резервним переходом (помилка/розмір/тайм-аут).

## Високорівнева поведінка

<Steps>
  <Step title="Зібрати вкладення">
    Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Вибрати за можливістю">
    Для кожної ввімкненої можливості (зображення/аудіо/відео) вибрати вкладення за політикою (типово: **перше**).
  </Step>
  <Step title="Вибрати модель">
    Вибрати перший придатний запис моделі (розмір + можливість + автентифікація).
  </Step>
  <Step title="Резервний перехід у разі збою">
    Якщо модель дає збій або медіа завелике, **перейти до наступного запису**.
  </Step>
  <Step title="Застосувати блок успіху">
    У разі успіху:

    - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
    - Аудіо встановлює `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є, інакше транскрипт.
    - Підписи зберігаються як `User text:` усередині блока.

  </Step>
</Steps>

Якщо розуміння не вдається або його вимкнено, **потік відповіді продовжується** з оригінальним тілом + вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі** та перевизначення для окремих можливостей:

<AccordionGroup>
  <Accordion title="Ключі верхнього рівня">
    - `tools.media.models`: спільний список моделей (використовуйте `capabilities` для обмеження).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - перевизначення провайдера (`baseUrl`, `headers`, `providerOptions`)
      - параметри аудіо Deepgram через `tools.media.audio.providerOptions.deepgram`
      - керування відлунням транскрипту аудіо (`echoTranscript`, типово `false`; `echoFormat`)
      - необов’язковий **список `models` для окремої можливості** (має перевагу над спільними моделями)
      - політика `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (необов’язкове обмеження за каналом/chatType/ключем сесії)
    - `tools.media.concurrency`: максимум одночасних запусків можливостей (типово **2**).

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

Кожен запис `models[]` може бути **провайдером** або **CLI**:

<Tabs>
  <Tab title="Запис провайдера">
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
    - `{{OutputBase}}` (базовий шлях тимчасового файлу, без розширення)

  </Tab>
</Tabs>

### Облікові дані провайдера (`apiKey`)

Розуміння медіа провайдером використовує той самий механізм визначення автентифікації провайдера, що й звичайні
виклики моделі: профілі автентифікації, змінні середовища, потім
`models.providers.<providerId>.apiKey`.

Записи `tools.media.*.models[]` не приймають вбудоване поле `apiKey`. Значення
`provider` у записі моделі медіа, як-от `openai` або `moonshot`, повинно
мати доступні облікові дані через одне зі стандартних джерел автентифікації провайдера.

Мінімальний приклад:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Повну довідку з автентифікації провайдерів, включно з профілями, змінними середовища
та користувацькими базовими URL, див. у [Інструменти та користувацькі провайдери](/uk/gateway/config-tools).

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для зображення/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановите обмеження)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

<AccordionGroup>
  <Accordion title="Правила">
    - Якщо медіа перевищує `maxBytes`, цю модель пропускають і **пробують наступну модель**.
    - Аудіофайли менші за **1024 байти** вважаються порожніми/пошкодженими та пропускаються перед транскрипцією провайдером/CLI; контекст вхідної відповіді отримує детермінований транскрипт-заповнювач, щоб агент знав, що нотатка була замалою.
    - Якщо модель повертає більше ніж `maxChars`, вивід обрізається.
    - `prompt` типово має просте "Describe the {media}." плюс вказівку `maxChars` (лише зображення/відео).
    - Якщо активна основна модель зображень уже нативно підтримує зір, OpenClaw пропускає блок узагальнення `[Image]` і натомість передає оригінальне зображення в модель.
    - Якщо основна модель Gateway/WebChat підтримує лише текст, вкладення зображень зберігаються як вивантажені посилання `media://inbound/*`, щоб інструменти зображень/PDF або налаштована модель зображень усе ще могли їх перевірити, замість втрати вкладення.
    - Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони запускають цей провайдер/модель із підтримкою зображень напряму, включно з посиланнями Ollama, як-от `ollama/qwen2.5vl:7b`.
    - Якщо `<capability>.enabled: true`, але моделі не налаштовані, OpenClaw пробує **активну модель відповіді**, коли її провайдер підтримує цю можливість.

  </Accordion>
</AccordionGroup>

### Автовизначення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не налаштували моделі, OpenClaw автоматично визначає в такому порядку та **зупиняється на першому робочому варіанті**:

<Steps>
  <Step title="Активна модель відповіді">
    Активна модель відповіді, коли її провайдер підтримує цю можливість.
  </Step>
  <Step title="agents.defaults.imageModel">
    Основні/резервні посилання `agents.defaults.imageModel` (лише зображення).
    Надавайте перевагу посиланням `provider/model`. Голі посилання уточнюються з налаштованих записів моделей провайдера з підтримкою зображень лише тоді, коли збіг унікальний.
  </Step>
  <Step title="Локальні CLI (лише аудіо)">
    Локальні CLI (якщо встановлені):

    - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
    - `whisper` (Python CLI; завантажує моделі автоматично)

  </Step>
  <Step title="Gemini CLI">
    `gemini` з використанням `read_many_files`.
  </Step>
  <Step title="Автентифікація провайдера">
    - Налаштовані записи `models.providers.*`, які підтримують можливість, пробуються перед вбудованим порядком резервного переходу.
    - Провайдери конфігурації лише для зображень із моделлю, здатною обробляти зображення, автоматично реєструються для розуміння медіа, навіть якщо вони не є вбудованим Plugin постачальника.
    - Розуміння зображень Ollama доступне, коли його вибрано явно, наприклад через `agents.defaults.imageModel` або `openclaw infer image describe --model ollama/<vision-model>`.

    Вбудований порядок резервного переходу:

    - Аудіо: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
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
Виявлення бінарних файлів виконується за принципом найкращої спроби в macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну модель CLI з повним шляхом команди.
</Note>

### Підтримка середовища проксі (моделі провайдера)

Коли ввімкнено розуміння медіа **аудіо** та **відео** на основі провайдера, OpenClaw враховує стандартні змінні середовища вихідного проксі для HTTP-викликів провайдера:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Якщо змінні середовища проксі не задані, розуміння медіа використовує прямий вихід. Якщо значення проксі має неправильний формат, OpenClaw записує попередження в журнал і повертається до прямого отримання.

## Можливості (необов’язково)

Якщо ви задаєте `capabilities`, запис запускається лише для цих типів медіа. Для спільних списків OpenClaw може визначати типові значення:

- `openai`, `anthropic`, `minimax`: **зображення**
- `minimax-portal`: **зображення**
- `moonshot`: **зображення + відео**
- `openrouter`: **зображення + аудіо**
- `google` (Gemini API): **зображення + аудіо + відео**
- `qwen`: **зображення + відео**
- `mistral`: **аудіо**
- `zai`: **зображення**
- `groq`: **аудіо**
- `xai`: **аудіо**
- `deepgram`: **аудіо**
- Будь-який каталог `models.providers.<id>.models[]` з моделлю, здатною обробляти зображення: **зображення**

Для записів CLI **задавайте `capabilities` явно**, щоб уникнути неочікуваних збігів. Якщо ви пропустите `capabilities`, запис придатний для списку, у якому він з’являється.

## Матриця підтримки можливостей (інтеграції OpenClaw)

| Можливість | Інтеграція провайдера                                                                                                        | Примітки                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Зображення | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, провайдери конфігурації | Plugin постачальників реєструють підтримку зображень; `openai/*` може використовувати маршрутизацію API-ключа або Codex OAuth; `codex/*` використовує обмежений хід Codex app-server; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; провайдери конфігурації з підтримкою зображень реєструються автоматично. |
| Аудіо      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Транскрипція провайдером (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                      |
| Відео      | Google, Qwen, Moonshot                                                                                                       | Розуміння відео провайдером через Plugin постачальників; розуміння відео Qwen використовує стандартні кінцеві точки DashScope.                                                                                                             |

<Note>
**Примітка MiniMax**

- Розуміння зображень для `minimax`, `minimax-cn`, `minimax-portal` і `minimax-portal-cn` надходить від медіапровайдера `MiniMax-VL-01`, належного Plugin.
- Автоматична маршрутизація зображень і далі використовує `MiniMax-VL-01`, навіть якщо застарілі метадані чату MiniMax M2.x заявляють підтримку вводу зображень.

</Note>

## Рекомендації щодо вибору моделей

- Надавайте перевагу найсильнішій доступній моделі останнього покоління для кожної медіаможливості, коли важливі якість і безпека.
- Для агентів із підтримкою інструментів, які обробляють недовірені вхідні дані, уникайте старіших або слабших медіамоделей.
- Тримайте принаймні один резервний варіант для кожної можливості заради доступності (якісна модель + швидша/дешевша модель).
- Резервні варіанти CLI (`whisper-cli`, `whisper`, `gemini`) корисні, коли API провайдерів недоступні.
- Примітка щодо `parakeet-mlx`: з `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не вказаний); формати, відмінні від `txt`, повертаються до stdout.

## Політика вкладень

`attachments` для кожної можливості керує тим, які вкладення обробляються:

<ParamField path="mode" type='"first" | "all"' default="first">
  Чи обробляти перше вибране вкладення, чи всі.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Обмеження кількості оброблюваних вкладень.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Перевага вибору серед кандидатних вкладень.
</ParamField>

Коли `mode: "all"`, вихідні дані позначаються як `[Image 1/2]`, `[Audio 2/2]` тощо.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - Витягнутий текст файлу обгортається як **недовірений зовнішній вміст** перед додаванням до медіапромпта.
    - Вставлений блок використовує явні маркери меж, як-от `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить рядок метаданих `Source: External`.
    - Цей шлях витягування вкладень навмисно пропускає довгий банер `SECURITY NOTICE:`, щоб не роздувати медіапромпт; маркери меж і метадані все одно залишаються.
    - Якщо файл не має тексту, який можна витягнути, OpenClaw вставляє `[No extractable text]`.
    - Якщо PDF у цьому шляху повертається до відрендерених зображень сторінок, медіапромпт зберігає заповнювач `[PDF content rendered to images; images not forwarded to model]`, оскільки цей крок витягування вкладень передає текстові блоки, а не відрендерені зображення PDF.

  </Accordion>
</AccordionGroup>

## Приклади конфігурації

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Audio + video only">
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
  <Tab title="Image-only">
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
  <Tab title="Multi-modal single entry">
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

Коли розуміння медіа запускається, `/status` містить короткий підсумковий рядок:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Він показує результати для кожної можливості та вибраного провайдера/модель, коли застосовно.

## Примітки

- Розуміння виконується **за принципом найкращого зусилля**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнено.
- Використовуйте `scope`, щоб обмежити, де запускається розуміння (наприклад, лише в DM).

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
