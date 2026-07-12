---
read_when:
    - 시스템 프롬프트 텍스트, 도구 목록 또는 시간/Heartbeat 섹션 편집
    - 워크스페이스 부트스트랩 또는 Skills 주입 동작 변경
summary: OpenClaw 시스템 프롬프트의 구성 내용과 조립 방식
title: 시스템 프롬프트
x-i18n:
    generated_at: "2026-07-12T15:12:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw는 에이전트가 실행될 때마다 자체 시스템 프롬프트를 빌드하며, 런타임 기본 프롬프트는 없습니다.

조립은 세 계층으로 이루어집니다.

- `buildAgentSystemPrompt`는 명시적 입력에서 프롬프트를 렌더링합니다. 순수 렌더러로 유지되며 전역 구성을 직접 읽지 않습니다.
- `resolveAgentSystemPromptConfig`는 특정 에이전트에 대해 구성 기반 프롬프트 조정 항목(소유자 표시, TTS 힌트, 모델 별칭, 메모리 인용 모드, 하위 에이전트 위임 모드)을 해석합니다.
- 런타임 어댑터(임베디드, CLI, 명령/내보내기 미리 보기, Compaction)는 실시간 정보(도구, 샌드박스 상태, 채널 기능, 컨텍스트 파일, 제공자 프롬프트 기여분)를 수집하고 구성된 프롬프트 퍼사드를 호출합니다.

이렇게 하면 모든 런타임 세부 정보를 하나의 거대한 빌더에 몰아넣지 않고도 내보내기/디버그 프롬프트 표면을 실제 실행과 일치시킬 수 있습니다.

제공자 Plugin은 OpenClaw가 소유한 프롬프트를 대체하지 않고 캐시를 고려한 지침을 제공할 수 있습니다. 제공자 런타임은 다음을 수행할 수 있습니다.

- 이름이 지정된 세 핵심 섹션 `interaction_style`, `tool_call_style`, `execution_bias` 중 하나를 대체
- 프롬프트 캐시 경계 위에 **안정적 접두사** 삽입
- 프롬프트 캐시 경계 아래에 **동적 접미사** 삽입

모델 제품군별 조정에는 제공자 소유 기여분을 사용하십시오. 레거시 `before_prompt_build` 훅은 호환성 또는 실제로 전역적인 프롬프트 변경에만 사용하십시오.

번들 OpenAI/Codex GPT-5 제품군 오버레이(`resolveGpt5SystemPromptContribution`)는 이 메커니즘을 사용합니다. 즉, `stablePrefix` 동작 계약(실행 정책, 도구 규율, 출력 계약, 완료 계약)과 더 친근한 어조를 위한 선택적 `interaction_style` 재정의로 구성됩니다. OpenAI 또는 Codex Plugin을 통해 라우팅되는 모든 `gpt-5*` 모델 ID에 적용되며, `agents.defaults.promptOverlays.gpt5.personality`(`"friendly"`/`"on"` 또는 `"off"`)로 제어합니다.

## 구조

프롬프트는 다음과 같은 고정 섹션으로 간결하게 구성됩니다.

