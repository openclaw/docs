---
read_when:
    - 모델 인증 또는 OAuth 만료 디버깅
    - 인증 또는 자격 증명 저장소 문서화
summary: '모델 인증: OAuth, API 키, Claude CLI 재사용, 및 Anthropic 설정 토큰'
title: 인증
x-i18n:
    generated_at: "2026-04-25T05:59:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc8dbd0ccb9b167720a03f9e7486c1498d8d9eb500b8174e2a27ea0523285f70
    source_path: gateway/authentication.md
    workflow: 15
---

<Note>
이 페이지는 **모델 프로바이더** 인증(API 키, OAuth, Claude CLI 재사용, Anthropic 설정 토큰)을 다룹니다. **Gateway 연결** 인증(token, password, trusted-proxy)은 [Configuration](/ko/gateway/configuration) 및 [Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth)를 참고하세요.
</Note>

OpenClaw는 모델 프로바이더에 대해 OAuth와 API 키를 지원합니다. 항상 실행되는 Gateway 호스트에서는 일반적으로 API 키가 가장 예측 가능한 선택입니다. 구독/OAuth 흐름도 프로바이더 계정 모델과 일치하면 지원됩니다.

전체 OAuth 흐름 및 저장소 레이아웃은 [/concepts/oauth](/ko/concepts/oauth)를 참고하세요.
SecretRef 기반 인증(`env`/`file`/`exec` 프로바이더)은 [Secrets Management](/ko/gateway/secrets)를 참고하세요.
`models status --probe`에서 사용하는 자격 증명 적격성/이유 코드 규칙은
[Auth Credential Semantics](/ko/auth-credential-semantics)를 참고하세요.

## 권장 설정(API 키, 모든 프로바이더)

장기간 실행되는 gateway를 운영한다면, 선택한 프로바이더의 API 키부터 시작하세요.
Anthropic의 경우에도 API 키 인증이 여전히 가장 예측 가능한 서버 설정이지만, OpenClaw는 로컬 Claude CLI 로그인 재사용도 지원합니다.

1. 프로바이더 콘솔에서 API 키를 생성합니다.
2. 이를 **gateway 호스트**(`openclaw gateway`를 실행하는 머신)에 설정합니다.

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway가 systemd/launchd 아래에서 실행된다면, 데몬이 읽을 수 있도록 키를 `~/.openclaw/.env`에 두는 것이 좋습니다:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

그런 다음 데몬(또는 Gateway 프로세스)을 다시 시작하고 다시 확인하세요:

```bash
openclaw models status
openclaw doctor
```

직접 env var를 관리하고 싶지 않다면, 온보딩이 데몬용 API 키를 저장할 수 있습니다: `openclaw onboard`.

