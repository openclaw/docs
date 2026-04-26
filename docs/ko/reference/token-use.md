---
read_when:
    - 토큰 사용량, 비용 또는 컨텍스트 윈도 설명하기
    - 컨텍스트 증가 또는 Compaction 동작 디버깅하기
summary: OpenClaw가 프롬프트 컨텍스트를 구성하고 토큰 사용량 및 비용을 보고하는 방식
title: 토큰 사용량 및 비용
x-i18n:
    generated_at: "2026-04-26T11:39:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 828b282103902f55d65ce820c17753c2602169eff068bcea36e629759002f28d
    source_path: reference/token-use.md
    workflow: 15
---

# 토큰 사용량 및 비용

OpenClaw는 문자 수가 아니라 **토큰**을 추적합니다. 토큰은 모델마다 다르지만,
대부분의 OpenAI 스타일 모델은 영어 텍스트에서 평균적으로 토큰당 약 4문자 정도입니다.

## system prompt가 구성되는 방식

OpenClaw는 매 실행마다 자체 system prompt를 조합합니다. 여기에는 다음이 포함됩니다.

- 도구 목록 + 짧은 설명
- Skills 목록(메타데이터만, 지침은 필요할 때 `read`로 로드됨).
  압축된 skills 블록은 `skills.limits.maxSkillsPromptChars`로 제한되며,
  에이전트별 재정의는
  `agents.list[].skillsLimits.maxSkillsPromptChars`에서 가능합니다.
- self-update 지침
- 워크스페이스 + bootstrap 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, 새 파일인 경우 `BOOTSTRAP.md`, 존재할 경우 `MEMORY.md`). 소문자 루트 `memory.md`는 주입되지 않으며, `MEMORY.md`와 함께 있을 때 `openclaw doctor --fix`의 레거시 복구 입력용입니다. 큰 파일은 `agents.defaults.bootstrapMaxChars`(기본값: 12000)로 잘리며, 전체 bootstrap 주입은 `agents.defaults.bootstrapTotalMaxChars`(기본값: 60000)로 제한됩니다. `memory/*.md` 일일 파일은 일반 bootstrap prompt에 포함되지 않으며, 일반 턴에서는 메모리 도구를 통한 on-demand 방식으로만 사용됩니다. 다만 순수한 `/new`와 `/reset`은 첫 턴에 한해 최근 일일 메모리를 포함한 일회성 startup-context 블록을 앞에 추가할 수 있습니다. 이 startup prelude는 `agents.defaults.startupContext`로 제어됩니다.
- 시간(UTC + 사용자 시간대)
- reply tag + Heartbeat 동작
- 런타임 메타데이터(호스트/OS/모델/thinking)

전체 분해 내용은 [System Prompt](/ko/concepts/system-prompt)를 참고하세요.

## 컨텍스트 윈도에 포함되는 항목

모델이 받는 모든 내용은 컨텍스트 제한에 포함됩니다.

- system prompt(위에 나열된 모든 섹션)
- 대화 기록(사용자 + assistant 메시지)
- 도구 호출 및 도구 결과
- 첨부/transcript(image, audio, file)
- Compaction 요약 및 pruning artifact
- provider wrapper 또는 safety header(보이지 않더라도 여전히 계산됨)

일부 런타임 중심 표면은 자체적인 명시적 상한을 가집니다.

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

에이전트별 재정의는 `agents.list[].contextLimits` 아래에 있습니다. 이러한 설정은
제한된 런타임 발췌와 런타임 소유 주입 블록을 위한 것입니다. bootstrap 제한,
startup-context 제한, skills prompt 제한과는 별개입니다.

image의 경우 OpenClaw는 provider 호출 전에 transcript/tool image payload를 축소합니다.
이를 조정하려면 `agents.defaults.imageMaxDimensionPx`(기본값: `1200`)를 사용하세요.

- 더 낮은 값은 일반적으로 vision 토큰 사용량과 payload 크기를 줄입니다.
- 더 높은 값은 OCR/UI 중심 스크린샷에서 더 많은 시각적 세부 정보를 보존합니다.

