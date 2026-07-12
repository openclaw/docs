---
read_when:
    - 에이전트를 통한 이미지 생성 또는 편집
    - 이미지 생성 제공업체 및 모델 구성하기
    - image_generate 도구 매개변수 이해하기
sidebarTitle: Image generation
summary: OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra에서 image_generate를 통해 이미지 생성 및 편집
title: 이미지 생성
x-i18n:
    generated_at: "2026-07-12T01:15:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` 도구는 구성된 제공자를 통해 이미지를 생성하고 편집합니다.
채팅 세션에서는 비동기식으로 실행됩니다. OpenClaw는 백그라운드 작업을
기록하고 작업 ID를 즉시 반환한 다음, 제공자의 작업이 완료되면 에이전트를
깨웁니다. 완료 에이전트는 세션의 일반적인 표시 응답 모드를 따릅니다.
구성된 경우 최종 응답을 자동으로 전달하고, 세션에서 메시지 도구가 필요한
경우에는 `message(action="send")`를 사용합니다. 요청자 세션이 비활성
상태이거나 활성 깨우기가 실패하면 OpenClaw는 생성된 이미지와 함께
멱등성이 보장되는 직접 대체 응답을 전송하여 결과가 유실되지 않도록 합니다.

<Note>
이 도구는 이미지 생성 제공자가 하나 이상 사용 가능할 때만 표시됩니다.
에이전트 도구에 `image_generate`가 표시되지 않으면
`agents.defaults.imageGenerationModel`을 구성하거나, 제공자 API 키를
설정하거나, OpenAI ChatGPT/Codex OAuth로 로그인하세요.
</Note>

## 빠른 시작

<Steps>
  <Step title="인증 구성">
    하나 이상의 제공자에 대한 API 키(예: `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`)를 설정하거나 OpenAI Codex OAuth로 로그인합니다.
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

    ChatGPT/Codex OAuth는 동일한 `openai/gpt-image-2` 모델 참조를 사용합니다.
    `openai` OAuth 프로필이 구성되어 있으면 OpenClaw는 먼저
    `OPENAI_API_KEY`를 시도하는 대신 해당 OAuth 프로필을 통해 이미지
    요청을 라우팅합니다. 명시적인 `models.providers.openai` 구성(API 키,
    사용자 지정/Azure 기본 URL)을 사용하면 직접 OpenAI Images API 경로를
    다시 사용하도록 선택합니다.

  </Step>
  <Step title="에이전트에 요청">
    _"친근한 로봇 마스코트 이미지를 생성해 줘."_

    에이전트가 `image_generate`를 자동으로 호출합니다. 도구 허용 목록을
    구성할 필요는 없습니다. 제공자가 사용 가능하면 기본적으로 활성화됩니다.
    도구는 백그라운드 작업 ID를 반환하며, 준비가 완료되면 완료 에이전트가
    `message` 도구를 통해 생성된 첨부 파일을 전송합니다.

  </Step>
</Steps>

<Warning>
LocalAI와 같은 OpenAI 호환 LAN 엔드포인트를 사용할 때는 사용자 지정
`models.providers.openai.baseUrl`을 유지하고
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`를 설정하여
명시적으로 사용을 허용하세요. 비공개 및 내부 이미지 엔드포인트는
기본적으로 계속 차단됩니다.
</Warning>

## 일반적인 경로

| 목표                                                   | 모델 참조                                          | 인증                                           |
| ------------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------- |
| API 과금 방식의 OpenAI 이미지 생성                     | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                               |
| Codex 구독 인증을 사용하는 OpenAI 이미지 생성          | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth                     |
| OpenAI 투명 배경 PNG/WebP                              | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` 또는 OpenAI Codex OAuth       |
| DeepInfra 이미지 생성                                  | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                            |
| fal Krea 2 표현형/스타일 지정 생성                     | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                                      |
| OpenRouter 이미지 생성                                 | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                           |
| LiteLLM 이미지 생성                                    | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                              |
| Microsoft Foundry MAI 이미지 생성                      | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` 또는 Entra ID           |
| Google Gemini 이미지 생성                              | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`         |

