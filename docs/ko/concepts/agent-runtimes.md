---
read_when:
    - PI, Codex, ACP 또는 다른 네이티브 에이전트 런타임 중에서 선택하고 있습니다
    - 상태 또는 구성의 제공자/모델/런타임 레이블이 혼란스러운 경우
    - 네이티브 하네스에 대한 지원 동등성을 문서화하고 있습니다
summary: OpenClaw가 모델 제공자, 모델, 채널 및 에이전트 런타임을 분리하는 방식
title: 에이전트 런타임
x-i18n:
    generated_at: "2026-05-10T19:30:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**에이전트 런타임**은 준비된 모델 루프 하나를 소유하는 컴포넌트입니다. 프롬프트를 받고, 모델 출력을 구동하고, 네이티브 도구 호출을 처리하며, 완료된 턴을 OpenClaw에 반환합니다.

런타임은 제공자와 혼동하기 쉽습니다. 둘 다 모델 구성 근처에 나타나기 때문입니다. 하지만 서로 다른 계층입니다:

| 계층          | 예시                                  | 의미                                                                |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| 제공자        | `openai`, `anthropic`, `openai-codex` | OpenClaw가 인증하고, 모델을 탐색하고, 모델 ref의 이름을 지정하는 방식입니다. |
| 모델          | `gpt-5.5`, `claude-opus-4-6`          | 에이전트 턴에 선택된 모델입니다.                                    |
| 에이전트 런타임 | `pi`, `codex`, `claude-cli`           | 준비된 턴을 실행하는 저수준 루프 또는 백엔드입니다.                 |
| 채널          | Telegram, Discord, Slack, WhatsApp    | 메시지가 OpenClaw에 들어오고 나가는 위치입니다.                     |

코드에서는 **하네스**라는 단어도 볼 수 있습니다. 하네스는 에이전트 런타임을 제공하는 구현체입니다. 예를 들어, 번들된 Codex 하네스는 `codex` 런타임을 구현합니다. 공개 구성은 제공자 또는 모델 항목에서 `agentRuntime.id`를 사용합니다. 전체 에이전트 런타임 키는 레거시이며 무시됩니다. `openclaw doctor --fix`는 오래된 전체 에이전트 런타임 고정을 제거하고, 필요한 경우 레거시 런타임 모델 ref를 표준 제공자/모델 ref와 모델 범위 런타임 정책으로 다시 작성합니다.

런타임 계열은 두 가지입니다:

- **임베디드 하네스**는 OpenClaw의 준비된 에이전트 루프 안에서 실행됩니다. 현재는 내장 `pi` 런타임과 `codex` 같은 등록된 Plugin 하네스가 여기에 해당합니다.
- **CLI 백엔드**는 모델 ref를 표준으로 유지하면서 로컬 CLI 프로세스를 실행합니다. 예를 들어, 모델 범위 `agentRuntime.id: "claude-cli"`가 있는 `anthropic/claude-opus-4-7`은 "Anthropic 모델을 선택하고 Claude CLI를 통해 실행한다"는 뜻입니다. `claude-cli`는 임베디드 하네스 id가 아니며 AgentHarness 선택에 전달해서는 안 됩니다.

## Codex 표면

대부분의 혼란은 Codex 이름을 공유하는 여러 표면에서 비롯됩니다:

| 표면                                             | OpenClaw 이름/구성                    | 수행하는 작업                                                                                                  |
| ------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 네이티브 Codex 앱 서버 런타임                    | `openai/*` 모델 ref                   | Codex 앱 서버를 통해 OpenAI 임베디드 에이전트 턴을 실행합니다. 일반적인 ChatGPT/Codex 구독 설정입니다.       |
| Codex OAuth 인증 프로필                          | `openai-codex` 인증 제공자            | Codex 앱 서버 하네스가 사용하는 ChatGPT/Codex 구독 인증을 저장합니다.                                         |
| Codex ACP 어댑터                                 | `runtime: "acp"`, `agentId: "codex"` | 외부 ACP/acpx 제어 평면을 통해 Codex를 실행합니다. ACP/acpx가 명시적으로 요청된 경우에만 사용하세요.          |
| 네이티브 Codex 채팅 제어 명령 집합               | `/codex ...`                          | 채팅에서 Codex 앱 서버 스레드를 바인딩, 재개, 조정, 중지, 검사합니다.                                         |
| 비에이전트 표면용 OpenAI Platform API 경로       | `openai/*` 및 API 키 인증             | 이미지, 임베딩, 음성, realtime 같은 직접 OpenAI API에 사용됩니다.                                             |

