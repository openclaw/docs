---
read_when:
    - 아웃바운드 답장을 위해 Inworld 음성 합성을 사용하려고 합니다.
    - Inworld에서 PCM 텔레포니 또는 OGG_OPUS 음성 노트 출력을 사용해야 합니다.
summary: OpenClaw 답장을 위한 Inworld 스트리밍 텍스트 음성 변환
title: Inworld
x-i18n:
    generated_at: "2026-04-26T11:37:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

Inworld는 스트리밍 텍스트 음성 변환(TTS) provider입니다. OpenClaw에서는 아웃바운드 답장 오디오(MP3가 기본, 음성 노트에는 OGG_OPUS)와 Voice Call 같은 텔레포니 채널용 PCM 오디오를 합성합니다.

OpenClaw는 Inworld의 스트리밍 TTS 엔드포인트에 요청을 보내고, 반환된 base64 오디오 청크를 하나의 버퍼로 이어 붙인 뒤, 그 결과를 표준 답장 오디오 파이프라인에 전달합니다.

| Detail        | 값                                                       |
| ------------- | ----------------------------------------------------------- |
| Website       | [inworld.ai](https://inworld.ai)                            |
| Docs          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| Auth          | `INWORLD_API_KEY` (HTTP Basic, Base64 대시보드 자격 증명) |
| Default voice | `Sarah`                                                     |
| Default model | `inworld-tts-1.5-max`                                       |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    Inworld 대시보드(Workspace > API Keys)에서 자격 증명을 복사한 뒤
    env var로 설정하세요. 이 값은 HTTP Basic 자격 증명으로 그대로 전송되므로,
    다시 Base64 인코딩하거나 bearer 토큰으로 변환하지 마세요.

    ```
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
    연결된 채널을 통해 답장을 보내세요. OpenClaw가 Inworld로 오디오를 합성하고,
    MP3로 전달합니다(또는 채널이 음성 노트를 기대하는 경우 OGG_OPUS로 전달).
  </Step>
</Steps>

## 구성 옵션

| Option        | Path                                         | 설명                                                       |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 대시보드 자격 증명. `INWORLD_API_KEY`로 대체됩니다.     |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Inworld API 기본 URL을 재정의합니다(기본값 `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | 음성 식별자(기본값 `Sarah`).                               |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS 모델 id(기본값 `inworld-tts-1.5-max`).                     |
| `temperature` | `messages.tts.providers.inworld.temperature` | 샘플링 temperature `0..2`(선택 사항).                           |

## 참고

<AccordionGroup>
  <Accordion title="인증">
    Inworld는 하나의 Base64 인코딩 자격 증명 문자열을 사용하는 HTTP Basic auth를 사용합니다.
    Inworld 대시보드에서 이 값을 그대로 복사하세요. provider는 이를
    `Authorization: Basic <apiKey>` 형식으로 추가 인코딩 없이 전송하므로,
    직접 Base64 인코딩하지 말고 bearer 스타일 토큰도 전달하지 마세요.
    같은 주의 사항은 [TTS auth notes](/ko/tools/tts#inworld-primary)도 참고하세요.
  </Accordion>
  <Accordion title="모델">
    지원되는 모델 id: `inworld-tts-1.5-max`(기본값),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="오디오 출력">
    답장은 기본적으로 MP3를 사용합니다. 채널 대상이 `voice-note`이면
    OpenClaw는 Inworld에 `OGG_OPUS`를 요청하여 오디오가 네이티브
    음성 버블로 재생되도록 합니다. 텔레포니 합성은 텔레포니 브리지를 공급하기 위해
    22050 Hz의 원시 `PCM`을 사용합니다.
  </Accordion>
  <Accordion title="커스텀 엔드포인트">
    `messages.tts.providers.inworld.baseUrl`로 API 호스트를 재정의할 수 있습니다.
    요청을 보내기 전에 끝의 슬래시는 제거됩니다.
  </Accordion>
</AccordionGroup>

## 관련 문서

<CardGroup cols={2}>
  <Card title="텍스트 음성 변환" href="/ko/tools/tts" icon="waveform-lines">
    TTS 개요, provider, `messages.tts` config.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    `messages.tts` 설정을 포함한 전체 config 참조.
  </Card>
  <Card title="Providers" href="/ko/providers" icon="grid">
    번들된 모든 OpenClaw provider.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 디버깅 단계.
  </Card>
</CardGroup>
