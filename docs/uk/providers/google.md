---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Потрібен API-ключ або потік автентифікації OAuth
summary: Налаштування Google Gemini (ключ API + OAuth, генерація зображень, розуміння медіаконтенту, TTS, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-02T04:47:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14605b88f0d1d7e01796d429113a73b2b52a48fde6443565dcb3db47653be5e7
    source_path: providers/google.md
    workflow: 16
---

Plugin Google надає доступ до моделей Gemini через Google AI Studio, а також
генерацію зображень, розуміння медіа (зображення/аудіо/відео), перетворення тексту на мовлення та вебпошук через
Gemini Grounding.

- Постачальник: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Опція середовища виконання: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  повторно використовує OAuth Gemini CLI, зберігаючи посилання на моделі канонічними як `google/*`.

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключ API">
    **Найкраще для:** стандартного доступу до Gemini API через Google AI Studio.

    <Steps>
      <Step title="Запустіть первинне налаштування">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Або передайте ключ напряму:

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
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Змінні середовища `GEMINI_API_KEY` і `GOOGLE_API_KEY` підтримуються обидві. Використовуйте ту, яку вже налаштовано.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Найкраще для:** повторного використання наявного входу Gemini CLI через PKCE OAuth замість окремого ключа API.

    <Warning>
    Постачальник `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
    повідомляють про обмеження облікових записів під час використання OAuth таким способом. Використовуйте на власний ризик.
    </Warning>

    <Steps>
      <Step title="Установіть Gemini CLI">
        Локальна команда `gemini` має бути доступною в `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw підтримує як інсталяції Homebrew, так і глобальні інсталяції npm, зокрема
        поширені компонування Windows/npm.
      </Step>
      <Step title="Увійдіть через OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Модель за замовчуванням: `google/gemini-3.1-pro-preview`
    - Середовище виконання: `google-gemini-cli`
    - Псевдонім: `gemini-cli`

    Ідентифікатор моделі Gemini 3.1 Pro у Gemini API — `gemini-3.1-pro-preview`. OpenClaw приймає коротший `google/gemini-3.1-pro` як зручний псевдонім і нормалізує його перед викликами постачальника.

    **Змінні середовища:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Або варіанти `GEMINI_CLI_*`.)

    <Note>
    Якщо запити OAuth Gemini CLI після входу завершуються помилкою, задайте `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway і повторіть спробу.
    </Note>

    <Note>
    Якщо вхід завершується помилкою до запуску потоку браузера, переконайтеся, що локальна команда `gemini`
    установлена й доступна в `PATH`.
    </Note>

    Посилання на моделі `google-gemini-cli/*` є застарілими псевдонімами сумісності. Нові
    конфігурації мають використовувати посилання на моделі `google/*` разом із середовищем виконання `google-gemini-cli`,
    коли потрібне локальне виконання Gemini CLI.

  </Tab>
</Tabs>

## Можливості

| Можливість             | Підтримується                |
| ---------------------- | ---------------------------- |
| Завершення чату        | Так                          |
| Генерація зображень    | Так                          |
| Генерація музики       | Так                          |
| Перетворення тексту на мовлення | Так                 |
| Голос у реальному часі | Так (Google Live API)        |
| Розуміння зображень    | Так                          |
| Транскрипція аудіо     | Так                          |
| Розуміння відео        | Так                          |
| Вебпошук (Grounding)   | Так                          |
| Мислення/міркування    | Так (Gemini 2.5+ / Gemini 3+) |
| Моделі Gemma 4         | Так                          |

## Вебпошук

Вбудований постачальник вебпошуку `gemini` використовує Gemini Google Search grounding.
Налаштуйте спеціальний ключ пошуку в `plugins.entries.google.config.webSearch`
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

Пріоритет облікових даних такий: спеціальний `webSearch.apiKey`, потім `GEMINI_API_KEY`,
потім `models.providers.google.apiKey`. `webSearch.baseUrl` необов’язковий і
існує для операторських проксі або сумісних кінцевих точок Gemini API; якщо його пропущено,
вебпошук Gemini повторно використовує `models.providers.google.baseUrl`. Див.
[пошук Gemini](/uk/tools/gemini-search), щоб дізнатися про поведінку інструмента, специфічну для постачальника.

<Tip>
Моделі Gemini 3 використовують `thinkingLevel`, а не `thinkingBudget`. OpenClaw зіставляє
керування міркуваннями для Gemini 3, Gemini 3.1 і псевдонімів `gemini-*-latest` із
`thinkingLevel`, щоб запуски за замовчуванням або з низькою затримкою не надсилали вимкнені
значення `thinkingBudget`.

`/think adaptive` зберігає семантику динамічного мислення Google замість вибору
фіксованого рівня OpenClaw. Gemini 3 і Gemini 3.1 пропускають фіксований `thinkingLevel`, щоб
Google міг вибрати рівень; Gemini 2.5 надсилає динамічний sentinel Google
`thinkingBudget: -1`.

Моделі Gemma 4 (наприклад `gemma-4-26b-a4b-it`) підтримують режим мислення. OpenClaw
переписує `thinkingBudget` у підтримуваний Google `thinkingLevel` для Gemma 4.
Установлення мислення в `off` зберігає вимкнене мислення замість зіставлення з
`MINIMAL`.
</Tip>

## Генерація зображень

Вбудований постачальник генерації зображень `google` за замовчуванням використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримує `google/gemini-3-pro-image-preview`
- Генерація: до 4 зображень на запит
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
Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні параметри інструмента, вибір постачальника та поведінку failover.
</Note>

## Генерація відео

Вбудований Plugin `google` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: текст-у-відео, зображення-у-відео та потоки посилання на одне відео
- Підтримує `aspectRatio`, `resolution` і `audio`
- Поточне обмеження тривалості: **від 4 до 8 секунд**

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
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір постачальника та поведінку failover.
</Note>

## Генерація музики

Вбудований Plugin `google` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Модель музики за замовчуванням: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування підказкою: `lyrics` і `instrumental`
- Формат виводу: `mp3` за замовчуванням, а також `wav` у `google/lyria-3-pro-preview`
- Вхідні посилання: до 10 зображень
- Запуски з підтримкою сеансів від’єднуються через спільний потік завдання/статусу, зокрема `action: "status"`

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
Див. [Генерація музики](/uk/tools/music-generation), щоб дізнатися про спільні параметри інструмента, вибір постачальника та поведінку failover.
</Note>

## Перетворення тексту на мовлення

Вбудований постачальник мовлення `google` використовує шлях TTS Gemini API з
`gemini-3.1-flash-tts-preview`.

- Голос за замовчуванням: `Kore`
- Автентифікація: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Вивід: WAV для звичайних вкладень TTS, Opus для цілей голосових нотаток, PCM для Talk/телефонії
- Вивід голосової нотатки: Google PCM обгортається як WAV і транскодується в Opus 48 кГц за допомогою `ffmpeg`

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
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

TTS Gemini API використовує підказки природною мовою для керування стилем. Установіть
`audioProfile`, щоб додати багаторазову стильову підказку перед озвучуваним текстом. Установіть
`speakerName`, коли текст підказки посилається на названого мовця.

TTS Gemini API також приймає виразні аудіотеги у квадратних дужках у тексті,
наприклад `[whispers]` або `[laughs]`. Щоб теги не з’являлися у видимій відповіді чату,
але надсилалися в TTS, помістіть їх у блок `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Ключ API Google Cloud Console, обмежений Gemini API, чинний для цього
постачальника. Це не окремий шлях Cloud Text-to-Speech API.
</Note>

## Голос у реальному часі

Вбудований Plugin `google` реєструє постачальника голосу в реальному часі на основі
Gemini Live API для серверних аудіомостів, як-от Voice Call і Google Meet.

| Параметр              | Шлях конфігурації                                                   | Типове значення                                                                       |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Модель                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Голос                 | `...google.voice`                                                   | `Kore`                                                                                |
| Температура           | `...google.temperature`                                             | (не задано)                                                                           |
| Чутливість початку VAD | `...google.startSensitivity`                                        | (не задано)                                                                           |
| Чутливість завершення VAD | `...google.endSensitivity`                                      | (не задано)                                                                           |
| Тривалість тиші       | `...google.silenceDurationMs`                                       | (не задано)                                                                           |
| Обробка активності    | `...google.activityHandling`                                        | Типове значення Google, `start-of-activity-interrupts`                                |
| Охоплення ходу        | `...google.turnCoverage`                                            | Типове значення Google, `only-activity`                                               |
| Вимкнути автоматичний VAD | `...google.automaticActivityDetectionDisabled`                  | `false`                                                                               |
| Ключ API              | `...google.apiKey`                                                  | Резервно використовує `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

Приклад конфігурації Voice Call у реальному часі:

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
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
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
Google Live API використовує двонапрямний аудіопотік і виклики функцій через WebSocket.
OpenClaw адаптує аудіо мосту телефонії/Meet до потоку PCM Live API Gemini та
зберігає виклики інструментів у спільному контракті голосу в реальному часі. Залиште `temperature`
незаданим, якщо вам не потрібні зміни семплінгу; OpenClaw пропускає недодатні значення,
оскільки Google Live може повертати транскрипти без аудіо для `temperature: 0`.
Транскрипцію Gemini API увімкнено без `languageCodes`; поточний Google
SDK відхиляє підказки кодів мов на цьому шляху API.
</Note>

<Note>
Control UI Talk підтримує браузерні сеанси Google Live з обмеженими одноразовими
токенами. Backend-only постачальники голосу в реальному часі також можуть працювати через загальний
транспорт ретрансляції Gateway, який зберігає облікові дані постачальника на Gateway.
</Note>

Для live-перевірки супровідником запустіть
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Гілка Google випускає токен Live API тієї самої обмеженої форми, яку використовує Control
UI Talk, відкриває браузерну кінцеву точку WebSocket, надсилає початкове корисне навантаження налаштування
та очікує `setupComplete`.

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    Для прямих запусків Gemini API (`api: "google-generative-ai"`) OpenClaw
    передає налаштований дескриптор `cachedContent` до запитів Gemini.

    - Налаштовуйте параметри для окремої моделі або глобально за допомогою
      `cachedContent` чи застарілого `cached_content`
    - Якщо наявні обидва, перевагу має `cachedContent`
    - Приклад значення: `cachedContents/prebuilt-context`
    - Використання cache-hit Gemini нормалізується в OpenClaw `cacheRead` з
      upstream `cachedContentTokenCount`

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

  <Accordion title="Gemini CLI JSON usage notes">
    Під час використання OAuth-постачальника `google-gemini-cli` OpenClaw нормалізує
    JSON-вивід CLI так:

    - Текст відповіді береться з поля CLI JSON `response`.
    - Використання резервно береться зі `stats`, коли CLI залишає `usage` порожнім.
    - `stats.cached` нормалізується в OpenClaw `cacheRead`.
    - Якщо `stats.input` відсутнє, OpenClaw виводить вхідні токени з
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `GEMINI_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="Image generation" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір постачальника.
  </Card>
  <Card title="Video generation" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір постачальника.
  </Card>
  <Card title="Music generation" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента музики та вибір постачальника.
  </Card>
</CardGroup>
