---
read_when:
    - Реализация режима разговора в macOS/iOS/Android
    - Изменение поведения голоса/TTS/прерывания
summary: 'Режим разговора: непрерывные голосовые беседы с локальными STT/TTS и голосом в реальном времени'
title: Режим разговора
x-i18n:
    generated_at: "2026-07-02T22:43:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

Режим Talk имеет две runtime-формы:

- Нативный Talk для macOS/iOS/Android использует локальное распознавание речи, чат Gateway и TTS `talk.speak`. Узлы объявляют возможность `talk` и декларируют поддерживаемые команды `talk.*`.
- Talk для iOS использует управляемый клиентом WebRTC для конфигураций OpenAI реального времени, которые выбирают `webrtc` или не указывают транспорт. Явные конфигурации `gateway-relay`, `provider-websocket` и конфигурации реального времени не для OpenAI остаются на управляемом Gateway реле; конфигурации не реального времени используют нативный речевой цикл.
- Talk в браузере использует `talk.client.create` для управляемых клиентом сеансов `webrtc` и `provider-websocket` либо `talk.session.create` для управляемых Gateway сеансов `gateway-relay`. `managed-room` зарезервирован для передачи управления Gateway и комнат рации.
- Talk для Android может включать управляемые Gateway сеансы реле реального времени с `talk.realtime.mode: "realtime"` и `talk.realtime.transport: "gateway-relay"`. В остальных случаях он остается на нативном распознавании речи, чате Gateway и `talk.speak`.
- Клиенты только для транскрибации используют `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, затем `talk.session.appendAudio`, `talk.session.cancelTurn` и `talk.session.close`, когда им нужны субтитры или диктовка без голосового ответа ассистента.

Нативный Talk — это непрерывный цикл голосового разговора:

1. Слушать речь
2. Отправить транскрипт модели через активный сеанс
3. Дождаться ответа
4. Произнести его через настроенного провайдера Talk (`talk.speak`)

Управляемый клиентом Talk реального времени пересылает вызовы инструментов провайдера через `talk.client.toolCall`; эти клиенты не вызывают `chat.send` напрямую для консультаций реального времени.
Пока консультация реального времени активна, клиенты Talk могут использовать `talk.client.steer` или
`talk.session.steer`, чтобы классифицировать речевой ввод как `status`, `steer`, `cancel` или
`followup`. Принятое управление ставится в очередь активного встроенного запуска; отклоненное
управление возвращает структурированную причину, например `no_active_run`, `not_streaming`
или `compacting`.

Talk только для транскрибации выдает тот же общий конверт событий Talk, что и сеансы реального времени и STT/TTS, но использует `mode: "transcription"` и `brain: "none"`. Он предназначен для субтитров, диктовки и наблюдательного захвата речи; одноразовые загруженные голосовые заметки по-прежнему используют путь медиа/аудио.

## Поведение (macOS)

- **Всегда активный оверлей**, пока включен режим Talk.
- Переходы фаз **Слушает → Думает → Говорит**.
- При **короткой паузе** (окно тишины) отправляется текущий транскрипт.
- Ответы **записываются в WebChat** (так же, как при вводе текста).
- **Прерывание речью** (включено по умолчанию): если пользователь начинает говорить, пока ассистент говорит, мы останавливаем воспроизведение и отмечаем временную метку прерывания для следующего запроса.

## Голосовые директивы в ответах

Ассистент может добавить к ответу префикс в виде **одной строки JSON** для управления голосом:

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
- `silenceTimeoutMs`: когда не задано, Talk сохраняет стандартное для платформы окно паузы перед отправкой транскрипта (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: выбирает активного провайдера Talk. Используйте `elevenlabs`, `mlx` или `system` для локальных путей воспроизведения macOS.
- `providers.<provider>.voiceId`: откатывается к `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` для ElevenLabs (или к первому голосу ElevenLabs, когда доступен API-ключ).
- `providers.elevenlabs.modelId`: по умолчанию `eleven_v3`, если не задано.
- `providers.mlx.modelId`: по умолчанию `mlx-community/Soprano-80M-bf16`, если не задано.
- `providers.elevenlabs.apiKey`: откатывается к `ELEVENLABS_API_KEY` (или к shell-профилю gateway, если доступен).
- `consultThinkingLevel`: необязательное переопределение уровня thinking для полного запуска агента OpenClaw за вызовами реального времени `openclaw_agent_consult`.
- `consultFastMode`: необязательное переопределение fast-mode для вызовов реального времени `openclaw_agent_consult`.
- `realtime.provider`: выбирает активного голосового провайдера реального времени. Используйте `openai` для WebRTC, `google` для WebSocket провайдера или провайдера только с мостом через реле Gateway.
- `realtime.providers.<provider>` хранит конфигурацию реального времени, принадлежащую провайдеру. Браузер получает только эфемерные или ограниченные учетные данные сеанса, но никогда стандартный API-ключ.
- `realtime.providers.openai.voice`: встроенный id голоса OpenAI Realtime. Текущие голоса `gpt-realtime-2`: `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` и `cedar`; `marin` и `cedar` рекомендуются для лучшего качества.
- `realtime.transport`: `webrtc` использует управляемый клиентом OpenAI WebRTC на iOS и в браузере. `provider-websocket` управляется браузером, но на iOS остается на реле Gateway. `gateway-relay` удерживает аудио провайдера на Gateway; Android использует режим реального времени только для этого транспорта, а в остальных случаях сохраняет свой нативный цикл STT/TTS.
- `realtime.brain`: `agent-consult` маршрутизирует вызовы инструментов реального времени через политику Gateway; `direct-tools` — это устаревшее поведение совместимости с прямыми инструментами; `none` предназначен для транскрибации или внешней оркестрации.
- `realtime.consultRouting`: `provider-direct` сохраняет прямой ответ провайдера, когда он пропускает `openclaw_agent_consult`; `force-agent-consult` заставляет реле Gateway маршрутизировать завершенные пользовательские транскрипты через OpenClaw.
- `realtime.instructions`: добавляет обращенные к провайдеру системные инструкции к встроенному prompt реального времени OpenClaw. Используйте это для стиля и тона голоса; OpenClaw сохраняет стандартные указания `openclaw_agent_consult`.
- `talk.catalog` раскрывает допустимые режимы, транспорты, стратегии brain, аудиоформаты реального времени и флаги возможностей каждого провайдера, чтобы собственные клиенты Talk могли избегать неподдерживаемых комбинаций.
- Провайдеры потоковой транскрибации обнаруживаются через `talk.catalog.transcription`. Текущее реле Gateway использует конфигурацию потокового провайдера Voice Call, пока не будет добавлена выделенная поверхность конфигурации транскрибации Talk.
- `speechLocale`: необязательный id локали BCP 47 для распознавания речи Talk на устройстве в iOS/macOS. Не задавайте, чтобы использовать значение устройства по умолчанию.
- `outputFormat`: по умолчанию `pcm_44100` на macOS/iOS и `pcm_24000` на Android (задайте `mp3_*`, чтобы принудительно использовать потоковую передачу MP3)

## UI macOS

- Переключатель в строке меню: **Talk**
- Вкладка конфигурации: группа **Talk Mode** (id голоса + переключатель прерывания)
- Оверлей:
  - **Слушает**: облако пульсирует с уровнем микрофона
  - **Думает**: анимация погружения
  - **Говорит**: расходящиеся кольца
  - Нажатие на облако: остановить речь
  - Нажатие X: выйти из режима Talk

## UI Android

- Переключатель вкладки голоса: **Talk**
- Ручные **Mic** и **Talk** — взаимоисключающие runtime-режимы захвата.
- Ручной Mic останавливается, когда приложение уходит из foreground или пользователь покидает вкладку Voice.
- Talk Mode продолжает работать, пока его не отключат или узел Android не отключится, и во время активности использует тип foreground-service микрофона Android.

## Примечания

- Требуются разрешения Speech + Microphone.
- Нативный Talk использует активный сеанс Gateway и откатывается к опросу истории только тогда, когда события ответа недоступны.
- Управляемый клиентом Talk реального времени использует `talk.client.toolCall` для `openclaw_agent_consult` вместо раскрытия `chat.send` сеансам, принадлежащим провайдеру.
- Talk только для транскрибации использует `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` и `talk.session.close`; клиенты подписываются на `talk.event` для частичных/финальных обновлений транскрипта.
- Gateway разрешает воспроизведение Talk через `talk.speak` с использованием активного провайдера Talk. Android откатывается к локальному системному TTS только когда этот RPC недоступен.
- Локальное воспроизведение MLX на macOS использует встроенный помощник `openclaw-mlx-tts`, когда он присутствует, или исполняемый файл в `PATH`. Задайте `OPENCLAW_MLX_TTS_BIN`, чтобы указать пользовательский бинарный файл помощника во время разработки.
- `stability` для `eleven_v3` проверяется на `0.0`, `0.5` или `1.0`; другие модели принимают `0..1`.
- `latency_tier` проверяется на `0..4`, когда задано.
- Android поддерживает выходные форматы `pcm_16000`, `pcm_22050`, `pcm_24000` и `pcm_44100` для потоковой передачи AudioTrack с низкой задержкой.

## Связанные материалы

- [Голосовая активация](/ru/nodes/voicewake)
- [Аудио и голосовые заметки](/ru/nodes/audio)
- [Понимание медиа](/ru/nodes/media-understanding)
