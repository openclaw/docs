---
read_when:
    - 인증 프로필 순환, 쿨다운 또는 모델 폴백 동작 진단
    - 인증 프로필 또는 모델의 장애 조치 규칙 업데이트하기
    - 세션 모델 재정의와 폴백 재시도의 상호작용 이해하기
sidebarTitle: Model failover
summary: OpenClaw이 인증 프로필을 순환하고 모델 간에 대체하는 방식
title: 모델 장애 조치
x-i18n:
    generated_at: "2026-07-12T00:41:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw은 장애를 두 단계로 처리합니다.

1. 현재 제공자 내에서 **인증 프로필 순환**.
2. `agents.defaults.model.fallbacks`의 다음 모델로 **모델 폴백**.

## 런타임 흐름

<Steps>
  <Step title="세션 상태 확인">
    활성 세션 모델과 인증 프로필 기본 설정을 확인합니다.
  </Step>
  <Step title="후보 체인 구성">
    현재 모델 선택과 해당 선택 출처의 폴백 정책을 바탕으로 모델 후보 체인을 구성합니다. 구성된 기본값, Cron 작업 기본 모델, 자동 선택된 폴백 모델은 구성된 폴백을 사용할 수 있지만, 사용자가 명시적으로 선택한 세션 모델에는 엄격하게 적용됩니다.
  </Step>
  <Step title="현재 제공자 시도">
    인증 프로필 순환 및 쿨다운 규칙에 따라 현재 제공자를 시도합니다.
  </Step>
  <Step title="페일오버 대상 오류 발생 시 다음 후보로 이동">
    해당 제공자에서 모든 시도가 페일오버 대상 오류로 실패하면 다음 모델 후보로 이동합니다.
  </Step>
  <Step title="폴백 재정의 유지">
    재시도가 시작되기 전에 선택한 폴백 재정의를 유지하여, 다른 세션 판독기도 실행기가 곧 사용할 제공자/모델과 동일한 값을 확인하도록 합니다. 유지된 모델 재정의에는 `modelOverrideSource: "auto"`가 표시됩니다.
  </Step>
  <Step title="실패 시 제한적으로 롤백">
    폴백 후보가 실패하면 폴백이 소유한 세션 재정의 필드가 여전히 실패한 후보와 일치할 때만 해당 필드를 롤백합니다.
  </Step>
  <Step title="모두 실패하면 FallbackSummaryError 발생">
    모든 후보가 실패하면 각 시도의 세부 정보와 알려진 경우 가장 빠른 쿨다운 만료 시간을 포함하는 `FallbackSummaryError`를 발생시킵니다.
  </Step>
</Steps>

이는 의도적으로 "전체 세션을 저장하고 복원"하는 것보다 범위가 좁습니다. 응답 실행기는 폴백을 위해 자신이 소유하는 모델 선택 필드인 `providerOverride`, `modelOverride`, `modelOverrideSource`, `authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`만 유지합니다. 이렇게 하면 실패한 폴백 재시도가 실행 중 발생한 수동 `/model` 변경이나 세션 순환 업데이트와 같은, 더 최근의 관련 없는 세션 변경 사항을 덮어쓰지 않습니다.

## 선택 출처 정책

선택 출처에 따라 폴백 체인 허용 여부가 결정됩니다.

