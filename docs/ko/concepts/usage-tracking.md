---
read_when:
    - 제공자 사용량/할당량 화면을 연결하고 있습니다
    - 사용량 추적 동작 또는 인증 요구 사항을 설명해야 합니다
summary: 사용량 추적 표시 영역 및 자격 증명 요구 사항
title: 사용량 추적
x-i18n:
    generated_at: "2026-07-12T00:44:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 개요

- 각 제공자의 사용량 엔드포인트에서 사용량/할당량을 직접 가져옵니다. 제공자 청구액을 추정하지 않으며, 제공자가 보고한 요금제 이름, 할당량 기간, 잔액, 지출액, 예산, 일별 비용 기록, 토큰/모델 귀속 정보 또는 계정 상태 요약만 표시합니다.
- 사람이 읽을 수 있는 할당량 기간 출력은 제공자가 사용한 할당량, 남은 할당량 또는 원시 개수만 보고하는 경우에도 `X% 남음`으로 정규화됩니다. 재설정 가능한 할당량 기간이 없는 제공자는 대신 제공자 요약 텍스트(예: 잔액)를 표시합니다.
- 세션 수준의 `/status` 및 `session_status` 도구는 실시간 세션 스냅샷에 토큰/모델 데이터가 없으면 세션의 트랜스크립트 로그를 대체 데이터로 사용합니다. 이 대체 경로는 누락된 토큰/캐시 카운터를 채우고, 활성 런타임 모델 레이블을 복구할 수 있으며, 세션 메타데이터가 없거나 더 작은 경우(`totalTokensFresh !== true`, 0 또는 트랜스크립트에서 산출된 값 미만) 프롬프트 중심의 더 큰 합계를 우선합니다. 0이 아닌 실시간 값은 항상 대체 값보다 우선합니다.

## 표시 위치

- 채팅의 `/status`: 세션 토큰과 예상 비용(API 키 모델만 해당)이 포함된 상태 카드입니다. 사용 가능한 경우 **현재 모델 제공자**의 사용량을 정규화된 `X% 남음` 기간 또는 제공자 요약 텍스트로 표시합니다.
- 채팅의 `/usage off|tokens|full`: 응답별 사용량 바닥글입니다.
- 채팅의 `/usage cost`: OpenClaw 세션 로그에서 집계한 로컬 비용 요약입니다.
- CLI: `openclaw status --usage`는 제공자별 전체 사용량/할당량 내역을 출력합니다.
- CLI: `openclaw models status`는 OAuth/토큰 인증 프로필을 나열하고, 사용량 기간이 있는 각 제공자 옆에 해당 요약을 표시합니다.
- 제어 UI: **사용량**은 OpenClaw의 세션 기반 토큰 및 예상 비용 분석 위에 제공자 요금제와 청구 카드를 표시합니다. Anthropic 및 OpenAI Admin API 자격 증명을 추가하면 제공자가 보고한 오늘, 7일 및 30일 지출액, 일별 추이, 토큰 합계, 상위 모델 및 비용 범주도 표시됩니다.
- 제어 UI: 채팅 작성기의 컨텍스트 링 팝오버는 구독 제공자의 **요금제 사용량**을 표시합니다. 여기에는 기간별 막대(5시간, 주간, 모델 범위), 재설정 시간, 확인 가능한 경우 제공자 요금제(예: `Max (20x)`), 추가 사용량 크레딧이 포함됩니다. 요금제를 통해 청구되는 세션은 토큰별 금액 추정치를 숨기며, API로 청구되는 세션은 `예상 비용`과 유형별 비용 내역을 유지합니다. Claude Code CLI(`claude-cli`) 설정은 동일한 Anthropic 구독 사용량을 재사용합니다.
- macOS 메뉴 막대: 제공자 사용량 스냅샷이 있으면 컨텍스트 아래에 루트 "사용량" 섹션이 나타납니다. [메뉴 막대](/ko/platforms/mac/menu-bar)를 참조하세요.

`openclaw channels list`는 더 이상 제공자 사용량을 출력하지 않으며, 대신 사용자에게 `openclaw status` 또는 `openclaw models list`를 안내합니다.

## Anthropic 및 OpenAI 비용 기록

