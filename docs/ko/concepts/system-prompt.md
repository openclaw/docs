---
read_when:
    - 시스템 프롬프트 텍스트, 도구 목록 또는 시간/Heartbeat 섹션 편집하기
    - 워크스페이스 부트스트랩 또는 Skills 주입 동작 변경
summary: OpenClaw 시스템 프롬프트에 포함되는 내용과 조립 방식
title: 시스템 프롬프트
x-i18n:
    generated_at: "2026-06-27T17:25:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw는 모든 에이전트 실행마다 사용자 지정 시스템 프롬프트를 빌드합니다. 프롬프트는 **OpenClaw 소유**이며 런타임 기본 프롬프트를 사용하지 않습니다.

프롬프트는 OpenClaw가 조립하여 각 에이전트 실행에 주입합니다.

프롬프트 조립에는 세 가지 계층이 있습니다.

- `buildAgentSystemPrompt`는 명시적 입력에서 프롬프트를 렌더링합니다. 순수 렌더러로
  유지되어야 하며 전역 config를 직접 읽어서는 안 됩니다.
- `resolveAgentSystemPromptConfig`는 특정 에이전트에 대한
  소유자 표시, TTS 힌트, 모델 별칭, 메모리 인용 모드, 하위 에이전트
  위임 모드와 같은 config 기반 프롬프트 조절값을 해석합니다.
- 런타임 어댑터(임베디드, CLI, 명령/내보내기 미리보기, Compaction)는
  도구, 샌드박스 상태, 채널 기능, 컨텍스트 파일,
  제공자 프롬프트 기여 같은 실시간 정보를 수집한 다음 구성된 프롬프트 facade를 호출합니다.

이렇게 하면 모든 런타임별 세부 정보를 하나의 거대한 빌더로
만들지 않고도 내보낸/디버그 프롬프트 표면을 실제 실행과 정렬할 수 있습니다.

제공자 Plugin은 전체 OpenClaw 소유 프롬프트를 대체하지 않고도
캐시 인식 프롬프트 지침을 기여할 수 있습니다. 제공자 런타임은 다음을 수행할 수 있습니다.

- 이름이 지정된 소수의 핵심 섹션(`interaction_style`,
  `tool_call_style`, `execution_bias`) 대체
- 프롬프트 캐시 경계 위에 **안정적인 접두사** 주입
- 프롬프트 캐시 경계 아래에 **동적 접미사** 주입

모델 패밀리별 튜닝에는 제공자 소유 기여를 사용하세요. 레거시
`before_prompt_build` 프롬프트 변형은 호환성 또는 진정한 전역 프롬프트
변경에만 유지하고, 일반 제공자 동작에는 사용하지 마세요.

OpenAI GPT-5 패밀리 오버레이는 핵심 실행 규칙을 작게 유지하고
페르소나 고정, 간결한 출력, 도구 규율,
병렬 조회, 산출물 범위, 검증, 누락된 컨텍스트,
터미널 도구 위생에 대한 모델별 지침을 추가합니다.

## 구조

프롬프트는 의도적으로 간결하며 고정된 섹션을 사용합니다.

- **도구 사용**: 구조화된 도구가 진실의 원천임을 상기시키는 내용과 런타임 도구 사용 지침.
- **실행 편향**: 간결한 후속 처리 지침: 실행 가능한 요청은
  해당 턴 안에서 처리하고, 완료되거나 차단될 때까지 계속하며, 약한 도구
  결과에서 복구하고, 변경 가능한 상태를 실시간으로 확인하고, 최종화 전에 검증합니다.
- **안전**: 권력 추구 행동이나 감독 우회를 피하라는 짧은 가드레일 알림.
- **Skills**(사용 가능한 경우): 필요할 때 스킬 지침을 로드하는 방법을 모델에 알려줍니다.
- **OpenClaw Control**: config/재시작 작업에는 `gateway` 도구를
  선호하고 CLI 명령을 지어내지 말라고 모델에 알려줍니다.
