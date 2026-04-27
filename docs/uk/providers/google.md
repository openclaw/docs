---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібен потік автентифікації за ключем API або OAuth
summary: Налаштування Google Gemini (ключ API + OAuth, генерація зображень, розуміння медіа, TTS, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-27T14:20:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ab97fc37ba78af8273987ec95f71bc599abf4e0a42ca597775f32ba04a03033
    source_path: providers/google.md
    workflow: 15
---

plugin Google надає доступ до моделей Gemini через Google AI Studio, а також
генерацію зображень, розуміння медіа (зображення/аудіо/відео), синтез мовлення та вебпошук через
Gemini Grounding.

- Provider: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Параметр runtime: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  повторно використовує OAuth Gemini CLI, зберігаючи канонічні посилання на моделі як `google/*`.

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключ API">
    **Найкраще для:** стандартного доступу до Gemini API через Google AI Studio.

    <Steps>
      <Step title="Запустіть onboarding">
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
      <Step title="Задайте модель за замовчуванням">
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
    Змінні середовища `GEMINI_API_KEY` і `GOOGLE_API_KEY` обидві підтримуються. Використовуйте ту, яка у вас уже налаштована.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Найкраще для:** повторного використання наявного входу Gemini CLI через PKCE OAuth замість окремого ключа API.

    <Warning>
    Provider `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
    повідомляють про обмеження облікового запису при використанні OAuth таким способом. Використовуйте на власний ризик.
    </Warning>

    <Steps>
      <Step title="Встановіть Gemini CLI">
        Локальна команда `gemini` має бути доступна в `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw підтримує як встановлення через Homebrew, так і глобальні встановлення npm, включно з
        поширеними схемами Windows/npm.
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
    - Runtime: `google-gemini-cli`
    - Псевдонім: `gemini-cli`

    **Змінні середовища:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Або варіанти `GEMINI_CLI_*`.)

    <Note>
    Якщо запити Gemini CLI OAuth не вдаються після входу, задайте `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway і повторіть спробу.
    </Note>

    <Note>
    Якщо вхід не вдається до початку потоку в браузері, переконайтеся, що локальну команду `gemini`
    встановлено і вона є в `PATH`.
    </Note>

    Посилання на моделі `google-gemini-cli/*` є застарілими псевдонімами сумісності. Нові
    конфігурації мають використовувати посилання на моделі `google/*` разом із runtime `google-gemini-cli`,
    якщо потрібне локальне виконання Gemini CLI.

  </Tab>
</Tabs>

## Можливості

| Можливість             | Підтримується                |
| ---------------------- | ---------------------------- |
| Завершення чату        | Так                          |
| Генерація зображень    | Так                          |
| Генерація музики       | Так                          |
| Синтез мовлення        | Так                          |
| Голос у реальному часі | Так (Google Live API)        |
| Розуміння зображень    | Так                          |
| Транскрипція аудіо     | Так                          |
| Розуміння відео        | Так                          |
| Вебпошук (Grounding)   | Так                          |
| Thinking/reasoning     | Так (Gemini 2.5+ / Gemini 3+) |
| Моделі Gemma 4         | Так                          |

<Tip>
Моделі Gemini 3 використовують `thinkingLevel` замість `thinkingBudget`. OpenClaw зіставляє
елементи керування reasoning для Gemini 3, Gemini 3.1 і псевдонімів `gemini-*-latest` із
`thinkingLevel`, щоб типові/низьколатентні запуски не надсилали вимкнені
значення `thinkingBudget`.

`/think adaptive` зберігає динамічну семантику thinking Google замість вибору
фіксованого рівня OpenClaw. Gemini 3 і Gemini 3.1 не надсилають фіксований `thinkingLevel`, щоб
Google міг сам обрати рівень; Gemini 2.5 надсилає динамічний sentinel Google
`thinkingBudget: -1`.

Моделі Gemma 4 (наприклад `gemma-4-26b-a4b-it`) підтримують режим thinking. OpenClaw
перезаписує `thinkingBudget` на підтримуваний Google `thinkingLevel` для Gemma 4.
Установлення thinking в `off` зберігає вимкнений thinking замість зіставлення з
`MINIMAL`.
</Tip>

## Генерація зображень

Вбудований provider генерації зображень `google` за замовчуванням використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримує `google/gemini-3-pro-image-preview`
- Генерація: до 4 зображень на запит
- Режим редагування: увімкнено, до 5 вхідних зображень
- Керування геометрією: `size`, `aspectRatio` і `resolution`

Щоб використовувати Google як provider зображень за замовчуванням:

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
Див. [Image Generation](/uk/tools/image-generation) для спільних параметрів інструмента, вибору provider і поведінки failover.
</Note>

## Генерація відео

Вбудований plugin `google` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: text-to-video, image-to-video та потоки з одним еталонним відео
- Підтримує `aspectRatio`, `resolution` і `audio`
- Поточне обмеження тривалості: **від 4 до 8 секунд**

Щоб використовувати Google як provider відео за замовчуванням:

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
Див. [Video Generation](/uk/tools/video-generation) для спільних параметрів інструмента, вибору provider і поведінки failover.
</Note>

## Генерація музики

Вбудований plugin `google` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Модель музики за замовчуванням: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування запитом: `lyrics` і `instrumental`
- Формат виводу: `mp3` за замовчуванням, а також `wav` у `google/lyria-3-pro-preview`
- Еталонні вхідні дані: до 10 зображень
- Запуски з підтримкою сесій відокремлюються через спільний потік task/status, включно з `action: "status"`

Щоб використовувати Google як provider музики за замовчуванням:

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
Див. [Music Generation](/uk/tools/music-generation) для спільних параметрів інструмента, вибору provider і поведінки failover.
</Note>

## Синтез мовлення

Вбудований speech provider `google` використовує шлях Gemini API TTS з
`gemini-3.1-flash-tts-preview`.

- Голос за замовчуванням: `Kore`
- Автентифікація: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Вивід: WAV для звичайних вкладень TTS, Opus для цілей голосових нотаток, PCM для Talk/телефонії
- Вивід голосових нотаток: Google PCM обгортається у WAV і транскодується в Opus 48 кГц через `ffmpeg`

Щоб використовувати Google як provider TTS за замовчуванням:

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

Gemini API TTS використовує природномовні запити для керування стилем. Задайте
`audioProfile`, щоб додати багаторазово використовуваний стильовий запит перед озвучуваним текстом. Задайте
`speakerName`, коли текст вашого запиту посилається на іменованого мовця.

Gemini API TTS також приймає виразні аудіотеги у квадратних дужках у тексті,
такі як `[whispers]` або `[laughs]`. Щоб приховати теги з видимої відповіді чату,
але передати їх до TTS, помістіть їх усередину блоку `[[tts:text]]...[[/tts:text]]`:

```text
Ось чистий текст відповіді.

[[tts:text]][whispers] Ось озвучена версія.[[/tts:text]]
```

<Note>
Ключ API Google Cloud Console, обмежений Gemini API, є дійсним для цього
provider. Це не окремий шлях Cloud Text-to-Speech API.
</Note>

## Голос у реальному часі

Вбудований plugin `google` реєструє provider голосу в реальному часі на основі
Gemini Live API для серверних аудіомостів, таких як Voice Call і Google Meet.

| Параметр              | Шлях config                                                         | За замовчуванням                                                                      |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Модель                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Голос                 | `...google.voice`                                                   | `Kore`                                                                                |
| Температура           | `...google.temperature`                                             | (не задано)                                                                           |
| Чутливість початку VAD | `...google.startSensitivity`                                       | (не задано)                                                                           |
| Чутливість завершення VAD | `...google.endSensitivity`                                     | (не задано)                                                                           |
| Тривалість тиші       | `...google.silenceDurationMs`                                       | (не задано)                                                                           |
| Обробка активності    | `...google.activityHandling`                                        | типове значення Google, `start-of-activity-interrupts`                                |
| Охоплення ходу        | `...google.turnCoverage`                                            | типове значення Google, `only-activity`                                               |
| Вимкнути автоматичний VAD | `...google.automaticActivityDetectionDisabled`                 | `false`                                                                               |
| Ключ API              | `...google.apiKey`                                                  | За замовчуванням використовується `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

Приклад config голосу в реальному часі для Voice Call:

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
Google Live API використовує двонаправлене аудіо та виклик функцій через WebSocket.
OpenClaw адаптує аудіо телефонії/моста Meet до PCM-потоку Live API Gemini і
зберігає виклики інструментів у спільному контракті голосу в реальному часі. Залишайте `temperature`
не заданим, якщо вам не потрібні зміни семплювання; OpenClaw пропускає непозитивні значення,
оскільки Google Live може повертати транскрипти без аудіо для `temperature: 0`.
Транскрипція Gemini API увімкнена без `languageCodes`; поточний SDK Google
відхиляє підказки кодів мови на цьому шляху API.
</Note>

<Note>
Control UI Talk підтримує браузерні сесії Google Live з обмеженими одноразовими
токенами. Provider голосу в реальному часі, які працюють лише на сервері, також можуть
працювати через універсальний транспорт ретрансляції Gateway, який зберігає
облікові дані provider на Gateway.
</Note>

Для live-перевірки супровідниками виконайте
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Гілка Google карбує той самий формат обмеженого токена Live API, який використовує Control
UI Talk, відкриває кінцеву точку браузерного WebSocket, надсилає початковий payload налаштування
і очікує на `setupComplete`.

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Пряме повторне використання кешу Gemini">
    Для прямих запусків Gemini API (`api: "google-generative-ai"`) OpenClaw
    передає налаштований дескриптор `cachedContent` у запити Gemini.

    - Налаштовуйте параметри для окремої моделі або глобально через
      `cachedContent` або застарілий `cached_content`
    - Якщо присутні обидва, пріоритет має `cachedContent`
    - Приклад значення: `cachedContents/prebuilt-context`
    - Використання Gemini cache-hit нормалізується в OpenClaw `cacheRead` з
      вихідного `cachedContentTokenCount`

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

  <Accordion title="Нотатки щодо використання JSON Gemini CLI">
    Під час використання OAuth-provider `google-gemini-cli` OpenClaw нормалізує
    JSON-вивід CLI таким чином:

    - Текст відповіді береться з поля JSON CLI `response`.
    - Дані про використання беруться з `stats`, якщо CLI залишає `usage` порожнім.
    - `stats.cached` нормалізується в OpenClaw `cacheRead`.
    - Якщо `stats.input` відсутній, OpenClaw визначає вхідні токени з
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Налаштування середовища та демона">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `GEMINI_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір providers, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Image generation" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір provider.
  </Card>
  <Card title="Video generation" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір provider.
  </Card>
  <Card title="Music generation" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента музики і вибір provider.
  </Card>
</CardGroup>
