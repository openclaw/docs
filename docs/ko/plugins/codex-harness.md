---
read_when:
    - 번들로 제공되는 Codex app-server 하네스를 사용하려는 경우
    - Codex 하니스 구성 예제가 필요합니다
    - Codex 전용 배포가 PI로 폴백하는 대신 실패하도록 하려는 경우
summary: 번들된 Codex 앱 서버 하네스를 통해 OpenClaw 임베디드 에이전트 턴을 실행합니다
title: Codex 하네스
x-i18n:
    generated_at: "2026-04-30T06:41:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

번들 `codex` Plugin은 OpenClaw가 내장 PI 하네스 대신 Codex app-server를 통해 임베디드 에이전트 턴을 실행할 수 있게 합니다.

저수준 에이전트 세션을 Codex가 소유하게 하려는 경우에 사용하세요. 여기에는 모델 발견, 네이티브 스레드 재개, 네이티브 Compaction, app-server 실행이 포함됩니다. OpenClaw는 계속 채팅 채널, 세션 파일, 모델 선택, 도구, 승인, 미디어 전달, 보이는 대화 기록 미러를 소유합니다.

방향을 잡고 있다면 [에이전트 런타임](/ko/concepts/agent-runtimes)부터 시작하세요. 짧게 말하면 `openai/gpt-5.5`는 모델 참조이고, `codex`는 런타임이며, Telegram, Discord, Slack 또는 다른 채널은 계속 통신 표면으로 남습니다.

## 이 Plugin이 변경하는 것

번들 `codex` Plugin은 여러 개별 기능을 제공합니다.

| 기능                              | 사용 방법                                           | 수행하는 작업                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 네이티브 임베디드 런타임          | `agentRuntime.id: "codex"`                          | Codex app-server를 통해 OpenClaw 임베디드 에이전트 턴을 실행합니다.             |
| 네이티브 채팅 제어 명령           | `/codex bind`, `/codex resume`, `/codex steer`, ... | 메시징 대화에서 Codex app-server 스레드를 바인딩하고 제어합니다.                |
| Codex app-server 제공자/카탈로그  | `codex` 내부 요소, 하네스를 통해 노출됨             | 런타임이 app-server 모델을 발견하고 검증할 수 있게 합니다.                    |
| Codex 미디어 이해 경로            | `codex/*` 이미지 모델 호환성 경로                   | 지원되는 이미지 이해 모델에 대해 제한된 Codex app-server 턴을 실행합니다.      |
| 네이티브 훅 릴레이                | Codex 네이티브 이벤트 주변의 Plugin 훅              | OpenClaw가 지원되는 Codex 네이티브 도구/종료 이벤트를 관찰/차단할 수 있게 합니다. |

Plugin을 활성화하면 이러한 기능을 사용할 수 있습니다. 다음을 수행하지는 **않습니다**.

- 모든 OpenAI 모델에 대해 Codex 사용 시작
- `openai-codex/*` 모델 참조를 네이티브 런타임으로 변환
- ACP/acpx를 기본 Codex 경로로 만들기
- 이미 PI 런타임을 기록한 기존 세션을 핫스위치
- OpenClaw 채널 전달, 세션 파일, 인증 프로필 저장소 또는 메시지 라우팅 대체

동일한 Plugin은 네이티브 `/codex` 채팅 제어 명령 표면도 소유합니다. Plugin이 활성화되어 있고 사용자가 채팅에서 Codex 스레드를 바인딩, 재개, 조향, 중지 또는 검사하라고 요청하는 경우 에이전트는 ACP보다 `/codex ...`를 선호해야 합니다. ACP는 사용자가 ACP/acpx를 요청하거나 ACP Codex 어댑터를 테스트하는 경우의 명시적 폴백으로 남습니다.

네이티브 Codex 턴은 OpenClaw Plugin 훅을 공개 호환성 계층으로 유지합니다. 이것들은 프로세스 내부 OpenClaw 훅이며, Codex `hooks.json` 명령 훅이 아닙니다.

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- 미러링된 대화 기록 레코드를 위한 `before_message_write`
- Codex `Stop` 릴레이를 통한 `before_agent_finalize`
- `agent_end`

Plugin은 런타임 중립 도구 결과 미들웨어도 등록하여, OpenClaw가 도구를 실행한 뒤 결과가 Codex로 반환되기 전에 OpenClaw 동적 도구 결과를 다시 작성할 수 있습니다. 이는 OpenClaw가 소유한 대화 기록 도구 결과 쓰기를 변환하는 공개 `tool_result_persist` Plugin 훅과 별개입니다.

Plugin 훅 의미 자체는 [Plugin 훅](/ko/plugins/hooks) 및 [Plugin 가드 동작](/ko/tools/plugin)을 참조하세요.

하네스는 기본적으로 꺼져 있습니다. 새 구성은 OpenAI 모델 참조를 `openai/gpt-*`로 정식 유지하고, 네이티브 app-server 실행을 원할 때 `agentRuntime.id: "codex"` 또는 `OPENCLAW_AGENT_RUNTIME=codex`를 명시적으로 강제해야 합니다. 레거시 `codex/*` 모델 참조는 호환성을 위해 여전히 하네스를 자동 선택하지만, 런타임 기반 레거시 제공자 접두사는 일반 모델/제공자 선택지로 표시되지 않습니다.

`codex` Plugin이 활성화되어 있지만 기본 모델이 여전히 `openai-codex/*`이면 `openclaw doctor`는 경로를 변경하는 대신 경고합니다. 이는 의도된 동작입니다. `openai-codex/*`는 계속 PI Codex OAuth/구독 경로로 남고, 네이티브 app-server 실행은 명시적 런타임 선택으로 유지됩니다.

## 경로 맵

구성을 변경하기 전에 이 표를 사용하세요.

