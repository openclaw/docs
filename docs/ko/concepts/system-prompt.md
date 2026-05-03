---
read_when:
    - 시스템 프롬프트 텍스트, 도구 목록 또는 시간/Heartbeat 섹션 편집
    - 워크스페이스 부트스트랩 또는 Skills 주입 동작 변경
summary: OpenClaw 시스템 프롬프트에 포함되는 내용과 구성 방식
title: 시스템 프롬프트
x-i18n:
    generated_at: "2026-05-03T21:30:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw는 모든 에이전트 실행마다 사용자 지정 시스템 프롬프트를 빌드합니다. 이 프롬프트는 **OpenClaw 소유**이며 pi-coding-agent 기본 프롬프트를 사용하지 않습니다.

프롬프트는 OpenClaw가 조립하여 각 에이전트 실행에 주입합니다.

Provider Plugin은 전체 OpenClaw 소유 프롬프트를 대체하지 않고도 캐시를 고려한 프롬프트 지침을 제공할 수 있습니다. provider 런타임은 다음을 수행할 수 있습니다.

- 이름이 지정된 소수의 핵심 섹션(`interaction_style`, `tool_call_style`, `execution_bias`) 교체
- 프롬프트 캐시 경계 위에 **안정적인 prefix** 주입
- 프롬프트 캐시 경계 아래에 **동적인 suffix** 주입

모델 계열별 튜닝에는 provider 소유 기여를 사용하세요. 레거시
`before_prompt_build` 프롬프트 변경은 호환성이나 진정한 전역 프롬프트
변경을 위해 남겨 두고, 일반적인 provider 동작에는 사용하지 마세요.

OpenAI GPT-5 계열 overlay는 핵심 실행 규칙을 작게 유지하고
persona latching, 간결한 출력, 도구 규율, 병렬 조회, deliverable coverage,
검증, 누락된 컨텍스트, terminal-tool 위생에 대한 모델별 지침을 추가합니다.

## 구조

프롬프트는 의도적으로 간결하며 고정 섹션을 사용합니다.

- **도구 사용**: 구조화된 도구의 source-of-truth 알림과 런타임 도구 사용 지침입니다.
- **실행 성향**: 실행 완료를 위한 간결한 지침입니다. 실행 가능한 요청은
  현재 턴에서 처리하고, 완료되거나 막힐 때까지 계속하며, 약한 도구
  결과에서 회복하고, 변경 가능한 상태를 실시간으로 확인하며, 최종화 전에 검증합니다.
- **안전**: 권력 추구 행동이나 감독 우회를 피하라는 짧은 가드레일 알림입니다.
- **Skills**(사용 가능할 때): 필요할 때 skill 지침을 로드하는 방법을 모델에 알려줍니다.
- **OpenClaw 자체 업데이트**: `config.schema.lookup`으로 config를 안전하게 검사하고,
  `config.patch`로 config를 패치하며, `config.apply`로 전체 config를 교체하고,
  명시적인 사용자 요청이 있을 때만 `update.run`을 실행하는 방법입니다.
  owner-only `gateway` 도구도 레거시 `tools.bash.*` alias를 포함해
  보호된 exec 경로로 정규화되는 `tools.exec.ask` / `tools.exec.security`를
  재작성하는 것을 거부합니다.
- **워크스페이스**: 작업 디렉터리(`agents.defaults.workspace`)입니다.
- **문서**: OpenClaw 문서의 로컬 경로(repo 또는 npm package)와 읽어야 하는 시점입니다.
- **워크스페이스 파일(주입됨)**: bootstrap 파일이 아래에 포함됨을 나타냅니다.
- **샌드박스**(활성화된 경우): sandboxed 런타임, sandbox 경로, elevated exec 사용 가능 여부를 나타냅니다.
- **현재 날짜 및 시간**: 사용자 로컬 시간, 시간대, 시간 형식입니다.
- **답장 태그**: 지원되는 provider의 선택적 답장 태그 구문입니다.
- **Heartbeat**: 기본 에이전트에 Heartbeat가 활성화된 경우 Heartbeat 프롬프트와 ack 동작입니다.
- **런타임**: 호스트, OS, Node, 모델, repo root(감지된 경우), thinking level(한 줄)입니다.
- **추론**: 현재 visibility level + /reasoning 토글 힌트입니다.

