---
read_when:
    - 에이전트를 통해 비디오 생성하기
    - 비디오 생성 provider 및 모델 구성하기
    - '`video_generate` 도구 매개변수 이해하기'
sidebarTitle: Video generation
summary: 14개 provider 백엔드 전반에서 텍스트, 이미지 또는 비디오 참조를 사용해 `video_generate`로 비디오 생성하기
title: 비디오 생성
x-i18n:
    generated_at: "2026-04-26T11:41:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f4d47318c822f06d979308a0e1fce87de40be9c213f64b4c815dcedba944b
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw 에이전트는 텍스트 프롬프트, 참조 이미지 또는 기존 비디오로부터 비디오를 생성할 수 있습니다. 현재 14개의 provider 백엔드가 지원되며, 각각 서로 다른 모델 옵션, 입력 모드, 기능 집합을 제공합니다. 에이전트는 구성과 사용 가능한 API key를 기반으로 적절한 provider를 자동으로 선택합니다.

<Note>
`video_generate` 도구는 하나 이상의 비디오 생성 provider를 사용할 수 있을 때만 표시됩니다. 에이전트 도구에서 이 항목이 보이지 않는다면 provider API key를 설정하거나 `agents.defaults.videoGenerationModel`을 구성하세요.
</Note>

OpenClaw는 비디오 생성을 다음 세 가지 런타임 모드로 처리합니다.

- `generate` — 참조 미디어가 없는 텍스트-비디오 요청
- `imageToVideo` — 요청에 하나 이상의 참조 이미지가 포함됨
- `videoToVideo` — 요청에 하나 이상의 참조 비디오가 포함됨

provider는 이 모드들 중 일부만 지원할 수도 있습니다. 이 도구는 제출 전에 활성 모드를 검증하고, `action=list`에서 지원되는 모드를 보고합니다.

## 빠른 시작

<Steps>
  <Step title="인증 구성">
    지원되는 provider 중 하나에 API key를 설정합니다.

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
    > 석양 속에서 친근한 바닷가재가 서핑하는 5초짜리 영화 같은 비디오를 생성해줘.

    에이전트가 자동으로 `video_generate`를 호출합니다. 도구 허용 목록 설정은 필요하지 않습니다.

  </Step>
</Steps>

## 비동기 생성 작동 방식

비디오 생성은 비동기식입니다. 세션에서 에이전트가 `video_generate`를 호출하면:

1. OpenClaw가 요청을 provider에 제출하고 즉시 작업 id를 반환합니다.
2. provider가 백그라운드에서 작업을 처리합니다(일반적으로 provider와 해상도에 따라 30초에서 5분).
3. 비디오가 준비되면 OpenClaw가 내부 완료 이벤트로 같은 세션을 다시 깨웁니다.
4. 에이전트가 원래 대화에 완성된 비디오를 게시합니다.

작업이 진행 중인 동안 같은 세션의 중복 `video_generate` 호출은 새 생성을 시작하는 대신 현재 작업 상태를 반환합니다. CLI에서 진행 상태를 확인하려면 `openclaw tasks list` 또는 `openclaw tasks show <taskId>`를 사용하세요.

세션 기반 에이전트 실행이 아닌 경우(예: 직접 도구 호출), 이 도구는 인라인 생성으로 대체되고 같은 턴에서 최종 미디어 경로를 반환합니다.

생성된 비디오 파일은 provider가 바이트를 반환할 때 OpenClaw가 관리하는 미디어 저장소 아래에 저장됩니다. 기본 생성 비디오 저장 상한은 비디오 미디어 제한을 따르며, 더 큰 렌더링에는 `agents.defaults.mediaMaxMb`로 이를 높일 수 있습니다. provider가 호스팅된 출력 URL도 반환하는 경우, 로컬 저장소가 너무 큰 파일을 거부하더라도 OpenClaw는 작업을 실패시키는 대신 해당 URL을 전달할 수 있습니다.

### 작업 수명 주기

