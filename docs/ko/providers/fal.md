---
read_when:
    - OpenClaw에서 fal 이미지 생성을 사용하려고 합니다
    - FAL_KEY 인증 흐름이 필요합니다
    - '`image_generate` 또는 `video_generate`용 fal 기본값이 필요합니다'
summary: OpenClaw에서 fal 이미지 및 비디오 생성 설정
title: fal
x-i18n:
    generated_at: "2026-04-12T23:30:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff275233179b4808d625383efe04189ad9e92af09944ba39f1e953e77378e347
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw에는 호스팅 이미지 및 비디오 생성을 위한 번들 `fal` provider가 포함되어 있습니다.

| Property | Value                                                         |
| -------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| Auth     | `FAL_KEY` (표준; `FAL_API_KEY`도 대체값으로 동작)             |
| API      | fal 모델 엔드포인트                                           |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="기본 이미지 모델 설정">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## 이미지 생성

번들 `fal` 이미지 생성 provider의 기본값은
`fal/fal-ai/flux/dev`입니다.

| Capability     | Value                      |
| -------------- | -------------------------- |
| Max images     | 요청당 최대 4개            |
| Edit mode      | 활성화됨, 참조 이미지 1개  |
| Size overrides | 지원됨                     |
| Aspect ratio   | 지원됨                     |
| Resolution     | 지원됨                     |

<Warning>
fal 이미지 편집 엔드포인트는 `aspectRatio` 재정의를 지원하지 않습니다.
</Warning>

fal을 기본 이미지 provider로 사용하려면:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## 비디오 생성

번들 `fal` 비디오 생성 provider의 기본값은
`fal/fal-ai/minimax/video-01-live`입니다.

| Capability | Value                                                        |
| ---------- | ------------------------------------------------------------ |
| Modes      | 텍스트-비디오, 단일 이미지 참조                              |
| Runtime    | 장시간 실행 작업을 위한 큐 기반 제출/상태/결과 흐름          |

<AccordionGroup>
  <Accordion title="사용 가능한 비디오 모델">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 구성 예시">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="HeyGen video-agent 구성 예시">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
`openclaw models list --provider fal`을 사용하면 최근 추가된 항목을 포함한 전체 fal 모델 목록을 확인할 수 있습니다.
</Tip>

## 관련

<CardGroup cols={2}>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공통 이미지 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공통 비디오 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference#agent-defaults" icon="gear">
    이미지 및 비디오 모델 선택을 포함한 agent 기본값.
  </Card>
</CardGroup>
