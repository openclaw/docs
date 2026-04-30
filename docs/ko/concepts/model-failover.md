---
read_when:
    - 인증 프로필 순환, 쿨다운 또는 모델 폴백 동작 진단
    - 인증 프로필 또는 모델의 장애 조치 규칙 업데이트
    - 세션 모델 재정의가 대체 재시도와 상호 작용하는 방식 이해
sidebarTitle: Model failover
summary: OpenClaw가 인증 프로필을 순환하고 모델 간에 폴백하는 방식
title: 모델 장애 조치
x-i18n:
    generated_at: "2026-04-30T06:26:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw는 실패를 두 단계로 처리합니다.

1. 현재 제공자 내에서 **인증 프로필 순환**.
2. `agents.defaults.model.fallbacks`의 다음 모델로 **모델 폴백**.

이 문서는 런타임 규칙과 이를 뒷받침하는 데이터를 설명합니다.

## 런타임 흐름

일반 텍스트 실행에서 OpenClaw는 다음 순서로 후보를 평가합니다.

<Steps>
  <Step title="세션 상태 확인">
    활성 세션 모델과 인증 프로필 기본 설정을 확인합니다.
  </Step>
  <Step title="후보 체인 구성">
    현재 모델 선택과 해당 선택 소스의 폴백 정책에서 모델 후보 체인을 구성합니다. 구성된 기본값, cron 작업 기본 모델, 자동 선택된 폴백 모델은 구성된 폴백을 사용할 수 있으며, 명시적인 사용자 세션 선택은 엄격하게 적용됩니다.
  </Step>
  <Step title="현재 제공자 시도">
    인증 프로필 순환/쿨다운 규칙에 따라 현재 제공자를 시도합니다.
  </Step>
  <Step title="페일오버할 만한 오류에서 진행">
    해당 제공자가 페일오버할 만한 오류로 소진되면 다음 모델 후보로 이동합니다.
  </Step>
  <Step title="폴백 재정의 유지">
    재시도가 시작되기 전에 선택된 폴백 재정의를 유지하여 다른 세션 리더가 러너가 사용하려는 동일한 제공자/모델을 볼 수 있게 합니다. 유지된 모델 재정의는 `modelOverrideSource: "auto"`로 표시됩니다.
  </Step>
  <Step title="실패 시 좁은 범위로 롤백">
    폴백 후보가 실패하면, 실패한 후보와 여전히 일치하는 경우에만 폴백이 소유한 세션 재정의 필드를 롤백합니다.
  </Step>
  <Step title="소진되면 FallbackSummaryError 발생">
    모든 후보가 실패하면 시도별 세부 정보와 알려진 경우 가장 이른 쿨다운 만료 시간을 포함한 `FallbackSummaryError`를 발생시킵니다.
  </Step>
</Steps>

이는 의도적으로 "전체 세션을 저장하고 복원"하는 것보다 좁은 범위입니다. 응답 러너는 폴백을 위해 자신이 소유한 모델 선택 필드만 유지합니다.

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

이를 통해 실패한 폴백 재시도가 시도 실행 중에 발생한 수동 `/model` 변경이나 세션 순환 업데이트 같은 더 최신의 관련 없는 세션 변경을 덮어쓰지 못하게 합니다.

## 선택 소스 정책

OpenClaw는 선택된 제공자/모델과 그것이 선택된 이유를 분리합니다. 해당 소스가 폴백 체인이 허용되는지 제어합니다.

