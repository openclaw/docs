---
read_when:
    - 토큰 사용량, 비용 또는 컨텍스트 창 설명하기
    - 컨텍스트 증가 또는 Compaction 동작 디버깅하기
summary: OpenClaw가 프롬프트 컨텍스트를 구성하고 토큰 사용량 및 비용을 보고하는 방법
title: 토큰 사용량 및 비용
x-i18n:
    generated_at: "2026-04-15T19:42:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a706d3df8b2ea1136b3535d216c6b358e43aee2a31a4759824385e1345e6fe5
    source_path: reference/token-use.md
    workflow: 15
---

# 토큰 사용량 및 비용

OpenClaw는 문자 수가 아니라 **토큰**을 추적합니다. 토큰은 모델별로 다르지만, 대부분의 OpenAI 스타일 모델은 영어 텍스트에서 토큰당 평균 약 4자를 사용합니다.

## 시스템 프롬프트가 구성되는 방법

OpenClaw는 실행할 때마다 자체 시스템 프롬프트를 조합합니다. 여기에는 다음이 포함됩니다.

- 도구 목록 + 짧은 설명
- Skills 목록(메타데이터만 포함, 지침은 필요할 때 `read`로 로드됨).
  간결한 skills 블록은 `skills.limits.maxSkillsPromptChars`로 제한되며,
  에이전트별 선택적 오버라이드는
  `agents.list[].skillsLimits.maxSkillsPromptChars`에 있습니다.
- 자체 업데이트 지침
- 워크스페이스 + 부트스트랩 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, 새 경우에만 `BOOTSTRAP.md`, 그리고 `MEMORY.md`가 있으면 그것을, 없으면 소문자 대체 파일 `memory.md`). 큰 파일은 `agents.defaults.bootstrapMaxChars`(기본값: 12000)로 잘리며, 전체 부트스트랩 주입은 `agents.defaults.bootstrapTotalMaxChars`(기본값: 60000)로 제한됩니다. `memory/*.md` 일별 파일은 일반 부트스트랩 프롬프트의 일부가 아닙니다. 일반 턴에서는 메모리 도구를 통해 필요할 때만 유지되지만, 순수 `/new` 및 `/reset`은 첫 턴에 대해 최근 일별 메모리가 포함된 일회성 시작 컨텍스트 블록을 앞에 붙일 수 있습니다. 이 시작 프렐류드는 `agents.defaults.startupContext`로 제어됩니다.
- 시간(UTC + 사용자 시간대)
- 응답 태그 + Heartbeat 동작
- 런타임 메타데이터(호스트/OS/모델/사고 수준)

전체 세부 항목은 [시스템 프롬프트](/ko/concepts/system-prompt)를 참고하세요.

## 컨텍스트 창에 포함되는 항목

모델이 받는 모든 것은 컨텍스트 제한에 포함됩니다.

- 시스템 프롬프트(위에 나열된 모든 섹션)
- 대화 기록(사용자 + 어시스턴트 메시지)
- 도구 호출 및 도구 결과
- 첨부 파일/전사본(이미지, 오디오, 파일)
- Compaction 요약 및 가지치기 아티팩트
- 프로바이더 래퍼 또는 안전 헤더(보이지 않더라도 포함됨)

일부 런타임 비중이 큰 표면에는 별도의 명시적 제한이 있습니다.

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

에이전트별 오버라이드는 `agents.list[].contextLimits` 아래에 있습니다. 이 설정값은 제한된 런타임 발췌와 런타임 소유 주입 블록에 사용됩니다. 이는 부트스트랩 제한, 시작 컨텍스트 제한, skills 프롬프트 제한과는 별개입니다.

이미지의 경우, OpenClaw는 프로바이더 호출 전에 전사/도구 이미지 페이로드를 축소합니다.
이를 조정하려면 `agents.defaults.imageMaxDimensionPx`(기본값: `1200`)를 사용하세요.

