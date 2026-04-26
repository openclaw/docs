---
read_when:
    - auth profile 순환, 쿨다운 또는 모델 폴백 동작 진단하기
    - auth profile 또는 모델의 페일오버 규칙 업데이트하기
    - 세션 모델 재정의가 폴백 재시도와 어떻게 상호작용하는지 이해하기
sidebarTitle: Model failover
summary: OpenClaw가 auth profile을 순환하고 모델 전반에서 폴백하는 방식
title: 모델 페일오버
x-i18n:
    generated_at: "2026-04-26T11:27:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e681a456f75073bb34e7af94234efeee57c6c25e9414da19eb9527ccba5444a
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw는 실패를 두 단계로 처리합니다.

1. 현재 provider 내에서의 **auth profile 순환**
2. `agents.defaults.model.fallbacks`의 다음 모델로의 **모델 폴백**

이 문서는 런타임 규칙과 이를 뒷받침하는 데이터를 설명합니다.

## 런타임 흐름

일반적인 텍스트 실행에서 OpenClaw는 다음 순서로 후보를 평가합니다.

<Steps>
  <Step title="세션 상태 해석">
    활성 세션 모델과 auth profile 선호를 해석합니다.
  </Step>
  <Step title="후보 체인 구축">
    현재 선택된 세션 모델에서 시작해 모델 후보 체인을 만들고, 그다음 `agents.defaults.model.fallbacks`를 순서대로 추가하며, 실행이 재정의에서 시작된 경우 마지막에 구성된 primary로 끝냅니다.
  </Step>
  <Step title="현재 provider 시도">
    auth profile 순환/쿨다운 규칙을 적용해 현재 provider를 시도합니다.
  </Step>
  <Step title="페일오버할 만한 오류에서 다음으로 진행">
    해당 provider가 페일오버할 만한 오류로 소진되면 다음 모델 후보로 이동합니다.
  </Step>
  <Step title="폴백 재정의 지속 저장">
    재시도가 시작되기 전에 선택된 폴백 재정의를 저장하여 다른 세션 판독기가 실행기가 곧 사용할 동일한 provider/model을 보도록 합니다.
  </Step>
  <Step title="실패 시 제한적으로 롤백">
    폴백 후보가 실패하면, 아직 그 실패한 후보와 일치할 때에만 폴백이 소유한 세션 재정의 필드만 롤백합니다.
  </Step>
  <Step title="모두 소진되면 FallbackSummaryError 발생">
    모든 후보가 실패하면 시도별 세부 정보와, 알 수 있는 경우 가장 빠른 쿨다운 만료 시점을 포함한 `FallbackSummaryError`를 발생시킵니다.
  </Step>
</Steps>

이는 의도적으로 "전체 세션 저장 및 복원"보다 더 좁은 범위입니다. 응답 실행기는 폴백을 위해 자신이 소유한 모델 선택 필드만 저장합니다.

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

이렇게 하면 실패한 폴백 재시도가 실행 중 발생한 수동 `/model` 변경 또는 세션 순환 업데이트 같은 더 새로운 무관한 세션 변경을 덮어쓰지 않게 됩니다.

## 인증 저장소(키 + OAuth)

OpenClaw는 API 키와 OAuth 토큰 모두에 대해 **auth profile**을 사용합니다.

- 비밀 정보는 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 저장됩니다(레거시: `~/.openclaw/agent/auth-profiles.json`).
- 런타임 auth 라우팅 상태는 `~/.openclaw/agents/<agentId>/agent/auth-state.json`에 저장됩니다.
- Config의 `auth.profiles` / `auth.order`는 **메타데이터 + 라우팅 전용**입니다(비밀 정보 없음).
- 레거시 가져오기 전용 OAuth 파일: `~/.openclaw/credentials/oauth.json`(첫 사용 시 `auth-profiles.json`으로 가져옴).

자세한 내용: [OAuth](/ko/concepts/oauth)

자격 증명 유형:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ 일부 provider의 경우 `projectId`/`enterpriseUrl`)