- **구성된 기본값**: `agents.defaults.model.primary`는 `agents.defaults.model.fallbacks`를 사용합니다.
- **에이전트 기본 모델**: `agents.list[].model`은 해당 에이전트 모델 객체가 자체 `fallbacks`를 포함하지 않는 한 엄격합니다. 엄격한 동작을 명시하려면 `fallbacks: []`를 사용하거나, 해당 에이전트가 모델 폴백을 사용하도록 하려면 비어 있지 않은 목록을 제공합니다.
- **자동 폴백 재정의**: 런타임 폴백은 재시도 전에 `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"`를 기록합니다. 해당 자동 재정의는 구성된 폴백 체인을 계속 진행할 수 있으며 `/new`, `/reset`, `sessions.reset`으로 지워집니다.
- **사용자 세션 재정의**: `/model`, 모델 선택기, `session_status(model=...)`, `sessions.patch`는 `modelOverrideSource: "user"`를 기록합니다. 이는 정확한 세션 선택입니다. 선택된 제공자/모델이 응답을 생성하기 전에 실패하면 OpenClaw는 관련 없는 구성된 폴백으로 답변하는 대신 실패를 보고합니다.
- **레거시 세션 재정의**: 오래된 세션 항목에는 `modelOverrideSource` 없이 `modelOverride`가 있을 수 있습니다. OpenClaw는 명시적인 이전 선택이 조용히 폴백 동작으로 변환되지 않도록 이를 사용자 재정의로 취급합니다.
- **Cron 페이로드 모델**: cron 작업 `payload.model` / `--model`은 사용자 세션 재정의가 아니라 작업 기본 모델입니다. 작업이 `payload.fallbacks`를 제공하지 않는 한 구성된 폴백을 사용하며, `payload.fallbacks: []`는 cron 실행을 엄격하게 만듭니다.

## 인증 저장소(키 + OAuth)

OpenClaw는 API 키와 OAuth 토큰 모두에 **인증 프로필**을 사용합니다.

- 비밀은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 저장됩니다(레거시: `~/.openclaw/agent/auth-profiles.json`).
- 런타임 인증 라우팅 상태는 `~/.openclaw/agents/<agentId>/agent/auth-state.json`에 저장됩니다.
- 구성 `auth.profiles` / `auth.order`는 **메타데이터 + 라우팅 전용**입니다(비밀 없음).
- 레거시 가져오기 전용 OAuth 파일: `~/.openclaw/credentials/oauth.json`(처음 사용할 때 `auth-profiles.json`으로 가져옴).

자세한 내용: [OAuth](/ko/concepts/oauth)

자격 증명 유형:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`(일부 제공자는 `projectId`/`enterpriseUrl` 추가)

## 프로필 ID

OAuth 로그인은 여러 계정이 공존할 수 있도록 별도의 프로필을 생성합니다.

- 기본값: 이메일을 사용할 수 없을 때 `provider:default`.
- 이메일이 있는 OAuth: `provider:<email>`(예: `google-antigravity:user@gmail.com`).

프로필은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`의 `profiles` 아래에 저장됩니다.

## 순환 순서

제공자에 여러 프로필이 있으면 OpenClaw는 다음과 같은 순서를 선택합니다.

<Steps>
  <Step title="명시적 구성">
    `auth.order[provider]`(설정된 경우).
  </Step>
  <Step title="구성된 프로필">
    제공자로 필터링된 `auth.profiles`.
  </Step>
  <Step title="저장된 프로필">
    해당 제공자의 `auth-profiles.json` 항목.
  </Step>
</Steps>

명시적 순서가 구성되지 않은 경우 OpenClaw는 라운드 로빈 순서를 사용합니다.

- **기본 키:** 프로필 유형(**API 키보다 OAuth 우선**).
- **보조 키:** `usageStats.lastUsed`(각 유형 내에서 가장 오래된 항목 우선).
- **쿨다운/비활성화된 프로필**은 끝으로 이동하며, 가장 빠른 만료 순으로 정렬됩니다.

### 세션 고정성(캐시 친화적)

OpenClaw는 제공자 캐시를 따뜻하게 유지하기 위해 **선택된 인증 프로필을 세션별로 고정**합니다. 모든 요청마다 순환하지 **않습니다**. 고정된 프로필은 다음까지 재사용됩니다.

- 세션이 재설정됨(`/new` / `/reset`)
- Compaction이 완료됨(Compaction 횟수 증가)
- 프로필이 쿨다운/비활성화 상태임

`/model …@<profileId>`를 통한 수동 선택은 해당 세션에 대한 **사용자 재정의**를 설정하며, 새 세션이 시작될 때까지 자동 순환되지 않습니다.

