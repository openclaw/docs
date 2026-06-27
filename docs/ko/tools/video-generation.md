---
read_when:
    - 에이전트를 통해 동영상 생성하기
    - 비디오 생성 제공자 및 모델 구성하기
    - video_generate 도구 매개변수 이해
sidebarTitle: Video generation
summary: 텍스트, 이미지 또는 동영상 참조를 사용해 16개의 제공자 백엔드에서 video_generate로 동영상을 생성합니다
title: 동영상 생성
x-i18n:
    generated_at: "2026-06-27T18:18:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64c8a3191262613a1acf684496570a6dd8893ebb3a2a7e5ae41337d58555c401
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw 에이전트는 텍스트 프롬프트, 참조 이미지 또는
기존 비디오에서 비디오를 생성할 수 있습니다. 16개의 제공자 백엔드가 지원되며,
각 백엔드는 서로 다른 모델 옵션, 입력 모드, 기능 세트를 제공합니다. 에이전트는
구성과 사용 가능한 API 키를 기준으로 적절한 제공자를 자동으로 선택합니다.

<Note>
`video_generate` 도구는 하나 이상의 비디오 생성 제공자를 사용할 수 있을 때만
나타납니다. 에이전트 도구에 표시되지 않으면 제공자 API 키를 설정하거나
`agents.defaults.videoGenerationModel`을 구성하세요.
</Note>

OpenClaw는 비디오 생성을 세 가지 런타임 모드로 처리합니다.

- `generate` - 참조 미디어가 없는 텍스트-비디오 요청입니다.
- `imageToVideo` - 요청에 하나 이상의 참조 이미지가 포함됩니다.
- `videoToVideo` - 요청에 하나 이상의 참조 비디오가 포함됩니다.

제공자는 이러한 모드의 일부 또는 전부를 지원할 수 있습니다. 도구는 제출 전에
활성 모드를 검증하고 `action=list`에서 지원되는 모드를 보고합니다.

## 빠른 시작

<Steps>
  <Step title="인증 구성">
    지원되는 제공자에 대한 API 키를 설정합니다.

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
    > 석양에 서핑하는 친근한 바닷가재의 5초짜리 영화 같은 비디오를 생성해 주세요.

    에이전트가 `video_generate`를 자동으로 호출합니다. 도구 허용 목록 설정은
    필요하지 않습니다.

  </Step>
</Steps>

## 비동기 생성 작동 방식

비디오 생성은 비동기식입니다. 에이전트가 세션에서 `video_generate`를 호출하면
다음과 같이 동작합니다.

1. OpenClaw가 요청을 제공자에게 제출하고 즉시 작업 ID를 반환합니다.
2. 제공자가 백그라운드에서 작업을 처리합니다(일반적으로 제공자와 해상도에 따라 30초에서 몇 분이 걸리며, 느린 큐 기반 제공자는 구성된 제한 시간까지 실행될 수 있습니다).
3. 비디오가 준비되면 OpenClaw가 내부 완료 이벤트로 같은 세션을 깨웁니다.
4. 에이전트는 세션의 일반적인 표시 응답 모드를 통해 사용자에게 알립니다.
   자동인 경우 최종 응답 전달을 사용하거나, 세션에 메시지 도구가 필요한 경우
   `message(action="send")`를 사용합니다. 요청자 세션이 비활성 상태이거나
   활성 깨우기가 실패했고, 완료 응답에 생성된 비디오 일부가 아직 누락되어 있으면,
   OpenClaw는 누락된 비디오만 포함하는 멱등 직접 폴백을 보냅니다.

작업이 진행 중인 동안 같은 세션에서 중복된 `video_generate` 호출은 또 다른
생성을 시작하는 대신 현재 작업 상태를 반환합니다. CLI에서 진행 상황을 확인하려면
`openclaw tasks list` 또는 `openclaw tasks show <taskId>`를 사용하세요.

세션 기반 에이전트 실행 외부(예: 직접 도구 호출)에서는 도구가 인라인 생성으로
폴백하고 같은 턴에서 최종 미디어 경로를 반환합니다.

