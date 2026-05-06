---
read_when:
    - 발신 응답에 Inworld 음성 합성을 사용하려는 경우
    - Inworld에서 PCM 전화 통신용 또는 OGG_OPUS 음성 메모 출력이 필요합니다.
summary: OpenClaw 응답을 위한 Inworld 스트리밍 텍스트 음성 변환
title: Inworld
x-i18n:
    generated_at: "2026-05-06T06:37:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf291bab5da946262ecaf4263c188c168be08ddb43fda72f250b8f8db87b3ff
    source_path: providers/inworld.md
    workflow: 16
---

Inworld는 스트리밍 텍스트 음성 변환(TTS) 제공자입니다. OpenClaw에서는
아웃바운드 답장 오디오(기본값은 MP3, 음성 메모는 OGG_OPUS)와
Voice Call 같은 전화 통신 채널용 PCM 오디오를 합성합니다.

OpenClaw는 Inworld의 스트리밍 TTS 엔드포인트에 게시하고, 반환된
base64 오디오 청크를 단일 버퍼로 이어 붙인 뒤 그 결과를 표준
답장 오디오 파이프라인에 전달합니다.

| 속성          | 값                                                              |
| ------------- | --------------------------------------------------------------- |
| 제공자 ID     | `inworld`                                                       |
| Plugin        | 번들됨, `enabledByDefault: true`                                |
| 계약          | `speechProviders` (TTS 전용)                                    |
| 인증 환경 변수 | `INWORLD_API_KEY` (HTTP Basic, Base64 대시보드 자격 증명)        |
| 기본 URL      | `https://api.inworld.ai`                                        |
| 기본 음성     | `Sarah`                                                         |
| 기본 모델     | `inworld-tts-1.5-max`                                           |
| 출력          | MP3 (기본값), OGG_OPUS (음성 메모), PCM 22050 Hz (전화 통신)    |
| 웹사이트      | [inworld.ai](https://inworld.ai)                                |
| 문서          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## 시작하기

<Steps>
  <Step title="Set your API key">
    Inworld 대시보드(Workspace > API Keys)에서 자격 증명을 복사하고
    환경 변수로 설정합니다. 값은 HTTP Basic 자격 증명으로 그대로 전송되므로,
    다시 Base64로 인코딩하거나 bearer 토큰으로 변환하지 마세요.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Select Inworld in messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a message">
    연결된 아무 채널을 통해 답장을 보냅니다. OpenClaw는 Inworld로
    오디오를 합성하고 MP3로 전달합니다(또는 채널이 음성 메모를 기대하는
    경우 OGG_OPUS로 전달).
  </Step>
</Steps>

## 구성 옵션

| 옵션          | 경로                                         | 설명                                                              |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 대시보드 자격 증명. `INWORLD_API_KEY`로 대체됩니다.        |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Inworld API 기본 URL 재정의(기본값 `https://api.inworld.ai`).     |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | 음성 식별자(기본값 `Sarah`).                                      |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS 모델 ID(기본값 `inworld-tts-1.5-max`).                        |
| `temperature` | `messages.tts.providers.inworld.temperature` | 샘플링 온도 `0..2`(선택 사항).                                    |

## 참고

<AccordionGroup>
  <Accordion title="Authentication">
    Inworld는 단일 Base64 인코딩 자격 증명 문자열로 HTTP Basic 인증을
    사용합니다. Inworld 대시보드에서 그대로 복사하세요. 제공자는 추가 인코딩
    없이 이를 `Authorization: Basic <apiKey>`로 보내므로, 직접 Base64로
    인코딩하지 말고 bearer 스타일 토큰도 전달하지 마세요. 동일한 주의 사항은
    [TTS 인증 참고 사항](/ko/tools/tts#inworld-primary)을 참조하세요.
  </Accordion>
  <Accordion title="Models">
    지원되는 모델 ID: `inworld-tts-1.5-max`(기본값),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Audio outputs">
    답장은 기본적으로 MP3를 사용합니다. 채널 대상이 `voice-note`이면
    OpenClaw는 오디오가 네이티브 음성 말풍선으로 재생되도록 Inworld에
    `OGG_OPUS`를 요청합니다. 전화 통신 합성은 전화 통신 브리지에 공급하기
    위해 22050 Hz의 원시 `PCM`을 사용합니다.
  </Accordion>
  <Accordion title="Custom endpoints">
    `messages.tts.providers.inworld.baseUrl`로 API 호스트를 재정의합니다.
    요청을 보내기 전에 후행 슬래시가 제거됩니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/ko/tools/tts" icon="waveform-lines">
    TTS 개요, 제공자, `messages.tts` 구성.
  </Card>
  <Card title="Configuration" href="/ko/gateway/configuration" icon="gear">
    `messages.tts` 설정을 포함한 전체 구성 참조.
  </Card>
  <Card title="Providers" href="/ko/providers" icon="grid">
    모든 번들 OpenClaw 제공자.
  </Card>
  <Card title="Troubleshooting" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 디버깅 단계.
  </Card>
</CardGroup>
