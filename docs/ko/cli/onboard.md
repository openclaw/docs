---
read_when:
    - 추론을 설정한 다음 Crestodian으로 설정을 완료하려는 경우
summary: '`openclaw onboard`용 CLI 참조(대화형 온보딩)'
title: 온보딩
x-i18n:
    generated_at: "2026-07-12T00:39:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

먼저 추론을 설정하는 안내형 설정입니다. 기존 AI 접근 권한을 감지하고,
실제 완성을 요구하며, 작동하는 경로만 저장한 다음 나머지를 구성하도록
Crestodian을 시작합니다. `openclaw setup`은 동일한 진입점이며,
`openclaw setup --baseline`은 기준 구성/작업 공간만 기록합니다.

<CardGroup cols={2}>
  <Card title="CLI 온보딩 허브" href="/ko/start/wizard" icon="rocket">
    대화형 CLI 흐름 안내입니다.
  </Card>
  <Card title="온보딩 개요" href="/ko/start/onboarding-overview" icon="map">
    OpenClaw 온보딩의 전체 구성 방식입니다.
  </Card>
  <Card title="CLI 설정 참고 자료" href="/ko/start/wizard-cli-reference" icon="book">
    출력, 내부 동작 및 단계별 동작입니다.
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
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`: 전체 단계별 마법사를 엽니다. `--non-interactive`와 함께 사용할
  수 없으며, 자동화된 설정에서는 `--classic`을 생략하십시오.
- `--flow quickstart`: 최소한의 프롬프트로 클래식 마법사를 열고
  Gateway 토큰을 자동 생성합니다.
- `--flow manual`(별칭 `advanced`): 포트, 바인드 및 인증을 위한 전체 프롬프트와
  함께 클래식 마법사를 엽니다.
- `--flow import`: 감지된 마이그레이션 제공자(예: `--import-from hermes`를 통한 Hermes)를 실행하고 계획을 미리 본 다음 확인 후 적용합니다. 가져오기는 새로운 OpenClaw 설정에서만 실행됩니다. 구성, 자격 증명, 세션 또는 작업 공간 상태가 하나라도 존재하면 먼저 초기화하십시오. 시험 실행 계획, 덮어쓰기 모드, 보고서 및 정확한 매핑은 [`openclaw migrate`](/ko/cli/migrate)를 사용하십시오.
- `--modern`은 Crestodian 대화형 설정 도우미의 호환성 별칭입니다.
  `openclaw crestodian`과 동일한 실제 추론 검증 단계를 사용하며
  `--workspace`, `--accept-risk`,
  `--non-interactive`, `--json`만 허용합니다. 다른 설정 플래그는
  조용히 무시되지 않고 거부됩니다.

## 안내형 흐름

기본 `openclaw onboard`는 안내형 흐름을 시작합니다. 보안 알림을 표시하고,
구성된 모델, API 키 환경 변수 및 지원되는 로컬 CLI를 통해 이미 사용 가능한
AI 접근 권한을 감지한 다음, 실제 완성으로 권장 후보를 테스트합니다.
해당 후보가 실패하면 온보딩은 이유를 표시하고 사용 가능한 다음 후보를
자동으로 시도합니다.

자동 감지가 모두 소진되면 감지된 다른 후보를 선택하거나 마스킹된 프롬프트에
제공자 API 키를 입력하십시오. 수동 키도 동일한 실제 완성 경로를 통해 테스트됩니다.
안내형 온보딩에서는 후보가 통과하기 전에 Crestodian이나 AI를 건너뛰는 종료 옵션을
제공하지 않습니다. OpenClaw는 테스트가 성공한 후 검증된 모델 경로와 해당 자격 증명만
저장합니다. 실패한 후보는 구성된 모델을 대체하거나 시도한 자격 증명을 저장하지 않습니다.
Crestodian이 시작될 때까지 작업 공간 및 Gateway 설정은 변경되지 않습니다.

안내형 모드에서 `--workspace <dir>`은 Crestodian이 제안할 작업 공간과
격리된 추론 컨텍스트를 제공합니다. Crestodian 설정 제안을 승인하기 전에는
저장되지 않습니다. 클래식 및 비대화형 온보딩은 각각의 일반적인 설정 흐름을
통해 작업 공간을 저장합니다.

추론이 통과하면 안내형 온보딩은 검증된 모델로 즉시 Crestodian을 시작합니다.
그런 다음 Crestodian은 작업 공간, Gateway, 채널, 에이전트, Plugin 및 기타
선택적 기능을 구성할 수 있습니다. Crestodian 내에서 `open channel wizard for <channel>`을
사용하면 채널 자격 증명 수집을 마스킹된 터미널 마법사에 맡길 수 있습니다.
모델 제공자 또는 인증을 변경하려면 Crestodian을 종료하고 `openclaw onboard`를
실행하십시오. Crestodian은 안내형 또는 클래식 제공자 흐름을 열지 않습니다.

구성이 완료된 설치 환경에서 `openclaw onboard`를 다시 실행하면 현재 기본 모델을
먼저 검증하므로, 동일한 흐름이 검증 및 복구 과정으로 작동합니다.
이 검사가 실패해도 구성된 모델은 자동으로 대체되지 않습니다.
온보딩은 중지되고 계속 진행할 방법을 묻습니다. 검사는 작업 공간 외부에서 실행되므로
작업 공간 Plugin이 제공하는 모델은 에이전트에서 계속 작동하더라도 여기서는 실패할 수 있습니다.
제공자별 인증, 채널, Skills, 원격 Gateway 설정, 가져오기 또는 전체 Gateway 제어에는
`openclaw onboard --classic`을 사용하십시오. 추론 외의 대화형 설정 및 복구에는
`openclaw crestodian`을 실행하십시오. `openclaw onboard --modern`은 동일한 추론
검증 단계를 거치는 호환성 별칭입니다. 클래식 마법사는 선택적으로 실제 완성을 통해
기본 모델을 검증할 수 있지만, Crestodian 자체의 실제 추론 검사가 통과할 때까지
Crestodian은 시작되지 않습니다.

대화형 터미널에서 하위 명령 없이 기본 `openclaw`를 실행하면 구성 상태에 따라
다음과 같이 분기됩니다.

- 활성 구성 파일이 없거나 작성된 설정이 없는 경우(비어 있거나 메타데이터만 있는 경우),
  안내형 온보딩을 시작합니다.
- 구성 파일이 존재하지만 검증에 실패하면 `openclaw doctor` 안내와 함께 클래식
  온보딩 경로를 시작합니다. Crestodian에는 작동하는 추론이 필요하므로 이 추론 전
  상태를 복구하는 데 사용되지 않습니다.
- 구성 파일이 유효하면 일반 에이전트 TUI를 엽니다. 에이전트 및 모델이 있고 연결 가능한
  구성된 Gateway가 있으면 온보딩이나 Crestodian 없이 해당 UI로 바로 이동합니다.
  구성이 완료된 설치 환경에서는 TUI 내부의 `/crestodian` 또는 `openclaw crestodian`으로
  Crestodian에 접근하십시오.

일반 텍스트 `ws://`는 루프백, 사설 IP 리터럴, `.local` 및 Tailnet `*.ts.net` Gateway URL에 허용됩니다. 신뢰할 수 있는 다른 사설 DNS 이름의 경우 온보딩 프로세스 환경에서 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하십시오.