- **구성된 기본값**: `agents.defaults.model.primary`는 `agents.defaults.model.fallbacks`를 사용합니다.
- **에이전트 기본 모델**: `agents.list[].model`은 해당 에이전트의 모델 객체에 자체 `fallbacks`가 포함되지 않는 한 엄격하게 적용됩니다. 엄격한 동작을 명시하려면 `fallbacks: []`를 사용하고, 해당 에이전트에서 모델 폴백을 사용하려면 비어 있지 않은 목록을 사용합니다.
- **자동 폴백 재정의**: 런타임 폴백은 재시도 전에 `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"`와 선택된 원본 모델을 기록합니다. 이 재정의는 매 메시지마다 기본 모델을 탐색하지 않고 구성된 폴백 체인을 계속 따라가지만, OpenClaw은 5분마다 구성된 원본 모델을 탐색하며 이 간격은 구성할 수 없습니다. 원본 모델이 복구되면 재정의를 지웁니다. `/new`, `/reset`, `sessions.reset`도 자동 출처 재정의를 지웁니다. 명시적 `heartbeat.model` 없이 실행되는 Heartbeat는 원본이 현재 구성된 기본값과 더 이상 일치하지 않을 때 직접 자동 재정의를 지웁니다.
- **사용자 세션 재정의**: `/model`, 모델 선택기, `session_status(model=...)`, `sessions.patch`는 `modelOverrideSource: "user"`를 기록합니다. 이는 정확한 세션 선택입니다. 선택된 제공자/모델이 응답을 생성하기 전에 실패하면 OpenClaw은 관련 없는 구성된 폴백으로 응답하는 대신 실패를 보고합니다.
- **레거시 세션 재정의**: 이전 세션 항목에는 `modelOverrideSource` 없이 `modelOverride`가 있을 수 있습니다. OpenClaw은 명시적인 이전 선택이 암묵적으로 폴백 동작으로 변환되지 않도록 이를 사용자 재정의로 처리합니다.
- **Cron 페이로드 모델**: Cron 작업의 `payload.model` / `--model`은 사용자 세션 재정의가 아니라 작업 기본 모델입니다. 작업에서 `payload.fallbacks`를 제공하지 않는 한 구성된 폴백을 사용하며, `payload.fallbacks: []`를 지정하면 Cron 실행에 엄격하게 적용됩니다.

OpenClaw은 실패한 기본 모델을 매 턴마다 재시도하지 않도록 세션과 기본 모델별로 최근 기본 모델 탐색을 기억합니다. 세션이 폴백으로 전환될 때 눈에 보이는 알림을 보내고, 선택된 기본 모델로 돌아올 때도 알림을 보냅니다. 고정된 폴백 상태의 모든 턴마다 알림을 반복하지는 않습니다.

## 인증 실패 건너뛰기 캐시

기본적으로 새 턴마다 기존 폴백 재시도 동작이 유지됩니다. OpenClaw은 최근에 `auth` 또는 `auth_permanent` 오류로 실패한 비기본 후보를 포함하여 구성된 각 폴백 후보를 다시 시도합니다.

반복되는 인증 실패를 억제하려면 다음을 사용하여 선택적으로 활성화합니다.

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

활성화하면 OpenClaw은 비기본 폴백 후보가 인증 유형 오류로 실패한 후, 세션 ID, 제공자, 모델을 키로 사용하여 메모리 내 세션 범위 건너뛰기 표식을 기록합니다. 기본 후보는 절대 건너뛰지 않으므로 사용자가 명시적으로 모델을 선택했을 때 실제 인증 오류가 계속 표시됩니다. 캐시는 프로세스 로컬이며 Gateway가 다시 시작되면 지워집니다.

값은 밀리초 단위의 TTL입니다. `0`이거나 설정되지 않으면 캐시가 비활성화됩니다. 양수 값은 1초에서 10분 사이로 제한됩니다.

## 사용자에게 표시되는 폴백 알림

세션이 자동 선택된 폴백으로 전환되면 OpenClaw은 동일한 응답 화면에 상태 알림을 보냅니다.

```text
↪️ 모델 폴백: <fallback> (선택됨 <primary>; <reason>)
```

이후 탐색에 성공하여 세션이 선택된 기본 모델로 돌아오면 OpenClaw은 다음을 보냅니다.

```text
↪️ 모델 폴백 해제됨: <primary> (이전 <fallback>)
```

이러한 알림은 어시스턴트 콘텐츠가 아니라 운영 메시지입니다. 가능한 경우 부수 효과만 있는 턴을 포함해 상태 변경당 한 번 전달되지만, 고정된 폴백 상태의 턴에서는 반복되지 않습니다. 전달 시 일반적인 원본 응답 억제를 우회하고, 스레드형 채널의 첫 번째 어시스턴트 응답 슬롯을 소비하지 않으며, 텍스트 음성 변환과 약속 추출에서 제외됩니다.