동일한 도구가 텍스트 기반 이미지 생성과 참조 이미지 편집을 모두 처리합니다.
참조 이미지가 하나이면 `image`, 여러 개이면 `images`를 사용하세요. fal의
Krea 2 모델에서는 해당 참조가 편집 입력이 아닌 스타일 참조로 전송됩니다.
`quality`, `outputFormat`, `background`와 같이 제공자가 지원하는 출력
힌트는 가능한 경우 전달되며, 제공자가 지원을 선언하지 않은 경우 무시된
것으로 보고됩니다. 번들로 제공되는 투명 배경 지원은 OpenAI 전용입니다.
다른 제공자도 백엔드에서 PNG 알파를 출력하는 경우 투명도를 유지할 수
있습니다.

## 지원되는 제공자

| 제공자            | 기본 모델                               | 편집 지원                             | 인증                                                  |
| ----------------- | --------------------------------------- | ------------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | 예(이미지 1개, 워크플로 구성에 따름)  | 클라우드의 경우 `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY` |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | 예(이미지 1개)                        | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | 예(모델별 제한 적용)                  | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | 예(최대 이미지 5개)                   | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`                |
| LiteLLM           | `gpt-image-2`                           | 예(입력 이미지 최대 5개)              | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | 예(MAI-Image-2.5 모델만 해당)         | `AZURE_OPENAI_API_KEY` 또는 Entra ID(`az login`)      |
| MiniMax           | `image-01`                              | 예(피사체 참조)                       | `MINIMAX_API_KEY` 또는 MiniMax OAuth(`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | 예(최대 이미지 5개)                   | `OPENAI_API_KEY` 또는 OpenAI ChatGPT/Codex OAuth      |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | 예(입력 이미지 최대 5개)              | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | 아니요                                | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | 예(최대 이미지 3개)                   | `XAI_API_KEY`                                         |

런타임에 사용 가능한 제공자와 모델을 확인하려면 `action: "list"`를
사용하세요.

```text
/tool image_generate action=list
```

현재 세션에서 활성 상태인 이미지 생성 작업을 확인하려면
`action: "status"`를 사용하세요.

```text
/tool image_generate action=status
```

## 제공자 기능

| 기능                  | ComfyUI                | DeepInfra    | fal                                              | Google            | Microsoft Foundry | MiniMax                 | OpenAI            | Vydra | xAI               |
| --------------------- | ---------------------- | ------------ | ------------------------------------------------ | ----------------- | ----------------- | ----------------------- | ----------------- | ----- | ----------------- |
| 생성(최대 개수)       | 1                      | 4            | 4                                                | 4                 | 1                 | 9                       | 4                 | 1     | 4                 |
| 편집/참조             | 이미지 1개(워크플로)   | 이미지 1개   | Flux: 1; GPT: 10; Krea 스타일 참조: 10; NB2: 14 | 최대 이미지 5개   | 이미지 1개        | 이미지 1개(피사체 참조) | 최대 이미지 5개   | -     | 최대 이미지 3개   |
| 크기 제어             | -                      | ✓            | ✓                                                | ✓                 | ✓                 | -                       | 최대 4K           | -     | -                 |
| 종횡비                | -                      | -            | ✓                                                | ✓                 | -                 | ✓                       | -                 | -     | ✓                 |
| 해상도(1K/2K/4K)     | -                      | -            | ✓                                                | ✓                 | -                 | -                       | -                 | -     | 1K, 2K            |

## 도구 매개변수

<ParamField path="prompt" type="string" required>
  이미지 생성 프롬프트입니다. `action: "generate"`에 필수입니다.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  활성 세션 작업을 확인하려면 `"status"`를, 런타임에 사용 가능한 제공자와
  모델을 확인하려면 `"list"`를 사용합니다.
