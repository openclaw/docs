---
read_when:
    - 모델 인증 또는 OAuth 만료 디버깅
    - 인증 또는 자격 증명 저장 문서화
summary: '모델 인증: OAuth, API 키, Claude CLI 재사용 및 Anthropic setup-token'
title: 인증
x-i18n:
    generated_at: "2026-05-07T13:16:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95ac66b4771ee4058f81294b54b345d9bf688da9d985e45e056547c9d395d37
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
이 페이지는 **모델 제공자** 인증 참조(API 키, OAuth, Claude CLI 재사용, Anthropic setup-token)입니다. **gateway 연결** 인증(token, password, trusted-proxy)은 [Configuration](/ko/gateway/configuration) 및 [Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth)를 참조하세요.
</Note>

OpenClaw는 모델 제공자에 대해 OAuth와 API 키를 지원합니다. 상시 실행되는 gateway
호스트의 경우 API 키가 보통 가장 예측 가능한 옵션입니다. Subscription/OAuth
흐름도 제공자 계정 모델과 맞는 경우 지원됩니다.

전체 OAuth 흐름과 저장소
레이아웃은 [/concepts/oauth](/ko/concepts/oauth)를 참조하세요.
SecretRef 기반 인증(`env`/`file`/`exec` 제공자)은 [Secrets Management](/ko/gateway/secrets)를 참조하세요.
`models status --probe`에서 사용하는 자격 증명 적격성/이유 코드 규칙은
[Auth Credential Semantics](/ko/auth-credential-semantics)를 참조하세요.

## 권장 설정(API 키, 모든 제공자)

장기 실행 gateway를 운영하는 경우 선택한
제공자의 API 키로 시작하세요.
특히 Anthropic의 경우 API 키 인증이 여전히 가장 예측 가능한 서버
설정이지만, OpenClaw는 로컬 Claude CLI 로그인의 재사용도 지원합니다.

1. 제공자 콘솔에서 API 키를 생성합니다.
2. 이를 **gateway 호스트**(`openclaw gateway`를 실행하는 머신)에 둡니다.

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway가 systemd/launchd 아래에서 실행되는 경우 데몬이 읽을 수 있도록
   키를 `~/.openclaw/.env`에 두는 것이 좋습니다.

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

env vars를 직접 관리하고 싶지 않다면 온보딩이 데몬 사용을 위해
API 키를 저장할 수 있습니다: `openclaw onboard`.