## 인증 저장소(키 + OAuth)

OpenClaw은 API 키와 OAuth 토큰 모두에 **인증 프로필**을 사용합니다.

- 비밀 정보와 런타임 인증 라우팅 상태는 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`에 저장됩니다.
- 구성의 `auth.profiles` / `auth.order`에는 **메타데이터 + 라우팅만** 포함되며 비밀 정보는 포함되지 않습니다.
- 가져오기 전용 레거시 OAuth 파일: `~/.openclaw/credentials/oauth.json`(처음 사용할 때 에이전트별 인증 저장소로 가져옴).
- 레거시 `auth-profiles.json`, `auth-state.json`, 에이전트별 `auth.json` 파일은 `openclaw doctor --fix`로 가져옵니다.

자세한 내용: [OAuth](/ko/concepts/oauth)

자격 증명 유형:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`(일부 제공자의 경우 `projectId`/`enterpriseUrl` 추가)
- `type: "token"` → 선택적으로 만료될 수 있는 정적 전달자 방식 토큰입니다. OpenClaw은 이를 갱신하지 않습니다(`aws-sdk` 및 기타 자격 증명 체인 인증 모드에 사용).

## 프로필 ID

OAuth 로그인은 여러 계정이 공존할 수 있도록 서로 다른 프로필을 생성합니다.

- 기본값: 이메일을 사용할 수 없는 경우 `provider:default`.
- 이메일이 있는 OAuth: `provider:<email>`(예: `google-antigravity:user@gmail.com`).

프로필은 에이전트별 `openclaw-agent.sqlite` 인증 프로필 저장소에 있습니다.

## 순환 순서

제공자에 여러 프로필이 있으면 OpenClaw은 다음과 같은 순서로 선택합니다.

<Steps>
  <Step title="명시적 구성">
    `auth.order[provider]`(설정된 경우).
  </Step>
  <Step title="구성된 프로필">
    제공자별로 필터링된 `auth.profiles`.
  </Step>
  <Step title="저장된 프로필">
    해당 제공자의 에이전트별 SQLite 인증 프로필 항목.
  </Step>
</Steps>

명시적인 순서가 구성되지 않은 경우 OpenClaw은 라운드 로빈 순서를 사용합니다.

- **기본 키:** 프로필 유형(**OAuth, 정적 토큰, API 키 순**).
- **보조 키:** `usageStats.lastUsed`(각 유형 내에서 가장 오래된 항목부터).
- **쿨다운/비활성화된 프로필**은 가장 빠른 만료 순으로 정렬되어 끝으로 이동합니다.

### 세션 고정성(캐시 친화적)

OpenClaw은 제공자 캐시를 활성 상태로 유지하기 위해 **선택된 인증 프로필을 세션별로 고정**합니다. 요청마다 순환하지 **않습니다**. 고정된 프로필은 다음 상황까지 재사용됩니다.

- 세션이 재설정됨(`/new` / `/reset`)
- Compaction이 완료됨(Compaction 횟수 증가)
- 프로필이 쿨다운/비활성화 상태가 됨

`/model …@<profileId>`를 통한 수동 선택은 해당 세션의 **사용자 재정의**를 설정하며, 새 세션이 시작될 때까지 자동으로 순환되지 않습니다.

<Note>
자동 고정된 프로필(세션 라우터가 선택)은 **기본 설정**으로 처리됩니다. 먼저 시도되지만 속도 제한이나 시간 초과가 발생하면 OpenClaw이 다른 프로필로 순환할 수 있습니다. 원래 프로필을 다시 사용할 수 있게 되면 선택된 모델이나 런타임을 변경하지 않고도 새 실행에서 해당 프로필을 다시 우선할 수 있습니다. 사용자가 고정한 프로필은 해당 프로필에 계속 잠겨 있습니다. 이 프로필이 실패하고 모델 폴백이 구성되어 있으면 OpenClaw은 프로필을 전환하는 대신 다음 모델로 이동합니다.
</Note>