- **OpenClaw 자체 업데이트**: `config.schema.lookup`으로 config를 안전하게
  검사하고, `config.patch`로 config를 패치하고, `config.apply`로 전체
  config를 교체하고, 명시적인 사용자 요청에서만 `update.run`을 실행하는 방법입니다.
  에이전트 대상 `gateway` 도구는 보호된 exec 경로로 정규화되는
  레거시 `tools.bash.*` 별칭을 포함하여 `tools.exec.ask` / `tools.exec.security`
  재작성을 거부하기도 합니다.
- **작업공간**: 작업 디렉터리(`agents.defaults.workspace`).
- **문서**: OpenClaw 문서/소스의 로컬 경로와 읽어야 하는 시점.
- **작업공간 파일(주입됨)**: 부트스트랩 파일이 아래에 포함되었음을 나타냅니다.
- **샌드박스**(활성화된 경우): 샌드박스 적용 런타임, 샌드박스 경로, 상승 권한 exec 사용 가능 여부를 나타냅니다.
- **현재 날짜 및 시간**: 시간대만 표시합니다(캐시 안정적이며, 실시간 시계는 `session_status`에서 제공됨).
- **어시스턴트 출력 지시문**: 간결한 첨부 파일, 음성 메모, 답장 태그 구문.
- **Heartbeat**: 기본 에이전트에 Heartbeat가 활성화된 경우 Heartbeat 프롬프트 및 ack 동작.
- **런타임**: 호스트, OS, Node, 모델, repo 루트(감지된 경우), 사고 수준(한 줄).
- **추론**: 현재 가시성 수준 + /reasoning 토글 힌트.

OpenClaw는 **프로젝트 컨텍스트**를 포함한 큰 안정적 콘텐츠를
내부 프롬프트 캐시 경계 위에 유지합니다. Control UI 임베드 지침,
**메시징**, **음성**, **그룹 채팅 컨텍스트**,
**반응**, **Heartbeat**, **런타임** 같은 변동성 있는 채널/세션 섹션은 해당 경계
아래에 추가되어, 접두사 캐시가 있는 로컬 백엔드가 채널 턴 간에
안정적인 작업공간 접두사를 재사용할 수 있게 합니다. 도구 설명도 마찬가지로
허용된 스키마가 이미 해당 런타임 세부 정보를 전달할 때 현재
채널 이름을 임베드하지 않아야 합니다.

도구 사용 섹션에는 장기 실행 작업에 대한 런타임 지침도 포함됩니다.

- 향후 후속 작업(`check back later`, 알림, 반복 작업)에는 `exec` sleep 루프,
  `yieldMs` 지연 트릭 또는 반복적인 `process`
  폴링 대신 Cron을 사용합니다.
- 지금 시작되어 백그라운드에서 계속 실행되는 명령에만 `exec` / `process`를 사용합니다.
- 자동 완료 깨우기가 활성화된 경우 명령을 한 번 시작하고,
  출력이 발생하거나 실패할 때 push 기반 깨우기 경로에 의존합니다.
- 실행 중인 명령을 검사해야 할 때는 로그, 상태, 입력 또는 개입에
  `process`를 사용합니다.
- 작업이 더 크다면 `sessions_spawn`을 선호합니다. 하위 에이전트 완료는
  push 기반이며 요청자에게 자동으로 다시 알립니다.
- 완료를 기다리기 위해 `subagents list` / `sessions_list`를 루프로
  폴링하지 마세요.

`agents.defaults.subagents.delegationMode`는 이 지침을 강화할 수 있습니다.
기본 `suggest` 모드는 기준 안내를 유지합니다. `prefer`는 전용
**하위 에이전트 위임** 섹션을 추가하여, 메인 에이전트가 반응성 있는
조정자처럼 행동하고 직접 답변보다 더 복잡한 작업은
`sessions_spawn`을 통해 보내도록 합니다. 이는 프롬프트에만 해당하며, 도구 정책은 여전히
`sessions_spawn` 사용 가능 여부를 제어합니다.

실험적 `update_plan` 도구가 활성화된 경우, 도구 사용은 모델에
사소하지 않은 다단계 작업에만 이를 사용하고, 정확히 하나의
`in_progress` 단계를 유지하며, 각 업데이트 후 전체 계획을 반복하지 말라고도 알려줍니다.

