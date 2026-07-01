---
read_when:
    - Provider 사용량/할당량 화면을 연결하고 있습니다
    - 사용량 추적 동작 또는 인증 요구 사항을 설명해야 합니다
summary: 사용량 추적 표면 및 자격 증명 요구 사항
title: 사용량 추적
x-i18n:
    generated_at: "2026-07-01T18:10:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 개요

- 제공자의 사용량 엔드포인트에서 제공자 사용량/할당량을 직접 가져옵니다.
- 예상 비용은 표시하지 않으며, 제공자가 보고한 할당량 기간 또는 계정 상태
  요약만 표시합니다.
- 사람이 읽을 수 있는 할당량 기간 상태 출력은 업스트림 API가 사용된 할당량,
  남은 할당량, 또는 원시 카운트만 보고하더라도 `X% left`로 정규화됩니다.
  재설정 가능한 할당량 기간이 없는 제공자는 잔액 같은 제공자 요약 텍스트를
  대신 표시할 수 있습니다.
- 세션 수준 `/status` 및 `session_status`는 라이브 세션 스냅샷이 희소할 때
  최신 트랜스크립트 사용량 항목으로 폴백할 수 있습니다. 이 폴백은 누락된
  토큰/캐시 카운터를 채우고, 활성 런타임 모델 레이블을 복구할 수 있으며,
  세션 메타데이터가 없거나 더 작을 때 프롬프트 중심 총합 중 더 큰 값을
  선호합니다. 기존의 0이 아닌 라이브 값이 여전히 우선합니다.

## 표시되는 위치

- 채팅의 `/status`: 세션 토큰 + 예상 비용(API 키만 해당)을 포함한 이모지 중심 상태 카드입니다. 사용 가능한 경우 **현재 모델 제공자**의 제공자 사용량이 정규화된 `X% left` 기간 또는 제공자 요약 텍스트로 표시됩니다.
- 채팅의 `/usage off|tokens|full`: 응답별 사용량 푸터입니다.
- 채팅의 `/usage cost`: OpenClaw 세션 로그에서 집계한 로컬 비용 요약입니다.
- CLI: `openclaw status --usage`는 제공자별 전체 세부 내역을 출력합니다.
- CLI: `openclaw channels list`는 제공자 설정과 함께 같은 사용량 스냅샷을 출력합니다(건너뛰려면 `--no-usage` 사용).
- macOS 메뉴 막대: Context 아래의 "Usage" 섹션(사용 가능한 경우에만).

## 기본 사용량 푸터 모드

`/usage off|tokens|full`은 세션의 푸터를 설정하며 해당 세션에 기억됩니다.
`messages.responseUsage`는 아직 선택한 모드가 없는 세션에 이 모드를 시드하므로,
매번 `/usage`를 입력하지 않아도 기본적으로 푸터를 켤 수 있습니다.

모든 채널에 하나의 모드를 설정하거나, `default` 폴백이 있는 채널별 맵을
설정합니다.

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### 세 가지 구분되는 세션 상태

세션의 `responseUsage` 필드에는 표현 가능한 세 가지 상태가 있으며, 각각의
의미가 다릅니다.

| 상태                | 저장 값                        | 유효 모드                                                             |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **미설정 / 상속**   | `undefined` (없음)              | `messages.responseUsage` 설정 기본값으로 넘어간 뒤, `off`가 됩니다.   |
| **명시적으로 끔**   | `"off"` (저장됨)                | 항상 꺼짐 — off가 아닌 설정 기본값으로 푸터를 다시 켤 수 없습니다.    |
| **명시적으로 켬**   | `"tokens"` 또는 `"full"` (저장됨) | 설정 기본값과 관계없이 해당 모드가 됩니다.                            |

### 우선순위

유효 모드 = 세션 오버라이드 → 채널 설정 항목 → `default` → `off`.

명시적인 `/usage off`는 세션에 리터럴 값 `"off"`로 **저장**되며, "미설정"과
같지 않습니다. 즉, off가 아닌 `messages.responseUsage` 기본값은 사용자가
명시적으로 비활성화한 뒤에는 푸터를 다시 켤 수 없습니다.

### 재설정과 끄기의 차이

