---
read_when:
    - Вы хотите использовать преобразование текста в речь ElevenLabs в OpenClaw
    - Вам нужно распознавание речи в текст с помощью ElevenLabs Scribe для аудиовложений
    - Вам нужна транскрипция в реальном времени с помощью ElevenLabs для голосового вызова или Google Meet
summary: Используйте синтез речи ElevenLabs, распознавание речи Scribe и транскрибацию в реальном времени с OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T11:46:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw использует ElevenLabs для синтеза речи, пакетного распознавания речи с помощью Scribe
v2 и потокового распознавания речи с помощью Scribe v2 Realtime. Plugin входит в комплект и
включён по умолчанию; выполнять `plugins install` не требуется.

| Возможность                   | Интерфейс OpenClaw                                                    | По умолчанию             |
| ----------------------------- | --------------------------------------------------------------------- | ------------------------ |
| Синтез речи                   | `messages.tts` / `talk`                                               | `eleven_multilingual_v2` |
| Пакетное распознавание речи   | `tools.media.audio`                                                   | `scribe_v2`              |
| Потоковое распознавание речи  | Потоковая передача Voice Call или `realtime.transcriptionProvider` в Google Meet | `scribe_v2_realtime`     |

## Аутентификация

Задайте `ELEVENLABS_API_KEY` в окружении. Для совместимости с существующими
инструментами ElevenLabs также поддерживается `XI_API_KEY`.

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
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Чтобы использовать синтез речи ElevenLabs v3, задайте для `modelId` значение `eleven_v3`. Для
существующих установок OpenClaw сохраняет `eleven_multilingual_v2` в качестве значения по
умолчанию.

Когда ElevenLabs выбран в качестве поставщика `voice.tts`/`messages.tts`, голосовые каналы
Discord используют потоковую конечную точку синтеза речи ElevenLabs: воспроизведение начинается
из возвращаемого аудиопотока, не дожидаясь, пока OpenClaw сначала загрузит весь аудиофайл.
`latencyTier` соответствует параметру запроса ElevenLabs `optimize_streaming_latency` для
моделей, которые его поддерживают; OpenClaw не передаёт этот параметр для `eleven_v3`, поскольку
эта модель его отклоняет.

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

OpenClaw отправляет аудио в формате multipart в конечную точку ElevenLabs
`/v1/speech-to-text` с параметром `model_id: "scribe_v2"`. При наличии языковые
подсказки передаются в `language_code`.

## Потоковое распознавание речи

Встроенный Plugin `elevenlabs` регистрирует Scribe v2 Realtime для потокового распознавания
речи в Voice Call и агентском режиме Google Meet.

| Параметр              | Путь конфигурации                                                        | По умолчанию                                      |
| --------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Ключ API              | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Используется резервное значение `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Модель                | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Формат аудио          | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Частота дискретизации | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Стратегия фиксации    | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Язык                  | `...elevenlabs.languageCode`                                              | (не задан)                                        |

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
Voice Call получает медиаданные Twilio в формате G.711 u-law с частотой 8 кГц. Поставщик
ElevenLabs для обработки в реальном времени по умолчанию использует `ulaw_8000`, поэтому
телефонные аудиокадры можно передавать без перекодирования.
</Note>

Для агентского режима Google Meet задайте
`plugins.entries.google-meet.config.realtime.transcriptionProvider` значение
`"elevenlabs"` и настройте такой же блок поставщика в
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Связанные материалы

- [Синтез речи](/ru/tools/tts)
- [Google Meet](/ru/plugins/google-meet)
- [Выбор модели](/ru/concepts/model-providers)
