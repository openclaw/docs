---
read_when:
    - Prompt 캐시 유지로 토큰 비용을 줄이려는 경우
    - 다중 에이전트 구성에서 에이전트별 캐시 동작이 필요합니다
    - Heartbeat와 cache-ttl 정리를 함께 조정하고 있습니다
summary: 프롬프트 캐싱 조정값, 병합 순서, 제공자 동작 및 튜닝 패턴
title: 프롬프트 캐싱
x-i18n:
    generated_at: "2026-06-27T18:06:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

프롬프트 캐싱은 모델 제공자가 변경되지 않은 프롬프트 접두사(보통 system/developer 지침 및 기타 안정적인 컨텍스트)를 매번 다시 처리하는 대신 턴 간에 재사용할 수 있음을 의미합니다. OpenClaw는 업스트림 API가 해당 카운터를 직접 노출하는 경우 제공자 사용량을 `cacheRead` 및 `cacheWrite`로 정규화합니다.

상태 화면은 라이브 세션 스냅샷에 캐시 카운터가 없을 때 가장 최근의 트랜스크립트 사용량 로그에서도 이를 복구할 수 있으므로, 세션 메타데이터가 부분적으로 손실된 뒤에도 `/status`가 캐시 줄을 계속 표시할 수 있습니다. 기존의 0이 아닌 라이브 캐시 값은 여전히 트랜스크립트 폴백 값보다 우선합니다.

중요한 이유: 토큰 비용이 낮아지고, 응답이 빨라지며, 장기 실행 세션의 성능을 더 예측 가능하게 만듭니다. 캐싱이 없으면 대부분의 입력이 바뀌지 않았더라도 반복 프롬프트가 매 턴마다 전체 프롬프트 비용을 지불합니다.

아래 섹션에서는 프롬프트 재사용과 토큰 비용에 영향을 주는 모든 캐시 관련 조정 항목을 다룹니다.

제공자 참조:

- Anthropic 프롬프트 캐싱: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI 프롬프트 캐싱: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API 헤더 및 요청 ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic 요청 ID 및 오류: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 주요 조정 항목

### `cacheRetention`(전역 기본값, 모델, 에이전트별)

모든 모델의 전역 기본값으로 캐시 보존 기간을 설정합니다.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

모델별로 재정의합니다.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

에이전트별 재정의:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

설정 병합 순서:

1. `agents.defaults.params`(전역 기본값 — 모든 모델에 적용)
2. `agents.defaults.models["provider/model"].params`(모델별 재정의)
3. `agents.list[].params`(일치하는 에이전트 ID, 키별로 재정의)

### `contextPruning.mode: "cache-ttl"`

캐시 TTL 창이 지난 뒤 오래된 도구 결과 컨텍스트를 정리하여, 유휴 상태 이후 요청이 지나치게 큰 기록을 다시 캐싱하지 않도록 합니다.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

전체 동작은 [세션 정리](/ko/concepts/session-pruning)를 참조하세요.

### Heartbeat 보온 유지

Heartbeat는 캐시 창을 따뜻하게 유지하고 유휴 간격 이후 반복되는 캐시 쓰기를 줄일 수 있습니다.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

에이전트별 heartbeat는 `agents.list[].heartbeat`에서 지원됩니다.

## 제공자 동작

### Anthropic(직접 API)

- `cacheRetention`이 지원됩니다.
- Anthropic API 키 인증 프로필에서는 설정되지 않은 Anthropic 모델 참조에 대해 OpenClaw가 `cacheRetention: "short"`를 시드합니다.
- Anthropic 네이티브 Messages 응답은 `cache_read_input_tokens`와 `cache_creation_input_tokens`를 모두 노출하므로 OpenClaw가 `cacheRead`와 `cacheWrite`를 모두 표시할 수 있습니다.
- 네이티브 Anthropic 요청에서 `cacheRetention: "short"`는 기본 5분 임시 캐시에 매핑되고, `cacheRetention: "long"`은 직접 `api.anthropic.com` 호스트에서만 1시간 TTL로 업그레이드됩니다.

### OpenAI(직접 API)

