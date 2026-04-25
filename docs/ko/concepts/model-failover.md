---
read_when:
    - 인증 프로필 순환, 쿨다운 또는 모델 대체 동작 진단
    - 인증 프로필 또는 모델의 대체 전환 규칙 업데이트
    - 세션 모델 재정의가 대체 재시도와 상호작용하는 방식 이해
summary: OpenClaw가 인증 프로필을 순환하고 모델 전반에서 대체하는 방식
title: 모델 대체 전환
x-i18n:
    generated_at: "2026-04-25T18:18:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: e128c288ed420874f1b5eb28ecaa4ada66f09152c1b0b73b1d932bf5e86b6dd7
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw는 실패를 두 단계로 처리합니다.

1. 현재 provider 내에서의 **인증 프로필 순환**
2. `agents.defaults.model.fallbacks`의 다음 모델로의 **모델 대체 전환**

이 문서는 런타임 규칙과 이를 뒷받침하는 데이터에 대해 설명합니다.

## 런타임 흐름

일반적인 텍스트 실행에서 OpenClaw는 다음 순서로 후보를 평가합니다.

1. 현재 선택된 세션 모델
2. 순서대로 구성된 `agents.defaults.model.fallbacks`
3. 실행이 재정의에서 시작된 경우, 마지막에 구성된 기본 모델

각 후보 내부에서 OpenClaw는 다음 모델 후보로 넘어가기 전에 인증 프로필 대체 전환을 시도합니다.

상위 수준 시퀀스:

1. 활성 세션 모델과 인증 프로필 선호도를 확인합니다.
2. 모델 후보 체인을 구성합니다.
3. 인증 프로필 순환/쿨다운 규칙과 함께 현재 provider를 시도합니다.
4. 해당 provider가 대체 전환 대상 오류로 모두 소진되면 다음 모델 후보로 이동합니다.
5. 재시도가 시작되기 전에 선택된 대체 재정의를 유지하여, 다른 세션 리더가 러너가 곧 사용할 동일한 provider/모델을 보게 합니다.
6. 대체 후보가 실패하면, 실패한 후보와 여전히 일치하는 경우에만 대체가 소유한 세션 재정의 필드를 롤백합니다.
7. 모든 후보가 실패하면, 각 시도별 상세 정보와 알려진 경우 가장 빠른 쿨다운 만료 시점을 포함한 `FallbackSummaryError`를 발생시킵니다.

이는 의도적으로 "전체 세션 저장 및 복원"보다 더 좁은 범위입니다. 응답 러너는 대체 전환을 위해 자신이 소유한 모델 선택 필드만 유지합니다.

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

이렇게 하면 실패한 대체 재시도가 실행 중에 발생한 수동 `/model` 변경이나 세션 순환 업데이트 같은 더 새로운 관련 없는 세션 변경을 덮어쓰는 일을 방지할 수 있습니다.

## 인증 저장소(키 + OAuth)

OpenClaw는 API 키와 OAuth 토큰 모두에 **인증 프로필**을 사용합니다.

- 시크릿은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 저장됩니다(레거시: `~/.openclaw/agent/auth-profiles.json`).
- 런타임 인증 라우팅 상태는 `~/.openclaw/agents/<agentId>/agent/auth-state.json`에 저장됩니다.
- 구성 `auth.profiles` / `auth.order`는 **메타데이터 + 라우팅 전용**입니다(시크릿 없음).
- 레거시 가져오기 전용 OAuth 파일: `~/.openclaw/credentials/oauth.json`(첫 사용 시 `auth-profiles.json`으로 가져옴)

자세한 내용: [/concepts/oauth](/ko/concepts/oauth)

자격 증명 유형:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ 일부 provider의 경우 `projectId`/`enterpriseUrl`)

## 프로필 ID

OAuth 로그인은 여러 계정이 공존할 수 있도록 고유한 프로필을 생성합니다.

- 기본값: 이메일을 사용할 수 없는 경우 `provider:default`
- 이메일이 있는 OAuth: `provider:<email>` (예: `google-antigravity:user@gmail.com`)

