---
read_when:
    - 에이전트를 통해 동영상 생성하기
    - 동영상 생성 제공자 및 모델 구성
    - video_generate 도구 매개변수 이해하기
sidebarTitle: Video generation
summary: 16개의 제공자 백엔드 전반에서 텍스트, 이미지 또는 비디오 참조를 통해 video_generate로 비디오 생성
title: 동영상 생성
x-i18n:
    generated_at: "2026-05-05T01:50:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6edce39c3006b748d512fec935b81566ae1a121c280248e9e9439edd1f052d83
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw 에이전트는 텍스트 프롬프트, 참조 이미지 또는
기존 동영상으로 동영상을 생성할 수 있습니다. 16개의 제공자 백엔드가
지원되며, 각 백엔드는 서로 다른 모델 옵션, 입력 모드, 기능 세트를
제공합니다. 에이전트는 구성과 사용 가능한 API 키를 기준으로
적절한 제공자를 자동으로 선택합니다.

<Note>
`video_generate` 도구는 하나 이상의 동영상 생성 제공자를
사용할 수 있을 때만 표시됩니다. 에이전트 도구에 보이지 않는다면
제공자 API 키를 설정하거나 `agents.defaults.videoGenerationModel`을 구성하세요.
</Note>

OpenClaw는 동영상 생성을 세 가지 런타임 모드로 처리합니다.

- `generate` — 참조 미디어가 없는 텍스트-동영상 요청입니다.
- `imageToVideo` — 요청에 하나 이상의 참조 이미지가 포함됩니다.
- `videoToVideo` — 요청에 하나 이상의 참조 동영상이 포함됩니다.

제공자는 이러한 모드 중 임의의 하위 집합을 지원할 수 있습니다. 도구는
제출 전에 활성 모드를 검증하고 `action=list`에서 지원되는 모드를 보고합니다.

## 빠른 시작

<Steps>
  <Step title="인증 구성">
    지원되는 제공자 중 하나에 대한 API 키를 설정합니다.

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="기본 모델 선택(선택 사항)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="에이전트에 요청">
    > 노을 속에서 친근한 바닷가재가 서핑하는 5초짜리 영화 같은 동영상을 생성해 주세요.

    에이전트가 `video_generate`를 자동으로 호출합니다. 도구 허용 목록 지정은
    필요하지 않습니다.

  </Step>
</Steps>

## 비동기 생성 작동 방식

동영상 생성은 비동기 방식입니다. 에이전트가 세션에서 `video_generate`를
호출하면 다음과 같이 진행됩니다.

1. OpenClaw가 요청을 제공자에 제출하고 즉시 작업 ID를 반환합니다.
2. 제공자는 백그라운드에서 작업을 처리합니다(일반적으로 제공자와 해상도에 따라 30초에서 5분).
3. 동영상이 준비되면 OpenClaw가 내부 완료 이벤트로 동일한 세션을 깨웁니다.
4. 에이전트가 사용자에게 알리고 완성된 동영상을 첨부합니다. 메시지 도구로만
   보이는 전달 방식을 사용하는 그룹/채널 채팅에서는 OpenClaw가 직접 게시하는 대신
   에이전트가 메시지 도구를 통해 결과를 전달합니다.

작업이 진행 중일 때 같은 세션에서 중복 `video_generate` 호출이 발생하면
다른 생성을 시작하는 대신 현재 작업 상태를 반환합니다. CLI에서 진행 상황을
확인하려면 `openclaw tasks list` 또는 `openclaw tasks show <taskId>`를 사용하세요.

세션 기반 에이전트 실행 외부(예: 직접 도구 호출)에서는
도구가 인라인 생성으로 대체되고 같은 턴에 최종 미디어 경로를
반환합니다.

생성된 동영상 파일은 제공자가 바이트를 반환할 때 OpenClaw 관리 미디어 저장소에
저장됩니다. 기본 생성 동영상 저장 한도는 동영상 미디어 제한을 따르며,
`agents.defaults.mediaMaxMb`는 더 큰 렌더링을 위해 이 한도를 높입니다.
제공자가 호스팅된 출력 URL도 반환하는 경우, 로컬 영속 저장이
과도하게 큰 파일을 거부하더라도 OpenClaw는 작업을 실패시키는 대신
해당 URL을 전달할 수 있습니다.