- **도구 사용**: 구조화된 도구가 신뢰할 수 있는 원본임을 알리는 안내와 런타임 도구 사용 지침입니다. 실험적 `update_plan` 도구가 활성화되면(`tools.experimental.planTool`) 자체 도구 설명에 다음 내용이 추가됩니다. 중요하고 여러 단계로 이루어진 작업에만 사용하고, `in_progress` 단계는 최대 하나만 유지하며, 간단한 단일 단계 작업에는 사용하지 않습니다.
- **실행 우선 원칙**: 실행 가능한 요청은 현재 턴에서 처리하고, 완료되거나 차단될 때까지 계속하며, 불충분한 도구 결과에서 복구하고, 변경 가능한 상태를 실시간으로 확인하며, 최종 완료 전에 검증합니다.
- **안전**: 권한 추구 행위나 감독 우회를 방지하기 위한 짧은 보호 장치 안내입니다.
- **Skills**(사용 가능한 경우): 모델에 필요할 때 Skills 지침을 로드하는 방법을 알려 줍니다.
- **OpenClaw 제어**: 구성/재시작 작업에는 `gateway` 도구를 우선 사용하며 CLI 명령을 지어내지 않습니다.
- **OpenClaw 자체 업데이트**: `config.schema.lookup`으로 구성을 안전하게 검사하고, `config.patch`로 패치하며, `config.apply`로 전체 구성을 교체하고, 사용자가 명시적으로 요청한 경우에만 `update.run`을 실행합니다. 에이전트용 `gateway` 도구는 보호된 해당 경로로 정규화되는 레거시 `tools.bash.*` 별칭을 포함하여 `tools.exec.ask` / `tools.exec.security`를 다시 쓰는 것을 거부합니다.
- **작업 공간**: 작업 디렉터리(`agents.defaults.workspace`)입니다.
- **문서**: 로컬 문서/소스 경로와 이를 읽어야 하는 시점입니다.
- **작업 공간 파일(삽입됨)**: 부트스트랩 파일이 아래에 포함됨을 알립니다.
- **샌드박스**(활성화된 경우): 샌드박스 런타임, 샌드박스 경로, 권한 상승 실행 가능 여부입니다.
- **현재 날짜 및 시간**: 시간대만 포함합니다(캐시에 안정적이며, 실시간 시각은 `session_status`에서 가져옵니다).
- **어시스턴트 출력 지시문**: 간결한 첨부 파일, 음성 메모, 답장 태그 구문입니다.
- **Heartbeats**: 기본 에이전트에 Heartbeat가 활성화된 경우 Heartbeat 프롬프트와 확인 응답 동작입니다.
- **런타임**: 호스트, OS, Node, 모델, 저장소 루트(감지된 경우), 사고 수준을 한 줄로 표시합니다.
- **추론**: 현재 공개 수준과 `/reasoning` 전환 힌트입니다.

**프로젝트 컨텍스트**를 포함한 크고 안정적인 콘텐츠는 내부 프롬프트 캐시 경계 위에 유지됩니다. 턴마다 변하는 섹션(Control UI 임베드 지침, **메시징**, **음성**, **그룹 채팅 컨텍스트**, **반응**, **Heartbeats**, **런타임**)은 해당 경계 아래에 추가되므로, 접두사 캐시가 있는 로컬 백엔드는 채널 턴 간에 안정적인 작업 공간 접두사를 재사용할 수 있습니다. 허용되는 스키마가 이미 해당 런타임 세부 정보를 전달한다면 도구 설명에 현재 채널 이름을 삽입하지 않아야 합니다.

도구 사용 섹션에는 장기 실행 작업에 대한 다음 지침도 포함됩니다.

- 향후 후속 작업(`check back later`, 미리 알림, 반복 작업)에는 `exec` 절전 루프, `yieldMs` 지연 기법 또는 반복적인 `process` 폴링 대신 cron을 사용합니다.
- 지금 시작하여 백그라운드에서 계속되는 명령에만 `exec` / `process`를 사용합니다.
- 자동 완료 깨우기가 활성화된 경우 명령을 한 번 시작하고 푸시 기반 깨우기 경로에 의존합니다.
- 실행 중인 명령의 로그, 상태, 입력 또는 개입에는 `process`를 사용합니다.
- 규모가 큰 작업에는 `sessions_spawn`을 우선 사용합니다. 하위 에이전트 완료는 푸시 기반이며 요청자에게 자동으로 다시 알립니다.
- 완료를 기다리기 위해 `subagents list` / `sessions_list`를 루프에서 폴링하지 않습니다.

