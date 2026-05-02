---
read_when:
    - 시스템 프롬프트 텍스트, 도구 목록 또는 시간/Heartbeat 섹션 편집
    - 작업 공간 부트스트랩 또는 Skills 주입 동작 변경
summary: OpenClaw 시스템 프롬프트에 포함된 내용과 구성 방식
title: 시스템 프롬프트
x-i18n:
    generated_at: "2026-05-02T20:49:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw는 모든 에이전트 실행마다 사용자 지정 시스템 프롬프트를 빌드합니다. 이 프롬프트는 **OpenClaw 소유**이며 pi-coding-agent 기본 프롬프트를 사용하지 않습니다.

프롬프트는 OpenClaw가 조립하여 각 에이전트 실행에 주입합니다.

Provider Plugin은 전체 OpenClaw 소유 프롬프트를 교체하지 않고도 캐시를 인식하는 프롬프트 지침을 제공할 수 있습니다. provider 런타임은 다음을 할 수 있습니다.

- 이름이 지정된 소수의 코어 섹션(`interaction_style`, `tool_call_style`, `execution_bias`) 교체
- 프롬프트 캐시 경계 위에 **안정적인 접두사** 주입
- 프롬프트 캐시 경계 아래에 **동적 접미사** 주입

모델 패밀리별 튜닝에는 provider 소유 기여를 사용하세요. 레거시 `before_prompt_build` 프롬프트 변형은 호환성 또는 정말 전역적인 프롬프트 변경을 위해 유지하고, 일반적인 provider 동작에는 사용하지 마세요.

OpenAI GPT-5 패밀리 오버레이는 코어 실행 규칙을 작게 유지하고, 페르소나 래칭, 간결한 출력, 도구 규율, 병렬 조회, 산출물 범위, 검증, 누락된 컨텍스트, 터미널 도구 위생에 대한 모델별 지침을 추가합니다.

## 구조

프롬프트는 의도적으로 간결하며 고정 섹션을 사용합니다.

- **도구 사용**: 구조화된 도구의 단일 진실 공급원 알림과 런타임 도구 사용 지침.
- **실행 성향**: 간결한 끝까지 수행 지침: 실행 가능한 요청은 현재 턴에서 처리하고, 완료되거나 차단될 때까지 계속하며, 약한 도구 결과에서 복구하고, 변경 가능한 상태를 실시간으로 확인하며, 최종 응답 전에 검증합니다.
- **안전**: 권력 추구 행동이나 감독 우회를 피하라는 짧은 가드레일 알림.
- **Skills**(사용 가능한 경우): 필요할 때 skill 지침을 로드하는 방법을 모델에 알려줍니다.
- **OpenClaw 자체 업데이트**: `config.schema.lookup`으로 구성을 안전하게 검사하고, `config.patch`로 구성을 패치하며, `config.apply`로 전체 구성을 교체하고, 명시적인 사용자 요청이 있을 때만 `update.run`을 실행하는 방법입니다. 소유자 전용 `gateway` 도구도 `tools.exec.ask` / `tools.exec.security` 재작성을 거부하며, 해당 보호된 exec 경로로 정규화되는 레거시 `tools.bash.*` 별칭도 포함됩니다.
- **작업 영역**: 작업 디렉터리(`agents.defaults.workspace`).
- **문서**: OpenClaw 문서의 로컬 경로(repo 또는 npm 패키지)와 읽어야 하는 시점.
- **작업 영역 파일(주입됨)**: bootstrap 파일이 아래에 포함되어 있음을 나타냅니다.
- **샌드박스**(활성화된 경우): 샌드박스 런타임, 샌드박스 경로, 승격된 exec 사용 가능 여부를 나타냅니다.
- **현재 날짜 및 시간**: 사용자 로컬 시간, 시간대, 시간 형식.
- **응답 태그**: 지원되는 provider의 선택적 응답 태그 구문.
- **Heartbeats**: 기본 에이전트에 Heartbeat가 활성화된 경우 Heartbeat 프롬프트 및 ack 동작.
- **런타임**: 호스트, OS, Node, 모델, repo 루트(감지된 경우), 사고 수준(한 줄).
- **추론**: 현재 가시성 수준 + /reasoning 토글 힌트.

