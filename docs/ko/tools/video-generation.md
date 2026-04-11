---
read_when:
    - 에이전트를 통해 비디오 생성하기
    - 비디오 생성 provider와 모델 설정하기
    - '`video_generate` tool 매개변수 이해하기'
summary: 12개의 provider 백엔드를 사용해 텍스트, 이미지, 또는 기존 비디오로부터 비디오 생성하기
title: 비디오 생성
x-i18n:
    generated_at: "2026-04-11T02:48:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6848d03ef578181902517d068e8d9fe2f845e572a90481bbdf7bd9f1c591f245
    source_path: tools/video-generation.md
    workflow: 15
---

# 비디오 생성

OpenClaw 에이전트는 텍스트 프롬프트, 참조 이미지, 또는 기존 비디오로부터 비디오를 생성할 수 있습니다. 12개의 provider 백엔드가 지원되며, 각각 다른 모델 옵션, 입력 모드, 기능 세트를 제공합니다. 에이전트는 설정과 사용 가능한 API 키를 기준으로 적절한 provider를 자동으로 선택합니다.

<Note>
`video_generate` tool은 하나 이상의 비디오 생성 provider를 사용할 수 있을 때만 나타납니다. 에이전트 tool 목록에서 보이지 않는다면, provider API 키를 설정하거나 `agents.defaults.videoGenerationModel`을 구성하세요.
</Note>

OpenClaw는 비디오 생성을 세 가지 런타임 모드로 처리합니다:

- 참조 미디어가 없는 텍스트-비디오 요청을 위한 `generate`
- 하나 이상의 참조 이미지가 포함된 요청일 때의 `imageToVideo`
- 하나 이상의 참조 비디오가 포함된 요청일 때의 `videoToVideo`

provider는 이 모드들 중 일부만 지원할 수도 있습니다. tool은 제출 전에 활성 모드를 검증하고 `action=list`에서 지원되는 모드를 보고합니다.

## 빠른 시작

1. 지원되는 provider 중 하나에 API 키를 설정하세요:

```bash
export GEMINI_API_KEY="your-key"
```

2. 선택적으로 기본 모델을 고정하세요:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. 에이전트에게 요청하세요:

> 해질녘에 친근한 바닷가재가 서핑하는 5초짜리 시네마틱 비디오를 생성해줘.

에이전트는 `video_generate`를 자동으로 호출합니다. tool 허용 목록 설정은 필요하지 않습니다.

## 비디오를 생성하면 어떤 일이 일어나는가

비디오 생성은 비동기식입니다. 세션에서 에이전트가 `video_generate`를 호출하면:

1. OpenClaw가 요청을 provider에 제출하고 즉시 작업 ID를 반환합니다.
2. provider가 백그라운드에서 작업을 처리합니다(보통 provider와 해상도에 따라 30초에서 5분).
3. 비디오가 준비되면 OpenClaw가 내부 완료 이벤트로 같은 세션을 깨웁니다.
4. 에이전트가 완성된 비디오를 원래 대화에 다시 게시합니다.

작업이 진행 중인 동안에는 같은 세션에서 중복된 `video_generate` 호출이 또 다른 생성을 시작하는 대신 현재 작업 상태를 반환합니다. CLI에서 진행 상황을 확인하려면 `openclaw tasks list` 또는 `openclaw tasks show <taskId>`를 사용하세요.

세션 기반 에이전트 실행이 아닌 경우(예: 직접적인 tool 호출)에는 tool이 인라인 생성으로 폴백하고, 같은 턴 안에 최종 미디어 경로를 반환합니다.

### 작업 수명 주기

각 `video_generate` 요청은 네 가지 상태를 거칩니다:

1. **queued** -- 작업이 생성되었고 provider가 수락하기를 기다리는 중
2. **running** -- provider가 처리 중(보통 provider와 해상도에 따라 30초에서 5분)
3. **succeeded** -- 비디오 준비 완료, 에이전트가 깨어나 대화에 게시
4. **failed** -- provider 오류 또는 타임아웃, 에이전트가 오류 세부 정보와 함께 깨어남

CLI에서 상태를 확인하세요:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

중복 방지: 현재 세션에 대해 비디오 작업이 이미 `queued` 또는 `running` 상태라면, `video_generate`는 새 작업을 시작하는 대신 기존 작업 상태를 반환합니다. 명시적으로 새 생성을 트리거하지 않고 확인하려면 `action: "status"`를 사용하세요.