<Note>
자동 고정 프로필(세션 라우터가 선택)은 **기본 설정**으로 취급됩니다. 먼저 시도되지만, 속도 제한/시간 초과가 발생하면 OpenClaw가 다른 프로필로 순환할 수 있습니다. 사용자가 고정한 프로필은 해당 프로필에 잠긴 상태로 유지됩니다. 실패하고 모델 폴백이 구성되어 있으면 OpenClaw는 프로필을 전환하는 대신 다음 모델로 이동합니다.
</Note>

### OAuth가 "사라진 것처럼 보일" 수 있는 이유

같은 제공자에 OAuth 프로필과 API 키 프로필이 모두 있으면, 고정되지 않은 경우 라운드 로빈이 메시지 간에 이들을 전환할 수 있습니다. 단일 프로필을 강제하려면:

- `auth.order[provider] = ["provider:profileId"]`로 고정하거나,
- UI/채팅 표면에서 지원하는 경우 프로필 재정의와 함께 `/model …`을 통해 세션별 재정의를 사용합니다.

## 쿨다운

인증/속도 제한 오류(또는 속도 제한처럼 보이는 시간 초과)로 인해 프로필이 실패하면 OpenClaw는 해당 프로필을 쿨다운으로 표시하고 다음 프로필로 이동합니다.

<AccordionGroup>
  <Accordion title="속도 제한 / 시간 초과 버킷에 포함되는 것">
    해당 속도 제한 버킷은 단순한 `429`보다 더 넓습니다. `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` 같은 제공자 메시지와 `weekly/monthly limit reached` 같은 주기적 사용 창 제한도 포함합니다.

    형식/잘못된 요청 오류(예: Cloud Code Assist 도구 호출 ID 검증 실패)는 페일오버할 만한 오류로 취급되며 동일한 쿨다운을 사용합니다. `Unhandled stop reason: error`, `stop reason: error`, `reason: error` 같은 OpenAI 호환 중지 사유 오류는 시간 초과/페일오버 신호로 분류됩니다.

    소스가 알려진 일시적 패턴과 일치하면 일반 서버 텍스트도 해당 시간 초과 버킷에 들어갈 수 있습니다. 예를 들어, 단순 pi-ai 스트림 래퍼 메시지 `An unknown error occurred`는 모든 제공자에서 페일오버할 만한 오류로 취급됩니다. pi-ai가 제공자 스트림이 구체적인 세부 정보 없이 `stopReason: "aborted"` 또는 `stopReason: "error"`로 끝날 때 이를 내보내기 때문입니다. `internal server error`, `unknown error, 520`, `upstream error`, `backend error` 같은 일시적 서버 텍스트가 있는 JSON `api_error` 페이로드도 페일오버할 만한 시간 초과로 취급됩니다.

    단순 `Provider returned error` 같은 OpenRouter 전용 일반 업스트림 텍스트는 제공자 컨텍스트가 실제로 OpenRouter일 때만 시간 초과로 취급됩니다. `LLM request failed with an unknown error.` 같은 일반 내부 폴백 텍스트는 보수적으로 유지되며 그 자체만으로 페일오버를 트리거하지 않습니다.

  </Accordion>
  <Accordion title="SDK retry-after 상한">
    일부 제공자 SDK는 제어권을 OpenClaw에 반환하기 전에 긴 `Retry-After` 기간 동안 대기할 수 있습니다. Anthropic 및 OpenAI 같은 Stainless 기반 SDK의 경우 OpenClaw는 기본적으로 SDK 내부 `retry-after-ms` / `retry-after` 대기를 60초로 제한하고, 더 긴 재시도 가능 응답은 즉시 표면화하여 이 페일오버 경로가 실행될 수 있게 합니다. `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`로 상한을 조정하거나 비활성화하세요. [재시도 동작](/ko/concepts/retry)을 참조하세요.
  </Accordion>
  <Accordion title="모델 범위 쿨다운">
    속도 제한 쿨다운은 모델 범위일 수도 있습니다.

    - 실패한 모델 ID를 알 수 있는 경우 OpenClaw는 속도 제한 실패에 대해 `cooldownModel`을 기록합니다.
    - 같은 제공자의 형제 모델은 쿨다운이 다른 모델로 범위 지정된 경우 여전히 시도될 수 있습니다.
    - 결제/비활성화 창은 여전히 모델 전반에서 전체 프로필을 차단합니다.

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

