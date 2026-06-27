---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібен API-ключ або потік автентифікації OAuth
summary: Налаштування Google Gemini (API-ключ + OAuth, генерація зображень, розуміння медіа, TTS, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-06-27T18:11:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eced20b11cc702d803992d96dcc5edb8f06640f6baffbc65dab504a6c91776bc
    source_path: providers/google.md
    workflow: 16
---

Plugin Google надає доступ до моделей Gemini через Google AI Studio, а також
генерацію зображень, розуміння медіа (зображення/аудіо/відео), перетворення тексту на мовлення та вебпошук через
Gemini Grounding.

- Провайдер: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Опція runtime: provider/model `agentRuntime.id: "google-gemini-cli"`
  повторно використовує OAuth Gemini CLI, зберігаючи посилання на моделі канонічними як `google/*`.

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key">
    **Найкраще для:** стандартного доступу до Gemini API через Google AI Studio.

    <Steps>
      <Step title="Запустіть onboarding">
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
    Змінні середовища `GEMINI_API_KEY` і `GOOGLE_API_KEY` обидві підтримуються. Використовуйте ту, яку вже налаштовано.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Найкраще для:** повторного використання наявного входу Gemini CLI через PKCE OAuth замість окремого API key.

    <Warning>
    Провайдер `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
    повідомляють про обмеження облікових записів під час використання OAuth у такий спосіб. Використовуйте на власний ризик.
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

        OpenClaw підтримує як встановлення через Homebrew, так і глобальні встановлення npm, зокрема
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
    - Runtime: `google-gemini-cli`
    - Псевдонім: `gemini-cli`

    Ідентифікатор моделі Gemini API для Gemini 3.1 Pro — `gemini-3.1-pro-preview`. OpenClaw для зручності приймає коротший `google/gemini-3.1-pro` як псевдонім і нормалізує його перед викликами провайдера.

    **Змінні середовища:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Або варіанти `GEMINI_CLI_*`.)

    <Note>
    Якщо запити Gemini CLI OAuth завершуються помилкою після входу, задайте `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості gateway і повторіть спробу.
    </Note>

    <Note>
    Якщо вхід не вдається до запуску браузерного flow, переконайтеся, що локальна команда `gemini`
    встановлена й доступна в `PATH`.
    </Note>

    Посилання на моделі `google-gemini-cli/*` є застарілими псевдонімами сумісності. Нові
    конфігурації мають використовувати посилання на моделі `google/*` плюс runtime `google-gemini-cli`,
    коли потрібне локальне виконання Gemini CLI.

  </Tab>
</Tabs>

## Можливості

| Можливість             | Підтримується                 |
| ---------------------- | ----------------------------- |
| Завершення чату        | Так                           |
| Генерація зображень    | Так                           |
| Генерація музики       | Так                           |
| Text-to-speech         | Так                           |
| Голос у реальному часі | Так (Google Live API)         |
| Розуміння зображень    | Так                           |
| Транскрипція аудіо     | Так                           |
| Розуміння відео        | Так                           |
| Вебпошук (Grounding)   | Так                           |
| Мислення/міркування    | Так (Gemini 2.5+ / Gemini 3+) |
| Моделі Gemma 4         | Так                           |

## Вебпошук

Вбудований провайдер вебпошуку `gemini` використовує grounding Gemini Google Search.
Налаштуйте окремий ключ пошуку в `plugins.entries.google.config.webSearch`,
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

Пріоритет облікових даних: окремий `webSearch.apiKey`, потім `GEMINI_API_KEY`,
потім `models.providers.google.apiKey`. `webSearch.baseUrl` є необов’язковим і
призначений для операторських проксі або сумісних endpoint Gemini API; якщо його не вказано,
вебпошук Gemini повторно використовує `models.providers.google.baseUrl`. Див.
[Пошук Gemini](/uk/tools/gemini-search) щодо поведінки інструмента, специфічної для провайдера.

<Tip>
Моделі Gemini 3 використовують `thinkingLevel` замість `thinkingBudget`. OpenClaw зіставляє
елементи керування міркуванням для псевдонімів Gemini 3, Gemini 3.1 і `gemini-*-latest` з
`thinkingLevel`, щоб запуски за замовчуванням/із низькою затримкою не надсилали вимкнені
значення `thinkingBudget`.

`/think adaptive` зберігає динамічну семантику мислення Google замість вибору
фіксованого рівня OpenClaw. Gemini 3 і Gemini 3.1 пропускають фіксований `thinkingLevel`, щоб
Google міг вибрати рівень; Gemini 2.5 надсилає динамічний sentinel Google
`thinkingBudget: -1`.

Моделі Gemma 4 (наприклад `gemma-4-26b-a4b-it`) підтримують режим мислення. OpenClaw
переписує `thinkingBudget` у підтримуваний Google `thinkingLevel` для Gemma 4.
Установлення мислення в `off` зберігає мислення вимкненим замість зіставлення з
`MINIMAL`.
</Tip>

## Генерація зображень

Вбудований провайдер генерації зображень `google` за замовчуванням використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримує `google/gemini-3-pro-image-preview`
- Генерація: до 4 зображень на запит
- Режим редагування: увімкнений, до 5 вхідних зображень
- Елементи керування геометрією: `size`, `aspectRatio` і `resolution`

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
Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Генерація відео

Вбудований Plugin `google` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: text-to-video, image-to-video і flows посилань на одне відео
- Підтримує `aspectRatio` (`16:9`, `9:16`) і `resolution` (`720P`, `1080P`); аудіовихід наразі не підтримується Veo
- Підтримувані тривалості: **4, 6 або 8 секунд** (інші значення прив’язуються до найближчого дозволеного значення)

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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Генерація музики

Вбудований Plugin `google` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Модель музики за замовчуванням: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Елементи керування prompt: `lyrics` і `instrumental`
- Формат виводу: `mp3` за замовчуванням, а також `wav` на `google/lyria-3-pro-preview`
- Вхідні посилання: до 10 зображень
- Запуски з підтримкою сеансів від’єднуються через спільний flow завдань/статусу, зокрема `action: "status"`

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
Див. [Генерація музики](/uk/tools/music-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Text-to-speech

Вбудований мовленнєвий провайдер `google` використовує шлях TTS Gemini API з
`gemini-3.1-flash-tts-preview`.

- Голос за замовчуванням: `Kore`
- Автентифікація: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Вивід: WAV для звичайних вкладень TTS, Opus для цілей голосових нотаток, PCM для Talk/телефонії
- Вивід голосових нотаток: Google PCM обгортається як WAV і транскодується в Opus 48 кГц за допомогою `ffmpeg`

Шлях пакетного Gemini TTS від Google повертає згенероване аудіо в завершеній
відповіді `generateContent`. Для розмов із мовленням із найнижчою затримкою використовуйте
провайдера голосу Google у реальному часі на базі Gemini Live API замість пакетного
TTS.

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
          speakerVoice: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS використовує prompt природною мовою для керування стилем. Задайте
`audioProfile`, щоб додавати багаторазовий prompt стилю перед озвучуваним текстом. Задайте
`speakerName`, коли текст prompt посилається на іменованого мовця.

Gemini API TTS також приймає виразні аудіотеги у квадратних дужках у тексті,
як-от `[whispers]` або `[laughs]`. Щоб не показувати теги у видимій відповіді чату,
але надсилати їх до TTS, розмістіть їх усередині блока `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
API key Google Cloud Console, обмежений Gemini API, дійсний для цього
провайдера. Це не окремий шлях Cloud Text-to-Speech API.
</Note>

## Голос у реальному часі

Вбудований Plugin `google` реєструє провайдера голосу в реальному часі на базі
Gemini Live API для бекендових аудіомостів, таких як Voice Call і Google Meet.

| Налаштування                 | Шлях конфігурації                                                   | За замовчуванням                                                                     |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Модель                       | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Голос                        | `...google.voice`                                                   | `Kore`                                                                                |
| Температура                  | `...google.temperature`                                             | (не задано)                                                                           |
| Чутливість початку VAD       | `...google.startSensitivity`                                        | (не задано)                                                                           |
| Чутливість завершення VAD    | `...google.endSensitivity`                                          | (не задано)                                                                           |
| Тривалість тиші              | `...google.silenceDurationMs`                                       | (не задано)                                                                           |
| Обробка активності           | `...google.activityHandling`                                        | Стандартне значення Google, `start-of-activity-interrupts`                            |
| Покриття репліки             | `...google.turnCoverage`                                            | Стандартне значення Google, `only-activity`                                           |
| Вимкнути автоматичний VAD    | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Відновлення сеансу           | `...google.sessionResumption`                                       | `true`                                                                                |
| Стиснення контексту          | `...google.contextWindowCompression`                                | `true`                                                                                |
| Ключ API                     | `...google.apiKey`                                                  | Резервно використовує `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

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
                speakerVoice: "Kore",
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
Google Live API використовує двонапрямне аудіо та виклики функцій через WebSocket.
OpenClaw адаптує аудіо мосту телефонії/Meet до PCM-потоку Gemini Live API і
зберігає виклики інструментів у спільному контракті голосу в реальному часі. Залишайте `temperature`
незаданим, якщо вам не потрібні зміни семплінгу; OpenClaw пропускає непозитивні значення,
оскільки Google Live може повертати транскрипти без аудіо для `temperature: 0`.
Транскрибування Gemini API вмикається без `languageCodes`; поточний Google
SDK відхиляє підказки кодів мов у цьому шляху API.
</Note>

<Note>
Control UI Talk підтримує браузерні сеанси Google Live з обмеженими одноразовими
токенами. Серверні постачальники голосу в реальному часі також можуть працювати через універсальний
транспорт ретрансляції Gateway, який зберігає облікові дані постачальника на Gateway.
</Note>

Для live-перевірки супровідником запустіть
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Цей smoke також охоплює серверні/WebRTC-шляхи OpenAI; гілка Google створює такий самий
обмежений токен Live API, який використовує Control UI Talk, відкриває браузерну
кінцеву точку WebSocket, надсилає початкове навантаження налаштування та очікує на
`setupComplete`.

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

  <Accordion title="Gemini CLI usage notes">
    Під час використання OAuth-постачальника `google-gemini-cli` OpenClaw типово використовує
    вивід Gemini CLI `stream-json` і нормалізує використання з фінального
    навантаження `stats`. Застарілі перевизначення `--output-format json` і далі використовують
    JSON-парсер.

    - Потоковий текст відповіді надходить із подій assistant `message`.
    - Для застарілого JSON-виводу текст відповіді надходить із поля CLI JSON `response`.
    - Використання резервно береться зі `stats`, коли CLI залишає `usage` порожнім.
    - `stats.cached` нормалізується в OpenClaw `cacheRead`.
    - Якщо `stats.input` відсутній, OpenClaw виводить вхідні токени з
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