env 상속(`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd)에 대한 자세한 내용은 [Help](/ko/help)를 참조하세요.

## Anthropic: Claude CLI 및 토큰 호환성

Anthropic setup-token 인증은 OpenClaw에서 지원되는 토큰
경로로 여전히 사용할 수 있습니다. 이후 Anthropic 직원은 OpenClaw 스타일 Claude CLI 사용이
다시 허용된다고 알려왔으므로, OpenClaw는 Anthropic이 새 정책을 게시하지 않는 한
이 통합에 대해 Claude CLI 재사용과 `claude -p` 사용을 승인된 것으로
처리합니다. 호스트에서 Claude CLI 재사용을 사용할 수 있다면, 이제 이 경로가 선호됩니다.

장기 실행 gateway 호스트의 경우 Anthropic API 키가 여전히 가장 예측 가능한
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

1. gateway 호스트에서 Claude Code 자체를 Anthropic에 로그인합니다.
2. OpenClaw에 Anthropic 모델 선택을 로컬 `claude-cli`
   백엔드로 전환하고 일치하는 OpenClaw 인증 프로필을 저장하라고 알립니다.

`claude`가 `PATH`에 없다면 먼저 Claude Code를 설치하거나
`agents.defaults.cliBackends.claude-cli.command`를 실제 바이너리 경로로 설정하세요.

수동 토큰 입력(모든 제공자; `auth-profiles.json` 작성 + 구성 업데이트):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json`은 자격 증명만 저장합니다. 표준 형태는 다음과 같습니다.

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

OpenClaw는 런타임에 표준 `version` + `profiles` 형태를 기대합니다. 이전 설치에 `{ "openrouter": { "apiKey": "..." } }`와 같은 플랫 파일이 아직 있다면, `openclaw doctor --fix`를 실행하여 이를 `openrouter:default` API 키 프로필로 다시 작성하세요. doctor는 원본 옆에 `.legacy-flat.*.bak` 사본을 유지합니다. `baseUrl`, `api`, 모델 id, 헤더, 타임아웃 같은 endpoint 세부 정보는 `auth-profiles.json`이 아니라 `openclaw.json` 또는 `models.json`의 `models.providers.<id>` 아래에 속합니다.

Bedrock `auth: "aws-sdk"` 같은 외부 인증 경로도 자격 증명이 아닙니다. 이름 있는 Bedrock 경로를 원한다면 `openclaw.json`에 `auth.profiles.<id>.mode: "aws-sdk"`를 넣으세요. `auth-profiles.json`에 `type: "aws-sdk"`를 쓰지 마세요. `openclaw doctor --fix`는 레거시 AWS SDK 마커를 자격 증명 저장소에서 구성 메타데이터로 이동합니다.

정적 자격 증명에는 인증 프로필 참조도 지원됩니다.

- `api_key` 자격 증명은 `keyRef: { source, provider, id }`를 사용할 수 있습니다
- `token` 자격 증명은 `tokenRef: { source, provider, id }`를 사용할 수 있습니다
- OAuth 모드 프로필은 SecretRef 자격 증명을 지원하지 않습니다. `auth.profiles.<id>.mode`가 `"oauth"`로 설정되어 있으면 해당 프로필에 대한 SecretRef 기반 `keyRef`/`tokenRef` 입력은 거부됩니다.

자동화 친화적 확인(만료/누락 시 exit `1`, 곧 만료 시 `2`):

```bash
openclaw models status --check
```

실시간 인증 probes:

```bash
openclaw models status --probe
```

참고:

- Probe 행은 인증 프로필, env 자격 증명 또는 `models.json`에서 올 수 있습니다.
- 명시적 `auth.order.<provider>`가 저장된 프로필을 생략하면, probe는
  해당 프로필을 시도하는 대신 `excluded_by_auth_order`를 보고합니다.
- 인증은 있지만 OpenClaw가 해당 제공자에 대해 probe 가능한 모델 후보를 확인할 수 없으면
  probe는 `status: no_model`을 보고합니다.
- Rate-limit cooldowns는 모델 범위일 수 있습니다. 한
  모델에 대해 cooling down 중인 프로필도 같은 제공자의 sibling 모델에는 여전히 사용할 수 있습니다.

선택적 운영 스크립트(systemd/Termux)는 여기에 문서화되어 있습니다.
[Auth monitoring scripts](/ko/help/scripts#auth-monitoring-scripts)

## Anthropic 참고

Anthropic `claude-cli` 백엔드는 다시 지원됩니다.

- Anthropic 직원은 이 OpenClaw 통합 경로가 다시 허용된다고 알려왔습니다.
- 따라서 OpenClaw는 Anthropic이 새 정책을 게시하지 않는 한 Anthropic 기반 실행에 대해
  Claude CLI 재사용과 `claude -p` 사용을 승인된 것으로 처리합니다.
- Anthropic API 키는 장기 실행 gateway
  호스트와 명시적인 서버 측 billing control에 가장 예측 가능한 선택지로 남아 있습니다.

## 모델 인증 상태 확인

```bash
openclaw models status
openclaw doctor
```

## API 키 순환 동작(gateway)

일부 제공자는 API 호출이 제공자 rate limit에
도달했을 때 대체 키로 요청을 재시도하는 것을 지원합니다.

- 우선순위:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`(단일 override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 제공자는 추가 fallback으로 `GOOGLE_API_KEY`도 포함합니다.
- 같은 키 목록은 사용 전에 중복 제거됩니다.
- OpenClaw는 rate-limit 오류에 대해서만 다음 키로 재시도합니다(예:
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` 또는
  `workers_ai ... quota limit exceeded`).
- Non-rate-limit 오류는 대체 키로 재시도하지 않습니다.
- 모든 키가 실패하면 마지막 시도의 최종 오류가 반환됩니다.

## 사용할 자격 증명 제어

### 세션별(채팅 명령)

현재 세션에 특정 제공자 자격 증명을 고정하려면 `/model <alias-or-id>@<profileId>`를 사용하세요(예시 프로필 id: `anthropic:default`, `anthropic:work`).

간단한 picker에는 `/model`(또는 `/model list`)을 사용하고, 전체 보기에는 `/model status`를 사용하세요(후보 + 다음 인증 프로필, 구성된 경우 제공자 endpoint 세부 정보 포함).

### 에이전트별(CLI override)

에이전트에 명시적 인증 프로필 순서 override를 설정합니다(해당 에이전트의 `auth-state.json`에 저장됨).

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

특정 에이전트를 대상으로 하려면 `--agent <id>`를 사용하고, 구성된 기본 에이전트를 사용하려면 생략하세요.
순서 문제를 디버그할 때 `openclaw models status --probe`는 생략된
저장 프로필을 조용히 건너뛰는 대신 `excluded_by_auth_order`로 표시합니다.
cooldown 문제를 디버그할 때는 rate-limit cooldowns가 전체 제공자 프로필이 아니라
하나의 모델 id에 연결될 수 있음을 기억하세요.

## 문제 해결

### "No credentials found"

Anthropic 프로필이 없으면 **gateway 호스트**에 Anthropic API 키를
구성하거나 Anthropic setup-token 경로를 설정한 다음 다시 확인하세요.

```bash
openclaw models status
```

### 토큰 만료 예정/만료됨

어떤 프로필이 만료 예정인지 확인하려면 `openclaw models status`를 실행하세요. Anthropic 토큰 프로필이 없거나 만료된 경우
setup-token을 통해 해당 설정을 새로 고치거나 Anthropic API 키로 마이그레이션하세요.

## 관련

- [Secrets management](/ko/gateway/secrets)
- [Remote access](/ko/gateway/remote)
- [Auth storage](/ko/concepts/oauth)
