---
read_when:
    - Реализация режима Talk в macOS/iOS/Android
    - Изменение поведения голоса/TTS/прерываний
summary: 'Режим разговора: непрерывные речевые беседы через локальные STT/TTS и голос в реальном времени'
title: Режим разговора
x-i18n:
    generated_at: "2026-07-03T01:02:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22e1539de48fea2b1d4f04c2a6935b011c55a9a6d700b6caadc4daf5b038b60d
    source_path: nodes/talk.md
    workflow: 16
---

Режим Talk имеет две runtime-формы:

- Нативный Talk для macOS/iOS/Android использует локальное распознавание речи, чат Gateway и TTS `talk.speak`. Узлы объявляют возможность `talk` и декларируют поддерживаемые ими команды `talk.*`.
- iOS Talk использует принадлежащий клиенту WebRTC для realtime-конфигураций OpenAI, которые выбирают `webrtc` или не указывают транспорт. Явные конфигурации `gateway-relay`, `provider-websocket` и realtime-конфигурации не OpenAI остаются на relay, принадлежащем Gateway; не-realtime конфигурации используют нативный речевой цикл.
- Browser Talk использует `talk.client.create` для принадлежащих клиенту сессий `webrtc` и `provider-websocket` или `talk.session.create` для принадлежащих Gateway сессий `gateway-relay`. `managed-room` зарезервирован для передачи управления Gateway и комнат рации.
- Android Talk может включать принадлежащие Gateway realtime relay-сессии с `talk.realtime.mode: "realtime"` и `talk.realtime.transport: "gateway-relay"`. В остальных случаях он остается на нативном распознавании речи, чате Gateway и `talk.speak`.
- Клиенты только для транскрипции используют `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, затем `talk.session.appendAudio`, `talk.session.cancelTurn` и `talk.session.close`, когда им нужны субтитры или диктовка без голосового ответа ассистента.

Нативный Talk — это непрерывный цикл голосового разговора:

1. Слушать речь
2. Отправить транскрипт модели через активную сессию
3. Дождаться ответа
4. Произнести его через настроенного провайдера Talk (`talk.speak`)

Realtime Talk, принадлежащий клиенту, пересылает tool-вызовы провайдера через `talk.client.toolCall`; такие клиенты не вызывают `chat.send` напрямую для realtime-консультаций.
Пока realtime-консультация активна, клиенты Talk могут использовать `talk.client.steer` или
`talk.session.steer`, чтобы классифицировать речевой ввод как `status`, `steer`, `cancel` или
`followup`. Принятые steering-команды ставятся в очередь активного встроенного запуска; отклоненные
steering-команды возвращают структурированную причину, например `no_active_run`, `not_streaming`
или `compacting`.

Talk только для транскрипции создает тот же общий конверт событий Talk, что и realtime- и STT/TTS-сессии, но использует `mode: "transcription"` и `brain: "none"`. Он предназначен для субтитров, диктовки и захвата речи только для наблюдения; одноразовые загруженные голосовые заметки по-прежнему используют путь media/audio.

## Поведение (macOS)

- **Постоянный оверлей**, пока включен режим Talk.
- Переходы фаз **Listening → Thinking → Speaking**.
- При **короткой паузе** (окно тишины) текущий транскрипт отправляется.
- Ответы **записываются в WebChat** (так же, как при вводе текста).
- **Прерывание речью** (по умолчанию включено): если пользователь начинает говорить, пока ассистент говорит, мы останавливаем воспроизведение и отмечаем временную метку прерывания для следующего prompt.

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
- `providers.<provider>.voiceId`: откатывается к `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` для ElevenLabs (или к первому голосу ElevenLabs, когда доступен API-ключ).
- `providers.elevenlabs.modelId`: по умолчанию `eleven_v3`, если не задано.
- `providers.mlx.modelId`: по умолчанию `mlx-community/Soprano-80M-bf16`, если не задано.
- `providers.elevenlabs.apiKey`: откатывается к `ELEVENLABS_API_KEY` (или к профилю оболочки gateway, если доступен).
- `consultThinkingLevel`: необязательное переопределение уровня мышления для полного запуска агента OpenClaw за realtime-вызовами `openclaw_agent_consult`.
- `consultFastMode`: необязательное переопределение быстрого режима для realtime-вызовов `openclaw_agent_consult`.
- `realtime.provider`: выбирает активного realtime-провайдера голоса. Используйте `openai` для WebRTC, `google` для WebSocket провайдера или bridge-only провайдера через relay Gateway.
- `realtime.providers.<provider>` хранит realtime-конфигурацию, принадлежащую провайдеру. Браузер получает только эфемерные или ограниченные учетные данные сессии, никогда стандартный API-ключ.
- `realtime.providers.openai.voice`: встроенный id голоса OpenAI Realtime. Текущие голоса `gpt-realtime-2`: `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` и `cedar`; `marin` и `cedar` рекомендуются для наилучшего качества.
- `realtime.transport`: `webrtc` использует принадлежащий клиенту OpenAI WebRTC на iOS и в браузере. `provider-websocket` принадлежит браузеру, но на iOS остается на relay Gateway. `gateway-relay` держит аудио провайдера на Gateway; Android использует realtime только для этого транспорта, а в остальных случаях сохраняет свой нативный цикл STT/TTS.
- `realtime.brain`: `agent-consult` маршрутизирует realtime tool-вызовы через политику Gateway; `direct-tools` — устаревшее поведение совместимости с прямыми tools; `none` предназначен для транскрипции или внешней оркестрации.
- `realtime.consultRouting`: `provider-direct` сохраняет прямой ответ провайдера, когда он пропускает `openclaw_agent_consult`; `force-agent-consult` заставляет relay Gateway маршрутизировать финализированные пользовательские транскрипты через OpenClaw.
- `realtime.instructions`: добавляет обращенные к провайдеру системные инструкции к встроенному realtime prompt OpenClaw. Используйте это для стиля и тона голоса; OpenClaw сохраняет стандартные указания `openclaw_agent_consult`.
- `talk.catalog` раскрывает допустимые режимы, транспорты, стратегии brain, realtime-форматы аудио и флаги возможностей каждого провайдера, чтобы собственные клиенты Talk могли избегать неподдерживаемых сочетаний.
- Провайдеры потоковой транскрипции обнаруживаются через `talk.catalog.transcription`. Текущий relay Gateway использует конфигурацию потокового провайдера Voice Call, пока не будет добавлена выделенная поверхность конфигурации транскрипции Talk.
- `speechLocale`: необязательный id локали BCP 47 для распознавания речи Talk на устройстве в iOS/macOS. Оставьте незаданным, чтобы использовать значение устройства по умолчанию.
- `outputFormat`: по умолчанию `pcm_44100` на macOS/iOS и `pcm_24000` на Android (задайте `mp3_*`, чтобы принудительно включить потоковую передачу MP3)

## UI macOS

- Переключатель в строке меню: **Talk**
- Вкладка конфигурации: группа **Talk Mode** (voice id + переключатель прерывания)
- Оверлей:
  - **Listening**: облако пульсирует с уровнем микрофона
  - **Thinking**: анимация погружения
  - **Speaking**: расходящиеся кольца
  - Нажатие на облако: остановить речь
  - Нажатие X: выйти из режима Talk

## UI Android

- Переключатель вкладки Voice: **Talk**
- Ручные режимы захвата **Mic** и **Talk** взаимно исключают друг друга во время выполнения.
- Ручной Mic и realtime Talk предпочитают подключенный микрофон гарнитуры Bluetooth Classic или BLE. Если он отключается, приложение запрашивает другой вход гарнитуры или позволяет Android использовать микрофон по умолчанию; остановка захвата восстанавливает предпочтение микрофона по умолчанию.
- Ручной Mic останавливается, когда приложение уходит из foreground или пользователь покидает вкладку Voice.
- Talk Mode продолжает работать, пока его не выключат или пока узел Android не отключится, и во время активности использует тип foreground-service микрофона Android.

## Примечания

- Требуются разрешения Speech + Microphone.
- Нативный Talk использует активную сессию Gateway и откатывается к опросу истории только тогда, когда события ответа недоступны.
- Realtime Talk, принадлежащий клиенту, использует `talk.client.toolCall` для `openclaw_agent_consult` вместо раскрытия `chat.send` сессиям, принадлежащим провайдеру.
- Talk только для транскрипции использует `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` и `talk.session.close`; клиенты подписываются на `talk.event` для частичных/финальных обновлений транскрипта.
- Gateway разрешает воспроизведение Talk через `talk.speak` с использованием активного провайдера Talk. Android откатывается к локальному системному TTS только тогда, когда этот RPC недоступен.
- Локальное воспроизведение MLX на macOS использует поставляемый helper `openclaw-mlx-tts`, когда он присутствует, или исполняемый файл в `PATH`. Задайте `OPENCLAW_MLX_TTS_BIN`, чтобы во время разработки указать на пользовательский бинарный файл helper.
- `stability` для `eleven_v3` проверяется на `0.0`, `0.5` или `1.0`; другие модели принимают `0..1`.
- `latency_tier` проверяется на `0..4`, когда задан.
- Android поддерживает выходные форматы `pcm_16000`, `pcm_22050`, `pcm_24000` и `pcm_44100` для потоковой передачи AudioTrack с низкой задержкой.

## Связанные материалы

- [Голосовое пробуждение](/ru/nodes/voicewake)
- [Аудио и голосовые заметки](/ru/nodes/audio)
- [Понимание медиа](/ru/nodes/media-understanding)
