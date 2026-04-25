---
read_when:
    - 에이전트 런타임, 워크스페이스 부트스트랩 또는 세션 동작 변경
summary: 에이전트 런타임, 워크스페이스 계약 및 세션 부트스트랩
title: 에이전트 런타임
x-i18n:
    generated_at: "2026-04-25T05:59:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37483fdb62d41a8f888bd362db93078dc8ecb8bb3fd19270b0234689aa82f309
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw는 **단일 내장 에이전트 런타임**을 실행합니다 — Gateway당 하나의 에이전트 프로세스가 있으며, 자체 워크스페이스, 부트스트랩 파일, 세션 저장소를 가집니다. 이 페이지에서는 해당 런타임 계약을 설명합니다: 워크스페이스에 무엇이 있어야 하는지, 어떤 파일이 주입되는지, 세션이 이를 기준으로 어떻게 부트스트랩되는지 다룹니다.

## 워크스페이스(필수)

OpenClaw는 단일 에이전트 워크스페이스 디렉터리(`agents.defaults.workspace`)를 도구와 컨텍스트에 대한 에이전트의 **유일한** 작업 디렉터리(`cwd`)로 사용합니다.

권장 사항: `openclaw setup`을 사용해 `~/.openclaw/openclaw.json`이 없으면 생성하고 워크스페이스 파일을 초기화하세요.

전체 워크스페이스 레이아웃 및 백업 가이드: [Agent workspace](/ko/concepts/agent-workspace)

`agents.defaults.sandbox`가 활성화되어 있으면, 비메인 세션은
`agents.defaults.sandbox.workspaceRoot` 아래의 세션별 워크스페이스로 이를 재정의할 수 있습니다(참조:
[Gateway configuration](/ko/gateway/configuration)).

## 부트스트랩 파일(주입됨)

`agents.defaults.workspace` 내부에서 OpenClaw는 다음과 같은 사용자 편집 가능 파일을 기대합니다:

- `AGENTS.md` — 운영 지침 + “메모리”
- `SOUL.md` — 페르소나, 경계, 어조
- `TOOLS.md` — 사용자가 유지하는 도구 메모(예: `imsg`, `sag`, 규칙)
- `BOOTSTRAP.md` — 1회성 최초 실행 의식(완료 후 삭제됨)
- `IDENTITY.md` — 에이전트 이름/분위기/이모지
- `USER.md` — 사용자 프로필 + 선호하는 호칭

새 세션의 첫 번째 턴에서 OpenClaw는 이 파일들의 내용을 에이전트 컨텍스트에 직접 주입합니다.

빈 파일은 건너뜁니다. 큰 파일은 프롬프트를 간결하게 유지하기 위해 마커와 함께 잘리고 축약됩니다(전체 내용은 파일을 직접 읽으세요).

파일이 없으면 OpenClaw는 “missing file” 마커 한 줄을 주입합니다(그리고 `openclaw setup`이 안전한 기본 템플릿을 생성합니다).

`BOOTSTRAP.md`는 **완전히 새로운 워크스페이스**(다른 부트스트랩 파일이 없는 경우)에만 생성됩니다. 의식을 완료한 뒤 이를 삭제하면 이후 재시작 시 다시 생성되지 않아야 합니다.

부트스트랩 파일 생성을 완전히 비활성화하려면(사전 시드된 워크스페이스용) 다음과 같이 설정하세요:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 내장 도구

핵심 도구(read/exec/edit/write 및 관련 시스템 도구)는 도구 정책에 따라 항상 사용할 수 있습니다. `apply_patch`는 선택 사항이며 `tools.exec.applyPatch`로 제어됩니다. `TOOLS.md`는 어떤 도구가 존재하는지를 제어하지 않으며, _사용자가_ 도구를 어떻게 사용하길 원하는지에 대한 안내입니다.

## Skills

OpenClaw는 다음 위치에서 Skills를 로드합니다(우선순위 높은 순서):

