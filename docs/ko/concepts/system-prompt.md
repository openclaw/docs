---
read_when:
    - 시스템 프롬프트 텍스트, 도구 목록 또는 시간/Heartbeat 섹션 편집
    - 워크스페이스 부트스트랩 또는 Skills 주입 동작 변경
summary: OpenClaw 시스템 프롬프트에 포함된 내용과 구성 방식
title: 시스템 프롬프트
x-i18n:
    generated_at: "2026-05-10T19:33:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa3db4f53ffe5c11fd85159044344b56cd11c3bdb1a5a5de7638b21fb813135
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw는 모든 에이전트 실행마다 맞춤 시스템 프롬프트를 빌드합니다. 이 프롬프트는 **OpenClaw 소유**이며 pi-coding-agent 기본 프롬프트를 사용하지 않습니다.

프롬프트는 OpenClaw가 조립하여 각 에이전트 실행에 주입합니다.

프롬프트 조립은 세 계층으로 이루어집니다.

- `buildAgentSystemPrompt`는 명시적 입력에서 프롬프트를 렌더링합니다. 순수 렌더러로
  유지되어야 하며 전역 구성을 직접 읽어서는 안 됩니다.
- `resolveAgentSystemPromptConfig`는 특정 에이전트에 대해
  소유자 표시, TTS 힌트, 모델 별칭, 메모리 인용 모드, 하위 에이전트
  위임 모드 같은 구성 기반 프롬프트 조절값을 해석합니다.
- 런타임 어댑터(임베디드, CLI, 명령/내보내기 미리보기, Compaction)는 도구, 샌드박스 상태, 채널 기능, 컨텍스트 파일,
  제공자 프롬프트 기여 같은 실시간 사실을 수집한 뒤 구성된 프롬프트 파사드를 호출합니다.

이렇게 하면 모든 런타임별 세부 사항을 하나의 거대한 빌더로 만들지 않으면서
내보낸/디버그 프롬프트 표면을 실제 실행과 일치시킬 수 있습니다.

제공자 Plugin은 전체 OpenClaw 소유 프롬프트를 대체하지 않고도
캐시 인식 프롬프트 지침을 기여할 수 있습니다. 제공자 런타임은 다음을 수행할 수 있습니다.

- 이름이 지정된 소수의 핵심 섹션(`interaction_style`,
  `tool_call_style`, `execution_bias`) 교체
- 프롬프트 캐시 경계 위에 **안정적인 접두사** 주입
- 프롬프트 캐시 경계 아래에 **동적 접미사** 주입

모델 계열별 튜닝에는 제공자 소유 기여를 사용하세요. 레거시
`before_prompt_build` 프롬프트 변경은 일반적인 제공자 동작이 아니라 호환성 또는 진정한 전역 프롬프트
변경용으로 유지하세요.

OpenAI GPT-5 계열 오버레이는 핵심 실행 규칙을 작게 유지하고
페르소나 고정, 간결한 출력, 도구 규율,
병렬 조회, 산출물 범위, 검증, 누락된 컨텍스트,
터미널 도구 위생에 대한 모델별 지침을 추가합니다.

## 구조

프롬프트는 의도적으로 간결하며 고정 섹션을 사용합니다.

- **도구 사용**: 구조화된 도구의 진실 공급원 알림과 런타임 도구 사용 지침.
- **실행 편향**: 간결한 후속 실행 지침: 실행 가능한 요청은 같은 턴에서 처리하고,
  완료되거나 차단될 때까지 계속하며, 약한 도구 결과에서 복구하고,
  변경 가능한 상태를 실시간으로 확인하고, 최종 응답 전에 검증합니다.
- **안전**: 권력 추구 행동이나 감독 우회를 피하라는 짧은 가드레일 알림.
- **Skills**(사용 가능한 경우): 필요할 때 Skills 지침을 로드하는 방법을 모델에 알려줍니다.
- **OpenClaw 제어**: 구성/재시작 작업에는 `gateway` 도구를 선호하고
  CLI 명령을 지어내지 말라고 모델에 알려줍니다.
- **OpenClaw 자체 업데이트**: `config.schema.lookup`으로 구성을 안전하게 검사하고, `config.patch`로 구성을 패치하며, 전체
  구성을 `config.apply`로 교체하고, 명시적 사용자
  요청이 있을 때만 `update.run`을 실행하는 방법입니다. 소유자 전용 `gateway` 도구는 보호된 exec 경로로 정규화되는 레거시 `tools.bash.*`
  별칭을 포함하여 `tools.exec.ask` / `tools.exec.security`를 다시 작성하는 것도 거부합니다.
