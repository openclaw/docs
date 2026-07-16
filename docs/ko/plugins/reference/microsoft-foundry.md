---
read_when:
    - microsoft-foundry Plugin을 설치, 구성 또는 감사하고 있습니다
summary: OpenClaw에 Microsoft Foundry 모델 제공자 지원을 추가합니다.
title: Microsoft Foundry Plugin
x-i18n:
    generated_at: "2026-07-16T12:55:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2ea554ce16cffeb4cc315e53d986d6f07b5e113fbb844c61c6575f19f8ad291
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry Plugin

OpenClaw에 Microsoft Foundry 모델 공급자 지원을 추가합니다.

## 배포

- 패키지: `@openclaw/microsoft-foundry`
- 설치 경로: OpenClaw에 포함됨

## 표면

공급자: `microsoft-foundry`; 계약: `imageGenerationProviders`

<!-- openclaw-plugin-reference:manual-start -->

- 이미지 생성 공급자: `microsoft-foundry`

## 요구 사항

- 배포가 있는 Microsoft Foundry 또는 Azure AI Foundry 리소스.
- `AZURE_OPENAI_API_KEY` 또는 구성된 공급자 API 키를 통한 API 키 인증.
- Entra ID 인증의 경우 온보딩 전에 Azure CLI를 설치하고
  `az login`을 실행하십시오. OpenClaw는
  `az account get-access-token`을 통해 Microsoft Foundry 런타임 토큰을 갱신합니다.

## 채팅 모델

Microsoft Foundry 채팅 배포는 공급자 모델 참조
`microsoft-foundry/<deployment-name>`을 사용합니다. 온보딩은 Azure CLI를 사용하여 Foundry 리소스와
배포를 검색한 다음, 선택한 배포 이름을 모델 구성에 기록합니다.

OpenClaw는 지원되는 OpenAI 호환 채팅 API에 Foundry
`/openai/v1` 엔드포인트를 사용합니다.

- GPT, `o*`, `computer-use-preview`, DeepSeek-V4 모델 계열의 기본값은
  `openai-responses`입니다.
- MAI-DS-R1 및 기타 채팅 완성 배포는 지원되는 API가 명시적으로 구성되지 않은 경우
  `openai-completions`을 사용합니다.
- MAI-DS-R1은 `reasoning_effort`이 아니라 추론 콘텐츠를 통해
  추론 기능이 있는 것으로 기록됩니다. 컨텍스트 및 출력 토큰 메타데이터는
  163,840토큰입니다.

Microsoft Foundry의 Anthropic Claude 배포는 OpenAI 호환
`/openai/v1` 형식이 아니라 Anthropic Messages API 형식을 사용합니다. Microsoft Foundry Plugin에
네이티브 Anthropic 런타임이 추가될 때까지 이를 사용자 지정
`anthropic-messages` 공급자로 구성하십시오. Foundry 배포 이름이 Claude 모델 ID와 다른 경우,
모델 항목에 `params.canonicalModelId`을 설정하여 OpenClaw가
모델별 통신 계약을 적용하고, `/think off`을 올바르게 매핑하며,
서명된 사고 과정을 안전하게 보존할 수 있도록 하십시오.

## MAI 이미지 생성

Plugin은 현재 Microsoft AI 이미지 모델과 함께 `image_generate`용
`microsoft-foundry`을 등록합니다.

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

배포된 MAI 이미지 배포 이름을 모델 참조로 사용하십시오. MAI API에서는 요청의
`model` 필드에 배포 이름이 필요하므로 공급자는
기본 이미지 모델을 선언하지 않습니다.

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

프롬프트 전용 생성은 Microsoft Foundry의 MAI 생성 엔드포인트
`/mai/v1/images/generations`을 호출합니다. 참조 이미지 편집은
`/mai/v1/images/edits`을 호출하며 `MAI-Image-2.5-Flash` 및
`MAI-Image-2.5` 배포로 제한됩니다.

프롬프트 전용 생성은 Foundry 엔드포인트만 구성하여 사용자 지정 배포 이름을 사용할 수 있습니다.
사용자 지정 배포 이름으로 이미지를 편집하려면 온보딩을 통해 배포를 선택하거나,
OpenClaw가 해당 배포가 `MAI-Image-2.5-Flash` 또는 `MAI-Image-2.5`을 기반으로 하는지
확인할 수 있도록 모델 메타데이터를 포함하십시오.

MAI 이미지 제약 사항:

- 출력: 요청당 PNG 이미지 1개.
- 크기: 기본값 `1024x1024`; 너비와 높이는 모두 최소 768px여야 합니다.
- 총 픽셀 수: 너비 × 높이는 최대 1,048,576이어야 합니다.
- 편집: PNG 또는 JPEG 입력 이미지 1개.
- `aspectRatio`, `resolution`, `quality`,
  `background` 및 PNG가 아닌 `outputFormat`과 같은 지원되지 않는 공통 힌트는 Microsoft Foundry로 전송되지 않습니다.

## 문제 해결

- `az: command not found`: Azure CLI를 설치하거나 API 키 인증을 사용하십시오.
- `Microsoft Foundry endpoint missing for MAI image generation`: 온보딩을 통해
  Foundry 배포를 선택하거나 `models.providers.microsoft-foundry.baseUrl`을 추가하십시오.
- `supports MAI image deployments only`: 선택한 이미지 모델이
  MAI가 아닌 배포를 가리킵니다. `image_generate`에는 배포된 MAI 이미지 모델을 사용하십시오.

<!-- openclaw-plugin-reference:manual-end -->
