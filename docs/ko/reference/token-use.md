---
read_when:
    - 토큰 사용량, 비용 또는 컨텍스트 창 설명
    - 컨텍스트 증가 또는 Compaction 동작 디버깅
summary: OpenClaw가 프롬프트 컨텍스트를 구성하고 토큰 사용량과 비용을 보고하는 방식
title: 토큰 사용량 및 비용
x-i18n:
    generated_at: "2026-07-12T15:45:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw는 문자가 아니라 **토큰**을 추적합니다. 토큰은 모델마다 다르지만, 대부분의
OpenAI 스타일 모델은 영어 텍스트에서 토큰당 평균 약 4자입니다.

## 시스템 프롬프트가 구성되는 방식

OpenClaw는 실행할 때마다 자체 시스템 프롬프트를 구성합니다. 여기에는 다음이 포함됩니다.

- 도구 목록 + 간단한 설명
- Skills 목록(메타데이터만 포함하며, 지침은 필요할 때 `read`로 로드). 네이티브
  Codex 턴에는 간결한 Skills 블록이 턴 범위 협업 개발자 지침으로 제공되며,
  다른 하네스에서는 일반 프롬프트 영역에 제공됩니다.
  `skills.limits.maxSkillsPromptChars`로 제한되며, 에이전트별로
  `agents.list[].skillsLimits.maxSkillsPromptChars`에서 선택적으로 재정의할 수 있습니다.
- 자체 업데이트 지침
- 워크스페이스 + 부트스트랩 파일(새 워크스페이스의 `AGENTS.md`, `SOUL.md`, `TOOLS.md`,
  `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`와 존재하는 경우
  `MEMORY.md`). 삽입되는 대용량 파일은
  `agents.defaults.bootstrapMaxChars`(기본값: `20000`)에 따라 잘리며, 전체 부트스트랩
  삽입량은 `agents.defaults.bootstrapTotalMaxChars`(기본값:
  `60000`)로 제한됩니다.
  - 해당 워크스페이스에서 메모리 도구를 사용할 수 있는 경우, 네이티브 Codex 턴에는
    원본 `MEMORY.md`를 붙여 넣지 않습니다. 대신 턴 범위 협업 개발자 지침에 간단한
    메모리 포인터를 제공하고 필요할 때 메모리 도구를 사용합니다. 도구가 비활성화되었거나,
    메모리 검색을 사용할 수 없거나, 활성 워크스페이스가 에이전트 메모리 워크스페이스와
    다른 경우 `MEMORY.md`는 일반적인 제한된 턴 컨텍스트 경로로 대체됩니다.
  - 루트의 소문자 `memory.md`는 절대 삽입되지 않습니다. 이는
    `openclaw doctor --fix`가 `MEMORY.md`로 마이그레이션하는 레거시 복구 입력입니다.
  - `memory/*.md` 일별 파일은 일반 부트스트랩 프롬프트에 포함되지 않으며,
    일반 턴에서는 메모리 도구를 통해 필요할 때만 사용됩니다. 재설정/시작 모델 실행 시
    첫 번째 턴에 최근 일별 메모리가 포함된 일회성 시작 컨텍스트 블록을 앞에 추가할 수
    있으며, 이는 `agents.defaults.startupContext`로 제어됩니다. 단순 채팅 `/new`와
    `/reset`은 모델을 호출하지 않고 확인 응답만 보냅니다.
  - Compaction 후 `AGENTS.md` 발췌문은 별도이며
    `agents.defaults.compaction.postCompactionSections`를 명시적으로 활성화해야 합니다.
- 시간(UTC + 사용자 시간대)
- 응답 태그 + Heartbeat 동작
- 런타임 메타데이터(호스트/OS/모델/사고)

전체 구성은 [시스템 프롬프트](/ko/concepts/system-prompt)를 참조하십시오.

자격 증명 또는 인증 스니펫을 문서화할 때는 문서 전용 변경에서 비밀 스캐너의 오탐을
방지하기 위해 [비밀 플레이스홀더 규칙](/ko/reference/secret-placeholder-conventions)을
사용하십시오.

## 컨텍스트 창에 포함되는 항목

모델이 수신하는 모든 항목이 컨텍스트 제한에 포함됩니다.

