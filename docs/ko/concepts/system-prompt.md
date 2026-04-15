---
read_when:
    - 시스템 프롬프트 텍스트, 도구 목록 또는 시간/Heartbeat 섹션 편집하기
    - 워크스페이스 부트스트랩 또는 Skills 주입 동작 변경하기
summary: OpenClaw 시스템 프롬프트에 무엇이 포함되어 있는지와 그것이 어떻게 조합되는지
title: 시스템 프롬프트
x-i18n:
    generated_at: "2026-04-15T19:41:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: c740e4646bc4980567338237bfb55126af0df72499ca00a48e4848d9a3608ab4
    source_path: concepts/system-prompt.md
    workflow: 15
---

# 시스템 프롬프트

OpenClaw는 모든 에이전트 실행마다 커스텀 시스템 프롬프트를 구성합니다. 이 프롬프트는 **OpenClaw 소유**이며 pi-coding-agent 기본 프롬프트를 사용하지 않습니다.

프롬프트는 OpenClaw가 조합하여 각 에이전트 실행에 주입합니다.

프로바이더 Plugin은 전체 OpenClaw 소유 프롬프트를 대체하지 않으면서 캐시 인지형 프롬프트 가이드를 제공할 수 있습니다. 프로바이더 런타임은 다음을 수행할 수 있습니다.

- 이름이 지정된 소수의 핵심 섹션(`interaction_style`,
  `tool_call_style`, `execution_bias`)을 대체
- 프롬프트 캐시 경계 위에 **안정적인 접두사**를 주입
- 프롬프트 캐시 경계 아래에 **동적인 접미사**를 주입

모델 계열별 튜닝에는 프로바이더 소유 기여를 사용하세요. 기존의
`before_prompt_build` 프롬프트 변경은 호환성 유지나 진정으로 전역적인 프롬프트 변경에만 사용하고, 일반적인 프로바이더 동작에는 사용하지 마세요.

## 구조

프롬프트는 의도적으로 간결하며 고정된 섹션을 사용합니다.

- **도구 사용**: 구조화된 도구의 단일 출처 기준 리마인더와 런타임 도구 사용 가이드.
- **안전**: 권력 추구 행동이나 감독 우회를 피하기 위한 짧은 가드레일 리마인더.
- **Skills** (사용 가능한 경우): 필요 시 skill 지침을 로드하는 방법을 모델에 알려줍니다.
- **OpenClaw 자체 업데이트**: `config.schema.lookup`으로 설정을 안전하게 확인하고, `config.patch`로 설정을 패치하고, `config.apply`로 전체 설정을 교체하며, 명시적인 사용자 요청이 있을 때만 `update.run`을 실행하는 방법. 소유자 전용 `gateway` 도구는 보호된 exec 경로로 정규화되는 기존 `tools.bash.*` 별칭을 포함해 `tools.exec.ask` / `tools.exec.security` 재작성도 거부합니다.
- **워크스페이스**: 작업 디렉터리(`agents.defaults.workspace`).
- **문서**: OpenClaw 문서의 로컬 경로(리포지토리 또는 npm 패키지)와 이를 읽어야 하는 시점.
- **워크스페이스 파일(주입됨)**: 부트스트랩 파일이 아래에 포함되어 있음을 나타냅니다.
- **샌드박스** (활성화된 경우): 샌드박스 런타임, 샌드박스 경로, 그리고 권한 상승 exec 사용 가능 여부를 나타냅니다.
- **현재 날짜 및 시간**: 사용자 로컬 시간, 시간대, 시간 형식.
- **응답 태그**: 지원되는 프로바이더용 선택적 응답 태그 구문.
- **Heartbeat**: 기본 에이전트에 Heartbeat가 활성화되어 있을 때 Heartbeat 프롬프트 및 ack 동작.
- **런타임**: 호스트, OS, node, 모델, 리포지토리 루트(감지된 경우), 사고 수준(한 줄).
- **추론**: 현재 가시성 수준 + /reasoning 토글 힌트.

도구 사용 섹션에는 장시간 실행 작업에 대한 런타임 가이드도 포함됩니다.