`agents.defaults.subagents.delegationMode`(기본값 `"suggest"`)로 이 지침을 강화할 수 있습니다. `"prefer"`는 전용 **하위 에이전트 위임** 섹션을 추가하여 기본 에이전트가 신속하게 대응하는 조정자 역할을 하고, 직접 답변보다 복잡한 모든 작업을 `sessions_spawn`을 통해 처리하도록 지시합니다. 이는 프롬프트에만 적용되며, `sessions_spawn`의 사용 가능 여부는 여전히 도구 정책에서 제어합니다.

시스템 프롬프트의 안전 보호 장치는 권고 사항이며 강제 수단이 아닙니다. 강제 적용에는 도구 정책, 실행 승인, 샌드박싱, 채널 허용 목록을 사용하십시오. 운영자는 설계상 프롬프트 보호 장치를 비활성화할 수 있습니다.

기본 승인 카드/버튼이 있는 채널에서는 프롬프트가 에이전트에게 해당 UI를 먼저 사용하도록 지시하며, 도구 결과에서 채팅 승인을 사용할 수 없다고 표시하거나 수동 승인이 유일한 경로인 경우에만 수동 `/approve` 명령을 포함하도록 합니다.

## 프롬프트 모드

OpenClaw는 하위 에이전트용으로 더 작은 시스템 프롬프트를 렌더링합니다. 런타임은 실행마다 `promptMode`를 설정합니다(사용자 대상 구성이 아님).

- `full`(기본값): 위의 모든 섹션입니다.
- `minimal`: 하위 에이전트에 사용합니다. **메모리 회상**으로 번들되는 메모리 프롬프트 섹션, **OpenClaw 자체 업데이트**, **모델 별칭**, **사용자 ID**, **어시스턴트 출력 지시문**, **메시징**, **무응답**, **Heartbeats**를 생략합니다. 도구 사용, **안전**, **Skills**(제공된 경우), 작업 공간, 샌드박스, 현재 날짜 및 시간(알려진 경우), 런타임, 삽입된 컨텍스트는 계속 사용할 수 있습니다.
- `none`: 기본 ID 한 줄만 반환합니다.

`promptMode=minimal`에서는 추가 삽입 프롬프트의 레이블이 **그룹 채팅 컨텍스트** 대신 **하위 에이전트 컨텍스트**로 표시됩니다.

채널 자동 응답 실행의 경우 직접, 그룹 또는 메시지 도구 전용 컨텍스트가 이미 표시 응답 계약을 소유하고 있으면 OpenClaw는 일반 **무응답** 섹션을 생략합니다. 레거시 자동 그룹/채널 모드에서만 `NO_REPLY`가 표시되며, 직접 채팅과 메시지 도구 전용 응답에서는 무응답 토큰 지침을 건너뜁니다.

## 프롬프트 스냅샷

OpenClaw는 `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 아래에 Codex 런타임 정상 경로용으로 커밋된 프롬프트 스냅샷을 유지합니다. 이 스냅샷은 선택된 앱 서버 스레드/턴 매개변수와 재구성된 모델 바인딩 프롬프트 계층 스택을 Telegram 직접 메시지, Discord 그룹, Heartbeat 턴에 대해 렌더링합니다. 여기에는 고정된 Codex `gpt-5.5` 모델 프롬프트 픽스처, Codex 정상 경로 권한 개발자 텍스트, OpenClaw 개발자 지침, OpenClaw가 제공하는 경우 턴 범위 협업 모드 지침, 사용자 턴 입력, 동적 도구 사양 참조가 포함됩니다.

고정된 Codex 모델 프롬프트 픽스처는 `pnpm prompt:snapshots:sync-codex-model`로 새로 고치십시오. 기본적으로 `$CODEX_HOME/models_cache.json`, 그다음 `~/.codex/models_cache.json`, 그다음 유지관리자 체크아웃 규칙인 `~/code/codex/codex-rs/models-manager/models.json`을 찾습니다. 어느 것도 없으면 커밋된 픽스처를 변경하지 않고 종료합니다. 특정 `models_cache.json` 또는 `models.json` 파일에서 새로 고치려면 `--catalog <path>`를 전달하십시오.

이 스냅샷은 원시 OpenAI 요청을 바이트 단위로 그대로 캡처한 것이 아닙니다. OpenClaw가 스레드 및 턴 매개변수를 전송한 후 Codex가 런타임 소유 작업 공간 컨텍스트(`AGENTS.md`, 환경 컨텍스트, 메모리, 앱/Plugin 지침, 내장 Default 협업 모드 지침)를 추가할 수 있습니다.

`pnpm prompt:snapshots:gen`으로 다시 생성하고, `pnpm prompt:snapshots:check`로 차이를 검증하십시오. CI는 추가 경계 샤드와 함께 차이 검사를 실행하므로 프롬프트 변경과 스냅샷 업데이트는 동일한 PR에 포함됩니다.

## 작업 공간 부트스트랩 삽입

부트스트랩 파일은 활성 작업 공간에서 확인되며 수명 주기에 맞는 프롬프트 표면으로 라우팅됩니다.

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`(새 작업 공간에서만)
- 존재하는 경우 `MEMORY.md`

