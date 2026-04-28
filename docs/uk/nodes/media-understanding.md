---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідних аудіо/відео/зображень
sidebarTitle: Media understanding
summary: Розуміння вхідних зображень/аудіо/відео (необов’язково) з резервними варіантами провайдера + CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-04-28T11:17:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 907cb0c84f7f0ab916ec07f65dcdffcf4f3c280a5c84ae1bc6fdf758d57545dd
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw може **підсумовувати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично виявляє, коли доступні локальні інструменти або ключі провайдерів, і його можна вимкнути або налаштувати. Якщо розуміння вимкнене, моделі все одно отримують оригінальні файли/URL як зазвичай.

Поведінка медіа, специфічна для постачальників, реєструється Plugin-ами постачальників, тоді як ядро OpenClaw відповідає за спільну конфігурацію `tools.media`, порядок резервного fallback та інтеграцію з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо перетравлювати вхідні медіа в короткий текст для швидшої маршрутизації + кращого розбору команд.
- Зберігати доставку оригінальних медіа до моделі (завжди).
- Підтримувати **API провайдерів** і **CLI fallback-и**.
- Дозволяти кілька моделей з упорядкованим fallback (помилка/розмір/тайм-аут).

## Загальна поведінка

<Steps>
  <Step title="Зібрати вкладення">
    Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Вибрати для кожної можливості">
    Для кожної ввімкненої можливості (зображення/аудіо/відео) вибрати вкладення за політикою (типово: **перше**).
  </Step>
  <Step title="Вибрати модель">
    Вибрати перший придатний запис моделі (розмір + можливість + auth).
  </Step>
  <Step title="Fallback у разі помилки">
    Якщо модель дає збій або медіа завелике, **перейти до наступного запису**.
  </Step>
  <Step title="Застосувати блок успіху">
    У разі успіху:

    - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
    - Аудіо задає `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є, інакше транскрипт.
    - Підписи зберігаються як `User text:` всередині блоку.

  </Step>
</Steps>

Якщо розуміння не вдається або вимкнене, **потік відповіді продовжується** з оригінальним тілом + вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі** плюс перевизначення для окремих можливостей:

<AccordionGroup>
  <Accordion title="Ключі верхнього рівня">
    - `tools.media.models`: список спільних моделей (використовуйте `capabilities` для обмеження).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - перевизначення провайдера (`baseUrl`, `headers`, `providerOptions`)
      - аудіопараметри Deepgram через `tools.media.audio.providerOptions.deepgram`
      - керування відлунням аудіотранскрипта (`echoTranscript`, типово `false`; `echoFormat`)
      - необов’язковий **список `models` для окремої можливості** (має пріоритет перед спільними моделями)
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

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для зображення/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановите ліміт)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

<AccordionGroup>
  <Accordion title="Правила">
    - Якщо медіа перевищує `maxBytes`, цю модель пропускають і **пробують наступну модель**.
    - Аудіофайли менші за **1024 байти** вважаються порожніми/пошкодженими й пропускаються перед транскрибуванням провайдером/CLI; вхідний контекст відповіді отримує детермінований транскрипт-заповнювач, щоб агент знав, що нотатка була замалою.
    - Якщо модель повертає більше ніж `maxChars`, вивід обрізається.
    - `prompt` типово є простим "Describe the {media}." плюс настанова щодо `maxChars` (лише зображення/відео).
    - Якщо активна основна модель зображень уже нативно підтримує vision, OpenClaw пропускає підсумковий блок `[Image]` і натомість передає оригінальне зображення в модель.
    - Якщо основна модель Gateway/WebChat є лише текстовою, вкладення зображень зберігаються як винесені refs `media://inbound/*`, щоб інструменти зображень/PDF або налаштована модель зображень усе ще могли їх перевірити, а не втратити вкладення.
    - Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони запускають цей провайдер/модель із підтримкою зображень напряму, включно з refs Ollama, як-от `ollama/qwen2.5vl:7b`.
    - Якщо `<capability>.enabled: true`, але моделі не налаштовано, OpenClaw пробує **активну модель відповіді**, коли її провайдер підтримує цю можливість.

  </Accordion>
</AccordionGroup>

### Автовиявлення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не налаштували моделі, OpenClaw автовиявляє в такому порядку й **зупиняється на першому робочому варіанті**:

<Steps>
  <Step title="Активна модель відповіді">
    Активна модель відповіді, коли її провайдер підтримує цю можливість.
  </Step>
  <Step title="agents.defaults.imageModel">
    Основні/fallback refs `agents.defaults.imageModel` (лише зображення).
    Надавайте перевагу refs `provider/model`. Голі refs уточнюються з налаштованих записів моделей провайдера з підтримкою зображень лише тоді, коли збіг унікальний.
  </Step>
  <Step title="Локальні CLI (лише аудіо)">
    Локальні CLI (якщо встановлено):

    - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
    - `whisper` (Python CLI; завантажує моделі автоматично)

  </Step>
  <Step title="Gemini CLI">
    `gemini` із використанням `read_many_files`.
  </Step>
  <Step title="Auth провайдера">
    - Налаштовані записи `models.providers.*`, які підтримують можливість, пробуються перед вбудованим порядком fallback.
    - Провайдери конфігурації лише для зображень із моделлю, що підтримує зображення, автоматично реєструються для розуміння медіа, навіть якщо вони не є вбудованим Plugin постачальника.
    - Розуміння зображень Ollama доступне, коли вибране явно, наприклад через `agents.defaults.imageModel` або `openclaw infer image describe --model ollama/<vision-model>`.

    Вбудований порядок fallback:

    - Аудіо: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - Зображення: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Відео: Google → Qwen → Moonshot

  </Step>