### OpenAI Codex 구독과 API 키 백업

OpenAI 에이전트 모델에서는 인증과 런타임이 분리되어 있습니다. `openai/gpt-*`는 Codex 하네스를 계속 사용하면서 인증은 Codex 구독 프로필과 OpenAI API 키 백업 간에 순환할 수 있습니다.

사용자에게 표시되는 순서에는 `auth.order.openai`를 사용합니다.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

ChatGPT/Codex OAuth 프로필과 OpenAI API 키 프로필 모두에 `openai:*`를 사용합니다. 구독이 Codex 사용량 한도에 도달하면 OpenClaw은 Codex에서 정확한 재설정 시간을 제공하는 경우 이를 기록하고, 다음 순서의 인증 프로필을 시도하며, 실행을 Codex 하네스 내에 유지합니다. 재설정 시간이 지나면 구독 프로필을 다시 사용할 수 있으며 다음 자동 선택에서 이 프로필로 돌아갈 수 있습니다.

해당 세션에서 하나의 계정/키를 강제하려는 경우에만 사용자가 고정한 프로필을 사용합니다. 사용자가 고정한 프로필은 의도적으로 엄격하게 적용되며, 암묵적으로 다른 프로필로 이동하지 않습니다.

## 쿨다운

인증/속도 제한 오류 또는 속도 제한으로 보이는 시간 초과로 인해 프로필이 실패하면 OpenClaw은 해당 프로필을 쿨다운 상태로 표시하고 다음 프로필로 이동합니다.

<AccordionGroup>
  <Accordion title="속도 제한/시간 초과 범주에 포함되는 항목">
    해당 속도 제한 범주는 단순한 `429`보다 넓습니다. `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` 같은 제공자 메시지와 `weekly limit reached` 또는 `monthly limit exhausted` 같은 주기적 사용량 기간 제한도 포함됩니다.

    형식/잘못된 요청 오류는 동일한 페이로드를 재시도해도 같은 방식으로 실패하므로 일반적으로 최종 오류로 처리됩니다. 따라서 OpenClaw은 인증 프로필을 순환하는 대신 해당 오류를 표시합니다. 알려진 재시도 복구 경로는 명시적으로 활성화할 수 있습니다. 예를 들어 Cloud Code Assist 도구 호출 ID 검증 실패는 정리된 후 `allowFormatRetry` 정책을 통해 한 번 재시도됩니다. `Unhandled stop reason: error`, `stop reason: error`, `reason: error` 같은 OpenAI 호환 중지 사유 오류는 시간 초과/페일오버 신호로 분류됩니다.

    출처가 알려진 일시적 패턴과 일치하면 일반적인 서버 텍스트도 해당 시간 초과 범주에 포함될 수 있습니다. 예를 들어 단순 모델 런타임 스트림 래퍼 메시지 `An unknown error occurred`는 모든 제공자에서 페일오버 대상으로 처리됩니다. 공유 모델 런타임이 제공자 스트림을 구체적인 세부 정보 없이 `stopReason: "aborted"` 또는 `stopReason: "error"`로 종료할 때 이 메시지를 내보내기 때문입니다. `internal server error`, `unknown error, 520`, `upstream error`, `backend error` 같은 일시적 서버 텍스트가 포함된 JSON `api_error` 페이로드도 페일오버 대상 시간 초과로 처리됩니다.

    단순한 `Provider returned error` 같은 OpenRouter 전용 일반 업스트림 텍스트는 제공자 컨텍스트가 실제로 OpenRouter일 때만 시간 초과로 처리됩니다. `LLM request failed with an unknown error.` 같은 일반적인 내부 폴백 텍스트는 보수적으로 처리되며 그 자체로는 페일오버를 유발하지 않습니다.

  </Accordion>
  <Accordion title="SDK retry-after 상한">
    일부 제공업체 SDK는 제어권을 OpenClaw에 반환하기 전에 긴 `Retry-After` 기간 동안 대기할 수 있습니다. Anthropic 및 OpenAI와 같은 Stainless 기반 SDK의 경우 OpenClaw는 기본적으로 SDK 내부의 `retry-after-ms` / `retry-after` 대기 시간을 60초로 제한하고, 더 긴 재시도 가능 응답을 즉시 노출하여 이 장애 조치 경로가 실행될 수 있도록 합니다. `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`로 상한을 조정하거나 비활성화할 수 있습니다. [재시도 동작](/ko/concepts/retry)을 참조하세요.
  </Accordion>
  <Accordion title="모델 범위 쿨다운">
    속도 제한 쿨다운은 모델 범위로도 적용될 수 있습니다.

    - 실패한 모델 ID를 알 수 있는 경우 OpenClaw는 속도 제한 실패에 대해 `cooldownModel`을 기록합니다.
    - 쿨다운 범위가 다른 모델로 한정된 경우 동일한 제공업체의 형제 모델을 계속 시도할 수 있습니다.
    - 결제/비활성화 기간은 여전히 모든 모델에 걸쳐 전체 프로필을 차단합니다.

  </Accordion>
