---
read_when:
    - 기본 모델을 변경하거나 제공자 인증 상태를 확인하려는 경우
    - 사용 가능한 모델/제공자를 스캔하고 인증 프로필을 디버그하려는 경우
summary: '`openclaw models`에 대한 CLI 참조(status/list/set/scan, 별칭, 폴백, 인증)'
title: 모델
x-i18n:
    generated_at: "2026-05-06T19:35:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7749d97382529587d54ea96466edc880a731f2c2d39eed1677e4fbf129f11435
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

모델 검색, 스캔 및 구성(기본 모델, fallback, 인증 프로필).

관련 문서:

- 프로바이더 + 모델: [모델](/ko/providers/models)
- 모델 선택 개념 + `/models` 슬래시 명령: [모델 개념](/ko/concepts/models)
- 프로바이더 인증 설정: [시작하기](/ko/start/getting-started)

## 일반 명령

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`는 해석된 기본값/fallback과 인증 개요를 표시합니다.
프로바이더 사용량 스냅샷을 사용할 수 있으면 OAuth/API 키 상태 섹션에
프로바이더 사용량 기간과 할당량 스냅샷이 포함됩니다.
현재 사용량 기간 프로바이더: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, z.ai. 사용량 인증은 가능한 경우 프로바이더별 후크에서
가져오며, 그렇지 않으면 OpenClaw가 인증 프로필, env 또는 구성에서 일치하는
OAuth/API 키 자격 증명으로 fallback합니다.
`--json` 출력에서 `auth.providers`는 env/구성/스토어를 인식하는 프로바이더
개요이고, `auth.oauth`는 인증 스토어 프로필 상태만 나타냅니다.
구성된 각 프로바이더 프로필에 대해 라이브 인증 프로브를 실행하려면 `--probe`를 추가하세요.
프로브는 실제 요청입니다(토큰을 소비하고 rate limit를 유발할 수 있음).
구성된 에이전트의 모델/인증 상태를 확인하려면 `--agent <id>`를 사용하세요. 생략하면
명령은 설정되어 있는 경우 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`을 사용하고, 그렇지 않으면
구성된 기본 에이전트를 사용합니다.
프로브 행은 인증 프로필, env 자격 증명 또는 `models.json`에서 올 수 있습니다.
Codex OAuth 문제 해결에는 `openclaw models status`,
`openclaw models auth list --provider openai-codex`, 그리고
`openclaw config get agents.defaults.model --json`이 에이전트가 PI를 통해
`openai-codex/*`를 사용하는지, 네이티브 Codex 런타임을 통해 `openai/*`를
사용하는지 확인하는 가장 빠른 방법입니다. [OpenAI 프로바이더 설정](/ko/providers/openai#check-and-recover-codex-oauth-routing)을 참조하세요.

참고:

- `models set <model-or-alias>`는 `provider/model` 또는 별칭을 허용합니다.
- `models list`는 읽기 전용입니다. 구성, 인증 프로필, 기존 카탈로그
  상태, 프로바이더 소유 카탈로그 행을 읽지만 `models.json`을 다시 쓰지는 않습니다.
- `Auth` 열은 프로바이더 수준이며 읽기 전용입니다. 로컬 인증 프로필
  메타데이터, env 마커, 구성된 프로바이더 키, 로컬 프로바이더 마커,
  AWS Bedrock env/profile 마커, Plugin 합성 인증 메타데이터에서 계산됩니다.
  프로바이더 런타임을 로드하거나, keychain 비밀을 읽거나, 프로바이더 API를
  호출하거나, 모델별 실행 준비 상태를 정확히 증명하지 않습니다.
- `models list --all --provider <id>`는 아직 해당 프로바이더로 인증하지 않았더라도
  Plugin 매니페스트 또는 번들 프로바이더 카탈로그 메타데이터의 프로바이더 소유
  정적 카탈로그 행을 포함할 수 있습니다. 그런 행은 일치하는 인증이 구성될 때까지
  계속 사용할 수 없음으로 표시됩니다.
- `models list`는 프로바이더 카탈로그 검색이 느릴 때도 제어 플레인의 응답성을 유지합니다.
  기본 및 구성된 뷰는 짧은 대기 후 구성된 모델 행 또는 합성 모델 행으로 fallback하고
  검색은 백그라운드에서 완료되도록 둡니다. 정확한 전체 검색 카탈로그가 필요하고
  프로바이더 검색을 기다릴 수 있을 때는 `--all`을 사용하세요.
- 광범위한 `models list --all`은 프로바이더 런타임 보충 후크를 로드하지 않고
  매니페스트 카탈로그 행을 레지스트리 행 위에 병합합니다. 프로바이더로 필터링된
  매니페스트 빠른 경로는 `static`으로 표시된 프로바이더만 사용합니다. `refreshable`로
  표시된 프로바이더는 레지스트리/캐시 기반으로 유지되고 매니페스트 행을 보충으로
  추가하며, `runtime`으로 표시된 프로바이더는 레지스트리/런타임 검색을 유지합니다.
- `models list`는 네이티브 모델 메타데이터와 런타임 한도를 구분해서 유지합니다. 표
  출력에서 유효 런타임 한도가 네이티브 context window와 다를 때 `Ctx`는
  `contextTokens/contextWindow`를 표시합니다. JSON 행에는 프로바이더가 해당 한도를
  노출하는 경우 `contextTokens`가 포함됩니다.
- `models list --provider <id>`는 `moonshot` 또는 `openai-codex`와 같은 프로바이더 ID로
  필터링합니다. `Moonshot AI`와 같은 대화형 프로바이더 선택기의 표시 레이블은 허용하지 않습니다.
- 모델 참조는 **첫 번째** `/`를 기준으로 분할해 구문 분석됩니다. 모델 ID에 `/`가 포함된 경우(OpenRouter 방식) 프로바이더 접두사를 포함하세요(예: `openrouter/moonshotai/kimi-k2`).
- 프로바이더를 생략하면 OpenClaw는 입력을 먼저 별칭으로 해석한 다음,
  정확히 그 모델 ID에 대해 고유하게 구성된 프로바이더 일치 항목으로 해석하고,
  그 후에만 지원 중단 경고와 함께 구성된 기본 프로바이더로 fallback합니다.
  해당 프로바이더가 더 이상 구성된 기본 모델을 노출하지 않으면 OpenClaw는
  오래된 제거된 프로바이더 기본값을 표시하는 대신 처음 구성된 프로바이더/모델로 fallback합니다.
- `models status`는 인증 출력에서 비밀로 마스킹하는 대신 비밀이 아닌 placeholder(예: `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`)에 대해 `marker(<value>)`를 표시할 수 있습니다.

### 모델 스캔

`models scan`은 OpenRouter의 공개 `:free` 카탈로그를 읽고 fallback 용도에 맞게
후보의 순위를 매깁니다. 카탈로그 자체는 공개되어 있으므로 메타데이터 전용 스캔에는
OpenRouter 키가 필요하지 않습니다.

기본적으로 OpenClaw는 라이브 모델 호출로 도구 및 이미지 지원을 프로브하려고 시도합니다.
OpenRouter 키가 구성되어 있지 않으면 명령은 메타데이터 전용 출력으로 fallback하고,
`:free` 모델도 프로브와 추론에는 `OPENROUTER_API_KEY`가 필요하다고 설명합니다.

옵션:

- `--no-probe`(메타데이터만, 구성/비밀 조회 없음)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`(카탈로그 요청 및 프로브별 제한 시간)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default`와 `--set-image`에는 라이브 프로브가 필요합니다. 메타데이터 전용 스캔
결과는 정보 제공용이며 구성에 적용되지 않습니다.

### 모델 상태

옵션:

- `--json`
- `--plain`
- `--check`(종료 1=만료됨/누락됨, 2=곧 만료됨)
- `--probe`(구성된 인증 프로필의 라이브 프로브)
- `--probe-provider <name>`(프로바이더 하나 프로브)
- `--probe-profile <id>`(반복 또는 쉼표로 구분된 프로필 ID)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`(구성된 에이전트 ID, `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` 재정의)

`--json`은 stdout을 JSON payload 전용으로 유지합니다. 인증 프로필, 프로바이더,
시작 진단은 stderr로 라우팅되므로 스크립트가 stdout을 `jq` 같은 도구로 직접
파이프할 수 있습니다.

프로브 상태 버킷:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

예상되는 프로브 상세/사유 코드 사례:

- `excluded_by_auth_order`: 저장된 프로필은 존재하지만 명시적인
  `auth.order.<provider>`가 이를 생략했으므로, 프로브는 시도하는 대신 제외를 보고합니다.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  프로필은 있지만 사용할 수 없거나 해석할 수 없습니다.
- `no_model`: 프로바이더 인증은 있지만 OpenClaw가 해당 프로바이더에 대해 프로브 가능한
  모델 후보를 해석할 수 없습니다.

## 별칭 + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 인증 프로필

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add`는 대화형 인증 도우미입니다. 선택한 프로바이더에 따라 프로바이더 인증
흐름(OAuth/API 키)을 시작하거나 수동 토큰 붙여넣기로 안내할 수 있습니다.

`models auth list`는 토큰, API 키 또는 OAuth 비밀 자료를 출력하지 않고 선택한 에이전트의
저장된 인증 프로필을 나열합니다. `openai-codex` 같은 특정 프로바이더로 필터링하려면
`--provider <id>`를 사용하고, 스크립팅에는 `--json`을 사용하세요.

`models auth login`은 프로바이더 Plugin의 인증 흐름(OAuth/API 키)을 실행합니다. 설치된
프로바이더를 확인하려면 `openclaw plugins list`를 사용하세요.
인증 결과를 특정 구성된 에이전트 스토어에 쓰려면 `openclaw models auth --agent <id> <subcommand>`를 사용하세요.
상위 `--agent` 플래그는 `add`, `list`, `login`, `setup-token`, `paste-token`, 그리고
`login-github-copilot`에서 적용됩니다.

예:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

참고:

- `setup-token`과 `paste-token`은 토큰 인증 메서드를 노출하는 프로바이더를 위한
  범용 토큰 명령으로 유지됩니다.
- `setup-token`은 대화형 TTY가 필요하며 프로바이더의 토큰 인증 메서드를 실행합니다
  (프로바이더가 노출하는 경우 기본값은 해당 프로바이더의 `setup-token` 메서드).
- `paste-token`은 다른 곳 또는 자동화에서 생성된 토큰 문자열을 허용합니다.
- `paste-token`에는 `--provider`가 필요하고, 토큰 값을 묻고, `--profile-id`를 전달하지 않으면
  기본 프로필 ID `<provider>:manual`에 씁니다.
- `paste-token --expires-in <duration>`은 `365d` 또는 `12h` 같은 상대 기간에서 절대 토큰 만료를 저장합니다.
- Anthropic 참고: Anthropic 직원이 OpenClaw 방식의 Claude CLI 사용이 다시 허용된다고 알려왔으므로, Anthropic이 새 정책을 게시하지 않는 한 OpenClaw는 이 통합에서 Claude CLI 재사용과 `claude -p` 사용을 승인된 것으로 취급합니다.
- Anthropic `setup-token` / `paste-token`은 지원되는 OpenClaw 토큰 경로로 계속 사용할 수 있지만, OpenClaw는 이제 가능한 경우 Claude CLI 재사용과 `claude -p`를 선호합니다.

## 관련 문서

- [CLI 참조](/ko/cli)
- [모델 선택](/ko/concepts/model-providers)
- [모델 failover](/ko/concepts/model-failover)
