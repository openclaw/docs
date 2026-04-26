---
read_when:
    - 번들 Codex app-server harness를 사용하려고 합니다.
    - Codex harness 구성 예시가 필요합니다.
    - Codex 전용 배포에서 PI로 fallback하지 않고 실패하도록 하려는 경우입니다.
summary: 번들 Codex app-server harness를 통해 OpenClaw 내장 에이전트 턴 실행하기
title: Codex harness
x-i18n:
    generated_at: "2026-04-26T11:34:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf54ee2eab64e611e50605e8fef24cc840b3246d0bddc18ae03730a05848e271
    source_path: plugins/codex-harness.md
    workflow: 15
---

번들 `codex` Plugin은 OpenClaw가 내장 에이전트 턴을 기본 제공 PI harness 대신
Codex app-server를 통해 실행할 수 있게 합니다.

이 기능은 저수준 에이전트 세션을 Codex가 직접 담당하게 하고 싶을 때 사용합니다:
모델 검색, 네이티브 스레드 재개, 네이티브 Compaction, app-server 실행.
OpenClaw는 여전히 채팅 채널, 세션 파일, 모델 선택, 도구,
승인, 미디어 전달, 표시되는 transcript 미러를 담당합니다.

전체 구조를 파악하려면 먼저
[에이전트 런타임](/ko/concepts/agent-runtimes)부터 보세요. 짧게 말하면:
`openai/gpt-5.5`는 모델 참조이고, `codex`는 런타임이며, Telegram,
Discord, Slack 또는 다른 채널은 계속 통신 표면으로 남습니다.

## 이 Plugin이 바꾸는 것

번들 `codex` Plugin은 여러 개의 별도 capability를 제공합니다:

| Capability                        | 사용 방법                                           | 수행 내용                                                                     |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 네이티브 내장 런타임              | `agentRuntime.id: "codex"`                          | OpenClaw 내장 에이전트 턴을 Codex app-server를 통해 실행합니다.              |
| 네이티브 채팅 제어 명령           | `/codex bind`, `/codex resume`, `/codex steer`, ... | 메시징 대화에서 Codex app-server 스레드를 바인딩하고 제어합니다.             |
| Codex app-server provider/catalog | `codex` 내부 로직, harness를 통해 노출             | 런타임이 app-server 모델을 검색하고 검증할 수 있게 합니다.                   |
| Codex 미디어 이해 경로            | `codex/*` image-model 호환 경로                     | 지원되는 이미지 이해 모델에 대해 제한된 Codex app-server 턴을 실행합니다.    |
| 네이티브 hook relay               | Codex 네이티브 이벤트 주변의 Plugin hooks           | OpenClaw가 지원되는 Codex 네이티브 tool/finalization 이벤트를 관찰/차단하게 합니다. |

Plugin을 활성화하면 이러한 capability를 사용할 수 있게 됩니다. 하지만 다음은 **하지 않습니다**:

- 모든 OpenAI 모델에 대해 Codex를 사용하기 시작하지 않음
- `openai-codex/*` 모델 참조를 네이티브 런타임으로 변환하지 않음
- ACP/acpx를 기본 Codex 경로로 만들지 않음
- 이미 PI 런타임을 기록한 기존 세션을 즉시 전환하지 않음
- OpenClaw 채널 전달, 세션 파일, auth-profile 저장소, 메시지 라우팅을 대체하지 않음

같은 Plugin은 네이티브 `/codex` 채팅 제어 명령 표면도 담당합니다. Plugin이
활성화되어 있고 사용자가 채팅에서 Codex 스레드를 바인딩, 재개, 조정, 중지 또는 검사하려고 하면,
에이전트는 ACP보다 `/codex ...`를 우선해야 합니다.
사용자가 ACP/acpx를 명시적으로 요청하거나 ACP
Codex 어댑터를 테스트하는 경우에는 ACP가 명시적 fallback으로 남습니다.

네이티브 Codex 턴은 공개 호환성 계층으로 OpenClaw Plugin hook을 유지합니다.
이들은 Codex `hooks.json` 명령 hook이 아니라 프로세스 내 OpenClaw hook입니다:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- 미러링된 transcript 레코드를 위한 `before_message_write`
- Codex `Stop` relay를 통한 `before_agent_finalize`
- `agent_end`

Plugin은 OpenClaw가 tool을 실행한 뒤, 결과가 Codex에 반환되기 전에
OpenClaw 동적 tool 결과를 다시 쓸 수 있는 런타임 중립 tool-result middleware도 등록할 수 있습니다.
이것은 OpenClaw가 소유한 transcript
tool-result 쓰기를 변환하는 공개 `tool_result_persist` Plugin hook과는 별개입니다.

Plugin hook 의미 자체는 [Plugin hooks](/ko/plugins/hooks)
및 [Plugin guard 동작](/ko/tools/plugin)을 참조하세요.

