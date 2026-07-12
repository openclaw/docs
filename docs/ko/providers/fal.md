---
read_when:
    - OpenClaw에서 fal 이미지 생성을 사용하려고 합니다
    - FAL_KEY 인증 흐름이 필요합니다
    - image_generate, video_generate 또는 music_generate에 fal 기본값을 사용하려는 경우
summary: OpenClaw의 fal 이미지, 동영상 및 음악 생성 설정
title: 거짓
x-i18n:
    generated_at: "2026-07-12T01:06:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw에는 호스팅 이미지, 동영상 및 음악 생성을 위한 `fal` provider가
번들로 포함되어 있습니다.

| 속성     | 값                                                                              |
| -------- | ------------------------------------------------------------------------------- |
| Provider | `fal`                                                                           |
| 인증     | `FAL_KEY`(표준, `FAL_API_KEY`도 대체 수단으로 사용 가능)                        |
| API      | fal 모델 엔드포인트(`https://fal.run`, 동영상 작업은 `https://queue.fal.run` 사용) |
| 기본 URL | `models.providers.fal.baseUrl`로 재정의                                         |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    비대화형 설정에서는 `--fal-api-key <key>`를 전달하거나 `FAL_KEY`를 내보낼 수 있습니다.
    온보딩 과정에서는 이미지 모델이 구성되어 있지 않은 경우
    `fal/fal-ai/flux/dev`를 기본 이미지 모델로 설정합니다.

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

번들로 제공되는 `fal` 이미지 생성 provider의 기본값은
`fal/fal-ai/flux/dev`입니다.

