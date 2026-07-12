---
read_when:
    - OpenClaw에서 Featherless AI를 사용하려고 합니다
    - Featherless API 키 환경 변수 또는 모델 참조 형식이 필요합니다.
summary: Featherless AI 설정, 모델 선택 및 도구 호출
title: Featherless AI
x-i18n:
    generated_at: "2026-07-12T01:07:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai)는 OpenAI 호환 API를 통해 오픈 모델을 제공합니다. OpenClaw는 Featherless를 공식 외부 제공자 Plugin으로 설치하며, 기본 제공 카탈로그는 작게 유지하는 동시에 런타임에 Featherless의 정확한 모델 ID를 허용합니다.

| 속성            | 값                                       |
| --------------- | ---------------------------------------- |
| 제공자 ID       | `featherless`                            |
| 패키지          | `@openclaw/featherless-provider`         |
| 인증 환경 변수  | `FEATHERLESS_API_KEY`                    |
| 온보딩 플래그   | `--auth-choice featherless-api-key`      |
| 직접 CLI 플래그 | `--featherless-api-key <key>`            |
| API             | OpenAI 호환(`openai-completions`)        |
| 기본 URL        | `https://api.featherless.ai/v1`          |
| 기본 모델       | `featherless/Qwen/Qwen3-32B`             |

## 설정

Plugin을 설치하고 Gateway를 다시 시작합니다.

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

온보딩을 실행합니다.

```bash
openclaw onboard --auth-choice featherless-api-key
```

비대화형 설정의 경우:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

또는 Gateway 프로세스에 키를 제공합니다.

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

제공자를 확인합니다.

```bash
openclaw models list --provider featherless
```

## 기본 모델

Featherless가 Qwen 3 계열의 네이티브 도구 호출을 명시하고 있으므로, Plugin은 설정 기본값으로 `Qwen/Qwen3-32B`를 사용합니다. OpenClaw는 32,768토큰 컨텍스트 창, 보수적인 4,096토큰 출력 제한, Qwen 채팅 템플릿의 사고 제어 기능을 구성합니다.

Featherless는 여러 결제 방식을 지원하며 OpenClaw는 계정별 요금제 또는 요청별 가격을 포함하지 않으므로, 카탈로그의 비용 필드는 0입니다.

## 기타 Featherless 모델

`featherless/` 제공자 접두사 뒤에 정확한 Featherless 모델 ID를 사용합니다.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

OpenClaw는 Featherless의 전체 공개 모델 인덱스를 선택기에 의도적으로 복사하지 않습니다. 인덱스가 크고 모든 텍스트, 비전, 임베딩 및 추론 모델을 안전하게 분류하기에 충분한 구조화된 기능 메타데이터를 제공하지 않기 때문입니다. 따라서 알 수 없는 ID는 보수적인 텍스트 전용 비추론 기본값인 4,096토큰 컨텍스트 창과 1,024토큰 출력 제한으로 해석됩니다.

모델에 다른 메타데이터가 필요한 경우 명시적인 제공자 모델 항목을 추가합니다.

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

사용자 지정 메타데이터를 추가하기 전에 Featherless의 모델 카탈로그에서 현재 모델 가용성과 기능 태그를 확인하세요.

## 문제 해결

- `401` 또는 `403`: `FEATHERLESS_API_KEY`가 Gateway 프로세스에 노출되는지 확인하거나 온보딩을 다시 실행하세요.
- 알 수 없는 모델: `featherless/` 접두사 뒤에 Featherless의 정확한 대소문자 구분 ID를 사용하세요.
- 도구 호출이 텍스트로 반환됨: Qwen 3처럼 Featherless가 네이티브 함수 호출을 명시한 모델 계열을 선택하세요.
- 관리형 Gateway에서 키를 인식하지 못함: `~/.openclaw/.env` 또는 서비스가 로드하는 다른 환경 소스에 키를 넣은 다음 Gateway를 다시 시작하세요.

## 관련 문서

- [모델 제공자](/ko/concepts/model-providers)
- [모든 제공자](/ko/providers/index)
- [사고 모드](/ko/tools/thinking)