## Profile ID

OAuth 로그인은 여러 계정이 공존할 수 있도록 고유한 profile을 생성합니다.

- 기본값: 이메일을 알 수 없을 때 `provider:default`
- 이메일이 있는 OAuth: `provider:<email>` (예: `google-antigravity:user@gmail.com`)

profile은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`의 `profiles` 아래에 저장됩니다.

## 순환 순서

하나의 provider에 여러 profile이 있을 때 OpenClaw는 다음과 같이 순서를 결정합니다.

<Steps>
  <Step title="명시적 config">
    `auth.order[provider]` (설정된 경우)
  </Step>
  <Step title="구성된 profile">
    provider로 필터링된 `auth.profiles`
  </Step>
  <Step title="저장된 profile">
    해당 provider에 대한 `auth-profiles.json` 항목
  </Step>
</Steps>

명시적 순서가 구성되지 않은 경우 OpenClaw는 라운드 로빈 순서를 사용합니다.

- **기본 키:** profile 유형(**API 키보다 OAuth 우선**)
- **보조 키:** `usageStats.lastUsed` (각 유형 내에서 가장 오래된 것 우선)
- **쿨다운/비활성화된 profile**은 가장 빠른 만료 순으로 끝으로 이동합니다.

### 세션 고정성(캐시 친화적)

OpenClaw는 provider 캐시를 따뜻하게 유지하기 위해 **세션별로 선택된 auth profile을 고정**합니다. 요청마다 순환하지는 않습니다. 고정된 profile은 다음 경우까지 재사용됩니다.

- 세션이 재설정될 때 (`/new` / `/reset`)
- Compaction이 완료될 때(compaction count 증가)
- profile이 쿨다운/비활성화 상태일 때

`/model …@<profileId>`를 통한 수동 선택은 해당 세션에 대한 **사용자 재정의**를 설정하며, 새 세션이 시작될 때까지 자동 순환되지 않습니다.

<Note>
자동으로 고정된 profile(세션 라우터가 선택한 것)은 **선호**로 취급됩니다. 즉, 먼저 시도되지만 rate limit/timeout이 발생하면 OpenClaw가 다른 profile로 순환할 수 있습니다. 사용자 고정 profile은 해당 profile에 잠겨 있으며, 실패하고 모델 폴백이 구성되어 있으면 profile을 바꾸는 대신 다음 모델로 이동합니다.
</Note>

### OAuth가 "사라진 것처럼" 보일 수 있는 이유

같은 provider에 대해 OAuth profile과 API 키 profile이 둘 다 있는 경우, 고정되지 않았다면 라운드 로빈으로 메시지 간에 둘 사이를 오갈 수 있습니다. 하나의 profile만 강제하려면:

- `auth.order[provider] = ["provider:profileId"]`로 고정하거나
- `/model …`에서 profile 재정의와 함께 세션별 재정의를 사용하세요(UI/채팅 표면이 지원하는 경우)

## 쿨다운

profile이 인증/rate-limit 오류(또는 rate limiting처럼 보이는 timeout)로 실패하면 OpenClaw는 해당 profile을 쿨다운 상태로 표시하고 다음 profile로 이동합니다.

<AccordionGroup>
  <Accordion title="rate-limit / timeout 버킷에 들어가는 항목">
    이 rate-limit 버킷은 단순한 `429`보다 더 넓습니다. `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, `weekly/monthly limit reached` 같은 provider 메시지도 포함됩니다.

    형식/잘못된 요청 오류(예: Cloud Code Assist tool call ID 검증 실패)도 페일오버할 만한 것으로 처리되며 같은 쿨다운을 사용합니다. `Unhandled stop reason: error`, `stop reason: error`, `reason: error` 같은 OpenAI 호환 stop-reason 오류도 timeout/페일오버 신호로 분류됩니다.

    일반 서버 텍스트도 소스가 알려진 일시적 패턴과 일치하면 이 timeout 버킷에 들어갈 수 있습니다. 예를 들어, 단순한 pi-ai stream-wrapper 메시지 `An unknown error occurred`는 provider 스트림이 구체적인 세부 정보 없이 `stopReason: "aborted"` 또는 `stopReason: "error"`로 끝날 때 pi-ai가 이를 내보내므로, 모든 provider에 대해 페일오버할 만한 것으로 처리됩니다. `internal server error`, `unknown error, 520`, `upstream error`, `backend error` 같은 일시적 서버 텍스트를 포함한 JSON `api_error` payload도 페일오버할 만한 timeout으로 처리됩니다.

    OpenRouter 전용 일반 업스트림 텍스트인 단순 `Provider returned error`는 provider 컨텍스트가 실제로 OpenRouter일 때만 timeout으로 처리됩니다. `LLM request failed with an unknown error.` 같은 일반 내부 폴백 텍스트는 보수적으로 유지되며, 그 자체만으로 페일오버를 유발하지 않습니다.

  </Accordion>
  <Accordion title="SDK retry-after 상한">
    일부 provider SDK는 제어를 OpenClaw에 반환하기 전에 긴 `Retry-After` 대기 시간을 둘 수 있습니다. Anthropic과 OpenAI 같은 Stainless 기반 SDK에 대해 OpenClaw는 기본적으로 SDK 내부 `retry-after-ms` / `retry-after` 대기 시간을 60초로 제한하고, 더 긴 재시도 가능 응답은 즉시 표면화하여 이 페일오버 경로가 실행되도록 합니다. 상한을 조정하거나 비활성화하려면 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`를 사용하세요. 자세한 내용은 [Retry behavior](/ko/concepts/retry)를 참고하세요.
  </Accordion>
  <Accordion title="모델 범위 쿨다운">
    Rate-limit 쿨다운은 모델 범위일 수도 있습니다.

    - 실패한 모델 ID를 알 수 있을 때, OpenClaw는 rate-limit 실패에 대해 `cooldownModel`을 기록합니다.
    - 같은 provider의 형제 모델은 쿨다운이 다른 모델 범위로 한정된 경우 여전히 시도할 수 있습니다.
    - 청구/비활성화 기간은 여전히 모델 전반에서 전체 profile을 차단합니다.

  </Accordion>
</AccordionGroup>

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

## Billing 비활성화

청구/크레딧 실패(예: "insufficient credits" / "credit balance too low")는 페일오버할 만한 것으로 처리되지만, 보통 일시적이지는 않습니다. 짧은 쿨다운 대신 OpenClaw는 해당 profile을 **비활성화됨**으로 표시하고(더 긴 백오프 적용) 다음 profile/provider로 순환합니다.

<Note>
모든 billing 형태 응답이 `402`인 것은 아니고, 모든 HTTP `402`가 여기에 해당하는 것도 아닙니다. OpenClaw는 provider가 대신 `401` 또는 `403`을 반환하더라도 명시적인 billing 텍스트는 billing 경로에 유지하지만, provider 전용 매처는 해당 provider에만 범위가 제한됩니다(예: OpenRouter `403 Key limit exceeded`).

한편 `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, `organization spending limit exceeded`처럼 재시도 가능해 보이는 메시지의 일시적인 `402` 사용량 기간 및 조직/워크스페이스 지출 한도 오류는 `rate_limit`로 분류됩니다. 이는 긴 billing-disable 경로 대신 짧은 쿨다운/페일오버 경로에 남습니다.
</Note>

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

