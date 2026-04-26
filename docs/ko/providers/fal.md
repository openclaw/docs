---
read_when:
    - OpenClaw에서 fal 이미지 생성을 사용하려고 합니다
    - FAL_KEY 인증 흐름이 필요합니다
    - '`image_generate` 또는 `video_generate`용 fal 기본값이 필요합니다'
summary: OpenClaw에서 fal 이미지 및 비디오 생성 설정
title: Fal
x-i18n:
    generated_at: "2026-04-26T11:37:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw는 호스팅 이미지 및 비디오 생성을 위한 번들된 `fal` provider를 제공합니다.

| 속성 | 값 |
| -------- | ------------------------------------------------------------- |
| Provider | `fal` |
| 인증 | `FAL_KEY`(기본값; `FAL_API_KEY`도 폴백으로 동작) |
| API | fal model 엔드포인트 |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="기본 이미지 model 설정">
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

번들된 `fal` 이미지 생성 provider의 기본값은
`fal/fal-ai/flux/dev`입니다.

| 기능 | 값 |
| -------------- | -------------------------- |
| 최대 이미지 수 | 요청당 4개 |
| 편집 모드 | 활성화됨, 참조 이미지 1개 |
| 크기 재정의 | 지원됨 |
| 종횡비 | 지원됨 |
| 해상도 | 지원됨 |
| 출력 형식 | `png` 또는 `jpeg` |

<Warning>
fal 이미지 편집 엔드포인트는 `aspectRatio` 재정의를 지원하지 않습니다.
</Warning>

PNG 출력이 필요하면 `outputFormat: "png"`를 사용하세요. fal은 OpenClaw에서
명시적인 투명 배경 제어를 선언하지 않으므로 `background:
"transparent"`는 fal model에 대해 무시된 재정의로 보고됩니다.

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

번들된 `fal` 비디오 생성 provider의 기본값은
`fal/fal-ai/minimax/video-01-live`입니다.

| 기능 | 값 |
| ---------- | ------------------------------------------------------------------ |
| 모드 | 텍스트-비디오, 단일 이미지 참조, Seedance 참조-비디오 |
| 런타임 | 장시간 실행 작업을 위한 큐 기반 submit/status/result 흐름 |

<AccordionGroup>
  <Accordion title="사용 가능한 비디오 model">
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

  <Accordion title="Seedance 2.0 config 예시">
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

  <Accordion title="Seedance 2.0 참조-비디오 config 예시">
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

    참조-비디오는 공유 `video_generate`의 `images`, `videos`, `audioRefs`
    매개변수를 통해 최대 9개의 이미지, 3개의 비디오, 3개의 오디오 참조를 받을 수 있으며,
    전체 참조 파일 수는 최대 12개입니다.

  </Accordion>

  <Accordion title="HeyGen video-agent config 예시">
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
최근 추가된 항목을 포함한 전체 fal
model 목록을 보려면 `openclaw models list --provider fal`을 사용하세요.
</Tip>

## 관련

<CardGroup cols={2}>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공통 이미지 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공통 비디오 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="Configuration 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    이미지 및 비디오 model 선택을 포함한 에이전트 기본값.
  </Card>
</CardGroup>