제공자가 바이트를 반환하면 생성된 비디오 파일은 OpenClaw 관리 미디어 저장소에
저장됩니다. 기본 생성 비디오 저장 한도는 비디오 미디어 한도를 따르며,
`agents.defaults.mediaMaxMb`를 사용하면 더 큰 렌더링을 위해 한도를 높일 수
있습니다. 제공자가 호스팅된 출력 URL도 반환하는 경우, 로컬 지속 저장이 너무 큰
파일을 거부하면 OpenClaw는 작업을 실패시키는 대신 해당 URL을 전달할 수 있습니다.

### 작업 수명 주기

| 상태        | 의미                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | 작업이 생성되었고 제공자가 수락하기를 기다리는 중입니다.                                               |
| `running`   | 제공자가 처리 중입니다(일반적으로 제공자와 해상도에 따라 30초에서 몇 분이 걸립니다).                  |
| `succeeded` | 비디오가 준비되었습니다. 에이전트가 깨어나 대화에 게시합니다.                                          |
| `failed`    | 제공자 오류 또는 제한 시간 초과입니다. 에이전트가 오류 세부 정보와 함께 깨어납니다.                   |

CLI에서 상태를 확인합니다.

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

현재 세션에 이미 `queued` 또는 `running` 상태의 비디오 작업이 있으면,
`video_generate`는 새 작업을 시작하는 대신 기존 작업 상태를 반환합니다.
새 생성을 트리거하지 않고 명시적으로 확인하려면 `action: "status"`를 사용하세요.

## 지원되는 제공자