</AccordionGroup>

일반적인(결제 및 영구 인증 이외의) 쿨다운은 프로필의 최근 오류 횟수에 따라 증가합니다.

- 첫 번째 실패: 30초
- 두 번째 실패: 1분
- 세 번째 이후 실패: 5분(상한)

프로필의 실패 기간이 지나면 카운터가 초기화됩니다(`auth.cooldowns.failureWindowHours`, 기본값 24).

상태는 에이전트별 SQLite 인증 상태의 `usageStats` 아래에 저장됩니다.

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

## 결제로 인한 비활성화

결제/크레딧 실패(예: "크레딧 부족" / "크레딧 잔액이 너무 적음")는 장애 조치가 필요한 것으로 처리되지만, 일반적으로 일시적인 문제는 아닙니다. OpenClaw는 짧은 쿨다운 대신 프로필을 **비활성화됨**으로 표시하고(더 긴 백오프 적용) 다음 프로필/제공업체로 전환합니다.

<Note>
결제 형태의 모든 응답이 `402`인 것은 아니며, 모든 HTTP `402`가 여기에 해당하는 것도 아닙니다. 제공업체가 대신 `401` 또는 `403`을 반환하더라도 OpenClaw는 명시적인 결제 관련 텍스트를 결제 처리 경로로 유지하지만, 제공업체별 매처는 해당 매처를 소유한 제공업체 범위로 한정됩니다(예: OpenRouter `403 Key limit exceeded`).

