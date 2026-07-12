---
read_when:
    - ACP를 통해 코딩 하네스 실행하기
    - 메시징 채널에서 대화에 연결된 ACP 세션 설정하기
    - 메시지 채널 대화를 영구 ACP 세션에 바인딩하기
    - ACP 백엔드, Plugin 연결 또는 완료 전달 문제 해결
    - 채팅에서 /acp 명령 사용하기
sidebarTitle: ACP agents
summary: ACP 백엔드를 통해 외부 코딩 하네스(Claude Code, Cursor, Gemini CLI, 명시적 Codex ACP, OpenClaw ACP, OpenCode)를 실행합니다
title: ACP 에이전트
x-i18n:
    generated_at: "2026-07-12T15:47:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 세션을 사용하면
OpenClaw가 ACP 백엔드 Plugin을 통해 외부 코딩 하네스(Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI 및 기타 지원되는 ACPX 하네스)를
실행할 수 있습니다. 각 생성 작업은
[백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

<Note>
**ACP는 외부 하네스 경로이며 기본 Codex 경로가 아닙니다.** 네이티브
Codex 앱 서버 Plugin은 `/codex ...` 제어와 에이전트 턴의 기본
`openai/gpt-*` 임베디드 런타임을 담당하고, ACP는 `/acp ...` 제어와
`sessions_spawn({ runtime: "acp" })` 세션을 담당합니다.

Codex 또는 Claude Code가 외부 MCP 클라이언트로서 기존 OpenClaw 채널 대화에
직접 연결되도록 하려면 ACP 대신
[`openclaw mcp serve`](/ko/cli/mcp)를 사용하십시오.
</Note>

## 어떤 페이지를 사용해야 하나요?

| 원하는 작업                                                                                     | 사용할 항목                           | 참고                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 현재 대화에서 Codex를 바인딩하거나 제어하기                                                     | `/codex bind`, `/codex threads`       | `codex` Plugin이 활성화된 경우의 네이티브 Codex 앱 서버 경로: 바인딩된 채팅 응답, 이미지 전달, 모델/고속/권한, 중지 및 조정. ACP는 명시적 대체 경로입니다 |
| OpenClaw를 _통해_ Claude Code, Gemini CLI, 명시적 Codex ACP 또는 다른 외부 하네스 실행하기       | 이 페이지                             | 채팅에 바인딩된 세션, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, 백그라운드 작업, 런타임 제어                                                                        |
| 편집기 또는 클라이언트에 OpenClaw Gateway 세션을 ACP 서버로 노출하기                            | [`openclaw acp`](/ko/cli/acp)            | 브리지 모드: IDE/클라이언트가 stdio/WebSocket을 통해 OpenClaw와 ACP로 통신합니다                                                                                             |
| 로컬 AI CLI를 텍스트 전용 대체 모델로 재사용하기                                               | [CLI 백엔드](/ko/gateway/cli-backends)   | ACP가 아닙니다. OpenClaw 도구, ACP 제어, 하네스 런타임이 없습니다                                                                                                           |

## 별도 설정 없이 바로 작동하나요?

공식 ACP 런타임 Plugin을 설치하면 작동합니다.

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

소스 체크아웃에서는 `pnpm install` 후 로컬 `extensions/acpx` 워크스페이스 Plugin을
사용할 수 있습니다. 준비 상태를 확인하려면 `/acp doctor`를 실행하십시오.

OpenClaw는 ACP를 **실제로 사용할 수 있을 때만** 에이전트에게 ACP 생성 방법을
안내합니다. ACP가 활성화되어 있어야 하고, 디스패치가 비활성화되지 않아야 하며,
현재 세션이 샌드박스에 의해 차단되지 않아야 하고, 런타임 백엔드가 로드되어
정상 상태여야 합니다. 조건 중 하나라도 충족되지 않으면 ACP Skills와
`sessions_spawn` ACP 안내가 숨겨진 상태로 유지되어 에이전트가 사용할 수 없는
백엔드를 제안하지 않습니다.

<AccordionGroup>
  <Accordion title="최초 실행 시 주의 사항">
    - `plugins.allow`가 설정되어 있으면 제한적인 Plugin 목록으로 작동하며 **반드시** `acpx`를 포함해야 합니다. 그렇지 않으면 설치된 ACP 백엔드가 의도적으로 차단됩니다(`/acp doctor`가 누락된 허용 목록 항목을 보고합니다).
    - Codex ACP 어댑터는 `acpx` Plugin과 함께 제공되며 가능하면 로컬에서 실행됩니다.
    - Codex ACP는 격리된 `CODEX_HOME`으로 실행됩니다. OpenClaw는 신뢰할 수 있는 프로젝트 신뢰 항목과 안전한 모델/제공자 라우팅 구성(`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` 및 안전한 `model_providers.<name>` 필드)을 호스트 Codex 구성에서 복사합니다. 인증, 알림 및 훅은 호스트 구성에만 유지됩니다.
    - 다른 대상 하네스 어댑터는 처음 사용할 때 필요에 따라 `npx`로 가져올 수 있습니다.
    - 해당 하네스의 공급업체 인증이 호스트에 이미 존재해야 합니다.
    - 호스트에서 npm 또는 네트워크에 접근할 수 없으면 캐시를 미리 준비하거나 다른 방식으로 어댑터를 설치할 때까지 최초 실행 시 어댑터 가져오기가 실패합니다.

  </Accordion>
  <Accordion title="런타임 전제 조건">
    ACP는 실제 외부 하네스 프로세스를 실행합니다. OpenClaw는 라우팅,
    백그라운드 작업 상태, 전달, 바인딩 및 정책을 담당하고, 하네스는
    자체 제공자 로그인, 모델 카탈로그, 파일 시스템 동작 및 네이티브 도구를 담당합니다.

    OpenClaw의 문제로 판단하기 전에 다음을 확인하십시오.

    - `/acp doctor`가 활성화된 정상 상태의 백엔드를 보고합니다.
    - 허용 목록이 설정된 경우 대상 ID가 `acp.allowedAgents`에서 허용됩니다.
    - 하네스 명령이 Gateway 호스트에서 시작될 수 있습니다.
    - 해당 하네스에 제공자 인증이 존재합니다(`claude`, `codex`, `gemini`, `opencode`, `droid` 등).
    - 선택한 모델이 해당 하네스에 존재합니다. 모델 ID는 하네스 간에 호환되지 않습니다.
    - 요청한 `cwd`가 존재하고 접근 가능하거나, `cwd`를 생략하여 백엔드가 기본값을 사용하도록 합니다.
    - 권한 모드가 작업에 적합합니다. 비대화형 세션에서는 네이티브 권한 프롬프트를 클릭할 수 없으므로 쓰기/실행이 많은 코딩 실행에는 일반적으로 헤드리스 방식으로 진행할 수 있는 ACPX 권한 프로필이 필요합니다.

  </Accordion>
</AccordionGroup>

OpenClaw Plugin 도구와 OpenClaw 기본 제공 도구는 기본적으로 ACP
하네스에 노출되지 **않습니다**. 하네스가 해당 도구를 직접 호출해야 하는 경우에만
[ACP 에이전트 - 설정](/ko/tools/acp-agents-setup)에서 명시적 MCP 브리지를
활성화하십시오.

## 지원되는 하네스 대상

`acpx` 백엔드에서는 다음 ID를 `/acp spawn <id>` 또는
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` 대상으로 사용하십시오.

| 하네스 ID    | 일반적인 백엔드                                 | 참고                                                                                |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`     | Claude Code ACP 어댑터                         | 호스트에 Claude Code 인증이 필요합니다.                                             |
| `codex`      | Codex ACP 어댑터                               | 네이티브 `/codex`를 사용할 수 없거나 ACP를 요청한 경우에만 사용하는 명시적 ACP 대체 경로입니다. |
| `copilot`    | GitHub Copilot ACP 어댑터                      | Copilot CLI/런타임 인증이 필요합니다.                                               |
| `cursor`     | Cursor CLI ACP (`cursor-agent acp`)            | 로컬 설치에서 다른 ACP 진입점을 제공하는 경우 acpx 명령을 재정의하십시오.           |
| `droid`      | Factory Droid CLI                              | 하네스 환경에 Factory/Droid 인증 또는 `FACTORY_API_KEY`가 필요합니다.               |
| `fast-agent` | fast-agent-mcp ACP 어댑터                      | 필요할 때 `uvx`로 가져옵니다.                                                       |
| `gemini`     | Gemini CLI ACP 어댑터                          | Gemini CLI 인증 또는 API 키 설정이 필요합니다.                                      |
| `iflow`      | iFlow CLI                                      | 어댑터 가용성과 모델 제어는 설치된 CLI에 따라 달라집니다.                           |
| `kilocode`   | Kilo Code CLI                                  | 어댑터 가용성과 모델 제어는 설치된 CLI에 따라 달라집니다.                           |
| `kimi`       | Kimi/Moonshot CLI                              | 호스트에 Kimi/Moonshot 인증이 필요합니다.                                           |
| `kiro`       | Kiro CLI                                       | 어댑터 가용성과 모델 제어는 설치된 CLI에 따라 달라집니다.                           |
| `mux`        | Mux CLI ACP 어댑터                             | 필요할 때 `npx`로 가져옵니다.                                                       |
| `opencode`   | OpenCode ACP 어댑터                            | OpenCode CLI/제공자 인증이 필요합니다.                                              |
| `openclaw`   | `openclaw acp`를 통한 OpenClaw Gateway 브리지 | ACP 지원 하네스가 OpenClaw Gateway 세션과 다시 통신할 수 있게 합니다.               |
| `qoder`      | Qoder CLI                                      | 어댑터 가용성과 모델 제어는 설치된 CLI에 따라 달라집니다.                           |
| `qwen`       | Qwen Code / Qwen CLI                           | 호스트에 Qwen 호환 인증이 필요합니다.                                               |
| `trae`       | Trae CLI ACP 어댑터                            | 어댑터 가용성과 모델 제어는 설치된 CLI에 따라 달라집니다.                           |

`pi`(pi-acp)도 acpx 백엔드에 등록되어 있지만 위의 다른 항목과 같은 의미의
코딩 하네스는 아닙니다.

사용자 지정 acpx 에이전트 별칭은 acpx 자체에서 구성할 수 있지만, OpenClaw
정책은 디스패치 전에 여전히 `acp.allowedAgents`와
`agents.list[].runtime.acp.agent` 매핑을 확인합니다.

## 운영자 실행 절차

채팅에서 빠르게 사용하는 `/acp` 흐름:

<Steps>
  <Step title="생성">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` 또는 명시적
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="작업">
    바인딩된 대화 또는 스레드에서 계속 진행하거나 세션 키를
    명시적으로 대상으로 지정합니다.
  </Step>
  <Step title="상태 확인">
    `/acp status`
  </Step>
  <Step title="조정">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="방향 조정">
    컨텍스트를 교체하지 않고 실행합니다: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="중지">
    `/acp cancel`(현재 턴) 또는 `/acp close`(세션 + 바인딩).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="수명 주기 세부 정보">
    - 생성은 ACP 런타임 세션을 만들거나 재개하고, OpenClaw 세션 저장소에 ACP 메타데이터를 기록하며, 실행이 상위 작업 소유인 경우 백그라운드 작업을 만들 수 있습니다.
    - 상위 작업 소유 ACP 세션은 런타임 세션이 영구적이어도 백그라운드 작업으로 처리됩니다. 완료와 여러 표면 간 전달은 일반적인 사용자 대상 채팅 세션처럼 동작하는 대신 상위 작업 알림자를 통해 수행됩니다.
    - 작업 유지 관리는 종료되었거나 고립된 상위 작업 소유 일회성 ACP 세션을 닫습니다. 활성 대화 바인딩이 유지되는 동안 영구 ACP 세션은 보존됩니다. 활성 바인딩이 없는 오래된 영구 세션은 닫히므로 소유 작업이 완료되었거나 해당 작업 레코드가 사라진 후 자동으로 재개될 수 없습니다.
    - 바인딩된 후속 메시지는 바인딩이 닫히거나, 포커스가 해제되거나, 재설정되거나, 만료될 때까지 ACP 세션으로 직접 전달됩니다.
    - Gateway 명령은 로컬에서 유지됩니다. `/acp ...`, `/status`, `/unfocus`는 바인딩된 ACP 하네스에 일반 프롬프트 텍스트로 전송되지 않습니다.
    - `cancel`은 백엔드가 취소를 지원하는 경우 활성 턴을 중단합니다. 바인딩 또는 세션 메타데이터를 삭제하지는 않습니다.
    - `close`는 OpenClaw 관점에서 ACP 세션을 종료하고 바인딩을 제거합니다. 하네스가 재개를 지원하는 경우 자체 업스트림 기록을 계속 유지할 수 있습니다.
    - acpx Plugin은 `close` 후 OpenClaw 소유 래퍼 및 어댑터 프로세스 트리를 정리하고, Gateway 시작 중 오래된 OpenClaw 소유 ACPX 고립 프로세스를 수거합니다.
    - 유휴 런타임 워커는 `acp.runtime.ttlMinutes` 후 정리 대상이 됩니다. 저장된 세션 메타데이터는 `/acp sessions`에서 계속 사용할 수 있습니다.

  </Accordion>
  <Accordion title="네이티브 Codex 라우팅 규칙">
    활성화된 경우 **네이티브 Codex Plugin**으로 라우팅해야 하는
    자연어 트리거:

    - "이 Discord 채널을 Codex에 바인딩합니다."
    - "이 채팅을 Codex 스레드 `<id>`에 연결합니다."
    - "Codex 스레드를 표시한 다음 이 스레드를 바인딩합니다."

    네이티브 Codex 대화 바인딩은 기본 채팅 제어 경로입니다.
    OpenClaw 동적 도구는 계속 OpenClaw를 통해 실행되지만, 셸/apply-patch와
    같은 Codex 네이티브 도구는 Codex 내부에서 실행됩니다. Codex 네이티브
    도구 이벤트의 경우 OpenClaw는 턴별 네이티브 훅 릴레이를 삽입하여 Plugin 훅이
    `before_tool_call`을 차단하고, `after_tool_call`을 관찰하며, Codex
    `PermissionRequest` 이벤트를 OpenClaw 승인으로 라우팅할 수 있게 합니다. Codex `Stop` 훅은
    OpenClaw `before_agent_finalize`로 릴레이되며, 여기서 Plugin은 Codex가
    답변을 완료하기 전에 모델 패스를 한 번 더 요청할 수 있습니다. 릴레이는
    의도적으로 보수적으로 유지됩니다. Codex 네이티브 도구 인수를 변경하거나
    Codex 스레드 레코드를 다시 작성하지 않습니다. ACP 런타임/세션 모델을
    원하는 경우에만 명시적 ACP를 사용하십시오. 임베디드 Codex 지원 경계는
    [Codex 하네스 v1 지원 계약](/ko/plugins/codex-harness-runtime#v1-support-contract)에
    문서화되어 있습니다.

  </Accordion>
  <Accordion title="모델 / 제공자 / 런타임 선택 요약표">
    - 레거시 Codex 모델 참조 - doctor가 복구하는 레거시 Codex OAuth/구독 모델 경로입니다.
    - `openai/*` - OpenAI 에이전트 턴을 위한 네이티브 Codex app-server 임베디드 런타임입니다.
    - `/codex ...` - 네이티브 Codex 대화 제어입니다.
    - `/acp ...` 또는 `runtime: "acp"` - 명시적 ACP/acpx 제어입니다.

  </Accordion>
  <Accordion title="ACP 라우팅 자연어 트리거">
    ACP 런타임으로 라우팅해야 하는 트리거:

    - "이를 일회성 Claude Code ACP 세션으로 실행하고 결과를 요약하십시오."
    - "이 작업에 Gemini CLI를 스레드에서 사용한 다음, 후속 작업을 동일한 스레드에서 계속하십시오."
    - "백그라운드 스레드에서 ACP를 통해 Codex를 실행하십시오."

    OpenClaw는 `runtime: "acp"`를 선택하고, 하네스 `agentId`를 확인하며,
    지원되는 경우 현재 대화 또는 스레드에 바인딩하고, 닫히거나 만료될 때까지
    후속 메시지를 해당 세션으로 라우팅합니다. Codex는 ACP/acpx가 명시되었거나
    요청된 작업에 네이티브 Codex Plugin을 사용할 수 없는 경우에만
    이 경로를 따릅니다.

    `sessions_spawn`의 경우 ACP가 활성화되어 있고, 요청자가 샌드박스에 있지 않으며,
    ACP 런타임 백엔드가 로드된 경우에만 `runtime: "acp"`가 제공됩니다.
    `acp.dispatch.enabled=false`는 자동 ACP 스레드 디스패치를 일시 중지하지만
    명시적 `sessions_spawn({ runtime: "acp" })` 호출을 숨기거나 차단하지는 않습니다.
    이는 `codex`, `claude`, `droid`, `gemini`, `opencode`와 같은 ACP 하네스 ID를
    대상으로 합니다. 해당 항목에 `agents.list[].runtime.type="acp"`가 명시적으로
    구성되어 있지 않다면 `agents_list`의 일반 OpenClaw 구성 에이전트 ID를
    전달하지 마십시오. 그렇지 않으면 기본 하위 에이전트 런타임을 사용하십시오.
    OpenClaw 에이전트에 `runtime.type="acp"`가 구성되어 있으면 OpenClaw는
    `runtime.acp.agent`를 기반 하네스 ID로 사용합니다.

  </Accordion>
</AccordionGroup>

## ACP와 하위 에이전트 비교

외부 하네스 런타임을 원할 때는 ACP를 사용하십시오. `codex` Plugin이
활성화된 경우 Codex 대화 바인딩/제어에는 **네이티브 Codex
app-server**를 사용하십시오. OpenClaw 네이티브 위임 실행을 원할 때는
**하위 에이전트**를 사용하십시오.

| 영역          | ACP 세션                              | 하위 에이전트 실행                 |
| ------------- | ------------------------------------- | ---------------------------------- |
| 런타임        | ACP 백엔드 Plugin(예: acpx)           | OpenClaw 네이티브 하위 에이전트 런타임 |
| 세션 키       | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 주요 명령     | `/acp ...`                            | `/subagents ...`                   |
| 생성 도구     | `runtime:"acp"`를 사용하는 `sessions_spawn` | `sessions_spawn`(기본 런타임) |

[하위 에이전트](/ko/tools/subagents)도 참조하십시오.

## ACP에서 Claude Code를 실행하는 방식

ACP를 통해 Claude Code를 사용할 때 스택은 다음과 같습니다.

1. OpenClaw ACP 세션 제어 플레인입니다.
2. 공식 `@openclaw/acpx` 런타임 Plugin입니다.
3. Claude ACP 어댑터입니다.
4. Claude 측 런타임/세션 메커니즘입니다.

ACP Claude는 ACP 제어, 세션 재개, 백그라운드 작업 추적 및 선택적
대화/스레드 바인딩을 지원하는 **하네스 세션**입니다.

CLI 백엔드는 별도의 텍스트 전용 로컬 폴백 런타임입니다.
[CLI 백엔드](/ko/gateway/cli-backends)를 참조하십시오.

운영자의 실용적인 원칙은 다음과 같습니다.

- **`/acp spawn`, 바인딩 가능한 세션, 런타임 제어 또는 지속적인 하네스 작업이 필요합니까?** ACP를 사용하십시오.
- **원시 CLI를 통한 간단한 로컬 텍스트 폴백이 필요합니까?** CLI 백엔드를 사용하십시오.

## 바인딩된 세션

### 개념 모델

- **채팅 표면** - 사람들이 계속 대화하는 곳입니다(Discord 채널, Telegram 토픽, iMessage 채팅).
- **ACP 세션** - OpenClaw가 라우팅하는 지속성 있는 Codex/Claude/Gemini 런타임 상태입니다.
- **하위 스레드/토픽** - `--thread ...`에서만 생성되는 선택적 추가 메시징 표면입니다.
- **런타임 작업 공간** - 하네스가 실행되는 파일 시스템 위치(`cwd`, 저장소 체크아웃, 백엔드 작업 공간)입니다. 채팅 표면과는 독립적입니다.

### 현재 대화 바인딩

`/acp spawn <harness> --bind here`는 현재 대화를 생성된 ACP 세션에
고정합니다. 하위 스레드 없이 동일한 채팅 표면을 사용합니다. OpenClaw는
전송, 인증, 안전 및 전달을 계속 담당합니다. 해당 대화의 후속 메시지는
동일한 세션으로 라우팅됩니다. `/new`와 `/reset`은 해당 세션을 제자리에서
재설정하며, `/acp close`는 바인딩을 제거합니다.

예:

```text
/codex bind                                              # 네이티브 Codex 바인딩, 이후 메시지를 여기로 라우팅
/codex model gpt-5.4                                     # 바인딩된 네이티브 Codex 스레드 조정
/codex stop                                              # 활성 네이티브 Codex 턴 제어
/acp spawn codex --bind here                             # Codex용 명시적 ACP 폴백
/acp spawn codex --thread auto                           # 하위 스레드/토픽을 생성하고 그곳에 바인딩할 수 있음
/acp spawn codex --bind here --cwd /workspace/repo       # 동일한 채팅 바인딩, Codex는 /workspace/repo에서 실행
```

<AccordionGroup>
  <Accordion title="바인딩 규칙 및 상호 배타성">
    - `--bind here`와 `--thread ...`는 상호 배타적입니다.
    - `--bind here`는 현재 대화 바인딩을 제공하는 채널에서만 작동합니다. 그렇지 않으면 OpenClaw가 지원되지 않음을 명확히 알리는 메시지를 반환합니다. 바인딩은 Gateway 재시작 후에도 유지됩니다.
    - Discord에서는 `spawnSessions`가 `--thread auto|here`의 하위 스레드 생성을 제어하며, `--bind here`는 제어하지 않습니다.
    - `--cwd` 없이 다른 ACP 에이전트로 생성하면 OpenClaw는 기본적으로 **대상 에이전트의** 작업 공간을 상속합니다. 상속된 경로가 없으면(`ENOENT`/`ENOTDIR`) 백엔드 기본값으로 폴백합니다. 다른 접근 오류(예: `EACCES`)는 생성 오류로 표시됩니다.
    - Gateway 관리 명령은 바인딩된 대화에서도 로컬에 유지됩니다. 일반 후속 텍스트가 바인딩된 ACP 세션으로 라우팅되더라도 `/acp ...` 명령은 OpenClaw가 처리합니다. 해당 표면에서 명령 처리가 활성화되어 있으면 `/status`와 `/unfocus`도 항상 로컬에 유지됩니다.

  </Accordion>
  <Accordion title="스레드 바인딩 세션">
    채널 어댑터에서 스레드 바인딩이 활성화된 경우:

    - OpenClaw는 스레드를 대상 ACP 세션에 바인딩합니다.
    - 해당 스레드의 후속 메시지는 바인딩된 ACP 세션으로 라우팅됩니다.
    - ACP 출력은 동일한 스레드로 다시 전달됩니다.
    - 포커스 해제/닫기/보관/유휴 시간 초과 또는 최대 수명 만료 시 바인딩이 제거됩니다.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, `/unfocus`는 ACP 하네스에 대한 프롬프트가 아니라 Gateway 명령입니다.

    스레드 바인딩 ACP에 필요한 기능 플래그:

    - `acp.enabled=true`
    - `acp.dispatch.enabled`는 기본적으로 켜져 있습니다(자동 ACP 스레드 디스패치를 일시 중지하려면 `false`로 설정하십시오. 명시적 `sessions_spawn({ runtime: "acp" })` 호출은 계속 작동합니다).
    - 채널 어댑터의 스레드 세션 생성이 활성화되어 있어야 합니다(기본값: `true`).
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    스레드 바인딩 지원은 어댑터별로 다릅니다. 활성 채널 어댑터가
    스레드 바인딩을 지원하지 않으면 OpenClaw가 지원되지 않거나 사용할 수
    없음을 명확히 알리는 메시지를 반환합니다.

  </Accordion>
  <Accordion title="스레드를 지원하는 채널">
    - 세션/스레드 바인딩 기능을 노출하는 모든 채널 어댑터입니다.
    - 현재 기본 제공 지원: **Discord** 스레드/채널, **Telegram** 토픽(그룹/슈퍼그룹의 포럼 토픽 및 DM 토픽).
    - Plugin 채널은 동일한 바인딩 인터페이스를 통해 지원을 추가할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 지속성 채널 바인딩

비일회성 워크플로의 경우 최상위 `bindings[]` 항목에 지속성 ACP
바인딩을 구성하십시오.

### 바인딩 모델

<ParamField path="bindings[].type" type='"acp"'>
  지속성 ACP 대화 바인딩임을 나타냅니다.
</ParamField>
<ParamField path="bindings[].match" type="object">
  대상 대화를 식별합니다. 채널별 형식:

- **Discord 채널/스레드:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack 채널/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. 안정적인 Slack ID를 사용하는 것이 좋습니다. 채널 바인딩은 해당 채널의 스레드 내 답글에도 일치합니다.
- **Telegram 포럼 토픽:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/그룹:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. 직접 채팅에는 `+15555550123`과 같은 E.164 번호를 사용하고, 그룹에는 `120363424282127706@g.us`와 같은 WhatsApp 그룹 JID를 사용하십시오.
- **iMessage DM/그룹:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. 안정적인 그룹 바인딩에는 `chat_id:*`를 사용하는 것이 좋습니다.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  소유 OpenClaw 에이전트 ID입니다.
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

에이전트별 ACP 기본값을 한 번 정의하려면 `agents.list[].runtime`을 사용하십시오.

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

- OpenClaw는 채널별 허용 절차가 끝난 후 사용하기 전에 구성된 ACP 세션이 존재하도록 보장합니다.
- 해당 채널, 토픽 또는 채팅의 메시지는 구성된 ACP 세션으로 라우팅됩니다.
- 구성된 ACP 바인딩은 자체 세션 경로를 소유합니다. 채널 브로드캐스트 팬아웃은 일치하는 바인딩에 구성된 ACP 세션을 대체하지 않습니다.
- 바인딩된 대화에서 `/new`와 `/reset`은 동일한 ACP 세션 키를 그 자리에서 재설정합니다.
- 임시 런타임 바인딩(예: 스레드 포커스 흐름에서 생성된 바인딩)이 있으면 계속 적용됩니다.
- 명시적 `cwd` 없이 에이전트 간 ACP 생성을 수행하면 OpenClaw는 에이전트 구성에서 대상 에이전트 워크스페이스를 상속합니다.
- 상속된 워크스페이스 경로가 없으면 백엔드 기본 cwd를 사용하며, 경로는 존재하지만 접근에 실패하면 생성 오류로 표시됩니다.

## ACP 세션 시작

ACP 세션을 시작하는 방법은 두 가지입니다.

<Tabs>
  <Tab title="sessions_spawn에서 시작">
    에이전트 턴 또는 도구 호출에서 ACP 세션을 시작하려면
    `runtime: "acp"`를 사용하십시오.

    ```json
    {
      "task": "저장소를 열고 실패한 테스트를 요약하세요",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime`의 기본값은 `subagent`이므로 ACP 세션에는
    `runtime: "acp"`를 명시적으로 설정하십시오. `agentId`를 생략하면 구성된 경우
    OpenClaw가 `acp.defaultAgent`를 사용합니다. 지속적으로 바인딩된 대화를
    유지하려면 `mode: "session"`에 `thread: true`가 필요합니다.
    </Note>

  </Tab>
  <Tab title="/acp 명령에서 시작">
    채팅에서 운영자가 명시적으로 제어하려면 `/acp spawn`을 사용하십시오.

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

    [슬래시 명령](/ko/tools/slash-commands)을 참조하십시오.

  </Tab>
</Tabs>

### `sessions_spawn` 매개변수

<ParamField path="task" type="string" required>
  ACP 세션으로 전송되는 초기 프롬프트입니다.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP 세션에서는 반드시 `"acp"`여야 합니다.
</ParamField>
<ParamField path="agentId" type="string">
  ACP 대상 하네스 ID입니다. 설정된 경우 `acp.defaultAgent`를 대체 값으로 사용합니다.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  지원되는 경우 스레드 바인딩 흐름을 요청합니다.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"`은 일회성이며, `"session"`은 지속적입니다. `thread: true`이고
  `mode`를 생략하면 OpenClaw는 런타임 경로에 따라 지속 동작을
  기본값으로 사용할 수 있습니다. `mode: "session"`에는 `thread: true`가 필요합니다.
</ParamField>
<ParamField path="cwd" type="string">
  요청된 런타임 작업 디렉터리입니다(백엔드/런타임 정책으로 검증됨).
  생략하면 ACP 생성은 구성된 경우 대상 에이전트 워크스페이스를 상속합니다.
  상속된 경로가 없으면 백엔드 기본값을 사용하고, 실제 접근
  오류는 반환됩니다.
</ParamField>
<ParamField path="label" type="string">
  세션/배너 텍스트에 사용되는 운영자용 레이블입니다.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  새 ACP 세션을 생성하는 대신 기존 ACP 세션을 재개합니다. 에이전트는
  `session/load`를 통해 대화 기록을 재생합니다.
  `runtime: "acp"`가 필요합니다.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"`는 초기 ACP 실행 진행 상황 요약을 시스템 이벤트로 요청자
  세션에 스트리밍합니다. 허용되는 응답에는 전체 릴레이 기록을
  추적할 수 있는 세션 범위 JSONL 로그(`<sessionId>.acp-stream.jsonl`)를 가리키는
  `streamLogPath`가 포함됩니다. 기본적으로 상위 진행 상황 스트림에는
  `streaming.progress.commentary=false`가 아닌 한 어시스턴트 해설과
  ACP 상태 진행 상황이 표시됩니다. 스트림 모드가 구성되지 않은 경우 Discord도
  기본적으로 상위 미리보기에 진행 상황 모드를 사용합니다. 상태
  진행 상황에는 계속 `acp.stream.tagVisibility`가 적용되므로 `plan` 같은 태그는
  명시적으로 활성화하지 않는 한 숨겨진 상태로 유지됩니다.
</ParamField>

ACP `sessions_spawn` 실행은 기본 하위 턴 제한으로
`agents.defaults.subagents.runTimeoutSeconds`를 사용합니다. 이 도구는 호출별
시간 제한 재정의를 허용하지 않습니다(`runTimeoutSeconds`/`timeoutSeconds`는
기본값을 구성하라는 오류와 함께 거부됩니다).

<ParamField path="model" type="string">
  ACP 하위 세션에 대한 명시적 모델 재정의입니다. Codex ACP 생성은
  `openai/gpt-5.4` 같은 OpenAI 참조를 `session/new` 전에 Codex ACP 시작 구성으로
  정규화하며, `openai/gpt-5.4/high` 같은 슬래시 형식은 Codex ACP 추론 강도도
  설정합니다. 생략하면 `sessions_spawn({ runtime: "acp" })`은 구성된 경우
  기존 하위 에이전트 모델 기본값(`agents.defaults.subagents.model` 또는
  `agents.list[].subagents.model`)을 사용하고, 그렇지 않으면 ACP
  하네스가 자체 기본 모델을 사용하도록 합니다. 다른 하네스는 ACP
  `models`를 알리고 `session/set_model`을 지원해야 합니다. 그렇지 않으면 OpenClaw/acpx는
  대상 에이전트 기본값으로 조용히 대체하지 않고 명확하게 실패합니다.
</ParamField>
<ParamField path="thinking" type="string">
  명시적인 사고/추론 강도입니다. Codex ACP에서 `minimal`은 낮은
  강도로 매핑되고, `low`/`medium`/`high`/`xhigh`는 직접 매핑되며, `off`는
  시작 시 추론 강도 재정의를 생략합니다. 생략하면 ACP 생성은 선택한
  모델에 대해 기존 하위 에이전트 사고 기본값과 모델별
  `agents.defaults.models["provider/model"].params.thinking`을 사용합니다.
</ParamField>

## 생성 바인딩 및 스레드 모드

<Tabs>
  <Tab title="--bind here|off">
    | 모드   | 동작                                                                    |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | 현재 활성 대화를 그 자리에서 바인딩하며, 활성 대화가 없으면 실패합니다. |
    | `off`  | 현재 대화 바인딩을 생성하지 않습니다.                                   |

    참고:

    - `--bind here`는 "이 채널 또는 채팅이 Codex를 사용하도록 설정"하는 가장 간단한 운영자 경로입니다.
    - `--bind here`는 하위 스레드를 생성하지 않습니다.
    - `--bind here`는 현재 대화 바인딩 지원을 제공하는 채널에서만 사용할 수 있습니다.
    - 동일한 `/acp spawn` 호출에서 `--bind`와 `--thread`를 함께 사용할 수 없습니다.

  </Tab>
  <Tab title="--thread auto|here|off">
    | 모드   | 동작                                                                                                       |
    | ------ | ---------------------------------------------------------------------------------------------------------- |
    | `auto` | 활성 스레드 내부에서는 해당 스레드를 바인딩합니다. 스레드 외부에서는 지원되는 경우 하위 스레드를 생성/바인딩합니다. |
    | `here` | 현재 활성 스레드를 요구하며, 스레드 내부가 아니면 실패합니다.                                              |
    | `off`  | 바인딩하지 않습니다. 세션은 바인딩되지 않은 상태로 시작됩니다.                                             |

    참고:

    - 스레드가 아닌 바인딩 표면에서 기본 동작은 사실상 `off`입니다.
    - 스레드 바인딩 생성에는 채널 정책 지원이 필요합니다.
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - 하위 스레드를 생성하지 않고 현재 대화를 고정하려면 `--bind here`를 사용하십시오.

  </Tab>
</Tabs>

## 전달 모델

ACP 세션은 대화형 워크스페이스이거나 상위 세션이 소유하는 백그라운드
작업일 수 있습니다. 전달 경로는 그 형태에 따라 달라집니다.

<AccordionGroup>
  <Accordion title="대화형 ACP 세션">
    대화형 세션은 표시되는 채팅 표면에서 대화를 계속하도록 설계되었습니다.

    - `/acp spawn ... --bind here`는 현재 대화를 ACP 세션에 바인딩합니다.
    - `/acp spawn ... --thread ...`는 채널 스레드/토픽을 ACP 세션에 바인딩합니다.
    - 지속적으로 구성된 `bindings[].type="acp"`는 일치하는 대화를 동일한 ACP 세션으로 라우팅합니다.

    바인딩된 대화의 후속 메시지는 ACP 세션으로 직접 라우팅되며,
    ACP 출력은 동일한 채널/스레드/토픽으로 다시 전달됩니다.

    OpenClaw가 하네스로 전송하는 내용:

    - 일반적인 바인딩 후속 메시지는 프롬프트 텍스트로 전송되며, 하네스/백엔드가 지원하는 경우에만 첨부 파일도 함께 전송됩니다.
    - `/acp` 관리 명령과 로컬 Gateway 명령은 ACP 디스패치 전에 가로챕니다.
    - 런타임에서 생성된 완료 이벤트는 대상별로 구체화됩니다. OpenClaw 에이전트는 OpenClaw의 내부 런타임 컨텍스트 봉투를 받고, 외부 ACP 하네스는 하위 결과와 지침이 포함된 일반 프롬프트를 받습니다. 원시 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 봉투는 외부 하네스로 전송되거나 ACP 사용자 트랜스크립트 텍스트로 저장되어서는 안 됩니다.
    - ACP 트랜스크립트 항목은 사용자에게 표시되는 트리거 텍스트 또는 일반 완료 프롬프트를 사용합니다. 내부 이벤트 메타데이터는 가능한 경우 OpenClaw에서 구조화된 상태로 유지되며 사용자가 작성한 채팅 콘텐츠로 취급되지 않습니다.

  </Accordion>
  <Accordion title="상위 세션이 소유하는 일회성 ACP 세션">
    다른 에이전트 실행에서 생성된 일회성 ACP 세션은 하위 에이전트와 유사한
    백그라운드 하위 작업입니다.

    - 상위 세션은 `sessions_spawn({ runtime: "acp", mode: "run" })`으로 작업을 요청합니다.
    - 하위 세션은 자체 ACP 하네스 세션에서 실행됩니다.
    - 하위 턴은 네이티브 하위 에이전트 생성에서 사용하는 것과 동일한 백그라운드 레인에서 실행되므로, 느린 ACP 하네스가 관련 없는 기본 세션 작업을 차단하지 않습니다.
    - 완료 결과는 작업 완료 알림 경로를 통해 상위 세션으로 보고됩니다. OpenClaw는 외부 하네스로 전송하기 전에 내부 완료 메타데이터를 일반 ACP 프롬프트로 변환하므로, 하네스에는 OpenClaw 전용 런타임 컨텍스트 마커가 표시되지 않습니다.
    - 사용자에게 표시되는 응답이 유용한 경우 상위 세션은 하위 결과를 일반적인 어시스턴트 말투로 다시 작성합니다.

    이 경로를 상위 세션과 하위 세션 간의 P2P 채팅으로 취급하지
    **마십시오**. 하위 세션에는 이미 상위 세션으로 돌아가는 완료 채널이 있습니다.

  </Accordion>
  <Accordion title="sessions_send 및 A2A 전달">
    `sessions_send`는 생성 후 다른 세션을 대상으로 지정할 수 있습니다. 일반 피어
    세션의 경우 OpenClaw는 메시지를 주입한 후 에이전트 간(A2A) 후속 경로를
    사용합니다.

    - 대상 세션의 응답을 기다립니다.
    - 선택적으로 요청자와 대상이 제한된 횟수의 후속 턴을 교환하도록 합니다.
    - 대상에게 알림 메시지를 생성하도록 요청합니다.
    - 해당 알림을 표시되는 채널 또는 스레드에 전달합니다.

    이 A2A 경로는 발신자가 사용자에게 보이는 후속 응답을 필요로 하는 피어 전송을 위한 폴백입니다. 예를 들어 광범위한 `tools.sessions.visibility` 설정에서 관련 없는 세션이 ACP 대상을 보고 메시지를 보낼 수 있는 경우에도 활성화된 상태로 유지됩니다.

    OpenClaw는 요청자가 자신이 직접 소유한 일회성 ACP 자식의 부모인 경우에만 A2A 후속 응답을 건너뜁니다. 이 경우 작업 완료에 더해 A2A를 실행하면 자식의 결과로 부모를 깨우고, 부모의 응답을 다시 자식에게 전달하여 부모/자식 에코 루프가 생성될 수 있습니다. 완료 경로가 이미 결과 전달을 담당하므로, 해당 소유 자식의 경우 `sessions_send` 결과는 `delivery.status="skipped"`를 보고합니다.

  </Accordion>
  <Accordion title="기존 세션 재개">
    새로 시작하는 대신 `resumeSessionId`를 사용하여 이전 ACP 세션을 계속하십시오. 에이전트는 `session/load`를 통해 대화 기록을 재생하므로 이전의 전체 컨텍스트를 바탕으로 이어서 진행합니다.

    ```json
    {
      "task": "중단한 지점부터 계속 진행하여 남은 테스트 실패를 수정하십시오",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    일반적인 사용 사례:

    - 노트북의 Codex 세션을 휴대전화로 인계하여 에이전트에게 중단한 지점부터 이어서 진행하도록 지시합니다.
    - CLI에서 대화형으로 시작한 코딩 세션을 이제 에이전트를 통해 헤드리스 방식으로 계속합니다.
    - Gateway 재시작 또는 유휴 시간 초과로 중단된 작업을 이어서 진행합니다.

    참고:

    - `resumeSessionId`는 `runtime: "acp"`인 경우에만 적용되며, 기본 하위 에이전트 런타임은 이 ACP 전용 필드를 무시합니다.
    - `streamTo`는 `runtime: "acp"`인 경우에만 적용되며, 기본 하위 에이전트 런타임은 이 ACP 전용 필드를 무시합니다.
    - `resumeSessionId`는 호스트 로컬 ACP/하네스 재개 ID이며 OpenClaw 채널 세션 키가 아닙니다. OpenClaw는 디스패치 전에 여전히 ACP 생성 정책과 대상 에이전트 정책을 확인하며, 해당 업스트림 ID를 로드하기 위한 권한 부여는 ACP 백엔드 또는 하네스가 담당합니다.
    - `resumeSessionId`는 업스트림 ACP 대화 기록을 복원합니다. `thread`와 `mode`는 새로 생성하는 OpenClaw 세션에 계속 정상적으로 적용되므로, `mode: "session"`에는 여전히 `thread: true`가 필요합니다.
    - 대상 에이전트는 `session/load`를 지원해야 합니다(Codex와 Claude Code는 지원합니다).
    - 세션 ID를 찾을 수 없으면 생성 작업이 명확한 오류와 함께 실패하며, 새 세션으로 자동 폴백하지 않습니다.

  </Accordion>
  <Accordion title="배포 후 스모크 테스트">
    Gateway를 배포한 후에는 단위 테스트를 신뢰하는 대신 실제 엔드투엔드 검사를
    실행하십시오.

    1. 대상 호스트에 배포된 Gateway 버전과 커밋을 확인합니다.
    2. 실제 에이전트에 대한 임시 ACPX 브리지 세션을 엽니다.
    3. 해당 에이전트에게 `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` 및 작업 `Reply with exactly LIVE-ACP-SPAWN-OK`를 사용하여 `sessions_spawn`을 호출하도록 요청합니다.
    4. `accepted=yes`, 실제 `childSessionKey`, 그리고 유효성 검사기 오류가 없음을 확인합니다.
    5. 임시 브리지 세션을 정리합니다.

    게이트는 `mode: "run"`에 유지하고 `streamTo: "parent"`는 건너뛰십시오.
    스레드에 바인딩된 `mode: "session"`과 스트림 릴레이 경로는 별도의 더 포괄적인
    통합 검사입니다.

  </Accordion>
</AccordionGroup>

## 샌드박스 호환성

ACP 세션은 현재 OpenClaw 샌드박스 **내부가 아니라** 호스트 런타임에서
실행됩니다.

<Warning>
**보안 경계:**

- 외부 하네스는 자체 CLI 권한과 선택한 `cwd`에 따라 읽고 쓸 수 있습니다.
- OpenClaw의 샌드박스 정책은 ACP 하네스 실행을 **래핑하지 않습니다**.
- OpenClaw는 ACP 기능 게이트, 허용된 에이전트, 세션 소유권, 채널 바인딩 및 Gateway 전달 정책을 계속 적용합니다.
- 샌드박스가 적용되는 OpenClaw 네이티브 작업에는 `runtime: "subagent"`를 사용하십시오.

</Warning>

현재 제한 사항:

- 요청자 세션이 샌드박스 처리된 경우 `sessions_spawn({ runtime: "acp" })`와 `/acp spawn` 모두에서 ACP 생성이 차단됩니다.
- `runtime: "acp"`를 사용하는 `sessions_spawn`은 `sandbox: "require"`를 지원하지 않습니다.

## 세션 대상 확인

대부분의 `/acp` 작업은 선택적 세션 대상(`session-key`,
`session-id` 또는 `session-label`)을 허용합니다.

**확인 순서:**

1. 명시적 대상 인수(또는 `/acp steer`의 `--session`)
   - 먼저 키를 시도합니다.
   - 그런 다음 UUID 형식의 세션 ID를 시도합니다.
   - 그런 다음 레이블을 시도합니다.
2. 현재 스레드 바인딩(이 대화/스레드가 ACP 세션에 바인딩된 경우).
3. 현재 요청자 세션으로 대체합니다.

현재 대화 바인딩과 스레드 바인딩은 모두 2단계에 참여합니다.

확인되는 대상이 없으면 OpenClaw는 명확한 오류를 반환합니다
(`Unable to resolve session target: ...`).

## ACP 제어

| 명령                 | 수행 작업                                                  | 예시                                                          |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP 세션을 생성합니다. 선택적으로 현재 위치나 스레드에 바인딩합니다. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 대상 세션에서 진행 중인 턴을 취소합니다.                    | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 실행 중인 세션에 조정 지침을 보냅니다.                      | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 세션을 닫고 스레드 대상의 바인딩을 해제합니다.               | `/acp close`                                                  |
| `/acp status`        | 백엔드, 모드, 상태, 런타임 옵션, 기능을 표시합니다.          | `/acp status`                                                 |
| `/acp set-mode`      | 대상 세션의 런타임 모드를 설정합니다.                        | `/acp set-mode plan`                                          |
| `/acp set`           | 일반 런타임 구성 옵션을 기록합니다.                          | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 런타임 작업 디렉터리 재정의를 설정합니다.                    | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 승인 정책 프로필을 설정합니다.                               | `/acp permissions strict`                                     |
| `/acp timeout`       | 런타임 제한 시간(초)을 설정합니다.                            | `/acp timeout 120`                                            |
| `/acp model`         | 런타임 모델 재정의를 설정합니다.                              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 세션 런타임 옵션 재정의를 제거합니다.                         | `/acp reset-options`                                          |
| `/acp sessions`      | 저장소의 최근 ACP 세션을 나열합니다.                          | `/acp sessions`                                               |
| `/acp doctor`        | 백엔드 상태, 기능, 실행 가능한 수정 방법을 표시합니다.        | `/acp doctor`                                                 |
| `/acp install`       | 결정론적 설치 및 활성화 단계를 출력합니다.                    | `/acp install`                                                |

런타임 제어(`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model`, `reset-options`)에는
외부 채널의 소유자 ID와 내부 Gateway 클라이언트의 `operator.admin`이
필요합니다. 권한이 있지만 소유자가 아닌 발신자도 `sessions`,
`doctor`, `install`, `help`는 사용할 수 있습니다.

`/acp status`는 유효한 런타임 옵션과 런타임 수준 및
백엔드 수준 세션 식별자를 표시합니다. 백엔드에 필요한 기능이 없으면
지원되지 않는 제어 오류가 명확하게 표시됩니다. `/acp sessions`는 현재
바인딩된 세션 또는 요청자 세션의 저장소를 읽습니다. 대상 토큰
(`session-key`, `session-id`, `session-label`)은 에이전트별 사용자 지정
`session.store` 루트를 포함한 Gateway 세션 검색을 통해 확인됩니다.

### 런타임 옵션 매핑

`/acp`는 편의 명령과 일반 설정자를 제공합니다. 동등한 작업은 다음과 같습니다.

| 명령                         | 매핑 대상                            | 참고                                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 런타임 구성 키 `model`               | Codex ACP에서 OpenClaw는 `openai/<model>`을 어댑터 모델 ID로 정규화하고 `openai/gpt-5.4/high` 같은 슬래시 추론 접미사를 `reasoning_effort`에 매핑합니다.                                                               |
| `/acp set thinking <level>`  | 정규 옵션 `thinking`                 | OpenClaw는 백엔드가 알린 동등한 옵션이 있으면 이를 전송하며, `thinking`, `effort`, `reasoning_effort`, `thought_level` 순으로 우선합니다. Codex ACP에서 어댑터는 값을 `reasoning_effort`에 매핑합니다. |
| `/acp permissions <profile>` | 정규 옵션 `permissionProfile`        | OpenClaw는 백엔드가 알린 동등한 옵션이 있으면 이를 전송합니다. 예를 들면 `approval_policy`, `permission_profile`, `permissions`, `permission_mode`입니다.                                                              |
| `/acp timeout <seconds>`     | 정규 옵션 `timeoutSeconds`           | OpenClaw는 백엔드가 알린 동등한 옵션이 있으면 이를 전송합니다. 예를 들면 `timeout` 또는 `timeout_seconds`입니다.                                                                                                      |
| `/acp cwd <path>`            | 런타임 cwd 재정의                    | 직접 업데이트합니다.                                                                                                                                                                                                  |
| `/acp set <key> <value>`     | 일반                                 | `key=cwd`는 cwd 재정의 경로를 사용합니다.                                                                                                                                                                              |
| `/acp reset-options`         | 모든 런타임 재정의를 지웁니다.       | -                                                                                                                                                                                                                     |

## acpx 하네스, Plugin 설정 및 권한

acpx 하네스 구성(Claude Code / Codex / Gemini CLI 별칭),
plugin-tools 및 OpenClaw-tools MCP 브리지와 ACP 권한 모드에 관한
내용은 [ACP 에이전트 - 설정](/ko/tools/acp-agents-setup)을 참조하십시오.

## 문제 해결

| 증상                                                                                      | 가능한 원인                                                                                                                     | 해결 방법                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                                   | 백엔드 Plugin이 없거나 비활성화되었거나 `plugins.allow`에 의해 차단되었습니다.                                                   | 백엔드 Plugin을 설치하고 활성화하십시오. 허용 목록이 설정된 경우 `plugins.allow`에 `acpx`를 포함한 다음 `/acp doctor`를 실행하십시오.                                                    |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP가 전역적으로 비활성화되었습니다.                                                                                             | `acp.enabled=true`로 설정하십시오.                                                                                                                                                       |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | 일반 스레드 메시지의 자동 디스패치가 비활성화되었습니다.                                                                        | 자동 스레드 라우팅을 재개하려면 `acp.dispatch.enabled=true`로 설정하십시오. 명시적인 `sessions_spawn({ runtime: "acp" })` 호출은 계속 작동합니다.                                        |
| `ACP agent "<id>" is not allowed by policy`                                               | 에이전트가 허용 목록에 없습니다.                                                                                                | 허용된 `agentId`를 사용하거나 `acp.allowedAgents`를 업데이트하십시오.                                                                                                                   |
| `/acp doctor` reports backend not ready right after startup                               | 백엔드 Plugin이 없거나 비활성화되었거나 허용/거부 정책에 의해 차단되었거나, 구성된 실행 파일을 사용할 수 없습니다.               | 백엔드 Plugin을 설치/활성화하고 `/acp doctor`를 다시 실행하십시오. 계속 비정상 상태이면 백엔드 설치 또는 정책 오류를 확인하십시오.                                                       |
| 하네스 명령을 찾을 수 없음                                                               | 어댑터 CLI가 설치되지 않았거나 외부 Plugin이 없거나, Codex 이외 어댑터의 최초 실행 시 `npx` 가져오기가 실패했습니다.              | `/acp doctor`를 실행하고 Gateway 호스트에 어댑터를 설치하거나 미리 준비하거나, acpx 에이전트 명령을 명시적으로 구성하십시오.                                                             |
| 하네스에서 모델을 찾을 수 없다는 오류 발생                                               | 모델 ID가 다른 제공자/하네스에는 유효하지만 이 ACP 대상에는 유효하지 않습니다.                                                  | 해당 하네스에 나열된 모델을 사용하거나, 하네스에서 모델을 구성하거나, 재정의를 생략하십시오.                                                                                            |
| 하네스에서 공급업체 인증 오류 발생                                                       | OpenClaw는 정상 상태이지만 대상 CLI/제공자에 로그인되어 있지 않습니다.                                                          | Gateway 호스트 환경에서 로그인하거나 필요한 제공자 키를 입력하십시오.                                                                                                                  |
| `Unable to resolve session target: ...`                                                   | 키/ID/레이블 토큰이 잘못되었습니다.                                                                                             | `/acp sessions`를 실행하고 정확한 키/레이블을 복사한 다음 다시 시도하십시오.                                                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation`               | 활성 상태이며 바인딩 가능한 대화 없이 `--bind here`를 사용했습니다.                                                             | 대상 채팅/채널로 이동하여 다시 시도하거나 바인딩되지 않은 생성을 사용하십시오.                                                                                                          |
| `Conversation bindings are unavailable for <channel>.`                                    | 어댑터에 현재 대화의 ACP 바인딩 기능이 없습니다.                                                                                 | 지원되는 경우 `/acp spawn ... --thread ...`를 사용하거나, 최상위 `bindings[]`를 구성하거나, 지원되는 채널로 이동하십시오.                                                               |
| `--thread here requires running /acp spawn inside an active ... thread`                   | 스레드 컨텍스트 외부에서 `--thread here`를 사용했습니다.                                                                        | 대상 스레드로 이동하거나 `--thread auto`/`off`를 사용하십시오.                                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | 다른 사용자가 활성 바인딩 대상을 소유하고 있습니다.                                                                             | 소유자로서 다시 바인딩하거나 다른 대화 또는 스레드를 사용하십시오.                                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                                          | 어댑터에 스레드 바인딩 기능이 없습니다.                                                                                          | `--thread off`를 사용하거나 지원되는 어댑터/채널로 이동하십시오.                                                                                                                        |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | ACP 런타임은 호스트 측에서 실행되며, 요청자 세션은 샌드박스 처리되어 있습니다.                                                   | 샌드박스 처리된 세션에서는 `runtime="subagent"`를 사용하거나 샌드박스 처리되지 않은 세션에서 ACP 생성을 실행하십시오.                                                                   |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | ACP 런타임에 `sandbox="require"`를 요청했습니다.                                                                                 | 필수 샌드박스 처리에는 `runtime="subagent"`를 사용하거나, 샌드박스 처리되지 않은 세션에서 `sandbox="inherit"`로 ACP를 사용하십시오.                                                      |
| `Cannot apply --model ... did not advertise model support`                                | 대상 하네스가 일반 ACP 모델 전환 기능을 노출하지 않습니다.                                                                      | ACP `models`/`session/set_model`을 지원한다고 알리는 하네스를 사용하거나, Codex ACP 모델 참조를 사용하거나, 자체 시작 플래그가 있는 경우 하네스에서 직접 모델을 구성하십시오.           |
| 바인딩된 세션의 ACP 메타데이터 누락                                                      | ACP 세션 메타데이터가 오래되었거나 삭제되었습니다.                                                                               | `/acp spawn`으로 다시 생성한 다음 스레드를 다시 바인딩하거나 포커스하십시오.                                                                                                            |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode`가 비대화형 ACP 세션의 쓰기/실행을 차단합니다.                                                                  | `plugins.entries.acpx.config.permissionMode`를 `approve-all`로 설정하고 Gateway를 다시 시작하십시오. [권한 구성](/ko/tools/acp-agents-setup#permission-configuration)을 참조하십시오.       |
| ACP 세션이 거의 출력 없이 조기에 실패함                                                  | `permissionMode`/`nonInteractivePermissions`에 의해 권한 프롬프트가 차단되었습니다.                                              | Gateway 로그에서 `AcpRuntimeError`를 확인하십시오. 전체 권한을 부여하려면 `permissionMode=approve-all`로 설정하고, 단계적 기능 저하를 허용하려면 `nonInteractivePermissions=deny`로 설정하십시오. |
| ACP 세션이 작업을 완료한 후에도 무기한 중단됨                                            | 하네스 프로세스가 종료되었지만 ACP 세션이 완료를 보고하지 않았습니다.                                                            | OpenClaw를 업데이트하십시오. 현재 acpx 정리 기능은 종료 및 Gateway 시작 시 OpenClaw가 소유한 오래된 래퍼와 어댑터 프로세스를 정리합니다.                                                |
| 하네스에 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`가 표시됨                                 | 내부 이벤트 엔벌로프가 ACP 경계를 넘어 유출되었습니다.                                                                          | OpenClaw를 업데이트하고 완료 흐름을 다시 실행하십시오. 외부 하네스에는 일반 완료 프롬프트만 전달되어야 합니다.                                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable`은 ACP/acpx가
아니라 네이티브 Codex 훅 릴레이에 해당합니다. 바인딩된 Codex 채팅에서 `/new`
또는 `/reset`으로 새 세션을 시작하십시오. 한 번은 작동하지만 다음 네이티브 도구
호출에서 다시 나타나면 `/new`를 반복하는 대신 Codex 앱 서버 또는 OpenClaw
Gateway를 다시 시작하십시오.
[Codex 하네스 문제 해결](/ko/plugins/codex-harness#troubleshooting)을 참조하십시오.
</Note>

## 관련 항목

- [ACP 에이전트 - 설정](/ko/tools/acp-agents-setup)
- [에이전트 전송](/ko/tools/agent-send)
- [CLI 백엔드](/ko/gateway/cli-backends)
- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)
- [다중 에이전트 샌드박스 도구](/ko/tools/multi-agent-sandbox-tools)
- [`openclaw acp`(브리지 모드)](/ko/cli/acp)
- [하위 에이전트](/ko/tools/subagents)
