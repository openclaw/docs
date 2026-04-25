---
read_when:
    - Gateway, workspace, 인증, 채널, Skills에 대한 안내형 설정을 원합니다
summary: '`openclaw onboard`용 CLI 참조(대화형 온보딩)'
title: 온보드
x-i18n:
    generated_at: "2026-04-25T05:58:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b09191f95ff6012c340976dbae1045d24b736a9e9e06fc4e15e1f15785f20f5
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

로컬 또는 원격 Gateway 설정을 위한 대화형 온보딩입니다.

## 관련 가이드

- CLI 온보딩 허브: [온보딩(CLI)](/ko/start/wizard)
- 온보딩 개요: [온보딩 개요](/ko/start/onboarding-overview)
- CLI 온보딩 참조: [CLI 설정 참조](/ko/start/wizard-cli-reference)
- CLI 자동화: [CLI 자동화](/ko/start/wizard-cli-automation)
- macOS 온보딩: [온보딩(macOS 앱)](/ko/start/onboarding)

## 예시

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

평문 사설 네트워크 `ws://` 대상(신뢰된 네트워크 전용)의 경우,
온보딩 프로세스 환경에서 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하세요.
이 클라이언트 측 전송 긴급 우회에는 `openclaw.json` 대응 항목이 없습니다.

비대화형 사용자 지정 프로바이더:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

비대화형 모드에서 `--custom-api-key`는 선택 사항입니다. 생략하면 온보딩은 `CUSTOM_API_KEY`를 확인합니다.

LM Studio도 비대화형 모드에서 프로바이더 전용 키 플래그를 지원합니다:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

비대화형 Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url`의 기본값은 `http://127.0.0.1:11434`입니다. `--custom-model-id`는 선택 사항이며, 생략하면 온보딩이 Ollama의 권장 기본값을 사용합니다. `kimi-k2.5:cloud` 같은 클라우드 모델 id도 여기서 동작합니다.

프로바이더 키를 평문 대신 ref로 저장:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref`를 사용하면 온보딩은 평문 키 값 대신 env 기반 ref를 기록합니다.
auth-profile 기반 프로바이더의 경우 `keyRef` 항목을 기록하고, 사용자 지정 프로바이더의 경우 `models.providers.<id>.apiKey`를 env ref로 기록합니다(예: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

비대화형 `ref` 모드 계약:

- 온보딩 프로세스 환경에서 프로바이더 env var를 설정합니다(예: `OPENAI_API_KEY`).
- 해당 env var도 설정되어 있지 않다면 인라인 키 플래그(예: `--openai-api-key`)를 전달하지 마세요.
- 필수 env var 없이 인라인 키 플래그를 전달하면 온보딩은 안내와 함께 즉시 실패합니다.

비대화형 모드의 Gateway 토큰 옵션:

- `--gateway-auth token --gateway-token <token>`은 평문 토큰을 저장합니다.
- `--gateway-auth token --gateway-token-ref-env <name>`은 `gateway.auth.token`을 env SecretRef로 저장합니다.
- `--gateway-token`과 `--gateway-token-ref-env`는 상호 배타적입니다.
- `--gateway-token-ref-env`에는 온보딩 프로세스 환경에 비어 있지 않은 env var가 필요합니다.
- `--install-daemon` 사용 시, 토큰 인증에 토큰이 필요한 경우 SecretRef로 관리되는 Gateway 토큰은 검증되지만 supervisor 서비스 환경 메타데이터에 해석된 평문으로 저장되지는 않습니다.
- `--install-daemon` 사용 시, 토큰 모드에 토큰이 필요한데 구성된 토큰 SecretRef를 해석할 수 없으면 온보딩은 수정 안내와 함께 실패-폐쇄 방식으로 중단됩니다.
- `--install-daemon` 사용 시, `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않았다면, 온보딩은 mode가 명시적으로 설정될 때까지 설치를 차단합니다.
- 로컬 온보딩은 config에 `gateway.mode="local"`을 기록합니다. 이후 config 파일에 `gateway.mode`가 없다면, 이를 유효한 로컬 모드 축약형이 아니라 config 손상 또는 불완전한 수동 편집으로 간주하세요.
- `--allow-unconfigured`는 별도의 Gateway 런타임 긴급 우회 수단입니다. 이것이 온보딩에서 `gateway.mode`를 생략해도 된다는 뜻은 아닙니다.

