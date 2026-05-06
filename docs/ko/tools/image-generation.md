---
read_when:
    - 에이전트를 통한 이미지 생성 또는 편집
    - 이미지 생성 제공자 및 모델 구성하기
    - image_generate 도구 매개변수 이해하기
sidebarTitle: Image generation
summary: OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra 전반에서 image_generate를 통해 이미지를 생성하고 편집합니다
title: 이미지 생성
x-i18n:
    generated_at: "2026-05-06T06:42:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8036e8846c38e9bfce4e618caac13fa35e89ae183f81e5a496a29feeb9656369
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` 도구를 사용하면 에이전트가 구성된 공급자를 통해 이미지를 생성하고 편집할 수 있습니다. 생성된 이미지는 에이전트 응답의 미디어 첨부 파일로 자동 전달됩니다.

<Note>
이 도구는 하나 이상의 이미지 생성 공급자를 사용할 수 있을 때만 표시됩니다. 에이전트 도구에 `image_generate`가 보이지 않으면 `agents.defaults.imageGenerationModel`을 구성하고, 공급자 API 키를 설정하거나, OpenAI Codex OAuth로 로그인하세요.
</Note>

## 빠른 시작

<Steps>
  <Step title="인증 구성">
    하나 이상의 공급자에 대한 API 키를 설정하거나(예: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) OpenAI Codex OAuth로 로그인하세요.
  </Step>
  <Step title="기본 모델 선택(선택 사항)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    Codex OAuth는 동일한 `openai/gpt-image-2` 모델 참조를 사용합니다. `openai-codex` OAuth 프로필이 구성되어 있으면 OpenClaw는 먼저 `OPENAI_API_KEY`를 시도하는 대신 해당 OAuth 프로필을 통해 이미지 요청을 라우팅합니다. 명시적 `models.providers.openai` 구성(API 키, 사용자 지정/Azure 기본 URL)을 사용하면 직접 OpenAI Images API 경로로 다시 전환됩니다.

  </Step>
  <Step title="에이전트에게 요청">
    _"친근한 로봇 마스코트 이미지를 생성해 줘."_

    에이전트가 `image_generate`를 자동으로 호출합니다. 도구 허용 목록 설정은 필요하지 않습니다. 공급자를 사용할 수 있으면 기본적으로 활성화됩니다.

  </Step>
</Steps>

<Warning>
LocalAI와 같은 OpenAI 호환 LAN 엔드포인트의 경우 사용자 지정 `models.providers.openai.baseUrl`을 유지하고 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`로 명시적으로 옵트인하세요. 비공개 및 내부 이미지 엔드포인트는 기본적으로 계속 차단됩니다.
</Warning>

## 일반 경로

| 목표                                                 | 모델 참조                                          | 인증                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| API 청구를 사용하는 OpenAI 이미지 생성             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Codex 구독 인증을 사용하는 OpenAI 이미지 생성 | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI 투명 배경 PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` 또는 OpenAI Codex OAuth |
| DeepInfra 이미지 생성                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| OpenRouter 이미지 생성                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 이미지 생성                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Google Gemini 이미지 생성                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`   |

동일한 `image_generate` 도구가 텍스트-이미지 생성과 참조 이미지 편집을 처리합니다. 참조가 하나이면 `image`를, 여러 참조이면 `images`를 사용하세요. `quality`, `outputFormat`, `background`와 같이 공급자가 지원하는 출력 힌트는 사용할 수 있을 때 전달되며, 공급자가 지원하지 않으면 무시된 것으로 보고됩니다. 번들 투명 배경 지원은 OpenAI 전용입니다. 다른 공급자도 백엔드가 PNG 알파를 출력하는 경우 이를 보존할 수 있습니다.

## 지원되는 공급자

| 공급자   | 기본 모델                           | 편집 지원                       | 인증                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | 예(이미지 1개, 워크플로 구성) | 클라우드의 경우 `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY`    |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | 예(이미지 1개)                      | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | 예                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | 예                                | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | 예(입력 이미지 최대 5개)         | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | 예(피사체 참조)            | `MINIMAX_API_KEY` 또는 MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | 예(이미지 최대 4개)               | `OPENAI_API_KEY` 또는 OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | 예(입력 이미지 최대 5개)         | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | 아니요                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | 예(이미지 최대 5개)               | `XAI_API_KEY`                                         |

