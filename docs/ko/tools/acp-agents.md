---
read_when:
    - ACP를 통해 코딩 하네스 실행하기
    - 메시징 채널에서 대화에 바인딩된 ACP 세션 설정하기
    - 메시지 채널 대화를 지속 ACP 세션에 바인딩하기
    - ACP 백엔드, Plugin 연결 또는 완료 전달 문제 해결
    - 채팅에서 /acp 명령 운영하기
sidebarTitle: ACP agents
summary: 외부 코딩 하네스(Claude Code, Cursor, Gemini CLI, 명시적 Codex ACP, OpenClaw ACP, OpenCode)를 ACP 백엔드를 통해 실행
title: ACP 에이전트
x-i18n:
    generated_at: "2026-06-27T18:12:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 세션을 사용하면
OpenClaw가 ACP 백엔드 Plugin을 통해 외부 코딩 하네스(예: Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI 및 기타
지원되는 ACPX 하네스)를 실행할 수 있습니다.

각 ACP 세션 생성은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

<Note>
**ACP는 기본 Codex 경로가 아니라 외부 하네스 경로입니다.** 네이티브
Codex 앱 서버 Plugin은 `/codex ...` 제어와 에이전트 턴용 기본
`openai/gpt-*` 임베디드 런타임을 소유하고, ACP는
`/acp ...` 제어와 `sessions_spawn({ runtime: "acp" })` 세션을 소유합니다.

Codex 또는 Claude Code를 외부 MCP 클라이언트로 기존 OpenClaw 채널 대화에
직접 연결하려면 ACP 대신 [`openclaw mcp serve`](/ko/cli/mcp)를 사용하세요.
</Note>

## 어떤 페이지를 보면 되나요?

| 원하는 작업                                                                                     | 사용할 항목                            | 참고                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 현재 대화에서 Codex 바인딩 또는 제어                                                            | `/codex bind`, `/codex threads`       | `codex` Plugin이 활성화된 경우의 네이티브 Codex 앱 서버 경로입니다. 바인딩된 채팅 답장, 이미지 전달, 모델/빠른 실행/권한, 중지 및 조정 제어를 포함합니다. ACP는 명시적 폴백입니다 |
| Claude Code, Gemini CLI, 명시적 Codex ACP 또는 다른 외부 하네스를 OpenClaw를 _통해_ 실행         | 이 페이지                             | 채팅 바인딩 세션, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, 백그라운드 작업, 런타임 제어                                                                                           |
| 편집기 또는 클라이언트용 ACP 서버로 OpenClaw Gateway 세션 노출                                  | [`openclaw acp`](/ko/cli/acp)            | 브리지 모드입니다. IDE/클라이언트가 stdio/WebSocket을 통해 OpenClaw에 ACP로 통신합니다                                                                                                        |
| 로컬 AI CLI를 텍스트 전용 폴백 모델로 재사용                                                    | [CLI 백엔드](/ko/gateway/cli-backends) | ACP가 아닙니다. OpenClaw 도구, ACP 제어, 하네스 런타임이 없습니다                                                                                                                              |

## 바로 사용할 수 있나요?

예. 공식 ACP 런타임 Plugin을 설치한 뒤 사용할 수 있습니다.

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

소스 체크아웃은 `pnpm install` 이후 로컬 `extensions/acpx` 워크스페이스
Plugin을 사용할 수 있습니다. 준비 상태 확인에는 `/acp doctor`를 실행하세요.

OpenClaw는 ACP가 **실제로 사용 가능**할 때만 에이전트에게 ACP 생성 방법을
알려줍니다. ACP가 활성화되어 있어야 하고, 디스패치가 비활성화되어 있으면
안 되며, 현재 세션이 샌드박스에 의해 차단되어 있으면 안 되고, 런타임
백엔드가 로드되어 있어야 합니다. 이러한 조건이 충족되지 않으면 ACP Plugin
Skills와 `sessions_spawn` ACP 안내가 숨겨져 에이전트가 사용할 수 없는
백엔드를 제안하지 않습니다.

<AccordionGroup>
  <Accordion title="첫 실행 시 주의 사항">
    - `plugins.allow`가 설정되어 있으면 이는 제한적인 Plugin 인벤토리이며 **반드시** `acpx`를 포함해야 합니다. 그렇지 않으면 설치된 ACP 백엔드가 의도적으로 차단되고 `/acp doctor`가 누락된 허용 목록 항목을 보고합니다.
    - Codex ACP 어댑터는 `acpx` Plugin과 함께 준비되며 가능한 경우 로컬에서 실행됩니다.
    - Codex ACP는 격리된 `CODEX_HOME`으로 실행됩니다. OpenClaw는 호스트 Codex 구성에서 신뢰된 프로젝트 항목과 안전한 모델/공급자 라우팅 구성을 복사하며, 인증, 알림, 훅은 호스트 구성에 남겨 둡니다.
    - 다른 대상 하네스 어댑터는 처음 사용할 때 여전히 `npx`로 필요 시 가져올 수 있습니다.
    - 해당 하네스의 벤더 인증은 여전히 호스트에 있어야 합니다.
    - 호스트에 npm 또는 네트워크 접근이 없으면 캐시를 미리 예열하거나 어댑터를 다른 방식으로 설치하기 전까지 첫 실행 어댑터 가져오기가 실패합니다.

  </Accordion>
  <Accordion title="런타임 전제 조건">
    ACP는 실제 외부 하네스 프로세스를 실행합니다. OpenClaw는 라우팅,
    백그라운드 작업 상태, 전달, 바인딩, 정책을 소유하고, 하네스는
    공급자 로그인, 모델 카탈로그, 파일 시스템 동작, 네이티브 도구를
    소유합니다.

    OpenClaw를 의심하기 전에 다음을 확인하세요.

    - `/acp doctor`가 활성화되고 정상인 백엔드를 보고합니다.
    - 해당 허용 목록이 설정된 경우 대상 id가 `acp.allowedAgents`에서 허용됩니다.
    - 하네스 명령이 Gateway 호스트에서 시작될 수 있습니다.
    - 해당 하네스에 공급자 인증이 있습니다(`claude`, `codex`, `gemini`, `opencode`, `droid` 등).
    - 선택한 모델이 해당 하네스에 존재합니다. 모델 id는 하네스 간에 이식 가능하지 않습니다.
    - 요청한 `cwd`가 존재하고 접근 가능하거나, `cwd`를 생략하여 백엔드가 기본값을 사용하도록 합니다.
    - 권한 모드가 작업과 일치합니다. 비대화형 세션은 네이티브 권한 프롬프트를 클릭할 수 없으므로 쓰기/실행이 많은 코딩 실행에는 일반적으로 헤드리스로 진행할 수 있는 ACPX 권한 프로필이 필요합니다.

  </Accordion>