- Billing 백오프는 **5시간**부터 시작하며, billing 실패마다 두 배로 증가하고 **24시간**에서 상한에 도달합니다.
- profile이 **24시간** 동안 실패하지 않으면 백오프 카운터가 재설정됩니다(구성 가능).
- overloaded 재시도는 모델 폴백 전에 **같은 provider profile 순환 1회**를 허용합니다.
- overloaded 재시도는 기본적으로 **0ms 백오프**를 사용합니다.

## 모델 폴백

provider의 모든 profile이 실패하면 OpenClaw는 `agents.defaults.model.fallbacks`의 다음 모델로 이동합니다. 이는 profile 순환을 소진시킨 인증 실패, rate limit, timeout에 적용됩니다(다른 오류는 폴백을 진행시키지 않음).

overloaded 및 rate-limit 오류는 billing 쿨다운보다 더 공격적으로 처리됩니다. 기본적으로 OpenClaw는 같은 provider auth profile 재시도 1회를 허용한 다음, 기다리지 않고 다음으로 구성된 모델 폴백으로 전환합니다. `ModelNotReadyException` 같은 provider-busy 신호는 이 overloaded 버킷에 들어갑니다. 이는 `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, `auth.cooldowns.rateLimitedProfileRotations`로 조정할 수 있습니다.

실행이 모델 재정의(hooks 또는 CLI)로 시작된 경우에도, 구성된 폴백을 모두 시도한 뒤에는 여전히 `agents.defaults.model.primary`에서 끝납니다.

### 후보 체인 규칙

OpenClaw는 현재 요청된 `provider/model`과 구성된 폴백으로부터 후보 목록을 만듭니다.

<AccordionGroup>
  <Accordion title="규칙">
    - 요청된 모델은 항상 첫 번째입니다.
    - 명시적으로 구성된 폴백은 중복 제거되지만 모델 allowlist로 필터링되지는 않습니다. 이는 명시적인 운영자 의도로 취급됩니다.
    - 현재 실행이 같은 provider 계열의 구성된 폴백 위에서 이미 실행 중이면, OpenClaw는 전체 구성된 체인을 계속 사용합니다.
    - 현재 실행이 config와 다른 provider 위에 있고, 그 현재 모델이 구성된 폴백 체인의 일부가 아니라면, OpenClaw는 다른 provider의 무관한 구성된 폴백을 추가하지 않습니다.
    - 실행이 재정의에서 시작된 경우, 앞선 후보가 모두 소진된 뒤 체인이 정상 기본값으로 다시 안정화될 수 있도록 구성된 primary가 마지막에 추가됩니다.
  </Accordion>
</AccordionGroup>

### 어떤 오류가 폴백을 진행시키는가

<Tabs>
  <Tab title="계속 진행됨">
    - 인증 실패
    - rate limit 및 쿨다운 소진
    - overloaded/provider-busy 오류
    - timeout 형태의 페일오버 오류
    - billing 비활성화
    - `LiveSessionModelSwitchError`: 오래된 저장 모델이 바깥쪽 재시도 루프를 만들지 않도록 페일오버 경로로 정규화됨
    - 아직 남은 후보가 있을 때의 기타 인식되지 않은 오류
  </Tab>
  <Tab title="계속 진행되지 않음">
    - timeout/페일오버 형태가 아닌 명시적 중단
    - Compaction/재시도 로직 내부에 남아 있어야 하는 context overflow 오류(예: `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, `ollama error: context length exceeded`)
    - 남은 후보가 없을 때의 최종 알 수 없는 오류
  </Tab>
