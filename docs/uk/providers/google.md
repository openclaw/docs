---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібен API-ключ або потік автентифікації OAuth
summary: Налаштування Google Gemini (API-ключ + OAuth, генерація зображень, розуміння медіа, TTS, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-23T21:06:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: b43d7171f56ecdfb49a25256783433e64f99a02760b3bc6f0e1055195f556f5d
    source_path: providers/google.md
    workflow: 15
---

Plugin Google надає доступ до моделей Gemini через Google AI Studio, а також до
генерації зображень, розуміння медіа (image/audio/video), text-to-speech і web search через
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Альтернативний provider: `google-gemini-cli` (OAuth)

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

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
      <Step title="Установіть типову модель">
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
    Підтримуються обидві змінні середовища: `GEMINI_API_KEY` і `GOOGLE_API_KEY`. Використовуйте ту, яка у вас уже налаштована.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Найкраще для:** повторного використання наявного входу Gemini CLI через PKCE OAuth замість окремого API-ключа.

    <Warning>
    Provider `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
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
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Типова модель: `google-gemini-cli/gemini-3-flash-preview`
    - Псевдонім: `gemini-cli`

    **Змінні середовища:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Або варіанти `GEMINI_CLI_*`.)

    <Note>
    Якщо запити Gemini CLI OAuth не працюють після входу, задайте `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості gateway і повторіть спробу.
    </Note>

    <Note>
    Якщо вхід завершується помилкою до початку browser flow, переконайтеся, що локальну команду `gemini`
    встановлено й додано до `PATH`.
    </Note>

    Provider `google-gemini-cli`, який працює лише через OAuth, є окремою
    поверхнею text inference. Генерація зображень, розуміння медіа та Gemini Grounding залишаються на
    id provider `google`.

  </Tab>
</Tabs>

## Можливості

| Можливість             | Підтримується                  |
| ---------------------- | ------------------------------ |
| Chat completions       | Так                            |
| Генерація зображень    | Так                            |
| Генерація музики       | Так                            |
| Text-to-speech         | Так                            |
| Розуміння зображень    | Так                            |
| Транскрибування аудіо  | Так                            |
| Розуміння відео        | Так                            |
| Web search (Grounding) | Так                            |
| Thinking/reasoning     | Так (Gemini 2.5+ / Gemini 3+)  |
| Моделі Gemma 4         | Так                            |

<Tip>
Моделі Gemini 3 використовують `thinkingLevel`, а не `thinkingBudget`. OpenClaw зіставляє
керування міркуваннями для Gemini 3, Gemini 3.1 і псевдонімів `gemini-*-latest` з
`thinkingLevel`, щоб типові/низьколатентні запуски не надсилали вимкнені
значення `thinkingBudget`.

Моделі Gemma 4 (наприклад, `gemma-4-26b-a4b-it`) підтримують режим thinking. OpenClaw
переписує `thinkingBudget` у підтримуваний Google `thinkingLevel` для Gemma 4.
Установлення thinking у `off` зберігає вимкнений thinking замість зіставлення з
`MINIMAL`.
</Tip>

## Генерація зображень

Вбудований provider генерації зображень `google` типово використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримує `google/gemini-3-pro-image-preview`
- Генерація: до 4 зображень на запит
- Режим редагування: увімкнений, до 5 вхідних зображень
- Керування геометрією: `size`, `aspectRatio` і `resolution`

Щоб використовувати Google як типовий provider зображень:

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
Див. [Image Generation](/uk/tools/image-generation) щодо спільних параметрів tool, вибору provider і поведінки failover.
</Note>

## Генерація відео

Вбудований Plugin `google` також реєструє генерацію відео через спільний
tool `video_generate`.

- Типова модель відео: `google/veo-3.1-fast-generate-preview`
- Режими: text-to-video, image-to-video і потоки з одним референсним відео
- Підтримує `aspectRatio`, `resolution` і `audio`
- Поточне обмеження тривалості: **від 4 до 8 секунд**

Щоб використовувати Google як типовий provider відео:

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
Див. [Video Generation](/uk/tools/video-generation) щодо спільних параметрів tool, вибору provider і поведінки failover.
</Note>

## Генерація музики

Вбудований Plugin `google` також реєструє генерацію музики через спільний
tool `music_generate`.

- Типова модель музики: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування prompt: `lyrics` і `instrumental`
- Формат виводу: типово `mp3`, а також `wav` для `google/lyria-3-pro-preview`
- Референсні входи: до 10 зображень
- Запуски з підтримкою сесій відокремлюються через спільний потік task/status, включно з `action: "status"`

Щоб використовувати Google як типовий provider музики:

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
Див. [Music Generation](/uk/tools/music-generation) щодо спільних параметрів tool, вибору provider і поведінки failover.
</Note>

## Text-to-speech

Вбудований speech provider `google` використовує шлях Gemini API TTS з
`gemini-3.1-flash-tts-preview`.

- Типовий голос: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Вивід: WAV для звичайних вкладень TTS, PCM для Talk/telephony
- Нативний вивід голосових повідомлень: не підтримується на цьому шляху Gemini API, оскільки API повертає PCM, а не Opus

Щоб використовувати Google як типовий TTS provider:

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

Gemini API TTS приймає виразні аудіотеги у квадратних дужках у тексті, наприклад
`[whispers]` або `[laughs]`. Щоб теги не потрапляли у видиму відповідь чату, але
надсилалися до TTS, помістіть їх у блок `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
API-ключ Google Cloud Console, обмежений Gemini API, є валідним для цього
provider. Це не окремий шлях Cloud Text-to-Speech API.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Пряме повторне використання кешу Gemini">
    Для прямих запусків Gemini API (`api: "google-generative-ai"`) OpenClaw
    передає налаштований дескриптор `cachedContent` далі в запити Gemini.

    - Налаштовуйте параметри для конкретної моделі або глобальні параметри через
      `cachedContent` або застарілий `cached_content`
    - Якщо присутні обидва, `cachedContent` має пріоритет
    - Приклад значення: `cachedContents/prebuilt-context`
    - Використання Gemini cache-hit нормалізується в OpenClaw `cacheRead` з
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

  <Accordion title="Примітки щодо JSON usage у Gemini CLI">
    Під час використання OAuth-provider `google-gemini-cli` OpenClaw нормалізує
    JSON-вивід CLI так:

    - Текст відповіді береться з поля CLI JSON `response`.
    - Usage резервно береться з `stats`, коли CLI залишає `usage` порожнім.
    - `stats.cached` нормалізується в OpenClaw `cacheRead`.
    - Якщо `stats.input` відсутній, OpenClaw виводить вхідні токени з
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Середовище та налаштування daemon">
    Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що `GEMINI_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider, refs моделей і поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри tool для зображень і вибір provider.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри tool для відео і вибір provider.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри tool для музики і вибір provider.
  </Card>
</CardGroup>
