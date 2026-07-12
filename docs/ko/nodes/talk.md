---
read_when:
    - macOS/iOS/Android에서 대화 모드 구현하기
    - 음성/TTS/중단 동작 변경
summary: '대화 모드: 로컬 STT/TTS와 실시간 음성을 통한 연속 음성 대화'
title: 대화 모드
x-i18n:
    generated_at: "2026-07-12T15:24:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Talk 모드는 다섯 가지 런타임 형태를 지원합니다.

- **네이티브 macOS/iOS/Android Talk**: 로컬 음성 인식, Gateway 채팅, `talk.speak` TTS를 사용합니다. Node는 `talk` 기능을 알리고 지원하는 `talk.*` 명령을 선언합니다.
- **iOS Talk(실시간)**: `webrtc` 전송을 선택하거나 전송을 생략하는 OpenAI 실시간 구성에서는 클라이언트가 WebRTC를 소유합니다. 명시적인 `gateway-relay`, `provider-websocket`, OpenAI가 아닌 실시간 구성은 Gateway가 소유하는 릴레이를 계속 사용하며, 비실시간 구성은 네이티브 음성 루프를 사용합니다.
- **브라우저 Talk**: 클라이언트가 소유하는 `webrtc`/`provider-websocket` 세션에는 `talk.client.create`를 사용하고, Gateway가 소유하는 `gateway-relay` 세션에는 `talk.session.create`를 사용합니다. `managed-room`은 Gateway 핸드오프와 워키토키 룸용으로 예약되어 있습니다.
- **Android Talk(실시간)**: `talk.realtime.mode: "realtime"` 및 `talk.realtime.transport: "gateway-relay"`로 명시적으로 활성화합니다. 그렇지 않으면 Android는 네이티브 음성 인식, Gateway 채팅, `talk.speak`를 계속 사용합니다.
- **전사 전용 클라이언트**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`를 호출한 다음, 어시스턴트 음성 응답 없이 자막/받아쓰기를 수행하려면 `talk.session.appendAudio`, `talk.session.cancelTurn`, `talk.session.close`를 사용합니다. 일회성으로 업로드한 음성 메모는 계속 [미디어 이해](/ko/nodes/media-understanding) 오디오 경로를 사용합니다.

네이티브 Talk는 연속 루프입니다. 음성을 듣고, 활성 세션을 통해 모델에 전사문을 보내고, 응답을 기다린 다음, 구성된 Talk 제공자(`talk.speak`)를 통해 응답을 음성으로 재생합니다.

클라이언트가 소유하는 실시간 Talk는 `chat.send`를 직접 호출하는 대신 `talk.client.toolCall`을 통해 제공자 도구 호출을 전달합니다. 실시간 상담이 활성화된 동안 클라이언트는 `talk.client.steer` 또는 `talk.session.steer`를 호출하여 음성 입력을 `status`, `steer`, `cancel`, `followup`으로 분류할 수 있습니다. 수락된 조정은 활성 임베디드 실행의 대기열에 추가되며, 거부된 조정은 `no_active_run`, `not_streaming`, `compacting` 같은 사유를 반환합니다.

전사 전용 Talk는 실시간 및 STT/TTS 세션과 동일한 Talk 이벤트 봉투를 내보내지만, `mode: "transcription"` 및 `brain: "none"`을 사용합니다. 모든 Talk 세션은 `talk.event` 채널에 이벤트를 브로드캐스트하며, 클라이언트는 부분/최종 전사 업데이트(`transcript.delta`/`transcript.done`) 및 기타 세션 텔레메트리를 수신하기 위해 이 채널을 구독합니다.

## 동작(macOS)

- Talk 모드가 활성화된 동안 항상 오버레이를 표시합니다.
- **듣기 &rarr; 생각하기 &rarr; 말하기** 단계로 전환합니다.
- 짧은 일시 정지(무음 구간)가 발생하면 현재 전사문을 전송합니다.
- 응답은 WebChat에 작성됩니다(입력한 경우와 동일).
- **음성으로 중단**(기본값: 켜짐): 어시스턴트가 말하는 동안 사용자가 말하면 재생을 중지하고, 다음 프롬프트를 위해 중단 타임스탬프를 기록합니다.

## 응답의 음성 지시문

어시스턴트는 음성을 제어하기 위해 응답 앞에 단일 JSON 줄을 추가할 수 있습니다.

```json
{ "voice": "<voice-id>", "once": true }
```

규칙:

- 비어 있지 않은 첫 번째 줄에서만 사용할 수 있으며, TTS 재생 전에 JSON 줄을 제거합니다.
- 알 수 없는 키는 무시합니다.
- `once: true`는 현재 응답에만 적용되며, 이 값이 없으면 해당 음성이 새로운 Talk 모드 기본값이 됩니다.

지원되는 키: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate`(WPM), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

