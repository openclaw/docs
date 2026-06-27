---
read_when:
    - Зміна транскрипції аудіо або обробки медіа
summary: Як вхідні аудіо- й голосові нотатки завантажуються, транскрибуються та додаються до відповідей
title: Аудіо та голосові нотатки
x-i18n:
    generated_at: "2026-06-27T17:43:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90e66cf76537b090afdcd3a7791b40107ae51d6be89c84fcb14c034e38df875e
    source_path: nodes/audio.md
    workflow: 16
---

## Що працює

- **Розуміння медіа (аудіо)**: Якщо розуміння аудіо ввімкнено (або визначено автоматично), OpenClaw:
  1. Знаходить перше аудіовкладення (локальний шлях або URL) і за потреби завантажує його.
  2. Застосовує `maxBytes` перед надсиланням до кожного запису моделі.
  3. Запускає перший придатний запис моделі за порядком (провайдер або CLI).
  4. Якщо він завершується помилкою або пропускається (розмір/тайм-аут), пробує наступний запис.
  5. У разі успіху замінює `Body` блоком `[Audio]` і встановлює `{{Transcript}}`.
- **Розбір команд**: Коли транскрибування успішне, `CommandBody`/`RawBody` встановлюються в транскрипт, тож slash-команди й далі працюють.
- **Докладне журналювання**: У `--verbose` ми журналюємо, коли виконується транскрибування і коли воно замінює тіло повідомлення.

## Автоматичне визначення (типово)

Якщо ви **не налаштовуєте моделі** і `tools.media.audio.enabled` **не** встановлено в `false`,
OpenClaw автоматично визначає варіанти в такому порядку й зупиняється на першому робочому:

