---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідних аудіо/відео/зображень
sidebarTitle: Media understanding
summary: Розуміння вхідних зображень/аудіо/відео (необов’язково) з резервними варіантами через провайдера та CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-05-12T08:45:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d58141ac1591890a4eb2c5cdcbc1bf19727fb0c3a1d4d0a912c6bb19d3f3592
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw може **підсумовувати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично виявляє, коли доступні локальні інструменти або ключі провайдера, і це можна вимкнути або налаштувати. Якщо розуміння вимкнено, моделі, як зазвичай, усе одно отримують оригінальні файли/URL.

Поведінка медіа, специфічна для постачальника, реєструється plugins постачальників, тоді як ядро OpenClaw відповідає за спільну конфігурацію `tools.media`, порядок резервних варіантів та інтеграцію з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо стискати вхідні медіа в короткий текст для швидшої маршрутизації + кращого розбору команд.
- Зберігати доставку оригінальних медіа до моделі (завжди).
- Підтримувати **API провайдерів** і **резервні варіанти CLI**.
- Дозволяти кілька моделей з упорядкованим резервуванням (помилка/розмір/тайм-аут).

## Високорівнева поведінка

<Steps>
  <Step title="Зібрати вкладення">
    Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Вибрати для кожної можливості">
    Для кожної ввімкненої можливості (зображення/аудіо/відео) вибрати вкладення за політикою (типово: **перше**).
  </Step>
  <Step title="Вибрати модель">
    Вибрати перший придатний запис моделі (розмір + можливість + автентифікація).
  </Step>
  <Step title="Резервний варіант у разі збою">
    Якщо модель зазнає збою або медіа занадто велике, **перейти до наступного запису**.
  </Step>
  <Step title="Застосувати блок успіху">
    У разі успіху:

    - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
    - Аудіо встановлює `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є, інакше транскрипт.
    - Підписи зберігаються як `User text:` всередині блока.

  </Step>
</Steps>

Якщо розуміння не вдається або вимкнено, **потік відповіді продовжується** з оригінальним тілом + вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі** плюс перевизначення для кожної можливості:

<AccordionGroup>
  <Accordion title="Ключі верхнього рівня">
    - `tools.media.models`: список спільних моделей (використовуйте `capabilities` для обмеження).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - перевизначення провайдера (`baseUrl`, `headers`, `providerOptions`)
      - параметри аудіо Deepgram через `tools.media.audio.providerOptions.deepgram`
      - керування відлунням транскрипту аудіо (`echoTranscript`, типово `false`; `echoFormat`)
      - необов’язковий **список `models` для кожної можливості** (має пріоритет перед спільними моделями)
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
    - `{{OutputBase}}` (базовий шлях тимчасового файла, без розширення)

  </Tab>
</Tabs>

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для зображення/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановили ліміт)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

<AccordionGroup>
  <Accordion title="Правила">
    - Якщо медіа перевищує `maxBytes`, ця модель пропускається і **пробується наступна модель**.
    - Аудіофайли менші за **1024 байти** вважаються порожніми/пошкодженими й пропускаються до транскрипції через провайдера/CLI; контекст вхідної відповіді отримує детермінований транскрипт-заповнювач, щоб агент знав, що нотатка була занадто малою.
    - Якщо модель повертає більше ніж `maxChars`, вивід обрізається.
    - `prompt` типово задається як просте "Describe the {media}." плюс вказівка `maxChars` (лише зображення/відео).
    - Якщо активна основна модель зображень уже має нативну підтримку зору, OpenClaw пропускає підсумковий блок `[Image]` і натомість передає оригінальне зображення в модель.
    - Якщо основна модель Gateway/WebChat є лише текстовою, вкладення зображень зберігаються як винесені посилання `media://inbound/*`, щоб інструменти зображень/PDF або налаштована модель зображень усе ще могли їх перевірити замість втрати вкладення.
    - Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони запускають вказаний провайдер/модель із підтримкою зображень напряму, включно з посиланнями Ollama, як-от `ollama/qwen2.5vl:7b`.
    - Якщо `<capability>.enabled: true`, але моделі не налаштовані, OpenClaw пробує **активну модель відповіді**, коли її провайдер підтримує цю можливість.

  </Accordion>
</AccordionGroup>

### Автоматичне виявлення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не налаштували моделі, OpenClaw автоматично виявляє в такому порядку та **зупиняється на першому робочому варіанті**:

<Steps>
  <Step title="Активна модель відповіді">
    Активна модель відповіді, коли її провайдер підтримує цю можливість.
  </Step>
  <Step title="agents.defaults.imageModel">
    Основні/резервні посилання `agents.defaults.imageModel` (лише зображення).
    Надавайте перевагу посиланням `provider/model`. Голі посилання кваліфікуються з налаштованих записів моделей провайдерів із підтримкою зображень лише тоді, коли збіг унікальний.
  </Step>
  <Step title="Локальні CLI (лише аудіо)">
    Локальні CLI (якщо встановлено):

    - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny model)
    - `whisper` (Python CLI; завантажує моделі автоматично)

  </Step>
  <Step title="Gemini CLI">
    `gemini` з використанням `read_many_files`.
  </Step>
  <Step title="Автентифікація провайдера">
    - Налаштовані записи `models.providers.*`, які підтримують можливість, пробуються перед вбудованим порядком резервування.
    - Провайдери конфігурації лише для зображень із моделлю, що підтримує зображення, автоматично реєструються для розуміння медіа, навіть якщо вони не є вбудованим vendor plugin.
    - Розуміння зображень Ollama доступне, коли вибране явно, наприклад через `agents.defaults.imageModel` або `openclaw infer image describe --model ollama/<vision-model>`.

    Вбудований порядок резервування:

    - Аудіо: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - Зображення: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Відео: Google → Qwen → Moonshot

  </Step>
