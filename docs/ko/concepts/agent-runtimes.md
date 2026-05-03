---
read_when:
    - PI, Codex, ACP 또는 다른 네이티브 에이전트 런타임 중에서 선택하는 경우
    - 상태 또는 구성의 제공자/모델/런타임 레이블이 혼란스럽습니다
    - 네이티브 하네스의 지원 동등성을 문서화하고 있습니다
summary: OpenClaw가 모델 제공업체, 모델, 채널 및 에이전트 런타임을 분리하는 방식
title: 에이전트 런타임
x-i18n:
    generated_at: "2026-05-03T06:16:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cd0e0e8508f88c04db63ebcbbca61d9a023ee661f59ea1ed7a1341b357088c7
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**에이전트 런타임**은 준비된 모델 루프 하나를 소유하는 구성 요소입니다. 이 구성 요소는
프롬프트를 받고, 모델 출력을 구동하며, 네이티브 도구 호출을 처리하고, 완료된 턴을
OpenClaw에 반환합니다.

런타임은 모델 구성 근처에 함께 나타나기 때문에 공급자와 혼동하기 쉽습니다. 둘은 서로
다른 계층입니다.

| 계층          | 예시                                  | 의미                                                                 |
| ------------- | ------------------------------------- | -------------------------------------------------------------------- |
| 공급자        | `openai`, `anthropic`, `openai-codex` | OpenClaw가 인증하고, 모델을 검색하고, 모델 참조 이름을 지정하는 방식입니다. |
| 모델          | `gpt-5.5`, `claude-opus-4-6`          | 에이전트 턴에 선택된 모델입니다.                                      |
| 에이전트 런타임 | `pi`, `codex`, `claude-cli`           | 준비된 턴을 실행하는 저수준 루프 또는 백엔드입니다.                  |
| 채널          | Telegram, Discord, Slack, WhatsApp    | 메시지가 OpenClaw에 들어오고 나가는 위치입니다.                      |

코드에서는 **하네스**라는 단어도 볼 수 있습니다. 하네스는 에이전트 런타임을 제공하는
구현입니다. 예를 들어, 번들된 Codex 하네스는 `codex` 런타임을 구현합니다. 공개 구성은
`agentRuntime.id`를 사용하며, `openclaw doctor --fix`는 이전 런타임 정책 키를 해당
형태로 다시 씁니다.

런타임에는 두 가지 계열이 있습니다.

- **임베디드 하네스**는 OpenClaw의 준비된 에이전트 루프 안에서 실행됩니다. 현재는
  기본 제공 `pi` 런타임과 `codex` 같은 등록된 Plugin 하네스가 여기에 해당합니다.
- **CLI 백엔드**는 모델 참조를 정규 형태로 유지하면서 로컬 CLI 프로세스를 실행합니다.
  예를 들어 `agentRuntime.id: "claude-cli"`와 함께 `anthropic/claude-opus-4-7`을
  사용하면 "Anthropic 모델을 선택하고 Claude CLI를 통해 실행한다"는 뜻입니다.
  `claude-cli`는 임베디드 하네스 ID가 아니며 AgentHarness 선택에 전달해서는 안 됩니다.

## Codex 접점

혼동의 대부분은 서로 다른 여러 접점이 Codex 이름을 공유하는 데서 비롯됩니다.

| 접점                                                 | OpenClaw 이름/구성                         | 수행하는 작업                                                                                               |
| ---------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 네이티브 Codex 앱 서버 런타임                        | `openai/*` 및 `agentRuntime.id: "codex"`   | Codex 앱 서버를 통해 임베디드 에이전트 턴을 실행합니다. 일반적인 ChatGPT/Codex 구독 설정입니다.              |
| Codex OAuth 공급자 경로                              | `openai-codex/*` 모델 참조                 | 일반 OpenClaw PI 러너를 통해 ChatGPT/Codex 구독 OAuth를 사용합니다.                                          |
| Codex ACP 어댑터                                     | `runtime: "acp"`, `agentId: "codex"`       | 외부 ACP/acpx 컨트롤 플레인을 통해 Codex를 실행합니다. ACP/acpx를 명시적으로 요청한 경우에만 사용하세요.     |
| 네이티브 Codex 채팅 제어 명령 세트                   | `/codex ...`                               | 채팅에서 Codex 앱 서버 스레드를 바인딩, 재개, 조정, 중지, 검사합니다.                                        |
| GPT/Codex 스타일 모델용 OpenAI Platform API 경로     | `openai/*` 모델 참조                       | `agentRuntime.id: "codex"` 같은 런타임 재정의가 턴을 실행하지 않는 한 OpenAI API 키 인증을 사용합니다.       |

