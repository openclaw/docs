---
read_when:
    - 발신 응답에 Inworld 음성 합성을 사용하려는 경우
    - Inworld에서 PCM 전화 통신 또는 OGG_OPUS 음성 메모 출력을 받아야 합니다
summary: OpenClaw 답변을 위한 Inworld 스트리밍 텍스트 음성 변환
title: 인월드
x-i18n:
    generated_at: "2026-07-12T01:11:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld는 스트리밍 텍스트 음성 변환(TTS) 제공업체입니다. OpenClaw에서는 발신 응답 오디오(기본적으로 MP3, 음성 메모에는 OGG_OPUS)와 Voice Call 같은 전화 통신 채널용 원시 PCM 오디오를 합성합니다.

OpenClaw는 Inworld의 스트리밍 TTS 엔드포인트에 요청을 보내고, 반환된 base64 오디오 청크를 단일 버퍼로 이어 붙인 다음 그 결과를 표준 응답 오디오 파이프라인에 전달합니다.

| 속성          | 값                                                              |
| ------------- | --------------------------------------------------------------- |
| 제공업체 ID   | `inworld`                                                       |
| Plugin        | 공식 외부 패키지(`@openclaw/inworld-speech`)                    |
| 계약          | `speechProviders`(TTS 전용)                                     |
| 인증 환경 변수 | `INWORLD_API_KEY`(HTTP Basic, Base64 대시보드 자격 증명)         |
| 기본 URL      | `https://api.inworld.ai`                                        |
| 기본 음성     | `Sarah`                                                         |
| 기본 모델     | `inworld-tts-1.5-max`                                           |
| 출력          | MP3(기본값), OGG_OPUS(음성 메모), PCM 22050Hz(전화 통신)        |
| 웹사이트      | [inworld.ai](https://inworld.ai)                                |
| 문서          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Plugin 설치

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## 시작하기

<Steps>
  <Step title="API 키 설정">
    Inworld 대시보드(Workspace > API Keys)에서 자격 증명을 복사하여 환경 변수로 설정합니다. 이 값은 HTTP Basic 자격 증명으로 그대로 전송되므로 다시 Base64로 인코딩하거나 베어러 토큰으로 변환하지 마세요.

    ```bash
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="messages.tts에서 Inworld 선택">
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
  <Step title="메시지 보내기">
    연결된 채널을 통해 응답을 보냅니다. OpenClaw는 Inworld로 오디오를 합성하고 MP3로 전달합니다(채널에서 음성 메모를 요구하는 경우 OGG_OPUS).
  </Step>
</Steps>

## 구성 옵션

| 옵션          | 경로                                         | 설명                                                               |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 대시보드 자격 증명입니다. `INWORLD_API_KEY`를 대체 값으로 사용합니다. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Inworld API 기본 URL을 재정의합니다(기본값 `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | 음성 식별자입니다(기본값 `Sarah`). 레거시 별칭: `speakerVoiceId`.   |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS 모델 ID입니다(기본값 `inworld-tts-1.5-max`).                    |
| `temperature` | `messages.tts.providers.inworld.temperature` | 샘플링 온도입니다. `0` 초과 `2` 이하이며 선택 사항입니다.           |

## 참고 사항

<AccordionGroup>
  <Accordion title="인증">
    Inworld는 Base64로 인코딩된 단일 자격 증명 문자열을 사용하여 HTTP Basic 인증을 수행합니다. Inworld 대시보드에서 그대로 복사하세요. 제공업체는 추가 인코딩 없이 이를 `Authorization: Basic <apiKey>`로 전송하므로 직접 Base64로 인코딩하거나 베어러 형식 토큰을 전달하지 마세요. 같은 주의 사항은 [TTS 인증 참고 사항](/ko/tools/tts#inworld-primary)을 참조하세요.
  </Accordion>
  <Accordion title="모델">
    지원되는 모델 ID: `inworld-tts-1.5-max`(기본값), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="오디오 출력">
    응답은 기본적으로 MP3를 사용합니다. 채널 대상이 `voice-note`이면 오디오가 네이티브 음성 말풍선으로 재생되도록 OpenClaw가 Inworld에 `OGG_OPUS`를 요청합니다. 전화 통신 합성은 전화 통신 브리지에 공급하기 위해 22050Hz의 원시 `PCM`을 사용합니다.
  </Accordion>
  <Accordion title="사용자 지정 엔드포인트">
    `messages.tts.providers.inworld.baseUrl`을 사용하여 API 호스트를 재정의합니다. 요청을 보내기 전에 끝의 슬래시가 제거됩니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="텍스트 음성 변환" href="/ko/tools/tts" icon="waveform-lines">
    TTS 개요, 제공업체 및 `messages.tts` 구성입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    `messages.tts` 설정을 포함한 전체 구성 참고 자료입니다.
  </Card>
  <Card title="제공업체" href="/ko/providers" icon="grid">
    OpenClaw에서 지원하는 모든 제공업체입니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 디버깅 단계입니다.
  </Card>
</CardGroup>
