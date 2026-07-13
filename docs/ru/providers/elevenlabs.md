---
read_when:
    - Вы хотите использовать преобразование текста в речь ElevenLabs в OpenClaw
    - Вы хотите использовать преобразование речи в текст ElevenLabs Scribe для аудиовложений
    - Вам нужна транскрипция в реальном времени с помощью ElevenLabs для голосовых вызовов или Google Meet
summary: Используйте синтез речи ElevenLabs, Scribe STT и транскрибирование в реальном времени с OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-13T20:12:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw использует ElevenLabs для преобразования текста в речь, пакетного распознавания речи с помощью Scribe
v2 и потокового распознавания речи с помощью Scribe v2 Realtime. Плагин входит в комплект и
включён по умолчанию; шаг `plugins install` не требуется.

| Возможность                     | Интерфейс OpenClaw                                                   | Значение по умолчанию    |
| ------------------------------- | -------------------------------------------------------------------- | ------------------------ |
| Преобразование текста в речь    | `messages.tts` / `talk`                              | `eleven_multilingual_v2`       |
| Пакетное распознавание речи     | `tools.media.audio`                                                   | `scribe_v2`       |
| Потоковое распознавание речи    | Потоковая передача Voice Call или Google Meet `realtime.transcriptionProvider`     | `scribe_v2_realtime`       |

## Аутентификация

Задайте `ELEVENLABS_API_KEY` в окружении. `XI_API_KEY` также поддерживается для
совместимости с существующими инструментами ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Преобразование текста в речь

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Задайте `modelId` равным `eleven_v3`, чтобы использовать ElevenLabs v3 TTS. OpenClaw сохраняет
`eleven_multilingual_v2` в качестве значения по умолчанию для существующих установок.

Голосовые каналы Discord используют потоковую конечную точку TTS ElevenLabs, когда ElevenLabs
выбран в качестве провайдера `voice.tts`/`messages.tts`: воспроизведение начинается из
возвращённого аудиопотока, не дожидаясь, пока OpenClaw сначала загрузит весь
аудиофайл. `latencyTier` сопоставляется с параметром запроса ElevenLabs `optimize_streaming_latency`
для моделей, которые его поддерживают; OpenClaw не передаёт этот параметр для
`eleven_v3`, поскольку эта модель его отклоняет.

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

OpenClaw отправляет аудио в формате multipart в ElevenLabs `/v1/speech-to-text` с
`model_id: "scribe_v2"`. Подсказки языка при наличии сопоставляются с `language_code`.

## Потоковое распознавание речи

Входящий в комплект плагин `elevenlabs` регистрирует Scribe v2 Realtime для потоковой
транскрипции Voice Call и Google Meet в режиме агента.

| Настройка             | Путь конфигурации                                                        | Значение по умолчанию                            |
| --------------------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| Ключ API              | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`                                                       | Резервно используются `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Модель                | `...elevenlabs.modelId`                                                       | `scribe_v2_realtime`                               |
| Формат аудио          | `...elevenlabs.audioFormat`                                                       | `ulaw_8000`                               |
| Частота дискретизации | `...elevenlabs.sampleRate`                                                       | `8000`                               |
| Стратегия фиксации    | `...elevenlabs.commitStrategy`                                                       | `vad`                               |
| Язык                  | `...elevenlabs.languageCode`                                                       | (не задано)                                      |

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
Voice Call получает медиаданные Twilio в формате 8 кГц G.711 u-law. Провайдер реального времени
ElevenLabs по умолчанию использует `ulaw_8000`, поэтому кадры телефонии можно передавать без
перекодирования.
</Note>

Для режима агента Google Meet задайте
`plugins.entries.google-meet.config.realtime.transcriptionProvider` равным
`"elevenlabs"` и настройте тот же блок провайдера в
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## См. также

- [Преобразование текста в речь](/ru/tools/tts)
- [Google Meet](/ru/plugins/google-meet)
- [Выбор модели](/ru/concepts/model-providers)
