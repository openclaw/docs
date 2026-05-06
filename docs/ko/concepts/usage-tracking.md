---
read_when:
    - 제공자 사용량/할당량 화면을 연결하고 있습니다
    - 사용량 추적 동작 또는 인증 요구 사항을 설명해야 합니다
summary: 사용량 추적 화면 및 자격 증명 요구 사항
title: 사용량 추적
x-i18n:
    generated_at: "2026-05-06T06:23:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 개요

- 사용량 엔드포인트에서 제공자 사용량/할당량을 직접 가져옵니다.
- 예상 비용은 없으며, 제공자가 보고한 기간만 표시합니다.
- 사람이 읽을 수 있는 상태 출력은 업스트림 API가 사용된 할당량, 남은 할당량 또는 원시 카운트만 보고하더라도 `X% left`로 정규화됩니다.
- 세션 수준 `/status` 및 `session_status`는 라이브 세션 스냅샷이 sparse한 경우 최신 transcript 사용량 항목으로 fallback할 수 있습니다. 이 fallback은 누락된 token/cache 카운터를 채우고, 활성 런타임 모델 라벨을 복구할 수 있으며, 세션 metadata가 없거나 더 작은 경우 prompt 중심의 더 큰 합계를 우선합니다. 기존의 0이 아닌 라이브 값은 여전히 우선합니다.

## 표시 위치

- 채팅의 `/status`: 세션 token + 예상 비용(API key만 해당)이 포함된 emoji가 풍부한 상태 카드입니다. 제공자 사용량은 사용 가능한 경우 **현재 모델 제공자**에 대해 정규화된 `X% left` 기간으로 표시됩니다.
- 채팅의 `/usage off|tokens|full`: 응답별 사용량 footer입니다(OAuth는 token만 표시).
- 채팅의 `/usage cost`: OpenClaw 세션 로그에서 집계한 로컬 비용 요약입니다.
- CLI: `openclaw status --usage`는 제공자별 전체 breakdown을 출력합니다.
- CLI: `openclaw channels list`는 제공자 config와 함께 동일한 사용량 스냅샷을 출력합니다(건너뛰려면 `--no-usage` 사용).
- macOS 메뉴 막대: Context 아래의 "Usage" 섹션입니다(사용 가능한 경우에만).

## 제공자 + 자격 증명

- **Anthropic (Claude)**: auth profile의 OAuth token입니다.
- **GitHub Copilot**: auth profile의 OAuth token입니다.
- **Gemini CLI**: auth profile의 OAuth token입니다.
  - JSON 사용량은 `stats`로 fallback하며, `stats.cached`는 `cacheRead`로 정규화됩니다.
- **OpenAI Codex**: auth profile의 OAuth token입니다(있는 경우 accountId 사용).
- **MiniMax**: API key 또는 MiniMax OAuth auth profile입니다. OpenClaw는 `minimax`, `minimax-cn`, `minimax-portal`을 동일한 MiniMax 할당량 표면으로 취급하고, 저장된 MiniMax OAuth가 있으면 우선하며, 그렇지 않으면 `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` 또는 `MINIMAX_API_KEY`로 fallback합니다. 사용량 polling은 설정된 경우 `models.providers.minimax-portal.baseUrl` 또는 `models.providers.minimax.baseUrl`에서 Coding Plan host를 파생하고, 그렇지 않으면 MiniMax CN host를 사용합니다. MiniMax의 원시 `usage_percent` / `usagePercent` 필드는 **남은** 할당량을 의미하므로 OpenClaw는 표시 전에 이를 반전합니다. 카운트 기반 필드가 있으면 우선합니다.
  - Coding-plan 기간 라벨은 제공자의 hours/minutes 필드가 있으면 해당 필드에서 가져오고, 그다음 `start_time` / `end_time` 범위로 fallback합니다.
  - coding-plan 엔드포인트가 `model_remains`를 반환하면 OpenClaw는 chat-model 항목을 우선하고, 명시적 `window_hours` / `window_minutes` 필드가 없을 때 timestamp에서 기간 라벨을 파생하며, plan 라벨에 모델 이름을 포함합니다.
- **Xiaomi MiMo**: env/config/auth store를 통한 API key입니다(`XIAOMI_API_KEY`).
- **z.ai**: env/config/auth store를 통한 API key입니다.

사용 가능한 제공자 사용량 auth를 확인할 수 없으면 사용량이 숨겨집니다. 제공자는 Plugin별 사용량 auth 로직을 제공할 수 있으며, 그렇지 않으면 OpenClaw는 auth profile, environment variable 또는 config에서 일치하는 OAuth/API-key 자격 증명으로 fallback합니다.

## 관련 문서

- [Token 사용 및 비용](/ko/reference/token-use)
- [API 사용 및 비용](/ko/reference/api-usage-costs)
- [Prompt caching](/ko/reference/prompt-caching)