- 워크스페이스: `<workspace>/skills`
- 프로젝트 에이전트 Skills: `<workspace>/.agents/skills`
- 개인 에이전트 Skills: `~/.agents/skills`
- 관리됨/local: `~/.openclaw/skills`
- 번들됨(설치본에 포함)
- 추가 Skill 폴더: `skills.load.extraDirs`

Skills는 config/env로 제어할 수 있습니다([Gateway configuration](/ko/gateway/configuration)의 `skills` 참조).

## 런타임 경계

내장 에이전트 런타임은 Pi 에이전트 코어(models, tools, prompt 파이프라인)를 기반으로 구축됩니다. 세션 관리, 디스커버리, 도구 연결, 채널 전달은 그 코어 위에 있는 OpenClaw 소유 레이어입니다.

## 세션

세션 대화 기록은 다음 위치에 JSONL로 저장됩니다:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

세션 ID는 안정적이며 OpenClaw가 선택합니다.
다른 도구의 레거시 세션 폴더는 읽지 않습니다.

## 스트리밍 중 조정

queue mode가 `steer`이면 인바운드 메시지는 현재 실행 중인 런에 주입됩니다.
대기 중인 steering은 **현재 assistant 턴이 도구 호출 실행을 마친 후**,
다음 LLM 호출 전에 전달됩니다. 이제 steering은 현재 assistant 메시지의
남은 도구 호출을 건너뛰지 않으며, 대신 다음 모델 경계에서 대기 중인
메시지를 주입합니다.

queue mode가 `followup` 또는 `collect`이면, 인바운드 메시지는
현재 턴이 끝날 때까지 보류되고, 이후 대기 중인 페이로드로 새 에이전트 턴이 시작됩니다. 모드 + debounce/cap 동작은
[Queue](/ko/concepts/queue)를 참조하세요.

블록 스트리밍은 완료된 assistant 블록을 끝나는 즉시 전송합니다. 이는
**기본적으로 꺼져 있습니다** (`agents.defaults.blockStreamingDefault: "off"`).
경계는 `agents.defaults.blockStreamingBreak`로 조정하세요(`text_end` 또는 `message_end`; 기본값은 text_end).
소프트 블록 청크 분할은 `agents.defaults.blockStreamingChunk`로 제어합니다(기본값
800–1200자; 문단 구분 우선, 다음 줄바꿈, 마지막으로 문장).
`agents.defaults.blockStreamingCoalesce`로 스트리밍 청크를 병합하면
한 줄짜리 스팸을 줄일 수 있습니다(전송 전 유휴 시간 기반 병합). Telegram이 아닌 채널에서는
블록 답장을 활성화하려면 명시적으로 `*.blockStreaming: true`를 설정해야 합니다.
상세한 도구 요약은 도구 시작 시 출력되며(debounce 없음), Control UI는
가능할 때 에이전트 이벤트를 통해 도구 출력을 스트리밍합니다.
자세한 내용: [Streaming + chunking](/ko/concepts/streaming).

## 모델 ref

config의 모델 ref(예: `agents.defaults.model`, `agents.defaults.models`)는 **첫 번째** `/`를 기준으로 분리하여 파싱됩니다.

- 모델을 구성할 때는 `provider/model`을 사용하세요.
- 모델 ID 자체에 `/`가 포함되어 있으면(OpenRouter 스타일), provider 접두사를 포함하세요(예: `openrouter/moonshotai/kimi-k2`).
- provider를 생략하면 OpenClaw는 먼저 alias를 시도하고, 그다음 정확한 모델 id에 대한 고유한
  구성된 provider 일치를 시도하며, 그 후에야 구성된 기본 provider로 fallback합니다. 해당 provider가 더 이상
  구성된 기본 모델을 노출하지 않으면, OpenClaw는 오래되어 제거된 provider 기본값을 표시하는 대신
  첫 번째로 구성된 provider/model로 fallback합니다.

## 구성(최소)

최소한 다음을 설정하세요:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (강력 권장)

---

_다음: [그룹 채팅](/ko/channels/group-messages)_ 🦞

## 관련 항목

- [Agent workspace](/ko/concepts/agent-workspace)
- [멀티 에이전트 라우팅](/ko/concepts/multi-agent)
- [세션 관리](/ko/concepts/session)