</Tabs>

### 쿨다운 건너뛰기 vs 프로브 동작

provider의 모든 auth profile이 이미 쿨다운 상태일 때도 OpenClaw는 해당 provider를 영구적으로 자동 건너뛰지 않습니다. 대신 후보별로 판단합니다.

<AccordionGroup>
  <Accordion title="후보별 판단">
    - 지속적인 인증 실패는 전체 provider를 즉시 건너뜁니다.
    - Billing 비활성화는 보통 건너뛰지만, primary 후보는 재시작 없이 복구가 가능하도록 스로틀과 함께 여전히 프로브될 수 있습니다.
    - primary 후보는 provider별 스로틀에 따라 쿨다운 만료 시점 근처에서 프로브될 수 있습니다.
    - 실패가 일시적(`rate_limit`, `overloaded`, 또는 unknown)으로 보이면 같은 provider의 폴백 형제 모델은 쿨다운 중에도 시도될 수 있습니다. 이는 특히 rate limit이 모델 범위일 수 있고 형제 모델은 즉시 복구될 수 있는 경우 중요합니다.
    - 일시적 쿨다운 프로브는 provider당 폴백 실행마다 1회로 제한되므로, 하나의 provider가 교차-provider 폴백을 지연시키지 않습니다.
  </Accordion>
