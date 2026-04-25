---
read_when:
    - Pi, Codex, ACP 또는 다른 네이티브 에이전트 런타임 중에서 선택하는 중입니다
    - status 또는 config의 provider/model/runtime 레이블이 헷갈립니다
    - 네이티브 harness의 지원 동등성을 문서화하고 있습니다
summary: OpenClaw가 model provider, 모델, 채널, 그리고 에이전트 런타임을 어떻게 분리하는지
title: 에이전트 런타임
x-i18n:
    generated_at: "2026-04-25T05:59:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f492209da2334361060f0827c243d5d845744be906db9ef116ea00384879b33
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

**에이전트 런타임**은 준비된 하나의 모델 루프를 소유하는 구성 요소입니다. 프롬프트를 받아 모델 출력을 구동하고, 네이티브 도구 호출을 처리한 뒤, 완료된 턴을 OpenClaw에 반환합니다.

런타임은 둘 다 모델 구성 근처에 나타나기 때문에 provider와 혼동하기 쉽습니다. 하지만 서로 다른 계층입니다:

| 계층          | 예시                                  | 의미                                                                  |
| ------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | OpenClaw가 인증하고, 모델을 탐색하고, 모델 ref에 이름을 붙이는 방식 |
| 모델          | `gpt-5.5`, `claude-opus-4-6`          | 에이전트 턴에 선택된 모델                                            |
| 에이전트 런타임 | `pi`, `codex`, ACP 기반 런타임         | 준비된 턴을 실행하는 저수준 루프                                     |
| 채널          | Telegram, Discord, Slack, WhatsApp    | 메시지가 OpenClaw로 들어오고 나가는 위치                             |

코드와 config에서는 **harness**라는 단어도 보게 됩니다. harness는 에이전트 런타임을 제공하는 구현체입니다. 예를 들어, 번들된 Codex harness는 `codex` 런타임을 구현합니다. config 키 이름은 호환성을 위해 여전히 `embeddedHarness`이지만, 사용자 대상 문서와 status 출력에서는 일반적으로 런타임이라고 말해야 합니다.

일반적인 Codex 설정은 `openai` provider와 `codex` 런타임을 사용합니다:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

이는 OpenClaw가 OpenAI 모델 ref를 선택한 다음, Codex app-server 런타임에 임베드된 에이전트 턴 실행을 요청한다는 뜻입니다. 채널, 모델 provider 카탈로그, 또는 OpenClaw 세션 저장소가 Codex로 바뀐다는 뜻은 아닙니다.