- 값을 낮추면 일반적으로 비전 토큰 사용량과 페이로드 크기가 줄어듭니다.
- 값을 높이면 OCR/UI 중심 스크린샷에서 더 많은 시각적 세부 정보를 유지할 수 있습니다.

실용적인 세부 항목(주입된 파일별, 도구, skills, 시스템 프롬프트 크기별)을 보려면 `/context list` 또는 `/context detail`을 사용하세요. [Context](/ko/concepts/context)를 참고하세요.

## 현재 토큰 사용량을 확인하는 방법

채팅에서 다음을 사용하세요.

- `/status` → 세션 모델, 컨텍스트 사용량,
  마지막 응답 입력/출력 토큰, **추정 비용**(API 키만 해당)을 보여주는 **이모지 중심 상태 카드**.
- `/usage off|tokens|full` → 모든 응답에 **응답별 사용량 푸터**를 추가합니다.
  - 세션별로 유지됩니다(`responseUsage`로 저장됨).
  - OAuth 인증은 **비용을 숨깁니다**(토큰만 표시).
- `/usage cost` → OpenClaw 세션 로그의 로컬 비용 요약을 표시합니다.

기타 표면:

- **TUI/Web TUI:** `/status` + `/usage`를 지원합니다.
- **CLI:** `openclaw status --usage` 및 `openclaw channels list`는
  정규화된 프로바이더 할당량 창(`X% left`, 응답별 비용 아님)을 보여줍니다.
  현재 사용량 창 프로바이더: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai.

사용량 표면은 표시 전에 일반적인 프로바이더 고유 필드 별칭을 정규화합니다.
OpenAI 계열 Responses 트래픽의 경우 여기에는 `input_tokens` /
`output_tokens`와 `prompt_tokens` / `completion_tokens`가 모두 포함되므로, 전송별 필드 이름 차이가 `/status`, `/usage`, 또는 세션 요약에 영향을 주지 않습니다.
Gemini CLI JSON 사용량도 정규화됩니다. 응답 텍스트는 `response`에서 가져오고,
CLI가 명시적 `stats.input` 필드를 생략할 때는 `stats.cached`가 `cacheRead`로 매핑되며 `stats.input_tokens - stats.cached`가 사용됩니다.
네이티브 OpenAI 계열 Responses 트래픽의 경우, WebSocket/SSE 사용량 별칭도 같은 방식으로 정규화되며, `total_tokens`가 없거나 `0`이면 총계는 정규화된 입력 + 출력으로 대체됩니다.
현재 세션 스냅샷이 충분하지 않을 때 `/status`와 `session_status`는
가장 최근의 전사 사용량 로그에서 토큰/캐시 카운터와 활성 런타임 모델 레이블을 복구할 수도 있습니다. 기존의 0이 아닌 라이브 값은 여전히 전사 대체 값보다 우선하며, 저장된 총계가 없거나 더 작을 때는 더 큰 프롬프트 지향 전사 총계가 선택될 수 있습니다.
프로바이더 할당량 창의 사용량 인증은 가능한 경우 프로바이더별 훅에서 오며, 그렇지 않으면 OpenClaw는 인증 프로필, env 또는 config의 일치하는 OAuth/API 키 자격 증명으로 대체합니다.

## 비용 추정(표시되는 경우)

비용은 모델 가격 설정을 기준으로 추정됩니다.

```
models.providers.<provider>.models[].cost
```

이 값은 `input`, `output`, `cacheRead`, `cacheWrite`에 대한 **100만 토큰당 USD**입니다. 가격 정보가 없으면 OpenClaw는 토큰만 표시합니다. OAuth 토큰은 달러 비용을 절대 표시하지 않습니다.

## 캐시 TTL 및 가지치기의 영향