- `/usage off` — 푸터를 강제로 끄고 그 선택을 유지합니다. 구성된 off가 아닌
  기본값은 이를 오버라이드할 수 없습니다.
- `/usage reset` (별칭: `inherit`, `clear`, `default`) — 세션 오버라이드를
  지웁니다. 그러면 세션은 유효 설정 기본값(`messages.responseUsage`)을
  **상속**합니다. 기본값이 구성되어 있지 않으면 푸터는 꺼진 상태입니다
  (이전과 동일). 푸터를 명시적으로 켜지 않고 "기본값으로 돌아가기" 위해
  사용합니다.
- 전체 세션 재설정(`/reset` 또는 `/new`)이나 세션 롤오버는 명시적인 사용량
  모드 기본 설정을 **보존**하므로 사용자의 표시 선택이 세션 롤오버 후에도
  유지됩니다. 오직 `/usage reset`(및 그 별칭)만 실제로 오버라이드를 지웁니다.

### 토글 동작

인수 없는 `/usage`는 off → tokens → full → off 순서로 순환합니다. 순환의
시작점은 **유효** 현재 모드(미설정 시 세션 오버라이드가 설정 기본값으로
넘어감)이므로, 순환은 사용자가 푸터에서 보는 내용과 항상 일관됩니다.

### 설정

설정이 없으면 이전 동작이 유지됩니다(푸터는 `/usage` 전까지 꺼짐). 세션
오버라이드를 지우고 구성된 기본값을 다시 상속하려면 `/usage reset`을
사용합니다.

## 사용자 지정 `/usage full` 푸터

`/usage full`은 모델, reasoning, 빠름/느림, 컨텍스트 창, 비용 필드를 사용할
수 있을 때 이를 포함하는 내장형 압축 푸터를 표시합니다. 토큰 및 캐시 필드는
사용자 지정 템플릿에서도 계속 사용할 수 있습니다. 템플릿 파일은 필요하지
않습니다.

`messages.usageTemplate`은 고급 사용자 지정 레이아웃 전용입니다. 값은
JSON 파일 경로(`~` 지원) 또는 인라인 객체이며, 유효한 경우 내장 푸터를
대체합니다.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

누락되었거나 빈 템플릿은 조용히 내장 푸터로 폴백합니다. 읽을 수 없거나
유효하지 않은 구성 템플릿도 내장 푸터로 폴백하며 운영자 경고를 내보냅니다.

내장 형태에서 사용자 지정 템플릿을 시작한 다음, 변경하려는 부분을
수정합니다.

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
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
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
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### 형태

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

각 surface는 **조각**의 정렬된 목록입니다. 엔진은 각 조각을 렌더링하고,
빈 값을 버린 뒤, 남은 조각을 `sep`으로 결합합니다. 항목이 없는 surface는
`output.default`를 사용합니다.

### 계약 경로

조각은 턴별 계약에서 점 경로로 값을 읽습니다. 없는 값은 비어 있습니다
(따라서 `when` 가드 또는 `|fallback`이 조각을 깔끔하게 유지합니다).

| 경로                                                                                | 의미                                   |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | 채널 ID(`discord`/`telegram`/기타)     |
| `model.provider` / `model.display_name`                                             | 제공자 ID / 모델 ID                    |
| `model.reasoning`                                                                   | 노력 수준(`off`부터 `xhigh`까지)       |
| `model.is_fallback` / `model.is_override`                                           | 불리언: 폴백 사용됨 / 모델 고정됨      |
| `state.fast_mode`                                                                   | 불리언: 빠름 vs 느림                   |
| `context.max_tokens` / `context.pct_used`                                           | 창 예산 / 0-100 사용됨                 |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | 턴 집계                                |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | 토큰 표시 가드 및 캐시 백분율          |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 최종 모델 호출만                       |
| `cost.turn_usd`                                                                     | 예상 턴 비용                           |
| `identity.name` / `identity.emoji`                                                  | 에이전트 이름 / 선택된 이모지          |

(제공자 rate-limit 기간은 이 계약에 **포함되지 않습니다**.)

### 동사

값을 왼쪽에서 오른쪽으로 동사에 통과시킵니다. 동사가 아닌 세그먼트는 폴백입니다.

