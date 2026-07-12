---
read_when:
    - qwen-oauth 제공자 ID를 구성하려고 합니다
    - 이전에 Qwen Portal OAuth 자격 증명을 사용했습니다
    - Qwen Portal 엔드포인트 또는 마이그레이션 지침이 필요합니다
summary: OpenClaw에서 Qwen Portal 제공자 ID 사용하기
title: Qwen OAuth / 포털
x-i18n:
    generated_at: "2026-07-12T15:41:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth`는 Qwen Plugin(`@openclaw/qwen-provider`)에서 등록하는 Qwen Portal 제공자 ID입니다. `https://portal.qwen.ai/v1`의 Qwen Portal 엔드포인트를 대상으로 하며, 이전 Qwen OAuth/Portal 설정을 표준 `qwen` 제공자와 분리된 별도의 제공자 ID로 계속 사용할 수 있게 합니다.

이미 작동하는 Qwen Portal 토큰이 있거나, 기존 Qwen OAuth 또는 Qwen CLI 워크플로를 마이그레이션하거나, Qwen Portal 엔드포인트를 구체적으로 테스트해야 한다면 `qwen-oauth`를 선택하십시오. 새로 설정하는 경우에는 Standard ModelStudio 엔드포인트를 사용하는 [Qwen](/ko/providers/qwen)을 권장합니다. 신규 API 키 설정, 더 폭넓은 엔드포인트 선택지, Standard 종량제, Coding Plan 및 전체 Qwen Plugin 카탈로그를 지원합니다.

## 설정

Qwen Plugin을 아직 설치하지 않았다면 설치하십시오.

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

온보딩을 통해 Portal 토큰을 제공하십시오.

```bash
openclaw onboard --auth-choice qwen-oauth
```

비대화형 실행에서는 `--qwen-oauth-token <token>`에서 토큰을 읽습니다. 또는 다음과 같이 설정하십시오.

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

온보딩은 토큰을 `qwen-oauth` 인증 프로필에 저장하고 Portal 모델 카탈로그를 초기화하며, 구성된 모델이 없으면 `qwen-oauth/qwen3.5-plus`를 기본 모델로 설정합니다.

## 기본값

- 제공자: `qwen-oauth`
- 별칭: `qwen-portal`, `qwen-cli`
- 기본 URL: `https://portal.qwen.ai/v1`
- 환경 변수: `QWEN_API_KEY`
- API 형식: OpenAI 호환
- 기본 모델: `qwen-oauth/qwen3.5-plus`

## Qwen과의 차이점

OpenClaw에는 Qwen용 제공자 ID가 두 개 있습니다.

| 제공자       | 엔드포인트 계열                                           | 적합한 용도                                                                                   |
| ------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud/Alibaba DashScope 및 Coding Plan 엔드포인트     | 신규 API 키 설정, Standard 종량제, Coding Plan, 멀티모달 DashScope 기능                       |
| `qwen-oauth` | `portal.qwen.ai/v1`의 Qwen Portal 엔드포인트               | 기존 Qwen Portal 토큰 및 기존 Qwen OAuth/CLI 설정                                              |

두 제공자 모두 OpenAI 호환 요청 형식을 사용하지만 인증 영역은 서로 분리되어 있습니다. `qwen-oauth`용으로 저장된 토큰을 DashScope 또는 ModelStudio 키로 취급해서는 안 되며, 새 DashScope 키에는 표준 `qwen` 제공자를 사용해야 합니다.

## 모델

Qwen Plugin은 Qwen Portal 엔드포인트용으로 다음 정적 카탈로그를 초기화합니다. 모든 항목의 최대 출력은 65,536토큰이며, 사용 가능 여부는 현재 Qwen Portal 계정과 토큰에 따라 달라집니다.

| 모델 참조                         | 입력          | 컨텍스트  | 참고        |
| --------------------------------- | ------------- | --------- | ----------- |
| `qwen-oauth/qwen3.5-plus`         | 텍스트, 이미지 | 1,000,000 | 기본 모델   |
| `qwen-oauth/qwen3.6-plus`         | 텍스트, 이미지 | 1,000,000 |             |
| `qwen-oauth/qwen3-max-2026-01-23` | 텍스트         | 262,144   |             |
| `qwen-oauth/qwen3-coder-next`     | 텍스트         | 262,144   |             |
| `qwen-oauth/qwen3-coder-plus`     | 텍스트         | 1,000,000 |             |
| `qwen-oauth/MiniMax-M2.5`         | 텍스트         | 1,000,000 | 추론        |
| `qwen-oauth/glm-5`                | 텍스트         | 202,752   |             |
| `qwen-oauth/glm-4.7`              | 텍스트         | 202,752   |             |
| `qwen-oauth/kimi-k2.5`            | 텍스트, 이미지 | 262,144   |             |

계정에서 ModelStudio/DashScope API 키를 대신 사용한다면 표준 `qwen` 제공자를 구성하십시오.

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## 마이그레이션

기존 Qwen Portal OAuth 프로필은 갱신할 수 없으며, `openclaw doctor`가 이를 표시합니다. Portal 프로필이 작동을 중단하면 최신 토큰으로 온보딩을 다시 실행하거나 Standard Qwen 제공자로 전환하십시오.

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard 글로벌 ModelStudio는 다음을 사용합니다.

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## 문제 해결

- Portal OAuth 갱신 실패: 기존 Qwen Portal OAuth 프로필은 갱신할 수 없습니다. 최신 토큰으로 온보딩을 다시 실행하십시오.
- 잘못된 엔드포인트 오류: Portal 토큰을 사용할 때 모델 참조가 `qwen-oauth/`로 시작하는지 확인하십시오. `qwen/` 참조는 표준 Qwen 제공자에만 사용하십시오.
- `QWEN_API_KEY` 혼동: 두 Qwen 페이지 모두 이 환경 변수를 언급하지만, 온보딩은 선택한 제공자 ID에 자격 증명을 저장합니다. 동일한 시스템에서 `qwen`과 `qwen-oauth`를 모두 사용할 때는 온보딩을 권장합니다.

## 관련 문서

- [Qwen](/ko/providers/qwen)
- [Alibaba Model Studio](/ko/providers/alibaba)
- [모델 제공자](/ko/concepts/model-providers)
- [모든 제공자](/ko/providers/index)
