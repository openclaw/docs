---
read_when:
    - 에이전트를 통해 이미지를 생성할 때
    - 이미지 생성 제공업체와 모델을 구성할 때
    - image_generate 도구 매개변수를 이해할 때
summary: 구성된 제공업체(OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)를 사용해 이미지를 생성하고 편집합니다
title: 이미지 생성
x-i18n:
    generated_at: "2026-04-06T06:00:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 903cc522c283a8da2cbd449ae3e25f349a74d00ecfdaf0f323fd8aa3f2107aea
    source_path: tools/image-generation.md
    workflow: 15
---

# 이미지 생성

`image_generate` 도구를 사용하면 에이전트가 구성된 제공업체를 사용해 이미지를 만들고 편집할 수 있습니다. 생성된 이미지는 에이전트 응답의 미디어 첨부 파일로 자동 전달됩니다.

<Note>
이 도구는 하나 이상의 이미지 생성 제공업체를 사용할 수 있을 때만 표시됩니다. 에이전트 도구에 `image_generate`가 보이지 않으면 `agents.defaults.imageGenerationModel`을 구성하거나 제공업체 API 키를 설정하세요.
</Note>

## 빠른 시작

1. 하나 이상의 제공업체에 대한 API 키를 설정합니다(예: `OPENAI_API_KEY` 또는 `GEMINI_API_KEY`).
2. 선택적으로 선호하는 모델을 설정합니다:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

3. 에이전트에게 요청합니다: _"친근한 바닷가재 마스코트 이미지를 생성해줘."_

에이전트는 `image_generate`를 자동으로 호출합니다. 도구 허용 목록을 따로 설정할 필요가 없습니다. 제공업체를 사용할 수 있으면 기본적으로 활성화됩니다.

## 지원되는 제공업체

| 제공업체 | 기본 모델                         | 편집 지원                           | API 키                                                |
| -------- | --------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-1`                     | 예(최대 5개 이미지)                 | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview`  | 예                                  | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`                |
| fal      | `fal-ai/flux/dev`                 | 예                                  | `FAL_KEY`                                             |
| MiniMax  | `image-01`                        | 예(피사체 참조)                     | `MINIMAX_API_KEY` 또는 MiniMax OAuth (`minimax-portal`) |
| ComfyUI  | `workflow`                        | 예(1개 이미지, 워크플로 구성 기준)  | 클라우드의 경우 `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY` |
| Vydra    | `grok-imagine`                    | 아니요                              | `VYDRA_API_KEY`                                       |

런타임에 사용 가능한 제공업체와 모델을 확인하려면 `action: "list"`를 사용하세요:

```
/tool image_generate action=list
```

## 도구 매개변수

| 매개변수      | 유형     | 설명                                                                                  |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | 이미지 생성 프롬프트(`action: "generate"`일 때 필수)                                  |
| `action`      | string   | 제공업체를 확인하는 `"generate"`(기본값) 또는 `"list"`                                |
| `model`       | string   | 제공업체/모델 재정의(예: `openai/gpt-image-1`)                                        |
| `image`       | string   | 편집 모드용 단일 참조 이미지 경로 또는 URL                                            |
| `images`      | string[] | 편집 모드용 여러 참조 이미지(최대 5개)                                                |
| `size`        | string   | 크기 힌트: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`            |
| `aspectRatio` | string   | 종횡비: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`      |
| `resolution`  | string   | 해상도 힌트: `1K`, `2K` 또는 `4K`                                                     |
| `count`       | number   | 생성할 이미지 수(1–4)                                                                 |
| `filename`    | string   | 출력 파일 이름 힌트                                                                    |

모든 제공업체가 모든 매개변수를 지원하는 것은 아닙니다. 이 도구는 각 제공업체가 지원하는 값만 전달하고, 나머지는 무시하며, 제외된 재정의 항목은 도구 결과에 보고합니다.

## 구성

### 모델 선택

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### 제공업체 선택 순서

이미지를 생성할 때 OpenClaw는 다음 순서로 제공업체를 시도합니다:

1. 도구 호출의 **`model` 매개변수**(에이전트가 지정한 경우)
2. 구성의 **`imageGenerationModel.primary`**
3. 순서대로 **`imageGenerationModel.fallbacks`**
4. **자동 감지** — 인증이 뒷받침되는 제공업체 기본값만 사용:
   - 현재 기본 제공업체를 먼저
   - 나머지 등록된 이미지 생성 제공업체를 제공업체 ID 순서로

제공업체가 실패하면(인증 오류, 속도 제한 등) 다음 후보를 자동으로 시도합니다. 모두 실패하면 오류에 각 시도의 세부 정보가 포함됩니다.

참고:

- 자동 감지는 인증 인식 방식으로 동작합니다. 제공업체 기본값은
  OpenClaw가 실제로 해당 제공업체에 인증할 수 있을 때만
  후보 목록에 들어갑니다.
- 현재 등록된 제공업체, 해당 기본 모델, 인증 env var 힌트를
  확인하려면 `action: "list"`를 사용하세요.

### 이미지 편집

OpenAI, Google, fal, MiniMax, ComfyUI는 참조 이미지 편집을 지원합니다. 참조 이미지 경로 또는 URL을 전달하세요:

```
"이 사진을 수채화 버전으로 생성해줘" + image: "/path/to/photo.jpg"
```

OpenAI와 Google은 `images` 매개변수를 통해 최대 5개의 참조 이미지를 지원합니다. fal, MiniMax, ComfyUI는 1개를 지원합니다.

MiniMax 이미지 생성은 번들된 두 MiniMax 인증 경로 모두를 통해 사용할 수 있습니다:

- API 키 설정용 `minimax/image-01`
- OAuth 설정용 `minimax-portal/image-01`

## 제공업체 기능

| 기능                 | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| 생성                 | 예(최대 4개)         | 예(최대 4개)         | 예(최대 4개)        | 예(최대 9개)               | 예(워크플로로 정의된 출력)         | 예(1개) |
| 편집/참조            | 예(최대 5개 이미지)  | 예(최대 5개 이미지)  | 예(1개 이미지)      | 예(1개 이미지, 피사체 참조) | 예(1개 이미지, 워크플로 구성 기준) | 아니요  |
| 크기 제어            | 예                   | 예                   | 예                  | 아니요                     | 아니요                             | 아니요  |
| 종횡비               | 아니요               | 예                   | 예(생성 전용)       | 예                         | 아니요                             | 아니요  |
| 해상도 (1K/2K/4K)    | 아니요               | 예                   | 예                  | 아니요                     | 아니요                             | 아니요  |

## 관련 항목

- [도구 개요](/ko/tools) — 사용 가능한 모든 에이전트 도구
- [fal](/ko/providers/fal) — fal 이미지 및 비디오 제공업체 설정
- [ComfyUI](/ko/providers/comfy) — 로컬 ComfyUI 및 Comfy Cloud 워크플로 설정
- [Google (Gemini)](/ko/providers/google) — Gemini 이미지 제공업체 설정
- [MiniMax](/ko/providers/minimax) — MiniMax 이미지 제공업체 설정
- [OpenAI](/ko/providers/openai) — OpenAI Images 제공업체 설정
- [Vydra](/ko/providers/vydra) — Vydra 이미지, 비디오, 음성 설정
- [구성 참조](/ko/gateway/configuration-reference#agent-defaults) — `imageGenerationModel` 구성
- [모델](/ko/concepts/models) — 모델 구성 및 장애 조치