</ParamField>
<ParamField path="model" type="string">
  제공자/모델 재정의입니다(예: `openai/gpt-image-2`). 투명한 OpenAI 배경에는
  `openai/gpt-image-1.5`를 사용합니다.
</ParamField>
<ParamField path="image" type="string">
  편집 모드용 단일 참조 이미지 경로 또는 URL입니다.
</ParamField>
<ParamField path="images" type="string[]">
  편집 모드 또는 스타일 참조 모델용 여러 참조 이미지입니다(공유 도구를 통해
  최대 14개이며, 제공자별 제한은 계속 적용됩니다).
</ParamField>
<ParamField path="size" type="string">
  크기 힌트: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  종횡비: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`. 제공자는 각 모델에서 지원하는 하위 집합을 검증합니다.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>해상도 힌트입니다.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  제공자가 지원하는 경우의 품질 힌트입니다.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  제공자가 지원하는 경우의 출력 형식 힌트입니다.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  제공자가 지원하는 경우의 배경 힌트입니다. 투명도를 지원하는 제공자에서는
  `transparent`를 `outputFormat: "png"` 또는 `"webp"`와 함께 사용합니다.
</ParamField>
<ParamField path="count" type="number">생성할 이미지 수입니다(1~4개).</ParamField>
<ParamField path="timeoutMs" type="number">
  선택적인 제공자 요청 제한 시간(밀리초)입니다. Codex가 동적 도구를 통해
  `image_generate`를 호출하는 경우에도 이 호출별 값은 구성된 기본값을
  재정의하며 최대 600000ms로 제한됩니다.
</ParamField>
<ParamField path="filename" type="string">출력 파일 이름 힌트입니다.</ParamField>
<ParamField path="openai" type="object">
  OpenAI 전용 힌트: `background`, `moderation`, `outputCompression`, `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 창의성 제어입니다. 기본값은 `medium`입니다.
</ParamField>

<Note>
모든 제공자가 모든 매개변수를 지원하는 것은 아닙니다. 대체 제공자가 정확히
요청된 기하 옵션 대신 유사한 옵션을 지원하는 경우, OpenClaw는 제출 전에
가장 가까운 지원 크기, 종횡비 또는 해상도로 다시 매핑합니다. 지원을 선언하지
않은 제공자에서는 지원되지 않는 출력 힌트를 제거하고 도구 결과에 보고합니다.
도구 결과에는 적용된 설정이 보고되며, `details.normalization`에는 요청된
설정에서 적용된 설정으로의 변환 내용이 기록됩니다.
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

### 제공자 선택 순서

OpenClaw는 다음 순서로 제공자를 시도합니다.

1. 도구 호출의 **`model` 매개변수**(에이전트가 지정한 경우).
2. 구성의 **`imageGenerationModel.primary`**.
3. 순서대로 적용되는 **`imageGenerationModel.fallbacks`**.
4. **자동 감지** - 인증이 설정된 제공자의 기본값만 사용:
   - 현재 기본 제공자를 먼저 사용;
   - 나머지 등록된 이미지 생성 제공자를 제공자 ID 순서로 사용.

