---
read_when:
    - 에이전트를 통한 동영상 생성
    - 동영상 생성 제공자 및 모델 구성하기
    - video_generate 도구 매개변수 이해하기
sidebarTitle: Video generation
summary: 16개 제공자 백엔드에서 텍스트, 이미지 또는 동영상 참조를 사용해 video_generate로 동영상을 생성합니다.
title: 동영상 생성
x-i18n:
    generated_at: "2026-07-12T15:51:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw 에이전트는 `video_generate`를 통해 텍스트 프롬프트, 참조 이미지 또는
기존 동영상으로 동영상을 생성합니다. 16개의 제공자 백엔드를
지원하며, 에이전트는 구성과 사용 가능한 API 키를 기반으로 적절한 백엔드를 자동으로 선택합니다.

<Note>
`video_generate`는 동영상 생성 제공자를 하나 이상 사용할 수 있을 때만
표시됩니다. 에이전트 도구에 없다면 제공자 API 키를 설정하거나
`agents.defaults.videoGenerationModel`을 구성하십시오.
</Note>

`video_generate`에는 세 가지 런타임 모드가 있으며, 호출의 참조 입력에 따라
결정됩니다.

- `generate` - 참조 미디어 없음(텍스트를 동영상으로 변환).
- `imageToVideo` - 하나 이상의 참조 이미지.
- `videoToVideo` - 하나 이상의 참조 동영상.

제공자는 이러한 모드 중 일부만 지원할 수도 있습니다. 도구는 제출 전에
활성 모드를 검증하고 `action=list`에 지원되는 모드를 보고합니다.

## 빠른 시작

<Steps>
  <Step title="인증 구성">
    지원되는 제공자 중 하나의 API 키를 설정하십시오.

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="기본 모델 선택(선택 사항)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="에이전트에게 요청">
    > 해 질 무렵 서핑하는 친근한 바닷가재를 담은 5초 길이의 영화 같은 동영상을 생성해 주세요.

    에이전트가 `video_generate`를 자동으로 호출합니다. 도구 허용 목록은
    필요하지 않습니다.

  </Step>
</Steps>

## 비동기 생성 작동 방식

동영상 생성은 비동기 방식으로 이루어집니다.

1. OpenClaw가 제공자에게 요청을 제출하고 작업 ID를 즉시 반환합니다.
2. 제공자가 백그라운드에서 작업을 처리합니다(일반적으로 제공자와 해상도에 따라 30초에서 몇 분이 걸리며, 큐 기반의 느린 제공자는 구성된 제한 시간까지 실행될 수 있습니다).
3. 동영상이 준비되면 OpenClaw가 내부 완료 이벤트로 동일한 세션을 깨웁니다.
4. 에이전트는 세션의 일반적인 표시 응답 모드를 통해 이를 보고합니다.
   자동 최종 응답을 보내거나, 세션에 메시지 도구가 필요한 경우
   `message(action="send")`를 사용합니다. 요청자 세션이 비활성 상태이거나 세션 깨우기에 실패하고
   완료 응답에 생성된 미디어가 여전히 누락된 경우, OpenClaw는
   미디어와 함께 멱등성이 보장되는 직접 폴백을 전송합니다.

작업이 진행 중인 동안 동일한 세션에서 `video_generate`를 중복 호출하면
새 생성을 시작하는 대신 현재 작업 상태를 반환합니다.
새 생성을 트리거하지 않고 확인하려면 `action: "status"`를 사용하거나,
CLI에서 `openclaw tasks list` / `openclaw tasks show <lookup>`을 사용하십시오
([백그라운드 작업](/ko/automation/tasks) 참조).

세션 기반 에이전트 실행 외부(예: 직접 도구 호출)에서는
도구가 인라인 생성으로 폴백하고 동일한 턴에 최종 미디어 경로를
반환합니다.