구독 할당량과 API 청구는 서로 다른 제공자 기능 영역입니다.

- Anthropic 구독/설정 자격 증명은 Claude 할당량 기간과 선택적 추가 사용량 예산을 계속 표시합니다. 대신 조직 사용량 및 비용 API 기록을 표시하려면 `ANTHROPIC_ADMIN_KEY` 또는 `ANTHROPIC_ADMIN_API_KEY`를 설정하세요. `sk-ant-admin`으로 시작하는 Anthropic 제공자 자격 증명은 자동으로 감지됩니다.
- OpenAI ChatGPT/Codex OAuth는 요금제, 할당량 기간 및 크레딧 잔액을 계속 표시합니다. 대신 조직 비용 및 완료 사용량 기록을 표시하려면 `OPENAI_ADMIN_KEY`를 설정하세요. 필요에 따라 `OPENAI_PROJECT_ID`를 설정하여 하나의 프로젝트로 범위를 제한할 수 있습니다. 이러한 키는 사용자 지정 엔드포인트에 속할 수 있으므로 OpenClaw는 `OPENAI_API_KEY`, 제공자 구성 또는 인증 프로필의 추론 자격 증명을 조직 API로 절대 전송하지 않습니다.

관리자 자격 증명은 실제 조직 청구 정보를 제공하므로 우선합니다. OpenClaw는 제공자가 보고한 이 합계를 로컬 세션 추정치와 결합하지 않습니다. 두 섹션은 의도적으로 서로 다른 질문에 답합니다.

## 기본 사용량 바닥글 모드

`/usage off|tokens|full`은 세션의 바닥글을 설정하며 해당 세션에 기억됩니다. `messages.responseUsage`는 아직 모드를 선택하지 않은 세션의 초기 모드를 지정하므로, 매번 `/usage`를 입력하지 않아도 바닥글을 기본적으로 켤 수 있습니다.

