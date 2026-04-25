---
read_when:
    - 캐시 유지로 프롬프트 토큰 비용을 줄이려고 합니다.
    - 다중 에이전트 설정에서 에이전트별 캐시 동작이 필요합니다.
    - Heartbeat와 cache-ttl pruning을 함께 튜닝하고 있습니다.
summary: 프롬프트 캐싱 제어 항목, 병합 순서, provider 동작 및 튜닝 패턴
title: 프롬프트 캐싱
x-i18n:
    generated_at: "2026-04-25T06:10:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

프롬프트 캐싱은 모델 provider가 매 턴마다 변경되지 않은 프롬프트 접두사(보통 system/developer 지침과 기타 안정적인 컨텍스트)를 매번 다시 처리하지 않고 재사용할 수 있게 하는 기능입니다. OpenClaw는 upstream API가 이 카운터를 직접 노출할 때 provider 사용량을 `cacheRead`와 `cacheWrite`로 정규화합니다.

상태 표면은 라이브 세션 스냅샷에 캐시 카운터가 없을 때 가장 최근 transcript
사용 로그에서 캐시 카운터를 복구할 수도 있으므로, `/status`는 부분적인 세션 메타데이터 손실 이후에도
캐시 줄을 계속 표시할 수 있습니다. 기존의 0이 아닌 라이브 캐시 값은 여전히 transcript fallback 값보다 우선합니다.

왜 중요한가: 더 낮은 토큰 비용, 더 빠른 응답, 더 예측 가능한 장기 세션 성능.
캐싱이 없으면 대부분의 입력이 바뀌지 않아도 반복 프롬프트는 매 턴마다 전체 프롬프트 비용을 지불합니다.

아래 섹션은 프롬프트 재사용과 토큰 비용에 영향을 주는 모든 캐시 관련 제어 항목을 다룹니다.

provider 참조:

- Anthropic 프롬프트 캐싱: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI 프롬프트 캐싱: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API 헤더 및 요청 ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic 요청 ID 및 오류: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 주요 제어 항목

### `cacheRetention` (전역 기본값, 모델별, 에이전트별)

모든 모델의 전역 기본값으로 캐시 유지 기간을 설정합니다:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

모델별 override:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

에이전트별 override:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

config 병합 순서:

1. `agents.defaults.params` (전역 기본값 — 모든 모델에 적용)
2. `agents.defaults.models["provider/model"].params` (모델별 override)
3. `agents.list[].params` (일치하는 에이전트 id; 키별 override)

### `contextPruning.mode: "cache-ttl"`

캐시 TTL 창 이후 오래된 tool-result 컨텍스트를 pruning하여 idle 이후 요청이
너무 큰 기록을 다시 캐싱하지 않도록 합니다.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

전체 동작은 [Session Pruning](/ko/concepts/session-pruning)을 참조하세요.

### Heartbeat keep-warm

Heartbeat는 캐시 창을 따뜻하게 유지하고 idle 간격 이후 반복적인 캐시 쓰기를 줄일 수 있습니다.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

에이전트별 heartbeat는 `agents.list[].heartbeat`에서 지원됩니다.

## provider 동작

### Anthropic (직접 API)

- `cacheRetention`이 지원됩니다.
- Anthropic API key auth profile을 사용하는 경우, OpenClaw는 설정되지 않았을 때 Anthropic 모델 ref에 `cacheRetention: "short"`를 기본으로 넣습니다.
- Anthropic 네이티브 Messages 응답은 `cache_read_input_tokens`와 `cache_creation_input_tokens`를 모두 노출하므로, OpenClaw는 `cacheRead`와 `cacheWrite`를 모두 표시할 수 있습니다.
- 네이티브 Anthropic 요청에서 `cacheRetention: "short"`는 기본 5분 ephemeral 캐시에 매핑되고, `cacheRetention: "long"`은 직접 `api.anthropic.com` 호스트에서만 1시간 TTL로 업그레이드됩니다.

### OpenAI (직접 API)