제공자가 바이트를 반환하면 생성된 동영상 파일은 OpenClaw 관리 미디어 저장소에
저장됩니다. 기본 한도는 16MB(공유 동영상 미디어
한도)이며, 더 큰 렌더링에는 `agents.defaults.mediaMaxMb`를 높일 수 있습니다. 제공자가
호스팅된 출력 URL도 반환하는 경우 로컬 영속화에서 크기 초과 파일을 거부하더라도 OpenClaw는 작업을
실패시키는 대신 해당 URL을 전달합니다.

### 작업 수명 주기

| 상태        | 의미                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | 작업이 생성되었으며 제공자가 수락하기를 기다리고 있습니다.                                            |
| `running`   | 제공자가 처리 중입니다(일반적으로 제공자와 해상도에 따라 30초에서 몇 분이 걸립니다).                   |
| `succeeded` | 동영상이 준비되었습니다. 에이전트가 깨어나 대화에 게시합니다.                                         |
| `failed`    | 제공자 오류 또는 제한 시간 초과입니다. 에이전트가 오류 세부 정보와 함께 깨어납니다.                    |

CLI에서 상태를 확인하십시오.

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## 지원되는 제공자

| 제공자                | 기본 모델                       | 텍스트 | 이미지 참조                                           | 동영상 참조                                      | 인증                                     |
| --------------------- | ------------------------------- | :----: | ----------------------------------------------------- | ------------------------------------------------ | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |   ✓    | 예(원격 URL)                                          | 예(원격 URL)                                     | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |   ✓    | 최대 2개 이미지(I2V 모델만 해당, 첫 프레임 + 마지막 프레임) | -                                           | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |   ✓    | 최대 2개 이미지(역할을 통한 첫 프레임 + 마지막 프레임) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |   ✓    | 최대 9개 참조 이미지                                  | 최대 3개 동영상                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |   ✓    | 이미지 1개                                            | -                                               | `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |   ✓    | -                                                     | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |   ✓    | 이미지 1개, Seedance 참조-동영상 변환 사용 시 최대 9개 | Seedance 참조-동영상 변환 사용 시 최대 3개 동영상 | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |   ✓    | 이미지 1개                                            | 동영상 1개                                      | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |   ✓    | 이미지 1개                                            | -                                               | `MINIMAX_API_KEY` 또는 MiniMax OAuth     |
| OpenAI                | `sora-2`                        |   ✓    | 이미지 1개                                            | 동영상 1개                                      | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |   ✓    | 최대 4개 이미지(첫/마지막 프레임 또는 참조)           | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |   ✓    | 예(원격 URL)                                          | 예(원격 URL)                                    | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |   ✓    | 이미지 1개                                            | 동영상 1개                                      | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |   ✓    | `Wan-AI/Wan2.2-I2V-A14B`만 해당                       | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |   ✓    | 이미지 1개(`kling`)                                   | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |   ✓    | 클래식: 첫 프레임 1개 또는 참조 7개, 1.5: 프레임 1개  | 클래식: 동영상 1개                              | `XAI_API_KEY`                            |

일부 제공자는 추가 또는 대체 API 키 환경 변수를 허용합니다. 자세한 내용은
개별 [제공자 페이지](#related)를 참조하십시오.

런타임에 사용 가능한 제공자, 모델 및 런타임 모드를 확인하려면
`video_generate action=list`를 실행하십시오.

### 기능 매트릭스

`video_generate`, 계약 테스트 및 공유 라이브 스윕에서 사용하는
명시적 모드 계약은 다음과 같습니다.

| 제공자     | `generate` | `imageToVideo` | `videoToVideo` | 현재 공유 라이브 레인                                                                                                                    |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 이 제공자는 원격 `http(s)` 동영상 URL이 필요하므로 `videoToVideo`는 건너뜁니다.                               |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       -        | 공유 스윕에 포함되지 않으며, 워크플로별 검증 범위는 Comfy 테스트에 있습니다.                                                             |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; 네이티브 DeepInfra 동영상 스키마는 Plugin 계약에서 텍스트-동영상 변환입니다.                                                 |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo`는 Seedance 참조-동영상 변환을 사용할 때만 지원합니다.                                         |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 현재 버퍼 기반 Gemini/Veo 스윕은 해당 입력을 허용하지 않으므로 공유 `videoToVideo`는 건너뜁니다.              |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 현재 이 조직/입력 경로에는 제공자 측 동영상 편집 권한이 필요하므로 공유 `videoToVideo`는 건너뜁니다.          |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 이 제공자는 원격 `http(s)` 동영상 URL이 필요하므로 `videoToVideo`는 건너뜁니다.                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 선택한 모델이 `runway/gen4_aleph`인 경우에만 `videoToVideo`가 실행됩니다.                                    |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; 번들된 `veo3`는 텍스트 전용이고 번들된 `kling`에는 원격 이미지 URL이 필요하므로 공유 `imageToVideo`는 건너뜁니다.             |
| xAI        |     ✓      |       ✓        |       ✓        | 클래식은 모든 모드를 지원합니다. Video 1.5는 이미지-동영상 변환만 지원하며, 원격 MP4 입력으로 인해 `videoToVideo`는 공유 스윕에서 제외됩니다. |

