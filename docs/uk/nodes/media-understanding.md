---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідного аудіо, відео та зображень
sidebarTitle: Media understanding
summary: Розуміння вхідних зображень/аудіо/відео (необов’язково) з резервними варіантами через провайдера та CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-06-28T05:08:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw може **узагальнювати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично визначає, коли доступні локальні інструменти або ключі постачальників, і це можна вимкнути або налаштувати. Якщо розуміння вимкнено, моделі, як зазвичай, усе одно отримують початкові файли/URL-адреси.

Поведінку медіа, специфічну для постачальника, реєструють Plugin постачальників, тоді як ядро OpenClaw відповідає за спільну конфігурацію `tools.media`, порядок fallback і інтеграцію з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо стискати вхідні медіа в короткий текст для швидшої маршрутизації та кращого розбору команд.
- Зберігати доставлення початкових медіа до моделі (завжди).
- Підтримувати **API постачальників** і **CLI fallback**.
- Дозволяти кілька моделей з упорядкованим fallback (помилка/розмір/timeout).

## Високорівнева поведінка

<Steps>
  <Step title="Collect attachments">
    Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Select per-capability">
    Для кожної ввімкненої capability (зображення/аудіо/відео) вибрати вкладення за політикою (типово: **перше**).
  </Step>
  <Step title="Choose model">
    Вибрати перший придатний запис моделі (розмір + capability + автентифікація).
  </Step>
  <Step title="Fallback on failure">
    Якщо модель зазнає помилки або медіа завелике, **перейти до наступного запису fallback**.
  </Step>
  <Step title="Apply success block">
    У разі успіху:

    - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
    - Аудіо встановлює `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є, інакше транскрипт.
    - Підписи зберігаються як `User text:` усередині блока.

  </Step>
</Steps>

Якщо розуміння не вдається або його вимкнено, **потік відповіді продовжується** з початковим тілом і вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі** та перевизначення для окремих capability:

<AccordionGroup>
  <Accordion title="Top-level keys">
    - `tools.media.models`: список спільних моделей (використовуйте `capabilities` для обмеження).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - перевизначення постачальника (`baseUrl`, `headers`, `providerOptions`)
      - аудіопараметри Deepgram через `tools.media.audio.providerOptions.deepgram`
      - керування відлунням аудіотранскрипту (`echoTranscript`, типово `false`; `echoFormat`)
      - необов’язковий **список `models` для окремої capability** (має пріоритет перед спільними моделями)
      - політика `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (необов’язкове обмеження за channel/chatType/session key)
    - `tools.media.concurrency`: максимальна кількість одночасних запусків capability (типово **2**).

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

Кожен запис `models[]` може бути **постачальником** або **CLI**:

<Tabs>
  <Tab title="Provider entry">
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
  <Tab title="CLI entry">
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
    - `{{OutputBase}}` (базовий шлях scratch-файлу, без розширення)

  </Tab>
</Tabs>

### Облікові дані постачальника (`apiKey`)

Розуміння медіа постачальником використовує те саме визначення автентифікації постачальника, що й звичайні
виклики моделей: профілі автентифікації, змінні середовища, а потім
`models.providers.<providerId>.apiKey`.

Записи `tools.media.*.models[]` не приймають inline-поле `apiKey`. Значення
`provider` у записі медіамоделі, наприклад `openai` або `moonshot`, повинно
мати доступні облікові дані через одне зі стандартних джерел автентифікації постачальника.

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

Повний довідник з автентифікації постачальників, включно з профілями, змінними середовища
та власними базовими URL-адресами, див. у [Інструменти та власні постачальники](/uk/gateway/config-tools).

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для зображення/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановите обмеження)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

<AccordionGroup>
  <Accordion title="Rules">
    - Якщо медіа перевищує `maxBytes`, цю модель пропускають і **пробують наступну модель**.
    - Аудіофайли, менші за **1024 байти**, вважаються порожніми/пошкодженими й пропускаються до транскрипції постачальником/CLI; вхідний контекст відповіді отримує детермінований placeholder-транскрипт, щоб агент знав, що нотатка була замалою.
    - Якщо модель повертає більше ніж `maxChars`, результат обрізається.
    - `prompt` типово дорівнює простому "Describe the {media}." плюс вказівка `maxChars` (лише зображення/відео).
    - Якщо активна основна модель зображень уже нативно підтримує vision, OpenClaw пропускає блок зведення `[Image]` і натомість передає початкове зображення в модель.
    - Якщо основна модель Gateway/WebChat підтримує лише текст, вкладення зображень зберігаються як вивантажені посилання `media://inbound/*`, щоб інструменти зображень/PDF або налаштована модель зображень усе ще могли їх переглянути замість втрати вкладення.
    - Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони запускають цей provider/model із підтримкою зображень напряму, включно з посиланнями Ollama, такими як `ollama/qwen2.5vl:7b`.
    - Якщо `<capability>.enabled: true`, але моделі не налаштовані, OpenClaw пробує **активну модель відповіді**, коли її постачальник підтримує цю capability.

  </Accordion>
</AccordionGroup>

### Автовиявлення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не налаштували моделі, OpenClaw автоматично визначає в такому порядку та **зупиняється на першому робочому варіанті**:

<Steps>
  <Step title="Active reply model">
    Активна модель відповіді, коли її постачальник підтримує цю capability.
  </Step>
  <Step title="agents.defaults.imageModel">
    Основні/fallback посилання `agents.defaults.imageModel` (лише зображення).
    Надавайте перевагу посиланням `provider/model`. Голі посилання уточнюються з налаштованих записів моделей постачальників із підтримкою зображень лише тоді, коли збіг унікальний.
  </Step>
  <Step title="Local CLIs (audio only)">
    Локальні CLI (якщо встановлені):

    - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
    - `whisper` (Python CLI; автоматично завантажує моделі)

  </Step>
  <Step title="Gemini CLI">
    `gemini` з використанням `read_many_files`.
  </Step>
  <Step title="Provider auth">
    - Налаштовані записи `models.providers.*`, що підтримують capability, пробуються перед вбудованим порядком fallback.
    - Постачальники конфігурації лише для зображень із моделлю, що підтримує зображення, автоматично реєструються для розуміння медіа, навіть якщо вони не є вбудованим Plugin постачальника.
    - Розуміння зображень Ollama доступне, коли вибране явно, наприклад через `agents.defaults.imageModel` або `openclaw infer image describe --model ollama/<vision-model>`.

    Вбудований порядок fallback:

    - Аудіо: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - Зображення: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Відео: Google → Qwen → Moonshot

  </Step>
</Steps>

Щоб вимкнути автовиявлення, встановіть:

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
Бінарне виявлення працює best-effort у macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI-модель із повним шляхом команди.
</Note>

### Підтримка proxy-середовища (моделі постачальників)

Коли ввімкнене розуміння медіа **аудіо** та **відео** на основі постачальника, OpenClaw враховує стандартні змінні середовища outbound proxy для HTTP-викликів постачальника:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Якщо proxy-змінні середовища не задано, розуміння медіа використовує прямий egress. Якщо значення proxy некоректне, OpenClaw записує попередження в лог і повертається до прямого fetch.

## Capabilities (необов’язково)

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

Для записів CLI **задавайте `capabilities` явно**, щоб уникнути несподіваних збігів. Якщо пропустити `capabilities`, запис придатний для списку, у якому він з’являється.

## Матриця підтримки постачальників (інтеграції OpenClaw)

| Capability | Інтеграція постачальника                                                                                                         | Примітки                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Зображення      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, постачальники конфігурації | Plugin постачальників реєструють підтримку зображень; `openai/*` може використовувати маршрутизацію API-key або Codex OAuth; `codex/*` використовує обмежений хід Codex app-server; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; постачальники конфігурації з підтримкою зображень реєструються автоматично. |
| Аудіо      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Транскрипція постачальником (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| Відео      | Google, Qwen, Moonshot                                                                                                       | Розуміння відео постачальником через Plugin постачальників; розуміння відео Qwen використовує endpoint-и Standard DashScope.                                                                                                                            |

<Note>
**Примітка про MiniMax**

- Розуміння зображень для `minimax`, `minimax-cn`, `minimax-portal` і `minimax-portal-cn` забезпечує медіапровайдер `MiniMax-VL-01`, що належить Plugin.
- Автоматична маршрутизація зображень і надалі використовує `MiniMax-VL-01`, навіть якщо застарілі метадані чату MiniMax M2.x заявляють підтримку введення зображень.

</Note>

## Рекомендації щодо вибору моделі

- Надавайте перевагу найсильнішій доступній моделі останнього покоління для кожної медіаможливості, коли якість і безпека мають значення.
- Для агентів з увімкненими інструментами, які обробляють ненадійні вхідні дані, уникайте старіших або слабших медіамоделей.
- Тримайте щонайменше один резервний варіант для кожної можливості, щоб забезпечити доступність (якісна модель + швидша/дешевша модель).
- Резервні CLI-варіанти (`whisper-cli`, `whisper`, `gemini`) корисні, коли API провайдерів недоступні.
- Примітка щодо `parakeet-mlx`: з `--output-dir` OpenClaw зчитує `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не вказаний); формати, відмінні від `txt`, повертаються до stdout.

## Політика вкладень

`attachments` для кожної можливості керує тим, які вкладення обробляються:

<ParamField path="mode" type='"first" | "all"' default="first">
  Чи обробляти перше вибране вкладення, чи всі.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Обмежує кількість оброблених вкладень.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Перевага вибору серед кандидатних вкладень.
</ParamField>

Коли `mode: "all"`, результати позначаються `[Image 1/2]`, `[Audio 2/2]` тощо.

<AccordionGroup>
  <Accordion title="Поведінка витягування файлових вкладень">
    - Витягнутий текст файлу обгортається як **ненадійний зовнішній вміст** перед додаванням до медіапромпта.
    - Вставлений блок використовує явні маркери меж на кшталт `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` і містить рядок метаданих `Source: External`.
    - Цей шлях витягування вкладень навмисно пропускає довгий банер `SECURITY NOTICE:`, щоб не роздувати медіапромпт; маркери меж і метадані все одно залишаються.
    - Якщо файл не має тексту, який можна витягнути, OpenClaw вставляє `[No extractable text]`.
    - Якщо PDF у цьому шляху повертається до відрендерених зображень сторінок, OpenClaw передає ці зображення сторінок моделям відповіді з підтримкою зору й залишає заповнювач `[PDF content rendered to images]` у файловому блоці.

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

Коли працює розуміння медіа, `/status` містить короткий рядок зведення:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Він показує результати для кожної можливості та вибраного провайдера/модель, коли це застосовно.

## Примітки

- Розуміння працює за принципом **найкращої спроби**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнено.
- Використовуйте `scope`, щоб обмежити, де запускається розуміння (наприклад, лише DM).

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