- 시스템 프롬프트(위의 모든 섹션)
- 대화 기록(사용자 + 어시스턴트 메시지)
- 도구 호출 및 도구 결과
- 첨부 파일/트랜스크립트(이미지, 오디오, 파일)
- Compaction 요약 및 가지치기 산출물
- 공급자 래퍼 또는 안전 헤더(표시되지는 않지만 계산에는 포함됨)

런타임 사용량이 많은 영역에는 `agents.defaults.contextLimits` 아래에 명시적인 자체 제한이
있으며, 에이전트별 재정의는 `agents.list[].contextLimits` 아래에 있습니다.

| 키                       | 용도                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | 잘리기 전에 `memory_get`이 반환하는 최대 문자 수입니다.                  |
| `memoryGetDefaultLines`  | 요청에서 `lines`를 생략했을 때 기본 `memory_get` 줄 범위입니다.          |
| `toolResultMaxChars`     | 단일 실시간 도구 결과의 고급 상한입니다(최대 `1000000`자).               |
| `postCompactionMaxChars` | Compaction 후 새로 고침 중 `AGENTS.md`에서 유지되는 최대 문자 수입니다. |

이는 제한된 런타임 발췌문과 런타임 소유 삽입 블록이며, 부트스트랩 제한,
시작 컨텍스트 제한, Skills 프롬프트 제한과는 별개입니다.

`toolResultMaxChars`는 기본적으로 설정되지 않으므로, OpenClaw는 유효 모델 컨텍스트 창을
기준으로 실시간 도구 결과 제한을 산출합니다. 100K 토큰 미만에서는 `16000`자,
100K+ 토큰에서는 `32000`자, 200K+ 토큰에서는 `64000`자입니다.
더 큰 명시적 상한을 구성하더라도 런타임 컨텍스트 점유율 가드는 단일 도구 결과를
컨텍스트 창의 30%로 계속 제한합니다.

이미지의 경우 OpenClaw는 공급자 호출 전에 트랜스크립트/도구 이미지 페이로드를
축소합니다. `agents.defaults.imageMaxDimensionPx`(기본값:
`1200`)로 조정하십시오.

- 값을 낮추면 비전 토큰 사용량과 페이로드 크기가 줄어듭니다.
- 값을 높이면 OCR/UI 비중이 높은 스크린샷에서 시각적 세부 정보가 더 많이 보존됩니다.

삽입된 파일, 도구, Skills 및 시스템 프롬프트 크기별 실용적인 세부 내역을 확인하려면
`/context list` 또는 `/context detail`을 사용하십시오.
[컨텍스트](/ko/concepts/context)를 참조하십시오.

## 현재 토큰 사용량을 확인하는 방법

채팅에서:

- `/status` -> 세션 모델, 컨텍스트 사용량, 마지막 응답의 입력/출력 토큰, 활성 모델에
  로컬 가격이 구성된 경우 예상 비용을 표시하는 이모지가 풍부한 상태 카드입니다.
- `/usage off|tokens|full` -> 모든 응답에 응답별 사용량 바닥글을 추가합니다.
  세션별로 유지됩니다(`responseUsage`로 저장).
  - `/usage reset`(별칭: `inherit`, `clear`, `default`)은 세션 재정의를 지워
    구성된 기본값을 다시 상속하도록 합니다.
  - `/usage tokens`는 턴의 토큰/캐시 세부 정보를 표시합니다.
  - `/usage full`은 간결한 모델/컨텍스트/비용 세부 정보를 표시합니다. 예상 비용은
    OpenClaw에 활성 모델의 사용량 메타데이터와 로컬 가격이 모두 있는 경우에만
    표시됩니다. 사용자 지정 `messages.usageTemplate` 레이아웃에는
    토큰/캐시 필드를 포함할 수 있습니다.
- `/usage cost` -> OpenClaw 세션 로그에서 가져온 로컬 비용 요약입니다.

기타 영역:

- **TUI/웹 TUI:** `/status`와 `/usage`가 지원됩니다.
- **CLI:** `openclaw status --usage`와 `openclaw channels list`는 정규화된
  공급자 할당량 기간을 표시합니다(응답별 비용이 아닌 `X% left`). 현재 사용량 기간을
  지원하는 공급자는 Claude(Anthropic), ClawRouter, Copilot
  (GitHub), DeepSeek, Gemini(Google Gemini CLI), MiniMax, OpenAI, Xiaomi,
  Xiaomi Token Plan 및 z.ai입니다.

