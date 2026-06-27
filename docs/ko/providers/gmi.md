---
read_when:
    - GMI Cloud 모델로 OpenClaw를 실행하려는 경우
    - GMI 공급자 ID, 키 또는 엔드포인트가 필요합니다
summary: OpenClaw에서 GMI Cloud의 OpenAI 호환 API 사용
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-27T18:01:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud는 OpenAI 호환 API 뒤에서 frontier 및 open-weight 모델을 제공하는 호스팅 추론 플랫폼입니다. OpenClaw에서는 공식 외부 제공자 Plugin이며, 한 번 설치한 뒤 제공자 id `gmi`로 선택하고, 일반 모델 인증을 통해 자격 증명을 저장하며, `gmi/google/gemini-3.1-flash-lite` 같은 모델 참조를 사용할 수 있습니다.

GMI의 카탈로그에 노출된 Google, Anthropic, OpenAI, DeepSeek, Moonshot, Z.AI 경로를 포함해 여러 호스팅 모델 제품군에 하나의 API 키를 사용하려는 경우 GMI를 사용하세요. 모델 폴백을 위한 보조 제공자, 공급업체 간 호스팅 경로 비교, 또는 기본 제공자보다 GMI에서 모델을 먼저 사용할 수 있는 경우에 유용합니다.

이 제공자는 OpenAI 호환 채팅 의미 체계를 사용합니다. OpenClaw는 제공자 id, 인증 프로필, 별칭, 모델 카탈로그 시드, 기본 URL을 소유하고, GMI는 실시간 모델 가용성, 청구, 속도 제한, 제공자 측 라우팅 정책을 소유합니다.

## 설정

Plugin을 설치하고 Gateway를 다시 시작한 다음 GMI Cloud에서 API 키를 생성합니다.

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

그런 다음 실행합니다.

```bash
openclaw onboard --auth-choice gmi-api-key
```

또는 다음을 설정합니다.

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## 기본값

- 제공자: `gmi`
- 별칭: `gmi-cloud`, `gmicloud`
- 기본 URL: `https://api.gmi-serving.com/v1`
- 환경 변수: `GMI_API_KEY`
- 기본 모델: `gmi/google/gemini-3.1-flash-lite`

## GMI를 선택해야 하는 경우

- 로컬 모델 서버가 아니라 호스팅 OpenAI 호환 엔드포인트를 원합니다.
- 하나의 제공자 계정으로 여러 상용 및 open-weight 모델 제품군을 사용해 보고 싶습니다.
- OpenRouter, DeepInfra, Together 또는 직접 공급업체 API와 다른 업스트림 라우팅을 가진 폴백 제공자가 필요합니다.
- GMI 전용 모델 id, 가격 또는 계정 제어가 필요합니다.

GMI가 OpenAI 호환 경로를 통해 노출하지 않는 공급업체 네이티브 기능이 필요한 경우에는 직접 공급업체 제공자를 선택하세요. 데이터 로컬리티 또는 로컬 GPU 제어가 호스팅 편의성보다 더 중요한 경우에는 Ollama, LM Studio, vLLM 또는 SGLang 같은 로컬 제공자를 선택하세요.

## 모델

Plugin 카탈로그는 다음을 포함해 일반적으로 사용 가능한 GMI Cloud 경로 id를 시드합니다.

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

카탈로그는 시드일 뿐, 모든 계정이 항상 모든 모델을 호출할 수 있다는 약속은 아닙니다. 구성된 제공자가 사용자 환경에서 무엇을 보고하는지 확인하려면 OpenClaw의 모델 목록 명령을 사용하세요.

```bash
openclaw models list --provider gmi
```

## 문제 해결

- `401` 또는 `403`: OpenClaw를 실행하는 프로세스에 `GMI_API_KEY`가 설정되어 있는지 확인하거나, 온보딩을 다시 실행해 제공자 인증 프로필에 키를 저장하세요.
- 알 수 없는 모델 오류: 모델이 GMI 계정에 존재하는지 확인하고, `openclaw models list --provider gmi`에 표시되는 전체 `gmi/<route-id>` 참조를 사용하세요.
- 간헐적인 제공자 오류: 다른 GMI 경로를 시도하거나, GMI를 유일한 기본 모델 제공자가 아니라 폴백으로 구성하세요.

## 관련 항목

- [모델 제공자](/ko/concepts/model-providers)
- [모든 제공자](/ko/providers/index)
