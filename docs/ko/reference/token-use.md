---
read_when:
    - 토큰 사용량, 비용 또는 컨텍스트 창 설명하기
    - 컨텍스트 증가 또는 Compaction 동작 디버깅
summary: OpenClaw가 프롬프트 컨텍스트를 구성하고 토큰 사용량 및 비용을 보고하는 방식
title: 토큰 사용량 및 비용
x-i18n:
    generated_at: "2026-07-01T18:10:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw는 문자가 아니라 **토큰**을 추적합니다. 토큰은 모델마다 다르지만, 대부분의
OpenAI 스타일 모델은 영어 텍스트 기준 토큰당 평균 약 4자입니다.

## 시스템 프롬프트가 구성되는 방식

OpenClaw는 실행할 때마다 자체 시스템 프롬프트를 조립합니다. 여기에는 다음이 포함됩니다.

- 도구 목록 + 짧은 설명
- Skills 목록(메타데이터만 포함하며, 지침은 필요할 때 `read`로 로드됨).
  네이티브 Codex 턴은 간결한 Skills 블록을 턴 범위
  협업 개발자 지침으로 받으며, 다른 하네스는 일반
  프롬프트 표면에서 받습니다. 이는 `skills.limits.maxSkillsPromptChars`로 제한되며,
  `agents.list[].skillsLimits.maxSkillsPromptChars`에서 선택적 에이전트별 재정의를 설정할 수 있습니다.