- **작업 영역**: 작업 디렉터리(`agents.defaults.workspace`).
- **문서**: OpenClaw docs/source의 로컬 경로와 문서를 읽어야 하는 경우.
- **작업 영역 파일(주입됨)**: 부트스트랩 파일이 아래에 포함되어 있음을 나타냅니다.
- **샌드박스**(활성화된 경우): 샌드박스 런타임, 샌드박스 경로, 상승된 exec 사용 가능 여부를 나타냅니다.
- **현재 날짜 및 시간**: 시간대만 표시합니다(캐시 안정적이며, 실시간 시계는 `session_status`에서 가져옵니다).
- **어시스턴트 출력 지시사항**: 간결한 첨부 파일, 음성 메모, 답장 태그 구문.
- **Heartbeat**: 기본 에이전트에 Heartbeat가 활성화된 경우 Heartbeat 프롬프트와 확인 동작.
- **런타임**: 호스트, OS, Node, 모델, 저장소 루트(감지된 경우), 사고 수준(한 줄).
- **추론**: 현재 가시성 수준 + /reasoning 토글 힌트.

OpenClaw는 **프로젝트 컨텍스트**를 포함한 큰 안정적 콘텐츠를
내부 프롬프트 캐시 경계 위에 유지합니다. 제어 UI 임베드 지침, **메시징**, **음성**, **그룹 채팅 컨텍스트**,
**반응**, **Heartbeat**, **런타임** 같은 변동성이 큰 채널/세션 섹션은 그 경계 아래에 추가되므로
접두사 캐시가 있는 로컬 백엔드는 채널 턴 전반에서 안정적인 작업 영역 접두사를 재사용할 수 있습니다. 마찬가지로 도구 설명은 허용된 스키마가 이미 해당 런타임 세부 사항을 담고 있을 때 현재
채널 이름을 포함하지 않아야 합니다.

도구 사용 섹션에는 장기 실행 작업에 대한 런타임 지침도 포함됩니다.

- 향후 후속 작업(`check back later`, 알림, 반복 작업)에는
  `exec` sleep 루프, `yieldMs` 지연 기법, 반복적인 `process`
  폴링 대신 Cron을 사용합니다.
- 지금 시작되어 백그라운드에서 계속 실행되는 명령에만 `exec` / `process`를 사용합니다.
- 자동 완료 깨우기가 활성화된 경우 명령을 한 번 시작하고,
  출력이 나오거나 실패할 때 푸시 기반 깨우기 경로에 의존합니다.
- 실행 중인 명령을 검사해야 할 때 로그, 상태, 입력 또는 개입에는 `process`를 사용합니다.
- 작업이 더 크면 `sessions_spawn`을 선호합니다. 하위 에이전트 완료는
  푸시 기반이며 요청자에게 자동으로 다시 알립니다.
- 완료를 기다리기 위해 루프에서 `subagents list` / `sessions_list`를 폴링하지 않습니다.

`agents.defaults.subagents.delegationMode`는 이 지침을 강화할 수 있습니다. 기본
`suggest` 모드는 기준 권고를 유지합니다. `prefer`는 전용
**하위 에이전트 위임** 섹션을 추가하여 메인 에이전트에게 반응성 있는
조정자로 행동하고 직접 답변보다 더 복잡한 것은 모두
`sessions_spawn`을 통해 밀어 넣으라고 지시합니다. 이는 프롬프트 전용이며, 도구 정책은 여전히
`sessions_spawn` 사용 가능 여부를 제어합니다.

실험적 `update_plan` 도구가 활성화되면 도구 사용은 모델에게
단순하지 않은 다단계 작업에만 이를 사용하고, 정확히 하나의
`in_progress` 단계를 유지하며, 각 업데이트 후 전체 계획을 반복하지 말라고도 지시합니다.

시스템 프롬프트의 안전 가드레일은 권고 사항입니다. 모델 동작을 안내하지만 정책을 강제하지는 않습니다. 강제 적용에는 도구 정책, exec 승인, 샌드박싱, 채널 허용 목록을 사용하세요. 운영자는 설계상 이를 비활성화할 수 있습니다.