사용량 표시 영역은 표시 전에 일반적인 공급자 네이티브 필드 별칭을 정규화합니다.
OpenAI 계열 Responses 트래픽의 경우 여기에는 `input_tokens`/`output_tokens`와
`prompt_tokens`/`completion_tokens`가 모두 포함되므로, 전송 방식별 필드 이름이
`/status`, `/usage` 또는 세션 요약을 변경하지 않습니다. Gemini CLI 사용량도
정규화됩니다. 기본 `stream-json` 파서는 어시스턴트 `message` 이벤트를 읽고,
`stats.cached`는 `cacheRead`에 매핑되며, CLI가 명시적 `stats.input` 필드를
생략하면 `stats.input_tokens - stats.cached`가 사용됩니다. 레거시 JSON 재정의는
계속해서 `response`에서 응답 텍스트를 읽습니다.

네이티브 OpenAI 계열 Responses 트래픽의 경우 WebSocket/SSE 사용량 별칭도 동일한
방식으로 정규화되며, `total_tokens`가 없거나 `0`이면 합계는 정규화된 입력 + 출력으로
대체됩니다.

현재 세션 스냅샷에 정보가 부족하면 `/status`와 `session_status`는 가장 최근
트랜스크립트 사용량 로그에서 토큰/캐시 카운터와 활성 런타임 모델 레이블을 복구할 수
있습니다. 기존의 0이 아닌 실시간 값은 여전히 트랜스크립트 대체 값보다 우선하며, 저장된
합계가 없거나 더 작으면 더 큰 프롬프트 중심 트랜스크립트 합계가 우선할 수 있습니다.

공급자 할당량 기간의 사용량 인증은 먼저 공급자별 훅에서 가져옵니다. 공급자에 훅이
없거나 훅이 토큰을 확인하지 못하면 OpenClaw는 인증 프로필, 환경 변수 또는 구성에서
일치하는 OAuth/API 키 자격 증명으로 대체합니다.

어시스턴트 트랜스크립트 항목은 활성 모델에 가격이 구성되어 있고 공급자가 사용량
메타데이터를 반환하는 경우의 `usage.cost`를 포함하여 동일하게 정규화된 사용량 형태를
유지합니다. 이를 통해 실시간 런타임 상태가 사라진 후에도 `/usage cost`와 트랜스크립트
기반 세션 상태에 안정적인 소스가 제공됩니다.

OpenClaw는 공급자 사용량 계산을 현재 컨텍스트 스냅샷과 별도로 유지합니다. 공급자의
`usage.total`에는 캐시된 입력, 출력 및 여러 도구 루프 모델 호출이 포함될 수 있으므로
비용 및 원격 측정에는 유용하지만 실시간 컨텍스트 창을 과대 표시할 수 있습니다.
컨텍스트 표시와 진단은 `context.used`에 최신 프롬프트 스냅샷(`promptTokens`, 또는
프롬프트 스냅샷을 사용할 수 없는 경우 마지막 모델 호출)을 사용합니다.

## 비용 추정(표시되는 경우)

비용은 모델 가격 구성을 기준으로 추정됩니다.

```text
models.providers.<provider>.models[].cost
```

이는 `input`, `output`, `cacheRead`, `cacheWrite`에 대한 **100만 토큰당 USD**입니다.
가격 정보가 없으면 `/usage full`은 비용을 생략합니다. 모든 응답에서 토큰/캐시 세부
정보가 필요하면 `/usage tokens` 또는 사용자 지정 `messages.usageTemplate`을
사용하십시오. 비용 표시는 API 키 인증으로 제한되지 않습니다. `aws-sdk`와 같은
비 API 키 공급자도 구성된 모델 항목에 로컬 가격이 포함되어 있고 공급자가 사용량
메타데이터를 반환하면 예상 비용을 표시할 수 있습니다.

사이드카와 채널이 Gateway 준비 경로에 도달하면 OpenClaw는 로컬 가격이 아직 없는
구성된 모델 참조에 대해 선택적 백그라운드 가격 부트스트랩을 시작합니다. 이 부트스트랩은
원격 OpenRouter 및 LiteLLM 가격 카탈로그를 가져옵니다. 오프라인 또는 제한된 네트워크에서
이러한 카탈로그 가져오기를 건너뛰려면 `models.pricing.enabled: false`를 설정하십시오.
명시적인 `models.providers.*.models[].cost` 항목은 계속해서 로컬 비용 추정에 사용됩니다.

## 캐시 TTL과 가지치기의 영향