## 구성(`~/.openclaw/openclaw.json`)

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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "따뜻하게 말하고 답변은 간결하게 유지하십시오.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| 키                                       | 기본값                                     | 참고                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | 활성 Talk TTS 제공자입니다. macOS 로컬 재생 경로에는 `elevenlabs`, `mlx`, `system`을 사용합니다.                                                                                                                                                                           |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs는 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`로 대체하거나, API 키가 있으면 사용 가능한 첫 번째 음성으로 대체합니다.                                                                                                                                                  |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | `ELEVENLABS_API_KEY`로 대체합니다(사용 가능한 경우 Gateway 셸 프로필로 대체).                                                                                                                                                                                              |
| `speechLocale`                           | 기기 기본값                                | iOS/macOS의 기기 내 Talk 음성 인식에 사용할 BCP 47 로캘 ID입니다.                                                                                                                                                                                                          |
| `silenceTimeoutMs`                       | macOS/Android에서는 `700` ms, iOS에서는 `900` ms | Talk가 전사문을 보내기 전의 일시 정지 구간입니다.                                                                                                                                                                                                                          |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | macOS/iOS에서는 `pcm_44100`, Android에서는 `pcm_24000` | MP3 스트리밍을 강제하려면 `mp3_*`로 설정합니다.                                                                                                                                                                                                                            |
| `consultThinkingLevel`                   | 설정되지 않음                              | 실시간 `openclaw_agent_consult` 호출의 기반이 되는 에이전트 실행에 적용할 사고 수준 재정의입니다.                                                                                                                                                                          |
| `consultFastMode`                        | 설정되지 않음                              | 실시간 `openclaw_agent_consult` 호출의 빠른 모드 재정의입니다.                                                                                                                                                                                                             |
| `realtime.provider`                      | -                                          | WebRTC에는 `openai`, 제공자 WebSocket에는 `google`, Gateway 릴레이를 통한 브리지 전용 제공자를 사용할 수 있습니다.                                                                                                                                                         |
| `realtime.providers.<id>`                | -                                          | 제공자가 소유하는 실시간 구성입니다. 브라우저에는 임시/제한된 세션 자격 증명만 제공되며, 표준 API 키는 절대 제공되지 않습니다.                                                                                                                                              |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | OpenAI Realtime 내장 음성 ID입니다(이전 `voice` 키도 계속 작동하지만 더 이상 사용하지 않는 것이 좋습니다). 현재 `gpt-realtime-2.1` 음성: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; 최상의 품질을 위해 `marin`과 `cedar`를 권장합니다. |
| `realtime.transport`                     | -                                          | `webrtc`: iOS 및 브라우저에서 클라이언트가 소유하는 OpenAI WebRTC입니다. `provider-websocket`: 브라우저가 소유하며 iOS에서는 Gateway 릴레이를 계속 사용합니다. `gateway-relay`: 제공자 오디오를 Gateway에 유지하며, Android는 이 전송에서만 실시간 기능을 사용합니다.          |
| `realtime.brain`                         | -                                          | `agent-consult`는 Gateway 정책을 통해 실시간 도구 호출을 라우팅하고, `direct-tools`는 레거시 직접 도구 호환성이며, `none`은 전사/외부 오케스트레이션용입니다.                                                                                                                |
| `realtime.consultRouting`                | -                                          | `provider-direct`는 제공자가 `openclaw_agent_consult`를 건너뛸 때 제공자의 직접 응답을 유지하고, `force-agent-consult`는 완료된 사용자 전사문을 대신 OpenClaw를 통해 라우팅합니다.                                                                                            |
| `realtime.instructions`                  | -                                          | 제공자용 시스템 지시문을 OpenClaw의 내장 실시간 프롬프트(음성 스타일/어조)에 추가하며, 기본 `openclaw_agent_consult` 지침은 유지됩니다.                                                                                                                                    |

