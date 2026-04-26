---
read_when:
    - 기본 모델을 변경하거나 공급자 인증 상태를 확인하려고 합니다
    - 사용 가능한 모델/공급자를 스캔하고 인증 프로필을 디버그하려고 합니다
summary: '`openclaw models`용 CLI 참조(status/list/set/scan, 별칭, 대체 동작, 인증)'
title: 모델
x-i18n:
    generated_at: "2026-04-26T11:26:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5acf5972251ee7aa22d1f9222f1a497822fb1f25f29f827702f8b37dda8dadf
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

모델 탐색, 스캔 및 구성(기본 모델, 대체 동작, 인증 프로필).

관련 항목:

- 공급자 + 모델: [모델](/ko/providers/models)
- 모델 선택 개념 + `/models` 슬래시 명령: [모델 개념](/ko/concepts/models)
- 공급자 인증 설정: [시작하기](/ko/start/getting-started)

## 일반 명령어

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`는 확인된 기본값/대체 동작과 인증 개요를 표시합니다.
공급자 사용량 스냅샷을 사용할 수 있으면 OAuth/API 키 상태 섹션에 공급자 사용량 기간과 할당량 스냅샷이 포함됩니다.
현재 사용량 기간 공급자: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, z.ai. 사용량 인증은 가능할 때 공급자별 훅에서 가져오며,
그렇지 않으면 OpenClaw는 인증 프로필, env 또는 config의 일치하는 OAuth/API 키
자격 증명으로 대체합니다.
`--json` 출력에서 `auth.providers`는 env/config/store를 인식하는 공급자
개요이고, `auth.oauth`는 인증 저장소 프로필 상태만 나타냅니다.
각 구성된 공급자 프로필에 대해 라이브 인증 프로브를 실행하려면 `--probe`를 추가하세요.
프로브는 실제 요청이므로(토큰을 소비하고 속도 제한을 유발할 수 있음) 주의하세요.
구성된 에이전트의 모델/인증 상태를 검사하려면 `--agent <id>`를 사용하세요. 생략하면
이 명령은 설정된 경우 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`을 사용하고, 그렇지 않으면
구성된 기본 에이전트를 사용합니다.
프로브 행은 인증 프로필, env 자격 증명 또는 `models.json`에서 가져올 수 있습니다.

참고:

- `models set <model-or-alias>`는 `provider/model` 또는 별칭을 허용합니다.
- `models list`는 읽기 전용입니다. config, 인증 프로필, 기존 카탈로그
  상태 및 공급자 소유 카탈로그 행을 읽지만 `models.json`을 다시
  쓰지는 않습니다.
- `models list --all --provider <id>`는 해당 공급자로 아직 인증하지 않았더라도
  Plugin 매니페스트 또는 번들 공급자 카탈로그 메타데이터의 공급자 소유 정적 카탈로그
  행을 포함할 수 있습니다. 이러한 행은 일치하는 인증이 구성될 때까지 계속 사용할 수 없음으로 표시됩니다.
- `models list`는 기본 모델 메타데이터와 런타임 한도를 구분해서 유지합니다.
  표 출력에서 유효한 런타임 한도가 기본 컨텍스트 창과 다를 때 `Ctx`는 `contextTokens/contextWindow`를 표시하며,
  JSON 행에는 공급자가 해당 한도를 노출할 경우 `contextTokens`가 포함됩니다.
- `models list --provider <id>`는 `moonshot` 또는
  `openai-codex` 같은 공급자 ID로 필터링합니다. 대화형 공급자 선택기에서 표시되는 `Moonshot AI` 같은 표시 레이블은 허용하지 않습니다.
- 모델 참조는 **첫 번째** `/`를 기준으로 분할해 파싱됩니다. 모델 ID에 `/`가 포함되어 있으면(OpenRouter 스타일) 공급자 접두사를 포함하세요(예: `openrouter/moonshotai/kimi-k2`).
- 공급자를 생략하면 OpenClaw는 먼저 입력값을 별칭으로 확인한 다음,
  정확한 모델 ID에 대한 고유한 구성 공급자 일치 항목으로 확인하고, 그 후에만 더 이상 사용되지 않음을 경고하면서
  구성된 기본 공급자로 대체합니다.
  해당 공급자가 더 이상 구성된 기본 모델을 노출하지 않으면 OpenClaw는
  오래된 제거된 공급자 기본값을 표시하는 대신 첫 번째 구성된 공급자/모델로 대체합니다.