## 지원되는 provider

| Provider | 기본 모델 | 텍스트 | 이미지 참조 | 비디오 참조 | API 키 |
| -------- | --------- | ------ | ----------- | ----------- | ------ |
| Alibaba  | `wan2.6-t2v`                    | Yes  | Yes (remote URL)  | Yes (remote URL) | `MODELSTUDIO_API_KEY`                    |
| BytePlus | `seedance-1-0-lite-t2v-250428`  | Yes  | 1 image           | No               | `BYTEPLUS_API_KEY`                       |
| ComfyUI  | `workflow`                      | Yes  | 1 image           | No               | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`  | Yes  | 1 image           | No               | `FAL_KEY`                                |
| Google   | `veo-3.1-fast-generate-preview` | Yes  | 1 image           | 1 video          | `GEMINI_API_KEY`                         |
| MiniMax  | `MiniMax-Hailuo-2.3`            | Yes  | 1 image           | No               | `MINIMAX_API_KEY`                        |
| OpenAI   | `sora-2`                        | Yes  | 1 image           | 1 video          | `OPENAI_API_KEY`                         |
| Qwen     | `wan2.6-t2v`                    | Yes  | Yes (remote URL)  | Yes (remote URL) | `QWEN_API_KEY`                           |
| Runway   | `gen4.5`                        | Yes  | 1 image           | 1 video          | `RUNWAYML_API_SECRET`                    |
| Together | `Wan-AI/Wan2.2-T2V-A14B`        | Yes  | 1 image           | No               | `TOGETHER_API_KEY`                       |
| Vydra    | `veo3`                          | Yes  | 1 image (`kling`) | No               | `VYDRA_API_KEY`                          |
| xAI      | `grok-imagine-video`            | Yes  | 1 image           | 1 video          | `XAI_API_KEY`                            |

일부 provider는 추가 또는 대체 API 키 env var도 허용합니다. 자세한 내용은 각 [provider 페이지](#related)를 참조하세요.

런타임에서 사용 가능한 provider, 모델, 런타임 모드를 확인하려면 `video_generate action=list`를 실행하세요.

### 선언된 기능 매트릭스

이것은 `video_generate`, 계약 테스트, 그리고 공유 라이브 스윕에서 사용하는 명시적 모드 계약입니다.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | 현재 공유 라이브 레인 |
| -------- | ---------- | -------------- | -------------- | ---------------------- |
| Alibaba  | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 이 provider는 원격 `http(s)` 비디오 URL이 필요하므로 `videoToVideo`는 건너뜀 |
| BytePlus | Yes        | Yes            | No             | `generate`, `imageToVideo` |
| ComfyUI  | Yes        | Yes            | No             | 공유 스윕에는 포함되지 않음; workflow 전용 커버리지는 Comfy 테스트와 함께 유지 |
| fal      | Yes        | Yes            | No             | `generate`, `imageToVideo` |
| Google   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 현재 버퍼 기반 Gemini/Veo 스윕이 그 입력을 받지 않으므로 공유 `videoToVideo`는 건너뜀 |
| MiniMax  | Yes        | Yes            | No             | `generate`, `imageToVideo` |
| OpenAI   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 현재 이 조직/입력 경로에 provider 측 inpaint/remix 접근이 필요하므로 공유 `videoToVideo`는 건너뜀 |
| Qwen     | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 이 provider는 원격 `http(s)` 비디오 URL이 필요하므로 `videoToVideo`는 건너뜀 |
| Runway   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo`는 선택된 모델이 `runway/gen4_aleph`일 때만 실행 |
| Together | Yes        | Yes            | No             | `generate`, `imageToVideo` |
| Vydra    | Yes        | Yes            | No             | `generate`; 번들 `veo3`는 텍스트 전용이고 번들 `kling`은 원격 이미지 URL이 필요하므로 공유 `imageToVideo`는 건너뜀 |
| xAI      | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 이 provider는 현재 원격 MP4 URL이 필요하므로 `videoToVideo`는 건너뜀 |

## Tool 매개변수

### 필수

| 매개변수 | 타입   | 설명 |
| -------- | ------ | ---- |
| `prompt`  | string | 생성할 비디오의 텍스트 설명 (`action: "generate"`일 때 필수) |

### 콘텐츠 입력