예시:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

비대화형 로컬 Gateway 상태:

- `--skip-health`를 전달하지 않으면, 온보딩은 성공적으로 종료되기 전에 접근 가능한 로컬 Gateway를 기다립니다.
- `--install-daemon`은 먼저 관리형 Gateway 설치 경로를 시작합니다. 이것이 없으면 `openclaw gateway run`처럼 이미 로컬 Gateway가 실행 중이어야 합니다.
- 자동화에서 config/workspace/bootstrap 기록만 원한다면 `--skip-health`를 사용하세요.
- workspace 파일을 직접 관리한다면 `--skip-bootstrap`을 전달해 `agents.defaults.skipBootstrap: true`를 설정하고 `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` 생성을 건너뛰세요.
- 네이티브 Windows에서 `--install-daemon`은 먼저 예약된 작업을 시도하고, 작업 생성이 거부되면 사용자별 시작 폴더 로그인 항목으로 대체합니다.

참조 모드의 대화형 온보딩 동작:

- 프롬프트가 표시되면 **Use secret reference**를 선택합니다.
- 그런 다음 다음 중 하나를 선택합니다:
  - Environment variable
  - Configured secret provider(`file` 또는 `exec`)
- 온보딩은 ref를 저장하기 전에 빠른 사전 검증을 수행합니다.
  - 검증에 실패하면 온보딩이 오류를 표시하고 다시 시도할 수 있게 합니다.

비대화형 Z.AI 엔드포인트 선택:

참고: `--auth-choice zai-api-key`는 이제 키에 가장 적합한 Z.AI 엔드포인트를 자동 감지합니다(`zai/glm-5.1`이 있는 일반 API를 우선).
GLM Coding Plan 엔드포인트를 특별히 원하면 `zai-coding-global` 또는 `zai-coding-cn`을 선택하세요.

```bash
# 프롬프트 없는 엔드포인트 선택
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# 다른 Z.AI 엔드포인트 선택:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

비대화형 Mistral 예시:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

흐름 참고:

- `quickstart`: 최소한의 프롬프트, Gateway 토큰 자동 생성.
- `manual`: 포트/바인드/인증에 대한 전체 프롬프트(`advanced`의 별칭).
- 인증 선택이 선호 프로바이더를 암시하면, 온보딩은 해당 프로바이더로 기본 모델 및 허용 목록 선택기를 미리 필터링합니다. Volcengine 및 BytePlus의 경우 이는 coding-plan 변형(`volcengine-plan/*`, `byteplus-plan/*`)에도 일치합니다.
- 선호 프로바이더 필터 결과에 아직 로드된 모델이 없으면, 온보딩은 선택기를 비워 두지 않고 필터링되지 않은 카탈로그로 대체합니다.
- 웹 검색 단계에서는 일부 프로바이더가 프로바이더별 후속 프롬프트를 트리거할 수 있습니다:
  - **Grok**은 동일한 `XAI_API_KEY`와 `x_search` 모델 선택을 사용한 선택적 `x_search` 설정을 제안할 수 있습니다.
  - **Kimi**는 Moonshot API 리전(`api.moonshot.ai` vs `api.moonshot.cn`)과 기본 Kimi 웹 검색 모델을 물어볼 수 있습니다.
- 로컬 온보딩 DM 범위 동작: [CLI 설정 참조](/ko/start/wizard-cli-reference#outputs-and-internals).
- 가장 빠른 첫 채팅: `openclaw dashboard`(채널 설정 없는 Control UI).
- 사용자 지정 프로바이더: 나열되지 않은 호스팅 프로바이더를 포함해 OpenAI 또는 Anthropic 호환 엔드포인트에 연결합니다. 자동 감지에는 Unknown을 사용하세요.

## 일반적인 후속 명령어

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`은 비대화형 모드를 의미하지 않습니다. 스크립트에서는 `--non-interactive`를 사용하세요.
</Note>