프로필은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`의 `profiles` 아래에 저장됩니다.

## 순환 순서

provider에 여러 프로필이 있는 경우 OpenClaw는 다음과 같이 순서를 선택합니다.

1. **명시적 구성**: `auth.order[provider]`(설정된 경우)
2. **구성된 프로필**: provider별로 필터링된 `auth.profiles`
3. **저장된 프로필**: 해당 provider의 `auth-profiles.json` 항목

명시적 순서가 구성되지 않은 경우, OpenClaw는 라운드 로빈 순서를 사용합니다.

- **기본 키:** 프로필 유형(**API 키보다 OAuth 우선**)
- **보조 키:** `usageStats.lastUsed`(각 유형 내에서 가장 오래된 것 우선)
- **쿨다운/비활성화된 프로필**은 가장 빠른 만료 순으로 정렬되어 끝으로 이동합니다.

### 세션 고정성(캐시 친화적)

OpenClaw는 provider 캐시를 따뜻하게 유지하기 위해 **세션별로 선택된 인증 프로필을 고정**합니다.
모든 요청에서 순환하지는 않습니다. 고정된 프로필은 다음 경우까지 재사용됩니다.

- 세션이 재설정될 때 (`/new` / `/reset`)
- Compaction이 완료될 때(Compaction 횟수 증가)
- 프로필이 쿨다운/비활성 상태일 때

`/model …@<profileId>`를 통한 수동 선택은 해당 세션의 **사용자 재정의**를 설정하며 새 세션이 시작될 때까지 자동 순환되지 않습니다.

자동으로 고정된 프로필(세션 라우터가 선택한 프로필)은 **선호도**로 취급됩니다.
즉, 먼저 시도되지만, 속도 제한/타임아웃 시 OpenClaw가 다른 프로필로 순환할 수 있습니다.
사용자가 고정한 프로필은 해당 프로필에 계속 잠겨 있으며, 실패하고 모델 대체가 구성되어 있으면 OpenClaw는 프로필을 전환하는 대신 다음 모델로 이동합니다.

### OAuth가 "사라진 것처럼 보일" 수 있는 이유

동일한 provider에 OAuth 프로필과 API 키 프로필이 모두 있으면, 고정되지 않은 경우 라운드 로빈으로 인해 메시지 간 전환될 수 있습니다. 하나의 프로필만 강제하려면 다음 중 하나를 사용하세요.

- `auth.order[provider] = ["provider:profileId"]`로 고정하거나
- 세션별 재정의가 지원되는 UI/채팅 화면에서 프로필 재정의를 포함한 `/model …` 세션 재정의를 사용합니다.

## 쿨다운

프로필이 인증/속도 제한 오류(또는 속도 제한처럼 보이는 타임아웃)로 실패하면, OpenClaw는 이를 쿨다운 상태로 표시하고 다음 프로필로 이동합니다.
이 속도 제한 버킷은 단순한 `429`보다 더 넓으며, 다음과 같은 provider 메시지도 포함합니다: `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, 그리고 `weekly/monthly limit reached` 같은 주기적 사용량 제한.
형식/잘못된 요청 오류(예: Cloud Code Assist tool call ID 검증 실패)는 대체 전환 대상 오류로 처리되며 동일한 쿨다운을 사용합니다.
`Unhandled stop reason: error`, `stop reason: error`, `reason: error` 같은 OpenAI 호환 stop-reason 오류는 타임아웃/대체 전환 신호로 분류됩니다.
일반적인 서버 텍스트도 소스가 알려진 일시적 패턴과 일치하면 이 타임아웃 버킷에 포함될 수 있습니다. 예를 들어, 구체적 세부 정보 없이 provider 스트림이 `stopReason: "aborted"` 또는 `stopReason: "error"`로 끝날 때 pi-ai가 이를 내보내므로, pi-ai stream-wrapper의 단순 메시지 `An unknown error occurred`는 모든 provider에 대해 대체 전환 대상 오류로 처리됩니다. `internal server error`, `unknown error, 520`, `upstream error`, `backend error` 같은 일시적 서버 텍스트를 포함한 JSON `api_error` 페이로드도 대체 전환 대상 타임아웃으로 처리됩니다.
OpenRouter 전용의 일반 업스트림 텍스트인 단순 `Provider returned error`는 실제 provider 컨텍스트가 OpenRouter일 때만 타임아웃으로 처리됩니다.
`LLM request failed with an unknown error.` 같은 일반 내부 대체 텍스트는 보수적으로 처리되며, 단독으로는 대체 전환을 유발하지 않습니다.

