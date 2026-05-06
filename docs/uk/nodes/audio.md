---
read_when:
    - Зміна транскрибування аудіо або обробки медіа
summary: Як вхідні аудіо/голосові повідомлення завантажуються, транскрибуються та вставляються у відповіді
title: Аудіо та голосові нотатки
x-i18n:
    generated_at: "2026-05-06T06:16:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520620da5a643bb8e17318d7304ae4be3bd2586b0866614ad741685de5b8ef05
    source_path: nodes/audio.md
    workflow: 16
---

# Аудіо / голосові повідомлення (2026-01-17)

## Що працює

- **Розуміння медіа (аудіо)**: Якщо розуміння аудіо ввімкнено (або автовиявлено), OpenClaw:
  1. Знаходить перше аудіовкладення (локальний шлях або URL) і за потреби завантажує його.
  2. Застосовує `maxBytes` перед надсиланням до кожного запису моделі.
  3. Запускає перший придатний запис моделі за порядком (провайдер або CLI).
  4. Якщо він завершується помилкою або пропускається (розмір/тайм-аут), пробує наступний запис.
  5. У разі успіху замінює `Body` блоком `[Audio]` і встановлює `{{Transcript}}`.
- **Розбір команд**: Коли транскрибування успішне, `CommandBody`/`RawBody` встановлюються на транскрипт, тому slash-команди все ще працюють.
- **Докладне журналювання**: У режимі `--verbose` ми журналюємо, коли виконується транскрибування і коли воно замінює тіло.

## Автовиявлення (типово)

Якщо ви **не налаштовуєте моделі** і `tools.media.audio.enabled` **не** встановлено в `false`,
OpenClaw виконує автовиявлення в такому порядку й зупиняється на першому робочому варіанті:

1. **Активна модель відповіді**, коли її провайдер підтримує розуміння аудіо.
2. **Локальні CLI** (якщо встановлені)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (з `whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
   - `whisper` (Python CLI; автоматично завантажує моделі)
3. **Gemini CLI** (`gemini`) з використанням `read_many_files`
4. **Автентифікація провайдера**
   - Спершу пробуються налаштовані записи `models.providers.*`, які підтримують аудіо
   - Вбудований порядок резервних варіантів: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Щоб вимкнути автовиявлення, встановіть `tools.media.audio.enabled: false`.
Щоб налаштувати вручну, встановіть `tools.media.audio.models`.
Примітка: Виявлення бінарних файлів є best-effort на macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або встановіть явну CLI-модель із повним шляхом до команди.

## Приклади конфігурації

### Провайдер + резервний CLI (OpenAI + Whisper CLI)

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

### Лише провайдер із gating за scope

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

### Лише провайдер (Deepgram)

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

### Лише провайдер (Mistral Voxtral)

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

### Лише провайдер (SenseAudio)

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

### Відлуння транскрипту в чат (опціонально)

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

- Автентифікація провайдера дотримується стандартного порядку автентифікації моделей (auth profiles, env vars, `models.providers.*.apiKey`).
- Деталі налаштування Groq: [Groq](/uk/providers/groq).
- Deepgram підхоплює `DEEPGRAM_API_KEY`, коли використовується `provider: "deepgram"`.
- Деталі налаштування Deepgram: [Deepgram (транскрибування аудіо)](/uk/providers/deepgram).
- Деталі налаштування Mistral: [Mistral](/uk/providers/mistral).
- SenseAudio підхоплює `SENSEAUDIO_API_KEY`, коли використовується `provider: "senseaudio"`.
- Деталі налаштування SenseAudio: [SenseAudio](/uk/providers/senseaudio).
- Аудіопровайдери можуть перевизначати `baseUrl`, `headers` і `providerOptions` через `tools.media.audio`.
- Типовий ліміт розміру становить 20MB (`tools.media.audio.maxBytes`). Завелике аудіо пропускається для цієї моделі, і пробується наступний запис.
- Крихітні/порожні аудіофайли менш ніж 1024 байти пропускаються перед транскрибуванням через провайдера/CLI.
- Типове значення `maxChars` для аудіо **не встановлено** (повний транскрипт). Встановіть `tools.media.audio.maxChars` або `maxChars` для окремого запису, щоб обрізати вивід.
- Типове автовибране значення OpenAI — `gpt-4o-mini-transcribe`; встановіть `model: "gpt-4o-transcribe"` для вищої точності.
- Використовуйте `tools.media.audio.attachments`, щоб обробляти кілька голосових повідомлень (`mode: "all"` + `maxAttachments`).
- Транскрипт доступний шаблонам як `{{Transcript}}`.
- `tools.media.audio.echoTranscript` типово вимкнено; увімкніть його, щоб надіслати підтвердження транскрипту назад у вихідний чат перед обробкою агентом.
- `tools.media.audio.echoFormat` налаштовує текст відлуння (плейсхолдер: `{transcript}`).
- stdout CLI обмежено (5MB); тримайте вивід CLI стислим.
- CLI `args` має використовувати `{{MediaPath}}` для локального шляху до аудіофайлу. Запустіть `openclaw doctor --fix`, щоб мігрувати застарілі плейсхолдери `{input}` зі старіших конфігурацій `audio.transcription.command`.

### Підтримка проксі через середовище

Транскрибування аудіо на основі провайдера враховує стандартні env vars вихідного проксі:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Якщо env vars проксі не встановлено, використовується прямий вихідний доступ. Якщо конфігурація проксі має неправильний формат, OpenClaw журналює попередження й повертається до прямого fetch.

## Виявлення згадок у групах

Коли для групового чату встановлено `requireMention: true`, OpenClaw тепер транскрибує аудіо **перед** перевіркою згадок. Це дає змогу обробляти голосові повідомлення, навіть коли вони містять згадки.

**Як це працює:**

1. Якщо голосове повідомлення не має текстового тіла, а група вимагає згадок, OpenClaw виконує "preflight"-транскрибування.
2. Транскрипт перевіряється на патерни згадок (наприклад, `@BotName`, тригери emoji).
3. Якщо згадку знайдено, повідомлення проходить через повний pipeline відповіді.
4. Транскрипт використовується для виявлення згадок, щоб голосові повідомлення могли пройти mention gate.

**Поведінка резервного варіанта:**

- Якщо транскрибування під час preflight завершується помилкою (тайм-аут, помилка API тощо), повідомлення обробляється на основі виявлення згадок лише в тексті.
- Це гарантує, що змішані повідомлення (текст + аудіо) ніколи не буде помилково відкинуто.

**Вимкнення для окремої групи/теми Telegram:**

- Встановіть `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, щоб пропускати preflight-перевірки згадок у транскрипті для цієї групи.
- Встановіть `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, щоб перевизначити для окремої теми (`true`, щоб пропускати, `false`, щоб примусово ввімкнути).
- Типове значення — `false` (preflight увімкнено, коли збігаються умови mention-gated).

**Приклад:** Користувач надсилає голосове повідомлення зі словами "Hey @Claude, what's the weather?" у групі Telegram з `requireMention: true`. Голосове повідомлення транскрибується, згадку виявлено, і агент відповідає.

## Нюанси

- Правила scope використовують перший збіг як переможний. `chatType` нормалізується до `direct`, `group` або `room`.
- Переконайтеся, що ваш CLI завершується з кодом 0 і друкує звичайний текст; JSON потрібно обробити через `jq -r .text`.
- Для `parakeet-mlx`, якщо ви передаєте `--output-dir`, OpenClaw читає `<output-dir>/<media-basename>.txt`, коли `--output-format` дорівнює `txt` (або пропущено); формати виводу не `txt` повертаються до розбору stdout.
- Тримайте тайм-аути розумними (`timeoutSeconds`, типово 60s), щоб не блокувати чергу відповідей.
- Preflight-транскрибування обробляє лише **перше** аудіовкладення для виявлення згадок. Додаткове аудіо обробляється під час основної фази розуміння медіа.

## Пов’язане

- [Розуміння медіа](/uk/nodes/media-understanding)
- [Режим розмови](/uk/nodes/talk)
- [Голосове пробудження](/uk/nodes/voicewake)