모든 채널에 하나의 모드를 설정하거나, `default` 대체값이 있는 채널별 맵을 설정하세요.

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // 또는: { "default": "off", "discord": "full" }
  },
}
```

허용되는 값: `"off"`, `"tokens"`, `"full"` 및 레거시 별칭 `"on"`(`"tokens"`로 처리됨).

### 서로 다른 세 가지 세션 상태

세션의 `responseUsage` 필드는 표현 가능한 세 가지 상태를 가지며, 각 상태의 의미가 다릅니다.

| 상태                    | 저장된 값                         | 유효 모드                                                               |
| ----------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| **설정 안 됨 / 상속**  | `undefined`(없음)                 | `messages.responseUsage` 구성 기본값을 따르고, 그다음 `off`를 사용합니다. |
| **명시적으로 끔**       | `"off"`(저장됨)                   | 항상 꺼져 있으며, `off`가 아닌 구성 기본값으로 바닥글을 다시 켤 수 없습니다. |
| **명시적으로 켬**       | `"tokens"` 또는 `"full"`(저장됨) | 구성 기본값과 관계없이 해당 모드를 사용합니다.                          |

### 우선순위

유효 모드 = 세션 재정의 → 채널 구성 항목 → `default` → `off`.

명시적인 `/usage off`는 "설정 안 됨"과 동일하지 않으며, 세션에 리터럴 값 `"off"`로 **영구 저장**됩니다. 사용자가 명시적으로 비활성화한 후에는 `off`가 아닌 `messages.responseUsage` 기본값으로 바닥글을 다시 켤 수 없습니다.

### 재설정과 끄기의 차이

- `/usage off`는 바닥글을 강제로 끄고 해당 선택을 저장합니다. 구성된 `off`가 아닌 기본값으로 이를 재정의할 수 없습니다.
- `/usage reset`(별칭: `default`, `inherit`, `inherited`, `clear`, `unpin`)은 세션 재정의를 지웁니다. 그러면 세션은 유효한 구성 기본값(`messages.responseUsage`)을 **상속**합니다. 기본값이 구성되지 않은 경우 바닥글은 꺼진 상태로 유지됩니다.
- 전체 세션 재설정(`/reset` 또는 `/new`)이나 세션 전환은 명시적인 사용량 모드 기본 설정을 **유지**하므로, 사용자의 표시 선택이 세션 전환 후에도 유지됩니다. `/usage reset`과 그 별칭만 재정의를 지웁니다.

### 전환 동작

인수 없이 `/usage`를 사용하면 끔 → 토큰 → 전체 → 끔 순으로 순환합니다. 순환의 시작점은 **현재 유효한** 모드입니다. 즉, 세션 재정의가 설정되지 않은 경우 구성 기본값을 사용하므로, 순환은 항상 사용자가 현재 바닥글에서 보는 상태와 일치합니다.

### 구성

구성이 없으면 기존 동작이 유지됩니다(`/usage`를 사용하기 전까지 바닥글 꺼짐). `/usage reset`을 사용하여 세션 재정의를 지우고 구성된 기본값을 다시 상속하세요.

## 사용자 지정 `/usage full` 바닥글

`/usage tokens`는 항상 단순한 `사용량: X 입력 / Y 출력` 줄을 렌더링하며, 사용 가능한 경우 캐시 및 예상 비용 접미사를 추가합니다. 아래에 설명된 더 풍부한 바닥글은 `/usage full`에서만 렌더링됩니다.

`/usage full`은 해당 필드가 있는 경우 모델, 추론, 빠름/느림, 컨텍스트 창 및 비용을 포함하는 기본 제공 압축 바닥글을 표시합니다. 기본 제공 바닥글에는 템플릿 파일이 필요하지 않습니다.

`messages.usageTemplate`은 고급 사용자 지정 레이아웃 전용입니다. 값은 JSON 파일 경로(`~` 지원) 또는 인라인 객체이며, 유효한 경우 기본 제공 바닥글을 대체합니다. 파일 경로는 변경 사항을 감시하며 변경 시 실시간으로 다시 로드됩니다.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

누락되거나 비어 있는 템플릿은 조용히 기본 제공 바닥글로 대체됩니다. 읽을 수 없거나 유효하지 않게 구성된 템플릿(잘못된 JSON 또는 렌더링 가능한 출력 조각이 없는 구조)도 기본 제공 바닥글로 대체되며 운영자 경고를 표시합니다.

사용자 지정 템플릿은 기본 제공 구조에서 시작한 다음 변경하려는 부분을 수정하세요.

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### 구조

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // 문자열(문자당 글리프 1개) 또는 배열
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // 남은 조각을 연결
    "default": [/* 조각 */], // 모든 표시 영역의 대체값
    "surfaces": {
      "discord": [/* 조각 */],
      "telegram": [/* 조각 */],
    },
  },
}
```

각 표시 영역은 순서가 지정된 **조각** 목록입니다. 엔진은 각 조각을 렌더링하고 빈 항목을 삭제한 다음 남은 항목을 `sep`으로 연결합니다. 항목이 없는 표시 영역은 `output.default`를 사용합니다.

### 계약 경로

조각은 점 경로를 통해 턴별 계약에서 값을 읽습니다. 없는 값은 비어 있으므로 `when` 가드 또는 `|fallback`을 사용하면 조각을 깔끔하게 유지할 수 있습니다.

| 경로                                                                                | 의미                                                                                                   |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `surface`                                                                           | 채널 ID (`discord`/`telegram`/기타)                                                                    |
| `agentId` / `chat_type`                                                             | 소유 에이전트 ID / 채팅 표면 유형                                                                       |
| `model.id` / `model.display_name` / `model.provider`                                | 모델 ID / 표시 이름 / 제공자 ID                                                                         |
| `model.actual`, `model.resolved_ref`                                                | 해당 턴에 실제로 사용된 제공자/모델 참조                                                                |
| `model.requested`                                                                   | 요청된 제공자/모델 참조(폴백 이전)                                                                      |
| `model.reasoning`                                                                   | 작업량 수준(`off`부터 `xhigh`까지)                                                                      |
| `model.is_fallback` / `model.is_override`                                           | 불리언: 폴백 사용 여부 / 모델 고정 여부                                                                  |
| `model.override_source` / `model.auth_mode`                                         | 재정의 출처 레이블 / 자격 증명 모드(`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`)          |
| `state.fast_mode`                                                                   | 불리언: 빠름 또는 느림                                                                                   |
| `state.compactions`                                                                 | 세션의 Compaction 횟수                                                                                  |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | 컨텍스트 창 예산 / 점유 토큰 / 사용률 0~100                                                             |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | 턴 집계                                                                                                 |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | 해당 턴의 캐시 읽기 및 캐시 쓰기 토큰                                                                    |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | 토큰 표시 가드                                                                                          |
| `usage.cache_hit_pct`                                                               | 전체 프롬프트 토큰 중 캐시 읽기 비율                                                                      |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 최종 모델 호출만 해당(`cache_read_tokens`, `cache_write_tokens`, `total_tokens`도 포함)                  |
| `cost.turn_usd` / `cost.available`                                                  | 예상 턴 비용 / 비용 표 확인 여부                                                                         |
| `timing.duration_ms`                                                                | 실제 경과 시간 기준 턴 지속 시간                                                                         |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | 에이전트 ID 이름 / 이모지 / 아바타                                                                        |
| `session.id`                                                                        | 세션 ID                                                                                                 |