공급자 프롬프트 캐싱은 캐시 TTL 기간 내에서만 적용됩니다. OpenClaw는 선택적으로
**캐시 TTL 가지치기**를 실행할 수 있습니다. 캐시 TTL이 만료되면 세션을 가지치기한 다음
캐시 기간을 재설정하여, 이후 요청에서 전체 기록을 다시 캐시하는 대신 새로 캐시된
컨텍스트를 재사용하도록 합니다. 이렇게 하면 세션이 TTL보다 오래 유휴 상태였을 때
캐시 쓰기 비용을 낮게 유지할 수 있습니다.

[Gateway 구성](/ko/gateway/configuration)에서 설정하고
[세션 가지치기](/ko/concepts/session-pruning)에서 동작 세부 정보를 참조하십시오.

Heartbeat는 유휴 간격 동안 캐시를 **웜 상태**로 유지할 수 있습니다. 모델 캐시 TTL이
`1h`인 경우 Heartbeat 간격을 그보다 약간 짧게 설정하면(예: `55m`) 전체 프롬프트를
다시 캐시하지 않아 캐시 쓰기 비용을 줄일 수 있습니다.

다중 에이전트 구성에서는 하나의 공유 모델 구성을 유지하면서
`agents.list[].params.cacheRetention`을 사용하여 에이전트별 캐시 동작을 조정할 수
있습니다.

각 설정별 전체 가이드는 [프롬프트 캐싱](/ko/reference/prompt-caching)을 참조하십시오.

Anthropic API 가격의 경우 캐시 읽기는 입력 토큰보다 훨씬 저렴한 반면, 캐시 쓰기는
더 높은 배수로 청구됩니다. 최신 요금과 TTL 배수는 Anthropic의 프롬프트 캐싱 가격을
참조하십시오.
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 예시: Heartbeat로 1h 캐시를 웜 상태로 유지

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
          cacheRetention: "long" # 대부분의 에이전트에 대한 기본 기준
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 심층 세션에서 장기 캐시를 웜 상태로 유지
    - id: "alerts"
      params:
        cacheRetention: "none" # 집중적으로 발생하는 알림의 캐시 쓰기 방지
```

`agents.list[].params`는 선택한 모델의 `params` 위에 병합되므로,
`cacheRetention`만 재정의하고 다른 모델 기본값은 변경 없이 상속할 수 있습니다.

### Anthropic 1M 컨텍스트

OpenClaw는 Opus 4.8, Opus 4.7, Opus 4.6 및 Sonnet 4.6과 같이 GA를 지원하는 Claude
4.x 모델에 Anthropic의 1M 컨텍스트 창을 적용합니다. 이러한 모델에는
`params.context1m: true`가 필요하지 않습니다.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

이전 구성에서는 `context1m: true`를 유지할 수 있지만, OpenClaw는 이 설정에 대해
Anthropic의 폐기된 `context-1m-2025-08-07` 베타 헤더를 더 이상 전송하지 않으며
지원되지 않는 이전 Claude 모델을 1M으로 확장하지 않습니다.

요구 사항: 자격 증명은 긴 컨텍스트 사용이 가능해야 합니다. 그렇지 않으면
Anthropic은 해당 요청에 대해 제공자 측 속도 제한 오류를 반환합니다.

OAuth/구독 토큰(`sk-ant-oat-*`)으로 Anthropic을 인증하는 경우,
OpenClaw는 OAuth에 필요한 Anthropic 베타 헤더를 유지하는 한편,
이전 구성에 더 이상 사용되지 않는 `context-1m-*` 베타가 남아 있으면 이를 제거합니다.

## 토큰 부담을 줄이는 팁

- `/compact`를 사용하여 긴 세션을 요약하십시오.
- 워크플로에서 대용량 도구 출력을 줄이십시오.
- 스크린샷이 많은 세션에서는 `agents.defaults.imageMaxDimensionPx`를 낮추십시오.
- 스킬 설명을 짧게 유지하십시오(스킬 목록은 프롬프트에 삽입됩니다).
- 출력이 많고 탐색적인 작업에는 더 작은 모델을 사용하십시오.

정확한 스킬 목록 오버헤드 계산식은 [Skills](/ko/tools/skills)를 참조하십시오.

## 관련 항목

- [API 사용량 및 비용](/ko/reference/api-usage-costs)
- [프롬프트 캐싱](/ko/reference/prompt-caching)
- [사용량 추적](/ko/concepts/usage-tracking)
