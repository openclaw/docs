---
read_when:
    - 캐시 유지를 통해 프롬프트 토큰 비용을 절감하려고 합니다
    - 멀티 에이전트 설정에서는 에이전트별 캐시 동작이 필요합니다.
    - Heartbeat와 캐시 TTL 정리를 함께 조정하고 있습니다
summary: 프롬프트 캐싱 설정, 병합 순서, 제공자 동작 및 튜닝 패턴
title: 프롬프트 캐싱
x-i18n:
    generated_at: "2026-07-16T13:04:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59a5aefc4d4139c31461b81f164b9efa9a4c1c48d03146049cf447b9dfd6ea99
    source_path: reference/prompt-caching.md
    workflow: 16
---

프롬프트 캐싱을 사용하면 모델 제공자가 변경되지 않은 프롬프트 접두사(시스템/개발자 지침, 도구 정의, 기타 안정적인 컨텍스트)를 매 요청마다 다시 처리하는 대신 여러 턴에 걸쳐 재사용할 수 있습니다. 이를 통해 반복되는 컨텍스트가 있는 장기 실행 세션의 토큰 비용과 지연 시간이 줄어듭니다.

OpenClaw는 업스트림 API가 해당 카운터를 제공하는 모든 곳에서 제공자 사용량을 `cacheRead` 및 `cacheWrite`(으)로 정규화합니다. 실시간 세션 스냅샷에 캐시 카운터가 없으면 사용량 요약(`/status` 및 유사 항목)은 마지막 트랜스크립트 사용량 항목을 대체 값으로 사용하며, 0이 아닌 실시간 값이 있으면 항상 대체 값보다 우선합니다.

제공자 참고 자료:

