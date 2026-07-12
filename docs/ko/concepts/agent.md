---
read_when:
    - 에이전트 런타임, 워크스페이스 부트스트랩 또는 세션 동작 변경하기
summary: 에이전트 런타임, 작업 공간 계약 및 세션 부트스트랩
title: 에이전트 런타임
x-i18n:
    generated_at: "2026-07-12T15:09:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e7b07f6db62c001d43e223eee28911b0515e1528e4b15c6c3748e88eaf405cfc
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw는 하나의 **임베디드 에이전트 런타임**을 제공합니다. 이는 외부
하네스 프로세스에 턴을 위임하는 방식과 구별되는 내장 에이전트 루프, 도구
연결, 프롬프트 조립 기능입니다. 구성된 각 에이전트(여러 에이전트를 실행하는
방법은 [멀티 에이전트 라우팅](/ko/concepts/multi-agent) 참조)는 자체 워크스페이스,
부트스트랩 파일, 세션 저장소를 가집니다. 이 페이지에서는 해당 런타임 계약,
즉 워크스페이스에 포함해야 하는 항목, 주입되는 파일, 세션이 이를 기반으로
부트스트랩되는 방식을 설명합니다.

## 워크스페이스(필수)

각 에이전트는 하나의 워크스페이스 디렉터리(에이전트별로
`agents.defaults.workspace` 또는 `agents.list[].workspace`)를 도구 및 컨텍스트의
**유일한** 작업 디렉터리(`cwd`)로 사용합니다.

권장 사항: `~/.openclaw/openclaw.json`이 없으면 `openclaw setup`을 사용하여 생성하고 워크스페이스 파일을 초기화하십시오.

전체 워크스페이스 레이아웃 및 백업 안내서: [에이전트 워크스페이스](/ko/concepts/agent-workspace)

`agents.defaults.sandbox`를 활성화하면 기본 세션이 아닌 세션은
`agents.defaults.sandbox.workspaceRoot` 아래의 세션별 워크스페이스로 이를 재정의할 수
있습니다([Gateway 구성](/ko/gateway/configuration) 참조).

## 부트스트랩 파일(주입됨)

OpenClaw는 워크스페이스 내부에 다음과 같은 사용자 편집 가능 파일이 있을 것으로 예상합니다.

| 파일           | 용도                                              |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | 운영 지침 + "메모리"                    |
| `SOUL.md`      | 페르소나, 경계, 어조                            |
| `TOOLS.md`     | 사용자가 관리하는 도구 참고 사항 및 규칙           |
| `IDENTITY.md`  | 에이전트 이름/분위기/이모지                                |
| `USER.md`      | 사용자 프로필 + 선호 호칭                     |
| `HEARTBEAT.md` | Heartbeat 전용 지침                      |
| `BOOTSTRAP.md` | 일회성 최초 실행 절차(완료 후 삭제됨) |
| `MEMORY.md`    | 루트 장기 메모리 파일(있는 경우)               |

새 세션의 첫 번째 턴에서 OpenClaw는 이러한 파일의 내용을 시스템 프롬프트의 프로젝트 컨텍스트에 주입합니다. `MEMORY.md`는 워크스페이스 루트에 존재할 때만 주입됩니다.

빈 파일은 건너뜁니다. 프롬프트를 간결하게 유지하기 위해 큰 파일은 축소 및 잘리고 마커가 추가됩니다(전체 내용은 파일에서 확인하십시오). 누락된 파일(`MEMORY.md` 제외)은 대신 "파일 누락" 마커 한 줄을 주입합니다. `openclaw setup`은 해당 파일에 안전한 기본 템플릿을 생성합니다.

`BOOTSTRAP.md`는 **완전히 새로운 워크스페이스**(다른 부트스트랩 파일이 없는 경우)에만 생성됩니다. 이 파일이 대기 중인 동안 OpenClaw는 이를 프로젝트 컨텍스트에 유지하고, 사용자 메시지에 복사하는 대신 초기 절차를 위한 시스템 프롬프트 부트스트랩 지침을 추가합니다. 절차를 완료한 후 이 파일을 삭제하면 이후 재시작 시 다시 생성되지 않습니다.

워크스페이스가 한 번 확인된 후에는 OpenClaw가 해당 워크스페이스 경로의 상태 디렉터리 증명 마커도 유지합니다. 최근에 증명된 워크스페이스가 사라지거나 초기화되면 시작 과정에서 `BOOTSTRAP.md`를 자동으로 다시 시드하지 않고 실행을 거부합니다. 워크스페이스를 복원하거나 전체 온보딩 초기화를 사용하여 워크스페이스와 마커를 함께 지우십시오.

부트스트랩 파일 생성을 완전히 비활성화하려면(미리 시드된 워크스페이스의 경우) 다음과 같이 설정하십시오.

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 내장 도구

핵심 도구(read/exec/edit/write 및 관련 시스템 도구)는 도구 정책에 따라 항상 사용할 수
있습니다. `apply_patch`는 OpenAI 모델에서 기본적으로 활성화되며
`tools.exec.applyPatch`(`enabled`, `workspaceOnly`, `allowModels`)로 제한됩니다. `TOOLS.md`는 존재하는
도구를 제어하지 **않으며**, _사용자가_ 도구를 어떻게 사용하기 원하는지에 대한 지침입니다.