- 프롬프트 캐싱은 지원되는 최신 모델에서 자동입니다. OpenClaw는 블록 수준 캐시 마커를 주입할 필요가 없습니다.
- OpenClaw는 턴 간 캐시 라우팅을 안정적으로 유지하기 위해 `prompt_cache_key`를 사용하고, 직접 OpenAI 호스트에서 `cacheRetention: "long"`이 선택된 경우에만 `prompt_cache_retention: "24h"`를 사용합니다.
- OpenAI 호환 Completions provider는 모델 config에 `compat.supportsPromptCacheKey: true`가 명시적으로 설정된 경우에만 `prompt_cache_key`를 받습니다. `cacheRetention: "none"`은 여전히 이를 억제합니다.
- OpenAI 응답은 `usage.prompt_tokens_details.cached_tokens`(또는 Responses API 이벤트의 `input_tokens_details.cached_tokens`)를 통해 캐시된 프롬프트 토큰을 노출합니다. OpenClaw는 이를 `cacheRead`로 매핑합니다.
- OpenAI는 별도의 캐시 쓰기 토큰 카운터를 노출하지 않으므로, provider가 캐시를 워밍업하고 있어도 OpenAI 경로에서는 `cacheWrite`가 `0`으로 유지됩니다.
- OpenAI는 `x-request-id`, `openai-processing-ms`, `x-ratelimit-*` 같은 유용한 tracing 및 rate-limit 헤더를 반환하지만, 캐시 적중 집계는 헤더가 아니라 usage payload에서 가져와야 합니다.
- 실제로 OpenAI는 Anthropic 스타일의 이동하는 전체 기록 재사용보다는 초기 접두사 캐시처럼 동작하는 경우가 많습니다. 안정적인 긴 접두사 텍스트 턴은 현재 라이브 probe에서 `4864` 캐시 토큰 plateau 근처에 도달할 수 있고, tool이 많거나 MCP 스타일 transcript는 정확히 반복해도 `4608` 캐시 토큰 근처에서 plateau되는 경우가 많습니다.

### Anthropic Vertex

- Vertex AI의 Anthropic 모델(`anthropic-vertex/*`)은 직접 Anthropic과 동일하게 `cacheRetention`을 지원합니다.
- `cacheRetention: "long"`은 Vertex AI 엔드포인트에서 실제 1시간 프롬프트 캐시 TTL로 매핑됩니다.
- `anthropic-vertex`의 기본 캐시 유지 기간은 직접 Anthropic 기본값과 일치합니다.
- Vertex 요청은 경계 인식 캐시 shaping을 통해 라우팅되므로 캐시 재사용이 provider가 실제로 받는 내용과 정렬된 상태를 유지합니다.

### Amazon Bedrock

- Anthropic Claude 모델 ref(`amazon-bedrock/*anthropic.claude*`)는 명시적인 `cacheRetention` pass-through를 지원합니다.
- Anthropic이 아닌 Bedrock 모델은 런타임에서 `cacheRetention: "none"`으로 강제됩니다.

### OpenRouter 모델

`openrouter/anthropic/*` 모델 ref의 경우, OpenClaw는 요청이 여전히 검증된 OpenRouter 경로
(`openrouter` 기본 엔드포인트 또는 `openrouter.ai`로 해석되는 provider/base URL)를
대상으로 하고 있을 때만 프롬프트 캐시
재사용을 개선하기 위해 system/developer 프롬프트 블록에 Anthropic
`cache_control`을 주입합니다.

`openrouter/deepseek/*`, `openrouter/moonshot*/*`, `openrouter/zai/*`
모델 ref의 경우, OpenRouter가
provider 측 프롬프트 캐싱을 자동으로 처리하므로 `contextPruning.mode: "cache-ttl"`이 허용됩니다. OpenClaw는
이 요청에 Anthropic `cache_control` 마커를 주입하지 않습니다.

DeepSeek 캐시 구성은 best-effort이며 몇 초가 걸릴 수 있습니다. 즉시 이어지는
후속 요청은 여전히 `cached_tokens: 0`을 보일 수 있습니다. 짧은 지연 후 반복된 동일 접두사 요청으로 확인하고
`usage.prompt_tokens_details.cached_tokens`를 캐시 적중 신호로 사용하세요.