## 초기화

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset`은 설정을 실행하기 전에 상태를 삭제합니다. `--reset-scope`는 삭제 범위를 제어합니다. `config`(구성만), `config+creds+sessions`(범위 없이 `--reset`을 전달할 때의 기본값) 또는 `full`(작업 공간도 초기화)입니다. 작업 공간 초기화는 `--reset-scope full`에서만 수행됩니다.

## 로캘

대화형 온보딩은 고정된 설정 문구에 CLI 마법사 로캘을 사용합니다. 적용 순서는 다음과 같습니다.

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 영어 대체값

지원되는 마법사 로캘은 `en`, `zh-CN`, `zh-TW`입니다. 로캘 값은 `zh_CN.UTF-8`과 같은 밑줄 또는 POSIX 접미사 형식을 사용할 수 있습니다. 제품명, 명령 이름, 구성 키, URL, 제공자 ID, 모델 ID 및 Plugin/채널 레이블은 원문 그대로 유지됩니다.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## 비대화형 설정

`--non-interactive`에는 `--accept-risk`가 필요합니다(에이전트가 강력하며 전체 시스템 접근은 위험하다는 점을 인정). `--mode`의 기본값은 `local`입니다.

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

`--custom-api-key`는 선택 사항입니다. 생략하면 온보딩은 환경에서 `CUSTOM_API_KEY`를 확인합니다. OpenClaw는 일반적인 비전 모델 ID(GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral 및 유사 모델)를 이미지 지원 모델로 자동 표시합니다. 알려지지 않은 사용자 지정 비전 ID에는 `--custom-image-input`을 전달하고, 텍스트 전용 메타데이터를 강제하려면 `--custom-text-input`을 사용하십시오. `/v1/responses`는 지원하지만 `/v1/chat/completions`는 지원하지 않는 OpenAI 호환 엔드포인트에는 `--custom-compatibility openai-responses`를 사용하십시오. 유효한 값은 `openai`(기본값), `openai-responses`, `anthropic`입니다.

LM Studio에는 제공자별 키 플래그도 있습니다.

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

`--custom-base-url`의 기본값은 `http://127.0.0.1:11434`입니다. `--custom-model-id`는 선택 사항입니다. 생략하면 온보딩은 Ollama의 권장 기본값을 사용합니다. `kimi-k2.5:cloud`와 같은 클라우드 모델 ID도 여기서 작동합니다.

