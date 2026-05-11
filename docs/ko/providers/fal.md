---
read_when:
    - OpenClaw에서 fal 이미지 생성을 사용하려는 경우
    - FAL_KEY 인증 흐름이 필요합니다
    - image_generate 또는 video_generate에 대한 fal 기본값이 필요합니다
summary: OpenClaw에서 fal 이미지 및 동영상 생성 설정
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:34:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw은 호스팅 이미지 및 비디오 생성을 위한 번들 `fal` 제공자를 제공합니다.

| 속성 | 값                                                            |
| ---- | ------------------------------------------------------------- |
| 제공자 | `fal`                                                         |
| 인증 | `FAL_KEY`(표준; `FAL_API_KEY`도 대체 수단으로 동작) |
| API | fal 모델 엔드포인트                                           |

## 시작하기

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Set a default image model">
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

번들 `fal` 이미지 생성 제공자의 기본값은
`fal/fal-ai/flux/dev`입니다.

| 기능 | 값                                                        |
| ---- | ----------------------------------------------------------- |
| 최대 이미지 수 | 요청당 4개                                               |
| 편집 모드 | Flux: 참조 이미지 1개; GPT Image 2: 10개; Nano Banana 2: 14개 |
| 크기 재정의 | 지원됨                                                   |
| 종횡비 | 생성 및 GPT Image 2/Nano Banana 2 편집에서 지원됨   |
| 해상도 | 지원됨                                                   |
| 출력 형식 | `png` 또는 `jpeg`                                             |

<Warning>
Flux 이미지-투-이미지 요청은 `aspectRatio` 재정의를 지원하지 **않습니다**. GPT
Image 2 및 Nano Banana 2 편집 요청은 fal의 `/edit` 엔드포인트를 사용하며
종횡비 힌트를 허용합니다.
</Warning>

PNG 출력을 원할 때는 `outputFormat: "png"`를 사용하세요. fal은 OpenClaw에서
명시적인 투명 배경 제어를 선언하지 않으므로, fal 모델에서는 `background:
"transparent"`가 무시된 재정의로 보고됩니다.

fal을 기본 이미지 제공자로 사용하려면:

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

번들 `fal` 비디오 생성 제공자의 기본값은
`fal/fal-ai/minimax/video-01-live`입니다.

| 기능 | 값                                                              |
| ---- | ------------------------------------------------------------------ |
| 모드 | 텍스트-투-비디오, 단일 이미지 참조, Seedance 참조-투-비디오 |
| 런타임 | 장기 실행 작업을 위한 큐 기반 제출/상태/결과 흐름       |

<AccordionGroup>
  <Accordion title="Available video models">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 config example">
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

  <Accordion title="Seedance 2.0 reference-to-video config example">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    참조-투-비디오는 공유 `video_generate` `images`, `videos`, `audioRefs`
    매개변수를 통해 최대 9개의 이미지, 3개의 비디오, 3개의 오디오 참조를 허용하며,
    총 참조 파일은 최대 12개입니다.

  </Accordion>

  <Accordion title="HeyGen video-agent config example">
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
사용 가능한 fal 모델의 전체 목록과 최근 추가된 항목을 보려면
`openclaw models list --provider fal`을 사용하세요.
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Image generation" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 매개변수 및 제공자 선택입니다.
  </Card>
  <Card title="Video generation" href="/ko/tools/video-generation" icon="video">
    공유 비디오 도구 매개변수 및 제공자 선택입니다.
  </Card>
  <Card title="Configuration reference" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    이미지 및 비디오 모델 선택을 포함한 Agent 기본값입니다.
  </Card>
</CardGroup>