| 기능          | 값                                                                 |
| ------------- | ------------------------------------------------------------------ |
| 최대 이미지 수 | 요청당 4개, Krea 2는 요청당 1개                                   |
| 크기 재정의   | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024`    |
| 화면비        | Flux 이미지 간 변환을 제외한 모든 모델에서 지원                    |
| 해상도        | `1K`, `2K`, `4K`(모델별 제한은 아래 참조)                          |
| 출력 형식     | `png`(기본값) 또는 `jpeg`, Krea 2는 `outputFormat` 재정의를 거부    |

편집 요청(공유 `image` / `images` 매개변수를 통한 참조 이미지)은
모델별 참조 이미지 제한이 적용되는 모델별 편집 엔드포인트로 라우팅됩니다.

| 모델 계열                 | `fal/` 뒤의 모델 참조                  | 편집 엔드포인트    | 최대 참조 이미지 수 |
| ------------------------- | -------------------------------------- | ------------------ | ------------------- |
| Flux 및 기타 fal 모델     | `fal-ai/flux/dev`(기본값)              | `/image-to-image`  | 1                   |
| GPT Image                 | `openai/gpt-image-*`                   | `/edit`            | 10                  |
| Grok Imagine              | `xai/grok-imagine-image`               | `/edit`            | 3                   |
| Nano Banana(레거시)       | `fal-ai/nano-banana`                   | `/edit`            | 3                   |
| Nano Banana 2             | `fal-ai/nano-banana-*`                 | `/edit`            | 14                  |
| Nano Banana 2 Lite        | `google/nano-banana-2-lite`            | `/edit`            | 14                  |
| Krea 2                    | `krea/v2/{medium,large}/text-to-image` | 없음(스타일 참조)  | 스타일 참조 10개    |

<Warning>
Flux 이미지 간 변환 요청은 `aspectRatio` 재정의를 지원하지 **않습니다**. GPT
Image 및 Nano Banana 2 편집 요청은 fal의 `/edit` 엔드포인트를 사용하며
화면비 힌트를 허용합니다. Nano Banana 2는 `4:1`, `1:4`, `8:1`, `1:8`과 같은
추가 네이티브 가로형/세로형 비율도 허용하며, Krea 2는 자체적으로 더 제한된
화면비 하위 집합을 검증합니다. Grok Imagine에는 자체 비율 목록(`2:1`,
`20:9`, `19.5:9` 및 각각의 역비율 포함)이 있으며 `1K`/`2K` 해상도만 허용합니다.
레거시 Nano Banana와 Nano Banana 2 Lite는 `resolution` 재정의를 거부합니다.
</Warning>

Krea 2 모델은 fal의 네이티브 Krea 페이로드 스키마를 사용합니다. OpenClaw는
Flux에서 사용하는 일반 `image_size` / 편집 엔드포인트 페이로드 대신
`aspect_ratio`, `creativity`, `image_style_references`를 전송합니다.
모델 참조는 다음과 같습니다.

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

더 빠르고 표현력 있는 일러스트레이션, 애니메이션, 회화 및 예술적 스타일에는
Medium을 사용하세요. 더 느리지만 사실적인 사진, 원재료 질감, 필름 그레인 및
세밀한 표현에는 Large를 사용하세요. Krea의 기본값은 `fal.creativity: "medium"`이며,
지원되는 값은 `raw`, `low`, `medium`, `high`입니다.

Krea 2는 fal 요청 스키마에서 `image_size`가 아닌 화면비를 노출합니다.
`aspectRatio`를 우선 사용하세요. OpenClaw는 `size`를 가장 가까운 지원 Krea
화면비로 매핑하며, Krea에서 `resolution`을 무시하지 않고 거부합니다.

`output_format`을 노출하는 fal 모델에서 PNG 출력을 원하면
`outputFormat: "png"`를 사용하세요. fal은 OpenClaw에서 명시적인 투명 배경
제어 기능을 선언하지 않으므로 fal 모델에서는 `background: "transparent"`가
무시된 재정의로 보고됩니다.
Krea 2 엔드포인트는 fal을 통해 `output_format` 요청 필드를 노출하지 않으므로
OpenClaw는 Krea 요청의 `outputFormat` 재정의를 거부합니다.

Krea 2 Medium을 사용하려면 다음과 같이 설정하세요.

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

## 동영상 생성

번들로 제공되는 `fal` 동영상 생성 provider의 기본값은
`fal/fal-ai/minimax/video-01-live`입니다.

| 기능       | 값                                                                 |
| ---------- | ------------------------------------------------------------------ |
| 모드       | 텍스트 기반 동영상, 단일 이미지 참조, Seedance 참조 기반 동영상   |
| 런타임     | 장기 실행 작업을 위한 큐 기반 제출/상태/결과 흐름                  |
| 시간 제한  | 기본적으로 작업당 20분, 5초마다 상태 폴링                          |

<AccordionGroup>
  <Accordion title="사용 가능한 동영상 모델">
    **MiniMax(기본값):**

    - `fal/fal-ai/minimax/video-01-live`

    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling 및 Wan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    MiniMax Live 및 HeyGen 요청은 프롬프트와 선택적 단일 참조 이미지만
    전송하며, 다른 재정의는 전달하지 않습니다. Seedance 모델은
    `aspectRatio`, `size`, `resolution`, 4~15초의 재생 시간 및 오디오
    전환 옵션을 허용합니다.

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

  <Accordion title="Seedance 2.0 참조 기반 동영상 구성 예시">
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

    참조 기반 동영상은 공유 `video_generate`의 `images`, `videos`,
    `audioRefs` 매개변수를 통해 이미지 최대 9개, 동영상 3개 및 오디오 참조
    3개를 허용하며, 전체 참조 파일은 최대 12개입니다. 오디오 참조를 사용하려면
    동일한 요청에 이미지 또는 동영상 참조가 하나 이상 있어야 합니다.

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

## 음악 생성

번들로 제공되는 `fal` Plugin은 공유 `music_generate` 도구를 위한 음악 생성
provider도 등록합니다.

| 기능        | 값                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| 기본 모델   | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| 모델        | `fal-ai/minimax-music/v2.6`(mp3), `fal-ai/ace-step/prompt-to-audio`(wav), `fal-ai/stable-audio-25/text-to-audio`(wav)     |
| 최대 재생 시간 | 240초                                                                                                                 |
| 런타임      | 동기식 요청 후 생성된 오디오 다운로드                                                                                    |

fal을 기본 음악 provider로 사용하려면 다음과 같이 설정하세요.

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

`fal-ai/minimax-music/v2.6`은 명시적 가사와 연주 전용 모드를 지원하지만,
동일한 요청에서 둘 다 사용할 수는 없습니다. ACE-Step과 Stable Audio는
프롬프트 기반 오디오 엔드포인트입니다. 해당 모델 계열을 사용하려면 `model`
재정의로 선택하세요. ACE-Step은 명시적 가사를 거부하며, Stable Audio는
가사와 연주 전용 모드를 모두 거부합니다.

<Tip>
위의 표와 아코디언에서는 번들 fal provider가 특수 처리하는 모델 계열을
다룹니다. 다른 fal 이미지 엔드포인트 ID도 이미지 모델로 선택할 수 있으며,
이 경우 Flux와 동일하게 처리됩니다(일반 `image_size` 페이로드,
`/image-to-image`를 통한 참조 이미지 1개).
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    공유 동영상 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    공유 음악 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    이미지, 동영상 및 음악 모델 선택을 포함한 에이전트 기본값.
  </Card>
</CardGroup>
