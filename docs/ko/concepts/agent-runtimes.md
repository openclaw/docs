---
read_when:
    - PI, Codex, ACP 또는 다른 기본 에이전트 런타임 중에서 선택하고 있습니다
    - status 또는 config의 공급자/모델/런타임 라벨 때문에 혼란스럽습니다
    - 기본 하니스의 지원 패리티를 문서화하고 있습니다
summary: OpenClaw가 모델 공급자, 모델, 채널 및 에이전트 런타임을 분리하는 방식
title: 에이전트 런타임
x-i18n:
    generated_at: "2026-04-26T11:26:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

**에이전트 런타임**은 하나의 준비된 모델 루프를 담당하는 구성 요소입니다. 프롬프트를 받고, 모델 출력을 구동하며, 기본 도구 호출을 처리하고, 완료된 턴을 OpenClaw에 반환합니다.

런타임과 공급자는 둘 다 모델 구성 근처에 표시되기 때문에 혼동하기 쉽습니다. 하지만 서로 다른 계층입니다.

| 계층          | 예시                                  | 의미                                                                  |
| ------------- | ------------------------------------- | --------------------------------------------------------------------- |
| 공급자        | `openai`, `anthropic`, `openai-codex` | OpenClaw가 인증하고, 모델을 탐색하고, 모델 참조 이름을 지정하는 방식 |
| 모델          | `gpt-5.5`, `claude-opus-4-6`          | 에이전트 턴에 선택된 모델                                             |
| 에이전트 런타임 | `pi`, `codex`, `claude-cli`         | 준비된 턴을 실행하는 저수준 루프 또는 백엔드                          |
| 채널          | Telegram, Discord, Slack, WhatsApp    | 메시지가 OpenClaw로 들어오고 나가는 위치                             |

코드에서는 **harness**라는 단어도 보게 됩니다. harness는 에이전트 런타임을 제공하는 구현체입니다. 예를 들어 번들 Codex harness는 `codex` 런타임을 구현합니다. 공개 구성에서는 `agentRuntime.id`를 사용하며, `openclaw
doctor --fix`는 이전 런타임 정책 키를 해당 형태로 다시 작성합니다.

런타임 계열은 두 가지가 있습니다.

- **임베디드 harness**는 OpenClaw의 준비된 에이전트 루프 내부에서 실행됩니다. 현재는 내장 `pi` 런타임과 `codex` 같은 등록된 Plugin harness가 이에 해당합니다.
- **CLI 백엔드**는 모델 참조를 표준 형태로 유지하면서 로컬 CLI 프로세스를 실행합니다. 예를 들어 `anthropic/claude-opus-4-7`과 `agentRuntime.id: "claude-cli"` 조합은 "Anthropic 모델을 선택하고 Claude CLI를 통해 실행"을 의미합니다. `claude-cli`는 임베디드 harness ID가 아니므로 AgentHarness 선택에 전달해서는 안 됩니다.

## Codex라는 이름의 세 가지 대상

대부분의 혼란은 Codex라는 이름을 공유하는 세 가지 서로 다른 표면에서 비롯됩니다.

| 표면                                                 | OpenClaw 이름/구성                   | 동작                                                                                           |
| ---------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Codex OAuth 공급자 경로                              | `openai-codex/*` 모델 참조           | 일반 OpenClaw PI 러너를 통해 ChatGPT/Codex 구독 OAuth를 사용함                                |
| 기본 Codex app-server 런타임                         | `agentRuntime.id: "codex"`           | 번들 Codex app-server harness를 통해 임베디드 에이전트 턴을 실행함                            |
| Codex ACP 어댑터                                     | `runtime: "acp"`, `agentId: "codex"` | 외부 ACP/acpx 제어 평면을 통해 Codex를 실행함. ACP/acpx가 명시적으로 요청된 경우에만 사용     |
| 기본 Codex chat-control 명령 세트                    | `/codex ...`                         | 채팅에서 Codex app-server 스레드를 바인드, 재개, 조정, 중지, 검사함                           |
| GPT/Codex 스타일 모델용 OpenAI Platform API 경로     | `openai/*` 모델 참조                 | `runtime: "codex"` 같은 런타임 재정의가 턴을 실행하지 않는 한 OpenAI API 키 인증을 사용함     |