## 도구 매개변수

### 필수

<ParamField path="prompt" type="string" required>
  생성할 동영상에 대한 텍스트 설명입니다. `action: "generate"`에 필수입니다.
</ParamField>

### 콘텐츠 입력

<ParamField path="image" type="string">단일 참조 이미지(경로 또는 URL)입니다.</ParamField>
<ParamField path="images" type="string[]">여러 참조 이미지(최대 9개)입니다.</ParamField>
<ParamField path="imageRoles" type="string[]">
결합된 이미지 목록과 위치별로 대응하는 선택적 역할 힌트입니다.
표준 값: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">단일 참조 동영상(경로 또는 URL)입니다.</ParamField>
<ParamField path="videos" type="string[]">여러 참조 동영상(최대 4개)입니다.</ParamField>
<ParamField path="videoRoles" type="string[]">
결합된 동영상 목록과 위치별로 대응하는 선택적 역할 힌트입니다.
표준 값: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
단일 참조 오디오(경로 또는 URL)입니다. 제공자가 오디오 입력을 지원할 때
배경 음악 또는 음성 참조로 사용됩니다.
</ParamField>
<ParamField path="audioRefs" type="string[]">여러 참조 오디오(최대 3개)입니다.</ParamField>
<ParamField path="audioRoles" type="string[]">
결합된 오디오 목록과 위치별로 대응하는 선택적 역할 힌트입니다.
표준 값: `reference_audio`.
</ParamField>

<Note>
역할 힌트는 그대로 제공자에게 전달됩니다. 표준 값은
`VideoGenerationAssetRole` 유니온에서 가져오지만, 제공자가 추가 역할
문자열을 허용할 수도 있습니다. `*Roles` 배열의 항목 수는 해당 참조
목록보다 많아서는 안 되며, 하나 차이 오류가 발생하면 명확한 오류와 함께 실패합니다.
슬롯을 설정하지 않으려면 빈 문자열을 사용하십시오. xAI에서
`reference_images` 생성 모드를 사용하려면 모든 이미지 역할을
`reference_image`로 설정하십시오. 단일 이미지의 이미지-동영상 변환에는
역할을 생략하거나 `first_frame`을 사용하십시오.
</Note>

### 스타일 제어

<ParamField path="aspectRatio" type="string">
  `1:1`, `16:9`, `9:16`, `adaptive` 또는 제공자별 값과 같은 종횡비 힌트입니다. OpenClaw는 제공자에 따라 지원되지 않는 값을 정규화하거나 무시합니다.
</ParamField>
<ParamField path="resolution" type="string">`360P`, `480P`, `540P`, `720P`, `768P`, `1080P`, `4K` 또는 제공자별 값과 같은 해상도 힌트입니다. OpenClaw는 제공자에 따라 지원되지 않는 값을 정규화하거나 무시합니다.</ParamField>
<ParamField path="durationSeconds" type="number">
  목표 재생 시간(초)입니다(제공자가 지원하는 가장 가까운 값으로 반올림됨).
