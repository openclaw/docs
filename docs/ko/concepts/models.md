---
read_when:
    - 모델 CLI 추가 또는 수정하기(`models list/set/scan/aliases/fallbacks`)
    - 모델 fallback 동작 또는 선택 UX 변경하기
    - 모델 스캔 프로브(도구/이미지) 업데이트하기
summary: '모델 CLI: 목록, 설정, alias, fallback, 스캔, 상태'
title: 모델 CLI
x-i18n:
    generated_at: "2026-04-25T05:59:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6a98f44872d5de81f02dc7318bb8ecdff3860996d286b6aa9d42abbd8ce6670
    source_path: concepts/models.md
    workflow: 15
---

인증 프로필
순환, 쿨다운, 그리고 그것이 fallback과 어떻게 상호작용하는지는 [/concepts/model-failover](/ko/concepts/model-failover)를 참고하세요.
빠른 provider 개요와 예시는 [/concepts/model-providers](/ko/concepts/model-providers)를 참고하세요.
모델 ref는 provider와 모델을 선택합니다. 일반적으로
하위 수준 에이전트 런타임을 선택하지는 않습니다. 예를 들어 `openai/gpt-5.5`는
`agents.defaults.embeddedHarness.runtime`에 따라
일반 OpenAI provider 경로로 실행될 수도 있고 Codex app-server 런타임으로 실행될 수도 있습니다. 자세한 내용은
[/concepts/agent-runtimes](/ko/concepts/agent-runtimes)를 참고하세요.

## 모델 선택 방식

OpenClaw는 다음 순서로 모델을 선택합니다.

1. **Primary** 모델(`agents.defaults.model.primary` 또는 `agents.defaults.model`).
2. `agents.defaults.model.fallbacks`의 **Fallback**(순서대로).
3. **Provider 인증 failover**는 다음
   모델로 이동하기 전에 provider 내부에서 발생합니다.

관련 항목:

- `agents.defaults.models`는 OpenClaw가 사용할 수 있는 모델의 allowlist/카탈로그입니다(alias 포함).
- `agents.defaults.imageModel`은 **primary 모델이 이미지를 받을 수 없을 때만** 사용됩니다.
- `agents.defaults.pdfModel`은 `pdf` 도구에서 사용됩니다. 생략하면 이 도구는
  `agents.defaults.imageModel`로 fallback한 다음, 확인된 세션/기본
  모델로 fallback합니다.
- `agents.defaults.imageGenerationModel`은 공용 이미지 생성 capability에서 사용됩니다. 생략해도 `image_generate`는 여전히 인증 기반 provider 기본값을 추론할 수 있습니다. 먼저 현재 기본 provider를 시도한 다음, 나머지 등록된 이미지 생성 provider를 provider-id 순서로 시도합니다. 특정 provider/model을 설정하는 경우 해당 provider의 인증/API 키도 함께 구성하세요.
- `agents.defaults.musicGenerationModel`은 공용 음악 생성 capability에서 사용됩니다. 생략해도 `music_generate`는 여전히 인증 기반 provider 기본값을 추론할 수 있습니다. 먼저 현재 기본 provider를 시도한 다음, 나머지 등록된 음악 생성 provider를 provider-id 순서로 시도합니다. 특정 provider/model을 설정하는 경우 해당 provider의 인증/API 키도 함께 구성하세요.
- `agents.defaults.videoGenerationModel`은 공용 비디오 생성 capability에서 사용됩니다. 생략해도 `video_generate`는 여전히 인증 기반 provider 기본값을 추론할 수 있습니다. 먼저 현재 기본 provider를 시도한 다음, 나머지 등록된 비디오 생성 provider를 provider-id 순서로 시도합니다. 특정 provider/model을 설정하는 경우 해당 provider의 인증/API 키도 함께 구성하세요.
- 에이전트별 기본값은 `agents.list[].model`과 바인딩을 통해 `agents.defaults.model`을 재정의할 수 있습니다([/concepts/multi-agent](/ko/concepts/multi-agent) 참고).

## 빠른 모델 정책