(제공자 속도 제한 창은 이 계약에 **포함되지 않습니다**. 현재 배열 값을 갖는 경로가 없으므로 `each` 조각이 순회할 대상도 없습니다.)

### 동사

값을 왼쪽에서 오른쪽 순서로 동사에 전달합니다. 동사가 아닌 세그먼트는 폴백입니다.

| 동사            | 효과                                  | 예시                              |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | 간결한 수량 표기                      | `272000 -> 272k`                  |
| `fixed:N`       | 소수점 N자리(기본값 2)                | `0.0377`                          |
| `dur`           | 초를 기간으로 변환                    | `14820 -> 4h07m`                  |
| `pct`           | `%` 추가                              | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 사용량을 잔여량으로 변환          |
| `alias:TABLE`   | `aliases`에서 조회하며, 없으면 그대로 출력 | `medium -> 🌗`               |
| `meter:W:SCALE` | 0~100 값에 대한 W칸 글리프 막대       | `[⣿⣿⠐⠐⠐]` (`meter:1` = 글리프 하나) |

### 조각 형식

- `{ "text": "📚 {context.max_tokens|num}" }`: 리터럴 + 보간.
- `{ "when": "<path>", "text": "..." }`: 경로 값이 참일 때만 렌더링합니다.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: 값을 글리프로 변환합니다(`_default` 사례는 일치하지 않는 값을 처리합니다).
- `{ "each": "<array-path>", "item": "{label}" }`: 배열 값을 갖는 경로를 순회합니다(현재 계약의 경로에는 배열이 없습니다).

### 예시

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

예를 들어 `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`로 렌더링됩니다.

## 제공자 + 자격 증명

사용 가능한 제공자 사용량 인증을 확인할 수 없으면 사용량이 숨겨집니다. OpenClaw는
`contracts.usageProviders`를 선언하고 `resolveUsageAuth`와
`fetchUsageSnapshot`을 모두 구현하는 활성화된 제공자 Plugin을 자동으로 검색합니다.
별도의 코어 제공자 허용 목록은 없습니다. 정적 계약은 모든 제공자 Plugin을 가져오지
않으면서 검색 범위를 제한합니다. 각 Plugin은 자체 업스트림 엔드포인트와 응답 매핑을
소유합니다. 공유 스냅샷은 CLI, 앱, Control UI 소비자를 위해 요금제 이름, 할당량 창,
잔액, 지출 및 예산을 제공자 중립적으로 유지합니다.

- **Anthropic (Claude)**: 인증 프로필의 OAuth 토큰. OAuth 토큰에
  `user:profile` 범위가 없으면, 설정된 경우 `claude.ai` 웹 세션(`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY` 또는 `CLAUDE_WEB_COOKIE`의 `sessionKey=` 쿠키)으로 폴백합니다.
  Anthropic이 보고하는 경우 모델 범위 제한과 활성화된 추가 사용량의 월간 지출/예산이
  포함됩니다. 명시적인 Anthropic Admin API 키 또는 자동 감지된 `sk-ant-admin...`
  제공자 프로필을 사용하면 대신 30일간의 조직 비용과 Messages API 기록을 표시합니다.
