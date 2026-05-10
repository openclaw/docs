---
read_when:
    - macOS/iOS/Android에서 대화 모드 구현하기
    - 음성/TTS/중단 동작 변경
summary: '대화 모드: 로컬 STT/TTS와 실시간 음성을 아우르는 연속 음성 대화'
title: 대화 모드
x-i18n:
    generated_at: "2026-05-10T19:40:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28e5feae8af8ff89472dfb73c44c590b2f7fab3c0ca335b67603c7fd9d50dfe7
    source_path: nodes/talk.md
    workflow: 16
---

Talk 모드에는 두 가지 런타임 형태가 있습니다.

- 네이티브 macOS/iOS/Android Talk는 로컬 음성 인식, Gateway 채팅, `talk.speak` TTS를 사용합니다. 노드는 `talk` capability를 알리고, 지원하는 `talk.*` 명령을 선언합니다.
- 브라우저 Talk는 클라이언트 소유 `webrtc` 및 `provider-websocket` 세션에는 `talk.client.create`를 사용하고, Gateway 소유 `gateway-relay` 세션에는 `talk.session.create`를 사용합니다. `managed-room`은 Gateway 핸드오프와 워키토키 방을 위해 예약되어 있습니다.
- 전사 전용 클라이언트는 어시스턴트 음성 응답 없이 자막이나 받아쓰기가 필요할 때 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`를 사용한 뒤 `talk.session.appendAudio`, `talk.session.cancelTurn`, `talk.session.close`를 사용합니다.

네이티브 Talk는 연속 음성 대화 루프입니다.

1. 음성을 듣습니다
2. 활성 세션을 통해 transcript를 모델로 보냅니다
3. 응답을 기다립니다
4. 구성된 Talk 프로바이더(`talk.speak`)를 통해 음성으로 재생합니다

브라우저 실시간 Talk는 프로바이더 도구 호출을 `talk.client.toolCall`을 통해 전달합니다. 브라우저 클라이언트는 실시간 consult를 위해 `chat.send`를 직접 호출하지 않습니다.

전사 전용 Talk는 실시간 및 STT/TTS 세션과 동일한 공통 Talk 이벤트 envelope를 내보내지만, `mode: "transcription"` 및 `brain: "none"`을 사용합니다. 자막, 받아쓰기, 관찰 전용 음성 캡처를 위한 것이며, 일회성 업로드 음성 메모는 계속 media/audio 경로를 사용합니다.

## 동작 (macOS)

- Talk 모드가 활성화된 동안 **항상 켜진 overlay**.
- **Listening → Thinking → Speaking** 단계 전환.
- **짧은 일시정지**(무음 window) 시 현재 transcript가 전송됩니다.
- 답변은 **WebChat에 작성됩니다**(입력한 것과 동일).
- **음성으로 중단**(기본값 켜짐): 어시스턴트가 말하는 동안 사용자가 말하기 시작하면, 재생을 중지하고 다음 prompt를 위해 중단 timestamp를 기록합니다.

## 답변의 음성 지시문

어시스턴트는 음성을 제어하기 위해 답변 앞에 **단일 JSON 줄**을 붙일 수 있습니다.

```json
{ "voice": "<voice-id>", "once": true }
```

규칙:

- 비어 있지 않은 첫 줄에만 적용됩니다.
- 알 수 없는 key는 무시됩니다.
- `once: true`는 현재 답변에만 적용됩니다.
- `once`가 없으면 해당 음성이 Talk 모드의 새 기본값이 됩니다.
- JSON 줄은 TTS 재생 전에 제거됩니다.

지원되는 key:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## 구성 (`~/.openclaw/openclaw.json`)

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

기본값:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 설정하지 않으면 Talk는 transcript를 보내기 전 플랫폼 기본 일시정지 window를 유지합니다(`macOS 및 Android에서는 700 ms, iOS에서는 900 ms`)
- `provider`: 활성 Talk 프로바이더를 선택합니다. macOS 로컬 재생 경로에는 `elevenlabs`, `mlx`, 또는 `system`을 사용하세요.
- `providers.<provider>.voiceId`: ElevenLabs의 경우 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`로 fallback합니다(또는 API key를 사용할 수 있으면 첫 번째 ElevenLabs voice).
- `providers.elevenlabs.modelId`: 설정하지 않으면 기본값은 `eleven_v3`입니다.
- `providers.mlx.modelId`: 설정하지 않으면 기본값은 `mlx-community/Soprano-80M-bf16`입니다.
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY`로 fallback합니다(또는 사용 가능한 경우 gateway shell profile).
- `consultThinkingLevel`: 실시간 `openclaw_agent_consult` 호출 뒤의 전체 OpenClaw agent 실행에 대한 선택적 thinking level override입니다.
- `consultFastMode`: 실시간 `openclaw_agent_consult` 호출에 대한 선택적 fast-mode override입니다.
- `realtime.provider`: 활성 브라우저/서버 실시간 음성 프로바이더를 선택합니다. WebRTC에는 `openai`, 프로바이더 WebSocket에는 `google`, Gateway relay를 통하는 bridge 전용 프로바이더를 사용하세요.
- `realtime.providers.<provider>`는 프로바이더 소유 실시간 구성을 저장합니다. 브라우저는 표준 API key가 아니라 ephemeral 또는 제한된 세션 자격 증명만 받습니다.
- `realtime.providers.openai.voice`: 기본 제공 OpenAI Realtime voice id입니다. 현재 `gpt-realtime-2` voice는 `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`이며, 최고 품질에는 `marin`과 `cedar`가 권장됩니다.
- `realtime.brain`: `agent-consult`는 실시간 도구 호출을 Gateway policy를 통해 라우팅합니다. `direct-tools`는 소유자 전용 compatibility 동작입니다. `none`은 전사 또는 외부 orchestration용입니다.
- `realtime.instructions`: 프로바이더 대상 system instructions를 OpenClaw의 기본 제공 실시간 prompt에 추가합니다. 음성 스타일과 톤에 사용하세요. OpenClaw는 기본 `openclaw_agent_consult` guidance를 유지합니다.
- `talk.catalog`는 각 프로바이더의 유효한 모드, transport, brain 전략, 실시간 오디오 형식, capability flag를 노출하여 first-party Talk 클라이언트가 지원되지 않는 조합을 피할 수 있게 합니다.
- Streaming 전사 프로바이더는 `talk.catalog.transcription`을 통해 발견됩니다. 현재 Gateway relay는 전용 Talk 전사 구성 surface가 추가될 때까지 Voice Call Streaming 프로바이더 구성을 사용합니다.
- `speechLocale`: iOS/macOS의 온디바이스 Talk 음성 인식을 위한 선택적 BCP 47 locale id입니다. 디바이스 기본값을 사용하려면 설정하지 마세요.
- `outputFormat`: macOS/iOS에서는 기본값이 `pcm_44100`, Android에서는 `pcm_24000`입니다(MP3 Streaming을 강제하려면 `mp3_*` 설정)

## macOS UI

- 메뉴 막대 toggle: **Talk**
- 구성 탭: **Talk Mode** group(voice id + interrupt toggle)
- Overlay:
  - **Listening**: cloud가 마이크 level에 따라 pulse
  - **Thinking**: 가라앉는 animation
  - **Speaking**: 방사형 ring
  - cloud 클릭: 말하기 중지
  - X 클릭: Talk 모드 종료

## Android UI

- Voice 탭 toggle: **Talk**
- 수동 **Mic**와 **Talk**는 상호 배타적인 런타임 캡처 모드입니다.
- 앱이 foreground를 벗어나거나 사용자가 Voice 탭을 떠나면 수동 Mic가 중지됩니다.
- Talk Mode는 꺼질 때까지 또는 Android 노드 연결이 끊길 때까지 계속 실행되며, 활성 상태에서는 Android의 microphone foreground-service type을 사용합니다.

## 참고

- Speech + Microphone permission이 필요합니다.
- 네이티브 Talk는 활성 Gateway 세션을 사용하며, 응답 이벤트를 사용할 수 없을 때만 history polling으로 fallback합니다.
- 브라우저 실시간 Talk는 `chat.send`를 프로바이더 소유 브라우저 세션에 노출하는 대신 `openclaw_agent_consult`에 `talk.client.toolCall`을 사용합니다.
- 전사 전용 Talk는 `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn`, `talk.session.close`를 사용합니다. 클라이언트는 부분/최종 transcript update를 위해 `talk.event`를 구독합니다.
- gateway는 활성 Talk 프로바이더를 사용해 `talk.speak`를 통해 Talk 재생을 resolve합니다. Android는 해당 RPC를 사용할 수 없을 때만 로컬 system TTS로 fallback합니다.
- macOS 로컬 MLX 재생은 번들된 `openclaw-mlx-tts` helper가 있으면 이를 사용하고, 없으면 `PATH`의 실행 파일을 사용합니다. 개발 중 custom helper binary를 가리키려면 `OPENCLAW_MLX_TTS_BIN`을 설정하세요.
- `eleven_v3`의 `stability`는 `0.0`, `0.5`, `1.0`으로 검증됩니다. 다른 모델은 `0..1`을 허용합니다.
- `latency_tier`는 설정된 경우 `0..4`로 검증됩니다.
- Android는 저지연 AudioTrack Streaming을 위해 `pcm_16000`, `pcm_22050`, `pcm_24000`, `pcm_44100` 출력 형식을 지원합니다.

## 관련 항목

- [Voice wake](/ko/nodes/voicewake)
- [Audio 및 음성 메모](/ko/nodes/audio)
- [Media 이해](/ko/nodes/media-understanding)