OpenClaw는 **프로젝트 컨텍스트**를 포함한 큰 안정적 콘텐츠를 내부
프롬프트 캐시 경계 위에 유지합니다. Control UI embed guidance, **메시징**,
**음성**, **그룹 채팅 컨텍스트**, **반응**, **Heartbeat**, **런타임**처럼
변동성이 큰 channel/session 섹션은 그 경계 아래에 추가되어, prefix 캐시가
있는 로컬 backend가 channel 턴 전반에서 안정적인 workspace prefix를
재사용할 수 있게 합니다. 마찬가지로 도구 설명은 허용된 schema가 이미
해당 런타임 세부 정보를 담고 있다면 현재 channel 이름을 포함하지 않아야 합니다.

도구 사용 섹션에는 장기 실행 작업을 위한 런타임 지침도 포함됩니다.

- 미래의 후속 작업(`check back later`, reminder, 반복 작업)에는
  `exec` sleep loop, `yieldMs` 지연 기법, 반복적인 `process` polling 대신 Cron을 사용합니다.
- 지금 시작해 백그라운드에서 계속 실행되는 명령에만 `exec` / `process`를 사용합니다.
- 자동 완료 wake가 활성화되어 있으면 명령을 한 번만 시작하고, 출력이 발생하거나 실패할 때
  push 기반 wake 경로에 의존합니다.
- 실행 중인 명령을 검사해야 할 때 로그, 상태, 입력 또는 개입에는 `process`를 사용합니다.
- 작업이 더 크면 `sessions_spawn`을 선호합니다. sub-agent 완료는 push 기반이며 requester에게 자동으로 알립니다.
- 완료를 기다리기 위해 `subagents list` / `sessions_list`를 loop에서 polling하지 마세요.

실험적 `update_plan` 도구가 활성화된 경우, 도구 사용 섹션은 모델에
중요한 다단계 작업에만 이를 사용하고, 정확히 하나의 `in_progress` 단계를
유지하며, 각 업데이트 후 전체 계획을 반복하지 말라고도 알려줍니다.

시스템 프롬프트의 안전 가드레일은 조언입니다. 모델 동작을 안내하지만 정책을 강제하지는 않습니다. 강제 적용에는 도구 정책, exec 승인, sandboxing, channel allowlist를 사용하세요. 운영자는 설계상 이를 비활성화할 수 있습니다.

네이티브 승인 카드/버튼이 있는 channel에서는 런타임 프롬프트가 이제
에이전트에게 해당 네이티브 승인 UI를 먼저 사용하라고 알려줍니다. 도구
결과가 채팅 승인을 사용할 수 없거나 수동 승인이 유일한 경로라고 말할 때만
수동 `/approve` 명령을 포함해야 합니다.

## 프롬프트 모드

OpenClaw는 sub-agent용으로 더 작은 시스템 프롬프트를 렌더링할 수 있습니다. 런타임은
각 실행에 대해 `promptMode`를 설정합니다(사용자 대상 config가 아님).

- `full`(기본값): 위의 모든 섹션을 포함합니다.
- `minimal`: sub-agent에 사용됩니다. **Skills**, **메모리 회상**, **OpenClaw
  자체 업데이트**, **모델 alias**, **사용자 ID**, **답장 태그**,
  **메시징**, **무음 답장**, **Heartbeat**를 생략합니다. 도구 사용, **안전**,
  워크스페이스, 샌드박스, 현재 날짜 및 시간(알려진 경우), 런타임, 주입된
  컨텍스트는 계속 사용할 수 있습니다.
- `none`: 기본 identity line만 반환합니다.

`promptMode=minimal`일 때 추가 주입 프롬프트는 **그룹 채팅 컨텍스트** 대신
**Subagent Context**로 표시됩니다.

channel 자동 답장 실행의 경우, 직접/그룹 채팅 컨텍스트에 이미 확인된
conversation-specific `NO_REPLY` 동작이 포함되어 있으면 OpenClaw는 일반적인
**무음 답장** 섹션을 생략할 수 있습니다. 이렇게 하면 전역 시스템 프롬프트와
channel 컨텍스트 양쪽에서 token mechanics를 반복하지 않습니다.

## 프롬프트 스냅샷

OpenClaw는 Codex 런타임 happy path용으로 커밋된 프롬프트 스냅샷을
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 아래에
유지합니다. 이 스냅샷은 선택된 app-server thread/turn params와 Telegram
direct, Discord group, heartbeat 턴을 위한 재구성된 model-bound prompt
layer stack을 렌더링합니다. 해당 stack에는 Codex의 모델 catalog/cache 형태에서
생성된 고정 Codex `gpt-5.5` 모델 프롬프트 fixture, Codex happy-path permission
developer text, OpenClaw developer instructions, OpenClaw가 제공하는 경우
turn-scoped collaboration-mode instructions, 사용자 턴 입력, 동적 도구 spec에 대한
참조가 포함됩니다.