기본 Codex 하네스에서 OpenClaw는 모든 사용자 턴에 안정적인 작업 공간 파일을 반복하지 않습니다. Codex는 자체 프로젝트 문서 검색을 통해 `AGENTS.md`를 로드합니다. `TOOLS.md`는 상속된 Codex 개발자 지침으로 전달됩니다. `SOUL.md`, `IDENTITY.md`, `USER.md`는 턴 범위 협업 개발자 지침으로 전달되므로 기본 Codex 하위 에이전트는 이를 상속하지 않습니다. `HEARTBEAT.md` 콘텐츠는 직접 삽입되지 않습니다. Heartbeat 턴에서는 파일이 존재하고 비어 있지 않을 때 해당 파일을 가리키는 협업 모드 메모를 받습니다. `MEMORY.md` 콘텐츠도 모든 기본 Codex 턴에 붙여 넣지 않습니다. 작업 공간에서 메모리 도구를 사용할 수 있으면 Codex 턴에 모델을 `memory_search` 또는 `memory_get`으로 안내하는 작은 작업 공간 메모리 안내가 추가됩니다. 도구가 비활성화되었거나, 메모리 검색을 사용할 수 없거나, 활성 작업 공간이 에이전트 메모리 작업 공간과 다른 경우 `MEMORY.md`는 일반적인 제한된 턴 컨텍스트 경로로 대체됩니다. `BOOTSTRAP.md`는 일반적인 턴 컨텍스트 역할을 유지합니다.

Codex 이외의 하네스에서는 기존 조건에 따라 부트스트랩 파일이 OpenClaw 프롬프트에 구성됩니다. 기본 에이전트에 Heartbeat가 비활성화되어 있거나 `agents.defaults.heartbeat.includeSystemPromptSection`이 false인 경우 일반 실행에서는 `HEARTBEAT.md`가 생략됩니다. 삽입 파일은 간결하게 유지하십시오. 특히 Codex 이외의 `MEMORY.md`는 엄선된 장기 요약으로 유지하고, 자세한 일일 메모는 필요할 때 `memory_search` / `memory_get`으로 검색할 수 있도록 `memory/*.md`에 두어야 합니다. 지나치게 큰 Codex 이외의 `MEMORY.md` 파일은 프롬프트 사용량을 늘리며 아래 부트스트랩 파일 제한에 따라 일부만 삽입될 수 있습니다.

<Note>
`memory/*.md` 일일 파일은 일반 부트스트랩 프로젝트 컨텍스트의 일부가 **아닙니다**. 일반 턴에서는 필요할 때 `memory_search` / `memory_get`으로 접근하므로 모델이 명시적으로 읽지 않는 한 컨텍스트 창을 차지하지 않습니다. 예외는 추가 인수가 없는 `/new` 및 `/reset` 턴입니다. 런타임은 해당 첫 번째 턴에 한해 최근 일일 메모리를 일회성 시작 컨텍스트 블록으로 앞에 추가할 수 있습니다.
</Note>

