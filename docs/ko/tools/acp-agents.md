---
read_when:
    - ACP를 통해 코딩 하니스 실행
    - 메시징 채널에서 대화 바인딩된 ACP 세션 설정
    - 메시지 채널 대화를 영구 ACP 세션에 바인딩하기
    - ACP 백엔드, Plugin 연결 또는 completion 전달 문제 해결
    - 채팅에서 /acp 명령 실행하기
sidebarTitle: ACP agents
summary: ACP 백엔드를 통해 외부 코딩 하니스(Claude Code, Cursor, Gemini CLI, 명시적 Codex ACP, OpenClaw ACP, OpenCode) 실행
title: ACP 에이전트
x-i18n:
    generated_at: "2026-04-26T11:39:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3b8550be4cf0da2593b0770e302833e1722820d3c922e5508a253685cd0cb6b
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 세션은
OpenClaw이 ACP 백엔드 Plugin을 통해 외부 코딩 하네스(예: Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI 및 기타
지원되는 ACPX 하네스)를 실행할 수 있게 합니다.

각 ACP 세션 생성은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

<Note>
**ACP는 외부 하네스 경로이며, 기본 Codex 경로가 아닙니다.** 기본
Codex app-server Plugin은 `/codex ...` 제어와
`agentRuntime.id: "codex"` 임베디드 런타임을 담당합니다. ACP는
`/acp ...` 제어와 `sessions_spawn({ runtime: "acp" })` 세션을 담당합니다.

Codex 또는 Claude Code가 기존 OpenClaw 채널 대화에 외부 MCP 클라이언트로
직접 연결되게 하려면 ACP 대신
[`openclaw mcp serve`](/ko/cli/mcp)를 사용하세요.
</Note>

## 어떤 페이지를 사용해야 하나요?

| 원하는 작업…                                                                                  | 사용 항목                            | 참고                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 현재 대화에서 Codex를 바인드하거나 제어하기                                                   | `/codex bind`, `/codex threads`     | `codex` plugin이 활성화된 경우 기본 Codex app-server 경로입니다. 바인드된 채팅 답장, 이미지 전달, model/fast/permissions, stop 및 steer 제어가 포함됩니다. ACP는 명시적인 대체 경로입니다. |
| OpenClaw을 _통해_ Claude Code, Gemini CLI, 명시적 Codex ACP 또는 다른 외부 하네스 실행하기 | 이 페이지                           | 채팅 바인드 세션, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, 백그라운드 작업, 런타임 제어                                                                                           |
| 에디터나 클라이언트를 위해 OpenClaw Gateway 세션을 ACP 서버로 _노출_하기                     | [`openclaw acp`](/ko/cli/acp)          | 브리지 모드입니다. IDE/클라이언트가 stdio/WebSocket을 통해 OpenClaw과 ACP로 통신합니다.                                                                                                      |
| 로컬 AI CLI를 텍스트 전용 대체 모델로 재사용하기                                             | [CLI 백엔드](/ko/gateway/cli-backends) | ACP가 아닙니다. OpenClaw 도구 없음, ACP 제어 없음, 하네스 런타임 없음                                                                                                                        |

## 바로 사용할 수 있나요?

대체로 그렇습니다. 새 설치에는 번들된 `acpx` 런타임 plugin이 기본적으로
활성화되어 제공되며, OpenClaw은 시작 시 plugin 로컬에 고정된 `acpx`
바이너리를 검사하고 자체 복구합니다. 준비 상태를 확인하려면 `/acp doctor`를
실행하세요.

OpenClaw은 ACP 생성이 **실제로 사용 가능한** 경우에만 에이전트에게 ACP
생성 방법을 안내합니다. ACP가 활성화되어 있어야 하고, 디스패치가 비활성화되어
있지 않아야 하며, 현재 세션이 샌드박스로 차단되지 않아야 하고, 런타임
백엔드가 로드되어 있어야 합니다. 이러한 조건이 충족되지 않으면 ACP plugin
Skills와 `sessions_spawn` ACP 안내는 숨겨진 상태로 유지되어, 에이전트가
사용할 수 없는 백엔드를 제안하지 않습니다.

<AccordionGroup>
  <Accordion title="첫 실행 시 주의사항">
    - `plugins.allow`가 설정되어 있으면 이는 제한적인 plugin 인벤토리이며, **반드시** `acpx`를 포함해야 합니다. 그렇지 않으면 번들된 기본값이 의도적으로 차단되며 `/acp doctor`가 누락된 허용 목록 항목을 보고합니다.
    - 대상 하네스 어댑터(Codex, Claude 등)는 처음 사용할 때 `npx`로 필요 시 가져올 수 있습니다.
    - 해당 하네스에 대한 벤더 인증은 여전히 호스트에 존재해야 합니다.
    - 호스트에 npm 또는 네트워크 접근이 없으면 캐시를 미리 준비하거나 다른 방식으로 어댑터를 설치하기 전까지 첫 실행 어댑터 가져오기가 실패합니다.
  </Accordion>
  <Accordion title="런타임 필수 조건">
    ACP는 실제 외부 하네스 프로세스를 실행합니다. OpenClaw은 라우팅,
    백그라운드 작업 상태, 전달, 바인딩 및 정책을 담당하고, 하네스는
    자체 provider 로그인, 모델 카탈로그, 파일시스템 동작 및 기본 도구를
    담당합니다.

    OpenClaw을 문제 원인으로 판단하기 전에 다음을 확인하세요.

    - `/acp doctor`가 활성화되고 정상인 백엔드를 보고하는지 확인합니다.
    - 허용 목록이 설정된 경우 대상 id가 `acp.allowedAgents`에 허용되어 있는지 확인합니다.
    - 하네스 명령이 Gateway 호스트에서 시작될 수 있는지 확인합니다.
    - 해당 하네스에 대한 provider 인증이 존재하는지 확인합니다(`claude`, `codex`, `gemini`, `opencode`, `droid` 등).
    - 선택한 모델이 해당 하네스에 존재하는지 확인합니다. 모델 id는 하네스 간에 호환되지 않습니다.
    - 요청한 `cwd`가 존재하고 접근 가능한지 확인하거나, `cwd`를 생략하여 백엔드가 기본값을 사용하도록 합니다.
    - 권한 모드가 작업과 맞는지 확인합니다. 비대화형 세션은 기본 권한 프롬프트를 클릭할 수 없으므로, 쓰기/실행이 많은 코딩 작업에는 일반적으로 헤드리스로 진행할 수 있는 ACPX 권한 프로필이 필요합니다.

  </Accordion>
