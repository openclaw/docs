---
read_when:
    - Реалізація режиму Talk на macOS/iOS/Android
    - Зміна поведінки голосу/TTS/переривання
summary: 'Режим розмови: безперервні голосові діалоги через локальні STT/TTS і голос у реальному часі'
title: Режим розмови
x-i18n:
    generated_at: "2026-06-27T17:44:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

Режим Talk має дві форми виконання:

- Нативний Talk для macOS/iOS/Android використовує локальне розпізнавання мовлення, чат Gateway і TTS `talk.speak`. Вузли оголошують можливість `talk` і декларують команди `talk.*`, які вони підтримують.
- Talk у браузері використовує `talk.client.create` для клієнтських сеансів `webrtc` і `provider-websocket` або `talk.session.create` для сеансів `gateway-relay`, якими керує Gateway. `managed-room` зарезервовано для передавання керування Gateway і кімнат раційного зв’язку.
- Android Talk може ввімкнути ретрансляційні сеанси реального часу, керовані Gateway, за допомогою `talk.realtime.mode: "realtime"` і `talk.realtime.transport: "gateway-relay"`. Інакше він залишається на нативному розпізнаванні мовлення, чаті Gateway і `talk.speak`.
- Клієнти лише для транскрипції використовують `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, а потім `talk.session.appendAudio`, `talk.session.cancelTurn` і `talk.session.close`, коли їм потрібні субтитри або диктування без голосової відповіді асистента.

Нативний Talk — це безперервний цикл голосової розмови:

1. Слухати мовлення
2. Надіслати транскрипт моделі через активний сеанс
3. Дочекатися відповіді
4. Озвучити її через налаштованого провайдера Talk (`talk.speak`)

Talk у браузері в реальному часі пересилає виклики інструментів провайдера через `talk.client.toolCall`; браузерні клієнти не викликають `chat.send` напряму для консультацій у реальному часі.
Поки активна консультація в реальному часі, клієнти Talk можуть використовувати `talk.client.steer` або
`talk.session.steer`, щоб класифікувати усне введення як `status`, `steer`, `cancel` або
`followup`. Прийняте керування ставиться в чергу активного вбудованого запуску; відхилене
керування повертає структуровану причину, наприклад `no_active_run`, `not_streaming`
або `compacting`.

Talk лише для транскрипції видає той самий спільний конверт подій Talk, що й сеанси реального часу та STT/TTS, але використовує `mode: "transcription"` і `brain: "none"`. Він призначений для субтитрів, диктування та пасивного захоплення мовлення; одноразово завантажені голосові нотатки й далі використовують шлях медіа/аудіо.

## Поведінка (macOS)

- **Постійно ввімкнений оверлей**, поки режим Talk увімкнено.
- Переходи фаз **Listening → Thinking → Speaking**.
- Після **короткої паузи** (вікна тиші) поточний транскрипт надсилається.
- Відповіді **записуються у WebChat** (так само, як під час введення тексту).
- **Переривання мовленням** (типово ввімкнено): якщо користувач починає говорити, поки асистент говорить, ми зупиняємо відтворення й фіксуємо часову позначку переривання для наступного промпта.

## Голосові директиви у відповідях

Асистент може додати до відповіді префікс із **одного рядка JSON**, щоб керувати голосом:

```json
{ "voice": "<voice-id>", "once": true }
```

Правила:

- Лише перший непорожній рядок.
- Невідомі ключі ігноруються.
- `once: true` застосовується лише до поточної відповіді.
- Без `once` голос стає новим типовим для режиму Talk.
- Рядок JSON видаляється перед відтворенням TTS.

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

Типові значення:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: якщо не задано, Talk зберігає типове для платформи вікно паузи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: вибирає активного провайдера Talk. Використовуйте `elevenlabs`, `mlx` або `system` для локальних шляхів відтворення macOS.
- `providers.<provider>.voiceId`: повертається до `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` для ElevenLabs (або до першого голосу ElevenLabs, коли доступний ключ API).
- `providers.elevenlabs.modelId`: типово `eleven_v3`, якщо не задано.
- `providers.mlx.modelId`: типово `mlx-community/Soprano-80M-bf16`, якщо не задано.
- `providers.elevenlabs.apiKey`: повертається до `ELEVENLABS_API_KEY` (або до профілю оболонки gateway, якщо доступний).
- `consultThinkingLevel`: необов’язкове перевизначення рівня мислення для повного запуску агента OpenClaw за викликами `openclaw_agent_consult` у реальному часі.
- `consultFastMode`: необов’язкове перевизначення швидкого режиму для викликів `openclaw_agent_consult` у реальному часі.
- `realtime.provider`: вибирає активного браузерного/серверного голосового провайдера реального часу. Використовуйте `openai` для WebRTC, `google` для WebSocket провайдера або провайдера лише мосту через ретрансляцію Gateway.
- `realtime.providers.<provider>` зберігає конфігурацію реального часу, якою володіє провайдер. Браузер отримує лише тимчасові або обмежені облікові дані сеансу, ніколи не стандартний ключ API.
- `realtime.providers.openai.voice`: вбудований ідентифікатор голосу OpenAI Realtime. Поточні голоси `gpt-realtime-2`: `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` і `cedar`; `marin` і `cedar` рекомендовано для найкращої якості.
- `realtime.transport`: `webrtc` і `provider-websocket` — це браузерні транспорти реального часу. Android використовує ретрансляцію реального часу лише коли це `gateway-relay`; інакше Android Talk використовує свій нативний цикл STT/TTS.
- `realtime.brain`: `agent-consult` спрямовує виклики інструментів реального часу через політику Gateway; `direct-tools` — це застаріла поведінка сумісності прямих інструментів; `none` призначено для транскрипції або зовнішньої оркестрації.
- `realtime.consultRouting`: `provider-direct` зберігає пряму відповідь провайдера, коли він пропускає `openclaw_agent_consult`; `force-agent-consult` натомість змушує ретрансляцію Gateway спрямовувати фіналізовані транскрипти користувача через OpenClaw.
- `realtime.instructions`: додає системні інструкції для провайдера до вбудованого промпта реального часу OpenClaw. Використовуйте це для стилю й тону голосу; OpenClaw зберігає типові настанови `openclaw_agent_consult`.
- `talk.catalog` надає дійсні режими, транспорти, стратегії brain, формати аудіо реального часу та прапорці можливостей кожного провайдера, щоб першосторонні клієнти Talk могли уникати непідтримуваних комбінацій.
- Провайдери потокової транскрипції виявляються через `talk.catalog.transcription`. Поточна ретрансляція Gateway використовує конфігурацію потокового провайдера Voice Call, доки не буде додано спеціальну поверхню конфігурації транскрипції Talk.
- `speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на пристрої в iOS/macOS. Не задавайте, щоб використовувати типове значення пристрою.
- `outputFormat`: типово `pcm_44100` на macOS/iOS і `pcm_24000` на Android (задайте `mp3_*`, щоб примусово ввімкнути потокове MP3)