네이티브 승인 카드/버튼이 있는 채널에서는 런타임 프롬프트가 이제 에이전트에게
먼저 해당 네이티브 승인 UI에 의존하라고 지시합니다. 도구 결과가 채팅 승인을 사용할 수 없거나
수동 승인이 유일한 경로라고 말할 때만 수동
`/approve` 명령을 포함해야 합니다.

## 프롬프트 모드

OpenClaw는 하위 에이전트용으로 더 작은 시스템 프롬프트를 렌더링할 수 있습니다. 런타임은 각 실행에 대해
`promptMode`를 설정합니다(사용자 대상 구성 아님).

- `full`(기본값): 위의 모든 섹션을 포함합니다.
- `minimal`: 하위 에이전트에 사용됩니다. **메모리 회상**, **OpenClaw
  자체 업데이트**, **모델 별칭**, **사용자 ID**, **어시스턴트 출력 지시사항**,
  **메시징**, **무음 답장**, **Heartbeat**를 생략합니다. 도구 사용, **안전**,
  제공된 경우 **Skills**, 작업 영역, 샌드박스, 현재 날짜 및 시간(알려진 경우),
  런타임, 주입된 컨텍스트는 계속 사용할 수 있습니다.
- `none`: 기본 ID 줄만 반환합니다.

`promptMode=minimal`일 때 추가로 주입된 프롬프트는 **그룹 채팅 컨텍스트** 대신 **하위 에이전트
컨텍스트**로 표시됩니다.

채널 자동 답장 실행의 경우, 직접/그룹 채팅 컨텍스트에 이미 해석된
대화별 `NO_REPLY` 동작이 포함되어 있으면 OpenClaw는 일반 **무음 답장**
섹션을 생략할 수 있습니다. 이렇게 하면 전역 시스템 프롬프트와 채널 컨텍스트 양쪽에서 토큰 메커니즘을
반복하지 않을 수 있습니다.

## 프롬프트 스냅샷

OpenClaw는 Codex 런타임 정상 경로용으로 커밋된 프롬프트 스냅샷을
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 아래에 유지합니다. 이들은
선택된 앱 서버 스레드/턴 파라미터와 Telegram 직접, Discord 그룹, Heartbeat 턴을 위한 재구성된 모델 바인딩 프롬프트
계층 스택을 렌더링합니다. 해당 스택에는 Codex의
모델 카탈로그/캐시 형태에서 생성된 고정 Codex `gpt-5.5` 모델 프롬프트 픽스처, Codex 정상 경로 권한 개발자 텍스트,
OpenClaw 개발자 지침, OpenClaw가 제공하는 경우 턴 범위 협업 모드 지침,
사용자 턴 입력, 동적 도구 사양에 대한 참조가 포함됩니다.

고정 Codex 모델 프롬프트 픽스처는
`pnpm prompt:snapshots:sync-codex-model`로 새로 고칩니다. 기본적으로 스크립트는
Codex의 런타임 캐시를 `$CODEX_HOME/models_cache.json`에서 찾고, 그다음
`~/.codex/models_cache.json`에서 찾은 뒤, 마지막으로 관리자 Codex
체크아웃 관례 위치인 `~/code/codex/codex-rs/models-manager/models.json`으로 폴백합니다. 이러한
소스가 하나도 없으면 명령은 커밋된 픽스처를 변경하지 않고 종료됩니다.
특정 `models_cache.json` 또는 `models.json` 파일에서 새로 고치려면 `--catalog <path>`를 전달하세요.

이 스냅샷들은 여전히 바이트 단위로 동일한 원시 OpenAI 요청 캡처가 아닙니다. Codex는 OpenClaw가
스레드와 턴 파라미터를 보낸 뒤 Codex 런타임 내부에서 `AGENTS.md`, 환경
컨텍스트, 메모리, 앱/Plugin 지침, 내장 기본
협업 모드 지침 같은 런타임 소유 작업 영역 컨텍스트를 추가할 수 있습니다.

`pnpm prompt:snapshots:gen`으로 다시 생성하고
`pnpm prompt:snapshots:check`로 드리프트를 검증하세요. CI는 추가
경계 샤드에서 드리프트 검사를 실행하여 프롬프트 변경과 스냅샷 업데이트가 같은
PR에 붙어 있도록 합니다.

## 작업 영역 부트스트랩 주입