## Skills

OpenClaw는 다음 위치에서 Skills를 로드합니다(우선순위가 높은 순서).

- 워크스페이스: `<workspace>/skills`
- 프로젝트 에이전트 Skills: `<workspace>/.agents/skills`
- 개인 에이전트 Skills: `~/.agents/skills`
- 관리형/로컬: `~/.openclaw/skills`
- 번들(설치본에 포함)
- 추가 Skills 폴더: `skills.load.extraDirs`

Skills 루트에는
`<workspace>/skills/personal/foo/SKILL.md`와 같이 그룹화된 폴더가 포함될 수 있지만, 해당 Skills는
예를 들어 `foo`와 같은 평면적인 frontmatter 이름으로 계속 노출됩니다.

Skills는 구성/환경 변수로 제한할 수 있습니다([Gateway 구성](/ko/gateway/configuration)의 `skills` 참조).

## 런타임 경계

임베디드 에이전트 런타임은 OpenClaw가 소유합니다. 모델 검색, 도구 연결,
프롬프트 조립, 세션 관리, 채널 전달이 하나의 통합된
런타임 표면을 공유합니다.

## 세션

세션 행은 에이전트별 SQLite 데이터베이스에 저장됩니다.

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

트랜스크립트 JSONL 파일은 레거시 마이그레이션 입력, 삭제되거나
초기화된 아카이브, 가져오기, 내보내기, 지원 아티팩트로
`~/.openclaw/agents/<agentId>/sessions/` 아래에 계속 존재할 수 있습니다. 활성 에이전트 기록은
세션 행과 함께 SQLite에 저장됩니다. 세션 ID는 안정적으로 유지되며
OpenClaw가 선택합니다. OpenClaw는 다른 도구의 세션 폴더를 읽지 않습니다.

## 스트리밍 중 조정

실행 도중에 도착하는 인바운드 프롬프트는 기본적으로 현재 실행에 조정 입력으로 전달됩니다.
조정 입력은 **현재 어시스턴트 턴이 도구 호출 실행을 완료한 후** 다음 LLM 호출 전에
전달되며, 더 이상 현재 어시스턴트 메시지의 나머지 도구 호출을 건너뛰지 않습니다.

`/queue steer`는 활성 실행의 기본 동작입니다. `/queue followup`과
`/queue collect`는 메시지를 조정 입력으로 전달하는 대신 이후 턴까지 대기하게 합니다.
`/queue interrupt`는 활성 실행을 중단합니다. 큐 및 경계 동작은 [큐](/ko/concepts/queue)와
[조정 큐](/ko/concepts/queue-steering)를 참조하십시오.

블록 스트리밍은 완료된 어시스턴트 블록을 완료 즉시 전송하며, 기본적으로
**비활성화**되어 있습니다(`agents.defaults.blockStreamingDefault: "off"`).
`agents.defaults.blockStreamingBreak`로 경계를 조정하십시오(`text_end`와 `message_end` 중 선택, 기본값은 `text_end`).
`agents.defaults.blockStreamingChunk`로 소프트 블록 청크 분할을 제어하십시오(기본값은
800~1200자이며 단락 구분, 줄바꿈, 문장 순으로 우선합니다).
`agents.defaults.blockStreamingCoalesce`로 스트리밍 청크를 병합하여
한 줄 메시지의 과도한 전송을 줄이십시오(전송 전 유휴 시간 기반 병합). Telegram 이외의 채널에서
블록 응답을 활성화하려면 `*.blockStreaming: true`를 명시적으로 설정해야 합니다.
상세 도구 요약은 도구 시작 시 출력됩니다(디바운스 없음). Control UI는 가능한 경우
에이전트 이벤트를 통해 도구 출력을 스트리밍합니다.
자세한 내용: [스트리밍 및 청크 분할](/ko/concepts/streaming).

## 모델 참조

구성의 모델 참조(예: `agents.defaults.model` 및 `agents.defaults.models`)는 **첫 번째** `/`를 기준으로 분할하여 파싱됩니다.

- 모델을 구성할 때는 `provider/model`을 사용하십시오.
- 모델 ID 자체에 `/`가 포함된 경우(OpenRouter 방식) 공급자 접두사를 포함하십시오(예: `openrouter/moonshotai/kimi-k2`).
- 공급자를 생략하면 OpenClaw는 먼저 별칭을 시도한 다음, 해당 모델 ID와 정확히 일치하는
  구성된 공급자가 하나뿐인지 확인하고, 그 후에만 구성된 기본 공급자로
  폴백합니다. 해당 공급자가 구성된 기본 모델을 더 이상 제공하지 않으면 OpenClaw는
  제거된 공급자의 오래된 기본값을 표시하는 대신, 구성된 첫 번째
  공급자/모델로 폴백합니다.

## 구성(최소)

최소한 다음 항목을 설정하십시오.

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`(강력히 권장)

## 관련 문서

- [에이전트 워크스페이스](/ko/concepts/agent-workspace)
- [멀티 에이전트 라우팅](/ko/concepts/multi-agent)
- [세션 관리](/ko/concepts/session)
- [그룹 채팅](/ko/channels/group-messages)