- 프롬프트 캐싱은 지원되는 최신 모델에서 자동으로 동작합니다. OpenClaw는 블록 수준 캐시 마커를 주입할 필요가 없습니다.
- OpenClaw는 턴 간 캐시 라우팅을 안정적으로 유지하기 위해 `prompt_cache_key`를 사용합니다. 직접 OpenAI 호스트는 `cacheRetention: "long"`이 선택되면 `prompt_cache_retention: "24h"`를 사용합니다.
- OpenAI 호환 Completions 제공자는 해당 모델 설정이 `compat.supportsPromptCacheKey: true`를 명시적으로 설정한 경우에만 `prompt_cache_key`를 받습니다. 장기 보존 전달은 별도의 기능입니다. 명시적 `cacheRetention: "long"`은 해당 compat 항목이 장기 캐시 보존도 지원하는 경우에만 `prompt_cache_retention: "24h"`를 보냅니다. Mistral 같은 제공자는 `compat.supportsLongCacheRetention: false`를 설정해 장기 보존 필드를 억제하면서 캐시 키를 옵트인할 수 있습니다. `cacheRetention: "none"`은 두 필드를 모두 억제합니다.
- OpenAI 응답은 `usage.prompt_tokens_details.cached_tokens`(또는 Responses API 이벤트의 `input_tokens_details.cached_tokens`)를 통해 캐시된 프롬프트 토큰을 노출합니다. OpenClaw는 이를 `cacheRead`로 매핑합니다.
- OpenAI는 별도의 캐시 쓰기 토큰 카운터를 노출하지 않으므로, 제공자가 캐시를 예열하는 경우에도 OpenAI 경로에서 `cacheWrite`는 `0`으로 유지됩니다.
- OpenAI는 `x-request-id`, `openai-processing-ms`, `x-ratelimit-*` 같은 유용한 추적 및 속도 제한 헤더를 반환하지만, 캐시 적중 산정은 헤더가 아니라 사용량 페이로드에서 가져와야 합니다.
- 실제로 OpenAI는 Anthropic 스타일의 이동식 전체 기록 재사용보다는 초기 접두사 캐시처럼 동작하는 경우가 많습니다. 안정적인 긴 접두사 텍스트 턴은 현재 라이브 프로브에서 `4864` 캐시 토큰 정체 구간 근처에 도달할 수 있는 반면, 도구가 많거나 MCP 스타일인 트랜스크립트는 정확히 반복해도 `4608` 캐시 토큰 근처에서 정체되는 경우가 많습니다.

### Anthropic Vertex

- Vertex AI의 Anthropic 모델(`anthropic-vertex/*`)은 직접 Anthropic과 동일한 방식으로 `cacheRetention`을 지원합니다.
- `cacheRetention: "long"`은 Vertex AI 엔드포인트에서 실제 1시간 프롬프트 캐시 TTL에 매핑됩니다.
- `anthropic-vertex`의 기본 캐시 보존 기간은 직접 Anthropic 기본값과 일치합니다.
- Vertex 요청은 경계 인식 캐시 셰이핑을 통해 라우팅되어, 캐시 재사용이 제공자가 실제로 받는 내용과 정렬된 상태를 유지합니다.

### Amazon Bedrock

- Anthropic Claude 모델 참조(`amazon-bedrock/*anthropic.claude*`)는 명시적 `cacheRetention` 전달을 지원합니다.
- Anthropic이 아닌 Bedrock 모델은 런타임에 `cacheRetention: "none"`으로 강제됩니다.

### OpenRouter 모델

`openrouter/anthropic/*` 모델 참조의 경우, OpenClaw는 요청이 여전히 검증된 OpenRouter 경로(`openrouter`의 기본 엔드포인트 또는 `openrouter.ai`로 해석되는 제공자/base URL)를 대상으로 할 때만 프롬프트 캐시 재사용을 개선하기 위해 system/developer 프롬프트 블록에 Anthropic `cache_control`을 주입합니다.

`openrouter/deepseek/*`, `openrouter/moonshot*/*`, `openrouter/zai/*` 모델 참조의 경우 OpenRouter가 제공자 측 프롬프트 캐싱을 자동으로 처리하므로 `contextPruning.mode: "cache-ttl"`이 허용됩니다. OpenClaw는 이러한 요청에 Anthropic `cache_control` 마커를 주입하지 않습니다.