실용적인 분해 정보(주입된 파일별, 도구, Skills, system prompt 크기)는 `/context list` 또는 `/context detail`을 사용하세요. [Context](/ko/concepts/context)를 참고하세요.

## 현재 토큰 사용량 확인 방법

채팅에서 다음 명령을 사용하세요.

- `/status` → 세션 모델, 컨텍스트 사용량,
  마지막 응답의 입력/출력 토큰, **예상 비용**(API 키만)을 보여주는
  **이모지 중심 상태 카드**
- `/usage off|tokens|full` → 모든 응답에 **응답별 사용량 footer**를 추가
  - 세션별로 유지됨(`responseUsage`로 저장)
  - OAuth 인증은 **비용을 숨기고** 토큰만 표시
- `/usage cost` → OpenClaw 세션 로그 기반 로컬 비용 요약 표시

다른 표면:

- **TUI/Web TUI:** `/status`와 `/usage` 지원
- **CLI:** `openclaw status --usage`와 `openclaw channels list`는
  정규화된 provider quota window를 표시합니다(`X% left`, 응답별 비용 아님).
  현재 usage-window provider: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai

사용량 표면은 표시 전에 일반적인 provider 기본 필드 별칭을 정규화합니다.
OpenAI 계열 Responses 트래픽의 경우 `input_tokens` / `output_tokens`와
`prompt_tokens` / `completion_tokens`가 모두 포함되므로 transport별
필드 이름이 `/status`, `/usage`, 세션 요약을 바꾸지 않습니다.
Gemini CLI JSON 사용량도 정규화됩니다. 응답 텍스트는 `response`에서 오고,
CLI가 명시적 `stats.input` 필드를 생략하면 `stats.cached`는 `cacheRead`로,
`stats.input_tokens - stats.cached`는 입력으로 사용됩니다.
기본 OpenAI 계열 Responses 트래픽의 경우 WebSocket/SSE 사용량 별칭도 같은 방식으로 정규화되며, `total_tokens`가 없거나 `0`이면 정규화된 입력 + 출력으로 총합을 계산합니다.
현재 세션 스냅샷이 희소한 경우 `/status`와 `session_status`는 가장 최근 transcript 사용 로그에서 토큰/캐시 카운터와 활성 런타임 모델 레이블을 복구할 수도 있습니다. 기존의 0이 아닌 live 값은 여전히 transcript 폴백 값보다 우선하며, 저장된 총합이 없거나 더 작을 경우 더 큰 prompt 지향 transcript 총합이 우선할 수 있습니다.
provider quota window용 usage auth는 가능할 때 provider 전용 hook에서 오고, 그렇지 않으면 OpenClaw는 auth profile, env 또는 config의 일치하는 OAuth/API key 자격 증명으로 폴백합니다.
assistant transcript 항목은 활성 모델에 가격이 구성되어 있고 provider가 사용량 메타데이터를 반환하면 `usage.cost`를 포함한 동일한 정규화 사용량 형태를 저장합니다. 이렇게 하면 live 런타임 상태가 사라진 뒤에도 `/usage cost`와 transcript 기반 세션 상태가 안정적인 소스를 가질 수 있습니다.

OpenClaw는 provider 사용량 집계를 현재 컨텍스트 스냅샷과 분리해서 유지합니다.
provider `usage.total`은 캐시된 입력, 출력, 여러 tool-loop 모델 호출을 포함할 수 있으므로 비용과 텔레메트리에는 유용하지만, 실제 live 컨텍스트 윈도를 과대평가할 수 있습니다. 컨텍스트 표시와 diagnostics는 `context.used`에 대해 최신 prompt 스냅샷(`promptTokens`, 또는 prompt 스냅샷이 없을 경우 마지막 모델 호출)을 사용합니다.

## 비용 추정(표시되는 경우)

비용은 모델 가격 config에서 추정됩니다.

```
models.providers.<provider>.models[].cost
```

이 값은 `input`, `output`, `cacheRead`, `cacheWrite` 각각에 대한 **백만 토큰당 USD**입니다. 가격 정보가 없으면 OpenClaw는 토큰만 표시합니다. OAuth 토큰은 달러 비용을 절대 표시하지 않습니다.

## 캐시 TTL과 pruning 영향

