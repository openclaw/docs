---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Потрібен ключ API або потік автентифікації OAuth
summary: Налаштування Google Gemini (ключ API + OAuth, генерація зображень, розуміння медіа, TTS, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-07T15:12:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9344307c0f20bf09d330ed82b8ffbd4dfa2592c869eb049c46191caa3ca141e
    source_path: providers/google.md
    workflow: 16
---

Плагін Google надає доступ до моделей Gemini через Google AI Studio, а також
генерацію зображень, розуміння медіа (зображення/аудіо/відео), перетворення тексту на мовлення та вебпошук через
Gemini Grounding.

- Провайдер: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Опція середовища виконання: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  повторно використовує Gemini CLI OAuth, зберігаючи посилання на моделі канонічними як `google/*`.

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
    Змінні середовища `GEMINI_API_KEY` і `GOOGLE_API_KEY` підтримуються обидві. Використовуйте ту, яку вже налаштовано.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Найкраще для:** повторного використання наявного входу Gemini CLI через PKCE OAuth замість окремого ключа API.

    <Warning>
    Провайдер `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
    повідомляють про обмеження облікового запису під час використання OAuth таким способом. Використовуйте на власний ризик.
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

        OpenClaw підтримує встановлення через Homebrew і глобальні встановлення npm, зокрема
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
    Якщо запити Gemini CLI OAuth не вдаються після входу, установіть `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості gateway і повторіть спробу.
    </Note>

    <Note>
    Якщо вхід не вдається до запуску браузерного потоку, переконайтеся, що локальну команду `gemini`
    встановлено і вона є в `PATH`.
    </Note>

    Посилання на моделі `google-gemini-cli/*` є псевдонімами для сумісності зі старими конфігураціями. Нові
    конфігурації мають використовувати посилання на моделі `google/*` плюс середовище виконання `google-gemini-cli`,
    коли потрібно локальне виконання Gemini CLI.

  </Tab>
</Tabs>

## Можливості

| Можливість             | Підтримується                |
| ---------------------- | ---------------------------- |
| Завершення чату        | Так                          |
| Генерація зображень    | Так                          |
| Генерація музики       | Так                          |
| Перетворення тексту на мовлення | Так                  |
| Голос у реальному часі | Так (Google Live API)        |
| Розуміння зображень    | Так                          |
| Транскрипція аудіо     | Так                          |
| Розуміння відео        | Так                          |
| Вебпошук (Grounding)   | Так                          |
| Мислення/міркування    | Так (Gemini 2.5+ / Gemini 3+) |
| Моделі Gemma 4         | Так                          |

## Вебпошук

Вбудований провайдер вебпошуку `gemini` використовує Google Search grounding у Gemini.
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

Пріоритет облікових даних: спеціальний `webSearch.apiKey`, потім `GEMINI_API_KEY`,
потім `models.providers.google.apiKey`. `webSearch.baseUrl` необов’язковий і
існує для операторських проксі або сумісних кінцевих точок Gemini API; якщо його не вказано,
вебпошук Gemini повторно використовує `models.providers.google.baseUrl`. Див.
[пошук Gemini](/uk/tools/gemini-search) щодо поведінки інструмента, специфічної для провайдера.

<Tip>
Моделі Gemini 3 використовують `thinkingLevel` замість `thinkingBudget`. OpenClaw зіставляє
керування міркуванням для псевдонімів Gemini 3, Gemini 3.1 і `gemini-*-latest` з
`thinkingLevel`, щоб запуски за замовчуванням або з низькою затримкою не надсилали вимкнені
значення `thinkingBudget`.

`/think adaptive` зберігає семантику динамічного мислення Google замість вибору
фіксованого рівня OpenClaw. Gemini 3 і Gemini 3.1 пропускають фіксований `thinkingLevel`, щоб
Google міг вибрати рівень; Gemini 2.5 надсилає динамічний sentinel Google
`thinkingBudget: -1`.

Моделі Gemma 4 (наприклад, `gemma-4-26b-a4b-it`) підтримують режим мислення. OpenClaw
перезаписує `thinkingBudget` у підтримуваний Google `thinkingLevel` для Gemma 4.
Установлення мислення в `off` зберігає мислення вимкненим замість зіставлення з
`MINIMAL`.
</Tip>

## Генерація зображень

Вбудований провайдер генерації зображень `google` за замовчуванням використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримує `google/gemini-3-pro-image-preview`
- Генерація: до 4 зображень на запит
- Режим редагування: увімкнено, до 5 вхідних зображень
- Керування геометрією: `size`, `aspectRatio` і `resolution`

Щоб використовувати Google як стандартного провайдера зображень:

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
Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Генерація відео

Вбудований Plugin `google` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: text-to-video, image-to-video і потоки з посиланням на одне відео
- Підтримує `aspectRatio`, `resolution` і `audio`
- Поточне обмеження тривалості: **від 4 до 8 секунд**

Щоб використовувати Google як стандартного провайдера відео:

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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Генерація музики

Вбудований Plugin `google` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Модель музики за замовчуванням: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування prompt: `lyrics` і `instrumental`
- Формат виводу: `mp3` за замовчуванням, а також `wav` на `google/lyria-3-pro-preview`
- Вхідні посилання: до 10 зображень
- Запуски на основі сесії від’єднуються через спільний потік завдання/статусу, зокрема `action: "status"`

Щоб використовувати Google як стандартного провайдера музики:

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
Див. [Генерація музики](/uk/tools/music-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Перетворення тексту на мовлення

Вбудований провайдер мовлення `google` використовує шлях TTS Gemini API з
`gemini-3.1-flash-tts-preview`.

- Голос за замовчуванням: `Kore`
- Автентифікація: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Вивід: WAV для звичайних вкладень TTS, Opus для цілей голосових нотаток, PCM для Talk/телефонії
- Вивід голосових нотаток: Google PCM обгортається як WAV і транскодується в Opus 48 кГц за допомогою `ffmpeg`

Пакетний шлях Gemini TTS від Google повертає згенероване аудіо в завершеній
відповіді `generateContent`. Для розмов голосом із найнижчою затримкою використовуйте
провайдер голосу Google у реальному часі на основі Gemini Live API замість пакетного
TTS.

Щоб використовувати Google як стандартного провайдера TTS:

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

Gemini API TTS використовує prompt природною мовою для керування стилем. Установіть
`audioProfile`, щоб додати багаторазовий стильовий prompt перед озвучуваним текстом. Установіть
`speakerName`, коли текст prompt посилається на іменованого мовця.

Gemini API TTS також приймає виразні аудіотеги в квадратних дужках у тексті,
наприклад `[whispers]` або `[laughs]`. Щоб теги не відображалися у видимій відповіді чату,
але надсилалися до TTS, помістіть їх у блок `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Ключ API Google Cloud Console, обмежений Gemini API, чинний для цього
провайдера. Це не окремий шлях Cloud Text-to-Speech API.
</Note>

## Голос у реальному часі

Вбудований Plugin `google` реєструє провайдера голосу в реальному часі на основі
Gemini Live API для бекенд-аудіомостів, таких як Voice Call і Google Meet.

| Налаштування              | Шлях конфігурації                                                   | Типове значення                                                                       |
| ------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Модель                    | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Голос                     | `...google.voice`                                                   | `Kore`                                                                                |
| Температура               | `...google.temperature`                                             | (не задано)                                                                           |
| Чутливість початку VAD    | `...google.startSensitivity`                                        | (не задано)                                                                           |
| Чутливість завершення VAD | `...google.endSensitivity`                                          | (не задано)                                                                           |
| Тривалість тиші           | `...google.silenceDurationMs`                                       | (не задано)                                                                           |
| Обробка активності        | `...google.activityHandling`                                        | Стандартне значення Google, `start-of-activity-interrupts`                            |
| Охоплення репліки         | `...google.turnCoverage`                                            | Стандартне значення Google, `only-activity`                                           |
| Вимкнути автоматичний VAD | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Відновлення сеансу        | `...google.sessionResumption`                                       | `true`                                                                                |
| Стиснення контексту       | `...google.contextWindowCompression`                                | `true`                                                                                |
| Ключ API                  | `...google.apiKey`                                                  | Повертається до `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

Приклад конфігурації реального часу для голосового виклику:

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
OpenClaw адаптує аудіо телефонії/моста Meet до PCM-потоку Live API Gemini та
зберігає виклики інструментів у спільному контракті голосу в реальному часі. Залиште `temperature`
незаданою, якщо вам не потрібні зміни семплінгу; OpenClaw пропускає непозитивні значення,
оскільки Google Live може повертати транскрипти без аудіо для `temperature: 0`.
Транскрипцію Gemini API увімкнено без `languageCodes`; поточний Google
SDK відхиляє підказки кодів мов на цьому шляху API.
</Note>

<Note>
Control UI Talk підтримує браузерні сеанси Google Live з обмеженими одноразовими
токенами. Backend-only провайдери голосу в реальному часі також можуть працювати через загальний
ретрансляційний транспорт Gateway, який зберігає облікові дані провайдера на Gateway.
</Note>

Для live-перевірки супровідником запустіть
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Гілка Google створює той самий обмежений формат токена Live API, який використовує Control
UI Talk, відкриває браузерну кінцеву точку WebSocket, надсилає початковий payload налаштування
і чекає на `setupComplete`.

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Пряме повторне використання кешу Gemini">
    Для прямих запусків Gemini API (`api: "google-generative-ai"`) OpenClaw
    передає налаштований handle `cachedContent` у запити Gemini.

    - Налаштуйте параметри для моделі або глобальні параметри за допомогою
      `cachedContent` або застарілого `cached_content`
    - Якщо наявні обидва, перемагає `cachedContent`
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

  <Accordion title="Примітки щодо використання JSON Gemini CLI">
    Під час використання OAuth-провайдера `google-gemini-cli` OpenClaw нормалізує
    JSON-вивід CLI так:

    - Текст відповіді береться з поля `response` у JSON CLI.
    - Використання повертається до `stats`, коли CLI залишає `usage` порожнім.
    - `stats.cached` нормалізується в OpenClaw `cacheRead`.
    - Якщо `stats.input` відсутній, OpenClaw виводить вхідні токени з
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Середовище та налаштування демона">
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