모델을 임의의 OpenAI 호환 proxy URL로 다시 지정하면, OpenClaw는
해당 OpenRouter 전용 Anthropic 캐시 마커 주입을 중단합니다.

### 기타 provider

provider가 이 캐시 모드를 지원하지 않으면 `cacheRetention`은 효과가 없습니다.

### Google Gemini 직접 API

- 직접 Gemini 전송(`api: "google-generative-ai"`)은 upstream `cachedContentTokenCount`를 통해
  캐시 적중을 보고하며, OpenClaw는 이를 `cacheRead`로 매핑합니다.
- 직접 Gemini 모델에 `cacheRetention`이 설정되면, OpenClaw는
  Google AI Studio 실행에서 system prompt용 `cachedContents` 리소스를 자동으로 생성, 재사용, 갱신합니다. 즉, 이제 더 이상
  cached-content 핸들을 수동으로 미리 만들 필요가 없습니다.
- 여전히 구성된 모델에서 기존 Gemini cached-content 핸들을
  `params.cachedContent`(또는 레거시 `params.cached_content`)로 전달할 수 있습니다.
- 이는 Anthropic/OpenAI 프롬프트 접두사 캐싱과는 별개입니다. Gemini의 경우,
  OpenClaw는 요청에 캐시 마커를 주입하는 대신 provider 네이티브 `cachedContents` 리소스를 관리합니다.

### Gemini CLI JSON 사용량

- Gemini CLI JSON 출력도 `stats.cached`를 통해 캐시 적중을 노출할 수 있으며,
  OpenClaw는 이를 `cacheRead`로 매핑합니다.
- CLI가 직접 `stats.input` 값을 생략하면, OpenClaw는
  `stats.input_tokens - stats.cached`에서 입력 토큰을 계산합니다.
- 이것은 사용량 정규화일 뿐입니다. OpenClaw가 Gemini CLI에 대해
  Anthropic/OpenAI 스타일 프롬프트 캐시 마커를 생성한다는 뜻은 아닙니다.

## 시스템 프롬프트 캐시 경계

OpenClaw는 시스템 프롬프트를 내부 캐시 접두사 경계로 분리된 **안정적인
접두사**와 **변동적인 접미사**로 나눕니다. 경계 위의 콘텐츠(도구 정의, Skills 메타데이터, 워크스페이스 파일, 기타
상대적으로 정적인 컨텍스트)는 턴 간 바이트 단위로 동일하게 유지되도록 정렬됩니다.
경계 아래의 콘텐츠(예: `HEARTBEAT.md`, 런타임 타임스탬프, 기타 턴별 메타데이터)는
캐시된 접두사를 무효화하지 않으면서 변경될 수 있습니다.

주요 설계 선택:

- 안정적인 워크스페이스 프로젝트 컨텍스트 파일은 `HEARTBEAT.md`보다 먼저 정렬되므로
  heartbeat 변동이 안정적인 접두사를 깨뜨리지 않습니다.
- 이 경계는 Anthropic 계열, OpenAI 계열, Google 및
  CLI 전송 shaping 전반에 적용되어 지원되는 모든 provider가 동일한 접두사
  안정성의 이점을 얻습니다.
- Codex Responses 및 Anthropic Vertex 요청은
  경계 인식 캐시 shaping을 통해 라우팅되므로 캐시 재사용이 provider가 실제로 받는 내용과 정렬된 상태를 유지합니다.
- 시스템 프롬프트 fingerprint는 정규화됩니다(공백, 줄바꿈,
  hook가 추가한 컨텍스트, 런타임 capability 순서). 따라서 의미적으로 변하지 않은
  프롬프트는 턴 간 KV/캐시를 공유합니다.

