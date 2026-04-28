---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Потрібен ключ API або потік автентифікації OAuth
summary: Налаштування Google Gemini (ключ API + OAuth, генерація зображень, розуміння медіа, TTS, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-28T11:22:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea4b53dcea10fef67920da3baca4c85325ee4d4da780fbf708b67bc618e064a6
    source_path: providers/google.md
    workflow: 16
---

Plugin Google надає доступ до моделей Gemini через Google AI Studio, а також генерацію зображень, розуміння медіа (зображення/аудіо/відео), перетворення тексту на мовлення та вебпошук через
Gemini Grounding.

- Провайдер: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Опція середовища виконання: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  повторно використовує OAuth Gemini CLI, зберігаючи посилання на моделі канонічними як `google/*`.

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключ API">
    **Найкраще для:** стандартного доступу до Gemini API через Google AI Studio.

    <Steps>
      <Step title="Запустіть початкове налаштування">
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
    Змінні середовища `GEMINI_API_KEY` і `GOOGLE_API_KEY` приймаються обидві. Використовуйте ту, яку вже налаштовано.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Найкраще для:** повторного використання наявного входу Gemini CLI через PKCE OAuth замість окремого ключа API.

    <Warning>
    Провайдер `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
    повідомляють про обмеження облікового запису під час використання OAuth у такий спосіб. Використовуйте на власний ризик.
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

        OpenClaw підтримує як установлення через Homebrew, так і глобальне встановлення через npm, зокрема
        поширені макети Windows/npm.
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

    Ідентифікатор моделі Gemini API для Gemini 3.1 Pro — `gemini-3.1-pro-preview`. OpenClaw приймає коротший `google/gemini-3.1-pro` як зручний псевдонім і нормалізує його перед викликами провайдера.

    **Змінні середовища:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Або варіанти `GEMINI_CLI_*`.)

    <Note>
    Якщо запити Gemini CLI OAuth не виконуються після входу, задайте `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway і повторіть спробу.
    </Note>

    <Note>
    Якщо вхід завершується помилкою до запуску потоку в браузері, переконайтеся, що локальну команду `gemini`
    встановлено і вона є в `PATH`.
    </Note>

    Посилання на моделі `google-gemini-cli/*` є застарілими псевдонімами сумісності. Нові
    конфігурації мають використовувати посилання на моделі `google/*` плюс середовище виконання `google-gemini-cli`,
    коли потрібне локальне виконання Gemini CLI.

  </Tab>
</Tabs>

## Можливості

| Можливість             | Підтримується                |
| ---------------------- | ----------------------------- |
| Чат-доповнення         | Так                           |
| Генерація зображень    | Так                           |
| Генерація музики       | Так                           |
| Перетворення тексту на мовлення | Так                    |
| Голос у реальному часі | Так (Google Live API)         |
| Розуміння зображень    | Так                           |
| Транскрипція аудіо     | Так                           |
| Розуміння відео        | Так                           |
| Вебпошук (Grounding)   | Так                           |
| Мислення/міркування    | Так (Gemini 2.5+ / Gemini 3+) |
| Моделі Gemma 4         | Так                           |

<Tip>
Моделі Gemini 3 використовують `thinkingLevel` замість `thinkingBudget`. OpenClaw зіставляє
керування міркуванням для Gemini 3, Gemini 3.1 і псевдонімів `gemini-*-latest` із
`thinkingLevel`, щоб запуски за замовчуванням або з малою затримкою не надсилали вимкнені
значення `thinkingBudget`.

`/think adaptive` зберігає динамічну семантику мислення Google замість вибору
фіксованого рівня OpenClaw. Gemini 3 і Gemini 3.1 не передають фіксований `thinkingLevel`, щоб
Google міг вибрати рівень; Gemini 2.5 надсилає динамічний маркер Google
`thinkingBudget: -1`.

Моделі Gemma 4 (наприклад `gemma-4-26b-a4b-it`) підтримують режим мислення. OpenClaw
переписує `thinkingBudget` у підтримуваний Google `thinkingLevel` для Gemma 4.
Якщо встановити мислення на `off`, воно залишається вимкненим замість зіставлення з
`MINIMAL`.
</Tip>

## Генерація зображень

Вбудований провайдер генерації зображень `google` за замовчуванням використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримує `google/gemini-3-pro-image-preview`
- Генерація: до 4 зображень на запит
- Режим редагування: увімкнений, до 5 вхідних зображень
- Керування геометрією: `size`, `aspectRatio` і `resolution`

Щоб використовувати Google як провайдера зображень за замовчуванням:

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
Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки перемикання після збою.
</Note>

## Генерація відео

Вбудований Plugin `google` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: текст-у-відео, зображення-у-відео та потоки з посиланням на одне відео
- Підтримує `aspectRatio`, `resolution` і `audio`
- Поточне обмеження тривалості: **від 4 до 8 секунд**

Щоб використовувати Google як провайдера відео за замовчуванням:

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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки перемикання після збою.
</Note>

## Генерація музики

Вбудований Plugin `google` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Модель музики за замовчуванням: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування промптом: `lyrics` і `instrumental`
- Формат виводу: `mp3` за замовчуванням, а також `wav` у `google/lyria-3-pro-preview`
- Референсні входи: до 10 зображень
- Запуски, підтримувані сеансом, від’єднуються через спільний потік завдань/статусу, зокрема `action: "status"`

Щоб використовувати Google як провайдера музики за замовчуванням:

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
Див. [Генерація музики](/uk/tools/music-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки перемикання після збою.
</Note>

## Перетворення тексту на мовлення

Вбудований мовленнєвий провайдер `google` використовує шлях TTS Gemini API з
`gemini-3.1-flash-tts-preview`.

- Голос за замовчуванням: `Kore`
- Автентифікація: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Вивід: WAV для звичайних вкладень TTS, Opus для цілей голосових нотаток, PCM для Talk/телефонії
- Вивід голосової нотатки: Google PCM обгортається як WAV і транскодується в Opus 48 кГц за допомогою `ffmpeg`

Щоб використовувати Google як провайдера TTS за замовчуванням:

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

Gemini API TTS використовує промпти природною мовою для керування стилем. Установіть
`audioProfile`, щоб додавати багаторазовий стильовий промпт перед озвучуваним текстом. Установіть
`speakerName`, коли текст промпта посилається на іменованого мовця.

Gemini API TTS також приймає виразні аудіотеги у квадратних дужках у тексті,
наприклад `[whispers]` або `[laughs]`. Щоб теги не відображалися у видимій відповіді чату,
але надсилалися до TTS, помістіть їх у блок `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Ключ API Google Cloud Console, обмежений Gemini API, є дійсним для цього
провайдера. Це не окремий шлях Cloud Text-to-Speech API.
</Note>

## Голос у реальному часі

Вбудований Plugin `google` реєструє провайдера голосу в реальному часі на базі
Gemini Live API для бекендних аудіомостів, таких як Voice Call і Google Meet.

| Налаштування          | Шлях конфігурації                                                | Значення за замовчуванням                                                              |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Модель                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Голос                 | `...google.voice`                                                   | `Kore`                                                                                |
| Температура           | `...google.temperature`                                             | (не задано)                                                                           |
| Чутливість початку VAD | `...google.startSensitivity`                                       | (не задано)                                                                           |
| Чутливість завершення VAD | `...google.endSensitivity`                                      | (не задано)                                                                           |
| Тривалість тиші       | `...google.silenceDurationMs`                                       | (не задано)                                                                           |
| Обробка активності    | `...google.activityHandling`                                        | Значення Google за замовчуванням, `start-of-activity-interrupts`                      |
| Покриття репліки      | `...google.turnCoverage`                                            | Значення Google за замовчуванням, `only-activity`                                     |
| Вимкнути автоматичний VAD | `...google.automaticActivityDetectionDisabled`                  | `false`                                                                               |
| Ключ API              | `...google.apiKey`                                                  | Повертається до `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

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
Google Live API використовує двоспрямоване аудіо та виклик функцій через WebSocket.
OpenClaw адаптує аудіо телефонії/моста Meet до потоку PCM Live API від Gemini і
зберігає виклики інструментів у спільному контракті голосу в реальному часі. Залишайте `temperature`
невстановленим, якщо вам не потрібні зміни семплінгу; OpenClaw пропускає непозитивні значення,
оскільки Google Live може повертати транскрипти без аудіо для `temperature: 0`.
Транскрибування Gemini API вмикається без `languageCodes`; поточний Google
SDK відхиляє підказки кодів мов у цьому шляху API.
</Note>

<Note>
Control UI Talk підтримує браузерні сесії Google Live з обмеженими одноразовими
токенами. Провайдери голосу в реальному часі лише для бекенда також можуть працювати через загальний
транспорт ретрансляції Gateway, який зберігає облікові дані провайдера на Gateway.
</Note>

Для живої перевірки мейнтейнерами виконайте
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Гілка Google випускає токен Live API тієї самої обмеженої форми, яку використовує Control
UI Talk, відкриває браузерну кінцеву точку WebSocket, надсилає початкове корисне навантаження налаштування
і чекає на `setupComplete`.

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Пряме повторне використання кешу Gemini">
    Для прямих запусків Gemini API (`api: "google-generative-ai"`) OpenClaw
    передає налаштований дескриптор `cachedContent` до запитів Gemini.

    - Налаштуйте параметри для окремої моделі або глобально за допомогою
      `cachedContent` або застарілого `cached_content`
    - Якщо присутні обидва, перевагу має `cachedContent`
    - Приклад значення: `cachedContents/prebuilt-context`
    - Використання влучень кешу Gemini нормалізується в OpenClaw `cacheRead` з
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

  <Accordion title="Примітки щодо використання JSON у Gemini CLI">
    Під час використання OAuth-провайдера `google-gemini-cli` OpenClaw нормалізує
    JSON-вивід CLI так:

    - Текст відповіді береться з поля CLI JSON `response`.
    - Використання повертається до `stats`, коли CLI залишає `usage` порожнім.
    - `stats.cached` нормалізується в OpenClaw `cacheRead`.
    - Якщо `stats.input` відсутній, OpenClaw виводить вхідні токени з
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Налаштування середовища та демона">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `GEMINI_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента музики та вибір провайдера.
  </Card>
</CardGroup>