제공자가 실패하면(인증 오류, 사용량 제한 등) 다음으로 구성된
후보를 자동으로 시도합니다. 모두 실패하면 오류에 각 시도의
세부 정보가 포함됩니다.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    호출별 `model` 재정의는 해당 제공자/모델만 시도하며,
    구성된 기본/폴백 또는 자동 감지된 제공자로 계속 진행하지 않습니다.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    OpenClaw가 해당 제공자를 실제로 인증할 수 있는 경우에만 제공자
    기본값이 후보 목록에 추가됩니다. 명시적인 `model`, `primary`,
    `fallbacks` 항목만 사용하려면
    `agents.defaults.mediaGenerationAutoProviderFallback: false`로 설정합니다.
  </Accordion>
  <Accordion title="Timeouts">
    이미지 백엔드가 느린 경우 `agents.defaults.imageGenerationModel.timeoutMs`를
    설정합니다. 호출별 `timeoutMs` 도구 매개변수는 구성된 기본값보다 우선하고,
    구성된 기본값은 Plugin에서 작성한 제공자 기본값보다 우선합니다. Google 및
    OpenRouter 호스팅 이미지 제공자의 기본값은 180초이고, Microsoft Foundry
    MAI, xAI 및 Azure OpenAI 이미지 생성의 기본값은 600초입니다. Codex 동적
    도구 호출은 `image_generate` 브리지 기본값으로 120초를 사용하며, 구성된
    경우 동일한 시간 제한 예산을 준수하되 OpenClaw의 동적 도구 브리지 최댓값인
    600000ms로 제한됩니다.
  </Accordion>
  <Accordion title="Inspect at runtime">
    `action: "list"`를 사용하여 현재 등록된 제공자, 각 제공자의 기본 모델,
    인증 환경 변수 힌트를 확인합니다.
  </Accordion>
</AccordionGroup>

### 이미지 편집

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI 및 xAI는 참조 이미지 편집을 지원합니다. fal의 Krea 2 모델에서는
동일한 `image` / `images` 필드를 편집 입력이 아닌 스타일 참조로 사용합니다.
참조 이미지 경로 또는 URL을 전달합니다.

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter 및 Google은 `images` 매개변수로 최대 5개의 참조 이미지를
지원하고, xAI는 최대 3개를 지원합니다. fal은 Flux 이미지 간 변환에 참조 이미지
1개, GPT Image 2 편집에 최대 10개, Krea 2 스타일 참조에 최대 10개, Nano
Banana 2 편집에 최대 14개를 지원합니다. Microsoft Foundry, MiniMax 및
ComfyUI는 1개를 지원합니다.

