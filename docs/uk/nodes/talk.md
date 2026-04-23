---
read_when:
    - Реалізація режиму talk на macOS/iOS/Android
    - Зміна поведінки голосу/TTS/interrupt
summary: 'Режим talk: безперервні голосові розмови з ElevenLabs TTS'
title: Режим talk
x-i18n:
    generated_at: "2026-04-23T20:59:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fdd0f51f388fb2aec2773a201234fcedddb91a09ee7417d87bd91c113b660d8
    source_path: nodes/talk.md
    workflow: 15
---

Режим talk — це безперервний цикл голосової розмови:

1. Слухати мовлення
2. Надіслати транскрипт моделі (основна сесія, `chat.send`)
3. Дочекатися відповіді
4. Озвучити її через налаштований provider Talk (`talk.speak`)

## Поведінка (macOS)

- **Постійно ввімкнений overlay**, поки режим talk активний.
- Переходи між фазами **Listening → Thinking → Speaking**.
- Під час **короткої паузи** (вікно тиші) поточний транскрипт надсилається.
- Відповіді **записуються у WebChat** (так само, як під час набору).
- **Interrupt on speech** (типово ввімкнено): якщо користувач починає говорити, поки асистент говорить, ми зупиняємо відтворення й фіксуємо часову мітку переривання для наступного prompt.

## Голосові директиви у відповідях

Асистент може додати на початку відповіді **один рядок JSON**, щоб керувати голосом:

```json
{ "voice": "<voice-id>", "once": true }
```

Правила:

- Лише перший непорожній рядок.
- Невідомі ключі ігноруються.
- `once: true` застосовується лише до поточної відповіді.
- Без `once` голос стає новим типовим значенням для режиму talk.
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
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Типові значення:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: якщо не задано, Talk використовує типове для платформи вікно паузи перед надсиланням транскрипту (`700 ms` на macOS і Android, `900 ms` на iOS)
- `voiceId`: резервно використовує `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (або перший голос ElevenLabs, коли доступний API key)
- `modelId`: якщо не задано, типове значення — `eleven_v3`
- `apiKey`: резервно використовує `ELEVENLABS_API_KEY` (або shell-профіль gateway, якщо доступний)
- `outputFormat`: типово `pcm_44100` на macOS/iOS і `pcm_24000` на Android (задайте `mp3_*`, щоб примусово використовувати MP3 streaming)

## UI на macOS

- Перемикач у рядку меню: **Talk**
- Вкладка Config: група **Talk Mode** (voice id + перемикач interrupt)
- Overlay:
  - **Listening**: хмара пульсує відповідно до рівня мікрофона
  - **Thinking**: анімація занурення
  - **Speaking**: кільця, що розходяться
  - Клік по хмарі: зупинити мовлення
  - Клік по X: вийти з режиму talk

## Примітки

- Потребує дозволів Speech і Microphone.
- Використовує `chat.send` для ключа сесії `main`.
- Gateway розв’язує відтворення Talk через `talk.speak`, використовуючи активний provider Talk. Android повертається до локального системного TTS лише тоді, коли цей RPC недоступний.
- `stability` для `eleven_v3` перевіряється на значення `0.0`, `0.5` або `1.0`; інші моделі приймають `0..1`.
- `latency_tier` перевіряється на `0..4`, якщо його задано.
- Android підтримує формати виводу `pcm_16000`, `pcm_22050`, `pcm_24000` і `pcm_44100` для низьколатентного AudioTrack streaming.
