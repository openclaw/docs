---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібен API-ключ або сценарій автентифікації OAuth
summary: Налаштування Google Gemini (API-ключ + OAuth, генерація зображень, розуміння медіа, TTS, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-25T05:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: de0d6563d1c7a25fe26aa7ce255b1d3ed80e950b7761039e6d0a76f23a14e6f3
    source_path: providers/google.md
    workflow: 15
---

Plugin `google` надає доступ до моделей Gemini через Google AI Studio, а також
генерацію зображень, розуміння медіа (зображення/аудіо/відео), перетворення тексту на мовлення та вебпошук через
Gemini Grounding.

- Постачальник: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Параметр середовища виконання: `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`
  повторно використовує OAuth Gemini CLI, зберігаючи канонічні посилання на моделі як `google/*`.

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API-ключ">
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
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Обидві змінні середовища `GEMINI_API_KEY` і `GOOGLE_API_KEY` підтримуються. Використовуйте ту, яку вже налаштовано у вас.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Найкраще для:** повторного використання наявного входу Gemini CLI через PKCE OAuth замість окремого API-ключа.

    <Warning>
    Постачальник `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
    повідомляють про обмеження облікового запису при такому використанні OAuth. Використовуйте на власний ризик.
    </Warning>

    <Steps>
      <Step title="Встановіть Gemini CLI">
        Локальна команда `gemini` має бути доступною в `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # або npm
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
      <Step title="Переконайтеся, що модель доступна">
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
    Якщо запити Gemini CLI OAuth не вдаються після входу, задайте `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості gateway і повторіть спробу.
    </Note>

    <Note>
    Якщо вхід не вдається ще до запуску сценарію браузера, переконайтеся, що локальну команду `gemini`
    встановлено і вона є в `PATH`.
    </Note>

    Посилання на моделі `google-gemini-cli/*` — це застарілі псевдоніми сумісності. Нові
    конфігурації мають використовувати посилання на моделі `google/*` плюс середовище виконання `google-gemini-cli`,
    коли потрібне локальне виконання Gemini CLI.

  </Tab>
</Tabs>

## Можливості

| Можливість            | Підтримується                |
| --------------------- | ---------------------------- |
| Завершення чату       | Так                          |
| Генерація зображень   | Так                          |
| Генерація музики      | Так                          |
| Перетворення тексту на мовлення | Так                |
| Голос у реальному часі | Так (Google Live API)      |
| Розуміння зображень   | Так                          |
| Транскрипція аудіо    | Так                          |
| Розуміння відео       | Так                          |
| Вебпошук (Grounding)  | Так                          |
| Thinking/reasoning    | Так (Gemini 2.5+ / Gemini 3+) |
| Моделі Gemma 4        | Так                          |

<Tip>
Моделі Gemini 3 використовують `thinkingLevel`, а не `thinkingBudget`. OpenClaw зіставляє
керування reasoning для Gemini 3, Gemini 3.1 і псевдонімів `gemini-*-latest` із
`thinkingLevel`, щоб запуск за замовчуванням/із низькою затримкою не надсилав вимкнені
значення `thinkingBudget`.

`/think adaptive` зберігає динамічну семантику thinking від Google замість вибору
фіксованого рівня OpenClaw. Gemini 3 і Gemini 3.1 не задають фіксований `thinkingLevel`, тому
Google може вибрати рівень; Gemini 2.5 надсилає динамічний sentinel Google
`thinkingBudget: -1`.

Моделі Gemma 4 (наприклад, `gemma-4-26b-a4b-it`) підтримують режим thinking. OpenClaw
переписує `thinkingBudget` у підтримуваний Google `thinkingLevel` для Gemma 4.
Якщо встановити thinking у `off`, thinking залишиться вимкненим замість зіставлення з
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
Спільні параметри інструмента, вибір постачальника й поведінку failover див. у [Image Generation](/uk/tools/image-generation).
</Note>

## Генерація відео

Вбудований Plugin `google` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: text-to-video, image-to-video і сценарії з одним еталонним відео
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
Спільні параметри інструмента, вибір постачальника й поведінку failover див. у [Video Generation](/uk/tools/video-generation).
</Note>

## Генерація музики

Вбудований Plugin `google` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Модель музики за замовчуванням: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування промптом: `lyrics` і `instrumental`
- Формат виводу: `mp3` за замовчуванням, а також `wav` для `google/lyria-3-pro-preview`
- Еталонні входи: до 10 зображень
- Запуски з опорою на сесію відокремлюються через спільний потік task/status, включно з `action: "status"`

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
Спільні параметри інструмента, вибір постачальника й поведінку failover див. у [Music Generation](/uk/tools/music-generation).
</Note>

## Перетворення тексту на мовлення

Вбудований постачальник мовлення `google` використовує шлях Gemini API TTS з
`gemini-3.1-flash-tts-preview`.

- Голос за замовчуванням: `Kore`
- Автентифікація: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Вивід: WAV для звичайних вкладень TTS, PCM для Talk/телефонії
- Нативний вивід голосових нотаток: не підтримується на цьому шляху Gemini API, оскільки API повертає PCM, а не Opus

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

Gemini API TTS використовує промпти природною мовою для керування стилем. Задайте
`audioProfile`, щоб додати повторно використовуваний стильовий промпт перед озвучуваним текстом. Задайте
`speakerName`, якщо текст вашого промпту посилається на іменованого мовця.

Gemini API TTS також приймає виразні квадратні аудіотеги в тексті,
такі як `[whispers]` або `[laughs]`. Щоб теги не потрапляли у видиму відповідь чату,
але надсилалися в TTS, помістіть їх у блок `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
API-ключ Google Cloud Console, обмежений Gemini API, є дійсним для цього
постачальника. Це не окремий шлях Cloud Text-to-Speech API.
</Note>

## Голос у реальному часі

Вбудований Plugin `google` реєструє постачальника голосу в реальному часі на основі
Gemini Live API для серверних аудіомостів, таких як Voice Call і Google Meet.

| Налаштування          | Шлях конфігурації                                                   | За замовчуванням                                                                        |
| --------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Модель                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                         |
| Голос                 | `...google.voice`                                                   | `Kore`                                                                                  |
| Temperature           | `...google.temperature`                                             | (не задано)                                                                             |
| Чутливість початку VAD | `...google.startSensitivity`                                       | (не задано)                                                                             |
| Чутливість завершення VAD | `...google.endSensitivity`                                      | (не задано)                                                                             |
| Тривалість тиші       | `...google.silenceDurationMs`                                       | (не задано)                                                                             |
| API-ключ              | `...google.apiKey`                                                  | Резервно береться з `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

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
OpenClaw адаптує аудіо мостів телефонії/Meet до PCM-потоку Live API Gemini і
зберігає виклики інструментів у межах спільного контракту голосу в реальному часі. Залишайте `temperature`
не заданим, якщо вам не потрібні зміни семплування; OpenClaw не надсилає непозитивні значення,
оскільки Google Live може повертати транскрипти без аудіо при `temperature: 0`.
Транскрипція Gemini API вмикається без `languageCodes`; поточний SDK Google
відхиляє підказки з кодами мов на цьому шляху API.
</Note>

<Note>
Сеанси браузера Talk у Control UI все ще потребують постачальника голосу в реальному часі з
реалізацією браузерної сесії WebRTC. Наразі цим шляхом є OpenAI Realtime; постачальник
Google призначений для серверних мостів реального часу.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Пряме повторне використання кешу Gemini">
    Для прямих запусків Gemini API (`api: "google-generative-ai"`) OpenClaw
    передає налаштований дескриптор `cachedContent` безпосередньо в запити Gemini.

    - Налаштуйте параметри для окремої моделі або глобально за допомогою
      `cachedContent` або застарілого `cached_content`
    - Якщо присутні обидва, пріоритет має `cachedContent`
    - Приклад значення: `cachedContents/prebuilt-context`
    - Використання кеш-влучань Gemini нормалізується в OpenClaw `cacheRead` з
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

  <Accordion title="Примітки щодо використання JSON Gemini CLI">
    При використанні постачальника OAuth `google-gemini-cli` OpenClaw нормалізує
    JSON-вивід CLI таким чином:

    - Текст відповіді береться з поля CLI JSON `response`.
    - Використання резервно береться з `stats`, коли CLI залишає `usage` порожнім.
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
    Вибір постачальників, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір постачальника.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір постачальника.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента музики і вибір постачальника.
  </Card>
</CardGroup>