큰 파일은 마커와 함께 잘립니다.

| 제한                                         | 구성 키                                             | 기본값   |
| -------------------------------------------- | -------------------------------------------------- | -------- |
| 파일당 최대 문자 수                          | `agents.defaults.bootstrapMaxChars`                | 20000    |
| 모든 파일의 총합                             | `agents.defaults.bootstrapTotalMaxChars`           | 60000    |
| 잘림 경고(`off`\|`once`\|`always`)           | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

누락된 파일에는 짧은 파일 누락 마커가 삽입됩니다. 상세한 원본/삽입 개수는 `/context`, `/status`, doctor, 로그와 같은 진단 정보에 유지됩니다.

메모리 파일의 경우 잘림은 데이터 손실이 아닙니다. 파일은 디스크에 온전히 유지됩니다. 기본 Codex에서는 사용할 수 있는 경우 메모리 도구를 통해 필요할 때 `MEMORY.md`를 읽고, 그렇지 않으면 제한된 프롬프트 대체 경로를 사용합니다. 다른 하네스에서는 모델이 메모리를 직접 읽거나 검색할 때까지 축약된 삽입 사본만 볼 수 있습니다. `MEMORY.md`가 반복해서 잘린다면 더 짧고 지속 가능한 요약으로 정제하고, 자세한 기록을 `memory/*.md`로 옮기거나, 의도적으로 부트스트랩 제한을 늘리십시오.

하위 에이전트 세션에는 `AGENTS.md`와 `TOOLS.md`만 주입됩니다(하위 에이전트 컨텍스트를 작게 유지하기 위해 다른 부트스트랩 파일은 필터링됩니다).

내부 훅은 `agent:bootstrap` 이벤트를 통해 이 단계를 가로채 주입되는 부트스트랩 파일을 수정하거나 교체할 수 있습니다(예: `SOUL.md`를 대체 페르소나용 파일로 교체).

덜 일반적인 말투를 사용하려면 [SOUL.md 성격 가이드](/ko/concepts/soul)부터 시작하십시오.

주입된 각 파일이 얼마나 기여하는지(원본과 주입본 비교, 잘림, 도구 스키마 오버헤드) 확인하려면 `/context list` 또는 `/context detail`을 사용하십시오. [컨텍스트](/ko/concepts/context)를 참조하십시오.

## 시간 처리

**현재 날짜 및 시간** 섹션은 사용자 시간대를 알고 있을 때만 표시되며, 프롬프트 캐시를 안정적으로 유지하기 위해 **시간대**만 포함합니다(동적 시계나 시간 형식은 포함하지 않음).

에이전트에 현재 시간이 필요하면 `session_status`를 사용하십시오. 이 도구의 상태 카드에는 타임스탬프 행이 포함됩니다. 같은 도구로 세션별 모델 재정의를 선택적으로 설정할 수도 있습니다(`model=default`로 해제).

다음 항목으로 구성하십시오.

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

전체 동작에 대한 자세한 내용은 [시간대](/ko/concepts/timezone)와 [날짜 및 시간](/ko/date-time)을 참조하십시오.

## Skills

사용 가능한 Skills가 있으면 OpenClaw는 Skill별 **파일 경로**와 콘텐츠에서 파생된 `<version>sha256:...</version>` 마커가 포함된 간결한 `<available_skills>` 목록(`formatSkillsForPrompt`)을 주입합니다. 프롬프트는 모델에 `read`를 사용하여 나열된 위치(워크스페이스, 관리형 또는 번들)의 SKILL.md를 로드하고, `<version>`이 이전 턴과 다르면 해당 Skill을 다시 읽도록 지시합니다. 사용 가능한 Skills가 없으면 Skills 섹션을 생략합니다.

