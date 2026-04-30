---
read_when:
    - Gateway, 워크스페이스, 인증, 채널, Skills에 대한 안내형 설정이 필요합니다
summary: '`openclaw onboard`용 CLI 참조 (대화형 온보딩)'
title: 온보딩
x-i18n:
    generated_at: "2026-04-30T06:24:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 583310458b2e2bc8ddc1513112c960520d972716be0c33e4177d0db30e896504
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

로컬 또는 원격 Gateway 설정을 위한 대화형 온보딩입니다.

## 관련 가이드

<CardGroup cols={2}>
  <Card title="CLI 온보딩 허브" href="/ko/start/wizard" icon="rocket">
    대화형 CLI 흐름 안내입니다.
  </Card>
  <Card title="온보딩 개요" href="/ko/start/onboarding-overview" icon="map">
    OpenClaw 온보딩이 어떻게 함께 구성되는지 설명합니다.
  </Card>
  <Card title="CLI 설정 참조" href="/ko/start/wizard-cli-reference" icon="book">
    출력, 내부 동작, 단계별 동작입니다.
  </Card>
  <Card title="CLI 자동화" href="/ko/start/wizard-cli-automation" icon="terminal">
    비대화형 플래그와 스크립트 기반 설정입니다.
  </Card>
  <Card title="macOS 앱 온보딩" href="/ko/start/onboarding" icon="apple">
    macOS 메뉴 막대 앱의 온보딩 흐름입니다.
  </Card>
</CardGroup>

## 예시

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import`는 Hermes 같은 Plugin 소유 마이그레이션 공급자를 사용합니다. 새 OpenClaw 설정에서만 실행됩니다. 기존 구성, 자격 증명, 세션 또는 워크스페이스 메모리/ID 파일이 있으면 가져오기 전에 초기화하거나 새 설정을 선택하세요.

`--modern`은 Crestodian 대화형 온보딩 미리 보기를 시작합니다. `--modern`이 없으면 `openclaw onboard`는 클래식 온보딩 흐름을 유지합니다.

평문 private-network `ws://` 대상(신뢰할 수 있는 네트워크만 해당)의 경우 온보딩 프로세스 환경에서 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하세요. 이 클라이언트 측 전송 비상 우회에는 대응되는 `openclaw.json` 설정이 없습니다.

비대화형 사용자 지정 공급자:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key`는 비대화형 모드에서 선택 사항입니다. 생략하면 온보딩은 `CUSTOM_API_KEY`를 확인합니다.
OpenClaw는 일반적인 비전 모델 ID를 자동으로 이미지 입력 가능으로 표시합니다. 알 수 없는 사용자 지정 비전 ID에는 `--custom-image-input`을 전달하거나, 텍스트 전용 메타데이터를 강제하려면 `--custom-text-input`을 전달하세요.

LM Studio는 비대화형 모드에서 공급자별 키 플래그도 지원합니다.

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

`--custom-base-url`의 기본값은 `http://127.0.0.1:11434`입니다. `--custom-model-id`는 선택 사항입니다. 생략하면 온보딩은 Ollama의 권장 기본값을 사용합니다. `kimi-k2.5:cloud` 같은 클라우드 모델 ID도 여기에서 작동합니다.

공급자 키를 평문 대신 참조로 저장합니다.

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref`를 사용하면 온보딩은 평문 키 값 대신 환경 기반 참조를 씁니다.
인증 프로필 기반 공급자의 경우 `keyRef` 항목을 쓰고, 사용자 지정 공급자의 경우 `models.providers.<id>.apiKey`를 환경 참조로 씁니다(예: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

비대화형 `ref` 모드 계약:

- 온보딩 프로세스 환경에서 공급자 환경 변수를 설정하세요(예: `OPENAI_API_KEY`).
- 해당 환경 변수도 설정되어 있지 않다면 인라인 키 플래그(예: `--openai-api-key`)를 전달하지 마세요.
- 필수 환경 변수 없이 인라인 키 플래그가 전달되면 온보딩은 안내와 함께 빠르게 실패합니다.

비대화형 모드의 Gateway 토큰 옵션:

- `--gateway-auth token --gateway-token <token>`은 평문 토큰을 저장합니다.
- `--gateway-auth token --gateway-token-ref-env <name>`은 `gateway.auth.token`을 환경 SecretRef로 저장합니다.
- `--gateway-token`과 `--gateway-token-ref-env`는 함께 사용할 수 없습니다.
- `--gateway-token-ref-env`에는 온보딩 프로세스 환경의 비어 있지 않은 환경 변수가 필요합니다.
- `--install-daemon` 사용 시 토큰 인증에 토큰이 필요하면 SecretRef로 관리되는 게이트웨이 토큰은 검증되지만 supervisor 서비스 환경 메타데이터에 해석된 평문으로 유지되지는 않습니다.
- `--install-daemon` 사용 시 토큰 모드에 토큰이 필요하고 구성된 토큰 SecretRef가 해석되지 않으면 온보딩은 복구 안내와 함께 닫힌 상태로 실패합니다.
- `--install-daemon` 사용 시 `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, 모드가 명시적으로 설정될 때까지 온보딩은 설치를 차단합니다.
- 로컬 온보딩은 구성에 `gateway.mode="local"`을 씁니다. 이후 구성 파일에 `gateway.mode`가 없다면 이를 유효한 로컬 모드 단축 설정이 아니라 구성 손상 또는 불완전한 수동 편집으로 간주하세요.
- `--allow-unconfigured`는 별도의 게이트웨이 런타임 탈출구입니다. 이것이 온보딩에서 `gateway.mode`를 생략해도 된다는 의미는 아닙니다.

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