제공자 키를 일반 텍스트 대신 참조로 저장합니다.

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref`를 사용하면 온보딩은 일반 텍스트 키 값 대신 환경 기반 참조를 기록합니다. 인증 프로필 기반 제공자의 경우 `keyRef: { source: "env", provider: "default", id: <envVar> }`를 기록하고, 사용자 지정 제공자의 경우에도 동일한 방식으로 `models.providers.<id>.apiKey`를 기록합니다(예: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). 규약: 온보딩 프로세스 환경에서 제공자 환경 변수(예: `OPENAI_API_KEY`)를 설정하십시오. 해당 환경 변수가 설정되어 있지 않다면 인라인 키 플래그도 함께 전달하지 마십시오. 일치하는 환경 변수 없이 플래그 값만 제공하면 안내와 함께 즉시 실패합니다.

### Gateway 인증(비대화형)

- `--gateway-auth token --gateway-token <token>`은 일반 텍스트 토큰을 저장합니다. `token`은 기본 인증 모드입니다.
- `--gateway-auth token --gateway-token-ref-env <name>`은 `gateway.auth.token`을 환경 SecretRef로 저장합니다. 온보딩 프로세스 환경에 해당 이름의 비어 있지 않은 환경 변수가 필요합니다.
- `--gateway-token`과 `--gateway-token-ref-env`는 함께 사용할 수 없습니다.
- `--install-daemon` 사용 시: SecretRef로 관리되는 `gateway.auth.token`은 검증되지만 확인된 일반 텍스트로 감독자 서비스 환경 메타데이터에 저장되지 않습니다. 참조를 확인할 수 없으면 해결 안내와 함께 설치가 안전하게 실패합니다. `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, 모드가 명시적으로 설정될 때까지 설치가 차단됩니다.
- 로컬 온보딩은 구성에 `gateway.mode="local"`을 기록합니다. 이후 구성 파일에 `gateway.mode`가 없다면 이는 유효한 로컬 모드 단축 표현이 아니라 구성 손상 또는 불완전한 수동 편집을 의미합니다.
- 로컬 온보딩은 선택한 설정 경로에 필요한 다운로드 가능한 Plugin(예: 해당 인증 선택에 필요한 Codex 또는 Copilot 런타임 Plugin)을 설치합니다. 원격 온보딩은 원격 Gateway의 연결 정보만 기록하며 로컬 Plugin 패키지는 절대 설치하지 않습니다.
- `--allow-unconfigured`는 별도의 `openclaw gateway run` 비상 우회 수단입니다. 온보딩에서 `gateway.mode`를 건너뛰도록 허용하지 않습니다.

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### 로컬 Gateway 상태

- `--skip-health`를 전달하지 않으면 온보딩은 연결 가능한 로컬 Gateway를 기다린 후 성공적으로 종료합니다.
- `--install-daemon`은 먼저 관리형 Gateway 설치 경로를 시작합니다. 이 플래그가 없으면 로컬 Gateway가 이미 실행 중이어야 합니다(예: `openclaw gateway run`).
- 자동화에서 구성/작업 공간/부트스트랩 기록만 필요한 경우 `--skip-health`로 대기를 건너뜁니다.
- `--skip-bootstrap`은 `agents.defaults.skipBootstrap: true`를 설정하고 `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` 생성을 건너뜁니다.
- 네이티브 Windows에서 `--install-daemon`은 먼저 Scheduled Tasks를 시도하고, 작업 생성이 거부되면 사용자별 Startup 폴더 로그인 항목으로 대체합니다.

### 대화형 참조 모드

- 메시지가 표시되면 **Use secret reference**를 선택한 다음 **Environment variable** 또는 구성된 보안 비밀 제공자(`file` 또는 `exec`)를 선택하십시오.
- 온보딩은 참조를 저장하기 전에 빠른 사전 검증을 실행하며, 실패하면 다시 시도할 수 있습니다.

### Z.AI 엔드포인트 선택 사항