| 매개변수 | 타입     | 설명 |
| --------- | -------- | ---- |
| `image`   | string   | 단일 참조 이미지(경로 또는 URL) |
| `images`  | string[] | 여러 참조 이미지(최대 5개) |
| `video`   | string   | 단일 참조 비디오(경로 또는 URL) |
| `videos`  | string[] | 여러 참조 비디오(최대 4개) |

### 스타일 제어

| 매개변수         | 타입    | 설명 |
| ----------------- | ------- | ---- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`      | string  | `480P`, `720P`, `768P`, 또는 `1080P` |
| `durationSeconds` | number  | 목표 길이(초), 가장 가까운 provider 지원 값으로 반올림됨 |
| `size`            | string  | provider가 지원하는 경우 크기 힌트 |
| `audio`           | boolean | 지원되는 경우 생성된 오디오 활성화 |
| `watermark`       | boolean | 지원되는 경우 provider 워터마킹 전환 |

### 고급

| 매개변수  | 타입   | 설명 |
| ---------- | ------ | ---- |
| `action`   | string | `"generate"`(기본값), `"status"`, 또는 `"list"` |
| `model`    | string | provider/model 재정의(예: `runway/gen4.5`) |
| `filename` | string | 출력 파일명 힌트 |

모든 provider가 모든 매개변수를 지원하는 것은 아닙니다. OpenClaw는 이미 길이를 가장 가까운 provider 지원 값으로 정규화하며, 폴백 provider가 다른 제어 표면을 노출할 때 크기-대-종횡비 같은 번역된 기하 힌트도 다시 매핑합니다. 실제로 지원되지 않는 재정의는 최선의 노력 방식으로 무시되고 tool 결과에 경고로 보고됩니다. 진짜 기능 한계(예: 참조 입력이 너무 많음)는 제출 전에 실패합니다.

tool 결과는 적용된 설정을 보고합니다. OpenClaw가 provider 폴백 중 길이나 기하를 다시 매핑할 때, 반환되는 `durationSeconds`, `size`, `aspectRatio`, `resolution` 값은 실제 제출된 값을 반영하고, `details.normalization`은 요청값에서 적용값으로의 변환을 담습니다.

참조 입력은 런타임 모드도 선택합니다:

- 참조 미디어 없음: `generate`
- 이미지 참조가 하나라도 있음: `imageToVideo`
- 비디오 참조가 하나라도 있음: `videoToVideo`

이미지와 비디오 참조를 섞는 것은 안정적인 공유 기능 표면이 아닙니다. 요청당 하나의 참조 유형만 사용하는 것을 권장합니다.

## 액션

- **generate** (기본값) -- 주어진 프롬프트와 선택적 참조 입력으로 비디오를 생성합니다.
- **status** -- 새 생성을 시작하지 않고 현재 세션의 진행 중인 비디오 작업 상태를 확인합니다.
- **list** -- 사용 가능한 provider, 모델, 그리고 각 기능을 표시합니다.

## 모델 선택

비디오를 생성할 때 OpenClaw는 다음 순서로 모델을 해석합니다:

1. **`model` tool 매개변수** -- 에이전트가 호출 시 지정한 경우
2. 설정의 **`videoGenerationModel.primary`**
3. 설정의 **`videoGenerationModel.fallbacks`** -- 순서대로 시도
4. **자동 감지** -- 유효한 인증이 있는 provider를 사용하며, 현재 기본 provider부터 시작한 뒤 남은 provider를 알파벳순으로 시도합니다.

provider가 실패하면 다음 후보가 자동으로 시도됩니다. 모든 후보가 실패하면, 오류에는 각 시도에서의 세부 정보가 포함됩니다.

비디오 생성이 명시적인 `model`, `primary`, `fallbacks` 항목만 사용하도록 하려면 `agents.defaults.mediaGenerationAutoProviderFallback: false`를 설정하세요.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

fal의 HeyGen 비디오 에이전트는 다음과 같이 고정할 수 있습니다:

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

fal의 Seedance 2.0은 다음과 같이 고정할 수 있습니다:

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

## provider 참고 사항

| Provider | 참고 사항 |
| -------- | --------- |
| Alibaba  | DashScope/Model Studio 비동기 엔드포인트를 사용합니다. 참조 이미지와 비디오는 원격 `http(s)` URL이어야 합니다. |
| BytePlus | 단일 이미지 참조만 지원합니다. |
| ComfyUI  | workflow 기반 로컬 또는 클라우드 실행입니다. 구성된 그래프를 통해 텍스트-비디오와 이미지-비디오를 지원합니다. |
| fal      | 장시간 실행 작업에 큐 기반 흐름을 사용합니다. 단일 이미지 참조만 지원합니다. HeyGen 비디오 에이전트와 Seedance 2.0 텍스트-비디오 및 이미지-비디오 모델 ref를 포함합니다. |
| Google   | Gemini/Veo를 사용합니다. 하나의 이미지 또는 하나의 비디오 참조를 지원합니다. |
| MiniMax  | 단일 이미지 참조만 지원합니다. |
| OpenAI   | `size` 재정의만 전달됩니다. 다른 스타일 재정의(`aspectRatio`, `resolution`, `audio`, `watermark`)는 경고와 함께 무시됩니다. |
| Qwen     | Alibaba와 동일한 DashScope 백엔드를 사용합니다. 참조 입력은 원격 `http(s)` URL이어야 하며, 로컬 파일은 사전에 거부됩니다. |
| Runway   | data URI를 통해 로컬 파일을 지원합니다. 비디오-비디오는 `runway/gen4_aleph`가 필요합니다. 텍스트 전용 실행은 `16:9`와 `9:16` 종횡비를 노출합니다. |
| Together | 단일 이미지 참조만 지원합니다. |
| Vydra    | 인증이 누락되는 리다이렉트를 피하기 위해 `https://www.vydra.ai/api/v1`를 직접 사용합니다. `veo3`는 텍스트-비디오 전용으로 번들되며, `kling`은 원격 이미지 URL이 필요합니다. |
| xAI      | 텍스트-비디오, 이미지-비디오, 원격 비디오 편집/확장 흐름을 지원합니다. |