`talk.catalog`는 정규 공급자 ID와 레지스트리 별칭, 각 공급자의 유효한 모드/전송 방식/브레인 전략/실시간 오디오 형식/기능 플래그 및 런타임에서 선택된 준비 상태 결과를 제공합니다. 자사 Talk 클라이언트는 공급자 별칭을 로컬에서 관리하지 말고 이 카탈로그를 읽어야 합니다. 그룹 준비 상태가 없는 이전 Gateway는 확실히 구성되지 않은 것으로 간주하지 말고 확인되지 않은 것으로 처리하십시오. 스트리밍 음성 변환 공급자는 `talk.catalog.transcription`을 통해 검색됩니다. 현재 Gateway 릴레이는 전용 Talk 음성 변환 구성 화면이 출시될 때까지 Voice Call 스트리밍 공급자 구성을 사용합니다.

## macOS UI

- 메뉴 막대 토글: **Talk**
- 구성 탭: **Talk 모드** 그룹(음성 ID + 중단 토글)
- 오버레이: 구체에는 범용 대화 파형이 표시됩니다(iOS, watchOS 및 Android와 공유). 듣는 동안에는 실시간 마이크 레벨을 따르고, 말하는 동안에는 실제 TTS 재생 엔벌로프를 따르며, 생각하는 동안에는 부드럽게 호흡하듯 움직입니다. 일시 중지/재개하려면 구체를 클릭하고, 발화를 중지하려면 두 번 클릭하며, Talk 모드를 종료하려면 X를 클릭하십시오.

## Android UI

- 음성 탭 토글: **Talk**
- 수동 **마이크**와 **Talk**는 상호 배타적인 캡처 모드입니다.
- 수동 마이크와 실시간 Talk는 연결된 Bluetooth Classic 또는 BLE 헤드셋 마이크를 우선 사용합니다. 연결이 끊기면 앱은 다른 헤드셋 입력을 요청하거나 기본 마이크로 대체하며, 캡처가 중지되면 기본 환경설정을 복원합니다.
- 앱이 포그라운드를 벗어나거나 사용자가 음성 탭을 떠나면 수동 마이크가 중지됩니다.
- Talk 모드는 토글을 끄거나 Node의 연결이 끊길 때까지 계속 실행되며, 활성 상태에서는 Android의 마이크 포그라운드 서비스 유형을 사용합니다.
- Android는 지연 시간이 짧은 `AudioTrack` 스트리밍을 위해 `pcm_16000`, `pcm_22050`, `pcm_24000` 및 `pcm_44100` 출력 형식을 지원합니다.

## 참고

- 음성 인식 + 마이크 권한이 필요합니다.
- 네이티브 Talk는 활성 Gateway 세션을 사용하며, 응답 이벤트를 사용할 수 없는 경우에만 기록 폴링으로 대체합니다.
- Gateway는 활성 Talk 공급자를 사용하여 `talk.speak`를 통해 Talk 재생을 처리합니다. Android는 해당 RPC를 사용할 수 없는 경우에만 로컬 시스템 TTS로 대체합니다.
- macOS 로컬 MLX 재생은 번들로 제공되는 `openclaw-mlx-tts` 도우미가 있으면 이를 사용하고, 없으면 `PATH`에 있는 실행 파일을 사용합니다. 개발 중 사용자 지정 도우미 바이너리를 가리키려면 `OPENCLAW_MLX_TTS_BIN`을 설정하십시오.
- 음성 지시문 값 범위(ElevenLabs): `stability`, `similarity` 및 `style`은 `0..1`을 허용하고, `speed`는 `0.5..2`를 허용하며, `latency_tier`는 `0..4`를 허용합니다.

## 관련 문서

- [음성 깨우기](/ko/nodes/voicewake)
- [오디오 및 음성 메모](/ko/nodes/audio)
- [미디어 이해](/ko/nodes/media-understanding)
