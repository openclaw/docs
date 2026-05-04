---
read_when:
    - 에이전트 런타임, 작업 공간 부트스트랩 또는 세션 동작 변경
summary: 에이전트 런타임, 워크스페이스 계약 및 세션 부트스트랩
title: 에이전트 런타임
x-i18n:
    generated_at: "2026-05-04T02:22:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbbd05a9bf2054d3a1f24aeed005a05b61152a047b593addfb46817baae05a
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw는 **단일 내장형 에이전트 런타임**을 실행합니다. Gateway당 하나의 에이전트 프로세스가 있으며, 각 프로세스에는 자체 워크스페이스, 부트스트랩 파일, 세션 저장소가 있습니다. 이 페이지에서는 해당 런타임 규약을 다룹니다. 워크스페이스에 무엇이 포함되어야 하는지, 어떤 파일이 주입되는지, 세션이 이를 기준으로 어떻게 부트스트랩되는지를 설명합니다.

## 워크스페이스(필수)

OpenClaw는 단일 에이전트 워크스페이스 디렉터리(`agents.defaults.workspace`)를 도구와 컨텍스트를 위한 에이전트의 **유일한** 작업 디렉터리(`cwd`)로 사용합니다.

권장: `openclaw setup`을 사용해 `~/.openclaw/openclaw.json`이 없으면 생성하고 워크스페이스 파일을 초기화하세요.

전체 워크스페이스 레이아웃 + 백업 가이드: [에이전트 워크스페이스](/ko/concepts/agent-workspace)

`agents.defaults.sandbox`가 활성화되어 있으면, main이 아닌 세션은 `agents.defaults.sandbox.workspaceRoot` 아래의 세션별 워크스페이스로 이를 재정의할 수 있습니다([Gateway 구성](/ko/gateway/configuration) 참조).

## 부트스트랩 파일(주입됨)

`agents.defaults.workspace` 내부에서 OpenClaw는 다음 사용자 편집 가능 파일을 기대합니다.

- `AGENTS.md` — 운영 지침 + “메모리”
- `SOUL.md` — 페르소나, 경계, 어조
- `TOOLS.md` — 사용자가 관리하는 도구 참고 사항(예: `imsg`, `sag`, 규칙)
- `BOOTSTRAP.md` — 최초 실행 시 한 번만 수행하는 의식(완료 후 삭제됨)
- `IDENTITY.md` — 에이전트 이름/분위기/이모지
- `USER.md` — 사용자 프로필 + 선호 호칭

새 세션의 첫 번째 턴에서 OpenClaw는 이 파일들의 내용을 시스템 프롬프트의 프로젝트 컨텍스트에 주입합니다.

빈 파일은 건너뜁니다. 큰 파일은 프롬프트를 간결하게 유지하기 위해 마커와 함께 줄이고 잘라냅니다(전체 내용은 파일을 읽으세요).

파일이 없으면 OpenClaw는 단일 “누락된 파일” 마커 줄을 주입합니다(그리고 `openclaw setup`은 안전한 기본 템플릿을 생성합니다).

`BOOTSTRAP.md`는 **완전히 새로운 워크스페이스**(다른 부트스트랩 파일이 없는 경우)에만 생성됩니다. 대기 중인 동안 OpenClaw는 이를 프로젝트 컨텍스트에 유지하고, 사용자 메시지에 복사하는 대신 초기 의식을 위한 시스템 프롬프트 부트스트랩 안내를 추가합니다. 의식을 완료한 뒤 삭제하면 이후 재시작 시 다시 생성되지 않아야 합니다.

부트스트랩 파일 생성을 완전히 비활성화하려면(미리 채워진 워크스페이스의 경우) 다음을 설정하세요.

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 기본 제공 도구

핵심 도구(read/exec/edit/write 및 관련 시스템 도구)는 도구 정책의 적용을 받으며 항상 사용할 수 있습니다. `apply_patch`는 선택 사항이며 `tools.exec.applyPatch`로 제한됩니다. `TOOLS.md`는 어떤 도구가 존재하는지 제어하지 않습니다. 이는 _사용자가_ 도구를 어떻게 사용하길 원하는지에 대한 안내입니다.

## Skills

OpenClaw는 다음 위치에서 Skills를 로드합니다(우선순위가 높은 순서).

