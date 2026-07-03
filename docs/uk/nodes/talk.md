---
read_when:
    - Реалізація режиму розмови на macOS/iOS/Android
    - Зміна поведінки голосу/TTS/переривання
summary: 'Режим розмови: безперервні голосові розмови через локальні STT/TTS і голос у реальному часі'
title: Режим розмови
x-i18n:
    generated_at: "2026-07-03T01:04:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22e1539de48fea2b1d4f04c2a6935b011c55a9a6d700b6caadc4daf5b038b60d
    source_path: nodes/talk.md
    workflow: 16
---

Режим розмови має дві форми виконання:

- Нативна розмова на macOS/iOS/Android використовує локальне розпізнавання мовлення, чат Gateway і TTS `talk.speak`. Вузли оголошують можливість `talk` і декларують команди `talk.*`, які вони підтримують.
- Розмова на iOS використовує WebRTC під керуванням клієнта для realtime-конфігурацій OpenAI, які вибирають `webrtc` або не вказують транспорт. Явні конфігурації `gateway-relay`, `provider-websocket` і не-OpenAI realtime залишаються на relay під керуванням Gateway; не-realtime конфігурації використовують нативний мовленнєвий цикл.
- Розмова в браузері використовує `talk.client.create` для сеансів `webrtc` і `provider-websocket` під керуванням клієнта або `talk.session.create` для сеансів `gateway-relay` під керуванням Gateway. `managed-room` зарезервовано для передачі керування Gateway і кімнат walkie-talkie.
- Розмова на Android може вмикати realtime relay-сеанси під керуванням Gateway за допомогою `talk.realtime.mode: "realtime"` і `talk.realtime.transport: "gateway-relay"`. Інакше вона лишається на нативному розпізнаванні мовлення, чаті Gateway і `talk.speak`.
- Клієнти лише для транскрибування використовують `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, а потім `talk.session.appendAudio`, `talk.session.cancelTurn` і `talk.session.close`, коли їм потрібні субтитри або диктування без голосової відповіді асистента.

Нативна розмова — це безперервний цикл голосової розмови:

1. Слухати мовлення
2. Надіслати транскрипт до моделі через активний сеанс
3. Дочекатися відповіді
4. Озвучити її через налаштованого провайдера розмови (`talk.speak`)

Realtime-розмова під керуванням клієнта пересилає виклики інструментів провайдера через `talk.client.toolCall`; ці клієнти не викликають `chat.send` напряму для realtime-консультацій.
Поки realtime-консультація активна, клієнти розмови можуть використовувати `talk.client.steer` або
`talk.session.steer`, щоб класифікувати сказане введення як `status`, `steer`, `cancel` або
`followup`. Прийняте керування ставиться в чергу активного вбудованого запуску; відхилене
керування повертає структуровану причину, як-от `no_active_run`, `not_streaming`
або `compacting`.

Розмова лише для транскрибування створює ту саму спільну оболонку подій розмови, що й realtime та STT/TTS-сеанси, але використовує `mode: "transcription"` і `brain: "none"`. Вона призначена для субтитрів, диктування та захоплення мовлення лише для спостереження; одноразово завантажені голосові нотатки й далі використовують шлях медіа/аудіо.

## Поведінка (macOS)

- **Накладка завжди ввімкнена**, поки ввімкнено режим розмови.
- Переходи фаз **Слухання → Обдумування → Говоріння**.
- Після **короткої паузи** (вікна тиші) поточний транскрипт надсилається.
- Відповіді **записуються у WebChat** (так само, як під час введення тексту).
- **Переривання мовленням** (увімкнено за замовчуванням): якщо користувач починає говорити, поки асистент говорить, ми зупиняємо відтворення й фіксуємо часову позначку переривання для наступного prompt.

## Голосові директиви у відповідях

Асистент може додати на початок відповіді **один JSON-рядок**, щоб керувати голосом:

```json
{ "voice": "<voice-id>", "once": true }
```

Правила:

- Лише перший непорожній рядок.
- Невідомі ключі ігноруються.
- `once: true` застосовується лише до поточної відповіді.
- Без `once` голос стає новим стандартним для режиму розмови.
- JSON-рядок видаляється перед TTS-відтворенням.

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
- `silenceTimeoutMs`: якщо не задано, розмова зберігає стандартне платформне вікно паузи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: вибирає активного провайдера розмови. Використовуйте `elevenlabs`, `mlx` або `system` для локальних шляхів відтворення на macOS.
- `providers.<provider>.voiceId`: повертається до `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` для ElevenLabs (або до першого голосу ElevenLabs, коли доступний API-ключ).
- `providers.elevenlabs.modelId`: якщо не задано, стандартно використовується `eleven_v3`.
- `providers.mlx.modelId`: якщо не задано, стандартно використовується `mlx-community/Soprano-80M-bf16`.
- `providers.elevenlabs.apiKey`: повертається до `ELEVENLABS_API_KEY` (або до shell-профілю gateway, якщо доступний).
- `consultThinkingLevel`: необов'язкове перевизначення рівня мислення для повного запуску агента OpenClaw за realtime-викликами `openclaw_agent_consult`.
- `consultFastMode`: необов'язкове перевизначення швидкого режиму для realtime-викликів `openclaw_agent_consult`.
- `realtime.provider`: вибирає активного realtime-провайдера голосу. Використовуйте `openai` для WebRTC, `google` для WebSocket провайдера або bridge-only провайдера через relay Gateway.
- `realtime.providers.<provider>` зберігає realtime-конфігурацію, якою володіє провайдер. Браузер отримує лише тимчасові або обмежені облікові дані сеансу, ніколи не стандартний API-ключ.
- `realtime.providers.openai.voice`: вбудований ідентифікатор голосу OpenAI Realtime. Поточні голоси `gpt-realtime-2`: `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` і `cedar`; `marin` і `cedar` рекомендовані для найкращої якості.
- `realtime.transport`: `webrtc` використовує WebRTC OpenAI під керуванням клієнта на iOS і в браузері. `provider-websocket` керується браузером, але на iOS залишається на relay Gateway. `gateway-relay` зберігає аудіо провайдера на Gateway; Android використовує realtime лише для цього транспорту, а в інших випадках зберігає свій нативний STT/TTS-цикл.
- `realtime.brain`: `agent-consult` спрямовує realtime-виклики інструментів через політику Gateway; `direct-tools` — це застаріла поведінка сумісності з прямими інструментами; `none` призначено для транскрибування або зовнішньої оркестрації.
- `realtime.consultRouting`: `provider-direct` зберігає пряму відповідь провайдера, коли він пропускає `openclaw_agent_consult`; `force-agent-consult` змушує relay Gateway спрямовувати фіналізовані транскрипти користувача через OpenClaw.
- `realtime.instructions`: додає системні інструкції для провайдера до вбудованого realtime prompt OpenClaw. Використовуйте це для стилю й тону голосу; OpenClaw зберігає стандартні вказівки `openclaw_agent_consult`.
- `talk.catalog` показує дійсні режими, транспорти, стратегії brain, realtime-формати аудіо та прапорці можливостей кожного провайдера, щоб first-party клієнти розмови могли уникати непідтримуваних комбінацій.
- Провайдери потокового транскрибування виявляються через `talk.catalog.transcription`. Поточний relay Gateway використовує конфігурацію потокового провайдера Voice Call, доки не буде додано окрему поверхню конфігурації транскрибування розмови.
- `speechLocale`: необов'язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення розмови на пристрої в iOS/macOS. Не задавайте, щоб використовувати стандартне значення пристрою.
- `outputFormat`: стандартно `pcm_44100` на macOS/iOS і `pcm_24000` на Android (задайте `mp3_*`, щоб примусово ввімкнути MP3-стримінг)

## Інтерфейс macOS

- Перемикач у рядку меню: **Розмова**
- Вкладка конфігурації: група **Режим розмови** (ідентифікатор голосу + перемикач переривання)
- Накладка:
  - **Слухання**: хмара пульсує за рівнем мікрофона
  - **Обдумування**: анімація занурення
  - **Говоріння**: кільця, що розходяться
  - Натискання хмари: зупинити говоріння
  - Натискання X: вийти з режиму розмови

## Інтерфейс Android

- Перемикач вкладки Voice: **Розмова**
- Ручні **Мікрофон** і **Розмова** є взаємовиключними режимами захоплення під час виконання.
- Ручний мікрофон і realtime-розмова надають перевагу підключеному мікрофону гарнітури Bluetooth Classic або BLE. Якщо він від'єднується, застосунок запитує інший вхід гарнітури або дозволяє Android використовувати стандартний мікрофон; зупинка захоплення відновлює стандартну перевагу мікрофона.
- Ручний мікрофон зупиняється, коли застосунок залишає передній план або користувач залишає вкладку Voice.
- Режим розмови продовжує працювати, доки його не вимкнуть або вузол Android не від'єднається, і під час активності використовує Android-тип foreground-service для мікрофона.

## Примітки

- Потрібні дозволи на мовлення й мікрофон.
- Нативна розмова використовує активний сеанс Gateway і повертається до опитування історії лише тоді, коли події відповіді недоступні.
- Realtime-розмова під керуванням клієнта використовує `talk.client.toolCall` для `openclaw_agent_consult` замість відкриття `chat.send` для сеансів під керуванням провайдера.
- Розмова лише для транскрибування використовує `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` і `talk.session.close`; клієнти підписуються на `talk.event` для часткових/фінальних оновлень транскрипту.
- Gateway розв'язує відтворення розмови через `talk.speak` за допомогою активного провайдера розмови. Android повертається до локального системного TTS лише тоді, коли цей RPC недоступний.
- Локальне MLX-відтворення на macOS використовує bundled-помічник `openclaw-mlx-tts`, коли він наявний, або виконуваний файл у `PATH`. Задайте `OPENCLAW_MLX_TTS_BIN`, щоб під час розробки вказати на власний виконуваний файл помічника.
- `stability` для `eleven_v3` перевіряється на `0.0`, `0.5` або `1.0`; інші моделі приймають `0..1`.
- `latency_tier` перевіряється на `0..4`, коли задано.
- Android підтримує вихідні формати `pcm_16000`, `pcm_22050`, `pcm_24000` і `pcm_44100` для низьколатентного AudioTrack-стримінгу.

## Пов'язане

- [Голосове пробудження](/uk/nodes/voicewake)
- [Аудіо та голосові нотатки](/uk/nodes/audio)
- [Розуміння медіа](/uk/nodes/media-understanding)