시스템 프롬프트의 안전 가드레일은 권고 사항입니다. 모델 동작을 안내하지만 정책을 강제하지는 않습니다. 강제 적용에는 도구 정책, exec 승인, 샌드박싱, 채널 허용 목록을 사용하세요. 운영자는 설계상 이를 비활성화할 수 있습니다.

네이티브 승인 카드/버튼이 있는 채널에서 런타임 프롬프트는 이제
에이전트에게 해당 네이티브 승인 UI를 먼저 사용하라고 알려줍니다. 도구 결과가 채팅 승인을 사용할 수 없거나
수동 승인이 유일한 경로라고 말할 때만 수동
`/approve` 명령을 포함해야 합니다.

## 프롬프트 모드

OpenClaw는 하위 에이전트용 더 작은 시스템 프롬프트를 렌더링할 수 있습니다. 런타임은 각 실행에
`promptMode`를 설정합니다(사용자 대상 config가 아님).

- `full`(기본값): 위의 모든 섹션을 포함합니다.
- `minimal`: 하위 에이전트에 사용됩니다. **메모리 회상**, **OpenClaw
  자체 업데이트**, **모델 별칭**, **사용자 신원**, **어시스턴트 출력 지시문**,
  **메시징**, **무음 답장**, **Heartbeat**를 생략합니다. 도구 사용, **안전**,
  제공된 경우 **Skills**, 작업공간, 샌드박스, 현재 날짜 및 시간(알려진 경우),
  런타임, 주입된 컨텍스트는 계속 사용할 수 있습니다.
- `none`: 기본 신원 줄만 반환합니다.

`promptMode=minimal`일 때 추가 주입 프롬프트는 **그룹 채팅 컨텍스트** 대신
**하위 에이전트 컨텍스트**로 라벨이 지정됩니다.

채널 자동 답장 실행의 경우, OpenClaw는 직접, 그룹 또는 메시지 도구 전용 컨텍스트가
보이는 답장 계약을 소유할 때 일반 **무음 답장**
섹션을 생략합니다. 이전 자동 그룹/채널 모드만 `NO_REPLY`를 표시해야 하며,
직접 채팅과 메시지 도구 전용 답장은 무음 토큰 지침을 받지 않습니다.

## 프롬프트 스냅샷

OpenClaw는 Codex 런타임 해피 경로에 대한 커밋된 프롬프트 스냅샷을
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 아래에 유지합니다. 이 스냅샷은
선택된 앱 서버 스레드/턴 매개변수와 Telegram 직접, Discord 그룹,
Heartbeat 턴에 대한 재구성된 모델 바운드 프롬프트 계층 스택을 렌더링합니다. 해당 스택에는
Codex의 모델 카탈로그/캐시 형태에서 생성된 고정 Codex `gpt-5.5` 모델 프롬프트 fixture,
Codex 해피 경로 권한 개발자 텍스트,
OpenClaw 개발자 지침, OpenClaw가 제공할 때의 턴 범위 협업 모드 지침,
사용자 턴 입력, 동적 도구 사양에 대한 참조가 포함됩니다.

고정된 Codex 모델 프롬프트 fixture는
`pnpm prompt:snapshots:sync-codex-model`로 새로 고칩니다. 기본적으로 스크립트는
Codex의 런타임 캐시를 `$CODEX_HOME/models_cache.json`에서 찾고, 그다음
`~/.codex/models_cache.json`을 찾으며, 마지막으로 maintainer Codex
체크아웃 관례인 `~/code/codex/codex-rs/models-manager/models.json`으로 폴백합니다. 이러한
소스가 하나도 없으면 명령은 커밋된 fixture를 변경하지 않고 종료합니다.
특정 `models_cache.json` 또는 `models.json` 파일에서 새로 고치려면
`--catalog <path>`를 전달하세요.