일부 provider SDK는 OpenClaw에 제어를 반환하기 전에 긴 `Retry-After` 시간 동안 대기할 수 있습니다. Anthropic 및 OpenAI 같은 Stainless 기반 SDK의 경우, OpenClaw는 기본적으로 SDK 내부 `retry-after-ms` / `retry-after` 대기를 60초로 제한하고 더 긴 재시도 가능 응답을 즉시 노출하여 이 대체 전환 경로가 실행되도록 합니다.
이 제한은 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`로 조정하거나 비활성화할 수 있습니다. 자세한 내용은 [/concepts/retry](/ko/concepts/retry)를 참조하세요.

속도 제한 쿨다운은 모델 범위로도 제한될 수 있습니다.

- 실패한 모델 ID를 알 수 있는 경우, OpenClaw는 속도 제한 실패에 대해 `cooldownModel`을 기록합니다.
- 쿨다운이 다른 모델 범위로 제한된 경우, 동일 provider의 형제 모델은 계속 시도할 수 있습니다.
- 청구/비활성화 기간은 여전히 모든 모델에 걸쳐 전체 프로필을 차단합니다.

쿨다운은 지수 백오프를 사용합니다.

- 1분
- 5분
- 25분
- 1시간(상한)

상태는 `auth-state.json`의 `usageStats` 아래에 저장됩니다.

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## 청구 비활성화

청구/크레딧 실패(예: “insufficient credits” / “credit balance too low”)는 대체 전환 대상 오류로 처리되지만, 보통은 일시적이지 않습니다. 짧은 쿨다운 대신, OpenClaw는 프로필을 **비활성화됨**으로 표시하고(더 긴 백오프 사용) 다음 프로필/provider로 순환합니다.

모든 청구 형태의 응답이 `402`인 것은 아니며, 모든 HTTP `402`가 여기에 해당하는 것도 아닙니다.
OpenClaw는 provider가 대신 `401` 또는 `403`을 반환하더라도 명시적인 청구 텍스트를 청구 경로에 유지하지만, provider별 매처는 이를 소유한 provider 범위로 유지됩니다(예: OpenRouter `403 Key limit exceeded`).
한편, 일시적인 `402` 사용량 기간 및 organization/workspace 지출 한도 오류는 메시지가 재시도 가능해 보이면 `rate_limit`으로 분류됩니다(예: `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, `organization spending limit exceeded`).
이러한 경우는 긴 청구 비활성화 경로 대신 짧은 쿨다운/대체 전환 경로에 남습니다.

상태는 `auth-state.json`에 저장됩니다.

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

기본값:

- 청구 백오프는 **5시간**부터 시작해 청구 실패마다 두 배가 되며 **24시간**에서 상한에 도달합니다.
- 프로필이 **24시간** 동안 실패하지 않으면 백오프 카운터가 재설정됩니다(구성 가능).
- 과부하 재시도는 모델 대체 전환 전에 **동일 provider 프로필 순환 1회**를 허용합니다.
- 과부하 재시도는 기본적으로 **0ms 백오프**를 사용합니다.

## 모델 대체 전환

provider의 모든 프로필이 실패하면, OpenClaw는 `agents.defaults.model.fallbacks`의 다음 모델로 이동합니다. 이는 인증 실패, 속도 제한, 그리고 프로필 순환을 모두 소진한 타임아웃에 적용됩니다(다른 오류는 대체 전환을 진행하지 않음).

과부하 및 속도 제한 오류는 청구 쿨다운보다 더 공격적으로 처리됩니다. 기본적으로 OpenClaw는 동일 provider 인증 프로필 재시도 1회를 허용한 뒤, 기다리지 않고 다음으로 구성된 모델 대체로 전환합니다.
`ModelNotReadyException` 같은 provider 바쁨 신호는 이 과부하 버킷에 포함됩니다.
이는 `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, `auth.cooldowns.rateLimitedProfileRotations`로 조정할 수 있습니다.

실행이 모델 재정의(hooks 또는 CLI)로 시작된 경우에도, 구성된 대체를 시도한 뒤 최종적으로 `agents.defaults.model.primary`에서 끝납니다.

### 후보 체인 규칙

OpenClaw는 현재 요청된 `provider/model`과 구성된 대체를 기반으로 후보 목록을 구성합니다.

규칙:

- 요청된 모델은 항상 첫 번째입니다.
- 명시적으로 구성된 대체는 중복 제거되지만 모델 허용 목록으로 필터링되지는 않습니다. 이는 명시적인 운영자 의도로 취급됩니다.
- 현재 실행이 동일 provider 계열의 구성된 대체 중 하나에서 이미 실행 중이라면, OpenClaw는 계속 전체 구성 체인을 사용합니다.
- 현재 실행이 구성과 다른 provider에서 실행 중이고, 그 현재 모델이 이미 구성된 대체 체인의 일부가 아니라면, OpenClaw는 다른 provider의 관련 없는 구성 대체를 추가하지 않습니다.
- 실행이 재정의에서 시작된 경우, 앞선 후보가 모두 소진되면 체인이 다시 일반 기본값으로 정착할 수 있도록 구성된 기본 모델이 끝에 추가됩니다.

### 어떤 오류가 대체 전환을 진행시키는가

모델 대체 전환은 다음 경우 계속 진행됩니다.

- 인증 실패
- 속도 제한 및 쿨다운 소진
- 과부하/provider 바쁨 오류
- 타임아웃 형태의 대체 전환 오류
- 청구 비활성화
- `LiveSessionModelSwitchError`: 오래된 유지 모델이 외부 재시도 루프를 만들지 않도록 대체 전환 경로로 정규화됨
- 남은 후보가 아직 있을 때의 기타 인식되지 않은 오류

모델 대체 전환은 다음 경우 계속되지 않습니다.

- 타임아웃/대체 전환 형태가 아닌 명시적 중단
- Compaction/재시도 로직 내부에 머물러야 하는 컨텍스트 초과 오류
  (예: `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model`, 또는 `ollama error: context