</AccordionGroup>

OpenClaw Plugin 도구와 기본 제공 OpenClaw 도구는 기본적으로 ACP 하네스에
노출되지 않습니다. 하네스가 해당 도구를 직접 호출해야 하는 경우에만
[ACP 에이전트 - 설정](/ko/tools/acp-agents-setup)의 명시적 MCP 브리지를
활성화하세요.

## 지원되는 하네스 대상

`acpx` 백엔드에서는 다음 하네스 id를 `/acp spawn <id>` 또는
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` 대상으로 사용하세요.

| 하네스 id | 일반적인 백엔드                                | 참고                                                                                |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 어댑터                         | 호스트에 Claude Code 인증이 필요합니다.                                             |
| `codex`    | Codex ACP 어댑터                               | 네이티브 `/codex`를 사용할 수 없거나 ACP가 요청된 경우에만 사용하는 명시적 ACP 폴백입니다. |
| `copilot`  | GitHub Copilot ACP 어댑터                      | Copilot CLI/런타임 인증이 필요합니다.                                               |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | 로컬 설치가 다른 ACP 진입점을 노출하는 경우 acpx 명령을 재정의하세요.              |
| `droid`    | Factory Droid CLI                              | 하네스 환경에 Factory/Droid 인증 또는 `FACTORY_API_KEY`가 필요합니다.              |
| `gemini`   | Gemini CLI ACP 어댑터                          | Gemini CLI 인증 또는 API 키 설정이 필요합니다.                                      |
| `iflow`    | iFlow CLI                                      | 어댑터 사용 가능 여부와 모델 제어는 설치된 CLI에 따라 달라집니다.                  |
| `kilocode` | Kilo Code CLI                                  | 어댑터 사용 가능 여부와 모델 제어는 설치된 CLI에 따라 달라집니다.                  |
| `kimi`     | Kimi/Moonshot CLI                              | 호스트에 Kimi/Moonshot 인증이 필요합니다.                                           |
| `kiro`     | Kiro CLI                                       | 어댑터 사용 가능 여부와 모델 제어는 설치된 CLI에 따라 달라집니다.                  |
| `opencode` | OpenCode ACP 어댑터                            | OpenCode CLI/공급자 인증이 필요합니다.                                              |
| `openclaw` | `openclaw acp`를 통한 OpenClaw Gateway 브리지  | ACP 인식 하네스가 OpenClaw Gateway 세션에 다시 통신할 수 있게 합니다.              |
| `qwen`     | Qwen Code / Qwen CLI                           | 호스트에 Qwen 호환 인증이 필요합니다.                                               |

사용자 지정 acpx 에이전트 별칭은 acpx 자체에서 구성할 수 있지만, OpenClaw
정책은 디스패치 전에 여전히 `acp.allowedAgents`와 모든
`agents.list[].runtime.acp.agent` 매핑을 확인합니다.

## 운영자 실행 안내서

채팅에서 빠른 `/acp` 흐름:

<Steps>
  <Step title="생성">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` 또는 명시적
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="작업">
    바인딩된 대화 또는 스레드에서 계속 진행하거나 세션 키를 명시적으로
    대상으로 지정합니다.
  </Step>
  <Step title="상태 확인">
    `/acp status`
  </Step>
  <Step title="조정">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="방향 제시">
    컨텍스트를 교체하지 않고: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="중지">
    `/acp cancel`(현재 턴) 또는 `/acp close`(세션 + 바인딩).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="수명 주기 세부 정보">
    - 생성은 ACP 런타임 세션을 만들거나 재개하고, OpenClaw 세션 저장소에 ACP 메타데이터를 기록하며, 실행이 부모 소유인 경우 백그라운드 작업을 만들 수 있습니다.
    - 부모 소유 ACP 세션은 런타임 세션이 영속적이더라도 백그라운드 작업으로 처리됩니다. 완료 및 표면 간 전달은 일반적인 사용자 대상 채팅 세션처럼 동작하는 대신 부모 작업 알림자를 통해 진행됩니다.
    - 작업 유지 관리는 종료되었거나 고아가 된 부모 소유 일회성 ACP 세션을 닫습니다. 영속 ACP 세션은 활성 대화 바인딩이 남아 있는 동안 보존됩니다. 활성 바인딩이 없는 오래된 영속 세션은 소유 작업이 완료되었거나 작업 레코드가 사라진 뒤 조용히 재개될 수 없도록 닫힙니다.
    - 바인딩된 후속 메시지는 바인딩이 닫히거나, 포커스 해제되거나, 재설정되거나, 만료될 때까지 ACP 세션으로 직접 전달됩니다.
    - Gateway 명령은 로컬에 남습니다. `/acp ...`, `/status`, `/unfocus`는 바인딩된 ACP 하네스에 일반 프롬프트 텍스트로 전송되지 않습니다.
    - `cancel`은 백엔드가 취소를 지원할 때 활성 턴을 중단합니다. 바인딩이나 세션 메타데이터를 삭제하지는 않습니다.
    - `close`는 OpenClaw 관점에서 ACP 세션을 종료하고 바인딩을 제거합니다. 하네스가 재개를 지원하는 경우 자체 업스트림 기록을 계속 유지할 수 있습니다.
    - acpx Plugin은 `close` 이후 OpenClaw 소유 래퍼 및 어댑터 프로세스 트리를 정리하고, Gateway 시작 중 오래된 OpenClaw 소유 ACPX 고아 프로세스를 회수합니다.
    - 유휴 런타임 워커는 `acp.runtime.ttlMinutes` 이후 정리 대상이 됩니다. 저장된 세션 메타데이터는 `/acp sessions`에서 계속 사용할 수 있습니다.

  </Accordion>
  <Accordion title="네이티브 Codex 라우팅 규칙">
    활성화된 경우 **네이티브 Codex Plugin**으로 라우팅되어야 하는 자연어
    트리거:

    - "이 Discord 채널을 Codex에 바인딩하세요."
    - "이 채팅을 Codex 스레드 `<id>`에 연결하세요."
    - "Codex 스레드를 표시한 다음, 이 항목을 바인딩하세요."

    기본 Codex 대화 바인딩은 기본 채팅 제어 경로입니다.
    OpenClaw 동적 도구는 여전히 OpenClaw를 통해 실행되는 반면,
    shell/apply-patch 같은 Codex 네이티브 도구는 Codex 내부에서 실행됩니다.
    Codex 네이티브 도구 이벤트의 경우, OpenClaw는 턴마다 네이티브
    훅 릴레이를 주입하여 Plugin 훅이 `before_tool_call`을 차단하고,
    `after_tool_call`을 관찰하며, Codex `PermissionRequest` 이벤트를
    OpenClaw 승인을 통해 라우팅할 수 있게 합니다. Codex `Stop` 훅은
    OpenClaw `before_agent_finalize`로 릴레이되며, 여기서 Plugin은 Codex가
    답변을 최종화하기 전에 한 번 더 모델 패스를 요청할 수 있습니다.
    릴레이는 의도적으로 보수적으로 유지됩니다. Codex 네이티브 도구
    인수를 변경하거나 Codex 스레드 레코드를 다시 쓰지 않습니다. ACP
    런타임/세션 모델을 원할 때만 명시적 ACP를 사용하세요. 내장 Codex
    지원 경계는
    [Codex 하네스 v1 지원 계약](/ko/plugins/codex-harness-runtime#v1-support-contract)에 문서화되어 있습니다.

  </Accordion>
  <Accordion title="모델 / 제공자 / 런타임 선택 요약표">
    - 레거시 Codex 모델 참조 - doctor가 복구한 레거시 Codex OAuth/구독 모델 라우트.
    - `openai/*` - OpenAI 에이전트 턴을 위한 네이티브 Codex 앱 서버 내장 런타임.
    - `/codex ...` - 네이티브 Codex 대화 제어.
    - `/acp ...` 또는 `runtime: "acp"` - 명시적 ACP/acpx 제어.

  </Accordion>
  <Accordion title="ACP 라우팅 자연어 트리거">
    ACP 런타임으로 라우팅해야 하는 트리거:

    - "이것을 일회성 Claude Code ACP 세션으로 실행하고 결과를 요약하세요."
    - "이 작업에 Gemini CLI를 스레드에서 사용한 다음, 후속 작업을 같은 스레드에 유지하세요."
    - "백그라운드 스레드에서 ACP를 통해 Codex를 실행하세요."

    OpenClaw는 `runtime: "acp"`를 선택하고, 하네스 `agentId`를 해석하며,
    지원되는 경우 현재 대화나 스레드에 바인딩하고, 닫히거나 만료될 때까지
    후속 메시지를 해당 세션으로 라우팅합니다. Codex는 ACP/acpx가 명시적이거나
    요청된 작업에 네이티브 Codex Plugin을 사용할 수 없을 때만 이 경로를 따릅니다.

    `sessions_spawn`의 경우, ACP가 활성화되어 있고, 요청자가 샌드박스 처리되지 않았으며,
    ACP 런타임 백엔드가 로드된 경우에만 `runtime: "acp"`가 표시됩니다.
    `acp.dispatch.enabled=false`는 자동 ACP 스레드 디스패치를 일시 중지하지만,
    명시적인 `sessions_spawn({ runtime: "acp" })` 호출을 숨기거나 차단하지는 않습니다.
    이는 `codex`, `claude`, `droid`, `gemini`, `opencode` 같은 ACP 하네스 ID를 대상으로 합니다.
    해당 항목이 `agents.list[].runtime.type="acp"`로 명시적으로 구성되어 있지 않다면
    `agents_list`의 일반 OpenClaw 구성 에이전트 ID를 전달하지 마세요.
    그렇지 않은 경우 기본 하위 에이전트 런타임을 사용하세요. OpenClaw 에이전트가
    `runtime.type="acp"`로 구성되어 있으면 OpenClaw는 `runtime.acp.agent`를
    기본 하네스 ID로 사용합니다.

  </Accordion>
</AccordionGroup>

## ACP와 하위 에이전트 비교

외부 하네스 런타임을 원할 때 ACP를 사용하세요. `codex` Plugin이 활성화되어 있을 때
Codex 대화 바인딩/제어에는 **네이티브 Codex 앱 서버**를 사용하세요.
OpenClaw 네이티브 위임 실행을 원할 때는 **하위 에이전트**를 사용하세요.

| 영역          | ACP 세션                              | 하위 에이전트 실행                 |
| ------------- | ------------------------------------- | ---------------------------------- |
| 런타임        | ACP 백엔드 Plugin(예: acpx)           | OpenClaw 네이티브 하위 에이전트 런타임 |
| 세션 키       | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 주요 명령     | `/acp ...`                            | `/subagents ...`                   |
| 생성 도구     | `runtime:"acp"`가 포함된 `sessions_spawn` | `sessions_spawn`(기본 런타임)      |

[하위 에이전트](/ko/tools/subagents)도 참고하세요.

## ACP가 Claude Code를 실행하는 방식

ACP를 통해 Claude Code를 사용할 때 스택은 다음과 같습니다.

1. OpenClaw ACP 세션 제어 평면.
2. 공식 `@openclaw/acpx` 런타임 Plugin.
3. Claude ACP 어댑터.
4. Claude 측 런타임/세션 장치.

ACP Claude는 ACP 제어, 세션 재개, 백그라운드 작업 추적, 선택적 대화/스레드 바인딩을 갖춘 **하네스 세션**입니다.

CLI 백엔드는 별도의 텍스트 전용 로컬 폴백 런타임입니다. 자세한 내용은
[CLI 백엔드](/ko/gateway/cli-backends)를 참고하세요.

운영자를 위한 실용적인 규칙은 다음과 같습니다.

- **`/acp spawn`, 바인딩 가능한 세션, 런타임 제어, 또는 지속적인 하네스 작업을 원하나요?** ACP를 사용하세요.
- **원시 CLI를 통한 단순 로컬 텍스트 폴백을 원하나요?** CLI 백엔드를 사용하세요.

## 바인딩된 세션

### 멘탈 모델

- **채팅 표면** - 사람들이 계속 대화하는 위치(Discord 채널, Telegram 토픽, iMessage 채팅).
- **ACP 세션** - OpenClaw가 라우팅하는 지속성 있는 Codex/Claude/Gemini 런타임 상태.
- **자식 스레드/토픽** - `--thread ...`에 의해서만 생성되는 선택적 추가 메시징 표면.
- **런타임 작업 공간** - 하네스가 실행되는 파일 시스템 위치(`cwd`, 저장소 체크아웃, 백엔드 작업 공간). 채팅 표면과는 독립적입니다.

### 현재 대화 바인딩

`/acp spawn <harness> --bind here`는 현재 대화를 생성된 ACP 세션에 고정합니다.
자식 스레드 없이 같은 채팅 표면을 사용합니다. OpenClaw는 전송, 인증, 안전, 전달을 계속 소유합니다.
해당 대화의 후속 메시지는 같은 세션으로 라우팅됩니다. `/new`와 `/reset`은 세션을 제자리에서 재설정하고,
`/acp close`는 바인딩을 제거합니다.

예시:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="바인딩 규칙과 배타성">
    - `--bind here`와 `--thread ...`는 상호 배타적입니다.
    - `--bind here`는 현재 대화 바인딩을 표시하는 채널에서만 작동합니다. 그렇지 않으면 OpenClaw가 명확한 미지원 메시지를 반환합니다. 바인딩은 Gateway 재시작 후에도 유지됩니다.
    - Discord에서 `spawnSessions`는 `--thread auto|here`의 자식 스레드 생성을 제어합니다. `--bind here`는 해당하지 않습니다.
    - `--cwd` 없이 다른 ACP 에이전트로 생성하면 OpenClaw는 기본적으로 **대상 에이전트의** 작업 공간을 상속합니다. 누락된 상속 경로(`ENOENT`/`ENOTDIR`)는 백엔드 기본값으로 폴백합니다. 그 외 접근 오류(예: `EACCES`)는 생성 오류로 표시됩니다.
    - Gateway 관리 명령은 바인딩된 대화에서 로컬로 유지됩니다. 일반 후속 텍스트가 바인딩된 ACP 세션으로 라우팅되는 경우에도 `/acp ...` 명령은 OpenClaw가 처리합니다. `/status`와 `/unfocus`도 해당 표면에서 명령 처리가 활성화되어 있으면 항상 로컬로 유지됩니다.

  </Accordion>
  <Accordion title="스레드 바인딩 세션">
    채널 어댑터에 스레드 바인딩이 활성화되어 있을 때:

    - OpenClaw는 스레드를 대상 ACP 세션에 바인딩합니다.
    - 해당 스레드의 후속 메시지는 바인딩된 ACP 세션으로 라우팅됩니다.
    - ACP 출력은 같은 스레드로 다시 전달됩니다.
    - unfocus/close/archive/idle-timeout 또는 max-age 만료가 바인딩을 제거합니다.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, `/unfocus`는 Gateway 명령이며 ACP 하네스에 보내는 프롬프트가 아닙니다.

    스레드 바인딩 ACP에 필요한 기능 플래그:

    - `acp.enabled=true`
    - `acp.dispatch.enabled`는 기본적으로 켜져 있습니다(자동 ACP 스레드 디스패치를 일시 중지하려면 `false`로 설정하세요. 명시적인 `sessions_spawn({ runtime: "acp" })` 호출은 계속 작동합니다).
    - 채널 어댑터 스레드 세션 생성 활성화됨(기본값: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    스레드 바인딩 지원은 어댑터별로 다릅니다. 활성 채널 어댑터가
    스레드 바인딩을 지원하지 않으면 OpenClaw는 명확한 미지원/사용 불가
    메시지를 반환합니다.

  </Accordion>
  <Accordion title="스레드 지원 채널">
    - 세션/스레드 바인딩 기능을 노출하는 모든 채널 어댑터.
    - 현재 기본 제공 지원: **Discord** 스레드/채널, **Telegram** 토픽(그룹/슈퍼그룹의 포럼 토픽 및 DM 토픽).
    - Plugin 채널은 동일한 바인딩 인터페이스를 통해 지원을 추가할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 지속성 채널 바인딩

비일시적 워크플로의 경우 최상위 `bindings[]` 항목에서 지속성 ACP 바인딩을 구성하세요.

### 바인딩 모델

<ParamField path="bindings[].type" type='"acp"'>
  지속성 ACP 대화 바인딩을 표시합니다.
</ParamField>
<ParamField path="bindings[].match" type="object">
  대상 대화를 식별합니다. 채널별 형태:

- **Discord 채널/스레드:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack 채널/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. 안정적인 Slack ID를 권장합니다. 채널 바인딩은 해당 채널의 스레드 안에 있는 답글도 일치시킵니다.
- **Telegram 포럼 토픽:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/그룹:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. 직접 채팅에는 `+15555550123` 같은 E.164 번호를 사용하고, 그룹에는 `120363424282127706@g.us` 같은 WhatsApp 그룹 JID를 사용하세요.
- **iMessage DM/그룹:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. 안정적인 그룹 바인딩에는 `chat_id:*`를 권장합니다.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  소유 OpenClaw 에이전트 ID입니다.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  선택적 ACP 재정의입니다.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  선택적 운영자 표시 레이블입니다.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  선택적 런타임 작업 디렉터리입니다.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  선택적 백엔드 재정의입니다.
</ParamField>

### 에이전트별 런타임 기본값

에이전트마다 한 번씩 ACP 기본값을 정의하려면 `agents.list[].runtime`을 사용하세요.

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`(하네스 ID, 예: `codex` 또는 `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP 바인딩 세션의 재정의 우선순위:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. 전역 ACP 기본값(예: `acp.backend`)

### 예시

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### 동작

- OpenClaw는 채널별 허용 후 사용 전에 구성된 ACP 세션이 존재하도록 보장합니다.
- 해당 채널, 주제 또는 채팅의 메시지는 구성된 ACP 세션으로 라우팅됩니다.
- 구성된 ACP 바인딩은 자체 세션 라우트를 소유합니다. 채널 브로드캐스트 팬아웃은 일치하는 바인딩의 구성된 ACP 세션을 대체하지 않습니다.
- 바인딩된 대화에서 `/new`와 `/reset`은 같은 ACP 세션 키를 제자리에서 재설정합니다.
- 임시 런타임 바인딩(예: 스레드 포커스 흐름에서 생성된 바인딩)은 존재하는 곳에서 계속 적용됩니다.
- 명시적 `cwd`가 없는 교차 에이전트 ACP 스폰의 경우 OpenClaw는 에이전트 구성에서 대상 에이전트 작업 영역을 상속합니다.
- 누락된 상속 작업 영역 경로는 백엔드 기본 cwd로 폴백합니다. 누락이 아닌 접근 실패는 스폰 오류로 드러납니다.

## ACP 세션 시작

ACP 세션을 시작하는 두 가지 방법:

<Tabs>
  <Tab title="From sessions_spawn">
    에이전트 턴 또는 도구 호출에서 ACP 세션을 시작하려면 `runtime: "acp"`를 사용합니다.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime`의 기본값은 `subagent`이므로 ACP 세션에는 `runtime: "acp"`를 명시적으로 설정하세요. `agentId`를 생략하면 OpenClaw는 구성된 경우 `acp.defaultAgent`를 사용합니다. `mode: "session"`은 영구 바인딩 대화를 유지하려면 `thread: true`가 필요합니다.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    채팅에서 명시적인 운영자 제어가 필요하면 `/acp spawn`을 사용합니다.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    주요 플래그:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    [슬래시 명령](/ko/tools/slash-commands)을 참고하세요.

  </Tab>
</Tabs>

### `sessions_spawn` 매개변수

<ParamField path="task" type="string" required>
  ACP 세션으로 전송되는 초기 프롬프트입니다.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP 세션에는 반드시 `"acp"`여야 합니다.
</ParamField>
<ParamField path="agentId" type="string">
  ACP 대상 하니스 ID입니다. 설정된 경우 `acp.defaultAgent`로 폴백합니다.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  지원되는 경우 스레드 바인딩 흐름을 요청합니다.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"`은 일회성이고, `"session"`은 영구적입니다. `thread: true`이고 `mode`를 생략하면 OpenClaw가 런타임 경로별로 영구 동작을 기본값으로 사용할 수 있습니다. `mode: "session"`은 `thread: true`가 필요합니다.
</ParamField>
<ParamField path="cwd" type="string">
  요청된 런타임 작업 디렉터리입니다(백엔드/런타임 정책에 의해 검증됨). 생략하면 ACP 스폰은 구성된 경우 대상 에이전트 작업 영역을 상속합니다. 누락된 상속 경로는 백엔드 기본값으로 폴백하지만, 실제 접근 오류는 반환됩니다.
</ParamField>
<ParamField path="label" type="string">
  세션/배너 텍스트에 사용되는 운영자 대상 레이블입니다.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  새 세션을 만드는 대신 기존 ACP 세션을 재개합니다. 에이전트는 `session/load`를 통해 대화 기록을 재생합니다. `runtime: "acp"`가 필요합니다.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"`는 초기 ACP 실행 진행 요약을 시스템 이벤트로 요청자 세션에 다시 스트리밍합니다. 허용된 응답에는 전체 릴레이 기록을 tail할 수 있는 세션 범위 JSONL 로그(`<sessionId>.acp-stream.jsonl`)를 가리키는 `streamLogPath`가 포함됩니다.
  부모 진행 스트림은 `streaming.progress.commentary=false`가 아닌 한 기본적으로 어시스턴트 해설과 ACP 상태 진행률을 표시합니다. Discord도 스트림 모드가 구성되지 않은 경우 부모 미리보기를 기본적으로 진행률 모드로 설정합니다. 상태 진행률은 계속 `acp.stream.tagVisibility`를 따르므로 `plan` 같은 태그는 명시적으로 활성화하지 않는 한 숨겨진 상태로 유지됩니다.
</ParamField>

ACP `sessions_spawn` 실행은 기본 자식 턴 제한에 `agents.defaults.subagents.runTimeoutSeconds`를 사용합니다. 이 도구는 호출별 타임아웃 재정의를 허용하지 않습니다.

<ParamField path="model" type="string">
  ACP 자식 세션에 대한 명시적 모델 재정의입니다. Codex ACP 스폰은 `openai/gpt-5.4` 같은 OpenAI 참조를 `session/new` 전에 Codex ACP 시작 구성으로 정규화합니다. `openai/gpt-5.4/high` 같은 슬래시 형식도 Codex ACP 추론 노력을 설정합니다.
  생략하면 `sessions_spawn({ runtime: "acp" })`는 구성된 경우 기존 서브에이전트 모델 기본값(`agents.defaults.subagents.model` 또는 `agents.list[].subagents.model`)을 사용합니다. 그렇지 않으면 ACP 하니스가 자체 기본 모델을 사용하도록 둡니다.
  다른 하니스는 ACP `models`를 광고하고 `session/set_model`을 지원해야 합니다. 그렇지 않으면 OpenClaw/acpx는 대상 에이전트 기본값으로 조용히 폴백하는 대신 명확하게 실패합니다.
</ParamField>
<ParamField path="thinking" type="string">
  명시적 사고/추론 노력입니다. Codex ACP의 경우 `minimal`은 낮은 노력으로 매핑되고, `low`/`medium`/`high`/`xhigh`는 직접 매핑되며, `off`는 추론 노력 시작 재정의를 생략합니다.
  생략하면 ACP 스폰은 선택한 모델에 대해 기존 서브에이전트 사고 기본값과 모델별 `agents.defaults.models["provider/model"].params.thinking`을 사용합니다.
</ParamField>

## 스폰 바인딩 및 스레드 모드

<Tabs>
  <Tab title="--bind here|off">
    | 모드   | 동작                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 현재 활성 대화를 제자리에 바인딩합니다. 활성 대화가 없으면 실패합니다. |
    | `off`  | 현재 대화 바인딩을 만들지 않습니다.                          |

    참고:

    - `--bind here`는 "이 채널 또는 채팅을 Codex 기반으로 만들기"에 가장 단순한 운영자 경로입니다.
    - `--bind here`는 자식 스레드를 만들지 않습니다.
    - `--bind here`는 현재 대화 바인딩 지원을 노출하는 채널에서만 사용할 수 있습니다.
    - `--bind`와 `--thread`는 같은 `/acp spawn` 호출에서 함께 사용할 수 없습니다.

  </Tab>
  <Tab title="--thread auto|here|off">
    | 모드   | 동작                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 활성 스레드 안에서는 해당 스레드를 바인딩합니다. 스레드 밖에서는 지원되는 경우 자식 스레드를 만들고 바인딩합니다. |
    | `here` | 현재 활성 스레드가 필요합니다. 스레드 안이 아니면 실패합니다.                                                  |
    | `off`  | 바인딩하지 않습니다. 세션은 바인딩되지 않은 상태로 시작됩니다.                                                                 |

    참고:

    - 스레드 바인딩이 아닌 표면에서는 기본 동작이 사실상 `off`입니다.
    - 스레드 바인딩 스폰은 채널 정책 지원이 필요합니다.
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - 자식 스레드를 만들지 않고 현재 대화를 고정하려면 `--bind here`를 사용합니다.

  </Tab>
</Tabs>

## 전달 모델

ACP 세션은 대화형 작업 영역이거나 부모가 소유한 백그라운드 작업일 수 있습니다. 전달 경로는 그 형태에 따라 달라집니다.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    대화형 세션은 보이는 채팅 표면에서 계속 대화하도록 설계되었습니다.

    - `/acp spawn ... --bind here`는 현재 대화를 ACP 세션에 바인딩합니다.
    - `/acp spawn ... --thread ...`는 채널 스레드/주제를 ACP 세션에 바인딩합니다.
    - 영구 구성된 `bindings[].type="acp"`는 일치하는 대화를 같은 ACP 세션으로 라우팅합니다.

    바인딩된 대화의 후속 메시지는 ACP 세션으로 직접 라우팅되고, ACP 출력은 같은 채널/스레드/주제로 다시 전달됩니다.

    OpenClaw가 하니스에 보내는 내용:

    - 일반 바인딩 후속 메시지는 프롬프트 텍스트로 전송되며, 첨부 파일은 하니스/백엔드가 지원하는 경우에만 포함됩니다.
    - `/acp` 관리 명령과 로컬 Gateway 명령은 ACP 디스패치 전에 가로채집니다.
    - 런타임에서 생성된 완료 이벤트는 대상별로 구체화됩니다. OpenClaw 에이전트는 OpenClaw의 내부 런타임 컨텍스트 봉투를 받습니다. 외부 ACP 하니스는 자식 결과와 지침이 포함된 일반 프롬프트를 받습니다. 원시 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 봉투는 외부 하니스에 전송되거나 ACP 사용자 트랜스크립트 텍스트로 유지되어서는 안 됩니다.
    - ACP 트랜스크립트 항목은 사용자에게 보이는 트리거 텍스트 또는 일반 완료 프롬프트를 사용합니다. 내부 이벤트 메타데이터는 가능한 경우 OpenClaw 안에서 구조화된 상태로 유지되며, 사용자가 작성한 채팅 콘텐츠로 취급되지 않습니다.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    다른 에이전트 실행에서 스폰된 일회성 ACP 세션은 서브에이전트와 유사한 백그라운드 자식입니다.

    - 부모는 `sessions_spawn({ runtime: "acp", mode: "run" })`로 작업을 요청합니다.
    - 자식은 자체 ACP 하니스 세션에서 실행됩니다.
    - 자식 턴은 네이티브 서브에이전트 스폰이 사용하는 것과 같은 백그라운드 레인에서 실행되므로 느린 ACP 하니스가 관련 없는 기본 세션 작업을 차단하지 않습니다.
    - 완료는 작업 완료 알림 경로를 통해 다시 보고됩니다. OpenClaw는 내부 완료 메타데이터를 외부 하니스에 보내기 전에 일반 ACP 프롬프트로 변환하므로, 하니스는 OpenClaw 전용 런타임 컨텍스트 마커를 보지 않습니다.
    - 사용자 대상 응답이 유용할 때 부모는 자식 결과를 일반 어시스턴트 음성으로 다시 작성합니다.

    이 경로를 부모와 자식 간의 피어 투 피어 채팅으로 취급하지 **마세요**. 자식에는 이미 부모로 돌아가는 완료 채널이 있습니다.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send`는 스폰 후 다른 세션을 대상으로 할 수 있습니다. 일반 피어 세션의 경우 OpenClaw는 메시지를 주입한 뒤 에이전트 간(A2A) 후속 경로를 사용합니다.

    - 대상 세션의 응답을 기다립니다.
    - 선택적으로 요청자와 대상이 제한된 수의 후속 턴을 교환하도록 합니다.
    - 대상에게 알림 메시지를 생성하도록 요청합니다.
    - 해당 알림을 보이는 채널 또는 스레드에 전달합니다.

    이 A2A 경로는 발신자에게 보이는 후속 응답이 필요한 피어 전송을 위한 폴백입니다. 예를 들어 광범위한 `tools.sessions.visibility` 설정 아래에서 관련 없는 세션이 ACP 대상을 보고 메시지를 보낼 수 있는 경우에도 계속 활성화됩니다.

    OpenClaw는 요청자가 자기 부모가 소유한 일회성 ACP 자식의
    부모인 경우에만 A2A 후속 처리를 건너뜁니다. 이 경우
    작업 완료 위에서 A2A를 실행하면 자식의 결과로 부모를 깨우고,
    부모의 응답을 다시 자식에게 전달하여 부모/자식 에코 루프가
    만들어질 수 있습니다. 완료 경로가 이미 결과를 담당하므로
    이 소유된 자식 사례에서는 `sessions_send` 결과가
    `delivery.status="skipped"`를 보고합니다.

  </Accordion>
  <Accordion title="기존 세션 재개">
    새로 시작하는 대신 이전 ACP 세션을 계속하려면 `resumeSessionId`를
    사용합니다. 에이전트는 `session/load`를 통해 대화 기록을 재생하므로,
    이전에 있었던 모든 컨텍스트를 가지고 이어서 진행합니다.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    일반적인 사용 사례:

    - 노트북의 Codex 세션을 휴대폰으로 넘깁니다. 에이전트에게 중단한 지점부터 이어서 진행하라고 지시합니다.
    - CLI에서 대화형으로 시작한 코딩 세션을 이제 에이전트를 통해 헤드리스로 계속합니다.
    - Gateway 재시작 또는 유휴 시간 초과로 중단된 작업을 이어서 진행합니다.

    참고:

    - `resumeSessionId`는 `runtime: "acp"`일 때만 적용됩니다. 기본 하위 에이전트 런타임은 이 ACP 전용 필드를 무시합니다.
    - `streamTo`는 `runtime: "acp"`일 때만 적용됩니다. 기본 하위 에이전트 런타임은 이 ACP 전용 필드를 무시합니다.
    - `resumeSessionId`는 OpenClaw 채널 세션 키가 아니라 호스트 로컬 ACP/하네스 재개 ID입니다. OpenClaw는 디스패치 전에 여전히 ACP 생성 정책과 대상 에이전트 정책을 확인하며, 해당 업스트림 ID 로드에 대한 권한 부여는 ACP 백엔드 또는 하네스가 소유합니다.
    - `resumeSessionId`는 업스트림 ACP 대화 기록을 복원합니다. `thread`와 `mode`는 생성 중인 새 OpenClaw 세션에 계속 정상적으로 적용되므로, `mode: "session"`에는 여전히 `thread: true`가 필요합니다.
    - 대상 에이전트는 `session/load`를 지원해야 합니다(Codex와 Claude Code는 지원합니다).
    - 세션 ID를 찾을 수 없으면 생성이 명확한 오류와 함께 실패합니다. 새 세션으로 조용히 폴백하지 않습니다.

  </Accordion>
  <Accordion title="배포 후 스모크 테스트">
    Gateway 배포 후에는 단위 테스트만 신뢰하지 말고 라이브 종단 간
    확인을 실행합니다.

    1. 대상 호스트에서 배포된 Gateway 버전과 커밋을 확인합니다.
    2. 라이브 에이전트로 임시 ACPX 브리지 세션을 엽니다.
    3. 해당 에이전트에게 `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, 그리고 `Reply with exactly LIVE-ACP-SPAWN-OK` 작업으로 `sessions_spawn`을 호출하라고 요청합니다.
    4. `accepted=yes`, 실제 `childSessionKey`, 그리고 유효성 검사기 오류가 없음을 확인합니다.
    5. 임시 브리지 세션을 정리합니다.

    게이트는 `mode: "run"`에 유지하고 `streamTo: "parent"`는
    건너뜁니다. 스레드에 묶인 `mode: "session"`과 스트림 릴레이
    경로는 별도의 더 풍부한 통합 패스입니다.

  </Accordion>
</AccordionGroup>

## 샌드박스 호환성

ACP 세션은 현재 OpenClaw 샌드박스 내부가 **아니라** 호스트
런타임에서 실행됩니다.

<Warning>
**보안 경계:**

- 외부 하네스는 자체 CLI 권한과 선택된 `cwd`에 따라 읽기/쓰기를 수행할 수 있습니다.
- OpenClaw의 샌드박스 정책은 ACP 하네스 실행을 **감싸지 않습니다**.
- OpenClaw는 여전히 ACP 기능 게이트, 허용된 에이전트, 세션 소유권, 채널 바인딩, Gateway 전달 정책을 적용합니다.
- 샌드박스가 적용되는 OpenClaw 네이티브 작업에는 `runtime: "subagent"`를 사용합니다.

</Warning>

현재 제한 사항:

- 요청자 세션이 샌드박스 처리된 경우, `sessions_spawn({ runtime: "acp" })`와 `/acp spawn` 모두에서 ACP 생성이 차단됩니다.
- `runtime: "acp"`를 사용하는 `sessions_spawn`은 `sandbox: "require"`를 지원하지 않습니다.

## 세션 대상 확인

대부분의 `/acp` 작업은 선택적 세션 대상(`session-key`,
`session-id` 또는 `session-label`)을 허용합니다.

**확인 순서:**

1. 명시적 대상 인자(또는 `/acp steer`의 `--session`)
   - 키를 시도
   - 그런 다음 UUID 형태의 세션 ID
   - 그런 다음 레이블
2. 현재 스레드 바인딩(이 대화/스레드가 ACP 세션에 바인딩된 경우).
3. 현재 요청자 세션 폴백.

현재 대화 바인딩과 스레드 바인딩은 모두
2단계에 참여합니다.

대상이 확인되지 않으면 OpenClaw는 명확한 오류를 반환합니다
(`Unable to resolve session target: ...`).

## ACP 제어

| 명령                 | 수행 작업                                                 | 예시                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP 세션을 생성합니다. 선택적으로 현재 바인딩 또는 스레드 바인딩을 사용합니다. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 대상 세션의 진행 중인 턴을 취소합니다.                   | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 실행 중인 세션에 조종 지시를 보냅니다.                   | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 세션을 닫고 스레드 대상 바인딩을 해제합니다.             | `/acp close`                                                  |
| `/acp status`        | 백엔드, 모드, 상태, 런타임 옵션, 기능을 표시합니다.      | `/acp status`                                                 |
| `/acp set-mode`      | 대상 세션의 런타임 모드를 설정합니다.                    | `/acp set-mode plan`                                          |
| `/acp set`           | 일반 런타임 구성 옵션을 씁니다.                          | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 런타임 작업 디렉터리 재정의를 설정합니다.                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 승인 정책 프로필을 설정합니다.                           | `/acp permissions strict`                                     |
| `/acp timeout`       | 런타임 시간 제한(초)을 설정합니다.                       | `/acp timeout 120`                                            |
| `/acp model`         | 런타임 모델 재정의를 설정합니다.                         | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 세션 런타임 옵션 재정의를 제거합니다.                    | `/acp reset-options`                                          |
| `/acp sessions`      | 저장소의 최근 ACP 세션을 나열합니다.                     | `/acp sessions`                                               |
| `/acp doctor`        | 백엔드 상태, 기능, 실행 가능한 수정 사항을 표시합니다.   | `/acp doctor`                                                 |
| `/acp install`       | 결정적 설치 및 활성화 단계를 출력합니다.                 | `/acp install`                                                |

`/acp status`는 유효한 런타임 옵션과 런타임 수준 및
백엔드 수준 세션 식별자를 표시합니다. 백엔드에 기능이 없을 때
지원되지 않는 제어 오류가 명확히 드러납니다. `/acp sessions`는
현재 바인딩된 세션 또는 요청자 세션의 저장소를 읽습니다. 대상 토큰
(`session-key`, `session-id` 또는 `session-label`)은 에이전트별
사용자 지정 `session.store` 루트를 포함하여 Gateway 세션 발견을
통해 확인됩니다.

### 런타임 옵션 매핑

`/acp`에는 편의 명령과 일반 설정자가 있습니다. 동등한 작업:

| 명령                         | 매핑 대상                            | 참고                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 런타임 구성 키 `model`               | Codex ACP의 경우 OpenClaw는 `openai/<model>`을 어댑터 모델 ID로 정규화하고, `openai/gpt-5.4/high` 같은 슬래시 추론 접미사를 `reasoning_effort`에 매핑합니다.                                          |
| `/acp set thinking <level>`  | 표준 옵션 `thinking`                 | OpenClaw는 존재하는 경우 백엔드가 알린 동등 항목을 보내며, `thinking`, 그다음 `effort`, `reasoning_effort` 또는 `thought_level`을 우선합니다. Codex ACP의 경우 어댑터가 값을 `reasoning_effort`에 매핑합니다. |
| `/acp permissions <profile>` | 표준 옵션 `permissionProfile`        | OpenClaw는 존재하는 경우 `approval_policy`, `permission_profile`, `permissions` 또는 `permission_mode` 같은 백엔드가 알린 동등 항목을 보냅니다.                                                          |
| `/acp timeout <seconds>`     | 표준 옵션 `timeoutSeconds`           | OpenClaw는 존재하는 경우 `timeout` 또는 `timeout_seconds` 같은 백엔드가 알린 동등 항목을 보냅니다.                                                                                                       |
| `/acp cwd <path>`            | 런타임 cwd 재정의                    | 직접 업데이트합니다.                                                                                                                                                                                       |
| `/acp set <key> <value>`     | 일반                                 | `key=cwd`는 cwd 재정의 경로를 사용합니다.                                                                                                                                                                  |
| `/acp reset-options`         | 모든 런타임 재정의를 지웁니다        | -                                                                                                                                                                                                          |

## acpx 하네스, Plugin 설정, 권한

acpx 하네스 구성(Claude Code / Codex / Gemini CLI
별칭), plugin-tools 및 OpenClaw-tools MCP 브리지, ACP
권한 모드에 대해서는
[ACP 에이전트 - 설정](/ko/tools/acp-agents-setup)을 참조하세요.

## 문제 해결

| 증상                                                                        | 가능성 높은 원인                                                                                                       | 해결                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | 백엔드 Plugin이 없거나, 비활성화되었거나, `plugins.allow`에 의해 차단되었습니다.                                       | 백엔드 Plugin을 설치하고 활성화한 뒤, 해당 허용 목록이 설정되어 있으면 `plugins.allow`에 `acpx`를 포함한 다음 `/acp doctor`를 실행합니다.                                |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP가 전역적으로 비활성화되었습니다.                                                                                   | `acp.enabled=true`를 설정합니다.                                                                                                                                         |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 일반 스레드 메시지에서 자동 디스패치가 비활성화되었습니다.                                                            | 자동 스레드 라우팅을 재개하려면 `acp.dispatch.enabled=true`를 설정합니다. 명시적인 `sessions_spawn({ runtime: "acp" })` 호출은 계속 작동합니다.                          |
| `ACP agent "<id>" is not allowed by policy`                                 | 에이전트가 허용 목록에 없습니다.                                                                                       | 허용된 `agentId`를 사용하거나 `acp.allowedAgents`를 업데이트합니다.                                                                                                      |
| `/acp doctor` reports backend not ready right after startup                 | 백엔드 Plugin이 없거나, 비활성화되었거나, 허용/거부 정책에 의해 차단되었거나, 구성된 실행 파일을 사용할 수 없습니다. | 백엔드 Plugin을 설치/활성화하고 `/acp doctor`를 다시 실행한 뒤, 계속 비정상이면 백엔드 설치 또는 정책 오류를 검사합니다.                                                |
| Harness command not found                                                   | 어댑터 CLI가 설치되지 않았거나, 외부 Plugin이 없거나, Codex가 아닌 어댑터의 첫 실행 `npx` 가져오기가 실패했습니다.    | `/acp doctor`를 실행하고, Gateway 호스트에 어댑터를 설치/사전 준비하거나, acpx 에이전트 명령을 명시적으로 구성합니다.                                                    |
| Model-not-found from the harness                                            | 모델 ID가 다른 제공자/하네스에는 유효하지만 이 ACP 대상에는 유효하지 않습니다.                                        | 해당 하네스가 나열하는 모델을 사용하거나, 하네스에서 모델을 구성하거나, 재정의를 생략합니다.                                                                            |
| Vendor auth error from the harness                                          | OpenClaw는 정상 상태이지만 대상 CLI/제공자가 로그인되어 있지 않습니다.                                                | Gateway 호스트 환경에서 로그인하거나 필요한 제공자 키를 제공합니다.                                                                                                      |
| `Unable to resolve session target: ...`                                     | 잘못된 키/ID/레이블 토큰입니다.                                                                                        | `/acp sessions`를 실행하고 정확한 키/레이블을 복사한 뒤 다시 시도합니다.                                                                                                 |
| `--bind here requires running /acp spawn inside an active ... conversation` | 활성 바인딩 가능 대화 없이 `--bind here`가 사용되었습니다.                                                            | 대상 채팅/채널로 이동해 다시 시도하거나, 바인딩되지 않은 스폰을 사용합니다.                                                                                             |
| `Conversation bindings are unavailable for <channel>.`                      | 어댑터에 현재 대화 ACP 바인딩 기능이 없습니다.                                                                         | 지원되는 경우 `/acp spawn ... --thread ...`를 사용하거나, 최상위 `bindings[]`를 구성하거나, 지원되는 채널로 이동합니다.                                                  |
| `--thread here requires running /acp spawn inside an active ... thread`     | 스레드 컨텍스트 밖에서 `--thread here`가 사용되었습니다.                                                              | 대상 스레드로 이동하거나 `--thread auto`/`off`를 사용합니다.                                                                                                             |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 다른 사용자가 활성 바인딩 대상을 소유하고 있습니다.                                                                    | 소유자로 다시 바인딩하거나 다른 대화 또는 스레드를 사용합니다.                                                                                                          |
| `Thread bindings are unavailable for <channel>.`                            | 어댑터에 스레드 바인딩 기능이 없습니다.                                                                                | `--thread off`를 사용하거나 지원되는 어댑터/채널로 이동합니다.                                                                                                           |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP 런타임은 호스트 측에 있으며, 요청자 세션은 샌드박스 처리되어 있습니다.                                            | 샌드박스 처리된 세션에서는 `runtime="subagent"`를 사용하거나, 샌드박스 처리되지 않은 세션에서 ACP 스폰을 실행합니다.                                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP 런타임에 `sandbox="require"`가 요청되었습니다.                                                                     | 필수 샌드박싱에는 `runtime="subagent"`를 사용하거나, 샌드박스 처리되지 않은 세션에서 `sandbox="inherit"`로 ACP를 사용합니다.                                             |
| `Cannot apply --model ... did not advertise model support`                  | 대상 하네스가 일반 ACP 모델 전환을 노출하지 않습니다.                                                                 | ACP `models`/`session/set_model`을 알리는 하네스를 사용하거나, Codex ACP 모델 참조를 사용하거나, 자체 시작 플래그가 있다면 하네스에서 모델을 직접 구성합니다.            |
| Missing ACP metadata for bound session                                      | 오래되었거나 삭제된 ACP 세션 메타데이터입니다.                                                                         | `/acp spawn`으로 다시 생성한 뒤 스레드를 다시 바인딩/포커스합니다.                                                                                                       |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`가 비대화형 ACP 세션에서 쓰기/실행을 차단합니다.                                                      | `plugins.entries.acpx.config.permissionMode`를 `approve-all`로 설정하고 gateway를 재시작합니다. [권한 구성](/ko/tools/acp-agents-setup#permission-configuration)을 참조하세요. |
| ACP session fails early with little output                                  | 권한 프롬프트가 `permissionMode`/`nonInteractivePermissions`에 의해 차단됩니다.                                       | `AcpRuntimeError`가 있는지 gateway 로그를 확인합니다. 전체 권한에는 `permissionMode=approve-all`을 설정하고, 단계적 성능 저하에는 `nonInteractivePermissions=deny`를 설정합니다. |
| ACP session stalls indefinitely after completing work                       | 하네스 프로세스는 완료되었지만 ACP 세션이 완료를 보고하지 않았습니다.                                                 | OpenClaw를 업데이트하세요. 현재 acpx 정리는 종료 시와 Gateway 시작 시 OpenClaw가 소유한 오래된 래퍼 및 어댑터 프로세스를 정리합니다.                                   |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 내부 이벤트 엔벌로프가 ACP 경계를 넘어 유출되었습니다.                                                                | OpenClaw를 업데이트하고 완료 흐름을 다시 실행하세요. 외부 하네스는 일반 완료 프롬프트만 받아야 합니다.                                                                  |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable`는
ACP/acpx가 아니라 네이티브 Codex hook relay에 속합니다. 바인딩된 Codex 채팅에서는 `/new` 또는 `/reset`으로
새 세션을 시작하세요. 한 번 작동한 뒤 다음 네이티브 도구 호출에서 다시 반환되면
`/new`를 반복하는 대신 Codex app-server 또는 OpenClaw Gateway를 재시작하세요.
[Codex 하네스 문제 해결](/ko/plugins/codex-harness#troubleshooting)을 참조하세요.
</Note>

## 관련 항목

- [ACP 에이전트 - 설정](/ko/tools/acp-agents-setup)
- [에이전트 보내기](/ko/tools/agent-send)
- [CLI 백엔드](/ko/gateway/cli-backends)
- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)
- [멀티 에이전트 샌드박스 도구](/ko/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (브리지 모드)](/ko/cli/acp)
- [하위 에이전트](/ko/tools/subagents)
