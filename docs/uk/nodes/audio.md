---
read_when:
    - Зміна транскрибування аудіо або обробки медіа
summary: Як вхідні аудіо/голосові повідомлення завантажуються, транскрибуються та додаються до відповідей
title: Аудіо та голосові повідомлення
x-i18n:
    generated_at: "2026-04-23T20:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d76dad674d32b816e1242065f3319f6ebc14839d813cfd1e392cee6ae27bf39
    source_path: nodes/audio.md
    workflow: 15
---

# Аудіо / голосові повідомлення (2026-01-17)

## Що працює

- **Розуміння медіа (аудіо)**: якщо розуміння аудіо увімкнено (або авто-визначено), OpenClaw:
  1. Знаходить перше вкладення з аудіо (локальний шлях або URL) і за потреби завантажує його.
  2. Застосовує `maxBytes` перед надсиланням до кожного запису моделі.
  3. Запускає перший придатний запис моделі за порядком (provider або CLI).
  4. Якщо він завершується помилкою або пропускається (розмір/тайм-аут), пробує наступний запис.
  5. У разі успіху замінює `Body` блоком `[Audio]` і встановлює `{{Transcript}}`.
- **Розбір команд**: коли транскрибування успішне, `CommandBody`/`RawBody` установлюються в транскрипт, тож slash-команди й далі працюють.
- **Verbose logging**: у режимі `--verbose` ми записуємо в лог, коли виконується транскрибування і коли воно замінює body.

## Автовизначення (типово)

Якщо ви **не налаштовуєте моделі** і `tools.media.audio.enabled` **не** має значення `false`,
OpenClaw автоматично виконує визначення в такому порядку й зупиняється на першому робочому варіанті:

1. **Активна модель відповіді**, якщо її provider підтримує розуміння аудіо.
2. **Локальні CLI** (якщо встановлені)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (з `whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
   - `whisper` (Python CLI; автоматично завантажує моделі)
3. **Gemini CLI** (`gemini`) з використанням `read_many_files`
4. **Автентифікація provider**
   - Спочатку пробуються налаштовані записи `models.providers.*`, які підтримують аудіо
   - Порядок вбудованого fallback: OpenAI → Groq → Deepgram → Google → Mistral

Щоб вимкнути автовизначення, установіть `tools.media.audio.enabled: false`.
Щоб налаштувати вручну, задайте `tools.media.audio.models`.
Примітка: визначення бінарних файлів є best-effort для macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI-модель із повним шляхом до команди.

## Приклади конфігурації

### Fallback provider + CLI (OpenAI + Whisper CLI)

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

### Лише provider з gating за scope

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

### Надсилати транскрипт назад у чат (opt-in)

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

## Примітки та обмеження

- Автентифікація provider дотримується стандартного порядку автентифікації моделей (auth profiles, env vars, `models.providers.*.apiKey`).
- Докладніше про налаштування Groq: [Groq](/uk/providers/groq).
- Deepgram підхоплює `DEEPGRAM_API_KEY`, коли використовується `provider: "deepgram"`.
- Докладніше про налаштування Deepgram: [Deepgram (audio transcription)](/uk/providers/deepgram).
- Докладніше про налаштування Mistral: [Mistral](/uk/providers/mistral).
- Провайдери аудіо можуть перевизначати `baseUrl`, `headers` і `providerOptions` через `tools.media.audio`.
- Типове обмеження розміру — 20MB (`tools.media.audio.maxBytes`). Аудіо, що перевищує ліміт, пропускається для цієї моделі, і пробується наступний запис.
- Крихітні/порожні аудіофайли менші за 1024 байти пропускаються до транскрибування provider/CLI.
- Типове значення `maxChars` для аудіо **не задано** (повний транскрипт). Установіть `tools.media.audio.maxChars` або `maxChars` для конкретного запису, щоб обрізати вивід.
- Типове автозначення OpenAI — `gpt-4o-mini-transcribe`; задайте `model: "gpt-4o-transcribe"` для вищої точності.
- Використовуйте `tools.media.audio.attachments`, щоб обробляти кілька голосових повідомлень (`mode: "all"` + `maxAttachments`).
- Транскрипт доступний у шаблонах як `{{Transcript}}`.
- `tools.media.audio.echoTranscript` типово вимкнений; увімкніть його, щоб надсилати підтвердження транскрипту назад у початковий чат до обробки агентом.
- `tools.media.audio.echoFormat` налаштовує текст echo (placeholder: `{transcript}`).
- Вивід CLI stdout обмежено 5MB; тримайте вивід CLI стислим.

### Підтримка proxy environment

Транскрибування аудіо на основі provider підтримує стандартні env vars для вихідного proxy:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Якщо env vars proxy не задані, використовується прямий вихідний трафік. Якщо конфігурація proxy неправильна, OpenClaw записує попередження в лог і повертається до прямого отримання.

## Виявлення згадок у групах

Коли для групового чату задано `requireMention: true`, OpenClaw тепер транскрибує аудіо **до** перевірки згадок. Це дозволяє обробляти голосові повідомлення навіть тоді, коли вони містять згадки.

**Як це працює:**

1. Якщо голосове повідомлення не має текстового body і для групи потрібні згадки, OpenClaw виконує транскрибування "preflight".
2. Транскрипт перевіряється на шаблони згадки (наприклад, `@BotName`, emoji-тригери).
3. Якщо згадку знайдено, повідомлення проходить через повний pipeline відповіді.
4. Транскрипт використовується для виявлення згадок, щоб голосові повідомлення могли пройти mention gate.

**Fallback-поведінка:**

- Якщо транскрибування завершується помилкою під час preflight (тайм-аут, помилка API тощо), повідомлення обробляється на основі виявлення згадки лише за текстом.
- Це гарантує, що змішані повідомлення (текст + аудіо) ніколи не будуть помилково відкинуті.

**Opt-out для кожної групи/теми Telegram:**

- Установіть `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, щоб пропустити перевірки згадок через preflight-транскрипт для цієї групи.
- Установіть `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, щоб перевизначити для окремої теми (`true` — пропустити, `false` — примусово ввімкнути).
- Типове значення — `false` (preflight увімкнено, коли збігаються умови mention-gated).

**Приклад:** Користувач надсилає в Telegram-групу з `requireMention: true` голосове повідомлення зі словами "Hey @Claude, what's the weather?". Голосове повідомлення транскрибується, згадка виявляється, і агент відповідає.

## Підводні камені

- Правила scope використовують принцип first-match wins. `chatType` нормалізується до `direct`, `group` або `room`.
- Переконайтеся, що ваш CLI завершується з кодом 0 і виводить звичайний текст; JSON треба підготувати через `jq -r .text`.
- Для `parakeet-mlx`, якщо ви передаєте `--output-dir`, OpenClaw читає `<output-dir>/<media-basename>.txt`, коли `--output-format` має значення `txt` (або не вказано); формати виводу, відмінні від `txt`, повертаються до розбору stdout.
- Тримайте тайм-аути розумними (`timeoutSeconds`, типово 60s), щоб не блокувати чергу відповідей.
- Транскрибування preflight обробляє лише **перше** вкладення з аудіо для виявлення згадки. Додаткове аудіо обробляється під час основного етапу розуміння медіа.
