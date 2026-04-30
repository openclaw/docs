---
read_when:
    - 모델 인증 또는 OAuth 만료 디버깅
    - 인증 또는 자격 증명 저장소 문서화
summary: '모델 인증: OAuth, API 키, Claude CLI 재사용 및 Anthropic setup-token'
title: 인증
x-i18n:
    generated_at: "2026-04-30T06:28:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
이 페이지는 **모델 제공자** 인증 참조(API 키, OAuth, Claude CLI 재사용, Anthropic setup-token)입니다. **Gateway 연결** 인증(token, password, trusted-proxy)은 [구성](/ko/gateway/configuration) 및 [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 참조하세요.
</Note>

OpenClaw는 모델 제공자에 대해 OAuth와 API 키를 지원합니다. 항상 켜져 있는 Gateway
호스트에서는 API 키가 보통 가장 예측 가능한 옵션입니다. Subscription/OAuth
흐름도 제공자 계정 모델과 맞는 경우 지원됩니다.

전체 OAuth 흐름과 저장소
레이아웃은 [/concepts/oauth](/ko/concepts/oauth)을 참조하세요.
SecretRef 기반 인증(`env`/`file`/`exec` 제공자)은 [비밀 관리](/ko/gateway/secrets)를 참조하세요.
`models status --probe`에서 사용하는 자격 증명 적격성/이유 코드 규칙은
[인증 자격 증명 의미론](/ko/auth-credential-semantics)을 참조하세요.

## 권장 설정(API 키, 모든 제공자)

장기 실행 Gateway를 실행 중이라면 선택한
제공자의 API 키로 시작하세요.
Anthropic의 경우 특히 API 키 인증이 여전히 가장 예측 가능한 서버
설정이지만, OpenClaw는 로컬 Claude CLI 로그인 재사용도 지원합니다.

1. 제공자 콘솔에서 API 키를 생성합니다.
2. **Gateway 호스트**(`openclaw gateway`를 실행하는 머신)에 넣습니다.

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway가 systemd/launchd 아래에서 실행되는 경우, 데몬이 읽을 수 있도록
   `~/.openclaw/.env`에 키를 넣는 것이 좋습니다.

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

그런 다음 데몬을 재시작하거나 Gateway 프로세스를 재시작하고 다시 확인합니다.

```bash
openclaw models status
openclaw doctor
```

env vars를 직접 관리하고 싶지 않다면, 온보딩이 데몬 사용을 위해
API 키를 저장할 수 있습니다: `openclaw onboard`.

env 상속(`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd)에 대한 자세한 내용은 [도움말](/ko/help)을 참조하세요.

## Anthropic: Claude CLI 및 토큰 호환성

Anthropic setup-token 인증은 OpenClaw에서 지원되는 토큰
경로로 계속 사용할 수 있습니다. Anthropic 직원은 이후 OpenClaw 방식의 Claude CLI 사용이
다시 허용된다고 알려왔으므로, Anthropic이 새 정책을 게시하지 않는 한 OpenClaw는 이 통합에 대해 Claude CLI 재사용과 `claude -p` 사용을
승인된 것으로 취급합니다. 호스트에서
Claude CLI 재사용이 가능하다면 이제 그 경로가 권장됩니다.

장기 실행 Gateway 호스트의 경우 Anthropic API 키가 여전히 가장 예측 가능한
설정입니다. 같은 호스트에서 기존 Claude 로그인을 재사용하려면 온보딩/구성에서
Anthropic Claude CLI 경로를 사용하세요.

Claude CLI 재사용을 위한 권장 호스트 설정:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

이는 두 단계 설정입니다.

1. Gateway 호스트에서 Claude Code 자체를 Anthropic에 로그인합니다.
2. OpenClaw에 Anthropic 모델 선택을 로컬 `claude-cli`
   백엔드로 전환하고 일치하는 OpenClaw 인증 프로필을 저장하도록 지시합니다.

`claude`가 `PATH`에 없으면 먼저 Claude Code를 설치하거나
`agents.defaults.cliBackends.claude-cli.command`를 실제 바이너리 경로로 설정하세요.

수동 토큰 입력(모든 제공자, `auth-profiles.json` 작성 + 구성 업데이트):

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

OpenClaw는 런타임에 표준 `version` + `profiles` 형태를 기대합니다. 이전 설치에 아직 `{ "openrouter": { "apiKey": "..." } }` 같은 플랫 파일이 있다면 `openclaw doctor --fix`를 실행하여 이를 `openrouter:default` API-key 프로필로 다시 작성하세요. doctor는 원본 옆에 `.legacy-flat.*.bak` 복사본을 보관합니다. `baseUrl`, `api`, 모델 ID, 헤더, 시간 제한 같은 엔드포인트 세부 정보는 `auth-profiles.json`이 아니라 `openclaw.json` 또는 `models.json`의 `models.providers.<id>` 아래에 속합니다.

정적 자격 증명에는 인증 프로필 참조도 지원됩니다.

- `api_key` 자격 증명은 `keyRef: { source, provider, id }`를 사용할 수 있습니다
- `token` 자격 증명은 `tokenRef: { source, provider, id }`를 사용할 수 있습니다
- OAuth 모드 프로필은 SecretRef 자격 증명을 지원하지 않습니다. `auth.profiles.<id>.mode`가 `"oauth"`로 설정되어 있으면 해당 프로필에 대한 SecretRef 기반 `keyRef`/`tokenRef` 입력은 거부됩니다.

자동화에 적합한 확인(만료/누락 시 종료 `1`, 곧 만료 시 `2`):

```bash
openclaw models status --check
```

실시간 인증 프로브:

```bash
openclaw models status --probe
```

참고:

- 프로브 행은 인증 프로필, env 자격 증명 또는 `models.json`에서 올 수 있습니다.
- 명시적 `auth.order.<provider>`가 저장된 프로필을 생략하면, 프로브는 해당 프로필을 시도하는 대신
  `excluded_by_auth_order`를 보고합니다.
- 인증이 있지만 OpenClaw가 해당 제공자에 대해 프로브 가능한 모델 후보를 확인할 수 없으면
  프로브는 `status: no_model`을 보고합니다.
- 속도 제한 쿨다운은 모델 범위일 수 있습니다. 한 모델에 대해 쿨다운 중인 프로필도
  같은 제공자의 형제 모델에는 여전히 사용할 수 있습니다.

선택적 운영 스크립트(systemd/Termux)는 여기에 문서화되어 있습니다.
[인증 모니터링 스크립트](/ko/help/scripts#auth-monitoring-scripts)

## Anthropic 참고

Anthropic `claude-cli` 백엔드가 다시 지원됩니다.

- Anthropic 직원은 이 OpenClaw 통합 경로가 다시 허용된다고 알려왔습니다.
- 따라서 Anthropic이 새 정책을 게시하지 않는 한, OpenClaw는 Anthropic 기반 실행에 대해 Claude CLI 재사용과 `claude -p` 사용을 승인된 것으로 취급합니다.
- Anthropic API 키는 장기 실행 Gateway
  호스트와 명시적인 서버 측 과금 제어에 가장 예측 가능한 선택으로 남아 있습니다.

## 모델 인증 상태 확인

```bash
openclaw models status
openclaw doctor
```

## API 키 순환 동작(Gateway)

일부 제공자는 API 호출이 제공자 속도 제한에 걸렸을 때 대체 키로 요청을 재시도하는 것을
지원합니다.

- 우선순위:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`(단일 오버라이드)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 제공자는 추가 폴백으로 `GOOGLE_API_KEY`도 포함합니다.
- 같은 키 목록은 사용 전에 중복 제거됩니다.
- OpenClaw는 속도 제한 오류(예:
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` 또는
  `workers_ai ... quota limit exceeded`)에 대해서만 다음 키로 재시도합니다.
- 속도 제한이 아닌 오류는 대체 키로 재시도하지 않습니다.
- 모든 키가 실패하면 마지막 시도에서 발생한 최종 오류가 반환됩니다.

## 사용할 자격 증명 제어

### 세션별(채팅 명령)

현재 세션에 특정 제공자 자격 증명을 고정하려면 `/model <alias-or-id>@<profileId>`를 사용하세요(예시 프로필 ID: `anthropic:default`, `anthropic:work`).

간결한 선택기는 `/model`(또는 `/model list`)을 사용하고, 전체 보기(후보 + 다음 인증 프로필, 구성된 경우 제공자 엔드포인트 세부 정보 포함)는 `/model status`를 사용하세요.

### 에이전트별(CLI 오버라이드)

에이전트에 대한 명시적 인증 프로필 순서 오버라이드를 설정합니다(해당 에이전트의 `auth-state.json`에 저장됨).

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

특정 에이전트를 대상으로 하려면 `--agent <id>`를 사용하고, 구성된 기본 에이전트를 사용하려면 생략하세요.
순서 문제를 디버그할 때 `openclaw models status --probe`는 저장된 프로필을 조용히 건너뛰는 대신
생략된 프로필을 `excluded_by_auth_order`로 표시합니다.
쿨다운 문제를 디버그할 때는 속도 제한 쿨다운이 전체 제공자 프로필이 아니라
하나의 모델 ID에 묶일 수 있다는 점을 기억하세요.

## 문제 해결

### "자격 증명을 찾을 수 없음"

Anthropic 프로필이 누락된 경우
**Gateway 호스트**에서 Anthropic API 키를 구성하거나 Anthropic setup-token 경로를 설정한 다음 다시 확인하세요.

```bash
openclaw models status
```

### 토큰 만료 예정/만료됨

어떤 프로필이 만료 예정인지 확인하려면 `openclaw models status`를 실행하세요.
Anthropic 토큰 프로필이 누락되었거나 만료된 경우 setup-token을 통해 해당 설정을 새로 고치거나 Anthropic API 키로 마이그레이션하세요.

## 관련 항목

- [비밀 관리](/ko/gateway/secrets)
- [원격 액세스](/ko/gateway/remote)
- [인증 저장소](/ko/concepts/oauth)
