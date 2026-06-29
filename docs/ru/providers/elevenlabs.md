---
read_when:
    - Вы хотите использовать преобразование текста в речь ElevenLabs в OpenClaw
    - Вам нужен ElevenLabs Scribe для преобразования речи в текст для аудиовложений
    - Вам нужна транскрипция ElevenLabs в реальном времени для Voice Call или Google Meet
summary: Используйте речь ElevenLabs, Scribe STT и транскрипцию в реальном времени с OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-06-28T23:36:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 126161d7e378382700f203efa9bce1bdd5fe7267b230e2d3d0e45112407d6a7b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw использует ElevenLabs для синтеза речи, пакетного распознавания речи с Scribe
v2 и потокового распознавания речи с Scribe v2 Realtime.

| Возможность                 | Интерфейс OpenClaw                                                   | По умолчанию            |
| --------------------------- | -------------------------------------------------------------------- | ----------------------- |
| Синтез речи                 | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Пакетное распознавание речи | `tools.media.audio`                                                  | `scribe_v2`             |
| Потоковое распознавание речи | Потоковая передача Voice Call или Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`    |

## Аутентификация

Задайте `ELEVENLABS_API_KEY` в окружении. `XI_API_KEY` также принимается для
совместимости с существующими инструментами ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Синтез речи

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Задайте для `modelId` значение `eleven_v3`, чтобы использовать ElevenLabs v3 TTS. OpenClaw сохраняет
`eleven_multilingual_v2` вариантом по умолчанию для существующих установок.

Голосовые каналы Discord используют потоковую конечную точку TTS ElevenLabs, когда ElevenLabs выбран
как провайдер `voice.tts`/`messages.tts`. Воспроизведение начинается из
возвращенного аудиопотока, а не после того, как OpenClaw сначала загрузит и запишет
весь аудиофайл. `latencyTier` сопоставляется с параметром запроса ElevenLabs
`optimize_streaming_latency` для моделей, которые его принимают; OpenClaw
пропускает этот параметр для `eleven_v3`, которая его отклоняет.

## Распознавание речи

Используйте Scribe v2 для входящих аудиовложений и коротких записанных голосовых фрагментов:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw отправляет multipart-аудио в ElevenLabs `/v1/speech-to-text` с
`model_id: "scribe_v2"`. Подсказки языка сопоставляются с `language_code`, если присутствуют.

## Потоковое распознавание речи

Встроенный `elevenlabs` Plugin регистрирует Scribe v2 Realtime для потоковой транскрипции
Voice Call и Google Meet в режиме агента.

| Настройка        | Путь конфигурации                                                       | По умолчанию                                     |
| ---------------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| Ключ API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Использует резервно `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Модель           | `...elevenlabs.modelId`                                                 | `scribe_v2_realtime`                            |
| Формат аудио     | `...elevenlabs.audioFormat`                                             | `ulaw_8000`                                     |
| Частота дискретизации | `...elevenlabs.sampleRate`                                         | `8000`                                          |
| Стратегия коммита | `...elevenlabs.commitStrategy`                                         | `vad`                                           |
| Язык             | `...elevenlabs.languageCode`                                            | (не задано)                                     |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call получает медиа Twilio как 8 кГц G.711 u-law. Провайдер реального времени ElevenLabs
по умолчанию использует `ulaw_8000`, поэтому телефонные фреймы можно пересылать без
транскодирования.
</Note>

Для режима агента Google Meet задайте
`plugins.entries.google-meet.config.realtime.transcriptionProvider` значение
`"elevenlabs"` и настройте тот же блок провайдера в
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Связанные материалы

- [Синтез речи](/ru/tools/tts)
- [Google Meet](/ru/plugins/google-meet)
- [Выбор модели](/ru/concepts/model-providers)