이 표면들은 의도적으로 서로 독립적입니다. `codex` Plugin을 활성화하면 기본 app-server 기능을 사용할 수 있게 되지만, `openai-codex/*`를 `openai/*`로 다시 쓰지 않고, 기존 세션을 바꾸지 않으며, ACP를 Codex 기본값으로 만들지도 않습니다. `openai-codex/*`를 선택한다는 것은 별도로 런타임을 강제하지 않는 한 "Codex OAuth 공급자 경로를 사용"한다는 뜻입니다.

일반적인 Codex 설정은 `openai` 공급자와 `codex` 런타임을 사용합니다.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

이는 OpenClaw가 OpenAI 모델 참조를 선택한 다음, Codex app-server 런타임에 임베디드 에이전트 턴 실행을 요청한다는 뜻입니다. 채널, 모델 공급자 카탈로그 또는 OpenClaw 세션 저장소 자체가 Codex가 된다는 의미는 아닙니다.

번들 `codex` Plugin이 활성화되어 있으면 자연어 Codex 제어는 ACP 대신 기본 `/codex` 명령 표면(`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`)을 사용해야 합니다. ACP는 사용자가 ACP/acpx를 명시적으로 요청하거나 ACP 어댑터 경로를 테스트 중일 때만 Codex에 사용하세요. Claude Code, Gemini CLI, OpenCode, Cursor 및 유사한 외부 harness는 계속 ACP를 사용합니다.

다음은 에이전트 관점의 결정 트리입니다.

1. 사용자가 **Codex 바인드/제어/스레드/재개/조정/중지**를 요청하면, 번들 `codex` Plugin이 활성화되어 있을 때 기본 `/codex` 명령 표면을 사용합니다.
2. 사용자가 **임베디드 런타임으로서의 Codex**를 요청하면, `openai/<model>`과 `agentRuntime.id: "codex"`를 사용합니다.
3. 사용자가 **일반 OpenClaw 러너에서 Codex OAuth/구독 인증**을 요청하면, `openai-codex/<model>`을 사용하고 런타임은 PI로 둡니다.
4. 사용자가 명시적으로 **ACP**, **acpx** 또는 **Codex ACP 어댑터**를 언급하면, `runtime: "acp"`와 `agentId: "codex"`로 ACP를 사용합니다.
5. 요청이 **Claude Code, Gemini CLI, OpenCode, Cursor, Droid 또는 다른 외부 harness**용이면, 기본 서브에이전트 런타임이 아니라 ACP/acpx를 사용합니다.

| 의미하는 대상                           | 사용 방법                                     |
| --------------------------------------- | --------------------------------------------- |
| Codex app-server 채팅/스레드 제어       | 번들 `codex` Plugin의 `/codex ...`            |
| Codex app-server 임베디드 에이전트 런타임 | `agentRuntime.id: "codex"`                  |
| PI 러너에서의 OpenAI Codex OAuth        | `openai-codex/*` 모델 참조                    |
| Claude Code 또는 기타 외부 harness      | ACP/acpx                                      |

