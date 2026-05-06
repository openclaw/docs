---
read_when:
    - macOS/iOS/Android에서 대화 모드 구현하기
    - 음성/TTS/인터럽트 동작 변경
summary: '대화 모드: 로컬 STT/TTS와 실시간 음성 전반에서 이어지는 음성 대화'
title: 대화 모드
x-i18n:
    generated_at: "2026-05-06T06:32:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

Talk 모드에는 두 가지 런타임 형태가 있습니다.

- 네이티브 macOS/iOS/Android Talk는 로컬 음성 인식, Gateway 채팅, `talk.speak` TTS를 사용합니다. Node는 `talk` 기능을 알리고 지원하는 `talk.*` 명령을 선언합니다.
- 브라우저 Talk는 클라이언트가 소유하는 `webrtc` 및 `provider-websocket` 세션에 `talk.client.create`를 사용하거나, Gateway가 소유하는 `gateway-relay` 세션에 `talk.session.create`를 사용합니다. `managed-room`은 Gateway 핸드오프와 무전기 방을 위해 예약되어 있습니다.
- 전사 전용 클라이언트는 어시스턴트 음성 응답 없이 캡션이나 받아쓰기가 필요할 때 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`를 사용한 다음 `talk.session.appendAudio`, `talk.session.cancelTurn`, `talk.session.close`를 사용합니다.

네이티브 Talk는 지속적인 음성 대화 루프입니다.

1. 음성 듣기
2. 활성 세션을 통해 모델에 전사문 보내기
3. 응답 기다리기
4. 구성된 Talk 제공자를 통해 말하기(`talk.speak`)

브라우저 실시간 Talk는 제공자 도구 호출을 `talk.client.toolCall`을 통해 전달합니다. 브라우저 클라이언트는 실시간 상담을 위해 `chat.send`를 직접 호출하지 않습니다.

전사 전용 Talk는 실시간 및 STT/TTS 세션과 동일한 공통 Talk 이벤트 봉투를 내보내지만, `mode: "transcription"` 및 `brain: "none"`을 사용합니다. 캡션, 받아쓰기, 관찰 전용 음성 캡처를 위한 것이며, 일회성 업로드 음성 메모는 계속 미디어/오디오 경로를 사용합니다.

## 동작 (macOS)

- Talk 모드가 활성화된 동안 **항상 켜져 있는 오버레이**.
- **듣는 중 → 생각 중 → 말하는 중** 단계 전환.
- **짧은 일시 정지**(무음 창) 시 현재 전사문이 전송됩니다.
- 응답은 **WebChat에 작성됩니다**(입력하는 것과 동일).
- **말할 때 중단**(기본값 켜짐): 어시스턴트가 말하는 동안 사용자가 말하기 시작하면 재생을 중지하고 다음 프롬프트를 위해 중단 타임스탬프를 기록합니다.

## 응답의 음성 지시문

어시스턴트는 음성을 제어하기 위해 응답 앞에 **단일 JSON 줄**을 붙일 수 있습니다.

```json
{ "voice": "<voice-id>", "once": true }
```

규칙:

- 비어 있지 않은 첫 번째 줄만.
- 알 수 없는 키는 무시됩니다.
- `once: true`는 현재 응답에만 적용됩니다.
- `once`가 없으면 해당 음성이 Talk 모드의 새 기본값이 됩니다.
- JSON 줄은 TTS 재생 전에 제거됩니다.

지원되는 키:

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
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

기본값:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 설정하지 않으면 Talk는 전사문을 보내기 전에 플랫폼 기본 일시 정지 창을 유지합니다(`macOS 및 Android에서는 700 ms, iOS에서는 900 ms`)
- `provider`: 활성 Talk 제공자를 선택합니다. macOS 로컬 재생 경로에는 `elevenlabs`, `mlx`, 또는 `system`을 사용합니다.
- `providers.<provider>.voiceId`: ElevenLabs의 경우 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`로 대체됩니다(API 키를 사용할 수 있으면 첫 번째 ElevenLabs 음성).
- `providers.elevenlabs.modelId`: 설정하지 않으면 기본값은 `eleven_v3`입니다.
- `providers.mlx.modelId`: 설정하지 않으면 기본값은 `mlx-community/Soprano-80M-bf16`입니다.
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY`로 대체됩니다(또는 사용 가능한 경우 Gateway 셸 프로필).
- `realtime.provider`: 활성 브라우저/서버 실시간 음성 제공자를 선택합니다. WebRTC에는 `openai`, 제공자 WebSocket에는 `google`, 또는 Gateway 릴레이를 통해 브리지 전용 제공자를 사용합니다.
- `realtime.providers.<provider>`는 제공자가 소유하는 실시간 구성을 저장합니다. 브라우저는 표준 API 키를 받지 않고, 임시 또는 제한된 세션 자격 증명만 받습니다.
- `realtime.brain`: `agent-consult`는 실시간 도구 호출을 Gateway 정책을 통해 라우팅합니다. `direct-tools`는 소유자 전용 호환성 동작입니다. `none`은 전사 또는 외부 오케스트레이션용입니다.
- `talk.catalog`는 각 제공자의 유효한 모드, 전송 방식, 브레인 전략, 실시간 오디오 형식, 기능 플래그를 노출하여 퍼스트 파티 Talk 클라이언트가 지원되지 않는 조합을 피할 수 있게 합니다.
- 스트리밍 전사 제공자는 `talk.catalog.transcription`을 통해 발견됩니다. 현재 Gateway 릴레이는 전용 Talk 전사 구성 표면이 추가될 때까지 Voice Call 스트리밍 제공자 구성을 사용합니다.
- `speechLocale`: iOS/macOS의 온디바이스 Talk 음성 인식을 위한 선택적 BCP 47 로케일 ID입니다. 기기 기본값을 사용하려면 설정하지 않은 상태로 둡니다.
- `outputFormat`: macOS/iOS에서는 기본값이 `pcm_44100`이고 Android에서는 `pcm_24000`입니다(MP3 스트리밍을 강제하려면 `mp3_*` 설정)

## macOS UI

- 메뉴 막대 토글: **Talk**
- 구성 탭: **Talk Mode** 그룹(음성 ID + 중단 토글)
- 오버레이:
  - **듣는 중**: 마이크 레벨에 맞춰 구름이 맥동
  - **생각 중**: 가라앉는 애니메이션
  - **말하는 중**: 퍼져 나가는 고리
  - 구름 클릭: 말하기 중지
  - X 클릭: Talk 모드 종료

## Android UI

- 음성 탭 토글: **Talk**
- 수동 **Mic**와 **Talk**는 런타임 캡처 모드에서 상호 배타적입니다.
- 앱이 포그라운드를 벗어나거나 사용자가 음성 탭을 떠나면 수동 Mic가 중지됩니다.
- Talk Mode는 꺼질 때까지 또는 Android Node 연결이 끊길 때까지 계속 실행되며, 활성 상태에서는 Android의 마이크 포그라운드 서비스 유형을 사용합니다.

## 참고 사항

- Speech + Microphone 권한이 필요합니다.
- 네이티브 Talk는 활성 Gateway 세션을 사용하며, 응답 이벤트를 사용할 수 없을 때만 기록 폴링으로 대체됩니다.
- 브라우저 실시간 Talk는 제공자가 소유하는 브라우저 세션에 `chat.send`를 노출하는 대신 `openclaw_agent_consult`에 `talk.client.toolCall`을 사용합니다.
- 전사 전용 Talk는 `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn`, `talk.session.close`를 사용합니다. 클라이언트는 부분/최종 전사 업데이트를 위해 `talk.event`를 구독합니다.
- Gateway는 활성 Talk 제공자를 사용해 `talk.speak`를 통해 Talk 재생을 확인합니다. Android는 해당 RPC를 사용할 수 없을 때만 로컬 시스템 TTS로 대체됩니다.
- macOS 로컬 MLX 재생은 존재하는 경우 번들된 `openclaw-mlx-tts` 헬퍼를 사용하거나 `PATH`의 실행 파일을 사용합니다. 개발 중 사용자 지정 헬퍼 바이너리를 가리키려면 `OPENCLAW_MLX_TTS_BIN`을 설정합니다.
- `eleven_v3`의 `stability`는 `0.0`, `0.5`, 또는 `1.0`으로 검증됩니다. 다른 모델은 `0..1`을 허용합니다.
- `latency_tier`가 설정된 경우 `0..4`로 검증됩니다.
- Android는 저지연 AudioTrack 스트리밍을 위해 `pcm_16000`, `pcm_22050`, `pcm_24000`, `pcm_44100` 출력 형식을 지원합니다.

## 관련 항목

- [음성 깨우기](/ko/nodes/voicewake)
- [오디오 및 음성 메모](/ko/nodes/audio)
- [미디어 이해](/ko/nodes/media-understanding)
