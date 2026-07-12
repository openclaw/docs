---
read_when:
    - 모델 인증 또는 OAuth 만료 디버깅
    - 인증 또는 자격 증명 저장소 문서화
summary: '모델 인증: OAuth, API 키, Claude CLI 재사용 및 Anthropic 설정 토큰'
title: 인증
x-i18n:
    generated_at: "2026-07-12T15:10:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
이 페이지에서는 **모델 제공자** 인증(API 키, OAuth, Claude CLI 재사용, Anthropic 설정 토큰)을 다룹니다. **Gateway 연결** 인증(토큰, 비밀번호, 신뢰할 수 있는 프록시)은 [구성](/ko/gateway/configuration) 및 [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 참조하십시오.
</Note>

OpenClaw는 모델 제공자에 대해 OAuth와 API 키를 지원합니다. 상시 실행되는 Gateway 호스트에서는 API 키가 가장 예측 가능한 옵션이며, 구독/OAuth 흐름도 제공자 계정 모델과 일치하면 사용할 수 있습니다.

- 전체 OAuth 흐름 및 저장소 구조: [/concepts/oauth](/ko/concepts/oauth)
- SecretRef 기반 인증(`env`/`file`/`exec` 제공자): [비밀 관리](/ko/gateway/secrets)
- `models status --probe`에서 사용하는 자격 증명 적격성/사유 코드: [인증 자격 증명 의미 체계](/ko/auth-credential-semantics)

## 권장 설정: API 키(모든 제공자)

1. 제공자 콘솔에서 API 키를 생성합니다.
2. **Gateway 호스트**(`openclaw gateway`를 실행하는 머신)에 키를 설정합니다.

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway가 systemd/launchd에서 실행되는 경우 데몬이 읽을 수 있도록 키를 `~/.openclaw/.env`에 넣습니다.

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Gateway 프로세스(또는 데몬)를 다시 시작한 다음 재확인합니다.

```bash
openclaw models status
openclaw doctor
```

환경 변수를 직접 관리하고 싶지 않다면 `openclaw onboard`를 사용하여 데몬용 API 키를 저장할 수도 있습니다. 전체 환경 변수 로드 우선순위(`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd)는 [환경 변수](/ko/help/environment)를 참조하십시오.

## Anthropic: Claude CLI 재사용

Anthropic 설정 토큰 인증은 계속 지원됩니다. Claude CLI 재사용(`claude -p` 방식의 사용)도 이 통합에서 공식적으로 허용됩니다. 호스트에서 Claude CLI 로그인을 사용할 수 있다면 로컬/데스크톱 사용 시 이 방법을 권장합니다. 장기간 실행되는 Gateway 호스트에서는 서버 측 결제를 명시적으로 제어할 수 있는 Anthropic API 키가 여전히 가장 예측 가능한 선택입니다.

Claude CLI 재사용을 위한 호스트 설정:

```bash
# Gateway 호스트에서 실행합니다
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

이는 두 단계로 이루어집니다. 먼저 호스트에서 Claude Code를 Anthropic에 로그인한 다음, OpenClaw가 로컬 `claude-cli` 백엔드를 통해 Anthropic 모델 선택을 라우팅하고 일치하는 OpenClaw 인증 프로필을 저장하도록 지시합니다.

`claude`가 `PATH`에 없다면 Claude Code를 설치하거나 `agents.defaults.cliBackends.claude-cli.command`를 바이너리 경로로 설정하십시오.

## 수동 토큰 입력

모든 제공자에서 사용할 수 있으며, 에이전트별 SQLite 인증 저장소에 기록하고 구성을 업데이트합니다.

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw는 각 에이전트의 `openclaw-agent.sqlite`에서 인증 프로필을 읽습니다. 엔드포인트 세부 정보(`baseUrl`, `api`, 모델 ID, 헤더, 제한 시간)는 인증 프로필이 아니라 `openclaw.json` 또는 `models.json`의 `models.providers.<id>` 아래에 있어야 합니다.

이전 설치에 아직 `auth-profiles.json`, `auth-state.json` 또는 `{ "openrouter": { "apiKey": "..." } }` 같은 평면 구조가 남아 있다면 `openclaw doctor --fix`를 실행하여 SQLite로 가져오십시오. doctor는 원본 JSON 파일 옆에 타임스탬프가 포함된 백업을 보관합니다.

Bedrock `auth: "aws-sdk"`와 같은 외부 인증 경로는 자격 증명이 아닙니다. 이름이 지정된 Bedrock 경로의 경우 `openclaw.json`에서 `auth.profiles.<id>.mode: "aws-sdk"`를 설정하십시오. 인증 프로필 저장소에 `type: "aws-sdk"`를 기록하지 마십시오. `openclaw doctor --fix`는 레거시 AWS SDK 마커를 자격 증명 저장소에서 구성 메타데이터로 마이그레이션합니다.

### SecretRef 기반 자격 증명

- `api_key` 자격 증명은 `keyRef: { source, provider, id }`를 사용할 수 있습니다.
- `token` 자격 증명은 `tokenRef: { source, provider, id }`를 사용할 수 있습니다.
- OAuth 모드 프로필은 SecretRef 자격 증명을 거부합니다. `auth.profiles.<id>.mode`가 `"oauth"`이면 해당 프로필의 SecretRef 기반 `keyRef`/`tokenRef`가 거부됩니다.

## 모델 인증 상태 확인

```bash
openclaw models status
openclaw doctor
```

자동화에 적합한 검사로, 만료되었거나 누락된 경우 종료 코드 `1`, 곧 만료되는 경우 `2`를 반환합니다.

```bash
openclaw models status --check
```

실시간 인증 프로브(범위를 좁히려면 `--probe-provider`, `--probe-profile`, `--probe-timeout`, `--probe-concurrency` 또는 `--probe-max-tokens` 추가):

```bash
openclaw models status --probe
```

참고:

- 프로브 행은 인증 프로필, 환경 자격 증명 또는 `models.json`에서 가져올 수 있습니다.
- `auth.order.<provider>`에서 저장된 프로필을 생략하면 프로브는 해당 프로필을 시도하는 대신 `excluded_by_auth_order`를 보고합니다.
- 인증이 존재하지만 OpenClaw가 해당 제공자에 대해 프로브 가능한 모델을 확인할 수 없으면 프로브는 `status: no_model`을 보고합니다.
- 속도 제한 쿨다운은 모델 범위로 적용될 수 있습니다. 한 모델에서 쿨다운 중인 프로필도 동일한 제공자의 다른 형제 모델에는 계속 사용될 수 있습니다.

선택적 운영 스크립트(systemd/Termux): [인증 모니터링 스크립트](/ko/help/scripts#auth-monitoring-scripts).

## API 키 순환(Gateway)

일부 제공자는 호출이 제공자 속도 제한에 도달하면 구성된 대체 키로 요청을 재시도합니다.

제공자별 키 우선순위:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY`(단일 재정의, 하나의 키로 고정)
2. `<PROVIDER>_API_KEYS`(쉼표/공백/세미콜론으로 구분된 목록)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*`(이 접두사가 있는 모든 환경 변수)

Google 제공자(`google`, `google-vertex`)는 추가로 `GOOGLE_API_KEY`를 대체 수단으로 사용합니다. 결합된 목록은 사용 전에 중복 제거됩니다.

OpenClaw는 오류 메시지가 `rate_limit`, `rate limit`, `429`, `quota exceeded`/`quota_exceeded`, `resource exhausted`/`resource_exhausted` 또는 `too many requests`와 일치할 때만 다음 키로 순환합니다. 다른 오류는 대체 키로 재시도하지 않습니다. 모든 키가 실패하면 마지막 시도에서 발생한 최종 오류를 반환합니다.

<Note>
`ThrottlingException`, `concurrency limit reached` 또는 `workers_ai ... quota limit exceeded` 같은 제공자별 문구는 **장애 조치/재시도 분류**(반복 실패 시 모델 또는 제공자 전환)를 결정합니다. 이는 위의 API 키 순환과는 별도의 메커니즘입니다.
</Note>

저장된 인증을 제거해도 제공자의 키가 폐기되지는 않습니다. 제공자 측에서 무효화해야 하는 경우 제공자 대시보드에서 키를 순환하거나 폐기하십시오.

## Gateway 실행 중 제공자 인증 제거

Gateway 제어 영역을 통해 제공자 인증을 제거하면 OpenClaw는 해당 제공자에 저장된 인증 프로필을 삭제하고, 선택된 모델 제공자가 제거된 제공자와 일치하는 활성 채팅/에이전트 실행을 중단합니다. 중단된 실행은 `stopReason: "auth-revoked"`와 함께 일반적인 취소/수명 주기 이벤트를 내보내므로, 연결된 클라이언트는 자격 증명이 제거되어 실행이 중지되었음을 표시할 수 있습니다.

## 사용할 자격 증명 제어

### OpenAI 및 레거시 `openai-codex` ID

OpenAI API 키 프로필과 ChatGPT/Codex OAuth 프로필은 모두 정식 제공자 ID `openai`를 사용합니다. 새 구성에는 `openai:*` 프로필 ID와 `auth.order.openai`를 사용하십시오.

이전 구성, 인증 프로필 ID 또는 `auth.order.openai-codex`에 `openai-codex`가 있다면 레거시 마이그레이션 입력으로 취급하십시오. 새 `openai-codex` 프로필을 만들지 마십시오. 다음을 실행합니다.

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

doctor는 레거시 `openai-codex:*` 프로필 ID와 `auth.order.openai-codex` 항목을 정식 `openai` 경로로 다시 작성합니다. OpenAI 전용 모델/런타임 라우팅은 [OpenAI](/ko/providers/openai)를 참조하십시오.

### 로그인 중(CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id`는 동일한 제공자에 대한 여러 OAuth 로그인을 하나의 에이전트 내에서 분리하여 유지합니다.

`--force`는 선택한 에이전트 디렉터리에서 해당 제공자에 저장된 인증 프로필을 삭제한 다음 동일한 인증 흐름을 다시 실행합니다. 저장된 프로필이 중단된 상태이거나 만료되었거나 잘못된 계정에 연결된 경우 사용하십시오. 이 옵션은 제공자의 자격 증명을 폐기하지 않습니다.

```bash
openclaw models auth login --provider anthropic --force
```

### 세션별(채팅 명령)

- `/model <alias-or-id>@<profileId>`는 현재 세션에서 특정 제공자 자격 증명을 고정합니다(프로필 ID 예: `anthropic:default`, `anthropic:work`).
- `/model`(또는 `/model list`)은 간결한 선택기를 표시하고, `/model status`는 전체 보기(후보 + 다음 인증 프로필 및 구성된 경우 제공자 엔드포인트 세부 정보)를 표시합니다.

이미 실행 중인 채팅의 인증 순서 또는 프로필 고정을 변경했다면 `/new` 또는 `/reset`을 전송하여 새 세션을 시작하십시오. 기존 세션은 재설정될 때까지 현재 모델/프로필 선택을 유지합니다.

### 에이전트별(CLI 재정의)

인증 순서 재정의는 해당 에이전트의 SQLite 인증 상태에 저장됩니다.

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

특정 에이전트를 대상으로 하려면 `--agent <id>`를 사용하고, 구성된 기본 에이전트를 사용하려면 생략하십시오. `openclaw models status --probe`는 생략된 저장 프로필을 조용히 건너뛰지 않고 `excluded_by_auth_order`로 표시합니다.

## 문제 해결

### "자격 증명을 찾을 수 없음"

**Gateway 호스트**에서 Anthropic API 키를 구성하거나 Anthropic 설정 토큰 경로를 설정한 다음 재확인합니다.

```bash
openclaw models status
```

### 토큰 만료 임박/만료

`openclaw models status`를 실행하여 어떤 프로필이 만료되는지 확인하십시오. Anthropic 토큰 프로필이 누락되었거나 만료된 경우 설정 토큰을 통해 갱신하거나 Anthropic API 키로 마이그레이션하십시오.

## 관련 항목

- [비밀 관리](/ko/gateway/secrets)
- [원격 액세스](/ko/gateway/remote)
- [인증 저장소](/ko/concepts/oauth)