- 자체 업데이트 지침
- 작업 영역 + 부트스트랩 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`(새 항목인 경우), 그리고 존재하는 경우 `MEMORY.md`). 네이티브 Codex 턴은 해당 작업 영역에서 메모리 도구를 사용할 수 있을 때 구성된 에이전트 작업 영역의 원시 `MEMORY.md`를 붙여 넣지 않습니다. 대신 턴 범위 협업 개발자 지침에 작은 메모리 포인터를 포함하고, 필요할 때 메모리 도구를 사용합니다. 도구가 비활성화되었거나, 메모리 검색을 사용할 수 없거나, 활성 작업 영역이 에이전트 메모리 작업 영역과 다르면 `MEMORY.md`는 일반적인 제한된 턴 컨텍스트 경로를 사용합니다. 소문자 루트 `memory.md`는 삽입되지 않습니다. 이는 `MEMORY.md`와 함께 있을 때 `openclaw doctor --fix`의 레거시 복구 입력입니다. 큰 삽입 파일은 `agents.defaults.bootstrapMaxChars`(기본값: 20000)에 의해 잘리며, 전체 부트스트랩 삽입은 `agents.defaults.bootstrapTotalMaxChars`(기본값: 60000)로 제한됩니다. `memory/*.md` 일일 파일은 일반 부트스트랩 프롬프트의 일부가 아닙니다. 일반 턴에서는 메모리 도구를 통해 온디맨드로 유지되지만, 리셋/시작 모델 실행은 첫 번째 턴에 대해 최근 일일 메모리가 포함된 일회성 시작 컨텍스트 블록을 앞에 붙일 수 있습니다. 순수 채팅 `/new` 및 `/reset` 명령은 모델을 호출하지 않고 확인됩니다. 시작 프렐류드는 `agents.defaults.startupContext`로 제어됩니다. Compaction 이후 AGENTS.md 발췌는 별도이며 명시적인 `agents.defaults.compaction.postCompactionSections` 옵트인이 필요합니다.
- 시간(UTC + 사용자 시간대)
- 답장 태그 + Heartbeat 동작
- 런타임 메타데이터(호스트/OS/모델/사고)

전체 세부 내용은 [시스템 프롬프트](/ko/concepts/system-prompt)를 참조하세요.

자격 증명 또는 인증 스니펫을 문서화할 때는 문서 전용 변경에서
비밀 스캐너 오탐을 피하기 위해
[비밀 Placeholder 규칙](/ko/reference/secret-placeholder-conventions)을 사용하세요.

## 컨텍스트 창에 포함되는 항목

모델이 받는 모든 항목은 컨텍스트 제한에 포함됩니다.

- 시스템 프롬프트(위에 나열된 모든 섹션)
- 대화 기록(사용자 + 어시스턴트 메시지)
- 도구 호출 및 도구 결과
- 첨부 파일/전사(이미지, 오디오, 파일)
- Compaction 요약 및 가지치기 산출물
- 공급자 래퍼 또는 안전 헤더(보이지 않지만 여전히 계산됨)

일부 런타임 비중이 큰 표면에는 자체 명시적 제한이 있습니다.

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

에이전트별 재정의는 `agents.list[].contextLimits` 아래에 있습니다. 이러한 노브는
제한된 런타임 발췌 및 런타임이 소유한 삽입 블록을 위한 것입니다. 이는
부트스트랩 제한, 시작 컨텍스트 제한, Skills 프롬프트
제한과 별개입니다.

`toolResultMaxChars`는 고급 상한입니다(최대 `1000000`자). 설정하지 않으면 OpenClaw는
유효한 모델 컨텍스트 창에서 실시간 도구 결과 상한을 선택합니다. 100K 토큰
미만에서는 `16000`자, 100K+ 토큰에서는 `32000`자, 200K+
토큰에서는 `64000`자이며, 여전히 런타임 컨텍스트 점유율 가드로 제한됩니다.

이미지의 경우 OpenClaw는 공급자 호출 전에 전사/도구 이미지 페이로드를 축소합니다.
이를 조정하려면 `agents.defaults.imageMaxDimensionPx`(기본값: `1200`)를 사용하세요.

- 낮은 값은 일반적으로 비전 토큰 사용량과 페이로드 크기를 줄입니다.
- 높은 값은 OCR/UI 중심 스크린샷에서 더 많은 시각적 세부 정보를 보존합니다.

실용적인 세부 내역(삽입 파일별, 도구, Skills, 시스템 프롬프트 크기)은 `/context list` 또는 `/context detail`을 사용하세요. [컨텍스트](/ko/concepts/context)를 참조하세요.

## 현재 토큰 사용량을 확인하는 방법

채팅에서 다음을 사용하세요.

- `/status` → 세션 모델, 컨텍스트 사용량,
  마지막 응답 입력/출력 토큰, 그리고 활성 모델에 대해 로컬 가격이
  구성된 경우 **예상 비용**이 포함된 **이모지가 풍부한 상태 카드**.
- `/usage off|tokens|full` → 모든 답장에 **응답별 사용량 푸터**를 추가합니다.
  - 세션별로 유지됩니다(`responseUsage`로 저장됨).
  - `/usage reset`(별칭: `inherit`, `clear`, `default`) — 세션
    재정의를 지워 세션이 구성된 기본값을 다시 상속하도록 합니다.
  - `/usage tokens`는 턴 토큰/캐시 세부 정보를 표시합니다.
  - `/usage full`은 간결한 모델/컨텍스트/비용 세부 정보를 표시합니다. 예상 비용은
    OpenClaw에 사용량 메타데이터와 활성 모델의 로컬 가격이 있을 때만 표시됩니다.
    사용자 지정 `messages.usageTemplate` 레이아웃에는 토큰/캐시 필드를 포함할 수 있습니다.
- `/usage cost` → OpenClaw 세션 로그의 로컬 비용 요약을 표시합니다.

기타 표면:

- **TUI/Web TUI:** `/status` + `/usage`가 지원됩니다.
- **CLI:** `openclaw status --usage` 및 `openclaw channels list`는
  정규화된 공급자 할당량 창(`응답별 비용`이 아니라 `X% left`)을 표시합니다.
  현재 사용량 창 공급자: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai.

사용량 표면은 표시 전에 일반적인 공급자 네이티브 필드 별칭을 정규화합니다.
OpenAI 계열 Responses 트래픽의 경우 `input_tokens` /
`output_tokens`와 `prompt_tokens` / `completion_tokens`를 모두 포함하므로, 전송 방식별
필드 이름이 `/status`, `/usage` 또는 세션 요약을 바꾸지 않습니다.
Gemini CLI 사용량도 정규화됩니다. 기본 `stream-json` 파서는
어시스턴트 `message` 이벤트를 읽고, `stats.cached`는 `cacheRead`에 매핑되며
CLI가 명시적 `stats.input` 필드를 생략할 때는 `stats.input_tokens - stats.cached`가 사용됩니다.
레거시 JSON 재정의는 여전히 `response`에서 답장 텍스트를 읽습니다.
네이티브 OpenAI 계열 Responses 트래픽의 경우 WebSocket/SSE 사용량 별칭도
동일한 방식으로 정규화되며, `total_tokens`가 없거나 `0`이면 총합은 정규화된 입력 + 출력으로 대체됩니다.
현재 세션 스냅샷이 희소할 때 `/status`와 `session_status`는
가장 최근 전사 사용량 로그에서 토큰/캐시 카운터와 활성 런타임 모델 라벨을
복구할 수도 있습니다. 기존의 0이 아닌 실시간 값은 여전히
전사 대체 값보다 우선하며, 저장된 총합이 없거나 더 작으면 더 큰 프롬프트 중심
전사 총합이 우선할 수 있습니다.
공급자 할당량 창의 사용량 인증은 사용할 수 있을 때
공급자별 훅에서 가져옵니다. 그렇지 않으면 OpenClaw는 인증 프로필, env 또는 config의
일치하는 OAuth/API 키 자격 증명으로 대체합니다.
어시스턴트 전사 항목은 활성 모델에 가격이 구성되어 있고 공급자가
사용량 메타데이터를 반환할 때 `usage.cost`를 포함해 동일한 정규화된 사용량 형태를 유지합니다.
이는 실시간 런타임 상태가 사라진 뒤에도 `/usage cost`와 전사 기반 세션
상태에 안정적인 소스를 제공합니다.

OpenClaw는 공급자 사용량 계산을 현재 컨텍스트
스냅샷과 분리해서 유지합니다. 공급자 `usage.total`에는 캐시된 입력, 출력, 여러
도구 루프 모델 호출이 포함될 수 있으므로 비용과 원격 측정에는 유용하지만
실시간 컨텍스트 창을 과대 표시할 수 있습니다. 컨텍스트 표시 및 진단은 `context.used`에
대해 최신 프롬프트 스냅샷(`promptTokens`, 또는 프롬프트 스냅샷을 사용할 수 없을 때 마지막 모델 호출)을 사용합니다.

## 비용 추정(표시되는 경우)

비용은 모델 가격 구성에서 추정됩니다.

```
models.providers.<provider>.models[].cost
```

이는 `input`, `output`, `cacheRead`, `cacheWrite`에 대한 **1백만 토큰당 USD**입니다.
가격이 없으면 `/usage full`은 비용을 생략합니다. 모든
답장에서 토큰/캐시 세부 정보가 필요하면 `/usage tokens` 또는 사용자 지정 `messages.usageTemplate`을 사용하세요.
비용 표시는 API 키 인증으로 제한되지 않습니다. `aws-sdk` 같은 비 API 키 공급자도
구성된 모델 항목에 로컬 가격이 포함되어 있고 공급자가 사용량 메타데이터를 반환하면
예상 비용을 표시할 수 있습니다.

사이드카와 채널이 Gateway 준비 경로에 도달한 후, OpenClaw는
아직 로컬 가격이 없는 구성된 모델 참조에 대해 선택적 백그라운드 가격 부트스트랩을 시작합니다.
해당 부트스트랩은 원격 OpenRouter 및 LiteLLM 가격 카탈로그를 가져옵니다.
오프라인 또는 제한된 네트워크에서 이러한 카탈로그 가져오기를 건너뛰려면
`models.pricing.enabled: false`를 설정하세요. 명시적인
`models.providers.*.models[].cost` 항목은 계속해서 로컬 비용
추정을 구동합니다.

## 캐시 TTL 및 가지치기 영향

공급자 프롬프트 캐싱은 캐시 TTL 창 안에서만 적용됩니다. OpenClaw는
선택적으로 **캐시 TTL 가지치기**를 실행할 수 있습니다. 캐시 TTL이
만료되면 세션을 가지치기한 다음 캐시 창을 재설정하여, 이후 요청이
전체 기록을 다시 캐싱하는 대신 새로 캐시된 컨텍스트를 재사용할 수 있게 합니다. 이렇게 하면 세션이 TTL을 지나 유휴 상태가 되었을 때
캐시 쓰기 비용을 낮게 유지할 수 있습니다.

[Gateway 구성](/ko/gateway/configuration)에서 설정하고
동작 세부 정보는 [세션 가지치기](/ko/concepts/session-pruning)를 참조하세요.

Heartbeat는 유휴 간격 동안 캐시를 **따뜻하게** 유지할 수 있습니다. 모델 캐시 TTL이
`1h`라면 Heartbeat 간격을 그보다 약간 짧게(예: `55m`) 설정하여
전체 프롬프트를 다시 캐싱하지 않고 캐시 쓰기 비용을 줄일 수 있습니다.

다중 에이전트 설정에서는 하나의 공유 모델 구성을 유지하고
`agents.list[].params.cacheRetention`으로 에이전트별 캐시 동작을 조정할 수 있습니다.

전체 노브별 가이드는 [프롬프트 캐싱](/ko/reference/prompt-caching)을 참조하세요.

Anthropic API 가격 책정에서 캐시 읽기는 입력 토큰보다 훨씬 저렴한 반면
캐시 쓰기는 더 높은 배수로 청구됩니다. 최신 요금과 TTL 배수는 Anthropic의
프롬프트 캐싱 가격을 참조하세요.
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 예: Heartbeat로 1시간 캐시를 따뜻하게 유지하기

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

### Anthropic 1M 컨텍스트

OpenClaw는 Opus 4.8, Opus 4.7, Opus 4.6,
Sonnet 4.6 같은 GA 지원 Claude 4.x 모델의 크기를 Anthropic의 1M 컨텍스트 창에 맞춥니다. 이러한 모델에는
`params.context1m: true`가 필요하지 않습니다.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

이전 구성은 `context1m: true`를 유지할 수 있지만, OpenClaw는 더 이상 이 설정에 대해
Anthropic의 폐기된 `context-1m-2025-08-07` 베타 헤더를 보내지 않으며
지원되지 않는 이전 Claude 모델을 1M으로 확장하지 않습니다.

요구 사항: 자격 증명은 긴 컨텍스트 사용 자격이 있어야 합니다. 그렇지 않으면
Anthropic은 해당 요청에 대해 공급자 측 속도 제한 오류로 응답합니다.

OAuth/구독 토큰(`sk-ant-oat-*`)으로 Anthropic에 인증하는 경우,
OpenClaw는 OAuth에 필요한 Anthropic 베타 헤더를 보존하면서
이전 구성에 남아 있는 경우 폐기된 `context-1m-*` 베타를 제거합니다.

## 토큰 압박을 줄이는 팁

- 긴 세션을 요약하려면 `/compact`를 사용하세요.
- 워크플로에서 큰 도구 출력은 줄이세요.
- 스크린샷이 많은 세션에서는 `agents.defaults.imageMaxDimensionPx`를 낮추세요.
- Skills 설명은 짧게 유지하세요(Skills 목록은 프롬프트에 주입됩니다).
- 장황하고 탐색적인 작업에는 더 작은 모델을 선호하세요.

정확한 Skills 목록 오버헤드 공식은 [Skills](/ko/tools/skills)를 참조하세요.

## 관련

- [API 사용량 및 비용](/ko/reference/api-usage-costs)
- [프롬프트 캐싱](/ko/reference/prompt-caching)
- [사용량 추적](/ko/concepts/usage-tracking)