OpenClaw는 **프로젝트 컨텍스트**를 포함한 큰 안정적 콘텐츠를 내부 프롬프트 캐시 경계 위에 유지합니다. Control UI 임베드 지침, **메시징**, **음성**, **그룹 채팅 컨텍스트**, **반응**, **Heartbeats**, **런타임** 같은 변동성이 큰 채널/세션 섹션은 그 경계 아래에 추가되어, 접두사 캐시가 있는 로컬 백엔드가 채널 턴 전반에서 안정적인 작업 영역 접두사를 재사용할 수 있게 합니다. 마찬가지로 도구 설명은 허용된 스키마가 이미 해당 런타임 세부 정보를 담고 있을 때 현재 채널 이름을 포함하지 않아야 합니다.

도구 사용 섹션에는 장시간 실행 작업을 위한 런타임 지침도 포함됩니다.

- 미래 후속 조치(`check back later`, 알림, 반복 작업)에는 `exec` sleep 루프, `yieldMs` 지연 트릭, 반복적인 `process` 폴링 대신 Cron을 사용합니다.
- 지금 시작되어 백그라운드에서 계속 실행되는 명령에만 `exec` / `process`를 사용합니다.
- 자동 완료 깨우기가 활성화된 경우 명령을 한 번 시작하고, 출력이 발생하거나 실패할 때 push 기반 깨우기 경로에 의존합니다.
- 실행 중인 명령을 검사해야 할 때 로그, 상태, 입력 또는 개입에는 `process`를 사용합니다.
- 작업이 더 크다면 `sessions_spawn`을 선호합니다. 하위 에이전트 완료는 push 기반이며 요청자에게 자동으로 다시 알립니다.
- 완료를 기다리기 위해 `subagents list` / `sessions_list`를 루프에서 폴링하지 마세요.

실험적 `update_plan` 도구가 활성화된 경우, 도구 사용 섹션은 모델에 이 도구를 복잡한 다단계 작업에만 사용하고, 정확히 하나의 `in_progress` 단계만 유지하며, 각 업데이트 후 전체 계획을 반복하지 말라고도 알려줍니다.

시스템 프롬프트의 안전 가드레일은 권고 사항입니다. 모델 동작을 안내하지만 정책을 강제하지는 않습니다. 강제 적용에는 도구 정책, exec 승인, 샌드박싱, 채널 allowlist를 사용하세요. 운영자는 설계상 이를 비활성화할 수 있습니다.

기본 승인 카드/버튼이 있는 채널에서는 런타임 프롬프트가 이제 에이전트에게 해당 기본 승인 UI를 먼저 사용하라고 알려줍니다. 도구 결과가 채팅 승인을 사용할 수 없다고 말하거나 수동 승인이 유일한 경로일 때만 수동 `/approve` 명령을 포함해야 합니다.

## 프롬프트 모드

OpenClaw는 하위 에이전트를 위해 더 작은 시스템 프롬프트를 렌더링할 수 있습니다. 런타임은 각 실행에 `promptMode`를 설정합니다(사용자에게 노출되는 구성 아님).

- `full`(기본값): 위의 모든 섹션을 포함합니다.
- `minimal`: 하위 에이전트에 사용되며, **Skills**, **메모리 회상**, **OpenClaw 자체 업데이트**, **모델 별칭**, **사용자 ID**, **응답 태그**, **메시징**, **무음 응답**, **Heartbeats**를 생략합니다. 도구 사용, **안전**, 작업 영역, 샌드박스, 현재 날짜 및 시간(알려진 경우), 런타임, 주입된 컨텍스트는 계속 사용할 수 있습니다.
- `none`: 기본 ID 줄만 반환합니다.

`promptMode=minimal`일 때 추가로 주입된 프롬프트는 **그룹 채팅 컨텍스트** 대신 **하위 에이전트 컨텍스트**로 표시됩니다.

채널 자동 응답 실행의 경우, 직접/그룹 채팅 컨텍스트가 이미 해결된 대화별 `NO_REPLY` 동작을 포함하면 OpenClaw는 일반 **무음 응답** 섹션을 생략할 수 있습니다. 이렇게 하면 전역 시스템 프롬프트와 채널 컨텍스트 양쪽에서 토큰 메커니즘을 반복하지 않습니다.

