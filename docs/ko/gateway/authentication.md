---
read_when:
    - 모델 인증 또는 OAuth 만료 디버깅
    - 인증 또는 자격 증명 저장소 문서화
summary: '모델 인증: OAuth, API 키, Claude CLI 재사용 및 Anthropic setup-token'
title: 인증
x-i18n:
    generated_at: "2026-06-27T17:26:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
이 페이지는 **모델 제공자** 인증 참조입니다(API 키, OAuth, Claude CLI 재사용, Anthropic setup-token). **Gateway 연결** 인증(token, password, trusted-proxy)은 [구성](/ko/gateway/configuration) 및 [Trusted Proxy 인증](/ko/gateway/trusted-proxy-auth)을 참조하세요.
</Note>

OpenClaw는 모델 제공자에 대해 OAuth와 API 키를 지원합니다. 상시 실행 Gateway
호스트의 경우 API 키가 일반적으로 가장 예측 가능한 옵션입니다. 구독/OAuth
흐름도 제공자 계정 모델에 맞는 경우 지원됩니다.

전체 OAuth 흐름과 저장소
레이아웃은 [/concepts/oauth](/ko/concepts/oauth)를 참조하세요.
SecretRef 기반 인증(`env`/`file`/`exec` 제공자)은 [비밀 관리](/ko/gateway/secrets)를 참조하세요.
`models status --probe`에서 사용하는 자격 증명 적격성/사유 코드 규칙은
[인증 자격 증명 의미 체계](/ko/auth-credential-semantics)를 참조하세요.

## 권장 설정(API 키, 모든 제공자)

장기 실행 Gateway를 운영하는 경우 선택한
제공자의 API 키로 시작하세요.
특히 Anthropic의 경우 API 키 인증이 여전히 가장 예측 가능한 서버
설정이지만, OpenClaw는 로컬 Claude CLI 로그인의 재사용도 지원합니다.

1. 제공자 콘솔에서 API 키를 생성합니다.
2. **Gateway 호스트**(`openclaw gateway`를 실행하는 머신)에 배치합니다.

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway가 systemd/launchd 아래에서 실행되는 경우, 데몬이 읽을 수 있도록
   키를 `~/.openclaw/.env`에 넣는 것을 권장합니다.

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

그런 다음 데몬을 다시 시작하거나 Gateway 프로세스를 다시 시작하고 다시 확인합니다.

```bash
openclaw models status
openclaw doctor
```

환경 변수를 직접 관리하고 싶지 않다면 온보딩에서 데몬 사용을 위한
API 키를 저장할 수 있습니다: `openclaw onboard`.

