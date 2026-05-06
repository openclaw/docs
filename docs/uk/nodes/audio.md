---
read_when:
    - Зміна транскрибування аудіо або обробки медіа
summary: Як вхідні аудіо/голосові нотатки завантажуються, транскрибуються та вставляються у відповіді
title: Аудіо та голосові нотатки
x-i18n:
    generated_at: "2026-05-06T16:11:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: baa96453ce279d05933281eafe930e3573c5cbe694cec8704b1d064f4b0de242
    source_path: nodes/audio.md
    workflow: 16
---

## Що працює

- **Розуміння медіа (аудіо)**: Якщо розуміння аудіо увімкнено (або автоматично виявлено), OpenClaw:
  1. Знаходить перше аудіовкладення (локальний шлях або URL) і за потреби завантажує його.
  2. Застосовує обмеження `maxBytes` перед надсиланням до кожного запису моделі.
  3. Запускає перший придатний запис моделі за порядком (provider або CLI).
  4. Якщо він завершується помилкою або пропускається (розмір/тайм-аут), пробує наступний запис.
  5. У разі успіху замінює `Body` блоком `[Audio]` і встановлює `{{Transcript}}`.
- **Розбір команд**: Коли транскрибування успішне, `CommandBody`/`RawBody` встановлюються в текст транскрипту, тож slash-команди й далі працюють.
- **Докладне журналювання**: У режимі `--verbose` ми журналюємо, коли запускається транскрибування і коли воно замінює тіло.

## Автоматичне виявлення (за замовчуванням)

Якщо ви **не налаштовуєте моделі**, а `tools.media.audio.enabled` **не** встановлено в `false`,
OpenClaw виконує автоматичне виявлення в такому порядку й зупиняється на першому робочому варіанті:

1. **Активна модель відповіді**, коли її provider підтримує розуміння аудіо.
2. **Локальні CLI** (якщо встановлено)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (з `whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
   - `whisper` (Python CLI; завантажує моделі автоматично)
3. **Gemini CLI** (`gemini`) з використанням `read_many_files`
4. **Автентифікація provider**
   - Спершу пробуються налаштовані записи `models.providers.*`, що підтримують аудіо
   - Вбудований порядок резервних варіантів: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Щоб вимкнути автоматичне виявлення, встановіть `tools.media.audio.enabled: false`.
Щоб налаштувати вручну, встановіть `tools.media.audio.models`.
Примітка: Виявлення бінарних файлів виконується за принципом найкращої спроби в macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI-модель із повним шляхом до команди.

## Приклади конфігурації

### Provider + резервний CLI (OpenAI + Whisper CLI)

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

### Лише provider з обмеженням за scope

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

### Надсилання транскрипту в чат (увімкнення за бажанням)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Примітки й обмеження

- Автентифікація provider відповідає стандартному порядку автентифікації моделей (auth profiles, env vars, `models.providers.*.apiKey`).
- Докладно про налаштування Groq: [Groq](/uk/providers/groq).
- Deepgram підхоплює `DEEPGRAM_API_KEY`, коли використовується `provider: "deepgram"`.
- Докладно про налаштування Deepgram: [Deepgram (транскрибування аудіо)](/uk/providers/deepgram).
- Докладно про налаштування Mistral: [Mistral](/uk/providers/mistral).
- SenseAudio підхоплює `SENSEAUDIO_API_KEY`, коли використовується `provider: "senseaudio"`.
- Докладно про налаштування SenseAudio: [SenseAudio](/uk/providers/senseaudio).
- Аудіо-provider можуть перевизначати `baseUrl`, `headers` і `providerOptions` через `tools.media.audio`.
- Обмеження розміру за замовчуванням — 20 МБ (`tools.media.audio.maxBytes`). Завелике аудіо пропускається для цієї моделі, і пробується наступний запис.
- Дуже малі/порожні аудіофайли менші за 1024 байти пропускаються до транскрибування через provider/CLI.
- Стандартне значення `maxChars` для аудіо **не встановлено** (повний транскрипт). Встановіть `tools.media.audio.maxChars` або `maxChars` для окремого запису, щоб обрізати вивід.
- Автоматичне стандартне значення OpenAI — `gpt-4o-mini-transcribe`; встановіть `model: "gpt-4o-transcribe"` для вищої точності.
- Використовуйте `tools.media.audio.attachments`, щоб обробляти кілька голосових нотаток (`mode: "all"` + `maxAttachments`).
- Транскрипт доступний шаблонам як `{{Transcript}}`.
- `tools.media.audio.echoTranscript` вимкнено за замовчуванням; увімкніть його, щоб надіслати підтвердження транскрипту назад у початковий чат перед обробкою агентом.
- `tools.media.audio.echoFormat` налаштовує текст відлуння (placeholder: `{transcript}`).
- Вивід stdout CLI обмежено (5 МБ); тримайте вивід CLI стислим.
- CLI `args` має використовувати `{{MediaPath}}` для локального шляху до аудіофайлу. Запустіть `openclaw doctor --fix`, щоб перенести застарілі placeholder `{input}` зі старіших конфігурацій `audio.transcription.command`.

### Підтримка proxy-середовища

Транскрибування аудіо на основі provider враховує стандартні змінні середовища вихідного proxy:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Якщо змінні середовища proxy не задано, використовується прямий вихід. Якщо конфігурація proxy має неправильний формат, OpenClaw записує попередження в журнал і повертається до прямого fetch.

## Виявлення згадок у групах

Коли для групового чату встановлено `requireMention: true`, OpenClaw тепер транскрибує аудіо **перед** перевіркою згадок. Це дає змогу обробляти голосові нотатки навіть тоді, коли вони містять згадки.

**Як це працює:**

1. Якщо голосове повідомлення не має текстового тіла, а група вимагає згадок, OpenClaw виконує "preflight" транскрибування.
2. Транскрипт перевіряється на шаблони згадок (наприклад, `@BotName`, emoji-тригери).
3. Якщо згадку знайдено, повідомлення проходить повний конвеєр відповіді.
4. Транскрипт використовується для виявлення згадок, щоб голосові нотатки могли пройти шлюз згадок.

**Резервна поведінка:**

- Якщо транскрибування під час preflight завершується помилкою (тайм-аут, помилка API тощо), повідомлення обробляється на основі виявлення згадок лише в тексті.
- Це гарантує, що змішані повідомлення (текст + аудіо) ніколи не буде помилково відкинуто.

**Вимкнення для окремої групи/теми Telegram:**

- Встановіть `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, щоб пропустити перевірки згадок у preflight-транскрипті для цієї групи.
- Встановіть `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, щоб перевизначити для окремої теми (`true` для пропуску, `false` для примусового ввімкнення).
- Стандартне значення — `false` (preflight увімкнено, коли збігаються умови з обмеженням за згадками).

**Приклад:** Користувач надсилає голосову нотатку зі словами "Hey @Claude, what's the weather?" у групі Telegram з `requireMention: true`. Голосову нотатку транскрибовано, згадку виявлено, і агент відповідає.

## Підводні камені

- Правила scope використовують перший збіг. `chatType` нормалізується до `direct`, `group` або `room`.
- Переконайтеся, що ваш CLI завершується з кодом 0 і друкує звичайний текст; JSON потрібно обробити через `jq -r .text`.
- Для `parakeet-mlx`, якщо ви передаєте `--output-dir`, OpenClaw читає `<output-dir>/<media-basename>.txt`, коли `--output-format` дорівнює `txt` (або пропущено); формати виводу не `txt` повертаються до розбору stdout.
- Тримайте тайм-аути розумними (`timeoutSeconds`, за замовчуванням 60 с), щоб не блокувати чергу відповідей.
- Preflight-транскрибування обробляє лише **перше** аудіовкладення для виявлення згадок. Додаткові аудіо обробляються під час основної фази розуміння медіа.

## Пов’язане

- [Розуміння медіа](/uk/nodes/media-understanding)
- [Режим розмови](/uk/nodes/talk)
- [Голосове пробудження](/uk/nodes/voicewake)