고정 Codex 모델 프롬프트 fixture는
`pnpm prompt:snapshots:sync-codex-model`로 새로 고치세요. 기본적으로 스크립트는
Codex 런타임 캐시를 `$CODEX_HOME/models_cache.json`, 그다음
`~/.codex/models_cache.json`에서 찾고, 그 후에만 maintainer Codex checkout 규약인
`~/code/codex/codex-rs/models-manager/models.json`으로 fallback합니다. 이 소스 중
어느 것도 없으면 명령은 커밋된 fixture를 변경하지 않고 종료됩니다. 특정
`models_cache.json` 또는 `models.json` 파일에서 새로 고치려면 `--catalog <path>`를 전달하세요.

이 스냅샷은 여전히 byte-for-byte 원시 OpenAI 요청 capture가 아닙니다. OpenClaw가
thread 및 turn params를 보낸 뒤 Codex 런타임 내부에서 Codex는 `AGENTS.md`,
환경 컨텍스트, memory, app/plugin instructions, 내장 Default collaboration-mode
instructions 같은 runtime-owned workspace context를 추가할 수 있습니다.

`pnpm prompt:snapshots:gen`으로 다시 생성하고 `pnpm prompt:snapshots:check`로
drift를 검증하세요. CI는 additional boundary shard에서 drift check를 실행하므로
프롬프트 변경과 스냅샷 업데이트가 같은 PR에 붙어 유지됩니다.

## 워크스페이스 bootstrap 주입