한편 일시적인 `402` 사용 기간 및 조직/워크스페이스 지출 한도 오류는 메시지가 재시도 가능한 것으로 보이면 `rate_limit`으로 분류됩니다(예: `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, `organization spending limit exceeded`). 이러한 오류는 장기 결제 비활성화 경로 대신 짧은 쿨다운/장애 조치 경로에 유지됩니다.
</Note>

신뢰도가 높은 영구 인증 실패(폐기되거나 비활성화된 키, 비활성화된 워크스페이스)에는 유사한 비활성화 경로가 적용되지만, 일부 제공업체가 장애 발생 중 인증 오류처럼 보이는 페이로드를 일시적으로 노출하므로 결제 실패보다 훨씬 빠르게 복구됩니다.

상태는 에이전트별 SQLite 인증 상태에 저장됩니다.

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

기본값(`auth.cooldowns.*`):

| 키                            | 기본값 | 용도                                                                        |
| ----------------------------- | ------ | --------------------------------------------------------------------------- |
| `billingBackoffHours`         | 5      | 기본 결제 백오프이며, 결제 실패마다 두 배로 증가                            |
| `billingMaxHours`             | 24     | 결제 백오프 상한                                                            |
| `authPermanentBackoffMinutes` | 10     | 신뢰도가 높은 영구 인증 실패의 기본 백오프                                  |
| `authPermanentMaxMinutes`     | 60     | 해당 백오프의 상한                                                          |
| `failureWindowHours`          | 24     | 이 기간에 실패가 발생하지 않으면 실패 카운터 초기화                         |
| `overloadedProfileRotations`  | 1      | 과부하 시 모델 폴백 전에 허용되는 동일 제공업체 프로필 전환 횟수            |
| `overloadedBackoffMs`         | 0      | 과부하 전환 재시도 전의 고정 지연                                           |
| `rateLimitedProfileRotations` | 1      | 속도 제한 시 모델 폴백 전에 허용되는 동일 제공업체 프로필 전환 횟수         |

과부하 및 속도 제한 오류는 결제 쿨다운보다 더 적극적으로 처리됩니다. 기본적으로 OpenClaw는 동일 제공업체 인증 프로필을 한 번 재시도한 다음, 기다리지 않고 다음으로 구성된 모델 폴백으로 전환합니다.

## 모델 폴백

한 제공업체의 모든 프로필이 실패하면 OpenClaw는 `agents.defaults.model.fallbacks`의 다음 모델로 이동합니다. 이는 프로필 전환을 모두 소진한 인증 실패, 속도 제한 및 시간 초과에 적용됩니다(다른 오류는 폴백을 진행시키지 않음). 충분한 세부 정보를 노출하지 않는 제공업체 오류도 폴백 상태에서 정확하게 레이블이 지정됩니다. `empty_response`는 제공업체가 사용 가능한 메시지나 상태를 반환하지 않았음을 의미하고, `no_error_details`는 제공업체가 명시적으로 `Unknown error (no error details in response)`를 반환했음을 의미하며, `unclassified`는 OpenClaw가 원시 미리 보기를 보존했지만 아직 일치하는 분류기가 없음을 의미합니다.

`ModelNotReadyException`과 같은 제공업체 사용 중 신호는 과부하 범주로 분류되며 속도 제한과 동일한 한 번의 전환 후 폴백 정책을 따릅니다(위의 기본값 표 참조).

실행이 구성된 기본 주 모델, Cron 작업 주 모델, 명시적 폴백이 있는 에이전트 주 모델 또는 자동 선택된 폴백 재정의에서 시작되면 OpenClaw는 일치하는 구성된 폴백 체인을 순회할 수 있습니다. 명시적 폴백이 없는 에이전트 주 모델과 명시적인 사용자 선택(예: `/model ollama/qwen3.5:27b`, 모델 선택기, `sessions.patch` 또는 일회성 CLI 제공업체/모델 재정의)은 엄격하게 처리됩니다. 해당 제공업체/모델에 연결할 수 없거나 응답을 생성하기 전에 실패하면 OpenClaw는 관련 없는 폴백에서 응답하는 대신 실패를 보고합니다.

### 후보 체인 규칙

OpenClaw는 현재 요청된 `provider/model`과 구성된 폴백으로 후보 목록을 구성합니다.

<AccordionGroup>
  <Accordion title="규칙">
    - 요청된 모델은 항상 첫 번째입니다.
    - 명시적으로 구성된 폴백은 중복 제거되지만 모델 허용 목록에 따라 필터링되지는 않습니다. 이는 운영자의 명시적 의도로 취급됩니다.
    - 현재 실행이 이미 동일한 제공업체 계열의 구성된 폴백에 있는 경우 OpenClaw는 전체 구성 체인을 계속 사용합니다.
    - 명시적인 폴백 재정의가 제공되지 않은 경우 요청된 모델이 다른 제공업체를 사용하더라도 구성된 주 모델보다 구성된 폴백을 먼저 시도합니다.
    - 폴백 실행기에 명시적인 폴백 재정의가 제공되지 않은 경우 앞선 후보가 모두 소진된 뒤 체인이 정상 기본값으로 돌아갈 수 있도록 구성된 주 모델을 끝에 추가합니다.
    - 호출자가 `fallbacksOverride`를 제공하면 실행기는 요청된 모델과 해당 재정의 목록만 정확히 사용합니다. 빈 목록은 모델 폴백을 비활성화하고 구성된 주 모델이 숨겨진 재시도 대상으로 추가되는 것을 방지합니다.

  </Accordion>
</AccordionGroup>

### 폴백을 진행시키는 오류

<Tabs>
  <Tab title="계속 진행하는 경우">
    - 인증 실패
    - 속도 제한 및 쿨다운 소진
    - 과부하/제공업체 사용 중 오류
    - 시간 초과 형태의 장애 조치 오류
    - 결제로 인한 비활성화
    - 오래된 영구 저장 모델이 외부 재시도 루프를 생성하지 않도록 장애 조치 경로로 정규화되는 `LiveSessionModelSwitchError`
    - 아직 남은 후보가 있을 때의 기타 인식되지 않은 오류

  </Tab>
  <Tab title="계속 진행하지 않는 경우">
    - 시간 초과/장애 조치 형태가 아닌 명시적 중단
    - Compaction/재시도 로직 내부에서 처리되어야 하는 컨텍스트 오버플로 오류(예: `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model`, `ollama error: context length exceeded`)
    - 남은 후보가 없을 때의 최종 알 수 없는 오류
    - Claude Fable 5 안전 거부. 직접 API 키 요청은 대신 Anthropic의 서버 측 `claude-opus-4-8` 폴백을 통해 제공업체 수준에서 이를 처리합니다([Anthropic](/ko/providers/anthropic#safety-refusal-fallback-claude-fable-5) 참조).

  </Tab>
</Tabs>

### 쿨다운 건너뛰기와 탐색 동작

한 제공업체의 모든 인증 프로필이 이미 쿨다운 상태일 때도 OpenClaw는 해당 제공업체를 자동으로 영구히 건너뛰지 않습니다. 후보별로 결정합니다.

<AccordionGroup>
  <Accordion title="후보별 결정">
    - 지속적인 인증 실패는 전체 제공업체를 즉시 건너뜁니다.
    - 결제로 인한 비활성화는 일반적으로 건너뛰지만, 재시작하지 않고도 복구할 수 있도록 주 후보를 제한된 빈도로 계속 탐색할 수 있습니다.
    - 주 후보는 제공업체별 제한에 따라 쿨다운 만료가 가까워지면 탐색될 수 있습니다.
    - 실패가 일시적인 것으로 보이는 경우(`rate_limit`, `overloaded` 또는 알 수 없음), 쿨다운 상태에서도 동일 제공업체의 형제 폴백을 시도할 수 있습니다. 이는 속도 제한이 모델 범위에 적용되어 형제 모델이 즉시 복구될 수 있을 때 특히 중요합니다.
    - 단일 제공업체가 제공업체 간 폴백을 지연시키지 않도록 일시적 쿨다운 탐색은 폴백 실행당 제공업체별 한 번으로 제한됩니다.

  </Accordion>
</AccordionGroup>

## 세션 재정의 및 실시간 모델 전환

세션 모델 변경은 공유 상태입니다. 활성 실행기, `/model` 명령, Compaction/세션 업데이트 및 실시간 세션 조정은 모두 동일한 세션 항목의 일부를 읽거나 씁니다.

따라서 폴백 재시도는 실시간 모델 전환과 조정되어야 합니다.

- 명시적으로 사용자가 수행한 모델 변경만 대기 중인 실시간 전환으로 표시됩니다. 여기에는 `/model`, `session_status(model=...)`, `sessions.patch`가 포함됩니다.
- 폴백 전환, Heartbeat 재정의 또는 Compaction과 같이 시스템이 수행한 모델 변경은 그 자체로 대기 중인 실시간 전환으로 표시되지 않습니다.
- 사용자가 수행한 모델 재정의는 폴백 정책에서 정확한 선택으로 취급되므로 연결할 수 없는 선택된 제공업체가 `agents.defaults.model.fallbacks`에 가려지는 대신 실패로 표시됩니다.
- 폴백 재시도가 시작되기 전에 응답 실행기는 선택된 폴백 재정의 필드를 세션 항목에 영구 저장합니다.
- 이후 대화에서도 자동 폴백 재정의가 계속 선택된 상태로 유지되므로 OpenClaw는 모든 메시지마다 실패한 것으로 알려진 주 모델을 탐색하지 않습니다. OpenClaw는 구성된 원래 모델을 주기적으로 다시 탐색하고 복구되면 자동 재정의를 해제합니다. `/new`, `/reset`, `sessions.reset`은 자동으로 설정된 재정의를 즉시 해제합니다.
- 사용자 응답은 폴백 전환과 폴백 해제 후 복구를 상태 변경당 한 번 알립니다. 고정된 폴백 상태의 후속 대화에서는 알림을 반복하지 않습니다.
- `/status`는 선택된 모델을 표시하며, 폴백 상태가 다르면 활성 폴백 모델과 이유도 표시합니다.
- 실시간 세션 조정은 오래된 런타임 모델 필드보다 영구 저장된 세션 재정의를 우선합니다.
- 실시간 전환 오류가 활성 폴백 체인의 뒤쪽 후보를 가리키면 OpenClaw는 먼저 관련 없는 후보를 순회하지 않고 선택된 해당 모델로 바로 이동합니다.
- 폴백 시도가 실패하면 실행기는 자신이 기록한 재정의 필드만 롤백하며, 해당 필드가 여전히 실패한 후보와 일치하는 경우에만 롤백합니다.

이렇게 하면 다음과 같은 전형적인 경합이 방지됩니다.

<Steps>
  <Step title="주 모델 실패">
    선택된 주 모델이 실패합니다.
  </Step>
  <Step title="메모리에서 폴백 선택">
    메모리에서 폴백 후보가 선택됩니다.
  </Step>
  <Step title="세션 저장소에는 여전히 이전 주 모델이 기록됨">
    세션 저장소에는 여전히 이전 주 모델이 반영되어 있습니다.
  </Step>
  <Step title="실시간 조정이 오래된 상태를 읽음">
    실시간 세션 조정이 오래된 세션 상태를 읽습니다.
  </Step>
  <Step title="재시도가 이전 상태로 되돌아감">
    폴백 시도가 시작되기 전에 재시도가 이전 모델로 되돌아갑니다.
  </Step>
</Steps>

영구 저장된 폴백 재정의는 이 간극을 해소하며, 제한적인 롤백은 더 최신의 수동 또는 런타임 세션 변경을 그대로 유지합니다.

## 관측 가능성 및 실패 요약

`runWithModelFallback(...)`은 로그와 사용자 대상 쿨다운 메시지에 사용되는 시도별 세부 정보를 기록합니다.

- 시도한 공급자/모델
- 사유(`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` 및 이와 유사한 장애 조치 사유)
- 선택적 상태/코드
- 사람이 읽을 수 있는 오류 요약

구조화된 `model_fallback_decision` 로그에는 후보가 실패하거나 건너뛰어지거나 이후 장애 조치가 성공할 때 평면형 `fallbackStep*` 필드도 포함됩니다. 이러한 필드는 시도한 전환을 명시적으로 나타내므로(`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), 최종 장애 조치도 실패한 경우에도 로그 및 진단 내보내기 도구가 최초 실패를 재구성할 수 있습니다.

모든 후보가 실패하면 OpenClaw는 `FallbackSummaryError`를 발생시킵니다. 외부 응답 실행기는 이를 사용해 "현재 모든 모델에 일시적으로 요청 속도 제한이 적용되어 있습니다"와 같이 더 구체적인 메시지를 작성하고, 확인 가능한 경우 가장 빠른 쿨다운 만료 시점을 포함할 수 있습니다.

이 쿨다운 요약은 모델을 인식합니다.

- 시도한 공급자/모델 체인과 무관한 모델 범위 요청 속도 제한은 무시됩니다.
- 남아 있는 차단이 일치하는 모델 범위 요청 속도 제한인 경우, OpenClaw는 해당 모델을 여전히 차단하는 마지막 일치 만료 시점을 보고합니다.

## 관련 구성

다음 항목은 [Gateway 구성](/ko/gateway/configuration)을 참조하세요.

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 라우팅

더 광범위한 모델 선택 및 장애 조치 개요는 [모델](/ko/concepts/models)을 참조하세요.