| 동사            | 효과                                  | 예시                              |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | 압축된 카운트                         | `272000 -> 272k`                  |
| `fixed:N`       | N자리 소수(기본값 2)                  | `0.0377`                          |
| `dur`           | 초를 기간으로 변환                    | `14820 -> 4h07m`                  |
| `pct`           | `%` 추가                              | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 사용량을 남은 양으로 변환할 때    |
| `alias:TABLE`   | `aliases`에서 조회, 목록에 없으면 그대로 출력 | `medium -> 🌗`                    |
| `meter:W:SCALE` | 0-100 값에 대한 W칸 글리프 막대       | `[⣿⣿⠐⠐⠐]` (`meter:1` = 글리프 하나) |

### 조각 형식

- `{ "text": "📚 {context.max_tokens|num}" }`: 리터럴 + 보간입니다.
- `{ "when": "<path>", "text": "..." }`: 경로가 참일 때만 렌더링합니다.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: 값을 글리프로 변환합니다.
- `{ "each": "limits.windows", "item": "{label}" }`: 배열을 순회합니다.

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

예를 들어 `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`처럼 렌더링됩니다.

## 제공자 + 자격 증명

- **Anthropic (Claude)**: 인증 프로필의 OAuth 토큰.
- **GitHub Copilot**: 인증 프로필의 OAuth 토큰.
- **Gemini CLI**: 인증 프로필의 OAuth 토큰.
  - JSON 사용량은 `stats`로 폴백되며, `stats.cached`는
    `cacheRead`로 정규화됩니다.
- **OpenAI Codex**: 인증 프로필의 OAuth 토큰(accountId가 있으면 사용).
- **MiniMax**: API 키 또는 MiniMax OAuth 인증 프로필. OpenClaw는
  `minimax`, `minimax-cn`, `minimax-portal`을 동일한 MiniMax 할당량 범위로
  처리하고, 저장된 MiniMax OAuth가 있으면 우선 사용하며, 없으면
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` 또는 `MINIMAX_API_KEY`로
  폴백합니다.
  사용량 폴링은 구성된 경우 `models.providers.minimax-portal.baseUrl`
  또는 `models.providers.minimax.baseUrl`에서 Coding Plan 호스트를 가져오며,
  그렇지 않으면 MiniMax CN 호스트를 사용합니다.
  MiniMax의 원시 `usage_percent` / `usagePercent` 필드는 **남은**
  할당량을 의미하므로 OpenClaw는 표시 전에 이를 반전합니다. 개수 기반
  필드가 있으면 해당 필드를 우선합니다.
  - 코딩 플랜 기간 레이블은 공급자의 시간/분 필드가 있으면 그 값을
    사용하고, 없으면 `start_time` / `end_time` 범위로 폴백합니다.
  - 코딩 플랜 엔드포인트가 `model_remains`를 반환하면 OpenClaw는
    채팅 모델 항목을 우선 사용하고, 명시적인 `window_hours` /
    `window_minutes` 필드가 없을 때 타임스탬프에서 기간 레이블을 파생하며,
    플랜 레이블에 모델 이름을 포함합니다.
- **Xiaomi MiMo**: env/config/auth 저장소를 통한 API 키(`XIAOMI_API_KEY`).
- **z.ai**: env/config/auth 저장소를 통한 API 키.
- **DeepSeek**: env/config/auth 저장소를 통한 API 키(`DEEPSEEK_API_KEY`).
  OpenClaw는 DeepSeek의 잔액 엔드포인트를 호출하고, 공급자가 보고한
  잔액을 남은 비율 기반 할당량 기간 대신 텍스트로 표시합니다.

사용 가능한 공급자 사용량 인증을 확인할 수 없으면 사용량은 숨겨집니다.
공급자는 Plugin별 사용량 인증 로직을 제공할 수 있습니다. 그렇지 않으면
OpenClaw는 인증 프로필, 환경 변수 또는 config에서 일치하는 OAuth/API 키
자격 증명으로 폴백합니다.

## 관련 항목

- [토큰 사용량과 비용](/ko/reference/token-use)
- [API 사용량과 비용](/ko/reference/api-usage-costs)
- [프롬프트 캐싱](/ko/reference/prompt-caching)
