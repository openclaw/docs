---
read_when:
    - macOS/iOS/Android에서 Talk 모드 구현하기
    - 음성/TTS/중단 동작 변경하기
summary: 'Talk 모드: 구성된 TTS provider를 사용한 연속 음성 대화'
title: Talk 모드
x-i18n:
    generated_at: "2026-04-26T11:34:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 15
---

Talk 모드는 연속적인 음성 대화 루프입니다.

1. 음성을 듣기
2. 전사본을 모델로 보내기(메인 세션, `chat.send`)
3. 응답 대기
4. 구성된 Talk provider(`talk.speak`)를 통해 응답 말하기

## 동작(macOS)

- Talk 모드가 활성화되어 있는 동안 **항상 켜져 있는 오버레이**
- **Listening → Thinking → Speaking** 단계 전환
- **짧은 멈춤**(무음 창)이 발생하면 현재 전사본이 전송됨
- 응답은 **WebChat에 작성됨**(직접 입력하는 것과 동일)
- **음성으로 중단**(기본값 켜짐): assistant가 말하는 동안 사용자가 말을 시작하면 재생을 중지하고, 다음 프롬프트를 위해 중단 타임스탬프를 기록함

## 응답의 음성 지시문

assistant는 음성을 제어하기 위해 응답 앞에 **단일 JSON 줄**을 붙일 수 있습니다.

```json
{ "voice": "<voice-id>", "once": true }
```

규칙:

- 첫 번째 비어 있지 않은 줄만 적용
- 알 수 없는 키는 무시됨
- `once: true`는 현재 응답에만 적용
- `once`가 없으면 그 음성이 Talk 모드의 새로운 기본값이 됨
- JSON 줄은 TTS 재생 전에 제거됨

지원되는 키:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Config (`~/.openclaw/openclaw.json`)

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
  },
}
```

기본값:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 설정되지 않으면 Talk는 전사본을 보내기 전에 플랫폼 기본 멈춤 창을 유지합니다(`macOS 및 Android에서는 700 ms, iOS에서는 900 ms`)
- `provider`: 활성 Talk provider를 선택합니다. macOS 로컬 재생 경로에는 `elevenlabs`, `mlx`, 또는 `system`을 사용하세요.
- `providers.<provider>.voiceId`: ElevenLabs의 경우 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`로 대체되며(API 키가 있으면 첫 번째 ElevenLabs 음성도 사용 가능)
- `providers.elevenlabs.modelId`: 설정되지 않으면 기본값은 `eleven_v3`
- `providers.mlx.modelId`: 설정되지 않으면 기본값은 `mlx-community/Soprano-80M-bf16`
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY`로 대체됨(또는 사용 가능하면 Gateway 셸 프로필)
- `speechLocale`: iOS/macOS의 온디바이스 Talk 음성 인식용 선택적 BCP 47 로캘 ID입니다. 기기 기본값을 사용하려면 설정하지 마세요.
- `outputFormat`: macOS/iOS에서는 기본적으로 `pcm_44100`, Android에서는 `pcm_24000`입니다(MP3 스트리밍을 강제하려면 `mp3_*` 설정)

## macOS UI

- 메뉴 막대 토글: **Talk**
- Config 탭: **Talk Mode** 그룹(voice id + 중단 토글)
- 오버레이:
  - **Listening**: 마이크 레벨에 따라 구름이 펄스함
  - **Thinking**: 가라앉는 애니메이션
  - **Speaking**: 퍼져나가는 링
  - 구름 클릭: 말하기 중지
  - X 클릭: Talk 모드 종료

## Android UI

- Voice 탭 토글: **Talk**
- 수동 **Mic**와 **Talk**는 서로 배타적인 런타임 캡처 모드입니다.
- 수동 Mic는 앱이 포그라운드를 벗어나거나 사용자가 Voice 탭을 벗어나면 중지됩니다.
- Talk Mode는 꺼질 때까지 또는 Android Node 연결이 끊길 때까지 계속 실행되며, 활성 상태에서는 Android의 마이크 foreground-service 유형을 사용합니다.

## 참고

- Speech + Microphone 권한이 필요합니다.
- 세션 키 `main`에 대해 `chat.send`를 사용합니다.
- Gateway는 활성 Talk provider를 사용해 `talk.speak`를 통해 Talk 재생을 확인합니다. Android는 해당 RPC를 사용할 수 없을 때만 로컬 system TTS로 대체됩니다.
- macOS 로컬 MLX 재생은 번들된 `openclaw-mlx-tts` 도우미가 있으면 그것을 사용하고, 없으면 `PATH`의 실행 파일을 사용합니다. 개발 중 커스텀 도우미 바이너리를 지정하려면 `OPENCLAW_MLX_TTS_BIN`을 설정하세요.
- `eleven_v3`의 `stability`는 `0.0`, `0.5`, 또는 `1.0`으로 검증되며, 다른 모델은 `0..1`을 허용합니다.
- `latency_tier`는 설정된 경우 `0..4`로 검증됩니다.
- Android는 저지연 AudioTrack 스트리밍을 위해 `pcm_16000`, `pcm_22050`, `pcm_24000`, `pcm_44100` 출력 형식을 지원합니다.

## 관련 항목

- [Voice wake](/ko/nodes/voicewake)
- [Audio and voice notes](/ko/nodes/audio)
- [Media understanding](/ko/nodes/media-understanding)