## provider 기능 모드

이제 공유 비디오 생성 계약은 provider가 평면적인 집계 한도만이 아니라 모드별 기능을 선언할 수 있게 합니다. 새로운 provider 구현은 명시적인 모드 블록을 우선 사용해야 합니다:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

`maxInputImages`와 `maxInputVideos` 같은 평면 집계 필드는 transform 모드 지원을 알리기에 충분하지 않습니다. provider는 `generate`, `imageToVideo`, `videoToVideo`를 명시적으로 선언해야 라이브 테스트, 계약 테스트, 그리고 공유 `video_generate` tool이 모드 지원을 결정적으로 검증할 수 있습니다.

## 라이브 테스트

공유 번들 provider에 대한 선택형 라이브 커버리지:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

리포지토리 래퍼:

```bash
pnpm test:live:media video
```

이 라이브 파일은 `~/.profile`에서 누락된 provider env var를 로드하고, 기본적으로 저장된 인증 프로필보다 라이브/env API 키를 우선하며, 로컬 미디어로 안전하게 실행할 수 있는 선언된 모드를 실행합니다:

- 스윕 내 모든 provider에 대한 `generate`
- `capabilities.imageToVideo.enabled`일 때 `imageToVideo`
- `capabilities.videoToVideo.enabled`이고 provider/모델이 공유 스윕에서 버퍼 기반 로컬 비디오 입력을 받을 수 있을 때 `videoToVideo`

현재 공유 `videoToVideo` 라이브 레인은 다음을 커버합니다:

- `runway/gen4_aleph`를 선택했을 때의 `runway`만

## 구성

OpenClaw 설정에서 기본 비디오 생성 모델을 설정하세요:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

또는 CLI를 통해:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 관련 문서

- [도구 개요](/ko/tools)
- [백그라운드 작업](/ko/automation/tasks) -- 비동기 비디오 생성을 위한 작업 추적
- [Alibaba Model Studio](/ko/providers/alibaba)
- [BytePlus](/ko/concepts/model-providers#byteplus-international)
- [ComfyUI](/ko/providers/comfy)
- [fal](/ko/providers/fal)
- [Google (Gemini)](/ko/providers/google)
- [MiniMax](/ko/providers/minimax)
- [OpenAI](/ko/providers/openai)
- [Qwen](/ko/providers/qwen)
- [Runway](/ko/providers/runway)
- [Together AI](/ko/providers/together)
- [Vydra](/ko/providers/vydra)
- [xAI](/ko/providers/xai)
- [설정 참조](/ko/gateway/configuration-reference#agent-defaults)
- [모델](/ko/concepts/models)