## 프롬프트 스냅샷

OpenClaw는 Codex/message-tool 런타임용 happy-path 프롬프트 스냅샷을 `test/fixtures/agents/prompt-snapshots/happy-path/` 아래에 커밋해 둡니다. 이들은 OpenClaw 소유 Codex app-server 개발자 지침, 선택된 스레드 시작/재개 매개변수, 턴 사용자 입력, Telegram 직접 메시지, Discord 그룹, Heartbeat 턴의 동적 도구 사양을 렌더링합니다. 숨겨진 기본 Codex 시스템 프롬프트와 턴 범위 Codex 협업 모드 지침은 Codex 런타임 소유이며 OpenClaw가 렌더링하지 않습니다.

`pnpm prompt:snapshots:gen`으로 다시 생성하고 `pnpm prompt:snapshots:check`로 drift를 검증하세요.

## 작업 영역 bootstrap 주입

Bootstrap 파일은 잘라낸 뒤 **프로젝트 컨텍스트** 아래에 추가되어, 모델이 명시적으로 읽지 않아도 ID와 프로필 컨텍스트를 볼 수 있게 합니다.

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`(완전히 새로운 작업 영역에서만)
- 존재하는 경우 `MEMORY.md`

파일별 gate가 적용되지 않는 한, 이 모든 파일은 매 턴마다 **컨텍스트 창에 주입**됩니다. 기본 에이전트에 Heartbeat가 비활성화되어 있거나 `agents.defaults.heartbeat.includeSystemPromptSection`이 false이면 일반 실행에서 `HEARTBEAT.md`는 생략됩니다. 주입되는 파일은 간결하게 유지하세요. 특히 `MEMORY.md`는 시간이 지나며 커질 수 있고, 예상보다 높은 컨텍스트 사용량과 더 잦은 Compaction으로 이어질 수 있습니다.

<Note>
`memory/*.md` 일별 파일은 일반 bootstrap 프로젝트 컨텍스트의 일부가 **아닙니다**. 일반 턴에서는 `memory_search` 및 `memory_get` 도구를 통해 필요할 때 접근하므로, 모델이 명시적으로 읽지 않는 한 컨텍스트 창을 차지하지 않습니다. 예외는 단순 `/new` 및 `/reset` 턴입니다. 런타임은 해당 첫 턴에 최근 일별 메모리를 일회성 시작 컨텍스트 블록으로 앞에 추가할 수 있습니다.
</Note>

큰 파일은 마커와 함께 잘립니다. 파일당 최대 크기는 `agents.defaults.bootstrapMaxChars`로 제어됩니다(기본값: 12000). 파일 전체에 걸쳐 주입되는 bootstrap 콘텐츠 총량은 `agents.defaults.bootstrapTotalMaxChars`로 제한됩니다(기본값: 60000). 누락된 파일은 짧은 누락 파일 마커를 주입합니다. 잘림이 발생하면 OpenClaw는 프로젝트 컨텍스트에 경고 블록을 주입할 수 있습니다. 이는 `agents.defaults.bootstrapPromptTruncationWarning`(`off`, `once`, `always`; 기본값: `once`)로 제어합니다.

하위 에이전트 세션은 `AGENTS.md`와 `TOOLS.md`만 주입합니다(하위 에이전트 컨텍스트를 작게 유지하기 위해 다른 bootstrap 파일은 필터링됩니다).

내부 hook은 `agent:bootstrap`을 통해 이 단계를 가로채 주입되는 bootstrap 파일을 변형하거나 교체할 수 있습니다(예: `SOUL.md`를 대체 페르소나로 교체).

에이전트가 덜 일반적으로 들리게 만들고 싶다면 [SOUL.md Personality Guide](/ko/concepts/soul)부터 시작하세요.

각 주입 파일이 얼마나 기여하는지(raw vs 주입됨, 잘림, 도구 스키마 오버헤드 포함) 검사하려면 `/context list` 또는 `/context detail`을 사용하세요. [컨텍스트](/ko/concepts/context)를 참조하세요.

## 시간 처리

사용자 시간대를 알 수 있을 때 시스템 프롬프트에는 전용 **현재 날짜 및 시간** 섹션이 포함됩니다. 프롬프트 캐시를 안정적으로 유지하기 위해 이제 **시간대**만 포함합니다(동적 시계나 시간 형식 없음).

에이전트에 현재 시간이 필요하면 `session_status`를 사용하세요. 상태 카드에는 타임스탬프 줄이 포함됩니다. 같은 도구로 선택적으로 세션별 모델 override를 설정할 수 있습니다(`model=default`는 이를 지웁니다).

다음으로 구성합니다.

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`(`auto` | `12` | `24`)

전체 동작 세부 정보는 [날짜 및 시간](/ko/date-time)을 참조하세요.

## Skills

적격 skill이 존재할 때 OpenClaw는 각 skill의 **파일 경로**를 포함하는 간결한 **사용 가능한 Skills 목록**(`formatSkillsForPrompt`)을 주입합니다. 프롬프트는 모델에 나열된 위치(작업 영역, managed, 또는 bundled)의 SKILL.md를 로드하기 위해 `read`를 사용하라고 지시합니다. 적격 skill이 없으면 Skills 섹션은 생략됩니다.

적격성에는 skill 메타데이터 gate, 런타임 환경/구성 검사, 그리고 `agents.defaults.skills` 또는 `agents.list[].skills`가 구성된 경우 유효 에이전트 skill allowlist가 포함됩니다.

Plugin 번들 skill은 소유 Plugin이 활성화된 경우에만 적격입니다. 이를 통해 도구 Plugin은 모든 도구 설명에 해당 지침을 직접 포함하지 않고도 더 깊은 운영 가이드를 노출할 수 있습니다.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

이렇게 하면 기본 프롬프트를 작게 유지하면서도 targeted skill 사용을 가능하게 합니다.

Skills 목록 예산은 Skills 하위 시스템이 소유합니다.

- 전역 기본값: `skills.limits.maxSkillsPromptChars`
- 에이전트별 override: `agents.list[].skillsLimits.maxSkillsPromptChars`

일반적인 제한된 런타임 발췌에는 다른 surface를 사용합니다.

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

이 분리는 Skills 크기 조정을 `memory_get`, live 도구 결과, Compaction 후 AGENTS.md 새로 고침 같은 런타임 읽기/주입 크기 조정과 분리합니다.

## 문서

시스템 프롬프트에는 **문서** 섹션이 포함됩니다. 로컬 문서를 사용할 수 있으면 로컬 OpenClaw 문서 디렉터리(Git checkout의 `docs/` 또는 번들된 npm 패키지 문서)를 가리킵니다. 로컬 문서를 사용할 수 없으면 [https://docs.openclaw.ai](https://docs.openclaw.ai)로 fallback합니다.

같은 섹션에는 OpenClaw 소스 위치도 포함됩니다. Git checkout은 에이전트가 코드를 직접 검사할 수 있도록 로컬 소스 루트를 노출합니다. 패키지 설치는 GitHub 소스 URL을 포함하며, 문서가 불완전하거나 오래된 경우 에이전트에게 그곳에서 소스를 검토하라고 알려줍니다. 프롬프트는 public docs mirror, community Discord, 그리고 Skills 발견을 위한 ClawHub([https://clawhub.ai](https://clawhub.ai))도 언급합니다. 모델에게 OpenClaw 동작, 명령, 구성 또는 아키텍처에 대해서는 먼저 문서를 참고하고, 가능하면 `openclaw status`를 직접 실행하라고 알려줍니다(접근 권한이 없을 때만 사용자에게 요청). 특히 구성에 대해서는 정확한 필드 수준 문서와 제약 조건을 위해 `gateway` 도구 작업 `config.schema.lookup`을 에이전트에게 안내한 다음, 더 넓은 지침을 위해 `docs/gateway/configuration.md`와 `docs/gateway/configuration-reference.md`를 안내합니다.

## 관련

- [에이전트 런타임](/ko/concepts/agent)
- [에이전트 작업 영역](/ko/concepts/agent-workspace)
- [컨텍스트 엔진](/ko/concepts/context-engine)
