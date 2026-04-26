---
read_when:
    - 시스템 프롬프트 텍스트, 도구 목록 또는 시간/Heartbeat 섹션 편집하기
    - 워크스페이스 bootstrap 또는 Skills 주입 동작 변경하기
summary: OpenClaw 시스템 프롬프트에 무엇이 포함되며 어떻게 조합되는지
title: 시스템 프롬프트
x-i18n:
    generated_at: "2026-04-26T11:27:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71a4dc6dfb412d62f7c81875f1bebfb21fdae432e28cc7473e1ce8f93380f93b
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw는 모든 에이전트 실행마다 사용자 지정 시스템 프롬프트를 구성합니다. 이 프롬프트는 **OpenClaw 소유**이며 pi-coding-agent의 기본 프롬프트를 사용하지 않습니다.

프롬프트는 OpenClaw가 조합하여 각 에이전트 실행에 주입합니다.

provider Plugin은 전체 OpenClaw 소유 프롬프트를 대체하지 않으면서 캐시 인식형 프롬프트 지침을 기여할 수 있습니다. provider 런타임은 다음을 수행할 수 있습니다:

- 이름이 지정된 소수의 핵심 섹션(`interaction_style`,
  `tool_call_style`, `execution_bias`) 교체
- 프롬프트 캐시 경계 위에 **안정적인 접두사** 주입
- 프롬프트 캐시 경계 아래에 **동적 접미사** 주입

provider 소유 기여는 모델 계열별 튜닝에 사용하세요. 레거시
`before_prompt_build` 프롬프트 변경은 호환성 또는 진정으로 전역적인 프롬프트 변경용으로만 유지하고, 일반적인 provider 동작에는 사용하지 마세요.

OpenAI GPT-5 계열 오버레이는 핵심 실행 규칙을 작게 유지하면서
페르소나 고정, 간결한 출력, 도구 규율, 병렬 조회, 결과물 범위, 검증, 누락된 컨텍스트, 터미널 도구 위생을 위한 모델별 지침을 추가합니다.

## 구조

프롬프트는 의도적으로 간결하며 고정된 섹션을 사용합니다:

- **Tooling**: 구조화된 도구의 기준 정보 알림과 런타임 도구 사용 지침.
- **Execution Bias**: 실행 가능한 요청을 턴 내에서 처리하고,
  완료되거나 막힐 때까지 계속하며, 약한 도구 결과에서 복구하고,
  변경 가능한 상태를 실시간으로 확인하고, 최종 응답 전에 검증하라는 간결한 후속 실행 지침.
- **Safety**: 권력 추구 행동이나 감독 우회를 피하기 위한 짧은 가드레일 알림.
- **Skills**(사용 가능한 경우): 필요 시 skill 지침을 로드하는 방법을 모델에 알려줍니다.
- **OpenClaw Self-Update**: `config.schema.lookup`으로 config를 안전하게 검사하고, `config.patch`로 config를 패치하고, `config.apply`로 전체 config를 교체하고, 명시적인 사용자 요청이 있을 때만 `update.run`을 실행하는 방법. owner 전용 `gateway` 도구는 `tools.exec.ask` / `tools.exec.security` 재작성도 거부하며, 여기에는 보호된 exec 경로로 정규화되는 레거시 `tools.bash.*` 별칭도 포함됩니다.
- **Workspace**: 작업 디렉터리(`agents.defaults.workspace`).
- **Documentation**: OpenClaw 문서의 로컬 경로(repo 또는 npm package)와 읽어야 하는 시점.
- **Workspace Files (injected)**: bootstrap 파일이 아래에 포함된다는 표시.
- **Sandbox**(활성화된 경우): 샌드박스 런타임, 샌드박스 경로, 상승된 exec 사용 가능 여부를 표시.
- **Current Date & Time**: 사용자 로컬 시간, 시간대, 시간 형식.
- **Reply Tags**: 지원되는 provider용 선택적 응답 태그 문법.
- **Heartbeats**: 기본 에이전트에 Heartbeat가 활성화된 경우 Heartbeat 프롬프트와 ack 동작.
- **Runtime**: 호스트, OS, Node, model, repo 루트(감지된 경우), thinking 수준(한 줄).
- **Reasoning**: 현재 표시 수준 + `/reasoning` 토글 힌트.

Tooling 섹션에는 장기 실행 작업을 위한 런타임 지침도 포함됩니다:

