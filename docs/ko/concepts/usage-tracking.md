---
read_when:
    - 제공자 사용량/할당량 노출 지점을 연결하고 있습니다
    - 사용량 추적 동작 또는 인증 요구 사항을 설명해야 합니다
summary: 사용량 추적 영역 및 자격 증명 요구 사항
title: 사용량 추적
x-i18n:
    generated_at: "2026-05-02T20:49:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 무엇인가

- 프로바이더의 사용량 엔드포인트에서 프로바이더 사용량/할당량을 직접 가져옵니다.
- 예상 비용은 없으며, 프로바이더가 보고한 기간만 사용합니다.
- 사람이 읽을 수 있는 상태 출력은 상위 API가 소비된 할당량, 남은 할당량 또는 원시 카운트만 보고하더라도 `X% left`로 정규화됩니다.
- 세션 수준 `/status` 및 `session_status`는 실시간 세션 스냅샷이 부족할 때 최신 트랜스크립트 사용량 항목으로 대체할 수 있습니다. 이 대체 경로는 누락된 토큰/캐시 카운터를 채우고, 활성 런타임 모델 레이블을 복구할 수 있으며, 세션 메타데이터가 없거나 더 작을 때 프롬프트 중심의 더 큰 합계를 우선합니다. 기존의 0이 아닌 실시간 값은 여전히 우선합니다.

## 표시되는 위치

- 채팅의 `/status`: 세션 토큰 + 예상 비용(API key만 해당)을 포함한 이모지 풍부한 상태 카드입니다. 프로바이더 사용량은 사용 가능한 경우 **현재 모델 프로바이더**에 대해 정규화된 `X% left` 기간으로 표시됩니다.
- 채팅의 `/usage off|tokens|full`: 응답별 사용량 푸터입니다(OAuth는 토큰만 표시).
- 채팅의 `/usage cost`: OpenClaw 세션 로그에서 집계한 로컬 비용 요약입니다.
- CLI: `openclaw status --usage`는 프로바이더별 전체 세부 내역을 출력합니다.
- CLI: `openclaw channels list`는 프로바이더 설정과 함께 동일한 사용량 스냅샷을 출력합니다(건너뛰려면 `--no-usage` 사용).
- macOS 메뉴 막대: Context 아래의 “사용량” 섹션입니다(사용 가능한 경우에만).

## 프로바이더 + 자격 증명

- **Anthropic (Claude)**: 인증 프로필의 OAuth 토큰입니다.
- **GitHub Copilot**: 인증 프로필의 OAuth 토큰입니다.
- **Gemini CLI**: 인증 프로필의 OAuth 토큰입니다.
  - JSON 사용량은 `stats`로 대체됩니다. `stats.cached`는 `cacheRead`로 정규화됩니다.
- **OpenAI Codex**: 인증 프로필의 OAuth 토큰입니다(있는 경우 accountId 사용).
- **MiniMax**: API key 또는 MiniMax OAuth 인증 프로필입니다. OpenClaw는 `minimax`, `minimax-cn`, `minimax-portal`을 동일한 MiniMax 할당량 표면으로 취급하고, 저장된 MiniMax OAuth가 있으면 이를 우선하며, 그렇지 않으면 `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` 또는 `MINIMAX_API_KEY`로 대체합니다.
  사용량 폴링은 구성된 경우 `models.providers.minimax-portal.baseUrl` 또는 `models.providers.minimax.baseUrl`에서 Coding Plan 호스트를 파생하고, 그렇지 않으면 MiniMax CN 호스트를 사용합니다.
  MiniMax의 원시 `usage_percent` / `usagePercent` 필드는 **남은** 할당량을 의미하므로 OpenClaw는 표시 전에 이를 반전합니다. 카운트 기반 필드가 있으면 우선합니다.
  - 코딩 플랜 기간 레이블은 있는 경우 프로바이더의 시간/분 필드에서 가져오고, 그다음 `start_time` / `end_time` 범위로 대체됩니다.
  - 코딩 플랜 엔드포인트가 `model_remains`를 반환하면 OpenClaw는 채팅 모델 항목을 우선하고, 명시적 `window_hours` / `window_minutes` 필드가 없을 때 타임스탬프에서 기간 레이블을 파생하며, 플랜 레이블에 모델 이름을 포함합니다.
- **Xiaomi MiMo**: env/config/auth store를 통한 API key(`XIAOMI_API_KEY`)입니다.
- **z.ai**: env/config/auth store를 통한 API key입니다.

사용 가능한 프로바이더 사용량 인증을 확인할 수 없으면 사용량은 숨겨집니다. 프로바이더는 Plugin별 사용량 인증 로직을 제공할 수 있습니다. 그렇지 않으면 OpenClaw는 인증 프로필, 환경 변수 또는 구성에서 일치하는 OAuth/API-key 자격 증명으로 대체합니다.

## 관련 문서

- [토큰 사용량 및 비용](/ko/reference/token-use)
- [API 사용량 및 비용](/ko/reference/api-usage-costs)
- [프롬프트 캐싱](/ko/reference/prompt-caching)