### 작업 수명 주기

| 상태        | 의미                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------- |
| `queued`    | 작업이 생성되었고 제공자가 수락하기를 기다리는 중입니다.                                    |
| `running`   | 제공자가 처리 중입니다(일반적으로 제공자와 해상도에 따라 30초에서 5분).                    |
| `succeeded` | 동영상이 준비되었습니다. 에이전트가 깨어나 대화에 게시합니다.                              |
| `failed`    | 제공자 오류 또는 제한 시간 초과입니다. 에이전트가 오류 세부 정보와 함께 깨어납니다.        |

CLI에서 상태를 확인합니다.

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

현재 세션에 대해 동영상 작업이 이미 `queued` 또는 `running` 상태라면
`video_generate`는 새 작업을 시작하는 대신 기존 작업 상태를 반환합니다.
새 생성을 트리거하지 않고 명시적으로 확인하려면 `action: "status"`를 사용하세요.

## 지원되는 제공자

| 제공자                | 기본 모델                       | 텍스트 | 이미지 참조                                           | 동영상 참조                                      | 인증                                     |
| --------------------- | ------------------------------- | :----: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |   ✓    | 예(원격 URL)                                         | 예(원격 URL)                                    | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |   ✓    | 최대 2개 이미지(I2V 모델만 해당, 첫 프레임 + 마지막 프레임) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |   ✓    | 최대 2개 이미지(역할을 통한 첫 프레임 + 마지막 프레임) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |   ✓    | 최대 9개 참조 이미지                                  | 최대 3개 동영상                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |   ✓    | 이미지 1개                                           | —                                               | `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |   ✓    | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |   ✓    | 이미지 1개, Seedance reference-to-video에서는 최대 9개 | Seedance reference-to-video에서는 최대 3개 동영상 | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |   ✓    | 이미지 1개                                           | 동영상 1개                                      | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |   ✓    | 이미지 1개                                           | —                                               | `MINIMAX_API_KEY` 또는 MiniMax OAuth     |
| OpenAI                | `sora-2`                        |   ✓    | 이미지 1개                                           | 동영상 1개                                      | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |   ✓    | 최대 4개 이미지(첫/마지막 프레임 또는 참조)           | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |   ✓    | 예(원격 URL)                                         | 예(원격 URL)                                    | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |   ✓    | 이미지 1개                                           | 동영상 1개                                      | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |   ✓    | 이미지 1개                                           | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |   ✓    | 이미지 1개(`kling`)                                  | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |   ✓    | 첫 프레임 이미지 1개 또는 최대 7개의 `reference_image` | 동영상 1개                                      | `XAI_API_KEY`                            |

일부 제공자는 추가 또는 대체 API 키 환경 변수를 허용합니다. 자세한 내용은
개별 [제공자 페이지](#related)를 참조하세요.

런타임에 사용 가능한 제공자, 모델, 런타임 모드를 확인하려면
`video_generate action=list`를 실행하세요.

### 기능 매트릭스

`video_generate`, 계약 테스트, 공유 라이브 스윕에서 사용하는
명시적 모드 계약입니다.

| 제공자     | `generate` | `imageToVideo` | `videoToVideo` | 현재 공유 라이브 레인                                                                                                                     |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 이 제공자는 원격 `http(s)` 동영상 URL이 필요하므로 `videoToVideo`는 건너뜀                                  |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | 공유 스윕에 포함되지 않음. 워크플로별 커버리지는 Comfy 테스트에 있음                                                                      |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; 기본 DeepInfra 동영상 스키마는 번들 계약에서 텍스트-동영상 방식임                                                            |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo`는 Seedance reference-to-video를 사용할 때만 해당                                              |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 현재 버퍼 기반 Gemini/Veo 스윕이 해당 입력을 허용하지 않으므로 공유 `videoToVideo`는 건너뜀                 |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 현재 이 조직/입력 경로에는 제공자 측 inpaint/remix 접근 권한이 필요하므로 공유 `videoToVideo`는 건너뜀       |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 이 제공자는 원격 `http(s)` 동영상 URL이 필요하므로 `videoToVideo`는 건너뜀                                  |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo`는 선택한 모델이 `runway/gen4_aleph`일 때만 실행됨                                            |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; 번들된 `veo3`는 텍스트 전용이고 번들된 `kling`에는 원격 이미지 URL이 필요하므로 공유 `imageToVideo`는 건너뜀                |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 이 제공자는 현재 원격 MP4 URL이 필요하므로 `videoToVideo`는 건너뜀                                          |

## 도구 매개변수

### 필수

<ParamField path="prompt" type="string" required>
  생성할 동영상의 텍스트 설명입니다. `action: "generate"`에 필요합니다.
</ParamField>

### 콘텐츠 입력

<ParamField path="image" type="string">단일 참조 이미지(경로 또는 URL).</ParamField>
<ParamField path="images" type="string[]">여러 참조 이미지(최대 9개).</ParamField>
<ParamField path="imageRoles" type="string[]">
결합된 이미지 목록과 병렬로 사용하는 선택적 위치별 역할 힌트입니다.
표준 값: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">단일 참조 비디오(경로 또는 URL).</ParamField>
<ParamField path="videos" type="string[]">여러 참조 비디오(최대 4개).</ParamField>
<ParamField path="videoRoles" type="string[]">
결합된 비디오 목록과 병렬로 사용하는 선택적 위치별 역할 힌트입니다.
표준 값: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
단일 참조 오디오(경로 또는 URL). 공급자가 오디오 입력을 지원할 때 배경 음악 또는 음성
참조에 사용됩니다.
</ParamField>
<ParamField path="audioRefs" type="string[]">여러 참조 오디오(최대 3개).</ParamField>
<ParamField path="audioRoles" type="string[]">
결합된 오디오 목록과 병렬로 사용하는 선택적 위치별 역할 힌트입니다.
표준 값: `reference_audio`.
</ParamField>

<Note>
역할 힌트는 공급자에 그대로 전달됩니다. 표준 값은
`VideoGenerationAssetRole` 유니언에서 나오지만 공급자가 추가
역할 문자열을 허용할 수도 있습니다. `*Roles` 배열에는 해당
참조 목록보다 많은 항목이 있으면 안 됩니다. 하나 차이 오류는 명확한 오류로 실패합니다.
슬롯을 설정하지 않으려면 빈 문자열을 사용하세요. xAI의 경우 모든 이미지 역할을
`reference_image`로 설정하여 `reference_images` 생성 모드를 사용하세요. 단일 이미지
이미지-비디오 변환에는 역할을 생략하거나 `first_frame`을 사용하세요.
</Note>

### 스타일 제어

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` 또는 `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P` 또는 `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  목표 길이(초)(가장 가까운 공급자 지원 값으로 반올림).
</ParamField>
<ParamField path="size" type="string">공급자가 지원할 때의 크기 힌트입니다.</ParamField>
<ParamField path="audio" type="boolean">
  지원되는 경우 출력에서 생성된 오디오를 활성화합니다. `audioRef*`(입력)와는 다릅니다.
</ParamField>
<ParamField path="watermark" type="boolean">지원되는 경우 공급자 워터마킹을 전환합니다.</ParamField>

`adaptive`는 공급자별 센티널입니다. 기능에서 `adaptive`를 선언한
공급자(예: BytePlus Seedance는 입력 이미지 치수에서 비율을 자동 감지하는 데 사용)에
그대로 전달됩니다. 이를 선언하지 않은 공급자는 도구 결과의
`details.ignoredOverrides`를 통해 해당 값을 표시하므로 누락이 보입니다.

### 고급

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"`는 현재 세션 작업을 반환하고, `"list"`는 공급자를 검사합니다.
</ParamField>
<ParamField path="model" type="string">공급자/모델 재정의(예: `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">출력 파일 이름 힌트.</ParamField>
<ParamField path="timeoutMs" type="number">선택적 공급자 요청 제한 시간(밀리초).</ParamField>
<ParamField path="providerOptions" type="object">
  JSON 객체 형태의 공급자별 옵션(예: `{"seed": 42, "draft": true}`).
  형식화된 스키마를 선언한 공급자는 키와 형식을 검증합니다. 알 수 없는
  키 또는 불일치는 폴백 중 해당 후보를 건너뜁니다. 선언된 스키마가 없는 공급자는
  옵션을 그대로 받습니다. 각 공급자가 허용하는 항목을 보려면 `video_generate action=list`를
  실행하세요.
</ParamField>

<Note>
모든 공급자가 모든 매개변수를 지원하지는 않습니다. OpenClaw는 길이를
가장 가까운 공급자 지원 값으로 정규화하고, 폴백 공급자가 다른
제어 표면을 노출할 때 크기-종횡비 같은 변환된 기하 힌트를 다시 매핑합니다.
실제로 지원되지 않는 재정의는 최선 노력 방식으로 무시되고
도구 결과에 경고로 보고됩니다. 참조 입력이 너무 많은 경우 같은 엄격한 기능 제한은
제출 전에 실패합니다. 도구 결과는 적용된 설정을 보고하며,
`details.normalization`은 요청 값에서 적용 값으로의 변환을 캡처합니다.
</Note>

참조 입력은 런타임 모드를 선택합니다.

- 참조 미디어 없음 → `generate`
- 이미지 참조 있음 → `imageToVideo`
- 비디오 참조 있음 → `videoToVideo`
- 참조 오디오 입력은 확인된 모드를 변경하지 **않습니다**. 이미지/비디오 참조가 선택한
  모드 위에 적용되며, `maxInputAudios`를 선언한 공급자에서만 작동합니다.

이미지와 비디오 참조를 혼합하는 것은 안정적인 공통 기능 표면이 아닙니다.
요청당 하나의 참조 유형을 사용하는 것을 권장합니다.

#### 폴백 및 형식화된 옵션

일부 기능 검사는 도구 경계가 아니라 폴백 계층에서 적용되므로,
기본 공급자의 제한을 초과하는 요청도 기능을 갖춘 폴백에서
계속 실행될 수 있습니다.

- 활성 후보가 `maxInputAudios`를 선언하지 않았거나 `0`으로 선언한 경우,
  요청에 오디오 참조가 포함되어 있으면 건너뛰고 다음 후보를 시도합니다.
- 활성 후보의 `maxDurationSeconds`가 요청한 `durationSeconds`보다 낮고
  선언된 `supportedDurationSeconds` 목록이 없으면 건너뜁니다.
- 요청에 `providerOptions`가 포함되어 있고 활성 후보가 형식화된 `providerOptions` 스키마를
  명시적으로 선언한 경우, 제공된 키가 스키마에 없거나 값 형식이 일치하지 않으면
  건너뜁니다. 선언된 스키마가 없는 공급자는 옵션을 그대로 받습니다(하위 호환
  패스스루). 공급자는 빈 스키마(`capabilities.providerOptions: {}`)를
  선언하여 모든 공급자 옵션을 거부할 수 있으며, 이 경우 형식 불일치와 동일하게
  건너뜁니다.

요청에서 첫 번째 건너뛰기 이유는 `warn`에 기록되어 운영자가 기본 공급자가
넘어갔음을 볼 수 있습니다. 이후의 건너뛰기는 긴 폴백 체인이 조용히 유지되도록
`debug`에 기록됩니다. 모든 후보를 건너뛰면 집계된 오류에 각 후보의 건너뛰기 이유가
포함됩니다.

## 작업

| 작업       | 수행 내용                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 기본값. 지정된 프롬프트와 선택적 참조 입력으로 비디오를 만듭니다.                                       |
| `status`   | 다른 생성을 시작하지 않고 현재 세션의 진행 중인 비디오 작업 상태를 확인합니다.                           |
| `list`     | 사용 가능한 공급자, 모델, 해당 기능을 표시합니다.                                                       |

## 모델 선택

OpenClaw는 다음 순서로 모델을 확인합니다.

1. **`model` 도구 매개변수** — 에이전트가 호출에서 지정한 경우.
2. 구성의 **`videoGenerationModel.primary`**.
3. 순서대로 **`videoGenerationModel.fallbacks`**.
4. **자동 감지** — 유효한 인증이 있는 공급자. 현재 기본 공급자부터 시작한 다음
   나머지 공급자를 알파벳순으로 시도합니다.

공급자가 실패하면 다음 후보를 자동으로 시도합니다. 모든 후보가 실패하면
오류에 각 시도의 세부 정보가 포함됩니다.

명시적 `model`, `primary`, `fallbacks` 항목만 사용하려면
`agents.defaults.mediaGenerationAutoProviderFallback: false`를 설정하세요.

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

## 공급자 참고 사항

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope / Model Studio 비동기 엔드포인트를 사용합니다. 참조 이미지와
    비디오는 원격 `http(s)` URL이어야 합니다.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    공급자 ID: `byteplus`.

    모델: `seedance-1-0-pro-250528`(기본값),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V 모델(`*-t2v-*`)은 이미지 입력을 허용하지 않습니다. I2V 모델과
    일반 `*-pro-*` 모델은 단일 참조 이미지(첫 프레임)를 지원합니다.
    이미지를 위치 인수로 전달하거나 `role: "first_frame"`을 설정하세요.
    이미지가 제공되면 T2V 모델 ID는 해당 I2V 변형으로 자동 전환됩니다.

    지원되는 `providerOptions` 키: `seed`(숫자), `draft`(불리언 —
    480p 강제), `camera_fixed`(불리언).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin이 필요합니다. 공급자 ID: `byteplus-seedance15`. 모델:
    `seedance-1-5-pro-251215`.

    통합 `content[]` API를 사용합니다. 최대 2개의 입력 이미지
    (`first_frame` + `last_frame`)를 지원합니다. 모든 입력은 원격 `https://`
    URL이어야 합니다. 각 이미지에 `role: "first_frame"` / `"last_frame"`을 설정하거나
    이미지를 위치 인수로 전달하세요.

    `aspectRatio: "adaptive"`는 입력 이미지에서 비율을 자동 감지합니다.
    `audio: true`는 `generate_audio`에 매핑됩니다. `providerOptions.seed`
    (숫자)가 전달됩니다.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin이 필요합니다. 공급자 ID: `byteplus-seedance2`. 모델:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    통합 `content[]` API를 사용합니다. 최대 9개의 참조 이미지,
    3개의 참조 비디오, 3개의 참조 오디오를 지원합니다. 모든 입력은 원격
    `https://` URL이어야 합니다. 각 자산에 `role`을 설정하세요. 지원 값:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"`는 입력 이미지에서 비율을 자동 감지합니다.
    `audio: true`는 `generate_audio`에 매핑됩니다. `providerOptions.seed`
    (숫자)가 전달됩니다.

  </Accordion>
  <Accordion title="ComfyUI">
    워크플로 기반의 로컬 또는 클라우드 실행입니다. 구성된 그래프를 통해 텍스트-비디오 및
    이미지-비디오를 지원합니다.
  </Accordion>
  <Accordion title="fal">
    장시간 실행 작업에 큐 기반 흐름을 사용합니다. 대부분의 fal 비디오 모델은
    단일 이미지 참조를 허용합니다. Seedance 2.0 참조-비디오 모델은
    최대 9개의 이미지, 3개의 비디오, 3개의 오디오 참조를 허용하며,
    총 참조 파일은 최대 12개입니다.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    하나의 이미지 또는 하나의 비디오 참조를 지원합니다.
  </Accordion>
  <Accordion title="MiniMax">
    단일 이미지 참조만 지원합니다.
  </Accordion>
  <Accordion title="OpenAI">
    `size` 재정의만 전달됩니다. 기타 스타일 재정의
    (`aspectRatio`, `resolution`, `audio`, `watermark`)는 경고와 함께 무시됩니다.
  </Accordion>
  <Accordion title="OpenRouter">
    OpenRouter의 비동기 `/videos` API를 사용합니다. OpenClaw는
    작업을 제출하고, `polling_url`을 폴링한 다음, `unsigned_urls` 또는
    문서화된 작업 콘텐츠 엔드포인트를 다운로드합니다. 번들된 `google/veo-3.1-fast` 기본값은
    4/6/8초 길이, `720P`/`1080P` 해상도, `16:9`/`9:16` 종횡비를
    광고합니다.
  </Accordion>
  <Accordion title="Qwen">
    Alibaba와 동일한 DashScope 백엔드를 사용합니다. 참조 입력은 원격
    `http(s)` URL이어야 하며, 로컬 파일은 사전에 거부됩니다.
  </Accordion>
  <Accordion title="Runway">
    데이터 URI를 통해 로컬 파일을 지원합니다. 비디오-비디오에는
    `runway/gen4_aleph`가 필요합니다. 텍스트 전용 실행은 `16:9` 및 `9:16` 종횡비를
    노출합니다.
  </Accordion>
  <Accordion title="Together">
    단일 이미지 참조만 지원합니다.
  </Accordion>
  <Accordion title="Vydra">
    인증이 누락되는 리디렉션을 피하기 위해 `https://www.vydra.ai/api/v1`을 직접 사용합니다.
    `veo3`는 텍스트-비디오 전용으로 번들되어 있으며, `kling`에는
    원격 이미지 URL이 필요합니다.
  </Accordion>
  <Accordion title="xAI">
    텍스트-비디오, 단일 첫 프레임 이미지-비디오, xAI `reference_images`를 통한 최대 7개의
    `reference_image` 입력, 원격 비디오 편집/확장 흐름을 지원합니다.
  </Accordion>
</AccordionGroup>

## 공급자 기능 모드

공유 동영상 생성 계약은 평면적인 집계 제한만이 아니라 모드별 기능을 지원합니다. 새 provider 구현은 명시적인 모드 블록을 우선 사용해야 합니다.

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
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
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

`maxInputImages` 및 `maxInputVideos` 같은 평면 집계 필드는 변환 모드 지원을 알리기에 **충분하지 않습니다**. provider는 `generate`, `imageToVideo`, `videoToVideo`를 명시적으로 선언해야 라이브 테스트, 계약 테스트, 공유 `video_generate` 도구가 모드 지원을 결정적으로 검증할 수 있습니다.

provider의 한 모델이 나머지보다 더 넓은 참조 입력 지원을 제공하는 경우, 모드 전체 제한을 올리는 대신 `maxInputImagesByModel`, `maxInputVideosByModel`, 또는 `maxInputAudiosByModel`을 사용하세요.

## 라이브 테스트

공유 번들 provider에 대한 선택적 라이브 커버리지:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

리포지토리 래퍼:

```bash
pnpm test:live:media video
```

이 라이브 파일은 누락된 provider 환경 변수를 `~/.profile`에서 로드하고, 기본적으로 저장된 인증 프로필보다 라이브/환경 API 키를 우선 사용하며, 기본적으로 릴리스에 안전한 스모크 테스트를 실행합니다.

- 스윕의 모든 비 FAL provider에 대해 `generate`.
- 1초짜리 랍스터 프롬프트.
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`의 provider별 작업 제한(기본값 `180000`).

FAL은 provider 측 큐 지연 시간이 릴리스 시간을 지배할 수 있으므로 선택 사항입니다.

```bash
pnpm test:live:media video --video-providers fal
```

`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`을 설정하면 공유 스윕이 로컬 미디어로 안전하게 실행할 수 있는 선언된 변환 모드도 실행합니다.

- `capabilities.imageToVideo.enabled`인 경우 `imageToVideo`.
- `capabilities.videoToVideo.enabled`이고 provider/model이 공유 스윕에서 버퍼 기반 로컬 동영상 입력을 허용하는 경우 `videoToVideo`.

현재 공유 `videoToVideo` 라이브 레인은 `runway/gen4_aleph`를 선택한 경우에만 `runway`를 커버합니다.

## 구성

OpenClaw 구성에서 기본 동영상 생성 모델을 설정하세요.

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

또는 CLI를 통해 설정하세요.

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 관련

- [Alibaba Model Studio](/ko/providers/alibaba)
- [백그라운드 작업](/ko/automation/tasks) — 비동기 동영상 생성의 작업 추적
- [BytePlus](/ko/concepts/model-providers#byteplus-international)
- [ComfyUI](/ko/providers/comfy)
- [구성 참조](/ko/gateway/config-agents#agent-defaults)
- [fal](/ko/providers/fal)
- [Google (Gemini)](/ko/providers/google)
- [MiniMax](/ko/providers/minimax)
- [모델](/ko/concepts/models)
- [OpenAI](/ko/providers/openai)
- [Qwen](/ko/providers/qwen)
- [Runway](/ko/providers/runway)
- [Together AI](/ko/providers/together)
- [도구 개요](/ko/tools)
- [Vydra](/ko/providers/vydra)
- [xAI](/ko/providers/xai)