네이티브 Codex 턴은 정확한 예약 프롬프트를 보존하는 경량 Cron 턴을 제외하고, 이 목록을 턴별 사용자 입력 대신 턴 범위의 협업 개발자 지침으로 받습니다. 다른 하네스에서는 일반 프롬프트 섹션을 유지합니다.

위치는 `skills/personal/foo/SKILL.md`와 같은 중첩된 Skill을 가리킬 수 있습니다. 중첩은 구성만을 위한 것이며, 프롬프트에서는 `SKILL.md` 프런트매터에 있는 평면형 Skill 이름을 사용합니다.

사용 가능 여부에는 Skill 메타데이터 게이트, 런타임 환경/구성 검사, 그리고 `agents.defaults.skills` 또는 `agents.list[].skills`가 구성된 경우 유효한 에이전트 Skill 허용 목록이 포함됩니다. Plugin에 번들된 Skills는 해당 Plugin이 활성화된 경우에만 사용할 수 있으므로, 도구 Plugin은 모든 도구 설명에 관련 지침을 전부 삽입하지 않고도 더 상세한 운영 가이드를 제공할 수 있습니다.

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

이를 통해 기본 프롬프트를 작게 유지하면서도 필요한 Skill을 선별적으로 사용할 수 있습니다. 크기 제한은 일반적인 런타임 읽기/주입 크기 제한과 별도로 Skills 하위 시스템에서 관리합니다.

| 범위      | Skills 프롬프트 예산                              | 런타임 발췌 예산                   |
| --------- | ------------------------------------------------- | --------------------------------- |
| 전역      | `skills.limits.maxSkillsPromptChars`              | `agents.defaults.contextLimits.*` |
| 에이전트별 | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*`   |

런타임 발췌 예산은 `memory_get`, 실시간 도구 결과, Compaction 후 `AGENTS.md` 새로 고침에 적용됩니다.

## 문서

**문서** 섹션은 로컬 문서를 사용할 수 있는 경우(Git 체크아웃의 `docs/` 또는 번들된 npm 패키지 문서) 해당 문서를 가리키고, 그렇지 않으면 [https://docs.openclaw.ai](https://docs.openclaw.ai)를 사용합니다. 또한 OpenClaw 소스 위치도 나열합니다. Git 체크아웃에서는 로컬 소스 루트를 표시하며, 패키지 설치에서는 문서가 불완전하거나 오래된 경우 GitHub에서 소스를 검토하라는 지침과 함께 GitHub 소스 URL을 제공합니다.

프롬프트는 모델이 OpenClaw의 작동 방식(메모리/일일 노트, 세션, 도구, Gateway, 구성, 명령, 프로젝트 컨텍스트)을 이해하기 전에 OpenClaw 자체 지식의 권위 있는 출처로 문서를 제시하며, `AGENTS.md`, 프로젝트 컨텍스트, 워크스페이스/프로필/메모리 노트 및 `memory_search`를 OpenClaw 설계/구현 지식이 아닌 지침 컨텍스트 또는 사용자 메모리로 취급하도록 모델에 지시합니다. 문서에 관련 내용이 없거나 오래된 경우 모델은 그 사실을 밝히고 소스를 검사해야 합니다. 또한 가능하면 모델이 직접 `openclaw status`를 실행하고, 접근 권한이 없을 때만 사용자에게 요청하도록 지시합니다.

특히 구성의 경우 정확한 필드 수준 문서와 제약 조건은 `gateway` 도구 작업 `config.schema.lookup`을 참조하도록 에이전트에 안내한 다음, 더 폭넓은 지침은 `docs/gateway/configuration.md`와 `docs/gateway/configuration-reference.md`를 참조하도록 안내합니다.

## 관련 항목

- [에이전트 런타임](/ko/concepts/agent)
- [에이전트 워크스페이스](/ko/concepts/agent-workspace)
- [컨텍스트 엔진](/ko/concepts/context-engine)