부트스트랩 파일은 잘라서 **프로젝트 컨텍스트** 아래에 추가되므로 모델은 명시적 읽기 없이 ID와 프로필 컨텍스트를 볼 수 있습니다.

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`(완전히 새로운 작업 영역에서만)
- 존재하는 경우 `MEMORY.md`

파일별 게이트가 적용되지 않는 한 이 모든 파일은 매 턴마다 **컨텍스트 창에 주입됩니다**.
`HEARTBEAT.md`는 기본 에이전트에 Heartbeat가 비활성화되어 있거나
`agents.defaults.heartbeat.includeSystemPromptSection`이 false인 경우 일반 실행에서 생략됩니다. 주입된
파일, 특히 `MEMORY.md`는 간결하게 유지하세요. `MEMORY.md`는
선별된 장기 요약으로 유지되도록 의도되었습니다. 상세한 일일 메모는
`memory_search`와 `memory_get`이 필요할 때 가져올 수 있는 `memory/*.md`에 두어야 합니다. 지나치게 큰
`MEMORY.md` 파일은 프롬프트 사용량을 늘리고 아래 부트스트랩 파일 제한 때문에
부분적으로 주입될 수 있습니다.

세션이 네이티브 Codex 하네스에서 실행될 때 Codex는 자체 프로젝트 문서 탐색을 통해 `AGENTS.md`를 로드합니다.
OpenClaw는 여전히 나머지 부트스트랩 파일을 해석하여 Codex 구성 지침으로 전달하므로 `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`는
`AGENTS.md`를 중복하지 않으면서 동일한 작업 영역 컨텍스트 역할을 유지합니다.

<Note>
`memory/*.md` 일일 파일은 일반 부트스트랩 프로젝트 컨텍스트의 일부가 **아닙니다**. 일반 턴에서는 `memory_search`와 `memory_get` 도구를 통해 필요할 때 접근되므로, 모델이 명시적으로 읽지 않는 한 컨텍스트 창에 계산되지 않습니다. 예외는 단독 `/new` 및 `/reset` 턴입니다. 런타임은 해당 첫 턴에 대해 최근 일일 메모리를 일회성 시작 컨텍스트 블록으로 앞에 붙일 수 있습니다.
</Note>

큰 파일은 마커와 함께 잘립니다. 파일당 최대 크기는
`agents.defaults.bootstrapMaxChars`(기본값: 12000)로 제어됩니다. 파일 전체에 걸쳐 주입되는 부트스트랩
콘텐츠 총량은 `agents.defaults.bootstrapTotalMaxChars`
(기본값: 60000)로 제한됩니다. 누락된 파일은 짧은 누락 파일 마커를 주입합니다. 잘림이
발생하면 OpenClaw는 간결한 시스템 프롬프트 경고 알림을 주입할 수 있습니다. 이는
`agents.defaults.bootstrapPromptTruncationWarning`(`off`, `once`, `always`;
기본값: `once`)로 제어하세요. 상세한 원시/주입 카운트는
`/context`, `/status`, doctor, 로그 같은 진단에 유지됩니다.

메모리 파일의 경우 잘림은 데이터 손실이 아닙니다. 파일은 디스크에 그대로 남아 있지만
모델은 메모리를 직접 읽거나 검색할 때까지 짧아진 주입본만 봅니다. `MEMORY.md`가 반복적으로 잘린다면 더 짧은 지속 요약으로
정제하고 상세 기록은 `memory/*.md`로 옮기거나,
의도적으로 부트스트랩 제한을 높이세요.

하위 에이전트 세션은 `AGENTS.md`와 `TOOLS.md`만 주입합니다(다른 부트스트랩 파일은
하위 에이전트 컨텍스트를 작게 유지하기 위해 필터링됩니다).

내부 훅은 `agent:bootstrap`을 통해 이 단계를 가로채 주입된 부트스트랩 파일을 변경하거나 교체할 수 있습니다(예: `SOUL.md`를 대체 페르소나로 바꾸기).

에이전트가 덜 일반적으로 들리게 하려면
[SOUL.md 개성 가이드](/ko/concepts/soul)부터 시작하세요.

주입된 각 파일이 얼마나 기여하는지(원본 대비 주입된 내용, 잘림, 도구 스키마 오버헤드 포함) 확인하려면 `/context list` 또는 `/context detail`을 사용하세요. [Context](/ko/concepts/context)를 참조하세요.

## 시간 처리

사용자 시간대를 알 수 있는 경우 시스템 프롬프트에는 전용 **현재 날짜 및 시간** 섹션이 포함됩니다. 프롬프트 캐시를 안정적으로 유지하기 위해, 이제 이 섹션에는 **시간대**만 포함됩니다(동적 시계나 시간 형식은 포함하지 않음).

에이전트에 현재 시간이 필요하면 `session_status`를 사용하세요. 상태 카드에는 타임스탬프 줄이 포함됩니다. 같은 도구로 세션별 모델 재정의도 선택적으로 설정할 수 있습니다(`model=default`는 이를 지웁니다).

다음으로 구성하세요.

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

전체 동작 세부 정보는 [날짜 및 시간](/ko/date-time)을 참조하세요.

## Skills

사용 가능한 Skills가 있으면 OpenClaw는 각 skill의 **파일 경로**를 포함하는 간결한 **사용 가능한 Skills 목록**(`formatSkillsForPrompt`)을 주입합니다. 프롬프트는 모델에 `read`를 사용해 나열된 위치(워크스페이스, 관리형 또는 번들)에 있는 SKILL.md를 로드하도록 지시합니다. 사용 가능한 Skills가 없으면 Skills 섹션은 생략됩니다.

사용 가능 여부에는 skill 메타데이터 게이트, 런타임 환경/구성 검사, 그리고 `agents.defaults.skills` 또는 `agents.list[].skills`가 구성된 경우 유효한 에이전트 skill 허용 목록이 포함됩니다.

Plugin 번들 Skills는 해당 Skills를 소유한 Plugin이 활성화된 경우에만 사용할 수 있습니다. 이를 통해 도구 Plugin은 모든 지침을 모든 도구 설명에 직접 포함하지 않고도 더 깊은 운영 가이드를 노출할 수 있습니다.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

이 방식은 기본 프롬프트를 작게 유지하면서도 대상이 명확한 skill 사용을 가능하게 합니다.

Skills 목록 예산은 Skills 하위 시스템이 소유합니다.

- 전역 기본값: `skills.limits.maxSkillsPromptChars`
- 에이전트별 재정의: `agents.list[].skillsLimits.maxSkillsPromptChars`

일반적인 제한된 런타임 발췌에는 다른 표면을 사용합니다.

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

이 분리는 Skills 크기 조정을 `memory_get`, 실시간 도구 결과, Compaction 이후 AGENTS.md 새로고침 같은 런타임 읽기/주입 크기 조정과 분리해 유지합니다.

## 문서

시스템 프롬프트에는 **문서** 섹션이 포함됩니다. 로컬 문서를 사용할 수 있으면 로컬 OpenClaw 문서 디렉터리(Git 체크아웃의 `docs/` 또는 번들 npm 패키지 문서)를 가리킵니다. 로컬 문서를 사용할 수 없으면 [https://docs.openclaw.ai](https://docs.openclaw.ai)로 대체됩니다.

같은 섹션에는 OpenClaw 소스 위치도 포함됩니다. Git 체크아웃은 에이전트가 코드를 직접 검사할 수 있도록 로컬 소스 루트를 노출합니다. 패키지 설치에는 GitHub 소스 URL이 포함되며, 문서가 불완전하거나 오래된 경우 에이전트에게 그곳에서 소스를 검토하라고 안내합니다. 프롬프트는 또한 공개 문서 미러, 커뮤니티 Discord, Skills 검색을 위한 ClawHub([https://clawhub.ai](https://clawhub.ai))도 언급합니다. 모델에는 OpenClaw 동작, 명령, 구성 또는 아키텍처에 대해서는 문서를 먼저 참조하고, 가능하면 `openclaw status`를 직접 실행하라고 지시합니다(접근 권한이 없을 때만 사용자에게 요청). 특히 구성의 경우, 정확한 필드 수준 문서와 제약 조건은 `gateway` 도구 작업 `config.schema.lookup`을 참조한 다음, 더 넓은 지침은 `docs/gateway/configuration.md` 및 `docs/gateway/configuration-reference.md`를 참조하도록 에이전트에 안내합니다.

## 관련 항목

- [에이전트 런타임](/ko/concepts/agent)
- [에이전트 워크스페이스](/ko/concepts/agent-workspace)
- [Context 엔진](/ko/concepts/context-engine)