런타임에 사용 가능한 공급자와 모델을 검사하려면 `action: "list"`를 사용하세요.

```text
/tool image_generate action=list
```

## 공급자 기능

| 기능            | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| 생성(최대 개수)  | 워크플로 정의   | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| 편집 / 참조      | 이미지 1개(워크플로) | 이미지 1개   | 이미지 1개           | 이미지 최대 5개 | 이미지 1개(피사체 참조) | 이미지 최대 5개 | -     | 이미지 최대 5개 |
| 크기 제어          | -                  | ✓         | ✓                 | ✓              | -                     | 최대 4K       | -     | -              |
| 화면 비율          | -                  | -         | ✓(생성 전용) | ✓              | ✓                     | -              | -     | ✓              |
| 해상도(1K/2K/4K) | -                  | -         | ✓                 | ✓              | -                     | -              | -     | 1K, 2K         |

## 도구 매개변수

<ParamField path="prompt" type="string" required>
  이미지 생성 프롬프트입니다. `action: "generate"`에 필요합니다.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  런타임에 사용 가능한 공급자와 모델을 검사하려면 `"list"`를 사용하세요.
</ParamField>
<ParamField path="model" type="string">
  공급자/모델 재정의(예: `openai/gpt-image-2`)입니다. 투명 OpenAI 배경에는 `openai/gpt-image-1.5`를 사용하세요.
</ParamField>
<ParamField path="image" type="string">
  편집 모드용 단일 참조 이미지 경로 또는 URL입니다.
</ParamField>
<ParamField path="images" type="string[]">
  편집 모드용 여러 참조 이미지입니다(지원 공급자에서 최대 5개).
</ParamField>
<ParamField path="size" type="string">
  크기 힌트: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  화면 비율: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>해상도 힌트입니다.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  공급자가 지원할 때 사용하는 품질 힌트입니다.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  공급자가 지원할 때 사용하는 출력 형식 힌트입니다.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  공급자가 지원할 때 사용하는 배경 힌트입니다. 투명도를 지원하는 공급자의 경우 `transparent`를 `outputFormat: "png"` 또는 `"webp"`와 함께 사용하세요.
</ParamField>
<ParamField path="count" type="number">생성할 이미지 수(1-4)입니다.</ParamField>
<ParamField path="timeoutMs" type="number">선택적 공급자 요청 제한 시간(밀리초)입니다.</ParamField>
<ParamField path="filename" type="string">출력 파일 이름 힌트입니다.</ParamField>
<ParamField path="openai" type="object">
  OpenAI 전용 힌트: `background`, `moderation`, `outputCompression`, `user`.
</ParamField>

<Note>
모든 공급자가 모든 매개변수를 지원하는 것은 아닙니다. 대체 공급자가 정확히 요청된 옵션 대신 가까운 지오메트리 옵션을 지원하는 경우, OpenClaw는 제출 전에 가장 가까운 지원 크기, 화면 비율 또는 해상도로 다시 매핑합니다. 지원되지 않는 출력 힌트는 지원을 선언하지 않은 공급자에 대해 제거되고 도구 결과에 보고됩니다. 도구 결과는 적용된 설정을 보고하며, `details.normalization`은 요청에서 적용으로 변환된 내용을 기록합니다.
</Note>

## 구성

### 모델 선택

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### 공급자 선택 순서

OpenClaw는 다음 순서로 공급자를 시도합니다.

1. 도구 호출의 **`model` 매개변수**(에이전트가 지정한 경우).
2. 구성의 **`imageGenerationModel.primary`**.
3. 순서대로 **`imageGenerationModel.fallbacks`**.
4. **자동 감지** - 인증 기반 공급자 기본값만:
   - 현재 기본 공급자를 먼저 사용합니다.
   - 나머지 등록된 이미지 생성 공급자를 공급자 ID 순서로 사용합니다.

공급자가 실패하면(인증 오류, 속도 제한 등) 다음 구성 후보가 자동으로 시도됩니다. 모두 실패하면 오류에 각 시도의 세부 정보가 포함됩니다.