1. **Активна модель відповіді**, якщо її провайдер підтримує розуміння аудіо.
2. **Локальні CLI** (якщо встановлені)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (з `whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
   - `whisper` (Python CLI; завантажує моделі автоматично)
3. **Автентифікація провайдера**
   - Спочатку пробуються налаштовані записи `models.providers.*`, які підтримують аудіо
   - Порядок резервних провайдерів: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Станом на 2026-05-22 автоматичне визначення Gemini CLI більше не підтримується для розуміння медіа. Google переводить користувачів Gemini CLI на Antigravity CLI; для аудіо слід використовувати локальне або провайдерське транскрибування, а резервний CLI для зображень/відео має перейти на Antigravity CLI (`agy`).

Щоб вимкнути автоматичне визначення, встановіть `tools.media.audio.enabled: false`.
Щоб налаштувати вручну, встановіть `tools.media.audio.models`.
Примітка: Виявлення бінарних файлів виконується за принципом best-effort у macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI-модель із повним шляхом до команди.

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

### Лише провайдер із керуванням за областю дії

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

### Відлунювати транскрипт у чат (за явним увімкненням)

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

- Автентифікація провайдера дотримується стандартного порядку автентифікації моделей (профілі автентифікації, env vars, `models.providers.*.apiKey`).
- Деталі налаштування Groq: [Groq](/uk/providers/groq).
- Deepgram підхоплює `DEEPGRAM_API_KEY`, коли використовується `provider: "deepgram"`.
- Деталі налаштування Deepgram: [Deepgram (транскрибування аудіо)](/uk/providers/deepgram).
- Деталі налаштування Mistral: [Mistral](/uk/providers/mistral).
- SenseAudio підхоплює `SENSEAUDIO_API_KEY`, коли використовується `provider: "senseaudio"`.
- Деталі налаштування SenseAudio: [SenseAudio](/uk/providers/senseaudio).
- Аудіопровайдери можуть перевизначати `baseUrl`, `headers` і `providerOptions` через `tools.media.audio`.
- Типове обмеження розміру становить 20MB (`tools.media.audio.maxBytes`). Завелике аудіо пропускається для цієї моделі, і пробується наступний запис.
- Крихітні/порожні аудіофайли менші за 1024 байти пропускаються перед провайдерським/CLI-транскрибуванням.
- Типовий `maxChars` для аудіо **не задано** (повний транскрипт). Встановіть `tools.media.audio.maxChars` або `maxChars` для окремого запису, щоб обрізати вивід.
- Типове автоматичне значення OpenAI — `gpt-4o-mini-transcribe`; встановіть `model: "gpt-4o-transcribe"` для вищої точності.
- Використовуйте `tools.media.audio.attachments`, щоб обробляти кілька голосових нотаток (`mode: "all"` + `maxAttachments`).
- Транскрипт доступний шаблонам як `{{Transcript}}`.
- `tools.media.audio.echoTranscript` типово вимкнено; увімкніть його, щоб надсилати підтвердження транскрипту назад до початкового чату перед обробкою агентом.
- `tools.media.audio.echoFormat` налаштовує текст відлуння (заповнювач: `{transcript}`).
- stdout CLI обмежено (5MB); тримайте вивід CLI стислим.
- CLI `args` має використовувати `{{MediaPath}}` для локального шляху до аудіофайлу. Запустіть `openclaw doctor --fix`, щоб мігрувати застарілі заповнювачі `{input}` зі старіших конфігурацій `audio.transcription.command`.

### Підтримка proxy-середовища

Провайдерське транскрибування аудіо враховує стандартні env vars вихідного proxy:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Якщо env vars proxy не задано, використовується прямий вихід. Якщо конфігурація proxy має неправильний формат, OpenClaw журналює попередження й повертається до прямого fetch.

## Виявлення згадок у групах

Коли для групового чату встановлено `requireMention: true`, OpenClaw тепер транскрибує аудіо **перед** перевіркою згадок. Це дає змогу обробляти голосові нотатки, навіть коли вони містять згадки.

**Як це працює:**

1. Якщо голосове повідомлення не має текстового тіла, а група вимагає згадок, OpenClaw виконує «preflight»-транскрибування.
2. Транскрипт перевіряється на патерни згадок (наприклад, `@BotName`, emoji-тригери).
3. Якщо згадку знайдено, повідомлення проходить через повний pipeline відповіді.
4. Транскрипт використовується для виявлення згадок, щоб голосові нотатки могли пройти mention gate.

**Резервна поведінка:**

- Якщо транскрибування під час preflight завершується помилкою (тайм-аут, помилка API тощо), повідомлення обробляється на основі виявлення згадок лише в тексті.
- Це гарантує, що змішані повідомлення (текст + аудіо) ніколи не буде помилково відкинуто.

**Відмова для окремої групи/теми Telegram:**

- Встановіть `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, щоб пропустити preflight-перевірки згадок у транскрипті для цієї групи.
- Встановіть `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, щоб перевизначити для окремої теми (`true` для пропуску, `false` для примусового ввімкнення).
- Типове значення — `false` (preflight увімкнено, коли умови mention gate збігаються).

**Приклад:** Користувач надсилає голосову нотатку зі словами «Hey @Claude, what's the weather?» у групі Telegram з `requireMention: true`. Голосова нотатка транскрибується, згадка виявляється, і агент відповідає.

## Нюанси

- Правила області дії використовують принцип першого збігу. `chatType` нормалізується до `direct`, `group` або `room`.
- Переконайтеся, що ваш CLI завершується з кодом 0 і друкує звичайний текст; JSON потрібно обробити через `jq -r .text`.
- Для `parakeet-mlx`, якщо ви передаєте `--output-dir`, OpenClaw читає `<output-dir>/<media-basename>.txt`, коли `--output-format` дорівнює `txt` (або його пропущено); формати виводу не `txt` повертаються до розбору stdout.
- Тримайте тайм-аути розумними (`timeoutSeconds`, типово 60s), щоб не блокувати чергу відповідей.
- Preflight-транскрибування обробляє лише **перше** аудіовкладення для виявлення згадок. Додаткове аудіо обробляється під час основної фази розуміння медіа.

## Пов’язане

- [Розуміння медіа](/uk/nodes/media-understanding)
- [Режим розмови](/uk/nodes/talk)
- [Голосове пробудження](/uk/nodes/voicewake)
