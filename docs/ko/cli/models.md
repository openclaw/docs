---
read_when:
    - 기본 model을 변경하거나 provider 인증 상태를 확인하려고 합니다
    - 사용 가능한 model/provider를 스캔하고 auth profile을 디버깅하려고 합니다
summary: '`openclaw models`에 대한 CLI 참조(status/list/set/scan, alias, fallback, auth)'
title: models
x-i18n:
    generated_at: "2026-04-23T14:01:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4ba72ca8acb7cc31796c119fce3816e6a919eb28a4ed4b03664d3b222498f5a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Model 검색, 스캔, 구성(기본 model, fallback, auth profile)을 관리합니다.

관련 항목:

- provider + model: [Models](/ko/providers/models)
- model 선택 개념 + `/models` 슬래시 명령: [Models concept](/ko/concepts/models)
- provider 인증 설정: [Getting started](/ko/start/getting-started)

## 일반적인 명령

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`는 해석된 기본값/fallback과 인증 개요를 표시합니다.
provider 사용량 스냅샷을 사용할 수 있으면 OAuth/API-key 상태 섹션에
provider 사용량 창과 할당량 스냅샷이 포함됩니다.
현재 사용량 창 provider: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, z.ai. 사용량 인증은 가능할 때 provider별 hook에서
가져오며, 그렇지 않으면 OpenClaw는 auth profile, env 또는 config의 일치하는 OAuth/API-key
자격 증명으로 fallback합니다.
`--json` 출력에서 `auth.providers`는 env/config/store를 인식하는 provider
개요이고, `auth.oauth`는 auth-store profile 상태만 나타냅니다.
구성된 각 provider profile에 대해 라이브 인증 프로브를 실행하려면 `--probe`를 추가하세요.
프로브는 실제 요청입니다(토큰을 소비하거나 rate limit를 유발할 수 있음).
구성된 agent의 model/auth 상태를 검사하려면 `--agent <id>`를 사용하세요. 생략하면
명령은 설정된 경우 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`를 사용하고, 그렇지 않으면
구성된 기본 agent를 사용합니다.
프로브 행은 auth profile, env 자격 증명 또는 `models.json`에서 올 수 있습니다.

참고:

- `models set <model-or-alias>`는 `provider/model` 또는 alias를 받습니다.
- `models list --all`은 아직 해당 provider로 인증하지 않았더라도 번들된 provider 소유 정적 카탈로그 행을 포함합니다. 이러한 행은 일치하는 인증이 구성되기 전까지는 계속 사용할 수 없는 상태로 표시됩니다.
- `models list --provider <id>`는 `moonshot` 또는 `openai-codex` 같은 provider id로 필터링합니다. `Moonshot AI` 같은 대화형 provider 선택기의 표시 레이블은 허용하지 않습니다.
- Model ref는 **첫 번째** `/`에서 분할하여 파싱됩니다. model ID에 `/`가 포함되어 있으면(OpenRouter 스타일) provider 접두사를 포함하세요(예: `openrouter/moonshotai/kimi-k2`).
- provider를 생략하면 OpenClaw는 먼저 입력을 alias로 해석하고, 그다음 해당 정확한 model id에 대한 고유한 구성된 provider 일치로 해석하며, 그 후에만 더 이상 권장되지 않음을 경고하면서 구성된 기본 provider로 fallback합니다.
  해당 provider가 더 이상 구성된 기본 model을 노출하지 않으면, OpenClaw는 오래되어 제거된 provider 기본값을 표시하는 대신 첫 번째 구성된 provider/model로 fallback합니다.
- `models status`는 비밀이 아닌 placeholder에 대해 이를 secret처럼 마스킹하는 대신 auth 출력에 `marker(<value>)`를 표시할 수 있습니다(예: `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`).

### `models status`

옵션:

- `--json`
- `--plain`
- `--check` (종료 코드 1=만료/누락, 2=곧 만료)
- `--probe` (구성된 auth profile의 라이브 프로브)
- `--probe-provider <name>` (하나의 provider 프로브)
- `--probe-profile <id>` (반복 가능 또는 쉼표로 구분된 profile id)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (구성된 agent id, `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` 재정의)

프로브 상태 버킷:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

예상할 수 있는 프로브 세부 정보/사유 코드 사례:

- `excluded_by_auth_order`: 저장된 profile이 있지만 명시적인
  `auth.order.<provider>`에서 이를 생략했으므로, 프로브는 시도하는 대신
  제외 사실을 보고합니다.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profile은 존재하지만 적격하지 않거나 해석할 수 없습니다.
- `no_model`: provider 인증은 존재하지만 OpenClaw가 해당 provider에 대해 프로브 가능한
  model 후보를 해석할 수 없습니다.

## alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## auth profile

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add`는 대화형 인증 도우미입니다. 선택한
provider에 따라 provider 인증 흐름(OAuth/API key)을 시작하거나 수동 토큰 붙여넣기를
안내할 수 있습니다.

`models auth login`은 provider Plugin의 인증 흐름(OAuth/API key)을 실행합니다.
어떤 provider가 설치되어 있는지 보려면 `openclaw plugins list`를 사용하세요.

예시:

```bash
openclaw models auth login --provider openai-codex --set-default
```

참고:

- `setup-token`과 `paste-token`은 토큰 인증 방법을 노출하는 provider를 위한 일반 토큰 명령으로 유지됩니다.
- `setup-token`은 대화형 TTY가 필요하며 provider의 토큰 인증
  메서드를 실행합니다(해당 provider가 이를 노출하는 경우 기본적으로 그 provider의 `setup-token` 메서드를 사용).
- `paste-token`은 다른 곳이나 자동화에서 생성된 토큰 문자열을 받습니다.
- `paste-token`은 `--provider`가 필요하고, 토큰 값을 프롬프트로 받은 뒤,
  `--profile-id`를 전달하지 않으면 이를 기본 profile id `<provider>:manual`에 씁니다.
- `paste-token --expires-in <duration>`은 `365d` 또는 `12h` 같은
  상대 기간으로부터 절대 토큰 만료 시각을 저장합니다.
- Anthropic 참고: Anthropic 직원이 OpenClaw 스타일 Claude CLI 사용이 다시 허용된다고 알려왔으므로, Anthropic이 새 정책을 발표하지 않는 한 OpenClaw는 이 통합에 대해 Claude CLI 재사용과 `claude -p` 사용을 허용된 것으로 취급합니다.
- Anthropic `setup-token` / `paste-token`은 계속 지원되는 OpenClaw 토큰 경로로 제공되지만, OpenClaw는 가능할 경우 이제 Claude CLI 재사용과 `claude -p`를 우선합니다.