| 원하는 동작                                  | 모델 참조                  | 런타임 구성                            | Plugin 요구 사항            | 예상 상태 레이블              |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 일반 OpenClaw 러너를 통한 OpenAI API        | `openai/gpt-*`             | 생략 또는 `runtime: "pi"`              | OpenAI 제공자               | `Runtime: OpenClaw Pi Default` |
| PI를 통한 Codex OAuth/구독                  | `openai-codex/gpt-*`       | 생략 또는 `runtime: "pi"`              | OpenAI Codex OAuth 제공자   | `Runtime: OpenClaw Pi Default` |
| 네이티브 Codex app-server 임베디드 턴       | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` Plugin              | `Runtime: OpenAI Codex`        |
| 보수적 자동 모드의 혼합 제공자              | 제공자별 참조              | `agentRuntime.id: "auto"`              | 선택적 Plugin 런타임        | 선택된 런타임에 따라 다름      |
| 명시적 Codex ACP 어댑터 세션                | ACP 프롬프트/모델에 따라 다름 | `sessions_spawn` with `runtime: "acp"` | 정상 `acpx` 백엔드          | ACP 작업/세션 상태             |

중요한 구분은 제공자와 런타임입니다.

- `openai-codex/*`는 "PI가 어떤 제공자/인증 경로를 사용해야 하는가?"에 답합니다.
- `agentRuntime.id: "codex"`는 "어떤 루프가 이 임베디드 턴을 실행해야 하는가?"에 답합니다.
- `/codex ...`는 "이 채팅이 어떤 네이티브 Codex 대화에 바인딩되거나 이를 제어해야 하는가?"에 답합니다.
- ACP는 "acpx가 어떤 외부 하네스 프로세스를 실행해야 하는가?"에 답합니다.

## 올바른 모델 접두사 선택

OpenAI 계열 경로는 접두사별로 구분됩니다. PI를 통한 Codex OAuth를 원하면 `openai-codex/*`를 사용하고, 직접 OpenAI API 액세스를 원하거나 네이티브 Codex app-server 하네스를 강제하는 경우에는 `openai/*`를 사용하세요.

| 모델 참조                                      | 런타임 경로                                  | 사용 시점                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI 배관을 통한 OpenAI 제공자        | `OPENAI_API_KEY`로 현재 직접 OpenAI Platform API 액세스를 원할 때.          |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI를 통한 OpenAI Codex OAuth        | 기본 PI 러너에서 ChatGPT/Codex 구독 인증을 원할 때.                        |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server 하네스                      | 임베디드 에이전트 턴에 대해 네이티브 Codex app-server 실행을 원할 때.       |

GPT-5.5는 현재 OpenClaw에서 구독/OAuth 전용입니다. PI OAuth에는 `openai-codex/gpt-5.5`를 사용하거나, Codex app-server 하네스와 함께 `openai/gpt-5.5`를 사용하세요. OpenAI가 공개 API에서 GPT-5.5를 활성화하면 `openai/gpt-5.5`에 대한 직접 API 키 액세스가 지원됩니다.

레거시 `codex/gpt-*` 참조는 호환성 별칭으로 계속 허용됩니다. Doctor 호환성 마이그레이션은 레거시 기본 런타임 참조를 정식 모델 참조로 다시 쓰고 런타임 정책을 별도로 기록하지만, 폴백 전용 레거시 참조는 런타임이 전체 에이전트 컨테이너에 대해 구성되므로 변경하지 않습니다. 새 PI Codex OAuth 구성은 `openai-codex/gpt-*`를 사용해야 하며, 새 네이티브 app-server 하네스 구성은 `agentRuntime.id: "codex"`와 함께 `openai/gpt-*`를 사용해야 합니다.

`agents.defaults.imageModel`도 동일한 접두사 구분을 따릅니다. 이미지 이해가 OpenAI Codex OAuth 제공자 경로를 통해 실행되어야 하면 `openai-codex/gpt-*`를 사용하세요. 이미지 이해가 제한된 Codex app-server 턴을 통해 실행되어야 하면 `codex/gpt-*`를 사용하세요. Codex app-server 모델은 이미지 입력 지원을 광고해야 합니다. 텍스트 전용 Codex 모델은 미디어 턴이 시작되기 전에 실패합니다.

현재 세션의 유효 하네스를 확인하려면 `/status`를 사용하세요. 선택이 예상과 다르면 `agents/harness` 하위 시스템의 디버그 로깅을 활성화하고 Gateway의 구조화된 `agent harness selected` 레코드를 검사하세요. 여기에는 선택된 하네스 ID, 선택 이유, 런타임/폴백 정책, 그리고 `auto` 모드에서는 각 Plugin 후보의 지원 결과가 포함됩니다.

### Doctor 경고의 의미

다음이 모두 참일 때 `openclaw doctor`가 경고합니다.

- 번들 `codex` Plugin이 활성화되었거나 허용됨
- 에이전트의 기본 모델이 `openai-codex/*`
- 해당 에이전트의 유효 런타임이 `codex`가 아님

이 경고는 사용자가 종종 "Codex Plugin 활성화"가 "네이티브 Codex app-server 런타임"을 의미한다고 기대하기 때문에 존재합니다. OpenClaw는 그런 추론을 하지 않습니다. 이 경고의 의미는 다음과 같습니다.

- PI를 통한 ChatGPT/Codex OAuth를 의도했다면 **변경이 필요하지 않습니다**.
- 네이티브 app-server 실행을 의도했다면 모델을 `openai/<model>`로 변경하고 `agentRuntime.id: "codex"`를 설정하세요.
- 런타임 변경 후에도 기존 세션에는 `/new` 또는 `/reset`이 필요합니다. 세션 런타임 핀은 고정적이기 때문입니다.

하네스 선택은 라이브 세션 제어가 아닙니다. 임베디드 턴이 실행될 때 OpenClaw는 선택된 하네스 ID를 해당 세션에 기록하고 같은 세션 ID의 이후 턴에도 계속 사용합니다. 향후 세션이 다른 하네스를 사용하도록 하려면 `agentRuntime` 구성 또는 `OPENCLAW_AGENT_RUNTIME`을 변경하세요. 기존 대화를 PI와 Codex 사이에서 전환하기 전에 `/new` 또는 `/reset`으로 새 세션을 시작하세요. 이렇게 하면 하나의 대화 기록을 호환되지 않는 두 네이티브 세션 시스템에서 재생하는 일을 피할 수 있습니다.

하네스 핀이 생기기 전에 생성된 레거시 세션은 대화 기록이 있으면 PI에 핀된 것으로 처리됩니다. 구성을 변경한 뒤 해당 대화를 Codex로 전환하려면 `/new` 또는 `/reset`을 사용하세요.

`/status`는 유효 모델 런타임을 표시합니다. 기본 PI 하네스는 `Runtime: OpenClaw Pi Default`로 표시되고, Codex app-server 하네스는 `Runtime: OpenAI Codex`로 표시됩니다.

## 요구 사항

- 번들 `codex` Plugin을 사용할 수 있는 OpenClaw.
- Codex app-server `0.125.0` 이상. 번들 Plugin은 기본적으로 호환되는 Codex app-server 바이너리를 관리하므로, `PATH`의 로컬 `codex` 명령은 일반 하네스 시작에 영향을 주지 않습니다.
- app-server 프로세스 또는 OpenClaw의 Codex 인증 브리지에서 사용할 수 있는 Codex 인증.

Plugin은 오래되었거나 버전이 없는 app-server 핸드셰이크를 차단합니다. 이렇게 하면 OpenClaw가 테스트된 프로토콜 표면에 머물게 됩니다.

라이브 및 Docker 스모크 테스트의 경우 인증은 일반적으로 Codex CLI 계정 또는 OpenClaw `openai-codex` 인증 프로필에서 옵니다. 로컬 stdio app-server 실행은 계정이 없을 때 `CODEX_API_KEY` / `OPENAI_API_KEY`로 폴백할 수도 있습니다.

## 최소 구성

`openai/gpt-5.5`를 사용하고, 번들 Plugin을 활성화한 뒤, `codex` 하네스를 강제하세요.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
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

구성이 `plugins.allow`를 사용한다면 거기에도 `codex`를 포함하세요.

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

`agents.defaults.model` 또는 에이전트 모델을 `codex/<model>`로 설정하는 레거시 구성은 여전히 번들 `codex` Plugin을 자동 활성화합니다. 새 구성은 위의 명시적 `agentRuntime` 항목과 함께 `openai/<model>`을 선호해야 합니다.

## 다른 모델과 함께 Codex 추가

같은 에이전트가 Codex와 비 Codex 제공자 모델 사이를 자유롭게 전환해야 한다면 `agentRuntime.id: "codex"`를 전역으로 설정하지 마세요. 강제된 런타임은 해당 에이전트 또는 세션의 모든 임베디드 턴에 적용됩니다. 그 런타임이 강제된 상태에서 Anthropic 모델을 선택하면, OpenClaw는 해당 턴을 조용히 PI로 라우팅하는 대신 여전히 Codex 하네스를 시도하고 실패 폐쇄됩니다.

대신 다음 형태 중 하나를 사용하세요.

- 전용 에이전트에 `agentRuntime.id: "codex"`로 Codex를 배치합니다.
- 일반적인 혼합 공급자 사용을 위해 기본 에이전트는 `agentRuntime.id: "auto"`와 PI 폴백으로 유지합니다.
- 레거시 `codex/*` 참조는 호환성 목적으로만 사용합니다. 새 구성은
  `openai/*`와 명시적인 Codex 런타임 정책을 선호해야 합니다.

예를 들어, 다음은 기본 에이전트를 일반 자동 선택에 유지하고
별도의 Codex 에이전트를 추가합니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

이 형태에서는 다음과 같습니다.

- 기본 `main` 에이전트는 일반 공급자 경로와 PI 호환성 폴백을 사용합니다.
- `codex` 에이전트는 Codex 앱 서버 하네스를 사용합니다.
- `codex` 에이전트에 대해 Codex가 없거나 지원되지 않으면, 조용히 PI를 사용하는 대신
  해당 턴이 실패합니다.

## 에이전트 명령 라우팅

에이전트는 "Codex"라는 단어만이 아니라 의도에 따라 사용자 요청을 라우팅해야 합니다.

| 사용자가 요청하는 내용...                                 | 에이전트가 사용해야 하는 것...                    |
| -------------------------------------------------------- | ------------------------------------------------ |
| "이 채팅을 Codex에 바인딩"                                | `/codex bind`                                    |
| "Codex 스레드 `<id>`를 여기서 재개"                       | `/codex resume <id>`                             |
| "Codex 스레드 표시"                                      | `/codex threads`                                 |
| "잘못된 Codex 실행에 대한 지원 보고서 제출"               | `/diagnostics [note]`                            |
| "이 첨부된 스레드에 대해서만 Codex 피드백 전송"            | `/codex diagnostics [note]`                      |
| "이 에이전트의 런타임으로 Codex 사용"                     | `agentRuntime.id` 구성 변경                      |
| "일반 OpenClaw에서 내 ChatGPT/Codex 구독 사용"            | `openai-codex/*` 모델 참조                       |
| "ACP/acpx를 통해 Codex 실행"                              | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "스레드에서 Claude Code/Gemini/OpenCode/Cursor 시작"      | ACP/acpx, `/codex`도 아니고 네이티브 하위 에이전트도 아님 |

OpenClaw는 ACP가 활성화되어 있고, 디스패치 가능하며, 로드된 런타임 백엔드로 뒷받침될 때만
에이전트에 ACP 스폰 가이드를 광고합니다. ACP를 사용할 수 없으면
시스템 프롬프트와 Plugin Skills는 에이전트에게 ACP 라우팅을 가르치지 않아야 합니다.

## Codex 전용 배포

모든 내장 에이전트 턴이 Codex를 사용한다는 것을 증명해야 할 때 Codex 하네스를 강제합니다.
명시적 Plugin 런타임은 기본적으로 PI 폴백이 없으므로
`fallback: "none"`은 선택 사항이지만 문서화 용도로 유용한 경우가 많습니다.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

환경 재정의:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex가 강제되면 Codex Plugin이 비활성화되어 있거나,
앱 서버가 너무 오래되었거나, 앱 서버를 시작할 수 없는 경우 OpenClaw는 일찍 실패합니다.
누락된 하네스 선택을 의도적으로 PI가 처리하게 하려는 경우에만
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`를 설정하세요.

## 에이전트별 Codex

기본 에이전트는 일반 자동 선택을 유지하면서 하나의 에이전트만 Codex 전용으로 만들 수 있습니다.

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

일반 세션 명령을 사용해 에이전트와 모델을 전환하세요. `/new`는 새
OpenClaw 세션을 만들고, Codex 하네스는 필요에 따라 사이드카 앱 서버
스레드를 만들거나 재개합니다. `/reset`은 해당 스레드의 OpenClaw 세션 바인딩을 지우고
다음 턴이 현재 구성에서 하네스를 다시 해석하도록 합니다.

## 모델 검색

기본적으로 Codex Plugin은 사용 가능한 모델을 앱 서버에 요청합니다. 검색이 실패하거나
시간 초과되면 다음에 대해 번들된 폴백 카탈로그를 사용합니다.

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

`plugins.entries.codex.config.discovery`에서 검색을 조정할 수 있습니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

시작 시 Codex를 탐색하지 않고 폴백 카탈로그만 사용하려면 검색을 비활성화하세요.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## 앱 서버 연결 및 정책

기본적으로 Plugin은 다음을 사용해 OpenClaw의 관리형 Codex 바이너리를 로컬에서 시작합니다.

```bash
codex app-server --listen stdio://
```

관리형 바이너리는 번들된 Plugin 런타임 종속성으로 선언되며
나머지 `codex` Plugin 종속성과 함께 스테이징됩니다. 이렇게 하면 앱 서버
버전이 로컬에 우연히 설치된 별도의 Codex CLI가 아니라 번들된 Plugin에 묶입니다.
다른 실행 파일을 의도적으로 실행하려는 경우에만 `appServer.command`를 설정하세요.

기본적으로 OpenClaw는 로컬 Codex 하네스 세션을 YOLO 모드로 시작합니다.
`approvalPolicy: "never"`, `approvalsReviewer: "user"`,
`sandbox: "danger-full-access"`입니다. 이는 자율 Heartbeat에 사용되는 신뢰된
로컬 운영자 자세입니다. Codex는 답변할 사람이 없는 네이티브 승인 프롬프트에서
멈추지 않고 셸과 네트워크 도구를 사용할 수 있습니다.

Codex 보호자 검토 승인에 옵트인하려면 `appServer.mode:
"guardian"`을 설정하세요.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian 모드는 Codex의 네이티브 자동 검토 승인 경로를 사용합니다. Codex가
샌드박스를 벗어나거나, 워크스페이스 밖에 쓰거나, 네트워크 액세스 같은 권한을 추가하려고 요청하면
Codex는 해당 승인 요청을 사람 프롬프트 대신 네이티브 검토자에게 라우팅합니다.
검토자는 Codex의 위험 프레임워크를 적용하고 특정 요청을 승인하거나 거부합니다.
YOLO 모드보다 더 많은 가드레일이 필요하지만 무인 에이전트가 계속 진행해야 할 때 Guardian을 사용하세요.

`guardian` 프리셋은 `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, `sandbox: "workspace-write"`로 확장됩니다.
개별 정책 필드는 여전히 `mode`를 재정의하므로 고급 배포에서는
프리셋을 명시적 선택과 혼합할 수 있습니다. 이전 `guardian_subagent` 검토자 값은
호환성 별칭으로 계속 허용되지만, 새 구성은 `auto_review`를 사용해야 합니다.

이미 실행 중인 앱 서버의 경우 WebSocket 전송을 사용하세요.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Stdio 앱 서버 실행은 기본적으로 OpenClaw의 프로세스 환경을 상속하지만,
OpenClaw가 Codex 앱 서버 계정 브리지를 소유합니다. 인증은 다음 순서로 선택됩니다.

1. 에이전트에 대한 명시적 OpenClaw Codex 인증 프로필.
2. 로컬 Codex CLI ChatGPT 로그인 같은 앱 서버의 기존 계정.
3. 로컬 stdio 앱 서버 실행에 한해서, 앱 서버 계정이 없고 OpenAI 인증이
   여전히 필요한 경우 `CODEX_API_KEY`, 그 다음 `OPENAI_API_KEY`.

OpenClaw가 ChatGPT 구독 스타일의 Codex 인증 프로필을 발견하면, 생성된 Codex 자식 프로세스에서
`CODEX_API_KEY`와 `OPENAI_API_KEY`를 제거합니다. 이렇게 하면 Gateway 수준 API 키는
임베딩이나 직접 OpenAI 모델에 사용할 수 있으면서도 네이티브 Codex 앱 서버 턴이
실수로 API를 통해 과금되지 않도록 합니다. 명시적 Codex API 키 프로필과 로컬 stdio
환경 키 폴백은 상속된 자식 프로세스 환경 대신 앱 서버 로그인을 사용합니다. WebSocket 앱 서버 연결은
Gateway 환경 API 키 폴백을 받지 않습니다. 명시적 인증 프로필이나 원격 앱 서버 자체 계정을 사용하세요.

배포에 추가 환경 격리가 필요한 경우 해당 변수를
`appServer.clearEnv`에 추가하세요.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv`는 생성된 Codex 앱 서버 자식 프로세스에만 영향을 줍니다.

지원되는 `appServer` 필드:

| 필드               | 기본값                                  | 의미                                                                                                                             |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"`는 Codex를 생성하고, `"websocket"`은 `url`에 연결합니다.                                                                            |
| `command`           | 관리형 Codex 바이너리                     | stdio 전송용 실행 파일입니다. 관리형 바이너리를 사용하려면 설정하지 말고, 명시적으로 재정의할 때만 설정하세요.                        |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 전송용 인수입니다.                                                                                                      |
| `url`               | 설정 안 됨                                    | WebSocket app-server URL입니다.                                                                                                           |
| `authToken`         | 설정 안 됨                                    | WebSocket 전송용 Bearer 토큰입니다.                                                                                               |
| `headers`           | `{}`                                     | 추가 WebSocket 헤더입니다.                                                                                                            |
| `clearEnv`          | `[]`                                     | OpenClaw가 상속 환경을 구성한 뒤 생성된 stdio app-server 프로세스에서 제거되는 추가 환경 변수 이름입니다. |
| `requestTimeoutMs`  | `60000`                                  | app-server 제어 평면 호출의 제한 시간입니다.                                                                                         |
| `mode`              | `"yolo"`                                 | YOLO 또는 guardian 검토 실행용 프리셋입니다.                                                                                     |
| `approvalPolicy`    | `"never"`                                | 스레드 시작/재개/턴에 전송되는 네이티브 Codex 승인 정책입니다.                                                                      |
| `sandbox`           | `"danger-full-access"`                   | 스레드 시작/재개에 전송되는 네이티브 Codex 샌드박스 모드입니다.                                                                              |
| `approvalsReviewer` | `"user"`                                 | Codex가 네이티브 승인 프롬프트를 검토하게 하려면 `"auto_review"`를 사용하세요. `guardian_subagent`는 레거시 별칭으로 남아 있습니다.                        |
| `serviceTier`       | 설정 안 됨                                    | 선택적 Codex app-server 서비스 티어입니다: `"fast"`, `"flex"` 또는 `null`. 유효하지 않은 레거시 값은 무시됩니다.                           |

OpenClaw 소유 동적 도구 호출은 `appServer.requestTimeoutMs`와 독립적으로 제한됩니다. 각 Codex `item/tool/call` 요청은 30초 이내에 OpenClaw 응답을 받아야 합니다. 제한 시간이 초과되면 OpenClaw는 지원되는 경우 도구 신호를 중단하고 실패한 동적 도구 응답을 Codex에 반환하여 세션을 `processing` 상태로 남겨두지 않고 턴을 계속할 수 있게 합니다.

OpenClaw가 Codex 턴 범위 app-server 요청에 응답한 뒤, 하네스는 Codex가 네이티브 턴을 `turn/completed`로 마치는 것도 기대합니다. 해당 응답 이후 app-server가 60초 동안 응답하지 않으면 OpenClaw는 최선의 노력으로 Codex 턴을 중단하고, 진단 제한 시간을 기록하며, 오래된 네이티브 턴 뒤에 후속 채팅 메시지가 대기하지 않도록 OpenClaw 세션 레인을 해제합니다.

로컬 테스트에는 환경 재정의가 계속 제공됩니다:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command`가 설정되지 않은 경우 `OPENCLAW_CODEX_APP_SERVER_BIN`은 관리형 바이너리를 우회합니다.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`은 제거되었습니다. 대신 `plugins.entries.codex.config.appServer.mode: "guardian"`을 사용하거나, 일회성 로컬 테스트에는 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`을 사용하세요. 반복 가능한 배포에는 구성이 선호됩니다. 이렇게 하면 Plugin 동작이 나머지 Codex 하네스 설정과 같은 검토된 파일에 유지되기 때문입니다.

## 컴퓨터 사용

컴퓨터 사용은 별도의 설정 가이드에서 다룹니다:
[Codex 컴퓨터 사용](/ko/plugins/codex-computer-use).

간단히 말해 OpenClaw는 데스크톱 제어 앱을 벤더링하거나 데스크톱 작업을 직접 실행하지 않습니다. Codex app-server를 준비하고, `computer-use` MCP 서버를 사용할 수 있는지 확인한 다음, Codex 모드 턴 중 네이티브 MCP 도구 호출을 Codex가 처리하게 합니다.

Codex marketplace 흐름 밖에서 직접 TryCua 드라이버에 접근하려면 `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`로 `cua-driver mcp`를 등록하세요. Codex 소유 컴퓨터 사용과 직접 MCP 등록의 차이는 [Codex 컴퓨터 사용](/ko/plugins/codex-computer-use)을 참조하세요.

최소 구성:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

설정은 명령 표면에서 확인하거나 설치할 수 있습니다:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

컴퓨터 사용은 macOS 전용이며, Codex MCP 서버가 앱을 제어하기 전에 로컬 OS 권한이 필요할 수 있습니다. `computerUse.enabled`가 true이고 MCP 서버를 사용할 수 없으면, Codex 모드 턴은 네이티브 컴퓨터 사용 도구 없이 조용히 실행되지 않고 스레드가 시작되기 전에 실패합니다. marketplace 선택지, 원격 카탈로그 제한, 상태 이유, 문제 해결은 [Codex 컴퓨터 사용](/ko/plugins/codex-computer-use)을 참조하세요.

`computerUse.autoInstall`이 true인 경우, Codex가 아직 로컬 marketplace를 발견하지 못했다면 OpenClaw는 `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`에서 표준 번들 Codex Desktop marketplace를 등록할 수 있습니다. 런타임 또는 컴퓨터 사용 구성을 변경한 뒤에는 기존 세션이 오래된 PI 또는 Codex 스레드 바인딩을 유지하지 않도록 `/new` 또는 `/reset`을 사용하세요.

## 일반 레시피

기본 stdio 전송을 사용하는 로컬 Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Codex 전용 하네스 검증:

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
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

guardian 검토 Codex 승인:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

명시적 헤더가 있는 원격 app-server:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

모델 전환은 OpenClaw가 계속 제어합니다. OpenClaw 세션이 기존 Codex 스레드에 연결되어 있으면, 다음 턴은 현재 선택된 OpenAI 모델, provider, 승인 정책, 샌드박스, 서비스 티어를 app-server에 다시 전송합니다. `openai/gpt-5.5`에서 `openai/gpt-5.2`로 전환하면 스레드 바인딩은 유지되지만 Codex에 새로 선택한 모델로 계속 진행하도록 요청합니다.

## Codex 명령

번들 Plugin은 `/codex`를 승인된 슬래시 명령으로 등록합니다. 이 명령은 일반적이며 OpenClaw 텍스트 명령을 지원하는 모든 채널에서 작동합니다.

일반 형식:

- `/codex status`는 실시간 app-server 연결성, 모델, 계정, 속도 제한, MCP 서버, Skills를 표시합니다.
- `/codex models`는 실시간 Codex app-server 모델을 나열합니다.
- `/codex threads [filter]`는 최근 Codex 스레드를 나열합니다.
- `/codex resume <thread-id>`는 현재 OpenClaw 세션을 기존 Codex 스레드에 연결합니다.
- `/codex compact`는 Codex app-server에 연결된 스레드를 압축하도록 요청합니다.
- `/codex review`는 연결된 스레드에 대해 Codex 네이티브 검토를 시작합니다.
- `/codex diagnostics [note]`는 연결된 스레드에 대한 Codex 진단 피드백을 보내기 전에 확인을 요청합니다.
- `/codex computer-use status`는 구성된 컴퓨터 사용 Plugin과 MCP 서버를 확인합니다.
- `/codex computer-use install`은 구성된 컴퓨터 사용 Plugin을 설치하고 MCP 서버를 다시 로드합니다.
- `/codex account`는 계정 및 속도 제한 상태를 표시합니다.
- `/codex mcp`는 Codex app-server MCP 서버 상태를 나열합니다.
- `/codex skills`는 Codex app-server Skills를 나열합니다.

### 일반 디버깅 워크플로

Codex 기반 에이전트가 Telegram, Discord, Slack 또는 다른 채널에서 예상 밖의 동작을 하면, 문제가 발생한 대화에서 시작하세요:

1. `/diagnostics bad tool choice after image upload` 또는 본 내용을 설명하는 다른 짧은 메모를 실행합니다.
2. 진단 요청을 한 번 승인합니다. 승인하면 로컬 Gateway 진단 zip이 생성되고, 세션이 Codex 하네스를 사용 중이므로 관련 Codex 피드백 번들도 OpenAI 서버로 전송됩니다.
3. 완료된 진단 응답을 버그 보고서나 지원 스레드에 복사합니다. 여기에는 로컬 번들 경로, 개인정보 요약, OpenClaw 세션 ID, Codex 스레드 ID, 각 Codex 스레드의 `Inspect locally` 줄이 포함됩니다.
4. 실행을 직접 디버깅하려면 출력된 `Inspect locally` 명령을 터미널에서 실행합니다. 이 명령은 `codex resume <thread-id>`처럼 보이며 네이티브 Codex 스레드를 열어 대화를 검사하고, 로컬에서 계속 진행하거나, Codex에 특정 도구나 계획을 선택한 이유를 물어볼 수 있게 합니다.

전체 OpenClaw Gateway 진단 번들 없이 현재 연결된 스레드에 대한 Codex 피드백 업로드만 구체적으로 원할 때만 `/codex diagnostics [note]`를 사용하세요. 대부분의 지원 보고서에는 `/diagnostics [note]`가 더 나은 시작점입니다. 로컬 Gateway 상태와 Codex 스레드 ID를 하나의 응답으로 연결하기 때문입니다. 전체 개인정보 모델과 그룹 채팅 동작은 [진단 내보내기](/ko/gateway/diagnostics)를 참조하세요.

Core OpenClaw는 일반 Gateway 진단 명령으로 소유자 전용 `/diagnostics [note]`도 노출합니다. 해당 승인 프롬프트는 민감 데이터 안내문을 표시하고, [진단 내보내기](/ko/gateway/diagnostics)에 연결하며, 매번 명시적 exec 승인을 통해 `openclaw gateway diagnostics export --json`을 요청합니다. allow-all 규칙으로 진단을 승인하지 마세요. 승인 후 OpenClaw는 로컬 번들 경로와 매니페스트 요약이 포함된 붙여넣기 가능한 보고서를 전송합니다. 활성 OpenClaw 세션이 Codex 하네스를 사용 중이면, 같은 승인으로 관련 Codex 피드백 번들을 OpenAI 서버로 보내는 것도 허가됩니다. 승인 프롬프트는 Codex 피드백이 전송될 것이라고 말하지만, 승인 전에는 Codex 세션 또는 스레드 ID를 나열하지 않습니다.

소유자가 그룹 채팅에서 `/diagnostics`를 호출하면 OpenClaw는 공유 채널을 깔끔하게 유지합니다. 그룹에는 짧은 알림만 전달되고, 진단 안내문, 승인 프롬프트, Codex 세션/스레드 ID는 비공개 승인 경로를 통해 소유자에게 전송됩니다. 비공개 소유자 경로가 없으면 OpenClaw는 그룹 요청을 거부하고 소유자에게 DM에서 실행하라고 요청합니다.

승인된 Codex 업로드는 Codex app-server `feedback/upload`를 호출하고, 사용 가능한 경우 나열된 각 스레드와 생성된 Codex 하위 스레드의 로그를 포함하도록 app-server에 요청합니다. 업로드는 Codex의 일반 피드백 경로를 통해 OpenAI 서버로 전달됩니다. 해당 app-server에서 Codex 피드백이 비활성화되어 있으면 명령은 app-server 오류를 반환합니다. 완료된 진단 응답에는 전송된 스레드의 채널, OpenClaw 세션 ID, Codex 스레드 ID, 로컬 `codex resume <thread-id>` 명령이 나열됩니다. 승인을 거부하거나 무시하면 OpenClaw는 해당 Codex ID를 출력하지 않습니다. 이 업로드는 로컬 Gateway 진단 내보내기를 대체하지 않습니다.

`/codex resume`은 하네스가 일반 턴에 사용하는 것과 동일한 사이드카 바인딩 파일을 작성합니다. 다음 메시지에서 OpenClaw는 해당 Codex 스레드를 재개하고, 현재 선택된 OpenClaw 모델을 app-server에 전달하며, 확장 히스토리를 계속 활성화합니다.

### CLI에서 Codex 스레드 검사

문제가 있는 Codex 실행을 이해하는 가장 빠른 방법은 네이티브 Codex 스레드를 직접 여는 것인 경우가 많습니다.

```sh
codex resume <thread-id>
```

채널 대화에서 버그를 발견했고 문제가 있는 Codex 세션을 검사하거나, 로컬에서 이어서 진행하거나, Codex가 특정 도구 또는 추론 선택을 한 이유를 물어보고 싶을 때 사용하세요. 가장 쉬운 경로는 보통 먼저 `/diagnostics [note]`를 실행하는 것입니다. 승인 후 완료된 보고서에는 각 Codex 스레드가 나열되고 `Inspect locally` 명령이 출력됩니다. 예: `codex resume <thread-id>`. 해당 명령을 터미널에 직접 복사할 수 있습니다.

현재 채팅의 `/codex binding` 또는 최근 Codex app-server 스레드의 `/codex threads [filter]`에서 스레드 ID를 얻은 뒤, 셸에서 동일한 `codex resume` 명령을 실행할 수도 있습니다.

명령 표면에는 Codex app-server `0.125.0` 이상이 필요합니다. 향후 또는 커스텀 app-server가 해당 JSON-RPC 메서드를 노출하지 않으면 개별 제어 메서드는 `unsupported by this Codex app-server`로 보고됩니다.

## 훅 경계

Codex 하네스에는 세 가지 훅 계층이 있습니다.

| 계층                                  | 소유자                   | 목적                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin 훅                    | OpenClaw                 | PI 및 Codex 하네스 전반의 제품/Plugin 호환성.                       |
| Codex app-server 확장 미들웨어        | OpenClaw 번들 Plugin     | OpenClaw 동적 도구 주변의 턴별 어댑터 동작.                         |
| Codex 네이티브 훅                     | Codex                    | Codex 구성의 저수준 Codex 수명 주기 및 네이티브 도구 정책.          |

OpenClaw는 OpenClaw Plugin 동작을 라우팅하기 위해 프로젝트 또는 전역 Codex `hooks.json` 파일을 사용하지 않습니다. 지원되는 네이티브 도구 및 권한 브리지의 경우 OpenClaw는 `PreToolUse`, `PostToolUse`, `PermissionRequest`, `Stop`에 대해 스레드별 Codex 구성을 주입합니다. `SessionStart` 및 `UserPromptSubmit` 같은 다른 Codex 훅은 Codex 수준 제어로 유지되며, v1 계약에서 OpenClaw Plugin 훅으로 노출되지 않습니다.

OpenClaw 동적 도구의 경우 Codex가 호출을 요청한 뒤 OpenClaw가 도구를 실행하므로, OpenClaw는 하네스 어댑터에서 자신이 소유한 Plugin 및 미들웨어 동작을 실행합니다. Codex 네이티브 도구의 경우 Codex가 정식 도구 레코드를 소유합니다. OpenClaw는 선택한 이벤트를 미러링할 수 있지만, Codex가 app-server 또는 네이티브 훅 콜백을 통해 해당 작업을 노출하지 않는 한 네이티브 Codex 스레드를 다시 작성할 수 없습니다.

Compaction 및 LLM 수명 주기 투영은 네이티브 Codex 훅 명령이 아니라 Codex app-server 알림과 OpenClaw 어댑터 상태에서 옵니다. OpenClaw의 `before_compaction`, `after_compaction`, `llm_input`, `llm_output` 이벤트는 Codex 내부 요청 또는 Compaction 페이로드를 바이트 단위로 캡처한 것이 아니라 어댑터 수준 관찰입니다.

Codex 네이티브 `hook/started` 및 `hook/completed` app-server 알림은 궤적 및 디버깅을 위해 `codex_app_server.hook` 에이전트 이벤트로 투영됩니다. 이 알림은 OpenClaw Plugin 훅을 호출하지 않습니다.

## V1 지원 계약

Codex 모드는 내부의 모델 호출만 다른 PI가 아닙니다. Codex는 네이티브 모델 루프의 더 많은 부분을 소유하며, OpenClaw는 그 경계에 맞춰 Plugin 및 세션 표면을 조정합니다.

Codex 런타임 v1에서 지원됨:

| 표면                                          | 지원                                    | 이유                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex를 통한 OpenAI 모델 루프                 | 지원됨                                  | Codex app-server가 OpenAI 턴, 네이티브 스레드 재개, 네이티브 도구 계속 진행을 소유합니다.                                                                                                            |
| OpenClaw 채널 라우팅 및 전달                  | 지원됨                                  | Telegram, Discord, Slack, WhatsApp, iMessage 및 기타 채널은 모델 런타임 외부에 유지됩니다.                                                                                                           |
| OpenClaw 동적 도구                            | 지원됨                                  | Codex가 OpenClaw에 이러한 도구 실행을 요청하므로 OpenClaw는 실행 경로에 남아 있습니다.                                                                                                               |
| 프롬프트 및 컨텍스트 Plugin                   | 지원됨                                  | OpenClaw는 스레드를 시작하거나 재개하기 전에 프롬프트 오버레이를 빌드하고 컨텍스트를 Codex 턴에 투영합니다.                                                                                         |
| 컨텍스트 엔진 수명 주기                       | 지원됨                                  | 조립, 수집 또는 턴 이후 유지 관리, 컨텍스트 엔진 Compaction 조정이 Codex 턴에 대해 실행됩니다.                                                                                                      |
| 동적 도구 훅                                  | 지원됨                                  | `before_tool_call`, `after_tool_call`, 도구 결과 미들웨어가 OpenClaw 소유 동적 도구 주변에서 실행됩니다.                                                                                            |
| 수명 주기 훅                                  | 어댑터 관찰로 지원됨                    | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, `after_compaction`이 정직한 Codex 모드 페이로드와 함께 실행됩니다.                                                                       |
| 최종 답변 수정 게이트                         | 네이티브 훅 릴레이를 통해 지원됨        | Codex `Stop`이 `before_agent_finalize`로 릴레이되고, `revise`는 최종화 전에 Codex에 모델 패스를 한 번 더 요청합니다.                                                                                 |
| 네이티브 셸, 패치, MCP 차단 또는 관찰         | 네이티브 훅 릴레이를 통해 지원됨        | Codex `PreToolUse` 및 `PostToolUse`가 Codex app-server `0.125.0` 이상에서 MCP 페이로드를 포함한 커밋된 네이티브 도구 표면에 대해 릴레이됩니다. 차단은 지원되지만 인수 다시 작성은 지원되지 않습니다. |
| 네이티브 권한 정책                            | 네이티브 훅 릴레이를 통해 지원됨        | 런타임이 노출하는 경우 Codex `PermissionRequest`를 OpenClaw 정책을 통해 라우팅할 수 있습니다. OpenClaw가 결정을 반환하지 않으면 Codex는 일반 guardian 또는 사용자 승인 경로를 계속 진행합니다.    |
| App-server 궤적 캡처                          | 지원됨                                  | OpenClaw는 app-server에 보낸 요청과 수신한 app-server 알림을 기록합니다.                                                                                                                             |

Codex 런타임 v1에서 지원되지 않음:

| 표면                                                | V1 경계                                                                                                                                            | 향후 경로                                                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 네이티브 도구 인수 변경                             | Codex 네이티브 사전 도구 훅은 차단할 수 있지만, OpenClaw는 Codex 네이티브 도구 인수를 다시 작성하지 않습니다.                                    | 대체 도구 입력에 대한 Codex 훅/스키마 지원이 필요합니다.                                   |
| 편집 가능한 Codex 네이티브 transcript 히스토리      | Codex는 정식 네이티브 스레드 히스토리를 소유합니다. OpenClaw는 미러를 소유하고 향후 컨텍스트를 투영할 수 있지만, 지원되지 않는 내부를 변경해서는 안 됩니다. | 네이티브 스레드 수술이 필요하면 명시적인 Codex app-server API를 추가합니다.                |
| Codex 네이티브 도구 레코드의 `tool_result_persist`  | 해당 훅은 Codex 네이티브 도구 레코드가 아니라 OpenClaw 소유 transcript 쓰기를 변환합니다.                                                          | 변환된 레코드를 미러링할 수는 있지만, 정식 다시 작성에는 Codex 지원이 필요합니다.          |
| 풍부한 네이티브 Compaction 메타데이터               | OpenClaw는 Compaction 시작과 완료를 관찰하지만, 안정적인 유지/삭제 목록, 토큰 델타 또는 요약 페이로드를 받지 않습니다.                           | 더 풍부한 Codex Compaction 이벤트가 필요합니다.                                            |
| Compaction 개입                                     | 현재 OpenClaw Compaction 훅은 Codex 모드에서 알림 수준입니다.                                                                                     | Plugin이 네이티브 Compaction을 거부하거나 다시 작성해야 하는 경우 Codex 사전/사후 Compaction 훅을 추가합니다. |
| 바이트 단위 모델 API 요청 캡처                      | OpenClaw는 app-server 요청과 알림을 캡처할 수 있지만, Codex 코어가 최종 OpenAI API 요청을 내부적으로 빌드합니다.                                 | Codex 모델 요청 추적 이벤트 또는 디버그 API가 필요합니다.                                  |

## 도구, 미디어 및 Compaction

Codex 하네스는 저수준 임베디드 에이전트 실행기만 변경합니다.

OpenClaw는 여전히 도구 목록을 빌드하고 하네스에서 동적 도구 결과를 받습니다. 텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력은 일반 OpenClaw 전달 경로를 계속 사용합니다.

네이티브 훅 릴레이는 의도적으로 일반적이지만, v1 지원 계약은 OpenClaw가 테스트하는 Codex 네이티브 도구 및 권한 경로로 제한됩니다. Codex 런타임에서 여기에는 셸, 패치, MCP `PreToolUse`, `PostToolUse`, `PermissionRequest` 페이로드가 포함됩니다. 런타임 계약이 명명하기 전에는 향후 모든 Codex 훅 이벤트가 OpenClaw Plugin 표면이라고 가정하지 마세요.

`PermissionRequest`의 경우 OpenClaw는 정책이 결정할 때만 명시적인 허용 또는 거부 결정을 반환합니다. 결정 없음 결과는 허용이 아닙니다. Codex는 이를 훅 결정 없음으로 처리하고 자체 guardian 또는 사용자 승인 경로로 넘어갑니다.

Codex MCP 도구 승인 요청은 Codex가 `_meta.codex_approval_kind`를 `"mcp_tool_call"`로 표시할 때 OpenClaw의 Plugin 승인 흐름을 통해 라우팅됩니다. Codex `request_user_input` 프롬프트는 원래 채팅으로 다시 전송되며, 다음 대기 중인 후속 메시지는 추가 컨텍스트로 유도되는 대신 해당 네이티브 서버 요청에 답합니다. 다른 MCP 요청은 여전히 닫힌 상태로 실패합니다.

활성 실행 큐 조정은 Codex 앱 서버 `turn/steer`에 매핑됩니다. 기본값인 `messages.queue.mode: "steer"`에서는 OpenClaw가 구성된 대기 시간 동안 큐에 들어온 채팅 메시지를 묶고, 도착 순서대로 하나의 `turn/steer` 요청으로 보냅니다. 레거시 `queue` 모드는 별도의 `turn/steer` 요청을 보냅니다. Codex 리뷰와 수동 Compaction 턴은 같은 턴 조정을 거부할 수 있으며, 이 경우 선택한 모드가 폴백을 허용하면 OpenClaw는 후속 큐를 사용합니다. [조정 큐](/ko/concepts/queue-steering)를 참조하세요.

선택한 모델이 Codex 하네스를 사용할 때 네이티브 스레드 Compaction은 Codex 앱 서버에 위임됩니다. OpenClaw는 채널 기록, 검색, `/new`, `/reset`, 그리고 향후 모델 또는 하네스 전환을 위해 transcript 미러를 유지합니다. 미러에는 사용자 프롬프트, 최종 어시스턴트 텍스트, 그리고 앱 서버가 내보내는 경우 가벼운 Codex 추론 또는 계획 레코드가 포함됩니다. 현재 OpenClaw는 네이티브 Compaction 시작 및 완료 신호만 기록합니다. 아직 사람이 읽을 수 있는 Compaction 요약이나 Compaction 후 Codex가 어떤 항목을 유지했는지에 대한 감사 가능한 목록은 노출하지 않습니다.

Codex가 표준 네이티브 스레드를 소유하므로 `tool_result_persist`는 현재 Codex 네이티브 도구 결과 레코드를 다시 작성하지 않습니다. OpenClaw가 OpenClaw 소유 세션 transcript 도구 결과를 작성할 때만 적용됩니다.

미디어 생성에는 PI가 필요하지 않습니다. 이미지, 동영상, 음악, PDF, TTS, 미디어 이해는 계속해서 `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, `messages.tts` 같은 해당 provider/model 설정을 사용합니다.

## 문제 해결

**Codex가 일반 `/model` provider로 표시되지 않음:** 새 구성에서는 예상된 동작입니다. `agentRuntime.id: "codex"`가 있는 `openai/gpt-*` 모델(또는 레거시 `codex/*` 참조)을 선택하고, `plugins.entries.codex.enabled`를 활성화한 다음, `plugins.allow`가 `codex`를 제외하는지 확인하세요.

**OpenClaw가 Codex 대신 PI를 사용함:** `agentRuntime.id: "auto"`는 Codex 하네스가 실행을 가져가지 않을 때 호환성 백엔드로 여전히 PI를 사용할 수 있습니다. 테스트 중 Codex 선택을 강제하려면 `agentRuntime.id: "codex"`를 설정하세요. 강제된 Codex 런타임은 이제 `agentRuntime.fallback: "pi"`를 명시적으로 설정하지 않는 한 PI로 폴백하지 않고 실패합니다. Codex 앱 서버가 선택되면, 해당 실패는 추가 폴백 구성 없이 직접 표면화됩니다.

**앱 서버가 거부됨:** 앱 서버 핸드셰이크가 버전 `0.125.0` 이상을 보고하도록 Codex를 업그레이드하세요. `0.125.0-alpha.2` 또는 `0.125.0+custom` 같은 동일 버전의 시험판이나 빌드 접미사가 붙은 버전은 거부됩니다. OpenClaw가 테스트하는 기준은 안정 버전 `0.125.0` 프로토콜 하한이기 때문입니다.

**모델 검색이 느림:** `plugins.entries.codex.config.discovery.timeoutMs`를 낮추거나 검색을 비활성화하세요.

**WebSocket 전송이 즉시 실패함:** `appServer.url`, `authToken`, 그리고 원격 앱 서버가 같은 Codex 앱 서버 프로토콜 버전을 사용하는지 확인하세요.

**Codex가 아닌 모델이 PI를 사용함:** 해당 에이전트에 대해 `agentRuntime.id: "codex"`를 강제했거나 레거시 `codex/*` 참조를 선택한 경우가 아니라면 예상된 동작입니다. 일반 `openai/gpt-*` 및 다른 provider 참조는 `auto` 모드에서 정상 provider 경로를 유지합니다. `agentRuntime.id: "codex"`를 강제하면 해당 에이전트의 모든 내장 턴은 Codex가 지원하는 OpenAI 모델이어야 합니다.

**Computer Use가 설치되어 있지만 도구가 실행되지 않음:** 새 세션에서 `/codex computer-use status`를 확인하세요. 도구가 `Native hook relay unavailable`을 보고하면 `/new` 또는 `/reset`을 사용하세요. 계속되면 오래된 네이티브 후크 등록을 지우기 위해 Gateway를 다시 시작하세요. `computer-use.list_apps`가 시간 초과되면 Codex Computer Use 또는 Codex Desktop을 다시 시작하고 재시도하세요.

## 관련 항목

- [에이전트 하네스 Plugin](/ko/plugins/sdk-agent-harness)
- [에이전트 런타임](/ko/concepts/agent-runtimes)
- [모델 provider](/ko/concepts/model-providers)
- [OpenAI provider](/ko/providers/openai)
- [상태](/ko/cli/status)
- [Plugin 후크](/ko/plugins/hooks)
- [구성 참조](/ko/gateway/configuration-reference)
- [테스트](/ko/help/testing-live#live-codex-app-server-harness-smoke)
