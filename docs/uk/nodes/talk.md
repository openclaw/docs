---
read_when:
    - Реалізація режиму розмови на macOS/iOS/Android
    - Зміна поведінки голосу/TTS/переривань
summary: 'Режим розмови: безперервні голосові розмови з локальними STT/TTS і голосом у реальному часі'
title: Режим розмови
x-i18n:
    generated_at: "2026-05-11T20:44:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28e5feae8af8ff89472dfb73c44c590b2f7fab3c0ca335b67603c7fd9d50dfe7
    source_path: nodes/talk.md
    workflow: 16
---

Режим розмови має дві runtime-форми:

- Нативний режим розмови macOS/iOS/Android використовує локальне розпізнавання мовлення, чат Gateway і TTS `talk.speak`. Вузли оголошують capability `talk` і декларують команди `talk.*`, які вони підтримують.
- Браузерний режим розмови використовує `talk.client.create` для клієнтських сесій `webrtc` і `provider-websocket`, або `talk.session.create` для сесій `gateway-relay`, якими володіє Gateway. `managed-room` зарезервовано для передавання керування Gateway і кімнат walkie-talkie.
- Клієнти лише для транскрипції використовують `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, а потім `talk.session.appendAudio`, `talk.session.cancelTurn` і `talk.session.close`, коли їм потрібні субтитри або диктування без голосової відповіді асистента.

Нативний режим розмови — це безперервний цикл голосової розмови:

1. Слухати мовлення
2. Надіслати транскрипт до моделі через активну сесію
3. Дочекатися відповіді
4. Озвучити її через налаштований провайдер розмови (`talk.speak`)

Браузерний realtime-режим розмови передає виклики інструментів провайдера через `talk.client.toolCall`; браузерні клієнти не викликають `chat.send` напряму для realtime-консультацій.

Режим розмови лише для транскрипції надсилає ту саму спільну оболонку подій розмови, що й realtime-сесії та сесії STT/TTS, але використовує `mode: "transcription"` і `brain: "none"`. Він призначений для субтитрів, диктування та мовленнєвого захоплення лише для спостереження; одноразово завантажені голосові нотатки й надалі використовують шлях media/audio.

## Поведінка (macOS)

- **Постійний overlay**, доки режим розмови ввімкнено.
- Переходи фаз **Слухання → Обдумування → Говоріння**.
- Після **короткої паузи** (вікна тиші) поточний транскрипт надсилається.
- Відповіді **записуються у WebChat** (так само, як під час введення тексту).
- **Переривання мовленням** (увімкнено за замовчуванням): якщо користувач починає говорити, поки асистент говорить, ми зупиняємо відтворення й фіксуємо timestamp переривання для наступного prompt.

## Голосові директиви у відповідях

Асистент може додати на початку відповіді **один JSON-рядок** для керування голосом:

```json
{ "voice": "<voice-id>", "once": true }
```

Правила:

- Лише перший непорожній рядок.
- Невідомі ключі ігноруються.
- `once: true` застосовується лише до поточної відповіді.
- Без `once` голос стає новим стандартним для режиму розмови.
- JSON-рядок вилучається перед відтворенням TTS.

Підтримувані ключі:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Конфігурація (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Стандартні значення:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: якщо не задано, режим розмови зберігає стандартне для платформи вікно паузи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: вибирає активного провайдера розмови. Використовуйте `elevenlabs`, `mlx` або `system` для шляхів локального відтворення на macOS.
- `providers.<provider>.voiceId`: використовує fallback до `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` для ElevenLabs (або першого голосу ElevenLabs, коли API key доступний).
- `providers.elevenlabs.modelId`: за замовчуванням `eleven_v3`, якщо не задано.
- `providers.mlx.modelId`: за замовчуванням `mlx-community/Soprano-80M-bf16`, якщо не задано.
- `providers.elevenlabs.apiKey`: використовує fallback до `ELEVENLABS_API_KEY` (або shell-профілю gateway, якщо доступний).
- `consultThinkingLevel`: необов’язкове перевизначення рівня мислення для повного запуску агента OpenClaw за realtime-викликами `openclaw_agent_consult`.
- `consultFastMode`: необов’язкове перевизначення швидкого режиму для realtime-викликів `openclaw_agent_consult`.
- `realtime.provider`: вибирає активного браузерного/серверного realtime-провайдера голосу. Використовуйте `openai` для WebRTC, `google` для провайдерського WebSocket або провайдера лише з bridge через Gateway relay.
- `realtime.providers.<provider>` зберігає realtime-конфігурацію, якою володіє провайдер. Браузер отримує лише ефемерні або обмежені облікові дані сесії, ніколи не стандартний API key.
- `realtime.providers.openai.voice`: вбудований ідентифікатор голосу OpenAI Realtime. Поточні голоси `gpt-realtime-2`: `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` і `cedar`; `marin` і `cedar` рекомендовані для найкращої якості.
- `realtime.brain`: `agent-consult` маршрутизує realtime-виклики інструментів через політику Gateway; `direct-tools` — сумісна поведінка лише для власника; `none` призначено для транскрипції або зовнішньої оркестрації.
- `realtime.instructions`: додає системні інструкції для провайдера до вбудованого realtime prompt OpenClaw. Використовуйте це для стилю й тону голосу; OpenClaw зберігає стандартні вказівки `openclaw_agent_consult`.
- `talk.catalog` надає дійсні режими, транспорти, стратегії brain, realtime-формати аудіо й capability-прапорці кожного провайдера, щоб first-party клієнти розмови могли уникати непідтримуваних комбінацій.
- Провайдери потокової транскрипції виявляються через `talk.catalog.transcription`. Поточний Gateway relay використовує конфігурацію потокового провайдера Voice Call, доки не буде додано окрему конфігураційну поверхню транскрипції для розмови.
- `speechLocale`: необов’язковий BCP 47 locale id для on-device розпізнавання мовлення розмови на iOS/macOS. Не задавайте, щоб використовувати стандарт пристрою.
- `outputFormat`: за замовчуванням `pcm_44100` на macOS/iOS і `pcm_24000` на Android (задайте `mp3_*`, щоб примусово ввімкнути MP3 streaming)

## UI macOS

- Перемикач у рядку меню: **Розмова**
- Вкладка конфігурації: група **Режим розмови** (ідентифікатор голосу + перемикач переривання)
- Overlay:
  - **Слухання**: хмара пульсує з рівнем мікрофона
  - **Обдумування**: анімація занурення
  - **Говоріння**: кільця, що розходяться
  - Клацання хмари: зупинити говоріння
  - Клацання X: вийти з режиму розмови

## UI Android

- Перемикач вкладки голосу: **Розмова**
- Ручні режими **Мікрофон** і **Розмова** є взаємовиключними runtime-режимами захоплення.
- Ручний мікрофон зупиняється, коли застосунок виходить із foreground або користувач залишає вкладку голосу.
- Режим розмови працює, доки його не вимкнуть або доки Android-вузол не від’єднається, і під час активності використовує тип foreground-service для мікрофона Android.

## Примітки

- Потрібні дозволи Speech + Microphone.
- Нативний режим розмови використовує активну сесію Gateway і повертається до опитування історії лише тоді, коли події відповіді недоступні.
- Браузерний realtime-режим розмови використовує `talk.client.toolCall` для `openclaw_agent_consult` замість відкриття `chat.send` для браузерних сесій, якими володіє провайдер.
- Режим розмови лише для транскрипції використовує `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` і `talk.session.close`; клієнти підписуються на `talk.event` для часткових/фінальних оновлень транскрипту.
- Gateway виконує відтворення розмови через `talk.speak`, використовуючи активного провайдера розмови. Android використовує fallback до локального системного TTS лише тоді, коли цей RPC недоступний.
- Локальне відтворення MLX на macOS використовує bundled helper `openclaw-mlx-tts`, коли він наявний, або виконуваний файл у `PATH`. Задайте `OPENCLAW_MLX_TTS_BIN`, щоб указати custom helper binary під час розробки.
- `stability` для `eleven_v3` перевіряється на значення `0.0`, `0.5` або `1.0`; інші моделі приймають `0..1`.
- `latency_tier` перевіряється на `0..4`, якщо задано.
- Android підтримує формати виводу `pcm_16000`, `pcm_22050`, `pcm_24000` і `pcm_44100` для low-latency AudioTrack streaming.

## Пов’язане

- [Голосове пробудження](/uk/nodes/voicewake)
- [Аудіо та голосові нотатки](/uk/nodes/audio)
- [Розуміння медіа](/uk/nodes/media-understanding)
