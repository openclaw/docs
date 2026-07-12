---
read_when:
    - OpenClaw, Codex, ACP 또는 다른 네이티브 에이전트 런타임 중에서 선택하고 있습니다
    - 상태 또는 구성의 제공자/모델/런타임 레이블이 혼동되는 경우
    - 네이티브 하니스의 지원 동등성을 문서화하고 있습니다
summary: OpenClaw이 모델 제공자, 모델, 채널 및 에이전트 런타임을 구분하는 방식
title: 에이전트 런타임
x-i18n:
    generated_at: "2026-07-12T00:40:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**에이전트 런타임**은 준비된 하나의 모델 루프를 담당합니다. 프롬프트를 받고,
모델 출력을 구동하며, 네이티브 도구 호출을 처리하고, 완료된 턴을
OpenClaw에 반환합니다.

런타임과 제공자는 모두 모델 구성 주변에 표시되므로 혼동하기 쉽습니다.
하지만 둘은 서로 다른 계층입니다.

| 계층           | 예시                                         | 의미                                                                  |
| -------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| 제공자         | `anthropic`, `github-copilot`, `openai`      | OpenClaw가 인증하고, 모델을 검색하며, 모델 참조에 이름을 지정하는 방식입니다. |
| 모델           | `claude-opus-4-6`, `gpt-5.6-sol`             | 에이전트 턴에 선택된 모델입니다.                                      |
| 에이전트 런타임 | `claude-cli`, `codex`, `copilot`, `openclaw` | 준비된 턴을 실행하는 저수준 루프 또는 백엔드입니다.                    |
| 채널           | Discord, Slack, Telegram, WhatsApp           | 메시지가 OpenClaw로 들어오고 나가는 위치입니다.                       |

**하네스**는 에이전트 런타임을 제공하는 구현체를 뜻하는 코드 용어입니다.
예를 들어 번들 Codex 하네스는 `codex` 런타임을 구현합니다.
공개 구성에서는 제공자 또는 모델 항목의 `agentRuntime.id`를 사용하며, 전체 에이전트
런타임 키는 레거시이므로 무시됩니다. `openclaw doctor --fix`는 기존
전체 에이전트 런타임 고정을 제거하고, 필요한 경우 레거시 런타임 모델 참조를 정규
제공자/모델 참조와 모델 범위 런타임 정책으로 다시 작성합니다.

런타임 계열은 두 가지입니다.

- **임베디드 하네스**는 OpenClaw의 준비된 에이전트 루프 내부에서 실행됩니다.
  여기에는 기본 제공 `openclaw` 런타임과 `codex`, `copilot` 같은 등록된
  Plugin 하네스가 포함됩니다.
- **CLI 백엔드**는 모델 참조를 정규 형식으로 유지하면서 로컬 CLI 프로세스를
  실행합니다. 예를 들어 모델 범위의 `agentRuntime.id: "claude-cli"`가 지정된
  `anthropic/claude-opus-4-8`은 "Anthropic 모델을 선택하고 Claude CLI를 통해
  실행한다"는 의미입니다. `claude-cli`는 임베디드 하네스 ID가 아니므로
  AgentHarness 선택에 전달해서는 안 됩니다.

`copilot` 하네스는 GitHub Copilot CLI를 위한 별도의 선택형 외부 Plugin
하네스입니다. PI, Codex, GitHub Copilot 에이전트 런타임 중에서 사용자가 선택하는
방법은 [GitHub Copilot 에이전트 런타임](/ko/plugins/copilot)을 참조하세요.

## Codex 표면

여러 표면이 Codex라는 이름을 공유합니다.

| 표면                                             | OpenClaw 이름/구성                     | 기능                                                                                                           |
| ------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 네이티브 Codex 앱 서버 런타임                    | `openai/*` 모델 참조                   | Codex 앱 서버를 통해 OpenAI 임베디드 에이전트 턴을 실행합니다. 일반적인 ChatGPT/Codex 구독 설정입니다.       |
| Codex OAuth 인증 프로필                          | `openai` OAuth 프로필                  | Codex 앱 서버 하네스가 사용하는 ChatGPT/Codex 구독 인증을 저장합니다.                                         |
| Codex ACP 어댑터                                 | `runtime: "acp"`, `agentId: "codex"`   | 외부 ACP/acpx 제어 평면을 통해 Codex를 실행합니다. ACP/acpx가 명시적으로 요청된 경우에만 사용하세요.           |
| 네이티브 Codex 채팅 제어 명령 집합               | `/codex ...`                           | 채팅에서 Codex 앱 서버 스레드를 연결하고, 재개하고, 조정하고, 중지하고, 검사합니다.                            |
| 비에이전트 표면용 OpenAI Platform API 경로       | `openai/*` 및 API 키 인증              | 이미지, 임베딩, 음성, 실시간 기능과 같은 직접 OpenAI API입니다.                                               |