| 상태       | 의미                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | 작업이 생성되었고 provider가 수락하기를 기다리는 중입니다.                                             |
| `running`   | provider가 처리 중입니다(일반적으로 provider와 해상도에 따라 30초에서 5분). |
| `succeeded` | 비디오가 준비되었습니다. 에이전트가 깨어나 대화에 게시합니다.                                   |
| `failed`    | provider 오류 또는 타임아웃입니다. 에이전트가 오류 세부 정보와 함께 깨어납니다.                                   |

CLI에서 상태 확인:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

현재 세션에 대해 비디오 작업이 이미 `queued` 또는 `running` 상태라면,
`video_generate`는 새 작업을 시작하는 대신 기존 작업 상태를 반환합니다.
새 생성을 트리거하지 않고 명시적으로 확인하려면 `action: "status"`를 사용하세요.

## 지원되는 provider

| Provider              | 기본 모델                   | 텍스트 | 이미지 참조                                            | 비디오 참조                                       | 인증                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | 예 (원격 URL)                                     | 예 (원격 URL)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 최대 이미지 2개 (I2V 모델만; 첫 프레임 + 마지막 프레임) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 최대 이미지 2개 (role을 통한 첫 프레임 + 마지막 프레임)         | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 최대 참조 이미지 9개                             | 최대 비디오 3개                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 이미지 1개                                              | —                                               | `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 이미지 1개; Seedance reference-to-video에서는 최대 9개    | Seedance reference-to-video에서는 최대 비디오 3개 | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 이미지 1개                                              | 비디오 1개                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 이미지 1개                                              | —                                               | `MINIMAX_API_KEY` 또는 MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 이미지 1개                                              | 비디오 1개                                         | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | 예 (원격 URL)                                     | 예 (원격 URL)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 이미지 1개                                              | 비디오 1개                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 이미지 1개                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 이미지 1개 (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 첫 프레임 이미지 1개 또는 최대 `reference_image` 7개    | 비디오 1개                                         | `XAI_API_KEY`                            |

일부 provider는 추가 또는 대체 API key 환경 변수도 허용합니다. 자세한 내용은 개별 [provider 페이지](#related)를 참고하세요.

런타임에서 사용 가능한 provider, 모델, 런타임 모드를 확인하려면 `video_generate action=list`를 실행하세요.

### 기능 매트릭스

`video_generate`, 계약 테스트, 공용 라이브 스윕에서 사용하는 명시적 모드 계약:

| Provider | `generate` | `imageToVideo` | `videoToVideo` | 현재 공용 라이브 레인                                                                                                                  |
| -------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 이 provider는 원격 `http(s)` 비디오 URL이 필요하므로 `videoToVideo`는 건너뜀                               |
| BytePlus |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  |     ✓      |       ✓        |       —        | 공용 스윕에는 없음. 워크플로별 커버리지는 Comfy 테스트에 있음                                                               |
| fal      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo`는 Seedance reference-to-video 사용 시에만                                                   |
| Google   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 현재 버퍼 기반 Gemini/Veo 스윕은 해당 입력을 허용하지 않으므로 공용 `videoToVideo`는 건너뜀  |
| MiniMax  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 현재 이 조직/입력 경로에는 provider 측 inpaint/remix 액세스가 필요하므로 공용 `videoToVideo`는 건너뜀 |
| Qwen     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 이 provider는 원격 `http(s)` 비디오 URL이 필요하므로 `videoToVideo`는 건너뜀                               |
| Runway   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo`는 선택한 모델이 `runway/gen4_aleph`일 때만 실행                                      |
| Together |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra    |     ✓      |       ✓        |       —        | `generate`; 번들된 `veo3`는 텍스트 전용이고 번들된 `kling`은 원격 이미지 URL이 필요하므로 공용 `imageToVideo`는 건너뜀            |
| xAI      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 이 provider는 현재 원격 MP4 URL이 필요하므로 `videoToVideo`는 건너뜀                                |

## 도구 매개변수

### 필수

<ParamField path="prompt" type="string" required>
  생성할 비디오에 대한 텍스트 설명입니다. `action: "generate"`에서 필수입니다.
</ParamField>

### 콘텐츠 입력

<ParamField path="image" type="string">단일 참조 이미지(경로 또는 URL).</ParamField>
<ParamField path="images" type="string[]">여러 참조 이미지(최대 9개).</ParamField>
<ParamField path="imageRoles" type="string[]">
결합된 이미지 목록과 위치별로 대응하는 선택적 role 힌트입니다.
정식 값: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">단일 참조 비디오(경로 또는 URL).</ParamField>
<ParamField path="videos" type="string[]">여러 참조 비디오(최대 4개).</ParamField>
<ParamField path="videoRoles" type="string[]">
결합된 비디오 목록과 위치별로 대응하는 선택적 role 힌트입니다.
정식 값: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
단일 참조 오디오(경로 또는 URL)입니다. provider가 오디오 입력을 지원할 때 배경 음악 또는 음성 참조에 사용됩니다.
</ParamField>
<ParamField path="audioRefs" type="string[]">여러 참조 오디오(최대 3개).</ParamField>
<ParamField path="audioRoles" type="string[]">
결합된 오디오 목록과 위치별로 대응하는 선택적 role 힌트입니다.
정식 값: `reference_audio`.
</ParamField>

<Note>
role 힌트는 provider에 있는 그대로 전달됩니다. 정식 값은
`VideoGenerationAssetRole` 유니언에서 오지만 provider는 추가
role 문자열도 허용할 수 있습니다. `*Roles` 배열은 해당 참조 목록보다
더 많은 항목을 가질 수 없으며, 하나씩 어긋난 실수는 명확한 오류와 함께 실패합니다.
슬롯을 비워 두려면 빈 문자열을 사용하세요. xAI의 경우,
`reference_images` 생성 모드를 사용하려면 모든 이미지 role을
`reference_image`로 설정하세요. 단일 이미지 image-to-video에서는
role을 생략하거나 `first_frame`을 사용하세요.
</Note>

### 스타일 제어

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, 또는 `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, 또는 `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  목표 길이(초)입니다(provider가 지원하는 가장 가까운 값으로 반올림됨).
</ParamField>
<ParamField path="size" type="string">provider가 지원할 때 사용하는 크기 힌트입니다.</ParamField>
<ParamField path="audio" type="boolean">
  지원될 때 출력에 생성된 오디오를 포함합니다. `audioRef*`(입력)와는 별개입니다.
</ParamField>
<ParamField path="watermark" type="boolean">지원될 때 provider 워터마크를 전환합니다.</ParamField>

`adaptive`는 provider별 sentinel 값입니다. 해당 capability에
`adaptive`를 선언한 provider에는 그대로 전달됩니다(예: BytePlus
Seedance는 입력 이미지 크기에서 비율을 자동 감지하는 데 사용합니다).
이를 선언하지 않은 provider는 도구 결과의
`details.ignoredOverrides`를 통해 해당 값을 표시하므로 무시된 사실을 확인할 수 있습니다.

### 고급

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"`는 현재 세션 작업을 반환하고, `"list"`는 provider를 조회합니다.
</ParamField>
<ParamField path="model" type="string">provider/model 재정의(예: `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">출력 파일명 힌트.</ParamField>
<ParamField path="timeoutMs" type="number">선택적 provider 요청 타임아웃(밀리초).</ParamField>
<ParamField path="providerOptions" type="object">
  JSON 객체 형태의 provider별 옵션입니다(예: `{"seed": 42, "draft": true}`).
  타입이 지정된 스키마를 선언한 provider는 key와 타입을 검증하며, 알 수 없는
  key나 타입 불일치가 있으면 fallback 중 해당 후보를 건너뜁니다. 선언된
  스키마가 없는 provider는 옵션을 있는 그대로 받습니다. 각 provider가
  무엇을 허용하는지 보려면 `video_generate action=list`를 실행하세요.
</ParamField>

<Note>
모든 provider가 모든 매개변수를 지원하는 것은 아닙니다. OpenClaw는 길이를
provider가 지원하는 가장 가까운 값으로 정규화하고, fallback provider가 다른
제어 표면을 노출할 때 size-to-aspect-ratio 같은 변환된 geometry 힌트를
다시 매핑합니다. 실제로 지원되지 않는 재정의는 최선의 노력 기준으로 무시되며,
도구 결과에서 경고로 보고됩니다. 하드 capability 제한(예: 참조 입력이 너무 많음)은
제출 전에 실패합니다. 도구 결과는 적용된 설정을 보고하며,
`details.normalization`은 요청값에서 적용값으로의 변환을 기록합니다.
</Note>

참조 입력은 런타임 모드를 선택합니다.

- 참조 미디어 없음 → `generate`
- 이미지 참조가 하나라도 있음 → `imageToVideo`
- 비디오 참조가 하나라도 있음 → `videoToVideo`
- 참조 오디오 입력은 **결정된 모드를 변경하지 않습니다**. 대신 이미지/비디오 참조가
  선택한 모드 위에 적용되며, `maxInputAudios`를 선언한 provider에서만 동작합니다.

이미지와 비디오 참조를 혼합하는 것은 안정적인 공용 capability 표면이 아닙니다.
요청당 하나의 참조 유형만 사용하는 것을 권장합니다.

#### Fallback 및 타입 지정 옵션

일부 capability 검사는 도구 경계가 아니라 fallback 계층에 적용되므로,
기본 provider의 제한을 초과하는 요청이라도 이를 처리할 수 있는 fallback에서
실행될 수 있습니다.

- 활성 후보가 `maxInputAudios`를 선언하지 않았거나(`0`) 요청에 오디오
  참조가 포함된 경우 → 해당 후보를 건너뛰고 다음 후보를 시도합니다.
- 활성 후보의 `maxDurationSeconds`가 요청된 `durationSeconds`보다 낮고
  선언된 `supportedDurationSeconds` 목록이 없는 경우 → 건너뜁니다.
- 요청에 `providerOptions`가 포함되어 있고 활성 후보가 타입 지정된
  `providerOptions` 스키마를 명시적으로 선언한 경우 → 제공된 key가 스키마에
  없거나 값 타입이 일치하지 않으면 건너뜁니다. 선언된 스키마가 없는 provider는
  옵션을 그대로 받습니다(하위 호환 pass-through). provider는 빈 스키마
  (`capabilities.providerOptions: {}`)를 선언하여 모든 provider 옵션을 거부할 수 있으며,
  이 경우 타입 불일치와 동일하게 건너뜁니다.

요청에서 첫 번째 건너뜀 사유는 운영자가 기본 provider가 왜 제외되었는지 볼 수 있도록
`warn` 수준으로 기록됩니다. 이후의 건너뜀은 긴 fallback 체인을 조용히 유지하기 위해
`debug` 수준으로 기록됩니다. 모든 후보가 건너뛰어지면 집계된 오류에 각 후보의
건너뜀 사유가 포함됩니다.

## 작업

| 작업     | 수행 내용                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 기본값입니다. 주어진 프롬프트와 선택적 참조 입력으로 비디오를 생성합니다.                             |
| `status`   | 새 생성을 시작하지 않고 현재 세션의 진행 중인 비디오 작업 상태를 확인합니다. |
| `list`     | 사용 가능한 provider, 모델, 그리고 그 capability를 표시합니다.                                                |

## 모델 선택

OpenClaw는 다음 순서로 모델을 결정합니다.

1. **`model` 도구 매개변수** — 에이전트가 호출에서 이를 지정한 경우
2. 구성의 **`videoGenerationModel.primary`**
3. 순서대로 **`videoGenerationModel.fallbacks`**
4. **자동 감지** — 유효한 인증이 있는 provider를 현재 기본 provider부터,
   그다음 나머지 provider를 알파벳 순서로 사용

provider가 실패하면 다음 후보를 자동으로 시도합니다. 모든
후보가 실패하면 오류에 각 시도에 대한 세부 정보가 포함됩니다.

명시적인 `model`, `primary`, `fallbacks` 항목만 사용하려면
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

## provider 참고 사항

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope / Model Studio 비동기 엔드포인트를 사용합니다. 참조 이미지와
    비디오는 원격 `http(s)` URL이어야 합니다.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    provider id: `byteplus`.

    모델: `seedance-1-0-pro-250528`(기본값),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V 모델(`*-t2v-*`)은 이미지 입력을 허용하지 않습니다. I2V 모델과
    일반 `*-pro-*` 모델은 단일 참조 이미지(첫 프레임)를 지원합니다.
    이미지를 위치 기반으로 전달하거나 `role: "first_frame"`을 설정하세요.
    이미지가 제공되면 T2V 모델 ID는 자동으로 해당 I2V
    변형으로 전환됩니다.

    지원되는 `providerOptions` key: `seed` (number), `draft` (boolean —
    480p 강제), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin이 필요합니다. provider id: `byteplus-seedance15`. 모델:
    `seedance-1-5-pro-251215`.

    통합 `content[]` API를 사용합니다. 최대 2개의 입력 이미지
    (`first_frame` + `last_frame`)를 지원합니다. 모든 입력은 원격 `https://`
    URL이어야 합니다. 각 이미지에 `role: "first_frame"` / `"last_frame"`를
    설정하거나, 이미지를 위치 기반으로 전달하세요.

    `aspectRatio: "adaptive"`는 입력 이미지에서 비율을 자동 감지합니다.
    `audio: true`는 `generate_audio`로 매핑됩니다. `providerOptions.seed`
    (number)가 전달됩니다.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin이 필요합니다. provider id: `byteplus-seedance2`. 모델:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    통합 `content[]` API를 사용합니다. 최대 참조 이미지 9개,
    참조 비디오 3개, 참조 오디오 3개를 지원합니다. 모든 입력은 원격
    `https://` URL이어야 합니다. 각 에셋에 `role`을 설정하세요 — 지원 값:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"`는 입력 이미지에서 비율을 자동 감지합니다.
    `audio: true`는 `generate_audio`로 매핑됩니다. `providerOptions.seed`
    (number)가 전달됩니다.

  </Accordion>
  <Accordion title="ComfyUI">
    워크플로 기반의 로컬 또는 클라우드 실행입니다. 구성된 그래프를 통해
    텍스트-비디오와 이미지-비디오를 지원합니다.
  </Accordion>
  <Accordion title="fal">
    장시간 실행 작업을 위한 큐 기반 흐름을 사용합니다. 대부분의 fal 비디오 모델은
    단일 이미지 참조를 허용합니다. Seedance 2.0 reference-to-video
    모델은 최대 이미지 9개, 비디오 3개, 오디오 참조 3개를 허용하며,
    전체 참조 파일 수는 최대 12개입니다.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    이미지 1개 또는 비디오 1개 참조를 지원합니다.
  </Accordion>
  <Accordion title="MiniMax">
    단일 이미지 참조만 지원합니다.
  </Accordion>
  <Accordion title="OpenAI">
    `size` 재정의만 전달됩니다. 다른 스타일 재정의
    (`aspectRatio`, `resolution`, `audio`, `watermark`)는
    경고와 함께 무시됩니다.
  </Accordion>
  <Accordion title="Qwen">
    Alibaba와 동일한 DashScope 백엔드를 사용합니다. 참조 입력은 원격
    `http(s)` URL이어야 하며 로컬 파일은 즉시 거부됩니다.
  </Accordion>
  <Accordion title="Runway">
    데이터 URI를 통해 로컬 파일을 지원합니다. Video-to-video에는
    `runway/gen4_aleph`가 필요합니다. 텍스트 전용 실행은 `16:9`와 `9:16`
    종횡비를 노출합니다.
  </Accordion>
  <Accordion title="Together">
    단일 이미지 참조만 지원합니다.
  </Accordion>
  <Accordion title="Vydra">
    인증 누락 리디렉션을 피하기 위해 `https://www.vydra.ai/api/v1`를 직접 사용합니다.
    `veo3`는 텍스트-비디오 전용으로 번들되며, `kling`은
    원격 이미지 URL이 필요합니다.
  </Accordion>
  <Accordion title="xAI">
    텍스트-비디오, 단일 첫 프레임 image-to-video, xAI `reference_images`를 통한
    최대 7개의 `reference_image` 입력, 그리고 원격 비디오 편집/확장 흐름을 지원합니다.
  </Accordion>
</AccordionGroup>

## provider capability 모드

공용 비디오 생성 계약은 단순한 평면 집계 제한이 아니라
모드별 capability를 지원합니다. 새로운 provider 구현은
명시적 모드 블록을 사용하는 것이 좋습니다.

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

`maxInputImages` 및 `maxInputVideos` 같은 평면 집계 필드만으로는
변환 모드 지원을 알리기에 **충분하지 않습니다**. provider는
`generate`, `imageToVideo`, `videoToVideo`를 명시적으로 선언해야
라이브 테스트, 계약 테스트, 공용 `video_generate` 도구가 모드 지원을
결정적으로 검증할 수 있습니다.

provider 내 특정 모델 하나가 나머지보다 더 넓은 참조 입력 지원을 가진 경우,
모드 전체 제한을 높이는 대신 `maxInputImagesByModel`,
`maxInputVideosByModel`, 또는 `maxInputAudiosByModel`을 사용하세요.

## 라이브 테스트

공용 번들 provider에 대한 opt-in 라이브 커버리지:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

저장소 래퍼:

```bash
pnpm test:live:media video
```

이 라이브 파일은 `~/.profile`에서 누락된 provider 환경 변수를 로드하고,
기본적으로 저장된 인증 프로필보다 라이브/환경 변수 API key를 우선 사용하며,
기본적으로 릴리스에 안전한 스모크를 실행합니다:

- 스윕에 포함된 모든 비-FAL provider에 대해 `generate`를 실행합니다.
- 1초짜리 바닷가재 프롬프트를 사용합니다.
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`에서 가져오는 provider별 작업 상한을 적용합니다
  (기본값 `180000`).

FAL은 provider 측 큐 지연이 릴리스 시간을 크게 좌우할 수 있으므로
opt-in입니다.

```bash
pnpm test:live:media video --video-providers fal
```

공용 스윕이 로컬 미디어로 안전하게 실행할 수 있는 선언된 변환 모드도 실행하려면
`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`을 설정하세요.

- `capabilities.imageToVideo.enabled`일 때 `imageToVideo`
- `capabilities.videoToVideo.enabled`이고 provider/model이 공용
  스윕에서 버퍼 기반 로컬 비디오 입력을 허용할 때 `videoToVideo`

현재 공용 `videoToVideo` 라이브 레인은 `runway/gen4_aleph`를 선택한 경우에만
`runway`를 다룹니다.

## 구성

OpenClaw 구성에서 기본 비디오 생성 모델을 설정하세요.

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

## 관련 항목

- [Alibaba Model Studio](/ko/providers/alibaba)
- [백그라운드 작업](/ko/automation/tasks) — 비동기 비디오 생성을 위한 작업 추적
- [BytePlus](/ko/concepts/model-providers#byteplus-international)
- [ComfyUI](/ko/providers/comfy)
- [구성 참조](/ko/gateway/config-agents#agent-defaults)
- [fal](/ko/providers/fal)
- [Google (Gemini)](/ko/providers/google)
- [MiniMax](/ko/providers/minimax)
- [Models](/ko/concepts/models)
- [OpenAI](/ko/providers/openai)
- [Qwen](/ko/providers/qwen)
- [Runway](/ko/providers/runway)
- [Together AI](/ko/providers/together)
- [도구 개요](/ko/tools)
- [Vydra](/ko/providers/vydra)
- [xAI](/ko/providers/xai)
