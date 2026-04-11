---
read_when:
    - OpenClaw에서 fal 이미지 생성을 사용하려고 합니다
    - '`FAL_KEY` 인증 흐름이 필요합니다'
    - '`image_generate` 또는 `video_generate`에 대한 fal 기본값이 필요합니다'
summary: OpenClaw에서 fal 이미지 및 비디오 생성 설정
title: fal
x-i18n:
    generated_at: "2026-04-11T02:47:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9bfe4f69124e922a79a516a1bd78f0c00f7a45f3c6f68b6d39e0d196fa01beb3
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw에는 호스팅형 이미지 및 비디오 생성을 위한 번들 `fal` provider가 포함되어 있습니다.

- Provider: `fal`
- 인증: `FAL_KEY` (표준, `FAL_API_KEY`도 fallback으로 작동)
- API: fal 모델 엔드포인트

## 빠른 시작

1. API 키를 설정합니다:

```bash
openclaw onboard --auth-choice fal-api-key
```

2. 기본 이미지 모델을 설정합니다:

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

## 이미지 생성

번들된 `fal` 이미지 생성 provider의 기본값은
`fal/fal-ai/flux/dev`입니다.

- 생성: 요청당 최대 4개 이미지
- 편집 모드: 활성화됨, 참조 이미지 1개
- `size`, `aspectRatio`, `resolution` 지원
- 현재 편집 관련 주의사항: fal 이미지 편집 엔드포인트는
  `aspectRatio` override를 지원하지 않습니다

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

- 모드: text-to-video 및 단일 이미지 참조 플로우
- 런타임: 오래 실행되는 작업을 위한 큐 기반 submit/status/result 플로우
- HeyGen video-agent 모델 참조:
  - `fal/fal-ai/heygen/v2/video-agent`
- Seedance 2.0 모델 참조:
  - `fal/bytedance/seedance-2.0/fast/text-to-video`
  - `fal/bytedance/seedance-2.0/fast/image-to-video`
  - `fal/bytedance/seedance-2.0/text-to-video`
  - `fal/bytedance/seedance-2.0/image-to-video`

Seedance 2.0을 기본 비디오 모델로 사용하려면:

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

HeyGen video-agent를 기본 비디오 모델로 사용하려면:

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

## 관련 항목

- [Image Generation](/ko/tools/image-generation)
- [Video Generation](/ko/tools/video-generation)
- [Configuration Reference](/ko/gateway/configuration-reference#agent-defaults)
