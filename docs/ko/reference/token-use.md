---
read_when:
    - 토큰 사용량, 비용 또는 컨텍스트 창 설명
    - 컨텍스트 증가 또는 Compaction 동작 디버깅
summary: OpenClaw가 프롬프트 컨텍스트를 구성하고 토큰 사용량 + 비용을 보고하는 방식
title: 토큰 사용량 및 비용
x-i18n:
    generated_at: "2026-04-30T06:50:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# 토큰 사용량 및 비용

OpenClaw는 문자가 아니라 **토큰**을 추적합니다. 토큰은 모델마다 다르지만, 대부분의
OpenAI 스타일 모델은 영어 텍스트에서 토큰당 평균 약 4자입니다.

## 시스템 프롬프트가 구성되는 방식

OpenClaw는 실행할 때마다 자체 시스템 프롬프트를 조립합니다. 여기에는 다음이 포함됩니다.

- 도구 목록 + 짧은 설명
- Skills 목록(메타데이터만 포함하며, 지침은 필요할 때 `read`로 로드됩니다).
  압축된 Skills 블록은 `skills.limits.maxSkillsPromptChars`로 제한되며,
  에이전트별 선택적 재정의는
  `agents.list[].skillsLimits.maxSkillsPromptChars`에 있습니다.