프로바이더 프롬프트 캐싱은 캐시 TTL 창 내에서만 적용됩니다. OpenClaw는 선택적으로 **cache-ttl pruning**을 실행할 수 있습니다. 캐시 TTL이 만료되면 세션을 가지치기하고, 이후 요청이 전체 기록을 다시 캐시하는 대신 새로 캐시된 컨텍스트를 재사용할 수 있도록 캐시 창을 재설정합니다. 이렇게 하면 세션이 TTL을 넘겨 유휴 상태가 될 때 캐시 쓰기 비용을 더 낮게 유지할 수 있습니다.

이는 [Gateway configuration](/ko/gateway/configuration)에서 설정하고, 동작 세부 정보는 [Session pruning](/ko/concepts/session-pruning)에서 확인하세요.

Heartbeat는 유휴 구간 사이에서도 캐시를 **따뜻한 상태**로 유지할 수 있습니다. 모델 캐시 TTL이 `1h`인 경우, Heartbeat 간격을 그보다 약간 짧게(예: `55m`) 설정하면 전체 프롬프트를 다시 캐시하지 않아도 되어 캐시 쓰기 비용을 줄일 수 있습니다.

멀티 에이전트 구성에서는 하나의 공유 모델 설정을 유지하면서
`agents.list[].params.cacheRetention`으로 에이전트별 캐시 동작을 조정할 수 있습니다.

각 설정값에 대한 전체 가이드는 [Prompt Caching](/ko/reference/prompt-caching)을 참고하세요.

Anthropic API 가격 책정에서는 cache read가 input 토큰보다 훨씬 저렴한 반면,
cache write는 더 높은 배수로 청구됩니다. 최신 요율과 TTL 배수는 Anthropic의 프롬프트 캐싱 가격 문서를 참고하세요:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 예시: Heartbeat로 1시간 캐시를 따뜻하게 유지

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

### 예시: 에이전트별 캐시 전략을 사용하는 혼합 트래픽

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # 대부분의 에이전트를 위한 기본 기준선
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 긴 세션을 위해 장기 캐시를 따뜻하게 유지
    - id: "alerts"
      params:
        cacheRetention: "none" # 버스트성 알림에 대한 캐시 쓰기 방지
```

`agents.list[].params`는 선택된 모델의 `params` 위에 병합되므로,
`cacheRetention`만 오버라이드하고 다른 모델 기본값은 그대로 상속할 수 있습니다.

### 예시: Anthropic 1M 컨텍스트 베타 헤더 활성화

Anthropic의 1M 컨텍스트 창은 현재 베타 게이트가 적용되어 있습니다. OpenClaw는 지원되는 Opus 또는 Sonnet 모델에서 `context1m`을 활성화하면 필요한 `anthropic-beta` 값을 주입할 수 있습니다.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

이는 Anthropic의 `context-1m-2025-08-07` 베타 헤더에 매핑됩니다.

이 설정은 해당 모델 항목에 `context1m: true`가 설정된 경우에만 적용됩니다.

요구 사항: 자격 증명은 장문 컨텍스트 사용 자격이 있어야 합니다. 그렇지 않으면,
Anthropic은 해당 요청에 대해 프로바이더 측 속도 제한 오류를 반환합니다.

Anthropic을 OAuth/구독 토큰(`sk-ant-oat-*`)으로 인증하는 경우,
Anthropic이 현재 그 조합을 HTTP 401로 거부하므로 OpenClaw는 `context-1m-*` 베타 헤더를 건너뜁니다.

## 토큰 압박을 줄이기 위한 팁

- 긴 세션을 요약하려면 `/compact`를 사용하세요.
- 워크플로에서 큰 도구 출력을 줄이세요.
- 스크린샷이 많은 세션에서는 `agents.defaults.imageMaxDimensionPx`를 낮추세요.
- skill 설명은 짧게 유지하세요(skill 목록은 프롬프트에 주입됨).
- 장황하고 탐색적인 작업에는 더 작은 모델을 선호하세요.

정확한 skill 목록 오버헤드 계산식은 [Skills](/ko/tools/skills)를 참고하세요.
