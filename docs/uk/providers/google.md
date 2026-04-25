---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібен процес автентифікації за допомогою ключа API або OAuth
summary: Налаштування Google Gemini (ключ API + OAuth, генерація зображень, розуміння медіа, TTS, web search)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-25T00:03:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a3e8531d2cf58ac0f0c003d369be837576b4c2ff7d38e53cfb3f86ab8b44347
    source_path: providers/google.md
    workflow: 15
---

Plugin Google надає доступ до моделей Gemini через Google AI Studio, а також до генерації зображень, розуміння медіа (зображення/аудіо/відео), синтезу мовлення та web search через Gemini Grounding.

- Провайдер: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Параметр runtime: `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`
  повторно використовує OAuth Gemini CLI, зберігаючи канонічні посилання на моделі як `google/*`.

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Ключ API">
    **Найкраще для:** стандартного доступу до Gemini API через Google AI Studio.

    <Steps>
      <Step title="Запустіть онбординг">
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
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Змінні середовища `GEMINI_API_KEY` і `GOOGLE_API_KEY` обидві підтримуються. Використовуйте ту, яка вже налаштована у вас.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Найкраще для:** повторного використання наявного входу Gemini CLI через PKCE OAuth замість окремого ключа API.

    <Warning>
    Провайдер `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
    повідомляють про обмеження облікового запису при такому використанні OAuth. Використовуйте на власний ризик.
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

        OpenClaw підтримує як встановлення через Homebrew, так і глобальні встановлення через npm, включно з поширеними схемами Windows/npm.
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
    Якщо OAuth-запити Gemini CLI завершуються помилкою після входу, установіть `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway і повторіть спробу.
    </Note>

    <Note>
    Якщо вхід завершується помилкою до початку браузерного потоку, переконайтеся, що локальну команду `gemini`
    встановлено і вона є в `PATH`.
    </Note>

    Посилання на моделі `google-gemini-cli/*` є застарілими псевдонімами сумісності. У нових
    конфігураціях слід використовувати посилання на моделі `google/*` разом із runtime `google-gemini-cli`,
    коли потрібне локальне виконання Gemini CLI.

  </Tab>
</Tabs>

## Можливості

| Можливість            | Підтримка                     |
| --------------------- | ----------------------------- |
| Chat completions      | Так                           |
| Генерація зображень   | Так                           |
| Генерація музики      | Так                           |
| Синтез мовлення       | Так                           |
| Голос у реальному часі | Так (Google Live API)        |
| Розуміння зображень   | Так                           |
| Транскрипція аудіо    | Так                           |
| Розуміння відео       | Так                           |
| Web search (Grounding) | Так                          |
| Thinking/reasoning    | Так (Gemini 2.5+ / Gemini 3+) |
| Моделі Gemma 4        | Так                           |

<Tip>
Моделі Gemini 3 використовують `thinkingLevel` замість `thinkingBudget`. OpenClaw зіставляє
елементи керування reasoning для Gemini 3, Gemini 3.1 і псевдонімів `gemini-*-latest` з
`thinkingLevel`, щоб типові/низьколатентні запуски не надсилали вимкнені
значення `thinkingBudget`.

Моделі Gemma 4 (наприклад `gemma-4-26b-a4b-it`) підтримують режим thinking. OpenClaw
переписує `thinkingBudget` на підтримуваний Google `thinkingLevel` для Gemma 4.
Установлення thinking у `off` зберігає його вимкненим замість зіставлення з
`MINIMAL`.
</Tip>

## Генерація зображень

Вбудований провайдер генерації зображень `google` типово використовує
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
Спільні параметри інструмента, вибір провайдера та поведінку failover див. у [Генерація зображень](/uk/tools/image-generation).
</Note>

## Генерація відео

Вбудований Plugin `google` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: text-to-video, image-to-video і потоки з одним еталонним відео
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
Спільні параметри інструмента, вибір провайдера та поведінку failover див. у [Генерація відео](/uk/tools/video-generation).
</Note>

## Генерація музики