이 harness는 기본적으로 꺼져 있습니다. 새 구성에서는 OpenAI 모델 참조를
`openai/gpt-*` 형태로 정규화해 유지하고, 네이티브 app-server 실행이
필요할 때는 `agentRuntime.id: "codex"` 또는 `OPENCLAW_AGENT_RUNTIME=codex`를
명시적으로 강제해야 합니다. 레거시 `codex/*` 모델 참조는 호환성을 위해 여전히
자동으로 harness를 선택하지만, 런타임 기반 레거시 provider 접두사는 일반
모델/provider 선택지로 표시되지 않습니다.

`codex` Plugin이 활성화되어 있지만 기본 모델이 여전히
`openai-codex/*`라면, `openclaw doctor`는 경로를 바꾸는 대신 경고합니다. 이는
의도된 동작입니다. `openai-codex/*`는 여전히 PI Codex OAuth/subscription 경로이며,
네이티브 app-server 실행은 명시적 런타임 선택으로 유지됩니다.

## 경로 맵

구성을 바꾸기 전에 이 표를 확인하세요:

| 원하는 동작                                | 모델 참조                  | 런타임 구성                            | Plugin 요구 사항            | 예상 상태 라벨                |
| ------------------------------------------ | -------------------------- | -------------------------------------- | --------------------------- | ----------------------------- |
| 일반 OpenClaw 실행기를 통한 OpenAI API     | `openai/gpt-*`             | 생략 또는 `runtime: "pi"`              | OpenAI provider             | `Runtime: OpenClaw Pi Default` |
| PI를 통한 Codex OAuth/subscription         | `openai-codex/gpt-*`       | 생략 또는 `runtime: "pi"`              | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| 네이티브 Codex app-server 내장 턴          | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` Plugin              | `Runtime: OpenAI Codex`       |
| 보수적 auto 모드의 혼합 provider           | provider별 참조            | `agentRuntime.id: "auto"`              | 선택적 Plugin 런타임        | 선택된 런타임에 따라 다름     |
| 명시적 Codex ACP 어댑터 세션               | ACP 프롬프트/모델에 따라 다름 | `sessions_spawn` with `runtime: "acp"` | 정상 동작하는 `acpx` 백엔드 | ACP 작업/세션 상태            |

중요한 구분은 provider와 runtime입니다:

- `openai-codex/*`는 "PI가 어떤 provider/auth 경로를 사용해야 하는가?"에 답합니다
- `agentRuntime.id: "codex"`는 "어떤 루프가 이
  내장 턴을 실행해야 하는가?"에 답합니다
- `/codex ...`는 "이 채팅이 어떤 네이티브 Codex 대화에 바인딩되거나 이를
  제어해야 하는가?"에 답합니다
- ACP는 "acpx가 어떤 외부 harness 프로세스를 실행해야 하는가?"에 답합니다

## 올바른 모델 접두사 선택

OpenAI 계열 경로는 접두사에 따라 달라집니다. PI를 통한
Codex OAuth를 원하면 `openai-codex/*`를 사용하고, 직접 OpenAI API 액세스가
필요하거나 네이티브 Codex app-server harness를 강제하려면 `openai/*`를 사용하세요:

| 모델 참조                                     | 런타임 경로                                 | 사용 시점                                                                |
| --------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`                              | OpenClaw/PI 경로를 통한 OpenAI provider     | `OPENAI_API_KEY`로 현재 직접 OpenAI Platform API 액세스를 원할 때       |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI를 통한 OpenAI Codex OAuth       | 기본 PI 실행기로 ChatGPT/Codex subscription 인증을 원할 때              |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                    | 내장 에이전트 턴에 네이티브 Codex app-server 실행을 원할 때             |

GPT-5.5는 현재 OpenClaw에서 subscription/OAuth 전용입니다.
PI OAuth에는 `openai-codex/gpt-5.5`를 사용하거나, Codex
app-server harness에는 `agentRuntime.id: "codex"`와 함께 `openai/gpt-5.5`를 사용하세요.
`openai/gpt-5.5`에 대한 직접 API 키 액세스는 OpenAI가 GPT-5.5를
공개 API에서 활성화하면 지원됩니다.

레거시 `codex/gpt-*` 참조는 여전히 호환성 별칭으로 허용됩니다. Doctor
호환성 마이그레이션은 레거시 기본 런타임 참조를 정규 모델 참조로 다시 쓰고
런타임 정책은 별도로 기록하며, fallback 전용 레거시 참조는 런타임이
전체 에이전트 컨테이너에 대해 구성되므로 변경하지 않습니다.
새로운 PI Codex OAuth 구성은 `openai-codex/gpt-*`를 사용해야 하며, 새로운 네이티브
app-server harness 구성은 `openai/gpt-*`와
`agentRuntime.id: "codex"`를 함께 사용해야 합니다.

`agents.defaults.imageModel`도 같은 접두사 구분을 따릅니다.
이미지 이해를 OpenAI Codex OAuth provider 경로로 실행하려면
`openai-codex/gpt-*`를 사용하세요. 이미지 이해를
제한된 Codex app-server 턴으로 실행하려면 `codex/gpt-*`를 사용하세요. Codex
app-server 모델은 이미지 입력 지원을 광고해야 하며, 텍스트 전용 Codex 모델은
미디어 턴이 시작되기 전에 실패합니다.

현재 세션의 유효 harness를 확인하려면 `/status`를 사용하세요. 선택이
예상과 다르다면 `agents/harness` 서브시스템에 대해 debug logging을 활성화하고
Gateway의 구조화된 `agent harness selected` 레코드를 확인하세요. 여기에는
선택된 harness ID, 선택 이유, 런타임/fallback 정책, 그리고 `auto` 모드에서는
각 Plugin 후보의 지원 결과가 포함됩니다.

### doctor 경고의 의미

`openclaw doctor`는 다음이 모두 참일 때 경고합니다:

- 번들 `codex` Plugin이 활성화되어 있거나 허용됨
- 에이전트의 기본 모델이 `openai-codex/*`
- 해당 에이전트의 유효 런타임이 `codex`가 아님

이 경고가 존재하는 이유는 사용자가 종종 "Codex Plugin 활성화"를
"네이티브 Codex app-server 런타임"으로 기대하기 때문입니다. OpenClaw는
그렇게 자동 전환하지 않습니다. 이 경고의 의미는 다음과 같습니다:

- PI를 통한 ChatGPT/Codex OAuth를 의도한 경우에는 **아무 변경도 필요하지 않습니다**.
- 네이티브 app-server 실행을 의도했다면 모델을 `openai/<model>`로 바꾸고
  `agentRuntime.id: "codex"`를 설정하세요.
- 런타임 변경 후에도 기존 세션은 여전히 `/new` 또는 `/reset`이 필요합니다.
  세션 런타임 고정은 유지되기 때문입니다.

Harness 선택은 실시간 세션 제어가 아닙니다. 내장 턴이 실행되면,
OpenClaw는 해당 세션의 선택된 harness ID를 기록하고 같은 세션 ID의
이후 턴에서도 계속 이를 사용합니다. 미래 세션이 다른 harness를 사용하게 하려면
`agentRuntime` 구성 또는 `OPENCLAW_AGENT_RUNTIME`을 변경하고,
기존 대화를 PI와 Codex 사이에서 전환하기 전에는 `/new` 또는 `/reset`으로
새 세션을 시작하세요. 이렇게 하면 하나의 transcript를 호환되지 않는 두
네이티브 세션 시스템으로 다시 재생하는 일을 피할 수 있습니다.

Harness pin이 도입되기 전에 생성된 레거시 세션은 transcript 기록이 있으면
PI 고정으로 취급됩니다. 구성 변경 후 해당 대화를 Codex로 전환하려면
`/new` 또는 `/reset`을 사용하세요.

`/status`는 유효 모델 런타임을 표시합니다. 기본 PI harness는
`Runtime: OpenClaw Pi Default`로 표시되고, Codex app-server harness는
`Runtime: OpenAI Codex`로 표시됩니다.

## 요구 사항

- 번들 `codex` Plugin을 사용할 수 있는 OpenClaw.
- Codex app-server `0.125.0` 이상. 번들 Plugin은 기본적으로 호환되는
  Codex app-server 바이너리를 관리하므로, `PATH`에 있는 로컬 `codex`
  명령은 일반적인 harness 시작에 영향을 주지 않습니다.
- app-server 프로세스에서 사용할 수 있는 Codex 인증.

이 Plugin은 더 오래되었거나 버전이 없는 app-server 핸드셰이크를 차단합니다.
이렇게 하여 OpenClaw가 검증된 프로토콜 표면에서만 동작하도록 합니다.

live 및 Docker smoke 테스트에서는 인증이 보통 `OPENAI_API_KEY`와,
선택적 Codex CLI 파일(`~/.codex/auth.json`,
`~/.codex/config.toml`)에서 제공됩니다. 로컬 Codex app-server가
사용하는 것과 동일한 인증 자료를 사용하세요.

## 최소 구성

`openai/gpt-5.5`를 사용하고, 번들 Plugin을 활성화하고, `codex` harness를 강제합니다:

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

구성에서 `plugins.allow`를 사용한다면 거기에도 `codex`를 포함하세요:

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

`agents.defaults.model` 또는 에이전트 모델을
`codex/<model>`로 설정하는 레거시 구성은 여전히 번들 `codex` Plugin을 자동 활성화합니다. 새 구성은
위의 명시적 `agentRuntime` 항목과 함께 `openai/<model>`을 우선해야 합니다.

## 다른 모델과 함께 Codex 추가하기

같은 에이전트가 Codex와 Codex가 아닌 provider 모델 사이를 자유롭게 전환해야 한다면
전역적으로 `agentRuntime.id: "codex"`를 설정하지 마세요. 강제된 런타임은
해당 에이전트 또는 세션의 모든 내장 턴에 적용됩니다. 해당 런타임이 강제된 상태에서
Anthropic 모델을 선택하면, OpenClaw는 여전히 Codex harness를 시도하고
해당 턴을 PI로 조용히 라우팅하지 않고 안전하게 실패합니다.

대신 다음 형태 중 하나를 사용하세요:

- `agentRuntime.id: "codex"`를 사용해 전용 에이전트에 Codex를 배치하세요.
- 기본 에이전트는 `agentRuntime.id: "auto"`와 PI fallback으로 유지해 일반적인 혼합 provider 사용을 지원하세요.
- 레거시 `codex/*` 참조는 호환성 용도로만 사용하세요. 새 구성은
  `openai/*`와 명시적인 Codex 런타임 정책을 우선해야 합니다.

예를 들어 다음 구성은 기본 에이전트를 일반 자동 선택에 두고,
별도의 Codex 에이전트를 추가합니다:

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

이 구성에서는:

- 기본 `main` 에이전트가 일반 provider 경로와 PI 호환 fallback을 사용합니다.
- `codex` 에이전트는 Codex app-server harness를 사용합니다.
- `codex` 에이전트에 대해 Codex가 없거나 지원되지 않으면, 조용히 PI를 사용하는 대신 해당 턴이 실패합니다.

## 에이전트 명령 라우팅

에이전트는 "Codex"라는 단어 하나만으로가 아니라 사용자 의도에 따라 요청을 라우팅해야 합니다:

| 사용자가 요청하는 것...                                | 에이전트가 사용해야 하는 것...                    |
| ------------------------------------------------------ | ------------------------------------------------ |
| "이 채팅을 Codex에 바인딩해 줘"                        | `/codex bind`                                    |
| "여기에서 Codex thread `<id>`를 다시 이어 줘"          | `/codex resume <id>`                             |
| "Codex thread를 보여 줘"                               | `/codex threads`                                 |
| "이 에이전트의 런타임으로 Codex를 사용해 줘"           | `agentRuntime.id`에 대한 구성 변경               |
| "일반 OpenClaw에서 내 ChatGPT/Codex 구독을 사용해 줘"  | `openai-codex/*` 모델 참조                       |
| "ACP/acpx를 통해 Codex를 실행해 줘"                    | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "thread에서 Claude Code/Gemini/OpenCode/Cursor를 시작해 줘" | ACP/acpx, `/codex`도 아니고 네이티브 sub-agent도 아님 |

OpenClaw는 ACP가 활성화되어 있고, 디스패치 가능하며, 로드된 런타임 백엔드로
지원되는 경우에만 ACP spawn 가이드를 에이전트에 광고합니다. ACP를 사용할 수 없는 경우,
시스템 프롬프트와 Plugin Skills는 에이전트에게 ACP
라우팅을 알려주지 않아야 합니다.

## Codex 전용 배포

모든 내장 에이전트 턴이 반드시 Codex를 사용함을 보장해야 할 때는
Codex harness를 강제하세요. 명시적 Plugin 런타임은 기본적으로 PI fallback이 없으므로
`fallback: "none"`은 선택 사항이지만, 종종 문서화 용도로 유용합니다:

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

환경 변수 재정의:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex가 강제된 경우, Codex Plugin이 비활성화되어 있거나,
app-server가 너무 오래되었거나, app-server를 시작할 수 없으면 OpenClaw는
초기에 실패합니다. harness 선택 누락 시 PI가 처리하도록 의도적으로 허용하려는 경우에만
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`를 설정하세요.

## 에이전트별 Codex

하나의 에이전트만 Codex 전용으로 만들고 기본 에이전트는 일반
auto-selection을 유지할 수 있습니다:

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
OpenClaw 세션을 생성하고, Codex harness는 필요에 따라 sidecar app-server
thread를 생성하거나 재개합니다. `/reset`은 해당 thread에 대한 OpenClaw 세션 바인딩을
지우고, 다음 턴에서 현재 구성으로부터 harness를 다시 해석하게 합니다.

## 모델 검색

기본적으로 Codex Plugin은 app-server에 사용 가능한 모델을 요청합니다. 검색이
실패하거나 타임아웃되면 다음에 대한 번들 fallback catalog를 사용합니다:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

`plugins.entries.codex.config.discovery` 아래에서 검색을 조정할 수 있습니다:

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

시작 시 Codex probe를 피하고 fallback catalog만 고정적으로 사용하려면 검색을 비활성화하세요:

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

## App-server 연결 및 정책

기본적으로 Plugin은 OpenClaw가 관리하는 로컬 Codex 바이너리를 다음과 같이 시작합니다:

```bash
codex app-server --listen stdio://
```

관리되는 바이너리는 번들 Plugin 런타임 의존성으로 선언되어 있으며
`codex` Plugin 의존성과 함께 준비됩니다. 이렇게 하면 app-server
버전이 로컬에 별도로 설치된 Codex CLI가 아니라 번들 Plugin에 묶이게 됩니다.
다른 실행 파일을 의도적으로 실행하려는 경우에만 `appServer.command`를 설정하세요.

기본적으로 OpenClaw는 로컬 Codex harness 세션을 YOLO 모드로 시작합니다:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`,
`sandbox: "danger-full-access"`. 이는 자율 Heartbeat에 사용되는 신뢰된 로컬 운영자 상태입니다.
즉, Codex는 셸과 네트워크 도구를 사용할 수 있으며, 응답할 사람이 없는
네이티브 승인 프롬프트에서 멈추지 않습니다.

Codex guardian-reviewed 승인을 선택하려면 `appServer.mode:
"guardian"`을 설정하세요:

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

guardian 모드는 Codex의 네이티브 auto-review 승인 경로를 사용합니다. Codex가
샌드박스를 벗어나거나, 워크스페이스 밖에 쓰기를 하거나, 네트워크 액세스 같은 권한을
추가하려고 요청하면, Codex는 해당 승인 요청을 사람 프롬프트가 아니라 네이티브 reviewer로 보냅니다.
reviewer는 Codex의 위험 프레임워크를 적용해 해당 요청을 승인하거나 거부합니다.
YOLO 모드보다 더 많은 가드레일이 필요하지만 무인 에이전트가 계속 진행해야 한다면 Guardian을 사용하세요.

`guardian` preset은 `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, `sandbox: "workspace-write"`로 확장됩니다.
개별 정책 필드는 여전히 `mode`를 재정의하므로, 고급 배포에서는
preset과 명시적 선택을 섞을 수 있습니다. 이전의 `guardian_subagent` reviewer 값도
호환성 별칭으로 계속 허용되지만, 새 구성은 `auto_review`를 사용해야 합니다.

이미 실행 중인 app-server를 사용하려면 WebSocket 전송을 사용하세요:

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

지원되는 `appServer` 필드:

| 필드                | 기본값                                   | 의미                                                                                                        |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"`는 Codex를 실행하고, `"websocket"`은 `url`에 연결합니다.                                          |
| `command`           | 관리되는 Codex 바이너리                  | stdio 전송용 실행 파일입니다. 관리되는 바이너리를 사용하려면 비워 두고, 명시적 재정의가 필요한 경우에만 설정하세요. |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 전송용 인수입니다.                                                                                   |
| `url`               | unset                                    | WebSocket app-server URL입니다.                                                                            |
| `authToken`         | unset                                    | WebSocket 전송용 Bearer token입니다.                                                                       |
| `headers`           | `{}`                                     | 추가 WebSocket 헤더입니다.                                                                                 |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane 호출의 타임아웃입니다.                                                            |
| `mode`              | `"yolo"`                                 | YOLO 또는 guardian-reviewed 실행을 위한 preset입니다.                                                      |
| `approvalPolicy`    | `"never"`                                | thread 시작/재개/턴에 전달되는 네이티브 Codex 승인 정책입니다.                                            |
| `sandbox`           | `"danger-full-access"`                   | thread 시작/재개에 전달되는 네이티브 Codex 샌드박스 모드입니다.                                           |
| `approvalsReviewer` | `"user"`                                 | 네이티브 승인 프롬프트를 Codex가 검토하게 하려면 `"auto_review"`를 사용하세요. `guardian_subagent`는 레거시 별칭으로 유지됩니다. |
| `serviceTier`       | unset                                    | 선택적 Codex app-server service tier: `"fast"`, `"flex"`, 또는 `null`. 유효하지 않은 레거시 값은 무시됩니다. |

로컬 테스트용 환경 변수 재정의도 계속 사용할 수 있습니다:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`은
`appServer.command`가 설정되지 않았을 때 관리되는 바이너리를 우회합니다.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`은 제거되었습니다.
대신 `plugins.entries.codex.config.appServer.mode: "guardian"`을 사용하거나,
일회성 로컬 테스트에는 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`를 사용하세요. 반복 가능한 배포에는
Codex harness 설정의 나머지와 같은 검토된 파일 안에 Plugin 동작을 유지할 수 있으므로
구성이 권장됩니다.

## 일반적인 예시

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

Codex 전용 harness 검증:

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

Guardian-reviewed Codex 승인:

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

명시적 헤더를 사용하는 원격 app-server:

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

모델 전환은 계속 OpenClaw가 제어합니다. OpenClaw 세션이 기존 Codex thread에 연결되어 있을 때,
다음 턴은 현재 선택된 OpenAI 모델, provider, 승인 정책, 샌드박스, service tier를
다시 app-server로 보냅니다. `openai/gpt-5.5`에서 `openai/gpt-5.2`로 전환해도
thread 바인딩은 유지되지만, Codex가 새로 선택된 모델로 계속 진행하도록 요청합니다.

## Codex 명령

번들 Plugin은 `/codex`를 권한이 필요한 슬래시 명령으로 등록합니다. 이 명령은
범용적이며 OpenClaw 텍스트 명령을 지원하는 모든 채널에서 작동합니다.

일반적인 형식:

- `/codex status`는 라이브 app-server 연결 상태, 모델, 계정, rate limit, MCP 서버, Skills를 보여줍니다.
- `/codex models`는 라이브 Codex app-server 모델을 나열합니다.
- `/codex threads [filter]`는 최근 Codex thread를 나열합니다.
- `/codex resume <thread-id>`는 현재 OpenClaw 세션을 기존 Codex thread에 연결합니다.
- `/codex compact`는 Codex app-server에 연결된 thread를 Compaction하도록 요청합니다.
- `/codex review`는 연결된 thread에 대해 Codex 네이티브 review를 시작합니다.
- `/codex account`는 계정 및 rate-limit 상태를 보여줍니다.
- `/codex mcp`는 Codex app-server MCP 서버 상태를 나열합니다.
- `/codex skills`는 Codex app-server Skills를 나열합니다.

`/codex resume`는 harness가 일반 턴에 사용하는 것과 동일한 sidecar 바인딩 파일을
기록합니다. 다음 메시지에서 OpenClaw는 해당 Codex thread를 재개하고, 현재 선택된
OpenClaw 모델을 app-server에 전달하며, 확장 히스토리를 계속 활성화된 상태로 유지합니다.

이 명령 표면은 Codex app-server `0.125.0` 이상이 필요합니다. 향후 또는 사용자 지정 app-server가 해당 JSON-RPC 메서드를 노출하지 않으면
개별 제어 메서드는 `unsupported by this Codex app-server`로 보고됩니다.

## Hook 경계

Codex harness에는 세 가지 hook 계층이 있습니다:

| 계층                                  | 소유자                   | 목적                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| OpenClaw Plugin hooks                 | OpenClaw                 | PI와 Codex harness 전반의 제품/Plugin 호환성                      |
| Codex app-server 확장 middleware      | OpenClaw 번들 Plugin     | OpenClaw 동적 도구 주변의 턴별 어댑터 동작                        |
| Codex 네이티브 hooks                  | Codex                    | Codex 구성에서 오는 저수준 Codex 수명 주기 및 네이티브 도구 정책 |

OpenClaw는 OpenClaw Plugin 동작을 라우팅하기 위해 프로젝트 또는 전역
Codex `hooks.json` 파일을 사용하지 않습니다. 지원되는 네이티브 도구 및 권한 브리지에 대해서는,
OpenClaw가 `PreToolUse`, `PostToolUse`,
`PermissionRequest`, `Stop`에 대한 thread별 Codex 구성을 주입합니다.
`SessionStart`, `UserPromptSubmit` 같은 다른 Codex hook은 계속 Codex 수준 제어이며,
v1 계약에서는 OpenClaw Plugin hook으로 노출되지 않습니다.

OpenClaw 동적 도구의 경우, Codex가 호출을 요청한 뒤에 OpenClaw가 도구를 실행하므로
OpenClaw는 harness 어댑터에서 자신이 소유한 Plugin 및 middleware 동작을
실행합니다. Codex 네이티브 도구의 경우, 정규 도구 레코드는 Codex가 소유합니다.
OpenClaw는 선택된 이벤트를 미러링할 수는 있지만, Codex가 app-server나 네이티브 hook
callback을 통해 해당 작업을 노출하지 않는 한 네이티브 Codex
thread를 다시 쓸 수는 없습니다.

Compaction 및 LLM 수명 주기 투영은 네이티브 Codex hook 명령이 아니라 Codex app-server
알림과 OpenClaw 어댑터 상태에서 나옵니다.
OpenClaw의 `before_compaction`, `after_compaction`, `llm_input`,
`llm_output` 이벤트는 어댑터 수준의 관찰이며, Codex 내부 요청이나 Compaction
페이로드의 byte-for-byte 캡처가 아닙니다.

Codex 네이티브 `hook/started` 및 `hook/completed` app-server 알림은
trajectory 및 디버깅을 위한 `codex_app_server.hook` 에이전트 이벤트로 투영됩니다.
이들은 OpenClaw Plugin hook을 호출하지 않습니다.

## V1 지원 계약

Codex 모드는 내부적으로 다른 모델 호출을 사용하는 PI가 아닙니다. Codex는
네이티브 모델 루프를 더 많이 소유하고, OpenClaw는 그 경계를 기준으로
Plugin 및 세션 표면을 조정합니다.

Codex 런타임 v1에서 지원되는 항목:

| 표면                                         | 지원 상태                             | 이유                                                                                                                                                                                                      |
| -------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex를 통한 OpenAI 모델 루프                | 지원됨                                | Codex app-server가 OpenAI 턴, 네이티브 thread 재개, 네이티브 도구 연속성을 담당합니다.                                                                                                                   |
| OpenClaw 채널 라우팅 및 전달                 | 지원됨                                | Telegram, Discord, Slack, WhatsApp, iMessage 등 다른 채널은 모델 런타임 바깥에 남습니다.                                                                                                                 |
| OpenClaw 동적 도구                           | 지원됨                                | Codex가 OpenClaw에 이 도구 실행을 요청하므로, OpenClaw는 계속 실행 경로 안에 남습니다.                                                                                                                   |
| 프롬프트 및 컨텍스트 Plugin                  | 지원됨                                | OpenClaw는 thread를 시작하거나 재개하기 전에 프롬프트 오버레이를 만들고 컨텍스트를 Codex 턴에 투영합니다.                                                                                                |
| 컨텍스트 엔진 수명 주기                      | 지원됨                                | assemble, ingest 또는 턴 후 유지보수, 그리고 컨텍스트 엔진 Compaction 조정이 Codex 턴에 대해 실행됩니다.                                                                                                 |
| 동적 도구 hook                               | 지원됨                                | `before_tool_call`, `after_tool_call`, tool-result middleware가 OpenClaw 소유의 동적 도구 주변에서 실행됩니다.                                                                                           |
| 수명 주기 hook                               | 어댑터 관찰로 지원됨                  | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, `after_compaction`이 정직한 Codex 모드 페이로드로 실행됩니다.                                                                              |
| 최종 답변 수정 게이트                        | 네이티브 hook relay를 통해 지원됨     | Codex `Stop`은 `before_agent_finalize`로 relay되며, `revise`는 최종화 전에 Codex에 한 번 더 모델 패스를 요청합니다.                                                                                      |
| 네이티브 셸, patch, MCP 차단 또는 관찰       | 네이티브 hook relay를 통해 지원됨     | Codex `PreToolUse` 및 `PostToolUse`는 Codex app-server `0.125.0` 이상에서 MCP 페이로드를 포함한 확정된 네이티브 도구 표면에 대해 relay됩니다. 차단은 지원되지만, 인수 재작성은 지원되지 않습니다. |
| 네이티브 권한 정책                           | 네이티브 hook relay를 통해 지원됨     | Codex `PermissionRequest`는 런타임이 노출하는 경우 OpenClaw 정책을 통해 라우팅될 수 있습니다. OpenClaw가 결정을 반환하지 않으면, Codex는 일반 guardian 또는 사용자 승인 경로로 계속 진행합니다.      |
| App-server trajectory 캡처                   | 지원됨                                | OpenClaw는 app-server에 보낸 요청과, app-server로부터 받은 알림을 기록합니다.                                                                                                                            |

Codex 런타임 v1에서 지원되지 않는 항목:

| 표면                                              | V1 경계                                                                                                                                         | 향후 경로                                                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 네이티브 도구 인수 변경                           | Codex 네이티브 pre-tool hook은 차단할 수는 있지만, OpenClaw는 Codex 네이티브 도구 인수를 다시 쓰지 않습니다.                                   | 대체 도구 입력을 위한 Codex hook/schema 지원 필요.                                          |
| 편집 가능한 Codex 네이티브 transcript 히스토리    | 정규 네이티브 thread 히스토리는 Codex가 소유합니다. OpenClaw는 미러를 소유하고 미래 컨텍스트를 투영할 수 있지만, 지원되지 않는 내부를 변경해서는 안 됩니다. | 네이티브 thread 조작이 필요하면 명시적인 Codex app-server API 추가.                        |
| Codex 네이티브 도구 레코드용 `tool_result_persist` | 이 hook은 Codex 네이티브 도구 레코드가 아니라 OpenClaw 소유 transcript 쓰기를 변환합니다.                                                      | 변환된 레코드를 미러링할 수는 있지만, 정규 재작성에는 Codex 지원이 필요합니다.              |
| 풍부한 네이티브 Compaction 메타데이터             | OpenClaw는 Compaction 시작과 완료는 관찰하지만, 안정적인 유지/삭제 목록, token delta, 요약 페이로드는 받지 못합니다.                           | 더 풍부한 Codex Compaction 이벤트 필요.                                                     |
| Compaction 개입                                   | 현재 OpenClaw Compaction hook은 Codex 모드에서 알림 수준입니다.                                                                                | Plugin이 네이티브 Compaction을 거부하거나 다시 쓰려면 Codex pre/post Compaction hook 추가. |
| byte-for-byte 모델 API 요청 캡처                  | OpenClaw는 app-server 요청과 알림은 캡처할 수 있지만, 최종 OpenAI API 요청은 Codex core가 내부적으로 생성합니다.                                | Codex 모델 요청 추적 이벤트 또는 debug API 필요.                                            |

## 도구, 미디어, Compaction

Codex harness는 저수준 내장 에이전트 실행기만 변경합니다.

OpenClaw는 여전히 도구 목록을 만들고 harness로부터 동적 도구 결과를 받습니다.
텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력은
계속 일반 OpenClaw 전달 경로를 통과합니다.

네이티브 hook relay는 의도적으로 범용적이지만, v1 지원 계약은
OpenClaw가 테스트한 Codex 네이티브 도구 및 권한 경로로 제한됩니다. Codex 런타임에서는
셸, patch, MCP `PreToolUse`,
`PostToolUse`, `PermissionRequest` 페이로드가 여기에 포함됩니다. 향후 모든
Codex hook 이벤트가 런타임 계약에서 이름이 명시되기 전까지는 OpenClaw Plugin 표면이라고
가정하지 마세요.

`PermissionRequest`의 경우, OpenClaw는 정책이 결정했을 때만 명시적인 allow 또는 deny 결정을
반환합니다. no-decision 결과는 allow가 아닙니다. Codex는 이를
hook 결정 없음으로 취급하고 자체 guardian 또는 사용자 승인 경로로 넘어갑니다.

Codex MCP 도구 승인 elicitation은 Codex가 `_meta.codex_approval_kind`를
`"mcp_tool_call"`로 표시할 때 OpenClaw의 Plugin
승인 흐름을 통해 라우팅됩니다. Codex `request_user_input` 프롬프트는
원래 채팅으로 다시 전송되며, 다음 대기 중인 후속 메시지는 추가 컨텍스트로 조정되는 대신
해당 네이티브 서버 요청에 대한 응답으로 사용됩니다. 다른 MCP elicitation
요청은 여전히 안전하게 실패합니다.

선택된 모델이 Codex harness를 사용할 때, 네이티브 thread Compaction은
Codex app-server에 위임됩니다. OpenClaw는 채널 히스토리,
검색, `/new`, `/reset`, 그리고 향후 모델 또는 harness 전환을 위해 transcript 미러를 유지합니다. 이
미러에는 사용자 프롬프트, 최종 어시스턴트 텍스트, 그리고 app-server가 이를 내보내는 경우의
경량 Codex 추론 또는 계획 레코드가 포함됩니다. 현재 OpenClaw는
네이티브 Compaction 시작 및 완료 신호만 기록합니다. 아직 사람이 읽을 수 있는
Compaction 요약이나, Compaction 후 Codex가 어떤 항목을 유지했는지에 대한
감사 가능한 목록은 노출하지 않습니다.

정규 네이티브 thread는 Codex가 소유하므로, `tool_result_persist`는 현재
Codex 네이티브 도구 결과 레코드를 다시 쓰지 않습니다. 이는
OpenClaw가 OpenClaw 소유 세션 transcript 도구 결과를 기록할 때만 적용됩니다.

미디어 생성에는 PI가 필요하지 않습니다. 이미지, 비디오, 음악, PDF, TTS, 미디어 이해는
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, `messages.tts` 같은
해당 provider/모델 설정을 계속 사용합니다.

## 문제 해결

**Codex가 일반 `/model` provider로 보이지 않음:** 새 구성에서는
정상입니다. `agentRuntime.id: "codex"`(또는 레거시 `codex/*` 참조)와 함께
`openai/gpt-*` 모델을 선택하고, `plugins.entries.codex.enabled`를 활성화한 뒤,
`plugins.allow`가 `codex`를 제외하고 있지 않은지 확인하세요.

**OpenClaw가 Codex 대신 PI를 사용함:** `agentRuntime.id: "auto"`는 여전히
어떤 Codex harness도 실행을 담당하지 않을 때 PI를 호환성 백엔드로 사용할 수 있습니다.
테스트 중에는 Codex 선택을 강제하려면 `agentRuntime.id: "codex"`를 설정하세요.
강제된 Codex 런타임은 이제
명시적으로 `agentRuntime.fallback: "pi"`를 설정하지 않는 한 PI로 fallback하지 않고 실패합니다.
Codex app-server가 선택되면,
해당 실패는 추가 fallback 구성 없이 직접 노출됩니다.

**app-server가 거부됨:** app-server 핸드셰이크가
버전 `0.125.0` 이상을 보고하도록 Codex를 업그레이드하세요. `0.125.0-alpha.2` 또는 `0.125.0+custom` 같은
동일 버전 prerelease 또는 빌드 접미사 버전은 거부됩니다.
OpenClaw가 테스트하는 프로토콜 하한선은 안정 버전 `0.125.0`이기 때문입니다.

**모델 검색이 느림:** `plugins.entries.codex.config.discovery.timeoutMs`를
낮추거나 검색을 비활성화하세요.

**WebSocket 전송이 즉시 실패함:** `appServer.url`, `authToken`,
그리고 원격 app-server가 동일한 Codex app-server 프로토콜 버전을 사용하는지 확인하세요.

**Codex가 아닌 모델이 PI를 사용함:** 해당 에이전트에 대해
`agentRuntime.id: "codex"`를 강제하지 않았거나 레거시
`codex/*` 참조를 선택하지 않았다면 이것은 정상입니다. 일반 `openai/gpt-*` 및 다른 provider 참조는
`auto` 모드에서 정상 provider 경로를 유지합니다. `agentRuntime.id: "codex"`를 강제하면,
해당 에이전트의 모든 내장 턴은 Codex가 지원하는 OpenAI 모델이어야 합니다.

## 관련 항목

- [에이전트 harness Plugin](/ko/plugins/sdk-agent-harness)
- [에이전트 런타임](/ko/concepts/agent-runtimes)
- [모델 provider](/ko/concepts/model-providers)
- [OpenAI provider](/ko/providers/openai)
- [상태](/ko/cli/status)
- [Plugin hooks](/ko/plugins/hooks)
- [구성 참조](/ko/gateway/configuration-reference)
- [테스트](/ko/help/testing-live#live-codex-app-server-harness-smoke)