- 워크스페이스: `<workspace>/skills`
- 프로젝트 에이전트 Skills: `<workspace>/.agents/skills`
- 개인 에이전트 Skills: `~/.agents/skills`
- 관리형/로컬: `~/.openclaw/skills`
- 번들(설치와 함께 제공됨)
- 추가 Skill 폴더: `skills.load.extraDirs`

Skills는 구성/env로 제한할 수 있습니다([Gateway 구성](/ko/gateway/configuration)의 `skills` 참조).

## 런타임 경계

내장형 에이전트 런타임은 Pi 에이전트 코어(모델, 도구, 프롬프트 파이프라인)를 기반으로 구축됩니다. 세션 관리, 탐색, 도구 연결, 채널 전달은 해당 코어 위에 있는 OpenClaw 소유 계층입니다.

## 세션

세션 전사는 다음 위치에 JSONL로 저장됩니다.

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

세션 ID는 안정적이며 OpenClaw가 선택합니다.
다른 도구의 레거시 세션 폴더는 읽지 않습니다.

## 스트리밍 중 스티어링

큐 모드가 `steer`이면 인바운드 메시지가 현재 실행에 주입됩니다. 큐에 쌓인 스티어링은 **현재 어시스턴트 턴이 도구 호출 실행을 마친 후**, 다음 LLM 호출 전에 전달됩니다. Pi는 `steer`의 경우 대기 중인 모든 스티어링 메시지를 함께 비웁니다. 레거시 `queue`는 모델 경계마다 메시지 하나를 비웁니다. 스티어링은 더 이상 현재 어시스턴트 메시지의 남은 도구 호출을 건너뛰지 않습니다.

큐 모드가 `followup` 또는 `collect`이면 인바운드 메시지는 현재 턴이 끝날 때까지 보류된 뒤, 큐에 쌓인 페이로드로 새 에이전트 턴이 시작됩니다. 모드와 경계 동작은 [큐](/ko/concepts/queue) 및 [스티어링 큐](/ko/concepts/queue-steering)를 참조하세요.

블록 스트리밍은 완료된 어시스턴트 블록을 완료되는 즉시 전송합니다. 이는 **기본적으로 꺼져 있습니다**(`agents.defaults.blockStreamingDefault: "off"`).
`agents.defaults.blockStreamingBreak`로 경계를 조정하세요(`text_end` 대 `message_end`; 기본값은 text_end).
`agents.defaults.blockStreamingChunk`로 소프트 블록 청킹을 제어하세요(기본값은 800~1200자, 단락 구분을 우선하고 그다음 줄바꿈, 마지막으로 문장).
`agents.defaults.blockStreamingCoalesce`로 스트리밍된 청크를 병합하여 한 줄 스팸을 줄이세요(전송 전 유휴 기반 병합). Telegram이 아닌 채널은 블록 답장을 활성화하려면 명시적으로 `*.blockStreaming: true`가 필요합니다.
자세한 도구 요약은 도구 시작 시 내보냅니다(디바운스 없음). Control UI는 가능한 경우 에이전트 이벤트를 통해 도구 출력을 스트리밍합니다.
자세한 내용: [스트리밍 + 청킹](/ko/concepts/streaming).

## 모델 참조

구성의 모델 참조(예: `agents.defaults.model` 및 `agents.defaults.models`)는 **첫 번째** `/`를 기준으로 분리해 파싱됩니다.

- 모델을 구성할 때는 `provider/model`을 사용하세요.
- 모델 ID 자체에 `/`가 포함된 경우(OpenRouter 스타일) 제공자 접두사를 포함하세요(예: `openrouter/moonshotai/kimi-k2`).
- 제공자를 생략하면 OpenClaw는 먼저 별칭을 시도한 다음, 해당 정확한 모델 ID에 대해 구성된 제공자 중 유일하게 일치하는 항목을 찾고, 그 후에야 구성된 기본 제공자로 폴백합니다. 해당 제공자가 더 이상 구성된 기본 모델을 제공하지 않으면, OpenClaw는 오래된 제거된 제공자 기본값을 표시하는 대신 첫 번째로 구성된 제공자/모델로 폴백합니다.

## 구성(최소)

최소한 다음을 설정하세요.

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`(강력 권장)

---

_다음: [그룹 채팅](/ko/channels/group-messages)_ 🦞

## 관련 항목

- [에이전트 워크스페이스](/ko/concepts/agent-workspace)
- [멀티 에이전트 라우팅](/ko/concepts/multi-agent)
- [세션 관리](/ko/concepts/session)