</AccordionGroup>

## 세션 재정의와 라이브 모델 전환

세션 모델 변경은 공유 상태입니다. 활성 실행기, `/model` 명령, Compaction/세션 업데이트, 라이브 세션 조정은 모두 같은 세션 항목의 일부를 읽거나 씁니다.

즉, 폴백 재시도는 라이브 모델 전환과 조율해야 합니다.

- 명시적인 사용자 주도 모델 변경만 보류 중인 라이브 전환으로 표시됩니다. 여기에는 `/model`, `session_status(model=...)`, `sessions.patch`가 포함됩니다.
- 폴백 순환, Heartbeat 재정의, Compaction 같은 시스템 주도 모델 변경은 자체적으로 보류 중인 라이브 전환을 표시하지 않습니다.
- 폴백 재시도가 시작되기 전에 응답 실행기는 선택된 폴백 재정의 필드를 세션 항목에 저장합니다.
- 라이브 세션 조정은 오래된 런타임 모델 필드보다 저장된 세션 재정의를 우선합니다.
- 폴백 시도가 실패하면 실행기는 자신이 쓴 재정의 필드만 롤백하며, 그것도 여전히 실패한 해당 후보와 일치할 때만 수행합니다.

이렇게 하면 고전적인 경쟁 상태를 방지할 수 있습니다.

<Steps>
  <Step title="Primary 실패">
    선택된 primary 모델이 실패합니다.
  </Step>
  <Step title="메모리에서 폴백 선택">
    폴백 후보가 메모리에서 선택됩니다.
  </Step>
  <Step title="세션 저장소는 여전히 이전 primary를 가리킴">
    세션 저장소는 여전히 이전 primary를 반영합니다.
  </Step>
  <Step title="라이브 조정이 오래된 상태를 읽음">
    라이브 세션 조정이 오래된 세션 상태를 읽습니다.
  </Step>
  <Step title="재시도가 되돌아감">
    폴백 시도가 시작되기 전에 재시도가 다시 이전 모델로 되돌아갑니다.
  </Step>
</Steps>

저장된 폴백 재정의가 이 창을 닫아 주며, 제한적 롤백은 더 새로운 수동 또는 런타임 세션 변경을 그대로 유지합니다.

## 관찰 가능성 및 실패 요약

`runWithModelFallback(...)`는 로그와 사용자 대상 쿨다운 메시지에 사용되는 시도별 세부 정보를 기록합니다.

- 시도한 provider/model
- 이유(`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` 및 유사한 페일오버 이유)
- 선택적 status/code
- 사람이 읽을 수 있는 오류 요약

모든 후보가 실패하면 OpenClaw는 `FallbackSummaryError`를 발생시킵니다. 바깥쪽 응답 실행기는 이를 사용해 "모든 모델이 일시적으로 rate-limited 상태입니다" 같은 더 구체적인 메시지를 만들고, 알 수 있는 경우 가장 빠른 쿨다운 만료 시점을 포함할 수 있습니다.

이 쿨다운 요약은 모델 인식 방식으로 동작합니다.

- 시도한 provider/model 체인과 무관한 모델 범위 rate limit은 무시됩니다
- 남은 차단이 해당 모델과 일치하는 모델 범위 rate limit이라면, OpenClaw는 그 모델을 여전히 막고 있는 마지막 일치 만료 시점을 보고합니다

## 관련 config

다음 항목은 [Gateway configuration](/ko/gateway/configuration)을 참고하세요.

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 라우팅

더 넓은 모델 선택 및 폴백 개요는 [Models](/ko/concepts/models)를 참고하세요.