<AccordionGroup>
  <Accordion title="호출별 모델 재정의는 정확히 적용됩니다">
    호출별 `model` 재정의는 해당 공급자/모델만 시도하며 구성된 primary/fallback 또는 자동 감지된 공급자로 계속 진행하지 않습니다.
  </Accordion>
  <Accordion title="자동 감지는 인증을 고려합니다">
    OpenClaw가 실제로 해당 공급자를 인증할 수 있을 때만 공급자 기본값이 후보 목록에 들어갑니다. 명시적 `model`, `primary`, `fallbacks` 항목만 사용하려면 `agents.defaults.mediaGenerationAutoProviderFallback: false`를 설정하세요.
  </Accordion>
  <Accordion title="제한 시간">
    느린 이미지 백엔드에는 `agents.defaults.imageGenerationModel.timeoutMs`를 설정하세요. 호출별 `timeoutMs` 도구 매개변수는 구성된 기본값보다 우선합니다.
  </Accordion>
  <Accordion title="런타임에서 검사">
    현재 등록된 공급자, 해당 기본 모델, 인증 env-var 힌트를 검사하려면 `action: "list"`를 사용하세요.
  </Accordion>
</AccordionGroup>

### 이미지 편집

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI, xAI는 참조 이미지 편집을 지원합니다. 참조 이미지 경로 또는 URL을 전달하세요.

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google, xAI는 `images` 매개변수를 통해 최대 5개의 참조 이미지를 지원합니다. fal, MiniMax, ComfyUI는 1개를 지원합니다.

## 공급자 심층 분석

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2(및 gpt-image-1.5)">
    OpenAI 이미지 생성은 기본적으로 `openai/gpt-image-2`를 사용합니다. `openai-codex`
    OAuth 프로필이 구성되어 있으면 OpenClaw는 Codex 구독 채팅 모델에서 사용하는
    동일한 OAuth 프로필을 재사용하고 Codex Responses 백엔드를 통해 이미지 요청을
    보냅니다. `https://chatgpt.com/backend-api` 같은 레거시 Codex 기본 URL은 이미지
    요청에 대해 `https://chatgpt.com/backend-api/codex`로 정규화됩니다. OpenClaw는
    해당 요청에서 **자동으로** `OPENAI_API_KEY`로 대체하지 않습니다. 직접 OpenAI
    Images API 라우팅을 강제하려면 API 키, 사용자 지정 기본 URL 또는 Azure 엔드포인트로
    `models.providers.openai`를 명시적으로 구성하세요.

    `openai/gpt-image-1.5`, `openai/gpt-image-1`, `openai/gpt-image-1-mini`
    모델은 여전히 명시적으로 선택할 수 있습니다. 투명 배경 PNG/WebP 출력에는
    `gpt-image-1.5`를 사용하세요. 현재 `gpt-image-2` API는
    `background: "transparent"`를 거부합니다.

    `gpt-image-2`는 동일한 `image_generate` 도구를 통해 텍스트-이미지 생성과
    참조 이미지 편집을 모두 지원합니다. OpenClaw는 `prompt`, `count`, `size`,
    `quality`, `outputFormat`, 참조 이미지를 OpenAI로 전달합니다. OpenAI는
    `aspectRatio`나 `resolution`을 직접 받지 않습니다. 가능한 경우 OpenClaw가
    이를 지원되는 `size`로 매핑하고, 그렇지 않으면 도구가 무시된 재정의로
    보고합니다.

    OpenAI 전용 옵션은 `openai` 객체 아래에 있습니다.

    ```json
    {
      "quality": "low",
      "outputFormat": "jpeg",
      "openai": {
        "background": "opaque",
        "moderation": "low",
        "outputCompression": 60,
        "user": "end-user-42"
      }
    }
    ```

    `openai.background`는 `transparent`, `opaque`, `auto`를 허용합니다.
    투명 출력에는 `outputFormat` `png` 또는 `webp`와 투명도를 지원하는 OpenAI
    이미지 모델이 필요합니다. OpenClaw는 기본 `gpt-image-2` 투명 배경 요청을
    `gpt-image-1.5`로 라우팅합니다. `openai.outputCompression`은 JPEG/WebP 출력에
    적용됩니다.

    최상위 `background` 힌트는 공급자 중립적이며, 현재 OpenAI 공급자가 선택되면
    동일한 OpenAI `background` 요청 필드로 매핑됩니다. 배경 지원을 선언하지 않는
    공급자는 지원되지 않는 매개변수를 받는 대신 이를 `ignoredOverrides`로 반환합니다.

    OpenAI 이미지 생성을 `api.openai.com` 대신 Azure OpenAI 배포를 통해 라우팅하려면
    [Azure OpenAI 엔드포인트](/ko/providers/openai#azure-openai-endpoints)를 참조하세요.

  </Accordion>
  <Accordion title="OpenRouter 이미지 모델">
    OpenRouter 이미지 생성은 동일한 `OPENROUTER_API_KEY`를 사용하며 OpenRouter의
    채팅 완성 이미지 API를 통해 라우팅됩니다. `openrouter/` 접두사로 OpenRouter
    이미지 모델을 선택하세요.

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openrouter/google/gemini-3.1-flash-image-preview",
          },
        },
      },
    }
    ```

    OpenClaw는 `prompt`, `count`, 참조 이미지, Gemini 호환 `aspectRatio` /
    `resolution` 힌트를 OpenRouter로 전달합니다. 현재 내장 OpenRouter 이미지 모델
    바로 가기에는 `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview`, `openai/gpt-5.4-image-2`가 포함됩니다.
    구성된 Plugin이 무엇을 노출하는지 보려면 `action: "list"`를 사용하세요.

  </Accordion>
  <Accordion title="MiniMax 이중 인증">
    MiniMax 이미지 생성은 번들된 두 MiniMax 인증 경로를 통해 사용할 수 있습니다.

    - API 키 설정용 `minimax/image-01`
    - OAuth 설정용 `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    번들된 xAI 공급자는 프롬프트 전용 요청에 `/v1/images/generations`를 사용하고,
    `image` 또는 `images`가 있을 때 `/v1/images/edits`를 사용합니다.

    - 모델: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - 개수: 최대 4개
    - 참조: 하나의 `image` 또는 최대 다섯 개의 `images`
    - 종횡비: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 해상도: `1K`, `2K`
    - 출력: OpenClaw가 관리하는 이미지 첨부 파일로 반환됨

    OpenClaw는 공유 교차 공급자 `image_generate` 계약에 해당 컨트롤이 존재하기
    전까지 xAI 네이티브 `quality`, `mask`, `user` 또는 추가 네이티브 전용 종횡비를
    의도적으로 노출하지 않습니다.

  </Accordion>