- 나중에 후속 작업이 필요한 경우(`나중에 다시 확인`, 리마인더, 반복 작업) `exec` sleep 루프, `yieldMs` 지연 트릭, 반복적인 `process` 폴링 대신 cron을 사용
- `exec` / `process`는 지금 시작해서 백그라운드에서 계속 실행되는 명령에만 사용
- 자동 완료 wake가 활성화된 경우 명령을 한 번만 시작하고, 출력이 발생하거나 실패할 때 푸시 기반 wake 경로에 의존
- 실행 중인 명령을 확인해야 할 때는 로그, 상태, 입력, 개입을 위해 `process`를 사용
- 작업이 더 크면 `sessions_spawn`을 우선 사용. 서브 에이전트 완료는 푸시 기반이며 요청자에게 자동으로 공지됨
- 완료만 기다리기 위해 `subagents list` / `sessions_list`를 루프로 폴링하지 않음

실험적 `update_plan` 도구가 활성화되면, 도구 사용 섹션은 모델에 이것을 사소하지 않은 다단계 작업에만 사용하고, 정확히 하나의 `in_progress` 단계만 유지하며, 각 업데이트 후 전체 계획을 반복하지 말라고도 안내합니다.

시스템 프롬프트의 안전 가드레일은 권고 사항입니다. 모델 동작을 안내하지만 정책을 강제하지는 않습니다. 강제 적용에는 도구 정책, exec 승인, 샌드박싱, 채널 허용 목록을 사용하세요. 운영자는 설계상 이를 비활성화할 수 있습니다.

네이티브 승인 카드/버튼이 있는 채널에서는, 런타임 프롬프트가 이제 에이전트에게 우선 해당 네이티브 승인 UI에 의존하라고 알려줍니다. 도구 결과에서 채팅 승인을 사용할 수 없거나 수동 승인이 유일한 경로라고 표시될 때만 수동 `/approve` 명령을 포함해야 합니다.

## 프롬프트 모드

OpenClaw는 서브 에이전트용으로 더 작은 시스템 프롬프트를 렌더링할 수 있습니다. 런타임은 각 실행에 대해 `promptMode`를 설정합니다(사용자 대상 설정 아님).

- `full` (기본값): 위의 모든 섹션을 포함합니다.
- `minimal`: 서브 에이전트에 사용되며 **Skills**, **Memory Recall**, **OpenClaw 자체 업데이트**, **모델 별칭**, **사용자 ID**, **응답 태그**, **메시징**, **무음 응답**, **Heartbeats**를 생략합니다. 도구 사용, **안전**, 워크스페이스, 샌드박스, 현재 날짜 및 시간(알려진 경우), 런타임, 주입된 컨텍스트는 계속 사용할 수 있습니다.
- `none`: 기본 ID 줄만 반환합니다.

`promptMode=minimal`일 때, 추가로 주입된 프롬프트는 **그룹 채팅 컨텍스트** 대신 **서브 에이전트 컨텍스트**로 레이블이 지정됩니다.

## 워크스페이스 부트스트랩 주입

부트스트랩 파일은 잘려서 **프로젝트 컨텍스트** 아래에 추가되므로, 모델은 명시적으로 읽지 않아도 ID 및 프로필 컨텍스트를 볼 수 있습니다.

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (새 워크스페이스에서만)
- `MEMORY.md`가 있으면 그것을 사용하고, 없으면 소문자 대체 파일 `memory.md` 사용

이 모든 파일은 **파일별 게이트가 적용되지 않는 한** 모든 턴마다 **컨텍스트 창에 주입**됩니다. `HEARTBEAT.md`는 기본 에이전트에서 Heartbeat가 비활성화되어 있거나 `agents.defaults.heartbeat.includeSystemPromptSection`이 false일 때 일반 실행에서는 생략됩니다. 주입되는 파일은 간결하게 유지하세요. 특히 `MEMORY.md`는 시간이 지나며 커질 수 있어 예상보다 높은 컨텍스트 사용량과 더 잦은 Compaction으로 이어질 수 있습니다.

> **참고:** `memory/*.md` 일별 파일은 일반적인 부트스트랩
> 프로젝트 컨텍스트의 일부가 아닙니다. 일반 턴에서는
> `memory_search` 및 `memory_get` 도구를 통해 필요할 때 접근하므로,
> 모델이 명시적으로 읽지 않는 한 컨텍스트 창에 포함되지 않습니다.
> 예외는 순수 `/new` 및 `/reset` 턴입니다. 런타임은 첫 턴에 한해
> 최근 일별 메모리를 일회성 시작 컨텍스트 블록으로 앞에 붙일 수 있습니다.

