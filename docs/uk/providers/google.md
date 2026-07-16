---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Потрібен ключ API або потік автентифікації OAuth
summary: Налаштування Google Gemini (ключ API + OAuth, генерування зображень, розуміння медіа, TTS, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-16T18:31:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe8a58044bea7ce2598da94787334af2bb4a2ff58872c62115697fa0079daf0a
    source_path: providers/google.md
    workflow: 16
---

Плагін Google надає доступ до моделей Gemini через Google AI Studio, а також генерування зображень, розпізнавання медіа (зображень/аудіо/відео), перетворення тексту на мовлення та вебпошук за допомогою Gemini Grounding.

- Постачальник: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Параметр середовища виконання: `agentRuntime.id: "google-gemini-cli"` повторно використовує OAuth Gemini CLI, зберігаючи канонічні посилання на моделі у вигляді `google/*`.

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключ API">
    **Найкраще підходить для:** стандартного доступу до Gemini API через Google AI Studio.

    <Steps>
      <Step title="Отримайте ключ API">
        Створіть безкоштовний ключ у [Google AI Studio](https://aistudio.google.com/apikey).
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Або передайте ключ безпосередньо:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Перевірте доступність моделі">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Приймаються як `GEMINI_API_KEY`, так і `GOOGLE_API_KEY`. Використовуйте той варіант, який уже налаштовано.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Найкраще підходить для:** входу за допомогою облікового запису Google через OAuth Gemini CLI замість використання окремого ключа API.

    <Warning>
    Постачальник `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
    повідомляють про обмеження облікових записів під час використання OAuth у такий спосіб. Використовуйте на власний ризик.
    </Warning>

    <Steps>
      <Step title="Установіть Gemini CLI">
        Локальна команда `gemini` має бути доступна в `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # або npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw підтримує як установлення через Homebrew, так і глобальне встановлення через npm, зокрема
        поширені структури каталогів Windows/npm.
      </Step>
      <Step title="Увійдіть через OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Перевірте доступність моделі">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Модель за замовчуванням: `google/gemini-3.1-pro-preview`
    - Середовище виконання: `google-gemini-cli`
    - Псевдонім: `gemini-cli`

    Ідентифікатор моделі Gemini API для Gemini 3.1 Pro — `gemini-3.1-pro-preview`. Для зручності OpenClaw приймає скорочений варіант `google/gemini-3.1-pro` як псевдонім і нормалізує його перед викликами постачальника.

    **Змінні середовища:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Якщо запити OAuth Gemini CLI завершуються невдало після входу, установіть `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway та повторіть спробу.
    </Note>

    <Note>
    Якщо вхід завершується невдало до запуску процесу в браузері, переконайтеся, що локальну команду `gemini`
    установлено й вона доступна в `PATH`.
    </Note>

    Автоматичне виявлення під час початкового налаштування показує наявний вхід у Gemini CLI, але ніколи
    не перевіряє його автоматично, оскільки Gemini CLI не має способу перевірки без інструментів. Щоб продовжити, виберіть OAuth
    Gemini CLI або ключ Gemini API.

    Посилання на моделі `google-gemini-cli/*` є застарілими псевдонімами сумісності. У нових
    конфігураціях слід використовувати посилання на моделі `google/*` разом із середовищем виконання `google-gemini-cli`,
    якщо потрібне локальне виконання Gemini CLI.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` було виведено з експлуатації 2026-03-09; натомість використовуйте `google/gemini-3.1-pro-preview`. Повторне налаштування ключа Gemini API (`openclaw onboard --auth-choice gemini-api-key` або `openclaw models auth login --provider google`) замінює застарілу налаштовану модель за замовчуванням на поточну.
</Note>

## Можливості

| Можливість                        | Підтримка                      |
| --------------------------------- | ------------------------------ |
| Завершення чату                   | Так                            |
| Генерування зображень             | Так                            |
| Генерування музики                | Так                            |
| Перетворення тексту на мовлення   | Так                            |
| Голос у реальному часі            | Так (Google Live API)          |
| Розпізнавання зображень           | Так                            |
| Транскрибування аудіо             | Так                            |
| Розпізнавання відео               | Так                            |
| Вебпошук (Grounding)              | Так                            |
| Міркування                        | Так (Gemini 2.5+ / Gemini 3+)  |
| Моделі Gemma 4                    | Так                            |

## Вебпошук

Вбудований постачальник вебпошуку `gemini` використовує прив’язування до Google Search через Gemini.
Налаштуйте спеціальний ключ пошуку в `plugins.entries.google.config.webSearch`
або дозвольте повторно використовувати `models.providers.google.apiKey` після `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // необов’язково, якщо задано GEMINI_API_KEY або models.providers.google.apiKey
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // у разі відсутності використовується models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Пріоритет облікових даних: спеціальний `webSearch.apiKey`, потім `GEMINI_API_KEY`,
а далі `models.providers.google.apiKey`. `webSearch.baseUrl` є необов’язковим і
призначений для проксі-серверів оператора або сумісних кінцевих точок Gemini API; якщо його не задано,
вебпошук Gemini повторно використовує `models.providers.google.baseUrl`. Поведінку інструмента, специфічну для постачальника, описано в розділі
[Пошук Gemini](/uk/tools/gemini-search).

<Tip>
Моделі Gemini 3 використовують `thinkingLevel` замість `thinkingBudget`. OpenClaw зіставляє
елементи керування міркуванням для Gemini 3, Gemini 3.1 і псевдоніма `gemini-*-latest` з
`thinkingLevel`, щоб під час запусків за замовчуванням або з низькою затримкою не надсилати вимкнені
значення `thinkingBudget`.

`/think adaptive` зберігає семантику динамічного міркування Google замість вибору
фіксованого рівня OpenClaw. Gemini 3 і Gemini 3.1 не передають фіксоване значення `thinkingLevel`, щоб
Google міг вибрати рівень; Gemini 2.5 надсилає динамічне сигнальне значення Google
`thinkingBudget: -1`.

Моделі Gemma 4 (наприклад, `gemma-4-26b-a4b-it`) підтримують режим міркування. OpenClaw
перетворює `thinkingBudget` на підтримуване значення Google `thinkingLevel` для Gemma 4.
Установлення для міркування значення `off` зберігає його вимкненим замість зіставлення з
`MINIMAL`.

Gemini 2.5 Pro працює лише в режимі міркування та відхиляє явне значення
`thinkingBudget: 0`; OpenClaw вилучає це значення із запитів Gemini 2.5 Pro
замість його надсилання.
</Tip>

## Генерування зображень

Вбудований постачальник генерування зображень `google` за замовчуванням використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримується `google/gemini-3-pro-image-preview`
- Генерування: до 4 зображень на запит
- Режим редагування: увімкнено, до 5 вхідних зображень
- Параметри геометрії: `size`, `aspectRatio` і `resolution`

Щоб використовувати Google як постачальника зображень за замовчуванням:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Спільні параметри інструмента, вибір постачальника та поведінку резервного перемикання описано в розділі [Генерування зображень](/uk/tools/image-generation).
</Note>

## Генерування відео

Вбудований плагін `google` також реєструє генерування відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: перетворення тексту на відео, зображення на відео та процеси з одним еталонним відео
- Підтримуються `aspectRatio` (`16:9`, `9:16`) і `resolution` (`720P`, `1080P`); наразі Veo не підтримує виведення аудіо
- Підтримувана тривалість: **4, 6 або 8 секунд** (інші значення округлюються до найближчого дозволеного значення)

Щоб використовувати Google як постачальника відео за замовчуванням:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Спільні параметри інструмента, вибір постачальника та поведінку резервного перемикання описано в розділі [Генерування відео](/uk/tools/video-generation).
</Note>

## Генерування музики

Вбудований плагін `google` також реєструє генерування музики через спільний
інструмент `music_generate`.

- Модель музики за замовчуванням: `google/lyria-3-clip-preview`
- Також підтримується `google/lyria-3-pro-preview`
- Керування запитом: `lyrics` і `instrumental`
- Формат виведення: за замовчуванням `mp3`, а також `wav` у `google/lyria-3-pro-preview`
- Еталонні вхідні дані: до 10 зображень
- Запуски на основі сеансу від’єднуються через спільний процес завдань і станів, зокрема `action: "status"`

Щоб використовувати Google як постачальника музики за замовчуванням:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Спільні параметри інструмента, вибір постачальника та поведінку резервного перемикання описано в розділі [Генерування музики](/uk/tools/music-generation).
</Note>

## Перетворення тексту на мовлення

Вбудований постачальник мовлення `google` використовує шлях TTS Gemini API з
`gemini-3.1-flash-tts-preview`.

- Голос за замовчуванням: `Kore`
- Автентифікація: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Виведення: WAV для звичайних вкладень TTS, Opus для цільових голосових повідомлень, PCM для Talk/телефонії
- Виведення голосових повідомлень: PCM від Google обгортається у WAV і транскодується в Opus із частотою 48 кГц за допомогою `ffmpeg`

Пакетний шлях Gemini TTS від Google повертає згенероване аудіо в завершеній
відповіді `generateContent`. Для голосових розмов із найнижчою затримкою використовуйте
постачальника голосу Google у реальному часі на основі Gemini Live API замість пакетного
TTS.

Щоб використовувати Google як постачальника TTS за замовчуванням:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Говоріть професійно спокійним тоном.",
        },
      },
    },
  },
}
```

Gemini API TTS використовує запити природною мовою для керування стилем. Установіть
`audioProfile`, щоб додати багаторазовий запит стилю перед озвучуваним текстом. Установіть
`speakerName`, якщо текст запиту посилається на названого мовця.

Gemini API TTS також приймає виразні аудіотеги у квадратних дужках у тексті,
як-от `[whispers]` або `[laughs]`. Щоб теги не відображалися у видимій відповіді чату,
але надсилалися до TTS, розмістіть їх усередині блока `[[tts:text]]...[[/tts:text]]`:

```text
Ось чистий текст відповіді.

[[tts:text]][whispers] Ось озвучена версія.[[/tts:text]]
```

<Note>
Ключ API Google Cloud Console, доступ якого обмежено Gemini API, підходить для цього
постачальника. Це не окремий шлях Cloud Text-to-Speech API.
</Note>

## Голос у реальному часі

Вбудований плагін `google` реєструє постачальника голосу в реальному часі на основі
Gemini Live API для серверних аудіомостів, як-от Voice Call і Google Meet.

| Налаштування               | Шлях конфігурації                                                         | Типове значення                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Модель                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| Голос                 | `...google.voice`                                                   | `Kore`                                                                                |
| Температура           | `...google.temperature`                                             | (не задано)                                                                               |
| Чутливість початку VAD | `...google.startSensitivity`                                        | (не задано)                                                                               |
| Чутливість завершення VAD   | `...google.endSensitivity`                                          | (не задано)                                                                               |
| Тривалість тиші      | `...google.silenceDurationMs`                                       | (не задано)                                                                               |
| Обробка активності     | `...google.activityHandling`                                        | Типове значення Google, `start-of-activity-interrupts`                                        |
| Охоплення репліки         | `...google.turnCoverage`                                            | Типове значення Google, `audio-activity-and-all-video`                                        |
| Вимкнення автоматичного VAD      | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Відновлення сеансу    | `...google.sessionResumption`                                       | `true`                                                                                |
| Стиснення контексту   | `...google.contextWindowCompression`                                | `true`                                                                                |
| Ключ API               | `...google.apiKey`                                                  | Якщо не задано, використовує `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

Приклад конфігурації Voice Call для роботи в реальному часі:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API використовує двоспрямоване аудіо та виклики функцій через WebSocket.
OpenClaw адаптує аудіо з мосту телефонії/Meet до потоку PCM Live API Gemini та
зберігає виклики інструментів у спільному контракті голосового зв’язку в реальному часі. Не задавайте `temperature`,
якщо не потрібно змінити дискретизацію; OpenClaw пропускає недодатні значення,
оскільки Google Live може повертати транскрипції без аудіо для `temperature: 0`.
Транскрибування Gemini API увімкнено без `languageCodes`; поточний Google
SDK відхиляє підказки коду мови в цьому шляху API.
</Note>

<Note>
Gemini 3.1 Live приймає текст розмови через введення в реальному часі та використовує
послідовні виклики функцій. OpenClaw пропускає старіші `NON_BLOCKING`, планування
відповідей функцій і поля емоційного діалогу для цієї моделі. Віддавайте перевагу
`thinkingLevel`; налаштовані додатні значення `thinkingBudget` зіставляються з
найближчим підтримуваним рівнем, тоді як `-1` залишає чинним типове значення Google. Див.
[порівняння можливостей Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Talk у Control UI підтримує браузерні сеанси Google Live з обмеженими одноразовими
токенами. Постачальники голосового зв’язку в реальному часі, що працюють лише на сервері, також можуть працювати через універсальний
релейний транспорт Gateway, який зберігає облікові дані постачальника на Gateway.
</Note>

Для перевірки в реальному середовищі супровідником виконайте
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Ця димова перевірка також охоплює серверні шляхи/WebRTC OpenAI; частина Google створює токен
Live API тієї самої обмеженої форми, яку використовує Talk у Control UI, відкриває браузерну
кінцеву точку WebSocket, надсилає початкові дані налаштування та очікує на
`setupComplete`.

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Безпосереднє повторне використання кешу Gemini">
    Для безпосередніх запусків Gemini API (`api: "google-generative-ai"`) OpenClaw
    передає налаштований дескриптор `cachedContent` до запитів Gemini.

    - Налаштуйте параметри для окремої моделі або глобально за допомогою
      `cachedContent` чи застарілого `cached_content`
    - Параметри з конкретнішої області (рівня моделі, а не глобального) завжди мають пріоритет.
      У межах однієї області, якщо задано обидва ключі, пріоритет має `cached_content`.
      Використовуйте лише один ключ на область, щоб уникнути несподіванок.
    - Приклад значення: `cachedContents/prebuilt-context`
    - Використання в разі влучання в кеш Gemini нормалізується в OpenClaw `cacheRead` з
      вхідного `cachedContentTokenCount`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Примітки щодо використання Gemini CLI">
    Під час використання постачальника OAuth `google-gemini-cli` OpenClaw типово використовує
    виведення Gemini CLI `stream-json` і нормалізує дані про використання з остаточних
    даних `stats`. Застарілі перевизначення `--output-format json` усе ще використовують
    синтаксичний аналізатор JSON.

    - Потоковий текст відповіді надходить із подій асистента `message`.
    - Для застарілого виведення JSON текст відповіді надходить із поля JSON CLI `response`.
    - Дані про використання беруться з `stats`, якщо CLI залишає `usage` порожнім.
    - `stats.cached` нормалізується в OpenClaw `cacheRead`.
    - Якщо `stats.input` відсутній, OpenClaw обчислює кількість вхідних токенів із
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Налаштування середовища та фонової служби">
    Якщо Gateway працює як фонова служба (launchd/systemd), переконайтеся, що `GEMINI_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки в разі відмови.
  </Card>
  <Card title="Генерування зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента для роботи із зображеннями та вибір постачальника.
  </Card>
  <Card title="Генерування відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента для роботи з відео та вибір постачальника.
  </Card>
  <Card title="Генерування музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента для роботи з музикою та вибір постачальника.
  </Card>
</CardGroup>