<Note>
`--auth-choice zai-api-key`는 키에 가장 적합한 Z.AI 엔드포인트와 모델을 자동으로 감지합니다. Coding Plan 엔드포인트에서는 `zai/glm-5.2`를 우선 사용하고(사용할 수 없으면 `glm-5.1`로 대체), 일반 API 엔드포인트에서는 기본적으로 `zai/glm-5.1`을 사용합니다. Coding Plan 엔드포인트를 강제로 사용하려면 `zai-coding-global` 또는 `zai-coding-cn`을 직접 선택하세요.
</Note>

```bash
# 프롬프트 없이 엔드포인트 선택
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# 다른 Z.AI 엔드포인트 선택지: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## 추가 비대화형 플래그

토큰 기반 모델 인증(`--auth-choice token`과 함께 사용):

| 플래그                          | 설명                                                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | 토큰을 발급하는 토큰 공급자 ID                                                                                                    |
| `--token <token>`               | 모델 인증에 사용할 토큰 값                                                                                                       |
| `--token-profile-id <id>`       | 인증 프로필 ID(기본값: `<provider>:manual`; 일부 공급자 소유 흐름에서는 `anthropic:default`와 같은 자체 기본값을 사용)            |
| `--token-expires-in <duration>` | 선택적 토큰 만료 기간(예: `365d`, `12h`)                                                                                          |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

데몬 설치 제어: `--no-install-daemon` / `--skip-daemon`(별칭, Gateway 서비스 설치 건너뛰기), `--daemon-runtime <node|bun>`.

Skills: `--node-manager <npm|pnpm|bun>`(기본값 `npm`), `--skip-skills`.

UI 및 훅 설정: `--skip-ui`(Control UI/TUI 프롬프트 건너뛰기), `--skip-hooks`(Webhook/훅 설정 건너뛰기), `--skip-channels`, `--skip-search`.

출력: `--suppress-gateway-token-output`은 토큰을 포함하는 Gateway/UI 출력(토큰 힌트, 토큰이 포함된 자동 로그인 URL, Control UI 자동 실행)을 숨깁니다. 공유 터미널과 CI에서 유용합니다.

<Note>
`--json`은 안내형 또는 클래식 온보딩에서 비대화형 모드를 의미하지 않습니다.
`--modern`과 함께 사용하면 JSON은 Crestodian 개요를 한 번만 표시하고 해당
단일 결과를 출력한 후 종료합니다. 다른 스크립트에는 `--non-interactive`를 사용하세요.
</Note>

## 공급자 사전 필터링

인증 선택이 선호 공급자를 암시하는 경우 온보딩은 기본 모델 및 허용 목록 선택기를 해당 공급자의 모델로 사전 필터링합니다. 이 필터는 동일한 Plugin이 소유한 다른 공급자와도 일치하므로 `volcengine`/`volcengine-plan` 및 `byteplus`/`byteplus-plan`과 같은 Coding Plan 변형도 포함합니다. 선호 공급자 필터의 결과로 불러온 모델이 없으면 온보딩은 선택기를 비워 두는 대신 필터링되지 않은 카탈로그로 대체합니다.

## 웹 검색 후속 설정

일부 웹 검색 공급자는 온보딩 중 공급자별 후속 프롬프트를 표시합니다.

- **Grok**은 동일한 xAI 인증과 `x_search` 모델 선택을 사용하는 선택적 `x_search` 설정을 제공할 수 있습니다.
- **Kimi**는 Moonshot API 리전(`api.moonshot.ai` 또는 `api.moonshot.cn`)과 기본 Kimi 웹 검색 모델을 요청할 수 있습니다.

## 기타 동작

- 로컬 온보딩 DM 범위 동작: [CLI 설정 참고 자료](/ko/start/wizard-cli-reference#outputs-and-internals).
- 가장 빠르게 첫 채팅 시작하기: `openclaw dashboard`(Control UI, 채널 설정 없음).
- 사용자 지정 공급자: 목록에 없는 호스팅 공급자를 포함하여 OpenAI 또는 Anthropic 호환 엔드포인트에 연결할 수 있습니다. 라이브 프로브를 통해 자동으로 감지하려면 **알 수 없음** 호환성을 사용하세요.
- Hermes 상태가 감지되면 온보딩에서 마이그레이션 흐름을 제공합니다(위의 `--flow import` 참조).

## 일반적인 후속 명령

나중에 추론과 무관한 특정 변경을 수행하려면 `openclaw configure`를 사용하고, 채널만 설정하려면 `openclaw
channels add`를 사용하세요. 모델 공급자 또는 인증 경로를 변경하려면
대신 `openclaw onboard`를 실행하세요.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