length exceeded`)
- 남은 후보가 없을 때의 최종 알 수 없는 오류

### 쿨다운 건너뛰기 vs 프로브 동작

provider의 모든 인증 프로필이 이미 쿨다운 상태일 때, OpenClaw는 해당 provider를 자동으로 영구 건너뛰지 않습니다. 대신 후보별 결정을 내립니다.

- 지속적인 인증 실패는 전체 provider를 즉시 건너뜁니다.
- 청구 비활성화는 보통 건너뛰지만, 기본 후보는 여전히 제한적으로 프로브될 수 있어 재시작 없이 복구가 가능할 수 있습니다.
- 기본 후보는 provider별 제한과 함께 쿨다운 만료 시점 근처에서 프로브될 수 있습니다.
- 동일 provider의 대체 형제 모델은 실패가 일시적인 것으로 보일 때(`rate_limit`, `overloaded`, 또는 unknown) 쿨다운 중에도 시도될 수 있습니다. 이는 속도 제한이 모델 범위일 수 있고 형제 모델이 즉시 복구될 수 있는 경우에 특히 중요합니다.
- 일시적 쿨다운 프로브는 대체 실행당 provider별 1회로 제한되므로, 단일 provider가 교차-provider 대체 전환을 지연시키지 않습니다.

## 세션 재정의와 라이브 모델 전환

세션 모델 변경은 공유 상태입니다. 활성 러너, `/model` 명령, Compaction/세션 업데이트, 라이브 세션 조정은 모두 동일한 세션 항목의 일부를 읽거나 씁니다.

즉, 대체 재시도는 라이브 모델 전환과 조정되어야 합니다.

- 보류 중인 라이브 전환으로 표시되는 것은 명시적인 사용자 주도 모델 변경뿐입니다. 여기에는 `/model`, `session_status(model=...)`, `sessions.patch`가 포함됩니다.
- 대체 순환, Heartbeat 재정의, Compaction 같은 시스템 주도 모델 변경은 그 자체로는 보류 중인 라이브 전환으로 표시되지 않습니다.
- 대체 재시도가 시작되기 전에, 응답 러너는 선택된 대체 재정의 필드를 세션 항목에 유지합니다.
- 라이브 세션 조정은 오래된 런타임 모델 필드보다 유지된 세션 재정의를 우선합니다.
- 대체 시도가 실패하면, 러너는 자신이 쓴 재정의 필드만 롤백하며, 그 필드가 여전히 해당 실패 후보와 일치할 때만 롤백합니다.

이렇게 하면 고전적인 경쟁 상태를 방지할 수 있습니다.

1. 기본 모델이 실패합니다.
2. 메모리에서 대체 후보가 선택됩니다.
3. 세션 저장소에는 여전히 이전 기본 모델이 남아 있습니다.
4. 라이브 세션 조정이 오래된 세션 상태를 읽습니다.
5. 대체 시도가 시작되기 전에 재시도가 이전 모델로 되돌아갑니다.

유지된 대체 재정의는 이 간격을 닫아 주며, 좁은 범위의 롤백은 더 새로운 수동 또는 런타임 세션 변경을 그대로 유지합니다.

## 관찰 가능성 및 실패 요약

`runWithModelFallback(...)`는 로그와 사용자 대상 쿨다운 메시지에 사용되는 시도별 세부 정보를 기록합니다.

- 시도한 provider/model
- 사유(`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` 및 유사한 대체 전환 사유)
- 선택적 status/code
- 사람이 읽을 수 있는 오류 요약

모든 후보가 실패하면 OpenClaw는 `FallbackSummaryError`를 발생시킵니다. 외부 응답 러너는 이를 사용해 "모든 모델이 일시적으로 속도 제한 상태입니다"와 같은 더 구체적인 메시지를 만들고, 알려진 경우 가장 빠른 쿨다운 만료 시점을 포함할 수 있습니다.

이 쿨다운 요약은 모델을 인식합니다.

- 시도된 provider/model 체인과 무관한 모델 범위 속도 제한은 무시됩니다.
- 남아 있는 차단이 일치하는 모델 범위 속도 제한이면, OpenClaw는 해당 모델을 계속 차단하는 마지막 일치 만료 시점을 보고합니다.

## 관련 구성

다음 항목은 [Gateway configuration](/ko/gateway/configuration)을 참조하세요.

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 라우팅

더 넓은 모델 선택 및 대체 전환 개요는 [Models](/ko/concepts/models)를 참조하세요.