- [Anthropic 프롬프트 캐싱](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI 프롬프트 캐싱](https://developers.openai.com/api/docs/guides/prompt-caching)

## 주요 설정

### `cacheRetention`

값: `"none" | "short" | "long"`. 전역 기본값, 모델별, 에이전트별로 구성할 수 있습니다.
`"standard"`은(는) 별칭이 아닙니다. 제공자의 기본 캐시 기간을 사용하려면 `"short"`을(를) 사용하십시오. 유효하지 않은 값은 경고와 함께 무시됩니다.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # 이 모델에 대한 전역 기본값을 재정의합니다
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # 이 에이전트에 대해 두 기본값을 모두 재정의합니다
```

병합 순서(뒤의 항목이 우선):

1. `agents.defaults.params` - 모든 모델의 전역 기본값
2. `agents.defaults.models["provider/model"].params` - 모델별 재정의
3. `agents.list[].params` - 에이전트 ID로 일치시키는 에이전트별 재정의

출처: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

캐시 TTL 기간이 지나면 오래된 도구 결과 컨텍스트를 정리하여, 유휴 상태 이후의 요청이 지나치게 큰 기록을 다시 캐싱하지 않도록 합니다.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

전체 동작은 [세션 정리](/ko/concepts/session-pruning)를 참조하십시오.

### Heartbeat 캐시 유지

Heartbeat는 캐시 기간을 활성 상태로 유지하고 유휴 간격 이후 반복되는 캐시 쓰기를 줄일 수 있습니다. 전역(`agents.defaults.heartbeat`) 또는 에이전트별(`agents.list[].heartbeat`)로 구성할 수 있습니다.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## 제공자 동작

### Anthropic(직접 API 및 Vertex AI)

- `cacheRetention`은(는) `anthropic` 및 `anthropic-vertex` 제공자에서 지원되며, `cacheRetention`이(가) 명시적으로 설정된 경우 `amazon-bedrock` 및 사용자 지정 `anthropic-messages` 호환 엔드포인트의 Claude 모델에서도 지원됩니다.
- 설정되지 않은 경우 OpenClaw는 직접 Anthropic에 대해 `cacheRetention: "short"`을(를) 초기값으로 설정합니다(`anthropic` 및 `anthropic-vertex` 제공자만 해당하며, 다른 Anthropic 계열 경로에는 명시적 값이 필요합니다).
- 네이티브 Anthropic Messages 응답은 `cache_read_input_tokens` 및 `cache_creation_input_tokens`을(를) 제공하며, 각각 `cacheRead` 및 `cacheWrite`(으)로 매핑됩니다.
- `cacheRetention: "short"`은(는) 기본 5분 임시 캐시로 매핑됩니다. `cacheRetention: "long"`을(를) 명시적으로 설정하면 1시간 TTL(`cache_control: { type: "ephemeral", ttl: "1h" }`)을 요청합니다. 명시적 `cacheRetention` 없이 암시적/환경 변수 기반의 장기 보존(`OPENCLAW_CACHE_RETENTION=long`)을 사용하면 `api.anthropic.com` 또는 Vertex AI(`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`) 호스트에서만 1시간 TTL로 상향되며, 다른 호스트에서는 5분 캐시를 유지합니다.

출처: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI(직접 API)

- 지원되는 최신 모델에서는 프롬프트 캐싱이 자동으로 이루어지며, OpenClaw는 블록 수준 캐시 마커를 삽입하지 않습니다.
- OpenClaw는 여러 턴에 걸쳐 캐시 라우팅을 안정적으로 유지하기 위해 `prompt_cache_key`을(를) 전송합니다. 직접 `api.openai.com` 호스트에는 이 값이 자동으로 적용됩니다. OpenAI 호환 프록시(oMLX, llama.cpp, 사용자 지정 엔드포인트)는 이를 사용하도록 설정하려면 모델 구성에 `compat.supportsPromptCacheKey: true`이(가) 필요하며, 프록시에서는 절대 자동 감지되지 않습니다.
- `prompt_cache_retention: "24h"`은(는) `cacheRetention: "long"`이(가) 선택되고 확인된 엔드포인트가 캐시 키와 장기 보존을 모두 지원할 때만 추가됩니다(`compat.supportsLongCacheRetention`, 기본값은 true이며 Together AI 및 Cloudflare 호환 프로필에서는 비활성화됨). `cacheRetention: "none"`은(는) 두 필드를 모두 억제합니다.
- 캐시 적중은 `usage.prompt_tokens_details.cached_tokens`(Chat Completions) 또는 `input_tokens_details.cached_tokens`(Responses API)을 통해 표시되며, `cacheRead`(으)로 매핑됩니다.
- Responses API 페이로드는 `input_tokens_details.cache_write_tokens`도 제공할 수 있으며, 이는 `cacheWrite`(으)로 매핑되고 모델의 캐시 쓰기 요율로 가격이 책정됩니다. 해당 필드를 생략한 Responses 페이로드에서는 `cacheWrite`이(가) `0`으로 유지됩니다. OpenAI의 Chat Completions API는 `cache_write_tokens` 카운터를 문서화하거나 제공하지 않지만, OpenClaw는 별도의 쓰기 횟수를 보고하는 OpenRouter 호환 및 DeepSeek 방식 프록시를 위해 해당 위치에서 `prompt_tokens_details.cache_write_tokens`을(를) 계속 읽습니다.
- 실제로 OpenAI는 Anthropic의 이동식 전체 기록 재사용보다 초기 접두사 캐시에 더 가깝게 동작합니다. 아래의 [OpenAI 실시간 동작 예상](#openai-live-expectations)을 참조하십시오.

### Amazon Bedrock

- Anthropic Claude 모델 참조(`amazon-bedrock/*anthropic.claude*` 및 AWS 시스템 추론 프로필 접두사 `us.`/`eu.`/`global.anthropic.claude*`)는 명시적 `cacheRetention` 전달을 지원합니다.
- Anthropic 이외의 Bedrock 모델(예: `amazon.nova-*`)은 구성된 `cacheRetention` 값과 관계없이 런타임에서 캐시 보존 없음으로 확인됩니다.
- 불투명한 Bedrock 애플리케이션 추론 프로필 ARN(`claude`을(를) 포함하지 않는 프로필 ID)도 ARN만으로는 모델 계열을 추론할 수 없으므로, `cacheRetention`을(를) 명시적으로 설정하지 않는 한 캐시 보존 없음으로 확인됩니다.

### OpenRouter

`openrouter/anthropic/*` 모델 참조의 경우 OpenClaw는 시스템/개발자 프롬프트 블록에 Anthropic `cache_control` 마커를 삽입하지만, 요청이 확인된 OpenRouter 경로(기본 엔드포인트의 `openrouter` 또는 `openrouter.ai`(으)로 확인되는 제공자/기본 URL)를 계속 대상으로 하는 경우에만 적용합니다. 모델이 임의의 OpenAI 호환 프록시 URL을 가리키도록 변경하면 이 삽입이 중지됩니다.

`contextPruning.mode: "cache-ttl"`은(는) `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*`, `openrouter/zai/*` 모델 참조에 허용됩니다. 이러한 경로는 OpenClaw가 마커를 삽입하지 않아도 제공자 측 프롬프트 캐싱을 처리하기 때문입니다.

출처: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

OpenRouter에서 DeepSeek 캐시 구성은 최선형으로 수행되며 몇 초가 걸릴 수 있습니다. 바로 이어지는 요청에는 여전히 `cached_tokens: 0`이(가) 표시될 수 있습니다. 잠시 기다린 후 동일한 접두사를 사용하여 요청을 반복하고, `usage.prompt_tokens_details.cached_tokens`을(를) 캐시 적중 신호로 사용하여 확인하십시오.

### Google Gemini(직접 API)

- 직접 Gemini 전송(`api: "google-generative-ai"`)은 업스트림 `cachedContentTokenCount`을(를) 통해 캐시 적중을 보고하며, 이는 `cacheRead`(으)로 매핑됩니다.
- 대상 모델 계열: `gemini-2.5*` 및 `gemini-3*`(해당 접두사와 일치하지 않는 Live/미리 보기 변형은 제외하며, 예를 들어 `gemini-live-2.5-flash-preview`은 제외됨).
- 대상 모델에 `cacheRetention`이(가) 설정되면 OpenClaw가 시스템 프롬프트용 `cachedContents` 리소스를 자동으로 생성, 재사용 및 갱신하므로 수동 캐시 콘텐츠 핸들이 필요하지 않습니다. TTL은 `cacheRetention: "short"`의 경우 `300s`, `"long"`의 경우 `3600s`입니다.
- 기존 Gemini 캐시 콘텐츠 핸들을 `params.cachedContent`(또는 레거시 `params.cached_content`)으로 계속 전달할 수 있습니다. 명시적 핸들을 사용하면 자동 캐시 관리 경로를 완전히 건너뜁니다.
- 이는 Anthropic/OpenAI 프롬프트 접두사 캐싱과 별개입니다. OpenClaw는 인라인 캐시 마커를 삽입하는 대신 Gemini용 제공자 네이티브 `cachedContents` 리소스를 관리합니다.

출처: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### CLI 하네스 제공자(Claude Code, Gemini CLI)

JSONL 사용량 이벤트(`jsonlDialect: "claude-stream-json"` 또는 `"gemini-stream-json"`)를 출력하는 CLI 백엔드는 여러 필드 이름 변형을 인식하는 공유 사용량 파서를 거칩니다. 여기에는 `cacheRead`(으)로 매핑되는 일반 `cached` 카운터도 포함됩니다. CLI의 JSON 페이로드에 직접 입력 토큰 필드가 없으면 OpenClaw는 이를 `input_tokens - cached`(으)로 계산합니다. 이는 사용량 정규화만 수행하며, 이러한 CLI 기반 모델에 Anthropic/OpenAI 방식의 프롬프트 캐시 마커를 생성하지는 않습니다.

출처: `src/agents/cli-output.ts` (`toCliUsage`).

### 기타 제공자

제공자가 위 캐시 모드 중 어느 것도 지원하지 않으면 `cacheRetention`은(는) 아무 효과가 없습니다.

## 시스템 프롬프트 캐시 경계

OpenClaw는 내부 캐시 접두사 경계에서 시스템 프롬프트를 **안정적인 접두사**와 **가변적인 접미사**로 분할합니다. 경계 위의 콘텐츠(도구 정의, Skills 메타데이터, 작업 공간 파일)는 여러 턴에 걸쳐 바이트 단위로 동일하게 유지되도록 정렬됩니다. 경계 아래의 콘텐츠(예: `HEARTBEAT.md`, 런타임 타임스탬프, 기타 턴별 메타데이터)는 캐시된 접두사를 무효화하지 않고 변경될 수 있습니다.

주요 설계 결정:

- 안정적인 작업 공간 프로젝트 컨텍스트 파일은 Heartbeat 변동으로 인해 안정적인 접두사가 무효화되지 않도록 `HEARTBEAT.md` 앞에 배치됩니다.
- 이 경계는 Anthropic 계열, OpenAI 계열, Google 및 CLI 전송 구성 전체에 적용되므로 지원되는 모든 제공자가 동일한 접두사 안정성의 이점을 얻습니다.
- Codex Responses 및 Anthropic Vertex 요청은 경계를 인식하는 캐시 구성을 통해 라우팅되므로, 캐시 재사용이 제공자에게 실제로 전달되는 내용과 일치합니다.
- 시스템 프롬프트 지문은 정규화되므로(공백, 줄바꿈, 훅이 추가한 컨텍스트, 런타임 기능 순서) 의미상 변경되지 않은 프롬프트는 여러 턴에 걸쳐 캐시를 공유합니다.

구성 또는 작업 공간 변경 후 예상치 못한 `cacheWrite` 급증이 발생하면 변경 사항이 캐시 경계 위와 아래 중 어디에 배치되는지 확인하십시오. 가변 콘텐츠를 경계 아래로 옮기거나 안정화하면 일반적으로 문제가 해결됩니다.

## OpenClaw 캐시 안정성 보호 장치

- 번들 MCP 도구 카탈로그는 도구 등록 전에 결정론적으로 정렬되므로(서버 이름, 그다음 도구 이름 순), `listTools()` 순서 변경으로 도구 블록이 변동하여 프롬프트 캐시 접두사가 무효화되지 않습니다.
- 이미지 블록이 영구 저장된 레거시 세션은 **가장 최근에 완료된 턴 3개**를 그대로 유지합니다(이미지가 포함된 턴뿐 아니라 완료된 모든 턴을 계산). 이전에 이미 처리된 오래된 이미지 블록은 텍스트 마커로 대체되므로, 이미지가 많은 후속 요청에서 크고 오래된 페이로드를 계속 다시 전송하지 않습니다.

## 조정 패턴

### 혼합 트래픽(권장 기본값)

주 에이전트에서는 장기 기준선을 유지하고, 버스트성 알림 에이전트에서는 캐싱을 비활성화하십시오.

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

- 기준선 `cacheRetention: "short"`을(를) 설정하십시오.
- `contextPruning.mode: "cache-ttl"`을(를) 활성화하십시오.
- 웜 캐시의 이점을 얻는 에이전트에 한해서만 Heartbeat 간격을 TTL보다 짧게 유지하십시오.

## 실시간 회귀 테스트

OpenClaw는 반복되는 접두사, 도구 턴, 이미지 턴, MCP 방식 도구 트랜스크립트 및 Anthropic 캐시 비활성화 대조군을 다루는 하나의 통합 실시간 캐시 회귀 게이트를 실행합니다.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

다음 명령으로 실행하십시오.

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

기준 파일에는 가장 최근에 관찰된 라이브 수치와 테스트에서 확인하는 공급자별 회귀 하한이 저장됩니다. 각 실행에서는 실행별로 새로운 세션 ID와 프롬프트 네임스페이스를 사용하므로 이전 캐시 상태가 현재 샘플을 오염시키지 않습니다. Anthropic과 OpenAI는 서로 다른 방식으로 적용됩니다. Anthropic에서 하한에 미달하면 심각한 회귀로 간주되어 테스트가 실패하지만, OpenAI에서 하한에 미달하면 모니터링만 수행되어 경고로 기록되고 실행은 실패하지 않습니다. 두 공급자에 공통으로 적용되는 단일 임계값은 없습니다.

### Anthropic 라이브 예상 동작

- `cacheWrite`을 통한 명시적인 워밍업 쓰기가 예상됩니다.
- Anthropic의 캐시 제어가 대화가 진행됨에 따라 캐시 중단점을 이동시키므로, 반복 턴에서 거의 전체 기록이 재사용될 것으로 예상됩니다.
- 안정, 도구, 이미지 및 MCP 스타일 레인의 기준 하한은 엄격한 회귀 게이트입니다.

### OpenAI 라이브 예상 동작

- `cacheRead`만 예상됩니다. Chat Completions에서는 `cacheWrite`이 `0`으로 유지됩니다.
- 반복 턴의 캐시 재사용을 Anthropic 방식의 이동하는 전체 기록 재사용이 아니라 공급자별 정체 구간으로 취급합니다.
- 하한은 모니터링 전용이며, 미달 시 테스트 실패가 아니라 경고로 기록됩니다. 다음 `gpt-5.4-mini`에서 관찰된 라이브 동작을 기반으로 합니다.

| 시나리오             | `cacheRead` 하한 | 적중률 하한 |
| -------------------- | ----------------: | -------------: |
| 안정적인 접두사        |             4,608 |           0.90 |
| 도구 트랜스크립트      |             4,096 |           0.85 |
| 이미지 트랜스크립트     |             3,840 |           0.82 |
| MCP 스타일 트랜스크립트 |             4,096 |           0.85 |

가장 최근에 관찰된 기준 수치(`live-cache-regression-baseline.ts` 기준)는 다음과 같습니다. 안정적인 접두사 `cacheRead=4864`, 적중률 `0.966`; 도구 트랜스크립트 `cacheRead=4608`, 적중률 `0.896`; 이미지 트랜스크립트 `cacheRead=4864`, 적중률 `0.954`; MCP 스타일 트랜스크립트 `cacheRead=4608`, 적중률 `0.891`.

검증 조건이 다른 이유는 Anthropic은 명시적인 캐시 중단점과 이동하는 대화 기록 재사용을 제공하지만, 라이브 트래픽에서 OpenAI가 실제로 재사용할 수 있는 접두사는 전체 프롬프트보다 일찍 정체될 수 있기 때문입니다. 두 공급자를 공급자 공통의 단일 백분율 임계값과 비교하면 잘못된 회귀가 발생합니다.

## `diagnostics.cacheTrace` 구성

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

| 키               | 기본값                                      |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### 환경 변수 토글(일회성 디버깅)

| 변수                             | 효과                               |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | 캐시 추적을 활성화합니다                |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | 출력 경로를 재정의합니다                |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | 전체 메시지 페이로드 캡처를 전환합니다 |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | 프롬프트 텍스트 캡처를 전환합니다          |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | 시스템 프롬프트 캡처를 전환합니다          |

### 검사할 항목

- 캐시 추적 이벤트는 `session:loaded`, `prompt:before`, `stream:context`, `session:after` 같은 단계별 스냅샷을 포함하는 JSONL입니다.
- 턴별 캐시 토큰 영향은 일반 사용량 화면에서 확인할 수 있습니다. `cacheRead` 및 `cacheWrite`은 `/usage tokens`, `/status`, 세션 사용량 요약 및 사용자 지정 `messages.usageTemplate` 레이아웃에 표시됩니다.
- Anthropic에서는 캐싱이 활성화된 경우 `cacheRead`과 `cacheWrite`이 모두 나타날 것으로 예상됩니다.
- OpenAI에서는 캐시 적중 시 `cacheRead`이 나타날 것으로 예상됩니다. `cacheWrite`은 해당 항목을 포함하는 Responses API 페이로드에서만 채워집니다(위의 [OpenAI](#openai-direct-api) 참조).
- OpenAI는 `x-request-id`, `openai-processing-ms`, `x-ratelimit-*` 같은 추적 및 사용률 제한 헤더도 반환합니다. 요청 추적에는 이 헤더를 사용하되, 캐시 적중 계산은 여전히 헤더가 아닌 사용량 페이로드를 기반으로 해야 합니다.

## 빠른 문제 해결

- **대부분의 턴에서 `cacheWrite`이 높음**: 변동성이 큰 시스템 프롬프트 입력이 있는지 확인하고, 모델/공급자가 사용 중인 캐시 설정을 지원하는지 확인하십시오.
- **Anthropic에서 `cacheWrite`이 높음**: 캐시 중단점이 요청마다 변경되는 콘텐츠에 배치되었음을 의미하는 경우가 많습니다.
- **OpenAI `cacheRead`이 낮음**: 안정적인 접두사가 맨 앞에 있고, 반복되는 접두사가 1024토큰 이상이며, 캐시를 공유해야 하는 턴에서 동일한 `prompt_cache_key`이 재사용되는지 확인하십시오.
- **`cacheRetention`의 효과가 없음**: 모델 키가 `agents.defaults.models["provider/model"]`과 일치하는지 확인하십시오.
- **캐시 설정이 포함된 Bedrock Nova 요청**: 예상된 동작입니다. 런타임에서 캐시를 유지하지 않는 방식으로 해석됩니다.

관련 문서:

- [Anthropic](/ko/providers/anthropic)
- [토큰 사용량 및 비용](/ko/reference/token-use)
- [세션 정리](/ko/concepts/session-pruning)
- [Gateway 구성 참조](/ko/gateway/configuration-reference)

## 관련 항목

- [토큰 사용량 및 비용](/ko/reference/token-use)
- [API 사용량 및 비용](/ko/reference/api-usage-costs)