- primary는 사용 가능한 가장 강력한 최신 세대 모델로 설정하세요.
- 비용/지연 시간에 민감한 작업과 중요도가 낮은 채팅에는 fallback을 사용하세요.
- 도구가 활성화된 에이전트 또는 신뢰할 수 없는 입력의 경우, 오래되거나 약한 모델 tier는 피하세요.

## 온보딩(권장)

config를 직접 편집하고 싶지 않다면 온보딩을 실행하세요.

```bash
openclaw onboard
```

이 명령은 **OpenAI Code (Codex)
subscription**(OAuth)과 **Anthropic**(API 키 또는 Claude CLI)을 포함한 일반 provider의 모델 + 인증을 설정할 수 있습니다.

## Config 키(개요)

- `agents.defaults.model.primary` 및 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 및 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 및 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 및 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 및 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`(allowlist + alias + provider params)
- `models.providers`(`models.json`에 기록되는 사용자 지정 provider)

모델 ref는 소문자로 정규화됩니다. `z.ai/*` 같은 provider alias는
`zai/*`로 정규화됩니다.

OpenCode를 포함한 provider 구성 예시는
[/providers/opencode](/ko/providers/opencode)에 있습니다.

### 안전한 allowlist 편집

`agents.defaults.models`를 수동으로 업데이트할 때는 추가 방식 쓰기를 사용하세요.

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set`은 실수로 model/provider 맵을 덮어쓰지 않도록 보호합니다. `agents.defaults.models`, `models.providers`, 또는
`models.providers.<id>.models`에 대한 일반 객체 할당은 기존
항목을 제거하게 되는 경우 거부됩니다. 추가 변경에는 `--merge`를 사용하고, 제공한 값이 완전한 대상 값이 되어야 할 때만 `--replace`를 사용하세요.

대화형 provider 설정과 `openclaw configure --section model`도 provider 범위 선택을 기존 allowlist에 병합하므로, Codex,
Ollama, 또는 다른 provider를 추가해도 관련 없는 모델 항목이 삭제되지 않습니다.
configure는 provider 인증이 다시 적용될 때도 기존 `agents.defaults.model.primary`를 보존합니다. `openclaw models auth login --provider <id> --set-default` 및
`openclaw models set <model>` 같은 명시적 기본값 설정 명령은 여전히 `agents.defaults.model.primary`를 교체합니다.

## "Model is not allowed"가 발생하는 경우(그리고 응답이 멈추는 이유)

`agents.defaults.models`가 설정되어 있으면 `/model`과 세션 재정의에 대한 **allowlist**가 됩니다. 사용자가 해당 allowlist에 없는 모델을 선택하면
OpenClaw는 다음을 반환합니다.

```
Model "provider/model" is not allowed. Use /model to list available models.
```

이는 일반 응답이 생성되기 **전에** 발생하므로, 메시지가
“응답하지 않은 것처럼” 느껴질 수 있습니다. 해결 방법은 다음 중 하나입니다.

- 모델을 `agents.defaults.models`에 추가하거나,
- allowlist를 지우거나(`agents.defaults.models` 제거), 또는
- `/model list`에서 모델을 선택합니다.

allowlist config 예시:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## 채팅에서 모델 전환하기(`/model`)

재시작 없이 현재 세션의 모델을 전환할 수 있습니다.

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

참고:

- `/model`(및 `/model list`)은 간결한 번호 기반 선택기입니다(모델 계열 + 사용 가능한 provider).
- Discord에서는 `/model`과 `/models`가 provider 및 모델 드롭다운과 Submit 단계가 있는 대화형 선택기를 엽니다.
- `/models add`는 더 이상 사용되지 않으며 이제 채팅에서 모델을 등록하는 대신 지원 중단 메시지를 반환합니다.
- `/model <#>`는 해당 선택기에서 선택합니다.
- `/model`은 새 세션 선택을 즉시 저장합니다.
- 에이전트가 유휴 상태이면 다음 실행에서 바로 새 모델을 사용합니다.
- 실행이 이미 활성 상태이면, OpenClaw는 실시간 전환을 대기 상태로 표시하고 깔끔한 재시도 지점에서만 새 모델로 재시작합니다.
- 도구 활동이나 응답 출력이 이미 시작되었으면, 대기 중 전환은 이후 재시도 기회 또는 다음 사용자 턴까지 대기할 수 있습니다.
- `/model status`는 자세한 보기입니다(인증 후보, 그리고 구성된 경우 provider 엔드포인트 `baseUrl` + `api` 모드).
- 모델 ref는 **첫 번째** `/`를 기준으로 분리하여 파싱됩니다. `/model <ref>`를 입력할 때는 `provider/model`을 사용하세요.
- 모델 ID 자체에 `/`가 포함되어 있으면(OpenRouter 스타일) provider 접두사를 반드시 포함해야 합니다(예: `/model openrouter/moonshotai/kimi-k2`).
- provider를 생략하면 OpenClaw는 다음 순서로 입력을 확인합니다.
  1. alias 일치
  2. 해당 접두사 없는 정확한 모델 id에 대해 구성된 provider가 하나만 있을 때의 고유 일치
  3. 구성된 기본 provider로의 지원 중단된 fallback
     해당 provider가 더 이상 구성된 기본 모델을 노출하지 않으면, OpenClaw는
     오래되어 제거된 provider 기본값이 노출되지 않도록 대신 첫 번째 구성된 provider/model으로 fallback합니다.

전체 명령 동작/config: [Slash commands](/ko/tools/slash-commands).

## CLI 명령

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models`(하위 명령 없음)는 `models status`의 단축키입니다.

### `models list`

기본적으로 구성된 모델을 표시합니다. 유용한 플래그:

- `--all`: 전체 카탈로그
- `--local`: 로컬 provider만
- `--provider <id>`: provider id로 필터링(예: `moonshot`); 대화형 선택기의 표시
  레이블은 허용되지 않습니다
- `--plain`: 줄당 하나의 모델
- `--json`: 기계 판독 가능 출력

`--all`은 인증이 구성되기 전에도 번들 provider 소유 정적 카탈로그 행을 포함하므로, discovery 전용 보기에서 일치하는 provider 자격 증명을 추가하기 전까지는 사용할 수 없는 모델도 표시할 수 있습니다.

### `models status`

확인된 primary 모델, fallback, image 모델, 그리고 구성된 provider의 인증 개요를 표시합니다. 또한 인증 저장소에서 발견된 프로필의 OAuth 만료 상태도 표시합니다(기본적으로 24시간 이내 경고). `--plain`은 확인된 primary 모델만 출력합니다.
OAuth 상태는 항상 표시되며(`--json` 출력에도 포함됨), 구성된
provider에 자격 증명이 없으면 `models status`는 **Missing auth** 섹션을 출력합니다.
JSON에는 `auth.oauth`(경고 창 + 프로필)와 `auth.providers`
(provider별 유효 인증, env 기반 자격 증명 포함)가 포함됩니다. `auth.oauth`는 인증 저장소 프로필 상태만을 위한 것이며, env 전용 provider는 여기에 나타나지 않습니다.
자동화에는 `--check`를 사용하세요(없거나 만료된 경우 종료 코드 `1`, 곧 만료되는 경우 `2`).
실시간 인증 검사에는 `--probe`를 사용하세요. probe 행은 인증 프로필, env
자격 증명, 또는 `models.json`에서 올 수 있습니다.
명시적 `auth.order.<provider>`가 저장된 프로필을 생략하면, probe는 이를 시도하는 대신
`excluded_by_auth_order`를 보고합니다. 인증은 있지만 해당 provider에 대해 probe 가능한 모델을 확인할 수 없으면 probe는 `status: no_model`을 보고합니다.

인증 선택은 provider/계정에 따라 달라집니다. 항상 켜져 있는 gateway 호스트의 경우, API
키가 일반적으로 가장 예측 가능합니다. Claude CLI 재사용과 기존 Anthropic
OAuth/토큰 프로필도 지원됩니다.

예시(Claude CLI):

```bash
claude auth login
openclaw models status
```

## 스캔(OpenRouter 무료 모델)

`openclaw models scan`은 OpenRouter의 **무료 모델 카탈로그**를 검사하고
선택적으로 도구 및 이미지 지원에 대해 모델을 probe할 수 있습니다.

주요 플래그:

- `--no-probe`: 실시간 probe 건너뛰기(메타데이터만)
- `--min-params <b>`: 최소 파라미터 크기(십억 단위)
- `--max-age-days <days>`: 오래된 모델 건너뛰기
- `--provider <name>`: provider 접두사 필터
- `--max-candidates <n>`: fallback 목록 크기
- `--set-default`: 첫 번째 선택 항목을 `agents.defaults.model.primary`로 설정
- `--set-image`: 첫 번째 이미지 선택 항목을 `agents.defaults.imageModel.primary`로 설정

Probing에는 OpenRouter API 키(인증 프로필 또는
`OPENROUTER_API_KEY`에서 제공)가 필요합니다. 키가 없으면 후보만 나열하려면 `--no-probe`를 사용하세요.

스캔 결과는 다음 기준으로 순위가 매겨집니다.

1. 이미지 지원
2. 도구 지연 시간
3. 컨텍스트 크기
4. 파라미터 수

입력

- OpenRouter `/models` 목록(필터 `:free`)
- 인증 프로필 또는 `OPENROUTER_API_KEY`의 OpenRouter API 키 필요([/environment](/ko/help/environment) 참고)
- 선택적 필터: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Probe 제어: `--timeout`, `--concurrency`

TTY에서 실행하면 fallback을 대화형으로 선택할 수 있습니다. 비대화형
모드에서는 기본값을 수락하려면 `--yes`를 전달하세요.

## 모델 레지스트리(`models.json`)

`models.providers`의 사용자 지정 provider는 에이전트 디렉터리 아래의
`models.json`에 기록됩니다(기본값 `~/.openclaw/agents/<agentId>/agent/models.json`). 이 파일은
`models.mode`가 `replace`로 설정되지 않은 한 기본적으로 병합됩니다.

일치하는 provider ID에 대한 병합 모드 우선순위:

- 에이전트 `models.json`에 이미 존재하는 비어 있지 않은 `baseUrl`이 우선합니다.
- 에이전트 `models.json`의 비어 있지 않은 `apiKey`는 현재 config/인증 프로필 컨텍스트에서 해당 provider가 SecretRef 관리형이 아닐 때만 우선합니다.
- SecretRef 관리형 provider `apiKey` 값은 확인된 secret을 유지하는 대신 소스 마커(env ref는 `ENV_VAR_NAME`, file/exec ref는 `secretref-managed`)에서 새로 고쳐집니다.
- SecretRef 관리형 provider 헤더 값은 소스 마커(env ref는 `secretref-env:ENV_VAR_NAME`, file/exec ref는 `secretref-managed`)에서 새로 고쳐집니다.
- 비어 있거나 없는 에이전트 `apiKey`/`baseUrl`은 config `models.providers`로 fallback합니다.
- 기타 provider 필드는 config와 정규화된 카탈로그 데이터에서 새로 고쳐집니다.

마커 유지 방식은 소스 권한 우선입니다. OpenClaw는 확인된 런타임 secret 값이 아니라 활성 소스 config 스냅샷(확인 전)에서 마커를 기록합니다.
이는 `openclaw agent` 같은 명령 기반 경로를 포함해 OpenClaw가 `models.json`을 다시 생성할 때마다 적용됩니다.

## 관련

- [Model Providers](/ko/concepts/model-providers) — provider 라우팅 및 인증
- [Agent Runtimes](/ko/concepts/agent-runtimes) — PI, Codex 및 기타 에이전트 루프 런타임
- [Model Failover](/ko/concepts/model-failover) — fallback 체인
- [Image Generation](/ko/tools/image-generation) — 이미지 모델 구성
- [Music Generation](/ko/tools/music-generation) — 음악 모델 구성
- [Video Generation](/ko/tools/video-generation) — 비디오 모델 구성
- [Configuration Reference](/ko/gateway/config-agents#agent-defaults) — 모델 config 키