| 제공자                | 기본 모델                       | 텍스트 | 이미지 참조                                          | 비디오 참조                                     | 인증                                     |
| --------------------- | ------------------------------- | :----: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |   ✓    | 예(원격 URL)                                         | 예(원격 URL)                                    | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |   ✓    | 이미지 최대 2개(I2V 모델만 해당, 첫 프레임 + 마지막 프레임) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |   ✓    | 이미지 최대 2개(역할을 통한 첫 프레임 + 마지막 프레임) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |   ✓    | 참조 이미지 최대 9개                                 | 비디오 최대 3개                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |   ✓    | 이미지 1개                                           | -                                               | `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |   ✓    | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |   ✓    | 이미지 1개, Seedance 참조-비디오에서는 최대 9개       | Seedance 참조-비디오에서는 비디오 최대 3개      | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |   ✓    | 이미지 1개                                           | 비디오 1개                                      | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |   ✓    | 이미지 1개                                           | -                                               | `MINIMAX_API_KEY` 또는 MiniMax OAuth     |
| OpenAI                | `sora-2`                        |   ✓    | 이미지 1개                                           | 비디오 1개                                      | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |   ✓    | 이미지 최대 4개(첫/마지막 프레임 또는 참조)           | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |   ✓    | 예(원격 URL)                                         | 예(원격 URL)                                    | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |   ✓    | 이미지 1개                                           | 비디오 1개                                      | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |   ✓    | `Wan-AI/Wan2.2-I2V-A14B`만 해당                      | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |   ✓    | 이미지 1개(`kling`)                                  | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |   ✓    | 첫 프레임 이미지 1개 또는 최대 7개의 `reference_image` | 비디오 1개                                      | `XAI_API_KEY`                            |

일부 제공자는 추가 또는 대체 API 키 환경 변수를 허용합니다. 자세한 내용은
개별 [제공자 페이지](#related)를 참고하세요.

런타임에 사용 가능한 제공자, 모델, 런타임 모드를 검사하려면
`video_generate action=list`를 실행하세요.

### 기능 매트릭스

`video_generate`, 계약 테스트, 공유 라이브 스윕에서 사용하는 명시적 모드 계약은
다음과 같습니다.

| 제공자     | `generate` | `imageToVideo` | `videoToVideo` | 현재 공유 라이브 레인                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 이 제공자는 원격 `http(s)` 비디오 URL이 필요하므로 `videoToVideo`는 건너뜁니다                              |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | 공유 스윕에는 포함되지 않습니다. 워크플로별 커버리지는 Comfy 테스트에 있습니다                                                          |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; 네이티브 DeepInfra 비디오 스키마는 Plugin 계약에서 텍스트-비디오입니다                                                      |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo`는 Seedance 참조-비디오를 사용할 때만 해당됩니다                                              |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 현재 버퍼 기반 Gemini/Veo 스윕이 해당 입력을 허용하지 않으므로 공유 `videoToVideo`는 건너뜁니다             |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 이 조직/입력 경로에는 현재 제공자 측 비디오 편집 접근 권한이 필요하므로 공유 `videoToVideo`는 건너뜁니다     |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 이 제공자는 원격 `http(s)` 비디오 URL이 필요하므로 `videoToVideo`는 건너뜁니다                              |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo`는 선택된 모델이 `runway/gen4_aleph`일 때만 실행됩니다                                       |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; 번들 `veo3`는 텍스트 전용이고 번들 `kling`에는 원격 이미지 URL이 필요하므로 공유 `imageToVideo`는 건너뜁니다                |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; 이 제공자는 현재 원격 MP4 URL이 필요하므로 `videoToVideo`는 건너뜁니다                                      |

## 도구 매개변수

### 필수

<ParamField path="prompt" type="string" required>
  생성할 비디오의 텍스트 설명입니다. `action: "generate"`에 필수입니다.
</ParamField>

### 콘텐츠 입력

<ParamField path="image" type="string">단일 참조 이미지(경로 또는 URL).</ParamField>
<ParamField path="images" type="string[]">여러 참조 이미지(최대 9개).</ParamField>
<ParamField path="imageRoles" type="string[]">
결합된 이미지 목록과 병렬로 적용되는 선택적 위치별 역할 힌트입니다.
정식 값: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">단일 참조 비디오(경로 또는 URL).</ParamField>
<ParamField path="videos" type="string[]">여러 참조 비디오(최대 4개).</ParamField>
<ParamField path="videoRoles" type="string[]">
결합된 비디오 목록과 병렬로 적용되는 선택적 위치별 역할 힌트입니다.
정식 값: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
단일 참조 오디오(경로 또는 URL). 제공자가 오디오 입력을 지원할 때
배경 음악 또는 음성 참조에 사용됩니다.
</ParamField>
<ParamField path="audioRefs" type="string[]">여러 참조 오디오(최대 3개).</ParamField>
<ParamField path="audioRoles" type="string[]">
결합된 오디오 목록과 병렬로 적용되는 선택적 위치별 역할 힌트입니다.
정식 값: `reference_audio`.
</ParamField>

<Note>
역할 힌트는 있는 그대로 제공자에게 전달됩니다. 정식 값은
`VideoGenerationAssetRole` 유니언에서 오지만, 제공자는 추가 역할
문자열을 허용할 수 있습니다. `*Roles` 배열은 해당 참조 목록보다
항목 수가 많으면 안 됩니다. 하나씩 어긋나는 실수는 명확한 오류로 실패합니다.
슬롯을 설정하지 않으려면 빈 문자열을 사용하세요. xAI의 경우
`reference_images` 생성 모드를 사용하려면 모든 이미지 역할을
`reference_image`로 설정하세요. 단일 이미지 image-to-video에는 역할을
생략하거나 `first_frame`을 사용하세요.
</Note>

### 스타일 제어

<ParamField path="aspectRatio" type="string">
  `1:1`, `16:9`, `9:16`, `adaptive` 또는 제공자별 값과 같은 종횡비 힌트입니다. OpenClaw는 제공자별로 지원되지 않는 값을 정규화하거나 무시합니다.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, `1080P`, `4K` 또는 제공자별 값과 같은 해상도 힌트입니다. OpenClaw는 제공자별로 지원되지 않는 값을 정규화하거나 무시합니다.</ParamField>
<ParamField path="durationSeconds" type="number">
  대상 길이(초)입니다(가장 가까운 제공자 지원 값으로 반올림).
</ParamField>
<ParamField path="size" type="string">제공자가 지원할 때 사용하는 크기 힌트입니다.</ParamField>
<ParamField path="audio" type="boolean">
  지원되는 경우 출력에서 생성된 오디오를 활성화합니다. `audioRef*`(입력)와는 별개입니다.
</ParamField>
<ParamField path="watermark" type="boolean">지원되는 경우 제공자 워터마크를 전환합니다.</ParamField>

`adaptive`는 제공자별 센티널입니다. 기능에 `adaptive`를 선언한
제공자에게는 있는 그대로 전달됩니다(예: BytePlus Seedance는 입력 이미지
크기에서 비율을 자동 감지하는 데 사용). 이를 선언하지 않은 제공자는
도구 결과의 `details.ignoredOverrides`를 통해 값을 표시하므로 삭제된
항목을 확인할 수 있습니다.

### 고급

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"`는 현재 세션 작업을 반환하고, `"list"`는 제공자를 검사합니다.
</ParamField>
<ParamField path="model" type="string">제공자/모델 재정의(예: `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">출력 파일 이름 힌트.</ParamField>
<ParamField path="timeoutMs" type="number">선택적 제공자 작업 제한 시간(밀리초)입니다. 생략하면 OpenClaw는 구성된 경우 `agents.defaults.videoGenerationModel.timeoutMs`를 사용하고, 그렇지 않으면 존재할 때 Plugin 작성 제공자 기본값을 사용합니다.</ParamField>
<ParamField path="providerOptions" type="object">
  JSON 객체로 된 제공자별 옵션(예: `{"seed": 42, "draft": true}`).
  타입이 지정된 스키마를 선언한 제공자는 키와 타입을 검증합니다. 알 수 없는
  키나 불일치는 폴백 중 해당 후보를 건너뜁니다. 선언된 스키마가 없는
  제공자는 옵션을 있는 그대로 받습니다. 각 제공자가 허용하는 항목을 보려면
  `video_generate action=list`를 실행하세요.
</ParamField>

<Note>
모든 제공자가 모든 매개변수를 지원하는 것은 아닙니다. OpenClaw는 길이를
가장 가까운 제공자 지원 값으로 정규화하고, 폴백 제공자가 다른 제어 표면을
노출할 때 크기-종횡비 같은 변환된 지오메트리 힌트를 다시 매핑합니다.
실제로 지원되지 않는 재정의는 최선의 노력 기준으로 무시되며 도구 결과에
경고로 보고됩니다. 참조 입력이 너무 많은 경우와 같은 하드 기능 제한은
제출 전에 실패합니다. 도구 결과는 적용된 설정을 보고하며,
`details.normalization`은 요청값에서 적용값으로의 변환을 캡처합니다.
</Note>

참조 입력은 런타임 모드를 선택합니다.

- 참조 미디어 없음 → `generate`
- 이미지 참조 있음 → `imageToVideo`
- 비디오 참조 있음 → `videoToVideo`
- 참조 오디오 입력은 해석된 모드를 변경하지 **않습니다**. 이미지/비디오
  참조가 선택한 모드 위에 적용되며, `maxInputAudios`를 선언한
  제공자에서만 작동합니다.

이미지와 비디오 참조를 혼합하는 것은 안정적인 공유 기능 표면이 아닙니다.
요청당 하나의 참조 유형을 사용하는 것이 좋습니다.

#### 폴백 및 타입 지정 옵션

일부 기능 검사는 도구 경계가 아니라 폴백 계층에서 적용되므로, 기본 제공자의
제한을 초과하는 요청도 기능을 갖춘 폴백에서 계속 실행될 수 있습니다.

- 요청에 오디오 참조가 포함된 경우 `maxInputAudios`를 선언하지 않았거나
  `0`으로 선언한 활성 후보는 건너뛰고 다음 후보를 시도합니다.
- 활성 후보의 `maxDurationSeconds`가 요청된 `durationSeconds`보다 낮고
  선언된 `supportedDurationSeconds` 목록이 없으면 건너뜁니다.
- 요청에 `providerOptions`가 포함되어 있고 활성 후보가 타입이 지정된
  `providerOptions` 스키마를 명시적으로 선언하면, 제공된 키가 스키마에
  없거나 값 타입이 일치하지 않을 때 건너뜁니다. 선언된 스키마가 없는
  제공자는 옵션을 있는 그대로 받습니다(이전 버전과 호환되는
  패스스루). 제공자는 빈 스키마(`capabilities.providerOptions: {}`)를
  선언하여 모든 제공자 옵션을 거부할 수 있으며, 이 경우 타입 불일치와
  동일하게 건너뜁니다.

요청의 첫 번째 건너뛰기 이유는 `warn`으로 로깅되어 운영자가 기본 제공자가
건너뛰어졌음을 확인할 수 있습니다. 이후 건너뛰기는 긴 폴백 체인을 조용하게
유지하기 위해 `debug`로 로깅됩니다. 모든 후보를 건너뛰면 집계된 오류에
각 후보의 건너뛰기 이유가 포함됩니다.

## 작업

| 작업       | 수행 내용                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 기본값입니다. 주어진 프롬프트와 선택적 참조 입력으로 비디오를 만듭니다.                                  |
| `status`   | 다른 생성을 시작하지 않고 현재 세션의 진행 중인 비디오 작업 상태를 확인합니다.                           |
| `list`     | 사용 가능한 제공자, 모델 및 해당 기능을 표시합니다.                                                     |

## 모델 선택

OpenClaw는 다음 순서로 모델을 해석합니다.

1. **`model` 도구 매개변수** - 에이전트가 호출에서 지정한 경우.
2. 구성의 **`videoGenerationModel.primary`**.
3. 순서대로 **`videoGenerationModel.fallbacks`**.
4. **자동 감지** - 현재 기본 제공자부터 시작한 뒤 나머지 제공자를 알파벳
   순서로, 유효한 인증을 가진 제공자.

제공자가 실패하면 다음 후보를 자동으로 시도합니다. 모든 후보가 실패하면
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

## 제공자 참고 사항

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope / Model Studio 비동기 엔드포인트를 사용합니다. 참조 이미지와
    비디오는 원격 `http(s)` URL이어야 합니다.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    제공자 ID: `byteplus`.

    모델: `seedance-1-0-pro-250528`(기본값),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V 모델(`*-t2v-*`)은 이미지 입력을 허용하지 않습니다. I2V 모델과
    일반 `*-pro-*` 모델은 단일 참조 이미지(첫 프레임)를 지원합니다.
    이미지를 위치 인수로 전달하거나 `role: "first_frame"`을 설정하세요.
    이미지가 제공되면 T2V 모델 ID는 해당 I2V 변형으로 자동 전환됩니다.

    지원되는 `providerOptions` 키: `seed`(숫자), `draft`(불리언 -
    480p 강제), `camera_fixed`(불리언).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin이 필요합니다. 제공자 ID: `byteplus-seedance15`. 모델:
    `seedance-1-5-pro-251215`.

    통합 `content[]` API를 사용합니다. 최대 2개의 입력 이미지
    (`first_frame` + `last_frame`)를 지원합니다. 모든 입력은 원격
    `https://` URL이어야 합니다. 각 이미지에 `role: "first_frame"` /
    `"last_frame"`을 설정하거나 이미지를 위치 인수로 전달하세요.

    `aspectRatio: "adaptive"`는 입력 이미지에서 비율을 자동 감지합니다.
    `audio: true`는 `generate_audio`로 매핑됩니다. `providerOptions.seed`
    (숫자)가 전달됩니다.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin이 필요합니다. 제공자 ID: `byteplus-seedance2`. 모델:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    통합 `content[]` API를 사용합니다. 최대 9개의 참조 이미지,
    3개의 참조 비디오, 3개의 참조 오디오를 지원합니다. 모든 입력은 원격
    `https://` URL이어야 합니다. 각 에셋에 `role`을 설정하세요. 지원 값:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"`는 입력 이미지에서 비율을 자동 감지합니다.
    `audio: true`는 `generate_audio`로 매핑됩니다. `providerOptions.seed`
    (숫자)가 전달됩니다.

  </Accordion>
  <Accordion title="ComfyUI">
    워크플로 기반 로컬 또는 클라우드 실행입니다. 구성된 그래프를 통해
    텍스트-비디오 및 이미지-비디오를 지원합니다.
  </Accordion>
  <Accordion title="fal">
    장시간 실행 작업에는 큐 기반 플로를 사용합니다. OpenClaw는 진행 중인 fal 큐 작업을
    시간 초과로 처리하기 전에 기본적으로 최대 20분까지 기다립니다. 대부분의 fal 비디오 모델은
    단일 이미지 참조를 허용합니다. Seedance 2.0 참조-비디오
    모델은 최대 9개의 이미지, 3개의 비디오, 3개의 오디오 참조를 허용하며,
    전체 참조 파일은 최대 12개입니다.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    하나의 이미지 또는 하나의 비디오 참조를 지원합니다. Gemini API 경로에서는 해당 API가
    현재 Veo 비디오 생성에 대한 `generateAudio` 매개변수를 거부하므로 생성 오디오 요청은
    경고와 함께 무시됩니다.
  </Accordion>
  <Accordion title="MiniMax">
    단일 이미지 참조만 지원합니다. MiniMax는 `768P` 및 `1080P`
    해상도를 허용하며, `720P` 같은 요청은 제출 전에 가장 가까운
    지원 값으로 정규화됩니다.
  </Accordion>
  <Accordion title="OpenAI">
    `size` 재정의만 전달됩니다. 다른 스타일 재정의
    (`aspectRatio`, `resolution`, `audio`, `watermark`)는 경고와 함께
    무시됩니다.
  </Accordion>
  <Accordion title="OpenRouter">
    OpenRouter의 비동기 `/videos` API를 사용합니다. OpenClaw는
    작업을 제출하고, `polling_url`을 폴링하며, `unsigned_urls` 또는
    문서화된 작업 콘텐츠 엔드포인트를 다운로드합니다. 번들된 `google/veo-3.1-fast` 기본값은
    4/6/8초 길이, `720P`/`1080P` 해상도, 그리고
    `16:9`/`9:16` 화면 비율을 알립니다.
  </Accordion>
  <Accordion title="Qwen">
    Alibaba와 동일한 DashScope 백엔드입니다. 참조 입력은 원격
    `http(s)` URL이어야 하며, 로컬 파일은 사전에 거부됩니다.
  </Accordion>
  <Accordion title="Runway">
    데이터 URI를 통해 로컬 파일을 지원합니다. 비디오-비디오는
    `runway/gen4_aleph`가 필요합니다. 텍스트 전용 실행은 `16:9` 및 `9:16` 화면
    비율을 노출합니다.
  </Accordion>
  <Accordion title="Together">
    단일 이미지 참조만 지원합니다.
  </Accordion>
  <Accordion title="Vydra">
    인증을 누락시키는 리디렉션을 피하기 위해 `https://www.vydra.ai/api/v1`을 직접 사용합니다.
    `veo3`는 텍스트-비디오 전용으로 번들되며, `kling`은
    원격 이미지 URL이 필요합니다.
  </Accordion>
  <Accordion title="xAI">
    텍스트-비디오, 단일 첫 프레임 이미지-비디오, xAI `reference_images`를 통한 최대 7개의
    `reference_image` 입력, 그리고 원격
    비디오 편집/확장 플로를 지원합니다.
  </Accordion>
</AccordionGroup>

## 제공자 기능 모드

공유 비디오 생성 계약은 단순한 평면 집계 제한 대신
모드별 기능을 지원합니다. 새 제공자 구현은
명시적인 모드 블록을 선호해야 합니다.

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
변환 모드 지원을 알리기에 **충분하지 않습니다**. 제공자는 라이브
테스트, 계약 테스트, 공유 `video_generate` 도구가 모드 지원을
결정론적으로 검증할 수 있도록 `generate`, `imageToVideo`, `videoToVideo`를 명시적으로
선언해야 합니다.

제공자의 한 모델이 나머지보다 더 넓은 참조 입력 지원을 제공하는 경우,
모드 전체 제한을 높이는 대신 `maxInputImagesByModel`, `maxInputVideosByModel` 또는
`maxInputAudiosByModel`을 사용하세요.

## 라이브 테스트

공유 번들 제공자에 대한 옵트인 라이브 적용 범위:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

저장소 래퍼:

```bash
pnpm test:live:media video
```

이 라이브 파일은 기본적으로 저장된 인증 프로필보다 이미 내보낸 제공자 환경 변수를 우선 사용하며,
기본적으로 릴리스에 안전한 스모크를 실행합니다.

- 스윕의 모든 비 FAL 제공자에 대한 `generate`.
- 1초짜리 바닷가재 프롬프트.
- 제공자별 작업 상한은
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`에서 가져옵니다(기본값 `180000`).

FAL은 제공자 측 큐 지연 시간이 릴리스
시간을 지배할 수 있으므로 옵트인입니다.

```bash
pnpm test:live:media video --video-providers fal
```

공유 스윕이 로컬 미디어로 안전하게 실행할 수 있는 선언된
변환 모드도 실행하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`을 설정하세요.

- `capabilities.imageToVideo.enabled`인 경우 `imageToVideo`.
- `capabilities.videoToVideo.enabled`이고
  제공자/모델이 공유 스윕에서 버퍼 기반 로컬 비디오 입력을 허용하는 경우 `videoToVideo`.

현재 공유 `videoToVideo` 라이브 레인은 `runway/gen4_aleph`를
선택한 경우에만 `runway`를 포함합니다.

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

또는 CLI를 통해 설정합니다.

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