</Steps>

Щоб вимкнути автоматичне виявлення, задайте:

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
Виявлення бінарних файлів виконується за принципом найкращої спроби в macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну модель CLI з повним шляхом до команди.
</Note>

### Підтримка proxy-середовища (моделі провайдерів)

Коли ввімкнено розуміння медіа для **аудіо** та **відео** на основі провайдера, OpenClaw враховує стандартні змінні середовища вихідного proxy для HTTP-викликів провайдера:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Якщо змінні середовища proxy не задані, розуміння медіа використовує прямий вихід. Якщо значення proxy має неправильний формат, OpenClaw записує попередження в журнал і повертається до прямого отримання.

## Можливості (необов’язково)

Якщо ви задаєте `capabilities`, запис запускається лише для цих типів медіа. Для спільних списків OpenClaw може виводити типові значення:

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
- Будь-який каталог `models.providers.<id>.models[]` з моделлю, що підтримує зображення: **зображення**

Для записів CLI **задавайте `capabilities` явно**, щоб уникнути несподіваних збігів. Якщо ви пропустите `capabilities`, запис придатний для списку, у якому він з’являється.

## Матриця підтримки провайдерів (інтеграції OpenClaw)

| Можливість | Інтеграція провайдера                                                                                                        | Примітки                                                                                                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Зображення | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, провайдери конфігурації | Vendor plugins реєструють підтримку зображень; `openai-codex/*` використовує інфраструктуру OAuth-провайдера; `codex/*` використовує обмежений хід Codex app-server; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; провайдери конфігурації з підтримкою зображень автоматично реєструються. |
| Аудіо      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Транскрипція провайдера (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                   |
| Відео      | Google, Qwen, Moonshot                                                                                                       | Розуміння відео провайдером через vendor plugins; розуміння відео Qwen використовує стандартні кінцеві точки DashScope.                                                                                                                |

<Note>
**Примітка MiniMax**

- Розуміння зображень `minimax` і `minimax-portal` походить від медіапровайдера `MiniMax-VL-01`, яким володіє plugin.
- Вбудований текстовий каталог MiniMax усе ще починається як лише текстовий; явні записи `models.providers.minimax` матеріалізують чат-посилання M2.7 з підтримкою зображень.

</Note>

## Поради щодо вибору моделі

- Надавайте перевагу найсильнішій моделі останнього покоління, доступній для кожної можливості медіа, коли важливі якість і безпека.
- Для агентів із увімкненими інструментами, які обробляють ненадійні вхідні дані, уникайте старіших/слабших медіамоделей.
- Тримайте принаймні один резервний варіант для кожної можливості для доступності (якісна модель + швидша/дешевша модель).
- Резервні варіанти CLI (`whisper-cli`, `whisper`, `gemini`) корисні, коли API провайдерів недоступні.
- Примітка `parakeet-mlx`: з `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не вказаний); формати не `txt` повертаються до stdout.

## Політика вкладень

`attachments` для кожної можливості керує тим, які вкладення обробляються:

<ParamField path="mode" type='"first" | "all"' default="first">
  Чи обробляти перше вибране вкладення, чи всі вибрані вкладення.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Обмежує кількість оброблюваних вкладень.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Перевага вибору серед кандидатних вкладень.
</ParamField>

Коли `mode: "all"`, вихідні дані позначаються як `[Image 1/2]`, `[Audio 2/2]` тощо.

<AccordionGroup>
  <Accordion title="Поведінка витягування файлових вкладень">
    - Витягнутий текст файлу обгортається як **ненадійний зовнішній вміст** перед додаванням до медіазапиту.
    - Вставлений блок використовує явні маркери меж на кшталт `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` і містить рядок метаданих `Source: External`.
    - Цей шлях витягування вкладень навмисно не додає довгий банер `SECURITY NOTICE:`, щоб не роздувати медіазапит; маркери меж і метадані все одно залишаються.
    - Якщо файл не має тексту, який можна витягнути, OpenClaw вставляє `[No extractable text]`.
    - Якщо PDF у цьому шляху переходить до резервного варіанта з рендереними зображеннями сторінок, медіазапит зберігає заповнювач `[PDF content rendered to images; images not forwarded to model]`, оскільки цей крок витягування вкладень передає текстові блоки, а не рендерені зображення PDF.

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
  <Tab title="Один мультимодальний запис">
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

Коли виконується розуміння медіа, `/status` містить короткий підсумковий рядок:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Це показує результати для кожної можливості та вибраного постачальника/модель, коли застосовно.

## Примітки

- Розуміння виконується за принципом **найкращого зусилля**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнено.
- Використовуйте `scope`, щоб обмежити місця, де запускається розуміння (наприклад, лише DM).

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