env 상속(`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd)에 대한 자세한 내용은 [Help](/ko/help)를 참고하세요.

## Anthropic: Claude CLI 및 토큰 호환성

Anthropic 설정 토큰 인증은 OpenClaw에서 여전히 지원되는 토큰 경로로 제공됩니다. 이후 Anthropic 직원이 OpenClaw 스타일의 Claude CLI 사용이 다시 허용된다고 알려왔기 때문에, Anthropic이 새 정책을 게시하지 않는 한 OpenClaw는 Claude CLI 재사용과 `claude -p` 사용을 이 통합에 대해 허용된 방식으로 취급합니다. 호스트에서 Claude CLI 재사용이 가능하면, 이제 이것이 권장 경로입니다.

장기간 실행되는 gateway 호스트에서는 Anthropic API 키가 여전히 가장 예측 가능한 설정입니다. 같은 호스트에서 기존 Claude 로그인을 재사용하려면, 온보딩/구성에서 Anthropic Claude CLI 경로를 사용하세요.

Claude CLI 재사용을 위한 권장 호스트 설정:

```bash
# gateway 호스트에서 실행
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

이는 2단계 설정입니다:

1. gateway 호스트에서 Claude Code 자체를 Anthropic에 로그인합니다.
2. OpenClaw에 Anthropic 모델 선택을 로컬 `claude-cli` 백엔드로 전환하고, 일치하는 OpenClaw 인증 프로필을 저장하도록 지시합니다.

`claude`가 `PATH`에 없다면, 먼저 Claude Code를 설치하거나
`agents.defaults.cliBackends.claude-cli.command`를 실제 바이너리 경로로 설정하세요.

수동 토큰 입력(모든 프로바이더, `auth-profiles.json` 기록 + config 업데이트):

```bash
openclaw models auth paste-token --provider openrouter
```

정적 자격 증명에는 인증 프로필 ref도 지원됩니다:

- `api_key` 자격 증명은 `keyRef: { source, provider, id }`를 사용할 수 있습니다
- `token` 자격 증명은 `tokenRef: { source, provider, id }`를 사용할 수 있습니다
- OAuth 모드 프로필은 SecretRef 자격 증명을 지원하지 않습니다. `auth.profiles.<id>.mode`가 `"oauth"`로 설정된 경우, 해당 프로필에 대한 SecretRef 기반 `keyRef`/`tokenRef` 입력은 거부됩니다.

자동화 친화적 확인(만료/없음이면 종료 코드 `1`, 곧 만료이면 `2`):

```bash
openclaw models status --check
```

실시간 인증 probe:

```bash
openclaw models status --probe
```

참고:

- probe 행은 인증 프로필, env 자격 증명, 또는 `models.json`에서 올 수 있습니다.
- 명시적 `auth.order.<provider>`가 저장된 프로필을 생략하면, probe는 해당 프로필을 시도하는 대신 `excluded_by_auth_order`를 보고합니다.
- 인증은 존재하지만 OpenClaw가 해당 프로바이더에 대해 probe 가능한 모델 후보를 확인할 수 없으면, probe는 `status: no_model`을 보고합니다.
- rate limit cooldown은 모델 범위일 수 있습니다. 한 모델에서 cooldown 중인 프로필도 같은 프로바이더의 다른 모델에서는 여전히 사용할 수 있을 수 있습니다.

선택적 운영 스크립트(systemd/Termux)는 여기 문서화되어 있습니다:
[Auth monitoring scripts](/ko/help/scripts#auth-monitoring-scripts)

## Anthropic 참고

Anthropic `claude-cli` 백엔드는 다시 지원됩니다.

- Anthropic 직원이 이 OpenClaw 통합 경로가 다시 허용된다고 알려왔습니다.
- 따라서 Anthropic이 새 정책을 게시하지 않는 한, OpenClaw는 Anthropic 기반 실행에 대해 Claude CLI 재사용과 `claude -p` 사용을 허용된 방식으로 취급합니다.
- 장기간 실행되는 gateway 호스트와 명시적인 서버 측 과금 제어에는 Anthropic API 키가 여전히 가장 예측 가능한 선택입니다.

## 모델 인증 상태 확인

```bash
openclaw models status
openclaw doctor
```

## API 키 순환 동작(gateway)

일부 프로바이더는 API 호출이 프로바이더 rate limit에 걸렸을 때 대체 키로 요청을 재시도하는 것을 지원합니다.

- 우선순위:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`(단일 재정의)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 프로바이더는 추가 대체값으로 `GOOGLE_API_KEY`도 포함합니다.
- 동일한 키 목록은 사용 전에 중복 제거됩니다.
- OpenClaw는 rate limit 오류에 대해서만 다음 키로 재시도합니다(예: `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, 또는 `workers_ai ... quota limit exceeded`).
- rate limit이 아닌 오류는 대체 키로 재시도하지 않습니다.
- 모든 키가 실패하면 마지막 시도의 최종 오류를 반환합니다.

## 사용할 자격 증명 제어

### 세션별(채팅 명령어)

현재 세션에 특정 프로바이더 자격 증명을 고정하려면 `/model <alias-or-id>@<profileId>`를 사용하세요(예시 프로필 id: `anthropic:default`, `anthropic:work`).

간단한 선택기에는 `/model`(또는 `/model list`)를 사용하고, 전체 보기에는 `/model status`를 사용하세요(후보 + 다음 인증 프로필, 그리고 구성된 경우 프로바이더 엔드포인트 세부 정보 포함).

### 에이전트별(CLI 재정의)

에이전트에 대한 명시적 인증 프로필 순서 재정의를 설정합니다(해당 에이전트의 `auth-state.json`에 저장됨):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

특정 에이전트를 대상으로 하려면 `--agent <id>`를 사용하고, 생략하면 구성된 기본 에이전트를 사용합니다.
순서 문제를 디버깅할 때 `openclaw models status --probe`는 생략된 저장 프로필을 조용히 건너뛰는 대신 `excluded_by_auth_order`로 표시합니다.
cooldown 문제를 디버깅할 때는 rate limit cooldown이 전체 프로바이더 프로필이 아니라 특정 모델 id에 묶일 수 있다는 점을 기억하세요.

## 문제 해결

### "No credentials found"

Anthropic 프로필이 없으면 **gateway 호스트**에 Anthropic API 키를 구성하거나 Anthropic 설정 토큰 경로를 설정한 뒤 다시 확인하세요:

```bash
openclaw models status
```

### 토큰이 곧 만료되거나 이미 만료됨

어떤 프로필이 만료 중인지 확인하려면 `openclaw models status`를 실행하세요. Anthropic 토큰 프로필이 없거나 만료된 경우, 설정 토큰으로 해당 설정을 새로 고치거나 Anthropic API 키로 마이그레이션하세요.

## 관련 항목

- [비밀 관리](/ko/gateway/secrets)
- [원격 액세스](/ko/gateway/remote)
- [인증 저장소](/ko/concepts/oauth)