DeepSeek 캐시 구성은 최선 노력 방식이며 몇 초가 걸릴 수 있습니다. 즉시 이어지는 후속 요청은 여전히 `cached_tokens: 0`을 표시할 수 있습니다. 짧은 지연 후 동일한 접두사 요청을 반복해 확인하고, 캐시 적중 신호로 `usage.prompt_tokens_details.cached_tokens`를 사용하세요.

모델을 임의의 OpenAI 호환 프록시 URL로 다시 지정하면 OpenClaw는 이러한 OpenRouter 전용 Anthropic 캐시 마커 주입을 중단합니다.

### 기타 제공자

제공자가 이 캐시 모드를 지원하지 않으면 `cacheRetention`은 효과가 없습니다.

### Google Gemini 직접 API

- 직접 Gemini 전송(`api: "google-generative-ai"`)은 업스트림 `cachedContentTokenCount`를 통해 캐시 적중을 보고합니다. OpenClaw는 이를 `cacheRead`로 매핑합니다.
- 직접 Gemini 모델에 `cacheRetention`이 설정되면 OpenClaw는 Google AI Studio 실행에서 시스템 프롬프트를 위한 `cachedContents` 리소스를 자동으로 생성, 재사용, 새로 고칩니다. 즉, 더 이상 cached-content 핸들을 수동으로 미리 만들 필요가 없습니다.
- 구성된 모델에서 기존 Gemini cached-content 핸들을 `params.cachedContent`(또는 레거시 `params.cached_content`)로 계속 전달할 수 있습니다.
- 이는 Anthropic/OpenAI 프롬프트 접두사 캐싱과 별개입니다. Gemini의 경우 OpenClaw는 요청에 캐시 마커를 주입하는 대신 제공자 네이티브 `cachedContents` 리소스를 관리합니다.

### Gemini CLI 사용량

- Gemini CLI `stream-json` 출력은 `stats.cached`를 통해 캐시 적중을 표면화할 수 있습니다. OpenClaw는 이를 `cacheRead`로 매핑합니다. 레거시 `--output-format json` 재정의도 동일한 사용량 정규화를 사용합니다.
- CLI가 직접 `stats.input` 값을 생략하면 OpenClaw는 `stats.input_tokens - stats.cached`에서 입력 토큰을 도출합니다.
- 이는 사용량 정규화일 뿐입니다. OpenClaw가 Gemini CLI를 위해 Anthropic/OpenAI 스타일 프롬프트 캐시 마커를 생성한다는 뜻은 아닙니다.

## 시스템 프롬프트 캐시 경계

OpenClaw는 시스템 프롬프트를 내부 캐시 접두사 경계로 구분되는 **안정적인 접두사**와 **휘발성 접미사**로 나눕니다. 경계 위의 콘텐츠(도구 정의, Skills 메타데이터, 워크스페이스 파일 및 기타 비교적 정적인 컨텍스트)는 턴 간 바이트 단위로 동일하게 유지되도록 정렬됩니다. 경계 아래의 콘텐츠(예: `HEARTBEAT.md`, 런타임 타임스탬프 및 기타 턴별 메타데이터)는 캐시된 접두사를 무효화하지 않고 변경될 수 있습니다.

핵심 설계 선택:

- 안정적인 워크스페이스 프로젝트 컨텍스트 파일은 `HEARTBEAT.md`보다 앞에 정렬되어 heartbeat 변동이 안정적인 접두사를 깨지 않도록 합니다.
- 경계는 Anthropic 계열, OpenAI 계열, Google 및 CLI 전송 셰이핑 전반에 적용되므로 지원되는 모든 제공자가 동일한 접두사 안정성의 이점을 얻습니다.
- Codex Responses 및 Anthropic Vertex 요청은 경계 인식 캐시 셰이핑을 통해 라우팅되어, 캐시 재사용이 제공자가 실제로 받는 내용과 정렬된 상태를 유지합니다.
- 시스템 프롬프트 지문은 정규화되므로(공백, 줄 끝, 훅이 추가한 컨텍스트, 런타임 기능 순서) 의미상 변경되지 않은 프롬프트가 턴 간 KV/캐시를 공유합니다.

