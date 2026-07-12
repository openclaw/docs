---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібен ключ API або процес автентифікації OAuth
summary: Налаштування Google Gemini (ключ API + OAuth, генерування зображень, розпізнавання медіа, синтез мовлення, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-12T13:41:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

Plugin Google надає доступ до моделей Gemini через Google AI Studio, а також до генерування зображень, розуміння медіа (зображень/аудіо/відео), перетворення тексту на мовлення та вебпошуку через Gemini Grounding.

- Постачальник: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Параметр середовища виконання: `agentRuntime.id: "google-gemini-cli"` повторно використовує OAuth Gemini CLI, зберігаючи канонічні посилання на моделі у форматі `google/*`.

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключ API">
    **Найкраще підходить для:** стандартного доступу до Gemini API через Google AI Studio.

    <Steps>
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
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Приймаються обидві змінні: `GEMINI_API_KEY` і `GOOGLE_API_KEY`. Використовуйте ту, яку вже налаштовано.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Найкраще підходить для:** повторного використання наявного входу в Gemini CLI через PKCE OAuth замість окремого ключа API.

    <Warning>
    Постачальник `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
    повідомляють про обмеження облікових записів під час такого використання OAuth. Використовуйте на власний ризик.
    </Warning>

    <Steps>
      <Step title="Установіть Gemini CLI">
        Локальна команда `gemini` має бути доступна в `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw підтримує як установлення через Homebrew, так і глобальні встановлення через npm, зокрема
        поширені структури каталогів Windows/npm.
      </Step>
      <Step title="Увійдіть через OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Модель за замовчуванням: `google/gemini-3.1-pro-preview`
    - Середовище виконання: `google-gemini-cli`
    - Псевдонім: `gemini-cli`

    Ідентифікатор моделі Gemini API для Gemini 3.1 Pro — `gemini-3.1-pro-preview`. Для зручності OpenClaw приймає коротший псевдонім `google/gemini-3.1-pro` і нормалізує його перед викликами постачальника.

    **Змінні середовища:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Якщо запити OAuth Gemini CLI завершуються помилкою після входу, установіть `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway і повторіть спробу.
    </Note>

    <Note>
    Якщо вхід завершується помилкою до запуску процесу в браузері, переконайтеся, що локальну команду `gemini`
    встановлено й вона доступна в `PATH`.
    </Note>

    Посилання на моделі `google-gemini-cli/*` є застарілими псевдонімами сумісності. Нові
    конфігурації мають використовувати посилання на моделі `google/*` разом із середовищем виконання `google-gemini-cli`,
    якщо потрібне локальне виконання Gemini CLI.

  </Tab>
</Tabs>

<Note>
Модель `google/gemini-3-pro-preview` виведено з експлуатації 09.03.2026; натомість використовуйте `google/gemini-3.1-pro-preview`. Повторне налаштування ключа Gemini API (`openclaw onboard --auth-choice gemini-api-key` або `openclaw models auth login --provider google`) замінює застарілу налаштовану модель за замовчуванням на поточну.
</Note>

## Можливості

| Можливість                    | Підтримка                        |
| ----------------------------- | -------------------------------- |
| Доповнення чату               | Так                              |
| Генерування зображень         | Так                              |
| Генерування музики            | Так                              |
| Перетворення тексту на мовлення | Так                            |
| Голос у реальному часі        | Так (Google Live API)            |
| Розуміння зображень           | Так                              |
| Транскрибування аудіо         | Так                              |
| Розуміння відео               | Так                              |
| Вебпошук (Grounding)          | Так                              |
| Мислення/міркування           | Так (Gemini 2.5+ / Gemini 3+)    |
| Моделі Gemma 4                | Так                              |

## Вебпошук

Вбудований постачальник вебпошуку `gemini` використовує прив’язку до Google Search через Gemini.
Налаштуйте окремий ключ пошуку в `plugins.entries.google.config.webSearch`
або дозвольте повторно використовувати `models.providers.google.apiKey` після `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Порядок пріоритету облікових даних: окремий `webSearch.apiKey`, потім `GEMINI_API_KEY`,
потім `models.providers.google.apiKey`. Параметр `webSearch.baseUrl` необов’язковий і
призначений для проксі-серверів операторів або сумісних кінцевих точок Gemini API; якщо його не вказано,
вебпошук Gemini повторно використовує `models.providers.google.baseUrl`. Докладніше про поведінку інструмента для цього постачальника див. у розділі
[Пошук Gemini](/uk/tools/gemini-search).

<Tip>
Моделі Gemini 3 використовують `thinkingLevel` замість `thinkingBudget`. OpenClaw зіставляє
елементи керування міркуванням для Gemini 3, Gemini 3.1 і псевдонімів `gemini-*-latest` із
`thinkingLevel`, щоб запуски за замовчуванням або з низькою затримкою не надсилали вимкнені
значення `thinkingBudget`.

`/think adaptive` зберігає динамічну семантику мислення Google замість вибору
фіксованого рівня OpenClaw. Gemini 3 і Gemini 3.1 не передають фіксований `thinkingLevel`, щоб
Google міг вибрати рівень; Gemini 2.5 надсилає динамічне сигнальне значення Google
`thinkingBudget: -1`.

Моделі Gemma 4 (наприклад, `gemma-4-26b-a4b-it`) підтримують режим мислення. OpenClaw
перетворює `thinkingBudget` на підтримуваний Google параметр `thinkingLevel` для Gemma 4.
Установлення режиму мислення в `off` залишає мислення вимкненим замість зіставлення з
`MINIMAL`.

Gemini 2.5 Pro працює лише в режимі мислення й відхиляє явно задане значення
`thinkingBudget: 0`; OpenClaw вилучає це значення із запитів Gemini 2.5 Pro,
а не надсилає його.
</Tip>

## Генерування зображень

Вбудований постачальник генерування зображень `google` за замовчуванням використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримує `google/gemini-3-pro-image-preview`
- Генерування: до 4 зображень на запит
- Режим редагування: увімкнено, до 5 вхідних зображень
- Керування геометрією: `size`, `aspectRatio` і `resolution`

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

Вбудований Plugin `google` також реєструє генерування відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: текст у відео, зображення у відео та сценарії з одним еталонним відео
- Підтримує `aspectRatio` (`16:9`, `9:16`) і `resolution` (`720P`, `1080P`); наразі Veo не підтримує виведення аудіо
- Підтримувана тривалість: **4, 6 або 8 секунд** (інші значення округлюються до найближчого дозволеного)

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

Вбудований Plugin `google` також реєструє генерування музики через спільний
інструмент `music_generate`.

- Модель музики за замовчуванням: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування запитом: `lyrics` і `instrumental`
- Формат виведення: за замовчуванням `mp3`, а для `google/lyria-3-pro-preview` також `wav`
- Еталонні вхідні дані: до 10 зображень
- Запуски, підкріплені сеансом, від’єднуються через спільний потік завдань/стану, зокрема `action: "status"`

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

Вбудований постачальник мовлення `google` використовує шлях TTS Gemini API з моделлю
`gemini-3.1-flash-tts-preview`.

- Голос за замовчуванням: `Kore`
- Автентифікація: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Виведення: WAV для звичайних вкладень TTS, Opus для цільових голосових повідомлень, PCM для Talk/телефонії
- Виведення голосових повідомлень: PCM від Google загортається у WAV і перекодовується у формат Opus із частотою 48 кГц за допомогою `ffmpeg`

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
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS використовує запити природною мовою для керування стилем. Установіть
`audioProfile`, щоб додавати придатний до повторного використання стильовий запит перед озвучуваним текстом. Установіть
`speakerName`, якщо текст запиту посилається на названого мовця.

Gemini API TTS також приймає в тексті виразні аудіотеги у квадратних дужках,
наприклад `[whispers]` або `[laughs]`. Щоб теги не відображалися у видимій відповіді чату,
але надсилалися до TTS, помістіть їх у блок `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Ключ API Google Cloud Console, обмежений Gemini API, є дійсним для цього
постачальника. Це не окремий шлях Cloud Text-to-Speech API.
</Note>

## Голос у реальному часі

Вбудований Plugin `google` реєструє постачальника голосу в реальному часі на основі
Gemini Live API для серверних аудіомостів, як-от Voice Call і Google Meet.

| Налаштування                 | Шлях конфігурації                                                   | Типове значення                                                                         |
| ---------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Модель                       | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                         |
| Голос                        | `...google.voice`                                                   | `Kore`                                                                                  |
| Температура                  | `...google.temperature`                                             | (не задано)                                                                             |
| Чутливість початку VAD       | `...google.startSensitivity`                                        | (не задано)                                                                             |
| Чутливість завершення VAD    | `...google.endSensitivity`                                          | (не задано)                                                                             |
| Тривалість тиші              | `...google.silenceDurationMs`                                       | (не задано)                                                                             |
| Обробка активності           | `...google.activityHandling`                                        | Типове значення Google, `start-of-activity-interrupts`                                  |
| Охоплення репліки            | `...google.turnCoverage`                                            | Типове значення Google, `audio-activity-and-all-video`                                  |
| Вимкнення автоматичного VAD  | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                                 |
| Відновлення сеансу           | `...google.sessionResumption`                                       | `true`                                                                                  |
| Стиснення контексту          | `...google.contextWindowCompression`                                | `true`                                                                                  |
| Ключ API                     | `...google.apiKey`                                                  | Використовує резервно `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

Приклад конфігурації голосових викликів у реальному часі:

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
OpenClaw адаптує аудіо з телефонії/моста Meet до потоку PCM Live API Gemini та
виконує виклики інструментів за спільним контрактом голосового зв’язку в реальному часі. Залишайте `temperature`
незаданим, якщо вам не потрібно змінювати семплювання; OpenClaw пропускає недодатні значення,
оскільки Google Live може повертати транскрипції без аудіо за `temperature: 0`.
Транскрипція Gemini API увімкнена без `languageCodes`; поточний SDK Google
відхиляє підказки кодів мов у цьому шляху API.
</Note>

<Note>
Gemini 3.1 Live приймає розмовний текст через введення в реальному часі та використовує
послідовні виклики функцій. OpenClaw пропускає застарілі поля `NON_BLOCKING`, планування
відповідей функцій і афективного діалогу для цієї моделі. Надавайте перевагу
`thinkingLevel`; налаштовані додатні значення `thinkingBudget` зіставляються з
найближчим підтримуваним рівнем, а `-1` залишає чинним типове значення Google. Див.
[порівняння можливостей Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Розмовний режим Control UI підтримує браузерні сеанси Google Live з обмеженими одноразовими
токенами. Серверні провайдери голосового зв’язку в реальному часі також можуть працювати через універсальний
ретрансляційний транспорт Gateway, який зберігає облікові дані провайдера на Gateway.
</Note>

Для оперативної перевірки супроводжувачем виконайте
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Ця димова перевірка також охоплює серверні шляхи OpenAI/WebRTC; етап Google створює токен
Live API з тими самими обмеженнями, що використовує розмовний режим Control UI, відкриває браузерну
кінцеву точку WebSocket, надсилає початкове корисне навантаження налаштування та очікує на
`setupComplete`.

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Безпосереднє повторне використання кешу Gemini">
    Для безпосередніх запусків Gemini API (`api: "google-generative-ai"`) OpenClaw
    передає налаштований дескриптор `cachedContent` у запити Gemini.

    - Налаштуйте параметри для окремої моделі або глобально за допомогою
      `cachedContent` чи застарілого `cached_content`
    - Параметри з конкретнішої області видимості (рівень моделі замість глобального) завжди мають пріоритет.
      У межах однієї області видимості, якщо задано обидва ключі, пріоритет має `cached_content`.
      Використовуйте лише один ключ в області видимості, щоб уникнути неочікуваної поведінки.
    - Приклад значення: `cachedContents/prebuilt-context`
    - Дані про використання в разі влучання в кеш Gemini нормалізуються в `cacheRead` OpenClaw
      із висхідного `cachedContentTokenCount`

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
    Під час використання OAuth-провайдера `google-gemini-cli` OpenClaw типово використовує
    виведення Gemini CLI `stream-json` і нормалізує дані про використання з кінцевого
    корисного навантаження `stats`. Застарілі перевизначення `--output-format json` і надалі використовують
    аналізатор JSON.

    - Потоковий текст відповіді надходить із подій `message` асистента.
    - Для застарілого виведення JSON текст відповіді надходить із поля `response` у JSON від CLI.
    - Якщо CLI залишає `usage` порожнім, дані про використання беруться резервно зі `stats`.
    - `stats.cached` нормалізується в `cacheRead` OpenClaw.
    - Якщо `stats.input` відсутнє, OpenClaw обчислює кількість вхідних токенів як
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
    Вибір провайдерів, посилань на моделі та поведінки перемикання в разі відмови.
  </Card>
  <Card title="Генерування зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента генерування зображень і вибір провайдера.
  </Card>
  <Card title="Генерування відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента генерування відео та вибір провайдера.
  </Card>
  <Card title="Генерування музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента генерування музики та вибір провайдера.
  </Card>
</CardGroup>