provider 프롬프트 캐싱은 캐시 TTL 창 내에서만 적용됩니다. OpenClaw는 선택적으로 **cache-ttl pruning**을 실행할 수 있습니다. 캐시 TTL이 만료되면 세션을 prunes한 뒤 캐시 창을 재설정하여 이후 요청이 전체 기록을 다시 캐싱하는 대신 새로 캐시된 컨텍스트를 재사용할 수 있게 합니다. 이렇게 하면 세션이 TTL을 넘겨 유휴 상태가 될 때 캐시 쓰기 비용을 줄일 수 있습니다.

이는 [Gateway configuration](/ko/gateway/configuration)에서 구성할 수 있으며,
동작 세부 정보는 [Session pruning](/ko/concepts/session-pruning)을 참고하세요.

Heartbeat는 유휴 구간 사이에서도 캐시를 **warm** 상태로 유지할 수 있습니다. 모델 캐시 TTL이 `1h`라면, Heartbeat 간격을 그보다 약간 짧게(예: `55m`) 설정하면 전체 프롬프트를 다시 캐싱하지 않아도 되어 cache write 비용을 줄일 수 있습니다.

멀티 에이전트 구성에서는 하나의 공유 모델 config를 유지하면서
`agents.list[].params.cacheRetention`으로 에이전트별 캐시 동작을 조정할 수 있습니다.

각 설정 항목에 대한 전체 가이드는 [Prompt Caching](/ko/reference/prompt-caching)을 참고하세요.

Anthropic API 가격에서는 cache read가 입력 토큰보다 훨씬 저렴하고,
cache write는 더 높은 배수로 과금됩니다. 최신 요금과 TTL 배수는 Anthropic의
prompt caching 가격 문서를 참고하세요:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 예시: Heartbeat로 1시간 캐시를 warm 상태로 유지

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

### 예시: 에이전트별 캐시 전략을 가진 혼합 트래픽

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # 대부분의 에이전트용 기본 기준값
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 깊은 세션을 위해 긴 캐시를 warm 상태로 유지
    - id: "alerts"
      params:
        cacheRetention: "none" # burst성 알림에 대해 cache write 회피
```

`agents.list[].params`는 선택된 모델의 `params` 위에 병합되므로,
`cacheRetention`만 재정의하고 다른 모델 기본값은 그대로 상속할 수 있습니다.

### 예시: Anthropic 1M 컨텍스트 beta header 활성화

Anthropic의 1M 컨텍스트 윈도는 현재 beta 게이트 뒤에 있습니다. OpenClaw는 지원되는 Opus 또는 Sonnet 모델에서 `context1m`을 활성화하면 필요한 `anthropic-beta` 값을 주입할 수 있습니다.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

이 설정은 Anthropic의 `context-1m-2025-08-07` beta header로 매핑됩니다.

이는 해당 모델 항목에 `context1m: true`가 설정된 경우에만 적용됩니다.

요구 사항: 자격 증명이 long-context 사용 자격이 있어야 합니다. 그렇지 않으면
Anthropic은 해당 요청에 대해 provider 측 rate limit 오류를 반환합니다.

Anthropic을 OAuth/구독 토큰(`sk-ant-oat-*`)으로 인증하는 경우,
Anthropic이 현재 이 조합을 HTTP 401로 거부하기 때문에 OpenClaw는
`context-1m-*` beta header를 건너뜁니다.

## 토큰 압력을 줄이는 팁

- 긴 세션은 `/compact`를 사용해 요약하세요.
- 워크플로에서 큰 도구 출력을 잘라내세요.
- 스크린샷이 많은 세션에는 `agents.defaults.imageMaxDimensionPx`를 낮추세요.
- skill 설명은 짧게 유지하세요(skill 목록은 prompt에 주입됨).
- 장황하고 탐색적인 작업에는 더 작은 모델을 선호하세요.

정확한 skill 목록 오버헤드 계산식은 [Skills](/ko/tools/skills)를 참고하세요.

## 관련 항목

- [API usage and costs](/ko/reference/api-usage-costs)
- [Prompt caching](/ko/reference/prompt-caching)
- [Usage tracking](/ko/concepts/usage-tracking)