이 접점들은 의도적으로 독립되어 있습니다. `codex` Plugin을 활성화하면 네이티브 앱 서버
기능을 사용할 수 있게 됩니다. 이는 `openai-codex/*`를 `openai/*`로 다시 쓰지 않고,
기존 세션을 변경하지 않으며, ACP를 Codex 기본값으로 만들지도 않습니다. `openai-codex/*`를
선택한다는 것은 런타임을 별도로 강제하지 않는 한 "Codex OAuth 공급자 경로를 사용한다"는
뜻입니다.

일반적인 ChatGPT/Codex 구독 설정은 인증에 Codex OAuth를 사용하지만, 모델 참조는
`openai/*`로 유지하고 `codex` 런타임을 선택합니다.

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

이는 OpenClaw가 OpenAI 모델 참조를 선택한 다음 Codex 앱 서버 런타임에 임베디드
에이전트 턴 실행을 요청한다는 뜻입니다. "API 과금을 사용한다"는 뜻이 아니며, 채널,
모델 공급자 카탈로그 또는 OpenClaw 세션 저장소가 Codex가 된다는 뜻도 아닙니다.

번들된 `codex` Plugin이 활성화된 경우 자연어 Codex 제어에는 ACP 대신 네이티브
`/codex` 명령 접점(`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`,
`/codex stop`)을 사용해야 합니다. 사용자가 ACP/acpx를 명시적으로 요청하거나 ACP 어댑터
경로를 테스트하는 경우에만 Codex에 ACP를 사용하세요. Claude Code, Gemini CLI, OpenCode,
Cursor 및 유사한 외부 하네스는 계속 ACP를 사용합니다.

에이전트 관점의 결정 트리는 다음과 같습니다.

1. 사용자가 **Codex bind/control/thread/resume/steer/stop**을 요청하면, 번들된 `codex`
   Plugin이 활성화된 경우 네이티브 `/codex` 명령 접점을 사용합니다.
2. 사용자가 **임베디드 런타임으로서의 Codex**를 요청하거나 일반적인 구독 기반 Codex
   에이전트 경험을 원하는 경우, `agentRuntime.id: "codex"`와 함께 `openai/<model>`을
   사용합니다.
3. 사용자가 **일반 OpenClaw 러너에서 Codex OAuth/구독 인증**을 요청하면,
   `openai-codex/<model>`을 사용하고 런타임은 PI로 둡니다.
4. 사용자가 명시적으로 **ACP**, **acpx** 또는 **Codex ACP adapter**라고 말하면,
   `runtime: "acp"` 및 `agentId: "codex"`와 함께 ACP를 사용합니다.
5. 요청이 **Claude Code, Gemini CLI, OpenCode, Cursor, Droid 또는 다른 외부 하네스**에
   대한 것이라면, 네이티브 하위 에이전트 런타임이 아니라 ACP/acpx를 사용합니다.

| 의미하는 것...                         | 사용할 것...                                  |
| --------------------------------------- | --------------------------------------------- |
| Codex 앱 서버 채팅/스레드 제어          | 번들된 `codex` Plugin의 `/codex ...`          |
| Codex 앱 서버 임베디드 에이전트 런타임  | `agentRuntime.id: "codex"`                    |
| PI 러너의 OpenAI Codex OAuth            | `openai-codex/*` 모델 참조                    |
| Claude Code 또는 다른 외부 하네스       | ACP/acpx                                      |

