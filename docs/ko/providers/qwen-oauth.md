---
read_when:
    - qwen-oauth 제공자 id를 구성하려고 합니다
    - 이전에 Qwen Portal OAuth 자격 증명을 사용했습니다
    - Qwen Portal 엔드포인트 또는 마이그레이션 가이드가 필요합니다
summary: Qwen Portal 공급자 ID를 OpenClaw와 함께 사용
title: Qwen OAuth / 포털
x-i18n:
    generated_at: "2026-06-27T18:04:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth`는 Qwen Portal 제공자 ID입니다. Qwen Portal 엔드포인트를 대상으로 하며
이전 Qwen OAuth / Portal 설정을 별도의 제공자 ID를 통해 계속 지정할 수 있게 합니다.

현재 `https://portal.qwen.ai/v1`용 Qwen Portal 토큰이 있거나, 이전 Qwen Portal /
Qwen CLI 설정을 마이그레이션하면서 해당 자격 증명을 표준 Qwen Cloud 제공자와
분리해 유지하려는 경우 이 제공자를 사용하세요. 새 Qwen 사용자에게 권장되는 첫 번째 선택지는 아닙니다.

새 Qwen Cloud 설정의 경우 현재 Qwen Portal 토큰이 특별히 있는 경우가 아니라면 Standard
ModelStudio 엔드포인트와 함께 [Qwen](/ko/providers/qwen)을 사용하는 것을 권장합니다.

## 설정

온보딩을 통해 Portal 토큰을 제공하세요.

```bash
openclaw onboard --auth-choice qwen-oauth
```

또는 다음을 설정하세요.

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## 기본값

- 제공자: `qwen-oauth`
- 별칭: `qwen-portal`, `qwen-cli`
- 기본 URL: `https://portal.qwen.ai/v1`
- 환경 변수: `QWEN_API_KEY`
- API 스타일: OpenAI 호환
- 기본 모델: `qwen-oauth/qwen3.5-plus`

## Qwen과의 차이점

OpenClaw에는 Qwen 대상 제공자 ID가 두 개 있습니다.

| 제공자       | 엔드포인트 계열                                          | 적합한 용도                                                                               |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope 및 Coding Plan 엔드포인트 | 새 API 키 설정, Standard 종량제, Coding Plan, 멀티모달 DashScope 기능 |
| `qwen-oauth` | `portal.qwen.ai/v1`의 Qwen Portal 엔드포인트              | 기존 Qwen Portal 토큰 및 레거시 Qwen OAuth / CLI 설정                         |

두 제공자는 모두 OpenAI 호환 요청 형태를 사용하지만, 인증 표면은 서로 분리되어
있습니다. `qwen-oauth`에 저장된 토큰은 DashScope 또는 ModelStudio 키로 취급해서는
안 되며, 새 DashScope 키는 대신 표준 `qwen` 제공자를 사용해야 합니다.

## Qwen OAuth / Portal을 선택해야 하는 경우

- 이미 작동하는 Qwen Portal 토큰이 있습니다.
- OpenClaw의 제공자 모델로 이동하면서 레거시 Qwen OAuth 또는 Qwen CLI 워크플로를
  보존하려고 합니다.
- Qwen Portal 엔드포인트와의 호환성을 구체적으로 테스트해야 합니다.

새 설정, 더 넓은 엔드포인트 선택지, Standard ModelStudio, Coding Plan, 전체 Qwen Plugin
카탈로그에는 [Qwen](/ko/providers/qwen)을 선택하세요.

## 모델

Qwen Plugin 카탈로그는 Qwen Portal 기본값을 시드합니다.

- `qwen-oauth/qwen3.5-plus`

사용 가능 여부는 현재 Qwen Portal 계정과 토큰에 따라 달라집니다. 계정이
ModelStudio / DashScope API 키를 대신 사용하는 경우 표준 `qwen` 제공자를 구성하세요.

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## 마이그레이션

레거시 Qwen Portal OAuth 프로필은 새로 고칠 수 없을 수 있습니다. Portal 프로필이
작동을 멈추면 현재 토큰으로 다시 인증하거나 Standard Qwen 제공자로 전환하세요.

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard 전역 ModelStudio는 다음을 사용합니다.

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## 문제 해결

- Portal OAuth 새로 고침 실패: 레거시 Qwen Portal OAuth 프로필은 새로 고칠 수
  없을 수 있습니다. 현재 토큰으로 온보딩을 다시 실행하세요.
- 잘못된 엔드포인트 오류: Portal 토큰을 사용할 때 모델 참조가 `qwen-oauth/`로
  시작하는지 확인하세요. `qwen/` 참조는 표준 Qwen 제공자에만 사용하세요.
- `QWEN_API_KEY` 혼동: 두 Qwen 페이지 모두 이 환경 변수를 언급하지만, 온보딩은
  선택한 제공자 ID 아래에 자격 증명을 저장합니다. 같은 머신에서 `qwen`과
  `qwen-oauth`를 모두 사용할 수 있게 유지하는 경우 온보딩을 사용하는 것을 권장합니다.

## 관련 항목

- [Qwen](/ko/providers/qwen)
- [Alibaba Model Studio](/ko/providers/alibaba)
- [모델 제공자](/ko/concepts/model-providers)
- [모든 제공자](/ko/providers/index)