config 또는 워크스페이스 변경 후 예상치 못한 `cacheWrite` 급증이 보인다면,
해당 변경이 캐시 경계 위에 들어가는지 아래에 들어가는지 확인하세요. 변동적인
콘텐츠를 경계 아래로 옮기거나(또는 안정화하면) 문제가 해결되는 경우가 많습니다.

## OpenClaw 캐시 안정성 가드

OpenClaw는 요청이 provider에 도달하기 전에 여러 캐시 민감 payload 형태도
결정적으로 유지합니다.

- bundle MCP 도구 카탈로그는 도구
  등록 전에 결정적으로 정렬되므로 `listTools()` 순서 변경이 도구 블록을 흔들어
  프롬프트 캐시 접두사를 깨뜨리지 않습니다.
- persisted 이미지 블록을 가진 레거시 세션은 **가장 최근의
  완료된 3개 턴**을 그대로 유지합니다. 더 오래된 이미 처리된 이미지 블록은
  마커로 대체될 수 있으므로, 이미지가 많은 후속 작업이 크고 오래된 payload를 계속 다시 보내지 않게 됩니다.

## 튜닝 패턴

### 혼합 트래픽(권장 기본값)

메인 에이전트에는 장기 유지 기준선을 두고, 급증형 알림 에이전트에서는 캐싱을 비활성화합니다.

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### 비용 우선 기준선

- 기준선 `cacheRetention: "short"` 설정.
- `contextPruning.mode: "cache-ttl"` 활성화.
- warm cache의 이점이 있는 에이전트에 대해서만 heartbeat를 TTL보다 짧게 유지.

## 캐시 진단

OpenClaw는 내장 에이전트 실행에 대해 전용 캐시 trace 진단을 노출합니다.

일반적인 사용자 대상 진단의 경우, `/status` 및 기타 사용량 요약은
라이브 세션 항목에 해당 카운터가 없을 때
`cacheRead` / `cacheWrite`의 fallback 소스로 최신 transcript 사용 항목을 사용할 수 있습니다.

## 라이브 회귀 테스트

OpenClaw는 반복 접두사, tool 턴, 이미지 턴, MCP 스타일 tool transcript, 그리고 Anthropic no-cache control에 대해 하나의 결합된 라이브 캐시 회귀 게이트를 유지합니다.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

범위가 좁은 라이브 게이트 실행:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

기준선 파일은 가장 최근에 관찰된 라이브 수치와, 테스트에서 사용하는 provider별 회귀 하한값을 저장합니다.
runner는 이전 캐시 상태가 현재 회귀 샘플을 오염시키지 않도록
매 실행마다 새로운 세션 ID와 프롬프트 네임스페이스도 사용합니다.

이 테스트들은 의도적으로 provider 간에 동일한 성공 기준을 사용하지 않습니다.

### Anthropic 라이브 기대값

- `cacheWrite`를 통한 명시적 워밍업 쓰기를 기대합니다.
- Anthropic 캐시 제어가 대화 전반에 걸쳐 캐시 브레이크포인트를 이동시키므로 반복 턴에서 거의 전체 기록 재사용을 기대합니다.
- 현재 라이브 assertion은 안정적, tool, 이미지 경로에 대해 여전히 높은 적중률 임계값을 사용합니다.

### OpenAI 라이브 기대값

- `cacheRead`만 기대하세요. `cacheWrite`는 `0`으로 유지됩니다.
- 반복 턴 캐시 재사용은 Anthropic 스타일의 이동하는 전체 기록 재사용이 아니라 provider별 plateau로 취급하세요.
- 현재 라이브 assertion은 `gpt-5.4-mini`에서 관찰된 라이브 동작을 바탕으로 보수적인 하한 검사를 사용합니다:
  - 안정적 접두사: `cacheRead >= 4608`, 적중률 `>= 0.90`
  - tool transcript: `cacheRead >= 4096`, 적중률 `>= 0.85`
  - 이미지 transcript: `cacheRead >= 3840`, 적중률 `>= 0.82`
  - MCP 스타일 transcript: `cacheRead >= 4096`, 적중률 `>= 0.85`

2026-04-04의 최신 결합 라이브 검증 결과:

- 안정적 접두사: `cacheRead=4864`, 적중률 `0.966`
- tool transcript: `cacheRead=4608`, 적중률 `0.896`
- 이미지 transcript: `cacheRead=4864`, 적중률 `0.954`
- MCP 스타일 transcript: `cacheRead=4608`, 적중률 `0.891`

결합 게이트의 최근 로컬 wall-clock 시간은 약 `88s`였습니다.

assertion이 다른 이유:

- Anthropic은 명시적 캐시 브레이크포인트와 이동하는 대화 기록 재사용을 노출합니다.
- OpenAI 프롬프트 캐싱은 여전히 정확한 접두사에 민감하지만, 라이브 Responses 트래픽에서 실제로 재사용 가능한 접두사는 전체 프롬프트보다 일찍 plateau될 수 있습니다.
- 따라서 Anthropic과 OpenAI를 단일 cross-provider 퍼센트 임계값으로 비교하면 거짓 회귀가 발생합니다.

### `diagnostics.cacheTrace` 구성

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # 선택 사항
    includeMessages: false # 기본값 true
    includePrompt: false # 기본값 true
    includeSystem: false # 기본값 true
```

기본값:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Env 토글(일회성 디버깅)

- `OPENCLAW_CACHE_TRACE=1`은 캐시 tracing을 활성화합니다.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl`은 출력 경로를 override합니다.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1`은 전체 메시지 payload 캡처를 토글합니다.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1`은 프롬프트 텍스트 캡처를 토글합니다.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1`은 시스템 프롬프트 캡처를 토글합니다.

### 검사할 항목

- 캐시 trace 이벤트는 JSONL이며 `session:loaded`, `prompt:before`, `stream:context`, `session:after` 같은 단계별 스냅샷을 포함합니다.
- 턴별 캐시 토큰 영향은 일반적인 사용량 표면의 `cacheRead` 및 `cacheWrite`를 통해 볼 수 있습니다(예: `/usage full` 및 세션 사용량 요약).
- Anthropic의 경우 캐싱이 활성화되면 `cacheRead`와 `cacheWrite` 둘 다 기대하세요.
- OpenAI의 경우 캐시 적중 시 `cacheRead`를 기대하고 `cacheWrite`는 `0`으로 유지됩니다. OpenAI는 별도의 캐시 쓰기 토큰 필드를 공개하지 않습니다.
- 요청 tracing이 필요하면, 요청 ID와 rate-limit 헤더를 캐시 지표와 분리해서 기록하세요. OpenClaw의 현재 cache-trace 출력은 원시 provider 응답 헤더보다 프롬프트/세션 형태와 정규화된 토큰 사용량에 초점을 맞춥니다.

## 빠른 문제 해결

- 대부분의 턴에서 `cacheWrite`가 높음: 변동적인 시스템 프롬프트 입력을 확인하고 모델/provider가 해당 캐시 설정을 지원하는지 검증하세요.
- Anthropic에서 `cacheWrite`가 높음: 보통 캐시 브레이크포인트가 매 요청마다 바뀌는 콘텐츠에 놓이고 있다는 뜻입니다.
- OpenAI `cacheRead`가 낮음: 안정적인 접두사가 맨 앞에 있는지, 반복 접두사가 최소 1024토큰인지, 캐시를 공유해야 하는 턴에서 동일한 `prompt_cache_key`가 재사용되는지 확인하세요.
- `cacheRetention`의 효과가 없음: 모델 키가 `agents.defaults.models["provider/model"]`와 일치하는지 확인하세요.
- 캐시 설정이 있는 Bedrock Nova/Mistral 요청: 런타임에서 `none`으로 강제되는 것이 정상입니다.

관련 문서:

- [Anthropic](/ko/providers/anthropic)
- [Token use and costs](/ko/reference/token-use)
- [Session pruning](/ko/concepts/session-pruning)
- [Gateway configuration reference](/ko/gateway/configuration-reference)

## 관련 항목

- [Token use and costs](/ko/reference/token-use)
- [API usage and costs](/ko/reference/api-usage-costs)