## 제공자 상세 설명

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    OpenAI 이미지 생성의 기본값은 `openai/gpt-image-2`입니다.
    `openai` OAuth 프로필이 구성되어 있으면 OpenClaw는 Codex 구독 채팅
    모델에서 사용하는 것과 동일한 OAuth 프로필을 재사용하고 Codex Responses
    백엔드를 통해 이미지 요청을 전송합니다. `https://chatgpt.com/backend-api`
    같은 레거시 Codex 기본 URL은 이미지 요청 시
    `https://chatgpt.com/backend-api/codex`로 정규화됩니다. OpenClaw는
    해당 요청에서 `OPENAI_API_KEY`로 **자동 폴백하지 않습니다**. OpenAI
    Images API로 직접 라우팅하려면 API 키, 사용자 지정 기본 URL 또는 Azure
    엔드포인트를 사용하여 `models.providers.openai`를 명시적으로 구성합니다.

    `openai/gpt-image-1.5`, `openai/gpt-image-1` 및
    `openai/gpt-image-1-mini` 모델도 명시적으로 선택할 수 있습니다.
    투명 배경 PNG/WebP 출력에는 `gpt-image-1.5`를 사용합니다. 현재
    `gpt-image-2` API는 `background: "transparent"`를 거부합니다.

    `gpt-image-2`는 동일한 `image_generate` 도구를 통한 텍스트 기반 이미지
    생성과 참조 이미지 편집을 모두 지원합니다. OpenClaw는 `prompt`, `count`,
    `size`, `quality`, `outputFormat` 및 참조 이미지를 OpenAI로 전달합니다.
    OpenAI는 `aspectRatio` 또는 `resolution`을 직접 수신하지 않습니다.
    가능한 경우 OpenClaw가 이를 지원되는 `size`로 매핑하며, 그렇지 않으면
    도구가 무시된 재정의로 보고합니다.

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

    `openai.background`에는 `transparent`, `opaque` 또는 `auto`를 사용할
    수 있습니다. 투명 출력에는 `outputFormat`이 `png` 또는 `webp`여야 하며,
    투명도를 지원하는 OpenAI 이미지 모델이 필요합니다. OpenClaw는 기본
    `gpt-image-2` 투명 배경 요청을 `gpt-image-1.5`로 라우팅합니다.
    `openai.outputCompression`은 JPEG/WebP 출력에 적용되고 PNG 출력에서는
    무시됩니다.

    최상위 `background` 힌트는 제공자 중립적이며, 현재 OpenAI 제공자가
    선택된 경우 동일한 OpenAI `background` 요청 필드에 매핑됩니다. 배경
    지원을 선언하지 않은 제공자는 지원되지 않는 매개변수를 수신하는 대신
    이를 `ignoredOverrides`에 반환합니다.

    OpenAI 이미지 생성을 `api.openai.com` 대신 Azure OpenAI 배포를 통해
    라우팅하려면
    [Azure OpenAI 엔드포인트](/ko/providers/openai#azure-openai-endpoints)를
    참조하세요.

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    Microsoft Foundry 이미지 생성은 `microsoft-foundry/` 제공자 접두사 아래의
    배포된 MAI 이미지 배포 이름을 사용합니다. MAI API가 `model` 필드에 사용자의
    배포 이름을 요구하므로 제공자 수준의 기본 모델은 없습니다.

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    이 제공자는 OpenAI Images API가 아니라 Microsoft Foundry의 MAI API를
    사용합니다.

    - 생성 엔드포인트: `/mai/v1/images/generations`
    - 편집 엔드포인트: `/mai/v1/images/edits`
    - 인증: `AZURE_OPENAI_API_KEY` / 제공자 API 키 또는 `az login`을 통한 Entra ID
    - 출력: PNG 이미지 1개
    - 크기: 기본값 `1024x1024`; 너비와 높이는 각각 768px 이상이어야 하며,
      총 픽셀 수는 1,048,576 이하여야 함
    - 편집: PNG 또는 JPEG 참조 이미지 1개,
      `MAI-Image-2.5-Flash` 및 `MAI-Image-2.5` 배포에서만 지원

    프롬프트만 사용하는 생성은 Foundry 엔드포인트만 구성한 상태에서 사용자 지정
    배포 이름을 사용할 수 있습니다. 사용자 지정 배포 이름으로 편집하려면 해당 배포가
    `MAI-Image-2.5-Flash` 또는 `MAI-Image-2.5`를 기반으로 하는지 OpenClaw가
    확인할 수 있도록 온보딩/모델 메타데이터가 필요합니다.

    현재 MAI 이미지 모델은 `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` 및 `MAI-Image-2`입니다. 설정 및 채팅 모델 동작은
    [Microsoft Foundry Plugin](/ko/plugins/reference/microsoft-foundry)을
    참조하세요.

  </Accordion>
  <Accordion title="OpenRouter image models">
    OpenRouter 이미지 생성은 동일한 `OPENROUTER_API_KEY`를 사용하며
    OpenRouter의 채팅 완성 이미지 API를 통해 라우팅됩니다. `openrouter/`
    접두사를 사용하여 OpenRouter 이미지 모델을 선택합니다.

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

    OpenClaw는 `prompt`, `count`, 참조 이미지 및 Gemini 호환
    `aspectRatio` / `resolution` 힌트를 OpenRouter로 전달합니다. 현재 내장된
    OpenRouter 이미지 모델 단축 이름에는
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` 및 `openai/gpt-5.4-image-2`가
    포함됩니다. 구성된 Plugin이 노출하는 항목을 확인하려면
    `action: "list"`를 사용합니다.

  </Accordion>
  <Accordion title="fal Krea 2">
    fal의 Krea 2 모델은 Flux에서 사용하는 일반 `image_size` 스키마 대신
    fal의 네이티브 Krea 스키마를 사용합니다. OpenClaw는 다음을 전송합니다.

    - 종횡비 힌트용 `aspect_ratio`
    - 기본값이 `medium`인 `creativity`
    - `image` 또는 `images`가 제공된 경우 `image_style_references`

    더 빠르고 표현력 있는 일러스트레이션에는 Krea 2 Medium을 선택하고,
    더 느리지만 세밀하고 사실적이며 질감이 풍부한 표현에는 Krea 2 Large를
    선택합니다.

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

    현재 Krea 2는 요청당 이미지 1개를 반환합니다. Krea에는 `aspectRatio`를
    사용하는 것이 좋습니다. OpenClaw는 `size`를 가장 가까운 지원 Krea
    종횡비로 매핑하며, `resolution`은 누락시키지 않고 거부합니다. Krea 네이티브
    창의성 수준을 사용하려면 `fal.creativity`를 사용합니다.

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    MiniMax 이미지 생성은 번들로 제공되는 두 MiniMax 인증 경로를 통해
    사용할 수 있습니다.

    - API 키 설정용 `minimax/image-01`
    - OAuth 설정용 `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    번들로 제공되는 xAI 제공자는 프롬프트만 있는 요청에
    `/v1/images/generations`를 사용하고, `image` 또는 `images`가 있으면
    `/v1/images/edits`를 사용합니다.

    - 모델: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - 개수: 최대 4개
    - 참조: `image` 1개 또는 `images` 최대 3개
    - 종횡비: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - 해상도: `1K`, `2K`
    - 출력: OpenClaw가 관리하는 이미지 첨부 파일로 반환

    OpenClaw는 공유 교차 제공자 `image_generate` 계약에 해당 제어 기능이
    존재할 때까지 xAI 네이티브 `quality`, `mask`, `user` 또는 `auto`
    종횡비를 의도적으로 노출하지 않습니다.

  </Accordion>
</AccordionGroup>

## 예시

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
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
  <Tab title="Generate (OpenAI low quality)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

동등한 CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="생성(정사각형 두 개)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="차분한 생산성 앱 아이콘을 위한 두 가지 시각적 방향" size=1024x1024 count=2
```
  </Tab>
  <Tab title="편집(참조 이미지 하나)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="피사체는 유지하고 배경을 밝은 스튜디오 환경으로 교체" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="편집(참조 이미지 여러 개)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="첫 번째 이미지의 캐릭터 정체성과 두 번째 이미지의 색상 팔레트를 결합" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea 스타일 참조">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="이 색상 팔레트와 인쇄 질감을 사용한 표현력 풍부한 편집 화보풍 인물 사진" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

동일한 `--output-format`, `--background`, `--quality`,
`--openai-moderation` 플래그를 `openclaw infer image edit`에서도 사용할 수 있으며,
`--openai-background`는 OpenAI 전용 별칭으로 유지됩니다. 현재 OpenAI 이외의
번들 제공자는 명시적인 배경 제어를 선언하지 않으므로, 해당 제공자에서는
`background: "transparent"`가 무시된 것으로 보고됩니다.

## 관련 문서

- [도구 개요](/ko/tools) - 사용 가능한 모든 에이전트 도구
- [ComfyUI](/ko/providers/comfy) - 로컬 ComfyUI 및 Comfy Cloud 워크플로 설정
- [fal](/ko/providers/fal) - fal 이미지 및 동영상 제공자 설정
- [Google (Gemini)](/ko/providers/google) - Gemini 이미지 제공자 설정
- [Microsoft Foundry Plugin](/ko/plugins/reference/microsoft-foundry) - Microsoft Foundry 채팅 및 MAI 이미지 설정
- [MiniMax](/ko/providers/minimax) - MiniMax 이미지 제공자 설정
- [OpenAI](/ko/providers/openai) - OpenAI Images 제공자 설정
- [Vydra](/ko/providers/vydra) - Vydra 이미지, 동영상 및 음성 설정
- [xAI](/ko/providers/xai) - Grok 이미지, 동영상, 검색, 코드 실행 및 TTS 설정
- [구성 참조](/ko/gateway/config-agents#agent-defaults) - `imageGenerationModel` 구성
- [모델](/ko/concepts/models) - 모델 구성 및 장애 조치