</Steps>

Щоб вимкнути автовиявлення, задайте:

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
Бінарне виявлення є best-effort у macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI-модель з повним шляхом команди.
</Note>

### Підтримка proxy-середовища (моделі провайдерів)

Коли ввімкнене медіарозуміння **аудіо** та **відео** на основі провайдерів, OpenClaw враховує стандартні змінні середовища вихідного proxy для HTTP-викликів провайдера:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Якщо env vars proxy не задані, медіарозуміння використовує прямий вихід. Якщо значення proxy має неправильний формат, OpenClaw записує попередження в журнал і повертається до прямого fetch.

## Можливості (необов’язково)

Якщо ви задаєте `capabilities`, запис запускається лише для цих типів медіа. Для спільних списків OpenClaw може вивести типові значення:

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

Для записів CLI **задавайте `capabilities` явно**, щоб уникнути неочікуваних збігів. Якщо ви пропускаєте `capabilities`, запис є придатним для списку, в якому він з’являється.

## Матриця підтримки провайдерів (інтеграції OpenClaw)

| Можливість | Інтеграція провайдера                                                                                                         | Примітки                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Зображення      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, провайдери конфігурації | Plugin-и постачальників реєструють підтримку зображень; `openai-codex/*` використовує OAuth-підключення провайдера; `codex/*` використовує обмежений turn Codex app-server; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; провайдери конфігурації з підтримкою зображень реєструються автоматично. |
| Аудіо      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Транскрибування провайдером (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                    |
| Відео      | Google, Qwen, Moonshot                                                                                                       | Розуміння відео провайдером через Plugin-и постачальників; розуміння відео Qwen використовує Standard DashScope endpoints.                                                                                                                        |

<Note>
**Примітка MiniMax**

- Розуміння зображень `minimax` і `minimax-portal` походить від медіапровайдера `MiniMax-VL-01`, яким володіє Plugin.
- Вбудований текстовий каталог MiniMax усе ще починається як text-only; явні записи `models.providers.minimax` матеріалізують refs чату M2.7 з підтримкою зображень.

</Note>

## Поради щодо вибору моделі

- Надавайте перевагу найсильнішій доступній моделі останнього покоління для кожної медіаможливості, коли якість і безпека мають значення.
- Для агентів із увімкненими інструментами, які обробляють недовірені вхідні дані, уникайте старіших/слабших медіамоделей.
- Тримайте принаймні один fallback для кожної можливості задля доступності (якісна модель + швидша/дешевша модель).
- CLI fallback-и (`whisper-cli`, `whisper`, `gemini`) корисні, коли API провайдерів недоступні.
- Примітка `parakeet-mlx`: з `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу `txt` (або не вказаний); формати не `txt` повертаються до stdout.

## Політика вкладень

`attachments` для кожної можливості керує тим, які вкладення обробляються:

<ParamField path="mode" type='"first" | "all"' default="first">
  Чи обробляти перше вибране вкладення, чи всі вкладення.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Обмеження кількості оброблюваних вкладень.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Пріоритет вибору серед кандидатних вкладень.
</ParamField>

Коли `mode: "all"`, вихідні дані позначаються `[Image 1/2]`, `[Audio 2/2]` тощо.

<AccordionGroup>
  <Accordion title="Поведінка витягнення файлових вкладень">
    - Витягнутий текст файлу обгортається як **ненадійний зовнішній вміст**, перш ніж його буде додано до медіапромпта.
    - Вставлений блок використовує явні маркери меж на кшталт `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` і містить рядок метаданих `Source: External`.
    - Цей шлях витягнення вкладень навмисно пропускає довгий банер `SECURITY NOTICE:`, щоб не роздувати медіапромпт; маркери меж і метадані все одно залишаються.
    - Якщо файл не має тексту, який можна витягнути, OpenClaw вставляє `[No extractable text]`.
    - Якщо PDF у цьому шляху переходить до резервного варіанта з відрендереними зображеннями сторінок, медіапромпт зберігає заповнювач `[PDF content rendered to images; images not forwarded to model]`, оскільки цей крок витягнення вкладень передає текстові блоки, а не відрендерені зображення PDF.

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

Коли працює розуміння медіа, `/status` містить короткий рядок підсумку:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Це показує результати для кожної можливості та вибраного провайдера/модель, коли це застосовно.

## Примітки

- Розуміння виконується **за принципом найкращих зусиль**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнено.
- Використовуйте `scope`, щоб обмежити, де виконується розуміння (наприклад, лише в особистих повідомленнях).

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