Bootstrap 파일은 trim되어 **프로젝트 컨텍스트** 아래에 추가되므로 모델은 명시적으로 읽지 않아도 identity와 profile context를 볼 수 있습니다.

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`(완전히 새로운 워크스페이스에서만)
- 존재하는 경우 `MEMORY.md`

이 모든 파일은 파일별 gate가 적용되지 않는 한 모든 턴에서 **컨텍스트 창에 주입**됩니다.
기본 에이전트에 Heartbeat가 비활성화되어 있거나
`agents.defaults.heartbeat.includeSystemPromptSection`이 false이면 일반 실행에서
`HEARTBEAT.md`는 생략됩니다. 주입 파일은 간결하게 유지하세요. 특히
`MEMORY.md`는 시간이 지나며 커질 수 있어 예상보다 높은 컨텍스트 사용량과
더 잦은 Compaction으로 이어질 수 있습니다.

세션이 네이티브 Codex harness에서 실행될 때 Codex는 자체 project-doc discovery를 통해
`AGENTS.md`를 로드합니다. OpenClaw는 여전히 나머지 bootstrap 파일을 확인하고 이를
Codex config instructions로 전달하므로 `SOUL.md`, `TOOLS.md`, `IDENTITY.md`,
`USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`는 `AGENTS.md`를 중복하지
않으면서 동일한 workspace-context 역할을 유지합니다.

<Note>
`memory/*.md` daily 파일은 일반 bootstrap 프로젝트 컨텍스트의 일부가 **아닙니다**. 일반 턴에서는 `memory_search` 및 `memory_get` 도구를 통해 필요할 때 접근되므로, 모델이 명시적으로 읽지 않는 한 컨텍스트 창을 차지하지 않습니다. Bare `/new` 및 `/reset` 턴은 예외입니다. 런타임은 해당 첫 턴을 위해 최근 daily memory를 one-shot startup-context block으로 앞에 붙일 수 있습니다.
</Note>

큰 파일은 marker와 함께 잘립니다. 파일당 최대 크기는
`agents.defaults.bootstrapMaxChars`로 제어됩니다(기본값: 12000). 파일 전체에 걸쳐
주입되는 bootstrap 콘텐츠 총량은 `agents.defaults.bootstrapTotalMaxChars`로 제한됩니다
(기본값: 60000). 누락된 파일은 짧은 missing-file marker를 주입합니다. Truncation이
발생하면 OpenClaw는 프로젝트 컨텍스트에 warning block을 주입할 수 있습니다. 이는
`agents.defaults.bootstrapPromptTruncationWarning`(`off`, `once`, `always`;
기본값: `once`)로 제어하세요.

Sub-agent 세션은 `AGENTS.md`와 `TOOLS.md`만 주입합니다(다른 bootstrap 파일은
sub-agent 컨텍스트를 작게 유지하기 위해 필터링됩니다).

내부 hook은 `agent:bootstrap`을 통해 이 단계를 가로채 주입되는 bootstrap 파일을
변경하거나 대체할 수 있습니다(예: `SOUL.md`를 대체 persona로 교체).

에이전트가 덜 일반적으로 들리게 만들고 싶다면
[SOUL.md Personality Guide](/ko/concepts/soul)부터 시작하세요.

주입된 각 파일의 기여량(raw vs injected, truncation, 도구 schema overhead 포함)을
검사하려면 `/context list` 또는 `/context detail`을 사용하세요. [컨텍스트](/ko/concepts/context)를 참조하세요.

## 시간 처리

사용자 시간대가 알려진 경우 시스템 프롬프트에는 전용 **현재 날짜 및 시간** 섹션이 포함됩니다.
프롬프트 캐시를 안정적으로 유지하기 위해 이제 **시간대**만 포함합니다(동적 clock이나 시간 형식 없음).

에이전트에 현재 시간이 필요할 때는 `session_status`를 사용하세요. status card에는 timestamp line이
포함됩니다. 같은 도구는 선택적으로 session별 모델 override도 설정할 수 있습니다
(`model=default`는 이를 지웁니다).

다음으로 구성하세요.

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`(`auto` | `12` | `24`)

전체 동작 세부 정보는 [날짜 및 시간](/ko/date-time)을 참조하세요.

## Skills

적격 skill이 있으면 OpenClaw는 각 skill의 **파일 경로**를 포함하는 간결한
**사용 가능한 skills 목록**(`formatSkillsForPrompt`)을 주입합니다. 프롬프트는
모델에게 나열된 위치(workspace, managed, bundled)의 SKILL.md를 로드하기 위해
`read`를 사용하라고 지시합니다. 적격 skill이 없으면 Skills 섹션은 생략됩니다.

적격성에는 skill metadata gate, 런타임 environment/config check, 그리고
`agents.defaults.skills` 또는 `agents.list[].skills`가 구성된 경우 effective agent skill allowlist가 포함됩니다.

Plugin-bundled skills는 소유 Plugin이 활성화된 경우에만 적격입니다. 이를 통해 tool Plugin은
모든 도구 설명에 해당 지침을 직접 포함하지 않고도 더 깊은 운영 guide를 노출할 수 있습니다.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

이렇게 하면 base prompt를 작게 유지하면서도 targeted skill usage가 가능합니다.

skills 목록 예산은 skills subsystem이 소유합니다.

- 전역 기본값: `skills.limits.maxSkillsPromptChars`
- 에이전트별 override: `agents.list[].skillsLimits.maxSkillsPromptChars`

일반적인 제한된 런타임 발췌에는 다른 인터페이스를 사용합니다.

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

이 구분은 `memory_get`, 실시간 도구 결과, Compaction 이후 AGENTS.md 새로 고침 같은 런타임 읽기/주입 크기 산정과 Skills 크기 산정을 분리합니다.

## 문서

시스템 프롬프트에는 **문서** 섹션이 포함됩니다. 로컬 문서를 사용할 수 있으면 로컬 OpenClaw 문서 디렉터리(Git 체크아웃의 `docs/` 또는 번들된 npm 패키지 문서)를 가리킵니다. 로컬 문서를 사용할 수 없으면 [https://docs.openclaw.ai](https://docs.openclaw.ai)로 폴백합니다.

같은 섹션에는 OpenClaw 소스 위치도 포함됩니다. Git 체크아웃은 에이전트가 코드를 직접 검사할 수 있도록 로컬 소스 루트를 노출합니다. 패키지 설치에는 GitHub 소스 URL이 포함되며, 문서가 불완전하거나 오래된 경우 에이전트에게 그곳에서 소스를 검토하라고 안내합니다. 프롬프트는 공개 문서 미러, 커뮤니티 Discord, Skills 탐색을 위한 ClawHub([https://clawhub.ai](https://clawhub.ai))도 언급합니다. 모델에게 OpenClaw 동작, 명령, 구성 또는 아키텍처에 대해서는 먼저 문서를 참고하고, 가능하면 `openclaw status`를 직접 실행하라고 안내합니다(접근 권한이 없을 때만 사용자에게 요청). 특히 구성의 경우, 정확한 필드 수준 문서와 제약 조건을 위해 에이전트를 `gateway` 도구 작업 `config.schema.lookup`으로 안내한 다음, 더 폭넓은 지침을 위해 `docs/gateway/configuration.md` 및 `docs/gateway/configuration-reference.md`를 안내합니다.

## 관련

- [에이전트 런타임](/ko/concepts/agent)
- [에이전트 작업 공간](/ko/concepts/agent-workspace)
- [컨텍스트 엔진](/ko/concepts/context-engine)
