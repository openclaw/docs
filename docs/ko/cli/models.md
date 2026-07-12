---
read_when:
    - 기본 모델을 변경하거나 제공자 인증 상태를 확인하려고 합니다
    - 사용 가능한 모델/제공자를 검색하고 인증 프로필을 디버그하려고 합니다
summary: '`openclaw models`의 CLI 참조(status/list/set/scan, 별칭, 폴백, 인증)'
title: 모델
x-i18n:
    generated_at: "2026-07-12T15:06:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

모델 검색, 스캔 및 구성(기본 모델, 폴백, 인증 프로필).

관련 문서:

- 제공자 + 모델: [모델](/ko/providers/models)
- 모델 선택 개념 + `/models` 슬래시 명령: [모델 개념](/ko/concepts/models)
- 제공자 인증 설정: [시작하기](/ko/start/getting-started)

## 일반 명령

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

`status` 및 `auth` 하위 명령은 구성된 에이전트를 대상으로 지정하는 `--agent <id>`를 허용합니다. `list`, `scan`, `aliases`, `fallbacks`/`image-fallbacks`는 항상 구성된 기본 에이전트를 사용하며, `set`/`set-image`는 `--agent`를 허용하지 않습니다. 생략하면 `--agent`를 인식하는 명령은 `OPENCLAW_AGENT_DIR`이 설정된 경우 이를 사용하고, 그렇지 않으면 구성된 기본 에이전트를 사용합니다.

### 상태

`openclaw models status`는 확인된 기본 모델/폴백과 인증 개요를 표시합니다. 제공자 사용량 스냅샷을 사용할 수 있으면 OAuth/API 키 상태 섹션에 제공자 사용량 기간과 할당량 스냅샷이 포함됩니다. 현재 사용량 기간을 지원하는 제공자는 Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi 및 z.ai입니다. 사용량 인증은 가능한 경우 제공자별 훅에서 가져오며, 그렇지 않으면 OpenClaw가 인증 프로필, 환경 또는 구성에서 일치하는 OAuth/API 키 자격 증명으로 폴백합니다.

`--json` 출력에서 `auth.providers`는 환경/구성/저장소를 인식하는 제공자 개요이고, `auth.oauth`는 인증 저장소의 프로필 상태만 나타냅니다.

옵션:

| 플래그                    | 효과                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--json`                  | JSON 출력입니다. stdout을 `jq`로 파이프할 수 있도록 인증 프로필, 제공자 및 시작 진단은 stderr로 전송됩니다.             |
| `--plain`                 | 일반 텍스트 출력입니다.                                                                                                 |
| `--check`                 | 인증이 만료 임박/만료 상태이면 0이 아닌 값으로 종료합니다. `1` = 만료/누락, `2` = 만료 임박입니다.                     |
| `--probe`                 | 구성된 인증 프로필을 실시간으로 프로브합니다. 실제 요청이므로 토큰을 소비하고 속도 제한을 유발할 수 있습니다.          |
| `--probe-provider <name>` | 하나의 제공자만 프로브합니다.                                                                                           |
| `--probe-profile <id>`    | 특정 인증 프로필 ID를 프로브합니다(반복하거나 쉼표로 구분).                                                             |
| `--probe-timeout <ms>`    | 프로브별 제한 시간입니다.                                                                                               |
| `--probe-concurrency <n>` | 동시 프로브 수입니다.                                                                                                   |
| `--probe-max-tokens <n>`  | 프로브 최대 토큰 수입니다(최선의 노력).                                                                                 |
| `--agent <id>`            | 구성된 에이전트 ID이며, `OPENCLAW_AGENT_DIR`을 재정의합니다.                                                            |

프로브 행은 인증 프로필, 환경 자격 증명 또는 `models.json`에서 가져올 수 있습니다. 프로브 상태 범주: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

프로브가 모델 호출에 도달하지 못할 때 예상되는 프로브 세부 정보/이유 코드:

- `excluded_by_auth_order`: 저장된 프로필이 있지만 명시적인 `auth.order.<provider>`에서 이를 생략했으므로, 프로브는 시도하는 대신 제외되었음을 보고합니다.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: 프로필은 존재하지만 사용할 수 없거나 확인할 수 없습니다.
- `ineligible_profile`: 다른 이유로 프로필이 제공자 구성과 호환되지 않습니다.
- `no_model`: 제공자 인증은 존재하지만 OpenClaw가 해당 제공자에서 프로브할 수 있는 모델 후보를 확인하지 못했습니다.

OpenAI ChatGPT/Codex OAuth 문제를 해결할 때 `openclaw models status`, `openclaw models auth list --provider openai` 및 `openclaw config get agents.defaults.model --json`을 사용하면 에이전트에 네이티브 Codex 런타임을 통해 `openai/*`에 사용할 수 있는 `openai` OAuth 프로필이 있는지 가장 빠르게 확인할 수 있습니다. [OpenAI 제공자 설정](/ko/providers/openai#check-and-recover-codex-oauth-routing)을 참조하십시오.

### 목록

`openclaw models list`는 읽기 전용입니다. 구성, 인증 프로필, 기존 카탈로그 상태 및 제공자 소유 카탈로그 행을 읽지만 `models.json`을 다시 작성하지 않습니다.

옵션: `--all`(전체 카탈로그), `--local`(로컬 모델로 필터링), `--provider <id>`, `--json`, `--plain`.

참고:

- `Auth` 열은 읽기 전용입니다. OpenAI와 같이 제공자가 소유하는 모델 경로의 경우 각 행의 API/기본 URL 경로를 유효한 `auth.order`의 적격 프로필, 환경/구성 자격 증명 및 확인된 명령 범위 SecretRef와 대조합니다. 구체적인 OpenAI 행은 해당 경로 정책을 사용할 수 없으면 제공자 수준 인증을 차용하지 않고 알 수 없는 상태로 유지됩니다. 제공자 전용 레거시 검사와 다른 제공자는 제공자 수준 동작을 유지합니다. Plugin 합성 인증 메타데이터는 런타임 기능에 대한 힌트일 뿐 네이티브 계정 인증의 증거가 아니므로, 계정 의존 경로는 긍정적인 레지스트리 증거가 없으면 알 수 없는 상태로 유지됩니다. 이 명령은 제공자 런타임을 로드하거나, 키체인 보안 비밀을 읽거나, 제공자 API를 호출하거나, 정확한 실행 준비 상태를 입증하지 않습니다.
- `models list --all --provider <id>`는 해당 제공자로 아직 인증하지 않았더라도 Plugin 매니페스트 또는 번들 제공자 카탈로그 메타데이터에서 제공자 소유 정적 카탈로그 행을 포함할 수 있습니다. 해당 행은 일치하는 인증이 구성될 때까지 사용할 수 없는 상태로 표시됩니다.
- `models list`는 제공자 카탈로그 검색이 느린 동안에도 제어 영역의 응답성을 유지합니다. 기본 보기와 구성된 보기는 잠시 기다린 후 구성된 모델 행 또는 합성 모델 행으로 폴백하고 검색은 백그라운드에서 완료되도록 합니다. 검색된 전체 카탈로그를 정확히 확인해야 하며 제공자 검색이 완료될 때까지 기다릴 수 있다면 `--all`을 사용하십시오.
- 광범위한 `models list --all`은 제공자 런타임 보충 훅을 로드하지 않고 매니페스트 카탈로그 행을 레지스트리 행 위에 병합합니다. 제공자로 필터링된 매니페스트 빠른 경로는 `static`으로 표시된 제공자만 사용합니다. `refreshable`로 표시된 제공자는 레지스트리/캐시 기반 상태를 유지하면서 매니페스트 행을 보충 항목으로 추가하고, `runtime`으로 표시된 제공자는 레지스트리/런타임 검색을 계속 사용합니다.
- `models list`는 네이티브 모델 메타데이터와 런타임 상한을 구분합니다. 표 출력에서 유효 런타임 상한이 네이티브 컨텍스트 창과 다르면 `Ctx`에 `contextTokens/contextWindow`가 표시됩니다. 제공자가 해당 상한을 노출하면 JSON 행에 `contextTokens`가 포함됩니다.
- 제공자 소유 경로의 경우 `models list`는 하나의 논리적 제공자/모델 행을 선택된 경로에 투영합니다. `Input` 및 `Ctx`는 정확히 일치하는 물리적 경로의 카탈로그 행에서만 가져오며, 명시적으로 구성된 논리적 재정의는 마지막에 적용됩니다. 경로 선택을 확인할 수 없으면 형제 경로 메타데이터를 차용하지 않고 기능 필드를 알 수 없는 상태로 표시합니다.
- `models list --provider <id>`는 `moonshot` 또는 `openai`와 같은 제공자 ID로 필터링합니다. `Moonshot AI`와 같이 대화형 제공자 선택기에 표시되는 레이블은 허용하지 않습니다.
- 모델 참조는 **첫 번째** `/`를 기준으로 분할하여 파싱합니다. 모델 ID에 `/`가 포함된 경우(OpenRouter 방식) 제공자 접두사를 포함하십시오(예: `openrouter/moonshotai/kimi-k2`).
- 제공자를 생략하면 OpenClaw는 먼저 입력을 별칭으로 확인한 다음, 정확히 일치하는 해당 모델 ID에 대해 구성된 제공자 중 유일한 항목으로 확인하며, 그 후에만 지원 중단 경고와 함께 구성된 기본 제공자로 폴백합니다. 해당 제공자가 더 이상 구성된 기본 모델을 노출하지 않으면 OpenClaw는 제거된 제공자의 오래된 기본값을 표시하는 대신 구성된 첫 번째 제공자/모델로 폴백합니다.
- `models status`는 비밀이 아닌 자리표시자(예: `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`)를 보안 비밀로 마스킹하는 대신 인증 출력에 `marker(<value>)`로 표시할 수 있습니다.

### 기본 모델/이미지 모델 설정

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set`은 `agents.defaults.model.primary`에 기록하고, `set-image`는 `agents.defaults.imageModel.primary`에 기록합니다. 둘 다 `provider/model` 또는 구성된 별칭을 허용합니다. 새로 선택한 모델에 필요한 경우 `set`은 Codex/Copilot 런타임 Plugin 설치도 복구하지만, `set-image`는 복구하지 않습니다. 두 명령 모두 `--agent`를 허용하지 않으며 항상 에이전트 기본값에 기록합니다.

### 스캔

`models scan`은 OpenRouter의 공개 `:free` 카탈로그를 읽고 폴백 용도의 후보 순위를 지정합니다. 카탈로그 자체는 공개되어 있으므로 메타데이터 전용 스캔에는 OpenRouter 키가 필요하지 않습니다.

기본적으로 OpenClaw는 실제 모델 호출을 사용해 도구 및 이미지 지원을 프로브하려고 합니다. OpenRouter 키가 구성되어 있지 않으면 명령은 메타데이터 전용 출력으로 폴백하고, `:free` 모델도 프로브 및 추론에는 `OPENROUTER_API_KEY`가 필요하다고 설명합니다.

옵션:

- `--no-probe`(메타데이터만 사용하며 구성/보안 비밀을 조회하지 않음)
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

`--set-default` 및 `--set-image`에는 실시간 프로브가 필요합니다. 메타데이터 전용 스캔 결과는 정보 제공용이며 구성에 적용되지 않습니다.

## 별칭

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

별칭은 모델 항목별로 `agents.defaults.models.<key>.alias`에 저장됩니다. `add`는 먼저 `<model-or-alias>`를 정규 제공자/모델 키로 확인하므로, 별칭에 별칭을 지정하면 체인으로 연결하는 대신 대상을 다시 지정합니다.

## 폴백

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

`agents.defaults.model.fallbacks`를 관리합니다. `openclaw models image-fallbacks list|add|remove|clear`는 동일한 하위 명령 형식으로 병렬 목록인 `agents.defaults.imageModel.fallbacks`를 관리합니다.

## 인증 프로필

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add`는 대화형 인증 도우미입니다. 선택한 제공자에 따라 제공자 인증 흐름(OAuth/API 키)을 시작하거나 토큰을 수동으로 붙여넣도록 안내할 수 있습니다.

`models auth list`는 토큰, API 키 또는 OAuth 보안 비밀 자료를 출력하지 않고 선택한 에이전트에 저장된 인증 프로필을 나열합니다. `openai`와 같이 하나의 제공자로 필터링하려면 `--provider <id>`를 사용하고, 스크립팅에는 `--json`을 사용하십시오.

`models auth login`은 제공자 Plugin의 인증 흐름(OAuth/API 키)을 실행합니다. 설치된 제공자를 확인하려면 `openclaw plugins list`를 사용하십시오. `login`은 로그인 중 명명된 프로필을 지원하는 제공자에 대해 `--profile-id <id>`를 허용하고(동일한 제공자에 대한 여러 로그인을 분리하려면 사용), 특정 인증 방법을 선택하는 `--method <id>`, `--method device-code`의 단축 옵션인 `--device-code`, 제공자가 권장하는 기본 모델을 적용하는 `--set-default`, 기존 해당 제공자 프로필을 먼저 제거하는 `--force`를 허용합니다(캐시된 OAuth 프로필이 멈췄거나 계정을 전환하려는 경우 사용).

`models auth login-github-copilot`은 `models auth login --provider github-copilot --method device`(GitHub 기기 흐름)의 단축 명령입니다. 기존 프로필을 확인 없이 덮어쓰려면 `--yes`를 사용할 수 있습니다.

`openclaw models auth --agent <id> <subcommand>`를 사용하여 인증 결과를 구성된 특정 에이전트 저장소에 기록합니다. 상위 `--agent` 플래그는 `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot` 및 `order get`/`set`/`clear`에서 적용됩니다.

OpenAI 모델의 경우 `--provider openai`는 기본적으로 ChatGPT/Codex 계정 로그인을 사용합니다. OpenAI API 키 프로필을 추가하려는 경우에만 `--method api-key`를 사용하며, 일반적으로 Codex 구독 한도에 대비한 백업으로 사용합니다. `openclaw doctor --fix`를 실행하여 이전의 레거시 OpenAI Codex 접두사 인증/프로필 상태를 `openai`로 마이그레이션하십시오.

예시:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

참고:

- `paste-api-key`는 다른 곳에서 생성된 API 키를 허용하고, 키 값을 입력하라는 메시지를 표시하며, `--profile-id`를 전달하지 않으면 기본 프로필 ID `<provider>:manual`에 기록합니다. 자동화에서는 표준 입력으로 키를 파이프하십시오. 예: `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token`과 `paste-token`은 토큰 인증 방식을 제공하는 공급자를 위한 일반 토큰 명령으로 유지됩니다.
- `setup-token`은 대화형 TTY가 필요하며 공급자의 토큰 인증 방식을 실행합니다(공급자가 `setup-token` 방식을 제공하는 경우 기본적으로 해당 방식을 사용합니다).
- `paste-token`은 `--provider`가 필요하고, 기본적으로 토큰 값을 입력하라는 메시지를 표시하며, `--profile-id`를 전달하지 않으면 기본 프로필 ID `<provider>:manual`에 기록합니다. 자동화에서는 공급자 자격 증명이 셸 기록이나 프로세스 목록에 나타나지 않도록 토큰을 인수로 전달하는 대신 표준 입력으로 파이프하십시오.
- `paste-token --expires-in <duration>`은 `365d` 또는 `12h`와 같은 상대적 기간을 기준으로 절대 토큰 만료 시점을 저장합니다.
- `openai`의 경우 OpenAI API 키와 ChatGPT/OAuth 토큰 자료는 서로 다른 인증 형식입니다. `sk-...` OpenAI API 키에는 `paste-api-key`를 사용하고, 토큰 인증 자료에만 `paste-token`을 사용하십시오.
- Anthropic: `setup-token`/`paste-token`은 `anthropic`에 대해 지원되는 OpenClaw 인증 경로이지만, 호스트에서 사용할 수 있는 경우 OpenClaw는 Claude CLI(`claude -p`)를 재사용하는 방식을 선호합니다.
- `auth order get/set/clear`는 한 공급자의 에이전트별 인증 프로필 순서 재정의를 관리하며, 이는 `auth-state.json`에 저장됩니다(`auth.order.<provider>` 구성 키와 별도). `set`은 우선순위에 따라 하나 이상의 프로필 ID를 받으며, `clear`는 구성/라운드 로빈 순서로 대체됩니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [모델 선택](/ko/concepts/model-providers)
- [모델 장애 조치](/ko/concepts/model-failover)