## Інтерфейс macOS

- Перемикач у рядку меню: **Talk**
- Вкладка конфігурації: група **Talk Mode** (ідентифікатор голосу + перемикач переривання)
- Оверлей:
  - **Listening**: хмара пульсує відповідно до рівня мікрофона
  - **Thinking**: анімація занурення
  - **Speaking**: кільця, що розходяться
  - Натиснути хмару: зупинити мовлення
  - Натиснути X: вийти з режиму Talk

## Інтерфейс Android

- Перемикач на вкладці голосу: **Talk**
- Ручні **Mic** і **Talk** є взаємовиключними режимами захоплення під час виконання.
- Ручний Mic зупиняється, коли застосунок переходить із переднього плану або користувач залишає вкладку Voice.
- Talk Mode продовжує працювати, доки його не вимкнуть або вузол Android не від’єднається, і під час активності використовує тип Android foreground-service для мікрофона.

## Примітки

- Потребує дозволів Speech + Microphone.
- Нативний Talk використовує активний сеанс Gateway і повертається до опитування історії лише тоді, коли події відповіді недоступні.
- Talk у браузері в реальному часі використовує `talk.client.toolCall` для `openclaw_agent_consult` замість того, щоб відкривати `chat.send` браузерним сеансам, якими володіє провайдер.
- Talk лише для транскрипції використовує `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` і `talk.session.close`; клієнти підписуються на `talk.event` для часткових/фінальних оновлень транскрипту.
- Gateway розв’язує відтворення Talk через `talk.speak`, використовуючи активного провайдера Talk. Android повертається до локального системного TTS лише тоді, коли цей RPC недоступний.
- Локальне відтворення MLX на macOS використовує вбудований помічник `openclaw-mlx-tts`, коли він наявний, або виконуваний файл у `PATH`. Задайте `OPENCLAW_MLX_TTS_BIN`, щоб під час розробки вказати власний двійковий файл помічника.
- `stability` для `eleven_v3` перевіряється як `0.0`, `0.5` або `1.0`; інші моделі приймають `0..1`.
- `latency_tier` перевіряється як `0..4`, якщо задано.
- Android підтримує вихідні формати `pcm_16000`, `pcm_22050`, `pcm_24000` і `pcm_44100` для потокового AudioTrack із низькою затримкою.

## Пов’язане

- [Голосове пробудження](/uk/nodes/voicewake)
- [Аудіо та голосові нотатки](/uk/nodes/audio)
- [Розуміння медіа](/uk/nodes/media-understanding)
