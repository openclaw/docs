---
read_when:
    - 오디오 첨부 파일에 SenseAudio 음성 텍스트 변환 기능을 사용하려고 합니다
    - SenseAudio API 키 환경 변수 또는 오디오 구성 경로가 필요합니다.
summary: 수신 음성 메모를 위한 SenseAudio 일괄 음성-텍스트 변환
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T15:41:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio는 OpenClaw의 공유 `tools.media.audio` 파이프라인을 통해 수신 오디오 및 음성 메모 첨부 파일을 전사합니다. OpenClaw는 멀티파트 오디오를 OpenAI 호환 전사 엔드포인트에 게시하고, 반환된 텍스트를 `{{Transcript}}` 및 `[Audio]` 블록으로 삽입합니다.

| 속성          | 값                                               |
| ------------- | ------------------------------------------------ |
| 제공자 ID     | `senseaudio`                                     |
| Plugin        | 번들 제공, `enabledByDefault: true`              |
| 계약          | `mediaUnderstandingProviders` (오디오)           |
| 인증 환경 변수 | `SENSEAUDIO_API_KEY`                             |
| 기본 모델     | `senseaudio-asr-pro-1.5-260319`                  |
| 기본 URL      | `https://api.senseaudio.cn/v1`                   |
| 웹사이트      | [senseaudio.cn](https://senseaudio.cn)           |
| 문서          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="오디오 제공자 활성화">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="음성 메모 보내기">
    연결된 채널을 통해 오디오 메시지를 보내십시오. OpenClaw는
    오디오를 SenseAudio에 업로드하고 응답 파이프라인에서 전사문을 사용합니다.
  </Step>
</Steps>

## 옵션

| 옵션       | 경로                                  | 설명                              |
| ---------- | ------------------------------------- | --------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR 모델 ID            |
| `language` | `tools.media.audio.models[].language` | 선택적 언어 힌트                  |
| `prompt`   | `tools.media.audio.prompt`            | 선택적 전사 프롬프트              |
| `baseUrl`  | `tools.media.audio.baseUrl` 또는 모델 | OpenAI 호환 기본 주소 재정의      |
| `headers`  | `tools.media.audio.request.headers`   | 추가 요청 헤더                    |

<Note>
OpenClaw에서 SenseAudio는 배치 STT만 지원합니다. 음성 통화의 실시간 전사는
스트리밍 STT를 지원하는 제공자를 계속 사용합니다.
</Note>

## 관련 문서

- [미디어 이해(오디오)](/ko/nodes/audio)
- [모델 제공자](/ko/concepts/model-providers)
