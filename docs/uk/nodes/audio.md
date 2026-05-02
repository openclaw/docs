---
read_when:
    - Зміна транскрибування аудіо або обробки медіа
summary: Як вхідні аудіо/голосові повідомлення завантажуються, транскрибуються та вставляються у відповіді
title: Аудіо та голосові нотатки
x-i18n:
    generated_at: "2026-05-02T23:43:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# Аудіо / голосові нотатки (2026-01-17)

## Що працює

- **Розуміння медіа (аудіо)**: Якщо розуміння аудіо ввімкнено (або автоматично виявлено), OpenClaw:
  1. Знаходить перше аудіовкладення (локальний шлях або URL) і завантажує його за потреби.
  2. Застосовує `maxBytes` перед надсиланням до кожного запису моделі.
  3. Запускає перший придатний запис моделі за порядком (провайдер або CLI).
  4. Якщо він завершується помилкою або пропускається (розмір/тайм-аут), пробує наступний запис.
  5. У разі успіху замінює `Body` блоком `[Audio]` і встановлює `{{Transcript}}`.
- **Розбір команд**: Коли транскрибування успішне, `CommandBody`/`RawBody` встановлюються в текст транскрипту, тож slash-команди й далі працюють.
- **Докладне журналювання**: У режимі `--verbose` ми журналюємо, коли запускається транскрибування і коли воно замінює тіло повідомлення.

## Автовиявлення (за замовчуванням)

Якщо ви **не налаштовуєте моделі** і `tools.media.audio.enabled` **не** встановлено в `false`,
OpenClaw автоматично виявляє варіанти в такому порядку й зупиняється на першому робочому:

1. **Активна модель відповіді**, коли її провайдер підтримує розуміння аудіо.
2. **Локальні CLI** (якщо встановлено)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (з `whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану модель tiny)
   - `whisper` (Python CLI; автоматично завантажує моделі)
3. **Gemini CLI** (`gemini`) з використанням `read_many_files`
4. **Автентифікація провайдера**
   - Спершу пробуються налаштовані записи `models.providers.*`, які підтримують аудіо
   - Вбудований порядок резервних варіантів: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Щоб вимкнути автовиявлення, встановіть `tools.media.audio.enabled: false`.
Щоб налаштувати вручну, встановіть `tools.media.audio.models`.
Примітка: виявлення бінарних файлів виконується за принципом best-effort у macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну модель CLI з повним шляхом до команди.

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

### Лише провайдер із керуванням за scope

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

### Надсилання транскрипту в чат (за згодою)

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

- Автентифікація провайдера дотримується стандартного порядку автентифікації моделей (профілі автентифікації, env vars, `models.providers.*.apiKey`).
- Деталі налаштування Groq: [Groq](/uk/providers/groq).
- Deepgram підхоплює `DEEPGRAM_API_KEY`, коли використовується `provider: "deepgram"`.
- Деталі налаштування Deepgram: [Deepgram (транскрибування аудіо)](/uk/providers/deepgram).
- Деталі налаштування Mistral: [Mistral](/uk/providers/mistral).
- SenseAudio підхоплює `SENSEAUDIO_API_KEY`, коли використовується `provider: "senseaudio"`.
- Деталі налаштування SenseAudio: [SenseAudio](/uk/providers/senseaudio).
- Аудіопровайдери можуть перевизначати `baseUrl`, `headers` і `providerOptions` через `tools.media.audio`.
- Типове обмеження розміру становить 20MB (`tools.media.audio.maxBytes`). Завелике аудіо пропускається для цієї моделі, після чого пробується наступний запис.
- Крихітні/порожні аудіофайли менші за 1024 байти пропускаються перед транскрибуванням провайдером/CLI.
- Типове `maxChars` для аудіо **не встановлено** (повний транскрипт). Установіть `tools.media.audio.maxChars` або `maxChars` для окремого запису, щоб обрізати вивід.
- Автоматичне значення OpenAI за замовчуванням — `gpt-4o-mini-transcribe`; установіть `model: "gpt-4o-transcribe"` для вищої точності.
- Використовуйте `tools.media.audio.attachments`, щоб обробляти кілька голосових нотаток (`mode: "all"` + `maxAttachments`).
- Транскрипт доступний шаблонам як `{{Transcript}}`.
- `tools.media.audio.echoTranscript` вимкнено за замовчуванням; увімкніть його, щоб надіслати підтвердження транскрипту назад у початковий чат перед обробкою агентом.
- `tools.media.audio.echoFormat` налаштовує текст echo (заповнювач: `{transcript}`).
- stdout CLI обмежено (5MB); тримайте вивід CLI стислим.
- `args` CLI мають використовувати `{{MediaPath}}` для локального шляху до аудіофайлу. Запустіть `openclaw doctor --fix`, щоб перенести застарілі заповнювачі `{input}` зі старіших конфігурацій `audio.transcription.command`.

### Підтримка проксі-середовища

Транскрибування аудіо на основі провайдера враховує стандартні env vars вихідного проксі:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Якщо env vars проксі не задано, використовується прямий вихід. Якщо конфігурація проксі має неправильний формат, OpenClaw журналює попередження й повертається до прямого fetch.

## Виявлення згадок у групах

Коли для групового чату встановлено `requireMention: true`, OpenClaw тепер транскрибує аудіо **перед** перевіркою згадок. Це дає змогу обробляти голосові нотатки навіть тоді, коли вони містять згадки.

**Як це працює:**

1. Якщо голосове повідомлення не має текстового тіла, а група вимагає згадок, OpenClaw виконує "preflight"-транскрибування.
2. Транскрипт перевіряється на шаблони згадок (наприклад, `@BotName`, emoji-тригери).
3. Якщо згадку знайдено, повідомлення проходить повний конвеєр відповіді.
4. Транскрипт використовується для виявлення згадок, тож голосові нотатки можуть пройти gate згадок.

**Резервна поведінка:**

- Якщо транскрибування під час preflight завершується помилкою (тайм-аут, помилка API тощо), повідомлення обробляється на основі виявлення згадок лише в тексті.
- Це гарантує, що змішані повідомлення (текст + аудіо) ніколи не будуть помилково відкинуті.

**Вимкнення для окремої групи/теми Telegram:**

- Установіть `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, щоб пропустити preflight-перевірки згадок у транскрипті для цієї групи.
- Установіть `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, щоб перевизначити для окремої теми (`true` — пропустити, `false` — примусово ввімкнути).
- За замовчуванням значення `false` (preflight увімкнено, коли збігаються умови gate за згадками).

**Приклад:** Користувач надсилає голосову нотатку зі словами "Hey @Claude, what's the weather?" у групі Telegram з `requireMention: true`. Голосова нотатка транскрибується, згадку виявлено, і агент відповідає.

## Підводні камені

- Правила scope працюють за принципом першого збігу. `chatType` нормалізується до `direct`, `group` або `room`.
- Переконайтеся, що ваш CLI завершується з кодом 0 і друкує звичайний текст; JSON потрібно обробити через `jq -r .text`.
- Для `parakeet-mlx`, якщо ви передаєте `--output-dir`, OpenClaw читає `<output-dir>/<media-basename>.txt`, коли `--output-format` дорівнює `txt` (або його пропущено); формати виводу, відмінні від `txt`, повертаються до розбору stdout.
- Тримайте тайм-аути розумними (`timeoutSeconds`, типово 60s), щоб не блокувати чергу відповідей.
- Preflight-транскрибування обробляє лише **перше** аудіовкладення для виявлення згадок. Додаткове аудіо обробляється під час основної фази розуміння медіа.

## Пов’язане

- [Розуміння медіа](/uk/nodes/media-understanding)
- [Режим розмови](/uk/nodes/talk)
- [Голосове пробудження](/uk/nodes/voicewake)