- 미래의 후속 작업(`나중에 다시 확인`, reminder, 반복 작업)에는 `exec` 슬립 루프, `yieldMs` 지연 트릭, 반복적인 `process` 폴링 대신 Cron을 사용
- 지금 시작해서 백그라운드에서 계속 실행되는 명령에만 `exec` / `process` 사용
- 자동 완료 wake가 활성화되어 있으면 명령을 한 번만 시작하고, 출력이 생기거나 실패할 때 푸시 기반 wake 경로에 의존
- 실행 중인 명령을 검사해야 할 때는 로그, 상태, 입력, 개입을 위해 `process` 사용
- 작업이 더 크면 `sessions_spawn`을 우선 사용. 하위 에이전트 완료는 푸시 기반이며 요청자에게 자동으로 알림
- 완료를 기다리기 위해 `subagents list` / `sessions_list`를 루프에서 폴링하지 말 것

실험적 `update_plan` 도구가 활성화되면 Tooling은 모델에게 사소하지 않은 다단계 작업에만 이를 사용하고, 정확히 하나의 `in_progress` 단계를 유지하며, 각 업데이트 후 전체 계획을 반복하지 말라고도 지시합니다.

시스템 프롬프트의 Safety 가드레일은 권고 사항입니다. 모델 동작을 안내하지만 정책을 강제하지는 않습니다. 강제 적용에는 도구 정책, exec 승인, 샌드박싱, 채널 allowlist를 사용하세요. 운영자는 의도적으로 이를 비활성화할 수 있습니다.

네이티브 승인 카드/버튼이 있는 채널에서는 이제 런타임 프롬프트가 에이전트에게 먼저 해당 네이티브 승인 UI를 사용하라고 알려줍니다. 도구 결과에서 채팅 승인을 사용할 수 없거나 수동 승인이 유일한 경로라고 할 때만 수동 `/approve` 명령을 포함해야 합니다.

## 프롬프트 모드

OpenClaw는 하위 에이전트용으로 더 작은 시스템 프롬프트를 렌더링할 수 있습니다. 런타임은 각 실행에 대해 `promptMode`를 설정합니다(사용자 대상 config는 아님):

- `full`(기본값): 위의 모든 섹션을 포함합니다.
- `minimal`: 하위 에이전트에 사용되며 **Skills**, **Memory Recall**, **OpenClaw Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**, **Messaging**, **Silent Replies**, **Heartbeats**를 생략합니다. Tooling, **Safety**, Workspace, Sandbox, Current Date & Time(알려진 경우), Runtime, 주입된 컨텍스트는 계속 사용할 수 있습니다.
- `none`: 기본 정체성 한 줄만 반환합니다.

`promptMode=minimal`일 때 추가로 주입된 프롬프트는 **Group Chat Context** 대신 **Subagent Context**로 레이블이 붙습니다.

## 워크스페이스 bootstrap 주입