이 표면들은 의도적으로 독립되어 있습니다. `codex` Plugin을 활성화하면 네이티브 앱 서버 기능을 사용할 수 있습니다. `openclaw doctor --fix`는 레거시 `openai-codex/*` 경로 복구와 오래된 세션 고정 정리를 담당합니다. 이제 에이전트 모델에 `openai/*`를 선택한다는 것은 비에이전트 OpenAI API 표면을 사용하는 경우가 아니라면 "이를 Codex를 통해 실행한다"는 뜻입니다.

일반적인 ChatGPT/Codex 구독 설정은 인증에 Codex OAuth를 사용하지만, 모델 ref는 `openai/*`로 유지하고 `codex` 런타임을 선택합니다:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

이는 OpenClaw가 OpenAI 모델 ref를 선택한 뒤 Codex 앱 서버 런타임에 임베디드 에이전트 턴을 실행하도록 요청한다는 뜻입니다. "API 과금을 사용한다"는 뜻도 아니고, 채널, 모델 제공자 카탈로그, OpenClaw 세션 저장소가 Codex가 된다는 뜻도 아닙니다.

번들된 `codex` Plugin이 활성화되어 있으면 자연어 Codex 제어는 ACP 대신 네이티브 `/codex` 명령 표면(`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`)을 사용해야 합니다. 사용자가 명시적으로 ACP/acpx를 요청하거나 ACP 어댑터 경로를 테스트하는 경우에만 Codex에 ACP를 사용하세요. Claude Code, Gemini CLI, OpenCode, Cursor 및 유사한 외부 하네스는 계속 ACP를 사용합니다.

에이전트 대상 의사 결정 트리는 다음과 같습니다:

1. 사용자가 **Codex 바인딩/제어/스레드/재개/조정/중지**를 요청하면, 번들된 `codex` Plugin이 활성화되어 있을 때 네이티브 `/codex` 명령 표면을 사용합니다.
2. 사용자가 **임베디드 런타임으로서 Codex**를 요청하거나 일반적인 구독 기반 Codex 에이전트 경험을 원하면 `openai/<model>`을 사용합니다.
3. 사용자가 명시적으로 **OpenAI 모델에 PI**를 선택하면 모델 ref를 `openai/<model>`로 유지하고, 제공자/모델 런타임 정책을 `agentRuntime.id: "pi"`로 설정합니다. 선택된 `openai-codex` 인증 프로필은 내부적으로 PI의 레거시 Codex 인증 전송을 통해 라우팅됩니다.
4. 레거시 구성에 아직 **`openai-codex/*` 모델 ref**가 포함되어 있으면 `openclaw doctor --fix`로 `openai/<model>`로 복구합니다. doctor는 오래된 모델 ref가 이를 암시한 경우 제공자/모델 범위 `agentRuntime.id: "codex"`를 추가하여 Codex 인증 경로를 유지합니다.
5. 사용자가 명시적으로 **ACP**, **acpx** 또는 **Codex ACP 어댑터**라고 말하면 `runtime: "acp"` 및 `agentId: "codex"`와 함께 ACP를 사용합니다.
6. 요청이 **Claude Code, Gemini CLI, OpenCode, Cursor, Droid 또는 다른 외부 하네스**에 대한 것이라면 네이티브 서브 에이전트 런타임이 아니라 ACP/acpx를 사용합니다.

| 의미하는 것...                         | 사용할 것...                                  |
| --------------------------------------- | --------------------------------------------- |
| Codex 앱 서버 채팅/스레드 제어          | 번들된 `codex` Plugin의 `/codex ...`          |
| Codex 앱 서버 임베디드 에이전트 런타임  | `openai/*` 에이전트 모델 ref                  |
| OpenAI Codex OAuth                      | `openai-codex` 인증 프로필                    |
| Claude Code 또는 다른 외부 하네스       | ACP/acpx                                      |

