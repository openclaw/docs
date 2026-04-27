---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібен API-ключ або потік автентифікації OAuth
summary: Налаштування Google Gemini (API-ключ + OAuth, генерація зображень, розуміння медіа, TTS, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-27T06:52:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7130cd7e13a4ca76572572bb77f1926be0fbe1fa4e1d3c0f9619d31ba564a163
    source_path: providers/google.md
    workflow: 15
---

Плагін Google надає доступ до моделей Gemini через Google AI Studio, а також до
генерації зображень, розуміння медіа (зображення/аудіо/відео), перетворення тексту на мовлення та вебпошуку через
Gemini Grounding.

- Провайдер: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Параметр середовища виконання: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  повторно використовує OAuth Gemini CLI, зберігаючи канонічні посилання на моделі як `google/*`.

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key">
    **Найкраще підходить для:** стандартного доступу до Gemini API через Google AI Studio.

    <Steps>
      <Step title="Run onboarding">
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
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Змінні середовища `GEMINI_API_KEY` і `GOOGLE_API_KEY` обидві підтримуються. Використовуйте ту, яку у вас уже налаштовано.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Найкраще підходить для:** повторного використання наявного входу Gemini CLI через PKCE OAuth замість окремого API-ключа.

    <Warning>
    Провайдер `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
    повідомляють про обмеження акаунта під час використання OAuth таким способом. Використовуйте на власний ризик.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        Локальна команда `gemini` має бути доступною в `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # або npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw підтримує як встановлення через Homebrew, так і глобальні встановлення npm, зокрема
        типові схеми Windows/npm.
      </Step>
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Модель за замовчуванням: `google/gemini-3.1-pro-preview`
    - Середовище виконання: `google-gemini-cli`
    - Псевдонім: `gemini-cli`

    **Змінні середовища:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Або варіанти `GEMINI_CLI_*`.)

    <Note>
    Якщо запити OAuth Gemini CLI не вдаються після входу, установіть `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості шлюзу й повторіть спробу.
    </Note>

    <Note>
    Якщо вхід завершується помилкою до запуску браузерного потоку, переконайтеся, що локальну команду `gemini`
    встановлено й додано до `PATH`.
    </Note>

    Посилання на моделі `google-gemini-cli/*` — це застарілі псевдоніми сумісності. Нові
    конфігурації мають використовувати посилання на моделі `google/*` разом із середовищем виконання `google-gemini-cli`,
    якщо потрібне локальне виконання Gemini CLI.

  </Tab>
</Tabs>

## Можливості

| Можливість            | Підтримка                      |
| --------------------- | ------------------------------ |
| Завершення чату       | Так                            |
| Генерація зображень   | Так                            |
| Генерація музики      | Так                            |
| Перетворення тексту на мовлення | Так                  |
| Голос у реальному часі| Так (Google Live API)          |
| Розуміння зображень   | Так                            |
| Транскрибування аудіо | Так                            |
| Розуміння відео       | Так                            |
| Вебпошук (Grounding)  | Так                            |
| Мислення/міркування   | Так (Gemini 2.5+ / Gemini 3+)  |
| Моделі Gemma 4        | Так                            |

<Tip>
Моделі Gemini 3 використовують `thinkingLevel` замість `thinkingBudget`. OpenClaw зіставляє
елементи керування міркуванням для Gemini 3, Gemini 3.1 і псевдонімів `gemini-*-latest` з
`thinkingLevel`, щоб типові запуски або запуски з низькою затримкою не надсилали вимкнені
значення `thinkingBudget`.

`/think adaptive` зберігає динамічну семантику мислення Google замість вибору
фіксованого рівня OpenClaw. Gemini 3 і Gemini 3.1 не передають фіксований `thinkingLevel`, щоб
Google могла вибрати рівень; Gemini 2.5 надсилає динамічний sentinel Google
`thinkingBudget: -1`.

Моделі Gemma 4 (наприклад, `gemma-4-26b-a4b-it`) підтримують режим мислення. OpenClaw
перезаписує `thinkingBudget` на підтримуваний Google `thinkingLevel` для Gemma 4.
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
Див. [Генерація зображень](/uk/tools/image-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою резервного перемикання.
</Note>

## Генерація відео

Вбудований Plugin `google` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: текст у відео, зображення у відео та потоки з одним еталонним відео
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
Див. [Генерація відео](/uk/tools/video-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою резервного перемикання.
</Note>

## Генерація музики

Вбудований Plugin `google` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Модель музики за замовчуванням: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування підказкою: `lyrics` і `instrumental`
- Формат виводу: `mp3` за замовчуванням, а також `wav` для `google/lyria-3-pro-preview`
- Еталонні вхідні дані: до 10 зображень
- Запуски з підтримкою сесій від’єднуються через спільний потік завдань/стану, зокрема `action: "status"`

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
Див. [Генерація музики](/uk/tools/music-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою резервного перемикання.
</Note>

## Перетворення тексту на мовлення

Вбудований мовленнєвий провайдер `google` використовує шлях TTS Gemini API з
`gemini-3.1-flash-tts-preview`.

- Голос за замовчуванням: `Kore`
- Автентифікація: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Вивід: WAV для звичайних вкладень TTS, Opus для цілей голосових нотаток, PCM для Talk/телефонії
- Вивід голосових нотаток: Google PCM обгортається у WAV і перекодовується в 48 кГц Opus за допомогою `ffmpeg`

Щоб використовувати Google як TTS-провайдера за замовчуванням:

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
`audioProfile`, щоб додавати багаторазово використовувану підказку стилю перед озвученим текстом. Установіть
`speakerName`, якщо текст вашої підказки посилається на іменованого мовця.

TTS Gemini API також приймає виразні аудіотеги в квадратних дужках у тексті,
наприклад `[whispers]` або `[laughs]`. Щоб не показувати теги у видимій відповіді чату,
але надсилати їх у TTS, помістіть їх у блок `[[tts:text]]...[[/tts:text]]`:

```text
Тут чистий текст відповіді.

[[tts:text]][whispers] Тут озвучена версія.[[/tts:text]]
```

<Note>
API-ключ Google Cloud Console, обмежений Gemini API, є дійсним для цього
провайдера. Це не окремий шлях Cloud Text-to-Speech API.
</Note>

## Голос у реальному часі

Вбудований Plugin `google` реєструє провайдера голосу в реальному часі на базі
Gemini Live API для серверних аудіомостів, таких як Voice Call і Google Meet.

| Налаштування          | Шлях конфігурації                                                   | За замовчуванням                                                                      |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Модель                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Голос                 | `...google.voice`                                                   | `Kore`                                                                                |
| Температура           | `...google.temperature`                                             | (не встановлено)                                                                      |
| Чутливість початку VAD| `...google.startSensitivity`                                        | (не встановлено)                                                                      |
| Чутливість завершення VAD | `...google.endSensitivity`                                      | (не встановлено)                                                                      |
| Тривалість тиші       | `...google.silenceDurationMs`                                       | (не встановлено)                                                                      |
| Обробка активності    | `...google.activityHandling`                                        | Значення Google за замовчуванням, `start-of-activity-interrupts`                      |
| Охоплення ходу        | `...google.turnCoverage`                                            | Значення Google за замовчуванням, `only-activity`                                     |
| Вимкнути автоматичний VAD | `...google.automaticActivityDetectionDisabled`                  | `false`                                                                               |
| API-ключ              | `...google.apiKey`                                                  | Резервно використовує `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

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
Google Live API використовує двонапрямне аудіо та виклик функцій через WebSocket.
OpenClaw адаптує аудіо телекомунікаційного/Meet-моста до потоку PCM Live API Gemini і
зберігає виклики інструментів у спільному контракті голосу в реальному часі. Залишайте `temperature`
не встановленим, якщо вам не потрібні зміни семплювання; OpenClaw пропускає недодатні значення,
оскільки Google Live може повертати транскрипти без аудіо для `temperature: 0`.
Транскрибування Gemini API увімкнено без `languageCodes`; поточний Google
SDK відхиляє підказки кодів мов у цьому шляху API.
</Note>

<Note>
Сеанси браузера Talk у Control UI усе ще потребують провайдера голосу в реальному часі з
реалізацією браузерного сеансу WebRTC. Сьогодні цим шляхом є OpenAI Realtime; провайдер
Google призначений для серверних мостів реального часу.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    Для прямих запусків Gemini API (`api: "google-generative-ai"`), OpenClaw
    передає налаштований дескриптор `cachedContent` у запити Gemini.

    - Налаштовуйте параметри для моделі або глобально через
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

  <Accordion title="Gemini CLI JSON usage notes">
    Під час використання OAuth-провайдера `google-gemini-cli` OpenClaw нормалізує
    JSON-вивід CLI таким чином:

    - Текст відповіді береться з поля CLI JSON `response`.
    - Використання резервно береться зі `stats`, якщо CLI залишає `usage` порожнім.
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
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Image generation" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Video generation" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір провайдера.
  </Card>
  <Card title="Music generation" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента музики і вибір провайдера.
  </Card>
</CardGroup>