환경 상속(`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd)에 대한 자세한 내용은 [도움말](/ko/help)을 참조하세요.

## Anthropic: Claude CLI 및 토큰 호환성

Anthropic setup-token 인증은 OpenClaw에서 지원되는 토큰
경로로 계속 사용할 수 있습니다. Anthropic 직원은 이후 OpenClaw 스타일의 Claude CLI 사용이
다시 허용된다고 알려왔으므로, Anthropic이 새 정책을 게시하지 않는 한 OpenClaw는 이 통합에 대해 Claude CLI 재사용과 `claude -p` 사용을
승인된 것으로 취급합니다. 호스트에서
Claude CLI 재사용을 사용할 수 있다면 이제 그것이 권장 경로입니다.

장기 실행 Gateway 호스트의 경우 Anthropic API 키가 여전히 가장 예측 가능한
설정입니다. 같은 호스트의 기존 Claude 로그인을 재사용하려면 온보딩/구성에서
Anthropic Claude CLI 경로를 사용하세요.

Claude CLI 재사용을 위한 권장 호스트 설정:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

이는 2단계 설정입니다.

1. Gateway 호스트에서 Claude Code 자체를 Anthropic에 로그인합니다.
2. OpenClaw에 Anthropic 모델 선택을 로컬 `claude-cli`
   백엔드로 전환하고 일치하는 OpenClaw 인증 프로필을 저장하도록 지시합니다.

`claude`가 `PATH`에 없으면 Claude Code를 먼저 설치하거나
`agents.defaults.cliBackends.claude-cli.command`를 실제 바이너리 경로로 설정하세요.

수동 토큰 입력(모든 제공자, 에이전트별 SQLite 인증 저장소에 쓰고 구성 업데이트):

```bash
openclaw models auth paste-token --provider openrouter
```

인증 프로필 저장소는 자격 증명만 보관합니다. 기존 `auth-profiles.json` 파일은 이 표준 형태를 사용했습니다.

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw는 이제 각 에이전트의 `openclaw-agent.sqlite`에서 인증 프로필을 읽습니다. 이전 설치에 아직 `auth-profiles.json`, `auth-state.json` 또는 `{ "openrouter": { "apiKey": "..." } }` 같은 평면 인증 프로필 파일이 있다면, `openclaw doctor --fix`를 실행해 SQLite로 가져오세요. doctor는 원본 JSON 파일 옆에 타임스탬프가 있는 백업을 보관합니다. `baseUrl`, `api`, 모델 ID, 헤더, 타임아웃 같은 엔드포인트 세부 정보는 인증 프로필이 아니라 `openclaw.json` 또는 `models.json`의 `models.providers.<id>` 아래에 속합니다.

Bedrock `auth: "aws-sdk"` 같은 외부 인증 경로도 자격 증명이 아닙니다. 이름이 지정된 Bedrock 경로를 원한다면 `openclaw.json`에 `auth.profiles.<id>.mode: "aws-sdk"`를 넣으세요. 인증 프로필 저장소에 `type: "aws-sdk"`를 쓰지 마세요. `openclaw doctor --fix`는 기존 AWS SDK 마커를 자격 증명 저장소에서 구성 메타데이터로 이동합니다.

정적 자격 증명에는 인증 프로필 참조도 지원됩니다.

- `api_key` 자격 증명은 `keyRef: { source, provider, id }`를 사용할 수 있습니다.
- `token` 자격 증명은 `tokenRef: { source, provider, id }`를 사용할 수 있습니다.
- OAuth 모드 프로필은 SecretRef 자격 증명을 지원하지 않습니다. `auth.profiles.<id>.mode`가 `"oauth"`로 설정된 경우 해당 프로필에 대한 SecretRef 기반 `keyRef`/`tokenRef` 입력은 거부됩니다.

자동화 친화적 확인(만료/누락 시 종료 `1`, 만료 임박 시 `2`):

```bash
openclaw models status --check
```

실시간 인증 프로브:

```bash
openclaw models status --probe
```

참고:

- 프로브 행은 인증 프로필, 환경 자격 증명 또는 `models.json`에서 올 수 있습니다.
- 명시적 `auth.order.<provider>`가 저장된 프로필을 생략하면, 프로브는 해당 프로필을 시도하는 대신
  `excluded_by_auth_order`를 보고합니다.
- 인증은 있지만 OpenClaw가 해당 제공자에 대해 프로브 가능한 모델 후보를 확인할 수 없는 경우,
  프로브는 `status: no_model`을 보고합니다.
- 속도 제한 쿨다운은 모델 범위일 수 있습니다. 한 모델에 대해 쿨다운 중인 프로필도
  같은 제공자의 형제 모델에는 여전히 사용할 수 있습니다.

선택적 운영 스크립트(systemd/Termux)는 여기에 문서화되어 있습니다.
[인증 모니터링 스크립트](/ko/help/scripts#auth-monitoring-scripts)

## Anthropic 참고

Anthropic `claude-cli` 백엔드는 다시 지원됩니다.

- Anthropic 직원은 이 OpenClaw 통합 경로가 다시 허용된다고 알려왔습니다.
- 따라서 Anthropic이 새 정책을 게시하지 않는 한 OpenClaw는 Anthropic 기반 실행에 대해 Claude CLI 재사용과 `claude -p` 사용을 승인된 것으로
  취급합니다.
- Anthropic API 키는 장기 실행 Gateway
  호스트와 명시적인 서버 측 과금 제어에 가장 예측 가능한 선택으로 남아 있습니다.

## 모델 인증 상태 확인

```bash
openclaw models status
openclaw doctor
```

## API 키 순환 동작(Gateway)

일부 제공자는 API 호출이 제공자 속도 제한에 걸렸을 때
대체 키로 요청을 다시 시도하는 기능을 지원합니다.

- 우선순위:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`(단일 재정의)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 제공자는 추가 대체 항목으로 `GOOGLE_API_KEY`도 포함합니다.
- 동일한 키 목록은 사용 전에 중복 제거됩니다.
- OpenClaw는 속도 제한 오류(예:
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` 또는
  `workers_ai ... quota limit exceeded`)에 대해서만 다음 키로 다시 시도합니다.
- 속도 제한이 아닌 오류는 대체 키로 다시 시도하지 않습니다.
- 모든 키가 실패하면 마지막 시도의 최종 오류가 반환됩니다.

## Gateway가 실행 중일 때 제공자 인증 제거

Gateway 제어 플레인을 통해 제공자 인증이 제거되면 OpenClaw는 해당 제공자에 대해
저장된 인증 프로필을 삭제하고, 선택된 모델 제공자가 제거된 제공자와 일치하는 활성 채팅 또는 에이전트 실행을
중단합니다. 중단된 실행은
`stopReason: "auth-revoked"`와 함께 일반 채팅 취소 및 수명 주기 이벤트를 내보내므로, 연결된 클라이언트는 자격 증명이 제거되어 실행이
중지되었음을 표시할 수 있습니다.

저장된 인증을 제거해도 제공자에서 키가 취소되지는 않습니다. 제공자 측 무효화가 필요할 때는
제공자 대시보드에서 키를 순환하거나 취소하세요.

## 사용할 자격 증명 제어

### OpenAI 및 기존 `openai-codex` ID

OpenAI API 키 프로필과 ChatGPT/Codex OAuth 프로필은 모두 표준
제공자 ID `openai`를 사용합니다. 새 구성은 `openai:*` 프로필 ID와
`auth.order.openai`를 사용해야 합니다.

이전 구성, 인증 프로필 ID 또는
`auth.order.openai-codex`에서 `openai-codex`가 보이면 이를 기존 마이그레이션 입력으로 취급하세요. 새
`openai-codex` 프로필을 만들지 마세요. 다음을 실행하세요.

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor는 기존 `openai-codex:*` 프로필 ID와
`auth.order.openai-codex` 항목을 표준 `openai` 인증 경로로 다시 씁니다. OpenAI별 모델/런타임 라우팅은 [OpenAI](/ko/providers/openai)를 참조하세요.

### 로그인 중(CLI)

로그인 중 이름이 지정된 인증 프로필을 지원하는 제공자에는
`openclaw models auth login --provider <id> --profile-id <profileId>`를 사용하세요.

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

이는 하나의 에이전트 안에서 같은 제공자의 여러 OAuth 로그인을
분리해 유지하는 가장 쉬운 방법입니다.

저장된 제공자 프로필이 멈췄거나 만료되었거나 잘못된
계정에 묶여 있고 일반 로그인 명령이 계속 이를 재사용할 때는 `--force`를 사용하세요. `--force`는
선택한 에이전트 디렉터리에서 해당 제공자의 저장된 인증 프로필을 삭제한 다음
같은 제공자 인증 흐름을 다시 실행합니다. 제공자에서 자격 증명을 취소하지는 않습니다.
제공자 측 무효화가 필요할 때는 제공자 대시보드에서 이를 순환하거나 취소하세요.

```bash
openclaw models auth login --provider anthropic --force
```

### 세션별(채팅 명령)

현재 세션에 특정 제공자 자격 증명을 고정하려면 `/model <alias-or-id>@<profileId>`를 사용하세요(예시 프로필 ID: `anthropic:default`, `anthropic:work`).

간결한 선택기에는 `/model`(또는 `/model list`)을 사용하고, 전체 보기(후보 + 다음 인증 프로필, 구성된 경우 제공자 엔드포인트 세부 정보 포함)에는 `/model status`를 사용하세요.

### 에이전트별(CLI 재정의)

에이전트에 대해 명시적 인증 프로필 순서 재정의를 설정합니다(해당 에이전트의 SQLite 인증 상태에 저장됨).

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

특정 에이전트를 대상으로 하려면 `--agent <id>`를 사용하세요. 생략하면 구성된 기본 에이전트를 사용합니다.
순서 문제를 디버그할 때 `openclaw models status --probe`는 저장된 프로필을 조용히 건너뛰는 대신
생략된 프로필을 `excluded_by_auth_order`로 표시합니다.
쿨다운 문제를 디버그할 때는 속도 제한 쿨다운이 전체 제공자 프로필이 아니라
하나의 모델 ID에 묶일 수 있음을 기억하세요.

이미 실행 중인 채팅의 인증 순서나 프로필 고정을 변경하는 경우,
해당 채팅에서 `/new` 또는 `/reset`을 보내 새 세션을 시작하세요. 기존
세션은 재설정될 때까지 현재 모델/프로필 선택을 유지할 수 있습니다.

## 문제 해결

### "No credentials found"

Anthropic 프로필이 누락된 경우
**Gateway 호스트**에서 Anthropic API 키를 구성하거나 Anthropic setup-token 경로를 설정한 다음 다시 확인하세요.

```bash
openclaw models status
```

### 토큰 만료 임박/만료

어떤 프로필이 만료 중인지 확인하려면 `openclaw models status`를 실행하세요.
Anthropic 토큰 프로필이 누락되었거나 만료된 경우 setup-token을 통해
해당 설정을 새로 고치거나 Anthropic API 키로 마이그레이션하세요.

## 관련 항목

- [비밀 관리](/ko/gateway/secrets)
- [원격 액세스](/ko/gateway/remote)
- [인증 저장소](/ko/concepts/oauth)