이 스냅샷은 여전히 원시 OpenAI 요청을 바이트 단위로 그대로 캡처한 것이 아닙니다. Codex는
OpenClaw가 스레드 및 턴 매개변수를 보낸 뒤 Codex 런타임 내부에서
`AGENTS.md`, 환경 컨텍스트, 메모리, 앱/Plugin 지침, 내장 Default
협업 모드 지침 같은 런타임 소유 작업공간 컨텍스트를 추가할 수 있습니다.

`pnpm prompt:snapshots:gen`으로 다시 생성하고
`pnpm prompt:snapshots:check`로 드리프트를 검증합니다. CI는 추가
경계 샤드에서 드리프트 검사를 실행하여 프롬프트 변경과 스냅샷 업데이트가 같은
PR에 함께 유지되도록 합니다.

## 작업공간 부트스트랩 주입

부트스트랩 파일은 활성 작업공간에서 해석된 다음, 해당 수명에 맞는
프롬프트 표면으로 라우팅됩니다.

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`(완전히 새로운 작업공간에서만)
- 존재하는 경우 `MEMORY.md`

네이티브 Codex 하니스에서 OpenClaw는 모든 사용자 턴에 안정적인 작업공간 파일을
반복하지 않습니다. Codex는 자체 프로젝트 문서
검색을 통해 `AGENTS.md`를 로드합니다. `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, `USER.md`는
Codex 개발자 지침으로 전달됩니다. 간결한 OpenClaw Skills 목록도
턴 범위 협업 개발자 지침으로 전달됩니다. `HEARTBEAT.md` 콘텐츠는
주입되지 않습니다. Heartbeat 턴은 파일이 존재하고 비어 있지 않을 때 해당 파일을 가리키는
협업 모드 노트를 받습니다. 구성된 에이전트
작업공간의 `MEMORY.md` 콘텐츠는 모든 네이티브 Codex 턴에 붙여넣지 않습니다. 해당 작업공간에
메모리 도구가 사용 가능하면 Codex 턴은
턴 범위 협업 개발자 지침에서 작은 작업공간 메모리 노트를 받고,
영속 메모리가 관련될 때 `memory_search` 또는 `memory_get`을 사용해야 합니다. 도구가 비활성화되었거나, 메모리
검색을 사용할 수 없거나, 활성 작업공간이 에이전트 메모리
작업공간과 다르면 `MEMORY.md`는 일반적인 제한된 턴 컨텍스트 경로로 폴백합니다. 활성
`BOOTSTRAP.md` 콘텐츠는 현재 일반 턴 컨텍스트 역할을 유지합니다.

Codex가 아닌 하니스에서는 부트스트랩 파일이 기존 게이트에 따라
OpenClaw 프롬프트로 계속 구성됩니다. 기본 에이전트에 Heartbeat가 비활성화되어 있거나
`agents.defaults.heartbeat.includeSystemPromptSection`이 false인 일반 실행에서는
`HEARTBEAT.md`가 생략됩니다. 주입된 파일은 간결하게 유지하세요.
특히 Codex가 아닌 `MEMORY.md`는 더 그렇습니다. `MEMORY.md`는 선별된 장기 요약으로
유지되도록 의도되었습니다. 자세한 일일 노트는 `memory/*.md`에 두어
`memory_search`와 `memory_get`이 필요할 때 가져올 수 있게 해야 합니다. 크기가 큰
Codex가 아닌 `MEMORY.md` 파일은 프롬프트 사용량을 늘리며 아래의 부트스트랩 파일 제한 때문에
부분적으로만 주입될 수 있습니다.

<Note>
`memory/*.md` 일일 파일은 일반 부트스트랩 프로젝트 컨텍스트의 일부가 **아닙니다**. 일반 턴에서는 `memory_search` 및 `memory_get` 도구를 통해 필요할 때 접근되므로, 모델이 명시적으로 읽지 않는 한 컨텍스트 창을 차지하지 않습니다. 단순 `/new` 및 `/reset` 턴은 예외입니다. 런타임은 해당 첫 턴에 대해 최근 일일 메모리를 일회성 시작 컨텍스트 블록으로 앞에 붙일 수 있습니다.
</Note>

