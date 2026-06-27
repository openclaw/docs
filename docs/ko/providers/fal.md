---
read_when:
    - OpenClaw에서 fal 이미지 생성을 사용하려는 경우
    - FAL_KEY 인증 흐름이 필요합니다
    - image_generate, video_generate 또는 music_generate에 대해 fal 기본값을 원합니다
summary: OpenClaw에서 fal 이미지, 동영상 및 음악 생성 설정
title: Fal
x-i18n:
    generated_at: "2026-06-27T18:01:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw은 호스팅 이미지, 비디오, 음악 생성을 위한 번들 `fal` 제공자를 제공합니다.

| 속성 | 값                                                         |
| -------- | ------------------------------------------------------------- |
| 제공자 | `fal`                                                         |
| 인증     | `FAL_KEY`(표준, `FAL_API_KEY`도 폴백으로 작동) |
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

번들 `fal` 이미지 생성 제공자의 기본값은
`fal/fal-ai/flux/dev`입니다.

| 기능     | 값                                                              |
| -------------- | ------------------------------------------------------------------ |
| 최대 이미지 수     | 요청당 4개, Krea 2: 요청당 1개                               |
| 편집 모드      | Flux: 참조 이미지 1개, GPT Image 2: 10개, Nano Banana 2: 14개        |
| 스타일 참조     | Krea 2: `image` / `images`를 통해 최대 10개의 스타일 참조           |
| 크기 재정의 | 지원됨                                                          |
| 종횡비   | 생성, Krea 2, GPT Image 2/Nano Banana 2 편집에서 지원됨 |
| 해상도     | 지원됨                                                          |
| 출력 형식  | `png` 또는 `jpeg`                                                    |

<Warning>
Flux 이미지-투-이미지 요청은 `aspectRatio` 재정의를 **지원하지 않습니다**. GPT
Image 2와 Nano Banana 2 편집 요청은 fal의 `/edit` 엔드포인트를 사용하며
종횡비 힌트를 받습니다. Nano Banana 2는 `4:1`, `1:4`, `8:1`, `1:8`과 같은
추가 네이티브 와이드/톨 비율도 받습니다. Krea 2는 자체적으로 더 작은
종횡비 하위 집합을 검증합니다.
</Warning>

Krea 2 모델은 fal의 네이티브 Krea 페이로드 스키마를 사용합니다. OpenClaw는
Flux에서 사용하는 일반 `image_size` / 편집 엔드포인트 페이로드 대신
`aspect_ratio`, `creativity`, `image_style_references`를 보냅니다. 모델 참조는 다음과 같습니다.

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

더 빠른 표현적 일러스트레이션, 애니메이션, 회화, 예술적
스타일에는 Medium을 사용하세요. 더 느린 포토리얼, 원시 텍스처, 필름 그레인, 디테일한
룩에는 Large를 사용하세요. Krea의 기본값은 `fal.creativity: "medium"`이며, 지원되는 값은
`raw`, `low`, `medium`, `high`입니다.

Krea 2는 fal의 요청 스키마에서 `image_size`가 아니라 종횡비를 노출합니다.
`aspectRatio`를 우선 사용하세요. OpenClaw는 `size`를 가장 가까운 지원 Krea 종횡비에 매핑하고,
Krea에서는 `resolution`을 버리는 대신 거부합니다.

`output_format`을 노출하는 fal 모델에서 PNG 출력을 원할 때는
`outputFormat: "png"`를 사용하세요. fal은 OpenClaw에서 명시적인 투명 배경
제어를 선언하지 않으므로 `background: "transparent"`는 fal 모델에서 무시된
재정의로 보고됩니다.
Krea 2 엔드포인트는 fal을 통해 `output_format` 요청 필드를 노출하지 않으므로,
OpenClaw는 Krea 요청에 대한 `outputFormat` 재정의를 거부합니다.

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

Krea 2 Medium을 사용하려면:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
      },
    },
  },
}
```

## 비디오 생성

번들 `fal` 비디오 생성 제공자의 기본값은
`fal/fal-ai/minimax/video-01-live`입니다.

| 기능 | 값                                                              |
| ---------- | ------------------------------------------------------------------ |
| 모드      | 텍스트-투-비디오, 단일 이미지 참조, Seedance 참조-투-비디오 |
| 런타임    | 장기 실행 작업을 위한 큐 기반 제출/상태/결과 흐름       |

<AccordionGroup>
  <Accordion title="사용 가능한 비디오 모델">
    **HeyGen 비디오 에이전트:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

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

  <Accordion title="Seedance 2.0 참조-투-비디오 구성 예시">
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

    참조-투-비디오는 공유 `video_generate`의 `images`, `videos`, `audioRefs`
    매개변수를 통해 최대 9개의 이미지, 3개의 비디오, 3개의 오디오 참조를 받으며,
    전체 참조 파일은 최대 12개입니다.

  </Accordion>

  <Accordion title="HeyGen 비디오 에이전트 구성 예시">
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

## 음악 생성

번들 `fal` Plugin은 공유 `music_generate` 도구를 위한 음악 생성 제공자도 등록합니다.

| 기능    | 값                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| 기본 모델 | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| 모델        | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| 런타임       | 동기 요청 및 생성된 오디오 다운로드                                                      |

fal을 기본 음악 제공자로 사용하세요:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6`는 명시적 가사와 악기 모드를 지원합니다.
ACE-Step과 Stable Audio는 프롬프트-투-오디오 엔드포인트입니다. 해당 모델 패밀리를 원할 때
`model` 재정의로 선택하세요.

<Tip>
최근 추가된 항목을 포함해 사용 가능한 fal 모델의 전체 목록을 보려면
`openclaw models list --provider fal`을 사용하세요.
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 매개변수와 제공자 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 비디오 도구 매개변수와 제공자 선택.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    공유 음악 도구 매개변수와 제공자 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    이미지, 비디오, 음악 모델 선택을 포함한 에이전트 기본값.
  </Card>
</CardGroup>