</AccordionGroup>

## 예시

<Tabs>
  <Tab title="생성(4K 가로)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="생성(투명 PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

동등한 CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="생성(정사각형 두 개)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="편집(참조 하나)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="편집(여러 참조)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

동일한 `--output-format` 및 `--background` 플래그는 `openclaw infer image edit`에서도
사용할 수 있습니다. `--openai-background`는 OpenAI 전용 별칭으로 남아 있습니다.
OpenAI 이외의 번들 공급자는 현재 명시적 배경 제어를 선언하지 않으므로,
`background: "transparent"`는 해당 공급자에 대해 무시된 것으로 보고됩니다.

## 관련 항목

- [도구 개요](/ko/tools) - 사용 가능한 모든 에이전트 도구
- [ComfyUI](/ko/providers/comfy) - 로컬 ComfyUI 및 Comfy Cloud 워크플로 설정
- [fal](/ko/providers/fal) - fal 이미지 및 비디오 공급자 설정
- [Google (Gemini)](/ko/providers/google) - Gemini 이미지 공급자 설정
- [MiniMax](/ko/providers/minimax) - MiniMax 이미지 공급자 설정
- [OpenAI](/ko/providers/openai) - OpenAI Images 공급자 설정
- [Vydra](/ko/providers/vydra) - Vydra 이미지, 비디오 및 음성 설정
- [xAI](/ko/providers/xai) - Grok 이미지, 비디오, 검색, 코드 실행 및 TTS 설정
- [구성 참조](/ko/gateway/config-agents#agent-defaults) - `imageGenerationModel` 구성
- [모델](/ko/concepts/models) - 모델 구성 및 장애 조치