OpenAI 계열 접두사 분리에 대해서는 [OpenAI](/ko/providers/openai) 및
[모델 provider](/ko/concepts/model-providers)를 참고하세요. Codex 런타임 지원 계약에 대해서는 [Codex harness](/ko/plugins/codex-harness#v1-support-contract)를 참고하세요.

## 런타임 소유권

각 런타임은 루프의 서로 다른 부분을 소유합니다.

| 표면                        | OpenClaw PI 임베디드                   | Codex app-server                                                          |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 모델 루프 소유자            | PI 임베디드 runner를 통한 OpenClaw     | Codex app-server                                                          |
| 정식 thread 상태            | OpenClaw transcript                    | Codex thread + OpenClaw transcript 미러                                  |
| OpenClaw 동적 도구          | 네이티브 OpenClaw 도구 루프            | Codex 어댑터를 통해 브리지됨                                             |
| 네이티브 셸 및 파일 도구    | PI/OpenClaw 경로                       | Codex 네이티브 도구, 지원되는 경우 네이티브 hook을 통해 브리지됨         |
| 컨텍스트 엔진              | 네이티브 OpenClaw 컨텍스트 조립        | OpenClaw가 프로젝트된 컨텍스트를 Codex 턴으로 조립                       |
| Compaction                 | OpenClaw 또는 선택된 컨텍스트 엔진     | Codex 네이티브 Compaction, OpenClaw 알림 및 미러 유지 관리 포함          |
| 채널 전달                   | OpenClaw                               | OpenClaw                                                                  |

이 소유권 분리는 핵심 설계 규칙입니다:

- OpenClaw가 해당 표면을 소유하면, OpenClaw는 일반적인 Plugin hook 동작을 제공할 수 있습니다.
- 네이티브 런타임이 해당 표면을 소유하면, OpenClaw는 런타임 이벤트 또는 네이티브 hook이 필요합니다.
- 네이티브 런타임이 정식 thread 상태를 소유하면, OpenClaw는 지원되지 않는 내부를 다시 쓰기보다 이를 미러링하고 컨텍스트를 투영해야 합니다.

## 런타임 선택

OpenClaw는 provider와 모델 확인 후 임베디드 런타임을 선택합니다:

1. 세션에 기록된 런타임이 우선합니다. config 변경이 기존 transcript를 다른 네이티브 thread 시스템으로 즉시 전환하지는 않습니다.
2. `OPENCLAW_AGENT_RUNTIME=<id>`는 새 세션 또는 리셋된 세션에 대해 해당 런타임을 강제합니다.
3. `agents.defaults.embeddedHarness.runtime` 또는
   `agents.list[].embeddedHarness.runtime`은 `auto`, `pi`, 또는 `codex` 같은 등록된 런타임 id를 설정할 수 있습니다.
4. `auto` 모드에서는 등록된 plugin 런타임이 지원되는 provider/모델 쌍을 claim할 수 있습니다.
5. `auto` 모드에서 어떤 런타임도 턴을 claim하지 않고 `fallback: "pi"`가 설정되어 있으면(기본값), OpenClaw는 호환성 폴백으로 PI를 사용합니다. 일치하지 않는 `auto` 모드 선택을 실패하게 하려면 `fallback: "none"`을 설정하세요.

명시적 plugin 런타임은 기본적으로 fail-closed입니다. 예를 들어 `runtime: "codex"`는, 같은 override 범위에서 `fallback: "pi"`를 설정하지 않는 한 Codex 또는 명확한 선택 오류를 의미합니다. 런타임 override는 더 넓은 범위의 fallback 설정을 상속하지 않으므로, 기본값에 `fallback: "pi"`가 있다고 해서 에이전트 수준의 `runtime: "codex"`가 조용히 PI로 다시 라우팅되지는 않습니다.

## 호환성 계약

런타임이 PI가 아닐 경우, 어떤 OpenClaw 표면을 지원하는지 문서화해야 합니다.
런타임 문서에는 다음 형식을 사용하세요:

| 질문                                   | 중요한 이유                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| 누가 모델 루프를 소유하는가?           | 재시도, 도구 계속 실행, 최종 응답 결정이 어디에서 일어나는지 결정합니다.                     |
| 누가 정식 thread 이력을 소유하는가?    | OpenClaw가 이력을 편집할 수 있는지, 아니면 미러링만 가능한지 결정합니다.                    |
| OpenClaw 동적 도구가 동작하는가?       | 메시징, 세션, Cron, OpenClaw 소유 도구가 이에 의존합니다.                                   |
| 동적 도구 hook이 동작하는가?           | Plugin은 OpenClaw 소유 도구 주변의 `before_tool_call`, `after_tool_call`, middleware를 기대합니다. |
| 네이티브 도구 hook이 동작하는가?       | 셸, 패치, 런타임 소유 도구는 정책 및 관찰을 위해 네이티브 hook 지원이 필요합니다.          |
| 컨텍스트 엔진 lifecycle이 실행되는가?  | 메모리 및 컨텍스트 Plugin은 assemble, ingest, after-turn, Compaction lifecycle에 의존합니다. |
| 어떤 Compaction 데이터가 노출되는가?   | 일부 Plugin은 알림만 필요하고, 다른 Plugin은 유지/삭제된 메타데이터가 필요합니다.          |
| 의도적으로 지원되지 않는 것은 무엇인가? | 사용자는 네이티브 런타임이 더 많은 상태를 소유하는 부분에서 PI와 동등하다고 가정하면 안 됩니다. |

Codex 런타임 지원 계약은
[Codex harness](/ko/plugins/codex-harness#v1-support-contract)에 문서화되어 있습니다.

## status 레이블

status 출력에는 `Execution`과 `Runtime` 레이블이 모두 표시될 수 있습니다. 이를 provider 이름이 아니라 진단 정보로 읽으세요.

- `openai/gpt-5.5` 같은 모델 ref는 선택된 provider/모델을 알려줍니다.
- `codex` 같은 런타임 id는 어떤 루프가 해당 턴을 실행 중인지 알려줍니다.
- Telegram 또는 Discord 같은 채널 레이블은 대화가 어디에서 일어나는지 알려줍니다.

런타임 config를 변경한 뒤에도 세션에 여전히 PI가 표시된다면, `/new`로 새 세션을 시작하거나 `/reset`으로 현재 세션을 지우세요. 기존 세션은 기록된 런타임을 유지하므로, transcript가 서로 호환되지 않는 두 네이티브 세션 시스템을 통해 재생되지 않습니다.

## 관련 항목

- [Codex harness](/ko/plugins/codex-harness)
- [OpenAI](/ko/providers/openai)
- [에이전트 harness Plugin](/ko/plugins/sdk-agent-harness)
- [에이전트 루프](/ko/concepts/agent-loop)
- [모델](/ko/concepts/models)
- [Status](/ko/cli/status)