이 표면들은 의도적으로 서로 독립되어 있습니다. `codex` Plugin을 활성화하면
네이티브 앱 서버 기능을 사용할 수 있으며, `openclaw doctor --fix`는 레거시 Codex
경로 복구와 오래된 세션 고정 정리를 담당합니다. 이제 에이전트 모델에 `openai/*`를
선택하면 비에이전트 OpenAI API 표면을 사용하는 경우를 제외하고 "Codex를 통해
실행한다"는 의미입니다.

일반적인 ChatGPT/Codex 구독 설정은 인증에 Codex OAuth를 사용하지만,
모델 참조는 `openai/*`로 유지하고 `codex` 런타임을 선택합니다.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

이는 OpenClaw가 OpenAI 모델 참조를 선택한 다음 Codex 앱 서버 런타임에
임베디드 에이전트 턴 실행을 요청한다는 의미입니다. "API 요금 청구를 사용한다"는
의미가 아니며, 채널, 모델 제공자 카탈로그 또는 OpenClaw 세션 저장소가 Codex로
바뀐다는 의미도 아닙니다.

번들 `codex` Plugin이 활성화된 경우 ACP 대신 네이티브 `/codex` 명령
표면(`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`,
`/codex stop`)을 사용하여 자연어로 Codex를 제어하세요. 사용자가 ACP/acpx를
명시적으로 요청했거나 ACP 어댑터 경로를 테스트하는 경우에만 Codex에 ACP를
사용하세요. Claude Code, Gemini CLI, OpenCode, Cursor 및 이와 유사한 외부
하네스는 계속 ACP를 사용합니다.

결정 트리:

1. **Codex 연결/제어/스레드/재개/조정/중지** -> 번들 `codex` Plugin이 활성화된 경우 네이티브 `/codex` 명령 표면을 사용합니다.
2. **임베디드 런타임으로서의 Codex** 또는 일반적인 구독 기반 Codex 에이전트 환경 -> `openai/<model>`.
3. **OpenAI 모델에 OpenClaw를 명시적으로 선택** -> 모델 참조를 `openai/<model>`로 유지하고 제공자/모델 런타임 정책을 `agentRuntime.id: "openclaw"`로 설정합니다. 선택된 `openai` OAuth 프로필은 OpenClaw의 Codex 인증 전송 계층을 통해 내부적으로 라우팅됩니다.
4. **구성의 레거시 Codex 모델 참조** -> `openclaw doctor --fix`를 사용하여 `openai/<model>`로 복구합니다. 기존 모델 참조에 해당 의도가 내포된 경우 doctor는 제공자/모델 범위의 `agentRuntime.id: "codex"`를 추가하여 Codex 인증 경로를 유지합니다. 레거시 **`codex-cli/*`** 모델 참조도 동일한 `openai/<model>` Codex 앱 서버 경로로 복구됩니다. OpenClaw는 더 이상 번들 Codex CLI 백엔드를 유지하지 않습니다.
5. **ACP, acpx 또는 Codex ACP 어댑터가 명시적으로 요청됨** -> `runtime: "acp"` 및 `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid 또는 다른 외부 하네스** -> 네이티브 하위 에이전트 런타임이 아닌 ACP/acpx를 사용합니다.

| 의도하는 대상...                        | 사용할 항목...                               |
| --------------------------------------- | -------------------------------------------- |
| Codex 앱 서버 채팅/스레드 제어          | 번들 `codex` Plugin의 `/codex ...`           |
| Codex 앱 서버 임베디드 에이전트 런타임  | `openai/*` 에이전트 모델 참조                |
| OpenAI Codex OAuth                      | `openai` OAuth 프로필                        |
| Claude Code 또는 기타 외부 하네스       | ACP/acpx                                     |

OpenAI 계열 접두사 구분은 [OpenAI](/ko/providers/openai) 및
[모델 제공자](/ko/concepts/model-providers)를 참조하세요. Codex 런타임 지원
계약은 [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime#v1-support-contract)을 참조하세요.

## 런타임 소유권

런타임마다 루프에서 담당하는 범위가 다릅니다.

| 표면                       | OpenClaw 임베디드                                | Codex 앱 서버                                                               |
| -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| 모델 루프 소유자           | OpenClaw 임베디드 실행기를 통한 OpenClaw         | Codex 앱 서버                                                               |
| 정규 스레드 상태           | OpenClaw 트랜스크립트                            | Codex 스레드 및 OpenClaw 트랜스크립트 미러                                  |
| OpenClaw 동적 도구         | 네이티브 OpenClaw 도구 루프                      | Codex 어댑터를 통해 브리지됨                                                 |
| 네이티브 셸 및 파일 도구   | OpenClaw 경로                                    | 지원되는 경우 네이티브 훅을 통해 브리지되는 Codex 네이티브 도구             |
| 컨텍스트 엔진              | 네이티브 OpenClaw 컨텍스트 구성                  | OpenClaw가 구성된 컨텍스트를 Codex 턴에 투영                                 |
| Compaction                 | OpenClaw 또는 선택된 컨텍스트 엔진               | OpenClaw 알림 및 미러 유지 관리를 포함한 Codex 네이티브 Compaction           |
| 채널 전달                  | OpenClaw                                         | OpenClaw                                                                    |

설계 규칙: OpenClaw가 표면을 소유하면 일반적인 Plugin 훅 동작을 제공할 수
있습니다. 네이티브 런타임이 표면을 소유하면 OpenClaw에는 런타임 이벤트 또는
네이티브 훅이 필요합니다. 네이티브 런타임이 정규 스레드 상태를 소유하면 OpenClaw는
지원되지 않는 내부 요소를 다시 작성하는 대신 컨텍스트를 미러링하고 투영합니다.

## 런타임 선택

OpenClaw는 제공자와 모델을 해석한 후 다음 순서로 임베디드 런타임을
결정합니다.

1. **모델 범위 런타임 정책**이 우선합니다. 이 정책은 구성된 제공자 모델
   항목이나 `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`에 있습니다. 정확한
   모델 정책 다음에는 `agents.defaults.models["vllm/*"].agentRuntime` 같은
   제공자 와일드카드가 적용되므로, 동적으로 검색된 제공자 모델들이 모델별 예외를
   재정의하지 않고 하나의 런타임을 공유할 수 있습니다.
2. **제공자 범위 런타임 정책**: `models.providers.<provider>.agentRuntime`.
3. **`auto` 모드**: 등록된 Plugin 런타임이 지원되는 제공자/모델 쌍을 맡을 수 있습니다.
4. `auto` 모드에서 어떤 런타임도 턴을 맡지 않으면 OpenClaw는 호환성 런타임인
   `openclaw`로 폴백합니다. 실행을 엄격하게 제한해야 한다면 명시적인 런타임 ID를
   사용하세요.

전체 세션 및 전체 에이전트 런타임 고정은 무시됩니다.
`OPENCLAW_AGENT_RUNTIME`, 세션 `agentHarnessId`/`agentRuntimeOverride` 상태,
`agents.defaults.agentRuntime`, `agents.list[].agentRuntime`이 이에 해당합니다.
`openclaw doctor --fix`를 실행하여 오래된 전체 에이전트 런타임 구성을 제거하고,
의도를 유지할 수 있는 경우 레거시 런타임 모델 참조를 변환하세요.

명시적인 제공자/모델 Plugin 런타임은 실패 시 차단됩니다. 제공자 또는 모델의
`agentRuntime.id: "codex"`는 Codex를 의미하며, 그렇지 않으면 명확한 선택/런타임
오류가 발생합니다. 절대로 OpenClaw로 자동 라우팅되지 않습니다. 일치하지 않는 턴을
OpenClaw로 라우팅할 수 있는 것은 `auto`뿐입니다.

CLI 백엔드 별칭은 임베디드 하네스 ID와 다릅니다. 권장 Claude CLI 형식:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

`claude-cli/claude-opus-4-7` 같은 레거시 참조는 호환성을 위해 계속
지원되지만, 새 구성에서는 제공자/모델을 정규 형식으로 유지하고 실행 백엔드를
제공자/모델 런타임 정책에 지정해야 합니다.

레거시 `codex-cli/*` 참조는 다르게 처리됩니다. doctor는 Codex CLI 백엔드를
유지하는 대신 Codex 앱 서버 하네스를 통해 실행되도록 이를 `openai/*`로
마이그레이션합니다.

`auto` 모드는 대부분의 제공자에 대해 의도적으로 보수적으로 동작합니다. OpenAI
에이전트 모델은 예외입니다. 런타임 미설정과 `auto`는 모두 Codex 하네스로
해석됩니다. 명시적인 OpenClaw 런타임 구성은 `openai/*` 에이전트 턴을 위한 선택형
호환성 경로로 유지됩니다. 선택된 `openai` OAuth 프로필과 함께 사용하는 경우
OpenClaw는 공개 모델 참조를 `openai/*`로 유지하면서 해당 경로를 Codex 인증 전송
계층을 통해 내부적으로 라우팅합니다. 오래된 OpenAI 런타임 세션 고정은 런타임
선택에서 무시되며 `openclaw doctor --fix`로 정리할 수 있습니다.

레거시 Codex 모델 참조가 구성에 남아 있는 상태에서 `codex` Plugin이 활성화되어
있다고 `openclaw doctor`가 경고하면, 이를 레거시 경로 상태로 간주하고
`openclaw doctor --fix`를 실행하여 Codex 런타임이 적용된 `openai/*`로 다시
작성하세요.

## GitHub Copilot 에이전트 런타임

외부 `@openclaw/copilot` Plugin은 GitHub Copilot CLI(`@github/copilot-sdk`)를 기반으로 하는 옵트인 `copilot` 런타임을 등록합니다. 이 Plugin은 표준 구독 `github-copilot` 제공자를 소유하며, `auto`에 의해 선택되는 경우는 **절대** 없습니다. `agentRuntime.id`를 통해 모델별 또는 제공자별로 옵트인하세요.

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

하네스는 `extensions/copilot/doctor-contract-api.ts`에서 제공자, 런타임, CLI 세션 키 및 인증 프로필 접두사를 선언하며, `openclaw doctor`가 이를 자동으로 로드합니다. 구성, 인증, 트랜스크립트 미러링, Compaction, 선언적 doctor 계약 및 더 광범위한 PI와 Codex와 Copilot SDK 간의 결정에 관한 내용은 [GitHub Copilot 에이전트 런타임](/ko/plugins/copilot)을 참조하세요.

## 호환성 계약

런타임이 OpenClaw가 아닌 경우 해당 문서에는 지원하는 OpenClaw 표면이 명시되어야 합니다.

| 질문 | 중요한 이유 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 모델 루프의 소유자는 누구인가요? | 재시도, 도구 실행 지속 및 최종 답변 결정이 이루어지는 위치를 결정합니다. |
| 표준 스레드 기록의 소유자는 누구인가요? | OpenClaw가 기록을 편집할 수 있는지, 아니면 미러링만 할 수 있는지를 결정합니다. |
| OpenClaw 동적 도구가 작동하나요? | 메시징, 세션, Cron 및 OpenClaw 소유 도구가 이에 의존합니다. |
| 동적 도구 훅이 작동하나요? | Plugin은 OpenClaw 소유 도구를 둘러싼 `before_tool_call`, `after_tool_call` 및 미들웨어가 작동할 것으로 예상합니다. |
| 네이티브 도구 훅이 작동하나요? | 셸, 패치 및 런타임 소유 도구에는 정책 적용과 관찰을 위한 네이티브 훅 지원이 필요합니다. |
| 컨텍스트 엔진 수명 주기가 실행되나요? | 메모리 및 컨텍스트 Plugin은 조립, 수집, 턴 이후 처리 및 Compaction 수명 주기에 의존합니다. |
| 어떤 Compaction 데이터가 노출되나요? | 일부 Plugin에는 알림만 필요하지만, 다른 Plugin에는 유지되거나 삭제된 항목의 메타데이터가 필요합니다. |
| 의도적으로 지원하지 않는 것은 무엇인가요? | 네이티브 런타임이 더 많은 상태를 소유하는 경우 사용자는 OpenClaw와 동등하다고 가정해서는 안 됩니다. |

Codex 런타임 지원 계약은 [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime#v1-support-contract)에 문서화되어 있습니다.

## 상태 레이블

상태 출력에는 `Execution`과 `Runtime` 레이블이 모두 표시될 수 있습니다. 이를 제공자 이름이 아닌 진단 정보로 해석하세요.

- `openai/gpt-5.6-sol`과 같은 모델 참조는 선택된 제공자/모델입니다.
- `codex`와 같은 런타임 ID는 해당 턴을 실행하는 루프입니다.
- Telegram이나 Discord와 같은 채널 레이블은 대화가 진행되는 위치입니다.

실행에 예상치 못한 런타임이 표시되면 먼저 선택된 제공자/모델의 런타임 정책을 확인하세요. 레거시 세션 런타임 고정은 더 이상 라우팅을 결정하지 않습니다.

## 관련 항목

- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)
- [GitHub Copilot 에이전트 런타임](/ko/plugins/copilot)
- [OpenAI](/ko/providers/openai)
- [에이전트 하네스 Plugin](/ko/plugins/sdk-agent-harness)
- [에이전트 루프](/ko/concepts/agent-loop)
- [모델](/ko/concepts/models)
- [상태](/ko/cli/status)