큰 파일은 마커와 함께 잘립니다. 파일당 최대 크기는
`agents.defaults.bootstrapMaxChars`(기본값: 20000)로 제어됩니다. 파일 전체에서 주입되는 총 부트스트랩 콘텐츠는 `agents.defaults.bootstrapTotalMaxChars`
(기본값: 150000)로 제한됩니다. 누락된 파일은 짧은 누락 파일 마커를 주입합니다. 잘림이 발생하면 OpenClaw는 프로젝트 컨텍스트에 경고 블록을 주입할 수 있습니다. 이는 `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
기본값: `once`)로 제어합니다.

서브 에이전트 세션에는 `AGENTS.md`와 `TOOLS.md`만 주입됩니다(다른 부트스트랩 파일은 서브 에이전트 컨텍스트를 작게 유지하기 위해 필터링됨).

내부 훅은 `agent:bootstrap`을 통해 이 단계를 가로채 주입된 부트스트랩 파일을 변경하거나 교체할 수 있습니다(예: `SOUL.md`를 대체 페르소나로 교체).

에이전트가 덜 일반적으로 들리게 만들고 싶다면
[SOUL.md Personality Guide](/ko/concepts/soul)부터 시작하세요.

주입된 각 파일의 기여도(원본 대비 주입본, 잘림, 도구 스키마 오버헤드 포함)를 확인하려면 `/context list` 또는 `/context detail`을 사용하세요. [Context](/ko/concepts/context)를 참고하세요.

## 시간 처리

사용자 시간대를 알고 있을 때 시스템 프롬프트에는 전용 **현재 날짜 및 시간** 섹션이 포함됩니다. 프롬프트 캐시를 안정적으로 유지하기 위해, 이제 **시간대**만 포함합니다(동적인 시계나 시간 형식은 포함하지 않음).

에이전트에 현재 시간이 필요할 때는 `session_status`를 사용하세요. 상태 카드에는 타임스탬프 줄이 포함됩니다. 같은 도구는 선택적으로 세션별 모델 오버라이드도 설정할 수 있습니다(`model=default`는 이를 지움).

다음으로 설정합니다.

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

전체 동작 세부 정보는 [날짜 및 시간](/ko/date-time)을 참고하세요.

## Skills

조건에 맞는 skill이 있으면 OpenClaw는 각 skill의 **파일 경로**를 포함하는 간결한 **사용 가능한 skills 목록**(`formatSkillsForPrompt`)을 주입합니다. 프롬프트는 모델에게 나열된 위치(워크스페이스, 관리형 또는 번들됨)의 SKILL.md를 로드하기 위해 `read`를 사용하라고 지시합니다. 조건에 맞는 skill이 없으면 Skills 섹션은 생략됩니다.

자격 조건에는 skill 메타데이터 게이트, 런타임 환경/설정 검사, 그리고 `agents.defaults.skills` 또는
`agents.list[].skills`가 구성된 경우 유효한 에이전트 skill 허용 목록이 포함됩니다.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

이렇게 하면 기본 프롬프트를 작게 유지하면서도 대상이 명확한 skill 사용이 가능해집니다.

skills 목록 예산은 skills 하위 시스템이 소유합니다.

- 전역 기본값: `skills.limits.maxSkillsPromptChars`
- 에이전트별 오버라이드: `agents.list[].skillsLimits.maxSkillsPromptChars`

일반적인 제한형 런타임 발췌는 다른 표면을 사용합니다.

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

이 분리는 skills 크기 조정을 `memory_get`, 라이브 도구 결과, Compaction 후 AGENTS.md 새로고침과 같은 런타임 읽기/주입 크기 조정과 분리해 유지합니다.

## 문서

사용 가능할 때 시스템 프롬프트에는 로컬 OpenClaw 문서 디렉터리(리포지토리 워크스페이스의 `docs/` 또는 번들된 npm 패키지 문서)를 가리키는 **문서** 섹션이 포함되며, 공개 미러, 소스 리포지토리, 커뮤니티 Discord, 그리고 skill 검색을 위한 ClawHub([https://clawhub.ai](https://clawhub.ai))도 함께 안내합니다. 프롬프트는 모델에게 OpenClaw 동작, 명령, 설정 또는 아키텍처에 대해서는 우선 로컬 문서를 참고하고, 가능하면 `openclaw status`를 직접 실행하며(접근 권한이 없을 때만 사용자에게 물음) 그렇게 하라고 지시합니다.