큰 파일은 마커와 함께 잘립니다. 파일당 최대 크기는
`agents.defaults.bootstrapMaxChars`(기본값: 20000)로 제어됩니다. 파일 전체에 주입되는 부트스트랩
콘텐츠 총량은 `agents.defaults.bootstrapTotalMaxChars`
(기본값: 60000)로 제한됩니다. 누락된 파일은 짧은 누락 파일 마커를 주입합니다. 잘림이
발생하면 OpenClaw는 간결한 시스템 프롬프트 경고 알림을 주입할 수 있습니다. 이는
`agents.defaults.bootstrapPromptTruncationWarning`(`off`, `once`, `always`;
기본값: `always`)로 제어합니다. 상세한 원본/주입 카운트는
`/context`, `/status`, doctor, 로그 같은 진단 정보에 유지됩니다.

메모리 파일의 경우 잘림은 데이터 손실이 아닙니다. 파일은 디스크에 온전히 남아 있습니다.
네이티브 Codex에서는 사용 가능한 경우 `MEMORY.md`가 메모리 도구를 통해 필요할 때
읽히며, 도구를 실행할 수 없을 때는 제한된 프롬프트 폴백을 사용합니다. 다른
하네스에서는 모델이 메모리를 직접 읽거나 검색하기 전까지 축약되어 주입된 복사본만
보게 됩니다. 그곳에서 `MEMORY.md`가 반복적으로 잘린다면, 더 짧고 지속 가능한 요약으로
정리하고 자세한 기록은 `memory/*.md`로 옮기거나, 의도적으로 부트스트랩 한도를 높이세요.

하위 에이전트 세션은 `AGENTS.md`와 `TOOLS.md`만 주입합니다(하위 에이전트 컨텍스트를
작게 유지하기 위해 다른 부트스트랩 파일은 필터링됩니다).

내부 훅은 `agent:bootstrap`을 통해 이 단계를 가로채 주입되는 부트스트랩 파일을
변경하거나 교체할 수 있습니다(예: `SOUL.md`를 대체 페르소나로 바꾸기).

에이전트가 덜 일반적으로 들리게 만들고 싶다면
[SOUL.md 성격 가이드](/ko/concepts/soul)부터 시작하세요.

주입된 각 파일이 얼마나 기여하는지(원본 대비 주입, 잘림, 도구 스키마 오버헤드 포함)를
확인하려면 `/context list` 또는 `/context detail`을 사용하세요. [컨텍스트](/ko/concepts/context)를 참고하세요.

## 시간 처리

사용자 시간대를 알고 있을 때 시스템 프롬프트에는 전용 **현재 날짜 및 시간** 섹션이
포함됩니다. 프롬프트 캐시 안정성을 유지하기 위해 이제 **시간대**만 포함합니다
(동적 시계나 시간 형식은 포함하지 않음).

에이전트에 현재 시간이 필요할 때는 `session_status`를 사용하세요. 상태 카드에는
타임스탬프 줄이 포함됩니다. 같은 도구는 선택적으로 세션별 모델
override도 설정할 수 있습니다(`model=default`는 이를 지웁니다).

다음으로 구성합니다.

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

전체 동작 세부 정보는 [날짜 및 시간](/ko/date-time)을 참고하세요.

## Skills

사용 가능한 skills가 있을 때 OpenClaw는 각 skill의 **파일 경로**와 콘텐츠에서 파생된
`<version>` 마커를 포함하는 간결한 **사용 가능한 skills 목록**
(`formatSkillsForPrompt`)을 주입합니다. 프롬프트는 모델에 나열된 위치(워크스페이스,
관리형 또는 번들)의 SKILL.md를 로드하기 위해 `read`를 사용하고, `<version>`이 이전
턴과 다를 때 skill을 다시 읽도록 지시합니다. 사용 가능한 skills가 없으면 Skills 섹션은
생략됩니다.

네이티브 Codex 턴은 정확히 예약된 프롬프트를 보존하는 가벼운 cron 턴을 제외하고,
이 목록을 턴별 사용자 입력 대신 턴 범위 협업 개발자 지침으로 받습니다. 다른 하네스는
일반 프롬프트 섹션을 유지합니다.