## 결제 비활성화

결제/크레딧 실패(예: "insufficient credits" / "credit balance too low")는 페일오버할 만한 오류로 취급되지만, 일반적으로 일시적이지 않습니다. 짧은 쿨다운 대신 OpenClaw는 프로필을 **비활성화**(더 긴 백오프 포함)로 표시하고 다음 프로필/제공자로 순환합니다.

<Note>
결제 형태의 모든 응답이 `402`인 것은 아니며, 모든 HTTP `402`가 여기에 해당하는 것도 아닙니다. OpenClaw는 제공자가 대신 `401` 또는 `403`을 반환하더라도 명시적인 결제 텍스트를 결제 경로에 유지하지만, 제공자별 매처는 해당 매처를 소유한 제공자로 범위가 제한됩니다(예: OpenRouter `403 Key limit exceeded`).

한편 메시지가 재시도 가능해 보이는 경우(예: `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, `organization spending limit exceeded`) 임시 `402` 사용 창 및 조직/워크스페이스 지출 제한 오류는 `rate_limit`으로 분류됩니다. 이는 긴 결제 비활성화 경로 대신 짧은 쿨다운/페일오버 경로에 남습니다.
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

- 결제 백오프는 **5시간**에서 시작하며, 결제 실패마다 두 배가 되고 **24시간**에서 상한이 적용됩니다.
- 프로필이 **24시간** 동안 실패하지 않으면 백오프 카운터가 재설정됩니다(구성 가능).
- 과부하 재시도는 모델 폴백 전에 **동일 제공자 프로필 순환 1회**를 허용합니다.
- 과부하 재시도는 기본적으로 **0 ms 백오프**를 사용합니다.

## 모델 폴백

제공자의 모든 프로필이 실패하면 OpenClaw는 `agents.defaults.model.fallbacks`의 다음 모델로 이동합니다. 이는 프로필 순환을 소진한 인증 실패, 속도 제한, 시간 초과에 적용됩니다(다른 오류는 폴백을 진행하지 않음). 충분한 세부 정보를 노출하지 않는 제공자 오류도 폴백 상태에서 정확히 레이블링됩니다. `empty_response`는 제공자가 사용할 수 있는 메시지나 상태를 반환하지 않았음을 의미하고, `no_error_details`는 제공자가 명시적으로 `Unknown error (no error details in response)`를 반환했음을 의미하며, `unclassified`는 OpenClaw가 원시 미리보기를 보존했지만 아직 일치한 분류기가 없음을 의미합니다.

과부하 및 속도 제한 오류는 결제 쿨다운보다 더 적극적으로 처리됩니다. 기본적으로 OpenClaw는 동일 제공자의 인증 프로필 재시도를 한 번 허용한 다음, 기다리지 않고 다음 구성된 대체 모델로 전환합니다. `ModelNotReadyException` 같은 제공자 사용 중 신호는 해당 과부하 범주에 들어갑니다. 이는 `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, `auth.cooldowns.rateLimitedProfileRotations`로 조정하세요.

실행이 구성된 기본 주 모델, Cron 작업 주 모델, 명시적 대체 후보가 있는 에이전트 주 모델, 또는 자동 선택된 대체 재정의에서 시작되면 OpenClaw는 일치하는 구성된 대체 체인을 따라갈 수 있습니다. 명시적 대체 후보가 없는 에이전트 주 모델과 명시적 사용자 선택(예: `/model ollama/qwen3.5:27b`, 모델 선택기, `sessions.patch`, 또는 일회성 CLI 제공자/모델 재정의)은 엄격하게 처리됩니다. 해당 제공자/모델에 연결할 수 없거나 응답을 생성하기 전에 실패하면 OpenClaw는 관련 없는 대체 후보로 답변하는 대신 실패를 보고합니다.

### 후보 체인 규칙

OpenClaw는 현재 요청된 `provider/model`과 구성된 대체 후보를 더해 후보 목록을 만듭니다.

<AccordionGroup>
  <Accordion title="규칙">
    - 요청된 모델은 항상 첫 번째입니다.
    - 명시적으로 구성된 대체 후보는 중복 제거되지만 모델 허용 목록으로 필터링되지 않습니다. 이는 명시적인 운영자 의도로 처리됩니다.
    - 현재 실행이 이미 같은 제공자 계열의 구성된 대체 후보에 있으면 OpenClaw는 전체 구성된 체인을 계속 사용합니다.
    - 현재 실행이 구성과 다른 제공자에 있고 현재 모델이 구성된 대체 체인에 아직 포함되어 있지 않으면 OpenClaw는 다른 제공자의 관련 없는 구성된 대체 후보를 추가하지 않습니다.
    - 대체 실행기에 명시적 대체 재정의가 제공되지 않으면, 앞선 후보가 모두 소진된 뒤 체인이 정상 기본값으로 돌아갈 수 있도록 구성된 주 모델이 끝에 추가됩니다.
    - 호출자가 `fallbacksOverride`를 제공하면 실행기는 요청된 모델과 해당 재정의 목록만 정확히 사용합니다. 빈 목록은 모델 대체를 비활성화하고 구성된 주 모델이 숨겨진 재시도 대상으로 추가되지 않게 합니다.

  </Accordion>
</AccordionGroup>

### 대체를 진행시키는 오류

<Tabs>
  <Tab title="계속 진행되는 경우">
    - 인증 실패
    - 속도 제한 및 쿨다운 소진
    - 과부하/제공자 사용 중 오류
    - 타임아웃 형태의 장애 조치 오류
    - 결제 비활성화
    - `LiveSessionModelSwitchError`: 오래된 유지 모델이 외부 재시도 루프를 만들지 않도록 장애 조치 경로로 정규화됩니다
    - 아직 남은 후보가 있을 때의 기타 인식되지 않은 오류

  </Tab>
  <Tab title="계속 진행되지 않는 경우">
    - 타임아웃/장애 조치 형태가 아닌 명시적 중단
    - Compaction/재시도 로직 안에 머물러야 하는 컨텍스트 오버플로 오류(예: `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, 또는 `ollama error: context length exceeded`)
    - 남은 후보가 없을 때의 최종 알 수 없는 오류

  </Tab>
</Tabs>

### 쿨다운 건너뛰기와 확인 시도 동작

제공자의 모든 인증 프로필이 이미 쿨다운 상태일 때 OpenClaw는 해당 제공자를 영구적으로 자동 건너뛰지 않습니다. 후보별로 결정을 내립니다.

<AccordionGroup>
  <Accordion title="후보별 결정">
    - 지속적 인증 실패는 즉시 전체 제공자를 건너뜁니다.
    - 결제 비활성화는 보통 건너뛰지만, 재시작 없이 복구가 가능하도록 주 후보는 제한 주기에 따라 계속 확인될 수 있습니다.
    - 주 후보는 제공자별 제한 주기와 함께 쿨다운 만료가 가까워졌을 때 확인될 수 있습니다.
    - 실패가 일시적으로 보이면(`rate_limit`, `overloaded`, 또는 알 수 없음) 동일 제공자의 형제 대체 후보는 쿨다운에도 불구하고 시도될 수 있습니다. 이는 속도 제한이 모델 범위이고 형제 모델은 즉시 복구될 수 있을 때 특히 중요합니다.
    - 일시적 쿨다운 확인 시도는 단일 제공자가 교차 제공자 대체를 지연시키지 않도록 대체 실행마다 제공자당 한 번으로 제한됩니다.

  </Accordion>
</AccordionGroup>

## 세션 재정의와 실시간 모델 전환

세션 모델 변경은 공유 상태입니다. 활성 실행기, `/model` 명령, Compaction/세션 업데이트, 라이브 세션 조정은 모두 같은 세션 항목의 일부를 읽거나 씁니다.

따라서 대체 재시도는 실시간 모델 전환과 조율되어야 합니다.

- 명시적인 사용자 주도 모델 변경만 보류 중인 실시간 전환을 표시합니다. 여기에는 `/model`, `session_status(model=...)`, `sessions.patch`가 포함됩니다.
- 대체 순환, Heartbeat 재정의, Compaction 같은 시스템 주도 모델 변경은 자체적으로 보류 중인 실시간 전환을 표시하지 않습니다.
- 사용자 주도 모델 재정의는 대체 정책에서 정확한 선택으로 처리되므로, 선택한 제공자에 연결할 수 없으면 `agents.defaults.model.fallbacks`에 의해 가려지는 대신 실패로 드러납니다.
- 대체 재시도가 시작되기 전에 응답 실행기는 선택된 대체 재정의 필드를 세션 항목에 유지합니다.
- 자동 대체 재정의는 이후 턴에서도 선택 상태로 남아 OpenClaw가 모든 메시지마다 이미 나쁜 것으로 확인된 주 모델을 확인하지 않도록 합니다. `/new`, `/reset`, `sessions.reset`은 자동 출처 재정의를 지우고 세션을 구성된 기본값으로 되돌립니다.
- `/status`는 선택된 모델을 표시하고, 대체 상태가 다를 때는 활성 대체 모델과 이유를 표시합니다.
- 라이브 세션 조정은 오래된 런타임 모델 필드보다 유지된 세션 재정의를 우선합니다.
- 실시간 전환 오류가 활성 대체 체인의 더 뒤쪽 후보를 가리키면 OpenClaw는 관련 없는 후보를 먼저 거치지 않고 선택된 모델로 바로 이동합니다.
- 대체 시도가 실패하면 실행기는 자신이 쓴 재정의 필드만 롤백하며, 해당 필드가 여전히 실패한 후보와 일치할 때만 롤백합니다.

이는 전형적인 경합 상태를 방지합니다.

<Steps>
  <Step title="주 모델 실패">
    선택된 주 모델이 실패합니다.
  </Step>
  <Step title="메모리에서 대체 후보 선택됨">
    메모리에서 대체 후보가 선택됩니다.
  </Step>
  <Step title="세션 저장소가 여전히 이전 주 모델을 가리킴">
    세션 저장소에는 여전히 이전 주 모델이 반영됩니다.
  </Step>
  <Step title="라이브 조정이 오래된 상태를 읽음">
    라이브 세션 조정이 오래된 세션 상태를 읽습니다.
  </Step>
  <Step title="재시도가 되돌아감">
    대체 시도가 시작되기 전에 재시도가 이전 모델로 되돌아갑니다.
  </Step>
</Steps>

유지된 대체 재정의는 그 시간 간격을 닫고, 좁은 범위의 롤백은 더 최신의 수동 또는 런타임 세션 변경을 그대로 유지합니다.

## 관측성과 실패 요약

`runWithModelFallback(...)`은 로그와 사용자 대상 쿨다운 메시지에 사용되는 시도별 세부 정보를 기록합니다.

- 시도한 제공자/모델
- 이유(`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` 및 유사한 장애 조치 이유)
- 선택적 상태/코드
- 사람이 읽을 수 있는 오류 요약

구조화된 `model_fallback_decision` 로그에는 후보가 실패하거나 건너뛰어지거나 더 뒤쪽의 대체 후보가 성공할 때 평면 `fallbackStep*` 필드도 포함됩니다. 이러한 필드는 시도된 전환을 명시적으로 만듭니다(`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`). 따라서 로그 및 진단 내보내기 도구는 최종 대체 후보도 실패하더라도 주 모델 실패를 재구성할 수 있습니다.

모든 후보가 실패하면 OpenClaw는 `FallbackSummaryError`를 던집니다. 외부 응답 실행기는 이를 사용해 "모든 모델이 일시적으로 속도 제한 상태입니다"와 같은 더 구체적인 메시지를 만들고, 알려진 경우 가장 이른 쿨다운 만료 시각을 포함할 수 있습니다.

그 쿨다운 요약은 모델을 인식합니다.

- 관련 없는 모델 범위 속도 제한은 시도한 제공자/모델 체인에서 무시됩니다
- 남은 차단이 일치하는 모델 범위 속도 제한이면 OpenClaw는 해당 모델을 여전히 차단하는 마지막 일치 만료 시각을 보고합니다

## 관련 구성

다음 항목은 [Gateway 구성](/ko/gateway/configuration)을 참조하세요.

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 라우팅

더 넓은 모델 선택 및 대체 개요는 [모델](/ko/concepts/models)을 참조하세요.