OpenAI 계열 접두사 분리는 [OpenAI](/ko/providers/openai) 및
[모델 공급자](/ko/concepts/model-providers)를 참조하세요. Codex 런타임 지원 계약은
[Codex 하네스](/ko/plugins/codex-harness#v1-support-contract)를 참조하세요.

## 런타임 소유권

런타임마다 소유하는 루프의 범위가 다릅니다.

| 접점                        | OpenClaw PI 임베디드                    | Codex 앱 서버                                                              |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| 모델 루프 소유자            | PI 임베디드 러너를 통한 OpenClaw        | Codex 앱 서버                                                              |
| 정규 스레드 상태            | OpenClaw 트랜스크립트                   | Codex 스레드 및 OpenClaw 트랜스크립트 미러                                 |
| OpenClaw 동적 도구          | 네이티브 OpenClaw 도구 루프             | Codex 어댑터를 통해 브리지됨                                               |
| 네이티브 셸 및 파일 도구    | PI/OpenClaw 경로                        | 지원되는 경우 네이티브 훅을 통해 브리지되는 Codex 네이티브 도구           |
| 컨텍스트 엔진               | 네이티브 OpenClaw 컨텍스트 조립         | OpenClaw 프로젝트가 컨텍스트를 조립해 Codex 턴에 투영함                    |
| Compaction                  | OpenClaw 또는 선택된 컨텍스트 엔진      | OpenClaw 알림 및 미러 유지 관리가 포함된 Codex 네이티브 Compaction        |
| 채널 전달                   | OpenClaw                                | OpenClaw                                                                    |

이 소유권 분리가 핵심 설계 규칙입니다.

- OpenClaw가 접점을 소유하면, OpenClaw는 일반적인 Plugin 훅 동작을 제공할 수 있습니다.
- 네이티브 런타임이 접점을 소유하면, OpenClaw에는 런타임 이벤트 또는 네이티브 훅이 필요합니다.
- 네이티브 런타임이 정규 스레드 상태를 소유하면, OpenClaw는 지원되지 않는 내부를 다시 쓰지 말고 컨텍스트를 미러링하고 투영해야 합니다.

## 런타임 선택

OpenClaw는 공급자 및 모델 해석 이후 임베디드 런타임을 선택합니다.

1. 세션에 기록된 런타임이 우선합니다. 구성 변경은 기존 트랜스크립트를 다른 네이티브
   스레드 시스템으로 즉시 전환하지 않습니다.
2. `OPENCLAW_AGENT_RUNTIME=<id>`는 새 세션 또는 재설정된 세션에 해당 런타임을 강제합니다.
3. `agents.defaults.agentRuntime.id` 또는 `agents.list[].agentRuntime.id`는 `auto`, `pi`,
   `codex` 같은 등록된 임베디드 하네스 ID, 또는 `claude-cli` 같은 지원되는 CLI 백엔드
   별칭을 설정할 수 있습니다.
4. `auto` 모드에서는 등록된 Plugin 런타임이 지원하는 공급자/모델 쌍을 클레임할 수 있습니다.
5. `auto` 모드에서 어떤 런타임도 턴을 클레임하지 않으면, OpenClaw는 호환성 런타임으로
   PI를 사용합니다. 실행이 엄격해야 한다면 명시적 런타임 ID를 사용하세요.

명시적 Plugin 런타임은 닫힌 방식으로 실패합니다. 예를 들어 `agentRuntime.id: "codex"`는
Codex 또는 명확한 선택/런타임 오류를 의미하며, 조용히 PI로 다시 라우팅되는 일은 없습니다.

CLI 백엔드 별칭은 임베디드 하네스 ID와 다릅니다. 권장되는 Claude CLI 형식은 다음과 같습니다.

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

`claude-cli/claude-opus-4-7` 같은 레거시 참조는 호환성을 위해 계속 지원되지만, 새 구성은
공급자/모델을 정규 형태로 유지하고 실행 백엔드를 `agentRuntime.id`에 넣어야 합니다.

`auto` 모드는 의도적으로 보수적입니다. Plugin 런타임은 자신이 이해하는 공급자/모델 쌍을
클레임할 수 있지만, Codex Plugin은 `auto` 모드에서 `openai-codex` 공급자를 클레임하지
않습니다. 이렇게 하면 `openai-codex/*`가 명시적인 PI Codex OAuth 경로로 유지되며,
구독 인증 구성이 네이티브 앱 서버 하네스로 조용히 이동하는 것을 방지합니다.

`codex` Plugin이 활성화되어 있는데 `openai-codex/*`가 여전히 PI를 통해 라우팅된다고
`openclaw doctor`가 경고하면, 이를 마이그레이션이 아니라 진단으로 취급하세요. 원하는 것이
PI Codex OAuth라면 구성을 그대로 유지하세요. 네이티브 Codex 앱 서버 실행을 원하는 경우에만
`openai/<model>` 및 `agentRuntime.id: "codex"`로 전환하세요.

## 호환성 계약

런타임이 PI가 아닌 경우, 지원하는 OpenClaw 접점을 문서화해야 합니다. 런타임 문서에는
다음 형태를 사용하세요.

| 질문                                   | 중요한 이유                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 누가 모델 루프를 소유하나요?           | 재시도, 도구 계속 실행, 최종 답변 결정이 어디에서 일어나는지 결정합니다.                          |
| 누가 정규 스레드 기록을 소유하나요?    | OpenClaw가 기록을 편집할 수 있는지, 아니면 미러링만 할 수 있는지 결정합니다.                       |
| OpenClaw 동적 도구가 작동하나요?       | 메시징, 세션, Cron 및 OpenClaw 소유 도구가 여기에 의존합니다.                                      |
| 동적 도구 훅이 작동하나요?             | Plugin은 OpenClaw 소유 도구 주변의 `before_tool_call`, `after_tool_call`, 미들웨어를 기대합니다.  |
| 네이티브 도구 훅이 작동하나요?         | 셸, 패치 및 런타임 소유 도구에는 정책과 관찰을 위한 네이티브 훅 지원이 필요합니다.                 |
| 컨텍스트 엔진 수명 주기가 실행되나요?  | 메모리 및 컨텍스트 Plugin은 assemble, ingest, after-turn 및 Compaction 수명 주기에 의존합니다.     |
| 어떤 Compaction 데이터가 노출되나요?   | 일부 Plugin은 알림만 필요하지만, 다른 Plugin은 유지/삭제 메타데이터가 필요합니다.                  |
| 의도적으로 지원하지 않는 것은 무엇인가요? | 네이티브 런타임이 더 많은 상태를 소유하는 곳에서 사용자가 PI와 동등하다고 가정해서는 안 됩니다.   |

Codex 런타임 지원 계약은
[Codex 하네스](/ko/plugins/codex-harness#v1-support-contract)에 문서화되어 있습니다.

## 상태 레이블

상태 출력에는 `Execution` 및 `Runtime` 레이블이 모두 표시될 수 있습니다. 이를
제공자 이름이 아니라 진단 정보로 읽으세요.

- `openai/gpt-5.5` 같은 모델 참조는 선택된 제공자/모델을 알려줍니다.
- `codex` 같은 런타임 ID는 어떤 루프가 해당 턴을 실행하는지 알려줍니다.
- Telegram 또는 Discord 같은 채널 레이블은 대화가 어디에서 이루어지고 있는지 알려줍니다.

런타임 설정을 변경한 뒤에도 세션에 PI가 계속 표시되면 `/new`로 새 세션을 시작하거나
`/reset`으로 현재 세션을 지우세요. 기존 세션은 기록된 런타임을 유지하므로,
전사 내용이 서로 호환되지 않는 두 네이티브 세션 시스템을 통해 다시 재생되지 않습니다.

## 관련 항목

- [Codex 하네스](/ko/plugins/codex-harness)
- [OpenAI](/ko/providers/openai)
- [에이전트 하네스 plugins](/ko/plugins/sdk-agent-harness)
- [에이전트 루프](/ko/concepts/agent-loop)
- [모델](/ko/concepts/models)
- [상태](/ko/cli/status)