- `models status`는 비밀이 아닌 플레이스홀더에 대해 인증 출력에 비밀을 마스킹하는 대신 `marker(<value>)`를 표시할 수 있습니다(예: `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`).

### `models scan`

`models scan`은 OpenRouter의 공개 `:free` 카탈로그를 읽고
대체용 후보의 순위를 매깁니다. 카탈로그 자체는 공개이므로 메타데이터 전용 스캔에는 OpenRouter 키가 필요하지 않습니다.

기본적으로 OpenClaw는 라이브 모델 호출로 도구 및 이미지 지원을 프로브하려고 시도합니다.
구성된 OpenRouter 키가 없으면 이 명령은 메타데이터 전용 출력으로 대체하고
프로브와 추론에는 `:free` 모델에도 여전히 `OPENROUTER_API_KEY`가 필요하다고 설명합니다.

옵션:

- `--no-probe` (메타데이터만; config/secrets 조회 없음)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (카탈로그 요청 및 프로브별 시간 초과)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` 및 `--set-image`에는 라이브 프로브가 필요합니다. 메타데이터 전용 스캔
결과는 정보 제공용이며 config에 적용되지 않습니다.

### `models status`

옵션:

- `--json`
- `--plain`
- `--check` (종료 코드 1=만료/누락, 2=곧 만료)
- `--probe` (구성된 인증 프로필의 라이브 프로브)
- `--probe-provider <name>` (하나의 공급자만 프로브)
- `--probe-profile <id>` (반복 또는 쉼표로 구분된 프로필 ID)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (구성된 에이전트 ID, `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` 재정의)

프로브 상태 버킷:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

예상할 수 있는 프로브 세부 정보/이유 코드 사례:

- `excluded_by_auth_order`: 저장된 프로필이 존재하지만 명시적인
  `auth.order.<provider>`에 포함되지 않아, 프로브가 시도하는 대신 제외를 보고합니다.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  프로필은 존재하지만 적격하지 않거나 확인할 수 없습니다.
- `no_model`: 공급자 인증은 존재하지만 OpenClaw가 해당 공급자에 대해 프로브 가능한
  모델 후보를 확인할 수 없었습니다.

## 별칭 + 대체 동작

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 인증 프로필

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add`는 대화형 인증 도우미입니다. 선택한 공급자에 따라
공급자 인증 흐름(OAuth/API 키)을 시작하거나 수동 토큰 붙여넣기로 안내할 수 있습니다.

`models auth login`은 공급자 Plugin의 인증 흐름(OAuth/API 키)을 실행합니다.
설치된 공급자를 확인하려면 `openclaw plugins list`를 사용하세요.
특정 구성 에이전트 저장소에 인증 결과를 쓰려면
`openclaw models auth --agent <id> <subcommand>`를 사용하세요. 상위 `--agent` 플래그는
`add`, `login`, `setup-token`, `paste-token`, `login-github-copilot`에서 적용됩니다.

예시:

```bash
openclaw models auth login --provider openai-codex --set-default
```

참고:

- `setup-token`과 `paste-token`은 토큰 인증 메서드를 노출하는 공급자를 위한
  일반 토큰 명령으로 유지됩니다.
- `setup-token`은 대화형 TTY가 필요하며 공급자의 토큰 인증 메서드를 실행합니다
  (공급자가 이를 노출하면 기본적으로 해당 공급자의 `setup-token` 메서드를 사용).
- `paste-token`은 다른 곳이나 자동화에서 생성된 토큰 문자열을 받습니다.
- `paste-token`은 `--provider`가 필요하고, 토큰 값을 묻고,
  `--profile-id`를 전달하지 않으면 기본 프로필 ID `<provider>:manual`에 씁니다.
- `paste-token --expires-in <duration>`은 `365d` 또는 `12h` 같은
  상대 기간으로부터 절대 토큰 만료 시점을 저장합니다.
- Anthropic 참고: Anthropic 직원이 OpenClaw 스타일 Claude CLI 사용이 다시 허용된다고 알려왔으므로, Anthropic이 새 정책을 발표하지 않는 한 OpenClaw는 이 통합에 대해 Claude CLI 재사용과 `claude -p` 사용을 허용된 것으로 처리합니다.
- Anthropic `setup-token` / `paste-token`은 계속 지원되는 OpenClaw 토큰 경로로 제공되지만, OpenClaw는 이제 가능하면 Claude CLI 재사용과 `claude -p`를 선호합니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [모델 선택](/ko/concepts/model-providers)
- [모델 장애 조치](/ko/concepts/model-failover)