</ParamField>
<ParamField path="size" type="string">제공자가 지원할 때 사용하는 크기 힌트입니다.</ParamField>
<ParamField path="audio" type="boolean">
  지원되는 경우 출력에서 생성 오디오를 활성화합니다. `audioRef*`(입력)와는 별개입니다.
</ParamField>
<ParamField path="watermark" type="boolean">지원되는 경우 제공자 워터마크 적용 여부를 전환합니다.</ParamField>

`adaptive`는 제공자별 센티널입니다. 기능에 `adaptive`를 선언한
제공자에게 그대로 전달됩니다(예: BytePlus Seedance는 입력 이미지
크기에서 비율을 자동 감지하는 데 사용합니다). 이를 선언하지 않은 제공자는
도구 결과의 `details.ignoredOverrides`를 통해 값을 표시하므로 값이
제외되었음을 확인할 수 있습니다.

### 고급

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"`는 현재 세션 작업을 반환하고, `"list"`는 제공자를 조회합니다.
</ParamField>
<ParamField path="model" type="string">제공자/모델 재정의입니다(예: `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">출력 파일 이름 힌트입니다.</ParamField>
<ParamField path="timeoutMs" type="number">선택적 제공자 작업 제한 시간(밀리초)입니다. 생략하면 OpenClaw는 구성된 경우 `agents.defaults.videoGenerationModel.timeoutMs`를 사용하고, 그렇지 않으면 Plugin에서 작성한 제공자 기본값이 있을 때 이를 사용합니다.</ParamField>
<ParamField path="providerOptions" type="object">
  JSON 객체 형식의 제공자별 옵션입니다(예: `{"seed": 42, "draft": true}`).
  형식화된 스키마를 선언한 제공자는 키와 유형을 검증하며, 알 수 없는
  키나 불일치가 있으면 폴백 중 해당 후보를 건너뜁니다. 선언된 스키마가
  없는 제공자는 옵션을 그대로 받습니다. 각 제공자가 허용하는 항목을
  확인하려면 `video_generate action=list`를 실행하십시오.
</ParamField>

<Note>
모든 제공자가 모든 매개변수를 지원하지는 않습니다. OpenClaw는 재생 시간을
제공자가 지원하는 가장 가까운 값으로 정규화하며, 폴백 제공자가 다른
제어 인터페이스를 제공하는 경우 크기-종횡비와 같이 변환된 기하학 힌트를
다시 매핑합니다. 실제로 지원되지 않는 재정의는 최선의 방식으로 무시되며
도구 결과에 경고로 보고됩니다. 하드 기능 제한(예: 참조 입력이 너무 많음)은
제출 전에 실패합니다. 도구 결과는 적용된 설정을 보고하며,
`details.normalization`에는 요청값에서 적용값으로의 모든 변환이 기록됩니다.
</Note>

참조 입력에 따라 런타임 모드가 선택됩니다.

- 참조 미디어 없음 -> `generate`
- 이미지 참조가 하나라도 있음 -> `imageToVideo`
- 동영상 참조가 하나라도 있음 -> `videoToVideo`
- 참조 오디오 입력은 확인된 모드를 **변경하지 않습니다**. 이미지/동영상
  참조가 선택한 모드에 추가로 적용되며, `maxInputAudios`를 선언한
  제공자에서만 작동합니다.

이미지와 동영상 참조의 혼합은 안정적인 공통 기능 인터페이스가 아닙니다.
요청마다 한 가지 참조 유형을 사용하는 것이 좋습니다.

#### 폴백 및 형식화된 옵션

일부 기능 검사는 도구 경계가 아닌 폴백 계층에서 적용되므로, 기본 제공자의
제한을 초과하는 요청도 해당 기능을 지원하는 폴백에서 실행될 수 있습니다.

- 요청에 오디오 참조가 있을 때 활성 후보가 `maxInputAudios`를 선언하지
  않았거나 `0`으로 선언했다면 해당 후보를 건너뛰고 다음 후보를 시도합니다.
  이미지 및 동영상 참조 수에도 `maxInputImages`/`maxInputVideos`를
  기준으로 동일한 보호 규칙이 적용됩니다.
- 활성 후보의 `maxDurationSeconds`가 요청된 `durationSeconds`보다 작고
  선언된 `supportedDurationSeconds` 목록이 없으면 건너뜁니다.
- 요청에 `providerOptions`가 있고 활성 후보가 형식화된 `providerOptions`
  스키마를 명시적으로 선언한 경우, 제공된 키가 스키마에 없거나 값 유형이
  일치하지 않으면 건너뜁니다. 선언된 스키마가 없는 제공자는 옵션을
  그대로 받습니다(이전 버전과 호환되는 그대로 전달 방식). 제공자는 빈
  스키마(`capabilities.providerOptions: {}`)를 선언하여 모든 제공자 옵션을
  사용하지 않도록 선택할 수 있으며, 이 경우 유형 불일치와 마찬가지로
  건너뜁니다.

요청에서 처음 발생한 건너뛰기 이유는 `warn` 수준으로 기록되어 운영자가
기본 제공자가 제외된 시점을 확인할 수 있습니다. 이후의 건너뛰기는 긴
폴백 체인의 로그가 과도해지지 않도록 `debug` 수준으로 기록됩니다. 모든
후보를 건너뛰면 집계된 오류에 각 후보의 건너뛰기 이유가 포함됩니다.

## 작업

| 작업       | 수행 내용                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 기본값입니다. 지정된 프롬프트와 선택적 참조 입력으로 동영상을 생성합니다.                               |
| `status`   | 다른 생성을 시작하지 않고 현재 세션에서 진행 중인 동영상 작업의 상태를 확인합니다.                      |
| `list`     | 사용 가능한 제공자, 모델 및 해당 기능을 표시합니다.                                                     |

## 모델 선택

OpenClaw는 다음 순서로 모델을 결정합니다.

1. **`model` 도구 매개변수** - 에이전트가 호출에서 지정한 경우입니다.
2. 구성의 **`videoGenerationModel.primary`**.
3. 순서대로 **`videoGenerationModel.fallbacks`**.
4. **자동 감지** - 유효한 인증이 있는 제공자를 현재 기본 제공자부터 시작하여
   나머지 제공자를 알파벳순으로 확인합니다.

제공자에서 실패하면 다음 후보를 자동으로 시도합니다. 모든 후보가
실패하면 오류에 각 시도의 세부 정보가 포함됩니다.

명시적인 `model`, `primary`, `fallbacks` 항목만 사용하려면
`agents.defaults.mediaGenerationAutoProviderFallback: false`로 설정하십시오.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // 선택적 도구별 제공자 요청 제한 시간 재정의
      },
    },
  },
}
```

## 제공자 참고 사항

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope / Model Studio 비동기 엔드포인트를 사용합니다. 참조 이미지와
    동영상은 원격 `http(s)` URL이어야 합니다.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    제공자 ID: `byteplus`.

    모델: `seedance-1-0-pro-250528`(기본값),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V 모델(`*-t2v-*`)은 이미지 입력을 허용하지 않습니다. I2V 모델과
    일반 `*-pro-*` 모델은 단일 참조 이미지(첫 프레임)를 지원합니다.
    이미지를 위치 인수로 전달하거나 `role: "first_frame"`을 설정하십시오.
    이미지가 제공되면 T2V 모델 ID는 해당 I2V 변형으로 자동 전환됩니다.

    지원되는 `providerOptions` 키: `seed`(숫자), `draft`(불리언 -
    480p로 강제), `camera_fixed`(불리언).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin이 필요합니다(외부 제공, 번들되지 않음). 제공자 ID: `byteplus-seedance15`. 모델:
    `seedance-1-5-pro-251215`.

    통합 `content[]` API를 사용합니다. 입력 이미지는 최대 2개
    (`first_frame` + `last_frame`)까지 지원합니다. 모든 입력은 원격
    `https://` URL이어야 합니다. 각 이미지에 `role: "first_frame"` /
    `"last_frame"`을 설정하거나 이미지를 위치 인수로 전달하십시오.

    `aspectRatio: "adaptive"`는 입력 이미지에서 비율을 자동으로 감지합니다.
    `audio: true`는 `generate_audio`에 매핑됩니다. `providerOptions.seed`
    (숫자)가 전달됩니다.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin이 필요합니다(외부 제공, 번들되지 않음). 제공자 ID: `byteplus-seedance2`. 모델:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    통합 `content[]` API를 사용합니다. 최대 9개의 참조 이미지,
    3개의 참조 동영상 및 3개의 참조 오디오를 지원합니다. 모든 입력은 원격
    `https://` URL이어야 합니다. 각 자산에 `role`을 설정하십시오. 지원되는 값:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"`는 입력 이미지에서 비율을 자동으로 감지합니다.
    `audio: true`는 `generate_audio`에 매핑됩니다. `providerOptions.seed`
    (숫자)가 전달됩니다.

  </Accordion>
  <Accordion title="ComfyUI">
    워크플로 기반으로 로컬 또는 클라우드에서 실행합니다. 구성된 그래프를 통해
    텍스트-비디오 및 이미지-비디오를 지원합니다.
  </Accordion>
  <Accordion title="fal">
    장시간 실행 작업에 큐 기반 흐름을 사용합니다. OpenClaw는 진행 중인 fal 큐 작업을
    시간 초과로 처리하기 전에 기본적으로 최대 20분 동안 기다립니다. 대부분의 fal 비디오 모델은
    단일 이미지 참조를 허용합니다. Seedance 2.0 참조-비디오
    모델은 최대 9개의 이미지, 3개의 비디오, 3개의 오디오 참조를 허용하며,
    전체 참조 파일은 최대 12개입니다.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    이미지 또는 비디오 참조 하나를 지원합니다. 현재 Veo 비디오 생성에서 해당 API가
    `generateAudio` 매개변수를 거부하므로, Gemini API 경로에서는 생성 오디오 요청이
    경고와 함께 무시됩니다.
  </Accordion>
  <Accordion title="MiniMax">
    단일 이미지 참조만 지원합니다. MiniMax는 `768P` 및 `1080P`
    해상도를 허용하며, `720P` 같은 요청은 제출 전에 가장 가까운
    지원 값으로 정규화됩니다.
  </Accordion>
  <Accordion title="OpenAI">
    `size` 재정의만 전달됩니다. 그 외 스타일 재정의
    (`aspectRatio`, `resolution`, `audio`, `watermark`)는 경고와 함께
    무시됩니다.
  </Accordion>
  <Accordion title="OpenRouter">
    OpenRouter의 비동기 `/videos` API를 사용합니다. OpenClaw는 작업을
    제출하고 `polling_url`을 폴링한 다음, `unsigned_urls` 또는 문서화된
    작업 콘텐츠 엔드포인트에서 다운로드합니다. 번들로 제공되는 기본 `google/veo-3.1-fast`는
    4/6/8초 길이, `720P`/`1080P` 해상도 및
    `16:9`/`9:16` 화면비를 제공합니다.
  </Accordion>
  <Accordion title="Qwen">
    Alibaba와 동일한 DashScope 백엔드를 사용합니다. 참조 입력은 원격
    `http(s)` URL이어야 하며, 로컬 파일은 사전에 거부됩니다.
  </Accordion>
  <Accordion title="Runway">
    데이터 URI를 통해 로컬 파일을 지원합니다. 비디오-비디오에는
    `runway/gen4_aleph`가 필요합니다. 텍스트 전용 실행에서는 `16:9` 및 `9:16`
    화면비를 제공합니다.
  </Accordion>
  <Accordion title="Together">
    단일 이미지 참조만 지원합니다.
  </Accordion>
  <Accordion title="Vydra">
    인증 정보가 누락되는 리디렉션을 피하기 위해 `https://www.vydra.ai/api/v1`을
    직접 사용합니다. `veo3`는 텍스트-비디오 전용으로 번들 제공되며, `kling`에는
    원격 이미지 URL이 필요합니다.
  </Accordion>
  <Accordion title="xAI">
    기본 `grok-imagine-video` 모델은 텍스트-비디오, 단일
    첫 프레임 이미지-비디오, xAI `reference_images`를 통한 최대 7개의
    `reference_image` 입력 및 원격 비디오 편집/연장 흐름을 지원합니다. 생성 해상도의
    기본값은 `480P`이며, 단일 이미지의 이미지-비디오에서는 `aspectRatio`를 생략하면
    원본 화면비를 상속합니다. 비디오 편집/연장은 입력 지오메트리를 상속하며
    화면비 또는 해상도 재정의를 허용하지 않습니다. 연장은 2-10초를
    허용합니다.

    `grok-imagine-video-1.5`는 이미지-비디오 전용이므로 이미지 하나만 정확히 제공하십시오.
    1-15초와 `480P`, `720P` 또는 `1080P`를 지원하며, 기본값은
    `480P`입니다. 원본 이미지 화면비를 상속하려면 `aspectRatio`를 생략하십시오. 미리보기
    및 날짜가 포함된 1.5 식별자에는 동일한 검증이 적용되며 변경 없이
    전달됩니다.

  </Accordion>
</AccordionGroup>

## 제공자 기능 모드

공유 비디오 생성 계약은 단순한 통합 제한 대신 모드별 기능을
지원합니다. 새로운 제공자 구현에서는 명시적인 모드 블록을
우선적으로 사용해야 합니다.

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

`maxInputImages` 및 `maxInputVideos` 같은 단순 통합 필드만으로는
변환 모드 지원을 알리기에 **충분하지 않습니다**. 라이브
테스트, 계약 테스트 및 공유 `video_generate` 도구가 모드 지원을
결정론적으로 검증할 수 있도록 제공자는 `generate`, `imageToVideo`,
`videoToVideo`를 명시적으로 선언해야 합니다.

제공자의 특정 모델 하나가 나머지 모델보다 더 많은 참조 입력을 지원하는 경우,
모드 전체 제한을 높이는 대신 `maxInputImagesByModel`, `maxInputVideosByModel` 또는
`maxInputAudiosByModel`을 사용하십시오.

## 라이브 테스트

공유 번들 제공자를 위한 선택적 라이브 테스트 범위:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

저장소 래퍼:

```bash
pnpm test:live:media video
```

이 라이브 파일은 기본적으로 저장된 인증 프로필보다 이미 내보낸 제공자 환경 변수를
우선 사용하며, 릴리스에 안전한 스모크 테스트를 기본적으로 실행합니다.

- 검사 대상의 FAL 외 모든 제공자에 대해 `generate`를 실행합니다.
- 1초 길이의 lobster 프롬프트를 사용합니다.
- 제공자별 작업 제한은
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`에서 가져옵니다(기본값 `180000`).

제공자 측 큐 지연이 릴리스 시간을 좌우할 수 있으므로 FAL은
선택적으로 실행합니다.

```bash
pnpm test:live:media video --video-providers fal
```

`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`을 설정하면 공유 검사가 로컬 미디어로
안전하게 실행할 수 있는 선언된 변환 모드도 실행합니다.

- `capabilities.imageToVideo.enabled`인 경우 `imageToVideo`를 실행합니다.
- `capabilities.videoToVideo.enabled`이고 제공자/모델이 공유
  검사에서 버퍼 기반 로컬 비디오 입력을 허용하는 경우 `videoToVideo`를
  실행합니다.

현재 공유 `videoToVideo` 라이브 실행 경로는 `runway/gen4_aleph`를 선택한 경우에만
`runway`를 다룹니다.

## 구성

OpenClaw 구성에서 기본 비디오 생성 모델을 설정하십시오.

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

또는 CLI를 사용하십시오.

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 관련 항목

- [Alibaba Model Studio](/ko/providers/alibaba)
- [백그라운드 작업](/ko/automation/tasks) - 비동기 비디오 생성을 위한 작업 추적
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