위치는 `skills/personal/foo/SKILL.md` 같은 중첩 skill을 가리킬 수 있습니다. 중첩은
조직화 목적일 뿐이며, 프롬프트는 여전히 `SKILL.md` frontmatter의 평면 skill 이름을
사용합니다.

적격성에는 skill 메타데이터 게이트, 런타임 환경/구성 검사, 그리고
`agents.defaults.skills` 또는 `agents.list[].skills`가 구성된 경우 유효한 에이전트 skill
허용 목록이 포함됩니다.

Plugin 번들 skills는 소유 Plugin이 활성화된 경우에만 사용할 수 있습니다. 이를 통해 도구
Plugin은 모든 지침을 각 도구 설명에 직접 포함하지 않고도 더 깊은 운영 가이드를 노출할 수
있습니다.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

이렇게 하면 기본 프롬프트를 작게 유지하면서도 대상 지정 skill 사용을 가능하게 합니다.

skills 목록 예산은 skills 하위 시스템이 소유합니다.

- 전역 기본값: `skills.limits.maxSkillsPromptChars`
- 에이전트별 override: `agents.list[].skillsLimits.maxSkillsPromptChars`

일반적인 제한된 런타임 발췌에는 다른 표면이 사용됩니다.

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

이 분리는 skills 크기 조정을 `memory_get`, 라이브 도구 결과, Compaction 이후
AGENTS.md 새로 고침 같은 런타임 읽기/주입 크기 조정과 분리합니다.

## 문서

시스템 프롬프트에는 **문서** 섹션이 포함됩니다. 로컬 문서가 사용 가능하면 로컬 OpenClaw
문서 디렉터리(Git checkout의 `docs/` 또는 번들 npm 패키지 문서)를 가리킵니다. 로컬
문서를 사용할 수 없으면 [https://docs.openclaw.ai](https://docs.openclaw.ai)로
폴백합니다.

같은 섹션에는 OpenClaw 소스 위치도 포함됩니다. Git checkout은 에이전트가 코드를 직접
검사할 수 있도록 로컬 소스 루트를 노출합니다. 패키지 설치는 GitHub 소스 URL을 포함하고,
문서가 불완전하거나 오래된 경우 에이전트에게 그곳에서 소스를 검토하라고 지시합니다.
프롬프트는 또한 skills 발견을 위한 공개 문서 미러, 커뮤니티 Discord, ClawHub
([https://clawhub.ai](https://clawhub.ai))를 언급합니다. 이는 모델이 OpenClaw의 작동
방식을 이해하기 전에, 메모리/일일 노트, 세션, 도구, Gateway, 구성, 명령, 프로젝트
컨텍스트를 포함한 OpenClaw 자체 지식의 권위로 문서를 규정합니다. 프롬프트는 모델에게
먼저 로컬 문서(로컬 문서를 사용할 수 없을 때는 문서 미러)를 사용하고, AGENTS.md,
프로젝트 컨텍스트, 워크스페이스/프로필/메모리 노트, `memory_search`는 OpenClaw 설계나
구현 지식이 아니라 지침 컨텍스트 또는 사용자 메모리로 취급하라고 지시합니다. 문서가
침묵하거나 오래되었다면 모델은 그렇게 말하고 소스를 검사해야 합니다. 프롬프트는 또한
가능할 때 모델이 `openclaw status`를 직접 실행하고, 접근 권한이 없을 때만 사용자에게
요청하라고 지시합니다.
특히 구성의 경우, 정확한 필드 수준 문서와 제약 조건을 위해 에이전트에게 `gateway` 도구
동작 `config.schema.lookup`을 가리킨 다음, 더 넓은 지침을 위해
`docs/gateway/configuration.md`와 `docs/gateway/configuration-reference.md`를
가리킵니다.

## 관련 항목

- [에이전트 런타임](/ko/concepts/agent)
- [에이전트 워크스페이스](/ko/concepts/agent-workspace)
- [컨텍스트 엔진](/ko/concepts/context-engine)
