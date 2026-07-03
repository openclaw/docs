---
read_when:
    - Реализация режима разговора на macOS/iOS/Android
    - Изменение поведения голоса, TTS и прерываний
summary: 'Режим разговора: непрерывные речевые беседы через локальные STT/TTS и голос в реальном времени'
title: Режим разговора
x-i18n:
    generated_at: "2026-07-03T09:50:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

Режим Talk имеет две runtime-формы:

- Нативный Talk для macOS/iOS/Android использует локальное распознавание речи, чат Gateway и TTS `talk.speak`. Узлы объявляют capability `talk` и команды `talk.*`, которые они поддерживают.
- iOS Talk использует принадлежащий клиенту WebRTC для realtime-конфигураций OpenAI, которые выбирают `webrtc` или не указывают transport. Явные конфигурации `gateway-relay`, `provider-websocket` и не-OpenAI realtime остаются на принадлежащем Gateway relay; не-realtime конфигурации используют нативный речевой цикл.
- Browser Talk использует `talk.client.create` для принадлежащих клиенту сессий `webrtc` и `provider-websocket` или `talk.session.create` для принадлежащих Gateway сессий `gateway-relay`. `managed-room` зарезервирован для передачи управления Gateway и комнат раций.
- Android Talk может включать принадлежащие Gateway realtime relay-сессии с `talk.realtime.mode: "realtime"` и `talk.realtime.transport: "gateway-relay"`. В остальных случаях он остается на нативном распознавании речи, чате Gateway и `talk.speak`.
- Клиенты только для транскрибации используют `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, затем `talk.session.appendAudio`, `talk.session.cancelTurn` и `talk.session.close`, когда им нужны субтитры или диктовка без голосового ответа ассистента.

Нативный Talk — это непрерывный цикл голосового разговора:

1. Слушать речь
2. Отправить транскрипт модели через активную сессию
3. Дождаться ответа
4. Произнести его через настроенного провайдера Talk (`talk.speak`)

Принадлежащий клиенту realtime Talk пересылает tool calls провайдера через `talk.client.toolCall`; такие клиенты не вызывают `chat.send` напрямую для realtime-консультаций.
Пока realtime-консультация активна, клиенты Talk могут использовать `talk.client.steer` или
`talk.session.steer`, чтобы классифицировать голосовой ввод как `status`, `steer`, `cancel` или
`followup`. Принятое steering ставится в очередь активного встроенного запуска; отклоненное
steering возвращает структурированную причину, например `no_active_run`, `not_streaming`
или `compacting`.

Talk только для транскрибации отправляет тот же общий конверт событий Talk, что и realtime- и STT/TTS-сессии, но использует `mode: "transcription"` и `brain: "none"`. Он предназначен для субтитров, диктовки и пассивного захвата речи; одноразово загруженные голосовые заметки по-прежнему используют путь media/audio.

## Поведение (macOS)

- **Постоянно включенный overlay**, пока включен режим Talk.
- Переходы фаз **Listening → Thinking → Speaking**.
- При **короткой паузе** (окно тишины) текущий транскрипт отправляется.
- Ответы **записываются в WebChat** (как при вводе текста).
- **Прерывание при речи** (включено по умолчанию): если пользователь начинает говорить, пока ассистент произносит ответ, мы останавливаем воспроизведение и фиксируем timestamp прерывания для следующего prompt.

## Голосовые директивы в ответах

Ассистент может добавить в начало ответа **одну строку JSON** для управления голосом:

```json
{ "voice": "<voice-id>", "once": true }
```

Правила:

- Только первая непустая строка.
- Неизвестные ключи игнорируются.
- `once: true` применяется только к текущему ответу.
- Без `once` голос становится новым значением по умолчанию для режима Talk.
- Строка JSON удаляется перед воспроизведением TTS.

Поддерживаемые ключи:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Конфигурация (`~/.openclaw/openclaw.json`)

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

Значения по умолчанию:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: если не задано, Talk сохраняет стандартное для платформы окно паузы перед отправкой транскрипта (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: выбирает активного провайдера Talk. Используйте `elevenlabs`, `mlx` или `system` для локальных путей воспроизведения macOS.
- `providers.<provider>.voiceId`: откатывается к `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` для ElevenLabs (или к первому голосу ElevenLabs, когда доступен API key).
- `providers.elevenlabs.modelId`: по умолчанию `eleven_v3`, если не задано.
- `providers.mlx.modelId`: по умолчанию `mlx-community/Soprano-80M-bf16`, если не задано.
- `providers.elevenlabs.apiKey`: откатывается к `ELEVENLABS_API_KEY` (или к gateway shell profile, если доступен).
- `consultThinkingLevel`: необязательное переопределение уровня мышления для полного запуска агента OpenClaw за realtime-вызовами `openclaw_agent_consult`.
- `consultFastMode`: необязательное переопределение fast-mode для realtime-вызовов `openclaw_agent_consult`.
- `realtime.provider`: выбирает активного realtime voice provider. Используйте `openai` для WebRTC, `google` для provider WebSocket или bridge-only provider через Gateway relay.
- `realtime.providers.<provider>` хранит принадлежащую провайдеру realtime-конфигурацию. Браузер получает только эфемерные или ограниченные учетные данные сессии, но никогда стандартный API key.
- `realtime.providers.openai.voice`: встроенный id голоса OpenAI Realtime. Текущие голоса `gpt-realtime-2`: `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` и `cedar`; `marin` и `cedar` рекомендуются для лучшего качества.
- `realtime.transport`: `webrtc` использует принадлежащий клиенту OpenAI WebRTC на iOS и в браузере. `provider-websocket` принадлежит браузеру, но на iOS остается на Gateway relay. `gateway-relay` сохраняет audio провайдера на Gateway; Android использует realtime только для этого transport, а в остальных случаях сохраняет свой нативный цикл STT/TTS.
- `realtime.brain`: `agent-consult` направляет realtime tool calls через политику Gateway; `direct-tools` — устаревшее поведение совместимости с прямыми tools; `none` предназначен для транскрибации или внешней оркестрации.
- `realtime.consultRouting`: `provider-direct` сохраняет прямой ответ провайдера, когда он пропускает `openclaw_agent_consult`; `force-agent-consult` заставляет Gateway relay направлять финализированные пользовательские транскрипты через OpenClaw.
- `realtime.instructions`: добавляет системные инструкции, видимые провайдеру, к встроенному realtime prompt OpenClaw. Используйте это для стиля и тона голоса; OpenClaw сохраняет стандартные указания `openclaw_agent_consult`.
- `talk.catalog` предоставляет канонические provider ids и registry aliases вместе с допустимыми modes, transports, brain strategies, realtime audio formats, capability flags и выбранным runtime результатом readiness для каждого провайдера. Собственные клиенты Talk должны использовать этот каталог вместо локального поддержания aliases провайдеров; старый Gateway, который не передает group readiness, считается непроверенным, а не определенно ненастроенным.
- Провайдеры потоковой транскрибации обнаруживаются через `talk.catalog.transcription`. Текущий Gateway relay использует конфигурацию streaming provider для Voice Call, пока не будет добавлена выделенная поверхность конфигурации транскрибации Talk.
- `speechLocale`: необязательный BCP 47 locale id для on-device распознавания речи Talk на iOS/macOS. Оставьте незаданным, чтобы использовать значение устройства по умолчанию.
- `outputFormat`: по умолчанию `pcm_44100` на macOS/iOS и `pcm_24000` на Android (задайте `mp3_*`, чтобы принудительно включить MP3 streaming)

## UI macOS

- Переключатель в строке меню: **Talk**
- Вкладка конфигурации: группа **Talk Mode** (voice id + переключатель прерывания)
- Overlay:
  - **Listening**: облако пульсирует с уровнем микрофона
  - **Thinking**: погружающаяся анимация
  - **Speaking**: расходящиеся кольца
  - Нажатие на облако: остановить речь
  - Нажатие X: выйти из режима Talk

## UI Android

- Переключатель вкладки Voice: **Talk**
- Ручные **Mic** и **Talk** — взаимоисключающие runtime-режимы захвата.
- Ручной Mic и realtime Talk предпочитают подключенный Bluetooth Classic или BLE-микрофон гарнитуры. Если он отключается, приложение запрашивает другой вход гарнитуры или позволяет Android использовать микрофон по умолчанию; остановка захвата восстанавливает предпочтение микрофона по умолчанию.
- Ручной Mic останавливается, когда приложение уходит из foreground или пользователь покидает вкладку Voice.
- Talk Mode продолжает работать, пока его не выключат или пока узел Android не отключится, и во время активности использует Android microphone foreground-service type.

## Примечания

- Требуются разрешения Speech + Microphone.
- Нативный Talk использует активную сессию Gateway и откатывается к опросу истории только когда события ответа недоступны.
- Принадлежащий клиенту realtime Talk использует `talk.client.toolCall` для `openclaw_agent_consult` вместо предоставления `chat.send` сессиям, принадлежащим провайдеру.
- Talk только для транскрибации использует `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` и `talk.session.close`; клиенты подписываются на `talk.event` для частичных/финальных обновлений транскрипта.
- Gateway разрешает воспроизведение Talk через `talk.speak`, используя активного провайдера Talk. Android откатывается к локальному системному TTS только когда этот RPC недоступен.
- Локальное воспроизведение MLX на macOS использует встроенный helper `openclaw-mlx-tts`, когда он присутствует, или исполняемый файл в `PATH`. Задайте `OPENCLAW_MLX_TTS_BIN`, чтобы указать на пользовательский helper binary во время разработки.
- `stability` для `eleven_v3` проверяется как `0.0`, `0.5` или `1.0`; другие модели принимают `0..1`.
- `latency_tier` проверяется как `0..4`, когда задан.
- Android поддерживает output formats `pcm_16000`, `pcm_22050`, `pcm_24000` и `pcm_44100` для low-latency streaming через AudioTrack.

## Связанные материалы

- [Голосовое пробуждение](/ru/nodes/voicewake)
- [Аудио и голосовые заметки](/ru/nodes/audio)
- [Понимание медиа](/ru/nodes/media-understanding)