- **ClawRouter**: API 키(`CLAWROUTER_API_KEY`). 구성된 경우 월간 예산 창과 유형이 지정된
  USD 예산을 표시하며, 그렇지 않으면 총지출과 요청/토큰/비용 요약을 표시합니다.
- **DeepSeek**: 환경 변수/구성/인증 저장소를 통한 API 키(`DEEPSEEK_API_KEY`).
  제공자가 보고한 각 통화 잔액을 표시합니다.
- **GitHub Copilot**: 인증 프로필의 OAuth 토큰.
- **Gemini CLI**: 인증 프로필의 OAuth 토큰.
- **MiniMax**: API 키 또는 MiniMax OAuth 인증 프로필. OpenClaw는
  `minimax`, `minimax-cn`, `minimax-portal`을 동일한 MiniMax 할당량 표면으로 취급하고,
  저장된 MiniMax OAuth가 있으면 이를 우선 사용하며, 그렇지 않으면
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` 또는 `MINIMAX_API_KEY`로 폴백합니다.
  사용량 폴링은 구성된 경우 `models.providers.minimax-portal.baseUrl` 또는
  `models.providers.minimax.baseUrl`에서 Coding Plan 호스트를 도출하고, 그렇지 않으면
  MiniMax CN 호스트를 사용합니다.
  MiniMax의 원시 `usage_percent` / `usagePercent` 필드는 **잔여** 할당량을 의미하므로
  OpenClaw는 표시 전에 이를 반전합니다. 개수 기반 필드가 있으면 이를 우선합니다.
  - 창 레이블은 제공자의 시간/분 필드가 있으면 이를 사용하고, 없으면
    `start_time` / `end_time` 구간으로 폴백합니다.
  - Coding Plan 엔드포인트가 `model_remains`를 반환하면 OpenClaw는 채팅 모델 항목을
    우선하고, 명시적인 `window_hours` / `window_minutes` 필드가 없으면 타임스탬프에서
    창 레이블을 도출하며, 요금제 레이블에 모델 이름을 포함합니다.
- **OpenAI (Codex/ChatGPT 요금제)**: 인증 프로필의 OAuth 토큰(계정 ID가 있으면
  `ChatGPT-Account-Id` 헤더를 전송). 보고된 경우 ChatGPT 요금제, 재설정 가능한 Codex 창,
  크레딧 잔액을 표시합니다. 크레딧은 제공자 크레딧으로 유지되며, OpenClaw는 이를
  달러로 표시하지 않습니다. `OPENAI_ADMIN_KEY`는 키에 Usage Dashboard 접근 권한이
  있을 때 30일간의 조직 비용과 완료 사용량 기록을 추가합니다. 추론 자격 증명은
  조직 API에 절대 전달되지 않습니다.
- **OpenRouter**: API 키 또는 OAuth 기반 API 키(`OPENROUTER_API_KEY` 또는 인증 프로필).
  계정 크레딧 엔드포인트와 키 할당량 엔드포인트를 결합하므로, 자격 증명으로 접근할 수
  있을 때 계정 잔액/지출, 키 예산, 일간/주간/월간 사용량이 표시됩니다. 어느
  엔드포인트든 독립적으로 스냅샷을 보강할 수 있습니다.
- **Venice**: 환경 변수/구성/인증 저장소를 통한 API 키(`VENICE_API_KEY`). 보고된 경우
  USD 및 DIEM 잔액과 DIEM 에포크 할당량 사용량을 표시합니다.
- **Xiaomi MiMo**: 두 개의 별도 사용량 표면. 종량제는 API 키
  (`XIAOMI_API_KEY`)를 사용하며, Token Plan은 별도 키(`XIAOMI_TOKEN_PLAN_API_KEY`)를
  사용합니다. 현재 둘 다 할당량 창을 보고하지 않습니다.
- **z.ai**: 환경 변수/구성/인증 저장소를 통한 API 키(`ZAI_API_KEY` 또는 `Z_AI_API_KEY`).

## 관련 문서

- [토큰 사용량 및 비용](/ko/reference/token-use)
- [API 사용량 및 비용](/ko/reference/api-usage-costs)
- [프롬프트 캐싱](/ko/reference/prompt-caching)
- [메뉴 막대](/ko/platforms/mac/menu-bar)