</AccordionGroup>

OpenClaw plugin 도구와 내장 OpenClaw 도구는 기본적으로 ACP 하네스에
노출되지 않습니다. 하네스가 해당 도구를 직접 호출해야 하는 경우에만
[ACP 에이전트 — 설정](/ko/tools/acp-agents-setup)의 명시적 MCP 브리지를
활성화하세요.

## 지원되는 하네스 대상

번들된 `acpx` 백엔드에서는 다음 하네스 id를 `/acp spawn <id>` 또는
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` 대상로 사용합니다.

| Harness id | 일반적인 백엔드                                | 참고                                                                                  |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 어댑터                         | 호스트에 Claude Code 인증이 필요합니다.                                               |
| `codex`    | Codex ACP 어댑터                               | 기본 `/codex`를 사용할 수 없거나 ACP가 요청된 경우에만 명시적 ACP 대체 경로입니다.    |
| `copilot`  | GitHub Copilot ACP 어댑터                      | Copilot CLI/런타임 인증이 필요합니다.                                                 |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | 로컬 설치가 다른 ACP 진입점을 제공하는 경우 acpx 명령을 재정의하세요.                 |
| `droid`    | Factory Droid CLI                              | Factory/Droid 인증 또는 하네스 환경의 `FACTORY_API_KEY`가 필요합니다.                 |
| `gemini`   | Gemini CLI ACP 어댑터                          | Gemini CLI 인증 또는 API 키 설정이 필요합니다.                                        |
| `iflow`    | iFlow CLI                                      | 어댑터 사용 가능 여부와 모델 제어는 설치된 CLI에 따라 달라집니다.                     |
| `kilocode` | Kilo Code CLI                                  | 어댑터 사용 가능 여부와 모델 제어는 설치된 CLI에 따라 달라집니다.                     |
| `kimi`     | Kimi/Moonshot CLI                              | 호스트에 Kimi/Moonshot 인증이 필요합니다.                                             |
| `kiro`     | Kiro CLI                                       | 어댑터 사용 가능 여부와 모델 제어는 설치된 CLI에 따라 달라집니다.                     |
| `opencode` | OpenCode ACP 어댑터                            | OpenCode CLI/provider 인증이 필요합니다.                                              |
| `openclaw` | `openclaw acp`를 통한 OpenClaw Gateway 브리지 | ACP 인식 하네스가 OpenClaw Gateway 세션으로 다시 통신할 수 있게 합니다.               |
| `pi`       | Pi/임베디드 OpenClaw 런타임                    | OpenClaw 기본 하네스 실험에 사용됩니다.                                               |
| `qwen`     | Qwen Code / Qwen CLI                           | 호스트에 Qwen 호환 인증이 필요합니다.                                                 |

사용자 지정 acpx 에이전트 별칭은 acpx 자체에서 구성할 수 있지만, OpenClaw
정책은 여전히 디스패치 전에 `acp.allowedAgents`와
`agents.list[].runtime.acp.agent` 매핑을 확인합니다.

## 운영자 실행 가이드

채팅에서 빠르게 사용하는 `/acp` 흐름:

<Steps>
  <Step title="생성">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` 또는 명시적으로
    `/acp spawn codex`.
  </Step>
  <Step title="작업">
    바인드된 대화나 스레드에서 계속 진행하거나(또는 세션 키를
    명시적으로 지정하여) 작업합니다.
  </Step>
  <Step title="상태 확인">
    `/acp status`
  </Step>
  <Step title="조정">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="지시">
    컨텍스트를 교체하지 않고: `/acp steer 로깅을 더 엄격하게 하고 계속 진행`.
  </Step>
  <Step title="중지">
    `/acp cancel`(현재 턴) 또는 `/acp close`(세션 + 바인딩).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="수명 주기 세부 정보">
    - 생성은 ACP 런타임 세션을 만들거나 재개하고, OpenClaw 세션 저장소에 ACP 메타데이터를 기록하며, 실행이 상위 소유인 경우 백그라운드 작업을 만들 수 있습니다.
    - 바인드된 후속 메시지는 바인딩이 닫히거나, 포커스 해제되거나, 재설정되거나, 만료될 때까지 ACP 세션으로 직접 전달됩니다.
    - Gateway 명령은 로컬에 유지됩니다. `/acp ...`, `/status`, `/unfocus`는 바인드된 ACP 하네스에 일반 프롬프트 텍스트로 전송되지 않습니다.
    - `cancel`은 백엔드가 취소를 지원하는 경우 활성 턴을 중단합니다. 바인딩이나 세션 메타데이터를 삭제하지는 않습니다.
    - `close`는 OpenClaw 관점에서 ACP 세션을 종료하고 바인딩을 제거합니다. 하네스가 재개를 지원하는 경우 자체 업스트림 기록은 계속 유지될 수 있습니다.
    - 유휴 런타임 워커는 `acp.runtime.ttlMinutes` 이후 정리 대상이 됩니다. 저장된 세션 메타데이터는 `/acp sessions`에서 계속 사용할 수 있습니다.
  </Accordion>
  <Accordion title="기본 Codex 라우팅 규칙">
    자연어 트리거 중 다음은 활성화된 경우 **기본 Codex
    plugin**으로 라우팅되어야 합니다.

    - "이 Discord 채널을 Codex에 바인드해."
    - "이 채팅을 Codex 스레드 `<id>`에 연결해."
    - "Codex 스레드를 보여준 다음, 이 스레드를 바인드해."

    기본 Codex 대화 바인딩은 기본 채팅 제어 경로입니다.
    OpenClaw 동적 도구는 계속 OpenClaw을 통해 실행되며,
    shell/apply-patch 같은 Codex 기본 도구는 Codex 내부에서 실행됩니다.
    Codex 기본 도구 이벤트의 경우, OpenClaw은 턴별 기본
    hook relay를 삽입하여 plugin hook이 `before_tool_call`을 차단하고,
    `after_tool_call`을 관찰하며, Codex `PermissionRequest` 이벤트를
    OpenClaw 승인으로 라우팅할 수 있게 합니다. Codex `Stop` hook은
    OpenClaw `before_agent_finalize`로 전달되며, 여기서 plugin은
    Codex가 답변을 완료하기 전에 모델 패스를 한 번 더 요청할 수 있습니다.
    이 relay는 의도적으로 보수적으로 유지됩니다. Codex 기본 도구
    인수를 변경하거나 Codex 스레드 레코드를 다시 쓰지 않습니다. ACP
    런타임/세션 모델을 원할 때만 명시적 ACP를 사용하세요. 임베디드 Codex
    지원 경계는
    [Codex harness v1 support contract](/ko/plugins/codex-harness#v1-support-contract)에
    문서화되어 있습니다.

  </Accordion>
  <Accordion title="모델 / provider / 런타임 선택 치트 시트">
    - `openai-codex/*` — PI Codex OAuth/구독 경로.
    - `openai/*` + `agentRuntime.id: "codex"` — 기본 Codex app-server 임베디드 런타임.
    - `/codex ...` — 기본 Codex 대화 제어.
    - `/acp ...` 또는 `runtime: "acp"` — 명시적 ACP/acpx 제어.
  </Accordion>
  <Accordion title="ACP 라우팅 자연어 트리거">
    ACP 런타임으로 라우팅되어야 하는 트리거:

    - "이 작업을 일회성 Claude Code ACP 세션으로 실행하고 결과를 요약해."
    - "이 작업에 Gemini CLI를 스레드에서 사용하고, 후속 작업도 같은 스레드에서 계속해."
    - "백그라운드 스레드에서 ACP를 통해 Codex를 실행해."

    OpenClaw은 `runtime: "acp"`를 선택하고, 하네스 `agentId`를 확인한 뒤,
지원되는 경우 현재 대화나 스레드에 바인드하고, 닫히거나 만료될 때까지
후속 메시지를 해당 세션으로 라우팅합니다. Codex는 ACP/acpx가 명시적이거나
요청된 작업에 대해 기본 Codex plugin을 사용할 수 없는 경우에만 이 경로를
따릅니다.

`sessions_spawn`의 경우, `runtime: "acp"`는 ACP가 활성화되어 있고,
요청자가 샌드박스 상태가 아니며, ACP 런타임 백엔드가 로드된 경우에만
표시됩니다. 이는 `codex`, `claude`, `droid`, `gemini`, `opencode` 같은
ACP 하네스 id를 대상으로 합니다. `agents_list`의 일반 OpenClaw 설정 에이전트
id는 해당 항목이 `agents.list[].runtime.type="acp"`로 명시적으로 구성된
경우가 아니면 전달하지 마세요. 그렇지 않으면 기본 sub-agent 런타임을
사용하세요. OpenClaw 에이전트가 `runtime.type="acp"`로 구성된 경우,
OpenClaw은 기본 하네스 id로 `runtime.acp.agent`를 사용합니다.

  </Accordion>
</AccordionGroup>

## ACP와 sub-agent 비교

외부 하네스 런타임을 원하면 ACP를 사용하세요. `codex` plugin이 활성화된 경우
Codex 대화 바인딩/제어에는 **기본 Codex app-server**를 사용하세요.
OpenClaw 기본 위임 실행을 원하면 **sub-agent**를 사용하세요.

| 영역          | ACP 세션                              | Sub-agent 실행                    |
| ------------- | ------------------------------------- | --------------------------------- |
| 런타임        | ACP 백엔드 Plugin(예: acpx)           | OpenClaw 기본 sub-agent 런타임    |
| 세션 키       | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>` |
| 주요 명령     | `/acp ...`                            | `/subagents ...`                  |
| 생성 도구     | `runtime:"acp"`가 있는 `sessions_spawn` | `sessions_spawn`(기본 런타임)   |

추가로 [Sub-agents](/ko/tools/subagents)도 참고하세요.

## ACP가 Claude Code를 실행하는 방법

ACP를 통한 Claude Code의 스택은 다음과 같습니다.

1. OpenClaw ACP 세션 제어 플레인
2. 번들된 `acpx` 런타임 plugin
3. Claude ACP 어댑터
4. Claude 측 런타임/세션 메커니즘

ACP Claude는 ACP 제어, 세션 재개, 백그라운드 작업 추적 및 선택적
대화/스레드 바인딩을 갖춘 **하네스 세션**입니다.

CLI 백엔드는 별도의 텍스트 전용 로컬 대체 런타임입니다 —
[CLI 백엔드](/ko/gateway/cli-backends)를 참고하세요.

운영자 관점의 실용적인 규칙은 다음과 같습니다.

- **`/acp spawn`, 바인드 가능한 세션, 런타임 제어 또는 지속적인 하네스 작업이 필요한가요?** ACP를 사용하세요.
- **원시 CLI를 통한 간단한 로컬 텍스트 대체가 필요한가요?** CLI 백엔드를 사용하세요.

## 바인드된 세션

### 개념 이해

- **채팅 표면** — 사람들이 계속 대화하는 위치(Discord 채널, Telegram 토픽, iMessage 채팅).
- **ACP 세션** — OpenClaw이 라우팅하는 지속형 Codex/Claude/Gemini 런타임 상태.
- **하위 스레드/토픽** — `--thread ...`로만 생성되는 선택적 추가 메시징 표면.
- **런타임 작업 공간** — 하네스가 실행되는 파일시스템 위치(`cwd`, 리포지토리 체크아웃, 백엔드 작업 공간). 채팅 표면과는 독립적입니다.

### 현재 대화 바인드

`/acp spawn <harness> --bind here`는 현재 대화를 생성된 ACP 세션에
고정합니다. 하위 스레드는 없고, 동일한 채팅 표면을 사용합니다. OpenClaw은
계속 전송, 인증, 안전성 및 전달을 담당합니다. 해당 대화의 후속 메시지는
같은 세션으로 라우팅되며, `/new`와 `/reset`은 세션을 제자리에서 재설정하고,
`/acp close`는 바인딩을 제거합니다.

예시:

```text
/codex bind                                              # 기본 Codex 바인드, 이후 메시지를 여기로 라우팅
/codex model gpt-5.4                                     # 바인드된 기본 Codex 스레드 조정
/codex stop                                              # 활성 기본 Codex 턴 제어
/acp spawn codex --bind here                             # Codex에 대한 명시적 ACP 대체 경로
/acp spawn codex --thread auto                           # 하위 스레드/토픽을 만들고 거기에 바인드할 수 있음
/acp spawn codex --bind here --cwd /workspace/repo       # 동일한 채팅 바인딩, Codex는 /workspace/repo에서 실행
```

<AccordionGroup>
  <Accordion title="바인딩 규칙 및 배타성">
    - `--bind here`와 `--thread ...`는 함께 사용할 수 없습니다.
    - `--bind here`는 현재 대화 바인딩을 제공하는 채널에서만 동작합니다. 그렇지 않으면 OpenClaw이 명확한 미지원 메시지를 반환합니다. 바인딩은 Gateway 재시작 후에도 유지됩니다.
    - Discord에서는 OpenClaw이 `--thread auto|here`를 위해 하위 스레드를 생성해야 할 때만 `spawnAcpSessions`가 필요하며, `--bind here`에는 필요하지 않습니다.
    - 다른 ACP 에이전트로 `--cwd` 없이 생성하는 경우, OpenClaw은 기본적으로 **대상 에이전트의** 작업 공간을 상속합니다. 상속된 경로가 없으면(`ENOENT`/`ENOTDIR`) 백엔드 기본값으로 대체되며, 그 외 접근 오류(예: `EACCES`)는 생성 오류로 표시됩니다.
    - Gateway 관리 명령은 바인드된 대화에서도 로컬에 유지됩니다. 일반 후속 텍스트가 바인드된 ACP 세션으로 라우팅되더라도 `/acp ...` 명령은 OpenClaw이 처리합니다. `/status`와 `/unfocus`도 해당 표면에서 명령 처리가 활성화되어 있으면 항상 로컬에 유지됩니다.
  </Accordion>
  <Accordion title="스레드 바인드 세션">
    채널 어댑터에서 스레드 바인딩이 활성화된 경우:

    - OpenClaw이 스레드를 대상 ACP 세션에 바인드합니다.
    - 해당 스레드의 후속 메시지는 바인드된 ACP 세션으로 라우팅됩니다.
    - ACP 출력은 같은 스레드로 다시 전달됩니다.
    - unfocus/close/archive/유휴 시간 초과 또는 최대 수명 만료 시 바인딩이 제거됩니다.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, `/unfocus`는 ACP 하네스에 대한 프롬프트가 아니라 Gateway 명령입니다.

    스레드 바인드 ACP에 필요한 기능 플래그:

    - `acp.enabled=true`
    - `acp.dispatch.enabled`는 기본적으로 켜져 있습니다(ACP 디스패치를 일시 중지하려면 `false`로 설정).
    - 채널 어댑터 ACP 스레드 생성 플래그 활성화(어댑터별):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    스레드 바인딩 지원은 어댑터마다 다릅니다. 활성 채널
    어댑터가 스레드 바인딩을 지원하지 않으면 OpenClaw은 명확한
    미지원/사용 불가 메시지를 반환합니다.

  </Accordion>
  <Accordion title="스레드를 지원하는 채널">
    - 세션/스레드 바인딩 기능을 노출하는 모든 채널 어댑터
    - 현재 내장 지원: **Discord** 스레드/채널, **Telegram** 토픽(그룹/슈퍼그룹의 포럼 토픽 및 DM 토픽)
    - Plugin 채널은 동일한 바인딩 인터페이스를 통해 지원을 추가할 수 있습니다.
  </Accordion>
</AccordionGroup>

## 영구 채널 바인딩

비임시 워크플로의 경우, 최상위 `bindings[]` 항목에 영구 ACP 바인딩을
구성하세요.

### 바인딩 모델

<ParamField path="bindings[].type" type='"acp"'>
  영구 ACP 대화 바인딩을 표시합니다.
</ParamField>
<ParamField path="bindings[].match" type="object">
  대상 대화를 식별합니다. 채널별 형식:

- **Discord 채널/스레드:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram 포럼 토픽:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/그룹:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. 안정적인 그룹 바인딩에는 `chat_id:*` 또는 `chat_identifier:*`를 권장합니다.
- **iMessage DM/그룹:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. 안정적인 그룹 바인딩에는 `chat_id:*`를 권장합니다.
  </ParamField>
  <ParamField path="bindings[].agentId" type="string">
  소유 OpenClaw 에이전트 id입니다.
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  선택적 ACP 재정의입니다.
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  선택적 운영자용 레이블입니다.
  </ParamField>
  <ParamField path="bindings[].acp.cwd" type="string">
  선택적 런타임 작업 디렉터리입니다.
  </ParamField>
  <ParamField path="bindings[].acp.backend" type="string">
  선택적 백엔드 재정의입니다.
  </ParamField>

### 에이전트별 런타임 기본값

에이전트별 ACP 기본값을 한 번만 정의하려면 `agents.list[].runtime`을
사용하세요.

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (하네스 id, 예: `codex` 또는 `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP 바인드 세션의 재정의 우선순위:**

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

### 동작 방식

- OpenClaw은 사용 전에 구성된 ACP 세션이 존재하도록 보장합니다.
- 해당 채널 또는 토픽의 메시지는 구성된 ACP 세션으로 라우팅됩니다.
- 바인드된 대화에서 `/new`와 `/reset`은 동일한 ACP 세션 키를 제자리에서 재설정합니다.
- 임시 런타임 바인딩(예: 스레드 포커스 흐름으로 생성된 것)은 존재하는 경우 계속 적용됩니다.
- 에이전트 간 ACP 생성에서 명시적 `cwd`가 없으면 OpenClaw은 에이전트 설정의 대상 에이전트 작업 공간을 상속합니다.
- 상속된 작업 공간 경로가 없으면 백엔드 기본 cwd로 대체되며, 누락이 아닌 접근 실패는 생성 오류로 표시됩니다.

## ACP 세션 시작

ACP 세션을 시작하는 방법은 두 가지입니다.

<Tabs>
  <Tab title="sessions_spawn에서">
    `runtime: "acp"`를 사용하여 에이전트 턴 또는
    도구 호출에서 ACP 세션을 시작합니다.

    ```json
    {
      "task": "리포지토리를 열고 실패하는 테스트를 요약해",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime`의 기본값은 `subagent`이므로 ACP 세션에는
    `runtime: "acp"`를 명시적으로 설정하세요. `agentId`를 생략하면
    구성된 경우 OpenClaw은 `acp.defaultAgent`를 사용합니다.
    `mode: "session"`은 영구적인 바인드 대화를 유지하려면
    `thread: true`가 필요합니다.
    </Note>

  </Tab>
  <Tab title="/acp 명령에서">
    채팅에서 명시적인 운영자 제어를 위해 `/acp spawn`을 사용하세요.

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
  ACP 세션에 전송되는 초기 프롬프트입니다.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP 세션에는 반드시 `"acp"`여야 합니다.
</ParamField>
<ParamField path="agentId" type="string">
  ACP 대상 하네스 id입니다. 설정된 경우 `acp.defaultAgent`로 대체됩니다.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  지원되는 경우 스레드 바인딩 흐름을 요청합니다.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"`은 일회성이고, `"session"`은 영구적입니다. `thread: true`이고
  `mode`를 생략하면 OpenClaw이 런타임 경로에 따라 영구 동작을 기본값으로
  사용할 수 있습니다. `mode: "session"`에는 `thread: true`가 필요합니다.
</ParamField>
<ParamField path="cwd" type="string">
  요청된 런타임 작업 디렉터리입니다(백엔드/런타임 정책에 따라 검증됨).
  생략하면 ACP 생성은 구성된 경우 대상 에이전트 작업 공간을 상속합니다.
  상속된 경로가 없으면 백엔드 기본값으로 대체되고, 실제 접근 오류는
  그대로 반환됩니다.
</ParamField>
<ParamField path="label" type="string">
  세션/배너 텍스트에 사용되는 운영자용 레이블입니다.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  새 ACP 세션을 만드는 대신 기존 ACP 세션을 재개합니다. 에이전트는
  `session/load`를 통해 대화 기록을 다시 재생합니다. `runtime: "acp"`가
  필요합니다.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"`는 초기 ACP 실행 진행 요약을 시스템 이벤트로 요청자 세션에
  다시 스트리밍합니다. 허용되는 응답에는 세션 범위 JSONL 로그를 가리키는
  `streamLogPath`가 포함되며, 전체 relay 기록을 보기 위해
  (`<sessionId>.acp-stream.jsonl`)를 tail할 수 있습니다.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  N초 후 ACP 하위 턴을 중단합니다. `0`은 턴을 Gateway의 무제한 경로에
  유지합니다. 같은 값이 Gateway 실행과 ACP 런타임에 적용되므로,
  정지되었거나 할당량이 소진된 하네스가 상위 에이전트 레인을 무기한
  점유하지 않도록 합니다.
</ParamField>
<ParamField path="model" type="string">
  ACP 하위 세션의 명시적 모델 재정의입니다. Codex ACP 생성은
  `openai-codex/gpt-5.4` 같은 OpenClaw Codex 참조를 `session/new`
  이전에 Codex ACP 시작 구성으로 정규화합니다. `openai-codex/gpt-5.4/high`
  같은 슬래시 형식은 Codex ACP 추론 강도도 설정합니다. 다른 하네스는
  ACP `models`를 제공하고 `session/set_model`을 지원해야 합니다.
  그렇지 않으면 OpenClaw/acpx는 대상 에이전트 기본값으로 조용히
  대체하는 대신 명확하게 실패합니다.
</ParamField>
<ParamField path="thinking" type="string">
  명시적 thinking/추론 강도입니다. Codex ACP에서는 `minimal`이
  낮은 강도로 매핑되고, `low`/`medium`/`high`/`xhigh`는 직접
  매핑되며, `off`는 추론 강도 시작 재정의를 생략합니다.
</ParamField>

## 생성 바인드 및 스레드 모드

<Tabs>
  <Tab title="--bind here|off">
    | 모드   | 동작                                                                      |
    | ------ | ------------------------------------------------------------------------- |
    | `here` | 현재 활성 대화를 제자리에서 바인드합니다. 활성 대화가 없으면 실패합니다.  |
    | `off`  | 현재 대화 바인딩을 만들지 않습니다.                                       |

    참고:

    - `--bind here`는 "이 채널이나 채팅을 Codex 기반으로 만들기"에 가장 간단한 운영자 경로입니다.
    - `--bind here`는 하위 스레드를 만들지 않습니다.
    - `--bind here`는 현재 대화 바인딩 지원을 제공하는 채널에서만 사용할 수 있습니다.
    - `--bind`와 `--thread`는 같은 `/acp spawn` 호출에서 함께 사용할 수 없습니다.

  </Tab>
  <Tab title="--thread auto|here|off">
    | 모드   | 동작                                                                                                |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 활성 스레드에서는 해당 스레드를 바인드합니다. 스레드 밖에서는 지원되는 경우 하위 스레드를 생성하고 바인드합니다. |
    | `here` | 현재 활성 스레드가 필요합니다. 스레드 안이 아니면 실패합니다.                                       |
    | `off`  | 바인딩하지 않습니다. 세션은 바인드되지 않은 상태로 시작됩니다.                                      |

    참고:

    - 스레드 바인딩이 없는 표면에서는 기본 동작이 사실상 `off`입니다.
    - 스레드 바인드 생성에는 채널 정책 지원이 필요합니다.
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - 하위 스레드를 만들지 않고 현재 대화를 고정하려면 `--bind here`를 사용하세요.

  </Tab>
</Tabs>

## 전달 모델

ACP 세션은 대화형 작업 공간일 수도 있고 상위 소유 백그라운드 작업일 수도
있습니다. 전달 경로는 이 형태에 따라 달라집니다.

<AccordionGroup>
  <Accordion title="대화형 ACP 세션">
    대화형 세션은 보이는 채팅 표면에서 계속 대화하도록 설계되었습니다.

    - `/acp spawn ... --bind here`는 현재 대화를 ACP 세션에 바인드합니다.
    - `/acp spawn ... --thread ...`는 채널 스레드/토픽을 ACP 세션에 바인드합니다.
    - 영구적으로 구성된 `bindings[].type="acp"`는 일치하는 대화를 같은 ACP 세션으로 라우팅합니다.

    바인드된 대화의 후속 메시지는 ACP 세션으로 직접 라우팅되고,
    ACP 출력은 같은 채널/스레드/토픽으로 다시 전달됩니다.

    OpenClaw이 하네스로 보내는 항목:

    - 일반 바인드 후속 메시지는 프롬프트 텍스트로 전송되며, 첨부 파일은 하네스/백엔드가 지원하는 경우에만 함께 전송됩니다.
    - `/acp` 관리 명령과 로컬 Gateway 명령은 ACP 디스패치 전에 가로채집니다.
    - 런타임 생성 완료 이벤트는 대상별로 구체화됩니다. OpenClaw 에이전트는 OpenClaw 내부 런타임 컨텍스트 envelope를 받고, 외부 ACP 하네스는 하위 결과와 지시가 포함된 일반 프롬프트를 받습니다. 원시 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` envelope는 외부 하네스로 전송되거나 ACP 사용자 transcript 텍스트로 저장되어서는 안 됩니다.
    - ACP transcript 항목은 사용자에게 보이는 트리거 텍스트 또는 일반 완료 프롬프트를 사용합니다. 내부 이벤트 메타데이터는 가능한 경우 OpenClaw 내부에 구조화된 상태로 유지되며, 사용자가 작성한 채팅 콘텐츠로 취급되지 않습니다.

  </Accordion>
  <Accordion title="상위 소유 일회성 ACP 세션">
    다른 에이전트 실행에 의해 생성된 일회성 ACP 세션은 sub-agent와
    비슷한 백그라운드 하위 작업입니다.

    - 상위는 `sessions_spawn({ runtime: "acp", mode: "run" })`로 작업을 요청합니다.
    - 하위는 자체 ACP 하네스 세션에서 실행됩니다.
    - 하위 턴은 기본 sub-agent 생성에 사용되는 것과 같은 백그라운드 레인에서 실행되므로, 느린 ACP 하네스가 관련 없는 메인 세션 작업을 막지 않습니다.
    - 완료는 작업 완료 공지 경로를 통해 다시 보고됩니다. OpenClaw은 내부 완료 메타데이터를 외부 하네스로 보내기 전에 일반 ACP 프롬프트로 변환하므로, 하네스는 OpenClaw 전용 런타임 컨텍스트 마커를 보지 않습니다.
    - 사용자 대상 응답이 유용한 경우 상위는 하위 결과를 일반 assistant 음성으로 다시 작성합니다.

    이 경로를 상위와 하위 간의 peer-to-peer 채팅으로 취급하지
    마세요. 하위에는 이미 상위로 돌아가는 완료 채널이 있습니다.

  </Accordion>
  <Accordion title="sessions_send 및 A2A 전달">
    `sessions_send`는 생성 후 다른 세션을 대상으로 지정할 수 있습니다.
    일반 peer 세션의 경우 OpenClaw은 메시지를 주입한 뒤
    agent-to-agent(A2A) 후속 경로를 사용합니다.

    - 대상 세션의 응답을 기다립니다.
    - 선택적으로 요청자와 대상이 제한된 수의 후속 턴을 교환하게 합니다.
    - 대상에게 공지 메시지를 생성하도록 요청합니다.
    - 해당 공지를 보이는 채널이나 스레드에 전달합니다.

    이 A2A 경로는 발신자가 보이는 후속 응답을 필요로 하는 peer 전송에 대한
    대체 수단입니다. 예를 들어 광범위한
    `tools.sessions.visibility` 설정 하에서 관련 없는 세션이 ACP 대상에
    접근하고 메시지를 보낼 수 있는 경우에도 계속 활성화됩니다.

    OpenClaw은 요청자가 자신이 소유한 상위 소유 일회성 ACP 하위의
    상위인 경우에만 A2A 후속을 건너뜁니다. 이 경우 작업 완료 위에 A2A를
    추가로 실행하면 하위 결과로 상위를 깨우고, 상위의 응답을 다시 하위로
    전달하여 상위/하위 에코 루프를 만들 수 있습니다. `sessions_send`
    결과는 이 소유 하위 사례에 대해 `delivery.status="skipped"`를
    보고하는데, 이는 완료 경로가 이미 결과를 담당하고 있기 때문입니다.

  </Accordion>
  <Accordion title="기존 세션 재개">
    새로 시작하는 대신 이전 ACP 세션을 계속하려면 `resumeSessionId`를
    사용하세요. 에이전트는 `session/load`를 통해 대화 기록을 다시
    재생하므로, 이전 맥락 전체를 유지한 채 이어서 작업합니다.

    ```json
    {
      "task": "중단한 지점부터 계속해 — 남은 테스트 실패를 수정해",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    일반적인 사용 사례:

    - Codex 세션을 노트북에서 휴대폰으로 넘기기 — 에이전트에게 중단한 지점부터 이어서 하라고 지시합니다.
    - CLI에서 대화형으로 시작한 코딩 세션을 이제 에이전트를 통해 헤드리스로 계속하기
    - Gateway 재시작이나 유휴 시간 초과로 중단된 작업 이어서 하기

    참고:

    - `resumeSessionId`는 `runtime: "acp"`가 필요합니다. sub-agent 런타임과 함께 사용하면 오류를 반환합니다.
    - `resumeSessionId`는 업스트림 ACP 대화 기록을 복원합니다. `thread`와 `mode`는 여전히 새로 생성하는 OpenClaw 세션에 정상적으로 적용되므로, `mode: "session"`에는 여전히 `thread: true`가 필요합니다.
    - 대상 에이전트는 `session/load`를 지원해야 합니다(Codex와 Claude Code는 지원함).
    - 세션 id를 찾을 수 없으면 생성은 명확한 오류와 함께 실패하며, 새 세션으로 조용히 대체되지 않습니다.

  </Accordion>
  <Accordion title="배포 후 스모크 테스트">
    Gateway 배포 후에는 단위 테스트만 믿지 말고 실제 엔드투엔드
    검사를 실행하세요.

    1. 대상 호스트에서 배포된 Gateway 버전과 커밋을 확인합니다.
    2. 라이브 에이전트에 임시 ACPX 브리지 세션을 엽니다.
    3. 해당 에이전트에게 `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, 작업 `Reply with exactly LIVE-ACP-SPAWN-OK`로 `sessions_spawn`을 호출하라고 요청합니다.
    4. `accepted=yes`, 실제 `childSessionKey`, validator 오류 없음 여부를 확인합니다.
    5. 임시 브리지 세션을 정리합니다.

    기준은 `mode: "run"`에 두고 `streamTo: "parent"`는 생략하세요.
    스레드 바인드 `mode: "session"` 및 stream-relay 경로는 별도의
    더 풍부한 통합 검증 단계입니다.

  </Accordion>
</AccordionGroup>

## 샌드박스 호환성

ACP 세션은 현재 OpenClaw 샌드박스 내부가 아니라 호스트 런타임에서
실행됩니다.

<Warning>
**보안 경계:**

- 외부 하네스는 자체 CLI 권한과 선택한 `cwd`에 따라 읽기/쓰기를 수행할 수 있습니다.
- OpenClaw의 샌드박스 정책은 ACP 하네스 실행을 감싸지 않습니다.
- OpenClaw은 여전히 ACP 기능 게이트, 허용된 에이전트, 세션 소유권, 채널 바인딩, Gateway 전달 정책을 강제합니다.
- 샌드박스가 강제되는 OpenClaw 기본 작업에는 `runtime: "subagent"`를 사용하세요.
  </Warning>

현재 제한 사항:

- 요청자 세션이 샌드박스 상태이면 `sessions_spawn({ runtime: "acp" })`와 `/acp spawn` 모두에서 ACP 생성이 차단됩니다.
- `runtime: "acp"`를 사용하는 `sessions_spawn`은 `sandbox: "require"`를 지원하지 않습니다.

## 세션 대상 확인

대부분의 `/acp` 작업은 선택적 세션 대상(`session-key`,
`session-id` 또는 `session-label`)을 받을 수 있습니다.

**확인 순서:**

1. 명시적 대상 인수(또는 `/acp steer`의 `--session`)
   - 먼저 키 시도
   - 다음으로 UUID 형태의 세션 id 시도
   - 그다음 레이블 시도
2. 현재 스레드 바인딩(이 대화/스레드가 ACP 세션에 바인드된 경우)
3. 현재 요청자 세션 대체

현재 대화 바인딩과 스레드 바인딩은 모두 2단계에 참여합니다.

어떤 대상도 확인되지 않으면 OpenClaw은 명확한 오류를 반환합니다
(`Unable to resolve session target: ...`).

## ACP 제어

| 명령                 | 수행 작업                                                  | 예시                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP 세션을 생성합니다. 현재 대화 바인드 또는 스레드 바인드는 선택 사항입니다. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 대상 세션의 진행 중인 턴을 취소합니다.                    | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 실행 중인 세션에 steer 지시를 보냅니다.                   | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 세션을 닫고 스레드 대상 바인딩을 해제합니다.              | `/acp close`                                                  |
| `/acp status`        | 백엔드, 모드, 상태, 런타임 옵션, 기능을 표시합니다.       | `/acp status`                                                 |
| `/acp set-mode`      | 대상 세션의 런타임 모드를 설정합니다.                     | `/acp set-mode plan`                                          |
| `/acp set`           | 일반 런타임 구성 옵션을 기록합니다.                       | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 런타임 작업 디렉터리 재정의를 설정합니다.                 | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 승인 정책 프로필을 설정합니다.                            | `/acp permissions strict`                                     |
| `/acp timeout`       | 런타임 타임아웃(초)을 설정합니다.                         | `/acp timeout 120`                                            |
| `/acp model`         | 런타임 모델 재정의를 설정합니다.                          | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 세션 런타임 옵션 재정의를 제거합니다.                     | `/acp reset-options`                                          |
| `/acp sessions`      | 저장소에서 최근 ACP 세션을 나열합니다.                    | `/acp sessions`                                               |
| `/acp doctor`        | 백엔드 상태, 기능, 실행 가능한 수정 방법을 표시합니다.    | `/acp doctor`                                                 |
| `/acp install`       | 결정적인 설치 및 활성화 단계를 출력합니다.                | `/acp install`                                                |

`/acp status`는 유효한 런타임 옵션과 런타임 수준 및 백엔드 수준의 세션
식별자를 함께 표시합니다. 백엔드에 기능이 없으면 지원되지 않는 제어 오류가
명확하게 표시됩니다. `/acp sessions`는 현재 바인드된 세션 또는 요청자
세션의 저장소를 읽습니다. 대상 토큰(`session-key`, `session-id` 또는
`session-label`)은 사용자 지정 에이전트별 `session.store` 루트를 포함한
Gateway 세션 검색을 통해 확인됩니다.

### 런타임 옵션 매핑

`/acp`에는 편의 명령과 일반 setter가 있습니다. 동등한 작업은 다음과
같습니다.

| 명령                         | 매핑 대상                           | 참고                                                                                                                                                                               |
| ---------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 런타임 config 키 `model`            | Codex ACP의 경우 OpenClaw은 `openai-codex/<model>`을 어댑터 모델 id로 정규화하고, `openai-codex/gpt-5.4/high` 같은 슬래시 추론 접미사를 `reasoning_effort`로 매핑합니다.       |
| `/acp set thinking <level>`  | 런타임 config 키 `thinking`         | Codex ACP의 경우 OpenClaw은 어댑터가 지원하는 위치에 해당 `reasoning_effort`를 전송합니다.                                                                                       |
| `/acp permissions <profile>` | 런타임 config 키 `approval_policy`  | —                                                                                                                                                                                  |
| `/acp timeout <seconds>`     | 런타임 config 키 `timeout`          | —                                                                                                                                                                                  |
| `/acp cwd <path>`            | 런타임 cwd 재정의                   | 직접 업데이트합니다.                                                                                                                                                               |
| `/acp set <key> <value>`     | 일반                                | `key=cwd`는 cwd 재정의 경로를 사용합니다.                                                                                                                                          |
| `/acp reset-options`         | 모든 런타임 재정의를 지움           | —                                                                                                                                                                                  |

## acpx 하네스, Plugin 설정 및 권한

acpx 하네스 구성(Claude Code / Codex / Gemini CLI 별칭), plugin-tools 및
OpenClaw-tools MCP 브리지, ACP 권한 모드에 대해서는
[ACP 에이전트 — 설정](/ko/tools/acp-agents-setup)을 참고하세요.

## 문제 해결

| 증상                                                                        | 가능한 원인                                                                    | 해결 방법                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | 백엔드 Plugin이 없거나, 비활성화되었거나, `plugins.allow`에 의해 차단되었습니다. | 백엔드 plugin을 설치하고 활성화한 뒤, 해당 허용 목록이 설정된 경우 `plugins.allow`에 `acpx`를 포함하고, `/acp doctor`를 실행하세요.                                      |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP가 전역적으로 비활성화되었습니다.                                            | `acp.enabled=true`로 설정하세요.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 일반 스레드 메시지에서의 디스패치가 비활성화되었습니다.                         | `acp.dispatch.enabled=true`로 설정하세요.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | 에이전트가 허용 목록에 없습니다.                                                | 허용된 `agentId`를 사용하거나 `acp.allowedAgents`를 업데이트하세요.                                                                                                        |
| 시작 직후 `/acp doctor`가 백엔드 준비 안 됨을 보고함                       | Plugin 의존성 검사 또는 자체 복구가 아직 실행 중입니다.                         | 잠시 기다린 뒤 `/acp doctor`를 다시 실행하세요. 계속 비정상이면 백엔드 설치 오류와 plugin 허용/거부 정책을 점검하세요.                                                   |
| 하네스 명령을 찾을 수 없음                                                  | 어댑터 CLI가 설치되지 않았거나 첫 실행 `npx` 가져오기에 실패했습니다.           | Gateway 호스트에 어댑터를 설치하거나 미리 준비하거나, acpx 에이전트 명령을 명시적으로 구성하세요.                                                                         |
| 하네스에서 model-not-found 발생                                             | 모델 id가 다른 provider/하네스에는 유효하지만 이 ACP 대상에는 유효하지 않습니다. | 해당 하네스가 나열한 모델을 사용하거나, 하네스에서 모델을 구성하거나, 재정의를 생략하세요.                                                                                |
| 하네스에서 벤더 인증 오류 발생                                              | OpenClaw은 정상이나 대상 CLI/provider가 로그인되지 않았습니다.                  | Gateway 호스트 환경에서 로그인하거나 필요한 provider 키를 제공하세요.                                                                                                      |
| `Unable to resolve session target: ...`                                     | 잘못된 키/id/레이블 토큰입니다.                                                 | `/acp sessions`를 실행하고 정확한 키/레이블을 복사한 뒤 다시 시도하세요.                                                                                                   |
| `--bind here requires running /acp spawn inside an active ... conversation` | 활성화된 바인드 가능 대화 없이 `--bind here`를 사용했습니다.                    | 대상 채팅/채널로 이동해 다시 시도하거나, 바인드 없는 생성을 사용하세요.                                                                                                    |
| `Conversation bindings are unavailable for <channel>.`                      | 어댑터에 현재 대화 ACP 바인딩 기능이 없습니다.                                  | 지원되는 경우 `/acp spawn ... --thread ...`를 사용하거나, 최상위 `bindings[]`를 구성하거나, 지원되는 채널로 이동하세요.                                                   |
| `--thread here requires running /acp spawn inside an active ... thread`     | 스레드 컨텍스트 밖에서 `--thread here`를 사용했습니다.                          | 대상 스레드로 이동하거나 `--thread auto`/`off`를 사용하세요.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 다른 사용자가 활성 바인딩 대상을 소유하고 있습니다.                             | 소유자로 다시 바인드하거나 다른 대화 또는 스레드를 사용하세요.                                                                                                             |
| `Thread bindings are unavailable for <channel>.`                            | 어댑터에 스레드 바인딩 기능이 없습니다.                                         | `--thread off`를 사용하거나 지원되는 어댑터/채널로 이동하세요.                                                                                                             |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP 런타임은 호스트 측에서 실행되며 요청자 세션은 샌드박스 상태입니다.          | 샌드박스 세션에서는 `runtime="subagent"`를 사용하거나, 샌드박스가 아닌 세션에서 ACP 생성을 실행하세요.                                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP 런타임에 대해 `sandbox="require"`가 요청되었습니다.                         | 샌드박스가 필수라면 `runtime="subagent"`를 사용하거나, 샌드박스가 아닌 세션에서 `sandbox="inherit"`와 함께 ACP를 사용하세요.                                              |
| `Cannot apply --model ... did not advertise model support`                  | 대상 하네스가 일반 ACP 모델 전환을 노출하지 않습니다.                           | ACP `models`/`session/set_model`을 제공하는 하네스를 사용하거나, Codex ACP 모델 참조를 사용하거나, 자체 시작 플래그가 있다면 하네스에서 직접 모델을 구성하세요.           |
| 바인드된 세션에 ACP 메타데이터가 없음                                       | 오래되었거나 삭제된 ACP 세션 메타데이터입니다.                                  | `/acp spawn`으로 다시 생성한 뒤 스레드를 다시 바인드/포커스하세요.                                                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`가 비대화형 ACP 세션에서 쓰기/실행을 차단합니다.                | `plugins.entries.acpx.config.permissionMode`를 `approve-all`로 설정하고 gateway를 재시작하세요. [권한 구성](/ko/tools/acp-agents-setup#permission-configuration)을 참고하세요. |
| ACP 세션이 출력이 거의 없이 초기에 실패함                                   | 권한 프롬프트가 `permissionMode`/`nonInteractivePermissions`에 의해 차단됩니다. | `AcpRuntimeError`가 있는지 gateway 로그를 확인하세요. 전체 권한이 필요하면 `permissionMode=approve-all`로, 점진적 제한이 필요하면 `nonInteractivePermissions=deny`로 설정하세요. |
| 작업 완료 후 ACP 세션이 무기한 멈춤                                         | 하네스 프로세스는 종료되었지만 ACP 세션이 완료를 보고하지 않았습니다.           | `ps aux \| grep acpx`로 모니터링하고, 오래된 프로세스를 수동으로 종료하세요.                                                                                                |
| 하네스에 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`가 보임                     | 내부 이벤트 envelope가 ACP 경계를 넘어 유출되었습니다.                          | OpenClaw을 업데이트하고 완료 흐름을 다시 실행하세요. 외부 하네스는 일반 완료 프롬프트만 받아야 합니다.                                                                     |

## 관련 항목

- [ACP 에이전트 — 설정](/ko/tools/acp-agents-setup)
- [에이전트 전송](/ko/tools/agent-send)
- [CLI 백엔드](/ko/gateway/cli-backends)
- [Codex harness](/ko/plugins/codex-harness)
- [멀티 에이전트 샌드박스 도구](/ko/tools/multi-agent-sandbox-tools)
- [`openclaw acp`(브리지 모드)](/ko/cli/acp)
- [Sub-agents](/ko/tools/subagents)