- 자체 업데이트 지침
- 작업 공간 + 부트스트랩 파일(새로 생성될 때의 `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, 그리고 존재하는 경우 `MEMORY.md`). 소문자 루트 `memory.md`는 주입되지 않습니다. `MEMORY.md`와 함께 있을 때 `openclaw doctor --fix`의 레거시 복구 입력입니다. 큰 파일은 `agents.defaults.bootstrapMaxChars`(기본값: 12000)에 의해 잘리고, 전체 부트스트랩 주입은 `agents.defaults.bootstrapTotalMaxChars`(기본값: 60000)로 제한됩니다. `memory/*.md` 일일 파일은 일반 부트스트랩 프롬프트의 일부가 아닙니다. 일반 턴에서는 메모리 도구를 통해 필요할 때만 사용되지만, 재설정/시작 모델 실행은 첫 턴에 최근 일일 메모리가 포함된 일회성 시작 컨텍스트 블록을 앞에 붙일 수 있습니다. 순수 채팅 `/new` 및 `/reset` 명령은 모델을 호출하지 않고 확인됩니다. 시작 프렐류드는 `agents.defaults.startupContext`로 제어됩니다.
- 시간(UTC + 사용자 시간대)
- 응답 태그 + Heartbeat 동작
- 런타임 메타데이터(호스트/OS/모델/사고)

전체 세부 내역은 [시스템 프롬프트](/ko/concepts/system-prompt)를 참조하세요.

## 컨텍스트 창에 포함되는 항목

모델이 받는 모든 것은 컨텍스트 제한에 포함됩니다.

- 시스템 프롬프트(위에 나열된 모든 섹션)
- 대화 기록(사용자 + 어시스턴트 메시지)
- 도구 호출 및 도구 결과
- 첨부 파일/스크립트(이미지, 오디오, 파일)
- Compaction 요약 및 가지치기 산출물
- 제공자 래퍼 또는 안전 헤더(보이지 않지만 여전히 계산됨)

일부 런타임 사용량이 많은 표면에는 자체 명시적 제한이 있습니다.

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

에이전트별 재정의는 `agents.list[].contextLimits` 아래에 있습니다. 이 조정값들은
제한된 런타임 발췌와 런타임 소유 주입 블록을 위한 것입니다. 부트스트랩 제한,
시작 컨텍스트 제한, Skills 프롬프트 제한과는 별개입니다.

이미지의 경우, OpenClaw는 제공자 호출 전에 스크립트/도구 이미지 페이로드를 축소합니다.
이를 조정하려면 `agents.defaults.imageMaxDimensionPx`(기본값: `1200`)를 사용하세요.

- 낮은 값은 보통 비전 토큰 사용량과 페이로드 크기를 줄입니다.
- 높은 값은 OCR/UI 중심 스크린샷에서 더 많은 시각적 세부 정보를 보존합니다.

실용적인 세부 내역(주입된 파일별, 도구, Skills, 시스템 프롬프트 크기)은 `/context list` 또는 `/context detail`을 사용하세요. [컨텍스트](/ko/concepts/context)를 참조하세요.

## 현재 토큰 사용량을 확인하는 방법

채팅에서 다음을 사용하세요.

- `/status` → 세션 모델, 컨텍스트 사용량,
  마지막 응답 입력/출력 토큰, **예상 비용**(API 키만 해당)이 포함된 **이모지가 풍부한 상태 카드**입니다.
- `/usage off|tokens|full` → 모든 응답에 **응답별 사용량 푸터**를 추가합니다.
  - 세션별로 유지됩니다(`responseUsage`로 저장됨).
  - OAuth 인증은 **비용을 숨깁니다**(토큰만 표시).
- `/usage cost` → OpenClaw 세션 로그의 로컬 비용 요약을 표시합니다.

기타 표면:

- **TUI/Web TUI:** `/status` + `/usage`가 지원됩니다.
- **CLI:** `openclaw status --usage` 및 `openclaw channels list`는
  정규화된 제공자 할당량 창(`X% left`, 응답별 비용 아님)을 표시합니다.
  현재 사용량 창 제공자는 Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai입니다.

사용량 표면은 표시 전에 일반적인 제공자 네이티브 필드 별칭을 정규화합니다.
OpenAI 계열 Responses 트래픽의 경우 여기에는 `input_tokens` /
`output_tokens`와 `prompt_tokens` / `completion_tokens`가 모두 포함되므로, 전송별
필드 이름은 `/status`, `/usage` 또는 세션 요약을 변경하지 않습니다.
Gemini CLI JSON 사용량도 정규화됩니다. 응답 텍스트는 `response`에서 오며,
`stats.cached`는 `cacheRead`에 매핑되고, CLI가 명시적 `stats.input` 필드를 생략할 때는
`stats.input_tokens - stats.cached`가 사용됩니다.
네이티브 OpenAI 계열 Responses 트래픽의 경우 WebSocket/SSE 사용량 별칭도
같은 방식으로 정규화되며, `total_tokens`가 없거나 `0`일 때 합계는 정규화된 입력 + 출력으로 대체됩니다.
현재 세션 스냅샷이 희소한 경우, `/status`와 `session_status`는
가장 최근 스크립트 사용량 로그에서 토큰/캐시 카운터와 활성 런타임 모델 레이블도
복구할 수 있습니다. 기존의 0이 아닌 실시간 값은 여전히 스크립트 대체 값보다
우선하며, 저장된 합계가 없거나 더 작을 때 더 큰 프롬프트 중심
스크립트 합계가 우선할 수 있습니다.
제공자 할당량 창의 사용량 인증은 사용 가능한 경우 제공자별 훅에서 가져옵니다.
그렇지 않으면 OpenClaw는 인증 프로필, 환경 변수 또는 구성에서 일치하는 OAuth/API 키 자격 증명으로 대체합니다.
어시스턴트 스크립트 항목은 활성 모델에 가격이 구성되어 있고 제공자가
사용량 메타데이터를 반환할 때 `usage.cost`를 포함해 동일한 정규화된 사용량 형태를 유지합니다.
이렇게 하면 실시간 런타임 상태가 사라진 후에도 `/usage cost`와 스크립트 기반 세션
상태에 안정적인 소스가 제공됩니다.

OpenClaw는 제공자 사용량 계정을 현재 컨텍스트 스냅샷과 분리해 유지합니다.
제공자 `usage.total`에는 캐시된 입력, 출력, 여러
도구 루프 모델 호출이 포함될 수 있으므로 비용과 원격 분석에는 유용하지만
실시간 컨텍스트 창을 과대평가할 수 있습니다. 컨텍스트 표시와 진단은 `context.used`에 대해
최신 프롬프트 스냅샷(`promptTokens`, 또는 프롬프트 스냅샷을 사용할 수 없을 때 마지막 모델 호출)을 사용합니다.

## 비용 추정(표시되는 경우)

비용은 모델 가격 구성에서 추정됩니다.

```
models.providers.<provider>.models[].cost
```

이는 `input`, `output`, `cacheRead`, `cacheWrite`에 대해 **토큰 100만 개당 USD**입니다.
가격이 없으면 OpenClaw는 토큰만 표시합니다. OAuth 토큰은 절대 달러 비용을 표시하지 않습니다.

Gateway 시작 시에는 로컬 가격이 아직 없는 구성된 모델 참조에 대해
선택적 백그라운드 가격 부트스트랩도 수행합니다. 해당 부트스트랩은
원격 OpenRouter 및 LiteLLM 가격 카탈로그를 가져옵니다. 오프라인 또는 제한된 네트워크에서
이 시작 카탈로그 가져오기를 건너뛰려면 `models.pricing.enabled: false`를 설정하세요.
명시적 `models.providers.*.models[].cost` 항목은
로컬 비용 추정을 계속 구동합니다.

## 캐시 TTL 및 가지치기 영향

제공자 프롬프트 캐싱은 캐시 TTL 창 안에서만 적용됩니다. OpenClaw는
선택적으로 **cache-ttl 가지치기**를 실행할 수 있습니다. 캐시 TTL이
만료되면 세션을 가지치기한 다음 캐시 창을 재설정하여 후속 요청이
전체 기록을 다시 캐싱하는 대신 새로 캐시된 컨텍스트를 재사용할 수 있게 합니다. 이렇게 하면
세션이 TTL을 지나 유휴 상태가 되었을 때 캐시 쓰기 비용을 낮게 유지할 수 있습니다.

[Gateway 구성](/ko/gateway/configuration)에서 이를 구성하고,
동작 세부 정보는 [세션 가지치기](/ko/concepts/session-pruning)를 참조하세요.

Heartbeat는 유휴 간격 동안 캐시를 **따뜻하게** 유지할 수 있습니다. 모델 캐시 TTL이
`1h`인 경우 Heartbeat 간격을 그보다 약간 짧게(예: `55m`) 설정하면
전체 프롬프트를 다시 캐싱하는 일을 피하고 캐시 쓰기 비용을 줄일 수 있습니다.

다중 에이전트 설정에서는 공유 모델 구성 하나를 유지하면서
`agents.list[].params.cacheRetention`으로 에이전트별 캐시 동작을 조정할 수 있습니다.

전체 조정값별 가이드는 [프롬프트 캐싱](/ko/reference/prompt-caching)을 참조하세요.

Anthropic API 가격의 경우, 캐시 읽기는 입력 토큰보다 상당히 저렴한 반면
캐시 쓰기는 더 높은 배율로 청구됩니다. 최신 요율 및 TTL 배율은 Anthropic의
프롬프트 캐싱 가격을 참조하세요.
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 예: Heartbeat로 1시간 캐시를 따뜻하게 유지

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### 예: 에이전트별 캐시 전략이 있는 혼합 트래픽

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params`는 선택된 모델의 `params` 위에 병합되므로,
`cacheRetention`만 재정의하고 다른 모델 기본값은 변경 없이 상속할 수 있습니다.

### 예: Anthropic 1M 컨텍스트 베타 헤더 활성화

Anthropic의 1M 컨텍스트 창은 현재 베타로 제한되어 있습니다. OpenClaw는 지원되는 Opus
또는 Sonnet 모델에서 `context1m`을 활성화할 때 필요한
`anthropic-beta` 값을 주입할 수 있습니다.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

이는 Anthropic의 `context-1m-2025-08-07` 베타 헤더에 매핑됩니다.

이는 해당 모델 항목에 `context1m: true`가 설정된 경우에만 적용됩니다.

요구 사항: 자격 증명이 긴 컨텍스트 사용 자격을 갖추어야 합니다. 그렇지 않으면
Anthropic은 해당 요청에 대해 제공자 측 속도 제한 오류로 응답합니다.

OAuth/구독 토큰(`sk-ant-oat-*`)으로 Anthropic에 인증하는 경우
OpenClaw는 `context-1m-*` 베타 헤더를 건너뜁니다. Anthropic이 현재
해당 조합을 HTTP 401로 거부하기 때문입니다.

## 토큰 부담을 줄이는 팁

- 긴 세션을 요약하려면 `/compact`를 사용하세요.
- 워크플로에서 큰 도구 출력을 줄이세요.
- 스크린샷이 많은 세션에서는 `agents.defaults.imageMaxDimensionPx`를 낮추세요.
- Skill 설명을 짧게 유지하세요(Skill 목록은 프롬프트에 주입됩니다).
- 장황하고 탐색적인 작업에는 더 작은 모델을 선호하세요.

정확한 Skill 목록 오버헤드 공식은 [Skills](/ko/tools/skills)를 참조하세요.

## 관련 항목

- [API 사용량 및 비용](/ko/reference/api-usage-costs)
- [프롬프트 캐싱](/ko/reference/prompt-caching)
- [사용량 추적](/ko/concepts/usage-tracking)
