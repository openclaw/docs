---
read_when:
    - Зміна транскрибування аудіо або обробки медіа
summary: Як вхідні аудіофайли/голосові повідомлення завантажуються, транскрибуються та додаються до відповідей
title: Аудіо та голосові повідомлення
x-i18n:
    generated_at: "2026-04-25T11:56:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc48787be480fbd19d26f18ac42a15108be89104e6aa56e60a94bd62b1b0cba0
    source_path: nodes/audio.md
    workflow: 15
---

# Аудіо / Голосові повідомлення (2026-01-17)

## Що працює

- **Розуміння медіа (аудіо)**: Якщо розуміння аудіо ввімкнено (або визначено автоматично), OpenClaw:
  1. Знаходить перше аудіовкладення (локальний шлях або URL) і завантажує його за потреби.
  2. Застосовує `maxBytes` перед надсиланням до кожного запису моделі.
  3. Запускає перший відповідний запис моделі за порядком (provider або CLI).
  4. Якщо він завершується з помилкою або пропускається (розмір/тайм-аут), система пробує наступний запис.
  5. У разі успіху замінює `Body` блоком `[Audio]` і встановлює `{{Transcript}}`.
- **Розбір команд**: Коли транскрибування успішне, `CommandBody`/`RawBody` встановлюються в транскрипт, тож slash-команди продовжують працювати.
- **Детальне журналювання**: У `--verbose` ми фіксуємо, коли запускається транскрибування і коли воно замінює тіло повідомлення.

## Автовизначення (типово)

Якщо ви **не налаштовуєте моделі** і `tools.media.audio.enabled` **не** встановлено в `false`,
OpenClaw автоматично визначає в такому порядку й зупиняється на першому робочому варіанті:

1. **Активна модель відповіді**, якщо її provider підтримує розуміння аудіо.
2. **Локальні CLI** (якщо встановлені)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (з `whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
   - `whisper` (Python CLI; автоматично завантажує моделі)
3. **Gemini CLI** (`gemini`) з використанням `read_many_files`
4. **Автентифікація provider**
   - Спочатку пробуються налаштовані записи `models.providers.*`, які підтримують аудіо
   - Порядок вбудованого резервного варіанта: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Щоб вимкнути автовизначення, встановіть `tools.media.audio.enabled: false`.
Щоб налаштувати вручну, встановіть `tools.media.audio.models`.
Примітка: Визначення бінарних файлів виконується за принципом best-effort у macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI-модель із повним шляхом до команди.

## Приклади конфігурації

### Резервний варіант provider + CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Лише provider з обмеженням області дії

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Лише provider (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Лише provider (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Лише provider (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Надсилати транскрипт у чат (опційно)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // типово false
        echoFormat: '📝 "{transcript}"', // необов’язково, підтримує {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Примітки й обмеження

- Автентифікація provider дотримується стандартного порядку автентифікації моделей (профілі автентифікації, змінні середовища, `models.providers.*.apiKey`).
- Докладніше про налаштування Groq: [Groq](/uk/providers/groq).
- Deepgram використовує `DEEPGRAM_API_KEY`, коли задано `provider: "deepgram"`.
- Докладніше про налаштування Deepgram: [Deepgram (транскрибування аудіо)](/uk/providers/deepgram).
- Докладніше про налаштування Mistral: [Mistral](/uk/providers/mistral).
- SenseAudio використовує `SENSEAUDIO_API_KEY`, коли задано `provider: "senseaudio"`.
- Докладніше про налаштування SenseAudio: [SenseAudio](/uk/providers/senseaudio).
- Audio providers можуть перевизначати `baseUrl`, `headers` і `providerOptions` через `tools.media.audio`.
- Типове обмеження розміру — 20MB (`tools.media.audio.maxBytes`). Надто велике аудіо пропускається для цієї моделі, і пробується наступний запис.
- Дуже малі/порожні аудіофайли менш ніж 1024 байти пропускаються до транскрибування provider/CLI.
- Типове `maxChars` для аудіо **не задано** (повний транскрипт). Встановіть `tools.media.audio.maxChars` або `maxChars` для окремого запису, щоб обрізати вивід.
- Типове значення OpenAI — `gpt-4o-mini-transcribe`; встановіть `model: "gpt-4o-transcribe"` для вищої точності.
- Використовуйте `tools.media.audio.attachments` для обробки кількох голосових повідомлень (`mode: "all"` + `maxAttachments`).
- Транскрипт доступний у шаблонах як `{{Transcript}}`.
- `tools.media.audio.echoTranscript` типово вимкнено; увімкніть його, щоб надсилати підтвердження транскрипту назад у вихідний чат до обробки агентом.
- `tools.media.audio.echoFormat` налаштовує текст echo (заповнювач: `{transcript}`).
- Stdout CLI обмежено (5MB); робіть вивід CLI стислим.

### Підтримка proxy через середовище

Транскрибування аудіо на основі provider підтримує стандартні змінні середовища для вихідного proxy:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Якщо змінні середовища proxy не задано, використовується прямий вихідний трафік. Якщо конфігурація proxy некоректна, OpenClaw записує попередження в журнал і повертається до прямого отримання.

## Виявлення згадок у групах

Коли для групового чату встановлено `requireMention: true`, OpenClaw тепер транскрибує аудіо **до** перевірки згадок. Це дозволяє обробляти голосові повідомлення, навіть якщо вони містять згадки.

**Як це працює:**

1. Якщо голосове повідомлення не має текстового тіла, а для групи потрібні згадки, OpenClaw виконує "preflight" транскрибування.
2. Транскрипт перевіряється на шаблони згадок (наприклад, `@BotName`, emoji-тригери).
3. Якщо згадку знайдено, повідомлення проходить через повний конвеєр відповіді.
4. Транскрипт використовується для виявлення згадок, тож голосові повідомлення можуть пройти перевірку на згадку.

**Резервна поведінка:**

- Якщо транскрибування під час preflight завершується помилкою (тайм-аут, помилка API тощо), повідомлення обробляється на основі лише текстового виявлення згадок.
- Це гарантує, що змішані повідомлення (текст + аудіо) ніколи не будуть помилково відкинуті.

**Opt-out для окремої Telegram групи/теми:**

- Встановіть `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, щоб пропустити перевірки згадок за транскриптом preflight для цієї групи.
- Встановіть `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, щоб перевизначити це для окремої теми (`true` — пропустити, `false` — примусово ввімкнути).
- Типове значення — `false` (preflight увімкнено, коли виконуються умови перевірки згадок).

**Приклад:** Користувач надсилає голосове повідомлення зі словами "Hey @Claude, what's the weather?" у Telegram-групі з `requireMention: true`. Голосове повідомлення транскрибується, згадка виявляється, і агент відповідає.

## Типові нюанси

- Правила області дії використовують принцип first-match wins. `chatType` нормалізується до `direct`, `group` або `room`.
- Переконайтеся, що ваш CLI завершується з кодом 0 і виводить звичайний текст; JSON потрібно обробити через `jq -r .text`.
- Для `parakeet-mlx`, якщо ви передаєте `--output-dir`, OpenClaw читає `<output-dir>/<media-basename>.txt`, коли `--output-format` дорівнює `txt` (або не задано); формати виводу, відмінні від `txt`, повертаються до розбору stdout.
- Тримайте тайм-аути в розумних межах (`timeoutSeconds`, типово 60 с), щоб не блокувати чергу відповідей.
- Preflight-транскрибування обробляє лише **перше** аудіовкладення для виявлення згадок. Додаткове аудіо обробляється під час основної фази розуміння медіа.

## Пов’язане

- [Розуміння медіа](/uk/nodes/media-understanding)
- [Режим розмови](/uk/nodes/talk)
- [Активація голосом](/uk/nodes/voicewake)