Вбудований Plugin `google` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Модель музики за замовчуванням: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування prompt: `lyrics` і `instrumental`
- Формат виводу: `mp3` за замовчуванням, а також `wav` для `google/lyria-3-pro-preview`
- Еталонні вхідні дані: до 10 зображень
- Запуски з підтримкою сеансів від’єднуються через спільний потік задачі/статусу, включно з `action: "status"`

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
Спільні параметри інструмента, вибір провайдера та поведінку failover див. у [Генерація музики](/uk/tools/music-generation).
</Note>

## Синтез мовлення

Вбудований провайдер мовлення `google` використовує шлях Gemini API TTS з
`gemini-3.1-flash-tts-preview`.

- Голос за замовчуванням: `Kore`
- Автентифікація: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Вивід: WAV для звичайних TTS-вкладень, PCM для Talk/телефонії
- Нативний вивід голосових нотаток: не підтримується на цьому шляху Gemini API, оскільки API повертає PCM, а не Opus

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
        },
      },
    },
  },
}
```

Gemini API TTS приймає виразні квадратні аудіотеги в тексті, наприклад
`[whispers]` або `[laughs]`. Щоб не показувати теги у видимій відповіді чату, але
надсилати їх до TTS, помістіть їх у блок `[[tts:text]]...[[/tts:text]]`:

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
Gemini Live API для серверних аудіомостів, таких як Voice Call і Google Meet.

| Параметр              | Шлях конфігурації                                                     | Значення за замовчуванням                                                           |
| --------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Модель                | `plugins.entries.voice-call.config.realtime.providers.google.model`   | `gemini-2.5-flash-native-audio-preview-12-2025`                                     |
| Голос                 | `...google.voice`                                                     | `Kore`                                                                              |
| Temperature           | `...google.temperature`                                               | (не встановлено)                                                                    |
| Чутливість початку VAD | `...google.startSensitivity`                                         | (не встановлено)                                                                    |
| Чутливість завершення VAD | `...google.endSensitivity`                                        | (не встановлено)                                                                    |
| Тривалість тиші       | `...google.silenceDurationMs`                                         | (не встановлено)                                                                    |
| Ключ API              | `...google.apiKey`                                                    | Резервно використовує `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

Приклад конфігурації Voice Call realtime:

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
OpenClaw адаптує аудіо телефонії/мосту Meet до PCM Live API потоку Gemini і
зберігає виклики інструментів у межах спільного контракту голосу в реальному часі. Залишайте `temperature`
не встановленим, якщо вам не потрібні зміни вибірки; OpenClaw пропускає непозитивні значення,
оскільки Google Live може повертати транскрипти без аудіо для `temperature: 0`.
Транскрипцію Gemini API увімкнено без `languageCodes`; поточний Google SDK
відхиляє підказки кодів мов на цьому шляху API.
</Note>

<Note>
Сеанси браузера Talk у Control UI і далі потребують провайдера голосу в реальному часі з
реалізацією браузерного сеансу WebRTC. Наразі цей шлях — OpenAI Realtime; провайдер
Google призначений для серверних realtime-мостів.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Пряме повторне використання кешу Gemini">
    Для прямих запусків Gemini API (`api: "google-generative-ai"`), OpenClaw
    передає налаштований дескриптор `cachedContent` до запитів Gemini.

    - Налаштуйте параметри для моделі або глобально через
      `cachedContent` або застарілий `cached_content`
    - Якщо присутні обидва, пріоритет має `cachedContent`
    - Приклад значення: `cachedContents/prebuilt-context`
    - Використання кеш-потрапляння Gemini нормалізується в OpenClaw `cacheRead` із
      висхідного `cachedContentTokenCount`

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
    При використанні OAuth-провайдера `google-gemini-cli` OpenClaw нормалізує
    JSON-вивід CLI так:

    - Текст відповіді береться з поля CLI JSON `response`.
    - Використання резервно береться з `stats`, якщо CLI залишає `usage` порожнім.
    - `stats.cached` нормалізується в OpenClaw `cacheRead`.
    - Якщо `stats.input` відсутній, OpenClaw обчислює вхідні токени з
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
    Спільні параметри інструмента відео і вибір провайдера.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента музики і вибір провайдера.
  </Card>
</CardGroup>