비대화형 로컬 게이트웨이 상태 확인:

- `--skip-health`를 전달하지 않는 한, 온보딩은 도달 가능한 로컬 게이트웨이가 있을 때까지 기다린 뒤 성공적으로 종료됩니다.
- `--install-daemon`은 관리형 게이트웨이 설치 경로를 먼저 시작합니다. 이를 사용하지 않는 경우, 예를 들어 `openclaw gateway run`처럼 로컬 게이트웨이가 이미 실행 중이어야 합니다.
- 자동화에서 구성/워크스페이스/부트스트랩 쓰기만 원하는 경우 `--skip-health`를 사용하세요.
- 워크스페이스 파일을 직접 관리하는 경우 `--skip-bootstrap`을 전달하여 `agents.defaults.skipBootstrap: true`를 설정하고 `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` 생성을 건너뛰세요.
- 네이티브 Windows에서 `--install-daemon`은 먼저 예약 작업을 시도하고, 작업 생성이 거부되면 사용자별 시작 폴더 로그인 항목으로 대체합니다.

참조 모드의 대화형 온보딩 동작:

- 프롬프트가 표시되면 **시크릿 참조 사용**을 선택하세요.
- 그런 다음 다음 중 하나를 선택하세요.
  - 환경 변수
  - 구성된 시크릿 공급자(`file` 또는 `exec`)
- 온보딩은 참조를 저장하기 전에 빠른 사전 검증을 수행합니다.
  - 검증에 실패하면 온보딩은 오류를 표시하고 다시 시도할 수 있게 합니다.

### 비대화형 Z.AI 엔드포인트 선택

<Note>
`--auth-choice zai-api-key`는 키에 가장 적합한 Z.AI 엔드포인트를 자동 감지합니다(`zai/glm-5.1`이 있는 일반 API를 선호). GLM Coding Plan 엔드포인트를 특별히 원한다면 `zai-coding-global` 또는 `zai-coding-cn`을 선택하세요.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
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

## 흐름 참고 사항

<AccordionGroup>
  <Accordion title="흐름 유형">
    - `quickstart`: 최소 프롬프트, 게이트웨이 토큰을 자동 생성합니다.
    - `manual`: 포트, 바인드, 인증에 대한 전체 프롬프트(`advanced`의 별칭).
    - `import`: 감지된 마이그레이션 공급자를 실행하고 계획을 미리 본 다음 확인 후 적용합니다.

  </Accordion>
  <Accordion title="공급자 사전 필터링">
    인증 선택이 선호 공급자를 암시하는 경우 온보딩은 기본 모델 및 허용 목록 선택기를 해당 공급자로 사전 필터링합니다. Volcengine 및 BytePlus의 경우 코딩 플랜 변형(`volcengine-plan/*`, `byteplus-plan/*`)도 일치합니다.

    선호 공급자 필터로 아직 로드된 모델이 나오지 않으면, 온보딩은 선택기를 비워 두는 대신 필터링되지 않은 카탈로그로 대체합니다.

  </Accordion>
  <Accordion title="웹 검색 후속 질문">
    일부 웹 검색 공급자는 공급자별 후속 프롬프트를 트리거합니다.

    - **Grok**은 동일한 `XAI_API_KEY`와 `x_search` 모델 선택으로 선택적 `x_search` 설정을 제공할 수 있습니다.
    - **Kimi**는 Moonshot API 리전(`api.moonshot.ai` 대 `api.moonshot.cn`)과 기본 Kimi 웹 검색 모델을 요청할 수 있습니다.

  </Accordion>
  <Accordion title="기타 동작">
    - 로컬 온보딩 DM 범위 동작: [CLI 설정 참조](/ko/start/wizard-cli-reference#outputs-and-internals).
    - 가장 빠른 첫 채팅: `openclaw dashboard`(Control UI, 채널 설정 없음).
    - 사용자 지정 공급자: 목록에 없는 호스팅 공급자를 포함해 OpenAI 또는 Anthropic 호환 엔드포인트를 연결합니다. 자동 감지하려면 Unknown을 사용하세요.
    - Hermes 상태가 감지되면 온보딩은 마이그레이션 흐름을 제공합니다. 드라이런 계획, 덮어쓰기 모드, 보고서, 정확한 매핑에는 [마이그레이션](/ko/cli/migrate)을 사용하세요.

  </Accordion>
</AccordionGroup>

## 일반적인 후속 명령

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`은 비대화형 모드를 의미하지 않습니다. 스크립트에는 `--non-interactive`를 사용하세요.
</Note>