설정 또는 워크스페이스 변경 이후 예상치 못한 `cacheWrite` 급증이 보이면 해당 변경이 캐시 경계 위에 있는지 아래에 있는지 확인하세요. 휘발성 콘텐츠를 경계 아래로 옮기거나 안정화하면 문제가 해결되는 경우가 많습니다.

## OpenClaw 캐시 안정성 가드

OpenClaw는 요청이 제공자에 도달하기 전에 여러 캐시 민감 페이로드 형태도 결정적으로 유지합니다.

- 번들 MCP 도구 카탈로그는 도구 등록 전에 결정적으로 정렬되므로, `listTools()` 순서 변경이 도구 블록을 변동시켜 프롬프트 캐시 접두사를 깨지 않습니다.
- 지속된 이미지 블록이 있는 레거시 세션은 **가장 최근 완료된 턴 3개**를 그대로 유지합니다. 이미 처리된 더 오래된 이미지 블록은 마커로 대체될 수 있으므로 이미지가 많은 후속 요청이 크고 오래된 페이로드를 계속 다시 보내지 않습니다.

## 튜닝 패턴

### 혼합 트래픽(권장 기본값)

주 에이전트에는 장기 기준선을 유지하고, 버스트성 알림 에이전트에서는 캐싱을 비활성화합니다.

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

- 기준 `cacheRetention: "short"`를 설정합니다.
- `contextPruning.mode: "cache-ttl"`을 활성화합니다.
- 따뜻한 캐시의 이점을 얻는 에이전트에만 TTL보다 짧은 heartbeat를 유지합니다.

## 캐시 진단

OpenClaw는 임베디드 에이전트 실행을 위한 전용 캐시 추적 진단을 노출합니다.

일반 사용자 대상 진단의 경우, 라이브 세션 항목에 해당 카운터가 없을 때 `/status` 및 기타 사용량 요약이 최신 트랜스크립트 사용량 항목을 `cacheRead` / `cacheWrite`의 폴백 소스로 사용할 수 있습니다.

## 라이브 회귀 테스트

OpenClaw는 반복 접두사, 도구 턴, 이미지 턴, MCP 스타일 도구 트랜스크립트, Anthropic 무캐시 대조군을 위한 하나의 결합 라이브 캐시 회귀 게이트를 유지합니다.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

좁은 라이브 게이트를 다음으로 실행합니다.

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

기준선 파일은 가장 최근에 관찰된 라이브 수치와 테스트에서 사용하는 제공자별 회귀 하한을 저장합니다.
러너는 또한 이전 캐시 상태가 현재 회귀 샘플을 오염시키지 않도록 실행마다 새 세션 ID와 프롬프트 네임스페이스를 사용합니다.

이 테스트들은 의도적으로 공급자 간에 동일한 성공 기준을 사용하지 않습니다.

### Anthropic 라이브 기대값

- `cacheWrite`를 통한 명시적 워밍업 쓰기를 기대합니다.
- Anthropic 캐시 제어가 대화 전반에 걸쳐 캐시 중단점을 전진시키므로, 반복 턴에서 거의 전체 기록이 재사용될 것으로 기대합니다.
- 현재 라이브 어설션은 안정, 도구, 이미지 경로에 대해 여전히 높은 적중률 임계값을 사용합니다.

### OpenAI 라이브 기대값

- `cacheRead`만 기대합니다. `cacheWrite`는 `0`으로 유지됩니다.
- 반복 턴 캐시 재사용은 Anthropic 스타일의 이동하는 전체 기록 재사용이 아니라 공급자별 정체 구간으로 취급합니다.
- 현재 라이브 어설션은 `gpt-5.4-mini`에서 관찰된 라이브 동작에서 도출한 보수적인 하한 검사를 사용합니다.
  - 안정 접두사: `cacheRead >= 4608`, 적중률 `>= 0.90`
  - 도구 트랜스크립트: `cacheRead >= 4096`, 적중률 `>= 0.85`
  - 이미지 트랜스크립트: `cacheRead >= 3840`, 적중률 `>= 0.82`
  - MCP 스타일 트랜스크립트: `cacheRead >= 4096`, 적중률 `>= 0.85`

