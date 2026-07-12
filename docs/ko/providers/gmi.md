---
read_when:
    - GMI Cloud 모델로 OpenClaw를 실행하려고 합니다
    - GMI 공급자 ID, 키 또는 엔드포인트가 필요합니다.
summary: OpenClaw에서 GMI Cloud의 OpenAI 호환 API 사용하기
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-12T15:35:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud는 OpenAI 호환 API를 통해 프런티어 및 오픈 웨이트 모델을
제공하는 호스팅 추론 플랫폼입니다. OpenClaw에서는 공식 외부 제공자
Plugin입니다. 한 번 설치하고 일반적인 모델 인증을 통해 자격 증명을 저장한 후
`gmi/google/gemini-3.1-flash-lite`와 같은 모델 참조를 사용하십시오.

Anthropic, DeepSeek, Google, Moonshot, OpenAI 및 GMI 카탈로그에서 제공하는
Z.AI 경로를 비롯해 여러 호스팅 모델 제품군에 하나의 API 키를 사용하려면
GMI를 사용하십시오. 모델 폴백을 위한 보조 제공자, 여러 벤더의 호스팅 경로
비교, 또는 주 제공자보다 GMI에서 모델을 먼저 제공하는 경우에 활용할 수
있습니다. OpenClaw는 제공자 ID, 인증 프로필, 별칭, 모델 카탈로그 시드 및
기본 URL을 관리하며, GMI는 실시간 모델 가용성, 청구, 속도 제한 및 모든
제공자 측 라우팅 정책을 관리합니다.

| 속성          | 값                                       |
| ------------- | ---------------------------------------- |
| 제공자 ID     | `gmi` (별칭: `gmi-cloud`, `gmicloud`)   |
| 패키지        | `@openclaw/gmi-provider`                 |
| 인증 환경 변수 | `GMI_API_KEY`                            |
| API           | OpenAI 호환 (`openai-completions`)       |
| 기본 URL      | `https://api.gmi-serving.com/v1`         |
| 기본 모델     | `gmi/google/gemini-3.1-flash-lite`       |

## 설정

Plugin을 설치하고 Gateway를 다시 시작한 다음 GMI Cloud
(`https://www.gmicloud.ai/`)에서 API 키를 생성하십시오.

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

그런 다음 다음을 실행하십시오.

```bash
openclaw onboard --auth-choice gmi-api-key
```

비대화형 설정에서는 `--gmi-api-key <key>`를 전달하거나 다음을 설정할 수
있습니다.

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## GMI를 선택해야 하는 경우

- 로컬 모델 서버 대신 호스팅되는 OpenAI 호환 엔드포인트를 사용하려는 경우
- 하나의 제공자 계정을 통해 여러 상용 및 오픈 웨이트 모델 제품군을 사용해
  보려는 경우
- DeepInfra, OpenRouter, Together 또는 벤더 직접 API와 다른 업스트림
  라우팅을 사용하는 폴백 제공자가 필요한 경우
- GMI 전용 모델 ID, 가격 정책 또는 계정 제어 기능이 필요한 경우

GMI가 OpenAI 호환 경로를 통해 제공하지 않는 벤더 네이티브 기능이 필요한
경우에는 벤더 직접 제공자를 선택하십시오. 호스팅의 편의성보다 데이터 지역성
또는 로컬 GPU 제어가 더 중요한 경우에는 LM Studio, Ollama, SGLang 또는
vLLM과 같은 로컬 제공자를 선택하십시오.

## 모델

Plugin 카탈로그에는 일반적으로 사용할 수 있는 GMI Cloud 경로 ID가
시드로 포함됩니다.

| 모델 참조                           | 입력          | 컨텍스트  | 최대 출력 |
| ---------------------------------- | ------------ | --------- | ---------- |
| `gmi/anthropic/claude-sonnet-4.6`  | 텍스트 + 이미지 | 200,000   | 64,000     |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | 텍스트         | 163,840   | 65,536     |
| `gmi/google/gemini-3.1-flash-lite` | 텍스트 + 이미지 | 1,048,576 | 65,536     |
| `gmi/moonshotai/Kimi-K2.5`         | 텍스트 + 이미지 | 262,144   | 65,536     |
| `gmi/openai/gpt-5.4`               | 텍스트 + 이미지 | 400,000   | 128,000    |
| `gmi/zai-org/GLM-5.1-FP8`          | 텍스트         | 202,752   | 65,536     |

카탈로그는 시드일 뿐이며, 모든 계정에서 항상 모든 모델을 호출할 수 있음을
보장하지 않습니다. 현재 환경에서 구성된 제공자가 보고하는 모델을
나열하십시오.

```bash
openclaw models list --provider gmi
```

## 문제 해결

- `401` 또는 `403`: OpenClaw를 실행하는 프로세스에 `GMI_API_KEY`가
  설정되어 있는지 확인하거나, 온보딩을 다시 실행하여 제공자 인증 프로필에
  키를 저장하십시오.
- 알 수 없는 모델 오류: 해당 모델이 GMI 계정에 존재하는지 확인하고
  `openclaw models list --provider gmi`에 표시되는 전체
  `gmi/<route-id>` 참조를 사용하십시오.
- 간헐적인 제공자 오류: 다른 GMI 경로를 사용해 보거나 GMI를 유일한 주 모델
  제공자가 아닌 폴백으로 구성하십시오.

## 관련 문서

- [모델 제공자](/ko/concepts/model-providers)
- [모든 제공자](/ko/providers/index)