OpenAI 계열 접두사 분리에 대해서는 [OpenAI](/ko/providers/openai)와
[모델 공급자](/ko/concepts/model-providers)를 참조하세요. Codex 런타임 지원 계약에 대해서는 [Codex harness](/ko/plugins/codex-harness#v1-support-contract)를 참조하세요.

## 런타임 소유권

런타임마다 루프의 소유 범위가 다릅니다.

| 표면                        | OpenClaw PI 임베디드                      | Codex app-server                                                            |
| --------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| 모델 루프 소유자            | PI 임베디드 러너를 통한 OpenClaw          | Codex app-server                                                            |
| 표준 스레드 상태            | OpenClaw transcript                       | Codex 스레드 + OpenClaw transcript 미러                                     |
| OpenClaw 동적 도구          | 기본 OpenClaw 도구 루프                   | Codex 어댑터를 통해 브리지됨                                                |
| 기본 셸 및 파일 도구        | PI/OpenClaw 경로                          | 지원되는 경우 기본 훅을 통해 브리지되는 Codex 기본 도구                     |
| 컨텍스트 엔진              | 기본 OpenClaw 컨텍스트 조립               | OpenClaw 프로젝트가 Codex 턴에 조립한 컨텍스트                              |
| Compaction                  | OpenClaw 또는 선택된 컨텍스트 엔진        | OpenClaw 알림 및 미러 유지와 함께하는 Codex 기본 Compaction                 |
| 채널 전달                   | OpenClaw                                  | OpenClaw                                                                    |

이 소유권 분할이 핵심 설계 원칙입니다.

- OpenClaw가 표면을 소유하면 OpenClaw는 일반적인 Plugin 훅 동작을 제공할 수 있습니다.
- 기본 런타임이 표면을 소유하면 OpenClaw에는 런타임 이벤트 또는 기본 훅이 필요합니다.
- 기본 런타임이 표준 스레드 상태를 소유하면, OpenClaw는 지원되지 않는 내부를 다시 쓰는 대신 컨텍스트를 미러링하고 투영해야 합니다.

## 런타임 선택

OpenClaw는 공급자 및 모델 확인 후 임베디드 런타임을 선택합니다.

1. 세션에 기록된 런타임이 우선합니다. 구성 변경으로 기존 transcript를 다른 기본 스레드 시스템으로 즉시 전환하지는 않습니다.
2. `OPENCLAW_AGENT_RUNTIME=<id>`는 새 세션 또는 재설정된 세션에 대해 해당 런타임을 강제합니다.
3. `agents.defaults.agentRuntime.id` 또는 `agents.list[].agentRuntime.id`는
   `auto`, `pi`, `codex` 같은 등록된 임베디드 harness ID, 또는 `claude-cli` 같은 지원되는 CLI 백엔드 별칭을 설정할 수 있습니다.
4. `auto` 모드에서는 등록된 Plugin 런타임이 지원하는 공급자/모델 쌍을 클레임할 수 있습니다.
5. `auto` 모드에서 어떤 런타임도 턴을 클레임하지 않고 `fallback: "pi"`가 설정되어 있으면(기본값), OpenClaw는 호환성 대체 동작으로 PI를 사용합니다. 일치하지 않는 `auto` 모드 선택을 실패하게 하려면 `fallback: "none"`을 설정하세요.

명시적인 Plugin 런타임은 기본적으로 닫힌 방식으로 실패합니다. 예를 들어,
`runtime: "codex"`는 같은 재정의 범위에서 `fallback: "pi"`를 설정하지 않는 한 Codex 또는 명확한 선택 오류를 의미합니다. 런타임 재정의는 더 넓은 범위의 대체 설정을 상속하지 않으므로, 에이전트 수준의 `runtime: "codex"`가 기본값에 `fallback: "pi"`가 있었다고 해서 자동으로 PI로 라우팅되지는 않습니다.

CLI 백엔드 별칭은 임베디드 harness ID와 다릅니다. 권장되는
Claude CLI 형태는 다음과 같습니다.

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

`claude-cli/claude-opus-4-7` 같은 레거시 참조는 호환성을 위해 계속 지원되지만, 새 구성에서는 공급자/모델을 표준 형태로 유지하고 실행 백엔드는 `agentRuntime.id`에 넣어야 합니다.

`auto` 모드는 의도적으로 보수적입니다. Plugin 런타임은 자신이 이해하는 공급자/모델 쌍을 클레임할 수 있지만, Codex Plugin은 `auto` 모드에서 `openai-codex` 공급자를 클레임하지 않습니다. 이렇게 하면 `openai-codex/*`를 명시적인 PI Codex OAuth 경로로 유지하고, 구독 인증 구성이 기본 app-server harness로 조용히 이동하는 것을 방지할 수 있습니다.

`openclaw doctor`가 `codex` Plugin은 활성화되어 있지만
`openai-codex/*`가 여전히 PI를 통해 라우팅된다고 경고하면, 이를 마이그레이션이 아니라 진단으로 간주하세요. PI Codex OAuth가 원하는 동작이라면 구성을 그대로 유지하세요. 기본 Codex app-server 실행을 원할 때만 `openai/<model>` + `agentRuntime.id: "codex"`로 전환하세요.

## 호환성 계약

런타임이 PI가 아닐 때는 어떤 OpenClaw 표면을 지원하는지 문서화해야 합니다.
런타임 문서에는 다음 형태를 사용하세요.

| 질문                                   | 중요한 이유                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| 누가 모델 루프를 소유하는가?           | 재시도, 도구 이어서 실행, 최종 응답 결정이 어디서 이루어지는지 결정함                        |
| 누가 표준 스레드 기록을 소유하는가?    | OpenClaw가 기록을 편집할 수 있는지, 아니면 미러링만 가능한지 결정함                          |
| OpenClaw 동적 도구가 작동하는가?       | 메시징, 세션, Cron, OpenClaw 소유 도구가 이에 의존함                                         |
| 동적 도구 훅이 작동하는가?             | Plugin은 OpenClaw 소유 도구 주변의 `before_tool_call`, `after_tool_call`, 미들웨어를 기대함 |
| 기본 도구 훅이 작동하는가?             | 셸, patch, 런타임 소유 도구는 정책 및 관측을 위해 기본 훅 지원이 필요함                     |
| 컨텍스트 엔진 수명 주기가 실행되는가?  | 메모리 및 컨텍스트 Plugin은 assemble, ingest, after-turn, compaction 수명 주기에 의존함    |
| 어떤 Compaction 데이터가 노출되는가?   | 일부 Plugin은 알림만 필요하고, 다른 일부는 유지/삭제 메타데이터가 필요함                   |
| 의도적으로 지원되지 않는 것은 무엇인가? | 기본 런타임이 더 많은 상태를 소유하는 경우 사용자가 PI와 동등하다고 가정하지 않도록 해야 함 |

Codex 런타임 지원 계약은 [Codex harness](/ko/plugins/codex-harness#v1-support-contract)에 문서화되어 있습니다.

## 상태 라벨

status 출력에는 `Execution`과 `Runtime` 라벨이 모두 표시될 수 있습니다. 이를 공급자 이름이 아니라 진단 정보로 해석하세요.

- `openai/gpt-5.5` 같은 모델 참조는 선택된 공급자/모델을 알려줍니다.
- `codex` 같은 런타임 ID는 어떤 루프가 턴을 실행하는지 알려줍니다.
- Telegram 또는 Discord 같은 채널 라벨은 대화가 어디에서 이루어지는지 알려줍니다.

런타임 구성을 변경한 뒤에도 세션에 계속 PI가 표시되면 `/new`로 새 세션을 시작하거나 `/reset`으로 현재 세션을 지우세요. 기존 세션은 기록된 런타임을 유지하므로, 하나의 transcript가 서로 호환되지 않는 두 기본 세션 시스템을 통해 다시 재생되지 않습니다.

## 관련 항목

- [Codex harness](/ko/plugins/codex-harness)
- [OpenAI](/ko/providers/openai)
- [에이전트 harness Plugins](/ko/plugins/sdk-agent-harness)
- [에이전트 루프](/ko/concepts/agent-loop)
- [모델](/ko/concepts/models)
- [상태](/ko/cli/status)