2026-04-04의 새로운 통합 라이브 검증 결과는 다음과 같았습니다.

- 안정 접두사: `cacheRead=4864`, 적중률 `0.966`
- 도구 트랜스크립트: `cacheRead=4608`, 적중률 `0.896`
- 이미지 트랜스크립트: `cacheRead=4864`, 적중률 `0.954`
- MCP 스타일 트랜스크립트: `cacheRead=4608`, 적중률 `0.891`

최근 통합 게이트의 로컬 실제 경과 시간은 약 `88s`였습니다.

어설션이 다른 이유:

- Anthropic은 명시적 캐시 중단점과 이동하는 대화 기록 재사용을 노출합니다.
- OpenAI 프롬프트 캐싱은 여전히 정확한 접두사에 민감하지만, 라이브 Responses 트래픽에서 실제로 재사용 가능한 접두사는 전체 프롬프트보다 더 일찍 정체될 수 있습니다.
- 따라서 단일 교차 공급자 백분율 임계값으로 Anthropic과 OpenAI를 비교하면 잘못된 회귀가 발생합니다.

### `diagnostics.cacheTrace` 구성

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

기본값:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### 환경 토글(일회성 디버깅)

- `OPENCLAW_CACHE_TRACE=1`은 캐시 추적을 활성화합니다.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl`은 출력 경로를 재정의합니다.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1`은 전체 메시지 페이로드 캡처를 토글합니다.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1`은 프롬프트 텍스트 캡처를 토글합니다.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1`은 시스템 프롬프트 캡처를 토글합니다.

### 검사할 항목

- 캐시 추적 이벤트는 JSONL이며 `session:loaded`, `prompt:before`, `stream:context`, `session:after` 같은 단계별 스냅샷을 포함합니다.
- 턴별 캐시 토큰 영향은 일반 사용 화면에서 `cacheRead` 및 `cacheWrite`를 통해 확인할 수 있습니다(예: `/usage full` 및 세션 사용량 요약).
- Anthropic의 경우 캐싱이 활성화되면 `cacheRead`와 `cacheWrite`를 모두 기대합니다.
- OpenAI의 경우 캐시 적중 시 `cacheRead`를 기대하고 `cacheWrite`는 `0`으로 유지됩니다. OpenAI는 별도의 캐시 쓰기 토큰 필드를 공개하지 않습니다.
- 요청 추적이 필요한 경우 요청 ID와 속도 제한 헤더를 캐시 메트릭과 별도로 기록하세요. OpenClaw의 현재 캐시 추적 출력은 원시 공급자 응답 헤더가 아니라 프롬프트/세션 형태와 정규화된 토큰 사용량에 초점을 둡니다.

## 빠른 문제 해결

- 대부분의 턴에서 `cacheWrite`가 높음: 변동성이 큰 시스템 프롬프트 입력을 확인하고 모델/공급자가 캐시 설정을 지원하는지 검증하세요.
- Anthropic에서 `cacheWrite`가 높음: 대개 캐시 중단점이 요청마다 변경되는 콘텐츠에 위치한다는 의미입니다.
- OpenAI `cacheRead`가 낮음: 안정 접두사가 앞에 있는지, 반복 접두사가 최소 1024토큰인지, 캐시를 공유해야 하는 턴에 동일한 `prompt_cache_key`가 재사용되는지 확인하세요.
- `cacheRetention`이 효과 없음: 모델 키가 `agents.defaults.models["provider/model"]`와 일치하는지 확인하세요.
- 캐시 설정이 있는 Bedrock Nova/Mistral 요청: 런타임에서 `none`으로 강제되는 것이 예상 동작입니다.

관련 문서:

- [Anthropic](/ko/providers/anthropic)
- [토큰 사용량 및 비용](/ko/reference/token-use)
- [세션 가지치기](/ko/concepts/session-pruning)
- [Gateway 구성 참조](/ko/gateway/configuration-reference)

## 관련

- [토큰 사용량 및 비용](/ko/reference/token-use)
- [API 사용량 및 비용](/ko/reference/api-usage-costs)