OpenAI 계열 접두사 분리에 대해서는 [OpenAI](/ko/providers/openai) 및 [모델 제공자](/ko/concepts/model-providers)를 참조하세요. Codex 런타임 지원 계약에 대해서는 [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime#v1-support-contract)을 참조하세요.

## 런타임 소유권

각 런타임은 루프에서 서로 다른 범위를 소유합니다.

| 표면                        | OpenClaw PI 임베디드                    | Codex 앱 서버                                                               |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| 모델 루프 소유자            | PI 임베디드 러너를 통한 OpenClaw        | Codex 앱 서버                                                               |
| 표준 스레드 상태            | OpenClaw transcript                     | Codex 스레드 및 OpenClaw transcript 미러                                    |
| OpenClaw 동적 도구          | 네이티브 OpenClaw 도구 루프             | Codex 어댑터를 통해 브리지됨                                                |
| 네이티브 shell 및 파일 도구 | PI/OpenClaw 경로                        | Codex 네이티브 도구, 지원되는 경우 네이티브 훅을 통해 브리지됨              |
| 컨텍스트 엔진               | 네이티브 OpenClaw 컨텍스트 조립         | OpenClaw 프로젝트가 컨텍스트를 Codex 턴으로 조립                            |
| Compaction                  | OpenClaw 또는 선택된 컨텍스트 엔진      | Codex 네이티브 Compaction, OpenClaw 알림 및 미러 유지 관리 포함             |
| 채널 전달                   | OpenClaw                                | OpenClaw                                                                    |

이 소유권 분리가 핵심 설계 규칙입니다:

- OpenClaw가 표면을 소유하면, OpenClaw는 일반적인 Plugin 훅 동작을 제공할 수 있습니다.
- 네이티브 런타임이 표면을 소유하면, OpenClaw에는 런타임 이벤트 또는 네이티브 훅이 필요합니다.
- 네이티브 런타임이 표준 스레드 상태를 소유하면, OpenClaw는 지원되지 않는 내부를 다시 작성하지 말고 컨텍스트를 미러링하고 투영해야 합니다.

## 런타임 선택

OpenClaw는 제공자 및 모델 해석 후 임베디드 런타임을 선택합니다:

1. 모델 범위 런타임 정책이 우선합니다. 이는 구성된 제공자 모델 항목이나 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`에 있을 수 있습니다.
2. 제공자 범위 런타임 정책은 다음 순위이며 `models.providers.<provider>.agentRuntime`에 있습니다.
3. `auto` 모드에서는 등록된 Plugin 런타임이 지원되는 제공자/모델 쌍을 청구할 수 있습니다.
4. `auto` 모드에서 어떤 런타임도 턴을 청구하지 않으면 OpenClaw는 호환성 런타임으로 PI를 사용합니다. 실행이 엄격해야 하는 경우 명시적 런타임 id를 사용하세요.

전체 세션 및 전체 에이전트 런타임 고정은 무시됩니다. 여기에는 `OPENCLAW_AGENT_RUNTIME`, 세션 `agentHarnessId`/`agentRuntimeOverride` 상태, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`이 포함됩니다. `openclaw doctor --fix`를 실행하여 오래된 전체 에이전트 런타임 구성을 제거하고 OpenClaw가 의도를 보존할 수 있는 경우 레거시 런타임 모델 ref를 변환하세요.

명시적 제공자/모델 Plugin 런타임은 닫힌 방식으로 실패합니다. 예를 들어 제공자 또는 모델의 `agentRuntime.id: "codex"`는 Codex 또는 명확한 선택/런타임 오류를 의미합니다. PI로 조용히 다시 라우팅되는 일은 없습니다.

CLI 백엔드 별칭은 임베디드 하네스 id와 다릅니다. 권장 Claude CLI 형식은 다음과 같습니다:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

`claude-cli/claude-opus-4-7` 같은 레거시 ref는 호환성을 위해 계속 지원되지만, 새 구성은 제공자/모델을 표준으로 유지하고 실행 백엔드는 제공자/모델 런타임 정책에 넣어야 합니다.

`auto` 모드는 대부분의 제공자에 대해 의도적으로 보수적입니다. OpenAI 에이전트 모델은 예외입니다. 설정되지 않은 런타임과 `auto`는 모두 Codex 하네스로 해석됩니다. 명시적 PI 런타임 구성은 `openai/*` 에이전트 턴에 대한 옵트인 호환성 경로로 남아 있습니다. 선택된 `openai-codex` 인증 프로필과 함께 사용하면, OpenClaw는 공개 모델 ref를 `openai/*`로 유지하면서 내부적으로 PI를 레거시 Codex 인증 전송을 통해 라우팅합니다. 오래된 OpenAI PI 세션 고정은 런타임 선택에서 무시되며 `openclaw doctor --fix`로 정리할 수 있습니다.

`openclaw doctor`가 `codex` Plugin이 활성화되어 있는데도 구성에 `openai-codex/*`가 남아 있다고 경고하면, 이를 레거시 경로 상태로 취급하세요. `openclaw doctor --fix`를 실행하여 Codex 런타임을 사용하는 `openai/*`로 다시 작성하세요.

## 호환성 계약

런타임이 PI가 아닌 경우, OpenClaw의 어떤 표면을 지원하는지 문서화해야 합니다. 런타임 문서에는 이 형식을 사용하세요:

| 질문                               | 중요한 이유                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 모델 루프는 누가 소유하나요?               | 재시도, 도구 계속 실행, 최종 답변 결정이 어디에서 발생하는지 결정합니다.                   |
| 정식 스레드 기록은 누가 소유하나요?     | OpenClaw가 기록을 편집할 수 있는지, 아니면 미러링만 할 수 있는지 결정합니다.                                   |
| OpenClaw 동적 도구가 작동하나요?        | 메시징, 세션, Cron, OpenClaw 소유 도구가 이에 의존합니다.                                 |
| 동적 도구 훅이 작동하나요?            | Plugin은 OpenClaw 소유 도구 주변의 `before_tool_call`, `after_tool_call`, 미들웨어를 기대합니다. |
| 네이티브 도구 훅이 작동하나요?             | 셸, 패치, 런타임 소유 도구에는 정책과 관찰을 위한 네이티브 훅 지원이 필요합니다.        |
| 컨텍스트 엔진 수명 주기가 실행되나요? | 메모리와 컨텍스트 Plugin은 assemble, ingest, after-turn, Compaction 수명 주기에 의존합니다.      |
| 어떤 Compaction 데이터가 노출되나요?       | 일부 Plugin에는 알림만 필요하지만, 다른 Plugin에는 유지/삭제된 메타데이터가 필요합니다.                    |
| 의도적으로 지원하지 않는 것은 무엇인가요?     | 네이티브 런타임이 더 많은 상태를 소유하는 경우 사용자가 PI 동등성을 가정해서는 안 됩니다.                  |

Codex 런타임 지원 계약은
[Codex 하네스 런타임](/ko/plugins/codex-harness-runtime#v1-support-contract)에 문서화되어 있습니다.

## 상태 레이블

상태 출력에는 `Execution` 및 `Runtime` 레이블이 모두 표시될 수 있습니다. 이를
공급자 이름이 아니라 진단 정보로 읽으세요.

- `openai/gpt-5.5` 같은 모델 참조는 선택된 공급자/모델을 알려줍니다.
- `codex` 같은 런타임 ID는 어떤 루프가 턴을 실행 중인지 알려줍니다.
- Telegram 또는 Discord 같은 채널 레이블은 대화가 어디에서 진행 중인지 알려줍니다.

실행에 여전히 예상치 못한 런타임이 표시되면 먼저 선택된 공급자/모델
런타임 정책을 검사하세요. 레거시 세션 런타임 핀은 더 이상 라우팅을 결정하지 않습니다.

## 관련 항목

- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)
- [OpenAI](/ko/providers/openai)
- [Agent 하네스 Plugin](/ko/plugins/sdk-agent-harness)
- [Agent 루프](/ko/concepts/agent-loop)
- [모델](/ko/concepts/models)
- [상태](/ko/cli/status)