bootstrap 파일은 명시적으로 읽지 않아도 모델이 정체성과 프로필 컨텍스트를 볼 수 있도록 잘린 뒤 **Project Context** 아래에 추가됩니다:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`(완전히 새로운 워크스페이스에서만)
- 존재하는 경우 `MEMORY.md`

이 모든 파일은 파일별 게이트가 적용되지 않는 한 모든 턴에서 **컨텍스트 창에 주입**됩니다. `HEARTBEAT.md`는 기본 에이전트에 Heartbeat가 비활성화되어 있거나 `agents.defaults.heartbeat.includeSystemPromptSection`이 false일 때 일반 실행에서는 생략됩니다. 주입되는 파일은 간결하게 유지하세요. 특히 `MEMORY.md`는 시간이 지나며 커질 수 있어 예상보다 높은 컨텍스트 사용량과 더 잦은 Compaction으로 이어질 수 있습니다.

> **참고:** `memory/*.md` 일일 파일은 일반 bootstrap
> Project Context의 일부가 아닙니다. 일반 턴에서는
> `memory_search` 및 `memory_get` 도구를 통해 필요 시 접근하므로,
> 모델이 이를 명시적으로 읽지 않는 한 컨텍스트 창을 차지하지 않습니다. 예외는 순수 `/new` 및 `/reset` 턴입니다. 런타임은 첫 턴의 일회성 시작 컨텍스트 블록으로 최근 일일 메모리를 앞에 붙일 수 있습니다.

큰 파일은 마커와 함께 잘립니다. 파일별 최대 크기는
`agents.defaults.bootstrapMaxChars`(기본값: 12000)로 제어합니다. 파일 전체에 걸친 총 bootstrap 주입 콘텐츠는 `agents.defaults.bootstrapTotalMaxChars`
(기본값: 60000)로 제한됩니다. 누락된 파일은 짧은 누락 파일 마커를 주입합니다. 잘림이 발생하면 OpenClaw는 Project Context에 경고 블록을 주입할 수 있습니다. 이는 `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
기본값: `once`)로 제어합니다.

하위 에이전트 세션에는 `AGENTS.md`와 `TOOLS.md`만 주입됩니다(하위 에이전트 컨텍스트를 작게 유지하기 위해 다른 bootstrap 파일은 걸러짐).

internal hooks는 `agent:bootstrap`을 통해 이 단계를 가로채 주입된 bootstrap 파일을 변경하거나 교체할 수 있습니다(예: `SOUL.md`를 대체 페르소나로 교체).

에이전트가 덜 일반적으로 들리게 하려면
[SOUL.md Personality Guide](/ko/concepts/soul)부터 시작하세요.

주입된 각 파일이 얼마나 기여하는지(원시 대 주입량, 잘림, 도구 스키마 오버헤드 포함) 확인하려면 `/context list` 또는 `/context detail`을 사용하세요. [Context](/ko/concepts/context)를 참조하세요.

## 시간 처리

시스템 프롬프트에는 사용자 시간대가 알려져 있을 때 전용 **Current Date & Time** 섹션이 포함됩니다. 프롬프트 캐시를 안정적으로 유지하기 위해 이제 **시간대**만 포함하며(동적인 시계나 시간 형식은 제외) 표시합니다.

에이전트에 현재 시간이 필요하면 `session_status`를 사용하세요. 상태 카드에는 타임스탬프 줄이 포함됩니다. 같은 도구로 세션별 model 재정의도 설정할 수 있습니다(`model=default`는 이를 지움).

다음으로 구성합니다:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

전체 동작 세부 정보는 [Date & Time](/ko/date-time)을 참조하세요.

## Skills

조건을 만족하는 Skills가 존재하면 OpenClaw는 각 skill의 **파일 경로**를 포함한 간결한 **사용 가능한 Skills 목록**(`formatSkillsForPrompt`)을 주입합니다. 프롬프트는 모델에게 나열된 위치(워크스페이스, 관리형 또는 번들)의 SKILL.md를 로드하기 위해 `read`를 사용하라고 지시합니다. 조건을 만족하는 skill이 없으면 Skills 섹션은 생략됩니다.

조건 충족 여부에는 skill 메타데이터 게이트, 런타임 환경/config 검사, 그리고 `agents.defaults.skills` 또는 `agents.list[].skills`가 구성된 경우 유효한 에이전트 skill allowlist가 포함됩니다.

Plugin 번들 Skills는 해당 Plugin이 활성화된 경우에만 조건을 충족합니다. 이를 통해 도구 Plugins는 그 모든 지침을 모든 도구 설명에 직접 포함하지 않고도 더 깊은 운영 가이드를 노출할 수 있습니다.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

이렇게 하면 기본 프롬프트를 작게 유지하면서도 대상화된 skill 사용이 가능합니다.

Skills 목록 예산은 skills 서브시스템이 소유합니다:

- 전역 기본값: `skills.limits.maxSkillsPromptChars`
- 에이전트별 재정의: `agents.list[].skillsLimits.maxSkillsPromptChars`

일반적인 제한된 런타임 발췌는 다른 표면을 사용합니다:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

이 구분을 통해 skills 크기 조절은 `memory_get`, 실시간 도구 결과, Compaction 후 AGENTS.md 새로고침 같은 런타임 읽기/주입 크기 조절과 분리됩니다.

## 문서

시스템 프롬프트에는 **Documentation** 섹션이 포함됩니다. 로컬 문서를 사용할 수 있으면 로컬 OpenClaw 문서 디렉터리(Git 체크아웃의 `docs/` 또는 번들된 npm
package 문서)를 가리킵니다. 로컬 문서를 사용할 수 없으면
[https://docs.openclaw.ai](https://docs.openclaw.ai)로 폴백합니다.

같은 섹션에는 OpenClaw 소스 위치도 포함됩니다. Git 체크아웃은 로컬 소스 루트를 노출하므로 에이전트가 코드를 직접 검사할 수 있습니다. package 설치는 GitHub 소스 URL을 포함하고 문서가 불완전하거나 오래된 경우 সেখানে 소스를 검토하라고 알려줍니다. 프롬프트는 또한 공개 문서 미러, 커뮤니티 Discord, 그리고 skill 탐색을 위한 ClawHub
([https://clawhub.ai](https://clawhub.ai))를 언급합니다. 또한 모델에게 OpenClaw 동작, 명령, config, 아키텍처에 대해서는 먼저 문서를 참고하고, 가능하면 스스로 `openclaw status`를 실행하며(접근 권한이 없을 때만 사용자에게 묻도록) 지시합니다.
특히 config의 경우, 정확한 필드 수준 문서와 제약 조건을 위해 `gateway` 도구 작업
`config.schema.lookup`을 먼저 보도록 안내하고, 이후 더 넓은 지침을 위해
`docs/gateway/configuration.md`와 `docs/gateway/configuration-reference.md`
를 가리킵니다.

## 관련

- [에이전트 런타임](/ko/concepts/agent)
- [에이전트 워크스페이스](/ko/concepts/agent-workspace)
- [Context 엔진](/ko/concepts/context-engine)
